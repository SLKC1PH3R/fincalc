'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { TrendingUp, Calculator, Flame, Receipt, Home, Building2, History, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Intérêts Composés', icon: TrendingUp, emoji: '🏦' },
  { href: '/dashboard/fire', label: 'FI/RE', icon: Flame, emoji: '🔥' },
  { href: '/dashboard/tax', label: 'Impôts', icon: Receipt, emoji: '🧮' },
  { href: '/dashboard/buyrent', label: 'Acheter vs Louer', icon: Home, emoji: '🏠' },
  { href: '/dashboard/mortgage', label: 'Prêt Immobilier', icon: Building2, emoji: '🏦' },
  { href: '/dashboard/history', label: 'Historique', icon: History, emoji: '📊' },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-1.5 border border-gold/30 bg-gold/5">
            <TrendingUp className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-gold">FinCalc</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest">// Finance Tools</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase px-2 py-2">Calculateurs</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 font-mono text-xs tracking-wide transition-all group',
                isActive
                  ? 'bg-gold/10 text-gold border-l-2 border-gold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent'
              )}
            >
              <item.icon className={cn('h-3.5 w-3.5 flex-shrink-0', isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-foreground')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-7 w-7 bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs text-foreground truncate">{user.name || 'Utilisateur'}</p>
            <p className="font-mono text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
