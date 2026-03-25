'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import {
  PROFILE_LABELS, PROFILE_ICONS, PROFILE_RECOMMENDATIONS,
  type UserProfile, type FinancialProfile,
} from '@/lib/profile-types'
import { Check, X, ArrowRight, ChevronRight } from 'lucide-react'

const PROFILES: UserProfile[] = ['beginner', 'owner', 'active', 'fire']
const GOLD = '#f1c086'

interface OnboardingWizardProps {
  onClose: () => void
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [financialData, setFinancialData] = useState<FinancialProfile>({})
  const [saving, setSaving] = useState(false)

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const saveAndClose = async (goTo?: string) => {
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboardingDone: true,
          financialProfile: { ...financialData, userProfile: profile ?? undefined },
        }),
      })
      window.dispatchEvent(new CustomEvent('profile-updated'))
    } catch {}
    setSaving(false)
    onClose()
    if (goTo) router.push(goTo)
  }

  const recommendations = profile ? PROFILE_RECOMMENDATIONS[profile] : []

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) saveAndClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: '#0d1017',
        border: '1px solid rgba(241,192,134,0.20)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(241,192,134,0.08)',
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{
            height: '100%',
            width: `${(step / 3) * 100}%`,
            background: `linear-gradient(90deg, ${GOLD}80, ${GOLD})`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: n <= step ? 24 : 8, height: 8, borderRadius: 99,
                background: n < step ? GOLD : n === step ? `${GOLD}90` : 'rgba(255,255,255,0.10)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
          <button
            onClick={() => saveAndClose()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 8, display: 'flex' }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Step content */}
        <div style={{ padding: '24px 24px 28px' }}>

          {/* ── Step 1: Profile choice ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 11, color: GOLD, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Étape 1 sur 3</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Quel est ton profil ?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 24 }}>
                On personnalisera les simulateurs recommandés pour toi.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {PROFILES.map(p => {
                  const selected = profile === p
                  return (
                    <button
                      key={p}
                      onClick={() => setProfile(p)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        gap: 6, padding: '14px 16px', borderRadius: 14, position: 'relative',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        background: selected ? 'rgba(241,192,134,0.10)' : 'rgba(255,255,255,0.03)',
                        border: selected ? `1px solid ${GOLD}55` : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{PROFILE_ICONS[p]}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: selected ? GOLD : 'var(--text-primary)' }}>
                        {PROFILE_LABELS[p]}
                      </span>
                      {selected && (
                        <div style={{ position: 'absolute', top: 10, right: 10 }}>
                          <Check style={{ width: 12, height: 12, color: GOLD }} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <Button
                onClick={() => { if (profile) setStep(2) }}
                disabled={!profile}
                variant="gold"
                style={{ width: '100%', gap: 8, height: 42 }}
              >
                Continuer <ArrowRight style={{ width: 15, height: 15 }} />
              </Button>
            </div>
          )}

          {/* ── Step 2: Basic financial info ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 11, color: GOLD, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Étape 2 sur 3</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Quelques infos de base
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 24 }}>
                Optionnel — pré-remplit vos simulateurs. Modifiable à tout moment dans votre profil.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {([
                  { key: 'age',              label: 'Âge',                 placeholder: 'ex: 32',      suffix: 'ans' },
                  { key: 'netMonthlySalary', label: 'Salaire net / mois',  placeholder: 'ex: 3 500',   suffix: '€' },
                  { key: 'monthlySavings',   label: 'Épargne / mois',      placeholder: 'ex: 500',     suffix: '€' },
                  { key: 'currentAssets',    label: 'Patrimoine actuel',   placeholder: 'ex: 20 000',  suffix: '€' },
                ] as { key: keyof FinancialProfile; label: string; placeholder: string; suffix: string }[]).map(({ key, label, placeholder, suffix }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted-c)', fontWeight: 500 }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type="number"
                        placeholder={placeholder}
                        value={financialData[key] !== undefined ? String(financialData[key]) : ''}
                        onChange={e => setFinancialData(prev => ({
                          ...prev,
                          [key]: e.target.value ? Number(e.target.value) : undefined,
                        }))}
                        style={{ paddingRight: 36, fontSize: 13 }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted-c)', pointerEvents: 'none' }}>
                        {suffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => setStep(3)} style={{ flex: 1, height: 42, fontSize: 13 }}>
                  Passer cette étape
                </Button>
                <Button variant="gold" onClick={() => setStep(3)} style={{ flex: 2, gap: 8, height: 42 }}>
                  Continuer <ArrowRight style={{ width: 15, height: 15 }} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Recommendations ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 11, color: GOLD, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>Étape 3 sur 3</p>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
                Vos simulateurs recommandés
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 20 }}>
                Basé sur votre profil <strong style={{ color: GOLD }}>{profile ? `${PROFILE_ICONS[profile]} ${PROFILE_LABELS[profile]}` : ''}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {recommendations.map((rec, i) => (
                  <button
                    key={rec.href}
                    onClick={() => saveAndClose(rec.href)}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      width: '100%',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: i === 0 ? 'rgba(241,192,134,0.12)' : 'rgba(129,140,248,0.10)',
                      border: `1px solid ${i === 0 ? 'rgba(241,192,134,0.25)' : 'rgba(129,140,248,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: i === 0 ? GOLD : '#818cf8',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{rec.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>{rec.desc}</p>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-subtle)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => saveAndClose()} disabled={saving} style={{ flex: 1, height: 42, fontSize: 13 }}>
                  Accéder au tableau de bord
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
