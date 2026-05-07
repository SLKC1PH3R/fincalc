'use client';

import * as React from 'react';
import { I } from './icons';
import { SectionHead } from './Pillars';

export function Compare() {
  const rows: Array<[string, boolean, boolean, boolean, boolean]> = [
    ['Patrimoine consolidé multi-enveloppes', true, true, false, false],
    ['18 simulateurs fiscaux FR 2026', true, false, false, false],
    ['Optimisation ETF (TER + alternatives)', true, false, false, false],
    ['Carte monde · exposition géographique', true, true, false, false],
    ['Score patrimonial · 6 piliers', true, false, false, false],
    ['Aucune connexion bancaire requise', true, false, true, false],
    ['100 % gratuit · sans publicité', true, false, false, false],
    ['Open-source · self-hostable', true, false, false, false],
  ];
  const cols = ['PatrImo', 'Finary', 'Linxea', 'Moneythor'];
  return (
    <section id="compare" style={{ padding: '100px 0', background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <SectionHead
          eyebrow="Comparatif"
          title={<>La combinaison <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>qui n'existait pas.</span></>}
          sub="Il manquait un outil à la fois complet, souverain et gratuit. Nous l'avons construit."
        />
        <div className="compare-scroll" style={{ marginTop: 48 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', minWidth: 560 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2.4fr repeat(4, 1fr)',
            padding: '16px 20px', background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)', alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Fonctionnalité</span>
            {cols.map((c, i) => (
              <span key={c} style={{
                textAlign: 'center',
                fontFamily: i === 0 ? 'var(--f-serif)' : 'var(--f-sans)',
                fontWeight: i === 0 ? 600 : 400,
                fontSize: i === 0 ? 18 : 13,
                color: i === 0 ? 'var(--gold-deep)' : 'var(--muted)',
              }}>{c}</span>
            ))}
          </div>
          {rows.map((r, idx) => (
            <div key={idx} style={{
              display: 'grid', gridTemplateColumns: '2.4fr repeat(4, 1fr)',
              padding: '16px 20px', alignItems: 'center',
              borderBottom: idx === rows.length - 1 ? 'none' : '1px solid var(--line)',
              background: idx % 2 ? 'var(--surface-2)' : 'var(--surface)',
            }}>
              <span style={{ fontSize: 14, color: 'var(--ink)' }}>{r[0]}</span>
              {(r.slice(1) as boolean[]).map((v, j) => (
                <span key={j} style={{ textAlign: 'center' }}>
                  {v ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: 99,
                      background: j === 0 ? 'var(--gold-deep)' : 'var(--surface-3)',
                      color: j === 0 ? 'var(--surface)' : 'var(--muted)',
                    }}><I.check size={13} stroke={2.5} /></span>
                  ) : (
                    <span style={{ color: 'var(--muted-2)', fontSize: 18 }}>—</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--muted-2)', fontFamily: 'var(--f-mono)' }}>
          Comparatif illustratif · avril 2026
        </div>
      </div>
      <style>{`
        .compare-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .compare-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
