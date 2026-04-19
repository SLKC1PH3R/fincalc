'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Data ─────────────────────────────────────────────────────────────────

const TOOLS = [
  { tag:'te', cat:'Épargne',        name:'Intérêts Composés',      desc:"Visualisez l'effet boule de neige de votre épargne.",            href:'/tools/interets-composes' },
  { tag:'te', cat:'Épargne',        name:'FI/RE',                  desc:'Calculez votre objectif FIRE et date de liberté financière.',     href:'/tools/fire' },
  { tag:'ti', cat:'Immobilier',     name:'Prêt Immobilier',        desc:"Mensualités, TAEG, tableau d'amortissement complet.",            href:'/tools/pret-immobilier' },
  { tag:'te', cat:'Épargne',        name:'DCA',                    desc:"Simulez un plan d'investissement régulier vs lump sum.",         href:'/tools/dca' },
  { tag:'ti', cat:'Immobilier',     name:'Acheter vs Louer',       desc:'Comparez le patrimoine généré selon votre stratégie.',           href:'/tools/acheter-ou-louer' },
  { tag:'ti', cat:'Immobilier',     name:'Rentabilité Locative',   desc:'Cashflow, rendement net et fiscalité locative.',                 href:'/tools/rentabilite-locative' },
  { tag:'tf', cat:'Fiscal',         name:'Impôts IR',              desc:"Calcul IR, TMI, frais réels vs abattement 10%.",                href:'/tools/impots-ir' },
  { tag:'tf', cat:'Fiscal',         name:'Simulateur Retraite',    desc:'Pension estimée et optimisation de votre PER 2026.',            href:'/tools/retraite' },
  { tag:'tb', cat:'Budget',         name:'Budget 50/30/20',        desc:"Répartition de vos dépenses selon la règle d'or.",              href:'/tools/budget-50-30-20' },
  { tag:'tf', cat:'Fiscal',         name:'Flat Tax vs Barème',     desc:'Comparez le PFU 30% au barème progressif.',                     href:'/tools/flat-tax-bareme' },
  { tag:'tv', cat:'Investissement', name:'PEA vs CTO vs AV',       desc:'Fiscalité nette de chaque enveloppe sur la durée.',             href:'/tools/pea-cto-av' },
  { tag:'tb', cat:'Budget',         name:"Taux d'épargne",         desc:"Calculez et optimisez votre taux d'épargne mensuel.",           href:'/tools/taux-epargne' },
  { tag:'tv', cat:'Investissement', name:'Score Patrimonial',      desc:'Score global sur 6 piliers avec recommandations.',              href:'/tools/score-patrimonial' },
  { tag:'tb', cat:'Budget',         name:"Épargne de précaution",  desc:"Fonds d'urgence optimal selon votre situation.",                href:'/tools/epargne-urgence' },
  { tag:'tf', cat:'Fiscal',         name:'Coût réel crédit conso', desc:'TAEG → mensualité, coût total, opportunité.',                   href:'/tools/credit-conso' },
  { tag:'tf', cat:'Fiscal',         name:'Succession & Donations', desc:'DMTG, abattements, barème progressif, 15 ans.',                href:'/tools/succession' },
  { tag:'tv', cat:'Investissement', name:'Revenus passifs',        desc:'Portefeuille dividendes : revenu mensuel par capital.',         href:'/tools/revenus-passifs' },
  { tag:'tv', cat:'Investissement', name:'Benchmarks',             desc:'Comparez votre portfolio au CAC 40, MSCI World…',              href:'/tools/benchmarks' },
]

const PL = [
  { ic:'🏛', nm:"Vue d'ensemble",   sb:'Dashboard global : valeur, répartition, carte monde', href:'/dashboard/patrimoine' },
  { ic:'🏠', nm:'Immobilier',       sb:'Biens, valeur de marché, crédit restant et loyers',   href:'/dashboard/patrimoine' },
  { ic:'📈', nm:'Actions & Fonds',  sb:'PEA, CTO, AV, PER — valeur en temps réel',            href:'/dashboard/patrimoine' },
  { ic:'💳', nm:'Livrets',          sb:'Livret A, LDDS, LEP — plafonds et intérêts',          href:'/dashboard/patrimoine' },
  { ic:'₿',  nm:'Autres actifs',    sb:'Crypto, métaux précieux et actifs alternatifs',       href:'/dashboard/patrimoine' },
  { ic:'🏦', nm:'Comptes bancaires',sb:'Soldes et suivi de vos comptes courants',             href:'/dashboard/patrimoine' },
  { ic:'📋', nm:'Emprunts',         sb:'Vue consolidée de tous vos crédits',                   href:'/dashboard/patrimoine' },
]

const PR = [
  { ic:'📊', nm:'Mon Portefeuille',   sb:'Prix live via Finnhub & CoinGecko',               href:'/dashboard/portfolio' },
  { ic:'⚖️', nm:'Rééquilibrage',     sb:'Arbitrages vers votre allocation cible',            href:'/dashboard/patrimoine' },
  { ic:'🎯', nm:'Mes Objectifs',     sb:'Objectifs personnalisés avec progression',           href:'/dashboard/patrimoine' },
  { ic:'📓', nm:"Carnet d'ordres",   sb:'Journal BUY / SELL / DIVIDEND — P&L',              href:'/dashboard/patrimoine' },
  { ic:'🧾', nm:'Rapport Fiscal',    sb:'Plus-values, durées de détention, optimisation',    href:'/dashboard/patrimoine' },
  { ic:'🏆', nm:'Score Patrimonial', sb:'Notation 0-100 sur 6 piliers',                      href:'/dashboard/score' },
  { ic:'👤', nm:'Gestion personnelle',sb:'Vue synthétique : allocation, objectifs, fiscal',  href:'/dashboard/patrimoine' },
]

