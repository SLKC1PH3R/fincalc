'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, ChevronRight } from 'lucide-react'
import {
  lookupByIsin, lookupByTicker, getAlternatives, calcFeeImpact,
  type ETFInfo,
} from '@/lib/etf-database'
import { type Position, type PriceData, fmtEur, fmtCompact } from '@/components/patrimoine/types'

function GrowthChart({ data, currentLabel, altLabel }: { data: { year: number; current: number; alternative: number }[]; currentLabel: string; altLabel: string }) {
  const W = 600, H = 160, PAD = { l: 56, r: 16, t: 10, b: 30 }
  const w = W - PAD.l - PAD.r, h = H - PAD.t - PAD.b
  const N = data.length - 1
  if (N < 1) return null
  const maxV = Math.max(...data.map(d => Math.max(d.current, d.alternative))) * 1.05 || 1
  const xy = (i: number, v: number) => ({ x: PAD.l + (i / N) * w, y: PAD.t + h - (v / maxV) * h })
  const line = (key: 'current' | 'alternative') => data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xy(i, d[key]).x.toFixed(1)},${xy(i, d[key]).y.toFixed(1)}`).join(' ')
  const area = (key: 'current' | 'alternative') => `${line(key)} L${PAD.l + w},${PAD.t + h} L${PAD.l},${PAD.t + h} Z`
  const fmtK = (n: number) => n >= 1000 ? Math.round(n / 1000) + 'k' : String(Math.round(n))
  const yTicks = [0, maxV * 0.5, maxV]
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="curGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.18} /><stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.22} /><stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => {
        const y = PAD.t + h - (t / maxV) * h
        return <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
          <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{fmtK(t)}€</text>
        </g>
      })}
      <path d={area('current')} fill="url(#curGrad)" />
      <path d={area('alternative')} fill="url(#altGrad)" />
      <path d={line('current')} fill="none" stroke="#818cf8" strokeWidth={1.5} />
      <path d={line('alternative')} fill="none" stroke="#34d399" strokeWidth={2} />
      {data.filter((_, i) => i % Math.max(1, Math.floor(N / 5)) === 0 || i === N).map((d) => {
        const origIdx = data.indexOf(d)
        const p = xy(origIdx, d.current)
        return <text key={origIdx} x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">+{d.year}a</text>
      })}
      {/* Legend */}
      <rect x={PAD.l} y={PAD.t} width={8} height={8} rx={2} fill="#818cf8" fillOpacity={0.7} />
      <text x={PAD.l + 12} y={PAD.t + 7} fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{currentLabel}</text>
      <rect x={PAD.l + 90} y={PAD.t} width={8} height={8} rx={2} fill="#34d399" fillOpacity={0.7} />
      <text x={PAD.l + 104} y={PAD.t + 7} fontSize={9} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{altLabel}</text>
    </svg>
  )
}

function EtfCard({ pos, prices, years, returnRate }: {
  pos: Position
  prices: Record<string, PriceData>
  years: number
  returnRate: number
}) {
  const pd = prices[pos.symbol]
  const posValue = pd ? pd.priceEur * pos.quantity : pos.pru * pos.quantity
  const [expanded, setExpanded] = useState(false)

  const etfInfo: ETFInfo | null = lookupByTicker(pos.symbol) ?? (pos.isin ? lookupByIsin(pos.isin) : null)
  const alternatives = etfInfo ? getAlternatives(etfInfo.isin) : []
  const bestAlternative = alternatives.length > 0 ? alternatives.reduce((best, alt) => alt.ter < best.ter ? alt : best) : null

  if (!etfInfo) {
    return (
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--p-row-hover)', border: '1px solid var(--p-line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--p-text-faint)', marginLeft: 8 }}>{pos.name}</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--p-text-faint)', fontStyle: 'italic' }}>ETF non référencé — ajoutez l'ISIN pour l'analyser</span>
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
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)' }}>{pos.symbol}</span>
            <span style={{ fontSize: 12, color: 'var(--p-text-faint)', marginLeft: 8 }}>{etfInfo.name}</span>
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
          <ChevronRight style={{ width: 14, height: 14, color: 'var(--p-text-faint)', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
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
                <div style={{ fontSize: 11, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{item.value}</div>
                {item.sub && <div style={{ fontSize: 11, color: '#f59e0b' }}>{item.sub}</div>}
              </div>
            ))}
          </div>

          {alternatives.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', marginBottom: 8 }}>
                {isOptimal ? '✅ Vous avez déjà un bon ETF' : '💡 Alternatives moins chères sur le même benchmark'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alternatives.map(alt => (
                  <div key={alt.isin} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8,
                    background: alt.ter < etfInfo.ter ? '#34d39910' : 'var(--p-row-hover)',
                    border: `1px solid ${alt.ter < etfInfo.ter ? '#34d39930' : 'var(--p-line)'}`,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)' }}>{alt.ticker} — {alt.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>
                        {alt.replication === 'synthetic' ? 'Synthétique' : 'Physique'} • {alt.aum.toLocaleString('fr-FR')} M€
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: alt.ter < etfInfo.ter ? '#34d399' : 'var(--p-text)' }}>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-text)', marginBottom: 8 }}>
                Impact des frais sur {years} ans (rendement brut {(returnRate * 100).toFixed(0)} %)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[
                  { label: `${pos.symbol} (actuel)`, value: fmtCompact(feeImpact.value1), color: '#94a3b8' },
                  { label: `${bestAlternative.ticker} (alternative)`, value: fmtCompact(feeImpact.value2), color: '#34d399' },
                  { label: 'Moins-value frais', value: `+${fmtCompact(feeImpact.feeDrag)}`, color: '#f59e0b', sub: 'Gain si tu migres' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--p-row-hover)' }}>
                    <div style={{ fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                    {k.sub && <div style={{ fontSize: 10, color: 'var(--p-text-dim)', marginTop: 2 }}>{k.sub}</div>}
                  </div>
                ))}
              </div>
              <GrowthChart data={chartData} currentLabel={pos.symbol} altLabel={bestAlternative.ticker} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EtfOptimizerSection({ positions, prices }: {
  positions: Position[]
  prices: Record<string, PriceData>
}) {
  const etfPositions = positions.filter(p => p.assetType === 'ETF')
  const [years, setYears] = useState(20)
  const [returnRate, setReturnRate] = useState(8)

  return (
    <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
      <CardContent style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap style={{ width: 16, height: 16, color: '#f97316' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)' }}>Optimisation ETF</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--p-text-faint)', marginBottom: 16 }}>
          Analyse des frais de gestion et impact sur votre Patrimoine à long terme
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
            <EtfCard key={pos.id} pos={pos} prices={prices} years={years} returnRate={returnRate / 100} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
