'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcDCA, type DCAInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Download, TrendingUp, RefreshCw, BookOpen, Settings2, GitCompare, Wallet } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'

const C = '#60a5fa'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

function DCAChart({ chartData, years }: { chartData: { month: number; value: number; invested: number }[]; years: number }) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const step = Math.max(1, Math.floor(chartData.length / 60))
  const data = chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1)
  const N = data.length - 1
  const maxV = Math.max(...data.map(d => d.value)) * 1.06 || 1
  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / maxV, 1) * h
  const ptsI = data.map((d, i) => ({ x: xOf(i), y: yOf(d.invested) }))
  const ptsV = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value) }))
  const lineV = ptsV.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineI = ptsI.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaGains = `${lineV} ${ptsI.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} Z`
  const areaInvested = `${lineI} L${ptsI[N].x},${PAD.t + h} L${ptsI[0].x},${PAD.t + h} Z`
  const mDots: { x: number; y: number; label: string }[] = []
  const yrStep = Math.max(1, Math.floor(years / 5))
  for (let yr = yrStep; yr <= years; yr += yrStep) {
    const mTarget = yr * 12
    const idx = data.findIndex(d => d.month >= mTarget)
    if (idx > 0 && idx <= N) mDots.push({ x: ptsV[idx].x, y: ptsV[idx].y, label: `${yr}a` })
  }
  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="dcaG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.40} />
          <stop offset="100%" stopColor={C} stopOpacity={0.06} />
        </linearGradient>
        <linearGradient id="dcaI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.03} />
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
      <path d={areaInvested} fill="url(#dcaI)" />
      <path d={areaGains} fill="url(#dcaG)" />
      <path d={lineI} fill="none" stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.6} />
      <path d={lineV} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      {mDots.map((m, i) => (
        <g key={i}>
          <line x1={m.x} y1={PAD.t + h} x2={m.x} y2={m.y} stroke={C} strokeWidth={1} opacity={0.22} strokeDasharray="2 3" />
          <circle cx={m.x} cy={m.y} r={7} fill="var(--p-card)" stroke={C} strokeWidth={1.5} />
          <circle cx={m.x} cy={m.y} r={3} fill={C} />
          <text x={m.x} y={PAD.t + h + 15} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-dim)" fontWeight={700} letterSpacing="0.04em">{m.label}</text>
        </g>
      ))}
      <circle cx={ptsV[N].x} cy={ptsV[N].y} r={4.5} fill={C} />
      <circle cx={ptsV[N].x} cy={ptsV[N].y} r={10} fill={C} opacity={0.15} />
    </svg>
  )
}

