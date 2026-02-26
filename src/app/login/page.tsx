'use client'
import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TrendingUp, Loader2, Eye, EyeOff } from 'lucide-react'

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

function DashboardPreview() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '82%', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 32px 64px rgba(0,0,0,0.8)' }}>
        <div style={{ background: '#141414', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
          <div style={{ flex: 1, margin: '0 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>fire.digitalstack.cloud/dashboard</span>
          </div>
        </div>
        <Image src="/dashboard-desktop.png" alt="Dashboard FinCalc" width={1200} height={750} style={{ display: 'block', width: '100%', height: 'auto' }} priority />
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: -20, width: '26%', borderRadius: 22, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 48px rgba(0,0,0,0.9)', background: '#000' }}>
        <div style={{ background: '#111', height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 5, background: '#000', borderRadius: 3 }} />
        </div>
        <Image src="/dashboard-mobile.png" alt="Dashboard mobile FinCalc" width={390} height={844} style={{ display: 'block', width: '100%', height: 'auto' }} priority />
        <div style={{ background: '#111', height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  )
}

/* ── Shared form pieces ── */
function GoogleBtn({ onClick, disabled, loading, label }: { onClick: () => void; disabled: boolean; loading: boolean; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', height: 42, borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.12)',
        background: hovered && !disabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'background 0.15s',
      }}
    >
      {loading ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>ou par email</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
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

  const isRegister = mode === 'register'

  const switchMode = (next: 'login' | 'register') => {
    if (next === mode) return
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

  /* ── Card face shared styles ── */
  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 16,
    background: 'linear-gradient(160deg, #111 0%, #0d0d0d 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '28px 28px 24px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
  }

  /* ── Login face ── */
  const loginFace = (
    <div style={{ ...faceStyle, pointerEvents: isRegister ? 'none' : 'auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 5 }}>Bienvenue</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>Connectez-vous pour accéder à vos simulations</p>
      </div>

      <GoogleBtn onClick={handleGoogle} disabled={loadingGoogle || loading} loading={loadingGoogle} label="Continuer avec Google" />
      <Divider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Email</Label>
          <Input id="login-email" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" tabIndex={isRegister ? -1 : 0} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Mot de passe</Label>
          <div className="relative">
            <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={1} autoComplete="current-password" className="pr-9" tabIndex={isRegister ? -1 : 0} />
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

        <Button type="submit" className="w-full mt-1" disabled={loading || loadingGoogle} tabIndex={isRegister ? -1 : 0} style={{ height: 42, background: GOLD, color: '#000', fontWeight: 600, border: 'none' }}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Se connecter
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        Pas encore de compte ?{' '}
        <button onClick={() => switchMode('register')} tabIndex={isRegister ? -1 : 0} style={{ color: GOLD, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
          S&apos;inscrire
        </button>
      </p>
    </div>
  )

  /* ── Register face ── */
  const registerFace = (
    <div style={{ ...faceStyle, transform: 'rotateY(180deg)', pointerEvents: isRegister ? 'auto' : 'none' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', marginBottom: 5 }}>Créer un compte</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>Gratuit, sans carte bancaire</p>
      </div>

      <GoogleBtn onClick={handleGoogle} disabled={loadingGoogle || loading} loading={loadingGoogle} label="S'inscrire avec Google" />
      <Divider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Nom complet</Label>
          <Input id="reg-name" type="text" placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="name" tabIndex={isRegister ? 0 : -1} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Email</Label>
          <Input id="reg-email" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="new-email" tabIndex={isRegister ? 0 : -1} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Mot de passe</Label>
          <div className="relative">
            <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 caractères" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="pr-9" tabIndex={isRegister ? 0 : -1} />
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

        <Button type="submit" className="w-full mt-1" disabled={loading || loadingGoogle} tabIndex={isRegister ? 0 : -1} style={{ height: 42, background: GOLD, color: '#000', fontWeight: 600, border: 'none' }}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Créer mon compte
        </Button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        Déjà un compte ?{' '}
        <button onClick={() => switchMode('login')} tabIndex={isRegister ? 0 : -1} style={{ color: GOLD, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
          Se connecter
        </button>
      </p>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#080808' }}>

      {/* ── LEFT: Form ── */}
      <div className="flex flex-col w-full lg:w-1/2 flex-shrink-0 relative z-10" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
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
          <div className="flex-1 flex flex-col justify-center">
            <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>

              {/* ── Tab toggle — the flip trigger ── */}
              <div style={{
                position: 'relative',
                display: 'flex',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 3,
                background: 'rgba(255,255,255,0.02)',
                marginBottom: 20,
              }}>
                {/* Sliding pill */}
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: isRegister ? 'calc(50% + 1.5px)' : '3px',
                  width: 'calc(50% - 4.5px)',
                  bottom: 3,
                  borderRadius: 7,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'none',
                }} />
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600,
                      color: mode === m ? '#fff' : 'rgba(255,255,255,0.3)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderRadius: 7, position: 'relative', zIndex: 1,
                      transition: 'color 0.25s',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {m === 'login' ? 'Connexion' : 'Inscription'}
                  </button>
                ))}
              </div>

              {/* ── 3D flip card ── */}
              <div style={{ perspective: '1400px' }}>
                <div style={{
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  WebkitTransformStyle: 'preserve-3d',
                  transition: 'transform 0.65s cubic-bezier(0.45, 0, 0.15, 1)',
                  transform: isRegister ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: 480,
                }}>
                  {loginFace}
                  {registerFace}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 flex items-center gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {['CGU', 'Confidentialité', 'Mentions légales'].map((t, i) => (
              <a key={i}
                href={`/${t === 'CGU' ? 'cgu' : t === 'Confidentialité' ? 'politique-confidentialite' : 'mentions-legales'}`}
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
        <div className="absolute pointer-events-none" style={{ top: '-15%', right: '-15%', width: '70%', height: '70%', background: `radial-gradient(ellipse, ${GOLD}0a, transparent 65%)` }} />
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '25%', background: 'linear-gradient(to top, #050505, transparent)' }} />
        <div className="flex-1 flex items-center justify-center px-8 py-12" style={{ minHeight: 0 }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <DashboardPreview />
          </div>
        </div>
        <div className="relative px-12 pb-12">
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 14 }}>
            Sécurité &amp; confidentialité
          </p>
          <div className="space-y-3">
            {[
              { title: 'Vos données sont chiffrées', desc: 'Toutes les transmissions sont sécurisées via HTTPS/TLS.' },
              { title: 'Aucune donnée bancaire requise', desc: 'Aucun RIB, aucun accès à vos comptes. Zéro risque.' },
              { title: 'Connexion sécurisée via Google', desc: 'OAuth 2.0 — vos identifiants ne transitent jamais par FinCalc.' },
              { title: 'Vos simulations restent privées', desc: 'Stockées sur votre compte uniquement. Jamais partagées ni revendues.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 15, height: 15, borderRadius: '50%', background: `${GOLD}18`, border: `1px solid ${GOLD}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 1 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
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
