import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { lookupByName } from '@/lib/etf-database'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''
const FINNHUB = 'https://finnhub.io/api/v1'
const COINGECKO = 'https://api.coingecko.com/api/v3'

type SearchResult = {
  symbol: string
  name: string
  type: 'ETF' | 'STOCK' | 'CRYPTO'
  isin?: string
}

// Détecte un code ISIN (2 lettres + 10 alphanumériques)
function isIsinLike(q: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{10}$/i.test(q.trim())
}

const YAHOO_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search'

// Résolution ISIN : Yahoo Finance en priorité (ticker exact = même source que les prix),
// puis Finnhub en fallback.
async function searchByIsin(isin: string): Promise<SearchResult[]> {
  const upper = isin.toUpperCase()

  // 1. Yahoo Finance search — retourne le ticker Yahoo qui sera utilisé pour les prix
  try {
    const res = await fetch(
      `${YAHOO_SEARCH}?q=${upper}&quotesCount=3&newsCount=0&enableFuzzyQuery=false`,
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Patrimo/1.0)' },
      }
    )
    if (res.ok) {
      const d = await res.json()
      const quotes: { symbol: string; longname?: string; shortname?: string; quoteType?: string }[] =
        d?.quotes ?? []
      if (quotes.length > 0) {
        const q = quotes[0]
        return [{
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          type: q.quoteType === 'ETF' ? 'ETF' : 'STOCK',
          isin: upper,
        }]
      }
    }
  } catch { /* fall through */ }

  // 2. Fallback Finnhub profile2
  try {
    const res = await fetch(
      `${FINNHUB}/stock/profile2?isin=${upper}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const d = await res.json()
    if (!d.ticker) return []
    return [{
      symbol: d.ticker,
      name: d.name ?? d.ticker,
      type: 'STOCK',
      isin: upper,
    }]
  } catch { return [] }
}

// Finnhub — recherche par nom / ticker (actions + ETFs)
async function searchStocks(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `${FINNHUB}/search?q=${encodeURIComponent(q)}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const data = await res.json()

    const ETF_TYPES = new Set(['ETP', 'ETF', 'Fund'])
    const STOCK_TYPES = new Set(['Common Stock', 'Depositary Receipt', 'ADR'])

    return (data.result ?? [])
      .filter((r: { type: string }) => ETF_TYPES.has(r.type) || STOCK_TYPES.has(r.type))
      .slice(0, 8)
      .map((r: { symbol: string; description: string; type: string; isin?: string }) => ({
        symbol: r.symbol,
        name: r.description,
        type: ETF_TYPES.has(r.type) ? 'ETF' : 'STOCK',
        isin: r.isin || undefined,
      }))
  } catch { return [] }
}

// CoinGecko — recherche crypto par nom / ticker
async function searchCrypto(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `${COINGECKO}/search?query=${encodeURIComponent(q)}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.coins ?? [])
      .slice(0, 8)
      .map((c: { symbol: string; name: string }) => ({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        type: 'CRYPTO' as const,
      }))
  } catch { return [] }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? 'stock' // 'stock' | 'crypto'

  if (q.length < 1) return NextResponse.json([])

  try {
    if (type === 'crypto') return NextResponse.json(await searchCrypto(q))

    if (type === 'stock') {
      const localResults = lookupByName(q).map(e => ({
        symbol: e.ticker, name: e.name, type: 'ETF' as const, isin: e.isin,
      }))
      if (isIsinLike(q)) {
        const isinResults = await searchByIsin(q)
        const merged = [...isinResults, ...localResults.filter(r => r.isin !== q.toUpperCase())]
        return NextResponse.json(merged.slice(0, 10))
      }
      const [finnhubResults] = await Promise.all([searchStocks(q)])
      const seen = new Set(localResults.map(r => r.symbol))
      const merged = [...localResults, ...finnhubResults.filter(r => !seen.has(r.symbol))]
      return NextResponse.json(merged.slice(0, 10))
    }

    // fallback: legacy path (ISIN detection + stock search)
    if (isIsinLike(q)) return NextResponse.json(await searchByIsin(q))
    return NextResponse.json(await searchStocks(q))
  } catch {
    return NextResponse.json([])
  }
}
