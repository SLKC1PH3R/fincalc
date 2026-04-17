'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { fmt, fmtCompact } from '@/lib/utils'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, ArrowUpRight, Sparkles,
  BarChart3, ChevronRight, ChevronDown, Percent, LayoutGrid,
  Bitcoin, Shield, Landmark, ArrowRight, Check,
} from 'lucide-react'
import { useCountUp } from '@/lib/use-count-up'
import { PatrimoineHistoryChart } from '@/components/PatrimoineHistoryChart'
import { ScoreGauge } from '@/components/ScoreGauge'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, unknown>; results: Record<string, unknown>; createdAt: string
}

interface Envelope {
  id: string; type: string; name: string; totalValue: number | null
}

const GOLD = '#f1c086'
const GOLD_BORDER = 'rgba(241,192,134,0.17)'

// ── Extract key result value from a simulation by type ────────────────────────
function getSimPreview(type: string, results: Record<string, unknown>): string | null {
  if (!results) return null
  const r = results as Record<string, number | string | boolean | null>
  switch (type) {
    case 'compound':     return r.final != null ? fmt(Number(r.final)) : null
    case 'dca':          return r.finalValue != null ? fmt(Number(r.finalValue)) : r.total != null ? fmt(Number(r.total)) : null
    case 'fire':         return r.yearsToFire != null ? `${r.yearsToFire} ans` : r.fireAge != null ? `à ${r.fireAge} ans` : null
    case 'mortgage':     return r.monthlyPayment != null ? `${fmt(Number(r.monthlyPayment))}/mois` : null
    case 'buyrent':      return r.buyBetter != null ? (r.buyBetter ? 'Achat' : 'Location') : null
    case 'rental':       return r.grossYield != null ? `${Number(r.grossYield).toFixed(2)}% brut` : null
    case 'tax':          return r.netTax != null ? fmt(Number(r.netTax)) : null
    case 'flat-tax':     return r.flatTax != null ? fmt(Number(r.flatTax)) : null
    case 'envelope-compare': return typeof r.bestEnvelope === 'string' ? r.bestEnvelope : null
    case 'retirement':   return r.monthlyPension != null ? `${fmt(Number(r.monthlyPension))}/mois` : null
    case 'savings-rate':     return r.savingsRate != null ? `${Number(r.savingsRate).toFixed(1)}%` : null
    case 'budget':           return r.needsMax != null ? `${fmt(Number(r.needsMax))} besoins` : null
    case 'emergency-fund':   return r.targetAmount != null ? `Objectif ${fmt(Number(r.targetAmount))}` : null
    case 'consumer-credit':  return r.monthlyPayment != null ? `${fmt(Number(r.monthlyPayment))}/mois` : null
    case 'succession':       return r.dmtg != null ? `${fmt(Number(r.dmtg))} DMTG` : null
    default:                 return null
  }
}

// ── 6 quick access modules ─────────────────────────────────────────────────────
const QUICK_MODULES = [
  { href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp, color: '#34d399' },
  { href: '/dashboard/dca',      label: 'DCA',               icon: RefreshCw,  color: '#38bdf8' },
  { href: '/dashboard/fire',     label: 'FI/RE',             icon: Flame,      color: '#fb923c' },
  { href: '/dashboard/tax',      label: 'Impôts IR',         icon: Receipt,    color: '#fb7185' },
  { href: '/dashboard/mortgage', label: 'Prêt Immobilier',   icon: Building2,  color: '#f472b6' },
  { href: '/dashboard/rental',   label: 'Locatif',           icon: Wallet,     color: '#2dd4bf' },
]

// ── Envelope display helpers ───────────────────────────────────────────────────
const ENVELOPE_COLORS: Record<string, string> = {
  LIVRET: '#34d399', IMMOBILIER: '#f472b6', PEA: '#818cf8',
  AV: '#fb923c', CTO: '#38bdf8', CRYPTO: '#f59e0b', PER: '#a78bfa', CASH: '#94a3b8',
}
const ENVELOPE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  LIVRET: PiggyBank, IMMOBILIER: Building2, PEA: TrendingUp,
  AV: Shield, CTO: TrendingUp, CRYPTO: Bitcoin, PER: Landmark, CASH: Wallet,
}

