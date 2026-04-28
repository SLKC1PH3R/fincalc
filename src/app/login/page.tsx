'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/* ── tokens ── */
const BG     = '#F3EEE4'
const SURF   = '#FFFFFF'
const SURF2  = '#FBF7EF'
const INK    = '#0A0A0A'
const MUTED  = '#6B6356'
const MUTED2 = '#9A907F'
const LINE   = 'rgba(10,10,10,0.08)'
const LINE2  = 'rgba(10,10,10,0.14)'
const GOLD   = '#B07820'
const GOLD_D = '#8B5E18'
const GOLD_T = 'rgba(176,120,32,0.08)'
const GOLD_T2= 'rgba(176,120,32,0.18)'
const F_SANS = "'Geist', system-ui, sans-serif"
const F_SERIF= "'Instrument Serif', Georgia, serif"
const F_MONO = "'Geist Mono', ui-monospace, monospace"

const DEMO_EMAIL    = 'demo@digitalstack.cloud'
const DEMO_PASSWORD = 'demo@2026'

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin:        'Erreur lors de la connexion Google. Réessayez.',
  OAuthCallback:      'Erreur lors de la connexion Google. Réessayez.',
  OAuthCreateAccount: 'Impossible de créer le compte Google.',
  Default:            'Une erreur est survenue. Réessayez.',
}

