'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, TrendingUp, Flame, Receipt, Home, Building2, Clock, ExternalLink, GitCompare, X, CheckSquare, Square } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, unknown>; results: Record<string, unknown>; createdAt: string
}

const TYPE_CONFIG: Record<string, { label: string; Icon: any; href: string }> = {
  compound:   { label: 'Intérêts Composés',    Icon: TrendingUp, href: '/dashboard/compound' },
  dca:        { label: 'DCA',                   Icon: TrendingUp, href: '/dashboard/dca' },
  fire:       { label: 'FI/RE',                 Icon: Flame,      href: '/dashboard/fire' },
  tax:        { label: 'Impôts',                Icon: Receipt,    href: '/dashboard/tax' },
  buyrent:    { label: 'Acheter vs Louer',      Icon: Home,       href: '/dashboard/buyrent' },
  mortgage:   { label: 'Prêt Immobilier',       Icon: Building2,  href: '/dashboard/mortgage' },
  rental:     { label: 'Rentabilité Locative',  Icon: Building2,  href: '/dashboard/rental' },
  retirement: { label: 'Retraite',              Icon: TrendingUp, href: '/dashboard/retirement' },
  budget:     { label: 'Budget 50/30/20',       Icon: TrendingUp, href: '/dashboard/budget' },
}

const COMPARE_FIELDS: Record<string, { label: string; key: string; format?: (v: any) => string }[]> = {
  compound:   [{ label: 'Capital final', key: 'final', format: fmt }, { label: 'Intérêts', key: 'interest', format: fmt }, { label: 'Multiplication', key: 'multiplier', format: v => `×${Number(v).toFixed(1)}` }],
  fire:       [{ label: 'Patrimoine cible', key: 'target', format: fmt }, { label: 'Années avant FIRE', key: 'yearsToFire', format: v => `${v} ans` }, { label: "Taux d'épargne", key: 'savingsRate', format: v => `${Number(v).toFixed(1)}%` }],
  tax:        [{ label: 'Net après tout', key: 'netIncome', format: fmt }, { label: 'Impôt IR', key: 'ir', format: fmt }, { label: 'Pression fiscale', key: 'effectivePressure', format: v => `${Number(v).toFixed(1)}%` }],
  buyrent:    [{ label: 'Patrimoine achat', key: 'buyNetWorth', format: fmt }, { label: 'Capital location', key: 'rentCapital', format: fmt }, { label: 'Seuil rentabilité', key: 'breakevenYears', format: v => `${v} ans` }],
  mortgage:   [{ label: 'Mensualité totale', key: 'totalMonthly', format: fmt }, { label: 'Intérêts totaux', key: 'totalInterest', format: fmt }, { label: 'TAEG', key: 'taeg', format: v => `${Number(v).toFixed(2)}%` }],
  rental:     [{ label: 'Cashflow mensuel', key: 'cashflowMonthly', format: fmt }, { label: 'Rendement net', key: 'netYield', format: v => `${Number(v).toFixed(2)}%` }, { label: 'ROI', key: 'roi', format: v => `${Number(v).toFixed(1)}%` }],
  retirement: [{ label: 'Revenu retraite', key: 'totalIncome', format: v => `${fmt(v)}/mois` }, { label: 'Taux remplacement', key: 'replacementRate', format: v => `${Number(v).toFixed(1)}%` }],
  budget:     [{ label: 'Épargne', key: 'savingsPct', format: v => `${Number(v).toFixed(1)}%` }, { label: 'Besoins', key: 'needsPct', format: v => `${Number(v).toFixed(1)}%` }, { label: 'Solde', key: 'balance', format: fmt }],
  dca:        [{ label: 'Valeur estimée', key: 'estimatedValue', format: fmt }, { label: 'Gain', key: 'gain', format: fmt }, { label: 'Gain %', key: 'gainPct', format: v => `${Number(v).toFixed(1)}%` }],
}

