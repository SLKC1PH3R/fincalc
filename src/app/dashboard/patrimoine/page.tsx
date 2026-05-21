'use client'
import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { fmt } from '@/lib/utils'
import {
  Plus, TrendingUp, Building2, PiggyBank, Shield, Wallet,
  Landmark, Bitcoin, X, CreditCard, Flame, Globe, DollarSign,
  BarChart2, Eye,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { calcPortfolioGeo, estimatePositionIncome, type GeoAllocation } from '@/lib/etf-database'

const WorldMapChart = dynamic(
  () => import('@/components/WorldMapChart').then(m => m.WorldMapChart),
  { ssr: false, loading: () => <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>Chargement de la carte…</div> }
)

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  gold:   '#B07820',
  green:  '#34d399',
  red:    '#f87171',
  purple: '#a78bfa',
  blue:   '#38bdf8',
  pink:   '#f472b6',
  orange: '#fb923c',
  gray:   '#94a3b8',
  cyan:   '#22d3ee',
  amber:  '#f59e0b',
}

// ── Types ──────────────────────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'
type TabId = 'overview' | 'actifs' | 'revenus' | 'fire' | 'geo'
type TimeRange = '1m' | '3m' | '6m' | '1a' | 'max'

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

interface Snapshot {
  date: string
  totalValue: number
}


// ── Envelope config ────────────────────────────────────────────────────────────
const ENV_CFG: Record<EnvelopeType, {
  label: string; color: string; assetClass: string
  icon: ComponentType<{ style?: object; className?: string }>
}> = {
  LIVRET:     { label: 'Livret',         color: T.green,  assetClass: 'Épargne',     icon: PiggyBank  },
  IMMOBILIER: { label: 'Immobilier',     color: T.pink,   assetClass: 'Immobilier',  icon: Building2  },
  PEA:        { label: 'PEA',            color: T.purple, assetClass: 'Actions',     icon: TrendingUp },
  AV:         { label: 'Assurance Vie',  color: T.orange, assetClass: 'Épargne',     icon: Shield     },
  CTO:        { label: 'Compte-Titres',  color: T.blue,   assetClass: 'Actions',     icon: TrendingUp },
  CRYPTO:     { label: 'Crypto',         color: T.amber,  assetClass: 'Crypto',      icon: Bitcoin    },
  PER:        { label: 'PER',            color: T.purple, assetClass: 'Retraite',    icon: Landmark   },
  CASH:       { label: 'Liquidités',     color: T.gray,   assetClass: 'Liquidités',  icon: Wallet     },
}

