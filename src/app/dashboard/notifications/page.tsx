'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  TrendingUp, AlertTriangle, Calendar, Award, Target,
  PiggyBank, Shield, Info, ChevronRight, Settings,
  TrendingDown, Flame, BarChart3, RefreshCw, X,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type NotifCategory = 'all' | 'portfolio' | 'budget' | 'calendar' | 'score' | 'alert'
type NotifPriority = 'high' | 'medium' | 'low'

interface Notification {
  id: string
  title: string
  body: string
  category: Exclude<NotifCategory, 'all'>
  priority: NotifPriority
  timestamp: Date
  read: boolean
  href?: string
  icon: 'trending-up' | 'trending-down' | 'alert' | 'calendar' | 'score' | 'budget' | 'shield' | 'fire' | 'chart' | 'refresh' | 'info'
}

interface PrefToggle {
  key: string
  label: string
  detail: string
  enabled: boolean
}

// ── Static seed notifications ─────────────────────────────────────────────────

const SEED: Omit<Notification, 'id'>[] = [
  {
    title: 'Rééquilibrage recommandé',
    body: 'Votre allocation Actions a dérivé de +8% par rapport à votre cible. Rééquilibrer maintenant pour rester dans la zone optimale.',
    category: 'portfolio',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    read: false,
    href: '/dashboard/rebalancing',
    icon: 'refresh',
  },
  {
    title: 'Dividende prévu — ETF World',
    body: 'IWDA ex-date dans 12 jours (11 mai). Montant estimé : 0,42 €/part selon le dernier versement.',
    category: 'calendar',
    priority: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    href: '/dashboard/calendar',
    icon: 'calendar',
  },
  {
    title: 'Score patrimonial amélioré',
    body: 'Votre score est passé de 68 à 74/100 ce mois-ci. Poste gagnant : diversification géographique.',
    category: 'score',
    priority: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: false,
    href: '/dashboard/score',
    icon: 'score',
  },
  {
    title: 'Objectif épargne atteint',
    body: "Vous avez atteint 100% de votre objectif d'épargne mensuel (1 200 €). Excellent travail !",
    category: 'budget',
    priority: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    href: '/dashboard/budget',
    icon: 'budget',
  },
  {
    title: 'Résultats Apple — demain',
    body: 'AAPL publie ses résultats trimestriels demain après la clôture US. Consensus : BPA 1,57 $.',
    category: 'calendar',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26),
    read: true,
    href: '/dashboard/calendar',
    icon: 'chart',
  },
  {
    title: 'PEA — seuil 5 ans approche',
    body: 'Votre PEA Fortuneo atteint le seuil des 5 ans dans 3 mois. Anticipez les retraits pour optimiser la fiscalité.',
    category: 'alert',
    priority: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    href: '/dashboard/tax-report',
    icon: 'shield',
  },
  {
    title: 'Inflation mensuelle publiée',
    body: "L'INSEE publie l'IPC de mars à +0,2% sur le mois, +2,3% sur un an. Impact sur le pouvoir d'achat de vos liquidités.",
    category: 'alert',
    priority: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: true,
    href: '/dashboard/inflation',
    icon: 'alert',
  },
  {
    title: 'Livret A — taux stable',
    body: 'Le taux du Livret A reste à 2,4% jusqu\'au 31 juillet 2026. Votre allocation livrets reste optimale.',
    category: 'alert',
    priority: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96),
    read: true,
    href: '/dashboard/livrets',
    icon: 'info',
  },
  {
    title: 'Taux d\'épargne en baisse',
    body: "Votre taux d'épargne de ce mois est de 18%, en baisse vs votre moyenne de 22%. Catégorie hors budget : Restaurants (+340 €).",
    category: 'budget',
    priority: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120),
    read: true,
    href: '/dashboard/savings-rate',
    icon: 'trending-down',
  },
  {
    title: 'Résultats LVMH — dans 5 jours',
    body: 'MC.PA annonce ses résultats le 5 mai. Suivez l\'impact sur votre exposition Europe de la Large Cap.',
    category: 'calendar',
    priority: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 144),
    read: true,
    href: '/dashboard/calendar',
    icon: 'calendar',
  },
]

const DEFAULT_PREFS: PrefToggle[] = [
  { key: 'portfolio',  label: 'Portefeuille & Rééquilibrage', detail: "Dérives d'allocation, seuils, performances",   enabled: true  },
  { key: 'calendar',  label: 'Calendrier financier',          detail: 'Dividendes, résultats, splits à venir',        enabled: true  },
  { key: 'budget',    label: 'Budget & Épargne',              detail: 'Objectifs, dépassements, taux mensuels',       enabled: true  },
  { key: 'score',     label: 'Score patrimonial',             detail: 'Évolutions de score, recommandations',         enabled: true  },
  { key: 'alert',     label: 'Alertes fiscales & macro',      detail: 'Fiscalité, inflation, taux directeurs',        enabled: false },
]

