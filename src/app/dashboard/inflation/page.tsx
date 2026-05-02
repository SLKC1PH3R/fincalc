'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcInflation, type InflationInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { useCountUp } from '@/lib/use-count-up'

const C = '#f59e0b'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

// ─── Inline SVG chart ─────────────────────────────────────────────────────────
function InflationChart({ data }: {
  data: { year: number; nominal: number; real: number; cash: number }[]
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const allMax = Math.max(...data.map(d => Math.max(d.nominal, d.real, d.cash))) * 1.06 || 1
  const N = data.length - 1

  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / allMax, 1) * h

  const ptsNominal = data.map((d, i) => ({ x: xOf(i), y: yOf(d.nominal) }))
  const ptsReal = data.map((d, i) => ({ x: xOf(i), y: yOf(d.real) }))
  const ptsCash = data.map((d, i) => ({ x: xOf(i), y: yOf(d.cash) }))

  const lineNominal = ptsNominal.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineReal = ptsReal.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineCash = ptsCash.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const areaNominal = `${lineNominal} L${ptsNominal[N].x},${PAD.t + h} L${ptsNominal[0].x},${PAD.t + h} Z`
  const areaReal = `${lineReal} L${ptsReal[N].x},${PAD.t + h} L${ptsReal[0].x},${PAD.t + h} Z`

  const yTicks = [0, allMax * 0.25, allMax * 0.5, allMax * 0.75, allMax]
  const xTicks = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="igNominal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.25} />
          <stop offset="100%" stopColor={C} stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="igReal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.20} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0.03} />
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
        const x = xOf(data.indexOf(d))
        return (
          <text key={i} x={x} y={PAD.t + h + 16} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{d.year}a</text>
        )
      })}

      <path d={areaNominal} fill="url(#igNominal)" />
      <path d={areaReal} fill="url(#igReal)" />
      <path d={lineNominal} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineReal} fill="none" stroke="#34d399" strokeWidth={2.0} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineCash} fill="none" stroke="#f87171" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 4" opacity={0.7} />

      <circle cx={ptsNominal[N].x} cy={ptsNominal[N].y} r={4.5} fill={C} />
      <circle cx={ptsNominal[N].x} cy={ptsNominal[N].y} r={9} fill={C} opacity={0.18} />
      <circle cx={ptsReal[N].x} cy={ptsReal[N].y} r={4} fill="#34d399" />
    </svg>
  )
}

