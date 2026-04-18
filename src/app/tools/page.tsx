import Link from 'next/link'
import { PatrimoLogo } from '@/components/PatrimoLogo'
import type { Metadata } from 'next'
import { ToolsGrid } from './ToolsGrid'

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
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #f3f4f6', padding: '16px 0', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <PatrimoLogo width={130} uid="tools" />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500, color: '#6b7280', padding: '8px 14px', borderRadius: 10, transition: 'color 0.15s' }}>
              Se connecter
            </Link>
            <Link href="/login" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 12px rgba(124,58,237,0.25)' }}>
              Créer un compte gratuit →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 40%, #ffffff 100%)', padding: '64px 24px 56px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(167,139,250,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -100, width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            18 simulateurs gratuits
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.04em', lineHeight: 1.1, color: '#1e1b4b' }}>
            Simulateurs financiers
          </h1>
          <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 520, margin: '0 auto 0', lineHeight: 1.65 }}>
            Calculez, simulez et optimisez votre patrimoine. Gratuit, sans inscription, sans données bancaires.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <ToolsGrid />

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 32, padding: '44px 24px', borderRadius: 24, background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px', color: '#1e1b4b', letterSpacing: '-0.02em' }}>Sauvegardez vos simulations</h3>
          <p style={{ fontSize: 15, color: '#6b7280', margin: '0 0 24px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
            Créez un compte gratuit pour accéder à votre historique, votre patrimoine et toutes les fonctionnalités avancées.
          </p>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 24, background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            Démarrer gratuitement →
          </Link>
        </div>
      </main>
    </div>
  )
}
