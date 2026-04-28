interface ScoreGaugeProps {
  score: number
  size?: number        // diameter in px (default 180)
  strokeWidth?: number // arc stroke width (default auto-scaled)
  color?: string       // override color (default auto from score)
  showLabel?: boolean  // show /100 sub-label (default true for large, false for small)
}

export function ScoreGauge({ score, size = 180, strokeWidth, color, showLabel }: ScoreGaugeProps) {
  const autoColor = score >= 80 ? '#34d399' : score >= 60 ? '#B07820' : score >= 40 ? '#fb923c' : '#f87171'
  const c = color ?? autoColor
  const sw = strokeWidth ?? Math.round(size * 0.055)
  const r = size * 0.4
  const cx = size / 2, cy = size / 2
  const startAngle = 210, totalArc = 300
  const filledArc = (score / 100) * totalArc
  const toRad = (d: number) => (d * Math.PI) / 180
  const pt = (a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) })
  const ts = pt(startAngle), te = pt(startAngle + totalArc), fe = pt(startAngle + filledArc)
  const large = size >= 120
  const showSub = showLabel ?? large

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <path
        d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} strokeLinecap="round"
      />
      {score > 0 && (
        <path
          d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 ${filledArc > 180 ? 1 : 0} 1 ${fe.x} ${fe.y}`}
          fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${Math.round(sw * 0.6)}px ${c}80)` }}
        />
      )}
      <text
        x={cx} y={cy + (showSub ? -size * 0.033 : size * 0.033)}
        textAnchor="middle" fill={c}
        fontSize={Math.round(size * 0.178)} fontWeight={700} fontFamily="system-ui"
      >{score}</text>
      {showSub && (
        <text
          x={cx} y={cy + size * 0.078}
          textAnchor="middle" fill="rgba(255,255,255,0.4)"
          fontSize={Math.round(size * 0.067)} fontFamily="system-ui"
        >/100</text>
      )}
    </svg>
  )
}
