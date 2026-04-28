'use client'
import { useEffect, useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Camera, Loader2 } from 'lucide-react'

const GOLD = '#B07820'

interface Snapshot { id: string; date: string; totalValue: number }
interface ChartPoint { label: string; value: number }

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k€`
  return `${Math.round(n).toLocaleString('fr-FR')} €`
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function fmtFull(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`
}

export function PatrimoineHistoryChart() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/patrimoine/snapshots?days=365')
      if (r.ok) setSnapshots(await r.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saveSnapshot = async () => {
    setSaving(true)
    try {
      const envRes = await fetch('/api/patrimoine/envelopes')
      if (!envRes.ok) return
      const envelopes: Record<string, unknown>[] = await envRes.json()

      const byEnvelope: Record<string, { value: number; type: string; name: string }> = {}
      let totalValue = 0

      for (const env of envelopes) {
        const meta = env.metadata as Record<string, number> | null
        let val = 0
        if (env.type === 'IMMOBILIER') {
          val = Number(meta?.currentValue ?? 0)
        } else {
          const tv = env.totalValue as number | null
          const pos = env.positions as { pru: number; quantity: number }[] | undefined
          val = tv !== null && tv !== undefined ? tv : (pos ?? []).reduce((s, p) => s + p.pru * p.quantity, 0)
        }
        byEnvelope[env.id as string] = { value: val, type: env.type as string, name: env.name as string }
        totalValue += val
      }

      const res = await fetch('/api/patrimoine/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalValue, byEnvelope }),
      })
      if (res.ok) {
        setSavedMsg('Snapshot enregistré ✓')
        setTimeout(() => setSavedMsg(null), 3000)
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const chartData: ChartPoint[] = snapshots.map(s => ({
    label: fmtDateShort(s.date),
    value: s.totalValue,
  }))

  const first = snapshots[0]?.totalValue
  const last = snapshots[snapshots.length - 1]?.totalValue
  const delta = first && last && snapshots.length > 1 ? ((last - first) / first) * 100 : null
  const isUp = delta !== null && delta >= 0

  return (
    <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 16, padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: 'var(--p-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 6 }}>
            Évolution patrimoniale
          </p>
          {snapshots.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 700, color: GOLD, fontFamily: 'Geist Mono, monospace', letterSpacing: '-0.025em' }}>
                {fmtFull(last ?? 0)}
              </span>
              {delta !== null && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: isUp ? '#34d399' : '#f87171', background: isUp ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${isUp ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`, borderRadius: 8, padding: '2px 8px' }}>
                  {isUp ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
                  {isUp ? '+' : ''}{delta.toFixed(1)}%
                  <span style={{ fontWeight: 400, color: 'var(--p-text-faint)', fontSize: 11 }}>
                    sur {snapshots.length > 1 ? `${snapshots.length} points` : '1 point'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={saveSnapshot}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            border: `1px solid ${savedMsg ? 'rgba(52,211,153,0.35)' : `${GOLD}35`}`,
            background: savedMsg ? 'rgba(52,211,153,0.08)' : `${GOLD}0d`,
            color: savedMsg ? '#34d399' : GOLD,
            transition: 'all 0.2s',
          }}>
          {saving
            ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />
            : <Camera style={{ width: 12, height: 12 }} />}
          {savedMsg ?? 'Enregistrer snapshot'}
        </button>
      </div>

      {/* Chart or empty state */}
      {snapshots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--p-text-dim)' }}>
          <Camera style={{ width: 28, height: 28, margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Aucun historique</p>
          <p style={{ fontSize: 12, color: 'var(--p-text-faint)', marginTop: 4 }}>
            Enregistrez votre premier snapshot pour démarrer la courbe d&apos;évolution.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="snapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--p-text-faint)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
              formatter={(v: unknown) => [fmtFull(Number(v)), 'Patrimoine net']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#snapGradient)"
              dot={{ fill: GOLD, strokeWidth: 0, r: 3 }}
              activeDot={{ fill: GOLD, stroke: `${GOLD}40`, strokeWidth: 4, r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
