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
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'

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
  const [inputs, setInputs] = useState<BudgetInputs>({
    netIncome: 3500,
    housing: 900, food: 400, transport: 200, health: 50, utilities: 100, otherNeeds: 100,
    leisure: 150, shopping: 100, restaurants: 100, otherWants: 50,
    savings: 300, debt: 0, otherSavings: 200,
  })
  const set = (k: keyof BudgetInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const searchParams = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('restore'); if (!raw) return
    try { setInputs(JSON.parse(raw) as BudgetInputs) } catch {}
  }, [])

  const r = useMemo(() => calcBudget(inputs), [inputs])
  const scoreConf = {
    excellent:    { label: 'Équilibré',      Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon:          { label: 'Bon',            Icon: TrendingUp,   color: 'text-blue-400' },
    moyen:        { label: 'À améliorer',    Icon: Minus,        color: 'text-amber-400' },
    desequilibre: { label: 'Déséquilibré',   Icon: AlertCircle,  color: 'text-crimson-finance' },
  }[r.analysis.score]

  const pieData = [
    { name: 'Besoins', value: Math.round(r.needs), fill: 'hsl(0 0% 70%)' },
    { name: 'Envies', value: Math.round(r.wants), fill: 'hsl(0 0% 45%)' },
    { name: 'Épargne', value: Math.round(r.savingsTotal), fill: 'hsl(160 84% 39%)' },
    ...(r.balance > 0 ? [{ name: 'Non alloué', value: Math.round(r.balance), fill: 'hsl(38 92% 50%)' }] : []),
  ]

  // Color for pct badge
  const pctColor = (actual: number, target: number, inverse = false) => {
    const ok = inverse ? actual <= target * 1.05 : actual >= target * 0.95
    return ok ? 'text-emerald-finance' : 'text-crimson-finance'
  }

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Budget 50 / 30 / 20</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Besoins · Envies · Épargne — Règle d'or des finances personnelles</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
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
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: 12, color: '#fff' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} />
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
      <Card style={{ borderColor: r.analysis.score === 'excellent' || r.analysis.score === 'bon' ? 'rgba(52,211,153,0.35)' : r.analysis.score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
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
    </div>
  )
}
export default function BudgetPage() { return <Suspense><BudgetPageInner /></Suspense> }
