'use client'

import { motion } from 'framer-motion'

interface MenuToggleIconProps {
  open: boolean
  size?: number
  color?: string
  strokeWidth?: number
}

export function MenuToggleIcon({
  open,
  size = 22,
  color = 'currentColor',
  strokeWidth = 1.75,
}: MenuToggleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top line → becomes top slash of X */}
      <motion.line
        x1="3"
        y1="7"
        x2="19"
        y2="7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        animate={open ? { x1: 4, y1: 4, x2: 18, y2: 18 } : { x1: 3, y1: 7, x2: 19, y2: 7 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      />
      {/* Middle line → fades out */}
      <motion.line
        x1="3"
        y1="11"
        x2="19"
        y2="11"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        style={{ originX: '50%' }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      />
      {/* Bottom line → becomes bottom slash of X */}
      <motion.line
        x1="3"
        y1="15"
        x2="19"
        y2="15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        animate={open ? { x1: 4, y1: 18, x2: 18, y2: 4 } : { x1: 3, y1: 15, x2: 19, y2: 15 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      />
    </svg>
  )
}
