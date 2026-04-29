'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcMortgage, type MortgageInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, Building2, Settings2 } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { CsvExport } from '@/components/CsvExport'
import { FieldTooltip } from '@/components/FieldTooltip'

const COLOR = '#38bdf8'

function MortgagePageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<MortgageInputs>({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })
  const set = (k: keyof MortgageInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem('mortgage-banner-dismissed')
  })

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

  const pieData = [
    { name: 'Capital', value: inputs.amount, fill: COLOR },
    { name: 'Intérêts', value: Math.round(r.totalInterest), fill: '#f87171' },
    { name: 'Assurance', value: Math.round(r.totalInsurance), fill: '#fbbf24' },
    { name: 'Frais', value: inputs.fees, fill: '#a78bfa' },
  ]

  const scoreBg = score === 'excellent' || score === 'bon'
    ? 'rgba(52,211,153,0.06)' : score === 'moyen'
    ? 'rgba(251,191,36,0.06)' : 'rgba(248,113,113,0.08)'
  const scoreBorder = score === 'excellent' || score === 'bon'
    ? 'rgba(52,211,153,0.18)' : score === 'moyen'
    ? 'rgba(251,191,36,0.18)' : 'rgba(248,113,113,0.22)'

  return (
    <div style={{ padding: '20px 24px 48px', background: 'var(--p-bg)' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Prêt Immobilier</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--p-text)', margin: 0, letterSpacing: '-0.3px' }}>Prêt Immobilier</h1>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>Mensualités · TAEG · Coût total du crédit</p>
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
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="mortgage" name={`Prêt ${fmt(inputs.amount)} @ ${inputs.rate}%`} inputs={inputs as any} results={r as any} />
            <Button variant="outline" size="sm" style={{ borderColor: 'var(--p-line)', color: 'var(--p-text-dim)' }} onClick={() => setInputs({ amount: 240000, rate: 3.5, years: 20, insurance: 80, fees: 5000 })}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* Bon à savoir banner */}
      {!bannerDismissed && (
        <div style={{ marginBottom: 16, background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 3 }}>Bon à savoir — Prêt immobilier</p>
            <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0, lineHeight: 1.5 }}>
              Le TAEG inclut les frais de dossier, l'assurance et les frais de garantie. Pour comparer deux offres, comparez toujours le coût total, pas seulement le taux nominal.
            </p>
          </div>
          <button onClick={() => { localStorage.setItem('mortgage-banner-dismissed', '1'); setBannerDismissed(true) }} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 16, lineHeight: 1, padding: 2 }} aria-label="Fermer">×</button>
        </div>
      )}

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 style={{ width: 12, height: 12, color: COLOR }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Montant */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Montant emprunté (€) <FieldTooltip text="Capital emprunté = Prix + frais notaire - apport. Base de calcul des mensualités." />
                </Label>
                <Input type="number" value={inputs.amount} onChange={e => set('amount')(+e.target.value)} style={{ height: 36, fontSize: 13, fontWeight: 600 }} />
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Taux */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Taux annuel <FieldTooltip text="Taux nominal hors assurance. En France 2024 : 3-4.5% selon la durée." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.rate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Bas 15a', val: 3.20 }, { label: 'Moy 20a', val: 3.65 }, { label: 'Haut 25a', val: 4.20 }] as const).map(s => (
                    <button key={s.val} onClick={() => set('rate')(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: inputs.rate === s.val ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.rate === s.val ? `1px solid ${COLOR}35` : '1px solid var(--p-line)',
                        color: inputs.rate === s.val ? COLOR : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}%</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0 }}>Taux moyens France — mars 2026</p>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Durée <FieldTooltip text="Plus la durée est longue : mensualités basses mais coût total élevé." />
                  </Label>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLOR }}>{inputs.years} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--p-text-dim)' }}>
                  {[15, 20, 25].map(y => (
                    <button key={y} onClick={() => set('years')(y)}
                      style={{ background: inputs.years === y ? `${COLOR}18` : 'transparent', border: inputs.years === y ? `1px solid ${COLOR}35` : '1px solid transparent', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', color: inputs.years === y ? COLOR : 'var(--p-text-dim)', fontSize: 11, transition: 'all 0.15s' }}>
                      {y} ans
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Assurance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Assurance (€/mois) <FieldTooltip text="Obligatoire. Couvre décès, invalidité. La délégation d'assurance peut économiser 30-50%." />
                </Label>
                <Input type="number" value={inputs.insurance} onChange={e => set('insurance')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Faible', rate: 0.10 }, { label: 'Normale', rate: 0.25 }, { label: 'Haute', rate: 0.40 }] as const).map(s => {
                    const suggested = Math.round(inputs.amount * s.rate / 100 / 12)
                    return (
                      <button key={s.label} onClick={() => set('insurance')(suggested)}
                        style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                          background: inputs.insurance === suggested ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                          border: inputs.insurance === suggested ? `1px solid ${COLOR}35` : '1px solid var(--p-line)',
                          color: inputs.insurance === suggested ? COLOR : 'var(--p-text-dim)' }}>
                        {s.label}<br /><span style={{ fontWeight: 700 }}>{suggested}€</span>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0 }}>0.10–0.40% du capital / an · délégation conseillée</p>
              </div>

              <div style={{ height: 1, background: 'var(--p-line)' }} />

              {/* Frais dossier */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label style={{ fontSize: 11, color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Frais de dossier (€) <FieldTooltip text="Facturés par la banque. Généralement 0-1500€, souvent négociables." />
                </Label>
                <Input type="number" value={inputs.fees} onChange={e => set('fees')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Neuf', val: 800 }, { label: 'Ancien', val: 1200 }, { label: 'Max', val: 1500 }] as const).map(s => (
                    <button key={s.label} onClick={() => set('fees')(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: inputs.fees === s.val ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: inputs.fees === s.val ? `1px solid ${COLOR}35` : '1px solid var(--p-line)',
                        color: inputs.fees === s.val ? COLOR : 'var(--p-text-dim)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}€</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER: KPIs + chart + amortization table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Mensualité totale', value: fmt(r.totalMonthly), sub: `dont ${fmt(r.monthlyPayment)} crédit`, color: COLOR },
              { label: 'Coût total crédit', value: fmt(r.totalCost), sub: null, color: 'var(--p-text)' },
              { label: 'Total intérêts', value: fmt(r.totalInterest), sub: `${fmtPct(interestRatio)} du capital`, color: 'var(--p-text)' },
              { label: 'TAEG', value: `${r.taeg.toFixed(2)}%`, sub: 'Taux effectif global', color: 'var(--p-text)' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{kpi.value}</p>
                {kpi.sub && <p style={{ fontSize: 10, color: 'var(--p-text-dim)', margin: 0 }}>{kpi.sub}</p>}
              </div>
            ))}
          </div>

          {/* Amortization chart */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ padding: '0 0 12px', borderBottom: '1px solid var(--p-line)', marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Tableau d&apos;amortissement</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Capital remboursé vs restant dû sur {inputs.years} ans</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="mortgageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLOR} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={{ background: 'var(--p-card)', border: `1px solid ${COLOR}55`, borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'var(--p-text)' }} labelStyle={{ color: COLOR }} />
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

          {/* Décomposition du coût */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Décomposition du coût</p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Total déboursé sur {inputs.years} ans</p>
            </div>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Capital', value: fmt(inputs.amount), pct: null },
                  { label: 'Intérêts', value: fmt(r.totalInterest), pct: fmtPct(interestRatio) },
                  { label: 'Assurance', value: fmt(r.totalInsurance), pct: null },
                  { label: 'Frais dossier', value: fmt(inputs.fees), pct: null },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--p-line)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--p-text-dim)' }}>{row.label}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text-em)' }}>{row.value}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--p-text-dim)' }}>{row.pct ?? ''}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--p-text-em)' }}>Total déboursé</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--p-text)' }}>{fmt(inputs.amount + r.totalCost)}</td>
                  <td style={{ padding: '10px 16px' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: analyse + donut + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse */}
          <div style={{ background: scoreBg, border: `1px solid ${scoreBorder}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${scoreConf.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Analyse du crédit</p>
                <p style={{ fontSize: 11, color: scoreConf.color, margin: 0 }}>Ratio intérêts : {scoreConf.label}</p>
              </div>
            </div>

            {/* Barre répartition */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--p-row-hover)', marginBottom: 8 }}>
                <div style={{ background: COLOR, transition: 'width 0.5s', width: `${inputs.amount / (inputs.amount + r.totalCost) * 100}%` }} />
                <div style={{ background: '#f87171', transition: 'width 0.5s', width: `${r.totalInterest / (inputs.amount + r.totalCost) * 100}%` }} />
                <div style={{ background: '#fbbf24', transition: 'width 0.5s', width: `${r.totalInsurance / (inputs.amount + r.totalCost) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[[COLOR, `Capital ${Math.round(inputs.amount / (inputs.amount + r.totalCost) * 100)}%`], ['#f87171', `Intérêts ${Math.round(r.totalInterest / (inputs.amount + r.totalCost) * 100)}%`], ['#fbbf24', `Assu. ${Math.round(r.totalInsurance / (inputs.amount + r.totalCost) * 100)}%`]].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block', flexShrink: 0 }} />{label}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, margin: 0 }}>
              Vous paierez {fmt(r.totalInterest)} d&apos;intérêts sur {fmt(inputs.amount)} emprunté ({inputs.years} ans à {inputs.rate}%).
              {interestRatio < 30 && ' Excellent ratio — crédit bien optimisé.'}
              {interestRatio >= 30 && interestRatio < 50 && ' Ratio acceptable — cherchez à négocier le taux ou raccourcir la durée.'}
              {interestRatio >= 50 && ' Ratio élevé — envisagez de raccourcir la durée ou augmenter l\'apport.'}
            </p>
          </div>

          {/* Donut Capital / Intérêts */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: '0 0 12px' }}>Répartition du total déboursé</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
                {pieData.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.fill, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{e.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(e.value)}</span>
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', marginLeft: 5 }}>{Math.round(e.value / (inputs.amount + r.totalCost) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Résumé du prêt */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>Résumé du prêt</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Mensualité (crédit)', value: fmt(r.monthlyPayment) },
                { label: 'Mensualité totale', value: fmt(r.totalMonthly), color: COLOR },
                { label: 'TAEG', value: `${r.taeg.toFixed(2)}%` },
                { label: 'Coût total crédit', value: fmt(r.totalCost) },
                { label: 'Total déboursé', value: fmt(inputs.amount + r.totalCost), color: '#f87171' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color ?? 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          {tips.length > 0 && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>Conseils</p>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function MortgagePage() {
  return <Suspense><MortgagePageInner /></Suspense>
}
