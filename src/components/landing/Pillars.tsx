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

/* ── Viz widgets ── */
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

/* ── Pillars component ── */
export function Pillars() {
  const [active, setActive] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval>>();

  const resetTimer = React.useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(p => (p + 1) % 4), 4200);
  }, []);

  React.useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  const select = (i: number) => { setActive(i); resetTimer(); };

  const pillars = [
    {
      title: 'Suivre',    sub: '01', kpi: '+8,4%',    tagline: '8 enveloppes · temps réel',
      Icon: I.chart,
      desc: 'Vue consolidée de vos 8 enveloppes patrimoniales en temps réel — PEA, CTO, Crypto, Immobilier, AV, PER, Livrets, Cash.',
      viz: <PillarVizTrack />,
    },
    {
      title: 'Optimiser', sub: '02', kpi: '-8 420 €',  tagline: 'ETF · TER · impact 20 ans',
      Icon: I.bolt,
      desc: 'Chaque ETF comparé aux meilleures alternatives du marché. Impact des frais sur 20 ans calculé automatiquement.',
      viz: <PillarVizOptimize />,
    },
    {
      title: 'Simuler',   sub: '03', kpi: '×18',       tagline: 'Calculateurs · Fiscalité 2026',
      Icon: I.cpu,
      desc: '18 calculateurs à jour de la fiscalité française 2026. Intérêts composés, FI/RE, achat vs location, prêt, retraite.',
      viz: <PillarVizSim />,
    },
    {
      title: 'Éduquer',   sub: '04', kpi: '5 min',     tagline: 'Guides · Fiches · Vidéos',
      Icon: I.book,
      desc: "Guides pédagogiques, glossaire, explications contextuelles à chaque simulateur. Comprendre avant d'agir.",
      viz: <PillarVizEducate />,
    },
  ];

  const p = pillars[active];

  return (
    <section id="pillars" style={{
      padding: '120px 0 80px',
      background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--surface-2) 0%, var(--bg) 65%)',
    }}>
      <div className="container">
        <SectionHead
          eyebrow="Plateforme"
          title={<>Quatre piliers pour maîtriser <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>votre patrimoine.</span></>}
          sub="Simuler, optimiser, suivre, sécuriser — tout dans une seule interface pensée pour durer."
        />

        <div className="pillars-layout reveal" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, marginTop: 56 }}>

          {/* Left — tab list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pillars.map((pill, i) => (
              <button
                key={pill.title}
                onClick={() => select(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 18,
                  padding: '18px 22px', borderRadius: 14,
                  background: i === active ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${i === active ? 'var(--line-strong)' : 'transparent'}`,
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'background .2s, border-color .2s',
                  boxShadow: i === active ? 'var(--shadow-sm)' : 'none',
                }}
                onMouseEnter={e => { if (i !== active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (i !== active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Number */}
                <span style={{
                  fontFamily: 'var(--f-serif)', fontSize: 32, fontWeight: 400, lineHeight: 1.1,
                  color: i === active ? 'var(--gold-deep)' : 'var(--muted-2)',
                  letterSpacing: '-0.04em', minWidth: 38, flexShrink: 0,
                  transition: 'color .2s',
                }}>{pill.sub}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--f-serif)', fontSize: 20, fontWeight: 400,
                    letterSpacing: '-0.02em', color: 'var(--ink)',
                    marginBottom: 3,
                  }}>{pill.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--f-mono)', letterSpacing: '0.04em' }}>
                    {pill.tagline}
                  </div>
                  {/* Progress bar */}
                  {i === active && (
                    <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: 'var(--line)', width: 64, overflow: 'hidden' }}>
                      <div key={active} style={{
                        height: '100%', background: 'var(--gold-deep)', borderRadius: 99,
                        animation: 'pillar-progress 4.2s linear forwards',
                      }} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right — preview panel */}
          <div style={{
            borderRadius: 20, background: 'var(--surface)',
            border: '1px solid var(--line-strong)',
            boxShadow: 'var(--shadow-md)',
            padding: '32px 32px 28px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Gold glow */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none', background: 'radial-gradient(circle at 85% 12%, var(--gold-tint), transparent 52%)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-deep)' }}>
                  <p.Icon size={18} />
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--gold-deep)', lineHeight: 1 }}>{p.kpi}</div>
              </div>

              {/* Title */}
              <h3 style={{ fontFamily: 'var(--f-serif)', fontSize: 42, fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 14 }}>
                {p.title}<span style={{ color: 'var(--gold-deep)' }}>.</span>
              </h3>

              {/* Description */}
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 24, maxWidth: 440 }}>{p.desc}</p>

              {/* Viz */}
              {p.viz}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pillar-progress { from { width: 0 } to { width: 100% } }
        @media (max-width: 900px) {
          .pillars-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
