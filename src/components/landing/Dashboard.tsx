'use client';

import * as React from 'react';
import Image from 'next/image';
import { SectionHead } from './Pillars';

export function DashboardSection() {
  return (
    <section id="dashboard" style={{
      padding: '100px 0', position: 'relative',
      background: 'linear-gradient(180deg, var(--bg) 0%, var(--surface-2) 100%)',
      borderTop: '1px solid var(--line)',
    }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <SectionHead
          eyebrow="Produit"
          title={<>Le dashboard, <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>votre QG financier.</span></>}
          sub="Tout votre patrimoine, toutes vos simulations, toutes vos optimisations. Une interface dense, jamais encombrée."
          align="center"
        />
      </div>
      <div className="container" style={{ marginTop: 56, position: 'relative' }}>
        <div style={{
          position: 'relative',
          borderRadius: 22,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-xl)',
          padding: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            height: 28, borderRadius: '12px 12px 0 0',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--line)',
            margin: -12, marginBottom: 12,
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
          }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: '#E5A499' }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: '#E5C488' }} />
            <span style={{ width: 9, height: 9, borderRadius: 99, background: '#A8C9A0' }} />
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
            <Image
              src="/dashboard-desktop.png"
              alt="PatrImo dashboard"
              fill
              sizes="(max-width: 1240px) 100vw, 1240px"
              style={{ objectFit: 'contain', borderRadius: 10, objectPosition: 'top center' }}
            />
          </div>
          <div aria-hidden style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%',
            background: 'linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 50%, transparent))',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </section>
  );
}
