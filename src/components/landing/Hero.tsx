'use client';

import * as React from 'react';
import Link from 'next/link';
import { I } from './icons';
import { DashboardMockup } from './Mockup';

export function Hero() {
  return (
    <section id="top" style={{ position: 'relative', padding: '64px 0 96px', overflow: 'hidden' }}>
      {/* Background halos */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 50% 30% at 15% 0%, var(--gold-tint) 0%, transparent 60%),
          radial-gradient(ellipse 45% 40% at 110% 20%, var(--gold-tint) 0%, transparent 60%)
        `,
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(var(--line) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)',
          gap: 64, alignItems: 'center',
        }} className="hero-grid">

          {/* Left column */}
          <div>
            {/* Eyebrow — live dot */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
              padding: '5px 14px', borderRadius: 99,
              background: 'var(--surface)', border: '1px solid var(--line)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 99,
                background: '#4FB97E',
                boxShadow: '0 0 0 3px rgba(79,185,126,0.22)',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Données temps réel · Avril 2026
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: 'var(--f-serif)',
              fontSize: 'clamp(42px, 5.5vw, 80px)',
              fontWeight: 400,
              lineHeight: 1.02,
              letterSpacing: '-0.038em',
              marginBottom: 26,
              color: 'var(--ink)',
            }}>
              Pilotez votre<br />
              patrimoine.<br />
              <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>Décidez mieux.</span>
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 480, marginBottom: 36 }}>
              18 simulateurs · 8 enveloppes · 0 donnée bancaire.<br />
              Gratuit, pour l'investisseur français qui veut comprendre avant d'agir.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/login" className="btn-primary" style={{ padding: '13px 22px', fontSize: 15 }}>
                Créer mon espace gratuit <I.arrow size={15} />
              </Link>
              <Link href="/tools" style={{
                fontSize: 14, color: 'var(--muted)',
                fontFamily: 'var(--f-mono)',
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'color .15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                Explorer les simulateurs <I.arrow size={13} />
              </Link>
            </div>

            {/* Trust badges — no bg, no border, just icon + text */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 22px' }}>
              {[
                { Ic: I.shield, t: 'Zéro donnée bancaire' },
                { Ic: I.globe,  t: 'RGPD · Hébergé en UE' },
                { Ic: I.lock,   t: 'Chiffrement AES-256' },
                { Ic: I.cpu,    t: 'Open-source' },
              ].map(({ Ic, t }) => (
                <div key={t} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--muted-2)', fontFamily: 'var(--f-mono)',
                }}>
                  <Ic size={12} style={{ color: 'var(--muted)' }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right column — mockup */}
          <div style={{ position: 'relative' }}>
            <DashboardMockup />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}
