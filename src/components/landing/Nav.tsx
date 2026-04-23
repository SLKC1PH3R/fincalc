'use client';

import * as React from 'react';
import Link from 'next/link';
import { I } from './icons';

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, lineHeight: 1 }}>
      <span style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: size, color: 'var(--ink)', letterSpacing: '-0.02em',
      }}>P</span>
      <span style={{
        width: 5, height: 5, borderRadius: 99, background: 'var(--gold)',
        display: 'inline-block', transform: `translateY(-${size * 0.35}px)`,
      }} />
      <span style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: size, color: 'var(--ink)', letterSpacing: '-0.02em',
      }}>atrimo</span>
      <span style={{
        marginLeft: 10, paddingLeft: 10,
        borderLeft: '1px solid var(--line-strong)',
        fontFamily: "'Geist Mono', monospace",
        fontSize: 10, fontWeight: 500,
        color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em',
      }}>finance</span>
    </Link>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links: Array<[string, string]> = [
    ['Plateforme', '#pillars'],
    ['Simulateurs', '#simulators'],
    ['Patrimoine', '#envelopes'],
    ['Comparatif', '#compare'],
    ['FAQ', '#faq'],
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'color-mix(in srgb, var(--bg) 82%, transparent)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'all .3s ease',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 72,
      }}>
        <Logo />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
          border: '1px solid var(--line)',
          padding: 4, borderRadius: 999,
        }} className="nav-pill">
          {links.map(([label, href]) => (
            <a key={href} href={href} style={{
              padding: '8px 14px', borderRadius: 999,
              fontSize: 13.5, color: 'var(--ink-2)',
              transition: 'background .15s, color .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/login" style={{
            fontSize: 13.5, color: 'var(--ink-2)', padding: '8px 14px', borderRadius: 999,
          }}>Se connecter</Link>
          <Link href="/login" className="btn-primary">
            Commencer <I.arrow size={14} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) { .nav-pill { display: none !important; } }
      `}</style>
    </nav>
  );
}
