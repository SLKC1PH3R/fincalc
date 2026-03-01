'use client'
import { useState, useEffect, useMemo, useCallback, type ComponentType } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { fmt } from '@/lib/utils'
import {
  TrendingUp, Building2, PiggyBank, Shield, Wallet, Landmark, Bitcoin,
  ChevronRight, RefreshCw, Plus, Pencil, Trash2, Check, X, ArrowLeft,
  Info, Zap, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  lookupByIsin, lookupByTicker, getAlternatives, calcFeeImpact,
  calcPortfolioGeo, ETF_DATABASE, type ETFInfo, type GeoAllocation,
} from '@/lib/etf-database'

const WorldMapChart = dynamic(
  () => import('@/components/WorldMapChart').then(m => m.WorldMapChart),
  { ssr: false, loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>Chargement de la carte…</div> }
)

// ── Types ─────────────────────────────────────────────────────────────────────
type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'
type AssetType = 'STOCK' | 'ETF' | 'CRYPTO' | 'SCPI' | 'LIVRET' | 'CASH'

interface Position {
  id: string
  assetType: AssetType
  symbol: string
  name: string
  quantity: number
  pru: number
  currency: string
  envelopeId?: string | null
}

interface PriceData { priceEur: number; changePct: number }

interface Envelope {
  id: string
  type: EnvelopeType
  name: string
  metadata: Record<string, unknown>
  positions: Position[]
  positionCount: number
  totalValue: number | null
  createdAt: string
  updatedAt: string
}

// ── Config ────────────────────────────────────────────────────────────────────
const ENVELOPE_TYPE_CONFIG: Record<EnvelopeType, {
  label: string; color: string
  icon: ComponentType<{ style?: object; className?: string }>
}> = {
  LIVRET:     { label: 'Livret réglementé', color: '#34d399', icon: PiggyBank  },
  IMMOBILIER: { label: 'Immobilier',        color: '#f472b6', icon: Building2  },
  PEA:        { label: 'PEA',              color: '#818cf8', icon: TrendingUp  },
  AV:         { label: 'Assurance Vie',     color: '#fb923c', icon: Shield     },
  CTO:        { label: 'Compte-Titres',     color: '#38bdf8', icon: TrendingUp },
  CRYPTO:     { label: 'Crypto',            color: '#f59e0b', icon: Bitcoin    },
  PER:        { label: 'PER',              color: '#a78bfa', icon: Landmark    },
  CASH:       { label: 'Liquidités',        color: '#94a3b8', icon: Wallet     },
}

const LIVRET_CONFIG: Record<string, { label: string; maxBalance: number | null; rate: number }> = {
  LIVRET_A:     { label: 'Livret A',     maxBalance: 22_950, rate: 2.4 },
  LDDS:         { label: 'LDDS',         maxBalance: 12_000, rate: 2.4 },
  LEP:          { label: 'LEP',          maxBalance: 10_000, rate: 3.5 },
  LIVRET_JEUNE: { label: 'Livret Jeune', maxBalance:  1_600, rate: 4.0 },
  PEL:          { label: 'PEL',          maxBalance: 61_200, rate: 2.25 },
  CEL:          { label: 'CEL',          maxBalance: 15_300, rate: 1.5  },
  LIVRET_B:     { label: 'Livret B',     maxBalance: null,   rate: 0.5  },
  AUTRE:        { label: 'Autre livret', maxBalance: null,   rate: 0    },
}

const PEA_MAX = 150_000

const ASSET_LABELS: Record<AssetType, string> = {
  STOCK: 'Action', ETF: 'ETF', CRYPTO: 'Crypto',
  SCPI: 'SCPI', LIVRET: 'Livret', CASH: 'Liquidités',
}
const ASSET_COLORS: Record<AssetType, string> = {
  STOCK: '#818cf8', ETF: '#38bdf8', CRYPTO: '#fb923c',
  SCPI: '#f472b6', LIVRET: '#34d399', CASH: '#94a3b8',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}
