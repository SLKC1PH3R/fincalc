import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ToolPreview } from '@/components/landing/ToolPreview'
import type { Metadata } from 'next'

type ToolContent = {
  title: string
  tag: string
  tagNum: string
  desc: string
  why: string[]
  steps: string[]
  cases: string[]
  href: string
}

const TOOL_CONTENT: Record<string, ToolContent> = {
  'interets-composes': {
    title: 'Intérêts composés',
    tag: 'Épargne & Investissement', tagNum: '01',
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
    title: 'FI/RE — Indépendance financière',
    tag: 'Épargne & Investissement', tagNum: '01',
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
    title: 'Crédit immobilier',
    tag: 'Immobilier', tagNum: '02',
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
    tag: 'Immobilier', tagNum: '02',
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
    title: 'Calcul impôts sur le revenu',
    tag: 'Fiscalité', tagNum: '03',
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
    tag: 'Fiscalité', tagNum: '03',
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
    tag: 'Budget & Retraite', tagNum: '04',
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
    title: "Taux d'épargne",
    tag: 'Budget & Retraite', tagNum: '04',
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
    tag: 'Budget & Retraite', tagNum: '04',
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
    title: 'Dollar Cost Averaging',
    tag: 'Épargne & Investissement', tagNum: '01',
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
    tag: 'Fiscalité', tagNum: '03',
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
    title: "Épargne d'urgence",
    tag: 'Budget & Retraite', tagNum: '04',
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
    title: 'Rentabilité locative',
    tag: 'Immobilier', tagNum: '02',
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
    title: 'Succession & Donations',
    tag: 'Fiscalité', tagNum: '03',
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
    title: 'Score patrimonial',
    tag: 'Budget & Retraite', tagNum: '04',
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
    title: 'Revenus passifs & dividendes',
    tag: 'Épargne & Investissement', tagNum: '01',
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
    tag: 'Épargne & Investissement', tagNum: '01',
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
    title: 'Coût réel crédit conso',
    tag: 'Budget & Retraite', tagNum: '04',
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

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ts-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.ts-c{max-width:860px;margin:0 auto;padding:0 40px}

.ts-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.ts-nav-inner{display:flex;align-items:center;justify-content:space-between}
.ts-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.ts-logo em{font-style:normal;color:#c96a4a}
.ts-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:#15140f;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:600;text-decoration:none;transition:background .18s}
.ts-nav-cta:hover{background:#c96a4a}

.ts-back{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:#8b8676;text-decoration:none;text-transform:uppercase;transition:color .15s;padding:40px 0 0}
.ts-back:hover{color:#15140f}

.ts-rule{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding:0 0 14px;margin:32px 0 48px}
.ts-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}

.ts-hero{margin-bottom:64px}
.ts-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;color:#c96a4a;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.ts-tag::before{content:'';width:6px;height:6px;border-radius:50%;background:#c96a4a;flex-shrink:0}
.ts-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(32px,4.5vw,52px);font-weight:800;letter-spacing:-.028em;line-height:1.05;margin:0 0 20px;color:#15140f}
.ts-hero p{font-size:17px;color:#5a5448;max-width:560px;line-height:1.65;margin:0 0 36px}
.ts-btns{display:flex;gap:12px;flex-wrap:wrap}
.ts-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;text-decoration:none;transition:background .18s;white-space:nowrap}
.ts-btn-primary:hover{background:#a84f35}
.ts-btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:13px 26px;border-radius:999px;background:transparent;border:1px solid rgba(21,20,15,.14);color:#5a5448;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:500;text-decoration:none;transition:background .15s;white-space:nowrap}
.ts-btn-ghost:hover{background:rgba(21,20,15,.05)}

.ts-section{margin-bottom:72px}
.ts-section h2{font-family:'Playfair Display',serif;font-style:italic;font-size:clamp(22px,3vw,30px);font-weight:400;letter-spacing:-.01em;color:#15140f;margin:0 0 28px}

.ts-why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.ts-why-card{padding:22px 20px;border-radius:14px;background:#faf6ec;border:1px solid rgba(21,20,15,.10)}
.ts-why-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#c96a4a;margin-bottom:12px;text-transform:uppercase}
.ts-why-card p{margin:0;font-size:14px;line-height:1.65;color:#5a5448}

.ts-steps{display:flex;flex-direction:column;gap:0}
.ts-step{display:flex;gap:28px;align-items:flex-start;padding-bottom:32px;border-bottom:1px solid rgba(21,20,15,.08);margin-bottom:32px}
.ts-step:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.ts-step-num{font-family:'Playfair Display',serif;font-style:italic;font-size:56px;font-weight:400;line-height:1;color:#c96a4a;opacity:.6;flex-shrink:0;min-width:52px;letter-spacing:-.04em}
.ts-step p{margin:0;font-size:15.5px;color:#5a5448;line-height:1.65;padding-top:10px}

.ts-cases{padding:28px;border-radius:16px;background:#faf6ec;border:1px solid rgba(21,20,15,.10)}
.ts-case{display:flex;gap:14px;align-items:flex-start;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid rgba(21,20,15,.06)}
.ts-case:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.ts-case-arr{font-family:'JetBrains Mono',monospace;font-size:13px;color:#c96a4a;flex-shrink:0;line-height:1.65}
.ts-case p{margin:0;font-size:14.5px;color:#5a5448;line-height:1.65}

.ts-cta-block{background:#15140f;border-radius:24px;padding:56px 48px;text-align:center;margin-bottom:80px}
.ts-cta-block h3{font-family:'Inter Tight',sans-serif;font-size:clamp(22px,2.5vw,30px);font-weight:800;letter-spacing:-.022em;color:#efe7d2;margin:0 0 10px}
.ts-cta-block p{font-size:14px;color:#8b8676;margin:0 0 28px;line-height:1.65;max-width:440px;margin-left:auto;margin-right:auto}

@media(max-width:640px){
  .ts-c{padding:0 20px}
  .ts-cta-block{padding:36px 24px}
  .ts-why-grid{grid-template-columns:1fr}
}
`

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tool = TOOL_CONTENT[slug]
  if (!tool) return { title: 'Simulateur — Patrimo' }
  return {
    title: `${tool.title} — Patrimo`,
    description: tool.desc,
    openGraph: {
      title: `${tool.title} — Patrimo`,
      description: tool.desc,
      url: `https://finance.digitalstack.cloud/tools/${slug}`,
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

  const { title, tag, tagNum, desc, why, steps, cases, href } = tool

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ts-root">

        {/* Nav */}
        <nav className="ts-nav">
          <div className="ts-c">
            <div className="ts-nav-inner">
              <a href="/" className="ts-logo">Patri<em>mo</em></a>
              <a href="/login" className="ts-nav-cta">Démarrer →</a>
            </div>
          </div>
        </nav>

        <div className="ts-c">
          {/* Back */}
          <a href="/tools" className="ts-back">← Tous les simulateurs</a>

          {/* Rule */}
          <div className="ts-rule">
            <span>{tagNum} · {tag}</span>
            <span className="ts-rule-sep" />
            <span>Simulateur</span>
          </div>

          {/* Hero */}
          <section className="ts-hero">
            <div className="ts-tag">{tag}</div>
            <h1>{title}</h1>
            <p>{desc}</p>
            <div className="ts-btns">
              <a href={href} className="ts-btn-primary">Essayer maintenant →</a>
              <a href="/tools" className="ts-btn-ghost">Tous les simulateurs</a>
            </div>
          </section>

          {/* Mini simulator preview */}
          <ToolPreview slug={slug} color="#c96a4a" />

          {/* Pourquoi */}
          <section className="ts-section">
            <h2>Pourquoi ce simulateur ?</h2>
            <div className="ts-why-grid">
              {why.map((reason, i) => (
                <div key={i} className="ts-why-card">
                  <div className="ts-why-num">{String(i + 1).padStart(2,'0')}</div>
                  <p>{reason}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comment ça marche */}
          <section className="ts-section">
            <h2>Comment ça marche ?</h2>
            <div className="ts-steps">
              {steps.map((step, i) => (
                <div key={i} className="ts-step">
                  <div className="ts-step-num">{String(i + 1).padStart(2,'0')}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Cas d'usage */}
          <section className="ts-section">
            <h2>Cas d&apos;usage</h2>
            <div className="ts-cases">
              {cases.map((c, i) => (
                <div key={i} className="ts-case">
                  <span className="ts-case-arr">→</span>
                  <p>{c}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="ts-cta-block">
            <h3>Prêt à simuler votre situation ?</h3>
            <p>Créez un compte gratuit pour sauvegarder vos simulations, suivre votre patrimoine et accéder à toutes les fonctionnalités.</p>
            <a href="/login" className="ts-btn-primary">Commencer gratuitement →</a>
          </div>
        </div>

      </div>
    </>
  )
}
