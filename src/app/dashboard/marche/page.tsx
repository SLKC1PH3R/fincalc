'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, TrendingDown, ChevronRight, Star, Filter } from 'lucide-react'
import { ETF_DATABASE } from '@/lib/etf-database'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'etf' | 'actions' | 'crypto' | 'scpi'

// ── Static mock data ───────────────────────────────────────────────────────────
const ACTIONS = [
  { ticker: 'AAPL',   name: 'Apple Inc.',        market: 'NASDAQ', sector: 'Technologie',   price: 224.37, change: 1.24,  mcap: '3 310B$',  pe: 35.2, popular: true  },
  { ticker: 'MSFT',   name: 'Microsoft Corp.',   market: 'NASDAQ', sector: 'Technologie',   price: 415.29, change: 0.87,  mcap: '3 080B$',  pe: 38.1, popular: true  },
  { ticker: 'NVDA',   name: 'NVIDIA Corp.',      market: 'NASDAQ', sector: 'Semi-conducteurs', price: 875.60, change: 3.21, mcap: '2 150B$', pe: 67.4, popular: true  },
  { ticker: 'AMZN',   name: 'Amazon.com Inc.',   market: 'NASDAQ', sector: 'Commerce',      price: 194.50, change: -0.43, mcap: '2 010B$', pe: 44.2, popular: true  },
  { ticker: 'META',   name: 'Meta Platforms',    market: 'NASDAQ', sector: 'Réseaux sociaux', price: 536.18, change: 2.11, mcap: '1 360B$', pe: 28.7, popular: true  },
  { ticker: 'GOOG',   name: 'Alphabet Inc.',     market: 'NASDAQ', sector: 'Technologie',   price: 172.45, change: -1.03, mcap: '2 140B$', pe: 24.1, popular: false },
  { ticker: 'TSLA',   name: 'Tesla Inc.',        market: 'NASDAQ', sector: 'Auto & Énergie', price: 248.30, change: -2.14, mcap: '790B$',  pe: 68.3, popular: true  },
  { ticker: 'MC.PA',  name: 'LVMH',             market: 'Euronext', sector: 'Luxe',         price: 572.40, change: 0.62,  mcap: '285B€',  pe: 22.4, popular: true  },
  { ticker: 'TTE.PA', name: 'TotalEnergies',    market: 'Euronext', sector: 'Énergie',       price: 58.44,  change: -0.38, mcap: '131B€',  pe: 8.7,  popular: false },
  { ticker: 'OR.PA',  name: "L'Oréal",         market: 'Euronext', sector: 'Cosmétiques',   price: 356.85, change: 1.05,  mcap: '188B€',  pe: 31.2, popular: true  },
  { ticker: 'SAN.PA', name: 'Sanofi',           market: 'Euronext', sector: 'Santé',         price: 98.62,  change: 0.21,  mcap: '125B€',  pe: 18.3, popular: false },
  { ticker: 'AI.PA',  name: 'Air Liquide',      market: 'Euronext', sector: 'Industrie',     price: 148.90, change: 0.74,  mcap: '79B€',   pe: 25.6, popular: false },
  { ticker: 'BNP.PA', name: 'BNP Paribas',     market: 'Euronext', sector: 'Banque',         price: 68.50,  change: -0.53, mcap: '82B€',  pe: 7.1,  popular: false },
  { ticker: 'ASML',   name: 'ASML Holding',    market: 'NASDAQ', sector: 'Semi-conducteurs', price: 687.44, change: 1.87,  mcap: '270B€',  pe: 41.8, popular: true  },
  { ticker: 'SAP',    name: 'SAP SE',           market: 'NYSE', sector: 'Logiciel',           price: 232.10, change: 0.45,  mcap: '284B€',  pe: 49.3, popular: false },
]

