'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { CsvExport } from '@/components/CsvExport'
import { calcRetirement, type RetirementInputs, type RetirementScenario } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ExternalLink, RotateCcw, BookOpen, Settings2, PiggyBank } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { SvgDonut } from '@/components/SvgChart'

const C = '#f472b6'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function fmtPct(n: number) { return (n * 100).toFixed(2) + ' %' }

function ScenarioRow({ s, selected, onClick, showAllCols }: { s: RetirementScenario; selected: boolean; onClick: () => void; showAllCols: boolean }) {
  const statusColor = s.tauxPlein ? '#34d399' : s.trimDecote > 10 ? '#f87171' : '#fbbf24'
  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', background: selected ? `${C}08` : 'transparent', borderBottom: '1px solid var(--p-line)', transition: 'background 0.15s' }}
    >
      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: selected ? C : 'var(--p-text-em)', fontFamily: 'var(--p-mono)' }}>{s.age} ans</td>
      {showAllCols && <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{s.trimestres}</td>}
      <td style={{ padding: '10px 14px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 700, background: statusColor + '18', color: statusColor, fontFamily: 'var(--p-mono)', letterSpacing: '0.04em' }}>
          {s.tauxPlein
            ? (s.trimSurcote > 0 ? `+${(s.surcotePct * 100).toFixed(2)}% surcote` : 'Taux plein')
            : `-${(s.decotePct * 100).toFixed(2)}% décote`}
        </span>
      </td>
      {showAllCols && <td style={{ padding: '10px 14px', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--p-text-mid)', fontFamily: 'var(--p-mono)' }}>{fmtEur(s.pensionBase)}</td>}
      {showAllCols && <td style={{ padding: '10px 14px', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--p-text-mid)', fontFamily: 'var(--p-mono)' }}>{fmtEur(s.pensionArrco)}</td>}
      <td style={{ padding: '10px 14px', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 700, color: selected ? C : 'var(--p-text-em)', fontFamily: 'var(--p-mono)' }}>{fmtEur(s.pensionBrute)}</td>
      {showAllCols && <td style={{ padding: '10px 14px', fontSize: 12, fontVariantNumeric: 'tabular-nums', textAlign: 'right', color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{s.replacementRate.toFixed(0)}%</td>}
    </tr>
  )
}

const DEFAULT_INPUTS: RetirementInputs = {
  age: 35, quarters: 52, pointsArrco: 800,
  salary: 48000, salaryGrowth: 1.5, departureAge: 64,
}

function RetirementPageInner() {
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS)
  const set = (k: keyof RetirementInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [showAllCols, setShowAllCols] = useState(false)

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
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon:       { label: 'Bon',       Icon: TrendingUp,  color: '#60a5fa' },
    moyen:     { label: 'Moyen',     Icon: Minus,       color: '#fbbf24' },
    faible:    { label: 'Faible',    Icon: AlertCircle, color: '#ef4444' },
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

  const donutSegments = [
    { value: main.pensionBase, color: C, label: 'Base CNAV' },
    { value: main.pensionArrco, color: '#818cf8', label: 'Agirc-Arrco' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quel est votre âge actuel ?', hint: 'Votre âge aujourd\'hui. Il sert à calculer le nombre d\'années restantes avant votre retraite.', ref: 'L\'âge légal de départ en retraite est 64 ans depuis la réforme 2023.', suffix: ' ans', value: inputs.age, onChange: v => set('age')(v) },
    { question: 'Quel est votre salaire brut annuel ?', hint: 'Votre salaire brut actuel avant cotisations.', ref: 'SMIC brut 2024 : ~22 000 €/an. Salaire médian France : ~35 000 €/an.', suffix: '€/an', value: inputs.salary, onChange: v => set('salary')(v) },
    { question: 'Combien de trimestres avez-vous validés ?', hint: 'Trimestres cotisés à ce jour, tous régimes confondus. Visible sur info-retraite.fr.', ref: 'Il faut 172 trimestres pour le taux plein (né·e après 1965).', suffix: ' trimestres', value: inputs.quarters, onChange: v => set('quarters')(v) },
    { type: 'slider', question: 'À quel âge souhaitez-vous partir ?', hint: 'Âge de départ simulé. Partir plus tôt réduit la pension (décote), partir plus tard l\'augmente (surcote).', ref: 'Chaque trimestre supplémentaire après le taux plein ajoute 1.25% de surcote.', suffix: ' ans', value: inputs.departureAge, onChange: v => set('departureAge')(v), min: 60, max: 70, stepSize: 1, displayValue: v => `${v} ans` },
  ]

  const GAP = 16

  const tips = [
    { title: 'Taux de remplacement', body: main.replacementRate < 60 ? 'Votre pension couvre moins de 60% de votre revenu. Pensez à compléter avec un PER ou une assurance-vie.' : 'Bon taux de remplacement. Optimisez vos enveloppes retraite : PER, PEA, AV.', color: main.replacementRate >= 60 ? '#34d399' : '#fbbf24' },
    { title: 'Surcote & Reports', body: 'Chaque trimestre supplémentaire après le taux plein ajoute 1,25% à votre pension. Partir à 67 ans garantit le taux plein quel que soit votre nombre de trimestres.', color: C },
    { title: 'Gap de rente', body: `Écart entre votre salaire net (${fmtEur(salNetActuel)}/mois) et votre pension nette (${fmtEur(main.pensionNette)}/mois) : ${fmtEur(Math.max(0, salNetActuel - main.pensionNette))}/mois à combler.`, color: '#fb923c' },
  ]

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Retraite</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Retraite<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Simulation pension CNAV + Agirc-Arrco. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Taux de remplacement · Décote / Surcote.</span>
          </p>
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
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="retirement" name={`Retraite ${inputs.departureAge} ans`} inputs={inputs as any} results={r as any} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={() => setInputs(DEFAULT_INPUTS)}>
            <RotateCcw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 290px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={eyebrow}>Paramètres</div>
                <ProfileFillButton onFill={p => {
                  if (p.age) set('age')(p.age)
                  if (p.netMonthlySalary) set('salary')(Math.round(p.netMonthlySalary * 12 / 0.78))
                }} />
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelSt}>Âge actuel</label>
                    <Input type="number" min={18} max={66} value={inputs.age} onChange={e => set('age')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', borderRadius: 10, background: 'var(--p-card-2)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Trimestres<FieldTooltip text="Nombre de trimestres validés à ce jour. Visible sur info-retraite.fr." />
                    </label>
                    <Input type="number" min={0} max={200} value={inputs.quarters} onChange={e => set('quarters')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', borderRadius: 10, background: 'var(--p-card-2)' }} />
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Points Agirc-Arrco<FieldTooltip text="Total de vos points Agirc-Arrco accumulés. Visible sur info-retraite.fr ou agirc-arrco.fr." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" min={0} value={inputs.pointsArrco} onChange={e => set('pointsArrco')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', borderRadius: 10, background: 'var(--p-card-2)' }} />
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                    ≈ {(inputs.pointsArrco * 1.4386 / 12).toFixed(0)} €/mois · +{r.annualPtsArrco.toFixed(1)} pts/an
                  </span>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Salaire brut annuel<FieldTooltip text="Votre salaire brut actuel. Le SAM (25 meilleures années) est estimé à partir de ce salaire." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" min={0} value={inputs.salary} onChange={e => set('salary')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Progression salariale<FieldTooltip text="Augmentation annuelle estimée de votre salaire. Impact fort sur le SAM." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.salaryGrowth.toFixed(1)}%/an</span>
                  </div>
                  <Slider min={0} max={5} step={0.5} value={[inputs.salaryGrowth]} onValueChange={([v]) => set('salaryGrowth')(v)} />
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={labelSt}>Âge de départ simulé</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.departureAge} ans</span>
                  </div>
                  <Slider min={62} max={70} step={1} value={[inputs.departureAge]}
                    onValueChange={([v]) => setInputs(p => ({ ...p, departureAge: v }))} />
                </div>
              </div>
            </div>

            {/* Trimestres progress */}
            <div style={{ background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ ...eyebrow, marginBottom: 10 }}>Progression taux plein</p>
              {[
                { label: 'Acquis à ce jour', value: inputs.quarters, color: '#34d399' },
                { label: `À ${inputs.departureAge} ans`, value: Math.min(main.trimestres, 172), color: gaugeColor },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: i === 0 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{row.value} / 172</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 9999, background: 'var(--p-row-hover)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 9999, background: row.color, width: `${Math.min(row.value / 172 * 100, 100)}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 8 }}>
                Taux plein quota à {Math.ceil(r.ageQuotaPlein)} ans
                {r.ageQuotaPlein <= inputs.departureAge ? ' ✓' : ''}
              </p>
              <a href="https://www.info-retraite.fr" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--p-text-dim)', textDecoration: 'none', marginTop: 4 }}>
                <ExternalLink style={{ width: 11, height: 11 }} />Vérifier sur info-retraite.fr
              </a>
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Pension brute mensuelle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(main.pensionBrute)}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--p-text-dim)' }}>
                    <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Pension nette :</span> {fmtEur(main.pensionNette)}/mois (−16%)
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Base CNAV', value: fmtEur(main.pensionBase) + '/mois' },
                    { label: 'Agirc-Arrco', value: fmtEur(main.pensionArrco) + '/mois' },
                    { label: 'Taux remplacement', value: `${main.replacementRate.toFixed(0)} %`, color: gaugeColor },
                    { label: 'Départ simulé', value: `${main.age} ans` },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scénarios table */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={eyebrow}>Scénarios de départ — 62 à 70 ans</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Cliquez sur un âge pour le sélectionner</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setShowAllCols(v => !v)} style={{ fontSize: 10.5, color: 'var(--p-text-dim)', background: 'none', border: '1px solid var(--p-line)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'var(--p-mono)' }}>
                    {showAllCols ? 'Réduire ↑' : 'Voir tout →'}
                  </button>
                  <CsvExport data={csvRows} filename={`retraite-${inputs.departureAge}ans`} />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--p-card-2)' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Départ</th>
                      {showAllCols && <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Trim.</th>}
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Taux</th>
                      {showAllCols && <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Base CNAV</th>}
                      {showAllCols && <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Agirc-Arrco</th>}
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Total brut</th>
                      {showAllCols && <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>Remplac.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {r.scenarios.map(s => (
                      <ScenarioRow key={s.age} s={s} selected={s.age === inputs.departureAge}
                        onClick={() => setInputs(p => ({ ...p, departureAge: s.age }))} showAllCols={showAllCols} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Détail scénario sélectionné */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
                <div style={eyebrow}>Détail — départ à {main.age} ans</div>
                <span style={{ fontSize: 11, color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{main.trimestres} trimestres validés</span>
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
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>{row.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Analyse */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
                <div style={{ ...eyebrow, color: scoreConf.color }}>Analyse — {scoreConf.label}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>{r.analysis.message}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {r.analysis.tips.slice(0, 3).map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, borderRadius: 8, border: '1px solid var(--p-line)', padding: '8px 10px', background: 'var(--p-card-2)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${C}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: C }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut sources revenus */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Sources de revenus retraite</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Régime de base + complémentaire</div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <SvgDonut segments={donutSegments} width={160} height={120} outerRadius={55} innerRadius={38} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {donutSegments.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{d.label}</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>{fmtEur(d.value)}/mois</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--p-line)' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Total brut</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{fmtEur(main.pensionBrute)}/mois</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gap de rente */}
            <div style={{ background: `${C}08`, border: `1px solid ${C}20`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Gap de rente à combler</div>
              <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: '#f87171', marginBottom: 6 }}>
                {fmtK(Math.max(0, salNetActuel - main.pensionNette))}/mois
              </div>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5 }}>
                Entre votre salaire net ({fmtEur(salNetActuel)}/mois) et votre pension nette ({fmtEur(main.pensionNette)}/mois).
              </p>
              <a href="/dashboard/envelope-compare" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: C, textDecoration: 'none', fontWeight: 700, marginTop: 8 }}>
                → Comparer PER · AV · CTO
              </a>
            </div>

            {/* Conseils */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ padding: '12px 12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PiggyBank style={{ width: 13, height: 13, color: t.color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aller plus loin */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Épargne retraite — PER', href: '/dashboard/savings-rate' },
                  { label: 'Intérêts composés', href: '/dashboard/compound' },
                ].map((l, i) => (
                  <a key={i} href={l.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{l.label}</span><span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Note légale */}
            <p style={{ fontSize: 10.5, color: 'var(--p-text-faint)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--p-card)', borderRadius: 8, border: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>
              Calcul basé sur les formules CNAV 2026. Montants en euros nominaux estimés. Les résultats exacts dépendent de votre relevé de carrière complet.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RetirementPage() { return <Suspense><RetirementPageInner /></Suspense> }
