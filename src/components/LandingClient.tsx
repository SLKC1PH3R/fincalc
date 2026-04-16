'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp,
  Flame,
  Receipt,
  Home,
  Building2,
  Wallet,
  PiggyBank,
  RefreshCw,
  Calculator,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  BarChart3,
  EyeOff,
  Check,
  X,
  Star,
  Clock,
  Layers,
  Globe,
  Euro,
  Percent,
  Bitcoin,
  Users,
  Award,
  ChevronDown,
  BookOpen,
  Target,
  FileText,
  LayoutDashboard,
  Scale,
  Landmark,
} from 'lucide-react'
import { PatrimoLogo } from '@/components/PatrimoLogo'
import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import { useScrollAnimations } from '@/hooks/useScrollAnimations'

// ─── Constants ────────────────────────────────────────────────────────────
const GOLD = '#f1c086'
const GOLD_DARK = 'rgba(241,192,134,0.10)'
const GOLD_BORDER = 'rgba(241,192,134,0.20)'
const GOLD_GLOW = 'rgba(241,192,134,0.05)'

const MODULES = [
  { icon: TrendingUp, label: 'Intérêts Composés', desc: 'Visualisez l\'effet boule de neige de votre épargne sur des décennies.', tag: 'Épargne', color: '#34d399' },
  { icon: RefreshCw, label: 'DCA', desc: 'Simulez un plan d\'investissement régulier vs achat unique (lump sum).', tag: 'Épargne', color: '#38bdf8' },
  { icon: Flame, label: 'FI/RE', desc: 'Calculez votre objectif FIRE et estimez votre date de liberté financière.', tag: 'Épargne', color: '#fb923c' },
  { icon: Home, label: 'Acheter vs Louer', desc: 'Comparez le patrimoine généré selon votre stratégie résidentielle.', tag: 'Immobilier', color: '#a78bfa' },
  { icon: Building2, label: 'Prêt Immobilier', desc: 'Mensualités, TAEG, tableau d\'amortissement complet.', tag: 'Immobilier', color: '#f472b6' },
  { icon: Wallet, label: 'Rentabilité Locative', desc: 'Cashflow, rendement net et fiscalité de votre investissement locatif.', tag: 'Immobilier', color: '#2dd4bf' },
  { icon: Receipt, label: 'Impôts IR', desc: 'Calcul IR, TMI, comparaison frais réels vs abattement 10%.', tag: 'Fiscal', color: '#fb7185' },
  { icon: PiggyBank, label: 'Simulateur Retraite', desc: 'Pension estimée et optimisation de votre PER pour 2026.', tag: 'Fiscal', color: '#fbbf24' },
  { icon: Calculator, label: 'Budget 50/30/20', desc: 'Répartition de vos dépenses selon la règle d\'or des finances perso.', tag: 'Budget', color: '#a3e635' },
  { icon: BarChart3, label: 'Flat Tax vs Barème', desc: 'Comparez le PFU 30% au barème progressif selon votre TMI et type de revenus.', tag: 'Fiscal', color: '#38bdf8' },
  { icon: Layers, label: 'PEA vs CTO vs AV', desc: 'Simulez la fiscalité nette de chaque enveloppe d\'investissement sur la durée.', tag: 'Investissement', color: '#c084fc' },
  { icon: Percent, label: 'Taux d\'épargne', desc: 'Calculez et optimisez votre taux d\'épargne mensuel selon vos revenus et objectifs.', tag: 'Budget', color: '#34d399' },
  { icon: Star, label: 'Score Patrimonial', desc: 'Obtenez votre score global et des recommandations concrètes sur 6 piliers patrimoniaux.', tag: 'Patrimoine', color: '#f1c086' },
  { icon: Shield, label: 'Épargne de précaution', desc: 'Calculez le montant optimal de votre fonds d\'urgence selon vos charges, emploi et situation.', tag: 'Budget', color: '#fbbf24' },
  { icon: Wallet, label: 'Coût réel crédit conso', desc: 'TAEG → mensualité, coût total des intérêts, coût d\'opportunité vs placement alternatif.', tag: 'Fiscal', color: '#fb7185' },
  { icon: Building2, label: 'Succession & Donations', desc: 'DMTG par lien de parenté, abattements, barème progressif, optimisation renouvellement 15 ans.', tag: 'Fiscal', color: '#818cf8' },
  { icon: TrendingUp, label: 'Revenus passifs', desc: 'Simulez un portefeuille dividendes : revenu mensuel généré selon le capital et le rendement.', tag: 'Investissement', color: GOLD },
  { icon: BarChart3, label: 'Benchmarks', desc: 'Comparez la performance de votre portefeuille aux indices de référence (CAC 40, MSCI World…).', tag: 'Investissement', color: '#a3e635' },
]

const SECURITY = [
  { icon: Lock, title: 'Vos données sont chiffrées', desc: 'Toutes les transmissions sont sécurisées via HTTPS/TLS.' },
  { icon: EyeOff, title: 'Aucune donnée bancaire requise', desc: 'Aucun RIB, aucun accès à vos comptes. Zéro risque.' },
  { icon: Shield, title: 'Connexion sécurisée via Google', desc: 'OAuth 2.0 — vos identifiants ne transitent jamais par PatrImo.' },
  { icon: BarChart3, title: 'Vos simulations restent privées', desc: 'Stockées sur votre compte uniquement. Jamais partagées ni revendues.' },
]

const WHY = [
  { icon: Zap, title: 'Résultats en 2 secondes', desc: 'Manipulez les curseurs — chaque frappe met à jour le résultat instantanément. Zéro rechargement.' },
  { icon: Layers, title: '300 €/mois → 186 k€ en 20 ans', desc: 'Modèles validés sur 40+ scénarios réels : inflation, fiscalité française 2026, scénarios multiples.' },
  { icon: Star, title: 'Interface évidente', desc: 'Compris en 30 secondes sans formation. Un lycéen comme un DAF peut l\'utiliser immédiatement.' },
  { icon: EyeOff, title: 'Zéro pub, zéro tracking', desc: 'Aucune régie publicitaire, aucun pixel tiers, aucune revente de données. Jamais.' },
  { icon: Check, title: 'Jusqu\'à 5 000 €/an économisés', desc: 'Optimisez votre fiscalité (flat tax vs barème, PEA vs CTO) selon votre profil. Entièrement gratuit.' },
]

const HOW = [
  { step: '01', icon: Users, iconColor: '#34d399', title: 'Créez un compte', desc: 'En 30 secondes avec votre email ou votre compte Google. Aucune carte bancaire, aucune donnée bancaire.' },
  { step: '02', icon: Calculator, iconColor: '#818cf8', title: 'Lancez une simulation', desc: 'Choisissez parmi 18 simulateurs et renseignez vos paramètres en quelques clics. Résultats instantanés.' },
  { step: '03', icon: TrendingUp, iconColor: GOLD, title: 'Visualisez votre avenir', desc: 'Graphiques interactifs, synthèses détaillées et scénarios comparatifs pour prendre les meilleures décisions.' },
]

const ROADMAP = [
  // ── Disponible ──────────────────────────────────────────────────────────
  { status: 'done', label: 'Connexion Google OAuth', desc: 'Authentification sécurisée via Google' },
  { status: 'done', label: '32 simulateurs & outils', desc: 'Épargne, Immobilier, Fiscal, Budget, Patrimoine' },
  { status: 'done', label: 'Historique des simulations', desc: 'Sauvegarde et restauration des scénarios' },
  { status: 'done', label: 'Mode sombre / clair', desc: 'Personnalisation de l\'interface' },
  // Mars 2026
  { status: 'done', label: 'Tableau patrimonial complet', desc: 'Suivi de tous vos actifs (PEA, CTO, AV, PER, Livrets, Immobilier, Crypto, Cash) avec répartition globale et carte monde' },
  { status: 'done', label: 'Portefeuille temps réel', desc: 'Prix en direct via Finnhub (actions/ETF) + CoinGecko (crypto) — plus-values latentes calculées à la seconde' },
  { status: 'done', label: 'Score Patrimonial', desc: 'Jauge FIRE personnalisée : taux de couverture passif, diversification, score global sur 100' },
  { status: 'done', label: 'Flat Tax vs Barème IR', desc: 'Dividendes, plus-values, intérêts — selon votre TMI, simulation comparée PFU 30 % vs imposition au barème' },
  { status: 'done', label: 'Comparatif PEA / CTO / AV', desc: 'Simulation des 3 enveloppes sur la durée — fiscalité, retraits, performance nette après impôts' },
  { status: 'done', label: 'Partage de simulation', desc: 'Générez un lien public pour partager votre scénario — accès lecture sans compte requis' },
  { status: 'done', label: 'Glossaire financier contextuel', desc: 'Plus de 25 définitions (TMI, TAEG, PEA, FIRE…) accessibles en tooltip directement dans les calculateurs' },
  { status: 'done', label: 'Taux d\'intérêt actuels', desc: 'Widget landing avec les taux temps réel : Livret A, OAT 10 ans, BCE, immobilier — mis à jour quotidiennement' },
  // Avril 2026
  { status: 'done', label: 'Catégories patrimoniales', desc: 'Navigation par catégorie : Immobilier, Actions & Fonds, Livrets, Crypto, Comptes bancaires, Emprunts — chacune avec son dashboard dédié' },
  { status: 'done', label: 'Design système V6 Gold', desc: 'Refonte visuelle complète — palette or #f1c086, widget patrimoine avec sparkline, Brut / Dettes, barre FIRE, cohérence sur toutes les pages' },
  // Nouveaux calculateurs Avril 2026
  { status: 'done', label: 'Épargne d\'urgence', desc: 'Cible personnalisée selon charges, emploi et situation familiale — progression, mois couverts, conseil Livret A' },
  { status: 'done', label: 'Coût réel crédit conso', desc: 'TAEG → mensualité PMT, coût total des intérêts, coût d\'opportunité vs placement — tableau d\'amortissement' },
  { status: 'done', label: 'Succession & Donation', desc: 'DMTG par lien de parenté, abattements (100 k€ enfant), barème progressif, optimisation renouvellement 15 ans' },
  { status: 'done', label: 'Carnet d\'ordres & transactions', desc: 'Historique BUY/SELL/DIVIDEND par enveloppe, filtres, KPIs (investis, cédés, dividendes reçus)' },
  { status: 'done', label: 'Timeline patrimoine', desc: 'Snapshots manuels de la valeur globale — graphique d\'évolution historique interactive avec Recharts' },
  { status: 'done', label: 'Revenus passifs estimés', desc: 'Dividendes ETF, loyers, intérêts Livret — widget avec breakdown par source et projection annuelle' },
  { status: 'done', label: 'Connexion FIRE ↔ Patrimoine', desc: 'Import direct depuis vos enveloppes réelles vers le simulateur FIRE — synchronisation en un clic' },
  // ── En cours ────────────────────────────────────────────────────────────
  { status: 'wip', label: 'Export PDF avec branding', desc: 'Téléchargez vos simulations en PDF premium' },
  { status: 'wip', label: 'Livrets réglementés', desc: 'Livret A, LDDS, LEP — taux actuels, plafonds, comparaison et manque à gagner vs investissement' },
  { status: 'wip', label: 'Impact des frais', desc: 'ETF à 0,2 % vs fonds actif à 2 % sur 20 ans — la différence spectaculaire en chiffres' },
  { status: 'wip', label: 'Inflation & pouvoir d\'achat', desc: 'Valeur réelle de votre capital dans le temps, rendement minimum pour ne pas perdre en réel' },
  { status: 'wip', label: 'Remboursement de dettes', desc: 'Avalanche vs boule de neige — comparaison du coût total selon la stratégie' },
  { status: 'wip', label: 'Plus-value immobilière', desc: 'Abattements par durée de détention (22 ans IR, 30 ans PS), calcul avant vente' },
  { status: 'wip', label: 'SCPI', desc: 'Rendement brut/net, fiscalité foncière, comparaison achat direct, liquidité' },
  { status: 'wip', label: 'Déficit foncier', desc: 'Calcul de l\'économie d\'impôt pour les propriétaires réalisant des travaux' },
  { status: 'wip', label: 'Viager', desc: 'Bouquet et rente selon l\'espérance de vie — intérêt pour acheteur et vendeur' },
  { status: 'wip', label: 'Auto-entrepreneur / Freelance', desc: 'CA → revenu net après charges sociales, CFE et IR' },
  { status: 'wip', label: 'IFI', desc: 'Impôt sur la Fortune Immobilière — seuil 1,3 M€, calcul de la base taxable' },
  { status: 'wip', label: 'Stock-options / BSPCE / AGA', desc: 'Fiscalité des plans d\'actionnariat salarié, de plus en plus répandu en startup' },
  // ── À venir ─────────────────────────────────────────────────────────────
  { status: 'planned', label: 'Comparateur de scénarios', desc: '2 ou 3 simulations côte à côte sur un même graphique — la killer feature qui manque à tous les outils gratuits' },
  { status: 'planned', label: 'Calculatrice rapide (sidebar)', desc: 'Mini-calc toujours accessible sans quitter la page en cours' },
  { status: 'planned', label: 'Mode "reverse"', desc: '"J\'ai besoin de Y€ à la retraite, combien dois-je épargner par mois ?" — logique inversée très intuitive' },
  { status: 'planned', label: 'Alertes paramétrables', desc: '"Notifie-moi si le Livret A change", rappels d\'objectifs, emails automatiques' },
  { status: 'planned', label: 'Rapport mensuel par email', desc: 'Résumé de vos simulations et évolution de vos objectifs chaque mois' },
  { status: 'planned', label: 'Mode présentation', desc: 'Vue épurée pour montrer une simulation à son conseiller CGP ou banquier' },
  { status: 'planned', label: 'Articles & guides', desc: '"Comprendre le FI/RE", "PEA vs CTO : lequel choisir ?" — contenu pédagogique et SEO' },
  { status: 'planned', label: 'Application mobile native', desc: 'iOS & Android — accès où que vous soyez' },
  { status: 'planned', label: 'Intégrations bancaires', desc: 'Import automatique de vos données via Open Banking' },
]

const ROADMAP_PHASES = [
  { id: 'done' as const, label: 'Disponible', period: 'Q1 – Q2 2026', color: '#34d399', items: ROADMAP.filter(r => r.status === 'done') },
  { id: 'wip' as const, label: 'En cours', period: 'Q3 2026', color: GOLD, items: ROADMAP.filter(r => r.status === 'wip') },
  { id: 'planned' as const, label: 'À venir', period: 'Q4 2026 – 2027', color: '#9ca3af', items: ROADMAP.filter(r => r.status === 'planned') },
]

// ─── Floating financial icons ─────────────────────────────────────────────
const FLOAT_ICONS = [
  { Icon: Euro, x: 8, y: 15, size: 28, delay: 0, dur: 6, opacity: 0.14, color: GOLD },
  { Icon: TrendingUp, x: 88, y: 10, size: 30, delay: 1.2, dur: 5, opacity: 0.16, color: '#34d399' },
  { Icon: Home, x: 75, y: 60, size: 26, delay: 0.5, dur: 7, opacity: 0.14, color: '#a78bfa' },
  { Icon: PiggyBank, x: 5, y: 65, size: 24, delay: 2, dur: 5.5, opacity: 0.12, color: GOLD },
  { Icon: Percent, x: 92, y: 80, size: 22, delay: 1.5, dur: 6.5, opacity: 0.12, color: '#38bdf8' },
  { Icon: BarChart3, x: 50, y: 5, size: 22, delay: 0.8, dur: 4.5, opacity: 0.12, color: '#34d399' },
  { Icon: Building2, x: 20, y: 85, size: 22, delay: 3, dur: 6, opacity: 0.12, color: '#fb923c' },
  { Icon: Bitcoin, x: 60, y: 88, size: 20, delay: 2.5, dur: 5, opacity: 0.1, color: '#f1c086' },
]

// ─── Counter animation hook ───────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (time: number) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ─── Scroll reveal hook ───────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Mini chart previews for bento cards ─────────────────────────────────
function MiniCompound() {
  const W = 280, H = 88
  const valuePts = Array.from({ length: 30 }, (_, i) => {
    const t = i / 29
    return `${(t * W).toFixed(1)},${(H - 4 - Math.pow(t, 1.8) * (H - 14)).toFixed(1)}`
  })
  const investLine = `M 0,${(H - 4).toFixed(1)} L ${W},${(H - 4 - (H - 14) * 0.44).toFixed(1)}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 88, marginBottom: 4, display: 'block' }}>
      <defs>
        <linearGradient id="prv-cv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" /><stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`M 0,${H} L ${valuePts.join(' L ')} L ${W},${H} Z`} fill="url(#prv-cv)" />
      <path d={`M ${valuePts.join(' L ')}`} fill="none" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
      <path d={investLine} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="5,3" />
    </svg>
  )
}
function MiniFireChart() {
  const W = 280, H = 82
  const pts = Array.from({ length: 22 }, (_, i) => {
    const t = i / 21
    return `${(t * W).toFixed(1)},${(H - 6 - Math.pow(t, 1.4) * (H - 20)).toFixed(1)}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 82, marginBottom: 4, display: 'block' }}>
      <defs>
        <linearGradient id="prv-fg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.25" /><stop offset="100%" stopColor="#fb923c" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <line x1={0} y1={15} x2={W} y2={15} stroke="rgba(251,146,60,0.35)" strokeWidth="1" strokeDasharray="6,4" />
      <path d={`M 0,${H} L ${pts.join(' L ')} L ${W},${H} Z`} fill="url(#prv-fg)" />
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={W} cy={15} r={4.5} fill="#fb923c" opacity="0.9" />
    </svg>
  )
}
function MiniMortgage() {
  const bars = 9, W = 280, H = 78, gap = 5
  const bw = (W - (bars - 1) * gap) / bars
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, marginBottom: 4, display: 'block' }}>
      {Array.from({ length: bars }, (_, i) => {
        const t = i / (bars - 1)
        const intH = Math.round(Math.max(3, (1 - t) * 36 + 4))
        const capH = Math.round((0.9 - t * 0.4) * 30 + 7)
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={H - intH - capH} width={bw} height={intH} rx={2} fill="rgba(244,114,182,0.5)" />
            <rect x={x} y={H - capH} width={bw} height={capH} rx={2} fill="rgba(244,114,182,0.85)" />
          </g>
        )
      })}
    </svg>
  )
}

