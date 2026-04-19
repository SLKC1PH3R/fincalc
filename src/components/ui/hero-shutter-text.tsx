'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HeroShutterTextProps {
  text?: string
  onComplete?: () => void
}

export function HeroShutterText({ text = 'PatrImo', onComplete }: HeroShutterTextProps) {
  const [show, setShow] = useState(true)
  const letters = text.split('')

  useEffect(() => {
    // Letters animate in over ~1.2s, hold for 0.8s, then fade out
    const t = setTimeout(() => setShow(false), 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          key="shutter-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#05080f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            userSelect: 'none',
          }}
        >
          {/* Grid background */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(75,120,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(75,120,255,0.05) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
            }}
          />

          {/* Corner accents */}
          {[
            { top: 24, left: 24, borderTop: '1px solid rgba(75,120,255,0.35)', borderLeft: '1px solid rgba(75,120,255,0.35)' },
            { top: 24, right: 24, borderTop: '1px solid rgba(75,120,255,0.35)', borderRight: '1px solid rgba(75,120,255,0.35)' },
            { bottom: 24, left: 24, borderBottom: '1px solid rgba(75,120,255,0.35)', borderLeft: '1px solid rgba(75,120,255,0.35)' },
            { bottom: 24, right: 24, borderBottom: '1px solid rgba(75,120,255,0.35)', borderRight: '1px solid rgba(75,120,255,0.35)' },
          ].map((style, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
              style={{
                position: 'absolute',
                width: 20,
                height: 20,
                ...style,
              }}
            />
          ))}

          {/* Center glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: 500,
              height: 300,
              background:
                'radial-gradient(ellipse, rgba(75,120,255,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* Letter container */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.04em',
            }}
          >
            {letters.map((letter, i) => (
              <div
                key={i}
                style={{
                  overflow: 'hidden',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.65,
                    delay: 0.1 + i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    display: 'inline-block',
                    fontSize: 'clamp(4rem, 12vw, 9rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    background:
                      'linear-gradient(135deg, #ffffff 0%, #7b9fff 55%, #c4b5fd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {letter}
                </motion.span>
              </div>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(148, 163, 184, 0.7)',
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            Finance personnelle · France
          </motion.p>

          {/* Animated loading bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.2, delay: 0.15, ease: 'linear' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, #4b78ff, #8b5cf6)',
              transformOrigin: 'left center',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
