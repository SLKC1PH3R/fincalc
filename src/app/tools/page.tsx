import Link from 'next/link'
import type { Metadata } from 'next'
import { ToolsGrid } from './ToolsGrid'
import { Nav } from '@/components/landing/Nav'

export const metadata: Metadata = {
  title: 'Simulateurs financiers gratuits — PatrImo',
  description: 'Calculez vos intérêts composés, simulez votre retraite FIRE, optimisez vos impôts et votre crédit immobilier. Gratuit, sans inscription.',
  openGraph: {
    title: 'Simulateurs financiers gratuits — PatrImo',
    description: '18 simulateurs pour piloter votre patrimoine, vos investissements et votre fiscalité.',
    url: 'https://finance.digitalstack.cloud/tools',
  },
}

export default function ToolsPage() {
  return (
    <div className="patrimo-landing" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: "'Geist', system-ui, -apple-system, sans-serif" }}>

      <Nav />

      {/* Hero */}
      <div style={{ padding: '80px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(var(--line-strong) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 80% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 40%, black, transparent)',
        }} />
        {/* Gold orb */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, var(--gold-tint-2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Eyebrow */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--gold)', display: 'inline-block' }} />
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--gold-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>18 simulateurs gratuits</span>
          </div>

          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)' }}>
            Simulateurs financiers<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>pour piloter votre avenir.</em>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontFamily: "'Geist', system-ui" }}>
            Calculez, simulez et optimisez votre patrimoine. Gratuit, sans inscription, sans données bancaires.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
        <ToolsGrid />

        {/* CTA */}
        <div style={{
          textAlign: 'center', marginTop: 32, padding: '56px 32px',
          borderRadius: 24,
          background: 'var(--surface)',
          border: '1px solid var(--line-strong)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '200%', background: 'radial-gradient(ellipse, var(--gold-tint) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: 'var(--gold)', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, fontWeight: 600, color: 'var(--gold-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>Compte gratuit</span>
            </div>
            <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              Sauvegardez vos simulations.
            </h3>
            <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 28px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, fontFamily: "'Geist', system-ui" }}>
              Créez un compte gratuit pour accéder à votre historique, votre patrimoine et toutes les fonctionnalités avancées.
            </p>
            <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Démarrer gratuitement →
            </Link>
          </div>
        </div>
      </main>

      <style>{`
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 999px;
          background: var(--ink); color: var(--bg);
          font-size: 14px; font-weight: 600; text-decoration: none;
          transition: transform .15s, box-shadow .15s;
          font-family: 'Geist', system-ui;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(10,10,10,0.18); }
      `}</style>
    </div>
  )
}
