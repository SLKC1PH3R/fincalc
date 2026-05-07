import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, ArrowRight, ChevronLeft } from 'lucide-react'
import { Nav } from '@/components/landing/Nav'
import type { Metadata } from 'next'

const BG      = '#F3EEE4'
const SURFACE = '#FFFFFF'
const INK     = '#0A0A0A'
const MUTED   = '#6B6356'
const LINE    = 'rgba(10,10,10,0.08)'
const LINE_S  = 'rgba(10,10,10,0.14)'
const GOLD    = '#B07820'
const GOLD_D  = '#8B5E18'
const GOLD_T2 = 'rgba(176,120,32,0.18)'
const F_SANS  = "'Geist', system-ui, -apple-system, sans-serif"
const F_SERIF = "'Instrument Serif', Georgia, serif"
const F_MONO  = "'Geist Mono', ui-monospace, monospace"

type PageContent = {
  title: string
  tag: string
  em: string
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
    tag: 'Patrimoine', em: '🏛', color: '#B07820',
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
    tag: 'Patrimoine', em: '🏠', color: '#f472b6',
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
    tag: 'Patrimoine', em: '📈', color: '#34d399',
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
    tag: 'Patrimoine', em: '💰', color: '#38bdf8',
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
    tag: 'Patrimoine', em: '₿', color: '#fb923c',
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
    tag: 'Patrimoine', em: '🏦', color: '#a78bfa',
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
    tag: 'Patrimoine', em: '📋', color: '#fb7185',
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
    tag: 'Patrimoine', em: '🗂', color: '#94a3b8',
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
  'mon-portefeuille': {
    title: 'Mon Portefeuille — positions live',
    tag: 'Suivi & Trading', em: '📊', color: '#38bdf8',
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
    tag: 'Suivi & Trading', em: '🔄', color: '#34d399',
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
  'mes-objectifs': {
    title: 'Mes Objectifs financiers',
    tag: 'Suivi & Trading', em: '⭐', color: '#fb923c',
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
    tag: 'Suivi & Trading', em: '📖', color: '#c084fc',
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
    tag: 'Analyse & Fiscal', em: '🧾', color: '#fbbf24',
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
    tag: 'Analyse & Fiscal', em: '🏆', color: '#B07820',
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
    tag: 'Analyse & Fiscal', em: '🌐', color: '#818cf8',
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

  const { title, tag, em, color, desc, why, steps, cases, href } = page

  return (
    <div className="patrimo-landing" style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F_SANS }}>

      <Nav />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Back */}
        <div style={{ paddingTop: 40, marginBottom: 48 }}>
          <Link href="/patrimoine" className="patr-back-link">
            <ChevronLeft style={{ width: 14, height: 14 }} />
            Outils patrimoniaux
          </Link>
        </div>

        {/* Hero */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: color, display: 'inline-block' }} />
            <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{tag}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 22 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, flexShrink: 0, marginTop: 4,
              background: `${color}12`, border: `1px solid ${color}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>{em}</div>
            <h1 style={{ fontFamily: F_SERIF, fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 400, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1, color: INK }}>
              {title}
            </h1>
          </div>

          <p style={{ fontSize: 18, color: MUTED, maxWidth: 580, margin: '0 0 36px', lineHeight: 1.65 }}>
            {desc}
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={href} className="patr-btn-primary">
              Accéder à cette page
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link href="/patrimoine" className="patr-btn-ghost">
              Tous les outils patrimoniaux
            </Link>
          </div>
        </section>

        {/* Pourquoi cette page */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 400, margin: '0 0 28px', letterSpacing: '-0.02em', color: INK }}>
            Pourquoi cette page ?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {why.map((reason, i) => (
              <div key={i} style={{
                padding: '22px 20px', borderRadius: 14,
                background: SURFACE, border: `1px solid ${LINE_S}`,
                boxShadow: `0 2px 8px ${LINE}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: `${color}14`, border: `1px solid ${color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                }}>
                  <Check style={{ width: 14, height: 14, color }} />
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: MUTED, fontWeight: 500 }}>
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment ça marche */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 400, margin: '0 0 36px', letterSpacing: '-0.02em', color: INK }}>
            Comment ça marche ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', paddingBottom: 32, borderBottom: i < steps.length - 1 ? `1px solid ${LINE}` : 'none', marginBottom: i < steps.length - 1 ? 32 : 0 }}>
                <div style={{
                  flexShrink: 0, fontFamily: F_SERIF,
                  fontSize: 48, fontWeight: 400, lineHeight: 1,
                  color, letterSpacing: '-0.04em', opacity: 0.7, minWidth: 52,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ paddingTop: 8, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 16, color: MUTED, lineHeight: 1.65, fontWeight: 400 }}>
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cas d'usage */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 400, margin: '0 0 24px', letterSpacing: '-0.02em', color: INK }}>
            Cas d&apos;usage
          </h2>
          <div style={{ padding: '28px 28px', borderRadius: 16, background: SURFACE, border: `1px solid ${LINE_S}` }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {cases.map((c, i) => (
                <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ color, fontSize: 18, lineHeight: 1.4, flexShrink: 0, fontWeight: 700 }}>→</span>
                  <span style={{ fontSize: 15, color: MUTED, lineHeight: 1.65 }}>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA final */}
        <section style={{
          textAlign: 'center', padding: '56px 32px', borderRadius: 24,
          background: SURFACE, border: `1px solid ${LINE_S}`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '200%', background: `radial-gradient(ellipse, ${GOLD_T2} 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: GOLD, display: 'inline-block' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: GOLD_D, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Compte gratuit</span>
            </div>
            <h3 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em', color: INK }}>
              Accédez à cette page gratuitement
            </h3>
            <p style={{ fontSize: 15, color: MUTED, margin: '0 0 28px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, fontFamily: F_SANS }}>
              Créez un compte PatrImo pour gérer votre patrimoine, suivre vos actifs et accéder aux 18 simulateurs.
            </p>
            <Link href="/login" className="patr-btn-primary">
              Commencer gratuitement
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </section>

      </main>

      <style>{`
        .patr-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          text-decoration: none; padding: 13px 26px; border-radius: 999px;
          background: #8B5E18; color: #FFFFFF !important;
          font-weight: 600; font-size: 14px; font-family: 'Geist', system-ui;
          transition: transform .15s, box-shadow .15s;
        }
        .patr-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139,94,24,0.35); background: #B07820; }
        .patr-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          text-decoration: none; padding: 13px 26px; border-radius: 999px;
          background: #FFFFFF; border: 1px solid rgba(10,10,10,0.14);
          color: #6B6356; font-weight: 500; font-size: 14px; font-family: 'Geist', system-ui;
          transition: background .15s;
        }
        .patr-btn-ghost:hover { background: #FBF7EF; }
        .patr-back-link {
          text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
          color: #9A907F; font-size: 13px; font-weight: 500;
          font-family: 'Geist Mono', monospace; transition: color 0.15s;
        }
        .patr-back-link:hover { color: #0A0A0A; }
      `}</style>
    </div>
  )
}
