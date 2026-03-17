'use client'
import { useState } from 'react'

// Sources : INSEE 2021 (enquête Patrimoine), Banque de France 2024
const INSEE_PATRIMOINE = [
  { pct: 10, label: '10ème pct', value: 0 },
  { pct: 25, label: '1er quartile', value: 28_000 },
  { pct: 50, label: 'Médiane', value: 183_000 },
  { pct: 75, label: '3ème quartile', value: 440_000 },
  { pct: 90, label: '9ème décile', value: 810_000 },
]

const FRENCH_AVERAGES = {
  tauxEpargne: 17.8, // % du revenu disponible brut (Banque de France 2024)
  patrimoineNet: 183_000, // médiane INSEE 2021
  revenusMedian: 25_560, // revenu médian individuel INSEE 2022
}

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k€`
  return `${n.toLocaleString('fr-FR')} €`
}

function percentileOf(value: number): number {
  for (let i = 0; i < INSEE_PATRIMOINE.length - 1; i++) {
    const lo = INSEE_PATRIMOINE[i]
    const hi = INSEE_PATRIMOINE[i + 1]
    if (value >= lo.value && value <= hi.value) {
      const t = (value - lo.value) / (hi.value - lo.value)
      return Math.round(lo.pct + t * (hi.pct - lo.pct))
    }
  }
  if (value < INSEE_PATRIMOINE[0].value) return 5
  return 95
}

interface Props {
  patrimoineNet?: number
  tauxEpargne?: number
  label?: string
}

export function FrenchAverageWidget({ patrimoineNet, tauxEpargne, label = 'votre situation' }: Props) {
  const [tab, setTab] = useState<'patrimoine' | 'epargne'>(patrimoineNet != null ? 'patrimoine' : 'epargne')

  const pct = patrimoineNet != null ? percentileOf(patrimoineNet) : null
  const pctColor = pct == null ? '#94a3b8' : pct >= 75 ? '#34d399' : pct >= 50 ? '#f1c086' : pct >= 25 ? '#fb923c' : '#f87171'

  const epargneLabel = tauxEpargne != null
    ? tauxEpargne >= FRENCH_AVERAGES.tauxEpargne
      ? `+${(tauxEpargne - FRENCH_AVERAGES.tauxEpargne).toFixed(1)} pts au-dessus`
      : `${(tauxEpargne - FRENCH_AVERAGES.tauxEpargne).toFixed(1)} pts en-dessous`
    : null

  return (
    <div style={{
      background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>
            📊 vs Moyenne française
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Sources : INSEE 2021 · Banque de France 2024</div>
        </div>
        {/* Tab toggle */}
        {patrimoineNet != null && tauxEpargne != null && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['patrimoine', 'epargne'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--card-dark-border)', cursor: 'pointer',
                background: tab === t ? 'rgba(241,192,134,0.10)' : 'transparent',
                color: tab === t ? '#f1c086' : 'var(--text-muted-c)',
              }}>
                {t === 'patrimoine' ? 'Patrimoine' : 'Épargne'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Patrimoine view */}
      {tab === 'patrimoine' && patrimoineNet != null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: pctColor, fontVariantNumeric: 'tabular-nums' }}>{pct}ème percentile</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>sur {fmtK(patrimoineNet)} de patrimoine net</span>
          </div>

          {/* Distribution bar */}
          <div style={{ position: 'relative' }}>
            <div style={{ height: 8, background: 'var(--card-dark-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, #f87171, #fb923c, #f1c086, #34d399)`, borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
            {/* Your marker */}
            <div style={{ position: 'absolute', top: -2, left: `calc(${pct}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: pctColor, border: '2px solid var(--card-dark)', boxShadow: `0 0 8px ${pctColor}60` }} />
          </div>

          {/* Benchmarks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: '1er quartile', value: 28_000, color: '#f87171' },
              { label: 'Médiane', value: 183_000, color: '#fb923c' },
              { label: '3ème quartile', value: 440_000, color: '#f1c086' },
              { label: 'Top 10%', value: 810_000, color: '#34d399' },
            ].map(bench => (
              <div key={bench.label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, textAlign: 'center' as const }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: bench.color, fontVariantNumeric: 'tabular-nums', marginBottom: 2 }}>{fmtK(bench.value)}</div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{bench.label}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-subtle)', borderTop: '1px solid var(--card-dark-border)', paddingTop: 10 }}>
            {(pct ?? 0) >= 75 ? '🎯 Excellent niveau de patrimoine — vous êtes dans le quart supérieur des Français.'
              : (pct ?? 0) >= 50 ? '📈 Au-dessus de la médiane nationale — continuez sur votre lancée.'
              : (pct ?? 0) >= 25 ? '💡 Sous la médiane — des simulations FinCalc peuvent vous aider à optimiser.'
              : '🚀 Fort potentiel de progression — l\'effet des intérêts composés jouera en votre faveur.'}
          </div>
        </div>
      )}

      {/* Épargne view */}
      {(tab === 'epargne' || patrimoineNet == null) && tauxEpargne != null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 2 }}>Votre taux</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: tauxEpargne >= FRENCH_AVERAGES.tauxEpargne ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                {tauxEpargne.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 2 }}>Moyenne française</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f1c086', fontVariantNumeric: 'tabular-nums' }}>
                {FRENCH_AVERAGES.tauxEpargne}%
              </div>
            </div>
            {epargneLabel && (
              <div style={{ padding: '8px 14px', borderRadius: 20, background: tauxEpargne >= FRENCH_AVERAGES.tauxEpargne ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${tauxEpargne >= FRENCH_AVERAGES.tauxEpargne ? '#34d39940' : '#f8717140'}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: tauxEpargne >= FRENCH_AVERAGES.tauxEpargne ? '#34d399' : '#f87171' }}>{epargneLabel}</span>
              </div>
            )}
          </div>

          {/* Bar comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label, value: tauxEpargne, color: tauxEpargne >= FRENCH_AVERAGES.tauxEpargne ? '#34d399' : '#f87171' },
              { label: 'Moyenne FR', value: FRENCH_AVERAGES.tauxEpargne, color: '#f1c086' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted-c)', width: 80, flexShrink: 0 }}>{row.label}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--card-dark-border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, row.value / 30 * 100)}%`, height: '100%', background: row.color, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: row.color, width: 42, textAlign: 'right' as const }}>{row.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
