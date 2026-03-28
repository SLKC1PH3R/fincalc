'use client'
import { Suspense } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { useSearchParams } from 'next/navigation'
import { calcBuyRent, type BuyRentInputs } from '@/lib/calculators'
import { fmt, fmtPct } from '@/lib/utils'
import { HelpCircle, Download, Home, TrendingUp } from 'lucide-react'
import { printReport } from '@/lib/print'

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

function BuyRentPageInner() {
  const [inputs, setInputs] = useState<BuyRentInputs>({ price: 300000, down: 60000, loanRate: 3.5, rent: 1000, years: 20, appreciation: 2, investReturn: 7 })
  const set = (k: keyof BuyRentInputs) => (v: any) => setInputs(p => ({ ...p, [k]: v }))

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      setInputs({
        price: p.price ?? p.purchasePrice ?? 300000,
        down: p.down ?? p.downPayment ?? 60000,
        loanRate: p.loanRate ?? 3.5,
        rent: p.rent ?? p.monthlyRent ?? 1000,
        years: p.years ?? 20,
        appreciation: p.appreciation ?? p.propertyGrowth ?? 2,
        investReturn: p.investReturn ?? 7,
      })
    } catch {}
  }, [restoreParam])

  const r = useMemo(() => calcBuyRent(inputs), [inputs])

  const tips: string[] = []
  if (inputs.down / inputs.price < 0.1) tips.push('Un apport < 10% implique souvent des frais plus élevés. Visez 20% pour obtenir les meilleurs taux.')
  if (inputs.loanRate > 4) tips.push('Avec un taux > 4%, consultez un courtier — les écarts entre banques peuvent atteindre 0.5-1 point.')
  if (r.breakevenYears > 15) tips.push(`Seuil de rentabilité à ${r.breakevenYears} ans — restez dans ce bien au minimum ${Math.round(r.breakevenYears * 0.8)} ans.`)
  if (!r.buyWins) tips.push('Louer et investir la différence peut générer plus de richesse sur votre horizon. Revoyez les hypothèses de valorisation.')
  if (r.buyWins && r.breakevenYears < 10) tips.push(`Excellent investissement : seuil de rentabilité atteint en ${r.breakevenYears} ans.`)

  const verdictBg = r.buyWins ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)'
  const verdictBorder = r.buyWins ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'
  const verdictColor = r.buyWins ? '#34d399' : '#f87171'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 1100, margin: '0 auto', padding: '14px 24px 0' }}>

      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Immobilier</p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Acheter vs Louer</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>Comparez la rentabilité financière de l&apos;achat immobilier face à la location sur le long terme.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: 'Acheter vs Louer',
            subtitle: `Comparaison patrimoniale sur ${inputs.years} ans`,
            kpis: [
              { label: r.buyWins ? 'Avantage achat' : 'Avantage location', value: fmt(Math.abs(r.delta)), highlight: true },
              { label: 'Patrimoine si achat', value: fmt(r.buyNetWorth) },
              { label: 'Capital si location', value: fmt(r.rentCapital) },
              { label: 'Seuil rentabilité', value: `${r.breakevenYears} ans` },
            ],
            inputs: [
              { label: "Prix du bien", value: fmt(inputs.price) },
              { label: 'Apport', value: fmt(inputs.down) },
              { label: 'Taux crédit', value: `${inputs.loanRate}%` },
              { label: 'Loyer équivalent', value: `${fmt(inputs.rent)}/mois` },
              { label: 'Durée analyse', value: `${inputs.years} ans` },
              { label: 'Rendement investissement', value: `${inputs.investReturn}%` },
            ],
            tips,
          })} style={{ background: 'rgb(210,48,48)', borderColor: 'transparent', color: '#fff' }}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
          <SaveSimulation type="buyrent" name={`Achat vs Loc ${fmt(inputs.price)}`} inputs={inputs as any} results={r as any} />
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 16 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Patrimoine si achat</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f1c086', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(r.buyNetWorth)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Capital si location</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmt(r.rentCapital)}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Avantage patrimonial</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{fmt(Math.abs(r.delta))}</p>
        </div>
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Seuil de rentabilité</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums' }}>{r.breakevenYears} ans</p>
        </div>
      </div>

      {/* Verdict block */}
      <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 16, padding: '18px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {r.buyWins
            ? <Home style={{ width: 20, height: 20, color: verdictColor }} />
            : <TrendingUp style={{ width: 20, height: 20, color: verdictColor }} />
          }
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Verdict sur {inputs.years} ans</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: verdictColor }}>{r.buyWins ? 'L\'achat est plus avantageux' : 'La location est plus avantageuse'}</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginBottom: 4 }}>Avantage patrimonial</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: verdictColor, fontFamily: "'Geist Mono',monospace", fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}>{fmt(Math.abs(r.delta))}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 24, alignItems: 'start' }}>

        {/* Input panel */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 0 }}>Paramètres</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Prix du bien<Tip text="Prix d'achat FAI. Les frais de notaire (~8% ancien, ~3% neuf) sont calculés automatiquement." /></Label>
            <Input type="number" value={inputs.price} onChange={e => set('price')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Apport<Tip text="20% est idéal pour obtenir les meilleurs taux." /></Label>
            <Input type="number" value={inputs.down} onChange={e => set('down')(+e.target.value)} />
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{fmtPct(inputs.down / inputs.price * 100)} du prix · Emprunt {fmt(inputs.price - inputs.down)}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Taux du prêt<Tip text="Taux annuel hors assurance. Actuellement 3-4.5% selon la durée." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.loanRate}%</span>
            </div>
            <Slider min={0.5} max={8} step={0.05} value={[inputs.loanRate]} onValueChange={([v]) => set('loanRate')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Label className="flex items-center gap-1">Loyer équivalent<Tip text="Loyer pour un bien similaire. Dans le scénario location, la différence avec la mensualité est investie." /></Label>
            <Input type="number" value={inputs.rent} onChange={e => set('rent')(+e.target.value)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Durée d&apos;analyse<Tip text="Plus la durée est longue, plus l'achat devient généralement avantageux." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.years} ans</span>
            </div>
            <Slider min={5} max={30} step={1} value={[inputs.years]} onValueChange={([v]) => set('years')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Valorisation immo/an<Tip text="Appréciation annuelle estimée. France longue période : ~2-3%." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.appreciation}%</span>
            </div>
            <Slider min={-2} max={8} step={0.5} value={[inputs.appreciation]} onValueChange={([v]) => set('appreciation')(v)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label className="flex items-center gap-1">Rendement placement<Tip text="Rendement annuel si vous investissez votre apport en location (ETF, SCPI...)." /></Label>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{inputs.investReturn}%</span>
            </div>
            <Slider min={0} max={12} step={0.5} value={[inputs.investReturn]} onValueChange={([v]) => set('investReturn')(v)} />
          </div>
        </div>

        {/* Results panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Comparison breakdown */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Comparaison patrimoniale</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {/* Buy scenario */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Home style={{ width: 14, height: 14, color: 'var(--text-muted-c)' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Scénario Achat</p>
                </div>
                <div style={{ borderTop: '1px solid var(--card-dark-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Valeur bien', value: fmt(r.propertyValue) },
                    { label: 'Coût total', value: fmt(r.totalBuyCost) },
                    { label: 'Patrimoine net', value: fmt(r.buyNetWorth) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted-c)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Rent scenario */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingUp style={{ width: 14, height: 14, color: 'var(--text-muted-c)' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Scénario Location</p>
                </div>
                <div style={{ borderTop: '1px solid var(--card-dark-border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Loyers payés', value: fmt(r.totalRentCost) },
                    { label: 'Capital investi', value: fmt(inputs.down) },
                    { label: 'Capital final', value: fmt(r.rentCapital) },
                  ].map((row, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted-c)' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual comparison bars */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Bilan comparatif</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted-c)' }}>Achat</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.buyNetWorth)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', background: 'var(--text-primary)', borderRadius: 99, width: `${Math.min(r.buyNetWorth / Math.max(r.buyNetWorth, r.rentCapital) * 100, 100)}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted-c)' }}>Location</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(r.rentCapital)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'rgba(255,255,255,0.4)', borderRadius: 99, width: `${Math.min(r.rentCapital / Math.max(r.buyNetWorth, r.rentCapital) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tips / Analysis */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${verdictBorder}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Analyse — {r.buyWins ? 'Achat avantageux' : 'Location avantageuse'} sur {inputs.years} ans
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6, marginBottom: 16 }}>
              {r.buyWins
                ? `L'achat génère ${fmt(r.delta)} de patrimoine supplémentaire sur ${inputs.years} ans. Le seuil de rentabilité est atteint en ${r.breakevenYears} ans.`
                : `Louer et investir la différence génère ${fmt(Math.abs(r.delta))} de capital supplémentaire. Le rendement du placement (${inputs.investReturn}%) surpasse la valorisation immobilière (${inputs.appreciation}%).`}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default function BuyRentPage() {
  return <Suspense><BuyRentPageInner /></Suspense>
}
