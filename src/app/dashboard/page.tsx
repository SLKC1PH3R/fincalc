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
function MiniGauge({ score, color }: { score: number; color: string }) {
  const r = 28, cx = 36, cy = 36
  const startAngle = 210, totalArc = 300
  const filledArc = (score / 100) * totalArc
  const toRad = (d: number) => (d * Math.PI) / 180
  const pt = (a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) })
  const ts = pt(startAngle), te = pt(startAngle + totalArc), fe = pt(startAngle + filledArc)
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <path d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 1 1 ${te.x} ${te.y}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} strokeLinecap="round" />
      {score > 0 && (
        <path d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 ${filledArc > 180 ? 1 : 0} 1 ${fe.x} ${fe.y}`} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
      )}
      <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize={15} fontWeight={700} fontFamily="system-ui">{score}</text>
    </svg>
  )
}

// ── Time ago ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

interface PatrimoineKPI { net: number; brut: number; dettes: number }

interface MarketIndex { label: string; symbol: string; price: number; changePct: number; isRate?: boolean }

// ── Main component ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session } = useSession()
  const [sims, setSims] = useState<Simulation[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loaded, setLoaded] = useState(false)
  const [recentOpen, setRecentOpen] = useState(true)
  const [scoreWidget, setScoreWidget] = useState<{ score: number; label: string; color: string; quickActions: { label: string; href: string; pts: number }[] } | null>(null)
  const [patrimoineKPI, setPatrimoineKPI] = useState<PatrimoineKPI | null>(null)
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
        setScoreWidget({ score: d.score, label: si.label, color: si.color, quickActions: d.quickActions ?? [] })
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
          const filled = Object.values(fp).some(v => v !== undefined && v !== null && v !== '')
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

  // Compute patrimoine KPI (brut / dettes / net)
  useEffect(() => {
    fetch('/api/patrimoine/envelopes')
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown[] | null) => {
        if (!Array.isArray(data)) return
        let brut = 0, dettes = 0
        for (const e of data as Record<string, unknown>[]) {
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
      })
      .catch(() => {})
  }, [])

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

      {/* ── HERO ── */}
      <div className="relative overflow-hidden px-5 xl:px-6"
        style={{ borderBottom: '1px solid var(--section-border)', paddingTop: 'clamp(20px,3vw,36px)', paddingBottom: 'clamp(20px,3vw,36px)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 50%, ${GOLD}06, transparent 60%)` }} />

        <div className="relative">
          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 4 }}>
                {greeting}{firstName ? `, ${firstName}` : ''}
              </p>
              <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.75rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Tableau de bord
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {indicesLoadedAt > 0 && ` · Marchés ${timeAgo(new Date(indicesLoadedAt).toISOString()).toLowerCase()}`}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {/* Patrimoine total */}
            <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: `linear-gradient(135deg, ${GOLD}14, transparent)`, border: `1px solid ${GOLD_BORDER}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,192,134,0.35)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>Patrimoine</p>
                {loaded
                  ? <p style={{ fontSize: '1.5rem', fontWeight: 700, color: GOLD, letterSpacing: '-0.025em', fontFamily: 'Geist Mono, monospace' }}>{patrimoineKPI ? fmtCompact(animatedPatrimoine) : '—'}</p>
                  : <div className="skeleton" style={{ height: 32, width: 110, marginBottom: 4 }} />
                }
                <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>net estimé</p>
              </div>
            </Link>

            {/* Enveloppes */}
            <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>Enveloppes</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {loaded
                    ? <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>{animatedEnvelopes}</p>
                    : <div className="skeleton" style={{ height: 32, width: 48, marginBottom: 4 }} />
                  }
                  {loaded && <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>actives</p>}
                </div>
              </div>
            </Link>

            {/* Simulations ce mois */}
            <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>Ce mois</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {loaded
                    ? <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>{animatedThisMonth}</p>
                    : <div className="skeleton" style={{ height: 32, width: 48, marginBottom: 4 }} />
                  }
                  {loaded && <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>simulations</p>}
                </div>
              </div>
            </Link>

            {/* Total simulations */}
            <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>Simulations</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  {loaded
                    ? <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>{animatedTotalSims}</p>
                    : <div className="skeleton" style={{ height: 32, width: 48, marginBottom: 4 }} />
                  }
                  {loaded && <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>au total</p>}
                </div>
              </div>
            </Link>
          </div>

          {/* Market indices strip */}
          {indices.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {indices.map(idx => {
                const pos = idx.changePct >= 0
                const color = idx.isRate ? '#60a5fa' : pos ? '#34d399' : '#f87171'
                return (
                  <div key={idx.symbol} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                    borderRadius: 10, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)', fontWeight: 500 }}>{idx.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
                      {idx.isRate ? `${idx.price}%` : idx.price >= 10000 ? `${(idx.price / 1000).toFixed(1)}k` : idx.price >= 1000 ? idx.price.toFixed(0) : idx.price.toFixed(2)}
                    </span>
                    {!idx.isRate && (
                      <span style={{ fontSize: 10, fontWeight: 600, color, background: color + '18', borderRadius: 5, padding: '1px 5px' }}>
                        {pos ? '+' : ''}{idx.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Score Patrimonial widget */}
          {scoreWidget && (
            <Link href="/dashboard/score" style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}>
              <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreWidget.color}28`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = scoreWidget.color + '55')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = scoreWidget.color + '28')}>
                <MiniGauge score={scoreWidget.score} color={scoreWidget.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>Score Patrimonial</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: scoreWidget.color, background: scoreWidget.color + '15', border: `1px solid ${scoreWidget.color}30`, borderRadius: 6, padding: '1px 7px' }}>{scoreWidget.label}</span>
                  </div>
                  {scoreWidget.quickActions.length > 0 ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {scoreWidget.quickActions.slice(0, 2).map((qa, i) => (
                        <span key={i} style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>+{qa.pts}pts</span> · {qa.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Profil complet — voir le détail</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-subtle)', flexShrink: 0 }}>
                  <span>Détail</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── PATRIMOINE HISTORY ── */}
      {loaded && nbEnvelopes > 0 && (
        <div className="px-5 xl:px-6 pt-4" style={{ borderBottom: loaded && totalSims > 0 ? undefined : '1px solid var(--section-border)' }}>
          <PatrimoineHistoryChart />
        </div>
      )}

      {/* ── CHARTS ── (if data) */}
      {loaded && totalSims > 0 && (
        <div className="px-5 xl:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          style={{ borderBottom: '1px solid var(--section-border)' }}>
          {/* Activity */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Activité</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>12 semaines</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="w" hide /><YAxis hide />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                  formatter={(v: unknown) => [`${v} sim.`, '']} />
                <Area type="monotone" dataKey="n" stroke={GOLD} strokeWidth={1.5} fill="url(#actGold)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Répartition</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{totalSims} sim.</span>
            </div>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" innerRadius={26} outerRadius={38} dataKey="value" paddingAngle={2} startAngle={90} endAngle={450}>
                    {distData.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {distData.slice(0, 6).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-em)', flexShrink: 0 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className={`grid grid-cols-1 gap-0 ${loaded && totalSims > 0 ? 'xl:grid-cols-[280px_1fr]' : ''}`}
        style={{ minHeight: 'calc(100vh - 380px)' }}>

        {/* LEFT: Recent simulations */}
        {loaded && totalSims > 0 && (
          <div className="p-5 xl:p-6" style={{ borderRight: '1px solid var(--section-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setRecentOpen(v => !v)}
                className="flex items-center gap-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)' }}>Récentes</span>
                <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-subtle)', transition: 'transform 0.2s', transform: recentOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
              </button>
              <Link href="/dashboard/history" className="flex items-center gap-1"
                style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {recentOpen && (
              <div className="space-y-1">
                {sims.slice(0, 8).map(sim => {
                  const meta = TYPE_META[sim.type]
                  const Icon = meta?.icon || BarChart3
                  const preview = getSimPreview(sim.type, sim.results)
                  return (
                    <Link key={sim.id}
                      href={`/dashboard/${sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                      style={{ textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--icon-chip-bg)', border: '1px solid var(--icon-chip-border)' }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: meta?.color || '#6b7280' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, color: 'var(--text-em)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.name}</p>
                        <div className="flex items-center gap-2">
                          <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{meta?.label}</p>
                          {preview && <span style={{ fontSize: 11, fontWeight: 600, color: meta?.color, fontFamily: 'Geist Mono, monospace' }}>{preview}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{timeAgo(sim.createdAt)}</span>
                        <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* RIGHT: Enveloppes + Accès rapides */}
        <div className="p-5 xl:p-6 space-y-6">

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
              <div style={{ background: `linear-gradient(135deg, ${GOLD}08, rgba(129,140,248,0.04))`, border: `1px solid ${GOLD_BORDER}`, borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: GOLD, margin: 0 }}>Prise en main PatrImo</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>{completed}/{steps.length} étapes complétées</p>
                  </div>
                  <button
                    onClick={() => { localStorage.setItem('onboarding_dismissed', '1'); setOnboardingDismissed(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0 }}
                  >×</button>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(completed / steps.length) * 100}%`, borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}80, ${GOLD})`, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: s.done ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${s.done ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.done ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                        {s.done
                          ? <Check style={{ width: 11, height: 11, color: '#34d399' }} />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)' }}>{i + 1}</span>
                        }
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: s.done ? 'var(--text-muted-c)' : 'var(--text-em)', textDecoration: s.done ? 'line-through' : 'none', opacity: s.done ? 0.5 : 1 }}>{s.label}</span>
                      {!s.done && s.href && (
                        <a href={s.href} style={{ fontSize: 11, fontWeight: 600, color: GOLD, textDecoration: 'none', background: `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {s.cta} →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Enveloppes patrimoine */}
          {loaded && nbEnvelopes > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                  Mes enveloppes
                </span>
                <Link href="/dashboard/patrimoine"
                  className="flex items-center gap-1"
                  style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                  Vue complète <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {envelopes.slice(0, 6).map(env => {
                  const Icon = ENVELOPE_ICONS[env.type] || Wallet
                  const color = ENVELOPE_COLORS[env.type] || '#6b7280'
                  return (
                    <Link key={env.id} href={`/dashboard/patrimoine/${env.id}`}
                      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-150"
                      style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', textDecoration: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color + '40' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '18', border: `1px solid ${color}25` }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted-c)', fontFamily: 'Geist Mono, monospace' }}>
                          {env.totalValue != null ? fmtCompact(env.totalValue) : '—'}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-subtle)' }} />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accès rapides */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
                Accès rapides
              </span>
              <Link href="/dashboard/simulateurs"
                className="flex items-center gap-1"
                style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                Tous les simulateurs <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {sortedModules.map(mod => {
                const preview = lastSimByType[mod.href.replace('/dashboard/', '')] &&
                  getSimPreview(mod.href.replace('/dashboard/', ''), lastSimByType[mod.href.replace('/dashboard/', '')]?.results)
                return (
                  <Link key={mod.href} href={mod.href}
                    className="group flex items-center gap-2.5 rounded-xl px-3 py-3 transition-all duration-150"
                    style={{ background: 'var(--card-dark)', border: `1px solid ${mod.color}20`, textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '20'; (e.currentTarget as HTMLElement).style.transform = '' }}>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: mod.color + '18', border: `1px solid ${mod.color}25` }}>
                      <mod.icon className="h-3.5 w-3.5" style={{ color: mod.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mod.label}
                      </p>
                      {preview && (
                        <p style={{ fontSize: 10, color: mod.color, fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preview}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* CTA Simulateurs */}
            <Link href="/dashboard/simulateurs"
              className="flex items-center justify-between w-full rounded-xl px-4 py-3 transition-all duration-150"
              style={{ background: `linear-gradient(135deg, rgba(241,192,134,0.08), transparent)`, border: `1px solid ${GOLD_BORDER}`, textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,192,134,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER }}>
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="h-4 w-4" style={{ color: GOLD }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)' }}>Tous les simulateurs</p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{'37 simulateurs & outils'}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
