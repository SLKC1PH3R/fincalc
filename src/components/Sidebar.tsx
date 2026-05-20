'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator, Percent, Trash2,
  Settings, Shield, BarChart3, ChevronDown, ChevronRight,
  Sun, Moon, Bitcoin, Award, CreditCard, Coins,
  ShieldCheck, Users, Scale, Landmark, Search, UserCircle,
  Banknote, TrendingDown, LineChart, MapPin, CalendarDays, Bell,
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Icon = (props: any) => any

// ── Data ──────────────────────────────────────────────────────────────────────
const PatrimoINE_CATEGORIES = [
  { href: '/dashboard/Patrimoine/immobilier', label: 'Immobilier',        icon: Home       },
  { href: '/dashboard/Patrimoine/actions',    label: 'Actions & Fonds',   icon: TrendingUp },
  { href: '/dashboard/Patrimoine/livrets',    label: 'Livrets',           icon: PiggyBank  },
  { href: '/dashboard/Patrimoine/comptes',    label: 'Comptes bancaires', icon: Wallet     },
  { href: '/dashboard/Patrimoine/emprunts',   label: 'Emprunts',          icon: CreditCard },
  { href: '/dashboard/Patrimoine/autres',     label: 'Autres actifs',     icon: Bitcoin    },
]

const SIMULATEURS_GROUPS = [
  {
    label: 'Placements',
    items: [
      { href: '/dashboard/compound',     label: 'Intérêts composés',  icon: TrendingUp  },
      { href: '/dashboard/dca',          label: 'DCA',                icon: RefreshCw   },
      { href: '/dashboard/fire',         label: 'FI/RE',              icon: Flame       },
      { href: '/dashboard/dividends',    label: 'Revenus passifs',    icon: Coins       },
      { href: '/dashboard/benchmark',    label: 'Benchmarks',         icon: BarChart3   },
      { href: '/dashboard/transactions', label: "Carnet d'ordres",    icon: History     },
    ],
  },
  {
    label: 'Immobilier',
    items: [
      { href: '/dashboard/buyrent',  label: 'Acheter vs Louer',     icon: Home      },
      { href: '/dashboard/mortgage', label: 'Prêt immobilier',      icon: Building2 },
      { href: '/dashboard/rental',   label: 'Rentabilité locative', icon: Wallet    },
    ],
  },
  {
    label: 'Fiscalité & Retraite',
    items: [
      { href: '/dashboard/tax',              label: 'Impôts IR',          icon: Receipt   },
      { href: '/dashboard/flat-tax',         label: 'Flat Tax vs Barème', icon: Scale     },
      { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV',  icon: Landmark  },
      { href: '/dashboard/retirement',       label: 'Retraite',           icon: PiggyBank },
      { href: '/dashboard/succession',       label: 'Succession & Don.',  icon: Users     },
    ],
  },
  {
    label: 'Budget & Épargne',
    items: [
      { href: '/dashboard/savings-rate',    label: "Taux d'épargne",  icon: Percent    },
      { href: '/dashboard/budget',          label: 'Budget 50/30/20', icon: Calculator },
      { href: '/dashboard/emergency-fund',  label: 'Épargne urgence', icon: ShieldCheck },
      { href: '/dashboard/consumer-credit', label: 'Crédit conso',    icon: CreditCard },
    ],
  },
  {
    label: 'Outils avancés',
    items: [
      { href: '/dashboard/livrets',   label: 'Livrets réglementés', icon: Banknote    },
      { href: '/dashboard/frais',     label: 'Impact des frais',    icon: TrendingDown },
      { href: '/dashboard/inflation', label: 'Inflation & PA',      icon: LineChart   },
      { href: '/dashboard/plusvalue', label: 'Plus-value immo.',    icon: MapPin      },
      { href: '/dashboard/scpi',      label: 'SCPI',                icon: Building2   },
      { href: '/dashboard/viager',    label: 'Viager',              icon: Users       },
    ],
  },
]

const ALL_SIM_HREFS = SIMULATEURS_GROUPS.flatMap(g => g.items.map(i => i.href))
const ALL_PATRI_HREFS = PatrimoINE_CATEGORIES.map(c => c.href)
const SIM_COUNT = ALL_SIM_HREFS.length

interface SimEntry { id: string; type: string; name: string; inputs: Record<string, unknown> }

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
  isDemo?: boolean
}

