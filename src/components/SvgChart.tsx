'use client'
import { useState, useRef, useCallback } from 'react'

// ── Shared helpers ────────────────────────────────────────────────────────────
const VW = 600
const PAD_LINE = { top: 8, right: 8, bottom: 26, left: 50 }
const VH = 170
const AREA_W = 800
const AREA_H = 260
const AREA_PAD = { l: 52, r: 16, t: 16, b: 44 }

// ── Line Chart ───────────────────────────────────────────────────────────────

export interface SvgLine {
  key: string
  label: string
  color: string
  dash?: boolean
  width?: number
  fill?: boolean  // gradient area fill beneath this line
}

interface SvgLineChartProps {
  data: Record<string, number>[]
  xKey: string
  lines: SvgLine[]
  height?: number
  xFormat?: (v: number) => string
  yFormat?: (v: number) => string
}

export function SvgLineChart({
  data, xKey, lines, height = 180, xFormat = String,
  yFormat = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)),
}: SvgLineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (!data.length) return <div style={{ height }} />

  const chartW = VW - PAD_LINE.left - PAD_LINE.right
  const chartH = VH - PAD_LINE.top - PAD_LINE.bottom

  const xVals = data.map(d => d[xKey])
  const xMin = xVals[0]; const xMax = xVals[xVals.length - 1]

  const allY = lines.flatMap(l => data.map(d => d[l.key] ?? 0)).filter(isFinite)
  const yMax = Math.max(...allY) * 1.08 || 1

  const xs = (v: number) => PAD_LINE.left + ((v - xMin) / (xMax - xMin || 1)) * chartW
  const ys = (v: number) => PAD_LINE.top + chartH - (Math.min(Math.max(v, 0), yMax) / yMax) * chartH

  const pathStr = (key: string) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xs(d[xKey]).toFixed(1)},${ys(d[key] ?? 0).toFixed(1)}`).join(' ')

  const areaStr = (key: string) => {
    const line = pathStr(key)
    const lastX = xs(data[data.length - 1][xKey])
    const firstX = xs(data[0][xKey])
    const botY = PAD_LINE.top + chartH
    return `${line} L${lastX},${botY} L${firstX},${botY} Z`
  }

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
    const idx = Math.round(((svgX - PAD_LINE.left) / chartW) * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }, [data.length, chartW])

  const hd = hoverIdx !== null ? data[hoverIdx] : null
  const pct = hoverIdx !== null ? hoverIdx / (data.length - 1) : 0
  const tooltipOnLeft = pct > 0.6

  const filledLines = lines.filter(l => l.fill)

  return (
    <div style={{ position: 'relative', height }}>
      <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: `calc(100% - 20px)` }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        <defs>
          {filledLines.map(l => (
            <linearGradient key={l.key} id={`lc-fill-${l.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={l.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={l.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {/* Y grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD_LINE.left} x2={VW - PAD_LINE.right} y1={ys(v)} y2={ys(v)} stroke="var(--p-line)" strokeWidth={0.8} />
            <text x={PAD_LINE.left - 4} y={ys(v) + 3.5} textAnchor="end" fontSize={9} fill="var(--p-text-faint)">{yFormat(v)}</text>
          </g>
        ))}
        {/* X labels */}
        {xTickIdxs.map(i => (
          <text key={i} x={xs(data[i][xKey])} y={VH - 4} textAnchor="middle" fontSize={9} fill="var(--p-text-faint)">
            {xFormat(data[i][xKey])}
          </text>
        ))}
        {/* Area fills */}
        {filledLines.map(l => (
          <path key={`area-${l.key}`} d={areaStr(l.key)} fill={`url(#lc-fill-${l.key})`} />
        ))}
        {/* Lines */}
        {lines.map(l => (
          <path key={l.key} d={pathStr(l.key)} fill="none" stroke={l.color}
            strokeWidth={l.width ?? 2} strokeDasharray={l.dash ? '5 4' : undefined} />
        ))}
        {/* Hover crosshair */}
        {hd && hoverIdx !== null && (
          <>
            <line x1={xs(hd[xKey])} x2={xs(hd[xKey])} y1={PAD_LINE.top} y2={PAD_LINE.top + chartH}
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


// ── Area Chart (premium — gradient fills, milestone dots) ─────────────────────
// Full-width SVG (800px viewBox) with gradient fills beneath each series.
// Use this as the primary chart for simulator hero sections.

export interface SvgAreaSeries {
  key: string
  label: string
  color: string
  dashed?: boolean
  noFill?: boolean  // line only, no area fill
}

interface SvgAreaChartProps {
  data: Record<string, number>[]
  xKey: string
  series: SvgAreaSeries[]
  height?: number
  xFormat?: (v: number) => string
  yFormat?: (v: number) => string
  milestones?: { xVal: number; label: string }[]  // mark specific x values
}

function dfltY(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M€` : v >= 1000 ? `${Math.round(v / 1000)}k€` : `${Math.round(v)}€`
}

export function SvgAreaChart({
  data, xKey, series, height = 280, xFormat = String, yFormat = dfltY, milestones = [],
}: SvgAreaChartProps) {
  if (!data.length) return <div style={{ height }} />
  const w = AREA_W - AREA_PAD.l - AREA_PAD.r
  const h = AREA_H - AREA_PAD.t - AREA_PAD.b
  const N = data.length - 1
  const allY = series.flatMap(s => data.map(d => d[s.key] ?? 0)).filter(isFinite)
  const maxV = (Math.max(...allY) || 1) * 1.06
  const xVals = data.map(d => d[xKey])
  const xMin = xVals[0]; const xMax = xVals[N]
  const xOf = (v: number) => AREA_PAD.l + ((v - xMin) / (xMax - xMin || 1)) * w
  const yOf = (v: number) => AREA_PAD.t + h - Math.min(v / maxV, 1) * h
  const pts = (key: string) => data.map((d, i) => ({ x: xOf(d[xKey]), y: yOf(d[key] ?? 0), i }))
  const lineD = (key: string) => pts(key).map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaD = (key: string) => {
    const p = pts(key)
    return `${lineD(key)} L${p[N].x.toFixed(1)},${(AREA_PAD.t + h).toFixed(1)} L${p[0].x.toFixed(1)},${(AREA_PAD.t + h).toFixed(1)} Z`
  }
  const yTicks = [0, maxV * 0.25, maxV * 0.5, maxV * 0.75, maxV]

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${AREA_W} ${AREA_H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        {series.filter(s => !s.noFill).map(s => (
          <linearGradient key={s.key} id={`acf-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.36} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0.03} />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, i) => {
        const y = yOf(t)
        return (
          <g key={i}>
            <line x1={AREA_PAD.l} x2={AREA_W - AREA_PAD.r} y1={y} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
            <text x={AREA_PAD.l - 7} y={y + 3.5} textAnchor="end" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-faint)">{yFormat(t)}</text>
          </g>
        )
      })}
      {/* X axis labels at milestones */}
      {milestones.map((m, i) => (
        <text key={i} x={xOf(m.xVal)} y={AREA_H - 4} textAnchor="middle" fontSize={9.5} fontFamily="var(--p-mono)" fill="var(--p-text-dim)">{m.label}</text>
      ))}
      {/* Areas */}
      {series.filter(s => !s.noFill).map(s => (
        <path key={`a-${s.key}`} d={areaD(s.key)} fill={`url(#acf-${s.key})`} />
      ))}
      {/* Lines */}
      {series.map(s => (
        <path key={`l-${s.key}`} d={lineD(s.key)} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.2 : 2.2}
          strokeDasharray={s.dashed ? '4 3' : undefined} strokeLinejoin="round" strokeLinecap="round" opacity={s.dashed ? 0.7 : 1} />
      ))}
      {/* Milestone dots */}
      {milestones.map((m, i) => {
        const mainS = series[0]
        const idx = data.findIndex(d => d[xKey] >= m.xVal)
        if (idx < 0) return null
        const cx = xOf(data[idx][xKey])
        const cy = yOf(data[idx][mainS.key] ?? 0)
        return (
          <g key={i}>
            <line x1={cx} y1={AREA_PAD.t + h} x2={cx} y2={cy} stroke={mainS.color} strokeWidth={1} opacity={0.22} strokeDasharray="2 3" />
            <circle cx={cx} cy={cy} r={7} fill="var(--p-card)" stroke={mainS.color} strokeWidth={1.5} />
            <circle cx={cx} cy={cy} r={3} fill={mainS.color} />
          </g>
        )
      })}
      {/* End dot on primary series */}
      {(() => {
        const s = series[0]
        const p = pts(s.key)
        return (
          <>
            <circle cx={p[N].x} cy={p[N].y} r={4.5} fill={s.color} />
            <circle cx={p[N].x} cy={p[N].y} r={10} fill={s.color} opacity={0.14} />
          </>
        )
      })()}
    </svg>
  )
}


