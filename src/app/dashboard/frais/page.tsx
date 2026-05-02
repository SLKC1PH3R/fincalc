'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcFeesImpact, type FeesImpactInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { Download, TrendingUp } from 'lucide-react'
import { useCountUp } from '@/lib/use-count-up'

const C = '#fb923c'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'
  if (a >= 1_000) return Math.round(n / 1_000) + ' k€'
  return Math.round(n) + ' €'
}

// ─── Inline SVG chart ─────────────────────────────────────────────────────────
function FeesChart({ data, feeA, feeB }: {
  data: { year: number; a: number; b: number; gross?: number }[]
  feeA: number; feeB: number
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const allMax = Math.max(...data.map(d => Math.max(d.a, d.b))) * 1.06 || 1
  const N = data.length - 1

  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / allMax, 1) * h

  const ptsA = data.map((d, i) => ({ x: xOf(i), y: yOf(d.a) }))
  const ptsB = data.map((d, i) => ({ x: xOf(i), y: yOf(d.b) }))

  const lineA = ptsA.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineB = ptsB.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaA = `${lineA} L${ptsA[N].x},${PAD.t + h} L${ptsA[0].x},${PAD.t + h} Z`
  const areaB = `${lineB} L${ptsB[N].x},${PAD.t + h} L${ptsB[0].x},${PAD.t + h} Z`

  const yTicks = [0, allMax * 0.25, allMax * 0.5, allMax * 0.75, allMax]
  const xTicks = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="fgA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C} stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="fgB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#f87171" stopOpacity={0.02} />
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

      <path d={areaB} fill="url(#fgB)" />
      <path d={areaA} fill="url(#fgA)" />
      <path d={lineB} fill="none" stroke="#f87171" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineA} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

      <circle cx={ptsA[N].x} cy={ptsA[N].y} r={4.5} fill={C} />
      <circle cx={ptsA[N].x} cy={ptsA[N].y} r={10} fill={C} opacity={0.15} />
      <circle cx={ptsB[N].x} cy={ptsB[N].y} r={3.5} fill="#f87171" />
    </svg>
  )
}

