'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
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

// ── Types ─────────────────────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'

interface Position {
  id: string; assetType: string; symbol: string; name: string
  quantity: number; pru: number; currency: string; envelopeId?: string | null
}

interface Envelope {
  id: string; type: EnvelopeType; name: string
  metadata: Record<string, unknown>; positions: Position[]
  positionCount: number; totalValue: number | null
}

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
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function computeInvested(env: Envelope): number {
  if (['PEA', 'CTO'].includes(env.type)) {
    const dep = Number(env.metadata.totalDeposited ?? 0)
    if (dep > 0) return dep
    return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  }
  if (env.type === 'CRYPTO') return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  if (env.type === 'AV') {
    const dep = Number(env.metadata.totalDeposited ?? 0)
    return dep > 0 ? dep : Number(env.metadata.surrenderValue ?? 0)
  }
  if (env.type === 'IMMOBILIER') {
    return Number(env.metadata.purchasePrice ?? env.metadata.currentValue ?? computeMarketValue(env))
  }
  return computeMarketValue(env)
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

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

// ── Category config ────────────────────────────────────────────────────────────
export type Category = 'immobilier' | 'actions' | 'livrets' | 'autres' | 'comptes'

export const CATEGORY_CONFIG: Record<Category, {
  label: string; types: EnvelopeType[]; color: string; description: string
}> = {
  immobilier: { label: 'Immobilier',       types: ['IMMOBILIER'],            color: '#f472b6', description: 'Résidence principale, locatif…' },
  actions:    { label: 'Actions & Fonds',  types: ['PEA', 'CTO', 'AV', 'PER'], color: '#818cf8', description: 'PEA, CTO, Assurance Vie, PER' },
  livrets:    { label: 'Livrets',          types: ['LIVRET'],                color: '#34d399', description: 'Livret A, LDDS, LEP, PEL…' },
  autres:     { label: 'Autres actifs',    types: ['CRYPTO'],                color: '#f59e0b', description: 'Crypto, actifs alternatifs' },
  comptes:    { label: 'Comptes bancaires',types: ['CASH'],                  color: '#94a3b8', description: 'Compte courant, épargne bancaire' },
}

const PLACEHOLDERS: Record<EnvelopeType, string> = {
  LIVRET: 'ex : Mon Livret A', IMMOBILIER: 'ex : Résidence principale',
  PEA: 'ex : Mon PEA Boursorama', AV: 'ex : Linxea Spirit 2',
  CTO: 'ex : CTO Trading 212', CRYPTO: 'ex : Ledger Hardware Wallet',
  PER: 'ex : Mon PER Individuel', CASH: 'ex : Compte courant BNP',
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { category: Category }

export default function PatrimoineCategoryPage({ category }: Props) {
  const catCfg = CATEGORY_CONFIG[category]
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [allEnvelopes, setAllEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'type' | 'name'>('type')
  const [selectedType, setSelectedType] = useState<EnvelopeType | null>(null)
  const [envelopeName, setEnvelopeName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    try {
      const res = await fetch('/api/patrimoine/envelopes')
      if (res.ok) setAllEnvelopes(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const envelopes = useMemo(
    () => allEnvelopes.filter(e => (catCfg.types as string[]).includes(e.type)),
    [allEnvelopes, catCfg.types]
  )

  const { totalValue, totalInvested } = useMemo(() => {
    let tv = 0, ti = 0
    for (const e of envelopes) { tv += computeMarketValue(e); ti += computeInvested(e) }
    return { totalValue: tv, totalInvested: ti }
  }, [envelopes])

  const pl = totalValue - totalInvested
  const plPct = totalInvested > 0 ? (pl / totalInvested) * 100 : 0

  const chartData = useMemo(() => envelopes.map(env => ({
    name: env.name.length > 14 ? env.name.slice(0, 14) + '…' : env.name,
    fullName: env.name,
    investi: computeInvested(env),
    valeur: computeMarketValue(env),
    color: ENVELOPE_TYPE_CONFIG[env.type].color,
  })), [envelopes])

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
      router.push(`/dashboard/patrimoine/${created.id}`)
    } catch {
      toast({ title: 'Erreur lors de la création', variant: 'destructive' })
    } finally { setCreating(false) }
  }

  const openModal = () => {
    const solo = catCfg.types.length === 1
    setStep(solo ? 'name' : 'type')
    setSelectedType(solo ? catCfg.types[0] : null)
    setEnvelopeName('')
    setShowModal(true)
  }

  const availableTypes = catCfg.types.map(
    t => [t, ENVELOPE_TYPE_CONFIG[t]] as [EnvelopeType, typeof ENVELOPE_TYPE_CONFIG[EnvelopeType]]
  )

  const noPlRow = ['LIVRET', 'CASH', 'PER'] as EnvelopeType[]

  return (
    <div className="space-y-6" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>
            <Link href="/dashboard/patrimoine" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>
              Mon Patrimoine
            </Link>
            {' › '}
            <span style={{ color: 'var(--text-muted-c)' }}>{catCfg.label}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{catCfg.label}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: '4px 0 0' }}>{catCfg.description}</p>
        </div>
        <Button onClick={openModal} size="sm" style={{ gap: 6 }}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* KPIs */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur actuelle', value: fmtCompact(totalValue), color: catCfg.color },
            { label: 'Capital investi', value: fmtCompact(totalInvested), color: '#94a3b8' },
            { label: 'Plus-value', value: (pl >= 0 ? '+' : '') + fmtCompact(pl), sub: totalInvested > 0 ? `${plPct >= 0 ? '+' : ''}${plPct.toFixed(1)} %` : '—', color: pl >= 0 ? '#34d399' : '#f87171' },
            { label: 'Enveloppes', value: String(envelopes.length), color: '#818cf8' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {'sub' in kpi && kpi.sub && <div style={{ fontSize: 11, color: kpi.color, marginTop: 2, fontWeight: 600 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Capital investi vs valeur actuelle
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4} barCategoryGap="32%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.tick }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmtCompact(v as number)} tick={{ fontSize: 10, fill: chartTheme.tick }} axisLine={false} tickLine={false} width={64} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtCompact(v), name === 'investi' ? 'Capital investi' : 'Valeur actuelle']}
                  contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 12, color: chartTheme.tooltip.color }}
                  itemStyle={chartTheme.itemStyle}
                  labelStyle={chartTheme.labelStyle}
                  labelFormatter={(_, p) => (p?.[0]?.payload as { fullName: string })?.fullName ?? ''}
                />
                <Bar dataKey="investi" fill="rgba(148,163,184,0.35)" radius={[4, 4, 0, 0]} name="investi" />
                <Bar dataKey="valeur" radius={[4, 4, 0, 0]} name="valeur">
                  {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 20, marginTop: 10, justifyContent: 'center' }}>
              {[
                { color: 'rgba(148,163,184,0.5)', label: 'Capital investi' },
                { color: catCfg.color, label: 'Valeur actuelle' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Envelopes grid */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Mes enveloppes ({envelopes.length})
        </div>

        {loading && <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Chargement…</div>}

        {!loading && envelopes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--card-dark)', border: '2px dashed var(--card-dark-border)', borderRadius: 16 }}>
            <BarChart3 style={{ width: 40, height: 40, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Aucune enveloppe {catCfg.label.toLowerCase()} pour l'instant
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
              Ajoutez votre premier actif dans cette catégorie
            </div>
            <Button onClick={openModal} size="sm">
              <Plus className="h-4 w-4 mr-2" />Ajouter une enveloppe
            </Button>
          </div>
        )}

        {!loading && envelopes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {envelopes.map(env => {
              const cfg = ENVELOPE_TYPE_CONFIG[env.type]
              const Icon = cfg.icon
              const value = computeMarketValue(env)
              const invested = computeInvested(env)
              const hasPL = invested > 0 && !noPlRow.includes(env.type)
              const plEnv = value - invested
              const cap = getCapProgress(env)

              return (
                <Link key={env.id} href={`/dashboard/patrimoine/${env.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ padding: 18, borderRadius: 14, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '60'; (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-dark)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.color + '18', border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 16, height: 16, color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{env.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{cfg.label}</div>
                        </div>
                      </div>
                      <ChevronRight style={{ width: 16, height: 16, color: 'var(--text-subtle)', flexShrink: 0, marginTop: 4 }} />
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginBottom: hasPL || cap ? 8 : 0 }}>
                      {value > 0 ? fmtCompact(value) : <span style={{ color: 'var(--text-subtle)', fontSize: 14 }}>Données à saisir</span>}
                    </div>

                    {hasPL && invested > 0 && (
                      <div style={{ fontSize: 12, color: plEnv >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {plEnv >= 0 ? '+' : ''}{fmtCompact(plEnv)} ({plEnv >= 0 ? '+' : ''}{((plEnv / invested) * 100).toFixed(1)} %)
                      </div>
                    )}

                    {cap && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{env.type === 'PEA' ? 'Versements' : 'Solde'} / plafond</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtCompact(cap.current)} / {fmtCompact(cap.max)}
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: 'var(--section-border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (cap.current / cap.max) * 100).toFixed(1)}%`, background: cfg.color, borderRadius: 999 }} />
                        </div>
                      </div>
                    )}

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

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {step === 'type' ? 'Quel type d\'actif ?' : `Nommer votre ${selectedType ? ENVELOPE_TYPE_CONFIG[selectedType].label : ''}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>Catégorie : {catCfg.label}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {step === 'type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableTypes.map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button key={type}
                      onClick={() => { setSelectedType(type); setStep('name'); setEnvelopeName('') }}
                      style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: 'transparent', border: `1.5px solid var(--card-dark-border)`, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '60'; (e.currentTarget as HTMLElement).style.background = cfg.color + '08' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cfg.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{cfg.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 'name' && selectedType && (
              <div>
                {catCfg.types.length > 1 && (
                  <button onClick={() => setStep('type')} style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0, textDecoration: 'underline' }}>
                    ← Changer de type
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: ENVELOPE_TYPE_CONFIG[selectedType].color + '10', border: `1px solid ${ENVELOPE_TYPE_CONFIG[selectedType].color}30`, marginBottom: 20 }}>
                  {(() => { const Icon = ENVELOPE_TYPE_CONFIG[selectedType].icon; return <Icon style={{ width: 16, height: 16, color: ENVELOPE_TYPE_CONFIG[selectedType].color }} /> })()}
                  <span style={{ fontSize: 13, fontWeight: 600, color: ENVELOPE_TYPE_CONFIG[selectedType].color }}>{ENVELOPE_TYPE_CONFIG[selectedType].label}</span>
                </div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Nom de l'enveloppe</label>
                <Input
                  autoFocus value={envelopeName} onChange={e => setEnvelopeName(e.target.value)}
                  placeholder={PLACEHOLDERS[selectedType]}
                  onKeyDown={e => { if (e.key === 'Enter' && envelopeName.trim()) handleCreate() }}
                  style={{ marginBottom: 20 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Annuler</Button>
                  <Button onClick={handleCreate} disabled={!envelopeName.trim() || creating} style={{ flex: 2 }}>
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
