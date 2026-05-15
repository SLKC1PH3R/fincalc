'use client'
import { useEffect, useState } from 'react'

const PAPER   = '#efe7d2'
const INK     = '#15140f'
const CORAL   = '#c96a4a'
const LINE    = 'rgba(21,20,15,0.16)'
const LINE_S  = 'rgba(21,20,15,0.07)'
const F_SERIF = "'Playfair Display','Times New Roman',serif"
const F_MONO  = "'JetBrains Mono','SF Mono',Menlo,monospace"

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
    { phase: 0,   amp: 100, freq: 0.009, y0: H * 0.56, color: 'rgba(201,106,74,0.18)', sw: 1.5 },
    { phase: 2.1, amp: 145, freq: 0.007, y0: H * 0.66, color: 'rgba(21,20,15,0.05)',   sw: 1.0 },
    { phase: 3.8, amp: 70,  freq: 0.015, y0: H * 0.46, color: 'rgba(201,106,74,0.10)', sw: 0.8 },
  ] as const
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        {curves.map((c, i) => (
          <linearGradient key={i} id={`sp-lg${i}`} x1="0" y1="0" x2="0" y2="1">
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
            <path d={area} fill={`url(#sp-lg${i})`} />
            <path d={line} fill="none" stroke={c.color.replace(/[\d.]+\)$/, '0.5)')} strokeWidth={c.sw} />
          </g>
        )
      })}
    </svg>
  )
}

function CornerTick({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pts = {
    tl: '0,7 0,0 7,0', tr: '3,0 10,0 10,7',
    bl: '0,3 0,10 7,10', br: '3,10 10,10 10,3',
  }[pos]
  const style = {
    position: 'absolute' as const,
    top:    pos.startsWith('t') ? -1 : 'auto',
    bottom: pos.startsWith('b') ? -1 : 'auto',
    left:   pos.endsWith('l')   ? -1 : 'auto',
    right:  pos.endsWith('r')   ? -1 : 'auto',
  }
  return (
    <svg width={10} height={10} style={style} viewBox="0 0 10 10">
      <polyline points={pts} fill="none" stroke={INK} strokeWidth={1.2} />
    </svg>
  )
}

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('gone')

  useEffect(() => {
    if (sessionStorage.getItem('patrimo-splash')) { setPhase('gone'); return }
    sessionStorage.setItem('patrimo-splash', '1')
    setPhase('visible')
    const t1 = setTimeout(() => setPhase('fading'), 2200)
    const t2 = setTimeout(() => setPhase('gone'),   2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'gone') return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: PAPER,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F_MONO,
      opacity: phase === 'fading' ? 0 : 1,
      transition: phase === 'fading' ? 'opacity 700ms cubic-bezier(0.4,0,0.2,1)' : 'none',
      pointerEvents: phase === 'fading' ? 'none' : 'all',
    }}>
      <AnimatedCurves />

      {/* Left rail */}
      <div style={{
        position: 'absolute', left: 22, top: '50%',
        transform: 'translateY(-50%) rotate(180deg)',
        writingMode: 'vertical-rl',
        fontSize: 9, letterSpacing: '0.18em',
        color: 'rgba(21,20,15,0.28)', textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        Intelligence · Structuration · Pilotage · Confidentiel
      </div>

      {/* Right rail */}
      <div style={{
        position: 'absolute', right: 22, top: '50%',
        transform: 'translateY(-50%)',
        writingMode: 'vertical-rl',
        fontSize: 9, letterSpacing: '0.18em',
        color: 'rgba(21,20,15,0.28)', textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        Patrimo · Gestion Patrimoniale Augmentée · Paris · 2026
      </div>

      {/* Central frame */}
      <div style={{
        position: 'relative', zIndex: 1,
        border: `1px solid ${LINE}`,
        width: 580, maxWidth: 'calc(100vw - 96px)',
        background: 'rgba(239,231,210,0.65)',
        backdropFilter: 'blur(8px)',
        animation: 'sp-in 0.6s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <CornerTick pos="tl" />
        <CornerTick pos="tr" />
        <CornerTick pos="bl" />
        <CornerTick pos="br" />

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '13px 22px',
          borderBottom: `1px solid ${LINE}`,
          fontSize: 9, letterSpacing: '0.14em',
          color: 'rgba(21,20,15,0.45)', textTransform: 'uppercase',
          gap: 0,
        }}>
          <span>FIG. 01 / PTM-01</span>
          <span style={{ margin: '0 10px', color: LINE_S }}>·</span>
          <span>Planche N° 01</span>
          <div style={{ flex: 1 }} />
          <span>Free · 2026</span>
        </div>

        {/* PATRIMO display */}
        <div style={{
          padding: '48px 40px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.22em',
            color: 'rgba(21,20,15,0.35)', textTransform: 'uppercase',
            marginBottom: 28,
          }}>
            Bienvenue sur
          </div>

          <div style={{
            fontFamily: F_SERIF,
            fontStyle: 'italic',
            fontSize: 'clamp(72px, 15vw, 112px)',
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
            userSelect: 'none',
          }}>
            <span style={{ color: INK }}>PATRI</span><span style={{ color: CORAL }}>MO</span>
          </div>

          <div style={{
            marginTop: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ height: 1, width: 40, background: LINE }} />
            <span style={{
              fontSize: 9, letterSpacing: '0.18em',
              color: 'rgba(21,20,15,0.38)', textTransform: 'uppercase',
            }}>
              Gestion patrimoniale augmentée
            </span>
            <div style={{ height: 1, width: 40, background: LINE }} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '13px 22px',
          borderTop: `1px solid ${LINE}`,
          fontSize: 9, letterSpacing: '0.14em',
          color: 'rgba(21,20,15,0.40)', textTransform: 'uppercase',
        }}>
          <span>Composé par Patrimo</span>
          {/* Progress bar */}
          <div style={{ width: 80, height: 1, background: LINE, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              background: CORAL,
              animation: 'sp-bar 2.1s cubic-bezier(0.4,0,0.6,1) forwards',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sp-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
