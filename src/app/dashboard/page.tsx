'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  TrendingUp, Flame, Receipt, Home, Building2,
  Wallet, PiggyBank, RefreshCw, Calculator,
  ChevronRight, ArrowUpRight, Clock, Sparkles,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Simulation {
  id: string
  type: string
  name: string
  inputs: Record<string, any>
  results: Record<string, any>
  createdAt: string
}

// ─── Data ────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp,
    desc: 'Effet boule de neige sur le long terme', tag: 'Épargne',
    accent: 'from-emerald-500/10 to-transparent',
    iconColor: 'text-emerald-400',
    border: 'hover:border-emerald-500/30',
  },
  {
    href: '/dashboard/dca', label: 'DCA', icon: RefreshCw,
    desc: 'Investissement régulier vs achat unique', tag: 'Épargne',
    accent: 'from-sky-500/10 to-transparent',
    iconColor: 'text-sky-400',
    border: 'hover:border-sky-500/30',
  },
  {
    href: '/dashboard/fire', label: 'FI/RE', icon: Flame,
    desc: 'Date d\'indépendance financière', tag: 'Épargne',
    accent: 'from-orange-500/10 to-transparent',
    iconColor: 'text-orange-400',
    border: 'hover:border-orange-500/30',
  },
  {
    href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home,
    desc: 'Comparaison patrimoniale à long terme', tag: 'Immobilier',
    accent: 'from-violet-500/10 to-transparent',
    iconColor: 'text-violet-400',
    border: 'hover:border-violet-500/30',
  },
  {
    href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2,
    desc: 'Mensualités, TAEG, amortissement', tag: 'Immobilier',
    accent: 'from-pink-500/10 to-transparent',
    iconColor: 'text-pink-400',
    border: 'hover:border-pink-500/30',
  },
  {
    href: '/dashboard/rental', label: 'Rentabilité Locative', icon: Wallet,
    desc: 'Cashflow et rendement net locatif', tag: 'Immobilier',
    accent: 'from-teal-500/10 to-transparent',
    iconColor: 'text-teal-400',
    border: 'hover:border-teal-500/30',
  },
  {
    href: '/dashboard/tax', label: 'Impôts IR', icon: Receipt,
    desc: 'Calcul IR, TMI, frais réels', tag: 'Fiscal',
    accent: 'from-rose-500/10 to-transparent',
    iconColor: 'text-rose-400',
    border: 'hover:border-rose-500/30',
  },
  {
    href: '/dashboard/retirement', label: 'Retraite', icon: PiggyBank,
    desc: 'Pension estimée et préparation PER', tag: 'Fiscal',
    accent: 'from-amber-500/10 to-transparent',
    iconColor: 'text-amber-400',
    border: 'hover:border-amber-500/30',
  },
  {
    href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator,
    desc: 'Répartition selon la règle d\'or', tag: 'Budget',
    accent: 'from-lime-500/10 to-transparent',
    iconColor: 'text-lime-400',
    border: 'hover:border-lime-500/30',
  },
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
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">{label}</span>
      <span className="text-2xl font-semibold text-white tracking-tight">{value}</span>
      {sub && <span className="text-xs text-white/30">{sub}</span>}
    </div>
  )
}

