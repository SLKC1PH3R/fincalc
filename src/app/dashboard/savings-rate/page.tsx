'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sankey, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, Plus, X, TrendingUp, Minus, AlertCircle, CheckCircle2, RotateCcw, Percent, Settings2, ArrowRight } from 'lucide-react'
import { printReport } from '@/lib/print'
import { FrenchAverageWidget } from '@/components/FrenchAverageWidget'

interface LineItem { id: string; name: string; value: number }
interface Category { id: string; name: string; items: LineItem[] }

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_REVENUS: LineItem[] = [
  { id: 'r1', name: 'Salaire', value: 2500 },
  { id: 'r2', name: 'Loyer perçu', value: 1500 },
]
const DEFAULT_INVEST: Category[] = [
  {
    id: 'i1', name: 'Investissements mensuels', items: [
      { id: 'i1a', name: 'Actions', value: 200 },
      { id: 'i1b', name: 'Assurance vie', value: 200 },
      { id: 'i1c', name: 'ETF', value: 1200 },
    ]
  },
]
const DEFAULT_DEPENSES: Category[] = [
  {
    id: 'd1', name: 'Logement', items: [
      { id: 'd1a', name: 'Loyer', value: 500 },
      { id: 'd1b', name: 'Charges', value: 120 },
    ]
  },
  {
    id: 'd2', name: 'Vie quotidienne', items: [
      { id: 'd2a', name: 'Courses', value: 300 },
      { id: 'd2b', name: 'Restaurants', value: 100 },
    ]
  },
  {
    id: 'd3', name: 'Abonnements', items: [
      { id: 'd3a', name: 'Internet / Téléphone', value: 50 },
      { id: 'd3b', name: 'Sport', value: 20 },
    ]
  },
]

// ── Sankey helpers ──────────────────────────────────────────────────────────
const INCOME_COLOR = '#818cf8'
const BUDGET_COLOR = '#fb923c'
const RESTE_COLOR = '#34d399'
const CAT_PALETTE = [
  '#34d399', '#f472b6', '#c084fc', '#60a5fa',
  '#2dd4bf', '#facc15', '#e879f9', '#a78bfa', '#f87171',
]

const COLOR = '#34d399'

interface SankeyNode { name: string; color: string }

function buildSankeyData(revenus: LineItem[], investCats: Category[], depenseCats: Category[]) {
  const nodes: SankeyNode[] = []
  const incomeLinks: { source: number; target: number; value: number }[] = []
  const budgetLinks: { source: number; target: number; value: number }[] = []
  const catLinks: { source: number; target: number; value: number }[] = []
  const add = (name: string, color: string) => { nodes.push({ name, color }); return nodes.length - 1 }

  const validRevenus = revenus.filter(r => r.value > 0)
  const totalRevenu = validRevenus.reduce((s, r) => s + r.value, 0)
  if (totalRevenu <= 0) return { nodes: [], links: [] }

  const revNodes = validRevenus.map(r => ({ id: add(r.name, INCOME_COLOR), r }))
  const iBudget = add('Budget', BUDGET_COLOR)

  const allCats = [...investCats, ...depenseCats]
  let ci = 0
  const catNodeList: { id: number; total: number }[] = []

  for (const cat of allCats) {
    const validItems = cat.items.filter(i => i.value > 0)
    const total = validItems.reduce((s, i) => s + i.value, 0)
    if (total <= 0) { ci++; continue }
    const col = CAT_PALETTE[ci++ % CAT_PALETTE.length]
    const catId = add(cat.name, col)
    catNodeList.push({ id: catId, total })
    for (const item of validItems) {
      catLinks.push({ source: catId, target: add(item.name, col), value: Math.round(item.value) })
    }
  }

  const totalOut = allCats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.value, 0), 0)
  const reste = totalRevenu - totalOut
  if (reste > 10) {
    const iReste = add('Épargne libre', RESTE_COLOR)
    budgetLinks.push({ source: iBudget, target: iReste, value: Math.round(reste) })
  }

  for (const { id, r } of revNodes) incomeLinks.push({ source: id, target: iBudget, value: Math.round(r.value) })
  for (const { id, total } of catNodeList) budgetLinks.push({ source: iBudget, target: id, value: Math.round(total) })

  return { nodes, links: [...incomeLinks, ...budgetLinks, ...catLinks] }
}

