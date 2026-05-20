import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'À propos — Patrimo',
  description: 'Patrimo est une plateforme Patrimoniale gratuite, conçue pour démocratiser la planification financière personnelle en France.',
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ab-root{background:#efe7d2;color:#15140f;font-family:'Inter','Inter Tight',system-ui,sans-serif;min-height:100vh;-webkit-font-smoothing:antialiased}
.ab-c{max-width:900px;margin:0 auto;padding:0 40px}

.ab-nav{position:sticky;top:0;z-index:50;background:#efe7d2;border-bottom:1px solid rgba(21,20,15,.10);padding:18px 0}
.ab-nav-inner{display:flex;align-items:center;justify-content:space-between}
.ab-logo{font-family:'Inter Tight',sans-serif;font-weight:800;font-size:17px;color:#15140f;text-decoration:none;letter-spacing:-.02em}
.ab-logo em{font-style:normal;color:#c96a4a}
.ab-back{font-family:'JetBrains Mono',monospace;font-size:12px;color:#8b8676;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.ab-back:hover{color:#c96a4a}

.ab-hero{padding:56px 0 48px}
.ab-rule{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:12px;margin-bottom:36px}
.ab-rule-sep{flex:1;height:1px;background:rgba(21,20,15,.10)}
.ab-hero h1{font-family:'Inter Tight',sans-serif;font-size:clamp(36px,5vw,64px);font-weight:800;letter-spacing:-.032em;line-height:1.0;margin:0 0 20px;color:#15140f}
.ab-hero h1 em{font-style:italic;font-family:'Playfair Display',serif;font-weight:500;color:#c96a4a}
.ab-hero p{font-size:16px;color:#5a5448;line-height:1.65;max-width:540px;margin:0}

.ab-mission{background:#15140f;border-radius:20px;padding:40px;margin:48px 0}
.ab-mission-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#c96a4a;text-transform:uppercase;margin-bottom:14px}
.ab-mission h2{font-family:'Inter Tight',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.018em;color:#efe7d2;margin:0 0 12px}
.ab-mission p{font-size:14px;color:#8b8676;line-height:1.75;margin:0;max-width:540px}

.ab-values{padding:0 0 48px}
.ab-values-title{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:12px;margin-bottom:24px}
.ab-values-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
.ab-value-card{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:14px;padding:22px}
.ab-value-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;color:#c96a4a;text-transform:uppercase;margin-bottom:10px}
.ab-value-card h3{font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;color:#15140f;margin:0 0 8px}
.ab-value-card p{font-size:13px;color:#5a5448;line-height:1.6;margin:0}

.ab-tech{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:20px;padding:32px;margin-bottom:48px}
.ab-tech-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#8b8676;text-transform:uppercase;margin-bottom:14px}
.ab-tech h2{font-family:'Inter Tight',sans-serif;font-size:18px;font-weight:800;letter-spacing:-.015em;color:#15140f;margin:0 0 10px}
.ab-tech p{font-size:14px;color:#5a5448;line-height:1.7;margin:0 0 18px}
.ab-tech-tags{display:flex;flex-wrap:wrap;gap:8px}
.ab-tech-tag-item{padding:5px 14px;border-radius:999px;background:#efe7d2;border:1px solid rgba(21,20,15,.12);font-family:'JetBrains Mono',monospace;font-size:11px;color:#5a5448;letter-spacing:.04em}

.ab-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(21,20,15,.10);border:1px solid rgba(21,20,15,.10);border-radius:16px;overflow:hidden;margin-bottom:48px}
.ab-stat{background:#faf6ec;padding:24px;text-align:center}
.ab-stat strong{display:block;font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:500;color:#c96a4a;margin-bottom:6px}
.ab-stat span{font-size:12px;color:#8b8676;font-family:'Inter',sans-serif}

.ab-cta{background:#15140f;border-radius:20px;padding:40px;display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:80px}
.ab-cta h2{font-family:'Inter Tight',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.018em;color:#efe7d2;margin:0 0 8px}
.ab-cta p{font-size:14px;color:#8b8676;margin:0}
.ab-cta-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;background:#c96a4a;color:#efe7d2;font-family:'Inter Tight',sans-serif;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background .18s}
.ab-cta-btn:hover{background:#a84f35}

@media(max-width:768px){
  .ab-c{padding:0 20px}
  .ab-hero{padding:36px 0 32px}
  .ab-values-grid{grid-template-columns:1fr 1fr}
  .ab-stats{grid-template-columns:1fr}
  .ab-cta{flex-direction:column;align-items:flex-start;padding:28px}
}
`

const VALUES = [
  { num: '01', title: 'Simplicité', desc: 'Des outils puissants accessibles à tous, sans jargon inutile.' },
  { num: '02', title: 'Confidentialité', desc: 'Vos données ne sont jamais vendues ni partagées. Point final.' },
  { num: '03', title: 'Précision', desc: 'Modèles financiers précis, mis à jour chaque année avec la fiscalité française.' },
  { num: '04', title: 'Gratuité', desc: "Patrimo sera toujours gratuit. C'est une promesse, pas un argument marketing." },
]

const TECHS = ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'NextAuth', 'PostgreSQL', 'Vercel', 'Recharts', 'Prisma']

export default function About() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="ab-root">
        <nav className="ab-nav">
          <div className="ab-c">
            <div className="ab-nav-inner">
              <Link href="/" className="ab-logo">Patri<em>mo</em></Link>
              <Link href="/" className="ab-back">← Accueil</Link>
            </div>
          </div>
        </nav>

        <section className="ab-hero">
          <div className="ab-c">
            <div className="ab-rule">
              <span>Ressources</span>
              <span className="ab-rule-sep" />
              <span>À propos</span>
            </div>
            <h1>La finance,<br /><em>démocratisée.</em></h1>
            <p>Patrimo est né d&apos;un constat simple : les outils de simulation financière disponibles en France sont soit trop complexes, soit trop imprécis, soit noyés dans la publicité. Nous avons voulu créer l&apos;alternative.</p>
          </div>
        </section>

        <div className="ab-c">
          <div className="ab-stats">
            <div className="ab-stat"><strong>18</strong><span>simulateurs fiscaux</span></div>
            <div className="ab-stat"><strong>15</strong><span>modules Patrimoniaux</span></div>
            <div className="ab-stat"><strong>100%</strong><span>gratuit, sans publicité</span></div>
          </div>

          <div className="ab-mission">
            <div className="ab-mission-tag">Mission</div>
            <h2>Comprendre avant d&apos;agir.</h2>
            <p>Offrir à chaque investisseur français — qu&apos;il commence à épargner, achète son premier bien immobilier ou planifie sa retraite — des outils de qualité professionnelle, gratuits, sans publicité et respectueux de ses données.</p>
          </div>

          <div className="ab-values">
            <div className="ab-values-title">Nos valeurs</div>
            <div className="ab-values-grid">
              {VALUES.map(v => (
                <div key={v.num} className="ab-value-card">
                  <div className="ab-value-num">{v.num}</div>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ab-tech">
            <div className="ab-tech-tag">Stack technique</div>
            <h2>Open-source par nature</h2>
            <p>Patrimo est construit avec des technologies modernes et éprouvées. Transparence technique totale.</p>
            <div className="ab-tech-tags">
              {TECHS.map(t => (
                <span key={t} className="ab-tech-tag-item">{t}</span>
              ))}
            </div>
          </div>

          <div className="ab-cta">
            <div>
              <h2>Essayer Patrimo</h2>
              <p>Gratuit, sans connexion bancaire, sans publicité.</p>
            </div>
            <Link href="/login" className="ab-cta-btn">Créer un compte →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
