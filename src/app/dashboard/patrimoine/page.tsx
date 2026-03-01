'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield, Wallet,
  Landmark, Bitcoin, ChevronRight, X, BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { calcPortfolioGeo, type GeoAllocation } from '@/lib/etf-database'

// Carte monde chargée côté client uniquement (SSR incompatible avec react-simple-maps)
const WorldMapChart = dynamic(
  () => import('@/components/WorldMapChart').then(m => m.WorldMapChart),
  { ssr: false, loading: () => <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>Chargement de la carte…</div> }
)

// ── Types ─────────────────────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'

interface Position {
  id: string
  assetType: string
  symbol: string
  name: string
  quantity: number
  pru: number
  currency: string
  envelopeId?: string | null
}

interface Envelope {
  id: string
  type: EnvelopeType
  name: string
  metadata: Record<string, unknown>
  positions: Position[]
  positionCount: number
  totalValue: number | null
}

// ── Config enveloppes ─────────────────────────────────────────────────────────
const ENVELOPE_TYPE_CONFIG: Record<EnvelopeType, {
  label: string; description: string; color: string
  icon: ComponentType<{ style?: object; className?: string }>
  assetClass: string
}> = {
  LIVRET:     { label: 'Livret réglementé', description: 'Livret A, LDDS, LEP, PEL…',           color: '#34d399', icon: PiggyBank,  assetClass: 'Épargne' },
  IMMOBILIER: { label: 'Immobilier',        description: 'Résidence principale, locatif…',       color: '#f472b6', icon: Building2,  assetClass: 'Immobilier' },
  PEA:        { label: 'PEA',              description: 'Plan Épargne Actions — plafond 150 k€',  color: '#818cf8', icon: TrendingUp, assetClass: 'Actions' },
  AV:         { label: 'Assurance Vie',     description: 'Contrat fonds euros ou UC',            color: '#fb923c', icon: Shield,     assetClass: 'Épargne' },
  CTO:        { label: 'Compte-Titres',     description: 'CTO sans limite de versements',        color: '#38bdf8', icon: TrendingUp, assetClass: 'Actions' },
  CRYPTO:     { label: 'Crypto',            description: 'Wallet, exchange (Ledger, Binance…)',  color: '#f59e0b', icon: Bitcoin,    assetClass: 'Crypto' },
  PER:        { label: 'PER',              description: 'Plan Épargne Retraite indiv./collectif', color: '#a78bfa', icon: Landmark,   assetClass: 'Retraite' },
  CASH:       { label: 'Liquidités',        description: 'Compte courant, épargne bancaire',     color: '#94a3b8', icon: Wallet,     assetClass: 'Liquidités' },
}

const PEA_MAX = 150_000

