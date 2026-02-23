'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, FileDown, Home, TrendingUp, Info, CheckCircle, AlertTriangle } from 'lucide-react'
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

export default function BuyRentPage() {
  const [inputs, setInputs] = useState<BuyRentInputs>({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })
<<<<<<< HEAD
  const set = (k: keyof BuyRentInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const verdict = r.buyWins
  const scoreConf = verdict
    ? { color: 'text-emerald-finance', bg: 'border-emerald-finance/30 bg-emerald-finance/5', Icon: CheckCircle, label: 'Achat avantageux' }
    : { color: 'text-blue-400', bg: 'border-blue-400/30 bg-blue-400/5', Icon: TrendingUp, label: 'Location avantageuse' }

  const tips = []
  if (inputs.down / inputs.price < 0.1) tips.push('Un apport < 10% du prix implique souvent des frais de dossier plus élevés et un taux moins favorable. Visez 20%.')
  if (inputs.loanRate > 4) tips.push('Avec un taux > 4%, comparez plusieurs banques et courtiers — les écarts peuvent atteindre 0.5-1 point.')
  if (inputs.appreciation < 1) tips.push('Une appréciation < 1%/an rend l\'achat rarement rentable face à la location + placement. Vérifiez le marché local.')
  if (r.breakevenYears > 15) tips.push(`Le seuil de rentabilité à ${r.breakevenYears} ans est élevé. Assurez-vous de pouvoir rester dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans.`)
  if (!verdict) tips.push('Louer et investir la différence (apport + mensualités épargnées) peut générer plus de richesse sur votre horizon.')
  if (verdict && r.breakevenYears < 10) tips.push(`Excellent investissement : seuil de rentabilité atteint en seulement ${r.breakevenYears} ans.`)

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, button, .no-print { display: none !important; } body { background: white !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Acheter vs Louer</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Comparaison patrimoniale sur {inputs.years} ans</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><FileDown className="h-3.5 w-3.5" /> PDF</Button>
          <SaveSimulation type="buyrent" name={`Achat vs Loc — ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>
=======
  const set = (k: keyof BuyRentInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const tips = []
  if (inputs.down / inputs.price < 0.1) tips.push('Un apport < 10% implique souvent des frais plus élevés. Visez 20% pour obtenir les meilleurs taux.')
  if (inputs.loanRate > 4) tips.push('Avec un taux > 4%, consultez un courtier — les écarts entre banques peuvent atteindre 0.5-1 point.')
  if (r.breakevenYears > 15) tips.push(`Seuil de rentabilité à ${r.breakevenYears} ans — restez dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans.`)
  if (!r.buyWins) tips.push('Louer et investir la différence peut générer plus de richesse sur votre horizon. Revoyez les hypothèses de valorisation.')
  if (r.buyWins && r.breakevenYears < 10) tips.push(`Excellent investissement : seuil de rentabilité atteint en ${r.breakevenYears} ans.`)

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Acheter vs Louer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comparaison patrimoniale sur {inputs.years} ans</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
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
>>>>>>> f6ede2a (update design)

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <Card>
<<<<<<< HEAD
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Votre scénario immobilier</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center">Prix du bien<HelpTip text="Prix d'achat total FAI (Frais d'Agence Inclus). Les frais de notaire (~8% dans l'ancien, ~3% dans le neuf) sont calculés automatiquement en plus." /></Label>
              <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Apport personnel<HelpTip text="Somme que vous apportez sans emprunt. Un apport de 20% est idéal pour obtenir les meilleurs taux et éviter l'assurance supplémentaire." /></Label>
              <Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)} />
              <p className="font-mono text-[10px] text-muted-foreground">Soit {fmtPct(inputs.down / inputs.price * 100)} du prix • Emprunt : {fmt(inputs.price - inputs.down)}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Taux du prêt<HelpTip text="Taux d'intérêt annuel de votre crédit immobilier (hors assurance). Comparez plusieurs établissements. Actuellement en France : 3-4.5% selon la durée." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.loanRate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Loyer mensuel équivalent<HelpTip text="Loyer que vous paieriez pour un bien équivalent. Dans le scénario location, vous investissez la différence entre la mensualité d'achat et ce loyer." /></Label>
              <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Durée d'analyse<HelpTip text="Horizon de comparaison. Plus la durée est longue, plus l'achat devient généralement avantageux (amortissement des frais initiaux)." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.years} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Valorisation annuelle du bien<HelpTip text="Appréciation annuelle estimée du prix immobilier. France longue période : ~2-3%. Varie beaucoup selon la ville et le quartier." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.appreciation}%</span>
              </div>
              <Slider min={-2} max={8} step={0.5} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center">Rendement investissement alternatif<HelpTip text="Si vous louez au lieu d'acheter, vous placez votre apport. Ce taux est le rendement annuel de ce placement (ETF, SCPI, etc.)." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.investReturn}%</span>
=======
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
>>>>>>> f6ede2a (update design)
              </div>
              <Slider min={0} max={12} step={0.5} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
            </div>
          </CardContent>
        </Card>

<<<<<<< HEAD
        <div className="space-y-4">
          <div className={cn('finance-card p-6 border-2', verdict ? 'border-emerald-finance/40' : 'border-blue-400/40')}>
            <div className="flex items-center gap-3 mb-4">
              <scoreConf.Icon className={cn('h-8 w-8', scoreConf.color)} />
              <div>
                <p className="stat-label">Verdict sur {inputs.years} ans</p>
                <p className={cn('font-display text-2xl font-bold', scoreConf.color)}>{scoreConf.label}</p>
              </div>
            </div>
            <p className="font-mono text-xs text-muted-foreground">Avantage patrimonial</p>
            <p className={cn('font-display text-3xl font-bold', scoreConf.color)}>{fmt(r.delta)}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">en faveur du scénario {verdict ? 'achat' : 'location + placement'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="border-gold/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2"><Home className="h-4 w-4 text-gold" /><p className="stat-label">Achat — Patrimoine</p></div>
                <p className="font-display text-2xl font-bold text-gold">{fmt(r.buyNetWorth)}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">Valeur bien : {fmt(r.propertyValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-400/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-blue-400" /><p className="stat-label">Location — Capital</p></div>
                <p className="font-display text-2xl font-bold text-blue-400">{fmt(r.rentCapital)}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">Apport + diff investis</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground flex items-center">Seuil de rentabilité<HelpTip text="Nombre d'années à partir duquel l'achat devient plus intéressant que la location+placement. Avant ce délai, louer est plus rentable." /></span>
                <span className="font-mono text-xs font-semibold text-gold">{r.breakevenYears} ans</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-border/50">
                <span className="font-mono text-xs text-muted-foreground">Coût total achat</span>
                <span className="font-mono text-xs font-semibold text-crimson-finance">{fmt(r.totalBuyCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="font-mono text-xs text-muted-foreground">Coût total location</span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">{fmt(r.totalRentCost)}</span>
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
            Synthèse — {scoreConf.label} sur {inputs.years} ans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Patrimoine achat', value: fmt(r.buyNetWorth), color: 'text-gold' },
              { label: 'Capital location', value: fmt(r.rentCapital), color: 'text-blue-400' },
              { label: 'Avantage', value: fmt(r.delta), color: scoreConf.color },
              { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans`, color: r.breakevenYears < 10 ? 'text-emerald-finance' : r.breakevenYears < 20 ? 'text-amber-400' : 'text-crimson-finance' },
            ].map((k, i) => (
              <div key={i} className="finance-card p-4 text-center">
                <p className="stat-label mb-1">{k.label}</p>
                <p className={cn('font-display text-xl font-bold', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className={cn('p-4 border', scoreConf.bg)}>
            <p className="font-mono text-sm leading-relaxed">
              {verdict
                ? `Sur ${inputs.years} ans, l'achat génère ${fmt(r.delta)} de patrimoine supplémentaire par rapport à la location. Le seuil de rentabilité est atteint en ${r.breakevenYears} ans — restez dans ce bien au minimum ${r.breakevenYears} ans pour que l'achat soit rentable.`
                : `Sur ${inputs.years} ans, louer et investir la différence génère ${fmt(r.delta)} de capital supplémentaire par rapport à l'achat. Cela s'explique par le rendement du placement alternatif (${inputs.investReturn}%) supérieur à la valorisation immobilière (${inputs.appreciation}%).`
              }
            </p>
          </div>
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 p-3 border border-border/50">
              <Info className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="font-mono text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
=======
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
      <Card>
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
>>>>>>> f6ede2a (update design)
        </CardContent>
      </Card>
    </div>
  )
}
