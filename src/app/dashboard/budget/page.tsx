'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcBudget, type BudgetInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ArrowRight, RotateCcw, BookOpen, Settings2, Calculator } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { SvgDonut } from '@/components/SvgChart'

const C = '#a3e635'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const DEFAULT_INPUTS: BudgetInputs = {
  netIncome: 3500,
  housing: 900, food: 400, transport: 200, health: 50, utilities: 100, otherNeeds: 100,
  leisure: 150, shopping: 100, restaurants: 100, otherWants: 50,
  savings: 300, debt: 0, otherSavings: 200,
}

function BudgetField({ label, value, onChange, step = 50 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...labelSt, flexShrink: 0, width: '8.5rem' }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', height: 34, alignItems: 'center', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
        <button type="button" onClick={() => onChange(Math.max(0, value - step))}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 32, flexShrink: 0, color: 'var(--p-text-dim)', background: 'transparent', border: 'none', borderRight: '1px solid var(--p-line)', cursor: 'pointer', fontSize: 16 }}>−</button>
        <input type="number" min={0} value={value || ''} onChange={e => onChange(+e.target.value)}
          placeholder="0"
          style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--p-text)', outline: 'none', fontFamily: 'var(--p-mono)' }} />
        <button type="button" onClick={() => onChange(value + step)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 32, flexShrink: 0, color: 'var(--p-text-dim)', background: 'transparent', border: 'none', borderLeft: '1px solid var(--p-line)', cursor: 'pointer', fontSize: 16 }}>+</button>
      </div>
    </div>
  )
}

