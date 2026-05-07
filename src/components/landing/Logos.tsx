'use client';

import * as React from 'react';

export function Logos() {
  const items = ['Finnhub', 'CoinGecko', 'BCE', 'OAT 10A', 'AMF', 'Bpifrance', 'Euronext', 'MSCI World'];
  return (
    <section style={{ padding: '32px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container" style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'nowrap' }}>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 10.5,
          color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>Données temps réel ·</div>
        <div style={{
          flex: 1, overflow: 'hidden',
          maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)',
        }}>
          <div style={{
            display: 'flex', gap: 50, width: 'max-content',
            animation: 'patrimo-marquee 48s linear infinite',
          }}>
            {[...items, ...items].map((l, i) => (
              <span key={i} style={{
                fontFamily: 'var(--f-serif)',
                fontSize: 22, color: 'var(--ink-2)', opacity: 0.6,
                whiteSpace: 'nowrap',
                fontStyle: i % 3 === 0 ? 'italic' : 'normal',
              }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes patrimo-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
