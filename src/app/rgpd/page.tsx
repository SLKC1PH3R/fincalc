import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RGPD — Vos droits sur vos données — Patrimo',
  description: 'Patrimo respecte le Règlement Général sur la Protection des Données (RGPD). Découvrez vos droits et comment exercer votre contrôle sur vos données personnelles.',
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
.lp-hero p{font-size:15px;color:#5a5448;line-height:1.65;max-width:560px;margin:16px 0 0}
.lp-date{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8b8676;letter-spacing:.08em}

.lp-rights{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin:48px 0}
.lp-right-card{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:14px;padding:20px}
.lp-right-card-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#c96a4a;text-transform:uppercase;margin-bottom:10px}
.lp-right-card h3{font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;color:#15140f;margin:0 0 8px}
.lp-right-card p{font-size:13px;color:#5a5448;line-height:1.6;margin:0}

.lp-contact-block{background:#15140f;border-radius:20px;padding:40px;margin:48px 0}
.lp-contact-block h2{font-family:'Inter Tight',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.018em;color:#efe7d2;margin:0 0 10px}
.lp-contact-block p{font-size:14px;color:#8b8676;line-height:1.7;margin:0 0 24px;max-width:480px}
.lp-contact-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:700;text-decoration:none;transition:background .18s}
.lp-contact-btn:hover{background:#a84f35}

.lp-content{padding:0 0 100px}
.lp-section{margin-bottom:40px;padding-bottom:40px;border-bottom:1px solid rgba(21,20,15,.08)}
.lp-section:last-child{border-bottom:none}
.lp-section h2{font-family:'Inter Tight',sans-serif;font-size:15px;font-weight:700;letter-spacing:-.01em;color:#15140f;margin:0 0 14px;display:flex;align-items:center;gap:12px}
.lp-section h2::before{content:'';display:inline-block;width:3px;height:14px;background:#c96a4a;border-radius:2px;flex-shrink:0}
.lp-section p{font-size:14px;color:#5a5448;line-height:1.8;white-space:pre-line;margin:0}

@media(max-width:640px){.lp-c{padding:0 20px}.lp-hero{padding:36px 0 28px}.lp-rights{grid-template-columns:1fr 1fr}.lp-contact-block{padding:28px}}
`

const RIGHTS = [
  { num: 'ART. 15', title: "Droit d'accès", desc: "Obtenir une copie de toutes vos données personnelles que nous traitons." },
  { num: 'ART. 16', title: 'Droit de rectification', desc: "Corriger des données inexactes ou incomplètes vous concernant." },
  { num: 'ART. 17', title: "Droit à l'effacement", desc: "Demander la suppression de vos données (\"droit à l'oubli\")." },
  { num: 'ART. 18', title: 'Droit à la limitation', desc: "Limiter temporairement le traitement de vos données." },
  { num: 'ART. 20', title: 'Droit à la portabilité', desc: "Recevoir vos données dans un format structuré et lisible par machine." },
  { num: 'ART. 21', title: "Droit d'opposition", desc: "Vous opposer au traitement de vos données pour des intérêts légitimes." },
]

const SECTIONS = [
  {
    title: '1. Responsable du traitement',
    content: `Patrimo (DigitalStack) est le responsable du traitement de vos données personnelles au sens du RGPD (Règlement (UE) 2016/679).\n\nNom du responsable : Jeremy\nContact DPO : contact@digitalstack.cloud\nAdresse : France`,
  },
  {
    title: '2. Données que nous traitons',
    content: `Nous ne collectons que les données strictement nécessaires au fonctionnement du service :\n• Identité : nom, prénom, adresse e-mail (via Google OAuth)\n• Données de simulation : paramètres financiers que vous saisissez\n• Données techniques : adresse IP (logs de sécurité), identifiant de session\n\nNous ne collectons jamais : données bancaires, RIB, accès à vos comptes financiers, numéro de sécurité sociale.`,
  },
  {
    title: '3. Base légale du traitement',
    content: `• Exécution du contrat (art. 6.1.b) : pour fournir le service Patrimo\n• Consentement (art. 6.1.a) : pour les communications marketing optionnelles\n• Intérêt légitime (art. 6.1.f) : pour la sécurité et l'amélioration du service`,
  },
  {
    title: '4. Durée de conservation',
    content: `Vos données sont conservées pour la durée de vie de votre compte. En cas de suppression de compte, vos données personnelles sont effacées dans un délai maximum de 30 jours.\n\nLes logs de sécurité sont conservés 12 mois conformément aux obligations légales.`,
  },
  {
    title: '5. Transferts hors UE',
    content: `Certains prestataires techniques sont établis aux États-Unis (Vercel, Google). Ces transferts sont encadrés par des clauses contractuelles types (CCT) approuvées par la Commission européenne, conformément à l'art. 46 du RGPD.`,
  },
  {
    title: '6. Comment exercer vos droits',
    content: `Pour exercer l'un de vos droits, envoyez un e-mail à contact@digitalstack.cloud en précisant :\n• Le droit que vous souhaitez exercer\n• Votre adresse e-mail associée au compte Patrimo\n\nNous nous engageons à répondre dans un délai d'un mois (art. 12 RGPD). En cas de demande complexe, ce délai peut être porté à trois mois avec notification préalable.`,
  },
  {
    title: '7. Droit de réclamation',
    content: `Si vous estimez que le traitement de vos données n'est pas conforme au RGPD, vous pouvez introduire une réclamation auprès de la CNIL :\n\nCommission Nationale de l'Informatique et des Libertés\n3 Place de Fontenoy – TSA 80715\n75334 Paris Cedex 07\nwww.cnil.fr`,
  },
  {
    title: '8. Sécurité des données',
    content: `Patrimo met en oeuvre des mesures de sécurité adaptées au risque : chiffrement des données au repos (AES-256), chiffrement en transit (HTTPS/TLS 1.3), authentification renforcée via OAuth 2.0, accès restreint aux bases de données, journalisation des accès. Vos données ne sont jamais partagées avec des tiers à des fins commerciales.\n\nEn cas de violation de données susceptible d'engendrer un risque élevé pour vos droits, vous serez notifié dans les 72 heures conformément à l'art. 34 du RGPD.`,
  },
]

export default function RGPD() {
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
              <span>RGPD · UE 2016/679</span>
            </div>
            <h1>Vos <em>données,</em> vos droits.</h1>
            <p>Patrimo respecte pleinement le Règlement Général sur la Protection des Données. Voici tout ce que vous devez savoir sur la manière dont nous traitons vos informations et comment exercer vos droits.</p>
          </div>
        </section>

        <div className="lp-content">
          <div className="lp-c">
            <div className="lp-rights">
              {RIGHTS.map(r => (
                <div key={r.num} className="lp-right-card">
                  <div className="lp-right-card-num">{r.num}</div>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="lp-contact-block">
              <h2>Exercer un droit</h2>
              <p>Envoyez votre demande à contact@digitalstack.cloud. Nous répondrons dans un délai d&apos;un mois, conformément à l&apos;article 12 du RGPD.</p>
              <a href="mailto:contact@digitalstack.cloud" className="lp-contact-btn">Contacter le DPO →</a>
            </div>

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
