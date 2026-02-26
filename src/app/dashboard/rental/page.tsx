'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcRental, type RentalInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle, Plus, X } from 'lucide-react'
import { printReport } from '@/lib/print'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

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

// ── Sankey helpers ──────────────────────────────────────────────────────────
const LOSS_SET = new Set(['Vacance', 'Charges', 'Taxe foncière', 'Assurance', 'Crédit', 'Impôts'])

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
}) {
  const { x = 0, y = 0, width = 8, height = 0, payload } = props
  if (!payload || height < 1) return null
  const name = payload.name
  const isLoyers   = name === 'Loyers'
  const isCashflow = name === 'Cashflow net'
  const isEffort   = name === 'Effort mensuel'
  const color = isLoyers || isCashflow ? '#34d399' : isEffort ? '#f59e0b' : LOSS_SET.has(name) ? '#f87171' : '#94a3b8'
  const labelX = isLoyers ? x - 8 : x + width + 8
  const anchor  = isLoyers ? 'end' : 'start'
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.9} rx={2} />
      <text x={labelX} y={y + height / 2 - 6} textAnchor={anchor} fill={color} fontSize={10} fontWeight={600} dominantBaseline="middle">{name}</text>
      <text x={labelX} y={y + height / 2 + 7} textAnchor={anchor} fill="rgba(255,255,255,0.35)" fontSize={9} dominantBaseline="middle">{fmt(payload.value)}</text>
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
  const tgt = payload?.target?.name ?? ''
  const src = payload?.source?.name ?? ''
  const color = LOSS_SET.has(tgt) ? 'rgba(248,113,113,0.22)'
    : src === 'Effort mensuel'    ? 'rgba(245,158,11,0.25)'
    : tgt === 'Cashflow net'      ? 'rgba(52,211,153,0.28)'
    : 'rgba(148,163,184,0.18)'
  const d = `M${sourceX},${sourceY + linkWidth / 2} C${sourceControlX},${sourceY + linkWidth / 2} ${targetControlX},${targetY + linkWidth / 2} ${targetX},${targetY + linkWidth / 2} L${targetX},${targetY - linkWidth / 2} C${targetControlX},${targetY - linkWidth / 2} ${sourceControlX},${sourceY - linkWidth / 2} ${sourceX},${sourceY - linkWidth / 2} Z`
  return <path d={d} fill={color} strokeWidth={0} />
}
// ────────────────────────────────────────────────────────────────────────────

