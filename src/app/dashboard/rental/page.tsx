'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sankey, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { CsvExport } from '@/components/CsvExport'
import { calcRental, type RentalInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, Plus, X, Wallet, Settings2, ArrowRight } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useTheme } from '@/contexts/ThemeContext'
import { FieldTooltip } from '@/components/FieldTooltip'

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

const COLOR = '#f59e0b'

// ── Sankey helpers ──────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, string> = {
  'Loyers':         '#818cf8',
  'Effort mensuel': '#fb923c',
  'Vacance':        '#f472b6',
  'Charges':        '#c084fc',
  'Taxe foncière':  '#60a5fa',
  'Assurance':      '#2dd4bf',
  'Rev. net op.':   '#fdba74',
  'Crédit':         '#f87171',
  'Impôts':         '#e879f9',
  'Cashflow net':   '#34d399',
}
const LEFT_NODES = new Set(['Loyers', 'Effort mensuel'])

function buildSankeyData(
  annualRent: number, vacancyLoss: number, annualCharges: number,
  taxe: number, assurance: number, noi: number,
  credit: number, impots: number, cashflow: number
) {
  const nodes: { name: string }[] = []
  const links: { source: number; target: number; value: number }[] = []
  const add = (name: string) => { nodes.push({ name }); return nodes.length - 1 }

  const iLoyers   = add('Loyers')
  const iEffort   = cashflow < 0 ? add('Effort mensuel') : -1
  const iVacance  = vacancyLoss  > 10 ? add('Vacance')       : -1
  const iCharges  = annualCharges > 10 ? add('Charges')       : -1
  const iTaxe     = taxe          > 10 ? add('Taxe foncière') : -1
  const iAssur    = assurance     > 10 ? add('Assurance')     : -1
  const iNOI      = add('Rev. net op.')
  const iCredit   = credit  > 10 ? add('Crédit')       : -1
  const iImpots   = impots  > 10 ? add('Impôts')       : -1
  const iCashflow = cashflow > 10 ? add('Cashflow net') : -1

  if (iVacance >= 0) links.push({ source: iLoyers, target: iVacance, value: Math.round(vacancyLoss) })
  if (iCharges >= 0) links.push({ source: iLoyers, target: iCharges, value: Math.round(annualCharges) })
  if (iTaxe >= 0)    links.push({ source: iLoyers, target: iTaxe,    value: Math.round(taxe) })
  if (iAssur >= 0)   links.push({ source: iLoyers, target: iAssur,   value: Math.round(assurance) })
  links.push({ source: iLoyers, target: iNOI, value: Math.max(Math.round(noi), 1) })
  if (iEffort >= 0)  links.push({ source: iEffort, target: iNOI,    value: Math.round(Math.abs(cashflow)) })
  if (iCredit >= 0)  links.push({ source: iNOI,    target: iCredit, value: Math.round(credit) })
  if (iImpots >= 0)  links.push({ source: iNOI,    target: iImpots, value: Math.round(impots) })
  if (iCashflow >= 0) links.push({ source: iNOI,   target: iCashflow, value: Math.round(cashflow) })

  return { nodes, links }
}

function CustomSankeyNode(props: {
  x?: number; y?: number; width?: number; height?: number
  payload?: { name: string; value: number }
  theme?: string
}) {
  const { x = 0, y = 0, width = 26, height = 0, payload, theme } = props
  if (!payload || height < 1) return null
  const name = payload.name
  const color = NODE_COLORS[name] ?? '#94a3b8'
  const isLeft = LEFT_NODES.has(name)
  const labelX = isLeft ? x - 12 : x + width + 12
  const anchor = isLeft ? 'end' : 'start'
  const midY = y + height / 2
  const valueFill = theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)'
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.90} rx={4} />
      <text x={labelX} y={midY - 8} textAnchor={anchor} fill={color} fontSize={12} fontWeight={700} dominantBaseline="middle">{name}</text>
      <text x={labelX} y={midY + 8} textAnchor={anchor} fill={valueFill} fontSize={11} fontWeight={500} dominantBaseline="middle">{fmt(payload.value)}</text>
    </g>
  )
}

