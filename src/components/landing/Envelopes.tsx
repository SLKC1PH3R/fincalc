'use client';

import * as React from 'react';
import Image from 'next/image';
import { I } from './icons';
import { SectionHead } from './Pillars';

const ENV_LIST = [
  { n: 'PEA',           d: 'Plafond 150 k€',        v: '148 200 €', p: '+12.4%', up: true  as boolean|null, Ic: I.chart,  color: '#A8733F', img: '/1.png'   },
  { n: 'CTO',           d: 'Libre · Positions',      v: '62 400 €',  p: '+9.1%',  up: true  as boolean|null, Ic: I.coin,   color: '#4F6A4A', img: '/2.png'   },
  { n: 'Assurance Vie', d: 'Ancienneté 8A',          v: '84 500 €',  p: '+4.7%',  up: true  as boolean|null, Ic: I.shield, color: '#6B5E7E', img: '/3.png'   },
  { n: 'PER',           d: 'Économie TMI',           v: '22 000 €',  p: '+5.2%',  up: true  as boolean|null, Ic: I.tree,   color: '#4B6878', img: '/4.png'   },
  { n: 'Immobilier',    d: 'Valeur nette',           v: '185 000 €', p: '+3.1%',  up: true  as boolean|null, Ic: I.home,   color: '#8A5A3F', img: '/5.jpeg'  },
  { n: 'Livrets',       d: 'Livret A · LDDS · LEP', v: '32 900 €',  p: '+3.0%',  up: true  as boolean|null, Ic: I.bank,   color: '#5F5A4F', img: '/6.jpeg'  },
  { n: 'Crypto',        d: 'Via CoinGecko',          v: '28 400 €',  p: '-4.2%',  up: false as boolean|null, Ic: I.cpu,    color: '#8A6B3F', img: '/7.jpeg'  },
  { n: 'Liquidités',    d: 'Mois de dépenses',       v: '12 600 €',  p: '= 3,2 mois', up: null,              Ic: I.wallet, color: '#5A5F70', img: '/8.jpeg'  },
];

