'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  ChevronRight, ChevronLeft, Wallet, PiggyBank, RefreshCw,
  Calculator, Settings, PanelLeftClose, PanelLeftOpen, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'

const NAV_SECTIONS = [
  {
    title: 'Épargne',
    items: [
      { href: '/dashboard', label: 'Accueil', icon: Home },
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
    title: 'Paramètres',
    items: [
      { href: '/dashboard/settings', label: 'Mon compte', icon: Settings },
      { href: '/dashboard/history', label: 'Historique', icon: History },
    ]
  },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
}

export function Sidebar({ user, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const W = collapsed ? 'w-14' : 'w-56'

  return (
    <aside className={cn('fixed left-0 top-0 h-full border-r border-border bg-background flex flex-col z-40 transition-all duration-200', W)}>
      {/* Logo + toggle */}
      <div className="h-14 flex items-center border-b border-border flex-shrink-0 px-3 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-sm bg-foreground flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold text-sm tracking-tight truncate">FinCalc</span>
          </div>
        )}
        {collapsed && (
          <div className="h-6 w-6 rounded-sm bg-foreground flex items-center justify-center mx-auto">
            <TrendingUp className="h-3.5 w-3.5 text-background" />
          </div>
        )}
        {!collapsed && (
          <button onClick={toggle} className="ml-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[0.62rem] font-medium text-muted-foreground uppercase tracking-widest px-2 mb-1">
                {section.title}
              </p>
            )}
            {collapsed && <div className="h-px bg-border mx-1 my-2" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md transition-colors group',
                      collapsed ? 'px-2 py-2 justify-center' : 'px-2 py-1.5',
                      isActive
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                    {!collapsed && <span className="truncate text-xs">{item.label}</span>}
                    {!collapsed && isActive && <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin link */}
        {isAdmin && (
          <div>
            {!collapsed && <p className="text-[0.62rem] font-medium text-muted-foreground uppercase tracking-widest px-2 mb-1">Admin</p>}
            {collapsed && <div className="h-px bg-border mx-1 my-2" />}
            <Link
              href="/dashboard/admin"
              title={collapsed ? 'Administration' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md transition-colors group',
                collapsed ? 'px-2 py-2 justify-center' : 'px-2 py-1.5',
                pathname === '/dashboard/admin'
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-xs">Administration</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-2 space-y-0.5 flex-shrink-0">
        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={toggle}
            className="w-full flex justify-center py-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Ouvrir le menu"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            {user.image ? (
              <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-foreground uppercase">
                  {(user.name || user.email || 'U')[0]}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user.name || 'Utilisateur'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Déconnexion' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors',
            collapsed ? 'justify-center py-2 px-2' : 'px-2 py-1.5'
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
