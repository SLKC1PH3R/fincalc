'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, CreditCard, Plus } from 'lucide-react'
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
  const totalCost = sims.reduce((s, sim) => s + (sim.results?.totalCost ?? 0), 0)

  return (
    <div className="space-y-6" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>
            <Link href="/dashboard/patrimoine" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>
              Mon Patrimoine
            </Link>
            {' › '}
            <span style={{ color: 'var(--text-muted-c)' }}>Emprunts</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Emprunts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: '4px 0 0' }}>
            Crédits immobiliers simulés
          </p>
        </div>
        <Button asChild size="sm" style={{ gap: 6 }}>
          <Link href="/dashboard/mortgage">
            <Plus className="h-4 w-4" />
            Simuler un prêt
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      {!loading && sims.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
          {[
            { label: 'Capital emprunté', value: fmtCompact(totalLoan), color: '#f87171' },
            { label: 'Mensualités totales', value: `${fmtCompact(totalMonthly)} / mois`, color: '#fb923c' },
            { label: 'Coût total financement', value: fmtCompact(totalCost), color: '#94a3b8' },
            { label: 'Simulations', value: String(sims.length), color: '#818cf8' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Simulations list */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Mes simulations de crédit ({sims.length})
        </div>

        {loading && <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Chargement…</div>}

        {!loading && sims.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--card-dark)', border: '2px dashed var(--card-dark-border)', borderRadius: 16 }}>
            <CreditCard style={{ width: 40, height: 40, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Aucun crédit simulé
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
              Utilisez le simulateur de prêt immobilier pour planifier votre financement
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/mortgage">Simuler un prêt immobilier</Link>
            </Button>
          </div>
        )}

        {!loading && sims.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {sims.map(sim => (
              <Link
                key={sim.id}
                href={`/dashboard/mortgage?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{ padding: 18, borderRadius: 14, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f8717160'; (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-dark)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8717118', border: '1px solid #f8717130', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Home style={{ width: 16, height: 16, color: '#f87171' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{sim.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Crédit immobilier</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f87171', fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>
                    {fmtCompact(sim.results?.loanAmount ?? sim.inputs?.loan ?? 0)}
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-subtle)', marginLeft: 4 }}>emprunté</span>
                  </div>

                  <div style={{ display: 'flex', gap: 20 }}>
                    {sim.results?.monthlyPayment != null && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Mensualité</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtCompact(sim.results.monthlyPayment)}
                        </div>
                      </div>
                    )}
                    {sim.inputs?.years != null && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Durée</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{sim.inputs.years} ans</div>
                      </div>
                    )}
                    {sim.inputs?.rate != null && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Taux</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{Number(sim.inputs.rate).toFixed(2)} %</div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
