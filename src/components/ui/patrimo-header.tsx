'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MenuToggleIcon } from './menu-toggle-icon'
import { ChevronDown } from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const SIMS_CATS = [
  {
    cat: 'Épargne',
    color: '#22c55e',
    items: [
      { name: 'Intérêts Composés', href: '/tools/interets-composes' },
      { name: 'FI/RE', href: '/tools/fire' },
      { name: 'DCA', href: '/tools/dca' },
      { name: "Taux d'épargne", href: '/tools/taux-epargne' },
      { name: "Épargne de précaution", href: '/tools/epargne-urgence' },
    ],
  },
  {
    cat: 'Immobilier',
    color: '#4b78ff',
    items: [
      { name: 'Prêt Immobilier', href: '/tools/pret-immobilier' },
      { name: 'Acheter vs Louer', href: '/tools/acheter-ou-louer' },
      { name: 'Rentabilité Locative', href: '/tools/rentabilite-locative' },
    ],
  },
  {
    cat: 'Fiscal',
    color: '#f59e0b',
    items: [
      { name: 'Impôts IR', href: '/tools/impots-ir' },
      { name: 'Simulateur Retraite', href: '/tools/retraite' },
      { name: 'Flat Tax vs Barème', href: '/tools/flat-tax-bareme' },
      { name: 'Succession & Donations', href: '/tools/succession' },
      { name: 'Coût crédit conso', href: '/tools/credit-conso' },
    ],
  },
  {
    cat: 'Investissement',
    color: '#fb7185',
    items: [
      { name: 'PEA vs CTO vs AV', href: '/tools/pea-cto-av' },
      { name: 'Revenus passifs', href: '/tools/revenus-passifs' },
      { name: 'Benchmarks', href: '/tools/benchmarks' },
      { name: 'Score Patrimonial', href: '/tools/score-Patrimonial' },
    ],
  },
]

const PATRI_LEFT = [
  { ic: '🏛', nm: "Vue d'ensemble", href: '/dashboard/Patrimoine' },
  { ic: '🏠', nm: 'Immobilier', href: '/dashboard/Patrimoine' },
  { ic: '📈', nm: 'Actions & Fonds', href: '/dashboard/Patrimoine' },
  { ic: '💳', nm: 'Livrets', href: '/dashboard/Patrimoine' },
  { ic: '₿', nm: 'Autres actifs', href: '/dashboard/Patrimoine' },
]
const PATRI_RIGHT = [
  { ic: '📊', nm: 'Mon Portefeuille', href: '/dashboard/portfolio' },
  { ic: '🏆', nm: 'Score Patrimonial', href: '/dashboard/score' },
  { ic: '⚖️', nm: 'Rééquilibrage', href: '/dashboard/Patrimoine' },
  { ic: '🧾', nm: 'Rapport Fiscal', href: '/dashboard/Patrimoine' },
  { ic: '🎯', nm: 'Mes Objectifs', href: '/dashboard/Patrimoine' },
]

// ── CSS ───────────────────────────────────────────────────────────────────────

