'use client';

import * as React from 'react';
import { I } from './icons';

export function Security() {
  const items = [
    { Ic: I.lock, t: 'Chiffrement AES-256', d: 'Toutes les données au repos et en transit.' },
    { Ic: I.shield, t: 'Conformité RGPD', d: 'Hébergement Europe · suppression sur demande.' },
    { Ic: I.eye, t: 'Aucune connexion bancaire', d: 'Saisie manuelle · vous restez maître.' },
    { Ic: I.cpu, t: 'Open-source', d: 'Code auditable · self-hosting possible.' },
  ];
  return (
    <section style={{ padding: '100px 0', background: 'var(--ink)', color: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 100%, color-mix(in srgb, var(--gold) 20%, transparent), transparent)',
      }} />
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16, color: 'color-mix(in srgb, var(--bg) 60%, transparent)' }}>
            <span>Sécurité</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--f-serif)', fontSize: 'clamp(34px, 4vw, 54px)',
            fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.025em',
            color: 'var(--bg)', marginBottom: 18,
          }}>Votre patrimoine, <span className="serif-i" style={{ color: 'var(--gold-soft, #E1B572)' }}>votre affaire.</span></h2>
          <p style={{ fontSize: 17, color: 'color-mix(in srgb, var(--bg) 70%, transparent)', lineHeight: 1.55 }}>
            Zéro donnée bancaire. Zéro publicité. Zéro revente. PatrImo est un outil, pas une place de marché.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="sec-grid">
          {items.map(it => (
            <div key={it.t} style={{
              padding: 24, borderRadius: 14,
              background: 'color-mix(in srgb, var(--bg) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--bg) 12%, transparent)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'color-mix(in srgb, var(--gold-soft, #E1B572) 18%, transparent)',
                color: 'var(--gold-soft, #E1B572)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}><it.Ic size={18} /></div>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--bg)', marginBottom: 6 }}>{it.t}</div>
              <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--bg) 55%, transparent)', lineHeight: 1.55 }}>{it.d}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .sec-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
    </section>
  );
}