function computeMarketValue(env: Envelope): number {
  if (env.totalValue !== null) return env.totalValue
  // types marché : valeur investie (PRU × quantité) comme proxy
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function getCapProgress(env: Envelope): { current: number; max: number } | null {
  if (env.type === 'PEA') {
    const deposited = Number(env.metadata.totalDeposited ?? 0)
    return deposited > 0 ? { current: deposited, max: PEA_MAX } : null
  }
  if (env.type === 'LIVRET') {
    const balance = Number(env.metadata.balance ?? 0)
    const maxBalance = Number(env.metadata.maxBalance ?? 0)
    if (balance > 0 && maxBalance > 0) return { current: balance, max: maxBalance }
  }
  return null
}

// ── Petit helper format ───────────────────────────────────────────────────────
function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function PatrimoinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)

  // Modal "Ajouter"
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'type' | 'name'>('type')
  const [selectedType, setSelectedType] = useState<EnvelopeType | null>(null)
  const [envelopeName, setEnvelopeName] = useState('')
  const [creating, setCreating] = useState(false)

  // Charger les enveloppes
  const loadEnvelopes = async () => {
    try {
      const res = await fetch('/api/patrimoine/envelopes')
      if (res.ok) setEnvelopes(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEnvelopes() }, [])

  // Stats globales
  const { totalValue, byType, byClass } = useMemo(() => {
    let total = 0
    const byTypeMap: Record<string, number> = {}
    const byClassMap: Record<string, number> = {}

    for (const env of envelopes) {
      const v = computeMarketValue(env)
      total += v
      byTypeMap[env.type] = (byTypeMap[env.type] ?? 0) + v
      const cls = ENVELOPE_TYPE_CONFIG[env.type].assetClass
      byClassMap[cls] = (byClassMap[cls] ?? 0) + v
    }

    return {
      totalValue: total,
      byType: Object.entries(byTypeMap).map(([k, v]) => ({
        name: ENVELOPE_TYPE_CONFIG[k as EnvelopeType].label,
        value: v,
        color: ENVELOPE_TYPE_CONFIG[k as EnvelopeType].color,
      })),
      byClass: Object.entries(byClassMap).map(([k, v]) => ({
        name: k, value: v,
        color: Object.values(ENVELOPE_TYPE_CONFIG).find(c => c.assetClass === k)?.color ?? '#94a3b8',
      })),
    }
  }, [envelopes])

  // Allocation géographique agrégée
  const geoAlloc = useMemo((): GeoAllocation & { values: Partial<Record<keyof GeoAllocation, number>>; totalGeo: number } => {
    const allPositions: { value: number; ticker?: string }[] = []
    for (const env of envelopes) {
      for (const pos of env.positions) {
        if (['ETF', 'STOCK'].includes(pos.assetType)) {
          allPositions.push({ value: pos.pru * pos.quantity, ticker: pos.symbol })
        }
      }
    }
    const geo = calcPortfolioGeo(allPositions)
    const values: Partial<Record<keyof GeoAllocation, number>> = {}
    for (const key of ['northAmerica', 'europe', 'asiaPacific', 'emergingMarkets', 'other'] as const) {
      values[key] = geo[key] * totalValue
    }
    return { ...geo, values, totalGeo: geo.totalValue }
  }, [envelopes, totalValue])

  // Créer une enveloppe
  const handleCreate = async () => {
    if (!selectedType || !envelopeName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/patrimoine/envelopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, name: envelopeName.trim() }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      window.dispatchEvent(new Event('patrimoine-updated'))
      setShowModal(false)
      setStep('type')
      setSelectedType(null)
      setEnvelopeName('')
      router.push(`/dashboard/patrimoine/${created.id}`)
    } catch {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openModal = () => {
    setStep('type')
    setSelectedType(null)
    setEnvelopeName('')
    setShowModal(true)
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 48px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Mon Patrimoine
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: '4px 0 0' }}>
            Vue consolidée de tous vos actifs
          </p>
        </div>
        <Button onClick={openModal} size="sm" style={{ gap: 6 }}>
          <Plus className="h-4 w-4" />
          Ajouter une enveloppe
        </Button>
      </div>

      {/* ── KPI ── */}
      {loading ? (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
          Chargement…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Patrimoine total', value: fmtCompact(totalValue), sub: 'Valeur consolidée (±prix réels)', color: '#f1c086' },
            { label: 'Enveloppes actives', value: String(envelopes.length), sub: 'Comptes et actifs suivis', color: '#818cf8' },
            { label: 'Classes d\'actifs', value: String(new Set(envelopes.map(e => ENVELOPE_TYPE_CONFIG[e.type].assetClass)).size), sub: 'Diversification', color: '#34d399' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts répartition ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { title: 'Répartition par enveloppe', data: byType },
            { title: 'Répartition par classe d\'actifs', data: byClass },
          ].map(chart => (
            <Card key={chart.title} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <CardContent style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {chart.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 120, height: 120, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chart.data} dataKey="value" innerRadius={32} outerRadius={55} paddingAngle={2}>
                          {chart.data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [fmtCompact(v), '']}
                          contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {chart.data.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {totalValue > 0 ? `${((d.value / totalValue) * 100).toFixed(1)} %` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Carte monde ── */}
      {!loading && geoAlloc.totalGeo > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Quelle est la répartition <strong>géographique</strong> de mon patrimoine ?
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>
              Calculé sur {fmtCompact(geoAlloc.totalGeo)} d'actifs boursiers reconnus
            </div>
            <WorldMapChart
              allocation={geoAlloc}
              values={geoAlloc.values}
              totalValue={geoAlloc.totalGeo}
              height={360}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Liste enveloppes ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Mes enveloppes ({envelopes.length})
        </div>

        {loading && (
          <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Chargement…</div>
        )}

        {!loading && envelopes.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--card-dark)', border: '2px dashed var(--card-dark-border)', borderRadius: 16,
          }}>
            <BarChart3 style={{ width: 40, height: 40, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Aucune enveloppe pour l'instant
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
              Commencez par ajouter votre premier actif patrimonial
            </div>
            <Button onClick={openModal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une enveloppe
            </Button>
          </div>
        )}

        {!loading && envelopes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {envelopes.map(env => {
              const cfg = ENVELOPE_TYPE_CONFIG[env.type]
              const Icon = cfg.icon
              const value = computeMarketValue(env)
              const cap = getCapProgress(env)

              return (
                <Link
                  key={env.id}
                  href={`/dashboard/patrimoine/${env.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    padding: 18, borderRadius: 14,
                    background: 'var(--card-dark)',
                    border: '1px solid var(--card-dark-border)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '60'
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--row-hover)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--card-dark)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: cfg.color + '18',
                          border: `1px solid ${cfg.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{env.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{cfg.label}</div>
                        </div>
                      </div>
                      <ChevronRight style={{ width: 16, height: 16, color: 'var(--text-subtle)', flexShrink: 0, marginTop: 4 }} />
                    </div>

                    {/* Valeur */}
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginBottom: cap ? 10 : 0 }}>
                      {value > 0 ? fmtCompact(value) : <span style={{ color: 'var(--text-subtle)', fontSize: 14 }}>Données à saisir</span>}
                    </div>

                    {/* Barre de progression (PEA, Livrets) */}
                    {cap && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            {env.type === 'PEA' ? 'Versements' : 'Solde'} / plafond
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtCompact(cap.current)} / {fmtCompact(cap.max)}
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: 'var(--section-border)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (cap.current / cap.max) * 100).toFixed(1)}%`,
                            background: cfg.color,
                            borderRadius: 999,
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Nb positions */}
                    {env.positionCount > 0 && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-subtle)' }}>
                        {env.positionCount} position{env.positionCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modal Ajouter ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
            borderRadius: 20, width: '100%', maxWidth: 540, padding: 28,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Header modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {step === 'type' ? 'Quel type d\'actif ?' : `Nommer votre ${selectedType ? ENVELOPE_TYPE_CONFIG[selectedType].label : ''}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                  {step === 'type' ? 'Choisissez une catégorie pour continuer' : 'Donnez un nom personnalisé à cette enveloppe'}
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {step === 'type' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.entries(ENVELOPE_TYPE_CONFIG) as [EnvelopeType, typeof ENVELOPE_TYPE_CONFIG[EnvelopeType]][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={type}
                      onClick={() => { setSelectedType(type); setStep('name'); setEnvelopeName('') }}
                      style={{
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        background: 'transparent',
                        border: `1.5px solid var(--card-dark-border)`,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '60'
                        ;(e.currentTarget as HTMLElement).style.background = cfg.color + '08'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', paddingLeft: 40 }}>{cfg.description}</div>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 'name' && selectedType && (
              <div>
                <button
                  onClick={() => setStep('type')}
                  style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0, textDecoration: 'underline' }}
                >
                  ← Changer de type
                </button>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
                  background: ENVELOPE_TYPE_CONFIG[selectedType].color + '10',
                  border: `1px solid ${ENVELOPE_TYPE_CONFIG[selectedType].color}30`,
                  marginBottom: 20,
                }}>
                  {(() => {
                    const Icon = ENVELOPE_TYPE_CONFIG[selectedType].icon
                    return <Icon style={{ width: 16, height: 16, color: ENVELOPE_TYPE_CONFIG[selectedType].color }} />
                  })()}
                  <span style={{ fontSize: 13, fontWeight: 600, color: ENVELOPE_TYPE_CONFIG[selectedType].color }}>
                    {ENVELOPE_TYPE_CONFIG[selectedType].label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                    — {ENVELOPE_TYPE_CONFIG[selectedType].description}
                  </span>
                </div>

                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                  Nom de l'enveloppe
                </label>
                <Input
                  autoFocus
                  value={envelopeName}
                  onChange={e => setEnvelopeName(e.target.value)}
                  placeholder={(() => {
                    const placeholders: Record<EnvelopeType, string> = {
                      LIVRET: 'ex : Mon Livret A', IMMOBILIER: 'ex : Résidence principale',
                      PEA: 'ex : Mon PEA Boursorama', AV: 'ex : Linxea Spirit 2',
                      CTO: 'ex : CTO Trading 212', CRYPTO: 'ex : Ledger Hardware Wallet',
                      PER: 'ex : Mon PER Individuel', CASH: 'ex : Compte courant BNP',
                    }
                    return placeholders[selectedType]
                  })()}
                  onKeyDown={e => { if (e.key === 'Enter' && envelopeName.trim()) handleCreate() }}
                  style={{ marginBottom: 20 }}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!envelopeName.trim() || creating}
                    style={{ flex: 2 }}
                  >
                    {creating ? 'Création…' : 'Créer et configurer →'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