// ── Bar Chart ─────────────────────────────────────────────────────────────────

export interface SvgBar {
  key: string
  label: string
  color: string
}

interface SvgBarChartProps {
  data: Record<string, number | string>[]
  xKey: string
  bars: SvgBar[]
  height?: number
  xFormat?: (v: any) => string
  yFormat?: (v: number) => string
  stacked?: boolean
}

export function SvgBarChart({
  data, xKey, bars, height = 220, xFormat = String,
  yFormat = (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)),
  stacked = false,
}: SvgBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{ row: number; bar: number } | null>(null)
  if (!data.length) return <div style={{ height }} />

  const W = 600, H = 200, PAD = { t: 8, r: 8, b: 28, l: 50 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b
  const barGroupW = cW / data.length
  const barW = Math.min(stacked ? barGroupW * 0.55 : (barGroupW * 0.75) / bars.length, 40)
  const gap = stacked ? 0 : barW * 0.15

  const allVals = stacked
    ? data.map(d => bars.reduce((s, b) => s + (Number(d[b.key]) || 0), 0))
    : data.flatMap(d => bars.map(b => Number(d[b.key]) || 0))
  const maxV = (Math.max(...allVals) || 1) * 1.1

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => t * maxV)
  const yOf = (v: number) => PAD.t + cH - (v / maxV) * cH
  const xCenter = (i: number) => PAD.l + (i + 0.5) * barGroupW

  const hov = hoveredBar
  const hovData = hov ? data[hov.row] : null

  return (
    <div style={{ position: 'relative', height }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: `calc(100% - 18px)` }}
        onMouseLeave={() => setHoveredBar(null)}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yOf(t)} y2={yOf(t)} stroke="var(--p-line)" strokeWidth={0.6} />
            <text x={PAD.l - 4} y={yOf(t) + 3.5} textAnchor="end" fontSize={8.5} fill="var(--p-text-faint)">{yFormat(t)}</text>
          </g>
        ))}
        {data.map((d, ri) => {
          let stackY = PAD.t + cH
          return (
            <g key={ri}>
              {bars.map((b, bi) => {
                const val = Number(d[b.key]) || 0
                const bH = Math.max((val / maxV) * cH, 0)
                let bX: number, bY: number
                if (stacked) {
                  bX = xCenter(ri) - barW / 2
                  stackY -= bH
                  bY = stackY
                } else {
                  const totalW = bars.length * barW + (bars.length - 1) * gap
                  bX = xCenter(ri) - totalW / 2 + bi * (barW + gap)
                  bY = yOf(val)
                }
                const isHov = hov?.row === ri && hov?.bar === bi
                return (
                  <rect key={bi} x={bX} y={bY} width={barW} height={bH}
                    fill={b.color} opacity={isHov ? 1 : 0.85} rx={2}
                    onMouseEnter={() => setHoveredBar({ row: ri, bar: bi })} />
                )
              })}
              <text x={xCenter(ri)} y={H - 4} textAnchor="middle" fontSize={8.5} fill="var(--p-text-faint)">
                {xFormat(d[xKey])}
              </text>
            </g>
          )
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 2 }}>
        {bars.map(b => (
          <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, display: 'inline-block' }} />
            <span style={{ fontSize: 9.5, color: 'var(--p-text-faint)' }}>{b.label}</span>
          </div>
        ))}
      </div>
      {/* Tooltip */}
      {hovData && hov && (
        <div style={{
          position: 'absolute', top: 0, left: `${(hov.row / data.length) * 100}%`,
          transform: hov.row > data.length / 2 ? 'translateX(-110%)' : 'translateX(10%)',
          pointerEvents: 'none', zIndex: 10,
          background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 8,
          padding: '5px 9px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 100,
        }}>
          <div style={{ fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{xFormat(hovData[xKey])}</div>
          {bars.map(b => (
            <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: b.color }}>{b.label}</span>
              <span style={{ color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{yFormat(Number(hovData[b.key]) || 0)}</span>
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


// ── Ring Donut (with serif center text) ──────────────────────────────────────
// Used by simulator pages: shows a single % value in the center.

interface SvgRingDonutProps {
  pct: number        // 0–100
  color: string
  centerLabel: string  // e.g. "Intérêts"
  size?: number
}

export function SvgRingDonut({ pct, color, centerLabel, size = 160 }: SvgRingDonutProps) {
  const r = size / 2 - 12
  const cx = size / 2, cy = size / 2
  const c = 2 * Math.PI * r
  const clampedPct = Math.max(0, Math.min(pct, 100))
  const dash = c * (clampedPct / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}18`} strokeWidth={14} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={0} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{centerLabel}</div>
        <div style={{ fontFamily: 'var(--p-serif)', fontSize: 32, color: 'var(--p-text)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 2 }}>{Math.round(clampedPct)}%</div>
      </div>
    </div>
  )
}
