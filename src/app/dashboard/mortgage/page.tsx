'use client'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, FileDown, Info, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
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

export default function MortgagePage() {
  const [inputs, setInputs] = useState<MortgageInputs>({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })
  const set = (k: keyof MortgageInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcMortgage(inputs), [inputs])

  const interestRatio = r.totalInterest / inputs.amount * 100
  const score = interestRatio < 30 ? 'excellent' : interestRatio < 50 ? 'bon' : interestRatio < 80 ? 'moyen' : 'eleve'
  const scoreConf = {
    excellent: { color: 'text-emerald-finance', bg: 'border-emerald-finance/30 bg-emerald-finance/5', label: 'Excellent', Icon: CheckCircle },
    bon: { color: 'text-blue-400', bg: 'border-blue-400/30 bg-blue-400/5', label: 'Bon', Icon: TrendingUp },
    moyen: { color: 'text-amber-400', bg: 'border-amber-400/30 bg-amber-400/5', label: 'Moyen', Icon: Info },
    eleve: { color: 'text-crimson-finance', bg: 'border-crimson-finance/30 bg-crimson-finance/5', label: 'Élevé', Icon: AlertTriangle },
  }[score]

  const tips = []
  if (inputs.rate > 4) tips.push('Taux > 4% : consultez un courtier immobilier, les économies potentielles sur la durée du crédit peuvent dépasser 20 000€.')
  if (inputs.years > 25) tips.push(`Durée de ${inputs.years} ans : vous paierez ${fmt(r.totalInterest)} d'intérêts. Réduire de 5 ans ferait économiser environ ${fmt(r.totalInterest * 0.25)}.`)
  if (r.totalInsurance > r.totalInterest * 0.3) tips.push('Votre assurance emprunteur est élevée. Comparez les offres : vous pouvez souvent économiser 30-50% en délégation d\'assurance.')
  if (inputs.amount > 300000 && inputs.rate < 3) tips.push('Beau taux ! Pensez à ne pas rembourser par anticipation si votre épargne peut rapporter plus que votre taux de crédit.')
  if (interestRatio < 30) tips.push(`Excellent crédit : vous ne paierez que ${fmtPct(interestRatio)} d'intérêts supplémentaires par rapport au capital emprunté.`)

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, button, .no-print { display: none !important; } body { background: white !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Prêt Immobilier</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Mensualités · TAEG · Tableau d&apos;amortissement</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><FileDown className="h-3.5 w-3.5" /> PDF</Button>
          <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} @ ${inputs.rate}% / ${inputs.years}ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres du prêt</CardTitle><CardDescription>// Votre crédit immobilier</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center">Montant emprunté<HelpTip text="Capital que vous empruntez à la banque = Prix du bien + frais de notaire - apport. C'est la base de calcul de vos mensualités." /></Label>
              <Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Taux d'intérêt annuel<HelpTip text="Taux nominal du crédit, hors assurance. En France en 2024 : 3-4.5% selon la durée. Ne pas confondre avec le TAEG qui inclut tous les frais." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Durée du crédit<HelpTip text="Plus la durée est longue, plus les mensualités sont basses mais plus vous payez d'intérêts au total. Cherchez l'équilibre selon votre capacité de remboursement." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.years} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Assurance emprunteur (€/mois)<HelpTip text="Obligatoire pour obtenir un crédit. Couvre décès, invalidité, parfois chômage. Peut être délégué (autre assureur que la banque) pour économiser 30-50%." /></Label>
              <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Frais de dossier (€)<HelpTip text="Frais facturés par la banque pour le montage du dossier. Généralement négociables (0 à 1500€). Inclus dans le calcul du TAEG." /></Label>
              <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="stat-label mb-2">Mensualité totale</p>
              <p className="font-display text-4xl font-bold text-gold">{fmt(r.totalMonthly)}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">dont {fmt(r.monthlyPayment)} capital+intérêts + {fmt(inputs.insurance)} assurance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Capital emprunté<HelpTip text="Montant de départ que vous remboursez progressivement. Au début, la majorité de la mensualité va aux intérêts." /></span>
                <span className="font-mono text-xs font-semibold">{fmt(inputs.amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Intérêts totaux<HelpTip text="Coût total des intérêts sur toute la durée du prêt. C'est ce que vous payez en plus du capital à la banque." /></span>
                <span className="font-mono text-xs font-semibold text-crimson-finance">{fmt(r.totalInterest)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Assurance totale<HelpTip text="Coût total de l'assurance emprunteur sur la durée du prêt. Souvent sous-estimé : peut représenter 10-20% du coût total." /></span>
                <span className="font-mono text-xs font-semibold text-amber-400">{fmt(r.totalInsurance)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Coût total du crédit<HelpTip text="Intérêts + assurance + frais de dossier. Ce que vous payez en plus du capital pour obtenir et rembourser ce crédit." /></span>
                <span className="font-mono text-xs font-semibold text-crimson-finance">{fmt(r.totalCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">TAEG<HelpTip text="Taux Annuel Effectif Global : taux qui intègre tous les frais (intérêts + assurance + frais de dossier). C'est l'indicateur légal de comparaison entre crédits." /></span>
                <span className="font-mono text-xs font-semibold text-gold">{r.taeg.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Ratio intérêts / capital<HelpTip text="Pourcentage d'intérêts par rapport au capital emprunté. < 30% = excellent. 50-80% = attention au coût réel." /></span>
                <span className={`font-mono text-xs font-semibold ${interestRatio < 30 ? 'text-emerald-finance' : interestRatio < 50 ? 'text-amber-400' : 'text-crimson-finance'}`}>{fmtPct(interestRatio)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Graphique amortissement */}
      <Card>
        <CardHeader><CardTitle>Tableau d&apos;amortissement</CardTitle><CardDescription>// Capital remboursé vs capital restant dû</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={r.chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => `${v}a`} />
              <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => `${Math.round(v / 1000)}k€`} />
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'hsl(210 12% 8%)', border: '1px solid hsl(210 10% 15%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Area type="monotone" dataKey="capitalRepaid" name="Capital remboursé" stroke="#2dd4a0" fill="#2dd4a0" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="remaining" name="Capital restant dû" stroke="#e85d75" fill="#e85d75" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Synthèse */}
      <Card className={cn('border', scoreConf.bg)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-5 w-5', scoreConf.color)} />
            Synthèse — Coût du crédit {scoreConf.label} ({fmtPct(interestRatio)} d&apos;intérêts)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Mensualité', value: fmt(r.totalMonthly), color: 'text-gold' },
              { label: 'Intérêts totaux', value: fmt(r.totalInterest), color: 'text-crimson-finance' },
              { label: 'Ratio intérêts', value: fmtPct(interestRatio), color: scoreConf.color },
              { label: 'TAEG', value: `${r.taeg.toFixed(2)}%`, color: 'text-foreground' },
            ].map((k, i) => (
              <div key={i} className="finance-card p-4 text-center">
                <p className="stat-label mb-1">{k.label}</p>
                <p className={cn('font-display text-xl font-bold', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className={cn('p-4 border', scoreConf.bg)}>
            <p className="font-mono text-sm leading-relaxed">
              Pour un emprunt de {fmt(inputs.amount)} sur {inputs.years} ans à {inputs.rate}%, vous paierez {fmt(r.totalInterest)} d&apos;intérêts, soit {fmtPct(interestRatio)} du capital. 
              {interestRatio < 30 && ' Excellent ratio — votre crédit est bien optimisé.'}
              {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
              {interestRatio >= 50 && ' Ratio élevé — la durée ou le taux pèsent lourd sur le coût total. Envisagez de raccourcir la durée si votre budget le permet.'}
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
