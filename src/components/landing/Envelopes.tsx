'use client';

import * as React from 'react';
import Image from 'next/image';
import { I } from './icons';
import { SectionHead } from './Pillars';

const ENV_LIST = [
  { n: 'PEA',           d: 'Plafond 150 k€',        v: '148 200 €', p: '+12.4%', up: true  as boolean|null, Ic: I.chart,  color: '#C4922A', img: '/PEA.png'          },
  { n: 'CTO',           d: 'Libre · Positions',      v: '62 400 €',  p: '+9.1%',  up: true  as boolean|null, Ic: I.coin,   color: '#4F6A4A', img: '/CTO.png'          },
  { n: 'Assurance Vie', d: 'Ancienneté 8A',          v: '84 500 €',  p: '+4.7%',  up: true  as boolean|null, Ic: I.shield, color: '#6B5E7E', img: '/AV.png'           },
  { n: 'PER',           d: 'Économie TMI',           v: '22 000 €',  p: '+5.2%',  up: true  as boolean|null, Ic: I.tree,   color: '#4B6878', img: '/PER.png'          },
  { n: 'Immobilier',    d: 'Valeur nette',           v: '185 000 €', p: '+3.1%',  up: true  as boolean|null, Ic: I.home,   color: '#8A5A3F', img: '/immobilliers.png' },
  { n: 'Livrets',       d: 'Livret A · LDDS · LEP', v: '32 900 €',  p: '+3.0%',  up: true  as boolean|null, Ic: I.bank,   color: '#5F5A4F', img: '/livrets.png'      },
  { n: 'Crypto',        d: 'Via CoinGecko',          v: '28 400 €',  p: '-4.2%',  up: false as boolean|null, Ic: I.cpu,    color: '#8A6B3F', img: '/crypto.png'       },
  { n: 'Liquidités',    d: 'Mois de dépenses',       v: '12 600 €',  p: '= 3,2 mois', up: null,              Ic: I.wallet, color: '#5A5F70', img: '/liquidites.png'   },
];

