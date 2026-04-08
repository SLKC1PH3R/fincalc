'use client'
import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calcSuccession, type SuccessionInputs, type SuccessionRelationship } from '@/lib/calculators'
import { fmt } from '@/lib/utils'
import { Users, Info, RefreshCw, CheckCircle2, Settings2, ArrowRight } from 'lucide-react'
import { SaveSimulation } from '@/components/SaveSimulation'

const COLOR = '#f59e0b'
const GOLD = '#f1c086'

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

  const donutData = [
    { name: 'Net transmis', value: res.netTransmitted, color: '#4ade80' },
    { name: 'Droits DMTG', value: res.dmtg, color: '#f87171' },
  ].filter(d => d.value > 0)

  return (
    <div style={{ padding: '20px 24px 48px' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Simulateurs</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: COLOR, fontWeight: 600 }}>Succession &amp; Donations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}18`, border: `1px solid ${COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users style={{ width: 20, height: 20, color: COLOR }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>Succession &amp; Donations</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', margin: 0 }}>Droits de succession · Abattements · Optimisation</p>
            </div>
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
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* LEFT — sticky inputs */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}25`, borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Paramètres</p>
            </div>

            {/* Toggle Succession / Donation */}
            <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
              {[{ v: false, l: 'Succession' }, { v: true, l: 'Donation' }].map(opt => (
                <button key={String(opt.v)} onClick={() => setIsDonation(opt.v)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: isDonation === opt.v ? GOLD : 'transparent',
                  color: isDonation === opt.v ? '#0a0a0a' : 'var(--text-muted-c)',
                  transition: 'all 0.15s',
                }}>{opt.l}</button>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Montant {isDonation ? 'donné' : 'hérité'} (€)</label>
              <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={0} step={10000} style={{ height: 36, fontSize: 13 }} />
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Lien de parenté</label>
              <Select value={relationship} onValueChange={v => setRelationship(v as SuccessionRelationship)}>
                <SelectTrigger style={{ height: 36, fontSize: 13 }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label} — abattement {r.abattement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div style={{ height: 1, background: 'var(--section-border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>Donations déjà faites sur 15 ans (€)</label>
              <Input type="number" value={donationsLast15Years} onChange={e => setDonationsLast15Years(Number(e.target.value))} min={0} step={10000} style={{ height: 36, fontSize: 13 }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted-c)', lineHeight: 1.4 }}>Donations antérieures au même bénéficiaire sur 15 ans</span>
            </div>
          </div>

          {/* Abattement disponible */}
          <div style={{ background: 'var(--card-dark)', border: `1px solid ${COLOR}20`, borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Abattement disponible</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: GOLD, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{fmt(res.abattementRemaining)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>sur {fmt(res.abattementMax)} pour {relInfo.label.toLowerCase()}</p>
          </div>
        </div>

        {/* CENTER — KPIs + barème + table héritiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* KPI 4-grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Droits DMTG', value: fmt(res.dmtg), sub: `taux effectif ${res.effectiveRate.toFixed(1)}%`, color: res.dmtg > 0 ? '#f87171' : '#4ade80' },
              { label: 'Abattement total', value: fmt(Math.min(amount, res.abattementRemaining)), sub: `sur ${fmt(res.abattementMax)} légal`, color: GOLD },
              { label: 'Net transmis', value: fmt(res.netTransmitted), sub: `sur ${fmt(amount)} ${isDonation ? 'donnés' : 'hérités'}`, color: '#4ade80' },
              { label: 'Base imposable', value: fmt(res.taxableBase), sub: 'après abattement', color: res.taxableBase > 0 ? '#fb923c' : '#4ade80' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Status banner */}
          <div style={{ background: taxColor + '12', border: `1px solid ${taxColor}30`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {isTaxFree
              ? <CheckCircle2 style={{ width: 18, height: 18, color: '#4ade80', flexShrink: 0 }} />
              : <Users style={{ width: 18, height: 18, color: taxColor, flexShrink: 0 }} />}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>
                {isTaxFree
                  ? "Aucun droit de mutation — transfert exonéré d'impôt"
                  : `${fmt(res.dmtg)} de droits à payer — taux effectif ${res.effectiveRate.toFixed(1)}%`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted-c)', marginTop: 2 }}>
                {isTaxFree
                  ? `Le montant est inférieur à l'abattement de ${fmt(res.abattementMax)} pour un(e) ${relInfo.label.toLowerCase()}.`
                  : `Base taxable : ${fmt(res.taxableBase)} après abattement de ${fmt(Math.min(amount, res.abattementRemaining))}`}
              </p>
            </div>
          </div>

          {/* Slab breakdown */}
          {res.slabs.length > 0 && res.taxableBase > 0 && (
            <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Barème par tranche — {relInfo.label}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', borderBottom: '1px solid var(--card-dark-border)' }}>
                {['Tranche', 'Taux', 'Droits'].map((h, i) => (
                  <div key={i} style={{ padding: '8px 14px', fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.08em', borderLeft: i > 0 ? '1px solid var(--card-dark-border)' : undefined }}>{h}</div>
                ))}
              </div>
              {res.slabs.map((slab, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', borderBottom: i < res.slabs.length - 1 ? '1px solid var(--section-border)' : undefined }}>
                  <div style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text-muted-c)' }}>{slab.tranche}</div>
                  <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: GOLD, borderLeft: '1px solid var(--card-dark-border)', whiteSpace: 'nowrap' }}>{slab.taux}%</div>
                  <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-em)', borderLeft: '1px solid var(--card-dark-border)', whiteSpace: 'nowrap' }}>{fmt(slab.impot)}</div>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: 'var(--text-em)' }}>Total</div>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: GOLD, borderLeft: '1px solid var(--card-dark-border)' }}>{res.effectiveRate.toFixed(1)}% eff.</div>
                <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 800, color: '#f87171', borderLeft: '1px solid var(--card-dark-border)' }}>{fmt(res.dmtg)}</div>
              </div>
            </div>
          )}

          {/* Abattements légaux référence */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-dark-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info style={{ width: 13, height: 13, color: 'var(--text-muted-c)' }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)' }}>Abattements légaux (tous les 15 ans)</p>
              </div>
            </div>
            {RELATIONSHIPS.map((r, i) => (
              <div key={r.value} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 14px',
                borderBottom: i < RELATIONSHIPS.length - 1 ? '1px solid var(--section-border)' : undefined,
                background: r.value === relationship ? `${GOLD}08` : undefined,
              }}>
                <span style={{ fontSize: 12, color: r.value === relationship ? 'var(--text-em)' : 'var(--text-muted-c)', fontWeight: r.value === relationship ? 600 : 400 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.value === relationship ? GOLD : 'var(--text-muted-c)' }}>{r.abattement}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — analyse + donut + conseils */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Donut répartition */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', marginBottom: 8 }}>Répartition du montant transmis</p>
            {/* Barre */}
            <div style={{ height: 12, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
              <div style={{ width: `${(res.netTransmitted / Math.max(amount, 1)) * 100}%`, background: 'linear-gradient(90deg, #4ade8099, #4ade80)', transition: 'width 0.5s ease' }} />
              <div style={{ flex: 1, background: '#f8717166' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4ade80' }}>{fmt(res.netTransmitted)} net ({(100 - res.effectiveRate).toFixed(1)}%)</span>
              <span style={{ color: '#f87171' }}>{fmt(res.dmtg)} droits</span>
            </div>
            {/* Mini donut */}
            {donutData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <PieChart width={120} height={120}>
                  <Pie data={donutData} cx={56} cy={56} innerRadius={32} outerRadius={54} dataKey="value" strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                  </Pie>
                </PieChart>
              </div>
            )}
          </div>

          {/* Optimisation conseil */}
          <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <RefreshCw style={{ width: 14, height: 14, color: GOLD, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Optimisation : renouvellement tous les 15 ans</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.6 }}>
                  L&apos;abattement de <strong style={{ color: 'var(--text-em)' }}>{fmt(res.abattementMax)}</strong> par bénéficiaire se renouvelle tous les 15 ans.
                  En anticipant les donations par tranches, vous pouvez transmettre <strong style={{ color: 'var(--text-em)' }}>200 000 €</strong> à un enfant sans droit sur 30 ans.
                  {isDonation && res.abattementRemaining > 0 && (
                    <span> Vous disposez encore de <strong style={{ color: GOLD }}>{fmt(res.abattementRemaining)}</strong> d&apos;abattement disponible.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Conseils généraux */}
          <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Conseils patrimoniaux</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { color: COLOR, text: 'Commencez à donner tôt — l\'abattement de 100 000€ par enfant se renouvelle tous les 15 ans.' },
                { color: '#fb923c', text: 'L\'assurance-vie permet de transmettre hors succession jusqu\'à 152 500€ par bénéficiaire.' },
                { color: '#4ade80', text: 'Le démembrement de propriété (usufruit/nue-propriété) réduit l\'assiette taxable.' },
                { color: '#818cf8', text: 'Le conjoint survivant est totalement exonéré de droits de succession depuis 2007.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <ArrowRight style={{ width: 11, height: 11, color: item.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted-c)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
