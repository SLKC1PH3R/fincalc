'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFire, type FireInputs } from '@/lib/calculators'
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
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

function FirePageInner() {
  const [inputs, setInputs] = useState<FireInputs>({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const set = (k: keyof FireInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Restore simulation from history
  const searchParams = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('restore')
    if (!raw) return
    try { setInputs(JSON.parse(raw) as FireInputs) } catch {}
  }, [])
  const r = useMemo(() => calcFire(inputs), [inputs])

  const score = r.savingsRate >= 50 ? 'excellent' : r.savingsRate >= 30 ? 'bon' : r.savingsRate >= 15 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon: { label: 'Bon', Icon: TrendingUp, color: 'text-blue-400' },
    moyen: { label: 'Moyen', Icon: Minus, color: 'text-amber-400' },
    faible: { label: 'Faible', Icon: AlertCircle, color: 'text-crimson-finance' },
  }[score]

  const tips = []
  if (r.savingsRate < 20) tips.push('Un taux d\'épargne < 20% rallonge considérablement le chemin. Identifiez les postes à réduire en priorité.')
  if (inputs.withdrawalRate > 4) tips.push('Un taux de retrait > 4% augmente le risque d\'épuiser le capital. La règle des 4% est éprouvée sur 30 ans.')
  if (inputs.rate > 8) tips.push(`Un rendement de ${inputs.rate}% est optimiste. Prévoyez un scénario pessimiste à 5%.`)
  if (r.savingsRate >= 50) tips.push('Excellent taux d\'épargne ! Optimisez vos enveloppes fiscales : PEA, assurance-vie, PER.')
  if (tips.length === 0) tips.push('Bonne progression. Maintenez la discipline et revoyez vos hypothèses annuellement.')

  const progressColor = r.progressPct >= 75 ? 'hsl(160 84% 39%)' : r.progressPct >= 50 ? 'hsl(38 92% 50%)' : r.progressPct >= 25 ? 'hsl(38 60% 50%)' : 'hsl(0 72% 51%)'

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calculateur FI/RE</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Financial Independence, Retire Early</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'FI/RE',
            subtitle: 'Financial Independence, Retire Early',
            kpis: [
              { label: 'Patrimoine FIRE cible', value: fmt(r.target), highlight: true },
              { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans` },
              { label: "Taux d'épargne", value: fmtPct(r.savingsRate) },
              { label: 'Progression', value: fmtPct(r.progressPct) },
            ],
            inputs: [
              { label: 'Revenu net annuel', value: fmt(inputs.income) },
              { label: 'Dépenses annuelles', value: fmt(inputs.expenses) },
              { label: 'Patrimoine actuel', value: fmt(inputs.netWorth) },
              { label: 'Rendement attendu', value: `${inputs.rate}%` },
              { label: 'Taux de retrait', value: `${inputs.withdrawalRate}%` },
            ],
            sections: [{ title: 'Détail', items: [
              { label: 'Épargne annuelle', value: fmt(r.annualSavings) },
              { label: 'Revenu passif mensuel cible', value: fmt(r.monthlyPassive) },
            ]}],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="fire" name={`FI/RE ${r.yearsToFire}ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patrimoine FIRE cible', value: fmt(r.target) },
          { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100' : `${r.yearsToFire} ans` },
          { label: 'Taux d\'épargne', value: fmtPct(r.savingsRate) },
          { label: 'Progression', value: fmtPct(r.progressPct) },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-semibold tracking-tight">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>Votre situation financière</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Revenu annuel net<Tip text="Revenu annuel net après impôts. Ce qui rentre réellement sur votre compte chaque année." /></Label>
              <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Dépenses annuelles<Tip text="Vos dépenses totales. C'est aussi le montant dont vous aurez besoin chaque année à la retraite. Réduire ce chiffre est le levier le plus puissant." /></Label>
              <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Patrimoine actuel<Tip text="Total de vos actifs investis : épargne, PEA, assurance-vie, immo locatif..." /></Label>
              <Input type="number" value={inputs.netWorth} onChange={e => set('netWorth')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Rendement attendu<Tip text="ETF World historique : 7-9% nominal. Soyez conservateur : 5-7%." /></Label>
                <span className="text-sm font-medium">{inputs.rate}%</span>
              </div>
              <Slider min={1} max={15} step={0.5} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Taux de retrait<Tip text="La règle des 4% (Trinity Study) : retraite durable sur 30 ans. 3.5% pour une longue retraite." /></Label>
                <span className="text-sm font-medium">{inputs.withdrawalRate}%</span>
              </div>
              <Slider min={2} max={6} step={0.1} value={[inputs.withdrawalRate]} onValueChange={([v]) => set('withdrawalRate')(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => set('withdrawalRate')(3.5)}>Prudent 3.5%</button>
                <button className="hover:text-foreground" onClick={() => set('withdrawalRate')(4)}>Standard 4%</button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress + stats */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Progression vers l&apos;indépendance</CardTitle><CardDescription>Votre chemin vers le FIRE</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patrimoine actuel</span>
                <span className="font-semibold" style={{ color: progressColor }}>{fmtPct(r.progressPct)} atteint</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.progressPct}%`, background: progressColor }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{fmt(inputs.netWorth)}</span>
                <span>Objectif : {fmt(r.target)}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Épargne annuelle', value: fmt(r.annualSavings), color: r.annualSavings >= 0 ? 'text-emerald-finance' : 'text-crimson-finance', help: 'Revenu − Dépenses' },
                { label: 'Taux d\'épargne', value: fmtPct(r.savingsRate), color: scoreConf.color, help: 'Épargne / Revenu' },
                { label: 'Manque au capital', value: fmt(Math.max(0, r.target - inputs.netWorth)), color: 'text-foreground', help: 'Patrimoine restant à accumuler' },
                { label: 'Revenu passif / mois', value: fmt(r.monthlyPassive), color: 'text-foreground', help: 'Dépenses mensuelles cibles' },
              ].map((k, i) => (
                <div key={i} className="rounded-md border border-border p-4">
                  <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                  <p className={cn('text-xl font-semibold tracking-tight', k.color)}>{k.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card style={{ borderColor: score === 'excellent' || score === 'bon' ? 'rgba(52,211,153,0.35)' : score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — Taux d&apos;épargne {scoreConf.label} ({fmtPct(r.savingsRate)})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {score === 'excellent' && `Taux d'épargne exceptionnel — vous atteindrez l'indépendance financière en ${r.yearsToFire} ans. Optimisez vos enveloppes fiscales pour maximiser l'effet composé.`}
            {score === 'bon' && `Bon taux d'épargne de ${fmtPct(r.savingsRate)}. En maintenant ce rythme, l'indépendance financière dans ${r.yearsToFire} ans est réaliste.`}
            {score === 'moyen' && `Taux d'épargne correct mais perfectible. Chaque point de pourcentage supplémentaire raccourcit votre chemin.`}
            {score === 'faible' && `Taux d'épargne insuffisant pour le FIRE. Priorité : réduire les dépenses ou augmenter les revenus.`}
          </p>
          <div className="space-y-2">
            {tips.map((tip, i) => (
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

export default function FirePage() {
  return <Suspense><FirePageInner /></Suspense>
}
