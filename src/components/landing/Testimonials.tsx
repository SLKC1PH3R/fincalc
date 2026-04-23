'use client';

import * as React from 'react';
import { I } from './icons';
import { SectionHead } from './Pillars';

type Tm = { q: string; n: string; r: string; k: string };

export function Testimonials() {
  const list: Tm[] = [
    { q: "Je suivais mon patrimoine sur trois fichiers Excel. Je les ai supprimés après une semaine.", n: 'Camille R.', r: 'Ingénieure logiciel · Nantes', k: 'PEA · CTO · Immo' },
    { q: "Le comparateur ETF m'a fait économiser 240 € de frais la première année. Rentabilisé dix fois.", n: 'Thomas L.', r: 'Consultant · Paris', k: 'PEA · PER' },
    { q: "Simple, précis, sans prétention. Exactement l'outil que je cherchais depuis des années.", n: 'Sophie M.', r: 'Médecin · Lyon', k: 'AV · Livrets · Immo' },
    { q: "Le score patrimonial m'a poussé à rééquilibrer. J'ai gagné 8 points en six mois.", n: 'Julien B.', r: 'Cadre commercial · Bordeaux', k: 'CTO · Crypto' },
    { q: "Aucune donnée bancaire partagée. Mon comptable est rassuré, moi aussi.", n: 'Anaïs T.', r: "Chef d'entreprise · Toulouse", k: 'PEA · PER · Immo' },
  ];
  return (
    <section style={{ padding: '100px 0' }}>
      <div className="container">
        <SectionHead
          eyebrow="Témoignages"
          title={<>Des investisseurs qui <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>maîtrisent.</span></>}
          sub="Quelques retours parmi les 3 847 utilisateurs actifs."
        />
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="tm-grid">
          {list.slice(0, 3).map((t, i) => <TmCard key={i} {...t} big={i === 0} />)}
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="tm-grid-2">
          {list.slice(3).map((t, i) => <TmCard key={i} {...t} />)}
        </div>
        <div style={{
          marginTop: 28, textAlign: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--muted-2)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          Témoignages illustratifs · représentatifs de retours d'utilisateurs
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .tm-grid, .tm-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

function TmCard({ q, n, r, k, big }: Tm & { big?: boolean }) {
  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 16, padding: big ? 32 : 24,
        display: 'flex', flexDirection: 'column', gap: big ? 24 : 18,
        transition: 'border-color .2s, transform .2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
    >
      <div style={{ display: 'flex', gap: 3, color: 'var(--gold-deep)' }}>
        {[...Array(5)].map((_, i) => <I.star key={i} size={14} fill="currentColor" stroke={0} />)}
      </div>
      <blockquote style={{
        fontFamily: 'var(--f-serif)',
        fontSize: big ? 26 : 20,
        lineHeight: 1.3, fontWeight: 400, letterSpacing: '-0.015em',
        color: 'var(--ink)', margin: 0,
      }}>« {q} »</blockquote>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingTop: 16, borderTop: '1px solid var(--line)', marginTop: 'auto',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: 'var(--surface-3)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-serif)', fontSize: 16, color: 'var(--ink)',
        }}>{n.split(' ')[0][0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--ink)' }}>{n}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>{r}</div>
        </div>
        <span style={{
          fontSize: 10, color: 'var(--muted)',
          fontFamily: 'var(--f-mono)', letterSpacing: '0.08em',
          padding: '4px 8px', border: '1px solid var(--line)', borderRadius: 99,
        }}>{k}</span>
      </div>
    </div>
  );
}