// ── Type metadata for simulations ─────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  compound:          { label: 'Intérêts',    color: '#34d399', icon: TrendingUp },
  dca:               { label: 'DCA',         color: '#38bdf8', icon: RefreshCw },
  fire:              { label: 'FI/RE',       color: '#fb923c', icon: Flame },
  buyrent:           { label: 'Achat/Loc',   color: '#a78bfa', icon: Home },
  mortgage:          { label: 'Prêt',        color: '#f472b6', icon: Building2 },
  rental:            { label: 'Locatif',     color: '#2dd4bf', icon: Wallet },
  tax:               { label: 'Impôts',      color: '#fb7185', icon: Receipt },
  'flat-tax':        { label: 'Flat Tax',    color: '#38bdf8', icon: Receipt },
  'envelope-compare':{ label: 'PEA/CTO/AV', color: '#818cf8', icon: Wallet },
  retirement:        { label: 'Retraite',    color: '#f1c086', icon: PiggyBank },
  'savings-rate':    { label: 'Taux épargne',   color: '#818cf8', icon: Percent },
  budget:            { label: 'Budget',          color: '#a3e635', icon: Calculator },
  'emergency-fund':  { label: 'Précaution',      color: '#34d399', icon: Shield },
  'consumer-credit': { label: 'Crédit conso',    color: '#fb7185', icon: Calculator },
  succession:        { label: 'Succession',       color: '#60a5fa', icon: PiggyBank },
}

// ── Score info helper ──────────────────────────────────────────────────────────
function scoreInfo(s: number): { label: string; color: string } {
  if (s >= 90) return { label: 'Excellent', color: '#f1c086' }
  if (s >= 80) return { label: 'Très bien', color: '#34d399' }
  if (s >= 60) return { label: 'Bien',      color: '#f1c086' }
  if (s >= 40) return { label: 'En progression', color: '#fb923c' }
  return { label: 'À améliorer', color: '#f87171' }
}

// ── Mini gauge (SVG arc) ───────────────────────────────────────────────────────

// ── Time ago ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

interface PatrimoineKPI { net: number; brut: number; dettes: number }

interface PatrimoineSnapshot { value: number; createdAt: string }

interface MarketIndex { label: string; symbol: string; price: number; changePct: number; isRate?: boolean }

interface ScorePillar { score: number; max: number; label: string }

interface ScoreDetails {
  security: ScorePillar & { months: number | null }
  realestate: ScorePillar & { ltv: number | null }
  longterm: ScorePillar & { hasAV: boolean; hasPEA: boolean; hasPER: boolean }
  diversification: ScorePillar & { types: string[] }
  risk: ScorePillar & { cryptoRatio: number }
}

