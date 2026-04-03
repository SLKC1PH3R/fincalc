import type { Metadata } from 'next'
import Link from 'next/link'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, BarChart3, Layers,
  Percent, Star, Shield, Clock, ArrowRight, Scale,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Simulateurs financiers gratuits 2026 — PatrImo',
  description:
    '18 simulateurs financiers gratuits : intérêts composés, FIRE, impôts IR 2026, prêt immobilier, flat tax vs barème, PEA/CTO/AV, succession, DCA. Calculs instantanés, sans donnée bancaire.',
  keywords: [
    'simulateur intérêts composés gratuit',
    'calculateur FIRE indépendance financière',
    'simulateur impôts IR 2026',
    'flat tax vs barème',
    'simulateur prêt immobilier gratuit',
    'PEA CTO assurance vie comparatif',
    'simulateur DCA bourse',
    'calculateur retraite france',
    'simulateur succession donation',
    'calculateur acheter louer',
  ],
  openGraph: {
    title: '18 simulateurs financiers gratuits — PatrImo',
    description:
      'Intérêts composés, FIRE, impôts 2026, immobilier, flat tax, succession. Gratuit, sans compte bancaire.',
    url: 'https://finance.digitalstack.cloud/tools',
  },
  alternates: { canonical: 'https://finance.digitalstack.cloud/tools' },
}

