'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield, Wallet,
  Landmark, Bitcoin, ChevronRight, X, BarChart3, CreditCard,
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

// ── Évolution simulée ─────────────────────────────────────────────────────────
type TimeRange = '1j' | '1s' | '1m' | '1a' | 'max'

function generateEvolutionData(totalValue: number, range: TimeRange) {
  if (totalValue <= 0) return []
  const cfg: Record<TimeRange, { n: number; yearsBack: number; vol: number }> = {
    '1j':  { n: 25, yearsBack: 1 / 365,  vol: 0.006 },
    '1s':  { n: 8,  yearsBack: 7 / 365,  vol: 0.010 },
    '1m':  { n: 31, yearsBack: 1 / 12,   vol: 0.012 },
    '1a':  { n: 13, yearsBack: 1,         vol: 0.040 },
    'max': { n: 61, yearsBack: 5,         vol: 0.040 },
  }
  const { n, yearsBack, vol } = cfg[range]
  const annualReturn = 0.065
  const startValue = totalValue / Math.pow(1 + annualReturn, yearsBack)
  const stepReturn = Math.pow(1 + annualReturn, yearsBack / n) - 1

  // LCG seeded pour reproductibilité
  let seed = (Math.floor(totalValue) * 17 + 12345) % 2_147_483_647
  const rand = () => { seed = (seed * 16807) % 2_147_483_647; return seed / 2_147_483_647 }

  const pts: number[] = [startValue]
  for (let i = 1; i < n; i++) {
    const prev = pts[pts.length - 1]
    pts.push(Math.max(prev * (1 + stepReturn) + (rand() - 0.5) * 2 * vol * prev, startValue * 0.7))
  }
  // Normaliser pour que le dernier point = totalValue
  const scale = totalValue / pts[pts.length - 1]
  pts.forEach((_, i) => { pts[i] = Math.round(pts[i] * scale) })
  pts[pts.length - 1] = Math.round(totalValue)

  const now = new Date()
  return pts.map((value, i) => {
    const t = new Date(now.getTime() - (1 - i / (n - 1)) * yearsBack * 365.25 * 86_400_000)
    let date: string
    if (range === '1j') date = `${String(t.getHours()).padStart(2, '0')}h`
    else if (range === '1s') date = t.toLocaleDateString('fr-FR', { weekday: 'short' })
    else if (range === '1m') date = t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    else date = t.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    return { date, value }
  })
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function PatrimoinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1a')

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
  const totalValue = useMemo(() => envelopes.reduce((sum, e) => sum + computeMarketValue(e), 0), [envelopes])

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

  // Données évolution
  const evolutionData = useMemo(() => generateEvolutionData(totalValue, timeRange), [totalValue, timeRange])
  const evolMin = useMemo(() => evolutionData.length ? Math.min(...evolutionData.map(d => d.value)) * 0.98 : 0, [evolutionData])
  const evolMax = useMemo(() => evolutionData.length ? Math.max(...evolutionData.map(d => d.value)) * 1.02 : 0, [evolutionData])
  const evolChange = useMemo(() => {
    if (evolutionData.length < 2) return 0
    return evolutionData[evolutionData.length - 1].value - evolutionData[0].value
  }, [evolutionData])

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

      {/* ── Category cards ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {[
            { href: '/dashboard/patrimoine/immobilier', label: 'Immobilier',        icon: Building2,  color: '#f472b6', types: ['IMMOBILIER'] },
            { href: '/dashboard/patrimoine/actions',    label: 'Actions & Fonds',   icon: TrendingUp, color: '#818cf8', types: ['PEA','CTO','AV','PER'] },
            { href: '/dashboard/patrimoine/livrets',    label: 'Livrets',           icon: PiggyBank,  color: '#34d399', types: ['LIVRET'] },
            { href: '/dashboard/patrimoine/autres',     label: 'Autres actifs',     icon: Bitcoin,    color: '#f59e0b', types: ['CRYPTO'] },
            { href: '/dashboard/patrimoine/comptes',    label: 'Comptes bancaires', icon: Wallet,     color: '#94a3b8', types: ['CASH'] },
            { href: '/dashboard/patrimoine/emprunts',   label: 'Emprunts',          icon: CreditCard, color: '#f87171', types: [] },
          ].map(cat => {
            const Icon = cat.icon
            const catValue = envelopes
              .filter(e => (cat.types as string[]).includes(e.type))
              .reduce((s, e) => s + (e.totalValue ?? e.positions.reduce((ps, p) => ps + p.pru * p.quantity, 0)), 0)
            const count = envelopes.filter(e => (cat.types as string[]).includes(e.type)).length
            return (
              <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cat.color + '55'; (e.currentTarget as HTMLElement).style.background = cat.color + '08' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-dark)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 13, height: 13, color: cat.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{cat.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: cat.color, fontVariantNumeric: 'tabular-nums' }}>
                    {cat.types.length === 0 ? '—' : catValue > 0 ? fmtCompact(catValue) : count > 0 ? `${count} env.` : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>Vide</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Évolution du patrimoine ── */}
      {!loading && totalValue > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Évolution du patrimoine
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                  Simulation estimée — {fmtCompact(totalValue)}
                  {evolChange !== 0 && (
                    <span style={{ marginLeft: 6, color: evolChange >= 0 ? '#34d399' : '#f87171' }}>
                      {evolChange >= 0 ? '+' : ''}{fmtCompact(evolChange)} sur la période
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['1j', '1s', '1m', '1a', 'max'] as TimeRange[]).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)} style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: timeRange === r ? '#f97316' : 'transparent',
                    color: timeRange === r ? '#fff' : 'var(--text-subtle)',
                    border: `1px solid ${timeRange === r ? '#f97316' : 'var(--card-dark-border)'}`,
                    transition: 'all 0.15s',
                  }}>
                    {r === 'max' ? 'Max' : r}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 180, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="evolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false}
                    interval="preserveStartEnd" />
                  <YAxis domain={[evolMin, evolMax]} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false}
                    tickFormatter={v => fmtCompact(v)} width={64} />
                  <Tooltip
                    formatter={(v: number) => [fmtCompact(v), 'Patrimoine']}
                    contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 12, color: chartTheme.tooltip.color }}
                    itemStyle={chartTheme.itemStyle}
                    labelStyle={chartTheme.labelStyle}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2}
                    fill="url(#evolGrad)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── KPIs (gauche) + Répartition tabulée (droite) ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'stretch' }}>
          {/* KPIs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Patrimoine total', value: fmtCompact(totalValue), sub: 'Valeur consolidée (±prix réels)', color: '#f97316' },
              { label: 'Enveloppes actives', value: String(envelopes.length), sub: 'Comptes et actifs suivis', color: '#818cf8' },
              { label: 'Classes d\'actifs', value: String(new Set(envelopes.map(e => ENVELOPE_TYPE_CONFIG[e.type].assetClass)).size), sub: 'Diversification', color: '#34d399' },
            ].map(kpi => (
              <div key={kpi.label} style={{
                flex: 1,
                padding: '16px 20px', borderRadius: 12,
                background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
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

          {/* Carte monde */}
          <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ padding: 20, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Quelle est la répartition <strong>géographique</strong> de mon patrimoine ?
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>
                {geoAlloc.totalGeo > 0
                  ? <>Calculé sur {fmtCompact(geoAlloc.totalGeo)} d'actifs boursiers reconnus</>
                  : 'Ajoutez des ETFs ou actions pour voir la répartition géographique'}
              </div>
              {geoAlloc.totalGeo > 0 && (
                <WorldMapChart
                  allocation={geoAlloc}
                  values={geoAlloc.values}
                  totalValue={geoAlloc.totalGeo}
                  height={300}
                />
              )}
            </CardContent>
          </Card>
        </div>
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
