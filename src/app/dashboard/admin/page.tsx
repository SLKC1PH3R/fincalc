'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Trash2, Users, Shield, Search, Database, AlertTriangle, Loader2,
  RotateCcw, Edit3, Check, X, ChevronDown, ChevronRight, Building2, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string; email: string; name: string | null; image: string | null
  createdAt: string; _count: { simulations: number }
}
interface DemoSim {
  id: string; type: string; name: string
  inputs: Record<string, unknown>; results: Record<string, unknown>; createdAt: string
}
interface DemoPosition {
  id: string; assetType: string; symbol: string; name: string; quantity: number; pru: number
}
interface DemoEnvelope {
  id: string; type: string; name: string; sortOrder: number
  metadata: Record<string, unknown>; positions: DemoPosition[]
}
interface DemoData {
  user: { id: string; email: string; createdAt: string }
  simulations: DemoSim[]
  envelopes: DemoEnvelope[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const SIM_COLORS: Record<string, string> = {
  compound: '#818cf8', dca: '#38bdf8', fire: '#f59e0b', buyrent: '#34d399',
  mortgage: '#fb923c', rental: '#f472b6', tax: '#a78bfa', 'flat-tax': '#60a5fa',
  'envelope-compare': '#34d399', retirement: '#f59e0b', 'savings-rate': '#818cf8', budget: '#fb923c',
}
const SIM_LABELS: Record<string, string> = {
  compound: 'Composés', dca: 'DCA', fire: 'FI/RE', buyrent: 'Achat/Loc',
  mortgage: 'Prêt', rental: 'Locatif', tax: 'Impôts', 'flat-tax': 'Flat Tax',
  'envelope-compare': 'PEA/CTO/AV', retirement: 'Retraite', 'savings-rate': 'Épargne', budget: 'Budget',
}
const ENV_COLORS: Record<string, string> = {
  PEA: '#818cf8', AV: '#fb923c', CTO: '#38bdf8', PER: '#a78bfa',
  LIVRET: '#34d399', IMMOBILIER: '#f472b6', CRYPTO: '#f59e0b', CASH: '#94a3b8',
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── JSON Editor Modal ──────────────────────────────────────────────────────────
function JsonModal({ title, value, onSave, onClose }: {
  title: string; value: unknown; onSave: (v: unknown) => void; onClose: () => void
}) {
  const [text, setText] = useState(JSON.stringify(value, null, 2))
  const [err, setErr] = useState('')
  const handleSave = () => {
    try { setErr(''); onSave(JSON.parse(text)) }
    catch { setErr('JSON invalide — vérifiez la syntaxe') }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, width: '100%', maxWidth: 660, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--section-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted-c)' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <textarea value={text} onChange={e => setText(e.target.value)} style={{
            width: '100%', minHeight: 320, fontFamily: 'monospace', fontSize: 12,
            background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)',
            border: `1px solid ${err ? '#ef4444' : 'var(--section-border)'}`, borderRadius: 8, padding: 12, resize: 'vertical', outline: 'none',
          }} />
          {err && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{err}</p>}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--section-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--section-border)', background: 'none', color: 'var(--text-muted-c)', cursor: 'pointer', fontSize: 13 }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#818cf8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} />Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EnvRow ─────────────────────────────────────────────────────────────────────
