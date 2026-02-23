'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, TrendingUp, Flame, Receipt, Home, Building2, Clock } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface Simulation {
  id: string; type: string; name: string
  inputs: Record<string, unknown>; results: Record<string, unknown>; createdAt: string
}

const TYPE_CONFIG: Record<string, { label: string; Icon: any }> = {
  compound: { label: 'Intérêts Composés', Icon: TrendingUp },
  fire: { label: 'FI/RE', Icon: Flame },
  tax: { label: 'Impôts', Icon: Receipt },
  buyrent: { label: 'Acheter vs Louer', Icon: Home },
  mortgage: { label: 'Prêt Immobilier', Icon: Building2 },
}

function SimCard({ sim, onDelete }: { sim: Simulation; onDelete: () => void }) {
  const config = TYPE_CONFIG[sim.type] || TYPE_CONFIG.compound
  const { Icon } = config
  const date = new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  const keyResults: { label: string; value: string }[] = []
  const r = sim.results
  if (sim.type === 'compound' && r.final) keyResults.push({ label: 'Capital final', value: fmt(r.final as number) }, { label: 'Intérêts', value: fmt(r.interest as number) })
  if (sim.type === 'fire' && r.target) keyResults.push({ label: 'Objectif', value: fmt(r.target as number) }, { label: 'Années', value: `${r.yearsToFire} ans` })
  if (sim.type === 'tax' && r.ir) keyResults.push({ label: 'IR', value: fmt(r.ir as number) }, { label: 'Net', value: fmt(r.netIncome as number) })
  if (sim.type === 'buyrent') keyResults.push({ label: 'Achat', value: fmt(r.buyNetWorth as number) }, { label: 'Location', value: fmt(r.rentCapital as number) })
  if (sim.type === 'mortgage' && r.monthlyPayment) keyResults.push({ label: 'Mensualité', value: fmt(r.totalMonthly as number) }, { label: 'TAEG', value: `${(r.taeg as number).toFixed(2)}%` })

  return (
    <Card className="group">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{sim.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">{config.label}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{date}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={onDelete}
          >
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
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const [sims, setSims] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
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
    toast({ title: 'Simulation supprimée' })
  }

  const grouped = sims.reduce((acc, s) => {
    const k = s.type; if (!acc[k]) acc[k] = []; acc[k].push(s); return acc
  }, {} as Record<string, Simulation[]>)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Historique</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sims.length} simulation{sims.length !== 1 ? 's' : ''} sauvegardée{sims.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i}><CardContent className="h-28 animate-pulse bg-muted/30 rounded-lg" /></Card>)}
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
              {items.map(sim => <SimCard key={sim.id} sim={sim} onDelete={() => del(sim.id)} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
