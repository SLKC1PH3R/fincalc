'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator, Percent, Trash2,
  Settings, PanelLeftClose, PanelLeftOpen, Shield, BarChart3, ChevronDown,
  Sun, Moon, Bitcoin, Award, CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'

// ── Patrimoine categories ─────────────────────────────────────────────────────
const PATRIMOINE_CATEGORIES = [
  { href: '/dashboard/patrimoine',            label: "Vue d'ensemble",    icon: BarChart3  },
  { href: '/dashboard/patrimoine/immobilier', label: 'Immobilier',        icon: Building2  },
  { href: '/dashboard/patrimoine/actions',    label: 'Actions & Fonds',   icon: TrendingUp },
  { href: '/dashboard/patrimoine/livrets',    label: 'Livrets',           icon: PiggyBank  },
  { href: '/dashboard/patrimoine/autres',     label: 'Autres actifs',     icon: Bitcoin    },
  { href: '/dashboard/patrimoine/comptes',    label: 'Comptes bancaires', icon: Wallet     },
  { href: '/dashboard/patrimoine/emprunts',   label: 'Emprunts',          icon: CreditCard },
]

const NAV_SECTIONS = [
  {
    title: 'Épargne',
    items: [
      { href: '/dashboard/compound',   label: 'Intérêts Composés', icon: TrendingUp },
      { href: '/dashboard/dca',        label: 'DCA',               icon: RefreshCw  },
      { href: '/dashboard/fire',       label: 'FI/RE',             icon: Flame      },
    ],
  },
  {
    title: 'Immobilier',
    items: [
      { href: '/dashboard/buyrent',  label: 'Acheter vs Louer',    icon: Home      },
      { href: '/dashboard/mortgage', label: 'Prêt Immobilier',     icon: Building2 },
      { href: '/dashboard/rental',   label: 'Rentabilité Locative', icon: Wallet   },
    ],
  },
  {
    title: 'Fiscal & Retraite',
    items: [
      { href: '/dashboard/tax',              label: 'Impôts IR',          icon: Receipt   },
      { href: '/dashboard/flat-tax',         label: 'Flat Tax vs Barème', icon: Receipt   },
      { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV',  icon: Wallet    },
      { href: '/dashboard/retirement',       label: 'Retraite',           icon: PiggyBank },
    ],
  },
  {
    title: 'Budget',
    items: [
      { href: '/dashboard/savings-rate', label: "Taux d'épargne",  icon: Percent    },
      { href: '/dashboard/budget',       label: 'Budget 50/30/20', icon: Calculator },
    ],
  },
  {
    title: 'Compte',
    items: [
      { href: '/dashboard/settings', label: 'Mon compte', icon: Settings },
      { href: '/dashboard/history',  label: 'Historique', icon: History  },
    ],
  },
]

interface SimEntry { id: string; type: string; name: string; inputs: Record<string, unknown> }

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
  isDemo?: boolean
}

