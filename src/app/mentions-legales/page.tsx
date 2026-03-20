import Link from 'next/link'
import { PatrimoLogo } from '@/components/PatrimoLogo'

export const metadata = {
  title: 'Mentions légales — PatrImo',
}

export default function MentionsLegales() {
  return (
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <PatrimoLogo width={120} uid="mentions" />
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Retour</Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px 100px' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 400, letterSpacing: '-0.025em', marginBottom: 8 }}>
          Mentions légales
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 48 }}>Dernière mise à jour : février 2026</p>

        {[
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
        ].map(({ title, content }) => (
          <section key={title} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{content}</p>
          </section>
        ))}
      </main>
    </div>
  )
}
