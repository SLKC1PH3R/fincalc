'use client'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Star, Filter, RefreshCw, Wifi, ExternalLink } from 'lucide-react'
import { ETF_DATABASE } from '@/lib/etf-database'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'etf' | 'actions' | 'crypto' | 'scpi'

interface LivePrice { price: number; changePercent: number }

// ── ETF → Yahoo Finance symbol map ────────────────────────────────────────────
const ETF_YAHOO: Record<string, string> = {
  VWCE: 'VWCE.DE', SXR8: 'SXR8.DE', IWDA: 'IWDA.AS', PE500: 'PE500.PA',
  CW8: 'CW8.PA', EQQQ: 'EQQQ.DE', SXRV: 'SXRV.DE', IUSA: 'IUSA.AS',
  EIMI: 'EIMI.AS', VWRL: 'VWRL.AS', CSPX: 'CSPX.AS', VUAG: 'VUAG.AS',
  VUSA: 'VUSA.AS', WPEA: 'WPEA.PA', EWLD: 'EWLD.PA', XDWD: 'XDWD.DE',
  PAEEM: 'PAEEM.PA', PAASI: 'PAASI.PA', SSAC: 'SSAC.AS', ANX: 'ANX.PA',
  INRG: 'INRG.AS', EXS1: 'EXS1.DE', PHAU: 'PHAU.AS', GOLD: 'GOLD.PA',
  SMEA: 'SMEA.AS', AGGH: 'AGGH.AS', IEAG: 'IEAG.AS', IUSN: 'IUSN.AS',
  IWQU: 'IWQU.AS', SUSW: 'SUSW.AS', VHYL: 'VHYL.AS', TDIV: 'TDIV.AS',
  CS5E: 'CS5E.AS', IDTL: 'IDTL.AS', IEQU: 'IEQU.AS',
}

// ── Static data — Actions ──────────────────────────────────────────────────────
interface Stock {
  ticker: string; yahooTicker: string; name: string; market: string
  sector: string; price: number; change: number; mcap: string; pe: number; popular: boolean
}

