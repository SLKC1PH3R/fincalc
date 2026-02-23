import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={session.user} />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <header className="h-14 border-b border-border flex items-center px-6 sticky top-0 bg-background z-30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Finance personnelle</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
