'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, RefreshCw, Calculator, ArrowRight, ChevronRight,
  Shield, Zap, Lock, BarChart3, LineChart, Target
} from 'lucide-react'

// ─── Data ──────────────────────────────────────────────────────────────────
const MODULES = [
  { icon: TrendingUp, label: 'Intérêts Composés', desc: 'Visualisez l\'effet boule de neige de votre épargne et projetez votre capital sur des décennies.', tag: 'Épargne', color: '#34d399', href: '/login' },
  { icon: RefreshCw, label: 'DCA', desc: 'Simulez un plan d\'investissement régulier et comparez avec un achat unique en lump sum.', tag: 'Épargne', color: '#38bdf8', href: '/login' },
  { icon: Flame, label: 'FI/RE', desc: 'Calculez votre objectif d\'indépendance financière et estimez votre date de retraite anticipée.', tag: 'Épargne', color: '#fb923c', href: '/login' },
  { icon: Home, label: 'Acheter vs Louer', desc: 'Comparez le patrimoine généré selon que vous achetez ou louez votre résidence principale.', tag: 'Immobilier', color: '#a78bfa', href: '/login' },
  { icon: Building2, label: 'Prêt Immobilier', desc: 'Calculez vos mensualités, le TAEG et générez le tableau d\'amortissement complet.', tag: 'Immobilier', color: '#f472b6', href: '/login' },
  { icon: Wallet, label: 'Rentabilité Locative', desc: 'Analysez le cashflow, la rentabilité nette et la fiscalité de votre investissement locatif.', tag: 'Immobilier', color: '#2dd4bf', href: '/login' },
  { icon: Receipt, label: 'Impôts IR', desc: 'Calculez votre impôt sur le revenu 2024, votre TMI et comparez frais réels vs abattement.', tag: 'Fiscal', color: '#fb7185', href: '/login' },
  { icon: PiggyBank, label: 'Simulateur Retraite', desc: 'Estimez votre pension de retraite et optimisez votre préparation via le PER.', tag: 'Fiscal', color: '#fbbf24', href: '/login' },
  { icon: Calculator, label: 'Budget 50/30/20', desc: 'Analysez la répartition de vos dépenses et optimisez selon la règle d\'or des finances perso.', tag: 'Budget', color: '#a3e635', href: '/login' },
]

const STATS = [
  { value: '9', label: 'Calculateurs' },
  { value: '100%', label: 'Gratuit' },
  { value: '0', label: 'Publicités' },
  { value: 'FR', label: 'Fiscalité française' },
]

const FEATURES = [
  { icon: Shield, title: 'Données privées', desc: 'Vos simulations sont stockées sur votre compte personnel. Aucune donnée partagée.' },
  { icon: Zap, title: 'Calculs instantanés', desc: 'Résultats en temps réel à chaque modification. Graphiques et synthèses automatiques.' },
  { icon: Lock, title: 'Open source', desc: 'Code entièrement transparent. Déployez votre propre instance sur votre infrastructure.' },
  { icon: BarChart3, title: 'Historique complet', desc: 'Sauvegardez et retrouvez toutes vos simulations. Comparez l\'évolution de vos scénarios.' },
  { icon: LineChart, title: 'Fiscalité 2024', desc: 'Barèmes IR, PS, LMNP, PER à jour. Calculs adaptés au droit fiscal français.' },
  { icon: Target, title: 'Synthèses claires', desc: 'Chaque calculateur produit un score, des recommandations et des axes d\'optimisation.' },
]

