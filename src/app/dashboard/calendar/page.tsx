'use client'
import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, DollarSign, Scissors, ExternalLink, Calendar, Star, RefreshCw } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type EventCategory = 'resultats' | 'dividendes' | 'splits'

interface FinancialEvent {
  id: string
  date: string
  ticker: string
  name: string
  market: 'FR' | 'US' | 'EU'
  category: EventCategory
  epsEst?: number | null
  epsActual?: number | null
  revenueEst?: string
  revenueActual?: string | null
  amount?: number
  currency?: string
  exDate?: string
  payDate?: string
  frequency?: string
  yield?: number
  ratio?: string
  type?: 'split' | 'reverse'
  important?: boolean
}

// ── Dividend schedule — always computed relative to today ──────────────────────
interface DividendSchedule {
  ticker: string
  name: string
  market: 'FR' | 'US' | 'EU'
  amount: number
  currency: string
  frequency: string
  yield: number
  important?: boolean
  exMonths: number[]  // months (1-12) when ex-date occurs
  exDay: number
  payDelay: number    // days from ex-date to pay-date
}

const DIVIDEND_SCHEDULE: DividendSchedule[] = [
  { ticker: 'TTE.PA', name: 'TotalEnergies',        market: 'FR', amount: 0.79, currency: '€', frequency: 'Trimestriel', yield: 4.8, exMonths: [1,4,7,10], exDay: 21, payDelay: 18 },
  { ticker: 'BNP.PA', name: 'BNP Paribas',          market: 'FR', amount: 4.60, currency: '€', frequency: 'Annuel',      yield: 8.1, exMonths: [4],         exDay: 16, payDelay: 7,  important: true },
  { ticker: 'SAN.PA', name: 'Sanofi',                market: 'FR', amount: 1.00, currency: '€', frequency: 'Annuel',      yield: 3.6, exMonths: [5],         exDay: 6,  payDelay: 14 },
  { ticker: 'AI.PA',  name: 'Air Liquide',           market: 'FR', amount: 3.20, currency: '€', frequency: 'Annuel',      yield: 2.2, exMonths: [5],         exDay: 15, payDelay: 12 },
  { ticker: 'OR.PA',  name: "L'Oréal",               market: 'FR', amount: 6.60, currency: '€', frequency: 'Annuel',      yield: 2.1, exMonths: [4],         exDay: 24, payDelay: 14 },
  { ticker: 'MC.PA',  name: 'LVMH',                  market: 'FR', amount: 7.50, currency: '€', frequency: 'Semi-annuel', yield: 1.8, exMonths: [4,12],      exDay: 10, payDelay: 14 },
  { ticker: 'ORA.PA', name: 'Orange SA',             market: 'FR', amount: 0.70, currency: '€', frequency: 'Semi-annuel', yield: 7.2, exMonths: [3,9],       exDay: 4,  payDelay: 14 },
  { ticker: 'MSFT',   name: 'Microsoft Corp.',       market: 'US', amount: 0.83, currency: '$', frequency: 'Trimestriel', yield: 0.8, exMonths: [2,5,8,11],  exDay: 15, payDelay: 55 },
  { ticker: 'AAPL',   name: 'Apple Inc.',            market: 'US', amount: 0.25, currency: '$', frequency: 'Trimestriel', yield: 0.5, exMonths: [2,5,8,11],  exDay: 9,  payDelay: 35 },
  { ticker: 'JNJ',    name: 'Johnson & Johnson',     market: 'US', amount: 1.24, currency: '$', frequency: 'Trimestriel', yield: 3.2, exMonths: [2,5,8,11],  exDay: 22, payDelay: 35 },
  { ticker: 'KO',     name: 'Coca-Cola Co.',         market: 'US', amount: 0.49, currency: '$', frequency: 'Trimestriel', yield: 3.0, exMonths: [3,6,9,12],  exDay: 14, payDelay: 14 },
  { ticker: 'V',      name: 'Visa Inc.',             market: 'US', amount: 0.59, currency: '$', frequency: 'Trimestriel', yield: 0.8, exMonths: [3,6,9,12],  exDay: 10, payDelay: 14 },
  { ticker: 'JPM',    name: 'JPMorgan Chase',        market: 'US', amount: 1.25, currency: '$', frequency: 'Trimestriel', yield: 2.1, exMonths: [1,4,7,10],  exDay: 6,  payDelay: 25 },
  { ticker: 'ASML',   name: 'ASML Holding',          market: 'EU', amount: 1.52, currency: '€', frequency: 'Trimestriel', yield: 0.9, exMonths: [2,5,8,11],  exDay: 7,  payDelay: 14 },
  { ticker: 'SAP',    name: 'SAP SE',                market: 'EU', amount: 2.20, currency: '€', frequency: 'Annuel',      yield: 1.4, exMonths: [5],         exDay: 22, payDelay: 10 },
]

