'use client';

import * as React from 'react';
import { I } from './icons';

export function DashboardMockup() {

  const points = React.useMemo(() => {
    const pts: Array<[number, number]> = [];
    const N = 60;
    for (let i = 0; i < N; i++) {
      const x = i / (N - 1);
      const y = 0.5 + 0.35 * Math.sin(x * 5 + 0.3) + 0.1 * Math.sin(x * 11 + 1.2) + x * 0.18;
      pts.push([x, Math.max(0.05, Math.min(0.95, 1 - y))]);
    }
    return pts;
  }, []);

  const path = React.useMemo(() => {
    const W = 320, H = 80;
    return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${(x * W).toFixed(1)} ${(y * H).toFixed(1)}`).join(' ');
  }, [points]);
  const areaPath = path + ` L 320 80 L 0 80 Z`;

  return (
    <div style={{
      position: 'relative',
      transform: 'perspective(2000px) rotateY(-4deg) rotateX(2deg)',
      transformStyle: 'preserve-3d',
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: '-40px -20px', zIndex: 0,
        background: 'radial-gradient(ellipse at center, var(--gold-tint-2), transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--line)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#EC6A5E' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#F4BF4F' }} />
            <span style={{ width: 10, height: 10, borderRadius: 99, background: '#62C555' }} />
          </div>
          <div style={{
            flex: 1, textAlign: 'center',
            fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)',
          }}>finance.digitalstack.cloud/dashboard</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', minHeight: 480 }}>
          <div style={{
            borderRight: '1px solid var(--line)',
            padding: '14px 0',
            display: 'flex', flexDirection: 'column', gap: 6,
            alignItems: 'center',
            background: 'var(--surface-2)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--ink)', color: 'var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Instrument Serif', serif", fontSize: 18,
              marginBottom: 8,
            }}>P<span style={{ color: 'var(--gold)', fontSize: 8, verticalAlign: 'top' }}>·</span></div>
            {[I.chart, I.wallet, I.pie, I.globe, I.cpu].map((Ico, i) => (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i === 0 ? 'var(--ink)' : 'var(--muted-2)',
                background: i === 0 ? 'var(--surface-3)' : 'transparent',
              }}><Ico size={15} /></div>
            ))}
          </div>

          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Patrimoine net</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <div className="mono" style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.035em', color: 'var(--ink)' }}>
                    412 483&nbsp;€
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, color: 'var(--up)',
                    background: 'color-mix(in srgb, var(--up) 12%, transparent)',
                    padding: '3px 8px', borderRadius: 99,
                    fontFamily: 'var(--f-mono)',
                  }}>
                    <I.arrow size={11} style={{ transform: 'rotate(-45deg)' }} /> +8.4% YTD
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['1M', '6M', 'YTD', '1A', 'Tout'].map((l, i) => (
                  <button key={l} style={{
                    fontFamily: 'var(--f-mono)', fontSize: 10,
                    padding: '5px 9px', borderRadius: 6,
                    color: i === 2 ? 'var(--ink)' : 'var(--muted)',
                    background: i === 2 ? 'var(--surface-3)' : 'transparent',
                    border: '1px solid var(--line)',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{
              position: 'relative', height: 140, marginBottom: 20,
              borderRadius: 10, overflow: 'hidden',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
            }}>
              <svg viewBox="0 0 320 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#chartGrad)" />
                <path d={path} stroke="var(--gold-deep)" strokeWidth="1.3" fill="none" />
                <circle cx={320} cy={points[points.length - 1][1] * 80} r="3" fill="var(--gold-deep)">
                  <animate attributeName="r" values="3;6;3" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'PEA', val: '148 200', d: '+12.4%', up: true },
                { label: 'Immobilier', val: '185 000', d: '+3.1%', up: true },
                { label: 'Crypto', val: '28 400', d: '-4.2%', up: false },
              ].map(c => (
                <div key={c.label} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{c.val} €</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--f-mono)', color: c.up ? 'var(--up)' : 'var(--down)' }}>{c.d}</div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 10, border: '1px solid var(--line)', overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr',
                padding: '8px 12px', fontFamily: 'var(--f-mono)', fontSize: 9,
                color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase',
                borderBottom: '1px solid var(--line)', background: 'var(--surface-2)',
              }}>
                <span>ETF</span><span>TER</span><span style={{ textAlign: 'right' }}>Perf.</span>
              </div>
              {[
                { n: 'Amundi MSCI World', ter: '0.18%', p: '+22.1%' },
                { n: 'Ishares S&P 500',   ter: '0.07%', p: '+19.8%' },
                { n: 'Lyxor CAC 40',      ter: '0.25%', p: '+11.3%' },
              ].map((r, i) => (
                <div key={r.n} style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.6fr',
                  padding: '10px 12px', fontSize: 12,
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--ink)' }}>{r.n}</span>
                  <span className="mono" style={{ color: 'var(--muted)' }}>{r.ter}</span>
                  <span className="mono" style={{ textAlign: 'right', color: 'var(--up)' }}>{r.p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating score card */}
      <div style={{
        position: 'absolute',
        top: '58%', left: -40, zIndex: 2,
        width: 180,
        background: 'var(--surface)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--line)',
        padding: 14,
        transform: 'rotate(-2deg)',
        animation: 'patrimo-float 6s ease-in-out infinite',
      }} className="hide-on-mobile">
        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Score patrimonial</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ScoreRing value={74} />
          <div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>74</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>/ 100</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes patrimo-float {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50%       { transform: rotate(-2deg) translateY(-8px); }
        }
        @media (max-width: 720px) { .hide-on-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}

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
