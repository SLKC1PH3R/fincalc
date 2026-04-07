'use client'
import { useState, useEffect } from 'react'
import { useUserProfile } from '@/lib/use-profile'
import { PROFILE_LABELS, PROFILE_ICONS, type UserProfile, type HousingStatus } from '@/lib/profile-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Check, User, Save, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const PROFILES: UserProfile[] = ['beginner', 'owner', 'active', 'fire']

const FIELD_HINTS: Record<string, string> = {
  netMonthlySalary: 'Utilisé dans les simulateurs Impôts IR, Budget 50/30/20, Taux d\'épargne',
  monthlySavings:   'Utilisé dans DCA, Intérêts composés, FI/RE',
  currentAssets:    'Utilisé dans le Score patrimonial, FI/RE, Revenus passifs',
  monthlyExpenses:  'Utilisé dans FI/RE, Budget, Épargne de précaution',
  age:              'Utilisé dans FI/RE, Retraite, Intérêts composés',
}

export default function ProfilPage() {
  const { profile, loading, save } = useUserProfile()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [age, setAge]                       = useState('')
  const [salary, setSalary]                 = useState('')
  const [savings, setSavings]               = useState('')
  const [assets, setAssets]                 = useState('')
  const [expenses, setExpenses]             = useState('')
  const [housingStatus, setHousingStatus]   = useState<HousingStatus | ''>('')
  const [userProfile, setUserProfile]       = useState<UserProfile | ''>('')

  // Populate fields from loaded profile
  useEffect(() => {
    if (!profile) return
    if (profile.age)               setAge(String(profile.age))
    if (profile.netMonthlySalary)  setSalary(String(profile.netMonthlySalary))
    if (profile.monthlySavings)    setSavings(String(profile.monthlySavings))
    if (profile.currentAssets)     setAssets(String(profile.currentAssets))
    if (profile.monthlyExpenses)   setExpenses(String(profile.monthlyExpenses))
    if (profile.housingStatus)     setHousingStatus(profile.housingStatus)
    if (profile.userProfile)       setUserProfile(profile.userProfile)
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await save({
        age:               age ? Number(age) : undefined,
        netMonthlySalary:  salary ? Number(salary) : undefined,
        monthlySavings:    savings ? Number(savings) : undefined,
        currentAssets:     assets ? Number(assets) : undefined,
        monthlyExpenses:   expenses ? Number(expenses) : undefined,
        housingStatus:     housingStatus || undefined,
        userProfile:       userProfile || undefined,
      })
      toast({ variant: 'success', title: 'Profil sauvegardé', description: 'Vos données seront pré-remplies dans les simulateurs.' })
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' })
    } finally {
      setSaving(false)
    }
  }

  const isProfileFilled = !!(age || salary || savings || assets || expenses)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User style={{ width: 15, height: 15, color: '#f1c086' }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mon compte</p>
        </div>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Mon profil financier
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
          Renseignez vos données une seule fois. Les simulateurs les pré-rempliront automatiquement.
          Vous pourrez toujours modifier localement sans écraser ce profil.
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted-c)', fontSize: 13 }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Profile type */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Votre profil investisseur</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {PROFILES.map(p => {
                const selected = userProfile === p
                return (
                  <button
                    key={p}
                    onClick={() => setUserProfile(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                      background: selected ? 'rgba(241,192,134,0.10)' : 'rgba(255,255,255,0.02)',
                      border: selected ? '1px solid rgba(241,192,134,0.40)' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{PROFILE_ICONS[p]}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: selected ? '#f1c086' : 'var(--text-primary)', margin: 0 }}>{PROFILE_LABELS[p]}</p>
                    </div>
                    {selected && <Check style={{ width: 14, height: 14, color: '#f1c086', marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Financial data */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Données financières</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {([
                { key: 'age',              label: 'Âge',                        value: age,      set: setAge,      suffix: 'ans',   type: 'number', min: 18, max: 80 },
                { key: 'netMonthlySalary', label: 'Salaire net / mois',          value: salary,   set: setSalary,   suffix: '€',     type: 'number', min: 0 },
                { key: 'monthlySavings',   label: 'Épargne / mois',              value: savings,  set: setSavings,  suffix: '€',     type: 'number', min: 0 },
                { key: 'currentAssets',    label: 'Patrimoine actuel',           value: assets,   set: setAssets,   suffix: '€',     type: 'number', min: 0 },
                { key: 'monthlyExpenses',  label: 'Dépenses mensuelles',         value: expenses, set: setExpenses, suffix: '€',     type: 'number', min: 0 },
              ] as { key: string; label: string; value: string; set: (v: string) => void; suffix: string; type: string; min?: number; max?: number }[]).map(({ key, label, value, set, suffix }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 12 }}>{label}</Label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type="number"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder="—"
                      style={{ paddingRight: 36 }}
                    />
                    <span style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 11, color: 'var(--text-muted-c)', pointerEvents: 'none',
                    }}>{suffix}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', lineHeight: 1.4 }}>{FIELD_HINTS[key]}</p>
                </div>
              ))}
            </div>

            {/* Housing status */}
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10 }}>Statut logement</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['tenant', 'owner'] as HousingStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setHousingStatus(s)}
                    style={{
                      padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      transition: 'all 0.15s',
                      background: housingStatus === s ? 'rgba(241,192,134,0.10)' : 'rgba(255,255,255,0.02)',
                      border: housingStatus === s ? '1px solid rgba(241,192,134,0.40)' : '1px solid rgba(255,255,255,0.07)',
                      color: housingStatus === s ? '#f1c086' : 'var(--text-muted-c)',
                    }}
                  >
                    {s === 'tenant' ? '🏢 Locataire' : '🏠 Propriétaire'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Completion status */}
          {isProfileFilled && (
            <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.20)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Check style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'rgba(52,211,153,0.9)', margin: 0 }}>
                Profil complet — vos données seront automatiquement pré-remplies dans les simulateurs
              </p>
            </div>
          )}

          {/* Theme preference */}
          <div style={{ padding: '16px 20px', background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Apparence</p>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { val: 'dark' as const,  label: 'Sombre', Icon: Moon  },
                { val: 'light' as const, label: 'Clair',  Icon: Sun   },
              ]).map(({ val, label, Icon }) => (
                <button
                  key={val}
                  onClick={() => setTheme(val)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${theme === val ? 'rgba(241,192,134,0.45)' : 'var(--card-dark-border)'}`,
                    background: theme === val ? 'rgba(241,192,134,0.10)' : 'transparent',
                    color: theme === val ? '#f1c086' : 'var(--text-muted-c)',
                    fontWeight: theme === val ? 700 : 400,
                    fontSize: 13, transition: 'all 0.15s',
                  }}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {label}
                  {theme === val && <Check style={{ width: 12, height: 12, marginLeft: 2 }} />}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 8 }}>
              Cette préférence est sauvegardée sur votre compte et s&apos;applique sur tous vos appareils.
            </p>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} disabled={saving} variant="gold" style={{ gap: 8 }}>
              <Save style={{ width: 14, height: 14 }} />
              {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
