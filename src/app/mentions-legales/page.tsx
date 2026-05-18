import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — Patrimo',
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.lp-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.lp-c{max-width:800px;margin:0 auto;padding:0 40px}

.lp-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.lp-nav-inner{display:flex;align-items:center;justify-content:space-between}
.lp-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.lp-logo em{font-style:normal;color:#c96a4a}
.lp-back{font-family:'JetBrains Mono',monospace;font-size:12px;color:#8b8676;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.lp-back:hover{color:#c96a4a}

.lp-hero{padding:56px 0 40px}
.lp-rule{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:12px;margin-bottom:36px}
.lp-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}
.lp-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(32px,4vw,52px);font-weight:800;letter-spacing:-.028em;line-height:1.05;margin:0 0 14px;color:#15140f}
.lp-hero h1 em{font-style:italic;font-family:'Playfair Display',serif;font-weight:500;color:#c96a4a}
.lp-date{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8b8676;letter-spacing:.08em}

.lp-content{padding:0 0 100px}
.lp-section{margin-bottom:40px;padding-bottom:40px;border-bottom:1px solid rgba(21,20,15,.08)}
.lp-section:last-child{border-bottom:none}
.lp-section h2{font-family:'Inter Tight',sans-serif;font-size:15px;font-weight:700;letter-spacing:-.01em;color:#15140f;margin:0 0 14px;display:flex;align-items:center;gap:12px}
.lp-section h2::before{content:'';display:inline-block;width:3px;height:14px;background:#c96a4a;border-radius:2px;flex-shrink:0}
.lp-section p{font-size:14px;color:#5a5448;line-height:1.8;white-space:pre-line;margin:0}

@media(max-width:640px){.lp-c{padding:0 20px}.lp-hero{padding:36px 0 28px}}
`

const SECTIONS = [
  {
    title: '1. Éditeur du site',
    content: `Le site PatrImo (accessible à l'adresse finance.digitalstack.cloud) est édité par DigitalStack, entreprise individuelle immatriculée en France.\n\nResponsable de la publication : Jeremy\nContact : contact@digitalstack.cloud`,
  },
  {
    title: '2. Hébergement',
    content: `Le site est hébergé par Vercel Inc.\n350 Bush Street, Floor 13\nSan Francisco, CA 94104, États-Unis\nhttps://vercel.com`,
  },
  {
    title: '3. Propriété intellectuelle',
    content: `L'ensemble du contenu de ce site (textes, graphismes, logotypes, icônes, images) est la propriété exclusive de PatrImo ou de ses partenaires. Toute reproduction, distribution ou utilisation sans autorisation préalable est interdite.`,
  },
  {
    title: '4. Limitation de responsabilité',
    content: `Les calculs et simulations fournis par PatrImo sont à titre purement indicatif. Ils ne constituent pas un conseil financier, fiscal ou juridique. PatrImo décline toute responsabilité pour les décisions prises sur la base de ces simulations. Consultez un professionnel agréé pour vos décisions d'investissement.`,
  },
  {
    title: '5. Données personnelles',
    content: `Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à : contact@digitalstack.cloud.\n\nPour plus d'informations, consultez notre Politique de confidentialité.`,
  },
  {
    title: '6. Cookies',
    content: `PatrImo utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.`,
  },
  {
    title: '7. Droit applicable',
    content: `Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.`,
  },
]

export default function MentionsLegales() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="lp-root">
        <nav className="lp-nav">
          <div className="lp-c">
            <div className="lp-nav-inner">
              <Link href="/" className="lp-logo">Patri<em>mo</em></Link>
              <Link href="/" className="lp-back">← Accueil</Link>
            </div>
          </div>
        </nav>

        <section className="lp-hero">
          <div className="lp-c">
            <div className="lp-rule">
              <span>Légal</span>
              <span className="lp-rule-sep" />
              <span>Mentions légales</span>
            </div>
            <h1>Mentions <em>légales</em></h1>
            <p className="lp-date">Dernière mise à jour : février 2026</p>
          </div>
        </section>

        <div className="lp-content">
          <div className="lp-c">
            {SECTIONS.map(({ title, content }) => (
              <section key={title} className="lp-section">
                <h2>{title}</h2>
                <p>{content}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
