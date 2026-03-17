import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

const SLUG_MAP: Record<string, { href: string; title: string; description: string }> = {
  'interets-composes':  { href: '/dashboard/compound',        title: 'Calculateur intérêts composés',             description: 'Simulez l\'effet boule de neige sur votre épargne sur 40 ans.' },
  'fire':               { href: '/dashboard/fire',            title: 'Simulateur FI/RE — Indépendance financière', description: 'Calculez le capital et le taux d\'épargne nécessaires pour votre liberté financière.' },
  'pret-immobilier':    { href: '/dashboard/mortgage',        title: 'Simulateur prêt immobilier',                description: 'Mensualités, coût total, tableau d\'amortissement de votre crédit.' },
  'acheter-ou-louer':   { href: '/dashboard/buyrent',         title: 'Acheter ou louer ?',                        description: 'Comparez le coût sur 20 ans entre achat et location.' },
  'impots-ir':          { href: '/dashboard/tax',             title: 'Calculateur impôts IR',                     description: 'Estimez votre impôt sur le revenu après déductions.' },
  'flat-tax-bareme':    { href: '/dashboard/flat-tax',        title: 'Flat Tax vs Barème',                        description: 'Choisissez l\'option la plus avantageuse pour vos revenus financiers.' },
  'retraite':           { href: '/dashboard/retirement',      title: 'Simulateur retraite',                       description: 'Projetez votre pension et votre besoin d\'épargne pour la retraite.' },
  'taux-epargne':       { href: '/dashboard/savings-rate',    title: 'Calculateur taux d\'épargne',              description: 'Analysez vos revenus et dépenses pour optimiser votre épargne.' },
  'budget-50-30-20':    { href: '/dashboard/budget',          title: 'Budget 50/30/20',                           description: 'Appliquez la règle budgétaire à vos revenus mensuels.' },
  'dca':                { href: '/dashboard/dca',             title: 'Simulateur DCA',                            description: 'Mesurez l\'impact d\'investissements réguliers sur le long terme.' },
  'pea-cto-av':         { href: '/dashboard/envelope-compare', title: 'PEA vs CTO vs Assurance Vie',             description: 'Comparez les enveloppes fiscales pour maximiser votre rendement.' },
  'epargne-urgence':    { href: '/dashboard/emergency-fund',  title: 'Calculateur épargne d\'urgence',           description: 'Déterminez votre matelas de sécurité idéal.' },
  'rentabilite-locative': { href: '/dashboard/rental',        title: 'Simulateur rentabilité locative',          description: 'Calculez le rendement brut et net de vos investissements immobiliers.' },
  'succession':         { href: '/dashboard/succession',      title: 'Simulateur succession & donations',         description: 'Estimez les droits de succession et optimisez votre transmission.' },
  'dividendes':         { href: '/dashboard/dividends',       title: 'Simulateur revenus passifs',               description: 'Calculez vos dividendes et revenus passifs futurs.' },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tool = SLUG_MAP[slug]
  if (!tool) return { title: 'Simulateur — FinCalc' }
  return {
    title: `${tool.title} — FinCalc`,
    description: tool.description,
    openGraph: {
      title: `${tool.title} — FinCalc`,
      description: tool.description,
      url: `https://app.fincalc.fr/tools/${slug}`,
      images: [{ url: `https://app.fincalc.fr/api/og?type=${slug}&title=${encodeURIComponent(tool.title)}`, width: 1200, height: 630 }],
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(SLUG_MAP).map(slug => ({ slug }))
}

export default async function ToolSlugPage({ params }: Props) {
  const { slug } = await params
  const tool = SLUG_MAP[slug]
  // Redirect to the actual simulator (requires login — could show a preview page instead)
  redirect(tool?.href ?? '/tools')
}
