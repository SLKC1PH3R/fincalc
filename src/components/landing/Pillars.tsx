'use client';

import * as React from 'react';
import { I } from './icons';

export function SectionHead({
  eyebrow, title, sub, align = 'left',
}: {
  eyebrow: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; align?: 'left' | 'center' | 'right';
}) {
  return (
    <div className="reveal" style={{ maxWidth: 720, textAlign: align, marginLeft: align === 'center' ? 'auto' : undefined, marginRight: align === 'center' ? 'auto' : undefined }}>
      <div className="eyebrow" style={{ marginBottom: 16, justifyContent: align === 'center' ? 'center' : undefined }}>{eyebrow}</div>
      <h2 style={{ fontFamily: 'var(--f-serif)', fontSize: 'clamp(34px, 4vw, 54px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: 18 }}>{title}</h2>
      {sub && <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.55 }}>{sub}</p>}
    </div>
  );
}

/* ── Viz widgets (verso) ───────────────────────────────────────────────────── */

function PillarVizTrack() {
  return (
    <div style={{ height: 100, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--line)', position: 'relative', padding: 12 }}>
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
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
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
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {['Intérêts composés', 'DCA', 'FI/RE', 'Impôts 2026', 'Achat vs Location', 'Prêt', 'Rentabilité', 'Retraite', '+10'].map((s, i) => (
        <span key={s} style={{ fontSize: 11, fontFamily: 'var(--f-mono)', padding: '4px 9px', borderRadius: 99, background: i === 8 ? 'var(--ink)' : 'var(--surface)', color: i === 8 ? 'var(--bg)' : 'var(--ink-2)', border: '1px solid var(--line)' }}>{s}</span>
      ))}
    </div>
  );
}

function PillarVizEducate() {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[{ t: 'Intérêts composés', d: 'Guide · 5 min' }, { t: 'Fiscalité PEA', d: 'Fiche · 3 min' }, { t: 'TER & frais ETF', d: 'Vidéo · 7 min' }].map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, background: i === 0 ? 'var(--surface)' : 'transparent', border: i === 0 ? '1px solid var(--line)' : '1px solid transparent' }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--gold-tint)', color: 'var(--gold-deep)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I.book size={12} /></div>
          <span style={{ fontSize: 12, color: 'var(--ink)', flex: 1 }}>{it.t}</span>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted)' }}>{it.d}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

