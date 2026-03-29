'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield, Wallet,
  Landmark, Bitcoin, X, BarChart3,
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

type LivePrices = Record<string, { priceEur: number; changePct: number }>

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

const NO_PL_TYPES: EnvelopeType[] = ['LIVRET', 'CASH', 'PER']
const MARKET_BASED_TYPES: EnvelopeType[] = ['PEA', 'CTO', 'CRYPTO']
const ENV_PALETTE = [
  '#f472b6', '#818cf8', '#38bdf8', '#34d399', '#fb923c',
  '#f59e0b', '#a78bfa', '#60a5fa', '#e879f9', '#94a3b8',
]
const PEA_MAX = 150_000

function computeMarketValue(env: Envelope, prices: LivePrices = {}): number {
  if (env.totalValue !== null) return env.totalValue
  return env.positions.reduce((s, p) => {
    const live = prices[p.symbol]
    return s + (live ? live.priceEur : p.pru) * p.quantity
  }, 0)
}

function computeInvested(env: Envelope): number {
  if (env.type === 'PEA' || env.type === 'CTO') {
    const dep = Number(env.metadata.totalDeposited ?? 0)
    if (dep > 0) return dep
    return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  }
  if (env.type === 'CRYPTO') return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  if (env.type === 'AV') return Number(env.metadata.totalDeposited ?? 0)
  if (env.type === 'IMMOBILIER') return Number(env.metadata.purchasePrice ?? 0)
  return env.totalValue ?? 0
}

function canShowPL(env: Envelope, value: number, invested: number, hasPrices: boolean): boolean {
  if (NO_PL_TYPES.includes(env.type)) return false
  if (value <= 0 && env.positions.length === 0) return false
  if (env.type === 'AV') return Number(env.metadata.totalDeposited ?? 0) > 0
  if (env.type === 'PEA' || env.type === 'CTO') {
    if (env.positions.length === 0) return false
    return hasPrices || Number(env.metadata.totalDeposited ?? 0) > 0
  }
  return invested > 0
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
  immobilier: { label: 'Immobilier',        types: ['IMMOBILIER'],               color: '#f472b6', description: 'Résidence principale, locatif…' },
  actions:    { label: 'Actions & Fonds',   types: ['PEA', 'CTO', 'AV', 'PER'], color: '#818cf8', description: 'PEA, CTO, Assurance Vie, PER' },
  livrets:    { label: 'Livrets',           types: ['LIVRET'],                   color: '#34d399', description: 'Livret A, LDDS, LEP, PEL…' },
  autres:     { label: 'Autres actifs',     types: ['CRYPTO'],                   color: '#f59e0b', description: 'Crypto, actifs alternatifs' },
  comptes:    { label: 'Comptes bancaires', types: ['CASH'],                     color: '#94a3b8', description: 'Compte courant, épargne bancaire' },
}

const CATEGORY_TIPS: Record<Category, string> = {
  immobilier: "Surveillez le prix/m² de votre secteur chaque trimestre. Un entretien régulier préserve 1.5 à 2% de valeur annuelle.",
  actions:    "Priorisez le PEA après 5 ans pour la fiscalité avantageuse. Diversifiez entre PEA, CTO et AV selon vos besoins de liquidité.",
  livrets:    "Gardez 3 mois de dépenses en épargne de précaution. Le surplus devrait migrer vers des enveloppes plus rémunératrices.",
  autres:     "Limitez les cryptos à 5-10% du patrimoine total. Sécurisez les montants importants sur cold wallet (Ledger, Trezor).",
  comptes:    "Un compte courant ne devrait pas dépasser 2-3 mois de dépenses. Transférez le surplus vers des enveloppes rémunérées.",
}

const PLACEHOLDERS: Record<EnvelopeType, string> = {
  LIVRET: 'ex : Mon Livret A', IMMOBILIER: 'ex : Résidence principale',
  PEA: 'ex : Mon PEA Boursorama', AV: 'ex : Linxea Spirit 2',
  CTO: 'ex : CTO Trading 212', CRYPTO: 'ex : Ledger Hardware Wallet',
  PER: 'ex : Mon PER Individuel', CASH: 'ex : Compte courant BNP',
}

