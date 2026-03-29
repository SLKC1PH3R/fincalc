import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Calculator, 
  Shield, 
  Zap, 
  BarChart3, 
  PieChart, 
  Lock, 
  Eye, 
  Clock,
  ChevronRight,
  ArrowRight,
  Check,
  X,
  Building2,
  Wallet,
  Home,
  PiggyBank,
  Percent,
  Target,
  LineChart,
  Landmark,
  Briefcase,
  Sparkles,
  Menu,
  X as XIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Navigation Component
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Modules', href: '#modules' },
    { label: 'Taux en Direct', href: '#rates' },
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Roadmap', href: '#roadmap' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass-strong py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FinCalc</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5">
              Se connecter
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5">
              Commencer
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Button variant="ghost" className="justify-start text-zinc-400">
                  Se connecter
                </Button>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  Commencer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* Gradient Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-orange-500/5 via-transparent to-transparent rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-zinc-300">13 calculateurs · Fiscalité française 2026</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in-up">
            Prenez le contrôle de votre{' '}
            <span className="text-gradient italic">avenir financier</span>
            <br />
            dès maintenant
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Simulez vos investissements, optimisez votre fiscalité et planifiez votre retraite 
            avec des outils conçus pour le marché français.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-base group glow-orange">
              Créer un compte gratuit
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base">
              Voir les modules
            </Button>
          </div>

          {/* Demo Link */}
          <div className="flex items-center justify-center gap-2 text-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-orange-400 font-medium">Essayer sans s'inscrire</span>
            <span className="text-zinc-500">— compte démo disponible</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {[
              { value: '13', label: 'Calculateurs', suffix: '' },
              { value: '100', label: 'Gratuit', suffix: '%' },
              { value: '0', label: 'Publicités', suffix: '' },
              { value: 'FR', label: 'Fiscalité 2026', suffix: '' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gradient mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 animate-fade-in-scale" style={{ animationDelay: '0.5s' }}>
          <div className="relative mx-auto max-w-5xl">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            
            {/* Dashboard Frame */}
            <div className="relative glass-strong rounded-2xl overflow-hidden border border-white/10">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-zinc-500 font-mono">fire.digitalstack.cloud/dashboard</span>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="p-6 bg-gradient-to-b from-zinc-900/50 to-black/50">
                <div className="grid grid-cols-12 gap-4">
                  {/* Sidebar */}
                  <div className="col-span-3 hidden md:block">
                    <div className="glass rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="font-semibold text-white">FinCalc</span>
                      </div>
                      {['Accueil', 'Intérêts', 'DCA', 'FI/RE', 'Immobilier'].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${i === 0 ? 'bg-white/10 text-white' : 'text-zinc-500'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="col-span-12 md:col-span-9 space-y-4">
                    {/* Welcome */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-500 text-sm">Bonsoir, Jeremy</p>
                        <h3 className="text-white font-semibold">Tableau de bord</h3>
                      </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Simulations', value: '12', color: 'orange' },
                        { label: 'Cette semaine', value: '3', color: 'amber' },
                        { label: 'Module favori', value: 'FI/RE', color: 'emerald' },
                      ].map((card, i) => (
                        <div key={i} className="glass rounded-xl p-4">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{card.label}</p>
                          <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Charts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-xl p-4 h-32">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Activité</p>
                        <div className="flex items-end gap-1 h-16">
                          {[40, 60, 45, 80, 55, 70, 90].map((h, i) => (
                            <div key={i} className="flex-1 bg-orange-500/30 rounded-t" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4 h-32">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Répartition</p>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full border-4 border-orange-500/50 border-t-amber-400/50" />
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> Composés</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> DCA</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> FI/RE</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Live Rates Section
function LiveRatesSection() {
  const rates = {
    savings: [
      { name: 'Livret A', rate: '2.40%', limit: '22 950 €', trend: 'stable', color: 'emerald' },
      { name: 'LDDS', rate: '2.40%', limit: '12 000 €', trend: 'stable', color: 'emerald' },
      { name: 'LEP', rate: '3.50%', limit: '10 000 €', trend: 'down', color: 'rose', note: 'sous conditions' },
    ],
    mortgage: [
      { name: '15 ans', rate: '3.10%', trend: 'stable', color: 'emerald' },
      { name: '20 ans', rate: '3.30%', trend: 'stable', color: 'emerald' },
      { name: '25 ans', rate: '3.50%', trend: 'stable', color: 'emerald' },
    ],
    macro: [
      { name: 'OAT 10 ans', rate: '3.45%', desc: 'Obligation d\'État', trend: 'up', color: 'emerald' },
      { name: 'Taux BCE', rate: '2.65%', desc: 'Banque Centrale Européenne', trend: 'down', color: 'rose' },
      { name: 'Inflation FR', rate: '1.10%', desc: 'Indice des prix', trend: 'down', color: 'rose' },
      { name: 'Crédit conso', rate: '5.80%', desc: 'Taux moyen du marché', trend: 'stable', color: 'emerald' },
    ],
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />;
    return <div className="w-4 h-4 rounded-full border-2 border-zinc-500" />;
  };

  return (
    <section id="rates" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-orange-500/30 text-orange-400 mb-4">
            <Clock className="w-3 h-3 mr-1" />
            Mis à jour automatiquement
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Les taux qui pilotent vos{' '}
            <span className="text-gradient">décisions financières</span>
          </h2>
          <p className="text-zinc-500">Données indicatives · mise à jour automatique chaque heure</p>
        </div>

        {/* Rates Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Savings */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Épargne réglementée</h3>
            </div>
            <div className="space-y-4">
              {rates.savings.map((rate) => (
                <div key={rate.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{rate.name}</span>
                      {rate.note && <span className="text-xs text-zinc-500">({rate.note})</span>}
                    </div>
                    <span className="text-xs text-zinc-500">Plafond {rate.limit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold text-${rate.color}-400`}>{rate.rate}</span>
                    <TrendIcon trend={rate.trend} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mortgage */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Home className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Crédit immobilier</h3>
            </div>
            <div className="space-y-4">
              {rates.mortgage.map((rate) => (
                <div key={rate.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div>
                    <span className="font-medium text-white">Meilleur taux</span>
                    <span className="text-xs text-zinc-500 ml-2">sur {rate.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold text-${rate.color}-400`}>{rate.rate}</span>
                    <TrendIcon trend={rate.trend} />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
              Simuler mon prêt
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Macro */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Marchés & Macro</h3>
            </div>
            <div className="space-y-4">
              {rates.macro.map((rate) => (
                <div key={rate.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div>
                    <span className="font-medium text-white">{rate.name}</span>
                    <span className="text-xs text-zinc-500 ml-2">{rate.desc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold text-${rate.color}-400`}>{rate.rate}</span>
                    <TrendIcon trend={rate.trend} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Modules Section
function ModulesSection() {
  const modules = [
    { 
      category: 'Épargne', 
      name: 'Intérêts Composés', 
      desc: 'Visualisez l\'effet boule de neige de votre épargne sur des décennies.',
      icon: TrendingUp,
      color: 'orange'
    },
    { 
      category: 'Épargne', 
      name: 'DCA', 
      desc: 'Simulez un plan d\'investissement régulier vs achat unique.',
      icon: Clock,
      color: 'amber'
    },
    { 
      category: 'Épargne', 
      name: 'FI/RE', 
      desc: 'Calculez votre objectif FIRE et votre date de liberté financière.',
      icon: Target,
      color: 'emerald'
    },
    { 
      category: 'Immobilier', 
      name: 'Prêt Immobilier', 
      desc: 'Mensualités, TAEG, tableau d\'amortissement complet.',
      icon: Home,
      color: 'orange'
    },
    { 
      category: 'Immobilier', 
      name: 'Acheter vs Louer', 
      desc: 'Comparez le patrimoine généré selon votre stratégie résidentielle.',
      icon: Building2,
      color: 'amber'
    },
    { 
      category: 'Immobilier', 
      name: 'Rentabilité Locative', 
      desc: 'Cashflow, rendement net et fiscalité de votre investissement locatif.',
      icon: BarChart3,
      color: 'emerald'
    },
    { 
      category: 'Fiscal', 
      name: 'Impôts IR', 
      desc: 'Calcul IR, TMI, comparaison frais réels vs abattement 10%.',
      icon: Calculator,
      color: 'orange'
    },
    { 
      category: 'Fiscal', 
      name: 'Simulateur Retraite', 
      desc: 'Pension estimée et optimisation de votre PER pour 2026.',
      icon: Landmark,
      color: 'amber'
    },
    { 
      category: 'Budget', 
      name: 'Budget 50/30/20', 
      desc: 'Répartition de vos dépenses selon la règle d\'or des finances perso.',
      icon: PieChart,
      color: 'emerald'
    },
    { 
      category: 'Fiscal', 
      name: 'Flat Tax vs Barème', 
      desc: 'Comparez le PFU 30% au barème progressif selon votre TMI.',
      icon: Percent,
      color: 'orange'
    },
    { 
      category: 'Investissement', 
      name: 'PEA vs CTO vs AV', 
      desc: 'Simulez la fiscalité nette de chaque enveloppe d\'investissement.',
      icon: Wallet,
      color: 'amber'
    },
    { 
      category: 'Budget', 
      name: 'Taux d\'épargne', 
      desc: 'Calculez et optimisez votre taux d\'épargne mensuel.',
      icon: PiggyBank,
      color: 'emerald'
    },
    { 
      category: 'Patrimoine', 
      name: 'Score Patrimonial', 
      desc: 'Obtenez votre score global et des recommandations sur 6 piliers.',
      icon: Briefcase,
      color: 'orange'
    },
  ];

  return (
    <section id="modules" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-orange-500/30 text-orange-400 mb-4">
            <Calculator className="w-3 h-3 mr-1" />
            13 calculateurs
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Tous les outils pour{' '}
            <span className="text-gradient">maîtriser vos finances</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Des simulateurs complets et gratuits pour chaque aspect de votre vie financière.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <div
                key={module.name}
                className="group glass rounded-xl p-5 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:glow-subtle"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Category Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-medium text-${module.color}-400 uppercase tracking-wider`}>
                    {module.category}
                  </span>
                </div>
                
                {/* Icon & Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${module.color}-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 text-${module.color}-400`} />
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                    {module.name}
                  </h3>
                </div>
                
                {/* Description */}
                <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                  {module.desc}
                </p>
                
                {/* Action */}
                <div className="flex items-center text-sm text-zinc-600 group-hover:text-orange-400 transition-colors">
                  <span>Ouvrir</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: 'Rapidité',
      desc: 'Résultats instantanés à chaque frappe. Pas d\'attente, pas de rechargement.',
      color: 'orange'
    },
    {
      icon: BarChart3,
      title: 'Simulations avancées',
      desc: 'Modèles financiers précis avec inflation, charges fiscales et scénarios multiples.',
      color: 'amber'
    },
    {
      icon: Eye,
      title: 'Interface claire',
      desc: 'Conçu pour être compris immédiatement, sans formation ni tutoriel.',
      color: 'emerald'
    },
    {
      icon: X,
      title: 'Pas de pub',
      desc: 'Aucune publicité, aucun tracking, aucune revente de données. Point.',
      color: 'rose'
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <Badge variant="outline" className="border-orange-500/30 text-orange-400 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Pourquoi FinCalc
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Conçu pour les{' '}
              <span className="text-gradient">investisseurs exigeants</span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Chaque détail a été pensé pour vous offrir la meilleure expérience de simulation financière.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="glass rounded-xl p-5 hover:bg-white/[0.06] transition-colors">
                    <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-500">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right - Security Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-3xl blur-2xl" />
            <div className="relative glass-strong rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Sécurité & confidentialité</h3>
                  <p className="text-sm text-zinc-500">Vos données sont protégées</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'Vos données sont chiffrées', sub: 'Toutes les transmissions sont sécurisées via HTTPS/TLS' },
                  { icon: Eye, text: 'Aucune donnée bancaire requise', sub: 'Aucun RIB, aucun accès à vos comptes. Zéro risque.' },
                  { icon: Shield, text: 'Respect de votre vie privée', sub: 'Pas de tracking, pas de cookies tiers' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.text}</p>
                        <p className="text-sm text-zinc-500">{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Roadmap Section
function RoadmapSection() {
  const roadmap = [
    { quarter: 'Q1 2026', status: 'available', items: ['Connexion Google OAuth', 'Authentification sécurisée via Google'] },
    { quarter: 'Q2 2026', status: 'in-progress', items: ['Comparaison multi-scénarios', 'Calculatrice rapide (sidebar)', 'Mode "reverse"'] },
    { quarter: 'Q3 2026', status: 'planned', items: ['Tableau patrimonial complet', 'Export PDF des simulations', 'Partage de scénarios'] },
    { quarter: 'Q4 2026', status: 'planned', items: ['API ouverte', 'Mobile app', 'Intégrations bancaires'] },
  ];

  return (
    <section id="roadmap" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-orange-500/30 text-orange-400 mb-4">
            <Clock className="w-3 h-3 mr-1" />
            Évolution continue
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Ce qui arrive sur{' '}
            <span className="text-gradient">FinCalc</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            FinCalc évolue en continu. Voici les fonctionnalités déjà disponibles et ce qui arrive.
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmap.map((item) => (
            <div key={item.quarter} className="glass rounded-xl p-6 relative overflow-hidden">
              {/* Status Indicator */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                item.status === 'available' ? 'bg-emerald-500' :
                item.status === 'in-progress' ? 'bg-amber-500' : 'bg-zinc-600'
              }`} />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-white">{item.quarter}</span>
                <Badge className={`${
                  item.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-zinc-700/50 text-zinc-400'
                }`}>
                  {item.status === 'available' ? 'Disponible' :
                   item.status === 'in-progress' ? 'En cours' : 'Planifié'}
                </Badge>
              </div>
              
              <ul className="space-y-3">
                {item.items.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      item.status === 'available' ? 'text-emerald-400' :
                      item.status === 'in-progress' ? 'text-amber-400' : 'text-zinc-600'
                    }`} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Comparison Section
function ComparisonSection() {
  const features = [
    { name: '100% gratuit', fincalc: true, finary: 'partiel', bank: false },
    { name: 'Intérêts composés', fincalc: true, finary: true, bank: 'partiel' },
    { name: 'Simulateur FI/RE', fincalc: true, finary: false, bank: false },
    { name: 'Simulateur retraite', fincalc: true, finary: 'partiel', bank: true },
    { name: 'Calcul impôts IR / TMI', fincalc: true, finary: false, bank: true },
    { name: 'DCA / Investissement régulier', fincalc: true, finary: 'partiel', bank: false },
    { name: 'Acheter vs Louer', fincalc: true, finary: false, bank: false },
    { name: 'Fiscalité française 2026', fincalc: true, finary: 'partiel', bank: true },
    { name: 'Sans données bancaires', fincalc: true, finary: true, bank: false },
    { name: 'Zéro publicité', fincalc: true, finary: false, bank: false },
  ];

  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-emerald-400" />;
    if (value === false) return <X className="w-5 h-5 text-zinc-600" />;
    return <span className="text-sm text-amber-400">{value}</span>;
  };

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            FinCalc vs les{' '}
            <span className="text-gradient">alternatives</span>
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Des simulateurs conçus pour les investisseurs français, pas pour les banques.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="font-medium text-zinc-400">Fonctionnalité</div>
            <div className="text-center font-semibold text-orange-400">FinCalc</div>
            <div className="text-center font-medium text-zinc-400">Finary</div>
            <div className="text-center font-medium text-zinc-400">Votre banque</div>
          </div>
          
          {/* Rows */}
          {features.map((feature, index) => (
            <div 
              key={feature.name} 
              className={`grid grid-cols-4 gap-4 p-4 items-center ${
                index !== features.length - 1 ? 'border-b border-white/5' : ''
              } hover:bg-white/[0.02] transition-colors`}
            >
              <div className="text-white">{feature.name}</div>
              <div className="flex justify-center">{renderValue(feature.fincalc)}</div>
              <div className="flex justify-center">{renderValue(feature.finary)}</div>
              <div className="flex justify-center">{renderValue(feature.bank)}</div>
            </div>
          ))}
        </div>
        
        <p className="text-center text-sm text-zinc-600 mt-4">
          Comparaison basée sur les offres publiques au 1er trimestre 2026.
        </p>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-transparent to-transparent" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-strong rounded-3xl p-12 border border-orange-500/20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Prêt à reprendre le contrôle{' '}
            <span className="text-gradient">de vos finances ?</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Gratuit, sans carte bancaire, sans engagement.
            <br />
            Créez votre compte en 30 secondes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-6 text-base glow-orange">
              Créer un compte gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          <a href="#" className="inline-flex items-center gap-2 mt-6 text-sm text-zinc-500 hover:text-orange-400 transition-colors">
            Déjà un compte ? Se connecter
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const links = {
    product: [
      { label: 'Démo interactive', href: '#' },
      { label: 'Calculateurs', href: '#modules' },
      { label: 'Comment ça marche', href: '#' },
      { label: 'Comparatif', href: '#' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
    legal: [
      { label: 'Mentions légales', href: '#' },
      { label: 'Politique de confidentialité', href: '#' },
      { label: 'CGU', href: '#' },
    ],
    about: [
      { label: 'À propos de FinCalc', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  };

  return (
    <footer className="py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FinCalc</span>
            </a>
            <p className="text-sm text-zinc-500">
              Outils de finance personnelle pour investisseurs français.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Légal</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">À propos</h4>
            <ul className="space-y-2">
              {links.about.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-zinc-500 hover:text-orange-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            © 2026 FinCalc · Tous droits réservés
          </p>
          <p className="text-xs text-zinc-700 text-center md:text-right">
            Calculs fournis à titre indicatif uniquement. Consultez un conseiller financier agréé pour vos décisions d'investissement.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Main App Component
function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white noise-bg">
      <Navigation />
      <main>
        <HeroSection />
        <LiveRatesSection />
        <ModulesSection />
        <FeaturesSection />
        <RoadmapSection />
        <ComparisonSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
