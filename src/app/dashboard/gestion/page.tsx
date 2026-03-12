'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Flag, Target, FileText, ChevronRight,
  CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Building2, PiggyBank, Wallet, Bitcoin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Goal {
  id: string
  title: string
  targetAmount: number
  targetDate?: string
  color: string
  envelopeId?: string
}

interface Envelope {
  id: string
  type: string
  name: string
  totalValue: number | null
  positions: { pru: number; quantity: number }[]
  createdAt: string
}

const ASSET_CLASSES = [
  { key: 'actions',  label: 'Actions & Fonds', types: ['PEA', 'CTO', 'AV', 'PER'], color: '#f97316', icon: TrendingUp },
  { key: 'immo',    label: 'Immobilier',       types: ['IMMOBILIER'],              color: '#3b82f6', icon: Building2  },
  { key: 'livrets', label: 'Livrets',           types: ['LIVRET'],                  color: '#22c55e', icon: PiggyBank  },
  { key: 'crypto',  label: 'Crypto',            types: ['CRYPTO'],                  color: '#a855f7', icon: Bitcoin    },
  { key: 'cash',    label: 'Cash',              types: ['CASH'],                    color: '#64748b', icon: Wallet     },
]

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k€`
  return `${Math.round(n)}€`
}

function monthsUntil(dateStr: string) {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
}

function envValue(e: Envelope) {
  if (e.totalValue !== null) return e.totalValue
  return e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

export default function GestionPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/patrimoine/envelopes').then(r => r.json()),
    ]).then(([goalsData, envData]) => {
      const g: Goal[] = Array.isArray(goalsData) ? goalsData : []
      const e: Envelope[] = Array.isArray(envData) ? envData : []
      setGoals(g)
      setEnvelopes(e)
      const prog: Record<string, number> = {}
      for (const goal of g) {
        const stored = localStorage.getItem(`fincalc_goal_progress_${goal.id}`)
        if (stored) prog[goal.id] = Number(stored)
      }
      setGoalProgress(prog)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Allocation
  const totalWealth = envelopes.reduce((s, e) => s + envValue(e), 0)
  const allocation = ASSET_CLASSES.map(cls => {
    const val = envelopes.filter(e => cls.types.includes(e.type)).reduce((s, e) => s + envValue(e), 0)
    return { ...cls, value: val, pct: totalWealth > 0 ? (val / totalWealth) * 100 : 0 }
  }).filter(a => a.pct > 0)

  // Goals with progress
  const goalsWithPct = goals.map(g => {
    const linked = envelopes.find(e => e.id === g.envelopeId)
    const current = linked ? envValue(linked) : (goalProgress[g.id] ?? 0)
    const pct = Math.min(100, g.targetAmount > 0 ? (current / g.targetAmount) * 100 : 0)
    return { ...g, current, pct }
  }).sort((a, b) => {
    // Prioritize: urgent deadline < in progress < completed
    const aMonths = a.targetDate ? monthsUntil(a.targetDate) : 999
    const bMonths = b.targetDate ? monthsUntil(b.targetDate) : 999
    if (aMonths < 6 && bMonths >= 6) return -1
    if (bMonths < 6 && aMonths >= 6) return 1
    return a.pct - b.pct // least progress first
  })

  const avgGoalPct = goalsWithPct.length > 0
    ? Math.round(goalsWithPct.reduce((s, g) => s + g.pct, 0) / goalsWithPct.length)
    : 0

  // Fiscal milestones
  const fiscalEnvelopes = envelopes
    .filter(e => ['PEA', 'AV', 'PER'].includes(e.type))
    .map(e => {
      const ageMonths = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      const targetMonths = e.type === 'PEA' ? 60 : e.type === 'AV' ? 96 : 0
      const reached = e.type === 'PER' || ageMonths >= targetMonths
      const monthsLeft = e.type === 'PER' ? 0 : Math.max(0, targetMonths - ageMonths)
      const milestone = e.type === 'PEA' ? 'Exonération après 5 ans'
        : e.type === 'AV' ? 'Abattement après 8 ans'
        : 'Déduction fiscale active'
      return { ...e, ageMonths, monthsLeft, reached, milestone, targetMonths }
    })
    .sort((a, b) => a.monthsLeft - b.monthsLeft)

  const fiscalReached = fiscalEnvelopes.filter(e => e.reached).length

  if (loading) {
    return (
      <div className="px-7 py-8 max-w-4xl space-y-6 animate-fade-in">
        <div className="h-8 w-64 rounded-lg animate-pulse bg-muted mb-2" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse bg-muted" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl animate-pulse bg-muted" />)}
      </div>
    )
  }

  return (
    <div className="px-7 py-8 max-w-4xl space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Gestion personnelle</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vue synthétique de vos objectifs, allocation et situation fiscale
        </p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Objectifs',
            value: goals.length > 0 ? `${avgGoalPct}%` : '—',
            sub: goals.length > 0 ? `${goals.length} objectif${goals.length > 1 ? 's' : ''} · avancement moyen` : 'Aucun objectif défini',
            color: '#f97316',
            href: '/dashboard/goals',
          },
          {
            label: 'Allocation',
            value: allocation.length > 0 ? `${allocation.length} classe${allocation.length > 1 ? 's' : ''}` : '—',
            sub: totalWealth > 0 ? `${fmtK(totalWealth)} patrimoine total` : 'Aucun actif enregistré',
            color: '#3b82f6',
            href: '/dashboard/rebalancing',
          },
          {
            label: 'Fiscal',
            value: fiscalEnvelopes.length > 0 ? `${fiscalReached}/${fiscalEnvelopes.length}` : '—',
            sub: fiscalEnvelopes.length > 0 ? `jalon${fiscalReached > 1 ? 's' : ''} fiscal${fiscalReached > 1 ? 'aux' : ''} atteint${fiscalReached > 1 ? 's' : ''}` : 'Aucune enveloppe fiscale',
            color: '#22c55e',
            href: '/dashboard/tax-report',
          },
        ].map(stat => (
          <Link key={stat.href} href={stat.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = stat.color + '55')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-dark-border)')}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginTop: 3 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>
                {stat.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Mes Objectifs ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag style={{ width: 14, height: 14, color: '#f97316' }} />
              Mes Objectifs
            </CardTitle>
            <Link href="/dashboard/goals"
              style={{ fontSize: 12, color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              Gérer <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {goalsWithPct.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 8 }}>
                Aucun objectif défini. Fixez-vous des cibles pour suivre votre progression.
              </p>
              <Link href="/dashboard/goals"
                style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
                Créer mon premier objectif →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {goalsWithPct.slice(0, 4).map(g => {
                const urgent = g.targetDate && monthsUntil(g.targetDate) < 6 && monthsUntil(g.targetDate) >= 0
                const overdue = g.targetDate && monthsUntil(g.targetDate) < 0
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: g.color, flexShrink: 0, display: 'inline-block',
                        }} />
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {g.title}
                        </span>
                        {overdue && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(248,113,113,0.12)', color: '#f87171', fontWeight: 600, flexShrink: 0 }}>
                            Échu
                          </span>
                        )}
                        {urgent && !overdue && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', fontWeight: 600, flexShrink: 0 }}>
                            Urgent
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                          {fmtK(g.current)} / {fmtK(g.targetAmount)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: g.pct >= 100 ? '#22c55e' : 'var(--text-em)', width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(g.pct)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${g.pct}%`,
                        borderRadius: 99,
                        background: g.pct >= 100 ? '#22c55e' : g.color,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
              {goalsWithPct.length > 4 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textAlign: 'center', paddingTop: 4 }}>
                  +{goalsWithPct.length - 4} autres objectifs
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Allocation & Rééquilibrage ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target style={{ width: 14, height: 14, color: '#3b82f6' }} />
              Allocation actuelle
            </CardTitle>
            <Link href="/dashboard/rebalancing"
              style={{ fontSize: 12, color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              Rééquilibrer <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {totalWealth === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 8 }}>
                Aucun actif enregistré dans le patrimoine.
              </p>
              <Link href="/dashboard/patrimoine"
                style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
                Ajouter des enveloppes →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {allocation.map(a => (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <a.icon style={{ width: 12, height: 12, color: a.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{a.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{fmtK(a.value)}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: a.color, width: 38, textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {a.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${a.pct}%`,
                      borderRadius: 99, background: a.color,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', paddingTop: 4 }}>
                Définissez vos cibles d'allocation sur la page Rééquilibrage pour identifier les écarts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Situation fiscale ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText style={{ width: 14, height: 14, color: '#22c55e' }} />
              Situation fiscale
            </CardTitle>
            <Link href="/dashboard/tax-report"
              style={{ fontSize: 12, color: '#f97316', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              Rapport complet <ChevronRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {fiscalEnvelopes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 8 }}>
                Aucune enveloppe fiscale (PEA, Assurance-Vie, PER) enregistrée.
              </p>
              <Link href="/dashboard/patrimoine"
                style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
                Ajouter des enveloppes →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {fiscalEnvelopes.map(e => {
                const progressPct = e.type === 'PER' ? 100
                  : Math.min(100, (e.ageMonths / e.targetMonths) * 100)
                return (
                  <div key={e.id} className="flex items-start gap-3">
                    <div style={{ paddingTop: 2, flexShrink: 0 }}>
                      {e.reached
                        ? <CheckCircle2 style={{ width: 14, height: 14, color: '#22c55e' }} />
                        : e.monthsLeft <= 12
                          ? <Clock style={{ width: 14, height: 14, color: '#fbbf24' }} />
                          : <AlertTriangle style={{ width: 14, height: 14, color: 'var(--text-subtle)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {e.name}
                          </span>
                          <span style={{
                            fontSize: 9, padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-muted-c)', fontWeight: 700, letterSpacing: '0.05em',
                          }}>
                            {e.type}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: e.reached ? '#22c55e' : e.monthsLeft <= 12 ? '#fbbf24' : 'var(--text-muted-c)',
                        }}>
                          {e.reached ? 'Atteint ✓'
                            : e.type === 'PER' ? 'Active'
                              : e.monthsLeft < 1 ? 'Ce mois-ci'
                                : `Dans ${e.monthsLeft} mois`}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 5 }}>
                        {e.milestone}
                        {e.type !== 'PER' && (
                          <span style={{ marginLeft: 6, color: 'var(--text-subtle)' }}>
                            · {Math.floor(e.ageMonths / 12)}a {e.ageMonths % 12}m
                          </span>
                        )}
                      </div>
                      {e.type !== 'PER' && (
                        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            borderRadius: 99,
                            background: e.reached ? '#22c55e' : e.monthsLeft <= 12 ? '#fbbf24' : '#3b82f6',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
