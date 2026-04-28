'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Info } from 'lucide-react'
import { type Envelope, fmtEur } from '@/components/patrimoine/types'

export function CashSection({ envelope, onSave }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
}) {
  const { toast } = useToast()
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [monthlyExpenses, setMonthlyExpenses] = useState(String(meta.monthlyExpenses ?? ''))
  const [saving, setSaving] = useState(false)

  const balanceNum = parseFloat(balance) || 0
  const expNum = parseFloat(monthlyExpenses) || 0
  const monthsOfExpenses = expNum > 0 ? balanceNum / expNum : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ balance: balanceNum, monthlyExpenses: expNum })
      toast({ title: 'Liquidités mises à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{ padding: '20px 24px', borderRadius: 14, background: '#94a3b812', border: '1.5px solid #94a3b830' }}>
          <Info style={{ width: 16, height: 16, color: '#94a3b8', marginRight: 8, display: 'inline' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>Première saisie — Renseignez vos liquidités</span>
        </div>
      )}
      <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Solde disponible (€)</Label>
              <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="5 000" />
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Dépenses mensuelles (€) — optionnel</Label>
              <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} placeholder="2 500" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}</Button>
        </CardContent>
      </Card>
      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Liquidités disponibles', value: fmtEur(balanceNum), color: '#94a3b8' },
            ...(monthsOfExpenses !== null ? [{
              label: 'Mois de dépenses',
              value: `${monthsOfExpenses.toFixed(1)} mois`,
              color: monthsOfExpenses >= 3 ? '#34d399' : '#f59e0b',
              sub: monthsOfExpenses >= 3 ? '✅ Épargne de précaution suffisante' : '⚠️ Moins de 3 mois recommandés',
            }] : []),
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
