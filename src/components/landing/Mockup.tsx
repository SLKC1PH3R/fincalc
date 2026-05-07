'use client';

import * as React from 'react';
import Image from 'next/image';

/* ── Slides — remplace img par tes captures 1280×800 ── */
const SLIDES = [
  {
    label: 'Vue d\'ensemble',
    url:   'finance.digitalstack.cloud/dashboard',
    img:   '/dashboard-desktop.png',
  },
  {
    label: 'Simulateurs',
    url:   'finance.digitalstack.cloud/dashboard/simulateurs',
    img:   '/dashboard-desktop.png',           // ← remplace par ta capture
  },
  {
    label: 'Score patrimonial',
    url:   'finance.digitalstack.cloud/dashboard/score',
    img:   '/patrimoine-overview.png',
  },
  {
    label: 'Optimisation ETF',
    url:   'finance.digitalstack.cloud/dashboard/optimiseur-etf',
    img:   '/patrimoine-actifs.png',
  },
  {
    label: 'Enveloppes',
    url:   'finance.digitalstack.cloud/dashboard/patrimoine',
    img:   '/patrimoine-actifs.png',           // ← remplace par ta capture
  },
];

const N = SLIDES.length;

export function DashboardMockup() {
  const [active, setActive]   = React.useState(0);
  const [fading,  setFading]  = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval>>();

  const resetTimer = React.useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setActive(p => (p + 1) % N); setFading(false); }, 220);
    }, 4200);
  }, []);

  React.useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const select = (i: number) => {
    if (i === active) return;
    setFading(true);
    setTimeout(() => { setActive(i); setFading(false); }, 220);
    resetTimer();
  };

  const slide = SLIDES[active];

  return (
    <div style={{
      position: 'relative',
      transform: 'perspective(2000px) rotateY(-4deg) rotateX(2deg)',
      transformStyle: 'preserve-3d',
    }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: 'absolute', inset: '-40px -20px', zIndex: 0,
        background: 'radial-gradient(ellipse at center, var(--gold-tint-2), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* ── Feature tabs (above browser) ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 10,
        position: 'relative', zIndex: 2,
        flexWrap: 'wrap',
      }}>
        {SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            style={{
              padding: '6px 13px', borderRadius: 99,
              fontFamily: 'var(--f-mono)', fontSize: 11,
              background: i === active ? 'var(--ink)' : 'var(--surface)',
              color:      i === active ? 'var(--bg)' : 'var(--muted)',
              border:     `1px solid ${i === active ? 'transparent' : 'var(--line)'}`,
              cursor: 'pointer', letterSpacing: '0.01em',
              boxShadow: i === active ? 'var(--shadow-sm)' : 'none',
              transition: 'background .2s, color .2s, box-shadow .2s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Browser window ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)',
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--line-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}>

        {/* Chrome bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}>
          {/* Traffic lights */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#EC6A5E' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#F4BF4F' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#62C555' }} />
          </div>

          {/* URL bar */}
          <div style={{
            flex: 1, margin: '0 10px',
            background: 'var(--bg)',
            borderRadius: 6, padding: '4px 11px',
            fontFamily: 'var(--f-mono)', fontSize: 10.5,
            border: '1px solid var(--line)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'opacity .2s',
            opacity: fading ? 0.5 : 1,
          }}>
            <span style={{ color: 'var(--muted-2)' }}>https://</span>
            <span style={{ color: 'var(--ink)' }}>{slide.url}</span>
          </div>

          {/* Spacer (mirrors traffic lights) */}
          <div style={{ width: 40, flexShrink: 0 }} />
        </div>

        {/* Screenshot */}
        <div style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          overflow: 'hidden',
          background: 'var(--surface-2)',
        }}>
          <Image
            src={slide.img}
            alt={slide.label}
            fill
            style={{
              objectFit:      'cover',
              objectPosition: 'top left',
              transition:     'opacity .22s ease',
              opacity:        fading ? 0 : 1,
            }}
            quality={85}
            sizes="(max-width: 960px) 100vw, 55vw"
            priority={active === 0}
          />
        </div>

        {/* ── Bottom bar: dots + counter + progress ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '9px 14px',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              aria-label={SLIDES[i].label}
              style={{
                width:      i === active ? 20 : 5,
                height:     5,
                borderRadius: 99,
                background: i === active ? 'var(--gold-deep)' : 'var(--line-strong)',
                border:     'none',
                padding:    0,
                cursor:     'pointer',
                transition: 'width .35s cubic-bezier(.32,.72,0,1), background .2s',
              }}
            />
          ))}

          <span style={{
            marginLeft: 8,
            fontFamily: 'var(--f-mono)', fontSize: 9.5,
            color: 'var(--muted)', letterSpacing: '0.07em',
            whiteSpace: 'nowrap',
          }}>
            {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
            <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>
            {slide.label}
          </span>

          {/* Auto-advance progress bar */}
          <div style={{
            flex: 1, marginLeft: 8,
            height: 2, borderRadius: 99,
            background: 'var(--line)', overflow: 'hidden',
          }}>
            <div
              key={active}
              style={{
                height: '100%',
                background: 'var(--gold-deep)',
                borderRadius: 99,
                animation: 'mockup-progress 4.2s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mockup-progress { from { width: 0% } to { width: 100% } }
        @media (max-width: 960px) {
          /* flatten perspective on small screens */
        }
      `}</style>
    </div>
  );
}

/* ── Score ring (used elsewhere) ── */
export function ScoreRing({ value = 74 }: { value?: number }) {
  const r = 20, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width="54" height="54" viewBox="0 0 54 54">
      <circle cx="27" cy="27" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
      <circle cx="27" cy="27" r={r} fill="none" stroke="var(--gold-deep)" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 27 27)"
      />
    </svg>
  );
}
