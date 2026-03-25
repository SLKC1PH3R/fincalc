export type UserProfile = 'beginner' | 'owner' | 'active' | 'fire'
export type HousingStatus = 'tenant' | 'owner'

export interface FinancialProfile {
  age?: number
  netMonthlySalary?: number
  monthlySavings?: number
  currentAssets?: number
  monthlyExpenses?: number
  housingStatus?: HousingStatus
  userProfile?: UserProfile
}

export const PROFILE_LABELS: Record<UserProfile, string> = {
  beginner: 'Epargnant débutant',
  owner:    'Propriétaire',
  active:   'Investisseur actif',
  fire:     'Futur retraité FIRE',
}

export const PROFILE_ICONS: Record<UserProfile, string> = {
  beginner: '🌱',
  owner:    '🏠',
  active:   '📈',
  fire:     '🔥',
}

// Simulators recommended per profile type
export const PROFILE_RECOMMENDATIONS: Record<UserProfile, Array<{ href: string; label: string; desc: string }>> = {
  beginner: [
    { href: '/dashboard/compound',      label: 'Intérêts composés',  desc: 'Découvrez la puissance de l\'épargne régulière' },
    { href: '/dashboard/savings-rate',  label: 'Taux d\'épargne',    desc: 'Calculez combien vous pouvez épargner' },
    { href: '/dashboard/emergency-fund',label: 'Épargne de précaution', desc: 'Constituez votre matelas de sécurité' },
  ],
  owner: [
    { href: '/dashboard/mortgage',  label: 'Prêt immobilier',      desc: 'Optimisez votre financement' },
    { href: '/dashboard/rental',    label: 'Rentabilité locative', desc: 'Évaluez votre investissement locatif' },
    { href: '/dashboard/buyrent',   label: 'Acheter vs Louer',     desc: 'Comparez les deux options' },
  ],
  active: [
    { href: '/dashboard/dca',              label: 'DCA',              desc: 'Investissement régulier vs achat unique' },
    { href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV', desc: 'Choisissez la meilleure enveloppe' },
    { href: '/dashboard/flat-tax',         label: 'Flat Tax vs Barème', desc: 'Optimisez votre fiscalité' },
  ],
  fire: [
    { href: '/dashboard/fire',       label: 'FI/RE',            desc: 'Calculez votre date d\'indépendance' },
    { href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Simulez votre portefeuille FIRE' },
    { href: '/dashboard/retirement', label: 'Retraite',          desc: 'Estimez votre pension de base' },
  ],
}
