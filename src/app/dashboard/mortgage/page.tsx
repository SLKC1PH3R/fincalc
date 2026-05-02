'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, TrendingDown, RefreshCw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useCountUp } from '@/lib/use-count-up'

const C = '#38bdf8'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

// ─── inline SVG chart ─────────────────────────────────────────────────────────
function MortgageChart({ chartData, years }: {
  chartData: { year: number; capitalRepaid: number; remaining: number }[]
  years: number
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const allMax = Math.max(...chartData.map(d => Math.max(d.capitalRepaid, d.remaining))) * 1.06 || 1
  const N = chartData.length - 1

  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / allMax, 1) * h

  const ptsRepaid = chartData.map((d, i) => ({ x: xOf(i), y: yOf(d.capitalRepaid) }))
  const ptsRemain = chartData.map((d, i) => ({ x: xOf(i), y: yOf(d.remaining) }))

  const lineRepaid = ptsRepaid.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineRemain = ptsRemain.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaRepaid = `${lineRepaid} L${ptsRepaid[N].x},${PAD.t + h} L${ptsRepaid[0].x},${PAD.t + h} Z`

  const yTicks = [0, allMax * 0.25, allMax * 0.5, allMax * 0.75, allMax]
  const xTicks = chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 5)) === 0)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="mgRepaid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.32} />
          <stop offset="100%" stopColor={C} stopOpacity={0.04} />
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

      {xTicks.map((d, i) => {
        const x = xOf(chartData.indexOf(d))
        return (
          <text key={i} x={x} y={PAD.t + h + 16} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{d.year}a</text>
        )
      })}

      <path d={areaRepaid} fill="url(#mgRepaid)" />
      <path d={lineRepaid} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineRemain} fill="none" stroke="var(--p-text-faint)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" opacity={0.5} />

      <circle cx={ptsRepaid[N].x} cy={ptsRepaid[N].y} r={4.5} fill={C} />
      <circle cx={ptsRepaid[N].x} cy={ptsRepaid[N].y} r={10} fill={C} opacity={0.15} />
    </svg>
  )
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function MortgageDonut({ capital, interest, insurance, fees }: {
  capital: number; interest: number; insurance: number; fees: number
}) {
  const total = capital + interest + insurance + fees || 1
  const size = 160
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r

  const segments = [
    { value: capital, color: C },
    { value: interest, color: '#f87171' },
    { value: insurance, color: '#fbbf24' },
    { value: fees, color: '#a78bfa' },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const dash = circ * (seg.value / total)
    const arc = { color: seg.color, dash, offset }
    offset += dash
    return arc
  })

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--p-gold-08)" strokeWidth={14} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={14}
            strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={-a.offset} />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>
          {Math.round((interest / total) * 100)}%
        </div>
      </div>
    </div>
  )
}

// ─── style helpers ────────────────────────────────────────────────────────────
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }
const DEFAULTS: MortgageInputs = { amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 }

