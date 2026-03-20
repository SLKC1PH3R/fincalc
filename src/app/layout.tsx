import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'PatrImo — Outils de Finance Personnelle',
  description: 'Calculateurs financiers : intérêts composés, FI/RE, impôts, prêt immobilier',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
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
