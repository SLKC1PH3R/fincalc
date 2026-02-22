'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcTax, type TaxInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function TaxPage() {
  const [inputs, setInputs] = useState<TaxInputs>({ gross: 60000, parts: 1, csRate: 22 })
  const set = (k: keyof TaxInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const results = useMemo(() => calcTax(inputs), [inputs])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Calculateur d&apos;Impôts</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Barème IR France 2024 — Progressif par tranches</p>
        </div>
        <SaveSimulation type="tax" name={`Impôts — ${fmt(inputs.gross)} brut`} inputs={inputs as any} results={results as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Votre situation fiscale</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Revenu brut annuel (€)</Label>
              <Input type="number" value={inputs.gross} onChange={e => set('gross')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Situation familiale</Label>
              <Select value={String(inputs.parts)} onValueChange={v => set('parts')(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Célibataire (1 part)</SelectItem>
                  <SelectItem value="1.5">Célibataire + 1 enfant (1.5 parts)</SelectItem>
                  <SelectItem value="2">Couple sans enfant (2 parts)</SelectItem>
                  <SelectItem value="2.5">Couple + 1 enfant (2.5 parts)</SelectItem>
                  <SelectItem value="3">Couple + 2 enfants (3 parts)</SelectItem>
                  <SelectItem value="4">Couple + 3 enfants (4 parts)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Cotisations sociales</Label>
                <span className="font-mono text-sm text-gold">{inputs.csRate}%</span>
              </div>
              <Slider min={0} max={25} step={0.5} value={[inputs.csRate]} onValueChange={([v]) => set('csRate')(v)} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-emerald-finance/20">
            <CardContent className="pt-6">
              <p className="stat-label mb-2">Revenu Net après tout</p>
              <p className="font-display text-4xl font-bold text-emerald-finance">{fmt(results.netIncome)}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">{fmt(results.netIncome / 12)} / mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <StatRow label="Revenu imposable" value={fmt(results.imposable)} />
              <StatRow label="Impôt sur le revenu" value={fmt(results.ir)} highlight="red" />
              <StatRow label="Cotisations sociales" value={fmt(results.cotisations)} highlight="red" />
              <StatRow label="Prélèvements totaux" value={fmt(results.totalLevy)} highlight="red" />
              <StatRow label="Taux moyen IR" value={fmtPct(results.avgRate)} />
              <StatRow label="Taux marginal (TMI)" value={`${results.tmi}%`} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tax brackets */}
      <Card>
        <CardHeader><CardTitle>Tranches d&apos;imposition</CardTitle><CardDescription>// Barème progressif 2024 — votre tranche active est mise en évidence</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-3 gap-4 py-2 border-b border-border font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              <span>Tranche</span><span>Taux</span><span>Impôt</span>
            </div>
            {results.brackets.map((b, i) => (
              <div key={i} className={cn(
                'grid grid-cols-3 gap-4 py-3 border-b border-border/50 font-mono text-xs last:border-0 transition-colors',
                b.active ? 'bg-gold/5 text-gold border-l-2 border-gold pl-3' : 'text-foreground'
              )}>
                <span>{b.label}</span>
                <span className={b.active ? 'text-gold font-semibold' : 'text-muted-foreground'}>{b.rate}%</span>
                <span className={b.active ? 'text-gold font-semibold' : ''}>{fmt(b.ir)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
