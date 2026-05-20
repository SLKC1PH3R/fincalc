'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcFire, type FireInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, RefreshCw, BookOpen, Settings2, GitCompare, Flame } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'

const C = '#34d399'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

function FireChart({ data, target }: { data: { year: number; Patrimoine: number }[]; target: number }) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const maxV = Math.max(...data.map(d => d.Patrimoine), target) * 1.06 || 1
  const N = data.length - 1
  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / maxV, 1) * h
  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.Patrimoine) }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[N].x},${PAD.t + h} L${pts[0].x},${PAD.t + h} Z`
  const targetY = yOf(target)
  const mDots: { x: number; y: number; label: string }[] = []
  ;[0.25, 0.5, 0.75, 1].forEach(pct => {
    const t = target * pct
    const idx = data.findIndex(d => d.Patrimoine >= t)
    if (idx > 0) mDots.push({ x: pts[Math.min(idx, N)].x, y: pts[Math.min(idx, N)].y, label: `${pct * 100 | 0}%` })
  })
  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="fgP" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.32} />
          <stop offset="100%" stopColor={C} stopOpacity={0.03} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = yOf(t)
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" letterSpacing="0.03em">{fmtK(t)}</text>
          </g>
        )
      })}
      <line x1={PAD.l} x2={W - PAD.r} y1={targetY} y2={targetY} stroke="#f87171" strokeWidth={1.2} strokeDasharray="6 4" opacity={0.8} />
      <text x={W - PAD.r - 4} y={targetY - 5} textAnchor="end" fontSize={9} fontFamily="var(--p-mono)" fill="#f87171" fontWeight={700} letterSpacing="0.06em">FIRE</text>
      <path d={area} fill="url(#fgP)" />
      <path d={line} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      {mDots.map((m, i) => (
        <g key={i}>
          <line x1={m.x} y1={PAD.t + h} x2={m.x} y2={m.y} stroke={C} strokeWidth={1} opacity={0.22} strokeDasharray="2 3" />
          <circle cx={m.x} cy={m.y} r={7} fill="var(--p-card)" stroke={C} strokeWidth={1.5} />
          <circle cx={m.x} cy={m.y} r={3} fill={C} />
          <text x={m.x} y={PAD.t + h + 15} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-dim)" fontWeight={700} letterSpacing="0.04em">{m.label}</text>
        </g>
      ))}
      <circle cx={pts[N].x} cy={pts[N].y} r={4.5} fill={C} />
      <circle cx={pts[N].x} cy={pts[N].y} r={10} fill={C} opacity={0.15} />
    </svg>
  )
}

function FireDonut({ savingsRate, size = 160 }: { savingsRate: number; size?: number }) {
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(savingsRate, 100))
  const dash = c * (pct / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C}18`} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Épargne</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{Math.round(pct)}%</div>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }
const DEFAULTS: FireInputs = { income: 60000, expenses: 36000, netWorth: 50000, rate: 7, withdrawalRate: 4 }
const DEFAULTS_B: FireInputs = { income: 60000, expenses: 30000, netWorth: 50000, rate: 7, withdrawalRate: 4 }

