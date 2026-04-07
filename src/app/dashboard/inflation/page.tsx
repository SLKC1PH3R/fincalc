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
import { Download, LineChart as LineChartIcon } from 'lucide-react'

const COLOR = '#fb923c'

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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
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
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Inflation &amp; Pouvoir d&apos;Achat</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Taux réel Fisher · Érosion monétaire</p>
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="inflation" name={`Inflation ${inputs.inflationRate}% · ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${isBeatingInflation ? COLOR : '#f87171'}10, transparent)`, border: `1px solid ${isBeatingInflation ? COLOR : '#f87171'}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
          <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Taux réel (Fisher)</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: isBeatingInflation ? COLOR : '#f87171', letterSpacing: '-0.04em', lineHeight: 1 }}>{r.realRate > 0 ? '+' : ''}{r.realRate.toFixed(2)}%</p>
          <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{isBeatingInflation ? '▲ Bat l\'inflation' : '▼ Sous l\'inflation'}</p>
        </div>
        {[
          { label: 'Valeur réelle finale', value: fmt(r.realFinal), sub: `pouvoir d'achat actuel`, color: 'var(--text-primary)' },
          { label: 'Valeur nominale', value: fmt(r.nominalFinal), sub: 'en euros courants', color: 'rgba(255,255,255,0.55)' },
          { label: 'Cash sans investir', value: fmt(r.cashFinal), sub: `perte: ${fmt(r.purchasingPowerLoss)}`, color: '#f87171' },
        ].map(k => (
          <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
          {[
            { label: 'Capital initial', k: 'capital' as const, min: 5000, max: 500000, step: 5000, disp: (v: number) => fmt(v) },
            { label: 'Rendement nominal', k: 'nominalRate' as const, min: 0, max: 15, step: 0.5, disp: (v: number) => `${v}%` },
            { label: 'Taux d\'inflation', k: 'inflationRate' as const, min: 0.5, max: 10, step: 0.5, disp: (v: number) => `${v}%` },
            { label: 'Durée', k: 'years' as const, min: 5, max: 40, step: 1, disp: (v: number) => `${v} ans` },
          ].map(s => (
            <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label>{s.label}</Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.disp(inputs[s.k])}</span>
              </div>
              <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
            </div>
          ))}

          {/* Références inflation */}
          <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Référence</p>
            {[{ label: 'Inflation France 2024', val: '2,3%' }, { label: 'Cible BCE', val: '2,0%' }, { label: 'Inflation 2022 (pic)', val: '5,2%' }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{r.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLOR }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Valeur nominale vs réelle sur {inputs.years} ans</p>
            <ResponsiveContainer width="100%" height={200}>
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

          {/* Explication taux réel */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Décomposition</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Rendement nominal', value: `${inputs.nominalRate}%`, desc: 'Affiché par votre placement' },
                { label: 'Taux d\'inflation', value: `${inputs.inflationRate}%`, desc: 'Hausse des prix annuelle' },
                { label: 'Taux réel (Fisher)', value: `${r.realRate.toFixed(2)}%`, desc: '(1+n)/(1+i) − 1', highlight: true },
                { label: 'Seuil minimal', value: `${inputs.inflationRate}%`, desc: 'Pour ne pas perdre de PA' },
              ].map(k => (
                <div key={k.label} style={{ background: k.highlight ? `${COLOR}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${k.highlight ? COLOR + '25' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 9.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: k.highlight ? COLOR : 'var(--text-primary)', letterSpacing: '-0.03em' }}>{k.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 3 }}>{k.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>✦</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
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