const ACTIONS: Stock[] = [
  // US – Mega-cap
  { ticker: 'AAPL',   yahooTicker: 'AAPL',    name: 'Apple Inc.',          market: 'NASDAQ', sector: 'Technologie',      price: 224.37, change:  1.24, mcap: '3 310B$', pe: 35.2, popular: true  },
  { ticker: 'MSFT',   yahooTicker: 'MSFT',    name: 'Microsoft Corp.',      market: 'NASDAQ', sector: 'Technologie',      price: 415.29, change:  0.87, mcap: '3 080B$', pe: 38.1, popular: true  },
  { ticker: 'NVDA',   yahooTicker: 'NVDA',    name: 'NVIDIA Corp.',         market: 'NASDAQ', sector: 'Semi-conducteurs', price: 875.60, change:  3.21, mcap: '2 150B$', pe: 67.4, popular: true  },
  { ticker: 'AMZN',   yahooTicker: 'AMZN',    name: 'Amazon.com Inc.',      market: 'NASDAQ', sector: 'Commerce',         price: 194.50, change: -0.43, mcap: '2 010B$', pe: 44.2, popular: true  },
  { ticker: 'META',   yahooTicker: 'META',    name: 'Meta Platforms',       market: 'NASDAQ', sector: 'Réseaux sociaux', price: 536.18, change:  2.11, mcap: '1 360B$', pe: 28.7, popular: true  },
  { ticker: 'GOOGL',  yahooTicker: 'GOOGL',   name: 'Alphabet Inc.',        market: 'NASDAQ', sector: 'Technologie',      price: 172.45, change: -1.03, mcap: '2 140B$', pe: 24.1, popular: false },
  { ticker: 'TSLA',   yahooTicker: 'TSLA',    name: 'Tesla Inc.',           market: 'NASDAQ', sector: 'Auto & Énergie',  price: 248.30, change: -2.14, mcap: '790B$',   pe: 68.3, popular: true  },
  { ticker: 'ASML',   yahooTicker: 'ASML',    name: 'ASML Holding',         market: 'NASDAQ', sector: 'Semi-conducteurs', price: 687.44, change:  1.87, mcap: '270B€',   pe: 41.8, popular: true  },
  // US – Large cap
  { ticker: 'JPM',    yahooTicker: 'JPM',     name: 'JPMorgan Chase',       market: 'NYSE',   sector: 'Banque',           price: 215.80, change:  0.42, mcap: '620B$',   pe: 13.2, popular: false },
  { ticker: 'V',      yahooTicker: 'V',       name: 'Visa Inc.',            market: 'NYSE',   sector: 'Fintech',          price: 278.50, change:  0.88, mcap: '570B$',   pe: 30.1, popular: false },
  { ticker: 'JNJ',    yahooTicker: 'JNJ',     name: 'Johnson & Johnson',    market: 'NYSE',   sector: 'Santé',            price: 162.40, change: -0.21, mcap: '390B$',   pe: 16.8, popular: false },
  { ticker: 'WMT',    yahooTicker: 'WMT',     name: 'Walmart Inc.',         market: 'NYSE',   sector: 'Distribution',     price: 68.20,  change:  0.55, mcap: '547B$',   pe: 32.4, popular: false },
  { ticker: 'LLY',    yahooTicker: 'LLY',     name: 'Eli Lilly & Co.',      market: 'NYSE',   sector: 'Pharma',           price: 803.50, change:  1.92, mcap: '762B$',   pe: 89.3, popular: true  },
  { ticker: 'AVGO',   yahooTicker: 'AVGO',    name: 'Broadcom Inc.',        market: 'NASDAQ', sector: 'Semi-conducteurs', price: 168.70, change:  2.05, mcap: '780B$',   pe: 38.7, popular: false },
  { ticker: 'NFLX',   yahooTicker: 'NFLX',   name: 'Netflix Inc.',         market: 'NASDAQ', sector: 'Streaming',        price: 692.40, change:  0.73, mcap: '302B$',   pe: 50.1, popular: false },
  { ticker: 'AMD',    yahooTicker: 'AMD',     name: 'Advanced Micro Devices', market: 'NASDAQ', sector: 'Semi-conducteurs', price: 174.30, change: 1.44, mcap: '282B$',  pe: 47.6, popular: false },
  { ticker: 'XOM',    yahooTicker: 'XOM',     name: 'Exxon Mobil',          market: 'NYSE',   sector: 'Énergie',          price: 113.40, change: -0.55, mcap: '452B$',   pe: 14.3, popular: false },
  { ticker: 'SAP',    yahooTicker: 'SAP',     name: 'SAP SE',               market: 'NYSE',   sector: 'Logiciel',         price: 232.10, change:  0.45, mcap: '284B€',   pe: 49.3, popular: false },
  // France – CAC 40
  { ticker: 'MC',     yahooTicker: 'MC.PA',   name: 'LVMH',                 market: 'Paris',  sector: 'Luxe',             price: 572.40, change:  0.62, mcap: '285B€',   pe: 22.4, popular: true  },
  { ticker: 'TTE',    yahooTicker: 'TTE.PA',  name: 'TotalEnergies',        market: 'Paris',  sector: 'Énergie',          price: 58.44,  change: -0.38, mcap: '131B€',   pe: 8.7,  popular: false },
  { ticker: 'OR',     yahooTicker: 'OR.PA',   name: "L'Oréal",             market: 'Paris',  sector: 'Cosmétiques',      price: 356.85, change:  1.05, mcap: '188B€',   pe: 31.2, popular: true  },
  { ticker: 'SAN',    yahooTicker: 'SAN.PA',  name: 'Sanofi',              market: 'Paris',  sector: 'Santé',            price: 98.62,  change:  0.21, mcap: '125B€',   pe: 18.3, popular: false },
  { ticker: 'AI',     yahooTicker: 'AI.PA',   name: 'Air Liquide',         market: 'Paris',  sector: 'Industrie',        price: 148.90, change:  0.74, mcap: '79B€',    pe: 25.6, popular: false },
  { ticker: 'BNP',    yahooTicker: 'BNP.PA',  name: 'BNP Paribas',        market: 'Paris',  sector: 'Banque',           price: 68.50,  change: -0.53, mcap: '82B€',    pe: 7.1,  popular: false },
  { ticker: 'ACA',    yahooTicker: 'ACA.PA',  name: 'Crédit Agricole',    market: 'Paris',  sector: 'Banque',           price: 14.82,  change: -0.27, mcap: '38B€',    pe: 6.8,  popular: false },
  { ticker: 'RMS',    yahooTicker: 'RMS.PA',  name: 'Hermès International', market: 'Paris', sector: 'Luxe',            price: 2430.0, change:  0.38, mcap: '206B€',   pe: 50.2, popular: true  },
  { ticker: 'SU',     yahooTicker: 'SU.PA',   name: 'Schneider Electric',  market: 'Paris',  sector: 'Industrie',        price: 236.80, change:  1.12, mcap: '137B€',   pe: 29.7, popular: false },
  { ticker: 'CS',     yahooTicker: 'CS.PA',   name: 'AXA',                market: 'Paris',  sector: 'Assurance',        price: 34.82,  change:  0.44, mcap: '65B€',    pe: 10.1, popular: false },
  { ticker: 'CAP',    yahooTicker: 'CAP.PA',  name: 'Capgemini',           market: 'Paris',  sector: 'IT & Conseil',     price: 165.45, change: -0.87, mcap: '54B€',    pe: 17.3, popular: false },
  { ticker: 'DSY',    yahooTicker: 'DSY.PA',  name: 'Dassault Systèmes',  market: 'Paris',  sector: 'Logiciel',         price: 28.40,  change:  0.25, mcap: '37B€',    pe: 42.1, popular: false },
  { ticker: 'KER',    yahooTicker: 'KER.PA',  name: 'Kering',              market: 'Paris',  sector: 'Luxe',             price: 235.80, change: -1.42, mcap: '29B€',    pe: 14.8, popular: false },
  { ticker: 'DG',     yahooTicker: 'DG.PA',   name: 'Vinci',               market: 'Paris',  sector: 'Construction',     price: 108.20, change:  0.18, mcap: '76B€',    pe: 14.5, popular: false },
  { ticker: 'ORA',    yahooTicker: 'ORA.PA',  name: 'Orange',              market: 'Paris',  sector: 'Télécom',          price: 11.44,  change: -0.09, mcap: '30B€',    pe: 11.2, popular: false },
]

