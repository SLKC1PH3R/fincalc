'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator, Percent, Trash2,
  Settings, PanelLeftClose, PanelLeftOpen, Shield, BarChart3, ChevronDown,
  Sun, Moon, PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'

const NAV_SECTIONS = [
  {
    title: 'Patrimoine',
    items: [
      { href: '/dashboard/portfolio', label: 'Mon Portefeuille', icon: PieChart },
    ]
  },
  {
    title: 'Épargne',
    items: [
      { href: '/dashboard/compound', label: 'Intérêts Composés', icon: TrendingUp },
      { href: '/dashboard/dca', label: 'DCA', icon: RefreshCw },
      { href: '/dashboard/fire', label: 'FI/RE', icon: Flame },
    ]
  },
  {
    title: 'Immobilier',
    items: [
      { href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home },
      { href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2 },
      { href: '/dashboard/rental', label: 'Rentabilité Locative', icon: Wallet },
    ]
  },
  {
    title: 'Fiscal & Retraite',
    items: [
      { href: '/dashboard/tax', label: 'Impôts IR', icon: Receipt },
      { href: '/dashboard/retirement', label: 'Retraite', icon: PiggyBank },
    ]
  },
  {
    title: 'Budget',
    items: [
      { href: '/dashboard/savings-rate', label: "Taux d'épargne", icon: Percent },
      { href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator },
    ]
  },
  {
    title: 'Compte',
    items: [
      { href: '/dashboard/settings', label: 'Mon compte', icon: Settings },
      { href: '/dashboard/history', label: 'Historique', icon: History },
    ]
  },
]

interface SimEntry { id: string; type: string; name: string; inputs: Record<string, unknown> }

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
}

