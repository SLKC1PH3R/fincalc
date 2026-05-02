'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcEnvelopeCompare, type EnvelopeCompareInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Trophy, Download, RotateCcw, Settings2, BookOpen, TrendingUp, RefreshCw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { SvgAreaChart, SvgDonut } from '@/components/SvgChart'
import { useCountUp } from '@/lib/use-count-up'

const C = '#34d399'

const ENVELOPE_META = {
  pea: { label: 'PEA', color: '#818cf8', desc: 'Exonération IR après 5 ans · Plafond 150 000€' },
  cto: { label: 'CTO', color: '#38bdf8', desc: 'Flat Tax 30% sur les gains · Pas de plafond' },
  av:  { label: 'Assurance-vie', color: '#fb923c', desc: 'Abattement 4 600€/9 200€ après 8 ans · Taux 7,5%' },
}

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const DEFAULT_INPUTS: EnvelopeCompareInputs = {
  capital: 10000, monthly: 300, rateGross: 7, years: 20, tmi: 30, isCouple: false, peaOpenYears: 0,
}

function EnvelopeCompareInner() {
  const params = useSearchParams()

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

  const bestMeta = ENVELOPE_META[res.best]
  const bestAnimated = useCountUp(res[res.best].netValue, 1000)

  // Chart data from calcEnvelopeCompare
  const chartData = useMemo(() => (res.chartData as { year: number; pea: number; cto: number; av: number }[]).map(d => ({
    year: d.year,
    pea: d.pea,
    cto: d.cto,
    av: d.av,
  })), [res.chartData])

  // Donut segments
  const donutSegments = useMemo(() => ([
    { value: res.pea.netValue, color: ENVELOPE_META.pea.color, label: 'PEA' },
    { value: res.cto.netValue, color: ENVELOPE_META.cto.color, label: 'CTO' },
    { value: res.av.netValue,  color: ENVELOPE_META.av.color,  label: 'AV' },
  ]), [res])

  const tips = [
    { title: 'PEA — La star du long terme', body: 'Exonéré d\'IR après 5 ans (17,2% PS uniquement). Idéal pour ETF monde. Plafond 150 000€.', color: ENVELOPE_META.pea.color },
    { title: 'CTO — La flexibilité totale', body: 'Flat Tax 30% sur chaque retrait. Aucun plafond, accès immédiat. Meilleur si TMI ≤ 11%.', color: ENVELOPE_META.cto.color },
    { title: 'AV — L\'abattement & succession', body: `Abattement ${isCouple ? '9 200€' : '4 600€'}/an sur les gains après 8 ans. Avantage successoral unique.`, color: ENVELOPE_META.av.color },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>PEA vs CTO vs AV</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            PEA vs CTO vs AV<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Fiscalité des enveloppes d&apos;investissement. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Comparaison sur {years} ans.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
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
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="envelope-compare" name="PEA vs CTO vs AV" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(g => !g); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={handleReset}>
            <RefreshCw className="h-3 w-3 mr-1" /><RotateCcw className="h-3 w-3 mr-1" style={{ display: 'none' }} />Réinit.
          </Button>
        </div>
      </div>

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel steps={guidedSteps} currentStep={guidedStep} onStepChange={setGuidedStep} onFinish={() => setGuidedMode(false)} />
        </div>
      )}

      {/* 3-column grid */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT — sticky inputs */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Paramètres</div>
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Capital initial (€)</label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} min={0} step={1000}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Versement mensuel (€)</label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} min={0} step={50}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Rendement brut annuel (%)<FieldTooltip text="Rendement espéré avant fiscalité. Un ETF monde sert historiquement 7-10% brut/an." />
                  </label>
                  <Input type="number" value={rateGross} onChange={e => setRateGross(Number(e.target.value))} min={0} max={30} step={0.5}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', borderRadius: 10, background: 'var(--p-card-2)' }} />
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Durée (années)</label>
                  <Input type="number" value={years} onChange={e => setYears(Number(e.target.value))} min={1} max={50}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', borderRadius: 10, background: 'var(--p-card-2)' }} />
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    TMI (barème)<FieldTooltip text="Taux Marginal d'Imposition. Utilisé pour le CTO au barème si vous l'aviez choisi." />
                  </label>
                  <Select value={String(tmi)} onValueChange={v => setTmi(Number(v))}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 11, 30, 41, 45].map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    PEA ouvert depuis<FieldTooltip text="Le PEA est exonéré d'IR après 5 ans d'ouverture." />
                  </label>
                  <Select value={String(peaOpenYears)} onValueChange={v => setPeaOpenYears(Number(v))}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(y => <SelectItem key={y} value={String(y)}>{y} an{y > 1 ? 's' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="couple2" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: C }} />
                  <label htmlFor="couple2" style={{ ...labelSt, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Déclaration en couple<FieldTooltip text="Abattement AV de 9 200€/an au lieu de 4 600€." />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Fiscalité 2024 · PEA : PS 17,2% · CTO : Flat Tax 30% · AV : taux 7,5%
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: bestMeta.color, display: 'inline-block' }} />
                Meilleure enveloppe · {years} ans
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Trophy style={{ width: 16, height: 16, color: bestMeta.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: bestMeta.color, fontFamily: 'var(--p-mono)', letterSpacing: '0.08em' }}>{bestMeta.label}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(bestAnimated)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', marginTop: 10 }}>
                    {bestMeta.desc}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {([
                    { label: 'PEA net', value: fmtK(res.pea.netValue), color: ENVELOPE_META.pea.color },
                    { label: 'CTO net', value: fmtK(res.cto.netValue), color: ENVELOPE_META.cto.color },
                    { label: 'AV nette', value: fmtK(res.av.netValue), color: ENVELOPE_META.av.color },
                    { label: 'Écart max–min', value: fmtK(Math.max(res.pea.netValue, res.cto.netValue, res.av.netValue) - Math.min(res.pea.netValue, res.cto.netValue, res.av.netValue)) },
                  ] as { label: string; value: string; color?: string }[]).map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: k.color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Area chart — 3 courbes */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={eyebrow}>Trajectoire comparée</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Évolution de la valeur nette sur {years} ans</div>
                </div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <SvgAreaChart
                  data={chartData}
                  xKey="year"
                  series={[
                    { key: 'pea', label: 'PEA', color: ENVELOPE_META.pea.color },
                    { key: 'cto', label: 'CTO', color: ENVELOPE_META.cto.color },
                    { key: 'av',  label: 'AV',  color: ENVELOPE_META.av.color },
                  ]}
                  height={260}
                  xFormat={v => `${v}a`}
                />
              </div>
            </div>

            {/* Tableau comparatif détaillé */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Comparatif détaillé</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 1fr)' }}>
                {['', 'PEA', 'CTO', 'AV'].map((h, i) => (
                  <div key={i} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--p-text-dim)' : Object.values(ENVELOPE_META)[i - 1].color, borderBottom: '1px solid var(--p-line)', borderLeft: i > 0 ? '1px solid var(--p-line)' : undefined }}>{h}</div>
                ))}
              </div>
              {[
                { label: 'Capital investi', values: [fmtK(res.pea.totalInvested), fmtK(res.cto.totalInvested), fmtK(res.av.totalInvested)] },
                { label: 'Valeur brute', values: [fmtK(res.pea.grossValue), fmtK(res.cto.grossValue), fmtK(res.av.grossValue)] },
                { label: 'Fiscalité totale', values: [fmtK(res.pea.taxTotal), fmtK(res.cto.taxTotal), fmtK(res.av.taxTotal)] },
                { label: 'Valeur nette', values: [fmtK(res.pea.netValue), fmtK(res.cto.netValue), fmtK(res.av.netValue)], highlight: true },
              ].map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 1fr)', borderBottom: ri < 3 ? '1px solid var(--p-line)' : undefined }}>
                  <div style={{ padding: '9px 14px', fontSize: 11, color: 'var(--p-text-dim)', fontWeight: row.highlight ? 600 : 400 }}>{row.label}</div>
                  {row.values.map((v, vi) => (
                    <div key={vi} style={{ padding: '9px 14px', fontSize: 11, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? Object.values(ENVELOPE_META)[vi].color : 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', borderLeft: '1px solid var(--p-line)' }}>{v}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Analyse contextuelle */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${bestMeta.color}` }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy style={{ width: 14, height: 14, color: bestMeta.color }} />
                <div style={{ ...eyebrow, color: bestMeta.color }}>Quelle enveloppe choisir ?</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                  Sur <strong style={{ color: 'var(--p-text-em)' }}>{years} ans</strong> avec un TMI de <strong style={{ color: 'var(--p-text-em)' }}>{tmi}%</strong>,
                  le <strong style={{ color: bestMeta.color }}>{bestMeta.label}</strong> est la meilleure enveloppe.
                  {years < 5 && ' Le PEA n\'est pas encore exonéré à cet horizon.'}
                  {years >= 5 && years < 8 && ' L\'AV n\'a pas encore atteint ses 8 ans d\'avantage fiscal.'}
                  {years >= 8 && tmi >= 30 && ' Le PEA et l\'AV dominent largement le CTO à ce TMI.'}
                </p>
              </div>
            </div>

            {/* Donut valeur nette */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Valeur nette par enveloppe</div>
              </div>
              <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <SvgDonut
                  segments={donutSegments}
                  width={150}
                  height={110}
                  outerRadius={48}
                  innerRadius={30}
                />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {donutSegments.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{d.label}</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 64, textAlign: 'right' }}>{fmtK(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ padding: '12px 12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aller plus loin */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Flat Tax vs Barème', href: '/dashboard/flat-tax' },
                  { label: 'Intérêts composés', href: '/dashboard/compound' },
                ].map((link, i) => (
                  <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{link.label}</span>
                    <span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                  </a>
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
