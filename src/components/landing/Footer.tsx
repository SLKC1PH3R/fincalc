'use client';

import * as React from 'react';
import Link from 'next/link';
import { I } from './icons';
import { Logo } from './Nav';

export function Footer() {
  const cols = [
    { t: 'Produit', links: ['Plateforme', 'Simulateurs', 'Patrimoine', 'Optimisation ETF', 'Score patrimonial', 'Tarifs'] },
    { t: 'Ressources', links: ['Guide investisseur', 'Fiscalité 2026', 'Glossaire', 'Changelog', 'API', 'Status'] },
    { t: 'Entreprise', links: ['À propos', 'Manifeste', 'Presse', 'Carrières', 'Contact', 'Blog'] },
    { t: 'Légal', links: ['CGU', 'Confidentialité', 'Mentions légales', 'Cookies', 'RGPD', 'Sécurité'] },
  ];
  return (
    <footer id="cta" style={{ padding: '100px 0 56px', borderTop: '1px solid var(--line)' }}>
      <div className="container">
        <div style={{
          padding: '56px 48px',
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 22, marginBottom: 72,
          display: 'grid', gridTemplateColumns: '1.4fr auto', gap: 40, alignItems: 'center',
          position: 'relative', overflow: 'hidden',
        }} className="cta-block">
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 50% 80% at 100% 0%, var(--gold-tint), transparent)',
          }} />
          <div style={{ position: 'relative' }}>
            <h3 style={{
              fontFamily: 'var(--f-serif)', fontSize: 'clamp(32px, 3.6vw, 48px)',
              fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.05,
              color: 'var(--ink)', marginBottom: 14,
            }}>Rejoignez 3 847 investisseurs <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>français.</span></h3>
            <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 520 }}>
              Gratuit · sans carte bancaire · sans publicité · vous pouvez supprimer votre compte à tout moment.
            </p>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link href="/login" className="btn-primary" style={{ padding: '16px 26px', fontSize: 15 }}>
              Commencer gratuitement <I.arrow size={15} />
            </Link>
            <Link href="/login" className="btn-ghost" style={{ padding: '16px 26px', fontSize: 15, justifyContent: 'center' }}>
              Voir la démo
            </Link>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.6fr repeat(4, 1fr)', gap: 36, marginBottom: 60,
        }} className="footer-grid">
          <div>
            <Logo size={26} />
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginTop: 18, maxWidth: 280 }}>
              L'application n°1 de l'investisseur français. Suivre. Optimiser. Simuler.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              {['𝕏', '✉', '⌨'].map(s => (
                <a key={s} style={{
                  width: 34, height: 34, borderRadius: 99,
                  background: 'var(--surface)', border: '1px solid var(--line)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)', fontSize: 14, cursor: 'pointer',
                }}>{s}</a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.t}>
              <div style={{
                fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--muted)',
                letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18,
              }}>{col.t}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(l => (
                  <li key={l}><a style={{ fontSize: 13.5, color: 'var(--ink-2)', cursor: 'pointer' }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 28, borderTop: '1px solid var(--line)',
          fontFamily: 'var(--f-mono)', fontSize: 11.5, color: 'var(--muted)',
          flexWrap: 'wrap', gap: 12,
        }}>
          <span>© 2026 PatrImo · Tous droits réservés</span>
          <span>Hébergé en Europe · RGPD · Open-source</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .cta-block { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
