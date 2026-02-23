'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcFire, type FireInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, FileDown, CheckCircle, TrendingUp, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function HelpTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-gold cursor-pointer transition-colors inline-block"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(v => !v)} />
      {show && <span className="absolute z-50 left-5 -top-1 w-64 bg-card border border-gold/30 text-xs font-mono text-foreground p-3 shadow-xl leading-relaxed">{text}</span>}
    </span>
  )
}

export default function FirePage() {
  const [inputs, setInputs] = useState<FireInputs>({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const set = (k: keyof FireInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcFire(inputs), [inputs])

  const score = r.savingsRate >= 50 ? 'excellent' : r.savingsRate >= 30 ? 'bon' : r.savingsRate >= 15 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { color: 'text-emerald-finance', bg: 'border-emerald-finance/30 bg-emerald-finance/5', label: 'Excellent', Icon: CheckCircle },
    bon: { color: 'text-blue-400', bg: 'border-blue-400/30 bg-blue-400/5', label: 'Bon', Icon: TrendingUp },
    moyen: { color: 'text-amber-400', bg: 'border-amber-400/30 bg-amber-400/5', label: 'Moyen', Icon: Info },
    faible: { color: 'text-crimson-finance', bg: 'border-crimson-finance/30 bg-crimson-finance/5', label: 'Faible', Icon: AlertTriangle },
  }[score]

  const tips = []
  if (r.savingsRate < 20) tips.push('Un taux d\'épargne < 20% rallonge considérablement le chemin vers le FIRE. Identifiez les postes de dépenses à réduire en priorité.')
  if (inputs.withdrawalRate > 4) tips.push('Un taux de retrait > 4% augmente le risque d\'épuiser votre capital. La règle des 4% est éprouvée sur 30 ans, mais une marge est prudente.')
  if (inputs.rate > 8) tips.push('Un rendement de ' + inputs.rate + '% est optimiste. Prévoyez un scénario pessimiste à 5% pour sécuriser votre planning.')
  if (r.yearsToFire > 30) tips.push('Plus de 30 ans avant le FIRE : augmenter le taux d\'épargne est plus efficace que d\'augmenter le rendement.')
  if (r.savingsRate >= 50) tips.push('Excellent taux d\'épargne ! Vérifiez que vous optimisez vos enveloppes fiscales : PEA, assurance-vie, PER.')
  if (tips.length === 0) tips.push('Bonne progression vers l\'indépendance financière. Maintenez la discipline et revoyez vos hypothèses annuellement.')

  const progressColor = r.progressPct >= 75 ? '#2dd4a0' : r.progressPct >= 50 ? '#c9a84c' : r.progressPct >= 25 ? '#f59e0b' : '#e85d75'

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, button, .no-print { display: none !important; } body { background: white !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Calculateur FI/RE</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Financial Independence, Retire Early</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><FileDown className="h-3.5 w-3.5" /> PDF</Button>
          <SaveSimulation type="fire" name={`FI/RE — ${r.yearsToFire} ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Votre situation financière</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center">Revenu annuel net<HelpTip text="Votre revenu annuel net après impôts et cotisations. C'est ce qui rentre effectivement sur votre compte bancaire chaque année." /></Label>
              <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Dépenses annuelles<HelpTip text="Vos dépenses totales annuelles (loyer, nourriture, loisirs, transport...). C'est aussi le montant dont vous aurez besoin chaque année à la retraite FIRE. Réduire ce chiffre est l'levier le plus puissant." /></Label>
              <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Patrimoine actuel<HelpTip text="Total de vos actifs investis : épargne, PEA, assurance-vie, immo locatif... Excluez votre résidence principale si vous comptez y rester." /></Label>
              <Input type="number" value={inputs.netWorth} onChange={e => set('netWorth')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Rendement annuel attendu<HelpTip text="Rendement moyen de vos investissements. ETF World historique : 7-9% nominal (5-6% réel après inflation). Soyez conservateur : utilisez 5-7%." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.rate}%</span>
              </div>
              <Slider min={1} max={15} step={0.5} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Taux de retrait annuel<HelpTip text="La règle des 4% (Trinity Study) : vous pouvez retirer 4% de votre portefeuille par an avec très faible risque d'épuisement sur 30 ans. 3.5% est plus sécurisé pour une longue retraite." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.withdrawalRate}%</span>
              </div>
              <Slider min={2} max={6} step={0.1} value={[inputs.withdrawalRate]} onValueChange={([v]) => set('withdrawalRate')(v)} />
              <div className="flex gap-3 font-mono text-[10px] text-muted-foreground">
                <span className="cursor-pointer hover:text-gold" onClick={() => set('withdrawalRate')(3.5)}>Prudent 3.5%</span> ·
                <span className="cursor-pointer hover:text-gold" onClick={() => set('withdrawalRate')(4)}>Standard 4%</span> ·
                <span className="cursor-pointer hover:text-gold" onClick={() => set('withdrawalRate')(5)}>Optimiste 5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Jauge */}
          <Card className="border-gold/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="stat-label">Progression vers le FIRE</p>
                  <p className="font-display text-4xl font-bold mt-1" style={{ color: progressColor }}>{fmtPct(r.progressPct)}</p>
                </div>
                <div className="text-right">
                  <p className="stat-label">Objectif</p>
                  <p className="font-display text-2xl font-bold text-gold">{fmt(r.target)}</p>
                </div>
              </div>
              <div className="h-4 bg-card border border-border overflow-hidden">
                <div className="h-full transition-all duration-700" style={{ width: `${r.progressPct}%`, backgroundColor: progressColor }} />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>Actuel : {fmt(inputs.netWorth)}</span>
                <span>Manque : {fmt(Math.max(0, r.target - inputs.netWorth))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Années avant FIRE<HelpTip text="Estimation du temps nécessaire pour atteindre votre objectif de patrimoine, en ajoutant chaque année votre épargne + les intérêts composés." /></span>
                <span className="font-mono text-xs font-bold text-gold text-lg">{r.yearsToFire === 100 ? '> 100 ans' : `${r.yearsToFire} ans`}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Épargne annuelle<HelpTip text="Revenu - Dépenses = ce que vous investissez chaque année." /></span>
                <span className={`font-mono text-xs font-semibold ${r.annualSavings >= 0 ? 'text-emerald-finance' : 'text-crimson-finance'}`}>{fmt(r.annualSavings)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Taux d'épargne<HelpTip text="Épargne / Revenu. C'est l'indicateur le plus important en FIRE. 50%+ = FIRE rapide. 10% = retraite classique à 65 ans." /></span>
                <span className={`font-mono text-xs font-semibold ${r.savingsRate >= 30 ? 'text-emerald-finance' : r.savingsRate >= 15 ? 'text-amber-400' : 'text-crimson-finance'}`}>{fmtPct(r.savingsRate)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Revenu passif mensuel cible<HelpTip text="Montant mensuel que votre portefeuille devra générer pour couvrir vos dépenses sans toucher au capital (taux de retrait × patrimoine FIRE / 12)." /></span>
                <span className="font-mono text-xs font-semibold text-foreground">{fmt(r.monthlyPassive)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="font-mono text-xs text-muted-foreground">Patrimoine FIRE cible</span>
                <span className="font-mono text-xs font-semibold text-gold">{fmt(r.target)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Synthèse */}
      <Card className={cn('border', scoreConf.bg)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-5 w-5', scoreConf.color)} />
            Synthèse FI/RE — Taux d&apos;épargne {scoreConf.label} ({fmtPct(r.savingsRate)})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100' : `${r.yearsToFire}`, color: r.yearsToFire < 15 ? 'text-emerald-finance' : r.yearsToFire < 25 ? 'text-amber-400' : 'text-crimson-finance' },
              { label: 'Taux d\'épargne', value: fmtPct(r.savingsRate), color: scoreConf.color },
              { label: 'Progression', value: fmtPct(r.progressPct), color: 'text-gold' },
              { label: 'Revenu passif / mois', value: fmt(r.monthlyPassive), color: 'text-foreground' },
            ].map((k, i) => (
              <div key={i} className="finance-card p-4 text-center">
                <p className="stat-label mb-1">{k.label}</p>
                <p className={cn('font-display text-xl font-bold', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className={cn('p-4 border', scoreConf.bg)}>
            <p className="font-mono text-sm leading-relaxed">
              {score === 'excellent' && `Taux d'épargne exceptionnel de ${fmtPct(r.savingsRate)} — vous êtes sur la voie rapide vers l'indépendance financière en ${r.yearsToFire} ans. Optimisez vos enveloppes fiscales pour maximiser l'effet composé.`}
              {score === 'bon' && `Bon taux d'épargne de ${fmtPct(r.savingsRate)}. En maintenant ce rythme, vous atteindrez l'indépendance financière en ${r.yearsToFire} ans. Cherchez à passer le cap des 40-50%.`}
              {score === 'moyen' && `Taux d'épargne de ${fmtPct(r.savingsRate)} — correct mais perfectible. Chaque point de pourcentage supplémentaire raccourcit votre chemin vers le FIRE.`}
              {score === 'faible' && `Taux d'épargne de ${fmtPct(r.savingsRate)} insuffisant pour le FIRE. Priorité : réduire les dépenses ou augmenter les revenus. Même passer de 10% à 20% divise le temps par 2.`}
            </p>
          </div>
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 p-3 border border-border/50">
              <Info className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="font-mono text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
