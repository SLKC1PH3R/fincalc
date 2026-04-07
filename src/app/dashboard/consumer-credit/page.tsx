'use client'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { calcConsumerCredit, type ConsumerCreditInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Info, CreditCard } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'
import { SaveSimulation } from '@/components/SaveSimulation'

const GOLD = '#f1c086'
const COLOR = '#fb7185'

export default function ConsumerCreditPage() {
  const chartTheme = useChartTheme()

  const [amount, setAmount] = useState(10000)
  const [taeg, setTaeg] = useState(5.5)
  const [durationMonths, setDurationMonths] = useState(48)
  const [alternativeRate, setAlternativeRate] = useState(7)

  const inputs: ConsumerCreditInputs = useMemo(() => ({
    amount, taeg, durationMonths, alternativeRate,
  }), [amount, taeg, durationMonths, alternativeRate])

  const res = useMemo(() => calcConsumerCredit(inputs), [inputs])

  const interestRatio = amount > 0 ? (res.totalInterest / amount) * 100 : 0

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 12, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Crédit à la Consommation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Crédit à la Consommation</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Coût total · TAEG · Capacité de remboursement</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        <SaveSimulation
          type="consumer-credit"
          name={`Crédit ${fmt(amount)} à ${taeg}% — ${durationMonths} mois`}
          inputs={{ amount, taeg, durationMonths, alternativeRate } as unknown as Record<string, unknown>}
          results={{ monthlyPayment: res.monthlyPayment, totalPaid: res.totalPaid, totalInterest: res.totalInterest, alternativeGain: res.alternativeGain, opportunityCost: res.opportunityCost } as unknown as Record<string, unknown>}
        />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)' }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Montant emprunté (€)</Label>
            <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={500} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>TAEG annuel (%)</Label>
            <Input type="number" value={taeg} onChange={e => setTaeg(Number(e.target.value))} min={0} max={50} step={0.1} />
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Taux Annuel Effectif Global — mentionné dans votre offre de crédit</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Durée (mois)</Label>
            <Input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} min={6} max={120} step={6} />
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{Math.floor(durationMonths / 12)} an{Math.floor(durationMonths / 12) > 1 ? 's' : ''} {durationMonths % 12 > 0 ? `et ${durationMonths % 12} mois` : ''}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label style={{ fontSize: 12 }}>Rendement placement alternatif (%/an)</Label>
            <Input type="number" value={alternativeRate} onChange={e => setAlternativeRate(Number(e.target.value))} min={0} max={20} step={0.5} />
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Ce que le capital aurait rapporté (ETF world, PEA…)</span>
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Alert banner */}
          <div style={{ background: '#f8717112', border: '1px solid #f8717130', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#f87171', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                Ce crédit vous coûte réellement {fmt(res.opportunityCost)} sur {Math.round(durationMonths / 12 * 10) / 10} ans
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>
                Intérêts versés ({fmt(res.totalInterest)}) + gain manqué sur placement ({fmt(res.alternativeGain)})
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: 'Mensualité', value: fmt(res.monthlyPayment), sub: `sur ${durationMonths} mois`, color: 'var(--text-em)' },
              { label: 'Total remboursé', value: fmt(res.totalPaid), sub: `dont ${interestRatio.toFixed(1)}% d'intérêts`, color: GOLD },
              { label: 'Coût des intérêts', value: fmt(res.totalInterest), sub: `${interestRatio.toFixed(1)}% du capital`, color: '#f87171' },
              { label: 'Gain placement manqué', value: fmt(res.alternativeGain), sub: `à ${alternativeRate}%/an sur la durée`, color: '#fb923c' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginBottom: 3 }}>{kpi.label}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', marginTop: 2 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Amortization chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)', marginBottom: 8 }}>Capital restant dû vs total remboursé</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={res.amortizationData}>
                <defs>
                  <linearGradient id="ccRemaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="ccPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.20} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `M${v}`} />
                <YAxis tick={{ fontSize: 11, fill: chartTheme.mutedColor }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, name: string) => [fmt(v), name === 'remaining' ? 'Restant dû' : 'Total remboursé']}
                  labelFormatter={(l: number) => `Mois ${l}`}
                />
                <Legend formatter={(v: string) => v === 'remaining' ? 'Restant dû' : 'Total remboursé'} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="remaining" stroke="#f87171" strokeWidth={2} fill="url(#ccRemaining)" />
                <Area type="monotone" dataKey="totalPaid" stroke={GOLD} strokeWidth={2} fill="url(#ccPaid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Decomposition bar */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrendingDown style={{ width: 14, height: 14, color: 'var(--text-muted-c)' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-em)' }}>Décomposition du coût réel</p>
            </div>
            {[
              { label: 'Capital', value: amount, color: 'rgba(255,255,255,0.15)', pct: (amount / res.opportunityCost) * 100 },
              { label: 'Intérêts', value: res.totalInterest, color: '#f87171', pct: (res.totalInterest / res.opportunityCost) * 100 },
              { label: 'Gain placement manqué', value: res.alternativeGain, color: '#fb923c', pct: (res.alternativeGain / res.opportunityCost) * 100 },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted-c)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-em)', fontWeight: 600 }}>{fmt(item.value)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(item.pct, 100)}%`, borderRadius: 99, background: item.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Info */}
          <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Info style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65 }}>
                Le <strong style={{ color: 'var(--text-em)' }}>TAEG</strong> inclut tous les frais obligatoires (frais de dossier, assurance imposée).
                Comparez toujours le TAEG, pas seulement le taux nominal.
                Pour les crédits renouvelables (&gt; 15%), envisagez un rachat de crédit ou le remboursement prioritaire avant tout investissement.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
