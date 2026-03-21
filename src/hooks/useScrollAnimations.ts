'use client'
import { useEffect } from 'react'

/**
 * Anime les éléments [data-gsap] et les sections au scroll via GSAP ScrollTrigger.
 * Doit être appelé après que le DOM est rendu (donc après introComplete).
 */
export function useScrollAnimations(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    let ctx: import('gsap').Context | null = null

    async function init() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])

      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        // ── Éléments [data-gsap="fade-up"] — entrée fade + translateY ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="fade-up"]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 48 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          )
        })

        // ── Éléments [data-gsap="fade-in"] — fade simple ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="fade-in"]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0 },
            {
              opacity: 1,
              duration: 0.9,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          )
        })

        // ── Éléments [data-gsap="stagger"] — groupe d'enfants en cascade ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="stagger"]').forEach((container) => {
          const children = Array.from(container.children) as HTMLElement[]
          gsap.fromTo(
            children,
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: {
                trigger: container,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          )
        })

        // ── Éléments [data-gsap="slide-left"] ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="slide-left"]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, x: -60 },
            {
              opacity: 1,
              x: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 87%',
                toggleActions: 'play none none none',
              },
            }
          )
        })

        // ── Éléments [data-gsap="slide-right"] ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="slide-right"]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, x: 60 },
            {
              opacity: 1,
              x: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 87%',
                toggleActions: 'play none none none',
              },
            }
          )
        })

        // ── Section headers [data-gsap="section-title"] — ligne + titre ──
        gsap.utils.toArray<HTMLElement>('[data-gsap="section-title"]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 32, clipPath: 'inset(0 0 100% 0)' },
            {
              opacity: 1,
              y: 0,
              clipPath: 'inset(0 0 0% 0)',
              duration: 0.85,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 88%',
                toggleActions: 'play none none none',
              },
            }
          )
        })
      })
    }

    init()

    return () => {
      ctx?.revert()
    }
  }, [enabled])
}