const CRYPTO = [
  { ticker: 'BTC',  name: 'Bitcoin',       price: 83420,  change: 2.14,  cap: '1 647B$', vol24h: '28.4B$', popular: true  },
  { ticker: 'ETH',  name: 'Ethereum',      price: 3180,   change: -1.22, cap: '383B$',   vol24h: '12.1B$', popular: true  },
  { ticker: 'SOL',  name: 'Solana',        price: 147.2,  change: 4.87,  cap: '68.2B$',  vol24h: '3.8B$',  popular: true  },
  { ticker: 'BNB',  name: 'BNB',           price: 598.4,  change: 0.63,  cap: '86.1B$',  vol24h: '1.9B$',  popular: false },
  { ticker: 'XRP',  name: 'Ripple',        price: 0.548,  change: -2.45, cap: '31.4B$',  vol24h: '1.4B$',  popular: false },
  { ticker: 'AVAX', name: 'Avalanche',     price: 38.74,  change: 3.21,  cap: '15.8B$',  vol24h: '0.8B$',  popular: false },
  { ticker: 'DOT',  name: 'Polkadot',      price: 7.82,   change: 1.44,  cap: '11.2B$',  vol24h: '0.4B$',  popular: false },
  { ticker: 'MATIC', name: 'Polygon',      price: 0.884,  change: -0.87, cap: '8.6B$',   vol24h: '0.3B$',  popular: false },
  { ticker: 'LINK', name: 'Chainlink',     price: 15.23,  change: 2.76,  cap: '9.1B$',   vol24h: '0.5B$',  popular: false },
  { ticker: 'UNI',  name: 'Uniswap',       price: 8.46,   change: -3.12, cap: '6.3B$',   vol24h: '0.2B$',  popular: false },
]

const SCPI = [
  { ticker: 'PRIM', name: 'Primopierre',        type: 'Bureaux',        yield: 4.31, price: 202.0,  change: 0,     aum: '3.2B€', popular: true  },
  { ticker: 'CAPI', name: 'Corum Origin',       type: 'Diversifié',     yield: 6.06, price: 1135.0, change: 0,     aum: '4.5B€', popular: true  },
  { ticker: 'IMMO', name: 'Immorente',          type: 'Commerce',       yield: 4.73, price: 182.0,  change: -0.55, aum: '5.1B€', popular: true  },
  { ticker: 'EURS', name: 'Eurovalys',          type: 'Diversifié EU',  yield: 4.50, price: 1000.0, change: 0,     aum: '1.2B€', popular: false },
  { ticker: 'PIED', name: 'Pierval Santé',      type: 'Santé',          yield: 5.02, price: 1053.0, change: 0.48,  aum: '2.8B€', popular: true  },
  { ticker: 'MACI', name: 'Maci Invest',        type: 'Bureaux',        yield: 3.87, price: 215.0,  change: -1.39, aum: '0.8B€', popular: false },
  { ticker: 'TRAN', name: 'Transitions Europe', type: 'Diversifié',     yield: 5.67, price: 1050.0, change: 0,     aum: '1.5B€', popular: false },
  { ticker: 'OPEX', name: 'Opus Real Estate',   type: 'Bureaux + Logis', yield: 4.12, price: 420.0, change: 0,     aum: '0.6B€', popular: false },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  if (n >= 10) return n.toFixed(2)
  return n.toFixed(3)
}

function ChangeChip({ v }: { v: number }) {
  const pos = v > 0
  const col = v === 0 ? '#9ca3af' : pos ? '#34d399' : '#f87171'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: col, background: col + '15', borderRadius: 6, padding: '2px 7px', fontFamily: 'Geist Mono, monospace', whiteSpace: 'nowrap' }}>
      {v === 0 ? '—' : `${pos ? '+' : ''}${v.toFixed(2)}%`}
    </span>
  )
}

const TAB_LIST: { key: Category; label: string; emoji: string; count: number }[] = [
  { key: 'etf',     label: 'ETF',     emoji: '📊', count: ETF_DATABASE.length },
  { key: 'actions', label: 'Actions', emoji: '📈', count: ACTIONS.length },
  { key: 'crypto',  label: 'Crypto',  emoji: '₿',  count: CRYPTO.length },
  { key: 'scpi',    label: 'SCPI',    emoji: '🏢', count: SCPI.length },
]

const SORT_OPTIONS = {
  etf:     [{ key: 'name', label: 'Nom' }, { key: 'ter', label: 'TER' }, { key: 'aum', label: 'AUM' }],
  actions: [{ key: 'name', label: 'Nom' }, { key: 'change', label: 'Var. %' }, { key: 'mcap', label: 'Cap.' }],
  crypto:  [{ key: 'name', label: 'Nom' }, { key: 'change', label: 'Var. %' }, { key: 'cap', label: 'Cap.' }],
  scpi:    [{ key: 'name', label: 'Nom' }, { key: 'yield', label: 'Rendement' }, { key: 'aum', label: 'AUM' }],
}