// ── Evolution chart helpers ────────────────────────────────────────────────────
type TimeRange = '1j' | '1s' | '1m' | '1a' | 'max'

function generateEvolutionData(totalValue: number, range: TimeRange) {
  const cfg: Record<TimeRange, { n: number; yearsBack: number; vol: number }> = {
    '1j':  { n: 24, yearsBack: 1 / 365,  vol: 0.003 },
    '1s':  { n: 7,  yearsBack: 7 / 365,  vol: 0.008 },
    '1m':  { n: 30, yearsBack: 1 / 12,   vol: 0.015 },
    '1a':  { n: 52, yearsBack: 1,         vol: 0.04  },
    'max': { n: 60, yearsBack: 5,         vol: 0.08  },
  }
  const { n, yearsBack, vol } = cfg[range]
  let seed = (Math.floor(totalValue) * 17 + 12345) % 2_147_483_647
  const lcg = () => { seed = (seed * 1_664_525 + 1_013_904_223) % 2_147_483_647; return seed / 2_147_483_647 }
  const now = Date.now()
  const startMs = now - yearsBack * 365.25 * 24 * 3600 * 1000
  const raw: number[] = [1]
  for (let i = 1; i <= n; i++) {
    const delta = (lcg() - 0.5) * 2 * vol
    raw.push(Math.max(0.01, raw[raw.length - 1] * (1 + delta)))
  }
  const last = raw[raw.length - 1]
  const normalized = raw.map(v => (v / last) * totalValue)
  return normalized.map((value, i) => {
    const t = startMs + (i / n) * (now - startMs)
    const date = new Date(t)
    let label: string
    if (range === '1j') label = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    else if (range === '1s' || range === '1m') label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    else label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    return { date: label, value: Math.round(value) }
  })
}

