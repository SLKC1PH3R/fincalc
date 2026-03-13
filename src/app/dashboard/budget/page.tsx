'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcBudget, type BudgetInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ArrowRight } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'

function BudgetField({ label, value, onChange, step = 50 }: { label: string; value: number; onChange: (v: number) => void; placeholder?: string; step?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-muted-foreground shrink-0 text-xs" style={{ width: '8.5rem' }}>{label}</Label>
      <div className="flex flex-1 h-8 items-center rounded-md overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <button type="button" onClick={() => onChange(Math.max(0, value - step))}
          className="flex items-center justify-center h-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors flex-shrink-0 text-base leading-none"
          style={{ width: '2rem', borderRight: '1px solid rgba(255,255,255,0.08)' }}>−</button>
        <input type="number" min={0} value={value || ''} onChange={e => onChange(+e.target.value)}
          placeholder="0"
          className="h-full flex-1 bg-transparent text-sm text-center focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ color: 'rgba(255,255,255,0.75)' }} />
        <button type="button" onClick={() => onChange(value + step)}
          className="flex items-center justify-center h-full text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors flex-shrink-0 text-base leading-none"
          style={{ width: '2rem', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>+</button>
      </div>
    </div>
  )
}

function BudgetPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<BudgetInputs>({
    netIncome: 3500,
    housing: 900, food: 400, transport: 200, health: 50, utilities: 100, otherNeeds: 100,
    leisure: 150, shopping: 100, restaurants: 100, otherWants: 50,
    savings: 300, debt: 0, otherSavings: 200,
  })
  const set = (k: keyof BudgetInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.netIncome === undefined && p.income !== undefined) {
        // Migrate old format: { income, needs(%), wants(%), savings(%) }
        const inc = p.income as number
        const n = inc * 0.5, w = inc * 0.3, s = inc * 0.2
        setInputs({
          netIncome: inc,
          housing: Math.round(n * 0.58), food: Math.round(n * 0.21), transport: Math.round(n * 0.11),
          health: Math.round(n * 0.03), utilities: Math.round(n * 0.05), otherNeeds: Math.round(n * 0.02),
          leisure: Math.round(w * 0.25), shopping: Math.round(w * 0.30), restaurants: Math.round(w * 0.35), otherWants: Math.round(w * 0.10),
          savings: Math.round(s * 0.50), debt: 0, otherSavings: Math.round(s * 0.50),
        })
      } else {
        setInputs(p as BudgetInputs)
      }
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcBudget(inputs), [inputs])
  const scoreConf = {
    excellent:    { label: 'Équilibré',      Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon:          { label: 'Bon',            Icon: TrendingUp,   color: 'text-blue-400' },
    moyen:        { label: 'À améliorer',    Icon: Minus,        color: 'text-amber-400' },
    desequilibre: { label: 'Déséquilibré',   Icon: AlertCircle,  color: 'text-crimson-finance' },
  }[r.analysis.score]

  const pieData = [
    { name: 'Besoins', value: Math.round(r.needs), fill: chart.fill1 },
    { name: 'Envies', value: Math.round(r.wants), fill: chart.fill2 },
    { name: 'Épargne', value: Math.round(r.savingsTotal), fill: 'hsl(160 84% 39%)' },
    ...(r.balance > 0 ? [{ name: 'Non alloué', value: Math.round(r.balance), fill: 'hsl(38 92% 50%)' }] : []),
  ]

  // Color for pct badge
  const pctColor = (actual: number, target: number, inverse = false) => {
    const ok = inverse ? actual <= target * 1.05 : actual >= target * 0.95
    return ok ? 'text-emerald-finance' : 'text-crimson-finance'
  }

  return (
    <div className="space-y-6 animate-fade-in px-7 py-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Budget 50 / 30 / 20</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Besoins · Envies · Épargne — Règle d'or des finances personnelles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Budget 50/30/20',
            subtitle: `Revenu net ${fmt(inputs.netIncome)}/mois`,
            kpis: [
              { label: 'Besoins', value: fmtPct(r.needsPct), sub: `${fmt(r.needs)}/mois · cible 50%` },
              { label: 'Envies', value: fmtPct(r.wantsPct), sub: `${fmt(r.wants)}/mois · cible 30%` },
              { label: 'Épargne', value: fmtPct(r.savingsPct), highlight: true, sub: `${fmt(r.savingsTotal)}/mois · cible 20%` },
              { label: 'Solde non alloué', value: fmt(r.balance) },
            ],
            inputs: [
              { label: 'Revenu net mensuel', value: fmt(inputs.netIncome) },
              { label: 'Total besoins', value: fmt(r.needs) },
              { label: 'Total envies', value: fmt(r.wants) },
              { label: 'Total épargne', value: fmt(r.savingsTotal) },
            ],
            tips: r.analysis.tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="budget" name={`Budget ${fmt(inputs.netIncome)}/mois`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Besoins', value: fmtPct(r.needsPct), target: '50%', ok: r.needsPct <= 52 },
          { label: 'Envies', value: fmtPct(r.wantsPct), target: '30%', ok: r.wantsPct <= 32 },
          { label: 'Épargne', value: fmtPct(r.savingsPct), target: '20%', ok: r.savingsPct >= 18 },
          { label: 'Solde non alloué', value: fmt(r.balance), target: '0€', ok: Math.abs(r.balance) < 50 },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label} · cible {k.target}</CardDescription></CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-semibold tracking-tight', k.ok ? 'text-emerald-finance' : 'text-crimson-finance')}>{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input form */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Revenu mensuel net</CardTitle></CardHeader>
            <CardContent>
              <Input type="number" value={inputs.netIncome} onChange={e => set('netIncome')(+e.target.value)}
                className="text-lg font-semibold h-10" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Besoins</span>
                <span className={cn('text-sm font-medium', r.needsPct <= 52 ? 'text-emerald-finance' : 'text-crimson-finance')}>
                  {fmt(r.needs)} · {fmtPct(r.needsPct)}
                </span>
              </CardTitle>
              <CardDescription>Dépenses incompressibles — cible 50%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <BudgetField label="Logement" value={inputs.housing} onChange={set('housing')} />
              <BudgetField label="Alimentation" value={inputs.food} onChange={set('food')} />
              <BudgetField label="Transport" value={inputs.transport} onChange={set('transport')} />
              <BudgetField label="Santé" value={inputs.health} onChange={set('health')} />
              <BudgetField label="Abonnements" value={inputs.utilities} onChange={set('utilities')} />
              <BudgetField label="Autres besoins" value={inputs.otherNeeds} onChange={set('otherNeeds')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Envies</span>
                <span className={cn('text-sm font-medium', r.wantsPct <= 32 ? 'text-emerald-finance' : 'text-crimson-finance')}>
                  {fmt(r.wants)} · {fmtPct(r.wantsPct)}
                </span>
              </CardTitle>
              <CardDescription>Dépenses plaisir — cible 30%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <BudgetField label="Loisirs" value={inputs.leisure} onChange={set('leisure')} />
              <BudgetField label="Shopping" value={inputs.shopping} onChange={set('shopping')} />
              <BudgetField label="Restaurants" value={inputs.restaurants} onChange={set('restaurants')} />
              <BudgetField label="Autres envies" value={inputs.otherWants} onChange={set('otherWants')} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Épargne</span>
                <span className={cn('text-sm font-medium', r.savingsPct >= 18 ? 'text-emerald-finance' : 'text-crimson-finance')}>
                  {fmt(r.savingsTotal)} · {fmtPct(r.savingsPct)}
                </span>
              </CardTitle>
              <CardDescription>Épargne & remboursements — cible 20%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <BudgetField label="Épargne / livrets" value={inputs.savings} onChange={set('savings')} />
              <BudgetField label="Remboursements" value={inputs.debt} onChange={set('debt')} />
              <BudgetField label="Investissements" value={inputs.otherSavings} onChange={set('otherSavings')} />
            </CardContent>
          </Card>
        </div>

        {/* Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition de votre budget</CardTitle>
            <CardDescription>Revenu net : {fmt(inputs.netIncome)}/mois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Three bars comparison */}
            <div className="space-y-4">
              {[
                { label: 'Besoins', actual: r.needsPct, target: 50, amount: r.needs, targetAmt: r.needsTarget, inverse: true },
                { label: 'Envies', actual: r.wantsPct, target: 30, amount: r.wants, targetAmt: r.wantsTarget, inverse: true },
                { label: 'Épargne', actual: r.savingsPct, target: 20, amount: r.savingsTotal, targetAmt: r.savingsTarget, inverse: false },
              ].map((row, i) => {
                const ok = row.inverse ? row.actual <= row.target * 1.05 : row.actual >= row.target * 0.95
                const barColor = ok ? 'bg-emerald-finance' : 'bg-crimson-finance'
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Cible : {fmt(row.targetAmt)}</span>
                        <span className={cn('font-semibold', ok ? 'text-emerald-finance' : 'text-crimson-finance')}>
                          {fmt(row.amount)} ({fmtPct(row.actual)})
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', barColor)}
                        style={{ width: `${Math.min(row.actual / (row.target * 1.5) * 100, 100)}%` }} />
                      {/* Target marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
                        style={{ left: `${Math.min(100 / 1.5, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Le trait indique la cible {row.target}%</p>
                  </div>
                )
              })}
            </div>

            <Separator />

            {/* Pie */}
            <div className="flex gap-6 items-center">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {pieData.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: e.fill }} />
                      <span className="text-muted-foreground">{e.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">{fmt(e.value)}</span>
                  </div>
                ))}
                {r.balance < -10 && (
                  <div className="mt-2 text-xs text-crimson-finance">
                    ⚠ Dépenses supérieures au revenu de {fmt(Math.abs(r.balance))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Top expenses */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Détail par poste</p>
              <div className="space-y-1.5">
                {r.categories.sort((a, b) => b.amount - a.amount).map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{cat.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(cat.amount / inputs.netIncome) * 100}%`,
                          background: cat.type === 'needs' ? 'hsl(0 0% 70%)' : cat.type === 'wants' ? 'hsl(0 0% 45%)' : 'hsl(160 84% 39%)'
                        }} />
                    </div>
                    <span className="text-xs font-medium tabular-nums w-16 text-right">{fmt(cat.amount)}</span>
                    <span className="text-xs text-muted-foreground w-10 text-right">{fmtPct(cat.amount / inputs.netIncome * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card style={{ borderColor: r.analysis.score === 'excellent' || r.analysis.score === 'bon' ? 'rgba(52,211,153,0.35)' : r.analysis.score === 'moyen' ? 'rgba(241,192,134,0.28)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — Budget {scoreConf.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{r.analysis.message}</p>
          <div className="space-y-2">
            {r.analysis.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 rounded-md border border-border p-3">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── CTAs interconnexion ── */}
      {r.savingsTotal > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <a
            href={`/dashboard/dca?restore=${encodeURIComponent(JSON.stringify({ monthly: Math.round(r.savingsTotal), years: 20, targetRate: 8, volatility: 15, initialPrice: 100 }))}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
              background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.25)',
              transition: 'border-color 0.15s',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(129,140,248,0.25)')}
            >
              <TrendingUp style={{ width: 20, height: 20, color: '#818cf8', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Simuler en DCA</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                  Investir {fmt(r.savingsTotal)}/mois pendant 20 ans
                </div>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          </a>
          <a
            href={`/dashboard/fire?restore=${encodeURIComponent(JSON.stringify({ income: inputs.netIncome * 12, expenses: (r.needs + r.wants) * 12, netWorth: 0, rate: 7, withdrawalRate: 4 }))}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
              background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.17)',
              transition: 'border-color 0.15s',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.36)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.17)')}
            >
              <CheckCircle2 style={{ width: 20, height: 20, color: '#f1c086', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Calculer mon FIRE</div>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                  Avec {fmtPct(r.savingsPct)} d'épargne · dépenses {fmt(r.needs + r.wants)}/mois
                </div>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          </a>
        </div>
      )}
    </div>
  )
}
export default function BudgetPage() { return <Suspense><BudgetPageInner /></Suspense> }
