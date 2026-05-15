'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import { type ReactNode, useState, useEffect } from 'react'
import { PanelLeftOpen, Search, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { NotificationCenter } from './NotificationCenter'
import { PatrimoLogo } from '@/components/PatrimoLogo'
import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'

interface MarketIndex { label: string; symbol: string; price: number; changePct: number; isRate?: boolean }

function TickerBar({ indices }: { indices: MarketIndex[] }) {
  if (indices.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingRight: 14, borderRight: '1px solid var(--p-line)', flexShrink: 0, marginRight: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--p-green)', boxShadow: '0 0 7px var(--p-green)' }} />
        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--p-green)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'var(--p-mono)' }}>Live</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', gap: 0 }}>
        {indices.map((m, i) => {
          const pos = m.changePct >= 0
          const color = m.isRate ? 'var(--p-blue)' : pos ? 'var(--p-green)' : 'var(--p-red)'
          return (
            <div key={m.symbol} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: i < indices.length - 1 ? '1px solid var(--p-line)' : undefined, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--p-text-dim)', fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-em)', fontFamily: 'var(--p-mono)', letterSpacing: '-0.02em' }}>
                {m.isRate ? `${m.price}%` : m.price >= 10000 ? `${(m.price / 1000).toFixed(1)}k` : m.price >= 1000 ? m.price.toFixed(0) : m.price.toFixed(2)}
              </span>
              {!m.isRate && (
                <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: 'var(--p-mono)' }}>
                  {pos ? '+' : ''}{m.changePct.toFixed(2)}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const OnboardingWizard = dynamic(() => import('./OnboardingWizard').then(m => m.OnboardingWizard), { ssr: false })
const CommandPalette = dynamic(() => import('./CommandPalette').then(m => m.CommandPalette), { ssr: false })


export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar()
  const [showWizard, setShowWizard] = useState(false)
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.onboardingDone === false) setShowWizard(true)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/portfolio/prices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: [] }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.indices) setIndices(d.indices) })
      .catch(() => {})
  }, [])

  const userInitial = (session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()
  const userName = session?.user?.name || session?.user?.email || 'Utilisateur'

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden transition-all duration-200 grid-bg" style={{ minWidth: 0 }}>

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

        {/* Left: toggle + live ticker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button onClick={toggle}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--p-line-2)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-dim)', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--p-row-hover)'; e.currentTarget.style.color = 'var(--p-text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-dim)' }}>
            <PanelLeftOpen className="h-4 w-4" />
          </button>
          <TickerBar indices={indices} />
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,106,74,0.30)'; e.currentTarget.style.color = 'var(--p-text)' }}
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
                style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(201,106,74,0.25)' }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a84f35, #d4856a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(201,106,74,0.30)',
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
