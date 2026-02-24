'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { PanelLeftOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar()

  return (
    <div className={cn(
      'flex-1 min-h-screen flex flex-col transition-all duration-200',
      collapsed ? 'md:ml-14 ml-0' : 'md:ml-56 ml-0'
    )}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 flex-shrink-0 border-b border-white/[0.05]"
        style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="text-white/40 hover:text-white transition-colors">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)' }}>
              <TrendingUp className="h-3 w-3" style={{ color: '#f1c086' }} />
            </div>
            <span className="font-bold text-white" style={{ fontSize: 14, letterSpacing: '-0.02em' }}>FinCalc</span>
          </Link>
        </div>
      </div>

      {/* Main content — full bleed, no max-width */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
