'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, Zap } from 'lucide-react'
import { DashboardMockup } from '@/components/landing/Mockup'

/* ── Design tokens (mirrored from landing tokens.css) ── */
const BG       = '#F3EEE4'
const SURFACE  = '#FFFFFF'
const SURF2    = '#FBF7EF'
const SURF3    = '#ECE4D4'
const INK      = '#0A0A0A'
const MUTED    = '#6B6356'
const MUTED2   = '#9A907F'
const LINE     = 'rgba(10,10,10,0.08)'
const LINE_STR = 'rgba(10,10,10,0.14)'
const GOLD     = '#B07820'
const GOLD_D   = '#8B5E18'
const GOLD_S   = '#D4A24C'
const GOLD_T   = 'rgba(176,120,32,0.09)'
const GOLD_T2  = 'rgba(176,120,32,0.18)'
const F_SANS   = "'Geist', system-ui, -apple-system, sans-serif"
const F_SERIF  = "'Instrument Serif', Georgia, serif"
const F_MONO   = "'Geist Mono', ui-monospace, monospace"

const DEMO_EMAIL    = 'demo@digitalstack.cloud'
const DEMO_PASSWORD = 'demo@2026'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        'Erreur lors de la connexion Google. Réessayez.',
  OAuthCallback:      'Erreur lors de la connexion Google. Réessayez.',
  OAuthCreateAccount: 'Impossible de créer le compte Google.',
  Default:            'Une erreur est survenue. Réessayez.',
}

/* ── Helpers ── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function Logo() {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, lineHeight: 1, textDecoration: 'none' }}>
      <span style={{ fontFamily: F_SERIF, fontSize: 28, color: INK, letterSpacing: '-0.02em' }}>P</span>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: GOLD, display: 'inline-block', transform: 'translateY(-9px)' }} />
      <span style={{ fontFamily: F_SERIF, fontSize: 28, color: INK, letterSpacing: '-0.02em' }}>atrimo</span>
      <span style={{ marginLeft: 10, paddingLeft: 10, borderLeft: `1px solid ${LINE_STR}`, fontFamily: F_MONO, fontSize: 10, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.14em' }}>finance</span>
    </Link>
  )
}

/* ── Input styled for ivory palette ── */
function Field({ id, label, type, placeholder, value, onChange, required, minLength, autoComplete, showToggle, onToggle, showPw, tabIndex }: {
  id: string; label: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; required?: boolean; minLength?: number;
  autoComplete?: string; showToggle?: boolean; onToggle?: () => void; showPw?: boolean; tabIndex?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: MUTED, fontFamily: F_SANS, letterSpacing: '0.01em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={showToggle ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          required={required} minLength={minLength}
          autoComplete={autoComplete} tabIndex={tabIndex}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 42, borderRadius: 8,
            border: `1px solid ${focused ? GOLD_D : LINE_STR}`,
            background: SURFACE,
            color: INK, fontSize: 14, fontFamily: F_SANS,
            padding: showToggle ? '0 40px 0 14px' : '0 14px',
            outline: 'none',
            boxShadow: focused ? `0 0 0 3px ${GOLD_T2}` : 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        {showToggle && (
          <button type="button" onClick={onToggle} tabIndex={-1} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: MUTED2, background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0,
          }}>
            {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
          </button>
        )}
      </div>
    </div>
  )
}

function GoogleBtn({ onClick, disabled, loading, label }: { onClick: () => void; disabled: boolean; loading: boolean; label: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', height: 42, borderRadius: 8,
        border: `1px solid ${LINE_STR}`,
        background: hovered && !disabled ? SURF3 : SURF2,
        color: INK, fontSize: 14, fontWeight: 500, fontFamily: F_SANS,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: LINE }} />
      <span style={{ fontSize: 11, color: MUTED2, fontFamily: F_MONO }}>ou par email</span>
      <div style={{ flex: 1, height: 1, background: LINE }} />
    </div>
  )
}