const HDR_CSS = `
.ph-wrap{position:sticky;top:0;z-index:200;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.ph-inner{max-width:1200px;margin:0 auto;padding:0 2rem;height:62px;display:flex;align-items:center;justify-content:space-between;gap:1rem}
.ph-logo{font-weight:800;font-size:1.25rem;color:#f8fafc;letter-spacing:-0.04em;display:flex;align-items:center;gap:0.45rem;text-decoration:none}
.ph-logo-mark{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#4b78ff,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;color:#fff;flex-shrink:0;box-shadow:0 4px 16px rgba(75,120,255,0.4)}
.ph-center{display:flex;align-items:center;gap:0}
.ph-item{position:relative}
.ph-trigger{display:flex;align-items:center;gap:4px;padding:0.45rem 0.9rem;font-size:0.85rem;font-weight:500;color:#94a3b8;border:none;background:none;cursor:pointer;border-radius:8px;transition:color 0.15s,background 0.15s;font-family:inherit;white-space:nowrap}
.ph-trigger:hover,.ph-item:hover .ph-trigger{color:#f8fafc;background:rgba(255,255,255,0.05)}
.ph-trigger svg{width:13px;height:13px;transition:transform 0.2s;flex-shrink:0}
.ph-item:hover .ph-trigger svg{transform:rotate(180deg)}
.ph-link{padding:0.45rem 0.9rem;font-size:0.85rem;font-weight:500;color:#94a3b8;border-radius:8px;transition:color 0.15s,background 0.15s;text-decoration:none;display:block;white-space:nowrap}
.ph-link:hover{color:#f8fafc;background:rgba(255,255,255,0.05)}

/* Dropdown */
.ph-drop{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(8,13,26,0.97);backdrop-filter:blur(28px) saturate(200%);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:16px;box-shadow:0 24px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(75,120,255,0.08);opacity:0;visibility:hidden;pointer-events:none;transition:opacity 0.18s ease,visibility 0.18s ease,transform 0.18s ease;transform:translateX(-50%) translateY(-6px);z-index:300}
.ph-item:hover .ph-drop{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.ph-drop-sims{width:680px;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.ph-drop-patri{width:460px;display:grid;grid-template-columns:1fr 1fr;gap:8px}

/* Dropdown column */
.ph-dcol-hd{font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 8px 8px;margin-bottom:2px}
.ph-drow{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;font-size:0.82rem;color:#94a3b8;text-decoration:none;transition:background 0.12s,color 0.12s;white-space:nowrap}
.ph-drow:hover{background:rgba(75,120,255,0.1);color:#f8fafc}
.ph-drow-ic{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,0.05);flex-shrink:0}

/* Right actions */
.ph-r{display:flex;align-items:center;gap:0.5rem}
.ph-btn{display:inline-flex;align-items:center;gap:0.35rem;font-family:inherit;font-size:0.83rem;font-weight:600;padding:0.5rem 1.1rem;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:all 0.18s;text-decoration:none;white-space:nowrap}
.ph-ghost{color:#94a3b8;border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.04)}
.ph-ghost:hover{color:#f8fafc;background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.14)}
.ph-cta{background:linear-gradient(135deg,#4b78ff,#3360e6);color:#fff;box-shadow:0 4px 14px rgba(75,120,255,0.28)}
.ph-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(75,120,255,0.4)}

/* Mobile toggle */
.ph-mob-btn{display:none;align-items:center;justify-content:center;width:38px;height:38px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);cursor:pointer;color:#f8fafc;flex-shrink:0}

/* Mobile menu */
.ph-mob-menu{position:fixed;inset:0;top:62px;background:rgba(5,8,15,0.98);backdrop-filter:blur(24px);z-index:199;overflow-y:auto;padding:1rem 1.5rem 2rem;display:flex;flex-direction:column;gap:0.25rem}
.ph-mob-sec{font-size:0.67rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#475569;padding:0.75rem 0.25rem 0.35rem;margin-top:0.5rem}
.ph-mob-link{display:flex;align-items:center;gap:0.7rem;padding:0.75rem 0.75rem;border-radius:10px;font-size:0.9rem;font-weight:500;color:#94a3b8;text-decoration:none;transition:background 0.12s,color 0.12s}
.ph-mob-link:hover{background:rgba(75,120,255,0.1);color:#f8fafc}
.ph-mob-ic{width:28px;height:28px;border-radius:7px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.ph-mob-ctas{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,0.07)}
.ph-mob-cta{display:flex;justify-content:center;align-items:center;padding:0.75rem;border-radius:10px;font-size:0.9rem;font-weight:600;text-decoration:none;transition:all 0.15s;font-family:inherit}

@media(max-width:900px){
  .ph-center{display:none}
  .ph-r .ph-ghost,.ph-r .ph-cta{display:none}
  .ph-mob-btn{display:flex}
}
@media(min-width:901px){
  .ph-mob-menu{display:none!important}
}
`

// ── Component ─────────────────────────────────────────────────────────────────