function CustomSankeyLink(props: {
  sourceX?: number; sourceY?: number; sourceControlX?: number
  targetX?: number; targetY?: number; targetControlX?: number
  linkWidth?: number; payload?: { source: { name: string }; target: { name: string } }
}) {
  const { sourceX = 0, sourceY = 0, sourceControlX = 0, targetX = 0, targetY = 0, targetControlX = 0, linkWidth = 0, payload } = props
  if (linkWidth < 1) return null
  const srcName = payload?.source?.name ?? ''
  const color = NODE_COLORS[srcName] ?? '#94a3b8'
  const d = `M${sourceX},${sourceY + linkWidth / 2} C${sourceControlX},${sourceY + linkWidth / 2} ${targetControlX},${targetY + linkWidth / 2} ${targetX},${targetY + linkWidth / 2} L${targetX},${targetY - linkWidth / 2} C${targetControlX},${targetY - linkWidth / 2} ${sourceControlX},${sourceY - linkWidth / 2} ${sourceX},${sourceY - linkWidth / 2} Z`
  return <path d={d} fill={color} fillOpacity={0.32} strokeWidth={0} />
}
// ────────────────────────────────────────────────────────────────────────────

function CashflowTable({ r, inputs, label }: { r: ReturnType<typeof calcRental>; inputs: RentalInputs; label: string }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--card-dark-border)' }}>
      {[
        { label: 'Loyers annuels bruts', value: fmt(r.annualRent), positive: true },
        { label: `Vacance locative (${inputs.vacancy}%)`, value: `− \u00a0${fmt(r.annualVacancyLoss)}`, negative: true },
        { label: 'Charges non récupérables', value: `− \u00a0${fmt(r.annualCharges)}`, negative: true },
        { label: 'Taxe foncière', value: `− \u00a0${fmt(inputs.taxeFonciere)}`, negative: true },
        { label: 'Assurance PNO', value: `− \u00a0${fmt(inputs.insurance)}`, negative: true },
        { label: 'Revenu net opérationnel', value: fmt(r.netOperatingIncome), bold: true, separator: true },
        { label: 'Remboursement crédit', value: `− \u00a0${fmt(r.monthlyLoan * 12)}`, negative: true },
        ...(r.annualWorksDeduction > 0 && inputs.regime !== 'meuble' ? [{ label: `Amort. travaux (déd. ${fmt(r.annualWorksDeduction)}/an)`, value: `→ base imposable −${fmt(r.annualWorksDeduction)}`, negative: false }] : []),
        { label: `Impôts (${inputs.regime.toUpperCase()})`, value: `− \u00a0${fmt(r.tax)}`, negative: true },
        { label: 'Cashflow annuel net', value: fmt(r.cashflowAnnual), bold: true, cashflow: true },
      ].map((row, i, arr) => (
        <div key={i} className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: i < arr.length - 1 ? '1px solid var(--section-border)' : 'none',
            background: row.cashflow
              ? (r.cashflowAnnual >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
              : row.bold ? 'var(--row-hover)' : 'transparent',
            borderTop: row.separator ? '1px solid var(--card-dark-border)' : 'none',
          }}>
          <span style={{ fontSize: 13, color: row.bold ? 'var(--text-em)' : 'var(--text-muted-c)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 13, fontWeight: row.bold ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
            color: row.cashflow
              ? (r.cashflowAnnual >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)')
              : row.negative ? 'var(--text-muted-c)' : 'var(--text-em)',
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
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--card-dark-border)' }}>
      {[
        { label: 'Loyers annuels bruts', value: fmt(totalAnnualRent), positive: true },
        { label: 'Vacance locative totale', value: `− \u00a0${fmt(totalVacancyLoss)}`, negative: true },
        { label: 'Charges non récupérables', value: `− \u00a0${fmt(totalCharges)}`, negative: true },
        { label: 'Taxes foncières', value: `− \u00a0${fmt(totalTaxeFonciere)}`, negative: true },
        { label: 'Assurances PNO', value: `− \u00a0${fmt(totalInsurance)}`, negative: true },
        { label: 'Revenu net opérationnel', value: fmt(totalNOI), bold: true, separator: true },
        { label: 'Remboursements crédit', value: `− \u00a0${fmt(totalLoan)}`, negative: true },
        { label: 'Impôts totaux', value: `− \u00a0${fmt(totalTax)}`, negative: true },
        { label: 'Cashflow annuel net global', value: fmt(totalCashflow), bold: true, cashflow: true },
      ].map((row, i, arr) => (
        <div key={i} className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: i < arr.length - 1 ? '1px solid var(--section-border)' : 'none',
            background: row.cashflow
              ? (totalCashflow >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
              : row.bold ? 'var(--row-hover)' : 'transparent',
            borderTop: row.separator ? '1px solid var(--card-dark-border)' : 'none',
          }}>
          <span style={{ fontSize: 13, color: row.bold ? 'var(--text-em)' : 'var(--text-muted-c)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 13, fontWeight: row.bold ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
            color: row.cashflow
              ? (totalCashflow >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)')
              : row.negative ? 'var(--text-muted-c)' : 'var(--text-em)',
          }}>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function RentalPageInner() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
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

  // Sankey data helpers
  const makeSankeyData = (r: ReturnType<typeof calcRental>, apt: Apartment) =>
    buildSankeyData(r.annualRent, r.annualVacancyLoss, r.annualCharges,
      apt.inputs.taxeFonciere, apt.inputs.insurance,
      r.netOperatingIncome, r.monthlyLoan * 12, r.tax, r.cashflowAnnual)

  const globalSankeyData = useMemo(() => buildSankeyData(
    globalAnnualRent,
    results.reduce((s, r) => s + r.annualVacancyLoss, 0),
    results.reduce((s, r) => s + r.annualCharges, 0),
    apartments.reduce((s, a) => s + a.inputs.taxeFonciere, 0),
    apartments.reduce((s, a) => s + a.inputs.insurance, 0),
    globalNOI,
    results.reduce((s, r) => s + r.monthlyLoan * 12, 0),
    results.reduce((s, r) => s + r.tax, 0),
    globalCashflowAnnual
  ), [results, apartments, globalAnnualRent, globalNOI, globalCashflowAnnual])

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
  const activeTabSankeyData = activeTabResult && activeTabApt ? makeSankeyData(activeTabResult, activeTabApt) : globalSankeyData

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

  // Donut actif
  const activeR = activeResult
  const donutData = [
    { name: 'Loyer net op.', value: activeR.netOperatingIncome, color: '#818cf8' },
    { name: 'Crédit', value: activeR.monthlyLoan * 12, color: '#f87171' },
    { name: 'Impôts', value: activeR.tax, color: '#e879f9' },
    { name: 'Cashflow net', value: Math.max(activeR.cashflowAnnual, 0), color: '#34d399' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Rentabilité Locative</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Rentabilité Locative</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Cashflow net · Rendement brut/net · ROI</p>
            </div>
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
            })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
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
            }} style={{ borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${globalCashflowMonthly >= 0 ? '#34d399' : '#f87171'}10, transparent)`, border: `1px solid ${globalCashflowMonthly >= 0 ? '#34d399' : '#f87171'}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${globalCashflowMonthly >= 0 ? '#34d399' : '#f87171'}14, transparent)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, marginBottom: 6 }}>Cashflow mensuel</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: globalCashflowMonthly >= 0 ? '#34d399' : '#f87171', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{fmt(globalCashflowMonthly)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{fmt(globalCashflowAnnual)}/an</div>
        </div>
        {[
          { label: 'Rendement brut', value: fmtPct(globalGrossYield), sub: 'loyers / investissement' },
          { label: 'Rendement net', value: fmtPct(globalNetYield), sub: 'après charges & fiscalité' },
          { label: 'ROI fonds propres', value: fmtPct(globalROI), sub: 'cashflow / apport' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Apartment tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {apartments.map((apt) => (
              <div key={apt.id} style={{ position: 'relative' }} className="group">
                <button
                  onClick={() => setActiveAptId(apt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    transition: 'all 0.15s',
                    ...(activeAptId === apt.id
                      ? { background: `${COLOR}14`, border: `1px solid ${COLOR}28`, color: 'var(--sb-text-strong)' }
                      : { border: '1px solid transparent', color: 'var(--text-muted-c)', background: 'transparent' })
                  }}
                >
                  {apt.name}
                </button>
                {apartments.length > 1 && (
                  <button
                    onClick={() => removeApartment(apt.id)}
                    className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500/80 text-white items-center justify-center hidden group-hover:flex transition-all"
                    style={{ fontSize: 8 }}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            ))}
            {apartments.length < 6 && (
              <button
                onClick={addApartment}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, fontSize: 12, border: '1px dashed var(--card-dark-border)', color: 'var(--text-subtle)', background: 'transparent' }}
              >
                <Plus className="h-3 w-3" />Ajouter
              </button>
            )}
          </div>

          {/* Apartment name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Nom du bien</label>
            <Input value={activeApt.name} onChange={e => setAptName(e.target.value)} style={{ height: 36, fontSize: 13 }} />
          </div>

          {/* Acquisition panel */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Acquisition</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Prix d&apos;achat (€)<FieldTooltip text="Prix FAI. Les frais de notaire s'ajoutent en pourcentage ci-dessous." /></label>
              <Input type="number" value={inputs.price} onChange={e => setApt('price')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Frais de notaire<FieldTooltip text="~8% dans l'ancien, ~3% dans le neuf." /></label>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>{inputs.notaryFees}%</span>
              </div>
              <Slider min={2} max={10} step={0.5} value={[inputs.notaryFees]} onValueChange={([v]) => setApt('notaryFees')(v)} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Travaux (€)<FieldTooltip text="Budget travaux/rénovation initial. Inclus dans l'investissement total." /></label>
              <Input type="number" value={inputs.works} onChange={e => setApt('works')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Montant emprunté (€)<FieldTooltip text="Capital emprunté. Laissez 0 pour un achat cash." /></label>
              <Input type="number" value={inputs.loanAmount} onChange={e => setApt('loanAmount')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Taux crédit</label>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>{inputs.loanRate}%</span>
              </div>
              <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => setApt('loanRate')(v)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Durée crédit</label>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>{inputs.loanYears} ans</span>
              </div>
              <Slider min={5} max={30} step={1} value={[inputs.loanYears]} onValueChange={([v]) => setApt('loanYears')(v)} />
            </div>
          </div>

          {/* Exploitation & Fiscalité panel */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}18`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Exploitation &amp; Fiscalité</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Loyer mensuel HC (€)<FieldTooltip text="Loyer hors charges. Base de calcul du rendement." /></label>
              <Input type="number" value={inputs.rent} onChange={e => setApt('rent')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Charges mensuelles (€)<FieldTooltip text="Charges non récupérables sur le locataire : copropriété, entretien..." /></label>
              <Input type="number" value={inputs.charges} onChange={e => setApt('charges')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Taxe foncière (€/an)<FieldTooltip text="Taxe foncière annuelle — à votre charge en tant que propriétaire." /></label>
              <Input type="number" value={inputs.taxeFonciere} onChange={e => setApt('taxeFonciere')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Assurance PNO (€/an)<FieldTooltip text="Assurance Propriétaire Non Occupant — obligatoire en copropriété." /></label>
              <Input type="number" value={inputs.insurance} onChange={e => setApt('insurance')(+e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Taux de vacance<FieldTooltip text="Pourcentage du temps sans locataire. 4-8% est réaliste." /></label>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>{inputs.vacancy}%</span>
              </div>
              <Slider min={0} max={20} step={0.5} value={[inputs.vacancy]} onValueChange={([v]) => setApt('vacancy')(v)} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 4 }}>Régime fiscal<FieldTooltip text="Nu : revenus fonciers. Meublé micro-BIC : 50% abattement. LMNP réel : amortissement." /></label>
              <Select value={inputs.regime} onValueChange={v => setApt('regime')(v as RentalInputs['regime'])}>
                <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nu">Location nue (rev. fonciers)</SelectItem>
                  <SelectItem value="meuble">Meublé micro-BIC (50% abatt.)</SelectItem>
                  <SelectItem value="lmnp">LMNP réel (amortissement)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inputs.regime !== 'lmnp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Votre TMI</label>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-em)' }}>{inputs.marginalRate}%</span>
                </div>
                <Slider min={0} max={45} step={1} value={[inputs.marginalRate]} onValueChange={([v]) => setApt('marginalRate')(v)} />
              </div>
            )}
          </div>
        </div>

        {/* CENTER — Sankey + table cashflow + per-apartment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Result tabs + Sankey */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>Décomposition du cashflow annuel</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>
                  {resultTab === 'global'
                    ? `Global — ${apartments.length} appartement${apartments.length > 1 ? 's' : ''} — ${fmt(globalTotalInvestment)}`
                    : `${activeTabApt?.name} — ${fmt(activeTabResult?.totalInvestment ?? 0)}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setResultTab('global')}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                    ...(resultTab === 'global'
                      ? { background: `${COLOR}14`, border: `1px solid ${COLOR}28`, color: 'var(--sb-text-strong)' }
                      : { border: '1px solid transparent', color: 'var(--text-muted-c)', background: 'transparent' })
                  }}
                >Global</button>
                {apartments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setResultTab(apt.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                      ...(resultTab === apt.id
                        ? { background: `${COLOR}14`, border: `1px solid ${COLOR}28`, color: 'var(--sb-text-strong)' }
                        : { border: '1px solid transparent', color: 'var(--text-muted-c)', background: 'transparent' })
                    }}
                  >{apt.name}</button>
                ))}
              </div>
            </div>

            {mounted ? (
              <ResponsiveContainer width="100%" height={260}>
                <Sankey
                  data={activeTabSankeyData}
                  nodePadding={24}
                  nodeWidth={26}
                  margin={{ top: 20, right: 180, bottom: 20, left: 140 }}
                  iterations={64}
                  node={(props: Parameters<typeof CustomSankeyNode>[0]) => <CustomSankeyNode {...props} theme={theme} />}
                  link={(props: Parameters<typeof CustomSankeyLink>[0]) => <CustomSankeyLink {...props} />}
                >
                  <Tooltip
                    formatter={(v: number) => [fmt(v), '']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 12, color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-muted-c)' }}
                  />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>Chargement du graphique…</span>
              </div>
            )}
          </div>

          {/* Cashflow table */}
          {resultTab === 'global' ? (
            <GlobalCashflowTable apartments={apartments} results={results} />
          ) : activeTabResult && activeTabApt ? (
            <CashflowTable r={activeTabResult} inputs={activeTabApt.inputs} label={activeTabApt.name} />
          ) : null}

          {/* Per-apartment mini KPIs when global */}
          {resultTab === 'global' && apartments.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>Par appartement</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {apartments.map((apt, idx) => {
                  const r = results[idx]
                  return (
                    <div key={apt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'var(--row-hover)', border: '1px solid var(--card-dark-border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--sb-text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{fmtPct(r.grossYield)} brut</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{fmtPct(r.netYield)} net</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: r.cashflowMonthly >= 0 ? '#34d399' : '#f87171' }}>
                          {fmt(r.cashflowMonthly)}/mois
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

        {/* RIGHT — analyse + donut + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Score analyse */}
          <div style={{ background: `linear-gradient(135deg, ${scoreConf.color}0d, rgba(255,255,255,0.02))`, border: `1px solid ${scoreConf.color}22`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: scoreConf.color }}>Analyse — Cashflow {scoreConf.label}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, marginBottom: apartments.length === 1 && activeResult.analysis.tips.length > 0 ? 12 : 0 }}>
              {apartments.length === 1
                ? activeResult.analysis.message
                : `Votre portefeuille de ${apartments.length} biens génère ${fmt(globalCashflowMonthly)}/mois (${fmt(globalCashflowAnnual)}/an) pour ${fmt(globalTotalInvestment)} investis. Rendement brut : ${fmtPct(globalGrossYield)}, net : ${fmtPct(globalNetYield)}, ROI : ${fmtPct(globalROI)}.`}
            </p>
            {apartments.length === 1 && activeResult.analysis.tips.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeResult.analysis.tips.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${scoreConf.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: scoreConf.color }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Donut revenu/charges/remboursement */}
          {donutData.length > 0 && (
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 8 }}>
                Répartition annuelle — {activeApt.name}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={130} height={130}>
                  <Pie data={donutData} cx={61} cy={61} innerRadius={34} outerRadius={58} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Pie>
                </PieChart>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {donutData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 9999, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseils investissement locatif */}
          <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Conseils investisseur</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: COLOR, text: 'Un rendement brut > 7% est nécessaire pour viser un cashflow positif avec crédit.' },
                { color: '#818cf8', text: 'Le LMNP réel amortit le bien sur 25-30 ans, réduisant quasi à zéro la fiscalité sur les revenus locatifs.' },
                { color: '#34d399', text: 'La vacance locative est souvent sous-estimée — prévoyez 1 mois/an minimum.' },
                { color: '#60a5fa', text: 'Un cashflow légèrement négatif peut être acceptable si la plus-value à terme compense.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ArrowRight style={{ width: 11, height: 11, color: item.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RentalPage() { return <Suspense><RentalPageInner /></Suspense> }
