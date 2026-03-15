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

  const scoreBorderColor = score === 'excellent' || score === 'bon' ? 'rgba(52,211,153,0.35)' : score === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Immobilier</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Simulateur de prêt immobilier</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>Calculez vos mensualités, le coût total de votre crédit et le tableau d&apos;amortissement.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          <Button variant="ghost" size="sm" onClick={() => setInputs({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Mensualité totale</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.totalMonthly)}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>dont {fmt(r.monthlyPayment)} crédit</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Coût total du crédit</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmt(r.totalCost)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total intérêts</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmt(r.totalInterest)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Taux effectif global</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{r.taeg.toFixed(2)}%</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Input panel */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Frais de dossier (€)<Tip text="Facturés par la banque. Généralement 0-1500€, souvent négociables." /></Label>
            <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} />
          </div>
        </div>

        {/* Results panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Amortization chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Tableau d&apos;amortissement</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 16 }}>Capital remboursé vs capital restant dû sur {inputs.years} ans</p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                <Area type="monotone" dataKey="capitalRepaid" name="Remboursé" stroke={chart.lineMain} fill={chart.lineMain} fillOpacity={0.1} strokeWidth={1.5} />
                <Area type="monotone" dataKey="remaining" name="Restant dû" stroke={chart.lineDim} fill={chart.lineDim} fillOpacity={0.05} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>

            {/* CSV export */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <CsvExport
                data={r.chartData.map((d: { year: number; capitalRepaid: number; remaining: number }) => ({ 'Année': d.year, 'Capital remboursé': d.capitalRepaid.toFixed(0), 'Capital restant': d.remaining.toFixed(0), 'Intérêts payés': (r.totalInterest / inputs.years * d.year).toFixed(0) }))}
                filename="tableau-amortissement.csv"
              />
            </div>
          </div>

          {/* Cost breakdown table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Capital', value: fmt(inputs.amount), pct: null },
                  { label: 'Intérêts', value: fmt(r.totalInterest), pct: fmtPct(interestRatio) },
                  { label: 'Assurance', value: fmt(r.totalInsurance), pct: null },
                  { label: 'Frais dossier', value: fmt(inputs.fees), pct: null },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted-c)' }}>{row.label}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.value}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 11, color: 'var(--text-muted-c)' }}>{row.pct ?? ''}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>Total déboursé</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>{fmt(inputs.amount + r.totalCost)}</td>
                  <td style={{ padding: '12px 18px' }} />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Analysis / tips */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreBorderColor}`, borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Analyse — Ratio intérêts {scoreConf.label} ({fmtPct(interestRatio)})
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 12 }}>
              Pour {fmt(inputs.amount)} emprunté sur {inputs.years} ans à {inputs.rate}%
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 16 }}>
              Vous paierez {fmt(r.totalInterest)} d&apos;intérêts, soit {fmtPct(interestRatio)} du capital.
              {interestRatio < 30 && ' Excellent ratio — crédit bien optimisé.'}
              {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
              {interestRatio >= 50 && ' Ratio élevé — envisagez de raccourcir la durée ou augmenter l\'apport.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MortgagePage() {
  return <Suspense><MortgagePageInner /></Suspense>
}
