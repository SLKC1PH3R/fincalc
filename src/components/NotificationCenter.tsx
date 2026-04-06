'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, TrendingUp, PiggyBank, Clock, CheckCircle2, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

function fmt(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

type NotifType = 'warning' | 'success' | 'info'

interface Notification {
  id: string
  type: NotifType
  title: string
  description: string
  href?: string
}

const TYPE_STYLE: Record<NotifType, { color: string; Icon: React.ComponentType<{ style?: React.CSSProperties }> }> = {
  warning: { color: '#fbbf24', Icon: TrendingUp },
  success: { color: '#34d399', Icon: CheckCircle2 },
  info:    { color: '#818cf8', Icon: Clock },
}

async function fetchNotifications(): Promise<Notification[]> {
  const [envelopes, simulations] = await Promise.all([
    fetch('/api/patrimoine/envelopes').then(r => r.ok ? r.json() : []).catch(() => []),
    fetch('/api/simulations').then(r => r.ok ? r.json() : []).catch(() => []),
  ])

  const notifs: Notification[] = []

  // ── PEA plafond ──────────────────────────────────────────────────────────
  for (const env of envelopes as Record<string, unknown>[]) {
    if (env.type !== 'PEA') continue
    const meta = (env.metadata ?? {}) as Record<string, unknown>
    const deposited = Number(meta.totalDeposited ?? 0)
    if (deposited >= 150_000) {
      notifs.push({
        id: `pea_cap_${env.id}`,
        type: 'warning',
        title: `PEA "${env.name}" — plafond atteint`,
        description: `Vous avez versé ${fmt(deposited)} sur ce PEA. Aucun nouveau versement possible (plafond légal 150 000€).`,
        href: `/dashboard/patrimoine/${env.id}`,
      })
    } else if (deposited >= 120_000) {
      notifs.push({
        id: `pea_near_${env.id}`,
        type: 'warning',
        title: `PEA "${env.name}" — proche du plafond`,
        description: `${fmt(deposited)} versés · il reste ${fmt(150_000 - deposited)} avant le plafond de 150 000€.`,
        href: `/dashboard/patrimoine/${env.id}`,
      })
    }
  }

  // ── Livret A / LDDS / LEP plein ──────────────────────────────────────────
  for (const env of envelopes as Record<string, unknown>[]) {
    if (env.type !== 'LIVRET') continue
    const meta = (env.metadata ?? {}) as Record<string, unknown>
    const balance = Number(meta.balance ?? 0)
    const maxBalance = Number(meta.maxBalance ?? 0)
    if (maxBalance > 0 && balance >= maxBalance * 0.95) {
      const pct = Math.round((balance / maxBalance) * 100)
      notifs.push({
        id: `livret_full_${env.id}`,
        type: 'success',
        title: `"${env.name}" plein à ${pct}%`,
        description: `${fmt(balance)} / ${fmt(maxBalance)} — Chaque euro supplémentaire peut être investi.`,
        href: `/dashboard/patrimoine/${env.id}`,
      })
    }
  }

  // ── Simulations non mises à jour depuis 6 mois ──────────────────────────
  const sixMonthsAgo = Date.now() - 180 * 24 * 3600 * 1000
  const oldSims = (simulations as Record<string, unknown>[]).filter(s => {
    const d = new Date(String(s.updatedAt ?? s.createdAt)).getTime()
    return d < sixMonthsAgo
  })
  if (oldSims.length > 0) {
    notifs.push({
      id: 'stale_simulations',
      type: 'info',
      title: `${oldSims.length} simulation${oldSims.length > 1 ? 's' : ''} à actualiser`,
      description: `Ces simulations n'ont pas été mises à jour depuis plus de 6 mois. Vos hypothèses ont peut-être changé.`,
      href: '/dashboard/history',
    })
  }

  return notifs
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications().then(n => { setNotifs(n); setLoaded(true) })
  }, [])

  // Load dismissed ids from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('notifs_dismissed') ?? '[]') as string[]
      setDismissed(new Set(saved))
    } catch {}
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('notifs_dismissed', JSON.stringify([...next]))
      return next
    })
  }

  const visible = notifs.filter(n => !dismissed.has(n.id))
  const count = visible.length

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, zIndex: 10001, isolation: 'isolate' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          width: 34, height: 34,
          borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: '1px solid',
          borderColor: open ? 'rgba(255,255,255,0.12)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s',
          color: count > 0 ? '#f1c086' : 'var(--text-muted-c)',
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' } }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 16, height: 16 }} />
        {loaded && count > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: '#f87171',
            border: '1.5px solid var(--sb-bg)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, maxHeight: 480,
          background: '#1a1d27',
          border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.70)',
          zIndex: 10002,
          isolation: 'isolate',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--section-border)' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>Notifications</span>
            {count > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '1px 7px' }}>
                {count} nouvelle{count > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!loaded ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted-c)', fontSize: 12 }}>Chargement…</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <CheckCircle2 style={{ width: 24, height: 24, color: '#34d399', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-em)', fontWeight: 500 }}>Tout est en ordre</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 4 }}>Aucune alerte pour le moment.</p>
              </div>
            ) : (
              visible.map(n => {
                const { color, Icon } = TYPE_STYLE[n.type]
                return (
                  <div key={n.id} style={{ display: 'flex', gap: 10, padding: '12px 14px 12px 14px', borderBottom: '1px solid var(--section-border)', alignItems: 'flex-start' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon style={{ width: 14, height: 14, color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 2 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{n.description}</p>
                      {n.href && (
                        <Link href={n.href} onClick={() => setOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, fontSize: 11, fontWeight: 600, color, textDecoration: 'none' }}>
                          Voir <ChevronRight style={{ width: 11, height: 11 }} />
                        </Link>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(n.id)}
                      style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', flexShrink: 0, borderRadius: 4, marginTop: 2 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted-c)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--section-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => visible.forEach(n => dismiss(n.id))}
                style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted-c)')}
              >
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
