'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFire, type FireInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, RefreshCw, BookOpen, Settings2, GitCompare, Flame } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useChartTheme } from '@/lib/chart-theme'

const COLOR = '#34d399'

function FirePageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<FireInputs>({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const set = (k: keyof FireInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [importingPatrimoine, setImportingPatrimoine] = useState(false)
  const [patrimoineImported, setPatrimoineImported] = useState<number | null>(null)
  const [guidedMode, setGuidedMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('fire-guided-done')
  })
  const [guidedStep, setGuidedStep] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem('fire-banner-dismissed')
  })
  const [inputsB, setInputsB] = useState<FireInputs>({ income: 60000, expenses: 30000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const setB = (k: keyof FireInputs) => (v: number) => setInputsB(p => ({ ...p, [k]: v }))
  const rB = useMemo(() => calcFire(inputsB), [inputsB])

  const importFromPatrimoine = async () => {
    setImportingPatrimoine(true)
    try {
      const res = await fetch('/api/patrimoine/envelopes')
      if (!res.ok) return
      const envelopes: { type: string; totalValue: number | null; metadata: Record<string, unknown>; positions: { pru: number; quantity: number }[] }[] = await res.json()
      const total = envelopes.reduce((sum, e) => {
        if (e.type === 'IMMOBILIER') return sum + Number(e.metadata.currentValue ?? 0)
        if (e.totalValue !== null) return sum + e.totalValue
        return sum + e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
      }, 0)
      if (total > 0) {
        setInputs(p => ({ ...p, netWorth: Math.round(total) }))
        setPatrimoineImported(Math.round(total))
      }
    } catch { /* ignore */ }
    finally { setImportingPatrimoine(false) }
  }

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.currentSavings !== undefined && p.netWorth === undefined) {
        const monthlyExp = p.monthlyExpenses ?? 2000
        const monthlyInv = p.monthlyInvestment ?? 1000
        setInputs({ income: (monthlyExp + monthlyInv) * 12, expenses: monthlyExp * 12, netWorth: p.currentSavings, rate: p.returnRate ?? 7, withdrawalRate: p.withdrawalRate ?? 4 })
      } else {
        setInputs(p as FireInputs)
      }
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcFire(inputs), [inputs])

  const score = r.savingsRate >= 50 ? 'excellent' : r.savingsRate >= 30 ? 'bon' : r.savingsRate >= 15 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    faible: { label: 'Faible', Icon: AlertCircle, color: '#f87171' },
  }[score]

  const tips: string[] = []
  if (r.savingsRate < 20) tips.push('Un taux d\'épargne < 20% rallonge considérablement le chemin. Identifiez les postes à réduire en priorité.')
  if (inputs.withdrawalRate > 4) tips.push('Un taux de retrait > 4% augmente le risque d\'épuiser le capital. La règle des 4% est éprouvée sur 30 ans.')
  if (inputs.rate > 8) tips.push(`Un rendement de ${inputs.rate}% est optimiste. Prévoyez un scénario pessimiste à 5%.`)
  if (r.savingsRate >= 50) tips.push('Excellent taux d\'épargne ! Optimisez vos enveloppes fiscales : PEA, assurance-vie, PER.')
  if (tips.length === 0) tips.push('Bonne progression. Maintenez la discipline et revoyez vos hypothèses annuellement.')

  const progressColor = r.progressPct >= 75 ? '#34d399' : r.progressPct >= 50 ? '#fbbf24' : r.progressPct >= 25 ? '#fb923c' : '#f87171'
  const scoreBorderColor = score === 'excellent' || score === 'bon' ? 'rgba(52,211,153,0.35)' : score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'

  // Projection data for center chart
  const projectionData = useMemo(() => {
    const years = Math.min(r.yearsToFire > 99 ? 40 : r.yearsToFire + 5, 50)
    return Array.from({ length: years + 1 }, (_, y) => {
      let nw = inputs.netWorth
      for (let i = 0; i < y; i++) nw = nw * (1 + inputs.rate / 100) + r.annualSavings
      return { year: y, patrimoine: Math.round(Math.max(nw, 0)), objectif: Math.round(r.target) }
    })
  }, [inputs, r])

  // Donut data for right panel
  const donutData = [
    { name: 'Épargne', value: Math.max(r.annualSavings, 0), color: COLOR },
    { name: 'Dépenses', value: inputs.expenses, color: '#f87171' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quel est votre revenu annuel net ?', hint: 'Total perçu chaque année après impôts et cotisations.', ref: 'Salaire médian France net : ~28 000 €/an.', suffix: '€/an', value: inputs.income, onChange: v => set('income')(v) },
    { question: 'Combien dépensez-vous par an ?', hint: 'Vos dépenses totales annuelles. C\'est aussi le revenu passif dont vous aurez besoin à la retraite.', ref: 'Chaque 100 €/mois économisé raccourcit votre chemin FIRE de ~3 ans.', suffix: '€/an', value: inputs.expenses, onChange: v => set('expenses')(v) },
    { question: 'Quel est votre patrimoine actuel investi ?', hint: 'Total de vos actifs : PEA, assurance-vie, épargne, immo locatif…', ref: 'Patrimoine médian France (35-44 ans) : ~120 000 €.', suffix: '€', value: inputs.netWorth, onChange: v => { set('netWorth')(v); setPatrimoineImported(null) } },
    { type: 'slider', question: 'Quel rendement annuel attendez-vous ?', hint: 'Rendement moyen de votre portefeuille. Soyez conservateur.', ref: 'ETF MSCI World historique : ~7-8%/an sur 30 ans.', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 1, max: 15, stepSize: 0.5 },
    { type: 'slider', question: 'Quel taux de retrait envisagez-vous ?', hint: 'Pourcentage du patrimoine retiré chaque année à la retraite. 4% est la règle classique.', ref: 'Règle des 4% (Trinity Study) : durable sur 30 ans. 3.5% pour une longue retraite.', suffix: '%', value: inputs.withdrawalRate, onChange: v => set('withdrawalRate')(v), min: 2, max: 6, stepSize: 0.1 },
  ]

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>FI/RE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>FI/RE</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Indépendance Financière · Règle des 4% · Date FIRE</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'FI/RE',
              subtitle: 'Financial Independence, Retire Early',
              kpis: [
                { label: 'Patrimoine FIRE cible', value: fmt(r.target), highlight: true },
                { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans` },
                { label: "Taux d'épargne", value: fmtPct(r.savingsRate) },
                { label: 'Progression', value: fmtPct(r.progressPct) },
              ],
              inputs: [
                { label: 'Revenu net annuel', value: fmt(inputs.income) },
                { label: 'Dépenses annuelles', value: fmt(inputs.expenses) },
                { label: 'Patrimoine actuel', value: fmt(inputs.netWorth) },
                { label: 'Rendement attendu', value: `${inputs.rate}%` },
                { label: 'Taux de retrait', value: `${inputs.withdrawalRate}%` },
              ],
              sections: [{ title: 'Détail', items: [
                { label: 'Épargne annuelle', value: fmt(r.annualSavings) },
                { label: 'Revenu passif mensuel cible', value: fmt(r.monthlyPassive) },
              ]}],
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="fire" name={`FI/RE ${r.yearsToFire}ans`} inputs={inputs as any} results={r as any} />
            <Button variant={compareMode ? 'default' : 'outline'} size="sm"
              onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, expenses: Math.round(inputs.expenses * 0.85) }) }}
              style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
            </Button>
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
              onClick={() => { const next = !guidedMode; setGuidedMode(next); setGuidedStep(0); if (!next) localStorage.setItem('fire-guided-done', '1') }}
              style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => setInputs({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Bon à savoir banner */}
      {!bannerDismissed && !guidedMode && (
        <div style={{ marginTop: 16, background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 3 }}>Bon à savoir — FI/RE</p>
            <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, lineHeight: 1.5 }}>
              La règle des 4% (Trinity Study) suggère qu'un patrimoine dure 30 ans si vous retirez 4%/an. Ajustez selon votre horizon : 3.5% pour une retraite de 40 ans+, 5% si vous avez d'autres revenus.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('fire-banner-dismissed', '1'); setBannerDismissed(true) }} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 16, lineHeight: 1, padding: 2 }} aria-label="Fermer">×</button>
        </div>
      )}

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginTop: 16 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => { localStorage.setItem('fire-guided-done', '1'); setGuidedMode(false) }}
          />
        </div>
      )}

      {/* 3-column grid */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Paramètres card */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Flame style={{ width: 12, height: 12, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.netMonthlySalary) set('income')(p.netMonthlySalary * 12)
                  if (p.monthlyExpenses) set('expenses')(p.monthlyExpenses * 12)
                  if (p.currentAssets) set('netWorth')(p.currentAssets)
                }} />
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Revenu annuel net<FieldTooltip text="Revenu annuel net après impôts. Ce qui rentre réellement sur votre compte chaque année." />
                  </label>
                  <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Dépenses annuelles<FieldTooltip text="Vos dépenses totales. C'est aussi le montant dont vous aurez besoin chaque année à la retraite." />
                  </label>
                  <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0 }}>Moyenne France : 22 000€/an · Médiane couple : 38 000€/an</p>
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Patrimoine actuel<FieldTooltip text="Total de vos actifs investis : épargne, PEA, assurance-vie, immo locatif..." />
                    </label>
                    <button
                      onClick={importFromPatrimoine}
                      disabled={importingPatrimoine}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: `1px solid ${COLOR}30`, background: patrimoineImported ? `${COLOR}10` : 'transparent', color: COLOR, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: importingPatrimoine ? 0.6 : 1 }}>
                      <RefreshCw style={{ width: 11, height: 11, animation: importingPatrimoine ? 'spin 1s linear infinite' : 'none' }} />
                      {patrimoineImported ? `${(patrimoineImported / 1000).toFixed(0)}k€` : 'Importer'}
                    </button>
                  </div>
                  <Input type="number" value={inputs.netWorth} onChange={e => { set('netWorth')(+e.target.value); setPatrimoineImported(null) }} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Rendement attendu<FieldTooltip text="ETF World historique : 7-9% nominal. Soyez conservateur : 5-7%." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{inputs.rate}%</span>
                  </div>
                  <Slider min={1} max={15} step={0.5} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(5)}>Prudent 5%</button>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(7)}>Standard 7%</button>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(9)}>Optimiste 9%</button>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Taux de retrait<FieldTooltip text="La règle des 4% (Trinity Study) : retraite durable sur 30 ans. 3.5% pour une longue retraite." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{inputs.withdrawalRate}%</span>
                  </div>
                  <Slider min={2} max={6} step={0.1} value={[inputs.withdrawalRate]} onValueChange={([v]) => set('withdrawalRate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--p-text-dim)' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('withdrawalRate')(3.5)}>Prudent 3.5%</button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('withdrawalRate')(4)}>Standard 4%</button>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0 }}>
                    → Avec {(r.target / 1000).toFixed(0)}k€ patrimoine FIRE, {inputs.withdrawalRate}% = <strong style={{ color: 'var(--p-text-dim)' }}>{fmt(r.target * inputs.withdrawalRate / 100)}/an</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Mini-résumé */}
            <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
              {[
                { label: 'Épargne annuelle', value: fmt(r.annualSavings), color: r.annualSavings >= 0 ? COLOR : '#f87171' },
                { label: 'Revenu passif cible/mois', value: fmt(r.monthlyPassive) },
                { label: 'Manque au capital', value: fmt(Math.max(0, r.target - inputs.netWorth)) },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 8 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{k.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: k.color ?? 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Objectif FIRE', value: fmt(r.target), color: COLOR },
                { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans`, color: 'var(--p-text)' },
                { label: "Taux d'épargne", value: fmtPct(r.savingsRate), color: scoreConf.color },
                { label: 'Progression', value: fmtPct(r.progressPct), color: progressColor },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 4, letterSpacing: '0.04em' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Progression bar */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>Progression vers l&apos;indépendance</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: progressColor }}>{fmtPct(r.progressPct)}</span>
              </div>
              <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.7s', width: `${Math.min(r.progressPct, 100)}%`, background: progressColor }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--p-text-dim)' }}>
                <span>{fmt(inputs.netWorth)}</span>
                <span>Objectif : {fmt(r.target)}</span>
              </div>
            </div>

            {/* Projection chart */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 12 }}>Projection patrimoine vers l&apos;objectif FIRE</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={projectionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                  <YAxis tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any, name: string) => [fmt(v), name === 'patrimoine' ? 'Patrimoine' : 'Objectif FIRE']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="patrimoine" name="Patrimoine" stroke={COLOR} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="objectif" name="Objectif FIRE" stroke="#f87171" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <CsvExport
                  data={projectionData.map(d => ({ 'Année': d.year, 'Patrimoine': d.patrimoine, 'Objectif FIRE': d.objectif }))}
                  filename="fire-projection.csv"
                />
              </div>
            </div>

            {/* Jalons clés */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 10 }}>Jalons clés</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[25, 50, 75, 100].map(pct => {
                  let nw = inputs.netWorth
                  let y = 0
                  const target = r.target * pct / 100
                  while (nw < target && y < 100) { nw = nw * (1 + inputs.rate / 100) + r.annualSavings; y++ }
                  const reached = nw >= target
                  return (
                    <div key={pct} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: inputs.netWorth >= target ? `${COLOR}08` : 'transparent', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{pct}% de l&apos;objectif · {fmt(target)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: inputs.netWorth >= target ? COLOR : 'var(--p-text-em)' }}>
                        {inputs.netWorth >= target ? 'Atteint ✓' : reached ? `dans ${y} ans` : '> 100 ans'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Analyse */}
            <div style={{ background: 'var(--p-card)', border: `1px solid ${scoreBorderColor}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <scoreConf.Icon style={{ width: 15, height: 15, color: scoreConf.color }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Analyse — {scoreConf.label}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                {score === 'excellent' && `Taux d'épargne exceptionnel. Vous atteindrez l'indépendance financière en ${r.yearsToFire} ans. La règle des ${inputs.withdrawalRate}% vous offre ${fmt(r.monthlyPassive)}/mois.`}
                {score === 'bon' && `Bon taux d'épargne de ${fmtPct(r.savingsRate)}. En maintenant ce rythme, l'indépendance financière dans ${r.yearsToFire} ans est réaliste.`}
                {score === 'moyen' && `Taux d'épargne correct mais perfectible. Chaque point de pourcentage supplémentaire raccourcit votre chemin.`}
                {score === 'faible' && `Taux d'épargne insuffisant pour le FIRE. Priorité : réduire les dépenses ou augmenter les revenus.`}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-dim)', marginBottom: 6 }}>Règle des 4%</p>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.5 }}>
                Patrimoine cible = Dépenses annuelles × 25 = {fmt(inputs.expenses)} × 25 = <strong style={{ color: 'var(--p-text-em)' }}>{fmt(r.target)}</strong>
              </p>
            </div>

            {/* Donut revenu / dépenses / épargne */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 10 }}>Allocation revenu</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={160} height={120}>
                  <Pie data={donutData} cx={80} cy={60} innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} />
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-em)' }}>{fmt(d.value)}/an</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: `${COLOR}07`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 6 }}>Optimisez votre trajectoire</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5, marginBottom: 8 }}>Simulez l&apos;impact des intérêts composés sur votre épargne mensuelle.</p>
              <a href="/dashboard/compound" style={{ fontSize: 11, color: COLOR, textDecoration: 'none', fontWeight: 600 }}>→ Simulateur intérêts composés</a>
            </div>
          </div>
        </div>
      )}

      {/* Comparateur A/B */}
      {compareMode && !guidedMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--p-line)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text)', margin: 0 }}>Comparateur de scénarios</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {([
              { label: 'Scénario A', color: '#B07820', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ] as const).map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--p-card)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'income' as keyof FireInputs, label: 'Revenu annuel net (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                    { key: 'expenses' as keyof FireInputs, label: 'Dépenses annuelles (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                    { key: 'netWorth' as keyof FireInputs, label: 'Patrimoine actuel (€)', type: 'input', min: 0, max: 2000000, step: 10000 },
                    { key: 'rate' as keyof FireInputs, label: `Rendement : ${inp.rate}%`, type: 'slider', min: 1, max: 15, step: 0.5 },
                    { key: 'withdrawalRate' as keyof FireInputs, label: `Taux retrait : ${inp.withdrawalRate}%`, type: 'slider', min: 2, max: 6, step: 0.1 },
                  ]).map(({ key, label: l, type: ft, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: 'var(--p-text-dim)', marginBottom: 6 }}>{l}</div>
                      {ft === 'input'
                        ? <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 34, fontSize: 13 }} />
                        : <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'FIRE A', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans`, color: '#B07820' },
              { label: 'FIRE B', value: rB.yearsToFire > 99 ? '+100 ans' : `${rB.yearsToFire} ans`, color: '#818cf8' },
              { label: 'Différence', value: (() => { const d = r.yearsToFire - rB.yearsToFire; return d === 0 ? 'Identique' : `${d > 0 ? 'B gagne' : 'A gagne'} ${Math.abs(d)} ans` })(), color: r.yearsToFire !== rB.yearsToFire ? '#34d399' : 'var(--p-text-dim)' },
              { label: 'Cible B vs A', value: (() => { const d = rB.target - r.target; return `${d >= 0 ? '+' : ''}${fmt(d)}` })(), color: rB.target < r.target ? '#34d399' : '#fb923c' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FirePage() {
  return <Suspense><FirePageInner /></Suspense>
}