function MiniDCA() {
  const bars = 12, W = 280, H = 80, gap = 4
  const bw = (W - (bars - 1) * gap) / bars
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 80, display: 'block', marginBottom: 4 }}>
      <defs>
        <linearGradient id="prv-dca-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {Array.from({ length: bars }, (_, i) => {
        const h = ((i + 1) / bars) * (H - 14) + 4
        return <rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={2} fill="url(#prv-dca-g)" />
      })}
      <line x1={0} y1={H * 0.38} x2={W} y2={H * 0.38} stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" strokeDasharray="5,3" />
    </svg>
  )
}
function MiniAcheterVsLouer() {
  const W = 280, H = 80
  const buy = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return `${(t * W).toFixed(1)},${(H - 6 - Math.pow(t, 1.2) * (H - 14)).toFixed(1)}`
  })
  const rent = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return `${(t * W).toFixed(1)},${(H - 6 - t * 0.68 * (H - 14)).toFixed(1)}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 80, display: 'block', marginBottom: 4 }}>
      <defs>
        <linearGradient id="prv-avl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0,${H} L ${buy.join(' L ')} L ${W},${H} Z`} fill="url(#prv-avl-g)" />
      <path d={`M ${buy.join(' L ')}`} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M ${rent.join(' L ')}`} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" strokeOpacity="0.45" />
    </svg>
  )
}
function MiniLocatif() {
  const W = 280, H = 78, bars = 10, gap = 5
  const bw = (W - (bars - 1) * gap) / bars
  const cfs = [0.60, 0.62, -0.20, 0.64, 0.65, 0.63, 0.68, 0.66, 0.70, 0.72]
  const zeroY = H * 0.28
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke="rgba(45,212,191,0.15)" strokeWidth="1" />
      {cfs.map((cf, i) => {
        const h = Math.max(2, Math.abs(cf) * (H - zeroY - 4))
        return <rect key={i} x={i * (bw + gap)} y={cf >= 0 ? zeroY - h : zeroY} width={bw} height={h} rx={2} fill={cf >= 0 ? '#2dd4bf' : '#f87171'} opacity={cf >= 0 ? 0.75 : 0.65} />
      })}
    </svg>
  )
}
function MiniImpots() {
  const W = 280, H = 80
  const data = [
    { net: 0.72, ir: 0.14, ps: 0.14 },
    { net: 0.60, ir: 0.22, ps: 0.18 },
    { net: 0.48, ir: 0.32, ps: 0.20 },
  ]
  const cols = data.length, totalW = W / cols
  const bw = totalW * 0.6, offsetX = (totalW - bw) / 2
  const maxH = H - 12
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 80, display: 'block', marginBottom: 4 }}>
      {data.map((d, i) => {
        const x = i * totalW + offsetX
        const netH = d.net * maxH, irH = d.ir * maxH, psH = d.ps * maxH
        return (
          <g key={i}>
            <rect x={x} y={H - netH - irH - psH} width={bw} height={psH} rx={2} fill="rgba(251,113,133,0.45)" />
            <rect x={x} y={H - netH - irH} width={bw} height={irH} rx={2} fill="rgba(251,113,133,0.8)" />
            <rect x={x} y={H - netH} width={bw} height={netH} rx={2} fill="rgba(251,113,133,0.28)" />
          </g>
        )
      })}
    </svg>
  )
}
function MiniRetraite() {
  const W = 280, H = 80, retireAt = 0.65
  const accPts = Array.from({ length: 14 }, (_, i) => {
    const t = (i / 13) * retireAt
    return `${(t * W).toFixed(1)},${(H - 6 - Math.pow(t / retireAt, 1.6) * (H - 18)).toFixed(1)}`
  })
  const retireX = retireAt * W
  const topY = H - 6 - (H - 18) * 0.94
  const penY = H - 6 - (H - 18) * 0.55
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 80, display: 'block', marginBottom: 4 }}>
      <defs>
        <linearGradient id="prv-ret-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={retireX} y={topY} width={W - retireX} height={penY - topY} fill="rgba(251,191,36,0.08)" />
      <path d={`M 0,${H} L ${accPts.join(' L ')} L ${retireX},${H} Z`} fill="url(#prv-ret-g)" />
      <path d={`M ${accPts.join(' L ')}`} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinejoin="round" />
      <line x1={retireX} y1={topY} x2={W} y2={topY} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,3" strokeOpacity="0.4" />
      <line x1={retireX} y1={penY} x2={W} y2={penY} stroke="#fbbf24" strokeWidth="2" />
      <line x1={retireX} y1={6} x2={retireX} y2={H - 4} stroke="rgba(251,191,36,0.25)" strokeWidth="1" strokeDasharray="3,3" />
    </svg>
  )
}
function MiniBudget() {
  const W = 280, H = 78, barH = 24, y = (H - barH) / 2
  const segments = [
    { w: 0.50, opacity: 0.80, label: '50%', sub: 'Besoins' },
    { w: 0.30, opacity: 0.52, label: '30%', sub: 'Envies' },
    { w: 0.20, opacity: 0.32, label: '20%', sub: 'Épargne' },
  ]
  let x = 0
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      {segments.map((s, i) => {
        const sw = s.w * (W - 4); const rx = x; x += sw + 2
        return (
          <g key={i}>
            <rect x={rx} y={y} width={sw} height={barH} rx={4} fill="#a3e635" opacity={s.opacity} />
            <text x={rx + sw / 2} y={y + barH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="rgba(0,0,0,0.75)" fontSize="10" fontWeight="800">{s.label}</text>
            <text x={rx + sw / 2} y={y + barH + 11} textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="9">{s.sub}</text>
          </g>
        )
      })}
    </svg>
  )
}

function MiniFlatTax() {
  const W = 280, H = 80
  const data = [
    { ft: 0.30, br: 0.11 },
    { ft: 0.30, br: 0.30 },
    { ft: 0.30, br: 0.45 },
  ]
  const groupW = W / data.length, bw = groupW * 0.32, maxH = H - 12
  const refY = H - 0.30 * maxH
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 80, display: 'block', marginBottom: 4 }}>
      {data.map((d, i) => {
        const cx = (i + 0.5) * groupW
        return (
          <g key={i}>
            <rect x={cx - bw - 3} y={H - d.ft * maxH} width={bw} height={d.ft * maxH} rx={2} fill="rgba(56,189,248,0.85)" />
            <rect x={cx + 3} y={H - d.br * maxH} width={bw} height={d.br * maxH} rx={2} fill="rgba(56,189,248,0.35)" />
          </g>
        )
      })}
      <line x1={0} y1={refY} x2={W} y2={refY} stroke="rgba(56,189,248,0.5)" strokeWidth="1" strokeDasharray="4,3" />
    </svg>
  )
}
function MiniPEAvsCTO() {
  const W = 280, H = 80
  const pea = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return `${(t * W).toFixed(1)},${(H - 5 - Math.pow(t, 1.35) * (H - 14)).toFixed(1)}`
  })
  const av = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return `${(t * W).toFixed(1)},${(H - 5 - Math.pow(t, 1.45) * 0.88 * (H - 14)).toFixed(1)}`
  })
  const cto = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    return `${(t * W).toFixed(1)},${(H - 5 - Math.pow(t, 1.55) * 0.76 * (H - 14)).toFixed(1)}`
  })
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 80, display: 'block', marginBottom: 4 }}>
      <defs>
        <linearGradient id="prv-pea-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0,${H} L ${pea.join(' L ')} L ${W},${H} Z`} fill="url(#prv-pea-g)" />
      <path d={`M ${pea.join(' L ')}`} fill="none" stroke="#c084fc" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M ${av.join(' L ')}`} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="4,2" strokeOpacity="0.55" strokeLinejoin="round" />
      <path d={`M ${cto.join(' L ')}`} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="2,2" strokeOpacity="0.32" strokeLinejoin="round" />
    </svg>
  )
}
function MiniTauxEpargne() {
  const W = 280, H = 78, bars = 8, gap = 6
  const bw = (W - (bars - 1) * gap) / bars
  const rates = [0.18, 0.22, 0.15, 0.25, 0.28, 0.20, 0.30, 0.32]
  const maxH = H - 10
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      {rates.map((r, i) => {
        const saveH = r * maxH, expH = (1 - r) * maxH
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={H - saveH - expH} width={bw} height={expH} rx={2} fill="rgba(52,211,153,0.18)" />
            <rect x={x} y={H - saveH} width={bw} height={saveH} rx={2} fill="#34d399" opacity={0.8} />
          </g>
        )
      })}
    </svg>
  )
}
function MiniScore() {
  const W = 280, H = 84, score = 73
  const cx = W * 0.36, cy = H * 0.52, r = 27, sw = 7
  const perim = 2 * Math.PI * r
  const arcLen = 0.67 * perim
  const filledLen = (score / 100) * arcLen
  const rot = -90 - 0.67 * 180
  const pillars = [0.75, 0.60, 0.82, 0.90, 0.55, 0.70]
  const pillarColors = ['#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#fb923c', '#a78bfa']
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 84, display: 'block', marginBottom: 4 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth={sw}
        strokeDasharray={`${arcLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${filledLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
      <text x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle" fill={GOLD} fontSize="17" fontWeight="800">{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="8">/ 100</text>
      {pillars.map((h, i) => (
        <rect key={i} x={W * 0.62 + i * 17} y={H - 6 - h * (H - 18)} width={11} height={h * (H - 18)} rx={3} fill={pillarColors[i]} opacity={0.6} />
      ))}
    </svg>
  )
}

function MiniEmergencyFund() {
  const W = 280, H = 78, barY = 22, barH = 16, pct = 0.62
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      <rect x={0} y={barY} width={W} height={barH} rx={barH / 2} fill="rgba(251,191,36,0.10)" />
      <rect x={0} y={barY} width={pct * W} height={barH} rx={barH / 2} fill="#fbbf24" opacity={0.75} />
      <text x={pct * W + 8} y={barY + barH / 2 + 4} fontSize="11" fontWeight="700" fill="#fbbf24">62 %</text>
      {[1, 3, 6].map((m, i) => (
        <g key={i}>
          <line x1={m / 6 * W} y1={barY + barH + 4} x2={m / 6 * W} y2={barY + barH + 10} stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
          <text x={m / 6 * W} y={barY + barH + 20} fontSize="8" textAnchor="middle" fill="rgba(0,0,0,0.35)">{m} mois</text>
        </g>
      ))}
      <text x={0} y={H - 2} fontSize="9" fill="rgba(0,0,0,0.4)">Objectif : 6 mois de charges</text>
    </svg>
  )
}
function MiniConsumerCredit() {
  const bars = 8, W = 280, H = 78, gap = 5
  const bw = (W - (bars - 1) * gap) / bars
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      {Array.from({ length: bars }, (_, i) => {
        const t = i / (bars - 1)
        const intH = Math.round(Math.max(3, (1 - t) * 36 + 4))
        const capH = Math.round((0.9 - t * 0.4) * 28 + 8)
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={H - intH - capH} width={bw} height={intH} rx={2} fill="rgba(251,113,133,0.5)" />
            <rect x={x} y={H - capH} width={bw} height={capH} rx={2} fill="rgba(251,113,133,0.82)" />
          </g>
        )
      })}
    </svg>
  )
}
function MiniSuccession() {
  const W = 280, H = 78
  const data = [{ h: 58, label: 'Enfant' }, { h: 40, label: 'Frère' }, { h: 26, label: 'Neveu' }, { h: 16, label: 'Tiers' }]
  const bw = W / data.length - 8
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      {data.map((d, i) => (
        <g key={i}>
          <rect x={i * (W / data.length) + 4} y={H - 14 - d.h} width={bw} height={d.h} rx={3} fill="#818cf8" opacity={0.75 - i * 0.1} />
          <text x={i * (W / data.length) + 4 + bw / 2} y={H - 2} fontSize="8" textAnchor="middle" fill="rgba(0,0,0,0.4)">{d.label}</text>
        </g>
      ))}
    </svg>
  )
}
function MiniDividends() {
  const bars = 10, W = 280, H = 78, gap = 5
  const bw = (W - (bars - 1) * gap) / bars
  const amounts = [0.30, 0.34, 0.38, 0.42, 0.46, 0.50, 0.55, 0.60, 0.65, 0.72]
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ height: 78, display: 'block', marginBottom: 4 }}>
      {amounts.map((a, i) => (
        <rect key={i} x={i * (bw + gap)} y={H - a * (H - 10)} width={bw} height={a * (H - 10)} rx={2} fill={GOLD} opacity={0.45 + (i / amounts.length) * 0.45} />
      ))}
    </svg>
  )
}
function MiniBenchmark() {
  const W = 280, H = 78
  const mkPts = (fn: (t: number) => number) => Array.from({ length: 18 }, (_, i) => { const t = i / 17; return `${(t * W).toFixed(1)},${(H - 6 - fn(t) * (H - 14)).toFixed(1)}` })
  const portfolio = mkPts(t => Math.pow(t, 1.05) * 0.96)
  const world = mkPts(t => Math.pow(t, 1.2) * 0.82)
  const cac = mkPts(t => t * 0.65 + t * t * 0.12)
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 78, display: 'block', marginBottom: 4 }}>
      <path d={`M ${portfolio.join(' L ')}`} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M ${world.join(' L ')}`} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,2" strokeLinejoin="round" />
      <path d={`M ${cac.join(' L ')}`} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="2,2" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Bento featured card ──────────────────────────────────────────────────
function BentoFeaturedCard({ mod, preview }: { mod: typeof MODULES[0]; preview: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href="/login" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#f9fafb' : '#ffffff',
          border: `1px solid ${hovered ? mod.color + '50' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: 20, overflow: 'hidden',
          transition: 'all 0.25s',
          transform: hovered ? 'translateY(-4px)' : '',
          boxShadow: hovered ? `0 20px 56px ${mod.color}20, 0 4px 16px rgba(0,0,0,0.06)` : '0 1px 4px rgba(0,0,0,0.05)',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 0', background: `linear-gradient(160deg, ${hovered ? mod.color + '12' : mod.color + '08'}, transparent 55%)`, transition: 'background 0.25s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: hovered ? mod.color + '28' : mod.color + '14', border: `1px solid ${hovered ? mod.color + '45' : mod.color + '22'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
              <mod.icon style={{ width: 15, height: 15, color: mod.color, opacity: hovered ? 1 : 0.7, transition: 'opacity 0.25s' }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: hovered ? mod.color + 'cc' : mod.color + '66', transition: 'color 0.25s' }}>{mod.tag}</span>
          </div>
          {preview}
        </div>
        <div style={{ padding: '12px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{mod.label}</h3>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.65, marginBottom: 14, flex: 1 }}>{mod.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: hovered ? mod.color : '#9ca3af', transition: 'color 0.2s' }}>
            <span>Ouvrir</span><ArrowRight style={{ width: 11, height: 11 }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Section divider ─────────────────────────────────────────────────────
function SectionDivider({ color = 'rgba(241,192,134,0.12)' }: { color?: string }) {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${color} 25%, rgba(0,0,0,0.04) 50%, ${color} 75%, transparent)`,
      margin: '0 auto',
      maxWidth: 900,
    }} />
  )
}

// ─── Section wrapper with reveal ─────────────────────────────────────────
function RevealSection({ children, delay = 0, style: extraStyle }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...extraStyle,
    }}>
      {children}
    </div>
  )
}

