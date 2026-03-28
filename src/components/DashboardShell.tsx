'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import { type ReactNode, useState, useEffect } from 'react'
import { PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import { NotificationCenter } from './NotificationCenter'
import { PatrimoLogo } from '@/components/PatrimoLogo'
import dynamic from 'next/dynamic'

const OnboardingWizard = dynamic(() => import('./OnboardingWizard').then(m => m.OnboardingWizard), { ssr: false })
const CommandPalette = dynamic(() => import('./CommandPalette').then(m => m.CommandPalette), { ssr: false })

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar()
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    // Check if onboarding is needed
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.onboardingDone === false) {
          setShowWizard(true)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className={cn(
      'flex-1 h-full flex flex-col overflow-hidden transition-all duration-200 grid-bg',
      collapsed ? 'md:ml-16 ml-0' : 'md:ml-[290px] ml-0'
    )} style={{ background: 'var(--content-bg)' }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ background: 'var(--sb-bg)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <button onClick={toggle} style={{ color: 'var(--sb-text-dim)' }} className="transition-colors">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <PatrimoLogo width={110} uid="shell" />
          </Link>
        </div>
        <NotificationCenter />
      </div>

      {/* Desktop notification bell — fixed top-right */}
      <div className="hidden md:block" style={{ position: 'fixed', top: 14, right: 18, zIndex: 50 }}>
        <NotificationCenter />
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-hidden dashboard-main">
        {children}
      </main>

      {/* First-connection onboarding wizard */}
      {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}
      {/* Command Palette ⌘K */}
      <CommandPalette />
    </div>
  )
}
