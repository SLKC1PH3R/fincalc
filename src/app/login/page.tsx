'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   Login — Atelier Zero design system
   paper #efe7d2 · ink #15140f · coral #c96a4a
   Playfair Display · Inter Tight · JetBrains Mono
───────────────────────────────────────────────────────────── */

const PAPER   = '#efe7d2'
const INK     = '#15140f'
const INK_M   = '#5a5448'
const INK_F   = '#8b8676'
const CORAL   = '#c96a4a'
const CORAL_S = 'rgba(201,106,74,0.12)'
const CORAL_M = 'rgba(201,106,74,0.22)'
const LINE    = 'rgba(21,20,15,0.16)'
const LINE_S  = 'rgba(21,20,15,0.08)'
const F_SANS  = "'Inter Tight','Inter',system-ui,sans-serif"
const F_SERIF = "'Playfair Display','Times New Roman',serif"
const F_MONO  = "'JetBrains Mono','SF Mono',Menlo,monospace"

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

/* ── Animated sine curves (coral palette) ── */
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
    { phase: 0,   amp: 90,  freq: 0.011, y0: H * 0.58, color: 'rgba(201,106,74,0.20)', sw: 1.6 },
    { phase: 1.8, amp: 130, freq: 0.008, y0: H * 0.68, color: 'rgba(21,20,15,0.07)',   sw: 1.2 },
    { phase: 3.2, amp: 65,  freq: 0.017, y0: H * 0.48, color: 'rgba(201,106,74,0.12)', sw: 0.9 },
  ] as const
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        {curves.map((c, i) => (
          <linearGradient key={i} id={`lg${i}`} x1="0" y1="0" x2="0" y2="1">
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
            <path d={area} fill={`url(#lg${i})`} />
            <path d={line} fill="none" stroke={c.color.replace(/[\d.]+\)$/, '0.55)')} strokeWidth={c.sw} />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Field ── */
function Field({ id, label, type, placeholder, value, onChange, required, minLength, autoComplete, showToggle, onToggle, showPw }: {
  id: string; label: string; type: string; placeholder: string; value: string
  onChange: (v: string) => void; required?: boolean; minLength?: number
  autoComplete?: string; showToggle?: boolean; onToggle?: () => void; showPw?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 10, fontWeight: 600, color: INK_M, fontFamily: F_MONO, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={showToggle ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 44,
            padding: showToggle ? '0 42px 0 14px' : '0 14px',
            borderRadius: 8,
            border: `1.5px solid ${focused ? CORAL : LINE}`,
            background: focused ? 'rgba(255,252,246,0.85)' : 'rgba(255,252,246,0.55)',
            color: INK, fontSize: 13.5, fontFamily: F_SANS, outline: 'none',
            boxShadow: focused ? `0 0 0 3px ${CORAL_S}` : 'none',
            transition: 'border-color .15s, box-shadow .15s, background .15s',
          }}
        />
        {showToggle && (
          <button type="button" onClick={onToggle} tabIndex={-1} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: INK_F, background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0,
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
  { lbl: 'Patrimoine net simulé',    value: '487 320 €' },
  { lbl: 'FI/RE — années restantes', value: '14 ans'    },
  { lbl: 'PEA — projection 20 ans',  value: '347 800 €' },
]
const FEATURES = [
  { t: '18 simulateurs',     d: 'Intérêts · FIRE · IR · prêt · locatif' },
  { t: 'Score patrimonial',  d: '6 piliers · sécurité, immo, long terme' },
  { t: 'Données chiffrées',  d: 'TLS · OAuth 2.0 · zéro accès bancaire'  },
  { t: 'Vos données privées',d: 'Stockées sur votre compte · jamais revendues' },
]

/* ── Main form ── */
function AuthForm() {
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [loadingG, setLoadingG] = useState(false)
  const [proofIdx, setProofIdx] = useState(0)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const urlError     = searchParams.get('error')
  const callbackUrl  = searchParams.get('callbackUrl') || '/dashboard'
  const displayErr   = error || (urlError ? (ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default) : '')
  const isReg = mode === 'register'

  useEffect(() => {
    const t = setInterval(() => setProofIdx(i => (i + 1) % PROOFS.length), 2800)
    return () => clearInterval(t)
  }, [])

  const switchMode   = (next: 'login' | 'register') => { if (next === mode) return; setMode(next); setError(''); setSuccess('') }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes lp-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .lp-root{background:${PAPER};color:${INK};font-family:${F_SANS};min-height:100dvh;display:grid;grid-template-columns:1fr 1fr;position:relative;-webkit-font-smoothing:antialiased}
        .lp-root::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.045 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
          background-size:240px 240px;mix-blend-mode:multiply;opacity:.9}
        .lp-left{display:flex;flex-direction:column;padding:36px 56px;border-right:1px solid ${LINE};position:relative;z-index:1;animation:lp-fade .5s ease both}
        .lp-right{position:relative;overflow:hidden;padding:48px 56px;display:flex;flex-direction:column;z-index:1}
        .lp-brand{display:inline-flex;align-items:center;gap:14px;text-decoration:none;color:${INK};line-height:1}
        .lp-bmark{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid ${INK};border-radius:50%;font-family:${F_SERIF};font-style:italic;font-size:16px;color:${INK};flex-shrink:0}
        .lp-bmeta{font-family:${F_MONO};font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:${INK_F};line-height:1.35;border-left:1px solid ${LINE};padding-left:12px}
        .lp-bmeta b{display:block;color:${INK};font-weight:600}
        @media(max-width:860px){
          .lp-root{grid-template-columns:1fr}
          .lp-right{display:none}
          .lp-left{padding:28px 24px;border-right:none}
        }
        @media(max-width:480px){.lp-left{padding:22px 18px}}
      `}</style>

      <div className="lp-root">

        {/* ── LEFT: form ── */}
        <div className="lp-left">

          {/* Logo */}
          <a href="/" className="lp-brand">
            <span className="lp-bmark">P</span>
            <span className="lp-bmeta">
              <b>Patrimo</b>
              finance
            </span>
          </a>

          {/* Form area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 380, width: '100%', margin: '0 auto', position: 'relative', paddingTop: 32, paddingBottom: 24 }}>

            {/* Section label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ width: 28, height: 1, background: CORAL, display: 'block' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: CORAL }}>
                {isReg ? 'Créer un compte' : 'Connexion'}
              </span>
            </div>

            {/* Heading */}
            <h1 style={{ fontFamily: F_SERIF, fontSize: 42, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.06, color: INK, margin: '0 0 12px' }}>
              {isReg ? (
                <>Pilotez votre<br /><em style={{ fontStyle: 'italic', color: CORAL }}>patrimoine</em>.</>
              ) : (
                <>Votre espace<br /><em style={{ fontStyle: 'italic', color: CORAL }}>patrimonial</em>.</>
              )}
            </h1>
            <p style={{ fontSize: 13.5, color: INK_M, marginBottom: 28, lineHeight: 1.6, maxWidth: 320, fontFamily: F_SANS }}>
              {isReg
                ? "Gratuit, sans carte bancaire. 18 simulateurs et un score patrimonial inclus."
                : "Simulez, optimisez, suivez. Tout vous attend exactement là où vous l'avez laissé."}
            </p>

            {/* Demo shortcut */}
            <button
              onClick={loginAsDemo} disabled={loading || loadingG}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                border: `1px solid rgba(201,106,74,0.28)`,
                background: CORAL_S,
                color: INK, cursor: loading || loadingG ? 'not-allowed' : 'pointer',
                textAlign: 'left', marginBottom: 14, width: '100%',
                opacity: loading || loadingG ? 0.65 : 1,
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (!loading && !loadingG) e.currentTarget.style.background = CORAL_M }}
              onMouseLeave={e => { e.currentTarget.style.background = CORAL_S }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 7, background: CORAL_M, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {loading
                  ? <Loader2 style={{ width: 14, height: 14, color: CORAL, animation: 'spin 1s linear infinite' }} />
                  : <svg width={14} height={14} viewBox="0 0 24 24" aria-hidden>
                      <path d="M13 2 4 14h7l-1 8 9-12h-7z" stroke={CORAL} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                    </svg>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: CORAL, fontFamily: F_SANS }}>Accéder au compte démo</div>
                <div style={{ fontSize: 11, color: INK_M, marginTop: 1, fontFamily: F_SANS }}>Sans inscription · données factices</div>
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={CORAL} strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>

            {/* Tab toggle */}
            <div style={{
              position: 'relative', display: 'flex', padding: 3,
              borderRadius: 8, border: `1px solid ${LINE}`,
              background: 'rgba(21,20,15,0.04)', marginBottom: 18,
            }}>
              <div style={{
                position: 'absolute', top: 3, bottom: 3,
                left: isReg ? 'calc(50% + 1.5px)' : 3,
                width: 'calc(50% - 4.5px)', borderRadius: 6,
                background: 'rgba(255,252,246,0.90)',
                border: `1px solid ${LINE_S}`,
                boxShadow: '0 1px 4px rgba(21,20,15,0.06)',
                transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1)',
              }} />
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '8px 0', fontSize: 12.5, fontWeight: 700,
                  color: mode === m ? INK : INK_F,
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
                border: `1.5px solid ${LINE}`,
                background: 'rgba(255,252,246,0.75)',
                color: INK, fontSize: 13, fontWeight: 600, fontFamily: F_SANS,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                cursor: loadingG || loading ? 'not-allowed' : 'pointer',
                opacity: loadingG || loading ? 0.65 : 1,
                boxShadow: '0 1px 2px rgba(21,20,15,0.04)',
                transition: 'box-shadow .15s, border-color .15s', marginBottom: 14,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(21,20,15,0.09)'; e.currentTarget.style.borderColor = 'rgba(21,20,15,0.28)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(21,20,15,0.04)'; e.currentTarget.style.borderColor = LINE }}
            >
              {loadingG ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
              {isReg ? "S'inscrire avec Google" : 'Continuer avec Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: LINE_S }} />
              <span style={{ fontSize: 10, color: INK_F, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: F_MONO }}>ou par email</span>
              <div style={{ flex: 1, height: 1, background: LINE_S }} />
            </div>

            {/* Fields */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isReg && (
                <Field id="reg-name" label="Nom complet" type="text" placeholder="Jean Dupont"
                  value={name} onChange={setName} required minLength={2} autoComplete="name" />
              )}
              <Field id="login-email" label="Email" type="email" placeholder="vous@exemple.fr"
                value={email} onChange={setEmail} required autoComplete="email" />
              <Field id="login-pw" label="Mot de passe" type="password"
                placeholder={isReg ? '8 caractères minimum' : '••••••••••'}
                value={password} onChange={setPassword} required minLength={isReg ? 8 : 1}
                autoComplete={isReg ? 'new-password' : 'current-password'}
                showToggle onToggle={() => setShowPw(v => !v)} showPw={showPw} />

              {!isReg && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <a href="#" style={{ fontSize: 11.5, color: CORAL, textDecoration: 'none', fontWeight: 600, fontFamily: F_SANS }}>
                    Mot de passe oublié ?
                  </a>
                </div>
              )}

              {displayErr && (
                <div style={{ background: 'rgba(178,59,59,0.07)', border: '1px solid rgba(178,59,59,0.18)', borderRadius: 7, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#B23B3B', margin: 0, fontFamily: F_SANS }}>{displayErr}</p>
                </div>
              )}
              {success && (
                <div style={{ background: 'rgba(31,122,74,0.07)', border: '1px solid rgba(31,122,74,0.18)', borderRadius: 7, padding: '8px 12px' }}>
                  <p style={{ fontSize: 12, color: '#1F7A4A', margin: 0, fontFamily: F_SANS }}>{success}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading || loadingG} style={{
                width: '100%', height: 44, borderRadius: 8, border: 'none',
                background: INK, color: PAPER,
                fontSize: 13.5, fontWeight: 700, fontFamily: F_SANS,
                cursor: loading || loadingG ? 'not-allowed' : 'pointer',
                opacity: loading || loadingG ? 0.65 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, letterSpacing: '0.01em',
                transition: 'background .18s, transform .12s',
              }}
                onMouseEnter={e => { if (!loading && !loadingG) { e.currentTarget.style.background = CORAL; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.background = INK; e.currentTarget.style.transform = '' }}
              >
                {loading && <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />}
                {isReg ? 'Créer mon compte' : 'Se connecter'}
                {!loading && (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                )}
              </button>
            </form>

            {isReg && (
              <p style={{ fontSize: 10.5, color: INK_F, textAlign: 'center', marginTop: 14, lineHeight: 1.5, fontFamily: F_SANS }}>
                En continuant, vous acceptez nos{' '}
                <a href="/cgu" style={{ color: INK_M, textDecoration: 'underline' }}>CGU</a> et notre{' '}
                <a href="/politique-confidentialite" style={{ color: INK_M, textDecoration: 'underline' }}>politique de confidentialité</a>.
              </p>
            )}

            <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: INK_M, fontFamily: F_SANS }}>
              {isReg ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
              <button type="button" onClick={() => switchMode(isReg ? 'login' : 'register')}
                style={{ color: CORAL, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: F_SANS, fontSize: 'inherit' }}>
                {isReg ? 'Se connecter' : "S'inscrire gratuitement"}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div style={{
            paddingTop: 16, borderTop: `1px solid ${LINE_S}`,
            display: 'flex', alignItems: 'center', gap: 16,
            fontSize: 10.5, color: INK_F, fontFamily: F_MONO,
          }}>
            <span>© 2026 Patrimo Finance</span>
            <span style={{ flex: 1 }} />
            {['CGU', 'Confidentialité', 'Légal'].map(t => (
              <a key={t}
                href={`/${t === 'CGU' ? 'cgu' : t === 'Confidentialité' ? 'politique-confidentialite' : 'mentions-legales'}`}
                style={{ color: INK_F, textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = CORAL)}
                onMouseLeave={e => (e.currentTarget.style.color = INK_F)}
              >{t}</a>
            ))}
          </div>
        </div>

        {/* ── RIGHT: editorial animated panel ── */}
        <div className="lp-right">
          <AnimatedCurves />

          {/* Noise overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
            backgroundSize: '240px 240px', mixBlendMode: 'multiply', opacity: .8,
          }} />
          {/* Grid texture */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `linear-gradient(rgba(201,106,74,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(201,106,74,0.06) 1px,transparent 1px)`,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at 30% 50%, black 10%, transparent 68%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 10%, transparent 68%)',
          }} />

          {/* Masthead */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: 16, borderBottom: `1px solid ${LINE_S}`,
            position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontSize: 9.5, color: CORAL, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, fontFamily: F_MONO }}>Patrimo Quarterly · № 24</span>
            <span style={{ fontSize: 9.5, color: INK_F, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, fontFamily: F_MONO }}>Avril 2026</span>
          </div>

          {/* Hero copy */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>

            {/* Label */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ width: 28, height: 1, background: CORAL, display: 'block' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: INK_M }}>
                Le tableau de bord des particuliers exigeants
              </span>
            </div>

            <h2 style={{ fontFamily: F_SERIF, fontSize: 'clamp(36px,3.8vw,56px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: INK, margin: 0 }}>
              Une vision claire.<br />
              Des décisions{' '}
              <em style={{ fontStyle: 'italic', color: CORAL }}>éclairées</em>.
            </h2>

            {/* Rotating KPI card */}
            <div style={{
              marginTop: 36, padding: '20px 24px', borderRadius: 12,
              border: `1px solid rgba(201,106,74,0.22)`,
              background: 'rgba(239,231,210,0.72)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(21,20,15,0.07)',
            }}>
              <div style={{ fontFamily: F_MONO, fontSize: 9.5, color: INK_F, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>
                Vu sur Patrimo · cas d&apos;usage
              </div>
              <div style={{ fontFamily: F_MONO, fontSize: 10.5, color: CORAL, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10, transition: 'color 0.4s' }}>
                {proof.lbl}
              </div>
              <div style={{ fontFamily: F_SERIF, fontSize: 'clamp(34px,3.8vw,50px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, color: INK }}>
                {proof.value}
              </div>
            </div>

            {/* Features grid */}
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: CORAL, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, fontFamily: F_SANS }}>{f.t}</div>
                    <div style={{ fontSize: 10.5, color: INK_M, marginTop: 2, lineHeight: 1.5, fontFamily: F_SANS }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer mark */}
          <div style={{
            paddingTop: 14, borderTop: `1px solid ${LINE_S}`,
            display: 'flex', justifyContent: 'space-between',
            fontSize: 9.5, color: INK_F, letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: F_MONO, position: 'relative', zIndex: 1,
          }}>
            <span>finance.digitalstack.cloud</span>
            <span>v3.2 · {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} CET</span>
          </div>
        </div>

      </div>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><AuthForm /></Suspense>
}
