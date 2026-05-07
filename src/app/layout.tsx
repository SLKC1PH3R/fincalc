import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import { SplashScreen } from '@/components/SplashScreen'

export const metadata: Metadata = {
  metadataBase: new URL('https://finance.digitalstack.cloud'),
  title: 'PatrImo — Outils de Finance Personnelle',
  description: 'Simulateurs financiers gratuits pour investisseurs français — FI/RE, prêt immobilier, impôts 2026, score patrimonial. Sans données bancaires.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'PatrImo — Outils de Finance Personnelle',
    description: 'Simulateurs financiers gratuits pour investisseurs français — FI/RE, prêt immobilier, impôts 2026, score patrimonial. Sans données bancaires.',
    url: 'https://finance.digitalstack.cloud',
    siteName: 'PatrImo',
    images: [{ url: '/1.png', width: 1280, height: 800, alt: 'PatrImo — Dashboard patrimoine' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PatrImo — Outils de Finance Personnelle',
    description: 'Simulateurs financiers gratuits pour investisseurs français — FI/RE, prêt immobilier, impôts 2026, score patrimonial. Sans données bancaires.',
    images: ['/1.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body>
        <Providers>
          <SplashScreen />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
