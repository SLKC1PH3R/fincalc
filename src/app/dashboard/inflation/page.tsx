'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcInflation, type InflationInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, LineChart as LineChartIcon, Settings2 } from 'lucide-react'

const COLOR = '#f59e0b'

function InflationPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<InflationInputs>({ capital: 50000, nominalRate: 7, inflationRate: 2.5, years: 20 })
  const set = (k: keyof InflationInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcInflation(inputs), [inputs])

  const isBeatingInflation = r.realRate > 0
  const tips: string[] = []
  if (!isBeatingInflation) tips.push(`Votre rendement nominal (${inputs.nominalRate}%) est inférieur à l'inflation (${inputs.inflationRate}%). Vous perdez du pouvoir d'achat !`)
  else tips.push(`Taux réel : ${r.realRate.toFixed(2)}%. Votre capital prend réellement de la valeur après inflation.`)
  tips.push(`Garder ${fmt(inputs.capital)} sous forme de cash à l'inflation actuelle = perdre ${fmt(r.purchasingPowerLoss)} de pouvoir d'achat en ${inputs.years} ans.`)
  if (inputs.inflationRate > 3) tips.push('Inflation > 3% : privilégiez les actifs réels (immobilier, actions) qui s\'apprécient naturellement avec les prix.')
  tips.push(`Le seuil minimum de rendement pour maintenir votre pouvoir d'achat est ${inputs.inflationRate}%/an — soit le taux d'inflation.`)

  return (
    <div style={{ padding: '20px 24px 48px', background: 'var(--p-bg)' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Inflation &amp; Pouvoir d&apos;Achat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LineChartIcon style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>Inflation &amp; Pouvoir d&apos;Achat</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Taux réel Fisher · Érosion monétaire</p>
            </div>
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
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="inflation" name={`Inflation ${inputs.inflationRate}% · ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Carte Paramètres */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Settings2 style={{ width: 13, height: 13, color: COLOR }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Capital initial', k: 'capital' as const, min: 5000, max: 500000, step: 5000, disp: (v: number) => fmt(v) },
                { label: 'Rendement nominal', k: 'nominalRate' as const, min: 0, max: 15, step: 0.5, disp: (v: number) => `${v}%` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {[
                { label: 'Taux d\'inflation', k: 'inflationRate' as const, min: 0.5, max: 10, step: 0.5, disp: (v: number) => `${v}%` },
                { label: 'Durée', k: 'years' as const, min: 5, max: 40, step: 1, disp: (v: number) => `${v} ans` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{s.disp(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Références inflation */}
              <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Référence</p>
                {[{ label: 'Inflation France 2024', val: '2,3%' }, { label: 'Cible BCE', val: '2,0%' }, { label: 'Inflation 2022 (pic)', val: '5,2%' }].map(ref => (
                  <div key={ref.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{ref.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLOR }}>{ref.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini-résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Résumé</p>
            {[
              { label: 'Taux réel', value: `${r.realRate > 0 ? '+' : ''}${r.realRate.toFixed(2)}%`, color: isBeatingInflation ? COLOR : '#f87171' },
              { label: 'Valeur réelle', value: fmt(r.realFinal), color: 'var(--p-text)' },
              { label: 'Valeur nominale', value: fmt(r.nominalFinal), color: 'rgba(255,255,255,0.55)' },
              { label: 'Perte cash', value: fmt(r.purchasingPowerLoss), color: '#f87171' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — KPIs + chart + décomposition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${isBeatingInflation ? COLOR : '#f87171'}10, transparent)`, border: `1px solid ${isBeatingInflation ? COLOR : '#f87171'}30`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
              <p style={{ fontSize: 9, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Taux réel (Fisher)</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: isBeatingInflation ? COLOR : '#f87171', letterSpacing: '-0.5px', lineHeight: 1 }}>{r.realRate > 0 ? '+' : ''}{r.realRate.toFixed(2)}%</p>
              <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4 }}>{isBeatingInflation ? '▲ Bat l\'inflation' : '▼ Sous l\'inflation'}</p>
            </div>
            {[
              { label: 'Valeur réelle finale', value: fmt(r.realFinal), sub: `pouvoir d'achat actuel`, color: 'var(--p-text)' },
              { label: 'Valeur nominale', value: fmt(r.nominalFinal), sub: 'en euros courants', color: 'rgba(255,255,255,0.55)' },
              { label: 'Cash sans investir', value: fmt(r.cashFinal), sub: `perte: ${fmt(r.purchasingPowerLoss)}`, color: '#f87171' },
            ].map(k => (
              <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
                <p style={{ fontSize: 9, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart principal */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', marginBottom: 10 }}>Valeur nominale vs réelle sur {inputs.years} ans</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="nominal" name="Valeur nominale" stroke={COLOR} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="real" name="Valeur réelle" stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cash" name="Cash (sans investir)" stroke="#f87171" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Décomposition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', marginBottom: 12 }}>Décomposition</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Rendement nominal', value: `${inputs.nominalRate}%`, desc: 'Affiché par votre placement' },
                { label: 'Taux d\'inflation', value: `${inputs.inflationRate}%`, desc: 'Hausse des prix annuelle' },
                { label: 'Taux réel (Fisher)', value: `${r.realRate.toFixed(2)}%`, desc: '(1+n)/(1+i) − 1', highlight: true },
                { label: 'Seuil minimal', value: `${inputs.inflationRate}%`, desc: 'Pour ne pas perdre de PA' },
              ].map(k => (
                <div key={k.label} style={{ background: k.highlight ? `${COLOR}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${k.highlight ? COLOR + '25' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: k.highlight ? COLOR : 'var(--p-text)', letterSpacing: '-0.03em' }}>{k.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 3 }}>{k.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — analyse + barres + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', marginBottom: 12 }}>Que vaut 1 000 € dans X ans ?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[5, 10, 20, 30].map(yr => {
                const val = Math.round(1000 / Math.pow(1 + inputs.inflationRate / 100, yr))
                const pct = val / 10
                return (
                  <div key={yr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Dans {yr} ans</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: val > 700 ? COLOR : val > 500 ? '#fb923c' : '#f87171' }}>{val} €</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: val > 700 ? COLOR : val > 500 ? '#fb923c' : '#f87171' }} />
                    </div>
                  </div>
                )
              })}
              <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4 }}>Pouvoir d&apos;achat de 1 000 € d&apos;aujourd&apos;hui à {inputs.inflationRate}% d&apos;inflation/an.</p>
            </div>
          </div>

          {/* Solutions anti-inflation */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text)', marginBottom: 10 }}>Solutions anti-inflation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Actions (MSCI World)', rendement: '7–9%', color: '#34d399' },
                { label: 'SCPI', rendement: '4–6%', color: COLOR },
                { label: 'Livret A (indexé partial)', rendement: '3%', color: '#94a3b8' },
                { label: 'OAT indexée inflation', rendement: 'inflation +0.1%', color: '#94a3b8' },
                { label: 'Cash (CAT)', rendement: '2–3%', color: '#f87171' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.rendement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>✦</span>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function InflationPage() {
  return <Suspense><InflationPageInner /></Suspense>
}
