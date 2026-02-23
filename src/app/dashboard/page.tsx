'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, Flame, Receipt, Home, Building2,
  Wallet, PiggyBank, RefreshCw, Calculator,
  ChevronRight, ArrowRight, Sparkles
} from 'lucide-react'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

const MODULES = [
  {
    href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp,
    desc: 'Visualisez l\'effet boule de neige de votre épargne sur le long terme.',
    tag: 'Épargne', color: 'text-foreground',
  },
  {
    href: '/dashboard/dca', label: 'DCA', icon: RefreshCw,
    desc: 'Simulez un investissement régulier et comparez avec un achat unique.',
    tag: 'Épargne', color: 'text-foreground',
  },
  {
    href: '/dashboard/fire', label: 'FI/RE', icon: Flame,
    desc: 'Calculez votre objectif d\'indépendance financière et votre date de retraite anticipée.',
    tag: 'Épargne', color: 'text-foreground',
  },
  {
    href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home,
    desc: 'Comparez le patrimoine généré selon que vous achetez ou louez votre résidence.',
    tag: 'Immobilier', color: 'text-foreground',
  },
  {
    href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2,
    desc: 'Calculez vos mensualités, le TAEG et le tableau d\'amortissement complet.',
    tag: 'Immobilier', color: 'text-foreground',
  },
  {
    href: '/dashboard/rental', label: 'Rentabilité Locative', icon: Wallet,
    desc: 'Analysez le cashflow et la rentabilité nette d\'un investissement locatif.',
    tag: 'Immobilier', color: 'text-foreground',
  },
  {
    href: '/dashboard/tax', label: 'Impôts IR', icon: Receipt,
    desc: 'Calculez votre impôt sur le revenu avec abattement 10%, frais réels et TMI.',
    tag: 'Fiscal', color: 'text-foreground',
  },
  {
    href: '/dashboard/retirement', label: 'Simulateur Retraite', icon: PiggyBank,
    desc: 'Estimez votre pension et optimisez votre préparation retraite via le PER.',
    tag: 'Fiscal', color: 'text-foreground',
  },
  {
    href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator,
    desc: 'Analysez la répartition de vos dépenses selon la règle d\'or des finances perso.',
    tag: 'Budget', color: 'text-foreground',
  },
]

const TAG_COLORS: Record<string, string> = {
  'Épargne': 'bg-muted text-muted-foreground',
  'Immobilier': 'bg-muted text-muted-foreground',
  'Fiscal': 'bg-muted text-muted-foreground',
  'Budget': 'bg-muted text-muted-foreground',
}

interface Simulation {
  id: string; type: string; name: string
  results: Record<string, any>; createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  compound: 'Composés', dca: 'DCA', fire: 'FI/RE',
  buyrent: 'Achat/Loc', mortgage: 'Prêt', rental: 'Locatif',
  tax: 'Impôts', retirement: 'Retraite', budget: 'Budget'
}

function SimSummaryChart({ sims }: { sims: Simulation[] }) {
  // Count by type for pie
  const byType = sims.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1; return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(byType).map(([type, count]) => ({
    name: TYPE_LABELS[type] || type, value: count
  }))

  const FILLS = ['hsl(0 0% 80%)', 'hsl(0 0% 60%)', 'hsl(0 0% 45%)', 'hsl(0 0% 30%)', 'hsl(0 0% 20%)', 'hsl(160 84% 39%)', 'hsl(38 92% 50%)', 'hsl(217 91% 60%)', 'hsl(0 72% 51%)']

  // Activity timeline — group by week
  const now = Date.now()
  const weeks: Record<number, number> = {}
  sims.forEach(s => {
    const d = new Date(s.createdAt)
    const w = Math.floor((now - d.getTime()) / (7 * 24 * 3600 * 1000))
    if (w <= 11) weeks[11 - w] = (weeks[11 - w] || 0) + 1
  })
  const timelineData = Array.from({ length: 12 }, (_, i) => ({
    week: i === 11 ? 'Cette semaine' : `S-${11 - i}`,
    count: weeks[i] || 0
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Répartition des simulations</CardTitle>
          <CardDescription>{sims.length} simulation{sims.length > 1 ? 's' : ''} sauvegardée{sims.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={FILLS[i % FILLS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: FILLS[i % FILLS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Activité (12 semaines)</CardTitle>
          <CardDescription>Simulations sauvegardées par semaine</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={timelineData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(0 0% 50%)' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(0 0% 50%)' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 11 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(0 0% 70%)" fill="hsl(0 0% 70%)" fillOpacity={0.15} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default function HomePage() {
  const { data: session } = useSession()
  const [sims, setSims] = useState<Simulation[]>([])

  useEffect(() => {
    fetch('/api/simulations').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setSims(data)
    }).catch(() => {})
  }, [])

  const firstName = session?.user?.name?.split(' ')[0] || 'vous'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Hero */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{greeting}, <span className="text-foreground font-medium">{firstName}</span></p>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord financier</h1>
        <p className="text-sm text-muted-foreground">9 calculateurs pour piloter votre patrimoine et vos investissements</p>
      </div>

      {/* Simulations summary - only if user has saved some */}
      {sims.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Vos simulations
            </h2>
            <Link href="/dashboard/history" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <SimSummaryChart sims={sims} />

          {/* Recent 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sims.slice(0, 3).map(sim => (
              <Link key={sim.id} href={`/dashboard/${sim.type === 'compound' ? 'compound' : sim.type}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}`}>
                <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-0.5">{TYPE_LABELS[sim.type]}</p>
                    <p className="text-sm font-medium truncate">{sim.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modules grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Tous les calculateurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <Card className="group hover:border-foreground/30 transition-all duration-150 cursor-pointer h-full">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                      <mod.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{mod.tag}</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1 group-hover:text-foreground transition-colors">{mod.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>Ouvrir</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
