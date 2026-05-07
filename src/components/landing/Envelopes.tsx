'use client';

import * as React from 'react';
import { I } from './icons';
import { SectionHead } from './Pillars';

export function Envelopes() {
  const env = [
    { n: 'PEA', d: 'Plafond 150 k€', v: '148 200 €', p: '+12.4%', up: true, Ic: I.chart, color: '#A8733F' },
    { n: 'CTO', d: 'Libre · Positions', v: '62 400 €', p: '+9.1%', up: true, Ic: I.coin, color: '#4F6A4A' },
    { n: 'Assurance Vie', d: 'Ancienneté 8A', v: '84 500 €', p: '+4.7%', up: true, Ic: I.shield, color: '#6B5E7E' },
    { n: 'PER', d: 'Économie TMI', v: '22 000 €', p: '+5.2%', up: true, Ic: I.tree, color: '#4B6878' },
    { n: 'Immobilier', d: 'Valeur nette', v: '185 000 €', p: '+3.1%', up: true, Ic: I.home, color: '#8A5A3F' },
    { n: 'Livrets', d: 'Livret A · LDDS · LEP', v: '32 900 €', p: '+3.0%', up: true, Ic: I.bank, color: '#5F5A4F' },
    { n: 'Crypto', d: 'Via CoinGecko', v: '28 400 €', p: '-4.2%', up: false, Ic: I.cpu, color: '#8A6B3F' },
    { n: 'Liquidités', d: 'Mois de dépenses', v: '12 600 €', p: '= 3,2 mois', up: null as boolean | null, Ic: I.wallet, color: '#5A5F70' },
  ];
  return (
    <section id="envelopes" style={{ padding: '100px 0', background: 'var(--bg)' }}>
      <div className="container">
        <SectionHead
          eyebrow="8 enveloppes"
          title={<>Toutes vos enveloppes, <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>un seul regard.</span></>}
          sub="Chaque type d'actif dispose de sa vue dédiée : plafonds, fiscalité, performance, optimisation."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 48 }} className="env-grid">
          {env.map((e, i) => (
            <div key={e.n} className="env-card reveal" style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: 20,
              position: 'relative', overflow: 'hidden',
              transitionDelay: `${i * 40}ms`,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: e.color, opacity: 0.75,
              }} />
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
              <div className="mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 4 }}>{e.v}</div>
              <div style={{
                fontSize: 12, fontFamily: 'var(--f-mono)',
                color: e.up === true ? 'var(--up)' : e.up === false ? 'var(--down)' : 'var(--muted)',
              }}>{e.p}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .env-card { transition: transform .3s, box-shadow .3s, border-color .3s; }
        .env-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--line-strong); }
        @media (max-width: 960px) { .env-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .env-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