export default function MarchePage() {
  const [tab, setTab] = useState<Category>('etf')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [onlyPopular, setOnlyPopular] = useState(false)

  const etfFiltered = useMemo(() => {
    let list = ETF_DATABASE
    if (query) list = list.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) || e.ticker.toLowerCase().includes(query.toLowerCase()) || e.isin.toLowerCase().includes(query.toLowerCase()) || e.benchmark.toLowerCase().includes(query.toLowerCase()))
    if (sortBy === 'ter') list = [...list].sort((a, b) => a.ter - b.ter)
    if (sortBy === 'aum') list = [...list].sort((a, b) => b.aum - a.aum)
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [query, sortBy])

  const actionsFiltered = useMemo(() => {
    let list = ACTIONS
    if (query) list = list.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.ticker.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(s => s.popular)
    if (sortBy === 'change') list = [...list].sort((a, b) => b.change - a.change)
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [query, sortBy, onlyPopular])

  const cryptoFiltered = useMemo(() => {
    let list = CRYPTO
    if (query) list = list.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.ticker.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(c => c.popular)
    if (sortBy === 'change') list = [...list].sort((a, b) => b.change - a.change)
    if (sortBy === 'cap') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [query, sortBy, onlyPopular])

  const scpiFiltered = useMemo(() => {
    let list = SCPI
    if (query) list = list.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.type.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(s => s.popular)
    if (sortBy === 'yield') list = [...list].sort((a, b) => b.yield - a.yield)
    if (sortBy === 'aum') list = [...list].sort((a, b) => b.aum.localeCompare(a.aum))
    return list
  }, [query, sortBy, onlyPopular])

  const sortOptions = SORT_OPTIONS[tab]

  // Stats strip
  const gainers = tab === 'actions' ? ACTIONS.filter(a => a.change > 1).length
    : tab === 'crypto' ? CRYPTO.filter(c => c.change > 1).length : 0
  const losers = tab === 'actions' ? ACTIONS.filter(a => a.change < -1).length
    : tab === 'crypto' ? CRYPTO.filter(c => c.change < -1).length : 0

  return (
    <div style={{ background: 'var(--content-bg)', minHeight: '100vh', padding: '28px 24px 56px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Explorer</p>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: '0 0 20px' }}>
          Marchés & Actifs
        </h1>

        {/* Big search bar */}
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-subtle)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'etf' ? 'Rechercher un ETF (nom, ticker, ISIN, indice)…'
              : tab === 'actions' ? 'Rechercher une action (nom, ticker)…'
              : tab === 'crypto' ? 'Rechercher une crypto (nom, ticker)…'
              : 'Rechercher une SCPI (nom, type)…'}
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1px solid var(--card-dark-border)', background: 'var(--card-dark)', fontSize: 14, color: 'var(--text-em)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(241,192,134,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--card-dark-border)')}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 16, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TAB_LIST.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setQuery(''); setSortBy('name') }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.15s', background: tab === t.key ? 'var(--modal-surface)' : 'transparent', color: tab === t.key ? 'var(--text-em)' : 'var(--text-muted-c)', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 14 }}>{t.emoji}</span>
            {t.label}
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.key ? '#f1c086' : 'var(--text-subtle)', background: tab === t.key ? 'rgba(241,192,134,0.1)' : 'var(--mini-card-bg)', borderRadius: 5, padding: '1px 5px' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 8, padding: '4px 8px' }}>
          <Filter style={{ width: 12, height: 12, color: 'var(--text-subtle)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Trier par</span>
          {sortOptions.map(o => (
            <button key={o.key} onClick={() => setSortBy(o.key)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: sortBy === o.key ? 700 : 400, background: sortBy === o.key ? 'rgba(241,192,134,0.12)' : 'transparent', color: sortBy === o.key ? '#f1c086' : 'var(--text-muted-c)', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Popular filter */}
        {(tab === 'actions' || tab === 'crypto' || tab === 'scpi') && (
          <button onClick={() => setOnlyPopular(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${onlyPopular ? 'rgba(241,192,134,0.4)' : 'var(--card-dark-border)'}`, background: onlyPopular ? 'rgba(241,192,134,0.08)' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: onlyPopular ? '#f1c086' : 'var(--text-subtle)', transition: 'all 0.15s' }}>
            <Star style={{ width: 12, height: 12 }} />
            Populaires
          </button>
        )}

        {/* Market stats */}
        {(tab === 'actions' || tab === 'crypto') && gainers + losers > 0 && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '3px 10px' }}>
              <TrendingUp style={{ width: 11, height: 11 }} /> {gainers} haussiers
            </span>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '3px 10px' }}>
              <TrendingDown style={{ width: 11, height: 11 }} /> {losers} baissiers
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}

      {/* ETF Tab */}
      {tab === 'etf' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 80px 80px 36px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--section-border)', background: 'var(--mini-card-bg)' }}>
            {['Nom / Ticker', 'Indice de réf.', 'TER', 'AUM', 'Réplication', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {etfFiltered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>Aucun ETF trouvé pour «&nbsp;{query}&nbsp;»</div>
          )}
          {etfFiltered.map((etf, i) => (
            <Link key={etf.isin} href={`/dashboard/marche/etf/${etf.ticker}`}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 80px 80px 36px', gap: 12, padding: '13px 20px', borderBottom: i < etfFiltered.length - 1 ? '1px solid var(--section-border)' : undefined, textDecoration: 'none', alignItems: 'center', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {/* Name + ticker */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(241,192,134,0.08)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 5, padding: '1px 7px' }}>{etf.ticker}</span>
                  {etf.distributing && <span style={{ fontSize: 9, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '1px 5px' }}>DIST</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etf.name}</p>
              </div>
              {/* Benchmark */}
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etf.benchmark}</span>
              {/* TER */}
              <span style={{ fontSize: 12, fontWeight: 700, color: etf.ter <= 0.001 ? '#34d399' : etf.ter <= 0.003 ? '#f1c086' : '#f87171', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{(etf.ter * 100).toFixed(2)}%</span>
              {/* AUM */}
              <span style={{ fontSize: 11, color: 'var(--text-muted-c)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{etf.aum >= 1000 ? `${(etf.aum / 1000).toFixed(1)}B€` : `${etf.aum}M€`}</span>
              {/* Replication */}
              <span style={{ fontSize: 10, fontWeight: 600, color: etf.replication === 'physical' ? '#38bdf8' : '#a78bfa', background: etf.replication === 'physical' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)', borderRadius: 5, padding: '2px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>{etf.replication === 'physical' ? 'Physique' : 'Synthétique'}</span>
              {/* Arrow */}
              <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}

      {/* Actions Tab */}
      {tab === 'actions' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 90px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--section-border)', background: 'var(--mini-card-bg)' }}>
            {['Société', 'Secteur', 'Prix', 'Var. 1j', 'P/E'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {actionsFiltered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13 }}>Aucune action trouvée</div>
          )}
          {actionsFiltered.map((stock, i) => (
            <div key={stock.ticker}
              style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 90px', gap: 12, padding: '13px 20px', borderBottom: i < actionsFiltered.length - 1 ? '1px solid var(--section-border)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '1px 7px' }}>{stock.ticker}</span>
                  {stock.popular && <Star style={{ width: 11, height: 11, color: '#f1c086' }} />}
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'var(--mini-card-bg)', border: '1px solid var(--card-dark-border)', borderRadius: 4, padding: '1px 5px' }}>{stock.market}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</p>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.sector}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{fmtPrice(stock.price)}</span>
              <div style={{ textAlign: 'right' }}><ChangeChip v={stock.change} /></div>
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{stock.pe}x</span>
            </div>
          ))}
        </div>
      )}

      {/* Crypto Tab */}
      {tab === 'crypto' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--section-border)', background: 'var(--mini-card-bg)' }}>
            {['Actif', 'Cap. de marché', 'Prix', 'Var. 24h'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {cryptoFiltered.map((c, i) => (
            <div key={c.ticker}
              style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px', gap: 12, padding: '13px 20px', borderBottom: i < cryptoFiltered.length - 1 ? '1px solid var(--section-border)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fb923c' }}>{c.ticker.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, fontFamily: 'Geist Mono, monospace' }}>{c.ticker}</p>
                  </div>
                  {c.popular && <Star style={{ width: 11, height: 11, color: '#f1c086' }} />}
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)', fontFamily: 'Geist Mono, monospace' }}>{c.cap}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{fmtPrice(c.price)}&nbsp;$</span>
              <div style={{ textAlign: 'right' }}><ChangeChip v={c.change} /></div>
            </div>
          ))}
        </div>
      )}

      {/* SCPI Tab */}
      {tab === 'scpi' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 90px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--section-border)', background: 'var(--mini-card-bg)' }}>
            {['SCPI', 'Stratégie', 'Prix part', 'Rend. dist.', 'AUM'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {scpiFiltered.map((s, i) => (
            <div key={s.ticker}
              style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 90px', gap: 12, padding: '13px 20px', borderBottom: i < scpiFiltered.length - 1 ? '1px solid var(--section-border)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 5, padding: '1px 7px' }}>{s.ticker}</span>
                  {s.popular && <Star style={{ width: 11, height: 11, color: '#f1c086' }} />}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>{s.name}</p>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{s.type}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.price.toFixed(0)}&nbsp;€</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.yield.toFixed(2)}%</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.aum}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p style={{ marginTop: 20, fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
        Données indicatives à titre éducatif uniquement. Les prix et performances affichés peuvent ne pas refléter les cours en temps réel.
        Pas de conseil en investissement.
      </p>
    </div>
  )
}
