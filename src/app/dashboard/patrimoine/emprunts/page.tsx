'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, CreditCard, Plus, TrendingDown, ExternalLink } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface MortgageSim {
  id: string
  name: string
  inputs: { price?: number; loan?: number; rate?: number; years?: number; downPayment?: number }
  results: { monthlyPayment?: number; totalCost?: number; totalInterest?: number; loanAmount?: number }
  createdAt: string
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

const COLOR = '#f87171'

export default function EmpruntsPage() {
  const [sims, setSims] = useState<MortgageSim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/simulations?type=mortgage')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalLoan = sims.reduce((s, sim) => s + (sim.results?.loanAmount ?? sim.inputs?.loan ?? 0), 0)
  const totalMonthly = sims.reduce((s, sim) => s + (sim.results?.monthlyPayment ?? 0), 0)
  const totalInterest = sims.reduce((s, sim) => s + (sim.results?.totalInterest ?? 0), 0)
  const totalCost = sims.reduce((s, sim) => s + (sim.results?.totalCost ?? 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--p-bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid var(--p-line)', flexShrink: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--p-text-faint)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--p-mono)', letterSpacing: '0.04em' }}>
          <Link href="/dashboard/patrimoine" style={{ color: 'var(--p-text-faint)', textDecoration: 'none' }}>MON PATRIMOINE</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 700 }}>EMPRUNTS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 26, fontWeight: 400, color: 'var(--p-text-em)', margin: 0, letterSpacing: '-0.02em' }}>Emprunts</h1>
            <span style={{ fontSize: 12, color: 'var(--p-text-faint)', fontWeight: 400 }}>Crédits immobiliers simulés</span>
          </div>
          <Button asChild size="sm" style={{ gap: 6, flexShrink: 0 }}>
            <Link href="/dashboard/mortgage"><Plus className="h-4 w-4" />Simuler un prêt</Link>
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && sims.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--p-card)', border: '2px dashed var(--p-line)', borderRadius: 16, maxWidth: 420 }}>
            <CreditCard style={{ width: 40, height: 40, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text)', marginBottom: 6 }}>Aucun crédit simulé</div>
            <div style={{ fontSize: 13, color: 'var(--p-text-faint)', marginBottom: 20 }}>
              Utilisez le simulateur de prêt immobilier pour planifier votre financement
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/mortgage">Simuler un prêt immobilier</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── 3-col layout ── */}
      {!loading && sims.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 270px', gap: 16, alignItems: 'start' }}>

            {/* ── LEFT: Simulations list ── */}
            <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulations</span>
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: COLOR + '18', color: COLOR, fontWeight: 700 }}>{sims.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sims.map(sim => {
                  const loan = sim.results?.loanAmount ?? sim.inputs?.loan ?? 0
                  const monthly = sim.results?.monthlyPayment ?? 0
                  const part = totalLoan > 0 ? (loan / totalLoan) * 100 : 0
                  return (
                    <Link key={sim.id}
                      href={`/dashboard/mortgage?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{ padding: '10px 12px', borderRadius: 11, background: 'var(--p-card)', border: '1px solid var(--p-line)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '55'; (e.currentTarget as HTMLElement).style.background = 'var(--p-row-hover)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p-line)'; (e.currentTarget as HTMLElement).style.background = 'var(--p-card)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: COLOR + '18', border: `1px solid ${COLOR}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Home style={{ width: 12, height: 12, color: COLOR }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>Crédit immobilier</div>
                          </div>
                          <ExternalLink style={{ width: 11, height: 11, color: 'var(--p-text-faint)', flexShrink: 0 }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: COLOR, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(loan)}</span>
                          {monthly > 0 && <span style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{fmtCompact(monthly)}/mois</span>}
                          <span style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{part.toFixed(0)}%</span>
                        </div>
                        <div style={{ marginTop: 5, height: 2, borderRadius: 99, background: 'var(--p-line)', overflow: 'hidden' }}>
                          <div style={{ width: `${part}%`, height: '100%', background: COLOR, borderRadius: 99 }} />
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Add button */}
                <Link href="/dashboard/mortgage" style={{ textDecoration: 'none' }}>
                  <div
                    style={{ padding: '10px 12px', borderRadius: 11, border: '1.5px dashed var(--p-line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = COLOR + '55'; (e.currentTarget as HTMLElement).style.background = COLOR + '05' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p-line)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px dashed var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Plus style={{ width: 13, height: 13, color: 'var(--p-text-faint)' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>Simuler un prêt</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* ── CENTER: KPIs + table ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { label: 'Capital emprunté', value: fmtCompact(totalLoan), sub: `${sims.length} simulation${sims.length > 1 ? 's' : ''}`, color: COLOR, highlight: true },
                  { label: 'Mensualités totales', value: `${fmtCompact(totalMonthly)}/mois`, sub: 'Charge mensuelle cumulée', color: '#fb923c', highlight: false },
                  { label: 'Intérêts totaux', value: fmtCompact(totalInterest), sub: `${totalLoan > 0 ? ((totalInterest / totalLoan) * 100).toFixed(1) : 0}% du capital`, color: '#f59e0b', highlight: false },
                  { label: 'Coût total financement', value: fmtCompact(totalCost), sub: 'Capital + intérêts', color: '#94a3b8', highlight: false },
                ].map((k, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: k.highlight ? `linear-gradient(135deg, ${k.color}10, transparent)` : 'var(--p-card)', border: `1px solid ${k.highlight ? k.color + '30' : 'var(--p-line)'}`, position: 'relative', overflow: 'hidden' }}>
                    {k.highlight && <div style={{ position: 'absolute', top: -20, right: -10, width: 60, height: 60, borderRadius: '50%', background: `radial-gradient(ellipse, ${k.color}14, transparent)`, pointerEvents: 'none' }} />}
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.highlight ? k.color : 'var(--p-text)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 3 }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Comparison table */}
              <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)' }}>Comparatif des emprunts</span>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Données simulées</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['Simulation', 'Montant', 'Durée', 'Taux', 'Mensualité', 'Intérêts', 'Part'].map((h, i) => (
                        <th key={i} style={{ padding: '9px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sims.map(sim => {
                      const loan = sim.results?.loanAmount ?? sim.inputs?.loan ?? 0
                      const interest = sim.results?.totalInterest ?? 0
                      const part = totalLoan > 0 ? (loan / totalLoan) * 100 : 0
                      return (
                        <tr key={sim.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = COLOR + '08'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          onClick={() => window.location.href = `/dashboard/mortgage?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                        >
                          <td style={{ padding: '9px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLOR, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--p-text)' }}>{sim.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: COLOR, fontVariantNumeric: 'tabular-nums' }}>{loan > 0 ? fmtCompact(loan) : '—'}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, color: 'var(--p-text-dim)' }}>{sim.inputs?.years != null ? `${sim.inputs.years} ans` : '—'}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{sim.inputs?.rate != null ? `${Number(sim.inputs.rate).toFixed(2)}%` : '—'}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>{sim.results?.monthlyPayment != null ? fmtCompact(sim.results.monthlyPayment) : '—'}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>{interest > 0 ? fmtCompact(interest) : '—'}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                              <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${part}%`, height: '100%', background: COLOR, borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--p-text-dim)', minWidth: 26, textAlign: 'right' }}>{part.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {sims.length > 1 && (
                    <tfoot>
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={1} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 700, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: COLOR, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalLoan)}</td>
                        <td colSpan={2} />
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalMonthly)}/m</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalInterest)}</td>
                        <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 11, color: 'var(--p-text-faint)' }}>100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* ── RIGHT: Insights ── */}
            <div style={{ position: 'sticky', top: 0 }}>
              <div style={{ background: `linear-gradient(135deg, ${COLOR}08, transparent)`, border: `1px solid ${COLOR}20`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: 15 }}>📊</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>Insights & Analyses</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>💸</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>Charge mensuelle</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, margin: 0 }}>
                      {totalMonthly > 0
                        ? `Vos remboursements totalisent ${fmtCompact(totalMonthly)}/mois. Vérifiez que cela reste sous 33% de vos revenus nets.`
                        : 'Simulez un prêt pour voir l\'impact sur votre budget mensuel.'}
                    </p>
                  </div>
                  <div style={{ height: 1, background: 'var(--p-line)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>📈</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>Coût des intérêts</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, margin: 0 }}>
                      {totalInterest > 0 && totalLoan > 0
                        ? `${((totalInterest / totalLoan) * 100).toFixed(1)}% du capital emprunté partira en intérêts (${fmtCompact(totalInterest)}). Comparez les offres pour optimiser.`
                        : 'Renseignez le taux pour voir le coût réel du crédit.'}
                    </p>
                  </div>
                  <div style={{ height: 1, background: 'var(--p-line)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>💡</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>Conseil</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, margin: 0 }}>
                      Négociez l'assurance emprunteur séparément (délégation) : économie possible de 20 à 50% vs l'assurance groupe bancaire.
                    </p>
                  </div>
                  <div style={{ height: 1, background: 'var(--p-line)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>🎯</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>Remboursement anticipé</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, margin: 0 }}>
                      Chaque remboursement anticipé réduit la durée et les intérêts. Vérifiez les IRA (Indemnités de Remboursement Anticipé) dans votre contrat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