type NodePayload = { name: string; value: number; color: string }
type LinkSource = { name: string; color?: string }
type LinkPayload = { source: LinkSource; target: LinkSource; value: number }

function SankeyNodeRenderer(props: {
  x?: number; y?: number; width?: number; height?: number; payload?: NodePayload
}) {
  const { x = 0, y = 0, width = 22, height = 0, payload } = props
  if (!payload || height < 1) return null
  const color = payload.color ?? '#94a3b8'
  const isLeft = color === INCOME_COLOR
  const lx = isLeft ? x - 12 : x + width + 12
  const anchor = isLeft ? 'end' : 'start'
  const mid = y + height / 2
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.90} rx={4} />
      <text x={lx} y={mid - 8} textAnchor={anchor} fill={color} fontSize={11} fontWeight={700} dominantBaseline="middle">{payload.name}</text>
      <text x={lx} y={mid + 8} textAnchor={anchor} fill="rgba(255,255,255,0.60)" fontSize={10} fontWeight={500} dominantBaseline="middle">{fmt(payload.value)}</text>
    </g>
  )
}

function SankeyLinkRenderer(props: {
  sourceX?: number; sourceY?: number; sourceControlX?: number
  targetX?: number; targetY?: number; targetControlX?: number
  linkWidth?: number; payload?: LinkPayload
}) {
  const { sourceX = 0, sourceY = 0, sourceControlX = 0, targetX = 0, targetY = 0, targetControlX = 0, linkWidth = 0, payload } = props
  if (linkWidth < 1) return null
  const color = (payload?.source as { color?: string })?.color ?? '#94a3b8'
  const d = `M${sourceX},${sourceY + linkWidth / 2} C${sourceControlX},${sourceY + linkWidth / 2} ${targetControlX},${targetY + linkWidth / 2} ${targetX},${targetY + linkWidth / 2} L${targetX},${targetY - linkWidth / 2} C${targetControlX},${targetY - linkWidth / 2} ${sourceControlX},${sourceY - linkWidth / 2} ${sourceX},${sourceY - linkWidth / 2} Z`
  return <path d={d} fill={color} fillOpacity={0.30} strokeWidth={0} />
}
// ────────────────────────────────────────────────────────────────────────────

function ItemRow({ item, onChange, onRemove, placeholder }: {
  item: LineItem
  onChange: (key: 'name' | 'value', val: string | number) => void
  onRemove: () => void
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Input
        value={item.name}
        onChange={e => onChange('name', e.target.value)}
        className="h-7 text-xs flex-1"
        placeholder={placeholder ?? 'Nom'}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Input
          type="number"
          value={item.value || ''}
          onChange={e => onChange('value', +e.target.value)}
          className="h-7 text-xs w-24 tabular-nums"
          placeholder="0"
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 16, flexShrink: 0 }}>€</span>
      </div>
      <button
        onClick={onRemove}
        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  )
}

