'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn('flex-1 min-h-screen transition-all duration-200', collapsed ? 'ml-14' : 'ml-56')}>
      <main className="p-8 max-w-screen-xl">
        {children}
      </main>
    </div>
  )
}
