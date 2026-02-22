'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Home, Building2, TrendingUp, TrendingDown } from 'lucide-react'

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function BuyRentPage() {
  const [inputs, setInputs] = useState<BuyRentInputs>({ price: 300000, down: 60000, loanRate: 3.5, rent: 1200, years: 10, appreciation: 2, investReturn: 7 })
  const set = (k: keyof BuyRentInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const results = useMemo(() => calcBuyRent(inputs), [inputs])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Acheter vs Louer</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Analyse patrimoniale comparative sur {inputs.years} ans</p>
        </div>
        <SaveSimulation type="buyrent" name={`Achat vs Loyer — ${inputs.years}ans — ${fmt(inputs.price)}`} inputs={inputs as any} results={results as any} />
      </div>

      {/* Verdict banner */}
      <div className={cn('p-4 border flex items-center justify-between', results.buyWins ? 'border-emerald-finance/30 bg-emerald-finance/5' : 'border-crimson-finance/30 bg-crimson-finance/5')}>
        <div className="flex items-center gap-3">
          {results.buyWins ? <TrendingUp className="h-5 w-5 text-emerald-finance" /> : <TrendingDown className="h-5 w-5 text-crimson-finance" />}
          <div>
            <p className="font-mono text-xs text-muted-foreground">Verdict sur {inputs.years} ans</p>
            <p className={cn('font-display text-lg font-bold', results.buyWins ? 'text-emerald-finance' : 'text-crimson-finance')}>
              {results.buyWins ? '🏠 Acheter est plus avantageux' : '🏢 Louer est plus avantageux'}
              <span className="font-mono text-sm ml-2">(+{fmt(results.delta)})</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label>Prix d&apos;achat (€)</Label><Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} /></div>
            <div className="space-y-2"><Label>Apport personnel (€)</Label><Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)} /></div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Taux du prêt</Label><span className="font-mono text-sm text-gold">{inputs.loanRate}%</span></div>
              <Slider min={1} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
            </div>
            <div className="space-y-2"><Label>Loyer mensuel (€)</Label><Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} /></div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Durée d&apos;analyse</Label><span className="font-mono text-sm text-gold">{inputs.years} ans</span></div>
              <Slider min={1} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Hausse immobilière/an</Label><span className="font-mono text-sm text-gold">{inputs.appreciation}%</span></div>
              <Slider min={-2} max={8} step={0.1} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Rendement investissement alternatif</Label><span className="font-mono text-sm text-gold">{inputs.investReturn}%</span></div>
              <Slider min={1} max={12} step={0.1} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className={cn(results.buyWins ? 'border-emerald-finance/40' : 'border-border')}>
              <CardContent className="pt-6 text-center">
                <Home className={cn('h-6 w-6 mx-auto mb-2', results.buyWins ? 'text-emerald-finance' : 'text-muted-foreground')} />
                <p className="stat-label mb-1">Acheter</p>
                <p className={cn('font-display text-2xl font-bold', results.buyWins ? 'text-emerald-finance' : 'text-foreground')}>{fmt(results.buyNetWorth)}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">patrimoine net</p>
              </CardContent>
            </Card>
            <Card className={cn(!results.buyWins ? 'border-emerald-finance/40' : 'border-border')}>
              <CardContent className="pt-6 text-center">
                <Building2 className={cn('h-6 w-6 mx-auto mb-2', !results.buyWins ? 'text-emerald-finance' : 'text-muted-foreground')} />
                <p className="stat-label mb-1">Louer</p>
                <p className={cn('font-display text-2xl font-bold', !results.buyWins ? 'text-emerald-finance' : 'text-foreground')}>{fmt(results.rentCapital)}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">capital investi</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <StatRow label="Coût total achat" value={fmt(results.totalBuyCost)} highlight="red" />
              <StatRow label="Coût total loyer" value={fmt(results.totalRentCost)} highlight="red" />
              <StatRow label="Valeur du bien en fin" value={fmt(results.propertyValue)} highlight="green" />
              <StatRow label="Seuil de rentabilité" value={results.breakevenYears < 40 ? `${results.breakevenYears} ans` : '> 40 ans'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
