import Link from 'next/link'
import type { Metadata } from 'next'
import {
  TrendingUp, Building2, Home, PiggyBank, Bitcoin,
  Wallet, Receipt, Layers, BarChart3, RefreshCw,
  Star, BookOpen, Calculator, Award, Globe,
} from 'lucide-react'

export const metadata: Metadata = {
  title: '15 modules Patrimoniaux gratuits — Patrimo',
  description:
    'Suivez et gérez votre Patrimoine en temps réel : immobilier, actions, livrets, crypto, PEA, assurance vie. 15 outils de gestion Patrimoniale gratuits.',
  openGraph: {
    title: '15 modules Patrimoniaux gratuits — Patrimo',
    description:
      '15 outils pour piloter votre Patrimoine : bilan complet, suivi de portefeuille, rééquilibrage, score Patrimonial et rapport fiscal.',
    url: 'https://finance.digitalstack.cloud/Patrimoine',
  },
}

const GROUPS = [
  {
    label: 'Patrimoine',
    num: '01',
    pages: [
      { slug: 'vue-ensemble',     label: "Vue d'ensemble",   desc: 'Bilan Patrimonial complet : actifs, passifs, répartition par enveloppe et évolution dans le temps.', icon: Layers },
      { slug: 'immobilier',       label: 'Immobilier',        desc: 'Suivez vos biens immobiliers, valeur estimée, crédits en cours et Patrimoine net immobilier.', icon: Home },
      { slug: 'actions-fonds',    label: 'Actions & Fonds',   desc: 'Gérez vos lignes en PEA, CTO et assurance vie avec valorisation en temps réel.', icon: TrendingUp },
      { slug: 'livrets',          label: 'Livrets',           desc: "Centralisez vos livrets d'épargne (Livret A, LDDS, LEP...) et suivez les intérêts générés.", icon: PiggyBank },
      { slug: 'autres-actifs',    label: 'Autres actifs',     desc: 'Crypto-monnaies, métaux précieux, parts de SCPI et tous vos actifs alternatifs.', icon: Bitcoin },
      { slug: 'comptes-bancaires',label: 'Comptes bancaires', desc: 'Soldes de vos comptes courants et épargne liquide intégrés dans votre bilan global.', icon: Wallet },
      { slug: 'emprunts',         label: 'Emprunts',          desc: 'Tableau de bord de vos dettes : capital restant dû, mensualités et date de fin prévue.', icon: Receipt },
      { slug: 'detail-enveloppe', label: 'Détail enveloppe',  desc: "Fiche complète d'une enveloppe avec historique, performances et métadonnées personnalisées.", icon: Building2 },
    ],
  },
  {
    label: 'Suivi & Trading',
    num: '02',
    pages: [
      { slug: 'mon-portefeuille', label: 'Mon Portefeuille', desc: 'Tracker de positions en temps réel : prix, variation, poids et performance globale.', icon: BarChart3 },
      { slug: 'reequilibrage',    label: 'Rééquilibrage',    desc: 'Calculez les achats et ventes nécessaires pour revenir à votre allocation cible.', icon: RefreshCw },
      { slug: 'mes-objectifs',    label: 'Mes Objectifs',    desc: "Définissez des objectifs d'épargne ou d'investissement et suivez votre progression.", icon: Star },
      { slug: 'carnet-ordres',    label: "Carnet d'ordres",  desc: 'Journalisez vos ordres passés, suivez vos PRU et calculez vos plus-values latentes.', icon: BookOpen },
    ],
  },
  {
    label: 'Analyse & Fiscal',
    num: '03',
    pages: [
      { slug: 'rapport-fiscal',      label: 'Rapport Fiscal',      desc: 'Synthèse annuelle de vos revenus de capitaux : dividendes, coupons et plus-values réalisées.', icon: Calculator },
      { slug: 'score-Patrimonial',   label: 'Score Patrimonial',   desc: 'Note globale de la santé de votre Patrimoine basée sur diversification, liquidité et risque.', icon: Award },
      { slug: 'gestion-personnelle', label: 'Gestion personnelle',  desc: "Vue personnalisée : taux d'épargne, budget mensuel et projections FIRE.", icon: Globe },
    ],
  },
]

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.pp-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.pp-c{max-width:1160px;margin:0 auto;padding:0 40px}

