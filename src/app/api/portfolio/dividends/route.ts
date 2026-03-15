import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const YAHOO_SUMMARY = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary'
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; FinCalc/1.0)' }

async function fetchDividendYield(symbol: string): Promise<number> {
  try {
    const res = await fetch(
      `${YAHOO_SUMMARY}/${encodeURIComponent(symbol)}?modules=summaryDetail`,
      { next: { revalidate: 3600 }, headers: HEADERS }
    )
    if (!res.ok) return 0
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detail = data?.quoteSummary?.result?.[0]?.summaryDetail as any
    if (!detail) return 0
    const yld = detail?.dividendYield?.raw ?? detail?.trailingAnnualDividendYield?.raw ?? 0
    return typeof yld === 'number' ? yld : 0
  } catch {
    return 0
  }
}

async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${YAHOO_CHART}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { next: { revalidate: 3600 }, headers: HEADERS }
    )
    if (!res.ok) return null
    const d = await res.json()
    const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : null
  } catch {
    return null
  }
}

async function fetchEurRate(): Promise<number> {
  try {
    const res = await fetch(
      `${YAHOO_CHART}/EURUSD=X?interval=1d&range=1d`,
      { next: { revalidate: 3600 }, headers: HEADERS }
    )
    if (!res.ok) return 0.92
    const d = await res.json()
    const price = d?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : 0.92
  } catch {
    return 0.92
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    include: { positions: { orderBy: { createdAt: 'asc' } } },
  })

  const positions = portfolio?.positions ?? []
  // Filter only STOCK and ETF — skip CRYPTO
  const eligible = positions.filter(p => p.assetType === 'STOCK' || p.assetType === 'ETF')

  if (!eligible.length) {
    return NextResponse.json({
      positions: [],
      totalAnnualEur: 0,
      totalMonthlyEur: 0,
    })
  }

  const hasUsd = eligible.some(p => p.currency === 'USD')
  const [eurRate, ...yields] = await Promise.all([
    hasUsd ? fetchEurRate() : Promise.resolve(1),
    ...eligible.map(p => fetchDividendYield(p.symbol)),
  ])

  // Fetch current prices for all positions in parallel
  const prices = await Promise.all(
    eligible.map(async (p, i) => {
      const yld = yields[i] as number
      const rawPrice = await fetchPrice(p.symbol)
      // Fall back to PRU if live price unavailable
      let priceEur = p.pru
      if (rawPrice !== null) {
        priceEur = p.currency === 'USD' ? rawPrice * (eurRate as number) : rawPrice
      } else if (p.currency === 'USD') {
        priceEur = p.pru * (eurRate as number)
      }
      return { p, yld, priceEur }
    })
  )

  const result = prices.map(({ p, yld, priceEur }) => {
    const annualDividendEur = yld * priceEur * p.quantity
    const monthlyDividendEur = annualDividendEur / 12
    return {
      id: p.id,
      symbol: p.symbol,
      name: p.name,
      quantity: p.quantity,
      priceEur,
      yieldPct: yld * 100,
      annualDividendEur,
      monthlyDividendEur,
    }
  })

  // Sort by annual dividend descending
  result.sort((a, b) => b.annualDividendEur - a.annualDividendEur)

  const totalAnnualEur = result.reduce((sum, r) => sum + r.annualDividendEur, 0)
  const totalMonthlyEur = totalAnnualEur / 12

  return NextResponse.json({ positions: result, totalAnnualEur, totalMonthlyEur })
}
