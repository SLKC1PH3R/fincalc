'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, TrendingUp, RefreshCw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useCountUp } from '@/lib/use-count-up'

const C = '#a78bfa'

// ─── local formatters ─────────────────────────────────────────────────────────
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const GAP = 16

// ─── BuyRentChart ────────────────────────────────────────────────────────────
function BuyRentChart({ buyWorth, rentCapital, years }: { buyWorth: number; rentCapital: number; years: number }) {
  const W = 800, H = 260, PAD = { l: 52, r: 16, t: 16, b: 44 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b

  const N = years
  const maxV = Math.max(buyWorth, rentCapital, 1) * 1.06

  // Build progressive series
  const buyPts = Array.from({ length: N + 1 }, (_, i) => {
    const v = buyWorth * (i / N) * (1 + (i / N) * 0.15)
    return { x: PAD.l + (i / N) * w, y: PAD.t + h - Math.min(v / maxV, 1) * h }
  })
  const rentPts = Array.from({ length: N + 1 }, (_, i) => {
    const v = rentCapital * (i / N) * (1 + (i / N) * 0.05)
    return { x: PAD.l + (i / N) * w, y: PAD.t + h - Math.min(v / maxV, 1) * h }
  })

  const lineB = buyPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineR = rentPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaB = `${lineB} L${buyPts[N].x},${PAD.t + h} L${buyPts[0].x},${PAD.t + h} Z`

  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="brBuy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.32} />
          <stop offset="100%" stopColor={C} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / maxV) * h
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" letterSpacing="0.03em">{fmtK(t)}</text>
          </g>
        )
      })}
      <path d={areaB} fill="url(#brBuy)" />
      <path d={lineB} fill="none" stroke={C} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={lineR} fill="none" stroke="rgba(200,200,255,0.55)" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6 3" />
      <circle cx={buyPts[N].x} cy={buyPts[N].y} r={4.5} fill={C} />
      <circle cx={buyPts[N].x} cy={buyPts[N].y} r={10} fill={C} opacity={0.18} />
      <circle cx={rentPts[N].x} cy={rentPts[N].y} r={3.5} fill="rgba(200,200,255,0.7)" />
    </svg>
  )
}

// ─── CompareDonut ─────────────────────────────────────────────────────────────
function CompareDonut({ buyWorth, rentCapital, size = 160 }: { buyWorth: number; rentCapital: number; size?: number }) {
  const total = buyWorth + rentCapital || 1
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const dashB = c * (buyWorth / total)
  const pctB = Math.round((buyWorth / total) * 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(200,200,255,0.12)" strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C} strokeWidth={14}
          strokeDasharray={`${dashB} ${c - dashB}`} strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Achat</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{pctB}%</div>
      </div>
    </div>
  )
}

