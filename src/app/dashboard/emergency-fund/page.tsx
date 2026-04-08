'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
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
const COLOR = '#fbbf24'

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
  const statusColor = res.isReached ? '#4ade80' : coveragePct >= 50 ? COLOR : '#f87171'
  const StatusIcon = res.isReached ? CheckCircle2 : coveragePct >= 50 ? Clock : AlertTriangle

  // Radar risque liquidité
  const radarData = [
    { subject: 'Liquidité', value: res.isReached ? 90 : coveragePct * 0.9, fullMark: 100 },
    { subject: 'Sécurité', value: res.isReached ? 85 : coveragePct * 0.8, fullMark: 100 },
    { subject: 'Rendement', value: 40, fullMark: 100 },
    { subject: 'Disponibilité', value: 95, fullMark: 100 },
    { subject: 'Risque', value: 10, fullMark: 100 },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quelles sont vos charges mensuelles fixes ?', hint: 'Loyer, crédits, abonnements obligatoires, courses… Tout ce qui sort chaque mois quoi qu\'il arrive.', ref: 'Moyenne France : ~1 800-2 000 €/mois de charges fixes.', suffix: '€/mois', value: monthlyExpenses, onChange: setMonthlyExpenses },
    { type: 'choice', question: 'Quelle est votre situation professionnelle ?', hint: 'Votre stabilité d\'emploi détermine combien de mois de précaution il vous faut.', ref: 'CDI/Fonctionnaire : 3 mois. CDD : 4-6 mois. Freelance : 6-9 mois. Sans emploi : 9-12 mois.', strValue: employmentType, onChoice: v => setEmploymentType(v as typeof employmentType), options: [{ value: 'cdi', label: 'CDI / Fonctionnaire', sub: '3 mois recommandés' }, { value: 'cdd', label: 'CDD / Intérim', sub: '4-6 mois recommandés' }, { value: 'freelance', label: 'Freelance / Indépendant', sub: '6-9 mois recommandés' }, { value: 'none', label: 'Sans emploi', sub: '9-12 mois recommandés' }] },
    { question: 'Avez-vous déjà une épargne liquide ?', hint: 'Total de vos livrets (Livret A, LEP, LDDS)… uniquement les liquidités disponibles immédiatement.', ref: 'L\'idéal : tout sur Livret A (12 500 € max) + LEP si éligible.', suffix: '€', value: currentSavings, onChange: setCurrentSavings },
    { question: 'Combien pouvez-vous épargner chaque mois ?', hint: 'Votre capacité d\'épargne mensuelle dédiée à la précaution.', ref: 'Même 50 €/mois, c\'est 600 €/an. La régularité prime sur le montant.', suffix: '€/mois', value: monthlySavings, onChange: setMonthlySavings },
  ]

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Épargne de Précaution</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Épargne de Précaution</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Coussin de sécurité · 3 à 6 mois de dépenses</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
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
      </div>

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginTop: 16 }}>
          <GuidedModePanel
            steps={guidedSteps}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {/* 3-column grid */}
      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck style={{ width: 12, height: 12, color: COLOR }} />
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Paramètres</p>
                </div>
                <ProfileFillButton onFill={p => {
                  if (p.monthlyExpenses) setMonthlyExpenses(p.monthlyExpenses)
                  if (p.monthlySavings) setMonthlySavings(p.monthlySavings)
                }} />
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Charges mensuelles fixes (€)</label>
                  <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} min={0} step={100} style={{ height: 36, fontSize: 13 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Loyer, crédits, abonnements…</span>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Situation professionnelle</label>
                  <Select value={employmentType} onValueChange={v => setEmploymentType(v as EmergencyFundInputs['employmentType'])}>
                    <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cdi">CDI / Fonctionnaire</SelectItem>
                      <SelectItem value="cdd">CDD / Intérim</SelectItem>
                      <SelectItem value="freelance">Freelance / Indépendant</SelectItem>
                      <SelectItem value="none">Sans emploi / En recherche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Situation familiale</label>
                  <Select value={familySituation} onValueChange={v => setFamilySituation(v as EmergencyFundInputs['familySituation'])}>
                    <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Célibataire</SelectItem>
                      <SelectItem value="couple">En couple (2 revenus)</SelectItem>
                      <SelectItem value="family">Famille avec enfant(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Épargne liquide actuelle (€)</label>
                  <Input type="number" value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} min={0} step={500} style={{ height: 36, fontSize: 13 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Livret A, compte courant, LEP…</span>
                </div>

                <div style={{ height: 1, background: 'var(--section-border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Capacité d&apos;épargne mensuelle (€)</label>
                  <Input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} min={0} step={50} style={{ height: 36, fontSize: 13 }} />
                </div>
              </div>
            </div>

            {/* Mini-résumé */}
            <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <StatusIcon style={{ width: 14, height: 14, color: statusColor }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>
                  {res.isReached ? 'Objectif atteint' : coveragePct >= 50 ? 'En bonne voie' : 'À constituer'}
                </span>
              </div>
              {[
                { label: 'Objectif', value: `${res.targetMonths} mois` },
                { label: 'Couverture actuelle', value: `${coveragePct}%` },
                { label: res.monthsToReach ? `Atteint dans` : 'Délai', value: res.monthsToReach ? `${res.monthsToReach} mois` : '—' },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 6 : 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{k.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { label: 'Objectif fonds urgence', value: fmt(res.targetAmount), color: COLOR },
                { label: 'Déjà couvert', value: fmt(currentSavings), color: statusColor },
                { label: 'Reste à épargner', value: fmt(res.isReached ? 0 : res.gap), color: res.isReached ? '#4ade80' : '#f87171' },
                { label: 'Mois pour y arriver', value: res.isReached ? 'Atteint !' : res.monthsToReach !== null ? `${res.monthsToReach} mois` : '—', color: res.isReached ? '#4ade80' : 'var(--text-primary)' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 4, letterSpacing: '0.04em' }}>{kpi.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Status banner */}
            <div style={{ background: statusColor + '12', border: `1px solid ${statusColor}30`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusIcon style={{ width: 20, height: 20, color: statusColor, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>
                  {res.isReached
                    ? 'Objectif atteint — votre épargne de précaution est constituée'
                    : `Il vous manque ${fmt(res.gap)} pour atteindre votre objectif`}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>{res.recommendation}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>Progression vers l&apos;objectif</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{coveragePct}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(coveragePct, 100)}%`, borderRadius: 99, background: `linear-gradient(90deg, ${statusColor}99, ${statusColor})`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted-c)' }}>
                <span>{fmt(currentSavings)} actuels</span>
                <span>Objectif {fmt(res.targetAmount)}</span>
              </div>
            </div>

            {/* BarChart progression par mois de couverture */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 12 }}>Objectif par palier de charges</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={res.chartData} barSize={28}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 10, fontSize: 12 }}
                    formatter={(v: number) => [fmt(v), '']}
                  />
                  <ReferenceLine y={currentSavings} stroke="#4ade80" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Actuel', position: 'right', fontSize: 10, fill: '#4ade80' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {res.chartData.map((entry: { value: number }, idx: number) => (
                      <Cell key={idx} fill={entry.value <= currentSavings ? '#4ade8066' : COLOR + '99'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Analyse adéquation */}
            <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ShieldCheck style={{ width: 15, height: 15, color: COLOR }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Analyse d&apos;adéquation</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 8 }}>
                {res.isReached
                  ? `Votre épargne de ${fmt(currentSavings)} couvre ${res.targetMonths} mois de charges. Vous êtes bien protégé(e) face aux imprévus.`
                  : `Avec ${fmt(currentSavings)}, vous couvrez ${(currentSavings / monthlyExpenses).toFixed(1)} mois sur les ${res.targetMonths} recommandés. Priorité : atteindre ${fmt(res.targetAmount)}.`}
              </p>
              {res.monthsToReach !== null && !res.isReached && (
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>À {fmt(monthlySavings)}/mois : objectif atteint en </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLOR }}>{res.monthsToReach} mois</span>
                </div>
              )}
            </div>

            {/* Radar risque liquidité */}
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', marginBottom: 8 }}>Profil liquidité épargne précaution</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <RadarChart cx={100} cy={80} outerRadius={60} width={200} height={160} data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-muted-c)' }} />
                  <Radar name="Profil" dataKey="value" stroke={COLOR} fill={COLOR} fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </div>
            </div>

            {/* Conseils placement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ShieldCheck style={{ width: 14, height: 14, color: GOLD, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Où placer votre fonds urgence ?</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.65 }}>
                      L&apos;épargne de précaution doit rester <strong style={{ color: 'var(--text-em)' }}>liquide et sécurisée</strong> : Livret A (3%), LDDS ou LEP si éligible.
                      Ne jamais immobiliser ces fonds en placements long terme (PEA, assurance-vie…).
                    </p>
                  </div>
                </div>
              </div>
              {[
                { title: 'Livret A', desc: 'Plafond 22 950€ · 3% net · Disponible immédiatement', color: '#4ade80' },
                { title: 'LDDS', desc: 'Plafond 12 000€ · 3% net · Complément au Livret A', color: '#60a5fa' },
                { title: 'LEP (si éligible)', desc: 'Plafond 10 000€ · 4% net · Meilleur taux sans risque', color: COLOR },
              ].map((item, i) => (
                <div key={i} style={{ background: `${item.color}07`, border: `1px solid ${item.color}20`, borderRadius: 10, padding: '8px 12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLOR, marginBottom: 4 }}>Une fois l&apos;objectif atteint</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5, marginBottom: 6 }}>Chaque euro supplémentaire peut être investi via le DCA ou les intérêts composés.</p>
              <a href="/dashboard/dca" style={{ fontSize: 11, color: COLOR, textDecoration: 'none', fontWeight: 600 }}>→ Simulateur DCA</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
