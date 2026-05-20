'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcSCPI, type SCPIInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useCountUp } from '@/lib/use-count-up'
import { Download, Building2, TrendingUp, RefreshCw } from 'lucide-react'

const C = '#f59e0b'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'; if (a >= 1_000) return Math.round(n / 1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const TMI_OPTIONS = [0, 11, 30, 41, 45]
const DEFAULTS: SCPIInputs = { capital: 50000, distributionRate: 4.5, revaluationRate: 1, fraisSouscription: 10, tmi: 30, duration: 15 }

// ─── SCPIChart ────────────────────────────────────────────────────────────────
function SCPIChart({ chartData, duration }: {
  chartData: { year: number; valeurParts: number; cumRevenu: number; total: number }[]
  duration: number
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const data = chartData
  const N = data.length - 1
  const maxV = Math.max(...data.map(d => d.total)) * 1.06 || 1
  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / maxV, 1) * h

  const line = (key: 'valeurParts' | 'cumRevenu' | 'total') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}`).join(' ')

  const area = (key: 'valeurParts' | 'cumRevenu' | 'total') => {
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d[key]) }))
    return `${line(key)} L${pts[N].x},${PAD.t + h} L${pts[0].x},${PAD.t + h} Z`
  }

  const COLORS = { valeurParts: C, cumRevenu: '#34d399', total: '#818cf8' }
  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]

  const mDots: { x: number; y: number; label: string }[] = []
  const yrStep = Math.max(1, Math.floor(duration / 5))
  for (let yr = yrStep; yr <= duration; yr += yrStep) {
    const idx = data.findIndex(d => d.year >= yr)
    if (idx > 0 && idx <= N) mDots.push({ x: xOf(idx), y: yOf(data[idx].total), label: `${yr}a` })
  }

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="scpiTotal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="scpiRevenu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#34d399" stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="scpiParts" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.36} />
          <stop offset="100%" stopColor={C} stopOpacity={0.08} />
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

      <path d={area('total')} fill="url(#scpiTotal)" />
      <path d={area('cumRevenu')} fill="url(#scpiRevenu)" />
      <path d={area('valeurParts')} fill="url(#scpiParts)" />

      <path d={line('total')} fill="none" stroke="#818cf8" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
      <path d={line('cumRevenu')} fill="none" stroke="#34d399" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" opacity={0.85} />
      <path d={line('valeurParts')} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

      {mDots.map((m, i) => (
        <g key={i}>
          <line x1={m.x} y1={PAD.t + h} x2={m.x} y2={m.y} stroke={C} strokeWidth={1} opacity={0.22} strokeDasharray="2 3" />
          <circle cx={m.x} cy={m.y} r={7} fill="var(--p-card)" stroke={C} strokeWidth={1.5} />
          <circle cx={m.x} cy={m.y} r={3} fill={C} />
          <text x={m.x} y={PAD.t + h + 15} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-dim)" fontWeight={700} letterSpacing="0.04em">{m.label}</text>
        </g>
      ))}

      {data.length > 0 && (
        <>
          <circle cx={xOf(N)} cy={yOf(data[N].total)} r={4.5} fill={C} />
          <circle cx={xOf(N)} cy={yOf(data[N].total)} r={10} fill={C} opacity={0.15} />
        </>
      )}
    </svg>
  )
}

// ─── SCPIDonut ────────────────────────────────────────────────────────────────
function SCPIDonut({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 14
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let angle = -Math.PI / 2
  const paths: { d: string; color: string }[] = []

  for (const seg of segments) {
    const sweep = (seg.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep)
    const y2 = cy + r * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    paths.push({ d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`, color: seg.color })
    angle += sweep
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <mask id="scpiDonutMask">
            <rect width={size} height={size} fill="white" />
            <circle cx={cx} cy={cy} r={r * 0.55} fill="black" />
          </mask>
        </defs>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} mask="url(#scpiDonutMask)" opacity={0.92} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--p-card)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 8.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Total</div>
        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 800, color: 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 2 }}>{fmtK(total)}</div>
      </div>
    </div>
  )
}

