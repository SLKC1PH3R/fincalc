import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const APP_URL = 'https://finance.digitalstack.cloud'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PatrImo — Pilotez votre patrimoine. Gratuitement.',
    template: '%s · PatrImo',
  },
  description:
    'PatrImo : 18 simulateurs financiers gratuits — intérêts composés, FI/RE, impôts IR, prêt immobilier, flat tax, patrimoine. Fiscalité 2026. Sans compte bancaire. 100 % gratuit.',
  keywords: [
    'simulateur financier gratuit',
    'calculateur intérêts composés',
    'simulateur FIRE indépendance financière',
    'simulateur impôts IR 2026',
    'flat tax vs barème',
    'PEA CTO assurance vie comparatif',
    'patrimoine personnel suivi',
    'simulateur prêt immobilier',
    'calculateur retraite',
    'outil finance personnelle france',
  ],
  authors: [{ name: 'PatrImo', url: APP_URL }],
  creator: 'PatrImo',
  publisher: 'PatrImo',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: APP_URL,
    siteName: 'PatrImo',
    title: 'PatrImo — Pilotez votre patrimoine. Gratuitement.',
    description:
      '18 simulateurs financiers gratuits : FI/RE, intérêts composés, impôts 2026, immobilier. Suivez votre patrimoine sans partager vos données bancaires.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PatrImo — Simulateurs financiers gratuits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PatrImo — Pilotez votre patrimoine. Gratuitement.',
    description: '18 simulateurs financiers gratuits. FI/RE, intérêts composés, impôts 2026, immobilier. 100 % gratuit, aucune donnée bancaire.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  alternates: {
    canonical: APP_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
