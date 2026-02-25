'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcTax, type TaxInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { printReport } from '@/lib/print'
import { Separator } from '@/components/ui/separator'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle
        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

function KpiCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

const SCORE = {
  excellent: { label: 'Faible', icon: CheckCircle2, color: 'text-emerald-finance' },
  bon: { label: 'Modéré', icon: TrendingUp, color: 'text-blue-400' },
  moyen: { label: 'Significatif', icon: Minus, color: 'text-amber-400' },
  eleve: { label: 'Élevé', icon: AlertCircle, color: 'text-crimson-finance' },
}

function TaxPageInner() {
  const [inputs, setInputs] = useState<TaxInputs>({
    gross: 60000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false
  })
  const set = (k: keyof TaxInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Restore simulation from history
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try { setInputs(JSON.parse(restoreParam) as TaxInputs) } catch {}
  }, [restoreParam])
  const r = useMemo(() => calcTax(inputs), [inputs])
  const score = SCORE[r.analysis.score]

  const pieData = [
    { name: 'Net perçu', value: Math.round(r.netIncome), fill: 'hsl(160 84% 39%)' },
    { name: 'Cotisations', value: Math.round(r.cotisations), fill: 'hsl(0 72% 51%)' },
    { name: 'IR', value: Math.round(r.ir), fill: 'hsl(38 92% 50%)' },
  ]

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">


      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Impôts sur le Revenu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Barème IR France 2024 — Abattement 10% inclus</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Impôts sur le Revenu',
            subtitle: `Barème IR France 2024 · Revenu brut ${fmt(inputs.gross)}`,
            kpis: [
              { label: 'Net après tout', value: fmt(r.netIncome), highlight: true, sub: `${fmt(r.netIncome / 12)}/mois` },
              { label: 'Impôt sur le revenu', value: fmt(r.ir), sub: `Taux moyen ${fmtPct(r.avgRate)}` },
              { label: 'Cotisations sociales', value: fmt(r.cotisations), sub: `${inputs.csRate}% du brut` },
              { label: 'Pression fiscale', value: fmtPct(r.effectivePressure), sub: `TMI : ${r.tmi}%` },
            ],
            inputs: [
              { label: 'Revenu brut annuel', value: fmt(inputs.gross) },
              { label: 'Parts fiscales', value: String(inputs.parts) },
              { label: 'Cotisations sociales', value: `${inputs.csRate}%` },
              { label: 'Revenu imposable', value: fmt(r.imposable) },
              { label: 'Abattement', value: fmt(r.abattement) },
              { label: 'TMI', value: `${r.tmi}%` },
            ],
            tips: r.analysis.tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="tax" name={`Impôts ${fmt(inputs.gross)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Net après tout" value={fmt(r.netIncome)} sub={`${fmt(r.netIncome / 12)} / mois`} />
        <KpiCard label="Impôt sur le revenu" value={fmt(r.ir)} sub={`Taux moyen ${fmtPct(r.avgRate)}`} />
        <KpiCard label="Cotisations sociales" value={fmt(r.cotisations)} sub={`${inputs.csRate}% du brut`} />
        <KpiCard label="Pression fiscale" value={fmtPct(r.effectivePressure)} sub={`TMI : ${r.tmi}%`} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Params - 1 col */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Votre situation fiscale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Revenu brut annuel
                <Tip text="Salaire brut annuel avant toute déduction. Visible sur votre fiche de paie ou avis d'imposition." />
              </Label>
              <Input type="number" value={inputs.gross} onChange={e => set('gross')(+e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Situation familiale
                <Tip text="Le quotient familial divise votre revenu par le nombre de parts, réduisant l'impôt. Chaque enfant ajoute 0.5 part." />
              </Label>
              <Select value={String(inputs.parts)} onValueChange={v => set('parts')(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Célibataire (1 part)</SelectItem>
                  <SelectItem value="1.5">Célibataire + 1 enfant</SelectItem>
                  <SelectItem value="2">Couple sans enfant</SelectItem>
                  <SelectItem value="2.5">Couple + 1 enfant</SelectItem>
                  <SelectItem value="3">Couple + 2 enfants</SelectItem>
                  <SelectItem value="4">Couple + 3 enfants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1">
                  Cotisations sociales
                  <Tip text="~22% salarié privé, ~10% fonctionnaire. Vérifiez votre bulletin de salaire." />
                </Label>
                <span className="text-sm font-medium">{inputs.csRate}%</span>
              </div>
              <Slider min={0} max={25} step={0.5} value={[inputs.csRate]} onValueChange={([v]) => set('csRate')(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <button className="hover:text-foreground transition-colors" onClick={() => set('csRate')(10)}>Fonctionnaire 10%</button>
                <button className="hover:text-foreground transition-colors" onClick={() => set('csRate')(22)}>Salarié 22%</button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2.5">
              <Label className="flex items-center gap-1">
                Abattement
                <Tip text="Forfait 10% : automatique (495€ min, 14 171€ max). Frais réels : si vos frais professionnels dépassent ce forfait." />
              </Label>
              <div className="flex rounded-md overflow-hidden border border-input">
                <button
                  onClick={() => set('useFraisReels')(false)}
                  className={cn('flex-1 py-1.5 text-xs font-medium transition-colors',
                    !inputs.useFraisReels ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >Forfait 10%</button>
                <button
                  onClick={() => set('useFraisReels')(true)}
                  className={cn('flex-1 py-1.5 text-xs font-medium transition-colors border-l border-input',
                    inputs.useFraisReels ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >Frais réels</button>
              </div>
              {inputs.useFraisReels ? (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Montant frais réels (€)</Label>
                  <Input type="number" value={inputs.fraisReels} onChange={e => set('fraisReels')(+e.target.value)} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Abattement appliqué : <span className="text-foreground font-medium">{fmt(r.abattement)}</span>
                  {r.abattement === 14171 && <span className="text-amber-400 ml-1">(plafonné)</span>}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Détail calcul - 1 col */}
        <Card>
          <CardHeader>
            <CardTitle>Détail du calcul</CardTitle>
            <CardDescription>Décomposition étape par étape</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[
                { label: 'Revenu brut', value: fmt(inputs.gross), help: 'Point de départ' },
                { label: `Cotisations (${inputs.csRate}%)`, value: `− ${fmt(r.cotisations)}`, variant: 'red', help: 'Charges salariales' },
                { label: 'Net avant impôt', value: fmt(r.netBeforeTax), bold: true },
                { label: inputs.useFraisReels ? 'Frais réels' : 'Abattement 10%', value: `− ${fmt(r.abattement)}`, variant: 'green', help: 'Déduction professionnelle' },
                { label: 'Revenu imposable', value: fmt(r.imposable), bold: true },
                { label: `IR (${r.tmi}% TMI)`, value: `− ${fmt(r.ir)}`, variant: 'red', help: 'Barème progressif 2024' },
                { label: 'Revenu net', value: fmt(r.netIncome), bold: true, big: true },
              ].map((row, i) => (
                <div key={i} className={cn(
                  'flex items-center justify-between py-2.5',
                  i < 6 && 'border-b border-border'
                )}>
                  <span className={cn('text-sm', row.bold ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                    {row.label}
                    {row.help && <Tip text={row.help} />}
                  </span>
                  <span className={cn(
                    'font-medium tabular-nums',
                    row.big ? 'text-base text-emerald-finance' : 'text-sm',
                    row.variant === 'red' && 'text-crimson-finance',
                    row.variant === 'green' && 'text-emerald-finance',
                  )}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Camembert - 1 col */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition</CardTitle>
            <CardDescription>Où va chaque euro gagné</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: 12, color: '#fff' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {pieData.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full inline-block flex-shrink-0" style={{ background: e.fill }} />
                    <span className="text-muted-foreground">{e.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{fmt(e.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tranches */}
      <Card>
        <CardHeader>
          <CardTitle>Tranches d&apos;imposition 2024</CardTitle>
          <CardDescription>Barème progressif — votre tranche active est mise en évidence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tranche</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Taux</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Base taxable</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">IR dû</th>
                </tr>
              </thead>
              <tbody>
                {r.brackets.map((b, i) => (
                  <tr key={i} className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    b.active ? 'bg-foreground/5' : 'hover:bg-muted/30'
                  )}>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{b.label}</td>
                    <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums', b.active ? 'text-foreground' : 'text-muted-foreground')}>{b.rate}%</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">{fmt(b.taxable)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-medium tabular-nums', b.active && 'text-foreground')}>{fmt(b.ir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Synthèse */}
      <Card style={{ borderColor: r.analysis.score === 'excellent' || r.analysis.score === 'bon' ? 'rgba(52,211,153,0.35)' : r.analysis.score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <score.icon className={cn('h-4 w-4', score.color)} />
            <CardTitle>Analyse — Pression fiscale {score.label}</CardTitle>
          </div>
          <CardDescription>Diagnostic et pistes d&apos;optimisation personnalisées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Barre visuelle */}
          <div className="space-y-1.5">
            <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
              <div className="bg-emerald-finance transition-all duration-500" style={{ width: `${r.netIncome / inputs.gross * 100}%` }} />
              <div className="bg-crimson-finance transition-all duration-500" style={{ width: `${r.cotisations / inputs.gross * 100}%` }} />
              <div className="bg-amber-400 transition-all duration-500" style={{ width: `${r.ir / inputs.gross * 100}%` }} />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-finance" />Net {Math.round(r.netIncome / inputs.gross * 100)}%</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-crimson-finance" />CS {Math.round(r.cotisations / inputs.gross * 100)}%</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />IR {Math.round(r.ir / inputs.gross * 100)}%</span>
            </div>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground leading-relaxed">{r.analysis.message}</p>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pistes d&apos;optimisation</p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TaxPage() {
  return <Suspense><TaxPageInner /></Suspense>
}
