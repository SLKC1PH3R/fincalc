'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcFlatTax, type FlatTaxInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

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

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Fiscalité du capital</p>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Flat Tax vs Barème IR
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
          Comparez le Prélèvement Forfaitaire Unique (30%) et le barème progressif pour vos revenus du capital.
        </p>
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
              Revenus d'activité annuels (€)
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

          <SaveSimulation type="flat-tax" name="Flat Tax vs Barème" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Recommendation banner */}
          <div style={{ background: recColor + '12', border: `1px solid ${recColor}30`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: recColor, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                Régime recommandé : <span style={{ color: recColor }}>{recLabel}</span>
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>
                Économie de {fmt(res.saving)} par rapport à l'autre régime · Taux effectif {res[res.recommended].effectiveRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Comparison table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--card-dark-border)' }}>
              <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Poste</div>
              <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#38bdf8', borderLeft: '1px solid var(--card-dark-border)' }}>Flat Tax (PFU 30%)</div>
              <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#fb923c', borderLeft: '1px solid var(--card-dark-border)' }}>Barème IR</div>
            </div>
            {[
              { label: 'Abattement', ft: fmt(res.flatTax.abattement), bm: fmt(res.bareme.abattement) },
              { label: 'CSG déductible', ft: '—', bm: fmt(res.bareme.csgDed) },
              { label: 'Base imposable IR', ft: fmt(res.flatTax.baseIR), bm: fmt(res.bareme.baseIR) },
              { label: 'Impôt sur le revenu', ft: fmt(res.flatTax.ir), bm: fmt(res.bareme.ir) },
              { label: 'Prélèvements sociaux', ft: fmt(res.flatTax.ps), bm: fmt(res.bareme.ps) },
              { label: 'Total prélevé', ft: fmt(res.flatTax.total), bm: fmt(res.bareme.total), highlight: true },
              { label: 'Taux effectif', ft: res.flatTax.effectiveRate.toFixed(1) + '%', bm: res.bareme.effectiveRate.toFixed(1) + '%', highlight: true },
            ].map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--card-dark-border)' }}>
                <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted-c)' }}>{row.label}</div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: row.highlight ? 700 : 400, color: row.highlight ? (res.recommended === 'flat_tax' ? '#38bdf8' : 'var(--text-em)') : 'var(--text-em)', borderLeft: '1px solid var(--card-dark-border)' }}>
                  {row.ft}
                  {row.highlight && res.recommended === 'flat_tax' && <CheckCircle2 style={{ width: 11, height: 11, color: '#34d399', marginLeft: 5, display: 'inline' }} />}
                </div>
                <div style={{ padding: '10px 16px', fontSize: 12, fontWeight: row.highlight ? 700 : 400, color: row.highlight ? (res.recommended === 'bareme' ? '#fb923c' : 'var(--text-em)') : 'var(--text-em)', borderLeft: '1px solid var(--card-dark-border)' }}>
                  {row.bm}
                  {row.highlight && res.recommended === 'bareme' && <CheckCircle2 style={{ width: 11, height: 11, color: '#34d399', marginLeft: 5, display: 'inline' }} />}
                </div>
              </div>
            ))}
          </div>

          {/* Info box for dividends */}
          {incomeType === 'dividends' && (
            <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>Dividendes :</span> l'abattement de 40% ne s'applique qu'au barème. La Flat Tax taxe le montant brut sans abattement — mais à seulement 30% fixe.
            </div>
          )}

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '20px 16px' }}>
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
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>À retenir</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: '#38bdf8', text: 'La Flat Tax (PFU) est avantageuse pour les TMI ≥ 30%.' },
                { color: '#fb923c', text: 'Le barème est souvent meilleur pour les TMI 0% et 11%, surtout sur les dividendes (abattement 40%).' },
                { color: '#34d399', text: 'Vous pouvez choisir le régime chaque année lors de votre déclaration.' },
                { color: '#fbbf24', text: 'La CSG déductible (6,8%) ne s\'applique qu\'au barème et réduit le revenu imposable N+1.' },
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
