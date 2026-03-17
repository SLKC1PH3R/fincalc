'use client'
import Link from 'next/link'
import { TrendingUp, Flame, Home, Receipt, PiggyBank, Percent, Calculator, RefreshCw, Scale, Landmark, ShieldCheck } from 'lucide-react'

const TOOLS = [
  { slug: 'interets-composes', label: 'Intérêts composés',              description: "Calculez la croissance de votre épargne sur le long terme avec l'effet boule de neige.", tag: 'Placements',  color: '#f1c086', icon: TrendingUp,  href: '/dashboard/compound' },
  { slug: 'fire',              label: 'Indépendance financière FI/RE',   description: "Calculez combien vous devez épargner chaque mois pour atteindre la liberté financière.",   tag: 'Placements',  color: '#fb923c', icon: Flame,       href: '/dashboard/fire' },
  { slug: 'dca',               label: 'Dollar Cost Averaging (DCA)',     description: "Simulez l'impact d'investir régulièrement à intervalle fixe sur la durée.",                   tag: 'Placements',  color: '#22c55e', icon: RefreshCw,   href: '/dashboard/dca' },
  { slug: 'pret-immobilier',   label: 'Simulateur prêt immobilier',      description: "Mensualités, coût total, tableau d'amortissement complet pour votre crédit.",                 tag: 'Immobilier',  color: '#f472b6', icon: Home,        href: '/dashboard/mortgage' },
  { slug: 'acheter-ou-louer',  label: 'Acheter vs Louer',                description: "Comparez le coût total sur 20 ans entre achat et location selon votre situation.",           tag: 'Immobilier',  color: '#38bdf8', icon: Home,        href: '/dashboard/buyrent' },
  { slug: 'impots-ir',         label: 'Calcul impôts IR',                description: "Estimez votre impôt sur le revenu après déductions, tranches et parts fiscales.",            tag: 'Fiscalité',   color: '#34d399', icon: Receipt,     href: '/dashboard/tax' },
  { slug: 'flat-tax-bareme',   label: 'Flat Tax vs Barème',              description: "Comparez la Flat Tax 30% et le barème progressif pour vos revenus de capitaux.",             tag: 'Fiscalité',   color: '#818cf8', icon: Scale,       href: '/dashboard/flat-tax' },
  { slug: 'pea-cto-av',        label: 'PEA vs CTO vs Assurance Vie',     description: "Comparez les enveloppes fiscales pour maximiser votre rendement net après impôts.",          tag: 'Fiscalité',   color: '#fb923c', icon: Landmark,    href: '/dashboard/envelope-compare' },
  { slug: 'retraite',          label: 'Simulateur retraite',             description: "Estimez votre pension et calculez l'épargne retraite nécessaire pour maintenir votre niveau de vie.", tag: 'Retraite', color: '#a78bfa', icon: PiggyBank,   href: '/dashboard/retirement' },
  { slug: 'taux-epargne',      label: "Taux d'épargne",                  description: "Analysez vos revenus vs dépenses et suivez votre taux d'épargne mensuel.",                   tag: 'Budget',      color: '#60a5fa', icon: Percent,     href: '/dashboard/savings-rate' },
  { slug: 'budget-50-30-20',   label: 'Budget 50/30/20',                 description: "Appliquez la règle budgétaire 50/30/20 à vos revenus pour optimiser vos finances.",          tag: 'Budget',      color: '#34d399', icon: Calculator,  href: '/dashboard/budget' },
  { slug: 'epargne-urgence',   label: "Épargne d'urgence",               description: "Calculez votre matelas de sécurité idéal selon vos dépenses mensuelles.",                   tag: 'Budget',      color: '#fbbf24', icon: ShieldCheck, href: '/dashboard/emergency-fund' },
]

const TAG_COLORS: Record<string, string> = {
  Placements: '#f1c086', Immobilier: '#f472b6', Fiscalité: '#818cf8',
  Retraite: '#a78bfa', Budget: '#34d399',
}

export function ToolsGrid() {
  const tags = [...new Set(TOOLS.map(t => t.tag))]

  return (
    <>
      {tags.map(tag => (
        <div key={tag} style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TAG_COLORS[tag] || '#f1c086' }} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0 }}>{tag}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {TOOLS.filter(t => t.tag === tag).map(tool => {
              const Icon = tool.icon
              return (
                <Link key={tool.slug} href={tool.href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '20px 22px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', height: '100%',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = tool.color + '44'
                      el.style.background = tool.color + '08'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = 'rgba(255,255,255,0.07)'
                      el.style.background = 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: tool.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16, color: tool.color }} />
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{tool.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, margin: 0 }}>{tool.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
