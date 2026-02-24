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
  Globe
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────
const GOLD = '#f1c086'
const GOLD_DARK = 'rgba(241,192,134,0.15)'
const GOLD_BORDER = 'rgba(241,192,134,0.25)'
const GOLD_GLOW = 'rgba(241,192,134,0.08)'

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
  { step: '02', title: 'Lancez une simulation', desc: 'Choisissez parmi 9 calculateurs et renseignez vos paramètres en quelques clics.' },
  { step: '03', title: 'Visualisez votre avenir', desc: 'Graphiques interactifs, synthèses détaillées et recommandations personnalisées.' },
]

const ROADMAP = [
  { status: 'done', label: 'Connexion Google OAuth', desc: 'Authentification sécurisée via Google' },
  { status: 'done', label: '9 calculateurs financiers', desc: 'Épargne, Immobilier, Fiscal, Budget' },
  { status: 'done', label: 'Historique des simulations', desc: 'Sauvegarde et restauration des scénarios' },
  { status: 'wip', label: 'Export PDF avec branding', desc: 'Téléchargez vos simulations en PDF premium' },
  { status: 'wip', label: 'Mode sombre / clair', desc: 'Personnalisation de l\'interface' },
  { status: 'planned', label: 'Application mobile native', desc: 'iOS & Android — accès où que vous soyez' },
  { status: 'planned', label: 'Comptes multi-utilisateurs', desc: 'Partagez vos simulations avec votre famille ou conseiller' },
  { status: 'planned', label: 'Partage de simulations', desc: 'Liens publics pour partager un scénario' },
  { status: 'planned', label: 'Alertes & objectifs', desc: 'Notifications quand vous atteignez vos jalons' },
  { status: 'planned', label: 'Tableau de bord personnalisable', desc: 'Widgets drag & drop selon vos priorités' },
  { status: 'planned', label: 'Nouveaux simulateurs', desc: 'Succession, donation, assurance-vie, SCPI' },
  { status: 'planned', label: 'Intégrations bancaires', desc: 'Import automatique de vos données via Open Banking' },
]

// ─── Floating financial icons ─────────────────────────────────────────────
const FLOAT_ICONS = [
  { icon: '€', x: 8, y: 15, size: 28, delay: 0, dur: 6, opacity: 0.12 },
  { icon: '📈', x: 88, y: 10, size: 32, delay: 1.2, dur: 5, opacity: 0.15 },
  { icon: '🏠', x: 75, y: 60, size: 26, delay: 0.5, dur: 7, opacity: 0.12 },
  { icon: '💰', x: 5, y: 65, size: 24, delay: 2, dur: 5.5, opacity: 0.1 },
  { icon: '%', x: 92, y: 80, size: 22, delay: 1.5, dur: 6.5, opacity: 0.1 },
  { icon: '📊', x: 50, y: 5, size: 20, delay: 0.8, dur: 4.5, opacity: 0.1 },
  { icon: '🏦', x: 20, y: 85, size: 22, delay: 3, dur: 6, opacity: 0.1 },
  { icon: '₿', x: 60, y: 88, size: 20, delay: 2.5, dur: 5, opacity: 0.08 },
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

// ─── Section wrapper with reveal ─────────────────────────────────────────
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ─── Tag badge ────────────────────────────────────────────────────────────
function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, color: GOLD, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
      {children}
    </div>
  )
}

