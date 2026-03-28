'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { CsvExport } from '@/components/CsvExport'
import { calcRetirement, type RetirementInputs, type RetirementScenario } from '@/lib/calculators'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ExternalLink, RotateCcw, BookOpen, Settings2 } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
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

function RetirementPageInner() {
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Simulateur de retraite <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400, marginLeft: 6 }}>Régime général · Agirc-Arrco</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {guidedMode && (
        <GuidedModePanel
          steps={[
            { question: 'Quel est votre âge actuel ?', hint: 'Votre âge aujourd\'hui. Il sert à calculer le nombre d\'années restantes avant votre retraite et à estimer votre progression de carrière.', ref: 'L\'âge légal de départ en retraite est 64 ans depuis la réforme 2023. L\'âge du taux plein auto varie selon votre génération.', suffix: ' ans', value: inputs.age, onChange: v => set('age')(v) },
            { question: 'Quel est votre salaire brut annuel ?', hint: 'Votre salaire brut actuel avant cotisations. Il sert à estimer votre SAM (Salaire Annuel Moyen des 25 meilleures années).', ref: 'SMIC brut 2024 : ~22 000 €/an. Salaire médian France : ~35 000 €/an. Visible sur votre fiche de paie.', suffix: '€/an', value: inputs.salary, onChange: v => set('salary')(v) },
            { question: 'Combien de trimestres avez-vous validés ?', hint: 'Trimestres cotisés à ce jour, tous régimes confondus. Visible sur votre relevé de carrière sur info-retraite.fr.', ref: 'Il faut 172 trimestres pour le taux plein (né·e après 1965). Chaque trimestre manquant = -1.25% de décote.', suffix: ' trimestres', value: inputs.quarters, onChange: v => set('quarters')(v) },
            { type: 'slider', question: 'À quel âge souhaitez-vous partir ?', hint: 'Âge de départ simulé. Partir plus tôt réduit la pension (décote), partir plus tard l\'augmente (surcote).', ref: 'Chaque trimestre supplémentaire après le taux plein ajoute 1.25% de surcote. Partir à 67 ans donne le taux plein automatique.', suffix: ' ans', value: inputs.departureAge, onChange: v => set('departureAge')(v), min: 60, max: 70, stepSize: 1, displayValue: v => `${v} ans` },
          ] satisfies GuidedStep[]}
          currentStep={guidedStep}
          onStepChange={setGuidedStep}
          onFinish={() => setGuidedMode(false)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* ── Left: Inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Situation actuelle */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Votre situation actuelle</p>
              <ProfileFillButton onFill={p => {
                if (p.age)              set('age')(p.age)
                if (p.netMonthlySalary) set('salary')(Math.round(p.netMonthlySalary * 12 / 0.78))
              }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12 }}>Âge actuel</Label>
                <Input type="number" min={18} max={66} value={inputs.age} onChange={e => set('age')(+e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                  Trimestres
                  <Tip text="Nombre de trimestres validés à ce jour. Visible sur info-retraite.fr dans votre relevé de carrière." />
                </Label>
                <Input type="number" min={0} max={200} value={inputs.quarters} onChange={e => set('quarters')(+e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                Points Agirc-Arrco
                <Tip text="Total de vos points Agirc-Arrco accumulés. Visible sur votre relevé info-retraite.fr ou agirc-arrco.fr." />
              </Label>
              <Input type="number" min={0} value={inputs.pointsArrco} onChange={e => set('pointsArrco')(+e.target.value)} />
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                ≈ {(inputs.pointsArrco * 1.4386 / 12).toFixed(0)} €/mois actuels · +{r.annualPtsArrco.toFixed(1)} pts/an au salaire actuel
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                Salaire brut annuel
                <Tip text="Votre salaire brut actuel. Le SAM (25 meilleures années) est estimé à partir de ce salaire projeté et plafonné au PASS." />
              </Label>
              <Input type="number" min={0} value={inputs.salary} onChange={e => set('salary')(+e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Label style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                  Progression salariale
                  <Tip text="Augmentation annuelle estimée de votre salaire. Impact fort sur le SAM à la retraite. Inflation historique ~2%." />
                </Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.salaryGrowth.toFixed(1)}%/an</span>
              </div>
              <Slider min={0} max={5} step={0.5} value={[inputs.salaryGrowth]} onValueChange={([v]) => set('salaryGrowth')(v)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Label style={{ fontSize: 12 }}>Âge de départ simulé</Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.departureAge} ans</span>
              </div>
              <Slider min={62} max={70} step={1} value={[inputs.departureAge]}
                onValueChange={([v]) => setInputs(p => ({ ...p, departureAge: v }))} />
            </div>
          </div>

          {/* Trimestres progress */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progression vers le taux plein</p>
            {[
              { label: 'Acquis à ce jour', value: inputs.quarters, color: '#34d399' },
              { label: `À ${inputs.departureAge} ans`, value: Math.min(main.trimestres, 172), color: gaugeColor },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value} / 172 trim.</span>
                </div>
                <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 9999, background: row.color, width: `${Math.min(row.value / 172 * 100, 100)}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
              Taux plein (quota) atteint à {Math.ceil(r.ageQuotaPlein)} ans
              {r.ageQuotaPlein <= inputs.departureAge ? ' ✓' : ` — ${Math.ceil(r.ageQuotaPlein - inputs.departureAge)} ans avant départ`}
            </p>
            <a href="https://www.info-retraite.fr" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted-c)', textDecoration: 'none' }}>
              <ExternalLink style={{ width: 11, height: 11 }} />Vérifier sur info-retraite.fr
            </a>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Pension mensuelle estimée</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmtEur(main.pensionBrute)}/mois</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 4 }}>à {inputs.departureAge} ans · nette {fmtEur(main.pensionNette)}/mois</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Taux de remplacement</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: gaugeColor, fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{main.replacementRate.toFixed(0)}%</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 4 }}>vs {fmtEur(salNetActuel)}/mois net actuel</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Base CNAV</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmtEur(main.pensionBase)}/mois</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 4 }}>SAM {fmtEur(main.sam)} · taux {fmtPct(main.tauxFinal)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Agirc-Arrco</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmtEur(main.pensionArrco)}/mois</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 4 }}>{main.totalPoints.toFixed(0)} pts × 1,4386€</p>
            </div>
          </div>

          {/* Scenarios table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Scénarios de départ — 62 à 70 ans</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 16 }}>Cliquez sur un âge pour le sélectionner comme scénario principal</p>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--card-dark-border)' }}>
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

            {/* Détail scénario sélectionné */}
            <div style={{ marginTop: 16, borderRadius: 10, border: '1px solid var(--card-dark-border)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
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
            </div>
          </div>

          {/* CsvExport */}
          <CsvExport data={csvRows} filename={`retraite-${inputs.departureAge}ans`} />

          {/* Analyse */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreConf.borderColor}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color, flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                Analyse — {scoreConf.label} ({main.replacementRate.toFixed(0)}% de remplacement)
              </p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 16 }}>{r.analysis.message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.analysis.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, borderRadius: 8, border: '1px solid var(--card-dark-border)', padding: '10px 14px' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted-c)' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', borderTop: '1px solid var(--card-dark-border)', paddingTop: 12, marginTop: 16, lineHeight: 1.6 }}>
              Calcul basé sur les formules CNAV 2026 (SAM × taux × prorata ± décote/surcote) et Agirc-Arrco (points × valeur 1,4386€).
              Montants en euros nominaux estimés à la date de départ. Les résultats exacts dépendent de votre relevé de carrière complet.
            </p>
          </div>

        </div>
      </div>
      </div>
    </div>
  )
}

export default function RetirementPage() { return <Suspense><RetirementPageInner /></Suspense> }
