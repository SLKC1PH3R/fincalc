'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
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

const COLOR = '#38bdf8'

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
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
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>DCA</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Dollar Cost Averaging · Investissement régulier</p>
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {guidedMode && (
        <GuidedModePanel
          steps={[
            { question: 'Combien investissez-vous chaque mois ?', hint: 'Votre versement régulier, quel que soit le prix du marché. La régularité est l\'essence du DCA — même 100 €/mois fait une vraie différence.', ref: 'Recommandé : 10-20% du salaire net. Commencez petit et augmentez progressivement.', suffix: '€/mois', value: inputs.monthly, onChange: v => set('monthly')(v) },
            { type: 'slider', question: 'Sur quelle durée voulez-vous investir ?', hint: 'Plus l\'horizon est long, plus le DCA lisse les variations. L\'essentiel est de ne pas interrompre les versements lors des baisses.', ref: 'Sur 20 ans à 8%, 500 €/mois → ~295 000 €. Sur 30 ans → ~680 000 €. Chaque année compte.', suffix: ' ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
            { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'Rendement moyen attendu. Sur un ETF World diversifié, la moyenne historique est ~8%/an — mais rien n\'est garanti.', ref: 'MSCI World : ~8 %/an depuis 1970. Soyez prudent : une hypothèse à 5-6% vous réserve de bonnes surprises.', suffix: '%', value: inputs.targetRate, onChange: v => set('targetRate')(v), min: 1, max: 15, stepSize: 0.5 },
            { question: 'Avez-vous déjà un capital de départ ?', hint: 'Montant déjà investi ou que vous placez d\'un coup au départ. Mettez 0 si vous partez de zéro.', ref: 'Même 5 000 € de départ à 8%/an valent ~109 000 € au bout de 30 ans — sans rien ajouter.', suffix: '€', value: inputs.startingCapital ?? 0, onChange: v => set('startingCapital')(v) },
          ] satisfies GuidedStep[]}
          currentStep={guidedStep}
          onStepChange={setGuidedStep}
          onFinish={() => setGuidedMode(false)}
        />
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Left — Input panel */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
            <ProfileFillButton onFill={p => {
              if (p.monthlySavings) set('monthly')(p.monthlySavings)
              if (p.currentAssets)  set('startingCapital')(p.currentAssets)
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Versement mensuel<FieldTooltip text="Montant investi chaque mois, quel que soit le prix du marché. La régularité est l'essence du DCA." /></Label>
            <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Durée<FieldTooltip text="Le DCA est surtout efficace sur 10+ ans — la volatilité se lisse sur la durée." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
            </div>
            <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Rendement annuel moyen<FieldTooltip text="Rendement attendu à long terme. ETF MSCI World : ~8% historique sur 30 ans." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.targetRate}%</span>
            </div>
            <Slider min={1} max={20} step={0.5} value={[inputs.targetRate]} onValueChange={([v]) => set('targetRate')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Volatilité annuelle<FieldTooltip text="Amplitude des fluctuations de prix. ETF World : ~15%. Actions individuelles : 25-40%. Plus la volatilité est haute, plus le DCA est avantageux vs achat unique." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.volatility}%</span>
            </div>
            <Slider min={0} max={50} step={1} value={[inputs.volatility]} onValueChange={([v]) => set('volatility')(v)} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(5)}>Obligations 5%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(15)}>ETF World 15%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('volatility')(30)}>Actions 30%</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Prix initial de l'actif<FieldTooltip text="Prix unitaire au départ. Ex: 100€ pour un ETF. Influence le prix moyen de revient calculé." /></Label>
            <Input type="number" value={inputs.initialPrice} onChange={e => set('initialPrice')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Capital de départ<FieldTooltip text="Montant déjà investi au lancement de la simulation. Permet de partir de votre patrimoine existant." /></Label>
              <button
                onClick={importPatrimoine}
                disabled={loadingPatrimoine}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Wallet style={{ width: 12, height: 12 }} />
                {loadingPatrimoine ? 'Chargement…' : 'Importer patrimoine'}
              </button>
            </div>
            <Input type="number" value={inputs.startingCapital ?? 0} onChange={e => set('startingCapital')(+e.target.value)} placeholder="0" />
          </div>

          {/* Mini stats summary */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Parts accumulées', value: r.units.toFixed(2) },
              { label: 'Prix moyen de revient', value: fmt(r.avgCostBasis) },
              { label: 'Gain total', value: `${fmt(r.gain)} (+${r.gainPct.toFixed(1)}%)` },
            ].map((k, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{k.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* KPI 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px', gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Valeur finale</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.estimatedValue)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Capital investi</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.totalInvested)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Gain total</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: r.gain > 0 ? '#34d399' : 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.gain)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Rendement</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: r.gainPct > 0 ? '#34d399' : 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{r.gainPct.toFixed(1)}%</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Évolution du portefeuille — {inputs.years} ans</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => `${Math.round(v/12)}a`} />
                <YAxis tick={{ fontSize: 10, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any, name: string) => [name === 'price' ? `${v}€` : fmt(v), name === 'value' ? 'Valeur' : name === 'invested' ? 'Investi' : 'Prix']}
                  contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="value" name="Valeur portefeuille" stroke={chart.lineMain} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="invested" name="Capital investi" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <CsvExport
                data={r.chartData.filter((_: any, i: number) => i % 12 === 0).map((d: any) => ({ 'Année': Math.round(d.month / 12), 'Capital investi': d.invested.toFixed(0), 'Valeur portefeuille': d.value.toFixed(0), 'Gain': (d.value - d.invested).toFixed(0) }))}
                filename="dca.csv"
              />
            </div>
          </div>

          {/* Tips box */}
          <div style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp style={{ width: 14, height: 14, color: '#f1c086' }} />
              <p style={{ fontSize: 12, color: 'rgba(241,192,134,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analyse DCA</p>
            </div>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Info style={{ width: 14, height: 14, color: 'var(--text-muted-c)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Comparateur A/B ── */}
      {compareMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--card-dark-border)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Scénario A vs Scénario B côte à côte</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {([
              { label: 'Scénario A', color: '#f1c086', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ] as const).map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--card-dark)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'monthly' as keyof DCAInputs, label: 'Versement mensuel (€)', type: 'input', min: 0, max: 10000, step: 100 },
                    { key: 'years' as keyof DCAInputs, label: `Durée : ${inp.years} ans`, type: 'slider', min: 1, max: 40, step: 1 },
                    { key: 'targetRate' as keyof DCAInputs, label: `Rendement : ${inp.targetRate}%`, type: 'slider', min: 1, max: 15, step: 0.5 },
                    { key: 'startingCapital' as keyof DCAInputs, label: 'Capital de départ (€)', type: 'input', min: 0, max: 1000000, step: 1000 },
                  ]).map(({ key, label: l, type: ft, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 6 }}>{l}</div>
                      {ft === 'input'
                        ? <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 34, fontSize: 13 }} />
                        : <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Valeur finale A', value: fmt(r.estimatedValue), color: '#f1c086' },
              { label: 'Valeur finale B', value: fmt(rB.estimatedValue), color: '#818cf8' },
              { label: 'Différence', value: fmt(Math.abs(rB.estimatedValue - r.estimatedValue)), color: rB.estimatedValue > r.estimatedValue ? '#34d399' : '#f87171' },
              { label: 'B vs A', value: `${rB.estimatedValue >= r.estimatedValue ? '+' : ''}${((rB.estimatedValue - r.estimatedValue) / (r.estimatedValue || 1) * 100).toFixed(1)}%`, color: rB.estimatedValue > r.estimatedValue ? '#34d399' : '#f87171' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Évolution comparée</p>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickFormatter={(v: number) => `${Math.round(v/12)}a`} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickFormatter={(v: number) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                    <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scénario A" stroke="#f1c086" strokeWidth={2.5} dot={false} animationDuration={800} />
                    <Line type="monotone" dataKey="Scénario B" stroke="#818cf8" strokeWidth={2.5} dot={false} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default function DCAPage() { return <Suspense><DCAPageInner /></Suspense> }
