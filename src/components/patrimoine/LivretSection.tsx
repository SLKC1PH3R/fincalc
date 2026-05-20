'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Info, AlertTriangle } from 'lucide-react'
import { type Envelope, LIVRET_CONFIG, fmtEur } from '@/components/Patrimoine/types'

export function LivretSection({ envelope, onSave }: {
  envelope: Envelope
  onSave: (m: Record<string, unknown>) => Promise<void>
}) {
  const { toast } = useToast()
  const meta = envelope.metadata
  const isSetup = Object.keys(meta).length > 0

  const [livretType, setLivretType] = useState(String(meta.livretType ?? 'LIVRET_A'))
  const [balance, setBalance] = useState(String(meta.balance ?? ''))
  const [saving, setSaving] = useState(false)

  const livretCfg = LIVRET_CONFIG[livretType] ?? LIVRET_CONFIG.LIVRET_A
  const balanceNum = parseFloat(balance) || 0
  const maxBalance = livretCfg.maxBalance
  const rate = livretCfg.rate
  const projectedInterest = balanceNum * (rate / 100)
  const pct = maxBalance ? Math.min(100, (balanceNum / maxBalance) * 100) : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ livretType, balance: balanceNum, maxBalance, rate })
      toast({ title: 'Livret mis à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      {!isSetup && (
        <div style={{
          padding: '20px 24px', borderRadius: 14,
          background: '#34d39912', border: '1.5px solid #34d39930',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Info style={{ width: 16, height: 16, color: '#34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)' }}>Première saisie</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--p-text-faint)', margin: 0 }}>
            Renseignez les informations de votre livret pour commencer à le suivre.
          </p>
        </div>
      )}

      <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
        <CardContent style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Type de livret</Label>
              <Select value={livretType} onValueChange={setLivretType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIVRET_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ marginBottom: 6, display: 'block' }}>Solde actuel (€)</Label>
              <Input
                type="number"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="ex : 8 500"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || !balance}>
            {saving ? 'Enregistrement…' : isSetup ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </CardContent>
      </Card>

      {isSetup && balanceNum > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { label: 'Solde', value: fmtEur(balanceNum), color: '#34d399' },
            { label: 'Taux en cours', value: `${rate} %`, color: '#f97316', sub: 'Taux réglementé' },
            { label: 'Intérêts annuels estimés', value: fmtEur(projectedInterest), color: '#818cf8' },
            ...(maxBalance ? [{ label: 'Plafond légal', value: fmtEur(maxBalance), color: '#94a3b8', sub: `Reste ${fmtEur(Math.max(0, maxBalance - balanceNum))}` }] : []),
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
              <div style={{ fontSize: 11, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {pct !== null && balanceNum > 0 && (
        <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>Utilisation du plafond</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{pct.toFixed(1)} %</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--p-line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#f59e0b' : '#34d399', borderRadius: 999, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{fmtEur(balanceNum)}</span>
              <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Plafond : {fmtEur(maxBalance!)}</span>
            </div>
            {pct >= 90 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f59e0b' }}>
                <AlertTriangle style={{ width: 14, height: 14 }} />
                Plafond presque atteint — pensez à verser sur un autre livret.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
