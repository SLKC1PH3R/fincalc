'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcTax, type TaxInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { HelpCircle, Download, TrendingUp, Minus, AlertCircle, CheckCircle2, BookOpen, Settings2 } from 'lucide-react'
import { ProfileFillButton } from '@/components/ProfileFillButton'
import { GuidedModePanel, type GuidedStep } from '@/components/GuidedModePanel'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle
        className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

const SCORE = {
  excellent: { label: 'Faible', icon: CheckCircle2, color: '#34d399' },
  bon: { label: 'Modéré', icon: TrendingUp, color: '#60a5fa' },
  moyen: { label: 'Significatif', icon: Minus, color: '#fbbf24' },
  eleve: { label: 'Élevé', icon: AlertCircle, color: '#f87171' },
}

const COLOR = '#f87171'

function TaxPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<TaxInputs>({
    gross: 60000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false
  })
  const set = (k: keyof TaxInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))
  const [guidedMode, setGuidedMode] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)

  // Restore simulation from history
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const raw = JSON.parse(restoreParam)
      setInputs({
        gross: raw.gross ?? raw.salary ?? 60000,
        parts: raw.parts ?? 1,
        csRate: raw.csRate ?? 22,
        regime: raw.regime ?? 'salarie',
        fraisReels: raw.fraisReels ?? 0,
        useFraisReels: raw.useFraisReels ?? false,
      })
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcTax(inputs), [inputs])
  const score = SCORE[r.analysis.score]

  const pieData = [
    { name: 'Net perçu', value: Math.round(r.netIncome), fill: 'hsl(160 84% 39%)' },
    { name: 'Cotisations', value: Math.round(r.cotisations), fill: 'hsl(0 72% 51%)' },
    { name: 'IR', value: Math.round(r.ir), fill: 'hsl(38 92% 50%)' },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: COLOR, fontWeight: 600 }}>Impôts IR</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Calcul de l&apos;impôt sur le revenu <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 400, marginLeft: 6 }}>IR · TMI · taux moyen</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Impôts sur le Revenu',
            subtitle: `Barème IR France 2024 · Revenu brut ${fmt(inputs.gross)}`,
            kpis: [
              { label: 'Net après tout', value: fmt(r.netIncome), highlight: true, sub: `${fmt(r.netIncome / 12)}/mois` },
              { label: 'Impôt sur le revenu', value: fmt(r.ir), sub: `Taux moyen ${fmtPct(r.avgRate)}` },
              { label: 'Cotisations sociales', value: fmt(r.cotisations), sub: `${inputs.csRate}% du brut` },
              { label: 'Pression fiscale', value: fmtPct(r.effectivePressure), sub: `TMI : ${r.tmi}%` },
            ],
            inputs: [
              { label: 'Revenu brut annuel', value: fmt(inputs.gross) },
              { label: 'Parts fiscales', value: String(inputs.parts) },
              { label: 'Cotisations sociales', value: `${inputs.csRate}%` },
              { label: 'Revenu imposable', value: fmt(r.imposable) },
              { label: 'Abattement', value: fmt(r.abattement) },
              { label: 'TMI', value: `${r.tmi}%` },
            ],
            tips: r.analysis.tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="tax" name={`Impôts ${fmt(inputs.gross)}`} inputs={inputs as any} results={r as any} />
          <Button variant={guidedMode ? 'default' : 'outline'} size="sm"
            onClick={() => { setGuidedMode(v => !v); setGuidedStep(0) }}
            style={guidedMode ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.4)', color: '#34d399' } : {}}>
            {guidedMode ? <Settings2 className="h-3.5 w-3.5 mr-1.5" /> : <BookOpen className="h-3.5 w-3.5 mr-1.5" />}
            {guidedMode ? 'Mode expert' : 'Mode guidé'}
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => setInputs({ gross: 60000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false })}
            style={{ borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Inputs strip — horizontal compact bar */}
      <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '10px 16px', marginBottom: 10, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label style={{ fontSize: 10, color: 'var(--text-muted-c)' }} className="flex items-center gap-1">
            Revenu brut annuel <Tip text="Salaire brut annuel avant toute déduction." />
          </Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Input type="number" value={inputs.gross} onChange={e => set('gross')(+e.target.value)} style={{ height: 30, fontSize: 12 }} />
            <ProfileFillButton onFill={p => { if (p.netMonthlySalary) set('gross')(Math.round(p.netMonthlySalary * 12 / 0.78)) }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label style={{ fontSize: 10, color: 'var(--text-muted-c)' }} className="flex items-center gap-1">
            Situation familiale <Tip text="Le quotient familial réduit l'impôt. Chaque enfant ajoute 0.5 part." />
          </Label>
          <Select value={String(inputs.parts)} onValueChange={v => set('parts')(+v)}>
            <SelectTrigger style={{ height: 30, fontSize: 12 }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Célibataire (1 part)</SelectItem>
              <SelectItem value="1.5">Célibataire + 1 enfant</SelectItem>
              <SelectItem value="2">Couple sans enfant</SelectItem>
              <SelectItem value="2.5">Couple + 1 enfant</SelectItem>
              <SelectItem value="3">Couple + 2 enfants</SelectItem>
              <SelectItem value="4">Couple + 3 enfants</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Label style={{ fontSize: 10, color: 'var(--text-muted-c)' }} className="flex items-center gap-1">
              Cotisations sociales <Tip text="~22% salarié privé, ~10% fonctionnaire." />
            </Label>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.csRate}%</span>
          </div>
          <Slider min={0} max={25} step={0.5} value={[inputs.csRate]} onValueChange={([v]) => set('csRate')(v)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted-c)' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('csRate')(10)}>Fct. 10%</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }} onClick={() => set('csRate')(22)}>Sal. 22%</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label style={{ fontSize: 10, color: 'var(--text-muted-c)' }} className="flex items-center gap-1">
            Abattement <Tip text="Forfait 10% automatique. Frais réels si vos frais professionnels dépassent le forfait." />
          </Label>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--card-dark-border)', height: 30 }}>
            <button onClick={() => set('useFraisReels')(false)} style={{ flex: 1, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: !inputs.useFraisReels ? 'var(--text-primary)' : 'transparent', color: !inputs.useFraisReels ? 'var(--card-dark)' : 'var(--text-muted-c)' }}>Forfait 10%</button>
            <button onClick={() => set('useFraisReels')(true)} style={{ flex: 1, fontSize: 11, fontWeight: 500, border: 'none', borderLeft: '1px solid var(--card-dark-border)', cursor: 'pointer', background: inputs.useFraisReels ? 'var(--text-primary)' : 'transparent', color: inputs.useFraisReels ? 'var(--card-dark)' : 'var(--text-muted-c)' }}>Frais réels</button>
          </div>
          {inputs.useFraisReels
            ? <Input type="number" value={inputs.fraisReels} onChange={e => set('fraisReels')(+e.target.value)} placeholder="Montant €" style={{ height: 28, fontSize: 11, marginTop: 2 }} />
            : <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>Abattem. : <span style={{ color: 'var(--text-em)' }}>{fmt(r.abattement)}</span>{r.abattement === 14171 && <span style={{ color: '#fbbf24' }}> ⚠</span>}</p>
          }
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflow: 'hidden', paddingBottom: 12 }}>

        {/* Left: brackets + analysis + tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>

          {/* Tax brackets table */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)' }}>Tranches d&apos;imposition 2024</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)' }}>Barème progressif — votre tranche active est mise en évidence</p>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-dark-border)', background: 'var(--row-hover)' }}>
                  {['Tranche', 'Taux', 'Base taxable', 'IR dû'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '7px 12px', fontSize: 10, fontWeight: 500, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.brackets.map((b, i) => (
                  <tr key={i} style={{ borderBottom: i < r.brackets.length - 1 ? '1px solid var(--section-border)' : 'none', background: b.active ? 'rgba(241,192,134,0.06)' : 'transparent' }}>
                    <td style={{ padding: '7px 12px', color: b.active ? 'var(--text-em)' : 'var(--text-muted-c)', fontFamily: 'monospace', fontSize: 11 }}>{b.label}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: b.active ? 700 : 500, color: b.active ? '#f1c086' : 'var(--text-muted-c)' }}>{b.rate}%</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-muted-c)', fontVariantNumeric: 'tabular-nums' }}>{fmt(b.taxable)}</td>
                    <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: b.active ? 600 : 400, fontVariantNumeric: 'tabular-nums', color: b.active ? 'var(--text-em)' : 'var(--text-muted-c)' }}>{fmt(b.ir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analysis */}
          <div style={{
            background: r.analysis.score === 'excellent' || r.analysis.score === 'bon' ? 'rgba(52,211,153,0.06)' : r.analysis.score === 'moyen' ? 'rgba(241,192,134,0.06)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${r.analysis.score === 'excellent' || r.analysis.score === 'bon' ? 'rgba(52,211,153,0.15)' : r.analysis.score === 'moyen' ? 'rgba(241,192,134,0.15)' : 'rgba(248,113,113,0.20)'}`,
            borderRadius: 12, padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <score.icon style={{ width: 14, height: 14, color: score.color, flexShrink: 0 }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Analyse — Pression fiscale {score.label}</p>
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--row-hover)', marginBottom: 6 }}>
              <div style={{ background: 'hsl(160 84% 39%)', transition: 'width 0.5s', width: `${r.netIncome / inputs.gross * 100}%` }} />
              <div style={{ background: 'hsl(0 72% 51%)', transition: 'width 0.5s', width: `${r.cotisations / inputs.gross * 100}%` }} />
              <div style={{ background: '#fbbf24', transition: 'width 0.5s', width: `${r.ir / inputs.gross * 100}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 11, color: 'var(--text-muted-c)' }}>
              {[['hsl(160 84% 39%)', `Net ${Math.round(r.netIncome / inputs.gross * 100)}%`], ['hsl(0 72% 51%)', `CS ${Math.round(r.cotisations / inputs.gross * 100)}%`], ['#fbbf24', `IR ${Math.round(r.ir / inputs.gross * 100)}%`]].map(([color, label]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />{label}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.5, marginBottom: 10 }}>{r.analysis.message}</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pistes d&apos;optimisation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {r.analysis.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--row-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted-c)' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: KPIs + détail + répartition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflowY: 'auto' }}>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Impôt total</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#f1c086', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.ir)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>IR barème progressif</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Taux moyen</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtPct(r.avgRate)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>sur revenu imposable</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>TMI</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{r.tmi}%</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>Tranche Marginale</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Revenu net</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.netIncome)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>{fmt(r.netIncome / 12)}/mois</p>
            </div>
          </div>

          {/* Détail du calcul */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)' }}>Détail du calcul</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted-c)' }}>Décomposition étape par étape</p>
            </div>
            <div style={{ padding: '0 14px' }}>
              {[
                { label: 'Revenu brut', value: fmt(inputs.gross), help: 'Point de départ' },
                { label: `Cotisations (${inputs.csRate}%)`, value: `− ${fmt(r.cotisations)}`, variant: 'red', help: 'Charges salariales' },
                { label: 'Net avant impôt', value: fmt(r.netBeforeTax), bold: true },
                { label: inputs.useFraisReels ? 'Frais réels' : 'Abattement 10%', value: `− ${fmt(r.abattement)}`, variant: 'green', help: 'Déduction professionnelle' },
                { label: 'Revenu imposable', value: fmt(r.imposable), bold: true },
                { label: `IR (${r.tmi}% TMI)`, value: `− ${fmt(r.ir)}`, variant: 'red', help: 'Barème progressif 2024' },
                { label: 'Revenu net', value: fmt(r.netIncome), bold: true, big: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 6 ? '1px solid var(--section-border)' : 'none' }}>
                  <span style={{ fontSize: 12, color: row.bold ? 'var(--text-em)' : 'var(--text-muted-c)', fontWeight: row.bold ? 500 : 400 }}>
                    {row.label}{row.help && <Tip text={row.help} />}
                  </span>
                  <span style={{ fontSize: row.big ? 14 : 12, fontWeight: row.bold ? 600 : 500, fontVariantNumeric: 'tabular-nums', color: row.big ? '#34d399' : row.variant === 'red' ? '#f87171' : row.variant === 'green' ? '#34d399' : 'var(--text-em)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)', marginBottom: 8 }}>Répartition — où va chaque euro</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pieData.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.fill, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-muted-c)' }}>{e.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-em)' }}>{fmt(e.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={2}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TaxPage() {
  return <Suspense><TaxPageInner /></Suspense>
}
