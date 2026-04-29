'use client';

import * as React from 'react';
import Link from 'next/link';
import { I } from './icons';
import { DashboardMockup } from './Mockup';

export function Hero() {
  return (
    <section id="top" style={{
      position: 'relative',
      padding: '56px 0 80px',
      overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 50% 30% at 15% 0%, var(--gold-tint) 0%, transparent 60%),
          radial-gradient(ellipse 45% 40% at 110% 20%, var(--gold-tint) 0%, transparent 60%)
        `,
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none',
        backgroundImage: `radial-gradient(var(--line) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
          gap: 60, alignItems: 'center',
        }} className="hero-grid">
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>
              <span>18 simulateurs · France 2026 · 100 % gratuit</span>
            </div>
            <h1 style={{
              fontFamily: 'var(--f-serif)',
              fontSize: 'clamp(44px, 5.8vw, 84px)',
              fontWeight: 400,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              marginBottom: 28,
              color: 'var(--ink)',
            }}>
              Suivre. Optimiser.<br />
              <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>Simuler.</span>
            </h1>
            <p style={{
              fontSize: 18, lineHeight: 1.55,
              color: 'var(--muted)', maxWidth: 520, marginBottom: 34,
            }}>
              L'application n°1 de l'investisseur français. Pilotez l'intégralité de votre patrimoine,
              simulez chaque décision, optimisez vos frais — depuis une seule plateforme.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 34 }}>
              <Link href="/login" className="btn-primary" style={{ padding: '14px 22px', fontSize: 15 }}>
                Commencer gratuitement <I.arrow size={15} />
              </Link>
              <a href="/#dashboard" className="btn-ghost" style={{ padding: '14px 22px', fontSize: 15 }}>
                Voir le produit
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 22px' }}>
              {['Aucune donnée bancaire', 'RGPD · UE', 'Chiffré de bout en bout', 'Open-source'].map(t => (
                <div key={t} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 12.5, color: 'var(--muted)',
                  fontFamily: 'var(--f-mono)',
                }}>
                  <I.check size={13} stroke={2} style={{ color: 'var(--gold)' }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <DashboardMockup />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