// Chart category filters
const CHART_CATS: Record<string, EnvelopeType[]> = {
  'Tout': ['LIVRET', 'IMMOBILIER', 'PEA', 'AV', 'CTO', 'CRYPTO', 'PER', 'CASH'],
  'Actions': ['PEA', 'CTO'],
  'Épargne': ['LIVRET', 'AV'],
  'Immobilier': ['IMMOBILIER'],
  'Crypto': ['CRYPTO'],
  'Retraite': ['PER', 'CASH'],
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

function computeMarketValue(env: Envelope): number {
  if (env.totalValue !== null) return env.totalValue
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function generateEvolutionData(totalValue: number, range: TimeRange) {
  if (totalValue <= 0) return []
  const cfg: Record<TimeRange, { n: number; yearsBack: number; vol: number }> = {
    '1m':  { n: 30,  yearsBack: 1 / 12,  vol: 0.015 },
    '3m':  { n: 45,  yearsBack: 3 / 12,  vol: 0.025 },
    '6m':  { n: 52,  yearsBack: 6 / 12,  vol: 0.04  },
    '1a':  { n: 52,  yearsBack: 1,        vol: 0.065 },
    'max': { n: 60,  yearsBack: 3,        vol: 0.12  },
  }
  const { n, yearsBack, vol } = cfg[range]
  const now = Date.now()
  const start = now - yearsBack * 365 * 24 * 3600 * 1000
  const startVal = totalValue * (1 - vol * 0.6 * Math.random())
  const pts = []
  let v = startVal
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * (now - start)
    const date = new Date(t)
    const label = range === '1m' || range === '3m'
      ? date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
      : date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    if (i === n) { pts.push({ date: label, value: Math.round(totalValue) }); break }
    v = v * (1 + (Math.random() - 0.44) * 0.03)
    pts.push({ date: label, value: Math.round(Math.max(v, totalValue * 0.5)) })
  }
  return pts
}

function getPercentile(Patrimoine: number): number {
  const INSEE = [
    { pct: 10, value: 0 },
    { pct: 25, value: 28_000 },
    { pct: 50, value: 183_000 },
    { pct: 75, value: 440_000 },
    { pct: 90, value: 810_000 },
    { pct: 99, value: 4_000_000 },
  ]
  if (Patrimoine <= 0) return 5
  for (let i = 0; i < INSEE.length - 1; i++) {
    if (Patrimoine >= INSEE[i].value && Patrimoine <= INSEE[i + 1].value) {
      const t = (Patrimoine - INSEE[i].value) / (INSEE[i + 1].value - INSEE[i].value)
      return Math.round(INSEE[i].pct + t * (INSEE[i + 1].pct - INSEE[i].pct))
    }
  }
  return Patrimoine < 0 ? 5 : 99
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = T.gold }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function SectionCard({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: 14 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

function BarProgress({ label, value, max, color, fmt: fmtFn = fmtCompact }: {
  label: string; value: number; max: number; color: string; fmt?: (n: number) => string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--p-text-dim)', width: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, width: 52, textAlign: 'right' }}>{fmtFn(value)}</span>
    </div>
  )
}

// ── Pyramid data ───────────────────────────────────────────────────────────────
const PYRAMID_TIERS = [
  { label: 'Top 1%',             sub: '~1% des ménages',   threshold: '> 4 M€',    minPct: 99, color: T.purple, w: 14 },
  { label: 'Top 10%',            sub: '~9% des ménages',   threshold: '> 810 k€',  minPct: 90, color: T.green,  w: 30 },
  { label: 'Top 25%',            sub: '~15% des ménages',  threshold: '> 440 k€',  minPct: 75, color: T.gold,   w: 50 },
  { label: 'Au-dessus médiane',  sub: '~25% des ménages',  threshold: '> 183 k€',  minPct: 50, color: T.orange, w: 67 },
  { label: 'Sous la médiane',    sub: '~25% des ménages',  threshold: '> 28 k€',   minPct: 25, color: '#f97316', w: 83 },
  { label: 'Quartile inférieur', sub: '~25% des ménages',  threshold: '< 28 k€',   minPct: 0,  color: T.red,   w: 100 },
]

// ── Inline SVG: EvolutionChart ─────────────────────────────────────────────────
interface EvoPoint { date: string; value: number }

function EvolutionChart({ data, color = T.gold }: { data: EvoPoint[]; color?: string }) {
  if (data.length < 2) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-faint)', fontSize: 12 }}>
        Aucune donnée disponible
      </div>
    )
  }

  const W = 800, H = 200
  const PAD = { l: 64, r: 12, t: 12, b: 28 }
  const w = W - PAD.l - PAD.r
  const h = H - PAD.t - PAD.b
  const N = data.length - 1
  const maxVal = Math.max(...data.map(d => d.value)) * 1.08
  const minVal = Math.min(...data.map(d => d.value)) * 0.94

  const xy = (i: number, v: number) => ({
    x: PAD.l + (i / (N || 1)) * w,
    y: PAD.t + h - ((v - minVal) / (maxVal - minVal || 1)) * h,
  })

  const pts = data.map((d, i) => xy(i, d.value))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[N].x.toFixed(1)},${PAD.t + h} L${pts[0].x.toFixed(1)},${PAD.t + h} Z`

  const yTicks = [minVal, minVal + (maxVal - minVal) * 0.25, minVal + (maxVal - minVal) * 0.5, minVal + (maxVal - minVal) * 0.75, maxVal]

  // Show a subset of x labels to avoid crowding
  const labelStep = Math.ceil(data.length / 6)
  const labelIndices = data.map((_, i) => i).filter(i => i === 0 || i === N || i % labelStep === 0)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gradEvo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = PAD.t + h - ((t - minVal) / (maxVal - minVal || 1)) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" letterSpacing="0.03em">
              {fmtCompact(t)}
            </text>
          </g>
        )
      })}

      {labelIndices.map(i => {
        const p = pts[i]
        return (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">
            {data[i].date}
          </text>
        )
      })}

      <path d={area} fill="url(#gradEvo)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={pts[N].x} cy={pts[N].y} r={4} fill={color} />
      <circle cx={pts[N].x} cy={pts[N].y} r={9} fill={color} opacity={0.18} />
    </svg>
  )
}

// ── Inline SVG: AllocationDonut ────────────────────────────────────────────────
interface DonutSegment { name: string; value: number; color: string }

function AllocationDonut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1
  const size = 160
  const r = 54
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const gap = 2

  let offset = 0
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * c - gap
    const arc = { dash, gap: c - dash, offset, seg }
    offset += (seg.value / total) * c
    return arc
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--p-line)" strokeWidth={14} />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.seg.color}
              strokeWidth={14}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Classes</div>
          <div style={{ fontFamily: 'var(--p-serif)', fontSize: 22, color: 'var(--p-text)', letterSpacing: '-0.03em', lineHeight: 1, marginTop: 2 }}>{segments.length}</div>
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((seg, i) => {
          const pct = ((seg.value / total) * 100).toFixed(0)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{seg.name}</span>
              <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{pct}%</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'var(--p-mono)', minWidth: 52, textAlign: 'right' }}>{fmtCompact(seg.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Inline SVG: BarChart (monthly revenue) ─────────────────────────────────────
interface BarPoint { month: string; revenus: number }

function MonthlyBarChart({ data, color = T.green }: { data: BarPoint[]; color?: string }) {
  if (data.length === 0) return null
  const W = 700, H = 180
  const PAD = { l: 56, r: 12, t: 10, b: 28 }
  const w = W - PAD.l - PAD.r
  const h = H - PAD.t - PAD.b
  const maxVal = Math.max(...data.map(d => d.revenus)) * 1.1 || 1
  const barW = (w / data.length) * 0.55
  const barGap = w / data.length

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.5} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / maxVal) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">
              {fmtCompact(t)}
            </text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const barH = (d.revenus / maxVal) * h
        const bx = PAD.l + i * barGap + (barGap - barW) / 2
        const by = PAD.t + h - barH
        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={barH} fill="url(#gradBar)" rx={3} />
            <text x={bx + barW / 2} y={PAD.t + h + 16} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Inline SVG: FireProjectionChart ───────────────────────────────────────────
interface FirePoint { year: string; value: number; target: number }

function FireProjectionChart({ data }: { data: FirePoint[] }) {
  if (data.length < 2) return null
  const W = 800, H = 220
  const PAD = { l: 64, r: 12, t: 12, b: 32 }
  const w = W - PAD.l - PAD.r
  const h = H - PAD.t - PAD.b
  const N = data.length - 1

  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.target))) * 1.08

  const xy = (i: number, v: number) => ({
    x: PAD.l + (i / (N || 1)) * w,
    y: PAD.t + h - (v / maxVal) * h,
  })

  const ptsV = data.map((d, i) => xy(i, d.value))
  const ptsT = data.map((d, i) => xy(i, d.target))

  const lineV = ptsV.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineT = ptsT.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaV = `${lineV} L${ptsV[N].x.toFixed(1)},${PAD.t + h} L${ptsV[0].x.toFixed(1)},${PAD.t + h} Z`

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]

  // Show every 5th year label
  const labelStep = Math.max(1, Math.floor(data.length / 7))
  const labelIndices = data.map((_, i) => i).filter(i => i % labelStep === 0 || i === N)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gradFire2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
          <stop offset="100%" stopColor={T.gold} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / maxVal) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">
              {fmtCompact(t)}
            </text>
          </g>
        )
      })}

      {labelIndices.map(i => {
        const p = ptsV[i]
        return (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">
            {data[i].year}
          </text>
        )
      })}

      <path d={areaV} fill="url(#gradFire2)" />
      <path d={lineT} fill="none" stroke={T.red} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} strokeLinejoin="round" />
      <path d={lineV} fill="none" stroke={T.gold} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={ptsV[N].x} cy={ptsV[N].y} r={4} fill={T.gold} />
      <circle cx={ptsV[N].x} cy={ptsV[N].y} r={9} fill={T.gold} opacity={0.18} />
    </svg>
  )
}

// ── Tab: Vue d'ensemble ────────────────────────────────────────────────────────
function TabOverview({ envelopes, router }: {
  envelopes: Envelope[]
  snapshots?: Snapshot[]
  router: ReturnType<typeof useRouter>
}) {
  const [range, setRange] = useState<TimeRange>('1a')
  const [chartCat, setChartCat] = useState('Tout')

  const PatrimoineNet = useMemo(() => envelopes.reduce((s, e) => s + computeMarketValue(e), 0), [envelopes])
  const pct = getPercentile(PatrimoineNet)
  const pctColor = pct >= 90 ? T.purple : pct >= 75 ? T.green : pct >= 50 ? T.gold : pct >= 25 ? T.orange : T.red

  const filteredEnvelopes = chartCat === 'Tout' ? envelopes : envelopes.filter(e => CHART_CATS[chartCat]?.includes(e.type))
  const filteredTotal = filteredEnvelopes.reduce((s, e) => s + computeMarketValue(e), 0)
  const evoData = useMemo(() => generateEvolutionData(filteredTotal, range), [filteredTotal, range])

  const userTierIdx = PYRAMID_TIERS.findIndex(t => pct >= t.minPct)

  // Allocation donut data
  const allocByClass = useMemo(() => {
    const acc: Record<string, number> = {}
    envelopes.forEach(e => {
      const cls = ENV_CFG[e.type].assetClass
      acc[cls] = (acc[cls] ?? 0) + computeMarketValue(e)
    })
    return Object.entries(acc).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [envelopes])

  const DONUT_COLORS = [T.purple, T.green, T.pink, T.amber, T.blue, T.orange, T.gray, T.cyan]
  const donutSegments = allocByClass.map((d, i) => ({ name: d.name, value: d.value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Evolution chart */}
      <SectionCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)' }}>Évolution du Patrimoine</div>
            <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Données simulées · mise à jour automatique</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
              {Object.keys(CHART_CATS).map(cat => (
                <button key={cat} onClick={() => setChartCat(cat)} style={{
                  padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${chartCat === cat ? T.gold : 'var(--p-line)'}`,
                  background: chartCat === cat ? 'var(--p-gold-12)' : 'transparent',
                  color: chartCat === cat ? T.gold : 'var(--p-text-dim)',
                }}>{cat}</button>
              ))}
            </div>
            {/* Range buttons */}
            {(['1m', '3m', '6m', '1a', 'max'] as TimeRange[]).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${range === r ? T.gold : 'var(--p-line)'}`,
                background: range === r ? 'var(--p-gold-12)' : 'transparent',
                color: range === r ? T.gold : 'var(--p-text-dim)',
              }}>{r}</button>
            ))}
          </div>
        </div>
        <EvolutionChart data={evoData} color={T.gold} />
      </SectionCard>

      {/* Bottom 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Pyramid */}
        <SectionCard title="Pyramide Patrimoniale française">
          <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 14 }}>
            Votre position : <span style={{ color: pctColor, fontWeight: 700 }}>{pct}ème percentile</span> sur {fmtCompact(PatrimoineNet)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            {PYRAMID_TIERS.map((tier, i) => {
              const isUser = i === userTierIdx
              return (
                <div key={tier.label} style={{
                  width: `${tier.w}%`, padding: '7px 12px', borderRadius: 6,
                  background: isUser ? `${tier.color}22` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isUser ? tier.color : 'rgba(255,255,255,0.05)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.2s',
                }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: isUser ? 700 : 500, color: isUser ? tier.color : 'var(--p-text-dim)' }}>
                      {tier.label}
                    </span>
                    {isUser && <span style={{ fontSize: 10, color: tier.color, marginLeft: 6 }}>◀ vous</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: isUser ? tier.color : 'var(--p-text-faint)', fontWeight: isUser ? 700 : 400 }}>{tier.threshold}</div>
                    <div style={{ fontSize: 9, color: 'var(--p-text-faint)' }}>{tier.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--p-text-faint)' }}>Sources : INSEE 2021 · Banque de France 2024</div>
        </SectionCard>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Allocation donut */}
          <SectionCard title="Allocation par classe">
            {donutSegments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--p-text-faint)', fontSize: 12 }}>
                Ajoutez des enveloppes pour voir l&apos;allocation
              </div>
            ) : (
              <AllocationDonut segments={donutSegments} />
            )}
          </SectionCard>

          {/* Paliers Patrimoniaux */}
          <SectionCard title="Paliers Patrimoniaux">
            {[
              { label: 'Médiane FR',    value: 183_000, color: T.orange },
              { label: '3ème quartile', value: 440_000, color: T.gold   },
              { label: '9ème décile',   value: 810_000, color: T.green  },
              { label: 'Top 1%',        value: 4_000_000, color: T.purple },
            ].map(b => (
              <BarProgress key={b.label} label={b.label} value={Math.min(PatrimoineNet, b.value)} max={b.value} color={b.color} />
            ))}
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--p-text-faint)' }}>
              Prochain palier : {fmtCompact(Math.max(0, (PYRAMID_TIERS.find((_, i) => i === Math.max(0, userTierIdx - 1))?.minPct ?? 100)))} pct
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Actifs ────────────────────────────────────────────────────────────────
function TabActifs({ envelopes, router }: { envelopes: Envelope[]; router: ReturnType<typeof useRouter> }) {
  const [filter, setFilter] = useState<EnvelopeType | 'ALL'>('ALL')

  const displayed = filter === 'ALL' ? envelopes : envelopes.filter(e => e.type === filter)
  const total = displayed.reduce((s, e) => s + computeMarketValue(e), 0)

  const byType = useMemo(() => {
    const acc: Record<string, number> = {}
    envelopes.forEach(e => { acc[e.type] = (acc[e.type] ?? 0) + computeMarketValue(e) })
    return acc
  }, [envelopes])

  const capitalInvesti = (env: Envelope) => {
    if (['LIVRET', 'CASH'].includes(env.type)) return computeMarketValue(env)
    if (env.type === 'IMMOBILIER') return Number(env.metadata.purchasePrice ?? computeMarketValue(env))
    if (['PEA', 'AV'].includes(env.type)) return Number(env.metadata.totalDeposited ?? 0) || env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
    return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Total actifs', value: fmtCompact(envelopes.reduce((s, e) => s + computeMarketValue(e), 0)), color: T.gold },
          { label: 'Enveloppes', value: `${envelopes.length}`, color: T.blue },
          { label: 'Positions', value: `${envelopes.reduce((s, e) => s + (e.positionCount ?? e.positions.length), 0)}`, color: T.purple },
          { label: 'Meilleur actif', value: ENV_CFG[Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] as EnvelopeType]?.label ?? '—', color: T.green },
          { label: 'Diversification', value: `${Object.keys(byType).length}/8`, color: T.orange },
        ].map(c => <StatCard key={c.label} label={c.label} value={c.value} color={c.color} />)}
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('ALL')} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${filter === 'ALL' ? T.gold : 'var(--p-line)'}`,
          background: filter === 'ALL' ? 'var(--p-gold-12)' : 'transparent',
          color: filter === 'ALL' ? T.gold : 'var(--p-text-dim)',
        }}>Tout ({envelopes.length})</button>
        {(Object.keys(byType) as EnvelopeType[]).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${filter === t ? ENV_CFG[t].color : 'var(--p-line)'}`,
            background: filter === t ? `${ENV_CFG[t].color}18` : 'transparent',
            color: filter === t ? ENV_CFG[t].color : 'var(--p-text-dim)',
          }}>{ENV_CFG[t].label}</button>
        ))}
      </div>

      {/* Table */}
      <SectionCard>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--p-line)' }}>
              {['Enveloppe', 'Type', 'Capital investi', 'Valeur actuelle', 'P&L', 'Poids', ''].map(h => (
                <th key={h} style={{ fontSize: 11, color: 'var(--p-text-dim)', textAlign: 'left', padding: '0 8px 10px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(env => {
              const val = computeMarketValue(env)
              const cap = capitalInvesti(env)
              const pl = val - cap
              const plPct = cap > 0 ? ((pl / cap) * 100).toFixed(1) : null
              const poids = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
              const cfg = ENV_CFG[env.type]
              return (
                <tr key={env.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/patrimoine/${env.id}`)}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{env.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>{env.positions.length} position{env.positions.length !== 1 ? 's' : ''}</div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${cfg.color}18`, color: cfg.color, fontWeight: 600 }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                    {cap > 0 ? fmtCompact(cap) : '—'}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, fontWeight: 700, color: T.gold, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtCompact(val)}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: pl >= 0 ? T.green : T.red }}>
                    {cap > 0 ? `${pl >= 0 ? '+' : ''}${fmtCompact(pl)}${plPct ? ` (${pl >= 0 ? '+' : ''}${plPct}%)` : ''}` : '—'}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 4, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${poids}%`, height: '100%', background: cfg.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{poids}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Détail →</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--p-text-faint)', fontSize: 13 }}>
            Aucune enveloppe dans cette catégorie
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Tab: Revenus ───────────────────────────────────────────────────────────────
function TabRevenus({ envelopes }: { envelopes: Envelope[] }) {
  const incomes = useMemo(() => {
    return envelopes.map(env => {
      let annual = 0
      if (env.type === 'LIVRET') {
        const rate = Number(env.metadata.interestRate ?? 3) / 100
        annual = computeMarketValue(env) * rate
      } else if (env.type === 'IMMOBILIER') {
        const rent = Number(env.metadata.monthlyRent ?? 0)
        annual = rent * 12
      } else if (env.type === 'AV') {
        const rate = Number(env.metadata.expectedReturn ?? 2.5) / 100
        annual = computeMarketValue(env) * rate
      } else if (['PEA', 'CTO'].includes(env.type)) {
        annual = env.positions.reduce((s, p) => s + estimatePositionIncome(p.symbol, null, p.quantity * p.pru), 0)
      } else if (env.type === 'PER') {
        const rate = Number(env.metadata.expectedReturn ?? 4) / 100
        annual = computeMarketValue(env) * rate
      }
      return { env, annual, monthly: annual / 12 }
    }).filter(x => x.annual > 0)
  }, [envelopes])

  const totalAnnual = incomes.reduce((s, x) => s + x.annual, 0)
  const totalMonthly = totalAnnual / 12

  const monthlyData: BarPoint[] = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map(m => ({
    month: m,
    revenus: Math.round(totalMonthly * (0.85 + Math.random() * 0.3)),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Revenus annuels estimés" value={fmtCompact(totalAnnual)} color={T.green} sub="Tous actifs confondus" />
        <StatCard label="Revenus mensuels" value={fmtCompact(totalMonthly)} color={T.gold} sub="Moyenne lissée" />
        <StatCard label="Taux de rendement" value={`${envelopes.reduce((s, e) => s + computeMarketValue(e), 0) > 0 ? ((totalAnnual / envelopes.reduce((s, e) => s + computeMarketValue(e), 0)) * 100).toFixed(2) : '0.00'}%`} color={T.blue} sub="Yield global moyen" />
      </div>

      <SectionCard title="Projection mensuelle">
        <MonthlyBarChart data={monthlyData} color={T.green} />
      </SectionCard>

      <SectionCard title="Revenus par enveloppe">
        {incomes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--p-text-faint)', fontSize: 13 }}>
            Aucun revenu estimé — ajoutez des taux ou des loyers dans vos enveloppes
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incomes.sort((a, b) => b.annual - a.annual).map(({ env, annual, monthly }) => {
              const cfg = ENV_CFG[env.type]
              return (
                <div key={env.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--p-card-2)', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${cfg.color}18`, color: cfg.color, fontWeight: 600, flexShrink: 0 }}>{cfg.label}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--p-text)' }}>{env.name}</span>
                  <span style={{ fontSize: 13, color: T.green, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(annual)}/an</span>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(monthly)}/mois</span>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Tab: FIRE ──────────────────────────────────────────────────────────────────
function TabFire({ envelopes }: { envelopes: Envelope[] }) {
  const [depensesAnnuelles, setDepensesAnnuelles] = useState(36_000)
  const [rendement, setRendement] = useState(5)
  const [epargneAnnuelle, setEpargneAnnuelle] = useState(12_000)

  const PatrimoineNet = envelopes.reduce((s, e) => s + computeMarketValue(e), 0)
  const fireTarget = depensesAnnuelles * 25 // règle des 4%
  const progress = fireTarget > 0 ? Math.min(100, (PatrimoineNet / fireTarget) * 100) : 0

  // Simulation projection FIRE
  const projectionData = useMemo((): FirePoint[] => {
    const pts: FirePoint[] = []
    let v = PatrimoineNet
    const r = rendement / 100
    for (let yr = 0; yr <= 30; yr++) {
      pts.push({ year: `+${yr}a`, value: Math.round(v), target: fireTarget })
      v = v * (1 + r) + epargneAnnuelle
    }
    return pts
  }, [PatrimoineNet, rendement, epargneAnnuelle, fireTarget])

  const yearsToFire = useMemo(() => {
    let v = PatrimoineNet
    const r = rendement / 100
    for (let yr = 0; yr <= 50; yr++) {
      if (v >= fireTarget) return yr
      v = v * (1 + r) + epargneAnnuelle
    }
    return null
  }, [PatrimoineNet, rendement, epargneAnnuelle, fireTarget])

  const leanFireTarget = depensesAnnuelles * 0.75 * 25
  const fatFireTarget = depensesAnnuelles * 2 * 25

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <SectionCard title="Paramètres FIRE">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Dépenses annuelles (€)', value: depensesAnnuelles, setter: setDepensesAnnuelles, step: 1000 },
            { label: 'Rendement attendu (%)', value: rendement, setter: setRendement, step: 0.5, isPercent: true },
            { label: 'Épargne annuelle (€)', value: epargneAnnuelle, setter: setEpargneAnnuelle, step: 1000 },
          ].map(({ label, value, setter, step }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 6 }}>{label}</div>
              <Input
                type="number"
                value={value}
                step={step}
                onChange={e => setter(Number(e.target.value))}
                style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', color: 'var(--p-text)' }}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Objectif FIRE" value={fmtCompact(fireTarget)} color={T.gold} sub="Règle des 4%" />
        <StatCard label="Progression" value={`${progress.toFixed(1)}%`} color={progress >= 100 ? T.green : T.orange} sub={`${fmtCompact(PatrimoineNet)} / ${fmtCompact(fireTarget)}`} />
        <StatCard label="Années restantes" value={yearsToFire != null ? `${yearsToFire} ans` : '> 50 ans'} color={T.blue} />
        <StatCard label="Revenus passifs cibles" value={fmtCompact(depensesAnnuelles / 12)} color={T.green} sub="4% de retrait mensuel" />
      </div>

      {/* Progress bar */}
      <SectionCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)' }}>Progression vers FIRE</span>
          <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{fmtCompact(PatrimoineNet)} / {fmtCompact(fireTarget)}</span>
        </div>
        <div style={{ height: 12, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            width: `${progress}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s',
            background: progress >= 100 ? T.green : `linear-gradient(90deg, ${T.red}, ${T.orange}, ${T.gold}, ${T.green})`,
          }} />
        </div>
        {/* Milestones */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Lean FIRE', target: leanFireTarget, desc: '75% dépenses actuelles', color: T.orange },
            { label: 'FIRE',      target: fireTarget,     desc: 'Dépenses actuelles',     color: T.gold   },
            { label: 'Fat FIRE',  target: fatFireTarget,  desc: '2× dépenses actuelles',  color: T.green  },
          ].map(ms => {
            const pct = fireTarget > 0 ? Math.min(100, (PatrimoineNet / ms.target) * 100) : 0
            return (
              <div key={ms.label} style={{ padding: '12px 14px', background: 'var(--p-card-2)', borderRadius: 10, border: `1px solid ${pct >= 100 ? ms.color : 'var(--p-line)'}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? ms.color : 'var(--p-text)', marginBottom: 4 }}>
                  {pct >= 100 ? '✓ ' : ''}{ms.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8 }}>{ms.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ms.color }}>{fmtCompact(ms.target)}</div>
                <div style={{ marginTop: 6, height: 4, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: ms.color, borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 3 }}>{pct.toFixed(0)}%</div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* Projection chart */}
      <SectionCard title="Projection Patrimoniale (30 ans)">
        <FireProjectionChart data={projectionData} />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: T.gold, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: T.gold, display: 'inline-block' }} /> Patrimoine projeté
          </span>
          <span style={{ fontSize: 11, color: T.red, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: T.red, display: 'inline-block', opacity: 0.7 }} /> Objectif FIRE
          </span>
        </div>
      </SectionCard>
    </div>
  )
}

