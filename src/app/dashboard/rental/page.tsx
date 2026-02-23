'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcRental, type RentalInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'

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

function RentalPageInner() {
  const [inputs, setInputs] = useState<RentalInputs>({
    price: 200000, notaryFees: 8, works: 10000, rent: 900, charges: 100,
    taxeFonciere: 1200, insurance: 200, vacancy: 4, loanAmount: 160000,
    loanRate: 3.5, loanYears: 20, regime: 'nu', marginalRate: 30
  })
  const set = (k: keyof RentalInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const searchParams = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('restore')
    if (!raw) return
    try { setInputs(JSON.parse(raw) as RentalInputs) } catch {}
  }, [])

  const r = useMemo(() => calcRental(inputs), [inputs])
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon: { label: 'Positif', Icon: TrendingUp, color: 'text-blue-400' },
    moyen: { label: 'Effort', Icon: Minus, color: 'text-amber-400' },
    negatif: { label: 'Négatif', Icon: AlertCircle, color: 'text-crimson-finance' },
  }[r.analysis.score]

  const barData = [
    { name: 'Loyers', value: Math.round(r.annualRent), fill: 'hsl(0 0% 70%)' },
    { name: 'Charges', value: -Math.round(r.annualCharges), fill: 'hsl(0 72% 51%)' },
    { name: 'Taxe foncière', value: -Math.round(inputs.taxeFonciere), fill: 'hsl(0 72% 51%)' },
    { name: 'Assurance', value: -Math.round(inputs.insurance), fill: 'hsl(0 72% 51%)' },
    { name: 'Crédit', value: -Math.round(r.monthlyLoan * 12), fill: 'hsl(0 60% 40%)' },
    { name: 'Impôts', value: -Math.round(r.tax), fill: 'hsl(38 92% 50%)' },
    { name: 'Cashflow', value: Math.round(r.cashflowAnnual), fill: r.cashflowAnnual >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rentabilité Locative</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cashflow · Rendement · Fiscalité (nu / meublé / LMNP)</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="rental" name={`Locatif ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cashflow mensuel', value: fmt(r.cashflowMonthly), sub: `${fmt(r.cashflowAnnual)}/an` },
          { label: 'Rendement brut', value: fmtPct(r.grossYield) },
          { label: 'Rendement net', value: fmtPct(r.netYield) },
          { label: 'ROI sur fonds propres', value: fmtPct(r.roi) },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-semibold tracking-tight',
                k.label.includes('Cashflow') && (r.cashflowMonthly >= 0 ? 'text-emerald-finance' : 'text-crimson-finance')
              )}>{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Prix d'achat<Tip text="Prix FAI. Les frais de notaire s'ajoutent en pourcentage ci-dessous." /></Label>
                <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Frais de notaire<Tip text="~8% dans l'ancien, ~3% dans le neuf." /></Label>
                  <span className="text-sm font-medium">{inputs.notaryFees}%</span>
                </div>
                <Slider min={2} max={10} step={0.5} value={[inputs.notaryFees]} onValueChange={([v]) => set('notaryFees')(v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Travaux<Tip text="Budget travaux/rénovation initial. Inclus dans l'investissement total." /></Label>
                <Input type="number" value={inputs.works} onChange={e => set('works')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Montant emprunté<Tip text="Capital emprunté. Laissez 0 pour un achat cash." /></Label>
                <Input type="number" value={inputs.loanAmount} onChange={e => set('loanAmount')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Taux crédit</Label>
                  <span className="text-sm font-medium">{inputs.loanRate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Durée crédit</Label>
                  <span className="text-sm font-medium">{inputs.loanYears} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.loanYears]} onValueChange={([v]) => set('loanYears')(v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Exploitation & Fiscalité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Loyer mensuel HC<Tip text="Loyer hors charges. Base de calcul du rendement." /></Label>
                <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Charges mensuelles<Tip text="Charges non récupérables sur le locataire : copropriété, entretien..." /></Label>
                <Input type="number" value={inputs.charges} onChange={e => set('charges')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Taxe foncière (€/an)<Tip text="Taxe foncière annuelle — à votre charge en tant que propriétaire." /></Label>
                <Input type="number" value={inputs.taxeFonciere} onChange={e => set('taxeFonciere')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Assurance PNO (€/an)<Tip text="Assurance Propriétaire Non Occupant — obligatoire en copropriété." /></Label>
                <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Taux de vacance<Tip text="Pourcentage du temps sans locataire. 4-8% est réaliste selon la localisation." /></Label>
                  <span className="text-sm font-medium">{inputs.vacancy}%</span>
                </div>
                <Slider min={0} max={20} step={0.5} value={[inputs.vacancy]} onValueChange={([v]) => set('vacancy')(v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Régime fiscal<Tip text="Nu : revenus fonciers. Meublé micro-BIC : 50% abattement. LMNP réel : amortissement, fiscalité quasi nulle." /></Label>
                <Select value={inputs.regime} onValueChange={v => set('regime')(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nu">Location nue (revenus fonciers)</SelectItem>
                    <SelectItem value="meuble">Meublé micro-BIC (50% abatt.)</SelectItem>
                    <SelectItem value="lmnp">LMNP réel (amortissement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inputs.regime !== 'lmnp' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Votre TMI</Label>
                    <span className="text-sm font-medium">{inputs.marginalRate}%</span>
                  </div>
                  <Slider min={0} max={45} step={1} value={[inputs.marginalRate]} onValueChange={([v]) => set('marginalRate')(v)} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Décomposition du cashflow annuel</CardTitle>
            <CardDescription>Revenus et charges sur 12 mois — Investissement total : {fmt(r.totalInvestment)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(0 0% 63.9%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 12 }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'Loyers annuels bruts', value: fmt(r.annualRent) },
                    { label: `Vacance locative (${inputs.vacancy}%)`, value: `− ${fmt(r.annualVacancyLoss)}` },
                    { label: 'Charges non récupérables', value: `− ${fmt(r.annualCharges)}` },
                    { label: 'Taxe foncière', value: `− ${fmt(inputs.taxeFonciere)}` },
                    { label: 'Assurance PNO', value: `− ${fmt(inputs.insurance)}` },
                    { label: 'Revenu net opérationnel', value: fmt(r.netOperatingIncome), bold: true },
                    { label: `Remboursement crédit`, value: `− ${fmt(r.monthlyLoan * 12)}` },
                    { label: `Impôts (${inputs.regime.toUpperCase()})`, value: `− ${fmt(r.tax)}` },
                    { label: 'Cashflow annuel net', value: fmt(r.cashflowAnnual), bold: true, color: r.cashflowAnnual >= 0 ? 'text-emerald-finance' : 'text-crimson-finance' },
                  ].map((row, i) => (
                    <tr key={i} className={cn('border-b border-border last:border-0', row.bold && 'bg-muted/30')}>
                      <td className="px-4 py-2.5 text-muted-foreground text-sm">{row.label}</td>
                      <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums', row.color)}>{row.value}</td>
                    </tr>
                  ))}
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
            <CardTitle>Analyse — Cashflow {scoreConf.label}</CardTitle>
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

export default function RentalPage() { return <Suspense><RentalPageInner /></Suspense> }