function SCPIPageInner() {
  const [inputs, setInputs] = useState<SCPIInputs>(DEFAULTS)
  const set = (k: keyof SCPIInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcSCPI(inputs), [inputs])

  const totalAnimated = useCountUp(r.totalReturn, 1000)

  const tips = [
    { title: 'Frais de souscription', body: `Après ${inputs.fraisSouscription}% de frais d'entrée, votre capital effectivement investi est de ${fmtK(r.capitalInvested)}. Il faut 5–7 ans minimum pour les absorber.`, color: '#fbbf24' },
    { title: 'Fiscalité foncière', body: `Rendement net après TMI ${inputs.tmi}% + PS 17.2% : ${r.netYield.toFixed(2)}%/an — soit ${fmtK(r.netIncome)}/an et ${fmtK(Math.round(r.netIncome / 12))}/mois.`, color: C },
    inputs.tmi >= 41
      ? { title: 'SCPI via assurance-vie', body: 'À forte TMI, envisagez une SCPI via assurance-vie (taxation à 7.5% après 8 ans) pour réduire la pression fiscale sur les revenus.', color: '#818cf8' }
      : { title: 'Retour total', body: `Sur ${inputs.duration} ans : ${fmtK(r.totalNetIncome)} de revenus nets + ${fmtK(Math.max(0, r.finalValue - r.capitalInvested))} de revalorisation = ${fmtK(r.totalReturn)} de retour total.`, color: '#34d399' },
  ]

  const donutSegments = [
    { value: r.totalNetIncome, color: '#34d399', label: 'Revenu net' },
    { value: Math.round(r.annualIncome * r.taxRate / 100 * inputs.duration), color: '#f87171', label: 'Fiscalité' },
    { value: Math.round(inputs.capital * inputs.fraisSouscription / 100), color: '#fb923c', label: 'Frais entrée' },
  ]

  const chartData = (r.chartData as { year: number; valeurParts: number; cumRevenu: number; total: number }[])

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>SCPI</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            SCPI — Pierre-Papier<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Immobilier sans contrainte. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Rendement net · Fiscalité foncière · Revalorisation.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'SCPI — Pierre-Papier',
            subtitle: `${fmt(inputs.capital)} · ${inputs.distributionRate}% distribution · TMI ${inputs.tmi}% · ${inputs.duration} ans`,
            kpis: [
              { label: 'Revenu net/an', value: fmt(r.netIncome), highlight: true },
              { label: 'Rendement net', value: `${r.netYield.toFixed(2)}%` },
              { label: 'Valeur finale parts', value: fmt(r.finalValue) },
              { label: 'Retour total net', value: fmt(r.totalReturn) },
            ],
            inputs: [
              { label: 'Capital', value: fmt(inputs.capital) },
              { label: 'Taux de distribution', value: `${inputs.distributionRate}%` },
              { label: 'Revalorisation', value: `${inputs.revaluationRate}%/an` },
              { label: 'Frais souscription', value: `${inputs.fraisSouscription}%` },
              { label: 'TMI', value: `${inputs.tmi}%` },
              { label: 'Durée', value: `${inputs.duration} ans` },
            ],
            sections: [{
              title: 'Fiscalité des revenus',
              items: [
                { label: 'Revenu brut annuel', value: fmt(r.annualIncome) },
                { label: "Taux d'imposition effectif", value: `${r.taxRate.toFixed(1)}%` },
                { label: 'Revenu net annuel', value: fmt(r.netIncome) },
                { label: 'Revenu net mensuel', value: fmt(Math.round(r.netIncome / 12)) },
                { label: `Revenus nets sur ${inputs.duration} ans`, value: fmt(r.totalNetIncome) },
                { label: 'Valeur parts à terme', value: fmt(r.finalValue) },
                { label: 'ROI total', value: `${r.roi.toFixed(1)}%` },
              ]
            }],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="scpi" name={`SCPI ${inputs.distributionRate}% · TMI ${inputs.tmi}% · ${inputs.duration}a`} inputs={inputs as any} results={r as any} />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => setInputs(DEFAULTS)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {[
                { label: 'Capital investi', k: 'capital' as const, min: 5000, max: 500000, step: 5000, disp: (v: number) => fmtK(v) },
                { label: 'Taux de distribution', k: 'distributionRate' as const, min: 2, max: 8, step: 0.25, disp: (v: number) => `${v}%` },
                { label: 'Revalorisation des parts', k: 'revaluationRate' as const, min: -2, max: 5, step: 0.25, disp: (v: number) => `${v}%/an` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={divSt} />

              {[
                { label: 'Frais de souscription', k: 'fraisSouscription' as const, min: 0, max: 15, step: 0.5, disp: (v: number) => `${v}%` },
                { label: 'Durée', k: 'duration' as const, min: 3, max: 30, step: 1, disp: (v: number) => `${v} ans` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={divSt} />

              {/* TMI selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelSt}>Tranche marginale d&apos;imposition</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {TMI_OPTIONS.map(t => (
                    <button key={t} onClick={() => set('tmi')(t)}
                      style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${inputs.tmi === t ? C : 'var(--p-line)'}`, background: inputs.tmi === t ? `${C}20` : 'transparent', color: inputs.tmi === t ? C : 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', transition: 'all 0.15s' }}>
                      {t}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Fiscalité note */}
              <div style={{ background: `${C}08`, border: `1px solid ${C}20`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ ...eyebrow, marginBottom: 6, fontSize: 9.5 }}>Régime foncier</div>
                <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5, margin: 0 }}>Les revenus SCPI sont imposés comme revenus fonciers : TMI + 17.2% de prélèvements sociaux.</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: C, marginTop: 6, fontFamily: 'var(--p-mono)' }}>Taux effectif : {r.taxRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Mini-résumé */}
          <div style={{ marginTop: 10, background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ ...eyebrow, marginBottom: 2 }}>Résumé</div>
            {[
              { label: 'Revenu net/mois', value: fmtK(Math.round(r.netIncome / 12)), color: C },
              { label: 'Rendement net', value: `${r.netYield.toFixed(2)}%`, color: 'var(--p-text)' },
              { label: 'Capital investi eff.', value: fmtK(r.capitalInvested), color: 'var(--p-text-dim)' },
              { label: 'ROI total', value: `${r.roi.toFixed(1)}%`, color: '#34d399' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color, fontFamily: 'var(--p-mono)' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Simulation basée sur les taux indiqués, sans inflation.
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Retour total net · {inputs.duration} ans
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(totalAnimated)}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${Math.round((r.totalNetIncome / (r.totalReturn || 1)) * 100)}%`, background: '#34d399' }} />
                    <div style={{ flex: 1, background: C }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Revenus nets</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{fmtK(r.totalNetIncome)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C, fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Revalorisation</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text)', marginTop: 4 }}>{fmtK(Math.max(0, r.finalValue - r.capitalInvested))}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Revenu net/an', value: fmtK(r.netIncome), color: C },
                  { label: 'Rendement net', value: `${r.netYield.toFixed(2)}%` },
                  { label: 'Valeur parts finale', value: fmtK(r.finalValue) },
                  { label: 'ROI total', value: `${r.roi.toFixed(1)}%`, color: '#34d399' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Évolution du Patrimoine — inline SVG */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Trajectoire</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Évolution du Patrimoine — {inputs.duration} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[
                  { color: C, label: 'Valeur parts' },
                  { color: '#34d399', label: 'Revenus nets cumulés', dashed: true },
                  { color: '#818cf8', label: 'Total', dashed: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: l.dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <SCPIChart chartData={chartData} duration={inputs.duration} />
            </div>
          </div>

          {/* Détail rentabilité */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Détail de la rentabilité</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Décomposition sur {inputs.duration} ans</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Capital investi effectif', value: fmtK(r.capitalInvested), desc: `après ${inputs.fraisSouscription}% frais` },
                { label: 'Revenu brut annuel', value: fmtK(r.annualIncome), desc: `${inputs.distributionRate}% du capital net` },
                { label: 'Fiscalité (TMI + PS)', value: `${r.taxRate.toFixed(1)}%`, desc: `${inputs.tmi}% + 17.2% PS`, highlight: true },
                { label: 'Revenu net annuel', value: fmtK(r.netIncome), desc: `${fmtK(Math.round(r.netIncome / 12))}/mois` },
                { label: `Revenus nets × ${inputs.duration} ans`, value: fmtK(r.totalNetIncome), desc: 'sans réinvestissement' },
                { label: 'PV parts estimée', value: fmtK(Math.max(0, r.finalValue - r.capitalInvested)), desc: `à ${inputs.revaluationRate}%/an` },
              ].map(k => (
                <div key={k.label} style={{ background: k.highlight ? `${C}08` : 'var(--p-card-2)', border: `1px solid ${k.highlight ? C + '25' : 'var(--p-line)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 800, color: k.highlight ? C : 'var(--p-text)', letterSpacing: '-0.03em' }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 3 }}>{k.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut répartition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition sur {inputs.duration} ans</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Revenu · Fiscalité · Frais</div>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <SCPIDonut segments={donutSegments} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donutSegments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: seg.color }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{seg.label}</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: seg.color }}>{fmtK(seg.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCPI référence */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>SCPI populaires</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Indicatif 2024 — Source ASPIM</div>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { name: 'Primopierre', td: '4.48%', type: 'Bureaux' },
                { name: 'Immorente', td: '4.60%', type: 'Commerce' },
                { name: 'Épargne Foncière', td: '4.10%', type: 'Diversifié' },
                { name: 'Corum Origin', td: '6.06%', type: 'Europe' },
                { name: 'Pierval Santé', td: '4.97%', type: 'Santé' },
                { name: 'Novaxia Néo', td: '6.51%', type: 'Urbain' },
              ].map(s => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text)', fontFamily: 'var(--p-mono)' }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{s.type}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C, fontFamily: 'var(--p-mono)' }}>{s.td}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 style={{ width: 14, height: 14, color: C }} />
              <div style={eyebrow}>Conseils</div>
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
                { label: 'Prêt immobilier', href: '/dashboard/mortgage' },
                { label: 'Intérêts composés', href: '/dashboard/compound' },
                { label: 'Dividendes & Revenus passifs', href: '/dashboard/dividends' },
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
    </div>
  )
}

export default function SCPIPage() {
  return <Suspense><SCPIPageInner /></Suspense>
}
