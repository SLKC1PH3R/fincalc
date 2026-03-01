'use client'
import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import {
  RefreshCw, Plus, Pencil, Trash2, TrendingUp, TrendingDown,
  X, Check, Layers, ArrowRight, Flame, Calculator,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ────────────────────────────────────────────────────────────────────
type AssetType = 'STOCK' | 'ETF' | 'CRYPTO' | 'SCPI' | 'LIVRET' | 'CASH'

interface Position {
  id: string
  assetType: AssetType
  symbol: string
  name: string
  quantity: number
  pru: number
  currency: string
}

interface PriceData {
  priceEur: number
  changePct: number
}

interface IndexData {
  label: string
  symbol: string
  price: number | null
  changePct: number
  isRate?: boolean
}

// ── Constantes ───────────────────────────────────────────────────────────────
const ASSET_LABELS: Record<AssetType, string> = {
  STOCK: 'Action', ETF: 'ETF', CRYPTO: 'Crypto',
  SCPI: 'SCPI', LIVRET: 'Livret', CASH: 'Liquidités',
}

const ASSET_EXAMPLES: Record<AssetType, string> = {
  STOCK: 'ex: AAPL, AIR.PA, MSFT',
  ETF: 'ex: CW8.PA, IWDA.AS, SPY',
  CRYPTO: 'ex: BTC, ETH, SOL',
  SCPI: 'ex: Corum Origin, Primopierre',
  LIVRET: 'ex: Livret A, LDDS, LEP',
  CASH: 'ex: Compte courant BNP',
}

const ASSET_COLORS: Record<AssetType, string> = {
  STOCK: '#818cf8', ETF: '#38bdf8', CRYPTO: '#fb923c',
  SCPI: '#f472b6', LIVRET: '#34d399', CASH: '#94a3b8',
}

const PIE_COLORS = ['#818cf8', '#38bdf8', '#fb923c', '#f472b6', '#34d399', '#94a3b8']

// Tickers crypto qui nécessitent l'API CoinGecko (pas Finnhub)
const MANUAL_ASSET_TYPES: AssetType[] = ['SCPI', 'LIVRET', 'CASH']

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

function fmtPct(n: number, sign = true): string {
  const s = sign && n > 0 ? '+' : ''
  return `${s}${n.toFixed(2)} %`
}

// ── Composant : badge type d'actif ──────────────────────────────────────────
function AssetBadge({ type }: { type: AssetType }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 100,
      background: ASSET_COLORS[type] + '18',
      color: ASSET_COLORS[type],
      border: `1px solid ${ASSET_COLORS[type]}35`,
    }}>
      {ASSET_LABELS[type]}
    </span>
  )
}

// ── Composant : variation avec flèche ────────────────────────────────────────
function Change({ value, pct, size = 'sm' }: { value: number; pct: number; size?: 'sm' | 'md' }) {
  const pos = value >= 0
  const color = pos ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)'
  const Icon = pos ? TrendingUp : TrendingDown
  const fs = size === 'md' ? 14 : 12
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color, fontSize: fs, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      <Icon style={{ width: fs - 1, height: fs - 1 }} />
      {pos ? '+' : ''}{fmt(value)} ({fmtPct(pct)})
    </span>
  )
}

