'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calcConsumerCredit, type ConsumerCreditInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useCountUp } from '@/lib/use-count-up'

const C = '#f87171'

// ─── local formatters ─────────────────────────────────────────────────────────
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const GAP = 16

// ─── AmortChart ───────────────────────────────────────────────────────────────
function AmortChart({ data }: { data: { month: number; remaining: number; paid: number }[] }) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const N = data.length - 1
  if (N <= 0) return null
  const maxV = Math.max(...data.map(d => Math.max(d.remaining, d.paid)), 1) * 1.06

  const xOf = (i: number) => PAD.l + (i / N) * w
  const yOf = (v: number) => PAD.t + h - Math.min(v / maxV, 1) * h

  const remPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.remaining) }))
  const paidPts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.paid) }))

  const lineR = remPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineP = paidPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaR = `${lineR} L${remPts[N].x},${PAD.t + h} L${remPts[0].x},${PAD.t + h} Z`

  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]
  const step = Math.max(1, Math.floor(N / 5))
  const xLabels = data.filter((_, i) => i % step === 0 || i === N)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ccRem" x1="0" y1="0" x2="0" y2="1">
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
      {xLabels.map((d) => {
        const idx = data.indexOf(d)
        const x = xOf(idx)
        return (
          <text key={d.month} x={x} y={PAD.t + h + 15} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">M{d.month}</text>
        )
      })}
      <path d={areaR} fill="url(#ccRem)" />
      <path d={lineR} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineP} fill="none" stroke="#fbbf24" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
      <circle cx={remPts[N].x} cy={remPts[N].y} r={4.5} fill={C} />
      <circle cx={remPts[N].x} cy={remPts[N].y} r={10} fill={C} opacity={0.18} />
    </svg>
  )
}

