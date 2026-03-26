'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from its previous value to `target` with cubic ease-out.
 * @param target   The final value to reach.
 * @param duration Animation duration in ms (default 1200).
 * @param trigger  Set to false to skip animation and show target immediately.
 */
export function useCountUp(target: number, duration = 1200, trigger = true): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!trigger) { setValue(target); return }
    const from = fromRef.current
    fromRef.current = target
    if (from === target) return

    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (target - from) * eased)
      setValue(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setValue(target)
        fromRef.current = target
      }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, trigger])

  return value
}
