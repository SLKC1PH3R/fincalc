import Link from 'next/link'
import { TrendingUp, Flame, Home, Receipt, PiggyBank, Percent, Calculator, RefreshCw, Scale, Landmark, Shield, Wallet, Users, ShieldCheck, Bitcoin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulateurs financiers gratuits — FinCalc',
  description: 'Calculez vos intérêts composés, simulez votre retraite FIRE, optimisez vos impôts et votre crédit immobilier. Gratuit, sans inscription.',
  openGraph: {
    title: 'Simulateurs financiers gratuits — FinCalc',
    description: '32 simulateurs pour piloter votre patrimoine, vos investissements et votre fiscalité.',
    url: 'https://app.fincalc.fr/tools',
  },
}

const TOOLS = [
  {
    slug: 'interets-composes',
    label: 'Intérêts composés',
    description: 'Calculez la croissance de votre épargne sur le long terme avec l\'effet boule de neige.',
    tag: 'Placements',
    color: '#f1c086',
    icon: TrendingUp,
    href: '/dashboard/compound',
  },
  {
    slug: 'fire',
    label: 'Indépendance financière FI/RE',
    description: 'Calculez combien vous devez épargner chaque mois pour atteindre la liberté financière.',
    tag: 'Placements',
    color: '#fb923c',
    icon: Flame,
    href: '/dashboard/fire',
  },
  {
    slug: 'pret-immobilier',
    label: 'Simulateur prêt immobilier',
    description: 'Mensualités, coût total, tableau d\'amortissement complet pour votre crédit.',
    tag: 'Immobilier',
    color: '#f472b6',
    icon: Home,
    href: '/dashboard/mortgage',
  },
  {
    slug: 'acheter-ou-louer',
    label: 'Acheter vs Louer',
    description: 'Comparez le coût total sur 20 ans entre achat et location selon votre situation.',
    tag: 'Immobilier',
    color: '#38bdf8',
    icon: Home,
    href: '/dashboard/buyrent',
  },
  {
    slug: 'impots-ir',
    label: 'Calcul impôts IR',
    description: 'Estimez votre impôt sur le revenu après déductions, tranches et parts fiscales.',
    tag: 'Fiscalité',
    color: '#34d399',
    icon: Receipt,
    href: '/dashboard/tax',
  },
  {
    slug: 'flat-tax-bareme',
    label: 'Flat Tax vs Barème',
    description: 'Comparez la Flat Tax 30% et le barème progressif pour vos revenus de capitaux.',
    tag: 'Fiscalité',
    color: '#818cf8',
    icon: Scale,
    href: '/dashboard/flat-tax',
  },
  {
    slug: 'retraite',
    label: 'Simulateur retraite',
    description: 'Estimez votre pension et calculez l\'épargne retraite nécessaire pour maintenir votre niveau de vie.',
    tag: 'Retraite',
    color: '#a78bfa',
    icon: PiggyBank,
    href: '/dashboard/retirement',
  },
  {
    slug: 'taux-epargne',
    label: "Taux d'épargne",
    description: 'Analysez vos revenus vs dépenses et suivez votre taux d\'épargne mensuel.',
    tag: 'Budget',
    color: '#60a5fa',
    icon: Percent,
    href: '/dashboard/savings-rate',
  },
  {
    slug: 'budget-50-30-20',
    label: 'Budget 50/30/20',
    description: 'Appliquez la règle budgétaire 50/30/20 à vos revenus pour optimiser vos finances.',
    tag: 'Budget',
    color: '#34d399',
    icon: Calculator,
    href: '/dashboard/budget',
  },
  {
    slug: 'dca',
    label: 'Dollar Cost Averaging (DCA)',
    description: 'Simulez l\'impact d\'investir régulièrement à intervalle fixe sur la durée.',
    tag: 'Placements',
    color: '#22c55e',
    icon: RefreshCw,
    href: '/dashboard/dca',
  },
  {
    slug: 'pea-cto-av',
    label: 'PEA vs CTO vs Assurance Vie',
    description: 'Comparez les enveloppes fiscales pour maximiser votre rendement net après impôts.',
    tag: 'Fiscalité',
    color: '#fb923c',
    icon: Landmark,
    href: '/dashboard/envelope-compare',
  },
  {
    slug: 'epargne-urgence',
    label: "Épargne d'urgence",
    description: 'Calculez votre matelas de sécurité idéal selon vos dépenses mensuelles.',
    tag: 'Budget',
    color: '#fbbf24',
    icon: ShieldCheck,
    href: '/dashboard/emergency-fund',
  },
]

const TAG_COLORS: Record<string, string> = {
  Placements: '#f1c086', Immobilier: '#f472b6', Fiscalité: '#818cf8',
  Retraite: '#a78bfa', Budget: '#34d399',
}

export default function ToolsPage() {
  const tags = [...new Set(TOOLS.map(t => t.tag))]

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#000' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>FinCalc</span>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: 20, background: 'rgba(241,192,134,0.10)', border: '1px solid rgba(241,192,134,0.25)', color: '#f1c086', fontSize: 13, fontWeight: 600 }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(241,192,134,0.08)', border: '1px solid rgba(241,192,134,0.2)', fontSize: 12, color: '#f1c086', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 16 }}>
            32 SIMULATEURS GRATUITS
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Simulateurs financiers
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto' }}>
            Calculez, simulez et optimisez votre patrimoine. Gratuit, sans inscription, sans données bancaires.
          </p>
        </div>

        {/* Groups by tag */}
        {tags.map(tag => (
          <div key={tag} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TAG_COLORS[tag] || '#f1c086' }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{tag}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {TOOLS.filter(t => t.tag === tag).map(tool => {
                const Icon = tool.icon
                return (
                  <Link key={tool.slug} href={tool.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '20px 22px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', height: '100%',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tool.color + '44'; (e.currentTarget as HTMLElement).style.background = tool.color + '08' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
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

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: '40px 24px', borderRadius: 20, background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.15)' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>Sauvegardez vos simulations</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>Créez un compte gratuit pour accéder à votre historique, votre patrimoine et toutes les fonctionnalités avancées.</p>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 24, background: 'linear-gradient(135deg, #c8922a, #f1c086)', color: '#000', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Démarrer gratuitement →
          </Link>
        </div>
      </main>
    </div>
  )
}
