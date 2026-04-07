'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
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

// Backwards-compatible alias
const Tip = FieldTooltip

const COLOR = '#34d399'

function CompoundPageInner() {
  const chart = useChartTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { profile } = useUserProfile()
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Pre-fill from user profile when available
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

  // Restore simulation from history
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
  if (inputs.monthly < 300) tips.push(`+100€/mois supplémentaires = +${fmt(calcCompound({...inputs, monthly: inputs.monthly + 100}).final - r.final)} à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20-30 ans. Chaque année compte double.')
  if (tips.length === 0) tips.push('Stratégie solide. Maintenez la régularité et évitez de retirer avant terme.')

  // Count-up animation for capital final
  const animatedFinal = useCountUp(r.final, 900)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 10, flexShrink: 0 }}>
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
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', animation: 'glow-pulse 2s infinite', display: 'inline-block' }} />
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="compound" name={`Composés ${fmt(inputs.capital)}€ × ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          <Button variant={compareMode ? 'default' : 'outline'} size="sm" onClick={() => setCompareMode(v => !v)} style={compareMode ? { background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.4)', color: '#818cf8' } : {}}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />
            Comparer
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      {/* ── Guided mode panel ── */}
      {guidedMode && (() => {
        const GUIDED_STEPS = [
          {
            key: 'capital' as keyof CompoundInputs,
            question: 'Combien avez-vous déjà de côté ?',
            hint: 'Incluez votre épargne actuelle (livret A, compte, etc.). Vous pouvez mettre 0 si vous démarrez de zéro.',
            ref: 'La moyenne française est ~8 000 € d\'épargne liquide.',
            suffix: '€',
          },
          {
            key: 'monthly' as keyof CompoundInputs,
            question: 'Combien mettez-vous de côté chaque mois ?',
            hint: 'Votre versement régulier — c\'est le moteur principal de votre épargne à long terme.',
            ref: 'La moyenne française est ~300 €/mois. L\'objectif recommandé : 10-20% de votre salaire.',
            suffix: '€',
          },
          {
            key: 'rate' as keyof CompoundInputs,
            question: 'Quel rendement annuel visez-vous ?',
            hint: 'C\'est le taux moyen que vous espérez obtenir sur vos placements.',
            ref: 'Livret A : 3% · Fonds euros : 2-4% · ETF World MSCI : ~7-8%/an historique sur 30 ans.',
            suffix: '%',
            isSlider: true, min: 0.5, max: 20, step: 0.1,
          },
          {
            key: 'years' as keyof CompoundInputs,
            question: 'Sur combien d\'années ?',
            hint: 'Plus l\'horizon est long, plus l\'effet boule de neige est puissant.',
            ref: 'Sur 30 ans à 7%, votre argent est multiplié par ~7. Chaque année supplémentaire compte.',
            suffix: 'ans',
            isSlider: true, min: 1, max: 40, step: 1,
          },
        ]
        const current = GUIDED_STEPS[guidedStep]
        const isLast = guidedStep === GUIDED_STEPS.length - 1
        return (
          <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 20, padding: '24px 28px', marginBottom: 28 }}>
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {GUIDED_STEPS.map((_, i) => (
                <div key={i} style={{ width: i <= guidedStep ? 20 : 8, height: 8, borderRadius: 99, transition: 'all 0.3s', background: i < guidedStep ? '#34d399' : i === guidedStep ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.10)' }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Question {guidedStep + 1} / {GUIDED_STEPS.length}</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{current.question}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 16, lineHeight: 1.5 }}>{current.hint}</p>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              {current.isSlider ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>{current.key === 'rate' ? `${inputs[current.key]}%` : `${inputs[current.key]} ans`}</span>
                  </div>
                  <Slider min={current.min} max={current.max} step={current.step} value={[inputs[current.key] as number]} onValueChange={([v]) => set(current.key)(v)} />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Input type="number" value={inputs[current.key] as number} onChange={e => set(current.key)(+e.target.value)} style={{ fontSize: 20, fontWeight: 700, height: 52, maxWidth: 200 }} />
                  <span style={{ fontSize: 16, color: 'var(--text-muted-c)' }}>{current.suffix}</span>
                </div>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>💡 {current.ref}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {guidedStep > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setGuidedStep(s => s - 1)} style={{ height: 38 }}>← Précédent</Button>
              )}
              <Button
                variant="outline" size="sm"
                style={{ marginLeft: 'auto', height: 38, borderColor: 'rgba(52,211,153,0.4)', color: '#34d399', background: 'rgba(52,211,153,0.08)' }}
                onClick={() => {
                  if (isLast) setGuidedMode(false)
                  else setGuidedStep(s => s + 1)
                }}
              >
                {isLast ? 'Voir les résultats →' : 'Suivant →'}
              </Button>
            </div>
          </div>
        )
      })()}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Left — Input panel */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
            <ProfileFillButton onFill={p => {
              if (p.currentAssets)   set('capital')(p.currentAssets)
              if (p.monthlySavings)  set('monthly')(p.monthlySavings)
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Capital initial<Tip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." /></Label>
            <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Versement mensuel<Tip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant produit des effets spectaculaires sur 20+ ans." /></Label>
            <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Taux annuel<Tip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.rate}%</span>
            </div>
            <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(3)}>Livret A 3%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(4)}>Fonds € 4%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(8)}>ETF ~8%</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Durée<Tip text="Plus la durée est longue, plus l'effet boule de neige est puissant. 30 ans peut multiplier votre capital par 7 à 10." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
            </div>
            <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Capitalisation<Tip text="Fréquence de réinvestissement des intérêts. Mensuelle est la plus courante." /></Label>
            <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12">Mensuelle</SelectItem>
                <SelectItem value="4">Trimestrielle</SelectItem>
                <SelectItem value="1">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Score badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: scoreConf.color, fontWeight: 600 }}>Stratégie {scoreConf.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)', marginLeft: 4 }}>· {inputs.years} ans à {inputs.rate}% · {fmt(inputs.monthly)}/mois</span>
          </div>

          {/* KPI 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ background: `linear-gradient(135deg, rgba(241,192,134,0.10), transparent)`, border: '1px solid rgba(241,192,134,0.22)', borderRadius: 10, padding: '10px 12px', gridColumn: '1 / -1', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -10, width: 70, height: 70, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(241,192,134,0.10), transparent)', pointerEvents: 'none' }} />
              <p style={{ fontSize: 10, color: 'rgba(241,192,134,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Capital final</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(animatedFinal)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Capital investi</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.invested)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Intérêts générés</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: r.interest > 0 ? '#34d399' : 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.interest)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Multiplication</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>×{r.multiplier.toFixed(1)}</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Évolution du capital sur {inputs.years} ans</p>
            {mounted ? (
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                  <Line type="monotone" dataKey="total" name="Capital total" stroke={chart.lineMain} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invested" name="Investi" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 150 }} />
            )}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <CsvExport
                data={r.chartData.map((d: { year: number; total: number; invested: number }) => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur totale': d.total.toFixed(0), 'Intérêts': (d.total - d.invested).toFixed(0) }))}
                filename="interets-composes.csv"
              />
            </div>
          </div>

          {/* Tips / Insight cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.18)', borderRadius: 12, padding: '12px 16px', animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined }}>
                <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>✦</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Comparateur côte à côte ── */}
      {compareMode && (
        <div style={{ marginTop: 32, borderTop: '1px solid var(--card-dark-border)', paddingTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <GitCompare style={{ width: 16, height: 16, color: '#818cf8' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Comparateur de scénarios</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Scénario A vs Scénario B côte à côte</span>
          </div>

          {/* Two input panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Scénario A', color: '#f1c086', inp: inputs, setFn: set },
              { label: 'Scénario B', color: '#818cf8', inp: inputsB, setFn: setB },
            ].map(({ label, color, inp, setFn }) => (
              <div key={label} style={{ background: 'var(--card-dark)', border: `1px solid ${color}25`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 16 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  {(
                    [
                      { key: 'capital' as keyof CompoundInputs, label: 'Capital initial (€)', type: 'input', min: 0, max: 500000, step: 1000 },
                      { key: 'monthly' as keyof CompoundInputs, label: 'Versement mensuel (€)', type: 'input', min: 0, max: 5000, step: 50 },
                      { key: 'rate' as keyof CompoundInputs, label: `Taux annuel: ${inp.rate}%`, type: 'slider', min: 0.5, max: 20, step: 0.1 },
                      { key: 'years' as keyof CompoundInputs, label: `Durée: ${inp.years} ans`, type: 'slider', min: 1, max: 40, step: 1 },
                    ]
                  ).map(({ key, label: l, type: fieldType, min, max, step }) => (
                    <div key={String(key)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{l}</span>
                      </div>
                      {fieldType === 'input' ? (
                        <Input type="number" value={inp[key] as number} onChange={e => setFn(key)(+e.target.value)} style={{ height: 34, fontSize: 13 }} />
                      ) : (
                        <Slider min={min} max={max} step={step} value={[inp[key] as number]} onValueChange={([v]) => setFn(key)(v)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison KPIs */}
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

          {/* Comparison chart */}
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
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
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
    </div>
  )
}

export default function CompoundPage() {
  return <Suspense><CompoundPageInner /></Suspense>
}
