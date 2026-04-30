'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { useSearchParams } from 'next/navigation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Download, GitCompare, BookOpen, Settings2, TrendingUp, RefreshCw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { SaveSimulation } from '@/components/SaveSimulation'
import { FieldTooltip } from '@/components/FieldTooltip'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { useUserProfile } from '@/lib/use-profile'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── local formatters ────────────────────────────────────────────────────────
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

// ─── types ───────────────────────────────────────────────────────────────────
interface SeriesPoint { year: number; contributions: number; interest: number; total: number }
interface Milestone { year: number; label: string }

function toSeries(inputs: CompoundInputs): SeriesPoint[] {
  const r = calcCompound(inputs)
  return (r.chartData as { year: number; total: number; invested: number }[]).map(d => ({
    year: d.year,
    contributions: d.invested,
    interest: d.total - d.invested,
    total: d.total,
  }))
}

// ─── CompoundChart ────────────────────────────────────────────────────────────
function CompoundChart({ seriesA, seriesB, showB, milestones }: {
  seriesA: SeriesPoint[]; seriesB?: SeriesPoint[]; showB: boolean; milestones: Milestone[]
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const allMax = Math.max(...seriesA.map(d => d.total), ...(showB && seriesB ? seriesB.map(d => d.total) : [0]))
  const max = (allMax || 1) * 1.06
  const N = seriesA.length - 1

  const xy = (i: number, v: number) => ({ x: PAD.l + (i / (N || 1)) * w, y: PAD.t + h - (v / max) * h })

  const ptsC = seriesA.map((d, i) => xy(i, d.contributions))
  const ptsT = seriesA.map((d, i) => xy(i, d.total))
  const lineA = ptsT.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineC = ptsC.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaI = `${lineA} ${ptsC.slice().reverse().map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} Z`
  const areaC = `${lineC} L${ptsC[N].x},${PAD.t + h} L${ptsC[0].x},${PAD.t + h} Z`

  let lineB: string | null = null, areaB: string | null = null
  if (showB && seriesB?.length) {
    const pB = seriesB.map((d, i) => xy(i, d.total))
    lineB = pB.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    areaB = `${lineB} L${pB[N].x},${PAD.t + h} L${pB[0].x},${PAD.t + h} Z`
  }

  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max]

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="cgC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--p-gold)" stopOpacity={0.18} />
          <stop offset="100%" stopColor="var(--p-gold)" stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="cgI" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--p-gold)" stopOpacity={0.46} />
          <stop offset="100%" stopColor="var(--p-gold)" stopOpacity={0.10} />
        </linearGradient>
        <linearGradient id="cgB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--p-blue)" stopOpacity={0.22} />
          <stop offset="100%" stopColor="var(--p-blue)" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / max) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" letterSpacing="0.03em">{fmtK(t)}</text>
          </g>
        )
      })}

      <path d={areaC} fill="url(#cgC)" />
      <path d={areaI} fill="url(#cgI)" />
      <path d={lineC} fill="none" stroke="var(--p-gold-deep)" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.6} />
      <path d={lineA} fill="none" stroke="var(--p-gold)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

      {showB && lineB && areaB && (
        <>
          <path d={areaB} fill="url(#cgB)" />
          <path d={lineB} fill="none" stroke="var(--p-blue)" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
        </>
      )}

      {milestones.map((m, i) => {
        const yr = Math.min(m.year, N)
        const p = xy(yr, seriesA[yr].total)
        return (
          <g key={i}>
            <line x1={p.x} y1={PAD.t + h} x2={p.x} y2={p.y} stroke="var(--p-gold)" strokeWidth={1} opacity={0.25} strokeDasharray="2 3" />
            <circle cx={p.x} cy={p.y} r={7} fill="var(--p-card)" stroke="var(--p-gold)" strokeWidth={1.5} />
            <circle cx={p.x} cy={p.y} r={3} fill="var(--p-gold)" />
            <text x={p.x} y={PAD.t + h + 15} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-dim)" fontWeight={700} letterSpacing="0.04em">{m.label}</text>
          </g>
        )
      })}

      <circle cx={ptsT[N].x} cy={ptsT[N].y} r={4.5} fill="var(--p-gold)" />
      <circle cx={ptsT[N].x} cy={ptsT[N].y} r={10} fill="var(--p-gold)" opacity={0.18} />
    </svg>
  )
}

