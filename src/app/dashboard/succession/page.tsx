'use client'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calcSuccession, type SuccessionInputs, type SuccessionRelationship } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Users, Info, RefreshCw, CheckCircle2, Settings2, TrendingUp } from 'lucide-react'
import { SaveSimulation } from '@/components/SaveSimulation'
import { SvgDonut } from '@/components/SvgChart'

const C = '#f59e0b'
const GOLD = '#B07820'
const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' €'
const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

const RELATIONSHIPS: { value: SuccessionRelationship; label: string; abattement: string }[] = [
  { value: 'enfant', label: 'Enfant (ou conjoint)', abattement: '100 000 €' },
  { value: 'petit_enfant', label: 'Petit-enfant', abattement: '31 865 €' },
  { value: 'frere_soeur', label: 'Frère / Sœur', abattement: '15 932 €' },
  { value: 'neveu_niece', label: 'Neveu / Nièce', abattement: '7 967 €' },
  { value: 'autre', label: 'Autre (non-parent)', abattement: '1 594 €' },
]

export default function SuccessionPage() {
  const [amount, setAmount] = useState(150000)
  const [relationship, setRelationship] = useState<SuccessionRelationship>('enfant')
  const [donationsLast15Years, setDonationsLast15Years] = useState(0)
  const [isDonation, setIsDonation] = useState(false)

  const inputs: SuccessionInputs = useMemo(() => ({
    amount, relationship, donationsLast15Years, isDonation,
  }), [amount, relationship, donationsLast15Years, isDonation])

  const res = useMemo(() => calcSuccession(inputs), [inputs])

  const relInfo = RELATIONSHIPS.find(r => r.value === relationship)!
  const isTaxFree = res.taxableBase <= 0
  const taxColor = isTaxFree ? '#4ade80' : res.effectiveRate > 20 ? '#f87171' : GOLD

  const donutSegments = [
    { value: Math.max(res.netTransmitted, 0.01), color: '#4ade80', label: 'Net transmis' },
    ...(res.dmtg > 0 ? [{ value: res.dmtg, color: '#f87171', label: 'Droits DMTG' }] : []),
  ]

  const tips = [
    { title: 'Renouvellement 15 ans', body: `L'abattement de ${fmt(res.abattementMax)} par bénéficiaire se renouvelle tous les 15 ans. Anticipez les donations par tranches.`, color: C },
    { title: 'Assurance-vie hors succession', body: 'L\'assurance-vie permet de transmettre jusqu\'à 152 500€ par bénéficiaire hors succession, avec une fiscalité avantageuse.', color: '#fb923c' },
    { title: 'Démembrement de propriété', body: 'Transmettre la nue-propriété tout en conservant l\'usufruit réduit l\'assiette taxable et optimise la transmission patrimoniale.', color: '#4ade80' },
  ]

  const GAP = 16

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Succession &amp; Donations</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Succession &amp; Donations<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Droits de mutation · Abattements légaux. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Simulez votre transmission patrimoniale.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <SaveSimulation
            type="succession"
            name={`${isDonation ? 'Donation' : 'Succession'} ${fmt(amount)} — ${relInfo.label}`}
            inputs={{ amount, relationship, donationsLast15Years, isDonation } as unknown as Record<string, unknown>}
            results={{ dmtg: res.dmtg, netTransmitted: res.netTransmitted, taxableBase: res.taxableBase, effectiveRate: res.effectiveRate } as unknown as Record<string, unknown>}
          />
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 290px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 style={{ width: 12, height: 12, color: 'var(--p-text-faint)' }} />
              <div style={eyebrow}>Paramètres</div>
            </div>
            <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Toggle Succession / Donation */}
              <div style={{ display: 'flex', gap: 0, background: 'var(--p-card-2)', borderRadius: 10, padding: 3 }}>
                {[{ v: false, l: 'Succession' }, { v: true, l: 'Donation' }].map(opt => (
                  <button key={String(opt.v)} onClick={() => setIsDonation(opt.v)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
                    fontFamily: 'var(--p-mono)', letterSpacing: '0.04em',
                    background: isDonation === opt.v ? C : 'transparent',
                    color: isDonation === opt.v ? '#0a0a0a' : 'var(--p-text-dim)',
                    transition: 'all 0.15s',
                  }}>{opt.l}</button>
                ))}
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Montant {isDonation ? 'donné' : 'hérité'} (€)</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={10000}
                    style={{ height: 40, fontSize: 15, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Lien de parenté</label>
                <Select value={relationship} onValueChange={v => setRelationship(v as SuccessionRelationship)}>
                  <SelectTrigger style={{ height: 38, fontSize: 12, background: 'var(--p-card-2)', borderRadius: 10 }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} — abattement {r.abattement}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div style={divSt} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelSt}>Donations antérieures (15 ans) (€)</label>
                <div style={{ position: 'relative' }}>
                  <Input type="number" value={donationsLast15Years} onChange={e => setDonationsLast15Years(Number(e.target.value))} min={0} step={10000}
                    style={{ height: 38, fontSize: 13, fontWeight: 700, fontFamily: 'var(--p-mono)', paddingRight: 28, borderRadius: 10, background: 'var(--p-card-2)' }} />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>€</span>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--p-text-faint)', lineHeight: 1.4, fontFamily: 'var(--p-mono)' }}>Donations antérieures au même bénéficiaire sur 15 ans</span>
              </div>
            </div>
          </div>

          {/* Abattement disponible */}
          <div style={{ background: `${C}0d`, border: `1px solid ${C}20`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Abattement disponible</div>
            <div style={{ fontFamily: 'var(--p-serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: GOLD }}>
              {fmtK(res.abattementRemaining)}
            </div>
            <p style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 3 }}>sur {fmt(res.abattementMax)} pour {relInfo.label.toLowerCase()}</p>
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Net transmis après droits
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {fmtEur(res.netTransmitted)}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--p-text-dim)' }}>
                  <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Droits DMTG :</span> {fmtK(res.dmtg)} · taux effectif {res.effectiveRate.toFixed(1)}%
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Droits DMTG', value: fmtK(res.dmtg), color: res.dmtg > 0 ? '#f87171' : '#4ade80' },
                  { label: 'Abattement', value: fmtK(Math.min(amount, res.abattementRemaining)), color: C },
                  { label: 'Base imposable', value: fmtK(res.taxableBase), color: res.taxableBase > 0 ? '#fb923c' : '#4ade80' },
                  { label: 'Taux effectif', value: `${res.effectiveRate.toFixed(1)} %`, color: taxColor },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 16, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div style={{ background: taxColor + '12', border: `1px solid ${taxColor}30`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
            {isTaxFree
              ? <CheckCircle2 style={{ width: 18, height: 18, color: '#4ade80', flexShrink: 0 }} />
              : <Users style={{ width: 18, height: 18, color: taxColor, flexShrink: 0 }} />}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-em)' }}>
                {isTaxFree
                  ? "Aucun droit de mutation — transfert exonéré d'impôt"
                  : `${fmt(res.dmtg)} de droits à payer — taux effectif ${res.effectiveRate.toFixed(1)}%`}
              </p>
              <p style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 2 }}>
                {isTaxFree
                  ? `Le montant est inférieur à l'abattement de ${fmt(res.abattementMax)} pour un(e) ${relInfo.label.toLowerCase()}.`
                  : `Base taxable : ${fmt(res.taxableBase)} après abattement de ${fmt(Math.min(amount, res.abattementRemaining))}`}
              </p>
            </div>
          </div>

          {/* Slab breakdown */}
          {res.slabs.length > 0 && res.taxableBase > 0 && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Barème par tranche — {relInfo.label}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: 'var(--p-card-2)', borderBottom: '1px solid var(--p-line)' }}>
                {['Tranche', 'Taux', 'Droits'].map((h, i) => (
                  <div key={i} style={{ padding: '8px 14px', fontSize: 10, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, fontFamily: 'var(--p-mono)', borderLeft: i > 0 ? '1px solid var(--p-line)' : undefined }}>{h}</div>
                ))}
              </div>
              {res.slabs.map((slab, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', borderBottom: i < res.slabs.length - 1 ? '1px solid var(--p-line)' : undefined }}>
                  <div style={{ padding: '9px 14px', fontSize: 12, color: 'var(--p-text-dim)' }}>{slab.tranche}</div>
                  <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: C, borderLeft: '1px solid var(--p-line)', whiteSpace: 'nowrap', fontFamily: 'var(--p-mono)' }}>{slab.taux}%</div>
                  <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', borderLeft: '1px solid var(--p-line)', whiteSpace: 'nowrap', fontFamily: 'var(--p-mono)' }}>{fmt(slab.impot)}</div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: 'var(--p-card-2)' }}>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>Total</div>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: C, borderLeft: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>{res.effectiveRate.toFixed(1)}% eff.</div>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 800, color: '#f87171', borderLeft: '1px solid var(--p-line)', fontFamily: 'var(--p-mono)' }}>{fmt(res.dmtg)}</div>
              </div>
            </div>
          )}

          {/* Abattements légaux référence */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info style={{ width: 13, height: 13, color: 'var(--p-text-dim)' }} />
              <div style={eyebrow}>Abattements légaux (tous les 15 ans)</div>
            </div>
            {RELATIONSHIPS.map((r, i) => (
              <div key={r.value} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 16px',
                borderBottom: i < RELATIONSHIPS.length - 1 ? '1px solid var(--p-line)' : undefined,
                background: r.value === relationship ? `${C}08` : undefined,
              }}>
                <span style={{ fontSize: 12, color: r.value === relationship ? 'var(--p-text-em)' : 'var(--p-text-dim)', fontWeight: r.value === relationship ? 700 : 400 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.value === relationship ? C : 'var(--p-text-dim)', fontFamily: 'var(--p-mono)' }}>{r.abattement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Donut répartition */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition du montant</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Net transmis vs droits</div>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {/* Barre */}
              <div style={{ width: '100%', height: 10, borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${(res.netTransmitted / Math.max(amount, 1)) * 100}%`, background: 'linear-gradient(90deg, #4ade8099, #4ade80)', transition: 'width 0.5s ease' }} />
                <div style={{ flex: 1, background: '#f8717166' }} />
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--p-mono)' }}>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>{fmtK(res.netTransmitted)} net ({(100 - res.effectiveRate).toFixed(1)}%)</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{fmtK(res.dmtg)} droits</span>
              </div>
              <SvgDonut segments={donutSegments} width={160} height={120} outerRadius={55} innerRadius={38} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donutSegments.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{d.label}</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)' }}>{fmtK(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optimisation conseil */}
          <div style={{ background: `${C}08`, border: `1px solid ${C}20`, borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <RefreshCw style={{ width: 13, height: 13, color: C, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ ...eyebrow, marginBottom: 6 }}>Optimisation 15 ans</div>
                <p style={{ fontSize: 11, color: 'var(--p-text-dim)', lineHeight: 1.6 }}>
                  L&apos;abattement de <strong style={{ color: 'var(--p-text-em)' }}>{fmt(res.abattementMax)}</strong> par bénéficiaire se renouvelle tous les 15 ans.
                  En anticipant les donations par tranches, vous pouvez transmettre <strong style={{ color: 'var(--p-text-em)' }}>200 000 €</strong> à un enfant sans droit sur 30 ans.
                  {isDonation && res.abattementRemaining > 0 && (
                    <span> Vous disposez encore de <strong style={{ color: C }}>{fmt(res.abattementRemaining)}</strong> d&apos;abattement disponible.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils patrimoniaux</div>
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
                { label: 'Plus-value immobilière', href: '/dashboard/plusvalue' },
                { label: 'Flat Tax vs Barème', href: '/dashboard/flat-tax' },
              ].map((l, i) => (
                <a key={i} href={l.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                  <span>{l.label}</span><span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
