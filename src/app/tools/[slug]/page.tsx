import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TrendingUp, Check, ArrowRight, ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'

type ToolContent = {
  title: string
  tag: string
  color: string
  desc: string
  why: string[]
  steps: string[]
  cases: string[]
  href: string
}

const TOOL_CONTENT: Record<string, ToolContent> = {
  'interets-composes': {
    title: 'Calculateur intérêts composés',
    tag: 'Placements',
    color: '#f1c086',
    desc: 'Visualisez l\'effet boule de neige sur votre épargne. Simulez la croissance de votre capital sur 40 ans avec versements mensuels.',
    why: [
      'Comprendre pourquoi commencer tôt fait une différence de 300%',
      'Comparer différents taux de rendement en temps réel',
      'Calculer l\'impact de vos versements mensuels sur le long terme',
    ],
    steps: [
      'Entrez votre capital initial et vos versements mensuels',
      'Ajustez le taux de rendement annuel et la durée',
      'Lisez votre capital final et les gains générés',
    ],
    cases: [
      'Marie, 28 ans, veut savoir si 200€/mois pendant 30 ans suffisent pour sa retraite',
      'Thomas calcule la différence entre commencer à 25 ans vs 35 ans',
    ],
    href: '/dashboard/compound',
  },
  'fire': {
    title: 'Simulateur FI/RE',
    tag: 'Placements',
    color: '#fb923c',
    desc: 'Calculez votre date d\'indépendance financière. Combien épargner chaque mois pour ne plus jamais travailler par nécessité.',
    why: [
      'Fixer un objectif FIRE concret basé sur vos dépenses réelles',
      'Simuler l\'impact d\'une augmentation de revenus ou réduction de dépenses',
      'Comprendre la règle des 4% et le capital cible',
    ],
    steps: [
      'Renseignez vos dépenses mensuelles actuelles',
      'Indiquez votre patrimoine existant et épargne mensuelle',
      'Découvrez votre date FIRE et le capital à atteindre',
    ],
    cases: [
      'Antoine, 32 ans, veut partir à la retraite à 45 ans avec 3 000€/mois',
      'Julie optimise son taux d\'épargne pour raccourcir de 5 ans son chemin vers le FIRE',
    ],
    href: '/dashboard/fire',
  },
  'pret-immobilier': {
    title: 'Simulateur crédit immobilier',
    tag: 'Immobilier',
    color: '#f472b6',
    desc: 'Calculez vos mensualités, le coût total et le tableau d\'amortissement complet de votre prêt immobilier.',
    why: [
      'Comparer plusieurs offres de crédit en quelques secondes',
      'Visualiser la part capital vs intérêts mois par mois',
      'Calculer l\'impact d\'un remboursement anticipé',
    ],
    steps: [
      'Entrez le montant emprunté et la durée souhaitée',
      'Renseignez le taux d\'intérêt et l\'assurance',
      'Consultez mensualités, coût total et tableau d\'amortissement',
    ],
    cases: [
      'Famille cherchant un appartement à 280 000€ sur 25 ans',
      'Investisseur comparant un crédit sur 15 vs 20 ans pour un bien locatif',
    ],
    href: '/dashboard/mortgage',
  },
  'acheter-ou-louer': {
    title: 'Acheter ou louer ?',
    tag: 'Immobilier',
    color: '#38bdf8',
    desc: 'Comparez le coût total sur 20 ans entre achat et location selon votre situation personnelle et le marché local.',
    why: [
      'Dépasser les idées reçues sur l\'immobilier avec des chiffres réels',
      'Intégrer opportunité d\'investissement, charges, taxes',
      'Savoir combien d\'années il faut pour que l\'achat devienne rentable',
    ],
    steps: [
      'Entrez le prix du bien et les paramètres du crédit',
      'Renseignez le loyer équivalent et la rentabilité alternative',
      'Lisez le point de bascule et la comparaison sur 20 ans',
    ],
    cases: [
      'Couple à Paris hésitant entre acheter à 450 000€ ou continuer à louer à 1 800€/mois',
      'Jeune actif mobile ne sachant pas s\'il restera plus de 5 ans dans la même ville',
    ],
    href: '/dashboard/buyrent',
  },
  'impots-ir': {
    title: 'Calculateur impôts sur le revenu',
    tag: 'Fiscalité',
    color: '#34d399',
    desc: 'Estimez votre impôt sur le revenu 2026 avec les tranches officielles, vos déductions et parts fiscales.',
    why: [
      'Anticiper votre imposition avant la déclaration',
      'Simuler l\'impact d\'un changement de situation (mariage, enfant)',
      'Identifier les optimisations fiscales possibles',
    ],
    steps: [
      'Entrez vos revenus bruts annuels',
      'Indiquez votre situation familiale et parts fiscales',
      'Consultez votre TMI et impôt net estimé',
    ],
    cases: [
      'Salarié à 45 000€ brut voulant estimer son reste à vivre net',
      'Couple marié simulant l\'impact d\'une naissance sur leur imposition',
    ],
    href: '/dashboard/tax',
  },
  'flat-tax-bareme': {
    title: 'Flat Tax vs Barème progressif',
    tag: 'Fiscalité',
    color: '#818cf8',
    desc: 'Comparez le Prélèvement Forfaitaire Unique (30%) et le barème progressif pour vos revenus de capitaux mobiliers.',
    why: [
      'Choisir l\'option la moins taxée selon votre TMI',
      'Calculer l\'économie réelle en euros',
      'Comprendre quand le barème devient plus avantageux',
    ],
    steps: [
      'Renseignez vos dividendes et plus-values',
      'Indiquez votre tranche marginale d\'imposition',
      'Comparez flat tax 30% vs barème + prélèvements sociaux',
    ],
    cases: [
      'Investisseur avec 15 000€ de dividendes et TMI à 11%',
      'Trader actif avec 40 000€ de plus-values et TMI à 30%',
    ],
    href: '/dashboard/flat-tax',
  },
  'retraite': {
    title: 'Simulateur retraite',
    tag: 'Retraite',
    color: '#a78bfa',
    desc: 'Estimez votre future pension de retraite et calculez l\'épargne supplémentaire nécessaire pour maintenir votre niveau de vie.',
    why: [
      'Visualiser l\'écart entre pension et revenus actuels',
      'Calculer combien épargner chaque mois pour combler cet écart',
      'Comparer PER, assurance-vie et autres placements retraite',
    ],
    steps: [
      'Renseignez votre âge, salaire actuel et trimestres cotisés',
      'Choisissez votre âge de départ à la retraite cible',
      'Lisez votre pension estimée et le capital à constituer',
    ],
    cases: [
      'Salarié 45 ans avec 20 ans de cotisation voulant partir à 64 ans',
      'Indépendant souhaitant comparer PER vs assurance-vie pour sa retraite',
    ],
    href: '/dashboard/retirement',
  },
  'taux-epargne': {
    title: 'Calculateur taux d\'épargne',
    tag: 'Budget',
    color: '#60a5fa',
    desc: 'Analysez la répartition de vos revenus et calculez votre taux d\'épargne mensuel pour optimiser votre situation financière.',
    why: [
      'Identifier les postes de dépenses à optimiser',
      'Fixer un objectif de taux d\'épargne réaliste',
      'Suivre votre progression mois par mois',
    ],
    steps: [
      'Entrez vos revenus nets mensuels',
      'Listez vos dépenses fixes et variables',
      'Consultez votre taux d\'épargne et les recommandations',
    ],
    cases: [
      'Jeune actif à 2 500€/mois voulant atteindre 20% de taux d\'épargne',
      'Famille optimisant son budget pour dégager 500€/mois supplémentaires',
    ],
    href: '/dashboard/savings-rate',
  },
  'budget-50-30-20': {
    title: 'Budget 50/30/20',
    tag: 'Budget',
    color: '#34d399',
    desc: 'Appliquez la règle budgétaire 50/30/20 à vos revenus : 50% besoins, 30% envies, 20% épargne.',
    why: [
      'Structurer son budget simplement sans tableur complexe',
      'Identifier si ses dépenses sont équilibrées',
      'Savoir combien allouer à chaque catégorie au centime près',
    ],
    steps: [
      'Renseignez vos revenus mensuels nets',
      'Catégorisez vos dépenses actuelles',
      'Consultez l\'écart avec les recommandations 50/30/20',
    ],
    cases: [
      'Étudiant salarié à 1 800€/mois cherchant à structurer son budget',
      'Couple souhaitant augmenter sa capacité d\'épargne de 10%',
    ],
    href: '/dashboard/budget',
  },
  'dca': {
    title: 'Simulateur DCA',
    tag: 'Placements',
    color: '#22c55e',
    desc: 'Simulez l\'impact du Dollar Cost Averaging : investir un montant fixe chaque mois pour lisser le prix de revient.',
    why: [
      'Comprendre pourquoi les versements réguliers battent le market timing',
      'Comparer DCA mensuel vs investissement en une fois',
      'Calculer la performance historique sur ETF MSCI World',
    ],
    steps: [
      'Définissez le montant d\'investissement mensuel',
      'Choisissez la durée et le rendement moyen annuel',
      'Comparez avec un investissement unique équivalent',
    ],
    cases: [
      'Investisseur débutant plaçant 300€/mois dans un ETF World',
      'Comparaison DCA vs lump sum sur un héritage de 50 000€',
    ],
    href: '/dashboard/dca',
  },
  'pea-cto-av': {
    title: 'PEA vs CTO vs Assurance Vie',
    tag: 'Fiscalité',
    color: '#fb923c',
    desc: 'Comparez les trois principales enveloppes d\'investissement sur le rendement net après fiscalité sur 15 ans.',
    why: [
      'Choisir la meilleure enveloppe selon son horizon et ses objectifs',
      'Comprendre les avantages fiscaux de chaque enveloppe',
      'Calculer le rendement net réel pour un même investissement',
    ],
    steps: [
      'Entrez le capital initial et les versements mensuels',
      'Indiquez votre TMI et l\'horizon d\'investissement',
      'Comparez les trois enveloppes net d\'impôts',
    ],
    cases: [
      'Investisseur 35 ans comparant PEA vs AV pour 200€/mois pendant 20 ans',
      'Expatrié évaluant quelle enveloppe conserver avant un retour en France',
    ],
    href: '/dashboard/envelope-compare',
  },
  'epargne-urgence': {
    title: 'Calculateur épargne d\'urgence',
    tag: 'Budget',
    color: '#fbbf24',
    desc: 'Calculez le montant idéal de votre matelas de sécurité financière selon vos dépenses mensuelles et situation professionnelle.',
    why: [
      'Savoir exactement combien mettre de côté en livret A',
      'Adapter l\'objectif selon stabilité de l\'emploi et charges fixes',
      'Planifier la constitution du matelas mois par mois',
    ],
    steps: [
      'Renseignez vos dépenses mensuelles incompressibles',
      'Indiquez votre situation professionnelle',
      'Obtenez votre cible en euros et le plan de constitution',
    ],
    cases: [
      'Freelance voulant 6 mois de dépenses en sécurité avant d\'investir',
      'Couple avec enfant définissant leur niveau de sécurité minimal',
    ],
    href: '/dashboard/emergency-fund',
  },
  'rentabilite-locative': {
    title: 'Simulateur rentabilité locative',
    tag: 'Immobilier',
    color: '#34d399',
    desc: 'Calculez le rendement brut, net et le cash-flow mensuel de votre investissement locatif.',
    why: [
      'Comparer plusieurs biens sur leur rentabilité réelle',
      'Intégrer charges, taxe foncière, vacance locative et fiscalité',
      'Décider si un bien mérite le financement à crédit',
    ],
    steps: [
      'Entrez le prix d\'achat et le loyer mensuel',
      'Renseignez les charges, taxes et frais de gestion',
      'Consultez rendement brut, net et cash-flow',
    ],
    cases: [
      'Investisseur comparant un studio à 120 000€ vs un T3 à 180 000€',
      'Primo-investisseur calculant si son bien sera autofinancé',
    ],
    href: '/dashboard/rental',
  },
  'succession': {
    title: 'Simulateur succession & donations',
    tag: 'Fiscalité',
    color: '#fb7185',
    desc: 'Estimez les droits de succession selon le lien de parenté et optimisez votre stratégie de transmission patrimoniale.',
    why: [
      'Anticiper l\'impôt sur la succession pour ses héritiers',
      'Comprendre l\'intérêt des donations du vivant',
      'Comparer les abattements selon lien de parenté',
    ],
    steps: [
      'Indiquez la valeur des actifs à transmettre',
      'Choisissez le lien de parenté avec le bénéficiaire',
      'Consultez les droits dus et les stratégies d\'optimisation',
    ],
    cases: [
      'Parent souhaitant transmettre 300 000€ à ses enfants avec le moins d\'impôts possible',
      'Couple sans enfant planifiant la transmission à des neveux',
    ],
    href: '/dashboard/succession',
  },
  'score-patrimonial': {
    title: 'Score patrimonial PatrImo',
    tag: 'Retraite',
    color: '#f1c086',
    desc: 'Obtenez une notation 0-100 de votre santé financière sur 6 piliers : épargne, dettes, diversification, fiscal, prévoyance, FIRE.',
    why: [
      'Identifier vos points forts et axes d\'amélioration',
      'Suivre votre progression financière dans le temps',
      'Obtenir des recommandations personnalisées par pilier',
    ],
    steps: [
      'Renseignez votre situation financière globale',
      'Le simulateur analyse 6 piliers clés',
      'Recevez votre score et vos recommandations',
    ],
    cases: [
      'Jeune actif voulant un diagnostic de sa situation financière à 30 ans',
      'Investisseur expérimenté suivant son score patrimonial chaque trimestre',
    ],
    href: '/dashboard/score',
  },
  'revenus-passifs': {
    title: 'Simulateur revenus passifs & dividendes',
    tag: 'Placements',
    color: '#c084fc',
    desc: 'Calculez vos futurs dividendes et revenus passifs selon votre capital investi et votre stratégie de distribution.',
    why: [
      'Visualiser quand vos dividendes couvriront vos charges',
      'Comparer dividendes réinvestis vs distribués',
      'Calculer le capital nécessaire pour vivre de ses revenus passifs',
    ],
    steps: [
      'Entrez le capital investi et le taux de distribution',
      'Choisissez la stratégie : réinvestissement ou distribution',
      'Projetez vos revenus sur 10, 20, 30 ans',
    ],
    cases: [
      'Investisseur voulant 1 000€/mois de dividendes pour compléter sa retraite',
      'ETF World accumulant vs distribuant : comparaison après fiscalité',
    ],
    href: '/dashboard/dividends',
  },
  'optimiseur-etf': {
    title: 'Optimiseur ETF & comparateur TER',
    tag: 'Placements',
    color: '#f1c086',
    desc: 'Comparez les ETF par TER, benchmark et impact des frais sur la performance sur 20 ans.',
    why: [
      'Choisir l\'ETF le moins cher à exposition équivalente',
      'Calculer l\'impact des frais en euros sur 20 ans',
      'Identifier les alternatives moins coûteuses à vos ETF actuels',
    ],
    steps: [
      'Entrez l\'ETF ou le ticker que vous analysez',
      'Comparez avec les alternatives disponibles',
      'Calculez l\'impact des frais sur votre rendement à long terme',
    ],
    cases: [
      'Investisseur comparant iShares Core MSCI World vs Amundi MSCI World',
      'Portfolio de 50 000€ : calcul du manque à gagner lié aux frais',
    ],
    href: '/dashboard/etf-optimizer',
  },
  'credit-conso': {
    title: 'Calculateur coût réel crédit conso',
    tag: 'Budget',
    color: '#fb7185',
    desc: 'Visualisez le coût total réel de vos crédits à la consommation : intérêts, assurance et impact sur votre patrimoine.',
    why: [
      'Comprendre le vrai coût d\'un crédit revolving ou auto',
      'Comparer financement comptant vs crédit',
      'Calculer le manque à gagner si le capital avait été investi',
    ],
    steps: [
      'Entrez le montant emprunté, la durée et le TAEG',
      'Consultez les intérêts totaux et le coût réel',
      'Comparez avec l\'alternative investissement',
    ],
    cases: [
      'Achat d\'une voiture à 20 000€ : crédit 4 ans vs achat comptant',
      'Revolving à 18% TAEG : combien coûte vraiment ce crédit ?',
    ],
    href: '/dashboard/consumer-credit',
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tool = TOOL_CONTENT[slug]
  if (!tool) return { title: 'Simulateur — PatrImo' }
  return {
    title: `${tool.title} — PatrImo`,
    description: tool.desc,
    openGraph: {
      title: `${tool.title} — PatrImo`,
      description: tool.desc,
      url: `https://finance.digitalstack.cloud/tools/${slug}`,
      images: [{ url: `https://finance.digitalstack.cloud/api/og?type=${slug}&title=${encodeURIComponent(tool.title)}`, width: 1200, height: 630 }],
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(TOOL_CONTENT).map(slug => ({ slug }))
}

export default async function ToolSlugPage({ params }: Props) {
  const { slug } = await params
  const tool = TOOL_CONTENT[slug]
  if (!tool) redirect('/tools')

  const { title, tag, color, desc, why, steps, cases, href } = tool

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#000' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>PatrImo</span>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: 20, background: 'rgba(241,192,134,0.10)', border: '1px solid rgba(241,192,134,0.25)', color: '#f1c086', fontSize: 13, fontWeight: 600 }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Back link */}
        <div style={{ paddingTop: 32, marginBottom: 40 }}>
          <Link href="/tools" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, transition: 'color 0.2s' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
            Tous les simulateurs
          </Link>
        </div>

        {/* Hero */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 20,
              background: color + '18',
              border: `1px solid ${color}35`,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              color,
              textTransform: 'uppercase' as const,
            }}>
              {tag}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 18px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            {title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 0 32px', lineHeight: 1.6 }}>
            {desc}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <Link href={href} style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 24,
              background: `linear-gradient(135deg, ${color}cc, ${color})`,
              color: '#000',
              fontWeight: 700,
              fontSize: 15,
            }}>
              Essayer maintenant
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/tools" style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 24px',
              borderRadius: 24,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 600,
              fontSize: 15,
            }}>
              Voir tous les simulateurs
            </Link>
          </div>
        </section>

        {/* Pourquoi ce simulateur */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 28px', letterSpacing: '-0.03em' }}>
            Pourquoi ce simulateur ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {why.map((reason, i) => (
              <div key={i} style={{
                padding: '22px 20px',
                borderRadius: 14,
                background: color + '12',
                border: `1px solid ${color}25`,
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Check style={{ width: 14, height: 14, color }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 36px', letterSpacing: '-0.03em' }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 32 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0,
                  fontSize: 40,
                  fontWeight: 900,
                  lineHeight: 1,
                  color,
                  letterSpacing: '-0.04em',
                  opacity: 0.9,
                  minWidth: 52,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{
                  paddingTop: 6,
                  paddingBottom: 24,
                  borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  flex: 1,
                }}>
                  <p style={{ margin: 0, fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontWeight: 500 }}>
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cas d'usage */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.03em' }}>
            Cas d&apos;usage
          </h2>
          <div style={{
            padding: '28px 28px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 18 }}>
              {cases.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ color, fontSize: 20, lineHeight: 1.3, flexShrink: 0, fontWeight: 700 }}>•</span>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.70)', lineHeight: 1.6 }}>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section style={{
          textAlign: 'center',
          padding: '48px 32px',
          borderRadius: 20,
          background: 'rgba(241,192,134,0.05)',
          border: '1px solid rgba(241,192,134,0.15)',
        }}>
          <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            Prêt à simuler votre situation ?
          </h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 28px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Créez un compte gratuit pour sauvegarder vos simulations, suivre votre patrimoine et accéder à toutes les fonctionnalités.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            padding: '13px 30px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #c8922a, #f1c086)',
            color: '#000',
            fontWeight: 700,
            fontSize: 15,
          }}>
            Commencer gratuitement
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </section>

      </main>
    </div>
  )
}
