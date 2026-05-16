import Link from 'next/link'
import type { Metadata } from 'next'
import { ToolsGrid } from './ToolsGrid'

export const metadata: Metadata = {
  title: '18 Simulateurs fiscaux gratuits — Patrimo',
  description: 'Flat tax vs barème, PEA vs CTO, FIRE, retraite, immobilier. 18 simulateurs pour piloter votre patrimoine. Gratuit, sans inscription.',
  openGraph: {
    title: '18 Simulateurs fiscaux gratuits — Patrimo',
    description: '18 simulateurs pour piloter votre patrimoine, vos investissements et votre fiscalité.',
    url: 'https://finance.digitalstack.cloud/tools',
  },
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.tz-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.tz-c{max-width:1160px;margin:0 auto;padding:0 40px}

/* Nav */
.tz-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0;display:flex;align-items:center}
.tz-nav-inner{display:flex;align-items:center;justify-content:space-between;width:100%}
.tz-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.tz-logo em{font-style:normal;color:#c96a4a}
.tz-nav-links{display:flex;align-items:center;gap:28px}
.tz-nav-links a{font-family:'Inter',sans-serif;font-size:13px;color:#5a5448;text-decoration:none;transition:color .15s}
.tz-nav-links a:hover{color:#15140f}
.tz-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;background:#15140f;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:600;text-decoration:none;transition:background .18s}
.tz-nav-cta:hover{background:#c96a4a}

/* Rule */
.tz-rule{display:flex;align-items:center;gap:20px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:14px;margin-bottom:48px}
.tz-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}

/* Hero */
.tz-hero{padding:64px 0 56px}
.tz-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(42px,5.5vw,72px);font-weight:800;letter-spacing:-.032em;line-height:1.0;margin:0 0 20px;color:#15140f}
.tz-hero h1 em{font-style:italic;font-family:'Playfair Display',serif;font-weight:500;color:#c96a4a}
.tz-hero p{font-size:16px;color:#5a5448;max-width:520px;line-height:1.65;margin:0 0 36px}
.tz-hero-meta{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.tz-hero-stat{display:flex;align-items:baseline;gap:6px}
.tz-hero-stat strong{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:500;color:#c96a4a}
.tz-hero-stat span{font-size:12px;color:#8b8676;font-family:'Inter',sans-serif}

/* Section */
.tz-sec{padding:0 0 96px}

/* CTA block */
.tz-cta-block{background:#15140f;border-radius:24px;padding:64px 48px;display:flex;align-items:center;justify-content:space-between;gap:32px;margin-top:16px}
.tz-cta-block h3{font-family:'Inter Tight',sans-serif;font-size:clamp(22px,2.5vw,32px);font-weight:800;letter-spacing:-.022em;color:#efe7d2;margin:0 0 10px}
.tz-cta-block p{font-size:14px;color:#8b8676;margin:0;line-height:1.6;max-width:440px}
.tz-cta-btn{display:inline-flex;align-items:center;gap:10px;padding:13px 26px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background .18s}
.tz-cta-btn:hover{background:#a84f35}
.tz-back{display:inline-flex;align-items:center;gap:6px;font-family:'Inter',sans-serif;font-size:13px;color:#8b8676;text-decoration:none;margin-bottom:32px;transition:color .15s}
.tz-back:hover{color:#15140f}

@media(max-width:768px){
  .tz-c{padding:0 20px}
  .tz-hero{padding:40px 0 36px}
  .tz-cta-block{flex-direction:column;align-items:flex-start;padding:36px 28px}
  .tz-nav-links{display:none}
}
`

export default function ToolsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="tz-root">
        {/* Nav */}
        <nav className="tz-nav">
          <div className="tz-c" style={{ width:'100%' }}>
            <div className="tz-nav-inner">
              <Link href="/" className="tz-logo">Patri<em>mo</em></Link>
              <div className="tz-nav-links">
                <Link href="/#enveloppes">Enveloppes</Link>
                <Link href="/tools">Simulateurs</Link>
                <Link href="/dashboard">Dashboard</Link>
              </div>
              <Link href="/login" className="tz-nav-cta">Démarrer →</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="tz-hero">
          <div className="tz-c">
            <div className="tz-rule">
              <span>Simulateurs / 18 outils</span>
              <span className="tz-rule-sep" />
              <span>001 / 018</span>
            </div>
            <h1>18 simulateurs.<br /><em>Votre avenir,</em> calculé.</h1>
            <p>Flat tax vs barème, PEA vs CTO, FIRE, retraite, immobilier. Tous les outils pour décider avant d&apos;agir — gratuit, sans inscription.</p>
            <div className="tz-hero-meta">
              <div className="tz-hero-stat"><strong>18</strong><span>simulateurs</span></div>
              <div className="tz-hero-stat"><strong>0</strong><span>donnée bancaire</span></div>
              <div className="tz-hero-stat"><strong>100%</strong><span>gratuit</span></div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="tz-sec">
          <div className="tz-c">
            <ToolsGrid />
          </div>
        </section>

        {/* CTA */}
        <div className="tz-c" style={{ paddingBottom: 96 }}>
          <div className="tz-cta-block">
            <div>
              <h3>Sauvegardez vos simulations.</h3>
              <p>Créez un compte gratuit pour accéder à votre historique, votre patrimoine et votre score patrimonial sur 7 dimensions.</p>
            </div>
            <Link href="/login" className="tz-cta-btn">Démarrer gratuitement →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
