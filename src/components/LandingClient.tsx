'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeroShutterText } from '@/components/ui/hero-shutter-text'
import { PatrimoHeader } from '@/components/ui/patrimo-header'

// ─── Data ─────────────────────────────────────────────────────────────────

const TOOLS = [
  { tag:'te', cat:'Épargne',        name:'Intérêts Composés',      desc:"Visualisez l'effet boule de neige de votre épargne.",            href:'/tools/interets-composes' },
  { tag:'te', cat:'Épargne',        name:'FI/RE',                  desc:'Calculez votre objectif FIRE et date de liberté financière.',     href:'/tools/fire' },
  { tag:'ti', cat:'Immobilier',     name:'Prêt Immobilier',        desc:"Mensualités, TAEG, tableau d'amortissement complet.",            href:'/tools/pret-immobilier' },
  { tag:'te', cat:'Épargne',        name:'DCA',                    desc:"Simulez un plan d'investissement régulier vs lump sum.",         href:'/tools/dca' },
  { tag:'ti', cat:'Immobilier',     name:'Acheter vs Louer',       desc:'Comparez le Patrimoine généré selon votre stratégie.',           href:'/tools/acheter-ou-louer' },
  { tag:'ti', cat:'Immobilier',     name:'Rentabilité Locative',   desc:'Cashflow, rendement net et fiscalité locative.',                 href:'/tools/rentabilite-locative' },
  { tag:'tf', cat:'Fiscal',         name:'Impôts IR',              desc:"Calcul IR, TMI, frais réels vs abattement 10%.",                href:'/tools/impots-ir' },
  { tag:'tf', cat:'Fiscal',         name:'Simulateur Retraite',    desc:'Pension estimée et optimisation de votre PER 2026.',            href:'/tools/retraite' },
  { tag:'tb', cat:'Budget',         name:'Budget 50/30/20',        desc:"Répartition de vos dépenses selon la règle d'or.",              href:'/tools/budget-50-30-20' },
  { tag:'tf', cat:'Fiscal',         name:'Flat Tax vs Barème',     desc:'Comparez le PFU 30% au barème progressif.',                     href:'/tools/flat-tax-bareme' },
  { tag:'tv', cat:'Investissement', name:'PEA vs CTO vs AV',       desc:'Fiscalité nette de chaque enveloppe sur la durée.',             href:'/tools/pea-cto-av' },
  { tag:'tb', cat:'Budget',         name:"Taux d'épargne",         desc:"Calculez et optimisez votre taux d'épargne mensuel.",           href:'/tools/taux-epargne' },
  { tag:'tv', cat:'Investissement', name:'Score Patrimonial',      desc:'Score global sur 6 piliers avec recommandations.',              href:'/tools/score-Patrimonial' },
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

const RMAP_DONE = ['Connexion Google OAuth','32 simulateurs','Historique simulations','Mode sombre/clair','Tableau Patrimonial','Portefeuille temps réel','Score Patrimonial','Flat Tax vs Barème','PEA/CTO/AV','Partage simulation','Glossaire contextuel','Taux en direct',"Carnet d'ordres",'Timeline Patrimoine','Revenus passifs','Connexion FIRE ↔ Patrimoine',"Épargne d'urgence","Crédit conso","Succession & Donations",'Catégories Patrimoniales']
const RMAP_WIP  = ['Export PDF','Livrets réglementés','Impact des frais',"Inflation & pouvoir d'achat",'Remboursement dettes','Plus-value immobilière','SCPI','Déficit foncier','Viager','Auto-entrepreneur','IFI','Stock-options / BSPCE']
const RMAP_SOON = ['Comparateur de scénarios','Calculatrice rapide','Mode reverse','Alertes paramétrables','Rapport mensuel email','Mode présentation','Articles & guides','Application mobile','Intégrations bancaires']

const FAQ_ITEMS = [
  { q:'Est-ce vraiment gratuit, pour toujours ?',      a:'Oui. Les 18 simulateurs et les fonctionnalités de base sont et resteront gratuits. Patrimo ne vit ni de la pub, ni de la revente de données.' },
  { q:'Faut-il connecter mon compte bancaire ?',       a:"Non. Patrimo ne demande jamais vos coordonnées bancaires, RIB ou accès à vos comptes. Vous saisissez uniquement les données que vous souhaitez renseigner." },
  { q:'Où sont stockées mes données ?',                a:'Vos données sont chiffrées (AES-256) et stockées sur des serveurs hébergés en Europe. Elles ne sont jamais partagées ni vendues à des tiers.' },
  { q:'Les calculs sont-ils fiables ?',                a:'Les modèles sont validés sur plus de 40 scénarios réels, avec une fiscalité française 2026 à jour (TMI, PFU, abattements, etc.). Ils sont fournis à titre indicatif.' },
  { q:"Patrimo est-il adapté aux débutants ?",         a:"Absolument. Chaque simulateur est conçu pour être compris en moins de 30 secondes, avec un glossaire contextuel intégré." },
  { q:'Puis-je utiliser Patrimo sur mobile ?',         a:"Oui. L'interface est entièrement responsive et optimisée pour mobile, sans appli dédiée à installer." },
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
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.lp-wrap*,.lp-wrap *::before,.lp-wrap *::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --lp-bg:#05080f;--lp-bg1:#080d1a;--lp-bg2:#0c1120;
  --lp-blue:#4b78ff;--lp-blue2:#3360e6;--lp-blue-l:#7b9fff;
  --lp-gold:#f59e0b;--lp-gold-l:#fbbf24;
  --lp-purple:#8b5cf6;--lp-purple-l:#c4b5fd;
  --lp-green:#22c55e;--lp-red:#ef4444;
  --lp-white:#f8fafc;--lp-g1:#cbd5e1;--lp-g2:#94a3b8;--lp-g3:#475569;
  --lp-glass:rgba(255,255,255,0.04);--lp-glass2:rgba(255,255,255,0.07);--lp-glass3:rgba(255,255,255,0.11);
  --lp-gb:rgba(255,255,255,0.08);
  --lp-r:10px;--lp-r2:16px;--lp-r3:24px;
}

.lp-wrap{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--lp-bg);color:var(--lp-white);line-height:1.6;overflow-x:hidden;min-height:100vh}
.lp-wrap h1,.lp-wrap h2,.lp-wrap h3,.lp-wrap h4{line-height:1.12;letter-spacing:-0.03em;color:var(--lp-white)}
.lp-wrap h1{font-size:clamp(2.8rem,5.5vw,5rem);font-weight:800}
.lp-wrap h2{font-size:clamp(2rem,3.5vw,3rem);font-weight:700}
.lp-wrap h3{font-size:1.1rem;font-weight:600}
.lp-wrap p{color:var(--lp-g1)}
.lp-wrap a{text-decoration:none}

.lp-container{max-width:1200px;margin:0 auto;padding:0 2rem}
.lp-section{padding:7rem 0}

/* ── ORB BACKGROUND ── */
.lp-orbs{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.lp-orb{position:absolute;border-radius:50%;filter:blur(120px);animation:lp-drift 22s ease-in-out infinite alternate}
.lp-orb1{width:700px;height:700px;top:-200px;left:-150px;background:radial-gradient(circle,rgba(75,120,255,0.09),transparent 65%)}
.lp-orb2{width:600px;height:600px;bottom:-150px;right:-100px;background:radial-gradient(circle,rgba(139,92,246,0.07),transparent 65%);animation-delay:-11s}
.lp-orb3{width:400px;height:400px;top:45%;left:55%;background:radial-gradient(circle,rgba(245,158,11,0.04),transparent 65%);animation-delay:-6s}
@keyframes lp-drift{0%{transform:translate(0,0)}100%{transform:translate(35px,25px)}}

/* ── NAV ── */
.lp-nav{position:sticky;top:0;z-index:100;background:rgba(5,8,15,0.88);backdrop-filter:blur(28px) saturate(200%);-webkit-backdrop-filter:blur(28px) saturate(200%);border-bottom:1px solid var(--lp-gb)}
.lp-nav-inner{max-width:1200px;margin:0 auto;padding:0 2rem;height:62px;display:flex;align-items:center;justify-content:space-between;gap:1.5rem}
.lp-logo{font-weight:800;font-size:1.3rem;color:var(--lp-white);letter-spacing:-0.04em;display:flex;align-items:center;gap:0.45rem}
.lp-logo-mark{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--lp-blue),var(--lp-purple));display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 16px rgba(75,120,255,0.4)}
.lp-nav-links{display:flex;gap:0;list-style:none}
.lp-nav-links a{font-size:0.85rem;font-weight:500;color:var(--lp-g2);padding:0.45rem 0.9rem;border-radius:8px;transition:color 0.15s,background 0.15s}
.lp-nav-links a:hover{color:var(--lp-white);background:var(--lp-glass)}
.lp-nav-r{display:flex;gap:0.6rem;align-items:center}

