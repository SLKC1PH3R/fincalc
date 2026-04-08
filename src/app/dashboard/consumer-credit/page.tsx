'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calcConsumerCredit, type ConsumerCreditInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { AlertTriangle, TrendingDown, Info, CreditCard, Settings2 } from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'
import { SaveSimulation } from '@/components/SaveSimulation'

const GOLD = '#f1c086'
const COLOR = '#f87171'

function ConsumerCreditPageInner() {
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

  const pieData = [
    { name: 'Capital', value: amount, fill: 'rgba(255,255,255,0.25)' },
    { name: 'Intérêts', value: Math.round(res.totalInterest), fill: COLOR },
    { name: 'Gain manqué', value: Math.round(res.alternativeGain), fill: '#fb923c' },
  ]

  const costScore = interestRatio < 20 ? 'faible' : interestRatio < 40 ? 'modéré' : 'élevé'
  const scoreColor = costScore === 'faible' ? '#34d399' : costScore === 'modéré' ? '#fbbf24' : '#f87171'

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
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
            <Button variant="outline" size="sm" style={{ borderColor: 'var(--card-dark-border)', color: 'var(--text-muted-c)' }}
              onClick={() => { setAmount(10000); setTaeg(5.5); setDurationMonths(48); setAlternativeRate(7) }}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLOR}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings2 style={{ width: 12, height: 12, color: COLOR }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Montant */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Montant emprunté (€)</Label>
                <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={500} style={{ height: 36, fontSize: 13, fontWeight: 600 }} />
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* TAEG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>TAEG annuel (%)</Label>
                <Input type="number" value={taeg} onChange={e => setTaeg(Number(e.target.value))} min={0} max={50} step={0.1} style={{ height: 36, fontSize: 13 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Taux Annuel Effectif Global — mentionné dans votre offre de crédit</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([{ label: 'Perso', val: 5.5 }, { label: 'Auto', val: 8.5 }, { label: 'Renouv.', val: 18 }] as const).map(s => (
                    <button key={s.label} onClick={() => setTaeg(s.val)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: taeg === s.val ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: taeg === s.val ? `1px solid ${COLOR}35` : '1px solid var(--card-dark-border)',
                        color: taeg === s.val ? COLOR : 'var(--text-muted-c)' }}>
                      {s.label}<br /><span style={{ fontWeight: 700 }}>{s.val}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Durée */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Durée (mois)</Label>
                <Input type="number" value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} min={6} max={120} step={6} style={{ height: 36, fontSize: 13 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>{Math.floor(durationMonths / 12)} an{Math.floor(durationMonths / 12) > 1 ? 's' : ''} {durationMonths % 12 > 0 ? `et ${durationMonths % 12} mois` : ''}</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {([12, 24, 48, 60] as const).map(m => (
                    <button key={m} onClick={() => setDurationMonths(m)}
                      style={{ flex: 1, padding: '3px 0', borderRadius: 6, fontSize: 10, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                        background: durationMonths === m ? `${COLOR}18` : 'rgba(255,255,255,0.04)',
                        border: durationMonths === m ? `1px solid ${COLOR}35` : '1px solid var(--card-dark-border)',
                        color: durationMonths === m ? COLOR : 'var(--text-muted-c)' }}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {/* Rendement alternatif */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Rendement placement alternatif (%/an)</Label>
                <Input type="number" value={alternativeRate} onChange={e => setAlternativeRate(Number(e.target.value))} min={0} max={20} step={0.5} style={{ height: 36, fontSize: 13 }} />
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Ce que le capital aurait rapporté (ETF world, PEA…)</p>
              </div>
            </div>
          </div>

          {/* Mini résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>Résumé du crédit</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Mensualité', value: fmt(res.monthlyPayment), color: COLOR },
                { label: 'Total remboursé', value: fmt(res.totalPaid), color: 'var(--text-em)' },
                { label: 'Coût intérêts', value: fmt(res.totalInterest), color: '#f87171' },
                { label: 'Ratio intérêts', value: `${interestRatio.toFixed(1)}%`, color: scoreColor },
                { label: 'Coût réel total', value: fmt(res.opportunityCost), color: '#fb923c' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: KPIs + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Alert banner */}
          <div style={{ background: '#f8717112', border: '1px solid #f8717130', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#f87171', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>
                Ce crédit vous coûte réellement {fmt(res.opportunityCost)} sur {Math.round(durationMonths / 12 * 10) / 10} ans
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: '2px 0 0' }}>
                Intérêts versés ({fmt(res.totalInterest)}) + gain manqué sur placement ({fmt(res.alternativeGain)})
              </p>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Mensualité', value: fmt(res.monthlyPayment), sub: `sur ${durationMonths} mois`, color: COLOR },
              { label: 'Total remboursé', value: fmt(res.totalPaid), sub: `dont ${interestRatio.toFixed(1)}% d'intérêts`, color: 'var(--text-primary)' },
              { label: 'Intérêts payés', value: fmt(res.totalInterest), sub: `${interestRatio.toFixed(1)}% du capital`, color: 'var(--text-primary)' },
              { label: 'TAEG', value: `${taeg}%`, sub: 'Taux effectif global', color: 'var(--text-primary)' },
            ].map((kpi, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{kpi.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Amortization chart */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--card-dark-border)', marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Évolution du remboursement</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>Capital restant dû vs total remboursé</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={res.amortizationData}>
                <defs>
                  <linearGradient id="ccRemaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLOR} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLOR} stopOpacity={0.02} />
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
                <Area type="monotone" dataKey="remaining" stroke={COLOR} strokeWidth={2} fill="url(#ccRemaining)" />
                <Area type="monotone" dataKey="totalPaid" stroke={GOLD} strokeWidth={2} fill="url(#ccPaid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Décomposition coût */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingDown style={{ width: 14, height: 14, color: 'var(--text-muted-c)' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Décomposition du coût réel</p>
            </div>
            {[
              { label: 'Capital', value: amount, color: 'rgba(255,255,255,0.15)', pct: (amount / res.opportunityCost) * 100 },
              { label: 'Intérêts', value: res.totalInterest, color: COLOR, pct: (res.totalInterest / res.opportunityCost) * 100 },
              { label: 'Gain placement manqué', value: res.alternativeGain, color: '#fb923c', pct: (res.alternativeGain / res.opportunityCost) * 100 },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted-c)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-em)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(item.value)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(item.pct, 100)}%`, borderRadius: 99, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: analyse + donut + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse */}
          <div style={{ background: costScore === 'faible' ? 'rgba(52,211,153,0.06)' : costScore === 'modéré' ? 'rgba(251,191,36,0.06)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${costScore === 'faible' ? 'rgba(52,211,153,0.18)' : costScore === 'modéré' ? 'rgba(251,191,36,0.18)' : 'rgba(248,113,113,0.22)'}`,
            borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: `${scoreColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle style={{ width: 14, height: 14, color: scoreColor }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Analyse du crédit</p>
                <p style={{ fontSize: 11, color: scoreColor, margin: 0 }}>Coût {costScore} ({interestRatio.toFixed(1)}%)</p>
              </div>
            </div>

            {/* Barre répartition */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--row-hover)', marginBottom: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', transition: 'width 0.5s', width: `${amount / res.opportunityCost * 100}%` }} />
                <div style={{ background: COLOR, transition: 'width 0.5s', width: `${res.totalInterest / res.opportunityCost * 100}%` }} />
                <div style={{ background: '#fb923c', transition: 'width 0.5s', width: `${res.alternativeGain / res.opportunityCost * 100}%` }} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['rgba(255,255,255,0.25)', `Capital`], [COLOR, `Intérêts`], ['#fb923c', `Manqué`]].map(([color, label]) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted-c)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string, display: 'inline-block', flexShrink: 0 }} />{label}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.6, margin: 0 }}>
              {taeg < 8
                ? `Taux raisonnable (${taeg}%). Ce crédit reste gérable, mais vérifiez toujours si un financement personnel est possible avant d'emprunter.`
                : taeg < 15
                  ? `Taux intermédiaire (${taeg}%). Le coût des intérêts représente ${interestRatio.toFixed(0)}% du capital. Cherchez à raccourcir la durée.`
                  : `Taux élevé (${taeg}%). Le coût réel de ce crédit dépasse ${fmt(res.opportunityCost)}. Envisagez un rachat de crédit ou un remboursement anticipé.`}
            </p>
          </div>

          {/* Donut Capital/Intérêts/Assurance */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: '0 0 12px' }}>Répartition du coût réel</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} strokeWidth={0} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmt(v), '']}
                    contentStyle={{ background: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
                {pieData.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.fill, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted-c)' }}>{e.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', fontVariantNumeric: 'tabular-nums' }}>{fmt(e.value)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-subtle)', marginLeft: 5 }}>{Math.round(e.value / res.opportunityCost * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-em)', margin: 0 }}>Conseils pour réduire le coût</p>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                `Le TAEG inclut tous les frais obligatoires. Comparez toujours le TAEG, pas seulement le taux nominal.`,
                taeg > 15 ? `Taux > 15% : envisagez un rachat de crédit ou un remboursement prioritaire avant tout investissement.` : `Raccourcir la durée de ${Math.round(durationMonths * 0.25)} mois économiserait environ ${fmt(res.totalInterest * 0.2)} d'intérêts.`,
                `Vous pourriez économiser ${fmt(res.alternativeGain)} supplémentaires en plaçant la même somme à ${alternativeRate}%/an.`,
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--card-dark-border)' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: COLOR }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info TAEG */}
          <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Info style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.65, margin: 0 }}>
                Pour les crédits renouvelables (&gt; 15%), envisagez un rachat de crédit ou le remboursement prioritaire avant tout investissement.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function ConsumerCreditPage() {
  return <Suspense><ConsumerCreditPageInner /></Suspense>
}
