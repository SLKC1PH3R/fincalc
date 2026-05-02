'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcPlusValue, type PlusValueInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { Download, TrendingUp, RefreshCw } from 'lucide-react'
import { useCountUp } from '@/lib/use-count-up'

const C = '#a78bfa'

// ─── local formatters ─────────────────────────────────────────────────────────
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const GAP = 16

const DEFAULTS: PlusValueInputs = {
  acquisitionPrice: 250000,
  fraisAcquisitionPct: 7.5,
  travaux: 20000,
  useForfaitTravaux: false,
  cessionPrice: 380000,
  fraisCessionPct: 4,
  duration: 10,
  type: 'locatif',
}

// ─── AbatChart (inline bar chart) ────────────────────────────────────────────
function AbatChart({ currentDuration }: { currentDuration: number }) {
  const data = [
    { label: '5a', ir: 0, ps: 0 },
    { label: '10a', ir: 30, ps: 8.25 },
    { label: '15a', ir: 60, ps: 16.5 },
    { label: '22a', ir: 100, ps: 27.5 },
    { label: '25a', ir: 100, ps: 54.5 },
    { label: '30a', ir: 100, ps: 100 },
  ]

  const W = 800, H = 220, PAD = { l: 36, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const N = data.length
  const groupW = w / N
  const barW = groupW * 0.28
  const maxV = 100

  const yTicks = [0, 25, 50, 75, 100]

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="pvIR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.9} />
          <stop offset="100%" stopColor={C} stopOpacity={0.5} />
        </linearGradient>
        <linearGradient id="pvPS" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#818cf8" stopOpacity={0.5} />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / maxV) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 4} y={y + 3.5} textAnchor="end" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{t}%</text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const cx = PAD.l + i * groupW + groupW / 2
        const irH = (d.ir / maxV) * h
        const psH = (d.ps / maxV) * h
        return (
          <g key={d.label}>
            {/* IR bar */}
            <rect
              x={cx - barW - 2}
              y={PAD.t + h - irH}
              width={barW}
              height={Math.max(irH, 1)}
              fill="url(#pvIR)"
              rx={3}
            />
            {/* PS bar */}
            <rect
              x={cx + 2}
              y={PAD.t + h - psH}
              width={barW}
              height={Math.max(psH, 1)}
              fill="url(#pvPS)"
              rx={3}
            />
            {/* x label */}
            <text x={cx} y={PAD.t + h + 15} textAnchor="middle" fontSize={10} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{d.label}</text>
          </g>
        )
      })}

      {/* Current duration marker */}
      {(() => {
        const durYears = [5, 10, 15, 22, 25, 30]
        const idx = durYears.findIndex(y => currentDuration <= y)
        if (idx < 0) return null
        const cx = PAD.l + idx * groupW + groupW / 2
        return (
          <line x1={cx} y1={PAD.t} x2={cx} y2={PAD.t + h} stroke={C} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
        )
      })()}
    </svg>
  )
}

// ─── PVDonut ──────────────────────────────────────────────────────────────────
function PVDonut({ netProfit, totalTax, size = 160 }: { netProfit: number; totalTax: number; size?: number }) {
  const total = netProfit + totalTax || 1
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  const dashNet = circ * (Math.max(netProfit, 0) / total)
  const pctNet = Math.round((Math.max(netProfit, 0) / total) * 100)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f8717130" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#34d399" strokeWidth={14}
          strokeDasharray={`${dashNet} ${circ - dashNet}`} strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Net</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{pctNet}%</div>
      </div>
    </div>
  )
}

