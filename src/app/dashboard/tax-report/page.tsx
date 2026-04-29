'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, FileText, Download, Info } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface Position {
  id: string
  symbol: string
  name: string
  pru: number
  quantity: number
  assetType: string
}

interface Envelope {
  id: string
  name: string
  type: string
  createdAt: string
  positions: Position[]
  totalValue: number | null
  metadata: Record<string, unknown>
}

const CURRENT_YEAR = 2026
const FISCAL_YEAR  = CURRENT_YEAR - 1  // 2025

function diffYears(from: string): number {
  return (Date.now() - new Date(from).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

function envelopeAgeYears(e: Envelope): number {
  const openedYear = e.metadata?.openedYear ? Number(e.metadata.openedYear) : null
  if (openedYear) return new Date().getFullYear() - openedYear
  return diffYears(e.createdAt)
}

function getFiscalRegime(type: string): string {
  switch (type) {
    case 'PEA':    return 'Exonéré IR après 5 ans (PS 17.2% restants)'
    case 'CTO':    return 'PFU 30% (Flat Tax)'
    case 'AV':     return '7.5% IR après 8 ans + abattement'
    case 'CRYPTO': return 'PFU 30% (Flat Tax)'
    case 'PER':    return 'IR à la sortie (déductible versements)'
    case 'LIVRET': return 'Exonéré (livret réglementé)'
    case 'CASH':   return 'IR sur intérêts'
    default:       return 'Selon régime applicable'
  }
}

function getAvantage(type: string, yearsHeld: number): { label: string; reached: boolean } {
  switch (type) {
    case 'PEA':
      return yearsHeld >= 5
        ? { label: 'Exonération IR ✓', reached: true }
        : { label: `Exonération IR dans ${(5 - yearsHeld).toFixed(1)} ans`, reached: false }
    case 'AV':
      return yearsHeld >= 8
        ? { label: 'Abattement 4 600€/9 200€ ✓', reached: true }
        : { label: `Abattement dans ${(8 - yearsHeld).toFixed(1)} ans`, reached: false }
    case 'PER':
      return { label: 'Déductibilité versements', reached: true }
    case 'LIVRET':
      return { label: 'Toujours exonéré', reached: true }
    default:
      return { label: '—', reached: false }
  }
}

function getDureeLabel(type: string, yearsHeld: number): string {
  const y = yearsHeld.toFixed(1)
  switch (type) {
    case 'PEA':
      return yearsHeld >= 5
        ? `${y} ans — ≥ 5 ans (exonération IR)`
        : `${y} ans — < 5 ans (gains imposables)`
    case 'AV':
      return yearsHeld >= 8
        ? `${y} ans — ≥ 8 ans (abattement 4 600€/9 200€)`
        : `${y} ans — < 8 ans`
    case 'PER':
      return `${y} ans — bloqué jusqu'à la retraite`
    default:
      return `${y} ans`
  }
}

export default function TaxReportPage() {
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/patrimoine/envelopes')
      .then(r => r.json())
      .then((data: Envelope[]) => { if (Array.isArray(data)) setEnvelopes(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const taxableEnvelopes = envelopes.filter(e =>
    ['PEA', 'CTO', 'AV', 'CRYPTO', 'PER', 'LIVRET'].includes(e.type)
  )

  const handleExportCsv = () => {
    const headers = ['Enveloppe', 'Type', 'Capital Investi', 'Valeur Déclarée', 'Régime Fiscal', 'Durée de Détention', 'Seuil Atteint']
    const rows = taxableEnvelopes.map(e => {
      const yearsHeld    = envelopeAgeYears(e)
      const capitalInvested = e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
      const valeur       = e.totalValue !== null ? e.totalValue : capitalInvested
      const avantage     = getAvantage(e.type, yearsHeld)
      return [
        e.name,
        e.type,
        capitalInvested.toFixed(2),
        valeur.toFixed(2),
        getFiscalRegime(e.type),
        getDureeLabel(e.type, yearsHeld),
        avantage.reached ? 'Oui' : 'Non',
      ]
    })
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `rapport-fiscal-${FISCAL_YEAR}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)', background: 'var(--p-bg)', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Shield style={{ width: 22, height: 22, color: '#818cf8' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text)', margin: 0 }}>
              Rapport Fiscal
            </h1>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                padding: '2px 10px', borderRadius: 20,
                letterSpacing: '0.05em',
              }}>
                Exercice {FISCAL_YEAR}
              </span>
              <span style={{ fontSize: 12, color: 'var(--p-text-faint)' }}>
                Généré le {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download style={{ width: 14, height: 14 }} />
          Exporter CSV
        </Button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          {
            title: 'PFU (Flat Tax)',
            value: '30 %',
            detail: '12.8% IR + 17.2% prélèvements sociaux',
            color: '#B07820',
            icon: <FileText style={{ width: 14, height: 14 }} />,
          },
          {
            title: 'Abattement AV',
            value: '4 600 € / 9 200 €',
            detail: 'Célibataire / couple — après 8 ans',
            color: '#818cf8',
            icon: <Shield style={{ width: 14, height: 14 }} />,
          },
          {
            title: 'PEA exonération',
            value: 'IR exonéré',
            detail: 'Après 5 ans — PS 17.2% restants',
            color: '#34d399',
            icon: <Shield style={{ width: 14, height: 14 }} />,
          },
        ].map(card => (
          <div
            key={card.title}
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'var(--p-card)',
              border: '1px solid var(--p-line)',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${card.color}15`, border: `1px solid ${card.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.color,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--p-text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: card.color, fontVariantNumeric: 'tabular-nums' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginTop: 2 }}>{card.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', marginBottom: 20 }}>
        <CardContent style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--p-line)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>
              Récapitulatif par enveloppe — {FISCAL_YEAR}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>
              Chargement…
            </div>
          ) : taxableEnvelopes.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>
              Aucune enveloppe fiscalisable trouvée. Créez des enveloppes PEA, CTO, AV, etc.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--p-line)' }}>
                    {['Enveloppe', 'Type', 'Capital investi', "Durée de détention", 'Régime fiscal', 'Avantage atteint'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '10px 16px',
                        color: 'var(--p-text-faint)', fontWeight: 600,
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taxableEnvelopes.map(e => {
                    const yearsHeld       = envelopeAgeYears(e)
                    const capitalInvested = e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
                    const avantage        = getAvantage(e.type, yearsHeld)
                    const duree           = getDureeLabel(e.type, yearsHeld)
                    const regime          = getFiscalRegime(e.type)

                    return (
                      <tr
                        key={e.id}
                        style={{ borderBottom: '1px solid var(--p-line)' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--p-row-hover)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--p-text)' }}>{e.name}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                            fontSize: 11, fontWeight: 700,
                            background: 'rgba(129,140,248,0.12)', color: '#818cf8',
                          }}>
                            {e.type}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {capitalInvested > 0 ? fmt(capitalInvested) : <span style={{ color: 'var(--p-text-faint)' }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--p-text-dim)', maxWidth: 220 }}>
                          {duree}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--p-text-faint)', maxWidth: 240 }}>
                          {regime}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                            background: avantage.reached ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.10)',
                            color: avantage.reached ? '#34d399' : '#f87171',
                            whiteSpace: 'nowrap',
                          }}>
                            {avantage.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '14px 18px', borderRadius: 12,
        background: 'rgba(176,120,32,0.06)', border: '1px solid rgba(176,120,32,0.15)',
      }}>
        <Info style={{ width: 16, height: 16, color: '#B07820', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--p-text-faint)', margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#B07820' }}>Avertissement :</strong> Ce rapport est indicatif et basé sur les données saisies dans PatrImo.
          Il ne constitue pas un conseil fiscal. Consultez un conseiller fiscal ou votre notaire pour votre situation personnelle.
          Les montants de plus-values réalisées nécessitent un relevé auprès de votre courtier.
        </p>
      </div>
    </div>
  )
}
