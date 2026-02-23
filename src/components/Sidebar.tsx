'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  ChevronRight, Wallet, PiggyBank, RefreshCw, Calculator,
  Settings, PanelLeftClose, PanelLeftOpen, Shield
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
    <aside className={cn(
      'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-200',
      'bg-[#080808] border-r border-white/[0.05]',
      W
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center flex-shrink-0 px-3 border-b border-white/[0.05]">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <span className="font-semibold text-sm text-white tracking-tight">FinCalc</span>
            </div>
            <button onClick={toggle} className="text-white/20 hover:text-white/60 transition-colors">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mx-auto h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-1.5">
                {section.title}
              </p>
            )}
            {collapsed && <div className="h-px bg-white/[0.05] mx-2 my-1" />}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg transition-all duration-150 group',
                      collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                      isActive
                        ? 'bg-white/[0.07] text-white'
                        : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon className={cn('h-3.5 w-3.5 flex-shrink-0 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-current'
                    )} />
                    {!collapsed && (
                      <>
                        <span className="text-xs flex-1 truncate">{item.label}</span>
                        {isActive && <div className="h-1 w-1 rounded-full bg-indigo-400 flex-shrink-0" />}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Admin */}
        {isAdmin && (
          <div>
            {!collapsed && <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-2 mb-1.5">Admin</p>}
            {collapsed && <div className="h-px bg-white/[0.05] mx-2 my-1" />}
            <Link
              href="/dashboard/admin"
              title={collapsed ? 'Administration' : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-lg transition-all duration-150 group',
                collapsed ? 'px-2 py-2 justify-center' : 'px-2.5 py-2',
                pathname === '/dashboard/admin'
                  ? 'bg-white/[0.07] text-white'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.04]'
              )}
            >
              <Shield className="h-3.5 w-3.5 flex-shrink-0" />
              {!collapsed && <span className="text-xs">Administration</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/[0.05] p-2 flex-shrink-0 space-y-0.5">
        {collapsed ? (
          <button
            onClick={toggle}
            className="w-full flex justify-center py-2 text-white/20 hover:text-white/50 transition-colors"
            title="Ouvrir le menu"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-default">
            {user.image ? (
              <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase">
                  {(user.name || user.email || 'U')[0]}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/70 truncate">{user.name || 'Utilisateur'}</p>
              <p className="text-[10px] text-white/25 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Déconnexion' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-lg text-xs text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all',
            collapsed ? 'justify-center py-2 px-2' : 'px-2.5 py-2'
          )}
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