// ── Icon resolver ─────────────────────────────────────────────────────────────

function NotifIcon({ icon, priority }: { icon: Notification['icon']; priority: NotifPriority }) {
  const colors: Record<NotifPriority, { bg: string; border: string; color: string }> = {
    high:   { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
    medium: { bg: 'rgba(176,120,32,0.10)',  border: 'rgba(176,120,32,0.25)',  color: '#B07820' },
    low:    { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.20)', color: '#94a3b8' },
  }
  const { bg, border, color } = colors[priority]
  const size = 15

  const icons: Record<Notification['icon'], JSX.Element> = {
    'trending-up':   <TrendingUp   width={size} height={size} />,
    'trending-down': <TrendingDown width={size} height={size} />,
    'alert':         <AlertTriangle width={size} height={size} />,
    'calendar':      <Calendar     width={size} height={size} />,
    'score':         <Award        width={size} height={size} />,
    'budget':        <PiggyBank    width={size} height={size} />,
    'shield':        <Shield       width={size} height={size} />,
    'fire':          <Flame        width={size} height={size} />,
    'chart':         <BarChart3    width={size} height={size} />,
    'refresh':       <RefreshCw   width={size} height={size} />,
    'info':          <Info         width={size} height={size} />,
  }

  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: bg, border: `1px solid ${border}`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icons[icon]}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ts: Date): string {
  const diff = Math.floor((Date.now() - ts.getTime()) / 1000)
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return `Il y a ${Math.floor(diff / 86400)} j`
}

const CATEGORY_LABELS: Record<Exclude<NotifCategory, 'all'>, string> = {
  portfolio: 'Portefeuille',
  budget:    'Budget',
  calendar:  'Calendrier',
  score:     'Score',
  alert:     'Alerte',
}