// ── Inline SVG icon helper ────────────────────────────────────────────────────
function SvgIcon({ d, size = 15, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden
      style={{ flexShrink: 0, color }}>
      <path d={d} stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Logo (clickable — toggles sidebar) ───────────────────────────────────────
function SidebarLogo({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        title="Déplier"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--p-text)', borderRadius: '50%',
          fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
          fontSize: 17, color: 'var(--p-text)',
        }}>P</div>
      </button>
    )
  }
  return (
    <button
      onClick={onToggle}
      title="Réduire"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
    >
      <div style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid var(--p-text)', borderRadius: '50%', flexShrink: 0,
        fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
        fontSize: 16, color: 'var(--p-text)',
      }}>P</div>
      <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)', letterSpacing: '-0.01em', lineHeight: 1, fontFamily: "'Inter Tight', sans-serif" }}>
          Patrimo
        </div>
        <div style={{ fontSize: 9, color: 'var(--p-gold)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 3, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          finance
        </div>
      </div>
    </button>
  )
}

// ── Nav link ──────────────────────────────────────────────────────────────────
function NavLink({
  href, label, IconComp, active, collapsed, badge, badgeRed,
  tooltip, onTooltip,
}: {
  href: string; label: string; IconComp: Icon; active: boolean; collapsed: boolean
  badge?: string | number; badgeRed?: boolean
  tooltip?: boolean; onTooltip?: (label: string | null, y: number) => void
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}
      onMouseEnter={e => {
        if (collapsed && onTooltip) {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
          onTooltip(label, r.top + r.height / 2)
        }
      }}
      onMouseLeave={() => collapsed && onTooltip?.(null, 0)}
    >
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        padding: collapsed ? '9px 0' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? 'var(--p-gold)' : 'var(--p-text-mid)',
        background: active ? 'var(--p-gold-12)' : 'transparent',
        border: active ? '1px solid var(--p-gold-30)' : '1px solid transparent',
        transition: 'background 0.12s, color 0.12s',
        cursor: 'pointer',
        userSelect: 'none',
      }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--p-row-hover)' } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent' } }}
      >
        <IconComp style={{ width: 15, height: 15, flexShrink: 0 }} />
        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
            {badge != null && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: badgeRed ? 'var(--p-red)' : (active ? 'rgba(201,106,74,0.15)' : 'rgba(0,0,0,0.06)'),
                color: badgeRed ? '#fff' : (active ? 'var(--p-gold)' : 'var(--p-text-dim)'),
                fontFamily: "'JetBrains Mono', monospace",
              }}>{badge}</span>
            )}
          </>
        )}
      </div>
    </Link>
  )
}

// ── Expandable section header (no navigation) ─────────────────────────────────
function SectionHeader({
  label, IconComp, expanded, onToggle, collapsed, badge, active,
}: {
  label: string; IconComp: Icon; expanded: boolean; onToggle: () => void
  collapsed: boolean; badge?: string | number; active?: boolean
}) {
  if (collapsed) {
    return (
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '9px 0', borderRadius: 8, cursor: 'pointer',
          color: active ? 'var(--p-gold)' : 'var(--p-text-mid)',
          background: active ? 'var(--p-gold-12)' : 'transparent',
          border: active ? '1px solid var(--p-gold-30)' : '1px solid transparent',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--p-row-hover)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <IconComp style={{ width: 15, height: 15, flexShrink: 0 }} />
      </div>
    )
  }
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', width: '100%',
        background: active ? 'var(--p-gold-12)' : 'transparent',
        border: active ? '1px solid var(--p-gold-30)' : '1px solid transparent',
        borderRadius: 8, cursor: 'pointer',
        fontSize: 13, fontWeight: 500,
        color: active ? 'var(--p-gold)' : 'var(--p-text-mid)',
        fontFamily: 'inherit',
        transition: 'background 0.12s',
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--p-row-hover)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--p-gold-12)' : 'transparent' }}
    >
      <IconComp style={{ width: 15, height: 15, flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {badge != null && (
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
          background: active ? 'rgba(201,106,74,0.15)' : 'rgba(0,0,0,0.06)',
          color: active ? 'var(--p-gold)' : 'var(--p-text-dim)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{badge}</span>
      )}
      <ChevronDown style={{
        width: 12, height: 12, flexShrink: 0,
        transition: 'transform 0.2s',
        transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
      }} />
    </button>
  )
}

