'use client'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

export default function MortgagePage() {
  const [inputs, setInputs] = useState<MortgageInputs>({ amount: 240000, rate: 3.5, years: 20, insurance: 50, fees: 1000 })
  const set = (k: keyof MortgageInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const results = useMemo(() => calcMortgage(inputs), [inputs])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="finance-card p-3 text-xs font-mono shadow-xl">
        <p className="text-muted-foreground mb-1">Année {label}</p>
        <p className="text-emerald-finance">Remboursé: {fmt(payload[0]?.value)}</p>
        <p className="text-crimson-finance">Restant: {fmt(payload[1]?.value)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Simulateur de Prêt</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Mensualités · TAEG · Tableau d&apos;amortissement</p>
        </div>
        <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} — ${inputs.rate}% — ${inputs.years}ans`} inputs={inputs as any} results={results as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Montant emprunté (€)</Label><Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)} /></div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Taux nominal annuel</Label><span className="font-mono text-sm text-gold">{inputs.rate}%</span></div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><Label>Durée</Label><span className="font-mono text-sm text-gold">{inputs.years} ans</span></div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
            </div>
            <div className="space-y-2"><Label>Assurance mensuelle (€)</Label><Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} /></div>
            <div className="space-y-2"><Label>Frais de dossier (€)</Label><Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="stat-label mb-2">Mensualité</p>
              <p className="font-display text-4xl font-bold text-gold">{fmt(results.monthlyPayment)}</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">+ {fmt(inputs.insurance)} assurance = {fmt(results.totalMonthly)} / mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <StatRow label="Coût total du crédit" value={fmt(results.totalCost)} highlight="red" />
              <StatRow label="Total intérêts" value={fmt(results.totalInterest)} highlight="red" />
              <StatRow label="Total assurance" value={fmt(results.totalInsurance)} highlight="red" />
              <StatRow label="TAEG estimé" value={fmtPct(results.taeg)} />
              <StatRow label="Intérêts / Capital" value={fmtPct(results.ratio)} />
              <StatRow label="Coût total remboursé" value={fmt(inputs.amount + results.totalCost)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Tableau d&apos;amortissement</CardTitle><CardDescription>// Évolution capital remboursé vs restant dû</CardDescription></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={results.chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => `${v}a`} />
              <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 10, fill: '#6b7580' }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k€` : `${v}€`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Area type="monotone" dataKey="capitalRepaid" name="Capital remboursé" stroke="#2dd4a0" fill="rgba(45,212,160,0.1)" strokeWidth={2} />
              <Area type="monotone" dataKey="remaining" name="Capital restant" stroke="#e85d75" fill="rgba(232,93,117,0.05)" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
