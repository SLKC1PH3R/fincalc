'use client'
import { useState } from 'react'
import { useUserProfile } from '@/lib/use-profile'
import type { FinancialProfile } from '@/lib/profile-types'
import { UserCircle, Check } from 'lucide-react'

const GOLD = '#f1c086'

interface Props {
  onFill: (profile: FinancialProfile) => void
}

export function ProfileFillButton({ onFill }: Props) {
  const { profile, loading } = useUserProfile()
  const [filled, setFilled] = useState(false)

  if (loading || !profile) return null

  const hasData = !!(
    profile.age ||
    profile.netMonthlySalary ||
    profile.monthlySavings ||
    profile.currentAssets ||
    profile.monthlyExpenses
  )
  if (!hasData) return null

  const handleClick = () => {
    onFill(profile)
    setFilled(true)
    setTimeout(() => setFilled(false), 2000)
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      title="Pré-remplir les champs depuis votre profil financier"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        border: `1px solid ${filled ? 'rgba(52,211,153,0.35)' : `${GOLD}35`}`,
        background: filled ? 'rgba(52,211,153,0.08)' : `${GOLD}0d`,
        color: filled ? '#34d399' : GOLD,
        transition: 'all 0.2s',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {filled ? (
        <>
          <Check style={{ width: 11, height: 11 }} />
          Données importées
        </>
      ) : (
        <>
          <UserCircle style={{ width: 11, height: 11 }} />
          Remplir depuis mon profil
        </>
      )}
    </button>
  )
}
