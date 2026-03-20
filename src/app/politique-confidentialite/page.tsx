import Link from 'next/link'
import { PatrimoLogo } from '@/components/PatrimoLogo'

export const metadata = {
  title: 'Politique de confidentialité — PatrImo',
}

export default function PolitiqueConfidentialite() {
  return (
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <PatrimoLogo width={120} uid="politique" />
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Retour</Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px 100px' }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 400, letterSpacing: '-0.025em', marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 48 }}>Dernière mise à jour : février 2026</p>

        {[
          {
            title: '1. Responsable du traitement',
            content: `PatrImo (DigitalStack) est responsable du traitement de vos données personnelles.\nContact : contact@digitalstack.cloud`,
          },
          {
            title: '2. Données collectées',
            content: `Lors de votre inscription et utilisation du service, nous collectons :\n• Nom et adresse e-mail (via Google OAuth)\n• Photo de profil (optionnelle, fournie par Google)\n• Données de simulation que vous saisissez\n• Données d'utilisation anonymisées (pages visitées, modules utilisés)\n\nNous ne collectons aucune donnée bancaire, aucun RIB, aucun accès à vos comptes financiers.`,
          },
          {
            title: '3. Finalités du traitement',
            content: `Vos données sont utilisées pour :\n• Fournir et améliorer le service PatrImo\n• Sauvegarder et restaurer vos simulations\n• Vous envoyer des communications liées au service (si vous y avez consenti)\n• Assurer la sécurité du service`,
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
            content: `Conformément au RGPD, vous disposez des droits suivants :\n• Droit d'accès à vos données\n• Droit de rectification\n• Droit à l'effacement (\"droit à l'oubli\")\n• Droit à la portabilité\n• Droit d'opposition\n\nPour exercer ces droits, contactez-nous à : contact@digitalstack.cloud`,
          },
          {
            title: '8. Sécurité',
            content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement HTTPS/TLS, authentification OAuth 2.0 via Google, accès restreint aux bases de données.`,
          },
          {
            title: '9. Cookies',
            content: `Nous utilisons uniquement des cookies de session nécessaires à l'authentification. Aucun cookie publicitaire ou analytique tiers n'est déposé sur votre appareil.`,
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
