import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart'
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; PatrImo/1.0)' }

const BENCHMARKS = [
  { symbol: 'IWDA.AS', label: 'MSCI World' },
  { symbol: '^FCHI',   label: 'CAC 40'    },
  { symbol: '^GSPC',   label: 'S&P 500'   },
]

function rangeParam(days: number): string {
  if (days <= 30)  return '1mo'
  if (days <= 90)  return '3mo'
  if (days <= 180) return '6mo'
  return '1y'
}

type DataPoint = { date: string; value: number }

async function fetchSeries(symbol: string, days: number): Promise<DataPoint[]> {
  try {
    const range = rangeParam(days)
    const res = await fetch(
      `${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=${range}`,
      { next: { revalidate: 3600 }, headers: HEADERS }
    )
    if (!res.ok) return []
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = data?.chart?.result?.[0] as any
    if (!result) return []
    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
    const points: DataPoint[] = []
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue
      const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
      points.push({ date, value: closes[i] })
    }
    return points
  } catch {
    return []
  }
}

function rebase(series: DataPoint[]): DataPoint[] {
  if (!series.length) return []
  const base = series[0].value
  if (base === 0) return series
  return series.map(p => ({ date: p.date, value: (p.value / base) * 100 }))
}

function perfPct(series: DataPoint[]): number {
  if (series.length < 2) return 0
  const first = series[0].value
  const last = series[series.length - 1].value
  if (first === 0) return 0
  return ((last - first) / first) * 100
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '365') || 365

  const allSeries = await Promise.all(BENCHMARKS.map(b => fetchSeries(b.symbol, days)))

  const benchmarks = BENCHMARKS.map((b, i) => {
    const raw = allSeries[i]
    const rebased = rebase(raw)
    return {
      symbol: b.symbol,
      label: b.label,
      series: rebased,
      perfPct: perfPct(rebased),
      startPrice: raw[0]?.value ?? null,
      endPrice: raw[raw.length - 1]?.value ?? null,
    }
  })

  return NextResponse.json({ benchmarks, days })
}
