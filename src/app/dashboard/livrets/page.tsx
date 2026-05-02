'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcLivrets, type LivretsInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useCountUp } from '@/lib/use-count-up'
import { Download, PiggyBank, TrendingUp, RefreshCw } from 'lucide-react'

const C = '#34d399'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'; if (a >= 1_000) return Math.round(n / 1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

// ─── LivretsChart ─────────────────────────────────────────────────────────────
function LivretsChart({ chartData, duration }: {
  chartData: { year: number; livretA: number; lep: number; etf: number }[]
  duration: number
}) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const data = chartData
  const N = data.length - 1
  const maxV = Math.max(...data.map(d => Math.max(d.livretA, d.lep, d.etf))) * 1.06 || 1
  const xOf = (i: number) => PAD.l + (i / (N || 1)) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / maxV, 1) * h

  const line = (key: 'livretA' | 'lep' | 'etf') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d[key]).toFixed(1)}`).join(' ')

  const area = (key: 'livretA' | 'lep' | 'etf') => {
    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d[key]) }))
    return `${line(key)} L${pts[N].x},${PAD.t + h} L${pts[0].x},${PAD.t + h} Z`
  }

  const COLORS = { livretA: C, lep: '#2dd4bf', etf: '#818cf8' }
  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]

  const mDots: { x: number; y: number; label: string }[] = []
  const yrStep = Math.max(1, Math.floor(duration / 5))
  for (let yr = yrStep; yr <= duration; yr += yrStep) {
    const idx = data.findIndex(d => d.year >= yr)
    if (idx > 0 && idx <= N) mDots.push({ x: xOf(idx), y: yOf(data[idx].livretA), label: `${yr}a` })
  }

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lgLivA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.28} />
          <stop offset="100%" stopColor={C} stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id="lgLep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.03} />
        </linearGradient>
        <linearGradient id="lgEtf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.04} />
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

      <path d={area('etf')} fill="url(#lgEtf)" />
      <path d={area('lep')} fill="url(#lgLep)" />
      <path d={area('livretA')} fill="url(#lgLivA)" />

      <path d={line('etf')} fill="none" stroke="#818cf8" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
      <path d={line('lep')} fill="none" stroke="#2dd4bf" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3" opacity={0.8} />
      <path d={line('livretA')} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

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
          <circle cx={xOf(N)} cy={yOf(data[N].livretA)} r={4.5} fill={C} />
          <circle cx={xOf(N)} cy={yOf(data[N].livretA)} r={10} fill={C} opacity={0.15} />
        </>
      )}
    </svg>
  )
}

// ─── InterestBarChart ─────────────────────────────────────────────────────────
function InterestBarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const W = 280, H = 180, PAD = { l: 0, r: 0, t: 8, b: 32 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const maxV = Math.max(...bars.map(b => b.value)) * 1.1 || 1
  const barW = Math.floor(w / bars.length) - 6

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        {bars.map((b, i) => (
          <linearGradient key={i} id={`ibg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={b.color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={b.color} stopOpacity={0.55} />
          </linearGradient>
        ))}
      </defs>
      {bars.map((b, i) => {
        const bh = (b.value / maxV) * h
        const x = PAD.l + i * (w / bars.length) + (w / bars.length - barW) / 2
        const y = PAD.t + h - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={`url(#ibg${i})`} />
            <text x={x + barW / 2} y={H - 18} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" fontWeight={600}>{b.label}</text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8.5} fontFamily="var(--p-mono)" fill={b.color} fontWeight={700}>{fmtK(b.value)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── RepartitionDonut ─────────────────────────────────────────────────────────
function RepartitionDonut({ capital, interest, size = 160 }: { capital: number; interest: number; size?: number }) {
  const total = capital + interest || 1
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const dashCap = c * (capital / total)
  const pctI = Math.round((interest / total) * 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${C}15`} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={14}
          strokeDasharray={`${dashCap} ${c - dashCap}`} strokeDashoffset={0} opacity={0.5} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${c - dashCap} ${dashCap}`} strokeDashoffset={-dashCap} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{pctI}%</div>
      </div>
    </div>
  )
}

const DEFAULTS: LivretsInputs = { balance: 10000, monthly: 200, duration: 15 }

function LivretsPageInner() {
  const [inputs, setInputs] = useState<LivretsInputs>(DEFAULTS)
  const set = (k: keyof LivretsInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcLivrets(inputs), [inputs])

  const bestLivret = r.livrets.reduce((a, b) => a.final > b.final ? a : b)
  const totalInvested = inputs.balance + inputs.monthly * inputs.duration * 12
  const totalAnimated = useCountUp(bestLivret.final, 1000)

  const interestPct = Math.round((bestLivret.interest / (bestLivret.final || 1)) * 100)
  const capitalPct = 100 - interestPct

  const tips = [
    inputs.balance > 22950
      ? { title: 'Plafond Livret A dépassé', body: `Votre capital dépasse le plafond du Livret A (22 950 €). L'excédent de ${fmtK(inputs.balance - 22950)} ne peut pas y être placé.`, color: '#fbbf24' }
      : { title: 'Plafond Livret A', body: 'Le Livret A est plafonné à 22 950 €. Pensez à diversifier avec le LDDS (12 000 €) et le LEP (10 000 €, sous conditions).', color: C },
    { title: 'Manque à gagner ETF', body: r.opportunity > 5000 ? `Manque à gagner vs ETF : ${fmtK(r.opportunity)} sur ${inputs.duration} ans. Les livrets sont sécurisés mais limitent votre rendement.` : 'Les livrets sont idéaux pour le fonds d\'urgence (3–6 mois de charges), pas pour l\'investissement long terme.', color: '#818cf8' },
    { title: 'Exonération fiscale', body: 'Les livrets réglementés sont exonérés d\'IR et de PS. Idéaux pour votre épargne de précaution sans risque de perte.', color: C },
  ]

  const interestBars = (r.livrets as { name: string; interest: number }[]).map(l => ({
    label: l.name,
    value: Math.round(l.interest),
    color: C,
  })).concat([{
    label: 'ETF 7%',
    value: Math.round(r.etfNetFinal - totalInvested),
    color: '#818cf8',
  }])

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Livrets Réglementés</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Livrets Réglementés<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Épargne garantie sans risque. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Livret A · LDDS · LEP · CEL vs ETF.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Livrets Réglementés',
            subtitle: `${fmt(inputs.balance)} initial · ${fmt(inputs.monthly)}/mois · ${inputs.duration} ans`,
            kpis: [
              { label: 'Meilleur livret', value: fmt(bestLivret.final), highlight: true },
              { label: 'ETF 7% net', value: fmt(r.etfNetFinal) },
              { label: 'Manque à gagner', value: fmt(r.opportunity) },
              { label: 'Meilleur taux', value: `${bestLivret.rate}%` },
            ],
            inputs: [
              { label: 'Capital initial', value: fmt(inputs.balance) },
              { label: 'Versement mensuel', value: fmt(inputs.monthly) },
              { label: 'Durée', value: `${inputs.duration} ans` },
            ],
            sections: [{
              title: 'Comparaison des livrets',
              items: (r.livrets as { name: string; rate: number; cap: number; final: number }[]).map(l => ({ label: `${l.name} (${l.rate}% · plafond ${fmt(l.cap)})`, value: fmt(l.final) }))
                .concat([{ label: 'ETF World 7% net (Flat Tax 30%)', value: fmt(r.etfNetFinal) }]),
            }],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="livrets" name={`Livrets ${fmt(inputs.balance)} × ${inputs.duration}a`} inputs={inputs as any} results={r as any} />
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
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Capital initial (€)</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.balance} onChange={e => set('balance')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
                {inputs.balance > 22950 && (
                  <p style={{ fontSize: 11, color: '#fbbf24', margin: 0 }}>⚠ Dépasse le plafond Livret A (22 950 €)</p>
                )}
              </div>
              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Versement mensuel</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.monthly} €</span>
                </div>
                <Slider min={0} max={500} step={50} value={[inputs.monthly]} onValueChange={([v]) => set('monthly')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 100, 200, 300].map(v => (
                    <button key={v} onClick={() => set('monthly')(v)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: inputs.monthly === v ? `${C}12` : 'transparent',
                        border: inputs.monthly === v ? `1px solid ${C}30` : '1px solid var(--p-line)',
                        color: inputs.monthly === v ? C : 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                      {v === 0 ? 'Aucun' : `${v}€`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Durée</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.duration} ans</span>
                </div>
                <Slider min={1} max={30} step={1} value={[inputs.duration]} onValueChange={([v]) => set('duration')(v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                  {[5, 10, 15, 20, 30].map(y => (
                    <button key={y} onClick={() => set('duration')(y)}
                      style={{ fontSize: 10, color: inputs.duration === y ? C : 'var(--p-text-faint)', background: inputs.duration === y ? `${C}12` : 'transparent', border: inputs.duration === y ? `1px solid ${C}30` : '1px solid transparent', borderRadius: 6, padding: '2px 5px', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>
                      {y}a
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Taux actuels */}
          <div style={{ marginTop: 10, background: `${C}0d`, border: `1px solid ${C}25`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>Taux actuels 2026</div>
            {[
              { name: 'Livret A', rate: '3,00 %', cap: '22 950 €' },
              { name: 'LDDS', rate: '3,00 %', cap: '12 000 €' },
              { name: 'LEP', rate: '4,00 %', cap: '10 000 €' },
              { name: 'CEL', rate: '2,00 %', cap: '15 300 €' },
            ].map(l => (
              <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--p-line)' }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{l.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{l.rate}</span>
                  <span style={{ fontSize: 10, color: 'var(--p-text-faint)', marginLeft: 6, fontFamily: 'var(--p-mono)' }}>max {l.cap}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Calcul sur la base des taux réglementés en vigueur.
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Meilleur livret · {inputs.duration} ans
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(totalAnimated)}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${capitalPct}%`, background: 'repeating-linear-gradient(45deg, #94a3b8 0 4px, color-mix(in srgb, #94a3b8 55%, transparent) 4px 8px)' }} />
                    <div style={{ flex: 1, background: C }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Capital versé</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text-em)', marginTop: 4 }}>{fmtK(totalInvested)}</div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{capitalPct}% du total</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C, fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts nets</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text)', marginTop: 4 }}>{fmtK(bestLivret.interest)}</div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>exonérés IR+PS</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Meilleur livret', value: `${bestLivret.name} · ${bestLivret.rate}%` },
                  { label: 'ETF 7% net', value: fmtK(r.etfNetFinal), color: '#818cf8' },
                  { label: 'Manque à gagner', value: fmtK(r.opportunity), color: '#f87171' },
                  { label: 'Capital investi', value: fmtK(totalInvested) },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau comparatif */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Comparaison à {inputs.duration} ans</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Tous les livrets réglementés + ETF</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr 1fr', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
              <span>Produit</span><span style={{ textAlign: 'right' }}>Taux</span><span style={{ textAlign: 'right' }}>Plafond</span><span style={{ textAlign: 'right' }}>Valeur finale</span><span style={{ textAlign: 'right' }}>Intérêts</span>
            </div>
            {(r.livrets as { name: string; rate: number; cap: number; final: number; interest: number; isCapped: boolean }[]).map(l => (
              <div key={l.name} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr 1fr', padding: '11px 18px', alignItems: 'center', borderBottom: '1px solid var(--p-line)', background: l.name === bestLivret.name ? `${C}06` : 'transparent', fontSize: 12, fontFamily: 'var(--p-mono)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PiggyBank style={{ width: 13, height: 13, color: C, flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, color: 'var(--p-text-em)' }}>{l.name}</span>
                  {l.isCapped && <span style={{ fontSize: 9, color: '#fb923c', background: 'rgba(251,146,60,0.12)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PLAFONNÉ</span>}
                  {l.name === bestLivret.name && <span style={{ fontSize: 9, color: C, background: `${C}18`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>MEILLEUR</span>}
                </div>
                <span style={{ color: C, fontWeight: 700, textAlign: 'right' }}>{l.rate}%</span>
                <span style={{ color: 'var(--p-text-dim)', textAlign: 'right' }}>{fmtK(l.cap)}</span>
                <span style={{ color: 'var(--p-text)', fontWeight: 700, textAlign: 'right' }}>{fmtK(l.final)}</span>
                <span style={{ color: C, fontWeight: 600, textAlign: 'right' }}>+{fmtK(l.interest)}</span>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 1fr 1fr', padding: '11px 18px', alignItems: 'center', background: 'rgba(129,140,248,0.06)', fontSize: 12, fontFamily: 'var(--p-mono)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp style={{ width: 13, height: 13, color: '#818cf8', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: 'var(--p-text-em)' }}>ETF World (7% brut)</span>
              </div>
              <span style={{ color: '#818cf8', fontWeight: 700, textAlign: 'right' }}>4,9%</span>
              <span style={{ color: 'var(--p-text-faint)', textAlign: 'right' }}>Illimité</span>
              <span style={{ color: '#818cf8', fontWeight: 800, textAlign: 'right' }}>{fmtK(r.etfNetFinal)}</span>
              <span style={{ color: '#818cf8', fontWeight: 600, textAlign: 'right' }}>+{fmtK(r.etfNetFinal - totalInvested)}</span>
            </div>
          </div>

          {/* Évolution comparative — inline SVG */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Évolution comparative</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Livret A · LEP · ETF sur {inputs.duration} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[
                  { color: C, label: 'Livret A' },
                  { color: '#2dd4bf', label: 'LEP', dashed: true },
                  { color: '#818cf8', label: 'ETF net', dashed: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: l.dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <LivretsChart
                chartData={(r.chartData as { year: number; livretA: number; lep: number; etf: number }[])}
                duration={inputs.duration}
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Répartition donut */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition finale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Sur {fmtK(bestLivret.final)} acquis ({bestLivret.name})</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <RepartitionDonut capital={totalInvested} interest={bestLivret.interest} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: C, label: 'Intérêts nets', value: fmtK(bestLivret.interest), pct: interestPct },
                  { color: '#94a3b8', label: 'Capital versé', value: fmtK(totalInvested), pct: capitalPct, dashed: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: row.dashed ? `repeating-linear-gradient(45deg, ${row.color} 0 2px, transparent 2px 4px)` : row.color, border: row.dashed ? `1px solid ${row.color}` : 'none' }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct}%</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intérêts par produit — inline bar chart */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Intérêts par produit</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Gains nets sur {inputs.duration} ans</div>
            </div>
            <div style={{ padding: '12px 16px 8px' }}>
              <InterestBarChart bars={interestBars} />
            </div>
          </div>

          {/* Analyse */}
          <div style={{ background: 'var(--p-card)', border: `1px solid ${C}25`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <PiggyBank style={{ width: 14, height: 14, color: C }} />
              <div style={eyebrow}>Analyse du rendement</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                Le <strong style={{ color: C }}>{bestLivret.name}</strong> vous rapporte {fmtK(bestLivret.interest)} d&apos;intérêts nets sur {inputs.duration} ans, totalement exonérés d&apos;impôts. L&apos;ETF génère {fmtK(r.opportunity)} de plus, mais avec un risque de perte en capital.
              </p>
              <div style={{ padding: '8px 10px', background: 'var(--p-card-2)', borderRadius: 8, border: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Manque à gagner vs ETF</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171', fontFamily: 'var(--p-mono)' }}>{fmtK(r.opportunity)}</span>
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
                { label: "Inflation & Pouvoir d'achat", href: '/dashboard/inflation' },
                { label: 'DCA — Versement régulier', href: '/dashboard/dca' },
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

export default function LivretsPage() {
  return <Suspense><LivretsPageInner /></Suspense>
}