const CATEGORY_COLORS: Record<Exclude<NotifCategory, 'all'>, string> = {
  portfolio: '#818cf8',
  budget:    '#34d399',
  calendar:  '#B07820',
  score:     '#f472b6',
  alert:     '#f87171',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs]     = useState<Notification[]>(() =>
    SEED.map((n, i) => ({ ...n, id: String(i) }))
  )
  const [filter, setFilter]       = useState<NotifCategory>('all')
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefs, setPrefs]         = useState<PrefToggle[]>(DEFAULT_PREFS)

  const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs])

  const visible = useMemo(() =>
    notifs.filter(n => filter === 'all' || n.category === filter),
  [notifs, filter])

  const markRead    = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = ()            => setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  const dismiss     = (id: string) => setNotifs(ns => ns.filter(n => n.id !== id))
  const clearAll    = ()            => setNotifs([])

  const togglePref = (key: string) =>
    setPrefs(ps => ps.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p))

  const FILTERS: { key: NotifCategory; label: string }[] = [
    { key: 'all',       label: `Toutes (${notifs.length})` },
    { key: 'portfolio', label: 'Portefeuille' },
    { key: 'calendar',  label: 'Calendrier' },
    { key: 'budget',    label: 'Budget' },
    { key: 'score',     label: 'Score' },
    { key: 'alert',     label: 'Alertes' },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)', background: 'var(--p-bg)', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(176,120,32,0.10)', border: '1.5px solid rgba(176,120,32,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            position: 'relative',
          }}>
            <Bell style={{ width: 22, height: 22, color: '#B07820' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 18, height: 18, borderRadius: 9,
                background: '#ef4444', border: '2px solid var(--p-bg)',
                fontSize: 10, fontWeight: 700, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text)', margin: 0 }}>
              Notifications
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--p-text-faint)' }}>
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'rgba(176,120,32,0.10)', border: '1px solid rgba(176,120,32,0.22)',
              color: '#B07820',
            }}>
              <CheckCheck width={13} height={13} />
              Tout marquer lu
            </button>
          )}
          <button onClick={() => setShowPrefs(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: showPrefs ? 'rgba(129,140,248,0.12)' : 'var(--p-card)',
            border: `1px solid ${showPrefs ? 'rgba(129,140,248,0.30)' : 'var(--p-line)'}`,
            color: showPrefs ? '#818cf8' : 'var(--p-text-dim)',
          }}>
            <Settings width={13} height={13} />
            Préférences
          </button>
          {notifs.length > 0 && (
            <button onClick={clearAll} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'var(--p-card)', border: '1px solid var(--p-line)',
              color: 'var(--p-text-faint)',
            }}>
              <Trash2 width={13} height={13} />
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {/* ── Preferences panel ── */}
      {showPrefs && (
        <div style={{
          background: 'var(--p-card)', border: '1px solid var(--p-line)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)', marginBottom: 16 }}>
            Préférences de notifications
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {prefs.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>{p.detail}</div>
                </div>
                <button
                  onClick={() => togglePref(p.key)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: p.enabled ? '#B07820' : 'var(--p-line)',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                  aria-label={p.enabled ? 'Désactiver' : 'Activer'}
                >
                  <span style={{
                    position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: p.enabled ? 21 : 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === f.key ? 'rgba(176,120,32,0.12)' : 'var(--p-card)',
              border: `1px solid ${filter === f.key ? 'rgba(176,120,32,0.30)' : 'var(--p-line)'}`,
              color: filter === f.key ? '#B07820' : 'var(--p-text-faint)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Feed ── */}
      {visible.length === 0 ? (
        <div style={{
          background: 'var(--p-card)', border: '1px solid var(--p-line)',
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <BellOff style={{ width: 32, height: 32, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-dim)' }}>Aucune notification</div>
          <div style={{ fontSize: 12, color: 'var(--p-text-faint)', marginTop: 4 }}>
            {filter !== 'all' ? 'Essayez de changer le filtre.' : 'Tout est à jour pour le moment.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                background: 'var(--p-card)',
                border: `1px solid ${!n.read ? 'rgba(176,120,32,0.25)' : 'var(--p-line)'}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                cursor: 'pointer',
                opacity: n.read ? 0.75 : 1,
                position: 'relative',
              }}
            >
              {/* Unread dot */}
              {!n.read && (
                <span style={{
                  position: 'absolute', top: 16, right: 48,
                  width: 7, height: 7, borderRadius: '50%', background: '#B07820',
                }} />
              )}

              <NotifIcon icon={n.icon} priority={n.priority} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: n.read ? 600 : 700, color: 'var(--p-text)', lineHeight: 1.3 }}>
                    {n.title}
                  </span>
                  <span style={{
                    padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, flexShrink: 0,
                    background: `${CATEGORY_COLORS[n.category]}15`,
                    color: CATEGORY_COLORS[n.category],
                  }}>
                    {CATEGORY_LABELS[n.category]}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.5 }}>
                  {n.body}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                    {relativeTime(n.timestamp)}
                  </span>
                  {n.href && (
                    <a
                      href={n.href}
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: 11, fontWeight: 600, color: '#B07820', textDecoration: 'none',
                      }}
                    >
                      Voir <ChevronRight width={11} height={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 4 }}>
                {!n.read && (
                  <button
                    onClick={e => { e.stopPropagation(); markRead(n.id) }}
                    title="Marquer comme lu"
                    style={{
                      width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: 'var(--p-text-faint)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Check width={13} height={13} />
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                  title="Supprimer"
                  style={{
                    width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: 'transparent', color: 'var(--p-text-faint)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X width={13} height={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Control center ── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
          Centre de contrôle
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { label: 'Rééquilibrer',           detail: 'Allocation hors cible',       href: '/dashboard/rebalancing',   icon: <RefreshCw width={15} height={15} />,   color: '#818cf8' },
            { label: 'Voir le score',           detail: 'Santé patrimoniale globale',  href: '/dashboard/score',          icon: <Award     width={15} height={15} />,   color: '#f472b6' },
            { label: 'Calendrier financier',    detail: 'Dividendes & résultats',      href: '/dashboard/calendar',       icon: <Calendar  width={15} height={15} />,   color: '#B07820' },
            { label: 'Rapport fiscal',          detail: 'Résumé enveloppes fiscales',  href: '/dashboard/tax-report',     icon: <Shield    width={15} height={15} />,   color: '#34d399' },
            { label: "Taux d'épargne",          detail: 'Suivi mensuel',               href: '/dashboard/savings-rate',   icon: <Target    width={15} height={15} />,   color: '#f87171' },
            { label: 'Simuler FI/RE',           detail: 'Projeter votre indépendance', href: '/dashboard/fire',           icon: <Flame     width={15} height={15} />,   color: '#fb923c' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderRadius: 12, textDecoration: 'none',
                background: 'var(--p-card)', border: '1px solid var(--p-line)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${item.color}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--p-line)')}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${item.color}14`, border: `1px solid ${item.color}28`,
                color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 1 }}>{item.detail}</div>
              </div>
              <ChevronRight width={13} height={13} style={{ marginLeft: 'auto', color: 'var(--p-text-faint)', flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