/* ── BUTTONS ── */
.lp-btn{display:inline-flex;align-items:center;gap:0.4rem;font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;font-size:0.875rem;padding:0.6rem 1.35rem;border-radius:var(--lp-r);cursor:pointer;border:1px solid transparent;transition:all 0.2s;white-space:nowrap;text-decoration:none}
.lp-ghost{color:var(--lp-g1);border-color:var(--lp-gb);background:var(--lp-glass)}
.lp-ghost:hover{color:var(--lp-white);background:var(--lp-glass2);border-color:var(--lp-glass3)}
.lp-primary{background:linear-gradient(135deg,var(--lp-blue),var(--lp-blue2));color:#fff;box-shadow:0 4px 18px rgba(75,120,255,0.28)}
.lp-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(75,120,255,0.42)}
.lp-gold-btn{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;box-shadow:0 4px 18px rgba(245,158,11,0.28)}
.lp-gold-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(245,158,11,0.42)}
.lp-outline{color:var(--lp-blue-l);border-color:rgba(75,120,255,0.3);background:rgba(75,120,255,0.06)}
.lp-outline:hover{background:rgba(75,120,255,0.1);border-color:var(--lp-blue);transform:translateY(-1px)}
.lp-lg{padding:0.85rem 2rem;font-size:0.95rem;border-radius:var(--lp-r2)}

/* ── PILLS ── */
.lp-pill{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(75,120,255,0.1);border:1px solid rgba(75,120,255,0.22);color:var(--lp-blue-l);border-radius:99px;padding:0.3rem 0.95rem;font-size:0.78rem;font-weight:600;letter-spacing:0.02em}
.lp-live{width:6px;height:6px;border-radius:50%;background:var(--lp-green);animation:lp-pulse 2s infinite;display:inline-block}
@keyframes lp-pulse{0%,100%{opacity:1}50%{opacity:0.35}}

/* ── SECTION LABEL ── */
.lp-s-label{display:inline-flex;align-items:center;gap:0.45rem;font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--lp-blue-l);margin-bottom:0.9rem;padding:0.28rem 0.85rem;border-radius:99px;background:rgba(75,120,255,0.09);border:1px solid rgba(75,120,255,0.2)}
.lp-s-label::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--lp-blue);flex-shrink:0}
.lp-s-head{margin-bottom:3.5rem}
.lp-s-head h2{margin-bottom:0.75rem}
.lp-s-head p{max-width:500px;font-size:1.05rem;line-height:1.7;color:var(--lp-g2)}

/* ── GRADIENT TEXT ── */
.lp-grad{background:linear-gradient(135deg,var(--lp-white) 0%,var(--lp-blue-l) 55%,var(--lp-purple-l) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* ── HERO ── */
.lp-hero{position:relative;z-index:1;min-height:calc(100vh - 62px);display:flex;align-items:center;padding:5rem 0;overflow:hidden}
.lp-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 90% 60% at 30% -10%,rgba(75,120,255,0.10) 0%,transparent 60%);pointer-events:none}
.lp-hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:160px;background:linear-gradient(transparent,var(--lp-bg));pointer-events:none;z-index:2}
.lp-hero-inner{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr 0.95fr;gap:5rem;align-items:center;width:100%}
.lp-hero-badge{margin-bottom:1.5rem}
.lp-hero h1{margin-bottom:1.5rem;line-height:1.06}
.lp-hero-sub{font-size:1.12rem;color:var(--lp-g1);max-width:510px;margin-bottom:2.5rem;line-height:1.75}
.lp-hero-ctas{display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:3rem}
.lp-hero-trust{display:flex;gap:1.75rem;flex-wrap:wrap;padding-top:2rem;border-top:1px solid var(--lp-gb)}
.lp-trust-i{display:flex;align-items:center;gap:0.45rem;font-size:0.8rem;color:var(--lp-g2)}
.lp-trust-i svg{width:13px;height:13px;fill:var(--lp-green);flex-shrink:0}

/* ── MOCKUP ── */
.lp-mock-wrap{position:relative}
.lp-mock-glow{position:absolute;inset:-30px;border-radius:32px;background:linear-gradient(135deg,rgba(75,120,255,0.10),rgba(139,92,246,0.06));filter:blur(40px);z-index:-1}
.lp-mock{background:var(--lp-bg1);border:1px solid var(--lp-gb);border-radius:20px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04)}
.lp-mock-bar{background:var(--lp-bg2);padding:0.7rem 1rem;display:flex;align-items:center;gap:0.5rem;border-bottom:1px solid var(--lp-gb)}
.lp-mock-dots{display:flex;gap:5px}
.lp-mock-dot{width:9px;height:9px;border-radius:50%}
.lp-mock-url{flex:1;background:var(--lp-glass);border:1px solid var(--lp-gb);border-radius:5px;padding:0.22rem 0.7rem;font-size:0.73rem;color:var(--lp-g3);max-width:300px;margin:0 auto;text-align:center}
.lp-mock-body{padding:1.1rem;display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--lp-gb);min-height:220px}
.lp-mock-panel{background:var(--lp-bg1);padding:0.9rem}
.lp-panel-lbl{font-size:0.65rem;color:var(--lp-g2);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.4rem;font-weight:600}
.lp-mock-num{font-size:1.35rem;font-weight:800;color:var(--lp-white);letter-spacing:-0.03em}
.lp-mock-delta{font-size:0.75rem;font-weight:600;margin-top:0.15rem}
.lp-mock-delta.pos{color:var(--lp-green)}
.lp-mock-barchart{margin-top:0.6rem;display:flex;align-items:flex-end;gap:3px;height:48px}
.lp-mock-barchart .b{border-radius:2px 2px 0 0;flex:1}
.lp-mock-tbl{width:100%;border-collapse:collapse;margin-top:0.5rem}
.lp-mock-tbl td{font-size:0.7rem;padding:0.28rem 0;border-bottom:1px solid var(--lp-gb);color:var(--lp-g1)}
.lp-mock-tbl td:last-child{text-align:right}
.lp-score-ring{width:56px;height:56px;border-radius:50%;border:2px solid var(--lp-blue);display:flex;align-items:center;justify-content:center;font-size:0.95rem;font-weight:700;color:var(--lp-white);margin:0.4rem auto;box-shadow:0 0 18px rgba(75,120,255,0.25)}

/* ── LOGOS ── */
.lp-logos{padding:2.25rem 0;border-top:1px solid var(--lp-gb);border-bottom:1px solid var(--lp-gb);background:rgba(8,13,26,0.6);position:relative;z-index:1}
.lp-logos-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem}
.lp-logos-lbl{font-size:0.7rem;color:var(--lp-g3);white-space:nowrap;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}
.lp-logos-list{display:flex;gap:2.5rem;flex-wrap:wrap;align-items:center}
.lp-logos-list span{font-size:0.82rem;font-weight:700;color:var(--lp-g3);letter-spacing:0.02em}

/* ── STATS ── */
.lp-stats-section{position:relative;z-index:1;padding:5rem 0}
.lp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border:1px solid var(--lp-gb);border-radius:var(--lp-r3);overflow:hidden;background:var(--lp-gb)}
.lp-stat-cell{background:var(--lp-glass);backdrop-filter:blur(20px);padding:2.25rem 1.75rem;text-align:center;transition:background 0.2s}
.lp-stat-cell:hover{background:var(--lp-glass2)}
.lp-stat-n{font-size:2.75rem;font-weight:800;color:var(--lp-white);letter-spacing:-0.05em;line-height:1}
.lp-stat-n span{color:var(--lp-blue)}
.lp-stat-l{font-size:0.8rem;color:var(--lp-g2);margin-top:0.4rem}

