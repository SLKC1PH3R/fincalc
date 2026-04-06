'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, Percent, ArrowUpRight,
  Search, Clock, BarChart3, Coins, Users, ShieldCheck, CreditCard, History,
  Banknote, TrendingDown, LineChart, MapPin,
} from 'lucide-react'

interface Simulation {
  id: string; type: string; name: string; createdAt: string
  inputs: Record<string, unknown>
}

const CATEGORIES = [
  {
    id: 'placements',
    label: 'Placements',
    modules: [
      { href: '/dashboard/compound',    type: 'compound',    label: 'Intérêts composés', desc: "Effet boule de neige sur votre capital",              icon: TrendingUp, color: '#34d399', tag: 'Épargne' },
      { href: '/dashboard/dca',         type: 'dca',         label: 'DCA',               desc: 'Investissement progressif et régulier',               icon: RefreshCw,  color: '#38bdf8', tag: 'Épargne' },
      { href: '/dashboard/fire',        type: 'fire',        label: 'FI/RE',             desc: "Date d'indépendance financière",                      icon: Flame,      color: '#fb923c', tag: 'Épargne' },
      { href: '/dashboard/dividends',   type: 'dividends',   label: 'Revenus passifs',   desc: 'Dividendes et rentes sur le long terme',             icon: Coins,      color: '#facc15', tag: 'Épargne' },
      { href: '/dashboard/benchmark',   type: 'benchmark',   label: 'Benchmarks',        desc: 'Comparez performances aux indices ETF',              icon: BarChart3,  color: '#818cf8', tag: 'Épargne' },
      { href: '/dashboard/transactions', type: 'transactions', label: "Carnet d'ordres", desc: 'Ordres boursiers, PRU, dividendes et historique',    icon: History,    color: '#38bdf8', tag: 'Épargne' },
    ],
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    modules: [
      { href: '/dashboard/buyrent',  type: 'buyrent',  label: 'Acheter vs Louer',     desc: 'Comparez les deux stratégies résidentielles',        icon: Home,      color: '#a78bfa', tag: 'Immo' },
      { href: '/dashboard/mortgage', type: 'mortgage', label: 'Prêt immobilier',      desc: "Mensualités, TAEG et coût total",                    icon: Building2, color: '#f472b6', tag: 'Immo' },
      { href: '/dashboard/rental',   type: 'rental',   label: 'Rentabilité locative', desc: 'Cashflow net, rendement brut/net, ROI',              icon: Wallet,    color: '#2dd4bf', tag: 'Immo' },
    ],
  },
  {
    id: 'fiscalite',
    label: 'Fiscalité & Retraite',
    modules: [
      { href: '/dashboard/tax',              type: 'tax',              label: 'Impôts IR',          desc: 'Barème IR 2025, TMI et optimisation fiscale',           icon: Receipt,    color: '#fb7185', tag: 'Fiscal' },
      { href: '/dashboard/flat-tax',         type: 'flat-tax',         label: 'Flat Tax vs Barème', desc: 'PFU 30% vs barème progressif',                         icon: Receipt,    color: '#f97316', tag: 'Fiscal' },
      { href: '/dashboard/envelope-compare', type: 'envelope-compare', label: 'PEA vs CTO vs AV',  desc: 'Fiscalité de chaque enveloppe sur 20 ans',              icon: Wallet,     color: '#c084fc', tag: 'Fiscal' },
      { href: '/dashboard/retirement',       type: 'retirement',       label: 'Retraite',           desc: 'Projection pension CNAV + Agirc-Arrco',                icon: PiggyBank,  color: '#fbbf24', tag: 'Fiscal' },
      { href: '/dashboard/succession',       type: 'succession',       label: 'Succession & Don.',  desc: 'Droits de succession et donations optimales',           icon: Users,      color: '#60a5fa', tag: 'Fiscal' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget & Épargne',
    modules: [
      { href: '/dashboard/savings-rate',    type: 'savings-rate',    label: "Taux d'épargne",  desc: "Capacité d'épargne et trajectoire vers l'IF",          icon: Percent,    color: '#818cf8', tag: 'Budget' },
      { href: '/dashboard/budget',          type: 'budget',          label: 'Budget 50/30/20', desc: "Règle d'or pour équilibrer vos dépenses",              icon: Calculator, color: '#a3e635', tag: 'Budget' },
      { href: '/dashboard/emergency-fund',  type: 'emergency-fund',  label: 'Épargne urgence', desc: 'Coussin de sécurité optimal',                          icon: ShieldCheck, color: '#34d399', tag: 'Budget' },
      { href: '/dashboard/consumer-credit', type: 'consumer-credit', label: 'Crédit conso',    desc: 'Coût total et capacité de remboursement',              icon: CreditCard, color: '#fb7185', tag: 'Budget' },
    ],
  },
  {
    id: 'avances',
    label: 'Outils avancés',
    modules: [
      { href: '/dashboard/livrets',   type: 'livrets',   label: 'Livrets réglementés', desc: 'Livret A, LDDS, LEP, CEL vs ETF',              icon: Banknote,     color: '#34d399', tag: 'Épargne' },
      { href: '/dashboard/frais',     type: 'frais',     label: 'Impact des frais',    desc: 'ETF 0.2% vs fonds actif 2% sur 20 ans',        icon: TrendingDown, color: '#38bdf8', tag: 'Placements' },
      { href: '/dashboard/inflation', type: 'inflation', label: 'Inflation & PA',      desc: 'Taux réel Fisher, érosion du pouvoir d\'achat', icon: LineChart,    color: '#fb923c', tag: 'Épargne' },
      { href: '/dashboard/plusvalue', type: 'plusvalue', label: 'Plus-value immo.',    desc: 'Abattements IR/PS, surtaxe, durée optimale',    icon: MapPin,       color: '#a78bfa', tag: 'Immo' },
      { href: '/dashboard/scpi',      type: 'scpi',      label: 'SCPI',                desc: 'Rendement net de fiscalité foncière',           icon: Building2,    color: '#f59e0b', tag: 'Immo' },
      { href: '/dashboard/viager',    type: 'viager',    label: 'Viager',              desc: 'Bouquet, rente et seuil d\'équilibre actuariel', icon: Users,       color: '#e879f9', tag: 'Immo' },
    ],
  },
]

const ALL_MODULES = CATEGORIES.flatMap(c => c.modules)

const FILTER_TABS = [
  { id: 'all',        label: 'Tous',                count: ALL_MODULES.length },
  { id: 'placements', label: 'Placements',           count: 6 },
  { id: 'immobilier', label: 'Immobilier',           count: 3 },
  { id: 'fiscalite',  label: 'Fiscalité',            count: 5 },
  { id: 'budget',     label: 'Budget',               count: 4 },
  { id: 'avances',    label: 'Avancés',              count: 6 },
]

const GOLD = '#f1c086'

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

export default function SimulateursPage() {
  const [sims, setSims] = useState<Simulation[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    fetch('/api/simulations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .finally(() => setLoaded(true))
  }, [])

  const simsByType = useMemo(() =>
    sims.reduce((acc, s) => { acc[s.type] = [...(acc[s.type] || []), s]; return acc }, {} as Record<string, Simulation[]>)
  , [sims])

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim()
    return CATEGORIES
      .filter(cat => activeFilter === 'all' || cat.id === activeFilter)
      .map(cat => ({
        ...cat,
        modules: cat.modules.filter(mod =>
          !q || mod.label.toLowerCase().includes(q) || mod.desc.toLowerCase().includes(q) || mod.tag.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.modules.length > 0)
  }, [search, activeFilter])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--content-bg)' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid var(--section-border)', flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 80% 50%, ${GOLD}05, transparent 60%)` }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 3 }}>
              Outils financiers
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
                Simulateurs
              </h1>
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>
                {loaded ? `${sims.length} sim. sauvegardée${sims.length > 1 ? 's' : ''}` : '…'} · {ALL_MODULES.length} modules
              </span>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: 220, flexShrink: 0 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted-c)', width: 13, height: 13, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                borderRadius: 8, fontSize: 12, color: 'var(--text-em)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ padding: '6px 24px', borderBottom: '1px solid var(--section-border)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 7, border: 'none',
                background: isActive ? 'rgba(241,192,134,0.12)' : 'transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                color: isActive ? GOLD : 'var(--text-muted-c)',
                fontWeight: isActive ? 600 : 400, fontSize: 12,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'var(--row-hover)') }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent') }}
            >
              {tab.label}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                background: isActive ? 'rgba(241,192,134,0.2)' : 'var(--icon-chip-bg)',
                color: isActive ? GOLD : 'var(--text-subtle)',
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── MODULE GRID ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 24px 16px' }}>
        {filteredCategories.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
            <Search style={{ width: 28, height: 28, color: 'var(--text-subtle)' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>Aucun simulateur pour « {search} »</p>
            <button onClick={() => setSearch('')} style={{ fontSize: 12, color: GOLD, background: 'none', border: 'none', cursor: 'pointer' }}>
              Effacer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredCategories.map(cat => (
              <div key={cat.id}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted-c)', flexShrink: 0 }}>
                    {cat.label}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--section-border)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)', flexShrink: 0 }}>{cat.modules.length} outil{cat.modules.length > 1 ? 's' : ''}</span>
                </div>

                {/* Module cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                  {cat.modules.map(mod => {
                    const typeSims = simsByType[mod.type] || []
                    const lastSim = typeSims[0]
                    return (
                      <Link key={mod.href} href={mod.href} style={{ textDecoration: 'none' }}>
                        <div
                          style={{
                            position: 'relative', overflow: 'hidden', borderRadius: 10, padding: '10px 12px',
                            background: `radial-gradient(ellipse at top left, ${mod.color}12, transparent 70%)`,
                            border: `1px solid ${mod.color}20`,
                            transition: 'all 0.15s', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '50'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '20'; (e.currentTarget as HTMLElement).style.transform = '' }}
                        >
                          {/* Icon */}
                          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: mod.color + '18', border: `1px solid ${mod.color}28` }}>
                            <mod.icon style={{ color: mod.color, width: 16, height: 16 }} />
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', letterSpacing: '-0.01em' }}>{mod.label}</span>
                              <span style={{ fontSize: 9, color: mod.color, background: mod.color + '18', padding: '1px 5px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>{mod.tag}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                                {mod.desc}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                {loaded && typeSims.length > 0 ? (
                                  <>
                                    <Clock style={{ width: 10, height: 10, color: 'var(--text-subtle)' }} />
                                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{lastSim ? timeAgo(lastSim.createdAt) : ''}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: mod.color + '18', color: mod.color }}>{typeSims.length}</span>
                                  </>
                                ) : (
                                  <ArrowUpRight style={{ width: 12, height: 12, color: 'var(--text-muted-c)' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
