'use client';

import * as React from 'react';

export function Stats() {
  const data = [
    { n: '3 847', l: 'Utilisateurs actifs', s: '+18% ce trimestre' },
    { n: '18', l: 'Simulateurs disponibles', s: 'Fiscalité FR 2026' },
    { n: '8', l: 'Enveloppes patrimoniales', s: 'PEA · AV · PER · Immo…' },
    { n: '0', l: 'Donnée bancaire requise', s: 'Saisie manuelle · confidentielle' },
  ];
  return (
    <section style={{ padding: '72px 0', background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        }} className="stats-grid">
          {data.map((s, i) => (
            <div key={i} className="reveal" style={{
              padding: '8px 24px',
              borderLeft: i > 0 ? '1px solid var(--line)' : 'none',
              transitionDelay: `${i * 80}ms`,
            }}>
              <div style={{
                fontFamily: 'var(--f-serif)',
                fontSize: 'clamp(48px, 5vw, 68px)',
                lineHeight: 1, letterSpacing: '-0.03em',
                color: 'var(--ink)', marginBottom: 10,
              }}>{s.n}</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>{s.s}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 780px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 40px 0 !important; }
          .stats-grid > div:nth-child(3) { border-left: none !important; }
        }
      `}</style>
    </section>
  );
}
