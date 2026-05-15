'use client'
import { useEffect, useState } from 'react'


const PAPER   = '#efe7d2'
const INK     = '#15140f'
const CORAL   = '#c96a4a'
const LINE    = 'rgba(21,20,15,0.16)'
const LINE_S  = 'rgba(21,20,15,0.07)'
const F_SERIF = "'Playfair Display','Times New Roman',serif"
const F_MONO  = "'JetBrains Mono','SF Mono',Menlo,monospace"


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

        {/* Hero image */}
        <div style={{ position: 'relative', overflow: 'hidden', height: 'clamp(260px, 40vw, 380px)' }}>
          <img
            src="/hero.jpg"
            alt="Patrimo"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          />
          {/* Overlay gradient bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
            background: 'linear-gradient(to top, rgba(21,20,15,0.72) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          {/* PATRIMO text over image */}
          <div style={{
            position: 'absolute', bottom: 24, left: 0, right: 0,
            textAlign: 'center', userSelect: 'none',
          }}>
            <div style={{
              fontFamily: F_SERIF, fontStyle: 'italic',
              fontSize: 'clamp(56px, 12vw, 90px)',
              lineHeight: 0.9, letterSpacing: '-0.02em',
            }}>
              <span style={{ color: '#efe7d2' }}>PATRI</span><span style={{ color: CORAL }}>MO</span>
            </div>
            <div style={{
              marginTop: 10, fontSize: 9, letterSpacing: '0.2em',
              color: 'rgba(239,231,210,0.55)', textTransform: 'uppercase', fontFamily: F_MONO,
            }}>
              Gestion patrimoniale augmentée
            </div>
          </div>
          {/* HERO label top-right */}
          <div style={{
            position: 'absolute', top: 12, right: 14,
            fontFamily: F_MONO, fontSize: 8, letterSpacing: '0.18em',
            color: 'rgba(239,231,210,0.45)', textTransform: 'uppercase',
          }}>
            HERO
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
