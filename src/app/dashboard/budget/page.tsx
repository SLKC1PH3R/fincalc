'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcBudget, type BudgetInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, CheckCircle2, TrendingUp, Minus, AlertCircle, ArrowRight, RotateCcw, BookOpen, Settings2 } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'

const DEFAULT_INPUTS: BudgetInputs = {
  netIncome: 3500,
  housing: 900, food: 400, transport: 200, health: 50, utilities: 100, otherNeeds: 100,
  leisure: 150, shopping: 100, restaurants: 100, otherWants: 50,
  savings: 300, debt: 0, otherSavings: 200,
}

function BudgetField({ label, value, onChange, step = 50 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Label style={{ fontSize: 12, color: 'var(--text-muted-c)', flexShrink: 0, width: '8.5rem' }}>{label}</Label>
      <div style={{ flex: 1, display: 'flex', height: 32, alignItems: 'center', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--card-dark-border)' }}>
        <button type="button" onClick={() => onChange(Math.max(0, value - step))}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 32, flexShrink: 0, color: 'var(--text-muted-c)', background: 'transparent', border: 'none', borderRight: '1px solid var(--card-dark-border)', cursor: 'pointer', fontSize: 16 }}>−</button>
        <input type="number" min={0} value={value || ''} onChange={e => onChange(+e.target.value)}
          placeholder="0"
          style={{ flex: 1, height: '100%', background: 'transparent', border: 'none', textAlign: 'center', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }} />
        <button type="button" onClick={() => onChange(value + step)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 32, flexShrink: 0, color: 'var(--text-muted-c)', background: 'transparent', border: 'none', borderLeft: '1px solid var(--card-dark-border)', cursor: 'pointer', fontSize: 16 }}>+</button>
      </div>
    </div>
  )
}

