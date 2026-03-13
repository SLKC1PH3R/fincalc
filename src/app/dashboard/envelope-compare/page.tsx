'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcEnvelopeCompare, type EnvelopeCompareInputs, type EnvelopeResult } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { HelpCircle, Trophy, ArrowRight, Info } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(v => !v)} />
      {open && (
        <span className="absolute z-50 left-5 -top-1 w-64 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal">
          {text}
        </span>
      )}
    </span>
  )
}

const ENVELOPE_META = {
  pea: { label: 'PEA', color: '#818cf8', desc: 'Exonération IR après 5 ans · Plafond 150 000€' },
  cto: { label: 'CTO', color: '#38bdf8', desc: 'Flat Tax 30% sur les gains · Pas de plafond' },
  av:  { label: 'Assurance-vie', color: '#fb923c', desc: 'Abattement 4 600€/9 200€ après 8 ans · Taux 7,5%' },
}

function EnvelopeCard({ type, result, best }: { type: 'pea' | 'cto' | 'av'; result: EnvelopeResult; best: boolean }) {
  const meta = ENVELOPE_META[type]
  return (
    <div style={{
      background: best ? meta.color + '10' : 'var(--card-dark)',
      border: `1px solid ${best ? meta.color + '40' : 'var(--card-dark-border)'}`,
      borderRadius: 16, padding: '20px', position: 'relative',
    }}>
      {best && (
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: meta.color, borderRadius: 20, padding: '2px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trophy style={{ width: 10, height: 10, color: '#fff' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Meilleure option</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.color + '18', border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label.slice(0, 2)}</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-em)' }}>{meta.label}</p>
          <p style={{ fontSize: 10, color: 'var(--text-muted-c)' }}>{meta.desc}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Valeur brute', value: fmt(result.grossValue) },
          { label: 'Capital investi', value: fmt(result.totalInvested) },
          { label: 'Gain brut', value: fmt(result.grossGain) },
          { label: 'Prél. sociaux', value: fmt(result.taxPS) },
          { label: 'Impôt IR', value: fmt(result.taxIR) },
          { label: 'Total fiscalité', value: fmt(result.taxTotal), highlight: true },
          { label: 'Valeur nette', value: fmt(result.netValue), highlight: true, big: true },
          { label: 'Taux net/an', value: result.netAnnualRate.toFixed(2) + '%', highlight: true },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: row.highlight ? 0 : 6,
            borderBottom: row.highlight ? 'none' : '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
            <span style={{
              fontSize: row.big ? 16 : 12,
              fontWeight: row.highlight ? 700 : 400,
              color: row.highlight ? meta.color : 'var(--text-em)',
            }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EnvelopeCompareInner() {
  const params = useSearchParams()
  const chartTheme = useChartTheme()

  const [capital, setCapital] = useState(10000)
  const [monthly, setMonthly] = useState(300)
  const [rateGross, setRateGross] = useState(7)
  const [years, setYears] = useState(20)
  const [tmi, setTmi] = useState(30)
  const [isCouple, setIsCouple] = useState(false)
  const [peaOpenYears, setPeaOpenYears] = useState(0)

  useEffect(() => {
    const r = params.get('restore')
    if (!r) return
    try {
      const inp = JSON.parse(r) as EnvelopeCompareInputs
      setCapital(inp.capital ?? 10000)
      setMonthly(inp.monthly ?? 300)
      setRateGross(inp.rateGross ?? 7)
      setYears(inp.years ?? 20)
      setTmi(inp.tmi ?? 30)
      setIsCouple(inp.isCouple ?? false)
      setPeaOpenYears(inp.peaOpenYears ?? 0)
    } catch {}
  }, [params])

  const inputs: EnvelopeCompareInputs = useMemo(() => ({
    capital, monthly, rateGross, years, tmi, isCouple, peaOpenYears,
  }), [capital, monthly, rateGross, years, tmi, isCouple, peaOpenYears])

  const res = useMemo(() => calcEnvelopeCompare(inputs), [inputs])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Fiscalité des enveloppes</p>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          PEA vs CTO vs Assurance-vie
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
          Simulez l'impact fiscal de chaque enveloppe sur la même durée et le même investissement.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Inputs ── */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Capital initial (€)</Label>
            <Input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} min={0} step={1000} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Versement mensuel (€)</Label>
            <Input type="number" value={monthly} onChange={e => setMonthly(Number(e.target.value))} min={0} step={50} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              Rendement brut annuel (%)
              <Tip text="Rendement espéré avant fiscalité. Un ETF monde sert historiquement 7-10% brut/an." />
            </Label>
            <Input type="number" value={rateGross} onChange={e => setRateGross(Number(e.target.value))} min={0} max={30} step={0.5} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Durée (années)</Label>
            <Input type="number" value={years} onChange={e => setYears(Number(e.target.value))} min={1} max={50} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              TMI (barème)
              <Tip text="Taux Marginal d'Imposition. Utilisé pour le CTO au barème si vous l'aviez choisi." />
            </Label>
            <Select value={String(tmi)} onValueChange={v => setTmi(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 11, 30, 41, 45].map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>
              PEA déjà ouvert depuis (ans)
              <Tip text="Le PEA est exonéré d'IR après 5 ans d'ouverture. Si votre PEA a 3 ans, et que vous simulez 3 ans, il sera mature à la sortie." />
            </Label>
            <Select value={String(peaOpenYears)} onValueChange={v => setPeaOpenYears(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5].map(y => <SelectItem key={y} value={String(y)}>{y} an{y > 1 ? 's' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="couple2" checked={isCouple} onChange={e => setIsCouple(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#f1c086' }} />
            <label htmlFor="couple2" style={{ fontSize: 12, color: 'var(--text-em)', cursor: 'pointer' }}>
              Déclaration en couple
              <Tip text="Abattement AV de 9 200€/an au lieu de 4 600€." />
            </label>
          </div>

          <SaveSimulation type="envelope-compare" name="PEA vs CTO vs AV" inputs={inputs as unknown as Record<string, unknown>} results={res as unknown as Record<string, unknown>} />
        </div>

        {/* ── Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 3 Envelope cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {(['pea', 'cto', 'av'] as const).map(type => (
              <EnvelopeCard key={type} type={type} result={res[type]} best={res.best === type} />
            ))}
          </div>

          {/* Chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '20px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Évolution de la valeur nette</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={res.chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="year" tickFormatter={v => `${v}a`} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                <YAxis tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} tick={{ fontSize: 10, fill: chartTheme.tick }} />
                <Tooltip
                  contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                  formatter={(v: number, name: string) => [fmt(v), ENVELOPE_META[name as 'pea' | 'cto' | 'av']?.label ?? name]}
                  labelFormatter={v => `Année ${v}`}
                />
                <Legend formatter={(v: string) => ENVELOPE_META[v as keyof typeof ENVELOPE_META]?.label ?? v} wrapperStyle={{ fontSize: 11, color: chartTheme.tick }} />
                <Line type="monotone" dataKey="pea" stroke="#818cf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cto" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="av"  stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Key rules */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Info style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Règles clés</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: '#818cf8', text: 'PEA : plafond versements 150 000€. Exonération IR après 5 ans. Idéal pour ETF monde sur le long terme.' },
                { color: '#38bdf8', text: 'CTO : pas de plafond, mais Flat Tax 30% sur chaque gain réalisé. Utile si TMI ≤ 11% ou pour les actifs non éligibles PEA.' },
                { color: '#fb923c', text: "AV : les 8 ans comptent. Abattement annuel 4 600€ (9 200€ couple) sur les gains. Fiscalité avantageuse pour les gros patrimoines." },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ArrowRight style={{ width: 12, height: 12, color: item.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EnvelopeComparePage() {
  return (
    <Suspense>
      <EnvelopeCompareInner />
    </Suspense>
  )
}