// ─── Dashboard Preview ─────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent rounded-3xl blur-xl" />

      {/* Frame */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
        style={{ background: '#080808' }}>

        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: '#050505' }}>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 mx-4 bg-white/[0.04] border border-white/[0.06] rounded-md px-3 py-1 text-[11px] text-white/25 text-center">
            fire.digitalstack.cloud/dashboard
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-[420px]">
          {/* Mini sidebar */}
          <div className="w-48 flex-shrink-0 border-r border-white/[0.05] flex flex-col py-4 px-2 gap-1" style={{ background: '#060606' }}>
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 mb-4">
              <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <TrendingUp className="h-3 w-3 text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-white">FinCalc</span>
            </div>
            {/* Nav sections */}
            {[
              { label: 'Épargne', items: ['Accueil', 'Intérêts', 'DCA', 'FI/RE'] },
              { label: 'Immobilier', items: ['Achat/Loc', 'Prêt', 'Locatif'] },
            ].map(s => (
              <div key={s.label} className="mb-3">
                <p className="text-[9px] text-white/20 uppercase tracking-widest px-2 mb-1 font-semibold">{s.label}</p>
                {s.items.map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${i === 0 && s.label === 'Épargne' ? 'bg-white/[0.07] text-white' : 'text-white/30'}`}>
                    {i === 0 && s.label === 'Épargne' && <span className="w-1 h-1 rounded-full bg-indigo-400" />}
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 p-5 overflow-hidden">
            {/* Page header */}
            <div className="mb-4">
              <p className="text-[11px] text-white/30 mb-0.5">Bonjour, jeremy</p>
              <p className="text-sm font-semibold text-white tracking-tight">Tableau de bord</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'Simulations', v: '12' },
                { l: 'Cette semaine', v: '3' },
                { l: 'Module favori', v: 'FI/RE' },
              ].map(s => (
                <div key={s.l} className="rounded-lg p-3" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[9px] text-white/30 uppercase tracking-wide mb-1">{s.l}</p>
                  <p className="text-sm font-semibold text-white">{s.v}</p>
                </div>
              ))}
            </div>

            {/* Charts mock */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-lg p-3" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] text-white/30 uppercase tracking-wide mb-2">Activité</p>
                <div className="flex items-end gap-0.5 h-10">
                  {[20, 35, 15, 50, 25, 60, 40, 55, 30, 70, 45, 80].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 11 ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.25)' }} />
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[9px] text-white/30 uppercase tracking-wide mb-2">Répartition</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full flex-shrink-0" style={{
                    background: 'conic-gradient(#34d399 0 30%, #38bdf8 30% 55%, #fb923c 55% 70%, #a78bfa 70% 100%)',
                    boxShadow: 'inset 0 0 0 4px #0f0f0f'
                  }} />
                  <div className="space-y-1">
                    {[['#34d399', 'Composés'], ['#38bdf8', 'DCA'], ['#fb923c', 'FI/RE']].map(([c, l]) => (
                      <div key={l} className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full" style={{ background: c }} />
                        <span className="text-[9px] text-white/35">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modules grid preview */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { color: '#34d399', label: 'Intérêts Composés', tag: 'ÉPARGNE' },
                { color: '#38bdf8', label: 'DCA', tag: 'ÉPARGNE' },
                { color: '#fb923c', label: 'FI/RE', tag: 'ÉPARGNE' },
              ].map(m => (
                <div key={m.label} className="rounded-lg p-3 relative overflow-hidden" style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 0% 0%, ${m.color}12, transparent 60%)` }} />
                  <p className="text-[8px] text-white/25 uppercase tracking-widest mb-1">{m.tag}</p>
                  <p className="text-[10px] font-semibold text-white relative">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Animated orb ─────────────────────────────────────────────────────────
function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  )
}

