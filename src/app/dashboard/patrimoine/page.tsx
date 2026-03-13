'use client'
import { useState, useEffect, useMemo, useRef, type ComponentType } from 'react'
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
  Landmark, Bitcoin, ChevronRight, X, BarChart3, CreditCard, Flame,
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

const CHART_CATEGORIES: Record<string, { label: string; types: string[]; color: string }> = {
  all:        { label: 'Toutes les catégories', types: [],                         color: '#f1c086' },
  immobilier: { label: 'Immobilier',            types: ['IMMOBILIER'],             color: '#f472b6' },
  actions:    { label: 'Actions & Fonds',        types: ['PEA','CTO','AV','PER'],  color: '#818cf8' },
  livrets:    { label: 'Livrets',               types: ['LIVRET'],                 color: '#34d399' },
  autres:     { label: 'Autres actifs',          types: ['CRYPTO'],                color: '#f59e0b' },
  comptes:    { label: 'Comptes bancaires',      types: ['CASH'],                  color: '#94a3b8' },
}

const ENV_COLORS: Record<string, string> = {
  IMMOBILIER: '#3b82f6',
  PEA:        '#818cf8',
  AV:         '#a78bfa',
  CTO:        '#38bdf8',
  PER:        '#fb923c',
  LIVRET:     '#22c55e',
  CRYPTO:     '#a855f7',
  CASH:       '#94a3b8',
}

