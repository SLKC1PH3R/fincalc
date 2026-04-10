'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, GitCompare, BookOpen, Settings2 } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'
import { useUserProfile } from '@/lib/use-profile'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'

const Tip = FieldTooltip
const COLOR = '#818cf8'

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

  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
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
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    faible: { label: 'Faible', Icon: AlertCircle, color: '#ef4444' },
  }[score]

  const tips: string[] = []
  if (inputs.rate < 5) tips.push('Un rendement de 5-8%/an est atteignable via des ETF World diversifiés sur le long terme.')
  if (inputs.monthly < 300) tips.push(`+100€/mois supplémentaires = +${fmt(calcCompound({ ...inputs, monthly: inputs.monthly + 100 }).final - r.final)} à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20-30 ans. Chaque année compte double.')
  if (tips.length === 0) tips.push('Stratégie solide. Maintenez la régularité et évitez de retirer avant terme.')

  const animatedFinal = useCountUp(r.final, 900)

  // Décennies table
  const decadeTable = useMemo(() => {
    return r.chartData.filter((d: { year: number }) => d.year % 5 === 0 && d.year > 0)
  }, [r])

  // Donut capital/intérêts
  const donutData = [
    { name: 'Capital investi', value: r.invested, color: COLOR },
    { name: 'Intérêts', value: Math.max(r.interest, 0), color: '#34d399' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Combien avez-vous déjà de côté ?', hint: 'Incluez votre épargne actuelle. Vous pouvez mettre 0 si vous démarrez de zéro.', ref: 'La moyenne française est ~8 000 € d\'épargne liquide.', suffix: '€', value: inputs.capital, onChange: v => set('capital')(v) },
    { question: 'Combien mettez-vous de côté chaque mois ?', hint: 'Votre versement régulier — c\'est le moteur principal de votre épargne à long terme.', ref: 'La moyenne française est ~300 €/mois. L\'objectif recommandé : 10-20% de votre salaire.', suffix: '€', value: inputs.monthly, onChange: v => set('monthly')(v) },
    { type: 'slider', question: 'Quel rendement annuel visez-vous ?', hint: 'C\'est le taux moyen que vous espérez obtenir sur vos placements.', ref: 'Livret A : 3% · Fonds euros : 2-4% · ETF World MSCI : ~7-8%/an historique sur 30 ans.', suffix: '%', value: inputs.rate, onChange: v => set('rate')(v), min: 0.5, max: 20, stepSize: 0.1 },
    { type: 'slider', question: 'Sur combien d\'années ?', hint: 'Plus l\'horizon est long, plus l\'effet boule de neige est puissant.', ref: 'Sur 30 ans à 7%, votre argent est multiplié par ~7. Chaque année supplémentaire compte.', suffix: 'ans', value: inputs.years, onChange: v => set('years')(v), min: 1, max: 40, stepSize: 1, displayValue: v => `${v} ans` },
  ]

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Intérêts Composés</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Intérêts Composés</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Effet boule de neige · Capitalisation · Long terme</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {compareMode && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#818cf8', background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.30)', borderRadius: 20, padding: '3px 10px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
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
            <Button variant={compareMode ? 'default' : 'outline'} size="sm" onClick={() => setCompareMode(v => !v)} style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />Comparer
            </Button>
            <Button variant={guidedMode ? 'default' : 'outline'} size="sm" onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
              style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
              {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
              {guidedMode ? 'Mode expert' : 'Mode guidé'}
            </Button>
            <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => setInputs({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Bon à savoir banner */}
      {!bannerDismissed && !guidedMode && (
        <div style={{ marginTop: 16, background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 3 }}>Bon à savoir — Intérêts composés</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0, lineHeight: 1.5 }}>
              Même un petit versement mensuel régulier bat un gros versement unique grâce à la capitalisation. Doublez la durée, et vous pouvez tripler le capital final.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('compound-banner-dismissed', '1'); setBannerDismissed(true) }} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 16, lineHeight: 1, padding: 2 }} aria-label="Fermer">×</button>
        </div>
      )}

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
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp style={{ width: 12, height: 12, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.currentAssets) set('capital')(p.currentAssets)
                  if (p.monthlySavings) set('monthly')(p.monthlySavings)
                }} />
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capital initial<Tip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." />
                  </label>
                  <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Versement mensuel<Tip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant produit des effets spectaculaires sur 20+ ans." />
                  </label>
                  <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Taux annuel<Tip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.rate}%</span>
                  </div>
                  <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(3)}>Livret A 3%</button>
                    <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(4)}>Fonds € 4%</button>
                    <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(8)}>ETF ~8%</button>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0 }}>Réf. S&P 500 : ~10%/an sur 30 ans · MSCI World : ~8%/an (dividendes inclus)</p>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Durée<Tip text="Plus la durée est longue, plus l'effet boule de neige est puissant. 30 ans peut multiplier votre capital par 7 à 10." />
                    </label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
                  </div>
                  <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Capitalisation<Tip text="Fréquence de réinvestissement des intérêts. Mensuelle est la plus courante." />
                  </label>
                  <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
                    <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Mensuelle</SelectItem>
                      <SelectItem value="4">Trimestrielle</SelectItem>
                      <SelectItem value="1">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Mini-résumé */}
            <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <scoreConf.Icon style={{ width: 13, height: 13, color: scoreConf.color }} />
                <span style={{ fontSize: 12, color: scoreConf.color, fontWeight: 600 }}>Stratégie {scoreConf.label}</span>
              </div>
              {[
                { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}` },
                { label: `${inputs.years} ans à ${inputs.rate}%`, value: `${fmt(inputs.monthly)}/mois` },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === 0 ? 6 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{k.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Capital final', value: fmt(animatedFinal), color: COLOR },
                { label: 'Capital investi', value: fmt(r.invested), color: 'var(--text-primary)' },
                { label: 'Intérêts totaux', value: fmt(r.interest), color: r.interest > 0 ? '#34d399' : 'var(--text-primary)' },
                { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}`, color: 'var(--text-primary)' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 4, letterSpacing: '0.04em' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* LineChart capital simple vs composé */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 12 }}>Évolution du capital sur {inputs.years} ans</p>
              {mounted ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="total" name="Capital total" stroke={COLOR} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="invested" name="Investi (sans intérêts)" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div style={{ height: 180 }} />}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <CsvExport
                  data={r.chartData.map((d: { year: number; total: number; invested: number }) => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur totale': d.total.toFixed(0), 'Intérêts': (d.total - d.invested).toFixed(0) }))}
                  filename="interets-composes.csv"
                />
              </div>
            </div>

            {/* Table par décennie */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Jalons par 5 ans</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Année', 'Investi', 'Total', 'Intérêts', '×'].map((h, i) => (
                      <th key={i} style={{ padding: '7px 12px', textAlign: i === 0 ? 'left' : 'right', fontSize: 10, fontWeight: 500, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--card-dark-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {decadeTable.map((d: { year: number; total: number; invested: number }) => (
                    <tr key={d.year} style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                      <td style={{ padding: '7px 12px', color: 'var(--text-em)', fontWeight: 500 }}>{d.year} ans</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.invested)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: COLOR, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.total - d.invested)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>×{(d.total / (d.invested || 1)).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Analyse effet boule de neige */}
            <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 15, height: 15, color: COLOR }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Effet boule de neige</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 8 }}>
                En {inputs.years} ans, vos intérêts génèrent eux-mêmes des intérêts. La puissance de la capitalisation fait que <strong style={{ color: COLOR }}>{((r.interest / r.final) * 100).toFixed(0)}%</strong> de votre capital final provient des intérêts composés.
              </p>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Fréquence : </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)' }}>
                  {inputs.frequency === 12 ? 'Mensuelle' : inputs.frequency === 4 ? 'Trimestrielle' : 'Annuelle'}
                </span>
              </div>
            </div>

            {/* Donut capital/intérêts */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 10 }}>Composition du capital final</p>
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
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)' }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: `${COLOR}07`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>

            {/* CTA DCA */}
            <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 4 }}>Optimisez avec le DCA</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5, marginBottom: 6 }}>Le DCA combine l&apos;effet composé à la régularité pour lisser la volatilité.</p>
              <a href="/dashboard/dca" style={{ fontSize: 11, color: COLOR, textDecoration: 'none', fontWeight: 600 }}>→ Simulateur DCA</a>
            </div>
          </div>
        </div>
      )}

      {/* Comparateur A/B */}
      {compareMode && !guidedMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--card-dark-border)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Scénario A vs Scénario B côte à côte</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Scénario A', color: '#f1c086', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ].map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--card-dark)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {([
                    { key: 'capital' as keyof CompoundInputs, label: 'Capital initial (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                    { key: 'monthly' as keyof CompoundInputs, label: 'Versement mensuel (€)', type: 'input', min: 0, max: 5000, step: 50 },
                    { key: 'rate' as keyof CompoundInputs, label: `Taux annuel: ${inp.rate}%`, type: 'slider', min: 0.5, max: 20, step: 0.1 },
                    { key: 'years' as keyof CompoundInputs, label: `Durée: ${inp.years} ans`, type: 'slider', min: 1, max: 40, step: 1 },
                  ]).map(({ key, label: l, type: fieldType, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 6 }}>{l}</div>
                      {fieldType === 'input'
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
              { label: 'Capital final A', value: fmt(r.final), color: '#f1c086' },
              { label: 'Capital final B', value: fmt(rB.final), color: '#818cf8' },
              { label: 'Différence', value: fmt(Math.abs(rB.final - r.final)), color: rB.final > r.final ? '#34d399' : '#f87171' },
              { label: 'B surperforme A de', value: `${rB.final > r.final ? '+' : '-'}${((Math.abs(rB.final - r.final) / r.final) * 100).toFixed(1)}%`, color: rB.final > r.final ? '#34d399' : '#f87171' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Évolution comparée sur {Math.max(inputs.years, inputsB.years)} ans</p>
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
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Scénario A" stroke="#f1c086" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Scénario B" stroke="#818cf8" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Investi A" stroke="#f1c08650" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="Investi B" stroke="#818cf850" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
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
