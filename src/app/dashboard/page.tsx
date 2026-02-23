'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useRestoreSimulation } from '@/lib/useRestoreSimulation'
import { useSearchParams } from 'next/navigation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
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

function CompoundPageInner() {
  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Restore simulation from history
  const searchParams = useSearchParams()
  useEffect(() => {
    const raw = searchParams.get('restore')
    if (!raw) return
    try { setInputs(JSON.parse(raw) as CompoundInputs) } catch {}
  }, [])
  const r = useMemo(() => calcCompound(inputs), [inputs])

  const score = r.multiplier >= 5 ? 'excellent' : r.multiplier >= 3 ? 'bon' : r.multiplier >= 2 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon: { label: 'Bon', Icon: TrendingUp, color: 'text-blue-400' },
    moyen: { label: 'Moyen', Icon: Minus, color: 'text-amber-400' },
    faible: { label: 'Faible', Icon: AlertCircle, color: 'text-crimson-finance' },
  }[score]

  const tips = []
  if (inputs.rate < 5) tips.push('Un rendement de 5-8%/an est atteignable via des ETF World diversifiés sur le long terme.')
  if (inputs.monthly < 300) tips.push(`+100€/mois supplémentaires = +${fmt(calcCompound({...inputs, monthly: inputs.monthly + 100}).final - r.final)} à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20-30 ans. Chaque année compte double.')
  if (tips.length === 0) tips.push('Stratégie solide. Maintenez la régularité et évitez de retirer avant terme.')

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, [data-noprint] { display: none !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Intérêts Composés</h1>
          <p className="text-sm text-muted-foreground mt-0.5">La 8ème merveille du monde — Albert Einstein</p>
        </div>
        <div className="flex gap-2" data-noprint>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="compound" name={`Composés ${inputs.capital.toLocaleString('fr')}€ × ${inputs.years}a`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Capital final', value: fmt(r.final) },
          { label: 'Capital investi', value: fmt(r.invested) },
          { label: 'Intérêts générés', value: fmt(r.interest) },
          { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}` },
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
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>Ajustez les valeurs</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Capital initial<Tip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." /></Label>
              <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Versement mensuel<Tip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant produit des effets spectaculaires sur 20+ ans." /></Label>
              <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Taux annuel<Tip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." /></Label>
                <span className="text-sm font-medium">{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => set('rate')(3)}>Livret A 3%</button>
                <button className="hover:text-foreground" onClick={() => set('rate')(4)}>Fonds € 4%</button>
                <button className="hover:text-foreground" onClick={() => set('rate')(8)}>ETF ~8%</button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">Durée<Tip text="Plus la durée est longue, plus l'effet boule de neige est puissant. 30 ans peut multiplier votre capital par 7 à 10." /></Label>
                <span className="text-sm font-medium">{inputs.years} ans</span>
              </div>
              <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Capitalisation<Tip text="Fréquence de réinvestissement des intérêts. Mensuelle est la plus courante." /></Label>
              <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">Mensuelle</SelectItem>
                  <SelectItem value="4">Trimestrielle</SelectItem>
                  <SelectItem value="1">Annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution du capital sur {inputs.years} ans</CardTitle>
            <CardDescription>Capital total vs capital effectivement investi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14.9%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0 0% 63.9%)' }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'hsl(0 0% 3.9%)', border: '1px solid hsl(0 0% 14.9%)', borderRadius: '6px', fontSize: 12 }} />
                <Line type="monotone" dataKey="total" name="Capital total" stroke="hsl(0 0% 98%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="invested" name="Investi" stroke="hsl(0 0% 40%)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Synthèse */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — Stratégie {scoreConf.label}</CardTitle>
          </div>
          <CardDescription>Sur {inputs.years} ans à {inputs.rate}% · {fmt(inputs.monthly)}/mois</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}`, color: scoreConf.color },
              { label: 'Part des intérêts', value: fmtPct(r.interest / r.final * 100), color: 'text-emerald-finance' },
              { label: 'Gain / mois moyen', value: fmt(r.interest / (inputs.years * 12)), color: 'text-foreground' },
              { label: 'ROI total', value: fmtPct(r.roi), color: 'text-foreground' },
            ].map((k, i) => (
              <div key={i} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={cn('text-lg font-semibold tracking-tight', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <Separator />
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

export default function CompoundPage() {
  return <Suspense><CompoundPageInner /></Suspense>
}
