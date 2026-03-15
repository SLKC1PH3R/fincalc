'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, Percent, ArrowUpRight,
  Search, Clock, BarChart3,
} from 'lucide-react'

interface Simulation {
  id: string; type: string; name: string; createdAt: string
  inputs: Record<string, unknown>
}

// ── Modules ────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'placements',
    label: 'Placements',
    modules: [
      { href: '/dashboard/compound', type: 'compound',     label: 'Intérêts Composés', desc: 'Visualisez l\'effet boule de neige sur votre capital',      icon: TrendingUp, color: '#34d399', tag: 'Épargne' },
      { href: '/dashboard/dca',      type: 'dca',          label: 'DCA',               desc: 'Simulez un investissement progressif et régulier',           icon: RefreshCw,  color: '#38bdf8', tag: 'Épargne' },
      { href: '/dashboard/fire',     type: 'fire',         label: 'FI/RE',             desc: 'Calculez votre date d\'indépendance financière',             icon: Flame,      color: '#fb923c', tag: 'Épargne' },
    ],
  },
  {
    id: 'immobilier',
    label: 'Immobilier',
    modules: [
      { href: '/dashboard/buyrent',  type: 'buyrent',      label: 'Acheter vs Louer',  desc: 'Comparez les deux stratégies résidentielles sur le long terme', icon: Home,      color: '#a78bfa', tag: 'Immobilier' },
      { href: '/dashboard/mortgage', type: 'mortgage',     label: 'Prêt Immobilier',   desc: 'Mensualités, TAEG, coût total et tableau d\'amortissement',  icon: Building2,  color: '#f472b6', tag: 'Immobilier' },
      { href: '/dashboard/rental',   type: 'rental',       label: 'Rentabilité Locative', desc: 'Cashflow net, rendement brut/net et retour sur investissement', icon: Wallet,  color: '#2dd4bf', tag: 'Immobilier' },
    ],
  },
  {
    id: 'fiscalite',
    label: 'Fiscalité & Retraite',
    modules: [
      { href: '/dashboard/tax',        type: 'tax',        label: 'Impôts IR',         desc: 'Calcul du barème IR 2025, TMI et optimisation fiscale',      icon: Receipt,    color: '#fb7185', tag: 'Fiscal' },
      { href: '/dashboard/retirement', type: 'retirement', label: 'Retraite',           desc: 'Projetez votre pension et optimisez votre PER',              icon: PiggyBank,  color: '#fbbf24', tag: 'Fiscal' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    modules: [
      { href: '/dashboard/savings-rate', type: 'savings-rate', label: "Taux d'épargne", desc: 'Analysez votre capacité d\'épargne et votre trajectoire', icon: Percent,    color: '#818cf8', tag: 'Budget' },
      { href: '/dashboard/budget',       type: 'budget',       label: 'Budget 50/30/20', desc: 'Appliquez la règle d\'or pour équilibrer vos dépenses',  icon: Calculator, color: '#a3e635', tag: 'Budget' },
    ],
  },
]

const ALL_MODULES = CATEGORIES.flatMap(c => c.modules)

const FILTER_TABS = [
  { id: 'all',        label: 'Tous',               count: ALL_MODULES.length },
  { id: 'placements', label: 'Placements',          count: 3 },
  { id: 'immobilier', label: 'Immobilier',          count: 3 },
  { id: 'fiscalite',  label: 'Fiscalité & Retraite', count: 2 },
  { id: 'budget',     label: 'Budget',              count: 2 },
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

  // Sims by type
  const simsByType = useMemo(() =>
    sims.reduce((acc, s) => { acc[s.type] = [...(acc[s.type] || []), s]; return acc }, {} as Record<string, Simulation[]>)
  , [sims])

  // Filter by search + category
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

  const totalVisible = filteredCategories.reduce((acc, c) => acc + c.modules.length, 0)

  return (
    <div className="flex-1" style={{ background: 'var(--content-bg)', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden px-5 xl:px-6"
        style={{ borderBottom: '1px solid var(--section-border)', paddingTop: 'clamp(20px,3vw,36px)', paddingBottom: 'clamp(16px,2vw,28px)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 80% 50%, ${GOLD}05, transparent 60%)` }} />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
              Outils financiers
            </p>
            <h1 style={{ fontSize: 'clamp(1.3rem,3vw,1.75rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Simulateurs
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginTop: 4 }}>
              {loaded ? `${sims.length} simulation${sims.length > 1 ? 's' : ''} sauvegardée${sims.length > 1 ? 's' : ''}` : '…'} · 10 modules disponibles
            </p>
          </div>

          {/* Search */}
          <div className="relative flex-shrink-0 w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
              style={{ color: 'var(--text-muted-c)' }} />
            <input
              type="text"
              placeholder="Rechercher un simulateur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
                borderRadius: 10, fontSize: 13, color: 'var(--text-em)', outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--card-dark-border)')}
            />
          </div>
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="px-5 xl:px-6 py-3 flex items-center gap-1.5 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--section-border)' }}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8, border: 'none',
                background: isActive ? 'rgba(241,192,134,0.12)' : 'transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                color: isActive ? GOLD : 'var(--text-muted-c)',
                fontWeight: isActive ? 600 : 400, fontSize: 13,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'var(--row-hover)') }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent') }}
            >
              {tab.label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
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
      <div className="px-5 xl:px-6 py-6 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search className="h-8 w-8" style={{ color: 'var(--text-subtle)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted-c)' }}>Aucun simulateur trouvé pour « {search} »</p>
            <button onClick={() => setSearch('')}
              style={{ fontSize: 13, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Effacer la recherche
            </button>
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div key={cat.id}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted-c)' }}>
                  {cat.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--section-border)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{cat.modules.length} outil{cat.modules.length > 1 ? 's' : ''}</span>
              </div>

              {/* Module cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.modules.map(mod => {
                  const typeSims = simsByType[mod.type] || []
                  const lastSim = typeSims[0]
                  return (
                    <Link key={mod.href} href={mod.href}
                      className="group block"
                      style={{ textDecoration: 'none' }}>
                      <div className="relative overflow-hidden rounded-xl p-4 h-full flex flex-col transition-all duration-200"
                        style={{
                          background: `radial-gradient(ellipse at top left, ${mod.color}14, transparent 70%)`,
                          border: `1px solid ${mod.color}22`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '55'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = mod.color + '22'; (e.currentTarget as HTMLElement).style.transform = '' }}>

                        {/* Hover glow */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 0% 0%, ${mod.color}10, transparent 55%)` }} />

                        <div className="relative flex flex-col flex-1">
                          {/* Top row: icon + tag */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                              style={{ background: mod.color + '18', border: `1px solid ${mod.color}30` }}>
                              <mod.icon className="h-4.5 w-4.5" style={{ color: mod.color, width: 18, height: 18 }} />
                            </div>
                            <span style={{
                              fontSize: 9, color: mod.color, background: mod.color + '18',
                              padding: '2px 7px', borderRadius: 5, fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.08em',
                            }}>
                              {mod.tag}
                            </span>
                          </div>

                          {/* Title + desc */}
                          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-em)', marginBottom: 4, letterSpacing: '-0.02em' }}>
                            {mod.label}
                          </h3>
                          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, flex: 1 }}>
                            {mod.desc}
                          </p>

                          {/* Footer: sim count or last sim */}
                          <div className="mt-3 pt-3 flex items-center justify-between"
                            style={{ borderTop: `1px solid ${mod.color}18` }}>
                            {loaded && typeSims.length > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--text-subtle)' }} />
                                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                                  {lastSim ? timeAgo(lastSim.createdAt) : ''}
                                </span>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                  background: mod.color + '18', color: mod.color,
                                }}>
                                  {typeSims.length} sim.
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>Aucune simulation</span>
                            )}
                            <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>
                              <span>Ouvrir</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Footer info */}
        {filteredCategories.length > 0 && (
          <div className="flex items-center justify-center pt-4">
            <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
              {totalVisible} simulateur{totalVisible > 1 ? 's' : ''} · {loaded ? sims.length : '…'} simulation{sims.length > 1 ? 's' : ''} sauvegardée{sims.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
