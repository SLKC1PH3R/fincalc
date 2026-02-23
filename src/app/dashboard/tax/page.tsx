'use client'
import { useState, useMemo, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcTax, type TaxInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, FileDown, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react'

// ─── Tooltip d'aide ──────────────────────────────────────────────────────────
function HelpTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <HelpCircle
        className="h-3.5 w-3.5 text-muted-foreground hover:text-gold cursor-pointer transition-colors inline-block"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(v => !v)}
      />
      {show && (
        <span className="absolute z-50 left-5 -top-1 w-64 bg-card border border-gold/30 text-xs font-mono text-foreground p-3 shadow-xl leading-relaxed">
          {text}
        </span>
      )}
    </span>
  )
}

const StatRow = ({ label, value, highlight, help }: { label: string; value: string; highlight?: 'green' | 'red'; help?: string }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
    <span className="font-mono text-xs text-muted-foreground flex items-center">
      {label}
      {help && <HelpTip text={help} />}
    </span>
    <span className={`font-mono text-xs font-semibold ${highlight === 'green' ? 'text-emerald-finance' : highlight === 'red' ? 'text-crimson-finance' : 'text-foreground'}`}>{value}</span>
  </div>
)

const SCORE_CONFIG = {
  excellent: { color: 'text-emerald-finance', bg: 'bg-emerald-finance/10 border-emerald-finance/30', Icon: CheckCircle, label: 'Excellent' },
  bon: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', Icon: TrendingUp, label: 'Bon' },
  moyen: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', Icon: Minus, label: 'Moyen' },
  eleve: { color: 'text-crimson-finance', bg: 'bg-crimson-finance/10 border-crimson-finance/30', Icon: AlertTriangle, label: 'Élevé' },
}

