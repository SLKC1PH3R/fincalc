'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcTax, type TaxInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, TrendingUp, Minus, AlertCircle, CheckCircle2, BookOpen, Settings2, Receipt, User } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { FieldTooltip } from '@/components/FieldTooltip'

const SCORE = {
  excellent: { label: 'Faible', icon: CheckCircle2, color: '#34d399' },
  bon: { label: 'Modéré', icon: TrendingUp, color: '#60a5fa' },
  moyen: { label: 'Significatif', icon: Minus, color: '#fbbf24' },
  eleve: { label: 'Élevé', icon: AlertCircle, color: '#f87171' },
}

const COLOR = '#f87171'

function TaxPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<TaxInputs>({
    gross: 60000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false
  })
  const set = (k: keyof TaxInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const raw = JSON.parse(restoreParam)
      setInputs({
        gross: raw.gross ?? raw.salary ?? 60000,
        parts: raw.parts ?? 1,
        csRate: raw.csRate ?? 22,
        regime: raw.regime ?? 'salarie',
        fraisReels: raw.fraisReels ?? 0,
        useFraisReels: raw.useFraisReels ?? false,
      })
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcTax(inputs), [inputs])
  const score = SCORE[r.analysis.score]

  const guidedSteps: GuidedStep[] = [
    {
      question: 'Quel est votre revenu brut annuel ?',
      hint: 'Indiquez votre salaire brut annuel avant toute déduction. Vous le trouverez sur votre dernier bulletin de salaire ou votre contrat.',
      ref: 'Le revenu brut est la base de calcul avant cotisations sociales et impôt sur le revenu.',
      type: 'number',
      suffix: '€',
      value: inputs.gross,
      onChange: v => set('gross')(v),
    },
    {
      question: 'Quelle est votre situation familiale ?',
      hint: 'Le quotient familial divise votre revenu par le nombre de parts pour calculer l\'impôt. Chaque enfant à charge ajoute 0,5 part.',
      ref: 'Plus vous avez de parts, plus votre impôt est réduit via le mécanisme du quotient familial.',
      type: 'choice',
      strValue: String(inputs.parts),
      onChoice: v => set('parts')(+v),
      options: [
        { value: '1', label: 'Célibataire', sub: '1 part' },
        { value: '1.5', label: 'Célib. + 1 enfant', sub: '1,5 parts' },
        { value: '2', label: 'Couple sans enfant', sub: '2 parts' },
        { value: '2.5', label: 'Couple + 1 enfant', sub: '2,5 parts' },
        { value: '3', label: 'Couple + 2 enfants', sub: '3 parts' },
        { value: '4', label: 'Couple + 3 enfants', sub: '4 parts' },
      ],
    },
    {
      question: 'Quel est votre taux de cotisations sociales ?',
      hint: 'Les cotisations salariales sont prélevées avant l\'impôt. Environ 22% pour un salarié du privé, 10% pour un fonctionnaire.',
      ref: 'Ces cotisations financent retraite, maladie, chômage. Elles réduisent votre revenu imposable.',
      type: 'slider',
      min: 0,
      max: 25,
      stepSize: 0.5,
      value: inputs.csRate,
      onChange: v => set('csRate')(v),
      displayValue: v => `${v}%`,
    },
    {
      question: 'Quel abattement souhaitez-vous appliquer ?',
      hint: 'Le forfait 10% est automatique et plafonné à 14 171 €. Les frais réels sont déductibles si supérieurs au forfait (transport, repas, outils…).',
      ref: 'Les frais réels nécessitent une justification et une déclaration spécifique dans votre déclaration d\'impôts.',
      type: 'choice',
      strValue: inputs.useFraisReels ? 'reel' : 'forfait',
      onChoice: v => set('useFraisReels')(v === 'reel'),
      options: [
        { value: 'forfait', label: 'Forfait 10%', sub: `Abattement auto ${fmt(r.abattement)}` },
        { value: 'reel', label: 'Frais réels', sub: 'Si vos frais > 10% du salaire' },
      ],
    },
  ]

  const pieData = [
    { name: 'Net perçu', value: Math.round(r.netIncome), fill: '#34d399' },
    { name: 'Cotisations', value: Math.round(r.cotisations), fill: '#f87171' },
    { name: 'IR', value: Math.round(r.ir), fill: '#fbbf24' },
  ]

  const scoreBg = r.analysis.score === 'excellent' || r.analysis.score === 'bon'
    ? 'rgba(52,211,153,0.06)' : r.analysis.score === 'moyen'
    ? 'rgba(241,192,134,0.06)' : 'rgba(248,113,113,0.08)'
  const scoreBorder = r.analysis.score === 'excellent' || r.analysis.score === 'bon'
    ? 'rgba(52,211,153,0.18)' : r.analysis.score === 'moyen'
    ? 'rgba(241,192,134,0.18)' : 'rgba(248,113,113,0.22)'

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Impôts IR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Receipt style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Impôts IR</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Barème IR 2025 · TMI · Optimisation fiscale</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
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
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
              onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
              style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => setInputs({ gross: 60000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false })}
              style={{ borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Guided mode panel */}
      {guidedMode && (
        <div style={{ marginBottom: 16 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {/* 3-column layout */}
      {!guidedMode && <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT: sticky inputs panel ── */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 style={{ width: 12, height: 12, color: COLOR }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Revenu brut */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Revenu brut annuel <FieldTooltip text="Salaire brut annuel avant toute déduction." />
                </Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Input
                    type="number"
                    value={inputs.gross}
                    onChange={e => set('gross')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontWeight: 600 }}
                  />
                  <ProfileFillButton onFill={p => { if (p.netMonthlySalary) set('gross')(Math.round(p.netMonthlySalary * 12 / 0.78)) }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', margin: 0 }}>
                  soit <span style={{ color: 'var(--text-em)', fontWeight: 600 }}>{fmt(inputs.gross / 12)}</span>/mois brut
                </p>
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Situation familiale */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Situation familiale <FieldTooltip text="Le quotient familial réduit l'impôt. Chaque enfant ajoute 0.5 part." />
                </Label>
                <Select value={String(inputs.parts)} onValueChange={v => set('parts')(+v)}>
                  <SelectTrigger style={{ height: 36, fontSize: 12 }}><SelectValue /></SelectTrigger>
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

              {/* Séparateur */}
              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Cotisations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Cotisations sociales <FieldTooltip text="~22% salarié privé, ~10% fonctionnaire." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.csRate}%</span>
                </div>
                <Slider min={0} max={25} step={0.5} value={[inputs.csRate]} onValueChange={([v]) => set('csRate')(v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => set('csRate')(10)}
                    style={{ fontSize: 10, color: inputs.csRate === 10 ? COLOR : 'var(--text-muted-c)', background: inputs.csRate === 10 ? `${COLOR}15` : 'transparent', border: `1px solid ${inputs.csRate === 10 ? COLOR + '40' : 'var(--card-dark-border)'}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >Fonctionnaire 10%</button>
                  <button
                    onClick={() => set('csRate')(22)}
                    style={{ fontSize: 10, color: inputs.csRate === 22 ? COLOR : 'var(--text-muted-c)', background: inputs.csRate === 22 ? `${COLOR}15` : 'transparent', border: `1px solid ${inputs.csRate === 22 ? COLOR + '40' : 'var(--card-dark-border)'}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >Salarié 22%</button>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>
                    Cotisations : <span style={{ color: '#f87171', fontWeight: 600 }}>{fmt(r.cotisations)}</span>
                    <span style={{ color: 'var(--text-subtle)', marginLeft: 4 }}>({fmt(r.cotisations / 12)}/mois)</span>
                  </p>
                </div>
              </div>

              {/* Séparateur */}
              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Abattement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Abattement <FieldTooltip text="Forfait 10% automatique. Frais réels si vos frais professionnels dépassent le forfait." />
                </Label>
                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--card-dark-border)', height: 34 }}>
                  <button
                    onClick={() => set('useFraisReels')(false)}
                    style={{ flex: 1, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: !inputs.useFraisReels ? `${COLOR}22` : 'transparent', color: !inputs.useFraisReels ? COLOR : 'var(--text-muted-c)', transition: 'all 0.15s' }}
                  >Forfait 10%</button>
                  <button
                    onClick={() => set('useFraisReels')(true)}
                    style={{ flex: 1, fontSize: 12, fontWeight: 600, border: 'none', borderLeft: '1px solid var(--card-dark-border)', cursor: 'pointer', background: inputs.useFraisReels ? `${COLOR}22` : 'transparent', color: inputs.useFraisReels ? COLOR : 'var(--text-muted-c)', transition: 'all 0.15s' }}
                  >Frais réels</button>
                </div>
                {inputs.useFraisReels
                  ? <Input type="number" value={inputs.fraisReels} onChange={e => set('fraisReels')(+e.target.value)} placeholder="Montant € de frais réels" style={{ height: 34, fontSize: 12 }} />
                  : <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>
                      Abattement forfaitaire : <span style={{ color: 'var(--text-em)', fontWeight: 600 }}>{fmt(r.abattement)}</span>
                      {r.abattement === 14171 && <span style={{ color: '#fbbf24', marginLeft: 4 }}>⚠ plafonné</span>}
                    </p>
                }
              </div>
            </div>
          </div>

          {/* Mini résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, margin: '0 0 8px' }}>Résumé fiscal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'TMI', value: `${r.tmi}%`, color: r.tmi >= 41 ? '#f87171' : r.tmi >= 30 ? '#fbbf24' : '#34d399' },
                { label: 'Taux moyen IR', value: fmtPct(r.avgRate), color: 'var(--text-em)' },
                { label: 'Pression totale', value: fmtPct(r.effectivePressure), color: 'var(--text-em)' },
                { label: 'Net mensuel', value: fmt(r.netIncome / 12), color: '#34d399' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: brackets + KPIs + détail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Impôt total', value: fmt(r.ir), sub: `Taux moyen ${fmtPct(r.avgRate)}`, color: '#fbbf24' },
              { label: 'Taux moyen', value: fmtPct(r.avgRate), sub: 'sur revenu imposable', color: 'var(--text-primary)' },
              { label: 'TMI', value: `${r.tmi}%`, sub: 'Tranche marginale', color: r.tmi >= 41 ? '#f87171' : r.tmi >= 30 ? '#fbbf24' : '#34d399' },
              { label: 'Revenu net', value: fmt(r.netIncome), sub: `${fmt(r.netIncome / 12)}/mois`, color: '#34d399' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Tax brackets table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Tranches d&apos;imposition 2024</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Barème progressif · votre tranche active est mise en évidence</p>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-dark-border)', background: 'var(--row-hover)' }}>
                  {['Tranche', 'Taux', 'Base taxable', 'IR dû', 'Cumul'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 14px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.brackets.map((b, i) => {
                  const cumul = r.brackets.slice(0, i + 1).reduce((s, x) => s + x.ir, 0)
                  return (
                    <tr key={i} style={{
                      borderBottom: i < r.brackets.length - 1 ? '1px solid var(--section-border)' : 'none',
                      background: b.active ? `${COLOR}0a` : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                      <td style={{ padding: '9px 14px', color: b.active ? 'var(--text-em)' : 'var(--text-muted-c)', fontFamily: 'monospace', fontSize: 11 }}>
                        {b.active && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: COLOR, marginRight: 6, verticalAlign: 'middle' }} />}
                        {b.label}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: b.active ? 800 : 500, color: b.active ? COLOR : 'var(--text-muted-c)', fontSize: b.active ? 13 : 12 }}>{b.rate}%</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', color: b.active ? 'var(--text-em)' : 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmt(b.taxable)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: b.active ? 700 : 400, fontVariantNumeric: 'tabular-nums', color: b.active ? '#fbbf24' : 'var(--text-muted-c)' }}>{fmt(b.ir)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: b.active ? 'var(--text-em)' : 'var(--text-subtle)' }}>{fmt(cumul)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Détail du calcul */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Détail du calcul</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Décomposition étape par étape</p>
            </div>
            <div style={{ padding: '0 16px' }}>
              {[
                { label: 'Revenu brut', value: fmt(inputs.gross), help: 'Point de départ' },
                { label: `Cotisations (${inputs.csRate}%)`, value: `− ${fmt(r.cotisations)}`, variant: 'red', help: 'Charges salariales' },
                { label: 'Net avant impôt', value: fmt(r.netBeforeTax), bold: true },
                { label: inputs.useFraisReels ? 'Frais réels' : 'Abattement 10%', value: `− ${fmt(r.abattement)}`, variant: 'green', help: 'Déduction professionnelle' },
                { label: 'Revenu imposable', value: fmt(r.imposable), bold: true },
                { label: `IR (${r.tmi}% TMI)`, value: `− ${fmt(r.ir)}`, variant: 'red', help: 'Barème progressif 2024' },
                { label: 'Revenu net', value: fmt(r.netIncome), bold: true, big: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 6 ? '1px solid var(--section-border)' : 'none' }}>
                  <span style={{ fontSize: 13, color: row.bold ? 'var(--text-em)' : 'var(--text-muted-c)', fontWeight: row.bold ? 500 : 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.label}{row.help && <FieldTooltip text={row.help} />}
                  </span>
                  <span style={{ fontSize: row.big ? 15 : 13, fontWeight: row.bold ? 700 : 500, fontVariantNumeric: 'tabular-nums', color: row.big ? '#34d399' : row.variant === 'red' ? '#f87171' : row.variant === 'green' ? '#34d399' : 'var(--text-em)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: analyse + tips + répartition ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse pression fiscale */}
          <div style={{ background: scoreBg, border: `1px solid ${scoreBorder}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${score.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <score.icon style={{ width: 14, height: 14, color: score.color }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Analyse fiscale</p>
                <p style={{ fontSize: 11, color: score.color, margin: 0 }}>Pression {score.label}</p>
              </div>
            </div>

            {/* Barre répartition */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--row-hover)', marginBottom: 8 }}>
                <div style={{ background: '#34d399', transition: 'width 0.5s', width: `${r.netIncome / inputs.gross * 100}%` }} />
                <div style={{ background: '#f87171', transition: 'width 0.5s', width: `${r.cotisations / inputs.gross * 100}%` }} />
                <div style={{ background: '#fbbf24', transition: 'width 0.5s', width: `${r.ir / inputs.gross * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[['#34d399', `Net ${Math.round(r.netIncome / inputs.gross * 100)}%`], ['#f87171', `CS ${Math.round(r.cotisations / inputs.gross * 100)}%`], ['#fbbf24', `IR ${Math.round(r.ir / inputs.gross * 100)}%`]].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted-c)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />{label}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, margin: 0 }}>{r.analysis.message}</p>
          </div>

          {/* Répartition donut */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: '0 0 12px' }}>Où va chaque euro brut</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
                {pieData.map((e) => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.fill, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{e.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(e.value)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 5 }}>{Math.round(e.value / inputs.gross * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pistes d'optimisation */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Pistes d&apos;optimisation</p>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.analysis.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--card-dark-border)' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>}
    </div>
  )
}

export default function TaxPage() {
  return <Suspense><TaxPageInner /></Suspense>
}
