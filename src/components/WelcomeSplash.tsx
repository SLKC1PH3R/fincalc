'use client'
import { useState, useEffect } from 'react'

const PAPER = '#efe7d2'
const INK   = '#15140f'
const CORAL = '#c96a4a'
const LINE  = 'rgba(21,20,15,0.18)'
const F_SERIF = "'Playfair Display','Times New Roman',serif"
const F_MONO  = "'JetBrains Mono','SF Mono',Menlo,monospace"
const F_SANS  = "'Inter Tight','Inter',system-ui,sans-serif"

function AnimatedCurves() {
  const [t, setT] = useState(0)
  useEffect(() => {
    let raf: number
    const tick = () => { setT(performance.now() / 1000); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const W = 1400, H = 900
  const curves = [
    { phase: 0,   amp: 100, freq: 0.009, y0: H * 0.55, color: 'rgba(201,106,74,0.18)', sw: 1.5 },
    { phase: 2.1, amp: 145, freq: 0.007, y0: H * 0.65, color: 'rgba(21,20,15,0.06)',   sw: 1.1 },
    { phase: 3.8, amp: 70,  freq: 0.015, y0: H * 0.45, color: 'rgba(201,106,74,0.10)', sw: 0.8 },
  ] as const
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        {curves.map((c, i) => (
          <linearGradient key={i} id={`ws-lg${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.color} />
            <stop offset="100%" stopColor={c.color.replace(/[\d.]+\)$/, '0)')} />
          </linearGradient>
        ))}
      </defs>
      {curves.map((c, i) => {
        const pts: string[] = []
        for (let x = 0; x <= W; x += 20) {
          const y = c.y0
            + Math.sin(x * c.freq + t * 0.28 + c.phase) * c.amp
            + Math.sin(x * c.freq * 2.3 + t * 0.44 + c.phase) * c.amp * 0.27
            - x * 0.06
          pts.push(`${x},${Math.max(0, Math.min(H, y))}`)
        }
        const line = `M${pts.join(' L')}`
        const area = `${line} L${W},${H} L0,${H} Z`
        return (
          <g key={i}>
            <path d={area} fill={`url(#ws-lg${i})`} />
            <path d={line} fill="none" stroke={c.color.replace(/[\d.]+\)$/, '0.5)')} strokeWidth={c.sw} />
          </g>
        )
      })}
    </svg>
  )
}

const STORAGE_KEY = 'patrimo_splash_seen'

export function WelcomeSplash() {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    setLeaving(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1')
      setVisible(false)
    }, 500)
  }

  if (!visible) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: PAPER,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.5s ease',
        fontFamily: F_SANS,
      }}
    >
      <AnimatedCurves />

      {/* Side rails */}
      <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%) rotate(180deg)', writingMode: 'vertical-rl', fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.18em', color: `rgba(21,20,15,0.35)`, textTransform: 'uppercase', userSelect: 'none' }}>
        Intelligence · Structuration · Pilotage · Confidentiel
      </div>
      <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', writingMode: 'vertical-rl', fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.18em', color: `rgba(21,20,15,0.35)`, textTransform: 'uppercase', userSelect: 'none' }}>
        Patrimo · Gestion Patrimoniale Augmentée · Paris · 2026
      </div>

      {/* Central frame */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 1,
          border: `1px solid ${LINE}`,
          width: 600, maxWidth: 'calc(100vw - 80px)',
          background: `rgba(239,231,210,0.72)`,
          backdropFilter: 'blur(6px)',
        }}
      >
        {/* Corner ticks */}
        {[['0,0','4,0 0,0 0,4'],['100%,0','calc(100% - 4px),0 100%,0 100%,4px'],
          ['0,100%','4px,100% 0,100% 0,calc(100% - 4px)'],['100%,100%','calc(100% - 4px),100% 100%,100% 100%,calc(100% - 4px)']].map((_, ci) => (
          <svg key={ci} width={10} height={10} style={{ position: 'absolute',
            top: ci < 2 ? -1 : 'auto', bottom: ci >= 2 ? -1 : 'auto',
            left: ci % 2 === 0 ? -1 : 'auto', right: ci % 2 === 1 ? -1 : 'auto' }}
            viewBox="0 0 10 10">
            <polyline points={
              ci === 0 ? '0,5 0,0 5,0' :
              ci === 1 ? '5,0 10,0 10,5' :
              ci === 2 ? '0,5 0,10 5,10' :
              '5,10 10,10 10,5'
            } fill="none" stroke={INK} strokeWidth={1} />
          </svg>
        ))}

        {/* Top meta bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px',
          borderBottom: `1px solid ${LINE}`,
          fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.14em',
          color: `rgba(21,20,15,0.55)`, textTransform: 'uppercase',
        }}>
          <span>FIG. 01 / PTM-01</span>
          <span style={{ color: `rgba(21,20,15,0.30)` }}>·</span>
          <span>Planche N° 01</span>
          <div style={{ flex: 1 }} />
          <span>Free · 2026</span>
        </div>

        {/* Main PATRIMO display */}
        <div style={{ padding: '52px 40px 44px', textAlign: 'center' }}>
          <div style={{ fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.22em', color: `rgba(21,20,15,0.4)`, textTransform: 'uppercase', marginBottom: 32 }}>
            Bienvenue sur
          </div>

          <div style={{
            fontFamily: F_SERIF,
            fontStyle: 'italic',
            fontSize: 'clamp(68px, 14vw, 108px)',
            lineHeight: 0.92,
            letterSpacing: '-0.02em',
            userSelect: 'none',
          }}>
            <span style={{ color: INK }}>PATRI</span><span style={{ color: CORAL }}>MO</span>
          </div>

          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ height: 1, width: 48, background: LINE }} />
            <span style={{ fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.18em', color: `rgba(21,20,15,0.45)`, textTransform: 'uppercase' }}>
              Gestion patrimoniale augmentée
            </span>
            <div style={{ height: 1, width: 48, background: LINE }} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 24px',
          borderTop: `1px solid ${LINE}`,
        }}>
          <span style={{ fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.14em', color: `rgba(21,20,15,0.45)`, textTransform: 'uppercase' }}>
            Composé par Patrimo
          </span>
          <button
            onClick={dismiss}
            style={{
              fontFamily: F_MONO, fontSize: 9, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: INK,
              background: 'none', border: `1px solid ${LINE}`,
              padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = INK; e.currentTarget.style.color = PAPER }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = INK }}
          >
            Entrer →
          </button>
        </div>
      </div>

      {/* Click anywhere hint */}
      <div style={{
        position: 'absolute', bottom: 32,
        fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.18em',
        color: `rgba(21,20,15,0.25)`, textTransform: 'uppercase',
      }}>
        Cliquer pour continuer
      </div>
    </div>
  )
}