.pp-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.pp-nav-inner{display:flex;align-items:center;justify-content:space-between;width:100%}
.pp-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.pp-logo em{font-style:normal;color:#c96a4a}
.pp-nav-links{display:flex;align-items:center;gap:28px}
.pp-nav-links a{font-family:'Inter',sans-serif;font-size:13px;color:#5a5448;text-decoration:none;transition:color .15s}
.pp-nav-links a:hover{color:#15140f}
.pp-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:#15140f;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:600;text-decoration:none;transition:background .18s}
.pp-nav-cta:hover{background:#c96a4a}

.pp-rule{display:flex;align-items:center;gap:20px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:14px;margin-bottom:48px}
.pp-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}

.pp-hero{padding:64px 0 56px}
.pp-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(42px,5.5vw,72px);font-weight:800;letter-spacing:-.032em;line-height:1.0;margin:0 0 20px;color:#15140f}
.pp-hero h1 em{font-style:italic;font-family:'Playfair Display',serif;font-weight:500;color:#c96a4a}
.pp-hero p{font-size:16px;color:#5a5448;max-width:520px;line-height:1.65;margin:0 0 36px}
.pp-hero-meta{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.pp-hero-stat{display:flex;align-items:baseline;gap:6px}
.pp-hero-stat strong{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:500;color:#c96a4a}
.pp-hero-stat span{font-size:12px;color:#8b8676;font-family:'Inter',sans-serif}

.pp-sec{padding:0 0 96px}
.pp-group{margin-bottom:64px}
.pp-group-rule{display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:14px;margin-bottom:24px}
.pp-group-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#c96a4a;text-transform:uppercase}
.pp-group-sep{height:1px;flex:1;background:rgba(21,20,15,.08)}
.pp-group-name{font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#15140f}
.pp-group-count{font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b8676;margin-left:auto}
.pp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:16px}
.pp-card{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:16px;padding:22px 22px 24px;cursor:pointer;transition:transform .22s,box-shadow .22s,border-color .22s;text-decoration:none;color:#15140f;display:block}
.pp-card:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(21,20,15,.10),0 2px 8px rgba(21,20,15,.06);border-color:rgba(201,106,74,.25)}
.pp-card-icon{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;background:rgba(201,106,74,.10);border:1px solid rgba(201,106,74,.16);flex-shrink:0}
.pp-card-label{font-family:'Inter Tight',sans-serif;font-size:15px;font-weight:700;letter-spacing:-.012em;margin-bottom:8px;color:#15140f}
.pp-card-desc{font-size:13px;color:#5a5448;line-height:1.55;margin:0 0 16px}
.pp-card-arrow{font-family:'JetBrains Mono',monospace;font-size:11px;color:#c96a4a;letter-spacing:.04em}
.pp-card-meta{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;color:#8b8676;text-transform:uppercase;margin-bottom:10px}

.pp-cta-block{background:#15140f;border-radius:24px;padding:64px 48px;display:flex;align-items:center;justify-content:space-between;gap:32px;margin-top:16px;margin-bottom:96px}
.pp-cta-block h3{font-family:'Inter Tight',sans-serif;font-size:clamp(22px,2.5vw,32px);font-weight:800;letter-spacing:-.022em;color:#efe7d2;margin:0 0 10px}
.pp-cta-block p{font-size:14px;color:#8b8676;margin:0;line-height:1.6;max-width:440px}
.pp-cta-btn{display:inline-flex;align-items:center;gap:10px;padding:13px 26px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background .18s}
.pp-cta-btn:hover{background:#a84f35}

@media(max-width:768px){
  .pp-c{padding:0 20px}
  .pp-hero{padding:40px 0 36px}
  .pp-cta-block{flex-direction:column;align-items:flex-start;padding:36px 28px}
  .pp-nav-links{display:none}
  .pp-grid{grid-template-columns:1fr}
}
`

export default function PatrimoinePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="pp-root">

        {/* Nav */}
        <nav className="pp-nav">
          <div className="pp-c">
            <div className="pp-nav-inner">
              <Link href="/" className="pp-logo">Patri<em>mo</em></Link>
              <div className="pp-nav-links">
                <Link href="/#enveloppes">Enveloppes</Link>
                <Link href="/tools">Simulateurs</Link>
                <Link href="/Patrimoine">Patrimoine</Link>
              </div>
              <Link href="/login" className="pp-nav-cta">Démarrer →</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pp-hero">
          <div className="pp-c">
            <div className="pp-rule">
              <span>Modules / 15 pages</span>
              <span className="pp-rule-sep" />
              <span>015 / 015</span>
            </div>
            <h1>15 modules.<br /><em>Votre Patrimoine,</em> piloté.</h1>
            <p>Bilan complet, suivi de portefeuille, rééquilibrage, score Patrimonial. Tous les outils pour gérer votre Patrimoine — gratuit, sans connexion bancaire.</p>
            <div className="pp-hero-meta">
              <div className="pp-hero-stat"><strong>15</strong><span>modules</span></div>
              <div className="pp-hero-stat"><strong>0</strong><span>donnée bancaire</span></div>
              <div className="pp-hero-stat"><strong>100%</strong><span>gratuit</span></div>
            </div>
          </div>
        </section>

        {/* Groups */}
        <section className="pp-sec">
          <div className="pp-c">
            {GROUPS.map(group => (
              <div key={group.label} className="pp-group">
                <div className="pp-group-rule">
                  <span className="pp-group-num">{group.num}</span>
                  <span className="pp-group-sep" />
                  <span className="pp-group-name">{group.label}</span>
                  <span className="pp-group-count">{String(group.pages.length).padStart(2,'0')}</span>
                </div>
                <div className="pp-grid">
                  {group.pages.map((page, pi) => {
                    const Icon = page.icon
                    return (
                      <Link key={page.slug} href={`/Patrimoine/${page.slug}`} className="pp-card">
                        <div className="pp-card-meta">PTM-{String(GROUPS.slice(0, GROUPS.indexOf(group)).reduce((acc, g) => acc + g.pages.length, 0) + pi + 1).padStart(2,'0')}</div>
                        <div className="pp-card-icon">
                          <Icon style={{ width: 15, height: 15, color: '#c96a4a' }} />
                        </div>
                        <div className="pp-card-label">{page.label}</div>
                        <p className="pp-card-desc">{page.desc}</p>
                        <span className="pp-card-arrow">Voir la fiche →</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="pp-c">
          <div className="pp-cta-block">
            <div>
              <h3>Commencez à piloter votre Patrimoine.</h3>
              <p>Créez un compte gratuit pour accéder à toutes les pages de gestion, suivre vos actifs et obtenir votre score Patrimonial sur 6 dimensions.</p>
            </div>
            <Link href="/login" className="pp-cta-btn">Démarrer gratuitement →</Link>
          </div>
        </div>

      </div>
    </>
  )
}
