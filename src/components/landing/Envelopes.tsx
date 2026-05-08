'use client';

import * as React from 'react';
import Image from 'next/image';
import { I } from './icons';
import { SectionHead } from './Pillars';

const ENV_LIST = [
  { n: 'PEA',           d: 'Plafond 150 k€',        v: '148 200 €', p: '+12.4%', up: true  as boolean|null, Ic: I.chart,  color: '#C4922A', img: '/PEA.png',          url: 'finance.digitalstack.cloud/dashboard/patrimoine/pea'          },
  { n: 'CTO',           d: 'Libre · Positions',      v: '62 400 €',  p: '+9.1%',  up: true  as boolean|null, Ic: I.coin,   color: '#4F6A4A', img: '/CTO.png',          url: 'finance.digitalstack.cloud/dashboard/patrimoine/cto'          },
  { n: 'Assurance Vie', d: 'Ancienneté 8A',          v: '84 500 €',  p: '+4.7%',  up: true  as boolean|null, Ic: I.shield, color: '#6B5E7E', img: '/AV.png',           url: 'finance.digitalstack.cloud/dashboard/patrimoine/av'           },
  { n: 'PER',           d: 'Économie TMI',           v: '22 000 €',  p: '+5.2%',  up: true  as boolean|null, Ic: I.tree,   color: '#4B6878', img: '/PER.png',          url: 'finance.digitalstack.cloud/dashboard/patrimoine/per'          },
  { n: 'Immobilier',    d: 'Valeur nette',           v: '185 000 €', p: '+3.1%',  up: true  as boolean|null, Ic: I.home,   color: '#8A5A3F', img: '/immobilliers.png', url: 'finance.digitalstack.cloud/dashboard/patrimoine/immobilier'   },
  { n: 'Livrets',       d: 'Livret A · LDDS · LEP', v: '32 900 €',  p: '+3.0%',  up: true  as boolean|null, Ic: I.bank,   color: '#5F5A4F', img: '/livrets.png',      url: 'finance.digitalstack.cloud/dashboard/patrimoine/livrets'      },
  { n: 'Crypto',        d: 'Via CoinGecko',          v: '28 400 €',  p: '-4.2%',  up: false as boolean|null, Ic: I.cpu,    color: '#8A6B3F', img: '/crypto.png',       url: 'finance.digitalstack.cloud/dashboard/patrimoine/crypto'       },
  { n: 'Liquidités',    d: 'Mois de dépenses',       v: '12 600 €',  p: '= 3,2 mois', up: null,              Ic: I.wallet, color: '#5A5F70', img: '/liquidites.png',   url: 'finance.digitalstack.cloud/dashboard/patrimoine/liquidites'   },
];

const N = ENV_LIST.length;

/* ── Browser-chrome carousel ── */
function EnvelopeCarousel() {
  const [active, setActive] = React.useState(0);
  const [fading, setFading] = React.useState(false);
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

  const env = ENV_LIST[active];

  return (
    <div style={{ marginTop: 64 }}>

      {/* ── Envelope tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {ENV_LIST.map((e, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: 99,
              fontFamily: 'var(--f-mono)', fontSize: 11,
              background: i === active ? 'var(--ink)' : 'var(--surface)',
              color:      i === active ? 'var(--bg)' : 'var(--muted)',
              border:     `1px solid ${i === active ? 'transparent' : 'var(--line)'}`,
              cursor: 'pointer',
              boxShadow: i === active ? 'var(--shadow-sm)' : 'none',
              transition: 'background .2s, color .2s, box-shadow .2s',
            }}
          >
            {/* Color dot */}
            <span style={{
              width: 6, height: 6, borderRadius: 99, flexShrink: 0,
              background: i === active ? e.color : e.color + '88',
            }} />
            {e.n}
          </button>
        ))}
      </div>

      {/* ── Browser window ── */}
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: '1px solid var(--line-strong)',
        boxShadow: 'var(--shadow-lg)',
        background: 'var(--surface)',
      }}>

        {/* Chrome bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#EC6A5E' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#F4BF4F' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#62C555' }} />
          </div>

          {/* URL */}
          <div style={{
            flex: 1, margin: '0 10px',
            background: 'var(--bg)',
            borderRadius: 6, padding: '4px 11px',
            fontFamily: 'var(--f-mono)', fontSize: 10.5,
            border: '1px solid var(--line)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'opacity .22s',
            opacity: fading ? 0.4 : 1,
          }}>
            <span style={{ color: 'var(--muted-2)' }}>https://</span>
            <span style={{ color: 'var(--ink)' }}>{env.url}</span>
          </div>

          {/* Active envelope badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 99, flexShrink: 0,
            background: env.color + '18',
            border: `1px solid ${env.color}44`,
            fontFamily: 'var(--f-mono)', fontSize: 10,
            color: env.color,
            transition: 'background .3s, border-color .3s, color .3s',
          }}>
            <env.Ic size={10} />
            {env.n}
          </div>
        </div>

        {/* Screenshot */}
        <div style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}>
          {/* Color stripe at top matches envelope */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: env.color, zIndex: 2, pointerEvents: 'none',
            transition: 'background .3s',
          }} />

          <Image
            src={env.img}
            alt={env.n}
            fill
            style={{
              objectFit: 'cover', objectPosition: 'top left',
              transition: 'opacity .22s ease',
              opacity: fading ? 0 : 1,
            }}
            quality={85}
            sizes="(max-width: 900px) 100vw, 70vw"
            priority={active === 0}
          />
        </div>

        {/* Bottom bar: dots + counter + progress */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '9px 14px',
          borderTop: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}>
          {ENV_LIST.map((_, i) => (
            <button
              key={i}
              onClick={() => select(i)}
              aria-label={ENV_LIST[i].n}
              style={{
                width:      i === active ? 20 : 5,
                height:     5, borderRadius: 99,
                background: i === active ? env.color : 'var(--line-strong)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width .35s cubic-bezier(.32,.72,0,1), background .3s',
              }}
            />
          ))}

          <span style={{
            marginLeft: 8, fontFamily: 'var(--f-mono)', fontSize: 9.5,
            color: 'var(--muted)', letterSpacing: '0.07em', whiteSpace: 'nowrap',
          }}>
            {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
            <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>
            {env.n}
          </span>

          {/* Auto-advance progress */}
          <div style={{ flex: 1, marginLeft: 8, height: 2, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div
              key={active}
              style={{
                height: '100%', borderRadius: 99,
                background: env.color,
                animation: 'env-progress 4.2s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`@keyframes env-progress { from { width: 0% } to { width: 100% } }`}</style>
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

        <EnvelopeCarousel />
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
