import Link from 'next/link'
import type { Metadata } from 'next'
import {
  TrendingUp,
  Building2,
  Home,
  PiggyBank,
  Bitcoin,
  Wallet,
  Receipt,
  Layers,
  BarChart3,
  RefreshCw,
  Star,
  BookOpen,
  Calculator,
  Award,
  Globe,
} from 'lucide-react'
import { PatrimoLogo } from '@/components/PatrimoLogo'

export const metadata: Metadata = {
  title: 'Gestion patrimoniale — PatrImo',
  description:
    'Suivez et gérez votre patrimoine en temps réel : immobilier, actions, livrets, crypto, PEA, assurance vie et plus. 15 pages de gestion patrimoniale gratuites.',
  openGraph: {
    title: 'Gestion patrimoniale — PatrImo',
    description:
      '15 pages pour piloter votre patrimoine : bilan complet, suivi de portefeuille, rééquilibrage, score patrimonial et rapport fiscal.',
    url: 'https://finance.digitalstack.cloud/patrimoine',
  },
}

const GROUPS = [
  {
    label: 'Patrimoine',
    color: '#B07820',
    pages: [
      {
        slug: 'vue-ensemble',
        label: "Vue d'ensemble",
        description: 'Bilan patrimonial complet : actifs, passifs, répartition par enveloppe et évolution dans le temps.',
        icon: Layers,
        href: '/patrimoine/vue-ensemble',
      },
      {
        slug: 'immobilier',
        label: 'Immobilier',
        description: 'Suivez vos biens immobiliers, leur valeur estimée, vos crédits en cours et votre patrimoine net.',
        icon: Home,
        href: '/patrimoine/immobilier',
      },
      {
        slug: 'actions-fonds',
        label: 'Actions & Fonds',
        description: 'Gérez vos lignes en PEA, CTO et assurance vie avec valorisation en temps réel.',
        icon: TrendingUp,
        href: '/patrimoine/actions-fonds',
      },
      {
        slug: 'livrets',
        label: 'Livrets',
        description: "Centralisez vos livrets d'épargne (Livret A, LDDS, LEP…) et suivez les intérêts générés.",
        icon: PiggyBank,
        href: '/patrimoine/livrets',
      },
      {
        slug: 'autres-actifs',
        label: 'Autres actifs',
        description: 'Crypto-monnaies, métaux précieux, parts de SCPI et tous vos actifs alternatifs.',
        icon: Bitcoin,
        href: '/patrimoine/autres-actifs',
      },
      {
        slug: 'comptes-bancaires',
        label: 'Comptes bancaires',
        description: 'Soldes de vos comptes courants et épargne liquide intégrés dans votre bilan global.',
        icon: Wallet,
        href: '/patrimoine/comptes-bancaires',
      },
      {
        slug: 'emprunts',
        label: 'Emprunts',
        description: 'Tableau de bord de vos dettes : capital restant dû, mensualités et date de fin prévue.',
        icon: Receipt,
        href: '/patrimoine/emprunts',
      },
      {
        slug: 'detail-enveloppe',
        label: 'Détail enveloppe',
        description: "Fiche complète d'une enveloppe avec historique, performances et métadonnées personnalisées.",
        icon: Building2,
        href: '/patrimoine/detail-enveloppe',
      },
    ],
  },
  {
    label: 'Suivi & Trading',
    color: '#38bdf8',
    pages: [
      {
        slug: 'mon-portefeuille',
        label: 'Mon Portefeuille',
        description: 'Tracker de positions en temps réel : prix, variation, poids et performance globale.',
        icon: BarChart3,
        href: '/patrimoine/mon-portefeuille',
      },
      {
        slug: 'rééquilibrage',
        label: 'Rééquilibrage',
        description: 'Calculez les achats et ventes nécessaires pour revenir à votre allocation cible.',
        icon: RefreshCw,
        href: '/patrimoine/reequilibrage',
      },
      {
        slug: 'mes-objectifs',
        label: 'Mes Objectifs',
        description: "Définissez des objectifs d'épargne ou d'investissement et suivez votre progression.",
        icon: Star,
        href: '/patrimoine/mes-objectifs',
      },
      {
        slug: 'carnet-ordres',
        label: "Carnet d'ordres",
        description: 'Journalisez vos ordres passés, suivez vos PRU et calculez vos plus-values latentes.',
        icon: BookOpen,
        href: '/patrimoine/carnet-ordres',
      },
    ],
  },
  {
    label: 'Analyse & Fiscal',
    color: '#818cf8',
    pages: [
      {
        slug: 'rapport-fiscal',
        label: 'Rapport Fiscal',
        description: 'Synthèse annuelle de vos revenus de capitaux : dividendes, coupons et plus-values réalisées.',
        icon: Calculator,
        href: '/patrimoine/rapport-fiscal',
      },
      {
        slug: 'score-patrimonial',
        label: 'Score Patrimonial',
        description: 'Note globale de la santé de votre patrimoine basée sur diversification, liquidité et risque.',
        icon: Award,
        href: '/patrimoine/score-patrimonial',
      },
      {
        slug: 'gestion-personnelle',
        label: 'Gestion personnelle',
        description: "Vue personnalisée de votre situation : taux d'épargne, budget mensuel et projections FIRE.",
        icon: Globe,
        href: '/patrimoine/gestion-personnelle',
      },
    ],
  },
]

export default function PatrimoinePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <PatrimoLogo width={130} uid="patrimo-pub" />
          </Link>
          <Link href="/login" style={{ textDecoration: 'none', padding: '8px 18px', borderRadius: 20, background: 'rgba(176,120,32,0.10)', border: '1px solid rgba(176,120,32,0.25)', color: '#B07820', fontSize: 13, fontWeight: 600 }}>
            Créer un compte gratuit →
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(176,120,32,0.08)', border: '1px solid rgba(176,120,32,0.2)', fontSize: 12, color: '#B07820', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 16 }}>
            15 PAGES DE GESTION
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Gérez votre patrimoine en temps réel
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto' }}>
            Un tableau de bord complet pour piloter vos actifs, suivre vos investissements et optimiser votre fiscalité.
          </p>
        </div>

        {/* Groups */}
        {GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color }} />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                {group.label}
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {group.pages.map(page => {
                const Icon = page.icon
                return (
                  <Link key={page.slug} href={page.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        padding: '20px 22px',
                        borderRadius: 14,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        height: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: group.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 16, height: 16, color: group.color }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{page.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, margin: 0 }}>{page.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 24, padding: '40px 24px', borderRadius: 20, background: 'rgba(176,120,32,0.05)', border: '1px solid rgba(176,120,32,0.15)' }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 10px' }}>Commencez à piloter votre patrimoine</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px' }}>
            Créez un compte gratuit pour accéder à toutes les pages de gestion, synchroniser vos actifs et suivre votre score patrimonial.
          </p>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 24, background: 'linear-gradient(135deg, #8B5E18, #B07820)', color: '#000', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Démarrer gratuitement →
          </Link>
        </div>
      </main>
    </div>
  )
}
