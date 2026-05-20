'use client'

import React, { useState, useMemo } from 'react'

/* ── tokens ── */
const BG       = '#F3EEE4'
const SURFACE  = '#FFFFFF'
const INK      = '#0A0A0A'
const MUTED    = '#6B6356'
const MUTED2   = '#9A907F'
const LINE     = 'rgba(10,10,10,0.08)'
const LINE_STR = 'rgba(10,10,10,0.14)'
const UP       = '#1F7A4A'
const DOWN     = '#B23B3B'
const F_SANS   = "'Geist', system-ui, sans-serif"
const F_SERIF  = "'Instrument Serif', Georgia, serif"
const F_MONO   = "'Geist Mono', ui-monospace, monospace"

/* ── utils ── */
const fmt    = (n: number) => Math.round(n).toLocaleString('fr-FR')
const fmtEur = (n: number) => fmt(n) + ' €'
const fmtPct = (n: number, d = 1) => n.toFixed(d) + ' %'

function compoundFV(pv: number, pmt: number, rAnnual: number, years: number) {
  const rm = Math.pow(1 + rAnnual / 100, 1 / 12) - 1
  const n  = years * 12
  if (rm < 0.0000001) return pv + pmt * n
  return pv * Math.pow(1 + rm, n) + pmt * (Math.pow(1 + rm, n) - 1) / rm
}
function mortgagePayment(capital: number, rAnnual: number, years: number) {
  const rm = rAnnual / 100 / 12
  const n  = years * 12
  if (rm < 0.0000001) return capital / n
  return capital * rm / (1 - Math.pow(1 + rm, -n))
}
function taxIR2026(revBrut: number, parts = 1) {
  const rni = revBrut * 0.9
  const qi  = rni / parts
  const slabs = [[0,11497,0],[11497,26070,.11],[26070,74545,.30],[74545,160336,.41],[160336,Infinity,.45]] as [number,number,number][]
  let t = 0
  for (const [lo, hi, r] of slabs) if (qi > lo) t += (Math.min(qi, hi) - lo) * r
  return t * parts
}
function tmiIR(revBrut: number, parts = 1) {
  const qi = revBrut * 0.9 / parts
  if (qi <= 11497) return 0
  if (qi <= 26070) return 11
  if (qi <= 74545) return 30
  if (qi <= 160336) return 41
  return 45
}

const GOLD_D = '#8B5E18'

/* ── blur gate — wraps any "insight" content ── */
function BlurGate({ children, height }: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      {/* blurred content — real values visible through blur (enticing) */}
      <div style={{
        filter: 'blur(5px)',
        userSelect: 'none',
        pointerEvents: 'none',
        opacity: 0.85,
        ...(height ? { height, overflow: 'hidden' } : {}),
      }}>
        {children}
      </div>
      {/* CTA overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(243,238,228,0.55)',
        backdropFilter: 'blur(1px)',
        borderRadius: 10,
      }}>
        <a href="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '7px 16px', borderRadius: 99,
          background: GOLD_D, color: '#fff',
          fontSize: 11.5, fontWeight: 700, textDecoration: 'none',
          fontFamily: F_SANS, letterSpacing: '0.01em',
          boxShadow: '0 4px 16px rgba(139,94,24,0.35)',
          whiteSpace: 'nowrap',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Inscription gratuite pour voir le détail
        </a>
      </div>
    </div>
  )
}

/* ── shared UI ── */
function Sl({ label, value, min, max, step = 1, onChange, display, color }: {
  label: string; value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; display: string; color: string
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 12, color: INK, fontWeight: 700, fontFamily: F_MONO }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 4 } as React.CSSProperties} />
    </div>
  )
}

function BigResult({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 14px', borderRadius: 12, background: BG, border: `1px solid ${LINE_STR}` }}>
      <div style={{ fontSize: 9.5, fontFamily: F_MONO, color: MUTED2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: F_SERIF, fontSize: 38, fontWeight: 400, letterSpacing: '-0.03em', color: INK, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, marginTop: 7 }}>{sub}</div>}
    </div>
  )
}

/* KpiRow — always blurred to gate the breakdown details */
function KpiRow({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <BlurGate>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8 }}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: BG, border: `1px solid ${LINE_STR}` }}>
            <div style={{ fontSize: 9, fontFamily: F_MONO, color: MUTED2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: F_MONO, fontSize: 15, fontWeight: 700, color: color || INK }}>{value}</div>
          </div>
        ))}
      </div>
    </BlurGate>
  )
}

