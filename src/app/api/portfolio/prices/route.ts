import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''
const FINNHUB = 'https://finnhub.io/api/v1'
const COINGECKO = 'https://api.coingecko.com/api/v3'
const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart'

// Mapping ticker → CoinGecko ID (top cryptos + fallback vers ticker.toLowerCase())
const COINGECKO_IDS: Record<string, string> = {
  // Top market cap
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', USDT: 'tether', USDC: 'usd-coin', STETH: 'staked-ether',
  ADA: 'cardano', AVAX: 'avalanche-2', DOGE: 'dogecoin', TRX: 'tron',
  TON: 'the-open-network', SHIB: 'shiba-inu', DOT: 'polkadot',
  LINK: 'chainlink', BCH: 'bitcoin-cash', NEAR: 'near',
  UNI: 'uniswap', LTC: 'litecoin', APT: 'aptos', SUI: 'sui',
  // Layer 2 & scaling
  MATIC: 'matic-network', OP: 'optimism', ARB: 'arbitrum',
  IMX: 'immutable-x', STRK: 'starknet', BLAST: 'blast',
  ZK: 'zksync', MANTA: 'manta-network', METIS: 'metis-token',
  // DeFi
  AAVE: 'aave', MKR: 'maker', CRV: 'curve-dao-token', SNX: 'synthetix-network-token',
  COMP: 'compound-governance-token', YFI: 'yearn-finance',
  BAL: 'balancer', SUSHI: 'sushi', '1INCH': '1inch',
  PENDLE: 'pendle', MORPHO: 'morpho', ENA: 'ethena',
  LDO: 'lido-dao', RPL: 'rocket-pool', FXS: 'frax-share',
  // Infrastructure & Oracle
  ATOM: 'cosmos', ALGO: 'algorand', HBAR: 'hedera-hashgraph',
  FIL: 'filecoin', ICP: 'internet-computer', VET: 'vechain',
  PYTH: 'pyth-network', JTO: 'jito-governance-token', W: 'wormhole',
  // Exchanges
  OKB: 'okb', CRO: 'crypto-com-chain', FTT: 'ftx-token', KCS: 'kucoin-token',
  // Gaming & NFT
  SAND: 'the-sandbox', MANA: 'decentraland', AXS: 'axie-infinity',
  APE: 'apecoin', BLUR: 'blur', LOOKS: 'looksrare',
  // Newer trends
  PEPE: 'pepe', WIF: 'dogwifcoin', BONK: 'bonk', FLOKI: 'floki',
  BOME: 'book-of-meme', WEN: 'wen-4', MEW: 'cat-in-a-dogs-world',
  // Chains
  SEI: 'sei-network', INJ: 'injective-protocol', TIA: 'celestia',
  FTM: 'fantom', CELO: 'celo', KAVA: 'kava', OSMO: 'osmosis',
  ZEC: 'zcash', XMR: 'monero', ETC: 'ethereum-classic',
  XTZ: 'tezos', FLOW: 'flow', EGLD: 'elrond-erd-2', AXL: 'axelar',
  ROSE: 'oasis-network', SCRT: 'secret', LUNA: 'terra-luna-2',
  // Other popular
  GRT: 'the-graph', FET: 'fetch-ai', OCEAN: 'ocean-protocol',
  RNDR: 'render-token', IO: 'io-net', WLD: 'worldcoin-org',
  MINA: 'mina-protocol', ENS: 'ethereum-name-service',
}

// Cache en mémoire pour les IDs résolus (persiste pendant la durée de vie du serveur)
const resolvedIds: Record<string, string> = {}

