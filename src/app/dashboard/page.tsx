'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, ArrowUpRight, Sparkles,
  BarChart3, ChevronRight, ChevronDown, Percent, LayoutGrid,
  Bitcoin, Shield, Landmark,
} from 'lucide-react'
import { fmtCompact } from '@/lib/utils'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, unknown>; results: Record<string, unknown>; createdAt: string
}

interface Envelope {
  id: string; type: string; name: string; totalValue: number | null
}

const GOLD = '#f1c086'
const GOLD_BORDER = 'rgba(241,192,134,0.2)'

const QUICK_MODULES = [
  { href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp, color: '#34d399' },
  { href: '/dashboard/dca',      label: 'DCA',               icon: RefreshCw,  color: '#38bdf8' },
  { href: '/dashboard/fire',     label: 'FI/RE',             icon: Flame,      color: '#fb923c' },
  { href: '/dashboard/tax',      label: 'Impôts IR',         icon: Receipt,    color: '#fb7185' },
  { href: '/dashboard/mortgage', label: 'Prêt Immobilier',   icon: Building2,  color: '#f472b6' },
  { href: '/dashboard/rental',   label: 'Locatif',           icon: Wallet,     color: '#2dd4bf' },
]

const TYPE_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  compound:       { label: 'Intérêts',    color: '#34d399', icon: TrendingUp },
  dca:            { label: 'DCA',         color: '#38bdf8', icon: RefreshCw },
  fire:           { label: 'FI/RE',       color: '#fb923c', icon: Flame },
  buyrent:        { label: 'Achat/Loc',   color: '#a78bfa', icon: Home },
  mortgage:       { label: 'Prêt',        color: '#f472b6', icon: Building2 },
  rental:         { label: 'Locatif',     color: '#2dd4bf', icon: Wallet },
  tax:            { label: 'Impôts',      color: '#fb7185', icon: Receipt },
  retirement:     { label: 'Retraite',    color: '#fbbf24', icon: PiggyBank },
  'savings-rate': { label: 'Taux épargne',color: '#818cf8', icon: Percent },
  budget:         { label: 'Budget',      color: '#a3e635', icon: Calculator },
}

const ENVELOPE_COLORS: Record<string, string> = {
  LIVRET: '#34d399', IMMOBILIER: '#f472b6', PEA: '#818cf8',
  AV: '#fb923c', CTO: '#38bdf8', CRYPTO: '#f59e0b', PER: '#a78bfa', CASH: '#94a3b8',
}

const ENVELOPE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  LIVRET: PiggyBank, IMMOBILIER: Building2, PEA: TrendingUp,
  AV: Shield, CTO: TrendingUp, CRYPTO: Bitcoin, PER: Landmark, CASH: Wallet,
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
  return `Il y a ${Math.floor(diff / 86400)}j`
}

export default function HomePage() {
  const { data: session } = useSession()
  const [sims, setSims] = useState<Simulation[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loaded, setLoaded] = useState(false)
  const [recentOpen, setRecentOpen] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/simulations').then(r => r.json()).catch(() => []),
      fetch('/api/patrimoine/envelopes').then(r => r.json()).catch(() => []),
    ]).then(([simsData, envData]) => {
      if (Array.isArray(simsData)) setSims(simsData)
      if (Array.isArray(envData)) setEnvelopes(envData)
    }).finally(() => setLoaded(true))
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const totalSims = sims.length
  const thisMonth = sims.filter(s => {
    const d = new Date(s.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const totalPatrimoine = envelopes.reduce((acc, e) => acc + (e.totalValue ?? 0), 0)
  const nbEnvelopes = envelopes.length

  // Activity data (12 weeks)
  const now = Date.now()
  const weeks: Record<number, number> = {}
  sims.forEach(s => {
    const w = Math.floor((now - new Date(s.createdAt).getTime()) / (7 * 24 * 3600 * 1000))
    if (w <= 11) weeks[11 - w] = (weeks[11 - w] || 0) + 1
  })
  const activityData = Array.from({ length: 12 }, (_, i) => ({
    w: i === 11 ? 'Cette sem.' : `S-${11 - i}`,
    n: weeks[i] || 0,
  }))

  // Distribution
  const byType = sims.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {} as Record<string, number>)
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
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Patrimoine total */}
            <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: `linear-gradient(135deg, ${GOLD}14, transparent)`, border: `1px solid ${GOLD_BORDER}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,192,134,0.35)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
                  Patrimoine
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: GOLD, letterSpacing: '-0.025em', fontFamily: 'Geist Mono, monospace' }}>
                  {loaded ? (totalPatrimoine > 0 ? fmtCompact(totalPatrimoine) : '—') : '…'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>total estimé</p>
              </div>
            </Link>

            {/* Enveloppes */}
            <Link href="/dashboard/patrimoine" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
                  Enveloppes
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                    {loaded ? nbEnvelopes : '…'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>actives</p>
                </div>
              </div>
            </Link>

            {/* Simulations ce mois */}
            <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
                  Ce mois
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                    {loaded ? thisMonth : '…'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>simulations</p>
                </div>
              </div>
            </Link>

            {/* Total simulations */}
            <Link href="/dashboard/history" className="block" style={{ textDecoration: 'none' }}>
              <div className="rounded-xl p-4 transition-all duration-150"
                style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-dark-border)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
                  Simulations
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                    {loaded ? totalSims : '…'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>au total</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

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
                <XAxis dataKey="w" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
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
        style={{ minHeight: 'calc(100vh - 340px)' }}>

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
                        <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{meta?.label} · {timeAgo(sim.createdAt)}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* RIGHT: Patrimoine + Accès rapides */}
        <div className="p-5 xl:p-6 space-y-6">

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
              {QUICK_MODULES.map(mod => (
                <Link key={mod.href} href={mod.href}
                  className="group flex items-center gap-2.5 rounded-xl px-3 py-3 transition-all duration-150"
                  style={{ background: 'var(--card-dark)', border: `1px solid ${mod.color}20`, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '20'; (e.currentTarget as HTMLElement).style.transform = '' }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: mod.color + '18', border: `1px solid ${mod.color}25` }}>
                    <mod.icon className="h-3.5 w-3.5" style={{ color: mod.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.label}
                  </span>
                </Link>
              ))}
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
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>10 outils financiers</p>
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
