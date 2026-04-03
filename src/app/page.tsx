import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { LandingClient } from '@/components/LandingClient'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://finance.digitalstack.cloud/#webapp',
      name: 'PatrImo',
      url: 'https://finance.digitalstack.cloud',
      description: '18 simulateurs financiers gratuits : intérêts composés, FI/RE, impôts IR 2026, prêt immobilier, flat tax vs barème, PEA/CTO/AV. Suivi de patrimoine sans données bancaires.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      inLanguage: 'fr',
      creator: {
        '@type': 'Organization',
        name: 'PatrImo',
        url: 'https://finance.digitalstack.cloud',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Est-ce vraiment gratuit, pour toujours ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, PatrImo est 100 % gratuit. Aucune fonctionnalité premium cachée, aucune limitation dans le temps, aucune carte bancaire requise.',
          },
        },
        {
          '@type': 'Question',
          name: 'Faut-il connecter mon compte bancaire ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non. PatrImo fonctionne sans aucun accès à vos comptes bancaires. Vous saisissez vous-même vos données — vous gardez le contrôle total.',
          },
        },
        {
          '@type': 'Question',
          name: 'Où sont stockées mes données ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vos données sont hébergées sur des serveurs sécurisés en Europe, conformément au RGPD. Elles ne sont jamais revendues, partagées, ni utilisées à des fins publicitaires.',
          },
        },
        {
          '@type': 'Question',
          name: 'Les calculs sont-ils fiables pour la fiscalité 2026 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les simulateurs utilisent les formules financières standards (intérêts composés, amortissement, TMI 2026, PFU 30%) et sont mis à jour chaque année.',
          },
        },
        {
          '@type': 'Question',
          name: 'PatrImo propose-t-il un simulateur FIRE ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui. PatrImo inclut un simulateur FI/RE complet qui calcule votre objectif de capital, votre date de liberté financière selon vos dépenses, taux d\'épargne et rendement.',
          },
        },
        {
          '@type': 'Question',
          name: 'Puis-je simuler un achat immobilier vs louer ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, le simulateur "Acheter vs Louer" compare le patrimoine généré sur 10, 15 ou 20 ans selon votre capacité d\'emprunt, apport et loyer actuel.',
          },
        },
      ],
    },
  ],
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard/patrimoine')
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
