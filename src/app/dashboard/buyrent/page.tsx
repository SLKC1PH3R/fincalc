'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, Home, TrendingUp, Settings2 } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { FieldTooltip } from '@/components/FieldTooltip'

const COLOR = '#a78bfa'

function BuyRentPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<BuyRentInputs>({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })
  const set = (k: keyof BuyRentInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

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
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const tips: string[] = []
  if (inputs.down / inputs.price < 0.1) tips.push('Un apport < 10% implique souvent des frais plus élevés. Visez 20% pour obtenir les meilleurs taux.')
  if (inputs.loanRate > 4) tips.push('Avec un taux > 4%, consultez un courtier — les écarts entre banques peuvent atteindre 0.5-1 point.')
  if (r.breakevenYears > 15) tips.push(`Seuil de rentabilité à ${r.breakevenYears} ans — restez dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans.`)
  if (!r.buyWins) tips.push('Louer et investir la différence peut générer plus de richesse sur votre horizon. Revoyez les hypothèses de valorisation.')
  if (r.buyWins && r.breakevenYears < 10) tips.push(`Excellent investissement : seuil de rentabilité atteint en ${r.breakevenYears} ans.`)

  const verdictColor = r.buyWins ? '#34d399' : '#f87171'
  const verdictBg = r.buyWins ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.07)'
  const verdictBorder = r.buyWins ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.25)'

  // Build chart data: buy vs rent evolution year by year
  const evolutionData = useMemo(() => {
    const data: { year: number; achat: number; location: number }[] = []
    for (let y = 1; y <= inputs.years; y++) {
      // Simplified approximation per year using final values
      const progress = y / inputs.years
      data.push({
        year: y,
        achat: Math.round(r.buyNetWorth * progress * (1 + progress * 0.1)),
        location: Math.round(r.rentCapital * progress * (1 + progress * 0.05)),
      })
    }
    return data
  }, [inputs.years, r.buyNetWorth, r.rentCapital])

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Acheter vs Louer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>Acheter vs Louer</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Comparaison patrimoniale · Coût total sur {inputs.years} ans</p>
            </div>
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
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="buyrent" name={`Achat vs Loc ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
            <Button variant="outline" size="sm" style={{ borderColor: 'var(--p-line)', color: 'var(--p-text-dim)' }}
              onClick={() => setInputs({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 style={{ width: 12, height: 12, color: COLOR }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Prix du bien */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Prix du bien (€) <FieldTooltip text="Prix d'achat FAI. Les frais de notaire (~8% ancien, ~3% neuf) sont calculés automatiquement." />
                </Label>
                <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} style={{ height: 36, fontSize: 13, fontWeight: 600 }} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Apport */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Apport (€) <FieldTooltip text="20% est idéal pour obtenir les meilleurs taux." />
                </Label>
                <Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>{fmtPct(inputs.down / inputs.price * 100)} du prix · Emprunt {fmt(inputs.price - inputs.down)}</p>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Taux */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Taux du prêt <FieldTooltip text="Taux annuel hors assurance. Actuellement 3-4.5% selon la durée." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.loanRate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Loyer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Loyer équivalent (€/mois) <FieldTooltip text="Loyer pour un bien similaire. La différence avec la mensualité est investie." />
                </Label>
                <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Durée d&apos;analyse <FieldTooltip text="Plus la durée est longue, plus l'achat devient généralement avantageux." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.years} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Valorisation + rendement */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Valorisation immo/an <FieldTooltip text="Appréciation annuelle estimée. France longue période : ~2-3%." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.appreciation}%</span>
                </div>
                <Slider min={-2} max={8} step={0.5} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Rendement placement <FieldTooltip text="Rendement annuel si vous investissez votre apport en location (ETF, SCPI...)." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.investReturn}%</span>
                </div>
                <Slider min={0} max={12} step={0.5} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
              </div>
            </div>
          </div>

          {/* Mini résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Résumé comparatif</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Patrimoine achat', value: fmt(r.buyNetWorth), color: r.buyWins ? '#34d399' : 'var(--p-text-em)' },
                { label: 'Capital location', value: fmt(r.rentCapital), color: !r.buyWins ? '#34d399' : 'var(--p-text-em)' },
                { label: 'Écart', value: fmt(Math.abs(r.delta)), color: verdictColor },
                { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans`, color: 'var(--p-text-em)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: KPIs + chart + comparaison */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: r.buyWins ? 'Avantage achat' : 'Avantage location', value: fmt(Math.abs(r.delta)), sub: `sur ${inputs.years} ans`, color: verdictColor },
              { label: 'Patrimoine si achat', value: fmt(r.buyNetWorth), sub: 'Valeur bien - dette', color: 'var(--p-text)' },
              { label: 'Capital si location', value: fmt(r.rentCapital), sub: 'Placement apport + épargne', color: 'var(--p-text)' },
              { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans`, sub: 'Point mort', color: 'var(--p-text)' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--p-text-dim)', margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Évolution achat vs location */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--p-line)', marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Évolution patrimoniale</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Achat vs location sur {inputs.years} ans</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'var(--p-card)', border: `1px solid ${COLOR}55`, borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--p-text)' }} labelStyle={{ color: COLOR }} />
                <Legend wrapperStyle={{ fontSize: 11, color: chart.tick }} />
                <Line type="monotone" dataKey="achat" name="Achat" stroke={COLOR} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="location" name="Location" stroke="rgba(255,255,255,0.35)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comparaison patrimoniale */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Comparaison patrimoniale</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Détail à {inputs.years} ans</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Achat */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Home style={{ width: 12, height: 12, color: 'var(--p-text-dim)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Achat</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--p-line)', paddingTop: 8 }}>
                  {[
                    { label: 'Valeur bien', value: fmt(r.propertyValue) },
                    { label: 'Coût total', value: fmt(r.totalBuyCost) },
                    { label: 'Patrimoine net', value: fmt(r.buyNetWorth) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text-em)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Location */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <TrendingUp style={{ width: 12, height: 12, color: 'var(--p-text-dim)' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--p-line)', paddingTop: 8 }}>
                  {[
                    { label: 'Loyers payés', value: fmt(r.totalRentCost) },
                    { label: 'Capital investi', value: fmt(inputs.down) },
                    { label: 'Capital final', value: fmt(r.rentCapital) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text-em)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Bilan comparatif */}
            <div style={{ padding: '0 16px 14px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, margin: '0 0 10px' }}>Bilan comparatif</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Achat', value: r.buyNetWorth, color: COLOR },
                    { label: 'Location', value: r.rentCapital, color: 'rgba(255,255,255,0.35)' },
                  ].map((row, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--p-text-dim)' }}>{row.label}</span>
                        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text-em)' }}>{fmt(row.value)}</span>
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
        </div>

        {/* RIGHT: verdict + analyse + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Verdict */}
          <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${verdictColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.buyWins
                  ? <Home style={{ width: 14, height: 14, color: verdictColor }} />
                  : <TrendingUp style={{ width: 14, height: 14, color: verdictColor }} />
                }
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Verdict sur {inputs.years} ans</p>
                <p style={{ fontSize: 11, color: verdictColor, margin: 0 }}>{r.buyWins ? "L'achat est plus avantageux" : 'La location est plus avantageuse'}</p>
              </div>
            </div>

            {/* Barre */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--p-row-hover)', marginBottom: 8 }}>
                <div style={{ background: COLOR, transition: 'width 0.5s', width: `${r.buyNetWorth / Math.max(r.buyNetWorth, r.rentCapital) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--p-text-dim)' }}>
                <span>Achat {fmt(r.buyNetWorth)}</span>
                <span>Loc. {fmt(r.rentCapital)}</span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, margin: 0 }}>
              {r.buyWins
                ? `L'achat génère ${fmt(r.delta)} de patrimoine supplémentaire sur ${inputs.years} ans. Le seuil de rentabilité est atteint en ${r.breakevenYears} ans.`
                : `Louer et investir la différence génère ${fmt(Math.abs(r.delta))} de capital supplémentaire. Le rendement du placement (${inputs.investReturn}%) surpasse la valorisation immobilière (${inputs.appreciation}%).`}
            </p>
          </div>

          {/* Hypothèses */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 12px' }}>Hypothèses clés</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Valorisation immo', value: `${inputs.appreciation}%/an`, color: 'var(--p-text-em)' },
                { label: 'Rendement placement', value: `${inputs.investReturn}%/an`, color: '#818cf8' },
                { label: 'Durée analyse', value: `${inputs.years} ans`, color: 'var(--p-text-em)' },
                { label: 'Taux crédit', value: `${inputs.loanRate}%`, color: 'var(--p-text-em)' },
                { label: 'Apport', value: `${fmtPct(inputs.down / inputs.price * 100)}`, color: inputs.down / inputs.price >= 0.2 ? '#34d399' : '#fbbf24' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          {tips.length > 0 && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Conseils</p>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function BuyRentPage() {
  return <Suspense><BuyRentPageInner /></Suspense>
}
