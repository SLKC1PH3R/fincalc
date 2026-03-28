'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calcEmergencyFund, type EmergencyFundInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, BookOpen, Settings2 } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { useChartTheme } from '@/lib/chart-theme'
import { SaveSimulation } from '@/components/SaveSimulation'

const GOLD = '#f1c086'

export default function EmergencyFundPage() {
  const chartTheme = useChartTheme()

  const [monthlyExpenses, setMonthlyExpenses] = useState(2500)
  const [employmentType, setEmploymentType] = useState<EmergencyFundInputs['employmentType']>('cdi')
  const [familySituation, setFamilySituation] = useState<EmergencyFundInputs['familySituation']>('single')
  const [currentSavings, setCurrentSavings] = useState(5000)
  const [monthlySavings, setMonthlySavings] = useState(300)
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  const inputs: EmergencyFundInputs = useMemo(() => ({
    monthlyExpenses, employmentType, familySituation, currentSavings, monthlySavings,
  }), [monthlyExpenses, employmentType, familySituation, currentSavings, monthlySavings])

  const res = useMemo(() => calcEmergencyFund(inputs), [inputs])

  const coveragePct = Math.round(res.coverageRatio * 100)
  const statusColor = res.isReached ? '#4ade80' : coveragePct >= 50 ? GOLD : '#f87171'
  const StatusIcon = res.isReached ? CheckCircle2 : coveragePct >= 50 ? Clock : AlertTriangle

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Gestion budgétaire</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Épargne de précaution
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
            Calculez le montant idéal à garder en liquidités selon vos charges, votre stabilité professionnelle et votre situation familiale.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Mode expert' : 'Mode guidé'}
          </Button>
          <SaveSimulation
            type="emergency-fund"
            name={`Précaution — ${fmt(res.targetAmount)} (${res.targetMonths} mois)`}
            inputs={{ monthlyExpenses, employmentType, familySituation, currentSavings, monthlySavings } as unknown as Record<string, unknown>}
            results={{ targetAmount: res.targetAmount, gap: res.gap, isReached: res.isReached, coverageRatio: res.coverageRatio, monthsToReach: res.monthsToReach, targetMonths: res.targetMonths } as unknown as Record<string, unknown>}
          />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 16 }}>
      {guidedMode && (
        <GuidedModePanel
          steps={[
            { question: 'Quelles sont vos charges mensuelles fixes ?', hint: 'Loyer ou crédit immobilier, crédits à la consommation, abonnements obligatoires, courses alimentaires… Tout ce qui sort chaque mois quoi qu\'il arrive.', ref: 'Moyenne France : ~1 800-2 000 €/mois de charges fixes. C\'est sur cette base que se calcule le nombre de mois de précaution.', suffix: '€/mois', value: monthlyExpenses, onChange: setMonthlyExpenses },
            { type: 'choice', question: 'Quelle est votre situation professionnelle ?', hint: 'Votre stabilité d\'emploi détermine combien de mois de précaution il vous faut. Un indépendant a besoin de bien plus qu\'un fonctionnaire.', ref: 'CDI/Fonctionnaire : 3 mois suffisent. CDD/Intérim : 4-6 mois. Freelance : 6-9 mois. Sans emploi : 9-12 mois.', strValue: employmentType, onChoice: v => setEmploymentType(v as typeof employmentType), options: [{ value: 'cdi', label: 'CDI / Fonctionnaire', sub: '3 mois recommandés' }, { value: 'cdd', label: 'CDD / Intérim', sub: '4-6 mois recommandés' }, { value: 'freelance', label: 'Freelance / Indépendant', sub: '6-9 mois recommandés' }, { value: 'none', label: 'Sans emploi', sub: '9-12 mois recommandés' }] },
            { question: 'Avez-vous déjà une épargne liquide ?', hint: 'Total de vos comptes courant, livrets (Livret A, LEP, LDDS)… uniquement les liquidités disponibles immédiatement, pas votre PEA ou assurance-vie.', ref: 'L\'idéal : tout sur Livret A (12 500 € max) + LEP (si éligible) pour maximiser les intérêts tout en restant disponible.', suffix: '€', value: currentSavings, onChange: setCurrentSavings },
            { question: 'Combien pouvez-vous épargner chaque mois ?', hint: 'Votre capacité d\'épargne mensuelle dédiée à la précaution. Une fois l\'objectif atteint, vous redirigez ce montant vers vos investissements.', ref: 'Même 50 €/mois, c\'est 600 €/an. La régularité prime sur le montant. Augmentez progressivement.', suffix: '€/mois', value: monthlySavings, onChange: setMonthlySavings },
          ] satisfies GuidedStep[]}
          currentStep={guidedStep}
          onStepChange={setGuidedStep}
          onFinish={() => setGuidedMode(false)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
            <ProfileFillButton onFill={p => {
              if (p.monthlyExpenses) setMonthlyExpenses(p.monthlyExpenses)
              if (p.monthlySavings)  setMonthlySavings(p.monthlySavings)
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Charges mensuelles fixes (€)</Label>
            <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} min={0} step={100} />
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Loyer, crédits, abonnements, courses…</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Situation professionnelle</Label>
            <Select value={employmentType} onValueChange={v => setEmploymentType(v as EmergencyFundInputs['employmentType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI / Fonctionnaire</SelectItem>
                <SelectItem value="cdd">CDD / Intérim</SelectItem>
                <SelectItem value="freelance">Freelance / Indépendant</SelectItem>
                <SelectItem value="none">Sans emploi / En recherche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Situation familiale</Label>
            <Select value={familySituation} onValueChange={v => setFamilySituation(v as EmergencyFundInputs['familySituation'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Célibataire</SelectItem>
                <SelectItem value="couple">En couple (2 revenus)</SelectItem>
                <SelectItem value="family">Famille avec enfant(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Épargne liquide actuelle (€)</Label>
            <Input type="number" value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} min={0} step={500} />
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Livret A, compte courant, LEP…</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Capacité d'épargne mensuelle (€)</Label>
            <Input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} min={0} step={50} />
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status banner */}
          <div style={{ background: statusColor + '12', border: `1px solid ${statusColor}30`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusIcon style={{ width: 20, height: 20, color: statusColor, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                {res.isReached
                  ? 'Objectif atteint — votre épargne de précaution est constituée'
                  : `Il vous manque ${fmt(res.gap)} pour atteindre votre objectif`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>{res.recommendation}</p>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Objectif recommandé', value: fmt(res.targetAmount), sub: `${res.targetMonths} mois de charges`, color: GOLD },
              { label: 'Épargne actuelle', value: fmt(currentSavings), sub: `${coveragePct}% de l'objectif`, color: statusColor },
              { label: res.isReached ? 'Excédent' : 'À constituer', value: fmt(res.isReached ? currentSavings - res.targetAmount : res.gap), sub: res.monthsToReach !== null && !res.isReached ? `~${res.monthsToReach} mois à ${fmt(monthlySavings)}/mois` : res.isReached ? 'Parfait !' : 'Augmentez votre épargne', color: res.isReached ? '#4ade80' : '#f87171' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Progression vers l'objectif</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{coveragePct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${coveragePct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${statusColor}99, ${statusColor})`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted-c)' }}>
              <span>{fmt(currentSavings)} actuels</span>
              <span>Objectif {fmt(res.targetAmount)}</span>
            </div>
          </div>

          {/* Chart — objectif par mois */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 16 }}>Objectif par palier de charges</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={res.chartData} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => [fmt(v), '']}
                />
                <ReferenceLine y={currentSavings} stroke="#4ade80" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Actuel', position: 'right', fontSize: 10, fill: '#4ade80' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {res.chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.value <= currentSavings ? '#4ade8066' : GOLD + '99'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info card */}
          <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <ShieldCheck style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 4 }}>À savoir</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65 }}>
                  L'épargne de précaution doit rester <strong style={{ color: 'var(--text-em)' }}>liquide et sécurisée</strong> : Livret A (3%), LDDS ou LEP si éligible.
                  Ne jamais immobiliser ces fonds en placements long terme (PEA, assurance-vie…).
                  Une fois l'objectif atteint, chaque euro supplémentaire peut être investi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
