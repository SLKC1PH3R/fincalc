'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcViager, type ViagerInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { useChartTheme } from '@/lib/chart-theme'
import { Download, Users, Settings2 } from 'lucide-react'

const COLOR = '#e879f9'

function ViagerPageInner() {
  const chart = useChartTheme()
  const [inputs, setInputs] = useState<ViagerInputs>({
    valeurVenale: 300000,
    ageVendeur: 75,
    type: 'occupe',
    bouquetPct: 30,
    taux: 2,
  })
  const set = (k: keyof ViagerInputs) => (v: number | string) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcViager(inputs), [inputs])

  const tips: string[] = []
  tips.push(`L'acheteur verse ${fmt(r.bouquet)} immédiatement puis ${fmt(r.renteMensuelle)}/mois pendant ~${Math.round(r.esperanceVie)} ans (espérance de vie résiduelle).`)
  tips.push(`Seuil d'équilibre acheteur : ${r.seuilEquilibre} ans — après cette date, le vendeur "gagne" à vivre. C'est le pari actuariel du viager.`)
  if (inputs.type === 'occupe') tips.push(`Le droit d'usage et d'habitation (DUH) est déduit de la valeur vénale — le coefficient usufruit CGI 669 à ${inputs.ageVendeur} ans est ${(r.coefficientUsufruit * 100).toFixed(0)}%.`)
  tips.push(`Total versé sur espérance de vie : ${fmt(r.totalVersementsEsperance)} pour un bien valant ${fmt(inputs.valeurVenale)} (${((r.totalVersementsEsperance / inputs.valeurVenale) * 100).toFixed(0)}% de la valeur vénale).`)
  if (inputs.ageVendeur < 70) tips.push('Le viager est rarement rentable avant 70 ans pour le vendeur — le DUH est élevé et la rente calculée sur une longue espérance de vie reste faible.')

  // Timeline data
  const timelineYears = [0, 5, 10, 15, 20, 25, Math.round(r.esperanceVie)]
  const uniqueYears = Array.from(new Set(timelineYears)).sort((a, b) => a - b)
  const timelineData = uniqueYears.map(yr => ({
    yr,
    cumul: Math.round(r.bouquet + r.renteAnnuelle * yr),
    valeur: inputs.valeurVenale,
  }))

  // AreaChart data pour la colonne centrale
  const chartData = uniqueYears.map(yr => ({
    yr,
    cumul: Math.round(r.bouquet + r.renteAnnuelle * yr),
    valeur: inputs.valeurVenale,
  }))

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Viager</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Viager</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Bouquet · Rente · Seuil d&apos;équilibre actuariel</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            <Button variant="outline" size="sm" onClick={() => printReport({
              title: 'Simulation Viager',
              subtitle: `${fmt(inputs.valeurVenale)} · ${inputs.ageVendeur} ans · ${inputs.type === 'occupe' ? 'Viager occupé' : 'Viager libre'}`,
              kpis: [
                { label: 'Bouquet', value: fmt(r.bouquet), highlight: true },
                { label: 'Rente mensuelle', value: fmt(r.renteMensuelle) },
                { label: 'Seuil d\'équilibre', value: `${r.seuilEquilibre} ans` },
                { label: 'Total esp. de vie', value: fmt(r.totalVersementsEsperance) },
              ],
              inputs: [
                { label: 'Valeur vénale', value: fmt(inputs.valeurVenale) },
                { label: 'Âge du vendeur', value: `${inputs.ageVendeur} ans` },
                { label: 'Type', value: inputs.type === 'occupe' ? 'Viager occupé' : 'Viager libre' },
                { label: 'Part bouquet', value: `${inputs.bouquetPct}%` },
                { label: 'Taux technique', value: `${inputs.taux}%` },
              ],
              sections: [{
                title: 'Calcul actuariel',
                items: [
                  { label: 'Valeur vénale', value: fmt(inputs.valeurVenale) },
                  { label: 'DUH (coeff. usufruit)', value: inputs.type === 'occupe' ? fmt(Math.round(inputs.valeurVenale * r.coefficientUsufruit * 0.6)) : '0 € (viager libre)' },
                  { label: 'Valeur nette (base de calcul)', value: fmt(r.valeurNette) },
                  { label: 'Bouquet', value: fmt(r.bouquet) },
                  { label: 'Base de rente', value: fmt(r.baseRente) },
                  { label: 'Rente annuelle', value: fmt(r.renteAnnuelle) },
                  { label: 'Rente mensuelle', value: fmt(r.renteMensuelle) },
                  { label: 'Espérance de vie résiduelle', value: `${r.esperanceVie.toFixed(1)} ans` },
                  { label: 'Seuil d\'équilibre acheteur', value: `${r.seuilEquilibre} ans` },
                  { label: 'Total versements (espérance)', value: fmt(r.totalVersementsEsperance) },
                ]
              }],
              tips,
            })} style={{ background: COLOR, borderColor: 'transparent', color: '#fff' }}>
              <Download className="h-3.5 w-3.5 mr-1.5" />PDF
            </Button>
            <SaveSimulation type="viager" name={`Viager ${inputs.ageVendeur}a · ${fmt(inputs.valeurVenale)}`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { val: 'occupe', label: 'Viager occupé', desc: 'Vendeur conserve le droit d\'habitation' },
          { val: 'libre', label: 'Viager libre', desc: 'Acheteur dispose du bien immédiatement' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => set('type')(opt.val)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${inputs.type === opt.val ? COLOR : 'rgba(255,255,255,0.1)'}`, background: inputs.type === opt.val ? `${COLOR}15` : 'transparent', color: inputs.type === opt.val ? COLOR : 'var(--text-subtle)', transition: 'all 0.15s', gap: 2 }}>
            <span>{opt.label}</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{opt.desc}</span>
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
                { label: 'Valeur vénale du bien', k: 'valeurVenale' as const, min: 50000, max: 2000000, step: 10000, disp: (v: number) => fmt(v) },
                { label: 'Âge du vendeur', k: 'ageVendeur' as const, min: 50, max: 90, step: 1, disp: (v: number) => `${v} ans` },
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
                { label: 'Part du bouquet', k: 'bouquetPct' as const, min: 0, max: 50, step: 5, disp: (v: number) => `${v}%` },
                { label: 'Taux technique actuariel', k: 'taux' as const, min: 0, max: 5, step: 0.25, disp: (v: number) => `${v}%` },
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

              {/* Barème CGI 669 */}
              <div style={{ background: `${COLOR}08`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: COLOR, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Barème CGI 669 (usufruit)</p>
                {[
                  [60, 50], [65, 40], [70, 40], [75, 30], [80, 20], [85, 20], [90, 10],
                ].map(([age, coeff]) => (
                  <div key={age} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: inputs.ageVendeur === age ? `${COLOR}10` : 'transparent' }}>
                    <span style={{ fontSize: 11, color: inputs.ageVendeur === age ? COLOR : 'var(--text-muted-c)' }}>{age} ans</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: inputs.ageVendeur === age ? COLOR : 'var(--text-subtle)' }}>{coeff}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini-résumé */}
          <div style={{ background: `${COLOR}0d`, border: `1px solid ${COLOR}25`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Résumé actuariel</p>
            {[
              { label: 'Bouquet', value: fmt(r.bouquet), color: COLOR },
              { label: 'Rente/mois', value: fmt(r.renteMensuelle), color: 'var(--text-primary)' },
              { label: 'Valeur nette', value: fmt(r.valeurNette), color: 'var(--text-muted-c)' },
              { label: 'Seuil équilibre', value: `${r.seuilEquilibre} ans`, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — KPIs + calcul détaillé + chart cumul */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
              <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Bouquet</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: COLOR, letterSpacing: '-0.5px', lineHeight: 1 }}>{fmt(r.bouquet)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{inputs.bouquetPct}% de la valeur nette</p>
            </div>
            {[
              { label: 'Rente mensuelle', value: fmt(r.renteMensuelle), sub: `${fmt(r.renteAnnuelle)}/an`, color: 'var(--text-primary)' },
              { label: 'Seuil d\'équilibre', value: `${r.seuilEquilibre} ans`, sub: `espérance : ${r.esperanceVie.toFixed(0)} ans`, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c' },
              { label: 'Total versements', value: fmt(r.totalVersementsEsperance), sub: `sur ${r.esperanceVie.toFixed(0)} ans d'espérance`, color: 'rgba(255,255,255,0.55)' },
            ].map(k => (
              <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{k.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Calcul détaillé */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Calcul actuariel détaillé</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Valeur vénale', value: fmt(inputs.valeurVenale), color: 'var(--text-primary)' },
                ...(inputs.type === 'occupe' ? [
                  { label: `Droit d'usage et d'habitation (${(r.coefficientUsufruit * 100).toFixed(0)}% × 60%)`, value: `− ${fmt(Math.round(inputs.valeurVenale * r.coefficientUsufruit * 0.6))}`, color: '#f87171' },
                ] : []),
                { label: 'Valeur nette (base de calcul)', value: fmt(r.valeurNette), color: COLOR, bold: true },
                { label: `Bouquet (${inputs.bouquetPct}%)`, value: `− ${fmt(r.bouquet)}`, color: '#fb923c' },
                { label: 'Base de rente', value: fmt(r.baseRente), color: 'var(--text-primary)' },
                { label: `Espérance de vie résiduelle`, value: `${r.esperanceVie.toFixed(1)} ans`, color: 'rgba(255,255,255,0.6)' },
                { label: `Taux technique (${inputs.taux}%)`, value: 'formule actuarielle', color: 'rgba(255,255,255,0.4)', small: true },
                { label: 'Rente annuelle', value: fmt(r.renteAnnuelle), color: COLOR, bold: true },
                { label: 'Rente mensuelle', value: fmt(r.renteMensuelle), color: COLOR, bold: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 'small' in row && row.small ? 10 : 12.5, color: 'var(--text-muted-c)' }}>{row.label}</span>
                  <span style={{ fontSize: 'bold' in row && row.bold ? 15 : 13, fontWeight: 'bold' in row && row.bold ? 800 : 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart cumul acheteur */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Cumul acheteur vs valeur du bien</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="yr" tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${v}a`} />
                <YAxis tick={{ fontSize: 11, fill: chart.tick }} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={chart.tooltip} itemStyle={chart.itemStyle} labelStyle={chart.labelStyle} labelFormatter={v => `Année ${v}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="cumul" name="Versements cumulés" stroke={COLOR} fill={`${COLOR}18`} strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="valeur" name="Valeur vénale" stroke="rgba(255,255,255,0.3)" fill="transparent" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT — analyse espérance vs équilibre + timeline + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Analyse espérance vs point mort */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Analyse actuarielle</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: `${COLOR}0a`, border: `1px solid ${COLOR}20`, borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                  {r.seuilEquilibre > r.esperanceVie ? 'Favorable au vendeur' : 'Favorable à l\'acheteur'}
                </p>
                <p style={{ fontSize: 18, fontWeight: 800, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c', letterSpacing: '-0.3px' }}>
                  {r.seuilEquilibre > r.esperanceVie
                    ? `+${Math.round(r.seuilEquilibre - r.esperanceVie)} ans marge`
                    : `−${Math.round(r.esperanceVie - r.seuilEquilibre)} ans risque`}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>
                  Équilibre à {r.seuilEquilibre} ans, espérance {r.esperanceVie.toFixed(0)} ans
                </p>
              </div>
              {[
                { label: 'Valeur nette (DUH déduit)', value: fmt(r.valeurNette) },
                { label: 'Coeff. usufruit CGI 669', value: `${(r.coefficientUsufruit * 100).toFixed(0)}%` },
                { label: 'DUH déduit', value: inputs.type === 'occupe' ? fmt(Math.round(inputs.valeurVenale * r.coefficientUsufruit * 0.6)) : '0 € (viager libre)' },
                { label: 'Bouquet versé J1', value: fmt(r.bouquet) },
                { label: 'Rente annuelle', value: fmt(r.renteAnnuelle) },
                { label: 'Point mort acheteur', value: `${r.seuilEquilibre} ans` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline versements */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Versements cumulés acheteur</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {timelineData.map(d => {
                const pct = Math.min((d.cumul / (inputs.valeurVenale * 1.5)) * 100, 100)
                const isBreakeven = d.yr >= r.seuilEquilibre
                return (
                  <div key={d.yr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: d.yr === Math.round(r.esperanceVie) ? COLOR : 'var(--text-muted-c)' }}>
                        {d.yr === 0 ? 'Jour 1' : `Année ${d.yr}`}
                        {d.yr === r.seuilEquilibre ? ' ← équilibre' : ''}
                        {d.yr === Math.round(r.esperanceVie) ? ' ← espérance' : ''}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isBreakeven ? '#34d399' : 'var(--text-primary)' }}>{fmt(d.cumul)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: isBreakeven ? '#34d399' : COLOR, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 8 }}>
              Au-delà de {r.seuilEquilibre} ans, le viager devient défavorable pour l&apos;acheteur.
            </p>
          </div>

          {/* Conseils */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 14px', animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined }}>
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

export default function ViagerPage() {
  return <Suspense><ViagerPageInner /></Suspense>
}
