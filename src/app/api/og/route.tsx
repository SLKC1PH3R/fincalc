import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const GOLD = '#f1c086'
const BG = '#080808'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k€`
  return `${Math.round(n).toLocaleString('fr-FR')} €`
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') || 'default'

  // ── Score badge ──────────────────────────────────────────────────────────────
  if (type === 'score') {
    const score = parseInt(searchParams.get('score') || '0', 10)
    const color = score >= 70 ? '#22c55e' : score >= 40 ? GOLD : '#ef4444'
    const label = score >= 70 ? 'Excellente santé financière' : score >= 40 ? 'Bonne santé financière' : 'À améliorer'

    return new ImageResponse(
      <div
        style={{
          width: 1200, height: 630, background: BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', position: 'relative',
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -100, left: '50%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(ellipse, ${color}18 0%, transparent 70%)`, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, #c8922a, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, color: '#000' }}>↗</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Patrimo</span>
          </div>

          {/* Score gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Score Patrimonial</span>
            <span style={{ fontSize: 120, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.04em' }}>{score}</span>
            <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)' }}>/100</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 40, padding: '10px 24px' }}>
            <span style={{ fontSize: 18, color, fontWeight: 600 }}>{label}</span>
          </div>

          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>finance.digitalstack.cloud · Pilotez votre Patrimoine</span>
        </div>
      </div>,
      { width: 1200, height: 630 }
    )
  }

  // ── Simulation share ─────────────────────────────────────────────────────────
  const title = searchParams.get('title') || 'Simulation Patrimo'
  const subtitle = searchParams.get('subtitle') || ''
  const value = searchParams.get('value') ? parseFloat(searchParams.get('value')!) : null
  const value2 = searchParams.get('value2') ? parseFloat(searchParams.get('value2')!) : null
  const label1 = searchParams.get('label1') || 'Capital final'
  const label2 = searchParams.get('label2') || 'Capital investi'
  const tag = searchParams.get('tag') || type.toUpperCase()

  const TAG_COLORS: Record<string, string> = {
    compound: '#818cf8', fire: '#f59e0b', mortgage: '#f472b6',
    dca: '#34d399', retirement: '#a78bfa', tax: '#38bdf8',
  }
  const tagColor = TAG_COLORS[type] || GOLD

  return new ImageResponse(
    <div
      style={{
        width: 1200, height: 630, background: BG,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Ambient glow top-right */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(ellipse, ${tagColor}12 0%, transparent 65%)`, display: 'flex' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '36px 52px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, #c8922a, ${GOLD})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, color: '#000' }}>↗</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Patrimo</span>
        </div>
        <div style={{ display: 'flex', background: `${tagColor}18`, border: `1px solid ${tagColor}40`, borderRadius: 20, padding: '6px 18px' }}>
          <span style={{ fontSize: 14, color: tagColor, fontWeight: 700, letterSpacing: '0.06em' }}>{tag}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 52px' }}>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{subtitle}</span>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{title}</h1>

        {/* Values */}
        {value !== null && (
          <div style={{ display: 'flex', gap: 40, marginTop: 36 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label1}</span>
              <span style={{ fontSize: 56, fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: '-0.04em' }}>{fmt(value)}</span>
            </div>
            {value2 !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label2}</span>
                <span style={{ fontSize: 56, fontWeight: 900, color: 'rgba(255,255,255,0.6)', lineHeight: 1, letterSpacing: '-0.04em' }}>{fmt(value2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 52px 36px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>finance.digitalstack.cloud · Simulation partagée</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>Résultats indicatifs — voir les hypothèses sur Patrimo</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