function SidebarInner({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSimId = searchParams.get('sim')
  const { collapsed, toggle } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const [sims, setSims] = useState<SimEntry[]>([])
  const [expandedHref, setExpandedHref] = useState<string | null>(null)
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

  const deleteSim = async (id: string) => {
    setSims(prev => prev.filter(s => s.id !== id))
    try {
      await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' })
    } catch {}
  }

  useEffect(() => {
    loadSims()
    window.addEventListener('simulation-saved', loadSims)
    return () => window.removeEventListener('simulation-saved', loadSims)
  }, [])

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/')) return
    setExpandedHref(pathname)
  }, [pathname])

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={toggle} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-200 border-r',
        collapsed ? '-translate-x-full md:translate-x-0 md:w-14' : 'translate-x-0 w-64 md:w-56'
      )} style={{ background: 'var(--sb-bg)', borderRightColor: 'var(--sb-border)' }}>

        {/* ── Logo header ── */}
        <div className={cn(
          'flex-shrink-0 border-b transition-all duration-200',
          collapsed ? 'h-14 px-3 flex items-center justify-center' : 'px-4 pt-5 pb-4'
        )} style={{ borderBottomColor: 'var(--sb-border)' }}>
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: '#f1c086' }} />
                  </div>
                  <span className="font-bold text-base tracking-tight" style={{ color: 'var(--sb-text-strong)' }}>FinCalc</span>
                </Link>
                <button onClick={toggle} className="transition-colors p-1 rounded-md"
                  style={{ color: 'var(--sb-text-dim)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}>
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg" style={{ background: 'var(--sb-profile-bg)' }}>
                {user.image ? (
                  <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(241,192,134,0.15)', border: '1px solid rgba(241,192,134,0.25)' }}>
                    <span className="text-[11px] font-bold" style={{ color: '#f1c086' }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--sb-text)' }}>{user.name || 'Utilisateur'}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--sb-text-dim)' }}>{user.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={toggle} title="Ouvrir le menu"
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#f1c086' }} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Synthèse — standalone */}
          <div>
            <Link
              href="/dashboard"
              title={collapsed ? 'Synthèse' : undefined}
              className={cn(
                'sb-link flex items-center gap-2.5 rounded-lg',
                collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                pathname === '/dashboard' && 'sb-link-active'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
              {!collapsed && <span className="text-xs font-medium">Synthèse</span>}
            </Link>
          </div>

          {NAV_SECTIONS.map((section) => {
            const isSectionCollapsed = collapsedSections.has(section.title)
            return (
            <div key={section.title}>
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 mb-1.5 group"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest transition-colors"
                    style={{ color: 'var(--sb-text-section)' }}>
                    {section.title}
                  </span>
                  <ChevronDown className="h-3 w-3 transition-all flex-shrink-0"
                    style={{ color: 'var(--sb-text-dim)', transform: isSectionCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
              )}
              {collapsed && <div className="h-px mx-2 mb-2" style={{ background: 'var(--sb-divider)' }} />}
              {(collapsed || !isSectionCollapsed) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const type = item.href.split('/').pop()
                  const itemSims = type && type !== 'dashboard' ? sims.filter(s => s.type === type) : []
                  const isExpanded = expandedHref === item.href

                  return (
                    <div key={item.href}>
                      {/* Item row */}
                      <div className="flex items-center gap-0.5">
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'sb-link flex items-center gap-2.5 rounded-lg flex-1 min-w-0',
                            collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                            isActive && 'sb-link-active'
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0 transition-colors" />
                          {!collapsed && (
                            <>
                              <span className="text-xs flex-1 truncate font-medium">{item.label}</span>
                              {itemSims.length > 0 ? (
                                <span style={{ fontSize: 9, color: '#f1c086', background: 'rgba(241,192,134,0.12)', padding: '1px 5px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                                  {itemSims.length}
                                </span>
                              ) : isActive ? (
                                <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#f1c086' }} />
                              ) : null}
                            </>
                          )}
                        </Link>

                        {/* Expand toggle */}
                        {!collapsed && itemSims.length > 0 && (
                          <button
                            onClick={() => setExpandedHref(prev => prev === item.href ? null : item.href)}
                            className="flex items-center justify-center h-6 w-6 rounded-md transition-colors flex-shrink-0"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sb-hover-bg)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                          >
                            <ChevronDown className="h-3 w-3" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          </button>
                        )}
                      </div>

                      {/* Sub-menu */}
                      {!collapsed && isExpanded && itemSims.length > 0 && (
                        <div className="mt-0.5 ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--sb-divider)' }}>
                          {itemSims.slice(0, 6).map(sim => {
                            const isActiveSim = activeSimId === sim.id
                            return (
                              <div
                                key={sim.id}
                                className="group flex items-center rounded-md transition-colors"
                                style={{ background: isActiveSim ? 'rgba(241,192,134,0.08)' : 'transparent' }}
                                onMouseEnter={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
                                onMouseLeave={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                              >
                                <Link
                                  href={`${item.href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                                  className="flex items-center gap-1.5 py-1.5 px-2 flex-1 min-w-0 overflow-hidden"
                                  style={{
                                    fontSize: 11,
                                    textDecoration: 'none',
                                    color: isActiveSim ? '#f1c086' : 'var(--sb-sim-text)',
                                    fontWeight: isActiveSim ? 600 : 400,
                                  }}
                                  onMouseEnter={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text-hover)' }}
                                  onMouseLeave={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text)' }}
                                >
                                  {isActiveSim && <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#f1c086' }} />}
                                  <span className="truncate">{sim.name}</span>
                                </Link>
                                <button
                                  onClick={e => { e.preventDefault(); e.stopPropagation(); deleteSim(sim.id) }}
                                  className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center transition-all flex-shrink-0 mr-1 hover:text-red-400"
                                  style={{ color: 'var(--sb-text-dim)' }}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                          {itemSims.length > 6 && (
                            <Link href="/dashboard/history"
                              className="block py-1.5 px-2 rounded-md transition-colors"
                              style={{ fontSize: 11, color: 'var(--sb-text-dim)', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-sim-text-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}>
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
            <div>
              {!collapsed && (
                <p className="text-[11px] font-semibold uppercase tracking-widest px-2 mb-1.5"
                  style={{ color: 'var(--sb-text-section)' }}>Admin</p>
              )}
              {collapsed && <div className="h-px mx-2 mb-2" style={{ background: 'var(--sb-divider)' }} />}
              <Link href="/dashboard/admin" title={collapsed ? 'Administration' : undefined}
                className={cn(
                  'sb-link flex items-center gap-2.5 rounded-lg',
                  collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                  pathname === '/dashboard/admin' && 'sb-link-active'
                )}>
                <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                {!collapsed && <span className="text-xs font-medium">Administration</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="border-t p-2 flex-shrink-0 space-y-0.5" style={{ borderTopColor: 'var(--sb-border)' }}>
          {collapsed && (
            <button onClick={toggle} className="w-full flex justify-center py-2 transition-colors"
              style={{ color: 'var(--sb-text-dim)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}
              title="Ouvrir">
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg text-xs transition-all',
              collapsed ? 'justify-center py-2 px-2' : 'px-2.5 py-2'
            )}
            style={{ color: 'var(--sb-text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sb-text)'; e.currentTarget.style.background = 'var(--sb-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sb-text-dim)'; e.currentTarget.style.background = 'transparent' }}
          >
            {theme === 'dark'
              ? <Sun className="h-3.5 w-3.5 flex-shrink-0" />
              : <Moon className="h-3.5 w-3.5 flex-shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: 'https://fire.digitalstack.cloud/' })}
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg text-xs transition-all',
              collapsed ? 'justify-center py-2 px-2' : 'px-2.5 py-2'
            )}
            style={{ color: 'var(--sb-text-dim)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sb-text)'; e.currentTarget.style.background = 'var(--sb-hover-bg)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sb-text-dim)'; e.currentTarget.style.background = 'transparent' }}>
            <LogOut className="h-3.5 w-3.5" />
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