function BuyRentPageInner() {
  const [inputs, setInputs] = useState<BuyRentInputs>({
    price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7,
  })
  const set = (k: keyof BuyRentInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      setInputs({
        price: p.price ?? p.purchasePrice ?? 300000,
        down: p.down ?? p.downPayment ?? 60000,
        loanRate: p.loanRate ?? 3.5,
        rent: p.rent ?? p.monthlyRent ?? 1000,
        years: p.years ?? 20,
        appreciation: p.appreciation ?? p.propertyGrowth ?? 2,
        investReturn: p.investReturn ?? 7,
      })
    } catch { /* ignore */ }
  }, [restoreParam])

  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const bigNum = r.buyWins ? r.buyNetWorth : r.rentCapital
  const bigAnimated = useCountUp(bigNum, 1000)
  const verdictColor = r.buyWins ? '#34d399' : '#f87171'

  const tipsObj = [
    inputs.down / inputs.price < 0.1
      ? { title: 'Apport insuffisant', body: 'Un apport < 10% implique souvent des frais plus élevés. Visez 20% pour obtenir les meilleurs taux.', color: '#f87171' }
      : null,
    inputs.loanRate > 4
      ? { title: 'Taux élevé', body: 'Avec un taux > 4%, consultez un courtier — les écarts entre banques peuvent atteindre 0.5–1 point.', color: '#fbbf24' }
      : null,
    r.breakevenYears > 15
      ? { title: `Seuil à ${r.breakevenYears} ans`, body: `Restez dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans pour rentabiliser l'achat.`, color: C }
      : null,
    !r.buyWins
      ? { title: 'Location avantageuse', body: `Louer et investir la différence peut générer plus de richesse. Revoyez les hypothèses de valorisation.`, color: C }
      : null,
    r.buyWins && r.breakevenYears < 10
      ? { title: 'Excellent investissement', body: `Seuil de rentabilité atteint en ${r.breakevenYears} ans — bien en dessous de la moyenne.`, color: '#34d399' }
      : null,
  ].filter(Boolean) as { title: string; body: string; color: string }[]

  const tips = tipsObj.length ? tipsObj : [
    { title: 'Comparez les taux', body: 'Consultez plusieurs banques — un écart de 0.5% sur 20 ans représente plusieurs dizaines de milliers d\'euros.', color: C },
    { title: 'Frais de notaire', body: `~8% dans l'ancien, ~3% dans le neuf. Intégrez-les dans votre budget total.`, color: '#fbbf24' },
    { title: 'Horizon de détention', body: `Plus vous restez longtemps propriétaire, plus l'achat devient avantageux par rapport à la location.`, color: '#34d399' },
  ]

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Acheter vs Louer</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Acheter vs Louer<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Comparaison patrimoniale sur {inputs.years} ans. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Modèle déterministe — net de frais.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Acheter vs Louer',
            subtitle: `Comparaison patrimoniale sur ${inputs.years} ans`,
            kpis: [
              { label: r.buyWins ? 'Avantage achat' : 'Avantage location', value: fmt(Math.abs(r.delta)), highlight: true },
              { label: 'Patrimoine si achat', value: fmt(r.buyNetWorth) },
              { label: 'Capital si location', value: fmt(r.rentCapital) },
              { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans` },
            ],
            inputs: [
              { label: 'Prix du bien', value: fmt(inputs.price) },
              { label: 'Apport', value: fmt(inputs.down) },
              { label: 'Taux crédit', value: `${inputs.loanRate}%` },
              { label: 'Loyer équivalent', value: `${fmt(inputs.rent)}/mois` },
              { label: 'Durée analyse', value: `${inputs.years} ans` },
              { label: 'Rendement investissement', value: `${inputs.investReturn}%` },
            ],
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="buyrent" name={`Achat vs Loc ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }}
            onClick={() => setInputs({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })}>
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

              {/* Prix du bien */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Prix du bien<FieldTooltip text="Prix d'achat FAI. Les frais de notaire (~8% ancien, ~3% neuf) sont calculés automatiquement." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              {/* Apport */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Apport<FieldTooltip text="20% est idéal pour obtenir les meilleurs taux." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>
                  {fmtPct(inputs.down / inputs.price * 100)} du prix · Emprunt {fmtK(inputs.price - inputs.down)}
                </div>
              </div>

              <div style={divSt} />

              {/* Taux */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Taux du prêt<FieldTooltip text="Taux annuel hors assurance. Actuellement 3–4.5% selon la durée." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.loanRate} %</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
              </div>

              <div style={divSt} />

              {/* Loyer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Loyer équivalent<FieldTooltip text="Loyer pour un bien similaire. La différence avec la mensualité est investie." />
                </label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 42, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€/mois</span>
                </div>
              </div>

              <div style={divSt} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Durée d&apos;analyse<FieldTooltip text="Plus la durée est longue, plus l'achat devient généralement avantageux." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.years} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
              </div>

              <div style={divSt} />

              {/* Valorisation */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Valorisation immo/an<FieldTooltip text="Appréciation annuelle estimée. France longue période : ~2–3%." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.appreciation} %</span>
                </div>
                <Slider min={-2} max={8} step={0.5} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
              </div>

              {/* Rendement placement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Rendement placement<FieldTooltip text="Rendement annuel si vous investissez votre apport en location (ETF, SCPI...)." />
                  </label>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.investReturn} %</span>
                </div>
                <Slider min={0} max={12} step={0.5} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Modèle déterministe — frais de notaire et d&apos;agence inclus.
          </div>
        </div>

        {/* ── CENTER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              {r.buyWins ? 'Patrimoine achat' : 'Capital location'} · {inputs.years} ans
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(bigAnimated)}
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${r.buyNetWorth / Math.max(r.buyNetWorth, r.rentCapital) * 100}%`, background: C, transition: 'width 0.5s' }} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C, fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Achat</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: C, marginTop: 4 }}>{fmtK(r.buyNetWorth)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Location</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: 'var(--p-text-mid)', marginTop: 4 }}>{fmtK(r.rentCapital)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Verdict', value: r.buyWins ? 'Achat gagne' : 'Location gagne', color: verdictColor },
                  { label: 'Écart patrimonial', value: fmtK(Math.abs(r.delta)) },
                  { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans` },
                  { label: 'Valeur bien final', value: fmtK(r.propertyValue) },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color || 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHART */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Évolution patrimoniale</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Achat vs location sur {inputs.years} ans</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[
                  { color: C, label: 'Achat' },
                  { color: 'rgba(200,200,255,0.55)', label: 'Location', dashed: true },
                ].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: (l as any).dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <BuyRentChart buyWorth={r.buyNetWorth} rentCapital={r.rentCapital} years={inputs.years} />
            </div>
          </div>

          {/* COMPARAISON TABLE */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Comparaison patrimoniale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Détail à {inputs.years} ans</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'var(--p-card-2)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: '0.10em', fontFamily: 'var(--p-mono)', marginBottom: 10 }}>Achat</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'Valeur bien', value: fmt(r.propertyValue) },
                    { label: 'Coût total', value: fmt(r.totalBuyCost) },
                    { label: 'Patrimoine net', value: fmt(r.buyNetWorth) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--p-mono)', color: 'var(--p-text-em)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--p-card-2)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--p-text-mid)', textTransform: 'uppercase', letterSpacing: '0.10em', fontFamily: 'var(--p-mono)', marginBottom: 10 }}>Location</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'Loyers payés', value: fmt(r.totalRentCost) },
                    { label: 'Capital investi', value: fmt(inputs.down) },
                    { label: 'Capital final', value: fmt(r.rentCapital) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--p-mono)', color: 'var(--p-text-em)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Bilan */}
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ borderRadius: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', padding: '10px 14px' }}>
                <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 700, marginBottom: 10 }}>Bilan comparatif</div>
                {[
                  { label: 'Achat', value: r.buyNetWorth, color: C },
                  { label: 'Location', value: r.rentCapital, color: 'rgba(200,200,255,0.55)' },
                ].map((row, i) => (
                  <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--p-mono)', color: 'var(--p-text-em)' }}>{fmt(row.value)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: row.color, borderRadius: 99, width: `${Math.min(row.value / Math.max(r.buyNetWorth, r.rentCapital) * 100, 100)}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut répartition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition finale</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Achat vs location sur {inputs.years} ans</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <CompareDonut buyWorth={r.buyNetWorth} rentCapital={r.rentCapital} size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: C, label: 'Patrimoine achat', value: fmtK(r.buyNetWorth), pct: (r.buyNetWorth / Math.max(r.buyNetWorth + r.rentCapital, 1)) * 100 },
                  { color: 'rgba(200,200,255,0.55)', label: 'Capital location', value: fmtK(r.rentCapital), pct: (r.rentCapital / Math.max(r.buyNetWorth + r.rentCapital, 1)) * 100 },
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

          {/* Verdict */}
          <div style={{ border: `1px solid ${verdictColor}30`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${verdictColor}0a 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={{ ...eyebrow, color: verdictColor }}>Verdict {inputs.years} ans</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', marginTop: 4 }}>
                {r.buyWins ? "L'achat est plus avantageux" : 'La location est plus avantageuse'}
              </div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                {r.buyWins
                  ? `L'achat génère ${fmt(r.delta)} de patrimoine supplémentaire sur ${inputs.years} ans. Le seuil de rentabilité est atteint en ${r.breakevenYears} ans.`
                  : `Louer et investir la différence génère ${fmt(Math.abs(r.delta))} de capital supplémentaire. Le rendement du placement (${inputs.investReturn}%) surpasse la valorisation immobilière (${inputs.appreciation}%).`}
              </div>
            </div>
          </div>

          {/* Hypothèses */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Hypothèses clés</div>
            </div>
            <div style={{ padding: '12px 18px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Valorisation immo', value: `${inputs.appreciation}%/an` },
                { label: 'Rendement placement', value: `${inputs.investReturn}%/an`, color: C },
                { label: 'Durée analyse', value: `${inputs.years} ans` },
                { label: 'Taux crédit', value: `${inputs.loanRate}%` },
                { label: 'Apport', value: fmtPct(inputs.down / inputs.price * 100), color: inputs.down / inputs.price >= 0.2 ? '#34d399' : '#fbbf24' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--p-mono)', color: (row as any).color || 'var(--p-text-em)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Leviers à considérer</div>
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
                { label: 'Plus-value Immobilière', href: '/dashboard/plusvalue' },
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

export default function BuyRentPage() {
  return <Suspense><BuyRentPageInner /></Suspense>
}
