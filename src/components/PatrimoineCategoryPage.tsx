'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield, Wallet,
  Landmark, Bitcoin, X, BarChart3, Award, Lightbulb, ArrowUpRight, ArrowDownRight,
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

// ── EvolutionChart ────────────────────────────────────────────────────────────
function EvolutionChart({ data, color, evolMin, evolMax }: {
  data: { date: string; value: number }[]; color: string; evolMin: number; evolMax: number
}) {
  const W = 800, H = 140, PAD = { l: 54, r: 8, t: 8, b: 32 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const N = data.length - 1
  if (N < 1) return null
  const range = evolMax - evolMin || 1
  const xy = (i: number, v: number) => ({ x: PAD.l + (i / N) * w, y: PAD.t + h - ((v - evolMin) / range) * h })
  const pts = data.map((d, i) => xy(i, d.value))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${pts[N].x},${PAD.t + h} L${pts[0].x},${PAD.t + h} Z`
  const fmtK = (n: number) => Math.abs(n) >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))
  const yTicks = [evolMin, evolMin + range * 0.5, evolMax]
  const step = Math.max(1, Math.floor(N / 5))
  const xLabels = data.map((d, i) => ({ d, i })).filter(({ i }) => i === 0 || i === N || i % step === 0)
  const gradId = `eg${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = PAD.t + h - ((t - evolMin) / range) * h
        return <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(128,128,128,0.12)" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{fmtK(t)}€</text>
        </g>
      })}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {xLabels.map(({ d, i }) => {
        const p = xy(i, d.value)
        return <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{d.date}</text>
      })}
      <circle cx={pts[N].x} cy={pts[N].y} r={4} fill={color} />
      <circle cx={pts[N].x} cy={pts[N].y} r={9} fill={color} opacity={0.18} />
    </svg>
  )
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--p-bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid var(--p-line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 4 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
              <Link href="/dashboard/patrimoine" style={{ color: 'var(--p-text-faint)', textDecoration: 'none' }}>Mon Patrimoine</Link>
              <span style={{ opacity: 0.5 }}>›</span>
              <span style={{ color: catCfg.color }}>{catCfg.label}</span>
            </div>
            <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
              {catCfg.label}<span style={{ color: catCfg.color }}>.</span>
            </h1>
            <div style={{ fontSize: 12, color: 'var(--p-text-faint)', marginTop: 6 }}>{catCfg.description}</div>
          </div>
          <Button onClick={openModal} size="sm" style={{ gap: 6, flexShrink: 0 }}>
            <Plus className="h-4 w-4" />Ajouter
          </Button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!loading && envelopes.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--p-card)', border: '2px dashed var(--p-line)', borderRadius: 16, maxWidth: 420 }}>
            <BarChart3 style={{ width: 40, height: 40, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text)', marginBottom: 6 }}>
              Aucune enveloppe {catCfg.label.toLowerCase()} pour l'instant
            </div>
            <div style={{ fontSize: 13, color: 'var(--p-text-faint)', marginBottom: 20 }}>Ajoutez votre premier actif dans cette catégorie</div>
            <Button onClick={openModal} size="sm"><Plus className="h-4 w-4 mr-2" />Ajouter une enveloppe</Button>
          </div>
        </div>
      )}

      {/* ── 3-col layout ── */}
      {!loading && envelopes.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', gap: 18, alignItems: 'start' }}>

            {/* ── LEFT: Envelopes list ── */}
            <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Header + sort */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--p-mono)' }}>Enveloppes</span>
                  <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 99, background: catCfg.color + '20', color: catCfg.color, fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{envelopes.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 2, background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 7, padding: 2 }}>
                  {(['valeur', 'perf', 'nom'] as const).map(s => {
                    const key = s === 'perf' ? 'performance' : s as 'valeur' | 'nom'
                    return (
                      <button key={s} onClick={() => setSortBy(key)} style={{ padding: '2px 8px', borderRadius: 5, border: 'none', background: sortBy === key ? catCfg.color : 'transparent', color: sortBy === key ? '#fff' : 'var(--p-text-faint)', fontSize: 9.5, cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</button>
                    )
                  })}
                </div>
              </div>

              {/* Envelope cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  const pct = totalValue > 0 ? (value / totalValue) * 100 : 0
                  return (
                    <Link key={env.id} href={`/dashboard/patrimoine/${env.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--p-card)', border: '1px solid var(--p-line)', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = envColor + '60'; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${envColor}12` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p-line)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
                      >
                        {/* Top row: icon + name + sparkline */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${envColor}22, ${envColor}10)`, border: `1px solid ${envColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon style={{ width: 14, height: 14, color: envColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{env.name}</div>
                            <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.06em', marginTop: 1 }}>{cfg.label}</div>
                          </div>
                          {mounted && <MiniSparkline color={envColor} seed={value + invested + env.id.charCodeAt(0)} />}
                        </div>
                        {/* Value row */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)', letterSpacing: '-0.02em' }}>
                            {value > 0 ? fmtCompact(value) : <span style={{ color: 'var(--p-text-faint)', fontSize: 12 }}>—</span>}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {hasPL && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: plEnv >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                {plEnv >= 0 ? <ArrowUpRight style={{ width: 10, height: 10 }} /> : <ArrowDownRight style={{ width: 10, height: 10 }} />}
                                {Math.abs((plEnv / invested) * 100).toFixed(1)}%
                              </span>
                            )}
                            <span style={{ fontSize: 10, color: envColor, fontFamily: 'var(--p-mono)', fontWeight: 700 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 3, borderRadius: 99, background: 'var(--p-line)', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${envColor}aa, ${envColor})`, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Add card */}
                <button onClick={openModal}
                  style={{ padding: '11px 14px', borderRadius: 14, border: `1.5px dashed ${catCfg.color}40`, background: `${catCfg.color}04`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = catCfg.color + '80'; (e.currentTarget as HTMLElement).style.background = catCfg.color + '08' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = catCfg.color + '40'; (e.currentTarget as HTMLElement).style.background = catCfg.color + '04' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px dashed ${catCfg.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus style={{ width: 14, height: 14, color: catCfg.color }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)', fontWeight: 500 }}>Ajouter une enveloppe</span>
                </button>
              </div>
            </div>

            {/* ── CENTER ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* KPI strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {/* Card 1 — Valeur totale (hero) */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: `linear-gradient(135deg, ${catCfg.color}14 0%, transparent 60%), var(--p-card)`, border: `1px solid ${catCfg.color}35`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -24, right: -16, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(ellipse, ${catCfg.color}18, transparent)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 9.5, color: catCfg.color, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>Valeur totale</span>
                    {(pricesLoading || Object.keys(livePrices).length > 0) && (
                      <span style={{ fontSize: 8.5, color: pricesLoading ? catCfg.color : '#34d399', background: (pricesLoading ? catCfg.color : '#34d399') + '20', padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{pricesLoading ? '…' : 'LIVE'}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--p-mono)', fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: catCfg.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{fmtCompact(totalValue)}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{envelopes.length} enveloppe{envelopes.length > 1 ? 's' : ''}</div>
                </div>
                {/* Card 2 — Capital investi */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 8 }}>Capital investi</div>
                  <div style={{ fontFamily: 'var(--p-mono)', fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 700, color: 'var(--p-text-em)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{fmtCompact(totalInvested)}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Coût de revient</div>
                </div>
                {/* Card 3 — P&L */}
                <div style={{ padding: '16px 20px', borderRadius: 16, background: hasPLData ? `linear-gradient(135deg, ${pl >= 0 ? '#34d399' : '#f87171'}10, transparent), var(--p-card)` : 'var(--p-card)', border: `1px solid ${hasPLData ? (pl >= 0 ? '#34d39930' : '#f8717130') : 'var(--p-line)'}` }}>
                  <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 8 }}>{hasPLData ? (pl >= 0 ? 'Plus-value' : 'Moins-value') : 'Performance'}</div>
                  <div style={{ fontFamily: 'var(--p-mono)', fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 700, color: hasPLData ? (pl >= 0 ? '#34d399' : '#f87171') : 'var(--p-text-faint)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                    {hasPLData ? `${pl >= 0 ? '+' : ''}${fmtCompact(pl)}` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{hasPLData ? `${pl >= 0 ? '+' : ''}${plPct.toFixed(1)}% depuis l'ouverture` : 'Renseignez le coût d\'acquisition'}</div>
                </div>
              </div>

              {/* Evolution chart */}
              {mounted && totalValue > 0 && (
                <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 4 }}>Évolution du portefeuille</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--p-mono)', fontSize: 20, fontWeight: 800, color: 'var(--p-text-em)', letterSpacing: '-0.04em' }}>{fmtCompact(totalValue)}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: evolChange.abs >= 0 ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {evolChange.abs >= 0 ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                          {evolChange.abs >= 0 ? '+' : ''}{fmtCompact(evolChange.abs)} ({evolChange.pct >= 0 ? '+' : ''}{evolChange.pct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', padding: 3, borderRadius: 9 }}>
                      {(['1j', '1s', '1m', '1a', 'max'] as TimeRange[]).map(r => (
                        <button key={r} onClick={() => setTimeRange(r)} style={{ padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--p-mono)', background: timeRange === r ? catCfg.color : 'transparent', color: timeRange === r ? '#fff' : 'var(--p-text-faint)', transition: 'all 0.15s', letterSpacing: '0.04em' }}>
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '12px 12px 4px' }}>
                    <EvolutionChart data={evolutionData} color={catCfg.color} evolMin={evolMin} evolMax={evolMax} />
                  </div>
                </div>
              )}

              {/* Répartition */}
              {envelopes.length > 1 && (
                <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: '16px 20px' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 14 }}>Répartition</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {[...envelopes].sort((a, b) => {
                      const va = a.type === 'IMMOBILIER' ? Number(a.metadata.currentValue ?? 0) : computeMarketValue(a, livePrices)
                      const vb = b.type === 'IMMOBILIER' ? Number(b.metadata.currentValue ?? 0) : computeMarketValue(b, livePrices)
                      return vb - va
                    }).map(env => {
                      const isImmo = env.type === 'IMMOBILIER'
                      const val = isImmo ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env, livePrices)
                      const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
                      const envColor = envColorMap.get(env.id) ?? ENVELOPE_TYPE_CONFIG[env.type].color
                      return (
                        <div key={env.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: 3, background: envColor, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, color: 'var(--p-text-mid)', fontWeight: 500 }}>{env.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{fmtCompact(val)}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: envColor, minWidth: 32, textAlign: 'right', fontFamily: 'var(--p-mono)' }}>{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${envColor}99, ${envColor})`, borderRadius: 99, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Comparative table */}
              {envelopes.length > 1 && (
                <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>Comparatif des enveloppes</span>
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{Object.keys(livePrices).length > 0 ? 'Prix temps réel' : 'Valeurs renseignées'}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--p-line)' }}>
                        {['Enveloppe', 'Type', 'Valeur', 'Investi', 'P&L', 'Perf.', 'Part'].map((h, i) => (
                          <th key={i} style={{ padding: '8px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>{h}</th>
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
                            style={{ borderBottom: '1px solid var(--p-line)', cursor: 'pointer', transition: 'background 0.12s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = envColor + '0a'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            onClick={() => router.push(`/dashboard/patrimoine/${env.id}`)}
                          >
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 9, height: 9, borderRadius: 3, background: envColor, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--p-text)' }}>{env.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: envColor + '20', color: envColor, fontWeight: 700, fontFamily: 'var(--p-mono)', letterSpacing: '0.04em' }}>{env.type}</span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{val > 0 ? fmtCompact(val) : '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, color: 'var(--p-text-faint)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{inv > 0 ? fmtCompact(inv) : '—'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: plAbs >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>
                              {hasPL ? `${plAbs >= 0 ? '+' : ''}${fmtCompact(plAbs)}` : '—'}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              {hasPL ? (
                                <span style={{ fontSize: 11, fontWeight: 700, color: plPctEnv >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--p-mono)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                  {plPctEnv >= 0 ? <ArrowUpRight style={{ width: 11, height: 11 }} /> : <ArrowDownRight style={{ width: 11, height: 11 }} />}
                                  {Math.abs(plPctEnv).toFixed(1)}%
                                </span>
                              ) : <span style={{ color: 'var(--p-text-faint)', fontSize: 11 }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <div style={{ width: 40, height: 4, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ width: `${part}%`, height: '100%', background: envColor, borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 10, color: 'var(--p-text-dim)', minWidth: 28, textAlign: 'right', fontFamily: 'var(--p-mono)', fontWeight: 600 }}>{part.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `2px solid ${catCfg.color}30`, background: `${catCfg.color}06` }}>
                        <td colSpan={2} style={{ padding: '10px 14px', fontSize: 9.5, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', fontFamily: 'var(--p-mono)' }}>Total</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: catCfg.color, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmtCompact(totalValue)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, color: 'var(--p-text-faint)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmtCompact(totalInvested)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: pl >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>
                          {hasPLData ? `${pl >= 0 ? '+' : ''}${fmtCompact(pl)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {hasPLData && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: pl >= 0 ? '#34d399' : '#f87171', fontFamily: 'var(--p-mono)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              {pl >= 0 ? <ArrowUpRight style={{ width: 11, height: 11 }} /> : <ArrowDownRight style={{ width: 11, height: 11 }} />}
                              {Math.abs(plPct).toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* ── RIGHT: Insights ── */}
            <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Eyebrow */}
              <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, fontFamily: 'var(--p-mono)', paddingLeft: 2 }}>Analyse</div>

              {/* Tip cards */}
              {bestEnv && (() => {
                const inv = computeInvested(bestEnv)
                const val = bestEnv.type === 'IMMOBILIER' ? Number(bestEnv.metadata.currentValue ?? 0) : computeMarketValue(bestEnv, livePrices)
                const hp = bestEnv.positions.some(p => livePrices[p.symbol])
                const hasPerf = canShowPL(bestEnv, val, inv, hp) && inv > 0 && val > inv
                const perfTxt = hasPerf ? `+${((val - inv) / inv * 100).toFixed(1)}% de performance` : `${fmtCompact(val)} de valeur actuelle`
                return (
                  <div style={{ background: 'var(--p-card)', border: `1px solid ${catCfg.color}25`, borderRadius: 14, padding: '14px 16px', borderLeft: `3px solid ${catCfg.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: catCfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Award style={{ width: 13, height: 13, color: catCfg.color }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Meilleur performer</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.7, margin: 0 }}>
                      <span style={{ color: ENVELOPE_TYPE_CONFIG[bestEnv.type].color, fontWeight: 600 }}>{bestEnv.name}</span>{' '}avec {perfTxt}.
                    </p>
                  </div>
                )
              })()}

              <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px', borderLeft: `3px solid ${hasPLData && pl >= 0 ? '#34d399' : hasPLData ? '#f87171' : 'var(--p-line)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: (hasPLData && pl >= 0 ? '#34d399' : '#f87171') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp style={{ width: 13, height: 13, color: hasPLData && pl >= 0 ? '#34d399' : hasPLData ? '#f87171' : 'var(--p-text-faint)' }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Tendance</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.7, margin: 0 }}>
                  {pl > 100
                    ? `Performance positive de +${fmtCompact(pl)} (+${plPct.toFixed(1)}%) sur l'ensemble de la catégorie.`
                    : pl < -100
                    ? `Performance négative de ${fmtCompact(pl)} (${plPct.toFixed(1)}%) — revoyez vos allocations.`
                    : 'Actifs stables sans variation significative sur la période.'}
                </p>
              </div>

              <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px', borderLeft: '3px solid var(--p-gold)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--p-gold-12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lightbulb style={{ width: 13, height: 13, color: 'var(--p-gold)' }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Conseil</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.7, margin: 0 }}>{CATEGORY_TIPS[category]}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--modal-surface)', border: '1px solid var(--modal-surface-border)', borderRadius: 20, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--p-text)' }}>
                  {step === 'type' ? 'Quel type d\'actif ?' : `Nommer votre ${selectedType ? ENVELOPE_TYPE_CONFIG[selectedType].label : ''}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--p-text-faint)', marginTop: 2 }}>Catégorie : {catCfg.label}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)' }}>
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
                      style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: `1.5px solid rgba(255,255,255,0.08)`, transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '70'; (e.currentTarget as HTMLElement).style.background = cfg.color + '14' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{cfg.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{cfg.description}</div>
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
                  <button onClick={() => setStep('type')} style={{ fontSize: 12, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0, textDecoration: 'underline' }}>
                    ← Changer de type
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: ENVELOPE_TYPE_CONFIG[selectedType].color + '10', border: `1px solid ${ENVELOPE_TYPE_CONFIG[selectedType].color}30`, marginBottom: 20 }}>
                  {(() => { const Icon = ENVELOPE_TYPE_CONFIG[selectedType].icon; return <Icon style={{ width: 16, height: 16, color: ENVELOPE_TYPE_CONFIG[selectedType].color }} /> })()}
                  <span style={{ fontSize: 13, fontWeight: 600, color: ENVELOPE_TYPE_CONFIG[selectedType].color }}>{ENVELOPE_TYPE_CONFIG[selectedType].label}</span>
                </div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-text)', display: 'block', marginBottom: 6 }}>Nom de l'enveloppe</label>
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
