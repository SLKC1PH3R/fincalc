'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcCompound, type CompoundInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, Download, CheckCircle2, TrendingUp, Minus, AlertCircle } from 'lucide-react'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { CsvExport } from '@/components/CsvExport'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && <span className="absolute z-50 left-5 -top-1 w-60 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">{text}</span>}
    </span>
  )
}

function CompoundPageInner() {
  const chart = useChartTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [inputs, setInputs] = useState<CompoundInputs>({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })
  const set = (k: keyof CompoundInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  // Restore simulation from history
  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const parsed = JSON.parse(restoreParam)
      if (parsed.initial !== undefined && parsed.capital === undefined) parsed.capital = parsed.initial
      setInputs(parsed as CompoundInputs)
    } catch {}
  }, [restoreParam])
  const r = useMemo(() => calcCompound(inputs), [inputs])

  const score = r.multiplier >= 5 ? 'excellent' : r.multiplier >= 3 ? 'bon' : r.multiplier >= 2 ? 'moyen' : 'faible'
  const scoreConf = {
    excellent: { label: 'Excellent', Icon: CheckCircle2, color: '#34d399' },
    bon: { label: 'Bon', Icon: TrendingUp, color: '#60a5fa' },
    moyen: { label: 'Moyen', Icon: Minus, color: '#fbbf24' },
    faible: { label: 'Faible', Icon: AlertCircle, color: '#ef4444' },
  }[score]

  const tips: string[] = []
  if (inputs.rate < 5) tips.push('Un rendement de 5-8%/an est atteignable via des ETF World diversifiés sur le long terme.')
  if (inputs.monthly < 300) tips.push(`+100€/mois supplémentaires = +${fmt(calcCompound({...inputs, monthly: inputs.monthly + 100}).final - r.final)} à terme.`)
  if (inputs.years < 15) tips.push('L\'intérêt composé devient vraiment puissant sur 20-30 ans. Chaque année compte double.')
  if (tips.length === 0) tips.push('Stratégie solide. Maintenez la régularité et évitez de retirer avant terme.')

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Épargne</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Intérêts Composés</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>La 8ème merveille du monde — Albert Einstein. Calculez la puissance de l'effet boule de neige sur le long terme.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Intérêts Composés',
            subtitle: `Capital ${fmt(inputs.capital)} · ${fmt(inputs.monthly)}/mois · ${inputs.rate}% · ${inputs.years} ans`,
            kpis: [
              { label: 'Capital final', value: fmt(r.final), highlight: true },
              { label: 'Capital investi', value: fmt(r.invested) },
              { label: 'Intérêts générés', value: fmt(r.interest) },
              { label: 'Multiplication', value: `×${r.multiplier.toFixed(1)}` },
            ],
            inputs: [
              { label: 'Capital initial', value: fmt(inputs.capital) },
              { label: 'Versement mensuel', value: fmt(inputs.monthly) },
              { label: 'Taux annuel', value: `${inputs.rate}%` },
              { label: 'Durée', value: `${inputs.years} ans` },
              { label: 'Capitalisation', value: inputs.frequency === 12 ? 'Mensuelle' : inputs.frequency === 4 ? 'Trimestrielle' : 'Annuelle' },
            ],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="compound" name={`Composés ${fmt(inputs.capital)}€ × ${inputs.years}a`} inputs={inputs as any} results={r as any} />
          <Button variant="ghost" size="sm" onClick={() => setInputs({ capital: 10000, monthly: 500, rate: 7, years: 20, frequency: 12 })}>
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left — Input panel */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Capital initial<Tip text="Montant placé dès le départ. Peut être 0 si vous démarrez de zéro." /></Label>
            <Input type="number" value={inputs.capital} onChange={e => set('capital')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Versement mensuel<Tip text="Somme ajoutée chaque mois. La régularité est clé — même un petit montant produit des effets spectaculaires sur 20+ ans." /></Label>
            <Input type="number" value={inputs.monthly} onChange={e => set('monthly')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Taux annuel<Tip text="Livret A : 3%. Fonds euros : 2-4%. ETF World : 7-10% historique." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.rate}%</span>
            </div>
            <Slider min={0.5} max={20} step={0.1} value={[inputs.rate]} onValueChange={([v]) => set('rate')(v)} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(3)}>Livret A 3%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(4)}>Fonds € 4%</button>
              <button style={{ fontSize: 11, color: 'var(--text-muted-c)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => set('rate')(8)}>ETF ~8%</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label style={{ display: 'flex', alignItems: 'center' }}>Durée<Tip text="Plus la durée est longue, plus l'effet boule de neige est puissant. 30 ans peut multiplier votre capital par 7 à 10." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
            </div>
            <Slider min={1} max={40} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ display: 'flex', alignItems: 'center' }}>Capitalisation<Tip text="Fréquence de réinvestissement des intérêts. Mensuelle est la plus courante." /></Label>
            <Select value={String(inputs.frequency)} onValueChange={v => set('frequency')(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="12">Mensuelle</SelectItem>
                <SelectItem value="4">Trimestrielle</SelectItem>
                <SelectItem value="1">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Score badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <scoreConf.Icon style={{ width: 16, height: 16, color: scoreConf.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: scoreConf.color, fontWeight: 600 }}>Stratégie {scoreConf.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted-c)', marginLeft: 4 }}>· {inputs.years} ans à {inputs.rate}% · {fmt(inputs.monthly)}/mois</span>
          </div>

          {/* KPI 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px', gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Capital final</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.final)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Capital investi</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.invested)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Intérêts générés</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: r.interest > 0 ? '#34d399' : 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.interest)}</p>
            </div>
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Multiplication</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>×{r.multiplier.toFixed(1)}</p>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Évolution du capital sur {inputs.years} ans</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginBottom: 16 }}>Capital total vs capital effectivement investi</p>
            {mounted ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={r.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${Math.round(v/1000)}k`} />
                  <Tooltip formatter={(v: any) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} />
                  <Line type="monotone" dataKey="total" name="Capital total" stroke={chart.lineMain} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="invested" name="Investi" stroke={chart.lineDim} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 280 }} />
            )}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <CsvExport
                data={r.chartData.map((d: { year: number; total: number; invested: number }) => ({ 'Année': d.year, 'Capital investi': d.invested.toFixed(0), 'Valeur totale': d.total.toFixed(0), 'Intérêts': (d.total - d.invested).toFixed(0) }))}
                filename="interets-composes.csv"
              />
            </div>
          </div>

          {/* Tips box */}
          <div style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'rgba(241,192,134,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conseils</p>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f1c086', background: 'rgba(241,192,134,0.15)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CompoundPage() {
  return <Suspense><CompoundPageInner /></Suspense>
}