// ── Static data — Crypto ───────────────────────────────────────────────────────
interface Crypto {
  ticker: string; yahooTicker: string; name: string
  price: number; change: number; cap: string; vol24h: string; popular: boolean
}

const CRYPTO: Crypto[] = [
  { ticker: 'BTC',   yahooTicker: 'BTC-USD',  name: 'Bitcoin',        price: 83420,  change:  2.14, cap: '1 647B$', vol24h: '28.4B$', popular: true  },
  { ticker: 'ETH',   yahooTicker: 'ETH-USD',  name: 'Ethereum',       price: 3180,   change: -1.22, cap: '383B$',   vol24h: '12.1B$', popular: true  },
  { ticker: 'SOL',   yahooTicker: 'SOL-USD',  name: 'Solana',         price: 147.2,  change:  4.87, cap: '68.2B$',  vol24h: '3.8B$',  popular: true  },
  { ticker: 'BNB',   yahooTicker: 'BNB-USD',  name: 'BNB',            price: 598.4,  change:  0.63, cap: '86.1B$',  vol24h: '1.9B$',  popular: false },
  { ticker: 'XRP',   yahooTicker: 'XRP-USD',  name: 'XRP',            price: 0.548,  change: -2.45, cap: '31.4B$',  vol24h: '1.4B$',  popular: false },
  { ticker: 'AVAX',  yahooTicker: 'AVAX-USD', name: 'Avalanche',      price: 38.74,  change:  3.21, cap: '15.8B$',  vol24h: '0.8B$',  popular: false },
  { ticker: 'DOT',   yahooTicker: 'DOT-USD',  name: 'Polkadot',       price: 7.82,   change:  1.44, cap: '11.2B$',  vol24h: '0.4B$',  popular: false },
  { ticker: 'MATIC', yahooTicker: 'MATIC-USD',name: 'Polygon',        price: 0.884,  change: -0.87, cap: '8.6B$',   vol24h: '0.3B$',  popular: false },
  { ticker: 'LINK',  yahooTicker: 'LINK-USD', name: 'Chainlink',      price: 15.23,  change:  2.76, cap: '9.1B$',   vol24h: '0.5B$',  popular: false },
  { ticker: 'ADA',   yahooTicker: 'ADA-USD',  name: 'Cardano',        price: 0.462,  change: -1.18, cap: '16.3B$',  vol24h: '0.6B$',  popular: false },
  { ticker: 'DOGE',  yahooTicker: 'DOGE-USD', name: 'Dogecoin',       price: 0.162,  change:  1.05, cap: '23.7B$',  vol24h: '1.2B$',  popular: true  },
  { ticker: 'UNI',   yahooTicker: 'UNI-USD',  name: 'Uniswap',        price: 8.46,   change: -3.12, cap: '6.3B$',   vol24h: '0.2B$',  popular: false },
]

