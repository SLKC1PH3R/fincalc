'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function CompoundPage() {
  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const results = useMemo(() => calcCompound(inputs), [inputs])

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Intérêts Composés</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// La 8ème merveille du monde — Albert Einstein</p>
        </div>
        <SaveSimulation type="compound" name={`Intérêts — ${inputs.capital.toLocaleString('fr')}€ × ${inputs.years}ans @ ${inputs.rate}%`} inputs={inputs as any} results={results as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Ajustez les valeurs</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="capital">Capital initial</Label>
              <Input id="capital" type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly">Versement mensuel</Label>
              <Input id="monthly" type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Taux annuel</Label>
                <span className="font-mono text-sm text-gold">{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Durée</Label>
                <span className="font-mono text-sm text-gold">{inputs.years} ans</span>
              </div>
              <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2">
              <Label>Capitalisation</Label>
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

        {/* Results */}
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
              <StatRow label="Capital investi" value={fmt(results.invested)} />
              <StatRow label="Intérêts générés" value={fmt(results.interest)} highlight="green" />
              <StatRow label="Rendement total" value={fmtPct(results.roi)} highlight="green" />
              <StatRow label="Multiplication" value={`×${results.multiplier.toFixed(1)}`} />
              <StatRow label="Gain mensuel estimé" value={fmt(results.interest / (inputs.years * 12))} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart */}
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
    </div>
  )
}
