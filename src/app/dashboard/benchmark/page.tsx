'use client'
import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, Info, TrendingUp, TrendingDown } from 'lucide-react'
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
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

function rebaseSnapshots(snapshots: Snapshot[]): { date: string; value: number }[] {
  if (!snapshots.length) return []
  const base = snapshots[0].totalValue
  if (!base) return []
  return snapshots.map(s => ({ date: s.date.slice(0, 10), value: (s.totalValue / base) * 100 }))
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
    benchmarks.forEach((b, i) => { if (benchmarkMaps[i].has(date)) row[b.label] = benchmarkMaps[i].get(date)! })
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

  const chartData = benchData ? mergeChartData(portfolioRebased, benchData.benchmarks) : []

  const allLines: { key: string; color: string; perf: number; hasData: boolean }[] = [
    { key: 'Portfolio', color: COLORS.portfolio, perf: portfolioPerf, hasData: hasPortfolio },
    ...(benchData?.benchmarks.map(b => ({
      key: b.label,
      color: COLORS[b.label as keyof typeof COLORS] ?? '#888',
      perf: b.perfPct,
      hasData: b.series.length > 0,
    })) ?? []),
  ]

  const bestLine = [...allLines].filter(l => l.hasData).sort((a, b) => b.perf - a.perf)[0]
  const portfolioLine = allLines.find(l => l.key === 'Portfolio')
  const portfolioVsBest = portfolioLine && bestLine && bestLine.key !== 'Portfolio'
    ? portfolioPerf - bestLine.perf
    : null

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Placements</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Benchmarks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BarChart3 style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Benchmarks</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Performance vs indices · CAC 40 · MSCI World · S&P 500</p>
            </div>
          </div>

          {/* Range selector */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {RANGE_OPTIONS.map(o => (
              <button key={o.label} onClick={() => setDays(o.days)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid',
                borderColor: days === o.days ? COLOR : 'var(--card-dark-border)',
                background: days === o.days ? `${COLOR}18` : 'var(--card-dark)',
                color: days === o.days ? COLOR : 'var(--text-muted-c)',
                fontSize: 12, fontWeight: days === o.days ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout 2 colonnes — chart + droite analyse */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — chart + perf cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Portfolio note */}
          {!hasPortfolio && !loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.17)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>
              <Info style={{ width: 16, height: 16, color: '#f1c086', flexShrink: 0, marginTop: 1 }} />
              <span>Aucun snapshot de patrimoine disponible. La courbe <span style={{ color: '#f1c086', fontWeight: 600 }}>Portfolio</span> s'accumule au fil du temps à partir des snapshots quotidiens.</span>
            </div>
          )}

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Performance indexée (base 100)</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Comparaison normalisée sur la période sélectionnée</p>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
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
                  <YAxis tick={{ fontSize: 10, fill: chartTheme.tick }} tickFormatter={v => `${v.toFixed(0)}`} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    itemStyle={chartTheme.itemStyle}
                    formatter={(v: number, name: string) => [`${v.toFixed(2)}`, name]}
                    labelFormatter={v => String(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: chartTheme.tick, paddingTop: 12 }} />
                  {hasPortfolio && <Line type="monotone" dataKey="Portfolio" stroke={COLORS.portfolio} strokeWidth={2.5} dot={false} connectNulls />}
                  {benchData?.benchmarks.map(b => (
                    <Line key={b.symbol} type="monotone" dataKey={b.label} stroke={COLORS[b.label as keyof typeof COLORS] ?? '#888'} strokeWidth={2} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                {loading ? 'Chargement des données…' : 'Aucune donnée disponible'}
              </div>
            )}
          </div>

          {/* Performance cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {allLines.map(line => {
              const isPos = line.perf >= 0
              const color = isPos ? '#4ade80' : '#f87171'
              return (
                <div key={line.key} style={{
                  background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                  borderRadius: 12, padding: '12px 14px', borderTop: `3px solid ${line.color}`,
                  opacity: line.hasData ? 1 : 0.4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: line.color, display: 'inline-block' }} />
                    <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{line.key}</p>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', margin: 0, letterSpacing: '-0.5px' }}>
                    {isPos ? '+' : ''}{line.perf.toFixed(2)}%
                  </p>
                  {!line.hasData && <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>Pas de données</p>}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — analyse + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse portfolio */}
          {hasPortfolio && (
            <div style={{
              background: portfolioPerf >= 0 ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
              border: `1px solid ${portfolioPerf >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`,
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {portfolioPerf >= 0
                  ? <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                  : <TrendingDown style={{ width: 14, height: 14, color: '#f87171' }} />
                }
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Votre Portfolio</p>
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: portfolioPerf >= 0 ? '#34d399' : '#f87171', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>
                {portfolioPerf >= 0 ? '+' : ''}{portfolioPerf.toFixed(2)}%
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: '0 0 12px' }}>
                sur {RANGE_OPTIONS.find(o => o.days === days)?.label ?? `${days}j`}
              </p>
              {portfolioVsBest !== null && (
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>
                    vs {bestLine?.key} :{' '}
                    <span style={{ fontWeight: 700, color: portfolioVsBest >= 0 ? '#34d399' : '#f87171' }}>
                      {portfolioVsBest >= 0 ? '+' : ''}{portfolioVsBest.toFixed(2)}%
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Indices résumé */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Indices de référence</p>
            </div>
            <div style={{ padding: '8px 0' }}>
              {allLines.filter(l => l.key !== 'Portfolio').map(line => (
                <div key={line.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--section-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: line.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-em)' }}>{line.key}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: line.perf >= 0 ? '#4ade80' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                    {line.perf >= 0 ? '+' : ''}{line.perf.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: '0 0 10px' }}>À savoir</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'La base 100 normalise les performances pour une comparaison équitable quelle que soit la valeur initiale',
                'Le MSCI World couvre 85% de la capitalisation mondiale des marchés développés',
                'Un portefeuille diversifié sur ETF MSCI World bat ~80% des gérants actifs sur 10 ans',
                'Les snapshots du patrimoine sont pris quotidiennement pour construire la courbe Portfolio',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--card-dark-border)' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--section-border)', fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
            <Info style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />
            <span>Les performances passées ne préjugent pas des futures. Données via Yahoo Finance (cache 1h).</span>
          </div>
        </div>
      </div>
    </div>
  )
}