function DCADonut({ interestPct, size = 160 }: { interestPct: number; size?: number }) {
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(interestPct, 100))
  const dash = c * (pct / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C}15`} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{Math.round(pct)}%</div>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }
const DEFAULTS: DCAInputs = { monthly: 500, years: 15, targetRate: 8, volatility: 15, initialPrice: 100, startingCapital: 0 }
const DEFAULTS_B: DCAInputs = { monthly: 800, years: 15, targetRate: 8, volatility: 15, initialPrice: 100, startingCapital: 0 }

function DCAPageInner() {
  const [inputs, setInputs] = useState<DCAInputs>(DEFAULTS)
  const set = (k: keyof DCAInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [loadingPatrimoine, setLoadingPatrimoine] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [inputsB, setInputsB] = useState<DCAInputs>(DEFAULTS_B)
  const setB = (k: keyof DCAInputs) => (v: number) => setInputsB(p => ({ ...p, [k]: v }))
  const rB = useMemo(() => calcDCA(inputsB), [inputsB])

  const importPatrimoine = async () => {
    setLoadingPatrimoine(true)
    try {
      const res = await fetch('/api/Patrimoine/envelopes')
      if (!res.ok) return
      const data: { type: string; totalValue: number | null; metadata: Record<string, unknown>; positions: { pru: number; quantity: number }[] }[] = await res.json()
      const total = data.reduce((s, e) => {
        if (e.type === 'IMMOBILIER') return s + Number(e.metadata.currentValue ?? 0)
        const v = e.totalValue ?? e.positions.reduce((ps, p) => ps + p.pru * p.quantity, 0)
        return s + v
      }, 0)
      setInputs(p => ({ ...p, startingCapital: Math.round(total) }))
    } finally { setLoadingPatrimoine(false) }
  }

  const searchParams = useSearchParams()
  useEffect(() => {
    const restore = searchParams.get('restore')
    if (!restore) return
    try {
      const p = JSON.parse(restore)
      if (p.rate !== undefined && p.targetRate === undefined) p.targetRate = p.rate
      if (p.volatility === undefined) p.volatility = 15
      if (p.initialPrice === undefined) p.initialPrice = 100
      setInputs(p as DCAInputs)
    } catch {}
  }, [searchParams])

  const r = useMemo(() => calcDCA(inputs), [inputs])
  const finalAnimated = useCountUp(r.estimatedValue, 1000)

  const annualTable = useMemo(() =>
    r.chartData.filter((_: any, i: number) => i % 12 === 0).map((d: any) => ({
      year: Math.round(d.month / 12), invested: d.invested, value: d.value, gain: d.value - d.invested,
    })), [r])

  const interestPct = (r.gain / (r.estimatedValue || 1)) * 100
  const investedPct = (r.totalInvested / (r.estimatedValue || 1)) * 100

  const tips = [
    { title: 'Lissage du prix', body: `Sur ${inputs.years} ans, le DCA vous permet d'acheter plus quand les prix baissent. Votre prix moyen d'acquisition : ${fmtK(r.avgCostBasis)} par part.`, color: C },
    { title: 'DCA vs achat unique', body: r.vsLumpSum >= 0 ? `Avec une volatilité de ${inputs.volatility}%, le DCA surperforme l'achat unique de ${fmtK(r.vsLumpSum)} grâce au lissage des prix.` : `Avec une faible volatilité (${inputs.volatility}%), l'achat unique surperforme de ${fmtK(Math.abs(r.vsLumpSum))}.`, color: r.vsLumpSum >= 0 ? 'var(--p-green)' : '#fbbf24' },
    { title: 'Discipline avant tout', body: 'Le DCA est surtout une stratégie psychologique : il élimine le stress du timing de marché et favorise la discipline sur le long terme.', color: 'var(--p-gold)' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Combien investissez-vous chaque mois ?', hint: 'Votre versement régulier, quel que soit le prix du marché.', ref: 'Recommandé : 10-20% du salaire net.', suffix: '€/mois', value: inputs.monthly, onChange: v => set('monthly')(v) },
    { type: 'slider', question: 'Sur quelle durée voulez-vous investir ?', hint: "Plus l'horizon est long, plus le DCA lisse les variations.", ref: 'Sur 20 ans à 8%, 500 €/mois → ~295 000 €.', suffix: ' ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
    { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'Rendement moyen attendu. ETF World : ~8%/an historique.', ref: 'MSCI World : ~8 %/an depuis 1970.', suffix: '%', value: inputs.targetRate, onChange: v => set('targetRate')(v), min: 1, max: 15, stepSize: 0.5 },
    { question: 'Avez-vous déjà un capital de départ ?', hint: "Montant déjà investi ou que vous placez d'un coup au départ.", ref: 'Même 5 000 € de départ à 8%/an valent ~109 000 € au bout de 30 ans.', suffix: '€', value: inputs.startingCapital ?? 0, onChange: v => set('startingCapital')(v) },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>DCA</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Dollar Cost Averaging<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Investissement régulier sur le long terme. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Lissage du prix · Simulation mensuelle.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'DCA — Investissement Régulier',
            subtitle: `${fmt(inputs.monthly)}/mois · ${inputs.years} ans · ${inputs.targetRate}% de rendement`,
            kpis: [
              { label: 'Valeur estimée', value: fmt(r.estimatedValue), highlight: true },
              { label: 'Total investi', value: fmt(r.totalInvested) },
              { label: 'Gain total', value: fmt(r.gain) },
              { label: 'vs Achat unique', value: `${r.vsLumpSum >= 0 ? '+' : ''}${fmt(r.vsLumpSum)}` },
            ],
            inputs: [
              { label: 'Versement mensuel', value: fmt(inputs.monthly) },
              { label: 'Durée', value: `${inputs.years} ans` },
              { label: 'Rendement annuel', value: `${inputs.targetRate}%` },
              { label: 'Volatilité', value: `${inputs.volatility}%` },
            ],
            sections: [{ title: 'Résultats', items: [
              { label: 'Gain total', value: `${r.gainPct.toFixed(1)}%` },
              { label: 'Prix moyen acquisition', value: fmt(r.avgCostBasis) },
              { label: 'Unités accumulées', value: r.units.toFixed(2) },
            ]}],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="dca" name={`DCA ${fmt(inputs.monthly)}/mois × ${inputs.years}ans`} inputs={inputs as any} results={r as any} />
          <Button variant={compareMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, monthly: Math.round(inputs.monthly * 1.5) }) }}
            style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
          </Button>
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={() => setInputs(DEFAULTS)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel steps={guidedSteps} currentStep={guidedStep} onStepChange={setGuidedStep} onFinish={() => setGuidedMode(false)} />
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
                  if (p.monthlySavings) set('monthly')(p.monthlySavings)
                  if (p.currentAssets) set('startingCapital')(p.currentAssets)
                }} />
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Versement mensuel<FieldTooltip text="Montant investi chaque mois, quel que soit le prix du marché. La régularité est l'essence du DCA." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Durée<FieldTooltip text="Le DCA est surtout efficace sur 10+ ans — la volatilité se lisse sur la durée." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.years} ans</span>
                  </div>
                  <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Rendement annuel<FieldTooltip text="Rendement attendu à long terme. ETF MSCI World : ~8% historique sur 30 ans." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.targetRate}%</span>
                  </div>
                  <Slider min={1} max={20} step={0.5} value={[inputs.targetRate]} onValueChange={([v]) => set('targetRate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {[{ l: 'Prudent 5%', v: 5 }, { l: 'Standard 8%', v: 8 }, { l: 'Optimiste 12%', v: 12 }].map(({ l, v }) => (
                      <button key={l} onClick={() => set('targetRate')(v)}
                        style={{ fontSize: 10, color: inputs.targetRate === v ? C : 'var(--p-text-faint)', background: inputs.targetRate === v ? `${C}12` : 'transparent', border: inputs.targetRate === v ? `1px solid ${C}30` : '1px solid transparent', borderRadius: 6, padding: '2px 5px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Volatilité annuelle<FieldTooltip text="Amplitude des fluctuations. ETF World : ~15%. Plus la volatilité est haute, plus le DCA est avantageux." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.volatility}%</span>
                  </div>
                  <Slider min={0} max={50} step={1} value={[inputs.volatility]} onValueChange={([v]) => set('volatility')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {[{ l: 'Oblig. 5%', v: 5 }, { l: 'ETF 15%', v: 15 }, { l: 'Actions 30%', v: 30 }].map(({ l, v }) => (
                      <button key={l} onClick={() => set('volatility')(v)}
                        style={{ fontSize: 10, color: inputs.volatility === v ? C : 'var(--p-text-faint)', background: inputs.volatility === v ? `${C}12` : 'transparent', border: inputs.volatility === v ? `1px solid ${C}30` : '1px solid transparent', borderRadius: 6, padding: '2px 5px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Capital de départ<FieldTooltip text="Montant déjà investi au lancement de la simulation." />
                    </label>
                    <button onClick={importPatrimoine} disabled={loadingPatrimoine}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--p-mono)', fontWeight: 600, padding: 0 }}>
                      <Wallet style={{ width: 12, height: 12 }} />
                      {loadingPatrimoine ? 'Chargement…' : 'Importer'}
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.startingCapital ?? 0} onChange={e => set('startingCapital')(+e.target.value)} placeholder="0"
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--p-card-2)' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Comparer A / B</div>
                  <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 2 }}>Superpose un 2ᵉ scénario</div>
                </div>
                <button onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, monthly: Math.round(inputs.monthly * 1.5) }) }}
                  style={{ width: 38, height: 22, borderRadius: 11, background: compareMode ? 'var(--p-blue)' : 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: compareMode ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </button>
              </div>

              {compareMode && (
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(43,91,154,0.04)', borderTop: '1px solid var(--p-line)' }}>
                  <div style={{ ...eyebrow, color: 'var(--p-blue)' }}>Scénario B</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Versement mensuel</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{inputsB.monthly} €</span>
                    </div>
                    <Input type="number" value={inputsB.monthly} onChange={e => setB('monthly')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Rendement B</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{inputsB.targetRate}%</span>
                    </div>
                    <Slider min={1} max={15} step={0.5} value={[inputsB.targetRate]} onValueChange={([v]) => setB('targetRate')(v)} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Simulation déterministe avec lissage de la volatilité mensuelle.
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Capital final · {inputs.years} ans
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(finalAnimated)}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: `${investedPct}%`, background: 'repeating-linear-gradient(45deg, #94a3b8 0 4px, color-mix(in srgb, #94a3b8 55%, transparent) 4px 8px)' }} />
                      <div style={{ flex: 1, background: C }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Capital versé</div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text-em)', marginTop: 4 }}>{fmtK(r.totalInvested)}</div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{investedPct.toFixed(0)}% du total</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: C, fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text)', marginTop: 4 }}>{fmtK(r.gain)}</div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>×{(r.estimatedValue / (r.totalInvested || 1)).toFixed(2).replace('.', ',')} le capital</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Versement mensuel', value: `${inputs.monthly} €` },
                    { label: 'Rendement annuel', value: `${inputs.targetRate.toFixed(1)} %` },
                    { label: 'Unités accumulées', value: r.units.toFixed(2) },
                    { label: 'DCA vs achat unique', value: `${r.vsLumpSum >= 0 ? '+' : ''}${fmtK(r.vsLumpSum)}`, color: r.vsLumpSum >= 0 ? 'var(--p-green)' : '#f87171' },
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
                  { label: 'Valeur finale A', value: fmtK(r.estimatedValue), color: C },
                  { label: 'Valeur finale B', value: fmtK(rB.estimatedValue), color: 'var(--p-blue)' },
                  { label: 'Différence', value: fmtK(Math.abs(rB.estimatedValue - r.estimatedValue)), color: rB.estimatedValue > r.estimatedValue ? 'var(--p-green)' : '#f87171' },
                  { label: 'B vs A', value: `${rB.estimatedValue >= r.estimatedValue ? '+' : ''}${((rB.estimatedValue - r.estimatedValue) / (r.estimatedValue || 1) * 100).toFixed(1)}%`, color: rB.estimatedValue > r.estimatedValue ? 'var(--p-green)' : '#f87171' },
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
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Évolution du portefeuille — {inputs.years} ans</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {[{ color: C, label: 'Valeur' }, { color: '#94a3b8', label: 'Capital investi', dashed: true }].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                      <span style={{ width: 14, height: 2, background: l.dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                  <CsvExport
                    data={annualTable.map(d => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur portefeuille': d.value.toFixed(0), 'Gain': d.gain.toFixed(0) }))}
                    filename="dca.csv"
                  />
                </div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <DCAChart chartData={r.chartData} years={inputs.years} />
              </div>
            </div>

            {/* ANNUAL TABLE */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Jalons</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Repères clés · tous les 5 ans</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
                <span>Année</span><span>Versé</span><span>Valeur</span><span>Gain</span><span style={{ textAlign: 'right' }}>% gains</span>
              </div>
              {annualTable.filter(d => d.year > 0 && d.year % 5 === 0).map((d, i, arr) => {
                const pctG = Math.round((d.gain / (d.value || 1)) * 100)
                return (
                  <div key={d.year} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', padding: '11px 18px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid var(--p-line)' : undefined, fontSize: 12, fontFamily: 'var(--p-mono)' }}>
                    <span style={{ fontWeight: 700, color: C }}>{d.year} ans</span>
                    <span style={{ color: 'var(--p-text-mid)' }}>{fmtK(d.invested)}</span>
                    <span style={{ color: 'var(--p-text)', fontWeight: 700 }}>{fmtK(d.value)}</span>
                    <span style={{ color: 'var(--p-text-em)', fontWeight: 600 }}>{fmtK(d.gain)}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 10, background: `${C}12`, color: C, fontWeight: 700, fontSize: 11 }}>{pctG}%</span>
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
                <div style={eyebrow}>Composition finale</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Sur {fmtK(r.estimatedValue)} acquis</div>
              </div>
              <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <DCADonut interestPct={interestPct} size={160} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { color: C, label: 'Intérêts générés', value: fmtK(r.gain), pct: interestPct },
                    { color: '#94a3b8', label: 'Capital versé', value: fmtK(r.totalInvested), pct: investedPct, dashed: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: row.dashed ? `repeating-linear-gradient(45deg, ${row.color} 0 2px, transparent 2px 4px)` : row.color, border: row.dashed ? `1px solid ${row.color}` : 'none' }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct.toFixed(0)}%</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--p-card)', border: `1px solid ${C}25`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: C }} />
                <div style={eyebrow}>Analyse DCA</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                  Sur {inputs.years} ans à {inputs.targetRate}%/an, vos {fmtK(inputs.monthly)}/mois génèrent <strong style={{ color: C }}>{fmtK(r.estimatedValue)}</strong> — soit {r.gainPct.toFixed(0)}% de plus que votre mise initiale.
                </p>
                <div style={{ padding: '8px 10px', background: 'var(--p-card-2)', borderRadius: 8, border: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>DCA vs Achat unique</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.vsLumpSum >= 0 ? 'var(--p-green)' : '#f87171', fontFamily: 'var(--p-mono)' }}>
                    {r.vsLumpSum >= 0 ? '+' : ''}{fmtK(r.vsLumpSum)}
                  </span>
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
                      <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
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
                  { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
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

export default function DCAPage() { return <Suspense><DCAPageInner /></Suspense> }
