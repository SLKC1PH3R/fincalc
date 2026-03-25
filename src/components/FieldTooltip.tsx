'use client'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface FieldTooltipProps {
  text: string
  /** Position of tooltip relative to the icon. Default: 'right' */
  side?: 'right' | 'left' | 'top'
  width?: number
}

/**
 * Reusable inline tooltip trigger for simulator fields.
 * Usage: <Label>Taux annuel <FieldTooltip text="Le MSCI World a rapporté ~7%/an sur 30 ans" /></Label>
 */
export function FieldTooltip({ text, side = 'right', width = 240 }: FieldTooltipProps) {
  const [open, setOpen] = useState(false)

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 50,
    width,
    borderRadius: 10,
    border: '1px solid var(--card-dark-border)',
    background: 'var(--card-dark)',
    color: 'var(--text-muted-c)',
    padding: '10px 12px',
    fontSize: 12,
    lineHeight: 1.55,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    whiteSpace: 'normal',
    fontWeight: 400,
    pointerEvents: 'none',
  }

  if (side === 'right') {
    positionStyle.left = 22
    positionStyle.top = -4
  } else if (side === 'left') {
    positionStyle.right = 22
    positionStyle.top = -4
  } else {
    positionStyle.bottom = 22
    positionStyle.left = '50%'
    positionStyle.transform = 'translateX(-50%)'
  }

  return (
    <span className="relative inline-flex ml-1 align-middle" style={{ verticalAlign: 'middle' }}>
      <HelpCircle
        className="h-3.5 w-3.5 cursor-pointer transition-colors"
        style={{ color: 'var(--text-subtle)' }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      />
      {open && <span style={positionStyle}>{text}</span>}
    </span>
  )
}