function PlusValuePageInner() {
  const [inputs, setInputs] = useState<PlusValueInputs>(DEFAULTS)
  const set = (k: keyof PlusValueInputs) => (v: number | boolean | string) =>
    setInputs(p => ({ ...p, [k]: v }))

  const r = useMemo(() => calcPlusValue(inputs), [inputs])
  const netAnimated = useCountUp(r.netProfit, 1000)

  const tips: { title: string; body: string; color: string }[] = []
  if (inputs.type === 'residence_principale') {
    tips.push({ title: 'Exonération totale', body: 'Résidence principale : la plus-value est totalement exonérée d\'IR et de prélèvements sociaux, sans condition de durée.', color: '#34d399' })
  } else {
    if (!r.exonereIR) tips.push({ title: `Abattement IR : ${r.abatIR}%`, body: `Exonération IR totale dans ${22 - inputs.duration} ans (22 ans de détention).`, color: C })
    if (!r.exonerePS) tips.push({ title: `Abattement PS : ${r.abatPS.toFixed(1)}%`, body: `Exonération PS totale à 30 ans (dans ${30 - inputs.duration} ans).`, color: '#818cf8' })
    tips.push({ title: 'Impôt effectif', body: `Sur ${fmt(r.grossPV)} de plus-value brute, l'impôt total représente ${r.grossPV > 0 ? ((r.totalTax / r.grossPV) * 100).toFixed(1) : 0}% — soit ${fmt(r.totalTax)}.`, color: '#fbbf24' })
    if (inputs.duration >= 5 && !inputs.useForfaitTravaux) tips.push({ title: 'Forfait travaux disponible', body: 'Activez le forfait travaux (15% du prix d\'acquisition) sans justificatifs si la détention dépasse 5 ans.', color: '#34d399' })
    if (r.surtaxe > 0) tips.push({ title: 'Surtaxe applicable', body: `Plus-value imposable > 50 000 € : ${fmt(r.surtaxe)} de taxe additionnelle.`, color: '#f87171' })
  }

  if (tips.length === 0) {
    tips.push({ title: 'Abattements progressifs', body: 'Plus vous attendez, moins vous payez d\'impôts sur la plus-value. Exonération IR totale à 22 ans, PS totale à 30 ans.', color: C })
  }

  const pdfTipStrings = tips.map(t => t.body)

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Plus-value Immobilière</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Plus-value Immobilière<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Abattements IR/PS · Surtaxe · Durée optimale. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Calcul selon le régime 2024.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Plus-value Immobilière',
            subtitle: `${fmt(inputs.acquisitionPrice)} → ${fmt(inputs.cessionPrice)} · ${inputs.duration} ans`,
            kpis: [
              { label: 'Plus-value brute', value: fmt(r.grossPV), highlight: true },
              { label: 'Impôt total', value: fmt(r.totalTax) },
              { label: 'Profit net', value: fmt(r.netProfit) },
              { label: 'Abattement IR', value: `${r.abatIR}%` },
            ],
            inputs: [
              { label: 'Prix acquisition', value: fmt(inputs.acquisitionPrice) },
              { label: 'Frais acquisition', value: `${inputs.fraisAcquisitionPct}%` },
              { label: 'Travaux', value: fmt(inputs.useForfaitTravaux ? inputs.acquisitionPrice * 0.15 : inputs.travaux) },
              { label: 'Prix cession', value: fmt(inputs.cessionPrice) },
              { label: 'Durée détention', value: `${inputs.duration} ans` },
            ],
            tips: pdfTipStrings,
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="plusvalue" name={`PV immo ${inputs.duration}a · ${fmt(inputs.cessionPrice)}`} inputs={inputs as any} results={r as any} />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => setInputs(DEFAULTS)}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { val: 'residence_principale', label: 'Résidence principale' },
          { val: 'secondaire', label: 'Résidence secondaire' },
          { val: 'locatif', label: 'Bien locatif' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => set('type')(opt.val)}
            style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${inputs.type === opt.val ? C : 'var(--p-line)'}`,
              background: inputs.type === opt.val ? `${C}18` : 'var(--p-card-2)',
              color: inputs.type === opt.val ? C : 'var(--p-text-faint)', transition: 'all 0.15s',
              fontFamily: 'var(--p-sans)' }}>
            {opt.label}
          </button>
        ))}
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

              {/* Prix acquisition */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Prix d&apos;acquisition</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{fmtK(inputs.acquisitionPrice)}</span>
                </div>
                <Slider min={50000} max={2000000} step={10000} value={[inputs.acquisitionPrice]} onValueChange={([v]) => set('acquisitionPrice')(v)} />
              </div>

              {/* Frais acquisition */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Frais d&apos;acquisition</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.fraisAcquisitionPct} %</span>
                </div>
                <Slider min={0} max={12} step={0.5} value={[inputs.fraisAcquisitionPct]} onValueChange={([v]) => set('fraisAcquisitionPct')(v)} />
              </div>

              <div style={divSt} />

              {/* Prix cession */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Prix de cession</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{fmtK(inputs.cessionPrice)}</span>
                </div>
                <Slider min={50000} max={3000000} step={10000} value={[inputs.cessionPrice]} onValueChange={([v]) => set('cessionPrice')(v)} />
              </div>

              {/* Frais agence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Frais d&apos;agence (vente)</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.fraisCessionPct} %</span>
                </div>
                <Slider min={0} max={8} step={0.5} value={[inputs.fraisCessionPct]} onValueChange={([v]) => set('fraisCessionPct')(v)} />
              </div>

              <div style={divSt} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Durée de détention</label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.duration} ans</span>
                </div>
                <Slider min={0} max={35} step={1} value={[inputs.duration]} onValueChange={([v]) => set('duration')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[5, 10, 22, 30].map(y => (
                    <button key={y} onClick={() => set('duration')(y)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        background: inputs.duration === y ? `${C}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.duration === y ? `1px solid ${C}35` : '1px solid var(--p-line)',
                        color: inputs.duration === y ? C : 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>
                      {y}a
                    </button>
                  ))}
                </div>
              </div>

              {/* Travaux */}
              {inputs.type !== 'residence_principale' && (
                <>
                  <div style={divSt} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={labelSt}>Travaux</label>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>
                        {inputs.useForfaitTravaux ? `forfait ${fmtK(inputs.acquisitionPrice * 0.15)}` : fmtK(inputs.travaux)}
                      </span>
                    </div>
                    {!inputs.useForfaitTravaux && (
                      <Slider min={0} max={500000} step={5000} value={[inputs.travaux]} onValueChange={([v]) => set('travaux')(v)} />
                    )}
                    {inputs.duration >= 5 && (
                      <button onClick={() => set('useForfaitTravaux')(!inputs.useForfaitTravaux)}
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--p-sans)',
                          border: `1px solid ${inputs.useForfaitTravaux ? C : 'var(--p-line)'}`,
                          background: inputs.useForfaitTravaux ? `${C}15` : 'transparent',
                          color: inputs.useForfaitTravaux ? C : 'var(--p-text-faint)' }}>
                        {inputs.useForfaitTravaux ? '✓' : '○'} Forfait 15% (sans justificatifs)
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Calcul IR 19% · PS 17,2% · surtaxe PV &gt; 50 000 €.
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Gain net · {inputs.duration} ans de détention
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(netAnimated)}
                </div>
                <div style={{ marginTop: 18 }}>
                  {r.grossPV > 0 && (
                    <>
                      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                        <div style={{ width: `${(r.netProfit / r.grossPV) * 100}%`, background: '#34d399', transition: 'width 0.5s' }} />
                        <div style={{ flex: 1, background: '#f87171' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Net après impôt</div>
                          <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{fmtK(r.netProfit)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#f87171', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Impôts</div>
                          <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: '#f87171', marginTop: 4 }}>{fmtK(r.totalTax)}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Plus-value brute', value: fmtK(r.grossPV), color: C },
                  { label: 'IR dû (19%)', value: fmtK(r.irDu), color: '#f87171' },
                  { label: 'PS (17,2%)', value: fmtK(r.psDu), color: '#fb923c' },
                  { label: 'Abattement IR', value: `${r.abatIR} %`, color: r.exonereIR ? '#34d399' : 'var(--p-text)' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Résidence principale — exo banner */}
          {inputs.type === 'residence_principale' && (
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 14, padding: '32px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontFamily: 'var(--p-serif)', fontSize: 22, color: '#34d399', marginBottom: 8 }}>Exonération totale</div>
              <p style={{ fontSize: 13, color: 'var(--p-text-dim)', lineHeight: 1.6, margin: 0 }}>La plus-value sur résidence principale est entièrement exonérée d&apos;IR et de prélèvements sociaux, sans condition de durée de détention.</p>
              <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: '#34d399', marginTop: 16 }}>Profit net : {fmt(r.netProfit)}</div>
            </div>
          )}

          {/* Décomposition fiscale */}
          {inputs.type !== 'residence_principale' && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Décomposition fiscale</div>
              </div>
              <div style={{ padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Prix de revient corrigé', value: fmt(r.prixRevientCorrige), sub: 'achat + frais + travaux' },
                  { label: 'Plus-value brute', value: fmt(r.grossPV), sub: 'prix vente net - prix revient', color: C },
                  { label: `Abattement IR ${r.abatIR}%`, value: `-${fmt(Math.round(r.grossPV * r.abatIR / 100))}`, color: '#34d399' },
                  { label: `Abattement PS ${r.abatPS.toFixed(1)}%`, value: `-${fmt(Math.round(r.grossPV * r.abatPS / 100))}`, color: '#34d399' },
                  { label: 'IR dû (19%)', value: fmt(r.irDu), color: '#f87171' },
                  { label: 'Prélèvements sociaux (17,2%)', value: fmt(r.psDu), color: '#fb923c' },
                  ...(r.surtaxe > 0 ? [{ label: 'Surtaxe (PV > 50k€)', value: fmt(r.surtaxe), color: '#c084fc' }] : []),
                  { label: 'Impôt total', value: fmt(r.totalTax), color: '#f87171', bold: true },
                  { label: 'Profit net après impôt', value: fmt(r.netProfit), color: '#34d399', bold: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--p-line)' }}>
                    <div>
                      <span style={{ fontSize: 12.5, color: 'var(--p-text-dim)' }}>{row.label}</span>
                      {'sub' in row && row.sub && <div style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{row.sub}</div>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: ('bold' in row && row.bold) ? 800 : 600, fontFamily: 'var(--p-mono)', color: row.color || 'var(--p-text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Abattements chart */}
          {inputs.type !== 'residence_principale' && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={eyebrow}>Abattements progressifs</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>IR et PS selon la durée de détention</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {[{ color: C, label: 'IR' }, { color: '#818cf8', label: 'PS' }].map((l, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                      <span style={{ width: 10, height: 10, background: l.color, borderRadius: 2 }} />
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <AbatChart currentDuration={inputs.duration} />
              </div>
              <div style={{ padding: '8px 18px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: `Vous : ${inputs.duration} ans`, color: C },
                  { label: 'IR exo. à 22 ans', color: '#818cf8' },
                  { label: 'PS exo. à 30 ans', color: '#c084fc' },
                ].map(b => (
                  <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${b.color}10`, border: `1px solid ${b.color}25`, borderRadius: 6, padding: '3px 8px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.color }} />
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut net/impôt */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition finale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Net vs impôts sur {fmtK(r.grossPV)} de PV</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <PVDonut netProfit={r.netProfit} totalTax={r.totalTax} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: '#34d399', label: 'Profit net', value: fmtK(r.netProfit), pct: r.grossPV > 0 ? (r.netProfit / r.grossPV) * 100 : 100 },
                  { color: '#f87171', label: 'Impôt total', value: fmtK(r.totalTax), pct: r.grossPV > 0 ? (r.totalTax / r.grossPV) * 100 : 0 },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct.toFixed(0)}%</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 64, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Résumé fiscal */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Résumé fiscal</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Votre situation ({inputs.duration} ans)</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'PV brute', value: fmt(r.grossPV), color: C },
                { label: 'IR dû (19%)', value: fmt(r.irDu), color: '#f87171' },
                { label: 'PS (17,2%)', value: fmt(r.psDu), color: '#fb923c' },
                { label: 'Profit net', value: fmt(r.netProfit), color: '#34d399' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seuils clés */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Seuils clés</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Durée de détention</div>
            </div>
            <div style={{ padding: '10px 18px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { dur: '< 5 ans', ir: '0%', ps: '0%', note: 'Aucun abattement', color: '#f87171' },
                { dur: '5 ans', ir: '0%', ps: '1,65%/an', note: 'PS démarre', color: '#fb923c' },
                { dur: '6–21 ans', ir: '6%/an', ps: '1,65%/an', note: 'Abattements progressifs', color: '#fbbf24' },
                { dur: '22 ans', ir: '100%', ps: '27,5%', note: 'Exonération IR totale', color: C },
                { dur: '22–30 ans', ir: '100%', ps: '+9%/an', note: 'Plus que les PS', color: C },
                { dur: '30+ ans', ir: '100%', ps: '100%', note: 'Exonération totale', color: '#34d399' },
              ].map(s => (
                <div key={s.dur} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, fontFamily: 'var(--p-mono)' }}>{s.dur}</span>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{s.note}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>IR: {s.ir}</div>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>PS: {s.ps}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Votre position */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Votre position</div>
            </div>
            <div style={{ padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Abattement IR', value: `${r.abatIR}%`, color: r.exonereIR ? '#34d399' : C },
                { label: 'Abattement PS', value: `${r.abatPS.toFixed(1)}%`, color: r.exonerePS ? '#34d399' : C },
                { label: 'Exo. IR dans', value: r.exonereIR ? 'Acquise ✓' : `${22 - inputs.duration} ans`, color: r.exonereIR ? '#34d399' : 'var(--p-text-dim)' },
                { label: 'Exo. PS dans', value: r.exonerePS ? 'Acquise ✓' : `${30 - inputs.duration} ans`, color: r.exonerePS ? '#34d399' : 'var(--p-text-dim)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--p-mono)', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Optimisation fiscale</div>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.slice(0, 3).map((t, i) => (
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
                { label: 'Flat Tax vs Barème', href: '/dashboard/flat-tax' },
                { label: 'Succession', href: '/dashboard/succession' },
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

export default function PlusValuePage() {
  return <Suspense><PlusValuePageInner /></Suspense>
}
