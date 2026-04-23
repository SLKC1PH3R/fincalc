'use client';

import * as React from 'react';
import { I, type IconProps } from './icons';

export function SectionHead({
  eyebrow,
  title,
  sub,
  align = 'left',
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div className="reveal" style={{ maxWidth: 720, textAlign: align, marginLeft: align === 'center' ? 'auto' : undefined, marginRight: align === 'center' ? 'auto' : undefined }}>
      <div className="eyebrow" style={{ marginBottom: 16, justifyContent: align === 'center' ? 'center' : undefined }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: 'var(--f-serif)', fontSize: 'clamp(34px, 4vw, 54px)',
        fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em',
        color: 'var(--ink)', marginBottom: 18,
      }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.55 }}>{sub}</p>}
    </div>
  );
}

function PillarVizTrack() {
  return (
    <div style={{
      height: 100, borderRadius: 10, overflow: 'hidden',
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      position: 'relative', padding: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--f-mono)', marginBottom: 4 }}>
        <span>PATRIMOINE</span><span style={{ color: 'var(--up)' }}>+8.4%</span>
      </div>
      <svg viewBox="0 0 280 60" style={{ width: '100%', height: 60 }}>
        <path d="M0 45 C 30 40, 50 30, 80 32 S 130 20, 160 18 S 220 12, 280 8" stroke="var(--gold-deep)" strokeWidth="1.5" fill="none" />
        <path d="M0 45 C 30 40, 50 30, 80 32 S 130 20, 160 18 S 220 12, 280 8 L 280 60 L 0 60 Z" fill="var(--gold-tint)" />
      </svg>
    </div>
  );
}

function PillarVizOptimize() {
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      fontFamily: 'var(--f-mono)', fontSize: 11,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 10, marginBottom: 8 }}>
        <span>ETF · TER</span><span>IMPACT 20A</span>
      </div>
      {[
        { n: 'Amundi MSCI World', t: '0.38%', v: '-8 420 €', bad: true, best: false },
        { n: 'iShares Core World', t: '0.20%', v: '-3 210 €', bad: false, best: true },
      ].map((r, i) => (
        <div key={r.n} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: i ? '1px dashed var(--line)' : 'none' }}>
          <span style={{ color: r.best ? 'var(--up)' : 'var(--ink)' }}>{r.best && '✓ '}{r.n}</span>
          <span style={{ color: 'var(--muted)' }}>{r.t}</span>
          <span style={{ color: r.bad ? 'var(--down)' : 'var(--up)' }}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function PillarVizSim() {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      display: 'flex', flexWrap: 'wrap', gap: 6,
    }}>
      {['Intérêts composés', 'DCA', 'FI/RE', 'Impôts 2026', 'Achat vs Location', 'Prêt', 'Rentabilité', 'Retraite', '+10'].map((s, i) => (
        <span key={s} style={{
          fontSize: 11, fontFamily: 'var(--f-mono)',
          padding: '4px 9px', borderRadius: 99,
          background: i === 8 ? 'var(--ink)' : 'var(--surface)',
          color: i === 8 ? 'var(--bg)' : 'var(--ink-2)',
          border: '1px solid var(--line)',
        }}>{s}</span>
      ))}
    </div>
  );
}

function PillarVizEducate() {
  const items = [
    { t: 'Intérêts composés', d: 'Guide · 5 min' },
    { t: 'Fiscalité PEA', d: 'Fiche · 3 min' },
    { t: 'TER & frais ETF', d: 'Vidéo · 7 min' },
  ];
  return (
    <div style={{
      padding: 12, borderRadius: 10,
      background: 'var(--surface-2)', border: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 8px', borderRadius: 6,
          background: i === 0 ? 'var(--surface)' : 'transparent',
          border: i === 0 ? '1px solid var(--line)' : '1px solid transparent',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--gold-tint)', color: 'var(--gold-deep)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}><I.book size={12} /></div>
          <span style={{ fontSize: 12, color: 'var(--ink)', flex: 1 }}>{it.t}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)' }}>{it.d}</span>
        </div>
      ))}
    </div>
  );
}

export function Pillars() {
  const pillars = [
    { title: 'Suivre', sub: '01', desc: 'Vue consolidée de vos 8 enveloppes patrimoniales en temps réel — PEA, CTO, Crypto, Immobilier, AV, PER, Livrets, Cash.', Icon: I.chart, viz: <PillarVizTrack /> },
    { title: 'Optimiser', sub: '02', desc: 'Chaque ETF comparé aux meilleures alternatives du marché. Impact des frais sur 20 ans calculé automatiquement.', Icon: I.bolt, viz: <PillarVizOptimize /> },
    { title: 'Simuler', sub: '03', desc: '18 calculateurs à jour de la fiscalité française 2026. Intérêts composés, FI/RE, achat vs location, prêt, retraite.', Icon: I.cpu, viz: <PillarVizSim /> },
    { title: 'Éduquer', sub: '04', desc: 'Guides pédagogiques, glossaire, explications contextuelles à chaque simulateur. Comprendre avant d\'agir, progresser à son rythme.', Icon: I.book, viz: <PillarVizEducate /> },
  ];

  return (
    <section id="pillars" style={{ padding: '120px 0 80px' }}>
      <div className="container">
        <SectionHead
          eyebrow="Plateforme"
          title={<>Quatre piliers pour maîtriser <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>votre patrimoine.</span></>}
          sub="Simuler, optimiser, suivre, sécuriser — tout dans une seule interface pensée pour durer."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 60 }} className="pillars-grid">
          {pillars.map((p, i) => (
            <div key={p.title} className="pillar-card reveal" style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 18, padding: 28, transitionDelay: `${i * 60}ms`,
              display: 'grid', gridTemplateRows: '1fr auto', minHeight: 380,
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: 'radial-gradient(circle at 90% 10%, var(--gold-tint), transparent 55%)',
                opacity: 0, transition: 'opacity .4s',
              }} className="pillar-glow" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--line)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold-deep)',
                  }}><p.Icon size={18} /></div>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em' }}>{p.sub}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 40, fontWeight: 400, lineHeight: 1, marginBottom: 14, letterSpacing: '-0.03em' }}>{p.title}.</h3>
                <p style={{ fontSize: 14.5, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420 }}>{p.desc}</p>
              </div>
              <div style={{ position: 'relative', zIndex: 1, marginTop: 30 }}>{p.viz}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pillar-card { transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease; }
        .pillar-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--line-strong); }
        .pillar-card:hover .pillar-glow { opacity: 1; }
        @media (max-width: 760px) { .pillars-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