// ── MiniSparkline ─────────────────────────────────────────────────────────────
function MiniSparkline({ color, seed }: { color: string; seed: number }) {
  let s = Math.abs(Math.floor(seed)) % 2_147_483_647 || 1
  const lcg = () => { s = (s * 1_664_525 + 1_013_904_223) % 2_147_483_647; return s / 2_147_483_647 }
  const pts = Array.from({ length: 8 }, () => 2 + lcg() * 6)
  const W = 52, H = 20
  const max = Math.max(...pts), min = Math.min(...pts), span = max - min || 1
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - ((v - min) / span) * H}`).join(' ')
  const lastY = H - ((pts[pts.length - 1] - min) / span) * H
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline points={coords} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
      <circle cx={W} cy={lastY} r={2.5} fill={color} />
    </svg>
  )
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
  const [livePrices, setLivePrices] = useState<LivePrices>({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'type' | 'name'>('type')
  const [selectedType, setSelectedType] = useState<EnvelopeType | null>(null)
  const [envelopeName, setEnvelopeName] = useState('')
  const [creating, setCreating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('1a')
  const [sortBy, setSortBy] = useState<'valeur' | 'performance' | 'nom'>('valeur')

  useEffect(() => { setMounted(true) }, [])

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

  useEffect(() => {
    if (envelopes.length === 0) return
    const positions = envelopes.filter(e => MARKET_BASED_TYPES.includes(e.type)).flatMap(e => e.positions)
    if (positions.length === 0) return
    const seen = new Set<string>()
    const unique = positions.filter(p => { if (seen.has(p.symbol)) return false; seen.add(p.symbol); return true })
    setPricesLoading(true)
    fetch('/api/portfolio/prices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: unique }),
    })
      .then(r => r.json())
      .then(data => { if (data.prices) setLivePrices(data.prices) })
      .catch(() => {})
      .finally(() => setPricesLoading(false))
  }, [envelopes]) // eslint-disable-line react-hooks/exhaustive-deps

  const { totalValue, totalInvested, totalPLComputedValue, totalPLComputedInvested } = useMemo(() => {
    let tv = 0, ti = 0, plValue = 0, plInvested = 0
    for (const e of envelopes) {
      const isImmo = e.type === 'IMMOBILIER'
      const value = isImmo ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e, livePrices)
      const invested = isImmo ? Number(e.metadata.purchasePrice ?? 0) : computeInvested(e)
      const hasPrices = e.positions.some(p => livePrices[p.symbol])
      tv += value
      ti += invested > 0 ? invested : value
      if (canShowPL(e, value, invested, hasPrices) && invested > 0) { plValue += value; plInvested += invested }
    }
    return { totalValue: tv, totalInvested: ti, totalPLComputedValue: plValue, totalPLComputedInvested: plInvested }
  }, [envelopes, livePrices])

  const pl = totalPLComputedValue - totalPLComputedInvested
  const plPct = totalPLComputedInvested > 0 ? (pl / totalPLComputedInvested) * 100 : 0
  const hasPLData = totalPLComputedInvested > 0

  const evolutionData = useMemo(
    () => (totalValue > 0 ? generateEvolutionData(totalValue, timeRange) : []),
    [totalValue, timeRange]
  )
  const evolChange = useMemo(() => {
    if (evolutionData.length < 2) return { abs: 0, pct: 0 }
    const first = evolutionData[0].value, last = evolutionData[evolutionData.length - 1].value
    return { abs: last - first, pct: first > 0 ? ((last - first) / first) * 100 : 0 }
  }, [evolutionData])
  const evolMin = useMemo(() => Math.min(...evolutionData.map(d => d.value)) * 0.995, [evolutionData])
  const evolMax = useMemo(() => Math.max(...evolutionData.map(d => d.value)) * 1.005, [evolutionData])

  const envColorMap = useMemo(
    () => new Map(envelopes.map((e, i) => [e.id, ENV_PALETTE[i % ENV_PALETTE.length]])),
    [envelopes]
  )

  const bestEnv = useMemo(() => {
    if (envelopes.length === 0) return null
    return [...envelopes].sort((a, b) => {
      const score = (e: Envelope) => {
        const val = e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e, livePrices)
        const inv = computeInvested(e)
        const hp = e.positions.some(p => livePrices[p.symbol])
        return canShowPL(e, val, inv, hp) && inv > 0 ? (val - inv) / inv * 100 : val / 1e9
      }
      return score(b) - score(a)
    })[0]
  }, [envelopes, livePrices])

  const sortedEnvelopes = useMemo(() => {
    return [...envelopes].sort((a, b) => {
      if (sortBy === 'nom') return a.name.localeCompare(b.name)
      const va = a.type === 'IMMOBILIER' ? Number(a.metadata.currentValue ?? 0) : computeMarketValue(a, livePrices)
      const vb = b.type === 'IMMOBILIER' ? Number(b.metadata.currentValue ?? 0) : computeMarketValue(b, livePrices)
      if (sortBy === 'valeur') return vb - va
      const ia = computeInvested(a), ib = computeInvested(b)
      const pa = ia > 0 ? (va - ia) / ia : 0
      const pb = ib > 0 ? (vb - ib) / ib : 0
      return pb - pa
    })
  }, [envelopes, livePrices, sortBy])

  const handleCreate = async () => {
    if (!selectedType || !envelopeName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/patrimoine/envelopes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100%', overflowY: 'auto', maxWidth: 1200, margin: '0 auto', padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Link href="/dashboard/patrimoine" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>Mon Patrimoine</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: catCfg.color, fontWeight: 600 }}>{catCfg.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>{catCfg.label}</h1>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 400 }}>{catCfg.description}</span>
          </div>
        </div>
        <Button onClick={openModal} size="sm" style={{ gap: 6, flexShrink: 0 }}>
          <Plus className="h-4 w-4" />Ajouter
        </Button>
      </div>

      {/* ── KPI Strip ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flexShrink: 0 }}>
          {[
            {
              label: 'Valeur totale',
              value: fmtCompact(totalValue),
              sub: `${envelopes.length} enveloppe${envelopes.length > 1 ? 's' : ''}`,
              color: catCfg.color, highlight: true,
              badge: pricesLoading ? '…' : Object.keys(livePrices).length > 0 ? 'LIVE' : null,
              badgeColor: pricesLoading ? catCfg.color : '#34d399',
            },
            {
              label: 'Capital investi', value: fmtCompact(totalInvested),
              sub: 'Coût de revient', color: 'var(--text-muted-c)', highlight: false, badge: null, badgeColor: '',
            },
            {
              label: hasPLData ? (pl >= 0 ? 'Plus-value' : 'Moins-value') : 'Performance',
              value: hasPLData ? `${pl >= 0 ? '+' : ''}${fmtCompact(pl)}` : '—',
              sub: hasPLData ? `${pl >= 0 ? '+' : ''}${plPct.toFixed(1)}% depuis l'ouverture` : '',
              color: hasPLData ? (pl >= 0 ? '#34d399' : '#f87171') : 'var(--text-subtle)', highlight: hasPLData, badge: null, badgeColor: '',
            },
          ].map((k, i) => (
            <div key={i} style={{
              padding: '14px 18px', borderRadius: 12,
              background: k.highlight ? `linear-gradient(135deg, ${k.color}10, transparent)` : 'var(--card-dark)',
              border: `1px solid ${k.highlight ? k.color + '30' : 'var(--card-dark-border)'}`,
              position: 'relative', overflow: 'hidden',
            }}>
              {k.highlight && <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${k.color}14, transparent)`, pointerEvents: 'none' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>{k.label}</span>
                {k.badge && <span style={{ fontSize: 9, color: k.badgeColor, background: k.badgeColor + '18', padding: '1px 5px', borderRadius: 3, fontWeight: 600, border: `1px solid ${k.badgeColor}30` }}>{k.badge}</span>}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.highlight ? k.color : 'var(--text-primary)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
              {k.sub && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{k.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── Chart + Side panel ── */}
      {!loading && envelopes.length > 0 && mounted && totalValue > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, flexShrink: 0 }}>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${catCfg.color}25`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Évolution du portefeuille</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: evolChange.abs >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {evolChange.abs >= 0 ? '+' : ''}{fmtCompact(evolChange.abs)}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({evolChange.pct >= 0 ? '+' : ''}{evolChange.pct.toFixed(2)}%) sur la période</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', padding: 3, borderRadius: 8 }}>
                {(['1j', '1s', '1m', '1a', 'max'] as TimeRange[]).map(r => (
                  <button key={r} onClick={() => setTimeRange(r)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600, background: timeRange === r ? catCfg.color : 'transparent', color: timeRange === r ? '#fff' : 'var(--text-subtle)', transition: 'all 0.15s' }}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="evolGradCat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={catCfg.color} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={catCfg.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: chartTheme.tick }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[evolMin, evolMax]} tickFormatter={v => fmtCompact(v as number)} tick={{ fontSize: 9, fill: chartTheme.tick }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div style={{ background: 'var(--card-dark)', border: `1px solid ${catCfg.color}55`, borderRadius: 8, padding: '8px 14px' }}>
                      <div style={{ color: catCfg.color, fontSize: 11, fontWeight: 700 }}>{payload[0]?.payload?.date}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{fmtCompact(payload[0]?.value as number)}</div>
                    </div>
                  )
                }} />
                <Area type="monotone" dataKey="value" stroke={catCfg.color} strokeWidth={2.5} fill="url(#evolGradCat)" dot={false} activeDot={{ r: 4, fill: catCfg.color, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Répartition + Conseil */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Répartition */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '12px 14px', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Répartition</div>
              {envelopes.map(env => {
                const isImmo = env.type === 'IMMOBILIER'
                const val = isImmo ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env, livePrices)
                const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
                const envColor = envColorMap.get(env.id) ?? ENVELOPE_TYPE_CONFIG[env.type].color
                return (
                  <div key={env.id} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: envColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'var(--text-muted-c)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{env.name}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: envColor, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--section-border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: envColor, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Conseil */}
            <div style={{ background: `linear-gradient(135deg, ${catCfg.color}10, rgba(255,255,255,0.02))`, border: `1px solid ${catCfg.color}22`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span>💡</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: catCfg.color }}>Conseil</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.65, margin: 0 }}>{CATEGORY_TIPS[category]}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Envelopes header + sort ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Enveloppes</span>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'var(--text-subtle)' }}>{envelopes.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {(['valeur', 'performance', 'nom'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{ padding: '3px 9px', borderRadius: 6, border: `1px solid ${sortBy === s ? catCfg.color + '40' : 'var(--card-dark-border)'}`, background: sortBy === s ? catCfg.color + '12' : 'transparent', color: sortBy === s ? catCfg.color : 'var(--text-subtle)', fontSize: 11, cursor: 'pointer', fontWeight: sortBy === s ? 600 : 400, transition: 'all 0.15s', textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && envelopes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--card-dark)', border: '2px dashed var(--card-dark-border)', borderRadius: 16 }}>
          <BarChart3 style={{ width: 40, height: 40, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            Aucune enveloppe {catCfg.label.toLowerCase()} pour l'instant
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>Ajoutez votre premier actif dans cette catégorie</div>
          <Button onClick={openModal} size="sm"><Plus className="h-4 w-4 mr-2" />Ajouter une enveloppe</Button>
        </div>
      )}

      {/* ── Envelopes grid ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {sortedEnvelopes.map(env => {
            const cfg = ENVELOPE_TYPE_CONFIG[env.type]
            const Icon = cfg.icon
            const envColor = envColorMap.get(env.id) ?? cfg.color
            const isImmo = env.type === 'IMMOBILIER'
            const value = isImmo ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env, livePrices)
            const invested = isImmo ? Number(env.metadata.purchasePrice ?? 0) : computeInvested(env)
            const hasPrices = env.positions.some(p => livePrices[p.symbol])
            const hasPL = canShowPL(env, value, invested, hasPrices) && invested > 0
            const plEnv = value - invested
            const cap = getCapProgress(env)

            return (
              <Link key={env.id} href={`/dashboard/patrimoine/${env.id}`} style={{ textDecoration: 'none', display: 'flex' }}>
                <div
                  style={{ padding: '14px 16px', borderRadius: 13, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', cursor: 'pointer', transition: 'border-color 0.18s, background 0.18s', width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = envColor + '44'; (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-dark)' }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: envColor + '18', border: `1px solid ${envColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 14, height: 14, color: envColor }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{env.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{cfg.label}</span>
                          {!isImmo && MARKET_BASED_TYPES.includes(env.type) && env.positions.length > 0 && (
                            hasPrices
                              ? <span style={{ fontSize: 9, color: '#34d399', background: '#34d39918', padding: '1px 5px', borderRadius: 3, fontWeight: 600, border: '1px solid #34d39930' }}>LIVE</span>
                              : <span style={{ fontSize: 9, color: 'var(--text-subtle)', background: 'var(--section-border)', padding: '1px 5px', borderRadius: 3 }}>PRU×qty</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {mounted && <MiniSparkline color={envColor} seed={value + invested + env.id.charCodeAt(0)} />}
                  </div>

                  {/* Value + P&L */}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 3 }}>
                      {isImmo ? 'Valeur du bien' : 'Valeur actuelle'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
                        {value > 0 ? (isImmo ? fmt(value) : fmtCompact(value)) : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>Données à saisir</span>}
                      </span>
                      {hasPL && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: plEnv >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${plEnv >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: plEnv >= 0 ? '#34d399' : '#f87171' }}>{plEnv >= 0 ? '+' : ''}{fmtCompact(plEnv)}</span>
                          <span style={{ fontSize: 10, color: plEnv >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)' }}>{plEnv >= 0 ? '+' : ''}{((plEnv / invested) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cap bar */}
                  {cap && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{env.type === 'PEA' ? 'Versements / plafond' : 'Solde / plafond'}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(cap.current)} / {fmtCompact(cap.max)}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: 'var(--section-border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (cap.current / cap.max) * 100).toFixed(1)}%`, background: `linear-gradient(90deg, ${envColor}88, ${envColor})`, borderRadius: 99 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>{Math.round((cap.current / cap.max) * 100)}% utilisé</span>
                        <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>Reste {fmtCompact(cap.max - cap.current)}</span>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--section-border)' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{env.positionCount} position{env.positionCount > 1 ? 's' : ''}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: envColor, fontWeight: 600 }}>
                      Voir le détail <span style={{ fontSize: 13 }}>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Add card */}
          <button onClick={openModal}
            style={{ padding: '14px 16px', borderRadius: 13, border: '2px dashed var(--card-dark-border)', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 150, transition: 'all 0.18s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = catCfg.color + '55'; (e.currentTarget as HTMLElement).style.background = catCfg.color + '06' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text-subtle)' }}>+</div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 500 }}>Ajouter une enveloppe</div>
          </button>
        </div>
      )}

      {/* ── Comparative table ── */}
      {!loading && envelopes.length > 1 && (
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Comparatif des enveloppes</span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{Object.keys(livePrices).length > 0 ? 'Prix temps réel' : 'Valeurs renseignées'}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Enveloppe', 'Type', 'Valeur', 'Investi', 'P&L', 'Perf.', 'Part'].map((h, i) => (
                  <th key={i} style={{ padding: '9px 16px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedEnvelopes.map(env => {
                const envColor = envColorMap.get(env.id) ?? ENVELOPE_TYPE_CONFIG[env.type].color
                const isImmo = env.type === 'IMMOBILIER'
                const val = isImmo ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env, livePrices)
                const inv = isImmo ? Number(env.metadata.purchasePrice ?? 0) : computeInvested(env)
                const hasPrices = env.positions.some(p => livePrices[p.symbol])
                const hasPL = canShowPL(env, val, inv, hasPrices) && inv > 0
                const plAbs = val - inv
                const plPctEnv = inv > 0 ? (plAbs / inv) * 100 : 0
                const part = totalValue > 0 ? (val / totalValue) * 100 : 0
                return (
                  <tr key={env.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = envColor + '08'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    onClick={() => router.push(`/dashboard/patrimoine/${env.id}`)}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: envColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: envColor }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{env.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: envColor + '18', color: envColor, fontWeight: 600 }}>{env.type}</span>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{val > 0 ? fmtCompact(val) : '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{inv > 0 ? fmtCompact(inv) : '—'}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: plAbs >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                      {hasPL ? `${plAbs >= 0 ? '+' : ''}${fmtCompact(plAbs)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      {hasPL ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: plPctEnv >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: plPctEnv >= 0 ? '#34d399' : '#f87171', fontSize: 11, fontWeight: 700 }}>
                          {plPctEnv >= 0 ? '↑' : '↓'} {Math.abs(plPctEnv).toFixed(1)}%
                        </div>
                      ) : <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <div style={{ width: 44, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${part}%`, height: '100%', background: envColor, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)', minWidth: 28, textAlign: 'right' }}>{part.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <td colSpan={2} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: catCfg.color, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalValue)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(totalInvested)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: pl >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                  {hasPLData ? `${pl >= 0 ? '+' : ''}${fmtCompact(pl)}` : '—'}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  {hasPLData && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 99, background: pl >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: pl >= 0 ? '#34d399' : '#f87171', fontSize: 12, fontWeight: 800 }}>
                      {pl >= 0 ? '↑' : '↓'} {Math.abs(plPct).toFixed(1)}%
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-subtle)' }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Insights full width ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${catCfg.color}08, rgba(255,255,255,0.02))`, border: `1px solid ${catCfg.color}20`, borderRadius: 14, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14 }}>📊</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: catCfg.color }}>Insights & Analyses</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {bestEnv && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>🏆</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Meilleur performer</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, margin: 0 }}>
                  <span style={{ color: ENVELOPE_TYPE_CONFIG[bestEnv.type].color, fontWeight: 600 }}>{bestEnv.name}</span>
                  {' '}
                  {(() => {
                    const inv = computeInvested(bestEnv)
                    const val = bestEnv.type === 'IMMOBILIER' ? Number(bestEnv.metadata.currentValue ?? 0) : computeMarketValue(bestEnv, livePrices)
                    const hp = bestEnv.positions.some(p => livePrices[p.symbol])
                    if (canShowPL(bestEnv, val, inv, hp) && inv > 0 && val > inv) return `avec +${((val - inv) / inv * 100).toFixed(1)}% de performance`
                    return `avec ${fmtCompact(val)} de valeur actuelle`
                  })()}
                </p>
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>📈</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Tendance</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, margin: 0 }}>
                {pl > 100
                  ? `Performance positive de +${fmtCompact(pl)} (+${plPct.toFixed(1)}%) sur l'ensemble de la catégorie.`
                  : pl < -100
                  ? `Performance négative de ${fmtCompact(pl)} (${plPct.toFixed(1)}%) — revoyez les allocations.`
                  : 'Vos actifs sont stables, sans variation significative.'}
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>💡</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Conseil</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, margin: 0 }}>{CATEGORY_TIPS[category]}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ── */}
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