// ── Patrimoine sparkline ───────────────────────────────────────────────────────
function PatrimoineSparkline({ snapshots }: { snapshots: PatrimoineSnapshot[] }) {
  if (snapshots.length < 2) return null
  const vals = snapshots.map(s => s.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const W = 80, H = 24, pad = 2
  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const last = vals[vals.length - 1]
  const prev = vals[vals.length - 2]
  const up = last >= prev
  const color = up ? '#34d399' : '#f87171'
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session } = useSession()
  const [sims, setSims] = useState<Simulation[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loaded, setLoaded] = useState(false)
  const [recentOpen, setRecentOpen] = useState(true)
  const [scoreWidget, setScoreWidget] = useState<{ score: number; label: string; color: string; quickActions: { label: string; href: string; pts: number }[]; details: ScoreDetails | null } | null>(null)
  const [patrimoineKPI, setPatrimoineKPI] = useState<PatrimoineKPI | null>(null)
  const [patrimoineTimeline, setPatrimoineTimeline] = useState<PatrimoineSnapshot[]>([])
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [indicesLoadedAt, setIndicesLoadedAt] = useState(0)
  const [onboardingDismissed, setOnboardingDismissed] = useState(true) // default true to avoid flash
  const [profileFilled, setProfileFilled] = useState(false)
  const [hasGoals, setHasGoals] = useState(false)

  // Load simulations + envelopes
  useEffect(() => {
    Promise.all([
      fetch('/api/simulations').then(r => r.json()).catch(() => []),
      fetch('/api/patrimoine/envelopes').then(r => r.json()).catch(() => []),
    ]).then(([simsData, envData]) => {
      if (Array.isArray(simsData)) setSims(simsData)
      if (Array.isArray(envData)) setEnvelopes(envData)
    }).finally(() => setLoaded(true))
  }, [])

  // Load score
  useEffect(() => {
    fetch('/api/score')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        const si = scoreInfo(d.score)
        setScoreWidget({ score: d.score, label: si.label, color: si.color, quickActions: d.quickActions ?? [], details: d.details ?? null })
      })
      .catch(() => {})
  }, [])

  // Onboarding dismissed state
  useEffect(() => {
    setOnboardingDismissed(localStorage.getItem('onboarding_dismissed') === '1')
  }, [])

  // Load profile + goals for progress bar
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.financialProfile) {
          const fp = d.financialProfile as Record<string, unknown>
          // Require at least the 3 key financial fields to consider the profile complete
          const filled = !!(fp.netMonthlySalary || fp.monthlySavings || fp.currentAssets)
          setProfileFilled(filled)
        }
      })
      .catch(() => {})
    fetch('/api/goals')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d) && d.length > 0) setHasGoals(true) })
      .catch(() => {})
    window.addEventListener('profile-updated', () => setProfileFilled(true))
    return () => { window.removeEventListener('profile-updated', () => setProfileFilled(true)) }
  }, [])

  // Load patrimoine timeline (for sparkline + delta)
  useEffect(() => {
    fetch('/api/patrimoine/timeline')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (Array.isArray(d)) setPatrimoineTimeline(d) })
      .catch(() => {})
  }, [])

  // Load market indices
  useEffect(() => {
    fetch('/api/portfolio/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: [] }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.indices) { setIndices(d.indices); setIndicesLoadedAt(Date.now()) } })
      .catch(() => {})
  }, [])

  // Compute patrimoine KPI (brut / dettes / net) — derived from already-loaded envelopes, no extra fetch
  useEffect(() => {
    if (envelopes.length === 0) return
    let brut = 0, dettes = 0
    for (const e of envelopes as unknown as Record<string, unknown>[]) {
      if (e.type === 'IMMOBILIER') {
        const meta = e.metadata as Record<string, number> | null
        brut += Number(meta?.currentValue ?? 0)
        dettes += Number(meta?.creditRemaining ?? 0)
      } else {
        const tv = e.totalValue as number | null
        const pos = e.positions as { pru: number; quantity: number }[] | undefined
        const val = tv !== null && tv !== undefined ? tv : (pos || []).reduce((s, p) => s + p.pru * p.quantity, 0)
        brut += val
      }
    }
    if (brut > 0) setPatrimoineKPI({ brut, dettes, net: Math.max(0, brut - dettes) })
  }, [envelopes])

  const firstName = session?.user?.name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const totalSims = sims.length
  const thisMonth = sims.filter(s => {
    const d = new Date(s.createdAt), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const nbEnvelopes = envelopes.length

  // Activity data (12 weeks)
  const now = Date.now()
  const weeks: Record<number, number> = {}
  sims.forEach(s => {
    const w = Math.floor((now - new Date(s.createdAt).getTime()) / (7 * 24 * 3600 * 1000))
    if (w <= 11) weeks[11 - w] = (weeks[11 - w] || 0) + 1
  })
  const activityData = Array.from({ length: 12 }, (_, i) => ({
    w: i === 11 ? 'Cette sem.' : `S-${11 - i}`, n: weeks[i] || 0,
  }))

  // Counter animations for KPI cards
  const animatedPatrimoine = useCountUp(patrimoineKPI?.net ?? 0, 1400, loaded && !!patrimoineKPI)
  const animatedEnvelopes = useCountUp(nbEnvelopes, 800, loaded)
  const animatedThisMonth = useCountUp(thisMonth, 800, loaded)
  const animatedTotalSims = useCountUp(totalSims, 900, loaded)

  const lastSimByType = sims.reduce((acc, s) => { if (!acc[s.type]) acc[s.type] = s; return acc }, {} as Record<string, Simulation>)
  const byType = sims.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {} as Record<string, number>)
  const sortedModules = [...QUICK_MODULES].sort((a, b) => {
    const ta = a.href.replace('/dashboard/', ''), tb = b.href.replace('/dashboard/', '')
    return (byType[tb] ?? 0) - (byType[ta] ?? 0)
  })
  const distData = Object.entries(byType).map(([type, count]) => ({
    name: TYPE_META[type]?.label || type, value: count, color: TYPE_META[type]?.color || '#6b7280',
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="flex-1" style={{ background: 'var(--content-bg)', minHeight: '100vh' }}>

      {/* ── MARKET TICKER STRIP ── */}
      {indices.length > 0 && (
        <div style={{ background: 'var(--card-dark)', borderBottom: '1px solid var(--section-border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', scrollbarWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px', borderRight: '1px solid var(--section-border)', flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Live</span>
            </div>
            {indices.map((idx, i) => {
              const pos = idx.changePct >= 0
              const color = idx.isRate ? '#60a5fa' : pos ? '#34d399' : '#f87171'
              return (
                <div key={idx.symbol} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRight: i < indices.length - 1 ? '1px solid var(--section-border)' : undefined, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 500 }}>{idx.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.02em' }}>
                    {idx.isRate ? `${idx.price}%` : idx.price >= 10000 ? `${(idx.price / 1000).toFixed(1)}k` : idx.price >= 1000 ? idx.price.toFixed(0) : idx.price.toFixed(2)}
                  </span>
                  {!idx.isRate && (
                    <span style={{ fontSize: 10, fontWeight: 600, color, background: color + '15', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.02em' }}>
                      {pos ? '+' : ''}{idx.changePct.toFixed(2)}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── PAGE CONTENT ── */}
      <div style={{ padding: '28px 24px 56px' }}>

        {/* ── Greeting row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 4 }}>
              {greeting}{firstName ? `, ${firstName}` : ''}
            </p>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: 0 }}>
              Tableau de bord
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--card-dark-border)', background: 'var(--card-dark)', cursor: 'pointer', fontSize: 11, color: 'var(--text-subtle)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-em)'; e.currentTarget.style.borderColor = 'rgba(241,192,134,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-subtle)'; e.currentTarget.style.borderColor = 'var(--card-dark-border)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Recherche
              <span style={{ display: 'flex', gap: 2 }}>
                {['⌘', 'K'].map(k => (
                  <kbd key={k} style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--card-dark-border)', borderRadius: 3, padding: '0 3px', fontFamily: 'inherit' }}>{k}</kbd>
                ))}
              </span>
            </button>
            <Link href="/dashboard/calendar"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--card-dark-border)', background: 'var(--card-dark)', cursor: 'pointer', fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-em)'; e.currentTarget.style.borderColor = 'rgba(241,192,134,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-subtle)'; e.currentTarget.style.borderColor = 'var(--card-dark-border)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Calendrier
            </Link>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>

          {/* Patrimoine net */}
          {(() => {
            const hasTimeline = patrimoineTimeline.length >= 2
            const tLast = hasTimeline ? patrimoineTimeline[patrimoineTimeline.length - 1].value : null
            const tPrev = hasTimeline ? patrimoineTimeline[patrimoineTimeline.length - 2].value : null
            const delta = tLast != null && tPrev != null ? tLast - tPrev : null
            const deltaPos = delta != null && delta >= 0
            const deltaColor = deltaPos ? '#34d399' : '#f87171'
            return (
              <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
                <div className="na-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${GOLD}18` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp style={{ width: 18, height: 18, color: GOLD }} />
                    </div>
                    {delta != null && loaded && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: deltaColor, background: deltaColor + '15', borderRadius: 20, padding: '3px 8px' }}>
                        {deltaPos ? '+' : ''}{fmtCompact(delta)}
                      </span>
                    )}
                  </div>
                  {loaded
                    ? <p style={{ fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontFamily: 'Geist Mono, monospace', marginBottom: 4, lineHeight: 1 }}>
                        {patrimoineKPI ? fmtCompact(animatedPatrimoine) : '—'}
                      </p>
                    : <div className="skeleton" style={{ height: 32, width: 110, marginBottom: 6 }} />
                  }
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Patrimoine net</p>
                </div>
              </Link>
            )
          })()}

          {/* Enveloppes */}
          <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
            <div className="na-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(52,211,153,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PiggyBank style={{ width: 18, height: 18, color: '#34d399' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.12)', borderRadius: 20, padding: '3px 8px' }}>Actives</span>
              </div>
              {loaded
                ? <p style={{ fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4, lineHeight: 1 }}>{animatedEnvelopes}</p>
                : <div className="skeleton" style={{ height: 32, width: 60, marginBottom: 6 }} />
              }
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Enveloppes</p>
            </div>
          </Link>

          {/* Simulations ce mois */}
          <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
            <div className="na-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(56,189,248,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator style={{ width: 18, height: 18, color: '#38bdf8' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', borderRadius: 20, padding: '3px 8px' }}>Ce mois</span>
              </div>
              {loaded
                ? <p style={{ fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4, lineHeight: 1 }}>{animatedThisMonth}</p>
                : <div className="skeleton" style={{ height: 32, width: 60, marginBottom: 6 }} />
              }
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Simulations ce mois</p>
            </div>
          </Link>

          {/* Total simulations */}
          <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
            <div className="na-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(251,146,60,0.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,146,60,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: 18, height: 18, color: '#fb923c' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#fb923c', background: 'rgba(251,146,60,0.12)', borderRadius: 20, padding: '3px 8px' }}>Total</span>
              </div>
              {loaded
                ? <p style={{ fontSize: 'clamp(1.3rem,2.5vw,1.6rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 4, lineHeight: 1 }}>{animatedTotalSims}</p>
                : <div className="skeleton" style={{ height: 32, width: 60, marginBottom: 6 }} />
              }
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Simulations</p>
            </div>
          </Link>
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20, alignItems: 'start' }} className="xl:grid-cols-[1fr_300px] grid-cols-1">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

            {/* Patrimoine history chart */}
            {loaded && nbEnvelopes > 0 && (
              <div className="na-card" style={{ padding: 20 }}>
                <PatrimoineHistoryChart />
              </div>
            )}

            {/* Activity + Distribution charts */}
            {loaded && totalSims > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Activity */}
                <div className="na-card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>Activité</p>
                      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '2px 0 0' }}>Simulations sur 12 semaines</p>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'var(--mini-card-bg)', border: '1px solid var(--card-dark-border)', borderRadius: 6, padding: '2px 8px' }}>12 sem.</span>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="actGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="w" hide /><YAxis hide />
                      <Tooltip contentStyle={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 8, fontSize: 11, color: 'var(--text-em)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                        formatter={(v: unknown) => [`${v} sim.`, '']} />
                      <Area type="monotone" dataKey="n" stroke={GOLD} strokeWidth={2} fill="url(#actGold)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribution */}
                <div className="na-card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>Répartition</p>
                      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '2px 0 0' }}>Par type de simulation</p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'Geist Mono, monospace', fontWeight: 700 }}>{totalSims}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ResponsiveContainer width={72} height={72}>
                      <PieChart>
                        <Pie data={distData} cx="50%" cy="50%" innerRadius={22} outerRadius={34} dataKey="value" paddingAngle={2} startAngle={90} endAngle={450}>
                          {distData.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {distData.slice(0, 5).map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted-c)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent simulations */}
            {loaded && totalSims > 0 && (
              <div className="na-card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--section-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles style={{ width: 14, height: 14, color: GOLD }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>Simulations récentes</span>
                  </div>
                  <Link href="/dashboard/history"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                    Voir tout <ArrowUpRight style={{ width: 12, height: 12 }} />
                  </Link>
                </div>
                <div>
                  {sims.slice(0, 6).map((sim, idx) => {
                    const meta = TYPE_META[sim.type]
                    const Icon = meta?.icon || BarChart3
                    const preview = getSimPreview(sim.type, sim.results)
                    return (
                      <Link key={sim.id}
                        href={`/dashboard/${sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', textDecoration: 'none', borderBottom: idx < 5 ? '1px solid var(--section-border)' : undefined, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: (meta?.color || '#6b7280') + '15', border: `1px solid ${meta?.color || '#6b7280'}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 15, height: 15, color: meta?.color || '#6b7280' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{sim.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: meta?.color || '#6b7280', background: (meta?.color || '#6b7280') + '15', borderRadius: 4, padding: '1px 6px' }}>{meta?.label || sim.type}</span>
                            {preview && <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontFamily: 'Geist Mono, monospace' }}>{preview}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{timeAgo(sim.createdAt)}</span>
                          <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', opacity: 0.5 }} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state — no simulations */}
            {loaded && totalSims === 0 && (
              <div className="na-card" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
                  <rect width="72" height="72" rx="20" fill={`${GOLD}12`} />
                  <rect x="16" y="38" width="8" height="18" rx="3" fill={`${GOLD}55`} />
                  <rect x="28" y="28" width="8" height="28" rx="3" fill={`${GOLD}80`} />
                  <rect x="40" y="18" width="8" height="38" rx="3" fill={GOLD} />
                  <path d="M13 54 Q22 38 30 32 Q40 24 56 14" stroke={`${GOLD}60`} strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
                  <circle cx="56" cy="14" r="3" fill={GOLD} />
                </svg>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-em)', marginBottom: 6 }}>Lancez votre première simulation</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                    Explorez les intérêts composés, le FIRE, la fiscalité et bien plus encore.
                  </p>
                </div>
                <Link href="/dashboard/compound" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: `${GOLD}18`, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}>
                  <TrendingUp style={{ width: 15, height: 15 }} />
                  Commencer avec les Intérêts Composés
                </Link>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score Patrimonial widget */}
            {scoreWidget && (
              <Link href="/dashboard/score" style={{ textDecoration: 'none' }}>
                <div className="na-card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'transform 0.15s, border-color 0.2s', border: `1px solid ${scoreWidget.color}28` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = scoreWidget.color + '55' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = scoreWidget.color + '28' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <ScoreGauge score={scoreWidget.score} color={scoreWidget.color} size={64} showLabel={false} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Score Patrimonial</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreWidget.color, background: scoreWidget.color + '15', borderRadius: 5, padding: '1px 6px' }}>{scoreWidget.score}</span>
                      </div>
                      <span style={{ fontSize: 11, color: scoreWidget.color, fontWeight: 600 }}>{scoreWidget.label}</span>
                      {scoreWidget.details && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {([
                            { key: 'security', label: 'S', color: '#38bdf8' },
                            { key: 'realestate', label: 'I', color: '#34d399' },
                            { key: 'longterm', label: 'L', color: '#f1c086' },
                            { key: 'diversification', label: 'D', color: '#fb923c' },
                            { key: 'risk', label: 'R', color: '#f87171' },
                          ] as { key: keyof ScoreDetails; label: string; color: string }[]).map(({ key, label, color }) => {
                            const p = scoreWidget.details![key]
                            const pct = p ? p.score / p.max : 0
                            return (
                              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.round(pct * 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>{label}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <ArrowRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', flexShrink: 0 }} />
                  </div>
                </div>
              </Link>
            )}

            {/* Enveloppes */}
            {loaded && nbEnvelopes > 0 && (
              <div className="na-card" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--section-border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Mes enveloppes</span>
                  <Link href="/dashboard/patrimoine" style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                    Voir tout <ArrowUpRight style={{ width: 11, height: 11 }} />
                  </Link>
                </div>
                <div>
                  {envelopes.slice(0, 5).map((env, i) => {
                    const Icon = ENVELOPE_ICONS[env.type] || Wallet
                    const color = ENVELOPE_COLORS[env.type] || '#6b7280'
                    return (
                      <Link key={env.id} href={`/dashboard/patrimoine/${env.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none', borderBottom: i < Math.min(envelopes.length, 5) - 1 ? '1px solid var(--section-border)' : undefined, transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 14, height: 14, color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{env.name}</p>
                          <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: '1px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{env.type}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
                          {env.totalValue != null ? fmtCompact(env.totalValue) : '—'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick access modules */}
            <div className="na-card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Accès rapides</span>
                <Link href="/dashboard/simulateurs" style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                  Tous <ArrowUpRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {sortedModules.map(mod => {
                  const preview = lastSimByType[mod.href.replace('/dashboard/', '')] &&
                    getSimPreview(mod.href.replace('/dashboard/', ''), lastSimByType[mod.href.replace('/dashboard/', '')]?.results)
                  return (
                    <Link key={mod.href} href={mod.href}
                      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 10, background: mod.color + '08', border: `1px solid ${mod.color}18`, textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '45'; (e.currentTarget as HTMLElement).style.background = mod.color + '12' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '18'; (e.currentTarget as HTMLElement).style.background = mod.color + '08' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: mod.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <mod.icon style={{ width: 13, height: 13, color: mod.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.label}</p>
                        {preview && <p style={{ fontSize: 10, color: mod.color, margin: '2px 0 0', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
              <Link href="/dashboard/simulateurs"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: `${GOLD}08`, border: `1px solid ${GOLD_BORDER}`, textDecoration: 'none', marginTop: 8, transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = GOLD_BORDER)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LayoutGrid style={{ width: 14, height: 14, color: GOLD }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>37 simulateurs & outils</span>
                </div>
                <ArrowRight style={{ width: 13, height: 13, color: GOLD }} />
              </Link>
            </div>

            {/* ── Prise en main progress bar ── */}
            {loaded && !onboardingDismissed && (() => {
              const steps = [
                { done: true,          label: 'Créer un compte',                  href: null,                       cta: null },
                { done: profileFilled, label: 'Renseigner votre profil financier', href: '/dashboard/profil',        cta: 'Compléter' },
                { done: totalSims > 0, label: 'Lancer votre première simulation',  href: '/dashboard/simulateurs',   cta: 'Commencer' },
                { done: hasGoals,      label: 'Ajouter un objectif patrimonial',   href: '/dashboard/goals',         cta: 'Ajouter' },
                { done: !!scoreWidget, label: 'Consulter votre Score Patrimonial', href: '/dashboard/score',         cta: 'Voir' },
              ]
              const completed = steps.filter(s => s.done).length
              const allDone = completed === steps.length
              if (allDone) return null
              return (
                <div className="na-card" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: 0 }}>Prise en main</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>{completed}/{steps.length} complétées</p>
                    </div>
                    <button
                      onClick={() => { localStorage.setItem('onboarding_dismissed', '1'); setOnboardingDismissed(true) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0 }}
                    >×</button>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(completed / steps.length) * 100}%`, borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}80, ${GOLD})`, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {steps.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: s.done ? 'rgba(52,211,153,0.04)' : 'transparent' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.done ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                          {s.done
                            ? <Check style={{ width: 10, height: 10, color: '#34d399' }} />
                            : <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-subtle)' }}>{i + 1}</span>
                          }
                        </div>
                        <span style={{ flex: 1, fontSize: 11, color: s.done ? 'var(--text-muted-c)' : 'var(--text-em)', textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.5 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                        {!s.done && s.href && (
                          <a href={s.href} style={{ fontSize: 10, fontWeight: 600, color: GOLD, textDecoration: 'none', background: `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {s.cta}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
