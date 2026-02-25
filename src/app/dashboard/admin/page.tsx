'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, Users, Shield, Search, Database, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: string
  _count: { simulations: number }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Client-side admin guard
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.replace('/dashboard')
    }
  }, [session, status])

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const handleDelete = async (userId: string, userEmail: string) => {
    if (confirmDelete !== userId) {
      setConfirmDelete(userId)
      return
    }
    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast({ title: 'Erreur', description: err.error, variant: 'destructive' })
        return
      }
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast({ title: 'Utilisateur supprimé', description: `${userEmail} et ses données ont été supprimés.` })
    } catch {
      toast({ title: 'Erreur réseau', variant: 'destructive' })
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalSims = users.reduce((s, u) => s + u._count.simulations, 0)

  if (status === 'loading' || (session && session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL && loading)) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">Gestion des utilisateurs — accès restreint</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Utilisateurs', value: users.length, icon: Users },
          { label: 'Simulations totales', value: totalSims, icon: Database },
          { label: 'Moy. simulations/user', value: users.length ? (totalSims / users.length).toFixed(1) : '0', icon: Database },
        ].map((k, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5"><k.icon className="h-3.5 w-3.5" />{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Utilisateurs ({filtered.length})</CardTitle>
              <CardDescription>Cliquez sur Supprimer une deuxième fois pour confirmer</CardDescription>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden mx-6 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Utilisateur</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Inscrit le</th>
                    <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Simulations</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const isMe = user.email === session?.user?.email
                    const isConfirming = confirmDelete === user.id
                    const isDeleting = deletingId === user.id
                    return (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {user.image ? (
                              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-semibold">{(user.name || user.email)[0].toUpperCase()}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">
                                {user.name || <span className="text-muted-foreground italic">Sans nom</span>}
                                {isMe && <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(vous)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium">{user._count.simulations}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isMe ? (
                            <Button
                              variant={isConfirming ? 'destructive' : 'ghost'}
                              size="sm"
                              className={cn('h-7 text-xs gap-1.5', !isConfirming && 'text-muted-foreground hover:text-destructive')}
                              disabled={isDeleting}
                              onClick={() => handleDelete(user.id, user.email)}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  {isConfirming && <AlertTriangle className="h-3.5 w-3.5" />}
                                  {!isConfirming && <Trash2 className="h-3.5 w-3.5" />}
                                  {isConfirming ? 'Confirmer' : 'Supprimer'}
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-3">—</span>
                          )}
                          {isConfirming && (
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