// ─── Tag badge ────────────────────────────────────────────────────────────
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'transparent', border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
      {children}
    </div>
  )
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────
function FaqItem({ q, a, gold, goldBorder }: { q: string; a: string; gold: string; goldBorder: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${open ? goldBorder : 'rgba(0,0,0,0.08)'}`, background: open ? `rgba(241,192,134,0.06)` : '#ffffff', transition: 'all 0.2s', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: open ? gold : '#111827', transition: 'color 0.2s' }}>{q}</span>
        <span style={{ fontSize: 18, color: open ? gold : '#9ca3af', flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s, color 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 18px', fontSize: 14, color: '#4b5563', lineHeight: 1.75 }}>{a}</div>
      )}
    </div>
  )
}

// ─── Dashboard Preview (mini) ─────────────────────────────────────────────
// ─── Scroll indicator (RefractWeb style) ─────────────────────────────────
function HeroScrollIndicator() {
  return (
    <div style={{
      position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase',
        color: '#9ca3af',
        fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
      }}>Scroll</span>
      <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden', borderRadius: 1 }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 12,
          background: 'linear-gradient(to bottom, rgba(241,192,134,0.7), transparent)',
          borderRadius: 1,
          animation: 'scroll-dot 1.8s cubic-bezier(0.4,0,0.2,1) infinite',
        }} />
      </div>
    </div>
  )
}

// ─── Product Showcase (replaces DashboardPreview) ─────────────────────────
function ProductShowcase() {
  const [phase, setPhase] = useState(0) // 0=input, 1=results, 2=export
  const phases = ['Simulation', 'Résultats', 'Export PDF']

  useEffect(() => {
    const timer = setInterval(() => setPhase(p => (p + 1) % 3), 4000)
    return () => clearInterval(timer)
  }, [])

  const chartPts = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19
    const y = 72 - Math.pow(t, 1.7) * 60
    return `${(t * 260).toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', padding: '0 16px' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: -40, background: `radial-gradient(ellipse at 50% 60%, rgba(241,192,134,0.08) 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: -1, borderRadius: 22, background: 'linear-gradient(135deg, rgba(241,192,134,0.15), rgba(255,255,255,0.04), transparent)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Browser frame */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 48px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(241,192,134,0.06)', zIndex: 1 }}>

        {/* Browser chrome */}
        <div style={{ background: '#f8f9fc', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['rgba(255,96,96,0.5)', 'rgba(255,189,0,0.45)', 'rgba(40,200,80,0.4)'].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* URL bar */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 7, padding: '5px 14px', fontSize: 11, color: '#6b7280', textAlign: 'center', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>
            <span style={{ color: '#d1d5db' }}>https://</span>finance.digitalstack.cloud<span style={{ color: GOLD + '99' }}>/simulateurs/interets-composes</span>
          </div>
          {/* Phase tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {phases.map((p, i) => (
              <div key={p} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, letterSpacing: '0.01em', background: i === phase ? 'rgba(241,192,134,0.15)' : 'transparent', color: i === phase ? GOLD : 'rgba(255,255,255,0.2)', border: i === phase ? `1px solid ${GOLD}30` : '1px solid transparent', transition: 'all 0.3s' }}>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* App shell */}
        <div style={{ display: 'flex', height: 420, background: '#080808' }}>

          {/* Sidebar */}
          <div style={{ width: 168, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: '#060606', padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px 14px', marginBottom: 4 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 12, height: 12, color: '#0a0a0a' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>PatrImo</span>
            </div>
            {[
              { label: 'Tableau de bord', active: false },
              { label: 'Intérêts Composés', active: true },
              { label: 'DCA', active: false },
              { label: 'FI/RE', active: false },
              { label: 'Immobilier', active: false, header: true },
              { label: 'Crédit Immo', active: false },
              { label: 'Patrimoine', active: false, header: true },
              { label: 'Vue globale', active: false },
            ].map((item, i) => item.header
              ? <p key={i} style={{ fontSize: 8.5, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 8px 2px', margin: 0 }}>{item.label}</p>
              : <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 7, fontSize: 11, color: item.active ? '#fff' : 'rgba(255,255,255,0.28)', background: item.active ? 'rgba(241,192,134,0.12)' : 'transparent', borderLeft: item.active ? `2px solid ${GOLD}` : '2px solid transparent' }}>
                  {item.active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />}
                  <span>{item.label}</span>
                </div>
            )}
          </div>

          {/* Main content — animated phases */}
          <div style={{ flex: 1, padding: '18px 20px', overflow: 'hidden', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 3px' }}>Simulateur</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Intérêts Composés</p>
              </div>
              {/* Export button - glows in phase 2 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: phase === 2 ? GOLD : 'rgba(255,255,255,0.05)',
                color: phase === 2 ? '#000' : 'rgba(255,255,255,0.35)',
                border: phase === 2 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: phase === 2 ? `0 0 24px ${GOLD}60` : 'none',
                transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <FileText style={{ width: 12, height: 12 }} />
                Export PDF
              </div>
            </div>

            {/* Phase 0 — inputs */}
            <div style={{ opacity: phase === 0 ? 1 : 0, position: phase === 0 ? 'relative' : 'absolute', top: phase === 0 ? 'auto' : 0, left: 0, right: 0, transition: 'opacity 0.4s', pointerEvents: phase === 0 ? 'all' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Capital initial', value: '10 000 €', accent: true },
                  { label: 'Versement mensuel', value: '300 €', accent: false },
                  { label: 'Rendement annuel', value: '7 %', accent: false },
                  { label: 'Durée', value: '20 ans', accent: false },
                ].map(f => (
                  <div key={f.label} style={{ background: '#0f0f0f', border: `1px solid ${f.accent ? GOLD + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>{f.label}</p>
                    <p style={{ fontSize: 17, fontWeight: 700, color: f.accent ? GOLD : '#fff', letterSpacing: '-0.02em', margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 2, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '65%', background: `linear-gradient(to right, #34d399, ${GOLD})`, borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: '65%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', border: `2px solid ${GOLD}`, boxShadow: `0 0 10px ${GOLD}60` }} />
                </div>
                <span style={{ fontSize: 11, color: '#4b5563', whiteSpace: 'nowrap' }}>Durée: 20 ans</span>
              </div>
            </div>

            {/* Phase 1 — results */}
            <div style={{ opacity: phase === 1 ? 1 : 0, position: phase === 1 ? 'relative' : 'absolute', top: phase === 1 ? 'auto' : 0, left: 0, right: 0, transition: 'opacity 0.4s', pointerEvents: phase === 1 ? 'all' : 'none' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'Capital final', value: '186 420 €', color: GOLD, big: true },
                  { label: 'Total versé', value: '82 000 €', color: '#374151' },
                  { label: 'Intérêts générés', value: '104 420 €', color: '#34d399' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#0f0f0f', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 10, padding: '11px 13px' }}>
                    <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>{s.label}</p>
                    <p style={{ fontSize: s.big ? 16 : 14, fontWeight: 700, color: s.color, letterSpacing: '-0.025em', margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Chart */}
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Évolution du capital</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[['#34d399', 'Versements'], [GOLD, 'Intérêts']].map(([c, l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#6b7280' }}>
                        <div style={{ width: 8, height: 2, borderRadius: 1, background: c }} />
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <svg viewBox="0 0 270 80" width="100%" height={80} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline points={chartPts} fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={`0,72 ${chartPts} 260,80 0,80`} fill="url(#cg1)" stroke="none" />
                  {/* Last point glow */}
                  <circle cx="260" cy="12" r="4" fill={GOLD} opacity="0.9" />
                  <circle cx="260" cy="12" r="8" fill={GOLD} opacity="0.15" />
                </svg>
              </div>
            </div>

            {/* Phase 2 — PDF export */}
            <div style={{ opacity: phase === 2 ? 1 : 0, position: phase === 2 ? 'relative' : 'absolute', top: phase === 2 ? 'auto' : 0, left: 0, right: 0, transition: 'opacity 0.4s', pointerEvents: phase === 2 ? 'all' : 'none' }}>
              {/* PDF preview card */}
              <div style={{ background: 'linear-gradient(145deg, #111 0%, #0d0900 100%)', border: `1px solid ${GOLD}35`, borderRadius: 16, padding: '20px 22px', marginBottom: 10, boxShadow: `0 0 48px ${GOLD}14, inset 0 1px 0 rgba(255,255,255,0.04)` }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {/* File icon */}
                  <div style={{ width: 42, height: 50, borderRadius: 8, background: `linear-gradient(145deg, #1e0c00, #2e1800)`, border: `1px solid ${GOLD}45`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0, boxShadow: `0 4px 20px ${GOLD}25` }}>
                    <FileText style={{ width: 15, height: 15, color: GOLD }} />
                    <span style={{ fontSize: 7, fontWeight: 800, color: GOLD, letterSpacing: '0.06em' }}>PDF</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', margin: '0 0 5px', letterSpacing: '-0.015em', lineHeight: 1.3 }}>Simulation — Intérêts Composés</p>
                    <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, letterSpacing: '0.01em' }}>20 mars 2026 · PatrImo</p>
                  </div>
                  <div style={{ padding: '5px 11px', borderRadius: 100, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.28)', fontSize: 9, color: '#34d399', fontWeight: 700, letterSpacing: '0.03em', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399' }} />
                    Prêt
                  </div>
                </div>
                {/* KPI rows */}
                {[
                  { l: 'Capital final',  v: '186 420 €', c: GOLD,                        bold: true  },
                  { l: 'Total versé',    v: '82 000 €',  c: 'rgba(255,255,255,0.55)',     bold: false },
                  { l: 'Gain net',       v: '104 420 €', c: '#34d399',                   bold: true  },
                ].map(({ l, v, c, bold }, idx, arr) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: idx < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.01em' }}>{l}</span>
                    <span style={{ fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 600, color: c, letterSpacing: '-0.02em' }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: `linear-gradient(135deg, ${GOLD} 0%, #c8922a 100%)`, color: '#000', fontSize: 11.5, fontWeight: 700, textAlign: 'center', boxShadow: `0 8px 28px ${GOLD}45`, letterSpacing: '-0.01em' }}>
                  Télécharger le PDF
                </div>
                <div style={{ padding: '11px 20px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.09)', fontSize: 11, color: '#4b5563', fontWeight: 500 }}>
                  Partager
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ position: 'absolute', inset: -16, background: 'linear-gradient(to top, rgba(241,192,134,0.06), transparent)', borderRadius: 32, filter: 'blur(20px)' }} />
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        {/* Browser bar */}
        <div style={{ background: '#030303', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, margin: '0 12px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#9ca3af', textAlign: 'center', fontFamily: 'monospace' }}>
            finance.digitalstack.cloud/dashboard
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: 'flex', height: 400, background: '#080808' }}>
          {/* Sidebar */}
          <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: '#060606', display: 'flex', flexDirection: 'column', padding: '14px 8px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 14px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 13, height: 13, color: '#0a0a0a' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>PatrImo</span>
            </div>
            {/* Nav items */}
            {[
              { label: 'Accueil', active: true },
              { label: 'Intérêts', active: false },
              { label: 'DCA', active: false },
              { label: 'FI/RE', active: false },
              { label: 'Immobilier', active: false, header: true },
              { label: 'Achat/Loc', active: false },
            ].map((item, i) => (
              item.header ? (
                <p key={i} style={{ fontSize: 9, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 2px', fontWeight: 600 }}>{item.label}</p>
              ) : (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 7, fontSize: 11, color: item.active ? '#fff' : 'rgba(255,255,255,0.3)', background: item.active ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: 1 }}>
                  <span>{item.label}</span>
                  {item.active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f1c086' }} />}
                </div>
              )
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>Bonsoir, jeremy</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Tableau de bord</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              {[{ l: 'Simulations', v: '12' }, { l: 'Cette semaine', v: '3' }, { l: 'Module favori', v: 'FI/RE' }].map(s => (
                <div key={s.l} style={{ background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.l}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {/* Bar chart */}
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Activité</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 44 }}>
                  {[20,35,15,52,28,62,40,55,32,70,45,85].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: i === 11 ? '#f1c086' : 'rgba(241,192,134,0.2)' }} />
                  ))}
                </div>
              </div>
              {/* Donut */}
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Répartition</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'conic-gradient(#34d399 0 30%, #38bdf8 30% 55%, #fb923c 55% 70%, #a78bfa 70% 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#0f0f0f' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[['#34d399','Composés'],['#38bdf8','DCA'],['#fb923c','FI/RE']].map(([c,l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                        <span style={{ fontSize: 9, color: '#6b7280' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modules preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {[
                { color: '#34d399', name: 'Intérêts Composés', tag: 'ÉPARGNE' },
                { color: '#38bdf8', name: 'DCA', tag: 'ÉPARGNE' },
                { color: '#fb923c', name: 'FI/RE', tag: 'ÉPARGNE' },
              ].map(m => (
                <div key={m.name} style={{ background: '#0f0f0f', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: 10, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 0% 0%, ${m.color}12, transparent 55%)` }} />
                  <p style={{ fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, position: 'relative' }}>{m.tag}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', position: 'relative' }}>{m.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Live Rates Widget ────────────────────────────────────────────────────
interface RateItem { value: number; label: string; unit: string; trend: 'up' | 'down' | 'stable' }
interface RatesData {
  livretA: RateItem; ldds: RateItem; lep: RateItem
  oat10y: RateItem; bce: RateItem; inflation: RateItem
  immo10y?: RateItem; immo15y: RateItem; immo20y: RateItem; immo25y: RateItem; creditConso: RateItem
  live?: { oat: boolean; bce: boolean }
  updatedAt?: string
}

function RateBigCard({ label, value, sublabel, color, cta, trend }: {
  label: string; value: number; sublabel: string; color: string
  cta?: { text: string; href: string }; trend?: 'up' | 'down' | 'stable'
}) {
  const [hov, setHov] = useState(false)
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? '#f87171' : trend === 'down' ? '#34d399' : '#9ca3af'
  const trendLabel = trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 'min(100%, 200px)',
        background: hov ? 'rgba(0,0,0,0.04)' : '#ffffff',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hov ? color + '45' : 'rgba(0,0,0,0.09)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 18, padding: '22px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 5,
        transition: 'all 0.2s',
        boxShadow: hov ? `0 16px 48px ${color}28` : 'none',
      }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.03em', lineHeight: 1.4 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '4px 0 2px' }}>
        <span style={{ fontSize: 'clamp(34px,4vw,50px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value.toFixed(2).replace('.', ',')}
        </span>
        <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>%</span>
      </div>
      <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>{sublabel}</span>
      {trend && (
        <span style={{ fontSize: 11, color: trendColor, marginTop: 2 }}>{trendIcon} {trendLabel}</span>
      )}
      {cta && (
        <Link href={cta.href}
          style={{ marginTop: 10, padding: '10px 18px', borderRadius: 100, background: color, color: '#000', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {cta.text}
        </Link>
      )}
    </div>
  )
}

// Taux historiques annuels 2015–2025 (données indicatives)
const RATE_YEARS = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025']
const RATE_HISTORY = {
  livretA:   [1.0,  0.75, 0.75, 0.75, 0.75, 0.5,   0.5,  1.0,  3.0,  3.0,  2.4 ],
  ldds:      [1.0,  0.75, 0.75, 0.75, 0.75, 0.5,   0.5,  1.0,  3.0,  3.0,  2.4 ],
  lep:       [1.25, 1.0,  1.0,  1.25, 1.25, 1.0,   1.0,  2.2,  6.1,  5.0,  3.5 ],
  pel:       [2.5,  1.5,  1.0,  1.0,  1.0,  1.0,   1.0,  1.0,  2.0,  2.25, 1.75],
  immo10y:   [1.85, 1.55, 1.45, 1.3,  1.1,  0.9,   0.85, 1.05, 2.35, 3.35, 2.9 ],
  immo15y:   [2.1,  1.75, 1.65, 1.5,  1.3,  1.1,   1.0,  1.2,  2.6,  3.6,  3.1 ],
  immo20y:   [2.35, 1.95, 1.85, 1.65, 1.5,  1.2,   1.1,  1.4,  2.85, 3.8,  3.3 ],
  immo25y:   [2.55, 2.15, 2.05, 1.85, 1.65, 1.35,  1.2,  1.6,  3.05, 4.0,  3.5 ],
  oat10y:    [0.87, 0.68, 0.78, 0.71, 0.12, -0.34, -0.2, 0.2,  2.56, 2.98, 3.45],
  bce:       [0.05, 0.0,  0.0,  0.0,  0.0,  0.0,   0.0,  0.5,  4.0,  4.5,  2.65],
  inflation: [0.0,  0.2,  1.0,  1.8,  1.1,  0.5,   1.6,  5.2,  4.9,  2.1,  1.1 ],
  conso:     [4.5,  4.2,  4.0,  3.9,  3.7,  3.5,   3.5,  4.0,  5.5,  6.0,  5.8 ],
}

function MiniSparkline({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const W = 300, H = 52, PAD = 2
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const toY = (v: number) => H - 4 - ((v - min) / range) * (H - 12)
  const pts = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const area = pts + ` L${toX(data.length - 1)},${H} L${toX(0)},${H} Z`
  const gid = `sg-${uid}`

  const tipW = 80, tipH = 22
  const tipX = hoverIdx !== null
    ? Math.min(Math.max(toX(hoverIdx) - tipW / 2, 0), W - tipW)
    : 0

  return (
    <svg
      width="100%" height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', cursor: 'crosshair', overflow: 'visible' }}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        setHoverIdx(Math.round(xPct * (data.length - 1)))
      }}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={pts} stroke={color} strokeWidth={1.5} fill="none" />
      {hoverIdx !== null && (
        <>
          <line x1={toX(hoverIdx)} y1={0} x2={toX(hoverIdx)} y2={H} stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
          <circle cx={toX(hoverIdx)} cy={toY(data[hoverIdx])} r={3.5} fill={color} />
          <g transform={`translate(${tipX}, -28)`}>
            <rect width={tipW} height={tipH} rx={5} fill="#0d0d0d" stroke={color} strokeOpacity={0.5} strokeWidth={1} />
            <text x={tipW / 2} y={14} textAnchor="middle" fontSize={10}
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif">
              <tspan fill="#9ca3af">{RATE_YEARS[hoverIdx]} · </tspan>
              <tspan fill={color} fontWeight="700">{data[hoverIdx].toFixed(2)} %</tspan>
            </text>
          </g>
        </>
      )}
    </svg>
  )
}

function RateRow({ name, rate, sublabel, note, trend, color, bold = false, sparkData }: {
  name: string; rate: string; sublabel?: string; note?: string; trend?: 'up'|'down'|'stable'; color: string; bold?: boolean; sparkData?: number[]
}) {
  const trendEl = trend === 'up'
    ? <TrendingUp style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
    : trend === 'down'
    ? <TrendingUp style={{ width: 14, height: 14, color: '#34d399', transform: 'rotate(180deg)', flexShrink: 0 }} />
    : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
  return (
    <div style={{ borderRadius: 12, background: 'rgba(0,0,0,0.015)', transition: 'background 0.15s', overflow: 'hidden' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.015)')}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{name}</span>
            {note && <span style={{ fontSize: 11, color: '#6b7280' }}>({note})</span>}
          </div>
          {sublabel && <span style={{ fontSize: 11, color: '#6b7280' }}>{sublabel}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: bold ? 22 : 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{rate}</span>
          {trendEl}
        </div>
      </div>
      {sparkData && (
        <div style={{ padding: '0 12px 8px' }}>
          <MiniSparkline data={sparkData} color={color} uid={`${name}${sublabel ?? ''}`.toLowerCase().replace(/[^a-z0-9]/g, '')} />
        </div>
      )}
    </div>
  )
}

function RatePanel({ title, icon: Icon, iconColor, iconBg, children, footer }: {
  title: string; icon: React.ElementType; iconColor: string; iconBg: string;
  children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div style={{
      flex: 1, minWidth: 280,
      background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 20, height: 20, color: iconColor }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{title}</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {children}
      </div>
      {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
    </div>
  )
}

function RatesWidget() {
  const [rates, setRates] = useState<RatesData | null>(null)
  useEffect(() => {
    fetch('/api/rates').then(r => r.ok ? r.json() : null).then(d => { if (d) setRates(d) }).catch(() => {})
  }, [])

  const fmt = (v: number) => v.toFixed(2).replace('.', ',') + ' %'

  return (
    <section id="rates" style={{ padding: '80px 20px 100px' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>

        {/* Header */}
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <SectionTag>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              Mis à jour automatiquement
            </SectionTag>
            <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
              Les taux qui pilotent vos{' '}
              <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>décisions financières</span>
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Données indicatives · mise à jour automatique chaque heure
              {rates?.live?.oat || rates?.live?.bce
                ? <span style={{ marginLeft: 10, color: '#34d399', fontSize: 12 }}>● Temps réel</span>
                : null}
              {rates?.updatedAt && (() => {
                const d = new Date(rates.updatedAt!)
                const pad = (n: number) => String(n).padStart(2, '0')
                const stamp = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} à ${pad(d.getHours())}h${pad(d.getMinutes())}`
                return <span style={{ marginLeft: 10, fontSize: 11, color: '#d1d5db' }}>Mis à jour le {stamp}</span>
              })()}
            </p>
          </div>
        </RevealSection>

        {!rates ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#e5e7eb', fontSize: 13 }}>Chargement des taux…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Panel 1 — Épargne réglementée */}
            <RevealSection delay={0} style={{ flex: '1 1 280px' }}>
              <RatePanel title="Épargne réglementée" icon={PiggyBank} iconColor="#34d399" iconBg="rgba(52,211,153,0.1)"
                footer={
                  <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.08)' }}>
                    Simuler mes intérêts <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                }>
                <RateRow name="Livret A" rate={fmt(rates.livretA.value)} sublabel="Plafond 22 950 €" trend={rates.livretA.trend} color="#34d399" bold sparkData={RATE_HISTORY.livretA} />
                <RateRow name="LDDS" rate={fmt(rates.ldds.value)} sublabel="Plafond 12 000 €" trend={rates.ldds.trend} color="#34d399" bold sparkData={RATE_HISTORY.ldds} />
                <RateRow name="LEP" rate={fmt(rates.lep.value)} sublabel="Plafond 10 000 €" note="sous conditions" trend={rates.lep.trend} color="#34d399" bold sparkData={RATE_HISTORY.lep} />
                <RateRow name="PEL" rate="1,75 %" sublabel="Plafond 61 200 €" note="ouverture 2024+" trend="down" color="#34d399" bold sparkData={RATE_HISTORY.pel} />
              </RatePanel>
            </RevealSection>

            {/* Panel 2 — Crédit immobilier */}
            <RevealSection delay={80} style={{ flex: '1 1 280px' }}>
              <RatePanel
                title="Crédit immobilier"
                icon={Home} iconColor={GOLD} iconBg={GOLD_DARK}
                footer={
                  <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(241,192,134,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = GOLD_DARK }}>
                    Simuler mon prêt <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                }>
                <RateRow name="Meilleur taux" sublabel="sur 10 ans" rate={fmt(rates.immo10y?.value ?? 2.9)} trend={rates.immo10y?.trend ?? 'down'} color={GOLD} bold sparkData={RATE_HISTORY.immo10y} />
                <RateRow name="Meilleur taux" sublabel="sur 15 ans" rate={fmt(rates.immo15y.value)} trend={rates.immo15y.trend} color={GOLD} bold sparkData={RATE_HISTORY.immo15y} />
                <RateRow name="Meilleur taux" sublabel="sur 20 ans" rate={fmt(rates.immo20y.value)} trend={rates.immo20y.trend} color={GOLD} bold sparkData={RATE_HISTORY.immo20y} />
                <RateRow name="Meilleur taux" sublabel="sur 25 ans" rate={fmt(rates.immo25y.value)} trend={rates.immo25y.trend} color={GOLD} bold sparkData={RATE_HISTORY.immo25y} />
              </RatePanel>
            </RevealSection>

            {/* Panel 3 — Marchés & Macro */}
            <RevealSection delay={160} style={{ flex: '1 1 280px' }}>
              <RatePanel title="Marchés & Macro" icon={TrendingUp} iconColor="#fbbf24" iconBg="rgba(251,191,36,0.1)"
                footer={
                  <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)' }}>
                    Comparer PEA · CTO · AV <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                }>
                <RateRow name="OAT 10 ans" sublabel={rates.live?.oat ? "Obligation d'État · Live" : "Obligation d'État"} rate={fmt(rates.oat10y.value)} trend={rates.oat10y.trend} color="#38bdf8" sparkData={RATE_HISTORY.oat10y} />
                <RateRow name="Taux BCE" sublabel={rates.live?.bce ? 'BCE · Live' : 'Banque Centrale Européenne'} rate={fmt(rates.bce.value)} trend={rates.bce.trend} color="#a78bfa" sparkData={RATE_HISTORY.bce} />
                <RateRow name="Inflation FR" sublabel="Indice des prix" rate={fmt(rates.inflation.value)} trend={rates.inflation.trend} color="#fb923c" sparkData={RATE_HISTORY.inflation} />
                <RateRow name="Crédit conso" sublabel="Taux moyen" rate={fmt(rates.creditConso.value)} trend={rates.creditConso.trend} color="#f87171" sparkData={RATE_HISTORY.conso} />
              </RatePanel>
            </RevealSection>
          </div>
        )}

      </div>
    </section>
  )
}

// ─── Social Proof Bar ─────────────────────────────────────────────────────
function SocialProofBar() {
  const { ref, visible } = useInView(0.2)
  const count = useCountUp(12843, 2200, visible)
  const hours = useCountUp(19264, 2400, visible)
  return (
    <section style={{ padding: '0 20px 72px' }}>
      <div ref={ref} style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: 20, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          {[
            { value: visible ? count.toLocaleString('fr-FR') : '0', label: 'Simulations lancées ce mois', color: GOLD },
            { value: visible ? `${hours.toLocaleString('fr-FR')} h` : '0 h', label: 'Économisées vs Excel ce mois', color: '#34d399' },
            { value: 'Zéro', label: 'Données bancaires requises', color: '#38bdf8' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: 'clamp(20px,3vw,36px) clamp(16px,2vw,28px)',
              textAlign: 'center',
              borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
            }}>
              <div style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Interactive Compound Interest Demo ───────────────────────────────────
function InteractiveDemo() {
  const [tab, setTab] = useState<'compound' | 'fire'>('compound')

  // ── Compound state ──
  const [capital, setCapital] = useState(10000)
  const [monthly, setMonthly] = useState(300)
  const [rate, setRate] = useState(7)
  const [years, setYears] = useState(20)
  const [hoverPct, setHoverPct] = useState<number | null>(null)

  // ── FIRE state ──
  const [firePatrimoine, setFirePatrimoine] = useState(30000)
  const [fireEpargne, setFireEpargne] = useState(1500)
  const [fireRate, setFireRate] = useState(7)
  const [fireDepenses, setFireDepenses] = useState(3000)

  const fmtFull = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'

  // ── Compound computation ──
  const compoundData: { invested: number; value: number }[] = []
  let _v = capital, _i = capital
  for (let y = 0; y <= years; y++) {
    compoundData.push({ invested: Math.round(_i), value: Math.round(_v) })
    for (let m = 0; m < 12; m++) { _v = (_v + monthly) * (1 + rate / 100 / 12); _i += monthly }
  }
  const finalValue = compoundData[compoundData.length - 1].value
  const totalInvested = compoundData[compoundData.length - 1].invested
  const gains = finalValue - totalInvested
  const rendement = Math.round((gains / totalInvested) * 100)

  // ── FIRE computation ──
  const fireTarget = fireDepenses * 12 * 25
  const MAX_FIRE_YEARS = 45
  const fireData: { value: number }[] = []
  let fv = firePatrimoine
  let fireYear = -1
  for (let y = 0; y <= MAX_FIRE_YEARS; y++) {
    fireData.push({ value: Math.round(fv) })
    if (fv >= fireTarget && fireYear === -1) fireYear = y
    for (let m = 0; m < 12; m++) { fv = (fv + fireEpargne) * (1 + fireRate / 100 / 12) }
  }
  const annees = fireYear >= 0 ? fireYear : null
  const displayFireData = annees !== null ? fireData.slice(0, annees + 2) : fireData
  const fireColor = '#fb923c'

  // ── SVG dimensions ──
  const W = 560, H = 160

  // Compound paths
  const maxV = finalValue
  const toXc = (i: number) => (i / (compoundData.length - 1)) * W
  const toYc = (v: number) => H - (v / maxV) * H * 0.88 - 4
  const pathValue = compoundData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toXc(i).toFixed(1)},${toYc(d.value).toFixed(1)}`).join(' ')
  const pathInvested = compoundData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toXc(i).toFixed(1)},${toYc(d.invested).toFixed(1)}`).join(' ')
  const areaValue = pathValue + ` L${W},${H} L0,${H} Z`
  const areaInvested = pathInvested + ` L${W},${H} L0,${H} Z`

  // FIRE paths
  const maxFire = Math.max(fireTarget * 1.1, ...displayFireData.map(d => d.value))
  const toXf = (i: number) => (i / Math.max(displayFireData.length - 1, 1)) * W
  const toYf = (v: number) => H - (v / maxFire) * H * 0.88 - 4
  const fireValuePath = displayFireData.map((d, i) => `${i === 0 ? 'M' : 'L'}${toXf(i).toFixed(1)},${toYf(d.value).toFixed(1)}`).join(' ')
  const fireAreaPath = fireValuePath + ` L${toXf(displayFireData.length - 1)},${H} L0,${H} Z`
  const targetY = toYf(fireTarget)

  // Hover for compound
  const hovIdx = hoverPct !== null ? Math.round(hoverPct * (compoundData.length - 1)) : null
  const hd = hovIdx !== null ? compoundData[hovIdx] : null

  const activeColor = tab === 'compound' ? GOLD : fireColor

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.035), rgba(241,192,134,0.015))',
      border: `1px solid ${activeColor}25`,
      borderRadius: 24, padding: 'clamp(24px,4vw,40px)',
      boxShadow: `0 0 80px ${activeColor}08`,
      position: 'relative',
      transition: 'border-color 0.4s',
      height: '100%', boxSizing: 'border-box',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${activeColor}0b, transparent 65%)`, pointerEvents: 'none', transition: 'background 0.4s' }} />

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 4, width: 'fit-content', position: 'relative', zIndex: 2 }}>
        {([
          { id: 'compound' as const, label: 'Intérêts composés', icon: TrendingUp, color: GOLD },
          { id: 'fire' as const, label: 'FI/RE', icon: Flame, color: fireColor },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 9,
            border: tab === t.id ? `1px solid ${t.color}35` : '1px solid transparent',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            background: tab === t.id ? 'rgba(0,0,0,0.06)' : 'transparent',
            color: tab === t.id ? t.color : '#9ca3af',
            transition: 'all 0.2s',
          }}>
            <t.icon style={{ width: 13, height: 13 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Flip container */}
      <div style={{ perspective: '1400px', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'relative',
          transformStyle: 'preserve-3d' as any,
          transform: tab === 'fire' ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1)',
        }}>
          {/* FRONT FACE: Compound */}
          <div style={{ backfaceVisibility: 'hidden' as any, WebkitBackfaceVisibility: 'hidden' as any }}>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Valeur finale', value: finalValue >= 1_000_000 ? `${(finalValue / 1_000_000).toFixed(2)} M€` : `${Math.round(finalValue / 1000)} k€`, color: GOLD, big: true },
                { label: 'Gains nets', value: `+${gains >= 1_000_000 ? `${(gains / 1_000_000).toFixed(2)} M€` : `${Math.round(gains / 1000)} k€`}`, color: '#34d399', big: true },
                { label: 'Rendement total', value: `${rendement}%`, color: '#1f2937', big: true },
                { label: 'Capital investi', value: fmtFull(totalInvested), color: '#4b5563', big: false },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                  <p style={{ fontSize: k.big ? 26 : 18, fontWeight: 800, color: k.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ borderRadius: 12, marginBottom: 14, position: 'relative', cursor: 'crosshair' }}
              onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setHoverPct(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))) }}
              onMouseLeave={() => setHoverPct(null)}
            >
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H, borderRadius: 10 }}>
                <defs>
                  <linearGradient id="demo2-v" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity="0.32" /><stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="demo2-i" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <path d={areaValue} fill="url(#demo2-v)" />
                <path d={areaInvested} fill="url(#demo2-i)" />
                <path d={pathValue} fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinejoin="round" />
                <path d={pathInvested} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="5,3" strokeLinejoin="round" />
                {hovIdx !== null && hd && (
                  <>
                    <line x1={toXc(hovIdx)} y1={0} x2={toXc(hovIdx)} y2={H} stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
                    <circle cx={toXc(hovIdx)} cy={toYc(hd.value)} r={4} fill={GOLD} stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
                    <circle cx={toXc(hovIdx)} cy={toYc(hd.invested)} r={4} fill="#34d399" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
                  </>
                )}
              </svg>
              {hovIdx !== null && hd && hoverPct !== null && (
                <div style={{
                  position: 'absolute', top: 8,
                  left: hoverPct > 0.6 ? 'auto' : `calc(${(hoverPct * 100).toFixed(1)}% + 12px)`,
                  right: hoverPct > 0.6 ? `calc(${((1 - hoverPct) * 100).toFixed(1)}% + 12px)` : 'auto',
                  background: 'rgba(8,8,8,0.96)', border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: 10, padding: '10px 14px', pointerEvents: 'none', zIndex: 10, minWidth: 200,
                }}>
                  <p style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>Année {hovIdx}</p>
                  {[['Valeur', fmtFull(hd.value), GOLD], ['Investi', fmtFull(hd.invested), '#34d399'], ['Gains', `+${fmtFull(hd.value - hd.invested)}`, '#fff']].map(([l, v, c], i) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: i === 1 ? 4 : 0, paddingTop: i === 2 ? 6 : 0, borderTop: i === 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', marginTop: i === 2 ? 4 : 0 }}>
                      <span style={{ fontSize: 11, color: '#4b5563' }}>{l}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 11, color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2.5, background: GOLD, borderRadius: 2 }} /> Valeur finale
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#34d399" strokeWidth="1.5" strokeDasharray="5,3" /></svg> Capital investi
              </div>
            </div>

            {/* Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 32px', marginBottom: 24 }}>
              {([
                { label: 'Capital initial', value: capital, min: 1000, max: 100000, step: 500, display: `${capital.toLocaleString('fr-FR')} €`, set: setCapital },
                { label: 'Versement mensuel', value: monthly, min: 0, max: 2000, step: 50, display: `${monthly} €/mois`, set: setMonthly },
                { label: 'Rendement annuel', value: rate, min: 1, max: 15, step: 0.5, display: `${rate} %/an`, set: setRate },
                { label: 'Durée', value: years, min: 5, max: 40, step: 1, display: `${years} ans`, set: setYears },
              ] as { label: string; value: number; min: number; max: number; step: number; display: string; set: (v: number) => void }[]).map(({ label, value, min, max, step, display, set }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{display}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: GOLD, cursor: 'pointer', height: 4 }} />
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as any, gap: 12, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>
                Simulation indicative · rendement constant · sans frais ni fiscalité
              </p>
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: `${GOLD}1a`, border: `1px solid ${GOLD}40`, color: GOLD, textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = `${GOLD}2e`; e.currentTarget.style.borderColor = `${GOLD}70` }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = `${GOLD}1a`; e.currentTarget.style.borderColor = `${GOLD}40` }}>
                Sauvegarder ce scénario <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </div>

          {/* BACK FACE: FIRE */}
          <div style={{
            position: 'absolute' as any, top: 0, left: 0, right: 0,
            backfaceVisibility: 'hidden' as any, WebkitBackfaceVisibility: 'hidden' as any,
            transform: 'rotateY(180deg)',
          }}>
            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
              {[
                { label: 'Objectif FIRE', value: `${Math.round(fireTarget / 1000)} k€`, sub: 'règle des 4 %', color: fireColor, big: true },
                { label: 'Années restantes', value: annees !== null ? `${annees} ans` : '> 45 ans', color: annees !== null ? '#34d399' : '#9ca3af', big: true },
                { label: 'Revenu passif cible', value: `${fmtFull(fireDepenses)}/mois`, color: '#374151', big: false },
                { label: 'Patrimoine actuel', value: `${Math.round(firePatrimoine / 1000)} k€`, color: '#4b5563', big: false },
              ].map(k => (
                <div key={k.label} style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 14, padding: '14px 16px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                  <p style={{ fontSize: k.big ? 26 : 18, fontWeight: 800, color: k.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{k.value}</p>
                  {'sub' in k && k.sub && <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{k.sub}</p>}
                </div>
              ))}
            </div>

            {/* FIRE Chart */}
            <div style={{ borderRadius: 12, marginBottom: 14 }}>
              <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: H, borderRadius: 10 }}>
                <defs>
                  <linearGradient id="fire2-g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fireColor} stopOpacity="0.30" /><stop offset="100%" stopColor={fireColor} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <rect x={0} y={0} width={W} height={targetY} fill="rgba(52,211,153,0.03)" />
                <line x1={0} y1={targetY} x2={W} y2={targetY} stroke="#34d399" strokeWidth="1.5" strokeDasharray="6,4" strokeOpacity="0.55" />
                <path d={fireAreaPath} fill="url(#fire2-g)" />
                <path d={fireValuePath} fill="none" stroke={fireColor} strokeWidth="2.5" strokeLinejoin="round" />
                {annees !== null && (
                  <>
                    <circle cx={toXf(annees)} cy={targetY} r={12} fill={fireColor} opacity="0.15" />
                    <circle cx={toXf(annees)} cy={targetY} r={5} fill={fireColor} opacity="0.9" />
                  </>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, fontSize: 11, color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2.5, background: fireColor, borderRadius: 2 }} /> Croissance portefeuille
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="20" height="3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#34d399" strokeWidth="1.5" strokeDasharray="6,4" /></svg> Objectif FIRE
              </div>
            </div>

            {/* FIRE Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px 32px', marginBottom: 24 }}>
              {([
                { label: 'Patrimoine actuel', value: firePatrimoine, min: 0, max: 200000, step: 5000, display: `${Math.round(firePatrimoine / 1000)} k€`, set: setFirePatrimoine },
                { label: 'Épargne mensuelle', value: fireEpargne, min: 100, max: 5000, step: 100, display: `${fireEpargne} €/mois`, set: setFireEpargne },
                { label: 'Rendement estimé', value: fireRate, min: 1, max: 15, step: 0.5, display: `${fireRate} %/an`, set: setFireRate },
                { label: 'Dépenses/mois cible', value: fireDepenses, min: 1000, max: 10000, step: 200, display: `${fmtFull(fireDepenses)}/mois`, set: setFireDepenses },
              ] as { label: string; value: number; min: number; max: number; step: number; display: string; set: (v: number) => void }[]).map(({ label, value, min, max, step, display, set }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: fireColor }}>{display}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: fireColor, cursor: 'pointer', height: 4 }} />
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as any, gap: 12, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>
                Simulation indicative · rendement constant · sans frais ni fiscalité
              </p>
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: `${fireColor}1a`, border: `1px solid ${fireColor}40`, color: fireColor, textDecoration: 'none', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = `${fireColor}2e`; e.currentTarget.style.borderColor = `${fireColor}70` }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = `${fireColor}1a`; e.currentTarget.style.borderColor = `${fireColor}40` }}>
                Sauvegarder ce scénario <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Roadmap Flip Card ────────────────────────────────────────────────────
function RoadmapFlipCard({ item, barColor, phaseId }: { item: { label: string; desc: string }; barColor: string; phaseId: string }) {
  const [flipped, setFlipped] = useState(false)
  const emoji = phaseId === 'done' ? '✅' : phaseId === 'wip' ? '⚡' : '📅'
  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      style={{ perspective: '600px', height: 96 }}
    >
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d' as any,
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.42s ease',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden' as any,
          background: 'rgba(0,0,0,0.025)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderTop: `2px solid ${barColor}`,
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex', flexDirection: 'column' as any, justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13, color: '#111827', fontWeight: 600, lineHeight: 1.3 }}>{item.label}</span>
          <span style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.04em' }}>{emoji} Survolez pour en savoir plus</span>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden' as any,
          transform: 'rotateY(180deg)',
          background: `${barColor}12`,
          border: `1px solid ${barColor}35`,
          borderTop: `2px solid ${barColor}`,
          borderRadius: 12,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center',
        }}>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Competitor Comparison Table ──────────────────────────────────────────
type FeatureVal = true | false | null
const COMPETITOR_FEATURES: { label: string; fincalc: FeatureVal; simulator: FeatureVal; sheets: FeatureVal }[] = [
  { label: '100 % gratuit',                  fincalc: true,  simulator: false, sheets: true  },
  { label: 'Intérêts composés',              fincalc: true,  simulator: null,  sheets: null  },
  { label: 'Simulateur FI/RE',               fincalc: true,  simulator: false, sheets: null  },
  { label: 'Simulateur retraite',            fincalc: true,  simulator: null,  sheets: null  },
  { label: 'Calcul impôts IR / TMI',         fincalc: true,  simulator: false, sheets: null  },
  { label: 'DCA / Investissement régulier',  fincalc: true,  simulator: false, sheets: null  },
  { label: 'Acheter vs Louer',               fincalc: true,  simulator: false, sheets: null  },
  { label: 'Fiscalité française 2026',       fincalc: true,  simulator: false, sheets: false },
  { label: 'Sans données bancaires',         fincalc: true,  simulator: false, sheets: true  },
  { label: 'Zéro publicité',                 fincalc: true,  simulator: false, sheets: true  },
]

function CompetitorTable() {
  const cols = [
    { name: 'PatrImo', key: 'fincalc' as const, highlight: true, color: GOLD, isPatrimo: true },
    { name: 'Simulateur banque', key: 'simulator' as const, highlight: false, color: '#4b5563', isPatrimo: false },
    { name: 'Google Sheets', key: 'sheets' as const, highlight: false, color: '#6b7280', isPatrimo: false },
  ]
  const GOLD_CELL = 'rgba(241,192,134,0.08)'
  return (
    <section id="comparatif" style={{ padding: '80px 20px 60px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionTag><BarChart3 style={{ width: 11, height: 11 }} /> Comparatif</SectionTag>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
              PatrImo vs les{' '}
              <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>alternatives</span>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7280', marginTop: 12, lineHeight: 1.7 }}>
              Des simulateurs conçus pour les investisseurs français, pas pour les banques.
            </p>
          </div>
        </RevealSection>

        <RevealSection delay={100}>
          <div style={{ border: `1px solid ${GOLD_BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 130px', background: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '14px 20px' }} />
              {cols.map(col => (
                <div key={col.name} style={{
                  padding: col.isPatrimo ? '8px 8px 14px' : '14px 8px',
                  textAlign: 'center',
                  background: col.isPatrimo ? GOLD_CELL : 'transparent',
                  borderLeft: '1px solid rgba(0,0,0,0.06)',
                  borderTop: col.isPatrimo ? `2px solid ${GOLD}60` : '2px solid transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  {col.isPatrimo && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 9, fontWeight: 700, color: GOLD,
                      background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
                      borderRadius: 100, padding: '2px 7px', marginBottom: 5,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                      ★ Recommandé
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.name}</span>
                </div>
              ))}
            </div>

            {/* Feature rows */}
            {COMPETITOR_FEATURES.map((f, i) => (
              <RevealSection key={f.label} delay={i * 30}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px 120px 130px',
                  borderBottom: i < COMPETITOR_FEATURES.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  background: i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'transparent',
                }}>
                  <div style={{ padding: '12px 20px', fontSize: 13, color: '#374151' }}>{f.label}</div>
                  {cols.map(col => {
                    const val = f[col.key]
                    const isFalseNonPatrimo = val === false && !col.isPatrimo
                    return (
                      <div key={col.key} style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        background: col.isPatrimo ? GOLD_CELL : isFalseNonPatrimo ? 'rgba(248,113,113,0.12)' : 'transparent',
                        borderLeft: '1px solid rgba(0,0,0,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {val === true && col.isPatrimo && (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check style={{ width: 12, height: 12, color: '#4ade80' }} />
                          </div>
                        )}
                        {val === true && !col.isPatrimo && (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check style={{ width: 12, height: 12, color: '#34d399' }} />
                          </div>
                        )}
                        {val === false && !col.isPatrimo && <X style={{ width: 14, height: 14, color: '#f87171' }} />}
                        {val === false && col.isPatrimo && <X style={{ width: 14, height: 14, color: '#d1d5db' }} />}
                        {val === null && <span style={{ fontSize: 11, color: '#9ca3af', background: 'rgba(0,0,0,0.03)', borderRadius: 100, padding: '2px 8px' }}>partiel</span>}
                      </div>
                    )
                  })}
                </div>
              </RevealSection>
            ))}

            {/* Footer note */}
            <div style={{ padding: '12px 20px', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, color: '#9ca3af' }}>
                Comparaison basée sur les offres publiques au 1er trimestre 2026. Finary = offre gratuite limitée. &quot;Votre banque&quot; = conseiller bancaire traditionnel.
              </p>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Hero FIRE mini-calc ──────────────────────────────────────────────────
function HeroFireCalc() {
  const [epargne, setEpargne] = useState(500)
  const [age, setAge] = useState(30)
  const target = 900000 // 3 000 €/mois × 12 × 25 (règle des 4 %)
  const r = 0.07 / 12
  const rawMonths = epargne > 0 ? Math.log(1 + (target * r) / epargne) / Math.log(1 + r) : Infinity
  const years = isFinite(rawMonths) && rawMonths / 12 <= 60 ? Math.ceil(rawMonths / 12) : null
  const libertyAge = years !== null ? age + years : null

  // Live mini-chart
  const CW = 320, CH = 90
  const maxYears = Math.min(years !== null ? years + 2 : 50, 55)
  const pts = Array.from({ length: maxYears + 1 }, (_, y) => {
    const val = epargne * ((Math.pow(1 + r, y * 12) - 1) / r)
    return { x: (y / maxYears) * CW, y: CH - 6 - Math.min(val / target, 1.05) * (CH - 16) }
  })
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L ${CW},${CH} L 0,${CH} Z`
  const targetY = CH - 6 - (CH - 16) // full height = target
  const crossX = years !== null ? (years / maxYears) * CW : null

  return (
    <div style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(251,146,60,0.22)', borderRadius: 20, padding: '22px 26px', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Flame style={{ width: 13, height: 13, color: '#fb923c' }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Mon objectif FI/RE</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 28px', marginBottom: 16 }}>
        {[
          { label: 'Épargne mensuelle', value: epargne, min: 100, max: 3000, step: 50, display: `${epargne} €/mois`, set: setEpargne },
          { label: 'Âge actuel', value: age, min: 18, max: 55, step: 1, display: `${age} ans`, set: setAge },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>{s.display}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
              onChange={e => s.set(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#fb923c', height: 3, cursor: 'pointer' }} />
          </div>
        ))}
      </div>

      {/* Live chart */}
      <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', background: 'rgba(0,0,0,0.18)' }}>
        <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" style={{ display: 'block', height: CH }}>
          <defs>
            <linearGradient id="fire-area-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Target line */}
          <line x1={0} y1={targetY} x2={CW} y2={targetY} stroke="rgba(251,146,60,0.30)" strokeWidth="1" strokeDasharray="5,4" />
          {/* Area fill */}
          <path d={areaD} fill="url(#fire-area-g)" />
          {/* Curve */}
          <path d={pathD} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Intersection marker */}
          {crossX !== null && (
            <>
              <line x1={crossX} y1={targetY - 2} x2={crossX} y2={CH} stroke="rgba(251,146,60,0.25)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={crossX} cy={targetY} r={4} fill="#fb923c" />
            </>
          )}
          {/* Target label */}
          <text x={CW - 4} y={targetY - 4} textAnchor="end" fontSize="8" fill="rgba(251,146,60,0.55)" fontWeight="700">900 k€</text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          {libertyAge !== null
            ? <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                Libre à <span style={{ color: '#fb923c' }}>{libertyAge} ans</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>dans {years} ans</span>
              </p>
            : <p style={{ fontSize: 13, color: '#4b5563' }}>Augmentez votre épargne pour atteindre l&apos;indépendance</p>
          }
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>7 %/an · dépenses 3 000 €/mois · règle des 4 %</p>
        </div>
        <a href="#demo" style={{ fontSize: 12, color: 'rgba(251,146,60,0.65)', textDecoration: 'none', flexShrink: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fb923c' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(251,146,60,0.65)' }}>
          Détail →
        </a>
      </div>
    </div>
  )
}

// ─── Opportunity cost widget ───────────────────────────────────────────────
function OpportunityCostWidget() {
  const [capital, setCapital] = useState(10000)
  const [annees, setAnnees] = useState(3)
  const r = 0.07 / 12
  const manque = Math.round(capital * (Math.pow(1 + r, annees * 12) - 1))
  const fmtFull = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
  return (
          <div style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.05), rgba(241,192,134,0.02))', border: '1px solid rgba(251,146,60,0.18)', borderRadius: 20, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.09), transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <Zap style={{ width: 13, height: 13, color: '#fb923c' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Coût d&apos;inaction</span>
            </div>
            <h3 style={{ fontSize: 'clamp(1.2rem,3vw,1.7rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>
              Votre épargne dort sur un compte courant ?
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              Chaque mois sans investir a un coût réel. Calculez le vôtre.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', marginBottom: 24 }}>
              {[
                { label: 'Capital non investi', value: capital, min: 1000, max: 100000, step: 1000, display: `${capital.toLocaleString('fr-FR')} €`, set: setCapital },
                { label: 'Depuis (années)', value: annees, min: 1, max: 15, step: 1, display: `${annees} an${annees > 1 ? 's' : ''}`, set: setAnnees },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#4b5563' }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>{s.display}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.set(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#fb923c', height: 3, cursor: 'pointer' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '18px 20px', background: 'rgba(0,0,0,0.28)', borderRadius: 14, border: '1px solid rgba(251,146,60,0.14)' }}>
              <div>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 5 }}>Manque à gagner estimé (vs ETF MSCI World à 7%/an)</p>
                <p style={{ fontSize: 30, fontWeight: 800, color: '#fb923c', letterSpacing: '-0.03em', lineHeight: 1 }}>−{fmtFull(manque)}</p>
              </div>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, background: '#fb923c', color: '#000', fontWeight: 700, fontSize: 13, textDecoration: 'none', flexShrink: 0, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(251,146,60,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                Simuler dès maintenant <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </div>
  )
}

// ─── Intro animation — "F" draws itself then fades out ───────────────────
function FIntroAnimation({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 2200)
    const t2 = setTimeout(() => onDone(), 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.7s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      {/* P icon — circle first, then letter */}
      <svg width="80" height="94" viewBox="0 0 34 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="gIntro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f1c086" />
            <stop offset="100%" stopColor="#c8922a" />
          </linearGradient>
        </defs>
        {/* Dot — pop in first */}
        <circle
          cx="9" cy="5" r="4" fill="url(#gIntro)"
          style={{
            opacity: 0,
            transformBox: 'fill-box', transformOrigin: 'center',
            animation: 'logo-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards 0.25s',
          } as React.CSSProperties}
        />
        {/* P — rises up after */}
        <text
          x="0" y="38"
          fontFamily="Geist, Inter, sans-serif"
          fontWeight="900"
          fontSize="36"
          fill="url(#gIntro)"
          letterSpacing="-2"
          style={{ opacity: 0, animation: 'fade-in-intro 0.6s cubic-bezier(0.4,0,0.2,1) forwards 0.55s' } as React.CSSProperties}
        >P</text>
      </svg>

      {/* Full wordmark — fades in last */}
      <div style={{
        opacity: 0,
        animation: 'fade-in-intro 0.55s ease forwards 1.1s',
      } as React.CSSProperties}>
        <PatrimoLogo width={148} uid="intro" />
      </div>
    </div>
  )
}

// ─── Tools marquee ticker ─────────────────────────────────────────────────
const TICKER_ITEMS = [
  'Intérêts Composés', 'Simulateur FI/RE', 'Crédit Immobilier', 'Flat Tax vs Barème',
  'PEA vs CTO vs AV', 'Score Patrimonial', 'Budget 50/30/20', 'Simulateur Retraite',
  'DCA', 'Acheter vs Louer', 'Rentabilité Locative', 'Impôts IR',
  "Épargne d'urgence", 'Crédit Conso', 'Succession & Donation', 'Revenus Passifs', 'Benchmarks',
]
function ToolsTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{
      overflow: 'hidden',
      borderTop: '1px solid rgba(0,0,0,0.07)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      padding: '15px 0',
      maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
      WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
    }}>
      <div style={{
        display: 'flex',
        animation: 'marquee-scroll 45s linear infinite',
        width: 'max-content',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, whiteSpace: 'nowrap', padding: '0 28px' }}>
              {item}
            </span>
            <span style={{ color: 'rgba(0,0,0,0.15)', fontSize: 8, flexShrink: 0 }}>✦</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Testimonials Marquee ─────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: "Le simulateur FI/RE m'a donné une date concrète : liberté financière à 47 ans. Je n'y croyais pas avant de voir les chiffres.", name: 'Lucas B.', role: 'Ingénieur logiciel, 32 ans', stars: 5, initials: 'LB', color: '#34d399' },
  { text: "J'ai comparé PEA et CTO pour mes dividendes — différence sur 20 ans : 24 000 €. J'ai transféré en 2 semaines.", name: 'Nathalie F.', role: 'Comptable, 41 ans', stars: 5, initials: 'NF', color: '#f472b6' },
  { text: "L'outil Acheter vs Louer m'a convaincu d'attendre encore 2 ans avant d'acheter. Économie potentielle : 12 000 €.", name: 'Romain T.', role: 'Commercial, 29 ans', stars: 4, initials: 'RT', color: '#818cf8' },
  { text: "Le simulateur retraite m'a aidé à comprendre l'impact de mon PER. J'aurais voulu découvrir ça 10 ans plus tôt.", name: 'Isabelle C.', role: 'Médecin, 48 ans', stars: 5, initials: 'IC', color: '#fbbf24' },
  { text: "Le taux d'épargne m'a révélé 400 €/mois économisables sans changer de train de vie. Juste en réorganisant mes dépenses.", name: 'Mehdi A.', role: 'Consultant, 34 ans', stars: 5, initials: 'MA', color: '#38bdf8' },
  { text: "Première fois que j'ai une vraie vision globale de mon patrimoine. Le tableau de bord est vraiment bien fait.", name: 'Clara P.', role: 'Architecte, 37 ans', stars: 4, initials: 'CP', color: '#fb923c' },
  { text: "Le simulateur IR m'a économisé 900 €/an grâce aux frais réels. Je ne savais même pas que c'était possible.", name: 'Antoine G.', role: 'Commercial terrain, 27 ans', stars: 5, initials: 'AG', color: '#34d399' },
  { text: "Enfin un outil gratuit qui calcule la rentabilité locative avec la vraie fiscalité française. Impressionnant.", name: 'Sylvie M.', role: 'Propriétaire de 3 biens, 52 ans', stars: 5, initials: 'SM', color: '#f472b6' },
  { text: "Le DCA m'a montré qu'investir 200 €/mois régulièrement bat ma stratégie lump sum. Simple, mais les chiffres sont là.", name: 'Kevin R.', role: 'Dev fullstack, 26 ans', stars: 4, initials: 'KR', color: '#c084fc' },
  { text: "Flat Tax vs Barème — 5 minutes pour comprendre que je payais 1 400 € de trop par an. J'ai changé immédiatement.", name: 'Hélène V.', role: 'Cadre RH, 43 ans', stars: 5, initials: 'HV', color: '#f1c086' },
  { text: "Le score patrimonial m'a donné un plan clair : rembourser le crédit conso d'abord, ouvrir un PEA ensuite.", name: 'Pierre D.', role: 'Technicien, 38 ans', stars: 3, initials: 'PD', color: '#818cf8' },
  { text: "Interface très claire et intuitive. J'avais essayé d'autres outils mais PatrImo est dans une autre catégorie.", name: 'Anaïs B.', role: 'UX Designer, 30 ans', stars: 5, initials: 'AB', color: '#34d399' },
  { text: "Le simulateur succession : j'ai anticipé une donation à mes enfants, économie de 45 000 € de droits.", name: 'Bernard L.', role: "Chef d'entreprise, 61 ans", stars: 5, initials: 'BL', color: '#f1c086' },
  { text: "Utile et gratuit. Enfin un outil sans pub ni abonnement caché. Je recommande à tous mes collègues.", name: 'Fatima O.', role: 'Infirmière, 33 ans', stars: 4, initials: 'FO', color: '#38bdf8' },
  { text: "PEA vs CTO vs AV avec ma vraie TMI : j'ai trouvé en 10 minutes la meilleure enveloppe pour mon profil.", name: 'Thomas H.', role: 'Freelance développeur, 31 ans', stars: 5, initials: 'TH', color: '#fb923c' },
  { text: "J'ai utilisé le simulateur crédit immo pour négocier avec ma banque. Résultat : −0,3 % sur mon TAEG.", name: 'Sophie N.', role: 'Directrice marketing, 39 ans', stars: 5, initials: 'SN', color: '#f472b6' },
  { text: "Parfait pour débuter. J'ai commencé par le budget 50/30/20, maintenant j'utilise presque tous les modules.", name: 'Enzo M.', role: 'Étudiant en master, 23 ans', stars: 4, initials: 'EM', color: '#c084fc' },
  { text: "Le portefeuille temps réel via Finnhub change tout. Mes plus-values calculées à la seconde, sans Excel.", name: 'Jean-Paul R.', role: 'Retraité actif, 63 ans', stars: 5, initials: 'JR', color: '#34d399' },
  { text: "La connexion FIRE ↔ Patrimoine est bluffante. Mes vraies données directement dans la simulation FI/RE.", name: 'Marion T.', role: 'Ingénieure, 35 ans', stars: 5, initials: 'MT', color: '#f1c086' },
  { text: "Bon outil dans l'ensemble. Site responsive qui fonctionne bien sur mobile, même sans appli dédiée.", name: 'Christophe A.', role: 'Commercial, 44 ans', stars: 3, initials: 'CA', color: '#818cf8' },
]

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  const [imgError, setImgError] = useState(false)
  const avatarUrl = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(t.name)}&backgroundColor=${t.color.replace('#', '')}`
  return (
    <div style={{ width: 290, flexShrink: 0, background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '18px 20px', margin: '0 7px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        {imgError ? (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${t.color}cc, ${t.color}55)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {t.initials}
          </div>
        ) : (
          <img
            src={avatarUrl}
            alt={t.initials}
            width={36}
            height={36}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${t.color}40`, objectFit: 'cover', flexShrink: 0 }}
            onError={() => setImgError(true)}
          />
        )}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.3 }}>{t.name}</p>
          <p style={{ fontSize: 10, color: '#6b7280', margin: 0 }}>{t.role}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: i < t.stars ? GOLD : 'rgba(0,0,0,0.15)', fontSize: 11 }}>★</span>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>&ldquo;{t.text}&rdquo;</p>
    </div>
  )
}

function TestimonialsMarquee() {
  const half = Math.ceil(TESTIMONIALS.length / 2)
  const row1 = [...TESTIMONIALS.slice(0, half), ...TESTIMONIALS.slice(0, half)]
  const row2 = [...TESTIMONIALS.slice(half), ...TESTIMONIALS.slice(half)]
  return (
    <section id="avis" style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', paddingBottom: 48, paddingLeft: 20, paddingRight: 20, textAlign: 'center' }}>
        <SectionTag><Star style={{ width: 11, height: 11 }} /> Ils l&apos;utilisent</SectionTag>
        <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2, margin: '0 0 10px' }}>
          Ce qu&apos;ils en disent
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 460, margin: '0 auto' }}>
          Des milliers d&apos;utilisateurs ont déjà pris le contrôle de leurs finances avec PatrImo.
        </p>
      </div>
      <div style={{ overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ display: 'flex', animation: 'marquee-scroll 70s linear infinite', width: 'max-content' }}>
          {row1.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'marquee-scroll-reverse 65s linear infinite', width: 'max-content' }}>
          {row2.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works scrollytelling ─────────────────────────────────────────
function HowStepCard({ step, i, total }: { step: typeof HOW[0]; i: number; total: number }) {
  const { ref, visible } = useInView(0.3)
  return (
    <div ref={ref} style={{ position: 'relative', flex: '1 1 260px', minWidth: 0 }}>
      {/* Connecting dotted line between steps */}
      {i < total - 1 && (
        <div style={{
          position: 'absolute',
          top: 26,
          left: 'calc(100% - 0px)',
          width: '100%',
          height: 0,
          zIndex: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            height: 1,
            width: visible ? '100%' : '0%',
            borderTop: `1.5px dashed ${GOLD}50`,
            transition: 'width 0.6s ease 0.3s',
          }} />
        </div>
      )}
      {/* Card */}
      <div style={{
        background: '#ffffff',
        border: visible ? `1px solid ${GOLD}50` : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 20,
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
        opacity: visible ? 1 : 0.3,
        transform: visible ? 'none' : 'translateX(-12px)',
        transition: `all 0.6s ease ${i * 0.15}s`,
        boxShadow: visible ? `0 0 0 1px ${GOLD}20, 0 8px 32px rgba(0,0,0,0.07)` : '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Ghost step number */}
        <div style={{ position: 'absolute', top: -10, right: 16, fontSize: 80, fontStyle: 'italic', color: 'rgba(0,0,0,0.04)', fontWeight: 400, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          {step.step}
        </div>
        {/* Icon + step badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 14,
            background: `${step.iconColor}18`,
            border: `1px solid ${step.iconColor}30`,
            boxShadow: visible ? `0 0 16px ${step.iconColor}30` : 'none',
            transition: `box-shadow 0.6s ease ${i * 0.15}s`,
          }}>
            <step.icon style={{ width: 24, height: 24, color: step.iconColor }} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 7, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD }}>{step.step}</span>
          </div>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>{step.title}</h3>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{step.desc}</p>
        {i < total - 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <ArrowRight style={{ width: 16, height: 16, color: visible ? `${GOLD}90` : `${GOLD}40`, transition: `color 0.6s ease ${i * 0.15}s` }} />
          </div>
        )}
      </div>
    </div>
  )
}

function HowItWorks() {
  return (
    <section id="how" style={{ padding: '100px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionTag><Clock style={{ width: 11, height: 11 }} /> En 3 étapes</SectionTag>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0' }}>
              Comment ça marche ?
            </h2>
          </div>
        </RevealSection>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {HOW.map((step, i) => (
            <HowStepCard key={i} step={step} i={i} total={HOW.length} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Case Studies ─────────────────────────────────────────────────────────
interface CaseStep { tool: string; desc: string }
interface CaseStudy {
  emoji: string; color: string; badge: string; name: string; role: string
  situation: string; tools: string[]; steps: CaseStep[]
  decision: string; result: string; resultColor: string
}
const CASE_STUDIES: CaseStudy[] = [
  {
    emoji: '🌱', color: '#34d399', badge: 'Jeune actif 25–35 ans',
    name: 'Julien, 29 ans', role: 'Développeur web · Lyon',
    situation: 'Julien épargnait 200 €/mois sur Livret A sans vraie stratégie. Il ne connaissait ni sa TMI, ni l\'existence du PEA. Il pensait "investir, c\'est trop complexe pour moi".',
    tools: ['Intérêts Composés', 'FI/RE', 'DCA'],
    steps: [
      { tool: 'Intérêts Composés', desc: 'Il simule 300 €/mois à 7 %/an pendant 25 ans → 233 000 € au lieu de 90 000 € versés. Il comprend l\'effet boule de neige pour la première fois.' },
      { tool: 'FI/RE', desc: 'Avec 500 €/mois d\'épargne, il peut être financièrement libre à 51 ans. Objectif : 900 000 € (règle des 4 %, 3 000 €/mois de dépenses).' },
      { tool: 'DCA', desc: 'DCA mensuel vs achat trimestriel → il choisit l\'automatisation mensuelle pour lisser la volatilité, sans chercher à "timer" le marché.' },
    ],
    decision: 'Julien ouvre un PEA la semaine suivante, automatise 500 €/mois vers un ETF MSCI World et coupe les abonnements inutiles pour atteindre son objectif.',
    result: '+18 200 € de capital accumulé en 3 ans. Objectif FIRE avancé de 4 ans.',
    resultColor: '#34d399',
  },
  {
    emoji: '🏠', color: '#f472b6', badge: 'Propriétaire',
    name: 'Sophie, 38 ans', role: 'Directrice marketing · Bordeaux',
    situation: 'Sophie hésite à acheter un T3 à 320 000 € ou continuer à louer à 950 €/mois. Elle envisage aussi un investissement locatif mais ne sait pas si les chiffres tiennent.',
    tools: ['Acheter vs Louer', 'Prêt immobilier', 'Rentabilité Locative'],
    steps: [
      { tool: 'Acheter vs Louer', desc: 'Sur 15 ans, acheter génère 48 000 € de patrimoine supplémentaire vs louer — même en incluant charges, taxe foncière et entretien estimés.' },
      { tool: 'Prêt immobilier', desc: 'Sur 20 ans à 3,40 % TAEG : mensualité 1 590 €, coût des intérêts 61 600 €. Elle négocie et obtient 3,15 % → −8 400 € d\'intérêts sur la durée.' },
      { tool: 'Rentabilité Locative', desc: 'T3 loué 850 €/mois : rendement brut 3,2 %, net LMNP 2,8 %. Cashflow légèrement négatif mais capitalisation assurée sur 20 ans.' },
    ],
    decision: 'Sophie achète le T3, le met en location meublée (LMNP) et déduit les amortissements pour effacer la fiscalité sur 8 ans.',
    result: 'Rendement net LMNP de 2,8 %. Patrimoine immobilier estimé à +62 000 € vs location sur 14 ans.',
    resultColor: '#f472b6',
  },
  {
    emoji: '📈', color: '#818cf8', badge: 'Investisseur',
    name: 'Alexis, 35 ans', role: 'Ingénieur financier · Paris',
    situation: 'Alexis a 45 000 € d\'actions et ETF en CTO. Il touche 2 400 €/an de dividendes et ignore s\'il optimise sa fiscalité. Sa TMI est à 41 %. Son score indique une forte concentration sur la tech US.',
    tools: ['Flat Tax vs Barème', 'PEA vs CTO vs AV', 'Score Patrimonial'],
    steps: [
      { tool: 'Flat Tax vs Barème', desc: 'Sur ses dividendes : PFU 30 % = 720 €, barème 41 % = 984 €. Le PFU est optimal. Il confirme et économise 264 €/an sans rien changer.' },
      { tool: 'PEA vs CTO vs AV', desc: 'Simulation sur 20 ans de 45 000 € : PEA net = 218 000 €, CTO net = 194 000 €, AV net = 201 000 €. Avantage PEA vs CTO : +24 000 € après impôts.' },
      { tool: 'Score Patrimonial', desc: 'Score 68/100 — pilier "diversification" faible : 92 % en tech US. Recommandation : ajouter REIT + obligations pour dépasser 75/100.' },
    ],
    decision: 'Alexis transfère progressivement ses ETF vers un PEA et diversifie avec 15 % de REIT dans son CTO.',
    result: '−1 840 €/an de fiscalité optimisée. Score patrimonial : 68 → 79/100 en 8 mois.',
    resultColor: '#818cf8',
  },
  {
    emoji: '🔥', color: '#f1c086', badge: 'Futur retraité',
    name: 'Christine, 54 ans', role: 'Cadre supérieur · Strasbourg',
    situation: 'Christine veut partir à 60 ans au lieu de 65. Elle a 180 000 € d\'épargne, une résidence principale remboursée et un PER à 45 000 €. Elle doute : "Est-ce vraiment possible avec 6 ans de moins ?"',
    tools: ['Simulateur Retraite', 'FI/RE', 'Score Patrimonial'],
    steps: [
      { tool: 'Simulateur Retraite', desc: 'Retraite légale à 65 ans : 2 150 €/mois. À 60 ans avec décote : 1 680 €/mois. Déficit de 470 €/mois → complément de 141 000 € de capital nécessaire.' },
      { tool: 'FI/RE', desc: 'Avec 225 000 € actuels + 2 500 €/mois à 6 %/an : elle accumule 712 000 € à 60 ans → 2 848 €/mois passifs (règle des 4 %). Objectif largement atteint.' },
      { tool: 'Score Patrimonial', desc: 'Score 74/100. Recommandation clé : maxer le PER avant 60 ans. À TMI 41 %, chaque euro versé coûte 0,59 € net → déduction fiscale immédiate.' },
    ],
    decision: 'Christine verse 8 000 €/an dans son PER (économie IR de 3 280 €/an) et cible une retraite à 60 ans avec 3 sources de revenus.',
    result: '712 000 € projetés à 60 ans. Revenus : retraite + PER + dividendes = 3 500 €/mois. Objectif atteint.',
    resultColor: '#f1c086',
  },
]

function CaseStudiesSection() {
  const [active, setActive] = useState(0)
  const cs = CASE_STUDIES[active]
  return (
    <section style={{ padding: '80px 20px 100px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionTag><Users style={{ width: 11, height: 11 }} /> Cas concrets</SectionTag>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
              Ils ont transformé leur{' '}
              <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>situation financière</span>
            </h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Chiffres réels, décisions réelles. Comment PatrImo a aidé des utilisateurs à passer à l&apos;action.
            </p>
          </div>
        </RevealSection>

        {/* Profile tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {CASE_STUDIES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 100,
                background: i === active ? c.color + '18' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${i === active ? c.color + '40' : 'rgba(0,0,0,0.08)'}`,
                color: i === active ? c.color : '#6b7280',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
              }}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Case study card */}
        <div style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${cs.color}25`, borderRadius: 24, overflow: 'hidden', transition: 'border-color 0.3s' }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, ${cs.color}10, transparent)`, padding: '28px 32px', borderBottom: `1px solid ${cs.color}12` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' as const }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `${cs.color}18`, border: `1px solid ${cs.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {cs.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, background: `${cs.color}12`, border: `1px solid ${cs.color}28`, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cs.color, letterSpacing: '0.05em' }}>{cs.badge}</span>
                </div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: '0 0 3px' }}>{cs.name}</h3>
                <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>{cs.role}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignSelf: 'flex-start' }}>
                {cs.tools.map(t => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 600, color: cs.color, background: `${cs.color}12`, border: `1px solid ${cs.color}28`, borderRadius: 6, padding: '3px 9px' }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18, padding: '14px 18px', background: 'rgba(0,0,0,0.04)', borderRadius: 12, borderLeft: `3px solid ${cs.color}55` }}>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.75, margin: 0, fontStyle: 'italic' }}>&ldquo;{cs.situation}&rdquo;</p>
            </div>
          </div>

          {/* Steps */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 18 }}>Ce qu&apos;il a simulé avec PatrImo</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              {cs.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cs.color}15`, border: `1px solid ${cs.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: cs.color }}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: cs.color, margin: '0 0 4px', letterSpacing: '0.02em' }}>{step.tool}</p>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision + Result */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', padding: '22px 32px', gap: 20 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 10 }}>Sa décision</p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>{cs.decision}</p>
            </div>
            <div style={{ background: `${cs.resultColor}08`, border: `1px solid ${cs.resultColor}28`, borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: cs.resultColor, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 10 }}>Résultat concret</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', lineHeight: 1.65, margin: 0 }}>{cs.result}</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}>
            Commencer ma propre analyse <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Main Landing ─────────────────────────────────────────────────────────
// ─── Hero Live Compound Calc ──────────────────────────────────────────────
function HeroCompoundCalc() {
  const [capital, setCapital] = useState(10000)
  const [monthly, setMonthly] = useState(300)
  const [years, setYears] = useState(20)
  const [chartView, setChartView] = useState(0) // 0=growth, 1=allocation, 2=score

  // Auto-cycle views
  useEffect(() => {
    const t = setInterval(() => setChartView(v => (v + 1) % 3), 5000)
    return () => clearInterval(t)
  }, [])

  const rate = 0.07
  const monthlyRate = rate / 12
  const months = years * 12
  const fvCapital = capital * Math.pow(1 + rate, years)
  const fvMonthly = monthly > 0 ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : 0
  const total = fvCapital + fvMonthly
  const invested = capital + monthly * months
  const interests = total - invested
  const multiplier = invested > 0 ? total / invested : 1

  const fmtK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2).replace('.', ',')} M€`
    : n >= 1000 ? `${Math.round(n / 1000)} k€`
    : `${Math.round(n)} €`

  // Chart data — one point per year
  const CW = 340, CH = 250
  const PAD = { top: 12, right: 8, bottom: 28, left: 0 }
  const gW = CW - PAD.left - PAD.right
  const gH = CH - PAD.top - PAD.bottom

  const totalPts = Array.from({ length: years + 1 }, (_, y) => {
    const fvC = capital * Math.pow(1 + rate, y)
    const fvM = y > 0 ? monthly * ((Math.pow(1 + rate / 12, y * 12) - 1) / (rate / 12)) : 0
    return fvC + fvM
  })
  const investedPts = Array.from({ length: years + 1 }, (_, y) => capital + monthly * 12 * y)

  const maxV = Math.max(...totalPts) || 1
  const toX = (i: number) => PAD.left + (i / years) * gW
  const toY = (v: number) => PAD.top + gH - (v / maxV) * gH

  const totalCoords = totalPts.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const investedCoords = investedPts.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const areaTotal = `${PAD.left},${PAD.top + gH} ${totalCoords} ${toX(years).toFixed(1)},${(PAD.top + gH).toFixed(1)}`
  // Interests shaded zone (between invested and total)
  const areaInterest = `${totalCoords} ${investedPts.slice().reverse().map((v, i) => `${toX(years - i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')}`

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ v: p * maxV, y: PAD.top + gH - p * gH }))
  // X axis ticks every 5 years
  const xTicks = Array.from({ length: Math.floor(years / 5) + 1 }, (_, i) => i * 5).filter(y => y <= years)

  const lastX = toX(years)
  const lastTotalY = toY(totalPts[years])
  const lastInvY = toY(investedPts[years])

  const SLIDERS = [
    { label: 'Capital initial', value: capital, min: 0, max: 100000, step: 1000, display: `${capital.toLocaleString('fr-FR')} €`, set: setCapital, color: GOLD },
    { label: 'Versement / mois', value: monthly, min: 0, max: 2000, step: 50, display: `${monthly} €`, set: setMonthly, color: '#34d399' },
    { label: 'Durée', value: years, min: 5, max: 35, step: 1, display: `${years} ans`, set: setYears, color: '#818cf8' },
  ] as const

  return (
    <div style={{ position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '20%', left: '40%', width: 400, height: 400, background: `radial-gradient(ellipse, ${GOLD}0e 0%, transparent 70%)`, pointerEvents: 'none', filter: 'blur(30px)' }} />

      {/* Main card */}
      <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.09)', background: '#07070a', boxShadow: '0 40px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)' }}>

        {/* Browser chrome */}
        <div style={{ background: '#f8f9fc', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['rgba(255,96,96,0.5)', 'rgba(255,189,0,0.45)', 'rgba(40,200,80,0.4)'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 6, padding: '4px 12px', fontSize: 10.5, color: '#9ca3af', textAlign: 'center', fontFamily: 'monospace' }}>
            <span style={{ color: '#e5e7eb' }}>https://</span>finance.digitalstack.cloud<span style={{ color: GOLD + '88' }}>/simulateurs/interets-composes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.22)' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', animation: 'glow-pulse 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em' }}>LIVE</span>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr' }}>

          {/* ── LEFT: sliders + KPIs ── */}
          <div style={{ padding: '20px 18px', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 0, background: '#050508' }}>

            <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Intérêts composés</p>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              {SLIDERS.map(s => {
                const pct = ((s.value - s.min) / (s.max - s.min)) * 100
                return (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.display}</span>
                    </div>
                    {/* Track + thumb container */}
                    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                      {/* Track background */}
                      <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }} />
                      {/* Filled track */}
                      <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 2, width: `${pct}%`, background: `linear-gradient(to right, ${s.color}66, ${s.color})` }} />
                      {/* Visible thumb */}
                      <div style={{
                        position: 'absolute',
                        left: `calc(${pct}% - 10px)`,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: `radial-gradient(circle at 38% 35%, ${s.color}ff, ${s.color}bb)`,
                        border: `2px solid ${s.color}`,
                        boxShadow: `0 0 0 3px ${s.color}22, 0 2px 8px ${s.color}44`,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {/* Grip lines */}
                        <div style={{ display: 'flex', gap: 2, pointerEvents: 'none' }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{ width: 1.5, height: 6, borderRadius: 1, background: 'rgba(0,0,0,0.45)' }} />
                          ))}
                        </div>
                      </div>
                      {/* Invisible input on top */}
                      <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                        onChange={e => (s.set as (v: number) => void)(Number(e.target.value))}
                        style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, height: '100%', cursor: 'grab', zIndex: 2, margin: 0 }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* KPI stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              <div style={{ background: `linear-gradient(135deg, ${GOLD}12, transparent)`, border: `1px solid ${GOLD}28`, borderRadius: 10, padding: '11px 13px' }}>
                <p style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Capital final</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: GOLD, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmtK(total)}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>×{multiplier.toFixed(1)} votre mise</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Investi', value: fmtK(invested), color: '#374151' },
                  { label: 'Intérêts', value: fmtK(interests), color: '#34d399' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0d0d12', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontSize: 8.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{k.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: k.color, letterSpacing: '-0.02em' }}>{k.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, background: GOLD, color: '#000', fontSize: 12, fontWeight: 700, textDecoration: 'none', marginTop: 14 }}>
              Simuler en détail <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {/* ── RIGHT: large chart ── */}
          <div style={{ padding: '20px 20px 16px', background: '#07070a', display: 'flex', flexDirection: 'column' }}>

            {/* View tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Croissance', 'Répartition', 'Score'] as const).map((label, i) => (
                  <button key={label} onClick={() => setChartView(i)} style={{
                    fontSize: 9.5, fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: chartView === i ? (i === 0 ? GOLD + '22' : i === 1 ? 'rgba(139,92,246,0.18)' : 'rgba(251,146,60,0.18)') : 'transparent',
                    color: chartView === i ? (i === 0 ? GOLD : i === 1 ? '#a78bfa' : '#fb923c') : 'rgba(255,255,255,0.22)',
                    transition: 'all 0.2s', fontFamily: 'inherit',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              {chartView === 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ color: GOLD, label: 'Capital total' }, { color: '#34d399', label: 'Investi', dashed: true }].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width={16} height={6}><line x1={0} y1={3} x2={16} y2={3} stroke={l.color} strokeWidth={l.dashed ? 1.5 : 2} strokeDasharray={l.dashed ? '3,2' : undefined} /></svg>
                      <span style={{ fontSize: 9, color: '#9ca3af' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chart area — switches between 3 views */}
            <div style={{ flex: 1, position: 'relative', minHeight: CH }}>

            {/* View 1: Allocation pie (chartView === 1) */}
            <div style={{ position: 'absolute', inset: 0, opacity: chartView === 1 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: chartView === 1 ? 'all' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
              {(() => {
                const pctInt = Math.round((interests / total) * 100)
                const pctInv = 100 - pctInt
                const R = 70, cx = 80, cy = 90
                const angle = (pctInt / 100) * 2 * Math.PI
                const x1 = cx + R * Math.sin(0), y1 = cy - R * Math.cos(0)
                const x2 = cx + R * Math.sin(angle), y2 = cy - R * Math.cos(angle)
                const large = angle > Math.PI ? 1 : 0
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                    <svg width={160} height={180} viewBox="0 0 160 180" style={{ display: 'block' }}>
                      <circle cx={cx} cy={cy} r={R} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`} fill={GOLD} opacity={0.85} />
                      <path d={`M ${cx} ${cy} L ${x2.toFixed(1)} ${y2.toFixed(1)} A ${R} ${R} 0 ${1 - large} 1 ${x1} ${y1} Z`} fill="rgba(52,211,153,0.7)" />
                      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={GOLD}>{pctInt}%</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.35)">intérêts</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {[
                        { color: GOLD, label: 'Intérêts générés', value: fmtK(interests), pct: pctInt },
                        { color: '#34d399', label: 'Capital investi', value: fmtK(invested), pct: pctInv },
                      ].map(s => (
                        <div key={s.label}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#4b5563' }}>{s.label}</span>
                          </div>
                          <p style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', margin: 0 }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{s.pct}% du total</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* View 2: Score gauge (chartView === 2) */}
            <div style={{ position: 'absolute', inset: 0, opacity: chartView === 2 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: chartView === 2 ? 'all' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              {(() => {
                const score = 74
                const cx = 90, cy = 100, R = 68, SW = 12
                const perim = 2 * Math.PI * R
                const arcFrac = 0.68
                const arcLen = arcFrac * perim
                const filledLen = (score / 100) * arcLen
                const rot = -90 - arcFrac * 180
                const pillars = [{ label: 'Sécurité', pct: 0.82, color: '#38bdf8' }, { label: 'Immobilier', pct: 0.60, color: '#34d399' }, { label: 'Long terme', pct: 0.78, color: GOLD }, { label: 'Diversif.', pct: 0.55, color: '#fb923c' }, { label: 'Risque', pct: 0.90, color: '#a78bfa' }]
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                    <svg width={180} height={200} viewBox="0 0 180 200" style={{ display: 'block' }}>
                      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} strokeDasharray={`${arcLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
                      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#fb923c" strokeWidth={SW} strokeLinecap="round" strokeDasharray={`${filledLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
                      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="30" fontWeight="800" fill="#fb923c">{score}</text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.3)">/ 100</text>
                      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.55)">Bien</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {pillars.map(p => (
                        <div key={p.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: '#6b7280' }}>{p.label}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>{Math.round(p.pct * 100)}%</span>
                          </div>
                          <div style={{ width: 110, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                            <div style={{ width: `${p.pct * 100}%`, height: '100%', background: p.color, borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* View 0: Growth chart (default) */}
            <div style={{ position: chartView === 0 ? 'relative' : 'absolute', inset: chartView === 0 ? 'auto' : 0, opacity: chartView === 0 ? 1 : 0, transition: 'opacity 0.5s', pointerEvents: chartView === 0 ? 'all' : 'none' }}>
              <svg width="100%" height={CH} viewBox={`0 0 ${CW} ${CH}`} style={{ overflow: 'visible', display: 'block' }}>
                <defs>
                  <linearGradient id="hcc-total" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={GOLD} stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="hcc-interest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.02" />
                  </linearGradient>
                  <clipPath id="hcc-clip">
                    <rect x={PAD.left} y={PAD.top} width={gW} height={gH} />
                  </clipPath>
                </defs>

                {/* Horizontal grid lines */}
                {yTicks.map((t, i) => (
                  <g key={i}>
                    <line x1={PAD.left} y1={t.y} x2={PAD.left + gW} y2={t.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                    {i > 0 && (
                      <text x={PAD.left + gW + 5} y={t.y + 4} fontSize={8.5} fill="rgba(0,0,0,0.35)" textAnchor="start">
                        {fmtK(t.v)}
                      </text>
                    )}
                  </g>
                ))}

                {/* X axis ticks */}
                {xTicks.map(y => (
                  <g key={y}>
                    <line x1={toX(y)} y1={PAD.top + gH} x2={toX(y)} y2={PAD.top + gH + 4} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                    <text x={toX(y)} y={PAD.top + gH + 16} fontSize={9} fill="rgba(0,0,0,0.4)" textAnchor="middle">{y}a</text>
                  </g>
                ))}

                {/* Clipped chart areas */}
                <g clipPath="url(#hcc-clip)">
                  {/* Interest zone (between invested and total) */}
                  <polygon points={areaInterest} fill="url(#hcc-interest)" />
                  {/* Total area */}
                  <polygon points={areaTotal} fill="url(#hcc-total)" />
                  {/* Invested dashed line */}
                  <polyline points={investedCoords} fill="none" stroke="#34d399" strokeWidth={1.5} strokeDasharray="5,3" strokeLinejoin="round" opacity={0.6} />
                  {/* Total line */}
                  <polyline points={totalCoords} fill="none" stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </g>

                {/* Final value callout */}
                <line x1={lastX} y1={lastTotalY} x2={lastX} y2={PAD.top + gH} stroke={`${GOLD}30`} strokeWidth={1} strokeDasharray="3,2" />
                {/* Dot on total */}
                <circle cx={lastX} cy={lastTotalY} r={5} fill={GOLD} />
                <circle cx={lastX} cy={lastTotalY} r={10} fill={GOLD} opacity={0.12} />
                {/* Dot on invested */}
                <circle cx={lastX} cy={lastInvY} r={3.5} fill="#34d399" opacity={0.8} />

                {/* Capital final label */}
                <rect x={lastX - 52} y={lastTotalY - 30} width={58} height={24} rx={5} fill="#0a0a0e" stroke={`${GOLD}44`} strokeWidth={1} />
                <text x={lastX - 23} y={lastTotalY - 21} fontSize={9} fill="rgba(255,255,255,0.4)" textAnchor="middle">Capital</text>
                <text x={lastX - 23} y={lastTotalY - 11} fontSize={10} fontWeight="700" fill={GOLD} textAnchor="middle">{fmtK(total)}</text>
              </svg>
            </div>{/* end view 0 */}
            </div>{/* end chart area */}

            {/* Bottom bar: interests highlight */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#4b5563', flex: 1 }}>Intérêts générés par l&apos;effet boule de neige</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>{fmtK(interests)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Live Activity Feed ────────────────────────────────────────────────────
const ACTIVITY_ENTRIES = [
  { name: 'Sophie M.', action: 'Score patrimonial :', result: '74 / 100', ago: '2 min', color: GOLD },
  { name: 'Thomas L.', action: 'FIRE dans', result: '14 ans', ago: '5 min', color: '#34d399' },
  { name: 'Julie R.', action: 'Économies fiscales :', result: '4 200 €/an', ago: '7 min', color: '#818cf8' },
  { name: 'Marc D.', action: 'Retraite anticipée à', result: '54 ans', ago: '11 min', color: '#fb923c' },
  { name: 'Camille B.', action: 'Rendement locatif :', result: '6.4 % net', ago: '14 min', color: '#2dd4bf' },
  { name: 'Antoine P.', action: 'Économie sur prêt :', result: '−23 400 €', ago: '18 min', color: '#f472b6' },
  { name: 'Léa T.', action: 'Capital dans 20 ans :', result: '186 k€', ago: '22 min', color: GOLD },
  { name: 'Romain C.', action: 'DCA sur 15 ans :', result: '×3.2 capital', ago: '26 min', color: '#38bdf8' },
]

function LiveActivityFeed() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % ACTIVITY_ENTRIES.length); setVisible(true) }, 300)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  const entry = ACTIVITY_ENTRIES[idx]

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0, animation: 'glow-pulse 2s infinite' }} />
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.28s', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontWeight: 700, color: '#111827' }}>{entry.name}</span>
        <span style={{ color: '#6b7280' }}>·</span>
        <span style={{ color: '#4b5563' }}>{entry.action}</span>
        <span style={{ fontWeight: 700, color: entry.color }}>{entry.result}</span>
        <span style={{ color: '#9ca3af', fontSize: 11 }}>· il y a {entry.ago}</span>
      </div>
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {ACTIVITY_ENTRIES.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 14 : 4, height: 4, borderRadius: 2, background: i === idx ? GOLD : 'rgba(0,0,0,0.15)', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Personalization Quiz ──────────────────────────────────────────────────
const QUIZ_OPTIONS = [
  { emoji: '🔥', label: 'Préparer ma retraite', desc: 'FIRE, retraite anticipée, indépendance financière', href: '/tools/fire', color: '#fb923c' },
  { emoji: '📈', label: 'Investir en bourse', desc: 'PEA, CTO, ETF, fiscalité optimisée', href: '/tools/pea-cto-av', color: '#818cf8' },
  { emoji: '🏠', label: 'Acheter un bien', desc: 'Crédit immobilier, achat vs louer', href: '/tools/pret-immobilier', color: '#f472b6' },
  { emoji: '🧾', label: 'Calculer mes impôts', desc: 'IR, flat tax vs barème, optimisation', href: '/tools/flat-tax-bareme', color: '#34d399' },
]

function PersonalizationQuiz() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (i: number) => {
    setSelected(i)
    setTimeout(() => router.push(QUIZ_OPTIONS[i].href), 420)
  }

  return (
    <section style={{ padding: '80px 20px 100px', background: 'linear-gradient(to bottom, transparent, rgba(241,192,134,0.025), transparent)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
        <RevealSection>
          <SectionTag><Target style={{ width: 11, height: 11 }} /> Démarrez en 10 secondes</SectionTag>
          <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
            Quel est votre objectif{' '}
            <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>principal ?</span>
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            Choisissez votre priorité — vous atterrissez directement sur le bon simulateur.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12, textAlign: 'left' }}>
            {QUIZ_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  padding: '22px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  background: selected === i ? `${opt.color}18` : '#ffffff',
                  border: `1px solid ${selected === i ? opt.color + '55' : 'rgba(0,0,0,0.09)'}`,
                  transition: 'all 0.22s', transform: selected === i ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: selected === i ? `0 8px 32px ${opt.color}28` : 'none',
                  fontFamily: 'inherit', width: '100%',
                }}
                onMouseEnter={e => { if (selected !== i) { (e.currentTarget as HTMLElement).style.borderColor = opt.color + '40'; (e.currentTarget as HTMLElement).style.background = `${opt.color}0d` } }}
                onMouseLeave={e => { if (selected !== i) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.09)'; (e.currentTarget as HTMLElement).style.background = '#ffffff' } }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{opt.emoji}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected === i ? opt.color : '#111827', marginBottom: 5, lineHeight: 1.3 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>{opt.desc}</div>
                {selected === i && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: opt.color }}>
                    Ouverture… <ArrowRight style={{ width: 10, height: 10 }} />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>Sans inscription · Résultats instantanés · Données sécurisées</p>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Sticky mobile CTA ────────────────────────────────────────────────────
function StickyMobileCTA() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const fn = () => {
      const nearBottom = window.scrollY + window.innerHeight >= document.body.scrollHeight - 300
      setHidden(nearBottom)
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <div className="md:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, padding: '10px 16px 18px', background: 'linear-gradient(to top, rgba(4,4,4,0.97) 60%, transparent)', transform: hidden ? 'translateY(100%)' : 'translateY(0)', transition: 'transform 0.3s ease' }}>
      <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px 20px', borderRadius: 14, background: GOLD, color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: `0 8px 32px ${GOLD}50`, letterSpacing: '-0.01em' }}>
        Calculer mon patrimoine — Gratuit <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
    </div>
  )
}

export function LandingClient() {
  const router = useRouter()
  const [introComplete, setIntroComplete] = useState(() => {
    if (typeof window !== 'undefined') return !!sessionStorage.getItem('patrimo_intro')
    return false
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // ── Smooth scroll (Lenis) + ScrollTrigger animations ──────────────────────
  useSmoothScroll()
  useScrollAnimations(introComplete)
  const [heroVisible, setHeroVisible] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openMenuDelayed = (key: string) => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current)
    setOpenMenu(key)
  }
  const closeMenuDelayed = () => {
    menuCloseTimer.current = setTimeout(() => setOpenMenu(null), 120)
  }

  const loginAsDemo = async () => {
    setDemoLoading(true)
    const res = await signIn('credentials', { email: 'demo@digitalstack.cloud', password: 'demo@2026', redirect: false })
    if (res?.ok) router.push('/dashboard/patrimoine')
    else setDemoLoading(false)
  }

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    setTimeout(() => setHeroVisible(true), 100)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ background: '#ffffff', color: '#111827', minHeight: '100vh', fontFamily: "'Inter Tight', 'Inter', 'Geist', system-ui, sans-serif", overflowX: 'hidden' }}>
      {!introComplete && <FIntroAnimation onDone={() => { sessionStorage.setItem('patrimo_intro', '1'); setIntroComplete(true) }} />}

      {/* ── NAVBAR — floating pill (Finorio style) ──────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'calc(100% - 32px)',
        maxWidth: 1152,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s',
      }}>
        <div style={{ padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <PatrimoLogo width={130} uid="nav" variant="light" />
          </Link>

          {/* Desktop nav — dropdowns */}
          <div style={{ alignItems: 'center', gap: 2 }} className="hidden md:flex">

            {/* Taux en direct — live dot + simple link */}
            <a href="#rates" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 400, color: '#6b7280', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block', flexShrink: 0 }} />
              Taux en direct
            </a>

            {/* Simulateurs dropdown */}
            {(() => {
              const key = 'sim'
              const items = [
                { icon: TrendingUp, label: 'Intérêts composés', desc: 'Visualisez la croissance de votre épargne', color: GOLD, href: '/tools/interets-composes' },
                { icon: Flame, label: 'FI/RE', desc: 'Calculez votre date d\'indépendance financière', color: '#fb923c', href: '/tools/fire' },
                { icon: Home, label: 'Crédit immobilier', desc: 'Mensualités, coût total, amortissement', color: '#f472b6', href: '/tools/pret-immobilier' },
                { icon: Scale, label: 'Acheter vs Louer', desc: 'Comparaison patrimoniale sur 20 ans', color: '#38bdf8', href: '/tools/acheter-ou-louer' },
                { icon: Receipt, label: 'Flat Tax vs Barème', desc: 'Optimisez vos revenus de capitaux', color: '#818cf8', href: '/tools/flat-tax-bareme' },
                { icon: Landmark, label: 'PEA vs CTO vs AV', desc: 'Choisissez la meilleure enveloppe fiscale', color: '#fb923c', href: '/tools/pea-cto-av' },
                { icon: PiggyBank, label: 'Retraite', desc: 'Estimez votre pension et épargne nécessaire', color: '#a78bfa', href: '/tools/retraite' },
                { icon: RefreshCw, label: 'DCA', desc: 'Simulez l\'investissement régulier automatisé', color: '#22c55e', href: '/tools/dca' },
                { icon: Calculator, label: 'Impôts IR', desc: 'Calculez votre impôt sur le revenu', color: '#34d399', href: '/tools/impots-ir' },
                { icon: Percent, label: 'Budget 50/30/20', desc: 'Optimisez la répartition de vos revenus', color: '#60a5fa', href: '/tools/budget-50-30-20' },
              ]
              return (
                <div style={{ position: 'relative' }} onMouseEnter={() => openMenuDelayed(key)} onMouseLeave={closeMenuDelayed}>
                  <Link href="/tools" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, color: openMenu === key ? '#111827' : '#6b7280', background: openMenu === key ? 'rgba(0,0,0,0.05)' : 'transparent', padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s', textDecoration: 'none' }}>
                    Simulateurs <ChevronDown style={{ width: 12, height: 12, transition: 'transform 0.2s', transform: openMenu === key ? 'rotate(180deg)' : 'none' }} />
                  </Link>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', paddingTop: 10, transform: openMenu === key ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)', opacity: openMenu === key ? 1 : 0, pointerEvents: openMenu === key ? 'all' : 'none', transition: 'opacity 0.2s, transform 0.2s', zIndex: 200 }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 16, width: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {items.map(it => (
                        <Link key={it.label} href={it.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: it.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <it.icon style={{ width: 13, height: 13, color: it.color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{it.label}</p>
                            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{it.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 10, paddingTop: 10 }}>
                      <Link href="/tools" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: GOLD, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = GOLD + '10' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Voir tous les simulateurs → <BarChart3 style={{ width: 11, height: 11 }} />
                      </Link>
                    </div>
                  </div>
                  </div>
                </div>
              )
            })()}

            {/* Patrimoine dropdown */}
            {(() => {
              const key = 'pat'
              const items = [
                { icon: LayoutDashboard, label: 'Vue d\'ensemble', desc: 'Dashboard global : valeur, répartition, carte monde', color: GOLD, href: '/patrimoine/vue-ensemble' },
                { icon: BarChart3, label: 'Mon portefeuille', desc: 'Positions live via Finnhub & CoinGecko', color: '#38bdf8', href: '/patrimoine/mon-portefeuille' },
                { icon: Award, label: 'Score patrimonial', desc: 'Notation 0-100 sur 6 piliers', color: '#a78bfa', href: '/patrimoine/score-patrimonial' },
                { icon: Target, label: 'Mes objectifs', desc: 'Progression vers vos objectifs financiers', color: '#fb923c', href: '/patrimoine/mes-objectifs' },
                { icon: FileText, label: 'Rapport fiscal', desc: 'Plus-values, durées, optimisation', color: '#34d399', href: '/patrimoine/rapport-fiscal' },
                { icon: BookOpen, label: 'Carnet d\'ordres', desc: 'Journal BUY/SELL/DIVIDEND + P&L', color: '#c084fc', href: '/patrimoine/carnet-ordres' },
              ]
              return (
                <div style={{ position: 'relative' }} onMouseEnter={() => openMenuDelayed(key)} onMouseLeave={closeMenuDelayed}>
                  <Link href="/patrimoine" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, color: openMenu === key ? '#111827' : '#6b7280', background: openMenu === key ? 'rgba(0,0,0,0.05)' : 'transparent', padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s', textDecoration: 'none' }}>
                    Patrimoine <ChevronDown style={{ width: 12, height: 12, transition: 'transform 0.2s', transform: openMenu === key ? 'rotate(180deg)' : 'none' }} />
                  </Link>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', paddingTop: 10, transform: openMenu === key ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)', opacity: openMenu === key ? 1 : 0, pointerEvents: openMenu === key ? 'all' : 'none', transition: 'opacity 0.2s, transform 0.2s', zIndex: 200 }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 16, width: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {items.map(it => (
                        <Link key={it.label} href={it.href} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: it.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                            <it.icon style={{ width: 13, height: 13, color: it.color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{it.label}</p>
                            <p style={{ fontSize: 11, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>{it.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', marginTop: 10, paddingTop: 10 }}>
                      <Link href="/patrimoine" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: GOLD, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = GOLD + '10' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        Voir toutes les pages de gestion → <Globe style={{ width: 11, height: 11 }} />
                      </Link>
                    </div>
                  </div>
                  </div>
                </div>
              )
            })()}

            {/* Ressources dropdown */}
            {(() => {
              const key = 'res'
              const links = [
                { label: 'Comment ça marche ?', desc: 'Comprendre PatrImo en 3 étapes', href: '#how', color: GOLD },
                { label: 'Pour qui ?', desc: 'Épargnants, investisseurs, expatriés…', href: '#pour-qui', color: '#38bdf8' },
                { label: 'Avis utilisateurs', desc: 'Ce que pensent nos membres', href: '#avis', color: '#a78bfa' },
                { label: 'FAQ', desc: 'Questions fréquentes', href: '#faq', color: '#34d399' },
              ]
              return (
                <div style={{ position: 'relative' }} onMouseEnter={() => openMenuDelayed(key)} onMouseLeave={closeMenuDelayed}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, color: openMenu === key ? '#111827' : '#6b7280', background: openMenu === key ? 'rgba(0,0,0,0.05)' : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s' }}>
                    Ressources <ChevronDown style={{ width: 12, height: 12, transition: 'transform 0.2s', transform: openMenu === key ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', paddingTop: 10, transform: openMenu === key ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)', opacity: openMenu === key ? 1 : 0, pointerEvents: openMenu === key ? 'all' : 'none', transition: 'opacity 0.2s, transform 0.2s', zIndex: 200 }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 16, width: 300, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                    {links.map(it => (
                      <a key={it.label} href={it.href} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{it.label}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{it.desc}</span>
                      </a>
                    ))}
                  </div>
                  </div>
                </div>
              )
            })()}

            {/* À propos dropdown */}
            {(() => {
              const key = 'about'
              const links = [
                { label: 'Nos engagements', desc: 'Transparence, éthique, données', href: '#why' },
                { label: 'Sécurité', desc: 'Zéro donnée bancaire, chiffrement AES-256', href: '#security' },
                { label: 'Roadmap', desc: 'Les fonctionnalités à venir', href: '#roadmap' },
                { label: 'Comparatif', desc: 'PatrImo vs alternatives', href: '#comparatif' },
              ]
              return (
                <div style={{ position: 'relative' }} onMouseEnter={() => openMenuDelayed(key)} onMouseLeave={closeMenuDelayed}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, color: openMenu === key ? '#111827' : '#6b7280', background: openMenu === key ? 'rgba(0,0,0,0.05)' : 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'all 0.15s' }}>
                    À propos <ChevronDown style={{ width: 12, height: 12, transition: 'transform 0.2s', transform: openMenu === key ? 'rotate(180deg)' : 'none' }} />
                  </button>
                  <div style={{ position: 'absolute', top: '100%', left: '50%', paddingTop: 10, transform: openMenu === key ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)', opacity: openMenu === key ? 1 : 0, pointerEvents: openMenu === key ? 'all' : 'none', transition: 'opacity 0.2s, transform 0.2s', zIndex: 200 }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 16, padding: 16, width: 280, boxShadow: '0 24px 60px rgba(0,0,0,0.15)' }}>
                    {links.map(it => (
                      <a key={it.label} href={it.href} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{it.label}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{it.desc}</span>
                      </a>
                    ))}
                  </div>
                  </div>
                </div>
              )
            })()}

          </div>

          {/* Desktop CTA */}
          <div style={{ alignItems: 'center', gap: 10 }} className="hidden md:flex">
            {/* Se connecter — bordered ghost button */}
            <Link href="/login"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#ffffff', letterSpacing: '-0.01em', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}>
              Se connecter
            </Link>
            {/* Commencer — dark gradient button (Finorio style) */}
            <Link href="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500, color: '#ffffff', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.10)', background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25', boxShadow: '0 1px 2px 0 rgba(21,14,27,0.24), 0 0 0 1px #000', letterSpacing: '-0.01em', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 100%), #2d2f3a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25' }}>
              Commencer <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#ffffff', cursor: 'pointer' }}
          >
            <div style={{ width: 18, height: 12, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{
                display: 'block', height: 1.5, background: '#374151', borderRadius: 2,
                transformOrigin: 'center',
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: menuOpen ? 'translateY(5.25px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', height: 1.5, background: '#374151', borderRadius: 2,
                transformOrigin: 'center',
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: menuOpen ? 'translateY(-5.25px) rotate(-45deg)' : 'none',
              }} />
            </div>
          </button>
        </div>

        {/* Mobile menu — expands inside the pill */}
        <div style={{
          overflow: 'hidden',
          maxHeight: menuOpen ? 680 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
          borderTop: menuOpen ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
          borderRadius: '0 0 16px 16px',
        }}>
          <div style={{ padding: '16px 24px 20px' }}>
            {[
              ['#rates', 'Taux en direct'],
              ['/tools', 'Tous les simulateurs'],
              ['#modules', 'Patrimoine'],
              ['#how', 'Comment ça marche ?'],
              ['#pour-qui', 'Pour qui ?'],
              ['#avis', 'Avis'],
              ['#faq', 'FAQ'],
              ['#why', 'Nos engagements'],
              ['#security', 'Sécurité'],
              ['#roadmap', 'Roadmap'],
              ['#comparatif', 'Comparatif'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', padding: '12px 0', fontSize: 15, color: '#374151', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
              >
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                Se connecter
              </Link>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 10, background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 0 0 1px #000', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 96, paddingBottom: 24, paddingLeft: 24, paddingRight: 24, overflow: 'hidden', background: 'linear-gradient(180deg, #DDD7FE 0%, #f3f0ff 45%, #ffffff 100%)' }}>

        {/* ── Purple-accent decorative layers ── */}

        {/* 1. Soft left-edge shimmer */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, zIndex: 2,
          background: 'linear-gradient(to bottom, rgba(139,92,246,0.6) 0%, rgba(198,189,250,0.35) 50%, transparent 85%)',
          pointerEvents: 'none',
        }} />

        {/* 2. Large purple bloom — upper left */}
        <div style={{
          position: 'absolute', top: -180, left: -220, width: 860, height: 860,
          background: 'radial-gradient(ellipse at top left, rgba(139,92,246,0.18) 0%, rgba(198,189,250,0.08) 45%, transparent 68%)',
          pointerEvents: 'none', filter: 'blur(32px)',
        }} />

        {/* 3. Gold accent bloom — mid left (brand signature) */}
        <div style={{
          position: 'absolute', top: '30%', left: -120, width: 520, height: 520,
          background: `radial-gradient(ellipse at left center, ${GOLD}14 0%, transparent 65%)`,
          pointerEvents: 'none', filter: 'blur(40px)',
        }} />

        {/* 4. Soft violet haze — top center */}
        <div style={{
          position: 'absolute', top: -80, left: '20%', right: '20%', height: 280,
          background: 'radial-gradient(ellipse at 50% top, rgba(167,139,250,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* 5. Right edge — faint lavender counter-balance */}
        <div style={{
          position: 'absolute', top: -80, right: -120, width: 500, height: 500,
          background: 'radial-gradient(ellipse at top right, rgba(167,139,250,0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Floating icons — reduced opacity to not fight the gradients */}
        {FLOAT_ICONS.map((f, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${f.x}%`, top: `${f.y}%`,
            opacity: f.opacity * 0.7,
            pointerEvents: 'none',
            animation: `float-slow ${f.dur}s ease-in-out infinite ${f.delay}s`,
            width: f.size + 18, height: f.size + 18,
            borderRadius: '50%',
            background: f.color + '12',
            border: `1px solid ${f.color}1e`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <f.Icon style={{ width: Math.round(f.size * 0.52), height: Math.round(f.size * 0.52), color: f.color }} />
          </div>
        ))}

        {/* Fine grain overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.022, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '200px' }} />

        {/* Two-column hero */}
        <div className="hero-two-col" style={{
          position: 'relative', maxWidth: 1400, width: '100%',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
          transition: 'all 0.8s ease',
        }}>

          {/* ── LEFT: text content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Badge — Finorio glassmorphism pill with gradient border */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              borderRadius: 100,
              marginBottom: 20,
              padding: 1,
              background: 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.15))',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                borderRadius: 100,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(3.65px)',
                WebkitBackdropFilter: 'blur(3.65px)',
                padding: '4px 12px 4px 4px',
              }}>
                <span style={{
                  borderRadius: 100,
                  background: '#C6BDFA',
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: 400,
                  color: '#181B25',
                }}>Nouveau</span>
                <span style={{ fontSize: 13, fontWeight: 300, color: '#4b5563', letterSpacing: '0.01em' }}>
                  18 simulateurs · Fiscalité 2026
                </span>
              </div>
            </div>

            {/* Headline — Finorio light weight */}
            <h1 style={{ fontSize: 'clamp(2rem,3.2vw,3.6rem)', fontWeight: 300, lineHeight: 1.12, letterSpacing: '-0.075em', color: '#181B25', marginBottom: 16, textAlign: 'left' }}>
              Gérez vos finances<br />
              avec <span style={{ fontWeight: 300, color: '#7c3aed' }}>confiance</span>
            </h1>

            <p style={{ fontSize: 15, fontWeight: 300, color: '#6b7280', lineHeight: 1.7, maxWidth: 420, marginBottom: 28, letterSpacing: '0.01em' }}>
              18 simulateurs financiers 100&nbsp;% gratuits — impôts, FIRE, patrimoine — sans jamais toucher à vos comptes.
            </p>

            {/* CTAs — Finorio dark button style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <Link href="/login" className="cta-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#ffffff', textDecoration: 'none', background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 1px 2px 0 rgba(21,14,27,0.24), 0 0 0 1px #000', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 100%), #2d2f3a' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25' }}>
                Commencer gratuitement <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#181B25', textDecoration: 'none', background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}>
                Se connecter
              </Link>
            </div>

            {/* Social proof + demo link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['#34d399','#f472b6','#818cf8','#fbbf24'].map((c, i) => (
                  <div key={i} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${c}cc, ${c}55)`,
                    border: '2px solid #ede9fe',
                    marginLeft: i === 0 ? 0 : -7,
                    zIndex: 4 - i,
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: '#fff',
                  }}>
                    {['J','M','A','T'][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>3 847</span> utilisateurs · 0 pub · 100 % gratuit
              </span>
              <span style={{ color: '#d1d5db', fontSize: 12 }}>·</span>
              <button
                onClick={loginAsDemo}
                disabled={demoLoading}
                style={{ background: 'none', border: 'none', cursor: demoLoading ? 'wait' : 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 12, color: GOLD, opacity: 0.7, transition: 'opacity 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
              >
                {demoLoading ? 'Connexion…' : '⚡ Compte démo'}
              </button>
            </div>
          </div>

          {/* ── RIGHT: live compound calc ── */}
          <div style={{ position: 'relative', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(24px) scale(0.97)', transition: 'all 1s ease 0.25s' }}>
            <HeroCompoundCalc />
          </div>
        </div>

        {/* Scroll indicator */}
        <HeroScrollIndicator />
      </section>

      <SectionDivider />

      {/* ── LIVE ACTIVITY FEED ────────────────────────────────────────── */}
      <LiveActivityFeed />

      {/* ── SOCIAL PROOF ──────────────────────────────────────────────── */}
      <SocialProofBar />

      <SectionDivider />

      {/* ── INTERACTIVE DEMO ──────────────────────────────────────────── */}
      <section id="demo" style={{ padding: '60px 20px 100px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>

          {/* Section header */}
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <SectionTag><Zap style={{ width: 11, height: 11 }} /> Essayez maintenant nos simulateurs</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 10px' }}>
                Commençons{' '}
                <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>maintenant</span>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>
                Manipulez les curseurs en temps réel — sans inscription, sans données bancaires.
              </p>
            </div>
          </RevealSection>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 16, alignItems: 'stretch' }}>

            {/* Left column — FIRE calc + Opportunity cost */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <RevealSection>
                <HeroFireCalc />
              </RevealSection>
              <RevealSection delay={80}>
                <OpportunityCostWidget />
              </RevealSection>
            </div>

            {/* Right column — tabbed simulator */}
            <RevealSection delay={120} style={{ height: '100%' }}>
              <div style={{ height: '100%' }}>
                <InteractiveDemo />
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── TOOLS TICKER ──────────────────────────────────────────────── */}
      <ToolsTicker />

      {/* ── RATES WIDGET ──────────────────────────────────────────────── */}
      <RatesWidget />

      <SectionDivider />

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <section id="modules" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>

          {/* Header */}
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionTag><BarChart3 style={{ width: 11, height: 11 }} /> 18 simulateurs</SectionTag>
              <h2 style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
                Tous les outils pour{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>maîtriser vos finances</span>
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', margin: '0', lineHeight: 1.7, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
                Des simulateurs complets et gratuits pour chaque aspect de votre vie financière.
              </p>
            </div>
          </RevealSection>

          {/* Bento — 3 featured cards with mini charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 12 }}>
            <RevealSection delay={0}><BentoFeaturedCard mod={MODULES[0]} preview={<MiniCompound />} /></RevealSection>
            <RevealSection delay={80}><BentoFeaturedCard mod={MODULES[2]} preview={<MiniFireChart />} /></RevealSection>
            <RevealSection delay={160}><BentoFeaturedCard mod={MODULES[4]} preview={<MiniMortgage />} /></RevealSection>
          </div>

          {/* Remaining modules — all bento with mini charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 12 }}>
            <RevealSection delay={0}><BentoFeaturedCard mod={MODULES[1]} preview={<MiniDCA />} /></RevealSection>
            <RevealSection delay={60}><BentoFeaturedCard mod={MODULES[3]} preview={<MiniAcheterVsLouer />} /></RevealSection>
            <RevealSection delay={120}><BentoFeaturedCard mod={MODULES[5]} preview={<MiniLocatif />} /></RevealSection>
            <RevealSection delay={180}><BentoFeaturedCard mod={MODULES[6]} preview={<MiniImpots />} /></RevealSection>
            <RevealSection delay={240}><BentoFeaturedCard mod={MODULES[7]} preview={<MiniRetraite />} /></RevealSection>
            <RevealSection delay={300}><BentoFeaturedCard mod={MODULES[8]} preview={<MiniBudget />} /></RevealSection>
            <RevealSection delay={360}><BentoFeaturedCard mod={MODULES[9]} preview={<MiniFlatTax />} /></RevealSection>
            <RevealSection delay={420}><BentoFeaturedCard mod={MODULES[10]} preview={<MiniPEAvsCTO />} /></RevealSection>
            <RevealSection delay={480}><BentoFeaturedCard mod={MODULES[11]} preview={<MiniTauxEpargne />} /></RevealSection>
            <RevealSection delay={540}><BentoFeaturedCard mod={MODULES[12]} preview={<MiniScore />} /></RevealSection>
            <RevealSection delay={600}><BentoFeaturedCard mod={MODULES[13]} preview={<MiniEmergencyFund />} /></RevealSection>
            <RevealSection delay={660}><BentoFeaturedCard mod={MODULES[14]} preview={<MiniConsumerCredit />} /></RevealSection>
            <RevealSection delay={720}><BentoFeaturedCard mod={MODULES[15]} preview={<MiniSuccession />} /></RevealSection>
            <RevealSection delay={780}><BentoFeaturedCard mod={MODULES[16]} preview={<MiniDividends />} /></RevealSection>
            <RevealSection delay={840}><BentoFeaturedCard mod={MODULES[17]} preview={<MiniBenchmark />} /></RevealSection>
          </div>

          {/* CTA strip — after all 9 cards */}
          <RevealSection delay={100}>
            <div style={{ textAlign: 'center', padding: '48px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>18 simulateurs · 100 % gratuit · sans carte bancaire</p>
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 100, border: '1px solid rgba(0,0,0,0.15)', color: '#4b5563', fontWeight: 600, fontSize: 13, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)'; e.currentTarget.style.color = '#111827' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = '#4b5563' }}>
                Accéder à tous les simulateurs <ArrowRight style={{ width: 13, height: 13 }} />
              </Link>
            </div>
          </RevealSection>

        </div>
      </section>

      {/* ── GESTION & SUIVI ───────────────────────────────────────────── */}
      <section style={{ padding: '0 20px 80px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <SectionTag><Globe style={{ width: 11, height: 11 }} /> Gestion & Suivi</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
                Suivez votre patrimoine en temps réel
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>15 pages de gestion incluses dans votre compte PatrImo</p>
            </div>
          </RevealSection>

          {[
            {
              tag: 'Patrimoine', tagColor: GOLD,
              items: [
                { icon: Globe, label: 'Vue d\'ensemble', desc: 'Dashboard global : valeur totale, répartition par classe, carte monde géographique', color: GOLD },
                { icon: Building2, label: 'Immobilier', desc: 'Biens, valeur de marché, crédit restant et loyers perçus', color: '#f472b6' },
                { icon: TrendingUp, label: 'Actions & Fonds', desc: 'Positions en PEA, CTO, Assurance Vie, PER — valeur en temps réel', color: '#34d399' },
                { icon: PiggyBank, label: 'Livrets', desc: 'Livret A, LDDS, LEP avec suivi des plafonds et intérêts', color: '#38bdf8' },
                { icon: Bitcoin, label: 'Autres actifs', desc: 'Crypto-monnaies, métaux précieux et actifs alternatifs', color: '#fb923c' },
                { icon: Wallet, label: 'Comptes bancaires', desc: 'Soldes et suivi de vos comptes courants et d\'épargne', color: '#a78bfa' },
                { icon: Receipt, label: 'Emprunts', desc: 'Vue consolidée de tous vos crédits : immobilier, conso, pro', color: '#fb7185' },
                { icon: Layers, label: 'Détail enveloppe', desc: 'Page individuelle avec positions, historique et performance par enveloppe', color: '#4b5563' },
              ],
            },
            {
              tag: 'Suivi & Trading', tagColor: '#38bdf8',
              items: [
                { icon: BarChart3, label: 'Mon Portefeuille', desc: 'Positions boursières avec prix live via Finnhub & CoinGecko', color: '#38bdf8' },
                { icon: RefreshCw, label: 'Rééquilibrage', desc: 'Arbitrages nécessaires pour retrouver votre allocation cible', color: '#34d399' },
                { icon: Star, label: 'Mes Objectifs', desc: 'Objectifs financiers personnalisés avec barre de progression', color: GOLD },
                { icon: Layers, label: 'Carnet d\'ordres', desc: 'Journal BUY / SELL / DIVIDEND avec calcul du P&L réalisé', color: '#c084fc' },
              ],
            },
            {
              tag: 'Analyse & Fiscal', tagColor: '#818cf8',
              items: [
                { icon: Calculator, label: 'Rapport Fiscal', desc: 'Plus-values, durées de détention, optimisation par enveloppe', color: '#fbbf24' },
                { icon: Award, label: 'Score Patrimonial', desc: 'Notation 0-100 sur 6 piliers : épargne, dettes, diversification…', color: GOLD },
                { icon: Globe, label: 'Gestion personnelle', desc: 'Vue synthétique : allocation globale, objectifs, situation fiscale', color: '#818cf8' },
              ],
            },
          ].map(group => (
            <RevealSection key={group.tag}>
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.tagColor }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{group.tag}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {group.items.map(item => (
                    <Link key={item.label} href="/login" style={{ textDecoration: 'none' }}>
                      <div
                        style={{ background: 'rgba(0,0,0,0.015)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '18px 20px', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer', height: '100%', boxSizing: 'border-box' as const }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = item.color + '44'; el.style.background = item.color + '08' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,0,0,0.07)'; el.style.background = 'rgba(0,0,0,0.015)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: item.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon style={{ width: 15, height: 15, color: item.color }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{item.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </RevealSection>
          ))}

          <RevealSection>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 24, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)', color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Accéder à toutes les pages <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CASE STUDIES ──────────────────────────────────────────────── */}
      <CaseStudiesSection />

      {/* ── PERSONALIZATION QUIZ ──────────────────────────────────────── */}
      <PersonalizationQuiz />

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── POUR QUI ? ────────────────────────────────────────────────── */}
      <section id="pour-qui" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <SectionTag><Users style={{ width: 11, height: 11 }} /> Pour qui</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
                PatrImo s&apos;adapte à votre profil
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
                Que vous débutiez ou optimisiez, trouvez les outils faits pour vous.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[
                {
                  emoji: '🌱', label: 'Jeune actif 25–35 ans',
                  desc: 'Commencez à investir, visualisez la puissance des intérêts composés et planifiez votre indépendance financière.',
                  tools: ['Intérêts composés', 'DCA', 'FI/RE'],
                  color: '#34d399',
                },
                {
                  emoji: '🏠', label: 'Propriétaire',
                  desc: 'Optimisez votre crédit, calculez la rentabilité locative et comparez achat vs location.',
                  tools: ['Prêt immobilier', 'Acheter vs Louer', 'Locatif'],
                  color: '#f472b6',
                },
                {
                  emoji: '📈', label: 'Investisseur',
                  desc: 'Suivez votre portefeuille, optimisez votre fiscalité et choisissez la meilleure enveloppe.',
                  tools: ['PEA vs CTO vs AV', 'Flat Tax vs Barème', 'Portfolio'],
                  color: '#818cf8',
                },
                {
                  emoji: '🔥', label: 'Futur retraité',
                  desc: 'Planifiez votre retraite anticipée, calculez votre score patrimonial et simulez votre succession.',
                  tools: ['FI/RE', 'Retraite', 'Score Patrimonial'],
                  color: GOLD,
                },
              ].map(({ emoji, label, desc, tools, color }) => (
                <div key={label} style={{ borderRadius: 18, background: 'rgba(0,0,0,0.02)', border: `1px solid ${color}22`, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`, borderRadius: 18 }} />
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{emoji}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{label}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 18 }}>{desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {tools.map(t => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, padding: '3px 9px' }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── WHY FINCALC ───────────────────────────────────────────────── */}
      <section id="why" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,0,0,0.08) 50%,transparent)', marginBottom: 80 }} />

          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionTag><Star style={{ width: 11, height: 11 }} /> Pourquoi PatrImo</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
                Conçu pour les{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>investisseurs exigeants</span>
              </h2>
            </div>
          </RevealSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ gap: 10, alignItems: 'stretch' }}>
            {WHY.map((w, i) => (
              <RevealSection key={i} delay={i * 80} style={{ height: '100%' }}>
                <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', transition: 'border-color 0.2s, box-shadow 0.2s', height: '100%', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08)` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <w.icon style={{ width: 18, height: 18, color: GOLD }} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>{w.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{w.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      <section id="security" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(241,192,134,0.04) 0%, rgba(52,211,153,0.03) 100%)', border: `1px solid ${GOLD_BORDER}`, borderRadius: 28, padding: 'clamp(32px,5vw,64px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${GOLD}08, transparent 55%)`, pointerEvents: 'none' }} />

            <RevealSection>
              <div style={{ marginBottom: 44, position: 'relative' }}>
                <SectionTag><Shield style={{ width: 11, height: 11 }} /> Protection</SectionTag>
                <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 8px' }}>
                  Sécurité &{' '}
                  <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>confidentialité</span>
                </h2>
                <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginTop: 12, maxWidth: 500 }}>
                  Vos données personnelles et financières sont traitées avec le plus haut niveau de sécurité.
                </p>
              </div>
            </RevealSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, position: 'relative' }}>
              {SECURITY.map((s, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon style={{ width: 14, height: 14, color: GOLD }} />
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{s.title}</h3>
                    </div>
                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS MARQUEE ──────────────────────────────────────── */}
      <TestimonialsMarquee />

      {/* ── ROADMAP ───────────────────────────────────────────────────── */}
      <section id="roadmap" style={{ padding: '80px 20px 100px', background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.03), transparent)' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionTag><Clock style={{ width: 11, height: 11 }} /> Évolution continue</SectionTag>
              <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a', margin: '0 0 12px' }}>
                Ce qui arrive sur{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>PatrImo</span>
              </h2>
              <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
                PatrImo évolue en continu. Voici les fonctionnalités déjà disponibles et ce qui arrive.
              </p>
            </div>
          </RevealSection>

          {/* Phase groups with flip cards */}
          {ROADMAP_PHASES.map((phase, pi) => {
            const barColor = phase.id === 'done' ? '#34d399' : phase.id === 'wip' ? GOLD : 'rgba(0,0,0,0.2)'
            const badgeBg = phase.id === 'done' ? 'rgba(52,211,153,0.15)' : phase.id === 'wip' ? GOLD_DARK : 'rgba(0,0,0,0.05)'
            const badgeColor = phase.id === 'done' ? '#34d399' : phase.id === 'wip' ? GOLD : '#9ca3af'
            const displayItems = phase.id === 'planned' ? phase.items.slice(0, 9) : phase.items
            return (
              <RevealSection key={phase.id} delay={pi * 80}>
                <div style={{ marginBottom: 40 }}>
                  {/* Phase header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ height: 3, width: 32, background: barColor, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{phase.period}</span>
                    <div style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, border: `1px solid ${barColor}40`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' as any }}>
                      {phase.label}
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>{phase.items.length} fonctionnalités</span>
                  </div>
                  {/* Flip cards grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                    {displayItems.map((item, i) => (
                      <RoadmapFlipCard key={i} item={item} barColor={barColor} phaseId={phase.id} />
                    ))}
                    {phase.id === 'planned' && phase.items.length > 9 && (
                      <div style={{
                        height: 96, borderRadius: 12, border: '1px dashed rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#9ca3af',
                      }}>
                        + {phase.items.length - 9} autres…
                      </div>
                    )}
                  </div>
                </div>
              </RevealSection>
            )
          })}
        </div>
      </section>

      {/* ── COMPETITOR TABLE ──────────────────────────────────────────── */}
      <CompetitorTable />

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 16 }}>
                Questions fréquentes
              </div>
              <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.2 }}>
                Ce que vous vous demandez
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
              {[
                {
                  q: 'Est-ce vraiment gratuit, pour toujours ?',
                  a: 'Oui, PatrImo est 100 % gratuit. Aucune fonctionnalité premium cachée, aucune limitation dans le temps, aucune carte bancaire requise. Jamais.',
                },
                {
                  q: 'Faut-il connecter mon compte bancaire ?',
                  a: 'Non. PatrImo fonctionne sans aucun accès à vos comptes bancaires. Vous saisissez vous-même vos données — vous gardez le contrôle total.',
                },
                {
                  q: 'Où sont stockées mes données ?',
                  a: 'Vos données sont hébergées sur des serveurs sécurisés en Europe, conformément au RGPD. Elles ne sont jamais revendues, partagées, ni utilisées à des fins publicitaires.',
                },
                {
                  q: 'Les calculs sont-ils fiables ?',
                  a: 'Les simulateurs utilisent les formules financières standards (intérêts composés, amortissement, TMI 2026, PFU) et sont mis à jour chaque année. Ils sont indicatifs et ne remplacent pas un conseil financier personnalisé.',
                },
                {
                  q: 'PatrImo est-il adapté aux débutants ?',
                  a: 'Absolument. Les simulateurs sont conçus pour être compris sans formation financière. Chaque paramètre est accompagné d\'une explication, et les résultats sont présentés visuellement avec graphiques et synthèses claires.',
                },
                {
                  q: 'Puis-je utiliser PatrImo sur mobile ?',
                  a: 'Oui, PatrImo est entièrement responsive. L\'interface s\'adapte aux smartphones et tablettes. Une application native iOS & Android est également prévue sur la roadmap.',
                },
                {
                  q: 'Les calculs reflètent-ils la fiscalité 2026 ?',
                  a: 'Oui. Les barèmes IR, le PFU 30 %, les plafonds PEA, LDDS, LEP, les abattements successoraux et les taux de cotisations sont mis à jour chaque début d\'année pour refléter la loi de finances en vigueur.',
                },
                {
                  q: 'Comment fonctionne le compte démo ?',
                  a: 'Le compte démo donne un accès immédiat à toutes les fonctionnalités de PatrImo avec des données pré-remplies. Il suffit de cliquer sur "Accéder au compte démo" sur la page d\'accueil — aucune inscription requise. Vos propres simulations ne sont pas affectées.',
                },
              ].map(({ q, a }, i) => (
                <FaqItem key={i} q={q} a={a} gold={GOLD} goldBorder={GOLD_BORDER} />
              ))}
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CTA BANNER — Finorio purple gradient style ─────────────── */}
      <section style={{ padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <RevealSection>
            {/* Outer card */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(221,215,254,0.40) 0%, #DDD7FE 100%)',
              borderRadius: 28,
              padding: 'clamp(40px,5vw,56px) 24px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative radial glow — bottom left */}
              <div style={{
                position: 'absolute', bottom: -60, left: -60, width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              {/* Decorative radial glow — bottom right */}
              <div style={{
                position: 'absolute', bottom: -60, right: -60, width: 300, height: 300,
                background: 'radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              {/* Top center shimmer */}
              <div style={{
                position: 'absolute', top: 0, left: '25%', right: '25%', height: 1,
                background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.8), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Content */}
              <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
                <h2 style={{
                  fontSize: 'clamp(1.6rem,3.5vw,2.4rem)',
                  fontWeight: 300,
                  lineHeight: 1.2,
                  letterSpacing: '-0.04em',
                  marginBottom: 12,
                  color: '#181B25',
                }}>
                  Prenez le contrôle de vos finances, simplement
                </h2>
                <p style={{ fontSize: 14, fontWeight: 300, letterSpacing: '0.02em', color: '#4b5563', lineHeight: 1.7, marginBottom: 36 }}>
                  18 simulateurs gratuits — impôts, FIRE, patrimoine.<br />
                  Sans carte bancaire, sans engagement.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {/* Primary — dark Finorio button */}
                  <Link href="/login"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 22px', borderRadius: 10,
                      fontSize: 14, fontWeight: 500,
                      color: '#ffffff', textDecoration: 'none',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25',
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 1px 2px 0 rgba(21,14,27,0.24), 0 0 0 1px #000',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 100%), #2d2f3a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%), #181B25' }}>
                    Créer un compte gratuit <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                  {/* Secondary — ghost */}
                  <Link href="/login"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 22px', borderRadius: 10,
                      fontSize: 14, fontWeight: 500,
                      color: '#181B25', textDecoration: 'none',
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.12)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}>
                    Se connecter
                  </Link>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '0 20px 40px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 40 }}>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <PatrimoLogo width={110} uid="footer" />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
                Outils de finance personnelle pour investisseurs français.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Produit</h4>
              {[['#demo', 'Démo interactive'], ['#modules', 'Calculateurs'], ['#how', 'Comment ça marche'], ['#comparatif', 'Comparatif'], ['#roadmap', 'Roadmap'], ['#why', 'Nos engagements'], ['#security', 'Protection'], ['#faq', 'FAQ'], ['/login', 'Créer un compte']].map(([href, label]) => (
                <a key={href} href={href} style={{ display: 'block', fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                  {label}
                </a>
              ))}
            </div>

            {/* Légal */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Légal</h4>
              {[['/mentions-legales', 'Mentions légales'], ['/politique-confidentialite', 'Politique de confidentialité'], ['/cgu', 'CGU']].map(([href, label]) => (
                <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                  {label}
                </a>
              ))}
            </div>

            {/* À propos */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>À propos</h4>
              {[['/about', 'À propos de PatrImo'], ['mailto:contact@digitalstack.cloud', 'Contact']].map(([href, label]) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ display: 'block', fontSize: 13, color: '#6b7280', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#374151')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af' }}>© 2026 PatrImo · Tous droits réservés</p>
            <p style={{ fontSize: 11, color: '#d1d5db', maxWidth: 420, textAlign: 'right', lineHeight: 1.6 }}>
              Calculs fournis à titre indicatif uniquement. Consultez un conseiller financier agréé pour vos décisions d'investissement.
            </p>
          </div>
        </div>
      </footer>

      {/* ── STICKY MOBILE CTA ─────────────────────────────────────────── */}
      <StickyMobileCTA />

    </div>
  )
}