/* ── Auth form ── */
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
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/patrimoine'
  const displayError = error || (urlError ? (ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default) : '')
  const isRegister = mode === 'register'

  const switchMode = (next: 'login' | 'register') => {
    if (next === mode) return
    setMode(next); setError(''); setSuccess('')
  }
  const handleGoogle = async () => { setLoadingGoogle(true); await signIn('google', { callbackUrl }) }
  const loginAsDemo = async () => {
    setLoading(true); setError('')
    const res = await signIn('credentials', { email: DEMO_EMAIL, password: DEMO_PASSWORD, redirect: false })
    if (res?.ok) router.push(callbackUrl)
    else { setError('Compte démo temporairement indisponible.'); setLoading(false) }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    if (mode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur lors de l'inscription."); setLoading(false); return }
      const loginRes = await signIn('credentials', { email, password, redirect: false })
      if (loginRes?.ok) router.push(callbackUrl)
      else { setSuccess('Compte créé ! Vous pouvez vous connecter.'); setMode('login'); setLoading(false) }
    } else {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) router.push(callbackUrl)
      else { setError('Email ou mot de passe incorrect.'); setLoading(false) }
    }
  }

  const faceStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: 16,
    background: SURFACE,
    border: `1px solid ${LINE_STR}`,
    padding: '28px 28px 24px',
    display: 'flex', flexDirection: 'column',
    boxShadow: `0 4px 14px ${GOLD_T}, 0 1px 3px rgba(10,10,10,0.06)`,
  }

  const loginFace = (
    <div style={{ ...faceStyle, pointerEvents: isRegister ? 'none' : 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: INK, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: F_SANS }}>Connexion</h2>
        <p style={{ fontSize: 13, color: MUTED, fontFamily: F_SANS }}>Accédez à votre tableau de bord</p>
      </div>

      <GoogleBtn onClick={handleGoogle} disabled={loadingGoogle || loading} loading={loadingGoogle} label="Continuer avec Google" />
      <Divider />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field id="login-email" label="Email" type="email" placeholder="vous@exemple.com"
          value={email} onChange={setEmail} required autoComplete="email" tabIndex={isRegister ? -1 : 0} />
        <Field id="login-password" label="Mot de passe" type="password" placeholder="••••••••"
          value={password} onChange={setPassword} required minLength={1} autoComplete="current-password"
          showToggle onToggle={() => setShowPassword(v => !v)} showPw={showPassword}
          tabIndex={isRegister ? -1 : 0} />

        {displayError && (
          <div style={{ background: 'rgba(178,59,59,0.07)', border: '1px solid rgba(178,59,59,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <p style={{ fontSize: 12, color: '#B23B3B', fontFamily: F_SANS }}>{displayError}</p>
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(31,122,74,0.07)', border: '1px solid rgba(31,122,74,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <p style={{ fontSize: 12, color: '#1F7A4A', fontFamily: F_SANS }}>{success}</p>
          </div>
        )}

        <button type="submit" disabled={loading || loadingGoogle} tabIndex={isRegister ? -1 : 0} style={{
          width: '100%', height: 42, borderRadius: 8,
          background: INK, color: BG, fontSize: 14, fontWeight: 600, fontFamily: F_SANS,
          border: 'none', cursor: loading || loadingGoogle ? 'not-allowed' : 'pointer',
          opacity: loading || loadingGoogle ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'transform .15s, box-shadow .15s',
          marginTop: 4,
        }}
          onMouseEnter={e => { if (!loading && !loadingGoogle) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(10,10,10,0.18)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
        >
          {loading && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
          Se connecter
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: MUTED, fontFamily: F_SANS }}>
        Pas encore de compte ?{' '}
        <button onClick={() => switchMode('register')} tabIndex={isRegister ? -1 : 0}
          style={{ color: GOLD_D, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F_SANS }}>
          S&apos;inscrire
        </button>
      </p>
    </div>
  )

  const registerFace = (
    <div style={{ ...faceStyle, transform: 'rotateY(180deg)', pointerEvents: isRegister ? 'auto' : 'none' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: INK, letterSpacing: '-0.02em', marginBottom: 4, fontFamily: F_SANS }}>Créer un compte</h2>
        <p style={{ fontSize: 13, color: MUTED, fontFamily: F_SANS }}>Gratuit, sans carte bancaire</p>
      </div>

      <GoogleBtn onClick={handleGoogle} disabled={loadingGoogle || loading} loading={loadingGoogle} label="S'inscrire avec Google" />
      <Divider />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field id="reg-name" label="Nom complet" type="text" placeholder="Jean Dupont"
          value={name} onChange={setName} required minLength={2} autoComplete="name"
          tabIndex={isRegister ? 0 : -1} />
        <Field id="reg-email" label="Email" type="email" placeholder="vous@exemple.com"
          value={email} onChange={setEmail} required autoComplete="new-email"
          tabIndex={isRegister ? 0 : -1} />
        <Field id="reg-password" label="Mot de passe" type="password" placeholder="Minimum 8 caractères"
          value={password} onChange={setPassword} required minLength={8} autoComplete="new-password"
          showToggle onToggle={() => setShowPassword(v => !v)} showPw={showPassword}
          tabIndex={isRegister ? 0 : -1} />

        {displayError && (
          <div style={{ background: 'rgba(178,59,59,0.07)', border: '1px solid rgba(178,59,59,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <p style={{ fontSize: 12, color: '#B23B3B', fontFamily: F_SANS }}>{displayError}</p>
          </div>
        )}

        <button type="submit" disabled={loading || loadingGoogle} tabIndex={isRegister ? 0 : -1} style={{
          width: '100%', height: 42, borderRadius: 8,
          background: INK, color: BG, fontSize: 14, fontWeight: 600, fontFamily: F_SANS,
          border: 'none', cursor: loading || loadingGoogle ? 'not-allowed' : 'pointer',
          opacity: loading || loadingGoogle ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'transform .15s, box-shadow .15s',
          marginTop: 2,
        }}
          onMouseEnter={e => { if (!loading && !loadingGoogle) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(10,10,10,0.18)' } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
        >
          {loading && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
          Créer mon compte
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: MUTED, fontFamily: F_SANS }}>
        Déjà un compte ?{' '}
        <button onClick={() => switchMode('login')} tabIndex={isRegister ? 0 : -1}
          style={{ color: GOLD_D, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F_SANS }}>
          Se connecter
        </button>
      </p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', background: BG, fontFamily: F_SANS }}>

      {/* ── LEFT: Eyebrow + Headline + Form ── */}
      <div style={{ width: '100%', maxWidth: 520, flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, borderRight: `1px solid ${LINE}` }}>

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `radial-gradient(${LINE} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 30% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 30% 40%, black, transparent)',
        }} />
        {/* Ambient gold orb */}
        <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(ellipse, ${GOLD_T2} 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, padding: '40px 44px' }}>

          {/* Logo */}
          <div style={{ marginBottom: 48 }}>
            <Logo />
          </div>

          {/* Eyebrow + Headline */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: GOLD, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: GOLD_D, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Patrimoine intelligent</span>
            </div>
            <h1 style={{ fontFamily: F_SERIF, fontSize: 'clamp(30px, 3.2vw, 44px)', color: INK, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12 }}>
              Bienvenue.<br />
              <em style={{ fontStyle: 'italic', color: GOLD_D }}>Enfin la clarté.</em>
            </h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, fontFamily: F_SANS, maxWidth: 340 }}>
              Simulateurs, tableau de bord patrimonial et fiscalité — tout en un, gratuitement.
            </p>
          </div>

          {/* Demo button */}
          <button
            onClick={loginAsDemo}
            disabled={loading || loadingGoogle}
            style={{
              width: '100%', marginBottom: 16, padding: '12px 16px',
              borderRadius: 12, cursor: loading || loadingGoogle ? 'not-allowed' : 'pointer',
              border: `1px solid ${GOLD_T2}`,
              background: GOLD_T,
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
              opacity: loading || loadingGoogle ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!loading && !loadingGoogle) { e.currentTarget.style.background = GOLD_T2; e.currentTarget.style.borderColor = `rgba(176,120,32,0.3)` } }}
            onMouseLeave={e => { e.currentTarget.style.background = GOLD_T; e.currentTarget.style.borderColor = GOLD_T2 }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 8, background: GOLD_T2, border: `1px solid rgba(176,120,32,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {loading ? <Loader2 style={{ width: 14, height: 14, color: GOLD_D, animation: 'spin 1s linear infinite' }} /> : <Zap style={{ width: 14, height: 14, color: GOLD_D }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: GOLD_D, marginBottom: 2, fontFamily: F_SANS }}>Accéder au compte démo</p>
              <p style={{ fontSize: 11, color: MUTED, fontFamily: F_MONO }}>Explorez toutes les fonctionnalités sans inscription</p>
            </div>
            <span style={{ fontSize: 14, color: GOLD_S, flexShrink: 0 }}>→</span>
          </button>

          {/* Tab toggle */}
          <div style={{
            position: 'relative', display: 'flex',
            borderRadius: 10, border: `1px solid ${LINE_STR}`,
            padding: 3, background: SURF2, marginBottom: 20,
          }}>
            <div style={{
              position: 'absolute', top: 3,
              left: isRegister ? 'calc(50% + 1.5px)' : '3px',
              width: 'calc(50% - 4.5px)', bottom: 3,
              borderRadius: 7, background: SURFACE,
              border: `1px solid ${LINE_STR}`,
              boxShadow: `0 1px 3px rgba(10,10,10,0.06)`,
              transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'none',
            }} />
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600,
                color: mode === m ? INK : MUTED,
                background: 'none', border: 'none', cursor: 'pointer',
                borderRadius: 7, position: 'relative', zIndex: 1,
                transition: 'color 0.25s', letterSpacing: '-0.01em',
                fontFamily: F_SANS,
              }}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Flip card */}
          <div style={{ perspective: '1400px' }}>
            <div style={{
              position: 'relative',
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transition: 'transform 0.65s cubic-bezier(0.45, 0, 0.15, 1)',
              transform: isRegister ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: isRegister ? 570 : 510,
            }}>
              {loginFace}
              {registerFace}
            </div>
          </div>

          {/* Footer links */}
          <div style={{ marginTop: 'auto', paddingTop: 28, display: 'flex', alignItems: 'center', gap: 20, borderTop: `1px solid ${LINE}` }}>
            {['CGU', 'Confidentialité', 'Mentions légales'].map((t, i) => (
              <a key={i}
                href={`/${t === 'CGU' ? 'cgu' : t === 'Confidentialité' ? 'politique-confidentialite' : 'mentions-legales'}`}
                style={{ fontSize: 11, color: MUTED2, textDecoration: 'none', fontFamily: F_MONO, letterSpacing: '0.05em', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = INK)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED2)}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Dashboard Mockup — sticky, full-height ── */}
      <div className="patrimo-landing login-right-panel" style={{
        flex: 1,
        position: 'sticky', top: 0,
        height: '100vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        background: BG,
      }}>

        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `radial-gradient(${LINE_STR} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }} />
        {/* Ambient orbs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '55%', height: '55%', background: `radial-gradient(ellipse, ${GOLD_T2} 0%, transparent 65%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '35%', height: '35%', background: `radial-gradient(ellipse, rgba(176,120,32,0.08) 0%, transparent 70%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />

        {/* Inner layout */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 40px 20px', height: '100%', minHeight: 0 }}>

          {/* Mockup — fills available vertical space, clipped */}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '139%', marginLeft: '-19.5%', flexShrink: 0 }}>
              <DashboardMockup />
            </div>
          </div>

          {/* Stats strip — compact */}
          <div style={{
            display: 'flex', flexShrink: 0, marginTop: 14,
            border: `1px solid ${LINE_STR}`, borderRadius: 12, overflow: 'hidden',
            background: SURFACE,
          }}>
            {[
              { val: '18', label: 'simulateurs' },
              { val: '100%', label: 'gratuit' },
              { val: '5 min', label: 'pour démarrer' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, padding: '10px 0', textAlign: 'center',
                borderRight: i < 2 ? `1px solid ${LINE}` : 'none',
              }}>
                <div style={{ fontFamily: F_SERIF, fontSize: 20, color: INK, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: F_MONO, fontSize: 8.5, color: MUTED2, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Security trust — single compact row */}
          <div style={{ flexShrink: 0, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}`, display: 'flex', gap: 20, justifyContent: 'center' }}>
            {[
              { icon: '🔒', label: 'Données chiffrées' },
              { icon: '🚫', label: 'Aucun RIB requis' },
              { icon: '🔑', label: 'OAuth Google' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11 }}>{item.icon}</span>
                <span style={{ fontSize: 10, color: MUTED2, fontFamily: F_MONO }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .login-right-panel { display: none !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><AuthForm /></Suspense>
}
