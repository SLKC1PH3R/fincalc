import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

type PageContent = {
  title: string
  tag: string
  tagNum: string
  desc: string
  why: string[]
  steps: string[]
  cases: string[]
  href: string
}

const PAGE_CONTENT: Record<string, PageContent> = {
  'vue-ensemble': {
    title: "Vue d'ensemble patrimoine",
    tag: 'Patrimoine', tagNum: '01',
    desc: "Votre bilan patrimonial complet en un coup d'oeil : actifs, passifs, répartition par classe d'actifs et évolution dans le temps avec carte monde géographique.",
    why: [
      "Visualiser instantanément votre patrimoine net (actifs minus passifs) en temps réel",
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
      "Investisseur multi-actifs suivant l'évolution de son patrimoine de 250 000 EUR chaque trimestre",
    ],
    href: '/dashboard/patrimoine',
  },
  'immobilier': {
    title: 'Gestion immobilière',
    tag: 'Patrimoine', tagNum: '01',
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
    tag: 'Patrimoine', tagNum: '01',
    desc: "Suivez toutes vos positions en actions et fonds : PEA, CTO, Assurance Vie, PER. Valorisation en temps réel, allocation par classe d'actifs et performance globale.",
    why: [
      "Consolider PEA, CTO, AV et PER dans une vue unifiée sans les mélanger",
      "Connaitre la valorisation live de chaque enveloppe et la performance globale",
      "Analyser la diversification géographique et sectorielle de votre portefeuille",
    ],
    steps: [
      "Créez vos enveloppes (PEA, CTO, AV, PER) et renseignez les positions",
      "Le système récupère les prix en temps réel via Finnhub et CoinGecko",
      "Consultez la valorisation totale, les gains latents et la répartition",
    ],
    cases: [
      "Investisseur avec 80 000 EUR répartis sur PEA, CTO et AV voulant une vue consolidée",
      "Épargnant voulant connaitre sa vraie performance nette après frais et fiscalité",
    ],
    href: '/dashboard/patrimoine/actions',
  },
  'livrets': {
    title: 'Livrets & Épargne réglementée',
    tag: 'Patrimoine', tagNum: '01',
    desc: "Centralisez vos livrets réglementés (Livret A, LDDS, LEP, CEL, PEL) avec suivi des plafonds, des taux en vigueur et des intérêts générés.",
    why: [
      "Savoir en un clin d'oeil si vos livrets sont à leurs plafonds légaux",
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
    tag: 'Patrimoine', tagNum: '01',
    desc: "Tracez vos crypto-monnaies, métaux précieux, private equity et actifs alternatifs. Prix live via CoinGecko pour les crypto, valorisation manuelle pour les autres.",
    why: [
      "Intégrer la crypto dans votre bilan patrimonial global avec prix live",
      "Suivre l'or et les métaux précieux à leur valeur de marché actuelle",
      "Mesurer le poids réel des actifs alternatifs dans votre allocation globale",
    ],
    steps: [
      "Ajoutez vos positions crypto avec le ticker (BTC, ETH...) et la quantité détenue",
      "Pour les métaux précieux, renseignez le poids et la forme (lingot, pièce...)",
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
    tag: 'Patrimoine', tagNum: '01',
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
    title: 'Vue consolidée des emprunts',
    tag: 'Patrimoine', tagNum: '01',
    desc: "Centralisez tous vos crédits en cours : immobilier, consommation, auto. Capital restant dû global, mensualités totales et date de fin de chaque crédit.",
    why: [
      "Connaitre votre dette totale consolidée en un seul endroit",
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
    tag: 'Patrimoine', tagNum: '01',
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
    tag: 'Suivi & Trading', tagNum: '02',
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
    tag: 'Suivi & Trading', tagNum: '02',
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
    tag: 'Suivi & Trading', tagNum: '02',
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
      "Couple épargnant pour un apport immobilier de 40 000 EUR dans 3 ans",
      "Parent constituant un capital études de 20 000 EUR pour son enfant en 10 ans",
    ],
    href: '/dashboard/goals',
  },
  'carnet-ordres': {
    title: "Carnet d'ordres & Journal",
    tag: 'Suivi & Trading', tagNum: '02',
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
    tag: 'Analyse & Fiscal', tagNum: '03',
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
    tag: 'Analyse & Fiscal', tagNum: '03',
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
    tag: 'Analyse & Fiscal', tagNum: '03',
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

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ps-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.ps-c{max-width:860px;margin:0 auto;padding:0 40px}

.ps-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.ps-nav-inner{display:flex;align-items:center;justify-content:space-between}
.ps-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.ps-logo em{font-style:normal;color:#c96a4a}
.ps-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:#15140f;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:600;text-decoration:none;transition:background .18s}
.ps-nav-cta:hover{background:#c96a4a}

.ps-back{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#8b8676;text-decoration:none;text-transform:uppercase;transition:color .15s;padding:40px 0 0}
.ps-back:hover{color:#15140f}

.ps-rule{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding:0 0 14px;margin:32px 0 48px}
.ps-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}

.ps-hero{margin-bottom:64px}
.ps-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#c96a4a;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.ps-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:#c96a4a;flex-shrink:0}
.ps-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(32px,4.5vw,52px);font-weight:800;letter-spacing:-.028em;line-height:1.05;margin:0 0 20px;color:#15140f}
.ps-hero p{font-size:17px;color:#5a5448;max-width:560px;line-height:1.65;margin:0 0 36px}
.ps-btns{display:flex;gap:12px;flex-wrap:wrap}
.ps-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;text-decoration:none;transition:background .18s;white-space:nowrap}
.ps-btn-primary:hover{background:#a84f35}
.ps-btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:13px 26px;border-radius:999px;background:transparent;border:1px solid rgba(21,20,15,.14);color:#5a5448;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:500;text-decoration:none;transition:background .15s;white-space:nowrap}
.ps-btn-ghost:hover{background:rgba(21,20,15,.05)}

.ps-section{margin-bottom:72px}
.ps-section h2{font-family:'Playfair Display',serif;font-style:italic;font-size:clamp(22px,3vw,30px);font-weight:400;letter-spacing:-.01em;color:#15140f;margin:0 0 28px}

.ps-why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.ps-why-card{padding:22px 20px;border-radius:14px;background:#faf6ec;border:1px solid rgba(21,20,15,.10)}
.ps-why-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#c96a4a;margin-bottom:12px;text-transform:uppercase}
.ps-why-card p{margin:0;font-size:14px;line-height:1.65;color:#5a5448}

.ps-steps{display:flex;flex-direction:column;gap:0}
.ps-step{display:flex;gap:28px;align-items:flex-start;padding-bottom:32px;border-bottom:1px solid rgba(21,20,15,.08);margin-bottom:32px}
.ps-step:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.ps-step-num{font-family:'Playfair Display',serif;font-style:italic;font-size:56px;font-weight:400;line-height:1;color:#c96a4a;opacity:.6;flex-shrink:0;min-width:52px;letter-spacing:-.04em}
.ps-step p{margin:0;font-size:15.5px;color:#5a5448;line-height:1.65;padding-top:10px}

.ps-cases{padding:28px;border-radius:16px;background:#faf6ec;border:1px solid rgba(21,20,15,.10)}
.ps-case{display:flex;gap:14px;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid rgba(21,20,15,.06)}
.ps-case:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.ps-case-arr{font-family:'JetBrains Mono',monospace;font-size:13px;color:#c96a4a;flex-shrink:0;line-height:1.65}
.ps-case p{margin:0;font-size:14.5px;color:#5a5448;line-height:1.65}

.ps-cta-block{background:#15140f;border-radius:24px;padding:56px 48px;text-align:center;margin-bottom:80px}
.ps-cta-block h3{font-family:'Inter Tight',sans-serif;font-size:clamp(22px,2.5vw,30px);font-weight:800;letter-spacing:-.022em;color:#efe7d2;margin:0 0 10px}
.ps-cta-block p{font-size:14px;color:#8b8676;margin:0 0 28px;line-height:1.65;max-width:440px;margin-left:auto;margin-right:auto}

@media(max-width:640px){
  .ps-c{padding:0 20px}
  .ps-cta-block{padding:36px 24px}
  .ps-why-grid{grid-template-columns:1fr}
}
`

const TAG_NUM: Record<string, string> = {
  'Patrimoine':        '01',
  'Suivi & Trading':   '02',
  'Analyse & Fiscal':  '03',
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = PAGE_CONTENT[slug]
  if (!page) return { title: 'Gestion patrimoniale — Patrimo' }
  return {
    title: `${page.title} — Patrimo`,
    description: page.desc,
    openGraph: {
      title: `${page.title} — Patrimo`,
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

  const { title, tag, desc, why, steps, cases, href } = page
  const num = TAG_NUM[tag] ?? '01'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ps-root">

        {/* Nav */}
        <nav className="ps-nav">
          <div className="ps-c">
            <div className="ps-nav-inner">
              <a href="/" className="ps-logo">Patri<em>mo</em></a>
              <a href="/login" className="ps-nav-cta">Démarrer →</a>
            </div>
          </div>
        </nav>

        <div className="ps-c">
          {/* Back */}
          <a href="/patrimoine" className="ps-back">← Tous les modules</a>

          {/* Rule */}
          <div className="ps-rule">
            <span>{num} · {tag}</span>
            <span className="ps-rule-sep" />
            <span>Module patrimoine</span>
          </div>

          {/* Hero */}
          <section className="ps-hero">
            <div className="ps-tag">{tag}</div>
            <h1>{title}</h1>
            <p>{desc}</p>
            <div className="ps-btns">
              <a href={href} className="ps-btn-primary">Accéder à cette page →</a>
              <a href="/patrimoine" className="ps-btn-ghost">Tous les modules</a>
            </div>
          </section>

          {/* Pourquoi */}
          <section className="ps-section">
            <h2>Pourquoi cette page ?</h2>
            <div className="ps-why-grid">
              {why.map((reason, i) => (
                <div key={i} className="ps-why-card">
                  <div className="ps-why-num">{String(i + 1).padStart(2,'0')}</div>
                  <p>{reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comment ça marche */}
          <section className="ps-section">
            <h2>Comment ça marche ?</h2>
            <div className="ps-steps">
              {steps.map((step, i) => (
                <div key={i} className="ps-step">
                  <div className="ps-step-num">{String(i + 1).padStart(2,'0')}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Cas d'usage */}
          <section className="ps-section">
            <h2>Cas d&apos;usage</h2>
            <div className="ps-cases">
              {cases.map((c, i) => (
                <div key={i} className="ps-case">
                  <span className="ps-case-arr">→</span>
                  <p>{c}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="ps-cta-block">
            <h3>Prêt à piloter votre patrimoine ?</h3>
            <p>Créez un compte gratuit pour accéder à l&apos;ensemble des modules, suivre vos actifs et obtenir votre score patrimonial.</p>
            <a href="/login" className="ps-btn-primary">Démarrer gratuitement →</a>
          </div>
        </div>

      </div>
    </>
  )
}
