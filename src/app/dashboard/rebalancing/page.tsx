'use client'
import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import { RefreshCw, Target, TrendingUp, PiggyBank, Building2, Bitcoin, Wallet, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'

interface Envelope {
  id: string
  type: EnvelopeType
  name: string
  metadata: Record<string, unknown>
  totalValue: number | null
  positions: { pru: number; quantity: number }[]
}

// ── Asset classes ──────────────────────────────────────────────────────────────
type AssetClass = 'actions' | 'epargne' | 'immobilier' | 'crypto' | 'liquidites'

const ASSET_CLASSES: Record<AssetClass, {
  label: string
  color: string
  icon: (props: any) => any
  types: EnvelopeType[]
  description: string
}> = {
  actions:     { label: 'Actions & Fonds',   color: '#818cf8', icon: TrendingUp, types: ['PEA', 'CTO', 'PER'],           description: 'PEA, CTO, PER' },
  epargne:     { label: 'Épargne',           color: '#34d399', icon: PiggyBank,  types: ['LIVRET', 'AV'],                 description: 'Livrets, Assurance-vie' },
  immobilier:  { label: 'Immobilier',        color: '#f472b6', icon: Building2,  types: ['IMMOBILIER'],                   description: 'Biens immobiliers, SCPI' },
  crypto:      { label: 'Crypto',            color: '#f59e0b', icon: Bitcoin,    types: ['CRYPTO'],                       description: 'Bitcoin, Ethereum…' },
  liquidites:  { label: 'Liquidités',        color: '#94a3b8', icon: Wallet,     types: ['CASH'],                         description: 'Comptes courants' },
}

// Default target allocations (%)
const DEFAULT_TARGETS: Record<AssetClass, number> = {
  actions:    60,
  epargne:    20,
  immobilier: 10,
  crypto:     5,
  liquidites: 5,
}

function computeEnvValue(env: Envelope): number {
  if (env.totalValue !== null && env.totalValue > 0) return env.totalValue
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: 'var(--p-text)', marginBottom: 6 }}>{d.label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ color: 'var(--p-text-dim)' }}>Actuel : <b style={{ color: 'var(--p-text)' }}>{d.current.toFixed(1)} %</b></span>
        <span style={{ color: 'var(--p-text-dim)' }}>Cible  : <b style={{ color: '#B07820' }}>{d.target.toFixed(1)} %</b></span>
        <span style={{ color: 'var(--p-text-dim)' }}>Écart  : <b style={{ color: d.delta > 0 ? '#34d399' : '#ef4444' }}>{d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)} %</b></span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RebalancingPage() {
  const chartTheme = useChartTheme()
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)
  const [targets, setTargets] = useState<Record<AssetClass, number>>({ ...DEFAULT_TARGETS })
  const [totalInvest, setTotalInvest] = useState('')

  useEffect(() => {
    fetch('/api/patrimoine/envelopes')
      .then(r => r.json())
      .then((data: Envelope[]) => {
        setEnvelopes(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Current allocation by asset class (€ and %)
  const currentByClass = useMemo(() => {
    const totals: Record<AssetClass, number> = { actions: 0, epargne: 0, immobilier: 0, crypto: 0, liquidites: 0 }
    for (const env of envelopes) {
      const val = computeEnvValue(env)
      for (const [cls, cfg] of Object.entries(ASSET_CLASSES) as [AssetClass, typeof ASSET_CLASSES[AssetClass]][]) {
        if (cfg.types.includes(env.type)) { totals[cls] += val; break }
      }
    }
    return totals
  }, [envelopes])

  const totalPatrimoine = useMemo(
    () => Object.values(currentByClass).reduce((s, v) => s + v, 0),
    [currentByClass]
  )

  // Total to invest (optional: can be total patrimoine or custom)
  const investBase = useMemo(() => {
    const custom = parseFloat(totalInvest.replace(/\s/g, '').replace(',', '.'))
    return custom > 0 ? custom : totalPatrimoine
  }, [totalInvest, totalPatrimoine])

  // Adjust targets to always sum to 100
  const targetTotal = useMemo(() => Object.values(targets).reduce((s, v) => s + v, 0), [targets])

  const setTarget = (cls: AssetClass, val: number) => {
    setTargets(prev => ({ ...prev, [cls]: Math.max(0, Math.min(100, val)) }))
  }

  // Chart data
  const chartData = useMemo(() => {
    if (investBase <= 0) return []
    return (Object.keys(ASSET_CLASSES) as AssetClass[]).map(cls => {
      const cfg = ASSET_CLASSES[cls]
      const currentPct = totalPatrimoine > 0 ? (currentByClass[cls] / totalPatrimoine) * 100 : 0
      const targetPct = targets[cls]
      return {
        cls,
        label: cfg.label,
        color: cfg.color,
        current: currentPct,
        target: targetPct,
        delta: targetPct - currentPct,
        currentEur: currentByClass[cls],
        targetEur: (targetPct / 100) * investBase,
        deltaEur: (targetPct / 100) * investBase - currentByClass[cls],
      }
    })
  }, [currentByClass, targets, totalPatrimoine, investBase])

  const sorted = [...chartData].sort((a, b) => Math.abs(b.deltaEur) - Math.abs(a.deltaEur))

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--p-text-faint)', gap: 10 }}>
        <RefreshCw style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
        Chargement du patrimoine…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--p-bg)', minHeight: '100%' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(176,120,32,0.10)', border: '1px solid rgba(176,120,32,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target style={{ width: 18, height: 18, color: '#B07820' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--p-text)', lineHeight: 1 }}>Rééquilibrage</h1>
            <p style={{ fontSize: 13, color: 'var(--p-text-faint)', marginTop: 2 }}>Définissez vos cibles et identifiez les ajustements à effectuer</p>
          </div>
        </div>
      </div>

      {/* KPI bar */}
      {totalPatrimoine > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
            <CardContent style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Patrimoine total</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)' }}>{fmtCompact(totalPatrimoine)}</div>
            </CardContent>
          </Card>
          {(Object.keys(ASSET_CLASSES) as AssetClass[]).map(cls => {
            const cfg = ASSET_CLASSES[cls]
            const val = currentByClass[cls]
            const pct = totalPatrimoine > 0 ? (val / totalPatrimoine) * 100 : 0
            if (val <= 0) return null
            return (
              <Card key={cls} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
                <CardContent style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{cfg.label}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--p-text)' }}>{fmtCompact(val)}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>{pct.toFixed(1)} %</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPatrimoine === 0 && (
        <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', textAlign: 'center', padding: '32px 24px' }}>
          <p style={{ color: 'var(--p-text-faint)', fontSize: 14, marginBottom: 12 }}>Aucune enveloppe trouvée. Commencez par renseigner votre patrimoine.</p>
          <Link href="/dashboard/patrimoine" style={{ color: '#B07820', fontWeight: 600, fontSize: 13 }}>→ Aller au patrimoine</Link>
        </Card>
      )}

      {/* Main grid: targets + chart */}
      {totalPatrimoine > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Left: Target inputs */}
          <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
            <CardContent style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)' }}>Allocation cible</span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: Math.abs(targetTotal - 100) < 0.5 ? '#34d399' : '#ef4444',
                  padding: '2px 8px', borderRadius: 6,
                  background: Math.abs(targetTotal - 100) < 0.5 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                }}>
                  Total : {targetTotal} %
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(Object.keys(ASSET_CLASSES) as AssetClass[]).map(cls => {
                  const cfg = ASSET_CLASSES[cls]
                  const Icon = cfg.icon
                  return (
                    <div key={cls}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Icon style={{ width: 13, height: 13, color: cfg.color }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)' }}>{cfg.label}</span>
                          <span style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{cfg.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            value={targets[cls]}
                            min={0} max={100} step={1}
                            onChange={e => setTarget(cls, parseFloat(e.target.value) || 0)}
                            style={{
                              width: 52, padding: '3px 6px', borderRadius: 6, textAlign: 'right',
                              border: '1px solid var(--p-line)', background: 'var(--p-card)',
                              color: 'var(--p-text)', fontSize: 13, fontWeight: 700,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>%</span>
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 5, borderRadius: 999, background: 'var(--p-line)', overflow: 'hidden' }}>
                        <div style={{
                          position: 'absolute', top: 0, left: 0, height: '100%',
                          width: `${Math.min(100, targets[cls])}%`,
                          background: cfg.color, borderRadius: 999, transition: 'width 0.2s',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Optional: custom invest amount */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--p-line)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-faint)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Base de calcul (optionnel)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={totalInvest}
                    onChange={e => setTotalInvest(e.target.value)}
                    placeholder={`${Math.round(totalPatrimoine)} (actuel)`}
                    style={{
                      flex: 1, padding: '6px 10px', borderRadius: 8,
                      border: '1px solid var(--p-line)', background: 'var(--p-card)',
                      color: 'var(--p-text)', fontSize: 13,
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>€</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4 }}>
                  Laissez vide pour utiliser le patrimoine actuel ({fmtCompact(totalPatrimoine)})
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Chart current vs target */}
          <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
            <CardContent style={{ padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)', marginBottom: 16 }}>Actuel vs cible</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barGap={2} barCategoryGap="25%">
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: chartTheme.tick }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    width={60}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: chartTheme.tick }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                    width={35}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="current" name="Actuel" radius={[4, 4, 0, 0]}>
                    {chartData.map(d => (
                      <Cell key={d.cls} fill={d.color + 'aa'} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" name="Cible" radius={[4, 4, 0, 0]} fill="#B07820" opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#818cf8aa' }} />
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Actuel</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: '#B07820cc' }} />
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Cible</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action plan */}
      {totalPatrimoine > 0 && Math.abs(targetTotal - 100) < 0.5 && (
        <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
          <CardContent style={{ padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)', marginBottom: 16 }}>Plan d'action</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map(d => {
                const cfg = ASSET_CLASSES[d.cls as AssetClass]
                const Icon = cfg.icon
                const isBuy = d.deltaEur > 0
                const isBalanced = Math.abs(d.delta) < 0.5
                return (
                  <div key={d.cls} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    borderRadius: 12, border: `1px solid ${isBalanced ? 'var(--p-line)' : isBuy ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    background: isBalanced ? 'transparent' : isBuy ? 'rgba(52,211,153,0.04)' : 'rgba(239,68,68,0.04)',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.color + '18', border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 15, height: 15, color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)' }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 1 }}>
                        Actuel : {fmtCompact(d.currentEur)} ({d.current.toFixed(1)} %)
                        {' → '}Cible : {fmtCompact(d.targetEur)} ({d.target.toFixed(1)} %)
                      </div>
                    </div>
                    {isBalanced ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#34d399', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        Équilibré
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                          background: isBuy ? 'rgba(52,211,153,0.13)' : 'rgba(239,68,68,0.13)',
                          color: isBuy ? '#34d399' : '#ef4444',
                        }}>
                          {isBuy ? <ArrowUp style={{ width: 13, height: 13 }} /> : <ArrowDown style={{ width: 13, height: 13 }} />}
                          {isBuy ? '+' : ''}{fmtCompact(d.deltaEur)}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                          ({isBuy ? '+' : ''}{d.delta.toFixed(1)} pt)
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(176,120,32,0.06)', border: '1px solid rgba(176,120,32,0.13)', fontSize: 11, color: 'var(--p-text-faint)', lineHeight: 1.6 }}>
              <b style={{ color: 'var(--p-text)' }}>Note :</b> Les actions en vert indiquent un achat à réaliser, en rouge une réduction. Les montants sont calculés par rapport à la base de {fmtCompact(investBase)}. Le rééquilibrage peut se faire progressivement (DCA) ou en une seule opération.
            </div>
          </CardContent>
        </Card>
      )}

      {totalPatrimoine > 0 && Math.abs(targetTotal - 100) >= 0.5 && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
          La somme des allocations cibles doit être égale à 100 % (actuellement {targetTotal} %). Ajustez les valeurs ci-dessus.
        </div>
      )}
    </div>
  )
}