const SIMULATEURS = [
  {
    category: 'Épargne & Investissement',
    color: '#34d399',
    items: [
      {
        href: '/dashboard/compound',
        label: 'Intérêts Composés',
        desc: 'Visualisez l\'effet boule de neige de votre épargne sur 5 à 40 ans. Capital initial, versements mensuels, rendement annuel.',
        icon: TrendingUp,
        color: '#34d399',
        keywords: ['intérêts composés', 'épargne long terme', 'effet boule de neige'],
      },
      {
        href: '/dashboard/dca',
        label: 'DCA — Investissement progressif',
        desc: 'Simulez un plan d\'achat régulier (Dollar-Cost Averaging) vs achat unique (lump sum). Comparaison sur ETF, actions ou crypto.',
        icon: RefreshCw,
        color: '#38bdf8',
        keywords: ['DCA', 'investissement progressif', 'lump sum', 'bourse'],
      },
      {
        href: '/dashboard/fire',
        label: 'FI/RE — Indépendance Financière',
        desc: 'Calculez votre objectif FIRE (règle des 4 %), estimez votre date de liberté financière selon votre taux d\'épargne et rendement.',
        icon: Flame,
        color: '#fb923c',
        keywords: ['FIRE', 'indépendance financière', 'retraite anticipée', 'règle des 4%'],
      },
      {
        href: '/dashboard/dividends',
        label: 'Revenus Passifs & Dividendes',
        desc: 'Simulez un portefeuille dividendes : revenu mensuel généré selon le capital investi et le rendement annuel.',
        icon: TrendingUp,
        color: '#f1c086',
        keywords: ['revenus passifs', 'dividendes', 'portefeuille dividendes'],
      },
      {
        href: '/dashboard/benchmark',
        label: 'Benchmarks & Performance',
        desc: 'Comparez la performance de votre portefeuille aux indices de référence : CAC 40, MSCI World, S&P 500.',
        icon: BarChart3,
        color: '#a3e635',
        keywords: ['benchmark', 'performance portefeuille', 'CAC 40', 'MSCI World'],
      },
    ],
  },
  {
    category: 'Immobilier',
    color: '#a78bfa',
    items: [
      {
        href: '/dashboard/buyrent',
        label: 'Acheter vs Louer',
        desc: 'Comparez le patrimoine généré selon votre stratégie résidentielle. Simulation sur 5 à 30 ans avec inflation et rendement locatif.',
        icon: Home,
        color: '#a78bfa',
        keywords: ['acheter louer', 'achat immobilier', 'comparatif propriétaire locataire'],
      },
      {
        href: '/dashboard/mortgage',
        label: 'Prêt Immobilier',
        desc: 'Calculez vos mensualités, TAEG réel, coût total du crédit et tableau d\'amortissement complet selon votre emprunt.',
        icon: Building2,
        color: '#f472b6',
        keywords: ['simulateur prêt immobilier', 'mensualité crédit', 'TAEG', 'tableau amortissement'],
      },
      {
        href: '/dashboard/rental',
        label: 'Rentabilité Locative',
        desc: 'Calculez le cashflow net, rendement brut/net et retour sur investissement de votre bien locatif avec fiscalité.',
        icon: Wallet,
        color: '#2dd4bf',
        keywords: ['rentabilité locative', 'cashflow immobilier', 'rendement locatif'],
      },
    ],
  },
  {
    category: 'Fiscalité & Impôts',
    color: '#fb7185',
    items: [
      {
        href: '/dashboard/tax',
        label: 'Impôts IR — Barème 2026',
        desc: 'Calcul de l\'impôt sur le revenu 2026, tranche marginale d\'imposition (TMI), comparaison frais réels vs abattement 10 %.',
        icon: Receipt,
        color: '#fb7185',
        keywords: ['calculateur impôts IR', 'TMI 2026', 'barème impôt revenu', 'frais réels'],
      },
      {
        href: '/dashboard/flat-tax',
        label: 'Flat Tax vs Barème IR',
        desc: 'Comparez le PFU 30 % au barème progressif selon votre TMI et vos revenus du capital (dividendes, plus-values, intérêts).',
        icon: Scale,
        color: '#38bdf8',
        keywords: ['flat tax', 'PFU 30%', 'prélèvement forfaitaire unique', 'barème IR dividendes'],
      },
      {
        href: '/dashboard/envelope-compare',
        label: 'PEA vs CTO vs Assurance-Vie',
        desc: 'Simulez la fiscalité nette de chaque enveloppe d\'investissement sur 5 à 30 ans. Quel wrapper choisir pour votre profil ?',
        icon: Layers,
        color: '#c084fc',
        keywords: ['PEA CTO assurance vie', 'comparatif enveloppes fiscales', 'wrapper investissement'],
      },
      {
        href: '/dashboard/retirement',
        label: 'Simulateur Retraite & PER',
        desc: 'Estimez votre pension de retraite et simulez l\'impact d\'un versement sur un Plan Épargne Retraite (PER) pour 2026.',
        icon: PiggyBank,
        color: '#fbbf24',
        keywords: ['simulateur retraite', 'PER 2026', 'pension retraite', 'épargne retraite'],
      },
      {
        href: '/dashboard/succession',
        label: 'Succession & Donations',
        desc: 'Calcul des droits de mutation (DMTG) par lien de parenté, abattements fiscaux, barème progressif, optimisation sur 15 ans.',
        icon: Building2,
        color: '#818cf8',
        keywords: ['simulateur succession', 'droits donation', 'DMTG', 'abattement fiscal'],
      },
      {
        href: '/dashboard/consumer-credit',
        label: 'Coût Réel du Crédit Conso',
        desc: 'TAEG → mensualité PMT, coût total des intérêts, coût d\'opportunité vs placement. Tableau d\'amortissement complet.',
        icon: Receipt,
        color: '#fb7185',
        keywords: ['crédit consommation', 'TAEG', 'coût crédit conso', 'mensualité emprunt'],
      },
    ],
  },
  {
    category: 'Budget & Épargne',
    color: '#a3e635',
    items: [
      {
        href: '/dashboard/budget',
        label: 'Budget 50/30/20',
        desc: 'Répartissez vos dépenses selon la règle d\'or : 50 % besoins, 30 % envies, 20 % épargne. Personnalisé selon vos revenus.',
        icon: Calculator,
        color: '#a3e635',
        keywords: ['règle budget 50 30 20', 'budget mensuel', 'gestion budget'],
      },
      {
        href: '/dashboard/savings-rate',
        label: 'Taux d\'Épargne',
        desc: 'Calculez votre taux d\'épargne mensuel réel et son impact sur votre trajectoire patrimoniale sur le long terme.',
        icon: Percent,
        color: '#34d399',
        keywords: ['taux épargne', 'capacité épargne', 'simulateur épargne mensuelle'],
      },
      {
        href: '/dashboard/emergency-fund',
        label: 'Épargne de Précaution',
        desc: 'Calculez le montant optimal de votre fonds d\'urgence selon vos charges, situation d\'emploi et nombre de mois cibles.',
        icon: Shield,
        color: '#fbbf24',
        keywords: ['épargne précaution', 'fonds urgence', 'livret A', 'épargne sécurité'],
      },
    ],
  },
  {
    category: 'Patrimoine Global',
    color: '#f1c086',
    items: [
      {
        href: '/dashboard/score',
        label: 'Score Patrimonial',
        desc: 'Obtenez votre score global sur 100 et des recommandations concrètes sur 6 piliers : FIRE, diversification, épargne, dette, assurance, transmission.',
        icon: Star,
        color: '#f1c086',
        keywords: ['score patrimonial', 'bilan patrimonial', 'diagnostic finances personnelles'],
      },
    ],
  },
]

