'use client';

import * as React from 'react';
import { I, type IconProps } from './icons';
import { SectionHead } from './Pillars';

type Row = { n: string; v: number; sub: string; trend: 'up' | 'down' | 'flat' };
type Cat = 'livrets' | 'credit' | 'obligations' | 'scpi' | 'banques';

export function LiveRates() {
  const cats: Array<{ k: Cat; label: string }> = [
    { k: 'livrets', label: 'Livrets' },
    { k: 'credit', label: 'Crédit' },
    { k: 'obligations', label: 'Obligations' },
    { k: 'scpi', label: 'SCPI' },
    { k: 'banques', label: 'Banques' },
  ];
  const [tab, setTab] = React.useState<Cat>('livrets');

  const baseData: Record<Cat, Row[]> = {
    livrets: [
      { n: 'Livret A',          v: 2.40, sub: 'Plafond 22 950 €',       trend: 'down' },
      { n: 'LDDS',              v: 2.40, sub: 'Plafond 12 000 €',       trend: 'down' },
      { n: 'LEP',               v: 3.50, sub: 'Sous conditions',         trend: 'down' },
      { n: 'Livret Jeune',      v: 2.40, sub: '12-25 ans',               trend: 'down' },
      { n: 'PEL (nouveaux)',    v: 1.75, sub: '4 ans min.',              trend: 'flat' },
      { n: 'CEL',               v: 1.50, sub: 'Compte épargne logement', trend: 'flat' },
    ],
    credit: [
      { n: 'Crédit immo 10 ans', v: 3.10, sub: 'Meilleurs taux', trend: 'down' },
      { n: 'Crédit immo 15 ans', v: 3.25, sub: 'Meilleurs taux', trend: 'down' },
      { n: 'Crédit immo 20 ans', v: 3.40, sub: 'Meilleurs taux', trend: 'down' },
      { n: 'Crédit immo 25 ans', v: 3.55, sub: 'Meilleurs taux', trend: 'down' },
      { n: 'Crédit conso',       v: 5.85, sub: 'TAEG moyen',     trend: 'up' },
      { n: 'Crédit auto',        v: 4.40, sub: 'TAEG moyen',     trend: 'flat' },
    ],
    obligations: [
      { n: 'OAT 10 ans (France)',    v: 3.05, sub: 'Référence Trésor', trend: 'up' },
      { n: 'OAT 2 ans',              v: 2.15, sub: 'Trésor court',     trend: 'down' },
      { n: 'Bund 10 ans (Allemagne)', v: 2.35, sub: 'Zone Euro',       trend: 'up' },
      { n: 'BTP 10 ans (Italie)',    v: 3.65, sub: 'Zone Euro',        trend: 'up' },
      { n: 'US Treasury 10Y',        v: 4.25, sub: 'USD',              trend: 'up' },
      { n: 'Corporate IG EUR',       v: 3.80, sub: 'Investment Grade', trend: 'flat' },
    ],
    scpi: [
      { n: 'SCPI moyenne marché', v: 4.72, sub: 'Taux distribution 2025', trend: 'up' },
      { n: 'Remake Live',         v: 7.50, sub: 'Europe · bureaux',       trend: 'up' },
      { n: 'Iroko Zen',           v: 7.32, sub: 'Diversifiée',            trend: 'flat' },
      { n: 'Corum Origin',        v: 6.05, sub: 'Europe',                 trend: 'flat' },
      { n: 'Épargne Pierre',      v: 5.28, sub: 'Bureaux France',         trend: 'down' },
      { n: 'Pierval Santé',       v: 4.92, sub: 'Santé Europe',           trend: 'flat' },
    ],
    banques: [
      { n: 'Fortuneo Hello+',      v: 2.00, sub: 'Livret promo 4 mois',  trend: 'flat' },
      { n: 'BoursoBank',           v: 3.50, sub: 'Boursorama · promo',   trend: 'flat' },
      { n: 'Trade Republic',       v: 2.00, sub: 'Compte espèces',       trend: 'down' },
      { n: 'Revolut Ultra',        v: 2.50, sub: 'Épargne flexible',     trend: 'down' },
      { n: 'N26 You',              v: 2.26, sub: 'Compte rémunéré',      trend: 'flat' },
      { n: 'Monabanq Rentabilis',  v: 3.00, sub: 'Livret + compte',      trend: 'flat' },
    ],
  };

  const rows = baseData[tab];
  const tabIconMap: Record<Cat, (p: IconProps) => React.ReactElement> = {
    livrets: I.bank, credit: I.home, obligations: I.chart, scpi: I.home, banques: I.wallet,
  };

  return (
    <section id="rates" style={{ padding: '100px 0', background: 'var(--surface)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
          <SectionHead
            eyebrow="Taux en direct"
            title={<>Les taux du marché, <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>actualisés.</span></>}
            sub="Livrets, crédits, obligations, SCPI, banques en ligne — tous les taux de référence pour piloter vos décisions."
          />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 99,
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--muted)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--gold-deep)' }} />
            Taux FR · Avril 2026
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          padding: 6, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--line)',
          width: 'fit-content', marginBottom: 20,
        }}>
          {cats.map(c => {
            const Ic = tabIconMap[c.k];
            return (
              <button key={c.k} onClick={() => setTab(c.k)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                background: tab === c.k ? 'var(--ink)' : 'transparent',
                color: tab === c.k ? 'var(--bg)' : 'var(--ink-2)',
                transition: 'background .18s, color .18s',
              }}>
                <Ic size={14} /> {c.label}
              </button>
            );
          })}
        </div>

        <div style={{
          borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)',
          background: 'var(--surface)',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr',
            padding: '14px 22px',
            fontFamily: 'var(--f-mono)', fontSize: 10.5, color: 'var(--muted)',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'var(--surface-2)', borderBottom: '1px solid var(--line)',
          }}>
            <span>Produit</span>
            <span>Référence</span>
            <span style={{ textAlign: 'right' }}>Taux</span>
            <span style={{ textAlign: 'right' }}>Tendance</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.n} className="rate-row" style={{
              display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 0.8fr',
              padding: '16px 22px', alignItems: 'center',
              borderTop: i === 0 ? 'none' : '1px solid var(--line)',
              transition: 'background .2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 99,
                  background: r.trend === 'up' ? 'var(--up)' : r.trend === 'down' ? 'var(--down)' : 'var(--muted-2)',
                }} />
                <span style={{ fontSize: 14, color: 'var(--ink)' }}>{r.n}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--f-mono)' }}>{r.sub}</span>
              <span className="mono" style={{
                fontSize: 18, fontWeight: 600, color: 'var(--ink)',
                textAlign: 'right', letterSpacing: '-0.02em',
              }}>{r.v.toFixed(2)} %</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TrendBadge trend={r.trend} />
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 14, fontFamily: 'var(--f-mono)', fontSize: 10.5,
          color: 'var(--muted-2)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Sources · Banque de France · Euronext · AMF · IEIF · Données indicatives
        </div>
      </div>

      <style>{`.rate-row:hover { background: var(--surface-2); }`}</style>
    </section>
  );
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const map = {
    up:   { c: 'var(--up)',   t: 'rotate(-45deg)', label: 'En hausse' },
    down: { c: 'var(--down)', t: 'rotate(45deg)',  label: 'En baisse' },
    flat: { c: 'var(--muted)',t: 'rotate(0deg)',   label: 'Stable'    },
  } as const;
  const m = map[trend];
  return (
    <span title={m.label} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 99,
      background: `color-mix(in srgb, ${m.c} 10%, transparent)`,
      color: m.c, fontFamily: 'var(--f-mono)', fontSize: 10.5, fontWeight: 500,
    }}>
      {trend === 'flat'
        ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
        : <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: m.t }}><path d="M2 5h6M6 2l2 3-2 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      }
    </span>
  );
}