// ── Sim sub-item ──────────────────────────────────────────────────────────────
function SimSubItem({
  href, label, IconComp, active, sims, activeSimId, onDelete,
}: {
  href: string; label: string; IconComp: Icon; active: boolean
  sims: SimEntry[]; activeSimId: string | null; onDelete: (id: string) => void
}) {
  const itemSims = sims.filter(s => {
    const typeMap: Record<string, string> = {
      '/dashboard/compound': 'compound', '/dashboard/dca': 'dca', '/dashboard/fire': 'fire',
      '/dashboard/mortgage': 'mortgage', '/dashboard/buyrent': 'buyrent', '/dashboard/rental': 'rental',
      '/dashboard/tax': 'tax', '/dashboard/flat-tax': 'flat-tax', '/dashboard/envelope-compare': 'envelope-compare',
      '/dashboard/retirement': 'retirement', '/dashboard/savings-rate': 'savings-rate',
      '/dashboard/budget': 'budget', '/dashboard/emergency-fund': 'emergency-fund',
      '/dashboard/consumer-credit': 'consumer-credit', '/dashboard/succession': 'succession',
      '/dashboard/dividends': 'dividends', '/dashboard/inflation': 'inflation', '/dashboard/frais': 'frais',
      '/dashboard/livrets': 'livrets', '/dashboard/plusvalue': 'plusvalue', '/dashboard/scpi': 'scpi',
      '/dashboard/viager': 'viager', '/dashboard/benchmark': 'benchmark', '/dashboard/transactions': 'transactions',
    }
    return s.type === typeMap[href]
  })

  return (
    <div>
      <Link href={href} style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 8px', borderRadius: 7,
          fontSize: 12, fontWeight: active ? 600 : 400,
          color: active ? 'var(--p-gold)' : 'var(--p-text-dim)',
          background: active ? 'var(--p-gold-08)' : 'transparent',
          transition: 'background 0.1s',
          cursor: 'pointer',
        }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--p-row-hover)' }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--p-gold-08)' : 'transparent' }}
        >
          {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--p-gold)', flexShrink: 0 }} />}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          {itemSims.length > 0 && (
            <span style={{ fontSize: 9, color: 'var(--p-text-faint)', fontFamily: "'JetBrains Mono', monospace" }}>
              {itemSims.length}
            </span>
          )}
        </div>
      </Link>
      {active && itemSims.slice(0, 4).map(sim => {
        const isActiveSim = sim.id === activeSimId
        return (
          <div key={sim.id} className="group" style={{ display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
            <Link
              href={`${href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
              style={{ flex: 1, fontSize: 11, color: isActiveSim ? 'var(--p-gold)' : 'var(--p-text-faint)', textDecoration: 'none', padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActiveSim ? 600 : 400 }}
            >
              {sim.name}
            </Link>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete(sim.id) }}
              style={{ opacity: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', flexShrink: 0 }}
              className="group-hover:opacity-100"
              title="Supprimer"
            >
              <Trash2 style={{ width: 9, height: 9 }} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function SidebarInner({ user, isAdmin, isDemo }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSimId = searchParams.get('sim')
  const { collapsed, toggle } = useSidebar()
  const { theme, toggleTheme } = useTheme()

  const [sims, setSims] = useState<SimEntry[]>([])
  const [PatrimoineExpanded, setPatrimoineExpanded] = useState(true)
  const [simulateursExpanded, setSimulateursExpanded] = useState(true)
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null)

  // Auto-expand the relevant section when navigating
  useEffect(() => {
    if (ALL_PATRI_HREFS.some(h => pathname.startsWith(h))) setPatrimoineExpanded(true)
    if (ALL_SIM_HREFS.some(h => pathname === h)) setSimulateursExpanded(true)
  }, [pathname])

  const loadSims = () => {
    fetch('/api/simulations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .catch(() => {})
  }
  useEffect(() => {
    loadSims()
    window.addEventListener('simulation-saved', loadSims)
    return () => window.removeEventListener('simulation-saved', loadSims)
  }, [])

  const deleteSim = async (id: string) => {
    setSims(prev => prev.filter(s => s.id !== id))
    try { await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' }) } catch {}
  }

  const isPatrimoineActive = ALL_PATRI_HREFS.some(h => pathname.startsWith(h))
  const isSimActive = ALL_SIM_HREFS.some(h => pathname === h)

  const W = collapsed ? 62 : 232

  const userName = user.name || user.email || 'Utilisateur'
  const userInitial = userName[0].toUpperCase()

  return (
    <aside style={{
      width: W, flexShrink: 0,
      borderRight: '1px solid var(--p-line)',
      background: 'var(--p-bg)',
      display: 'flex', flexDirection: 'column',
      padding: collapsed ? '18px 8px' : '18px 14px',
      transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), padding 0.28s',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '100vh',
    }}>

      {/* Logo — click to collapse/expand */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        marginBottom: 20,
      }}>
        <SidebarLogo collapsed={collapsed} onToggle={toggle} />
      </div>

      {/* Search */}
      {!collapsed && (
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', marginBottom: 14,
            border: '1px solid var(--p-line)', borderRadius: 8,
            background: 'var(--p-card)', width: '100%',
            fontSize: 12, color: 'var(--p-text-dim)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--p-gold-30)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--p-line)'}
        >
          <Search style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left' }}>Recherche…</span>
          <kbd style={{ fontSize: 9, padding: '1px 5px', border: '1px solid var(--p-line)', borderRadius: 4, background: 'var(--p-bg)', color: 'var(--p-text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>⌘K</kbd>
        </button>
      )}

      {/* Demo banner */}
      {isDemo && !collapsed && (
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', background: 'var(--p-gold-08)', border: '1px solid var(--p-gold-18)', borderRadius: 8, padding: '4px 10px' }}>
          <span style={{ fontSize: 9 }}>🔒</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--p-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mode démo · Lecture seule</span>
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Vue d'ensemble */}
        <NavLink href="/dashboard" label="Vue d'ensemble" IconComp={BarChart3}
          active={pathname === '/dashboard'} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* Patrimoine — header only, no link */}
        <SectionHeader
          label="Patrimoine" IconComp={Home}
          expanded={PatrimoineExpanded} onToggle={() => setPatrimoineExpanded(v => !v)}
          collapsed={collapsed} badge={PatrimoINE_CATEGORIES.length} active={isPatrimoineActive}
        />
        {!collapsed && PatrimoineExpanded && (
          <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: '1px solid var(--p-line)', display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 2 }}>
            {PatrimoINE_CATEGORIES.map(cat => {
              const active = pathname.startsWith(cat.href)
              const Ic = cat.icon
              return (
                <Link key={cat.href} href={cat.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    color: active ? 'var(--p-gold)' : 'var(--p-text-dim)',
                    background: active ? 'var(--p-gold-08)' : 'transparent',
                    transition: 'background 0.1s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--p-row-hover)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--p-gold-08)' : 'transparent' }}
                  >
                    {active && <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--p-gold)', flexShrink: 0 }} />}
                    <Ic style={{ width: 13, height: 13, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Simulateurs — header only, no link */}
        <SectionHeader
          label="Simulateurs" IconComp={Calculator}
          expanded={simulateursExpanded} onToggle={() => setSimulateursExpanded(v => !v)}
          collapsed={collapsed} badge={SIM_COUNT} active={isSimActive}
        />
        {!collapsed && simulateursExpanded && (
          <div style={{ marginLeft: 10, paddingLeft: 12, borderLeft: '1px solid var(--p-line)', display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 2 }}>
            {SIMULATEURS_GROUPS.map(group => (
              <div key={group.label}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.10em', padding: '6px 8px 3px', fontFamily: "'JetBrains Mono', monospace" }}>
                  {group.label}
                </div>
                {group.items.map(item => (
                  <SimSubItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    IconComp={item.icon}
                    active={pathname === item.href}
                    sims={sims}
                    activeSimId={activeSimId}
                    onDelete={deleteSim}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Score */}
        <NavLink href="/dashboard/score" label="Score" IconComp={Award}
          active={pathname === '/dashboard/score'} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* Objectifs */}
        <NavLink href="/dashboard/goals" label="Objectifs" IconComp={Flame}
          active={pathname.startsWith('/dashboard/goals')} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* Calendrier */}
        <NavLink href="/dashboard/calendar" label="Calendrier" IconComp={CalendarDays}
          active={pathname === '/dashboard/calendar'} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* Historique */}
        <NavLink href="/dashboard/history" label="Historique" IconComp={History}
          active={pathname === '/dashboard/history'} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* ── Outils ── */}
        {!collapsed
          ? <div style={{ marginTop: 16, paddingLeft: 10, paddingBottom: 4, fontSize: 9.5, fontWeight: 700, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Outils</div>
          : <div style={{ height: 1, margin: '12px 0 6px', background: 'var(--p-line)' }} />
        }

        <NavLink href="/dashboard/marche" label="Marchés" IconComp={LineChart}
          active={pathname.startsWith('/dashboard/marche')} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        <NavLink href="/dashboard/notifications" label="Notifications" IconComp={Bell}
          active={pathname === '/dashboard/notifications'} collapsed={collapsed}
          badge={3} badgeRed
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        <NavLink href="/dashboard/settings" label="Paramètres" IconComp={Settings}
          active={pathname === '/dashboard/settings'} collapsed={collapsed}
          onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />

        {/* Admin */}
        {isAdmin && (
          <>
            {!collapsed
              ? <div style={{ marginTop: 8, paddingLeft: 10, paddingBottom: 4, fontSize: 9.5, fontWeight: 700, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Admin</div>
              : <div style={{ height: 1, margin: '8px 0 4px', background: 'var(--p-line)' }} />
            }
            <NavLink href="/dashboard/admin" label="Administration" IconComp={Shield}
              active={pathname === '/dashboard/admin'} collapsed={collapsed}
              onTooltip={(l, y) => l ? setTooltip({ label: l, y }) : setTooltip(null)} />
          </>
        )}
      </nav>

      {/* ── Footer: theme + signout + user ── */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--p-line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Theme toggle + sign out */}
        {!collapsed && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--p-line)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-dim)', fontSize: 11, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--p-row-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? <Sun style={{ width: 13, height: 13 }} /> : <Moon style={{ width: 13, height: 13 }} />}
              {theme === 'dark' ? 'Clair' : 'Sombre'}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--p-line)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-dim)', fontSize: 11, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(178,59,59,0.07)'; e.currentTarget.style.color = 'var(--p-red)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-dim)' }}
              title="Déconnexion"
            >
              <LogOut style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}

        {/* User card */}
        {!collapsed ? (
          <Link href="/dashboard/profil" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '10px 12px', border: '1px solid var(--p-line)', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--p-card)', boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
          }}>
            {user.image ? (
              <img src={user.image} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, outline: '1.5px solid var(--p-gold-30)' }} />
            ) : (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'var(--p-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>{userInitial}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.email?.split('@')[0] || 'Utilisateur'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--p-text-dim)' }}>Plan Pro · 2026</div>
            </div>
          </div>
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--p-line)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'dark' ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
            </button>
            {user.image ? (
              <img src={user.image} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', outline: '1.5px solid var(--p-gold-30)' }} />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--p-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
              }}>{userInitial}</div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip for collapsed mode */}
      {collapsed && tooltip && (
        <div style={{
          position: 'fixed', left: W + 10, top: tooltip.y, transform: 'translateY(-50%)',
          background: 'var(--p-card)', border: '1px solid var(--p-line)',
          borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 500,
          color: 'var(--p-text-em)', boxShadow: 'var(--shadow-1)',
          pointerEvents: 'none', zIndex: 9999, whiteSpace: 'nowrap',
        }}>{tooltip.label}</div>
      )}
    </aside>
  )
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  )
}
