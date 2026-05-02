'use client'
import { useEffect, useState } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { Coins, TrendingUp, Info } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface DividendPosition {
  id: string
  symbol: string
  name: string
  quantity: number
  priceEur: number
  yieldPct: number
  annualDividendEur: number
  monthlyDividendEur: number
}

interface DividendData {
  positions: DividendPosition[]
  totalAnnualEur: number
  totalMonthlyEur: number
}

const C = '#facc15'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M€'; if (a >= 1_000) return Math.round(n / 1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--p-card)', border: '1px solid var(--p-line)',
      borderRadius: 12, padding: '12px 14px', minHeight: 80,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

function yieldColor(yieldPct: number): string {
  if (yieldPct >= 5) return '#34d399'
  if (yieldPct >= 2) return '#facc15'
  return 'var(--p-text-faint)'
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmt(n)
}

const PIE_COLORS = ['#34d399', '#60a5fa', '#facc15', '#f87171', '#a78bfa', '#fb923c']

// ─── DividendBarChart ─────────────────────────────────────────────────────────
function DividendBarChart({ bars }: { bars: { label: string; value: number }[] }) {
  const W = 680, H = 200, PAD = { l: 0, r: 0, t: 16, b: 32 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const maxV = Math.max(...bars.map(b => b.value)) * 1.1 || 1
  const barW = Math.max(20, Math.floor(w / bars.length) - 8)

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="divBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C} stopOpacity={0.9} />
          <stop offset="100%" stopColor={C} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {bars.map((b, i) => {
        const bh = (b.value / maxV) * h
        const x = PAD.l + i * (w / bars.length) + (w / bars.length - barW) / 2
        const y = PAD.t + h - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill="url(#divBarGrad)" />
            <text x={x + barW / 2} y={H - 14} textAnchor="middle" fontSize={10} fontFamily="var(--p-mono)" fill="var(--p-text-faint)" fontWeight={600}>{b.label}</text>
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill={C} fontWeight={700}>{fmtK(b.value)}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── DividendDonut ────────────────────────────────────────────────────────────
function DividendDonut({ segments, size = 160 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const cx = size / 2, cy = size / 2
  const r = size / 2 - 14
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  let angle = -Math.PI / 2
  const paths: { d: string; color: string }[] = []

  for (const seg of segments) {
    const sweep = (seg.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep)
    const y2 = cy + r * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    paths.push({ d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`, color: seg.color })
    angle += sweep
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <mask id="donutMask">
            <rect width={size} height={size} fill="white" />
            <circle cx={cx} cy={cy} r={r * 0.55} fill="black" />
          </mask>
        </defs>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} mask="url(#donutMask)" opacity={0.92} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--p-card)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Top 6</div>
        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 13, fontWeight: 800, color: 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 2 }}>{fmtK(total)}</div>
      </div>
    </div>
  )
}

const tips = [
  { title: 'Yield > 5%', body: 'Un yield > 5% est attractif mais surveillez la pérennité du dividende — un taux trop élevé peut signaler une coupe imminente.', color: C },
  { title: 'Diversification sectorielle', body: 'Diversifiez sur plusieurs secteurs pour réduire le risque de coupe. Évitez de concentrer sur un seul secteur (ex. banques, énergie).', color: '#34d399' },
  { title: 'Dividend Aristocrats', body: 'Privilégiez les "dividend aristocrats" — entreprises qui augmentent leur dividende depuis 25+ ans — pour la stabilité à long terme.', color: '#818cf8' },
  { title: 'Fiscalité PEA', body: 'Le PEA exonère les dividendes d\'impôts après 5 ans de détention. Hors PEA, la flat tax de 30% s\'applique sur les dividendes perçus.', color: '#fb923c' },
]

export default function DividendsPage() {
  const [data, setData] = useState<DividendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portfolio/dividends')
      .then(r => r.json())
      .then((d: DividendData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const withDividends = data?.positions.filter(p => p.yieldPct > 0) ?? []
  const totalPositions = data?.positions.length ?? 0
  const avgYield = withDividends.length > 0
    ? withDividends.reduce((sum, p) => sum + p.yieldPct * p.annualDividendEur, 0) /
      (withDividends.reduce((sum, p) => sum + p.annualDividendEur, 0) || 1)
    : 0

  const totalAnnual = data?.totalAnnualEur ?? 0
  const totalMonthly = data?.totalMonthlyEur ?? 0

  const animatedAnnual = useCountUp(totalAnnual, 1000)

  const barData = [...withDividends]
    .sort((a, b) => b.annualDividendEur - a.annualDividendEur)
    .slice(0, 8)
    .map(p => ({ label: p.symbol, value: p.annualDividendEur }))

  const donutSegments = withDividends.slice(0, 6).map((p, i) => ({
    value: Math.round(p.annualDividendEur),
    color: PIE_COLORS[i % PIE_COLORS.length],
    label: p.symbol,
  }))

  const hasData = !loading && withDividends.length > 0

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Revenus Passifs</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Revenus Passifs<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Analyse de votre portefeuille. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Dividendes · Rentes · Rendement pondéré.</span>
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: GAP }}>
        {loading ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />) : (
          <>
            {/* HERO KPI */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)`, padding: '16px 18px' }}>
              <div style={{ position: 'absolute', top: 14, left: 18, width: 5, height: 5, borderRadius: '50%', background: C }} />
              <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6, paddingLeft: 14 }}>Dividendes / an</div>
              <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--p-text)' }}>{fmtEur(animatedAnnual)}</div>
              <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', marginTop: 6 }}>{fmtK(totalMonthly)}/mois</div>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6 }}>Dividendes / mois</div>
              <div style={{ fontFamily: 'var(--p-mono)', fontSize: 22, fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtCompact(totalMonthly)}</div>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6 }}>Titres dividendes</div>
              <div style={{ fontFamily: 'var(--p-mono)', fontSize: 22, fontWeight: 800, color: 'var(--p-text-em)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {withDividends.length}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--p-text-dim)', marginLeft: 4 }}>/ {totalPositions}</span>
              </div>
            </div>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', marginBottom: 6 }}>Yield moyen pondéré</div>
              <div style={{ fontFamily: 'var(--p-mono)', fontSize: 22, fontWeight: 800, color: yieldColor(avgYield), letterSpacing: '-0.03em', lineHeight: 1 }}>{avgYield.toFixed(2)}%</div>
            </div>
          </>
        )}
      </div>

      {/* Empty states */}
      {!loading && totalPositions === 0 && (
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <TrendingUp style={{ width: 40, height: 40, color: '#34d399', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 6 }}>Aucune position dans votre portefeuille</p>
          <p style={{ fontSize: 13, color: 'var(--p-text-dim)', maxWidth: 400, margin: '0 auto' }}>Ajoutez des actions ou ETF dans votre portefeuille pour estimer vos revenus passifs.</p>
        </div>
      )}

      {!loading && totalPositions > 0 && withDividends.length === 0 && (
        <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <Coins style={{ width: 40, height: 40, color: 'var(--p-text-faint)', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-em)', marginBottom: 6 }}>Aucun dividende détecté</p>
          <p style={{ fontSize: 13, color: 'var(--p-text-dim)', maxWidth: 460, margin: '0 auto' }}>Vos positions n&apos;ont pas de rendement dividende détecté via Yahoo Finance. Cela peut concerner des ETF de capitalisation ou des données momentanément indisponibles.</p>
        </div>
      )}

      {/* Main content — 3-column layout */}
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT — Composition */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Donut répartition */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition dividendes</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Par titre (top 6)</div>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                {donutSegments.length > 0 && (
                  <DividendDonut segments={donutSegments} size={160} />
                )}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {donutSegments.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: seg.color }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{seg.label}</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 54, textAlign: 'right' }}>{fmt(seg.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyse revenus */}
            <div style={{ background: 'var(--p-card)', border: `1px solid ${C}25`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Coins style={{ width: 14, height: 14, color: C }} />
                <div style={eyebrow}>Analyse revenus</div>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Dividendes / semaine', value: fmt(Math.round(totalAnnual / 52)) },
                  { label: 'Dividendes / jour', value: fmt(Math.round(totalAnnual / 365)) },
                  { label: 'Couverture 1 500€/mois', value: `${Math.round((totalMonthly / 1500) * 100)}%` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={labelSt}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', fontFamily: 'var(--p-mono)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER — charts + table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO — animated annual total */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Revenus annuels · dividendes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(animatedAnnual)}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Par mois</div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 18, fontWeight: 700, color: C, marginTop: 4 }}>{fmtK(totalMonthly)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700 }}>Yield moyen</div>
                        <div style={{ fontFamily: 'var(--p-mono)', fontSize: 18, fontWeight: 700, color: yieldColor(avgYield), marginTop: 4 }}>{avgYield.toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Titres avec dividende', value: `${withDividends.length} / ${totalPositions}` },
                    { label: 'Dividendes / semaine', value: fmtK(Math.round(totalAnnual / 52)) },
                    { label: 'Dividendes / jour', value: fmtK(Math.round(totalAnnual / 365)) },
                    { label: 'Couv. 1 500€/mois', value: `${Math.round((totalMonthly / 1500) * 100)}%`, color: totalMonthly >= 1500 ? 'var(--p-green)' : C },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Top {barData.length} — Dividendes annuels</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Positions les plus rémunératrices</div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <DividendBarChart bars={barData} />
              </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Détail des positions</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Rendement par titre</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 110px 110px', padding: '10px 18px', borderBottom: '1px solid var(--p-line)', background: 'var(--p-card-2)', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>
                <span>Titre</span><span>Qté</span><span>Cours</span><span>Yield</span><span>Div/an</span><span>Div/mois</span>
              </div>
              {data?.positions.map((p, idx) => {
                const dim = p.yieldPct === 0
                return (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 90px 110px 110px',
                    padding: '11px 18px', borderBottom: idx < (data?.positions.length ?? 0) - 1 ? '1px solid var(--p-line)' : 'none',
                    opacity: dim ? 0.5 : 1, fontSize: 12, fontFamily: 'var(--p-mono)',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--p-card-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--p-text-em)' }}>{p.symbol}</div>
                      <div style={{ fontSize: 10, color: 'var(--p-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.name}</div>
                    </div>
                    <span style={{ color: 'var(--p-text-em)', alignSelf: 'center' }}>{p.quantity}</span>
                    <span style={{ color: 'var(--p-text-em)', alignSelf: 'center' }}>{fmt(p.priceEur)}</span>
                    <span style={{ fontWeight: 600, color: dim ? 'var(--p-text-faint)' : yieldColor(p.yieldPct), alignSelf: 'center' }}>
                      {dim ? '—' : `${p.yieldPct.toFixed(2)}%`}
                    </span>
                    <span style={{ color: dim ? 'var(--p-text-faint)' : '#34d399', alignSelf: 'center' }}>
                      {dim ? '—' : fmt(p.annualDividendEur)}
                    </span>
                    <span style={{ color: dim ? 'var(--p-text-faint)' : 'var(--p-text-em)', alignSelf: 'center' }}>
                      {dim ? '—' : fmt(p.monthlyDividendEur)}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'var(--p-card)', border: '1px solid var(--p-line)', fontSize: 11, color: 'var(--p-text-faint)', lineHeight: 1.5, boxShadow: 'var(--shadow-sm)' }}>
              <Info style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
              <span>Rendements issus de Yahoo Finance (mis en cache 1h). À titre indicatif uniquement.</span>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Conseils */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Lectures et leviers</div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aller plus loin */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Intérêts composés', href: '/dashboard/compound' },
                  { label: 'DCA', href: '/dashboard/dca' },
                  { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
                ].map((link, i) => (
                  <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{link.label}</span>
                    <span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
