'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, Plus, X, TrendingUp, Minus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { printReport } from '@/lib/print'

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
    <div className="flex gap-2 items-center">
      <Input
        value={item.name}
        onChange={e => onChange('name', e.target.value)}
        className="h-7 text-xs flex-1"
        placeholder={placeholder ?? 'Nom'}
      />
      <div className="flex items-center gap-1 flex-shrink-0">
        <Input
          type="number"
          value={item.value || ''}
          onChange={e => onChange('value', +e.target.value)}
          className="h-7 text-xs w-24 tabular-nums"
          placeholder="0"
        />
        <span className="text-[11px] text-white/30 w-4 flex-shrink-0">€</span>
      </div>
      <button
        onClick={onRemove}
        className="h-5 w-5 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

function SavingsRatePageInner() {
  const [revenus, setRevenus] = useState<LineItem[]>(DEFAULT_REVENUS)
  const [investCats, setInvestCats] = useState<Category[]>(DEFAULT_INVEST)
  const [depenseCats, setDepenseCats] = useState<Category[]>(DEFAULT_DEPENSES)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.revenus) setRevenus(p.revenus)
      if (p.investCats) setInvestCats(p.investCats)
      if (p.depenseCats) setDepenseCats(p.depenseCats)
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
    deficit: { label: 'Déficit', Icon: AlertCircle, color: 'text-red-400', border: 'rgba(239,68,68,0.35)', msg: 'Vos dépenses dépassent vos revenus. Identifiez les postes à réduire en priorité.' },
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: 'text-emerald-400', border: 'rgba(52,211,153,0.35)', msg: `Bravo ! Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Continuez à maximiser vos investissements.` },
    bien: { label: 'Bien', Icon: TrendingUp, color: 'text-blue-400', border: 'rgba(96,165,250,0.35)', msg: `Votre taux d'épargne de ${savingsRate.toFixed(0)}% est sain. Visez 20% pour accélérer votre liberté financière.` },
    moyen: { label: 'À améliorer', Icon: Minus, color: 'text-amber-400', border: 'rgba(251,191,36,0.35)', msg: `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Visez 10% minimum en réduisant les dépenses non essentielles.` },
    nul: { label: 'Aucune épargne', Icon: AlertCircle, color: 'text-amber-400', border: 'rgba(251,191,36,0.35)', msg: "Vous n'avez aucune épargne mensuelle. Commencez par mettre de côté 5% de vos revenus chaque mois." },
  }[score]

  const kpiColor = { deficit: 'text-red-400', excellent: 'text-emerald-400', bien: 'text-blue-400', moyen: 'text-amber-400', nul: 'text-amber-400' }[score]

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Taux d&apos;épargne</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenus · Investissements · Dépenses</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Taux d'épargne", value: `${savingsRate.toFixed(1)}%`, sub: `${fmt(totalInvest)} investis/mois`, accent: true },
          { label: 'Revenus mensuels', value: fmt(totalRevenu) },
          { label: 'Investissements', value: fmt(totalInvest) },
          { label: 'Dépenses', value: fmt(totalDepense) },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className={`text-2xl font-semibold tracking-tight ${k.accent ? kpiColor : ''}`}>{k.value}</div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: input panels ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Revenus */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Revenus</CardTitle>
                <span className="text-sm font-semibold tabular-nums" style={{ color: INCOME_COLOR }}>{fmt(totalRevenu)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
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
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors pt-1"
              >
                <Plus className="h-3 w-3" />Ajouter une source de revenu
              </button>
            </CardContent>
          </Card>

          {/* Investissements */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Investissements</CardTitle>
                <span className="text-sm font-semibold tabular-nums" style={{ color: '#34d399' }}>{fmt(totalInvest)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {investCats.map(cat => {
                const total = cat.items.reduce((s, i) => s + i.value, 0)
                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={cat.name}
                        onChange={e => updateCatName(setInvestCats, cat.id, e.target.value)}
                        className="h-7 text-xs font-semibold flex-1"
                      />
                      <span className="text-xs text-white/40 tabular-nums flex-shrink-0">{fmt(total)}</span>
                      {investCats.length > 1 && (
                        <button onClick={() => removeCat(setInvestCats, cat.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {cat.items.map(item => (
                      <div key={item.id} className="pl-3">
                        <ItemRow
                          item={item}
                          onChange={(k, v) => updateCatItem(setInvestCats, cat.id, item.id, k, v)}
                          onRemove={() => removeCatItem(setInvestCats, cat.id, item.id)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addCatItem(setInvestCats, cat.id)}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors pl-3 pt-0.5"
                    >
                      <Plus className="h-3 w-3" />Ajouter un investissement
                    </button>
                  </div>
                )
              })}
              <button
                onClick={() => addCat(setInvestCats, 'Nouvelle catégorie')}
                className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors w-full pt-2"
                style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}
              >
                <Plus className="h-3 w-3" />Nouvelle catégorie d&apos;investissement
              </button>
            </CardContent>
          </Card>

          {/* Dépenses */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Dépenses</CardTitle>
                <span className="text-sm font-semibold tabular-nums text-white/60">{fmt(totalDepense)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {depenseCats.map(cat => {
                const total = cat.items.reduce((s, i) => s + i.value, 0)
                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={cat.name}
                        onChange={e => updateCatName(setDepenseCats, cat.id, e.target.value)}
                        className="h-7 text-xs font-semibold flex-1"
                      />
                      <span className="text-xs text-white/40 tabular-nums flex-shrink-0">{fmt(total)}</span>
                      {depenseCats.length > 1 && (
                        <button onClick={() => removeCat(setDepenseCats, cat.id)} className="text-white/20 hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {cat.items.map(item => (
                      <div key={item.id} className="pl-3">
                        <ItemRow
                          item={item}
                          onChange={(k, v) => updateCatItem(setDepenseCats, cat.id, item.id, k, v)}
                          onRemove={() => removeCatItem(setDepenseCats, cat.id, item.id)}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addCatItem(setDepenseCats, cat.id)}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors pl-3 pt-0.5"
                    >
                      <Plus className="h-3 w-3" />Ajouter une dépense
                    </button>
                  </div>
                )
              })}
              <button
                onClick={() => addCat(setDepenseCats, 'Nouvelle catégorie')}
                className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/55 transition-colors w-full pt-2"
                style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}
              >
                <Plus className="h-3 w-3" />Nouvelle catégorie de dépense
              </button>
            </CardContent>
          </Card>

        </div>

        {/* ── Right: Sankey + analysis ── */}
        <div className="lg:col-span-3 space-y-4">

          <Card>
            <CardHeader>
              <CardTitle>Flux financier mensuel</CardTitle>
              <CardDescription>Revenus → Budget → Investissements &amp; Dépenses</CardDescription>
            </CardHeader>
            <CardContent>
              {sankeyData.nodes.length > 0 ? (
                <ResponsiveContainer width="100%" height={480}>
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
                      contentStyle={{ background: 'rgba(0,0,0,0.80)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: 12, color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                    />
                  </Sankey>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                  Ajoutez des revenus pour afficher le graphique
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis */}
          <Card style={{ borderColor: scoreConf.border }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <scoreConf.Icon className={`h-4 w-4 ${scoreConf.color}`} />
                <CardTitle>Analyse — Taux d&apos;épargne {scoreConf.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{scoreConf.msg}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Balance mensuelle', value: fmt(balance), color: balance >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: '% revenus épargnés', value: `${savingsRate.toFixed(1)}%`, color: 'text-white/80' },
                  { label: '% revenus dépensés', value: totalRevenu > 0 ? `${(totalDepense / totalRevenu * 100).toFixed(1)}%` : '—', color: 'text-white/80' },
                ].map((m, i) => (
                  <div key={i} className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px] text-white/35 mb-1">{m.label}</p>
                    <p className={`text-base font-semibold tabular-nums ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

export default function SavingsRatePage() { return <Suspense><SavingsRatePageInner /></Suspense> }