function fmtPct(n: number, sign = true) {
  const s = sign && n > 0 ? '+' : ''
  return `${s}${n.toFixed(2)} %`
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function EnvelopeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [envelope, setEnvelope] = useState<Envelope | null>(null)
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [pricesLoading, setPricesLoading] = useState(false)

  // Édition du nom
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Suppression
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadEnvelope = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patrimoine/envelopes/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEnvelope(data)
      setNameInput(data.name)
    } catch {
      toast({ title: 'Erreur chargement', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => { loadEnvelope() }, [loadEnvelope])

  // Charger les prix pour PEA/CTO/CRYPTO
  const loadPrices = useCallback(async (positions: Position[]) => {
    if (!positions.length) return
    setPricesLoading(true)
    try {
      const marketPositions = positions.filter(p => !['LIVRET', 'CASH'].includes(p.assetType))
      if (!marketPositions.length) return
      const res = await fetch('/api/portfolio/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: marketPositions }),
      })
      if (res.ok) setPrices(await res.json())
    } catch { /* ignore */ }
    finally { setPricesLoading(false) }
  }, [])

  useEffect(() => {
    if (envelope && ['PEA', 'CTO', 'CRYPTO'].includes(envelope.type)) {
      loadPrices(envelope.positions)
    }
  }, [envelope, loadPrices])

  // Sauvegarder les metadata
  const saveMetadata = async (meta: Record<string, unknown>) => {
    const res = await fetch(`/api/patrimoine/envelopes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: meta }),
    })
    if (!res.ok) throw new Error()
    setEnvelope(prev => prev ? { ...prev, metadata: meta } : null)
    window.dispatchEvent(new Event('patrimoine-updated'))
  }

  // Renommer
  const handleRename = async () => {
    if (!nameInput.trim()) return
    try {
      await fetch(`/api/patrimoine/envelopes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim() }),
      })
      setEnvelope(prev => prev ? { ...prev, name: nameInput.trim() } : null)
      setEditingName(false)
      window.dispatchEvent(new Event('patrimoine-updated'))
    } catch { toast({ title: 'Erreur renommage', variant: 'destructive' }) }
  }

  // Supprimer
  const handleDelete = async () => {
    try {
      await fetch(`/api/patrimoine/envelopes/${id}`, { method: 'DELETE' })
      window.dispatchEvent(new Event('patrimoine-updated'))
      router.push('/dashboard/patrimoine')
    } catch { toast({ title: 'Erreur suppression', variant: 'destructive' }) }
  }

  // Valeur de marché
  const totalMarketValue = useMemo(() => {
    if (!envelope) return 0
    if (envelope.totalValue !== null) return envelope.totalValue
    return envelope.positions.reduce((s, p) => {
      const pd = prices[p.symbol]
      return s + (pd ? pd.priceEur * p.quantity : p.pru * p.quantity)
    }, 0)
  }, [envelope, prices])

  const totalInvested = useMemo(() => {
    if (!envelope) return 0
    return envelope.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  }, [envelope])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-subtle)', fontSize: 14 }}>
        Chargement…
      </div>
    )
  }

  if (!envelope) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ color: 'var(--text-subtle)', fontSize: 14, marginBottom: 16 }}>Enveloppe introuvable</div>
        <Link href="/dashboard/patrimoine">
          <Button variant="outline" size="sm">← Retour</Button>
        </Link>
      </div>
    )
  }

  const cfg = ENVELOPE_TYPE_CONFIG[envelope.type]
  const Icon = cfg.icon
  const hasMetadata = Object.keys(envelope.metadata).length > 0

  return (
    <div className="space-y-6" style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 48 }}>

      {/* ── Breadcrumb + Header ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-subtle)', marginBottom: 12 }}>
          <Link href="/dashboard/patrimoine" style={{ color: 'var(--text-subtle)', textDecoration: 'none' }}>
            Patrimoine
          </Link>
          <ChevronRight style={{ width: 12, height: 12 }} />
          <span style={{ color: 'var(--text-primary)' }}>{envelope.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: cfg.color + '18', border: `1.5px solid ${cfg.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon style={{ width: 22, height: 22, color: cfg.color }} />
            </div>
            <div>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false) }}
                    style={{ height: 32, fontSize: 18, fontWeight: 700, width: 260 }}
                  />
                  <button onClick={handleRename} style={{ padding: 4, borderRadius: 6, background: cfg.color + '20', border: `1px solid ${cfg.color}40`, cursor: 'pointer' }}>
                    <Check style={{ width: 14, height: 14, color: cfg.color }} />
                  </button>
                  <button onClick={() => setEditingName(false)} style={{ padding: 4, borderRadius: 6, background: 'none', border: '1px solid var(--card-dark-border)', cursor: 'pointer' }}>
                    <X style={{ width: 14, height: 14, color: 'var(--text-subtle)' }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{envelope.name}</h1>
                  <button onClick={() => setEditingName(true)} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{cfg.label}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!confirmDelete ? (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} style={{ color: '#ef4444', borderColor: '#ef444430' }}>
                <Trash2 style={{ width: 14, height: 14, marginRight: 4 }} />
                Supprimer
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Annuler</Button>
                <Button size="sm" onClick={handleDelete} style={{ background: '#ef4444', color: '#fff' }}>
                  Confirmer la suppression
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Contenu selon le type ── */}
      {envelope.type === 'LIVRET' && (
        <LivretSection
          envelope={envelope}
          onSave={saveMetadata}
          toast={toast}
        />
      )}

      {envelope.type === 'IMMOBILIER' && (
        <ImmobilierSection
          envelope={envelope}
          onSave={saveMetadata}
          chartTheme={chartTheme}
        />
      )}

      {(envelope.type === 'PEA' || envelope.type === 'CTO') && (
        <PeaCtoCryptoSection
          envelope={envelope}
          positions={envelope.positions}
          prices={prices}
          pricesLoading={pricesLoading}
          totalMarketValue={totalMarketValue}
          totalInvested={totalInvested}
          onRefreshPrices={() => loadPrices(envelope.positions)}
          onSave={saveMetadata}
          chartTheme={chartTheme}
          onReload={loadEnvelope}
        />
      )}

      {envelope.type === 'AV' && (
        <AVSection envelope={envelope} onSave={saveMetadata} />
      )}

      {envelope.type === 'CRYPTO' && (
        <PeaCtoCryptoSection
          envelope={envelope}
          positions={envelope.positions}
          prices={prices}
          pricesLoading={pricesLoading}
          totalMarketValue={totalMarketValue}
          totalInvested={totalInvested}
          onRefreshPrices={() => loadPrices(envelope.positions)}
          onSave={saveMetadata}
          chartTheme={chartTheme}
          onReload={loadEnvelope}
          isCrypto
        />
      )}

      {envelope.type === 'PER' && (
        <PERSection envelope={envelope} onSave={saveMetadata} />
      )}

      {envelope.type === 'CASH' && (
        <CashSection envelope={envelope} onSave={saveMetadata} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section LIVRET
// ─────────────────────────────────────────────────────────────────────────────
function LivretSection({ envelope, onSave, toast }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
  toast: ReturnType<typeof useToast>['toast']
}) {
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0

  const [livretType, setLivretType] = useState(String(meta.livretType ?? 'LIVRET_A'))
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [saving, setSaving] = useState(false)

  const livretCfg = LIVRET_CONFIG[livretType] ?? LIVRET_CONFIG.LIVRET_A
  const balanceNum = parseFloat(balance) || 0
  const maxBalance = livretCfg.maxBalance
  const rate = livretCfg.rate
  const projectedInterest = balanceNum * (rate / 100)
  const pct = maxBalance ? Math.min(100, (balanceNum / maxBalance) * 100) : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ livretType, balance: balanceNum, maxBalance, rate })
      toast({ title: 'Livret mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {/* Wizard si pas de données */}
      {!isSetup && (
        <div style={{
          padding: '20px 24px', borderRadius: 14,
          background: '#34d39912', border: '1.5px solid #34d39930',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Info style={{ width: 16, height: 16, color: '#34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Première saisie</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>
            Renseignez les informations de votre livret pour commencer à le suivre.
          </p>
        </div>
      )}

      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Type de livret</Label>
              <Select value={livretType} onValueChange={setLivretType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIVRET_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Solde actuel (€)</Label>
              <Input
                type="number"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="ex : 8 500"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !balance}>
            {saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard si données présentes */}
      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'Solde', value: fmtEur(balanceNum), color: '#34d399' },
            { label: 'Taux en cours', value: `${rate} %`, color: '#f1c086', sub: 'Taux réglementé' },
            { label: 'Intérêts annuels estimés', value: fmtEur(projectedInterest), color: '#818cf8' },
            ...(maxBalance ? [{ label: 'Plafond légal', value: fmtEur(maxBalance), color: '#94a3b8', sub: `Reste ${fmtEur(Math.max(0, maxBalance - balanceNum))}` }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Barre progression */}
      {pct !== null && balanceNum > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Utilisation du plafond</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{pct.toFixed(1)} %</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--section-border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#f59e0b' : '#34d399', borderRadius: 999, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{fmtEur(balanceNum)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Plafond : {fmtEur(maxBalance!)}</span>
            </div>
            {pct >= 90 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f59e0b' }}>
                <AlertTriangle style={{ width: 14, height: 14 }} />
                Plafond presque atteint — pensez à verser sur un autre livret.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section IMMOBILIER
// ─────────────────────────────────────────────────────────────────────────────
function ImmobilierSection({ envelope, onSave, chartTheme }: {
  envelope: Envelope; onSave: (m: Record<string, unknown>) => Promise<void>
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0

  const [form, setForm] = useState({
    address: String(meta.address ?? ''),
    surface: String(meta.surface ?? ''),
    purchaseYear: String(meta.purchaseYear ?? ''),
    purchasePrice: String(meta.purchasePrice ?? ''),
    currentValue: String(meta.currentValue ?? ''),
    hasCredit: Boolean(meta.hasCredit ?? false),
    creditRemaining: String(meta.creditRemaining ?? ''),
    creditRate: String(meta.creditRate ?? ''),
    creditMonthly: String(meta.creditMonthly ?? ''),
    creditEndYear: String(meta.creditEndYear ?? ''),
    isRental: Boolean(meta.isRental ?? false),
    monthlyRent: String(meta.monthlyRent ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const fb = (k: keyof typeof form) => (v: boolean) => setForm(p => ({ ...p, [k]: v }))

  const currentValue = parseFloat(form.currentValue) || 0
  const purchasePrice = parseFloat(form.purchasePrice) || 0
  const creditRemaining = form.hasCredit ? (parseFloat(form.creditRemaining) || 0) : 0
  const netEquity = Math.max(0, currentValue - creditRemaining)
  const latentGain = currentValue - purchasePrice
  const ltv = currentValue > 0 && creditRemaining > 0 ? (creditRemaining / currentValue) * 100 : 0

  // Graphe equity projetée (sans crédit)
  const equityData = useMemo(() => {
    if (!currentValue) return []
    const years = parseInt(form.creditEndYear) - new Date().getFullYear()
    if (!form.hasCredit || years <= 0) return []
    const monthly = parseFloat(form.creditMonthly) || 0
    const rate = parseFloat(form.creditRate) / 100 / 12 || 0
    let remaining = creditRemaining
    return Array.from({ length: Math.min(years + 1, 31) }, (_, i) => {
      const eq = Math.max(0, currentValue * Math.pow(1.02, i) - remaining) // appréciation 2%/an
      const r = remaining
      remaining = Math.max(0, remaining - monthly * 12 + remaining * rate * 12)
      return { year: new Date().getFullYear() + i, equity: Math.round(eq), credit: Math.round(r) }
    })
  }, [currentValue, creditRemaining, form])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        address: form.address, surface: parseFloat(form.surface) || 0,
        purchaseYear: parseInt(form.purchaseYear) || 0, purchasePrice,
        currentValue, hasCredit: form.hasCredit,
        creditRemaining, creditRate: parseFloat(form.creditRate) || 0,
        creditMonthly: parseFloat(form.creditMonthly) || 0,
        creditEndYear: parseInt(form.creditEndYear) || 0,
        isRental: form.isRental, monthlyRent: parseFloat(form.monthlyRent) || 0,
      })
      toast({ title: 'Bien immobilier mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#f472b612', border: '1.5px solid #f472b630' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Info style={{ width: 16, height: 16, color: '#f472b6' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Première saisie</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>
            Renseignez les informations de votre bien immobilier pour calculer votre patrimoine net.
          </p>
        </div>
      )}

      {/* Formulaire */}
      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Informations du bien</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label style={{ marginBottom: 6, display: 'block' }}>Adresse (optionnel)</Label>
              <Input value={form.address} onChange={f('address')} placeholder="12 rue de la Paix, Paris 75001" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Surface (m²)</Label>
              <Input type="number" value={form.surface} onChange={f('surface')} placeholder="75" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Année d'achat</Label>
              <Input type="number" value={form.purchaseYear} onChange={f('purchaseYear')} placeholder="2020" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Prix d'achat (€)</Label>
              <Input type="number" value={form.purchasePrice} onChange={f('purchasePrice')} placeholder="200 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur actuelle estimée (€)</Label>
              <Input type="number" value={form.currentValue} onChange={f('currentValue')} placeholder="250 000" />
            </div>
          </div>

          {/* Toggle locatif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.isRental ? 12 : 0 }}>
            <button
              onClick={() => fb('isRental')(!form.isRental)}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: form.isRental ? '#f472b6' : 'var(--section-border)',
                transition: 'background 0.2s', position: 'relative',
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: form.isRental ? 18 : 3,
              }} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Bien locatif</span>
          </div>
          {form.isRental && (
            <div style={{ marginBottom: 16 }}>
              <Label style={{ marginBottom: 6, display: 'block' }}>Loyer mensuel perçu (€)</Label>
              <Input type="number" value={form.monthlyRent} onChange={f('monthlyRent')} placeholder="800" style={{ maxWidth: 200 }} />
            </div>
          )}

          {/* Toggle crédit */}
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 12px' }}>Crédit immobilier</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.hasCredit ? 16 : 0 }}>
            <button
              onClick={() => fb('hasCredit')(!form.hasCredit)}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: form.hasCredit ? '#818cf8' : 'var(--section-border)',
                transition: 'background 0.2s', position: 'relative',
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, transition: 'left 0.2s',
                left: form.hasCredit ? 18 : 3,
              }} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>J'ai un crédit en cours</span>
          </div>

          {form.hasCredit && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Capital restant dû (€)</Label>
                <Input type="number" value={form.creditRemaining} onChange={f('creditRemaining')} placeholder="150 000" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Taux annuel (%)</Label>
                <Input type="number" value={form.creditRate} onChange={f('creditRate')} placeholder="1.5" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Mensualité (€)</Label>
                <Input type="number" value={form.creditMonthly} onChange={f('creditMonthly')} placeholder="800" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Année de fin du crédit</Label>
                <Input type="number" value={form.creditEndYear} onChange={f('creditEndYear')} placeholder="2040" />
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>

      {/* KPIs si données */}
      {isSetup && currentValue > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur du bien', value: fmtEur(currentValue), color: '#f472b6' },
            { label: 'Patrimoine net', value: fmtEur(netEquity), color: '#34d399', sub: form.hasCredit ? `Après crédit (${fmtEur(creditRemaining)})` : 'Valeur libre' },
            { label: 'Plus-value latente', value: `${latentGain >= 0 ? '+' : ''}${fmtEur(latentGain)}`, color: latentGain >= 0 ? '#34d399' : '#ef4444', sub: purchasePrice > 0 ? `${((latentGain / purchasePrice) * 100).toFixed(1)} %` : '' },
            ...(form.hasCredit && ltv > 0 ? [{ label: 'LTV (dette/valeur)', value: `${ltv.toFixed(1)} %`, color: ltv > 80 ? '#f59e0b' : '#818cf8', sub: ltv > 80 ? 'LTV élevé' : 'LTV sain' }] : []),
            ...(form.isRental && parseFloat(form.monthlyRent) > 0 ? [{
              label: 'Rendement brut',
              value: `${((parseFloat(form.monthlyRent) * 12 / currentValue) * 100).toFixed(2)} %`,
              color: '#38bdf8', sub: `${fmtEur(parseFloat(form.monthlyRent) * 12)} / an`,
            }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Graphe equity si crédit */}
      {isSetup && equityData.length > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Évolution du patrimoine net (projection)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.tick }} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 11, fill: chartTheme.tick }} width={70} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtEur(v), name === 'equity' ? 'Patrimoine net' : 'Capital restant dû']}
                  contentStyle={{ background: chartTheme.tooltip.background, border: `1px solid ${chartTheme.tooltip.border}`, borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="equity" stroke="#34d399" fill="#34d39918" name="equity" strokeWidth={2} />
                <Area type="monotone" dataKey="credit" stroke="#f472b6" fill="#f472b612" name="credit" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section PEA / CTO / CRYPTO — positions + optimisation + carte
// ─────────────────────────────────────────────────────────────────────────────
function PeaCtoCryptoSection({
  envelope, positions, prices, pricesLoading,
  totalMarketValue, totalInvested,
  onRefreshPrices, onSave, chartTheme, onReload, isCrypto = false,
}: {
  envelope: Envelope
  positions: Position[]
  prices: Record<string, PriceData>
  pricesLoading: boolean
  totalMarketValue: number
  totalInvested: number
  onRefreshPrices: () => void
  onSave: (m: Record<string, unknown>) => Promise<void>
  chartTheme: ReturnType<typeof useChartTheme>
  onReload: () => void
  isCrypto?: boolean
}) {
  const meta = envelope.metadata
  const isPEA = envelope.type === 'PEA'
  const depositedNum = Number(meta.totalDeposited ?? 0)
  const peaPct = isPEA && depositedNum > 0 ? Math.min(100, (depositedNum / PEA_MAX) * 100) : null

  const [depositInput, setDepositInput] = useState(String(meta.totalDeposited ?? ''))
  const [openedYear, setOpenedYear] = useState(String(meta.openedYear ?? ''))
  const [savingMeta, setSavingMeta] = useState(false)
  const { toast } = useToast()

  // Nouvelle position
  const [showAddPos, setShowAddPos] = useState(false)
  const [newPos, setNewPos] = useState({ assetType: 'ETF' as AssetType, symbol: '', name: '', quantity: '', pru: '', isin: '' })
  const [addingPos, setAddingPos] = useState(false)

  const pf = (k: keyof typeof newPos) => (e: React.ChangeEvent<HTMLInputElement>) => setNewPos(p => ({ ...p, [k]: e.target.value }))

  const perf = totalInvested > 0 ? ((totalMarketValue - totalInvested) / totalInvested) * 100 : 0
  const perfAbs = totalMarketValue - totalInvested

  const saveMeta = async () => {
    setSavingMeta(true)
    try {
      await onSave({ ...meta, totalDeposited: parseFloat(depositInput) || 0, openedYear: parseInt(openedYear) || 0 })
      toast({ title: 'Informations mises à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSavingMeta(false) }
  }

  const addPosition = async () => {
    if (!newPos.symbol || !newPos.quantity || !newPos.pru) return
    setAddingPos(true)
    try {
      const body = {
        envelopeId: envelope.id,
        assetType: newPos.assetType,
        symbol: newPos.symbol.toUpperCase(),
        name: newPos.name || newPos.symbol.toUpperCase(),
        quantity: parseFloat(newPos.quantity),
        pru: parseFloat(newPos.pru),
        currency: 'EUR',
        isin: newPos.isin || undefined,
      }
      const res = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      setNewPos({ assetType: 'ETF', symbol: '', name: '', quantity: '', pru: '', isin: '' })
      setShowAddPos(false)
      onReload()
    } catch { toast({ title: 'Erreur ajout position', variant: 'destructive' }) }
    finally { setAddingPos(false) }
  }

  const deletePosition = async (posId: string) => {
    try {
      await fetch(`/api/portfolio/${posId}`, { method: 'DELETE' })
      onReload()
    } catch { toast({ title: 'Erreur suppression', variant: 'destructive' }) }
  }

  // Géographie pour les ETFs/actions
  const geoAlloc = useMemo((): GeoAllocation & { values: Partial<Record<keyof GeoAllocation, number>>; totalGeo: number } => {
    const positionsForGeo = positions
      .filter(p => ['ETF', 'STOCK'].includes(p.assetType))
      .map(p => {
        const pd = prices[p.symbol]
        const value = pd ? pd.priceEur * p.quantity : p.pru * p.quantity
        return { value, ticker: p.symbol }
      })
    const geo = calcPortfolioGeo(positionsForGeo)
    const values: Partial<Record<keyof GeoAllocation, number>> = {}
    const tv = geo.totalValue
    for (const key of ['northAmerica', 'europe', 'asiaPacific', 'emergingMarkets', 'other'] as const) {
      values[key] = geo[key] * tv
    }
    return { ...geo, values, totalGeo: tv }
  }, [positions, prices])

  return (
    <div className="space-y-4">
      {/* Méta PEA */}
      {isPEA && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Informations PEA</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Versements effectués (€)</Label>
                <Input type="number" value={depositInput} onChange={e => setDepositInput(e.target.value)} placeholder="50 000" style={{ width: 180 }} />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Année d'ouverture</Label>
                <Input type="number" value={openedYear} onChange={e => setOpenedYear(e.target.value)} placeholder="2020" style={{ width: 120 }} />
              </div>
              <Button onClick={saveMeta} disabled={savingMeta} variant="outline" size="sm" style={{ marginBottom: 1 }}>
                {savingMeta ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </div>
            {depositedNum > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Plafond de versements</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{peaPct?.toFixed(1)} %</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--section-border)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${peaPct ?? 0}%`, background: '#818cf8', borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{fmtCompact(depositedNum)} versés</span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Plafond : 150 000 € — Reste {fmtCompact(Math.max(0, PEA_MAX - depositedNum))}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPIs performances */}
      {positions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur de marché', value: fmtCompact(totalMarketValue), color: '#f1c086', sub: pricesLoading ? 'Mise à jour…' : 'Prix temps réel' },
            { label: 'Investi (PRU)', value: fmtCompact(totalInvested), color: '#818cf8' },
            { label: 'Performance', value: `${perf >= 0 ? '+' : ''}${perf.toFixed(2)} %`, color: perf >= 0 ? '#34d399' : '#ef4444', sub: `${perfAbs >= 0 ? '+' : ''}${fmtCompact(perfAbs)}` },
            { label: 'Nb positions', value: String(positions.length), color: '#38bdf8' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Tableau positions */}
      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--section-border)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Positions ({positions.length})
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onRefreshPrices}
                disabled={pricesLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--card-dark-border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-subtle)' }}
              >
                <RefreshCw style={{ width: 12, height: 12, animation: pricesLoading ? 'spin 1s linear infinite' : 'none' }} />
                Actualiser
              </button>
              <button
                onClick={() => setShowAddPos(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--card-dark-border)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}
              >
                <Plus style={{ width: 12, height: 12 }} />
                Ajouter
              </button>
            </div>
          </div>

          {/* Formulaire ajout */}
          {showAddPos && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--section-border)', background: 'var(--row-hover)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Type</Label>
                  <Select value={newPos.assetType} onValueChange={(v: AssetType) => setNewPos(p => ({ ...p, assetType: v }))}>
                    <SelectTrigger style={{ width: 100 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['ETF', 'STOCK', 'CRYPTO', 'SCPI', 'CASH'] as AssetType[]).map(t => (
                        <SelectItem key={t} value={t}>{ASSET_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Symbole</Label>
                  <Input value={newPos.symbol} onChange={pf('symbol')} placeholder={isCrypto ? 'BTC' : 'CW8.PA'} style={{ width: 100 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>ISIN (optionnel)</Label>
                  <Input value={newPos.isin} onChange={pf('isin')} placeholder="FR0011…" style={{ width: 140 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Nom</Label>
                  <Input value={newPos.name} onChange={pf('name')} placeholder="Amundi MSCI World" style={{ width: 180 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Quantité</Label>
                  <Input type="number" value={newPos.quantity} onChange={pf('quantity')} placeholder="10" style={{ width: 80 }} />
                </div>
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>PRU (€)</Label>
                  <Input type="number" value={newPos.pru} onChange={pf('pru')} placeholder="500" style={{ width: 90 }} />
                </div>
                <Button onClick={addPosition} disabled={addingPos} size="sm">
                  {addingPos ? '…' : <Check style={{ width: 14, height: 14 }} />}
                </Button>
                <Button onClick={() => setShowAddPos(false)} variant="outline" size="sm">
                  <X style={{ width: 14, height: 14 }} />
                </Button>
              </div>
            </div>
          )}

          {/* Lignes */}
          {positions.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>
              Aucune position — cliquez sur "Ajouter" pour commencer
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--section-border)' }}>
                    {['Type', 'Titre', 'Quantité', 'PRU', 'Cours', 'Valeur', 'Perf', ''].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => {
                    const pd = prices[pos.symbol]
                    const value = pd ? pd.priceEur * pos.quantity : pos.pru * pos.quantity
                    const perf = pd ? ((pd.priceEur - pos.pru) / pos.pru) * 100 : null
                    const color = perf === null ? 'var(--text-subtle)' : perf >= 0 ? '#34d399' : '#ef4444'

                    return (
                      <tr key={pos.id} style={{ borderBottom: '1px solid var(--section-border)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--row-hover)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: ASSET_COLORS[pos.assetType] + '18', color: ASSET_COLORS[pos.assetType] }}>
                            {ASSET_LABELS[pos.assetType]}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pos.symbol}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{pos.name}</div>
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{pos.quantity}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmtEur(pos.pru)}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {pd ? fmtEur(pd.priceEur) : <span style={{ color: 'var(--text-subtle)' }}>—</span>}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtEur(value)}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
                          {perf !== null ? `${perf >= 0 ? '+' : ''}${perf.toFixed(2)} %` : '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <button onClick={() => deletePosition(pos.id)} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}>
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte géographique */}
      {!isCrypto && geoAlloc.totalGeo > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Répartition géographique
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 16 }}>
              Calculé sur {fmtCompact(geoAlloc.totalGeo)} d'actifs reconnus
            </div>
            <WorldMapChart
              allocation={geoAlloc}
              values={geoAlloc.values}
              totalValue={geoAlloc.totalGeo}
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Optimisation ETF */}
      {!isCrypto && positions.filter(p => p.assetType === 'ETF').length > 0 && (
        <EtfOptimisationSection positions={positions} prices={prices} chartTheme={chartTheme} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Optimisation ETF
// ─────────────────────────────────────────────────────────────────────────────
function EtfOptimisationSection({ positions, prices, chartTheme }: {
  positions: Position[]
  prices: Record<string, PriceData>
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const etfPositions = positions.filter(p => p.assetType === 'ETF')
  const [years, setYears] = useState(20)
  const [returnRate, setReturnRate] = useState(8)

  return (
    <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
      <CardContent style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap style={{ width: 16, height: 16, color: '#f1c086' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Optimisation ETF</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
          Analyse des frais de gestion et impact sur votre patrimoine à long terme
        </div>

        {/* Paramètres globaux */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Horizon (années)</Label>
            <Input type="number" value={years} onChange={e => setYears(parseInt(e.target.value) || 20)} style={{ width: 80 }} />
          </div>
          <div>
            <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Rendement brut estimé (%)</Label>
            <Input type="number" value={returnRate} onChange={e => setReturnRate(parseFloat(e.target.value) || 8)} style={{ width: 80 }} />
          </div>
        </div>

        <div className="space-y-4">
          {etfPositions.map(pos => (
            <EtfCard key={pos.id} pos={pos} prices={prices} years={years} returnRate={returnRate / 100} chartTheme={chartTheme} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EtfCard({ pos, prices, years, returnRate, chartTheme }: {
  pos: Position; prices: Record<string, PriceData>
  years: number; returnRate: number
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const pd = prices[pos.symbol]
  const posValue = pd ? pd.priceEur * pos.quantity : pos.pru * pos.quantity
  const [expanded, setExpanded] = useState(false)

  // Chercher dans la base (par symbole ou ISIN)
  const etfInfo: ETFInfo | null = lookupByTicker(pos.symbol) ?? null
  const alternatives = etfInfo ? getAlternatives(etfInfo.isin) : []
  const bestAlternative = alternatives.length > 0 ? alternatives.reduce((best, alt) => alt.ter < best.ter ? alt : best) : null

  if (!etfInfo) {
    // ETF non reconnu dans la base
    return (
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--row-hover)', border: '1px solid var(--section-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginLeft: 8 }}>{pos.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>ETF non référencé — ajoutez l'ISIN pour l'analyser</span>
        </div>
      </div>
    )
  }

  const feeImpact = bestAlternative
    ? calcFeeImpact(posValue, years, returnRate, etfInfo.ter, bestAlternative.ter)
    : null

  // Données graphe comparaison frais
  const chartData = bestAlternative ? Array.from({ length: years + 1 }, (_, i) => {
    const r1 = returnRate - etfInfo.ter
    const r2 = returnRate - bestAlternative.ter
    return {
      year: i,
      current: Math.round(posValue * Math.pow(1 + r1, i)),
      alternative: Math.round(posValue * Math.pow(1 + r2, i)),
    }
  }) : []

  const isOptimal = !bestAlternative || etfInfo.ter <= bestAlternative.ter

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${isOptimal ? '#34d39930' : '#f59e0b30'}`, overflow: 'hidden' }}>
      {/* En-tête */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', padding: '14px 16px', background: isOptimal ? '#34d39908' : '#f59e0b08',
          border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isOptimal ? '#34d399' : '#f59e0b', flexShrink: 0,
          }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginLeft: 8 }}>{etfInfo.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: etfInfo.ter <= 0.002 ? '#34d39918' : etfInfo.ter <= 0.004 ? '#f59e0b18' : '#ef444418',
              color: etfInfo.ter <= 0.002 ? '#34d399' : etfInfo.ter <= 0.004 ? '#f59e0b' : '#ef4444',
            }}>
              {(etfInfo.ter * 100).toFixed(2)} % TER
            </span>
          </div>
          <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '16px 16px', borderTop: `1px solid ${isOptimal ? '#34d39920' : '#f59e0b20'}` }}>
          {/* Info ETF */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'Benchmark', value: etfInfo.benchmark },
              { label: 'Réplication', value: etfInfo.replication === 'synthetic' ? 'Synthétique' : 'Physique' },
              { label: 'Encours', value: `${etfInfo.aum.toLocaleString('fr-FR')} M€` },
              { label: 'Frais annuels sur', value: fmtEur(posValue), sub: `${fmtEur(posValue * etfInfo.ter)} / an` },
            ].map(item => (
              <div key={item.label} style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: 11, color: '#f59e0b' }}>{item.sub}</div>}
              </div>
            ))}
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {isOptimal ? '✅ Vous avez déjà un bon ETF' : '💡 Alternatives moins chères sur le même benchmark'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alternatives.map(alt => (
                  <div key={alt.isin} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8,
                    background: alt.ter < etfInfo.ter ? '#34d39910' : 'var(--row-hover)',
                    border: `1px solid ${alt.ter < etfInfo.ter ? '#34d39930' : 'var(--section-border)'}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{alt.ticker} — {alt.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                        {alt.replication === 'synthetic' ? 'Synthétique' : 'Physique'} • {alt.aum.toLocaleString('fr-FR')} M€
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alt.ter < etfInfo.ter ? '#34d399' : 'var(--text-primary)' }}>
                        {(alt.ter * 100).toFixed(2)} % TER
                      </div>
                      {alt.ter < etfInfo.ter && (
                        <div style={{ fontSize: 11, color: '#34d399' }}>
                          -{(( etfInfo.ter - alt.ter) * 10000).toFixed(0)} bps
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact frais 20 ans */}
          {feeImpact && bestAlternative && !isOptimal && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Impact des frais sur {years} ans (rendement brut {(returnRate * 100).toFixed(0)} %)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: `${pos.symbol} (actuel)`, value: fmtCompact(feeImpact.value1), color: '#94a3b8' },
                  { label: `${bestAlternative.ticker} (alternative)`, value: fmtCompact(feeImpact.value2), color: '#34d399' },
                  { label: 'Moins-value frais', value: `+${fmtCompact(feeImpact.feeDrag)}`, color: '#f59e0b', sub: 'Gain si tu migres' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--row-hover)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                    {k.sub && <div style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>{k.sub}</div>}
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="year" tickFormatter={v => `+${v}a`} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} width={65} />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmtEur(v), name === 'current' ? `${pos.symbol}` : `${bestAlternative.ticker}`]}
                    contentStyle={{ background: chartTheme.tooltip.background, border: `1px solid ${chartTheme.tooltip.border}`, borderRadius: 8, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="current" stroke="#94a3b8" fill="#94a3b812" name="current" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="alternative" stroke="#34d399" fill="#34d39918" name="alternative" strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section AV
// ─────────────────────────────────────────────────────────────────────────────
function AVSection({ envelope, onSave }: { envelope: Envelope; onSave: (m: Record<string, unknown>) => Promise<void> }) {
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [form, setForm] = useState({
    insurer: String(meta.insurer ?? ''),
    contractName: String(meta.contractName ?? ''),
    surrenderValue: String(meta.surrenderValue ?? ''),
    grossValue: String(meta.grossValue ?? ''),
    openedYear: String(meta.openedYear ?? ''),
    unitLinked: Boolean(meta.unitLinked ?? false),
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const surrenderVal = parseFloat(form.surrenderValue) || 0
  const grossVal = parseFloat(form.grossValue) || surrenderVal
  const openedYearNum = parseInt(form.openedYear) || 0
  const ageYears = openedYearNum > 0 ? new Date().getFullYear() - openedYearNum : 0
  const isFiscalOptimal = ageYears >= 8

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ insurer: form.insurer, contractName: form.contractName, surrenderValue: surrenderVal, grossValue: grossVal, openedYear: openedYearNum, unitLinked: form.unitLinked })
      toast({ title: 'Assurance Vie mise à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#fb923c12', border: '1.5px solid #fb923c30' }}>
          <Info style={{ width: 16, height: 16, color: '#fb923c', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Première saisie — Renseignez votre contrat AV</span>
        </div>
      )}
      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Assureur</Label>
              <Input value={form.insurer} onChange={f('insurer')} placeholder="ex: Linxea, Boursorama, Spirica" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Nom du contrat</Label>
              <Input value={form.contractName} onChange={f('contractName')} placeholder="ex: Linxea Spirit 2" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur de rachat (€)</Label>
              <Input type="number" value={form.surrenderValue} onChange={f('surrenderValue')} placeholder="30 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur brute (€)</Label>
              <Input type="number" value={form.grossValue} onChange={f('grossValue')} placeholder="32 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Année d'ouverture</Label>
              <Input type="number" value={form.openedYear} onChange={f('openedYear')} placeholder="2018" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && surrenderVal > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur de rachat', value: fmtEur(surrenderVal), color: '#fb923c' },
            ...(grossVal > surrenderVal ? [{ label: 'Plus-value latente', value: fmtEur(grossVal - surrenderVal), color: '#34d399' }] : []),
            ...(ageYears > 0 ? [{ label: 'Ancienneté', value: `${ageYears} ans`, color: '#818cf8', sub: isFiscalOptimal ? '✅ Fiscalité optimale (+8 ans)' : `⚠️ ${8 - ageYears} ans avant abattement` }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section PER
// ─────────────────────────────────────────────────────────────────────────────
function PERSection({ envelope, onSave }: { envelope: Envelope; onSave: (m: Record<string, unknown>) => Promise<void> }) {
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [tmi, setTmi] = useState(String(meta.tmi ?? '30'))
  const [annualContrib, setAnnualContrib] = useState(String(meta.annualContrib ?? ''))
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const balanceNum = parseFloat(balance) || 0
  const tmiNum = parseFloat(tmi) || 30
  const contribNum = parseFloat(annualContrib) || 0
  const taxSaving = contribNum * (tmiNum / 100)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ balance: balanceNum, tmi: tmiNum, annualContrib: contribNum })
      toast({ title: 'PER mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#a78bfa12', border: '1.5px solid #a78bfa30' }}>
          <Info style={{ width: 16, height: 16, color: '#a78bfa', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Première saisie — Renseignez votre Plan d'Épargne Retraite</span>
        </div>
      )}
      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur du PER (€)</Label>
              <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="20 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>TMI (%)</Label>
              <Select value={tmi} onValueChange={setTmi}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['11', '30', '41', '45'].map(t => <SelectItem key={t} value={t}>{t} %</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Versement annuel (€)</Label>
              <Input type="number" value={annualContrib} onChange={e => setAnnualContrib(e.target.value)} placeholder="3 000" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur du PER', value: fmtEur(balanceNum), color: '#a78bfa' },
            { label: 'TMI actuelle', value: `${tmiNum} %`, color: '#f1c086' },
            ...(contribNum > 0 ? [{ label: 'Économie fiscale', value: fmtEur(taxSaving), color: '#34d399', sub: `pour ${fmtEur(contribNum)} versés` }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section CASH
// ─────────────────────────────────────────────────────────────────────────────
function CashSection({ envelope, onSave }: { envelope: Envelope; onSave: (m: Record<string, unknown>) => Promise<void> }) {
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [monthlyExpenses, setMonthlyExpenses] = useState(String(meta.monthlyExpenses ?? ''))
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const balanceNum = parseFloat(balance) || 0
  const expNum = parseFloat(monthlyExpenses) || 0
  const monthsOfExpenses = expNum > 0 ? balanceNum / expNum : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ balance: balanceNum, monthlyExpenses: expNum })
      toast({ title: 'Liquidités mises à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#94a3b812', border: '1.5px solid #94a3b830' }}>
          <Info style={{ width: 16, height: 16, color: '#94a3b8', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Première saisie — Renseignez vos liquidités</span>
        </div>
      )}
      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Solde disponible (€)</Label>
              <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="5 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Dépenses mensuelles (€) — optionnel</Label>
              <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} placeholder="2 500" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Liquidités disponibles', value: fmtEur(balanceNum), color: '#94a3b8' },
            ...(monthsOfExpenses !== null ? [{
              label: 'Mois de dépenses',
              value: `${monthsOfExpenses.toFixed(1)} mois`,
              color: monthsOfExpenses >= 3 ? '#34d399' : '#f59e0b',
              sub: monthsOfExpenses >= 3 ? '✅ Épargne de précaution suffisante' : '⚠️ Moins de 3 mois recommandés',
            }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
