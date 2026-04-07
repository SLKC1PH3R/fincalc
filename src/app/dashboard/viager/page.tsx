'use client'
import { Suspense } from 'react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SaveSimulation } from '@/components/SaveSimulation'
import { calcViager, type ViagerInputs } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { printReport } from '@/lib/print'
import { Download, Users } from 'lucide-react'

const COLOR = '#e879f9'

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

  const tips: string[] = []
  tips.push(`L'acheteur verse ${fmt(r.bouquet)} immédiatement puis ${fmt(r.renteMensuelle)}/mois pendant ~${Math.round(r.esperanceVie)} ans (espérance de vie résiduelle).`)
  tips.push(`Seuil d'équilibre acheteur : ${r.seuilEquilibre} ans — après cette date, le vendeur "gagne" à vivre. C'est le pari actuariel du viager.`)
  if (inputs.type === 'occupe') tips.push(`Le droit d'usage et d'habitation (DUH) est déduit de la valeur vénale — le coefficient usufruit CGI 669 à ${inputs.ageVendeur} ans est ${(r.coefficientUsufruit * 100).toFixed(0)}%.`)
  tips.push(`Total versé sur espérance de vie : ${fmt(r.totalVersementsEsperance)} pour un bien valant ${fmt(inputs.valeurVenale)} (${((r.totalVersementsEsperance / inputs.valeurVenale) * 100).toFixed(0)}% de la valeur vénale).`)
  if (inputs.ageVendeur < 70) tips.push('Le viager est rarement rentable avant 70 ans pour le vendeur — le DUH est élevé et la rente calculée sur une longue espérance de vie reste faible.')

  // Timeline data: montants cumulés versés par l'acheteur
  const timelineYears = [0, 5, 10, 15, 20, 25, Math.round(r.esperanceVie)]
  const uniqueYears = Array.from(new Set(timelineYears)).sort((a, b) => a - b)
  const timelineData = uniqueYears.map(yr => ({
    yr,
    cumul: Math.round(r.bouquet + r.renteAnnuelle * yr),
    valeur: inputs.valeurVenale,
  }))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
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
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation type="viager" name={`Viager ${inputs.ageVendeur}a · ${fmt(inputs.valeurVenale)}`} inputs={inputs as any} results={r as any} />
          </div>
        </div>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
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

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <div style={{ padding: '14px 18px', borderRadius: 12, background: `linear-gradient(135deg, ${COLOR}10, transparent)`, border: `1px solid ${COLOR}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -24, right: -12, width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(ellipse, ${COLOR}14, transparent)`, pointerEvents: 'none' }} />
          <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>Bouquet</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: COLOR, letterSpacing: '-0.04em', lineHeight: 1 }}>{fmt(r.bouquet)}</p>
          <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{inputs.bouquetPct}% de la valeur nette</p>
        </div>
        {[
          { label: 'Rente mensuelle', value: fmt(r.renteMensuelle), sub: `${fmt(r.renteAnnuelle)}/an`, color: 'var(--text-primary)' },
          { label: 'Seuil d\'équilibre', value: `${r.seuilEquilibre} ans`, sub: `espérance : ${r.esperanceVie.toFixed(0)} ans`, color: r.seuilEquilibre > r.esperanceVie ? '#34d399' : '#fb923c' },
          { label: 'Total versements', value: fmt(r.totalVersementsEsperance), sub: `sur ${r.esperanceVie.toFixed(0)} ans d'espérance`, color: 'rgba(255,255,255,0.55)' },
        ].map(k => (
          <div key={k.label} style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
            <p style={{ fontSize: 9, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 4 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) 1fr', gap: 12, alignItems: 'start' }}>

        {/* Inputs */}
        <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
          {[
            { label: 'Valeur vénale du bien', k: 'valeurVenale' as const, min: 50000, max: 2000000, step: 10000, disp: (v: number) => fmt(v) },
            { label: 'Âge du vendeur', k: 'ageVendeur' as const, min: 50, max: 90, step: 1, disp: (v: number) => `${v} ans` },
            { label: 'Part du bouquet', k: 'bouquetPct' as const, min: 0, max: 50, step: 5, disp: (v: number) => `${v}%` },
            { label: 'Taux technique actuariel', k: 'taux' as const, min: 0, max: 5, step: 0.25, disp: (v: number) => `${v}%` },
          ].map(s => (
            <div key={s.k} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label>{s.label}</Label>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{s.disp(inputs[s.k] as number)}</span>
              </div>
              <Slider min={s.min} max={s.max} step={s.step} value={[inputs[s.k] as number]} onValueChange={([v]) => set(s.k)(v)} />
            </div>
          ))}

          {/* Coefficients usufruit */}
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

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

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

          {/* Timeline cumulatif */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '16px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Versements cumulés acheteur</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {timelineData.map(d => {
                const pct = Math.min((d.cumul / (inputs.valeurVenale * 1.5)) * 100, 100)
                const isBreakeven = d.yr >= r.seuilEquilibre
                return (
                  <div key={d.yr}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: d.yr === Math.round(r.esperanceVie) ? COLOR : 'var(--text-muted-c)' }}>
                        {d.yr === 0 ? 'Jour 1' : `Année ${d.yr}`}
                        {d.yr === r.seuilEquilibre ? ' ← seuil équilibre' : ''}
                        {d.yr === Math.round(r.esperanceVie) ? ' ← espérance vie' : ''}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isBreakeven ? '#34d399' : 'var(--text-primary)' }}>{fmt(d.cumul)}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: isBreakeven ? '#34d399' : COLOR, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 10 }}>
              La valeur vénale du bien est {fmt(inputs.valeurVenale)}. Au-delà du seuil d&apos;équilibre ({r.seuilEquilibre} ans), le viager devient défavorable pour l&apos;acheteur.
            </p>
          </div>

          {/* Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: `${COLOR}06`, border: `1px solid ${COLOR}18`, borderRadius: 12, padding: '12px 16px', animation: i === 0 ? 'glow-pulse 2.5s ease-in-out infinite' : undefined }}>
                <span style={{ fontSize: 12, flexShrink: 0 }}>✦</span>
                <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.55, margin: 0 }}>{tip}</p>
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