/* ── PILLAR CARDS (flip) ── */
.lp-pcards-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.lp-pcard{position:relative;border-radius:24px;cursor:pointer;height:460px;perspective:1200px}
.lp-pcard-flip{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .72s cubic-bezier(.4,0,.2,1);border-radius:24px}
.lp-pcard:hover .lp-pcard-flip{transform:rotateY(180deg)}
.lp-pcard-front,.lp-pcard-back{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:24px;overflow:hidden}
/* ── FRONT face ── */
.lp-pcard-front{display:flex;flex-direction:column;justify-content:space-between;padding:32px 36px 28px}
.lp-pc1 .lp-pcard-front{background:linear-gradient(155deg,rgba(13,17,30,.97) 0%,rgba(16,26,58,.93) 100%);border:1px solid rgba(75,120,255,.2)}
.lp-pc2 .lp-pcard-front{background:linear-gradient(155deg,rgba(13,17,30,.97) 0%,rgba(10,36,32,.93) 100%);border:1px solid rgba(20,200,160,.18)}
.lp-pc3 .lp-pcard-front{background:linear-gradient(155deg,rgba(13,17,30,.97) 0%,rgba(32,14,52,.93) 100%);border:1px solid rgba(160,80,255,.18)}
.lp-pc4 .lp-pcard-front{background:linear-gradient(155deg,rgba(13,17,30,.97) 0%,rgba(10,36,18,.93) 100%);border:1px solid rgba(34,197,94,.16)}
.lp-pf-top{display:flex;align-items:center;justify-content:space-between}
.lp-pf-num{font-size:11px;font-weight:700;letter-spacing:.12em;padding:3px 12px;border-radius:99px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.28);font-family:monospace}
.lp-pf-hint{font-size:9.5px;color:rgba(255,255,255,.18);letter-spacing:.10em;text-transform:uppercase}
.lp-pf-center{display:flex;flex-direction:column;align-items:center;text-align:center;gap:18px;flex:1;justify-content:center;padding:8px 0}
.lp-pf-icon{width:84px;height:84px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-size:34px;line-height:1}
.lp-pc1 .lp-pf-icon{background:rgba(75,120,255,.16);border:1px solid rgba(75,120,255,.28);box-shadow:0 0 48px rgba(75,120,255,.16)}
.lp-pc2 .lp-pf-icon{background:rgba(20,200,160,.13);border:1px solid rgba(20,200,160,.24);box-shadow:0 0 48px rgba(20,200,160,.12)}
.lp-pc3 .lp-pf-icon{background:rgba(160,80,255,.13);border:1px solid rgba(160,80,255,.24);box-shadow:0 0 48px rgba(160,80,255,.12)}
.lp-pc4 .lp-pf-icon{background:rgba(34,197,94,.11);border:1px solid rgba(34,197,94,.20);box-shadow:0 0 48px rgba(34,197,94,.10)}
.lp-pf-label{display:flex;flex-direction:column;gap:6px}
.lp-pf-title{font-size:2.1rem;font-weight:800;letter-spacing:-.04em;color:var(--lp-white);line-height:1}
.lp-pc1 .lp-pf-title em{color:#6b9fff;font-style:normal}
.lp-pc2 .lp-pf-title em{color:#14c8a0;font-style:normal}
.lp-pc3 .lp-pf-title em{color:#b06aff;font-style:normal}
.lp-pc4 .lp-pf-title em{color:#22c55e;font-style:normal}
.lp-pf-sub{font-size:.8rem;color:#5a6a88;letter-spacing:.02em}
.lp-pf-kpi{font-size:2.6rem;font-weight:900;letter-spacing:-.06em;font-family:monospace;line-height:1;margin-top:4px}
.lp-pc1 .lp-pf-kpi{color:#4b78ff}
.lp-pc2 .lp-pf-kpi{color:#14c8a0}
.lp-pc3 .lp-pf-kpi{color:#b06aff}
.lp-pc4 .lp-pf-kpi{color:#22c55e}
.lp-pf-bottom{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;color:rgba(255,255,255,.2);letter-spacing:.08em;text-transform:uppercase}
/* ── BACK face ── */
.lp-pcard-back{transform:rotateY(180deg)}
.lp-pcard-inner{height:100%;box-sizing:border-box;border-radius:24px;background:rgba(13,17,30,0.75);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);border:1px solid rgba(255,255,255,0.07);padding:28px 28px 22px;position:relative;overflow:hidden;display:flex;flex-direction:column}
.lp-pcard-shine{position:absolute;inset:0;border-radius:24px;pointer-events:none}
.lp-pcard-glow{position:absolute;width:280px;height:280px;border-radius:50%;pointer-events:none;top:-80px;right:-60px;filter:blur(60px)}
.lp-pc1 .lp-pcard-glow{background:rgba(75,120,255,.10)}
.lp-pc2 .lp-pcard-glow{background:rgba(20,200,160,.08)}
.lp-pc3 .lp-pcard-glow{background:rgba(160,80,255,.08)}
.lp-pc4 .lp-pcard-glow{background:rgba(34,197,94,.07)}
.lp-pcard-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
.lp-pcard-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;line-height:1}
.lp-pc1 .lp-pcard-icon{background:rgba(75,120,255,.15);border:1px solid rgba(75,120,255,.25)}
.lp-pc2 .lp-pcard-icon{background:rgba(20,200,160,.12);border:1px solid rgba(20,200,160,.2)}
.lp-pc3 .lp-pcard-icon{background:rgba(160,80,255,.12);border:1px solid rgba(160,80,255,.2)}
.lp-pc4 .lp-pcard-icon{background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.18)}
.lp-pcard-num{font-size:11px;font-weight:700;letter-spacing:.08em;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.35)}
.lp-pcard-body h3{font-size:1.25rem;font-weight:700;margin-bottom:8px;letter-spacing:-.02em;color:var(--lp-white)}
.lp-pcard-body p{font-size:.875rem;color:#7b88aa;line-height:1.65}
.lp-pmini{margin-top:28px;border-radius:14px;background:rgba(6,9,18,.6);border:1px solid rgba(255,255,255,.07);overflow:hidden}
.lp-pmini-bar{height:32px;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:6px;padding:0 12px}
.lp-pmini-dot{width:7px;height:7px;border-radius:50%}
.lp-pmini-body{padding:16px}
.lp-pmini-chart{display:flex;align-items:flex-end;gap:3px;height:50px;margin-bottom:12px}
.lp-pmcb{border-radius:3px 3px 0 0;flex:1}
.lp-pmini-kpis{display:flex;gap:12px}
.lp-pmkpi{flex:1;background:rgba(75,120,255,.07);border:1px solid rgba(75,120,255,.12);border-radius:8px;padding:8px 10px}
.lp-pmkpi-l{font-size:10px;color:#5a6a88;margin-bottom:2px}
.lp-pmkpi-v{font-size:14px;font-weight:700;color:var(--lp-white);letter-spacing:-.02em}
.lp-pmkpi-v.pos{color:#22c55e}
.lp-pmini-donut-row{display:flex;gap:12px;align-items:center}
.lp-pmini-donut{position:relative;width:64px;height:64px;flex-shrink:0}
.lp-pmini-donut svg{width:64px;height:64px}
.lp-pmini-donut-c{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--lp-white);letter-spacing:-.02em}
.lp-pmini-dl{flex:1;display:flex;flex-direction:column;gap:6px}
.lp-pmdlr{display:flex;align-items:center;gap:7px;font-size:11px;color:#7b88aa}
.lp-pmdlr-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.lp-pmdlr-val{margin-left:auto;font-weight:600;color:#c8d0e7}
.lp-pmar{display:flex;flex-direction:column;gap:6px}
.lp-pmar-row{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:8px;padding:7px 10px}
.lp-pmar-l{display:flex;align-items:center;gap:7px;font-size:11px;color:#c8d0e7;font-weight:500}
.lp-pmar-ic{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px}
.lp-pmsi{display:flex;flex-direction:column;gap:7px}
.lp-pmsi-row{display:flex;align-items:center;gap:9px;font-size:11px;color:#7b88aa;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.04);background:rgba(255,255,255,.02)}
.lp-pmsi-chk{width:18px;height:18px;border-radius:50%;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;font-size:9px;color:#22c55e;flex-shrink:0}
.lp-pmsi-badge{margin-left:auto;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;letter-spacing:.04em}
.lp-pctag-row{margin-top:20px;display:flex;gap:6px;flex-wrap:wrap}
.lp-pctag{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:5px}
.lp-pct1{background:rgba(75,120,255,.1);color:#6b9fff}
.lp-pct2{background:rgba(20,200,160,.1);color:#14c8a0}
.lp-pct3{background:rgba(160,80,255,.1);color:#b06aff}
.lp-pct4{background:rgba(34,197,94,.1);color:#22c55e}

/* ── TICKER ── */
.lp-ticker-wrap{overflow:hidden;position:relative;z-index:1;padding:1.35rem 0;background:var(--lp-bg1);border-top:1px solid var(--lp-gb);border-bottom:1px solid var(--lp-gb)}
.lp-ticker-wrap::before,.lp-ticker-wrap::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2}
.lp-ticker-wrap::before{left:0;background:linear-gradient(to right,var(--lp-bg1),transparent)}
.lp-ticker-wrap::after{right:0;background:linear-gradient(to left,var(--lp-bg1),transparent)}
.lp-ticker{display:flex;gap:0.6rem;animation:lp-tkr 35s linear infinite;width:max-content}
.lp-ticker:hover{animation-play-state:paused}
@keyframes lp-tkr{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.lp-tkr-item{display:flex;align-items:center;gap:0.4rem;background:var(--lp-glass);border:1px solid var(--lp-gb);border-radius:8px;padding:0.38rem 0.9rem;font-size:0.79rem;color:var(--lp-g1);white-space:nowrap;flex-shrink:0;transition:border-color 0.15s,color 0.15s}
.lp-tkr-item:hover{border-color:rgba(75,120,255,0.3);color:var(--lp-white)}
.lp-tkr-dot{width:5px;height:5px;border-radius:50%;background:var(--lp-blue);opacity:0.6;flex-shrink:0}

/* ── TOOLS ── */
.lp-tools-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--lp-gb);border:1px solid var(--lp-gb);border-radius:var(--lp-r3);overflow:hidden}
.lp-tool-card{background:var(--lp-glass);backdrop-filter:blur(20px);padding:1.5rem;display:flex;flex-direction:column;text-decoration:none;color:inherit;transition:background 0.18s;gap:0.4rem}
.lp-tool-card:hover{background:var(--lp-glass2)}
.lp-tool-card:hover .lp-t-arrow{opacity:1;transform:translate(2px,-2px)}
.lp-tool-head{display:flex;align-items:flex-start;justify-content:space-between}
.lp-t-tag{font-size:0.67rem;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;padding:0.2rem 0.55rem;border-radius:5px}
.te{background:rgba(34,197,94,0.1);color:#22c55e}
.ti{background:rgba(75,120,255,0.1);color:var(--lp-blue-l)}
.tf{background:rgba(245,158,11,0.1);color:var(--lp-gold-l)}
.tb{background:rgba(167,139,250,0.1);color:var(--lp-purple-l)}
.tv{background:rgba(244,63,94,0.1);color:#fb7185}
.lp-t-arrow{font-size:0.9rem;color:var(--lp-g2);opacity:0;transition:opacity 0.18s,transform 0.18s}
.lp-tool-card h3{font-size:0.92rem;font-weight:600;margin-top:0.6rem;color:var(--lp-white)}
.lp-tool-card p{font-size:0.79rem;color:var(--lp-g2);line-height:1.5;margin:0}

/* ── PatrimoINE ── */
.lp-patri-2col{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
.lp-pcol{background:var(--lp-glass);backdrop-filter:blur(20px);border:1px solid var(--lp-gb);border-radius:var(--lp-r3);overflow:hidden}
.lp-pcol-hd{padding:1rem 1.25rem;border-bottom:1px solid var(--lp-gb);font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--lp-g3)}
.lp-prow{display:flex;align-items:center;justify-content:space-between;padding:0.875rem 1.25rem;border-bottom:1px solid rgba(255,255,255,0.03);text-decoration:none;color:inherit;transition:background 0.15s}
.lp-prow:hover{background:rgba(75,120,255,0.07)}
.lp-prow:last-child{border-bottom:none}
.lp-prow-l{display:flex;align-items:center;gap:0.75rem}
.lp-prow-ic{width:32px;height:32px;border-radius:8px;background:rgba(75,120,255,0.1);border:1px solid rgba(75,120,255,0.15);display:flex;align-items:center;justify-content:center;font-size:0.88rem;flex-shrink:0}
.lp-prow-nm{font-size:0.875rem;font-weight:500;color:var(--lp-white)}
.lp-prow-sb{font-size:0.72rem;color:var(--lp-g2)}
.lp-prow-arr{font-size:0.8rem;color:var(--lp-g3)}

/* ── TESTIMONIALS ── */
.lp-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
.lp-testi{background:var(--lp-glass);backdrop-filter:blur(20px);border:1px solid var(--lp-gb);border-radius:var(--lp-r3);padding:1.75rem;display:flex;flex-direction:column;gap:1rem;transition:background 0.2s,border-color 0.2s,transform 0.2s}
.lp-testi:hover{background:var(--lp-glass2);border-color:rgba(75,120,255,0.18);transform:translateY(-3px)}
.lp-testi-stars{color:var(--lp-gold);font-size:0.78rem;letter-spacing:0.1em}
.lp-testi-q{font-size:0.88rem;color:var(--lp-g1);line-height:1.7;flex:1;font-style:italic}
.lp-testi-auth{display:flex;align-items:center;gap:0.65rem}
.lp-testi-av{width:35px;height:35px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;flex-shrink:0;color:var(--lp-white)}
.lp-testi-nm{font-size:0.83rem;font-weight:700;color:var(--lp-white)}
.lp-testi-rl{font-size:0.72rem;color:var(--lp-g2)}

/* ── STEPS ── */
.lp-steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
.lp-step-card{background:var(--lp-glass);backdrop-filter:blur(20px);border:1px solid var(--lp-gb);border-radius:var(--lp-r3);padding:2.25rem 2rem;position:relative;overflow:hidden;transition:background 0.2s,transform 0.2s}
.lp-step-card:hover{background:var(--lp-glass2);transform:translateY(-3px)}
.lp-step-card::before{content:attr(data-step);position:absolute;top:1.25rem;right:1.5rem;font-size:4rem;font-weight:800;color:rgba(75,120,255,0.07);line-height:1;letter-spacing:-0.05em;pointer-events:none}
.lp-step-ic{width:48px;height:48px;border-radius:12px;background:rgba(75,120,255,0.1);border:1px solid rgba(75,120,255,0.18);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:1.25rem}
.lp-step-card h3{margin-bottom:0.5rem}
.lp-step-card p{font-size:0.875rem;line-height:1.65;color:var(--lp-g2)}

/* ── PROFILES ── */
.lp-profiles-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem}
.lp-profile{background:var(--lp-glass);backdrop-filter:blur(20px);border:1px solid var(--lp-gb);border-radius:var(--lp-r3);padding:1.75rem;transition:background 0.2s,border-color 0.2s,transform 0.2s}
.lp-profile:hover{background:var(--lp-glass2);border-color:rgba(75,120,255,0.2);transform:translateY(-3px)}
.lp-p-em{font-size:1.75rem;margin-bottom:0.85rem}
.lp-p-role{font-size:0.7rem;color:var(--lp-blue-l);margin-bottom:0.75rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase}
.lp-profile h3{font-size:0.95rem;margin-bottom:0.45rem}
.lp-profile p{font-size:0.8rem;margin-bottom:1rem;line-height:1.55;color:var(--lp-g2)}
.lp-p-tags{display:flex;flex-wrap:wrap;gap:0.35rem}
.lp-p-tag{font-size:0.69rem;font-weight:600;background:var(--lp-glass2);border:1px solid var(--lp-gb);border-radius:5px;padding:0.18rem 0.5rem;color:var(--lp-g2)}

/* ── ROADMAP ── */
.lp-rmap{display:flex;flex-direction:column}
.lp-rmap-row{display:grid;grid-template-columns:200px 1fr;gap:2.75rem;padding:2.25rem 0;border-top:1px solid var(--lp-gb);align-items:start}
.lp-rmap-l strong{font-size:0.92rem;font-weight:700;display:block;margin-bottom:0.25rem;color:var(--lp-white)}
.lp-rmap-l span{font-size:0.72rem;font-weight:500}
.lp-s-done{color:var(--lp-green)}
.lp-s-wip{color:var(--lp-gold)}
.lp-s-soon{color:var(--lp-g3)}
.lp-rmap-items{display:flex;flex-wrap:wrap;gap:0.45rem}
.lp-ri{display:flex;align-items:center;gap:0.38rem;background:var(--lp-glass);border:1px solid var(--lp-gb);border-radius:6px;padding:0.28rem 0.65rem;font-size:0.77rem;color:var(--lp-g1)}
.lp-ri.done{border-color:rgba(34,197,94,0.14)}
.lp-ri.wip{border-color:rgba(245,158,11,0.16)}
.lp-ri-ic{font-size:0.7rem}
.lp-ri-ic.done{color:var(--lp-green)}
.lp-ri-ic.wip{color:var(--lp-gold)}
.lp-ri-ic.soon{color:var(--lp-g3)}

/* ── COMPARE ── */
.lp-cmp-wrap{overflow-x:auto;border:1px solid var(--lp-gb);border-radius:var(--lp-r3)}
.lp-cmp{width:100%;border-collapse:collapse;min-width:520px}
.lp-cmp thead tr{background:var(--lp-glass2)}
.lp-cmp th{padding:1.1rem 1.25rem;font-size:0.8rem;font-weight:700;text-align:left;border-bottom:1px solid var(--lp-gb);color:var(--lp-white)}
.lp-cmp th.hl{color:var(--lp-blue-l)}
.lp-cmp td{padding:0.85rem 1.25rem;font-size:0.85rem;color:var(--lp-g1);border-bottom:1px solid rgba(255,255,255,0.03)}
.lp-cmp tr:hover td{background:var(--lp-glass)}
.lp-cmp tr:last-child td{border-bottom:none}
.lp-tick{color:var(--lp-green);font-weight:700}
.lp-cross{color:rgba(255,255,255,0.14)}
.lp-part{color:var(--lp-gold);font-size:0.78rem}

/* ── FAQ ── */
.lp-faq{max-width:700px;margin:0 auto}
.lp-fi{border-top:1px solid var(--lp-gb)}
.lp-fq{width:100%;background:none;border:none;text-align:left;padding:1.3rem 0;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.92rem;font-weight:600;color:var(--lp-white);display:flex;justify-content:space-between;align-items:center;gap:1rem;transition:color 0.15s}
.lp-fq:hover{color:var(--lp-blue-l)}
.lp-fi-ic{font-size:1rem;color:var(--lp-g3);transition:transform 0.2s,color 0.2s;display:inline-block;flex-shrink:0}
.lp-fi-ic.open{transform:rotate(45deg);color:var(--lp-blue-l)}
.lp-fa{font-size:0.875rem;color:var(--lp-g2);line-height:1.75;max-height:0;overflow:hidden;transition:max-height 0.35s ease,padding 0.2s;padding-right:2.5rem}
.lp-fa.open{max-height:200px;padding-bottom:1.3rem}

/* ── CTA FINAL ── */
.lp-cta-final{padding:9rem 0;text-align:center;position:relative;z-index:1;overflow:hidden;border-top:1px solid var(--lp-gb);border-bottom:1px solid var(--lp-gb)}
.lp-cta-final::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 50%,rgba(75,120,255,0.08) 0%,rgba(139,92,246,0.04) 60%,transparent 80%);pointer-events:none}
.lp-cta-final h2{margin-bottom:0.85rem}
.lp-cta-final p{max-width:480px;margin:0 auto 2.5rem;font-size:1.05rem;color:var(--lp-g2)}
.lp-cta-acts{display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap}

/* ── STICKY ── */
.lp-sticky{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:rgba(8,13,26,0.96);backdrop-filter:blur(24px) saturate(200%);border:1px solid rgba(255,255,255,0.1);border-radius:99px;padding:0.45rem 0.5rem 0.45rem 1.5rem;display:flex;align-items:center;gap:1rem;z-index:99;box-shadow:0 8px 40px rgba(0,0,0,0.6),0 0 0 1px rgba(75,120,255,0.1);animation:lp-sb 0.5s 2.5s ease both}
@keyframes lp-sb{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.lp-sticky span{font-size:0.8rem;color:var(--lp-g2);white-space:nowrap}

/* ── FOOTER ── */
.lp-footer{padding:3.5rem 0 2.5rem;position:relative;z-index:1;border-top:1px solid var(--lp-gb)}
.lp-ft-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:3rem;margin-bottom:3rem}
.lp-ft-brand p{font-size:0.82rem;color:var(--lp-g2);margin-top:0.7rem;max-width:250px;line-height:1.65}
.lp-ft-col h5{font-size:0.68rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--lp-g3);margin-bottom:1rem}
.lp-ft-col ul{list-style:none;display:flex;flex-direction:column;gap:0.5rem}
.lp-ft-col a{font-size:0.82rem;color:var(--lp-g2);transition:color 0.15s}
.lp-ft-col a:hover{color:var(--lp-white)}
.lp-ft-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding-top:2rem;border-top:1px solid var(--lp-gb);font-size:0.74rem;color:var(--lp-g3)}

/* ── SCROLL FADE ── */
.lp-wrap .fade{opacity:0;transform:translateY(22px);transition:opacity 0.6s ease,transform 0.6s ease}
.lp-wrap .fade.in{opacity:1;transform:translateY(0)}

/* ── RESPONSIVE ── */
@media(max-width:960px){
  .lp-hero-inner{grid-template-columns:1fr;gap:3rem}
  .lp-testi-grid,.lp-steps-grid,.lp-profiles-grid{grid-template-columns:1fr}
  .lp-tools-grid{grid-template-columns:1fr 1fr}
  .lp-patri-2col{grid-template-columns:1fr}
  .lp-stats-grid{grid-template-columns:1fr 1fr}
  .lp-ft-grid{grid-template-columns:1fr 1fr}
  .lp-nav-links{display:none}
  .lp-mock-body{grid-template-columns:1fr}
  .lp-rmap-row{grid-template-columns:1fr;gap:0.75rem}
  .lp-sticky{display:none}
  .lp-pcards-grid{grid-template-columns:1fr}
  .lp-pcard{height:400px}
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
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    // Scroll fade + counters
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

    return () => { obs.disconnect() }
  }, [])

  return (
    <>
      <HeroShutterText text="Patrimo" onComplete={() => setSplashDone(true)} />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lp-wrap">

        {/* ── ORBS ── */}
        <div className="lp-orbs" aria-hidden="true">
          <div className="lp-orb lp-orb1" />
          <div className="lp-orb lp-orb2" />
          <div className="lp-orb lp-orb3" />
        </div>

        {/* ── NAV ── */}
        <PatrimoHeader />

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="lp-hero-inner">
              {/* Left column */}
              <div>
                <div className="lp-hero-badge">
                  <span className="lp-pill"><span className="lp-live" />18 simulateurs · Données 2026 · 100 % gratuit</span>
                </div>
                <h1>Le couteau suisse<br />de <span className="lp-grad">l&apos;investisseur français.</span></h1>
                <p className="lp-hero-sub">
                  Simulez, analysez et suivez l&apos;intégralité de votre Patrimoine depuis une seule plateforme. Gratuit, sans données bancaires.
                </p>
                <div className="lp-hero-ctas">
                  <Link href="/login" className="lp-btn lp-gold-btn lp-lg">Commencer gratuitement →</Link>
                  <a href="#simulateurs" className="lp-btn lp-ghost lp-lg">Voir les simulateurs</a>
                </div>
                <div className="lp-hero-trust">
                  {['3 847 utilisateurs actifs','Zéro donnée bancaire','RGPD · Hébergé en Europe','Finnhub & CoinGecko'].map(t => (
                    <div key={t} className="lp-trust-i">
                      <svg viewBox="0 0 24 24"><path d="M12 2L3 7v10l9 5 9-5V7z" /></svg>
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column — mockup */}
              <div className="lp-mock-wrap">
                <div className="lp-mock-glow" />
                <div className="lp-mock">
                  <div className="lp-mock-bar">
                    <div className="lp-mock-dots">
                      <div className="lp-mock-dot" style={{ background:'#ff5f57' }} />
                      <div className="lp-mock-dot" style={{ background:'#febc2e' }} />
                      <div className="lp-mock-dot" style={{ background:'#28c840' }} />
                    </div>
                    <div className="lp-mock-url">finance.digitalstack.cloud/Patrimoine</div>
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
                      <div className="lp-panel-lbl">Portefeuille</div>
                      <div className="lp-mock-num">115 500 €</div>
                      <div className="lp-mock-delta pos">↑ +21.2%</div>
                      <table className="lp-mock-tbl"><tbody>
                        <tr><td>MSCI World</td><td style={{ color:'#22c55e' }}>+24.1%</td></tr>
                        <tr><td>S&amp;P 500</td><td style={{ color:'#22c55e' }}>+19.8%</td></tr>
                        <tr><td>Bitcoin</td><td style={{ color:'#ef4444' }}>-4.2%</td></tr>
                        <tr><td>Livret A</td><td style={{ color:'#7b88aa' }}>+3.0%</td></tr>
                      </tbody></table>
                    </div>
                    <div className="lp-mock-panel">
                      <div className="lp-panel-lbl">Score Patrimonial</div>
                      <div className="lp-score-ring">74</div>
                      <div style={{ fontSize:'0.65rem', color:'#7b88aa', textAlign:'center', marginTop:'0.25rem' }}>sur 100 · 6 piliers</div>
                      <table className="lp-mock-tbl" style={{ marginTop:'0.6rem' }}><tbody>
                        <tr><td>Épargne</td><td style={{ color:'#22c55e' }}>85/100</td></tr>
                        <tr><td>Dettes</td><td style={{ color:'#f59e0b' }}>62/100</td></tr>
                        <tr><td>Diversif.</td><td style={{ color:'#22c55e' }}>78/100</td></tr>
                      </tbody></table>
                    </div>
                  </div>
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
        <section className="lp-stats-section">
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
                <div className="lp-stat-l">Pages gestion Patrimoine</div>
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
              <h2>Quatre piliers pour<br />maîtriser votre Patrimoine</h2>
              <p>Des outils complets pour simuler, analyser, suivre et sécuriser votre situation financière.</p>
            </div>
            <div className="lp-pcards-grid fade">

              {/* Card 1 — Simuler */}
              <div className="lp-pcard lp-pc1">
                <div className="lp-pcard-flip">
                  {/* FRONT */}
                  <div className="lp-pcard-front">
                    <div className="lp-pf-top">
                      <span className="lp-pf-num">01</span>
                      <span className="lp-pf-hint">Survol pour découvrir</span>
                    </div>
                    <div className="lp-pf-center">
                      <div className="lp-pf-icon">⚡</div>
                      <div className="lp-pf-label">
                        <div className="lp-pf-title">Simuler<em>.</em></div>
                        <div className="lp-pf-sub">18 calculateurs · Fiscalité 2026</div>
                      </div>
                      <div className="lp-pf-kpi">18</div>
                    </div>
                    <div className="lp-pf-bottom">Voir les détails</div>
                  </div>
                  {/* BACK */}
                  <div className="lp-pcard-back">
                    <div className="lp-pcard-inner">
                      <div className="lp-pcard-shine" />
                      <div className="lp-pcard-glow" />
                      <div className="lp-pcard-top">
                        <div className="lp-pcard-icon">⚡</div>
                        <span className="lp-pcard-num">01</span>
                      </div>
                      <div className="lp-pcard-body">
                        <h3>Simulateurs</h3>
                        <p>18 calculateurs couvrant intérêts composés, FI/RE, crédit immobilier, fiscalité, retraite et plus. Résultats instantanés.</p>
                      </div>
                      <div className="lp-pmini">
                        <div className="lp-pmini-bar">
                          <div className="lp-pmini-dot" style={{ background:'#ff5f57' }} />
                          <div className="lp-pmini-dot" style={{ background:'#febc2e' }} />
                          <div className="lp-pmini-dot" style={{ background:'#28c840' }} />
                          <span style={{ fontSize:10, color:'#3d4d6a', marginLeft:6 }}>Intérêts Composés</span>
                        </div>
                        <div className="lp-pmini-body">
                          <div className="lp-pmini-chart">
                            {[18,28,35,42,52,63,71,82,95,100].map((h,i) => (
                              <div key={i} className="lp-pmcb" style={{ height:`${h}%`, background:`rgba(75,120,255,${(0.25+h/100*0.75).toFixed(2)})` }} />
                            ))}
                          </div>
                          <div className="lp-pmini-kpis">
                            <div className="lp-pmkpi"><div className="lp-pmkpi-l">Capital investi</div><div className="lp-pmkpi-v">72 000 €</div></div>
                            <div className="lp-pmkpi"><div className="lp-pmkpi-l">Capital final</div><div className="lp-pmkpi-v pos">186 400 €</div></div>
                            <div className="lp-pmkpi"><div className="lp-pmkpi-l">Rendement</div><div className="lp-pmkpi-v pos">+7,0 %</div></div>
                          </div>
                        </div>
                      </div>
                      <div className="lp-pctag-row">
                        {['FI/RE','DCA','Retraite','Crédit immo'].map(t => <span key={t} className="lp-pctag lp-pct1">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 — Optimiser */}
              <div className="lp-pcard lp-pc2">
                <div className="lp-pcard-flip">
                  {/* FRONT */}
                  <div className="lp-pcard-front">
                    <div className="lp-pf-top">
                      <span className="lp-pf-num">02</span>
                      <span className="lp-pf-hint">Survol pour découvrir</span>
                    </div>
                    <div className="lp-pf-center">
                      <div className="lp-pf-icon">📊</div>
                      <div className="lp-pf-label">
                        <div className="lp-pf-title">Optimiser<em>.</em></div>
                        <div className="lp-pf-sub">ETF · Frais · Rendement net</div>
                      </div>
                      <div className="lp-pf-kpi">-8 420€</div>
                    </div>
                    <div className="lp-pf-bottom">Voir les détails</div>
                  </div>
                  {/* BACK */}
                  <div className="lp-pcard-back">
                    <div className="lp-pcard-inner">
                      <div className="lp-pcard-shine" />
                      <div className="lp-pcard-glow" />
                      <div className="lp-pcard-top">
                        <div className="lp-pcard-icon">📊</div>
                        <span className="lp-pcard-num">02</span>
                      </div>
                      <div className="lp-pcard-body">
                        <h3>Insights</h3>
                        <p>Graphiques interactifs, benchmarks CAC 40 / MSCI World et visualisations claires pour révéler la croissance et les tendances.</p>
                      </div>
                      <div className="lp-pmini">
                        <div className="lp-pmini-bar">
                          <div className="lp-pmini-dot" style={{ background:'#ff5f57' }} />
                          <div className="lp-pmini-dot" style={{ background:'#febc2e' }} />
                          <div className="lp-pmini-dot" style={{ background:'#28c840' }} />
                          <span style={{ fontSize:10, color:'#3d4d6a', marginLeft:6 }}>Répartition Patrimoine</span>
                        </div>
                        <div className="lp-pmini-body">
                          <div className="lp-pmini-donut-row">
                            <div className="lp-pmini-donut">
                              <svg viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="10"/>
                                <circle cx="32" cy="32" r="24" fill="none" stroke="#4b78ff" strokeWidth="10" strokeDasharray="60 91" strokeDashoffset="24" strokeLinecap="round"/>
                                <circle cx="32" cy="32" r="24" fill="none" stroke="#14c8a0" strokeWidth="10" strokeDasharray="28 123" strokeDashoffset="-36" strokeLinecap="round"/>
                                <circle cx="32" cy="32" r="24" fill="none" stroke="#b06aff" strokeWidth="10" strokeDasharray="18 133" strokeDashoffset="-64" strokeLinecap="round"/>
                                <circle cx="32" cy="32" r="24" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="13 138" strokeDashoffset="-82" strokeLinecap="round"/>
                              </svg>
                              <div className="lp-pmini-donut-c">412k</div>
                            </div>
                            <div className="lp-pmini-dl">
                              {[['#4b78ff','Immobilier','42 %'],['#14c8a0','Actions','28 %'],['#b06aff','Livrets','18 %'],['#f59e0b','Crypto','12 %']].map(([c,l,v]) => (
                                <div key={l} className="lp-pmdlr"><div className="lp-pmdlr-dot" style={{ background:c }} />{l}<div className="lp-pmdlr-val">{v}</div></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="lp-pctag-row">
                        {['CAC 40','MSCI World','Benchmark'].map(t => <span key={t} className="lp-pctag lp-pct2">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 — Suivre */}
              <div className="lp-pcard lp-pc3">
                <div className="lp-pcard-flip">
                  {/* FRONT */}
                  <div className="lp-pcard-front">
                    <div className="lp-pf-top">
                      <span className="lp-pf-num">03</span>
                      <span className="lp-pf-hint">Survol pour découvrir</span>
                    </div>
                    <div className="lp-pf-center">
                      <div className="lp-pf-icon">🏛</div>
                      <div className="lp-pf-label">
                        <div className="lp-pf-title">Suivre<em>.</em></div>
                        <div className="lp-pf-sub">PEA, CTO, Immo, Crypto, Livrets</div>
                      </div>
                      <div className="lp-pf-kpi">+8,4%</div>
                    </div>
                    <div className="lp-pf-bottom">Voir les détails</div>
                  </div>
                  {/* BACK */}
                  <div className="lp-pcard-back">
                    <div className="lp-pcard-inner">
                      <div className="lp-pcard-shine" />
                      <div className="lp-pcard-glow" />
                      <div className="lp-pcard-top">
                        <div className="lp-pcard-icon">🏛</div>
                        <span className="lp-pcard-num">03</span>
                      </div>
                      <div className="lp-pcard-body">
                        <h3>Patrimoine</h3>
                        <p>Suivi complet — immobilier, actions, livrets, crypto — centralisé en temps réel via Finnhub & CoinGecko. Score 0–100 sur 6 piliers.</p>
                      </div>
                      <div className="lp-pmini">
                        <div className="lp-pmini-bar">
                          <div className="lp-pmini-dot" style={{ background:'#ff5f57' }} />
                          <div className="lp-pmini-dot" style={{ background:'#febc2e' }} />
                          <div className="lp-pmini-dot" style={{ background:'#28c840' }} />
                          <span style={{ fontSize:10, color:'#3d4d6a', marginLeft:6 }}>Mon portefeuille · live</span>
                          <span style={{ marginLeft:'auto', fontSize:9, background:'rgba(34,197,94,.12)', color:'#22c55e', padding:'2px 7px', borderRadius:99, fontWeight:700 }}>● LIVE</span>
                        </div>
                        <div className="lp-pmini-body">
                          <div className="lp-pmar">
                            {[
                              { bg:'rgba(75,120,255,.12)', ic:'📈', nm:'MSCI World ETF', perf:'+24,1 %', pos:true },
                              { bg:'rgba(245,158,11,.10)', ic:'₿',  nm:'Bitcoin',        perf:'-4,2 %',  pos:false },
                              { bg:'rgba(20,200,160,.10)', ic:'🏠', nm:'Immo Neuilly',   perf:'+8,4 %',  pos:true },
                              { bg:'rgba(160,80,255,.10)', ic:'💳', nm:'Livret A',       perf:'+3,0 %',  pos:true },
                            ].map(r => (
                              <div key={r.nm} className="lp-pmar-row">
                                <div className="lp-pmar-l">
                                  <div className="lp-pmar-ic" style={{ background:r.bg }}>{r.ic}</div>
                                  {r.nm}
                                </div>
                                <span style={{ fontSize:11, fontWeight:700, color: r.pos ? '#22c55e' : '#ef4444' }}>{r.perf}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="lp-pctag-row">
                        {['Finnhub','CoinGecko','Score 0–100'].map(t => <span key={t} className="lp-pctag lp-pct3">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4 — Sécuriser */}
              <div className="lp-pcard lp-pc4">
                <div className="lp-pcard-flip">
                  {/* FRONT */}
                  <div className="lp-pcard-front">
                    <div className="lp-pf-top">
                      <span className="lp-pf-num">04</span>
                      <span className="lp-pf-hint">Survol pour découvrir</span>
                    </div>
                    <div className="lp-pf-center">
                      <div className="lp-pf-icon">🔒</div>
                      <div className="lp-pf-label">
                        <div className="lp-pf-title">Sécuriser<em>.</em></div>
                        <div className="lp-pf-sub">AES-256 · RGPD · Hébergé en Europe</div>
                      </div>
                      <div className="lp-pf-kpi">0 donnée</div>
                    </div>
                    <div className="lp-pf-bottom">Voir les détails</div>
                  </div>
                  {/* BACK */}
                  <div className="lp-pcard-back">
                    <div className="lp-pcard-inner">
                      <div className="lp-pcard-shine" />
                      <div className="lp-pcard-glow" />
                      <div className="lp-pcard-top">
                        <div className="lp-pcard-icon">🔒</div>
                        <span className="lp-pcard-num">04</span>
                      </div>
                      <div className="lp-pcard-body">
                        <h3>Sécurité</h3>
                        <p>Chiffrement AES-256, hébergé en Europe, conformité RGPD. Aucune donnée bancaire requise, aucune revente. Jamais.</p>
                      </div>
                      <div className="lp-pmini">
                        <div className="lp-pmini-bar">
                          <div className="lp-pmini-dot" style={{ background:'#ff5f57' }} />
                          <div className="lp-pmini-dot" style={{ background:'#febc2e' }} />
                          <div className="lp-pmini-dot" style={{ background:'#28c840' }} />
                          <span style={{ fontSize:10, color:'#3d4d6a', marginLeft:6 }}>État de sécurité</span>
                        </div>
                        <div className="lp-pmini-body">
                          <div className="lp-pmsi">
                            {[
                              { t:'Chiffrement de bout en bout',   badge:'AES-256', bc:'rgba(34,197,94,.12)',   tc:'#22c55e' },
                              { t:'Hébergement certifié UE',       badge:'RGPD',    bc:'rgba(75,120,255,.12)',  tc:'#6b9fff' },
                              { t:'0 donnée bancaire collectée',   badge:'Vérifié', bc:'rgba(34,197,94,.12)',   tc:'#22c55e' },
                              { t:'OAuth 2.0 Google SSO',          badge:'Sécurisé',bc:'rgba(75,120,255,.12)',  tc:'#6b9fff' },
                            ].map(r => (
                              <div key={r.t} className="lp-pmsi-row">
                                <div className="lp-pmsi-chk">✓</div>
                                <span style={{ flex:1 }}>{r.t}</span>
                                <span className="lp-pmsi-badge" style={{ background:r.bc, color:r.tc }}>{r.badge}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="lp-pctag-row">
                        {['AES-256','RGPD','OAuth 2.0','0 donnée bancaire'].map(t => <span key={t} className="lp-pctag lp-pct4">{t}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

        {/* ── PatrimoINE ── */}
        <section id="Patrimoine" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade">
              <div className="lp-s-label">Gestion & Suivi</div>
              <h2>Votre Patrimoine<br />centralisé en temps réel</h2>
              <p>15 pages de gestion incluses dans votre compte Patrimo.</p>
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
              <div className="lp-s-label" style={{ margin:'0 auto 0.9rem' }}>En 3 étapes</div>
              <h2>Comment ça marche ?</h2>
            </div>
            <div className="lp-steps-grid fade">
              {[
                { n:'01', ic:'✉️', t:'Créez un compte',         p:"En 30 secondes avec votre email ou Google. Aucune carte bancaire, aucune donnée bancaire requise." },
                { n:'02', ic:'🎚', t:'Lancez une simulation',   p:"Choisissez parmi 18 simulateurs. Renseignez vos paramètres — résultats instantanés à chaque frappe." },
                { n:'03', ic:'📈', t:'Visualisez votre avenir', p:"Graphiques interactifs, synthèses détaillées et scénarios comparatifs pour décider plus intelligemment." },
              ].map(s => (
                <div key={s.n} className="lp-step-card" data-step={s.n}>
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
              <h2>Patrimo s&apos;adapte<br />à votre profil</h2>
            </div>
            <div className="lp-profiles-grid fade">
              {[
                { em:'🌱', role:'Jeune actif 25–35 ans',  t:"Commencer à investir",    p:"Visualisez la puissance des intérêts composés et planifiez votre indépendance financière.", tags:['Intérêts composés','DCA','FI/RE'] },
                { em:'🏠', role:'Propriétaire',            t:"Optimiser l'immobilier",  p:'Calculez la rentabilité locative, le crédit et comparez achat vs location.',              tags:['Prêt immo','Acheter vs Louer','Locatif'] },
                { em:'📈', role:'Investisseur',            t:"Optimiser la fiscalité",  p:'Suivez votre portefeuille et choisissez la meilleure enveloppe fiscale.',                tags:['PEA vs CTO vs AV','Flat Tax','Portfolio'] },
                { em:'🔥', role:'Futur retraité',          t:"Planifier la retraite",   p:'Calculez votre score Patrimonial et simulez votre succession.',                           tags:['FI/RE','Retraite','Score 0-100'] },
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
              <h2>Ce qui arrive sur Patrimo</h2>
              <p>Patrimo évolue en continu. Fonctionnalités disponibles et à venir.</p>
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
              <h2>Patrimo vs les alternatives</h2>
            </div>
            <div className="lp-cmp-wrap fade">
              <table className="lp-cmp">
                <thead>
                  <tr>
                    <th>Fonctionnalité</th>
                    <th className="hl">★ Patrimo</th>
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

        {/* ── SECURITY ── */}
        <section id="securite" className="lp-section">
          <div className="lp-container">
            <div className="lp-s-head fade" style={{ textAlign:'center' }}>
              <div className="lp-s-label" style={{ margin:'0 auto 0.9rem' }}>Confiance & RGPD</div>
              <h2>Vos données restent<br /><span className="lp-grad">vos données.</span></h2>
              <p style={{ margin:'0 auto' }}>Patrimo ne demande jamais vos coordonnées bancaires. Aucune revente, aucune publicité ciblée.</p>
            </div>
            <div className="fade" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginBottom:'2rem' }}>
              {[
                { ic:'🔒', title:'Chiffrement AES-256',     body:"Toutes vos données sont chiffrées au repos et en transit. Même nos équipes ne peuvent pas lire vos informations Patrimoniales." },
                { ic:'🇪🇺', title:'Hébergé en Europe',       body:"Nos serveurs sont situés en Union Européenne, conformes au RGPD. Aucune donnée n'est transférée hors UE sans votre consentement." },
                { ic:'🚫', title:'Zéro donnée bancaire',    body:"Patrimo ne demande jamais votre RIB, identifiants bancaires ou accès Open Banking. Vous saisissez uniquement ce que vous voulez." },
                { ic:'🔑', title:'OAuth 2.0 Google SSO',    body:"Authentification déléguée à Google. Vos mots de passe ne nous sont jamais transmis ni stockés. Connexion sécurisée en un clic." },
                { ic:'📵', title:'Sans publicité',          body:"Patrimo ne vend pas vos données à des annonceurs. Aucun tracking publicitaire, aucun cookie tiers non fonctionnel." },
                { ic:'📋', title:'Conformité RGPD',         body:"Droit d'accès, de rectification et de suppression garantis. Export de vos données à tout moment depuis votre profil." },
              ].map(card => (
                <div key={card.title} style={{ background:'var(--lp-glass)', border:'1px solid var(--lp-gb)', borderRadius:'var(--lp-r3)', padding:'1.75rem', backdropFilter:'blur(20px)' }}>
                  <div style={{ fontSize:'1.75rem', marginBottom:'0.75rem' }}>{card.ic}</div>
                  <h3 style={{ fontSize:'0.95rem', marginBottom:'0.45rem' }}>{card.title}</h3>
                  <p style={{ fontSize:'0.82rem', lineHeight:1.65, color:'var(--lp-g2)' }}>{card.body}</p>
                </div>
              ))}
            </div>
            <div className="fade" style={{ textAlign:'center' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'2rem', background:'var(--lp-glass)', border:'1px solid var(--lp-gb)', borderRadius:'var(--lp-r3)', padding:'1.25rem 2.5rem', flexWrap:'wrap', justifyContent:'center' }}>
                {['RGPD','AES-256','OAuth 2.0','Hébergé UE','0 donnée bancaire'].map(badge => (
                  <span key={badge} style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--lp-g2)', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <span style={{ color:'var(--lp-green)' }}>✓</span> {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="lp-section" style={{ background:'var(--lp-bg1)' }}>
          <div className="lp-container">
            <div className="lp-s-head fade" style={{ textAlign:'center' }}>
              <div className="lp-s-label" style={{ margin:'0 auto 0.9rem' }}>FAQ</div>
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
              <h2>Prenez le contrôle total<br /><span className="lp-grad">de votre vie financière.</span></h2>
              <p>Impôts, FIRE, Patrimoine. Sans carte bancaire, sans engagement.</p>
              <div className="lp-cta-acts">
                <Link href="/login" className="lp-btn lp-gold-btn lp-lg">Créer un compte gratuit →</Link>
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
                <Link href="/" className="lp-logo"><span className="lp-logo-mark">P</span> Patrimo</Link>
                <p>Outils de finance personnelle pour investisseurs français. Simulateurs, Patrimoine, fiscalité.</p>
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
              <span>© 2026 Patrimo · Tous droits réservés</span>
              <span>Calculs fournis à titre indicatif. Consultez un conseiller agréé pour vos décisions d&apos;investissement.</span>
            </div>
          </div>
        </footer>

        {/* ── STICKY BAR ── */}
        <div className="lp-sticky">
          <span>18 simulateurs · 100 % gratuit</span>
          <Link href="/login" className="lp-btn lp-primary" style={{ borderRadius:'99px' }}>Commencer →</Link>
        </div>

        {/* ── TWEAKS PANEL (dev only) ── */}
        {process.env.NODE_ENV === 'development' && <TweaksPanel />}

      </div>
    </>
  )
}

// ─── TweaksPanel — dev-only overlay to tweak CSS vars live ───────────────────

function TweaksPanel() {
  const [open, setOpen] = useState(false)
  const [tweaks, setTweaks] = useState({
    '--lp-blue':     '#4b78ff',
    '--lp-purple':   '#8b5cf6',
    '--lp-gold':     '#f59e0b',
    '--lp-bg':       '#05080f',
  })

  useEffect(() => {
    Object.entries(tweaks).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v)
    })
  }, [tweaks])

  const set = (k: string, v: string) => setTweaks(prev => ({ ...prev, [k]: v }))

  const panelStyle: React.CSSProperties = {
    position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 999,
    background: 'rgba(8,13,26,0.97)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14, padding: '1rem 1.25rem', minWidth: 220,
    backdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'fixed', bottom:'5.5rem', right:'1.5rem', zIndex:1000,
          background:'rgba(75,120,255,0.15)', border:'1px solid rgba(75,120,255,0.3)',
          borderRadius:10, padding:'0.5rem 0.9rem', color:'#7b9fff',
          fontSize:'0.78rem', fontWeight:700, cursor:'pointer',
          fontFamily:"'Plus Jakarta Sans',sans-serif",
          display: open ? 'none' : 'block',
        }}
      >
        🎨 Tweaks
      </button>
      {open && (
        <div style={panelStyle}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.85rem' }}>
            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#7b9fff', letterSpacing:'0.08em', textTransform:'uppercase' }}>Dev tweaks</span>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#475569', fontSize:'1rem', cursor:'pointer', lineHeight:1 }}>✕</button>
          </div>
          {Object.entries(tweaks).map(([key, val]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.55rem', gap:'0.75rem' }}>
              <label style={{ fontSize:'0.72rem', color:'#94a3b8', flex:1, fontFamily:'monospace' }}>{key}</label>
              <input
                type="color"
                value={val}
                onChange={e => set(key, e.target.value)}
                style={{ width:32, height:24, border:'none', background:'none', cursor:'pointer', padding:0, borderRadius:4 }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              setTweaks({ '--lp-blue':'#4b78ff','--lp-purple':'#8b5cf6','--lp-gold':'#f59e0b','--lp-bg':'#05080f' })
            }}
            style={{ marginTop:'0.5rem', width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'0.35rem', fontSize:'0.72rem', color:'#94a3b8', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}
          >
            Reset
          </button>
        </div>
      )}
    </>
  )
}

export default LandingClient
