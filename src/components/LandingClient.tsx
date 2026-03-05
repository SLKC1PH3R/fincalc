'use client'
import Link from 'next/link'
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
  Menu,
  Star,
  Clock,
  Layers,
  Globe,
  Euro,
  Percent,
  Bitcoin
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────
const GOLD = '#f97316'
const GOLD_DARK = 'rgba(249,115,22,0.12)'
const GOLD_BORDER = 'rgba(249,115,22,0.30)'
const GOLD_GLOW = 'rgba(249,115,22,0.06)'

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
  { icon: Star, label: 'Score Patrimonial', desc: 'Obtenez votre score global et des recommandations concrètes sur 6 piliers patrimoniaux.', tag: 'Patrimoine', color: '#f97316' },
]

const SECURITY = [
  { icon: Lock, title: 'Vos données sont chiffrées', desc: 'Toutes les transmissions sont sécurisées via HTTPS/TLS.' },
  { icon: EyeOff, title: 'Aucune donnée bancaire requise', desc: 'Aucun RIB, aucun accès à vos comptes. Zéro risque.' },
  { icon: Shield, title: 'Connexion sécurisée via Google', desc: 'OAuth 2.0 — vos identifiants ne transitent jamais par FinCalc.' },
  { icon: BarChart3, title: 'Vos simulations restent privées', desc: 'Stockées sur votre compte uniquement. Jamais partagées ni revendues.' },
]

const WHY = [
  { icon: Zap, title: 'Rapidité', desc: 'Résultats instantanés à chaque frappe. Pas d\'attente, pas de rechargement.' },
  { icon: Layers, title: 'Simulations avancées', desc: 'Modèles financiers précis avec inflation, charges fiscales et scénarios multiples.' },
  { icon: Star, title: 'Interface claire', desc: 'Conçu pour être compris immédiatement, sans formation ni tutoriel.' },
  { icon: X, title: 'Pas de pub', desc: 'Aucune publicité, aucun tracking, aucune revente de données. Point.' },
  { icon: Check, title: '100 % gratuit', desc: 'Toutes les fonctionnalités incluses, pour toujours. Sans abonnement.' },
]

const HOW = [
  { step: '01', title: 'Créez un compte', desc: 'En 30 secondes avec votre email ou votre compte Google. Aucune carte bancaire.' },
  { step: '02', title: 'Lancez une simulation', desc: 'Choisissez parmi 13 calculateurs et renseignez vos paramètres en quelques clics.' },
  { step: '03', title: 'Visualisez votre avenir', desc: 'Graphiques interactifs, synthèses détaillées et recommandations personnalisées.' },
]

