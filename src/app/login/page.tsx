'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, Loader2, Eye, EyeOff, BarChart3, Home, Calculator, Flame, PiggyBank, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const GOLD = '#f1c086'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        'Erreur lors de la connexion Google. Réessayez.',
  OAuthCallback:      'Erreur lors de la connexion Google. Réessayez.',
  OAuthCreateAccount: 'Impossible de créer le compte Google. Vérifiez la configuration.',
  Default:            'Une erreur est survenue. Réessayez.',
}

/* ── Dashboard Preview (right panel) ── */
function DashboardPreview() {
  const modules = [
    { label: 'Impôts IR', icon: Calculator, color: '#f97316', tag: 'FISCALITÉ' },
    { label: 'FI/RE', icon: Flame, color: '#f1c086', tag: 'LIBERTÉ' },
    { label: 'Locatif', icon: Home, color: '#22c55e', tag: 'IMMO' },
    { label: 'Budget', icon: PiggyBank, color: '#a78bfa', tag: 'PERSO' },
    { label: 'Composés', icon: BarChart3, color: '#38bdf8', tag: 'INVEST' },
    { label: 'Retraite', icon: TrendingUp, color: '#fb7185', tag: 'FUTUR' },
  ]
  const kpis = [
    { label: 'Simulations', value: '24', sub: 'total' },
    { label: 'Cette semaine', value: '3', sub: 'nouvelles' },
    { label: 'Module favori', value: 'FI/RE', sub: '8 fois' },
    { label: 'Calculateurs', value: '9', sub: 'disponibles' },
  ]

  return (
    <div style={{
      width: '100%',
      maxWidth: 560,
      transform: 'perspective(1200px) rotateY(-8deg) rotateX(4deg)',
      transformStyle: 'preserve-3d',
      filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.6))',
    }}>
      {/* Fake browser bar */}
      <div style={{ background: '#111', borderRadius: '12px 12px 0 0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        <div style={{ flex: 1, margin: '0 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>fire.digitalstack.cloud/dashboard</span>
        </div>
      </div>

      {/* App shell */}
      <div style={{ background: '#080808', borderRadius: '0 0 12px 12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none' }}>
        {/* Top nav */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 12, height: 12, color: '#000' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>FinCalc</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Tableau de bord', 'Historique', 'Paramètres'].map((t, i) => (
              <span key={i} style={{ fontSize: 9, color: i === 0 ? GOLD : 'rgba(255,255,255,0.3)', padding: '3px 8px', borderRadius: 4, background: i === 0 ? `${GOLD}15` : 'transparent', border: i === 0 ? `1px solid ${GOLD}30` : 'none' }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {/* Greeting */}
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Bonsoir, Thomas</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Tableau de bord</p>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
            {kpis.map((k, i) => (
              <div key={i} style={{ background: i === 3 ? `${GOLD}10` : '#0f0f0f', border: `1px solid ${i === 3 ? GOLD + '30' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '8px 10px' }}>
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{k.label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: i === 3 ? GOLD : '#fff', letterSpacing: '-0.02em' }}>{k.value}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{k.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modules grid */}
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>Calculateurs</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
            {modules.map((mod, i) => (
              <div key={i} style={{ background: `radial-gradient(ellipse at top left, ${mod.color}18, transparent 70%)`, border: `1px solid ${mod.color}30`, borderRadius: 8, padding: '10px 10px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: mod.color + '20', border: `1px solid ${mod.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <mod.icon style={{ width: 11, height: 11, color: mod.color }} />
                  </div>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mod.tag}</span>
                </div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 5 }}>{mod.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
                  <span>Ouvrir</span>
                  <ArrowUpRight style={{ width: 8, height: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Auth Form ── */
function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const displayError = error || (urlError ? (ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default) : '')

  const switchMode = (next: 'login' | 'register') => {
    setMode(next)
    setError('')
    setSuccess('')
  }

  const handleGoogle = async () => {
    setLoadingGoogle(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription.')
        setLoading(false)
        return
      }
      const loginRes = await signIn('credentials', { email, password, redirect: false })
      if (loginRes?.ok) {
        router.push('/dashboard')
      } else {
        setSuccess('Compte créé ! Vous pouvez vous connecter.')
        setMode('login')
        setLoading(false)
      }
    } else {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) {
        router.push('/dashboard')
      } else {
        setError('Email ou mot de passe incorrect.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#080808' }}>

      {/* ── LEFT: Form ── */}
      <div className="flex flex-col w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 relative z-10" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Subtle glow top-left */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 0% 0%, ${GOLD}08, transparent 60%)` }} />

        <div className="relative flex flex-col flex-1 px-8 py-10 md:px-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-auto pb-8">
            <div style={{ width: 32, height: 32, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 17, height: 17, color: '#000' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>FinCalc</span>
          </div>

          {/* Form area */}
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            {/* Heading */}
            <div className="mb-8">
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 6 }}>
                {mode === 'login' ? 'Bienvenue' : 'Créer un compte'}
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                {mode === 'login' ? 'Connectez-vous pour accéder à vos simulations' : 'Gratuit, sans carte bancaire'}
              </p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loadingGoogle || loading}
              className="w-full flex items-center justify-center gap-2.5 transition-all"
              style={{ height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500, cursor: loadingGoogle || loading ? 'not-allowed' : 'pointer', opacity: loadingGoogle || loading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!loadingGoogle && !loading) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
            >
              {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              {mode === 'login' ? 'Continuer avec Google' : 'S\'inscrire avec Google'}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>ou par email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Nom complet</Label>
                  <Input id="name" type="text" placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Email</Label>
                <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete={mode === 'login' ? 'email' : 'new-email'} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="pr-9" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {displayError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-xs text-destructive">{displayError}</p>
                </div>
              )}
              {success && (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <p className="text-xs text-emerald-500">{success}</p>
                </div>
              )}

              <Button type="submit" className="w-full mt-1" disabled={loading || loadingGoogle} style={{ height: 42, background: GOLD, color: '#000', fontWeight: 600, border: 'none' }}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </Button>
            </form>

            {/* Switch */}
            <p className="text-center mt-5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {mode === 'login' ? (
                <>Pas encore de compte ?{' '}
                  <button onClick={() => switchMode('register')} style={{ color: GOLD, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                    S'inscrire
                  </button>
                </>
              ) : (
                <>Déjà un compte ?{' '}
                  <button onClick={() => switchMode('login')} style={{ color: GOLD, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Se connecter
                  </button>
                </>
              )}
            </p>

            {/* Tab toggle — subtle */}
            <div className="flex mt-6 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              {(['login', 'register'] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)} className="flex-1 py-2 transition-all"
                  style={{ fontSize: 12, fontWeight: 500, background: mode === m ? 'rgba(255,255,255,0.05)' : 'transparent', color: mode === m ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer' }}>
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {['CGU', 'Confidentialité', 'Mentions légales'].map((t, i) => (
              <a key={i} href={`/${t === 'CGU' ? 'cgu' : t === 'Confidentialité' ? 'politique-confidentialite' : 'mentions-legales'}`}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Dashboard Preview ── */}
      <div className="hidden lg:flex flex-1 flex-col relative overflow-hidden" style={{ background: '#050505' }}>
        {/* Gold glow top-right */}
        <div className="absolute pointer-events-none" style={{ top: '-15%', right: '-15%', width: '70%', height: '70%', background: `radial-gradient(ellipse, ${GOLD}0a, transparent 65%)` }} />
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '25%', background: 'linear-gradient(to top, #050505, transparent)' }} />

        {/* Centered preview */}
        <div className="flex-1 flex items-center justify-center px-10 py-12">
          <DashboardPreview />
        </div>

        {/* Tagline bottom */}
        <div className="relative px-12 pb-12">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            Tous vos calculs financiers en un seul endroit
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            Impôts · FI/RE · Immobilier · Budget · Investissement · Retraite
          </p>
          <div className="flex gap-5 mt-4">
            {[['9', 'Calculateurs'], ['100%', 'Gratuit'], ['Privé', 'Données locales']].map(([v, l], i) => (
              <div key={i}>
                <p style={{ fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: '-0.02em' }}>{v}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><AuthForm /></Suspense>
}
