'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcPlusValue, type PlusValueInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, MapPin, Settings2 } from 'lucide-react'

const COLOR = '#a78bfa'

function PlusValuePageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<PlusValueInputs>({
    acquisitionPrice: 250000,
    fraisAcquisitionPct: 7.5,
    travaux: 20000,
    useForfaitTravaux: false,
    cessionPrice: 380000,
    fraisCessionPct: 4,
    duration: 10,
    type: 'locatif',
  })
  const set = (k: keyof PlusValueInputs) => (v: number | boolean | string) =>
    setInputs(p => ({ ...p, [k]: v }))

  const r = useMemo(() => calcPlusValue(inputs), [inputs])

  const abatData = [
    { yr: 5, ir: 0, ps: 0 }, { yr: 10, ir: 30, ps: 8.25 }, { yr: 15, ir: 60, ps: 16.5 },
    { yr: 22, ir: 100, ps: 27.5 }, { yr: 25, ir: 100, ps: 54.5 }, { yr: 30, ir: 100, ps: 100 },
  ]

  const tips: string[] = []
  if (inputs.type === 'residence_principale') {
    tips.push('Résidence principale : la plus-value est totalement exonérée d\'IR et de prélèvements sociaux, sans condition de durée.')
  } else {
    if (!r.exonereIR) tips.push(`Abattement IR actuel : ${r.abatIR}%. Exonération IR totale dans ${22 - inputs.duration} ans (22 ans de détention).`)
    if (!r.exonerePS) tips.push(`Abattement PS actuel : ${r.abatPS.toFixed(1)}%. Exonération PS totale à 30 ans (dans ${30 - inputs.duration} ans).`)
    tips.push(`Sur ${fmt(r.grossPV)} de plus-value brute, l'impôt total représente ${r.grossPV > 0 ? ((r.totalTax / r.grossPV) * 100).toFixed(1) : 0}% — soit ${fmt(r.totalTax)}.`)
    if (inputs.duration >= 5 && !inputs.useForfaitTravaux) tips.push('Vous pouvez activer le forfait travaux (15% du prix d\'acquisition) sans justificatifs si la détention dépasse 5 ans.')
    if (r.surtaxe > 0) tips.push(`Surtaxe applicable car plus-value imposable > 50 000 € : ${fmt(r.surtaxe)} de taxe additionnelle.`)
  }

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Plus-value Immobilière</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Plus-value Immobilière</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Abattements IR/PS · Surtaxe · Durée optimale</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'Plus-value Immobilière',
              subtitle: `${fmt(inputs.acquisitionPrice)} → ${fmt(inputs.cessionPrice)} · ${inputs.duration} ans · ${inputs.type === 'residence_principale' ? 'Résidence principale' : inputs.type === 'secondaire' ? 'Résidence secondaire' : 'Locatif'}`,
              kpis: [
                { label: 'Plus-value brute', value: fmt(r.grossPV), highlight: true },
                { label: 'Impôt total', value: fmt(r.totalTax) },
                { label: 'Profit net', value: fmt(r.netProfit) },
                { label: 'Abattement IR', value: `${r.abatIR}%` },
              ],
              inputs: [
                { label: 'Prix acquisition', value: fmt(inputs.acquisitionPrice) },
                { label: 'Frais acquisition', value: `${inputs.fraisAcquisitionPct}%` },
                { label: 'Travaux', value: fmt(inputs.useForfaitTravaux ? inputs.acquisitionPrice * 0.15 : inputs.travaux) },
                { label: 'Prix cession', value: fmt(inputs.cessionPrice) },
                { label: 'Durée détention', value: `${inputs.duration} ans` },
                { label: 'Type bien', value: inputs.type === 'residence_principale' ? 'Résidence principale' : inputs.type === 'secondaire' ? 'Résidence secondaire' : 'Locatif' },
              ],
              sections: r.totalTax > 0 ? [{
                title: 'Décomposition fiscale',
                items: [
                  { label: 'Prix de revient corrigé', value: fmt(r.prixRevientCorrige) },
                  { label: 'Plus-value brute', value: fmt(r.grossPV) },
                  { label: `Abattement IR (${r.abatIR}%)`, value: fmt(r.grossPV - r.taxableIR) },
                  { label: `Abattement PS (${r.abatPS.toFixed(1)}%)`, value: fmt(r.grossPV - r.taxablePS) },
                  { label: 'Base taxable IR', value: fmt(r.taxableIR) },
                  { label: 'IR dû (19%)', value: fmt(r.irDu) },
                  { label: 'PS dûs (17.2%)', value: fmt(r.psDu) },
                  { label: 'Surtaxe', value: fmt(r.surtaxe) },
                  { label: 'Impôt total', value: fmt(r.totalTax) },
                  { label: 'Profit net après impôt', value: fmt(r.netProfit) },
                ]
              }] : [],
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="plusvalue" name={`PV immo ${inputs.duration}a · ${fmt(inputs.cessionPrice)}`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { val: 'residence_principale', label: 'Résidence principale' },
          { val: 'secondaire', label: 'Résidence secondaire' },
          { val: 'locatif', label: 'Bien locatif' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => set('type')(opt.val)}
            style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${inputs.type === opt.val ? COLOR : 'rgba(255,255,255,0.1)'}`, background: inputs.type === opt.val ? `${COLOR}18` : 'transparent', color: inputs.type === opt.val ? COLOR : 'var(--text-subtle)', transition: 'all 0.15s' }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Carte Paramètres */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--card-dark-border)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Settings2 style={{ width: 13, height: 13, color: COLOR }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Paramètres</p>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Prix d\'acquisition', k: 'acquisitionPrice' as const, min: 50000, max: 2000000, step: 10000, disp: (v: number) => fmt(v) },
                { label: 'Frais d\'acquisition', k: 'fraisAcquisitionPct' as const, min: 0, max: 12, step: 0.5, disp: (v: number) => `${v}%` },
                { label: 'Prix de cession', k: 'cessionPrice' as const, min: 50000, max: 3000000, step: 10000, disp: (v: number) => fmt(v) },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.disp(inputs[s.k] as number)}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k] as number]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--section-border)' }} />

              {[
                { label: 'Frais d\'agence (vente)', k: 'fraisCessionPct' as const, min: 0, max: 8, step: 0.5, disp: (v: number) => `${v}%` },
                { label: 'Durée de détention', k: 'duration' as const, min: 0, max: 35, step: 1, disp: (v: number) => `${v} ans` },
              ].map(s => (
                <div key={s.k}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Label style={{ fontSize: 12 }}>{s.label}</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.disp(inputs[s.k] as number)}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k] as number]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              {/* Travaux */}
              {inputs.type !== 'residence_principale' && (
                <>
                  <div style={{ height: 1, background: 'var(--section-border)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Label style={{ fontSize: 12 }}>Travaux</Label>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                        {inputs.useForfaitTravaux ? `forfait ${fmt(inputs.acquisitionPrice * 0.15)}` : fmt(inputs.travaux)}
                      </span>
                    </div>
                    {!inputs.useForfaitTravaux && (
                      <Slider min={0} max={500000} step={5000} value={[inputs.travaux]} onValueChange={([v]) => set('travaux')(v)} />
                    )}
                    {inputs.duration >= 5 && (
                      <button onClick={() => set('useForfaitTravaux')(!inputs.useForfaitTravaux)}
                        style={{ fontSize: 11, padding: '5px 10px', borderRadius: 7, border: `1px solid ${inputs.useForfaitTravaux ? COLOR : 'rgba(255,255,255,0.12)'}`, background: inputs.useForfaitTravaux ? `${COLOR}15` : 'transparent', color: inputs.useForfaitTravaux ? COLOR : 'var(--text-subtle)', cursor: 'pointer', textAlign: 'left' }}>
                        {inputs.useForfaitTravaux ? '✓' : '○'} Forfait 15% (sans justificatifs)
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mini-résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Résumé fiscal</p>
            {[
              { label: 'PV brute', value: fmt(r.grossPV), color: COLOR },
              { label: 'IR dû (19%)', value: fmt(r.irDu), color: '#f87171' },
              { label: 'PS (17.2%)', value: fmt(r.psDu), color: '#fb923c' },
              { label: 'Profit net', value: fmt(r.netProfit), color: '#34d399' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — KPIs + décomposition + chart abattements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
              <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Plus-value brute</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: COLOR, letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(r.grossPV)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>Prix revient : {fmt(r.prixRevientCorrige)}</p>
            </div>
            {[
              { label: 'Impôt total', value: fmt(r.totalTax), sub: r.grossPV > 0 ? `${((r.totalTax/r.grossPV)*100).toFixed(1)}% de la PV` : '—', color: '#f87171' },
              { label: 'Profit net', value: fmt(r.netProfit), sub: 'après impôts', color: '#34d399' },
              { label: 'Abattement IR', value: `${r.abatIR}%`, sub: r.exonereIR ? '✓ Exonéré IR' : `Exo. IR dans ${22 - inputs.duration} ans`, color: r.exonereIR ? '#34d399' : 'rgba(255,255,255,0.55)' },
            ].map(k => (
              <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {inputs.type === 'residence_principale' ? (
            <div style={{ background: 'var(--card-dark)', border: `1px solid #34d39930`, borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>✓</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginBottom: 8 }}>Exonération totale</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>La plus-value sur résidence principale est entièrement exonérée d'IR et de prélèvements sociaux, sans condition de durée de détention.</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginTop: 16 }}>Profit net : {fmt(r.netProfit)}</p>
            </div>
          ) : (
            <>
              {/* Décomposition fiscale */}
              <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Décomposition fiscale</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Prix de revient corrigé', value: fmt(r.prixRevientCorrige), sub: `achat + frais + travaux` },
                    { label: 'Plus-value brute', value: fmt(r.grossPV), sub: 'prix vente net - prix revient', highlight: true },
                    { label: `Abattement IR ${r.abatIR}%`, value: `-${fmt(Math.round(r.grossPV * r.abatIR / 100))}`, sub: `${22 - Math.min(inputs.duration, 22)} ans restants → exo IR`, color: '#34d399' },
                    { label: `Abattement PS ${r.abatPS.toFixed(1)}%`, value: `-${fmt(Math.round(r.grossPV * r.abatPS / 100))}`, sub: `${30 - Math.min(inputs.duration, 30)} ans restants → exo PS`, color: '#34d399' },
                    { label: 'IR dû (19%)', value: fmt(r.irDu), color: '#f87171' },
                    { label: 'Prélèvements sociaux (17.2%)', value: fmt(r.psDu), color: '#fb923c' },
                    ...(r.surtaxe > 0 ? [{ label: 'Surtaxe (PV > 50k€)', value: fmt(r.surtaxe), color: '#c084fc' }] : []),
                    { label: 'Impôt total', value: fmt(r.totalTax), sub: `${r.grossPV > 0 ? ((r.totalTax/r.grossPV)*100).toFixed(1) : 0}% de la PV`, color: '#f87171', bold: true },
                    { label: 'Profit net après impôt', value: fmt(r.netProfit), color: '#34d399', bold: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <span style={{ fontSize: 12.5, color: 'var(--text-muted-c)' }}>{row.label}</span>
                        {'sub' in row && row.sub && <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0 }}>{row.sub}</p>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: ('bold' in row && row.bold) ? 800 : 600, color: ('color' in row && row.color) ? row.color : 'highlight' in row && row.highlight ? COLOR : 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Abattements chart */}
              <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Abattements progressifs selon la durée</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={abatData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="yr" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                    <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                    <Tooltip formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} labelFormatter={v => `${v} ans`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ir" name="Abattement IR" fill={COLOR} radius={[3,3,0,0]} />
                    <Bar dataKey="ps" name="Abattement PS" fill="#818cf8" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[
                    { label: `Vous : ${inputs.duration} ans`, color: COLOR },
                    { label: `IR exo. à 22 ans`, color: '#818cf8' },
                    { label: `PS exo. à 30 ans`, color: '#c084fc' },
                  ].map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${b.color}10`, border: `1px solid ${b.color}25`, borderRadius: 6, padding: '3px 8px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.color }} />
                      <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — seuils clés + analyse + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Seuils clés */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Seuils clés de détention</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { dur: '< 5 ans', ir: '0%', ps: '0%', note: 'Aucun abattement', color: '#f87171' },
                { dur: '5 ans', ir: '0%', ps: '1.65%/an', note: 'PS démarre', color: '#fb923c' },
                { dur: '6–21 ans', ir: '6%/an', ps: '1.65%/an', note: 'Abattements progressifs', color: '#fb923c' },
                { dur: '22 ans', ir: '100%', ps: '27.5%', note: 'Exonération IR totale', color: COLOR },
                { dur: '22–30 ans', ir: '100%', ps: '+9%/an', note: 'Plus que les PS', color: COLOR },
                { dur: '30+ ans', ir: '100%', ps: '100%', note: 'Exonération totale', color: '#34d399' },
              ].map(s => (
                <div key={s.dur} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: inputs.duration >= parseInt(s.dur) || s.dur === '< 5 ans' ? 'transparent' : 'transparent' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.dur}</span>
                    <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0 }}>{s.note}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0 }}>IR: {s.ir}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-subtle)', margin: 0 }}>PS: {s.ps}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé position actuelle */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Votre situation ({inputs.duration} ans)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Abattement IR', value: `${r.abatIR}%`, color: r.exonereIR ? '#34d399' : COLOR },
                { label: 'Abattement PS', value: `${r.abatPS.toFixed(1)}%`, color: r.exonerePS ? '#34d399' : COLOR },
                { label: 'Exo. IR complète dans', value: r.exonereIR ? 'Acquise ✓' : `${22 - inputs.duration} ans`, color: r.exonereIR ? '#34d399' : 'var(--text-muted-c)' },
                { label: 'Exo. PS complète dans', value: r.exonerePS ? 'Acquise ✓' : `${30 - inputs.duration} ans`, color: r.exonerePS ? '#34d399' : 'var(--text-muted-c)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>✦</span>
                <p style={{ fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default function PlusValuePage() {
  return <Suspense><PlusValuePageInner /></Suspense>
}
