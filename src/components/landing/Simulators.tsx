'use client';

import * as React from 'react';
import Link from 'next/link';
import { I } from './icons';
import { SectionHead } from './Pillars';

export function Simulators() {
  const sims = [
    { n: 'Intérêts composés',   d: 'Capital final · graph',        Ic: I.chart,  cat: 'Épargne',        href: '/tools/interets-composes'    },
    { n: 'DCA',                  d: 'Coût moyen · performance',     Ic: I.coin,   cat: 'Investissement', href: '/tools/dca'                   },
    { n: 'FI/RE',                d: 'Objectif · années',            Ic: I.tree,   cat: 'Planification',  href: '/tools/fire'                  },
    { n: 'Impôts IR 2026',       d: 'Net · IR · TMI',               Ic: I.book,   cat: 'Fiscalité',      href: '/tools/impots-ir'             },
    { n: 'Achat vs Location',    d: 'Comparaison · seuil',          Ic: I.home,   cat: 'Immobilier',     href: '/tools/acheter-ou-louer'      },
    { n: 'Prêt immobilier',      d: 'Mensualité · TAEG',            Ic: I.dollar, cat: 'Immobilier',     href: '/tools/pret-immobilier'       },
    { n: 'Rentabilité locative', d: 'Rendement · cash-flow',        Ic: I.home,   cat: 'Immobilier',     href: '/tools/rentabilite-locative'  },
    { n: "Taux d'épargne",       d: '50/30/20',                     Ic: I.pie,    cat: 'Budget',         href: '/tools/taux-epargne'          },
    { n: 'Budget',               d: 'Répartition catégories',       Ic: I.wallet, cat: 'Budget',         href: '/tools/budget-50-30-20'       },
    { n: 'Retraite',             d: 'Projection pension',           Ic: I.tree,   cat: 'Planification',  href: '/tools/retraite'              },
    { n: 'Score patrimonial',    d: '6 piliers · 100 pts',          Ic: I.star,   cat: 'Diagnostic',     href: '/tools/score-patrimonial'     },
    { n: 'Optimisation ETF',     d: 'Comparateur frais',            Ic: I.bolt,   cat: 'Investissement', href: '/tools/optimiseur-etf'        },
    { n: 'Amortissement prêt',   d: 'Tableau complet',              Ic: I.dollar, cat: 'Immobilier',     href: '/tools/pret-immobilier'       },
    { n: 'Plafond PEA',          d: 'Seuil 150 k€',                 Ic: I.bank,   cat: 'Enveloppe',      href: '/tools/pea-cto-av'            },
    { n: 'Livret réglementé',    d: 'Intérêts projetés',            Ic: I.bank,   cat: 'Épargne',        href: '/dashboard/patrimoine/livrets'},
    { n: 'PER fiscal',           d: 'Économie IR',                  Ic: I.bank,   cat: 'Fiscalité',      href: '/tools/pea-cto-av'            },
    { n: 'Assurance vie 8A',     d: 'Ancienneté fiscale',           Ic: I.bank,   cat: 'Enveloppe',      href: '/tools/pea-cto-av'            },
    { n: 'Historique',           d: 'Toutes simulations',           Ic: I.book,   cat: 'Archive',        href: '/dashboard'                   },
  ];
  return (
    <section id="simulators" style={{ padding: '80px 0', background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 20 }}>
          <SectionHead
            eyebrow="18 simulateurs"
            title={<>Une calculette pour <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>chaque décision.</span></>}
            sub="Toute la fiscalité française 2026, à jour. Sauvegardez vos simulations, comparez les scénarios."
          />
          <Link href="/tools" className="btn-ghost">Tout explorer <I.arrow size={14} /></Link>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
          border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden',
          background: 'var(--line)',
        }} className="sims-grid">
          {sims.map(s => (
            <Link key={s.n} href={s.href} className="sim-cell" style={{
              background: 'var(--surface)',
              padding: '18px 16px', minHeight: 108,
              textDecoration: 'none',
              transition: 'background .2s', position: 'relative',
              display: 'block',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ color: 'var(--gold-deep)' }}><s.Ic size={16} /></div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.cat}</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, marginBottom: 3 }}>{s.n}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>{s.d}</div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .sim-cell:hover { background: var(--surface-2) !important; }
        @media (max-width: 1020px) { .sims-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 600px)  { .sims-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  );
}