// Splits — future-only, defined relative to upcoming months
const SPLITS_RAW: { ticker: string; name: string; market: 'FR'|'US'|'EU'; ratio: string; type: 'split'|'reverse'; daysFromNow: number; important?: boolean }[] = [
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',    market: 'US', ratio: '10:1', type: 'split',   daysFromNow: 18, important: true },
  { ticker: 'TSLA',  name: 'Tesla Inc.',      market: 'US', ratio: '5:1',  type: 'split',   daysFromNow: 34 },
  { ticker: 'MELI',  name: 'MercadoLibre',   market: 'US', ratio: '2:1',  type: 'split',   daysFromNow: 51 },
]

function computeDividends(windowDays = 45): FinancialEvent[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today.getTime() + windowDays * 86400000)
  const events: FinancialEvent[] = []

  for (const s of DIVIDEND_SCHEDULE) {
    for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
      for (const m of s.exMonths) {
        const exDate = new Date(y, m - 1, s.exDay)
        if (exDate >= today && exDate <= limit) {
          const payDate = new Date(exDate.getTime() + s.payDelay * 86400000)
          const exStr = exDate.toISOString().split('T')[0]
          events.push({
            id: `d-${s.ticker}-${y}-${m}`,
            date: exStr,
            ticker: s.ticker,
            name: s.name,
            market: s.market,
            category: 'dividendes',
            amount: s.amount,
            currency: s.currency,
            exDate: exStr,
            payDate: payDate.toISOString().split('T')[0],
            frequency: s.frequency,
            yield: s.yield,
            important: s.important,
          })
        }
      }
    }
  }
  return events
}

function computeSplits(): FinancialEvent[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return SPLITS_RAW.map(s => {
    const date = new Date(today.getTime() + s.daysFromNow * 86400000)
    return {
      id: `s-${s.ticker}`,
      date: date.toISOString().split('T')[0],
      ticker: s.ticker,
      name: s.name,
      market: s.market,
      category: 'splits' as const,
      ratio: s.ratio,
      type: s.type,
      important: s.important,
    }
  })
}

// ── UI constants ───────────────────────────────────────────────────────────────
const TABS: { key: EventCategory; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
  { key: 'resultats',  label: 'Résultats',  icon: TrendingUp },
  { key: 'dividendes', label: 'Dividendes', icon: DollarSign },
  { key: 'splits',     label: 'Splits',     icon: Scissors },
]
const MARKET_COLORS: Record<string, string> = { FR: '#818cf8', US: '#34d399', EU: '#60a5fa' }

