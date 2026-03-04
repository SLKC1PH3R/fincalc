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
  ChevronRight,
  ChevronDown,
  Percent,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, any>; results: Record<string, any>; createdAt: string
}

const GOLD = '#f97316'
const GOLD_BORDER = 'rgba(249,115,22,0.2)'

const MODULES = [
  { href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp, desc: 'Effet boule de neige', tag: 'Épargne', color: '#34d399' },
  { href: '/dashboard/dca', label: 'DCA', icon: RefreshCw, desc: 'Investissement régulier', tag: 'Épargne', color: '#38bdf8' },
  { href: '/dashboard/fire', label: 'FI/RE', icon: Flame, desc: 'Indépendance financière', tag: 'Épargne', color: '#fb923c' },
  { href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home, desc: 'Stratégie résidentielle', tag: 'Immobilier', color: '#a78bfa' },
  { href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2, desc: 'Mensualités & TAEG', tag: 'Immobilier', color: '#f472b6' },
  { href: '/dashboard/rental', label: 'Rentabilité Locative', icon: Wallet, desc: 'Cashflow locatif', tag: 'Immobilier', color: '#2dd4bf' },
  { href: '/dashboard/tax', label: 'Impôts IR', icon: Receipt, desc: 'Calcul IR & TMI', tag: 'Fiscal', color: '#fb7185' },
  { href: '/dashboard/flat-tax', label: 'Flat Tax vs Barème', icon: Receipt, desc: 'PFU 30% ou barème IR', tag: 'Fiscal', color: '#38bdf8' },
  { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV', icon: Wallet, desc: 'Comparez les enveloppes', tag: 'Fiscal', color: '#818cf8' },
  { href: '/dashboard/retirement', label: 'Retraite', icon: PiggyBank, desc: 'Pension & PER', tag: 'Fiscal', color: '#fbbf24' },
  { href: '/dashboard/savings-rate', label: "Taux d'épargne", icon: Percent, desc: 'Analyse de votre épargne', tag: 'Budget', color: '#818cf8' },
  { href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator, desc: "Règle d'or", tag: 'Budget', color: '#a3e635' },
]

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  compound:     { label: 'Intérêts',  color: '#34d399', icon: TrendingUp },
  dca:          { label: 'DCA',       color: '#38bdf8', icon: RefreshCw },
  fire:         { label: 'FI/RE',     color: '#fb923c', icon: Flame },
  buyrent:      { label: 'Achat/Loc', color: '#a78bfa', icon: Home },
  mortgage:     { label: 'Prêt',      color: '#f472b6', icon: Building2 },
  rental:       { label: 'Locatif',   color: '#2dd4bf', icon: Wallet },
  tax:          { label: 'Impôts',    color: '#fb7185', icon: Receipt },
  'flat-tax':        { label: 'Flat Tax',  color: '#38bdf8', icon: Receipt },
  'envelope-compare': { label: 'PEA/CTO/AV', color: '#818cf8', icon: Wallet },
  retirement:        { label: 'Retraite',  color: '#fbbf24', icon: PiggyBank },
  'savings-rate': { label: "Taux épargne", color: '#818cf8', icon: Percent },
  budget:       { label: 'Budget',    color: '#a3e635', icon: Calculator },
}