// ── Static data — SCPI ─────────────────────────────────────────────────────────
const SCPI = [
  { ticker: 'PRIM', name: 'Primopierre',        type: 'Bureaux',         yield: 4.31, price: 202.0,  change: 0,     aum: '3.2B€', popular: true  },
  { ticker: 'CAPI', name: 'Corum Origin',        type: 'Diversifié',      yield: 6.06, price: 1135.0, change: 0,     aum: '4.5B€', popular: true  },
  { ticker: 'IMMO', name: 'Immorente',           type: 'Commerce',        yield: 4.73, price: 182.0,  change: -0.55, aum: '5.1B€', popular: true  },
  { ticker: 'EURS', name: 'Eurovalys',           type: 'Diversifié EU',   yield: 4.50, price: 1000.0, change: 0,     aum: '1.2B€', popular: false },
  { ticker: 'PIED', name: 'Pierval Santé',       type: 'Santé',           yield: 5.02, price: 1053.0, change: 0.48,  aum: '2.8B€', popular: true  },
  { ticker: 'MACI', name: 'Maci Invest',         type: 'Bureaux',         yield: 3.87, price: 215.0,  change: -1.39, aum: '0.8B€', popular: false },
  { ticker: 'TRAN', name: 'Transitions Europe',  type: 'Diversifié',      yield: 5.67, price: 1050.0, change: 0,     aum: '1.5B€', popular: false },
  { ticker: 'OPEX', name: 'Opus Real Estate',    type: 'Bureaux + Logis', yield: 4.12, price: 420.0,  change: 0,     aum: '0.6B€', popular: false },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  if (n >= 1000) return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  if (n >= 10) return n.toFixed(2)
  if (n >= 1) return n.toFixed(3)
  return n.toFixed(4)
}

function fmtUpdated(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function ChangeChip({ v }: { v: number | null | undefined }) {
  if (v == null) return <span style={{ fontSize: 11, color: 'var(--p-text-faint)', fontFamily: 'Geist Mono, monospace' }}>—</span>
  const pos = v > 0
  const col = v === 0 ? '#9ca3af' : pos ? '#34d399' : '#f87171'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: col, background: col + '15', borderRadius: 6, padding: '2px 7px', fontFamily: 'Geist Mono, monospace', whiteSpace: 'nowrap' }}>
      {v === 0 ? '—' : `${pos ? '+' : ''}${v.toFixed(2)}%`}
    </span>
  )
}

function LiveDot({ live }: { live: boolean }) {
  if (!live) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '2px 7px' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s infinite' }} />
      Live
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

// ── TradingView symbol helpers ─────────────────────────────────────────────────
const NASDAQ_STOCKS = new Set(['AAPL','MSFT','NVDA','AMZN','META','GOOGL','TSLA','ASML','AVGO','NFLX','AMD','ORCL','INTC','QCOM','GOOG'])

function toTVSymbol(yahooTicker: string): string {
  if (yahooTicker.endsWith('-USD')) {
    const base = yahooTicker.replace('-USD', '')
    // Special cases
    if (base === 'MATIC') return 'BINANCE:MATICUSDT'
    return `BINANCE:${base}USDT`
  }
  if (yahooTicker.endsWith('.PA')) return `EURONEXT:${yahooTicker.slice(0, -3)}`
  if (yahooTicker.endsWith('.DE')) return `XETRA:${yahooTicker.slice(0, -3)}`
  if (yahooTicker.endsWith('.AS')) return `EURONEXT:${yahooTicker.slice(0, -3)}`
  if (NASDAQ_STOCKS.has(yahooTicker)) return `NASDAQ:${yahooTicker}`
  return `NYSE:${yahooTicker}`
}

// ── TradingView mini chart widget ──────────────────────────────────────────────
function TradingViewChart({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = ''

    const container = document.createElement('div')
    container.className = 'tradingview-widget-container'

    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    container.appendChild(inner)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbol,
      width: '100%',
      height: 220,
      locale: 'fr_FR',
      dateRange: '1D',
      colorTheme: 'light',
      isTransparent: true,
      autosize: true,
      largeChartUrl: `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`,
    })
    container.appendChild(script)
    el.appendChild(container)

    return () => { el.innerHTML = '' }
  }, [symbol])

  return <div ref={ref} style={{ width: '100%', height: 220 }} />
}

