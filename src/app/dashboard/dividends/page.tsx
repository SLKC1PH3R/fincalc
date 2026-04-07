'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Coins, TrendingUp } from 'lucide-react'
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
    <div
      style={{
        background: 'var(--card-dark)',
        border: '1px solid var(--card-dark-border)',
        borderRadius: 16,
        padding: '18px 20px',
        minHeight: 90,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

function yieldColor(yieldPct: number): string {
  if (yieldPct >= 5) return '#34d399'
  if (yieldPct >= 2) return '#f1c086'
  return 'var(--text-subtle)'
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Revenus Passifs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Coins style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Revenus Passifs</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Dividendes · Rentes · Portefeuille de rendement</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            {/* Annual */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Dividendes / an
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                {fmtCompact(data?.totalAnnualEur ?? 0)}
              </p>
            </div>

            {/* Monthly */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Dividendes / mois
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                {fmtCompact(data?.totalMonthlyEur ?? 0)}
              </p>
            </div>

            {/* Count */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Titres dividendes
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>
                {withDividends.length}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted-c)', marginLeft: 4 }}>/ {totalPositions}</span>
              </p>
            </div>

            {/* Avg yield */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Yield moyen pondéré
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: yieldColor(avgYield), fontVariantNumeric: 'tabular-nums' }}>
                {avgYield.toFixed(2)}%
              </p>
            </div>
          </>
        )}
      </div>

      {/* No positions state */}
      {!loading && totalPositions === 0 && (
        <div style={{
          background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
          borderRadius: 20, padding: '40px 24px', textAlign: 'center',
        }}>
          <TrendingUp style={{ width: 36, height: 36, color: '#34d399', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-em)', marginBottom: 6 }}>
            Aucune position dans votre portefeuille
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted-c)', maxWidth: 400, margin: '0 auto' }}>
            Ajoutez des actions ou ETF dans votre portefeuille pour estimer vos revenus passifs.
          </p>
        </div>
      )}

      {/* No dividends state */}
      {!loading && totalPositions > 0 && withDividends.length === 0 && (
        <div style={{
          background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
          borderRadius: 20, padding: '40px 24px', textAlign: 'center',
        }}>
          <Coins style={{ width: 36, height: 36, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-em)', marginBottom: 6 }}>
            Aucun dividende détecté
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted-c)', maxWidth: 460, margin: '0 auto' }}>
            Vos positions n'ont pas de rendement dividende détecté via Yahoo Finance. Cela peut concerner des ETF de capitalisation ou des données momentanément indisponibles.
          </p>
        </div>
      )}

      {/* Chart + table when data available */}
      {!loading && withDividends.length > 0 && (
        <>
          {/* Bar chart */}
          <div style={{
            background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
            borderRadius: 12, padding: '12px 12px', marginBottom: 12,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Top {chartData.length} — Dividendes annuels (€)
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: chartTheme.tick }} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                <Tooltip
                  contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                  formatter={(v: number) => [fmt(v), 'Dividende/an']}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#34d399" fillOpacity={1 - i * 0.08} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div style={{
            background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 100px 90px 110px 110px',
              borderBottom: '1px solid var(--card-dark-border)',
              padding: '10px 20px',
            }}>
              {['Titre', 'Quantité', 'Cours', 'Rendement', 'Dividende/an', 'Dividende/mois'].map(col => (
                <span key={col} style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {col}
                </span>
              ))}
            </div>

            {data?.positions.map(p => {
              const dim = p.yieldPct === 0
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 100px 90px 110px 110px',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--section-border)',
                    opacity: dim ? 0.5 : 1,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>{p.symbol}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.name}</p>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-em)', alignSelf: 'center' }}>{p.quantity}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-em)', alignSelf: 'center' }}>{fmt(p.priceEur)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dim ? 'var(--text-subtle)' : yieldColor(p.yieldPct), alignSelf: 'center' }}>
                    {dim ? '—' : `${p.yieldPct.toFixed(2)}%`}
                  </span>
                  <span style={{ fontSize: 13, color: dim ? 'var(--text-subtle)' : '#34d399', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {dim ? '—' : fmt(p.annualDividendEur)}
                  </span>
                  <span style={{ fontSize: 13, color: dim ? 'var(--text-subtle)' : 'var(--text-em)', alignSelf: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {dim ? '—' : fmt(p.monthlyDividendEur)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 16, lineHeight: 1.5 }}>
            Rendements issus de Yahoo Finance (mis en cache 1h). Les données peuvent être incomplètes ou décalées — à titre indicatif uniquement.
          </p>
        </>
      )}
      </div>
    </div>
  )
}
