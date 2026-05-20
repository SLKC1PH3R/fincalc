'use client'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { calcPortfolioGeo } from '@/lib/etf-database'
import { type Position, type PriceData, fmtCompact } from '@/components/patrimoine/types'

const WorldMapChart = dynamic(
  () => import('@/components/WorldMapChart').then(m => m.WorldMapChart),
  { ssr: false, loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-faint)', fontSize: 13 }}>Chargement de la carte…</div> }
)

export function GeoMapSection({ positions, prices }: {
  positions: Position[]
  prices: Record<string, PriceData>
}) {
  const geoAlloc = useMemo(() => {
    const positionsForGeo = positions
      .filter(p => ['ETF', 'STOCK'].includes(p.assetType))
      .map(p => {
        const pd = prices[p.symbol]
        const value = pd ? pd.priceEur * p.quantity : p.pru * p.quantity
        return { value, ticker: p.symbol }
      })
    const geo = calcPortfolioGeo(positionsForGeo)
    const values: Partial<Record<string, number>> = {}
    const tv = geo.totalValue
    for (const key of ['northAmerica', 'europe', 'asiaPacific', 'emergingMarkets', 'other'] as const) {
      values[key] = geo[key] * tv
    }
    return { ...geo, values, totalGeo: tv }
  }, [positions, prices])

  if (geoAlloc.totalGeo <= 0) return null

  return (
    <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
      <CardContent style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)', marginBottom: 4 }}>
          Répartition géographique
        </div>
        <div style={{ fontSize: 11, color: 'var(--p-text-faint)', marginBottom: 16 }}>
          Calculé sur {fmtCompact(geoAlloc.totalGeo)} d'actifs reconnus
        </div>
        <WorldMapChart
          allocation={geoAlloc}
          values={geoAlloc.values}
          totalValue={geoAlloc.totalGeo}
          height={300}
        />
      </CardContent>
    </Card>
  )
}