// ─── Donut inflation ──────────────────────────────────────────────────────────
function InflationDonut({ realRate, inflationRate, size = 160 }: {
  realRate: number; inflationRate: number; size?: number
}) {
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const isPositive = realRate > 0
  const pct = isPositive
    ? Math.min((realRate / Math.max(inflationRate, 0.1)) * 100, 100)
    : 0
  const dash = circ * (pct / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C}18`} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={isPositive ? C : '#f87171'} strokeWidth={14}
          strokeDasharray={`${isPositive ? dash : circ} ${isPositive ? circ - dash : 0}`}
          strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Taux réel</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: isPositive ? C : '#f87171', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>
          {realRate > 0 ? '+' : ''}{realRate.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function InflationPageInner() {
  const [inputs, setInputs] = useState<InflationInputs>({ capital: 50000, nominalRate: 7, inflationRate: 2.5, years: 20 })
  const set = (k: keyof InflationInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcInflation(inputs), [inputs])
  const realFinalAnimated = useCountUp(r.realFinal, 900)

  const isBeatingInflation = r.realRate > 0

  const tips = [
    !isBeatingInflation
      ? { title: 'Sous l\'inflation', body: `Votre rendement nominal (${inputs.nominalRate}%) est inférieur à l'inflation (${inputs.inflationRate}%). Vous perdez du pouvoir d'achat !`, color: '#f87171' }
      : { title: 'Taux réel positif', body: `Taux réel : ${r.realRate.toFixed(2)}%. Votre capital prend réellement de la valeur après inflation.`, color: C },
    { title: 'Érosion du cash', body: `Garder ${fmt(inputs.capital)} sous forme de cash à l'inflation actuelle = perdre ${fmt(r.purchasingPowerLoss)} de pouvoir d'achat en ${inputs.years} ans.`, color: '#fb923c' },
    inputs.inflationRate > 3
      ? { title: 'Inflation forte', body: "Inflation > 3% : privilégiez les actifs réels (immobilier, actions) qui s'apprécient naturellement avec les prix.", color: '#fbbf24' }
      : { title: 'Seuil minimal', body: `Le seuil minimum de rendement pour maintenir votre pouvoir d'achat est ${inputs.inflationRate}%/an — soit le taux d'inflation.`, color: C },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Inflation</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Inflation & Pouvoir d&apos;Achat<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Taux réel Fisher · Érosion monétaire. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Nominal vs réel sur {inputs.years} ans.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Inflation & Pouvoir d\'achat',
            subtitle: `${fmt(inputs.capital)} · ${inputs.nominalRate}% nominal · ${inputs.inflationRate}% inflation · ${inputs.years} ans`,
            kpis: [
              { label: 'Valeur réelle', value: fmt(r.realFinal), highlight: true },
              { label: 'Taux réel', value: `${r.realRate.toFixed(2)}%` },
              { label: 'Valeur nominale', value: fmt(r.nominalFinal) },
              { label: 'Perte si cash', value: fmt(r.purchasingPowerLoss) },
            ],
            inputs: [
              { label: 'Capital initial', value: fmt(inputs.capital) },
              { label: 'Rendement nominal', value: `${inputs.nominalRate}%` },
              { label: 'Inflation', value: `${inputs.inflationRate}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
            ],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="inflation" name={`Inflation ${inputs.inflationRate}% · ${inputs.years}a`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Capital initial</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{fmtK(inputs.capital)}</span>
                </div>
                <Slider min={5000} max={500000} step={5000} value={[inputs.capital]} onValueChange={([v]) => set('capital')(v)} />
              </div>
              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Rendement nominal</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.nominalRate}%</span>
                </div>
                <Slider min={0} max={15} step={0.5} value={[inputs.nominalRate]} onValueChange={([v]) => set('nominalRate')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ label: 'Livret A', v: 3 }, { label: 'SCPI', v: 5 }, { label: 'ETF', v: 8 }].map(s => (
                    <button key={s.label} onClick={() => set('nominalRate')(s.v)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: inputs.nominalRate === s.v ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.nominalRate === s.v ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: inputs.nominalRate === s.v ? C : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.v}%</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Taux d&apos;inflation</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.inflationRate}%</span>
                </div>
                <Slider min={0.5} max={10} step={0.5} value={[inputs.inflationRate]} onValueChange={([v]) => set('inflationRate')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ label: 'BCE cible', val: 2.0 }, { label: 'France 24', val: 2.3 }, { label: 'Pic 2022', val: 5.2 }].map(s => (
                    <button key={s.val} onClick={() => set('inflationRate')(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: inputs.inflationRate === s.val ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.inflationRate === s.val ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: inputs.inflationRate === s.val ? C : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}%</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Durée</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.years} ans</span>
                </div>
                <Slider min={5} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
              </div>

              <div style={{ background: `${C}08`, border: `1px solid ${C}20`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: C, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: 'var(--p-mono)' }}>Références inflation</div>
                {[{ label: 'Inflation France 2024', val: '2,3%' }, { label: 'Cible BCE', val: '2,0%' }, { label: 'Inflation 2022 (pic)', val: '5,2%' }].map(ref => (
                  <div key={ref.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--p-line)' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{ref.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{ref.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Formule de Fisher : taux réel = (1+n)/(1+i) − 1.
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Pouvoir d&apos;achat réel · {inputs.years} ans
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(realFinalAnimated)}
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                  valeur réelle en euros d&apos;aujourd&apos;hui
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${Math.min((r.realFinal / (r.nominalFinal || 1)) * 100, 100)}%`, background: '#34d399', transition: 'width 0.5s' }} />
                    <div style={{ flex: 1, background: `${C}30` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Réel {fmtK(r.realFinal)}</span>
                    <span style={{ color: C, fontWeight: 700 }}>Nominal {fmtK(r.nominalFinal)}</span>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Valeur nominale', value: fmtK(r.nominalFinal) },
                  { label: 'Perte pouvoir d\'achat', value: fmtK(r.purchasingPowerLoss), color: '#f87171' },
                  { label: 'Taux réel (Fisher)', value: `${r.realRate > 0 ? '+' : ''}${r.realRate.toFixed(2)} %`, color: isBeatingInflation ? C : '#f87171' },
                  { label: 'Coefficient d\'érosion', value: `×${(r.cashFinal / inputs.capital).toFixed(2)}` },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Trajectoire</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Valeur nominale vs réelle sur {inputs.years} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[{ color: C, label: 'Nominale' }, { color: '#34d399', label: 'Réelle' }, { color: '#f87171', label: 'Cash', dashed: true }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: (l as any).dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <InflationChart data={r.chartData as { year: number; nominal: number; real: number; cash: number }[]} />
            </div>
          </div>

          {/* Décomposition Fisher */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Décomposition</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Formule de Fisher — taux réel après inflation</div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Rendement nominal', value: `${inputs.nominalRate}%`, desc: 'Affiché par votre placement' },
                  { label: 'Taux d\'inflation', value: `${inputs.inflationRate}%`, desc: 'Hausse des prix annuelle' },
                  { label: 'Taux réel (Fisher)', value: `${r.realRate.toFixed(2)}%`, desc: '(1+n)/(1+i) − 1', highlight: true },
                  { label: 'Seuil minimal', value: `${inputs.inflationRate}%`, desc: 'Pour ne pas perdre de PA' },
                ].map((k, i) => (
                  <div key={i} style={{ background: k.highlight ? `${C}08` : 'var(--p-card-2)', border: `1px solid ${k.highlight ? C + '25' : 'var(--p-line)'}`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.highlight ? C : 'var(--p-text)', letterSpacing: '-0.03em', fontFamily: 'var(--p-mono)' }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 3 }}>{k.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut taux réel */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Taux réel</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Rendement après inflation (Fisher)</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <InflationDonut realRate={r.realRate} inflationRate={inputs.inflationRate} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: C, label: 'Valeur nominale', value: fmtK(r.nominalFinal), pct: 100 },
                  { color: '#34d399', label: 'Valeur réelle', value: fmtK(r.realFinal), pct: Math.round((r.realFinal / r.nominalFinal) * 100) },
                  { color: '#f87171', label: 'Cash (non investi)', value: fmtK(r.cashFinal), pct: Math.round((r.cashFinal / r.nominalFinal) * 100) },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct}%</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Que vaut 1 000 € */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Érosion monétaire</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Que vaut 1 000 € dans X ans ?</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[5, 10, 20, 30].map(yr => {
                const val = Math.round(1000 / Math.pow(1 + inputs.inflationRate / 100, yr))
                const pct = val / 10
                return (
                  <div key={yr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>Dans {yr} ans</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: val > 700 ? C : val > 500 ? '#fb923c' : '#f87171', fontFamily: 'var(--p-mono)' }}>{val} €</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: val > 700 ? C : val > 500 ? '#fb923c' : '#f87171' }} />
                    </div>
                  </div>
                )
              })}
              <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4, fontFamily: 'var(--p-mono)' }}>Pouvoir d&apos;achat de 1 000 € d&apos;aujourd&apos;hui à {inputs.inflationRate}% d&apos;inflation/an.</p>
            </div>
          </div>

          {/* Solutions anti-inflation */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Solutions anti-inflation</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Actions (MSCI World)', rendement: '7–9%', color: '#34d399' },
                { label: 'SCPI', rendement: '4–6%', color: C },
                { label: 'Livret A (indexé partial)', rendement: '3%', color: '#94a3b8' },
                { label: 'OAT indexée inflation', rendement: 'inflation +0.1%', color: '#94a3b8' },
                { label: 'Cash (CAT)', rendement: '2–3%', color: '#f87171' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>{s.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, fontFamily: 'var(--p-mono)' }}>{s.rendement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils</div>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((t, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isBeatingInflation
                      ? <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
                      : <TrendingDown style={{ width: 13, height: 13, color: t.color }} />}
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
                { label: 'Intérêts composés', href: '/dashboard/compound' },
                { label: 'Impact des frais', href: '/dashboard/frais' },
                { label: 'Livrets', href: '/dashboard/livrets' },
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

export default function InflationPage() {
  return <Suspense><InflationPageInner /></Suspense>
}
