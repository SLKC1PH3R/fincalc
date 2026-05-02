'use client'
import { Suspense, useState, useMemo } from 'react'
import { useCountUp } from '@/lib/use-count-up'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { SvgAreaChart } from '@/components/SvgChart'
import { calcViager, type ViagerInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { Download, TrendingUp } from 'lucide-react'

const C = '#e879f9'

const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function ViagerPageInner() {
  const [inputs, setInputs] = useState<ViagerInputs>({
    valeurVenale: 300000,
    ageVendeur: 75,
    type: 'occupe',
    bouquetPct: 30,
    taux: 2,
  })
  const set = (k: keyof ViagerInputs) => (v: number | string) => setInputs(p => ({ ...p, [k]: v }))
  const r = useMemo(() => calcViager(inputs), [inputs])

  const bouquetAnimated = useCountUp(r.bouquet, 1000)

  const tips: { title: string; body: string; color: string }[] = []
  tips.push({ title: 'Versements & rente', body: `L'acheteur verse ${fmt(r.bouquet)} immédiatement puis ${fmt(r.renteMensuelle)}/mois pendant ~${Math.round(r.esperanceVie)} ans (espérance de vie résiduelle).`, color: C })
  tips.push({ title: 'Seuil d\'équilibre', body: `Seuil d'équilibre acheteur : ${r.seuilEquilibre} ans — après cette date, le vendeur "gagne" à vivre. C'est le pari actuariel du viager.`, color: '#f87171' })
  if (inputs.type === 'occupe') tips.push({ title: 'DUH', body: `Le droit d'usage et d'habitation (DUH) est déduit de la valeur vénale — le coefficient usufruit CGI 669 à ${inputs.ageVendeur} ans est ${(r.coefficientUsufruit * 100).toFixed(0)}%.`, color: '#fbbf24' })
  tips.push({ title: 'Total versé', body: `Total versé sur espérance de vie : ${fmt(r.totalVersementsEsperance)} pour un bien valant ${fmt(inputs.valeurVenale)} (${((r.totalVersementsEsperance / inputs.valeurVenale) * 100).toFixed(0)}% de la valeur vénale).`, color: '#60a5fa' })
  if (inputs.ageVendeur < 70) tips.push({ title: 'Rentabilité', body: 'Le viager est rarement rentable avant 70 ans pour le vendeur — le DUH est élevé et la rente calculée sur une longue espérance de vie reste faible.', color: '#fb923c' })

  // Chart data — cumulative payments vs property value over years
  const maxYr = Math.min(Math.max(Math.round(r.esperanceVie) + 5, r.seuilEquilibre + 5, 30), 40)
  const chartData = Array.from({ length: maxYr + 1 }, (_, yr) => ({
    yr,
    cumul: Math.round(r.bouquet + r.renteAnnuelle * yr),
    valeur: inputs.valeurVenale,
  }))

  // Timeline data for right panel
  const timelineYears = Array.from(new Set([0, 5, 10, 15, 20, 25, Math.round(r.esperanceVie)])).sort((a, b) => a - b)
  const timelineData = timelineYears.map(yr => ({
    yr,
    cumul: Math.round(r.bouquet + r.renteAnnuelle * yr),
    valeur: inputs.valeurVenale,
  }))

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Viager</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Simulation Viager<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Bouquet · Rente · Seuil d&apos;équilibre. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Calcul actuariel CGI 669.</span>
          </p>
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
            tips: tips.map(t => t.body),
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="viager" name={`Viager ${inputs.ageVendeur}a · ${fmt(inputs.valeurVenale)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([
          { val: 'occupe', label: 'Viager occupé', desc: 'Vendeur conserve le droit d\'habitation' },
          { val: 'libre', label: 'Viager libre', desc: 'Acheteur dispose du bien immédiatement' },
        ] as const).map(opt => (
          <button key={opt.val} onClick={() => set('type')(opt.val)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${inputs.type === opt.val ? C : 'var(--p-line)'}`, background: inputs.type === opt.val ? `${C}15` : 'var(--p-card)', color: inputs.type === opt.val ? C : 'var(--p-text-faint)', transition: 'all 0.15s', gap: 2, boxShadow: 'var(--shadow-sm)' }}>
            <span>{opt.label}</span>
            <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{opt.desc}</span>
          </button>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {[
                { label: 'Valeur vénale du bien', k: 'valeurVenale' as const, min: 50000, max: 2000000, step: 10000, disp: (v: number) => fmt(v) },
                { label: 'Âge du vendeur', k: 'ageVendeur' as const, min: 50, max: 90, step: 1, disp: (v: number) => `${v} ans` },
              ].map(s => (
                <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k] as number)}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k] as number]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={divSt} />

              {[
                { label: 'Part du bouquet', k: 'bouquetPct' as const, min: 0, max: 50, step: 5, disp: (v: number) => `${v}%` },
                { label: 'Taux technique actuariel', k: 'taux' as const, min: 0, max: 5, step: 0.25, disp: (v: number) => `${v}%` },
              ].map(s => (
                <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={labelSt}>{s.label}</label>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C, fontFamily: 'var(--p-mono)' }}>{s.disp(inputs[s.k] as number)}</span>
                  </div>
                  <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k] as number]} onValueChange={([v]) => set(s.k)(v)} />
                </div>
              ))}

              <div style={divSt} />

              {/* Barème CGI 669 */}
              <div style={{ background: `${C}08`, border: `1px solid ${C}20`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ ...eyebrow, fontSize: 9.5, marginBottom: 8 }}>Barème CGI 669 (usufruit)</div>
                {[
                  [60, 50], [65, 40], [70, 40], [75, 30], [80, 20], [85, 20], [90, 10],
                ].map(([age, coeff]) => (
                  <div key={age} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', background: inputs.ageVendeur === age ? `${C}10` : 'transparent' }}>
                    <span style={{ fontSize: 11, color: inputs.ageVendeur === age ? C : 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{age} ans</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: inputs.ageVendeur === age ? C : 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{coeff}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.04em', padding: '0 4px' }}>
            Rente = Base × (taux actuariel) · Espérance de vie INSEE.
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Bouquet · Jour 1
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(42px, 5.5vw, 66px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtK(bouquetAnimated)}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--p-text-dim)' }}>
                  {inputs.bouquetPct}% de la valeur nette · {fmtK(r.renteMensuelle)}/mois ensuite
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                    <div style={{ width: `${Math.min((r.totalVersementsEsperance / (inputs.valeurVenale * 1.5)) * 100, 100)}%`, background: r.seuilEquilibre > r.esperanceVie ? '#34d399' : C, transition: 'width 0.7s' }} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                    <span>{fmtK(r.totalVersementsEsperance)} sur espérance</span>
                    <span style={{ color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c', fontWeight: 700 }}>
                      {r.seuilEquilibre > r.esperanceVie ? 'Favorable vendeur' : 'Favorable acheteur'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Rente mensuelle', value: fmtK(r.renteMensuelle), color: C },
                  { label: 'Rente annuelle', value: fmtK(r.renteAnnuelle), color: 'var(--p-text)' },
                  { label: 'Seuil d\'équilibre', value: `${r.seuilEquilibre} ans`, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c' },
                  { label: 'Total esp. de vie', value: fmtK(r.totalVersementsEsperance), color: 'var(--p-text)' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart — versements cumulés vs valeur du bien */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={eyebrow}>Trajectoire acheteur</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Versements cumulés vs valeur du bien dans le temps</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {[{ color: C, label: 'Versements cumulés' }, { color: 'rgba(255,255,255,0.35)', label: 'Valeur vénale', dashed: true }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-dim)' }}>
                    <span style={{ width: 14, height: 2, background: (l as any).dashed ? `repeating-linear-gradient(90deg, ${l.color} 0 4px, transparent 4px 7px)` : l.color }} />
                    <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 12px 6px' }}>
              <SvgAreaChart
                data={chartData}
                xKey="yr"
                series={[
                  { key: 'cumul', label: 'Versements cumulés', color: C },
                  { key: 'valeur', label: 'Valeur vénale', color: 'rgba(255,255,255,0.35)', dashed: true, noFill: true },
                ]}
                height={260}
                xFormat={v => `${v}a`}
                yFormat={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M€` : v >= 1000 ? `${Math.round(v/1000)}k€` : `${Math.round(v)}€`}
                milestones={[
                  { xVal: r.seuilEquilibre, label: `Équil. ${r.seuilEquilibre}a` },
                  { xVal: Math.round(r.esperanceVie), label: `Esp. ${Math.round(r.esperanceVie)}a` },
                ]}
              />
            </div>
          </div>

          {/* Calcul actuariel détaillé */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Calcul actuariel détaillé</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Valeur vénale', value: fmt(inputs.valeurVenale), color: 'var(--p-text)' },
                ...(inputs.type === 'occupe' ? [
                  { label: `Droit d'usage et d'habitation (${(r.coefficientUsufruit * 100).toFixed(0)}% × 60%)`, value: `− ${fmt(Math.round(inputs.valeurVenale * r.coefficientUsufruit * 0.6))}`, color: '#f87171' },
                ] : []),
                { label: 'Valeur nette (base de calcul)', value: fmt(r.valeurNette), color: C, bold: true },
                { label: `Bouquet (${inputs.bouquetPct}%)`, value: `− ${fmt(r.bouquet)}`, color: '#fb923c' },
                { label: 'Base de rente', value: fmt(r.baseRente), color: 'var(--p-text)' },
                { label: 'Espérance de vie résiduelle', value: `${r.esperanceVie.toFixed(1)} ans`, color: 'rgba(255,255,255,0.6)' },
                { label: `Taux technique (${inputs.taux}%)`, value: 'formule actuarielle', color: 'rgba(255,255,255,0.4)', small: true },
                { label: 'Rente annuelle', value: fmt(r.renteAnnuelle), color: C, bold: true },
                { label: 'Rente mensuelle', value: fmt(r.renteMensuelle), color: C, bold: true },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 'small' in row && row.small ? 10 : 12.5, color: 'var(--p-text-dim)', fontFamily: 'small' in row && row.small ? 'var(--p-mono)' : undefined }}>{row.label}</span>
                  <span style={{ fontSize: 'bold' in row && row.bold ? 15 : 13, fontWeight: 'bold' in row && row.bold ? 800 : 600, color: row.color, fontFamily: 'var(--p-mono)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Analyse actuarielle */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Analyse actuarielle</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: `${r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c'}0a`, border: `1px solid ${r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c'}20`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                  {r.seuilEquilibre > r.esperanceVie ? 'Favorable au vendeur' : "Favorable à l'acheteur"}
                </div>
                <div style={{ fontFamily: 'var(--p-mono)', fontSize: 20, fontWeight: 800, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c', letterSpacing: '-0.03em' }}>
                  {r.seuilEquilibre > r.esperanceVie
                    ? `+${Math.round(r.seuilEquilibre - r.esperanceVie)} ans marge`
                    : `−${Math.round(r.esperanceVie - r.seuilEquilibre)} ans risque`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 4 }}>
                  Équilibre à {r.seuilEquilibre} ans, espérance {r.esperanceVie.toFixed(0)} ans
                </div>
              </div>
              {[
                { label: 'Valeur nette (DUH déduit)', value: fmt(r.valeurNette) },
                { label: 'Coeff. usufruit CGI 669', value: `${(r.coefficientUsufruit * 100).toFixed(0)}%` },
                { label: 'DUH déduit', value: inputs.type === 'occupe' ? fmt(Math.round(inputs.valeurVenale * r.coefficientUsufruit * 0.6)) : '0 € (viager libre)' },
                { label: 'Bouquet versé J1', value: fmt(r.bouquet) },
                { label: 'Rente annuelle', value: fmt(r.renteAnnuelle) },
                { label: 'Point mort acheteur', value: `${r.seuilEquilibre} ans` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--p-line)' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{item.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text)', fontFamily: 'var(--p-mono)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline versements cumulés */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Versements cumulés</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Progression dans le temps</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {timelineData.map(d => {
                const pct = Math.min((d.cumul / (inputs.valeurVenale * 1.5)) * 100, 100)
                const isBreakeven = d.yr >= r.seuilEquilibre
                return (
                  <div key={d.yr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: d.yr === Math.round(r.esperanceVie) ? C : 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>
                        {d.yr === 0 ? 'Jour 1' : `Année ${d.yr}`}
                        {d.yr === r.seuilEquilibre ? ' ← équilibre' : ''}
                        {d.yr === Math.round(r.esperanceVie) ? ' ← espérance' : ''}
                      </span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: isBreakeven ? '#34d399' : 'var(--p-text)', fontFamily: 'var(--p-mono)' }}>{fmt(d.cumul)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: isBreakeven ? '#34d399' : C, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
              <p style={{ fontSize: 10.5, color: 'var(--p-text-faint)', marginTop: 4, fontFamily: 'var(--p-mono)' }}>
                Au-delà de {r.seuilEquilibre} ans, le viager devient défavorable pour l&apos;acheteur.
              </p>
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
                { label: 'Prêt immobilier', href: '/dashboard/mortgage' },
                { label: 'SCPI', href: '/dashboard/scpi' },
                { label: 'Intérêts composés', href: '/dashboard/compound' },
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
    </div>
  )
}

export default function ViagerPage() {
  return <Suspense><ViagerPageInner /></Suspense>
}
