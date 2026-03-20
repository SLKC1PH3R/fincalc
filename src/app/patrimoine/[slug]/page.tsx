import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TrendingUp, Check, ArrowRight, ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'

type PageContent = {
  title: string
  tag: string
  color: string
  desc: string
  why: string[]
  steps: string[]
  cases: string[]
  href: string
}

const PAGE_CONTENT: Record<string, PageContent> = {
  'vue-ensemble': {
    title: "Vue d'ensemble patrimoine",
    tag: 'Patrimoine',
    color: '#f1c086',
    desc: "Votre bilan patrimonial complet en un coup d'œil : actifs, passifs, répartition par classe d'actifs et évolution dans le temps avec carte monde géographique.",
    why: [
      "Visualiser instantanément votre patrimoine net (actifs − passifs) en temps réel",
      "Identifier les déséquilibres de répartition entre immobilier, actions, livrets et crypto",
      "Suivre l'évolution de votre patrimoine mois après mois avec un historique graphique",
    ],
    steps: [
      "Connectez-vous et renseignez vos différentes enveloppes et actifs",
      "Le dashboard agrège automatiquement toutes vos données en un seul bilan",
      "Consultez la répartition, la carte monde et les KPIs clés de votre patrimoine",
    ],
    cases: [
      "Salarié 38 ans voulant avoir une vision consolidée de ses 4 enveloppes (PEA, AV, livrets, immo)",
      "Investisseur multi-actifs suivant l'évolution de son patrimoine de 250 000€ chaque trimestre",
    ],
    href: '/dashboard/patrimoine',
  },
  'immobilier': {
    title: 'Gestion immobilière',
    tag: 'Patrimoine',
    color: '#f472b6',
    desc: "Centralisez tous vos biens immobiliers : résidence principale, investissements locatifs, SCPI. Suivi de la valeur, du crédit restant et des loyers perçus.",
    why: [
      "Suivre la valeur de marché estimée de chaque bien et l'équité accumulée",
      "Visualiser le crédit restant et la progression du remboursement en temps réel",
      "Calculer la rentabilité nette de vos investissements locatifs automatiquement",
    ],
    steps: [
      "Ajoutez vos biens immobiliers avec leur valeur d'achat et valeur actuelle estimée",
      "Renseignez le crédit associé (capital restant, taux, mensualité)",
      "Suivez loyers, charges, vacance locative et rentabilité nette",
    ],
    cases: [
      "Propriétaire d'une RP et d'un appartement locatif voulant suivre son équité globale",
      "Investisseur en SCPI consolidant ses parts avec ses biens en direct",
    ],
    href: '/dashboard/patrimoine/immobilier',
  },
  'actions-fonds': {
    title: 'Actions & Fonds',
    tag: 'Patrimoine',
    color: '#34d399',
    desc: "Suivez toutes vos positions en actions et fonds : PEA, CTO, Assurance Vie, PER. Valorisation en temps réel, allocation par classe d'actifs et performance globale.",
    why: [
      "Consolider PEA, CTO, AV et PER dans une vue unifiée sans les mélanger",
      "Connaître la valorisation live de chaque enveloppe et la performance globale",
      "Analyser la diversification géographique et sectorielle de votre portefeuille",
    ],
    steps: [
      "Créez vos enveloppes (PEA, CTO, AV, PER) et renseignez les positions",
      "Le système récupère les prix en temps réel via Finnhub et CoinGecko",
      "Consultez la valorisation totale, les gains latents et la répartition",
    ],
    cases: [
      "Investisseur avec 80 000€ répartis sur PEA, CTO et AV voulant une vue consolidée",
      "Épargnant voulant connaître sa vraie performance nette après frais et fiscalité",
    ],
    href: '/dashboard/patrimoine/actions',
  },
  'livrets': {
    title: 'Livrets & Épargne réglementée',
    tag: 'Patrimoine',
    color: '#38bdf8',
    desc: "Centralisez vos livrets réglementés (Livret A, LDDS, LEP, CEL, PEL) avec suivi des plafonds, des taux en vigueur et des intérêts générés.",
    why: [
      "Savoir en un clin d'œil si vos livrets sont à leurs plafonds légaux",
      "Calculer les intérêts générés sur l'année selon les taux réglementés 2026",
      "Identifier la part de votre épargne de précaution vs épargne investissable",
    ],
    steps: [
      "Ajoutez chaque livret avec son solde actuel et sa banque",
      "Le simulateur affiche automatiquement le plafond légal et le taux en vigueur",
      "Consultez les intérêts projetés sur 12 mois et le solde restant avant plafond",
    ],
    cases: [
      "Épargnant voulant savoir s'il a de la place sur son LEP avant d'y transférer de l'argent",
      "Famille avec 4 livrets dans 2 banques différentes cherchant une vue consolidée",
    ],
    href: '/dashboard/patrimoine/livrets',
  },
  'autres-actifs': {
    title: 'Autres actifs & Crypto',
    tag: 'Patrimoine',
    color: '#fb923c',
    desc: "Tracez vos crypto-monnaies, métaux précieux, private equity et actifs alternatifs. Prix live via CoinGecko pour les crypto, valorisation manuelle pour les autres.",
    why: [
      "Intégrer la crypto dans votre bilan patrimonial global avec prix live",
      "Suivre l'or et les métaux précieux à leur valeur de marché actuelle",
      "Mesurer le poids réel des actifs alternatifs dans votre allocation globale",
    ],
    steps: [
      "Ajoutez vos positions crypto avec le ticker (BTC, ETH…) et la quantité détenue",
      "Pour les métaux précieux, renseignez le poids et la forme (lingot, pièce…)",
      "Consultez la valorisation live et l'évolution de votre allocation alternative",
    ],
    cases: [
      "Investisseur avec 5% de son patrimoine en Bitcoin et Ethereum suivant la volatilité",
      "Collectionneur de pièces d'or intégrant ses métaux précieux dans son bilan patrimonial",
    ],
    href: '/dashboard/patrimoine/autres',
  },
  'comptes-bancaires': {
    title: 'Comptes bancaires',
    tag: 'Patrimoine',
    color: '#a78bfa',
    desc: "Centralisez les soldes de vos comptes courants et d'épargne bancaires. Suivi de la liquidité disponible et répartition de votre trésorerie.",
    why: [
      "Avoir une vision claire de votre liquidité totale disponible à tout moment",
      "Suivre la répartition de votre trésorerie entre différentes banques",
      "Identifier les comptes inactifs ou sous-utilisés à optimiser",
    ],
    steps: [
      "Ajoutez chaque compte avec son solde actuel et sa banque",
      "Mettez à jour les soldes régulièrement ou à chaque relevé bancaire",
      "Consultez votre liquidité totale intégrée dans votre bilan patrimonial",
    ],
    cases: [
      "Client multi-bancaire (BNP, Boursorama, Revolut) voulant son solde total en temps réel",
      "Chef d'entreprise distinguant comptes pro et comptes perso dans son bilan",
    ],
    href: '/dashboard/patrimoine/comptes',
  },
  'emprunts': {
    title: "Vue consolidée des emprunts",
    tag: 'Patrimoine',
    color: '#fb7185',
    desc: "Centralisez tous vos crédits en cours : immobilier, consommation, auto. Capital restant dû global, mensualités totales et date de fin de chaque crédit.",
    why: [
      "Connaître votre dette totale consolidée en un seul endroit",
      "Visualiser le capital restant dû et la progression du remboursement",
      "Calculer votre taux d'endettement global et l'impact sur votre patrimoine net",
    ],
    steps: [
      "Renseignez chaque crédit : type, capital initial, taux, durée, date de début",
      "Le système calcule automatiquement le capital restant dû et les intérêts futurs",
      "Consultez votre endettement total et votre patrimoine net (actifs − passifs)",
    ],
    cases: [
      "Propriétaire avec un crédit immo et un crédit auto voulant son endettement total",
      "Investisseur locatif avec 3 crédits immobiliers suivant son levier financier",
    ],
    href: '/dashboard/patrimoine/emprunts',
  },
  'detail-enveloppe': {
    title: "Détail d'une enveloppe",
    tag: 'Patrimoine',
    color: '#94a3b8',
    desc: "Page individuelle pour chaque enveloppe patrimoniale : positions détaillées, historique des mouvements, performance et métadonnées personnalisées.",
    why: [
      "Zoomer sur une enveloppe spécifique (ex : PEA) sans bruit des autres actifs",
      "Consulter l'historique complet des versements, retraits et arbitrages",
      "Analyser la performance de chaque enveloppe indépendamment",
    ],
    steps: [
      "Cliquez sur n'importe quelle enveloppe depuis la vue d'ensemble",
      "Consultez les positions détaillées avec leur prix de revient et plus-value latente",
      "Accédez à l'historique des mouvements et aux métriques de performance",
    ],
    cases: [
      "Investisseur voulant analyser la performance de son PEA séparément de son CTO",
      "Épargnant consultant l'historique de ses versements sur son assurance-vie",
    ],
    href: '/dashboard/patrimoine',
  },
  'portefeuille': {
    title: 'Mon Portefeuille — positions live',
    tag: 'Suivi & Trading',
    color: '#38bdf8',
    desc: "Suivi en temps réel de vos positions boursières et crypto avec prix live via Finnhub et CoinGecko. P&L latent, performance par position et vue d'ensemble du portefeuille.",
    why: [
      "Voir la valorisation de chaque position mise à jour en temps réel",
      "Calculer le P&L latent et le rendement de chaque ligne",
      "Analyser la diversification de votre portefeuille par secteur et géographie",
    ],
    steps: [
      "Ajoutez vos positions avec le ticker, la quantité et le prix de revient moyen",
      "Les prix se mettent à jour automatiquement via Finnhub (actions) et CoinGecko (crypto)",
      "Consultez le P&L latent, le rendement total et la répartition de votre portefeuille",
    ],
    cases: [
      "Trader actif suivant un portefeuille de 15 actions avec valorisation live",
      "Investisseur long terme suivant son ETF World + quelques positions individuelles",
    ],
    href: '/dashboard/portfolio',
  },
  'mon-portefeuille': {
    title: 'Mon Portefeuille — positions live',
    tag: 'Suivi & Trading',
    color: '#38bdf8',
    desc: "Suivi en temps réel de vos positions boursières et crypto avec prix live via Finnhub et CoinGecko. P&L latent, performance par position et vue d'ensemble du portefeuille.",
    why: [
      "Voir la valorisation de chaque position mise à jour en temps réel",
      "Calculer le P&L latent et le rendement de chaque ligne",
      "Analyser la diversification de votre portefeuille par secteur et géographie",
    ],
    steps: [
      "Ajoutez vos positions avec le ticker, la quantité et le prix de revient moyen",
      "Les prix se mettent à jour automatiquement via Finnhub (actions) et CoinGecko (crypto)",
      "Consultez le P&L latent, le rendement total et la répartition de votre portefeuille",
    ],
    cases: [
      "Trader actif suivant un portefeuille de 15 actions avec valorisation live",
      "Investisseur long terme suivant son ETF World + quelques positions individuelles",
    ],
    href: '/dashboard/portfolio',
  },
  'reequilibrage': {
    title: 'Rééquilibrage de portefeuille',
    tag: 'Suivi & Trading',
    color: '#34d399',
    desc: "Calculez les arbitrages nécessaires pour revenir à votre allocation cible. Identifiez les sur-pondérations et sous-pondérations par rapport à votre stratégie.",
    why: [
      "Maintenir la discipline de votre allocation cible sans calcul manuel",
      "Identifier précisément quoi acheter, vendre ou réduire pour rééquilibrer",
      "Éviter le biais émotionnel en suivant une allocation rationnelle et définie",
    ],
    steps: [
      "Définissez votre allocation cible en pourcentages par classe d'actifs",
      "Le simulateur compare votre allocation actuelle à la cible",
      "Recevez les montants précis à arbitrer pour revenir à l'équilibre",
    ],
    cases: [
      "Investisseur 80/20 (actions/obligations) dont le portefeuille est passé à 88/12 après une hausse",
      "Gestionnaire d'un portefeuille multi-classes rééquilibrant trimestriellement",
    ],
    href: '/dashboard/rebalancing',
  },
  'objectifs': {
    title: 'Mes Objectifs financiers',
    tag: 'Suivi & Trading',
    color: '#fb923c',
    desc: "Créez et suivez vos objectifs financiers personnalisés avec barre de progression, date cible et épargne mensuelle nécessaire pour les atteindre.",
    why: [
      "Donner un sens concret à votre épargne avec des objectifs chiffrés",
      "Calculer automatiquement l'effort d'épargne mensuel pour chaque objectif",
      "Rester motivé grâce au suivi visuel de la progression vers chaque objectif",
    ],
    steps: [
      "Créez un objectif avec un nom, un montant cible et une date souhaitée",
      "Associez un compte ou une enveloppe à cet objectif",
      "Suivez la progression et ajustez votre épargne si nécessaire",
    ],
    cases: [
      "Couple épargnant pour un apport immobilier de 40 000€ dans 3 ans",
      "Parent constituant un capital études de 20 000€ pour son enfant en 10 ans",
    ],
    href: '/dashboard/goals',
  },
  'mes-objectifs': {
    title: 'Mes Objectifs financiers',
    tag: 'Suivi & Trading',
    color: '#fb923c',
    desc: "Créez et suivez vos objectifs financiers personnalisés avec barre de progression, date cible et épargne mensuelle nécessaire pour les atteindre.",
    why: [
      "Donner un sens concret à votre épargne avec des objectifs chiffrés",
      "Calculer automatiquement l'effort d'épargne mensuel pour chaque objectif",
      "Rester motivé grâce au suivi visuel de la progression vers chaque objectif",
    ],
    steps: [
      "Créez un objectif avec un nom, un montant cible et une date souhaitée",
      "Associez un compte ou une enveloppe à cet objectif",
      "Suivez la progression et ajustez votre épargne si nécessaire",
    ],
    cases: [
      "Couple épargnant pour un apport immobilier de 40 000€ dans 3 ans",
      "Parent constituant un capital études de 20 000€ pour son enfant en 10 ans",
    ],
    href: '/dashboard/goals',
  },
  'carnet-ordres': {
    title: "Carnet d'ordres & Journal",
    tag: 'Suivi & Trading',
    color: '#c084fc',
    desc: "Journal complet de vos opérations BUY, SELL et DIVIDEND avec calcul du P&L réalisé, prix de revient moyen et historique des transactions.",
    why: [
      "Tenir un historique précis de toutes vos opérations boursières",
      "Calculer automatiquement le prix de revient moyen après chaque achat",
      "Suivre les dividendes perçus et le P&L réalisé sur les positions clôturées",
    ],
    steps: [
      "Enregistrez chaque opération (achat, vente, dividende) avec date et prix",
      "Le système met à jour automatiquement le PRU et le P&L réalisé",
      "Consultez l'historique complet et exportez pour votre déclaration fiscale",
    ],
    cases: [
      "Investisseur actif enregistrant ses achats/ventes mensuels sur 20 lignes",
      "Rentier suivant ses dividendes trimestriels pour préparer sa déclaration 2074",
    ],
    href: '/dashboard/transactions',
  },
  'rapport-fiscal': {
    title: 'Rapport Fiscal',
    tag: 'Analyse & Fiscal',
    color: '#fbbf24',
    desc: "Synthèse fiscale de vos plus-values, durées de détention et optimisations possibles par enveloppe. Aide à la préparation de votre déclaration fiscale.",
    why: [
      "Anticiper votre imposition sur les plus-values avant la déclaration",
      "Identifier les plus-values à reporter pour optimiser votre fiscalité",
      "Distinguer les gains imposables par enveloppe (PEA exonéré vs CTO imposable)",
    ],
    steps: [
      "Le rapport agrège automatiquement vos transactions depuis le carnet d'ordres",
      "Les plus-values sont calculées par enveloppe avec les durées de détention",
      "Consultez le résultat fiscal estimé et les pistes d'optimisation",
    ],
    cases: [
      "Investisseur en CTO calculant ses plus-values avant de déclarer la 2074",
      "Épargnant voulant savoir si la clôture de son PEA de 8 ans est exonérée",
    ],
    href: '/dashboard/tax',
  },
  'score-patrimonial': {
    title: 'Score Patrimonial',
    tag: 'Analyse & Fiscal',
    color: '#f1c086',
    desc: "Notation 0-100 de votre santé financière sur 6 piliers : épargne, dettes, diversification, optimisation fiscale, prévoyance et progression vers le FIRE.",
    why: [
      "Avoir une vision synthétique et objective de votre santé financière globale",
      "Identifier vos points faibles et les actions prioritaires à mener",
      "Suivre votre progression dans le temps avec un score trimestriel",
    ],
    steps: [
      "Renseignez ou mettez à jour votre situation patrimoniale dans PatrImo",
      "L'algorithme analyse automatiquement les 6 piliers de votre situation",
      "Recevez votre score, le détail pilier par pilier et des recommandations",
    ],
    cases: [
      "Jeune actif à 30 ans souhaitant un diagnostic objectif de sa situation financière",
      "Investisseur expérimenté mesurant sa progression annuelle sur les 6 piliers",
    ],
    href: '/dashboard/score',
  },
  'gestion-personnelle': {
    title: 'Gestion personnelle',
    tag: 'Analyse & Fiscal',
    color: '#818cf8',
    desc: "Vue synthétique de votre situation financière personnelle : taux d'épargne mensuel, budget, objectifs FIRE et projections patrimoniales à long terme.",
    why: [
      "Croiser patrimoine, budget et objectifs FIRE dans une vue unifiée",
      "Suivre votre taux d'épargne mensuel réel et son évolution",
      "Projeter votre patrimoine futur selon différents scénarios d'épargne",
    ],
    steps: [
      "Renseignez vos revenus mensuels nets et vos dépenses par catégorie",
      "La page croise ces données avec votre patrimoine et vos objectifs",
      "Consultez votre taux d'épargne, vos projections et vos recommandations",
    ],
    cases: [
      "Cadre voulant une synthèse mensuelle croisant revenus, dépenses et patrimoine",
      "Couple en chemin vers le FIRE suivant leur progression vers l'objectif chaque mois",
    ],
    href: '/dashboard/gestion',
  },
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = PAGE_CONTENT[slug]
  if (!page) return { title: 'Gestion patrimoniale — PatrImo' }
  return {
    title: `${page.title} — PatrImo`,
    description: page.desc,
    openGraph: {
      title: `${page.title} — PatrImo`,
      description: page.desc,
      url: `https://finance.digitalstack.cloud/patrimoine/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(PAGE_CONTENT).map(slug => ({ slug }))
}

export default async function PatrimoineSlugPage({ params }: Props) {
  const { slug } = await params
  const page = PAGE_CONTENT[slug]
  if (!page) redirect('/patrimoine')

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(16px)', zIndex: 50 }}>
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

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Back */}
        <Link href="/patrimoine" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 40, transition: 'color 0.15s' }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />
          Pages de gestion
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: page.color + '18', border: `1px solid ${page.color}35`, fontSize: 11, color: page.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {page.tag}
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 20px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            {page.title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 680 }}>
            {page.desc}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 24, background: 'linear-gradient(135deg, #c8922a, #f1c086)', color: '#000', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Accéder à cette page <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/patrimoine" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              Toutes les pages de gestion
            </Link>
          </div>
        </div>

        {/* Pourquoi cette page ? */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
            Pourquoi cette page ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {page.why.map((reason, i) => (
              <div key={i} style={{ background: page.color + '0a', border: `1px solid ${page.color}20`, borderRadius: 16, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: page.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Check style={{ width: 14, height: 14, color: page.color }} />
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>{reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 36px', letterSpacing: '-0.02em' }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {page.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: i < page.steps.length - 1 ? 32 : 0, position: 'relative' }}>
                {/* Vertical line */}
                {i < page.steps.length - 1 && (
                  <div style={{ position: 'absolute', left: 19, top: 48, width: 2, height: 'calc(100% - 16px)', background: `linear-gradient(to bottom, ${page.color}40, transparent)` }} />
                )}
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: page.color + '18', border: `1px solid ${page.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: page.color }}>0{i + 1}</span>
                </div>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: '10px 0 0', paddingBottom: 8 }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cas d'usage */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Cas d&apos;usage
          </h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 32px' }}>
            {page.cases.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: i < page.cases.length - 1 ? 18 : 0 }}>
                <span style={{ fontSize: 18, color: page.color, flexShrink: 0, lineHeight: 1.4 }}>•</span>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: 0 }}>{c}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section style={{ textAlign: 'center', padding: '48px 32px', borderRadius: 24, background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.15)' }}>
          <h3 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
            Accédez à cette page gratuitement
          </h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 32px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Créez un compte PatrImo pour gérer votre patrimoine, suivre vos actifs et accéder aux 18 simulateurs.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 30px', borderRadius: 24, background: 'linear-gradient(135deg, #c8922a, #f1c086)', color: '#000', fontWeight: 700, fontSize: 15 }}>
            Commencer gratuitement
            <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </section>

      </main>
    </div>
  )
}
