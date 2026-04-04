import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  metadataBase: new URL('https://finance.digitalstack.cloud'),
  title: 'PatrImo — Outils de Finance Personnelle',
  description: 'Le seul outil 100 % gratuit qui calcule vos impôts, simule votre FIRE et pilote votre patrimoine — sans jamais toucher à vos comptes bancaires.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'PatrImo — Outils de Finance Personnelle',
    description: 'Le seul outil 100 % gratuit qui calcule vos impôts, simule votre FIRE et pilote votre patrimoine — sans jamais toucher à vos comptes bancaires.',
    url: 'https://finance.digitalstack.cloud',
    siteName: 'PatrImo',
    images: [{ url: '/1.png', width: 1280, height: 800, alt: 'PatrImo — Dashboard patrimoine' }],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PatrImo — Outils de Finance Personnelle',
    description: 'Le seul outil 100 % gratuit qui calcule vos impôts, simule votre FIRE et pilote votre patrimoine.',
    images: ['/1.png'],
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