function CategoryCard({ title, total, totalPct, target, ok, children }: {
  title: string; total: number; totalPct: number; target: string; ok: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</p>
        <span style={{ fontSize: 12, fontWeight: 600, color: ok ? '#34d399' : '#fb7185' }}>
          {fmt(total)} · {fmtPct(totalPct)}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: -8 }}>Cible {target}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function BudgetPageInner() {
  const chart = useChartTheme()
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
    excellent:    { label: 'Équilibré',    Icon: CheckCircle2, color: '#34d399', borderColor: 'rgba(52,211,153,0.25)' },
    bon:          { label: 'Bon',          Icon: TrendingUp,   color: '#60a5fa', borderColor: 'rgba(96,165,250,0.25)' },
    moyen:        { label: 'À améliorer',  Icon: Minus,        color: '#fbbf24', borderColor: 'rgba(251,191,36,0.25)' },
    desequilibre: { label: 'Déséquilibré', Icon: AlertCircle,  color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' },
  }[r.analysis.score] ?? { label: 'Équilibré', Icon: CheckCircle2, color: '#34d399', borderColor: 'rgba(52,211,153,0.25)' }
  const { Icon: ScoreIcon, label: scoreLabel, color: scoreColor, borderColor: scoreBorderColor } = scoreConf

  const pieData = [
    { name: 'Besoins',    value: Math.round(r.needs),        fill: chart.fill1 },
    { name: 'Envies',     value: Math.round(r.wants),        fill: chart.fill2 },
    { name: 'Épargne',    value: Math.round(r.savingsTotal), fill: '#34d399' },
    ...(r.balance > 0 ? [{ name: 'Non alloué', value: Math.round(r.balance), fill: '#f1c086' }] : []),
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div>
          <p className="section-label" style={{ marginBottom: 6 }}>Budget</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Budget 50 / 30 / 20
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
            Besoins · Envies · Épargne — Règle d'or des finances personnelles
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="budget" name={`Budget ${fmt(inputs.netIncome)}/mois`} inputs={inputs as any} results={r as any} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Mode expert' : 'Mode guidé'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInputs(DEFAULT_INPUTS)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Réinitialiser
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {([
          { label: 'Besoins',          sub: 'cible 50%', value: fmtPct(r.needsPct),   ok: r.needsPct <= 52 },
          { label: 'Envies',           sub: 'cible 30%', value: fmtPct(r.wantsPct),   ok: r.wantsPct <= 32 },
          { label: 'Épargne',          sub: 'cible 20%', value: fmtPct(r.savingsPct), ok: r.savingsPct >= 18 },
          { label: 'Solde non alloué', sub: 'idéal 0€',  value: fmt(r.balance),        ok: Math.abs(r.balance) < 50 },
        ] as const).map((k, i) => (
          <div key={i} className="card-hover" style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '16px 18px' }}>
            <p className="section-label" style={{ marginBottom: 6 }}>{k.label} · {k.sub}</p>
            <p className="mono-amount" style={{ fontSize: 20, fontWeight: 800, color: k.ok ? '#34d399' : '#fb7185' }}>{k.value}</p>
          </div>
        ))}
      </div>

      {guidedMode && (
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
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left: Inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Revenu */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Revenu mensuel net</p>
              <ProfileFillButton onFill={p => {
                if (p.netMonthlySalary) set('netIncome')(p.netMonthlySalary)
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                value={inputs.netIncome || ''}
                onChange={e => set('netIncome')(+e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '8px 12px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', outline: 'none' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>€/mois</span>
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

        {/* ── Right: Visualization ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Progress bars */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Répartition · cibles 50/30/20</p>
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
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{row.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted-c)' }}>Cible : {fmt(row.targetAmt)}</span>
                      <span style={{ fontWeight: 600, color: ok ? '#34d399' : '#fb7185' }}>{fmt(row.amount)} ({fmtPct(row.actual)})</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', height: 10, borderRadius: 999, background: 'var(--card-dark-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: barColor, transition: 'width 0.4s ease', width: `${Math.min(row.actual / (row.target * 1.5) * 100, 100)}%` }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.3)', left: `${Math.min(100 / 1.5, 100)}%` }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 4 }}>Le trait indique la cible {row.target}%</p>
                </div>
              )
            })}
          </div>

          {/* Pie chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Répartition visuelle · {fmt(inputs.netIncome)}/mois</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pieData.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.fill, flexShrink: 0, display: 'block' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-muted-c)' }}>{e.name}</span>
                    </div>
                    <span className="mono-amount" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(e.value)}</span>
                  </div>
                ))}
                {r.balance < -10 && (
                  <p style={{ fontSize: 11, color: '#fb7185', marginTop: 4 }}>⚠ Dépenses supérieures au revenu de {fmt(Math.abs(r.balance))}</p>
                )}
              </div>
            </div>
          </div>

          {/* Detail by category */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Détail par poste</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.categories.sort((a, b) => b.amount - a.amount).map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)', width: 110, flexShrink: 0 }}>{cat.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--card-dark-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${(cat.amount / inputs.netIncome) * 100}%`, background: cat.type === 'needs' ? 'var(--text-muted-c)' : cat.type === 'wants' ? '#818cf8' : '#34d399' }} />
                  </div>
                  <span className="mono-amount" style={{ fontSize: 12, color: 'var(--text-primary)', width: 60, textAlign: 'right' }}>{fmt(cat.amount)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)', width: 38, textAlign: 'right' }}>{fmtPct(cat.amount / inputs.netIncome * 100)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${scoreBorderColor}`, borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ScoreIcon style={{ width: 16, height: 16, color: scoreColor, flexShrink: 0 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Analyse — Budget {scoreLabel}</p>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.7, marginBottom: 16 }}>{r.analysis.message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {r.analysis.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, background: 'rgba(241,192,134,0.05)', border: '1px solid rgba(241,192,134,0.12)', borderRadius: 10, padding: '10px 14px' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(241,192,134,0.15)', color: '#f1c086', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      {r.savingsTotal > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
          <a href={`/dashboard/dca?restore=${encodeURIComponent(JSON.stringify({ monthly: Math.round(r.savingsTotal), years: 20, targetRate: 8, volatility: 15, initialPrice: 100 }))}`} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ padding: '16px 20px', borderRadius: 14, cursor: 'pointer', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingUp style={{ width: 20, height: 20, color: '#818cf8', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Simuler en DCA</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>Investir {fmt(r.savingsTotal)}/mois pendant 20 ans</div>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: 'var(--text-muted-c)', marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          </a>
          <a href={`/dashboard/fire?restore=${encodeURIComponent(JSON.stringify({ income: inputs.netIncome * 12, expenses: (r.needs + r.wants) * 12, netWorth: 0, rate: 7, withdrawalRate: 4 }))}`} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ padding: '16px 20px', borderRadius: 14, cursor: 'pointer', background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.17)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 style={{ width: 20, height: 20, color: '#f1c086', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Calculer mon FIRE</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 2 }}>Avec {fmtPct(r.savingsPct)} d'épargne · dépenses {fmt(r.needs + r.wants)}/mois</div>
              </div>
              <ArrowRight style={{ width: 14, height: 14, color: 'var(--text-muted-c)', marginLeft: 'auto', flexShrink: 0 }} />
            </div>
          </a>
        </div>
      )}
    </div>
  )
}

export default function BudgetPage() { return <Suspense><BudgetPageInner /></Suspense> }
