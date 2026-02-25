'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcRetirement, type RetirementInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'
import { printReport } from '@/lib/print'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

function RetirementPageInner() {
  const [inputs, setInputs] = useState<RetirementInputs>({
    age: 35, retirementAge: 64, salary: 55000, quarters: 60,
    regime: 'prive', perAnnual: 3000, perRate: 5, savingsRate: 10, investRate: 7
  })
  const set = (k: keyof RetirementInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try { setInputs(JSON.parse(restoreParam) as RetirementInputs) } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcRetirement(inputs), [inputs])
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon:       { label: 'Bon',       Icon: TrendingUp,  color: 'text-blue-400' },
    moyen:     { label: 'Moyen',     Icon: Minus,        color: 'text-amber-400' },
    faible:    { label: 'Faible',    Icon: AlertCircle,  color: 'text-crimson-finance' },
  }[r.analysis.score]

  const gaugeColor = r.replacementRate >= 75 ? 'hsl(160 84% 39%)' : r.replacementRate >= 60 ? 'hsl(217 91% 60%)' : r.replacementRate >= 45 ? 'hsl(38 92% 50%)' : 'hsl(0 72% 51%)'

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Simulateur Retraite</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Retraite de base · Complémentaire · PER · Épargne personnelle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Retraite',
            subtitle: `Retraite de base · Complémentaire · PER · Épargne personnelle`,
            kpis: [
              { label: 'Revenu retraite total', value: `${fmt(r.totalIncome)}/mois`, highlight: true, sub: `dont ${fmt(r.netMonthly)} retraite légale` },
              { label: 'Taux de remplacement', value: fmtPct(r.replacementRate), sub: 'Cible : 75%+' },
              { label: 'Années avant retraite', value: `${r.yearsToRetirement} ans`, sub: `Départ à ${inputs.retirementAge} ans` },
              { label: 'Écart vs salaire net', value: `${fmt(r.gap)}/mois` },
            ],
            inputs: [
              { label: 'Âge actuel', value: `${inputs.age} ans` },
              { label: 'Âge de départ', value: `${inputs.retirementAge} ans` },
              { label: 'Salaire brut annuel', value: fmt(inputs.salary) },
              { label: 'Trimestres validés', value: String(inputs.quarters) },
              { label: 'Versement PER annuel', value: fmt(inputs.perAnnual) },
              { label: "Taux d'épargne perso", value: `${inputs.savingsRate}%` },
            ],
            sections: [{ title: 'Détail revenu retraite', items: [
              { label: 'Retraite de base', value: `${fmt(r.baseMonthly)}/mois` },
              { label: 'Retraite complémentaire', value: `${fmt(r.complementMonthly)}/mois` },
              { label: 'Rente PER', value: `${fmt(r.perMonthly)}/mois` },
              { label: 'Capital PER constitué', value: fmt(r.perCapital) },
              { label: 'Épargne additionnelle', value: fmt(r.additionalSavings) },
            ]}],
            tips: r.analysis.tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="retirement" name={`Retraite ${inputs.retirementAge}ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenu retraite total', value: fmt(r.totalIncome) + '/mois', sub: `dont ${fmt(r.netMonthly)} retraite légale` },
          { label: 'Taux de remplacement', value: fmtPct(r.replacementRate), sub: 'Cible : 75%+' },
          { label: 'Années avant retraite', value: `${r.yearsToRetirement} ans`, sub: `Départ à ${inputs.retirementAge} ans` },
          { label: 'Écart vs salaire net', value: fmt(r.gap) + '/mois', sub: r.gap > 0 ? 'À combler' : '✓ Couvert' },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight">{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Votre situation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">Âge actuel<Tip text="Votre âge aujourd'hui." /></Label>
                  <Input type="number" value={inputs.age} onChange={e => set('age')(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">Âge départ<Tip text="Âge légal minimum : 64 ans depuis 2023. Taux plein selon trimestres validés." /></Label>
                  <Input type="number" value={inputs.retirementAge} onChange={e => set('retirementAge')(+e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Salaire brut annuel<Tip text="Votre salaire brut actuel. Le calcul retraite est basé sur les 25 meilleures années (régime général)." /></Label>
                <Input type="number" value={inputs.salary} onChange={e => set('salary')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Trimestres validés<Tip text="Nombre de trimestres cotisés à ce jour. Visible sur votre relevé Info-Retraite.fr." /></Label>
                <Input type="number" value={inputs.quarters} min={0} max={200} onChange={e => set('quarters')(+e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  {r.quartersMissing > 0
                    ? `⚠ Il manquera ~${r.quartersMissing} trimestre(s) pour le taux plein`
                    : '✓ Taux plein atteint à la retraite'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Régime</Label>
                <Select value={inputs.regime} onValueChange={v => set('regime')(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prive">Salarié privé (CNAV + Agirc-Arrco)</SelectItem>
                    <SelectItem value="fonctionnaire">Fonctionnaire (CNRACL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Épargne retraite</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Versement PER annuel<Tip text="Plan Épargne Retraite. Déductible du revenu imposable dans la limite de 10% du salaire brut." /></Label>
                <Input type="number" value={inputs.perAnnual} onChange={e => set('perAnnual')(+e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Plafond déductible : {fmt(inputs.salary * 0.1)}/an</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Rendement PER<Tip text="Fonds euros sécurisé : 2-4%. Multisupport actions : 5-8%." /></Label>
                  <span className="text-sm font-medium">{inputs.perRate}%</span>
                </div>
                <Slider min={1} max={10} step={0.5} value={[inputs.perRate]} onValueChange={([v]) => set('perRate')(v)} />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Taux d'épargne perso<Tip text="Épargne complémentaire hors PER (PEA, assurance-vie...) en % du salaire net." /></Label>
                  <span className="text-sm font-medium">{inputs.savingsRate}%</span>
                </div>
                <Slider min={0} max={50} step={1} value={[inputs.savingsRate]} onValueChange={([v]) => set('savingsRate')(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Rendement épargne<Tip text="Rendement moyen de vos placements complémentaires." /></Label>
                  <span className="text-sm font-medium">{inputs.investRate}%</span>
                </div>
                <Slider min={1} max={12} step={0.5} value={[inputs.investRate]} onValueChange={([v]) => set('investRate')(v)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estimation des revenus à la retraite</CardTitle>
            <CardDescription>Projection à {inputs.retirementAge} ans — {r.yearsToRetirement} ans d'ici là</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Gauge */}
            <div className="flex items-center gap-6">
              <div className="relative w-36 h-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                    startAngle={180} endAngle={0} data={[{ value: Math.min(r.replacementRate, 100), fill: gaugeColor }]}>
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={4} fill={gaugeColor} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
                  <span className="text-2xl font-semibold">{r.replacementRate.toFixed(0)}%</span>
                  <span className="text-[10px] text-muted-foreground">remplacement</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">Décomposition des revenus mensuels estimés</p>
                {[
                  { label: 'Retraite de base', value: r.baseMonthly, color: 'bg-foreground' },
                  { label: 'Retraite complémentaire', value: r.complementMonthly, color: 'bg-muted-foreground' },
                  { label: 'Rente PER', value: r.perMonthly, color: 'bg-blue-400' },
                  { label: 'Épargne perso (rente)', value: r.additionalSavings / (20 * 12), color: 'bg-emerald-finance' },
                ].map((row, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{fmt(row.value)}/mois</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', row.color)} style={{ width: `${Math.min(row.value / r.totalIncome * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Detail table */}
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Salaire net actuel', value: fmt(inputs.salary * 0.78 / 12) + '/mois' },
                    { label: 'Retraite légale brute', value: fmt(r.totalMonthly) + '/mois' },
                    { label: 'Retraite légale nette', value: fmt(r.netMonthly) + '/mois', bold: true },
                    { label: 'Rente PER', value: fmt(r.perMonthly) + '/mois', sub: `Capital PER : ${fmt(r.perCapital)}` },
                    { label: 'Épargne complémentaire', value: fmt(r.additionalSavings / (20*12)) + '/mois', sub: `Capital : ${fmt(r.additionalSavings)}` },
                    { label: 'Total revenu mensuel', value: fmt(r.totalIncome) + '/mois', bold: true, highlight: true },
                    { label: 'Écart vs salaire net', value: (r.gap > 0 ? '− ' : '+ ') + fmt(Math.abs(r.gap)) + '/mois', color: r.gap > 0 ? 'text-crimson-finance' : 'text-emerald-finance' },
                  ].map((row, i) => (
                    <tr key={i} className={cn('border-b border-border last:border-0', row.highlight && 'bg-muted/30')}>
                      <td className="px-4 py-2.5 text-muted-foreground">{row.label}</td>
                      <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums', row.color, row.bold && 'text-foreground')}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card style={{ borderColor: scoreConf.color.includes('emerald') || scoreConf.color.includes('blue') ? 'rgba(52,211,153,0.35)' : scoreConf.color.includes('amber') ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — Taux de remplacement {scoreConf.label} ({r.replacementRate.toFixed(0)}%)</CardTitle>
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
export default function RetirementPage() { return <Suspense><RetirementPageInner /></Suspense> }
