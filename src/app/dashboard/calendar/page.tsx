'use client'
import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, DollarSign, Scissors, ChevronRight, ExternalLink, Calendar, Star } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type EventCategory = 'resultats' | 'dividendes' | 'splits'

interface FinancialEvent {
  id: string
  date: string
  ticker: string
  name: string
  market: 'FR' | 'US' | 'EU'
  category: EventCategory
  // Résultats
  epsEst?: number
  epsActual?: number | null
  revenueEst?: string
  revenueActual?: string | null
  // Dividendes
  amount?: number
  currency?: string
  exDate?: string
  payDate?: string
  frequency?: string
  yield?: number
  // Splits
  ratio?: string
  type?: 'split' | 'reverse'
  important?: boolean
}

// ── Static mock data ───────────────────────────────────────────────────────────
const EVENTS: FinancialEvent[] = [
  // Résultats
  { id: 'r1', date: '2026-04-17', ticker: 'GOOG', name: 'Alphabet Inc.', market: 'US', category: 'resultats', epsEst: 1.87, epsActual: null, revenueEst: '89.2B', revenueActual: null, important: true },
  { id: 'r2', date: '2026-04-17', ticker: 'TSLA', name: 'Tesla Inc.', market: 'US', category: 'resultats', epsEst: 0.51, epsActual: null, revenueEst: '21.5B', revenueActual: null },
  { id: 'r3', date: '2026-04-22', ticker: 'META', name: 'Meta Platforms', market: 'US', category: 'resultats', epsEst: 5.21, epsActual: null, revenueEst: '41.5B', revenueActual: null, important: true },
  { id: 'r4', date: '2026-04-22', ticker: 'MSFT', name: 'Microsoft Corp.', market: 'US', category: 'resultats', epsEst: 3.21, epsActual: null, revenueEst: '68.7B', revenueActual: null, important: true },
  { id: 'r5', date: '2026-04-23', ticker: 'AMZN', name: 'Amazon.com Inc.', market: 'US', category: 'resultats', epsEst: 1.37, epsActual: null, revenueEst: '155.1B', revenueActual: null, important: true },
  { id: 'r6', date: '2026-04-24', ticker: 'AAPL', name: 'Apple Inc.', market: 'US', category: 'resultats', epsEst: 1.61, epsActual: null, revenueEst: '94.2B', revenueActual: null, important: true },
  { id: 'r7', date: '2026-04-25', ticker: 'MC.PA', name: 'LVMH', market: 'FR', category: 'resultats', epsEst: 11.2, epsActual: null, revenueEst: '22.1B', revenueActual: null },
  { id: 'r8', date: '2026-04-29', ticker: 'OR.PA', name: "L'Oréal", market: 'FR', category: 'resultats', epsEst: 4.63, epsActual: null, revenueEst: '11.8B', revenueActual: null },
  { id: 'r9', date: '2026-04-10', ticker: 'JPM', name: 'JPMorgan Chase', market: 'US', category: 'resultats', epsEst: 4.12, epsActual: 4.44, revenueEst: '41.9B', revenueActual: '43.1B' },
  { id: 'r10', date: '2026-04-14', ticker: 'GS', name: 'Goldman Sachs', market: 'US', category: 'resultats', epsEst: 8.56, epsActual: 14.12, revenueEst: '12.4B', revenueActual: '15.1B', important: true },
  { id: 'r11', date: '2026-04-15', ticker: 'ASML', name: 'ASML Holding', market: 'EU', category: 'resultats', epsEst: 4.87, epsActual: 5.12, revenueEst: '7.9B', revenueActual: '8.2B' },
  // Dividendes
  { id: 'd1', date: '2026-04-22', ticker: 'TTE.PA', name: 'TotalEnergies', market: 'FR', category: 'dividendes', amount: 0.79, currency: '€', exDate: '2026-04-22', payDate: '2026-05-10', frequency: 'Trimestriel', yield: 4.8 },
  { id: 'd2', date: '2026-04-18', ticker: 'SAN.PA', name: 'Sanofi', market: 'FR', category: 'dividendes', amount: 1.00, currency: '€', exDate: '2026-04-18', payDate: '2026-04-25', frequency: 'Annuel', yield: 3.6 },
  { id: 'd3', date: '2026-04-24', ticker: 'MSFT', name: 'Microsoft', market: 'US', category: 'dividendes', amount: 0.83, currency: '$', exDate: '2026-04-24', payDate: '2026-06-12', frequency: 'Trimestriel', yield: 0.8 },
  { id: 'd4', date: '2026-04-16', ticker: 'BNP.PA', name: 'BNP Paribas', market: 'FR', category: 'dividendes', amount: 4.60, currency: '€', exDate: '2026-04-16', payDate: '2026-04-23', frequency: 'Annuel', yield: 8.1, important: true },
  { id: 'd5', date: '2026-04-25', ticker: 'AI.PA', name: 'Air Liquide', market: 'FR', category: 'dividendes', amount: 3.20, currency: '€', exDate: '2026-04-25', payDate: '2026-05-07', frequency: 'Annuel', yield: 2.2 },
  { id: 'd6', date: '2026-04-29', ticker: 'JNJ', name: 'Johnson & Johnson', market: 'US', category: 'dividendes', amount: 1.24, currency: '$', exDate: '2026-04-29', payDate: '2026-06-03', frequency: 'Trimestriel', yield: 3.2 },
  { id: 'd7', date: '2026-04-30', ticker: 'AAPL', name: 'Apple Inc.', market: 'US', category: 'dividendes', amount: 0.25, currency: '$', exDate: '2026-04-30', payDate: '2026-05-15', frequency: 'Trimestriel', yield: 0.5 },
  // Splits
  { id: 's1', date: '2026-04-20', ticker: 'NVDA', name: 'NVIDIA Corp.', market: 'US', category: 'splits', ratio: '10:1', type: 'split', important: true },
  { id: 's2', date: '2026-04-28', ticker: 'TSLA', name: 'Tesla Inc.', market: 'US', category: 'splits', ratio: '5:1', type: 'split' },
  { id: 's3', date: '2026-05-05', ticker: 'MELI', name: 'MercadoLibre', market: 'US', category: 'splits', ratio: '2:1', type: 'split' },
]