async function resolveCoingeckoId(ticker: string): Promise<string | null> {
  const cached = resolvedIds[ticker]
  if (cached) return cached
  try {
    const res = await fetch(
      `${COINGECKO}/search?query=${encodeURIComponent(ticker)}`,
      { next: { revalidate: 3600 } }  // cache 1h
    )
    if (!res.ok) return null
    const data = await res.json()
    const coins: { symbol: string; id: string; market_cap_rank?: number }[] = data.coins ?? []
    // Trouver le meilleur match : même symbole (exact), favoriser le rang de market cap
    const exact = coins.filter(c => c.symbol.toUpperCase() === ticker.toUpperCase())
    const best = exact.sort((a, b) => (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999))[0]
    if (best) {
      resolvedIds[ticker] = best.id
      return best.id
    }
    return null
  } catch {
    return null
  }
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

// Récupère le prix d'une position.
// Ordre : Finnhub (US) + Yahoo (symbole brut) en parallèle,
// puis si aucun résultat : tentative avec suffixes de places européennes courants.
async function getPositionPrice(symbol: string): Promise<{ price: number; changePct: number } | null> {
  // Si le symbole a déjà un suffixe d'exchange (.PA, .AS, …), aller direct sur Yahoo
  if (/\.(PA|AS|DE|L|MI|SW|MC|BR|LS|ST|HE|CO|OL|VI)$/i.test(symbol)) {
    return yahooQuote(symbol)
  }
  // Sinon : Finnhub (actions US) + Yahoo (sans suffixe) en parallèle
  const [finnhub, yahoo] = await Promise.all([finnhubQuote(symbol), yahooQuote(symbol)])
  if (finnhub) return finnhub
  if (yahoo) return yahoo
  // Fallback : essayer les places européennes courantes en parallèle
  const suffixes = ['.PA', '.AS', '.DE', '.L', '.MI', '.SW', '.MC']
  const results = await Promise.all(suffixes.map(s => yahooQuote(symbol + s)))
  return results.find(r => r !== null) ?? null
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
  if (!tickers.length) return {}

  const tickerToId: Record<string, string> = {}
  for (const t of tickers) {
    tickerToId[t] = COINGECKO_IDS[t] ?? t.toLowerCase()
  }
  const ids = [...new Set(Object.values(tickerToId))]

  let d: Record<string, { eur: number; eur_24h_change: number }> = {}
  try {
    const res = await fetch(
      `${COINGECKO}/simple/price?ids=${ids.join(',')}&vs_currencies=eur&include_24hr_change=true`,
      { next: { revalidate: 60 } }
    )
    if (res.ok) d = await res.json()
  } catch { return {} }

  const result: Record<string, { price: number; changePct: number }> = {}
  const unknownTickers: string[] = []

  for (const ticker of tickers) {
    const id = tickerToId[ticker]
    if (d[id]) {
      result[ticker] = { price: d[id].eur, changePct: d[id].eur_24h_change ?? 0 }
    } else {
      unknownTickers.push(ticker)
    }
  }

  // Pour les tickers sans résultat, essayer de résoudre via /search
  if (unknownTickers.length > 0) {
    const resolved = await Promise.all(
      unknownTickers.map(async t => {
        const id = await resolveCoingeckoId(t)
        return { ticker: t, id }
      })
    )
    const newIds = resolved.filter(r => r.id && !ids.includes(r.id!)).map(r => r.id!)
    if (newIds.length > 0) {
      try {
        const res2 = await fetch(
          `${COINGECKO}/simple/price?ids=${newIds.join(',')}&vs_currencies=eur&include_24hr_change=true`,
          { next: { revalidate: 60 } }
        )
        if (res2.ok) {
          const d2 = await res2.json()
          for (const { ticker, id } of resolved) {
            if (id && d2[id]) {
              result[ticker] = { price: d2[id].eur, changePct: d2[id].eur_24h_change ?? 0 }
            }
          }
        }
      } catch {}
    }
  }

  return result
}

type CustomIndex = { symbol: string; label: string; type: 'stock' | 'crypto' }

// POST — récupère les prix pour les positions + les indices fixes du widget + les indices custom
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { positions, customIndices = [] }: {
    positions: PositionInput[]
    customIndices?: CustomIndex[]
  } = await req.json()

  const stockSymbols = positions.filter(p => p.assetType === 'STOCK' || p.assetType === 'ETF').map(p => p.symbol)
  const cryptoTickers = positions.filter(p => p.assetType === 'CRYPTO').map(p => p.symbol)
  const hasUsdPositions = positions.some(p => (p.assetType === 'STOCK' || p.assetType === 'ETF') && p.currency === 'USD')

  // Indices custom
  const customStockIndices = customIndices.filter(c => c.type === 'stock')
  const customCryptoTickers = customIndices.filter(c => c.type === 'crypto').map(c => c.symbol)

  // Tous les cryptos nécessaires (positions + indices crypto fixes + custom)
  const allCryptoTickers = [...new Set([...cryptoTickers, ...CRYPTO_INDICES, ...customCryptoTickers])]

  // Fetch en parallèle
  const [eurRate, cryptoPricesMap, ...restQuotes] = await Promise.all([
    hasUsdPositions ? usdToEur() : Promise.resolve(1),
    coinGeckoPrices(allCryptoTickers),
    // Positions stocks/ETFs → Finnhub + fallback Yahoo Finance (pour .PA, .AS, etc.)
    ...stockSymbols.map(s => getPositionPrice(s)),
    // Indices fixes widget → Yahoo Finance
    ...STOCK_INDICES.map(idx => yahooQuote(idx.symbol)),
    // Indices custom stock → Yahoo Finance
    ...customStockIndices.map(c => yahooQuote(c.symbol)),
  ])

  const stockQuotes = restQuotes.slice(0, stockSymbols.length) as ({ price: number; changePct: number } | null)[]
  const indiceQuotes = restQuotes.slice(stockSymbols.length, stockSymbols.length + STOCK_INDICES.length) as ({ price: number; changePct: number } | null)[]
  const customStockQuotes = restQuotes.slice(stockSymbols.length + STOCK_INDICES.length) as ({ price: number; changePct: number } | null)[]

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

  // Indices boursiers fixes (Yahoo Finance)
  const stockIndiceResults = STOCK_INDICES.map((idx, i) => {
    const q = indiceQuotes[i]
    return { label: idx.label, symbol: idx.symbol, price: q?.price ?? null, changePct: q?.changePct ?? 0 }
  })

  // Indices crypto fixes (CoinGecko)
  const cryptoIndiceResults = CRYPTO_INDICES.map(ticker => {
    const d = cryptoMap[ticker]
    const labels: Record<string, string> = { BTC: 'Bitcoin', ETH: 'Ethereum' }
    return { label: labels[ticker] ?? ticker, symbol: ticker, price: d?.price ?? null, changePct: d?.changePct ?? 0 }
  })

  // Indices custom stock (Yahoo Finance)
  const customStockResults = customStockIndices.map((c, i) => {
    const q = customStockQuotes[i]
    return { label: c.label, symbol: c.symbol, price: q?.price ?? null, changePct: q?.changePct ?? 0 }
  })

  // Indices custom crypto (CoinGecko)
  const customCryptoResults = customIndices
    .filter(c => c.type === 'crypto')
    .map(c => {
      const d = cryptoMap[c.symbol]
      return { label: c.label, symbol: c.symbol, price: d?.price ?? null, changePct: d?.changePct ?? 0 }
    })

  return NextResponse.json({
    prices,
    indices: [
      ...stockIndiceResults,
      ...cryptoIndiceResults,
      { label: 'Livret A', symbol: 'LIVRET_A', price: 2.4, changePct: 0, isRate: true },
      ...customStockResults,
      ...customCryptoResults,
    ],
    eurRate,
  })
}
