'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFlatTax, type FlatTaxInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { HelpCircle, CheckCircle2, ArrowRight, Download } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'
import { printReport } from '@/lib/print'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && (
        <span className="absolute z-50 left-5 -top-1 w-64 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

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
  const chartTheme = useChartTheme()

  const [amount, setAmount] = useState(10000)
  const [incomeType, setIncomeType] = useState<FlatTaxInputs['incomeType']>('capital_gains')
  const [tmi, setTmi] = useState(30)
  const [revenuTravail, setRevenuTravail] = useState(40000)
  const [parts, setParts] = useState(1)
  const [isCouple, setIsCouple] = useState(false)

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

  const recColor = res.recommended === 'flat_tax' ? '#38bdf8' : '#fb923c'
  const recLabel = res.recommended === 'flat_tax' ? 'Flat Tax (PFU 30%)' : 'Barème progressif'

  const handleReset = () => {
    setAmount(DEFAULT_INPUTS.amount)
    setIncomeType(DEFAULT_INPUTS.incomeType)
    setTmi(DEFAULT_INPUTS.tmi)
    setRevenuTravail(DEFAULT_INPUTS.revenuTravail)
    setParts(DEFAULT_INPUTS.parts)
    setIsCouple(DEFAULT_INPUTS.isCouple)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Fiscalité</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Flat Tax vs Barème IR
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
            Comparez le Prélèvement Forfaitaire Unique (30%) au barème progressif selon votre TMI et vos revenus du capital.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Flat Tax vs Barème IR',
            subtitle: `Revenus du capital : ${fmt(amount)} — ${incomeType === 'capital_gains' ? 'Plus-values' : incomeType === 'dividends' ? 'Dividendes' : 'Intérêts'}`,
            kpis: [
              { label: 'Régime recommandé', value: recLabel, highlight: true },
              { label: 'Économie réalisée', value: fmt(res.saving) },
              { label: 'Flat Tax (total)', value: fmt(res.flatTax.total), sub: `Taux effectif ${res.flatTax.effectiveRate.toFixed(1)}%` },
              { label: 'Barème (total)', value: fmt(res.bareme.total), sub: `Taux effectif ${res.bareme.effectiveRate.toFixed(1)}%` },
            ],
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="flat-tax" name="Flat Tax vs Barème" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
          <Button variant="outline" size="sm" onClick={handleReset}
            style={{ borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Inputs ── */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              Revenus du capital (€)
              <Tip text="Dividendes, plus-values mobilières, intérêts, coupons… Le montant brut avant toute fiscalité." />
            </Label>
            <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={1000} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              Type de revenu
              <Tip text="Dividendes : abattement 40% au barème. Plus-values et intérêts : pas d'abattement." />
            </Label>
            <Select value={incomeType} onValueChange={v => setIncomeType(v as FlatTaxInputs['incomeType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="capital_gains">Plus-values mobilières</SelectItem>
                <SelectItem value="dividends">Dividendes</SelectItem>
                <SelectItem value="interest">Intérêts / coupons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              Revenus d&apos;activité annuels (€)
              <Tip text="Vos salaires, BIC, BNC… Permet de calculer le bon taux marginal et l'IR au barème." />
            </Label>
            <Input type="number" value={revenuTravail} onChange={e => setRevenuTravail(Number(e.target.value))} min={0} step={5000} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              TMI estimé (barème)
              <Tip text="Taux Marginal d'Imposition. Votre tranche la plus haute dans le barème progressif (0, 11, 30, 41 ou 45%)." />
            </Label>
            <Select value={String(tmi)} onValueChange={v => setTmi(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 11, 30, 41, 45].map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Nombre de parts fiscales</Label>
            <Select value={String(parts)} onValueChange={v => setParts(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(p => <SelectItem key={p} value={String(p)}>{p} part{p > 1 ? 's' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="couple" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#f1c086' }} />
            <label htmlFor="couple" style={{ fontSize: 12, color: 'var(--text-em)', cursor: 'pointer' }}>
              Déclaration en couple
              <Tip text="Abattement AV de 9 200€ au lieu de 4 600€ pour un couple marié ou pacsé." />
            </label>
          </div>
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Verdict banner */}
          <div style={{
            background: 'rgba(52,211,153,0.06)',
            border: '1px solid rgba(52,211,153,0.15)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: '#34d399', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                Régime recommandé : <span style={{ color: recColor }}>{recLabel}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>
                Économie de <span style={{ color: '#34d399', fontWeight: 600 }}>{fmt(res.saving)}</span> par rapport à l&apos;autre régime
                · Taux effectif {(res.recommended === 'flat_tax' ? res.flatTax : res.bareme).effectiveRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Side-by-side comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Flat Tax card */}
            <div style={{
              background: 'var(--card-dark)',
              border: '1px solid var(--card-dark-border)',
              borderTop: '3px solid #38bdf8',
              borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Flat Tax</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>PFU 30% fixe</p>
                </div>
                {res.recommended === 'flat_tax' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
                    <CheckCircle2 style={{ width: 10, height: 10, color: '#38bdf8' }} />
                    <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600 }}>Optimal</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#38bdf8', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                  {fmt(res.flatTax.total)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 14 }}>
                  Taux effectif : {res.flatTax.effectiveRate.toFixed(1)}%
                </p>
                {[
                  { label: 'Abattement', value: fmt(res.flatTax.abattement) },
                  { label: 'Base imposable IR', value: fmt(res.flatTax.baseIR) },
                  { label: 'Impôt sur le revenu', value: fmt(res.flatTax.ir) },
                  { label: 'Prélèvements sociaux', value: fmt(res.flatTax.ps) },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--section-border)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Barème card */}
            <div style={{
              background: 'var(--card-dark)',
              border: '1px solid var(--card-dark-border)',
              borderTop: '3px solid #fb923c',
              borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Barème progressif</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>TMI {tmi}%</p>
                </div>
                {res.recommended === 'bareme' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
                    <CheckCircle2 style={{ width: 10, height: 10, color: '#fb923c' }} />
                    <span style={{ fontSize: 10, color: '#fb923c', fontWeight: 600 }}>Optimal</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#fb923c', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>
                  {fmt(res.bareme.total)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 14 }}>
                  Taux effectif : {res.bareme.effectiveRate.toFixed(1)}%
                </p>
                {[
                  { label: 'Abattement', value: fmt(res.bareme.abattement) },
                  { label: 'Base imposable IR', value: fmt(res.bareme.baseIR) },
                  { label: 'Impôt sur le revenu', value: fmt(res.bareme.ir) },
                  { label: 'Prélèvements sociaux', value: fmt(res.bareme.ps) },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--section-border)' : 'none' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>CSG déductible</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(res.bareme.csgDed)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info box for dividends */}
          {incomeType === 'dividends' && (
            <div style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
              <span style={{ color: '#f1c086', fontWeight: 600 }}>Dividendes : </span>
              l&apos;abattement de 40% ne s&apos;applique qu&apos;au barème. La Flat Tax taxe le montant brut sans abattement — mais à seulement 30% fixe.
            </div>
          )}

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Charge fiscale selon le montant</p>
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
                <Line type="monotone" dataKey="flatTax" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bareme" stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key rules */}
          <div style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>À retenir</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: '#38bdf8', text: 'La Flat Tax (PFU) est avantageuse pour les TMI ≥ 30%.' },
                { color: '#fb923c', text: 'Le barème est souvent meilleur pour les TMI 0% et 11%, surtout sur les dividendes (abattement 40%).' },
                { color: '#34d399', text: 'Vous pouvez choisir le régime chaque année lors de votre déclaration.' },
                { color: '#f1c086', text: "La CSG déductible (6,8%) ne s'applique qu'au barème et réduit le revenu imposable N+1." },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ArrowRight style={{ width: 12, height: 12, color: item.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
