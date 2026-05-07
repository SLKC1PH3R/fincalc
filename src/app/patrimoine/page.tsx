import Link from 'next/link'
import type { Metadata } from 'next'
import {
  TrendingUp, Building2, Home, PiggyBank, Bitcoin,
  Wallet, Receipt, Layers, BarChart3, RefreshCw,
  Star, BookOpen, Calculator, Award, Globe, ArrowRight,
} from 'lucide-react'
import { Nav } from '@/components/landing/Nav'

export const metadata: Metadata = {
  title: 'Outils patrimoniaux — PatrImo',
  description:
    'Suivez et gérez votre patrimoine en temps réel : immobilier, actions, livrets, crypto, PEA, assurance vie. 15 outils de gestion patrimoniale gratuits.',
  openGraph: {
    title: 'Outils patrimoniaux — PatrImo',
    description:
      '15 outils pour piloter votre patrimoine : bilan complet, suivi de portefeuille, rééquilibrage, score patrimonial et rapport fiscal.',
    url: 'https://finance.digitalstack.cloud/patrimoine',
  },
}

const BG      = '#F3EEE4'
const SURFACE = '#FFFFFF'
const INK     = '#0A0A0A'
const MUTED   = '#6B6356'
const LINE    = 'rgba(10,10,10,0.08)'
const LINE_S  = 'rgba(10,10,10,0.14)'
const GOLD    = '#B07820'
const GOLD_D  = '#8B5E18'
const GOLD_T  = 'rgba(176,120,32,0.09)'
const F_SANS  = "'Geist', system-ui, -apple-system, sans-serif"
const F_SERIF = "'Instrument Serif', Georgia, serif"
const F_MONO  = "'Geist Mono', ui-monospace, monospace"

const GROUPS = [
  {
    label: 'Patrimoine',
    color: '#B07820',
    pages: [
      { slug: 'vue-ensemble',    label: "Vue d'ensemble",  desc: 'Bilan patrimonial complet : actifs, passifs, répartition par enveloppe et évolution dans le temps.', icon: Layers },
      { slug: 'immobilier',      label: 'Immobilier',       desc: 'Suivez vos biens immobiliers, valeur estimée, crédits en cours et patrimoine net immobilier.', icon: Home },
      { slug: 'actions-fonds',   label: 'Actions & Fonds',  desc: 'Gérez vos lignes en PEA, CTO et assurance vie avec valorisation en temps réel.', icon: TrendingUp },
      { slug: 'livrets',         label: 'Livrets',          desc: "Centralisez vos livrets d'épargne (Livret A, LDDS, LEP…) et suivez les intérêts générés.", icon: PiggyBank },
      { slug: 'autres-actifs',   label: 'Autres actifs',    desc: 'Crypto-monnaies, métaux précieux, parts de SCPI et tous vos actifs alternatifs.', icon: Bitcoin },
      { slug: 'comptes-bancaires', label: 'Comptes bancaires', desc: 'Soldes de vos comptes courants et épargne liquide intégrés dans votre bilan global.', icon: Wallet },
      { slug: 'emprunts',        label: 'Emprunts',         desc: 'Tableau de bord de vos dettes : capital restant dû, mensualités et date de fin prévue.', icon: Receipt },
      { slug: 'detail-enveloppe', label: 'Détail enveloppe', desc: "Fiche complète d'une enveloppe avec historique, performances et métadonnées personnalisées.", icon: Building2 },
    ],
  },
  {
    label: 'Suivi & Trading',
    color: '#38bdf8',
    pages: [
      { slug: 'mon-portefeuille', label: 'Mon Portefeuille', desc: 'Tracker de positions en temps réel : prix, variation, poids et performance globale.', icon: BarChart3 },
      { slug: 'reequilibrage',    label: 'Rééquilibrage',    desc: 'Calculez les achats et ventes nécessaires pour revenir à votre allocation cible.', icon: RefreshCw },
      { slug: 'mes-objectifs',    label: 'Mes Objectifs',    desc: "Définissez des objectifs d'épargne ou d'investissement et suivez votre progression.", icon: Star },
      { slug: 'carnet-ordres',    label: "Carnet d'ordres",  desc: 'Journalisez vos ordres passés, suivez vos PRU et calculez vos plus-values latentes.', icon: BookOpen },
    ],
  },
  {
    label: 'Analyse & Fiscal',
    color: '#818cf8',
    pages: [
      { slug: 'rapport-fiscal',     label: 'Rapport Fiscal',      desc: 'Synthèse annuelle de vos revenus de capitaux : dividendes, coupons et plus-values réalisées.', icon: Calculator },
      { slug: 'score-patrimonial',  label: 'Score Patrimonial',   desc: 'Note globale de la santé de votre patrimoine basée sur diversification, liquidité et risque.', icon: Award },
      { slug: 'gestion-personnelle', label: 'Gestion personnelle', desc: "Vue personnalisée : taux d'épargne, budget mensuel et projections FIRE.", icon: Globe },
    ],
  },
]