// ─── Dashboard Preview (mini) ─────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div style={{ position: 'relative', maxWidth: 920, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ position: 'absolute', inset: -16, background: 'linear-gradient(to top, rgba(241,192,134,0.06), transparent)', borderRadius: 32, filter: 'blur(20px)' }} />
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
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp style={{ width: 13, height: 13, color: '#f1c086' }} />
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
                  {item.active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f1c086' }} />}
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
                    <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: i === 11 ? '#f1c086' : 'rgba(241,192,134,0.2)' }} />
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
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif", overflowX: 'hidden' }}>

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
            <div style={{ width: 32, height: 32, borderRadius: 9, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 15, height: 15, color: GOLD }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>FinCalc</span>
          </Link>

          {/* Desktop links */}
          <div style={{ alignItems: 'center', gap: 24 }} className="hidden md:flex">
            {[['#modules', 'Modules'], ['#how', 'Comment ça marche'], ['#why', 'Nos engagements'], ['#security', 'Sécurité'], ['#roadmap', 'Roadmap']].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                {label}
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
            fontSize: f.size,
            opacity: f.opacity,
            pointerEvents: 'none',
            userSelect: 'none',
            animation: `float-slow ${f.dur}s ease-in-out infinite ${f.delay}s`,
            filter: 'blur(0.5px)',
          }}>
            {f.icon}
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
            9 calculateurs · Fiscalité française 2026
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2.4rem,6vw,4.2rem)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#fff', marginBottom: 24 }}>
            Prenez le contrôle de votre{' '}
            <span style={{
              fontStyle: 'italic',
              background: `linear-gradient(135deg, ${GOLD} 0%, #e0965a 50%, ${GOLD} 100%)`,
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

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.42)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 36px' }}>
            Simulez vos investissements, optimisez votre fiscalité et planifiez votre retraite avec des outils conçus pour le marché français.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
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

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[{ v: '9', l: 'Calculateurs' }, { v: '100%', l: 'Gratuit' }, { v: '0', l: 'Publicités' }, { v: 'FR', l: 'Fiscalité 2026' }].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.8rem', fontStyle: 'italic', color: GOLD }}>{s.v}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div style={{ width: '100%', marginTop: 64, opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(30px)', transition: 'all 1s ease 0.3s' }}>
          <DashboardPreview />
        </div>
      </section>

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <section id="modules" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ marginBottom: 56 }}>
              <SectionTag><BarChart3 style={{ width: 11, height: 11 }} /> Calculateurs</SectionTag>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em', maxWidth: 480 }}>
                Tout ce dont vous avez besoin{' '}
                <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.35)' }}>pour piloter votre patrimoine</span>
              </h2>
            </div>
          </RevealSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {MODULES.map((mod, i) => (
              <RevealSection key={i} delay={i * 50}>
                <ModuleCard mod={mod} index={i} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how" style={{ padding: '100px 20px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <SectionTag><Clock style={{ width: 11, height: 11 }} /> En 3 étapes</SectionTag>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
                Comment ça marche ?
              </h2>
            </div>
          </RevealSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {HOW.map((step, i) => (
              <RevealSection key={i} delay={i * 120}>
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -10, right: 16, fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 80, fontStyle: 'italic', color: 'rgba(255,255,255,0.025)', fontWeight: 400, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
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
              <SectionTag><Star style={{ width: 11, height: 11 }} /> Nos engagements</SectionTag>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
                Pourquoi FinCalc ?
              </h2>
            </div>
          </RevealSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" style={{ gap: 10 }}>
            {WHY.map((w, i) => (
              <RevealSection key={i} delay={i * 80}>
                <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px 20px', textAlign: 'center', transition: 'border-color 0.2s' }}
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
          <div style={{ background: 'linear-gradient(135deg, rgba(241,192,134,0.04) 0%, rgba(52,211,153,0.03) 100%)', border: `1px solid ${GOLD_BORDER}`, borderRadius: 28, padding: 'clamp(32px,5vw,64px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${GOLD}08, transparent 55%)`, pointerEvents: 'none' }} />

            <RevealSection>
              <div style={{ marginBottom: 44, position: 'relative' }}>
                <SectionTag><Shield style={{ width: 11, height: 11 }} /> Protection</SectionTag>
                <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 400, lineHeight: 1.2, letterSpacing: '-0.025em' }}>
                  Sécurité & confidentialité
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
      <section id="roadmap" style={{ padding: '80px 20px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ marginBottom: 52 }}>
              <SectionTag><Globe style={{ width: 11, height: 11 }} /> Ce qui arrive</SectionTag>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em' }}>
                Roadmap
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', marginTop: 12, lineHeight: 1.7 }}>
                FinCalc évolue en continu. Voici les fonctionnalités déjà disponibles et ce qui arrive.
              </p>
            </div>
          </RevealSection>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>
            {[{ c: '#34d399', l: 'Disponible' }, { c: GOLD, l: 'En cours' }, { c: 'rgba(255,255,255,0.2)', l: 'Planifié' }].map(({ c, l }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                {l}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 8 }}>
            {ROADMAP.map((item, i) => {
              const color = item.status === 'done' ? '#34d399' : item.status === 'wip' ? GOLD : 'rgba(255,255,255,0.2)'
              const bgColor = item.status === 'done' ? 'rgba(52,211,153,0.08)' : item.status === 'wip' ? GOLD_DARK : 'rgba(255,255,255,0.03)'
              const borderColor = item.status === 'done' ? 'rgba(52,211,153,0.2)' : item.status === 'wip' ? GOLD_BORDER : 'rgba(255,255,255,0.06)'
              return (
                <RevealSection key={i} delay={i * 40}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px', background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: item.status === 'planned' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                    {item.status === 'done' && <Check style={{ width: 14, height: 14, color: '#34d399', marginLeft: 'auto', flexShrink: 0 }} />}
                    {item.status === 'wip' && <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, padding: '2px 6px', borderRadius: 4, marginLeft: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}>EN COURS</div>}
                  </div>
                </RevealSection>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <RevealSection>
            <div style={{ background: `linear-gradient(135deg, ${GOLD}10 0%, rgba(52,211,153,0.04) 100%)`, border: `1px solid ${GOLD_BORDER}`, borderRadius: 28, padding: 'clamp(40px,5vw,64px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${GOLD}15, transparent 55%)`, pointerEvents: 'none' }} />
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 400, lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 14, position: 'relative' }}>
                Prêt à reprendre le contrôle de vos finances ?
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
                <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD_DARK, border: `1px solid ${GOLD_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp style={{ width: 13, height: 13, color: GOLD }} />
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
              {[['#modules', 'Calculateurs'], ['#how', 'Comment ça marche'], ['#roadmap', 'Roadmap'], ['#why', 'Nos engagements'], ['#security', 'Protection'], ['/login', 'Créer un compte']].map(([href, label]) => (
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
