'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('gone');

  useEffect(() => {
    if (sessionStorage.getItem('patrimo-splash')) {
      setPhase('gone');
      return;
    }
    sessionStorage.setItem('patrimo-splash', '1');
    setPhase('visible');
    const t1 = setTimeout(() => setPhase('fading'), 1600);
    const t2 = setTimeout(() => setPhase('gone'), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F3EEE4',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          opacity: phase === 'fading' ? 0 : 1,
          transition: phase === 'fading' ? 'opacity 600ms cubic-bezier(0.4,0,0.2,1)' : 'none',
          pointerEvents: phase === 'fading' ? 'none' : 'all',
        }}
      >
        {/* Ambient gold orb */}
        <div style={{
          position: 'absolute', width: 480, height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(176,120,32,0.12) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div
          className="splash-logo"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            lineHeight: 1,
            animation: 'splash-in 0.7s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <span style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 52, color: '#0A0A0A', letterSpacing: '-0.02em',
          }}>P</span>

          {/* Gold dot */}
          <span style={{
            width: 9, height: 9, borderRadius: 99,
            background: '#B07820',
            display: 'inline-block',
            transform: 'translateY(-18px)',
            flexShrink: 0,
          }} />

          <span style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 52, color: '#0A0A0A', letterSpacing: '-0.02em',
          }}>atrimo</span>

          {/* Finance badge */}
          <span style={{
            marginLeft: 14, paddingLeft: 14,
            borderLeft: '1px solid rgba(10,10,10,0.18)',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11, fontWeight: 500,
            color: '#9A907F', textTransform: 'uppercase',
            letterSpacing: '0.16em',
            alignSelf: 'center',
          }}>finance</span>
        </div>

        {/* Tagline */}
        <p
          style={{
            marginTop: 20,
            fontFamily: "'Geist', system-ui, sans-serif",
            fontSize: 13, color: '#9A907F',
            letterSpacing: '0.04em',
            animation: 'splash-in 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          Votre patrimoine, piloté.
        </p>

        {/* Loader bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: 'rgba(176,120,32,0.12)',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #B07820, #D4A53A)',
            animation: 'splash-bar 1.5s cubic-bezier(0.4,0,0.2,1) forwards',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes splash-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </>
  );
}