// ─── Donut frais ──────────────────────────────────────────────────────────────
function FeesDonut({ finalA, finalB, grossFinal, size = 160 }: {
  finalA: number; finalB: number; grossFinal: number; size?: number
}) {
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r

  const pctA = grossFinal > 0 ? Math.min((finalA / grossFinal), 1) : 0
  const pctB = grossFinal > 0 ? Math.min((finalB / grossFinal), 1) : 0
  const dashA = circ * pctA
  const dashB = circ * pctB

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f87171" strokeWidth={14}
          strokeDasharray={`${dashB} ${circ - dashB}`} strokeDashoffset={0} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${dashA} ${circ - dashA}`} strokeDashoffset={0} opacity={0.85} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Écart</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 26, color: '#f87171', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>
          {grossFinal > 0 ? Math.round(((finalA - finalB) / grossFinal) * 100) : 0}%
        </div>
      </div>
    </div>
  )
}

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function FeesPageInner() {
  const [inputs, setInputs] = useState<FeesImpactInputs>({
    capital: 10000, monthly: 200, grossRate: 7, feeA: 0.2, feeB: 2.0, years: 20,
  })
  const set = (k: keyof FeesImpactInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcFeesImpact(inputs), [inputs])
  const finalAAnimated = useCountUp(r.finalA, 900)

  const tips = [
    { title: 'Impact des frais élevés', body: `Avec ${inputs.feeB}% de frais annuels, vous perdez ${r.pctLostB.toFixed(1)}% de votre capital potentiel sur ${inputs.years} ans — soit ${fmt(r.difference)} de différence.`, color: '#f87171' },
    inputs.feeB > 1.5
      ? { title: 'Fonds actifs sous-performants', body: 'Les fonds actifs affichent souvent 1.5–2.5% de frais. La majorité sous-performe leur indice de référence sur 15 ans.', color: '#fbbf24' }
      : { title: 'Frais maîtrisés', body: `Avec ${inputs.feeA}% de frais, vous conservez l'essentiel de votre rendement. Un bon choix d'enveloppe optimise encore davantage.`, color: C },
    { title: 'Règle d\'or ETF', body: `Un ETF MSCI World (ex: Amundi CW8) facture ~0.12–0.38%/an. Chaque 1% de frais = ~15–20% de capital en moins sur 20 ans.`, color: C },
    inputs.grossRate > 5
      ? { title: 'Effet amplificateur', body: "L'effet des frais est amplifié par un rendement élevé — plus votre capital est performant, plus les frais vous coûtent cher en valeur absolue.", color: '#fb923c' }
      : { title: 'Diversifiez vos enveloppes', body: 'Combinez PEA (avantage fiscal), assurance-vie et CTO pour optimiser la fiscalité en plus des frais.', color: C },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Impact des Frais</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Impact des Frais<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            ETF {inputs.feeA}% vs fonds actif {inputs.feeB}%. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Effet sur {inputs.years} ans.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Impact des Frais de Gestion',
            subtitle: `${fmt(inputs.capital)} · ${inputs.grossRate}% brut · ${inputs.years} ans`,
            kpis: [
              { label: `Scénario A (${inputs.feeA}%)`, value: fmt(r.finalA), highlight: true },
              { label: `Scénario B (${inputs.feeB}%)`, value: fmt(r.finalB) },
              { label: 'Différence', value: fmt(r.difference) },
              { label: 'Capital perdu (B)', value: `${r.pctLostB.toFixed(1)}%` },
            ],
            inputs: [
              { label: 'Capital initial', value: fmt(inputs.capital) },
              { label: 'Versement mensuel', value: fmt(inputs.monthly) },
              { label: 'Rendement brut', value: `${inputs.grossRate}%` },
              { label: 'Frais ETF (A)', value: `${inputs.feeA}%` },
              { label: 'Frais fonds (B)', value: `${inputs.feeB}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
            ],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="frais" name={`Frais ${inputs.feeA}% vs ${inputs.feeB}% · ${inputs.years}a`} inputs={inputs as any} results={r as any} />
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

              {[
                { label: 'Capital initial', k: 'capital' as const, min: 1000, max: 200000, step: 1000, disp: (v: number) => fmtK(v) },
                { label: 'Versement mensuel', k: 'monthly' as const, min: 0, max: 2000, step: 100, disp: (v: number) => `${v} €` },
                { label: 'Rendement brut', k: 'grossRate' as const, min: 3, max: 15, step: 0.5, disp: (v: number) => `${v}%` },
              ].map((s, idx) => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                  {idx < 2 && <div style={{ ...divSt, marginTop: 18 }} />}
                </div>
              ))}

              <div style={divSt} />

              {[
                { label: 'Frais ETF (A)', k: 'feeA' as const, min: 0.05, max: 1, step: 0.05, disp: (v: number) => `${v}%`, color: C },
                { label: 'Frais fonds actif (B)', k: 'feeB' as const, min: 0.5, max: 4, step: 0.25, disp: (v: number) => `${v}%`, color: '#f87171' },
                { label: 'Durée', k: 'years' as const, min: 5, max: 40, step: 1, disp: (v: number) => `${v} ans`, color: C },
              ].map((s, idx) => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                  {idx < 2 && <div style={{ ...divSt, marginTop: 18 }} />}
                </div>
              ))}

              <div style={divSt} />

              {/* Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--p-mono)' }}>Presets courants</div>
                {[
                  { label: 'ETF MSCI World', feeA: 0.2, feeB: 1.5 },
                  { label: 'ETF vs OPCVM', feeA: 0.35, feeB: 2.5 },
                ].map(p => (
                  <button key={p.label} onClick={() => setInputs(prev => ({ ...prev, feeA: p.feeA, feeB: p.feeB }))}
                    style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'var(--p-card-2)', border: '1px solid var(--p-line)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', textAlign: 'left' }}>
                    {p.label} — A:{p.feeA}% / B:{p.feeB}%
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Les frais s&apos;appliquent annuellement sur l&apos;encours — l&apos;effet est exponentiel dans le temps.
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Scénario A · ETF {inputs.feeA}% · {inputs.years} ans
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(finalAAnimated)}
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                  économie vs fonds : <span style={{ color: '#34d399', fontWeight: 700 }}>{fmtK(r.difference)}</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${r.finalA > 0 ? (r.finalB / r.finalA) * 100 : 0}%`, background: '#f87171', transition: 'width 0.5s' }} />
                    <div style={{ flex: 1, background: C }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>Fonds B {fmtK(r.finalB)}</span>
                    <span style={{ color: C, fontWeight: 700 }}>ETF A {fmtK(r.finalA)}</span>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: `Fonds ${inputs.feeB}% (B)`, value: fmtK(r.finalB), color: '#f87171' },
                  { label: 'Différence A–B', value: fmtK(r.difference), color: '#34d399' },
                  { label: 'Capital perdu frais B', value: `${r.pctLostB.toFixed(1)} %`, color: '#fb923c' },
                  { label: 'Rendement brut (sans frais)', value: fmtK(r.grossFinal) },
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
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Divergence des deux scénarios sur {inputs.years} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[{ color: C, label: `ETF ${inputs.feeA}%` }, { color: '#f87171', label: `Fonds ${inputs.feeB}%` }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <FeesChart data={r.chartData as { year: number; a: number; b: number }[]} feeA={inputs.feeA} feeB={inputs.feeB} />
            </div>
          </div>

          {/* Résultats comparés */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Résultats comparés</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>À {inputs.years} ans — capital final</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: `Scénario A — ETF ${inputs.feeA}%/an`, value: r.finalA, color: C, pct: 100 },
                { label: `Scénario B — Fonds ${inputs.feeB}%/an`, value: r.finalB, color: '#f87171', pct: r.finalA > 0 ? r.finalB / r.finalA * 100 : 0 },
                { label: 'Rendement brut (sans frais)', value: r.grossFinal, color: 'var(--p-text-faint)', pct: r.finalA > 0 ? r.grossFinal / r.finalA * 100 : 0 },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.color, fontFamily: 'var(--p-mono)' }}>{fmt(row.value)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(row.pct, 100)}%`, borderRadius: 3, background: row.color, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut écart */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition finale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>ETF A vs Fonds B sur {inputs.years} ans</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <FeesDonut finalA={r.finalA} finalB={r.finalB} grossFinal={r.grossFinal} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: C, label: `ETF A (${inputs.feeA}%)`, value: fmtK(r.finalA), pct: r.grossFinal > 0 ? Math.round((r.finalA / r.grossFinal) * 100) : 0 },
                  { color: '#f87171', label: `Fonds B (${inputs.feeB}%)`, value: fmtK(r.finalB), pct: r.grossFinal > 0 ? Math.round((r.finalB / r.grossFinal) * 100) : 0 },
                  { color: 'var(--p-text-faint)', label: 'Brut (sans frais)', value: fmtK(r.grossFinal), pct: 100 },
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

          {/* Analyse */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Analyse</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Impact frais B sur {inputs.years} ans</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ background: `${C}0a`, border: `1px solid ${C}20`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: 'var(--p-mono)' }}>Capital brut absorbé par les frais B</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f87171', letterSpacing: '-0.5px', fontFamily: 'var(--p-mono)' }}>{r.pctLostB.toFixed(1)}%</div>
                <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 3 }}>soit {fmtK(r.difference)} de capital perdu</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Coût annuel frais A', value: `~${fmt(Math.round(inputs.capital * inputs.feeA / 100))}` },
                  { label: 'Coût annuel frais B', value: `~${fmt(Math.round(inputs.capital * inputs.feeB / 100))}` },
                  { label: 'Surcoût annuel B vs A', value: `~${fmt(Math.round(inputs.capital * (inputs.feeB - inputs.feeA) / 100))}` },
                  { label: 'Rendement net A', value: `${(inputs.grossRate - inputs.feeA).toFixed(2)}%` },
                  { label: 'Rendement net B', value: `${(inputs.grossRate - inputs.feeB).toFixed(2)}%` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-faint)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', fontFamily: 'var(--p-mono)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Frais typiques */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Frais typiques</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Par catégorie de fonds</div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'ETF indiciel', pct: 0.15, max: 4, color: C },
                { label: 'ETF smart beta', pct: 0.35, max: 4, color: C },
                { label: 'OPCVM actif (entrée)', pct: 1.5, max: 4, color: '#fbbf24' },
                { label: 'OPCVM actif (haut)', pct: 2.5, max: 4, color: '#f87171' },
                { label: 'Fonds PE / FCPI', pct: 3.5, max: 4, color: '#f87171' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>{row.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: row.color, fontFamily: 'var(--p-mono)' }}>{row.pct}%/an</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(row.pct / row.max) * 100}%`, borderRadius: 2, background: row.color }} />
                  </div>
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
                { label: 'Intérêts composés', href: '/dashboard/compound' },
                { label: 'DCA', href: '/dashboard/dca' },
                { label: 'Inflation & Pouvoir d\'achat', href: '/dashboard/inflation' },
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

export default function FeesPage() {
  return <Suspense><FeesPageInner /></Suspense>
}
