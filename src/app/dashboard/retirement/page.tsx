'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcRetirement, type RetirementInputs, type RetirementScenario } from '@/lib/calculators'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ExternalLink } from 'lucide-react'
import { printReport } from '@/lib/print'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-64 rounded-md border border-border bg-popover p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) { return (n * 100).toFixed(2) + ' %' }

function ScenarioRow({ s, selected, onClick }: { s: RetirementScenario; selected: boolean; onClick: () => void }) {
  const borderColor = s.tauxPlein ? 'hsl(160 84% 39%)' : s.trimDecote > 10 ? 'hsl(0 72% 51%)' : 'hsl(38 92% 50%)'
  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-border transition-colors hover:bg-muted/30',
        selected && 'bg-muted/50'
      )}
    >
      <td className="px-3 py-2.5 text-sm font-medium tabular-nums">{s.age} ans</td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-muted-foreground">{s.trimestres}</td>
      <td className="px-3 py-2.5 text-sm">
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
          style={{ background: borderColor + '20', color: borderColor }}
        >
          {s.tauxPlein
            ? (s.trimSurcote > 0 ? `+${(s.surcotePct * 100).toFixed(2)}% surcote` : 'Taux plein')
            : `-${(s.decotePct * 100).toFixed(2)}% décote`}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-right">{fmtEur(s.pensionBase)}</td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-right">{fmtEur(s.pensionArrco)}</td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-right font-semibold">{fmtEur(s.pensionBrute)}</td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-right text-muted-foreground">{s.replacementRate.toFixed(0)}%</td>
    </tr>
  )
}

