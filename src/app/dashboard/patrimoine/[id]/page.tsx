'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'
import { ENVELOPE_TYPE_CONFIG, type Envelope, type PriceData } from '@/components/patrimoine/types'
import { getCachedPrices, setCachedPrices } from '@/lib/price-cache'
import { LivretSection } from '@/components/patrimoine/LivretSection'
import { ImmobilierSection } from '@/components/patrimoine/ImmobilierSection'
import { AVSection } from '@/components/patrimoine/AVSection'
import { PERSection } from '@/components/patrimoine/PERSection'
import { CashSection } from '@/components/patrimoine/CashSection'
import { PeaCtoCryptoSection } from '@/components/patrimoine/PeaCtoCryptoSection'

export default function EnvelopeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const chartTheme = useChartTheme()

  const [envelope, setEnvelope] = useState<Envelope | null>(null)
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [cacheAge, setCacheAge] = useState<number | null>(null)

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
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

  const loadPrices = useCallback(async (positions: Envelope['positions']) => {
    if (!positions.length) return
    const marketPositions = positions.filter(p => !['LIVRET', 'CASH'].includes(p.assetType))
    if (!marketPositions.length) return

    const symbols = marketPositions.map(p => p.symbol)
    const { hits, misses, oldestHitMs } = getCachedPrices(symbols)

    // Apply cached hits immediately
    if (Object.keys(hits).length > 0) {
      setPrices(prev => ({ ...prev, ...hits }))
      if (oldestHitMs !== null) {
        setCacheAge(Math.floor((Date.now() - oldestHitMs) / 60_000))
      }
    }

    if (misses.length === 0) return

    // Fetch only misses
    setPricesLoading(true)
    try {
      const missPositions = marketPositions.filter(p => misses.includes(p.symbol))
      const res = await fetch('/api/portfolio/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: missPositions }),
      })
      if (res.ok) {
        const data = await res.json()
        const freshPrices: Record<string, { priceEur: number; changePct: number }> = data.prices ?? {}
        setPrices(prev => ({ ...prev, ...freshPrices }))
        setCachedPrices(freshPrices)
        setCacheAge(0)
      }
    } catch { /* ignore */ }
    finally { setPricesLoading(false) }
  }, [])

  useEffect(() => {
    if (envelope && ['PEA', 'CTO', 'CRYPTO'].includes(envelope.type)) {
      loadPrices(envelope.positions)
    }
  }, [envelope, loadPrices])

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

  const handleDelete = async () => {
    try {
      await fetch(`/api/patrimoine/envelopes/${id}`, { method: 'DELETE' })
      window.dispatchEvent(new Event('patrimoine-updated'))
      router.push('/dashboard/patrimoine')
    } catch { toast({ title: 'Erreur suppression', variant: 'destructive' }) }
  }

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

  return (
    <div className="space-y-6" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 48px' }}>

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
        <LivretSection envelope={envelope} onSave={saveMetadata} />
      )}

      {envelope.type === 'IMMOBILIER' && (
        <ImmobilierSection envelope={envelope} onSave={saveMetadata} chartTheme={chartTheme} />
      )}

      {(envelope.type === 'PEA' || envelope.type === 'CTO') && (
        <PeaCtoCryptoSection
          envelope={envelope}
          prices={prices}
          pricesLoading={pricesLoading}
          onRefreshPrices={() => loadPrices(envelope.positions)}
          onSave={saveMetadata}
          chartTheme={chartTheme}
          onReload={loadEnvelope}
          cacheAge={cacheAge}
        />
      )}

      {envelope.type === 'AV' && (
        <AVSection envelope={envelope} onSave={saveMetadata} />
      )}

      {envelope.type === 'CRYPTO' && (
        <PeaCtoCryptoSection
          envelope={envelope}
          prices={prices}
          pricesLoading={pricesLoading}
          onRefreshPrices={() => loadPrices(envelope.positions)}
          onSave={saveMetadata}
          chartTheme={chartTheme}
          onReload={loadEnvelope}
          isCrypto
          cacheAge={cacheAge}
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
