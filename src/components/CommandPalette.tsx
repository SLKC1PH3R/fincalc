'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, TrendingUp, RefreshCw, Flame, Receipt, Building2, Wallet,
  PiggyBank, Home, Percent, Calculator, Shield, CreditCard, Scale,
  Award, User, History, BarChart3,
} from 'lucide-react'

interface PaletteItem {
  label: string; sub?: string; href: string
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  color: string; keywords?: string
}

const ITEMS: PaletteItem[] = [
  { label: 'Tableau de bord',       href: '/dashboard',                  icon: BarChart3,  color: '#B07820' },
  { label: 'Score Patrimonial',     href: '/dashboard/score',            icon: Award,      color: '#B07820' },
  { label: 'Mon Patrimoine',        href: '/dashboard/Patrimoine',       icon: BarChart3,  color: '#B07820', keywords: 'Patrimoine enveloppes actifs' },
  { label: 'Mon profil',            href: '/dashboard/profil',           icon: User,       color: '#94a3b8' },
  { label: 'Historique',            href: '/dashboard/history',          icon: History,    color: '#94a3b8' },
  { label: 'Intérêts Composés',     sub: 'Effet boule de neige',         href: '/dashboard/compound',         icon: TrendingUp, color: '#34d399', keywords: 'intérêts composés épargne' },
  { label: 'DCA',                   sub: 'Dollar Cost Averaging',        href: '/dashboard/dca',              icon: RefreshCw,  color: '#38bdf8', keywords: 'dca investissement régulier' },
  { label: 'FI/RE',                 sub: 'Indépendance financière',      href: '/dashboard/fire',             icon: Flame,      color: '#fb923c', keywords: 'fire liberté financière retraite anticipée feu' },
  { label: 'Retraite',              sub: 'Pension & trimestres',         href: '/dashboard/retirement',       icon: PiggyBank,  color: '#B07820', keywords: 'retraite pension trimestres' },
  { label: 'Budget 50/30/20',       sub: 'Besoins · Envies · Épargne',   href: '/dashboard/budget',           icon: Calculator, color: '#a3e635', keywords: 'budget dépenses' },
  { label: "Taux d'épargne",        sub: 'Sankey revenus / dépenses',    href: '/dashboard/savings-rate',     icon: Percent,    color: '#818cf8', keywords: 'épargne taux revenus' },
  { label: 'Épargne de précaution', sub: "Fonds d'urgence",              href: '/dashboard/emergency-fund',  icon: Shield,     color: '#34d399', keywords: 'urgence précaution fonds' },
  { label: 'Impôts sur le revenu',  sub: 'Calcul IR + TMI + barème',     href: '/dashboard/tax',              icon: Receipt,    color: '#fb7185', keywords: 'impôts fiscalité IR barème tmi' },
  { label: 'Flat Tax vs Barème',    sub: 'PFU 30% ou progressif',        href: '/dashboard/flat-tax',         icon: Scale,      color: '#38bdf8', keywords: 'flat tax pfu dividendes plus-values' },
  { label: 'PEA vs CTO vs AV',      sub: 'Comparaison fiscale enveloppes', href: '/dashboard/envelope-compare', icon: Wallet,  color: '#818cf8', keywords: 'pea cto assurance vie enveloppe' },
  { label: 'Prêt immobilier',       sub: 'Mensualités & amortissement',  href: '/dashboard/mortgage',         icon: Building2, color: '#f472b6', keywords: 'prêt crédit immobilier mensualités' },
  { label: 'Acheter vs Louer',      sub: 'Comparaison Patrimoniale',     href: '/dashboard/buyrent',          icon: Home,      color: '#a78bfa', keywords: 'achat location immobilier' },
  { label: 'Rentabilité locative',  sub: 'Rendement & cashflow',         href: '/dashboard/rental',           icon: Wallet,    color: '#2dd4bf', keywords: 'locatif rental rendement' },
  { label: 'Crédit consommation',   sub: 'Coût réel & TAEG',             href: '/dashboard/consumer-credit', icon: CreditCard, color: '#fb7185', keywords: 'crédit consommation coût' },
  { label: 'Succession & Donation', sub: 'Droits de mutation DMTG',      href: '/dashboard/succession',       icon: Receipt,   color: '#60a5fa', keywords: 'succession donation héritage' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => { setOpen(false); setQuery(''); setSelected(0) }, [])
  const toggle = useCallback(() => setOpen(v => { if (!v) { setQuery(''); setSelected(0) } return !v }), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); toggle() }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [toggle, close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40)
  }, [open])

  const filtered = query.trim()
    ? ITEMS.filter(i => {
        const q = query.toLowerCase()
        return i.label.toLowerCase().includes(q) || i.sub?.toLowerCase().includes(q) || i.keywords?.includes(q)
      })
    : ITEMS

  const navigate = useCallback((href: string) => { router.push(href); close() }, [router, close])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)) }
      else if (e.key === 'Enter' && filtered[selected]) navigate(filtered[selected].href)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, selected, filtered, navigate])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 9000 }}
      />
      {/* Palette */}
      <div style={{
        position: 'fixed', top: '16%', left: '50%', transform: 'translateX(-50%)',
        width: 'min(560px, calc(100vw - 32px))',
        background: 'var(--p-card)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18, boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        zIndex: 9001, overflow: 'hidden',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--p-line)' }}>
          <Search style={{ width: 15, height: 15, color: 'var(--p-text-dim)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Rechercher un simulateur, une page..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--p-text)', caretColor: '#B07820' }}
          />
          <kbd style={{ fontSize: 10, color: 'var(--p-text-faint)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '5px 0' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '28px', fontSize: 13, color: 'var(--p-text-dim)' }}>
              Aucun résultat pour « {query} »
            </p>
          ) : filtered.map((item, i) => {
            const Icon = item.icon
            const active = i === selected
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '9px 14px', border: 'none',
                  borderLeft: `2px solid ${active ? item.color : 'transparent'}`,
                  background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.08s',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${item.color}14`, border: `1px solid ${item.color}22` }}>
                  <Icon style={{ width: 13, height: 13, color: item.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: active ? 'var(--p-text)' : 'var(--p-text-em)', margin: 0 }}>{item.label}</p>
                  {item.sub && <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>{item.sub}</p>}
                </div>
                {active && <kbd style={{ fontSize: 10, color: 'var(--p-text-faint)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>↵</kbd>}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '7px 14px', borderTop: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 14 }}>
          {[['↑↓', 'naviguer'], ['↵', 'ouvrir'], ['ESC', 'fermer']].map(([key, lbl]) => (
            <span key={key} style={{ fontSize: 10, color: 'var(--p-text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>{key}</kbd>
              {lbl}
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: 'var(--p-text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ouvrir avec
            <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>⌘K</kbd>
          </span>
        </div>
      </div>
    </>
  )
}
