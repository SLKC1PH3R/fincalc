'use client'
import { useEffect } from 'react'

/**
 * Initialise Lenis smooth scroll + branche GSAP ScrollTrigger dessus.
 * À appeler une seule fois dans le composant racine de la page.
 */
export function useSmoothScroll() {
  useEffect(() => {
    let lenis: import('lenis').default | null = null
    let rafId: number | null = null

    async function init() {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      lenis = new Lenis({
        duration: 1.3,          // inertie (secondes)
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
        orientation: 'vertical',
        smoothWheel: true,
        touchMultiplier: 1.8,
      })

      // Branche Lenis sur GSAP ticker pour que ScrollTrigger suive le scroll doux
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((time: number) => {
        lenis!.raf(time * 1000)
      })
      gsap.ticker.lagSmoothing(0)
    }

    init()

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      if (lenis) lenis.destroy()
    }
  }, [])
}
