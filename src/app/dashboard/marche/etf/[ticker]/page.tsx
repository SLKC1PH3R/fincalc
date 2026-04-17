'use client'
import { use } from 'react'
import Link from 'next/link'
import { ChevronRight, ArrowLeft, TrendingUp, Info, ExternalLink } from 'lucide-react'
import { ETF_DATABASE, REGION_LABELS } from '@/lib/etf-database'

export default function ETFDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params)
  const etf = ETF_DATABASE.find(e => e.ticker.toLowerCase() === ticker.toLowerCase())
  const alternatives = etf?.alternatives
    ? ETF_DATABASE.filter(e => etf.alternatives!.includes(e.isin))
    : []

  if (!etf) {
    return (
      <div style={{ background: 'var(--content-bg)', minHeight: '100vh', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginBottom: 12 }}>ETF non trouvé pour le ticker <strong>{ticker}</strong></p>
        <Link href="/dashboard/marche" style={{ fontSize: 13, color: '#f1c086', textDecoration: 'none' }}>← Retour aux marchés</Link>
      </div>
    )
  }

  const geoEntries = Object.entries(etf.geo)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a) as [keyof typeof REGION_LABELS, number][]

  const GEO_COLORS: Record<string, string> = {
    northAmerica: '#7c3aed', europe: '#3b82f6', asiaPacific: '#10b981',
    emergingMarkets: '#f59e0b', other: '#94a3b8',
  }

  return (
    <div style={{ background: 'var(--content-bg)', minHeight: '100vh', padding: '28px 24px 56px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 12, color: 'var(--text-subtle)' }}>
        <Link href="/dashboard/marche" style={{ color: 'var(--text-subtle)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-em)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}>
          <ArrowLeft style={{ width: 12, height: 12 }} /> Marchés
        </Link>
        <ChevronRight style={{ width: 12, height: 12 }} />
        <span>ETF</span>
        <ChevronRight style={{ width: 12, height: 12 }} />
        <span style={{ color: 'var(--text-em)', fontWeight: 600 }}>{etf.ticker}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace', background: 'rgba(241,192,134,0.1)', border: '1px solid rgba(241,192,134,0.2)', borderRadius: 8, padding: '4px 12px' }}>{etf.ticker}</span>
              {etf.distributing
                ? <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 6, padding: '3px 8px' }}>Distribuant</span>
                : <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 6, padding: '3px 8px' }}>Capitalisant</span>
              }
              <span style={{ fontSize: 11, fontWeight: 700, color: etf.replication === 'physical' ? '#38bdf8' : '#a78bfa', background: etf.replication === 'physical' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)', borderRadius: 6, padding: '3px 8px' }}>
                {etf.replication === 'physical' ? 'Réplication physique' : 'Réplication synthétique'}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>{etf.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0 }}>ISIN : <span style={{ fontFamily: 'Geist Mono, monospace', color: 'var(--text-muted-c)' }}>{etf.isin}</span></p>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TER annuel', value: `${(etf.ter * 100).toFixed(2)}%`, color: etf.ter <= 0.001 ? '#34d399' : etf.ter <= 0.003 ? '#f1c086' : '#f87171', hint: 'Total Expense Ratio' },
          { label: 'AUM', value: etf.aum >= 1000 ? `${(etf.aum / 1000).toFixed(1)} B€` : `${etf.aum} M€`, color: 'var(--text-em)', hint: 'Actifs sous gestion' },
          { label: 'Indice suivi', value: etf.benchmark, color: 'var(--text-em)', hint: null },
          ...(etf.dividendYield != null ? [{ label: 'Rendement dist.', value: `${(etf.dividendYield * 100).toFixed(1)}%`, color: '#34d399', hint: null }] : []),
        ].map((k, i) => (
          <div key={i} className="na-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k.label}</span>
              {k.hint && <span title={k.hint}><Info style={{ width: 11, height: 11, color: 'var(--text-subtle)' }} /></span>}
            </div>
            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontWeight: 700, color: k.color, margin: 0, letterSpacing: '-0.03em', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20, alignItems: 'start' }} className="xl:grid-cols-[1fr_280px] grid-cols-1">

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Geographic allocation */}
          <div className="na-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp style={{ width: 15, height: 15, color: '#f1c086' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>Répartition géographique</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {geoEntries.map(([key, val]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted-c)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: GEO_COLORS[key], display: 'inline-block', flexShrink: 0 }} />
                      {REGION_LABELS[key]}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontFamily: 'Geist Mono, monospace' }}>{(val * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--mini-card-bg)', overflow: 'hidden' }}>
                    <div style={{ width: `${val * 100}%`, height: '100%', background: GEO_COLORS[key], borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost analysis */}
          <div className="na-card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-em)', margin: '0 0 16px' }}>Impact des frais sur 10 000 € (20 ans, 7%/an)</h3>
            {[
              { label: 'Sans frais (théorique)', value: 38696, color: '#34d399' },
              { label: `Avec ${(etf.ter * 100).toFixed(2)}% TER`, value: Math.round(10000 * Math.pow(1 + 0.07 - etf.ter, 20)), color: '#f1c086' },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: i === 0 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: 'Geist Mono, monospace' }}>{r.value.toLocaleString('fr-FR')} €</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--mini-card-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${(r.value / 38696) * 100}%`, height: '100%', background: r.color, borderRadius: 4, opacity: 0.8 }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: '12px 0 0', lineHeight: 1.5 }}>
              Impact des frais : <span style={{ color: '#f87171', fontWeight: 600 }}>−{(38696 - Math.round(10000 * Math.pow(1 + 0.07 - etf.ter, 20))).toLocaleString('fr-FR')} €</span> sur 20 ans.
              {' '}Données indicatives à des fins éducatives.
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Details */}
          <div className="na-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', margin: '0 0 14px' }}>Caractéristiques</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Ticker', value: etf.ticker },
                { label: 'ISIN', value: etf.isin },
                { label: 'Benchmark', value: etf.benchmark },
                { label: 'Réplication', value: etf.replication === 'physical' ? 'Physique' : 'Synthétique' },
                { label: 'Type', value: etf.distributing ? 'Distribuant' : 'Capitalisant' },
                { label: 'AUM', value: etf.aum >= 1000 ? `${(etf.aum / 1000).toFixed(1)}B€` : `${etf.aum}M€` },
                { label: 'TER', value: `${(etf.ter * 100).toFixed(2)}% / an` },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--section-border)' : undefined, gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', fontFamily: row.label === 'ISIN' || row.label === 'TER' || row.label === 'AUM' ? 'Geist Mono, monospace' : 'inherit', textAlign: 'right', wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <div className="na-card" style={{ padding: '18px 20px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', margin: '0 0 14px' }}>Alternatives moins chères</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alternatives.map(alt => (
                  <Link key={alt.isin} href={`/dashboard/marche/etf/${alt.ticker}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--mini-card-bg)', border: '1px solid var(--card-dark-border)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(241,192,134,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--card-dark-border)')}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: '0 0 2px', fontFamily: 'Geist Mono, monospace' }}>{alt.ticker}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alt.name}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: alt.ter < etf.ter ? '#34d399' : '#f87171', fontFamily: 'Geist Mono, monospace' }}>{(alt.ter * 100).toFixed(2)}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ padding: '12px 14px', background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <ExternalLink style={{ width: 12, height: 12, color: 'var(--text-subtle)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.5 }}>
                Données indicatives à titre éducatif uniquement. Pas un conseil en investissement. Consultez un professionnel qualifié.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
