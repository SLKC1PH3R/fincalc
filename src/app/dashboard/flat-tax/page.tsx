'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFlatTax, type FlatTaxInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { CheckCircle2, ArrowRight, Download, Scale, Settings2, BookOpen } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'

const DEFAULT_INPUTS: FlatTaxInputs = {
  amount: 10000,
  incomeType: 'capital_gains',
  tmi: 30,
  revenuTravail: 40000,
  parts: 1,
  isCouple: false,
}

const COLOR = '#818cf8'

function FlatTaxInner() {
  const params = useSearchParams()
  const chartTheme = useChartTheme()

  const [amount, setAmount] = useState(10000)
  const [incomeType, setIncomeType] = useState<FlatTaxInputs['incomeType']>('capital_gains')
  const [tmi, setTmi] = useState(30)
  const [revenuTravail, setRevenuTravail] = useState(40000)
  const [parts, setParts] = useState(1)
  const [isCouple, setIsCouple] = useState(false)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  useEffect(() => {
    const r = params.get('restore')
    if (!r) return
    try {
      const inp = JSON.parse(r) as FlatTaxInputs
      setAmount(inp.amount ?? 10000)
      setIncomeType(inp.incomeType ?? 'capital_gains')
      setTmi(inp.tmi ?? 30)
      setRevenuTravail(inp.revenuTravail ?? 40000)
      setParts(inp.parts ?? 1)
      setIsCouple(inp.isCouple ?? false)
    } catch {}
  }, [params])

  const inputs: FlatTaxInputs = useMemo(() => ({ amount, incomeType, tmi, revenuTravail, parts, isCouple }), [amount, incomeType, tmi, revenuTravail, parts, isCouple])
  const res = useMemo(() => calcFlatTax(inputs), [inputs])

  const recColor = res.recommended === 'flat_tax' ? COLOR : '#fb923c'
  const recLabel = res.recommended === 'flat_tax' ? 'Flat Tax (PFU 30%)' : 'Barème progressif'

  const handleReset = () => {
    setAmount(DEFAULT_INPUTS.amount)
    setIncomeType(DEFAULT_INPUTS.incomeType)
    setTmi(DEFAULT_INPUTS.tmi)
    setRevenuTravail(DEFAULT_INPUTS.revenuTravail)
    setParts(DEFAULT_INPUTS.parts)
    setIsCouple(DEFAULT_INPUTS.isCouple)
  }

  const guidedSteps: GuidedStep[] = [
    {
      question: 'Quel est le montant de vos revenus du capital ?',
      hint: 'Dividendes, plus-values mobilières, intérêts… Le montant brut avant toute fiscalité.',
      ref: 'amount', type: 'number', suffix: '€',
      value: amount, onChange: setAmount,
    },
    {
      question: 'Quel type de revenu percevez-vous ?',
      hint: 'Dividendes : abattement 40% au barème. Plus-values et intérêts : pas d\'abattement.',
      ref: 'incomeType', type: 'choice',
      strValue: incomeType, onChoice: (v) => setIncomeType(v as FlatTaxInputs['incomeType']),
      options: [
        { value: 'capital_gains', label: 'Plus-values mobilières' },
        { value: 'dividends', label: 'Dividendes' },
        { value: 'interest', label: 'Intérêts / coupons' },
      ],
    },
    {
      question: 'Quel est votre TMI au barème progressif ?',
      hint: 'Votre tranche marginale d\'imposition. Clé pour savoir si la Flat Tax est avantageuse.',
      ref: 'tmi', type: 'choice',
      strValue: String(tmi), onChoice: (v) => setTmi(Number(v)),
      options: [0, 11, 30, 41, 45].map(t => ({ value: String(t), label: `${t}%` })),
    },
    {
      question: 'Quel sont vos revenus d\'activité annuels ?',
      hint: 'Salaires, BIC, BNC… Permet de calculer l\'IR au barème avec vos revenus du capital.',
      ref: 'revenuTravail', type: 'number', suffix: '€',
      value: revenuTravail, onChange: setRevenuTravail,
    },
  ]

  const donutData = [
    { name: 'Flat Tax', value: res.flatTax.total, color: COLOR },
    { name: 'Barème', value: res.bareme.total, color: '#fb923c' },
  ]

  return (
    <div style={{ padding: '20px 24px 48px', background: 'var(--p-bg)' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Flat Tax vs Barème</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Scale style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text-em)', margin: 0, letterSpacing: '-0.3px' }}>Flat Tax vs Barème</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>PFU 30% vs barème progressif · Dividendes &amp; plus-values</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm"
              onClick={() => { setGuidedMode(g => !g); setGuidedStep(0) }}
              style={guidedMode
                ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' }
                : { borderColor: 'var(--p-line)', color: 'var(--p-text-dim)' }}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />Mode guidé
            </Button>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'Flat Tax vs Barème IR',
              subtitle: `Revenus du capital : ${fmt(amount)} — ${incomeType === 'capital_gains' ? 'Plus-values' : incomeType === 'dividends' ? 'Dividendes' : 'Intérêts'}`,
              kpis: [
                { label: 'Régime recommandé', value: recLabel, highlight: true },
                { label: 'Économie réalisée', value: fmt(res.saving) },
                { label: 'Flat Tax (total)', value: fmt(res.flatTax.total), sub: `Taux effectif ${res.flatTax.effectiveRate.toFixed(1)}%` },
                { label: 'Barème (total)', value: fmt(res.bareme.total), sub: `Taux effectif ${res.bareme.effectiveRate.toFixed(1)}%` },
              ],
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="flat-tax" name="Flat Tax vs Barème" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
            <Button variant="outline" size="sm" onClick={handleReset}
              style={{ borderColor: 'var(--p-line)', color: 'var(--p-text-dim)' }}>
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

          {/* LEFT — sticky inputs */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: 'var(--p-card)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings2 style={{ width: 13, height: 13, color: 'var(--p-text-dim)' }} />
                <p style={{ fontSize: 11, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>
                  Revenus du capital (€)
                  <FieldTooltip text="Dividendes, plus-values mobilières, intérêts, coupons… Le montant brut avant toute fiscalité." />
                </label>
                <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={1000} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>
                  Type de revenu
                  <FieldTooltip text="Dividendes : abattement 40% au barème. Plus-values et intérêts : pas d'abattement." />
                </label>
                <Select value={incomeType} onValueChange={v => setIncomeType(v as FlatTaxInputs['incomeType'])}>
                  <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capital_gains">Plus-values mobilières</SelectItem>
                    <SelectItem value="dividends">Dividendes</SelectItem>
                    <SelectItem value="interest">Intérêts / coupons</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>
                  Revenus d&apos;activité annuels (€)
                  <FieldTooltip text="Vos salaires, BIC, BNC… Permet de calculer le bon taux marginal et l'IR au barème." />
                </label>
                <Input type="number" value={revenuTravail} onChange={e => setRevenuTravail(Number(e.target.value))} min={0} step={5000} style={{ height: 36, fontSize: 13 }} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>
                  TMI estimé (barème)
                  <FieldTooltip text="Taux Marginal d'Imposition. Votre tranche la plus haute dans le barème progressif." />
                </label>
                <Select value={String(tmi)} onValueChange={v => setTmi(Number(v))}>
                  <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[0, 11, 30, 41, 45].map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Nombre de parts fiscales</label>
                <Select value={String(parts)} onValueChange={v => setParts(Number(v))}>
                  <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(p => <SelectItem key={p} value={String(p)}>{p} part{p > 1 ? 's' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="couple" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#B07820' }} />
                <label htmlFor="couple" style={{ fontSize: 11, color: 'var(--p-text-dim)', cursor: 'pointer' }}>
                  Déclaration en couple
                  <FieldTooltip text="Abattement AV de 9 200€ au lieu de 4 600€ pour un couple marié ou pacsé." />
                </label>
              </div>
            </div>

            {/* Mini KPI summary */}
            <div style={{ background: 'var(--p-card)', border: `1px solid ${COLOR}20`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recommandation</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: recColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: recColor }}>{recLabel}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>Économie : <span style={{ color: '#34d399', fontWeight: 600 }}>{fmt(res.saving)}</span></p>
            </div>
          </div>

          {/* CENTER — KPIs + comparison + chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* KPI 4-grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Flat Tax (PFU 30%)', value: fmt(res.flatTax.total), sub: `Taux ${res.flatTax.effectiveRate.toFixed(1)}%`, color: COLOR, highlight: res.recommended === 'flat_tax' },
                { label: 'Barème progressif', value: fmt(res.bareme.total), sub: `Taux ${res.bareme.effectiveRate.toFixed(1)}%`, color: '#fb923c', highlight: res.recommended === 'bareme' },
                { label: 'Économie réalisée', value: fmt(res.saving), sub: 'en choisissant le bon régime', color: '#34d399', highlight: false },
                { label: 'Recommandé', value: res.recommended === 'flat_tax' ? 'Flat Tax' : 'Barème', sub: 'régime optimal', color: recColor, highlight: false },
              ].map((k, i) => (
                <div key={i} style={{
                  background: k.highlight ? `${k.color}10` : 'var(--p-card)',
                  border: `1px solid ${k.highlight ? k.color + '40' : 'var(--p-line)'}`,
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 3 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Side-by-side comparison cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Flat Tax card */}
              <div style={{
                background: 'var(--p-card)',
                border: '1px solid var(--p-line)',
                borderTop: `3px solid ${COLOR}`,
                borderRadius: 14, overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>Flat Tax</p>
                    <p style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>PFU 30% fixe</p>
                  </div>
                  {res.recommended === 'flat_tax' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: `${COLOR}18`, border: `1px solid ${COLOR}35` }}>
                      <CheckCircle2 style={{ width: 10, height: 10, color: COLOR }} />
                      <span style={{ fontSize: 10, color: COLOR, fontWeight: 600 }}>Optimal</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: COLOR, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                    {fmt(res.flatTax.total)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 12 }}>
                    Taux effectif : {res.flatTax.effectiveRate.toFixed(1)}%
                  </p>
                  {[
                    { label: 'Abattement', value: fmt(res.flatTax.abattement) },
                    { label: 'Base imposable IR', value: fmt(res.flatTax.baseIR) },
                    { label: 'Impôt sur le revenu', value: fmt(res.flatTax.ir) },
                    { label: 'Prélèvements sociaux', value: fmt(res.flatTax.ps) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--p-line)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barème card */}
              <div style={{
                background: 'var(--p-card)',
                border: '1px solid var(--p-line)',
                borderTop: '3px solid #fb923c',
                borderRadius: 14, overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Barème progressif</p>
                    <p style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>TMI {tmi}%</p>
                  </div>
                  {res.recommended === 'bareme' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
                      <CheckCircle2 style={{ width: 10, height: 10, color: '#fb923c' }} />
                      <span style={{ fontSize: 10, color: '#fb923c', fontWeight: 600 }}>Optimal</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#fb923c', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                    {fmt(res.bareme.total)}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 12 }}>
                    Taux effectif : {res.bareme.effectiveRate.toFixed(1)}%
                  </p>
                  {[
                    { label: 'Abattement', value: fmt(res.bareme.abattement) },
                    { label: 'Base imposable IR', value: fmt(res.bareme.baseIR) },
                    { label: 'Impôt sur le revenu', value: fmt(res.bareme.ir) },
                    { label: 'Prélèvements sociaux', value: fmt(res.bareme.ps) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--p-line)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>CSG déductible</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(res.bareme.csgDed)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info box for dividends */}
            {incomeType === 'dividends' && (
              <div style={{ background: 'rgba(176,120,32,0.06)', border: '1px solid rgba(176,120,32,0.15)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                <span style={{ color: '#B07820', fontWeight: 600 }}>Dividendes : </span>
                l&apos;abattement de 40% ne s&apos;applique qu&apos;au barème. La Flat Tax taxe le montant brut sans abattement — mais à seulement 30% fixe.
              </div>
            )}

            {/* Line chart */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)', marginBottom: 10 }}>Charge fiscale comparée selon le montant</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={res.chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="amount" tickFormatter={v => v >= 1000 ? `${v / 1000}k€` : `${v}€`} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <YAxis tickFormatter={v => v >= 1000 ? `${v / 1000}k` : String(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <Tooltip
                    contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                    formatter={(v: number, name: string) => [fmt(v), name === 'flatTax' ? 'Flat Tax' : 'Barème']}
                    labelFormatter={v => `Revenus : ${fmt(Number(v))}`}
                  />
                  <Legend formatter={(v: string) => v === 'flatTax' ? 'Flat Tax (30%)' : 'Barème IR'} wrapperStyle={{ fontSize: 11, color: chartTheme.tick }} />
                  <Line type="monotone" dataKey="flatTax" stroke={COLOR} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="bareme" stroke="#fb923c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT — analyse + donut + conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Verdict */}
            <div style={{
              background: `${recColor}10`,
              border: `1px solid ${recColor}30`,
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: 10
            }}>
              <CheckCircle2 style={{ width: 18, height: 18, color: recColor, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 4 }}>
                  Quelle option choisir ?
                </p>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                  Avec un TMI de <strong style={{ color: 'var(--p-text-em)' }}>{tmi}%</strong>, le régime <strong style={{ color: recColor }}>{recLabel}</strong> est optimal.
                  Vous économisez <strong style={{ color: '#34d399' }}>{fmt(res.saving)}</strong> par rapport à l&apos;autre régime.
                </p>
              </div>
            </div>

            {/* Donut répartition */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 8 }}>Charge fiscale comparative</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart width={100} height={100}>
                  <Pie data={donutData} cx={46} cy={46} innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Pie>
                </PieChart>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {donutData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{d.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Règles clés */}
            <div style={{ background: 'rgba(176,120,32,0.06)', border: '1px solid rgba(176,120,32,0.15)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Conseils clés</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { color: COLOR, text: 'La Flat Tax (PFU) est avantageuse pour les TMI ≥ 30%.' },
                  { color: '#fb923c', text: 'Le barème est souvent meilleur pour les TMI 0% et 11%, surtout sur les dividendes (abattement 40%).' },
                  { color: '#34d399', text: 'Vous pouvez choisir le régime chaque année lors de votre déclaration.' },
                  { color: '#B07820', text: "La CSG déductible (6,8%) ne s'applique qu'au barème et réduit le revenu imposable N+1." },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <ArrowRight style={{ width: 11, height: 11, color: item.color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5 }}>{item.text}</span>
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

export default function FlatTaxPage() {
  return (
    <Suspense>
      <FlatTaxInner />
    </Suspense>
  )
}
