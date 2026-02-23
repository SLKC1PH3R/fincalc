'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Trash2, TrendingUp, Flame, Receipt, Home, Building2, Clock } from 'lucide-react'
import { fmt } from '@/lib/utils'

interface Simulation {
  id: string
  type: string
  name: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
  createdAt: string
}

const TYPE_CONFIG: Record<string, { label: string; Icon: any; color: string }> = {
  compound: { label: 'Intérêts Composés', Icon: TrendingUp, color: 'text-gold' },
  fire: { label: 'FI/RE', Icon: Flame, color: 'text-orange-400' },
  tax: { label: 'Impôts', Icon: Receipt, color: 'text-blue-400' },
  buyrent: { label: 'Acheter vs Louer', Icon: Home, color: 'text-emerald-finance' },
  mortgage: { label: 'Prêt Immobilier', Icon: Building2, color: 'text-purple-400' },
}

function SimCard({ sim, onDelete }: { sim: Simulation; onDelete: () => void }) {
  const config = TYPE_CONFIG[sim.type] || TYPE_CONFIG.compound
  const { Icon } = config
  const date = new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  // Extract key result for display
  const keyResult = (() => {
    const r = sim.results as any
    if (sim.type === 'compound') return { label: 'Capital final', value: fmt(r.final) }
    if (sim.type === 'fire') return { label: 'Objectif FIRE', value: fmt(r.target) }
    if (sim.type === 'tax') return { label: 'Net après impôts', value: fmt(r.netIncome) }
    if (sim.type === 'buyrent') return { label: 'Verdict', value: r.buyWins ? `🏠 Acheter +${fmt(r.delta)}` : `🏢 Louer +${fmt(r.delta)}` }
    if (sim.type === 'mortgage') return { label: 'Mensualité', value: fmt(r.monthlyPayment) }
    return null
  })()

  return (
    <Card className="group hover:border-gold/30 transition-all duration-200">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`mt-0.5 p-1.5 border border-border bg-card flex-shrink-0`}>
              <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`font-mono text-[10px] tracking-widest uppercase ${config.color} mb-1`}>{config.label}</p>
              <p className="font-display text-sm font-semibold text-foreground truncate">{sim.name}</p>
              {keyResult && (
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  <span className="text-foreground/60">{keyResult.label}:</span> <span className="text-gold">{keyResult.value}</span>
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 font-mono text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {date}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all h-8 w-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { toast } = useToast()

  const fetchSims = async () => {
    setLoading(true)
    const res = await fetch('/api/simulations')
    const data = await res.json()
    setSimulations(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchSims() }, [])

  const handleDelete = async (id: string) => {
    await fetch(`/api/simulations?id=${id}`, { method: 'DELETE' })
    setSimulations(prev => prev.filter(s => s.id !== id))
    toast({ title: '✓ Simulation supprimée' })
  }

  const types = ['all', ...Object.keys(TYPE_CONFIG)]
  const filtered = filter === 'all' ? simulations : simulations.filter(s => s.type === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold text-gold">Historique</h2>
        <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">// Vos simulations sauvegardées</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase border transition-all ${
              filter === t ? 'bg-gold border-gold text-primary-foreground' : 'border-border text-muted-foreground hover:border-gold hover:text-gold'
            }`}
          >
            {t === 'all' ? 'Tous' : TYPE_CONFIG[t]?.label || t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="font-mono text-sm text-muted-foreground">Aucune simulation sauvegardée.</p>
            <p className="font-mono text-xs text-muted-foreground/50 mt-2">Utilisez le bouton "Sauvegarder" dans chaque calculateur.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(sim => (
            <SimCard key={sim.id} sim={sim} onDelete={() => handleDelete(sim.id)} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="font-mono text-xs text-muted-foreground text-right">{filtered.length} simulation{filtered.length > 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
