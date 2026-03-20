import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider } from '@/components/SidebarContext'
import { DashboardShell } from '@/components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || '/dashboard'
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
  }

  const isAdmin = session.user.email === process.env.ADMIN_EMAIL
  const isDemo = session.user.email === 'demo@digitalstack.cloud'

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar user={session.user} isAdmin={isAdmin} isDemo={isDemo} />
        <DashboardShell>{children}</DashboardShell>
      </div>
    </SidebarProvider>
  )
}
