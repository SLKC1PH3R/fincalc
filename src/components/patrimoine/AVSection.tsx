'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Info } from 'lucide-react'
import { type Envelope, fmtEur } from '@/components/patrimoine/types'

export function AVSection({ envelope, onSave }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
}) {
  const { toast } = useToast()
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [form, setForm] = useState({
    insurer: String(meta.insurer ?? ''),
    contractName: String(meta.contractName ?? ''),
    surrenderValue: String(meta.surrenderValue ?? ''),
    grossValue: String(meta.grossValue ?? ''),
    openedYear: String(meta.openedYear ?? ''),
    unitLinked: Boolean(meta.unitLinked ?? false),
  })
  const [saving, setSaving] = useState(false)
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  const surrenderVal = parseFloat(form.surrenderValue) || 0
  const grossVal = parseFloat(form.grossValue) || surrenderVal
  const openedYearNum = parseInt(form.openedYear) || 0
  const ageYears = openedYearNum > 0 ? new Date().getFullYear() - openedYearNum : 0
  const isFiscalOptimal = ageYears >= 8

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ insurer: form.insurer, contractName: form.contractName, surrenderValue: surrenderVal, grossValue: grossVal, openedYear: openedYearNum, unitLinked: form.unitLinked })
      toast({ title: 'Assurance Vie mise à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#fb923c12', border: '1.5px solid #fb923c30' }}>
          <Info style={{ width: 16, height: 16, color: '#fb923c', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>Première saisie — Renseignez votre contrat AV</span>
        </div>
      )}
      <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Assureur</Label>
              <Input value={form.insurer} onChange={f('insurer')} placeholder="ex: Linxea, Boursorama, Spirica" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Nom du contrat</Label>
              <Input value={form.contractName} onChange={f('contractName')} placeholder="ex: Linxea Spirit 2" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur de rachat (€)</Label>
              <Input type="number" value={form.surrenderValue} onChange={f('surrenderValue')} placeholder="30 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur brute (€)</Label>
              <Input type="number" value={form.grossValue} onChange={f('grossValue')} placeholder="32 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Année d'ouverture</Label>
              <Input type="number" value={form.openedYear} onChange={f('openedYear')} placeholder="2018" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && surrenderVal > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur de rachat', value: fmtEur(surrenderVal), color: '#fb923c' },
            ...(grossVal > surrenderVal ? [{ label: 'Plus-value latente', value: fmtEur(grossVal - surrenderVal), color: '#34d399' }] : []),
            ...(ageYears > 0 ? [{ label: 'Ancienneté', value: `${ageYears} ans`, color: '#818cf8', sub: isFiscalOptimal ? '✅ Fiscalité optimale (+8 ans)' : `⚠️ ${8 - ageYears} ans avant abattement` }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
              <div style={{ fontSize: 11, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