const TESTIS = [
  { av:'LB', bg:'#0f2a1a', q:"« Le simulateur FI/RE m'a donné une date concrète : liberté financière à 47 ans. Je n'y croyais pas avant de voir les chiffres. »",      nm:'Lucas B.',    rl:'Ingénieur logiciel, 32 ans' },
  { av:'NF', bg:'#2a0f1a', q:"« J'ai comparé PEA et CTO pour mes dividendes — différence sur 20 ans : 24 000 €. J'ai transféré en 2 semaines. »",                       nm:'Nathalie F.', rl:'Comptable, 41 ans' },
  { av:'RT', bg:'#0f1a2a', q:"« L'outil Acheter vs Louer m'a convaincu d'attendre encore 2 ans. Économie potentielle : 12 000 €. »",                                    nm:'Romain T.',   rl:'Commercial, 29 ans' },
  { av:'IC', bg:'#2a200f', q:"« Le simulateur retraite m'a aidé à comprendre l'impact de mon PER. J'aurais voulu découvrir ça 10 ans plus tôt. »",                       nm:'Isabelle C.', rl:'Médecin, 48 ans' },
  { av:'HV', bg:'#1a0f2a', q:"« Flat Tax vs Barème — 5 minutes pour comprendre que je payais 1 400 € de trop par an. J'ai changé immédiatement. »",                     nm:'Hélène V.',   rl:'Cadre RH, 43 ans' },
  { av:'AG', bg:'#0a1a0a', q:"« Le simulateur IR m'a économisé 900 €/an grâce aux frais réels. Je ne savais même pas que c'était possible. »",                           nm:'Antoine G.',  rl:'Commercial terrain, 27 ans' },
]

const RMAP_DONE = ['Connexion Google OAuth','32 simulateurs','Historique simulations','Mode sombre/clair','Tableau patrimonial','Portefeuille temps réel','Score Patrimonial','Flat Tax vs Barème','PEA/CTO/AV','Partage simulation','Glossaire contextuel','Taux en direct',"Carnet d'ordres",'Timeline patrimoine','Revenus passifs','Connexion FIRE ↔ Patrimoine',"Épargne d'urgence","Crédit conso","Succession & Donations",'Catégories patrimoniales']
const RMAP_WIP  = ['Export PDF','Livrets réglementés','Impact des frais','Inflation & pouvoir d\'achat','Remboursement dettes','Plus-value immobilière','SCPI','Déficit foncier','Viager','Auto-entrepreneur','IFI','Stock-options / BSPCE']
const RMAP_SOON = ['Comparateur de scénarios','Calculatrice rapide','Mode reverse','Alertes paramétrables','Rapport mensuel email','Mode présentation','Articles & guides','Application mobile','Intégrations bancaires']

const FAQ_ITEMS = [
  { q:'Est-ce vraiment gratuit, pour toujours ?',      a:'Oui. Les 18 simulateurs et les fonctionnalités de base sont et resteront gratuits. PatrImo ne vit ni de la pub, ni de la revente de données.' },
  { q:'Faut-il connecter mon compte bancaire ?',       a:"Non. PatrImo ne demande jamais vos coordonnées bancaires, RIB ou accès à vos comptes. Vous saisissez uniquement les données que vous souhaitez renseigner." },
  { q:'Où sont stockées mes données ?',                a:'Vos données sont chiffrées (AES-256) et stockées sur des serveurs hébergés en Europe. Elles ne sont jamais partagées ni vendues à des tiers.' },
  { q:'Les calculs sont-ils fiables ?',                a:'Les modèles sont validés sur plus de 40 scénarios réels, avec une fiscalité française 2026 à jour (TMI, PFU, abattements, etc.). Ils sont fournis à titre indicatif.' },
  { q:"PatrImo est-il adapté aux débutants ?",         a:"Absolument. Chaque simulateur est conçu pour être compris en moins de 30 secondes, avec un glossaire contextuel intégré." },
  { q:'Puis-je utiliser PatrImo sur mobile ?',         a:"Oui. L'interface est entièrement responsive et optimisée pour mobile, sans appli dédiée à installer." },
  { q:'Les calculs reflètent-ils la fiscalité 2026 ?', a:"Oui. Taux IR, PFU 30%, abattements PEA/AV, barèmes successoraux — tout est à jour pour 2026 et mis à jour à chaque modification législative." },
]

const COMPARE_ROWS = [
  ['100 % gratuit','✓','✗','✓'],
  ['Intérêts composés','✓','~','~'],
  ['Simulateur FI/RE','✓','✗','~'],
  ['Simulateur retraite','✓','~','~'],
  ['Calcul impôts IR / TMI','✓','~','✗'],
  ['DCA / Investissement régulier','✓','~','✗'],
  ['Acheter vs Louer','✓','~','✗'],
  ['Fiscalité française 2026','✓','✗','✗'],
  ['Sans données bancaires','✓','✓','✓'],
  ['Zéro publicité','✓','✗','✓'],
]

// ─── CSS ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.lp-wrap *,.lp-wrap *::before,.lp-wrap *::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --lp-bg0:#080b13;--lp-bg1:#0d1120;--lp-bg2:#111827;
  --lp-card:#131929;--lp-card-b:rgba(255,255,255,0.06);
  --lp-blue:#4b78ff;--lp-blue2:#3a60e6;
  --lp-blue-g:rgba(75,120,255,0.12);
  --lp-white:#f1f5ff;--lp-g1:#c8d0e7;--lp-g2:#7b88aa;--lp-g3:#3d4d6a;
  --lp-green:#22c55e;--lp-red:#ef4444;--lp-amber:#f59e0b;
  --lp-r:8px;--lp-r2:12px;--lp-r3:16px;
}

.lp-wrap{
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  background:var(--lp-bg0);color:var(--lp-white);line-height:1.6;overflow-x:hidden;
}
.lp-wrap h1,.lp-wrap h2,.lp-wrap h3,.lp-wrap h4{line-height:1.2;letter-spacing:-0.02em}
.lp-wrap h1{font-size:clamp(2.6rem,5.5vw,5rem);font-weight:800}
.lp-wrap h2{font-size:clamp(1.8rem,3vw,2.75rem);font-weight:700}
.lp-wrap h3{font-size:1.1rem;font-weight:600}
.lp-wrap p{color:var(--lp-g1)}
.lp-wrap a{text-decoration:none}

.lp-container{max-width:1180px;margin:0 auto;padding:0 1.75rem}
.lp-section{padding:6rem 0}

.lp-glow{position:absolute;border-radius:50%;pointer-events:none;z-index:0;filter:blur(100px)}