function Bar({ label, value, max, color, pct }: { label: string; value: string; max: number; color: string; pct: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: INK, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: F_MONO, color: INK, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: LINE_STR, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 99, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   MINI SIMULATORS
════════════════════════════════════════════════════ */

function CompoundInterest({ color }: { color: string }) {
  const [pv, setPv]   = useState(10000)
  const [pmt, setPmt] = useState(200)
  const [r, setR]     = useState(7)
  const [yr, setYr]   = useState(20)
  const fv    = useMemo(() => compoundFV(pv, pmt, r, yr), [pv, pmt, r, yr])
  const total = pv + pmt * 12 * yr
  const gains = fv - total
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 20 }}>
        <div>
          <Sl label="Capital initial" value={pv} min={1000} max={100000} step={500} onChange={setPv} display={fmtEur(pv)} color={color} />
          <Sl label="Versement mensuel" value={pmt} min={0} max={2000} step={50} onChange={setPmt} display={fmtEur(pmt)} color={color} />
          <Sl label="Taux annuel" value={r} min={1} max={12} step={0.5} onChange={setR} display={fmtPct(r)} color={color} />
          <Sl label="Durée" value={yr} min={1} max={40} onChange={setYr} display={`${yr} ans`} color={color} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigResult label="Capital final" value={fmtEur(fv)} sub={`dont ${fmtEur(gains)} de gains`} color={color} />
          <KpiRow items={[
            { label: 'Versé', value: fmtEur(total) },
            { label: 'Intérêts', value: fmtEur(gains), color: UP },
            { label: 'Mult.', value: `×${(fv / total).toFixed(1)}` },
          ]} />
        </div>
      </div>
      {/* Mini spark chart — blurred */}
      <BlurGate height={60}>
        <div style={{ height: 60, borderRadius: 8, background: LINE, overflow: 'hidden', position: 'relative' }}>
          <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity=".25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = Array.from({ length: 40 }, (_, i) => {
                const v = compoundFV(pv, pmt, r, (i + 1) * yr / 40)
                return [(i / 39) * 400, 56 - (v / fv) * 52] as [number, number]
              })
              const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
              return <>
                <path d={`${d} L400,60 L0,60 Z`} fill="url(#cg)" />
                <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
              </>
            })()}
          </svg>
        </div>
      </BlurGate>
    </div>
  )
}

function FireSim({ color }: { color: string }) {
  const [dep, setDep]   = useState(2500)
  const [epg, setEpg]   = useState(800)
  const [pat, setPat]   = useState(20000)
  const [r, setR]       = useState(6)
  const capital = useMemo(() => dep * 12 / 0.04, [dep])
  const rm      = useMemo(() => Math.pow(1 + r / 100, 1 / 12) - 1, [r])
  const years   = useMemo(() => {
    if (epg <= 0 || rm <= 0) return 99
    const needed = capital
    // FV(pat, epg, rm, n) = needed → solve for n
    // pat*(1+rm)^n + epg*((1+rm)^n - 1)/rm = needed
    // (1+rm)^n * (pat + epg/rm) = needed + epg/rm
    const A = pat + epg / rm
    const B = needed + epg / rm
    if (A >= B) return 0
    return Math.log(B / A) / Math.log(1 + rm) / 12
  }, [capital, pat, epg, rm])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Dépenses / mois" value={dep} min={500} max={6000} step={100} onChange={setDep} display={fmtEur(dep)} color={color} />
        <Sl label="Épargne / mois" value={epg} min={100} max={4000} step={50} onChange={setEpg} display={fmtEur(epg)} color={color} />
        <Sl label="Patrimoine existant" value={pat} min={0} max={300000} step={5000} onChange={setPat} display={fmtEur(pat)} color={color} />
        <Sl label="Rendement annuel" value={r} min={2} max={12} step={0.5} onChange={setR} display={fmtPct(r)} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Années jusqu'au FIRE" value={years > 90 ? '∞' : `${years.toFixed(1)} ans`} sub="Avec la règle des 4%" color={color} />
        <KpiRow items={[
          { label: 'Capital cible', value: fmtEur(capital) },
          { label: 'Épargne / an', value: fmtEur(epg * 12) },
        ]} />
      </div>
    </div>
  )
}

function MortgageSim({ color }: { color: string }) {
  const [cap, setCap] = useState(200000)
  const [yr, setYr]   = useState(20)
  const [r, setR]     = useState(3.5)
  const monthly = useMemo(() => mortgagePayment(cap, r, yr), [cap, yr, r])
  const total   = monthly * yr * 12
  const interests = total - cap
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Montant emprunté" value={cap} min={30000} max={800000} step={5000} onChange={setCap} display={fmtEur(cap)} color={color} />
        <Sl label="Durée" value={yr} min={5} max={30} onChange={setYr} display={`${yr} ans`} color={color} />
        <Sl label="Taux annuel" value={r} min={0.5} max={7} step={0.1} onChange={setR} display={fmtPct(r)} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Mensualité" value={fmtEur(monthly)} sub={`Coût total ${fmtEur(total)}`} color={color} />
        <KpiRow items={[
          { label: 'Intérêts', value: fmtEur(interests), color: DOWN },
          { label: 'Tx intérêts', value: fmtPct(interests / cap * 100) },
        ]} />
      </div>
    </div>
  )
}

