import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''
const FINNHUB = 'https://finnhub.io/api/v1'
const COINGECKO = 'https://api.coingecko.com/api/v3'
const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Mapping ticker → CoinGecko ID
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', AVAX: 'avalanche-2', DOT: 'polkadot',
  MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap', LTC: 'litecoin',
  DOGE: 'dogecoin', SHIB: 'shiba-inu', ATOM: 'cosmos',
}

// Indices boursiers (via Yahoo Finance — gratuit, pas de clé requise)
const STOCK_INDICES = [
  { symbol: '^FCHI', label: 'CAC 40' },
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'NASDAQ' },
]

// Cryptos affichées dans le widget indices
const CRYPTO_INDICES = ['BTC', 'ETH']

type PositionInput = { id: string; assetType: string; symbol: string; currency: string }

// Yahoo Finance — gratuit, supporte les indices majeurs
async function yahooQuote(symbol: string): Promise<{ price: number; changePct: number } | null> {
  try {
    const res = await fetch(
      `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        next: { revalidate: 60 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinCalc/1.0)' },
      }
    )
    if (!res.ok) return null
    const d = await res.json()
    const meta = d?.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return null
    const price: number = meta.regularMarketPrice
    const prev: number = meta.previousClose ?? meta.chartPreviousClose ?? price
    const changePct = prev > 0 ? ((price - prev) / prev) * 100 : 0
    return { price, changePct }
  } catch {
    return null
  }
}

// Finnhub — US stocks (plan gratuit)
async function finnhubQuote(symbol: string): Promise<{ price: number; changePct: number } | null> {
  try {
    const res = await fetch(
      `${FINNHUB}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const d = await res.json()
    if (!d.c || d.c === 0) return null
    return { price: d.c, changePct: d.dp ?? 0 }
  } catch {
    return null
  }
}

// Récupère le prix d'une position : Finnhub en priorité, Yahoo Finance en fallback
// (Yahoo supporte .PA, .AS, .DE, .MI, .MC... sans clé API)
async function getPositionPrice(symbol: string): Promise<{ price: number; changePct: number } | null> {
  const finnhub = await finnhubQuote(symbol)
  if (finnhub) return finnhub
  return yahooQuote(symbol)
}

// Taux USD→EUR via Yahoo Finance (fallback 0.92)
async function usdToEur(): Promise<number> {
  try {
    const res = await fetch(
      `${YAHOO}/EURUSD=X?interval=1d&range=1d`,
      { next: { revalidate: 3600 }, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FinCalc/1.0)' } }
    )
    if (!res.ok) return 0.92
    const d = await res.json()
    const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice
    return price ?? 0.92
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

// POST — récupère les prix pour les positions + les indices fixes du widget
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { positions }: { positions: PositionInput[] } = await req.json()

  const stockSymbols = positions.filter(p => p.assetType === 'STOCK' || p.assetType === 'ETF').map(p => p.symbol)
  const cryptoTickers = positions.filter(p => p.assetType === 'CRYPTO').map(p => p.symbol)
  const hasUsdPositions = positions.some(p => (p.assetType === 'STOCK' || p.assetType === 'ETF') && p.currency === 'USD')

  // Tous les cryptos nécessaires (positions + indices crypto)
  const allCryptoTickers = [...new Set([...cryptoTickers, ...CRYPTO_INDICES])]

  // Fetch en parallèle
  const [eurRate, cryptoPricesMap, ...restQuotes] = await Promise.all([
    hasUsdPositions ? usdToEur() : Promise.resolve(1),
    coinGeckoPrices(allCryptoTickers),
    // Positions stocks/ETFs → Finnhub + fallback Yahoo Finance (pour .PA, .AS, etc.)
    ...stockSymbols.map(s => getPositionPrice(s)),
    // Indices widget → Yahoo Finance (Finnhub free ne supporte pas les indices ^GSPC etc.)
    ...STOCK_INDICES.map(idx => yahooQuote(idx.symbol)),
  ])

  const stockQuotes = restQuotes.slice(0, stockSymbols.length) as ({ price: number; changePct: number } | null)[]
  const indiceQuotes = restQuotes.slice(stockSymbols.length) as ({ price: number; changePct: number } | null)[]

  // Map de prix par position
  const prices: Record<string, { priceEur: number; changePct: number }> = {}
  stockSymbols.forEach((symbol, i) => {
    const q = stockQuotes[i]
    if (!q) return
    const pos = positions.find(p => p.symbol === symbol)
    const isUsd = pos?.currency === 'USD'
    prices[symbol] = {
      priceEur: isUsd ? q.price * (eurRate as number) : q.price,
      changePct: q.changePct,
    }
  })
  const cryptoMap = cryptoPricesMap as Record<string, { price: number; changePct: number }>
  for (const [ticker, data] of Object.entries(cryptoMap)) {
    if (cryptoTickers.includes(ticker)) {
      prices[ticker] = { priceEur: data.price, changePct: data.changePct }
    }
  }

  // Indices boursiers (Yahoo Finance)
  const stockIndiceResults = STOCK_INDICES.map((idx, i) => {
    const q = indiceQuotes[i]
    return { label: idx.label, symbol: idx.symbol, price: q?.price ?? null, changePct: q?.changePct ?? 0 }
  })

  // Indices crypto (CoinGecko)
  const cryptoIndiceResults = CRYPTO_INDICES.map(ticker => {
    const d = cryptoMap[ticker]
    const labels: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum' }
    return { label: labels[ticker] ?? ticker, symbol: ticker, price: d?.price ?? null, changePct: d?.changePct ?? 0 }
  })

  return NextResponse.json({
    prices,
    indices: [
      ...stockIndiceResults,
      ...cryptoIndiceResults,
      { label: 'Livret A', symbol: 'LIVRET_A', price: 2.4, changePct: 0, isRate: true },
    ],
    eurRate,
  })
}