// ── Dialog : Ajouter / Modifier une position ─────────────────────────────────
function PositionDialog({
  open, onClose, onSaved, editPosition,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editPosition: Position | null
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    assetType: 'STOCK' as AssetType,
    symbol: '',
    name: '',
    quantity: '',
    pru: '',
    currency: 'EUR',
  })

  useEffect(() => {
    if (editPosition) {
      setForm({
        assetType: editPosition.assetType,
        symbol: editPosition.symbol,
        name: editPosition.name,
        quantity: String(editPosition.quantity),
        pru: String(editPosition.pru),
        currency: editPosition.currency,
      })
    } else {
      setForm({ assetType: 'STOCK', symbol: '', name: '', quantity: '', pru: '', currency: 'EUR' })
    }
  }, [editPosition, open])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const isManual = MANUAL_ASSET_TYPES.includes(form.assetType)

  const handleSubmit = async () => {
    if (!form.symbol || !form.name || !form.quantity || !form.pru) {
      toast({ variant: 'destructive', title: 'Tous les champs sont requis' })
      return
    }
    setSaving(true)
    try {
      let res: Response
      if (editPosition) {
        res = await fetch(`/api/portfolio/${editPosition.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, quantity: +form.quantity, pru: +form.pru }),
        })
      } else {
        res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType: form.assetType,
            symbol: form.assetType === 'CRYPTO' ? form.symbol.toUpperCase() : form.symbol,
            name: form.name,
            quantity: +form.quantity,
            pru: +form.pru,
            currency: form.currency,
          }),
        })
      }
      if (!res.ok) throw new Error()
      toast({ variant: 'success', title: editPosition ? '✓ Position mise à jour' : '✓ Position ajoutée' })
      onSaved()
      onClose()
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {editPosition ? 'Modifier la position' : 'Ajouter une position'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X style={{ width: 18, height: 18, color: 'var(--text-muted-c)' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type — désactivé en édition */}
          {!editPosition && (
            <div className="space-y-1.5">
              <Label>Type d&apos;actif</Label>
              <Select value={form.assetType} onValueChange={v => set('assetType')(v as AssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ASSET_LABELS) as AssetType[]).map(t => (
                    <SelectItem key={t} value={t}>{ASSET_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Symbole — désactivé en édition */}
          {!editPosition && (
            <div className="space-y-1.5">
              <Label>
                {isManual ? 'Identifiant / Nom court' : 'Symbole'}
              </Label>
              <Input
                placeholder={ASSET_EXAMPLES[form.assetType]}
                value={form.symbol}
                onChange={e => set('symbol')(e.target.value)}
              />
            </div>
          )}

          {/* Nom d'affichage */}
          <div className="space-y-1.5">
            <Label>Nom d&apos;affichage</Label>
            <Input
              placeholder="ex: Apple Inc., Bitcoin, Livret A..."
              value={form.name}
              onChange={e => set('name')(e.target.value)}
            />
          </div>

          {/* Quantité + PRU côte à côte */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="space-y-1.5">
              <Label>{isManual ? 'Montant (€)' : 'Quantité'}</Label>
              <Input
                type="number"
                placeholder={isManual ? '8 500' : '10'}
                value={form.quantity}
                onChange={e => set('quantity')(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>PRU (€)</Label>
              <Input
                type="number"
                placeholder="150"
                value={form.pru}
                onChange={e => set('pru')(e.target.value)}
              />
            </div>
          </div>

          {/* Devise (stocks seulement) */}
          {!editPosition && (form.assetType === 'STOCK' || form.assetType === 'ETF') && (
            <div className="space-y-1.5">
              <Label>Devise du marché</Label>
              <Select value={form.currency} onValueChange={set('currency')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR — Euronext (Paris, Amsterdam...)</SelectItem>
                  <SelectItem value="USD">USD — NYSE, NASDAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Note SCPI/LIVRET/CASH */}
          {isManual && (
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'var(--row-hover)', border: '1px solid var(--card-dark-border)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>
              Pour ce type d'actif, la valorisation est mise à jour manuellement via le PRU × quantité. Aucune API n'est appelée.
            </p>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} style={{ flex: 1, background: '#f1c086', color: '#000', border: 'none' }}>
              {saving ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 14, height: 14 }} />}
              {editPosition ? 'Mettre à jour' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Composant : widget mini-indice ───────────────────────────────────────────
function IndexChip({ label, price, changePct, isRate }: IndexData & { label: string }) {
  const pos = changePct >= 0
  const color = pos ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)'
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
      display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 110,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {price == null ? '—' : isRate ? `${price} %` : fmtCompact(price)}
      </span>
      {!isRate && (
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>
          {pos ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)} %
        </span>
      )}
    </div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
function PortfolioPageInner() {
  const chart = useChartTheme()
  const { toast } = useToast()

  const [positions, setPositions] = useState<Position[]>([])
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [indices, setIndices] = useState<IndexData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPosition, setEditPosition] = useState<Position | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Chargement des positions ──
  const loadPositions = useCallback(async () => {
    const res = await fetch('/api/portfolio')
    if (res.ok) {
      const data = await res.json()
      setPositions(data)
      return data as Position[]
    }
    return []
  }, [])

  // ── Chargement des prix ──
  const loadPrices = useCallback(async (pos: Position[]) => {
    const priceable = pos.filter(p => !MANUAL_ASSET_TYPES.includes(p.assetType))
    if (!priceable.length && pos.length === 0) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/portfolio/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: priceable.map(p => ({ id: p.id, assetType: p.assetType, symbol: p.symbol, currency: p.currency })) }),
      })
      if (res.ok) {
        const data = await res.json()
        setPrices(data.prices ?? {})
        setIndices(data.indices ?? [])
      }
    } catch { /* silently fail */ }
    setLoading(false)
    setRefreshing(false)
  }, [])

  // ── Init ──
  useEffect(() => {
    loadPositions().then(pos => loadPrices(pos))
  }, [loadPositions, loadPrices])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPrices(positions)
  }

  const handleSaved = async () => {
    const pos = await loadPositions()
    await loadPrices(pos)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      const pos = await loadPositions()
      await loadPrices(pos)
      toast({ variant: 'success', title: '✓ Position supprimée' })
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la suppression' })
    } finally {
      setDeletingId(null)
    }
  }

  // ── Calculs dérivés ──
  const enriched = useMemo(() => positions.map(p => {
    const priceData = prices[p.symbol]
    const isManual = MANUAL_ASSET_TYPES.includes(p.assetType)
    const currentPriceEur = isManual ? p.pru : (priceData?.priceEur ?? null)
    const currentValueEur = currentPriceEur != null ? currentPriceEur * p.quantity : p.pru * p.quantity
    const costBasis = p.pru * p.quantity
    const plEur = currentValueEur - costBasis
    const plPct = costBasis > 0 ? (plEur / costBasis) * 100 : 0
    const changePct = priceData?.changePct ?? 0
    return { ...p, currentPriceEur, currentValueEur, costBasis, plEur, plPct, changePct, isManual }
  }).sort((a, b) => b.currentValueEur - a.currentValueEur), [positions, prices])

  const totalValue = useMemo(() => enriched.reduce((s, p) => s + p.currentValueEur, 0), [enriched])
  const totalCost = useMemo(() => enriched.reduce((s, p) => s + p.costBasis, 0), [enriched])
  const totalPL = totalValue - totalCost
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0

  const bestPerformer = useMemo(() => {
    if (!enriched.length) return null
    return enriched.reduce((best, p) => p.plPct > best.plPct ? p : best, enriched[0])
  }, [enriched])

  // Répartition par classe pour le camembert
  const pieData = useMemo(() => {
    const byType: Record<string, number> = {}
    for (const p of enriched) {
      byType[p.assetType] = (byType[p.assetType] ?? 0) + p.currentValueEur
    }
    return Object.entries(byType).map(([type, value]) => ({
      name: ASSET_LABELS[type as AssetType] ?? type,
      value: Math.round(value),
      color: ASSET_COLORS[type as AssetType] ?? '#94a3b8',
    }))
  }, [enriched])

  const hasETFOrStock = enriched.some(p => p.assetType === 'ETF' || p.assetType === 'STOCK')

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mon Patrimoine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivi de vos positions · Valorisation en temps réel
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw style={{ width: 13, height: 13, marginRight: 5, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => { setEditPosition(null); setDialogOpen(true) }}
            style={{ background: '#f1c086', color: '#000', border: 'none' }}>
            <Plus style={{ width: 13, height: 13, marginRight: 5 }} />
            Ajouter
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Valeur totale',
            value: loading ? '—' : fmtCompact(totalValue),
            sub: `${positions.length} position${positions.length !== 1 ? 's' : ''}`,
          },
          {
            label: 'Plus/Moins-value',
            value: loading ? '—' : (totalPL >= 0 ? '+' : '') + fmt(totalPL),
            sub: loading ? '' : fmtPct(totalPLPct),
            colored: true,
            positive: totalPL >= 0,
          },
          {
            label: 'Investi',
            value: loading ? '—' : fmtCompact(totalCost),
            sub: 'Coût de revient total',
          },
          {
            label: 'Meilleure perf.',
            value: bestPerformer ? fmtPct(bestPerformer.plPct) : '—',
            sub: bestPerformer?.name ?? 'Aucune position',
            colored: true,
            positive: (bestPerformer?.plPct ?? 0) >= 0,
          },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardDescription>{k.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight" style={k.colored ? { color: k.positive ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)' } : {}}>
                {k.value}
              </div>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Camembert + Indices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Répartition */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par classe d&apos;actif</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                Aucune position — ajoutez vos actifs
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [fmtCompact(v), '']}
                    contentStyle={{ background: chart.tooltip.background, border: `1px solid ${chart.tooltip.border}`, borderRadius: 8, fontSize: 12, color: chart.tooltip.color }}
                    itemStyle={chart.itemStyle}
                    labelStyle={chart.labelStyle}
                  />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Indices */}
        <Card>
          <CardHeader>
            <CardTitle>Marchés &amp; Indices</CardTitle>
            <CardDescription>Données temps réel via Finnhub &amp; CoinGecko</CardDescription>
          </CardHeader>
          <CardContent>
            {indices.length === 0 ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
                {loading ? 'Chargement...' : 'Cliquez sur Actualiser pour charger les indices'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {indices.map((idx, i) => (
                  <IndexChip key={i} {...idx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tableau des positions */}
      <Card>
        <CardHeader>
          <CardTitle>Positions détaillées</CardTitle>
          <CardDescription>
            {loading ? 'Chargement...' : `${positions.length} position${positions.length !== 1 ? 's' : ''} · Valorisation ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enriched.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Layers style={{ width: 36, height: 36, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginBottom: 6 }}>Aucune position enregistrée</p>
              <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 20 }}>
                Ajoutez vos actions, ETFs, cryptos, SCPI et livrets pour commencer le suivi.
              </p>
              <Button size="sm" onClick={() => { setEditPosition(null); setDialogOpen(true) }}
                style={{ background: '#f1c086', color: '#000', border: 'none' }}>
                <Plus style={{ width: 13, height: 13, marginRight: 5 }} />
                Ajouter une position
              </Button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--card-dark-border)' }}>
                    {['Nom', 'Type', 'Qté / Montant', 'PRU', 'Valeur actuelle', '+/- €', '+/- %', ''].map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: i > 2 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enriched.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--section-border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-em)' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>{p.symbol}</div>
                      </td>
                      <td style={{ padding: '11px 12px' }}><AssetBadge type={p.assetType} /></td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted-c)' }}>
                        {p.quantity % 1 === 0 ? p.quantity.toLocaleString('fr-FR') : p.quantity.toFixed(4)}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted-c)' }}>
                        {fmt(p.pru)}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtCompact(p.currentValueEur)}
                        {!p.isManual && p.currentPriceEur != null && (
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400, marginTop: 1 }}>
                            @ {fmt(p.currentPriceEur)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                        <span style={{ color: p.plEur >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {p.plEur >= 0 ? '+' : ''}{fmt(p.plEur)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                        <span style={{ color: p.plPct >= 0 ? 'hsl(160 84% 39%)' : 'hsl(0 72% 51%)', fontWeight: 600 }}>
                          {fmtPct(p.plPct)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { setEditPosition(p); setDialogOpen(true) }}
                            style={{ background: 'none', border: '1px solid var(--card-dark-border)', borderRadius: 7, padding: '4px 7px', cursor: 'pointer', color: 'var(--text-subtle)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted-c)'; e.currentTarget.style.color = 'var(--text-em)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-dark-border)'; e.currentTarget.style.color = 'var(--text-subtle)' }}
                          >
                            <Pencil style={{ width: 12, height: 12 }} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            style={{ background: 'none', border: '1px solid var(--card-dark-border)', borderRadius: 7, padding: '4px 7px', cursor: 'pointer', color: 'var(--text-subtle)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'hsl(0 72% 51%)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-dark-border)'; e.currentTarget.style.color = 'var(--text-subtle)' }}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight cards — liens vers simulateurs */}
      {totalValue > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Aller plus loin avec FinCalc
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: TrendingUp,
                color: '#818cf8',
                title: 'Projetez votre patrimoine',
                desc: `Vos ${fmtCompact(totalValue)} actuels investis à 7 %/an pendant 20 ans…`,
                href: `/dashboard/compound?restore=${encodeURIComponent(JSON.stringify({ capital: Math.round(totalValue), monthly: 500, rate: 7, years: 20, frequency: 12 }))}`,
                cta: 'Simuler les intérêts composés',
              },
              {
                icon: Flame,
                color: '#fb923c',
                title: 'Objectif FI/RE',
                desc: 'À quel âge pourrez-vous vivre de vos rentes ? Calculez votre indépendance financière.',
                href: '/dashboard/fire',
                cta: 'Calculer mon FI/RE',
              },
              ...(hasETFOrStock ? [{
                icon: Calculator,
                color: '#34d399',
                title: 'DCA — Investissement régulier',
                desc: 'Simulez l\'impact d\'un versement mensuel sur la durée.',
                href: '/dashboard/dca',
                cta: 'Simuler le DCA',
              }] : [{
                icon: Calculator,
                color: '#34d399',
                title: 'Taux d\'épargne',
                desc: 'Calculez combien vous pouvez économiser chaque mois.',
                href: '/dashboard/savings-rate',
                cta: 'Calculer mon taux d\'épargne',
              }]),
            ].map((card, i) => (
              <Link key={i} href={card.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                  borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = card.color + '50'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-dark-border)'; e.currentTarget.style.transform = '' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 0% 0%, ${card.color}10, transparent 55%)`, pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, position: 'relative' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: card.color + '18', border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon style={{ width: 16, height: 16, color: card.color }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{card.title}</p>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, marginBottom: 14, position: 'relative' }}>{card.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: card.color, fontWeight: 600, position: 'relative' }}>
                    {card.cta} <ArrowRight style={{ width: 12, height: 12 }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dialog */}
      <PositionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        editPosition={editPosition}
      />
    </div>
  )
}

export default function PortfolioPage() {
  return <Suspense><PortfolioPageInner /></Suspense>
}