// ─── ApportDonut ──────────────────────────────────────────────────────────────
function ApportDonut({ contributions, interest, size = 160 }: { contributions: number; interest: number; size?: number }) {
  const total = contributions + interest || 1
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const dashC = c * (contributions / total)
  const pctI = Math.round((interest / total) * 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--p-gold-08)" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--p-gold-deep)" strokeWidth={14}
          strokeDasharray={`${dashC} ${c - dashC}`} strokeDashoffset={0} opacity={0.5} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--p-gold)" strokeWidth={14}
          strokeDasharray={`${c - dashC} ${dashC}`} strokeDashoffset={-dashC} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{pctI}%</div>
      </div>
    </div>
  )
}

// ─── LegendRow ────────────────────────────────────────────────────────────────
function LegendRow({ color, label, value, pct, dashed }: { color: string; label: string; value: string; pct: number; dashed?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0,
        background: dashed ? `repeating-linear-gradient(45deg, ${color} 0 2px, transparent 2px 4px)` : color,
        border: dashed ? `1px solid ${color}` : 'none' }} />
      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{pct.toFixed(0)}%</span>
      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 64, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ─── fieldStyle helpers ───────────────────────────────────────────────────────
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: 'var(--p-gold)' }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULTS_A: CompoundInputs = { capital: 10000, monthly: 300, rate: 6, years: 25, frequency: 12 }
const DEFAULTS_B: CompoundInputs = { capital: 10000, monthly: 500, rate: 7, years: 25, frequency: 12 }