// ── Composant ─────────────────────────────────────────────────────────────────
export default function PatrimoinePage() {
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('1a')
  const [snapshots, setSnapshots] = useState<{ date: string; totalValue: number; byEnvelope: Record<string, { value: number; type: string; name: string }> }[]>([])
  const [chartCategory, setChartCategory] = useState<'all' | 'immobilier' | 'actions' | 'livrets' | 'autres' | 'comptes'>('all')
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catDropdownRef = useRef<HTMLDivElement>(null)
  const [fireTarget, setFireTarget] = useState<number>(0)
  const [fireTargetInput, setFireTargetInput] = useState('')
  const [editingFireTarget, setEditingFireTarget] = useState(false)
  const milestoneFiredRef = useRef<Set<string>>(new Set())
  const [dragOver, setDragOver] = useState<string | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  const handleDragStart = (idx: number) => { dragSrcIdx.current = idx }
  const handleDrop = async (targetIdx: number) => {
    const srcIdx = dragSrcIdx.current
    if (srcIdx === null || srcIdx === targetIdx) { setDragOver(null); return }
    const reordered = [...envelopes]
    const [moved] = reordered.splice(srcIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setEnvelopes(reordered)
    setDragOver(null)
    dragSrcIdx.current = null
    // Persist sortOrder
    await Promise.all(reordered.map((e, i) =>
      fetch(`/api/patrimoine/envelopes/${e.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: i }),
      })
    ))
  }

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

  // Load FIRE target from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fincalc_fire_target')
    if (saved) { const n = parseFloat(saved); if (n > 0) { setFireTarget(n); setFireTargetInput(String(n)) } }
    const firedStr = localStorage.getItem('fincalc_milestones_fired')
    if (firedStr) { try { milestoneFiredRef.current = new Set(JSON.parse(firedStr)) } catch {} }
  }, [])

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch snapshots on mount
  useEffect(() => {
    fetch('/api/patrimoine/snapshots?days=1825')
      .then(r => r.json())
      .then((data: { date: string; totalValue: number; byEnvelope: Record<string, { value: number; type: string; name: string }> }[]) => {
        if (Array.isArray(data)) setSnapshots(data)
      })
      .catch(() => {})
  }, [])

  // Stats globales
  const totalValue = useMemo(() => envelopes.reduce((sum, e) => {
    if (e.type === 'IMMOBILIER') return sum + Number(e.metadata.currentValue ?? 0)
    return sum + computeMarketValue(e)
  }, 0), [envelopes])

  // Fire-and-forget snapshot after envelopes load
  useEffect(() => {
    if (envelopes.length === 0) return
    const tv = envelopes.reduce((sum, e) => {
      if (e.type === 'IMMOBILIER') return sum + Number(e.metadata.currentValue ?? 0)
      return sum + computeMarketValue(e)
    }, 0)
    if (tv <= 0) return
    const byEnvelope = Object.fromEntries(envelopes.map(e => {
      const value = e.type === 'IMMOBILIER'
        ? Number(e.metadata.currentValue ?? 0)
        : computeMarketValue(e)
      return [e.id, { value, type: e.type, name: e.name }]
    }))
    fetch('/api/patrimoine/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalValue: tv, byEnvelope }),
    }).catch(() => {})
  }, [envelopes])

  // Milestones
  useEffect(() => {
    if (loading || totalValue <= 0) return
    const MILESTONES: { key: string; test: () => boolean; message: string }[] = [
      { key: 'wealth_100k', test: () => totalValue >= 100_000, message: '🎉 100 000€ de patrimoine franchis !' },
      { key: 'wealth_250k', test: () => totalValue >= 250_000, message: '🚀 250 000€ de patrimoine atteints !' },
      { key: 'wealth_500k', test: () => totalValue >= 500_000, message: '💎 500 000€ — vous approchez la liberté financière !' },
      { key: 'wealth_1M',   test: () => totalValue >= 1_000_000, message: '🏆 1 000 000€ — félicitations, millionnaire !' },
    ]
    // PEA plafond
    for (const env of envelopes) {
      if (env.type === 'PEA') {
        const dep = Number(env.metadata.totalDeposited ?? 0)
        MILESTONES.push({ key: `pea_max_${env.id}`, test: () => dep >= 150_000, message: `🎯 PEA "${env.name}" : plafond de versements 150 000€ atteint !` })
      }
    }
    for (const m of MILESTONES) {
      if (m.test() && !milestoneFiredRef.current.has(m.key)) {
        milestoneFiredRef.current.add(m.key)
        localStorage.setItem('fincalc_milestones_fired', JSON.stringify([...milestoneFiredRef.current]))
        toast({ title: 'Milestone atteint !', description: m.message })
      }
    }
  }, [totalValue, loading, envelopes, toast])

  // Allocation géographique agrégée (actifs financiers + immobilier géolocalisé)
  const geoAlloc = useMemo((): GeoAllocation & { values: Partial<Record<keyof GeoAllocation, number>>; totalGeo: number } => {
    const REGIONS = ['northAmerica', 'europe', 'asiaPacific', 'emergingMarkets', 'other'] as const
    const COUNTRY_TO_REGION: Record<string, keyof GeoAllocation> = {
      france: 'europe', europe: 'europe',
      northAmerica: 'northAmerica', asiaPacific: 'asiaPacific',
      emergingMarkets: 'emergingMarkets', other: 'other',
    }

    // 1. Actifs financiers (ETF / actions)
    const allPositions: { value: number; ticker?: string }[] = []
    for (const env of envelopes) {
      for (const pos of env.positions) {
        if (['ETF', 'STOCK'].includes(pos.assetType)) {
          allPositions.push({ value: pos.pru * pos.quantity, ticker: pos.symbol })
        }
      }
    }
    const geo = calcPortfolioGeo(allPositions)

    // Convertir en valeurs absolues
    const geoValues: Record<keyof GeoAllocation, number> = {
      northAmerica: geo.northAmerica * geo.totalValue,
      europe: geo.europe * geo.totalValue,
      asiaPacific: geo.asiaPacific * geo.totalValue,
      emergingMarkets: geo.emergingMarkets * geo.totalValue,
      other: geo.other * geo.totalValue,
    }
    let geoTotal = geo.totalValue

    // 2. Ajouter les biens immobiliers physiques selon leur pays
    for (const env of envelopes) {
      if (env.type === 'IMMOBILIER' && env.metadata.subType !== 'scpi') {
        const val = env.totalValue ?? 0
        if (val > 0) {
          const country = String(env.metadata.country ?? 'france')
          const region = COUNTRY_TO_REGION[country] ?? 'other'
          geoValues[region] += val
          geoTotal += val
        }
      }
    }

    // Normaliser
    const geoNorm: GeoAllocation = geoTotal > 0
      ? Object.fromEntries(REGIONS.map(k => [k, geoValues[k] / geoTotal])) as unknown as GeoAllocation
      : { northAmerica: 0, europe: 0, asiaPacific: 0, emergingMarkets: 0, other: 0 }

    const values: Partial<Record<keyof GeoAllocation, number>> = {}
    for (const key of REGIONS) { values[key] = geoValues[key] }

    return { ...geoNorm, values, totalGeo: geoTotal }
  }, [envelopes])

  // Enveloppes filtrées par catégorie sélectionnée (pour le graphique)
  const chartEnvelopes = useMemo(() => {
    const types = CHART_CATEGORIES[chartCategory]?.types ?? []
    if (types.length === 0) return envelopes
    return envelopes.filter(e => types.includes(e.type))
  }, [envelopes, chartCategory])

  const chartTotal = useMemo(() => {
    return chartEnvelopes.reduce((s, e) => {
      if (e.type === 'IMMOBILIER') return s + Number(e.metadata.currentValue ?? 0)
      const v = e.totalValue !== null ? e.totalValue : e.positions.reduce((ps, p) => ps + p.pru * p.quantity, 0)
      return s + v
    }, 0)
  }, [chartEnvelopes])

  // Valeur par type depuis les enveloppes courantes
  const typeValues = useMemo(() => {
    const tv: Record<string, number> = {}
    for (const e of envelopes) {
      const val = e.type === 'IMMOBILIER'
        ? Number(e.metadata.currentValue ?? 0)
        : computeMarketValue(e)
      tv[e.type] = (tv[e.type] ?? 0) + val
    }
    return tv
  }, [envelopes])

  // Données évolution — courbe unique filtrée par catégorie
  const { evolutionData, isSimulated } = useMemo(() => {
    const catTypes = CHART_CATEGORIES[chartCategory]?.types ?? []
    const cutoffMs: Record<TimeRange, number> = {
      '1j': 86_400_000,
      '1s': 7 * 86_400_000,
      '1m': 30 * 86_400_000,
      '1a': 365 * 86_400_000,
      'max': Infinity,
    }
    const isShort = timeRange === '1j' || timeRange === '1s' || timeRange === '1m'
    const now = Date.now()

    if (snapshots.length >= 2) {
      const filtered = snapshots.filter(s => (now - new Date(s.date).getTime()) <= cutoffMs[timeRange])
      if (filtered.length >= 2) {
        const data = filtered.map(snap => {
          const d = new Date(snap.date)
          const date = isShort
            ? `${d.getDate()}/${d.getMonth() + 1}`
            : d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
          let value = snap.totalValue
          if (catTypes.length > 0) {
            value = Object.values(snap.byEnvelope ?? {})
              .filter(env => catTypes.includes(env.type))
              .reduce((s, env) => s + env.value, 0)
          }
          return { date, total: value }
        })
        return { evolutionData: data, isSimulated: false }
      }
    }

    // Fallback simulation — courbe unique
    const simBase = chartTotal > 0 ? chartTotal : totalValue
    const simPts = generateEvolutionData(simBase, timeRange)
    const data = simPts.map(pt => ({ date: pt.date, total: pt.value }))
    return { evolutionData: data, isSimulated: true }
  }, [snapshots, totalValue, chartTotal, timeRange, chartCategory])

  const evolMin = useMemo(() => evolutionData.length ? Math.min(...evolutionData.map(d => Number(d.total))) * 0.97 : 0, [evolutionData])
  const evolMax = useMemo(() => evolutionData.length ? Math.max(...evolutionData.map(d => Number(d.total))) * 1.02 : 0, [evolutionData])
  const evolChange = useMemo(() => {
    if (evolutionData.length < 2) return 0
    return Number(evolutionData[evolutionData.length - 1].total) - Number(evolutionData[0].total)
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
    <div className="space-y-6" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px 48px' }}>

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
              .reduce((s, e) => {
                if (e.type === 'IMMOBILIER') return s + Number(e.metadata.currentValue ?? 0)
                return s + (e.totalValue ?? e.positions.reduce((ps, p) => ps + p.pru * p.quantity, 0))
              }, 0)
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
            {/* Chart header: category dropdown + time range buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              {/* Category dropdown */}
              <div ref={catDropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setCatDropdownOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: catDropdownOpen ? 'var(--row-hover)' : 'var(--card-dark)',
                    border: `1.5px solid ${CHART_CATEGORIES[chartCategory].color}60`,
                    color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_CATEGORIES[chartCategory].color, display: 'inline-block', flexShrink: 0 }} />
                  {CHART_CATEGORIES[chartCategory].label}
                  <svg width="12" height="12" viewBox="0 0 12 12" style={{ opacity: 0.5, transform: catDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {catDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
                    background: '#111', border: '1px solid var(--card-dark-border)', borderRadius: 12,
                    padding: '6px 0', minWidth: 220,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', padding: '4px 16px 8px', borderBottom: '1px solid var(--card-dark-border)', marginBottom: 4 }}>
                      Tout sélectionner
                    </div>
                    {Object.entries(CHART_CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => { setChartCategory(key as typeof chartCategory); setCatDropdownOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '9px 16px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                          color: chartCategory === key ? 'var(--text-primary)' : 'var(--text-muted-c)',
                          fontWeight: chartCategory === key ? 700 : 500, fontSize: 13,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                        {cat.label}
                        {chartCategory === key && (
                          <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginLeft: 'auto', color: cat.color }}>
                            <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: subtitle + time range */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                  {isSimulated ? 'Projection estimée' : 'Données historiques'} — {fmtCompact(chartTotal || totalValue)}
                  {evolChange !== 0 && (
                    <span style={{ marginLeft: 6, color: evolChange >= 0 ? '#34d399' : '#f87171' }}>
                      {evolChange >= 0 ? '+' : ''}{fmtCompact(evolChange)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['1j', '1s', '1m', '1a', 'max'] as TimeRange[]).map(r => (
                    <button key={r} onClick={() => setTimeRange(r)} style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: timeRange === r ? CHART_CATEGORIES[chartCategory].color : 'transparent',
                      color: timeRange === r ? '#fff' : 'var(--text-subtle)',
                      border: `1px solid ${timeRange === r ? CHART_CATEGORIES[chartCategory].color : 'var(--card-dark-border)'}`,
                      transition: 'all 0.15s',
                    }}>
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_CATEGORIES[chartCategory].color} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={CHART_CATEGORIES[chartCategory].color} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false}
                    interval="preserveStartEnd" />
                  <YAxis domain={[evolMin, evolMax]} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false}
                    tickFormatter={v => fmtCompact(v)} width={64} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const color = CHART_CATEGORIES[chartCategory].color
                      return (
                        <div style={{ background: '#090909', border: `2px solid ${color}`, borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>
                          <div style={{ color, fontWeight: 700 }}>{payload[0]?.payload?.date}</div>
                          <div style={{ color: '#fff', fontWeight: 600, marginTop: 2 }}>{fmtCompact(payload[0]?.value as number)}</div>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={CHART_CATEGORIES[chartCategory].color}
                    strokeWidth={2.5}
                    fill="url(#gradTotal)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 5, fill: CHART_CATEGORIES[chartCategory].color, strokeWidth: 0 }}
                  />
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
              { label: 'Patrimoine total', value: fmtCompact(totalValue), sub: 'Valeur consolidée (±prix réels)', color: '#f1c086' },
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

      {/* ── FIRE Tracker ── */}
      {!loading && totalValue > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(241,192,134,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame style={{ width: 13, height: 13, color: '#f1c086' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Progression FIRE</span>
              </div>
              {!editingFireTarget ? (
                <button
                  onClick={() => setEditingFireTarget(true)}
                  style={{ fontSize: 11, color: 'var(--text-subtle)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}
                >
                  {fireTarget > 0 ? `Cible : ${fmtCompact(fireTarget)}` : 'Définir objectif FIRE'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={fireTargetInput}
                    onChange={e => setFireTargetInput(e.target.value)}
                    placeholder="Ex: 750000"
                    autoFocus
                    style={{ width: 110, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--card-dark-border)', background: 'var(--card-dark)', color: 'var(--text-primary)', fontSize: 13 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const n = parseFloat(fireTargetInput.replace(/\s/g, '').replace(',', '.'))
                        if (n > 0) { setFireTarget(n); localStorage.setItem('fincalc_fire_target', String(n)) }
                        setEditingFireTarget(false)
                      }
                      if (e.key === 'Escape') setEditingFireTarget(false)
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>€ — Entrée pour valider</span>
                </div>
              )}
            </div>
            {fireTarget > 0 ? (() => {
              const pct = Math.min(100, (totalValue / fireTarget) * 100)
              const remaining = Math.max(0, fireTarget - totalValue)
              const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#f1c086' : pct >= 25 ? '#f59e0b' : '#818cf8'
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                      {fmtCompact(totalValue)} / {fmtCompact(fireTarget)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct.toFixed(1)} %</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: 'var(--section-border)', overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                    Il vous reste <b style={{ color: 'var(--text-muted-c)' }}>{fmtCompact(remaining)}</b> à accumuler.
                    {pct >= 100 && <span style={{ marginLeft: 6, color: '#34d399', fontWeight: 700 }}>🎉 Objectif FIRE atteint !</span>}
                    {' '}
                    <a href="/dashboard/fire" style={{ color: '#f1c086', textDecoration: 'none', marginLeft: 4 }}>Simuler →</a>
                  </div>
                </div>
              )
            })() : (
              <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                Définissez votre objectif FIRE pour suivre votre progression.
                Règle des 4% : accumulez 25× vos dépenses annuelles.
                <a href="/dashboard/fire" style={{ color: '#f1c086', textDecoration: 'none', marginLeft: 6 }}>Calculer mon FIRE number →</a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Liste enveloppes ── */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Mes enveloppes ({envelopes.length})
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: 18, borderRadius: 14, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', minHeight: 110 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div className="animate-pulse" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--section-border)' }} />
                  <div>
                    <div className="animate-pulse" style={{ width: 100, height: 12, borderRadius: 6, background: 'var(--section-border)', marginBottom: 6 }} />
                    <div className="animate-pulse" style={{ width: 60, height: 10, borderRadius: 6, background: 'var(--section-border)' }} />
                  </div>
                </div>
                <div className="animate-pulse" style={{ width: 80, height: 20, borderRadius: 6, background: 'var(--section-border)' }} />
              </div>
            ))}
          </div>
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
            {envelopes.map((env, idx) => {
              const cfg = ENVELOPE_TYPE_CONFIG[env.type]
              const Icon = cfg.icon
              const value = env.type === 'IMMOBILIER'
                ? Number(env.metadata.currentValue ?? 0)
                : computeMarketValue(env)
              const cap = getCapProgress(env)

              return (
                <div
                  key={env.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => { e.preventDefault(); setDragOver(env.id) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => handleDrop(idx)}
                  style={{ display: 'flex', opacity: dragOver === env.id ? 0.5 : 1, transition: 'opacity 0.15s' }}
                >
                <Link
                  href={`/dashboard/patrimoine/${env.id}`}
                  style={{ textDecoration: 'none', display: 'flex', flex: 1 }}
                >
                  <div style={{
                    padding: 18, borderRadius: 14,
                    background: dragOver === env.id ? 'var(--row-hover)' : 'var(--card-dark)',
                    border: `1px solid ${dragOver === env.id ? cfg.color + '60' : 'var(--card-dark-border)'}`,
                    cursor: 'grab',
                    transition: 'border-color 0.15s, background 0.15s',
                    width: '100%',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '60'
                      ;(e.currentTarget as HTMLElement).style.background = 'var(--row-hover)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = dragOver === env.id ? cfg.color + '60' : 'var(--card-dark-border)'
                      ;(e.currentTarget as HTMLElement).style.background = dragOver === env.id ? 'var(--row-hover)' : 'var(--card-dark)'
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
                </div>
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
