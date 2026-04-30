'use client'
import { useState, useRef, useCallback } from 'react'

// ── Line Chart ───────────────────────────────────────────────────────────────

export interface SvgLine {
  key: string
  label: string
  color: string
  dash?: boolean
  width?: number
}

interface SvgLineChartProps {
  data: Record<string, number>[]
  xKey: string
  lines: SvgLine[]
  height?: number
  xFormat?: (v: number) => string
  yFormat?: (v: number) => string
}

const VW = 600
const PAD = { top: 8, right: 8, bottom: 26, left: 50 }
const VH = 170

export function SvgLineChart({
  data, xKey, lines, height = 180, xFormat = String,
  yFormat = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)),
}: SvgLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (!data.length) return <div style={{ height }} />

  const chartW = VW - PAD.left - PAD.right
  const chartH = VH - PAD.top - PAD.bottom

  const xVals = data.map(d => d[xKey])
  const xMin = xVals[0]; const xMax = xVals[xVals.length - 1]

  const allY = lines.flatMap(l => data.map(d => d[l.key] ?? 0)).filter(isFinite)
  const yMax = Math.max(...allY) * 1.08 || 1

  const xs = (v: number) => PAD.left + ((v - xMin) / (xMax - xMin || 1)) * chartW
  const ys = (v: number) => PAD.top + chartH - (Math.min(Math.max(v, 0), yMax) / yMax) * chartH

  const path = (key: string) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xs(d[xKey]).toFixed(1)},${ys(d[key] ?? 0).toFixed(1)}`).join(' ')

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => t * yMax)

  const step = Math.max(1, Math.floor(data.length / 5))
  const xTickIdxs = data.reduce((acc: number[], _, i) => {
    if (i === 0 || i % step === 0 || i === data.length - 1) acc.push(i)
    return acc
  }, []).filter((v, i, a) => a.indexOf(v) === i)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * VW
    const idx = Math.round(((svgX - PAD.left) / chartW) * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }, [data.length, chartW])

  const hd = hoverIdx !== null ? data[hoverIdx] : null
  const pct = hoverIdx !== null ? hoverIdx / (data.length - 1) : 0
  const tooltipOnLeft = pct > 0.6

  return (
    <div style={{ position: 'relative', height }}>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: `calc(100% - 20px)` }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        {/* Y grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={VW - PAD.right} y1={ys(v)} y2={ys(v)} stroke="var(--p-line)" strokeWidth={0.8} />
            <text x={PAD.left - 4} y={ys(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--p-text-faint)">{yFormat(v)}</text>
          </g>
        ))}
        {/* X labels */}
        {xTickIdxs.map(i => (
          <text key={i} x={xs(data[i][xKey])} y={VH - 4} textAnchor="middle" fontSize={9} fill="var(--p-text-faint)">
            {xFormat(data[i][xKey])}
          </text>
        ))}
        {/* Lines */}
        {lines.map(l => (
          <path key={l.key} d={path(l.key)} fill="none" stroke={l.color}
            strokeWidth={l.width ?? 2} strokeDasharray={l.dash ? '5 4' : undefined} />
        ))}
        {/* Hover crosshair */}
        {hd && hoverIdx !== null && (
          <>
            <line x1={xs(hd[xKey])} x2={xs(hd[xKey])} y1={PAD.top} y2={PAD.top + chartH}
              stroke="var(--p-text-faint)" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
            {lines.map(l => (
              <circle key={l.key} cx={xs(hd[xKey])} cy={ys(hd[l.key] ?? 0)} r={3.5}
                fill={l.color} stroke="var(--p-card)" strokeWidth={1.5} />
            ))}
          </>
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 2 }}>
        {lines.map(l => (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={18} height={8} viewBox="0 0 18 8">
              <line x1={0} x2={18} y1={4} y2={4} stroke={l.color} strokeWidth={2}
                strokeDasharray={l.dash ? '4 3' : undefined} />
            </svg>
            <span style={{ fontSize: 10, color: 'var(--p-text-faint)' }}>{l.label}</span>
          </div>
        ))}
      </div>
      {/* Tooltip */}
      {hd && hoverIdx !== null && (
        <div style={{
          position: 'absolute', top: 0, pointerEvents: 'none', zIndex: 10,
          left: tooltipOnLeft ? `calc(${pct * 100}% - 148px)` : `calc(${pct * 100}% + 10px)`,
          background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 8,
          padding: '5px 9px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 130,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{xFormat(hd[xKey])}</div>
          {lines.map(l => (
            <div key={l.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: l.color }}>{l.label}</span>
              <span style={{ color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{yFormat(hd[l.key] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Donut Chart ──────────────────────────────────────────────────────────────

export interface DonutSeg {
  value: number
  color: string
  label: string
}

interface SvgDonutProps {
  segments: DonutSeg[]
  width?: number
  height?: number
  outerRadius?: number
  innerRadius?: number
}

export function SvgDonut({ segments, width = 150, height = 110, outerRadius = 48, innerRadius = 32 }: SvgDonutProps) {
  const cx = width / 2; const cy = height / 2
  const total = segments.reduce((s, g) => s + Math.max(g.value, 0), 0)
  if (total <= 0) return <svg width={width} height={height} />

  const GAP = 0.04
  let angle = -Math.PI / 2

  const arcs = segments.map(seg => {
    const span = (Math.max(seg.value, 0) / total) * (2 * Math.PI - GAP * segments.length)
    const a1 = angle; const a2 = a1 + span
    const lg = span > Math.PI ? 1 : 0
    const cos1 = Math.cos(a1); const sin1 = Math.sin(a1)
    const cos2 = Math.cos(a2); const sin2 = Math.sin(a2)
    const d = [
      `M${cx + outerRadius * cos1},${cy + outerRadius * sin1}`,
      `A${outerRadius},${outerRadius} 0 ${lg} 1 ${cx + outerRadius * cos2},${cy + outerRadius * sin2}`,
      `L${cx + innerRadius * cos2},${cy + innerRadius * sin2}`,
      `A${innerRadius},${innerRadius} 0 ${lg} 0 ${cx + innerRadius * cos1},${cy + innerRadius * sin1}`,
      'Z',
    ].join(' ')
    angle = a2 + GAP
    return { d, color: seg.color }
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
    </svg>
  )
}
