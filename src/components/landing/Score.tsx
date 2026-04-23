'use client';

import * as React from 'react';
import { SectionHead } from './Pillars';

export function Score() {
  const pillars = [
    { n: 'Épargne', v: 85, d: 'Taux 22% · 6 mois de dépenses' },
    { n: 'Diversification', v: 78, d: "4 classes d'actifs · 5 géo" },
    { n: 'Fiscalité', v: 72, d: 'PEA 4/5 · PER actif' },
    { n: 'Dettes', v: 62, d: 'Ratio 24% · LTV 45%' },
    { n: 'Frais', v: 68, d: 'TER moyen 0.28%' },
    { n: 'Horizon', v: 80, d: 'Allocation cohérente' },
  ];
  return (
    <section style={{ padding: '100px 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }} className="score-grid">
          <div style={{
            position: 'relative', aspectRatio: '1',
            background: 'var(--surface)', border: '1px solid var(--line)',
            borderRadius: 20, padding: 40, maxWidth: 420,
          }}>
            <BigScoreRing value={74} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Score patrimonial</div>
              <div style={{ fontFamily: 'var(--f-serif)', fontSize: 120, lineHeight: 1, color: 'var(--ink)', letterSpacing: '-0.05em' }}>74</div>
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>/ 100 · bon équilibre</div>
            </div>
          </div>
          <div>
            <SectionHead
              eyebrow="Diagnostic"
              title={<>Un score pour <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>situer</span> votre patrimoine.</>}
              sub="Six dimensions analysées. Un chiffre clair. Des recommandations concrètes pour progresser."
            />
            <div style={{ marginTop: 32, display: 'grid', gap: 8 }}>
              {pillars.map(p => (
                <div key={p.n} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 50px', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--ink)' }}>{p.n}</span>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.v}%`, background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))', borderRadius: 99 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{p.v}/100</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .score-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}

function BigScoreRing({ value }: { value: number }) {
  const r = 140, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', height: '100%' }}>
      <circle cx="160" cy="160" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
      <circle cx="160" cy="160" r={r} fill="none" stroke="var(--gold-deep)" strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform="rotate(-90 160 160)"
      />
    </svg>
  );
}
