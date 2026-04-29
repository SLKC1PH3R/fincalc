'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcDCA, type DCAInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, TrendingUp, Info, Wallet, BookOpen, Settings2, GitCompare, RefreshCw } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'

const COLOR = '#60a5fa'

function DCAPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<DCAInputs>({ monthly: 500, years: 15, targetRate: 8, volatility: 15, initialPrice: 100, startingCapital: 0 })
  const set = (k: keyof DCAInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [loadingPatrimoine, setLoadingPatrimoine] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [compareMode, setCompareMode] = useState(false)
  const [inputsB, setInputsB] = useState<DCAInputs>({ monthly: 800, years: 15, targetRate: 8, volatility: 15, initialPrice: 100, startingCapital: 0 })
  const setB = (k: keyof DCAInputs) => (v: number) => setInputsB(p => ({ ...p, [k]: v }))
  const rB = useMemo(() => calcDCA(inputsB), [inputsB])

  const importPatrimoine = async () => {
    setLoadingPatrimoine(true)
    try {
      const res = await fetch('/api/patrimoine/envelopes')
      if (!res.ok) return
      const data: { type: string; totalValue: number | null; metadata: Record<string, unknown>; positions: { pru: number; quantity: number }[] }[] = await res.json()
      const total = data.reduce((s, e) => {
        if (e.type === 'IMMOBILIER') return s + Number(e.metadata.currentValue ?? 0)
        const v = e.totalValue ?? e.positions.reduce((ps, p) => ps + p.pru * p.quantity, 0)
        return s + v
      }, 0)
      setInputs(p => ({ ...p, startingCapital: Math.round(total) }))
    } finally {
      setLoadingPatrimoine(false)
    }
  }

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.rate !== undefined && p.targetRate === undefined) p.targetRate = p.rate
      if (p.volatility === undefined) p.volatility = 15
      if (p.initialPrice === undefined) p.initialPrice = 100
      setInputs(p as DCAInputs)
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcDCA(inputs), [inputs])

  const tips = [
    `Sur ${inputs.years} ans, le DCA vous permet d'acheter plus de parts quand les prix baissent et moins quand ils montent, réduisant votre prix moyen de revient à ${fmt(r.avgCostBasis)} par part.`,
    r.vsLumpSum >= 0 ? `Avec une volatilité de ${inputs.volatility}%, le DCA surperforme l'achat unique de ${fmt(r.vsLumpSum)} grâce au lissage des prix.` : `Avec une faible volatilité (${inputs.volatility}%), l'achat unique surperforme de ${fmt(Math.abs(r.vsLumpSum))} — logique car les prix montent régulièrement.`,
    'Le DCA est surtout une stratégie psychologique : il élimine le stress du timing de marché et favorise la discipline sur le long terme.',
  ]

  // Table annuelle (jalons)
  const annualTable = useMemo(() => {
    return r.chartData.filter((_: any, i: number) => i % 12 === 0).map((d: any) => ({
      year: Math.round(d.month / 12),
      invested: d.invested,
      value: d.value,
      gain: d.value - d.invested,
    }))
  }, [r])

  // Donut versements vs intérêts
  const donutData = [
    { name: 'Capital versé', value: r.totalInvested, color: COLOR },
    { name: 'Intérêts', value: Math.max(r.gain, 0), color: '#34d399' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Combien investissez-vous chaque mois ?', hint: 'Votre versement régulier, quel que soit le prix du marché.', ref: 'Recommandé : 10-20% du salaire net.', suffix: '€/mois', value: inputs.monthly, onChange: v => set('monthly')(v) },
    { type: 'slider', question: 'Sur quelle durée voulez-vous investir ?', hint: 'Plus l\'horizon est long, plus le DCA lisse les variations.', ref: 'Sur 20 ans à 8%, 500 €/mois → ~295 000 €.', suffix: ' ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
    { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'Rendement moyen attendu. ETF World : ~8%/an historique.', ref: 'MSCI World : ~8 %/an depuis 1970. Soyez prudent : une hypothèse à 5-6% vous réserve de bonnes surprises.', suffix: '%', value: inputs.targetRate, onChange: v => set('targetRate')(v), min: 1, max: 15, stepSize: 0.5 },
    { question: 'Avez-vous déjà un capital de départ ?', hint: 'Montant déjà investi ou que vous placez d\'un coup au départ.', ref: 'Même 5 000 € de départ à 8%/an valent ~109 000 € au bout de 30 ans.', suffix: '€', value: inputs.startingCapital ?? 0, onChange: v => set('startingCapital')(v) },
  ]

  return (
    <div style={{ padding: '20px 24px 48px', background: 'var(--p-bg)', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>DCA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>DCA</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Dollar Cost Averaging · Investissement régulier</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'DCA — Investissement Régulier',
              subtitle: `${fmt(inputs.monthly)}/mois · ${inputs.years} ans · ${inputs.targetRate}% de rendement`,
              kpis: [
                { label: 'Valeur estimée', value: fmt(r.estimatedValue), highlight: true },
                { label: 'Total investi', value: fmt(r.totalInvested) },
                { label: 'Gain total', value: fmt(r.gain) },
                { label: 'vs Achat unique', value: `${r.vsLumpSum >= 0 ? '+' : ''}${fmt(r.vsLumpSum)}` },
              ],
              inputs: [
                { label: 'Versement mensuel', value: fmt(inputs.monthly) },
                { label: 'Durée', value: `${inputs.years} ans` },
                { label: 'Rendement annuel', value: `${inputs.targetRate}%` },
                { label: 'Volatilité', value: `${inputs.volatility}%` },
                { label: 'Prix initial unitaire', value: fmt(inputs.initialPrice) },
              ],
              sections: [{ title: 'Résultats détaillés', items: [
                { label: 'Gain total', value: fmtPct(r.gainPct) },
                { label: 'Prix moyen acquisition', value: fmt(r.avgCostBasis) },
                { label: 'Unités accumulées', value: r.units.toFixed(2) },
              ]}],
              tips: [
                'Le DCA lisse le prix moyen d\'achat en investissant régulièrement, réduisant l\'impact de la volatilité.',
                'Sur le long terme, le DCA peut surperformer l\'achat unique en cas de forte volatilité.',
                'La discipline est clé : évitez d\'interrompre vos versements lors des baisses de marché.',
              ],
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="dca" name={`DCA ${fmt(inputs.monthly)}/mois × ${inputs.years}ans`} inputs={inputs as any} results={r as any} />
            <Button variant={compareMode ? 'default' : 'outline'} size="sm"
              onClick={() => { setCompareMode(v => !v); if (!compareMode) setInputsB({ ...inputs, monthly: Math.round(inputs.monthly * 1.5) }) }}
              style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
            </Button>
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
              onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
              style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => setInputs({ monthly: 500, years: 15, targetRate: 8, volatility: 15, initialPrice: 100, startingCapital: 0 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginTop: 16 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {/* 3-column grid */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Paramètres */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw style={{ width: 12, height: 12, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.monthlySavings) set('monthly')(p.monthlySavings)
                  if (p.currentAssets) set('startingCapital')(p.currentAssets)
                }} />
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Versement mensuel<FieldTooltip text="Montant investi chaque mois, quel que soit le prix du marché. La régularité est l'essence du DCA." />
                  </label>
                  <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Durée<FieldTooltip text="Le DCA est surtout efficace sur 10+ ans — la volatilité se lisse sur la durée." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{inputs.years} ans</span>
                  </div>
                  <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Rendement annuel<FieldTooltip text="Rendement attendu à long terme. ETF MSCI World : ~8% historique sur 30 ans." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{inputs.targetRate}%</span>
                  </div>
                  <Slider min={1} max={20} step={0.5} value={[inputs.targetRate]} onValueChange={([v]) => set('targetRate')(v)} />
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Volatilité annuelle<FieldTooltip text="Amplitude des fluctuations. ETF World : ~15%. Plus la volatilité est haute, plus le DCA est avantageux vs achat unique." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>{inputs.volatility}%</span>
                  </div>
                  <Slider min={0} max={50} step={1} value={[inputs.volatility]} onValueChange={([v]) => set('volatility')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(5)}>Obligations 5%</button>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(15)}>ETF 15%</button>
                    <button style={{ fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(30)}>Actions 30%</button>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--p-line)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Capital de départ<FieldTooltip text="Montant déjà investi au lancement de la simulation." />
                    </label>
                    <button
                      onClick={importPatrimoine}
                      disabled={loadingPatrimoine}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Wallet style={{ width: 12, height: 12 }} />
                      {loadingPatrimoine ? 'Chargement…' : 'Importer'}
                    </button>
                  </div>
                  <Input type="number" value={inputs.startingCapital ?? 0} onChange={e => set('startingCapital')(+e.target.value)} placeholder="0" style={{ height: 36, fontSize: 13 }} />
                </div>
              </div>
            </div>

            {/* Mini-résumé */}
            <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
              {[
                { label: 'Parts accumulées', value: r.units.toFixed(2) },
                { label: 'Prix moyen revient', value: fmt(r.avgCostBasis) },
                { label: 'vs Achat unique', value: `${r.vsLumpSum >= 0 ? '+' : ''}${fmt(r.vsLumpSum)}` },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 8 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{k.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Capital final', value: fmt(r.estimatedValue), color: COLOR },
                { label: 'Total versé', value: fmt(r.totalInvested), color: 'var(--p-text)' },
                { label: 'Intérêts générés', value: fmt(r.gain), color: r.gain > 0 ? '#34d399' : 'var(--p-text)' },
                { label: 'Rendement total', value: `${r.gainPct.toFixed(1)}%`, color: r.gainPct > 0 ? '#34d399' : 'var(--p-text)' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 4, letterSpacing: '0.04em' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Chart capital versé vs valeur */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 12 }}>Évolution du portefeuille — {inputs.years} ans</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => `${Math.round(v / 12)}a`} />
                  <YAxis tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: any, name: string) => [fmt(v), name === 'value' ? 'Valeur' : 'Investi']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="value" name="Valeur portefeuille" stroke={COLOR} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invested" name="Capital investi" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <CsvExport
                  data={annualTable.map(d => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur portefeuille': d.value.toFixed(0), 'Gain': d.gain.toFixed(0) }))}
                  filename="dca.csv"
                />
              </div>
            </div>

            {/* Table par an */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--p-line)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Tableau par année</p>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Année', 'Capital versé', 'Valeur', 'Gain'].map((h, i) => (
                        <th key={i} style={{ padding: '7px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 500, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--p-line)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {annualTable.filter(d => d.year > 0 && d.year % 5 === 0).map(d => (
                      <tr key={d.year} style={{ borderBottom: '1px solid var(--p-line)' }}>
                        <td style={{ padding: '7px 12px', color: 'var(--p-text-em)', fontWeight: 500 }}>{d.year} ans</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.invested)}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.gain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Analyse */}
            <div style={{ background: 'var(--p-card)', border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 15, height: 15, color: COLOR }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Analyse DCA</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 8 }}>
                Sur {inputs.years} ans à {inputs.targetRate}%/an, vos {fmt(inputs.monthly)}/mois génèrent <strong style={{ color: COLOR }}>{fmt(r.estimatedValue)}</strong> — soit {r.gainPct.toFixed(0)}% de plus que votre mise initiale.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>DCA vs Achat unique</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.vsLumpSum >= 0 ? '#34d399' : '#f87171' }}>
                  {r.vsLumpSum >= 0 ? '+' : ''}{fmt(r.vsLumpSum)}
                </span>
              </div>
            </div>

            {/* Donut versements/intérêts */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 10 }}>Composition du capital final</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={160} height={120}>
                  <Pie data={donutData} cx={80} cy={60} innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} />
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-em)' }}>{fmt(d.value)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Total final</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLOR }}>{fmt(r.estimatedValue)}</span>
                </div>
              </div>
            </div>

            {/* Conseils DCA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: `${COLOR}07`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info style={{ width: 13, height: 13, color: 'var(--p-text-dim)', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparateur A/B */}
      {compareMode && !guidedMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--p-line)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text)', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>Scénario A vs Scénario B côte à côte</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {([
              { label: 'Scénario A', color: '#B07820', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ] as const).map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--p-card)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'monthly' as keyof DCAInputs, label: 'Versement mensuel (€)', type: 'input', min: 0, max: 10000, step: 100 },
                    { key: 'years' as keyof DCAInputs, label: `Durée : ${inp.years} ans`, type: 'slider', min: 1, max: 40, step: 1 },
                    { key: 'targetRate' as keyof DCAInputs, label: `Rendement : ${inp.targetRate}%`, type: 'slider', min: 1, max: 15, step: 0.5 },
                    { key: 'startingCapital' as keyof DCAInputs, label: 'Capital de départ (€)', type: 'input', min: 0, max: 1000000, step: 1000 },
                  ]).map(({ key, label: l, type: ft, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: 'var(--p-text-dim)', marginBottom: 6 }}>{l}</div>
                      {ft === 'input'
                        ? <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 34, fontSize: 13 }} />
                        : <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Valeur finale A', value: fmt(r.estimatedValue), color: '#B07820' },
              { label: 'Valeur finale B', value: fmt(rB.estimatedValue), color: '#818cf8' },
              { label: 'Différence', value: fmt(Math.abs(rB.estimatedValue - r.estimatedValue)), color: rB.estimatedValue > r.estimatedValue ? '#34d399' : '#f87171' },
              { label: 'B vs A', value: `${rB.estimatedValue >= r.estimatedValue ? '+' : ''}${((rB.estimatedValue - r.estimatedValue) / (r.estimatedValue || 1) * 100).toFixed(1)}%`, color: rB.estimatedValue > r.estimatedValue ? '#34d399' : '#f87171' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)', marginBottom: 16 }}>Évolution comparée</p>
            {(() => {
              const yearsMax = Math.max(inputs.years, inputsB.years)
              const dataA = calcDCA({ ...inputs, years: yearsMax }).chartData
              const dataB = calcDCA({ ...inputsB, years: yearsMax }).chartData
              const merged = dataA.filter((_: unknown, i: number) => i % 3 === 0).map((pt: { month: number; value: number; invested: number }, i: number) => ({
                month: pt.month,
                'Scénario A': pt.value,
                'Scénario B': dataB[i * 3]?.value ?? 0,
              }))
              return (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={merged} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--p-line)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--p-text-faint)' }} tickFormatter={(v: number) => `${Math.round(v / 12)}a`} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--p-text-faint)' }} tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scénario A" stroke="#B07820" strokeWidth={2.5} dot={false} animationDuration={800} />
                    <Line type="monotone" dataKey="Scénario B" stroke="#818cf8" strokeWidth={2.5} dot={false} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DCAPage() { return <Suspense><DCAPageInner /></Suspense> }
