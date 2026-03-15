'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, Suspense } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, History, LogOut,
  Wallet, PiggyBank, RefreshCw, Calculator, Percent, Trash2,
  Settings, PanelLeftClose, PanelLeftOpen, Shield, BarChart3, ChevronDown,
  Sun, Moon, Bitcoin, Award, CreditCard, Coins,
  ShieldCheck, Users,
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

const SIMULATEURS_GROUPS = [
  {
    label: 'Placements',
    items: [
      { href: '/dashboard/compound',  label: 'Intérêts composés', icon: TrendingUp },
      { href: '/dashboard/dca',       label: 'DCA',               icon: RefreshCw  },
      { href: '/dashboard/fire',      label: 'FI/RE',             icon: Flame      },
      { href: '/dashboard/dividends', label: 'Revenus passifs',   icon: Coins      },
      { href: '/dashboard/benchmark', label: 'Benchmarks',        icon: BarChart3  },
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
      { href: '/dashboard/flat-tax',         label: 'Flat Tax vs Barème', icon: Receipt   },
      { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV',  icon: Wallet    },
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
      { href: '/dashboard/transactions',    label: "Carnet d'ordres", icon: History    },
    ],
  },
]

// Flat list of all simulator hrefs (for active detection)
const ALL_SIM_HREFS = SIMULATEURS_GROUPS.flatMap(g => g.items.map(i => i.href))

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
      background: active ? 'rgba(241,192,134,0.10)' : 'transparent',
      border: active ? '1px solid rgba(241,192,134,0.28)' : '1px solid transparent',
      transition: 'all 0.15s',
    }}>
      <Icon style={{ width: 15, height: 15, color: active ? '#f1c086' : 'var(--sb-text-dim)' }} />
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
  const [simulateursExpanded, setSimulateursExpanded] = useState(() => ALL_SIM_HREFS.some(h => pathname === h))
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [score, setScore] = useState<number | null>(null)
  const [patrimoineTotal, setPatrimoineTotal] = useState<number | null>(null)
  const [sparklineHistory, setSparklineHistory] = useState<number[]>([])
  const [fireTarget, setFireTarget] = useState<number>(0)
  const [dettesTotal, setDettesTotal] = useState<number>(0)

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
    const saved = localStorage.getItem('fincalc_fire_target')
    if (saved) { const n = parseFloat(saved); if (n > 0) setFireTarget(n) }
  }, [])

  useEffect(() => {
    fetch('/api/patrimoine/envelopes')
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        let brut = 0, dettes = 0
        for (const e of data) {
          if (e.type === 'IMMOBILIER') {
            brut += Number(e.metadata?.currentValue ?? 0)
            dettes += Number(e.metadata?.creditRemaining ?? 0)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const val = e.totalValue !== null ? e.totalValue : (e.positions || []).reduce((s: number, p: any) => s + p.pru * p.quantity, 0)
            brut += val
          }
        }
        setPatrimoineTotal(brut)
        setDettesTotal(dettes)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/patrimoine/snapshots?days=180')
      .then(r => r.json())
      .then((snaps: { date: string; totalValue: number }[]) => {
        if (Array.isArray(snaps) && snaps.length >= 2) {
          // Sample up to 7 evenly-spaced points
          const step = Math.max(1, Math.floor(snaps.length / 7))
          const sampled = snaps.filter((_, i) => i % step === 0 || i === snaps.length - 1)
          setSparklineHistory(sampled.map(s => s.totalValue))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/dashboard/')) setExpandedHref(pathname)
    if (ALL_SIM_HREFS.some(h => pathname === h)) setSimulateursExpanded(true)
  }, [pathname])

  const deleteSim = async (id: string) => {
    setSims(prev => prev.filter(s => s.id !== id))
    try { await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' }) } catch {}
  }

  const dark = theme !== 'light'
  const W = collapsed ? 64 : 290
  const [sbTooltip, setSbTooltip] = useState<{ label: string; y: number } | null>(null)

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
        className={cn(
          'flex items-center gap-2.5 rounded-xl flex-1 min-w-0 transition-colors',
          collapsed ? 'justify-center py-1.5 px-1.5' : 'px-1.5 py-1',
        )}
        style={{
          textDecoration: 'none',
          background: 'none',
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)'
          if (collapsed) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            setSbTooltip({ label, y: rect.top + rect.height / 2 })
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'none'
          setSbTooltip(null)
        }}
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
                fontSize: 9, color: '#f1c086',
                background: 'rgba(241,192,134,0.10)',
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
        color: active ? '#f1c086' : 'var(--sb-text)',
        fontWeight: active ? 600 : 400,
        background: active ? 'rgba(241,192,134,0.06)' : 'none',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <Icon style={{ width: 12, height: 12, flexShrink: 0, color: active ? '#f1c086' : 'var(--sb-text-dim)' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </Link>
  )

  // ── Patrimoine widget derived values ────────────────────────────────────────
  const fmtSb = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} M€`
    : n >= 1_000 ? `${Math.round(n / 1_000)} k€`
    : `${Math.round(n)} €`
  const sparkDelta = sparklineHistory.length >= 2
    ? sparklineHistory[sparklineHistory.length - 1] - sparklineHistory[0]
    : null
  const sparkDeltaPct = sparkDelta !== null && sparklineHistory[0] > 0
    ? (sparkDelta / sparklineHistory[0]) * 100
    : null
  const SW = 84, SH = 28
  const sparkMax = sparklineHistory.length >= 2 ? Math.max(...sparklineHistory) : 0
  const sparkMin = sparklineHistory.length >= 2 ? Math.min(...sparklineHistory) : 0
  const sparkRange = sparkMax - sparkMin || 1
  const sparkPts = sparklineHistory.length >= 2
    ? sparklineHistory.map((v: number, i: number) =>
        `${(i / (sparklineHistory.length - 1)) * SW},${SH - 2 - ((v - sparkMin) / sparkRange) * (SH - 4)}`
      ).join(' ')
    : null
  const sparkLastCy = sparklineHistory.length >= 2
    ? SH - 2 - ((sparklineHistory[sparklineHistory.length - 1] - sparkMin) / sparkRange) * (SH - 4)
    : 0
  const patrimoineNet = patrimoineTotal !== null ? Math.max(0, patrimoineTotal - dettesTotal) : 0
  const fireProgress = patrimoineNet > 0 && fireTarget > 0
    ? Math.min(100, (patrimoineNet / fireTarget) * 100)
    : 0

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
        {/* ── Collapsed tooltip ── */}
        {collapsed && sbTooltip && (
          <div style={{
            position: 'fixed',
            left: W + 10,
            top: sbTooltip.y,
            transform: 'translateY(-50%)',
            background: dark ? '#1c1f2e' : '#ffffff',
            color: dark ? '#e2e8f0' : '#111111',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
            boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)',
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
          }}>
            {sbTooltip.label}
          </div>
        )}

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
          background: 'radial-gradient(ellipse at 50% 0%, rgba(241,192,134,0.13) 0%, transparent 68%)',
          pointerEvents: 'none', zIndex: -1,
        }} />

        {/* ── Bottom gold halo ── */}
        <div aria-hidden style={{
          position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
          width: 260, height: 180,
          background: 'radial-gradient(ellipse at 50% 100%, rgba(241,192,134,0.09) 0%, transparent 68%)',
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
                    style={{ background: 'linear-gradient(135deg, #c8922a 0%, #f1c086 100%)' }}
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

              {/* Patrimoine widget — V6 Gold */}
              {patrimoineTotal !== null && (
                <Link href="/dashboard/patrimoine" style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
                  <div
                    style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.35)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)')}
                  >
                    {/* Top row: info left + sparkline right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <TrendingUp style={{ width: 9, height: 9, color: '#f1c086' }} />
                          <span style={{ color: '#f1c086', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>Patrimoine net</span>
                        </div>
                        <div style={{ color: 'var(--sb-text-strong)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {fmtSb(Math.max(0, patrimoineTotal - dettesTotal))}
                        </div>
                        {sparkDelta !== null && (
                          <div style={{ color: sparkDelta >= 0 ? '#4ade80' : '#f87171', fontSize: 10, fontWeight: 600, marginTop: 3 }}>
                            {sparkDelta >= 0 ? '↑ +' : '↓ '}{fmtSb(Math.abs(sparkDelta))}
                            {sparkDeltaPct !== null && (
                              <span style={{ opacity: 0.6, marginLeft: 3 }}>({sparkDeltaPct >= 0 ? '+' : ''}{sparkDeltaPct.toFixed(1)}%)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sparkline SVG */}
                      {sparkPts && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <svg width={SW} height={SH} style={{ overflow: 'visible' }}>
                            <defs>
                              <linearGradient id="sbSparkGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f1c086" stopOpacity={0.30} />
                                <stop offset="100%" stopColor="#f1c086" stopOpacity={1} />
                              </linearGradient>
                            </defs>
                            <polyline points={sparkPts} fill="none" stroke="url(#sbSparkGrad)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx={SW} cy={sparkLastCy} r={3} fill="#f1c086" />
                          </svg>
                          <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.35)', fontWeight: 400 }}>6 derniers mois</span>
                        </div>
                      )}
                    </div>

                    {/* Brut / Dettes mini-cards */}
                    {(patrimoineTotal > 0 || dettesTotal > 0) && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <div style={{
                          flex: 1, background: 'var(--sb-mini-card)', borderRadius: 8,
                          padding: '6px 10px',
                        }}>
                          <div style={{ fontSize: 9, color: 'var(--sb-text-dim)', marginBottom: 2 }}>Brut</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text)', fontVariantNumeric: 'tabular-nums' }}>{fmtSb(patrimoineTotal)}</div>
                        </div>
                        {dettesTotal > 0 && (
                          <div style={{
                            flex: 1, background: 'var(--sb-mini-card)', borderRadius: 8,
                            padding: '6px 10px',
                          }}>
                            <div style={{ fontSize: 9, color: 'var(--sb-text-dim)', marginBottom: 2 }}>Dettes</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>-{fmtSb(dettesTotal)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FIRE progress */}
                    {fireTarget > 0 && (
                      <div style={{ borderTop: `1px solid var(--sb-divider)`, paddingTop: 10, marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 9, color: dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.45)', fontWeight: 400 }}>
                            Vers objectif <span style={{ color: dark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.60)' }}>{fmtSb(fireTarget)}</span>
                          </span>
                          <span style={{ fontSize: 9, color: '#f1c086', fontWeight: 600 }}>{fireProgress.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 5, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', borderRadius: 99 }}>
                          <div style={{ width: `${fireProgress}%`, height: '100%', background: 'linear-gradient(90deg, #f1c08699, #f1c086)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )}
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
                    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.20)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.08)')}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f1c086', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Score patrimonial
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sb-text-strong)', fontVariantNumeric: 'tabular-nums' }}>
                        {score}<span style={{ fontSize: 10, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>/100</span>
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${score}%`,
                        borderRadius: 99,
                        background: score >= 70
                          ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                          : score >= 40
                            ? 'linear-gradient(90deg, #c8922a, #f1c086)'
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
              style={{ background: 'linear-gradient(135deg, #c8922a 0%, #f1c086 100%)', border: 'none', cursor: 'pointer' }}
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
              background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.12)',
              borderRadius: 8, padding: '4px 10px', width: '100%',
            }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>🔒</span>
              {!collapsed && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#f1c086', letterSpacing: '0.08em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                  Mode démo · Lecture seule
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? '6px 8px' : '4px 8px' }}>

          {/* Tableau de bord */}
          <div style={{ marginBottom: 4 }}>
            <NavItem href="/dashboard" label="Tableau de bord" icon={BarChart3} active={pathname === '/dashboard'} />
          </div>

          {/* Score Patrimonial (collapsed or no widget) */}
          {(collapsed || score === null) && (
            <div style={{ marginBottom: 4 }}>
              <NavItem href="/dashboard/score" label="Score Patrimonial" icon={Award} active={pathname === '/dashboard/score'} />
            </div>
          )}

          {/* thin divider */}
          <div style={{ height: 1, margin: '4px 4px 6px', background: 'var(--sb-divider)' }} />

          {/* ── PATRIMOINE ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Patrimoine" sectionKey="Patrimoine" />
            {(collapsed || !collapsedSections.has('Patrimoine')) && (
              <div className="space-y-0.5">
                <NavItem
                  href="/dashboard/patrimoine"
                  label="Vue d'ensemble"
                  icon={BarChart3}
                  active={pathname === '/dashboard/patrimoine'}
                  expandable={!collapsed}
                  expanded={patrimoineExpanded}
                  onToggleExpand={() => setPatrimoineExpanded(v => !v)}
                />
                {!collapsed && patrimoineExpanded && (
                  <div className="mt-0.5 ml-10 space-y-0.5" style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 10 }}>
                    {PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                      const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                      return <SubItem key={cat.href} href={cat.href} label={cat.label} icon={cat.icon} active={isActive} />
                    })}
                  </div>
                )}
                {collapsed && PATRIMOINE_CATEGORIES.slice(1).map(cat => {
                  const isActive = pathname === cat.href || pathname.startsWith(cat.href + '/')
                  return <NavItem key={cat.href} href={cat.href} label={cat.label} icon={cat.icon} active={isActive} />
                })}
              </div>
            )}
          </div>

          {/* thin divider */}
          <div style={{ height: 1, margin: '6px 4px', background: 'var(--sb-divider)' }} />

          {/* ── SIMULATEURS ── */}
          <div style={{ marginBottom: 2 }}>
            <SectionLabel label="Simulateurs" sectionKey="Simulateurs" />
            {(collapsed || !collapsedSections.has('Simulateurs')) && (
              <div className="space-y-0.5">

                {/* collapsed: all sim icons flat */}
                {collapsed && ALL_SIM_HREFS.map(href => {
                  const item = SIMULATEURS_GROUPS.flatMap(g => g.items).find(i => i.href === href)!
                  return <NavItem key={href} href={href} label={item.label} icon={item.icon} active={pathname === href} />
                })}

                {/* expanded: header + grouped sub-items */}
                {!collapsed && (
                  <>
                    <NavItem
                      href="/dashboard/simulateurs"
                      label="Simulateurs"
                      icon={Calculator}
                      active={pathname === '/dashboard/simulateurs'}
                      expandable
                      expanded={simulateursExpanded}
                      onToggleExpand={() => setSimulateursExpanded(v => !v)}
                    />
                    {simulateursExpanded && (
                      <div className="mt-0.5 ml-10" style={{ borderLeft: '1px solid var(--sb-divider)', paddingLeft: 10 }}>
                        {SIMULATEURS_GROUPS.map(group => (
                          <div key={group.label} style={{ marginBottom: 10 }}>
                            {/* group label */}
                            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--sb-text-section)', padding: '6px 8px 4px', margin: 0 }}>
                              {group.label}
                            </p>
                            <div className="space-y-0.5">
                              {group.items.map(item => {
                                const isActive = pathname === item.href
                                const type = item.href.split('/').pop()
                                const itemSims = type ? sims.filter(s => s.type === type) : []
                                const isExpanded = expandedHref === item.href
                                return (
                                  <div key={item.href}>
                                    <div className="flex items-center gap-0.5">
                                      <SubItem href={item.href} label={item.label} icon={item.icon} active={isActive} />
                                      {itemSims.length > 0 && !isActive && (
                                        <span style={{ fontSize: 9, color: '#f1c086', background: 'rgba(241,192,134,0.08)', padding: '1px 5px', borderRadius: 4, fontWeight: 700, flexShrink: 0, marginRight: 2 }}>
                                          {itemSims.length}
                                        </span>
                                      )}
                                      {itemSims.length > 0 && (
                                        <button
                                          onClick={() => setExpandedHref(prev => prev === item.href ? null : item.href)}
                                          style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0, color: 'var(--sb-text-dim)' }}
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
                                            <div key={sim.id} className="group flex items-center rounded-lg"
                                              style={{ background: isActiveSim ? 'rgba(241,192,134,0.06)' : 'transparent' }}
                                              onMouseEnter={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover-bg)' }}
                                              onMouseLeave={e => { if (!isActiveSim) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                            >
                                              <Link
                                                href={`${item.href}?restore=${encodeURIComponent(JSON.stringify(sim.inputs))}&sim=${sim.id}`}
                                                className="flex items-center gap-2 py-1 px-2 flex-1 min-w-0"
                                                style={{ fontSize: 11, textDecoration: 'none', color: isActiveSim ? '#f1c086' : 'var(--sb-sim-text)', fontWeight: isActiveSim ? 600 : 400 }}
                                                onMouseEnter={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text-hover)' }}
                                                onMouseLeave={e => { if (!isActiveSim) e.currentTarget.style.color = 'var(--sb-sim-text)' }}
                                              >
                                                {isActiveSim && <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: '#f1c086' }} />}
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
                                          <Link href="/dashboard/history" className="block py-1 px-2 rounded-lg"
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
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* thin divider */}
          <div style={{ height: 1, margin: '6px 4px', background: 'var(--sb-divider)' }} />

          {/* Historique — accès rapide */}
          <div style={{ marginBottom: 2 }}>
            <NavItem href="/dashboard/history" label="Historique" icon={History} active={pathname === '/dashboard/history'} />
          </div>

          {/* Admin */}
          {isAdmin && (
            <div style={{ marginTop: 6 }}>
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
                style={{ background: 'var(--sb-profile-bg)', border: '1px solid rgba(241,192,134,0.06)' }}
              >
                {user.image ? (
                  <img src={user.image} alt="" style={{ height: 28, width: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, outline: '1.5px solid rgba(241,192,134,0.20)' }} />
                ) : (
                  <div style={{
                    height: 28, width: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #c8922a 0%, #f1c086 100%)',
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
              {/* Theme + Settings + Logout */}
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
                  {theme === 'dark' ? <Sun style={{ width: 13, height: 13 }} /> : <Moon style={{ width: 13, height: 13 }} />}
                  {theme === 'dark' ? 'Clair' : 'Sombre'}
                </button>
                <Link
                  href="/dashboard/settings"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '6px 8px', borderRadius: 10,
                    textDecoration: 'none', fontSize: 11, color: pathname === '/dashboard/settings' ? 'var(--sb-text)' : 'var(--sb-text-dim)',
                  }}
                >
                  <Settings style={{ width: 13, height: 13 }} />
                  Paramètres
                </Link>
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