function ComparePanel({ sims, onClose }: { sims: [Simulation, Simulation]; onClose: () => void }) {
  const fields = COMPARE_FIELDS[sims[0].type] ?? []
  const config = TYPE_CONFIG[sims[0].type] ?? TYPE_CONFIG.compound

  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ border: '1px solid rgba(241,192,134,0.20)', background: 'rgba(241,192,134,0.05)' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(241,192,134,0.13)' }}>
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4" style={{ color: '#f1c086' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f1c086' }}>Comparaison — {config.label}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 py-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div />
          {sims.map((s, i) => (
            <div key={i} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        {fields.map((f, i) => {
          const v0 = sims[0].results[f.key]
          const v1 = sims[1].results[f.key]
          const n0 = typeof v0 === 'number' ? v0 : null
          const n1 = typeof v1 === 'number' ? v1 : null
          const better0 = n0 !== null && n1 !== null && n0 > n1
          const better1 = n0 !== null && n1 !== null && n1 > n0
          return (
            <div key={i} className="grid gap-4 py-2.5" style={{ gridTemplateColumns: '1fr 1fr 1fr', borderBottom: i < fields.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>{f.label}</p>
              {sims.map((s, si) => {
                const raw = s.results[f.key]
                const val = raw !== undefined ? (f.format ? f.format(raw) : String(raw)) : '—'
                const isBetter = si === 0 ? better0 : better1
                return (
                  <p key={si} style={{ fontSize: 14, fontWeight: 600, color: isBetter ? '#34d399' : '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {val}
                    {isBetter && <span style={{ fontSize: 10, color: '#34d399' }}>↑</span>}
                  </p>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SimCard({ sim, onDelete, selected, onSelect, selectMode }: { sim: Simulation; onDelete: () => void; selected: boolean; onSelect: () => void; selectMode: boolean }) {
  const router = useRouter()
  const config = TYPE_CONFIG[sim.type] || TYPE_CONFIG.compound
  const { Icon } = config
  const date = new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  const keyResults: { label: string; value: string }[] = []
  const r = sim.results
  if (sim.type === 'compound' && r.final)        keyResults.push({ label: 'Capital final', value: fmt(r.final as number) }, { label: 'Intérêts', value: fmt(r.interest as number) })
  if (sim.type === 'fire' && r.target)           keyResults.push({ label: 'Objectif', value: fmt(r.target as number) }, { label: 'Années', value: `${r.yearsToFire} ans` })
  if (sim.type === 'tax' && r.ir)                keyResults.push({ label: 'IR', value: fmt(r.ir as number) }, { label: 'Net', value: fmt(r.netIncome as number) })
  if (sim.type === 'buyrent')                    keyResults.push({ label: 'Achat', value: fmt(r.buyNetWorth as number) }, { label: 'Location', value: fmt(r.rentCapital as number) })
  if (sim.type === 'mortgage' && r.totalMonthly) keyResults.push({ label: 'Mensualité', value: fmt(r.totalMonthly as number) }, { label: 'TAEG', value: `${(r.taeg as number).toFixed(2)}%` })

  const handleVisualize = () => {
    const params = new URLSearchParams({ restore: JSON.stringify(sim.inputs) })
    router.push(`${config.href}?${params.toString()}`)
  }

  return (
    <Card className="group" style={selected ? { borderColor: 'rgba(241,192,134,0.40)', background: 'rgba(241,192,134,0.05)' } : {}}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {selectMode && (
              <button onClick={onSelect} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 2, color: selected ? '#f1c086' : 'rgba(255,255,255,0.25)' }}>
                {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
            )}
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{sim.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">{config.label}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />{date}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {keyResults.length > 0 && (
          <>
            <Separator className="mt-3 mb-3" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {keyResults.map((kr, i) => (
                <div key={i}>
                  <p className="text-[11px] text-muted-foreground">{kr.label}</p>
                  <p className="text-sm font-medium tabular-nums">{kr.value}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator className="mt-3 mb-3" />
        <div className="flex gap-2">
          {!selectMode && (
            <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={onSelect}
              style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <GitCompare className="h-3.5 w-3.5" />
              Comparer
            </Button>
          )}
          <Button variant="outline" size="sm" className={`${selectMode ? 'w-full' : 'flex-1'} h-8 text-xs gap-1.5`} onClick={handleVisualize}>
            <ExternalLink className="h-3.5 w-3.5" />
            Visualiser
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const [sims, setSims] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [compareData, setCompareData] = useState<[Simulation, Simulation] | null>(null)
  const { toast } = useToast()

  const load = async () => {
    const res = await fetch('/api/simulations')
    if (res.ok) setSims(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' })
    setSims(prev => prev.filter(s => s.id !== id))
    setSelected(prev => prev.filter(i => i !== id))
    toast({ title: 'Simulation supprimée' })
  }

  const toggleSelect = (sim: Simulation) => {
    if (selected.includes(sim.id)) {
      setSelected(prev => prev.filter(i => i !== sim.id))
      if (selected.length <= 2) setCompareData(null)
      return
    }
    if (selected.length >= 2) return
    if (selected.length === 0) {
      setSelected([sim.id])
      return
    }
    const first = sims.find(s => s.id === selected[0])
    if (!first || first.type !== sim.type) {
      toast({ title: 'Types différents', description: 'Sélectionnez 2 simulations du même type.', variant: 'destructive' })
      return
    }
    const s0 = sims.find(s => s.id === selected[0])!
    setCompareData([s0, sim])
    setSelected([selected[0], sim.id])
  }

  const clearSelection = () => {
    setSelected([])
    setCompareData(null)
  }

  const grouped = sims.reduce((acc, s) => {
    const k = s.type; if (!acc[k]) acc[k] = []; acc[k].push(s); return acc
  }, {} as Record<string, Simulation[]>)

  const selectMode = selected.length > 0

  return (
    <div className="space-y-6 animate-fade-in px-7 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Historique</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sims.length} simulation{sims.length !== 1 ? 's' : ''} sauvegardée{sims.length !== 1 ? 's' : ''}
          </p>
        </div>
        {selectMode && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.length}/2 sélectionnée{selected.length > 1 ? 's' : ''}</span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-xs gap-1.5">
              <X className="h-3.5 w-3.5" /> Annuler
            </Button>
          </div>
        )}
      </div>

      {compareData && <ComparePanel sims={compareData} onClose={clearSelection} />}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="h-32 pt-5"><div className="h-full rounded-md bg-muted/30 animate-pulse" /></CardContent></Card>
          ))}
        </div>
      )}

      {!loading && sims.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Aucune simulation sauvegardée</p>
            <p className="text-sm text-muted-foreground mt-1">Utilisez le bouton &quot;Sauvegarder&quot; dans chaque calculateur</p>
          </CardContent>
        </Card>
      )}

      {!loading && Object.entries(grouped).map(([type, items]) => {
        const config = TYPE_CONFIG[type] || TYPE_CONFIG.compound
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <config.Icon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">{config.label}</h2>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(sim => (
                <SimCard
                  key={sim.id}
                  sim={sim}
                  onDelete={() => del(sim.id)}
                  selected={selected.includes(sim.id)}
                  onSelect={() => toggleSelect(sim)}
                  selectMode={selectMode}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
