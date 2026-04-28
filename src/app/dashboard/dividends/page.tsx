'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Coins, TrendingUp, Info } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { useChartTheme } from '@/lib/chart-theme'

interface DividendPosition {
  id: string
  symbol: string
  name: string
  quantity: number
  priceEur: number
  yieldPct: number
  annualDividendEur: number
  monthlyDividendEur: number
}

interface DividendData {
  positions: DividendPosition[]
  totalAnnualEur: number
  totalMonthlyEur: number
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--p-card)', border: '1px solid var(--p-line)',
      borderRadius: 12, padding: '12px 14px', minHeight: 80,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

function yieldColor(yieldPct: number): string {
  if (yieldPct >= 5) return '#34d399'
  if (yieldPct >= 2) return '#B07820'
  return 'var(--p-text-faint)'
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

const COLOR = '#facc15'

export default function DividendsPage() {
  const [data, setData] = useState<DividendData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartTheme = useChartTheme()

  useEffect(() => {
    fetch('/api/portfolio/dividends')
      .then(r => r.json())
      .then((d: DividendData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const withDividends = data?.positions.filter(p => p.yieldPct > 0) ?? []
  const totalPositions = data?.positions.length ?? 0
  const avgYield = withDividends.length > 0
    ? withDividends.reduce((sum, p) => sum + p.yieldPct * p.annualDividendEur, 0) /
      (withDividends.reduce((sum, p) => sum + p.annualDividendEur, 0) || 1)
    : 0

  const chartData = [...withDividends]
    .sort((a, b) => b.annualDividendEur - a.annualDividendEur)
    .slice(0, 8)
    .map(p => ({ name: p.symbol, value: p.annualDividendEur }))

  const pieData = withDividends.slice(0, 6).map(p => ({
    name: p.symbol,
    value: Math.round(p.annualDividendEur),
  }))
  const PIE_COLORS = ['#34d399', '#60a5fa', '#B07820', '#f87171', '#a78bfa', '#fb923c']

  const hasData = !loading && withDividends.length > 0

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Revenus Passifs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Coins style={{ width: 20, height: 20, color: COLOR }} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>Revenus Passifs</h1>
            <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Dividendes · Rentes · Portefeuille de rendement</p>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {loading ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />) : (
          <>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Dividendes / an</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#34d399', fontVariantNumeric: 'tabular-nums', margin: 0, letterSpacing: '-0.5px' }}>{fmtCompact(data?.totalAnnualEur ?? 0)}</p>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Dividendes / mois</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#34d399', fontVariantNumeric: 'tabular-nums', margin: 0, letterSpacing: '-0.5px' }}>{fmtCompact(data?.totalMonthlyEur ?? 0)}</p>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Titres dividendes</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', margin: 0, letterSpacing: '-0.5px' }}>
                {withDividends.length}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--p-text-dim)', marginLeft: 4 }}>/ {totalPositions}</span>
              </p>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Yield moyen pondéré</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: yieldColor(avgYield), fontVariantNumeric: 'tabular-nums', margin: 0, letterSpacing: '-0.5px' }}>{avgYield.toFixed(2)}%</p>
            </div>
          </>
        )}
      </div>

      {/* Empty states */}
      {!loading && totalPositions === 0 && (
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <TrendingUp style={{ width: 40, height: 40, color: '#34d399', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 6 }}>Aucune position dans votre portefeuille</p>
          <p style={{ fontSize: 13, color: 'var(--p-text-dim)', maxWidth: 400, margin: '0 auto' }}>Ajoutez des actions ou ETF dans votre portefeuille pour estimer vos revenus passifs.</p>
        </div>
      )}

      {!loading && totalPositions > 0 && withDividends.length === 0 && (
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <Coins style={{ width: 40, height: 40, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 6 }}>Aucun dividende détecté</p>
          <p style={{ fontSize: 13, color: 'var(--p-text-dim)', maxWidth: 460, margin: '0 auto' }}>Vos positions n'ont pas de rendement dividende détecté via Yahoo Finance. Cela peut concerner des ETF de capitalisation ou des données momentanément indisponibles.</p>
        </div>
      )}

      {/* Main content — 2 columns when data available */}
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

          {/* LEFT — chart + table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Bar chart */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Top {chartData.length} — Dividendes annuels</p>
                <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Positions les plus rémunératrices</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    itemStyle={chartTheme.itemStyle}
                    formatter={(v: number) => [fmt(v), 'Dividende/an']}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLOR} fillOpacity={1 - i * 0.08} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 110px 110px', borderBottom: '1px solid var(--p-line)', padding: '10px 16px', background: 'var(--p-row-hover)' }}>
                {['Titre', 'Quantité', 'Cours', 'Rendement', 'Dividende/an', 'Dividende/mois'].map(col => (
                  <span key={col} style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{col}</span>
                ))}
              </div>
              {data?.positions.map((p, idx) => {
                const dim = p.yieldPct === 0
                return (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 110px 110px',
                    padding: '11px 16px', borderBottom: idx < (data?.positions.length ?? 0) - 1 ? '1px solid var(--p-line)' : 'none',
                    opacity: dim ? 0.5 : 1, transition: 'background 0.12s', cursor: 'default',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)', margin: 0 }}>{p.symbol}</p>
                      <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.name}</p>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--p-text-em)', alignSelf: 'center' }}>{p.quantity}</span>
                    <span style={{ fontSize: 13, color: 'var(--p-text-em)', alignSelf: 'center' }}>{fmt(p.priceEur)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: dim ? 'var(--p-text-faint)' : yieldColor(p.yieldPct), alignSelf: 'center' }}>
                      {dim ? '—' : `${p.yieldPct.toFixed(2)}%`}
                    </span>
                    <span style={{ fontSize: 13, color: dim ? 'var(--p-text-faint)' : '#34d399', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {dim ? '—' : fmt(p.annualDividendEur)}
                    </span>
                    <span style={{ fontSize: 13, color: dim ? 'var(--p-text-faint)' : 'var(--p-text-em)', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {dim ? '—' : fmt(p.monthlyDividendEur)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--p-line)', fontSize: 11, color: 'var(--p-text-faint)', lineHeight: 1.5 }}>
              <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
              <span>Rendements issus de Yahoo Finance (mis en cache 1h). À titre indicatif uniquement.</span>
            </div>
          </div>

          {/* RIGHT — répartition + infos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Donut répartition */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 12px' }}>Répartition dividendes</p>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTheme.tooltip} formatter={(v: any) => [fmt(v), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyse */}
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 12px' }}>Analyse revenus</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Dividendes / semaine', value: fmt(Math.round((data?.totalAnnualEur ?? 0) / 52)) },
                  { label: 'Dividendes / jour', value: fmt(Math.round((data?.totalAnnualEur ?? 0) / 365)) },
                  { label: 'Couverture dépenses 1 500€/mois', value: `${Math.round(((data?.totalMonthlyEur ?? 0) / 1500) * 100)}%` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 10px' }}>Conseils rendement</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Un yield > 5% est attractif mais surveiller la pérennité du dividende',
                  'Diversifier sur plusieurs secteurs pour réduire le risque de coupe',
                  'Privilégier les "dividend aristocrats" pour la stabilité à long terme',
                  'Le PEA exonère les dividendes d\'impôts après 5 ans de détention',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
