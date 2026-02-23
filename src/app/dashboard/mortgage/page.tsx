'use client'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'

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

export default function MortgagePage() {
  const [inputs, setInputs] = useState<MortgageInputs>({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })
  const set = (k: keyof MortgageInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcMortgage(inputs), [inputs])

  const interestRatio = r.totalInterest / inputs.amount * 100
  const score = interestRatio < 30 ? 'excellent' : interestRatio < 50 ? 'bon' : interestRatio < 80 ? 'moyen' : 'eleve'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon: { label: 'Bon', Icon: TrendingUp, color: 'text-blue-400' },
    moyen: { label: 'Moyen', Icon: Minus, color: 'text-amber-400' },
    eleve: { label: 'Élevé', Icon: AlertCircle, color: 'text-crimson-finance' },
  }[score]

  const tips = []
  if (inputs.rate > 4) tips.push('Taux > 4% : consultez un courtier, les économies sur la durée peuvent dépasser 20 000€.')
  if (inputs.years > 25) tips.push(`Durée de ${inputs.years} ans : réduire de 5 ans économiserait environ ${fmt(r.totalInterest * 0.25)} d'intérêts.`)
  if (r.totalInsurance > r.totalInterest * 0.3) tips.push('Assurance emprunteur élevée. La délégation d\'assurance peut économiser 30-50%.')
  if (interestRatio < 30) tips.push(`Excellent crédit — vous payez seulement ${fmtPct(interestRatio)} d'intérêts sur le capital.`)

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prêt Immobilier</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mensualités · TAEG · Tableau d&apos;amortissement</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} @ ${inputs.rate}%`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Mensualité totale', value: fmt(r.totalMonthly), sub: `dont ${fmt(r.monthlyPayment)} crédit` },
          { label: 'Intérêts totaux', value: fmt(r.totalInterest) },
          { label: 'Coût total crédit', value: fmt(r.totalCost) },
          { label: 'TAEG', value: `${r.taeg.toFixed(2)}%` },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>Votre crédit immobilier</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Montant emprunté<Tip text="Capital emprunté = Prix + frais notaire - apport. Base de calcul des mensualités." /></Label>
              <Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Taux annuel<Tip text="Taux nominal hors assurance. En France 2024 : 3-4.5% selon la durée. Ne pas confondre avec le TAEG." /></Label>
                <span className="text-sm font-medium">{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Durée<Tip text="Plus la durée est longue : mensualités basses mais coût total élevé." /></Label>
                <span className="text-sm font-medium">{inputs.years} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => set('years')(15)}>15 ans</button>
                <button className="hover:text-foreground" onClick={() => set('years')(20)}>20 ans</button>
                <button className="hover:text-foreground" onClick={() => set('years')(25)}>25 ans</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Assurance (€/mois)<Tip text="Obligatoire. Couvre décès, invalidité. La délégation d'assurance peut économiser 30-50%." /></Label>
              <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Frais de dossier (€)<Tip text="Facturés par la banque. Généralement 0-1500€, souvent négociables." /></Label>
              <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Amortissement chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tableau d&apos;amortissement</CardTitle>
            <CardDescription>Capital remboursé vs capital restant dû sur {inputs.years} ans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 12 }} />
                <Area type="monotone" dataKey="capitalRepaid" name="Remboursé" stroke="hsl(0 0% 98%)" fill="hsl(0 0% 98%)" fillOpacity={0.1} strokeWidth={1.5} />
                <Area type="monotone" dataKey="remaining" name="Restant dû" stroke="hsl(0 0% 50%)" fill="hsl(0 0% 50%)" fillOpacity={0.05} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>

            {/* Cost breakdown table */}
            <div className="mt-4 rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Capital', value: fmt(inputs.amount), pct: null },
                    { label: 'Intérêts', value: fmt(r.totalInterest), pct: fmtPct(interestRatio) },
                    { label: 'Assurance', value: fmt(r.totalInsurance), pct: null },
                    { label: 'Frais dossier', value: fmt(inputs.fees), pct: null },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{row.label}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{row.value}</td>
                      {row.pct && <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{row.pct}</td>}
                      {!row.pct && <td className="px-4 py-2.5" />}
                    </tr>
                  ))}
                  <tr className="bg-muted/40">
                    <td className="px-4 py-2.5 font-medium">Total déboursé</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmt(inputs.amount + r.totalCost)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — Ratio intérêts {scoreConf.label} ({fmtPct(interestRatio)})</CardTitle>
          </div>
          <CardDescription>Pour {fmt(inputs.amount)} emprunté sur {inputs.years} ans à {inputs.rate}%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vous paierez {fmt(r.totalInterest)} d&apos;intérêts, soit {fmtPct(interestRatio)} du capital.
            {interestRatio < 30 && ' Excellent ratio — crédit bien optimisé.'}
            {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
            {interestRatio >= 50 && ' Ratio élevé — envisagez de raccourcir la durée ou augmenter l\'apport.'}
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