// ─── CostDonut ────────────────────────────────────────────────────────────────
function CostDonut({ capital, interest, missed, size = 160 }: { capital: number; interest: number; missed: number; size?: number }) {
  const total = capital + interest + missed || 1
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r

  const dashCap = circ * (capital / total)
  const dashInt = circ * (interest / total)

  const pctInt = Math.round((interest / total) * 100)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        {/* capital arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,200,200,0.22)" strokeWidth={14}
          strokeDasharray={`${dashCap} ${circ - dashCap}`} strokeDashoffset={0} />
        {/* interest arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${dashInt} ${circ - dashInt}`} strokeDashoffset={-dashCap} />
        {/* missed arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fb923c" strokeWidth={14}
          strokeDasharray={`${circ - dashCap - dashInt} ${dashCap + dashInt}`} strokeDashoffset={-(dashCap + dashInt)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{pctInt}%</div>
      </div>
    </div>
  )
}

function ConsumerCreditPageInner() {
  const [amount, setAmount] = useState(10000)
  const [taeg, setTaeg] = useState(5.5)
  const [durationMonths, setDurationMonths] = useState(48)
  const [alternativeRate, setAlternativeRate] = useState(7)

  const inputs: ConsumerCreditInputs = useMemo(() => ({
    amount, taeg, durationMonths, alternativeRate,
  }), [amount, taeg, durationMonths, alternativeRate])

  const res = useMemo(() => calcConsumerCredit(inputs), [inputs])

  const totalAnimated = useCountUp(res.totalPaid, 1000)

  const interestRatio = amount > 0 ? (res.totalInterest / amount) * 100 : 0
  const costScore = interestRatio < 20 ? 'faible' : interestRatio < 40 ? 'modéré' : 'élevé'
  const scoreColor = costScore === 'faible' ? '#34d399' : costScore === 'modéré' ? '#fbbf24' : '#f87171'

  const amortData = useMemo(() => {
    return (res.amortizationData as { month: number; remaining: number; totalPaid: number }[]).map(d => ({
      month: d.month,
      remaining: d.remaining,
      paid: d.totalPaid,
    }))
  }, [res.amortizationData])

  const tips = [
    { title: 'Comparez le TAEG', body: 'Le TAEG inclut tous les frais obligatoires. Comparez toujours le TAEG, pas seulement le taux nominal.', color: C },
    taeg > 15
      ? { title: 'Taux élevé', body: `Taux > 15% : envisagez un rachat de crédit ou un remboursement prioritaire avant tout investissement.`, color: '#fbbf24' }
      : { title: 'Raccourcir la durée', body: `Raccourcir de ${Math.round(durationMonths * 0.25)} mois économiserait environ ${fmtK(res.totalInterest * 0.2)} d'intérêts.`, color: '#fbbf24' },
    { title: 'Coût d\'opportunité', body: `Vous pourriez économiser ${fmtK(res.alternativeGain)} supplémentaires en plaçant la même somme à ${alternativeRate}%/an.`, color: '#34d399' },
  ]

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Crédit Consommation</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Crédit Consommation<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Coût total · TAEG · Capacité de remboursement. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Coût réel avec opportunité manquée.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <SaveSimulation
            type="consumer-credit"
            name={`Crédit ${fmt(amount)} à ${taeg}% — ${durationMonths} mois`}
            inputs={{ amount, taeg, durationMonths, alternativeRate } as unknown as Record<string, unknown>}
            results={{ monthlyPayment: res.monthlyPayment, totalPaid: res.totalPaid, totalInterest: res.totalInterest, alternativeGain: res.alternativeGain, opportunityCost: res.opportunityCost } as unknown as Record<string, unknown>}
          />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => { setAmount(10000); setTaeg(5.5); setDurationMonths(48); setAlternativeRate(7) }}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {/* ── 3-column grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* ── LEFT — Paramètres (sticky) ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Montant */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Montant emprunté</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={500}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              {/* TAEG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>TAEG annuel</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={taeg} onChange={e => setTaeg(Number(e.target.value))} min={0} max={50} step={0.1}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>Taux Annuel Effectif Global</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Perso', val: 5.5 }, { label: 'Auto', val: 8.5 }, { label: 'Renouv.', val: 18 }] as const).map(s => (
                    <button key={s.label} onClick={() => setTaeg(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: taeg === s.val ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: taeg === s.val ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: taeg === s.val ? C : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={divSt} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Durée</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} min={6} max={120} step={6}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 40, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>mois</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                  {Math.floor(durationMonths / 12)} an{Math.floor(durationMonths / 12) > 1 ? 's' : ''}{durationMonths % 12 > 0 ? ` et ${durationMonths % 12} mois` : ''}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([12, 24, 48, 60] as const).map(m => (
                    <button key={m} onClick={() => setDurationMonths(m)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: durationMonths === m ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: durationMonths === m ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: durationMonths === m ? C : 'var(--p-text-dim)' }}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div style={divSt} />

              {/* Rendement alternatif */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Rendement placement alternatif</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={alternativeRate} onChange={e => setAlternativeRate(Number(e.target.value))} min={0} max={20} step={0.5}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>%</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>Ce que le capital aurait rapporté (ETF, PEA…)</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Calcul selon le TAEG — mensualité constante.
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Alert banner */}
          <div style={{ background: `${C}12`, border: `1px solid ${C}30`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: C, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>
                Ce crédit vous coûte réellement {fmt(res.opportunityCost)} sur {Math.round(durationMonths / 12 * 10) / 10} ans
              </div>
              <div style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 2 }}>
                Intérêts versés ({fmt(res.totalInterest)}) + gain manqué sur placement ({fmt(res.alternativeGain)})
              </div>
            </div>
          </div>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Coût total · {durationMonths} mois
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(totalAnimated)}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${(amount / res.totalPaid) * 100}%`, background: 'rgba(255,255,255,0.15)' }} />
                    <div style={{ flex: 1, background: C }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Capital</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text-mid)', marginTop: 4 }}>{fmtK(amount)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: C, fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Intérêts</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: C, marginTop: 4 }}>{fmtK(res.totalInterest)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Mensualité', value: fmt(res.monthlyPayment), color: C },
                  { label: 'TAEG', value: `${taeg} %` },
                  { label: 'Ratio intérêts', value: `${interestRatio.toFixed(1)} %`, color: scoreColor },
                  { label: 'Coût réel total', value: fmtK(res.opportunityCost) },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color || 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AMORTIZATION CHART */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Amortissement</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Capital restant dû vs total remboursé</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[
                  { color: C, label: 'Restant dû' },
                  { color: '#fbbf24', label: 'Total remboursé', dashed: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: (l as any).dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <AmortChart data={amortData} />
            </div>
          </div>

          {/* Décomposition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Décomposition du coût réel</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {[
                { label: 'Capital', value: amount, color: 'rgba(255,255,255,0.15)', pct: (amount / res.opportunityCost) * 100 },
                { label: 'Intérêts', value: res.totalInterest, color: C, pct: (res.totalInterest / res.opportunityCost) * 100 },
                { label: 'Gain placement manqué', value: res.alternativeGain, color: '#fb923c', pct: (res.alternativeGain / res.opportunityCost) * 100 },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--p-text-dim)' }}>{item.label}</span>
                    <span style={{ color: 'var(--p-text-em)', fontWeight: 600, fontFamily: 'var(--p-mono)' }}>{fmt(item.value)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(item.pct, 100)}%`, borderRadius: 99, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Analyse du crédit */}
          <div style={{
            border: `1px solid ${costScore === 'faible' ? 'rgba(52,211,153,0.3)' : costScore === 'modéré' ? 'rgba(251,191,36,0.3)' : `${C}40`}`,
            borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            background: `linear-gradient(135deg, ${scoreColor}0a 0%, transparent 55%), var(--p-card)`,
          }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={{ ...eyebrow, color: scoreColor }}>Analyse du crédit</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', marginTop: 4 }}>
                Coût {costScore} ({interestRatio.toFixed(1)}%)
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', marginBottom: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', width: `${amount / res.opportunityCost * 100}%` }} />
                <div style={{ background: C, width: `${res.totalInterest / res.opportunityCost * 100}%` }} />
                <div style={{ background: '#fb923c', flex: 1 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                {[['rgba(255,255,255,0.25)', 'Capital'], [C, 'Intérêts'], ['#fb923c', 'Manqué']].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block', flexShrink: 0 }} />{label}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                {taeg < 8
                  ? `Taux raisonnable (${taeg}%). Ce crédit reste gérable, mais vérifiez toujours si un financement personnel est possible.`
                  : taeg < 15
                    ? `Taux intermédiaire (${taeg}%). Le coût des intérêts représente ${interestRatio.toFixed(0)}% du capital. Cherchez à raccourcir la durée.`
                    : `Taux élevé (${taeg}%). Le coût réel dépasse ${fmt(res.opportunityCost)}. Envisagez un rachat ou un remboursement anticipé.`}
              </div>
            </div>
          </div>

          {/* Donut répartition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition du coût</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Capital · Intérêts · Gain manqué</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <CostDonut capital={amount} interest={Math.round(res.totalInterest)} missed={Math.round(res.alternativeGain)} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Capital', value: amount, color: 'rgba(200,200,200,0.4)' },
                  { label: 'Intérêts', value: res.totalInterest, color: C },
                  { label: 'Gain manqué', value: res.alternativeGain, color: '#fb923c' },
                ].map(e => (
                  <div key={e.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{e.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--p-mono)', color: 'var(--p-text-em)' }}>{fmt(e.value)}</span>
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', marginLeft: 5 }}>{Math.round(e.value / res.opportunityCost * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Réduire le coût du crédit</div>
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
                { label: 'Budget', href: '/dashboard/budget' },
                { label: 'Acheter vs Louer', href: '/dashboard/buyrent' },
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

export default function ConsumerCreditPage() {
  return <Suspense><ConsumerCreditPageInner /></Suspense>
}
