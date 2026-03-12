'use client'
import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useChartTheme } from '@/lib/chart-theme'
import { ChevronRight } from 'lucide-react'
import { type Envelope, fmtEur, fmtCompact } from '@/components/patrimoine/types'

const PROPERTY_TYPES = [
  { id: 'residence-principale', label: 'Résidence principale' },
  { id: 'residence-secondaire', label: 'Résidence secondaire' },
  { id: 'locatif',              label: 'Bien locatif' },
  { id: 'commercial',           label: 'Local commercial' },
  { id: 'parking',              label: 'Parking / Garage' },
] as const

function ToggleSwitch({ on, color, onChange }: { on: boolean; color: string; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: on ? color : 'var(--section-border)',
        transition: 'background 0.2s', position: 'relative', flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, transition: 'left 0.2s',
        left: on ? 18 : 3,
      }} />
    </button>
  )
}

export function ImmobilierSection({ envelope, onSave, chartTheme }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
  chartTheme: ReturnType<typeof useChartTheme>
}) {
  const { toast } = useToast()
  const meta = envelope.metadata
  const savedSubType = meta.subType as 'physique' | 'scpi' | undefined
  const hasLegacyData = !savedSubType && Boolean(meta.purchasePrice || meta.currentValue || meta.address)

  const [subType, setSubType] = useState<'physique' | 'scpi' | null>(
    savedSubType ?? (hasLegacyData ? 'physique' : null)
  )

  const [form, setForm] = useState({
    propertyType: String(meta.propertyType ?? 'residence-principale'),
    country: String(meta.country ?? 'france'),
    address: String(meta.address ?? ''),
    surface: String(meta.surface ?? ''),
    purchaseYear: String(meta.purchaseYear ?? ''),
    purchasePrice: String(meta.purchasePrice ?? ''),
    currentValue: String(meta.currentValue ?? ''),
    hasCredit: Boolean(meta.hasCredit ?? false),
    creditRemaining: String(meta.creditRemaining ?? ''),
    creditRate: String(meta.creditRate ?? ''),
    creditMonthly: String(meta.creditMonthly ?? ''),
    creditEndYear: String(meta.creditEndYear ?? ''),
    isRental: Boolean(meta.isRental ?? false),
    monthlyRent: String(meta.monthlyRent ?? ''),
  })

  const [scpiForm, setScpiForm] = useState({
    scpiName: String(meta.scpiName ?? ''),
    purchasePrice: String(meta.subType === 'scpi' ? (meta.purchasePrice ?? '') : ''),
    currentValue: String(meta.subType === 'scpi' ? (meta.currentValue ?? '') : ''),
    annualYield: String(meta.annualYield ?? ''),
    entryFees: String(meta.entryFees ?? ''),
  })

  const [saving, setSaving] = useState(false)

  const f  = (k: keyof typeof form)     => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const sf = (k: keyof typeof scpiForm) => (e: React.ChangeEvent<HTMLInputElement>) => setScpiForm(p => ({ ...p, [k]: e.target.value }))

  const currentValue    = parseFloat(form.currentValue) || 0
  const purchasePrice   = parseFloat(form.purchasePrice) || 0
  const creditRemaining = form.hasCredit ? (parseFloat(form.creditRemaining) || 0) : 0
  const netEquity       = Math.max(0, currentValue - creditRemaining)
  const latentGain      = currentValue - purchasePrice
  const ltv             = currentValue > 0 && creditRemaining > 0 ? (creditRemaining / currentValue) * 100 : 0

  const equityData = useMemo(() => {
    if (!currentValue || !form.hasCredit) return []
    const years = parseInt(form.creditEndYear) - new Date().getFullYear()
    if (years <= 0) return []
    const monthly = parseFloat(form.creditMonthly) || 0
    const rate    = parseFloat(form.creditRate) / 100 / 12 || 0
    let remaining = creditRemaining
    return Array.from({ length: Math.min(years + 1, 31) }, (_, i) => {
      const eq = Math.max(0, currentValue * Math.pow(1.02, i) - remaining)
      const r  = remaining
      remaining = Math.max(0, remaining - monthly * 12 + remaining * rate * 12)
      return { year: new Date().getFullYear() + i, equity: Math.round(eq), credit: Math.round(r) }
    })
  }, [currentValue, creditRemaining, form])

  const handleSavePhysique = async () => {
    setSaving(true)
    try {
      await onSave({
        subType: 'physique',
        propertyType: form.propertyType,
        country: form.country,
        address: form.address, surface: parseFloat(form.surface) || 0,
        purchaseYear: parseInt(form.purchaseYear) || 0, purchasePrice,
        currentValue, hasCredit: form.hasCredit,
        creditRemaining, creditRate: parseFloat(form.creditRate) || 0,
        creditMonthly: parseFloat(form.creditMonthly) || 0,
        creditEndYear: parseInt(form.creditEndYear) || 0,
        isRental: form.isRental, monthlyRent: parseFloat(form.monthlyRent) || 0,
      })
      toast({ title: 'Bien immobilier mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleSaveScpi = async () => {
    setSaving(true)
    try {
      await onSave({
        subType: 'scpi',
        scpiName: scpiForm.scpiName,
        purchasePrice: parseFloat(scpiForm.purchasePrice) || 0,
        currentValue: parseFloat(scpiForm.currentValue) || 0,
        annualYield: parseFloat(scpiForm.annualYield) || 0,
        entryFees: parseFloat(scpiForm.entryFees) || 0,
      })
      toast({ title: 'SCPI mise à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  if (!subType) {
    return (
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
          Quel type de bien immobilier souhaitez-vous ajouter ?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {([
            { key: 'physique' as const, title: 'Immobilier physique', desc: 'Résidence principale, secondaire, immobilier locatif, locaux commerciaux, parking', color: '#f472b6' },
            { key: 'scpi'    as const, title: 'SCPI',                 desc: 'Parts de SCPI avec suivi de rendement, valorisation et revenus distribués',          color: '#818cf8' },
          ]).map(card => (
            <button
              key={card.key}
              onClick={() => setSubType(card.key)}
              style={{
                textAlign: 'left', padding: 24, borderRadius: 16, cursor: 'pointer',
                background: 'var(--card-dark)', border: `1.5px solid ${card.color}30`,
                transition: 'border-color 0.2s, background 0.2s',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = card.color; e.currentTarget.style.background = `${card.color}0a` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${card.color}30`; e.currentTarget.style.background = 'var(--card-dark)' }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{card.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-subtle)', lineHeight: 1.6, flex: 1 }}>{card.desc}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${card.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight style={{ width: 14, height: 14, color: card.color }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (subType === 'scpi') {
    const scpiCurrentValue  = parseFloat(scpiForm.currentValue) || 0
    const scpiPurchasePrice = parseFloat(scpiForm.purchasePrice) || 0
    const scpiYield         = parseFloat(scpiForm.annualYield) || 0
    const scpiGain          = scpiCurrentValue - scpiPurchasePrice
    const isSetup           = meta.subType === 'scpi'

    return (
      <div className="space-y-4">
        <button onClick={() => setSubType(null)} style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
          ← Changer de type
        </button>

        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Informations SCPI</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ marginBottom: 6, display: 'block' }}>Nom de la SCPI</Label>
                <Input value={scpiForm.scpiName} onChange={sf('scpiName')} placeholder="Corum Origin, Immorente, Épargne Foncière…" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Montant investi (€)</Label>
                <Input type="number" value={scpiForm.purchasePrice} onChange={sf('purchasePrice')} placeholder="10 000" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Valeur actuelle (€)</Label>
                <Input type="number" value={scpiForm.currentValue} onChange={sf('currentValue')} placeholder="11 000" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Rendement annuel distribué (%)</Label>
                <Input type="number" value={scpiForm.annualYield} onChange={sf('annualYield')} placeholder="5.5" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Frais d'entrée (%)</Label>
                <Input type="number" value={scpiForm.entryFees} onChange={sf('entryFees')} placeholder="9.5" />
              </div>
            </div>
            <Button onClick={handleSaveScpi} disabled={saving}>
              {saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>

        {isSetup && scpiCurrentValue > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Valeur actuelle', value: fmtEur(scpiCurrentValue), color: '#818cf8' },
              { label: 'Plus-value latente', value: `${scpiGain >= 0 ? '+' : ''}${fmtEur(scpiGain)}`, color: scpiGain >= 0 ? '#34d399' : '#ef4444', sub: scpiPurchasePrice > 0 ? `${((scpiGain / scpiPurchasePrice) * 100).toFixed(1)} %` : '' },
              ...(scpiYield > 0 ? [
                { label: 'Revenu annuel estimé', value: fmtEur(scpiCurrentValue * scpiYield / 100), color: '#38bdf8', sub: `${scpiYield} % brut` },
                { label: 'Revenu mensuel estimé', value: fmtEur(scpiCurrentValue * scpiYield / 100 / 12), color: '#34d399' },
              ] : []),
            ].map(kpi => (
              <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Immobilier physique
  const isSetup = Boolean(meta.purchasePrice || meta.currentValue || meta.address)

  return (
    <div className="space-y-4">
      <button onClick={() => setSubType(null)} style={{ fontSize: 12, color: 'var(--text-subtle)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        ← Changer de type
      </button>

      <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Type de bien</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {PROPERTY_TYPES.map(pt => (
              <button
                key={pt.id}
                onClick={() => setForm(p => ({ ...p, propertyType: pt.id }))}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${form.propertyType === pt.id ? '#f472b6' : 'var(--card-dark-border)'}`,
                  background: form.propertyType === pt.id ? '#f472b620' : 'transparent',
                  color: form.propertyType === pt.id ? '#f472b6' : 'var(--text-muted-c)',
                  transition: 'all 0.15s',
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Informations du bien</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label style={{ marginBottom: 6, display: 'block' }}>Localisation <span style={{ fontWeight: 400, color: 'var(--text-subtle)', fontSize: 11 }}>Pour la carte géographique</span></Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { id: 'france',          label: '🇫🇷 France' },
                  { id: 'europe',          label: '🇪🇺 Europe (autre)' },
                  { id: 'northAmerica',    label: '🌎 Amérique du Nord' },
                  { id: 'asiaPacific',     label: '🌏 Asie-Océanie' },
                  { id: 'emergingMarkets', label: '🌍 Marchés émergents' },
                  { id: 'other',           label: '🌐 Autre' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setForm(p => ({ ...p, country: opt.id }))}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: `1.5px solid ${form.country === opt.id ? '#f472b6' : 'var(--card-dark-border)'}`,
                      background: form.country === opt.id ? '#f472b620' : 'transparent',
                      color: form.country === opt.id ? '#f472b6' : 'var(--text-muted-c)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label style={{ marginBottom: 6, display: 'block' }}>Adresse <span style={{ fontWeight: 400, color: 'var(--text-subtle)', fontSize: 11 }}>Optionnel</span></Label>
              <Input value={form.address} onChange={f('address')} placeholder="12 rue de la Paix, Paris 75001" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Surface (m²)</Label>
              <Input type="number" value={form.surface} onChange={f('surface')} placeholder="75" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Année d'achat</Label>
              <Input type="number" value={form.purchaseYear} onChange={f('purchaseYear')} placeholder="2020" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Prix d'achat (€)</Label>
              <Input type="number" value={form.purchasePrice} onChange={f('purchasePrice')} placeholder="200 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur actuelle estimée (€)</Label>
              <Input type="number" value={form.currentValue} onChange={f('currentValue')} placeholder="250 000" />
            </div>
          </div>

          {(form.propertyType === 'locatif' || form.isRental) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.isRental ? 12 : 16 }}>
                <ToggleSwitch on={form.isRental} color="#f472b6" onChange={() => setForm(p => ({ ...p, isRental: !p.isRental }))} />
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Bien locatif</span>
              </div>
              {form.isRental && (
                <div style={{ marginBottom: 16 }}>
                  <Label style={{ marginBottom: 6, display: 'block' }}>Loyer mensuel perçu (€)</Label>
                  <Input type="number" value={form.monthlyRent} onChange={f('monthlyRent')} placeholder="800" style={{ maxWidth: 200 }} />
                </div>
              )}
            </>
          )}

          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 12px' }}>Crédit immobilier</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.hasCredit ? 16 : 0 }}>
            <ToggleSwitch on={form.hasCredit} color="#818cf8" onChange={() => setForm(p => ({ ...p, hasCredit: !p.hasCredit }))} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>J'ai un crédit en cours</span>
          </div>
          {form.hasCredit && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Capital restant dû (€)</Label>
                <Input type="number" value={form.creditRemaining} onChange={f('creditRemaining')} placeholder="150 000" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Taux annuel (%)</Label>
                <Input type="number" value={form.creditRate} onChange={f('creditRate')} placeholder="1.5" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Mensualité (€)</Label>
                <Input type="number" value={form.creditMonthly} onChange={f('creditMonthly')} placeholder="800" />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Année de fin du crédit</Label>
                <Input type="number" value={form.creditEndYear} onChange={f('creditEndYear')} placeholder="2040" />
              </div>
            </div>
          )}

          <Button onClick={handleSavePhysique} disabled={saving}>
            {saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>

      {isSetup && currentValue > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur du bien', value: fmtEur(currentValue), color: '#f472b6' },
            { label: 'Patrimoine net', value: fmtEur(netEquity), color: '#34d399', sub: form.hasCredit ? `Après crédit (${fmtEur(creditRemaining)})` : 'Valeur libre' },
            { label: 'Plus-value latente', value: `${latentGain >= 0 ? '+' : ''}${fmtEur(latentGain)}`, color: latentGain >= 0 ? '#34d399' : '#ef4444', sub: purchasePrice > 0 ? `${((latentGain / purchasePrice) * 100).toFixed(1)} %` : '' },
            ...(form.hasCredit && ltv > 0 ? [{ label: 'LTV (dette/valeur)', value: `${ltv.toFixed(1)} %`, color: ltv > 80 ? '#f59e0b' : '#818cf8', sub: ltv > 80 ? 'LTV élevé' : 'LTV sain' }] : []),
            ...(form.isRental && parseFloat(form.monthlyRent) > 0 ? [{
              label: 'Rendement brut',
              value: `${((parseFloat(form.monthlyRent) * 12 / currentValue) * 100).toFixed(2)} %`,
              color: '#38bdf8', sub: `${fmtEur(parseFloat(form.monthlyRent) * 12)} / an`,
            }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {isSetup && equityData.length > 0 && (
        <Card style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
              Évolution du patrimoine net (projection)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartTheme.tick }} />
                <YAxis tickFormatter={v => fmtCompact(v)} tick={{ fontSize: 11, fill: chartTheme.tick }} width={70} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmtEur(v), name === 'equity' ? 'Patrimoine net' : 'Capital restant dû']}
                  contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 12, color: chartTheme.tooltip.color }}
                  itemStyle={chartTheme.itemStyle}
                />
                <Area type="monotone" dataKey="equity" stroke="#34d399" fill="#34d39918" name="equity" strokeWidth={2} />
                <Area type="monotone" dataKey="credit" stroke="#f472b6" fill="#f472b612" name="credit" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