const ROADMAP = [
  // ── Disponible ──────────────────────────────────────────────────────────
  { status: 'done', label: 'Connexion Google OAuth', desc: 'Authentification sécurisée via Google' },
  { status: 'done', label: '13 calculateurs financiers', desc: 'Épargne, Immobilier, Fiscal, Budget' },
  { status: 'done', label: 'Historique des simulations', desc: 'Sauvegarde et restauration des scénarios' },
  { status: 'done', label: 'Mode sombre / clair', desc: 'Personnalisation de l\'interface' },
  // ── En cours ────────────────────────────────────────────────────────────
  { status: 'wip', label: 'Export PDF avec branding', desc: 'Téléchargez vos simulations en PDF premium' },
  { status: 'wip', label: 'PEA', desc: 'Enveloppe fiscale, plafond 150 000 €, exonération IR après 5 ans, comparaison CTO vs PEA sur la durée' },
  { status: 'wip', label: 'Livrets réglementés', desc: 'Livret A, LDDS, LEP — taux actuels, plafonds, comparaison et manque à gagner vs investissement' },
  { status: 'wip', label: 'Impact des frais', desc: 'ETF à 0,2 % vs fonds actif à 2 % sur 20 ans — la différence spectaculaire en chiffres' },
  { status: 'wip', label: 'Inflation & pouvoir d\'achat', desc: 'Valeur réelle de votre capital dans le temps, rendement minimum pour ne pas perdre en réel' },
  { status: 'wip', label: 'Remboursement de dettes', desc: 'Avalanche vs boule de neige — comparaison du coût total selon la stratégie' },
  { status: 'wip', label: 'Plus-value immobilière', desc: 'Abattements par durée de détention (22 ans IR, 30 ans PS), calcul avant vente' },
  { status: 'wip', label: 'SCPI', desc: 'Rendement brut/net, fiscalité foncière, comparaison achat direct, liquidité' },
  { status: 'wip', label: 'Déficit foncier', desc: 'Calcul de l\'économie d\'impôt pour les propriétaires réalisant des travaux' },
  { status: 'wip', label: 'Viager', desc: 'Bouquet et rente selon l\'espérance de vie — intérêt pour acheteur et vendeur' },
  { status: 'wip', label: 'Flat Tax vs Barème IR', desc: 'Dividendes, plus-values, intérêts — selon votre TMI, l\'un ou l\'autre est plus avantageux' },
  { status: 'wip', label: 'Auto-entrepreneur / Freelance', desc: 'CA → revenu net après charges sociales, CFE et IR' },
  { status: 'wip', label: 'IFI', desc: 'Impôt sur la Fortune Immobilière — seuil 1,3 M€, calcul de la base taxable' },
  { status: 'wip', label: 'Succession & Donation', desc: 'Abattements par lien de parenté (100 k€ parent/enfant), DMTG, optimisation tous les 15 ans' },
  { status: 'wip', label: 'Stock-options / BSPCE / AGA', desc: 'Fiscalité des plans d\'actionnariat salarié, de plus en plus répandu en startup' },
  { status: 'wip', label: 'Épargne d\'urgence', desc: 'Combien garder en liquidités selon ses charges fixes, stabilité de l\'emploi et situation familiale' },
  { status: 'wip', label: 'Coût réel d\'un crédit conso', desc: 'TAEG, coût total, et ce que le même argent placé aurait rapporté' },
  // ── À venir ─────────────────────────────────────────────────────────────
  { status: 'planned', label: 'Comparateur de scénarios', desc: '2 ou 3 simulations côte à côte sur un même graphique — la killer feature qui manque à tous les outils gratuits' },
  { status: 'planned', label: 'Calculatrice rapide (sidebar)', desc: 'Mini-calc toujours accessible sans quitter la page en cours' },
  { status: 'planned', label: 'Mode "reverse"', desc: '"J\'ai besoin de Y€ à la retraite, combien dois-je épargner par mois ?" — logique inversée très intuitive' },
  { status: 'planned', label: 'Tableau patrimonial', desc: 'Synthèse de tous vos actifs (immobilier, PEA, AV, livrets, crypto…) avec répartition globale' },
  { status: 'planned', label: 'Alertes paramétrables', desc: '"Notifie-moi si le Livret A change", rappels d\'objectifs, emails automatiques' },
  { status: 'planned', label: 'Rapport mensuel par email', desc: 'Résumé de vos simulations et évolution de vos objectifs chaque mois' },
  { status: 'planned', label: 'Mode présentation', desc: 'Vue épurée pour montrer une simulation à son conseiller CGP ou banquier' },
  { status: 'planned', label: 'Glossaire financier contextuel', desc: 'Tooltip sur TMI, TAEG, rendement brut… directement dans les calculateurs' },
  { status: 'planned', label: 'Articles & guides', desc: '"Comprendre le FI/RE", "PEA vs CTO : lequel choisir ?" — contenu pédagogique et SEO' },
  { status: 'planned', label: 'Application mobile native', desc: 'iOS & Android — accès où que vous soyez' },
  { status: 'planned', label: 'Intégrations bancaires', desc: 'Import automatique de vos données via Open Banking' },
]