export default function TaxPage() {
  const [inputs, setInputs] = useState<TaxInputs>({
    gross: 60000, parts: 1, csRate: 22,
    regime: 'salarie', fraisReels: 0, useFraisReels: false
  })
  const set = (k: keyof TaxInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const printRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => calcTax(inputs), [inputs])

  const pieData = [
    { name: 'Net perçu', value: Math.round(results.netIncome), color: '#2dd4a0' },
    { name: 'Cotisations sociales', value: Math.round(results.cotisations), color: '#e85d75' },
    { name: 'Impôt sur le revenu', value: Math.round(results.ir), color: '#c9a84c' },
  ]

  const barData = results.brackets.map(b => ({
    name: b.label.replace(' — ', '\n').replace('> ', '>'),
    ir: Math.round(b.ir),
    taux: b.rate,
  }))

  const scoreConf = SCORE_CONFIG[results.analysis.score]

  const handlePDF = () => window.print()

  return (
    <div className="space-y-6 animate-fade-in" ref={printRef}>
      {/* Print styles */}
      <style>{`
        @media print {
          aside, nav, button, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .finance-card { border: 1px solid #ccc !important; background: white !important; }
          .text-gold { color: #8B6914 !important; }
          .text-emerald-finance { color: #1A7A5E !important; }
          .text-crimson-finance { color: #B91C3C !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-gold">Calculateur d&apos;Impôts</h2>
          <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Barème IR France 2024 — Abattement forfaitaire 10% inclus</p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handlePDF} className="gap-2">
            <FileDown className="h-3.5 w-3.5" /> Exporter PDF
          </Button>
          <SaveSimulation type="tax" name={`Impôts — ${fmt(inputs.gross)} brut`} inputs={inputs as any} results={results as any} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Inputs ── */}
        <Card>
          <CardHeader><CardTitle>Paramètres</CardTitle><CardDescription>// Votre situation fiscale</CardDescription></CardHeader>
          <CardContent className="space-y-5">

            <div className="space-y-2">
              <Label className="flex items-center">
                Revenu brut annuel (€)
                <HelpTip text="Votre salaire brut annuel avant toute déduction. Retrouvez-le sur votre fiche de paie (ligne 'Salaire brut') ou votre avis d'imposition." />
              </Label>
              <Input type="number" value={inputs.gross} onChange={e => set('gross')(+e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                Situation familiale
                <HelpTip text="Le quotient familial divise votre revenu imposable par le nombre de parts, réduisant l'impôt. Chaque enfant à charge ajoute 0.5 part (1 part à partir du 3ème)." />
              </Label>
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
                <Label className="flex items-center">
                  Cotisations sociales
                  <HelpTip text="Les cotisations salariales (maladie, retraite, chômage...) représentent ~22% pour un salarié du privé, ~10% pour un fonctionnaire. Vérifiez votre bulletin de salaire." />
                </Label>
                <span className="font-mono text-sm text-gold">{inputs.csRate}%</span>
              </div>
              <Slider min={0} max={25} step={0.5} value={[inputs.csRate]} onValueChange={([v]) => set('csRate')(v)} />
              <div className="flex gap-2 font-mono text-[10px] text-muted-foreground">
                <span className="cursor-pointer hover:text-gold" onClick={() => set('csRate')(10)}>Fonctionnaire ~10%</span>
                <span>·</span>
                <span className="cursor-pointer hover:text-gold" onClick={() => set('csRate')(22)}>Salarié privé ~22%</span>
              </div>
            </div>

            {/* Abattement */}
            <div className="space-y-3 border border-border/50 p-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  Mode d&apos;abattement
                  <HelpTip text="L'abattement réduit votre revenu imposable. Forfait 10% : automatique, plafonné à 14 171€. Frais réels : si vos frais professionnels réels dépassent ce forfait (transport, repas, formations...)." />
                </Label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => set('useFraisReels')(false)}
                  className={cn('flex-1 py-1.5 font-mono text-[10px] tracking-widest uppercase border transition-all',
                    !inputs.useFraisReels ? 'bg-gold border-gold text-primary-foreground' : 'border-border text-muted-foreground hover:border-gold'
                  )}
                >
                  Forfait 10%
                </button>
                <button
                  onClick={() => set('useFraisReels')(true)}
                  className={cn('flex-1 py-1.5 font-mono text-[10px] tracking-widest uppercase border transition-all',
                    inputs.useFraisReels ? 'bg-gold border-gold text-primary-foreground' : 'border-border text-muted-foreground hover:border-gold'
                  )}
                >
                  Frais réels
                </button>
              </div>
              {inputs.useFraisReels ? (
                <div className="space-y-2 animate-fade-in">
                  <Label className="flex items-center">
                    Montant des frais réels (€)
                    <HelpTip text="Frais professionnels réels déductibles : trajets domicile-travail, repas, vêtements de travail, formation, home office... Conservez tous vos justificatifs." />
                  </Label>
                  <Input type="number" value={inputs.fraisReels} onChange={e => set('fraisReels')(+e.target.value)} />
                  {inputs.fraisReels > 0 && inputs.fraisReels <= Math.min(Math.max(inputs.gross * inputs.csRate / 100, 0), 14171) * 0 + Math.min(Math.max((inputs.gross - inputs.gross * inputs.csRate / 100) * 0.1, 495), 14171) && (
                    <p className="font-mono text-[10px] text-amber-400">
                      ⚠ Le forfait 10% ({fmt(Math.min(Math.max((inputs.gross - inputs.gross * inputs.csRate / 100) * 0.1, 495), 14171))}) est plus avantageux dans votre cas.
                    </p>
                  )}
                </div>
              ) : (
                <p className="font-mono text-[10px] text-muted-foreground">
                  Abattement calculé : <span className="text-gold">{fmt(results.abattement)}</span>
                  {results.abattement === 14171 && <span className="text-amber-400 ml-1">(plafonné)</span>}
                  {results.abattement === 495 && <span className="text-amber-400 ml-1">(minimum légal)</span>}
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ─── Results ── */}
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
              <StatRow label="Revenu brut" value={fmt(inputs.gross)} help="Point de départ du calcul avant toute déduction." />
              <StatRow label="Cotisations sociales" value={`− ${fmt(results.cotisations)}`} highlight="red" help="Charges salariales prélevées sur le brut. Donnent droit aux prestations sociales (retraite, chômage, maladie)." />
              <StatRow label="Net avant impôt" value={fmt(results.netBeforeTax)} help="Brut moins cotisations sociales. C'est la base avant abattement fiscal." />
              <StatRow label={inputs.useFraisReels ? 'Abattement frais réels' : 'Abattement forfaitaire 10%'} value={`− ${fmt(results.abattement)}`} highlight="green" help="Déduction représentant vos frais professionnels. Réduit directement votre revenu imposable." />
              <StatRow label="Revenu imposable" value={fmt(results.imposable)} help="Base sur laquelle le barème progressif de l'IR est appliqué, divisée par le nombre de parts." />
              <StatRow label="Impôt sur le revenu" value={`− ${fmt(results.ir)}`} highlight="red" help="IR calculé selon le barème progressif 2024 par tranches, appliqué sur votre quotient familial." />
              <StatRow label="Prélèvements totaux" value={fmt(results.totalLevy)} highlight="red" help="Cotisations + IR. Représente l'ensemble des prélèvements obligatoires." />
              <StatRow label="Taux moyen IR" value={fmtPct(results.avgRate)} help="IR total divisé par le revenu brut. Différent du TMI — c'est votre taux réel d'imposition." />
              <StatRow label="Taux marginal (TMI)" value={`${results.tmi}%`} help="Taux de la dernière tranche atteinte. Chaque euro supplémentaire gagné sera imposé à ce taux." />
              <StatRow label="Pression fiscale globale" value={fmtPct(results.effectivePressure)} help="(Cotisations + IR) / Revenu brut. Indicateur global de la charge fiscale et sociale." />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Graphiques ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Répartition du revenu brut</CardTitle><CardDescription>// Où va chaque euro gagné</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'hsl(210 12% 8%)', border: '1px solid hsl(210 10% 15%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Impôt par tranche</CardTitle><CardDescription>// Barème progressif 2024</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#6b7580' }} />
                <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#6b7580' }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'hsl(210 12% 8%)', border: '1px solid hsl(210 10% 15%)', fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Bar dataKey="ir" name="IR dû" fill="#c9a84c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tableau tranches ── */}
      <Card>
        <CardHeader>
          <CardTitle>Tranches d&apos;imposition détaillées</CardTitle>
          <CardDescription>// Barème progressif 2024 — votre tranche active en surbrillance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="grid grid-cols-4 gap-4 py-2 border-b border-border font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              <span>Tranche</span><span>Taux</span><span>Base taxable</span><span>IR dû</span>
            </div>
            {results.brackets.map((b, i) => (
              <div key={i} className={cn(
                'grid grid-cols-4 gap-4 py-3 border-b border-border/50 font-mono text-xs last:border-0 transition-colors',
                b.active ? 'bg-gold/5 text-gold border-l-2 border-gold pl-3' : 'text-foreground'
              )}>
                <span className="text-[11px]">{b.label}</span>
                <span className={b.active ? 'text-gold font-semibold' : 'text-muted-foreground'}>{b.rate}%</span>
                <span className="text-muted-foreground">{fmt(b.taxable)}</span>
                <span className={b.active ? 'text-gold font-semibold' : ''}>{fmt(b.ir)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Synthèse & Analyse ── */}
      <Card className={cn('border', scoreConf.bg)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-5 w-5', scoreConf.color)} />
            Synthèse & Analyse — Pression fiscale {scoreConf.label}
          </CardTitle>
          <CardDescription>// Diagnostic personnalisé de votre situation fiscale</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pression fiscale', value: fmtPct(results.effectivePressure), color: scoreConf.color },
              { label: 'Taux marginal', value: `${results.tmi}%`, color: results.tmi >= 41 ? 'text-crimson-finance' : results.tmi >= 30 ? 'text-amber-400' : 'text-emerald-finance' },
              { label: 'Économie abattement', value: fmt(results.abattement * results.tmi / 100), color: 'text-emerald-finance' },
              { label: 'Net / Brut', value: fmtPct(results.netIncome / inputs.gross * 100), color: 'text-foreground' },
            ].map((kpi, i) => (
              <div key={i} className="finance-card p-4 text-center">
                <p className="stat-label mb-1">{kpi.label}</p>
                <p className={cn('font-display text-xl font-bold', kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Message principal */}
          <div className={cn('p-4 border', scoreConf.bg)}>
            <p className="font-mono text-sm text-foreground leading-relaxed">{results.analysis.message}</p>
          </div>

          {/* Conseils d'optimisation */}
          <div className="space-y-3">
            <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">// Pistes d&apos;optimisation</p>
            {results.analysis.tips.map((tip, i) => (
              <div key={i} className="flex gap-3 p-3 border border-border/50 hover:border-gold/30 transition-colors">
                <Info className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <p className="font-mono text-xs text-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          {/* Comparaison visuelle net vs prélevé */}
          <div className="space-y-2">
            <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">// Décomposition de votre brut</p>
            <div className="h-8 flex overflow-hidden rounded-sm">
              <div
                className="bg-emerald-finance/80 flex items-center justify-center transition-all duration-700"
                style={{ width: `${results.netIncome / inputs.gross * 100}%` }}
              >
                <span className="font-mono text-[10px] text-white truncate px-1">Net {Math.round(results.netIncome / inputs.gross * 100)}%</span>
              </div>
              <div
                className="bg-crimson-finance/70 flex items-center justify-center transition-all duration-700"
                style={{ width: `${results.cotisations / inputs.gross * 100}%` }}
              >
                <span className="font-mono text-[10px] text-white truncate px-1">CS {Math.round(results.cotisations / inputs.gross * 100)}%</span>
              </div>
              <div
                className="bg-gold/80 flex items-center justify-center transition-all duration-700"
                style={{ width: `${results.ir / inputs.gross * 100}%` }}
              >
                <span className="font-mono text-[10px] text-white truncate px-1">IR {Math.round(results.ir / inputs.gross * 100)}%</span>
              </div>
            </div>
            <div className="flex gap-4 font-mono text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-finance/80 inline-block"/>Net perçu : {fmt(results.netIncome)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-crimson-finance/70 inline-block"/>Cotisations : {fmt(results.cotisations)}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gold/80 inline-block"/>IR : {fmt(results.ir)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
