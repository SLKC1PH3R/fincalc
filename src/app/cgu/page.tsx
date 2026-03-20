import Link from 'next/link'
import { PatrimoLogo } from '@/components/PatrimoLogo'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — PatrImo',
}

export default function CGU() {
  return (
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <PatrimoLogo width={120} uid="cgu" />
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Retour</Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px 100px' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 400, letterSpacing: '-0.025em', marginBottom: 8 }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 48 }}>Dernière mise à jour : février 2026</p>

        {[
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
