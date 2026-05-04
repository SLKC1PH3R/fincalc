'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { ENVELOPE_TYPE_CONFIG, type Envelope, type PriceData, fmtCompact } from '@/components/patrimoine/types'
import { getCachedPrices, setCachedPrices } from '@/lib/price-cache'
import { LivretSection } from '@/components/patrimoine/LivretSection'
import { ImmobilierSection } from '@/components/patrimoine/ImmobilierSection'
import { AVSection } from '@/components/patrimoine/AVSection'
import { PERSection } from '@/components/patrimoine/PERSection'
import { CashSection } from '@/components/patrimoine/CashSection'
import { PeaCtoCryptoSection } from '@/components/patrimoine/PeaCtoCryptoSection'

// ── Category mapping ──────────────────────────────────────────────────────────
type EnvelopeType = Envelope['type']

const TYPE_TO_CATEGORY: Record<EnvelopeType, { label: string; href: string; types: EnvelopeType[]; color: string }> = {
  IMMOBILIER: { label: 'Immobilier',        href: '/dashboard/patrimoine/immobilier', types: ['IMMOBILIER'],               color: '#f472b6' },
  PEA:        { label: 'Actions & Fonds',   href: '/dashboard/patrimoine/actions',    types: ['PEA','CTO','AV','PER'],      color: '#818cf8' },
  CTO:        { label: 'Actions & Fonds',   href: '/dashboard/patrimoine/actions',    types: ['PEA','CTO','AV','PER'],      color: '#818cf8' },
  AV:         { label: 'Actions & Fonds',   href: '/dashboard/patrimoine/actions',    types: ['PEA','CTO','AV','PER'],      color: '#818cf8' },
  PER:        { label: 'Actions & Fonds',   href: '/dashboard/patrimoine/actions',    types: ['PEA','CTO','AV','PER'],      color: '#818cf8' },
  LIVRET:     { label: 'Livrets',           href: '/dashboard/patrimoine/livrets',    types: ['LIVRET'],                   color: '#34d399' },
  CRYPTO:     { label: 'Autres actifs',     href: '/dashboard/patrimoine/autres',     types: ['CRYPTO'],                   color: '#f59e0b' },
  CASH:       { label: 'Comptes bancaires', href: '/dashboard/patrimoine/comptes',    types: ['CASH'],                     color: '#94a3b8' },
}

const TYPE_INSIGHTS: Record<EnvelopeType, { icon: string; title: string; tip: string }[]> = {
  IMMOBILIER: [
    { icon: '🏠', title: 'Valorisation', tip: 'Mettez à jour la valeur du bien chaque trimestre pour avoir un patrimoine fiable.' },
    { icon: '💡', title: 'Conseil', tip: 'Surveillez le prix/m² de votre secteur. Un entretien régulier préserve 1.5 à 2% de valeur annuelle.' },
  ],
  PEA: [
    { icon: '📋', title: 'Plafond', tip: 'Le PEA est limité à 150 000€ de versements. Après 5 ans, les retraits sont exonérés d\'impôt.' },
    { icon: '💡', title: 'Conseil', tip: 'Privilégiez les ETF indiciels (World, S&P500) pour minimiser les frais et maximiser la diversification.' },
  ],
  CTO: [
    { icon: '📋', title: 'Fiscalité', tip: 'Les plus-values sont soumises à la flat tax de 30% (PFU). Pensez à compenser les moins-values.' },
    { icon: '💡', title: 'Conseil', tip: 'Le CTO est idéal pour les actions étrangères exclues du PEA (US, non-européennes).' },
  ],
  AV: [
    { icon: '📋', title: 'Fiscalité', tip: 'Après 8 ans, abattement annuel de 4 600€ (9 200€ en couple) sur les gains. Conservez le contrat.' },
    { icon: '💡', title: 'Conseil', tip: 'Préférez les unités de compte aux fonds euros pour un rendement long terme supérieur à l\'inflation.' },
  ],
  PER: [
    { icon: '📋', title: 'Avantage fiscal', tip: 'Les versements sont déductibles de votre revenu imposable, dans la limite de 10% de votre revenu.' },
    { icon: '💡', title: 'Conseil', tip: 'Ouvrez le PER tôt : les intérêts composés sur 25+ ans font une différence considérable.' },
  ],
  LIVRET: [
    { icon: '📋', title: 'Rôle', tip: 'Gardez 3 à 6 mois de dépenses en épargne de précaution. Le surplus devrait migrer vers des enveloppes plus rémunératrices.' },
    { icon: '💡', title: 'Conseil', tip: 'Priorisez LEP (3.5%) > Livret A (2.4%) > LDDS selon votre éligibilité et vos plafonds.' },
  ],
  CRYPTO: [
    { icon: '📋', title: 'Fiscalité', tip: 'Les cessions de crypto sont imposables à 30% (flat tax). Déclarez chaque cession sur le formulaire 2086.' },
    { icon: '💡', title: 'Conseil', tip: 'Limitez les cryptos à 5-10% du patrimoine. Sécurisez les montants importants sur cold wallet.' },
  ],
  CASH: [
    { icon: '📋', title: 'Utilisation', tip: 'Un compte courant ne devrait pas dépasser 2-3 mois de dépenses. Transférez le surplus vers du Livret A.' },
    { icon: '💡', title: 'Conseil', tip: 'Le cash non investi perd ~2% de pouvoir d\'achat chaque année (inflation). Arbitrez rapidement.' },
  ],
}

