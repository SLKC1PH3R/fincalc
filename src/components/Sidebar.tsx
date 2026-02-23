'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { TrendingUp, Flame, Receipt, Home, Building2, History, LogOut, ChevronRight, Wallet, PiggyBank, RefreshCw, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_SECTIONS = [
  {
    title: 'Épargne & Investissement',
    items: [
      { href: '/dashboard', label: 'Intérêts Composés', icon: TrendingUp },
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
      { href: '/dashboard/retirement', label: 'Simulateur Retraite', icon: PiggyBank },
    ]
  },
  {
    title: 'Budget',
    items: [
      { href: '/dashboard/budget', label: 'Budget 50/30/20', icon: Calculator },
      { href: '/dashboard/history', label: 'Historique', icon: History },
    ]
  },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 border-r border-border bg-background flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-foreground flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="font-semibold text-sm tracking-tight">FinCalc</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-[0.62rem] font-medium text-muted-foreground uppercase tracking-widest px-2 mb-1">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors group',
                      isActive
                        ? 'bg-accent text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                    <span className="truncate text-xs">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3 space-y-1 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-foreground uppercase">
              {(user.name || user.email || 'U')[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{user.name || 'Utilisateur'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