function EnvRow({ env, onDelete, onEdit }: { env: DemoEnvelope; onDelete: () => void; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  const color = ENV_COLORS[env.type] ?? '#94a3b8'
  const meta = env.metadata as Record<string, unknown>
  const val = meta.currentValue ?? meta.surrenderValue ?? meta.balance ?? null

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--section-border)' }}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
        style={{ background: 'rgba(255,255,255,0.01)' }} onClick={() => setOpen(p => !p)}>
        {open ? <ChevronDown size={13} style={{ color: 'var(--text-muted-c)', flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: 'var(--text-muted-c)', flexShrink: 0 }} />}
        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>{env.type}</span>
        <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>{env.name}</span>
        {typeof val === 'number' && <span style={{ fontSize: 12, color, fontWeight: 600, flexShrink: 0 }}>{val.toLocaleString('fr-FR')} €</span>}
        <span className="text-xs ml-2" style={{ color: 'var(--text-muted-c)', flexShrink: 0 }}>{env.positions.length} pos.</span>
        <button onClick={e => { e.stopPropagation(); onEdit() }} className="p-1 rounded" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted-c)' }} title="Éditer metadata"><Edit3 size={13} /></button>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Supprimer"><Trash2 size={13} /></button>
      </div>
      {open && env.positions.length > 0 && (
        <div className="px-3 pb-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {env.positions.map(pos => (
            <div key={pos.id} className="flex gap-2 py-1 text-xs border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <span style={{ color: 'var(--text-muted-c)', width: 48, flexShrink: 0 }}>{pos.assetType}</span>
              <span style={{ color: '#818cf8', width: 64, flexShrink: 0, fontWeight: 600 }}>{pos.symbol}</span>
              <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{pos.name}</span>
              <span style={{ color: 'var(--text-muted-c)' }}>{pos.quantity} × {pos.pru.toLocaleString('fr-FR')} €</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Demo data state
  const [demo, setDemo] = useState<DemoData | null>(null)
  const [loadingDemo, setLoadingDemo] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [activeTab, setActiveTab] = useState<'simulations' | 'patrimoine'>('simulations')
  const [modal, setModal] = useState<{ kind: 'sim' | 'env'; id: string; title: string; field: string; value: unknown } | null>(null)

  // Guard
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) router.replace('/dashboard')
  }, [session, status, router])

  // Load users
  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoadingUsers(false)
  }, [])
  useEffect(() => { loadUsers() }, [loadUsers])

  // Load demo data
  const loadDemo = useCallback(async () => {
    setLoadingDemo(true)
    try {
      const res = await fetch('/api/admin/demo')
      if (res.ok) setDemo(await res.json())
    } catch { /* ignore */ }
    setLoadingDemo(false)
  }, [])
  useEffect(() => { loadDemo() }, [loadDemo])

  // Delete user
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirmDelete !== userId) { setConfirmDelete(userId); return }
    setDeletingId(userId)
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
      if (!res.ok) { toast({ title: 'Erreur', description: (await res.json()).error, variant: 'destructive' }); return }
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast({ title: 'Utilisateur supprimé', description: `${userEmail} et ses données ont été supprimés.` })
    } catch { toast({ title: 'Erreur réseau', variant: 'destructive' }) }
    finally { setDeletingId(null); setConfirmDelete(null) }
  }

  // Reset demo
  const handleReset = async () => {
    setResetting(true); setConfirmReset(false)
    try {
      const res = await fetch('/api/admin/demo/reset', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: `✅ Données réinitialisées — ${json.simulations} simulations, ${json.envelopes} enveloppes, ${json.positions} positions` })
      await loadDemo()
    } catch (e) { toast({ title: 'Erreur reset', description: String(e), variant: 'destructive' }) }
    finally { setResetting(false) }
  }

  // Delete sim
  const handleDeleteSim = async (id: string) => {
    const res = await fetch(`/api/admin/demo/simulations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDemo(d => d ? { ...d, simulations: d.simulations.filter(s => s.id !== id) } : d)
      toast({ title: 'Simulation supprimée' })
    }
  }

  // Delete envelope
  const handleDeleteEnv = async (id: string) => {
    const res = await fetch(`/api/admin/demo/envelopes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDemo(d => d ? { ...d, envelopes: d.envelopes.filter(e => e.id !== id) } : d)
      toast({ title: 'Enveloppe supprimée' })
    }
  }

  // Save modal
  const handleSaveModal = async (value: unknown) => {
    if (!modal) return
    const url = modal.kind === 'sim'
      ? `/api/admin/demo/simulations/${modal.id}`
      : `/api/admin/demo/envelopes/${modal.id}`
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [modal.field]: value }) })
    if (res.ok) {
      const updated = await res.json()
      if (modal.kind === 'sim') setDemo(d => d ? { ...d, simulations: d.simulations.map(s => s.id === modal.id ? { ...s, ...updated } : s) } : d)
      else setDemo(d => d ? { ...d, envelopes: d.envelopes.map(e => e.id === modal.id ? { ...e, ...updated } : e) } : d)
      toast({ title: modal.kind === 'sim' ? 'Simulation mise à jour' : 'Enveloppe mise à jour' })
    }
    setModal(null)
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || '').toLowerCase().includes(search.toLowerCase())
  )
  const totalSims = users.reduce((s, u) => s + u._count.simulations, 0)

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 p-5 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">Gestion des utilisateurs et des données démo</p>
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
              <CardDescription>Cliquez deux fois sur Supprimer pour confirmer</CardDescription>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
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
                  {filtered.map(user => {
                    const isMe = user.email === session?.user?.email
                    const isConfirming = confirmDelete === user.id
                    const isDeleting = deletingId === user.id
                    return (
                      <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {user.image
                              ? <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                              : <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0"><span className="text-[11px] font-semibold">{(user.name || user.email)[0].toUpperCase()}</span></div>
                            }
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">{user.name || <span className="text-muted-foreground italic">Sans nom</span>}{isMe && <span className="ml-1.5 text-[10px] text-muted-foreground">(vous)</span>}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-center"><span className="text-sm font-medium">{user._count.simulations}</span></td>
                        <td className="px-4 py-3 text-right">
                          {!isMe ? (
                            <>
                              <Button variant={isConfirming ? 'destructive' : 'ghost'} size="sm"
                                className={cn('h-7 text-xs gap-1.5', !isConfirming && 'text-muted-foreground hover:text-destructive')}
                                disabled={isDeleting} onClick={() => handleDeleteUser(user.id, user.email)}>
                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <>{isConfirming && <AlertTriangle className="h-3.5 w-3.5" />}{!isConfirming && <Trash2 className="h-3.5 w-3.5" />}{isConfirming ? 'Confirmer' : 'Supprimer'}</>}
                              </Button>
                              {isConfirming && <button onClick={() => setConfirmDelete(null)} className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors">Annuler</button>}
                            </>
                          ) : <span className="text-xs text-muted-foreground px-3">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Demo Management ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-400" />
                Données Démo
              </CardTitle>
              <CardDescription>
                {demo ? `${demo.simulations.length} simulations · ${demo.envelopes.length} enveloppes · ${demo.envelopes.reduce((a, e) => a + e.positions.length, 0)} positions` : 'Chargement…'}
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={loadDemo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted-c)', padding: 6 }}><RefreshCw size={14} /></button>
              {confirmReset ? (
                <>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirmReset(false)}>Annuler</Button>
                  <Button size="sm" variant="destructive" className="h-8 text-xs gap-1.5" disabled={resetting} onClick={handleReset}>
                    {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    {resetting ? 'Réinitialisation…' : 'Confirmer reset'}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-red-400 border-red-400/30 hover:bg-red-400/10" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="h-3.5 w-3.5" />Reset données démo
                </Button>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
            {(['simulations', 'patrimoine'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: activeTab === tab ? 'rgba(129,140,248,0.15)' : 'none',
                color: activeTab === tab ? '#818cf8' : 'var(--text-muted-c)',
              }}>
                {tab === 'simulations' ? `Simulations (${demo?.simulations.length ?? '…'})` : `Patrimoine (${demo?.envelopes.length ?? '…'})`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loadingDemo ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !demo ? (
            <p className="text-sm text-muted-foreground text-center py-4">Compte démo non trouvé. Lancez un reset pour l&apos;initialiser.</p>
          ) : activeTab === 'simulations' ? (
            <div className="space-y-1.5">
              {demo.simulations.map(sim => {
                const color = SIM_COLORS[sim.type] ?? '#94a3b8'
                return (
                  <div key={sim.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--section-border)', background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>{SIM_LABELS[sim.type] ?? sim.type}</span>
                    <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }}>{sim.name}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted-c)' }}>{fmtDate(sim.createdAt)}</span>
                    <button onClick={() => setModal({ kind: 'sim', id: sim.id, title: `Inputs — ${sim.name}`, field: 'inputs', value: sim.inputs })} title="Éditer inputs" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted-c)', padding: 4 }}><Edit3 size={13} /></button>
                    <button onClick={() => handleDeleteSim(sim.id)} title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={13} /></button>
                  </div>
                )
              })}
              {demo.simulations.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune simulation. Réinitialisez les données démo.</p>}
            </div>
          ) : (
            <div className="space-y-1.5">
              {demo.envelopes.map(env => (
                <EnvRow key={env.id} env={env}
                  onDelete={() => handleDeleteEnv(env.id)}
                  onEdit={() => setModal({ kind: 'env', id: env.id, title: `Metadata — ${env.name}`, field: 'metadata', value: env.metadata })}
                />
              ))}
              {demo.envelopes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Aucune enveloppe. Réinitialisez les données démo.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Modal */}
      {modal && <JsonModal title={modal.title} value={modal.value} onSave={handleSaveModal} onClose={() => setModal(null)} />}
    </div>
  )
}
