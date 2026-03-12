'use client'
import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChartTheme } from '@/lib/chart-theme'
import { Zap, ChevronRight } from 'lucide-react'
import {
  lookupByIsin, lookupByTicker, getAlternatives, calcFeeImpact,
  type ETFInfo,
} from '@/lib/etf-database'
import { type Position, type PriceData, fmtEur, fmtCompact } from '@/components/patrimoine/types'

function EtfCard({ pos, prices, years, returnRate, chartTheme }: {
  pos: Position
  prices: Record<string, PriceData>
  years: number
  returnRate: number
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const pd = prices[pos.symbol]
  const posValue = pd ? pd.priceEur * pos.quantity : pos.pru * pos.quantity
  const [expanded, setExpanded] = useState(false)

  const etfInfo: ETFInfo | null = lookupByTicker(pos.symbol) ?? (pos.isin ? lookupByIsin(pos.isin) : null)
  const alternatives = etfInfo ? getAlternatives(etfInfo.isin) : []
  const bestAlternative = alternatives.length > 0 ? alternatives.reduce((best, alt) => alt.ter < best.ter ? alt : best) : null

  if (!etfInfo) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--row-hover)', border: '1px solid var(--section-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginLeft: 8 }}>{pos.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>ETF non référencé — ajoutez l'ISIN pour l'analyser</span>
        </div>
      </div>
    )
  }

  const feeImpact = bestAlternative
    ? calcFeeImpact(posValue, years, returnRate, etfInfo.ter, bestAlternative.ter)
    : null

  const chartData = bestAlternative ? Array.from({ length: years + 1 }, (_, i) => {
    const r1 = returnRate - etfInfo.ter
    const r2 = returnRate - bestAlternative.ter
    return {
      year: i,
      current: Math.round(posValue * Math.pow(1 + r1, i)),
      alternative: Math.round(posValue * Math.pow(1 + r2, i)),
    }
  }) : []

  const isOptimal = !bestAlternative || etfInfo.ter <= bestAlternative.ter

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${isOptimal ? '#34d39930' : '#f59e0b30'}`, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', padding: '14px 16px', background: isOptimal ? '#34d39908' : '#f59e0b08',
          border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isOptimal ? '#34d399' : '#f59e0b', flexShrink: 0,
          }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginLeft: 8 }}>{etfInfo.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: etfInfo.ter <= 0.002 ? '#34d39918' : etfInfo.ter <= 0.004 ? '#f59e0b18' : '#ef444418',
              color: etfInfo.ter <= 0.002 ? '#34d399' : etfInfo.ter <= 0.004 ? '#f59e0b' : '#ef4444',
            }}>
              {(etfInfo.ter * 100).toFixed(2)} % TER
            </span>
          </div>
          <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '16px 16px', borderTop: `1px solid ${isOptimal ? '#34d39920' : '#f59e0b20'}` }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { label: 'Benchmark', value: etfInfo.benchmark },
              { label: 'Réplication', value: etfInfo.replication === 'synthetic' ? 'Synthétique' : 'Physique' },
              { label: 'Encours', value: `${etfInfo.aum.toLocaleString('fr-FR')} M€` },
              { label: 'Frais annuels sur', value: fmtEur(posValue), sub: `${fmtEur(posValue * etfInfo.ter)} / an` },
            ].map(item => (
              <div key={item.label} style={{ minWidth: 120 }}>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: 11, color: '#f59e0b' }}>{item.sub}</div>}
              </div>
            ))}
          </div>

          {alternatives.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {isOptimal ? '✅ Vous avez déjà un bon ETF' : '💡 Alternatives moins chères sur le même benchmark'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alternatives.map(alt => (
                  <div key={alt.isin} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8,
                    background: alt.ter < etfInfo.ter ? '#34d39910' : 'var(--row-hover)',
                    border: `1px solid ${alt.ter < etfInfo.ter ? '#34d39930' : 'var(--section-border)'}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{alt.ticker} — {alt.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                        {alt.replication === 'synthetic' ? 'Synthétique' : 'Physique'} • {alt.aum.toLocaleString('fr-FR')} M€
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alt.ter < etfInfo.ter ? '#34d399' : 'var(--text-primary)' }}>
                        {(alt.ter * 100).toFixed(2)} % TER
                      </div>
                      {alt.ter < etfInfo.ter && (
                        <div style={{ fontSize: 11, color: '#34d399' }}>
                          -{((etfInfo.ter - alt.ter) * 10000).toFixed(0)} bps
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feeImpact && bestAlternative && !isOptimal && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Impact des frais sur {years} ans (rendement brut {(returnRate * 100).toFixed(0)} %)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: `${pos.symbol} (actuel)`, value: fmtCompact(feeImpact.value1), color: '#94a3b8' },
                  { label: `${bestAlternative.ticker} (alternative)`, value: fmtCompact(feeImpact.value2), color: '#34d399' },
                  { label: 'Moins-value frais', value: `+${fmtCompact(feeImpact.feeDrag)}`, color: '#f59e0b', sub: 'Gain si tu migres' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--row-hover)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                    {k.sub && <div style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>{k.sub}</div>}
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="year" tickFormatter={v => `+${v}a`} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                  <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} width={65} />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmtEur(v), name === 'current' ? `${pos.symbol}` : `${bestAlternative.ticker}`]}
                    contentStyle={{ background: chartTheme.tooltip.background, border: `1px solid ${chartTheme.tooltip.border}`, borderRadius: 8, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="current" stroke="#94a3b8" fill="#94a3b812" name="current" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="alternative" stroke="#34d399" fill="#34d39918" name="alternative" strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EtfOptimizerSection({ positions, prices, chartTheme }: {
  positions: Position[]
  prices: Record<string, PriceData>
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const etfPositions = positions.filter(p => p.assetType === 'ETF')
  const [years, setYears] = useState(20)
  const [returnRate, setReturnRate] = useState(8)

  return (
    <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
      <CardContent style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap style={{ width: 16, height: 16, color: '#f97316' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Optimisation ETF</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
          Analyse des frais de gestion et impact sur votre patrimoine à long terme
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Horizon (années)</Label>
            <Input type="number" value={years} onChange={e => setYears(parseInt(e.target.value) || 20)} style={{ width: 80 }} />
          </div>
          <div>
            <Label style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Rendement brut estimé (%)</Label>
            <Input type="number" value={returnRate} onChange={e => setReturnRate(parseFloat(e.target.value) || 8)} style={{ width: 80 }} />
          </div>
        </div>

        <div className="space-y-4">
          {etfPositions.map(pos => (
            <EtfCard key={pos.id} pos={pos} prices={prices} years={years} returnRate={returnRate / 100} chartTheme={chartTheme} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