function MortgagePageInner() {
  const [inputs, setInputs] = useState<MortgageInputs>(DEFAULTS)
  const set = (k: keyof MortgageInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem('mortgage-banner-dismissed')
  })

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try { setInputs(JSON.parse(restoreParam) as MortgageInputs) } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcMortgage(inputs), [inputs])
  const totalMonthlyAnimated = useCountUp(r.totalMonthly, 900)

  const interestRatio = r.totalInterest / inputs.amount * 100
  const score = interestRatio < 30 ? 'excellent' : interestRatio < 50 ? 'bon' : interestRatio < 80 ? 'moyen' : 'eleve'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    eleve: { label: 'Élevé', Icon: AlertCircle, color: '#f87171' },
  }[score]

  const tips = [
    inputs.rate > 4
      ? { title: 'Taux élevé', body: 'Taux > 4% : consultez un courtier, les économies sur la durée peuvent dépasser 20 000 €.', color: '#fbbf24' }
      : { title: 'Taux compétitif', body: 'Bon taux ! Comparez également le TAEG et le coût total pour une comparaison juste entre offres.', color: C },
    inputs.years > 25
      ? { title: 'Durée longue', body: `Durée de ${inputs.years} ans : réduire de 5 ans économiserait environ ${fmt(r.totalInterest * 0.25)} d'intérêts.`, color: '#fb923c' }
      : { title: 'Durée raisonnable', body: `Sur ${inputs.years} ans, vous remboursez un capital solide. Chaque remboursement anticipé réduit les intérêts restants.`, color: C },
    r.totalInsurance > r.totalInterest * 0.3
      ? { title: 'Assurance élevée', body: "Assurance emprunteur élevée. La délégation d'assurance peut économiser 30–50% sur ce poste.", color: '#f87171' }
      : { title: 'Assurance maîtrisée', body: "Bon ratio assurance/intérêts. Pensez à revoir votre assurance chaque année — la délégation est possible.", color: C },
  ]

  const decadeRows = useMemo(() =>
    (r.chartData as { year: number; capitalRepaid: number; remaining: number }[]).filter(d => d.year % 5 === 0 && d.year > 0),
    [r.chartData])

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Prêt Immobilier</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Prêt Immobilier<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Mensualités · TAEG · Coût total. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Tableau d&apos;amortissement complet.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Prêt Immobilier',
            subtitle: `${fmt(inputs.amount)} sur ${inputs.years} ans à ${inputs.rate}%`,
            kpis: [
              { label: 'Mensualité totale', value: fmt(r.totalMonthly), highlight: true, sub: `dont ${fmt(r.monthlyPayment)} crédit` },
              { label: 'Intérêts totaux', value: fmt(r.totalInterest) },
              { label: 'Coût total crédit', value: fmt(r.totalCost) },
              { label: 'TAEG', value: `${r.taeg.toFixed(2)}%` },
            ],
            inputs: [
              { label: 'Montant emprunté', value: fmt(inputs.amount) },
              { label: 'Taux annuel', value: `${inputs.rate}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
              { label: 'Assurance mensuelle', value: fmt(inputs.insurance) },
              { label: 'Frais de dossier', value: fmt(inputs.fees) },
            ],
            sections: [{ title: 'Récapitulatif', items: [
              { label: 'Mensualité crédit seul', value: fmt(r.monthlyPayment) },
              { label: 'Total assurance', value: fmt(r.totalInsurance) },
              { label: 'Total intérêts', value: fmt(r.totalInterest) },
              { label: 'Coût total', value: fmt(r.totalCost) },
            ]}],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} @ ${inputs.rate}%`} inputs={inputs as any} results={r as any} />
          <CsvExport
            data={(r.chartData as { year: number; capitalRepaid: number; remaining: number }[]).map(d => ({ 'Année': d.year, 'Capital remboursé': d.capitalRepaid.toFixed(0), 'Capital restant': d.remaining.toFixed(0) }))}
            filename="tableau-amortissement.csv"
          />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => setInputs(DEFAULTS)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {/* Banner */}
      {!bannerDismissed && (
        <div style={{ marginBottom: 20, background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <TrendingDown style={{ width: 15, height: 15, color: C, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 2, fontFamily: 'var(--p-mono)', letterSpacing: '0.08em' }}>Bon à savoir — Prêt immobilier</p>
            <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, lineHeight: 1.5 }}>
              Le TAEG inclut les frais de dossier, l&apos;assurance et les frais de garantie. Pour comparer deux offres, comparez toujours le coût total, pas seulement le taux nominal.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('mortgage-banner-dismissed', '1'); setBannerDismissed(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 16, padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Montant */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Montant emprunté <FieldTooltip text="Capital emprunté = Prix + frais notaire - apport. Base de calcul des mensualités." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>
              <div style={divSt} />

              {/* Taux */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Taux annuel <FieldTooltip text="Taux nominal hors assurance. En France 2024 : 3–4.5% selon la durée." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.rate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Bas 15a', val: 3.20 }, { label: 'Moy 20a', val: 3.65 }, { label: 'Haut 25a', val: 4.20 }] as const).map(s => (
                    <button key={s.val} onClick={() => set('rate')(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: inputs.rate === s.val ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.rate === s.val ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: inputs.rate === s.val ? C : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}%</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'var(--p-mono)' }}>Taux moyens France — mars 2026</p>
              </div>
              <div style={divSt} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Durée <FieldTooltip text="Plus la durée est longue : mensualités basses mais coût total élevé." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.years} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--p-text-dim)' }}>
                  {[15, 20, 25].map(y => (
                    <button key={y} onClick={() => set('years')(y)}
                      style={{ background: inputs.years === y ? `${C}18` : 'transparent', border: inputs.years === y ? `1px solid ${C}35` : '1px solid transparent', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: inputs.years === y ? C : 'var(--p-text-dim)', fontSize: 11 }}>
                      {y} ans
                    </button>
                  ))}
                </div>
              </div>
              <div style={divSt} />

              {/* Assurance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Assurance <FieldTooltip text="Obligatoire. Couvre décès, invalidité. La délégation d'assurance peut économiser 30–50%." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 40, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€/mois</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Faible', rate: 0.10 }, { label: 'Normale', rate: 0.25 }, { label: 'Haute', rate: 0.40 }] as const).map(s => {
                    const suggested = Math.round(inputs.amount * s.rate / 100 / 12)
                    return (
                      <button key={s.label} onClick={() => set('insurance')(suggested)}
                        style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                          background: inputs.insurance === suggested ? `${C}18` : 'rgba(255,255,255,0.04)',
                          border: inputs.insurance === suggested ? `1px solid ${C}35` : '1px solid var(--p-line)',
                          color: inputs.insurance === suggested ? C : 'var(--p-text-dim)' }}>
                        {s.label}<br /><span style={{ fontWeight: 700 }}>{suggested}€</span>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'var(--p-mono)' }}>0.10–0.40% du capital / an · délégation conseillée</p>
              </div>
              <div style={divSt} />

              {/* Frais dossier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Frais de dossier <FieldTooltip text="Facturés par la banque. Généralement 0–1500€, souvent négociables." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Neuf', val: 800 }, { label: 'Ancien', val: 1200 }, { label: 'Max', val: 1500 }] as const).map(s => (
                    <button key={s.label} onClick={() => set('fees')(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: inputs.fees === s.val ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.fees === s.val ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: inputs.fees === s.val ? C : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}€</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Calcul selon la méthode des mensualités constantes (prêt à taux fixe).
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Mensualité totale · assurance incluse
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(totalMonthlyAnimated)}
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                  dont <span style={{ color: C, fontWeight: 700 }}>{fmtEur(r.monthlyPayment)}</span> crédit seul
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ background: C, width: `${(r.monthlyPayment / r.totalMonthly) * 100}%`, transition: 'width 0.5s' }} />
                    <div style={{ flex: 1, background: '#fbbf24' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                    <span style={{ color: C, fontWeight: 700 }}>Crédit {Math.round((r.monthlyPayment / r.totalMonthly) * 100)}%</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>Assurance {Math.round((inputs.insurance / r.totalMonthly) * 100)}%</span>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Intérêts totaux', value: fmtK(r.totalInterest) },
                  { label: 'Coût total', value: fmtK(r.totalCost) },
                  { label: 'TAEG', value: `${r.taeg.toFixed(2)} %` },
                  { label: 'Durée', value: `${inputs.years} ans` },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart — amortissement */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Tableau d&apos;amortissement</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Capital remboursé vs restant dû sur {inputs.years} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[{ color: C, label: 'Remboursé' }, { color: 'var(--p-text-faint)', label: 'Restant dû', dashed: true }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: (l as any).dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px', position: 'relative' }}>
              <MortgageChart chartData={r.chartData as { year: number; capitalRepaid: number; remaining: number }[]} years={inputs.years} />
            </div>
          </div>

          {/* Jalons */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Jalons</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Évolution du remboursement · tous les 5 ans</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
              <span>Année</span><span>Remboursé</span><span>Restant</span><span style={{ textAlign: 'right' }}>% remboursé</span>
            </div>
            {decadeRows.map((d, i) => {
              const pctRepaid = Math.round((d.capitalRepaid / inputs.amount) * 100)
              return (
                <div key={d.year} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', padding: '11px 18px', alignItems: 'center', borderBottom: i < decadeRows.length - 1 ? '1px solid var(--p-line)' : undefined, fontSize: 12, fontFamily: 'var(--p-mono)' }}>
                  <span style={{ fontWeight: 700, color: C }}>{d.year} ans</span>
                  <span style={{ color: 'var(--p-text-em)', fontWeight: 600 }}>{fmtK(d.capitalRepaid)}</span>
                  <span style={{ color: 'var(--p-text-mid)' }}>{fmtK(d.remaining)}</span>
                  <span style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 10, background: `${C}12`, color: C, fontWeight: 700, fontSize: 11 }}>{pctRepaid}%</span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* Décomposition du coût */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Décomposition du coût</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Total déboursé sur {inputs.years} ans</div>
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Capital', value: fmt(inputs.amount), pct: null },
                  { label: 'Intérêts', value: fmt(r.totalInterest), pct: fmtPct(interestRatio) },
                  { label: 'Assurance', value: fmt(r.totalInsurance), pct: null },
                  { label: 'Frais dossier', value: fmt(inputs.fees), pct: null },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--p-line)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--p-text-dim)' }}>{row.label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text-em)', fontFamily: 'var(--p-mono)' }}>{row.value}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--p-text-dim)' }}>{row.pct ?? ''}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--p-card-2)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--p-text-em)' }}>Total déboursé</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text)', fontFamily: 'var(--p-mono)' }}>{fmt(inputs.amount + r.totalCost)}</td>
                  <td style={{ padding: '10px 16px' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut répartition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition finale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Total déboursé sur la durée du prêt</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <MortgageDonut
                capital={inputs.amount}
                interest={Math.round(r.totalInterest)}
                insurance={Math.round(r.totalInsurance)}
                fees={inputs.fees}
              />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: C, label: 'Capital', value: fmt(inputs.amount) },
                  { color: '#f87171', label: 'Intérêts', value: fmt(r.totalInterest) },
                  { color: '#fbbf24', label: 'Assurance', value: fmt(r.totalInsurance) },
                  { color: '#a78bfa', label: 'Frais', value: fmt(inputs.fees) },
                ].map((e, i) => {
                  const total = inputs.amount + r.totalInterest + r.totalInsurance + inputs.fees
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{e.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{Math.round((parseFloat(e.value.replace(/[^\d]/g, '')) / total) * 100)}%</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 64, textAlign: 'right' }}>{e.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Analyse */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
              <div style={{ ...eyebrow, color: scoreConf.color }}>Analyse — {scoreConf.label}</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--p-card-2)', marginBottom: 8, border: '1px solid var(--p-line)' }}>
                  <div style={{ background: C, transition: 'width 0.5s', width: `${inputs.amount / (inputs.amount + r.totalCost) * 100}%` }} />
                  <div style={{ background: '#f87171', transition: 'width 0.5s', width: `${r.totalInterest / (inputs.amount + r.totalCost) * 100}%` }} />
                  <div style={{ background: '#fbbf24', flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[[C, `Capital ${Math.round(inputs.amount / (inputs.amount + r.totalCost) * 100)}%`], ['#f87171', `Intérêts ${Math.round(r.totalInterest / (inputs.amount + r.totalCost) * 100)}%`], ['#fbbf24', `Assu. ${Math.round(r.totalInsurance / (inputs.amount + r.totalCost) * 100)}%`]].map(([color, label]) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, flexShrink: 0, display: 'inline-block' }} />{label}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, margin: 0 }}>
                Vous paierez {fmt(r.totalInterest)} d&apos;intérêts sur {fmt(inputs.amount)} emprunté ({inputs.years} ans à {inputs.rate}%).
                {interestRatio < 30 && ' Excellent ratio — crédit bien optimisé.'}
                {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
                {interestRatio >= 50 && " Ratio élevé — envisagez de raccourcir la durée ou augmenter l'apport."}
              </p>
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
                <div key={i} style={{ padding: '12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
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
                { label: 'Achat vs Location', href: '/dashboard/buyrent' },
                { label: 'Intérêts composés', href: '/dashboard/compound' },
                { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
              ].map((link, i) => (
                <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                  <span>{link.label}</span><span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MortgagePage() {
  return <Suspense><MortgagePageInner /></Suspense>
}
