'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator, Percent, Trash2,
  Settings, PanelLeftClose, PanelLeftOpen, Shield, BarChart3, ChevronDown,
  Sun, Moon, Bitcoin, Award, CreditCard, Target, Flag, Coins, FileText, SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/contexts/ThemeContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Icon = (props: any) => any

// ── Patrimoine categories ─────────────────────────────────────────────────────
const PATRIMOINE_CATEGORIES = [
  { href: '/dashboard/patrimoine',            label: "Vue d'ensemble",    icon: BarChart3  },
  { href: '/dashboard/patrimoine/immobilier', label: 'Immobilier',        icon: Building2  },
  { href: '/dashboard/patrimoine/actions',    label: 'Actions & Fonds',   icon: TrendingUp },
  { href: '/dashboard/patrimoine/livrets',    label: 'Livrets',           icon: PiggyBank  },
  { href: '/dashboard/patrimoine/autres',     label: 'Autres actifs',     icon: Bitcoin    },
  { href: '/dashboard/patrimoine/comptes',    label: 'Comptes bancaires', icon: Wallet     },
  { href: '/dashboard/patrimoine/emprunts',   label: 'Emprunts',          icon: CreditCard },
]

const GESTION_ITEMS = [
  { href: '/dashboard/goals',      label: 'Mes Objectifs', icon: Flag     },
  { href: '/dashboard/rebalancing', label: 'Rééquilibrage', icon: Target  },
  { href: '/dashboard/tax-report', label: 'Rapport Fiscal', icon: FileText },
]

const OUTILS_ITEMS = [
  { href: '/dashboard/compound',          label: 'Intérêts Composés',   icon: TrendingUp },
  { href: '/dashboard/dca',              label: 'DCA',                  icon: RefreshCw  },
  { href: '/dashboard/fire',             label: 'FI/RE',                icon: Flame      },
  { href: '/dashboard/buyrent',          label: 'Acheter vs Louer',     icon: Home       },
  { href: '/dashboard/mortgage',         label: 'Prêt Immobilier',      icon: Building2  },
  { href: '/dashboard/rental',           label: 'Rentabilité Locative', icon: Wallet     },
  { href: '/dashboard/tax',              label: 'Impôts IR',            icon: Receipt    },
  { href: '/dashboard/flat-tax',         label: 'Flat Tax vs Barème',   icon: Receipt    },
  { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV',    icon: Wallet     },
  { href: '/dashboard/retirement',       label: 'Retraite',             icon: PiggyBank  },
  { href: '/dashboard/savings-rate',     label: "Taux d'épargne",       icon: Percent    },
  { href: '/dashboard/budget',           label: 'Budget 50/30/20',      icon: Calculator },
  { href: '/dashboard/dividends',        label: 'Revenus Passifs',       icon: Coins      },
  { href: '/dashboard/benchmark',        label: 'Benchmarks',            icon: BarChart3  },
]

const COMPTE_ITEMS = [
  { href: '/dashboard/settings', label: 'Mon compte', icon: Settings },
  { href: '/dashboard/history',  label: 'Historique', icon: History  },
]

interface SimEntry { id: string; type: string; name: string; inputs: Record<string, unknown> }

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
  isDemo?: boolean
}

// ── Icon box helpers ──────────────────────────────────────────────────────────
function IconBox({ icon: Icon, active, size = 32 }: { icon: Icon; active: boolean; size?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 9,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      background: active ? 'rgba(249,115,22,0.13)' : 'transparent',
      border: active ? '1px solid rgba(249,115,22,0.38)' : '1px solid transparent',
      transition: 'all 0.15s',
    }}>
      <Icon style={{ width: 15, height: 15, color: active ? '#f97316' : 'var(--sb-text-dim)' }} />
    </div>
  )
}