/* ── NAV ── */
.lp-nav{position:sticky;top:0;z-index:100;background:rgba(8,11,19,0.92);backdrop-filter:blur(16px) saturate(180%);border-bottom:1px solid rgba(255,255,255,0.05)}
.lp-nav-inner{max-width:1180px;margin:0 auto;padding:0 1.75rem;height:60px;display:flex;align-items:center;justify-content:space-between;gap:1.5rem}
.lp-logo{font-weight:800;font-size:1.3rem;color:var(--lp-white);letter-spacing:-0.03em;display:flex;align-items:center;gap:0.3rem}
.lp-logo-dot{width:8px;height:8px;border-radius:50%;background:var(--lp-blue);display:inline-block;flex-shrink:0}
.lp-nav-links{display:flex;gap:0.1rem;list-style:none}
.lp-nav-links a{font-size:0.85rem;font-weight:500;color:var(--lp-g2);padding:0.45rem 0.9rem;border-radius:6px;transition:color 0.15s,background 0.15s}
.lp-nav-links a:hover{color:var(--lp-white);background:rgba(255,255,255,0.05)}
.lp-nav-r{display:flex;gap:0.6rem;align-items:center}

/* ── BUTTONS ── */
.lp-btn{display:inline-flex;align-items:center;gap:0.4rem;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:0.875rem;padding:0.575rem 1.25rem;border-radius:var(--lp-r);cursor:pointer;border:1px solid transparent;transition:all 0.18s;white-space:nowrap;text-decoration:none}
.lp-ghost{color:var(--lp-g1);border-color:var(--lp-card-b);background:transparent}
.lp-ghost:hover{color:var(--lp-white);background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1)}
.lp-primary{background:var(--lp-blue);color:#fff;border-color:var(--lp-blue)}
.lp-primary:hover{background:var(--lp-blue2);border-color:var(--lp-blue2);transform:translateY(-1px);box-shadow:0 6px 20px rgba(75,120,255,0.3)}
.lp-outline{color:var(--lp-blue);border-color:rgba(75,120,255,0.35);background:rgba(75,120,255,0.06)}
.lp-outline:hover{background:rgba(75,120,255,0.12);border-color:var(--lp-blue)}
.lp-lg{padding:0.8rem 1.75rem;font-size:0.95rem;border-radius:var(--lp-r2)}

/* ── PILL ── */
.lp-pill{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(75,120,255,0.1);border:1px solid rgba(75,120,255,0.22);color:var(--lp-blue);border-radius:99px;padding:0.3rem 0.9rem;font-size:0.78rem;font-weight:600;letter-spacing:0.02em}
.lp-pill .lp-live{width:6px;height:6px;border-radius:50%;background:var(--lp-green);animation:lp-pulse 2s infinite;display:inline-block}
@keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:0.4}}

/* ── HERO ── */
.lp-hero{position:relative;overflow:hidden;min-height:calc(100vh - 60px);display:flex;flex-direction:column;justify-content:center;padding:5rem 0 4rem}
.lp-glow-l{width:800px;height:600px;top:-200px;left:-200px;background:radial-gradient(ellipse,rgba(75,120,255,0.09) 0%,transparent 65%)}
.lp-glow-r{width:600px;height:500px;top:50%;right:-200px;transform:translateY(-50%);background:radial-gradient(ellipse,rgba(100,60,255,0.06) 0%,transparent 65%)}
.lp-hero-content{position:relative;z-index:1}
.lp-hero h1{margin-bottom:1.25rem;max-width:820px}
.lp-hero h1 em{font-style:normal;color:var(--lp-blue)}
.lp-hero-sub{font-size:1.1rem;color:var(--lp-g1);max-width:540px;font-weight:400;margin-bottom:2.25rem;line-height:1.7}
.lp-hero-ctas{display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:3.5rem}
.lp-hero-trust{display:flex;gap:2rem;flex-wrap:wrap;padding-top:2.5rem;border-top:1px solid rgba(255,255,255,0.06)}
.lp-trust-i{display:flex;align-items:center;gap:0.5rem;font-size:0.83rem;color:var(--lp-g2)}
.lp-trust-i svg{width:14px;height:14px;fill:var(--lp-blue);flex-shrink:0}

/* ── MOCKUP ── */
.lp-mock{position:relative;z-index:1;background:var(--lp-bg1);border:1px solid rgba(255,255,255,0.07);border-radius:var(--lp-r3);overflow:hidden;margin-top:4rem;box-shadow:0 40px 80px rgba(0,0,0,0.5)}
.lp-mock-bar{background:var(--lp-bg2);padding:0.7rem 1rem;display:flex;align-items:center;gap:0.5rem;border-bottom:1px solid rgba(255,255,255,0.05)}
.lp-mock-dots{display:flex;gap:5px}
.lp-mock-dot{width:10px;height:10px;border-radius:50%}
.lp-mock-url{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:5px;padding:0.25rem 0.75rem;font-size:0.75rem;color:var(--lp-g2);max-width:340px;margin:0 auto;text-align:center}
.lp-mock-body{padding:1.25rem;display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:rgba(255,255,255,0.04);min-height:260px}
.lp-mock-panel{background:var(--lp-card);padding:1rem}
.lp-panel-lbl{font-size:0.7rem;color:var(--lp-g2);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.5rem}
.lp-mock-num{font-size:1.5rem;font-weight:700;color:var(--lp-white);letter-spacing:-0.02em}
.lp-mock-delta{font-size:0.8rem;font-weight:600;margin-top:0.15rem}
.lp-mock-delta.pos{color:var(--lp-green)}
.lp-mock-barchart{margin-top:0.75rem;display:flex;align-items:flex-end;gap:3px;height:56px}
.lp-mock-barchart .b{border-radius:3px 3px 0 0;flex:1}
.lp-mock-tbl{width:100%;border-collapse:collapse;margin-top:0.5rem}
.lp-mock-tbl td{font-size:0.75rem;padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.04);color:var(--lp-g1)}
.lp-mock-tbl td:last-child{text-align:right}
.lp-score-ring{width:64px;height:64px;border-radius:50%;border:3px solid var(--lp-blue);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:var(--lp-white);margin:0.5rem auto}

/* ── LOGOS ── */
.lp-logos{border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);padding:2rem 0;background:var(--lp-bg1)}
.lp-logos-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem}
.lp-logos-lbl{font-size:0.78rem;color:var(--lp-g2);white-space:nowrap}
.lp-logos-list{display:flex;gap:2rem;flex-wrap:wrap;align-items:center}
.lp-logos-list span{font-size:0.85rem;font-weight:600;color:var(--lp-g3)}

