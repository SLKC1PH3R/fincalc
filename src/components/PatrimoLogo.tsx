import React from 'react'

interface PatrimoLogoProps {
  variant?: 'dark' | 'light'
  width?: number
  uid?: string
  style?: React.CSSProperties
  className?: string
}

export function PatrimoLogo({
  variant = 'light',
  width = 140,
  style,
  className,
}: PatrimoLogoProps) {
  const fs = Math.round(width / 6.5)
  const dotSize = Math.max(4, Math.round(fs * 0.22))
  const dotUp = Math.round(fs * 0.34)

  const ink   = variant === 'dark' ? '#FFFFFF'              : '#0A0A0A'
  const muted = variant === 'dark' ? 'rgba(176,120,32,0.65)': '#6B6356'
  const line  = variant === 'dark' ? 'rgba(176,120,32,0.28)': 'rgba(10,10,10,0.14)'

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <span style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: fs,
        color: ink,
        letterSpacing: '-0.02em',
      }}>P</span>

      {/* gold dot */}
      <span style={{
        width: dotSize,
        height: dotSize,
        borderRadius: '50%',
        background: '#B07820',
        display: 'inline-block',
        transform: `translateY(-${dotUp}px)`,
        flexShrink: 0,
      }} />

      <span style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: fs,
        color: ink,
        letterSpacing: '-0.02em',
      }}>atrimo</span>

    </div>
  )
}

/** Icône P seule (favicon / sidebar réduite). */
export function PatrimoPIcon({
  size = 34,
  uid = 'pi',
  style,
}: {
  size?: number
  uid?: string
  style?: React.CSSProperties
}) {
  const gId = `gPIcon-${uid}`
  const height = Math.round(size * 40 / 34)
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 34 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B07820" />
          <stop offset="100%" stopColor="#8B5E18" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="5" r="4" fill={`url(#${gId})`} />
      <text
        x="0" y="38"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontWeight="400"
        fontSize="36"
        fill={`url(#${gId})`}
        letterSpacing="-2"
      >P</text>
    </svg>
  )
}