function RetirementPageInner() {
  const [inputs, setInputs] = useState<RetirementInputs>({
    age: 35, quarters: 52, pointsArrco: 800,
    salary: 48000, salaryGrowth: 1.5, departureAge: 64,
  })
  const set = (k: keyof RetirementInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      // Migrate old format
      if (p.retirementAge !== undefined && p.departureAge === undefined) p.departureAge = p.retirementAge
      if (p.pointsArrco === undefined) p.pointsArrco = 800
      if (p.salaryGrowth === undefined) p.salaryGrowth = 1.5
      setInputs(p as RetirementInputs)
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcRetirement(inputs), [inputs])
  const main = r.main

  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance', border: 'rgba(52,211,153,0.35)' },
    bon:       { label: 'Bon',       Icon: TrendingUp,  color: 'text-blue-400',          border: 'rgba(96,165,250,0.35)' },
    moyen:     { label: 'Moyen',     Icon: Minus,       color: 'text-amber-400',          border: 'rgba(251,191,36,0.35)' },
    faible:    { label: 'Faible',    Icon: AlertCircle, color: 'text-crimson-finance',    border: 'rgba(239,68,68,0.35)' },
  }[r.analysis.score]

  const gaugeColor =
    main.replacementRate >= 75 ? 'hsl(160 84% 39%)'
    : main.replacementRate >= 60 ? 'hsl(217 91% 60%)'
    : main.replacementRate >= 45 ? 'hsl(38 92% 50%)'
    : 'hsl(0 72% 51%)'

  const salNetActuel = inputs.salary * 0.78 / 12

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Simulateur Retraite 2026</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Régime général (CNAV) · Agirc-Arrco · Formules officielles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Retraite 2026',
            subtitle: `Régime général · Agirc-Arrco`,
            kpis: [
              { label: 'Pension brute', value: `${fmtEur(main.pensionBrute)}/mois`, highlight: true },
              { label: 'dont base (CNAV)', value: `${fmtEur(main.pensionBase)}/mois` },
              { label: 'dont Agirc-Arrco', value: `${fmtEur(main.pensionArrco)}/mois` },
              { label: 'Taux de remplacement', value: `${main.replacementRate.toFixed(0)}%` },
            ],
            inputs: [
              { label: 'Âge actuel', value: `${inputs.age} ans` },
              { label: 'Trimestres validés', value: String(inputs.quarters) },
              { label: 'Points Agirc-Arrco', value: inputs.pointsArrco.toFixed(2) },
              { label: 'Salaire brut annuel', value: fmtEur(inputs.salary) },
              { label: 'Âge de départ', value: `${inputs.departureAge} ans` },
            ],
            sections: [],
            tips: r.analysis.tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="retirement" name={`Retraite ${inputs.departureAge} ans`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pension brute estimée', value: fmtEur(main.pensionBrute) + '/mois', sub: `à ${inputs.departureAge} ans`, color: gaugeColor },
          { label: 'dont CNAV (base)', value: fmtEur(main.pensionBase) + '/mois', sub: `SAM ${fmtEur(main.sam)} · taux ${fmtPct(main.tauxFinal)}` },
          { label: 'dont Agirc-Arrco', value: fmtEur(main.pensionArrco) + '/mois', sub: `${main.totalPoints.toFixed(0)} pts × ${(main.totalPoints > 0 ? main.pensionArrco * 12 / main.totalPoints : 1.44).toFixed(4)} €` },
          { label: 'Taux de remplacement', value: main.replacementRate.toFixed(0) + '%', sub: `vs ${fmtEur(salNetActuel)}/mois net actuel` },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="text-xl font-semibold tracking-tight" style={i === 0 ? { color: k.color } : {}}>{k.value}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Paramètres */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Votre situation actuelle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Âge actuel</Label>
                  <Input type="number" min={18} max={66} value={inputs.age} onChange={e => set('age')(+e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">Trimestres
                    <Tip text="Nombre de trimestres validés à ce jour. Visible sur info-retraite.fr dans votre relevé de carrière." />
                  </Label>
                  <Input type="number" min={0} max={200} value={inputs.quarters} onChange={e => set('quarters')(+e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Points Agirc-Arrco
                  <Tip text="Total de vos points Agirc-Arrco accumulés. Visible sur votre relevé info-retraite.fr ou agirc-arrco.fr." />
                </Label>
                <Input type="number" min={0} value={inputs.pointsArrco} onChange={e => set('pointsArrco')(+e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  ≈ {(inputs.pointsArrco * 1.4386 / 12).toFixed(0)} €/mois actuels · +{r.annualPtsArrco.toFixed(1)} pts/an au salaire actuel
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Salaire brut annuel
                  <Tip text="Votre salaire brut actuel. Le SAM (25 meilleures années) est estimé à partir de ce salaire projeté et plafonné au PASS." />
                </Label>
                <Input type="number" min={0} value={inputs.salary} onChange={e => set('salary')(+e.target.value)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Progression salariale
                    <Tip text="Augmentation annuelle estimée de votre salaire. Impact fort sur le SAM à la retraite. Inflation historique ~2%." />
                  </Label>
                  <span className="text-sm font-medium">{inputs.salaryGrowth.toFixed(1)}%/an</span>
                </div>
                <Slider min={0} max={5} step={0.5} value={[inputs.salaryGrowth]} onValueChange={([v]) => set('salaryGrowth')(v)} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Âge de départ simulé</Label>
                  <span className="text-sm font-medium">{inputs.departureAge} ans</span>
                </div>
                <Slider min={62} max={70} step={1} value={[inputs.departureAge]}
                  onValueChange={([v]) => setInputs(p => ({ ...p, departureAge: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* Trimestres progress */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Progression vers le taux plein</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Acquis à ce jour', value: inputs.quarters, max: 172, color: 'hsl(160 84% 39%)' },
                { label: `À ${inputs.departureAge} ans`, value: Math.min(main.trimestres, 172), max: 172, color: gaugeColor },
              ].map((row, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value} / 172 trim.</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(row.value / 172 * 100, 100)}%`, background: row.color }} />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Taux plein (quota) atteint à {Math.ceil(r.ageQuotaPlein)} ans
                {r.ageQuotaPlein <= inputs.departureAge ? ' ✓' : ` — ${Math.ceil(r.ageQuotaPlein - inputs.departureAge)} ans avant départ`}
              </p>
              <a href="https://www.info-retraite.fr" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3 w-3" />Vérifier sur info-retraite.fr
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des scénarios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scénarios de départ — 62 à 70 ans</CardTitle>
            <CardDescription>Cliquez sur un âge pour le sélectionner comme scénario principal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Départ</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Trim.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Taux</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Base CNAV</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Agirc-Arrco</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total brut</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Remplac.</th>
                  </tr>
                </thead>
                <tbody>
                  {r.scenarios.map(s => (
                    <ScenarioRow key={s.age} s={s} selected={s.age === inputs.departureAge}
                      onClick={() => setInputs(p => ({ ...p, departureAge: s.age }))} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Détail scénario sélectionné */}
            <div className="mt-4 rounded-md border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Détail — départ à {main.age} ans</span>
                <span className="text-xs text-muted-foreground">{main.trimestres} trimestres validés</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {[
                  { label: 'SAM estimé (base calcul)', value: fmtEur(main.sam) + '/an' },
                  { label: 'Taux appliqué', value: fmtPct(main.tauxFinal) + (main.tauxPlein ? ' (taux plein)' : ' (avec décote)') },
                  { label: 'Prorata trimestres', value: (main.prorata * 100).toFixed(1) + '% (' + Math.min(main.trimestres, 172) + '/172)' },
                  { label: 'Points Agirc-Arrco', value: main.totalPoints.toFixed(0) + ' pts' },
                  { label: 'Pension brute/mois', value: fmtEur(main.pensionBrute) },
                  { label: 'Pension nette/mois', value: fmtEur(main.pensionNette) + ' (−16%)' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse */}
      <Card style={{ borderColor: scoreConf.border }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse — {scoreConf.label} ({main.replacementRate.toFixed(0)}% de remplacement)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{r.analysis.message}</p>
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
          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Calcul basé sur les formules CNAV 2026 (SAM × taux × prorata ± décote/surcote) et Agirc-Arrco (points × valeur 1,4386€).
            Montants en euros nominaux estimés à la date de départ. Les résultats exacts dépendent de votre relevé de carrière complet.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

export default function RetirementPage() { return <Suspense><RetirementPageInner /></Suspense> }
