'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcSCPI, type SCPIInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download } from 'lucide-react'

const COLOR = '#f59e0b'

const TMI_OPTIONS = [0, 11, 30, 41, 45]

function SCPIPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<SCPIInputs>({
    capital: 50000,
    distributionRate: 4.5,
    revaluationRate: 1,
    fraisSouscription: 10,
    tmi: 30,
    duration: 15,
  })
  const set = (k: keyof SCPIInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcSCPI(inputs), [inputs])

  const tips: string[] = []
  tips.push(`Après ${inputs.fraisSouscription}% de frais d'entrée, votre capital effectivement investi est de ${fmt(r.capitalInvested)}.`)
  tips.push(`Rendement net après TMI ${inputs.tmi}% + PS 17.2% : ${r.netYield.toFixed(2)}%/an — soit ${fmt(r.netIncome)}/an et ${fmt(Math.round(r.netIncome/12))}/mois.`)
  if (inputs.tmi >= 41) tips.push('À forte TMI, envisagez une SCPI via assurance-vie (taxation à 7.5% après 8 ans) pour réduire la pression fiscale sur les revenus.')
  tips.push(`Sur ${inputs.duration} ans : ${fmt(r.totalNetIncome)} de revenus nets + ${fmt(Math.max(0, r.finalValue - r.capitalInvested))} de revalorisation = ${fmt(r.totalReturn)} de retour total.`)
  if (inputs.fraisSouscription > 8) tips.push('Les frais de souscription SCPI (8–12%) nécessitent au moins 5–7 ans pour être absorbés. Investissement de long terme recommandé.')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>SCPI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>SCPI — Pierre-Papier</h1>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Rendement net · Fiscalité foncière · Revalorisation</span>
          </div>
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
                { label: 'Taux d\'imposition effectif', value: `${r.taxRate.toFixed(1)}%` },
                { label: 'Revenu net annuel', value: fmt(r.netIncome) },
                { label: 'Revenu net mensuel', value: fmt(Math.round(r.netIncome / 12)) },
                { label: `Revenus nets sur ${inputs.duration} ans`, value: fmt(r.totalNetIncome) },
                { label: 'Valeur parts à terme', value: fmt(r.finalValue) },
                { label: 'ROI total', value: `${r.roi.toFixed(1)}%` },
              ]
            }],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="scpi" name={`SCPI ${inputs.distributionRate}% · TMI ${inputs.tmi}% · ${inputs.duration}a`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
          <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Revenu net / an</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLOR, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(r.netIncome)}</p>
          <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{fmt(Math.round(r.netIncome / 12))}/mois net</p>
        </div>
        {[
          { label: 'Rendement net', value: `${r.netYield.toFixed(2)}%`, sub: `brut ${inputs.distributionRate}% − fisc. ${r.taxRate.toFixed(1)}%`, color: 'var(--text-primary)' },
          { label: 'Valeur parts finale', value: fmt(r.finalValue), sub: `+${inputs.revaluationRate}%/an revalorisation`, color: 'rgba(255,255,255,0.7)' },
          { label: 'Retour total net', value: fmt(r.totalReturn), sub: `ROI ${r.roi.toFixed(1)}%`, color: '#34d399' },
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
            { label: 'Capital investi', k: 'capital' as const, min: 5000, max: 500000, step: 5000, disp: (v: number) => fmt(v) },
            { label: 'Taux de distribution', k: 'distributionRate' as const, min: 2, max: 8, step: 0.25, disp: (v: number) => `${v}%` },
            { label: 'Revalorisation des parts', k: 'revaluationRate' as const, min: -2, max: 5, step: 0.25, disp: (v: number) => `${v}%/an` },
            { label: 'Frais de souscription', k: 'fraisSouscription' as const, min: 0, max: 15, step: 0.5, disp: (v: number) => `${v}%` },
            { label: 'Durée', k: 'duration' as const, min: 3, max: 30, step: 1, disp: (v: number) => `${v} ans` },
          ].map(s => (
            <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label>{s.label}</Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.disp(inputs[s.k])}</span>
              </div>
              <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
            </div>
          ))}

          {/* TMI selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Label>Tranche marginale d&apos;imposition</Label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TMI_OPTIONS.map(t => (
                <button key={t} onClick={() => set('tmi')(t)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${inputs.tmi === t ? COLOR : 'rgba(255,255,255,0.1)'}`, background: inputs.tmi === t ? `${COLOR}20` : 'transparent', color: inputs.tmi === t ? COLOR : 'var(--text-subtle)', transition: 'all 0.15s' }}>
                  {t}%
                </button>
              ))}
            </div>
          </div>

          {/* Fiscalité note */}
          <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Régime foncier</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>Les revenus SCPI sont imposés comme revenus fonciers : TMI + 17.2% de prélèvements sociaux.</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginTop: 6 }}>Taux effectif : {r.taxRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Évolution du patrimoine sur {inputs.duration} ans</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="valeurParts" name="Valeur des parts" stroke={COLOR} fill={`${COLOR}18`} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cumRevenu" name="Revenus nets cumulés" stroke="#34d399" fill="rgba(52,211,153,0.10)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="total" name="Total (parts + revenus)" stroke="#818cf8" fill="rgba(129,140,248,0.06)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Fiscalité detail */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Détail de la rentabilité</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Capital investi effectif', value: fmt(r.capitalInvested), desc: `après ${inputs.fraisSouscription}% frais` },
                { label: 'Revenu brut annuel', value: fmt(r.annualIncome), desc: `${inputs.distributionRate}% du capital net` },
                { label: 'Fiscalité (TMI + PS)', value: `${r.taxRate.toFixed(1)}%`, desc: `${inputs.tmi}% + 17.2% PS`, highlight: true },
                { label: 'Revenu net annuel', value: fmt(r.netIncome), desc: `${fmt(Math.round(r.netIncome/12))}/mois` },
                { label: `Revenus nets × ${inputs.duration} ans`, value: fmt(r.totalNetIncome), desc: 'sans réinvestissement' },
                { label: 'PV parts estimée', value: fmt(Math.max(0, r.finalValue - r.capitalInvested)), desc: `à ${inputs.revaluationRate}%/an` },
              ].map(k => (
                <div key={k.label} style={{ background: k.highlight ? `${COLOR}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${k.highlight ? COLOR + '25' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 9.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: k.highlight ? COLOR : 'var(--text-primary)', letterSpacing: '-0.03em' }}>{k.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 3 }}>{k.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SCPI reference */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>SCPI populaires (indicatif 2024)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { name: 'Primopierre', td: '4.48%', type: 'Bureaux' },
                { name: 'Immorente', td: '4.60%', type: 'Commerce' },
                { name: 'Épargne Foncière', td: '4.10%', type: 'Diversifié' },
                { name: 'Corum Origin', td: '6.06%', type: 'Europe' },
                { name: 'Pierval Santé', td: '4.97%', type: 'Santé' },
                { name: 'Novaxia Néo', td: '6.51%', type: 'Urbain' },
              ].map(s => (
                <div key={s.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: COLOR, marginTop: 2 }}>{s.td}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{s.type}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 10 }}>Taux de distribution 2024 — indicatif, non garanti. Source : ASPIM.</p>
          </div>

          {/* Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 16px', animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined }}>
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

export default function SCPIPage() {
  return <Suspense><SCPIPageInner /></Suspense>
}