function BuyRentSim({ color }: { color: string }) {
  const [prix, setPrix]   = useState(280000)
  const [loyer, setLoyer] = useState(1100)
  const [yr, setYr]       = useState(10)
  const [r, setR]         = useState(3.2)

  const monthly   = useMemo(() => mortgagePayment(prix * 1.08, r, 20), [prix, r]) // +8% frais
  const coutAchat = useMemo(() => {
    const interest = monthly * yr * 12 - (prix * 1.08 * yr / 20)
    const charges  = prix * 0.015 * yr // taxe foncière + charges ~1.5%/an
    return interest + charges
  }, [monthly, prix, yr])
  const coutLoc   = loyer * 12 * yr
  const seuil     = useMemo(() => {
    // rough breakeven: iterate year by year
    for (let y = 1; y <= 30; y++) {
      const ca = mortgagePayment(prix * 1.08, r, 20) * y * 12 - (prix * 1.08 * y / 20) + prix * 0.015 * y
      const cl = loyer * 12 * y
      if (ca < cl) return y
    }
    return '>30'
  }, [prix, loyer, r])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Prix du bien" value={prix} min={80000} max={800000} step={10000} onChange={setPrix} display={fmtEur(prix)} color={color} />
        <Sl label="Loyer mensuel équivalent" value={loyer} min={300} max={4000} step={50} onChange={setLoyer} display={fmtEur(loyer)} color={color} />
        <Sl label="Taux crédit" value={r} min={0.5} max={7} step={0.1} onChange={setR} display={fmtPct(r)} color={color} />
        <Sl label="Horizon comparé" value={yr} min={2} max={30} onChange={setYr} display={`${yr} ans`} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Point de bascule" value={`${seuil} ans`} sub="Durée à laquelle l'achat devient rentable" color={color} />
        <KpiRow items={[
          { label: `Achat ${yr}A`, value: fmtEur(coutAchat), color: coutAchat < coutLoc ? UP : DOWN },
          { label: `Location ${yr}A`, value: fmtEur(coutLoc), color: coutLoc < coutAchat ? UP : DOWN },
        ]} />
      </div>
    </div>
  )
}

function ImpotsSim({ color }: { color: string }) {
  const [rev, setRev]     = useState(45000)
  const [parts, setParts] = useState(1)
  const impot = useMemo(() => taxIR2026(rev, parts), [rev, parts])
  const tmi   = useMemo(() => tmiIR(rev, parts), [rev, parts])
  const netMensuel = (rev - impot) / 12

  const slabs = [
    { label: '0%',  max: 11497  * parts * 1.111 },
    { label: '11%', max: 26070  * parts * 1.111 },
    { label: '30%', max: 74545  * parts * 1.111 },
    { label: '41%', max: 160336 * parts * 1.111 },
    { label: '45%', max: Infinity },
  ]
  const colors45 = ['#60a5fa','#34d399','#facc15','#fb923c','#f87171']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Revenu brut annuel" value={rev} min={10000} max={200000} step={1000} onChange={setRev} display={fmtEur(rev)} color={color} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, letterSpacing: '0.04em', marginBottom: 8 }}>Nombre de parts</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 1.5, 2, 2.5, 3].map(p => (
              <button key={p} onClick={() => setParts(p)} style={{
                flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${parts === p ? color : LINE_STR}`,
                background: parts === p ? color + '18' : SURFACE,
                color: parts === p ? color : MUTED, fontFamily: F_MONO, fontSize: 11, cursor: 'pointer',
                fontWeight: parts === p ? 700 : 400,
              }}>{p}</button>
            ))}
          </div>
        </div>
        {/* Tranche bars */}
        <div style={{ marginTop: 6 }}>
          {slabs.slice(0, 4).map((s, i) => {
            const inSlab = Math.max(0, Math.min(rev, s.max) - (i === 0 ? 0 : slabs[i - 1].max))
            return inSlab > 0 ? (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 26, height: 8, borderRadius: 99, background: colors45[i] }} />
                <span style={{ fontSize: 10, fontFamily: F_MONO, color: MUTED }}>{s.label} · {fmtEur(inSlab)}</span>
              </div>
            ) : null
          })}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Impôt estimé" value={fmtEur(impot)} sub={`TMI ${tmi}%`} color={color} />
        <KpiRow items={[
          { label: 'Net / mois', value: fmtEur(netMensuel) },
          { label: 'Tx effectif', value: fmtPct(impot / rev * 100) },
        ]} />
      </div>
    </div>
  )
}

function FlatTaxSim({ color }: { color: string }) {
  const [div, setDiv]   = useState(10000)
  const [tmi, setTmi]   = useState<11|30|41>(30)
  const ps              = 0.172
  const flatTax         = div * 0.30
  const bareme          = div * (tmi / 100 + ps) - div * ps * 0.068 // abattement CSG 6.8%
  const economy         = bareme - flatTax
  const best            = economy > 0 ? 'flat-tax' : 'barème'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Dividendes / plus-values" value={div} min={500} max={100000} step={500} onChange={setDiv} display={fmtEur(div)} color={color} />
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, letterSpacing: '0.04em', marginBottom: 8 }}>Tranche marginale (TMI)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([11, 30, 41] as (11|30|41)[]).map(t => (
              <button key={t} onClick={() => setTmi(t)} style={{
                flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${tmi === t ? color : LINE_STR}`,
                background: tmi === t ? color + '18' : SURFACE,
                color: tmi === t ? color : MUTED, fontFamily: F_MONO, fontSize: 12, cursor: 'pointer',
                fontWeight: tmi === t ? 700 : 400,
              }}>{t}%</button>
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: best === 'flat-tax' ? UP + '12' : DOWN + '12', border: `1px solid ${best === 'flat-tax' ? UP : DOWN}30` }}>
          <span style={{ fontSize: 11, color: best === 'flat-tax' ? UP : DOWN, fontFamily: F_MONO, fontWeight: 700 }}>
            {best === 'flat-tax' ? '✓ Flat Tax avantageuse' : '✓ Barème avantageux'}
          </span>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Économie de {fmtEur(Math.abs(economy))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BlurGate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar label="Flat Tax (30%)" value={fmtEur(flatTax)} max={Math.max(flatTax, bareme)} color="#818cf8" pct={flatTax / Math.max(flatTax, bareme) * 100} />
            <Bar label={`Barème (${tmi}% + PS)`} value={fmtEur(bareme)} max={Math.max(flatTax, bareme)} color="#fb923c" pct={bareme / Math.max(flatTax, bareme) * 100} />
          </div>
        </BlurGate>
        <KpiRow items={[
          { label: 'Flat Tax', value: fmtEur(flatTax), color: flatTax < bareme ? UP : undefined },
          { label: 'Barème', value: fmtEur(bareme), color: bareme < flatTax ? UP : undefined },
          { label: 'Écart', value: fmtEur(Math.abs(economy)) },
        ]} />
      </div>
    </div>
  )
}

