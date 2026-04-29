import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY

// Major tickers to keep from Finnhub's earnings feed
const MAJOR_TICKERS = new Set([
  'AAPL', 'MSFT', 'GOOG', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  'JPM', 'GS', 'MS', 'BAC', 'C', 'WFC', 'V', 'MA',
  'NFLX', 'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'ORCL', 'CRM',
  'DIS', 'BABA', 'JNJ', 'PFE', 'UNH', 'MRK', 'LLY',
  'WMT', 'PG', 'KO', 'MCD', 'SBUX', 'NKE', 'COST',
  'XOM', 'CVX', 'BP', 'SHEL',
  'MC.PA', 'OR.PA', 'TTE.PA', 'SAN.PA', 'BNP.PA', 'AI.PA',
  'ASML', 'SAP', 'SIE.DE', 'AIR.PA', 'CS.PA', 'ORA.PA',
])

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOG: 'Alphabet Inc.',
  GOOGL: 'Alphabet Inc.', AMZN: 'Amazon.com Inc.', META: 'Meta Platforms',
  NVDA: 'NVIDIA Corp.', TSLA: 'Tesla Inc.', JPM: 'JPMorgan Chase',
  GS: 'Goldman Sachs', MS: 'Morgan Stanley', BAC: 'Bank of America',
  C: 'Citigroup', WFC: 'Wells Fargo', V: 'Visa Inc.', MA: 'Mastercard',
  NFLX: 'Netflix Inc.', AMD: 'Advanced Micro Devices', INTC: 'Intel Corp.',
  QCOM: 'Qualcomm Inc.', AVGO: 'Broadcom Inc.', TXN: 'Texas Instruments',
  ORCL: 'Oracle Corp.', CRM: 'Salesforce Inc.', DIS: 'Walt Disney Co.',
  BABA: 'Alibaba Group', JNJ: 'Johnson & Johnson', PFE: 'Pfizer Inc.',
  UNH: 'UnitedHealth Group', MRK: 'Merck & Co.', LLY: 'Eli Lilly',
  WMT: 'Walmart Inc.', PG: 'Procter & Gamble', KO: 'Coca-Cola Co.',
  MCD: "McDonald's Corp.", SBUX: 'Starbucks Corp.', NKE: 'Nike Inc.',
  COST: 'Costco Wholesale', XOM: 'ExxonMobil Corp.', CVX: 'Chevron Corp.',
  'MC.PA': 'LVMH', 'OR.PA': "L'Oréal", 'TTE.PA': 'TotalEnergies',
  'SAN.PA': 'Sanofi', 'BNP.PA': 'BNP Paribas', 'AI.PA': 'Air Liquide',
  ASML: 'ASML Holding', SAP: 'SAP SE', 'AIR.PA': 'Airbus SE',
  'CS.PA': 'AXA SA', 'ORA.PA': 'Orange SA',
}

function getMarket(symbol: string): 'FR' | 'US' | 'EU' {
  if (symbol.endsWith('.PA') || symbol.endsWith('.FR')) return 'FR'
  if (symbol.endsWith('.DE') || symbol.endsWith('.NL') || symbol.endsWith('.IT')) return 'EU'
  if (symbol.endsWith('.AS') || symbol.endsWith('.MC')) return 'EU'
  return 'US'
}

function fmtRevenue(v: number | null | undefined): string | undefined {
  if (v == null) return undefined
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return `${v}`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const to = new Date(today.getTime() + 28 * 86400000).toISOString().split('T')[0]

  // Fetch earnings from Finnhub
  let earnings: Record<string, unknown>[] = []
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    earnings = (data.earningsCalendar || []) as Record<string, unknown>[]
  } catch {
    // Fall through with empty array — page will show computed data only
  }

  const earningEvents = earnings
    .filter((e) => MAJOR_TICKERS.has(e.symbol as string))
    .map((e) => {
      const sym = e.symbol as string
      return {
        id: `r-${sym}-${e.date}`,
        date: e.date as string,
        ticker: sym,
        name: COMPANY_NAMES[sym] || sym,
        market: getMarket(sym),
        category: 'resultats' as const,
        epsEst: typeof e.epsEstimate === 'number' ? e.epsEstimate : null,
        epsActual: typeof e.epsActual === 'number' ? e.epsActual : null,
        revenueEst: fmtRevenue(e.revenueEstimate as number | null),
        revenueActual: fmtRevenue(e.revenueActual as number | null),
        important: ['AAPL', 'MSFT', 'AMZN', 'META', 'GOOG', 'GOOGL', 'NVDA', 'TSLA', 'JPM', 'GS', 'MC.PA', 'ASML'].includes(sym),
      }
    })

  return NextResponse.json(
    { earnings: earningEvents },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  )
}
