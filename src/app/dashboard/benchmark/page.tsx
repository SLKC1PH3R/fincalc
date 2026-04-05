'use client'
import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, Info } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

interface BenchmarkSeries {
  symbol: string
  label: string
  series: { date: string; value: number }[]
  perfPct: number
  startPrice: number | null
  endPrice: number | null
}

interface BenchmarkData {
  benchmarks: BenchmarkSeries[]
  days: number
}

interface Snapshot {
  date: string
  totalValue: number
}

const COLORS = {
  portfolio: '#f1c086',
  'MSCI World': '#818cf8',
  'CAC 40': '#38bdf8',
  'S&P 500': '#34d399',
}

const RANGE_OPTIONS = [
  { label: '1m', days: 30 },
  { label: '3m', days: 90 },
  { label: '6m', days: 180 },
  { label: '1a', days: 365 },
]

function rebaseSnapshots(snapshots: Snapshot[]): { date: string; value: number }[] {
  if (!snapshots.length) return []
  const base = snapshots[0].totalValue
  if (!base) return []
  return snapshots.map(s => ({
    date: s.date.slice(0, 10),
    value: (s.totalValue / base) * 100,
  }))
}

function perfPct(series: { date: string; value: number }[]): number {
  if (series.length < 2) return 0
  return series[series.length - 1].value - series[0].value
}

function mergeChartData(
  portfolioSeries: { date: string; value: number }[],
  benchmarks: BenchmarkSeries[]
): Record<string, string | number>[] {
  const dateSet = new Set<string>()
  portfolioSeries.forEach(p => dateSet.add(p.date))
  benchmarks.forEach(b => b.series.forEach(p => dateSet.add(p.date)))

  const dates = Array.from(dateSet).sort()

  const portfolioMap = new Map(portfolioSeries.map(p => [p.date, p.value]))
  const benchmarkMaps = benchmarks.map(b => new Map(b.series.map(p => [p.date, p.value])))

  return dates.map(date => {
    const row: Record<string, string | number> = { date }
    if (portfolioMap.has(date)) row['Portfolio'] = portfolioMap.get(date)!
    benchmarks.forEach((b, i) => {
      if (benchmarkMaps[i].has(date)) row[b.label] = benchmarkMaps[i].get(date)!
    })
    return row
  })
}

const COLOR = '#818cf8'

export default function BenchmarkPage() {
  const [days, setDays] = useState(365)
  const [benchData, setBenchData] = useState<BenchmarkData | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const chartTheme = useChartTheme()

  const load = useCallback((d: number) => {
    setLoading(true)
    Promise.all([
      fetch(`/api/portfolio/benchmark?days=${d}`).then(r => r.json()),
      fetch(`/api/patrimoine/snapshots?days=${d}`).then(r => r.json()),
    ])
      .then(([bench, snaps]: [BenchmarkData, Snapshot[]]) => {
        setBenchData(bench)
        setSnapshots(Array.isArray(snaps) ? snaps : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load(days) }, [days, load])

  const portfolioRebased = rebaseSnapshots(snapshots)
  const hasPortfolio = portfolioRebased.length >= 2
  const portfolioPerf = perfPct(portfolioRebased)

  const chartData = benchData
    ? mergeChartData(portfolioRebased, benchData.benchmarks)
    : []

  const allLines: { key: string; color: string; perf: number; hasData: boolean }[] = [
    {
      key: 'Portfolio',
      color: COLORS.portfolio,
      perf: portfolioPerf,
      hasData: hasPortfolio,
    },
    ...(benchData?.benchmarks.map(b => ({
      key: b.label,
      color: COLORS[b.label as keyof typeof COLORS] ?? '#888',
      perf: b.perfPct,
      hasData: b.series.length > 0,
    })) ?? []),
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>Benchmarks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Comparaison Benchmarks <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400, marginLeft: 6 }}>Portfolio vs indices</span></h1>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {/* Range selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {RANGE_OPTIONS.map(o => (
          <button
            key={o.label}
            onClick={() => setDays(o.days)}
            style={{
              padding: '6px 18px',
              borderRadius: 10,
              border: '1px solid',
              borderColor: days === o.days ? '#818cf8' : 'var(--card-dark-border)',
              background: days === o.days ? 'rgba(129,140,248,0.12)' : 'var(--card-dark)',
              color: days === o.days ? '#818cf8' : 'var(--text-muted-c)',
              fontSize: 13, fontWeight: days === o.days ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Portfolio note */}
      {!hasPortfolio && !loading && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.17)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13,
          color: 'var(--text-muted-c)', lineHeight: 1.5,
        }}>
          <Info style={{ width: 16, height: 16, color: '#f1c086', flexShrink: 0, marginTop: 1 }} />
          <span>
            Aucun snapshot de patrimoine disponible sur cette période.
            La courbe <span style={{ color: '#f1c086', fontWeight: 600 }}>Portfolio</span> s'accumule au fil du temps à partir des snapshots quotidiens.
          </span>
        </div>
      )}

      {/* Chart */}
      <div style={{
        background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
        borderRadius: 12, padding: '12px 12px', marginBottom: 12,
        opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Performance indexée (base 100)
        </p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: chartTheme.tick }}
                tickFormatter={v => {
                  const d = new Date(v)
                  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartTheme.tick }}
                tickFormatter={v => `${v.toFixed(0)}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                formatter={(v: number, name: string) => [`${v.toFixed(2)}`, name]}
                labelFormatter={v => String(v)}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: chartTheme.tick, paddingTop: 12 }}
              />
              {hasPortfolio && (
                <Line type="monotone" dataKey="Portfolio" stroke={COLORS.portfolio} strokeWidth={2.5} dot={false} connectNulls />
              )}
              {benchData?.benchmarks.map(b => (
                <Line
                  key={b.symbol}
                  type="monotone"
                  dataKey={b.label}
                  stroke={COLORS[b.label as keyof typeof COLORS] ?? '#888'}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
            {loading ? 'Chargement des données…' : 'Aucune donnée disponible'}
          </div>
        )}
      </div>

      {/* Performance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 12 }}>
        {allLines.map(line => {
          const isPos = line.perf >= 0
          const color = isPos ? '#4ade80' : '#f87171'
          return (
            <div
              key={line.key}
              style={{
                background: 'var(--card-dark)',
                border: `1px solid var(--card-dark-border)`,
                borderRadius: 14, padding: '14px 16px',
                borderTop: `3px solid ${line.color}`,
                opacity: line.hasData ? 1 : 0.4,
              }}
            >
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {line.key}
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                {isPos ? '+' : ''}{line.perf.toFixed(2)}%
              </p>
              {!line.hasData && (
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>Pas de données</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '12px 16px', borderRadius: 10,
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--section-border)',
        fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5,
      }}>
        <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
        <span>
          Les performances passées ne préjugent pas des performances futures.
          Le portefeuille est calculé à partir des snapshots quotidiens du patrimoine.
          Données benchmarks via Yahoo Finance (mise en cache 1h).
        </span>
      </div>
      </div>
    </div>
  )
}