function DcaSim({ color }: { color: string }) {
  const [pmt, setPmt] = useState(300)
  const [yr, setYr]   = useState(15)
  const [r, setR]     = useState(7)
  const total = pmt * 12 * yr
  const fv    = useMemo(() => compoundFV(0, pmt, r, yr), [pmt, yr, r])
  const gains = fv - total
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Investissement mensuel" value={pmt} min={50} max={2000} step={50} onChange={setPmt} display={fmtEur(pmt)} color={color} />
        <Sl label="Durée" value={yr} min={1} max={40} onChange={setYr} display={`${yr} ans`} color={color} />
        <Sl label="Rendement annuel" value={r} min={1} max={15} step={0.5} onChange={setR} display={fmtPct(r)} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Valeur finale" value={fmtEur(fv)} sub={`+${fmtPct(gains / total * 100, 0)} de gains`} color={color} />
        <KpiRow items={[
          { label: 'Investi', value: fmtEur(total) },
          { label: 'Gains', value: fmtEur(gains), color: UP },
          { label: '×', value: (fv / total).toFixed(1) },
        ]} />
      </div>
    </div>
  )
}

function PeaCtaAvSim({ color }: { color: string }) {
  const [cap, setCap] = useState(50000)
  const [yr, setYr]   = useState(15)
  const [r, setR]     = useState(7)
  const [tmi, setTmi] = useState<11|30|41>(30)

  const fv = useMemo(() => compoundFV(cap, 0, r, yr), [cap, yr, r])
  const gains = fv - cap

  // PEA: 0% IR after 5y + 17.2% PS on gains
  const pea  = fv - gains * 0.172
  // CTO: flat tax 30% on gains (PFU)
  const cto  = fv - gains * 0.30
  // AV after 8y: 7.5% on gains > abattement 4600€ + 17.2% PS
  const avGainsNet = Math.max(0, gains - 4600)
  const av   = fv - avGainsNet * (0.075 + 0.172) - (Math.min(gains, 4600) * 0.172)

  const best = Math.max(pea, cto, av)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Sl label="Capital initial" value={cap} min={1000} max={200000} step={1000} onChange={setCap} display={fmtEur(cap)} color={color} />
        <Sl label="Durée" value={yr} min={5} max={30} onChange={setYr} display={`${yr} ans`} color={color} />
        <Sl label="Rendement" value={r} min={2} max={12} step={0.5} onChange={setR} display={fmtPct(r)} color={color} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'PEA', value: pea, note: '0% IR + 17.2% PS' },
          { label: 'CTO', value: cto, note: '30% flat tax' },
          { label: 'AV 8A', value: av, note: '7.5% + PS (>abatt.)' },
        ].map(({ label, value, note }) => (
          <div key={label} style={{
            textAlign: 'center', padding: '16px 10px', borderRadius: 12,
            background: value === best ? color + '12' : BG,
            border: `1.5px solid ${value === best ? color : LINE_STR}`,
          }}>
            <div style={{ fontSize: 10, fontFamily: F_MONO, color: value === best ? color : MUTED2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: value === best ? 700 : 400 }}>
              {label} {value === best ? '✓' : ''}
            </div>
            <div style={{ fontFamily: F_SERIF, fontSize: 24, color: INK, letterSpacing: '-0.02em' }}>{fmtEur(value)}</div>
            <div style={{ fontSize: 9, fontFamily: F_MONO, color: MUTED2, marginTop: 4 }}>{note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RentaSim({ color }: { color: string }) {
  const [prix, setPrix]   = useState(150000)
  const [loyer, setLoyer] = useState(750)
  const [charges, setCharges] = useState(25)
  const [credit, setCredit]   = useState(600)

  const annuel      = loyer * 12
  const chargesAnnuel = annuel * (charges / 100)
  const net         = annuel - chargesAnnuel
  const rendBrut    = annuel / prix * 100
  const rendNet     = net / prix * 100
  const cashflow    = loyer - credit - chargesAnnuel / 12

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Prix d'achat" value={prix} min={50000} max={600000} step={5000} onChange={setPrix} display={fmtEur(prix)} color={color} />
        <Sl label="Loyer mensuel" value={loyer} min={200} max={3500} step={25} onChange={setLoyer} display={fmtEur(loyer)} color={color} />
        <Sl label="Charges & frais" value={charges} min={10} max={45} onChange={setCharges} display={fmtPct(charges)} color={color} />
        <Sl label="Mensualité crédit" value={credit} min={0} max={2000} step={25} onChange={setCredit} display={fmtEur(credit)} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BigResult label="Cash-flow mensuel" value={`${cashflow >= 0 ? '+' : ''}${fmt(cashflow)} €`} color={color} />
        <KpiRow items={[
          { label: 'Rend. brut', value: fmtPct(rendBrut) },
          { label: 'Rend. net', value: fmtPct(rendNet), color: rendNet > 4 ? UP : rendNet > 2 ? undefined : DOWN },
        ]} />
      </div>
    </div>
  )
}

function ImpotRevenusSim({ color }: { color: string }) {
  return <ImpotsSim color={color} />
}

function RetraiteSim({ color }: { color: string }) {
  const [age, setAge]       = useState(40)
  const [salaire, setSalaire] = useState(3500)
  const [depart, setDepart]   = useState(64)
  const [trim, setTrim]       = useState(80)

  const anneesCot   = Math.min(depart - 22, trim / 4)
  const tauxLiquid  = Math.min(50, anneesCot / 43 * 50) // régime général simplifié
  const salRefAnnuel = salaire * 12 * 0.9 // SAM approximé
  const pension      = salRefAnnuel * tauxLiquid / 100
  const ecart        = salaire - pension / 12

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Âge actuel" value={age} min={20} max={60} onChange={setAge} display={`${age} ans`} color={color} />
        <Sl label="Salaire mensuel net" value={salaire} min={1200} max={8000} step={100} onChange={setSalaire} display={fmtEur(salaire)} color={color} />
        <Sl label="Âge de départ" value={depart} min={60} max={70} onChange={setDepart} display={`${depart} ans`} color={color} />
        <Sl label="Trimestres cotisés" value={trim} min={0} max={172} step={4} onChange={setTrim} display={`${trim} (${(trim / 4).toFixed(0)} ans)`} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Pension estimée / mois" value={fmtEur(pension / 12)} sub={`Taux de liquidation ${tauxLiquid.toFixed(0)}%`} color={color} />
        <KpiRow items={[
          { label: 'Écart / mois', value: fmtEur(ecart), color: ecart > 500 ? DOWN : UP },
          { label: 'Taux remplac.', value: fmtPct(pension / 12 / salaire * 100) },
        ]} />
      </div>
    </div>
  )
}

function TauxEpargneSim({ color }: { color: string }) {
  const [rev, setRev]     = useState(2800)
  const [dep, setDep]     = useState(2100)
  const epargne    = rev - dep
  const taux       = Math.max(0, epargne / rev * 100)
  const objectif50 = rev * 0.5
  const objectif30 = rev * 0.3
  const objectif20 = rev * 0.2

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Revenus nets" value={rev} min={1000} max={8000} step={100} onChange={setRev} display={fmtEur(rev)} color={color} />
        <Sl label="Dépenses totales" value={dep} min={500} max={7500} step={100} onChange={setDep} display={fmtEur(dep)} color={color} />
        <div style={{ marginTop: 16 }}>
          <Bar label="Besoins (objectif 50%)" value={fmtEur(objectif50)} max={rev} color="#60a5fa" pct={objectif50 / rev * 100} />
          <Bar label="Envies (objectif 30%)" value={fmtEur(objectif30)} max={rev} color="#c084fc" pct={objectif30 / rev * 100} />
          <Bar label="Épargne (objectif 20%)" value={fmtEur(objectif20)} max={rev} color={color} pct={objectif20 / rev * 100} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Taux d'épargne actuel"
          value={fmtPct(taux)}
          sub={epargne > 0 ? `${fmtEur(epargne)} épargnés/mois` : 'Dépenses > revenus'}
          color={color} />
        <KpiRow items={[
          { label: 'Épargné', value: fmtEur(Math.max(0, epargne)), color: epargne > 0 ? UP : DOWN },
          { label: 'Vs 20%', value: `${epargne >= rev * 0.2 ? '✓' : fmtEur(rev * 0.2 - epargne) + ' manquant'}` },
        ]} />
      </div>
    </div>
  )
}

