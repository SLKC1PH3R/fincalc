'use client'
import { useState, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { useTheme } from '@/contexts/ThemeContext'
import { REGION_COLORS, REGION_LABELS, type GeoAllocation } from '@/lib/etf-database'
import { fmt } from '@/lib/utils'

// World Atlas topojson — contours pays (résolution 110m)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ── Mapping ISO numérique → région ──────────────────────────────
const COUNTRY_REGION: Record<number, keyof GeoAllocation> = {
  // Amérique du Nord
  840: 'northAmerica', 124: 'northAmerica', 630: 'northAmerica',
  // Europe
  276: 'europe', 250: 'europe', 826: 'europe', 380: 'europe',
  724: 'europe', 528: 'europe', 756: 'europe', 752: 'europe',
  208: 'europe', 246: 'europe', 578: 'europe',  40: 'europe',
   56: 'europe', 620: 'europe', 372: 'europe', 300: 'europe',
  616: 'europe', 203: 'europe', 348: 'europe', 642: 'europe',
  191: 'europe', 703: 'europe', 705: 'europe', 233: 'europe',
  428: 'europe', 440: 'europe', 442: 'europe', 470: 'europe',
  196: 'europe', 100: 'europe', 792: 'europe', 807: 'europe',
  // Asie-Pacifique (développée)
  392: 'asiaPacific',  36: 'asiaPacific', 554: 'asiaPacific',
  344: 'asiaPacific', 702: 'asiaPacific', 158: 'asiaPacific',
  // Marchés émergents
  156: 'emergingMarkets', 356: 'emergingMarkets', 410: 'emergingMarkets',
   76: 'emergingMarkets', 710: 'emergingMarkets', 643: 'emergingMarkets',
  484: 'emergingMarkets', 682: 'emergingMarkets', 784: 'emergingMarkets',
  360: 'emergingMarkets', 458: 'emergingMarkets', 764: 'emergingMarkets',
  608: 'emergingMarkets', 704: 'emergingMarkets',  50: 'emergingMarkets',
  586: 'emergingMarkets', 818: 'emergingMarkets', 566: 'emergingMarkets',
  600: 'emergingMarkets', 604: 'emergingMarkets', 152: 'emergingMarkets',
  170: 'emergingMarkets',  32: 'emergingMarkets',
}

function getRegion(numericId: number): keyof GeoAllocation {
  return COUNTRY_REGION[numericId] ?? 'other'
}

function getCountryColor(
  region: keyof GeoAllocation,
  allocation: GeoAllocation,
  hovered: boolean,
  isDark: boolean,
): string {
  const pct = allocation[region]
  if (pct === 0) return hovered ? (isDark ? '#374151' : '#9ca3af') : (isDark ? '#1f2937' : '#d1d5db')

  const baseColor = REGION_COLORS[region]
  const opacity = Math.max(0.35, Math.min(1, 0.35 + pct * 0.65))
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  const o = hovered ? Math.min(1, opacity + 0.2) : opacity
  return `rgba(${r},${g},${b},${o})`
}

// ── Types ────────────────────────────────────────────────────────
interface TooltipState {
  x: number
  y: number
  country: string
  region: string
  pct: number
}

interface WorldMapChartProps {
  allocation: GeoAllocation
  values?: Partial<Record<keyof GeoAllocation, number>>
  totalValue?: number
  height?: number
}

// ── Composant ────────────────────────────────────────────────────
export const WorldMapChart = memo(function WorldMapChart({
  allocation,
  values = {},
  totalValue = 0,
  height = 380,
}: WorldMapChartProps) {
  const { theme } = useTheme()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const isDark = theme === 'dark'
  const strokeColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const strokeHover = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'
  const oceanColor = isDark ? '#0c1a2e' : '#dbeafe'

  const legendRows = (Object.keys(REGION_LABELS) as (keyof GeoAllocation)[])
    .map(key => ({
      key,
      label: REGION_LABELS[key],
      pct: allocation[key] ?? 0,
      value: values[key] ?? 0,
      color: REGION_COLORS[key],
    }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', width: '100%' }}>
      {/* ── Carte ── */}
      <div
        style={{
          flex: 1, minWidth: 0, position: 'relative',
          background: oceanColor, borderRadius: 12, overflow: 'hidden',
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        <ComposableMap
          projection="geoNaturalEarth1"
          style={{ width: '100%', height }}
          projectionConfig={{ scale: 140 }}
        >
          <ZoomableGroup zoom={1} center={[0, 0]}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const numericId = Number(geo.id)
                  const region = getRegion(numericId)
                  const countryName = String(geo.properties?.name ?? '')

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e) => {
                        const rect = (e.currentTarget as SVGElement).closest('div')?.getBoundingClientRect()
                        if (!rect) return
                        setTooltip({
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top - 40,
                          country: countryName,
                          region: REGION_LABELS[region],
                          pct: allocation[region] * 100,
                        })
                      }}
                      onMouseMove={(e) => {
                        const rect = (e.currentTarget as SVGElement).closest('div')?.getBoundingClientRect()
                        if (!rect) return
                        setTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top - 40 } : null)
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: getCountryColor(region, allocation, false, isDark),
                          stroke: strokeColor,
                          strokeWidth: 0.5,
                        },
                        hover: {
                          fill: getCountryColor(region, allocation, true, isDark),
                          stroke: strokeHover,
                          strokeWidth: 0.7,
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: getCountryColor(region, allocation, true, isDark),
                          stroke: strokeHover,
                          strokeWidth: 0.7,
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip custom */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, (height * 1.8) - 180),
            top: Math.max(8, tooltip.y),
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 8,
            fontSize: 12,
            padding: '6px 10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            <div style={{ fontWeight: 600 }}>{tooltip.country}</div>
            <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{tooltip.region} — {tooltip.pct.toFixed(1)} %</div>
          </div>
        )}
      </div>

      {/* ── Légende ── */}
      <div style={{ flexShrink: 0, width: 220, display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
        {legendRows.map(row => (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 0',
              borderBottom: '1px solid var(--section-border)',
              opacity: row.pct === 0 ? 0.45 : 1,
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: row.pct === 0 ? '#9ca3af' : row.color,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                {row.label}
              </div>
              {totalValue > 0 && row.value > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>
                  {fmt(row.value)}
                </div>
              )}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: row.pct === 0 ? 'var(--text-subtle)' : 'var(--text-em)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {(row.pct * 100).toFixed(2)} %
            </div>
          </div>
        ))}

        {totalValue > 0 && (
          <div style={{
            marginTop: 6, paddingTop: 8,
            borderTop: '1px solid var(--section-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Analysé
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {fmt(totalValue)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