function CashflowTable({ r, inputs, label }: { r: ReturnType<typeof calcRental>; inputs: RentalInputs; label: string }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      {[
        { label: 'Loyers annuels bruts', value: fmt(r.annualRent), positive: true },
        { label: `Vacance locative (${inputs.vacancy}%)`, value: `− \u00a0${fmt(r.annualVacancyLoss)}`, negative: true },
        { label: 'Charges non récupérables', value: `− \u00a0${fmt(r.annualCharges)}`, negative: true },
        { label: 'Taxe foncière', value: `− \u00a0${fmt(inputs.taxeFonciere)}`, negative: true },
        { label: 'Assurance PNO', value: `− \u00a0${fmt(inputs.insurance)}`, negative: true },
        { label: 'Revenu net opérationnel', value: fmt(r.netOperatingIncome), bold: true, separator: true },
        { label: 'Remboursement crédit', value: `− \u00a0${fmt(r.monthlyLoan * 12)}`, negative: true },
        { label: `Impôts (${inputs.regime.toUpperCase()})`, value: `− \u00a0${fmt(r.tax)}`, negative: true },
        { label: 'Cashflow annuel net', value: fmt(r.cashflowAnnual), bold: true, cashflow: true },
      ].map((row, i, arr) => (
        <div key={i} className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: row.cashflow
              ? (r.cashflowAnnual >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
              : row.bold ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderTop: row.separator ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}>
          <span style={{ fontSize: 13, color: row.bold ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 13, fontWeight: row.bold ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
            color: row.cashflow
              ? (r.cashflowAnnual >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)')
              : row.negative ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
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
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
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
            borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background: row.cashflow
              ? (totalCashflow >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(239,68,68,0.05)')
              : row.bold ? 'rgba(255,255,255,0.02)' : 'transparent',
            borderTop: row.separator ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }}>
          <span style={{ fontSize: 13, color: row.bold ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontWeight: row.bold ? 600 : 400 }}>{row.label}</span>
          <span style={{
            fontSize: 13, fontWeight: row.bold ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
            color: row.cashflow
              ? (totalCashflow >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)')
              : row.negative ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
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
        setApartments(parsed.apartments)
        setActiveAptId(parsed.apartments[0].id)
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
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-finance' },
    bon: { label: 'Positif', Icon: TrendingUp, color: 'text-blue-400' },
    moyen: { label: 'Effort', Icon: Minus, color: 'text-amber-400' },
    negatif: { label: 'Négatif', Icon: AlertCircle, color: 'text-crimson-finance' },
  }[globalScore]

  const activeTabResult = resultTab === 'global'
    ? null
    : results[apartments.findIndex(a => a.id === resultTab)]
  const activeTabApt = resultTab === 'global'
    ? null
    : apartments.find(a => a.id === resultTab)!
  const activeTabSankeyData = activeTabResult && activeTabApt ? makeSankeyData(activeTabResult, activeTabApt) : globalSankeyData

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Rentabilité Locative</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cashflow · Rendement · Fiscalité — {apartments.length} appartement{apartments.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cashflow mensuel global', value: fmt(globalCashflowMonthly), sub: `${fmt(globalCashflowAnnual)}/an`, isCashflow: true },
          { label: 'Rendement brut moyen', value: fmtPct(globalGrossYield) },
          { label: 'Rendement net moyen', value: fmtPct(globalNetYield) },
          { label: 'ROI sur fonds propres', value: fmtPct(globalROI) },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-semibold tracking-tight',
                k.isCashflow && (globalCashflowMonthly >= 0 ? 'text-emerald-finance' : 'text-crimson-finance')
              )}>{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: apartment selector + form */}
        <div className="space-y-4">

          {/* Apartment tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {apartments.map((apt) => (
              <div key={apt.id} className="relative group">
                <button
                  onClick={() => setActiveAptId(apt.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeAptId === apt.id
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                  )}
                  style={activeAptId === apt.id ? { background: 'rgba(241,192,134,0.1)', border: '1px solid rgba(241,192,134,0.2)' } : { border: '1px solid transparent' }}
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
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                style={{ border: '1px dashed rgba(255,255,255,0.12)' }}
              >
                <Plus className="h-3 w-3" />Ajouter
              </button>
            )}
          </div>

          {/* Apartment name */}
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input
              value={activeApt.name}
              onChange={e => setAptName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <Card>
            <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Prix d&apos;achat<Tip text="Prix FAI. Les frais de notaire s'ajoutent en pourcentage ci-dessous." /></Label>
                <Input type="number" value={inputs.price} onChange={e => setApt('price')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Frais de notaire<Tip text="~8% dans l'ancien, ~3% dans le neuf." /></Label>
                  <span className="text-sm font-medium">{inputs.notaryFees}%</span>
                </div>
                <Slider min={2} max={10} step={0.5} value={[inputs.notaryFees]} onValueChange={([v]) => setApt('notaryFees')(v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Travaux<Tip text="Budget travaux/rénovation initial. Inclus dans l'investissement total." /></Label>
                <Input type="number" value={inputs.works} onChange={e => setApt('works')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Montant emprunté<Tip text="Capital emprunté. Laissez 0 pour un achat cash." /></Label>
                <Input type="number" value={inputs.loanAmount} onChange={e => setApt('loanAmount')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Taux crédit</Label>
                  <span className="text-sm font-medium">{inputs.loanRate}%</span>
                </div>
                <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => setApt('loanRate')(v)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Durée crédit</Label>
                  <span className="text-sm font-medium">{inputs.loanYears} ans</span>
                </div>
                <Slider min={5} max={30} step={1} value={[inputs.loanYears]} onValueChange={([v]) => setApt('loanYears')(v)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Exploitation &amp; Fiscalité</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Loyer mensuel HC<Tip text="Loyer hors charges. Base de calcul du rendement." /></Label>
                <Input type="number" value={inputs.rent} onChange={e => setApt('rent')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Charges mensuelles<Tip text="Charges non récupérables sur le locataire : copropriété, entretien..." /></Label>
                <Input type="number" value={inputs.charges} onChange={e => setApt('charges')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Taxe foncière (€/an)<Tip text="Taxe foncière annuelle — à votre charge en tant que propriétaire." /></Label>
                <Input type="number" value={inputs.taxeFonciere} onChange={e => setApt('taxeFonciere')(+e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Assurance PNO (€/an)<Tip text="Assurance Propriétaire Non Occupant — obligatoire en copropriété." /></Label>
                <Input type="number" value={inputs.insurance} onChange={e => setApt('insurance')(+e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="flex items-center gap-1">Taux de vacance<Tip text="Pourcentage du temps sans locataire. 4-8% est réaliste selon la localisation." /></Label>
                  <span className="text-sm font-medium">{inputs.vacancy}%</span>
                </div>
                <Slider min={0} max={20} step={0.5} value={[inputs.vacancy]} onValueChange={([v]) => setApt('vacancy')(v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">Régime fiscal<Tip text="Nu : revenus fonciers. Meublé micro-BIC : 50% abattement. LMNP réel : amortissement, fiscalité quasi nulle." /></Label>
                <Select value={inputs.regime} onValueChange={v => setApt('regime')(v as RentalInputs['regime'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nu">Location nue (revenus fonciers)</SelectItem>
                    <SelectItem value="meuble">Meublé micro-BIC (50% abatt.)</SelectItem>
                    <SelectItem value="lmnp">LMNP réel (amortissement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inputs.regime !== 'lmnp' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Votre TMI</Label>
                    <span className="text-sm font-medium">{inputs.marginalRate}%</span>
                  </div>
                  <Slider min={0} max={45} step={1} value={[inputs.marginalRate]} onValueChange={([v]) => setApt('marginalRate')(v)} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: results with tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Décomposition du cashflow annuel</CardTitle>
                <CardDescription className="mt-0.5">
                  {resultTab === 'global'
                    ? `Global — ${apartments.length} appartement${apartments.length > 1 ? 's' : ''} — Investissement total : ${fmt(globalTotalInvestment)}`
                    : `${activeTabApt?.name} — Investissement : ${fmt(activeTabResult?.totalInvestment ?? 0)}`}
                </CardDescription>
              </div>
              {/* Result tabs */}
              <div className="flex items-center gap-1 flex-wrap justify-end flex-shrink-0">
                <button
                  onClick={() => setResultTab('global')}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', resultTab === 'global' ? 'text-white' : 'text-white/35 hover:text-white/60')}
                  style={resultTab === 'global' ? { background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.2)' } : { border: '1px solid transparent' }}
                >
                  Global
                </button>
                {apartments.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => setResultTab(apt.id)}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', resultTab === apt.id ? 'text-white' : 'text-white/35 hover:text-white/60')}
                    style={resultTab === apt.id ? { background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.2)' } : { border: '1px solid transparent' }}
                  >
                    {apt.name}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResponsiveContainer width="100%" height={280}>
              <Sankey
                data={activeTabSankeyData}
                nodePadding={14}
                nodeWidth={8}
                margin={{ top: 8, right: 140, bottom: 8, left: 90 }}
                iterations={32}
                node={(props: Parameters<typeof CustomSankeyNode>[0]) => <CustomSankeyNode {...props} />}
                link={(props: Parameters<typeof CustomSankeyLink>[0]) => <CustomSankeyLink {...props} />}
              >
                <Tooltip
                  formatter={(v: number) => [fmt(v), '']}
                  contentStyle={{ background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: 12, color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                />
              </Sankey>
            </ResponsiveContainer>

            {resultTab === 'global' ? (
              <GlobalCashflowTable apartments={apartments} results={results} />
            ) : activeTabResult && activeTabApt ? (
              <CashflowTable r={activeTabResult} inputs={activeTabApt.inputs} label={activeTabApt.name} />
            ) : null}

            {/* Per-apartment mini KPIs when in global view */}
            {resultTab === 'global' && apartments.length > 1 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">Par appartement</p>
                <div className="grid grid-cols-1 gap-2">
                  {apartments.map((apt, idx) => {
                    const r = results[idx]
                    return (
                      <div key={apt.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-xs font-medium text-white/60 truncate flex-1">{apt.name}</span>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-[11px] text-white/35">{fmtPct(r.grossYield)} brut</span>
                          <span className="text-[11px] text-white/35">{fmtPct(r.netYield)} net</span>
                          <span className={cn('text-xs font-semibold tabular-nums', r.cashflowMonthly >= 0 ? 'text-emerald-finance' : 'text-crimson-finance')}>
                            {fmt(r.cashflowMonthly)}/mois
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Synthèse globale */}
      <Card style={{ borderColor: globalScore === 'excellent' || globalScore === 'bon' ? 'rgba(52,211,153,0.35)' : globalScore === 'moyen' ? 'rgba(251,191,36,0.35)' : 'rgba(239,68,68,0.35)' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <scoreConf.Icon className={cn('h-4 w-4', scoreConf.color)} />
            <CardTitle>Analyse globale — Cashflow {scoreConf.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {apartments.length === 1
              ? activeResult.analysis.message
              : `Votre portefeuille de ${apartments.length} biens génère un cashflow global de ${fmt(globalCashflowMonthly)}/mois (${fmt(globalCashflowAnnual)}/an) pour un investissement total de ${fmt(globalTotalInvestment)}. Rendement brut moyen : ${fmtPct(globalGrossYield)}, net : ${fmtPct(globalNetYield)}, ROI : ${fmtPct(globalROI)}.`}
          </p>
          {apartments.length === 1 && (
            <div className="space-y-2">
              {activeResult.analysis.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 rounded-md border border-border p-3">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function RentalPage() { return <Suspense><RentalPageInner /></Suspense> }
