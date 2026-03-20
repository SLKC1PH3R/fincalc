import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import { ToolsGrid } from './ToolsGrid'

export const metadata: Metadata = {
  title: 'Simulateurs financiers gratuits — FinCalc',
  description: 'Calculez vos intérêts composés, simulez votre retraite FIRE, optimisez vos impôts et votre crédit immobilier. Gratuit, sans inscription.',
  openGraph: {
    title: 'Simulateurs financiers gratuits — FinCalc',
    description: '18 simulateurs pour piloter votre patrimoine, vos investissements et votre fiscalité.',
    url: 'https://app.fincalc.fr/tools',
  },
}

export default function ToolsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c8922a, #f1c086)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 16, height: 16, color: '#000' }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>FinCalc</span>
          </Link>
          <Link href="/login" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: 20, background: 'rgba(241,192,134,0.10)', border: '1px solid rgba(241,192,134,0.25)', color: '#f1c086', fontSize: 13, fontWeight: 600 }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(241,192,134,0.08)', border: '1px solid rgba(241,192,134,0.2)', fontSize: 12, color: '#f1c086', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 16 }}>
            18 SIMULATEURS GRATUITS
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Simulateurs financiers
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto' }}>
            Calculez, simulez et optimisez votre patrimoine. Gratuit, sans inscription, sans données bancaires.
          </p>
        </div>

        <ToolsGrid />

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: '40px 24px', borderRadius: 20, background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.15)' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>Sauvegardez vos simulations</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>Créez un compte gratuit pour accéder à votre historique, votre patrimoine et toutes les fonctionnalités avancées.</p>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 24, background: 'linear-gradient(135deg, #c8922a, #f1c086)', color: '#000', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Démarrer gratuitement →
          </Link>
        </div>
      </main>
    </div>
  )
}