function SavingsRatePageInner() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [revenus, setRevenus] = useState<LineItem[]>(DEFAULT_REVENUS)
  const [investCats, setInvestCats] = useState<Category[]>(DEFAULT_INVEST)
  const [depenseCats, setDepenseCats] = useState<Category[]>(DEFAULT_DEPENSES)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      const migrateItems = (arr: any[]): LineItem[] =>
        arr.map((x: any) => ({ id: x.id ?? uid(), name: x.name ?? x.label ?? '', value: x.value ?? x.amount ?? 0 }))
      const migrateCats = (arr: any[], fallbackName: string): Category[] => {
        if (arr[0]?.items !== undefined) return arr
        return [{ id: uid(), name: fallbackName, items: migrateItems(arr) }]
      }
      if (p.revenus) setRevenus(migrateItems(p.revenus))
      if (p.investCats) setInvestCats(migrateCats(p.investCats, 'Investissements'))
      if (p.depenseCats) setDepenseCats(migrateCats(p.depenseCats, 'Dépenses'))
    } catch {}
  }, [restoreParam])

  const totalRevenu = useMemo(() => revenus.reduce((s, r) => s + r.value, 0), [revenus])
  const totalInvest = useMemo(() => investCats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.value, 0), 0), [investCats])
  const totalDepense = useMemo(() => depenseCats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.value, 0), 0), [depenseCats])
  const balance = totalRevenu - totalInvest - totalDepense
  const savingsRate = totalRevenu > 0 ? (totalInvest / totalRevenu) * 100 : 0

  const sankeyData = useMemo(() => buildSankeyData(revenus, investCats, depenseCats), [revenus, investCats, depenseCats])

  // ── Helpers ──
  const updateRevenu = (id: string, key: 'name' | 'value', val: string | number) =>
    setRevenus(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  const removeRevenu = (id: string) => setRevenus(prev => prev.filter(r => r.id !== id))
  const addRevenu = () => setRevenus(prev => [...prev, { id: uid(), name: '', value: 0 }])

  type CatSetter = React.Dispatch<React.SetStateAction<Category[]>>
  const updateCatName = (set: CatSetter, catId: string, name: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, name } : c))
  const updateCatItem = (set: CatSetter, catId: string, itemId: string, key: 'name' | 'value', val: string | number) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [key]: val } : i) } : c))
  const removeCatItem = (set: CatSetter, catId: string, itemId: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c))
  const addCatItem = (set: CatSetter, catId: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: [...c.items, { id: uid(), name: '', value: 0 }] } : c))
  const removeCat = (set: CatSetter, catId: string) =>
    set(prev => prev.filter(c => c.id !== catId))
  const addCat = (set: CatSetter, label: string) =>
    set(prev => [...prev, { id: uid(), name: label, items: [] }])

  // ── Score ──
  const score = balance < 0 ? 'deficit'
    : savingsRate >= 20 ? 'excellent'
    : savingsRate >= 10 ? 'bien'
    : savingsRate > 0 ? 'moyen'
    : 'nul'
  const scoreConf = {
    deficit:   { label: 'Déficit',        Icon: AlertCircle,  color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)',    msg: 'Vos dépenses dépassent vos revenus. Identifiez les postes à réduire en priorité.' },
    excellent: { label: 'Excellent',      Icon: CheckCircle2, color: '#34d399', borderColor: 'rgba(52,211,153,0.25)',   msg: `Bravo ! Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Continuez à maximiser vos investissements.` },
    bien:      { label: 'Bien',           Icon: TrendingUp,   color: '#60a5fa', borderColor: 'rgba(96,165,250,0.25)',   msg: `Votre taux d'épargne de ${savingsRate.toFixed(0)}% est sain. Visez 20% pour accélérer votre liberté financière.` },
    moyen:     { label: 'À améliorer',    Icon: Minus,        color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)',   msg: `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Visez 10% minimum en réduisant les dépenses non essentielles.` },
    nul:       { label: 'Aucune épargne', Icon: AlertCircle,  color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)',   msg: "Vous n'avez aucune épargne mensuelle. Commencez par mettre de côté 5% de vos revenus chaque mois." },
  }[score]

  const kpiAccentColor = { deficit: '#ef4444', excellent: '#34d399', bien: '#60a5fa', moyen: '#fbbf24', nul: '#fbbf24' }[score]

  const handleReset = () => {
    setRevenus(DEFAULT_REVENUS)
    setInvestCats(DEFAULT_INVEST)
    setDepenseCats(DEFAULT_DEPENSES)
  }

  const panelStyle = {
    background: 'var(--card-dark)',
    border: '1px solid var(--card-dark-border)',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  }

  const donutData = [
    { name: 'Épargne/invest.', value: totalInvest, color: '#34d399' },
    { name: 'Dépenses', value: totalDepense, color: '#fb923c' },
    { name: 'Balance libre', value: Math.max(balance, 0), color: '#818cf8' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Taux d&apos;épargne</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Percent style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Taux d&apos;épargne</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Capacité d&apos;épargne · Trajectoire vers l&apos;indépendance</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: "Taux d'épargne",
              subtitle: `Taux : ${savingsRate.toFixed(0)}% — Balance : ${fmt(balance)}/mois`,
              kpis: [
                { label: "Taux d'épargne", value: fmtPct(savingsRate), highlight: true, sub: `${fmt(totalInvest)} investis/mois` },
                { label: 'Revenus', value: fmt(totalRevenu) },
                { label: 'Investissements', value: fmt(totalInvest) },
                { label: 'Dépenses', value: fmt(totalDepense) },
              ],
              sections: [],
            })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation
              type="savings-rate"
              name={`Épargne ${savingsRate.toFixed(0)}% — ${fmt(balance)}/mois`}
              inputs={{ revenus, investCats, depenseCats } as unknown as Record<string, unknown>}
              results={{ savingsRate, totalRevenu, totalInvest, totalDepense, balance } as unknown as Record<string, unknown>}
            />
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky input panels */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Revenus */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Revenus</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: INCOME_COLOR, fontVariantNumeric: 'tabular-nums' }}>{fmt(totalRevenu)}</span>
            </div>
            {revenus.map(r => (
              <ItemRow
                key={r.id}
                item={r}
                onChange={(k, v) => updateRevenu(r.id, k, v)}
                onRemove={() => removeRevenu(r.id)}
                placeholder="Source de revenu"
              />
            ))}
            <button
              onClick={addRevenu}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Ajouter une source de revenu
            </button>
          </div>

          {/* Investissements */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Investissements</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalInvest)}</span>
            </div>
            {investCats.map(cat => {
              const total = cat.items.reduce((s, i) => s + i.value, 0)
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={cat.name}
                      onChange={e => updateCatName(setInvestCats, cat.id, e.target.value)}
                      className="h-7 text-xs font-semibold flex-1"
                    />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(total)}</span>
                    {investCats.length > 1 && (
                      <button onClick={() => removeCat(setInvestCats, cat.id)}
                        style={{ color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  {cat.items.map(item => (
                    <div key={item.id} style={{ paddingLeft: 12 }}>
                      <ItemRow
                        item={item}
                        onChange={(k, v) => updateCatItem(setInvestCats, cat.id, item.id, k, v)}
                        onRemove={() => removeCatItem(setInvestCats, cat.id, item.id)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addCatItem(setInvestCats, cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                  >
                    <Plus style={{ width: 12, height: 12 }} />Ajouter
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => addCat(setInvestCats, 'Nouvelle catégorie')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Nouvelle catégorie
            </button>
          </div>

          {/* Dépenses */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dépenses</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{fmt(totalDepense)}</span>
            </div>
            {depenseCats.map(cat => {
              const total = cat.items.reduce((s, i) => s + i.value, 0)
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={cat.name}
                      onChange={e => updateCatName(setDepenseCats, cat.id, e.target.value)}
                      className="h-7 text-xs font-semibold flex-1"
                    />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(total)}</span>
                    {depenseCats.length > 1 && (
                      <button onClick={() => removeCat(setDepenseCats, cat.id)}
                        style={{ color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  {cat.items.map(item => (
                    <div key={item.id} style={{ paddingLeft: 12 }}>
                      <ItemRow
                        item={item}
                        onChange={(k, v) => updateCatItem(setDepenseCats, cat.id, item.id, k, v)}
                        onRemove={() => removeCatItem(setDepenseCats, cat.id, item.id)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addCatItem(setDepenseCats, cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                  >
                    <Plus style={{ width: 12, height: 12 }} />Ajouter
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => addCat(setDepenseCats, 'Nouvelle catégorie')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Nouvelle catégorie
            </button>
          </div>
        </div>

        {/* CENTER — KPIs + barre + Sankey + table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI 4-grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: "Taux d'épargne", value: `${savingsRate.toFixed(1)}%`, sub: `${fmt(totalInvest)} investis/mois`, color: kpiAccentColor },
              { label: 'Revenus', value: fmt(totalRevenu), sub: 'revenus mensuels', color: INCOME_COLOR },
              { label: 'Dépenses courantes', value: fmt(totalDepense), sub: `${totalRevenu > 0 ? (totalDepense / totalRevenu * 100).toFixed(1) : 0}% des revenus`, color: '#fb923c' },
              { label: 'Surplus / Balance', value: fmt(balance), sub: balance >= 0 ? 'épargne disponible' : 'déficit mensuel', color: balance >= 0 ? '#34d399' : '#ef4444' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Barre de progression */}
          {totalRevenu > 0 && (
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Répartition mensuelle</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: balance >= 0 ? '#34d399' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{fmt(balance)} balance</span>
              </div>
              <div style={{ height: 10, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ height: '100%', background: '#34d399', width: `${Math.min(totalInvest / totalRevenu * 100, 100)}%`, transition: 'width 0.4s' }} />
                <div style={{ height: '100%', background: '#fb923c', width: `${Math.min(totalDepense / totalRevenu * 100, 100)}%`, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#34d399', display: 'inline-block' }} />
                  Épargne {fmtPct(totalRevenu > 0 ? totalInvest / totalRevenu * 100 : 0)}
                </span>
                <span style={{ fontSize: 11, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#fb923c', display: 'inline-block' }} />
                  Dépenses {fmtPct(totalRevenu > 0 ? totalDepense / totalRevenu * 100 : 0)}
                </span>
              </div>
            </div>
          )}

          {/* Sankey chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 10 }}>Flux financier mensuel</p>
            {!mounted ? (
              <div style={{ height: 280 }} />
            ) : sankeyData.nodes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <Sankey
                  data={sankeyData}
                  nodePadding={12}
                  nodeWidth={22}
                  margin={{ top: 20, right: 185, bottom: 20, left: 130 }}
                  iterations={64}
                  node={(props: Parameters<typeof SankeyNodeRenderer>[0]) => <SankeyNodeRenderer {...props} />}
                  link={(props: Parameters<typeof SankeyLinkRenderer>[0]) => <SankeyLinkRenderer {...props} />}
                >
                  <Tooltip
                    formatter={(v: number) => [fmt(v), '']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: 12, color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                  />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--text-muted-c)' }}>
                Ajoutez des revenus pour afficher le graphique
              </div>
            )}
          </div>

          {/* Table postes par catégorie */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Détail par poste</p>
            </div>
            {[...investCats, ...depenseCats].map((cat, ci) => {
              const catTotal = cat.items.reduce((s, i) => s + i.value, 0)
              if (catTotal <= 0) return null
              return (
                <div key={cat.id}>
                  <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--section-border)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cat.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(catTotal)}</span>
                  </div>
                  {cat.items.filter(i => i.value > 0).sort((a, b) => b.value - a.value).map((item, ii, arr) => (
                    <div key={item.id} style={{ padding: '7px 14px 7px 24px', display: 'flex', justifyContent: 'space-between', borderBottom: ii < arr.length - 1 ? '1px solid var(--section-border)' : ci < [...investCats, ...depenseCats].length - 1 ? '1px solid var(--card-dark-border)' : undefined }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{item.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — analyse + score + donut + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Score analyse */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreConf.borderColor}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color, flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                Score épargne — {scoreConf.label}
              </p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 12 }}>{scoreConf.msg}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Balance', value: fmt(balance), color: balance >= 0 ? '#34d399' : '#ef4444' },
                { label: '% épargnés', value: `${savingsRate.toFixed(1)}%`, color: 'var(--text-primary)' },
                { label: '% dépensés', value: totalRevenu > 0 ? `${(totalDepense / totalRevenu * 100).toFixed(1)}%` : '—', color: 'var(--text-primary)' },
              ].map((m, i) => (
                <div key={i} style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginBottom: 4 }}>{m.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: m.color }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Donut répartition */}
          {donutData.length > 0 && (
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 8 }}>Répartition des revenus</p>
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

          {/* Objectifs recommandés */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Objectifs recommandés</p>
            {[
              { target: 10, label: 'Minimum conseillé', color: '#fbbf24' },
              { target: 20, label: 'Sain', color: '#60a5fa' },
              { target: 30, label: 'Excellent (FIRE)', color: '#34d399' },
            ].map((obj, i) => (
              <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{obj.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: obj.color }}>{obj.target}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: obj.color, width: `${Math.min(savingsRate / obj.target * 100, 100)}%`, transition: 'width 0.4s', opacity: 0.8 }} />
                </div>
              </div>
            ))}
          </div>

          {/* French average widget */}
          <FrenchAverageWidget tauxEpargne={savingsRate} label="Votre taux" />

          {/* Conseils */}
          <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Conseils</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: COLOR, text: 'Automatisez votre épargne dès le 1er du mois — avant les dépenses.' },
                { color: '#60a5fa', text: 'Un taux de 20% ou plus accélère significativement votre liberté financière (FIRE).' },
                { color: '#fbbf24', text: 'Identifiez les 3 postes de dépenses les plus élevés — souvent logement, transport, alimentation.' },
                { color: '#f472b6', text: 'Priorisez PEA, AV et PER pour optimiser la fiscalité de votre épargne.' },
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

export default function SavingsRatePage() { return <Suspense><SavingsRatePageInner /></Suspense> }
