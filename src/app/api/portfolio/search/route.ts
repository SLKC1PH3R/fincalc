import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

// Finnhub — résolution ISIN → profil
async function searchByIsin(isin: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `${FINNHUB}/stock/profile2?isin=${isin.toUpperCase()}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const d = await res.json()
    if (!d.ticker) return []
    return [{
      symbol: d.ticker,
      name: d.name ?? d.ticker,
      type: 'STOCK',
      isin: isin.toUpperCase(),
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
    if (isIsinLike(q)) return NextResponse.json(await searchByIsin(q))
    return NextResponse.json(await searchStocks(q))
  } catch {
    return NextResponse.json([])
  }
}