function FirePageInner() {
  const [inputs, setInputs] = useState<FireInputs>(DEFAULTS)
  const set = (k: keyof FireInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [importingPatrimoine, setImportingPatrimoine] = useState(false)
  const [PatrimoineImported, setPatrimoineImported] = useState<number | null>(null)
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
  const [inputsB, setInputsB] = useState<FireInputs>(DEFAULTS_B)
  const setB = (k: keyof FireInputs) => (v: number) => setInputsB(p => ({ ...p, [k]: v }))
  const rB = useMemo(() => calcFire(inputsB), [inputsB])

  const importFromPatrimoine = async () => {
    setImportingPatrimoine(true)
    try {
      const res = await fetch('/api/Patrimoine/envelopes')
      if (!res.ok) return
      const envelopes: { type: string; totalValue: number | null; metadata: Record<string, unknown>; positions: { pru: number; quantity: number }[] }[] = await res.json()
      const total = envelopes.reduce((sum, e) => {
        if (e.type === 'IMMOBILIER') return sum + Number(e.metadata.currentValue ?? 0)
        if (e.totalValue !== null) return sum + e.totalValue
        return sum + e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
      }, 0)
      if (total > 0) { setInputs(p => ({ ...p, netWorth: Math.round(total) })); setPatrimoineImported(Math.round(total)) }
    } catch { /* ignore */ }
    finally { setImportingPatrimoine(false) }
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const restore = searchParams.get('restore')
    if (!restore) return
    try {
      const p = JSON.parse(restore)
      if (p.currentSavings !== undefined && p.netWorth === undefined) {
        const monthlyExp = p.monthlyExpenses ?? 2000
        const monthlyInv = p.monthlyInvestment ?? 1000
        setInputs({ income: (monthlyExp + monthlyInv) * 12, expenses: monthlyExp * 12, netWorth: p.currentSavings, rate: p.returnRate ?? 7, withdrawalRate: p.withdrawalRate ?? 4 })
      } else { setInputs(p as FireInputs) }
    } catch {}
  }, [searchParams])

  const r = useMemo(() => calcFire(inputs), [inputs])
  const targetAnimated = useCountUp(r.target, 1000)

  const projectionData = useMemo(() => {
    const years = Math.min(r.yearsToFire > 99 ? 40 : r.yearsToFire + 5, 50)
    return Array.from({ length: years + 1 }, (_, y) => {
      let nw = inputs.netWorth
      for (let i = 0; i < y; i++) nw = nw * (1 + inputs.rate / 100) + r.annualSavings
      return { year: y, Patrimoine: Math.round(Math.max(nw, 0)) }
    })
  }, [inputs, r])

  const progressPct = Math.min((inputs.netWorth / (r.target || 1)) * 100, 100)
  const progressColor = progressPct >= 75 ? C : progressPct >= 50 ? '#fbbf24' : progressPct >= 25 ? '#fb923c' : '#f87171'

  const score = r.savingsRate >= 50 ? 'excellent' : r.savingsRate >= 30 ? 'bon' : r.savingsRate >= 15 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: C },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    faible: { label: 'Faible', Icon: AlertCircle, color: '#f87171' },
  }[score]

  const tips = [
    { title: "Taux d'épargne", body: r.savingsRate < 20 ? "Un taux < 20% rallonge considérablement le chemin. Identifiez les postes à réduire en priorité." : "Excellent taux d'épargne ! Optimisez vos enveloppes : PEA, assurance-vie, PER.", color: r.savingsRate >= 30 ? C : '#fbbf24' },
    { title: 'Règle des 4%', body: inputs.withdrawalRate > 4 ? "Un taux > 4% augmente le risque d'épuiser le capital. La règle des 4% est éprouvée sur 30 ans." : "La règle des 4% (Trinity Study) est durable sur 30 ans. 3.5% pour une retraite de 40 ans+.", color: inputs.withdrawalRate <= 4 ? C : '#f87171' },
    { title: 'Rendement', body: inputs.rate > 8 ? `Un rendement de ${inputs.rate}% est optimiste. Prévoyez un scénario pessimiste à 5%.` : 'ETF MSCI World historique : ~7-8%/an sur 30 ans. La discipline prime sur le timing.', color: 'var(--p-blue)' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quel est votre revenu annuel net ?', hint: 'Total perçu chaque année après impôts et cotisations.', ref: 'Salaire médian France net : ~28 000 €/an.', suffix: '€/an', value: inputs.income, onChange: v => set('income')(v) },
    { question: 'Combien dépensez-vous par an ?', hint: "Vos dépenses totales annuelles. C'est aussi le revenu passif dont vous aurez besoin à la retraite.", ref: 'Chaque 100 €/mois économisé raccourcit votre chemin FIRE de ~3 ans.', suffix: '€/an', value: inputs.expenses, onChange: v => set('expenses')(v) },
    { question: 'Quel est votre Patrimoine actuel investi ?', hint: 'Total de vos actifs : PEA, assurance-vie, épargne, immo locatif…', ref: 'Patrimoine médian France (35-44 ans) : ~120 000 €.', suffix: '€', value: inputs.netWorth, onChange: v => { set('netWorth')(v); setPatrimoineImported(null) } },
    { type: 'slider', question: 'Quel rendement annuel attendez-vous ?', hint: 'Rendement moyen de votre portefeuille. Soyez conservateur.', ref: 'ETF MSCI World historique : ~7-8%/an sur 30 ans.', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 1, max: 15, stepSize: 0.5 },
    { type: 'slider', question: 'Quel taux de retrait envisagez-vous ?', hint: 'Pourcentage du Patrimoine retiré chaque année à la retraite. 4% est la règle classique.', ref: 'Règle des 4% (Trinity Study) : durable sur 30 ans. 3.5% pour une longue retraite.', suffix: '%', value: inputs.withdrawalRate, onChange: v => set('withdrawalRate')(v), min: 2, max: 6, stepSize: 0.1 },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>FI/RE</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Indépendance Financière<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Calculez votre date FIRE. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Règle des 4% · Projection sur mesure.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'FI/RE', subtitle: 'Financial Independence, Retire Early',
            kpis: [
              { label: 'Patrimoine FIRE cible', value: fmt(r.target), highlight: true },
              { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans` },
              { label: "Taux d'épargne", value: `${r.savingsRate.toFixed(1)}%` },
              { label: 'Progression', value: `${progressPct.toFixed(1)}%` },
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
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
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
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={() => setInputs(DEFAULTS)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {!bannerDismissed && !guidedMode && (
        <div style={{ marginBottom: 20, background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Flame style={{ width: 15, height: 15, color: C, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 2, fontFamily: 'var(--p-mono)', letterSpacing: '0.08em' }}>FI/RE — La règle des 4%</p>
            <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, lineHeight: 1.5 }}>
              La Trinity Study suggère qu&apos;un Patrimoine dure 30 ans si vous retirez 4%/an. Ajustez : 3.5% pour une retraite de 40 ans+, 5% si vous avez d&apos;autres revenus.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('fire-banner-dismissed', '1'); setBannerDismissed(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel steps={guidedSteps} currentStep={guidedStep} onStepChange={setGuidedStep} onFinish={() => { localStorage.setItem('fire-guided-done', '1'); setGuidedMode(false) }} />
        </div>
      )}

      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={eyebrow}>Paramètres</div>
                <ProfileFillButton onFill={p => {
                  if (p.netMonthlySalary) set('income')(p.netMonthlySalary * 12)
                  if (p.monthlyExpenses) set('expenses')(p.monthlyExpenses * 12)
                  if (p.currentAssets) set('netWorth')(p.currentAssets)
                }} />
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Revenu annuel net<FieldTooltip text="Revenu annuel net après impôts. Ce qui rentre réellement sur votre compte." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.income} onChange={e => set('income')(+e.target.value)}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Dépenses annuelles<FieldTooltip text="Vos dépenses totales. C'est aussi le montant dont vous aurez besoin chaque année à la retraite." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.expenses} onChange={e => set('expenses')(+e.target.value)}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'var(--p-mono)' }}>Médiane France : ~22 000 €/an</p>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Patrimoine actuel<FieldTooltip text="Total de vos actifs investis : épargne, PEA, assurance-vie, immo locatif..." />
                    </label>
                    <button onClick={importFromPatrimoine} disabled={importingPatrimoine}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: `1px solid ${C}30`, background: PatrimoineImported ? `${C}10` : 'transparent', color: C, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: importingPatrimoine ? 0.6 : 1, fontFamily: 'var(--p-mono)' }}>
                      <RefreshCw style={{ width: 11, height: 11, animation: importingPatrimoine ? 'spin 1s linear infinite' : 'none' }} />
                      {PatrimoineImported ? `${(PatrimoineImported / 1000).toFixed(0)}k€` : 'Importer'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.netWorth} onChange={e => { set('netWorth')(+e.target.value); setPatrimoineImported(null) }}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Rendement attendu<FieldTooltip text="ETF World historique : 7-9% nominal. Soyez conservateur." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.rate}%</span>
                  </div>
                  <Slider min={1} max={15} step={0.5} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {[{ l: 'Prudent 5%', v: 5 }, { l: 'Standard 7%', v: 7 }, { l: 'Optimiste 9%', v: 9 }].map(({ l, v }) => (
                      <button key={l} onClick={() => set('rate')(v)}
                        style={{ fontSize: 10, color: inputs.rate === v ? C : 'var(--p-text-faint)', background: inputs.rate === v ? `${C}12` : 'transparent', border: inputs.rate === v ? `1px solid ${C}30` : '1px solid transparent', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Taux de retrait<FieldTooltip text="La règle des 4% (Trinity Study) : retraite durable sur 30 ans." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.withdrawalRate}%</span>
                  </div>
                  <Slider min={2} max={6} step={0.1} value={[inputs.withdrawalRate]} onValueChange={([v]) => set('withdrawalRate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {[{ l: 'Prudent 3.5%', v: 3.5 }, { l: 'Standard 4%', v: 4 }].map(({ l, v }) => (
                      <button key={l} onClick={() => set('withdrawalRate')(v)}
                        style={{ fontSize: 10, color: inputs.withdrawalRate === v ? C : 'var(--p-text-faint)', background: inputs.withdrawalRate === v ? `${C}12` : 'transparent', border: inputs.withdrawalRate === v ? `1px solid ${C}30` : '1px solid transparent', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--p-card-2)' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Comparer A / B</div>
                  <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 2 }}>Superpose un 2ᵉ scénario</div>
                </div>
                <button onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, expenses: Math.round(inputs.expenses * 0.85) }) }}
                  style={{ width: 38, height: 22, borderRadius: 11, background: compareMode ? 'var(--p-blue)' : 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: compareMode ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </button>
              </div>

              {compareMode && (
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(43,91,154,0.04)', borderTop: '1px solid var(--p-line)' }}>
                  <div style={{ ...eyebrow, color: 'var(--p-blue)' }}>Scénario B</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Dépenses annuelles</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{fmtK(inputsB.expenses)}</span>
                    </div>
                    <Input type="number" value={inputsB.expenses} onChange={e => setB('expenses')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Taux de retrait B</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{inputsB.withdrawalRate}%</span>
                    </div>
                    <Slider min={2} max={6} step={0.1} value={[inputsB.withdrawalRate]} onValueChange={([v]) => setB('withdrawalRate')(v)} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Patrimoine FIRE = Dépenses × 25 · Règle des 4%.
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Patrimoine cible · Règle des 4%
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(targetAnimated)}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: `${progressPct}%`, background: progressColor, transition: 'width 0.7s' }} />
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                      <span>{fmtK(inputs.netWorth)} actuellement</span>
                      <span style={{ color: progressColor, fontWeight: 700 }}>{progressPct.toFixed(0)}% atteint</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Années avant FIRE', value: r.yearsToFire > 99 ? '+100' : `${r.yearsToFire} ans` },
                    { label: 'Épargne annuelle', value: fmtK(r.annualSavings), color: r.annualSavings >= 0 ? C : '#f87171' },
                    { label: 'Revenu passif / mois', value: fmtK(r.monthlyPassive) },
                    { label: "Taux d'épargne", value: `${r.savingsRate.toFixed(1)} %`, color: scoreConf.color },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {compareMode && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'FIRE A', value: r.yearsToFire > 99 ? '+100 ans' : `${r.yearsToFire} ans`, color: C },
                  { label: 'FIRE B', value: rB.yearsToFire > 99 ? '+100 ans' : `${rB.yearsToFire} ans`, color: 'var(--p-blue)' },
                  { label: 'Différence', value: (() => { const d = r.yearsToFire - rB.yearsToFire; return d === 0 ? 'Identique' : `${d > 0 ? 'B gagne' : 'A gagne'} ${Math.abs(d)} ans` })(), color: r.yearsToFire !== rB.yearsToFire ? C : 'var(--p-text-dim)' },
                  { label: 'Cible B vs A', value: (() => { const d = rB.target - r.target; return `${d >= 0 ? '+' : ''}${fmtK(d)}` })(), color: rB.target <= r.target ? C : '#fb923c' },
                ].map((k, i) => (
                  <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 18, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CHART */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={eyebrow}>Trajectoire</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Projection Patrimoine vers l&apos;objectif FIRE</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {[{ color: C, label: 'Patrimoine' }, { color: '#f87171', label: 'Objectif FIRE', dashed: true }].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                      <span style={{ width: 14, height: 2, background: l.dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                  <CsvExport data={projectionData.map(d => ({ 'Année': d.year, 'Patrimoine': d.Patrimoine, 'Objectif FIRE': Math.round(r.target) }))} filename="fire-projection.csv" />
                </div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <FireChart data={projectionData} target={r.target} />
              </div>
            </div>

            {/* JALONS */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Jalons</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Étapes vers l&apos;indépendance financière</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
                <span>Étape</span><span>Cible</span><span>Délai</span><span style={{ textAlign: 'right' }}>Statut</span>
              </div>
              {[25, 50, 75, 100].map((pct, i) => {
                const target = r.target * pct / 100
                let nw = inputs.netWorth; let y = 0
                while (nw < target && y < 100) { nw = nw * (1 + inputs.rate / 100) + r.annualSavings; y++ }
                const alreadyThere = inputs.netWorth >= target
                const reached = nw >= target
                return (
                  <div key={pct} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', padding: '11px 18px', alignItems: 'center', borderBottom: i < 3 ? '1px solid var(--p-line)' : undefined, fontSize: 12, fontFamily: 'var(--p-mono)', background: alreadyThere ? `${C}06` : 'transparent' }}>
                    <span style={{ fontWeight: 700, color: C }}>{pct}%</span>
                    <span style={{ color: 'var(--p-text-mid)' }}>{fmtK(target)}</span>
                    <span style={{ color: 'var(--p-text-dim)' }}>{alreadyThere ? '—' : reached ? `${y} ans` : '> 100 ans'}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 10, background: alreadyThere ? `${C}15` : 'var(--p-card-2)', color: alreadyThere ? C : 'var(--p-text-faint)', fontWeight: 700, fontSize: 11 }}>
                        {alreadyThere ? 'Atteint ✓' : reached ? `Dans ${y} ans` : '+100 ans'}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Épargne vs dépenses sur le revenu</div>
              </div>
              <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <FireDonut savingsRate={r.savingsRate} size={160} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { color: C, label: 'Épargne annuelle', value: fmtK(r.annualSavings), pct: r.savingsRate },
                    { color: '#f87171', label: 'Dépenses annuelles', value: fmtK(inputs.expenses), pct: 100 - r.savingsRate },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct.toFixed(0)}%</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
                <div style={{ ...eyebrow, color: scoreConf.color }}>Analyse — {scoreConf.label}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                  {score === 'excellent' && `Taux d'épargne exceptionnel. Vous atteindrez l'indépendance financière en ${r.yearsToFire} ans. La règle des ${inputs.withdrawalRate}% vous offre ${fmtK(r.monthlyPassive)}/mois.`}
                  {score === 'bon' && `Bon taux d'épargne de ${r.savingsRate.toFixed(1)}%. En maintenant ce rythme, l'indépendance financière dans ${r.yearsToFire} ans est réaliste.`}
                  {score === 'moyen' && `Taux d'épargne correct mais perfectible. Chaque point de pourcentage supplémentaire raccourcit votre chemin.`}
                  {score === 'faible' && `Taux d'épargne insuffisant pour le FIRE. Priorité : réduire les dépenses ou augmenter les revenus.`}
                </p>
                <div style={{ padding: '8px 12px', background: 'var(--p-card-2)', borderRadius: 8, border: '1px solid var(--p-line)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Règle des 4%</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', lineHeight: 1.5 }}>
                    {fmtK(inputs.expenses)} × 25 = <strong style={{ color: 'var(--p-text-em)' }}>{fmtK(r.target)}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 4, fontFamily: 'var(--p-mono)' }}>→ Revenu passif : {fmtK(r.monthlyPassive)}/mois</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ padding: '12px 12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Flame style={{ width: 13, height: 13, color: t.color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Intérêts composés', href: '/dashboard/compound' },
                  { label: 'DCA — Versement régulier', href: '/dashboard/dca' },
                  { label: 'Prêt immobilier', href: '/dashboard/mortgage' },
                ].map((link, i) => (
                  <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{link.label}</span>
                    <span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FirePage() {
  return <Suspense><FirePageInner /></Suspense>
}
