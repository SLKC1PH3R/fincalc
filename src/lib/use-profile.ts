'use client'
import { useState, useEffect, useCallback } from 'react'
import type { FinancialProfile } from './profile-types'

export interface ProfileState {
  profile: FinancialProfile | null
  onboardingDone: boolean
  loading: boolean
  save: (patch: Partial<FinancialProfile>, markOnboardingDone?: boolean) => Promise<void>
}

export function useUserProfile(): ProfileState {
  const [profile, setProfile] = useState<FinancialProfile | null>(null)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setProfile((data.financialProfile as FinancialProfile) ?? null)
          setOnboardingDone(data.onboardingDone ?? false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (patch: Partial<FinancialProfile>, markOnboardingDone?: boolean) => {
    const merged = { ...(profile ?? {}), ...patch }
    const body: Record<string, unknown> = { financialProfile: merged }
    if (markOnboardingDone) body.onboardingDone = true

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data.financialProfile ?? null)
      if (markOnboardingDone) setOnboardingDone(true)
      window.dispatchEvent(new CustomEvent('profile-updated'))
    }
  }, [profile])

  return { profile, onboardingDone, loading, save }
}
