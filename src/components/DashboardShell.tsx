'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { PanelLeftOpen, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { NotificationCenter } from './NotificationCenter'

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebar()

  return (
    <div className={cn(
      'flex-1 min-h-screen flex flex-col transition-all duration-200',
      collapsed ? 'md:ml-16 ml-0' : 'md:ml-[290px] ml-0'
    )} style={{ background: 'var(--content-bg)' }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 flex-shrink-0"
        style={{ background: 'var(--sb-bg)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3">
          <button onClick={toggle} style={{ color: 'var(--sb-text-dim)' }} className="transition-colors">
            <PanelLeftOpen className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #c8922a, #f1c086)' }}>
              <TrendingUp className="h-3 w-3" style={{ color: '#0a0a0a' }} />
            </div>
            <span className="font-bold" style={{ fontSize: 14, letterSpacing: '-0.02em', color: 'var(--sb-text-strong)' }}>FinCalc</span>
          </Link>
        </div>
        <NotificationCenter />
      </div>

      {/* Desktop notification bell — fixed top-right */}
      <div className="hidden md:block" style={{ position: 'fixed', top: 14, right: 18, zIndex: 50 }}>
        <NotificationCenter />
      </div>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
