'use client'
import { useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { RefreshCw, Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import {
  lookupByIsin, lookupByTicker, type ETFInfo,
} from '@/lib/etf-database'
import {
  type Envelope, type Position, type PriceData, type AssetType,
  ASSET_LABELS, ASSET_COLORS, fmtEur,
} from '@/components/Patrimoine/types'
import { FinTip } from '@/components/FinTip'

type SearchResult = { symbol: string; name: string; type: 'ETF' | 'STOCK' | 'CRYPTO'; isin?: string }

export function PositionsTable({ envelope, positions, prices, pricesLoading, isCrypto = false, onRefreshPrices, onReload, cacheAge }: {
  envelope: Envelope
  positions: Position[]
  prices: Record<string, PriceData>
  pricesLoading: boolean
  isCrypto?: boolean
  onRefreshPrices: () => void
  onReload: () => void
  cacheAge?: number | null
}) {
  const { toast } = useToast()

  const [showAddPos, setShowAddPos] = useState(false)
  const [newPos, setNewPos] = useState<{ assetType: AssetType; symbol: string; name: string; quantity: string; pru: string; isin: string }>(
    { assetType: isCrypto ? 'CRYPTO' : 'ETF', symbol: '', name: '', quantity: '', pru: '', isin: '' }
  )
  const [addingPos, setAddingPos] = useState(false)
  const [etfMatch, setEtfMatch] = useState<ETFInfo | null>(null)

  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSearch = useCallback((q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    setSearchLoading(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const type = isCrypto ? 'crypto' : 'stock'
        const res = await fetch(`/api/portfolio/search?q=${encodeURIComponent(q)}&type=${type}`)
        const data: SearchResult[] = await res.json()
        setSearchResults(data)
        setSearchOpen(data.length > 0)
      } catch { setSearchResults([]) }
      finally { setSearchLoading(false) }
    }, 300)
  }, [isCrypto])

  const selectSearchResult = (r: SearchResult) => {
    const found = r.type === 'ETF' ? (lookupByTicker(r.symbol) ?? (r.isin ? lookupByIsin(r.isin) : null)) : null
    setEtfMatch(found)
    setNewPos(p => ({
      ...p,
      symbol: r.symbol,
      name: p.name || r.name,
      isin: p.isin || r.isin || (found ? found.isin : '') || '',
      assetType: isCrypto ? 'CRYPTO' : (r.type === 'ETF' ? 'ETF' : p.assetType),
    }))
    setSearchResults([])
    setSearchOpen(false)
  }

  const pf = (k: keyof typeof newPos) => (e: React.ChangeEvent<HTMLInputElement>) => setNewPos(p => ({ ...p, [k]: e.target.value }))

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const found = newPos.assetType === 'ETF' ? lookupByTicker(val) : null
    setEtfMatch(found)
    setNewPos(p => ({ ...p, symbol: val, ...(found ? { isin: p.isin || found.isin, name: p.name || found.name } : {}) }))
    triggerSearch(val)
  }

  const handleIsinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const found = newPos.assetType === 'ETF' ? lookupByIsin(val) : null
    setEtfMatch(found)
    setNewPos(p => ({ ...p, isin: val, ...(found ? { symbol: p.symbol || found.ticker, name: p.name || found.name } : {}) }))
    if (val.length >= 12) triggerSearch(val)
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
      setNewPos({ assetType: isCrypto ? 'CRYPTO' : 'ETF', symbol: '', name: '', quantity: '', pru: '', isin: '' })
      setEtfMatch(null)
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

  type SortCol = 'type' | 'symbol' | 'quantity' | 'pru' | 'price' | 'value' | 'perf'
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sortedPositions = [...positions].sort((a, b) => {
    if (!sortCol) return 0
    const pa = prices[a.symbol]
    const pb = prices[b.symbol]
    const qa = a.quantity, qb = b.quantity
    const pruA = a.pru, pruB = b.pru
    const va = pa ? pa.priceEur * qa : pruA * qa
    const vb = pb ? pb.priceEur * qb : pruB * qb
    const perfA = pa ? (pa.priceEur - pruA) / pruA * 100 : null
    const perfB = pb ? (pb.priceEur - pruB) / pruB * 100 : null
    let cmp = 0
    if (sortCol === 'type') cmp = a.assetType.localeCompare(b.assetType)
    else if (sortCol === 'symbol') cmp = a.symbol.localeCompare(b.symbol)
    else if (sortCol === 'quantity') cmp = qa - qb
    else if (sortCol === 'pru') cmp = pruA - pruB
    else if (sortCol === 'price') cmp = (pa?.priceEur ?? 0) - (pb?.priceEur ?? 0)
    else if (sortCol === 'value') cmp = va - vb
    else if (sortCol === 'perf') cmp = (perfA ?? -Infinity) - (perfB ?? -Infinity)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ChevronsUpDown style={{ width: 10, height: 10, opacity: 0.3 }} />
    return sortDir === 'asc'
      ? <ChevronUp style={{ width: 10, height: 10, color: '#f97316' }} />
      : <ChevronDown style={{ width: 10, height: 10, color: '#f97316' }} />
  }

  const [editingPos, setEditingPos] = useState<{ id: string; quantity: string; pru: string } | null>(null)
  const startEdit = (pos: Position) => setEditingPos({ id: pos.id, quantity: String(pos.quantity), pru: String(pos.pru) })
  const cancelEdit = () => setEditingPos(null)

  const savePosition = async () => {
    if (!editingPos) return
    try {
      const res = await fetch(`/api/portfolio/${editingPos.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseFloat(editingPos.quantity), pru: parseFloat(editingPos.pru) }),
      })
      if (!res.ok) throw new Error()
      setEditingPos(null)
      onReload()
    } catch { toast({ title: 'Erreur modification', variant: 'destructive' }) }
  }

  return (
    <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
      <CardContent style={{ padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--p-line)' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>
            Positions ({positions.length})
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {cacheAge !== null && cacheAge !== undefined && cacheAge > 0 && (
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                Prix actualisés il y a {cacheAge} min
              </span>
            )}
            <button
              onClick={onRefreshPrices}
              disabled={pricesLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--p-line)', background: 'none', cursor: pricesLoading ? 'default' : 'pointer', fontSize: 12, color: pricesLoading ? 'var(--p-text-faint)' : 'var(--p-text)', opacity: pricesLoading ? 0.5 : 1, transition: 'color 0.15s, opacity 0.15s' }}
            >
              <RefreshCw style={{ width: 12, height: 12, animation: pricesLoading ? 'spin 1s linear infinite' : 'none' }} />
              {pricesLoading ? 'Actualisation…' : 'Actualiser'}
            </button>
            <button
              onClick={() => setShowAddPos(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--p-line)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--p-text)', fontWeight: 600 }}
            >
              <Plus style={{ width: 12, height: 12 }} />
              Ajouter
            </button>
          </div>
        </div>

        {showAddPos && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-row-hover)' }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Type</Label>
                {isCrypto ? (
                  <div style={{ width: 100, height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: 6, border: '1px solid var(--p-line)', background: 'var(--p-card)', fontSize: 13, color: 'var(--p-text-dim)' }}>
                    Crypto
                  </div>
                ) : (
                  <Select value={newPos.assetType} onValueChange={(v: AssetType) => setNewPos(p => ({ ...p, assetType: v }))}>
                    <SelectTrigger style={{ width: 100 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['ETF', 'STOCK', 'SCPI', 'CASH'] as AssetType[]).map(t => (
                        <SelectItem key={t} value={t}>{ASSET_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                  Symbole {searchLoading && <span style={{ color: 'var(--p-text-faint)', fontSize: 10 }}>…</span>}
                </Label>
                <Input
                  value={newPos.symbol}
                  onChange={handleSymbolChange}
                  placeholder={isCrypto ? 'BTC, ETH…' : 'CW8, ASML…'}
                  style={{ width: 130 }}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                  onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                  autoComplete="off"
                />
                {searchOpen && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 50,
                    background: 'var(--p-card)', border: '1px solid var(--p-line)',
                    borderRadius: 8, marginTop: 4, minWidth: 280, maxHeight: 220, overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {searchResults.map((r, i) => (
                      <div
                        key={r.symbol + i}
                        onMouseDown={() => selectSearchResult(r)}
                        style={{
                          padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                          borderBottom: '1px solid var(--p-line)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'monospace', minWidth: 56, flexShrink: 0 }}>{r.symbol}</span>
                        <span style={{ fontSize: 11, color: 'var(--p-text-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: r.type === 'ETF' ? '#60a5fa' : r.type === 'CRYPTO' ? '#f59e0b' : '#34d399', flexShrink: 0 }}>{r.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!isCrypto && (
                <div>
                  <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                    ISIN
                    {etfMatch && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: '#34d399', fontWeight: 600 }}>✓ reconnu</span>
                    )}
                  </Label>
                  <Input value={newPos.isin} onChange={handleIsinChange} placeholder="FR0011…" style={{ width: 140 }} />
                </div>
              )}
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                  Nom
                  {etfMatch && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: '#34d399', fontWeight: 600 }}>{etfMatch.ter * 100}% TER <FinTip term="ter" /></span>
                  )}
                </Label>
                <Input value={newPos.name} onChange={pf('name')} placeholder="Amundi MSCI World" style={{ width: 180 }} />
              </div>
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Quantité</Label>
                <Input type="number" value={newPos.quantity} onChange={pf('quantity')} placeholder="10" style={{ width: 80 }} />
              </div>
              <div>
                <Label style={{ fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center' }}>
                  PRU (€) <FinTip term="pru" />
                </Label>
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

        {positions.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>
            Aucune position — cliquez sur "Ajouter" pour commencer
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--p-line)' }}>
                  {([
                    { label: 'Type',     col: 'type'     as SortCol },
                    { label: 'Titre',    col: 'symbol'   as SortCol },
                    { label: 'Quantité', col: 'quantity' as SortCol },
                    { label: 'PRU',      col: 'pru'      as SortCol },
                    { label: 'Cours',    col: 'price'    as SortCol },
                    { label: 'Valeur',   col: 'value'    as SortCol },
                    { label: 'Perf',     col: 'perf'     as SortCol },
                  ] as { label: string; col: SortCol }[]).map(({ label, col }) => (
                    <th key={col}
                      onClick={() => toggleSort(col)}
                      style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: sortCol === col ? '#f97316' : 'var(--p-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {label} <SortIcon col={col} />
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: '8px 16px' }} />
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map(pos => {
                  const isEditing = editingPos?.id === pos.id
                  const pd = prices[pos.symbol]
                  const qty = isEditing ? parseFloat(editingPos.quantity) || pos.quantity : pos.quantity
                  const pru = isEditing ? parseFloat(editingPos.pru) || pos.pru : pos.pru
                  const value = pd ? pd.priceEur * qty : pru * qty
                  const perf = pd ? ((pd.priceEur - pru) / pru) * 100 : null
                  const color = perf === null ? 'var(--p-text-faint)' : perf >= 0 ? '#34d399' : '#ef4444'

                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid var(--p-line)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--p-row-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: ASSET_COLORS[pos.assetType] + '18', color: ASSET_COLORS[pos.assetType] }}>
                          {ASSET_LABELS[pos.assetType]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--p-text)' }}>{pos.symbol}</div>
                        <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{pos.name}</div>
                      </td>
                      <td style={{ padding: '8px 16px', fontVariantNumeric: 'tabular-nums' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingPos.quantity}
                            onChange={e => setEditingPos(p => p ? { ...p, quantity: e.target.value } : null)}
                            onKeyDown={e => { if (e.key === 'Enter') savePosition(); if (e.key === 'Escape') cancelEdit() }}
                            style={{ width: 72, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--p-line)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: 13 }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ color: 'var(--p-text)' }}>{pos.quantity}</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 16px', fontVariantNumeric: 'tabular-nums' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingPos.pru}
                            onChange={e => setEditingPos(p => p ? { ...p, pru: e.target.value } : null)}
                            onKeyDown={e => { if (e.key === 'Enter') savePosition(); if (e.key === 'Escape') cancelEdit() }}
                            style={{ width: 90, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--p-line)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: 13 }}
                          />
                        ) : (
                          <span style={{ color: 'var(--p-text-dim)' }}>{fmtEur(pos.pru)}</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>
                        {pd ? fmtEur(pd.priceEur) : <span style={{ color: 'var(--p-text-faint)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>{fmtEur(value)}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
                        {perf !== null ? `${perf >= 0 ? '+' : ''}${perf.toFixed(2)} %` : '—'}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={savePosition} style={{ padding: 4, borderRadius: 6, background: 'rgba(52,211,153,0.12)', border: 'none', cursor: 'pointer', color: '#34d399' }}>
                              <Check style={{ width: 13, height: 13 }} />
                            </button>
                            <button onClick={cancelEdit} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)' }}>
                              <X style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={() => startEdit(pos)} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)' }}>
                              <Pencil style={{ width: 13, height: 13 }} />
                            </button>
                            <button onClick={() => deletePosition(pos.id)} style={{ padding: 4, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)' }}>
                              <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                          </div>
                        )}
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
  )
}