const TOTAL = SIMULATEURS.reduce((acc, cat) => acc + cat.items.length, 0)

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Simulateurs financiers gratuits — PatrImo',
  description: `${TOTAL} simulateurs financiers gratuits pour la France : intérêts composés, FIRE, impôts 2026, immobilier, flat tax.`,
  url: 'https://finance.digitalstack.cloud/tools',
  hasPart: SIMULATEURS.flatMap(cat =>
    cat.items.map(item => ({
      '@type': 'WebApplication',
      name: item.label,
      description: item.desc,
      url: `https://finance.digitalstack.cloud${item.href}`,
      applicationCategory: 'FinanceApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    }))
  ),
}

export default function ToolsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Nav minimal */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 13, height: 13, color: '#0a0a0a' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>PatrImo</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Se connecter</Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#000', textDecoration: 'none', padding: '8px 18px', borderRadius: 100, background: '#f1c086' }}>
                Commencer gratuitement <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </div>
        </nav>

        <main style={{ maxWidth: 1152, margin: '0 auto', padding: '64px 20px 100px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, background: 'rgba(241,192,134,0.10)', border: '1px solid rgba(241,192,134,0.20)', color: '#f1c086', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f1c086' }} />
              {TOTAL} simulateurs gratuits · Fiscalité 2026
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 16 }}>
              Tous les simulateurs{' '}
              <span style={{ background: 'linear-gradient(135deg, #f1c086 0%, #fbbf24 50%, #f1c086 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                financiers
              </span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 32px' }}>
              {TOTAL} outils gratuits pour calculer vos impôts, simuler votre retraite,
              optimiser vos investissements et piloter votre patrimoine.
              Sans compte bancaire. 100 % gratuit.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: '✓', text: '100 % gratuit, pour toujours' },
                { icon: '🔒', text: 'Aucune donnée bancaire' },
                { icon: '🇪🇺', text: 'RGPD · Hébergé en Europe' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          {SIMULATEURS.map(cat => (
            <section key={cat.category} style={{ marginBottom: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
                  {cat.category}
                </h2>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                  {cat.items.length} outil{cat.items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {cat.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ textDecoration: 'none', display: 'block' }}
                    prefetch={false}
                    className="tool-card-link"
                  >
                    <article
                      className="tool-card"
                      style={{ '--card-color': item.color } as React.CSSProperties}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: item.color + '18',
                          border: `1px solid ${item.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <item.icon style={{ width: 19, height: 19, color: item.color }} />
                        </div>
                        <ArrowRight style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.18)', marginTop: 4 }} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                        {item.label}
                      </h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, margin: '0 0 14px' }}>
                        {item.desc}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.keywords.slice(0, 2).map(kw => (
                          <span key={kw} style={{ fontSize: 10, color: item.color + 'bb', background: item.color + '12', border: `1px solid ${item.color}22`, borderRadius: 100, padding: '2px 9px', fontWeight: 500, letterSpacing: '0.01em' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Bottom CTA */}
          <div style={{ marginTop: 24, textAlign: 'center', background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 24, padding: '56px 32px' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Prêt à piloter votre patrimoine ?
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.7 }}>
              Créez un compte gratuit et sauvegardez vos simulations, suivez votre patrimoine global<br />
              et obtenez votre score patrimonial personnalisé.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 100, fontSize: 14, fontWeight: 700, background: '#f1c086', color: '#000', textDecoration: 'none' }}>
                Créer un compte gratuit <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
              <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textDecoration: 'none' }}>
                En savoir plus →
              </Link>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 18 }}>
              Aucune carte bancaire · Aucune donnée bancaire · RGPD · Gratuit pour toujours
            </p>
          </div>
        </main>

        {/* Footer minimal */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: 1152, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              © 2026 PatrImo · finance.digitalstack.cloud
            </span>
            <div style={{ display: 'flex', gap: 20 }}>
              {[['/', 'Accueil'], ['/mentions-legales', 'Mentions légales'], ['/politique-confidentialite', 'Confidentialité']].map(([href, label]) => (
                <Link key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
