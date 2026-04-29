'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, GitCompare, BookOpen, Settings2, Sparkles, Info } from 'lucide-react'
import { printReport } from '@/lib/print'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useUserProfile } from '@/lib/use-profile'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { useChartTheme } from '@/lib/chart-theme'

const Tip = FieldTooltip
const COLOR = '#7c3aed'
const COLOR_LIGHT = '#ede9fe'
const GREEN = '#10b981'
const GREEN_LIGHT = '#d1fae5'

// Card style helpers
const card = {
  background: 'var(--p-card)',
  border: '1px solid var(--p-line)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-sm)',
}
const cardPad = '14px 16px'
const divider = { height: 1, background: 'var(--p-line)' }
const labelStyle = { fontSize: 11, color: 'var(--p-text-faint)', letterSpacing: '0.04em', fontWeight: 500 }

function CompoundPageInner() {
  const chart = useChartTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { profile } = useUserProfile()
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem('compound-banner-dismissed')
  })

  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 300, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (!profile) return
    setInputs(prev => ({
      ...prev,
      monthly: profile.monthlySavings ?? prev.monthly,
      capital: profile.currentAssets ?? prev.capital,
    }))
  }, [profile])

  const [compareMode, setCompareMode] = useState(false)
  const [inputsB, setInputsB] = useState<CompoundInputs>({ capital: 10000, monthly: 800, rate: 9, years: 20, frequency: 12 })
  const setB = (k: keyof CompoundInputs) => (v: any) => setInputsB(p => ({ ...p, [k]: v }))
  const rB = useMemo(() => calcCompound(inputsB), [inputsB])

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const parsed = JSON.parse(restoreParam)
      if (parsed.initial !== undefined && parsed.capital === undefined) parsed.capital = parsed.initial
      setInputs(parsed as CompoundInputs)
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcCompound(inputs), [inputs])

  const score = r.multiplier >= 5 ? 'excellent' : r.multiplier >= 3 ? 'bon' : r.multiplier >= 2 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#10b981', bg: '#d1fae5' },
    bon: { label: 'Bien', Icon: TrendingUp, color: '#3b82f6', bg: '#dbeafe' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#f59e0b', bg: '#fef3c7' },
    faible: { label: 'Faible', Icon: AlertCircle, color: '#ef4444', bg: '#fee2e2' },
  }[score]

  const tips: string[] = []
  if (inputs.rate < 5) tips.push('Un rendement de 5–8 %/an est atteignable via des ETF World diversifiés sur le long terme.')
  if (inputs.monthly < 300) tips.push(`+100 €/mois supplémentaires = +${fmt(calcCompound({ ...inputs, monthly: inputs.monthly + 100 }).final - r.final)} à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20–30 ans. Chaque année compte double.')
  if (tips.length === 0) tips.push('Stratégie solide. Maintenez la régularité et évitez de retirer avant terme.')

  const animatedFinal = useCountUp(r.final, 900)

  const decadeTable = useMemo(() => {
    return r.chartData.filter((d: { year: number }) => d.year % 5 === 0 && d.year > 0)
  }, [r])

  const donutData = [
    { name: 'Capital investi', value: r.invested, color: COLOR },
    { name: 'Intérêts', value: Math.max(r.interest, 0), color: GREEN },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Combien avez-vous déjà de côté ?', hint: 'Incluez votre épargne actuelle. Vous pouvez mettre 0 si vous démarrez de zéro.', ref: 'La moyenne française est ~8 000 € d\'épargne liquide.', suffix: '€', value: inputs.capital, onChange: v => set('capital')(v) },
    { question: 'Combien mettez-vous de côté chaque mois ?', hint: 'Votre versement régulier — c\'est le moteur principal de votre épargne à long terme.', ref: 'La moyenne française est ~300 €/mois. L\'objectif recommandé : 10–20 % de votre salaire.', suffix: '€', value: inputs.monthly, onChange: v => set('monthly')(v) },
    { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'C\'est le taux moyen que vous espérez obtenir sur vos placements.', ref: 'Livret A : 3 % · Fonds euros : 2–4 % · ETF World MSCI : ~7–8 %/an historique sur 30 ans.', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 0.5, max: 20, stepSize: 0.1 },
    { type: 'slider', question: 'Sur combien d\'années ?', hint: 'Plus l\'horizon est long, plus l\'effet boule de neige est puissant.', ref: 'Sur 30 ans à 7 %, votre argent est multiplié par ~7. Chaque année supplémentaire compte.', suffix: 'ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
  ]

  const interestPct = r.final > 0 ? Math.round((r.interest / r.final) * 100) : 0
  const investedPct = 100 - interestPct

  return (
    <div style={{ padding: '24px 28px 56px', background: 'var(--p-bg)', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.5 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Intérêts Composés</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: COLOR_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--p-text-em)', margin: 0, letterSpacing: '-0.3px' }}>Intérêts Composés</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-faint)', margin: 0 }}>Effet boule de neige · Capitalisation · Long terme</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {compareMode && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLOR, background: COLOR_LIGHT, border: `1px solid ${COLOR}30`, borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR, display: 'inline-block' }} />
                Mode Comparaison
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'Intérêts Composés',
              subtitle: `Capital ${fmt(inputs.capital)} · ${fmt(inputs.monthly)}/mois · ${inputs.rate}% · ${inputs.years} ans`,
              kpis: [
                { label: 'Capital final', value: fmt(r.final), highlight: true },
                { label: 'Capital investi', value: fmt(r.invested) },
                { label: 'Intérêts générés', value: fmt(r.interest) },
                { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}` },
              ],
              inputs: [
                { label: 'Capital initial', value: fmt(inputs.capital) },
                { label: 'Versement mensuel', value: fmt(inputs.monthly) },
                { label: 'Taux annuel', value: `${inputs.rate}%` },
                { label: 'Durée', value: `${inputs.years} ans` },
                { label: 'Capitalisation', value: inputs.frequency === 12 ? 'Mensuelle' : inputs.frequency === 4 ? 'Trimestrielle' : 'Annuelle' },
              ],
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="compound" name={`Composés ${fmt(inputs.capital)}€ × ${inputs.years}a`} inputs={inputs as any} results={r as any} />
            <Button variant={compareMode ? 'default' : 'outline'} size="sm" onClick={() => setCompareMode(v => !v)}
              style={compareMode ? { background: COLOR_LIGHT, border: `1px solid ${COLOR}40`, color: COLOR } : {}}>
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
            </Button>
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm" onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
              style={guidedMode ? { background: GREEN_LIGHT, border: `1px solid ${GREEN}40`, color: GREEN } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: '#9ca3af' }}
              onClick={() => setInputs({ capital: 10000, monthly: 300, rate: 7, years: 20, frequency: 12 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* ── Banner ── */}
      {!bannerDismissed && !guidedMode && (
        <div style={{ marginBottom: 16, background: '#f5f3ff', border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Info style={{ width: 15, height: 15, color: COLOR, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>Bon à savoir — Intérêts composés</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.55 }}>
              Même un petit versement mensuel régulier bat un gros versement unique grâce à la capitalisation. Doublez la durée, et vous pouvez tripler le capital final.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('compound-banner-dismissed', '1'); setBannerDismissed(true) }}
            style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 18, lineHeight: 1, padding: 2 }} aria-label="Fermer">×</button>
        </div>
      )}

      {/* ── Guided mode ── */}
      {guidedMode && (
        <div style={{ marginTop: 16 }}>
          <GuidedModePanel steps={guidedSteps} currentStep={guidedStep} onStepChange={setGuidedStep} onFinish={() => setGuidedMode(false)} />
        </div>
      )}

      {/* ── 3-column grid ── */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 280px', gap: 16, alignItems: 'start' }}>

          {/* ── LEFT — Paramètres ── */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...card }}>
              {/* Card header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: COLOR_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings2 style={{ width: 13, height: 13, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.currentAssets) set('capital')(p.currentAssets)
                  if (p.monthlySavings) set('monthly')(p.monthlySavings)
                }} />
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Capital initial */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capital initial<Tip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 600, paddingRight: 30, borderRadius: 10 }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--p-text-faint)' }}>€</span>
                  </div>
                </div>

                <div style={divider} />

                {/* Versement mensuel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Versement / mois<Tip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant produit des effets spectaculaires sur 20+ ans." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)}
                      style={{ height: 38, fontSize: 14, fontWeight: 600, paddingRight: 30, borderRadius: 10 }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--p-text-faint)' }}>€</span>
                  </div>
                </div>

                <div style={divider} />

                {/* Taux */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Taux annuel<Tip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLOR }}>{inputs.rate} %</span>
                  </div>
                  <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {[{ label: 'Livret A', rate: 3 }, { label: 'Fonds €', rate: 4 }, { label: 'ETF ~8%', rate: 8 }].map(({ label, rate }) => (
                      <button key={label}
                        onClick={() => set('rate')(rate)}
                        style={{ fontSize: 10, color: inputs.rate === rate ? COLOR : '#9ca3af', background: inputs.rate === rate ? COLOR_LIGHT : 'transparent', border: inputs.rate === rate ? `1px solid ${COLOR}30` : '1px solid transparent', borderRadius: 6, padding: '2px 7px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, lineHeight: 1.4 }}>Réf. S&P 500 : ~10%/an · MSCI World : ~8%/an</p>
                </div>

                <div style={divider} />

                {/* Durée */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Durée<Tip text="Plus la durée est longue, plus l'effet boule de neige est puissant. 30 ans peut multiplier votre capital par 7 à 10." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: COLOR }}>{inputs.years} ans</span>
                  </div>
                  <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                </div>

                <div style={divider} />

                {/* Capitalisation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capitalisation<Tip text="Fréquence de réinvestissement des intérêts. Mensuelle est la plus courante." />
                  </label>
                  <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Mensuelle</SelectItem>
                      <SelectItem value="4">Trimestrielle</SelectItem>
                      <SelectItem value="1">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Score badge */}
            <div style={{ ...card, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: scoreConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--p-text-faint)', margin: 0 }}>Stratégie</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: scoreConf.color, margin: 0 }}>{scoreConf.label}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: 'var(--p-text-faint)', margin: 0 }}>Multiplication</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--p-text-em)', margin: 0 }}>×{r.multiplier.toFixed(1)}</p>
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--p-line)', margin: '10px 0' }} />
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, lineHeight: 1.5 }}>
                {inputs.years} ans à {inputs.rate}% · {fmt(inputs.monthly)}/mois
              </p>
            </div>
          </div>

          {/* ── CENTER ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Hero KPI — Capital final */}
            <div style={{ ...card, padding: '20px 24px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: 'none', borderRadius: 20 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Capital final</p>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', margin: '0 0 2px', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
                {fmt(animatedFinal)}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', margin: 0 }}>×{r.multiplier.toFixed(1)} votre mise initiale</p>
            </div>

            {/* 3 sub-KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Capital investi', value: fmt(r.invested), sub: `${investedPct}% du total`, color: '#374151', accent: '#6b7280' },
                { label: 'Intérêts générés', value: fmt(r.interest), sub: `${interestPct}% du total`, color: GREEN, accent: GREEN },
                { label: 'Durée · Taux', value: `${inputs.years} ans`, sub: `${inputs.rate}% / an`, color: COLOR, accent: COLOR },
              ].map((kpi, i) => (
                <div key={i} style={{ ...card, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 6px', letterSpacing: '0.04em', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.3px', margin: '0 0 2px' }}>{kpi.value}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* LineChart */}
            <div style={{ ...card, padding: cardPad }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Évolution du capital sur {inputs.years} ans</p>
                <CsvExport
                  data={r.chartData.map((d: { year: number; total: number; invested: number }) => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur totale': d.total.toFixed(0), 'Intérêts': (d.total - d.invested).toFixed(0) }))}
                  filename="interets-composes.csv"
                />
              </div>
              {mounted ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={r.chartData} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--p-text-dim)' }} />
                    <Line type="monotone" dataKey="total" name="Capital total" stroke={COLOR} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="invested" name="Investi (sans intérêts)" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 190 }} />}
            </div>

            {/* Decade table */}
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Jalons par 5 ans</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--p-bg)' }}>
                    {['Année', 'Investi', 'Total', 'Intérêts', '×'].map((h, i) => (
                      <th key={i} style={{ padding: '8px 14px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--p-line)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decadeTable.map((d: { year: number; total: number; invested: number }, idx: number) => (
                    <tr key={d.year} style={{ borderBottom: '1px solid var(--p-line)' }}>
                      <td style={{ padding: '8px 14px', color: 'var(--p-text)', fontWeight: 600 }}>{d.year} ans</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.invested)}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', color: COLOR, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total)}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', color: GREEN, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total - d.invested)}</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', color: 'var(--p-text-faint)', fontVariantNumeric: 'tabular-nums' }}>×{(d.total / (d.invested || 1)).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Donut répartition */}
            <div style={{ ...card, padding: cardPad }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Répartition du capital</p>

              {/* Donut chart */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <PieChart width={150} height={110}>
                  <Pie data={donutData} cx={75} cy={55} innerRadius={36} outerRadius={52} paddingAngle={3} dataKey="value" startAngle={90} endAngle={450}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} />
                </PieChart>
              </div>

              {/* Legend bars */}
              {donutData.map((d, i) => {
                const pct = r.final > 0 ? Math.round((d.value / r.final) * 100) : 0
                return (
                  <div key={i} style={{ marginBottom: i === 0 ? 10 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{d.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{fmt(d.value)}</span>
                        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: d.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Effet boule de neige */}
            <div style={{ ...card, padding: cardPad }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles style={{ width: 13, height: 13, color: '#f59e0b' }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0 }}>Effet boule de neige</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                En {inputs.years} ans, <strong style={{ color: 'var(--p-text-em)' }}>{interestPct}%</strong> de votre capital final provient des intérêts composés.
              </p>
              <div style={{ background: 'var(--p-card-2)', borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Capitalisation</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text)' }}>
                  {inputs.frequency === 12 ? 'Mensuelle' : inputs.frequency === 4 ? 'Trimestrielle' : 'Annuelle'}
                </span>
              </div>
            </div>

            {/* Tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Conseils</p>
              {tips.map((tip, i) => (
                <div key={i} style={{ ...card, padding: '10px 12px', borderLeft: `3px solid ${COLOR}` }}>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>

            {/* CTA DCA */}
            <div style={{ background: '#f5f3ff', border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 4 }}>Optimisez avec le DCA</p>
              <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, marginBottom: 6 }}>Le DCA combine l&apos;effet composé à la régularité pour lisser la volatilité.</p>
              <a href="/dashboard/dca" style={{ fontSize: 11, color: COLOR, textDecoration: 'none', fontWeight: 600 }}>→ Simulateur DCA</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Compare mode ── */}
      {compareMode && !guidedMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid #e5e7eb', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: COLOR }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Scénario A vs Scénario B côte à côte</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Scénario A', color: '#7c3aed', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#10b981', inp: inputsB, setFn: setB },
            ].map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ ...card, borderTop: `3px solid ${color}`, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'capital' as keyof CompoundInputs, label: 'Capital initial (€)', type: 'input' },
                    { key: 'monthly' as keyof CompoundInputs, label: 'Versement mensuel (€)', type: 'input' },
                    { key: 'rate' as keyof CompoundInputs, label: `Taux annuel: ${inp.rate}%`, type: 'slider', min: 0.5, max: 20, step: 0.1 },
                    { key: 'years' as keyof CompoundInputs, label: `Durée: ${inp.years} ans`, type: 'slider', min: 1, max: 40, step: 1 },
                  ]).map(({ key, label: l, type: fieldType, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{l}</div>
                      {fieldType === 'input'
                        ? <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 36, fontSize: 13, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                        : <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Capital final A', value: fmt(r.final), color: '#7c3aed' },
              { label: 'Capital final B', value: fmt(rB.final), color: '#10b981' },
              { label: 'Différence', value: fmt(Math.abs(rB.final - r.final)), color: rB.final > r.final ? '#10b981' : '#ef4444' },
              { label: 'B vs A', value: `${rB.final > r.final ? '+' : '-'}${((Math.abs(rB.final - r.final) / r.final) * 100).toFixed(1)}%`, color: rB.final > r.final ? '#10b981' : '#ef4444' },
            ].map(kpi => (
              <div key={kpi.label} style={{ ...card, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div style={{ ...card, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Évolution comparée sur {Math.max(inputs.years, inputsB.years)} ans</p>
            {mounted && (() => {
              const yearsMax = Math.max(inputs.years, inputsB.years)
              const dataA = calcCompound({ ...inputs, years: yearsMax }).chartData
              const dataB = calcCompound({ ...inputsB, years: yearsMax }).chartData
              const merged = dataA.map((pt: { year: number; total: number; invested: number }, i: number) => ({
                year: pt.year,
                'Scénario A': pt.total,
                'Scénario B': dataB[i]?.total ?? 0,
                'Investi A': pt.invested,
                'Investi B': dataB[i]?.invested ?? 0,
              }))
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={merged} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scénario A" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Scénario B" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Investi A" stroke="#c4b5fd" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="Investi B" stroke="#6ee7b7" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
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

export default function CompoundPage() {
  return <Suspense><CompoundPageInner /></Suspense>
}
