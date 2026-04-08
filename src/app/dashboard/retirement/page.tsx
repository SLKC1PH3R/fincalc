'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { CsvExport } from '@/components/CsvExport'
import { calcRetirement, type RetirementInputs, type RetirementScenario } from '@/lib/calculators'
import { cn } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ExternalLink, RotateCcw, BookOpen, Settings2, PiggyBank } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useChartTheme } from '@/lib/chart-theme'

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function fmtPct(n: number) { return (n * 100).toFixed(2) + ' %' }

function ScenarioRow({ s, selected, onClick }: { s: RetirementScenario; selected: boolean; onClick: () => void }) {
  const borderColor = s.tauxPlein ? 'hsl(160 84% 39%)' : s.trimDecote > 10 ? 'hsl(0 72% 51%)' : 'hsl(38 92% 50%)'
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', background: selected ? 'rgba(255,255,255,0.04)' : 'transparent', borderBottom: '1px solid var(--card-dark-border)' }}
    >
      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--text-em)' }}>{s.age} ans</td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{s.trimestres}</td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 600, background: borderColor + '20', color: borderColor }}>
          {s.tauxPlein
            ? (s.trimSurcote > 0 ? `+${(s.surcotePct * 100).toFixed(2)}% surcote` : 'Taux plein')
            : `-${(s.decotePct * 100).toFixed(2)}% décote`}
        </span>
      </td>
      <td style={{ padding: '10px 12px', fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--text-em)' }}>{fmtEur(s.pensionBase)}</td>
      <td style={{ padding: '10px 12px', fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--text-em)' }}>{fmtEur(s.pensionArrco)}</td>
      <td style={{ padding: '10px 12px', fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{fmtEur(s.pensionBrute)}</td>
      <td style={{ padding: '10px 12px', fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--text-muted-c)' }}>{s.replacementRate.toFixed(0)}%</td>
    </tr>
  )
}

const DEFAULT_INPUTS: RetirementInputs = {
  age: 35, quarters: 52, pointsArrco: 800,
  salary: 48000, salaryGrowth: 1.5, departureAge: 64,
}

const COLOR = '#f472b6'

function RetirementPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS)
  const set = (k: keyof RetirementInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.retirementAge !== undefined && p.departureAge === undefined) p.departureAge = p.retirementAge
      if (p.pointsArrco === undefined) p.pointsArrco = 800
      if (p.salaryGrowth === undefined) p.salaryGrowth = 1.5
      setInputs(p as RetirementInputs)
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcRetirement(inputs), [inputs])
  const main = r.main

  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399', borderColor: 'rgba(52,211,153,0.25)' },
    bon:       { label: 'Bon',       Icon: TrendingUp,  color: '#60a5fa', borderColor: 'rgba(96,165,250,0.25)' },
    moyen:     { label: 'Moyen',     Icon: Minus,       color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)' },
    faible:    { label: 'Faible',    Icon: AlertCircle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' },
  }[r.analysis.score]

  const gaugeColor =
    main.replacementRate >= 75 ? '#34d399'
    : main.replacementRate >= 60 ? '#60a5fa'
    : main.replacementRate >= 45 ? '#fbbf24'
    : '#ef4444'

  const salNetActuel = inputs.salary * 0.78 / 12

  const csvRows = r.scenarios.map(s => ({
    'Âge départ': s.age,
    'Trimestres': s.trimestres,
    'Taux plein': s.tauxPlein ? 'Oui' : 'Non',
    'Base CNAV (€/mois)': s.pensionBase.toFixed(0),
    'Agirc-Arrco (€/mois)': s.pensionArrco.toFixed(0),
    'Total brut (€/mois)': s.pensionBrute.toFixed(0),
    'Taux remplacement (%)': s.replacementRate.toFixed(0),
  }))

  // Accumulation chart data (simple year projection)
  const accumulationData = useMemo(() => {
    const yearsToRetirement = Math.max(inputs.departureAge - inputs.age, 0)
    return Array.from({ length: yearsToRetirement + 1 }, (_, y) => ({
      year: inputs.age + y,
      label: `${inputs.age + y} ans`,
      trimestres: Math.min(inputs.quarters + y * 4, 172),
    }))
  }, [inputs.age, inputs.departureAge, inputs.quarters])

  // Donut sources revenus retraite
  const donutData = [
    { name: 'Base CNAV', value: main.pensionBase, color: COLOR },
    { name: 'Agirc-Arrco', value: main.pensionArrco, color: '#818cf8' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quel est votre âge actuel ?', hint: 'Votre âge aujourd\'hui. Il sert à calculer le nombre d\'années restantes avant votre retraite.', ref: 'L\'âge légal de départ en retraite est 64 ans depuis la réforme 2023.', suffix: ' ans', value: inputs.age, onChange: v => set('age')(v) },
    { question: 'Quel est votre salaire brut annuel ?', hint: 'Votre salaire brut actuel avant cotisations.', ref: 'SMIC brut 2024 : ~22 000 €/an. Salaire médian France : ~35 000 €/an.', suffix: '€/an', value: inputs.salary, onChange: v => set('salary')(v) },
    { question: 'Combien de trimestres avez-vous validés ?', hint: 'Trimestres cotisés à ce jour, tous régimes confondus. Visible sur info-retraite.fr.', ref: 'Il faut 172 trimestres pour le taux plein (né·e après 1965).', suffix: ' trimestres', value: inputs.quarters, onChange: v => set('quarters')(v) },
    { type: 'slider', question: 'À quel âge souhaitez-vous partir ?', hint: 'Âge de départ simulé. Partir plus tôt réduit la pension (décote), partir plus tard l\'augmente (surcote).', ref: 'Chaque trimestre supplémentaire après le taux plein ajoute 1.25% de surcote.', suffix: ' ans', value: inputs.departureAge, onChange: v => set('departureAge')(v), min: 60, max: 70, stepSize: 1, displayValue: v => `${v} ans` },
  ]

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Retraite</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PiggyBank style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Retraite</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>CNAV + Agirc-Arrco · Taux de remplacement</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
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
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
              onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
              style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInputs(DEFAULT_INPUTS)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginTop: 16 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {/* 3-column grid */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Paramètres */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PiggyBank style={{ width: 12, height: 12, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.age) set('age')(p.age)
                  if (p.netMonthlySalary) set('salary')(Math.round(p.netMonthlySalary * 12 / 0.78))
                }} />
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Âge actuel</label>
                    <Input type="number" min={18} max={66} value={inputs.age} onChange={e => set('age')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Trimestres<FieldTooltip text="Nombre de trimestres validés à ce jour. Visible sur info-retraite.fr." />
                    </label>
                    <Input type="number" min={0} max={200} value={inputs.quarters} onChange={e => set('quarters')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Points Agirc-Arrco<FieldTooltip text="Total de vos points Agirc-Arrco accumulés. Visible sur info-retraite.fr ou agirc-arrco.fr." />
                  </label>
                  <Input type="number" min={0} value={inputs.pointsArrco} onChange={e => set('pointsArrco')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                    ≈ {(inputs.pointsArrco * 1.4386 / 12).toFixed(0)} €/mois · +{r.annualPtsArrco.toFixed(1)} pts/an
                  </span>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Salaire brut annuel<FieldTooltip text="Votre salaire brut actuel. Le SAM (25 meilleures années) est estimé à partir de ce salaire." />
                  </label>
                  <Input type="number" min={0} value={inputs.salary} onChange={e => set('salary')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Progression salariale<FieldTooltip text="Augmentation annuelle estimée de votre salaire. Impact fort sur le SAM." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.salaryGrowth.toFixed(1)}%/an</span>
                  </div>
                  <Slider min={0} max={5} step={0.5} value={[inputs.salaryGrowth]} onValueChange={([v]) => set('salaryGrowth')(v)} />
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Âge de départ simulé</label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.departureAge} ans</span>
                  </div>
                  <Slider min={62} max={70} step={1} value={[inputs.departureAge]}
                    onValueChange={([v]) => setInputs(p => ({ ...p, departureAge: v }))} />
                </div>
              </div>
            </div>

            {/* Trimestres progress */}
            <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)', marginBottom: 10 }}>Progression vers le taux plein</p>
              {[
                { label: 'Acquis à ce jour', value: inputs.quarters, color: '#34d399' },
                { label: `À ${inputs.departureAge} ans`, value: Math.min(main.trimestres, 172), color: gaugeColor },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: i === 0 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value} / 172</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: row.color, width: `${Math.min(row.value / 172 * 100, 100)}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 8 }}>
                Taux plein quota à {Math.ceil(r.ageQuotaPlein)} ans
                {r.ageQuotaPlein <= inputs.departureAge ? ' ✓' : ''}
              </p>
              <a href="https://www.info-retraite.fr" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted-c)', textDecoration: 'none', marginTop: 4 }}>
                <ExternalLink style={{ width: 11, height: 11 }} />Vérifier sur info-retraite.fr
              </a>
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Pension mensuelle', value: `${fmtEur(main.pensionBrute)}/mois`, color: COLOR },
                { label: 'Taux remplacement', value: `${main.replacementRate.toFixed(0)}%`, color: gaugeColor },
                { label: 'Base CNAV', value: `${fmtEur(main.pensionBase)}/mois`, color: 'var(--text-primary)' },
                { label: 'Agirc-Arrco', value: `${fmtEur(main.pensionArrco)}/mois`, color: 'var(--text-primary)' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 4, letterSpacing: '0.04em' }}>{kpi.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Scénarios table */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Scénarios de départ — 62 à 70 ans</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>Cliquez sur un âge pour le sélectionner</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Départ', 'Trim.', 'Taux', 'Base CNAV', 'Agirc-Arrco', 'Total brut', 'Remplac.'].map((h, i) => (
                        <th key={i} style={{ padding: '8px 12px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--card-dark-border)' }}>{h}</th>
                      ))}
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
            </div>

            {/* Détail scénario sélectionné */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>Détail — départ à {main.age} ans</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{main.trimestres} trimestres validés</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {[
                  { label: 'SAM estimé (base calcul)', value: fmtEur(main.sam) + '/an' },
                  { label: 'Taux appliqué', value: fmtPct(main.tauxFinal) + (main.tauxPlein ? ' (taux plein)' : ' (avec décote)') },
                  { label: 'Prorata trimestres', value: (main.prorata * 100).toFixed(1) + '% (' + Math.min(main.trimestres, 172) + '/172)' },
                  { label: 'Points Agirc-Arrco', value: main.totalPoints.toFixed(0) + ' pts' },
                  { label: 'Pension brute/mois', value: fmtEur(main.pensionBrute) },
                  { label: 'Pension nette/mois', value: fmtEur(main.pensionNette) + ' (−16%)' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <CsvExport data={csvRows} filename={`retraite-${inputs.departureAge}ans`} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Analyse */}
            <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreConf.borderColor}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <scoreConf.Icon style={{ width: 15, height: 15, color: scoreConf.color }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>
                  Analyse — {scoreConf.label} ({main.replacementRate.toFixed(0)}%)
                </p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 10 }}>{r.analysis.message}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {r.analysis.tips.slice(0, 3).map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, borderRadius: 8, border: '1px solid var(--card-dark-border)', padding: '8px 10px' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted-c)' }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut sources revenus */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 10 }}>Sources de revenus retraite</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={160} height={120}>
                  <Pie data={donutData} cx={80} cy={60} innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmtEur(v) + '/mois', '']} contentStyle={chart.tooltip} />
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)' }}>{fmtEur(d.value)}/mois</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--section-border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Total brut</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{fmtEur(main.pensionBrute)}/mois</span>
                </div>
              </div>
            </div>

            {/* Gap de rente */}
            <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 6 }}>Gap de rente à combler</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#f87171', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', marginBottom: 4 }}>
                {fmtEur(Math.max(0, salNetActuel - main.pensionNette))}/mois
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>
                Entre votre salaire net actuel ({fmtEur(salNetActuel)}/mois) et votre pension nette estimée ({fmtEur(main.pensionNette)}/mois).
              </p>
              <div style={{ marginTop: 8 }}>
                <a href="/dashboard/envelope-compare" style={{ fontSize: 11, color: COLOR, textDecoration: 'none', fontWeight: 600 }}>→ Comparer PER · AV · CTO</a>
              </div>
            </div>

            {/* Note légale */}
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.6, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              Calcul basé sur les formules CNAV 2026. Montants en euros nominaux estimés. Les résultats exacts dépendent de votre relevé de carrière complet.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RetirementPage() { return <Suspense><RetirementPageInner /></Suspense> }