// ─── Module Card ─────────────────────────────────────────────────────────────
function ModuleCard({ mod }: { mod: typeof MODULES[0] }) {
  return (
    <Link href={mod.href} className="group block">
      <div className={cn(
        'relative overflow-hidden bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-5 transition-all duration-200',
        'hover:border-white/[0.12] hover:-translate-y-0.5',
        mod.border
      )}>
        {/* Gradient glow top-left */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', mod.accent)} />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <mod.icon className={cn('h-4 w-4', mod.iconColor)} />
            </div>
            <span className="text-[10px] text-white/25 uppercase tracking-widest font-medium">{mod.tag}</span>
          </div>

          <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-white transition-colors">
            {mod.label}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed mb-4">{mod.desc}</p>

          <div className="flex items-center gap-1 text-[11px] text-white/25 group-hover:text-white/50 transition-colors">
            <span>Ouvrir</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Activity Chart ───────────────────────────────────────────────────────────
function ActivityChart({ sims }: { sims: Simulation[] }) {
  const now = Date.now()
  const weeks: Record<number, number> = {}
  sims.forEach(s => {
    const w = Math.floor((now - new Date(s.createdAt).getTime()) / (7 * 24 * 3600 * 1000))
    if (w <= 11) weeks[11 - w] = (weeks[11 - w] || 0) + 1
  })
  const data = Array.from({ length: 12 }, (_, i) => ({
    w: i === 11 ? 'Cette sem.' : `S-${11 - i}`,
    n: weeks[i] || 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="w" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', fontSize: 11, color: '#fff',
          }}
          formatter={(v: any) => [`${v} simulation${v > 1 ? 's' : ''}`, '']}
          labelFormatter={(l) => l}
        />
        <Area type="monotone" dataKey="n" stroke="#6366f1" strokeWidth={1.5} fill="url(#actGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Distribution Donut ───────────────────────────────────────────────────────
function DistributionDonut({ sims }: { sims: Simulation[] }) {
  const byType = sims.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1; return acc
  }, {} as Record<string, number>)
  const data = Object.entries(byType).map(([type, count]) => ({
    name: TYPE_META[type]?.label || type,
    value: count,
    color: TYPE_META[type]?.color || '#6b7280',
  }))

  return (
    <div className="flex items-center gap-5">
      <div className="flex-shrink-0">
        <ResponsiveContainer width={80} height={80}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={26} outerRadius={38} dataKey="value" paddingAngle={2} startAngle={90} endAngle={450}>
              {data.map((d, i) => <Cell key={i} fill={d.color} strokeWidth={0} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.slice(0, 6).map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-white/40 truncate">{d.name}</span>
            <span className="text-[11px] text-white/60 ml-auto flex-shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Sim Row ───────────────────────────────────────────────────────────
function RecentSimRow({ sim }: { sim: Simulation }) {
  const meta = TYPE_META[sim.type]
  const Icon = meta?.icon || BarChart3
  const restoreUrl = `/dashboard/${sim.type === 'compound' ? 'compound' : sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`

  return (
    <Link href={restoreUrl} className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors rounded-lg -mx-1">
      <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5" style={{ color: meta?.color || '#6b7280' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium truncate group-hover:text-white transition-colors">{sim.name}</p>
        <p className="text-[11px] text-white/30">{meta?.label || sim.type}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-white/25 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo(sim.createdAt)}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    </Link>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: session } = useSession()
  const [sims, setSims] = useState<Simulation[]>([])
  const [loaded, setLoaded] = useState(false)

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
  const mostUsed = sims.length ? Object.entries(
    sims.reduce((a, s) => { a[s.type] = (a[s.type] || 0) + 1; return a }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0] : null

  return (
    <div className="max-w-6xl space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-white/35 mb-1">{greeting}{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Tableau de bord</h1>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </div>

      {/* Stats + Activity row (only if sims exist) */}
      {loaded && totalSims > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 lg:col-span-1">
            <StatCard label="Simulations" value={totalSims} sub="total" />
            <StatCard label="Cette semaine" value={thisWeek} sub="nouvelles" />
            <StatCard
              label="Module favori"
              value={mostUsed ? (TYPE_META[mostUsed[0]]?.label || mostUsed[0]) : '—'}
              sub={mostUsed ? `${mostUsed[1]} fois` : undefined}
            />
          </div>

          {/* Activity + Donut */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* Activity */}
            <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Activité</span>
                <span className="text-[11px] text-white/25">12 semaines</span>
              </div>
              <ActivityChart sims={sims} />
            </div>

            {/* Distribution */}
            <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Répartition</span>
                <span className="text-[11px] text-white/25">{totalSims} sim.</span>
              </div>
              <DistributionDonut sims={sims} />
            </div>
          </div>
        </div>
      )}

      {/* Recent sims */}
      {loaded && totalSims > 0 && (
        <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-sm font-medium text-white/70">Simulations récentes</span>
            </div>
            <Link href="/dashboard/history" className="text-[11px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
              Voir tout <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="px-4 py-2">
            {sims.slice(0, 5).map(sim => <RecentSimRow key={sim.id} sim={sim} />)}
          </div>
        </div>
      )}

      {/* Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest text-[11px]">Calculateurs</h2>
          <span className="text-[11px] text-white/25">{MODULES.length} modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(mod => <ModuleCard key={mod.href} mod={mod} />)}
        </div>
      </div>

    </div>
  )
}
