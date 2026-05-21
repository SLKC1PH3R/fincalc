'use client';

import * as React from 'react';
import Link from 'next/link';

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
const I = { arrow: ArrowIcon };

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, lineHeight: 1 }}>
      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: size, color: 'var(--ink)', letterSpacing: '-0.02em' }}>P</span>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--gold)', display: 'inline-block', transform: `translateY(-${size * 0.35}px)` }} />
      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: size, color: 'var(--ink)', letterSpacing: '-0.02em' }}>atrimo</span>
      <span style={{ marginLeft: 10, paddingLeft: 10, borderLeft: '1px solid var(--line-strong)', fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>finance</span>
    </Link>
  );
}

/* ── Dropdown data ── */
const SIM_GROUPS = [
  {
    cat: 'Épargne & Investissement',
    color: '#7c3aed',
    items: [
      { em: '📈', n: 'Intérêts composés',    sub: "L'effet boule de neige",       href: '/tools/interets-composes' },
      { em: '🔥', n: 'FI/RE',                sub: 'Liberté financière',           href: '/tools/fire' },
      { em: '🔄', n: 'DCA',                  sub: 'Investissement régulier',      href: '/tools/dca' },
      { em: '💸', n: 'Revenus passifs',      sub: 'Dividendes projetés',          href: '/tools/revenus-passifs' },
      { em: '⚖️', n: 'Optimiseur ETF',       sub: 'Comparateur de frais TER',     href: '/tools/optimiseur-etf' },
    ],
  },
  {
    cat: 'Immobilier',
    color: '#0ea5e9',
    items: [
      { em: '🏠', n: 'Crédit immobilier',    sub: 'Mensualités & amortissement',  href: '/tools/pret-immobilier' },
      { em: '🔑', n: 'Acheter vs Louer',     sub: 'Comparaison Patrimoniale',     href: '/tools/acheter-ou-louer' },
      { em: '🏢', n: 'Rentabilité locative', sub: 'Rendement net & cash-flow',    href: '/tools/rentabilite-locative' },
    ],
  },
  {
    cat: 'Fiscalité',
    color: '#10b981',
    items: [
      { em: '🧾', n: 'Impôts IR 2026',       sub: 'Calcul IR & TMI',              href: '/tools/impots-ir' },
      { em: '⚖️', n: 'Flat Tax vs Barème',   sub: 'PFU 30% vs progressif',        href: '/tools/flat-tax-bareme' },
      { em: '📊', n: 'PEA vs CTO vs AV',     sub: 'Fiscalité nette par enveloppe',href: '/tools/pea-cto-av' },
      { em: '🏛', n: 'Succession',           sub: 'Droits & abattements',         href: '/tools/succession' },
    ],
  },
  {
    cat: 'Budget & Retraite',
    color: '#f59e0b',
    items: [
      { em: '💰', n: "Taux d'épargne",       sub: 'Revenus vs dépenses',          href: '/tools/taux-epargne' },
      { em: '📋', n: 'Budget 50/30/20',      sub: 'Règle budgétaire',             href: '/tools/budget-50-30-20' },
      { em: '🛡️', n: "Épargne d'urgence",    sub: 'Matelas de sécurité',          href: '/tools/epargne-urgence' },
      { em: '🎯', n: 'Simulateur retraite',  sub: 'Pension & épargne nécessaire', href: '/tools/retraite' },
      { em: '🏆', n: 'Score Patrimonial',    sub: 'Notation 0-100 · 6 piliers',   href: '/tools/score-Patrimonial' },
    ],
  },
];

const PATR_LEFT = [
  { ic: '🏛', n: "Vue d'ensemble",    sub: 'Valeur nette, répartition, carte monde', href: '/dashboard/patrimoine' },
  { ic: '🏠', n: 'Immobilier',        sub: 'Biens, crédit restant, loyers',           href: '/dashboard/patrimoine/immobilier' },
  { ic: '📈', n: 'Actions & Fonds',   sub: 'PEA, CTO, AV, PER en temps réel',        href: '/dashboard/patrimoine/actions' },
  { ic: '💰', n: 'Livrets',           sub: 'Livret A, LDDS, LEP — plafonds',         href: '/dashboard/patrimoine/livrets' },
];
const PATR_RIGHT = [
  { ic: '₿',  n: 'Autres actifs',     sub: 'Crypto, métaux, alternatifs',             href: '/dashboard/patrimoine/autres' },
  { ic: '🏦', n: 'Comptes bancaires', sub: 'Soldes & suivi courants',                 href: '/dashboard/patrimoine/comptes' },
  { ic: '📋', n: 'Emprunts',          sub: 'Vue consolidée de vos crédits',           href: '/dashboard/patrimoine/emprunts' },
  { ic: '🏆', n: 'Score Patrimonial', sub: 'Notation 0-100 sur 6 piliers',            href: '/dashboard/score' },
];