export default function PatrimoinePage() {
  return (
    <div className="patrimo-landing" style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: F_SANS }}>

      <Nav />

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Hero */}
        <div style={{ paddingTop: 64, marginBottom: 72, maxWidth: 720 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: GOLD, display: 'inline-block' }} />
            <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: GOLD_D, textTransform: 'uppercase', letterSpacing: '0.16em' }}>15 outils de gestion</span>
          </div>
          <h1 style={{ fontFamily: F_SERIF, fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.025em', lineHeight: 1.08, color: INK }}>
            Gérez votre patrimoine,{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>en temps réel.</span>
          </h1>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 560, margin: '0 0 36px', lineHeight: 1.65 }}>
            Un tableau de bord complet pour piloter vos actifs, suivre vos investissements et optimiser votre fiscalité. Sans connexion bancaire.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', padding: '13px 26px', borderRadius: 999,
              background: GOLD_D, color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: F_SANS,
            }}>
              Créer mon espace gratuit <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link href="/tools" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', padding: '13px 26px', borderRadius: 999,
              background: SURFACE, border: `1px solid ${LINE_S}`,
              color: MUTED, fontWeight: 500, fontSize: 14, fontFamily: F_SANS,
            }}>
              Voir les simulateurs
            </Link>
          </div>
        </div>

        {/* Groups */}
        {GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: group.color, display: 'inline-block' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: group.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                {group.label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {group.pages.map(page => {
                const Icon = page.icon
                return (
                  <Link key={page.slug} href={`/patrimoine/${page.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="patr-card" style={{
                      padding: '22px 24px',
                      borderRadius: 14,
                      background: SURFACE,
                      border: `1px solid ${LINE_S}`,
                      height: '100%',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: group.color + '14', border: `1px solid ${group.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: 15, height: 15, color: group.color }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.2, fontFamily: F_SANS }}>{page.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0, fontFamily: F_SANS }}>{page.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <style>{`
          .patr-card { transition: box-shadow .2s, border-color .2s; cursor: pointer; }
          .patr-card:hover { box-shadow: 0 6px 24px rgba(10,10,10,0.08); border-color: rgba(176,120,32,0.35) !important; }
        `}</style>

        {/* CTA final */}
        <div style={{
          textAlign: 'center', padding: '56px 32px', borderRadius: 24,
          background: SURFACE, border: `1px solid ${LINE_S}`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '200%', background: `radial-gradient(ellipse, rgba(176,120,32,0.10) 0%, transparent 60%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: GOLD, display: 'inline-block' }} />
              <span style={{ fontFamily: F_MONO, fontSize: 10, fontWeight: 600, color: GOLD_D, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Compte gratuit</span>
            </div>
            <h3 style={{ fontFamily: F_SERIF, fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', fontWeight: 400, margin: '0 0 12px', letterSpacing: '-0.02em', color: INK }}>
              Commencez à piloter votre patrimoine
            </h3>
            <p style={{ fontSize: 15, color: MUTED, margin: '0 0 28px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, fontFamily: F_SANS }}>
              Créez un compte gratuit pour accéder à toutes les pages de gestion, suivre vos actifs et votre score patrimonial.
            </p>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              textDecoration: 'none', padding: '13px 30px', borderRadius: 999,
              background: GOLD_D, color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: F_SANS,
            }}>
              Démarrer gratuitement <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
