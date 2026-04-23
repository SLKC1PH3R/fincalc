'use client';

import * as React from 'react';
import { SectionHead } from './Pillars';

type Region = { n: string; v: string; p: number; color: string };

export function WorldMap() {
  const regions: Region[] = [
    { n: 'Amérique du Nord', v: '182 400 €', p: 44.2, color: 'var(--gold-deep)' },
    { n: 'Europe',           v: '98 200 €',  p: 23.8, color: '#A5874C' },
    { n: 'Asie-Pacifique',   v: '74 100 €',  p: 18.0, color: '#C9A86B' },
    { n: 'Émergents',        v: '57 800 €',  p: 14.0, color: '#D9C197' },
  ];

  return (
    <section style={{ padding: '100px 0', background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48, alignItems: 'center' }} className="map-grid">
          <div>
            <SectionHead
              eyebrow="Carte monde"
              title={<>Votre exposition <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>géographique,</span> nette.</>}
              sub="Répartition automatique par pays pour chaque ETF — la vraie diversification, visible d'un coup d'œil."
            />
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {regions.map(r => (
                <div key={r.n} style={{
                  display: 'grid', gridTemplateColumns: '14px 1fr auto auto',
                  alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: r.color }} />
                  <span style={{ fontSize: 14 }}>{r.n}</span>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{r.v}</span>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--ink)', width: 52, textAlign: 'right' }}>{r.p.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            position: 'relative', aspectRatio: '16/9',
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            borderRadius: 16, overflow: 'hidden',
            padding: '24px 28px',
          }}>
            <div style={{
              position: 'absolute', top: 16, left: 20, zIndex: 2,
              fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>Exposition ETF monde</div>

            <DottedWorldMap />
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .map-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }
      `}</style>
    </section>
  );
}

function DottedWorldMap() {
  const grid = [
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000111110000011111111111111000000000011111000000111111111111110000000",
    "000011111111110001111111111111110000001111111100001111111111111111000000",
    "000111111111111111111111111111111000011111111110111111111111111111110000",
    "001111111111111111011111111111111100111111111111111111111111111111111000",
    "001111111111111110001111111111111110111111111111111111111111111111111100",
    "000111111111111110000111111111111111011111111111111011111111111111111100",
    "000011111111111110000011111101111111011011111110001011111111111011111000",
    "000001111111111100000001111100111111011001111100000001111111110001111000",
    "000000011111111000000000111110001100001011100000000001111111000000111000",
    "000000000111110000000000011100000000000001110000000001111100000000011100",
    "000000000011110000000000001100000000000011110000000000111000000000001100",
    "000000000001111000000000000000000000000011110000000000011100000000000100",
    "000000000001111100000000000000000000000111100000000011110110000001100000",
    "000000000001111110000000000000000000001111000000000001111000000011000000",
    "000000000001111111100000000000000000011111100000000001100000000000000000",
    "000000000001111111110000000000000000011111000000000001100000000000000000",
    "000000000001111111100000000000000000011111000000000000100000000000000000",
    "000000000000111111100000000000000000011110000000000000000000000000000000",
    "000000000000011110000000000000000000001110000000000000000000000000000000",
    "000000000000011100000000000000000000001100000000000000000000000000000000",
    "000000000000011000000000000000000000000100000000000000000000000000000000",
    "000000000000001000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "000000000000000000000000000000000000000000000000011111100000000000000000",
    "000000000000000000000000000000000000000000000000011111000000011000000000",
    "000000000000000000000000000000000000000000000000001110000000001000000000",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
    "011111111111111111111111111111111111111111111111111111111111111111111100",
    "011111111111111111111111111111111111111111111111111111111111111111111100",
    "000000000000000000000000000000000000000000000000000000000000000000000000",
  ];

  const COLS = 72, ROWS = 36;
  const W = 720, H = 360;
  const cw = W / COLS, ch = H / ROWS;

  const classify = (r: number, c: number): 'NA' | 'LATAM' | 'EU' | 'AF' | 'OC' | 'ASIA' | 'AN' => {
    if (r >= 33) return 'AN';
    if (c <= 22 && r <= 11) return 'NA';
    if (c <= 22 && r >= 10) return 'LATAM';
    if (c >= 33 && c <= 44 && r <= 9) return 'EU';
    if (c >= 33 && c <= 46 && r >= 10 && r <= 22) return 'AF';
    if (c >= 52 && r >= 25) return 'OC';
    return 'ASIA';
  };

  const regionFill: Record<string, string> = {
    NA: 'var(--gold-deep)', LATAM: '#A5874C', EU: '#A5874C',
    AF: '#D9C197', ASIA: '#C9A86B', OC: '#C9A86B', AN: '#D9C197',
  };
  const regionOpacity: Record<string, number> = {
    NA: 1, LATAM: 0.75, EU: 0.95, AF: 0.65, ASIA: 0.8, OC: 0.8, AN: 0.35,
  };

  const dots: Array<{ x: number; y: number; fill: string; opacity: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === '1') {
        const reg = classify(r, c);
        dots.push({ x: c * cw + cw / 2, y: r * ch + ch / 2, fill: regionFill[reg], opacity: regionOpacity[reg] });
      }
    }
  }

  const pins = [
    { c: 14, r: 9,  label: 'US',    pct: '44%' },
    { c: 37, r: 8,  label: 'EU',    pct: '24%' },
    { c: 60, r: 10, label: 'ASIE',  pct: '18%' },
    { c: 24, r: 17, label: 'LATAM', pct: '8%'  },
    { c: 60, r: 30, label: 'OCE',   pct: '6%'  },
  ].map(p => ({ ...p, x: p.c * cw + cw / 2, y: p.r * ch + ch / 2 }));

  const dotR = Math.min(cw, ch) * 0.36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: '100%', height: '100%', display: 'block' }}>
      <g stroke="var(--line)" strokeWidth="0.4" opacity="0.5">
        {[0, H * 0.25, H * 0.5, H * 0.75, H].map((y, i) => (
          <line key={`h${i}`} x1="0" y1={y} x2={W} y2={y} />
        ))}
        {[0, W * 0.25, W * 0.5, W * 0.75, W].map((x, i) => (
          <line key={`v${i}`} x1={x} y1="0" x2={x} y2={H} />
        ))}
      </g>
      <g>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={dotR} fill={d.fill} opacity={d.opacity} />
        ))}
      </g>
      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={dotR * 1.4} fill="var(--ink)" opacity="0.9" />
          <circle cx={p.x} cy={p.y} r={dotR * 1.4} fill="none" stroke="var(--ink)" strokeWidth="0.8">
            <animate attributeName="r" values={`${dotR * 1.4};${dotR * 5};${dotR * 1.4}`} dur="3.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="3.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <text
            x={p.x} y={p.y - dotR * 2.6}
            textAnchor="middle"
            fontFamily="var(--f-mono)"
            fontSize="8"
            fill="var(--ink)"
            letterSpacing="0.08em"
            style={{ fontWeight: 500 }}
          >
            {p.label} {p.pct}
          </text>
        </g>
      ))}
    </svg>
  );
}