const ROADMAP_PHASES = [
  { id: 'done' as const, label: 'Disponible', period: 'Q1 2026', color: '#34d399', items: ROADMAP.filter(r => r.status === 'done') },
  { id: 'wip' as const, label: 'En cours', period: 'Q2 2026', color: GOLD, items: ROADMAP.filter(r => r.status === 'wip') },
  { id: 'planned' as const, label: 'À venir', period: 'Q4 2026 – 2027', color: 'rgba(255,255,255,0.28)', items: ROADMAP.filter(r => r.status === 'planned') },
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
  { Icon: Bitcoin, x: 60, y: 88, size: 20, delay: 2.5, dur: 5, opacity: 0.1, color: '#f97316' },
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

// ─── Module Card ─────────────────────────────────────────────────────────
function ModuleCard({ mod, index }: { mod: typeof MODULES[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href="/login" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#111' : '#0c0c0c',
          border: `1px solid ${hovered ? mod.color + '50' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 16,
          padding: '22px',
          transition: 'all 0.2s',
          transform: hovered ? 'translateY(-3px)' : '',
          position: 'relative',
          overflow: 'hidden',
          animationDelay: `${index * 60}ms`,
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 0% 0%, ${mod.color}12, transparent 55%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: mod.color + '18',
              border: `1px solid ${mod.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <mod.icon style={{ width: 18, height: 18, color: mod.color }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{mod.tag}</span>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>{mod.label}</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', lineHeight: 1.65, marginBottom: 16 }}>{mod.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: hovered ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}>
            <span>Ouvrir</span>
            <ArrowRight style={{ width: 11, height: 11 }} />
          </div>
        </div>
      </div>
    </Link>
  )
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
            <text x={rx + sw / 2} y={y + barH + 11} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="9">{s.sub}</text>
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw}
        strokeDasharray={`${arcLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={`${filledLen.toFixed(1)} ${perim.toFixed(1)}`} transform={`rotate(${rot.toFixed(1)} ${cx} ${cy})`} />
      <text x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle" fill={GOLD} fontSize="17" fontWeight="800">{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="8">/ 100</text>
      {pillars.map((h, i) => (
        <rect key={i} x={W * 0.62 + i * 17} y={H - 6 - h * (H - 18)} width={11} height={h * (H - 18)} rx={3} fill={pillarColors[i]} opacity={0.6} />
      ))}
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
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: `1px solid ${hovered ? mod.color + '45' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 20, overflow: 'hidden',
          transition: 'all 0.25s',
          transform: hovered ? 'translateY(-4px)' : '',
          boxShadow: hovered ? `0 24px 60px ${mod.color}28` : 'none',
          height: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 0', background: `linear-gradient(160deg, ${mod.color}0e, transparent 55%)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: mod.color + '1e', border: `1px solid ${mod.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <mod.icon style={{ width: 15, height: 15, color: mod.color }} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: mod.color + 'aa' }}>{mod.tag}</span>
          </div>
          {preview}
        </div>
        <div style={{ padding: '12px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{mod.label}</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.33)', lineHeight: 1.65, marginBottom: 14, flex: 1 }}>{mod.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: hovered ? mod.color : 'rgba(255,255,255,0.22)', transition: 'color 0.2s' }}>
            <span>Ouvrir</span><ArrowRight style={{ width: 11, height: 11 }} />
          </div>
        </div>
      </div>
    </Link>
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

// ─── Dashboard Preview (mini) ─────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ position: 'absolute', inset: -16, background: 'linear-gradient(to top, rgba(249,115,22,0.06), transparent)', borderRadius: 32, filter: 'blur(20px)' }} />
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        {/* Browser bar */}
        <div style={{ background: '#030303', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.1)'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, margin: '0 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontFamily: 'monospace' }}>
            fire.digitalstack.cloud/dashboard
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: 'flex', height: 400, background: '#080808' }}>
          {/* Sidebar */}
          <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', background: '#060606', display: 'flex', flexDirection: 'column', padding: '14px 8px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 14px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 13, height: 13, color: '#0a0a0a' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>FinCalc</span>
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
                <p key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 2px', fontWeight: 600 }}>{item.label}</p>
              ) : (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 8px', borderRadius: 7, fontSize: 11, color: item.active ? '#fff' : 'rgba(255,255,255,0.3)', background: item.active ? 'rgba(255,255,255,0.07)' : 'transparent', marginBottom: 1 }}>
                  <span>{item.label}</span>
                  {item.active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f97316' }} />}
                </div>
              )
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Bonsoir, jeremy</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Tableau de bord</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              {[{ l: 'Simulations', v: '12' }, { l: 'Cette semaine', v: '3' }, { l: 'Module favori', v: 'FI/RE' }].map(s => (
                <div key={s.l} style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.l}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {/* Bar chart */}
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Activité</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 44 }}>
                  {[20,35,15,52,28,62,40,55,32,70,45,85].map((h, i) => (
                    <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: i === 11 ? '#f97316' : 'rgba(249,115,22,0.2)' }} />
                  ))}
                </div>
              </div>
              {/* Donut */}
              <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Répartition</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'conic-gradient(#34d399 0 30%, #38bdf8 30% 55%, #fb923c 55% 70%, #a78bfa 70% 100%)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#0f0f0f' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[['#34d399','Composés'],['#38bdf8','DCA'],['#fb923c','FI/RE']].map(([c,l]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{l}</span>
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
                <div key={m.name} style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 0% 0%, ${m.color}12, transparent 55%)` }} />
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2, position: 'relative' }}>{m.tag}</p>
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
  immo15y: RateItem; immo20y: RateItem; immo25y: RateItem; creditConso: RateItem
  live?: { oat: boolean; bce: boolean }
}

function RateBigCard({ label, value, sublabel, color, cta, trend }: {
  label: string; value: number; sublabel: string; color: string
  cta?: { text: string; href: string }; trend?: 'up' | 'down' | 'stable'
}) {
  const [hov, setHov] = useState(false)
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  const trendColor = trend === 'up' ? '#f87171' : trend === 'down' ? '#34d399' : 'rgba(255,255,255,0.22)'
  const trendLabel = trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 'min(100%, 200px)',
        background: hov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${hov ? color + '45' : 'rgba(255,255,255,0.07)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 18, padding: '22px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 5,
        transition: 'all 0.2s',
        boxShadow: hov ? `0 16px 48px ${color}28` : 'none',
      }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.03em', lineHeight: 1.4 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '4px 0 2px' }}>
        <span style={{ fontSize: 'clamp(34px,4vw,50px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value.toFixed(2).replace('.', ',')}
        </span>
        <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>%</span>
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>{sublabel}</span>
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

function RateRow({ name, rate, sublabel, note, trend, color, bold = false }: {
  name: string; rate: string; sublabel?: string; note?: string; trend?: 'up'|'down'|'stable'; color: string; bold?: boolean
}) {
  const trendEl = trend === 'up'
    ? <TrendingUp style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
    : trend === 'down'
    ? <TrendingUp style={{ width: 14, height: 14, color: '#34d399', transform: 'rotate(180deg)', flexShrink: 0 }} />
    : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{name}</span>
          {note && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>({note})</span>}
        </div>
        {sublabel && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sublabel}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: bold ? 22 : 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{rate}</span>
        {trendEl}
      </div>
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
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '24px',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 20, height: 20, color: iconColor }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</h3>
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
            <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px' }}>
              Les taux qui pilotent vos{' '}
              <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>décisions financières</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.32)' }}>
              Données indicatives · mise à jour automatique chaque heure
              {rates?.live?.oat || rates?.live?.bce
                ? <span style={{ marginLeft: 10, color: '#34d399', fontSize: 12 }}>● Temps réel</span>
                : null}
            </p>
          </div>
        </RevealSection>

        {!rates ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 13 }}>Chargement des taux…</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Panel 1 — Épargne réglementée */}
            <RevealSection delay={0} style={{ flex: '1 1 280px' }}>
              <RatePanel title="Épargne réglementée" icon={PiggyBank} iconColor="#34d399" iconBg="rgba(52,211,153,0.1)">
                <RateRow name="Livret A" rate={fmt(rates.livretA.value)} sublabel="Plafond 22 950 €" trend={rates.livretA.trend} color="#34d399" bold />
                <RateRow name="LDDS" rate={fmt(rates.ldds.value)} sublabel="Plafond 12 000 €" trend={rates.ldds.trend} color="#34d399" bold />
                <RateRow name="LEP" rate={fmt(rates.lep.value)} sublabel="Plafond 10 000 €" note="sous conditions" trend={rates.lep.trend} color="#34d399" bold />
              </RatePanel>
            </RevealSection>

            {/* Panel 2 — Crédit immobilier */}
            <RevealSection delay={80} style={{ flex: '1 1 280px' }}>
              <RatePanel
                title="Crédit immobilier"
                icon={Home} iconColor={GOLD} iconBg={GOLD_DARK}
                footer={
                  <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.18)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = GOLD_DARK }}>
                    Simuler mon prêt <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                }>
                <RateRow name="Meilleur taux" sublabel="sur 15 ans" rate={fmt(rates.immo15y.value)} trend={rates.immo15y.trend} color={GOLD} bold />
                <RateRow name="Meilleur taux" sublabel="sur 20 ans" rate={fmt(rates.immo20y.value)} trend={rates.immo20y.trend} color={GOLD} bold />
                <RateRow name="Meilleur taux" sublabel="sur 25 ans" rate={fmt(rates.immo25y.value)} trend={rates.immo25y.trend} color={GOLD} bold />
              </RatePanel>
            </RevealSection>

            {/* Panel 3 — Marchés & Macro */}
            <RevealSection delay={160} style={{ flex: '1 1 280px' }}>
              <RatePanel title="Marchés & Macro" icon={TrendingUp} iconColor="#fbbf24" iconBg="rgba(251,191,36,0.1)">
                <RateRow name="OAT 10 ans" sublabel={rates.live?.oat ? "Obligation d'État · Live" : "Obligation d'État"} rate={fmt(rates.oat10y.value)} trend={rates.oat10y.trend} color="#38bdf8" />
                <RateRow name="Taux BCE" sublabel={rates.live?.bce ? 'BCE · Live' : 'Banque Centrale Européenne'} rate={fmt(rates.bce.value)} trend={rates.bce.trend} color="#a78bfa" />
                <RateRow name="Inflation FR" sublabel="Indice des prix" rate={fmt(rates.inflation.value)} trend={rates.inflation.trend} color="#fb923c" />
                <RateRow name="Crédit conso" sublabel="Taux moyen" rate={fmt(rates.creditConso.value)} trend={rates.creditConso.trend} color="#f87171" />
              </RatePanel>
            </RevealSection>
          </div>
        )}

      </div>
    </section>
  )
}

// ─── Interactive Compound Interest Demo ───────────────────────────────────
function InteractiveDemo() {
  const [capital, setCapital] = useState(10000)
  const [monthly, setMonthly] = useState(300)
  const [rate, setRate] = useState(7)
  const [years, setYears] = useState(20)
  const [hoverPct, setHoverPct] = useState<number | null>(null)

  // Compute yearly data points (fast enough to do inline)
  const data: { invested: number; value: number }[] = []
  let value = capital
  let invested = capital
  for (let y = 0; y <= years; y++) {
    data.push({ invested: Math.round(invested), value: Math.round(value) })
    for (let m = 0; m < 12; m++) {
      value = (value + monthly) * (1 + rate / 100 / 12)
      invested += monthly
    }
  }

  const finalValue = data[data.length - 1].value
  const totalInvested = data[data.length - 1].invested
  const gains = finalValue - totalInvested
  const rendement = Math.round((gains / totalInvested) * 100)

  const fmtK = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)} M€`
      : n >= 1000 ? `${Math.round(n / 1000)} k€`
        : `${n} €`
  const fmtFull = (n: number) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'

  // SVG inline chart
  const W = 500; const H = 110
  const maxV = finalValue
  const toX = (i: number) => (i / (data.length - 1)) * W
  const toY = (v: number) => H - (v / maxV) * H * 0.88 - 4
  const pathValue = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`).join(' ')
  const pathInvested = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.invested).toFixed(1)}`).join(' ')
  const areaValue = pathValue + ` L${W},${H} L0,${H} Z`
  const areaInvested = pathInvested + ` L${W},${H} L0,${H} Z`

  return (
    <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Valeur finale estimée</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: GOLD, lineHeight: 1, letterSpacing: '-0.03em' }}>{fmtFull(finalValue)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>après {years} ans · <span style={{ color: '#34d399' }}>+{fmtFull(gains)}</span> d&apos;intérêts</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#34d399', lineHeight: 1 }}>{rendement}%</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>Rendement net</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{fmtFull(totalInvested)}</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>Capital investi</p>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      {(() => {
        const hovIdx = hoverPct !== null ? Math.round(hoverPct * (data.length - 1)) : null
        const hd = hovIdx !== null ? data[hovIdx] : null
        return (
          <div style={{ borderRadius: 10, overflow: 'visible', marginBottom: 14, position: 'relative', cursor: 'crosshair' }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              setHoverPct(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
            }}
            onMouseLeave={() => setHoverPct(null)}
          >
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', height: 110, borderRadius: 10, overflow: 'hidden' }}>
              <defs>
                <linearGradient id="demo-grad-v" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={GOLD} stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="demo-grad-i" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              <path d={areaValue} fill="url(#demo-grad-v)" />
              <path d={areaInvested} fill="url(#demo-grad-i)" />
              <path d={pathValue} fill="none" stroke={GOLD} strokeWidth="2" strokeLinejoin="round" />
              <path d={pathInvested} fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="5,3" strokeLinejoin="round" />
              {hovIdx !== null && hd && (
                <>
                  <line x1={toX(hovIdx)} y1={0} x2={toX(hovIdx)} y2={H} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx={toX(hovIdx)} cy={toY(hd.value)} r={3.5} fill={GOLD} stroke="#0c0c0c" strokeWidth="1.5" />
                  <circle cx={toX(hovIdx)} cy={toY(hd.invested)} r={3.5} fill="#34d399" stroke="#0c0c0c" strokeWidth="1.5" />
                </>
              )}
            </svg>
            {/* HTML Tooltip overlay */}
            {hovIdx !== null && hd && hoverPct !== null && (
              <div style={{
                position: 'absolute',
                top: 6,
                left: hoverPct > 0.6 ? 'auto' : `calc(${(hoverPct * 100).toFixed(1)}% + 10px)`,
                right: hoverPct > 0.6 ? `calc(${((1 - hoverPct) * 100).toFixed(1)}% + 10px)` : 'auto',
                background: 'rgba(8,8,8,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '8px 12px',
                pointerEvents: 'none', zIndex: 10, minWidth: 190,
              }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Année {hovIdx}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Valeur</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{fmtFull(hd.value)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Investi</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>{fmtFull(hd.invested)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Gains</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>+{fmtFull(hd.value - hd.invested)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 16, height: 2, background: GOLD, borderRadius: 1 }} />
          Valeur finale
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,2" /></svg>
          Capital investi
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px 24px' }}>
        {(
          [
            { label: 'Capital initial', value: capital, min: 1000, max: 100000, step: 500, display: `${capital.toLocaleString('fr-FR')} €`, set: setCapital },
            { label: 'Versement mensuel', value: monthly, min: 0, max: 2000, step: 50, display: `${monthly} €/mois`, set: setMonthly },
            { label: 'Rendement annuel', value: rate, min: 1, max: 15, step: 0.5, display: `${rate} %/an`, set: setRate },
            { label: 'Durée', value: years, min: 5, max: 40, step: 1, display: `${years} ans`, set: setYears },
          ] as { label: string; value: number; min: number; max: number; step: number; display: string; set: (v: number) => void }[]
        ).map(({ label, value, min, max, step, display, set }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.33)' }}>{label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: GOLD }}>{display}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(Number(e.target.value))}
              style={{ width: '100%', accentColor: GOLD, cursor: 'pointer', height: 3 }}
            />
          </div>
        ))}
      </div>

      <p style={{ marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.16)', textAlign: 'center' }}>
        Simulation indicative · rendement constant hypothétique · sans frais ni fiscalité
      </p>
    </div>
  )
}

// ─── Competitor Comparison Table ──────────────────────────────────────────
type FeatureVal = true | false | null
const COMPETITOR_FEATURES: { label: string; fincalc: FeatureVal; finary: FeatureVal; bank: FeatureVal }[] = [
  { label: '100 % gratuit',                  fincalc: true,  finary: null,  bank: false },
  { label: 'Intérêts composés',              fincalc: true,  finary: null,  bank: false },
  { label: 'Simulateur FI/RE',               fincalc: true,  finary: false, bank: false },
  { label: 'Simulateur retraite',            fincalc: true,  finary: null,  bank: false },
  { label: 'Calcul impôts IR / TMI',         fincalc: true,  finary: false, bank: false },
  { label: 'DCA / Investissement régulier',  fincalc: true,  finary: null,  bank: false },
  { label: 'Acheter vs Louer',               fincalc: true,  finary: false, bank: false },
  { label: 'Fiscalité française 2026',       fincalc: true,  finary: null,  bank: false },
  { label: 'Sans données bancaires',         fincalc: true,  finary: false, bank: false },
  { label: 'Zéro publicité',                 fincalc: true,  finary: null,  bank: false },
]

function CompetitorTable() {
  const cols = [
    { name: 'FinCalc', key: 'fincalc' as const, highlight: true, color: GOLD },
    { name: 'Finary', key: 'finary' as const, highlight: false, color: 'rgba(255,255,255,0.45)' },
    { name: 'Votre banque', key: 'bank' as const, highlight: false, color: 'rgba(255,255,255,0.32)' },
  ]
  return (
    <section id="comparatif" style={{ padding: '80px 20px 60px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionTag><BarChart3 style={{ width: 11, height: 11 }} /> Comparatif</SectionTag>
            <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px' }}>
              FinCalc vs les{' '}
              <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>alternatives</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', marginTop: 12, lineHeight: 1.7 }}>
              Des simulateurs conçus pour les investisseurs français, pas pour les banques.
            </p>
          </div>
        </RevealSection>

        <RevealSection delay={100}>
          <div style={{ border: `1px solid ${GOLD_BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 130px', background: '#0c0c0c', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ padding: '14px 20px' }} />
              {cols.map(col => (
                <div key={col.name} style={{
                  padding: '14px 8px',
                  textAlign: 'center',
                  background: col.highlight ? GOLD_GLOW : 'transparent',
                  borderLeft: '1px solid rgba(255,255,255,0.05)',
                  borderTop: col.highlight ? `2px solid ${GOLD}60` : '2px solid transparent',
                }}>
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
                  borderBottom: i < COMPETITOR_FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                }}>
                  <div style={{ padding: '12px 20px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f.label}</div>
                  {cols.map(col => {
                    const val = f[col.key]
                    return (
                      <div key={col.key} style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        background: col.highlight ? GOLD_GLOW : 'transparent',
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {val === true && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check style={{ width: 12, height: 12, color: '#34d399' }} /></div>}
                        {val === false && <X style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.18)' }} />}
                        {val === null && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.04)', borderRadius: 100, padding: '2px 8px' }}>partiel</span>}
                      </div>
                    )
                  })}
                </div>
              </RevealSection>
            ))}

            {/* Footer note */}
            <div style={{ padding: '12px 20px', background: '#080808', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                Comparaison basée sur les offres publiques au 1er trimestre 2026. Finary = offre gratuite limitée. &quot;Votre banque&quot; = conseiller bancaire traditionnel.
              </p>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  )
}

// ─── Main Landing ─────────────────────────────────────────────────────────
export function LandingClient() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    setTimeout(() => setHeroVisible(true), 100)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="grid-bg" style={{ background: '#050505', color: '#fff', minHeight: '100vh', fontFamily: "'Inter', 'Geist', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        background: scrolled ? 'rgba(6,6,6,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 15, height: 15, color: '#0a0a0a' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>FinCalc</span>
          </Link>

          {/* Desktop links */}
          <div style={{ alignItems: 'center', gap: 24 }} className="hidden md:flex">
            {[['#modules', 'Modules'], ['#rates', 'Taux en Direct'], ['#how', 'Comment ça marche'], ['#why', 'Nos engagements'], ['#security', 'Sécurité'], ['#roadmap', 'Roadmap']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; const u = e.currentTarget.querySelector<HTMLElement>('.nav-underline'); if (u) u.style.width = '100%' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; const u = e.currentTarget.querySelector<HTMLElement>('.nav-underline'); if (u) u.style.width = '0' }}>
                {label}
                <span className="nav-underline" style={{ position: 'absolute', bottom: -2, left: 0, width: 0, height: 1, background: GOLD, transition: 'width 0.25s ease', display: 'block' }} />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div style={{ alignItems: 'center', gap: 10 }} className="hidden md:flex">
            <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', padding: '8px 16px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
              Se connecter
            </Link>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#000', textDecoration: 'none', padding: '8px 18px', borderRadius: 9, background: GOLD, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${GOLD}50` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              Commencer
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
          >
            <div style={{ width: 22, height: 13, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{
                display: 'block', height: 1.5, background: 'rgba(255,255,255,0.75)', borderRadius: 2,
                transformOrigin: 'center',
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: menuOpen ? 'translateY(5.75px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', height: 1.5, background: 'rgba(255,255,255,0.75)', borderRadius: 2,
                transformOrigin: 'center',
                transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                transform: menuOpen ? 'translateY(-5.75px) rotate(-45deg)' : 'none',
              }} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div style={{
          overflow: 'hidden',
          maxHeight: menuOpen ? 320 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
          background: '#0a0a0a',
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        }}>
          <div style={{ padding: '16px 20px 20px' }}>
            {[
              ['#modules', 'Modules'],
              ['#rates', 'Taux en Direct'],
              ['#how', 'Comment ça marche'],
              ['#why', 'Nos engagements'],
              ['#security', 'Sécurité'],
              ['#roadmap', 'Roadmap'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', padding: '13px 0', fontSize: 15, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >
                {label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                Se connecter
              </Link>
              <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '11px 0', borderRadius: 9, background: GOLD, color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 60, paddingLeft: 20, paddingRight: 20, overflow: 'hidden' }}>

        {/* Animated orbs */}
        <div className="animate-orb-drift" style={{ position: 'absolute', width: 700, height: 700, top: -250, left: -250, background: `radial-gradient(circle, ${GOLD}0d 0%, transparent 65%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, top: -100, right: -180, background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orb-drift 15s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, bottom: -50, left: '40%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orb-drift 18s ease-in-out infinite 2s' }} />

        {/* Floating icons */}
        {FLOAT_ICONS.map((f, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${f.x}%`,
            top: `${f.y}%`,
            opacity: f.opacity,
            pointerEvents: 'none',
            animation: `float-slow ${f.dur}s ease-in-out infinite ${f.delay}s`,
            width: f.size + 18,
            height: f.size + 18,
            borderRadius: '50%',
            background: f.color + '18',
            border: `1px solid ${f.color}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}>
            <f.Icon style={{ width: Math.round(f.size * 0.52), height: Math.round(f.size * 0.52), color: f.color }} />
          </div>
        ))}

        {/* Grain */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '200px' }} />

        {/* Content */}
        <div style={{
          position: 'relative', maxWidth: 760, textAlign: 'center',
          opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(20px)',
          transition: 'all 0.8s ease',
        }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'glow-pulse 2s infinite' }} />
            13 calculateurs · Fiscalité française 2026
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(2.8rem,6.5vw,4.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.035em', color: '#fff', marginBottom: 24 }}>
            Prenez le contrôle de votre{' '}
            <span style={{
              fontWeight: 700,
              background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
              avenir financier
            </span>
            , dès maintenant
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.62)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 36px' }}>
            Simulez vos investissements, optimisez votre fiscalité et planifiez votre retraite avec des outils conçus pour le marché français.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: GOLD, color: '#000', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${GOLD}50` }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
              Créer un compte gratuit <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <a href="#modules" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 500, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' }}>
              Voir les modules
            </a>
          </div>

          {/* Demo hint */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 20,
              background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)',
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.13)'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251,146,60,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.2)' }}
            >
              <span style={{ fontSize: 13 }}>⚡</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#fb923c' }}>Essayer sans s&apos;inscrire</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>— compte démo disponible sur la page de connexion</span>
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[{ v: '13', l: 'Calculateurs' }, { v: '100%', l: 'Gratuit' }, { v: '0', l: 'Publicités' }, { v: 'FR', l: 'Fiscalité 2026' }].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <span style={{
                  display: 'block', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em',
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>{s.v}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div style={{ width: '100%', marginTop: 64, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(30px)', transition: 'all 1s ease 0.3s' }}>
          <DashboardPreview />
        </div>
      </section>

      {/* ── RATES WIDGET ──────────────────────────────────────────────── */}
      <RatesWidget />

      {/* ── INTERACTIVE DEMO ──────────────────────────────────────────── */}
      <section id="demo" style={{ padding: '60px 20px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <SectionTag><TrendingUp style={{ width: 11, height: 11 }} /> Essayez maintenant</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 8px' }}>
                Voyez votre épargne{' '}
                <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>fructifier</span>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', marginTop: 10, lineHeight: 1.7 }}>
                Manipulez les curseurs — aucun compte requis.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <InteractiveDemo />
          </RevealSection>
        </div>
      </section>

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <section id="modules" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>

          {/* Header */}
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionTag><BarChart3 style={{ width: 11, height: 11 }} /> 13 calculateurs</SectionTag>
              <h2 style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px' }}>
                Tous les outils pour{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>maîtriser vos finances</span>
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', margin: '0', lineHeight: 1.7, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
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
          </div>

          {/* CTA strip — after all 9 cards */}
          <RevealSection delay={100}>
            <div style={{ textAlign: 'center', padding: '52px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>13 simulateurs · 100 % gratuit · sans carte bancaire</p>
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 100, background: GOLD, color: '#000', fontWeight: 700, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${GOLD}55` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                Commencer gratuitement <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </RevealSection>

        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how" style={{ padding: '100px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionTag><Clock style={{ width: 11, height: 11 }} /> En 3 étapes</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#fff', margin: '0' }}>
                Comment ça marche ?
              </h2>
            </div>
          </RevealSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'stretch' }}>
            {HOW.map((step, i) => (
              <RevealSection key={i} delay={i * 120} style={{ height: '100%' }}>
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ position: 'absolute', top: -10, right: 16, fontSize: 80, fontStyle: 'italic', color: 'rgba(255,255,255,0.025)', fontWeight: 400, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
                    {step.step}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, marginBottom: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{step.step}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>{step.desc}</p>
                  {i < HOW.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                      <ArrowRight style={{ width: 16, height: 16, color: `${GOLD}60` }} />
                    </div>
                  )}
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY FINCALC ───────────────────────────────────────────────── */}
      <section id="why" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07) 50%,transparent)', marginBottom: 80 }} />

          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionTag><Star style={{ width: 11, height: 11 }} /> Pourquoi FinCalc</SectionTag>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px' }}>
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
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', transition: 'border-color 0.2s', height: '100%', boxSizing: 'border-box' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD_BORDER)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <w.icon style={{ width: 18, height: 18, color: GOLD }} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{w.title}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>{w.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ──────────────────────────────────────────────────── */}
      <section id="security" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.04) 0%, rgba(52,211,153,0.03) 100%)', border: `1px solid ${GOLD_BORDER}`, borderRadius: 28, padding: 'clamp(32px,5vw,64px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${GOLD}08, transparent 55%)`, pointerEvents: 'none' }} />

            <RevealSection>
              <div style={{ marginBottom: 44, position: 'relative' }}>
                <SectionTag><Shield style={{ width: 11, height: 11 }} /> Protection</SectionTag>
                <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 8px' }}>
                  Sécurité &{' '}
                  <span style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>confidentialité</span>
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginTop: 12, maxWidth: 500 }}>
                  Vos données personnelles et financières sont traitées avec le plus haut niveau de sécurité.
                </p>
              </div>
            </RevealSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, position: 'relative' }}>
              {SECURITY.map((s, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <s.icon style={{ width: 14, height: 14, color: GOLD }} />
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{s.title}</h3>
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROADMAP ───────────────────────────────────────────────────── */}
      <section id="roadmap" style={{ padding: '80px 20px 100px', background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.03), transparent)' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <SectionTag><Clock style={{ width: 11, height: 11 }} /> Évolution continue</SectionTag>
              <h2 style={{ fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 12px' }}>
                Ce qui arrive sur{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>FinCalc</span>
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.32)', maxWidth: 500, margin: '0 auto' }}>
                FinCalc évolue en continu. Voici les fonctionnalités déjà disponibles et ce qui arrive.
              </p>
            </div>
          </RevealSection>

          {/* Phase grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {ROADMAP_PHASES.map((phase, pi) => {
              const barColor = phase.id === 'done' ? '#34d399' : phase.id === 'wip' ? GOLD : 'rgba(255,255,255,0.15)'
              const badgeBg = phase.id === 'done' ? 'rgba(52,211,153,0.15)' : phase.id === 'wip' ? GOLD_DARK : 'rgba(255,255,255,0.06)'
              const badgeColor = phase.id === 'done' ? '#34d399' : phase.id === 'wip' ? GOLD : 'rgba(255,255,255,0.35)'
              return (
                <RevealSection key={phase.id} delay={pi * 80}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {/* Status color bar */}
                    <div style={{ height: 3, background: barColor, borderRadius: '0 0 2px 2px', marginBottom: 0 }} />
                    <div style={{ padding: '20px 20px 24px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{phase.period}</span>
                        <div style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, border: `1px solid ${barColor}40`, padding: '3px 10px', borderRadius: 100, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {phase.label}
                        </div>
                      </div>
                      {/* Items list */}
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                        {phase.items.slice(0, phase.id === 'planned' ? 6 : undefined).map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <Check style={{
                              width: 14, height: 14, flexShrink: 0, marginTop: 2,
                              color: phase.id === 'done' ? '#34d399' : phase.id === 'wip' ? GOLD : 'rgba(255,255,255,0.2)',
                            }} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: phase.id === 'planned' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.82)', lineHeight: 1.3 }}>{item.label}</p>
                              {item.desc && phase.id !== 'planned' && (
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2, lineHeight: 1.45 }}>{item.desc}</p>
                              )}
                            </div>
                          </li>
                        ))}
                        {phase.id === 'planned' && phase.items.length > 6 && (
                          <li style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', paddingLeft: 24 }}>
                            + {phase.items.length - 6} autres fonctionnalités…
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </RevealSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMPETITOR TABLE ──────────────────────────────────────────── */}
      <CompetitorTable />

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 28, padding: 'clamp(40px,5vw,64px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(249,115,22,0.08), transparent)`, pointerEvents: 'none' }} />
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 14, position: 'relative', color: '#fff' }}>
                Prêt à reprendre le contrôle{' '}
                <span style={{
                  background: `linear-gradient(135deg, ${GOLD} 0%, #fbbf24 50%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>de vos finances ?</span>
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, marginBottom: 32, position: 'relative' }}>
                Gratuit, sans carte bancaire, sans engagement.<br />
                Créez votre compte en 30 secondes.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: GOLD, color: '#000', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${GOLD}50` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                  Créer un compte gratuit <ArrowRight style={{ width: 15, height: 15 }} />
                </Link>
                <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                  Déjà un compte ? Se connecter →
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '0 20px 40px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 40 }}>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp style={{ width: 13, height: 13, color: '#0a0a0a' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>FinCalc</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
                Outils de finance personnelle pour investisseurs français.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Produit</h4>
              {[['#demo', 'Démo interactive'], ['#modules', 'Calculateurs'], ['#how', 'Comment ça marche'], ['#comparatif', 'Comparatif'], ['#roadmap', 'Roadmap'], ['#why', 'Nos engagements'], ['#security', 'Protection'], ['/login', 'Créer un compte']].map(([href, label]) => (
                <a key={href} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                  {label}
                </a>
              ))}
            </div>

            {/* Légal */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Légal</h4>
              {[['/mentions-legales', 'Mentions légales'], ['/politique-confidentialite', 'Politique de confidentialité'], ['/cgu', 'CGU']].map(([href, label]) => (
                <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                  {label}
                </a>
              ))}
            </div>

            {/* À propos */}
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>À propos</h4>
              {[['/about', 'À propos de FinCalc'], ['mailto:contact@fincalc.app', 'Contact']].map(([href, label]) => (
                <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>© 2026 FinCalc · Tous droits réservés</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', maxWidth: 420, textAlign: 'right', lineHeight: 1.6 }}>
              Calculs fournis à titre indicatif uniquement. Consultez un conseiller financier agréé pour vos décisions d'investissement.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