// ── Tab: Géographie ────────────────────────────────────────────────────────────
function TabGeo({ envelopes }: { envelopes: Envelope[] }) {
  const allPositions = envelopes.flatMap(e => e.positions)
  const geoAlloc = calcPortfolioGeo(allPositions.map(p => ({ ticker: p.symbol, value: p.quantity * p.pru })))
  const PatrimoineNet = envelopes.reduce((s, e) => s + computeMarketValue(e), 0)

  // Build for display
  const REGIONS: Array<{ key: keyof GeoAllocation; label: string; color: string }> = [
    { key: 'northAmerica',    label: 'Amérique du Nord', color: T.blue   },
    { key: 'europe',          label: 'Europe',           color: T.gold   },
    { key: 'emergingMarkets', label: 'Marchés émergents',color: T.orange },
    { key: 'asiaPacific',     label: 'Asie-Pacifique',   color: T.pink   },
    { key: 'other',           label: 'Autres',           color: T.gray   },
  ]

  const totalPositionsValue = allPositions.reduce((s, p) => s + p.quantity * p.pru, 0)

  // Concentration: top 3 assets
  const topAssets = allPositions
    .reduce((acc: Record<string, { name: string; value: number }>, p) => {
      const key = p.symbol || p.name
      if (!acc[key]) acc[key] = { name: p.name || p.symbol, value: 0 }
      acc[key].value += p.quantity * p.pru
      return acc
    }, {})
  const topSorted = Object.values(topAssets).sort((a, b) => b.value - a.value).slice(0, 5)
  const herfindahl = topSorted.reduce((s, a) => {
    const w = totalPositionsValue > 0 ? a.value / totalPositionsValue : 0
    return s + w * w
  }, 0)
  const concentrationScore = Math.round(herfindahl * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Pays couverts" value={`${REGIONS.filter(r => (geoAlloc[r.key] ?? 0) > 0).length}`} color={T.blue} />
        <StatCard label="Concentration (H-Index)" value={`${concentrationScore}%`} color={concentrationScore > 60 ? T.red : concentrationScore > 30 ? T.orange : T.green} sub={concentrationScore > 60 ? 'Très concentré' : concentrationScore > 30 ? 'Modéré' : 'Bien diversifié'} />
        <StatCard label="Actifs trackés géo" value={`${allPositions.length}`} color={T.gold} sub="Positions avec allocation géo" />
      </div>

      {/* World map */}
      <SectionCard title="Répartition géographique">
        {allPositions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--p-text-faint)', fontSize: 13 }}>
            Ajoutez des ETFs ou actions à vos enveloppes pour voir la répartition géographique
          </div>
        ) : (
          <WorldMapChart
            allocation={geoAlloc}
            values={Object.fromEntries(REGIONS.map(r => [r.key, (geoAlloc[r.key] ?? 0) * geoAlloc.totalValue])) as Partial<Record<keyof GeoAllocation, number>>}
            totalValue={PatrimoineNet}
          />
        )}
      </SectionCard>

      {/* Region breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <SectionCard title="Allocation par région">
          {REGIONS.map(r => (
            <BarProgress key={r.key} label={r.label} value={geoAlloc[r.key] ?? 0} max={100} color={r.color} fmt={(v) => `${v.toFixed(1)}%`} />
          ))}
        </SectionCard>
        <SectionCard title="Top 5 positions">
          {topSorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--p-text-faint)', fontSize: 13 }}>Aucune position détaillée</div>
          ) : (
            topSorted.map((asset, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-faint)', width: 16, textAlign: 'center' }}>#{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--p-text)', fontWeight: 600 }}>{asset.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>
                    {totalPositionsValue > 0 ? ((asset.value / totalPositionsValue) * 100).toFixed(1) : '0'}% du portefeuille
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{fmtCompact(asset.value)}</span>
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  )
}

// ── Category shortcuts ─────────────────────────────────────────────────────────
const CAT_LINKS = [
  { label: 'Immobilier',    href: '/dashboard/patrimoine/immobilier', icon: Building2,  color: T.pink,   types: ['IMMOBILIER'] as EnvelopeType[] },
  { label: 'Actions & Fonds', href: '/dashboard/patrimoine/actions', icon: TrendingUp, color: T.purple, types: ['PEA', 'CTO', 'AV', 'PER'] as EnvelopeType[] },
  { label: 'Livrets',       href: '/dashboard/patrimoine/livrets',    icon: PiggyBank,  color: T.green,  types: ['LIVRET'] as EnvelopeType[] },
  { label: 'Crypto',        href: '/dashboard/patrimoine/autres',     icon: Bitcoin,    color: T.amber,  types: ['CRYPTO'] as EnvelopeType[] },
  { label: 'Comptes',       href: '/dashboard/patrimoine/comptes',    icon: Wallet,     color: T.gray,   types: ['CASH'] as EnvelopeType[] },
  { label: 'Emprunts',      href: '/dashboard/patrimoine/emprunts',   icon: CreditCard, color: T.red,    types: [] as EnvelopeType[] },
]

// ── Modal ajout enveloppe (simplifié) ─────────────────────────────────────────
const ENVELOPE_TYPES_LIST: EnvelopeType[] = ['LIVRET', 'IMMOBILIER', 'PEA', 'AV', 'CTO', 'CRYPTO', 'PER', 'CASH']

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PatrimoinePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [snapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('overview')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newType, setNewType] = useState<EnvelopeType>('PEA')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    loadEnvelopes()
    const handler = () => loadEnvelopes()
    window.addEventListener('Patrimoine-updated', handler)
    return () => window.removeEventListener('Patrimoine-updated', handler)
  }, [])

  async function loadEnvelopes() {
    try {
      const res = await fetch('/api/patrimoine/envelopes')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setEnvelopes(data)
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les enveloppes', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function createEnvelope() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/patrimoine/envelopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType, name: newName.trim(), metadata: {} }),
      })
      if (!res.ok) throw new Error()
      const env: Envelope = await res.json()
      setShowModal(false)
      setNewName('')
      window.dispatchEvent(new Event('Patrimoine-updated'))
      router.push(`/dashboard/patrimoine/${env.id}`)
    } catch {
      toast({ title: 'Erreur', description: "Impossible de créer l'enveloppe", variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const PatrimoineNet = useMemo(() => envelopes.reduce((s, e) => s + computeMarketValue(e), 0), [envelopes])
  const pct = getPercentile(PatrimoineNet)
  const pctColor = pct >= 90 ? T.purple : pct >= 75 ? T.green : pct >= 50 ? T.gold : pct >= 25 ? T.orange : T.red

  const tabs: Array<{ id: TabId; label: string; icon: typeof Eye }> = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
    { id: 'actifs',   label: 'Actifs',           icon: BarChart2 },
    { id: 'revenus',  label: 'Revenus',           icon: DollarSign },
    { id: 'fire',     label: 'FIRE',              icon: Flame },
    { id: 'geo',      label: 'Géographie',        icon: Globe },
  ]

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '14px 32px 0',
      background: 'var(--p-bg)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Mon Patrimoine</h1>
          <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>
            {envelopes.length} enveloppe{envelopes.length !== 1 ? 's' : ''} · {pct}ème percentile français
          </span>
        </div>
        <Button onClick={() => setShowModal(true)} style={{ background: 'var(--p-gold-12)', border: '1px solid var(--p-gold-30)', color: T.gold, gap: 6, fontSize: 12, padding: '6px 12px', height: 'auto' }}>
          <Plus size={14} /> Ajouter
        </Button>
      </div>

      {/* 3 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10, flexShrink: 0 }}>
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '10px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Patrimoine net</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.gold, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(PatrimoineNet)}</div>
          <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>{envelopes.length} enveloppe{envelopes.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '10px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Percentile France</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: pctColor, fontVariantNumeric: 'tabular-nums' }}>{pct}ème</div>
          <div style={{ height: 3, background: 'var(--p-line)', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${T.red}, ${T.orange}, ${T.gold}, ${T.green}, ${T.purple})`, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '10px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>FIRE (règle 4%)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.blue, fontVariantNumeric: 'tabular-nums' }}>
            {PatrimoineNet > 0 ? `${Math.min(100, ((PatrimoineNet / (36_000 * 25)) * 100)).toFixed(0)}%` : '0%'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>Objectif : {fmtCompact(36_000 * 25)}</div>
        </div>
      </div>

      {/* 6 category shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 10, flexShrink: 0 }}>
        {CAT_LINKS.map(cat => {
          const catTotal = envelopes.filter(e => cat.types.includes(e.type)).reduce((s, e) => s + computeMarketValue(e), 0)
          const Icon = cat.icon
          return (
            <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10,
                padding: '8px 6px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--p-line)')}
              >
                <Icon style={{ color: cat.color, width: 16, height: 16 }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text)' }}>{cat.label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, fontVariantNumeric: 'tabular-nums' }}>
                  {cat.types.length > 0 && catTotal > 0 ? fmtCompact(catTotal) : cat.types.length === 0 ? 'Voir' : '—'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 10, background: 'var(--p-card)', padding: 3, borderRadius: 10, border: '1px solid var(--p-line)', width: 'fit-content', flexShrink: 0 }}>
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.id ? 'var(--p-gold-12)' : 'transparent',
              color: tab === t.id ? T.gold : 'var(--p-text-dim)',
            }}>
              <Icon size={13} />{t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content — scrollable zone */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--p-text-faint)', fontSize: 14 }}>Chargement…</div>
        ) : (
          <>
            {tab === 'overview' && <TabOverview envelopes={envelopes} snapshots={snapshots} router={router} />}
            {tab === 'actifs'   && <TabActifs envelopes={envelopes} router={router} />}
            {tab === 'revenus'  && <TabRevenus envelopes={envelopes} />}
            {tab === 'fire'     && <TabFire envelopes={envelopes} />}
            {tab === 'geo'      && <TabGeo envelopes={envelopes} />}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--modal-surface)', border: '1px solid var(--modal-surface-border)', borderRadius: 20, padding: 28, width: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--p-text)' }}>Nouvelle enveloppe</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-dim)' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--p-text-dim)', marginBottom: 6, display: 'block' }}>Type d&apos;enveloppe</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {ENVELOPE_TYPES_LIST.map(t => {
                  const cfg = ENV_CFG[t]
                  return (
                    <button key={t} onClick={() => setNewType(t)} style={{
                      padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${newType === t ? cfg.color : 'var(--p-line)'}`,
                      background: newType === t ? `${cfg.color}18` : 'transparent',
                      color: newType === t ? cfg.color : 'var(--p-text-dim)',
                    }}>{cfg.label}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--p-text-dim)', marginBottom: 6, display: 'block' }}>Nom</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder={`Mon ${ENV_CFG[newType].label}`}
                onKeyDown={e => e.key === 'Enter' && createEnvelope()}
                style={{ background: 'var(--p-card-2)', border: '1px solid var(--p-line)', color: 'var(--p-text)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowModal(false)} style={{ color: 'var(--p-text-dim)' }}>Annuler</Button>
              <Button onClick={createEnvelope} disabled={!newName.trim() || creating} style={{ background: 'var(--p-gold-12)', border: '1px solid var(--p-gold-30)', color: T.gold }}>
                {creating ? 'Création…' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
