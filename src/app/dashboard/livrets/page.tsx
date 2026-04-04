'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcLivrets, type LivretsInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, PiggyBank, TrendingUp } from 'lucide-react'

const COLOR = '#34d399'

function LivretsPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<LivretsInputs>({ balance: 10000, monthly: 200, duration: 15 })
  const set = (k: keyof LivretsInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcLivrets(inputs), [inputs])

  const bestLivret = r.livrets.reduce((a, b) => a.final > b.final ? a : b)

  const tips: string[] = []
  if (inputs.balance > 22950) tips.push(`Votre capital dépasse le plafond du Livret A (22 950 €). L'excédent de ${fmt(inputs.balance - 22950)} ne peut pas y être placé.`)
  if (r.opportunity > 5000) tips.push(`Manque à gagner vs ETF : ${fmt(r.opportunity)} sur ${inputs.duration} ans. Les livrets sont sécurisés mais limitent votre rendement sur le long terme.`)
  if (inputs.balance <= 10000) tips.push('Le LEP (taux 4%) est le plus rentable sur de petits montants — il nécessite des conditions de ressources.')
  tips.push('Les livrets réglementés sont exonérés d\'IR et de PS. Idéals pour le fonds d\'urgence (3–6 mois de charges).')

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>Livrets réglementés</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Livrets réglementés</h1>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Livret A · LDDS · LEP · CEL vs ETF</span>
          </div>
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
              items: r.livrets.map(l => ({ label: `${l.name} (${l.rate}% · plafond ${fmt(l.cap)})`, value: fmt(l.final) }))
                .concat([{ label: 'ETF World 7% net (Flat Tax 30%)', value: fmt(r.etfNetFinal) }]),
            }],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="livrets" name={`Livrets ${fmt(inputs.balance)} × ${inputs.duration}a`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
          <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Meilleur livret</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLOR, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(bestLivret.final)}</p>
          <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{bestLivret.name} · {bestLivret.rate}%/an</p>
        </div>
        {[
          { label: 'ETF 7% net', value: fmt(r.etfNetFinal), sub: 'Flat Tax 30%' },
          { label: 'Manque à gagner', value: fmt(r.opportunity), sub: 'vs ETF' },
          { label: 'Intérêts livret', value: fmt(bestLivret.interest), sub: 'exonérés IR+PS' },
        ].map(k => (
          <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label>Capital initial</Label>
            <Input type="number" value={inputs.balance} onChange={e => set('balance')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>Versement mensuel</Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{fmt(inputs.monthly)}</span>
            </div>
            <Slider min={0} max={500} step={50} value={[inputs.monthly]} onValueChange={([v]) => set('monthly')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>Durée</Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.duration} ans</span>
            </div>
            <Slider min={1} max={30} step={1} value={[inputs.duration]} onValueChange={([v]) => set('duration')(v)} />
          </div>

          {/* Taux actuels */}
          <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Taux actuels 2026</p>
            {[{ name: 'Livret A', rate: '3,00 %', cap: '22 950 €' }, { name: 'LDDS', rate: '3,00 %', cap: '12 000 €' }, { name: 'LEP', rate: '4,00 %', cap: '10 000 €' }, { name: 'CEL', rate: '2,00 %', cap: '15 300 €' }].map(l => (
              <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{l.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{l.rate}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 6 }}>max {l.cap}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Comparison table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Comparaison à {inputs.duration} ans</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                  {['Produit', 'Taux net', 'Plafond', 'Valeur finale', 'Intérêts'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 9.5, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.livrets.map(l => (
                  <tr key={l.name} style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-em)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PiggyBank style={{ width: 14, height: 14, color: COLOR }} />
                        {l.name}
                        {l.isCapped && <span style={{ fontSize: 9, color: '#fb923c', background: 'rgba(251,146,60,0.12)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PLAFONNÉ</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: COLOR, fontWeight: 700 }}>{l.rate}%</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted-c)' }}>{fmt(l.cap)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{fmt(l.final)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#34d399', fontWeight: 600 }}>+{fmt(l.interest)}</td>
                  </tr>
                ))}
                <tr style={{ background: `${COLOR}06` }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-em)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp style={{ width: 14, height: 14, color: '#818cf8' }} />
                      ETF World (7% brut)
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#818cf8', fontWeight: 700 }}>4,9% net</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-subtle)' }}>Illimité</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: '#818cf8', letterSpacing: '-0.02em' }}>{fmt(r.etfNetFinal)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#818cf8', fontWeight: 600 }}>+{fmt(r.etfNetFinal - (inputs.balance + inputs.monthly * inputs.duration * 12))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Évolution comparative sur {inputs.duration} ans</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000 ? `${Math.round(v/1000)}k` : v.toString()} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: chart.tick }} />
                <Line type="monotone" dataKey="livretA" name="Livret A" stroke={COLOR} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lep" name="LEP" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="etf" name="ETF net" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
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

export default function LivretsPage() {
  return <Suspense><LivretsPageInner /></Suspense>
}
