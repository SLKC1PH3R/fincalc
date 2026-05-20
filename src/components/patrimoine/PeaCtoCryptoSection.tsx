'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { PositionsTable } from '@/components/Patrimoine/PositionsTable'
import { EtfOptimizerSection } from '@/components/Patrimoine/EtfOptimizerSection'
import {
  type Envelope, type Position, type PriceData,
  PEA_MAX, fmtCompact,
} from '@/components/Patrimoine/types'
import { TransactionJournal } from '@/components/TransactionJournal'

export function PeaCtoCryptoSection({
  envelope, prices, pricesLoading,
  onRefreshPrices, onSave, onReload, isCrypto = false, cacheAge,
}: {
  envelope: Envelope
  prices: Record<string, PriceData>
  pricesLoading: boolean
  onRefreshPrices: () => void
  onSave: (m: Record<string, unknown>) => Promise<void>
  onReload: () => void
  isCrypto?: boolean
  cacheAge?: number | null
}) {
  const { toast } = useToast()
  const positions: Position[] = envelope.positions
  const meta = envelope.metadata
  const isPEA = envelope.type === 'PEA'
  const depositedNum = Number(meta.totalDeposited ?? 0)
  const peaPct = isPEA && depositedNum > 0 ? Math.min(100, (depositedNum / PEA_MAX) * 100) : null

  const [depositInput, setDepositInput] = useState(String(meta.totalDeposited ?? ''))
  const [openedYear, setOpenedYear] = useState(String(meta.openedYear ?? ''))
  const [savingMeta, setSavingMeta] = useState(false)

  const totalMarketValue = useMemo(() => {
    if (envelope.totalValue != null) return envelope.totalValue
    return positions.reduce((s, p) => {
      const pd = prices[p.symbol]
      return s + (pd ? pd.priceEur * p.quantity : p.pru * p.quantity)
    }, 0)
  }, [envelope, positions, prices])

  const totalInvested = useMemo(() => {
    return positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  }, [positions])

  const perf = totalInvested > 0 ? ((totalMarketValue - totalInvested) / totalInvested) * 100 : 0
  const perfAbs = totalMarketValue - totalInvested

  const saveMeta = async () => {
    setSavingMeta(true)
    try {
      await onSave({ ...meta, totalDeposited: parseFloat(depositInput) || 0, openedYear: parseInt(openedYear) || 0 })
      toast({ title: 'Informations mises à jour' })
    } catch { toast({ title: 'Erreur', variant: 'destructive' }) }
    finally { setSavingMeta(false) }
  }

  return (
    <div className="space-y-4">
      {/* Méta PEA */}
      {isPEA && (
        <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
          <CardContent style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text)', marginBottom: 12 }}>Informations PEA</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Versements effectués (€)</Label>
                <Input type="number" value={depositInput} onChange={e => setDepositInput(e.target.value)} placeholder="50 000" style={{ width: 180 }} />
              </div>
              <div>
                <Label style={{ marginBottom: 6, display: 'block' }}>Année d'ouverture</Label>
                <Input type="number" value={openedYear} onChange={e => setOpenedYear(e.target.value)} placeholder="2020" style={{ width: 120 }} />
              </div>
              <Button onClick={saveMeta} disabled={savingMeta} variant="outline" size="sm" style={{ marginBottom: 1 }}>
                {savingMeta ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </div>
            {depositedNum > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>Plafond de versements</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{peaPct?.toFixed(1)} %</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--p-line)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${peaPct ?? 0}%`, background: '#818cf8', borderRadius: 999, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>{fmtCompact(depositedNum)} versés</span>
                  <span style={{ fontSize: 11, color: 'var(--p-text-faint)' }}>Plafond : 150 000 € — Reste {fmtCompact(Math.max(0, PEA_MAX - depositedNum))}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPIs performances */}
      {positions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            { label: 'Valeur de marché', value: fmtCompact(totalMarketValue), color: '#f97316', sub: pricesLoading ? 'Mise à jour…' : 'Prix temps réel' },
            { label: 'Investi (PRU)', value: fmtCompact(totalInvested), color: '#818cf8' },
            { label: 'Performance', value: `${perf >= 0 ? '+' : ''}${perf.toFixed(2)} %`, color: perf >= 0 ? '#34d399' : '#ef4444', sub: `${perfAbs >= 0 ? '+' : ''}${fmtCompact(perfAbs)}` },
            { label: 'Nb positions', value: String(positions.length), color: '#38bdf8' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--p-card)', border: '1px solid var(--p-line)' }}>
              <div style={{ fontSize: 11, color: 'var(--p-text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: 'var(--p-text-dim)', marginTop: 4 }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Tableau positions */}
      <PositionsTable
        envelope={envelope}
        positions={positions}
        prices={prices}
        pricesLoading={pricesLoading}
        isCrypto={isCrypto}
        onRefreshPrices={onRefreshPrices}
        onReload={onReload}
        cacheAge={cacheAge}
      />

      {/* Optimisation ETF */}
      {!isCrypto && positions.filter(p => p.assetType === 'ETF').length > 0 && (
        <EtfOptimizerSection positions={positions} prices={prices} />
      )}

      {/* Journal de transactions */}
      <TransactionJournal envelopeId={envelope.id} title="Journal de transactions" />
    </div>
  )
}