/* ── STATS ── */
.lp-stats-wrap{background:var(--lp-bg1);padding:4.5rem 0}
.lp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);overflow:hidden}
.lp-stat-cell{padding:2rem 1.75rem;border-right:1px solid rgba(255,255,255,0.06);text-align:center}
.lp-stat-cell:last-child{border-right:none}
.lp-stat-n{font-size:2.5rem;font-weight:800;color:var(--lp-white);letter-spacing:-0.04em;line-height:1}
.lp-stat-n span{color:var(--lp-blue)}
.lp-stat-l{font-size:0.82rem;color:var(--lp-g2);margin-top:0.35rem}

/* ── SECTION LABEL ── */
.lp-s-label{font-size:0.72rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--lp-blue);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem}
.lp-s-label::before{content:'';width:16px;height:2px;background:var(--lp-blue);border-radius:1px}
.lp-s-head{margin-bottom:3rem}
.lp-s-head h2{margin-bottom:0.6rem}
.lp-s-head p{max-width:480px}

/* ── FEATURES ── */
.lp-feat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);overflow:hidden}
.lp-feat-card{background:var(--lp-bg0);padding:2.25rem 2rem;transition:background 0.2s}
.lp-feat-card:hover{background:var(--lp-bg1)}
.lp-feat-icon{width:44px;height:44px;border-radius:var(--lp-r);background:var(--lp-blue-g);border:1px solid rgba(75,120,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin-bottom:1.1rem}
.lp-feat-card h3{margin-bottom:0.4rem}
.lp-feat-card p{font-size:0.875rem;line-height:1.65}

/* ── TICKER ── */
.lp-ticker-wrap{overflow:hidden;position:relative;padding:1.2rem 0;background:var(--lp-bg1);border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
.lp-ticker-wrap::before,.lp-ticker-wrap::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2}
.lp-ticker-wrap::before{left:0;background:linear-gradient(to right,var(--lp-bg1),transparent)}
.lp-ticker-wrap::after{right:0;background:linear-gradient(to left,var(--lp-bg1),transparent)}
.lp-ticker{display:flex;gap:0.6rem;animation:lp-tkr 35s linear infinite;width:max-content}
.lp-ticker:hover{animation-play-state:paused}
@keyframes lp-tkr{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.lp-tkr-item{display:flex;align-items:center;gap:0.4rem;background:var(--lp-card);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:0.35rem 0.85rem;font-size:0.8rem;color:var(--lp-g1);white-space:nowrap;flex-shrink:0}
.lp-tkr-item:hover{border-color:rgba(75,120,255,0.3);color:var(--lp-white)}
.lp-tkr-dot{width:5px;height:5px;border-radius:50%;background:var(--lp-blue);opacity:0.7;flex-shrink:0}

/* ── TOOLS ── */
.lp-tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);overflow:hidden}
.lp-tool-card{background:var(--lp-bg1);padding:1.5rem;display:flex;flex-direction:column;text-decoration:none;color:inherit;transition:background 0.18s;gap:0.4rem}
.lp-tool-card:hover{background:var(--lp-bg2)}
.lp-tool-card:hover .lp-t-arrow{opacity:1;transform:translate(2px,-2px)}
.lp-tool-head{display:flex;align-items:flex-start;justify-content:space-between}
.lp-t-tag{font-size:0.68rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:0.2rem 0.5rem;border-radius:4px}
.te{background:rgba(34,197,94,0.1);color:#22c55e}
.ti{background:rgba(75,120,255,0.1);color:var(--lp-blue)}
.tf{background:rgba(245,158,11,0.1);color:var(--lp-amber)}
.tb{background:rgba(167,139,250,0.1);color:#a78bfa}
.tv{background:rgba(244,63,94,0.12);color:#fb7185}
.lp-t-arrow{font-size:0.9rem;color:var(--lp-g2);opacity:0;transition:opacity 0.18s,transform 0.18s}
.lp-tool-card h3{font-size:0.95rem;font-weight:600;margin-top:0.6rem;color:var(--lp-white)}
.lp-tool-card p{font-size:0.8rem;color:var(--lp-g2);line-height:1.5;margin:0}

/* ── PATRIMOINE ── */
.lp-patri-2col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.lp-pcol{background:var(--lp-card);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);overflow:hidden}
.lp-pcol-hd{padding:1rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--lp-g2)}
.lp-prow{display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.04);text-decoration:none;color:inherit;transition:background 0.15s}
.lp-prow:hover{background:rgba(75,120,255,0.05)}
.lp-prow:last-child{border-bottom:none}
.lp-prow-l{display:flex;align-items:center;gap:0.75rem}
.lp-prow-ic{width:32px;height:32px;border-radius:7px;background:rgba(75,120,255,0.1);display:flex;align-items:center;justify-content:center;font-size:0.9rem;flex-shrink:0}
.lp-prow-nm{font-size:0.875rem;font-weight:500;color:var(--lp-white)}
.lp-prow-sb{font-size:0.75rem;color:var(--lp-g2)}
.lp-prow-arr{font-size:0.8rem;color:var(--lp-g3)}

/* ── TESTIMONIALS ── */
.lp-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.lp-testi{background:var(--lp-card);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
.lp-testi-stars{color:var(--lp-blue);font-size:0.75rem;letter-spacing:0.12em}
.lp-testi-q{font-size:0.875rem;color:var(--lp-g1);line-height:1.65;flex:1}
.lp-testi-auth{display:flex;align-items:center;gap:0.65rem}
.lp-testi-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;flex-shrink:0;color:var(--lp-white)}
.lp-testi-nm{font-size:0.83rem;font-weight:600;color:var(--lp-white)}
.lp-testi-rl{font-size:0.75rem;color:var(--lp-g2)}

