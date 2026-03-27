'use client'

import {
  useState, useEffect, useMemo, useRef,
  type ComponentType,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield,
  Wallet, Landmark, Bitcoin, X, CreditCard, Flame,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  calcPortfolioGeo,
  estimatePositionIncome,
  type GeoAllocation,
} from '@/lib/etf-database'

// ── WorldMap (SSR off) ────────────────────────────────────────
const WorldMapChart = dynamic(
  () => import('@/components/WorldMapChart').then(m => m.WorldMapChart),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
        Chargement de la carte…
      </div>
    ),
  }
)

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:       "#07090f",
  bgCard:   "#0d0f16",
  bgCardHover: "#111420",
  border:   "rgba(255,255,255,0.07)",
  borderGold: "rgba(241,192,134,0.22)",
  text:     "#f1f5f9",
  muted:    "rgba(255,255,255,0.45)",
  faint:    "rgba(255,255,255,0.2)",
  gold:   '#f1c086',
  green:  '#34d399',
  red:    '#f87171',
  purple: '#a78bfa',
  blue:   '#818cf8',
  pink:   '#f472b6',
  orange: '#fb923c',
  gray:   '#94a3b8',
  cyan:   '#38bdf8',
  amber:  '#f59e0b',
} as const

const G = (o = 1) => `rgba(241,192,134,${o})`

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)} k€`
  return `${Math.round(n)} €`
}

// ── Types ─────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'
type TimeRange    = '1j' | '1s' | '1m' | '1a' | 'max'
type TabId        = 'overview' | 'actifs' | 'revenus' | 'fire' | 'geo'

interface Position {
  id: string
  assetType: string
  symbol: string
  name: string
  quantity: number
  pru: number
  currency: string
  isin?: string
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

type Snapshot = {
  date: string
  totalValue: number
  byEnvelope: Record<string, { value: number; type: string; name: string }>
}

// ── Envelope config ───────────────────────────────────────────
const ENV_CFG: Record<EnvelopeType, {
  label: string
  description: string
  color: string
  icon: ComponentType<{ style?: object; className?: string }>
  assetClass: string
}> = {
  LIVRET:     { label: 'Livret réglementé', description: 'Livret A, LDDS, LEP, PEL…',            color: T.green,  icon: PiggyBank,  assetClass: 'Épargne'    },
  IMMOBILIER: { label: 'Immobilier',        description: 'Résidence principale, locatif…',        color: T.pink,   icon: Building2,  assetClass: 'Immobilier' },
  PEA:        { label: 'PEA',               description: 'Plan Épargne Actions — plafond 150 k€', color: T.blue,   icon: TrendingUp, assetClass: 'Actions'    },
  AV:         { label: 'Assurance Vie',     description: 'Contrat fonds euros ou UC',             color: T.orange, icon: Shield,     assetClass: 'Épargne'    },
  CTO:        { label: 'Compte-Titres',     description: 'CTO sans limite de versements',         color: T.cyan,   icon: TrendingUp, assetClass: 'Actions'    },
  CRYPTO:     { label: 'Crypto',            description: 'Wallet, exchange (Ledger, Binance…)',   color: T.amber,  icon: Bitcoin,    assetClass: 'Crypto'     },
  PER:        { label: 'PER',               description: 'Plan Épargne Retraite indiv./collectif',color: T.purple, icon: Landmark,   assetClass: 'Retraite'   },
  CASH:       { label: 'Liquidités',        description: 'Compte courant, épargne bancaire',      color: T.gray,   icon: Wallet,     assetClass: 'Liquidités' },
}

const PEA_MAX = 150_000

function computeMarketValue(env: Envelope): number {
  if (env.totalValue !== null) return env.totalValue
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

// ── Chart data helpers ────────────────────────────────────────
const CHART_CATS = {
  all:        { label: 'Toutes',           types: [] as string[],           color: T.gold   },
  immobilier: { label: 'Immobilier',       types: ['IMMOBILIER'],           color: T.pink   },
  actions:    { label: 'Actions & Fonds',  types: ['PEA','CTO','AV','PER'], color: T.blue   },
  livrets:    { label: 'Livrets',          types: ['LIVRET'],               color: T.green  },
  autres:     { label: 'Autres actifs',    types: ['CRYPTO'],               color: T.amber  },
  comptes:    { label: 'Comptes bancaires',types: ['CASH'],                 color: T.gray   },
} as const
type ChartCatId = keyof typeof CHART_CATS

function generateEvolutionData(totalValue: number, range: TimeRange) {
  if (totalValue <= 0) return []
  const cfg: Record<TimeRange, { n: number; yearsBack: number; vol: number }> = {
    '1j':  { n: 25, yearsBack: 1/365,  vol: 0.006 },
    '1s':  { n: 8,  yearsBack: 7/365,  vol: 0.010 },
    '1m':  { n: 31, yearsBack: 1/12,   vol: 0.012 },
    '1a':  { n: 13, yearsBack: 1,      vol: 0.040 },
    'max': { n: 61, yearsBack: 5,      vol: 0.040 },
  }
  const { n, yearsBack, vol } = cfg[range]
  const annualReturn = 0.065
  const startValue = totalValue / Math.pow(1 + annualReturn, yearsBack)
  const stepReturn  = Math.pow(1 + annualReturn, yearsBack / n) - 1
  let seed = (Math.floor(totalValue) * 17 + 12345) % 2_147_483_647
  const rand = () => { seed = (seed * 16807) % 2_147_483_647; return seed / 2_147_483_647 }
  const pts: number[] = [startValue]
  for (let i = 1; i < n; i++) {
    const prev = pts[pts.length - 1]
    pts.push(Math.max(prev * (1 + stepReturn) + (rand() - 0.5) * 2 * vol * prev, startValue * 0.7))
  }
  const scale = totalValue / pts[pts.length - 1]
  pts.forEach((_, i) => { pts[i] = Math.round(pts[i] * scale) })
  pts[pts.length - 1] = Math.round(totalValue)
  const now = new Date()
  const isShort = range === '1j' || range === '1s' || range === '1m'
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

// ── Percentile INSEE 2021 ─────────────────────────────────────
function getPercentile(patrimoineNet: number): number {
  if (patrimoineNet <= 0) return 5
  const INSEE = [
    { pct: 10, value: 0 },
    { pct: 25, value: 28_000 },
    { pct: 50, value: 183_000 },
    { pct: 75, value: 440_000 },
    { pct: 90, value: 810_000 },
  ]
  for (let i = 0; i < INSEE.length - 1; i++) {
    if (patrimoineNet >= INSEE[i].value && patrimoineNet <= INSEE[i + 1].value) {
      const t = (patrimoineNet - INSEE[i].value) / (INSEE[i + 1].value - INSEE[i].value)
      return Math.round(INSEE[i].pct + t * (INSEE[i + 1].pct - INSEE[i].pct))
    }
  }
  return patrimoineNet < 0 ? 5 : 95
}

// ── Shared chart tooltip ──────────────────────────────────────
function ChartTooltip({ active, payload, label, color = T.gold }:
  { active?: boolean; payload?: { value: number }[]; label?: string; color?: string }
) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0f1219', border: `1px solid ${color}55`, borderRadius: 8, padding: '8px 14px' }}>
      {label && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginBottom: 2 }}>{label}</div>}
      <div style={{ color, fontSize: 13, fontWeight: 700 }}>{fmtCompact(payload[0].value)}</div>
    </div>
  )
}

// ── Shared UI helpers ─────────────────────────────────────────
function StatCard({ label, value, sub, color = T.text, bg, border, icon: Icon }:
  { label: string; value: string; sub?: string; color?: string; bg?: string; border?: string; icon?: ComponentType<{ size?: number; color?: string }> }
) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: bg ?? 'var(--card-dark)', border: `1px solid ${border ?? 'var(--card-dark-border)'}`, position: 'relative', overflow: 'hidden' }}>
      {Icon && (
        <div style={{ position: 'absolute', top: 13, right: 14, width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} />
        </div>
      )}
      <div style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', fontFamily: 'Geist Mono, monospace', marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, ...style }}>
      {children}
    </div>
  )
}

function BarProgress({ value, max, color, height = 4 }:
  { value: number; max: number; color: string; height?: number }
) {
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: VUE D'ENSEMBLE
// ════════════════════════════════════════════════════════════
function TabOverview({
  envelopes,
  snapshots,
  totalValue,
  patrimoineNet,
  dettes,
}: {
  envelopes:    Envelope[]
  snapshots:    Snapshot[]
  totalValue:   number
  patrimoineNet:number
  dettes:       number
}) {
  const [period,  setPeriod ] = useState<'1a'|'6m'|'3m'|'1m'>('1a')
  const [catId,   setCatId  ] = useState<ChartCatId>('all')

  // Allocation
  const alloc = useMemo(() => {
    const groups: Record<string, { label: string; color: string; val: number }> = {
      ACTIONS:    { label: 'Actions / ETF', color: T.blue,   val: 0 },
      IMMOBILIER: { label: 'Immobilier',    color: T.pink,   val: 0 },
      ÉPARGNE:    { label: 'Épargne',       color: T.green,  val: 0 },
      CRYPTO:     { label: 'Crypto',        color: T.amber,  val: 0 },
      LIQUIDITÉS: { label: 'Liquidités',    color: T.gray,   val: 0 },
    }
    for (const e of envelopes) {
      const v = e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e)
      if (['PEA','CTO','PER'].includes(e.type)) groups.ACTIONS.val    += v
      else if (e.type === 'IMMOBILIER')          groups.IMMOBILIER.val += v
      else if (['LIVRET','AV'].includes(e.type)) groups.ÉPARGNE.val    += v
      else if (e.type === 'CRYPTO')              groups.CRYPTO.val     += v
      else if (e.type === 'CASH')                groups.LIQUIDITÉS.val += v
    }
    return Object.values(groups).filter(g => g.val > 0).map(g => ({
      ...g,
      pct: totalValue > 0 ? parseFloat(((g.val / totalValue) * 100).toFixed(1)) : 0,
    }))
  }, [envelopes, totalValue])

  // Evolution data
  const { evoData, isSimulated } = useMemo(() => {
    const cutoff: Record<string, number> = { '1m': 30, '3m': 90, '6m': 180, '1a': 365 }
    const days = cutoff[period] ?? 365
    const catTypes = CHART_CATS[catId].types
    const now = Date.now()
    if (snapshots.length >= 2) {
      const filtered = snapshots.filter(s => (now - new Date(s.date).getTime()) <= days * 86_400_000)
      if (filtered.length >= 2) {
        return {
          evoData: filtered.map(s => {
            const d = new Date(s.date)
            const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
            const value = catTypes.length > 0
              ? Object.values(s.byEnvelope ?? {}).filter(e => catTypes.includes(e.type)).reduce((a, e) => a + e.value, 0)
              : s.totalValue
            return { date: label, value }
          }),
          isSimulated: false,
        }
      }
    }
    const base = catTypes.length > 0
      ? envelopes.filter(e => catTypes.includes(e.type)).reduce((s, e) => s + (e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e)), 0)
      : totalValue
    const range: TimeRange = period === '1m' ? '1m' : period === '3m' ? '1m' : '1a'
    return { evoData: generateEvolutionData(base, range).map(p => ({ date: p.date, value: p.value })), isSimulated: true }
  }, [snapshots, totalValue, envelopes, period, catId])

  const evolChange = evoData.length >= 2 ? evoData[evoData.length - 1].value - evoData[0].value : 0
  const evolPct    = evoData.length >= 2 ? ((evolChange / evoData[0].value) * 100).toFixed(1) : '0'
  const evolMin    = evoData.length ? Math.min(...evoData.map(d => d.value)) * 0.97 : 0
  const evolMax    = evoData.length ? Math.max(...evoData.map(d => d.value)) * 1.02 : 0
  const chartColor = CHART_CATS[catId].color

  // Score (static baseline; extend with real scoring logic as needed)
  const scoreItems = [
    { label: 'Diversification', v: 85, c: T.green  },
    { label: 'Liquidité',       v: 72, c: T.gold   },
    { label: 'Rendement',       v: 80, c: T.blue   },
    { label: 'Résilience',      v: 68, c: T.purple },
    { label: 'Fiscalité',       v: 76, c: T.green  },
    { label: 'Épargne',         v: 82, c: T.gold   },
  ]
  const score = Math.round(scoreItems.reduce((s, i) => s + i.v, 0) / scoreItems.length)

  // Percentile
  const pct      = getPercentile(patrimoineNet)
  const pctColor = pct >= 75 ? T.green : pct >= 50 ? T.gold : pct >= 25 ? T.orange : T.red

  const PYRAMID = [
    { label: 'Top 10%',          th: '> 810k €',  minPct: 90, c: T.green,  w: 24 },
    { label: 'Top 25%',          th: '> 440k €',  minPct: 75, c: T.gold,   w: 42 },
    { label: 'Au-dessus médiane',th: '> 183k €',  minPct: 50, c: T.orange, w: 60 },
    { label: 'Quartile inf.',    th: '> 28k €',   minPct: 25, c: T.red,    w: 80 },
  ]
  const userTier = PYRAMID.findIndex(t => pct >= t.minPct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Chart principal ── */}
      <SectionCard style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {(Object.entries(CHART_CATS) as [ChartCatId, typeof CHART_CATS[ChartCatId]][]).map(([id, cat]) => (
                <button key={id} onClick={() => setCatId(id)}
                  style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: catId === id ? 700 : 400, cursor: 'pointer', background: catId === id ? `${cat.color}20` : 'transparent', border: `1px solid ${catId === id ? cat.color + '55' : 'var(--card-dark-border)'}`, color: catId === id ? cat.color : 'var(--text-subtle)', transition: 'all 0.15s' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px', fontVariantNumeric: 'tabular-nums', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>
              {fmtCompact(totalValue)}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
              <span style={{ color: evolChange >= 0 ? T.green : T.red, fontSize: 12, fontWeight: 600 }}>
                {evolChange >= 0 ? '↑' : '↓'} {fmtCompact(Math.abs(evolChange))} ({evolPct}%)
              </span>
              <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>
                {isSimulated ? 'projection estimée' : 'données historiques'}
              </span>
            </div>
          </div>
          {/* Time range */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 3, alignSelf: 'flex-start' }}>
            {(['1m','3m','6m','1a'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '4px 11px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: period === p ? `${chartColor}20` : 'transparent', color: period === p ? chartColor : 'var(--text-subtle)', transition: 'all 0.15s' }}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evoData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="evGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[evolMin, evolMax]} tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v)} width={58} />
              <Tooltip content={<ChartTooltip color={chartColor} />} />
              <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2.5} fill="url(#evGrad)" dot={false} activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* ── Allocation + Score ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Allocation */}
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Allocation</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flexShrink: 0 }}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={alloc} dataKey="val" cx="50%" cy="50%" innerRadius={24} outerRadius={42} paddingAngle={3} stroke="none">
                    {alloc.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmtCompact(v), '']} contentStyle={{ background: '#0f1219', border: `1px solid ${G(0.3)}`, borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {alloc.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: a.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{a.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{a.pct}%</span>
                    <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'right' }}>{fmtCompact(a.val)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Net/Brut bar */}
          {dettes > 0 && totalValue > 0 && (
            <div style={{ borderTop: '1px solid var(--card-dark-border)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted-c)', marginBottom: 8 }}>Structure brut / net</div>
              <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 6 }}>
                <div style={{ width: `${Math.round((patrimoineNet / totalValue) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${G(0.6)}, ${T.gold})` }} />
                <div style={{ flex: 1, height: '100%', background: 'rgba(248,113,113,0.35)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: T.gold }} />
                  <span style={{ color: 'var(--text-muted-c)' }}>Net {Math.round((patrimoineNet / totalValue) * 100)}%</span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: 1, background: 'rgba(248,113,113,0.5)' }} />
                  <span style={{ color: 'var(--text-muted-c)' }}>Dettes {Math.round((dettes / totalValue) * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Score */}
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Score Patrimonial</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.gold, fontVariantNumeric: 'tabular-nums' }}>
              {score}<span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400 }}>/100</span>
            </div>
          </div>
          {scoreItems.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.c }}>{s.v}</span>
              </div>
              <BarProgress value={s.v} max={100} color={s.c} />
            </div>
          ))}
        </SectionCard>
      </div>

      {/* ── Pyramide patrimoniale ── */}
      <SectionCard style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Pyramide patrimoniale française</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: pctColor }}>{pct}ème percentile</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 3 }}>
              Plus de patrimoine que <strong style={{ color: 'var(--text-muted-c)' }}>{pct}% des Français</strong>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `2px solid ${pctColor}50` }}>
              {pct >= 75 ? '🎯 Excellent niveau — quartile supérieur.' : pct >= 50 ? '📈 Au-dessus de la médiane nationale.' : '💡 Sous la médiane — optimisez avec les simulateurs.'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            {PYRAMID.map((tier, i) => {
              const isMe = i === userTier
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 54, fontSize: 9, color: isMe ? 'rgba(255,255,255,0.5)' : 'var(--text-subtle)', textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{tier.th}</span>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: `${tier.w}%`, height: isMe ? 30 : 20, borderRadius: isMe ? 7 : 3, background: isMe ? tier.c : `${tier.c}20`, border: isMe ? `2px solid ${tier.c}` : `1px solid ${tier.c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {isMe && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--background)' }}>▶ Vous</span>}
                    </div>
                  </div>
                  <span style={{ width: 100, fontSize: isMe ? 10 : 9, color: isMe ? 'var(--text-primary)' : 'var(--text-subtle)', fontWeight: isMe ? 700 : 400, flexShrink: 0 }}>{tier.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: ACTIFS
// ════════════════════════════════════════════════════════════
function TabActifs({
  envelopes,
  totalValue,
  monthlyPerfByEnv,
  onAdd,
}: {
  envelopes:        Envelope[]
  totalValue:       number
  monthlyPerfByEnv: Record<string, number>
  onAdd:            () => void
}) {
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  const filterDefs = [
    { id: 'all',        label: 'Tous',            color: T.gold,   types: [] as string[] },
    { id: 'actions',    label: 'Actions & Fonds', color: T.blue,   types: ['PEA','CTO','AV','PER'] },
    { id: 'immobilier', label: 'Immobilier',      color: T.pink,   types: ['IMMOBILIER'] },
    { id: 'livrets',    label: 'Livrets',         color: T.green,  types: ['LIVRET'] },
    { id: 'crypto',     label: 'Crypto',          color: T.amber,  types: ['CRYPTO'] },
    { id: 'comptes',    label: 'Liquidités',      color: T.gray,   types: ['CASH'] },
  ]

  const summaryGroups = filterDefs.filter(f => f.id !== 'all').map(f => ({
    ...f,
    val: envelopes.filter(e => f.types.includes(e.type)).reduce((s, e) => s + (e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e)), 0),
  }))

  const filtered = filter === 'all'
    ? envelopes
    : envelopes.filter(e => filterDefs.find(f => f.id === filter)?.types.includes(e.type))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {summaryGroups.map(g => (
          <button key={g.id} onClick={() => setFilter(filter === g.id ? 'all' : g.id)}
            style={{ padding: '12px 14px', borderRadius: 12, background: filter === g.id ? `${g.color}12` : 'var(--card-dark)', border: `1px solid ${filter === g.id ? g.color + '44' : 'var(--card-dark-border)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: g.color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontWeight: 500 }}>{g.label}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: g.color, fontVariantNumeric: 'tabular-nums' }}>
              {g.val > 0 ? fmtCompact(g.val) : <span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>Vide</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 2 }}>
              {totalValue > 0 ? `${((g.val / totalValue) * 100).toFixed(1)}%` : '—'}
            </div>
          </button>
        ))}
      </div>

      {/* Table */}
      <SectionCard>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Enveloppes <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-subtle)', marginLeft: 4 }}>({filtered.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {filterDefs.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding: '4px 12px', borderRadius: 7, border: `1px solid ${filter === f.id ? f.color + '55' : 'var(--card-dark-border)'}`, background: filter === f.id ? `${f.color}14` : 'transparent', color: filter === f.id ? f.color : 'var(--text-subtle)', fontSize: 11, fontWeight: filter === f.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'inherit' }}>
            <thead>
              <tr>
                {['Actif', 'Type', 'Valeur', 'Part', 'Perf. 1M', 'Tendance'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 20px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, borderBottom: '1px solid var(--card-dark-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(env => {
                const cfg   = ENV_CFG[env.type]
                const Icon  = cfg.icon
                const value = env.type === 'IMMOBILIER' ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env)
                const part  = totalValue > 0 ? (value / totalValue) * 100 : 0
                const perf  = monthlyPerfByEnv[env.id] ?? null
                return (
                  <tr key={env.id}
                    onClick={() => router.push(`/dashboard/patrimoine/${env.id}`)}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G(0.03)}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cfg.color}18`, border: `1px solid ${cfg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 13, height: 13, color: cfg.color }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{env.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: `${cfg.color}18`, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {value > 0 ? fmtCompact(value) : <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <div style={{ width: 44, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, part)}%`, height: '100%', background: cfg.color }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)', minWidth: 32, textAlign: 'right' }}>{part.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {perf !== null
                        ? <span style={{ fontSize: 13, fontWeight: 600, color: perf >= 0 ? T.green : T.red }}>{perf >= 0 ? '+' : ''}{perf.toFixed(2)}%</span>
                        : <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                      {perf !== null
                        ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99, background: perf >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: perf >= 0 ? T.green : T.red, fontSize: 10, fontWeight: 700 }}>
                            {perf >= 0 ? '↑' : '↓'} {Math.abs(perf).toFixed(1)}%
                          </div>
                        : <span style={{ color: 'var(--text-subtle)', fontSize: 11 }}>—</span>}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>Aucun actif dans cette catégorie</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <button onClick={onAdd}
        style={{ width: '100%', padding: 13, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-subtle)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = G(0.3); (e.currentTarget as HTMLElement).style.color = T.gold }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-subtle)' }}>
        + Ajouter une enveloppe
      </button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: REVENUS
// ════════════════════════════════════════════════════════════
function TabRevenus({ envelopes }: { envelopes: Envelope[] }) {
  const income = useMemo(() => {
    let etf = 0, livret = 0, immo = 0, av = 0
    for (const env of envelopes) {
      if (['PEA','CTO','CRYPTO'].includes(env.type)) {
        for (const pos of env.positions) {
          etf += estimatePositionIncome(pos.symbol, (pos as Position & { isin?: string }).isin ?? null, pos.pru * pos.quantity)
        }
      } else if (env.type === 'LIVRET') {
        livret += Number(env.metadata.balance ?? 0) * Number(env.metadata.interestRate ?? 0.03)
      } else if (env.type === 'IMMOBILIER') {
        immo += Number(env.metadata.annualRent ?? 0)
      } else if (env.type === 'AV') {
        const sv = Number(env.metadata.surrenderValue ?? 0)
        const rate = Number(env.metadata.averageRate ?? 0)
        if (rate > 0) av += sv * rate
        for (const pos of env.positions) {
          etf += estimatePositionIncome(pos.symbol, (pos as Position & { isin?: string }).isin ?? null, pos.pru * pos.quantity)
        }
      }
    }
    return { total: etf + livret + immo + av, etf, livret, immo, av }
  }, [envelopes])

  const sources = [
    { label: 'ETF / Dividendes', val: income.etf,    color: T.blue   },
    { label: 'Livrets',          val: income.livret,  color: T.green  },
    { label: 'Immobilier',       val: income.immo,    color: T.pink   },
    { label: 'Assurance-vie',    val: income.av,      color: T.orange },
  ].filter(s => s.val > 0)

  const totalAnnuel  = income.total
  const totalMensuel = Math.round(totalAnnuel / 12)

  // Projection mensuelle (12 mois simulés)
  const monthlyProj = useMemo(() => ['J','F','M','A','M','J','J','A','S','O','N','D'].map((m, i) => ({
    m,
    v: totalMensuel > 0 ? Math.round(totalMensuel * (0.82 + (Math.sin(i) * 0.12))) : 0,
  })), [totalMensuel])

  if (totalAnnuel === 0) {
    return (
      <SectionCard style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💸</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Aucun revenu détecté</div>
        <div style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Renseignez vos loyers, taux de livrets ou ETFs distribuants pour calculer vos revenus passifs.</div>
      </SectionCard>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <StatCard
          label="Revenus passifs estimés"
          value={`${fmtCompact(totalAnnuel)}/an`}
          sub={`soit ${fmtCompact(totalMensuel)}/mois`}
          color={T.green}
          bg="linear-gradient(135deg, rgba(52,211,153,0.08), transparent)"
          border="rgba(52,211,153,0.2)"
          icon={TrendingUp}
        />
        <StatCard label="Taux de rendement" value={`${((totalAnnuel / Math.max(1, envelopes.reduce((s, e) => s + computeMarketValue(e), 0))) * 100).toFixed(2)}%`} sub="sur actifs financiers" color={T.gold} />
        <StatCard label="Couverture FIRE 4%" value={`${Math.round((totalMensuel / 2000) * 100)}%`} sub="vs 2 000 €/mois" color={T.purple} />
      </div>

      {/* Sources + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Par source</div>
          {sources.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(s.val)}</span>
              </div>
              <BarProgress value={s.val} max={totalAnnuel} color={s.color} height={4} />
              <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 3 }}>{fmtCompact(Math.round(s.val / 12))}/mois · {((s.val / totalAnnuel) * 100).toFixed(0)}%</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Projection mensuelle</div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>Revenus estimés par mois</div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProj} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}€`} width={40} />
                <Tooltip contentStyle={{ background: '#0f1219', border: `1px solid ${T.green}44`, borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`${v} €`, 'Revenu']} />
                <Bar dataKey="v" fill={T.green} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Détail par actif */}
      <SectionCard>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-dark-border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Détail par enveloppe</div>
        {envelopes.filter(e => {
          const inc = e.type === 'LIVRET'
            ? Number(e.metadata.balance ?? 0) * Number(e.metadata.interestRate ?? 0.03)
            : e.type === 'IMMOBILIER'
            ? Number(e.metadata.annualRent ?? 0)
            : e.positions.reduce((s, p) => s + estimatePositionIncome(p.symbol, (p as Position & { isin?: string }).isin ?? null, p.pru * p.quantity), 0)
          return inc > 0
        }).map((env, i, arr) => {
          const cfg = ENV_CFG[env.type]
          const inc = env.type === 'LIVRET'
            ? Number(env.metadata.balance ?? 0) * Number(env.metadata.interestRate ?? 0.03)
            : env.type === 'IMMOBILIER'
            ? Number(env.metadata.annualRent ?? 0)
            : env.positions.reduce((s, p) => s + estimatePositionIncome(p.symbol, (p as Position & { isin?: string }).isin ?? null, p.pru * p.quantity), 0)
          const Icon = cfg.icon
          return (
            <div key={env.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = G(0.03)}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 13, height: 13, color: cfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{env.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{cfg.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.green, fontVariantNumeric: 'tabular-nums' }}>+{fmtCompact(inc)}/an</div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>+{fmtCompact(Math.round(inc / 12))}/mois</div>
              </div>
              <div style={{ width: 72 }}>
                <BarProgress value={inc} max={totalAnnuel} color={T.green} height={3} />
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 3, textAlign: 'right' }}>{((inc / totalAnnuel) * 100).toFixed(0)}%</div>
              </div>
            </div>
          )
        })}
        <div style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-subtle)', borderTop: '1px solid var(--card-dark-border)' }}>
          Estimation indicative basée sur les taux de distribution ETF reconnus, les taux de livrets renseignés et les loyers saisis.
        </div>
      </SectionCard>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: FIRE
// ════════════════════════════════════════════════════════════
function TabFire({
  patrimoineNet,
  fireTarget,
  setFireTarget,
}: {
  patrimoineNet: number
  fireTarget:    number
  setFireTarget: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [input,   setInput  ] = useState(String(fireTarget || ''))

  const pct      = fireTarget > 0 ? Math.min(100, Math.round((patrimoineNet / fireTarget) * 100)) : 0
  const remaining = Math.max(0, fireTarget - patrimoineNet)
  const rente     = Math.round(fireTarget * 0.04 / 12)
  const pctColor  = pct >= 75 ? T.green : pct >= 50 ? T.gold : T.purple

  const fireProj = useMemo(() => Array.from({ length: 15 }, (_, i) => {
    const cap = Math.min(patrimoineNet * Math.pow(1.07, i) + 2000 * 12 * i, (fireTarget || 360_000) * 1.05)
    return { y: `${2025 + i}`, v: Math.round(cap), t: fireTarget || 360_000 }
  }), [patrimoineNet, fireTarget])

  const milestones = [
    { label: '50k €',  val:   50_000 },
    { label: '100k €', val:  100_000 },
    { label: '250k €', val:  250_000 },
    { label: '500k €', val:  500_000 },
  ]
  const doneCount = milestones.filter(m => patrimoineNet >= m.val).length
  const nextM     = milestones.find(m => patrimoineNet < m.val)

  const saveTarget = () => {
    const n = parseFloat(input.replace(/\s/g, '').replace(',', '.'))
    if (n > 0) { setFireTarget(n); localStorage.setItem('patrimo_fire_target', String(n)) }
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 14 }}>
        <div style={{ padding: '18px 20px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(167,139,250,0.10), transparent)', border: '1px solid rgba(167,139,250,0.2)', position: 'relative' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Progression FIRE</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: pctColor, fontVariantNumeric: 'tabular-nums', fontFamily: 'Geist Mono, monospace', lineHeight: 1 }}>{pct}%</div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, margin: '10px 0 6px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${pctColor}88, ${pctColor})`, borderRadius: 99, transition: 'width 0.8s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-subtle)' }}>
            <span>{fmtCompact(patrimoineNet)}</span>
            {fireTarget > 0 && <span>{fmtCompact(fireTarget)}</span>}
          </div>
        </div>
        <StatCard label="Rente mensuelle" value={`${fmt(rente)}/mois`} sub="à 4% de retrait / an" color={T.green} />
        <StatCard label="Années restantes" value="7 ans" sub="À 7%/an + 2 000€/mois" color={T.gold} />
        <StatCard label="Reste à accumuler" value={fireTarget > 0 ? fmtCompact(remaining) : '—'} sub="vers l'objectif" color="var(--text-muted-c)" />
      </div>

      {/* Chart + Milestones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 16 }}>
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Projection vers l'indépendance</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>À 7%/an + 2 000 €/mois d'épargne</div>
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input value={input} onChange={e => setInput(e.target.value)} autoFocus
                  style={{ width: 110, padding: '4px 8px', borderRadius: 7, border: '1px solid var(--card-dark-border)', background: 'var(--card-dark)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'inherit' }}
                  onKeyDown={e => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditing(false) }} />
                <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>€ Entrée</span>
              </div>
            ) : (
              <button onClick={() => { setInput(String(fireTarget || '')); setEditing(true) }}
                style={{ background: G(0.1), border: `1px solid ${G(0.25)}`, color: T.gold, fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
                {fireTarget > 0 ? `Cible : ${fmtCompact(fireTarget)}` : 'Définir l\'objectif'}
              </button>
            )}
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fireProj} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.purple} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={T.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="y" tick={{ fontSize: 9, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-subtle)' }} tickLine={false} axisLine={false} tickFormatter={v => fmtCompact(v)} width={52} />
                <Tooltip content={<ChartTooltip color={T.purple} />} />
                <Area type="monotone" dataKey="t" stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="5 4" fill="none" dot={false} name="Objectif" />
                <Area type="monotone" dataKey="v" stroke={T.purple} strokeWidth={2.5} fill="url(#fireGrad)" dot={false} activeDot={{ r: 4, fill: T.purple, strokeWidth: 0 }} name="Capital" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Milestones */}
          <SectionCard style={{ padding: '18px 20px', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Paliers</div>
            <div style={{ position: 'relative', paddingTop: 10 }}>
              <div style={{ position: 'absolute', top: 20, left: 10, right: 10, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'absolute', top: 19, left: 10, width: `calc(${(doneCount / milestones.length) * 100}% - 10px)`, height: 3, background: `linear-gradient(90deg, ${T.gold}, ${G(0.5)})`, borderRadius: 99 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {milestones.map((m, i) => {
                  const done = patrimoineNet >= m.val
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? T.gold : 'rgba(255,255,255,0.06)', border: done ? 'none' : '2px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: done ? 'var(--background)' : 'rgba(255,255,255,0.2)' }}>
                        {done ? '✓' : ''}
                      </div>
                      <span style={{ fontSize: 9, color: done ? 'var(--text-muted-c)' : 'var(--text-subtle)', textAlign: 'center', whiteSpace: 'nowrap' }}>{m.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {nextM ? (
              <div style={{ marginTop: 16, padding: '10px 12px', background: G(0.07), borderRadius: 9, border: `1px solid ${G(0.18)}` }}>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginBottom: 2 }}>Prochain palier</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gold }}>{nextM.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>Reste {fmtCompact(nextM.val - patrimoineNet)}</div>
              </div>
            ) : (
              <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(52,211,153,0.07)', borderRadius: 9, border: '1px solid rgba(52,211,153,0.2)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>🎉 Tous les paliers atteints !</div>
              </div>
            )}
          </SectionCard>

          {/* Règle 4% */}
          <SectionCard style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(167,139,250,0.07), transparent)', border: '1px solid rgba(167,139,250,0.18)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 8 }}>Règle des 4%</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.65 }}>
              Accumulez <strong style={{ color: 'var(--text-primary)' }}>25×</strong> vos dépenses annuelles.<br />
              Pour 2 000 €/mois → objectif <strong style={{ color: T.purple }}>600 000 €</strong>
            </div>
            <Link href="/dashboard/fire" style={{ display: 'inline-block', marginTop: 10, fontSize: 11, color: T.gold, textDecoration: 'none', fontWeight: 600 }}>
              Simuler mon FIRE number →
            </Link>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// TAB: GÉOGRAPHIE
// ════════════════════════════════════════════════════════════
function TabGeo({
  envelopes,
  geoAlloc,
}: {
  envelopes: Envelope[]
  geoAlloc:  GeoAllocation & { values: Partial<Record<keyof GeoAllocation, number>>; totalGeo: number }
}) {
  const REGIONS: { key: keyof GeoAllocation; label: string; color: string }[] = [
    { key: 'northAmerica',    label: 'Amérique du Nord', color: '#3b82f6' },
    { key: 'europe',          label: 'Europe',           color: T.blue   },
    { key: 'asiaPacific',     label: 'Asie-Pacifique',   color: T.green  },
    { key: 'emergingMarkets', label: 'Marchés émergents',color: T.amber  },
    { key: 'other',           label: 'Autre',            color: T.gray   },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Carte monde */}
      <SectionCard style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Répartition géographique mondiale</div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>
          {geoAlloc.totalGeo > 0
            ? <>Calculé sur <strong style={{ color: 'var(--text-muted-c)' }}>{fmtCompact(geoAlloc.totalGeo)}</strong> d'actifs reconnus</>
            : 'Ajoutez des ETFs ou actions pour voir la répartition géographique'}
        </div>
        {geoAlloc.totalGeo > 0 ? (
          <WorldMapChart allocation={geoAlloc} values={geoAlloc.values} totalValue={geoAlloc.totalGeo} height={300} />
        ) : (
          <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--card-dark-border)', color: 'var(--text-subtle)', fontSize: 13, textAlign: 'center', padding: 24 }}>
            Aucune donnée — ajoutez des ETFs pour visualiser votre exposition mondiale
          </div>
        )}
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Barres régions */}
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Par région</div>
          {REGIONS.map((r, i) => {
            const pct = geoAlloc.totalGeo > 0 ? ((geoAlloc.values[r.key] ?? 0) / geoAlloc.totalGeo) * 100 : 0
            const val = geoAlloc.values[r.key] ?? 0
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{r.label}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {val > 0 && <span style={{ fontSize: 10, color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(val)}</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color, minWidth: 34, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <BarProgress value={pct} max={100} color={r.color} />
              </div>
            )
          })}
        </SectionCard>

        {/* Concentration risque */}
        <SectionCard style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Analyse de concentration</div>
          {[
            { label: 'Exposition USA',         v: `${((geoAlloc.northAmerica ?? 0) * 100).toFixed(0)}%`, risk: (geoAlloc.northAmerica ?? 0) > 0.7 ? 'élevé' : 'moyen', c: (geoAlloc.northAmerica ?? 0) > 0.7 ? T.red : T.orange },
            { label: 'Top classe actif',     v: '56%', risk: 'moyen',  c: T.orange },
            { label: 'Marchés développés',     v: `${(((geoAlloc.northAmerica ?? 0) + (geoAlloc.europe ?? 0) + (geoAlloc.asiaPacific ?? 0)) * 100).toFixed(0)}%`, risk: 'faible', c: T.green },
            { label: 'Exposition USD',         v: `${((geoAlloc.northAmerica ?? 0) * 100 * 0.95).toFixed(0)}%`, risk: (geoAlloc.northAmerica ?? 0) > 0.6 ? 'élevé' : 'moyen', c: (geoAlloc.northAmerica ?? 0) > 0.6 ? T.red : T.orange },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{r.label}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{r.v}</span>
                <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: `${r.c}18`, color: r.c, fontWeight: 600 }}>{r.risk}</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid var(--card-dark-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginBottom: 2 }}>Astuce diversification</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
              Une exposition USD &gt; 60% crée un risque de change. Envisagez des ETFs hedgés ou plus d'actifs en EUR.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// ROOT PAGE
// ════════════════════════════════════════════════════════════
export default function PatrimoinePage() {
  const router  = useRouter()
  const { toast } = useToast()

  const [envelopes,  setEnvelopes ] = useState<Envelope[]>([])
  const [snapshots,  setSnapshots ] = useState<Snapshot[]>([])
  const [loading,    setLoading   ] = useState(true)
  const [activeTab,  setActiveTab ] = useState<TabId>('overview')

  // FIRE target
  const [fireTarget, setFireTargetState] = useState(0)
  const setFireTarget = (v: number) => { setFireTargetState(v); localStorage.setItem('patrimo_fire_target', String(v)) }

  // Modal état
  const [showModal,     setShowModal    ] = useState(false)
  const [modalStep,     setModalStep    ] = useState<'type' | 'name'>('type')
  const [selectedType,  setSelectedType ] = useState<EnvelopeType | null>(null)
  const [envelopeName,  setEnvelopeName ] = useState('')
  const [creating,      setCreating     ] = useState(false)

  // Milestone ref
  const milestoneFiredRef = useRef<Set<string>>(new Set())

  // Load
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [envRes, snapRes] = await Promise.all([
          fetch('/api/patrimoine/envelopes'),
          fetch('/api/patrimoine/snapshots?days=1825'),
        ])
        if (envRes.ok)  setEnvelopes(await envRes.json())
        if (snapRes.ok) { const d = await snapRes.json(); if (Array.isArray(d)) setSnapshots(d) }
      } catch { /* ignore */ } finally { setLoading(false) }
    }
    loadAll()

    const saved = localStorage.getItem('patrimo_fire_target')
    if (saved) { const n = parseFloat(saved); if (n > 0) setFireTargetState(n) }
    const fired = localStorage.getItem('patrimo_milestones_fired')
    if (fired) { try { milestoneFiredRef.current = new Set(JSON.parse(fired)) } catch {} }
  }, [])

  // Computed
  const totalValue = useMemo(() =>
    envelopes.reduce((s, e) => s + (e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e)), 0),
  [envelopes])

  const dettes = useMemo(() =>
    envelopes.filter(e => e.type === 'IMMOBILIER').reduce((s, e) => s + Number(e.metadata.creditRemaining ?? 0), 0),
  [envelopes])

  const patrimoineNet = totalValue - dettes

  const monthlyPerfByEnv = useMemo((): Record<string, number> => {
    if (snapshots.length < 2) return {}
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 86_400_000
    const older = snapshots.filter(s => new Date(s.date).getTime() <= thirtyDaysAgo)
    if (!older.length) return {}
    const refSnap = older[older.length - 1]
    const result: Record<string, number> = {}
    for (const env of envelopes) {
      const oldVal = (refSnap.byEnvelope?.[env.id] as { value?: number } | undefined)?.value ?? null
      const cur = env.type === 'IMMOBILIER' ? Number(env.metadata.currentValue ?? 0) : computeMarketValue(env)
      if (oldVal !== null && oldVal > 0) result[env.id] = ((cur - oldVal) / oldVal) * 100
    }
    return result
  }, [snapshots, envelopes])

  // Geo alloc
  const geoAlloc = useMemo(() => {
    const REGIONS = ['northAmerica', 'europe', 'asiaPacific', 'emergingMarkets', 'other'] as const
    const COUNTRY_MAP: Record<string, keyof GeoAllocation> = {
      france: 'europe', europe: 'europe', northAmerica: 'northAmerica',
      asiaPacific: 'asiaPacific', emergingMarkets: 'emergingMarkets', other: 'other',
    }
    const allPositions = envelopes.flatMap(env =>
      env.positions.filter(p => ['ETF','STOCK'].includes(p.assetType)).map(p => ({
        value: p.pru * p.quantity, ticker: p.symbol,
      }))
    )
    const geo = calcPortfolioGeo(allPositions)
    const geoValues = Object.fromEntries(REGIONS.map(k => [k, (geo[k] ?? 0) * geo.totalValue])) as Record<keyof GeoAllocation, number>
    let geoTotal = geo.totalValue
    for (const env of envelopes) {
      if (env.type === 'IMMOBILIER' && env.metadata.subType !== 'scpi') {
        const val = env.totalValue ?? 0
        if (val > 0) {
          const region = COUNTRY_MAP[String(env.metadata.country ?? 'france')] ?? 'other'
          geoValues[region] += val
          geoTotal += val
        }
      }
    }
    const norm = geoTotal > 0
      ? Object.fromEntries(REGIONS.map(k => [k, geoValues[k] / geoTotal])) as GeoAllocation
      : { northAmerica: 0, europe: 0, asiaPacific: 0, emergingMarkets: 0, other: 0 }
    return { ...norm, values: geoValues as Partial<Record<keyof GeoAllocation, number>>, totalGeo: geoTotal }
  }, [envelopes])

  // Milestones check
  useEffect(() => {
    if (loading || patrimoineNet <= 0) return
    const MLS = [
      { key: 'w100k', test: () => patrimoineNet >= 100_000, message: '🎉 100 000€ de patrimoine franchis !' },
      { key: 'w250k', test: () => patrimoineNet >= 250_000, message: '🚀 250 000€ atteints !' },
      { key: 'w500k', test: () => patrimoineNet >= 500_000, message: '💎 500 000€ — vous approchez la liberté financière !' },
      { key: 'w1M',   test: () => patrimoineNet >= 1_000_000, message: '🏆 1 000 000€ — félicitations !' },
    ]
    for (const env of envelopes) {
      if (env.type === 'PEA') {
        const dep = Number(env.metadata.totalDeposited ?? 0)
        MLS.push({ key: `pea_${env.id}`, test: () => dep >= 150_000, message: `🎯 PEA "${env.name}" : plafond 150 000€ atteint !` })
      }
    }
    for (const m of MLS) {
      if (m.test() && !milestoneFiredRef.current.has(m.key)) {
        milestoneFiredRef.current.add(m.key)
        localStorage.setItem('patrimo_milestones_fired', JSON.stringify([...milestoneFiredRef.current]))
        toast({ title: 'Milestone atteint !', description: m.message })
      }
    }
  }, [patrimoineNet, loading, envelopes, toast])

  // Auto-snapshot
  useEffect(() => {
    if (!envelopes.length || totalValue <= 0) return
    const byEnvelope = Object.fromEntries(envelopes.map(e => {
      const value = e.type === 'IMMOBILIER' ? Number(e.metadata.currentValue ?? 0) : computeMarketValue(e)
      return [e.id, { value, type: e.type, name: e.name }]
    }))
    fetch('/api/patrimoine/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalValue, byEnvelope }),
    }).catch(() => {})
  }, [envelopes, totalValue])

  // Create envelope
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

  const openModal = () => { setModalStep('type'); setSelectedType(null); setEnvelopeName(''); setShowModal(true) }

  // ── Tabs config ───────────────────────────────────────────
  const TABS: { id: TabId; label: string; badge?: number }[] = [
    { id: 'overview',  label: "Vue d'ensemble"   },
    { id: 'actifs',    label: 'Actifs',           badge: envelopes.length },
    { id: 'revenus',   label: 'Revenus'           },
    { id: 'fire',      label: 'FIRE'              },
    { id: 'geo',       label: 'Géographie'        },
  ]

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-0" style={{ padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,28px) 48px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>Dashboard · Patrimoine</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Mon Patrimoine</h1>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: '3px 0 0' }}>Vue consolidée de tous vos actifs</p>
        </div>
        <Button onClick={openModal} size="sm" style={{ gap: 6 }}>
          <Plus className="h-4 w-4" />
          Ajouter une enveloppe
        </Button>
      </div>

      {/* ── KPI strip ── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Patrimoine Net" value={fmtCompact(patrimoineNet)}
            sub={`Brut ${fmtCompact(totalValue)}`}
            color={T.gold} bg="linear-gradient(135deg,rgba(241,192,134,0.08),transparent)"
            border="rgba(241,192,134,0.2)" icon={Landmark}
          />
          <StatCard
            label="Total Dettes" value={dettes > 0 ? fmtCompact(dettes) : '—'}
            sub={dettes > 0 ? 'Crédits en cours' : 'Aucun emprunt'}
            color={dettes > 0 ? T.red : 'var(--text-muted-c)'}
            bg={dettes > 0 ? 'linear-gradient(135deg,rgba(248,113,113,0.07),transparent)' : undefined}
            border={dettes > 0 ? 'rgba(248,113,113,0.18)' : undefined} icon={CreditCard}
          />
          <StatCard
            label={fireTarget > 0 ? `Vers ${fmtCompact(fireTarget)}` : 'Objectif FIRE'}
            value={fireTarget > 0 ? `${Math.min(100, Math.round((patrimoineNet / fireTarget) * 100))}%` : '—'}
            sub={fireTarget > 0 ? `Reste ${fmtCompact(Math.max(0, fireTarget - patrimoineNet))}` : 'Définissez votre cible ↓'}
            color={T.purple} bg="linear-gradient(135deg,rgba(167,139,250,0.08),transparent)"
            border="rgba(167,139,250,0.18)" icon={Flame}
          />
          <StatCard
            label="Score Patrimonial" value="82/100" sub="Excellent · ↑ +3 pts"
            color={T.gold} bg="linear-gradient(135deg,rgba(241,192,134,0.05),transparent)"
            border="rgba(241,192,134,0.12)"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-dark-border)', marginBottom: 20, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-subtle)', borderBottom: isActive ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', color: 'var(--text-subtle)' }}>{tab.badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      {!loading && (
        <>
          {activeTab === 'overview'  && <TabOverview envelopes={envelopes} snapshots={snapshots} totalValue={totalValue} patrimoineNet={patrimoineNet} dettes={dettes} />}
          {activeTab === 'actifs'    && <TabActifs envelopes={envelopes} totalValue={totalValue} monthlyPerfByEnv={monthlyPerfByEnv} onAdd={openModal} />}
          {activeTab === 'revenus'   && <TabRevenus envelopes={envelopes} />}
          {activeTab === 'fire'      && <TabFire patrimoineNet={patrimoineNet} fireTarget={fireTarget} setFireTarget={setFireTarget} />}
          {activeTab === 'geo'       && <TabGeo envelopes={envelopes} geoAlloc={geoAlloc} />}
        </>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[280, 200, 160].map((h, i) => (
            <div key={i} style={{ height: h, borderRadius: 14, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            </div>
          ))}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}

      {/* ── Modal Ajouter ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, width: '100%', maxWidth: 540, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modalStep === 'type' ? "Quel type d'actif ?" : `Nommer votre ${selectedType ? ENV_CFG[selectedType].label : ''}`}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                  {modalStep === 'type' ? 'Choisissez une catégorie pour continuer' : 'Donnez un nom personnalisé à cette enveloppe'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalStep === 'type' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.entries(ENV_CFG) as [EnvelopeType, typeof ENV_CFG[EnvelopeType]][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button key={type} onClick={() => { setSelectedType(type); setModalStep('name'); setEnvelopeName('') }}
                      style={{ padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', background: 'transparent', border: '1.5px solid var(--card-dark-border)', transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cfg.color + '55'; (e.currentTarget as HTMLElement).style.background = cfg.color + '08' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
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

            {modalStep === 'name' && selectedType && (
              <div>
                <button onClick={() => setModalStep('type')} style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0, textDecoration: 'underline', fontFamily: 'inherit' }}>
                  ← Changer de type
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: ENV_CFG[selectedType].color + '10', border: `1px solid ${ENV_CFG[selectedType].color}30`, marginBottom: 20 }}>
                  {(() => { const Icon = ENV_CFG[selectedType].icon; return <Icon style={{ width: 16, height: 16, color: ENV_CFG[selectedType].color }} /> })()}
                  <span style={{ fontSize: 13, fontWeight: 600, color: ENV_CFG[selectedType].color }}>{ENV_CFG[selectedType].label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>— {ENV_CFG[selectedType].description}</span>
                </div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Nom de l'enveloppe</label>
                <Input autoFocus value={envelopeName} onChange={e => setEnvelopeName(e.target.value)}
                  placeholder={({ LIVRET: 'ex : Mon Livret A', IMMOBILIER: 'ex : Résidence principale', PEA: 'ex : Mon PEA Boursorama', AV: 'ex : Linxea Spirit 2', CTO: 'ex : CTO Trading 212', CRYPTO: 'ex : Ledger Hardware Wallet', PER: 'ex : Mon PER Individuel', CASH: 'ex : Compte courant BNP' } as Record<EnvelopeType, string>)[selectedType]}
                  onKeyDown={e => { if (e.key === 'Enter' && envelopeName.trim()) handleCreate() }}
                  style={{ marginBottom: 20 }} />
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