function SidebarInner({ user, isAdmin, isDemo }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSimId = searchParams.get('sim')
  const { collapsed, toggle } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const [sims, setSims] = useState<SimEntry[]>([])
  const [expandedHref, setExpandedHref] = useState<string | null>(null)
  const [patrimoineExpanded, setPatrimoineExpanded] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  const toggleSection = (title: string) => setCollapsedSections(prev => {
    const next = new Set(prev)
    if (next.has(title)) next.delete(title); else next.add(title)
    return next
  })

  const loadSims = () => {
    fetch('/api/simulations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .catch(() => {})
  }

  useEffect(() => {
    loadSims()
    window.addEventListener('simulation-saved', loadSims)
    return () => { window.removeEventListener('simulation-saved', loadSims) }
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/dashboard/')) setExpandedHref(pathname)
  }, [pathname])

  const deleteSim = async (id: string) => {
    setSims(prev => prev.filter(s => s.id !== id))
    try { await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' }) } catch {}
  }

  const W = collapsed ? 64 : 264

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={toggle} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-200',
          collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        )}
        style={{
          width: W,
          background: 'var(--sb-bg)',
          borderRight: 'none',
          overflow: 'visible',
        }}
      >
        {/* ── Right edge fondu ── */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            right: -44,
            width: 44,
            pointerEvents: 'none',
            background: 'linear-gradient(90deg, var(--sb-bg) 0%, transparent 100%)',
            zIndex: 1,
          }}
        />

        {/* ── Logo / header ── */}
        <div className={cn(
          'flex-shrink-0 transition-all duration-200',
          collapsed ? 'h-16 px-3 flex items-center justify-center' : 'px-5 pt-6 pb-5'
        )}>
          {!collapsed ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                  {/* Logo icon */}
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
                  >
                    <TrendingUp style={{ color: '#0a0a0a', width: 15, height: 15 }} />
                  </div>
                  {/* Logo text — gold gradient */}
                  <span
                    className="sb-gold-text"
                    style={{
                      fontWeight: 800,
                      fontSize: 17,
                      letterSpacing: '-0.04em',
                      fontFamily: 'Geist, -apple-system, sans-serif',
                    }}
                  >
                    FinCalc
                  </span>
                </Link>
                <button
                  onClick={toggle}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--sb-text-dim)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              {/* User card */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'var(--sb-profile-bg)',
                  border: '1px solid rgba(249,115,22,0.08)',
                }}
              >
                {user.image ? (
                  <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" style={{ ring: '1px solid rgba(249,115,22,0.2)' }} />
                ) : (
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
                  >
                    <span className="text-[11px] font-bold" style={{ color: '#0a0a0a' }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--sb-text-strong)' }}>
                    {user.name || 'Utilisateur'}
                  </p>
                  <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--sb-text-dim)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={toggle}
              title="Ouvrir"
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
            >
              <TrendingUp style={{ color: '#0a0a0a', width: 15, height: 15 }} />
            </button>
          )}
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ padding: collapsed ? '4px 8px' : '0 12px 8px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              background: 'rgba(251,146,60,0.06)',
              border: '1px solid rgba(251,146,60,0.15)',
              borderRadius: 8, padding: '4px 10px', width: '100%',
            }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>🔒</span>
              {!collapsed && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fb923c', letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  Mode démo · Lecture seule
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? '8px 6px' : '8px 10px' }}>

          {/* Synthèse + Score */}
          <div style={{ marginBottom: 2 }}>
            {[
              { href: '/dashboard', label: 'Synthèse', icon: BarChart3 },
              { href: '/dashboard/score', label: 'Score Patrimonial', icon: Award },
            ].map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'sb-link flex items-center gap-3 rounded-xl mb-0.5',
                    collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2',
                    isActive && 'sb-link-active'
                  )}
                >
                  <item.icon className="flex-shrink-0" style={{ width: 16, height: 16 }} />
                  {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>}
                </Link>
              )
            })}
          </div>

          {/* Thin divider */}
          <div style={{ height: 1, margin: '8px 4px', background: 'var(--sb-divider)' }} />

          {/* Patrimoine section */}
          <div style={{ marginBottom: 4 }}>
            {!collapsed && (
              <button
                onClick={() => toggleSection('Patrimoine')}
                className="flex items-center justify-between w-full px-3 mb-1.5"
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'var(--sb-text-section)',
                }}>
                  Patrimoine
                </span>
                <ChevronDown
                  className="h-3 w-3 flex-shrink-0"
                  style={{
                    color: 'var(--sb-text-dim)',
                    transform: collapsedSections.has('Patrimoine') ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
            )}
            {collapsed && <div style={{ height: 1, margin: '4px 4px 6px', background: 'var(--sb-divider)' }} />}

            {(collapsed || !collapsedSections.has('Patrimoine')) && (
              <div>
                {/* Vue d'ensemble row */}
                <div className="flex items-center gap-0.5 mb-0.5">
                  <Link
                    href="/dashboard/patrimoine"
                    title={collapsed ? "Vue d'ensemble" : undefined}
                    className={cn(
                      'sb-link flex items-center gap-3 rounded-xl flex-1',
                      collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2',
                      pathname === '/dashboard/patrimoine' && 'sb-link-active'
                    )}
                  >
                    <BarChart3 className="flex-shrink-0" style={{ width: 16, height: 16 }} />
                    {!collapsed && <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>Vue d&apos;ensemble</span>}
                  </Link>
                  {!collapsed && (
                    <button
                      onClick={() => setPatrimoineExpanded(v => !v)}
                      className="h-6 w-6 flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--sb-hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <ChevronDown
                        className="h-3 w-3"
                        style={{
                          transform: patrimoineExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>
                  )}
                </div>

                {/* Category sub-links — expanded */}
                {!collapsed && patrimoineExpanded && (
                  <div
                    className="mt-0.5 ml-3.5 pl-3 space-y-0.5"
                    style={{ borderLeft: '1px solid var(--sb-divider)' }}
                  >
                    {PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                      const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                      return (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all',
                            isActive ? 'sb-link-active' : 'sb-link'
                          )}
                          style={{ fontSize: 12 }}
                        >
                          <cat.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                          <span>{cat.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Category icons — collapsed */}
                {collapsed && PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                  const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                  return (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      title={cat.label}
                      className={cn(
                        'sb-link flex items-center justify-center rounded-xl mb-0.5 px-2 py-2.5',
                        isActive && 'sb-link-active'
                      )}
                    >
                      <cat.icon style={{ width: 16, height: 16 }} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Static sections */}
          {NAV_SECTIONS.map((section) => {
            const isSectionCollapsed = collapsedSections.has(section.title)
            return (
              <div key={section.title} style={{ marginBottom: 4 }}>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center justify-between w-full px-3 mb-1.5"
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.1em', color: 'var(--sb-text-section)',
                    }}>
                      {section.title}
                    </span>
                    <ChevronDown
                      className="h-3 w-3 flex-shrink-0"
                      style={{
                        color: 'var(--sb-text-dim)',
                        transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>
                )}
                {collapsed && <div style={{ height: 1, margin: '4px 4px 6px', background: 'var(--sb-divider)' }} />}

                {(collapsed || !isSectionCollapsed) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href
                      const type = item.href.split('/').pop()
                      const itemSims = type ? sims.filter(s => s.type === type) : []
                      const isExpanded = expandedHref === item.href

                      return (
                        <div key={item.href}>
                          <div className="flex items-center gap-0.5">
                            <Link
                              href={item.href}
                              title={collapsed ? item.label : undefined}
                              className={cn(
                                'sb-link flex items-center gap-3 rounded-xl flex-1 min-w-0',
                                collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2',
                                isActive && 'sb-link-active'
                              )}
                            >
                              <item.icon className="flex-shrink-0" style={{ width: 16, height: 16 }} />
                              {!collapsed && (
                                <>
                                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.label}
                                  </span>
                                  {itemSims.length > 0 ? (
                                    <span style={{
                                      fontSize: 9, color: '#f97316',
                                      background: 'rgba(249,115,22,0.10)',
                                      padding: '1px 6px', borderRadius: 4,
                                      fontWeight: 700, flexShrink: 0,
                                    }}>
                                      {itemSims.length}
                                    </span>
                                  ) : isActive ? (
                                    <span
                                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                      style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
                                    />
                                  ) : null}
                                </>
                              )}
                            </Link>

                            {!collapsed && itemSims.length > 0 && (
                              <button
                                onClick={() => setExpandedHref(prev => prev === item.href ? null : item.href)}
                                className="h-6 w-6 flex items-center justify-center rounded-lg flex-shrink-0"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sb-hover-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                <ChevronDown
                                  className="h-3 w-3"
                                  style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                                />
                              </button>
                            )}
                          </div>

                          {!collapsed && isExpanded && itemSims.length > 0 && (
                            <div
                              className="mt-0.5 ml-4 pl-3 space-y-0.5"
                              style={{ borderLeft: '1px solid var(--sb-divider)' }}
                            >
                              {itemSims.slice(0, 6).map(sim => {
                                const isActiveSim = activeSimId === sim.id
                                return (
                                  <div
                                    key={sim.id}
                                    className="group flex items-center rounded-lg"
                                    style={{ background: isActiveSim ? 'rgba(249,115,22,0.07)' : 'transparent' }}
                                    onMouseEnter={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
                                    onMouseLeave={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                  >
                                    <Link
                                      href={`${item.href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                                      className="flex items-center gap-2 py-1.5 px-2 flex-1 min-w-0"
                                      style={{
                                        fontSize: 11,
                                        textDecoration: 'none',
                                        color: isActiveSim ? '#f97316' : 'var(--sb-sim-text)',
                                        fontWeight: isActiveSim ? 600 : 400,
                                      }}
                                      onMouseEnter={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text-hover)' }}
                                      onMouseLeave={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text)' }}
                                    >
                                      {isActiveSim && (
                                        <span
                                          className="h-1 w-1 rounded-full flex-shrink-0"
                                          style={{ background: '#f97316' }}
                                        />
                                      )}
                                      <span className="truncate">{sim.name}</span>
                                    </Link>
                                    <button
                                      onClick={e => { e.preventDefault(); e.stopPropagation(); deleteSim(sim.id) }}
                                      className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center transition-all flex-shrink-0 mr-1 hover:text-red-400"
                                      style={{ color: 'var(--sb-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              })}
                              {itemSims.length > 6 && (
                                <Link
                                  href="/dashboard/history"
                                  className="block py-1.5 px-2 rounded-lg"
                                  style={{ fontSize: 11, color: 'var(--sb-text-dim)', textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-sim-text-hover)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}
                                >
                                  +{itemSims.length - 6} de plus…
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Admin */}
          {isAdmin && (
            <div style={{ marginBottom: 4 }}>
              {!collapsed && (
                <p style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'var(--sb-text-section)',
                  padding: '0 12px', marginBottom: 6,
                }}>
                  Admin
                </p>
              )}
              {collapsed && <div style={{ height: 1, margin: '4px 4px 6px', background: 'var(--sb-divider)' }} />}
              <Link
                href="/dashboard/admin"
                title={collapsed ? 'Administration' : undefined}
                className={cn(
                  'sb-link flex items-center gap-3 rounded-xl',
                  collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2',
                  pathname === '/dashboard/admin' && 'sb-link-active'
                )}
              >
                <Shield className="flex-shrink-0" style={{ width: 16, height: 16 }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Administration</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 space-y-0.5"
          style={{
            borderTop: '1px solid var(--sb-border)',
            padding: collapsed ? '8px 6px' : '8px 10px',
          }}
        >
          {collapsed && (
            <button
              onClick={toggle}
              className="w-full flex justify-center py-2.5 rounded-xl transition-all"
              style={{ color: 'var(--sb-text-dim)' }}
              onMouseEnter={e => { (e.currentTarget.style.color = 'var(--sb-text)'); (e.currentTarget.style.background = 'var(--sb-hover-bg)') }}
              onMouseLeave={e => { (e.currentTarget.style.color = 'var(--sb-text-dim)'); (e.currentTarget.style.background = 'transparent') }}
              title="Ouvrir"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-sm transition-all',
              collapsed ? 'justify-center py-2.5 px-2' : 'px-3 py-2'
            )}
            style={{ color: 'var(--sb-text-dim)', fontSize: 13 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sb-text)'; e.currentTarget.style.background = 'var(--sb-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sb-text-dim)'; e.currentTarget.style.background = 'transparent' }}
          >
            {theme === 'dark'
              ? <Sun className="flex-shrink-0" style={{ width: 16, height: 16 }} />
              : <Moon className="flex-shrink-0" style={{ width: 16, height: 16 }} />
            }
            {!collapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: 'https://fire.digitalstack.cloud/' })}
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-sm transition-all',
              collapsed ? 'justify-center py-2.5 px-2' : 'px-3 py-2'
            )}
            style={{ color: 'var(--sb-text-dim)', fontSize: 13 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sb-text)'; e.currentTarget.style.background = 'var(--sb-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sb-text-dim)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut className="flex-shrink-0" style={{ width: 16, height: 16 }} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense>
      <SidebarInner {...props} />
    </Suspense>
  )
}