/* ── Coverflow 3D carousel ── */
function CoverflowCarousel() {
  const N = ENV_LIST.length;
  const [active, setActive] = React.useState(0);
  const [drag, setDrag] = React.useState(0);      // fractional offset (-1 to +1)
  const dragging = React.useRef(false);
  const startX  = React.useRef(0);
  const DRAG_SCALE = 520;                          // px per card-unit

  /* float offset of card i from center (accounts for live drag) */
  const getOffset = (i: number): number => {
    let off = i - active;
    if (off >  N / 2) off -= N;
    if (off < -N / 2) off += N;
    return off + drag;                             // drag shifts all cards live
  };

  /* continuous coverflow transform from a float offset */
  const cardStyle = (floatOff: number): React.CSSProperties | null => {
    const abs = Math.abs(floatOff);
    if (abs > 2.65) return null;                   // hidden entirely

    const rotY    = floatOff * 52;                 // deg — rotates away from viewer
    const tx      = floatOff * 54;                 // % of card width — lateral shift
    const scale   = 1 - Math.min(abs, 1) * 0.18 - Math.max(abs - 1, 0) * 0.10;
    const opacity = 1 - Math.min(abs, 1) * 0.28 - Math.max(abs - 1, 0) * 0.18;
    const zIndex  = Math.round(30 - abs * 8);
    const blur    = Math.max(0, abs - 0.5) * 0.8;

    return {
      transform: `translateX(${tx}%) rotateY(${rotY}deg) scale(${scale})`,
      opacity,
      zIndex,
      filter:    blur > 0 ? `blur(${blur.toFixed(1)}px)` : 'none',
      transition: dragging.current
        ? 'none'
        : 'transform .55s cubic-bezier(.32,.72,0,1), opacity .4s ease, filter .4s ease',
    };
  };

  /* pointer handlers */
  const onDown = (x: number) => { dragging.current = true; startX.current = x; };
  const onMove = (x: number) => {
    if (!dragging.current) return;
    setDrag(Math.max(-1, Math.min(1, (x - startX.current) / DRAG_SCALE)));
  };
  const onUp = (x: number) => {
    if (!dragging.current) return;
    dragging.current = false;
    const d = (x - startX.current) / DRAG_SCALE;
    setDrag(0);
    if (d < -0.22) setActive(p => (p + 1) % N);
    else if (d > 0.22) setActive(p => (p - 1 + N) % N);
  };

  const currentEnv = ENV_LIST[active];

  return (
    <div style={{ marginTop: 72, paddingBottom: 8 }}>

      {/* ── Stage ── */}
      <div
        style={{
          position: 'relative',
          height: 320,
          perspective: '1400px',
          perspectiveOrigin: '50% 50%',
          overflow: 'hidden',                      // clip the extreme cards
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onMouseDown={e  => onDown(e.clientX)}
        onMouseMove={e  => onMove(e.clientX)}
        onMouseUp={e    => onUp(e.clientX)}
        onMouseLeave={e => onUp(e.clientX)}
        onTouchStart={e => onDown(e.touches[0].clientX)}
        onTouchMove={e  => { e.preventDefault(); onMove(e.touches[0].clientX); }}
        onTouchEnd={e   => onUp(e.changedTouches[0].clientX)}
      >
        {ENV_LIST.map((env, i) => {
          const floatOff = getOffset(i);
          const st = cardStyle(floatOff);
          if (!st) return null;

          const isCenter = Math.abs(floatOff) < 0.5;

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: 460,
                height: 300,
                marginLeft: -230,
                borderRadius: 18,
                overflow: 'hidden',
                boxShadow: isCenter
                  ? '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.14)'
                  : '0 8px 24px rgba(0,0,0,0.10)',
                border: isCenter
                  ? `1px solid ${currentEnv.color}44`
                  : '1px solid var(--line)',
                transformOrigin: 'center center',
                ...st,
              }}
              onClick={() => {
                if (!dragging.current && Math.abs(floatOff) > 0.4) {
                  floatOff < 0 ? setActive(p => (p - 1 + N) % N) : setActive(p => (p + 1) % N);
                }
              }}
            >
              <Image
                src={env.img}
                alt={env.n}
                fill
                style={{ objectFit: 'cover', objectPosition: 'top', pointerEvents: 'none' }}
                draggable={false}
                priority={i === active}
              />

              {/* color stripe */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: env.color, opacity: 0.9, pointerEvents: 'none',
              }} />

              {/* bottom label — only on center */}
              {isCenter && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '48px 18px 16px',
                  background: 'linear-gradient(to top, rgba(10,8,5,0.75) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: env.color + '40',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', flexShrink: 0,
                    }}><env.Ic size={11} /></div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{env.n}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--f-mono)', marginLeft: 2 }}>{env.d}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Aura glow behind center card */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -60, left: '50%',
            transform: 'translateX(-50%)',
            width: 460, height: 200,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${currentEnv.color}38 0%, transparent 70%)`,
            filter: 'blur(32px)',
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'background .6s ease',
          }}
        />
      </div>

      {/* ── Dots + counter ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 28, justifyContent: 'center' }}>
        {ENV_LIST.map((e, i) => (
          <button
            key={i}
            onClick={() => { setDrag(0); setActive(i); }}
            title={e.n}
            style={{
              width: i === active ? 22 : 6,
              height: 6, borderRadius: 99,
              padding: 0, border: 'none',
              background: i === active ? currentEnv.color : 'var(--line-strong)',
              cursor: 'pointer',
              transition: 'width .35s cubic-bezier(.32,.72,0,1), background .4s',
            }}
          />
        ))}
        <span style={{
          marginLeft: 12, fontSize: 11, fontFamily: 'var(--f-mono)',
          color: 'var(--muted)', letterSpacing: '0.06em',
        }}>
          {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {currentEnv.n}
        </span>
      </div>

      {/* ── Arrow navigation ── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
        {[
          { dir: -1, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> },
          { dir:  1, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg> },
        ].map(({ dir, icon }) => (
          <button
            key={dir}
            onClick={() => setActive(p => (p + dir + N) % N)}
            style={{
              width: 38, height: 38, borderRadius: 99,
              background: 'var(--surface)', border: '1px solid var(--line)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', cursor: 'pointer',
              transition: 'border-color .2s, color .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = currentEnv.color; e.currentTarget.style.color = currentEnv.color; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >{icon}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Envelopes section ── */
export function Envelopes() {
  return (
    <section id="envelopes" style={{ padding: '100px 0 120px', background: 'var(--bg)' }}>
      <div className="container">
        <SectionHead
          eyebrow="8 enveloppes"
          title={<>Toutes vos enveloppes, <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>un seul regard.</span></>}
          sub="Chaque type d'actif dispose de sa vue dédiée : plafonds, fiscalité, performance, optimisation."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 48 }} className="env-grid">
          {ENV_LIST.map((e, i) => (
            <div key={e.n} className="env-card reveal" style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: 20,
              position: 'relative', overflow: 'hidden',
              transitionDelay: `${i * 40}ms`,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: e.color, opacity: 0.75 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, marginTop: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: e.color,
                }}><e.Ic size={15} /></div>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{e.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>{e.d}</div>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4, fontFamily: 'var(--f-mono)' }}>{e.v}</div>
              <div style={{
                fontSize: 12, fontFamily: 'var(--f-mono)',
                color: e.up === true ? 'var(--up)' : e.up === false ? 'var(--down)' : 'var(--muted)',
              }}>{e.p}</div>
            </div>
          ))}
        </div>

        <CoverflowCarousel />
      </div>
      <style>{`
        .env-card { transition: transform .3s, box-shadow .3s, border-color .3s; cursor: pointer; }
        .env-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--line-strong); }
        @media (max-width: 960px) { .env-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .env-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