/* ── Dropdown wrapper (desktop only) ── */
function NavDropdown({ label, href, children }: { label: string; href?: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  const show = () => { clearTimeout(timer.current); setOpen(true); };
  const hide = () => { timer.current = setTimeout(() => setOpen(false), 120); };

  return (
    <div style={{ position: 'relative' }} onMouseEnter={show} onMouseLeave={hide}>
      <a
        href={href ?? '#'}
        style={{
          padding: '8px 14px', borderRadius: 999, fontSize: 13.5,
          color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 4,
          transition: 'background .15s, color .15s',
          background: open ? 'var(--surface-3)' : 'transparent',
        }}
      >
        {label}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--line-strong)',
        borderRadius: 16,
        boxShadow: '0 24px 60px -16px rgba(10,10,10,0.18), 0 4px 16px rgba(10,10,10,0.08)',
        padding: '20px',
        zIndex: 200,
        pointerEvents: open ? 'auto' : 'none',
        opacity: open ? 1 : 0,
        transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
        transition: 'opacity .2s ease, transform .2s ease',
        minWidth: 320,
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Simulateurs mega-dropdown (desktop) ── */
function SimulatorsMenu() {
  return (
    <NavDropdown label="Simulateurs">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', minWidth: 640 }}>
        {SIM_GROUPS.map(g => (
          <div key={g.cat} style={{ marginBottom: 18 }}>
            <div style={{
              fontFamily: "'Geist Mono', monospace", fontSize: 9.5, fontWeight: 600,
              color: g.color, letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: g.color, display: 'inline-block' }} />
              {g.cat}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {g.items.map(it => (
                <Link key={it.href} href={it.href} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', borderRadius: 8,
                  transition: 'background .15s',
                  textDecoration: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{it.n}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Geist Mono', monospace", marginTop: 1 }}>{it.sub}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--line)', marginTop: 4, paddingTop: 12 }}>
        <Link href="/tools" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12.5, fontWeight: 600, color: 'var(--gold-deep)',
          fontFamily: "'Geist Mono', monospace", letterSpacing: '0.02em',
          textDecoration: 'none',
          transition: 'gap .15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
          onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
        >
          Voir les 18 simulateurs <I.arrow size={13} />
        </Link>
      </div>
    </NavDropdown>
  );
}

/* ── Patrimoine dropdown (desktop) ── */
function PatrimoineMenu() {
  return (
    <NavDropdown label="Patrimoine">
      <div style={{ minWidth: 480 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', marginBottom: 12 }}>
          {[PATR_LEFT, PATR_RIGHT].map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {col.map(it => (
                <Link key={it.href + it.n} href={it.href} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8,
                  transition: 'background .15s', textDecoration: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{it.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, fontFamily: "'Geist Mono', monospace" }}>{it.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <Link href="/patrimoine" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, fontWeight: 600, color: 'var(--gold-deep)',
            fontFamily: "'Geist Mono', monospace", letterSpacing: '0.02em',
            textDecoration: 'none',
            transition: 'gap .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.gap = '10px')}
            onMouseLeave={e => (e.currentTarget.style.gap = '6px')}
          >
            Voir les outils Patrimoniaux <I.arrow size={13} />
          </Link>
        </div>
      </div>
    </NavDropdown>
  );
}

/* ── Simple nav link ── */
function NavLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} style={{
      padding: '8px 14px', borderRadius: 999,
      fontSize: 13.5, color: 'var(--ink-2)',
      transition: 'background .15s, color .15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >{label}</a>
  );
}

/* ── Mobile menu ── */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const allSims = SIM_GROUPS.flatMap(g => g.items);
  const allPatr = [...PATR_LEFT, ...PATR_RIGHT];

  return (
    <>
      {/* Overlay backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(10,10,10,0.35)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 400,
        width: 'min(340px, 90vw)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--line-strong)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-24px 0 80px rgba(10,10,10,0.16)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}>
          <Logo size={22} />
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid var(--line-strong)',
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--ink)',
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CTA buttons */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
          <Link href="/login" onClick={onClose} style={{
            flex: 1, textAlign: 'center', padding: '10px', borderRadius: 10,
            border: '1px solid var(--line-strong)', fontSize: 13, fontWeight: 600,
            color: 'var(--ink)', textDecoration: 'none',
          }}>Se connecter</Link>
          <Link href="/login" onClick={onClose} style={{
            flex: 1, textAlign: 'center', padding: '10px', borderRadius: 10,
            background: 'var(--ink)', color: 'var(--bg)', fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
          }}>Commencer</Link>
        </div>

        {/* Nav links */}
        <div style={{ padding: '12px 12px 0', flexShrink: 0 }}>
          {[
            { label: 'Plateforme', href: '/#pillars' },
            { label: 'Comparatif', href: '/#compare' },
            { label: 'FAQ', href: '/#faq' },
          ].map(l => (
            <a key={l.label} href={l.href} onClick={onClose} style={{
              display: 'block', padding: '11px 12px', borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: 'var(--ink)',
              textDecoration: 'none',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{l.label}</a>
          ))}
        </div>

        {/* Simulateurs section */}
        <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontFamily: "'Geist Mono', monospace", fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 8,
          }}>Simulateurs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {allSims.map(it => (
              <Link key={it.href} href={it.href} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px',
                borderRadius: 8, textDecoration: 'none', color: 'var(--ink)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{it.em}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{it.n}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Patrimoine section */}
        <div style={{ padding: '16px 20px 24px', flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontFamily: "'Geist Mono', monospace", fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)',
            marginBottom: 8,
          }}>Patrimoine</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {allPatr.map(it => (
              <Link key={it.href + it.n} href={it.href} onClick={onClose} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px',
                borderRadius: 8, textDecoration: 'none', color: 'var(--ink)',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{it.ic}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{it.n}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Theme toggle ── */
function ThemeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('landing-theme');
    if (saved === 'dark') {
      document.querySelector('.Patrimo-landing')?.setAttribute('data-palette', 'dark');
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.querySelector('.Patrimo-landing');
    if (next) el?.setAttribute('data-palette', 'dark');
    else el?.removeAttribute('data-palette');
    localStorage.setItem('landing-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Mode clair' : 'Mode sombre'}
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: '1px solid var(--line-strong)',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--ink)',
        transition: 'background .2s, color .2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
    >
      {dark ? (
        /* Sun */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon */
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

/* ── Main Nav ── */
export function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'color-mix(in srgb, var(--bg) 82%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'all .3s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Logo />

          {/* Desktop center pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: 'color-mix(in srgb, var(--surface) 60%, transparent)',
            border: '1px solid var(--line)',
            padding: '4px 4px', borderRadius: 999,
          }} className="nav-pill">
            <NavLink label="Plateforme" href="/#pillars" />
            <SimulatorsMenu />
            <PatrimoineMenu />
            <NavLink label="Comparatif" href="/#compare" />
            <NavLink label="FAQ" href="/#faq" />
          </div>

          {/* Desktop right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="nav-cta">
            <ThemeToggle />
            <Link href="/login" style={{
              fontSize: 13.5, color: 'var(--muted)',
              padding: '8px 14px', borderRadius: 999,
              transition: 'color .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Se connecter
            </Link>
            <Link href="/login" className="btn-primary">
              Commencer <I.arrow size={14} />
            </Link>
          </div>

          {/* Mobile right: login + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-mobile-actions">
            <Link href="/login" style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ink)',
              padding: '8px 14px', borderRadius: 999,
              border: '1px solid var(--line-strong)',
              textDecoration: 'none',
            }}>
              Connexion
            </Link>
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: '1px solid var(--line-strong)',
                background: 'var(--surface)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 16, height: 1.5, background: 'var(--ink)', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 16, height: 1.5, background: 'var(--ink)', borderRadius: 2, display: 'block' }} />
              <span style={{ width: 10, height: 1.5, background: 'var(--ink)', borderRadius: 2, display: 'block', alignSelf: 'flex-start', marginLeft: 3 }} />
            </button>
          </div>
        </div>

        <style>{`
          @media (min-width: 961px) { .nav-mobile-actions { display: none !important; } }
          @media (max-width: 960px) { .nav-pill { display: none !important; } .nav-cta { display: none !important; } }
          @media (max-width: 480px) { .nav-mobile-actions a { display: none !important; } }
        `}</style>
      </nav>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
