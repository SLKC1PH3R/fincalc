'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFlatTax, type FlatTaxInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { CheckCircle2, Download, Settings2, BookOpen, TrendingUp, RefreshCw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { SvgAreaChart, SvgDonut } from '@/components/SvgChart'
import { useCountUp } from '@/lib/use-count-up'
import { Slider } from '@/components/ui/slider'

const C = '#818cf8'

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const DEFAULT_INPUTS: FlatTaxInputs = {
  amount: 10000,
  incomeType: 'capital_gains',
  tmi: 30,
  revenuTravail: 40000,
  parts: 1,
  isCouple: false,
}

function FlatTaxInner() {
  const params = useSearchParams()

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
  const savingAnimated = useCountUp(res.saving, 800)

  const recColor = res.recommended === 'flat_tax' ? C : '#fb923c'
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

  // Chart data: tax comparison over income levels
  const chartData = useMemo(() => (res.chartData as { amount: number; flatTax: number; bareme: number }[]).map(d => ({
    amount: d.amount,
    flatTax: d.flatTax,
    bareme: d.bareme,
  })), [res.chartData])

  // Donut segments
  const donutSegments = useMemo(() => [
    { value: res.flatTax.total, color: C, label: 'Flat Tax' },
    { value: res.bareme.total, color: '#fb923c', label: 'Barème' },
  ], [res])

  const tips = [
    { title: 'Flat Tax ≥ TMI 30%', body: 'La Flat Tax (PFU 30%) est avantageuse dès que votre TMI est ≥ 30%. En dessous, le barème peut être meilleur.', color: C },
    { title: 'Dividendes & abattement', body: 'Les dividendes bénéficient d\'un abattement 40% au barème. La Flat Tax taxe le brut sans abattement.', color: '#fb923c' },
    { title: 'CSG déductible', body: 'La CSG déductible (6,8%) ne s\'applique qu\'au barème et réduit votre revenu imposable N+1.', color: 'var(--p-blue)' },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Flat Tax vs Barème</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Flat Tax vs Barème<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            PFU 30% vs barème progressif. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Dividendes, plus-values &amp; intérêts.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Flat Tax vs Barème IR',
            subtitle: `Revenus du capital : ${fmt(amount)} — ${incomeType === 'capital_gains' ? 'Plus-values' : incomeType === 'dividends' ? 'Dividendes' : 'Intérêts'}`,
            kpis: [
              { label: 'Régime recommandé', value: recLabel, highlight: true },
              { label: 'Économie réalisée', value: fmt(res.saving) },
              { label: 'Flat Tax (total)', value: fmt(res.flatTax.total), sub: `Taux effectif ${res.flatTax.effectiveRate.toFixed(1)}%` },
              { label: 'Barème (total)', value: fmt(res.bareme.total), sub: `Taux effectif ${res.bareme.effectiveRate.toFixed(1)}%` },
            ],
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="flat-tax" name="Flat Tax vs Barème" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(g => !g); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={handleReset}>
            <RefreshCw className="h-3 w-3 mr-1" />Réinit.
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Revenus du capital<FieldTooltip text="Dividendes, plus-values mobilières, intérêts, coupons… Montant brut avant fiscalité." />
                    </label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{fmtK(amount)}</span>
                  </div>
                  <Slider min={0} max={100000} step={500} value={[amount]} onValueChange={([v]) => setAmount(v)} />
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={1000}
                      style={{ height: 36, fontSize: 13, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Type de revenu<FieldTooltip text="Dividendes : abattement 40% au barème. Plus-values et intérêts : pas d'abattement." />
                  </label>
                  <Select value={incomeType} onValueChange={v => setIncomeType(v as FlatTaxInputs['incomeType'])}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="capital_gains">Plus-values mobilières</SelectItem>
                      <SelectItem value="dividends">Dividendes</SelectItem>
                      <SelectItem value="interest">Intérêts / coupons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Revenus d&apos;activité annuels<FieldTooltip text="Vos salaires, BIC, BNC… Permet de calculer le bon taux marginal et l'IR au barème." />
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={revenuTravail} onChange={e => setRevenuTravail(Number(e.target.value))} min={0} step={5000}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>
                    TMI estimé (barème)<FieldTooltip text="Taux Marginal d'Imposition. Votre tranche la plus haute dans le barème progressif." />
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
                  <label style={labelSt}>Nombre de parts fiscales</label>
                  <Select value={String(parts)} onValueChange={v => setParts(Number(v))}>
                    <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(p => <SelectItem key={p} value={String(p)}>{p} part{p > 1 ? 's' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div style={divSt} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="couple" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: C }} />
                  <label htmlFor="couple" style={{ ...labelSt, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Déclaration en couple<FieldTooltip text="Abattement AV de 9 200€ au lieu de 4 600€ pour un couple marié ou pacsé." />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Calcul PFU 30% = 12,8% IR + 17,2% PS. Barème selon tranches 2024.
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Économie réalisée · Régime optimal
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(savingAnimated)}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <CheckCircle2 style={{ width: 14, height: 14, color: recColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: recColor }}>{recLabel}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', marginTop: 4 }}>
                      TMI {tmi}% · {incomeType === 'capital_gains' ? 'Plus-values' : incomeType === 'dividends' ? 'Dividendes' : 'Intérêts'}
                    </div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Flat Tax (PFU 30%)', value: fmtK(res.flatTax.total), color: C },
                    { label: 'Barème progressif', value: fmtK(res.bareme.total), color: '#fb923c' },
                    { label: 'Taux eff. Flat Tax', value: `${res.flatTax.effectiveRate.toFixed(1)}%` },
                    { label: 'Taux eff. Barème', value: `${res.bareme.effectiveRate.toFixed(1)}%` },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Comparison cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP }}>
              {/* Flat Tax card */}
              <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderTop: `3px solid ${C}`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ ...eyebrow, color: C }}>Flat Tax</div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 2 }}>PFU 30% fixe</div>
                  </div>
                  {res.recommended === 'flat_tax' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: `${C}18`, border: `1px solid ${C}35` }}>
                      <CheckCircle2 style={{ width: 10, height: 10, color: C }} />
                      <span style={{ fontSize: 10, color: C, fontWeight: 600 }}>Optimal</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: C, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{fmtEur(res.flatTax.total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 12 }}>Taux effectif : {res.flatTax.effectiveRate.toFixed(1)}%</div>
                  {[
                    { label: 'Abattement', value: fmtK(res.flatTax.abattement) },
                    { label: 'Base imposable IR', value: fmtK(res.flatTax.baseIR) },
                    { label: 'Impôt sur le revenu', value: fmtK(res.flatTax.ir) },
                    { label: 'Prélèvements sociaux', value: fmtK(res.flatTax.ps) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--p-line)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barème card */}
              <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderTop: '3px solid #fb923c', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ ...eyebrow, color: '#fb923c' }}>Barème progressif</div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 2 }}>TMI {tmi}%</div>
                  </div>
                  {res.recommended === 'bareme' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
                      <CheckCircle2 style={{ width: 10, height: 10, color: '#fb923c' }} />
                      <span style={{ fontSize: 10, color: '#fb923c', fontWeight: 600 }}>Optimal</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: '#fb923c', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{fmtEur(res.bareme.total)}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 12 }}>Taux effectif : {res.bareme.effectiveRate.toFixed(1)}%</div>
                  {[
                    { label: 'Abattement', value: fmtK(res.bareme.abattement) },
                    { label: 'Base imposable IR', value: fmtK(res.bareme.baseIR) },
                    { label: 'Impôt sur le revenu', value: fmtK(res.bareme.ir) },
                    { label: 'Prélèvements sociaux', value: fmtK(res.bareme.ps) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--p-line)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>CSG déductible</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmtK(res.bareme.csgDed)}</span>
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

            {/* Area chart: charge fiscale comparée */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Charge fiscale comparée</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Selon le montant des revenus du capital</div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <SvgAreaChart
                  data={chartData}
                  xKey="amount"
                  series={[
                    { key: 'flatTax', label: 'Flat Tax (30%)', color: C },
                    { key: 'bareme', label: 'Barème IR', color: '#fb923c' },
                  ]}
                  height={260}
                  xFormat={v => v >= 1000 ? `${v / 1000}k€` : `${v}€`}
                  yFormat={v => v >= 1000 ? `${Math.round(v / 1000)}k€` : `${Math.round(v)}€`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Verdict */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${recColor}` }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: recColor }} />
                <div style={{ ...eyebrow, color: recColor }}>Recommandation</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                  Avec un TMI de <strong style={{ color: 'var(--p-text-em)' }}>{tmi}%</strong>, le régime <strong style={{ color: recColor }}>{recLabel}</strong> est optimal.
                  Vous économisez <strong style={{ color: '#34d399' }}>{fmtEur(res.saving)}</strong> par rapport à l&apos;autre régime.
                </p>
              </div>
            </div>

            {/* Donut */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Charge comparative</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Flat Tax vs Barème</div>
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
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Règles clés à retenir</div>
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
                  { label: 'PEA vs CTO vs AV', href: '/dashboard/envelope-compare' },
                  { label: 'Plus-value', href: '/dashboard/plusvalue' },
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

export default function FlatTaxPage() {
  return (
    <Suspense>
      <FlatTaxInner />
    </Suspense>
  )
}
