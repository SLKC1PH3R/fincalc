'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { CsvExport } from '@/components/CsvExport'

const COLOR = '#f472b6'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

function MortgagePageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<MortgageInputs>({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })
  const set = (k: keyof MortgageInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try { setInputs(JSON.parse(restoreParam) as MortgageInputs) } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcMortgage(inputs), [inputs])

  const interestRatio = r.totalInterest / inputs.amount * 100
  const score = interestRatio < 30 ? 'excellent' : interestRatio < 50 ? 'bon' : interestRatio < 80 ? 'moyen' : 'eleve'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    eleve: { label: 'Élevé', Icon: AlertCircle, color: '#f87171' },
  }[score]

  const tips: string[] = []
  if (inputs.rate > 4) tips.push('Taux > 4% : consultez un courtier, les économies sur la durée peuvent dépasser 20 000€.')
  if (inputs.years > 25) tips.push(`Durée de ${inputs.years} ans : réduire de 5 ans économiserait environ ${fmt(r.totalInterest * 0.25)} d'intérêts.`)
  if (r.totalInsurance > r.totalInterest * 0.3) tips.push('Assurance emprunteur élevée. La délégation d\'assurance peut économiser 30-50%.')
  if (interestRatio < 30) tips.push(`Excellent crédit — vous payez seulement ${fmtPct(interestRatio)} d'intérêts sur le capital.`)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>Prêt immobilier</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Simulateur de prêt</h1>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 400 }}>Mensualités · coût total · amortissement</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Prêt Immobilier',
            subtitle: `${fmt(inputs.amount)} sur ${inputs.years} ans à ${inputs.rate}%`,
            kpis: [
              { label: 'Mensualité totale', value: fmt(r.totalMonthly), highlight: true, sub: `dont ${fmt(r.monthlyPayment)} crédit` },
              { label: 'Intérêts totaux', value: fmt(r.totalInterest) },
              { label: 'Coût total crédit', value: fmt(r.totalCost) },
              { label: 'TAEG', value: `${r.taeg.toFixed(2)}%` },
            ],
            inputs: [
              { label: 'Montant emprunté', value: fmt(inputs.amount) },
              { label: 'Taux annuel', value: `${inputs.rate}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
              { label: 'Assurance mensuelle', value: fmt(inputs.insurance) },
              { label: 'Frais de dossier', value: fmt(inputs.fees) },
            ],
            sections: [{ title: 'Récapitulatif', items: [
              { label: 'Mensualité crédit seul', value: fmt(r.monthlyPayment) },
              { label: 'Total assurance', value: fmt(r.totalInsurance) },
              { label: 'Total intérêts', value: fmt(r.totalInterest) },
              { label: 'Coût total', value: fmt(r.totalCost) },
            ]}],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} @ ${inputs.rate}%`} inputs={inputs as any} results={r as any} />
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto' }} onClick={() => setInputs({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* Mensualité — highlighted */}
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, marginBottom: 6 }}>Mensualité totale</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: COLOR, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{fmt(r.totalMonthly)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>dont {fmt(r.monthlyPayment)} crédit</div>
        </div>
        {/* Others */}
        {[
          { label: 'Coût total du crédit', value: fmt(r.totalCost), sub: null },
          { label: 'Total intérêts', value: fmt(r.totalInterest), sub: `${fmtPct(interestRatio)} du capital` },
          { label: 'Taux effectif global', value: `${r.taeg.toFixed(2)}%`, sub: 'TAEG' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: k.sub ? 4 : 0 }}>{k.value}</div>
            {k.sub && <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12 }}>

        {/* Input panel */}
        <div>
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 0 }}>Paramètres</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label className="flex items-center gap-1">Montant emprunté<Tip text="Capital emprunté = Prix + frais notaire - apport. Base de calcul des mensualités." /></Label>
              <Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label className="flex items-center gap-1">Taux annuel<Tip text="Taux nominal hors assurance. En France 2024 : 3-4.5% selon la durée. Ne pas confondre avec le TAEG." /></Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.rate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {([{label:'Bas 15a', val:3.20},{label:'Moy 20a', val:3.65},{label:'Haut 25a', val:4.20}] as const).map(s => (
                  <button key={s.val} onClick={() => set('rate')(s.val)}
                    style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      background: inputs.rate === s.val ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                      border: inputs.rate === s.val ? `1px solid ${COLOR}35` : '1px solid var(--card-dark-border)',
                      color: inputs.rate === s.val ? COLOR : 'var(--text-muted-c)' }}>
                    {s.label}<br/><span style={{ fontWeight: 700 }}>{s.val}%</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 1 }}>Taux moyens France — mars 2026</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label className="flex items-center gap-1">Durée<Tip text="Plus la durée est longue : mensualités basses mais coût total élevé." /></Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted-c)' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('years')(15)}>15 ans</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('years')(20)}>20 ans</button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('years')(25)}>25 ans</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label className="flex items-center gap-1">Assurance (€/mois)<Tip text="Obligatoire. Couvre décès, invalidité. La délégation d'assurance peut économiser 30-50%." /></Label>
              <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} />
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {([
                  {label:'Faible', rate:0.10},
                  {label:'Normale', rate:0.25},
                  {label:'Haute', rate:0.40},
                ] as const).map(s => {
                  const suggested = Math.round(inputs.amount * s.rate / 100 / 12)
                  return (
                    <button key={s.label} onClick={() => set('insurance')(suggested)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: inputs.insurance === suggested ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.insurance === suggested ? `1px solid ${COLOR}35` : '1px solid var(--card-dark-border)',
                        color: inputs.insurance === suggested ? COLOR : 'var(--text-muted-c)' }}>
                      {s.label}<br/><span style={{ fontWeight: 700 }}>{suggested}€</span>
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 1 }}>0.10–0.40% du capital / an · délégation conseillée</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label className="flex items-center gap-1">Frais de dossier (€)<Tip text="Facturés par la banque. Généralement 0-1500€, souvent négociables." /></Label>
              <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} />
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                {([{label:'Neuf', val:800},{label:'Ancien', val:1200},{label:'Max', val:1500}] as const).map(s => (
                  <button key={s.label} onClick={() => set('fees')(s.val)}
                    style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                      background: inputs.fees === s.val ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                      border: inputs.fees === s.val ? `1px solid ${COLOR}35` : '1px solid var(--card-dark-border)',
                      color: inputs.fees === s.val ? COLOR : 'var(--text-muted-c)' }}>
                    {s.label}<br/><span style={{ fontWeight: 700 }}>{s.val}€</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 1 }}>Neuf ~800€ · Ancien ~1 200€ · souvent négociables</p>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Amortization chart */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Tableau d&apos;amortissement — {inputs.years} ans</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="mortgageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}55`, borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--text-primary)' }} labelStyle={{ color: COLOR }} />
                <Area type="monotone" dataKey="capitalRepaid" name="Remboursé" stroke={COLOR} fill="url(#mortgageGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="remaining" name="Restant dû" stroke={chart.lineDim} fill={chart.lineDim} fillOpacity={0.04} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <CsvExport
                data={r.chartData.map((d: { year: number; capitalRepaid: number; remaining: number }) => ({ 'Année': d.year, 'Capital remboursé': d.capitalRepaid.toFixed(0), 'Capital restant': d.remaining.toFixed(0), 'Intérêts payés': (r.totalInterest / inputs.years * d.year).toFixed(0) }))}
                filename="tableau-amortissement.csv"
              />
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Décomposition du coût</span>
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Capital', value: fmt(inputs.amount), pct: null },
                  { label: 'Intérêts', value: fmt(r.totalInterest), pct: fmtPct(interestRatio) },
                  { label: 'Assurance', value: fmt(r.totalInsurance), pct: null },
                  { label: 'Frais dossier', value: fmt(inputs.fees), pct: null },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted-c)' }}>{row.label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.value}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted-c)' }}>{row.pct ?? ''}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>Total déboursé</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{fmt(inputs.amount + r.totalCost)}</td>
                  <td style={{ padding: '10px 16px' }} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analyse — Conseil style */}
          <div style={{ background: `linear-gradient(135deg, ${COLOR}0d, rgba(255,255,255,0.02))`, border: `1px solid ${COLOR}22`, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: COLOR }}>Analyse — Ratio intérêts {scoreConf.label} ({fmtPct(interestRatio)})</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, marginBottom: tips.length ? 12 : 0 }}>
              Vous paierez {fmt(r.totalInterest)} d&apos;intérêts sur {fmt(inputs.amount)} emprunté ({inputs.years} ans à {inputs.rate}%).
              {interestRatio < 30 && ' Excellent ratio — crédit bien optimisé.'}
              {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
              {interestRatio >= 50 && ' Ratio élevé — envisagez de raccourcir la durée ou augmenter l\'apport.'}
            </p>
            {tips.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: COLOR }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MortgagePage() {
  return <Suspense><MortgagePageInner /></Suspense>
}