/* ── STEPS ── */
.lp-steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);overflow:hidden}
.lp-step-card{background:var(--lp-bg0);padding:2rem;position:relative}
.lp-step-n{font-size:3rem;font-weight:800;color:rgba(75,120,255,0.12);position:absolute;top:1.5rem;right:1.5rem;line-height:1;letter-spacing:-0.04em}
.lp-step-ic{width:44px;height:44px;border-radius:var(--lp-r);background:var(--lp-blue-g);border:1px solid rgba(75,120,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.1rem;margin-bottom:1rem}
.lp-step-card h3{margin-bottom:0.4rem}
.lp-step-card p{font-size:0.875rem;line-height:1.6}

/* ── PROFILES ── */
.lp-profiles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
.lp-profile{background:var(--lp-card);border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3);padding:1.5rem;transition:border-color 0.2s,background 0.2s}
.lp-profile:hover{background:rgba(75,120,255,0.04);border-color:rgba(75,120,255,0.25)}
.lp-p-em{font-size:1.75rem;margin-bottom:0.85rem}
.lp-p-role{font-size:0.72rem;color:var(--lp-g2);margin-bottom:0.75rem;font-weight:500}
.lp-profile h3{font-size:0.95rem;margin-bottom:0.4rem}
.lp-profile p{font-size:0.8rem;margin-bottom:1rem;line-height:1.5}
.lp-p-tags{display:flex;flex-wrap:wrap;gap:0.35rem}
.lp-p-tag{font-size:0.7rem;font-weight:600;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:0.2rem 0.5rem;color:var(--lp-g2)}

/* ── ROADMAP ── */
.lp-rmap{display:flex;flex-direction:column}
.lp-rmap-row{display:grid;grid-template-columns:200px 1fr;gap:2.5rem;padding:2rem 0;border-top:1px solid rgba(255,255,255,0.05);align-items:start}
.lp-rmap-l strong{font-size:0.95rem;font-weight:700;display:block;margin-bottom:0.25rem;color:var(--lp-white)}
.lp-rmap-l span{font-size:0.75rem}
.lp-s-done{color:var(--lp-green)}
.lp-s-wip{color:var(--lp-amber)}
.lp-s-soon{color:var(--lp-g2)}
.lp-rmap-items{display:flex;flex-wrap:wrap;gap:0.4rem}
.lp-ri{display:flex;align-items:center;gap:0.35rem;background:var(--lp-card);border:1px solid rgba(255,255,255,0.06);border-radius:5px;padding:0.3rem 0.65rem;font-size:0.78rem;color:var(--lp-g1)}
.lp-ri.done{border-color:rgba(34,197,94,0.12)}
.lp-ri.wip{border-color:rgba(245,158,11,0.15)}
.lp-ri-ic{font-size:0.7rem}
.lp-ri-ic.done{color:var(--lp-green)}
.lp-ri-ic.wip{color:var(--lp-amber)}
.lp-ri-ic.soon{color:var(--lp-g3)}

/* ── COMPARE ── */
.lp-cmp-wrap{overflow-x:auto;border:1px solid rgba(255,255,255,0.06);border-radius:var(--lp-r3)}
.lp-cmp{width:100%;border-collapse:collapse;min-width:520px}
.lp-cmp thead tr{background:var(--lp-bg2)}
.lp-cmp th{padding:1rem 1.25rem;font-size:0.8rem;font-weight:700;text-align:left;border-bottom:1px solid rgba(255,255,255,0.07);color:var(--lp-white)}
.lp-cmp th.hl{color:var(--lp-blue)}
.lp-cmp td{padding:0.8rem 1.25rem;font-size:0.85rem;color:var(--lp-g1);border-bottom:1px solid rgba(255,255,255,0.04)}
.lp-cmp tr:hover td{background:rgba(255,255,255,0.02)}
.lp-cmp tr:last-child td{border-bottom:none}
.lp-tick{color:var(--lp-green)}
.lp-cross{color:rgba(255,255,255,0.15)}
.lp-part{color:var(--lp-amber);font-size:0.78rem}

/* ── FAQ ── */
.lp-faq{max-width:700px;margin:0 auto}
.lp-fi{border-top:1px solid rgba(255,255,255,0.05)}
.lp-fq{width:100%;background:none;border:none;text-align:left;padding:1.25rem 0;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.92rem;font-weight:600;color:var(--lp-white);display:flex;justify-content:space-between;align-items:center;gap:1rem}
.lp-fq:hover{color:var(--lp-blue)}
.lp-fi-ic{font-size:1rem;color:var(--lp-g2);transition:transform 0.2s;display:inline-block}
.lp-fi-ic.open{transform:rotate(45deg);color:var(--lp-blue)}
.lp-fa{font-size:0.875rem;color:var(--lp-g2);line-height:1.7;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.2s;padding-right:2rem}
.lp-fa.open{max-height:200px;padding-bottom:1.25rem}

/* ── CTA FINAL ── */
.lp-cta-final{padding:8rem 0;text-align:center;position:relative;overflow:hidden;background:var(--lp-bg1);border-top:1px solid rgba(255,255,255,0.05)}
.lp-cta-final::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 100%,rgba(75,120,255,0.08) 0%,transparent 70%);pointer-events:none}
.lp-cta-final h2{margin-bottom:0.75rem}
.lp-cta-final p{max-width:460px;margin:0 auto 2.25rem}
.lp-cta-acts{display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap}

/* ── STICKY ── */
.lp-sticky{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:rgba(13,17,32,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.09);border-radius:99px;padding:0.45rem 0.5rem 0.45rem 1.4rem;display:flex;align-items:center;gap:1rem;z-index:99;box-shadow:0 8px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(75,120,255,0.1);animation:lp-sb 0.5s 2.5s ease both}
@keyframes lp-sb{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.lp-sticky span{font-size:0.82rem;color:var(--lp-g2);white-space:nowrap}

/* ── FOOTER ── */
.lp-footer{border-top:1px solid rgba(255,255,255,0.05);padding:3.5rem 0 2.5rem}
.lp-ft-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;margin-bottom:3rem}
.lp-ft-brand p{font-size:0.83rem;color:var(--lp-g2);margin-top:0.65rem;max-width:260px;line-height:1.6}
.lp-ft-col h5{font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--lp-g3);margin-bottom:0.9rem}
.lp-ft-col ul{list-style:none;display:flex;flex-direction:column;gap:0.45rem}
.lp-ft-col a{font-size:0.83rem;color:var(--lp-g2);transition:color 0.15s}
.lp-ft-col a:hover{color:var(--lp-white)}
.lp-ft-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding-top:2rem;border-top:1px solid rgba(255,255,255,0.04);font-size:0.75rem;color:var(--lp-g3)}