function Budget5030Sim({ color }: { color: string }) {
  const [rev, setRev] = useState(2800)
  const besoins = rev * 0.5
  const envies  = rev * 0.3
  const epargne = rev * 0.2

  const cats = [
    { label: 'Besoins (50%)', value: besoins, color: '#60a5fa', note: 'Loyer · courses · transport' },
    { label: 'Envies (30%)',  value: envies,  color: '#c084fc', note: 'Sorties · abonnements · mode' },
    { label: 'Épargne (20%)', value: epargne, color, note: 'Investissement · urgence · retraite' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Revenus mensuels nets" value={rev} min={1000} max={8000} step={100} onChange={setRev} display={fmtEur(rev)} color={color} />
        <div style={{ marginTop: 20 }}>
          {cats.map(c => (
            <div key={c.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: INK }}>{c.label}</span>
                <span style={{ fontSize: 12, fontFamily: F_MONO, fontWeight: 700, color: c.color }}>{fmtEur(c.value)}</span>
              </div>
              <div style={{ height: 10, borderRadius: 99, background: LINE_STR, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: c.color, borderRadius: 99, transition: 'width .4s', width: `${c.value / rev * 100}%` }} />
              </div>
              <div style={{ fontSize: 10, color: MUTED2, fontFamily: F_MONO, marginTop: 2 }}>{c.note}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        {/* Pie SVG */}
        <BigResult label="Épargne mensuelle" value={fmtEur(epargne)} sub={`${fmtEur(epargne * 12)} / an`} color={color} />
        <KpiRow items={[
          { label: 'Besoins', value: fmtEur(besoins), color: '#60a5fa' },
          { label: 'Envies',  value: fmtEur(envies),  color: '#c084fc' },
        ]} />
      </div>
    </div>
  )
}

function EpargneUrgenceSim({ color }: { color: string }) {
  const [dep, setDep]       = useState(2200)
  const [mois, setMois]     = useState(6)
  const [actuel, setActuel] = useState(4000)
  const cible    = dep * mois
  const pct      = Math.min(100, actuel / cible * 100)
  const manquant = Math.max(0, cible - actuel)
  const planMois = manquant > 0 ? Math.ceil(manquant / (dep * 0.1)) : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Dépenses mensuelles" value={dep} min={500} max={5000} step={100} onChange={setDep} display={fmtEur(dep)} color={color} />
        <Sl label="Objectif (mois)" value={mois} min={1} max={12} onChange={setMois} display={`${mois} mois`} color={color} />
        <Sl label="Épargne actuelle" value={actuel} min={0} max={60000} step={500} onChange={setActuel} display={fmtEur(actuel)} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Cible matelas" value={fmtEur(cible)} sub={pct >= 100 ? '✓ Objectif atteint !' : `${pct.toFixed(0)}% constitué`} color={color} />
        <div style={{ height: 12, borderRadius: 99, background: LINE_STR, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? UP : color, borderRadius: 99, transition: 'width .4s' }} />
        </div>
        {manquant > 0 && (
          <KpiRow items={[
            { label: 'Manquant', value: fmtEur(manquant), color: DOWN },
            { label: 'Plan (10%)', value: `${planMois} mois` },
          ]} />
        )}
      </div>
    </div>
  )
}

function RevenuPassifSim({ color }: { color: string }) {
  const [cap, setCap] = useState(80000)
  const [taux, setTaux] = useState(4)
  const [rein, setRein] = useState<'dist'|'acc'>('dist')
  const revMensuel  = cap * (taux / 100) / 12
  const capitalLibe = cap
  const objectif1k  = 1000 * 12 / (taux / 100)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Capital investi" value={cap} min={5000} max={500000} step={5000} onChange={setCap} display={fmtEur(cap)} color={color} />
        <Sl label="Taux de distribution" value={taux} min={1} max={10} step={0.5} onChange={setTaux} display={fmtPct(taux)} color={color} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {(['dist', 'acc'] as const).map(v => (
            <button key={v} onClick={() => setRein(v)} style={{
              flex: 1, padding: '7px 0', borderRadius: 6, border: `1px solid ${rein === v ? color : LINE_STR}`,
              background: rein === v ? color + '18' : SURFACE,
              color: rein === v ? color : MUTED, fontFamily: F_MONO, fontSize: 11, cursor: 'pointer',
            }}>{v === 'dist' ? 'Distribution' : 'Accumulation'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Revenus passifs / mois" value={fmtEur(revMensuel)} sub={`${fmtEur(revMensuel * 12)} / an`} color={color} />
        <KpiRow items={[
          { label: 'Pour 1 000 €/mois', value: fmtEur(objectif1k) },
          { label: 'Taux distribué', value: fmtPct(taux) },
        ]} />
      </div>
    </div>
  )
}

function EtfSim({ color }: { color: string }) {
  const [cap, setCap]   = useState(50000)
  const [ter1, setTer1] = useState(0.38)
  const [ter2, setTer2] = useState(0.20)
  const [yr, setYr]     = useState(20)
  const r = 7
  const fv1 = useMemo(() => compoundFV(cap, 0, r - ter1, yr), [cap, ter1, yr])
  const fv2 = useMemo(() => compoundFV(cap, 0, r - ter2, yr), [cap, ter2, yr])
  const impact = fv1 - fv2

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Sl label="Capital investi" value={cap} min={5000} max={500000} step={5000} onChange={setCap} display={fmtEur(cap)} color={color} />
        <Sl label="TER ETF A" value={ter1} min={0.05} max={1} step={0.01} onChange={setTer1} display={fmtPct(ter1, 2)} color={color} />
        <Sl label="TER ETF B" value={ter2} min={0.05} max={1} step={0.01} onChange={setTer2} display={fmtPct(ter2, 2)} color={color} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <div style={{ textAlign: 'center', padding: '16px 10px', borderRadius: 12, background: BG, border: `1.5px solid ${DOWN}40` }}>
          <div style={{ fontSize: 9.5, fontFamily: F_MONO, color: MUTED2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>ETF A · TER {fmtPct(ter1, 2)}</div>
          <div style={{ fontFamily: F_SERIF, fontSize: 22, color: INK }}>{fmtEur(fv1)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 10px', borderRadius: 12, background: color + '10', border: `1.5px solid ${color}50` }}>
          <div style={{ fontSize: 9.5, fontFamily: F_MONO, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>ETF B · TER {fmtPct(ter2, 2)} ✓</div>
          <div style={{ fontFamily: F_SERIF, fontSize: 22, color: INK }}>{fmtEur(fv2)}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '16px 10px', borderRadius: 12, background: UP + '10', border: `1.5px solid ${UP}30` }}>
          <div style={{ fontSize: 9.5, fontFamily: F_MONO, color: UP, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontWeight: 700 }}>Économie {yr} ans</div>
          <div style={{ fontFamily: F_SERIF, fontSize: 22, color: UP }}>+{fmtEur(Math.abs(impact))}</div>
        </div>
      </div>
    </div>
  )
}

function SuccessionSim({ color }: { color: string }) {
  const [Patrimoine, setPatrimoine] = useState(250000)
  const [lien, setLien] = useState<'enfant'|'conjoint'|'frere'|'neveu'|'tiers'>('enfant')

  const LINKS = {
    enfant:   { abatt: 100000, taux: [[0,8072,.05],[8072,12109,.10],[12109,15932,.15],[15932,552324,.20],[552324,902838,.30],[902838,1805677,.40],[1805677,Infinity,.45]] as [number,number,number][] },
    conjoint: { abatt: Infinity, taux: [] as [number,number,number][] }, // exonéré
    frere:    { abatt: 15932, taux: [[0,24430,.35],[24430,Infinity,.45]] as [number,number,number][] },
    neveu:    { abatt: 7967, taux: [[0,Infinity,.55]] as [number,number,number][] },
    tiers:    { abatt: 1594, taux: [[0,Infinity,.60]] as [number,number,number][] },
  }

  const { abatt, taux: slabs } = LINKS[lien]
  const taxableBase = Math.max(0, Patrimoine - Math.min(abatt, Patrimoine))
  let droits = 0
  for (const [lo, hi, r] of slabs) {
    if (taxableBase > lo) droits += (Math.min(taxableBase, hi) - lo) * r
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Patrimoine transmis" value={Patrimoine} min={10000} max={2000000} step={10000} onChange={setPatrimoine} display={fmtEur(Patrimoine)} color={color} />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, marginBottom: 8 }}>Lien de parenté</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {(['enfant','conjoint','frere','neveu','tiers'] as const).map(l => (
              <button key={l} onClick={() => setLien(l)} style={{
                padding: '7px 10px', borderRadius: 6, border: `1px solid ${lien === l ? color : LINE_STR}`,
                background: lien === l ? color + '18' : SURFACE,
                color: lien === l ? color : MUTED, fontFamily: F_MONO, fontSize: 11, cursor: 'pointer',
                textAlign: 'left', fontWeight: lien === l ? 700 : 400,
                textTransform: 'capitalize',
              }}>{l === 'frere' ? 'Frère/sœur' : l === 'neveu' ? 'Neveu/nièce' : l.charAt(0).toUpperCase() + l.slice(1)}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Droits de succession"
          value={lien === 'conjoint' ? 'Exonéré' : fmtEur(droits)}
          sub={lien !== 'conjoint' ? `Base taxable ${fmtEur(taxableBase)} · Abatt. ${fmtEur(Math.min(abatt, Patrimoine))}` : 'Conjoint exonéré de droits'}
          color={color} />
        {lien !== 'conjoint' && <KpiRow items={[
          { label: 'Reçu net', value: fmtEur(Patrimoine - droits), color: UP },
          { label: 'Tx effectif', value: fmtPct(droits / Patrimoine * 100) },
        ]} />}
      </div>
    </div>
  )
}

function CreditConsoSim({ color }: { color: string }) {
  const [montant, setMontant] = useState(10000)
  const [taeg, setTaeg]       = useState(8)
  const [duree, setDuree]     = useState(48)
  const rm         = taeg / 100 / 12
  const mensualite = rm > 0 ? montant * rm / (1 - Math.pow(1 + rm, -duree)) : montant / duree
  const total      = mensualite * duree
  const interets   = total - montant
  // Opportunity cost: if invested at 7%
  const fvInvest   = compoundFV(montant, 0, 7, duree / 12) - montant

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <Sl label="Montant emprunté" value={montant} min={500} max={50000} step={500} onChange={setMontant} display={fmtEur(montant)} color={color} />
        <Sl label="TAEG" value={taeg} min={1} max={25} step={0.5} onChange={setTaeg} display={fmtPct(taeg)} color={color} />
        <Sl label="Durée (mois)" value={duree} min={6} max={84} step={6} onChange={setDuree} display={`${duree} mois`} color={color} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigResult label="Coût total du crédit" value={fmtEur(interets)} sub={`Mensualité ${fmtEur(mensualite)}`} color={color} />
        <KpiRow items={[
          { label: 'Total remboursé', value: fmtEur(total) },
          { label: 'Manque à gagner', value: fmtEur(fvInvest), color: DOWN },
        ]} />
      </div>
    </div>
  )
}

/* ── Score Patrimonial — SPECIAL ── */
function ScoreRingSvg({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  const col = value >= 70 ? '#1F7A4A' : value >= 40 ? '#B07820' : '#B23B3B'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={LINE_STR} strokeWidth="4.5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="4.5"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 5} textAnchor="middle"
        style={{ fontSize: 14, fontFamily: F_MONO, fontWeight: 700, fill: col }}>{value}</text>
    </svg>
  )
}

function ScorePatrimonialSim({ color }: { color: string }) {
  const pillars = [
    { key: 'epargne',  label: 'Épargne',     tip: 'Visez 20% de taux d\'épargne mensuel avant d\'investir en Bourse.', init: 68 },
    { key: 'dettes',   label: 'Dettes',       tip: 'Remboursez en priorité les crédits à taux > 5% avant d\'investir.', init: 55 },
    { key: 'diversif', label: 'Diversif.',    tip: 'Répartissez sur au moins 3 classes d\'actifs (actions, immo, obligations).', init: 74 },
    { key: 'fiscal',   label: 'Fiscal',       tip: 'Maximisez vos versements PEA et PER pour réduire votre imposition.', init: 48 },
    { key: 'prevoy',   label: 'Prévoyance',   tip: 'Constituez 3 à 6 mois de dépenses en épargne d\'urgence liquide.', init: 40 },
    { key: 'fire',     label: 'FIRE',         tip: 'Calculez votre nombre de mois de liberté : Patrimoine ÷ dépenses mensuelles.', init: 32 },
  ]
  const [scores, setScores] = useState<Record<string, number>>(Object.fromEntries(pillars.map(p => [p.key, p.init])))
  const total = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / pillars.length)
  const weakest = [...pillars].sort((a, b) => scores[a.key] - scores[b.key]).slice(0, 3)
  const totalColor = total >= 70 ? UP : total >= 40 ? '#B07820' : DOWN

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Left: sliders */}
        <div>
          <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, marginBottom: 12, letterSpacing: '0.06em' }}>AJUSTEZ VOTRE SITUATION</div>
          {pillars.map(p => (
            <Sl key={p.key} label={p.label} value={scores[p.key]} min={0} max={100}
              onChange={v => setScores(s => ({ ...s, [p.key]: v }))}
              display={String(scores[p.key])} color={scores[p.key] >= 70 ? UP : scores[p.key] >= 40 ? '#B07820' : DOWN} />
          ))}
        </div>

        {/* Right: rings + total */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontFamily: F_MONO, color: MUTED2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Score global</div>
            <div style={{ fontFamily: F_SERIF, fontSize: 56, fontWeight: 400, letterSpacing: '-0.04em', color: totalColor, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO, marginTop: 4 }}>/ 100 · {total >= 70 ? 'Bonne santé' : total >= 40 ? 'À améliorer' : 'Attention'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {pillars.map(p => (
              <div key={p.key} style={{ textAlign: 'center' }}>
                <ScoreRingSvg value={scores[p.key]} color={color} size={52} />
                <div style={{ fontSize: 9.5, fontFamily: F_MONO, color: MUTED, marginTop: 3, letterSpacing: '0.04em' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips — blurred */}
      <div style={{ marginTop: 20, borderTop: `1px solid ${LINE_STR}`, paddingTop: 16 }}>
        <div style={{ fontSize: 10, fontFamily: F_MONO, color: MUTED2, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>3 axes prioritaires</div>
        <BlurGate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {weakest.map((p, i) => (
              <div key={p.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: BG, border: `1px solid ${LINE_STR}` }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                  background: scores[p.key] < 40 ? DOWN + '20' : '#B07820' + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, fontFamily: F_MONO,
                  color: scores[p.key] < 40 ? DOWN : '#B07820',
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: INK, marginBottom: 2 }}>{p.label} · score {scores[p.key]}</div>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{p.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </BlurGate>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   ROUTER
════════════════════════════════════════════════════ */

const PREVIEW_MAP: Record<string, (color: string) => React.ReactNode> = {
  'interets-composes':  c => <CompoundInterest color={c} />,
  'fire':               c => <FireSim color={c} />,
  'pret-immobilier':    c => <MortgageSim color={c} />,
  'acheter-ou-louer':   c => <BuyRentSim color={c} />,
  'impots-ir':          c => <ImpotsSim color={c} />,
  'flat-tax-bareme':    c => <FlatTaxSim color={c} />,
  'dca':                c => <DcaSim color={c} />,
  'pea-cto-av':         c => <PeaCtaAvSim color={c} />,
  'epargne-urgence':    c => <EpargneUrgenceSim color={c} />,
  'rentabilite-locative': c => <RentaSim color={c} />,
  'succession':         c => <SuccessionSim color={c} />,
  'score-Patrimonial':  c => <ScorePatrimonialSim color={c} />,
  'revenus-passifs':    c => <RevenuPassifSim color={c} />,
  'optimiseur-etf':     c => <EtfSim color={c} />,
  'credit-conso':       c => <CreditConsoSim color={c} />,
  'retraite':           c => <RetraiteSim color={c} />,
  'taux-epargne':       c => <TauxEpargneSim color={c} />,
  'budget-50-30-20':    c => <Budget5030Sim color={c} />,
}

export function ToolPreview({ slug, color }: { slug: string; color: string }) {
  const render = PREVIEW_MAP[slug]
  if (!render) return null
  return (
    <section style={{ marginBottom: 80 }}>
      <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.02em', color: INK }}>
        Simulez maintenant
      </h2>
      <div style={{
        padding: '28px', borderRadius: 18,
        background: SURFACE, border: `1px solid ${LINE_STR}`,
        boxShadow: `0 2px 12px ${LINE}`,
      }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: 99, background: color }} />
          <span style={{ fontSize: 10, fontFamily: F_MONO, color, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>Aperçu interactif — modifiez les curseurs</span>
        </div>
        {render(color)}
      </div>
    </section>
  )
}