export function Pillars() {
  const pillars = [
    { title: 'Suivre',    sub: '01', kpi: '+8,4%',    tagline: '8 enveloppes · temps réel',   Icon: I.chart, desc: 'Vue consolidée de vos 8 enveloppes patrimoniales en temps réel — PEA, CTO, Crypto, Immobilier, AV, PER, Livrets, Cash.', viz: <PillarVizTrack /> },
    { title: 'Optimiser', sub: '02', kpi: '-8 420 €',  tagline: 'ETF · TER · impact 20 ans',  Icon: I.bolt,  desc: 'Chaque ETF comparé aux meilleures alternatives du marché. Impact des frais sur 20 ans calculé automatiquement.',        viz: <PillarVizOptimize /> },
    { title: 'Simuler',   sub: '03', kpi: '×18',       tagline: 'Calculateurs · Fiscalité 2026', Icon: I.cpu,   desc: '18 calculateurs à jour de la fiscalité française 2026. Intérêts composés, FI/RE, achat vs location, prêt, retraite.',  viz: <PillarVizSim /> },
    { title: 'Éduquer',   sub: '04', kpi: '5 min',     tagline: 'Guides · Fiches · Vidéos',   Icon: I.book,  desc: 'Guides pédagogiques, glossaire, explications contextuelles à chaque simulateur. Comprendre avant d\'agir.',              viz: <PillarVizEducate /> },
  ];

  /* tilt JS — appliqué sur .pillar-card (pas sur .pillar-flip) */
  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const MAX = 8;
    card.style.transform = `rotateX(${-(y - .5) * MAX * 2}deg) rotateY(${(x - .5) * MAX * 2}deg) scale3d(1.015,1.015,1.015)`;
    card.style.transition = 'transform .08s linear';
    const shine = card.querySelector<HTMLElement>('.p-shine');
    if (shine) shine.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.06) 0%, transparent 55%)`;
  };

  const resetTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = '';
    card.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
    const shine = card.querySelector<HTMLElement>('.p-shine');
    if (shine) shine.style.background = 'transparent';
  };

  return (
    <section id="pillars" style={{ padding: '120px 0 80px' }}>
      <div className="container">
        <SectionHead
          eyebrow="Plateforme"
          title={<>Quatre piliers pour maîtriser <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>votre patrimoine.</span></>}
          sub="Simuler, optimiser, suivre, sécuriser — tout dans une seule interface pensée pour durer."
        />

        {/* perspective sur la grille (parent statique) */}
        <div className="pillars-grid reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 60, perspective: '1200px' }}>
          {pillars.map((p, i) => (
            /* .pillar-card : tilt JS ici, transform-style preserve-3d */
            <div
              key={p.title}
              className="pillar-card"
              onMouseMove={tilt}
              onMouseLeave={resetTilt}
              style={{ height: 430, transformStyle: 'preserve-3d', willChange: 'transform', transitionDelay: `${i * 60}ms`, cursor: 'pointer' }}
            >
              {/* .pillar-flip : flip CSS ici (:hover → rotateY 180deg) */}
              <div className="pillar-flip" style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform .68s cubic-bezier(.4,0,.2,1)' }}>

                {/* ── RECTO ── */}
                <div className="p-face p-front" style={{
                  position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 32,
                }}>
                  {/* Shine cursor */}
                  <div className="p-shine" style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', transition: 'background .12s', zIndex: 2 }} />
                  {/* Glow dorée */}
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', background: 'radial-gradient(circle at 85% 12%, var(--gold-tint), transparent 52%)', zIndex: 1 }} />

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-deep)' }}>
                      <p.Icon size={18} />
                    </div>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em' }}>{p.sub}</span>
                  </div>

                  {/* Center hero */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, flex: 1, justifyContent: 'center', position: 'relative', zIndex: 3 }}>
                    <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 52, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.035em', margin: 0, color: 'var(--ink)' }}>
                      {p.title}<span style={{ color: 'var(--gold-deep)' }}>.</span>
                    </h3>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--gold-deep)', lineHeight: 1 }}>{p.kpi}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--f-mono)', letterSpacing: '0.06em' }}>{p.tagline}</div>
                  </div>

                  {/* Bottom hint */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--f-mono)', position: 'relative', zIndex: 3, opacity: 0.6 }}>
                    Survoler pour découvrir <span style={{ fontSize: 13 }}>→</span>
                  </div>
                </div>

                {/* ── VERSO ── */}
                <div className="p-face p-back" style={{
                  position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  display: 'grid', gridTemplateRows: '1fr auto', padding: 28,
                }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', background: 'radial-gradient(circle at 85% 12%, var(--gold-tint), transparent 52%)' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-deep)' }}>
                        <p.Icon size={18} />
                      </div>
                      <span style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em' }}>{p.sub}</span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 38, fontWeight: 400, lineHeight: 1, marginBottom: 12, letterSpacing: '-0.03em' }}>{p.title}.</h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420 }}>{p.desc}</p>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1, marginTop: 24 }}>{p.viz}</div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pillar-card { transition: transform .55s cubic-bezier(.4,0,.2,1); }
        .pillar-card:hover .pillar-flip { transform: rotateY(180deg); }
        @media (max-width: 760px) { .pillars-grid { grid-template-columns: 1fr !important; } .pillar-card { height: 400px; } }
        @media (prefers-reduced-motion: reduce) { .pillar-card, .pillar-flip { transition: none !important; } }
      `}</style>
    </section>
  );
}
