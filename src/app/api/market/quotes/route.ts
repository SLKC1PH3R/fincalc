import { NextRequest, NextResponse } from 'next/server'

interface CacheEntry {
  data: QuoteResult[]
  ts: number
}

export interface QuoteResult {
  symbol: string
  price: number | null
  changePercent: number | null
  currency: string | null
  name: string | null
  marketCap: number | null
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { symbols: string[] }
    const { symbols } = body
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'symbols required' }, { status: 400 })
    }

    const key = [...symbols].sort().join(',')
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ data: cached.data, cached: true, updatedAt: cached.ts })
    }

    // Try Yahoo Finance v8 (more stable than v7)
    const symbolsStr = symbols.join(',')
    const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbolsStr)}&lang=fr&region=FR`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      // Fallback to v7
      const url2 = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}&lang=fr&region=FR`
      const res2 = await fetch(url2, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!res2.ok) throw new Error(`Yahoo returned ${res.status} / ${res2.status}`)
      const json2 = await res2.json()
      return buildResponse(json2, key)
    }

    const json = await res.json()
    return buildResponse(json, key)

  } catch (err) {
    console.error('[market/quotes]', err)
    return NextResponse.json({ error: 'fetch_failed', message: String(err) }, { status: 502 })
  }
}

function buildResponse(json: Record<string, unknown>, cacheKey: string) {
  const quotes = ((json as { quoteResponse?: { result?: Record<string, unknown>[] } }).quoteResponse?.result ?? [])

  const result: QuoteResult[] = quotes.map((q: Record<string, unknown>) => ({
    symbol: q.symbol as string,
    price: (q.regularMarketPrice as number) ?? null,
    changePercent: (q.regularMarketChangePercent as number) ?? null,
    currency: (q.currency as string) ?? null,
    name: ((q.shortName ?? q.longName) as string) ?? null,
    marketCap: (q.marketCap as number) ?? null,
  }))

  cache.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json({ data: result, cached: false, updatedAt: Date.now() })
}
