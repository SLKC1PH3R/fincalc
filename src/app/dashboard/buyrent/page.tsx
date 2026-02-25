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
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, Home, TrendingUp, CheckCircle2, Info } from 'lucide-react'
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

function BuyRentPageInner() {
  const [inputs, setInputs] = useState<BuyRentInputs>({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })
  const set = (k: keyof BuyRentInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Restore simulation from history
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try { setInputs(JSON.parse(restoreParam) as BuyRentInputs) } catch {}
  }, [restoreParam])
  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const tips: string[] = []
  if (inputs.down / inputs.price < 0.1) tips.push('Un apport < 10% implique souvent des frais plus élevés. Visez 20% pour obtenir les meilleurs taux.')
  if (inputs.loanRate > 4) tips.push('Avec un taux > 4%, consultez un courtier — les écarts entre banques peuvent atteindre 0.5-1 point.')
  if (r.breakevenYears > 15) tips.push(`Seuil de rentabilité à ${r.breakevenYears} ans — restez dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans.`)
  if (!r.buyWins) tips.push('Louer et investir la différence peut générer plus de richesse sur votre horizon. Revoyez les hypothèses de valorisation.')
  if (r.buyWins && r.breakevenYears < 10) tips.push(`Excellent investissement : seuil de rentabilité atteint en ${r.breakevenYears} ans.`)

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Acheter vs Louer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comparaison patrimoniale sur {inputs.years} ans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Acheter vs Louer',
            subtitle: `Comparaison patrimoniale sur ${inputs.years} ans`,
            kpis: [
              { label: r.buyWins ? 'Avantage achat' : 'Avantage location', value: fmt(Math.abs(r.delta)), highlight: true },
              { label: 'Patrimoine si achat', value: fmt(r.buyNetWorth) },
              { label: 'Capital si location', value: fmt(r.rentCapital) },
              { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans` },
            ],
            inputs: [
              { label: "Prix du bien", value: fmt(inputs.price) },
              { label: 'Apport', value: fmt(inputs.down) },
              { label: 'Taux crédit', value: `${inputs.loanRate}%` },
              { label: 'Loyer équivalent', value: `${fmt(inputs.rent)}/mois` },
              { label: 'Durée analyse', value: `${inputs.years} ans` },
              { label: 'Rendement investissement', value: `${inputs.investReturn}%` },
            ],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="buyrent" name={`Achat vs Loc ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* Verdict KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patrimoine si achat', value: fmt(r.buyNetWorth) },
          { label: 'Capital si location', value: fmt(r.rentCapital) },
          { label: 'Avantage', value: fmt(r.delta) },
          { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans` },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-semibold tracking-tight">{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Verdict banner */}
      <Card className={cn('border-2', r.buyWins ? 'border-foreground/20' : 'border-foreground/10')}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {r.buyWins ? <Home className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Verdict sur {inputs.years} ans</p>
                <p className="text-lg font-semibold tracking-tight">{r.buyWins ? 'L\'achat est plus avantageux' : 'La location est plus avantageuse'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Avantage patrimonial</p>
              <p className="text-2xl font-semibold tracking-tight">{fmt(r.delta)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>Votre scénario</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Prix du bien<Tip text="Prix d'achat FAI. Les frais de notaire (~8% ancien, ~3% neuf) sont calculés automatiquement." /></Label>
              <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Apport<Tip text="20% est idéal pour obtenir les meilleurs taux." /></Label>
              <Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)} />
              <p className="text-[11px] text-muted-foreground">{fmtPct(inputs.down / inputs.price * 100)} du prix · Emprunt {fmt(inputs.price - inputs.down)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Taux du prêt<Tip text="Taux annuel hors assurance. Actuellement 3-4.5% selon la durée." /></Label>
                <span className="text-sm font-medium">{inputs.loanRate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Loyer équivalent<Tip text="Loyer pour un bien similaire. Dans le scénario location, la différence avec la mensualité est investie." /></Label>
              <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Durée d'analyse<Tip text="Plus la durée est longue, plus l'achat devient généralement avantageux." /></Label>
                <span className="text-sm font-medium">{inputs.years} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Valorisation immo/an<Tip text="Appréciation annuelle estimée. France longue période : ~2-3%." /></Label>
                <span className="text-sm font-medium">{inputs.appreciation}%</span>
              </div>
              <Slider min={-2} max={8} step={0.5} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Rendement placement<Tip text="Rendement annuel si vous investissez votre apport en location (ETF, SCPI...)." /></Label>
                <span className="text-sm font-medium">{inputs.investReturn}%</span>
              </div>
              <Slider min={0} max={12} step={0.5} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
            </div>
          </CardContent>
        </Card>

        {/* Comparison */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Comparaison patrimoniale</CardTitle><CardDescription>Achat vs Location + Placement</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Scénario Achat</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {[
                    { label: 'Valeur bien', value: fmt(r.propertyValue) },
                    { label: 'Coût total', value: fmt(r.totalBuyCost) },
                    { label: 'Patrimoine net', value: fmt(r.buyNetWorth) },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-md border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Scénario Location</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {[
                    { label: 'Loyers payés', value: fmt(r.totalRentCost) },
                    { label: 'Capital investi', value: fmt(inputs.down) },
                    { label: 'Capital final', value: fmt(r.rentCapital) },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium tabular-nums">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bilan comparatif</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Achat</span>
                  <span className="font-semibold tabular-nums">{fmt(r.buyNetWorth)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${Math.min(r.buyNetWorth / Math.max(r.buyNetWorth, r.rentCapital) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold tabular-nums">{fmt(r.rentCapital)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-muted-foreground rounded-full" style={{ width: `${Math.min(r.rentCapital / Math.max(r.buyNetWorth, r.rentCapital) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card style={{ borderColor: r.buyWins ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle>Analyse — {r.buyWins ? 'Achat avantageux' : 'Location avantageuse'} sur {inputs.years} ans</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {r.buyWins
              ? `L'achat génère ${fmt(r.delta)} de patrimoine supplémentaire sur ${inputs.years} ans. Le seuil de rentabilité est atteint en ${r.breakevenYears} ans.`
              : `Louer et investir la différence génère ${fmt(r.delta)} de capital supplémentaire. Le rendement du placement (${inputs.investReturn}%) surpasse la valorisation immobilière (${inputs.appreciation}%).`}
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

export default function BuyRentPage() {
  return <Suspense><BuyRentPageInner /></Suspense>
}
