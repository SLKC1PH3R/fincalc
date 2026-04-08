'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcFeesImpact, type FeesImpactInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, TrendingDown, Settings2 } from 'lucide-react'

const COLOR = '#fb923c'

function FeesPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<FeesImpactInputs>({
    capital: 10000, monthly: 200, grossRate: 7, feeA: 0.2, feeB: 2.0, years: 20,
  })
  const set = (k: keyof FeesImpactInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcFeesImpact(inputs), [inputs])

  const tips: string[] = []
  tips.push(`Avec ${inputs.feeB}% de frais annuels, vous perdez ${r.pctLostB.toFixed(1)}% de votre capital potentiel sur ${inputs.years} ans — soit ${fmt(r.difference)} de différence.`)
  if (inputs.feeB > 1.5) tips.push('Les fonds actifs affichent souvent 1.5–2.5% de frais. La majorité sous-performe leur indice de référence sur 15 ans.')
  tips.push(`Un ETF MSCI World (ex: Amundi CW8) facture ~0.12–0.38%/an. La règle d'or : chaque 1% de frais = ~15–20% de capital en moins sur 20 ans.`)
  if (inputs.grossRate > 5) tips.push('L\'effet des frais est amplifié par un rendement élevé — plus votre capital est performant, plus les frais vous coûtent cher en valeur absolue.')

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Impact des Frais</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingDown style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Impact des Frais</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>ETF 0.2% vs fonds actif 2% · Effet sur 20 ans</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'Impact des Frais de Gestion',
              subtitle: `${fmt(inputs.capital)} · ${inputs.grossRate}% brut · ${inputs.years} ans`,
              kpis: [
                { label: `Scénario A (${inputs.feeA}%)`, value: fmt(r.finalA), highlight: true },
                { label: `Scénario B (${inputs.feeB}%)`, value: fmt(r.finalB) },
                { label: 'Différence', value: fmt(r.difference) },
                { label: 'Capital perdu (B)', value: `${r.pctLostB.toFixed(1)}%` },
              ],
              inputs: [
                { label: 'Capital initial', value: fmt(inputs.capital) },
                { label: 'Versement mensuel', value: fmt(inputs.monthly) },
                { label: 'Rendement brut', value: `${inputs.grossRate}%` },
                { label: 'Frais ETF (A)', value: `${inputs.feeA}%` },
                { label: 'Frais fonds (B)', value: `${inputs.feeB}%` },
                { label: 'Durée', value: `${inputs.years} ans` },
              ],
              tips,
            })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="frais" name={`Frais ${inputs.feeA}% vs ${inputs.feeB}% · ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Carte Paramètres */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Settings2 style={{ width: 13, height: 13, color: COLOR }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Capital initial', k: 'capital' as const, min: 1000, max: 200000, step: 1000, fmt: (v: number) => fmt(v) },
                { label: 'Versement mensuel', k: 'monthly' as const, min: 0, max: 2000, step: 100, fmt: (v: number) => `${v} €` },
                { label: 'Rendement brut', k: 'grossRate' as const, min: 3, max: 15, step: 0.5, fmt: (v: number) => `${v}%` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.fmt(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {[
                { label: 'Frais ETF (A)', k: 'feeA' as const, min: 0.05, max: 1, step: 0.05, fmt: (v: number) => `${v}%` },
                { label: 'Frais fonds actif (B)', k: 'feeB' as const, min: 0.5, max: 4, step: 0.25, fmt: (v: number) => `${v}%` },
                { label: 'Durée', k: 'years' as const, min: 5, max: 40, step: 1, fmt: (v: number) => `${v} ans` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.fmt(inputs[s.k])}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k]]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Presets courants</p>
                {[
                  { label: 'ETF MSCI World', feeA: 0.2, feeB: 1.5 },
                  { label: 'ETF vs OPCVM', feeA: 0.35, feeB: 2.5 },
                ].map(p => (
                  <button key={p.label} onClick={() => setInputs(prev => ({ ...prev, feeA: p.feeA, feeB: p.feeB }))}
                    style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', textAlign: 'left' }}>
                    {p.label} — A:{p.feeA}% / B:{p.feeB}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mini-résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Résumé rapide</p>
            {[
              { label: `ETF ${inputs.feeA}%`, value: fmt(r.finalA), color: COLOR },
              { label: `Fonds ${inputs.feeB}%`, value: fmt(r.finalB), color: '#f87171' },
              { label: 'Économie ETF', value: fmt(r.difference), color: '#34d399' },
              { label: 'Perte frais B', value: `${r.pctLostB.toFixed(1)}%`, color: '#fb923c' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — KPIs + chart + table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
              <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>ETF {inputs.feeA}% (A)</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: COLOR, letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(r.finalA)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{(inputs.grossRate - inputs.feeA).toFixed(2)}% net</p>
            </div>
            {[
              { label: `Fonds ${inputs.feeB}% (B)`, value: fmt(r.finalB), sub: `${(inputs.grossRate - inputs.feeB).toFixed(2)}% net`, color: '#f87171' },
              { label: 'Différence A–B', value: fmt(r.difference), sub: 'économisé avec ETF', color: '#34d399' },
              { label: 'Capital perdu en frais B', value: `${r.pctLostB.toFixed(1)}%`, sub: 'du potentiel brut', color: '#fb923c' },
            ].map(k => (
              <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Chart principal */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Divergence des deux scénarios sur {inputs.years} ans</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="a" name={`Scénario A (${inputs.feeA}%)`} stroke={COLOR} fill={`${COLOR}18`} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="b" name={`Scénario B (${inputs.feeB}%)`} stroke="#f87171" fill="rgba(248,113,113,0.10)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Résultats comparés — barres */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Résultats comparés à {inputs.years} ans</p>
            {[
              { label: `Scénario A — ETF ${inputs.feeA}%/an`, value: r.finalA, color: COLOR, pct: 100 },
              { label: `Scénario B — Fonds ${inputs.feeB}%/an`, value: r.finalB, color: '#f87171', pct: r.finalA > 0 ? r.finalB / r.finalA * 100 : 0 },
              { label: 'Rendement brut (sans frais)', value: r.grossFinal, color: 'rgba(255,255,255,0.3)', pct: r.finalA > 0 ? r.grossFinal / r.finalA * 100 : 0 },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: row.color }}>{fmt(row.value)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(row.pct, 100)}%`, borderRadius: 3, background: row.color, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — analyse + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Analyse</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: `${COLOR}0a`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Impact frais B sur {inputs.years} ans</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#f87171', letterSpacing: '-0.5px' }}>{r.pctLostB.toFixed(1)}%</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>du capital brut absorbé par les frais</p>
              </div>
              {[
                { label: 'Coût annuel frais A', value: `~${fmt(Math.round(inputs.capital * inputs.feeA / 100))}` },
                { label: 'Coût annuel frais B', value: `~${fmt(Math.round(inputs.capital * inputs.feeB / 100))}` },
                { label: 'Surcoût annuel B vs A', value: `~${fmt(Math.round(inputs.capital * (inputs.feeB - inputs.feeA) / 100))}` },
                { label: 'Rendement net A', value: `${(inputs.grossRate - inputs.feeA).toFixed(2)}%` },
                { label: 'Rendement net B', value: `${(inputs.grossRate - inputs.feeB).toFixed(2)}%` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ETF vs Fonds actifs — comparaison type */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Frais typiques par catégorie</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'ETF indiciel', pct: 0.15, max: 4, color: COLOR },
                { label: 'ETF smart beta', pct: 0.35, max: 4, color: COLOR },
                { label: 'OPCVM actif (entrée)', pct: 1.5, max: 4, color: '#fb923c' },
                { label: 'OPCVM actif (haut)', pct: 2.5, max: 4, color: '#f87171' },
                { label: 'Fonds PE / FCPI', pct: 3.5, max: 4, color: '#f87171' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.pct}%/an</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(row.pct / row.max) * 100}%`, borderRadius: 2, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 14px', animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>✦</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function FeesPage() {
  return <Suspense><FeesPageInner /></Suspense>
}
