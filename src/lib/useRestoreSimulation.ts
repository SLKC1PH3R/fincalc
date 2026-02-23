import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Reads ?restore=<JSON> from the URL and calls setInputs with the parsed value.
 * Works for any calculator page.
 */
export function useRestoreSimulation<T>(setInputs: (v: T) => void) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const raw = searchParams.get('restore')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as T
      setInputs(parsed)
    } catch {
      // invalid JSON — ignore
    }
  }, []) // run once on mount only
}