// ─── Main landing ─────────────────────────────────────────────────────────
export function LandingClient() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(6,6,6,0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-white tracking-tight">FinCalc</span>
          </div>

          {/* Links + CTA */}
          <div className="flex items-center gap-6">
            <a href="#modules" className="text-sm text-white/40 hover:text-white/70 transition-colors hidden md:block">Fonctionnalités</a>
            <a href="#features" className="text-sm text-white/40 hover:text-white/70 transition-colors hidden md:block">À propos</a>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-medium transition-all px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
              }}
            >
              Se connecter
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: '#fff', color: '#000' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e5e5e5' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
            >
              Commencer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        {/* Orbs */}
        <Orb style={{ width: 600, height: 600, top: -200, left: -200, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <Orb style={{ width: 500, height: 500, top: -100, right: -150, background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)' }} />
        <Orb style={{ width: 400, height: 400, bottom: 0, left: '40%', background: 'radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%)' }} />

        {/* Noise grain overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: '200px' }}
        />

        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            9 calculateurs · Fiscalité française 2024
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#fff',
            fontWeight: 400,
          }}>
            Vos finances personnelles,{' '}
            <span style={{ fontStyle: 'italic', color: 'transparent', backgroundImage: 'linear-gradient(135deg, #818cf8, #34d399)', backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>
              enfin maîtrisées
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            Simulez vos investissements, optimisez votre fiscalité et planifiez votre retraite
            avec des outils conçus pour le marché français.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#fff', color: '#000' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              Créer un compte gratuit <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#modules"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
            >
              Découvrir les modules
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-8 flex-wrap pt-4">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.5rem', color: '#fff', fontStyle: 'italic' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative w-full max-w-5xl mx-auto mt-16 px-4">
          <DashboardPreview />
        </div>
      </section>

      {/* ── Modules ───────────────────────────────────────────────────── */}
      <section id="modules" className="relative py-32 px-6">
        <Orb style={{ width: 500, height: 500, top: '20%', right: -200, background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="max-w-xl mb-16">
            <p style={{ fontSize: '11px', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 12 }}>Calculateurs</p>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 400 }}>
              Tout ce dont vous avez besoin
              <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}> pour piloter votre patrimoine</span>
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((mod) => (
              <Link
                key={mod.label}
                href={mod.href}
                className="group block"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl p-6 transition-all duration-200"
                  style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.borderColor = `${mod.color}40`
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(255,255,255,0.06)'
                    el.style.transform = ''
                  }}
                >
                  {/* glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 0% 0%, ${mod.color}10, transparent 60%)` }} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-5">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${mod.color}15`, border: `1px solid ${mod.color}25` }}>
                        <mod.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: mod.color }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{mod.tag}</span>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>{mod.label}</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 16 }}>{mod.desc}</p>

                    <div className="flex items-center gap-1.5 text-[11px] transition-colors"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>
                      <span className="group-hover:text-white/50">Ouvrir</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="relative py-32 px-6 overflow-hidden">
        <Orb style={{ width: 600, height: 600, bottom: -200, left: -200, background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />

        {/* Divider line */}
        <div className="max-w-6xl mx-auto mb-24" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)' }} />

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div className="space-y-6">
              <p style={{ fontSize: '11px', color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Pourquoi FinCalc</p>
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 400 }}>
                Des outils sérieux, pas des jouets
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>
                Conçu pour les investisseurs français qui veulent des calculs précis, des simulations sauvegardées et une fiscalité à jour — sans abonnement, sans publicités.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)' }}
              >
                Commencer maintenant <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Right: feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.title} className="rounded-xl p-5 transition-all"
                  style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                >
                  <f.icon className="h-4 w-4 mb-3 text-indigo-400" />
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>{f.title}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden p-12"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(52,211,153,0.06) 100%)', border: '1px solid rgba(99,102,241,0.15)' }}>

            {/* Inner glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />

            <div className="relative space-y-6">
              <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 400 }}>
                Prêt à reprendre le contrôle de vos finances ?
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                Gratuit, sans carte bancaire, sans engagement.
                Créez votre compte en 30 secondes avec Google ou par email.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#fff', color: '#000' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  Créer un compte gratuit <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                >
                  Déjà un compte ? Se connecter →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-12 pt-4">
        <div className="max-w-6xl mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <TrendingUp className="h-3 w-3 text-indigo-400" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>FinCalc</span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              Calculs indicatifs uniquement. Consultez un conseiller financier pour vos décisions d'investissement.
            </p>
            <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
            >
              Se connecter →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