function CategoryCard({ title, total, totalPct, target, ok, children }: {
  title: string; total: number; totalPct: number; target: string; ok: boolean; children: React.ReactNode
}) {
  const color = ok ? '#34d399' : '#fb7185'
  return (
    <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={eyebrow}>{title}</div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color, fontFamily: 'var(--p-mono)' }}>
          {fmt(total)} · {fmtPct(totalPct)} <span style={{ fontWeight: 400, color: 'var(--p-text-faint)' }}>/ {target}</span>
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function BudgetPageInner() {
  const [inputs, setInputs] = useState<BudgetInputs>(DEFAULT_INPUTS)
  const set = (k: keyof BudgetInputs) => (v: number) => setInputs(p => ({ ...p, [k]: v }))
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      if (p.netIncome === undefined && p.income !== undefined) {
        const inc = p.income as number
        const n = inc * 0.5, w = inc * 0.3, s = inc * 0.2
        setInputs({
          netIncome: inc,
          housing: Math.round(n * 0.58), food: Math.round(n * 0.21), transport: Math.round(n * 0.11),
          health: Math.round(n * 0.03), utilities: Math.round(n * 0.05), otherNeeds: Math.round(n * 0.02),
          leisure: Math.round(w * 0.25), shopping: Math.round(w * 0.30), restaurants: Math.round(w * 0.35), otherWants: Math.round(w * 0.10),
          savings: Math.round(s * 0.50), debt: 0, otherSavings: Math.round(s * 0.50),
        })
      } else {
        setInputs(p as BudgetInputs)
      }
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcBudget(inputs), [inputs])

  const scoreConf = {
    excellent:    { label: 'Équilibré',    Icon: CheckCircle2, color: '#34d399' },
    bon:          { label: 'Bon',          Icon: TrendingUp,   color: '#60a5fa' },
    moyen:        { label: 'À améliorer',  Icon: Minus,        color: '#fbbf24' },
    desequilibre: { label: 'Déséquilibré', Icon: AlertCircle,  color: '#ef4444' },
  }[r.analysis.score] ?? { label: 'Équilibré', Icon: CheckCircle2, color: '#34d399' }
  const { Icon: ScoreIcon, label: scoreLabel, color: scoreColor } = scoreConf

  const donutSegments = [
    { value: Math.max(r.needs, 0.01), color: '#60a5fa', label: 'Besoins' },
    { value: Math.max(r.wants, 0.01), color: '#818cf8', label: 'Envies' },
    { value: Math.max(r.savingsTotal, 0.01), color: '#34d399', label: 'Épargne' },
    ...(r.balance > 0 ? [{ value: r.balance, color: '#fbbf24', label: 'Non alloué' }] : []),
  ]

  const tips = [
    { title: 'Besoins', body: r.needsPct > 52 ? `Vos besoins représentent ${fmtPct(r.needsPct)} — au-delà de la cible 50%. Identifiez les postes à réduire (logement, transport).` : `Besoins sous contrôle à ${fmtPct(r.needsPct)}. Vous respectez la règle des 50%.`, color: r.needsPct <= 52 ? '#34d399' : '#fbbf24' },
    { title: 'Taux d\'épargne', body: r.savingsPct < 15 ? `${fmtPct(r.savingsPct)} d'épargne — en dessous de l'objectif 20%. Automatisez un virement dès le jour de paie.` : `Excellent taux d'épargne de ${fmtPct(r.savingsPct)}. Orientez vers PEA ou assurance-vie.`, color: r.savingsPct >= 18 ? C : '#fb923c' },
    { title: 'Règle 50/30/20', body: 'Elizabeth Warren a popularisé cette règle : 50% besoins essentiels, 30% envies personnelles, 20% épargne. Simple et efficace pour démarrer.', color: 'var(--p-blue)' },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Budget 50/30/20</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Budget 50/30/20<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            La règle d&apos;or du budget personnel. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>50% besoins · 30% envies · 20% épargne.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Budget 50/30/20',
            subtitle: `Revenu net ${fmt(inputs.netIncome)}/mois`,
            kpis: [
              { label: 'Besoins',          value: fmtPct(r.needsPct),    sub: `${fmt(r.needs)}/mois · cible 50%` },
              { label: 'Envies',           value: fmtPct(r.wantsPct),    sub: `${fmt(r.wants)}/mois · cible 30%` },
              { label: 'Épargne',          value: fmtPct(r.savingsPct),  highlight: true, sub: `${fmt(r.savingsTotal)}/mois · cible 20%` },
              { label: 'Solde non alloué', value: fmt(r.balance) },
            ],
            inputs: [
              { label: 'Revenu net mensuel', value: fmt(inputs.netIncome) },
              { label: 'Total besoins',      value: fmt(r.needs) },
              { label: 'Total envies',       value: fmt(r.wants) },
              { label: 'Total épargne',      value: fmt(r.savingsTotal) },
            ],
            tips: r.analysis.tips,
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="budget" name={`Budget ${fmt(inputs.netIncome)}/mois`} inputs={inputs as any} results={r as any} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: `${C}18`, border: `1px solid ${C}40`, color: C } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Expert' : 'Guidé'}
          </Button>
          <Button variant="ghost" size="sm" style={{ fontSize: 11, padding: '4px 10px', height: 'auto', color: 'var(--p-text-faint)' }} onClick={() => setInputs(DEFAULT_INPUTS)}>
            <RotateCcw className="h-3 w-3 mr-1" />Réinit.
          </Button>
        </div>
      </div>

      {guidedMode && (
        <div style={{ marginBottom: 24 }}>
          <GuidedModePanel
            steps={[
              { question: 'Quel est votre revenu mensuel net ?', hint: 'Ce que vous percevez chaque mois après impôts et cotisations. La base de tout budget équilibré.', ref: 'Salaire médian France net : ~2 200 €/mois. La règle 50/30/20 fonctionne à tous les niveaux de revenu.', suffix: '€/mois', value: inputs.netIncome, onChange: v => set('netIncome')(v) },
              { question: 'Combien payez-vous pour le logement ?', hint: 'Loyer ou mensualité de crédit + charges de copropriété + assurances habitation.', ref: 'Règle des 33% : le logement ne devrait pas dépasser un tiers du revenu. Au-delà, c\'est risqué.', suffix: '€/mois', value: inputs.housing, onChange: v => set('housing')(v) },
              { question: 'Quel est votre budget alimentation ?', hint: 'Courses alimentaires + restaurants + cafés. Tout ce que vous mangez et buvez.', ref: 'Moyenne France : ~400 €/mois (courses + restaurants). Les courses représentent environ 70% de ce montant.', suffix: '€/mois', value: inputs.food, onChange: v => set('food')(v) },
              { question: 'Combien dépensez-vous en loisirs & envies ?', hint: 'Sorties, shopping, abonnements non essentiels (Netflix, Spotify…), voyages. Vos dépenses plaisir.', ref: 'La règle des 30% pour les envies. À ce niveau, profitez — c\'est votre qualité de vie.', suffix: '€/mois', value: inputs.leisure, onChange: v => set('leisure')(v) },
              { question: 'Combien mettez-vous de côté chaque mois ?', hint: 'Virement automatique vers épargne, PEA, assurance-vie… Incluez tout ce que vous ne dépensez pas.', ref: 'Objectif : 20% du revenu (règle des 20%). Commencez à 5-10% si c\'est trop et augmentez chaque année.', suffix: '€/mois', value: inputs.savings, onChange: v => set('savings')(v) },
            ] satisfies GuidedStep[]}
            currentStep={guidedStep}
            onStepChange={setGuidedStep}
            onFinish={() => setGuidedMode(false)}
          />
        </div>
      )}

      {!guidedMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 290px', gap: GAP, alignItems: 'start' }}>

          {/* LEFT — sticky inputs */}
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Revenu */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={eyebrow}>Revenu mensuel net</div>
                <ProfileFillButton onFill={p => {
                  if (p.netMonthlySalary) set('netIncome')(p.netMonthlySalary)
                }} />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={inputs.netIncome || ''}
                    onChange={e => set('netIncome')(+e.target.value)}
                    style={{ flex: 1, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', borderRadius: 10, padding: '8px 12px', fontSize: 22, fontWeight: 700, fontFamily: 'var(--p-mono)', color: 'var(--p-text)', outline: 'none', letterSpacing: '-0.03em' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€/mois</span>
                </div>
              </div>
            </div>

            <CategoryCard title="Besoins" total={r.needs} totalPct={r.needsPct} target="50%" ok={r.needsPct <= 52}>
              <BudgetField label="Logement"      value={inputs.housing}    onChange={set('housing')} />
              <BudgetField label="Alimentation"  value={inputs.food}       onChange={set('food')} />
              <BudgetField label="Transport"     value={inputs.transport}  onChange={set('transport')} />
              <BudgetField label="Santé"         value={inputs.health}     onChange={set('health')} />
              <BudgetField label="Abonnements"   value={inputs.utilities}  onChange={set('utilities')} />
              <BudgetField label="Autres besoins" value={inputs.otherNeeds} onChange={set('otherNeeds')} />
            </CategoryCard>

            <CategoryCard title="Envies" total={r.wants} totalPct={r.wantsPct} target="30%" ok={r.wantsPct <= 32}>
              <BudgetField label="Loisirs"      value={inputs.leisure}    onChange={set('leisure')} />
              <BudgetField label="Shopping"     value={inputs.shopping}   onChange={set('shopping')} />
              <BudgetField label="Restaurants"  value={inputs.restaurants} onChange={set('restaurants')} />
              <BudgetField label="Autres envies" value={inputs.otherWants} onChange={set('otherWants')} />
            </CategoryCard>

            <CategoryCard title="Épargne" total={r.savingsTotal} totalPct={r.savingsPct} target="20%" ok={r.savingsPct >= 18}>
              <BudgetField label="Épargne / livrets" value={inputs.savings}      onChange={set('savings')} />
              <BudgetField label="Remboursements"    value={inputs.debt}         onChange={set('debt')} />
              <BudgetField label="Investissements"   value={inputs.otherSavings} onChange={set('otherSavings')} />
            </CategoryCard>
          </div>

          {/* CENTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* HERO */}
            <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
              <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
                Capacité d&apos;épargne mensuelle
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
                <div style={{ padding: '52px 28px 24px' }}>
                  <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                    {fmtEur(r.savingsTotal)}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--p-text-dim)' }}>
                    <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Solde non alloué :</span> {r.balance >= 0 ? '+' : ''}{fmtK(r.balance)}/mois
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                  {[
                    { label: 'Revenu net', value: fmtK(inputs.netIncome) + '/mois' },
                    { label: 'Besoins', value: fmtPct(r.needsPct), color: r.needsPct <= 52 ? '#34d399' : '#fb7185' },
                    { label: 'Envies', value: fmtPct(r.wantsPct), color: r.wantsPct <= 32 ? '#34d399' : '#fb7185' },
                    { label: 'Taux d\'épargne', value: fmtPct(r.savingsPct), color: r.savingsPct >= 18 ? C : '#fb7185' },
                  ].map((k, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                      <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: (k as any).color ?? 'var(--p-text)', letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Répartition barres */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition · cibles 50/30/20</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Comparaison à la règle de référence</div>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {([
                  { label: 'Besoins',  actual: r.needsPct,   target: 50, amount: r.needs,        targetAmt: r.needsTarget,   inverse: true },
                  { label: 'Envies',   actual: r.wantsPct,   target: 30, amount: r.wants,        targetAmt: r.wantsTarget,   inverse: true },
                  { label: 'Épargne', actual: r.savingsPct, target: 20, amount: r.savingsTotal, targetAmt: r.savingsTarget, inverse: false },
                ]).map((row, i) => {
                  const ok = row.inverse ? row.actual <= row.target * 1.05 : row.actual >= row.target * 0.95
                  const barColor = ok ? '#34d399' : '#fb7185'
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ ...labelSt }}>{row.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
                          <span style={{ color: 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>Cible : {fmt(row.targetAmt)}</span>
                          <span style={{ fontWeight: 700, color: ok ? '#34d399' : '#fb7185', fontFamily: 'var(--p-mono)' }}>{fmt(row.amount)} ({fmtPct(row.actual)})</span>
                        </div>
                      </div>
                      <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'var(--p-line)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, background: barColor, transition: 'width 0.4s ease', width: `${Math.min(row.actual / (row.target * 1.5) * 100, 100)}%` }} />
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.25)', left: `${Math.min(100 / 1.5, 100)}%` }} />
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 4, fontFamily: 'var(--p-mono)' }}>Le trait indique la cible {row.target}%</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Détail par poste */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Détail par poste</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Classé par montant décroissant</div>
              </div>
              <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {r.categories.sort((a, b) => b.amount - a.amount).map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)', width: 120, flexShrink: 0 }}>{cat.name}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--p-line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${(cat.amount / inputs.netIncome) * 100}%`, background: cat.type === 'needs' ? '#60a5fa' : cat.type === 'wants' ? '#818cf8' : '#34d399' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--p-text-em)', width: 60, textAlign: 'right', fontFamily: 'var(--p-mono)', fontWeight: 700 }}>{fmt(cat.amount)}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--p-text-faint)', width: 38, textAlign: 'right', fontFamily: 'var(--p-mono)' }}>{fmtPct(cat.amount / inputs.netIncome * 100)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            {r.savingsTotal > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP }}>
                <a href={`/dashboard/dca?restore=${encodeURIComponent(JSON.stringify({ monthly: Math.round(r.savingsTotal), years: 20, targetRate: 8, volatility: 15, initialPrice: 100 }))}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px 18px', borderRadius: 14, cursor: 'pointer', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
                    <TrendingUp style={{ width: 18, height: 18, color: '#818cf8', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>Simuler en DCA</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-dim)', marginTop: 2 }}>Investir {fmt(r.savingsTotal)}/mois pendant 20 ans</div>
                    </div>
                    <ArrowRight style={{ width: 13, height: 13, color: 'var(--p-text-faint)', marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                </a>
                <a href={`/dashboard/fire?restore=${encodeURIComponent(JSON.stringify({ income: inputs.netIncome * 12, expenses: (r.needs + r.wants) * 12, netWorth: 0, rate: 7, withdrawalRate: 4 }))}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '16px 18px', borderRadius: 14, cursor: 'pointer', background: `${C}08`, border: `1px solid ${C}25`, display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
                    <CheckCircle2 style={{ width: 18, height: 18, color: C, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>Calculer mon FIRE</div>
                      <div style={{ fontSize: 10.5, color: 'var(--p-text-dim)', marginTop: 2 }}>Avec {fmtPct(r.savingsPct)} d&apos;épargne · dépenses {fmt(r.needs + r.wants)}/mois</div>
                    </div>
                    <ArrowRight style={{ width: 13, height: 13, color: 'var(--p-text-faint)', marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

            {/* Donut répartition visuelle */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Répartition visuelle</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>{fmtEur(inputs.netIncome)}/mois</div>
              </div>
              <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <SvgDonut segments={donutSegments} width={160} height={120} outerRadius={55} innerRadius={38} />
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {donutSegments.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{d.label}</span>
                      <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                  {r.balance < -10 && (
                    <p style={{ fontSize: 11, color: '#fb7185', marginTop: 4 }}>Dépenses supérieures au revenu de {fmtK(Math.abs(r.balance))}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Analyse */}
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScoreIcon style={{ width: 14, height: 14, color: scoreColor }} />
                <div style={{ ...eyebrow, color: scoreColor }}>Analyse — {scoreLabel}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>{r.analysis.message}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {r.analysis.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, borderRadius: 8, border: '1px solid var(--p-line)', padding: '8px 10px', background: 'var(--p-card-2)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${C}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: C }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.5, margin: 0 }}>{tip}</p>
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
                  { label: 'Taux d\'épargne', href: '/dashboard/savings-rate' },
                  { label: 'FI/RE', href: '/dashboard/fire' },
                ].map((l, i) => (
                  <a key={i} href={l.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                    <span>{l.label}</span><span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
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

export default function BudgetPage() { return <Suspense><BudgetPageInner /></Suspense> }
