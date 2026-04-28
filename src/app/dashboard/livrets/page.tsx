'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcLivrets, type LivretsInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, PiggyBank, TrendingUp, Banknote, Settings2 } from 'lucide-react'

const COLOR = '#34d399'

function LivretsPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<LivretsInputs>({ balance: 10000, monthly: 200, duration: 15 })
  const set = (k: keyof LivretsInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcLivrets(inputs), [inputs])

  const bestLivret = r.livrets.reduce((a, b) => a.final > b.final ? a : b)
  const totalInvested = inputs.balance + inputs.monthly * inputs.duration * 12

  const tips: string[] = []
  if (inputs.balance > 22950) tips.push(`Votre capital dépasse le plafond du Livret A (22 950 €). L'excédent de ${fmt(inputs.balance - 22950)} ne peut pas y être placé.`)
  if (r.opportunity > 5000) tips.push(`Manque à gagner vs ETF : ${fmt(r.opportunity)} sur ${inputs.duration} ans. Les livrets sont sécurisés mais limitent votre rendement sur le long terme.`)
  if (inputs.balance <= 10000) tips.push('Le LEP (taux 4%) est le plus rentable sur de petits montants — il nécessite des conditions de ressources.')
  tips.push('Les livrets réglementés sont exonérés d\'IR et de PS. Idéals pour le fonds d\'urgence (3–6 mois de charges).')

  const barData = r.livrets.map(l => ({
    name: l.name,
    intérêts: Math.round(l.interest),
    capital: Math.round(totalInvested),
    fill: l.name === bestLivret.name ? COLOR : 'rgba(255,255,255,0.2)',
  })).concat([{
    name: 'ETF 7%',
    intérêts: Math.round(r.etfNetFinal - totalInvested),
    capital: Math.round(totalInvested),
    fill: '#818cf8',
  }])

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Livrets Réglementés</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Banknote style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>Livrets Réglementés</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Livret A · LDDS · LEP · CEL vs ETF</p>
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
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="livrets" name={`Livrets ${fmt(inputs.balance)} × ${inputs.duration}a`} inputs={inputs as any} results={r as any} />
            <Button variant="outline" size="sm" style={{ borderColor: 'var(--p-line)', color: 'var(--p-text-dim)' }}
              onClick={() => setInputs({ balance: 10000, monthly: 200, duration: 15 })}>
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

              {/* Capital initial */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Capital initial (€)</Label>
                <Input type="number" value={inputs.balance} onChange={e => set('balance')(+e.target.value)} style={{ height: 36, fontSize: 13, fontWeight: 600 }} />
                {inputs.balance > 22950 && (
                  <p style={{ fontSize: 11, color: '#fbbf24', margin: 0 }}>⚠ Dépasse le plafond Livret A (22 950 €)</p>
                )}
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Versement mensuel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Versement mensuel</Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{fmt(inputs.monthly)}</span>
                </div>
                <Slider min={0} max={500} step={50} value={[inputs.monthly]} onValueChange={([v]) => set('monthly')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 100, 200, 300].map(v => (
                    <button key={v} onClick={() => set('monthly')(v)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: inputs.monthly === v ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.monthly === v ? `1px solid ${COLOR}35` : '1px solid var(--p-line)',
                        color: inputs.monthly === v ? COLOR : 'var(--p-text-dim)' }}>
                      {v === 0 ? 'Aucun' : `${v}€`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Durée</Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.duration} ans</span>
                </div>
                <Slider min={1} max={30} step={1} value={[inputs.duration]} onValueChange={([v]) => set('duration')(v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  {[5, 10, 15, 20, 30].map(y => (
                    <button key={y} onClick={() => set('duration')(y)}
                      style={{ background: inputs.duration === y ? `${COLOR}18` : 'transparent', border: inputs.duration === y ? `1px solid ${COLOR}35` : '1px solid transparent', borderRadius: 5, padding: '2px 6px', cursor: 'pointer', color: inputs.duration === y ? COLOR : 'var(--p-text-dim)', fontSize: 10, transition: 'all 0.15s' }}>
                      {y}a
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Taux actuels */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Taux actuels 2026</p>
            {[
              { name: 'Livret A', rate: '3,00 %', cap: '22 950 €' },
              { name: 'LDDS', rate: '3,00 %', cap: '12 000 €' },
              { name: 'LEP', rate: '4,00 %', cap: '10 000 €' },
              { name: 'CEL', rate: '2,00 %', cap: '15 300 €' },
            ].map(l => (
              <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{l.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{l.rate}</span>
                  <span style={{ fontSize: 10, color: 'var(--p-text-faint)', marginLeft: 6 }}>max {l.cap}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Mini résumé */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Résumé</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Capital investi', value: fmt(totalInvested), color: 'var(--p-text-em)' },
                { label: `Meilleur livret (${bestLivret.name})`, value: fmt(bestLivret.final), color: COLOR },
                { label: 'Intérêts nets', value: `+${fmt(bestLivret.interest)}`, color: COLOR },
                { label: 'ETF 7% net', value: fmt(r.etfNetFinal), color: '#818cf8' },
                { label: 'Manque à gagner', value: fmt(r.opportunity), color: '#f87171' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: KPIs + tableau comparatif + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Meilleur livret', value: fmt(bestLivret.final), sub: `${bestLivret.name} · ${bestLivret.rate}%/an`, color: COLOR },
              { label: 'ETF 7% net', value: fmt(r.etfNetFinal), sub: 'Flat Tax 30%', color: 'var(--p-text)' },
              { label: 'Manque à gagner', value: fmt(r.opportunity), sub: 'vs ETF', color: 'var(--p-text)' },
              { label: 'Intérêts livret', value: fmt(bestLivret.interest), sub: 'exonérés IR+PS', color: 'var(--p-text)' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--p-text-dim)', margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Tableau comparatif */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Comparaison à {inputs.duration} ans</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Tous les livrets réglementés + ETF</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--p-line)', background: 'var(--p-row-hover)' }}>
                  {['Produit', 'Taux net', 'Plafond', 'Valeur finale', 'Intérêts'].map((h, i) => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i === 0 ? 'left' : 'right', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.livrets.map(l => (
                  <tr key={l.name} style={{ borderBottom: '1px solid var(--p-line)', background: l.name === bestLivret.name ? `${COLOR}06` : 'transparent' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--p-text-em)', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PiggyBank style={{ width: 14, height: 14, color: COLOR }} />
                        {l.name}
                        {l.isCapped && <span style={{ fontSize: 9, color: '#fb923c', background: 'rgba(251,146,60,0.12)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PLAFONNÉ</span>}
                        {l.name === bestLivret.name && <span style={{ fontSize: 9, color: COLOR, background: `${COLOR}18`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>MEILLEUR</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: COLOR, fontWeight: 700, textAlign: 'right' }}>{l.rate}%</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--p-text-dim)', textAlign: 'right' }}>{fmt(l.cap)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: 'var(--p-text)', letterSpacing: '-0.02em', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(l.final)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: '#34d399', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>+{fmt(l.interest)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(129,140,248,0.06)', borderBottom: '1px solid var(--p-line)' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--p-text-em)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp style={{ width: 14, height: 14, color: '#818cf8' }} />
                      ETF World (7% brut)
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#818cf8', fontWeight: 700, textAlign: 'right' }}>4,9% net</td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--p-text-faint)', textAlign: 'right' }}>Illimité</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 800, color: '#818cf8', letterSpacing: '-0.02em', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.etfNetFinal)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: '#818cf8', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>+{fmt(r.etfNetFinal - totalInvested)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Évolution comparative */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--p-line)', marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Évolution comparative</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Livret A · LEP · ETF sur {inputs.duration} ans</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v.toString()} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: chart.tick }} />
                <Line type="monotone" dataKey="livretA" name="Livret A" stroke={COLOR} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lep" name="LEP" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="etf" name="ETF net" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: analyse + bar chart intérêts + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse gain réel */}
          <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${COLOR}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PiggyBank style={{ width: 14, height: 14, color: COLOR }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Analyse du rendement</p>
                <p style={{ fontSize: 11, color: COLOR, margin: 0 }}>Meilleur : {bestLivret.name} à {bestLivret.rate}%</p>
              </div>
            </div>

            {/* Barre répartition */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--p-row-hover)', marginBottom: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', transition: 'width 0.5s', width: `${totalInvested / bestLivret.final * 100}%` }} />
                <div style={{ background: COLOR, transition: 'width 0.5s', width: `${bestLivret.interest / bestLivret.final * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['rgba(255,255,255,0.3)', `Capital ${Math.round(totalInvested / bestLivret.final * 100)}%`], [COLOR, `Intérêts ${Math.round(bestLivret.interest / bestLivret.final * 100)}%`]].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block', flexShrink: 0 }} />{label}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, margin: 0 }}>
              Le {bestLivret.name} vous rapporte {fmt(bestLivret.interest)} d&apos;intérêts nets sur {inputs.duration} ans, totalement exonérés d&apos;impôts. L&apos;ETF génère {fmt(r.opportunity)} de plus, mais avec un risque de perte en capital.
            </p>
          </div>

          {/* Comparatif intérêts par produit */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 12px' }}>Intérêts générés par produit</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: chart.tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Bar dataKey="intérêts" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conseils */}
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
        </div>

      </div>
    </div>
  )
}

export default function LivretsPage() {
  return <Suspense><LivretsPageInner /></Suspense>
}