export function PatrimoHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 20))
    return unsub
  }, [scrollY])

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 900) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const bgOpacity = scrolled ? '0.92' : '0.75'
  const borderOpacity = scrolled ? '0.1' : '0.06'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HDR_CSS }} />

      <motion.header
        className="ph-wrap"
        style={{
          background: `rgba(5,8,15,${bgOpacity})`,
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderBottom: `1px solid rgba(255,255,255,${borderOpacity})`,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <div className="ph-inner">
          {/* Logo */}
          <Link href="/" className="ph-logo">
            <span className="ph-logo-mark">P</span>
            Patrimo
          </Link>

          {/* Desktop nav */}
          <nav className="ph-center" aria-label="Navigation principale">

            {/* Simulateurs dropdown */}
            <div className="ph-item">
              <button className="ph-trigger">
                Simulateurs
                <ChevronDown size={13} />
              </button>
              <div className="ph-drop">
                <div className="ph-drop-sims">
                  {SIMS_CATS.map(cat => (
                    <div key={cat.cat}>
                      <div className="ph-dcol-hd" style={{ color: cat.color }}>{cat.cat}</div>
                      {cat.items.map(item => (
                        <Link key={item.href} href={item.href} className="ph-drow">{item.name}</Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patrimoine dropdown */}
            <div className="ph-item">
              <button className="ph-trigger">
                Patrimoine
                <ChevronDown size={13} />
              </button>
              <div className="ph-drop">
                <div className="ph-drop-patri">
                  <div>
                    <div className="ph-dcol-hd" style={{ color: '#8b5cf6' }}>Patrimoine</div>
                    {PATRI_LEFT.map(item => (
                      <Link key={item.nm} href={item.href} className="ph-drow">
                        <span className="ph-drow-ic">{item.ic}</span>
                        {item.nm}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <div className="ph-dcol-hd" style={{ color: '#4b78ff' }}>Suivi & Analyse</div>
                    {PATRI_RIGHT.map(item => (
                      <Link key={item.nm} href={item.href} className="ph-drow">
                        <span className="ph-drow-ic">{item.ic}</span>
                        {item.nm}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct links */}
            <a href="#roadmap" className="ph-link">Roadmap</a>
            <a href="#faq" className="ph-link">FAQ</a>
          </nav>

          {/* Right actions */}
          <div className="ph-r">
            <Link href="/login" className="ph-btn ph-ghost">Se connecter</Link>
            <Link href="/login" className="ph-btn ph-cta">Commencer →</Link>

            {/* Mobile toggle */}
            <button
              className="ph-mob-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <MenuToggleIcon open={mobileOpen} size={20} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="ph-mob-menu" role="dialog" aria-label="Menu mobile">
            <div className="ph-mob-sec">Simulateurs</div>
            {SIMS_CATS.map(cat =>
              cat.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ph-mob-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.name}
                </Link>
              ))
            )}

            <div className="ph-mob-sec">Patrimoine</div>
            {[...PATRI_LEFT, ...PATRI_RIGHT].map(item => (
              <Link
                key={`mob-${item.nm}`}
                href={item.href}
                className="ph-mob-link"
                onClick={() => setMobileOpen(false)}
              >
                <span className="ph-mob-ic">{item.ic}</span>
                {item.nm}
              </Link>
            ))}

            <div className="ph-mob-sec">Pages</div>
            <a href="#roadmap" className="ph-mob-link" onClick={() => setMobileOpen(false)}>Roadmap</a>
            <a href="#faq" className="ph-mob-link" onClick={() => setMobileOpen(false)}>FAQ</a>

            <div className="ph-mob-ctas">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="ph-mob-cta" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Se connecter
              </Link>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="ph-mob-cta" style={{ background: 'linear-gradient(135deg,#4b78ff,#3360e6)', color: '#fff', boxShadow: '0 4px 14px rgba(75,120,255,0.3)' }}>
                Commencer →
              </Link>
            </div>
          </div>
        )}
      </motion.header>
    </>
  )
}