const TABS: { key: EventCategory; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
  { key: 'resultats', label: 'Résultats', icon: TrendingUp },
  { key: 'dividendes', label: 'Dividendes', icon: DollarSign },
  { key: 'splits', label: 'Splits', icon: Scissors },
]

const MARKET_COLORS: Record<string, string> = { FR: '#818cf8', US: '#34d399', EU: '#60a5fa' }

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  if (diff === -1) return 'Hier'
  if (diff < 0) return `Il y a ${Math.abs(diff)}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function isPast(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return d < today
}

// ── Group events by date ───────────────────────────────────────────────────────
function groupByDate(events: FinancialEvent[]) {
  const groups: Record<string, FinancialEvent[]> = {}
  events.forEach(e => {
    if (!groups[e.date]) groups[e.date] = []
    groups[e.date].push(e)
  })
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export default function CalendarPage() {
  const [tab, setTab] = useState<EventCategory>('resultats')
  const [market, setMarket] = useState<'ALL' | 'FR' | 'US' | 'EU'>('ALL')

  const filtered = EVENTS.filter(e =>
    e.category === tab && (market === 'ALL' || e.market === market)
  )
  const grouped = groupByDate(filtered)
  const upcoming = filtered.filter(e => !isPast(e.date))
  const past = filtered.filter(e => isPast(e.date))
  const important = filtered.filter(e => e.important && !isPast(e.date))

  return (
    <div style={{ background: 'var(--content-bg)', minHeight: '100vh', padding: '28px 24px 56px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: 0 }}>
            Calendrier financier
          </h1>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'À venir', value: upcoming.length, color: '#34d399' },
            { label: 'Importants', value: important.length, color: '#f1c086' },
            { label: 'Passés', value: past.length, color: 'var(--text-subtle)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'Geist Mono, monospace' }}>{s.value}</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Category tabs */}
        <div style={{ display: 'flex', background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: 3, gap: 2 }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s', background: active ? 'var(--modal-surface)' : 'transparent', color: active ? 'var(--text-em)' : 'var(--text-muted-c)', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.15)' : 'none' }}>
                <Icon style={{ width: 13, height: 13 }} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Market filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'FR', 'US', 'EU'] as const).map(m => (
            <button key={m} onClick={() => setMarket(m)}
              style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${market === m ? 'rgba(241,192,134,0.4)' : 'var(--card-dark-border)'}`, background: market === m ? 'rgba(241,192,134,0.08)' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: market === m ? '#f1c086' : 'var(--text-subtle)', transition: 'all 0.15s' }}>
              {m === 'ALL' ? 'Tous' : m}
            </button>
          ))}
        </div>
      </div>

      {/* ── Important events banner ── */}
      {important.length > 0 && (
        <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <Star style={{ width: 14, height: 14, color: '#f1c086' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f1c086' }}>Événements importants</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {important.map(e => (
              <span key={e.id} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)', background: 'rgba(241,192,134,0.08)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 6, padding: '3px 10px' }}>
                {e.ticker} — {formatDate(e.date)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Events by date ── */}
      {grouped.length === 0 && (
        <div className="na-card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar style={{ width: 40, height: 40, color: 'var(--text-subtle)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-em)', marginBottom: 6 }}>Aucun événement</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Modifiez les filtres pour voir plus d'événements.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {grouped.map(([date, events]) => {
          const today = isToday(date)
          const past = isPast(date)
          return (
            <div key={date}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {today && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse 2s infinite' }} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: today ? '#34d399' : past ? 'var(--text-subtle)' : 'var(--text-em)', letterSpacing: '-0.02em' }}>
                    {today ? "Aujourd'hui" : new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'var(--section-border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{events.length} événement{events.length > 1 ? 's' : ''}</span>
              </div>

              {/* Events */}
              <div className="na-card" style={{ overflow: 'hidden' }}>
                {events.map((event, i) => (
                  <div key={event.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < events.length - 1 ? '1px solid var(--section-border)' : undefined, opacity: past ? 0.65 : 1, transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                    {/* Ticker + market */}
                    <div style={{ minWidth: 80, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace' }}>{event.ticker}</span>
                        {event.important && <Star style={{ width: 11, height: 11, color: '#f1c086' }} />}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: MARKET_COLORS[event.market], background: MARKET_COLORS[event.market] + '18', borderRadius: 4, padding: '1px 5px' }}>{event.market}</span>
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</p>

                      {/* Category-specific details */}
                      {event.category === 'resultats' && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            BPA est. <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted-c)', fontWeight: 600 }}>${event.epsEst?.toFixed(2)}</span>
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            CA est. <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted-c)', fontWeight: 600 }}>{event.revenueEst}</span>
                          </span>
                          {event.epsActual != null && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: event.epsActual >= (event.epsEst ?? 0) ? '#34d399' : '#f87171' }}>
                              BPA réel : ${event.epsActual.toFixed(2)}
                              {' '}{event.epsActual >= (event.epsEst ?? 0) ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      )}
                      {event.category === 'dividendes' && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            Détachement <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted-c)', fontWeight: 600 }}>{event.exDate && new Date(event.exDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                            Paiement <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted-c)', fontWeight: 600 }}>{event.payDate && new Date(event.payDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
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

                    {/* Right: value / date */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {event.category === 'dividendes' && event.amount != null && (
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace' }}>
                          {event.currency}{event.amount.toFixed(2)}
                        </span>
                      )}
                      {event.category === 'dividendes' && event.yield != null && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399' }}>{event.yield}% yield</span>
                      )}
                      {event.category === 'resultats' && (
                        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                          {past ? 'Publié' : 'Prévu'} · {formatDate(date)}
                        </span>
                      )}
                      {event.category === 'splits' && (
                        <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                          {formatDate(date)}
                        </span>
                      )}
                      {event.epsActual != null && (
                        <span style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'rgba(52,211,153,0.08)', borderRadius: 5, padding: '1px 6px' }}>Publié</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer note ── */}
      <div style={{ marginTop: 32, padding: '14px 18px', background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ExternalLink style={{ width: 14, height: 14, color: 'var(--text-subtle)', flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>
          Les données affichées sont indicatives. Les dates et estimations peuvent varier.
          {' '}Sources : rapports d&apos;entreprises, consensus analystes.
        </p>
      </div>
    </div>
  )
}