/* ── Google icon ── */
function GoogleIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ── Animated sine curves ── */
function AnimatedCurves() {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number
    const tick = () => { setT(performance.now() / 1000); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const W = 1200, H = 800
  const curves = [
    { phase: 0,   amp: 90,  freq: 0.011, y0: H * 0.58, color: 'rgba(176,120,32,0.18)', sw: 1.6 },
    { phase: 1.8, amp: 130, freq: 0.008, y0: H * 0.68, color: 'rgba(139,94,24,0.10)',  sw: 1.2 },
    { phase: 3.2, amp: 65,  freq: 0.017, y0: H * 0.48, color: 'rgba(212,162,76,0.13)', sw: 0.9 },
  ] as const
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        {curves.map((c, i) => (
          <linearGradient key={i} id={`clg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.color} />
            <stop offset="100%" stopColor={c.color.replace(/[\d.]+\)$/, '0)')} />
          </linearGradient>
        ))}
      </defs>
      {curves.map((c, i) => {
        const pts: string[] = []
        for (let x = 0; x <= W; x += 18) {
          const y = c.y0
            + Math.sin(x * c.freq + t * 0.3 + c.phase) * c.amp
            + Math.sin(x * c.freq * 2.4 + t * 0.5 + c.phase) * c.amp * 0.28
            - x * 0.07
          pts.push(`${x},${Math.max(0, Math.min(H, y))}`)
        }
        const line = `M${pts.join(' L')}`
        const area = `${line} L${W},${H} L0,${H} Z`
        return (
          <g key={i}>
            <path d={area} fill={`url(#clg${i})`} />
            <path d={line} fill="none" stroke={c.color.replace(/[\d.]+\)$/, '0.60)')} strokeWidth={c.sw} />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Field ── */
function Field({ id, label, type, placeholder, value, onChange, required, minLength, autoComplete, showToggle, onToggle, showPw, tabIndex }: {
  id: string; label: string; type: string; placeholder: string; value: string
  onChange: (v: string) => void; required?: boolean; minLength?: number
  autoComplete?: string; showToggle?: boolean; onToggle?: () => void; showPw?: boolean; tabIndex?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 10.5, fontWeight: 700, color: MUTED, fontFamily: F_MONO, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={showToggle ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          required={required} minLength={minLength}
          autoComplete={autoComplete} tabIndex={tabIndex}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 44,
            padding: showToggle ? '0 42px 0 13px' : '0 13px',
            borderRadius: 9, border: `1.5px solid ${focused ? GOLD_D : LINE2}`,
            background: 'rgba(255,255,255,0.60)', color: INK,
            fontSize: 13.5, fontFamily: F_SANS, outline: 'none',
            boxShadow: focused ? `0 0 0 3px ${GOLD_T2}` : 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
        />
        {showToggle && (
          <button type="button" onClick={onToggle} tabIndex={-1} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: MUTED2, background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d={showPw
                ? 'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 22 12c-1 2-2 3-3.5 4.4M6.5 6.5C4 8 2.5 10 2 12c2 5 6 7 10 7 2 0 3.5-.5 5-1.3'
                : 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'}
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Rotating proof KPIs ── */
const PROOFS = [
  { lbl: 'Patrimoine net simulé',  value: '487 320 €',  color: GOLD    },
  { lbl: 'FI/RE — années restantes', value: '14 ans',   color: '#C26A1F' },
  { lbl: 'PEA — projection 20 ans', value: '347 800 €', color: '#1F7A4A' },
]
const FEATURES = [
  { t: '18 simulateurs',    d: 'Intérêts · FIRE · IR · prêt · locatif' },
  { t: 'Score patrimonial', d: '6 piliers · sécurité, immo, long terme…' },
  { t: 'Données chiffrées', d: 'TLS · OAuth 2.0 · zéro accès bancaire' },
  { t: 'Vos données privées', d: 'Stockées sur votre compte · jamais revendues' },
]

/* ── Main form ── */
function AuthForm() {
  const [mode, setMode]           = useState<'login' | 'register'>('login')
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [loadingG, setLoadingG]   = useState(false)
  const [proofIdx, setProofIdx]   = useState(0)

  const router      = useRouter()
  const searchParams = useSearchParams()
  const urlError    = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard/patrimoine'
  const displayErr  = error || (urlError ? (ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default) : '')
  const isReg = mode === 'register'

  useEffect(() => {
    const t = setInterval(() => setProofIdx(i => (i + 1) % PROOFS.length), 2800)
    return () => clearInterval(t)
  }, [])

  const switchMode = (next: 'login' | 'register') => {
    if (next === mode) return
    setMode(next); setError(''); setSuccess('')
  }
  const handleGoogle = async () => { setLoadingG(true); await signIn('google', { callbackUrl }) }
  const loginAsDemo  = async () => {
    setLoading(true); setError('')
    const res = await signIn('credentials', { email: DEMO_EMAIL, password: DEMO_PASSWORD, redirect: false })
    if (res?.ok) router.push(callbackUrl)
    else { setError('Compte démo temporairement indisponible.'); setLoading(false) }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    if (isReg) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erreur lors de l'inscription."); setLoading(false); return }
      const lr = await signIn('credentials', { email, password, redirect: false })
      if (lr?.ok) router.push(callbackUrl)
      else { setSuccess('Compte créé ! Vous pouvez vous connecter.'); setMode('login'); setLoading(false) }
    } else {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) router.push(callbackUrl)
      else { setError('Email ou mot de passe incorrect.'); setLoading(false) }
    }
  }

  const proof = PROOFS[proofIdx]

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: BG, color: INK, fontFamily: F_SANS,
      fontFeatureSettings: '"ss01","cv11"',
    }}>

      {/* ── LEFT: form ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: '36px 56px',
        borderRight: `1px solid ${LINE}`,
        position: 'relative', overflow: 'hidden',
        background: BG,
      }}>
        {/* Ambient orb */}
        <div style={{
          position: 'absolute', top: '-15%', left: '-15%',
          width: 380, height: 380, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${GOLD_T2} 0%, transparent 70%)`,
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', lineHeight: 1 }}>
          <span style={{ fontFamily: F_SERIF, fontSize: 28, color: INK, letterSpacing: '-0.02em' }}>P</span>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: GOLD, display: 'inline-block', transform: 'translateY(-9px)', flexShrink: 0 }} />
          <span style={{ fontFamily: F_SERIF, fontSize: 28, color: INK, letterSpacing: '-0.02em' }}>atrimo</span>
          <span style={{ marginLeft: 10, paddingLeft: 10, borderLeft: `1px solid ${LINE2}`, fontFamily: F_MONO, fontSize: 10, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.14em', alignSelf: 'center' }}>finance</span>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 380, width: '100%', margin: '0 auto', position: 'relative' }}>

          {/* Editorial heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, fontFamily: F_MONO }}>
              {isReg ? 'Créer un compte' : 'Connexion'}
            </div>
            <h1 style={{ fontFamily: F_SERIF, fontSize: 44, fontWeight: 400, letterSpacing: '-0.035em', lineHeight: 1.04, color: INK, margin: 0 }}>
              {isReg ? (
                <>Pilotez votre <em style={{ fontStyle: 'italic', color: GOLD_D }}>patrimoine</em><span style={{ color: GOLD }}>.</span></>
              ) : (
                <>Bon retour<br /><em style={{ fontStyle: 'italic', color: GOLD_D }}>parmi nous</em><span style={{ color: GOLD }}>.</span></>
              )}
            </h1>
            <p style={{ fontSize: 13.5, color: MUTED, marginTop: 12, lineHeight: 1.55, maxWidth: 320 }}>
              {isReg ? 'Gratuit, sans carte bancaire. 18 simulateurs et un score patrimonial inclus.' : 'Reprenez vos simulations là où vous les avez laissées.'}
            </p>
          </div>

          {/* Demo shortcut */}
          <button
            onClick={loginAsDemo} disabled={loading || loadingG}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10,
              border: `1px solid ${GOLD_T2}`, background: GOLD_T,
              color: INK, cursor: loading || loadingG ? 'not-allowed' : 'pointer',
              textAlign: 'left', marginBottom: 14, width: '100%',
              opacity: loading || loadingG ? 0.7 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading && !loadingG) e.currentTarget.style.background = GOLD_T2 }}
            onMouseLeave={e => { e.currentTarget.style.background = GOLD_T }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: GOLD_T2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {loading ? <Loader2 style={{ width: 14, height: 14, color: GOLD_D, animation: 'spin 1s linear infinite' }} /> :
                <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
                  <path d="M13 2 4 14h7l-1 8 9-12h-7z" stroke={GOLD_D} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                </svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD_D }}>Accéder au compte démo</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Sans inscription, données factices</div>
            </div>
            <span style={{ color: GOLD, fontSize: 14 }}>→</span>
          </button>

          {/* Tab toggle */}
          <div style={{
            position: 'relative', display: 'flex', padding: 3,
            borderRadius: 9, border: `1px solid ${LINE2}`,
            background: 'rgba(0,0,0,0.03)', marginBottom: 18,
          }}>
            <div style={{
              position: 'absolute', top: 3, bottom: 3,
              left: isReg ? 'calc(50% + 1.5px)' : 3,
              width: 'calc(50% - 4.5px)', borderRadius: 7,
              background: SURF, border: `1px solid ${LINE2}`,
              boxShadow: '0 1px 3px rgba(10,10,10,0.06)',
              transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1)',
            }} />
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '8px 0', fontSize: 12.5, fontWeight: 700,
                color: mode === m ? INK : MUTED2,
                background: 'none', border: 'none', cursor: 'pointer',
                position: 'relative', zIndex: 1, fontFamily: F_SANS,
                transition: 'color 0.2s',
              }}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle} disabled={loadingG || loading}
            style={{
              width: '100%', height: 42, borderRadius: 8,
              border: `1.5px solid ${LINE2}`, background: SURF,
              color: INK, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              cursor: loadingG || loading ? 'not-allowed' : 'pointer',
              opacity: loadingG || loading ? 0.7 : 1,
              boxShadow: '0 1px 2px rgba(10,10,10,0.04)',
              transition: 'box-shadow 0.15s', marginBottom: 16,
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(10,10,10,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(10,10,10,0.04)' }}
          >
            {loadingG ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
            {isReg ? "S'inscrire avec Google" : 'Continuer avec Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontSize: 10, color: MUTED2, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: F_MONO }}>ou par email</span>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isReg && (
              <Field id="reg-name" label="Nom complet" type="text" placeholder="Jean Dupont"
                value={name} onChange={setName} required minLength={2} autoComplete="name" />
            )}
            <Field id="login-email" label="Email" type="email" placeholder="vous@exemple.fr"
              value={email} onChange={setEmail} required autoComplete="email" />
            <Field id="login-password" label="Mot de passe" type="password"
              placeholder={isReg ? '8 caractères minimum' : '••••••••••'}
              value={password} onChange={setPassword} required minLength={isReg ? 8 : 1}
              autoComplete={isReg ? 'new-password' : 'current-password'}
              showToggle onToggle={() => setShowPw(v => !v)} showPw={showPw} />

            {!isReg && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a href="#" style={{ fontSize: 11.5, color: GOLD_D, textDecoration: 'none', fontWeight: 600 }}>
                  Mot de passe oublié ?
                </a>
              </div>
            )}

            {displayErr && (
              <div style={{ background: 'rgba(178,59,59,0.07)', border: '1px solid rgba(178,59,59,0.20)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: 12, color: '#B23B3B', margin: 0 }}>{displayErr}</p>
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(31,122,74,0.07)', border: '1px solid rgba(31,122,74,0.20)', borderRadius: 8, padding: '8px 12px' }}>
                <p style={{ fontSize: 12, color: '#1F7A4A', margin: 0 }}>{success}</p>
              </div>
            )}

            <button type="submit" disabled={loading || loadingG} style={{
              width: '100%', height: 44, borderRadius: 9, border: 'none',
              background: `linear-gradient(135deg, ${GOLD} 0%, #D4A24C 100%)`,
              color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: loading || loadingG ? 'not-allowed' : 'pointer',
              opacity: loading || loadingG ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4, letterSpacing: '0.01em',
              boxShadow: `0 6px 20px ${GOLD_T2}`,
              transition: 'box-shadow 0.15s, transform 0.12s',
            }}
              onMouseEnter={e => { if (!loading && !loadingG) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(176,120,32,0.30)' } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 6px 20px ${GOLD_T2}` }}
            >
              {loading && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
              {isReg ? 'Créer mon compte →' : 'Se connecter →'}
            </button>
          </form>

          {isReg && (
            <p style={{ fontSize: 10.5, color: MUTED2, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
              En continuant, vous acceptez nos{' '}
              <a href="/cgu" style={{ color: MUTED }}>CGU</a> et notre{' '}
              <a href="/politique-confidentialite" style={{ color: MUTED }}>politique de confidentialité</a>.
            </p>
          )}

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 11.5, color: MUTED }}>
            {isReg ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button type="button" onClick={() => switchMode(isReg ? 'login' : 'register')}
              style={{ color: GOLD_D, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: F_SANS, fontSize: 'inherit' }}>
              {isReg ? 'Se connecter' : "S'inscrire gratuitement"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: 18, marginTop: 'auto',
          borderTop: `1px solid ${LINE}`,
          display: 'flex', alignItems: 'center', gap: 16,
          fontSize: 10.5, color: MUTED2, position: 'relative',
        }}>
          <span>© 2026 Patrimo Finance</span>
          <span style={{ flex: 1 }} />
          {['CGU', 'Confidentialité', 'Légal'].map(t => (
            <a key={t} href={`/${t === 'CGU' ? 'cgu' : t === 'Confidentialité' ? 'politique-confidentialite' : 'mentions-legales'}`}
              style={{ color: MUTED2, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = INK)}
              onMouseLeave={e => (e.currentTarget.style.color = MUTED2)}>{t}</a>
          ))}
        </div>
      </div>

      {/* ── RIGHT: editorial animated panel ── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: BG, padding: '48px 56px', display: 'flex', flexDirection: 'column' }}>
        <AnimatedCurves />

        {/* Warm orb */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-10%',
          width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${GOLD_T2} 0%, transparent 65%)`,
          filter: 'blur(70px)', pointerEvents: 'none',
        }} />
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${GOLD_T} 1px, transparent 1px), linear-gradient(90deg, ${GOLD_T} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Magazine masthead */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 18, borderBottom: `1px solid rgba(10,10,10,0.10)`,
          position: 'relative', zIndex: 1,
        }}>
          <span style={{ fontSize: 9.5, color: GOLD, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700, fontFamily: F_MONO }}>Patrimo Quarterly · № 24</span>
          <span style={{ fontSize: 9.5, color: MUTED2, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, fontFamily: F_MONO }}>Avril 2026</span>
        </div>

        {/* Hero copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, color: GOLD_D, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 18, fontFamily: F_MONO }}>
            Le tableau de bord financier des particuliers exigeants
          </div>

          <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(38px, 4vw, 58px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.03, color: INK, margin: 0 }}>
            Une vision claire.<br />
            Des décisions{' '}
            <em style={{ fontStyle: 'italic', color: GOLD }}>éclairées</em>.
          </h2>

          {/* Rotating KPI card */}
          <div style={{
            marginTop: 36, padding: '20px 24px',
            border: `1px solid rgba(176,120,32,0.30)`, borderRadius: 14,
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 24px rgba(10,10,10,0.06)',
          }}>
            <div style={{ fontSize: 10, color: MUTED2, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6, fontFamily: F_MONO }}>
              Vu sur Patrimo · cas d'usage
            </div>
            <div style={{ fontSize: 11.5, color: proof.color, letterSpacing: '0.06em', fontWeight: 700, marginBottom: 8, fontFamily: F_MONO, transition: 'color 0.4s' }}>
              {proof.lbl}
            </div>
            <div style={{ fontFamily: F_SERIF, fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, color: INK }}>
              {proof.value}
            </div>
          </div>

          {/* Features grid */}
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginTop: 7, flexShrink: 0, boxShadow: '0 0 8px rgba(176,120,32,0.35)' }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{f.t}</div>
                  <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer mark */}
        <div style={{
          paddingTop: 14, borderTop: 'rgba(10,10,10,0.09) 1px solid',
          display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: MUTED2,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
          fontFamily: F_MONO, position: 'relative', zIndex: 1,
        }}>
          <span>finance.digitalstack.cloud</span>
          <span>v3.2 · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} CET</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .login-right { display: none !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><AuthForm /></Suspense>
}
