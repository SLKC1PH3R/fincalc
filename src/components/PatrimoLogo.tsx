import React from 'react'

interface PatrimoLogoProps {
  /** 'dark' = blanc/doré sur fond sombre (défaut). 'light' = ambre/noir sur fond clair. */
  variant?: 'dark' | 'light'
  /** Largeur en px — hauteur calculée proportionnellement (viewBox 172×36). */
  width?: number
  /** Suffixe unique pour l'ID du dégradé SVG — évite les conflits quand plusieurs logos coexistent. */
  uid?: string
  style?: React.CSSProperties
  className?: string
}

export function PatrimoLogo({
  variant = 'dark',
  width = 140,
  uid = 'a',
  style,
  className,
}: PatrimoLogoProps) {
  const height = Math.round(width * 36 / 172)
  const gId = `gPLogo-${variant}-${uid}`
  const dark = variant === 'dark'

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 172 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={className}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          {dark ? (
            <>
              <stop offset="0%" stopColor="#f1c086" />
              <stop offset="100%" stopColor="#c8922a" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#c8922a" />
              <stop offset="100%" stopColor="#a07020" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Dot above P */}
      <circle cx="7" cy="5" r="3.5" fill={`url(#${gId})`} />

      {/* P — gradient */}
      <text
        x="0" y="31"
        fontFamily="Geist, Inter, sans-serif"
        fontWeight="800"
        fontSize="25"
        fill={`url(#${gId})`}
        letterSpacing="-0.8"
      >P</text>

      {/* atrimo — white or dark */}
      <text
        x="18" y="31"
        fontFamily="Geist, Inter, sans-serif"
        fontWeight="800"
        fontSize="25"
        fill={dark ? '#ffffff' : '#111111'}
        letterSpacing="-0.8"
      >atrimo</text>

      {/* Separator line */}
      <line
        x1="100" y1="7" x2="109" y2="31"
        stroke={dark ? 'rgba(200,146,42,0.35)' : 'rgba(160,112,32,0.3)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* "finance" tagline */}
      <text
        x="114" y="27"
        fontFamily="Geist, Inter, sans-serif"
        fontWeight="400"
        fontSize="11"
        fill={dark ? 'rgba(241,192,134,0.45)' : 'rgba(160,112,32,0.55)'}
        letterSpacing="0.04em"
      >finance</text>
    </svg>
  )
}

/** Icône P seule (favicon / sidebar réduite / intro animation). */
export function PatrimoPIcon({
  size = 34,
  uid = 'pi',
  style,
}: {
  size?: number
  uid?: string
  style?: React.CSSProperties
}) {
  const height = Math.round(size * 40 / 34)
  const gId = `gPIcon-${uid}`
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
          <stop offset="0%" stopColor="#f1c086" />
          <stop offset="100%" stopColor="#c8922a" />
        </linearGradient>
      </defs>
      <circle cx="9" cy="5" r="4" fill={`url(#${gId})`} />
      <text
        x="0" y="38"
        fontFamily="Geist, Inter, sans-serif"
        fontWeight="900"
        fontSize="36"
        fill={`url(#${gId})`}
        letterSpacing="-2"
      >P</text>
    </svg>
  )
}
