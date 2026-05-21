'use client'
import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { fmt } from '@/lib/utils'
import { Plus, Pencil, Trash2, X, Check, TrendingUp, TrendingDown, DollarSign, Filter, BookOpen } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type TxType = 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER'

interface AssetTransaction {
  id: string
  userId: string
  positionId?: string | null
  envelopeId?: string | null
  symbol: string
  name: string
  type: TxType
  quantity: number
  price: number
  fees: number
  date: string
  notes?: string | null
  createdAt: string
}

interface Envelope {
  id: string
  name: string
  type: string
}

interface FormState {
  symbol: string
  name: string
  type: TxType
  quantity: string
  price: string
  fees: string
  date: string
  envelopeId: string
  notes: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<TxType, { label: string; bg: string; color: string }> = {
  BUY:      { label: 'Achat',     bg: 'rgba(74,222,128,0.15)',  color: '#4ade80' },
  SELL:     { label: 'Vente',     bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  DIVIDEND: { label: 'Dividende', bg: 'rgba(176,120,32,0.15)', color: '#B07820' },
  SPLIT:    { label: 'Split',     bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa' },
  TRANSFER: { label: 'Transfert', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calcPRU(txs: AssetTransaction[], symbol: string): number {
  const buys = txs.filter(t => t.symbol === symbol && t.type === 'BUY')
  const totalQty = buys.reduce((s, t) => s + t.quantity, 0)
  const totalCost = buys.reduce((s, t) => s + t.quantity * t.price + t.fees, 0)
  return totalQty > 0 ? totalCost / totalQty : 0
}

const EMPTY_FORM: FormState = {
  symbol: '', name: '', type: 'BUY', quantity: '', price: '', fees: '0',
  date: new Date().toISOString().slice(0, 10), envelopeId: '', notes: '',
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<AssetTransaction[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterEnvelope, setFilterEnvelope] = useState('all')
  const [filterType, setFilterType] = useState<TxType | 'all'>('all')
  const [filterSymbol, setFilterSymbol] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/transactions').then(r => r.json()),
      fetch('/api/patrimoine/envelopes').then(r => r.json()),
    ]).then(([txs, envs]) => {
      setTransactions(Array.isArray(txs) ? txs : [])
      setEnvelopes(Array.isArray(envs) ? envs : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── Derived data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterEnvelope === 'all' || t.envelopeId === filterEnvelope)
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => {
        if (!filterSymbol) return true
        const q = filterSymbol.toLowerCase()
        return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, filterEnvelope, filterType, filterSymbol])

  const kpis = useMemo(() => {
    const investi = transactions
      .filter(t => t.type === 'BUY')
      .reduce((s, t) => s + t.quantity * t.price + t.fees, 0)

    const dividendes = transactions
      .filter(t => t.type === 'DIVIDEND')
      .reduce((s, t) => s + t.quantity * t.price, 0)

    const pvRealisees = transactions
      .filter(t => t.type === 'SELL')
      .reduce((s, t) => {
        const pru = calcPRU(transactions, t.symbol)
        return s + (t.price - pru) * t.quantity - t.fees
      }, 0)

    return { investi, dividendes, pvRealisees }
  }, [transactions])

  // PRU for current form symbol
  const formPRU = useMemo(() => {
    if (!form.symbol) return 0
    return calcPRU(transactions.filter(t => !editId || t.id !== editId), form.symbol)
  }, [form.symbol, transactions, editId])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function openAdd() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(tx: AssetTransaction) {
    setEditId(tx.id)
    setForm({
      symbol: tx.symbol,
      name: tx.name,
      type: tx.type,
      quantity: String(tx.quantity),
      price: String(tx.price),
      fees: String(tx.fees),
      date: tx.date.slice(0, 10),
      envelopeId: tx.envelopeId ?? '',
      notes: tx.notes ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  function setField(k: keyof FormState, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.symbol || !form.quantity || !form.price || !form.date) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }
    setSaving(true)
    const body = {
      symbol: form.symbol.toUpperCase(),
      name: form.name || form.symbol.toUpperCase(),
      type: form.type,
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      fees: parseFloat(form.fees) || 0,
      date: new Date(form.date).toISOString(),
      envelopeId: form.envelopeId || null,
      notes: form.notes || null,
    }
    try {
      const url = editId ? `/api/transactions/${editId}` : '/api/transactions'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      const saved: AssetTransaction = await res.json()
      if (editId) {
        setTransactions(txs => txs.map(t => t.id === editId ? saved : t))
        toast({ title: 'Transaction mise à jour' })
      } else {
        setTransactions(txs => [saved, ...txs])
        toast({ title: 'Transaction ajoutée' })
      }
      closeModal()
    } catch {
      toast({ title: 'Erreur lors de la sauvegarde', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTransactions(txs => txs.filter(t => t.id !== id))
      setConfirmDeleteId(null)
      toast({ title: 'Transaction supprimée' })
    } catch {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--p-card)',
    border: '1px solid var(--p-line)',
    borderRadius: 16,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Suivi des opérations</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--p-text)', letterSpacing: '-0.03em' }}>
            Carnet d'ordres
          </h1>
          <p style={{ fontSize: 14, color: 'var(--p-text-dim)', marginTop: 6 }}>
            Historique de vos achats, ventes, dividendes et autres opérations.
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#B07820', color: '#1a1005', border: 'none',
            borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Ajouter
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: TrendingUp,   label: 'Total investi',            value: kpis.investi,      color: '#60a5fa' },
          { icon: DollarSign,   label: 'Dividendes reçus',         value: kpis.dividendes,   color: '#B07820' },
          { icon: TrendingDown, label: 'Plus-values réalisées',    value: kpis.pvRealisees,  color: kpis.pvRealisees >= 0 ? '#4ade80' : '#f87171' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ ...cardStyle, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon style={{ width: 15, height: 15, color }} />
              <span style={{ fontSize: 11, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            </div>
            <p style={{ fontSize: 'clamp(1rem,2.5vw,1.4rem)', fontWeight: 700, color: 'var(--p-text)', letterSpacing: '-0.02em' }}>
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div style={{ ...cardStyle, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Filter style={{ width: 14, height: 14, color: 'var(--p-text-dim)', flexShrink: 0 }} />

        <div style={{ minWidth: 180 }}>
          <Select value={filterEnvelope} onValueChange={setFilterEnvelope}>
            <SelectTrigger style={{ height: 34, fontSize: 13 }}>
              <SelectValue placeholder="Toutes les enveloppes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les enveloppes</SelectItem>
              {envelopes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div style={{ minWidth: 150 }}>
          <Select value={filterType} onValueChange={v => setFilterType(v as TxType | 'all')}>
            <SelectTrigger style={{ height: 34, fontSize: 13 }}>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {(Object.keys(TYPE_BADGE) as TxType[]).map(t => (
                <SelectItem key={t} value={t}>{TYPE_BADGE[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Rechercher un actif…"
          value={filterSymbol}
          onChange={e => setFilterSymbol(e.target.value)}
          style={{ height: 34, fontSize: 13, maxWidth: 220 }}
        />

        {(filterEnvelope !== 'all' || filterType !== 'all' || filterSymbol) && (
          <button
            onClick={() => { setFilterEnvelope('all'); setFilterType('all'); setFilterSymbol('') }}
            style={{ fontSize: 12, color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <X style={{ width: 12, height: 12 }} /> Réinitialiser
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--p-text-dim)', fontSize: 14 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <BookOpen style={{ width: 36, height: 36, color: 'var(--p-text-dim)', opacity: 0.5 }} />
            <p style={{ fontSize: 14, color: 'var(--p-text-dim)' }}>Aucune transaction trouvée.</p>
            <button
              onClick={openAdd}
              style={{ fontSize: 13, color: '#B07820', background: 'none', border: '1px solid rgba(176,120,32,0.3)', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}
            >
              Ajouter une première transaction
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 90px 100px 80px 100px 90px', padding: '10px 16px', borderBottom: '1px solid var(--p-line)' }}>
              {['Date', 'Actif', 'Type', 'Quantité', 'Prix unit.', 'Frais', 'Total', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {filtered.map(tx => {
              const badge = TYPE_BADGE[tx.type]
              const total = tx.quantity * tx.price
              const isConfirmDelete = confirmDeleteId === tx.id
              const envName = envelopes.find(e => e.id === tx.envelopeId)?.name

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '100px 1fr 100px 90px 100px 80px 100px 90px',
                    padding: '12px 16px', borderBottom: '1px solid var(--p-line)',
                    alignItems: 'center', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>{fmtDate(tx.date)}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.symbol}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--p-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.name}{envName ? ` · ${envName}` : ''}
                    </p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: badge.bg, color: badge.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, width: 'fit-content' }}>
                    {badge.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--p-text-em)' }}>{tx.quantity.toLocaleString('fr-FR')}</span>
                  <span style={{ fontSize: 13, color: 'var(--p-text-em)' }}>{fmt(tx.price)}</span>
                  <span style={{ fontSize: 12, color: tx.fees > 0 ? '#f87171' : 'var(--p-text-dim)' }}>
                    {tx.fees > 0 ? fmt(tx.fees) : '—'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{fmt(total)}</span>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isConfirmDelete ? (
                      <>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Confirmer"
                          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#f87171' }}
                        >
                          <Check style={{ width: 13, height: 13 }} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          title="Annuler"
                          style={{ background: 'none', border: '1px solid var(--p-line)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--p-text-dim)' }}
                        >
                          <X style={{ width: 13, height: 13 }} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(tx)}
                          title="Modifier"
                          style={{ background: 'none', border: '1px solid var(--p-line)', borderRadius: 6, padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--p-text-dim)' }}
                        >
                          <Pencil style={{ width: 12, height: 12 }} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(tx.id)}
                          title="Supprimer"
                          style={{ background: 'none', border: '1px solid var(--p-line)', borderRadius: 6, padding: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#f87171' }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text)' }}>
                {editId ? 'Modifier la transaction' : 'Nouvelle transaction'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-dim)', padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12 }}>Type d'opération</Label>
                <Select value={form.type} onValueChange={v => setField('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_BADGE) as TxType[]).map(t => (
                      <SelectItem key={t} value={t}>{TYPE_BADGE[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol + Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>Symbole / Ticker <span style={{ color: '#f87171' }}>*</span></Label>
                  <Input
                    placeholder="ex: MSFT"
                    value={form.symbol}
                    onChange={e => setField('symbol', e.target.value.toUpperCase())}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>Nom de l'actif</Label>
                  <Input
                    placeholder="ex: Microsoft Corp."
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                  />
                </div>
              </div>

              {/* Quantity + Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>Quantité <span style={{ color: '#f87171' }}>*</span></Label>
                  <Input
                    type="number"
                    placeholder="ex: 10"
                    value={form.quantity}
                    min={0}
                    onChange={e => setField('quantity', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>
                    Prix unitaire (€) <span style={{ color: '#f87171' }}>*</span>
                    {formPRU > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#B07820', fontWeight: 400 }}>
                        PRU actuel: {fmt(formPRU)}
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    placeholder="ex: 250.50"
                    value={form.price}
                    min={0}
                    step={0.01}
                    onChange={e => setField('price', e.target.value)}
                  />
                </div>
              </div>

              {/* Fees + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>Frais (€)</Label>
                  <Input
                    type="number"
                    placeholder="ex: 1.99"
                    value={form.fees}
                    min={0}
                    step={0.01}
                    onChange={e => setField('fees', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>Date <span style={{ color: '#f87171' }}>*</span></Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={e => setField('date', e.target.value)}
                  />
                </div>
              </div>

              {/* Envelope */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12 }}>Enveloppe (optionnel)</Label>
                <Select value={form.envelopeId || 'none'} onValueChange={v => setField('envelopeId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Aucune enveloppe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune enveloppe</SelectItem>
                    {envelopes.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 12 }}>Notes (optionnel)</Label>
                <textarea
                  rows={2}
                  placeholder="Commentaire libre…"
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  style={{
                    background: 'transparent', border: '1px solid var(--p-line)',
                    borderRadius: 8, padding: '8px 12px', fontSize: 13,
                    color: 'var(--p-text)', resize: 'vertical', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Total preview */}
              {form.quantity && form.price && (
                <div style={{ background: 'rgba(176,120,32,0.07)', border: '1px solid rgba(176,120,32,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>Total opération</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#B07820' }}>
                    {fmt((parseFloat(form.quantity) || 0) * (parseFloat(form.price) || 0) + (parseFloat(form.fees) || 0))}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  onClick={closeModal}
                  style={{ fontSize: 13, color: 'var(--p-text-dim)', background: 'none', border: '1px solid var(--p-line)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    fontSize: 13, fontWeight: 600, color: '#1a1005',
                    background: saving ? 'rgba(176,120,32,0.5)' : '#B07820',
                    border: 'none', borderRadius: 8, padding: '8px 20px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
