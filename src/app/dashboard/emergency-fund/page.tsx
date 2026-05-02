'use client'
import { useState, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SvgBarChart } from '@/components/SvgChart'
import { calcEmergencyFund, type EmergencyFundInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock, BookOpen, Settings2, TrendingUp } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { SaveSimulation } from '@/components/SaveSimulation'

const C = '#fbbf24'

const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

export default function EmergencyFundPage() {
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
  const statusColor = res.isReached ? '#4ade80' : coveragePct >= 50 ? C : '#f87171'
  const StatusIcon = res.isReached ? CheckCircle2 : coveragePct >= 50 ? Clock : AlertTriangle

  const targetAnimated = useCountUp(res.targetAmount, 1000)

  // Liquidity profile scores (replacing radar)
  const liquidityProfile = [
    { label: 'Liquidité', value: res.isReached ? 90 : Math.round(coveragePct * 0.9), color: C },
    { label: 'Sécurité', value: res.isReached ? 85 : Math.round(coveragePct * 0.8), color: '#60a5fa' },
    { label: 'Disponibilité', value: 95, color: '#34d399' },
    { label: 'Rendement', value: 40, color: '#a78bfa' },
    { label: 'Risque (faible)', value: 90, color: '#f472b6' },
  ]

  const guidedSteps: GuidedStep[] = [
    { question: 'Quelles sont vos charges mensuelles fixes ?', hint: "Loyer, crédits, abonnements obligatoires, courses… Tout ce qui sort chaque mois quoi qu'il arrive.", ref: 'Moyenne France : ~1 800-2 000 €/mois de charges fixes.', suffix: '€/mois', value: monthlyExpenses, onChange: setMonthlyExpenses },
    { type: 'choice', question: 'Quelle est votre situation professionnelle ?', hint: "Votre stabilité d'emploi détermine combien de mois de précaution il vous faut.", ref: 'CDI/Fonctionnaire : 3 mois. CDD : 4-6 mois. Freelance : 6-9 mois. Sans emploi : 9-12 mois.', strValue: employmentType, onChoice: v => setEmploymentType(v as typeof employmentType), options: [{ value: 'cdi', label: 'CDI / Fonctionnaire', sub: '3 mois recommandés' }, { value: 'cdd', label: 'CDD / Intérim', sub: '4-6 mois recommandés' }, { value: 'freelance', label: 'Freelance / Indépendant', sub: '6-9 mois recommandés' }, { value: 'none', label: 'Sans emploi', sub: '9-12 mois recommandés' }] },
    { question: 'Avez-vous déjà une épargne liquide ?', hint: "Total de vos livrets (Livret A, LEP, LDDS)… uniquement les liquidités disponibles immédiatement.", ref: "L'idéal : tout sur Livret A (12 500 € max) + LEP si éligible.", suffix: '€', value: currentSavings, onChange: setCurrentSavings },
    { question: 'Combien pouvez-vous épargner chaque mois ?', hint: 'Votre capacité d\'épargne mensuelle dédiée à la précaution.', ref: "Même 50 €/mois, c'est 600 €/an. La régularité prime sur le montant.", suffix: '€/mois', value: monthlySavings, onChange: setMonthlySavings },
  ]

  const tips = [
    { title: 'Livret A en priorité', body: "L'épargne de précaution doit rester liquide et sécurisée. Ne jamais immobiliser ces fonds en PEA ou assurance-vie.", color: '#4ade80' },
    { title: 'Automatisez', body: 'Programmez un virement automatique vers votre livret dès réception du salaire. La régularité prime sur le montant.', color: C },
    { title: 'Seuil psychologique', body: 'Une fois constitué, résistez à la tentation de puiser dedans. Ce matelas est réservé aux vrais imprévus.', color: '#60a5fa' },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Épargne de précaution</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Épargne de Précaution<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Coussin de sécurité. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>3 à 6 mois de dépenses recommandés.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
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

      {/* Guided mode */}
      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT — sticky */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={eyebrow}>Paramètres</div>
                <ProfileFillButton onFill={p => {
                  if (p.monthlyExpenses) setMonthlyExpenses(p.monthlyExpenses)
                  if (p.monthlySavings) setMonthlySavings(p.monthlySavings)
                }} />
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Charges mensuelles fixes</label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} min={0} step={100}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'var(--p-mono)' }}>Loyer, crédits, abonnements…</p>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Situation professionnelle</label>
                  <Select value={employmentType} onValueChange={v => setEmploymentType(v as EmergencyFundInputs['employmentType'])}>
                    <SelectTrigger style={{ height: 40, fontSize: 13, background: 'var(--p-card-2)', borderRadius: 10 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cdi">CDI / Fonctionnaire</SelectItem>
                      <SelectItem value="cdd">CDD / Intérim</SelectItem>
                      <SelectItem value="freelance">Freelance / Indépendant</SelectItem>
                      <SelectItem value="none">Sans emploi / En recherche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Situation familiale</label>
                  <Select value={familySituation} onValueChange={v => setFamilySituation(v as EmergencyFundInputs['familySituation'])}>
                    <SelectTrigger style={{ height: 40, fontSize: 13, background: 'var(--p-card-2)', borderRadius: 10 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Célibataire</SelectItem>
                      <SelectItem value="couple">En couple (2 revenus)</SelectItem>
                      <SelectItem value="family">Famille avec enfant(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Épargne liquide actuelle</label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} min={0} step={500}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--p-text-faint)', margin: 0, fontFamily: 'var(--p-mono)' }}>Livret A, compte courant, LEP…</p>
                </div>
                <div style={divSt} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelSt}>Capacité d&apos;épargne mensuelle</label>
                  <div style={{ position: 'relative' }}>
                    <Input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} min={0} step={50}
                      style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
              Objectif = charges × {res.targetMonths} mois selon votre profil.
            </div>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Fonds d&apos;urgence recommandé
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(42px, 5.5vw, 66px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtK(targetAnimated)}
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: `${Math.min(coveragePct, 100)}%`, background: statusColor, transition: 'width 0.7s', borderRadius: 5 }} />
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                      <span>{fmtK(currentSavings)} actuellement</span>
                      <span style={{ color: statusColor, fontWeight: 700 }}>{coveragePct}% atteint</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Objectif', value: `${res.targetMonths} mois`, color: C },
                    { label: 'Déjà couvert', value: fmtK(currentSavings), color: statusColor },
                    { label: 'Reste à épargner', value: res.isReached ? '0 €' : fmtK(res.gap), color: res.isReached ? '#4ade80' : '#f87171' },
                    { label: 'Délai estimé', value: res.isReached ? 'Atteint !' : res.monthsToReach !== null ? `${res.monthsToReach} mois` : '—', color: res.isReached ? '#4ade80' : 'var(--p-text)' },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status banner */}
            <div style={{ background: statusColor + '12', border: `1px solid ${statusColor}30`, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <StatusIcon style={{ width: 20, height: 20, color: statusColor, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)', margin: 0, fontFamily: 'var(--p-mono)', letterSpacing: '0.04em' }}>
                  {res.isReached
                    ? 'Objectif atteint — votre épargne de précaution est constituée'
                    : `Il vous manque ${fmtK(res.gap)} pour atteindre votre objectif`}
                </p>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 4 }}>{res.recommendation}</p>
              </div>
            </div>

            {/* Bar chart — objectif par palier */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Objectif par palier de charges</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Épargne cible selon le nombre de mois couverts</div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <SvgBarChart
                  data={res.chartData.map((d: { label: string; value: number }) => ({
                    label: d.label,
                    objectif: d.value,
                    actuel: Math.min(currentSavings, d.value),
                  }))}
                  xKey="label"
                  bars={[
                    { key: 'objectif', label: 'Objectif palier', color: `${C}66` },
                    { key: 'actuel', label: 'Épargne actuelle', color: '#4ade80' },
                  ]}
                  height={220}
                  yFormat={v => v >= 1000 ? `${Math.round(v/1000)}k` : String(Math.round(v))}
                />
              </div>
            </div>

            {/* Liquidity profile — scored rows replacing radar */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Profil liquidité — épargne précaution</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Adéquation aux critères d&apos;un fonds d&apos;urgence</div>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {liquidityProfile.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-mid)' }}>{item.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: 'var(--p-mono)' }}>{item.value}/100</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: item.color, width: `${item.value}%`, transition: 'width 0.5s', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Analyse */}
            <div style={{ background: 'var(--p-card)', border: `1px solid ${C}25`, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${C}25`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: C }} />
                <div style={{ ...eyebrow }}>Analyse d&apos;adéquation</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
                  {res.isReached
                    ? `Votre épargne de ${fmtK(currentSavings)} couvre ${res.targetMonths} mois de charges. Vous êtes bien protégé(e) face aux imprévus.`
                    : `Avec ${fmtK(currentSavings)}, vous couvrez ${(currentSavings / monthlyExpenses).toFixed(1)} mois sur les ${res.targetMonths} recommandés. Priorité : atteindre ${fmtK(res.targetAmount)}.`}
                </p>
                {res.monthsToReach !== null && !res.isReached && (
                  <div style={{ padding: '10px 12px', background: 'var(--p-card-2)', borderRadius: 10, border: '1px solid var(--p-line)' }}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Délai estimé</div>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>À {fmtK(monthlySavings)}/mois : objectif atteint en </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{res.monthsToReach} mois</span>
                  </div>
                )}
              </div>
            </div>

            {/* Où placer */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Où placer votre fonds ?</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 11.5, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 14 }}>
                  L&apos;épargne de précaution doit rester <strong style={{ color: 'var(--p-text-em)' }}>liquide et sécurisée</strong>. Ne jamais immobiliser ces fonds en placements long terme (PEA, assurance-vie…).
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { title: 'Livret A', desc: 'Plafond 22 950€ · 3% net · Disponible immédiatement', color: '#4ade80' },
                    { title: 'LDDS', desc: 'Plafond 12 000€ · 3% net · Complément au Livret A', color: '#60a5fa' },
                    { title: 'LEP (si éligible)', desc: 'Plafond 10 000€ · 4% net · Meilleur taux sans risque', color: C },
                  ].map((item, i) => (
                    <div key={i} style={{ background: `color-mix(in srgb, ${item.color} 7%, transparent)`, border: `1px solid color-mix(in srgb, ${item.color} 22%, transparent)`, borderRadius: 10, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--p-text-dim)', margin: 0 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conseils */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Conseils</div>
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ padding: '12px 12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aller plus loin */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Budget', href: '/dashboard/budget' },
                  { label: "Taux d'épargne", href: '/dashboard/savings-rate' },
                  { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
                ].map((link, i) => (
                  <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{link.label}</span>
                    <span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
