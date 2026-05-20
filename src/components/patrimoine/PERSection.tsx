'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Info } from 'lucide-react'
import { type Envelope, fmtEur } from '@/components/Patrimoine/types'

export function PERSection({ envelope, onSave }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
}) {
  const { toast } = useToast()
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [tmi, setTmi] = useState(String(meta.tmi ?? '30'))
  const [annualContrib, setAnnualContrib] = useState(String(meta.annualContrib ?? ''))
  const [saving, setSaving] = useState(false)

  const balanceNum = parseFloat(balance) || 0
  const tmiNum = parseFloat(tmi) || 30
  const contribNum = parseFloat(annualContrib) || 0
  const taxSaving = contribNum * (tmiNum / 100)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ balance: balanceNum, tmi: tmiNum, annualContrib: contribNum })
      toast({ title: 'PER mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#a78bfa12', border: '1.5px solid #a78bfa30' }}>
          <Info style={{ width: 16, height: 16, color: '#a78bfa', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>Première saisie — Renseignez votre Plan d'Épargne Retraite</span>
        </div>
      )}
      <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Valeur du PER (€)</Label>
              <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="20 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>TMI (%)</Label>
              <Select value={tmi} onValueChange={setTmi}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['11', '30', '41', '45'].map(t => <SelectItem key={t} value={t}>{t} %</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Versement annuel (€)</Label>
              <Input type="number" value={annualContrib} onChange={e => setAnnualContrib(e.target.value)} placeholder="3 000" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur du PER', value: fmtEur(balanceNum), color: '#a78bfa' },
            { label: 'TMI actuelle', value: `${tmiNum} %`, color: '#f97316' },
            ...(contribNum > 0 ? [{ label: 'Économie fiscale', value: fmtEur(taxSaving), color: '#34d399', sub: `pour ${fmtEur(contribNum)} versés` }] : []),
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
