'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  TrendingUp,
  Flame,
  Receipt,
  Home,
  Building2,
  Wallet,
  PiggyBank,
  RefreshCw,
  Calculator,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  ChevronRight
} from 'lucide-react'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, any>; results: Record<string, any>; createdAt: string
}

const GOLD = '#f1c086'
const GOLD_DARK = 'rgba(241,192,134,0.1)'
const GOLD_BORDER = 'rgba(241,192,134,0.2)'

const MODULES = [
  { href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp, desc: 'Effet boule de neige', tag: 'Épargne', color: '#34d399' },
  { href: '/dashboard/dca', label: 'DCA', icon: RefreshCw, desc: 'Investissement régulier', tag: 'Épargne', color: '#38bdf8' },
  { href: '/dashboard/fire', label: 'FI/RE', icon: Flame, desc: 'Indépendance financière', tag: 'Épargne', color: '#fb923c' },
  { href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home, desc: 'Stratégie résidentielle', tag: 'Immobilier', color: '#a78bfa' },
  { href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2, desc: 'Mensualités & TAEG', tag: 'Immobilier', color: '#f472b6' },
  { href: '/dashboard/rental', label: 'Rentabilité Locative', icon: Wallet, desc: 'Cashflow locatif', tag: 'Immobilier', color: '#2dd4bf' },
  { href: '/dashboard/tax', label: 'Impôts IR', icon: Receipt, desc: 'Calcul IR & TMI', tag: 'Fiscal', color: '#fb7185' },
  { href: '/dashboard/retirement', label: 'Retraite', icon: PiggyBank, desc: 'Pension & PER', tag: 'Fiscal', color: '#fbbf24' },
  { href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator, desc: 'Règle d\'or', tag: 'Budget', color: '#a3e635' },
]

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  compound:   { label: 'Intérêts',  color: '#34d399', icon: TrendingUp },
  dca:        { label: 'DCA',       color: '#38bdf8', icon: RefreshCw },
  fire:       { label: 'FI/RE',     color: '#fb923c', icon: Flame },
  buyrent:    { label: 'Achat/Loc', color: '#a78bfa', icon: Home },
  mortgage:   { label: 'Prêt',      color: '#f472b6', icon: Building2 },
  rental:     { label: 'Locatif',   color: '#2dd4bf', icon: Wallet },
  tax:        { label: 'Impôts',    color: '#fb7185', icon: Receipt },
  retirement: { label: 'Retraite',  color: '#fbbf24', icon: PiggyBank },
  budget:     { label: 'Budget',    color: '#a3e635', icon: Calculator },
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
  const [loaded, setLoaded] = useState(false)
  const [activeFilter, setActiveFilter] = useState('Tout')

  useEffect(() => {
    fetch('/api/simulations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSims(data)
    }).finally(() => setLoaded(true))
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const totalSims = sims.length
  const thisWeek = sims.filter(s => Date.now() - new Date(s.createdAt).getTime() < 7 * 86400 * 1000).length

  // Activity data
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
  const distData = Object.entries(byType).map(([type, count]) => ({ name: TYPE_META[type]?.label || type, value: count, color: TYPE_META[type]?.color || '#6b7280' }))

  // Most used
  const mostUsed = distData.sort((a, b) => b.value - a.value)[0]

  return (
    <div className="flex-1" style={{ background: '#080808', minHeight: '100vh' }}>

      {/* ── HERO SECTION — full width like Finary ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(24px,4vw,40px) clamp(20px,4vw,40px)' }}>
        {/* Subtle bg glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 50%, ${GOLD}06, transparent 60%)` }} />

        <div className="relative">
          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{greeting}{firstName ? `, ${firstName}` : ''}</p>
              <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.75rem)', fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
                Tableau de bord
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Simulations', value: totalSims, sub: 'total' },
              { label: 'Cette semaine', value: thisWeek, sub: 'nouvelles' },
              { label: 'Module favori', value: mostUsed?.name || '—', sub: mostUsed ? `${mostUsed.value} fois` : '' },
              { label: 'Calculateurs', value: '9', sub: 'disponibles' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: i === 3 ? `linear-gradient(135deg, ${GOLD}12, rgba(0,0,0,0))` : '#0f0f0f', border: `1px solid ${i === 3 ? GOLD_BORDER : 'rgba(255,255,255,0.06)'}` }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 600, color: i === 3 ? GOLD : '#fff', letterSpacing: '-0.025em' }}>{s.value}</p>
                {s.sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts — only if data */}
          {loaded && totalSims > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Activity */}
              <div className="rounded-xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Activité</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>12 semaines</span>
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="w" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: '#fff' }}
                      formatter={(v: any) => [`${v} sim.`, '']} />
                    <Area type="monotone" dataKey="n" stroke={GOLD} strokeWidth={1.5} fill="url(#actGold)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Distribution */}
              <div className="rounded-xl p-5" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Répartition</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{totalSims} sim.</span>
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
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT SIMS + MODULES — Finary bottom layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0" style={{ minHeight: 'calc(100vh - 400px)' }}>

        {/* LEFT: Recent simulations */}
        {loaded && totalSims > 0 && (
          <div className="xl:col-span-1 p-5 xl:p-6" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Récentes</span>
              </div>
              <Link href="/dashboard/history" className="flex items-center gap-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {sims.slice(0, 8).map(sim => {
                const meta = TYPE_META[sim.type]
                const Icon = meta?.icon || BarChart3
                return (
                  <Link key={sim.id} href={`/dashboard/${sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: meta?.color || '#6b7280' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.name}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{meta?.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{timeAgo(sim.createdAt)}</span>
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* RIGHT: Modules grid */}
        <div className={`${loaded && totalSims > 0 ? 'xl:col-span-2' : 'xl:col-span-3'} p-5 xl:p-6`}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Calculateurs
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>9 modules</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MODULES.map(mod => (
              <Link key={mod.href} href={mod.href} className="group block" style={{ textDecoration: 'none' }}>
                <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-200"
                  style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color + '40'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = '' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 0% 0%, ${mod.color}10, transparent 55%)` }} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ background: mod.color + '15', border: `1px solid ${mod.color}25` }}>
                        <mod.icon className="h-4 w-4" style={{ color: mod.color }} />
                      </div>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{mod.tag}</span>
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{mod.label}</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5, marginBottom: 10 }}>{mod.desc}</p>
                    <div className="flex items-center gap-1" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      <span>Ouvrir</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