// ─── Main page inner ──────────────────────────────────────────────────────────
function CompoundPageInner() {
  const { profile } = useUserProfile()
  const [inputs, setInputs] = useState<CompoundInputs>(DEFAULTS_A)
  const set = (k: keyof CompoundInputs) => (v: number | string) => setInputs(p => ({ ...p, [k]: Number(v) }))

  useEffect(() => {
    if (!profile) return
    setInputs(p => ({
      ...p,
      monthly: profile.monthlySavings ?? p.monthly,
      capital: profile.currentAssets ?? p.capital,
    }))
  }, [profile])

  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [inputsB, setInputsB] = useState<CompoundInputs>(DEFAULTS_B)
  const setB = (k: keyof CompoundInputs) => (v: number | string) => setInputsB(p => ({ ...p, [k]: Number(v) }))

  const searchParams = useSearchParams()
  useEffect(() => {
    const restore = searchParams.get('restore')
    if (!restore) return
    try {
      const p = JSON.parse(restore)
      if (p.initial !== undefined && p.capital === undefined) p.capital = p.initial
      setInputs(p as CompoundInputs)
    } catch { /* ignore */ }
  }, [searchParams])

  const r = useMemo(() => calcCompound(inputs), [inputs])
  const rB = useMemo(() => calcCompound(inputsB), [inputsB])
  const seriesA = useMemo(() => toSeries(inputs), [inputs])
  const seriesB = useMemo(() => toSeries(inputsB), [inputsB])
  const final = seriesA[seriesA.length - 1]
  const finalB = seriesB[seriesB.length - 1]
  const totalAnimated = useCountUp(final.total, 1000)

  const milestones: Milestone[] = useMemo(() => {
    const ymax = inputs.years
    return [0.2, 0.4, 0.6, 0.8, 1].map(pct => {
      const yr = Math.round(ymax * pct)
      return { year: yr, label: `${yr} an${yr > 1 ? 's' : ''}` }
    }).filter((m, i, arr) => m.year > 0 && arr.findIndex(x => x.year === m.year) === i)
  }, [inputs.years])

  const decadeRows = useMemo(() =>
    seriesA.filter(d => d.year % 5 === 0 && d.year > 0), [seriesA])

  const yearsToDouble = Math.round(72 / Math.max(inputs.rate, 0.1))
  const tips = [
    { title: 'La règle des 72', body: `À ${inputs.rate.toFixed(1)} % par an, votre capital double tous les ~${yearsToDouble} ans.`, color: 'var(--p-gold)' },
    { title: '+50 €/mois change tout', body: `Passer de ${inputs.monthly} € à ${inputs.monthly + 50} €/mois ajouterait environ ${fmtK(50 * 12 * inputs.years * (1 + inputs.rate / 200))} sur ${inputs.years} ans.`, color: 'var(--p-green)' },
    { title: 'Pensez à l’enveloppe', body: `Sur PEA après 5 ans : prélèvements sociaux uniquement (17,2 %). Sur AV après 8 ans : abattement de 4 600 €.`, color: 'var(--p-blue)' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Combien avez-vous déjà de côté ?', hint: 'Incluez votre épargne actuelle. Vous pouvez mettre 0 si vous démarrez de zéro.', ref: 'La moyenne française est ~8 000 € d\'épargne liquide.', suffix: '€', value: inputs.capital, onChange: v => set('capital')(v) },
    { question: 'Combien mettez-vous de côté chaque mois ?', hint: 'Votre versement régulier — c\'est le moteur principal de votre épargne à long terme.', ref: 'La moyenne française est ~300 €/mois.', suffix: '€', value: inputs.monthly, onChange: v => set('monthly')(v) },
    { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'Livret A : 3 % · Fonds euros : 2–4 % · ETF World MSCI : ~7–8 %/an.', ref: 'Réf. S&P 500 : ~10 %/an · MSCI World : ~8 %/an', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 0.5, max: 20, stepSize: 0.1 },
    { type: 'slider', question: 'Sur combien d\'années ?', hint: 'Plus l\'horizon est long, plus l\'effet boule de neige est puissant.', ref: 'Sur 30 ans à 7 %, votre argent est multiplié par ~7.', suffix: 'ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span>
            <span style={{ opacity: 0.5 }}>›</span>
            <span style={{ color: 'var(--p-gold)' }}>Intérêts composés</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Intérêts composés<span style={{ color: 'var(--p-gold)' }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Projetez la croissance d&apos;un capital sur le long terme. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Modèle déterministe — net de frais.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Intérêts Composés',
            subtitle: `Capital ${fmt(inputs.capital)} · ${fmt(inputs.monthly)}/mois · ${inputs.rate}% · ${inputs.years} ans`,
            kpis: [
              { label: 'Capital final', value: fmt(r.final), highlight: true },
              { label: 'Capital investi', value: fmt(r.invested) },
              { label: 'Intérêts générés', value: fmt(r.interest) },
              { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}` },
            ],
            inputs: [
              { label: 'Capital initial', value: fmt(inputs.capital) },
              { label: 'Versement mensuel', value: fmt(inputs.monthly) },
              { label: 'Taux annuel', value: `${inputs.rate}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
            ],
            tips: tips.map(t => t.body),
          })} style={{ background: 'var(--p-gold)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="compound" name={`Composés ${fmt(inputs.capital)}€ × ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          <Button variant={compareMode ? 'default' : 'outline'} size="sm"
            onClick={() => setCompareMode(v => !v)}
            style={compareMode ? { background: 'rgba(43,91,154,0.12)', border: '1px solid rgba(43,91,154,0.35)', color: 'var(--p-blue)' } : {}}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
          </Button>
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: 'var(--p-gold-12)', border: '1px solid var(--p-gold-30)', color: 'var(--p-gold)' } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => setInputs(DEFAULTS_A)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {/* ── Guided mode ── */}
      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel steps={guidedSteps} currentStep={guidedStep} onStepChange={setGuidedStep} onFinish={() => setGuidedMode(false)} />
        </div>
      )}

      {/* ── 3-column grid ── */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

          {/* ── LEFT — Paramètres (sticky) ── */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>

              {/* Card header */}
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={eyebrow}>Paramètres</div>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.currentAssets) set('capital')(p.currentAssets)
                  if (p.monthlySavings) set('monthly')(p.monthlySavings)
                }} />
              </div>

              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Capital initial */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capital de départ<FieldTooltip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                {/* Versement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Versement mensuel<FieldTooltip text="Somme ajoutée chaque mois — la régularité est clé." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-gold)', fontFamily: 'var(--p-mono)' }}>{inputs.monthly} €</span>
                  </div>
                  <Slider min={0} max={3000} step={50} value={[inputs.monthly]} onValueChange={([v]) => set('monthly')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                    <span>0 €</span><span>3 000 €</span>
                  </div>
                </div>

                <div style={divSt} />

                {/* Taux */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Rendement annuel<FieldTooltip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-gold)', fontFamily: 'var(--p-mono)' }}>{inputs.rate} %</span>
                  </div>
                  <Slider min={0.5} max={15} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                    {[{ l: 'Livret A', v: 3 }, { l: 'Fonds €', v: 4 }, { l: 'ETF ~8%', v: 8 }].map(({ l, v }) => (
                      <button key={l} onClick={() => set('rate')(v)}
                        style={{ fontSize: 10, color: inputs.rate === v ? 'var(--p-gold)' : 'var(--p-text-faint)', background: inputs.rate === v ? 'var(--p-gold-08)' : 'transparent', border: inputs.rate === v ? '1px solid var(--p-gold-30)' : '1px solid transparent', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={divSt} />

                {/* Durée */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Durée<FieldTooltip text="Plus la durée est longue, plus l'effet boule de neige est puissant." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-gold)', fontFamily: 'var(--p-mono)' }}>{inputs.years} ans</span>
                  </div>
                  <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                </div>

                <div style={divSt} />

                {/* Capitalisation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capitalisation<FieldTooltip text="Fréquence de réinvestissement. Mensuelle est la plus courante." />
                  </label>
                  <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Mensuelle</SelectItem>
                      <SelectItem value="4">Trimestrielle</SelectItem>
                      <SelectItem value="1">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Compare toggle */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--p-card-2)' }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)' }}>Comparer A / B</div>
                  <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 2 }}>Superpose un 2ᵉ scénario</div>
                </div>
                <button onClick={() => setCompareMode(v => !v)} style={{ width: 38, height: 22, borderRadius: 11, background: compareMode ? 'var(--p-blue)' : 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: compareMode ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                </button>
              </div>

              {compareMode && (
                <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(43,91,154,0.04)', borderTop: '1px solid var(--p-line)' }}>
                  <div style={{ ...eyebrow, color: 'var(--p-blue)' }}>Scénario B</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Versement mensuel</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{inputsB.monthly} €</span>
                    </div>
                    <Slider min={0} max={3000} step={50} value={[inputsB.monthly]} onValueChange={([v]) => setB('monthly')(v)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Rendement annuel</label>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-blue)', fontFamily: 'var(--p-mono)' }}>{inputsB.rate} %</span>
                    </div>
                    <Slider min={0.5} max={15} step={0.1} value={[inputsB.rate]} onValueChange={([v]) => setB('rate')(v)} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Calcul selon la formule des intérêts composés capitalisés mensuellement.
            </div>
          </div>

          {/* ── CENTER ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: 'linear-gradient(135deg, var(--p-gold-08) 0%, transparent 55%), var(--p-card)' }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--p-gold)', display: 'inline-block' }} />
                Capital final · {inputs.years} ans
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                {/* Big number */}
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(42px, 5.5vw, 66px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(totalAnimated)}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    {/* Progress bar */}
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: `${(final.contributions / (final.total || 1)) * 100}%`, background: 'repeating-linear-gradient(45deg, var(--p-gold-deep) 0 4px, color-mix(in srgb, var(--p-gold-deep) 65%, transparent) 4px 8px)' }} />
                      <div style={{ flex: 1, background: 'var(--p-gold)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                          <span style={{ width: 9, height: 9, background: 'repeating-linear-gradient(45deg, var(--p-gold-deep) 0 2px, transparent 2px 4px)', borderRadius: 2, border: '1px solid var(--p-gold-deep)' }} />
                          Apport
                        </div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text-em)', marginTop: 4 }}>{fmtK(final.contributions)}</div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{((final.contributions / (final.total || 1)) * 100).toFixed(0)} % du total</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 10, color: 'var(--p-gold)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                          <span style={{ width: 9, height: 9, background: 'var(--p-gold)', borderRadius: 2 }} />
                          Intérêts
                        </div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text)', marginTop: 4 }}>{fmtK(final.interest)}</div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>×{(final.total / (final.contributions || 1)).toFixed(2).replace('.', ',')} le capital</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* KPIs sidebar */}
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Versement mensuel', value: `${inputs.monthly} €` },
                    { label: 'Rendement annuel', value: `${inputs.rate.toFixed(1).replace('.', ',')} %` },
                    { label: 'Capital initial', value: fmtK(inputs.capital) },
                    { label: 'Plus-value annualisée', value: `+${(((final.total / (inputs.capital || 1)) ** (1 / inputs.years) - 1) * 100).toFixed(1).replace('.', ',')} %`, color: 'var(--p-green)' },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color || 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compare B badge */}
            {compareMode && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Capital final A', value: fmtK(final.total), color: 'var(--p-gold)' },
                  { label: 'Capital final B', value: fmtK(finalB.total), color: 'var(--p-blue)' },
                  { label: 'Différence', value: fmtK(Math.abs(finalB.total - final.total)), color: finalB.total > final.total ? 'var(--p-green)' : 'var(--p-red)' },
                  { label: 'B vs A', value: `${finalB.total >= final.total ? '+' : ''}${((finalB.total - final.total) / (final.total || 1) * 100).toFixed(1)}%`, color: finalB.total >= final.total ? 'var(--p-green)' : 'var(--p-red)' },
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
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>
                    {compareMode ? 'Scénario A · Scénario B en superposition' : 'Évolution année par année'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {[
                    { color: 'var(--p-gold)', label: 'Total' },
                    { color: 'var(--p-gold-deep)', label: 'Apport', dashed: true },
                    ...(compareMode ? [{ color: 'var(--p-blue)', label: 'Scénario B', dashed: true }] : []),
                  ].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                      <span style={{ width: 14, height: 2, background: l.dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                  <CsvExport
                    data={seriesA.map(d => ({ 'Année': d.year, 'Apport': d.contributions.toFixed(0), 'Intérêts': d.interest.toFixed(0), 'Total': d.total.toFixed(0) }))}
                    filename="interets-composes.csv"
                  />
                </div>
              </div>
              <div style={{ padding: '10px 12px 6px', position: 'relative' }}>
                <CompoundChart seriesA={seriesA} seriesB={seriesB} showB={compareMode} milestones={milestones} />
                {compareMode && (
                  <div style={{ position: 'absolute', top: 20, right: 24, padding: '10px 14px', background: 'rgba(43,91,154,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(43,91,154,0.25)', borderRadius: 10, minWidth: 150 }}>
                    <div style={{ ...eyebrow, color: 'var(--p-blue)', marginBottom: 6 }}>Scénario B</div>
                    <div style={{ fontFamily: 'var(--p-serif)', fontSize: 22, color: 'var(--p-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtEur(finalB.total)}</div>
                    <div style={{ fontSize: 10.5, color: finalB.total >= final.total ? 'var(--p-green)' : 'var(--p-red)', fontFamily: 'var(--p-mono)', fontWeight: 700, marginTop: 5 }}>
                      {finalB.total >= final.total ? '+' : ''}{fmtK(finalB.total - final.total)} vs A
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MILESTONES TABLE */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Jalons</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Repères clés sur la trajectoire · tous les 5 ans</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
                <span>Année</span><span>Apport</span><span>Intérêts</span><span>Total</span><span style={{ textAlign: 'right' }}>% intérêts</span>
              </div>
              {decadeRows.map((d, i) => {
                const pctI = Math.round((d.interest / (d.total || 1)) * 100)
                return (
                  <div key={d.year} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 1fr', padding: '11px 18px', alignItems: 'center', borderBottom: i < decadeRows.length - 1 ? '1px solid var(--p-line)' : undefined, fontSize: 12, fontFamily: 'var(--p-mono)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--p-gold)' }}>{d.year} ans</span>
                    <span style={{ color: 'var(--p-text-mid)' }}>{fmtK(d.contributions)}</span>
                    <span style={{ color: 'var(--p-text-em)', fontWeight: 600 }}>{fmtK(d.interest)}</span>
                    <span style={{ color: 'var(--p-text)', fontWeight: 700 }}>{fmtK(d.total)}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 10, background: 'var(--p-gold-08)', color: 'var(--p-gold)', fontWeight: 700, fontSize: 11 }}>{pctI} %</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Donut répartition */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition finale</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Sur {fmtK(final.total)} acquis</div>
              </div>
              <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <ApportDonut contributions={final.contributions} interest={final.interest} size={160} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <LegendRow color="var(--p-gold)" label="Intérêts générés" value={fmtK(final.interest)} pct={(final.interest / (final.total || 1)) * 100} />
                  <LegendRow color="var(--p-gold-deep)" dashed label="Vos apports" value={fmtK(final.contributions)} pct={(final.contributions / (final.total || 1)) * 100} />
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Lectures et leviers</div>
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

            {/* Aller plus loin */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'DCA — Versement régulier', href: '/dashboard/dca' },
                  { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
                  { label: 'Prêt immobilier', href: '/dashboard/mortgage' },
                ].map((link, i) => (
                  <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)', transition: 'border-color 0.15s' }}>
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

export default function CompoundPage() {
  return <Suspense><CompoundPageInner /></Suspense>
}