function SidebarInner({ user, isAdmin, isDemo }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSimId = searchParams.get('sim')
  const { collapsed, toggle } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const [sims, setSims] = useState<SimEntry[]>([])
  const [expandedHref, setExpandedHref] = useState<string | null>(null)
  const [patrimoineExpanded, setPatrimoineExpanded] = useState(true)
  const [gestionExpanded, setGestionExpanded] = useState(() => pathname === '/dashboard/gestion' || GESTION_ITEMS.some(i => pathname === i.href))
  const [outilsExpanded, setOutilsExpanded] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [score, setScore] = useState<number | null>(null)
  const [patrimoineTotal, setPatrimoineTotal] = useState<number | null>(null)
  const [patrimoineEvol, setPatrimoineEvol] = useState<number | null>(null)

  const toggleSection = (title: string) => setCollapsedSections(prev => {
    const next = new Set(prev)
    if (next.has(title)) next.delete(title); else next.add(title)
    return next
  })

  const loadSims = () => {
    fetch('/api/simulations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSims(data) })
      .catch(() => {})
  }

  useEffect(() => {
    loadSims()
    window.addEventListener('simulation-saved', loadSims)
    return () => { window.removeEventListener('simulation-saved', loadSims) }
  }, [])

  useEffect(() => {
    fetch('/api/score/last')
      .then(r => r.json())
      .then(data => { if (typeof data.score === 'number') setScore(data.score) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/patrimoine/envelopes')
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        const total = data.reduce((sum, e) => {
          const val = e.totalValue !== null
            ? e.totalValue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (e.positions || []).reduce((s: number, p: any) => s + p.pru * p.quantity, 0)
          return sum + val
        }, 0)
        setPatrimoineTotal(total)

        // After setting patrimoineTotal, also fetch snapshots for evolution
        fetch('/api/patrimoine/snapshots?days=2')
          .then(r => r.json())
          .then((snaps: { date: string; totalValue: number }[]) => {
            if (snaps.length >= 2) {
              const prev = snaps[0].totalValue
              const curr = snaps[snaps.length - 1].totalValue
              if (prev > 0) setPatrimoineEvol(((curr - prev) / prev) * 100)
            }
          })
          .catch(() => {})
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/dashboard/')) setExpandedHref(pathname)
    if (pathname === '/dashboard/gestion' || GESTION_ITEMS.some(i => pathname === i.href)) setGestionExpanded(true)
  }, [pathname])

  const deleteSim = async (id: string) => {
    setSims(prev => prev.filter(s => s.id !== id))
    try { await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' }) } catch {}
  }

  const W = collapsed ? 64 : 290

  // ── Section label ─────────────────────────────────────────────────────────
  const SectionLabel = ({ label, sectionKey }: { label: string; sectionKey: string }) => {
    if (collapsed) return <div style={{ height: 1, margin: '4px 4px 6px', background: 'var(--sb-divider)' }} />
    return (
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full px-2 mb-1"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: 'var(--sb-text-section)',
        }}>
          {label}
        </span>
        <ChevronDown
          style={{
            width: 10, height: 10,
            color: 'var(--sb-text-dim)',
            transform: collapsedSections.has(sectionKey) ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>
    )
  }

  // ── Single nav item (icon-box style) ─────────────────────────────────────
  const NavItem = ({
    href, label, icon: Icon, active, badge, onToggleExpand, expandable, expanded,
  }: {
    key?: string; href: string; label: string; icon: Icon; active: boolean
    badge?: number; onToggleExpand?: () => void; expandable?: boolean; expanded?: boolean
  }) => (
    <div className="flex items-center gap-1">
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-xl flex-1 min-w-0 transition-colors',
          collapsed ? 'justify-center py-1.5 px-1.5' : 'px-1.5 py-1',
        )}
        style={{
          textDecoration: 'none',
          background: 'none',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        <IconBox icon={Icon} active={active} />
        {!collapsed && (
          <>
            <span style={{
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? 'var(--sb-text-strong)' : 'var(--sb-text)',
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
            {badge != null && badge > 0 && (
              <span style={{
                fontSize: 9, color: '#f97316',
                background: 'rgba(249,115,22,0.12)',
                padding: '1px 6px', borderRadius: 4,
                fontWeight: 700, flexShrink: 0,
              }}>
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
      {!collapsed && expandable && onToggleExpand && (
        <button
          onClick={onToggleExpand}
          style={{
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6, border: 'none', background: 'none',
            cursor: 'pointer', flexShrink: 0, color: 'var(--sb-text-dim)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--sb-hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <ChevronDown style={{ width: 11, height: 11, transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
        </button>
      )}
    </div>
  )

  // ── Sub-item row (indented, no icon box) ─────────────────────────────────
  const SubItem = ({ href, label, icon: Icon, active }: { key?: string; href: string; label: string; icon: Icon; active: boolean }) => (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors"
      style={{
        textDecoration: 'none', fontSize: 12,
        color: active ? '#f97316' : 'var(--sb-text)',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(249,115,22,0.07)' : 'none',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <Icon style={{ width: 12, height: 12, flexShrink: 0, color: active ? '#f97316' : 'var(--sb-text-dim)' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={toggle} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full flex flex-col z-40 transition-all duration-200',
          collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        )}
        style={{
          width: W,
          background: 'var(--sb-bg)',
          borderRight: 'none',
          overflow: 'visible',
        }}
      >
        {/* ── Right edge fondu ── */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, bottom: 0, right: -44, width: 44,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--sb-bg) 0%, transparent 100%)',
          zIndex: 1,
        }} />

        {/* ── Top gold halo ── */}
        <div aria-hidden style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 280, height: 220,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.16) 0%, transparent 68%)',
          pointerEvents: 'none', zIndex: -1,
        }} />

        {/* ── Bottom gold halo ── */}
        <div aria-hidden style={{
          position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 180,
          background: 'radial-gradient(ellipse at 50% 100%, rgba(249,115,22,0.11) 0%, transparent 68%)',
          pointerEvents: 'none', zIndex: -1,
        }} />

        {/* ── Logo / header ── */}
        <div className={cn(
          'flex-shrink-0 transition-all duration-200',
          collapsed ? 'h-16 px-3 flex items-center justify-center' : 'px-4 pt-5 pb-4'
        )}>
          {!collapsed ? (
            <div>
              {/* Logo row */}
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard" className="flex items-center gap-2.5 group" style={{ textDecoration: 'none' }}>
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)' }}
                  >
                    <TrendingUp style={{ color: '#0a0a0a', width: 15, height: 15 }} />
                  </div>
                  <span
                    className="sb-gold-text"
                    style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.04em', fontFamily: 'Geist, -apple-system, sans-serif' }}
                  >
                    FinCalc
                  </span>
                </Link>
                <button
                  onClick={toggle}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)', padding: 4, borderRadius: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-text)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}
                >
                  <PanelLeftClose style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Patrimoine widget */}
              {patrimoineTotal !== null && (
                <Link
                  href="/dashboard/patrimoine"
                  style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'var(--sb-profile-bg)',
                      border: '1px solid rgba(249,115,22,0.10)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.10)')}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Patrimoine net
                      </span>
                      <div className="flex items-center gap-1.5">
                        {patrimoineEvol !== null && (
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: patrimoineEvol >= 0 ? '#4ade80' : '#f87171',
                          }}>
                            {patrimoineEvol >= 0 ? '+' : ''}{patrimoineEvol.toFixed(1)}%
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sb-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                          {patrimoineTotal >= 1_000_000
                            ? `${(patrimoineTotal / 1_000_000).toFixed(1).replace(/\.0$/, '')} M€`
                            : patrimoineTotal >= 1_000
                              ? `${Math.round(patrimoineTotal / 1_000)} k€`
                              : `${Math.round(patrimoineTotal)} €`}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      {patrimoineEvol !== null ? (
                        <div style={{
                          height: '100%',
                          width: `${Math.min(Math.abs(patrimoineEvol) * 5, 100)}%`,
                          borderRadius: 99,
                          background: patrimoineEvol >= 0
                            ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                          transition: 'width 0.6s ease',
                        }} />
                      ) : (
                        <div style={{
                          height: '100%', width: '40%', borderRadius: 99,
                          background: 'linear-gradient(90deg, #f97316, #fbbf24)',
                          opacity: 0.4,
                        }} />
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Score widget */}
              {score !== null && (
                <Link
                  href="/dashboard/score"
                  style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--sb-profile-bg)',
                    border: '1px solid rgba(249,115,22,0.10)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(249,115,22,0.10)')}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--sb-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Score patrimonial
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                        {score}<span style={{ fontSize: 10, fontWeight: 500, color: 'var(--sb-text-dim)' }}>/100</span>
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${score}%`,
                        borderRadius: 99,
                        background: score >= 70
                          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                          : score >= 40
                            ? 'linear-gradient(90deg, #f97316, #fbbf24)'
                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <button
              onClick={toggle}
              title="Ouvrir"
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)', border: 'none', cursor: 'pointer' }}
            >
              <TrendingUp style={{ color: '#0a0a0a', width: 15, height: 15 }} />
            </button>
          )}
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ padding: collapsed ? '4px 8px' : '0 10px 8px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)',
              borderRadius: 8, padding: '4px 10px', width: '100%',
            }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>🔒</span>
              {!collapsed && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fb923c', letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  Mode démo · Lecture seule
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? '6px 8px' : '4px 8px' }}>

          {/* Score Patrimonial — shown only when no score widget (collapsed OR score===null) */}
          {(collapsed || score === null) && (
            <div style={{ marginBottom: 2 }}>
              <NavItem
                href="/dashboard/score"
                label="Score Patrimonial"
                icon={Award}
                active={pathname === '/dashboard/score'}
              />
            </div>
          )}

          {/* Thin divider */}
          <div style={{ height: 1, margin: '6px 4px', background: 'var(--sb-divider)' }} />

          {/* ── Patrimoine section ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Patrimoine" sectionKey="Patrimoine" />

            {(collapsed || !collapsedSections.has('Patrimoine')) && (
              <div className="space-y-0.5">
                {/* Vue d'ensemble row */}
                <NavItem
                  href="/dashboard/patrimoine"
                  label="Vue d'ensemble"
                  icon={BarChart3}
                  active={pathname === '/dashboard/patrimoine'}
                  expandable={!collapsed}
                  expanded={patrimoineExpanded}
                  onToggleExpand={() => setPatrimoineExpanded(v => !v)}
                />

                {/* Category sub-links — expanded */}
                {!collapsed && patrimoineExpanded && (
                  <div
                    className="mt-0.5 ml-10 space-y-0.5"
                    style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 10 }}
                  >
                    {PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                      const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                      return (
                        <SubItem
                          key={cat.href}
                          href={cat.href}
                          label={cat.label}
                          icon={cat.icon}
                          active={isActive}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Category icons — collapsed */}
                {collapsed && PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                  const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                  return (
                    <NavItem
                      key={cat.href}
                      href={cat.href}
                      label={cat.label}
                      icon={cat.icon}
                      active={isActive}
                    />
                  )
                })}

                {/* Gestion personnelle sub-section */}
                <NavItem
                  href="/dashboard/gestion"
                  label="Gestion personnelle"
                  icon={SlidersHorizontal}
                  active={pathname === '/dashboard/gestion' || GESTION_ITEMS.some(i => pathname === i.href)}
                  expandable={!collapsed}
                  expanded={gestionExpanded}
                  onToggleExpand={() => setGestionExpanded((v: boolean) => !v)}
                />

                {!collapsed && gestionExpanded && (
                  <div
                    className="mt-0.5 ml-10 space-y-0.5"
                    style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 10 }}
                  >
                    {GESTION_ITEMS.map(item => (
                      <SubItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={pathname === item.href}
                      />
                    ))}
                  </div>
                )}

                {collapsed && (
                  <>
                    {GESTION_ITEMS.map(item => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={pathname === item.href}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Outils section ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Calculateurs" sectionKey="Outils" />

            {(collapsed || !collapsedSections.has('Outils')) && (
              <div className="space-y-0.5">
                {/* Calculateurs header row */}
                <NavItem
                  href="/dashboard"
                  label="Calculateurs"
                  icon={BarChart3}
                  active={pathname === '/dashboard'}
                  expandable={!collapsed}
                  expanded={outilsExpanded}
                  onToggleExpand={() => setOutilsExpanded(v => !v)}
                />

                {/* Sub-items — expanded */}
                {!collapsed && outilsExpanded && (
                  <div
                    className="mt-0.5 ml-10 space-y-0.5"
                    style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 10 }}
                  >
                    {OUTILS_ITEMS.map(item => {
                      const isActive = pathname === item.href
                      const type = item.href.split('/').pop()
                      const itemSims = type ? sims.filter(s => s.type === type) : []
                      const isExpanded = expandedHref === item.href
                      return (
                        <div key={item.href}>
                          <div className="flex items-center gap-0.5">
                            <SubItem
                              href={item.href}
                              label={item.label}
                              icon={item.icon}
                              active={isActive}
                            />
                            {/* badge */}
                            {itemSims.length > 0 && !isActive && (
                              <span style={{
                                fontSize: 9, color: '#f97316', background: 'rgba(249,115,22,0.10)',
                                padding: '1px 5px', borderRadius: 4, fontWeight: 700, flexShrink: 0, marginRight: 2,
                              }}>
                                {itemSims.length}
                              </span>
                            )}
                            {itemSims.length > 0 && (
                              <button
                                onClick={() => setExpandedHref(prev => prev === item.href ? null : item.href)}
                                style={{
                                  width: 18, height: 18,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  borderRadius: 4, border: 'none', background: 'none',
                                  cursor: 'pointer', flexShrink: 0, color: 'var(--sb-text-dim)',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--sb-hover-bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              >
                                <ChevronDown style={{ width: 10, height: 10, transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                              </button>
                            )}
                          </div>
                          {isExpanded && itemSims.length > 0 && (
                            <div className="mt-0.5 ml-3 space-y-0.5" style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 8 }}>
                              {itemSims.slice(0, 5).map(sim => {
                                const isActiveSim = activeSimId === sim.id
                                return (
                                  <div
                                    key={sim.id}
                                    className="group flex items-center rounded-lg"
                                    style={{ background: isActiveSim ? 'rgba(249,115,22,0.07)' : 'transparent' }}
                                    onMouseEnter={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
                                    onMouseLeave={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                  >
                                    <Link
                                      href={`${item.href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                                      className="flex items-center gap-2 py-1 px-2 flex-1 min-w-0"
                                      style={{ fontSize: 11, textDecoration: 'none', color: isActiveSim ? '#f97316' : 'var(--sb-sim-text)', fontWeight: isActiveSim ? 600 : 400 }}
                                      onMouseEnter={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text-hover)' }}
                                      onMouseLeave={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text)' }}
                                    >
                                      {isActiveSim && <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />}
                                      <span className="truncate">{sim.name}</span>
                                    </Link>
                                    <button
                                      onClick={e => { e.preventDefault(); e.stopPropagation(); deleteSim(sim.id) }}
                                      className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center transition-all flex-shrink-0 mr-1 hover:text-red-400"
                                      style={{ color: 'var(--sb-text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
                                      title="Supprimer"
                                    >
                                      <Trash2 style={{ width: 10, height: 10 }} />
                                    </button>
                                  </div>
                                )
                              })}
                              {itemSims.length > 5 && (
                                <Link
                                  href="/dashboard/history"
                                  className="block py-1 px-2 rounded-lg"
                                  style={{ fontSize: 10, color: 'var(--sb-text-dim)', textDecoration: 'none' }}
                                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--sb-sim-text-hover)')}
                                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--sb-text-dim)')}
                                >
                                  +{itemSims.length - 5} de plus…
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Icons only — collapsed sidebar */}
                {collapsed && (
                  <>
                    <NavItem href="/dashboard" label="Calculateurs" icon={BarChart3} active={pathname === '/dashboard'} />
                    {OUTILS_ITEMS.map(item => (
                      <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname === item.href} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Compte ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Compte" sectionKey="Compte" />
            {(collapsed || !collapsedSections.has('Compte')) && (
              <div className="space-y-0.5">
                {COMPTE_ITEMS.map(item => (
                  <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname === item.href} />
                ))}
              </div>
            )}
          </div>

          {/* Admin */}
          {isAdmin && (
            <div style={{ marginBottom: 2 }}>
              <SectionLabel label="Admin" sectionKey="Admin" />
              {(collapsed || !collapsedSections.has('Admin')) && (
                <NavItem href="/dashboard/admin" label="Administration" icon={Shield} active={pathname === '/dashboard/admin'} />
              )}
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0"
          style={{
            borderTop: '1px solid var(--sb-divider)',
            padding: collapsed ? '8px 8px' : '8px 8px 10px',
          }}
        >
          {!collapsed ? (
            <>
              {/* User card */}
              <div
                className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1"
                style={{ background: 'var(--sb-profile-bg)', border: '1px solid rgba(249,115,22,0.07)' }}
              >
                {user.image ? (
                  <img src={user.image} alt="" style={{ height: 28, width: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, outline: '1.5px solid rgba(249,115,22,0.2)' }} />
                ) : (
                  <div style={{
                    height: 28, width: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sb-text-strong)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name || 'Utilisateur'}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--sb-text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </p>
                </div>
              </div>
              {/* Theme + Logout */}
              <div className="flex items-center gap-1 px-1">
                <button
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '6px 8px', borderRadius: 10,
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'var(--sb-text-dim)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--sb-hover-bg)'; e.currentTarget.style.color = 'var(--sb-text)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sb-text-dim)' }}
                >
                  {theme === 'dark'
                    ? <Sun style={{ width: 13, height: 13 }} />
                    : <Moon style={{ width: 13, height: 13 }} />
                  }
                  {theme === 'dark' ? 'Clair' : 'Sombre'}
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: 'https://fire.digitalstack.cloud/' })}
                  title="Déconnexion"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '6px 8px', borderRadius: 10,
                    border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 11, color: 'var(--sb-text-dim)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sb-text-dim)' }}
                >
                  <LogOut style={{ width: 13, height: 13 }} />
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={toggle}
                title="Ouvrir"
                style={{
                  width: '100%', display: 'flex', justifyContent: 'center',
                  padding: '8px 0', borderRadius: 10, border: 'none',
                  background: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)', marginBottom: 4,
                }}
                onMouseEnter={e => { (e.currentTarget.style.color = 'var(--sb-text)'); (e.currentTarget.style.background = 'var(--sb-hover-bg)') }}
                onMouseLeave={e => { (e.currentTarget.style.color = 'var(--sb-text-dim)'); (e.currentTarget.style.background = 'none') }}
              >
                <PanelLeftOpen style={{ width: 16, height: 16 }} />
              </button>
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'center',
                  padding: '8px 0', borderRadius: 10, border: 'none',
                  background: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)', marginBottom: 4,
                }}
                onMouseEnter={e => { (e.currentTarget.style.color = 'var(--sb-text)'); (e.currentTarget.style.background = 'var(--sb-hover-bg)') }}
                onMouseLeave={e => { (e.currentTarget.style.color = 'var(--sb-text-dim)'); (e.currentTarget.style.background = 'none') }}
              >
                {theme === 'dark' ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: 'https://fire.digitalstack.cloud/' })}
                title="Déconnexion"
                style={{
                  width: '100%', display: 'flex', justifyContent: 'center',
                  padding: '8px 0', borderRadius: 10, border: 'none',
                  background: 'none', cursor: 'pointer', color: 'var(--sb-text-dim)',
                }}
                onMouseEnter={e => { (e.currentTarget.style.color = '#f87171'); (e.currentTarget.style.background = 'rgba(239,68,68,0.08)') }}
                onMouseLeave={e => { (e.currentTarget.style.color = 'var(--sb-text-dim)'); (e.currentTarget.style.background = 'none') }}
              >
                <LogOut style={{ width: 16, height: 16 }} />
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense>
      <SidebarInner {...props} />
    </Suspense>
  )
}
