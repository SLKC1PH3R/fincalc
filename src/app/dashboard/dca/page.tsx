'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcDCA, type DCAInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, TrendingUp, Info } from 'lucide-react'

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

function DCAPageInner() {
  const [inputs, setInputs] = useState<DCAInputs>({ monthly: 500, years: 15, targetRate: 8, volatility: 15, initialPrice: 100 })
  const set = (k: keyof DCAInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const searchParams = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('restore'); if (!raw) return
    try { setInputs(JSON.parse(raw) as DCAInputs) } catch {}
  }, [])

  const r = useMemo(() => calcDCA(inputs), [inputs])

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">DCA — Dollar Cost Averaging</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Investissement régulier vs achat unique — effet de la volatilité</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="dca" name={`DCA ${fmt(inputs.monthly)}/mois × ${inputs.years}ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Valeur estimée', value: fmt(r.estimatedValue) },
          { label: 'Total investi', value: fmt(r.totalInvested) },
          { label: 'Gain', value: fmt(r.gain), color: 'text-emerald-finance' },
          { label: 'vs Achat unique', value: (r.vsLumpSum >= 0 ? '+' : '') + fmt(r.vsLumpSum), color: r.vsLumpSum >= 0 ? 'text-emerald-finance' : 'text-crimson-finance' },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent><div className={cn('text-2xl font-semibold tracking-tight', k.color)}>{k.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>Votre stratégie DCA</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Versement mensuel<Tip text="Montant investi chaque mois, quel que soit le prix du marché. La régularité est l'essence du DCA." /></Label>
              <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center gap-1">Durée<Tip text="Le DCA est surtout efficace sur 10+ ans — la volatilité se lisse sur la durée." /></Label>
                <span className="text-sm font-medium">{inputs.years} ans</span>
              </div>
              <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center gap-1">Rendement annuel moyen<Tip text="Rendement attendu à long terme. ETF MSCI World : ~8% historique sur 30 ans." /></Label>
                <span className="text-sm font-medium">{inputs.targetRate}%</span>
              </div>
              <Slider min={1} max={20} step={0.5} value={[inputs.targetRate]} onValueChange={([v]) => set('targetRate')(v)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center gap-1">Volatilité annuelle<Tip text="Amplitude des fluctuations de prix. ETF World : ~15%. Actions individuelles : 25-40%. Plus la volatilité est haute, plus le DCA est avantageux vs achat unique." /></Label>
                <span className="text-sm font-medium">{inputs.volatility}%</span>
              </div>
              <Slider min={0} max={50} step={1} value={[inputs.volatility]} onValueChange={([v]) => set('volatility')(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => set('volatility')(5)}>Obligations 5%</button>
                <button className="hover:text-foreground" onClick={() => set('volatility')(15)}>ETF World 15%</button>
                <button className="hover:text-foreground" onClick={() => set('volatility')(30)}>Actions 30%</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Prix initial de l'actif<Tip text="Prix unitaire au départ. Ex: 100€ pour un ETF. Influence le prix moyen de revient calculé." /></Label>
              <Input type="number" value={inputs.initialPrice} onChange={e => set('initialPrice')(+e.target.value)} />
            </div>

            <Separator />
            <div className="space-y-2 rounded-md border border-border p-3">
              {[
                { label: 'Parts accumulées', value: r.units.toFixed(2) },
                { label: 'Prix moyen de revient', value: fmt(r.avgCostBasis) },
                { label: 'Gain total', value: `${fmt(r.gain)} (+${r.gainPct.toFixed(1)}%)` },
              ].map((k, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k.label}</span>
                  <span className="font-medium tabular-nums">{k.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution du portefeuille</CardTitle>
            <CardDescription>Capital investi vs valeur de marché sur {inputs.years} ans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => `${Math.round(v/12)}a`} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any, name: string) => [name === 'price' ? `${v}€` : fmt(v), name === 'value' ? 'Valeur' : name === 'invested' ? 'Investi' : 'Prix']}
                  contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="value" name="Valeur portefeuille" stroke="hsl(0 0% 98%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="invested" name="Capital investi" stroke="hsl(0 0% 45%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><CardTitle>Analyse DCA</CardTitle></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Gain total', value: fmtPct(r.gainPct), color: 'text-emerald-finance' },
              { label: 'vs Lump Sum', value: (r.vsLumpSum >= 0 ? '+' : '') + fmt(r.vsLumpSum), color: r.vsLumpSum >= 0 ? 'text-emerald-finance' : 'text-muted-foreground' },
              { label: 'Prix moyen d\'achat', value: fmt(r.avgCostBasis), color: 'text-foreground' },
            ].map((k, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={cn('text-lg font-semibold', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <Separator />
          {[
            { text: `Sur ${inputs.years} ans, le DCA vous permet d'acheter plus de parts quand les prix baissent et moins quand ils montent, réduisant votre prix moyen de revient à ${fmt(r.avgCostBasis)} par part.` },
            { text: r.vsLumpSum >= 0 ? `Avec une volatilité de ${inputs.volatility}%, le DCA surperforme l'achat unique de ${fmt(r.vsLumpSum)} grâce au lissage des prix.` : `Avec une faible volatilité (${inputs.volatility}%), l'achat unique surperforme de ${fmt(Math.abs(r.vsLumpSum))} — logique car les prix montent régulièrement.` },
            { text: 'Le DCA est surtout une stratégie psychologique : il élimine le stress du timing de marché et favorise la discipline sur le long terme.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 rounded-md border border-border p-3">
              <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
export default function DCAPage() { return <Suspense><DCAPageInner /></Suspense> }
