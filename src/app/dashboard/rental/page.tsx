'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { CsvExport } from '@/components/CsvExport'
import { calcRental, type RentalInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, Plus, X, Settings2 } from 'lucide-react'
import { useCountUp } from '@/lib/use-count-up'
import { printReport } from '@/lib/print'
import { FieldTooltip } from '@/components/FieldTooltip'
import { SvgAreaChart, SvgBarChart, SvgDonut } from '@/components/SvgChart'

interface Apartment {
  id: string
  name: string
  inputs: RentalInputs
}

const DEFAULT_INPUTS: RentalInputs = {
  price: 200000, notaryFees: 8, works: 10000, rent: 900, charges: 100,
  taxeFonciere: 1200, insurance: 200, vacancy: 4, loanAmount: 160000,
  loanRate: 3.5, loanYears: 20, regime: 'nu', marginalRate: 30
}

const C = '#f59e0b'

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function CashflowTable({ r, inputs, label }: { r: ReturnType<typeof calcRental>; inputs: RentalInputs; label: string }) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
      {[
        { label: 'Loyers annuels bruts', value: fmt(r.annualRent), positive: true },
        { label: `Vacance locative (${inputs.vacancy}%)`, value: `−  ${fmt(r.annualVacancyLoss)}`, negative: true },
        { label: 'Charges non récupérables', value: `−  ${fmt(r.annualCharges)}`, negative: true },
        { label: 'Taxe foncière', value: `−  ${fmt(inputs.taxeFonciere)}`, negative: true },
        { label: 'Assurance PNO', value: `−  ${fmt(inputs.insurance)}`, negative: true },
        { label: 'Revenu net opérationnel', value: fmt(r.netOperatingIncome), bold: true, separator: true },
        { label: 'Remboursement crédit', value: `−  ${fmt(r.monthlyLoan * 12)}`, negative: true },
        ...(r.annualWorksDeduction > 0 && inputs.regime !== 'meuble' ? [{ label: `Amort. travaux (déd. ${fmt(r.annualWorksDeduction)}/an)`, value: `→ base imposable −${fmt(r.annualWorksDeduction)}`, negative: false }] : []),
        { label: `Impôts (${inputs.regime.toUpperCase()})`, value: `−  ${fmt(r.tax)}`, negative: true },
        { label: 'Cashflow annuel net', value: fmt(r.cashflowAnnual), bold: true, cashflow: true },
      ].map((row, i, arr) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
          borderBottom: i < arr.length - 1 ? '1px solid var(--p-line)' : 'none',
          background: row.cashflow
            ? (r.cashflowAnnual >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
            : (row as any).bold ? 'var(--p-card-2)' : 'transparent',
          borderTop: (row as any).separator ? '2px solid var(--p-line)' : 'none',
        }}>
          <span style={{ fontSize: 12, color: (row as any).bold ? 'var(--p-text-em)' : 'var(--p-text-dim)', fontWeight: (row as any).bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 12, fontWeight: (row as any).bold ? 700 : 500,
            fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)',
            color: row.cashflow
              ? (r.cashflowAnnual >= 0 ? '#34d399' : '#f87171')
              : (row as any).negative ? 'var(--p-text-dim)' : 'var(--p-text-em)',
          }}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function GlobalCashflowTable({ apartments, results }: { apartments: Apartment[]; results: ReturnType<typeof calcRental>[] }) {
  const totalAnnualRent = results.reduce((s, r) => s + r.annualRent, 0)
  const totalVacancyLoss = results.reduce((s, r) => s + r.annualVacancyLoss, 0)
  const totalCharges = results.reduce((s, r) => s + r.annualCharges, 0)
  const totalTaxeFonciere = apartments.reduce((s, a) => s + a.inputs.taxeFonciere, 0)
  const totalInsurance = apartments.reduce((s, a) => s + a.inputs.insurance, 0)
  const totalNOI = results.reduce((s, r) => s + r.netOperatingIncome, 0)
  const totalLoan = results.reduce((s, r) => s + r.monthlyLoan * 12, 0)
  const totalTax = results.reduce((s, r) => s + r.tax, 0)
  const totalCashflow = results.reduce((s, r) => s + r.cashflowAnnual, 0)

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
      {[
        { label: 'Loyers annuels bruts', value: fmt(totalAnnualRent) },
        { label: 'Vacance locative totale', value: `−  ${fmt(totalVacancyLoss)}`, negative: true },
        { label: 'Charges non récupérables', value: `−  ${fmt(totalCharges)}`, negative: true },
        { label: 'Taxes foncières', value: `−  ${fmt(totalTaxeFonciere)}`, negative: true },
        { label: 'Assurances PNO', value: `−  ${fmt(totalInsurance)}`, negative: true },
        { label: 'Revenu net opérationnel', value: fmt(totalNOI), bold: true, separator: true },
        { label: 'Remboursements crédit', value: `−  ${fmt(totalLoan)}`, negative: true },
        { label: 'Impôts totaux', value: `−  ${fmt(totalTax)}`, negative: true },
        { label: 'Cashflow annuel net global', value: fmt(totalCashflow), bold: true, cashflow: true },
      ].map((row, i, arr) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
          borderBottom: i < arr.length - 1 ? '1px solid var(--p-line)' : 'none',
          background: row.cashflow
            ? (totalCashflow >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
            : row.bold ? 'var(--p-card-2)' : 'transparent',
          borderTop: row.separator ? '2px solid var(--p-line)' : 'none',
        }}>
          <span style={{ fontSize: 12, color: row.bold ? 'var(--p-text-em)' : 'var(--p-text-dim)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 12, fontWeight: row.bold ? 700 : 500, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)',
            color: row.cashflow
              ? (totalCashflow >= 0 ? '#34d399' : '#f87171')
              : row.negative ? 'var(--p-text-dim)' : 'var(--p-text-em)',
          }}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function RentalPageInner() {
  const [apartments, setApartments] = useState<Apartment[]>([
    { id: '1', name: 'Appartement 1', inputs: { ...DEFAULT_INPUTS } }
  ])
  const [activeAptId, setActiveAptId] = useState('1')
  const [resultTab, setResultTab] = useState('global')

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const parsed = JSON.parse(restoreParam)
      if (parsed.apartments) {
        const migrated: Apartment[] = parsed.apartments.map((apt: any) => {
          if (apt.inputs) return { ...apt, id: apt.id ?? String(Date.now()) }
          return {
            id: apt.id ?? String(Date.now()),
            name: apt.name ?? apt.label ?? 'Appartement',
            inputs: { ...DEFAULT_INPUTS, price: apt.price ?? apt.purchasePrice ?? DEFAULT_INPUTS.price, rent: apt.rent ?? DEFAULT_INPUTS.rent, charges: apt.charges ?? DEFAULT_INPUTS.charges, taxeFonciere: apt.taxeFonciere ?? DEFAULT_INPUTS.taxeFonciere, works: apt.works ?? DEFAULT_INPUTS.works },
          }
        })
        setApartments(migrated)
        setActiveAptId(migrated[0].id)
      } else {
        setApartments([{ id: '1', name: 'Appartement 1', inputs: parsed as RentalInputs }])
      }
    } catch {}
  }, [restoreParam])

  const activeApt = apartments.find(a => a.id === activeAptId) ?? apartments[0]
  const inputs = activeApt.inputs

  const setApt = (k: keyof RentalInputs) => (v: unknown) =>
    setApartments(prev => prev.map(a => a.id === activeAptId ? { ...a, inputs: { ...a.inputs, [k]: v } } : a))

  const setAptName = (name: string) =>
    setApartments(prev => prev.map(a => a.id === activeAptId ? { ...a, name } : a))

  const addApartment = () => {
    const id = Date.now().toString()
    const n = apartments.length + 1
    const newApt: Apartment = { id, name: `Appartement ${n}`, inputs: { ...DEFAULT_INPUTS } }
    setApartments(prev => [...prev, newApt])
    setActiveAptId(id)
  }

  const removeApartment = (id: string) => {
    if (apartments.length === 1) return
    setApartments(prev => {
      const next = prev.filter(a => a.id !== id)
      if (activeAptId === id) setActiveAptId(next[0].id)
      return next
    })
    if (resultTab === id) setResultTab('global')
  }

  const results = useMemo(() => apartments.map(a => calcRental(a.inputs)), [apartments])
  const activeResult = results[apartments.findIndex(a => a.id === activeAptId)] ?? results[0]

  // Global aggregates
  const globalCashflowAnnual = useMemo(() => results.reduce((s, r) => s + r.cashflowAnnual, 0), [results])
  const globalCashflowMonthly = globalCashflowAnnual / 12
  const globalTotalInvestment = useMemo(() => results.reduce((s, r) => s + r.totalInvestment, 0), [results])
  const globalAnnualRent = useMemo(() => results.reduce((s, r) => s + r.annualRent, 0), [results])
  const globalNOI = useMemo(() => results.reduce((s, r) => s + r.netOperatingIncome, 0), [results])
  const globalGrossYield = globalTotalInvestment > 0 ? (globalAnnualRent / globalTotalInvestment) * 100 : 0
  const globalNetYield = globalTotalInvestment > 0 ? (globalNOI / globalTotalInvestment) * 100 : 0
  const globalEquity = useMemo(() => results.reduce((s, r, i) => s + (r.totalInvestment - apartments[i].inputs.loanAmount), 0), [results, apartments])
  const globalROI = globalEquity > 0 ? (globalCashflowAnnual / globalEquity) * 100 : 0
  const cashflowMonthlyAnimated = useCountUp(globalCashflowMonthly, 800)

  // Global score
  const globalScore = globalCashflowMonthly > 200 ? 'excellent' : globalCashflowMonthly >= 0 ? 'bon' : globalCashflowMonthly >= -100 ? 'moyen' : 'negatif'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Positif', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Effort', Icon: Minus, color: '#fbbf24' },
    negatif: { label: 'Négatif', Icon: AlertCircle, color: '#f87171' },
  }[globalScore]

  const activeTabResult = resultTab === 'global'
    ? null
    : results[apartments.findIndex(a => a.id === resultTab)]
  const activeTabApt = resultTab === 'global'
    ? null
    : apartments.find(a => a.id === resultTab)!

  // CsvExport data
  const csvRows = apartments.map((apt, idx) => {
    const r = results[idx]
    return {
      Nom: apt.name,
      'Prix achat': apt.inputs.price,
      'Loyer mensuel': apt.inputs.rent,
      'Rendement brut %': r.grossYield.toFixed(2),
      'Rendement net %': r.netYield.toFixed(2),
      'Cashflow mensuel': r.cashflowMonthly.toFixed(0),
      'Cashflow annuel': r.cashflowAnnual.toFixed(0),
      'NOI': r.netOperatingIncome.toFixed(0),
      'Mensualité crédit': r.monthlyLoan.toFixed(0),
      'Impôts annuels': r.tax.toFixed(0),
    }
  })

  // Active result for charts (the selected tab or active apartment)
  const displayResult = activeTabResult ?? activeResult
  const displayInputs = activeTabApt?.inputs ?? inputs

  // Bar chart data: cashflow breakdown for display result
  const barChartData = useMemo(() => [{
    name: 'Revenu annuel',
    loyer: displayResult.annualRent,
    charges: displayResult.annualCharges + displayInputs.taxeFonciere + displayInputs.insurance + displayResult.annualVacancyLoss,
    credit: displayResult.monthlyLoan * 12,
    impots: displayResult.tax,
    cashflow: Math.max(displayResult.cashflowAnnual, 0),
  }], [displayResult, displayInputs])

  // Area chart — cashflow projection over years (simple: assume stable)
  const areaChartData = useMemo(() => {
    return Array.from({ length: 21 }, (_, y) => ({
      year: y,
      loyer: displayResult.annualRent * (1 + 0.02) ** y,
      noi: displayResult.netOperatingIncome * (1 + 0.02) ** y,
      cashflow: displayResult.cashflowAnnual * (1 + 0.02) ** y,
    }))
  }, [displayResult])

  // Donut data
  const donutData = useMemo(() => [
    { label: 'Loyer net op.', value: displayResult.netOperatingIncome, color: '#818cf8' },
    { label: 'Crédit', value: displayResult.monthlyLoan * 12, color: '#f87171' },
    { label: 'Impôts', value: displayResult.tax, color: '#e879f9' },
    { label: 'Cashflow net', value: Math.max(displayResult.cashflowAnnual, 0), color: '#34d399' },
  ].filter(d => d.value > 0), [displayResult])

  const tips = [
    { title: 'Rendement brut > 7%', body: 'Un rendement brut supérieur à 7% est généralement nécessaire pour viser un cashflow positif avec crédit.', color: C },
    { title: 'LMNP réel — zéro fiscalité', body: 'Le LMNP réel amortit le bien sur 25-30 ans, réduisant quasi à zéro la fiscalité sur les revenus locatifs.', color: '#818cf8' },
    { title: 'Vacance souvent sous-estimée', body: 'La vacance locative est souvent sous-estimée — prévoyez 1 mois/an minimum (8%).', color: '#34d399' },
    { title: 'Cashflow négatif ≠ mauvais deal', body: 'Un cashflow légèrement négatif peut être acceptable si la plus-value à terme compense.', color: '#60a5fa' },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Rentabilité Locative</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Rentabilité Locative<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Cashflow net · Rendement brut/net · ROI. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Nu, meublé, LMNP.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Rentabilité Locative',
            subtitle: `${apartments.length} appartement${apartments.length > 1 ? 's' : ''} — Investissement total : ${fmt(globalTotalInvestment)}`,
            kpis: [
              { label: 'Cashflow mensuel global', value: fmt(globalCashflowMonthly), highlight: true, sub: `${fmt(globalCashflowAnnual)}/an` },
              { label: 'Rendement brut moyen', value: fmtPct(globalGrossYield) },
              { label: 'Rendement net moyen', value: fmtPct(globalNetYield) },
              { label: 'ROI fonds propres', value: fmtPct(globalROI) },
            ],
            sections: apartments.map((apt, idx) => ({
              title: apt.name,
              items: [
                { label: 'Prix achat', value: fmt(apt.inputs.price) },
                { label: 'Loyer mensuel', value: fmt(apt.inputs.rent) },
                { label: 'Cashflow mensuel', value: fmt(results[idx].cashflowMonthly) },
                { label: 'Rendement brut', value: fmtPct(results[idx].grossYield) },
                { label: 'Rendement net', value: fmtPct(results[idx].netYield) },
              ]
            })),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation
            type="rental"
            name={`${apartments.length} appart. – ${fmt(globalCashflowMonthly)}/mois`}
            inputs={{ apartments } as unknown as Record<string, unknown>}
            results={{ globalCashflowMonthly, globalGrossYield, globalNetYield, globalROI } as unknown as Record<string, unknown>}
          />
          <Button variant="outline" size="sm" onClick={() => {
            setApartments([{ id: '1', name: 'Appartement 1', inputs: { ...DEFAULT_INPUTS } }])
            setActiveAptId('1')
            setResultTab('global')
          }} style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: GAP }}>
        <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${globalCashflowMonthly >= 0 ? '#34d399' : '#f87171'}0e 0%, transparent 55%), var(--p-card)` }}>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6 }}>Cashflow mensuel</div>
            <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: globalCashflowMonthly >= 0 ? '#34d399' : '#f87171', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{fmtK(cashflowMonthlyAnimated)}</div>
            <div style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{fmtK(globalCashflowAnnual)}/an</div>
          </div>
        </div>
        {[
          { label: 'Rendement brut', value: fmtPct(globalGrossYield), sub: 'loyers / investissement' },
          { label: 'Rendement net', value: fmtPct(globalNetYield), sub: 'après charges & fiscalité' },
          { label: 'ROI fonds propres', value: fmtPct(globalROI), sub: 'cashflow / apport' },
        ].map((k, i) => (
          <div key={i} style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Apartment tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {apartments.map((apt) => (
              <div key={apt.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => setActiveAptId(apt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    ...(activeAptId === apt.id
                      ? { background: `${C}14`, border: `1px solid ${C}28`, color: 'var(--p-text-em)' }
                      : { border: '1px solid transparent', color: 'var(--p-text-dim)', background: 'transparent' })
                  }}
                >
                  {apt.name}
                </button>
                {apartments.length > 1 && (
                  <button
                    onClick={() => removeApartment(apt.id)}
                    style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: '#ef4444cc', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >
                    <X style={{ width: 9, height: 9 }} />
                  </button>
                )}
              </div>
            ))}
            {apartments.length < 6 && (
              <button
                onClick={addApartment}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, fontSize: 12, border: '1px dashed var(--p-line)', color: 'var(--p-text-faint)', background: 'transparent', cursor: 'pointer' }}
              >
                <Plus style={{ width: 12, height: 12 }} />Ajouter
              </button>
            )}
          </div>

          {/* Apartment name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={labelSt}>Nom du bien</label>
            <Input value={activeApt.name} onChange={e => setAptName(e.target.value)} style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }} />
          </div>

          {/* Acquisition panel */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 style={{ width: 13, height: 13, color: C }} />
              <div style={eyebrow}>Acquisition</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Prix d&apos;achat<FieldTooltip text="Prix FAI. Les frais de notaire s'ajoutent en pourcentage ci-dessous." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.price} onChange={e => setApt('price')(+e.target.value)}
                    style={{ height: 40, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Frais de notaire<FieldTooltip text="~8% dans l'ancien, ~3% dans le neuf." /></label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.notaryFees}%</span>
                </div>
                <Slider min={2} max={10} step={0.5} value={[inputs.notaryFees]} onValueChange={([v]) => setApt('notaryFees')(v)} />
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Travaux<FieldTooltip text="Budget travaux/rénovation initial. Inclus dans l'investissement total." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.works} onChange={e => setApt('works')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Montant emprunté<FieldTooltip text="Capital emprunté. Laissez 0 pour un achat cash." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.loanAmount} onChange={e => setApt('loanAmount')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Taux crédit</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.loanRate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => setApt('loanRate')(v)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={labelSt}>Durée crédit</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.loanYears} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.loanYears]} onValueChange={([v]) => setApt('loanYears')(v)} />
              </div>
            </div>
          </div>

          {/* Exploitation & Fiscalité panel */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Exploitation &amp; Fiscalité</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Loyer mensuel HC<FieldTooltip text="Loyer hors charges. Base de calcul du rendement." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.rent} onChange={e => setApt('rent')(+e.target.value)}
                    style={{ height: 40, fontSize: 14, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Charges mensuelles<FieldTooltip text="Charges non récupérables sur le locataire : copropriété, entretien..." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.charges} onChange={e => setApt('charges')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Taxe foncière (/an)<FieldTooltip text="Taxe foncière annuelle — à votre charge en tant que propriétaire." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.taxeFonciere} onChange={e => setApt('taxeFonciere')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Assurance PNO (/an)<FieldTooltip text="Assurance Propriétaire Non Occupant — obligatoire en copropriété." /></label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={inputs.insurance} onChange={e => setApt('insurance')(+e.target.value)}
                    style={{ height: 36, fontSize: 13, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Taux de vacance<FieldTooltip text="Pourcentage du temps sans locataire. 4-8% est réaliste." /></label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.vacancy}%</span>
                </div>
                <Slider min={0} max={20} step={0.5} value={[inputs.vacancy]} onValueChange={([v]) => setApt('vacancy')(v)} />
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 4 }}>Régime fiscal<FieldTooltip text="Nu : revenus fonciers. Meublé micro-BIC : 50% abattement. LMNP réel : amortissement." /></label>
                <Select value={inputs.regime} onValueChange={v => setApt('regime')(v as RentalInputs['regime'])}>
                  <SelectTrigger style={{ height: 36, fontSize: 13, borderRadius: 10, background: 'var(--p-card-2)' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nu">Location nue (rev. fonciers)</SelectItem>
                    <SelectItem value="meuble">Meublé micro-BIC (50% abatt.)</SelectItem>
                    <SelectItem value="lmnp">LMNP réel (amortissement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inputs.regime !== 'lmnp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label style={labelSt}>Votre TMI</label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{inputs.marginalRate}%</span>
                  </div>
                  <Slider min={0} max={45} step={1} value={[inputs.marginalRate]} onValueChange={([v]) => setApt('marginalRate')(v)} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Rendement net · {activeApt.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtPct(activeResult.netYield)}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Brut</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: C, marginTop: 2 }}>{fmtPct(activeResult.grossYield)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Cashflow/mois</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: activeResult.cashflowMonthly >= 0 ? '#34d399' : '#f87171', marginTop: 2 }}>{fmtK(activeResult.cashflowMonthly)}</div>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Investissement total', value: fmtK(activeResult.totalInvestment) },
                  { label: 'Mensualité crédit', value: fmtK(activeResult.monthlyLoan) },
                  { label: 'NOI annuel', value: fmtK(activeResult.netOperatingIncome) },
                  { label: 'Impôts annuels', value: fmtK(activeResult.tax), color: '#f87171' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result tabs */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div>
                <div style={eyebrow}>Décomposition du cashflow</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>
                  {resultTab === 'global'
                    ? `Global — ${apartments.length} appartement${apartments.length > 1 ? 's' : ''}`
                    : activeTabApt?.name ?? ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <button onClick={() => setResultTab('global')} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', ...(resultTab === 'global' ? { background: `${C}14`, border: `1px solid ${C}28`, color: 'var(--p-text-em)' } : { border: '1px solid transparent', color: 'var(--p-text-dim)', background: 'transparent' }) }}>Global</button>
                {apartments.map((apt) => (
                  <button key={apt.id} onClick={() => setResultTab(apt.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', ...(resultTab === apt.id ? { background: `${C}14`, border: `1px solid ${C}28`, color: 'var(--p-text-em)' } : { border: '1px solid transparent', color: 'var(--p-text-dim)', background: 'transparent' }) }}>{apt.name}</button>
                ))}
              </div>
            </div>
            {/* Bar chart: income breakdown */}
            <div style={{ padding: '10px 12px 6px' }}>
              <SvgBarChart
                data={barChartData}
                xKey="name"
                bars={[
                  { key: 'loyer', label: 'Loyer brut', color: '#818cf8' },
                  { key: 'charges', label: 'Charges/vacance', color: '#f472b6' },
                  { key: 'credit', label: 'Crédit', color: '#f87171' },
                  { key: 'impots', label: 'Impôts', color: '#e879f9' },
                  { key: 'cashflow', label: 'Cashflow net', color: '#34d399' },
                ]}
                height={200}
                yFormat={v => v >= 1000 ? `${Math.round(v / 1000)}k€` : `${Math.round(v)}€`}
              />
            </div>
          </div>

          {/* Cashflow table */}
          {resultTab === 'global' ? (
            <GlobalCashflowTable apartments={apartments} results={results} />
          ) : activeTabResult && activeTabApt ? (
            <CashflowTable r={activeTabResult} inputs={activeTabApt.inputs} label={activeTabApt.name} />
          ) : null}

          {/* Area chart: projection loyer/noi/cashflow */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Projection sur 20 ans</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Évolution estimée avec revalorisation loyer +2%/an</div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <SvgAreaChart
                data={areaChartData}
                xKey="year"
                series={[
                  { key: 'loyer', label: 'Loyer brut', color: '#818cf8' },
                  { key: 'noi', label: 'Rev. net opérationnel', color: C },
                  { key: 'cashflow', label: 'Cashflow net', color: '#34d399' },
                ]}
                height={260}
                xFormat={v => `${v}a`}
              />
            </div>
          </div>

          {/* Per-apartment mini KPIs when global */}
          {resultTab === 'global' && apartments.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-faint)' }}>Par appartement</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {apartments.map((apt, idx) => {
                  const r = results[idx]
                  return (
                    <div key={apt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--p-text-em)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{fmtPct(r.grossYield)} brut</span>
                        <span style={{ fontSize: 11, color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{fmtPct(r.netYield)} net</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)', color: r.cashflowMonthly >= 0 ? '#34d399' : '#f87171' }}>
                          {fmtK(r.cashflowMonthly)}/mois
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CSV Export */}
          <CsvExport data={csvRows} filename="rentabilite-locative" />
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Score analyse */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${scoreConf.color}` }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
              <div style={{ ...eyebrow, color: scoreConf.color }}>Analyse — Cashflow {scoreConf.label}</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, marginBottom: apartments.length === 1 && activeResult.analysis.tips.length > 0 ? 12 : 0 }}>
                {apartments.length === 1
                  ? activeResult.analysis.message
                  : `Votre portefeuille de ${apartments.length} biens génère ${fmtK(globalCashflowMonthly)}/mois (${fmtK(globalCashflowAnnual)}/an) pour ${fmtK(globalTotalInvestment)} investis. Rendement brut : ${fmtPct(globalGrossYield)}, net : ${fmtPct(globalNetYield)}, ROI : ${fmtPct(globalROI)}.`}
              </p>
              {apartments.length === 1 && activeResult.analysis.tips.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeResult.analysis.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${scoreConf.color}18`, border: `1px solid ${scoreConf.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: scoreConf.color }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--p-text-mid)', lineHeight: 1.6 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Donut */}
          {donutData.length > 0 && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition annuelle</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>{activeApt.name}</div>
              </div>
              <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <SvgDonut
                  segments={donutData}
                  width={150}
                  height={110}
                  outerRadius={48}
                  innerRadius={30}
                />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {donutData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{d.label}</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{fmtK(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils investisseur</div>
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
                { label: 'SCPI', href: '/dashboard/scpi' },
                { label: 'Prêt immobilier', href: '/dashboard/mortgage' },
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
    </div>
  )
}

export default function RentalPage() { return <Suspense><RentalPageInner /></Suspense> }