function getEnvelopeValue(env: Envelope): number {
  if (env.type === 'IMMOBILIER') return Number(env.metadata.currentValue ?? 0)
  if (env.totalValue !== null) return env.totalValue
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function getEnvelopeInvested(env: Envelope): number {
  if (env.type === 'IMMOBILIER') return Number(env.metadata.purchasePrice ?? 0)
  if (['PEA','CTO','AV'].includes(env.type)) return Number(env.metadata.totalDeposited ?? 0)
  if (env.type === 'LIVRET') return Number(env.metadata.balance ?? 0)
  if (env.type === 'CASH') return Number(env.metadata.balance ?? 0)
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EnvelopeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [envelope, setEnvelope] = useState<Envelope | null>(null)
  const [siblings, setSiblings] = useState<Envelope[]>([])
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

  // Load siblings when envelope type is known
  useEffect(() => {
    if (!envelope) return
    const cat = TYPE_TO_CATEGORY[envelope.type]
    fetch('/api/patrimoine/envelopes')
      .then(r => r.json())
      .then((all: Envelope[]) => {
        if (Array.isArray(all)) setSiblings(all.filter(e => (cat.types as string[]).includes(e.type)))
      })
      .catch(() => {})
  }, [envelope])

  const loadPrices = useCallback(async (positions: Envelope['positions']) => {
    if (!positions.length) return
    const marketPositions = positions.filter(p => !['LIVRET', 'CASH'].includes(p.assetType))
    if (!marketPositions.length) return

    const symbols = marketPositions.map(p => p.symbol)
    const { hits, misses, oldestHitMs } = getCachedPrices(symbols)
    if (Object.keys(hits).length > 0) {
      setPrices(prev => ({ ...prev, ...hits }))
      if (oldestHitMs !== null) setCacheAge(Math.floor((Date.now() - oldestHitMs) / 60_000))
    }
    if (misses.length === 0) return

    setPricesLoading(true)
    try {
      const res = await fetch('/api/portfolio/prices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: marketPositions.filter(p => misses.includes(p.symbol)) }),
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
    if (envelope && ['PEA', 'CTO', 'CRYPTO'].includes(envelope.type)) loadPrices(envelope.positions)
  }, [envelope, loadPrices])

  const saveMetadata = async (meta: Record<string, unknown>) => {
    const res = await fetch(`/api/patrimoine/envelopes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--p-text-faint)', fontSize: 14 }}>
        Chargement…
      </div>
    )
  }
  if (!envelope) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ color: 'var(--p-text-faint)', fontSize: 14, marginBottom: 16 }}>Enveloppe introuvable</div>
        <Link href="/dashboard/patrimoine"><Button variant="outline" size="sm">← Retour</Button></Link>
      </div>
    )
  }

  const cfg = ENVELOPE_TYPE_CONFIG[envelope.type]
  const Icon = cfg.icon
  const cat = TYPE_TO_CATEGORY[envelope.type]
  const insights = TYPE_INSIGHTS[envelope.type]
  const envValue = getEnvelopeValue(envelope)
  const envInvested = getEnvelopeInvested(envelope)
  const pl = envInvested > 0 ? envValue - envInvested : null
  const plPct = pl !== null && envInvested > 0 ? (pl / envInvested) * 100 : null
  const showPL = !['LIVRET','CASH'].includes(envelope.type) && pl !== null && envInvested > 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--p-bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid var(--p-line)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Link href="/dashboard/patrimoine" style={{ color: 'var(--p-text-faint)', textDecoration: 'none' }}>Mon Patrimoine</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <Link href={cat.href} style={{ color: cat.color, textDecoration: 'none', fontWeight: 600 }}>{cat.label}</Link>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--p-text-dim)' }}>{envelope.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.color + '18', border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 15, height: 15, color: cfg.color }} />
            </div>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false) }}
                  style={{ height: 30, fontSize: 16, fontWeight: 700, width: 220 }} />
                <button onClick={handleRename} style={{ padding: 4, borderRadius: 6, background: cfg.color + '20', border: `1px solid ${cfg.color}40`, cursor: 'pointer' }}>
                  <Check style={{ width: 13, height: 13, color: cfg.color }} />
                </button>
                <button onClick={() => setEditingName(false)} style={{ padding: 4, borderRadius: 6, background: 'none', border: '1px solid var(--p-line)', cursor: 'pointer' }}>
                  <X style={{ width: 13, height: 13, color: 'var(--p-text-faint)' }} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--p-text)', margin: 0 }}>{envelope.name}</h1>
                <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{cfg.label}</span>
                <button onClick={() => setEditingName(true)} style={{ padding: 3, borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)' }}>
                  <Pencil style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!confirmDelete ? (
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)} style={{ color: '#ef4444', borderColor: '#ef444430', fontSize: 11 }}>
                <Trash2 style={{ width: 12, height: 12, marginRight: 4 }} />Supprimer
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Annuler</Button>
                <Button size="sm" onClick={handleDelete} style={{ background: '#ef4444', color: '#fff' }}>Confirmer</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-col body ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 270px', gap: 16, alignItems: 'start' }}>

          {/* ── LEFT: sibling envelopes ── */}
          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Link href={cat.href} style={{ fontSize: 10, fontWeight: 700, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none' }}>
                {cat.label}
              </Link>
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: cat.color + '18', color: cat.color, fontWeight: 700 }}>{siblings.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {siblings.map(sib => {
                const sibCfg = ENVELOPE_TYPE_CONFIG[sib.type]
                const SibIcon = sibCfg.icon
                const isCurrent = sib.id === id
                const sibVal = getEnvelopeValue(sib)
                return (
                  <Link key={sib.id} href={`/dashboard/patrimoine/${sib.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '10px 12px', borderRadius: 11, cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                      background: isCurrent ? cat.color + '12' : 'var(--p-card)',
                      border: `1px solid ${isCurrent ? cat.color + '50' : 'var(--p-line)'}`,
                    }}
                      onMouseEnter={e => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.borderColor = cat.color + '40'; (e.currentTarget as HTMLElement).style.background = 'var(--p-row-hover)' } }}
                      onMouseLeave={e => { if (!isCurrent) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p-line)'; (e.currentTarget as HTMLElement).style.background = 'var(--p-card)' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, background: sibCfg.color + '18', border: `1px solid ${sibCfg.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <SibIcon style={{ width: 11, height: 11, color: sibCfg.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? cat.color : 'var(--p-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sib.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{sibCfg.label}</div>
                        </div>
                        {sibVal > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-dim)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(sibVal)}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}

              {/* Add sibling */}
              <Link href={cat.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ padding: '10px 12px', borderRadius: 11, border: '1.5px dashed var(--p-line)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cat.color + '55'; (e.currentTarget as HTMLElement).style.background = cat.color + '05' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--p-line)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 7, border: '1.5px dashed var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus style={{ width: 11, height: 11, color: 'var(--p-text-faint)' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>Ajouter une enveloppe</span>
                </div>
              </Link>
            </div>
          </div>

          {/* ── CENTER: section content ── */}
          <div>
            {envelope.type === 'LIVRET' && <LivretSection envelope={envelope} onSave={saveMetadata} />}
            {envelope.type === 'IMMOBILIER' && <ImmobilierSection envelope={envelope} onSave={saveMetadata} />}
            {(envelope.type === 'PEA' || envelope.type === 'CTO') && (
              <PeaCtoCryptoSection envelope={envelope} prices={prices} pricesLoading={pricesLoading}
                onRefreshPrices={() => loadPrices(envelope.positions)} onSave={saveMetadata}
                onReload={loadEnvelope} cacheAge={cacheAge} />
            )}
            {envelope.type === 'AV' && <AVSection envelope={envelope} onSave={saveMetadata} />}
            {envelope.type === 'CRYPTO' && (
              <PeaCtoCryptoSection envelope={envelope} prices={prices} pricesLoading={pricesLoading}
                onRefreshPrices={() => loadPrices(envelope.positions)} onSave={saveMetadata}
                onReload={loadEnvelope} isCrypto cacheAge={cacheAge} />
            )}
            {envelope.type === 'PER' && <PERSection envelope={envelope} onSave={saveMetadata} />}
            {envelope.type === 'CASH' && <CashSection envelope={envelope} onSave={saveMetadata} />}
          </div>

          {/* ── RIGHT: summary KPIs + insights ── */}
          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* KPI summary */}
            {(envValue > 0 || envInvested > 0) && (
              <div style={{ background: `linear-gradient(135deg, ${cfg.color}10, transparent)`, border: `1px solid ${cfg.color}28`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 12, height: 12, color: cfg.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {envValue > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        {envelope.type === 'IMMOBILIER' ? 'Valeur estimée' : envelope.type === 'LIVRET' || envelope.type === 'CASH' ? 'Solde' : 'Valeur actuelle'}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(envValue)}</div>
                    </div>
                  )}
                  {envInvested > 0 && envInvested !== envValue && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--p-line)' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Capital investi</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{fmtCompact(envInvested)}</span>
                    </div>
                  )}
                  {showPL && pl !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{pl >= 0 ? 'Plus-value' : 'Moins-value'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pl >= 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>{pl >= 0 ? '+' : ''}{fmtCompact(pl)}</span>
                        {plPct !== null && <span style={{ fontSize: 10, color: pl >= 0 ? '#34d399' : '#f87171' }}>({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insights */}
            <div style={{ background: `linear-gradient(135deg, ${cfg.color}06, transparent)`, border: `1px solid ${cfg.color}18`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <span style={{ fontSize: 15 }}>📊</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>Insights & Analyses</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.map((ins, i) => (
                  <div key={i}>
                    {i > 0 && <div style={{ height: 1, background: 'var(--p-line)', marginBottom: 12 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>{ins.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>{ins.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.65, margin: 0 }}>{ins.tip}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
