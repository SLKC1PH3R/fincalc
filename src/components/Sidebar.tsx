'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator,
  Settings, PanelLeftClose, PanelLeftOpen, Shield, BarChart3, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'

const NAV_SECTIONS = [
  {
    title: 'Épargne',
    items: [
      { href: '/dashboard', label: 'Accueil', icon: BarChart3 },
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
  const [sims, setSims] = useState<SimEntry[]>([])
  const [expandedHref, setExpandedHref] = useState<string | null>(null)

  const loadSims = () => {
    fetch('/api/simulations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .catch(() => {})
  }

  useEffect(() => {
    loadSims()
    // Reload when a simulation is saved
    window.addEventListener('simulation-saved', loadSims)
    return () => window.removeEventListener('simulation-saved', loadSims)
  }, [])

  // Auto-expand the current calculator's sub-menu if it has sims
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
        'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-200',
        'border-r border-white/[0.05]',
        collapsed ? '-translate-x-full md:translate-x-0 md:w-14' : 'translate-x-0 w-64 md:w-56'
      )} style={{ background: '#0a0a0a' }}>

        {/* ── Logo header ── */}
        <div className={cn(
          'flex-shrink-0 border-b border-white/[0.05] transition-all duration-200',
          collapsed ? 'h-14 px-3 flex items-center justify-center' : 'px-4 pt-5 pb-4'
        )}>
          {!collapsed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                    style={{ background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: '#f1c086' }} />
                  </div>
                  <span className="font-bold text-base text-white tracking-tight">FinCalc</span>
                </Link>
                <button onClick={toggle} className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-md hover:bg-white/[0.04]">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
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
                  <p className="text-xs font-semibold text-white/80 truncate">{user.name || 'Utilisateur'}</p>
                  <p className="text-[10px] text-white/30 truncate">{user.email}</p>
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
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-1">
                  {section.title}
                </p>
              )}
              {collapsed && <div className="h-px mx-2 mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />}
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
                            'flex items-center gap-2.5 rounded-lg transition-all duration-150 group flex-1 min-w-0',
                            collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                            isActive ? 'text-white' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                          )}
                          style={isActive ? { background: 'rgba(241,192,134,0.1)', border: '1px solid rgba(241,192,134,0.15)' } : {}}
                        >
                          <item.icon className="h-3.5 w-3.5 flex-shrink-0 transition-colors"
                            style={isActive ? { color: '#f1c086' } : {}} />
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
                            className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/[0.06] transition-colors flex-shrink-0"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }}
                          >
                            <ChevronDown className="h-3 w-3" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                          </button>
                        )}
                      </div>

                      {/* Sub-menu */}
                      {!collapsed && isExpanded && itemSims.length > 0 && (
                        <div className="mt-0.5 ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                          {itemSims.slice(0, 6).map(sim => {
                            const isActiveSim = activeSimId === sim.id
                            return (
                              <Link
                                key={sim.id}
                                href={`${item.href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                                className="flex items-center gap-1.5 truncate py-1.5 px-2 rounded-md transition-colors"
                                style={{
                                  fontSize: 11,
                                  textDecoration: 'none',
                                  color: isActiveSim ? '#f1c086' : 'rgba(255,255,255,0.3)',
                                  background: isActiveSim ? 'rgba(241,192,134,0.08)' : 'transparent',
                                  fontWeight: isActiveSim ? 600 : 400,
                                }}
                                onMouseEnter={e => { if (!isActiveSim) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                                onMouseLeave={e => { if (!isActiveSim) e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                              >
                                {isActiveSim && <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#f1c086' }} />}
                                <span className="truncate">{sim.name}</span>
                              </Link>
                            )
                          })}
                          {itemSims.length > 6 && (
                            <Link href="/dashboard/history"
                              className="block py-1.5 px-2 rounded-md transition-colors"
                              style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}>
                              +{itemSims.length - 6} de plus…
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Admin */}
          {isAdmin && (
            <div>
              {!collapsed && <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-1">Admin</p>}
              {collapsed && <div className="h-px mx-2 mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />}
              <Link href="/dashboard/admin" title={collapsed ? 'Administration' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg transition-all duration-150',
                  collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                  pathname === '/dashboard/admin' ? 'text-white' : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                )}
                style={pathname === '/dashboard/admin' ? { background: 'rgba(241,192,134,0.1)', border: '1px solid rgba(241,192,134,0.15)' } : {}}>
                <Shield className="h-3.5 w-3.5 flex-shrink-0"
                  style={pathname === '/dashboard/admin' ? { color: '#f1c086' } : {}} />
                {!collapsed && <span className="text-xs font-medium">Administration</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-white/[0.05] p-2 flex-shrink-0 space-y-0.5">
          {collapsed && (
            <button onClick={toggle} className="w-full flex justify-center py-2 text-white/20 hover:text-white/50 transition-colors" title="Ouvrir">
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => signOut({ callbackUrl: 'https://fire.digitalstack.cloud/' })}
            title={collapsed ? 'Déconnexion' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 rounded-lg text-xs text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all',
              collapsed ? 'justify-center py-2 px-2' : 'px-2.5 py-2'
            )}>
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
