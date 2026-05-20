import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — Patrimo',
  description: 'Contactez l\'équipe Patrimo pour toute question, suggestion ou signalement de bug.',
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ct-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.ct-c{max-width:900px;margin:0 auto;padding:0 40px}

.ct-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.ct-nav-inner{display:flex;align-items:center;justify-content:space-between}
.ct-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.ct-logo em{font-style:normal;color:#c96a4a}
.ct-back{font-family:'JetBrains Mono',monospace;font-size:12px;color:#8b8676;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.ct-back:hover{color:#c96a4a}

.ct-hero{padding:56px 0 48px}
.ct-rule{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:12px;margin-bottom:36px}
.ct-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}
.ct-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:800;letter-spacing:-.032em;line-height:1.0;margin:0 0 16px;color:#15140f}
.ct-hero h1 em{font-style:italic;font-family:'Playfair Display',serif;font-weight:500;color:#c96a4a}
.ct-hero p{font-size:16px;color:#5a5448;line-height:1.65;max-width:500px;margin:0}

.ct-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:0 0 100px;align-items:start}

.ct-card{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:20px;padding:32px}
.ct-card-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#c96a4a;text-transform:uppercase;margin-bottom:14px}
.ct-card h2{font-family:'Inter Tight',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.018em;color:#15140f;margin:0 0 10px}
.ct-card p{font-size:14px;color:#5a5448;line-height:1.7;margin:0 0 24px}
.ct-card a.ct-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:700;text-decoration:none;transition:background .18s}
.ct-card a.ct-btn:hover{background:#a84f35}
.ct-card a.ct-link{font-family:'JetBrains Mono',monospace;font-size:12px;color:#c96a4a;text-decoration:none;letter-spacing:.04em}
.ct-card a.ct-link:hover{text-decoration:underline}

.ct-channels{display:flex;flex-direction:column;gap:14px}
.ct-channel{display:flex;align-items:flex-start;gap:16px;background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:14px;padding:18px 20px}
.ct-channel-dot{width:8px;height:8px;border-radius:50%;background:#c96a4a;flex-shrink:0;margin-top:4px}
.ct-channel-label{font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:700;color:#15140f;margin:0 0 4px}
.ct-channel-desc{font-size:13px;color:#5a5448;margin:0 0 6px;line-height:1.5}
.ct-channel-link{font-family:'JetBrains Mono',monospace;font-size:11px;color:#c96a4a;text-decoration:none;letter-spacing:.04em}
.ct-channel-link:hover{text-decoration:underline}

.ct-legal-strip{border-top:1px solid rgba(21,20,15,.10);padding:24px 0 48px;display:flex;gap:24px;flex-wrap:wrap}
.ct-legal-strip a{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8b8676;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.ct-legal-strip a:hover{color:#c96a4a}

@media(max-width:768px){
  .ct-c{padding:0 20px}
  .ct-hero{padding:36px 0 32px}
  .ct-grid{grid-template-columns:1fr;gap:20px}
}
`

export default function Contact() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ct-root">
        <nav className="ct-nav">
          <div className="ct-c">
            <div className="ct-nav-inner">
              <Link href="/" className="ct-logo">Patri<em>mo</em></Link>
              <Link href="/" className="ct-back">← Accueil</Link>
            </div>
          </div>
        </nav>

        <section className="ct-hero">
          <div className="ct-c">
            <div className="ct-rule">
              <span>Ressources</span>
              <span className="ct-rule-sep" />
              <span>Contact</span>
            </div>
            <h1>Une question ?<br /><em>On répond.</em></h1>
            <p>L&apos;équipe Patrimo est joignable par e-mail pour toute question, suggestion ou signalement de bug. Nous répondons sous 48h ouvrées.</p>
          </div>
        </section>

        <div className="ct-c">
          <div className="ct-grid">
            <div>
              <div className="ct-card">
                <div className="ct-card-tag">Contact principal</div>
                <h2>Nous écrire</h2>
                <p>Pour toute question sur le service, un bug rencontré ou une suggestion d&apos;amélioration, notre adresse e-mail est le moyen le plus rapide de nous joindre.</p>
                <a href="mailto:contact@digitalstack.cloud" className="ct-btn">contact@digitalstack.cloud →</a>
              </div>
            </div>

            <div className="ct-channels">
              <div className="ct-channel">
                <div className="ct-channel-dot" />
                <div>
                  <p className="ct-channel-label">Bug ou erreur de calcul</p>
                  <p className="ct-channel-desc">Précisez le simulateur concerné, les paramètres utilisés et le résultat attendu.</p>
                  <a href="mailto:contact@digitalstack.cloud?subject=Bug%20Patrimo" className="ct-channel-link">Signaler un bug →</a>
                </div>
              </div>

              <div className="ct-channel">
                <div className="ct-channel-dot" />
                <div>
                  <p className="ct-channel-label">Suggestion de fonctionnalité</p>
                  <p className="ct-channel-desc">Un simulateur manquant, une enveloppe non couverte ? Vos retours façonnent la roadmap.</p>
                  <a href="mailto:contact@digitalstack.cloud?subject=Suggestion%20Patrimo" className="ct-channel-link">Faire une suggestion →</a>
                </div>
              </div>

              <div className="ct-channel">
                <div className="ct-channel-dot" />
                <div>
                  <p className="ct-channel-label">Données personnelles (RGPD)</p>
                  <p className="ct-channel-desc">Droit d&apos;accès, rectification, effacement ou portabilité de vos données.</p>
                  <a href="/rgpd" className="ct-channel-link">Voir vos droits →</a>
                </div>
              </div>

              <div className="ct-channel">
                <div className="ct-channel-dot" />
                <div>
                  <p className="ct-channel-label">Partenariat ou presse</p>
                  <p className="ct-channel-desc">Pour tout autre sujet professionnel, mentionnez l&apos;objet dans votre e-mail.</p>
                  <a href="mailto:contact@digitalstack.cloud?subject=Partenariat%20Patrimo" className="ct-channel-link">Nous contacter →</a>
                </div>
              </div>
            </div>
          </div>

          <div className="ct-legal-strip">
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/politique-confidentialite">Confidentialité</Link>
            <Link href="/cgu">CGU</Link>
            <Link href="/rgpd">RGPD</Link>
          </div>
        </div>
      </div>
    </>
  )
}
