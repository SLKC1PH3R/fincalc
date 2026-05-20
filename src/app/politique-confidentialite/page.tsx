import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Patrimo',
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
    title: '1. Responsable du traitement',
    content: `Patrimo (DigitalStack) est responsable du traitement de vos données personnelles.\nContact : contact@digitalstack.cloud`,
  },
  {
    title: '2. Données collectées',
    content: `Lors de votre inscription et utilisation du service, nous collectons :\n• Nom et adresse e-mail (via Google OAuth)\n• Photo de profil (optionnelle, fournie par Google)\n• Données de simulation que vous saisissez\n• Données d'utilisation anonymisées (pages visitées, modules utilisés)\n\nNous ne collectons aucune donnée bancaire, aucun RIB, aucun accès à vos comptes financiers.`,
  },
  {
    title: '3. Finalités du traitement',
    content: `Vos données sont utilisées pour :\n• Fournir et améliorer le service Patrimo\n• Sauvegarder et restaurer vos simulations\n• Vous envoyer des communications liées au service (si vous y avez consenti)\n• Assurer la sécurité du service`,
  },
  {
    title: '4. Base légale',
    content: `Le traitement de vos données repose sur :\n• L'exécution du contrat (fourniture du service)\n• Votre consentement pour les communications marketing\n• Notre intérêt légitime pour améliorer le service`,
  },
  {
    title: '5. Conservation des données',
    content: `Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de compte, vos données sont effacées dans un délai de 30 jours.`,
  },
  {
    title: '6. Partage des données',
    content: `Vos données ne sont jamais vendues ni partagées avec des tiers à des fins commerciales. Elles peuvent être partagées uniquement avec nos prestataires techniques (Vercel pour l'hébergement, Neon pour la base de données) dans le cadre strict de la fourniture du service.`,
  },
  {
    title: '7. Vos droits (RGPD)',
    content: `Conformément au RGPD, vous disposez des droits suivants :\n• Droit d'accès à vos données\n• Droit de rectification\n• Droit à l'effacement ("droit à l'oubli")\n• Droit à la portabilité\n• Droit d'opposition\n\nPour exercer ces droits, contactez-nous à : contact@digitalstack.cloud`,
  },
  {
    title: '8. Sécurité',
    content: `Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des données au repos (AES-256), chiffrement en transit (HTTPS/TLS 1.3), authentification renforcée via OAuth 2.0 (Google), accès restreint aux bases de données. Vos données ne sont jamais partagées avec des tiers à des fins commerciales.`,
  },
  {
    title: '9. Cookies',
    content: `Nous utilisons uniquement des cookies de session nécessaires à l'authentification. Aucun cookie publicitaire ou analytique tiers n'est déposé sur votre appareil.`,
  },
]

export default function PolitiqueConfidentialite() {
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
              <span>Confidentialité</span>
            </div>
            <h1>Politique de <em>confidentialité</em></h1>
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
