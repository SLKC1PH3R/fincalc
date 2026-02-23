'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { TrendingUp, ArrowUpRight, HelpCircle, FileDown, CheckCircle, Info, AlertTriangle } from 'lucide-react'
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

const StatRow = ({ label, value, highlight, help }: { label: string; value: string; highlight?: 'green' | 'red'; help?: string }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground flex items-center">{label}{help && <HelpTip text={help} />}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function CompoundPage() {
  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const results = useMemo(() => calcCompound(inputs), [inputs])

  // Analyse
  const multiplier = results.multiplier
  const interestRatio = results.interest / results.final * 100
  const score = multiplier >= 5 ? 'excellent' : multiplier >= 3 ? 'bon' : multiplier >= 2 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { color: 'text-emerald-finance', bg: 'border-emerald-finance/30 bg-emerald-finance/5', label: 'Excellent', Icon: CheckCircle },
    bon: { color: 'text-blue-400', bg: 'border-blue-400/30 bg-blue-400/5', label: 'Bon', Icon: TrendingUp },
    moyen: { color: 'text-amber-400', bg: 'border-amber-400/30 bg-amber-400/5', label: 'Moyen', Icon: Info },
    faible: { color: 'text-crimson-finance', bg: 'border-crimson-finance/30 bg-crimson-finance/5', label: 'Faible', Icon: AlertTriangle },
  }[score]

  const tips = []
  if (inputs.rate < 5) tips.push('Un taux de 5-8% est atteignable via des ETF World diversifiés (ex: MSCI World) sur le long terme.')
  if (inputs.monthly < 300) tips.push(`Augmenter vos versements mensuels de 100€ rapporterait environ ${fmt(calcCompound({...inputs, monthly: inputs.monthly + 100}).final - results.final)} de plus à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20-30 ans. Chaque année supplémentaire compte double.')
  if (inputs.capital < 5000) tips.push('Un capital initial plus élevé améliore significativement la base de départ — cherchez à constituer une épargne de précaution d\'abord.')
  if (tips.length === 0) tips.push('Votre stratégie d\'épargne est bien paramétrée. Maintenez la régularité et évitez de retirer avant terme.')

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="finance-card p-3 text-xs font-mono shadow-xl">
        <p className="text-muted-foreground mb-1">Année {label}</p>
        <p className="text-gold">Total: {fmt(payload[0]?.value)}</p>
        <p className="text-emerald-finance">Investi: {fmt(payload[1]?.value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <style>{`@media print { aside, nav, button, .no-print { display: none !important; } body { background: white !important; } main { margin-left: 0 !important; } }`}</style>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Intérêts Composés</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// La 8ème merveille du monde — Albert Einstein</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2"><FileDown className="h-3.5 w-3.5" /> PDF</Button>
          <SaveSimulation type="compound" name={`Intérêts — ${inputs.capital.toLocaleString('fr')}€ × ${inputs.years}ans @ ${inputs.rate}%`} inputs={inputs as any} results={results as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Ajustez les valeurs</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center">Capital initial<HelpTip text="Montant que vous placez dès le départ. Plus il est élevé, plus la base de croissance est forte. Peut être 0 si vous démarrez de zéro." /></Label>
              <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Versement mensuel<HelpTip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant mensuel produit des effets spectaculaires sur 20+ ans." /></Label>
              <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">Taux annuel<HelpTip text="Rendement annuel moyen attendu. Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique. Plus le taux est élevé, plus le risque l'est aussi." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
              <div className="flex gap-2 font-mono text-[10px] text-muted-foreground">
                <span className="cursor-pointer hover:text-gold" onClick={() => set('rate')(3)}>Livret A 3%</span> ·
                <span className="cursor-pointer hover:text-gold" onClick={() => set('rate')(4)}>Fonds € 4%</span> ·
                <span className="cursor-pointer hover:text-gold" onClick={() => set('rate')(8)}>ETF ~8%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">Durée<HelpTip text="Plus la durée est longue, plus l'effet boule de neige des intérêts composés est puissant. 30 ans peut multiplier votre capital par 7 à 10." /></Label>
                <span className="font-mono text-sm text-gold">{inputs.years} ans</span>
              </div>
              <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">Capitalisation<HelpTip text="Fréquence à laquelle les intérêts sont réinvestis. Mensuelle (12x/an) est la plus courante et légèrement plus favorable qu'annuelle." /></Label>
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

        <div className="space-y-4">
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label mb-2">Capital Final</p>
                  <p className="font-display text-4xl font-bold text-emerald-finance">{fmt(results.final)}</p>
                </div>
                <div className="p-2 border border-emerald-finance/30 bg-emerald-finance/5">
                  <ArrowUpRight className="h-5 w-5 text-emerald-finance" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <StatRow label="Capital investi" value={fmt(results.invested)} help="Total des versements que vous avez effectivement mis de votre poche (capital initial + mensualités × mois)." />
              <StatRow label="Intérêts générés" value={fmt(results.interest)} highlight="green" help="Gain pur des intérêts composés — ce que l'argent a rapporté sans que vous l'ayez mis de votre poche." />
              <StatRow label="Part des intérêts" value={fmtPct(interestRatio)} highlight="green" help="Pourcentage du capital final qui vient des intérêts (et non de vos versements). Plus c'est élevé, plus l'effet composé est fort." />
              <StatRow label="Rendement total" value={fmtPct(results.roi)} highlight="green" />
              <StatRow label="Multiplication du capital" value={`×${results.multiplier.toFixed(1)}`} help="Votre capital initial multiplié par ce chiffre. ×3 = votre argent a triplé." />
              <StatRow label="Gain mensuel estimé" value={fmt(results.interest / (inputs.years * 12))} help="Si les intérêts étaient étalés sur toute la durée, ce serait votre gain mensuel moyen." />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Évolution du capital</CardTitle><CardDescription>// Croissance sur {inputs.years} ans</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={results.chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => `${v}a`} />
              <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M€` : `${Math.round(v/1000)}k€`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Line type="monotone" dataKey="total" name="Capital total" stroke="#c9a84c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="invested" name="Capital investi" stroke="#2dd4a0" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Synthèse */}
      <Card className={cn('border', scoreConf.bg)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-5 w-5', scoreConf.color)} />
            Synthèse — Stratégie {scoreConf.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Multiplication', value: `×${results.multiplier.toFixed(1)}`, color: scoreConf.color },
              { label: 'Part intérêts', value: fmtPct(interestRatio), color: 'text-emerald-finance' },
              { label: 'Gain / mois moyen', value: fmt(results.interest / (inputs.years * 12)), color: 'text-foreground' },
              { label: 'Effort mensuel', value: fmt(inputs.monthly), color: 'text-foreground' },
            ].map((k, i) => (
              <div key={i} className="finance-card p-4 text-center">
                <p className="stat-label mb-1">{k.label}</p>
                <p className={cn('font-display text-xl font-bold', k.color)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className={cn('p-4 border', scoreConf.bg)}>
            <p className="font-mono text-sm text-foreground leading-relaxed">
              {score === 'excellent' && `Stratégie excellente : votre capital sera multiplié par ${results.multiplier.toFixed(1)} en ${inputs.years} ans. Les intérêts représentent ${Math.round(interestRatio)}% du capital final — l'effet boule de neige fonctionne pleinement.`}
              {score === 'bon' && `Bonne stratégie avec un capital multiplié par ${results.multiplier.toFixed(1)}. Augmentez la durée ou le taux pour atteindre le niveau excellent.`}
              {score === 'moyen' && `Stratégie correcte mais perfectible. Allonger la durée ou augmenter le taux de rendement aurait un impact significatif.`}
              {score === 'faible' && `La durée ou le taux sont trop faibles pour profiter pleinement de l'effet composé. Visez au minimum 15 ans avec un taux > 5%.`}
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
