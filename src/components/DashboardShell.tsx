'use client'
import { useSidebar } from './SidebarContext'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()
  return (
    <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-200', collapsed ? 'ml-14' : 'ml-56')}>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
