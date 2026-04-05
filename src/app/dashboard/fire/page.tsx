'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFire, type FireInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle, RefreshCw, BookOpen, Settings2, GitCompare } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

const COLOR = '#fb923c'

function FirePageInner() {
  const [inputs, setInputs] = useState<FireInputs>({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })
  const set = (k: keyof FireInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [importingPatrimoine, setImportingPatrimoine] = useState(false)
  const [patrimoineImported, setPatrimoineImported] = useState<number | null>(null)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
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

  const progressColor = r.progressPct >= 75 ? 'hsl(160 84% 39%)' : r.progressPct >= 50 ? 'hsl(38 92% 50%)' : r.progressPct >= 25 ? 'hsl(38 60% 50%)' : 'hsl(0 72% 51%)'

  const scoreBorderColor = score === 'excellent' || score === 'bon' ? 'rgba(52,211,153,0.35)' : score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>FI/RE</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Simulateur FI/RE <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400, marginLeft: 6 }}>Indépendance financière · retraite anticipée</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="fire" name={`FI/RE ${r.yearsToFire}ans`} inputs={inputs as any} results={r as any} />
          <Button variant={compareMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, expenses: Math.round(inputs.expenses * 0.85) }) }}
            style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
          </Button>
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Mode expert' : 'Mode guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => setInputs({ income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 })}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Patrimoine FIRE cible</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.target)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Années avant FIRE</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{r.yearsToFire > 99 ? '+100' : `${r.yearsToFire} ans`}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Taux d&apos;épargne</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmtPct(r.savingsRate)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Progression</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmtPct(r.progressPct)}</p>
        </div>
      </div>

      {guidedMode && (
        <GuidedModePanel
          steps={[
            { question: 'Quel est votre revenu annuel net ?', hint: 'Total perçu chaque année après impôts et cotisations. Si vous avez un salaire mensuel, multipliez-le par 12.', ref: 'Salaire médian France net : ~28 000 €/an. Objectif FIRE : maximiser l\'écart revenu / dépenses.', suffix: '€/an', value: inputs.income, onChange: v => set('income')(v) },
            { question: 'Combien dépensez-vous par an ?', hint: 'Total de vos dépenses annuelles. C\'est aussi le revenu passif dont vous aurez besoin à la retraite — réduire ce chiffre est le levier le plus puissant.', ref: 'Moyenne France : ~22 000 €/an. Chaque 100 €/mois économisé raccourcit votre chemin FIRE de ~3 ans.', suffix: '€/an', value: inputs.expenses, onChange: v => set('expenses')(v) },
            { question: 'Quel est votre patrimoine actuel investi ?', hint: 'Total de vos actifs : PEA, assurance-vie, épargne, immo locatif… Tout ce qui travaille pour vous.', ref: 'Patrimoine médian France (35-44 ans) : ~120 000 €. Chaque euro investi aujourd\'hui vaut bien plus demain.', suffix: '€', value: inputs.netWorth, onChange: v => { set('netWorth')(v); setPatrimoineImported(null) } },
            { type: 'slider', question: 'Quel rendement annuel attendez-vous ?', hint: 'Rendement moyen de votre portefeuille. Soyez conservateur — mieux vaut être agréablement surpris.', ref: 'ETF MSCI World historique : ~7-8%/an sur 30 ans. Prévoyez un scénario pessimiste à 5%.', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 1, max: 15, stepSize: 0.5 },
            { type: 'slider', question: 'Quel taux de retrait envisagez-vous ?', hint: 'Pourcentage de votre patrimoine que vous retirez chaque année à la retraite. 4% est la règle classique.', ref: 'Règle des 4% (Trinity Study) : durable sur 30 ans. 3.5% pour une longue retraite ou une sécurité maximale.', suffix: '%', value: inputs.withdrawalRate, onChange: v => set('withdrawalRate')(v), min: 2, max: 6, stepSize: 0.1 },
          ] satisfies GuidedStep[]}
          currentStep={guidedStep}
          onStepChange={setGuidedStep}
          onFinish={() => setGuidedMode(false)}
        />
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Input panel */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
            <ProfileFillButton onFill={p => {
              if (p.netMonthlySalary) set('income')(p.netMonthlySalary * 12)
              if (p.monthlyExpenses) set('expenses')(p.monthlyExpenses * 12)
              if (p.currentAssets)   set('netWorth')(p.currentAssets)
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Revenu annuel net<Tip text="Revenu annuel net après impôts. Ce qui rentre réellement sur votre compte chaque année." /></Label>
            <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Dépenses annuelles<Tip text="Vos dépenses totales. C'est aussi le montant dont vous aurez besoin chaque année à la retraite. Réduire ce chiffre est le levier le plus puissant." /></Label>
            <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Patrimoine actuel<Tip text="Total de vos actifs investis : épargne, PEA, assurance-vie, immo locatif..." /></Label>
              <button
                onClick={importFromPatrimoine}
                disabled={importingPatrimoine}
                title="Importer depuis mon patrimoine"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
                  borderRadius: 6, border: '1px solid rgba(241,192,134,0.30)',
                  background: patrimoineImported ? 'rgba(241,192,134,0.10)' : 'transparent',
                  color: '#f1c086', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  opacity: importingPatrimoine ? 0.6 : 1, transition: 'all 0.15s',
                }}
              >
                <RefreshCw style={{ width: 11, height: 11, animation: importingPatrimoine ? 'spin 1s linear infinite' : 'none' }} />
                {patrimoineImported ? `${(patrimoineImported / 1000).toFixed(0)} k€ importés` : 'Importer'}
              </button>
            </div>
            <Input type="number" value={inputs.netWorth} onChange={e => { set('netWorth')(+e.target.value); setPatrimoineImported(null) }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Rendement attendu<Tip text="ETF World historique : 7-9% nominal. Soyez conservateur : 5-7%." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.rate}%</span>
            </div>
            <Slider min={1} max={15} step={0.5} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Taux de retrait<Tip text="La règle des 4% (Trinity Study) : retraite durable sur 30 ans. 3.5% pour une longue retraite." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.withdrawalRate}%</span>
            </div>
            <Slider min={2} max={6} step={0.1} value={[inputs.withdrawalRate]} onValueChange={([v]) => set('withdrawalRate')(v)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted-c)' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('withdrawalRate')(3.5)}>Prudent 3.5%</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('withdrawalRate')(4)}>Standard 4%</button>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Progress bar section */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Progression vers l&apos;indépendance</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted-c)' }}>Patrimoine actuel</span>
              <span style={{ fontWeight: 600, color: progressColor }}>{fmtPct(r.progressPct)} atteint</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.7s', width: `${Math.min(r.progressPct, 100)}%`, background: progressColor }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted-c)' }}>
              <span>{fmt(inputs.netWorth)}</span>
              <span>Objectif : {fmt(r.target)}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--card-dark-border)', marginTop: 20, paddingTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[
                { label: 'Épargne annuelle', value: fmt(r.annualSavings), color: r.annualSavings >= 0 ? '#34d399' : '#f87171' },
                { label: 'Taux d\'épargne', value: fmtPct(r.savingsRate), color: scoreConf.color },
                { label: 'Manque au capital', value: fmt(Math.max(0, r.target - inputs.netWorth)), color: 'var(--text-primary)' },
                { label: 'Revenu passif / mois', value: fmt(r.monthlyPassive), color: 'var(--text-primary)' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: k.color, fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CSV Export */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <CsvExport
              data={Array.from({ length: Math.min(r.yearsToFire + 1, 100) }, (_, y) => {
                let nw = inputs.netWorth
                for (let i = 0; i < y; i++) nw = nw * (1 + inputs.rate / 100) + r.annualSavings
                return { 'Année': y, 'Patrimoine': Math.round(nw).toFixed(0), 'Cible FIRE': Math.round(r.target).toFixed(0), 'Progression (%)': Math.min(nw / r.target * 100, 100).toFixed(1) }
              })}
              filename="fire-projection.csv"
              label="Exporter projection CSV"
            />
          </div>

          {/* Analysis / tips */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreBorderColor}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Analyse — Taux d&apos;épargne {scoreConf.label} ({fmtPct(r.savingsRate)})
              </p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 16 }}>
              {score === 'excellent' && `Taux d'épargne exceptionnel — vous atteindrez l'indépendance financière en ${r.yearsToFire} ans. Optimisez vos enveloppes fiscales pour maximiser l'effet composé.`}
              {score === 'bon' && `Bon taux d'épargne de ${fmtPct(r.savingsRate)}. En maintenant ce rythme, l'indépendance financière dans ${r.yearsToFire} ans est réaliste.`}
              {score === 'moyen' && `Taux d'épargne correct mais perfectible. Chaque point de pourcentage supplémentaire raccourcit votre chemin.`}
              {score === 'faible' && `Taux d'épargne insuffisant pour le FIRE. Priorité : réduire les dépenses ou augmenter les revenus.`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Comparateur A/B ── */}
      {compareMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--card-dark-border)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Scénario A vs Scénario B côte à côte</span>
          </div>

          {/* Two input panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {([
              { label: 'Scénario A', color: '#f1c086', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ] as const).map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--card-dark)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'income' as keyof FireInputs,       label: 'Revenu annuel net (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                    { key: 'expenses' as keyof FireInputs,     label: 'Dépenses annuelles (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                    { key: 'netWorth' as keyof FireInputs,     label: 'Patrimoine actuel (€)', type: 'input', min: 0, max: 2000000, step: 10000 },
                    { key: 'rate' as keyof FireInputs,         label: `Rendement : ${inp.rate}%`, type: 'slider', min: 1, max: 15, step: 0.5 },
                    { key: 'withdrawalRate' as keyof FireInputs, label: `Taux retrait : ${inp.withdrawalRate}%`, type: 'slider', min: 2, max: 6, step: 0.1 },
                  ]).map(({ key, label: l, type: ft, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 6 }}>{l}</div>
                      {ft === 'input'
                        ? <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 34, fontSize: 13 }} />
                        : <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'FIRE A — ans restants', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans`, color: '#f1c086' },
              { label: 'FIRE B — ans restants', value: rB.yearsToFire > 99 ? '+100 ans' : `${rB.yearsToFire} ans`, color: '#818cf8' },
              { label: 'Différence',
                value: (() => { const d = r.yearsToFire - rB.yearsToFire; return d === 0 ? 'Identique' : `${d > 0 ? 'B gagne' : 'A gagne'} ${Math.abs(d)} ans` })(),
                color: r.yearsToFire !== rB.yearsToFire ? '#34d399' : 'var(--text-muted-c)' },
              { label: 'Cible B vs A',
                value: (() => { const d = rB.target - r.target; return `${d >= 0 ? '+' : ''}${fmt(d)}` })(),
                color: rB.target < r.target ? '#34d399' : '#fb923c' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Comparison chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Projection patrimoniale comparée — {Math.max(r.yearsToFire, rB.yearsToFire, 1)} ans
            </p>
            {(() => {
              const yearsMax = Math.min(Math.max(r.yearsToFire, rB.yearsToFire, 10), 60)
              const data = Array.from({ length: yearsMax + 1 }, (_, y) => {
                let nwA = inputs.netWorth
                let nwB = inputsB.netWorth
                for (let i = 0; i < y; i++) {
                  nwA = nwA * (1 + inputs.rate / 100) + r.annualSavings
                  nwB = nwB * (1 + inputsB.rate / 100) + rB.annualSavings
                }
                return { year: y, 'Scénario A': Math.round(Math.max(nwA, 0)), 'Scénario B': Math.round(Math.max(nwB, 0)), 'Cible A': Math.round(r.target), 'Cible B': Math.round(rB.target) }
              })
              const { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip: RTooltip, Legend, ResponsiveContainer: RC } = require('recharts')
              return (
                <RC width="100%" height={200}>
                  <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} tickFormatter={(v: number) => `${v}a`} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                    <RTooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scénario A" stroke="#f1c086" strokeWidth={2.5} dot={false} animationDuration={800} />
                    <Line type="monotone" dataKey="Scénario B" stroke="#818cf8" strokeWidth={2.5} dot={false} animationDuration={800} />
                    <Line type="monotone" dataKey="Cible A" stroke="#f1c08640" strokeWidth={1.5} dot={false} strokeDasharray="5 5" animationDuration={800} />
                    <Line type="monotone" dataKey="Cible B" stroke="#818cf840" strokeWidth={1.5} dot={false} strokeDasharray="5 5" animationDuration={800} />
                  </LineChart>
                </RC>
              )
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default function FirePage() {
  return <Suspense><FirePageInner /></Suspense>
}