// ── Inline chart panel ─────────────────────────────────────────────────────────
function ChartPanel({ symbol, detailHref }: { symbol: string; detailHref?: string }) {
  return (
    <div style={{
      borderBottom: '1px solid var(--p-line)',
      background: 'var(--p-card-2)',
      padding: '12px 20px 16px',
      animation: 'expandIn 0.18s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Graphique temps réel · {symbol}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {detailHref && (
            <Link href={detailHref} onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--p-gold)', textDecoration: 'none', fontWeight: 600 }}>
              <ExternalLink style={{ width: 11, height: 11 }} />
              Fiche complète
            </Link>
          )}
          <a href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
            target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--p-text-faint)', textDecoration: 'none' }}>
            <ExternalLink style={{ width: 11, height: 11 }} />
            TradingView
          </a>
        </div>
      </div>
      <TradingViewChart symbol={symbol} />
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function MarchePage() {
  const [tab, setTab] = useState<Category>('etf')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [onlyPopular, setOnlyPopular] = useState(false)
  const [livePrices, setLivePrices] = useState<Map<string, LivePrice>>(new Map())
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const toggleExpand = (key: string) => setExpandedKey(prev => prev === key ? null : key)

  // Fetch live prices for current tab
  const fetchPrices = useCallback(async (currentTab: Category) => {
    let symbols: string[] = []

    if (currentTab === 'actions') {
      symbols = ACTIONS.map(s => s.yahooTicker)
    } else if (currentTab === 'crypto') {
      symbols = CRYPTO.map(c => c.yahooTicker)
    } else if (currentTab === 'etf') {
      symbols = ETF_DATABASE
        .filter(e => ETF_YAHOO[e.ticker])
        .map(e => ETF_YAHOO[e.ticker])
        .slice(0, 40) // stay within Yahoo limits
    } else {
      return // SCPI: no real-time source
    }

    if (symbols.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/market/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      })
      if (!res.ok) return
      const json = await res.json() as { data: Array<{ symbol: string; price: number | null; changePercent: number | null }>; updatedAt: number }
      const map = new Map<string, LivePrice>()
      for (const q of json.data) {
        if (q.price != null && q.changePercent != null) {
          map.set(q.symbol, { price: q.price, changePercent: q.changePercent })
        }
      }
      setLivePrices(map)
      setUpdatedAt(json.updatedAt ?? Date.now())
    } catch {
      // fail silently — static fallback remains
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount and tab change; auto-refresh every 5 min
  useEffect(() => {
    fetchPrices(tab)
    if (refreshTimer.current) clearInterval(refreshTimer.current)
    refreshTimer.current = setInterval(() => fetchPrices(tab), 5 * 60 * 1000)
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current) }
  }, [tab, fetchPrices])

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const etfFiltered = useMemo(() => {
    let list = ETF_DATABASE
    if (query) list = list.filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.ticker.toLowerCase().includes(query.toLowerCase()) ||
      e.isin.toLowerCase().includes(query.toLowerCase()) ||
      e.benchmark.toLowerCase().includes(query.toLowerCase()))
    if (sortBy === 'ter') list = [...list].sort((a, b) => a.ter - b.ter)
    if (sortBy === 'aum') list = [...list].sort((a, b) => b.aum - a.aum)
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [query, sortBy])

  const actionsFiltered = useMemo(() => {
    let list = ACTIONS
    if (query) list = list.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.ticker.toLowerCase().includes(query.toLowerCase()) ||
      s.sector.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(s => s.popular)
    const getLiveChange = (s: Stock) => livePrices.get(s.yahooTicker)?.changePercent ?? s.change
    if (sortBy === 'change') list = [...list].sort((a, b) => getLiveChange(b) - getLiveChange(a))
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [query, sortBy, onlyPopular, livePrices])

  const cryptoFiltered = useMemo(() => {
    let list = CRYPTO
    if (query) list = list.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.ticker.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(c => c.popular)
    const getLiveChange = (c: Crypto) => livePrices.get(c.yahooTicker)?.changePercent ?? c.change
    if (sortBy === 'change') list = [...list].sort((a, b) => getLiveChange(b) - getLiveChange(a))
    if (sortBy === 'cap') list = [...list].sort((a, b) => {
      const pa = livePrices.get(a.yahooTicker)?.price ?? a.price
      const pb = livePrices.get(b.yahooTicker)?.price ?? b.price
      return pb - pa
    })
    return list
  }, [query, sortBy, onlyPopular, livePrices])

  const scpiFiltered = useMemo(() => {
    let list = SCPI
    if (query) list = list.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.type.toLowerCase().includes(query.toLowerCase()))
    if (onlyPopular) list = list.filter(s => s.popular)
    if (sortBy === 'yield') list = [...list].sort((a, b) => b.yield - a.yield)
    if (sortBy === 'aum') list = [...list].sort((a, b) => b.aum.localeCompare(a.aum))
    return list
  }, [query, sortBy, onlyPopular])

  const sortOptions = SORT_OPTIONS[tab]
  const hasLive = livePrices.size > 0 && tab !== 'scpi'

  // Stats strip
  const gainers = tab === 'actions'
    ? ACTIONS.filter(a => (livePrices.get(a.yahooTicker)?.changePercent ?? a.change) > 1).length
    : tab === 'crypto' ? CRYPTO.filter(c => (livePrices.get(c.yahooTicker)?.changePercent ?? c.change) > 1).length : 0
  const losers = tab === 'actions'
    ? ACTIONS.filter(a => (livePrices.get(a.yahooTicker)?.changePercent ?? a.change) < -1).length
    : tab === 'crypto' ? CRYPTO.filter(c => (livePrices.get(c.yahooTicker)?.changePercent ?? c.change) < -1).length : 0

  return (
    <div style={{ background: 'var(--p-bg)', minHeight: '100vh', padding: '28px 24px 56px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--p-text-faint)', marginBottom: 4 }}>Explorer</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 700, color: 'var(--p-text)', letterSpacing: '-0.04em', margin: 0 }}>
            Marchés & Actifs
          </h1>
          {/* Live status + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hasLive && (
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                MAJ {fmtUpdated(updatedAt)}
              </span>
            )}
            <LiveDot live={hasLive} />
            {tab !== 'scpi' && (
              <button
                onClick={() => fetchPrices(tab)}
                disabled={loading}
                title="Rafraîchir les cours"
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--p-line)', background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer', color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--p-row-hover)'; e.currentTarget.style.color = 'var(--p-text-em)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-dim)' }}
              >
                <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
          </div>
        </div>

        {/* Big search bar */}
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--p-text-faint)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'etf' ? 'Rechercher un ETF (nom, ticker, ISIN, indice)…'
              : tab === 'actions' ? 'Rechercher une action (nom, ticker, secteur)…'
              : tab === 'crypto' ? 'Rechercher une crypto (nom, ticker)…'
              : 'Rechercher une SCPI (nom, type)…'}
            style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 12, border: '1px solid var(--p-line)', background: 'var(--p-card)', fontSize: 14, color: 'var(--p-text-em)', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(176,120,32,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'var(--p-line)')}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TAB_LIST.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setQuery(''); setSortBy('name'); setLivePrices(new Map()) }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, transition: 'all 0.15s', background: tab === t.key ? 'var(--modal-surface)' : 'transparent', color: tab === t.key ? 'var(--p-text-em)' : 'var(--p-text-dim)', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 14 }}>{t.emoji}</span>
            {t.label}
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === t.key ? '#B07820' : 'var(--p-text-faint)', background: tab === t.key ? 'rgba(176,120,32,0.1)' : 'var(--p-card-2)', borderRadius: 5, padding: '1px 5px' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 8, padding: '4px 8px' }}>
          <Filter style={{ width: 12, height: 12, color: 'var(--p-text-faint)' }} />
          <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Trier par</span>
          {sortOptions.map(o => (
            <button key={o.key} onClick={() => setSortBy(o.key)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: sortBy === o.key ? 700 : 400, background: sortBy === o.key ? 'rgba(176,120,32,0.12)' : 'transparent', color: sortBy === o.key ? '#B07820' : 'var(--p-text-dim)', transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>

        {(tab === 'actions' || tab === 'crypto' || tab === 'scpi') && (
          <button onClick={() => setOnlyPopular(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: `1px solid ${onlyPopular ? 'rgba(176,120,32,0.4)' : 'var(--p-line)'}`, background: onlyPopular ? 'rgba(176,120,32,0.08)' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: onlyPopular ? '#B07820' : 'var(--p-text-faint)', transition: 'all 0.15s' }}>
            <Star style={{ width: 12, height: 12 }} />
            Populaires
          </button>
        )}

        {!hasLive && tab !== 'scpi' && !loading && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--p-text-faint)', marginLeft: 'auto' }}>
            <Wifi style={{ width: 11, height: 11, opacity: 0.4 }} />
            Données statiques
          </span>
        )}

        {(tab === 'actions' || tab === 'crypto') && gainers + losers > 0 && (
          <div style={{ display: 'flex', gap: 6, marginLeft: hasLive ? 'auto' : 0 }}>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '3px 10px' }}>
              <TrendingUp style={{ width: 11, height: 11 }} /> {gainers} haussiers
            </span>
            <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '3px 10px' }}>
              <TrendingDown style={{ width: 11, height: 11 }} /> {losers} baissiers
            </span>
          </div>
        )}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && livePrices.size === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12, color: 'var(--p-text-faint)' }}>
          <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
          Chargement des cours en temps réel…
        </div>
      )}

      {/* ── ETF Tab ── */}
      {tab === 'etf' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 90px 80px 80px 36px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
            {['Nom / Ticker', 'Indice de réf.', 'Cours', 'TER', 'AUM', 'Réplication', ''].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {etfFiltered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>Aucun ETF trouvé pour «&nbsp;{query}&nbsp;»</div>
          )}
          {etfFiltered.map((etf, i) => {
            const yahoo = ETF_YAHOO[etf.ticker]
            const live = yahoo ? livePrices.get(yahoo) : undefined
            const isOpen = expandedKey === etf.ticker
            const tvSym = yahoo ? toTVSymbol(yahoo) : null
            return (
              <div key={etf.isin}>
                <div
                  onClick={() => toggleExpand(etf.ticker)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 90px 80px 80px 36px', gap: 12, padding: '13px 20px', borderBottom: !isOpen && i < etfFiltered.length - 1 ? '1px solid var(--p-line)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'pointer', background: isOpen ? 'var(--p-row-hover)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(176,120,32,0.08)', border: '1px solid rgba(176,120,32,0.15)', borderRadius: 5, padding: '1px 7px' }}>{etf.ticker}</span>
                      {etf.distributing && <span style={{ fontSize: 9, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '1px 5px' }}>DIST</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etf.name}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etf.benchmark}</span>
                  <div style={{ textAlign: 'right' }}>
                    {live ? (
                      <>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', margin: 0, fontFamily: 'Geist Mono, monospace' }}>{fmtPrice(live.price)}</p>
                        <ChangeChip v={live.changePercent} />
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>—</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: etf.ter <= 0.001 ? '#34d399' : etf.ter <= 0.003 ? '#B07820' : '#f87171', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{(etf.ter * 100).toFixed(2)}%</span>
                  <span style={{ fontSize: 11, color: 'var(--p-text-dim)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{etf.aum >= 1000 ? `${(etf.aum / 1000).toFixed(1)}B€` : `${etf.aum}M€`}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: etf.replication === 'physical' ? '#38bdf8' : '#a78bfa', background: etf.replication === 'physical' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)', borderRadius: 5, padding: '2px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>{etf.replication === 'physical' ? 'Physique' : 'Synthétique'}</span>
                  {isOpen
                    ? <ChevronDown style={{ width: 14, height: 14, color: 'var(--p-gold)', flexShrink: 0 }} />
                    : <ChevronRight style={{ width: 14, height: 14, color: 'var(--p-text-faint)', flexShrink: 0 }} />}
                </div>
                {isOpen && tvSym && (
                  <ChartPanel symbol={tvSym} detailHref={`/dashboard/marche/etf/${etf.ticker}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Actions Tab ── */}
      {tab === 'actions' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 80px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
            {['Société', 'Secteur', 'Prix', 'Var. 1j', 'P/E'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {actionsFiltered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>Aucune action trouvée</div>
          )}
          {actionsFiltered.map((stock, i) => {
            const live = livePrices.get(stock.yahooTicker)
            const price = live?.price ?? stock.price
            const change = live?.changePercent ?? stock.change
            const isOpen = expandedKey === stock.ticker
            return (
              <div key={stock.ticker}>
                <div
                  onClick={() => toggleExpand(stock.ticker)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 80px 28px', gap: 12, padding: '13px 20px', borderBottom: !isOpen && i < actionsFiltered.length - 1 ? '1px solid var(--p-line)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'pointer', background: isOpen ? 'var(--p-row-hover)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '1px 7px' }}>{stock.ticker}</span>
                      {stock.popular && <Star style={{ width: 11, height: 11, color: '#B07820' }} />}
                      <span style={{ fontSize: 10, color: 'var(--p-text-faint)', background: 'var(--p-card-2)', border: '1px solid var(--p-line)', borderRadius: 4, padding: '1px 5px' }}>{stock.market}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.name}</p>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stock.sector}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: live ? (change > 0 ? '#34d399' : change < 0 ? '#f87171' : 'var(--p-text-em)') : 'var(--p-text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{fmtPrice(price)}</span>
                  <div style={{ textAlign: 'right' }}><ChangeChip v={change} /></div>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{stock.pe}x</span>
                  {isOpen
                    ? <ChevronDown style={{ width: 13, height: 13, color: 'var(--p-gold)', flexShrink: 0 }} />
                    : <ChevronRight style={{ width: 13, height: 13, color: 'var(--p-text-faint)', flexShrink: 0 }} />}
                </div>
                {isOpen && (
                  <ChartPanel symbol={toTVSymbol(stock.yahooTicker)} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Crypto Tab ── */}
      {tab === 'crypto' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
            {['Actif', 'Cap. de marché', 'Prix', 'Var. 24h'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {cryptoFiltered.map((c, i) => {
            const live = livePrices.get(c.yahooTicker)
            const price = live?.price ?? c.price
            const change = live?.changePercent ?? c.change
            const isOpen = expandedKey === c.ticker
            return (
              <div key={c.ticker}>
                <div
                  onClick={() => toggleExpand(c.ticker)}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 28px', gap: 12, padding: '13px 20px', borderBottom: !isOpen && i < cryptoFiltered.length - 1 ? '1px solid var(--p-line)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'pointer', background: isOpen ? 'var(--p-row-hover)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fb923c' }}>{c.ticker.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'Geist Mono, monospace' }}>{c.ticker}</p>
                    </div>
                    {c.popular && <Star style={{ width: 11, height: 11, color: '#B07820' }} />}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--p-text-dim)', fontFamily: 'Geist Mono, monospace' }}>{c.cap}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: live ? (change > 0 ? '#34d399' : change < 0 ? '#f87171' : 'var(--p-text-em)') : 'var(--p-text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{fmtPrice(price)}&nbsp;$</span>
                  <div style={{ textAlign: 'right' }}><ChangeChip v={change} /></div>
                  {isOpen
                    ? <ChevronDown style={{ width: 13, height: 13, color: 'var(--p-gold)', flexShrink: 0 }} />
                    : <ChevronRight style={{ width: 13, height: 13, color: 'var(--p-text-faint)', flexShrink: 0 }} />}
                </div>
                {isOpen && (
                  <ChartPanel symbol={toTVSymbol(c.yahooTicker)} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── SCPI Tab ── */}
      {tab === 'scpi' && (
        <div className="na-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 90px', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
            {['SCPI', 'Stratégie', 'Prix part', 'Rend. dist.', 'AUM'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>
          {scpiFiltered.map((s, i) => (
            <div key={s.ticker}
              style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 90px 90px', gap: 12, padding: '13px 20px', borderBottom: i < scpiFiltered.length - 1 ? '1px solid var(--p-line)' : undefined, alignItems: 'center', transition: 'background 0.12s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 5, padding: '1px 7px' }}>{s.ticker}</span>
                  {s.popular && <Star style={{ width: 11, height: 11, color: '#B07820' }} />}
                </div>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: 0 }}>{s.name}</p>
              </div>
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{s.type}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.price.toFixed(0)}&nbsp;€</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.yield.toFixed(2)}%</span>
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)', textAlign: 'right', fontFamily: 'Geist Mono, monospace' }}>{s.aum}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <p style={{ marginTop: 20, fontSize: 11, color: 'var(--p-text-faint)', lineHeight: 1.5 }}>
        Données indicatives à titre éducatif uniquement. Les cours en temps réel proviennent de Yahoo Finance et peuvent présenter un délai de 15 minutes.
        Pas de conseil en investissement.
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
