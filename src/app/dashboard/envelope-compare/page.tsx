'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcEnvelopeCompare, type EnvelopeCompareInputs, type EnvelopeResult } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Trophy, ArrowRight, Info, Download, RotateCcw, Landmark, Settings2, BookOpen } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'

const ENVELOPE_META = {
  pea: { label: 'PEA', color: '#818cf8', desc: 'Exonération IR après 5 ans · Plafond 150 000€' },
  cto: { label: 'CTO', color: '#38bdf8', desc: 'Flat Tax 30% sur les gains · Pas de plafond' },
  av:  { label: 'Assurance-vie', color: '#fb923c', desc: 'Abattement 4 600€/9 200€ après 8 ans · Taux 7,5%' },
}

const DEFAULT_INPUTS: EnvelopeCompareInputs = {
  capital: 10000, monthly: 300, rateGross: 7, years: 20, tmi: 30, isCouple: false, peaOpenYears: 0,
}

const COLOR = '#34d399'

function EnvelopeCompareInner() {
  const params = useSearchParams()
  const chartTheme = useChartTheme()

  const [capital, setCapital] = useState(DEFAULT_INPUTS.capital)
  const [monthly, setMonthly] = useState(DEFAULT_INPUTS.monthly)
  const [rateGross, setRateGross] = useState(DEFAULT_INPUTS.rateGross)
  const [years, setYears] = useState(DEFAULT_INPUTS.years)
  const [tmi, setTmi] = useState(DEFAULT_INPUTS.tmi)
  const [isCouple, setIsCouple] = useState(DEFAULT_INPUTS.isCouple)
  const [peaOpenYears, setPeaOpenYears] = useState(DEFAULT_INPUTS.peaOpenYears)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  useEffect(() => {
    const r = params.get('restore')
    if (!r) return
    try {
      const inp = JSON.parse(r) as EnvelopeCompareInputs
      setCapital(inp.capital ?? DEFAULT_INPUTS.capital)
      setMonthly(inp.monthly ?? DEFAULT_INPUTS.monthly)
      setRateGross(inp.rateGross ?? DEFAULT_INPUTS.rateGross)
      setYears(inp.years ?? DEFAULT_INPUTS.years)
      setTmi(inp.tmi ?? DEFAULT_INPUTS.tmi)
      setIsCouple(inp.isCouple ?? DEFAULT_INPUTS.isCouple)
      setPeaOpenYears(inp.peaOpenYears ?? DEFAULT_INPUTS.peaOpenYears)
    } catch {}
  }, [params])

  const inputs: EnvelopeCompareInputs = useMemo(() => ({
    capital, monthly, rateGross, years, tmi, isCouple, peaOpenYears,
  }), [capital, monthly, rateGross, years, tmi, isCouple, peaOpenYears])

  const res = useMemo(() => calcEnvelopeCompare(inputs), [inputs])

  const handleReset = () => {
    setCapital(DEFAULT_INPUTS.capital)
    setMonthly(DEFAULT_INPUTS.monthly)
    setRateGross(DEFAULT_INPUTS.rateGross)
    setYears(DEFAULT_INPUTS.years)
    setTmi(DEFAULT_INPUTS.tmi)
    setIsCouple(DEFAULT_INPUTS.isCouple)
    setPeaOpenYears(DEFAULT_INPUTS.peaOpenYears)
  }

  const guidedSteps: GuidedStep[] = [
    {
      question: 'Quel est votre capital initial à investir ?',
      hint: 'Montant de départ que vous souhaitez placer dans l\'enveloppe.',
      ref: 'capital', type: 'number', suffix: '€',
      value: capital, onChange: setCapital,
    },
    {
      question: 'Quel versement mensuel prévoyez-vous ?',
      hint: 'Montant versé chaque mois en plus du capital initial.',
      ref: 'monthly', type: 'number', suffix: '€',
      value: monthly, onChange: setMonthly,
    },
    {
      question: 'Quel rendement brut annuel estimez-vous ?',
      hint: 'Un ETF monde sert historiquement 7-10% brut/an. Soyez prudent dans vos hypothèses.',
      ref: 'rateGross', type: 'number', suffix: '%',
      value: rateGross, onChange: setRateGross,
    },
    {
      question: 'Sur quelle durée souhaitez-vous comparer les enveloppes ?',
      hint: 'Le PEA et l\'AV ont des avantages fiscaux qui se révèlent sur le long terme (5 et 8 ans).',
      ref: 'years', type: 'slider', suffix: 'ans',
      value: years, onChange: setYears, min: 1, max: 40, stepSize: 1,
      displayValue: (v) => `${v} ans`,
    },
    {
      question: 'Quel est votre TMI au barème progressif ?',
      hint: 'Votre tranche marginale d\'imposition. Impacte la fiscalité du CTO.',
      ref: 'tmi', type: 'choice',
      strValue: String(tmi), onChoice: (v) => setTmi(Number(v)),
      options: [0, 11, 30, 41, 45].map(t => ({ value: String(t), label: `${t}%` })),
    },
  ]

  // Donut par enveloppe — gain net
  const donutData = (['pea', 'cto', 'av'] as const).map(k => ({
    name: ENVELOPE_META[k].label,
    value: res[k].netValue,
    color: ENVELOPE_META[k].color,
  }))

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>PEA vs CTO vs AV</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Landmark style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>PEA vs CTO vs AV</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Fiscalité des enveloppes · Comparaison sur {years} ans</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm"
              onClick={() => { setGuidedMode(g => !g); setGuidedStep(0) }}
              style={guidedMode
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' }
                : { borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />Mode guidé
            </Button>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'PEA vs CTO vs Assurance Vie',
              subtitle: `Capital ${fmt(capital)} · ${years} ans · rendement ${rateGross}%`,
              kpis: [
                { label: 'PEA net', value: fmt(res.pea.netValue), highlight: res.best === 'pea' },
                { label: 'CTO net', value: fmt(res.cto.netValue), highlight: res.best === 'cto' },
                { label: 'AV nette', value: fmt(res.av.netValue), highlight: res.best === 'av' },
              ],
              inputs: [
                { label: 'Capital initial', value: fmt(capital) },
                { label: 'Versement mensuel', value: fmt(monthly) },
                { label: 'Rendement brut', value: `${rateGross}%` },
                { label: 'Durée', value: `${years} ans` },
                { label: 'TMI', value: `${tmi}%` },
              ],
              sections: [],
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="envelope-compare" name="PEA vs CTO vs AV" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Réinitialiser
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

          {/* LEFT — sticky inputs */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings2 style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Capital initial (€)</label>
                <Input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} min={0} step={1000} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Versement mensuel (€)</label>
                <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} min={0} step={50} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                  Rendement brut annuel (%)
                  <FieldTooltip text="Rendement espéré avant fiscalité. Un ETF monde sert historiquement 7-10% brut/an." />
                </label>
                <Input type="number" value={rateGross} onChange={e => setRateGross(Number(e.target.value))} min={0} max={30} step={0.5} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Durée (années)</label>
                <Input type="number" value={years} onChange={e => setYears(Number(e.target.value))} min={1} max={50} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                  TMI (barème)
                  <FieldTooltip text="Taux Marginal d'Imposition. Utilisé pour le CTO au barème si vous l'aviez choisi." />
                </label>
                <Select value={String(tmi)} onValueChange={v => setTmi(Number(v))}>
                  <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 11, 30, 41, 45].map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                  PEA déjà ouvert depuis (ans)
                  <FieldTooltip text="Le PEA est exonéré d'IR après 5 ans d'ouverture." />
                </label>
                <Select value={String(peaOpenYears)} onValueChange={v => setPeaOpenYears(Number(v))}>
                  <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(y => <SelectItem key={y} value={String(y)}>{y} an{y > 1 ? 's' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="couple2" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#f1c086' }} />
                <label htmlFor="couple2" style={{ fontSize: 11, color: 'var(--text-muted-c)', cursor: 'pointer' }}>
                  Déclaration en couple
                  <FieldTooltip text="Abattement AV de 9 200€/an au lieu de 4 600€." />
                </label>
              </div>
            </div>

            {/* Best envelope mini-summary */}
            <div style={{ background: 'var(--card-dark)', border: `1px solid ${ENVELOPE_META[res.best].color}30`, borderRadius: 14, padding: 14 }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Meilleure enveloppe</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Trophy style={{ width: 14, height: 14, color: ENVELOPE_META[res.best].color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: ENVELOPE_META[res.best].color }}>{ENVELOPE_META[res.best].label}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(res[res.best].netValue)} net</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>taux net {res[res.best].netAnnualRate.toFixed(2)}%/an</p>
            </div>
          </div>

          {/* CENTER — KPIs 4-grid + line chart + comparative table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* KPI 4-grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'PEA net', value: fmt(res.pea.netValue), sub: `${res.pea.netAnnualRate.toFixed(2)}%/an`, color: ENVELOPE_META.pea.color, best: res.best === 'pea' },
                { label: 'CTO net', value: fmt(res.cto.netValue), sub: `${res.cto.netAnnualRate.toFixed(2)}%/an`, color: ENVELOPE_META.cto.color, best: res.best === 'cto' },
                { label: 'AV nette', value: fmt(res.av.netValue), sub: `${res.av.netAnnualRate.toFixed(2)}%/an`, color: ENVELOPE_META.av.color, best: res.best === 'av' },
                { label: 'Meilleure enveloppe', value: ENVELOPE_META[res.best].label, sub: `écart vs pire : ${fmt(Math.max(res.pea.netValue, res.cto.netValue, res.av.netValue) - Math.min(res.pea.netValue, res.cto.netValue, res.av.netValue))}`, color: ENVELOPE_META[res.best].color, best: false },
              ].map((k, i) => (
                <div key={i} style={{
                  background: k.best ? `${k.color}10` : 'var(--card-dark)',
                  border: `1px solid ${k.best ? k.color + '40' : 'var(--card-dark-border)'}`,
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Line chart — 3 courbes */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Évolution de la valeur nette sur {years} ans</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={res.chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <XAxis dataKey="year" tickFormatter={v => `${v}a`} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <YAxis tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <Tooltip
                    contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                    formatter={(v: number, name: string) => [fmt(v), ENVELOPE_META[name as 'pea' | 'cto' | 'av']?.label ?? name]}
                    labelFormatter={v => `Année ${v}`}
                  />
                  <Legend formatter={(v: string) => ENVELOPE_META[v as keyof typeof ENVELOPE_META]?.label ?? v} wrapperStyle={{ fontSize: 11, color: chartTheme.tick }} />
                  <Line type="monotone" dataKey="pea" stroke={ENVELOPE_META.pea.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cto" stroke={ENVELOPE_META.cto.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="av"  stroke={ENVELOPE_META.av.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Tableau comparatif détaillé */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Comparatif détaillé</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 1fr)' }}>
                {['', 'PEA', 'CTO', 'AV'].map((h, i) => (
                  <div key={i} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--text-muted-c)' : Object.values(ENVELOPE_META)[i - 1].color, borderBottom: '1px solid var(--card-dark-border)', borderLeft: i > 0 ? '1px solid var(--card-dark-border)' : undefined }}>{h}</div>
                ))}
              </div>
              {[
                { label: 'Capital investi', values: [fmt(res.pea.totalInvested), fmt(res.cto.totalInvested), fmt(res.av.totalInvested)] },
                { label: 'Valeur brute', values: [fmt(res.pea.grossValue), fmt(res.cto.grossValue), fmt(res.av.grossValue)] },
                { label: 'Fiscalité totale', values: [fmt(res.pea.taxTotal), fmt(res.cto.taxTotal), fmt(res.av.taxTotal)] },
                { label: 'Valeur nette', values: [fmt(res.pea.netValue), fmt(res.cto.netValue), fmt(res.av.netValue)], highlight: true },
              ].map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 1fr)', borderBottom: ri < 3 ? '1px solid var(--section-border)' : undefined }}>
                  <div style={{ padding: '9px 14px', fontSize: 11, color: 'var(--text-muted-c)', fontWeight: row.highlight ? 600 : 400 }}>{row.label}</div>
                  {row.values.map((v, vi) => (
                    <div key={vi} style={{ padding: '9px 14px', fontSize: 11, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? Object.values(ENVELOPE_META)[vi].color : 'var(--text-em)', fontVariantNumeric: 'tabular-nums', borderLeft: '1px solid var(--card-dark-border)' }}>{v}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — analyse + donut + conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Analyse contextuelle */}
            <div style={{ background: `${ENVELOPE_META[res.best].color}0d`, border: `1px solid ${ENVELOPE_META[res.best].color}25`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Trophy style={{ width: 14, height: 14, color: ENVELOPE_META[res.best].color }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Quelle enveloppe choisir ?</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
                Sur <strong style={{ color: 'var(--text-em)' }}>{years} ans</strong> avec un TMI de <strong style={{ color: 'var(--text-em)' }}>{tmi}%</strong>,
                le <strong style={{ color: ENVELOPE_META[res.best].color }}>{ENVELOPE_META[res.best].label}</strong> est la meilleure enveloppe.
                {years < 5 && ' Le PEA n\'est pas encore exonéré à cet horizon.'}
                {years >= 5 && years < 8 && ' L\'AV n\'a pas encore atteint ses 8 ans d\'avantage fiscal.'}
                {years >= 8 && tmi >= 30 && ' Le PEA et l\'AV dominent largement le CTO à ce TMI.'}
              </p>
            </div>

            {/* Donut bénéfice net */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 10 }}>Valeur nette par enveloppe</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={140} height={140}>
                  <Pie data={donutData} cx={66} cy={66} innerRadius={36} outerRadius={62} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Info style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Règles clés</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: ENVELOPE_META.pea.color, text: 'PEA : plafond 150 000€. Exonération IR après 5 ans. Idéal pour ETF monde sur le long terme.' },
                  { color: ENVELOPE_META.cto.color, text: 'CTO : pas de plafond, Flat Tax 30% sur chaque gain réalisé. Utile si TMI ≤ 11% ou actifs non éligibles PEA.' },
                  { color: ENVELOPE_META.av.color, text: 'AV : abattement annuel 4 600€ (9 200€ couple) sur les gains après 8 ans. Avantage successoral.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <ArrowRight style={{ width: 11, height: 11, color: item.color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EnvelopeComparePage() {
  return (
    <Suspense>
      <EnvelopeCompareInner />
    </Suspense>
  )
}
