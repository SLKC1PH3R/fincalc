'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcFire, type FireInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Flame } from 'lucide-react'

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function FirePage() {
  const [inputs, setInputs] = useState<FireInputs>({ income: 50000, expenses: 30000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const set = (k: keyof FireInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const results = useMemo(() => calcFire(inputs), [inputs])

  const pct = Math.round(results.progressPct)
  const yearsLabel = results.yearsToFire >= 100 ? '> 100 ans' : `${results.yearsToFire} ans`

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Calculateur FI/RE</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Financial Independence / Retire Early</p>
        </div>
        <SaveSimulation type="fire" name={`FIRE — Objectif ${Math.round(results.target / 1000)}k€`} inputs={inputs as any} results={results as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Votre situation financière</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Revenus annuels nets (€)</Label>
              <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dépenses annuelles (€)</Label>
              <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Patrimoine actuel (€)</Label>
              <Input type="number" value={inputs.netWorth} onChange={e => set('netWorth')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Rendement attendu</Label>
                <span className="font-mono text-sm text-gold">{inputs.rate}%</span>
              </div>
              <Slider min={1} max={15} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-2">
              <Label>Taux de retrait sécurisé</Label>
              <Select value={String(inputs.withdrawalRate)} onValueChange={v => set('withdrawalRate')(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3% — Très conservateur</SelectItem>
                  <SelectItem value="3.5">3.5% — Conservateur</SelectItem>
                  <SelectItem value="4">4% — Règle standard</SelectItem>
                  <SelectItem value="4.5">4.5% — Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Progress gauge */}
          <Card className="border-gold/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="stat-label">Progression vers FIRE</p>
                <Flame className={`h-4 w-4 ${pct >= 50 ? 'text-gold animate-pulse-gold' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-center py-4">
                <span className="font-display text-6xl font-black text-gold">{pct}</span>
                <span className="font-display text-3xl font-bold text-gold">%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-finance to-gold transition-all duration-700 ease-out rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between font-mono text-xs text-muted-foreground mt-2">
                <span>{fmt(inputs.netWorth)}</span>
                <span>{fmt(results.target)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <StatRow label="Objectif FIRE" value={fmt(results.target)} />
              <StatRow label="Années avant FIRE" value={yearsLabel} />
              <StatRow label="Épargne annuelle" value={fmt(results.annualSavings)} highlight={results.annualSavings > 0 ? 'green' : 'red'} />
              <StatRow label="Taux d'épargne" value={fmtPct(results.savingsRate)} />
              <StatRow label="Revenu passif cible/mois" value={fmt(results.monthlyPassive)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