function scoreInfo(s: number): { label: string; color: string } {
  if (s >= 90) return { label: 'Excellent', color: '#f97316' }
  if (s >= 80) return { label: 'Très bien', color: '#34d399' }
  if (s >= 60) return { label: 'Bien', color: '#fbbf24' }
  if (s >= 40) return { label: 'En progression', color: '#fb923c' }
  return { label: 'À améliorer', color: '#f87171' }
}

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
  const [recentOpen, setRecentOpen] = useState(true)
  const [scoreWidget, setScoreWidget] = useState<{ score: number; label: string; color: string; quickActions: { label: string; href: string; pts: number }[] } | null>(null)

  useEffect(() => {
    fetch('/api/simulations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSims(data)
    }).finally(() => setLoaded(true))
  }, [])

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

  const firstName = session?.user?.name?.split(' ')[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const totalSims = sims.length
  const thisWeek = sims.filter(s => Date.now() - new Date(s.createdAt).getTime() < 7 * 86400 * 1000).length

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

  const byType = sims.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc }, {} as Record<string, number>)
  const distData = Object.entries(byType).map(([type, count]) => ({ name: TYPE_META[type]?.label || type, value: count, color: TYPE_META[type]?.color || '#6b7280' }))
  const mostUsed = distData.sort((a, b) => b.value - a.value)[0]

  return (
    <div className="flex-1" style={{ background: 'var(--content-bg)', minHeight: '100vh' }}>

      {/* ── HERO SECTION ── */}
      <div className="relative overflow-hidden px-5 xl:px-6" style={{ borderBottom: '1px solid var(--section-border)', paddingTop: 'clamp(20px,3vw,36px)', paddingBottom: 'clamp(20px,3vw,36px)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 50%, ${GOLD}06, transparent 60%)` }} />

        <div className="relative">
          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 4 }}>{greeting}{firstName ? `, ${firstName}` : ''}</p>
              <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.75rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                Tableau de bord
              </h1>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Simulations', value: totalSims, sub: 'total', href: '/dashboard/history' },
              { label: 'Cette semaine', value: thisWeek, sub: 'nouvelles', href: null },
              { label: 'Module favori', value: mostUsed?.name || '—', sub: mostUsed ? `${mostUsed.value} fois` : '', href: null },
              { label: 'Calculateurs', value: String(MODULES.length), sub: 'disponibles', href: null },
            ].map((s, i) => {
              const card = (
                <div className="rounded-xl p-4" style={{ background: i === 3 ? `linear-gradient(135deg, ${GOLD}12, transparent)` : 'var(--card-dark)', border: `1px solid ${i === 3 ? GOLD_BORDER : 'var(--card-dark-border)'}`, transition: 'border-color 0.15s', cursor: s.href ? 'pointer' : 'default' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>{s.label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: 600, color: i === 3 ? GOLD : 'var(--text-primary)', letterSpacing: '-0.025em' }}>{s.value}</p>
                    {s.sub && <p style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.sub}</p>}
                  </div>
                </div>
              )
              return s.href
                ? <Link key={i} href={s.href} className="block hover:opacity-80 transition-opacity">{card}</Link>
                : <div key={i}>{card}</div>
            })}
          </div>

          {/* Score widget */}
          {scoreWidget && (
            <Link href="/dashboard/score" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
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

          {/* Charts — only if data */}
          {loaded && totalSims > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Activity */}
              <div className="rounded-xl p-5" style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>Activité</span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>12 semaines</span>
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
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                      formatter={(v: any) => [`${v} sim.`, '']} />
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
        </div>
      </div>

      {/* ── RECENT SIMS + MODULES ── */}
      <div className={`grid grid-cols-1 gap-0 ${loaded && totalSims > 0 ? 'xl:grid-cols-[260px_1fr]' : ''}`} style={{ minHeight: 'calc(100vh - 400px)' }}>

        {/* LEFT: Recent simulations */}
        {loaded && totalSims > 0 && (
          <div className="p-5 xl:p-6" style={{ borderRight: '1px solid var(--section-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setRecentOpen(v => !v)}
                className="flex items-center gap-2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)' }}>Récentes</span>
                <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-subtle)', transition: 'transform 0.2s', transform: recentOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
              </button>
              <Link href="/dashboard/history" className="flex items-center gap-1" style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-1" style={{ display: recentOpen ? 'block' : 'none' }}>
              {sims.slice(0, 8).map(sim => {
                const meta = TYPE_META[sim.type]
                const Icon = meta?.icon || BarChart3
                return (
                  <Link key={sim.id} href={`/dashboard/${sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--icon-chip-bg)', border: '1px solid var(--icon-chip-border)' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: meta?.color || '#6b7280' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, color: 'var(--text-em)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{meta?.label}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{timeAgo(sim.createdAt)}</span>
                      <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--text-subtle)' }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* RIGHT: Modules grid */}
        <div className="p-5 xl:p-6">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
              Calculateurs
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{MODULES.length} modules</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MODULES.map(mod => (
              <Link key={mod.href} href={mod.href} className="group block" style={{ textDecoration: 'none' }}>
                <div className="relative overflow-hidden rounded-xl p-4 transition-all duration-200"
                  style={{ background: `radial-gradient(ellipse at top left, ${mod.color}18, transparent 70%)`, border: `1px solid ${mod.color}25` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = mod.color + '60'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = mod.color + '25'; e.currentTarget.style.transform = '' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 0% 0%, ${mod.color}10, transparent 55%)` }} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ background: mod.color + '15', border: `1px solid ${mod.color}25` }}>
                        <mod.icon className="h-4 w-4" style={{ color: mod.color }} />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{mod.tag}</span>
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', marginBottom: 3 }}>{mod.label}</h3>
                    <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5, marginBottom: 10 }}>{mod.desc}</p>
                    <div className="flex items-center justify-end gap-1" style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>
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
