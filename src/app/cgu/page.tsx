import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Patrimo",
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
    title: '1. Objet',
    content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service PatrImo, accessible à l'adresse finance.digitalstack.cloud. En accédant au service, vous acceptez sans réserve les présentes CGU.`,
  },
  {
    title: '2. Description du service',
    content: `PatrImo est une application web de simulation financière personnelle. Elle propose des calculateurs pour l'épargne, l'immobilier, la fiscalité et le budget. Les résultats fournis sont des estimations à titre indicatif uniquement et ne constituent pas des conseils financiers professionnels.`,
  },
  {
    title: '3. Accès au service',
    content: `L'accès au service est gratuit et nécessite la création d'un compte via Google OAuth. Vous devez avoir au moins 18 ans pour utiliser PatrImo. Vous êtes responsable de la confidentialité de votre compte.`,
  },
  {
    title: '4. Utilisation acceptable',
    content: `Vous vous engagez à utiliser PatrImo uniquement à des fins personnelles et légales. Il est interdit de :\n• Tenter de compromettre la sécurité du service\n• Utiliser le service à des fins commerciales sans autorisation\n• Soumettre des données fausses ou trompeuses\n• Contourner les mesures d'accès au service`,
  },
  {
    title: '5. Données et simulations',
    content: `Les simulations que vous sauvegardez restent votre propriété. PatrImo se réserve le droit de supprimer des données inactives après 12 mois sans connexion, après notification préalable par e-mail.`,
  },
  {
    title: '6. Limitation de responsabilité',
    content: `PatrImo fournit ses calculateurs "en l'état". Les résultats sont des estimations basées sur les paramètres fournis. PatrImo ne garantit pas l'exactitude, l'exhaustivité ou l'adéquation des résultats à votre situation personnelle.\n\nPatrImo ne saurait être tenu responsable de décisions financières prises sur la base de ces simulations. Consultez un conseiller financier, fiscal ou juridique agréé pour toute décision importante.`,
  },
  {
    title: '7. Disponibilité du service',
    content: `PatrImo s'efforce d'assurer une disponibilité maximale du service mais ne peut garantir un accès ininterrompu. Des maintenances peuvent être planifiées avec préavis.`,
  },
  {
    title: '8. Modification des CGU',
    content: `PatrImo se réserve le droit de modifier les présentes CGU. En cas de modification substantielle, les utilisateurs seront notifiés par e-mail. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.`,
  },
  {
    title: '9. Résiliation',
    content: `Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre compte. PatrImo se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU.`,
  },
  {
    title: '10. Droit applicable',
    content: `Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la juridiction des tribunaux compétents de France.`,
  },
]

export default function CGU() {
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
              <span>CGU</span>
            </div>
            <h1>Conditions <em>d&apos;utilisation</em></h1>
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
