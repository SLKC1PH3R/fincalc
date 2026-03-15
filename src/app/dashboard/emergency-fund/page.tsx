'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calcEmergencyFund, type EmergencyFundInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

const GOLD = '#f1c086'

export default function EmergencyFundPage() {
  const chartTheme = useChartTheme()

  const [monthlyExpenses, setMonthlyExpenses] = useState(2500)
  const [employmentType, setEmploymentType] = useState<EmergencyFundInputs['employmentType']>('cdi')
  const [familySituation, setFamilySituation] = useState<EmergencyFundInputs['familySituation']>('single')
  const [currentSavings, setCurrentSavings] = useState(5000)
  const [monthlySavings, setMonthlySavings] = useState(300)

  const inputs: EmergencyFundInputs = useMemo(() => ({
    monthlyExpenses, employmentType, familySituation, currentSavings, monthlySavings,
  }), [monthlyExpenses, employmentType, familySituation, currentSavings, monthlySavings])

  const res = useMemo(() => calcEmergencyFund(inputs), [inputs])

  const coveragePct = Math.round(res.coverageRatio * 100)
  const statusColor = res.isReached ? '#4ade80' : coveragePct >= 50 ? GOLD : '#f87171'
  const StatusIcon = res.isReached ? CheckCircle2 : coveragePct >= 50 ? Clock : AlertTriangle

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Gestion budgétaire</p>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Épargne de précaution
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
          Calculez le montant idéal à garder en liquidités selon vos charges, votre stabilité professionnelle et votre situation familiale.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>

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
  )
}