/* ── SCROLL ANIM ── */
.lp-wrap .fade{opacity:0;transform:translateY(20px);transition:opacity 0.55s ease,transform 0.55s ease}
.lp-wrap .fade.in{opacity:1;transform:translateY(0)}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .lp-feat-grid,.lp-testi-grid,.lp-steps-grid,.lp-profiles-grid{grid-template-columns:1fr}
  .lp-tools-grid{grid-template-columns:1fr 1fr}
  .lp-patri-2col{grid-template-columns:1fr}
  .lp-stats-grid{grid-template-columns:1fr 1fr}
  .lp-ft-grid{grid-template-columns:1fr 1fr}
  .lp-nav-links{display:none}
  .lp-mock-body{grid-template-columns:1fr}
  .lp-rmap-row{grid-template-columns:1fr;gap:0.75rem}
  .lp-sticky{display:none}
}
`

// ─── Counter helper ────────────────────────────────────────────────────────

function animCounter(el: HTMLElement, to: number) {
  const steps = 50, inc = to / steps
  let cur = 0
  const t = setInterval(() => {
    cur = Math.min(cur + inc, to)
    el.textContent = Math.round(cur).toLocaleString('fr-FR')
    if (cur >= to) clearInterval(t)
  }, 1600 / steps)
}

// ─── Component ────────────────────────────────────────────────────────────

export function LandingClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        e.target.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
          const to = +(el.dataset.count ?? 0)
          if (to > 0) { animCounter(el, to); delete el.dataset.count }
        })
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('.lp-wrap .fade').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lp-wrap">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <Link href="/" className="lp-logo">
              <span className="lp-logo-dot" /> PatrImo
            </Link>
            <ul className="lp-nav-links">
              {[['#simulateurs','Simulateurs'],['#patrimoine','Patrimoine'],['#fonctionnalites','Fonctionnalités'],['#roadmap','Roadmap'],['#faq','FAQ']].map(([h,l]) => (
                <li key={h}><a href={h}>{l}</a></li>
              ))}
            </ul>
            <div className="lp-nav-r">
              <Link href="/login" className="lp-btn lp-ghost">Se connecter</Link>
              <Link href="/login" className="lp-btn lp-primary">Commencer →</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-glow lp-glow-l" />
          <div className="lp-glow lp-glow-r" />
          <div className="lp-container lp-hero-content">
            <div style={{ marginBottom:'1.75rem' }}>
              <span className="lp-pill"><span className="lp-live" />18 simulateurs · Données 2026 · 100 % gratuit</span>
            </div>
            <h1>Le couteau suisse<br />de <em>l&apos;investisseur français.</em></h1>
            <p className="lp-hero-sub">
              Simulez, analysez et suivez l&apos;intégralité de votre patrimoine depuis une seule plateforme. Gratuit, sans données bancaires.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/login" className="lp-btn lp-primary lp-lg">Commencer gratuitement →</Link>
              <a href="#simulateurs" className="lp-btn lp-ghost lp-lg">Voir les simulateurs</a>
            </div>
            <div className="lp-hero-trust">
              {['3 847 utilisateurs actifs','Zéro donnée bancaire','Sans pub · RGPD · Hébergé en Europe','Données temps réel Finnhub & CoinGecko'].map(t => (
                <div key={t} className="lp-trust-i">
                  <svg viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7z" /></svg>
                  {t}
                </div>
              ))}
            </div>

            {/* Dashboard mockup */}
            <div className="lp-mock">
              <div className="lp-mock-bar">
                <div className="lp-mock-dots">
                  <div className="lp-mock-dot" style={{ background:'#ff5f57' }} />
                  <div className="lp-mock-dot" style={{ background:'#febc2e' }} />
                  <div className="lp-mock-dot" style={{ background:'#28c840' }} />
                </div>
                <div className="lp-mock-url">finance.digitalstack.cloud/patrimoine</div>
              </div>
              <div className="lp-mock-body">
                <div className="lp-mock-panel">
                  <div className="lp-panel-lbl">Patrimoine net</div>
                  <div className="lp-mock-num">412 500 €</div>
                  <div className="lp-mock-delta pos">↑ +8.4% YTD</div>
                  <div className="lp-mock-barchart">
                    {[30,45,55,40,65,72,85,78,90].map((h,i) => (
                      <div key={i} className="b" style={{ height:`${h}%`, background: i===8 ? '#4b78ff' : `rgba(75,120,255,${0.3+i*0.04})` }} />
                    ))}
                  </div>
                </div>
                <div className="lp-mock-panel">
                  <div className="lp-panel-lbl">Portefeuille actions</div>
                  <div className="lp-mock-num">115 500 €</div>
                  <div className="lp-mock-delta pos">↑ +21.2%</div>
                  <table className="lp-mock-tbl"><tbody>
                    <tr><td>MSCI World ETF</td><td style={{ color:'#22c55e' }}>+24.1%</td></tr>
                    <tr><td>S&amp;P 500 ETF</td><td style={{ color:'#22c55e' }}>+19.8%</td></tr>
                    <tr><td>Bitcoin</td><td style={{ color:'#ef4444' }}>-4.2%</td></tr>
                    <tr><td>Livret A</td><td style={{ color:'#7b88aa' }}>+3.0%</td></tr>
                  </tbody></table>
                </div>
                <div className="lp-mock-panel">
                  <div className="lp-panel-lbl">Score patrimonial</div>
                  <div className="lp-score-ring">74</div>
                  <div style={{ fontSize:'0.72rem', color:'#7b88aa', textAlign:'center', marginTop:'0.25rem' }}>sur 100 · 6 piliers</div>
                  <table className="lp-mock-tbl" style={{ marginTop:'0.75rem' }}><tbody>
                    <tr><td>Épargne</td><td style={{ color:'#22c55e' }}>85/100</td></tr>
                    <tr><td>Dettes</td><td style={{ color:'#f59e0b' }}>62/100</td></tr>
                    <tr><td>Diversification</td><td style={{ color:'#22c55e' }}>78/100</td></tr>
                  </tbody></table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGOS ── */}
        <div className="lp-logos">
          <div className="lp-container">
            <div className="lp-logos-inner">
              <span className="lp-logos-lbl">Données en temps réel via</span>
              <div className="lp-logos-list">
                {['Finnhub','CoinGecko','Banque de France','OAT 10Y','BCE','CAC 40','MSCI World'].map(l => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <section className="lp-stats-wrap">
          <div className="lp-container">
            <div className="lp-stats-grid fade">
              <div className="lp-stat-cell">
                <div className="lp-stat-n" data-count="3847">0</div>
                <div className="lp-stat-l">Utilisateurs actifs</div>
              </div>
              <div className="lp-stat-cell">
                <div className="lp-stat-n"><span>18</span></div>
                <div className="lp-stat-l">Simulateurs disponibles</div>
              </div>
              <div className="lp-stat-cell">
                <div className="lp-stat-n"><span>15</span></div>
                <div className="lp-stat-l">Pages de gestion patrimoine</div>
              </div>
              <div className="lp-stat-cell">
                <div className="lp-stat-n"><span>0</span></div>
                <div className="lp-stat-l">Données bancaires requises</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 PILLARS ── */}
        <section id="fonctionnalites" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Plateforme</div>
              <h2>Quatre piliers pour<br />maîtriser votre patrimoine</h2>
              <p>Des outils complets pour simuler, analyser, suivre et sécuriser votre situation financière.</p>
            </div>
            <div className="lp-feat-grid fade">
              {[
                { ic:'⚡', t:'Simulateurs', p:'18 calculateurs couvrant intérêts composés, FI/RE, crédit immobilier, fiscalité, retraite et plus. Résultats instantanés, modèles fiscaux France 2026.' },
                { ic:'📊', t:'Insights',    p:'Graphiques interactifs, benchmarks CAC 40 / MSCI World et visualisations claires pour révéler la croissance, la répartition et les tendances de votre capital.' },
                { ic:'🏛', t:'Patrimoine',  p:'Suivi complet — immobilier, actions, livrets, crypto — centralisé en temps réel via Finnhub & CoinGecko. Score 0–100 sur 6 piliers patrimoniaux.' },
                { ic:'🔒', t:'Sécurité',   p:"Chiffrement AES-256, hébergé en Europe, conformité RGPD. Aucune donnée bancaire, aucun accès à vos comptes, aucune revente. Jamais." },
              ].map(f => (
                <div key={f.t} className="lp-feat-card">
                  <div className="lp-feat-icon">{f.ic}</div>
                  <h3>{f.t}</h3>
                  <p>{f.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="lp-ticker-wrap">
          <div className="lp-ticker">
            {[...TOOLS, ...TOOLS].map((t, i) => (
              <span key={i} className="lp-tkr-item"><span className="lp-tkr-dot" />{t.name}</span>
            ))}
          </div>
        </div>

        {/* ── TOOLS ── */}
        <section id="simulateurs" className="lp-section" style={{ background:'var(--lp-bg1)' }}>
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">18 simulateurs</div>
              <h2>Tous les outils pour<br />maîtriser vos finances</h2>
              <p>Gratuits, résultats instantanés, fiscalité française 2026.</p>
            </div>
            <div className="lp-tools-grid fade">
              {TOOLS.map(t => (
                <Link key={t.href} href={t.href} className="lp-tool-card">
                  <div className="lp-tool-head">
                    <span className={`lp-t-tag ${t.tag}`}>{t.cat}</span>
                    <span className="lp-t-arrow">↗</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.desc}</p>
                </Link>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:'2rem' }}>
              <Link href="/tools" className="lp-btn lp-outline lp-lg">Voir tous les simulateurs →</Link>
            </div>
          </div>
        </section>

        {/* ── PATRIMOINE ── */}
        <section id="patrimoine" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Gestion & Suivi</div>
              <h2>Votre patrimoine<br />centralisé en temps réel</h2>
              <p>15 pages de gestion incluses dans votre compte PatrImo.</p>
            </div>
            <div className="lp-patri-2col fade">
              {([{ items:PL, title:'Patrimoine' },{ items:PR, title:'Suivi · Analyse · Fiscal' }] as const).map(col => (
                <div key={col.title} className="lp-pcol">
                  <div className="lp-pcol-hd">{col.title}</div>
                  {col.items.map(item => (
                    <Link key={item.nm} href={item.href} className="lp-prow">
                      <div className="lp-prow-l">
                        <div className="lp-prow-ic">{item.ic}</div>
                        <div>
                          <div className="lp-prow-nm">{item.nm}</div>
                          <div className="lp-prow-sb">{item.sb}</div>
                        </div>
                      </div>
                      <span className="lp-prow-arr">›</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:'2rem' }}>
              <Link href="/dashboard/patrimoine" className="lp-btn lp-outline lp-lg">Accéder à toutes les pages →</Link>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section" style={{ background:'var(--lp-bg1)' }}>
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Ils l&apos;utilisent</div>
              <h2>Ce qu&apos;ils en disent</h2>
            </div>
            <div className="lp-testi-grid fade">
              {TESTIS.map((t, i) => (
                <div key={i} className="lp-testi">
                  <div className="lp-testi-stars">★★★★★</div>
                  <p className="lp-testi-q">{t.q}</p>
                  <div className="lp-testi-auth">
                    <div className="lp-testi-av" style={{ background:t.bg }}>{t.av}</div>
                    <div>
                      <div className="lp-testi-nm">{t.nm}</div>
                      <div className="lp-testi-rl">{t.rl}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade" style={{ textAlign:'center' }}>
              <div className="lp-s-label" style={{ justifyContent:'center' }}>En 3 étapes</div>
              <h2>Comment ça marche ?</h2>
            </div>
            <div className="lp-steps-grid fade">
              {[
                { n:'01', ic:'✉️', t:'Créez un compte',         p:"En 30 secondes avec votre email ou Google. Aucune carte bancaire, aucune donnée bancaire requise." },
                { n:'02', ic:'🎚', t:'Lancez une simulation',   p:"Choisissez parmi 18 simulateurs. Renseignez vos paramètres — résultats instantanés à chaque frappe." },
                { n:'03', ic:'📈', t:'Visualisez votre avenir', p:"Graphiques interactifs, synthèses détaillées et scénarios comparatifs pour décider plus intelligemment." },
              ].map(s => (
                <div key={s.n} className="lp-step-card">
                  <span className="lp-step-n">{s.n}</span>
                  <div className="lp-step-ic">{s.ic}</div>
                  <h3>{s.t}</h3>
                  <p>{s.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOR WHO ── */}
        <section className="lp-section" style={{ background:'var(--lp-bg1)' }}>
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Pour qui</div>
              <h2>PatrImo s&apos;adapte<br />à votre profil</h2>
            </div>
            <div className="lp-profiles-grid fade">
              {[
                { em:'🌱', role:'Jeune actif 25–35 ans',  t:"Commencer à investir",    p:"Visualisez la puissance des intérêts composés et planifiez votre indépendance financière.", tags:['Intérêts composés','DCA','FI/RE'] },
                { em:'🏠', role:'Propriétaire',            t:"Optimiser l'immobilier",  p:'Calculez la rentabilité locative, le crédit et comparez achat vs location.',              tags:['Prêt immo','Acheter vs Louer','Locatif'] },
                { em:'📈', role:'Investisseur',            t:"Optimiser la fiscalité",  p:'Suivez votre portefeuille et choisissez la meilleure enveloppe fiscale.',                tags:['PEA vs CTO vs AV','Flat Tax','Portfolio'] },
                { em:'🔥', role:'Futur retraité',          t:"Planifier la retraite",   p:'Calculez votre score patrimonial et simulez votre succession.',                           tags:['FI/RE','Retraite','Score 0-100'] },
              ].map(prof => (
                <div key={prof.role} className="lp-profile">
                  <div className="lp-p-em">{prof.em}</div>
                  <div className="lp-p-role">{prof.role}</div>
                  <h3>{prof.t}</h3>
                  <p>{prof.p}</p>
                  <div className="lp-p-tags">{prof.tags.map(tag => <span key={tag} className="lp-p-tag">{tag}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <section id="roadmap" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Évolution continue</div>
              <h2>Ce qui arrive sur PatrImo</h2>
              <p>PatrImo évolue en continu. Fonctionnalités disponibles et à venir.</p>
            </div>
            <div className="lp-rmap fade">
              {[
                { id:'done', period:'Q1–Q2 2026', label:'✓ Disponible', cls:'lp-s-done', items:RMAP_DONE, ic:'done', sym:'✓' },
                { id:'wip',  period:'Q3 2026',    label:'⚡ En cours',  cls:'lp-s-wip',  items:RMAP_WIP,  ic:'wip',  sym:'⚡' },
                { id:'soon', period:'Q4 2026–2027',label:'◷ À venir',   cls:'lp-s-soon', items:RMAP_SOON, ic:'soon', sym:'◷' },
              ].map(row => (
                <div key={row.id} className="lp-rmap-row">
                  <div className="lp-rmap-l">
                    <strong>{row.period}</strong>
                    <span className={row.cls}>{row.label}</span>
                  </div>
                  <div className="lp-rmap-items">
                    {row.items.map(item => (
                      <div key={item} className={`lp-ri ${row.id}`}>
                        <span className={`lp-ri-ic ${row.ic}`}>{row.sym}</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARE ── */}
        <section className="lp-section" style={{ background:'var(--lp-bg1)' }}>
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Comparatif</div>
              <h2>PatrImo vs les alternatives</h2>
            </div>
            <div className="lp-cmp-wrap fade">
              <table className="lp-cmp">
                <thead>
                  <tr>
                    <th>Fonctionnalité</th>
                    <th className="hl">★ PatrImo</th>
                    <th>Simulateur banque</th>
                    <th>Google Sheets</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td>{row[0]}</td>
                      {row.slice(1).map((v, j) => {
                        const c = v==='✓' ? 'lp-tick' : v==='✗' ? 'lp-cross' : 'lp-part'
                        const l = v==='✓' ? '✓' : v==='✗' ? '✗' : 'partiel'
                        return <td key={j}><span className={c}>{l}</span></td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade" style={{ textAlign:'center' }}>
              <div className="lp-s-label" style={{ justifyContent:'center' }}>FAQ</div>
              <h2>Questions fréquentes</h2>
            </div>
            <div className="lp-faq fade">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="lp-fi">
                  <button className="lp-fq" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {item.q}
                    <span className={`lp-fi-ic${openFaq === i ? ' open' : ''}`}>+</span>
                  </button>
                  <div className={`lp-fa${openFaq === i ? ' open' : ''}`}>
                    <p>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="lp-cta-final">
          <div className="lp-container">
            <div className="fade">
              <span className="lp-pill" style={{ marginBottom:'1.5rem', display:'inline-flex' }}>
                18 simulateurs · 100 % gratuit · sans carte bancaire
              </span>
              <h2>Prenez le contrôle total<br />de votre vie financière.</h2>
              <p>Impôts, FIRE, patrimoine. Sans carte bancaire, sans engagement.</p>
              <div className="lp-cta-acts">
                <Link href="/login" className="lp-btn lp-primary lp-lg">Créer un compte gratuit →</Link>
                <Link href="/login" className="lp-btn lp-ghost lp-lg">Se connecter</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-ft-grid">
              <div className="lp-ft-brand">
                <Link href="/" className="lp-logo"><span className="lp-logo-dot" /> PatrImo</Link>
                <p>Outils de finance personnelle pour investisseurs français. Simulateurs, patrimoine, fiscalité.</p>
              </div>
              <div className="lp-ft-col">
                <h5>Produit</h5>
                <ul>
                  <li><Link href="/tools">Simulateurs</Link></li>
                  <li><Link href="/dashboard/patrimoine">Patrimoine</Link></li>
                  <li><a href="#roadmap">Roadmap</a></li>
                  <li><a href="#fonctionnalites">Fonctionnalités</a></li>
                  <li><Link href="/login">Créer un compte</Link></li>
                </ul>
              </div>
              <div className="lp-ft-col">
                <h5>Ressources</h5>
                <ul>
                  <li><a href="#fonctionnalites">Comment ça marche</a></li>
                  <li><a href="#comparatif">Comparatif</a></li>
                  <li><a href="#faq">FAQ</a></li>
                </ul>
              </div>
              <div className="lp-ft-col">
                <h5>Légal</h5>
                <ul>
                  <li><Link href="/mentions-legales">Mentions légales</Link></li>
                  <li><Link href="/politique-confidentialite">Confidentialité</Link></li>
                  <li><Link href="/cgu">CGU</Link></li>
                  <li><a href="mailto:contact@digitalstack.cloud">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="lp-ft-bottom">
              <span>© 2026 PatrImo · Tous droits réservés</span>
              <span>Calculs fournis à titre indicatif. Consultez un conseiller agréé pour vos décisions d&apos;investissement.</span>
            </div>
          </div>
        </footer>

        {/* ── STICKY BAR ── */}
        <div className="lp-sticky">
          <span>18 simulateurs · 100 % gratuit</span>
          <Link href="/login" className="lp-btn lp-primary" style={{ borderRadius:'99px' }}>Commencer →</Link>
        </div>

      </div>
    </>
  )
}
