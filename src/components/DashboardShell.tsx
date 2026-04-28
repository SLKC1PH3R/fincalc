'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import { type ReactNode, useState, useEffect } from 'react'
import { PanelLeftOpen, Search, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { NotificationCenter } from './NotificationCenter'
import { PatrimoLogo } from '@/components/PatrimoLogo'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'

const OnboardingWizard = dynamic(() => import('./OnboardingWizard').then(m => m.OnboardingWizard), { ssr: false })
const CommandPalette = dynamic(() => import('./CommandPalette').then(m => m.CommandPalette), { ssr: false })

// ── Page title resolver ───────────────────────────────────────────────────────
function usePageTitle(pathname: string): string {
  const segments: Record<string, string> = {
    '/dashboard': 'Vue d\'ensemble',
    '/dashboard/patrimoine': 'Patrimoine',
    '/dashboard/patrimoine/immobilier': 'Immobilier',
    '/dashboard/patrimoine/actions': 'Actions & Fonds',
    '/dashboard/patrimoine/livrets': 'Livrets',
    '/dashboard/patrimoine/autres': 'Autres actifs',
    '/dashboard/patrimoine/comptes': 'Comptes bancaires',
    '/dashboard/patrimoine/emprunts': 'Emprunts',
    '/dashboard/simulateurs': 'Simulateurs',
    '/dashboard/compound': 'Intérêts composés',
    '/dashboard/dca': 'DCA',
    '/dashboard/fire': 'FI/RE',
    '/dashboard/mortgage': 'Prêt immobilier',
    '/dashboard/buyrent': 'Acheter vs Louer',
    '/dashboard/rental': 'Locatif',
    '/dashboard/tax': 'Impôts IR',
    '/dashboard/flat-tax': 'Flat Tax vs Barème',
    '/dashboard/retirement': 'Retraite',
    '/dashboard/savings-rate': 'Taux d\'épargne',
    '/dashboard/budget': 'Budget 50/30/20',
    '/dashboard/emergency-fund': 'Épargne urgence',
    '/dashboard/envelope-compare': 'PEA vs CTO vs AV',
    '/dashboard/succession': 'Succession',
    '/dashboard/inflation': 'Inflation',
    '/dashboard/frais': 'Impact des frais',
    '/dashboard/livrets': 'Livrets réglementés',
    '/dashboard/plusvalue': 'Plus-value immo.',
    '/dashboard/scpi': 'SCPI',
    '/dashboard/viager': 'Viager',
    '/dashboard/dividends': 'Revenus passifs',
    '/dashboard/consumer-credit': 'Crédit conso',
    '/dashboard/score': 'Score Patrimonial',
    '/dashboard/calendar': 'Calendrier financier',
    '/dashboard/marche': 'Marchés & Actifs',
    '/dashboard/marche/etf': 'ETF',
    '/dashboard/history': 'Historique',
    '/dashboard/portfolio': 'Portefeuille',
    '/dashboard/profil': 'Mon profil',
    '/dashboard/settings': 'Paramètres',
    '/dashboard/goals': 'Objectifs',
    '/dashboard/benchmark': 'Benchmarks',
    '/dashboard/transactions': 'Carnet d\'ordres',
    '/dashboard/rebalancing': 'Rééquilibrage',
    '/dashboard/gestion': 'Gestion',
  }
  // patrimoine sub-pages (dynamic [id])
  if (pathname.startsWith('/dashboard/patrimoine/') && !Object.keys(segments).includes(pathname)) {
    return 'Détail enveloppe'
  }
  return segments[pathname] || 'Dashboard'
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar()
  const [showWizard, setShowWizard] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  const pageTitle = usePageTitle(pathname)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.onboardingDone === false) setShowWizard(true)
      })
      .catch(() => {})
  }, [])

  const userInitial = (session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()
  const userName = session?.user?.name || session?.user?.email || 'Utilisateur'

  return (
    <div className={cn(
      'flex-1 h-full flex flex-col overflow-hidden transition-all duration-200 grid-bg',
      collapsed ? 'md:ml-[64px] ml-0' : 'md:ml-[290px] ml-0'
    )}>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ background: 'var(--p-bg)', borderBottom: '1px solid var(--p-line)' }}>
        <div className="flex items-center gap-3">
          <button onClick={toggle} style={{ color: 'var(--p-text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <PatrimoLogo width={110} uid="shell-mob" variant={theme === 'dark' ? 'dark' : 'light'} />
          </Link>
        </div>
        <NotificationCenter />
      </div>

      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex flex-shrink-0 items-center justify-between px-6"
        style={{
          height: 65,
          background: 'var(--p-card)',
          borderBottom: '1px solid var(--p-line)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: 16,
          boxShadow: '0 1px 0 var(--p-line)',
        }}>

        {/* Left: page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={toggle}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--p-line-2)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-dim)', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--p-row-hover)'; e.currentTarget.style.color = 'var(--p-text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-dim)' }}>
            <PanelLeftOpen className="h-4 w-4" />
          </button>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-em)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Geist', system-ui, sans-serif" }}>
            {pageTitle}
          </h2>
        </div>

        {/* Right: search + notifications + user */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Search button */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            className="hidden lg:flex items-center gap-2"
            style={{
              height: 36, padding: '0 12px',
              borderRadius: 8,
              border: '1px solid var(--p-line-2)',
              background: 'var(--p-card-2)',
              cursor: 'pointer', gap: 8,
              color: 'var(--p-text-dim)',
              fontSize: 13,
              transition: 'all 0.15s',
              minWidth: 180,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--p-gold-30)'; e.currentTarget.style.color = 'var(--p-text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--p-line-2)'; e.currentTarget.style.color = 'var(--p-text-dim)' }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span style={{ flex: 1, textAlign: 'left' }}>Recherche rapide…</span>
            <span className="flex gap-1">
              {['⌘', 'K'].map(k => (
                <kbd key={k} style={{ fontSize: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line-2)', borderRadius: 4, padding: '0 4px', fontFamily: 'inherit', color: 'var(--p-text-faint)' }}>{k}</kbd>
              ))}
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: '1px solid var(--p-line-2)',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--p-text-dim)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--p-row-hover)'; e.currentTarget.style.color = 'var(--p-text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-dim)' }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'var(--p-line)' }} />

          {/* User avatar */}
          <Link href="/dashboard/profil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
            {session?.user?.image ? (
              <img src={session.user.image} alt={userName}
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(176,120,32,0.25)' }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5E18, #D4A24C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--p-gold-30)',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{userInitial}</span>
              </div>
            )}
            <div className="hidden xl:block" style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)', margin: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user?.name || 'Utilisateur'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>Membre</p>
            </div>
          </Link>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-0 overflow-auto dashboard-main">
        {children}
      </main>

      {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}
      <CommandPalette />
    </div>
  )
}
