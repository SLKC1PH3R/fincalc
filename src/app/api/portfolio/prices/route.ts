import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''
const FINNHUB = 'https://finnhub.io/api/v1'
const COINGECKO = 'https://api.coingecko.com/api/v3'

// Mapping ticker → CoinGecko ID
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', AVAX: 'avalanche-2', DOT: 'polkadot',
  MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap', LTC: 'litecoin',
  DOGE: 'dogecoin', SHIB: 'shiba-inu', ATOM: 'cosmos',
}

// Indices fixes à fetcher
const INDICES = [
  { symbol: '^FCHI', label: 'CAC 40' },
  { symbol: '^GSPC', label: 'S&P 500' },
]

type PositionInput = { id: string; assetType: string; symbol: string; currency: string }

async function finnhubQuote(symbol: string): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const res = await fetch(`${FINNHUB}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const d = await res.json()
    if (!d.c || d.c === 0) return null
    return {
      price: d.c,
      change: d.d ?? 0,
      changePct: d.dp ?? 0,
    }
  } catch {
    return null
  }
}

async function usdToEur(): Promise<number> {
  try {
    const res = await fetch(`${FINNHUB}/forex/rates?base=USD&token=${FINNHUB_KEY}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 0.92
    const d = await res.json()
    return d.quote?.EUR ?? 0.92
  } catch {
    return 0.92
  }
}

async function coinGeckoPrices(tickers: string[]): Promise<Record<string, { price: number; changePct: number }>> {
  const ids = tickers.map(t => COINGECKO_IDS[t]).filter(Boolean)
  if (!ids.length) return {}
  try {
    const res = await fetch(
      `${COINGECKO}/simple/price?ids=${ids.join(',')}&vs_currencies=eur&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return {}
    const d = await res.json()
    const result: Record<string, { price: number; changePct: number }> = {}
    for (const ticker of tickers) {
      const id = COINGECKO_IDS[ticker]
      if (id && d[id]) {
        result[ticker] = { price: d[id].eur, changePct: d[id].eur_24h_change ?? 0 }
      }
    }
    return result
  } catch {
    return {}
  }
}

// POST — récupère les prix pour une liste de positions + indices
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { positions }: { positions: PositionInput[] } = await req.json()

  const stockSymbols = positions.filter(p => p.assetType === 'STOCK' || p.assetType === 'ETF').map(p => p.symbol)
  const cryptoTickers = positions.filter(p => p.assetType === 'CRYPTO').map(p => p.symbol)

  // USD→EUR si des stocks en USD existent
  const hasUsdPositions = positions.some(p => (p.assetType === 'STOCK' || p.assetType === 'ETF') && p.currency === 'USD')
  const [eurRate, cryptoPrices, ...stockQuotes] = await Promise.all([
    hasUsdPositions ? usdToEur() : Promise.resolve(1),
    cryptoTickers.length ? coinGeckoPrices(cryptoTickers) : Promise.resolve({}),
    ...stockSymbols.map(s => finnhubQuote(s)),
    // Indices (toujours fetchés)
    ...INDICES.map(idx => finnhubQuote(idx.symbol).then(q => ({ idx, q }))),
  ])

  // Reconstruction des indices (derniers éléments du Promise.all)
  // On re-fetch les indices séparément car Promise.all mélange stock + indices
  const [indiceResults] = await Promise.all([
    Promise.all(INDICES.map(async idx => {
      const q = await finnhubQuote(idx.symbol)
      return { label: idx.label, symbol: idx.symbol, ...q }
    })),
  ])

  // Bitcoin index via CoinGecko
  const btcPrices = await coinGeckoPrices(['BTC'])
  const btcIndex = { label: 'Bitcoin', symbol: 'BTC', price: btcPrices.BTC?.price ?? null, changePct: btcPrices.BTC?.changePct ?? 0 }

  // Construire la map de prix par position
  const prices: Record<string, { priceEur: number; changePct: number }> = {}
  stockSymbols.forEach((symbol, i) => {
    const q = stockQuotes[i] as { price: number; change: number; changePct: number } | null
    if (!q) return
    const pos = positions.find(p => p.symbol === symbol)
    const isUsd = pos?.currency === 'USD'
    prices[symbol] = {
      priceEur: isUsd ? q.price * (eurRate as number) : q.price,
      changePct: q.changePct,
    }
  })
  for (const [ticker, data] of Object.entries(cryptoPrices as Record<string, { price: number; changePct: number }>)) {
    prices[ticker] = { priceEur: data.price, changePct: data.changePct }
  }

  return NextResponse.json({
    prices,
    indices: [
      ...indiceResults,
      btcIndex,
      { label: 'Livret A', symbol: 'LIVRET_A', price: 3, changePct: 0, isRate: true },
    ],
    eurRate,
  })
}