/* ── 3D deck carousel ── */
function DeckCarousel() {
  const [active, setActive] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragX, setDragX] = React.useState(0);
  const startX = React.useRef(0);
  const N = ENV_LIST.length;
  const VISIBLE = 5;

  const advance = React.useCallback(() => setActive(p => (p + 1) % N), [N]);
  const retreat  = React.useCallback(() => setActive(p => (p - 1 + N) % N), [N]);

  const onDown = (clientX: number) => { startX.current = clientX; setIsDragging(true); setDragX(0); };
  const onMove = (clientX: number) => { if (isDragging) setDragX(clientX - startX.current); };
  const onUp   = (clientX: number) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragX(0);
    const delta = clientX - startX.current;
    if (delta < -50) advance();
    else if (delta > 50) retreat();
  };

  /* ordered slice: active first, then next VISIBLE-1 */
  const stack = Array.from({ length: VISIBLE }, (_, i) => (active + i) % N);

  return (
    <div style={{ marginTop: 64 }}>

      {/* eyebrow hint */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Feuilletez · glissez pour explorer
        </div>
        {/* Arrows */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { onClick: retreat, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> },
            { onClick: advance, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg> },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick} style={{
              width: 34, height: 34, borderRadius: 99,
              background: 'var(--surface)', border: '1px solid var(--line)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink)', cursor: 'pointer',
              transition: 'border-color .2s, background .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-deep)'; e.currentTarget.style.color = 'var(--gold-deep)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}
            >{btn.icon}</button>
          ))}
        </div>
      </div>

      {/* Deck stage */}
      <div
        style={{
          position: 'relative',
          height: 380,
          perspective: '1600px',
          perspectiveOrigin: '30% 50%',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onMouseDown={e => onDown(e.clientX)}
        onMouseMove={e => onMove(e.clientX)}
        onMouseUp={e => onUp(e.clientX)}
        onMouseLeave={e => onUp(e.clientX)}
        onTouchStart={e => onDown(e.touches[0].clientX)}
        onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
        onTouchEnd={e => onUp(e.changedTouches[0].clientX)}
      >
        {/* Render back→front so front card paints last */}
        {[...stack].reverse().map((envIdx, revPos) => {
          const stackPos = VISIBLE - 1 - revPos;
          const env = ENV_LIST[envIdx];
          const isTop = stackPos === 0;

          /* positional offsets: each card behind shifts right + down + back */
          const liveX  = isTop ? dragX * 0.85 : 0;
          const liveRY = isTop ? dragX * 0.018 : 0;
          const tx  = stackPos * 26 + liveX;
          const ty  = stackPos * 5;
          const tz  = -stackPos * 70;
          const ry  = -stackPos * 7 + liveRY;
          const sc  = 1 - stackPos * 0.035;
          const opacity = 1 - stackPos * 0.12;

          return (
            <div
              key={envIdx}
              style={{
                position: 'absolute',
                left: 0, top: 0,
                width: '72%',
                height: '100%',
                borderRadius: 18,
                overflow: 'hidden',
                transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${sc})`,
                transformOrigin: 'left center',
                zIndex: VISIBLE - stackPos,
                transition: isDragging && isTop
                  ? 'box-shadow .2s'
                  : 'transform .52s cubic-bezier(.32,.72,0,1), box-shadow .3s, opacity .3s',
                boxShadow: isTop
                  ? '0 28px 72px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid var(--line)',
                opacity,
              }}
              onClick={isTop && !isDragging ? advance : undefined}
            >
              <Image
                src={env.img}
                alt={env.n}
                fill
                style={{ objectFit: 'cover', objectPosition: 'top left', pointerEvents: 'none' }}
                draggable={false}
                priority={stackPos === 0}
              />

              {/* Bottom label gradient */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '48px 18px 16px',
                background: 'linear-gradient(to top, rgba(10,8,5,0.72) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: env.color + '33',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0,
                  }}><env.Ic size={11} /></div>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{env.n}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--f-mono)', marginLeft: 4 }}>{env.d}</span>
                </div>
              </div>

              {/* Color stripe at top */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: env.color, opacity: 0.9, pointerEvents: 'none',
              }} />
            </div>
          );
        })}
      </div>

      {/* Dot navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 28 }}>
        {ENV_LIST.map((e, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            title={e.n}
            style={{
              width: i === active ? 24 : 6,
              height: 6, borderRadius: 99, padding: 0, border: 'none',
              background: i === active ? 'var(--gold-deep)' : 'var(--line-strong)',
              cursor: 'pointer',
              transition: 'width .35s cubic-bezier(.32,.72,0,1), background .2s',
            }}
          />
        ))}
        <span style={{
          marginLeft: 10, fontSize: 11, fontFamily: 'var(--f-mono)',
          color: 'var(--muted)', letterSpacing: '0.06em',
        }}>{String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')} · {ENV_LIST[active].n}</span>
      </div>
    </div>
  );
}

/* ── Envelopes section ── */
export function Envelopes() {
  return (
    <section id="envelopes" style={{ padding: '100px 0', background: 'var(--bg)' }}>
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
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: e.color, opacity: 0.75,
              }} />
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
              <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>{e.v}</div>
              <div style={{
                fontSize: 12, fontFamily: 'var(--f-mono)',
                color: e.up === true ? 'var(--up)' : e.up === false ? 'var(--down)' : 'var(--muted)',
              }}>{e.p}</div>
            </div>
          ))}
        </div>

        {/* 3D deck carousel */}
        <DeckCarousel />
      </div>
      <style>{`
        .env-card { transition: transform .3s, box-shadow .3s, border-color .3s; }
        .env-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--line-strong); }
        @media (max-width: 960px) { .env-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .env-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