// ── Helpers ────────────────────────────────────────────────────────────────────
function groupByDate(events: FinancialEvent[]) {
  const groups: Record<string, FinancialEvent[]> = {}
  events.forEach(e => { (groups[e.date] ??= []).push(e) })
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  if (diff === -1) return 'Hier'
  if (diff < 0) return `Il y a ${Math.abs(diff)}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

function isPast(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  return d < today
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [tab, setTab]       = useState<EventCategory>('resultats')
  const [market, setMarket] = useState<'ALL' | 'FR' | 'US' | 'EU'>('ALL')
  const [earnings, setEarnings] = useState<FinancialEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchEarnings = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/calendar')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEarnings(data.earnings || [])
      setLastRefresh(new Date())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEarnings() }, [])

  // Compute dividends + splits fresh on each render (they depend on today's date)
  const dividends = useMemo(() => computeDividends(45), [])
  const splits    = useMemo(() => computeSplits(), [])

  const allEvents = useMemo<Record<EventCategory, FinancialEvent[]>>(() => ({
    resultats:  earnings,
    dividendes: dividends,
    splits:     splits,
  }), [earnings, dividends, splits])

  const filtered = useMemo(() =>
    (allEvents[tab] || []).filter(e => market === 'ALL' || e.market === market),
    [allEvents, tab, market]
  )

  const grouped   = useMemo(() => groupByDate(filtered), [filtered])
  const upcoming  = filtered.filter(e => !isPast(e.date))
  const past      = filtered.filter(e => isPast(e.date))
  const important = filtered.filter(e => e.important && !isPast(e.date))

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh', padding: '28px 24px 56px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--p-text-faint)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--p-text)', letterSpacing: '-0.04em', margin: 0 }}>
            Calendrier financier
          </h1>
          {lastRefresh && (
            <p style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 4 }}>
              Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Stats */}
          {[
            { label: 'À venir', value: upcoming.length, color: '#34d399' },
            { label: 'Importants', value: important.length, color: '#B07820' },
            { label: 'Passés', value: past.length, color: 'var(--p-text-faint)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{s.label}</span>
            </div>
          ))}

          {/* Refresh button */}
          <button
            onClick={fetchEarnings}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 8, cursor: loading ? 'default' : 'pointer', color: 'var(--p-text-dim)', fontSize: 11 }}
          >
            <RefreshCw style={{ width: 12, height: 12, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 10, padding: 3, gap: 2 }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s', background: active ? 'var(--modal-surface, var(--p-card-2))' : 'transparent', color: active ? 'var(--p-text-em)' : 'var(--p-text-dim)', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
                <Icon style={{ width: 13, height: 13 }} />
                {t.label}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'FR', 'US', 'EU'] as const).map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${market === m ? 'rgba(176,120,32,0.4)' : 'var(--p-line)'}`, background: market === m ? 'rgba(176,120,32,0.08)' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: market === m ? '#B07820' : 'var(--p-text-faint)', transition: 'all 0.15s' }}>
              {m === 'ALL' ? 'Tous' : m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error notice ── */}
      {error && tab === 'resultats' && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10, fontSize: 12, color: '#f87171' }}>
          Impossible de charger les résultats en temps réel. Réessayez dans quelques instants.
        </div>
      )}

      {/* ── Important events banner ── */}
      {important.length > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(176,120,32,0.06)', border: '1px solid rgba(176,120,32,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Star style={{ width: 14, height: 14, color: '#B07820' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#B07820' }}>Événements importants</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {important.map(e => (
              <span key={e.id} style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-em)', background: 'rgba(176,120,32,0.08)', border: '1px solid rgba(176,120,32,0.15)', borderRadius: 6, padding: '3px 10px' }}>
                {e.ticker} — {formatDate(e.date)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && tab === 'resultats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="na-card" style={{ padding: 20, opacity: 0.5 }}>
              <div style={{ height: 12, width: 120, background: 'var(--p-line)', borderRadius: 6, marginBottom: 12 }} />
              {[1,2].map(j => (
                <div key={j} style={{ display: 'flex', gap: 12, paddingTop: 10 }}>
                  <div style={{ width: 60, height: 36, background: 'var(--p-line)', borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: '40%', background: 'var(--p-line)', borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 10, width: '60%', background: 'var(--p-line)', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && grouped.length === 0 && (
        <div className="na-card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar style={{ width: 40, height: 40, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 6 }}>Aucun événement</p>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>Modifiez les filtres pour voir plus d&apos;événements.</p>
        </div>
      )}

      {/* ── Events by date ── */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([date, events]) => {
            const todayDate = isToday(date)
            const pastDate  = isPast(date)
            return (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {todayDate && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: todayDate ? '#34d399' : pastDate ? 'var(--p-text-faint)' : 'var(--p-text-em)', letterSpacing: '-0.02em' }}>
                      {todayDate ? "Aujourd'hui" : new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--p-line)' }} />
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{events.length} événement{events.length > 1 ? 's' : ''}</span>
                </div>

                <div className="na-card" style={{ overflow: 'hidden' }}>
                  {events.map((event, i) => (
                    <div key={event.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < events.length - 1 ? '1px solid var(--p-line)' : undefined, opacity: pastDate ? 0.65 : 1, transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover, var(--row-hover))')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Ticker + market */}
                      <div style={{ minWidth: 80, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'Geist Mono, monospace' }}>{event.ticker}</span>
                          {event.important && <Star style={{ width: 11, height: 11, color: '#B07820' }} />}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: MARKET_COLORS[event.market], background: MARKET_COLORS[event.market] + '18', borderRadius: 4, padding: '1px 5px' }}>{event.market}</span>
                      </div>

                      {/* Name + details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-text-em)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</p>

                        {event.category === 'resultats' && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            {event.epsEst != null && (
                              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                                BPA est. <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--p-text-dim)', fontWeight: 600 }}>${event.epsEst.toFixed(2)}</span>
                              </span>
                            )}
                            {event.revenueEst && (
                              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                                CA est. <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--p-text-dim)', fontWeight: 600 }}>{event.revenueEst}</span>
                              </span>
                            )}
                            {event.epsActual != null && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: event.epsActual >= (event.epsEst ?? 0) ? '#34d399' : '#f87171' }}>
                                BPA réel : ${event.epsActual.toFixed(2)} {event.epsActual >= (event.epsEst ?? 0) ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        )}

                        {event.category === 'dividendes' && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                              Détachement <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--p-text-dim)', fontWeight: 600 }}>
                                {event.exDate && new Date(event.exDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                              Paiement <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--p-text-dim)', fontWeight: 600 }}>
                                {event.payDate && new Date(event.payDate + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </span>
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>{event.frequency}</span>
                          </div>
                        )}

                        {event.category === 'splits' && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: event.type === 'split' ? '#34d399' : '#f87171' }}>
                              {event.type === 'split' ? 'Split' : 'Reverse split'} {event.ratio}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right column */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        {event.category === 'dividendes' && event.amount != null && (
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'Geist Mono, monospace' }}>
                            {event.currency}{event.amount.toFixed(2)}
                          </span>
                        )}
                        {event.category === 'dividendes' && event.yield != null && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>{event.yield}% yield</span>
                        )}
                        {event.category === 'resultats' && (
                          <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                            {pastDate ? 'Publié' : 'Prévu'} · {formatDate(date)}
                          </span>
                        )}
                        {event.category === 'splits' && (
                          <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{formatDate(date)}</span>
                        )}
                        {event.epsActual != null && (
                          <span style={{ fontSize: 10, color: 'var(--p-text-faint)', background: 'rgba(52,211,153,0.08)', borderRadius: 5, padding: '1px 6px' }}>Publié</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 32, padding: '14px 18px', background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ExternalLink style={{ width: 14, height: 14, color: 'var(--p-text-faint)', flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: 'var(--p-text-faint)', margin: 0, lineHeight: 1.5 }}>
          Résultats d&apos;entreprises mis à jour en temps réel via Finnhub · Dividendes et splits sur calendrier prévisionnel.
          Les données sont indicatives, les estimations peuvent varier.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
