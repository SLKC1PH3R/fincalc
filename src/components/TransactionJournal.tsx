'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Check, X, Plus, Trash2, ArrowUp, ArrowDown, DollarSign } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface Transaction {
  id: string
  symbol: string
  name: string
  type: string
  quantity: number
  price: number
  fees: number
  date: string
  notes?: string | null
}

const TYPE_LABELS: Record<string, string> = {
  BUY: 'Achat',
  SELL: 'Vente',
  DIVIDEND: 'Dividende',
  SPLIT: 'Split',
  TRANSFER: 'Transfert',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  BUY:      { bg: 'rgba(52,211,153,0.13)', color: '#34d399' },
  SELL:     { bg: 'rgba(239,68,68,0.13)',  color: '#ef4444' },
  DIVIDEND: { bg: 'rgba(56,189,248,0.13)', color: '#38bdf8' },
  SPLIT:    { bg: 'rgba(251,191,36,0.13)', color: '#fbbf24' },
  TRANSFER: { bg: 'rgba(148,163,184,0.13)', color: '#94a3b8' },
}

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] ?? { bg: 'rgba(148,163,184,0.13)', color: '#94a3b8' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.color,
      letterSpacing: '0.03em',
    }}>
      {TYPE_LABELS[type] ?? type}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function TransactionJournal({
  envelopeId,
  symbol: symbolProp,
  title = 'Journal de transactions',
}: {
  envelopeId?: string
  symbol?: string
  title?: string
}) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: 'BUY',
    symbol: symbolProp ?? '',
    name: '',
    quantity: '',
    price: '',
    fees: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (envelopeId) params.set('envelopeId', envelopeId)
      if (symbolProp) params.set('symbol', symbolProp)
      const res = await fetch(`/api/transactions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [envelopeId, symbolProp])

  useEffect(() => { load() }, [load])

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.symbol || !form.quantity || !form.price || !form.date) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          envelopeId,
          symbol: form.symbol.toUpperCase(),
          name: form.name,
          type: form.type,
          quantity: parseFloat(form.quantity),
          price: parseFloat(form.price),
          fees: parseFloat(form.fees || '0'),
          date: form.date,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Transaction ajoutée' })
      setShowForm(false)
      setForm(p => ({ ...p, symbol: symbolProp ?? '', name: '', quantity: '', price: '', fees: '', notes: '' }))
      load()
    } catch {
      toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTransactions(prev => prev.filter(t => t.id !== id))
      toast({ title: 'Transaction supprimée' })
    } catch {
      toast({ title: 'Erreur suppression', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  // Summary calculations
  const totalInvested = transactions
    .filter(t => t.type === 'BUY')
    .reduce((s, t) => s + t.quantity * t.price + t.fees, 0)

  const totalSold = transactions
    .filter(t => t.type === 'SELL')
    .reduce((s, t) => s + t.quantity * t.price - t.fees, 0)

  const totalDividends = transactions
    .filter(t => t.type === 'DIVIDEND')
    .reduce((s, t) => s + t.quantity * t.price, 0)

  const pnlRealized = totalSold - transactions
    .filter(t => t.type === 'SELL')
    .reduce((s, t) => {
      // Simplified: use average PRU from BUY transactions
      const avgPru = transactions.filter(b => b.type === 'BUY' && b.symbol === t.symbol)
        .reduce((sum, b) => sum + b.price * b.quantity, 0) /
        (transactions.filter(b => b.type === 'BUY' && b.symbol === t.symbol)
          .reduce((sum, b) => sum + b.quantity, 0) || 1)
      return s + avgPru * t.quantity + t.fees
    }, 0)

  return (
    <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
      <CardContent style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          {!showForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              Ajouter
            </Button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--section-border)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Nouvelle transaction
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Type</Label>
                <select
                  value={form.type}
                  onChange={f('type')}
                  style={{
                    width: '100%', height: 36, borderRadius: 8, padding: '0 10px',
                    background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                    color: 'var(--text-primary)', fontSize: 13,
                  }}
                >
                  <option value="BUY">Achat</option>
                  <option value="SELL">Vente</option>
                  <option value="DIVIDEND">Dividende</option>
                  <option value="SPLIT">Split</option>
                  <option value="TRANSFER">Transfert</option>
                </select>
              </div>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Symbole</Label>
                <Input
                  value={form.symbol}
                  onChange={f('symbol')}
                  placeholder="MSFT"
                  style={{ textTransform: 'uppercase' }}
                  disabled={!!symbolProp}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Nom</Label>
                <Input value={form.name} onChange={f('name')} placeholder="Microsoft Corp." />
              </div>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Quantité</Label>
                <Input type="number" value={form.quantity} onChange={f('quantity')} placeholder="10" />
              </div>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Prix unitaire (€)</Label>
                <Input type="number" value={form.price} onChange={f('price')} placeholder="350.00" />
              </div>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Frais (€)</Label>
                <Input type="number" value={form.fees} onChange={f('fees')} placeholder="0" />
              </div>
              <div>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Date</Label>
                <Input type="date" value={form.date} onChange={f('date')} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ marginBottom: 4, display: 'block', fontSize: 11 }}>Notes</Label>
                <Input value={form.notes} onChange={f('notes')} placeholder="Optionnel" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check style={{ width: 13, height: 13 }} />
                {submitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <X style={{ width: 13, height: 13 }} />
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, padding: '20px 0' }}>
            Chargement…
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13, padding: '24px 0' }}>
            Aucune transaction enregistrée.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--section-border)' }}>
                  {['Date', 'Type', 'Titre', 'Qté', 'Prix unit.', 'Total', 'Frais', 'Notes', ''].map(h => (
                    <th key={h} style={{
                      textAlign: h === '' ? 'center' : 'left',
                      padding: '6px 8px',
                      color: 'var(--text-subtle)',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr
                    key={t.id}
                    style={{ borderBottom: '1px solid var(--section-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '8px 8px', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                      {fmtDate(t.date)}
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <TypeBadge type={t.type} />
                    </td>
                    <td style={{ padding: '8px 8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.symbol}</div>
                      {t.name && <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{t.name}</div>}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.quantity % 1 === 0 ? t.quantity : t.quantity.toFixed(4)}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(t.price)}
                    </td>
                    <td style={{ padding: '8px 8px', fontWeight: 600, color: t.type === 'SELL' ? '#ef4444' : '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                      {t.type === 'SELL' ? '-' : '+'}{fmt(t.quantity * t.price)}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-subtle)', fontVariantNumeric: 'tabular-nums' }}>
                      {t.fees > 0 ? fmt(t.fees) : '—'}
                    </td>
                    <td style={{ padding: '8px 8px', color: 'var(--text-subtle)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.notes ?? '—'}
                    </td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                        title="Supprimer"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-subtle)', padding: 4, borderRadius: 6,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {transactions.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--section-border)',
          }}>
            {[
              {
                label: 'Total investi',
                value: fmt(totalInvested),
                color: '#818cf8',
                icon: <ArrowDown style={{ width: 12, height: 12 }} />,
              },
              {
                label: 'Total cédé',
                value: fmt(totalSold),
                color: '#f97316',
                icon: <ArrowUp style={{ width: 12, height: 12 }} />,
              },
              {
                label: 'Dividendes reçus',
                value: fmt(totalDividends),
                color: '#38bdf8',
                icon: <DollarSign style={{ width: 12, height: 12 }} />,
              },
              {
                label: 'P&L réalisé',
                value: `${pnlRealized >= 0 ? '+' : ''}${fmt(pnlRealized)}`,
                color: pnlRealized >= 0 ? '#34d399' : '#ef4444',
                icon: pnlRealized >= 0
                  ? <ArrowUp style={{ width: 12, height: 12 }} />
                  : <ArrowDown style={{ width: 12, height: 12 }} />,
              },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--section-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
