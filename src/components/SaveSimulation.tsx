'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Save, Check, X, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { ShareButton } from '@/components/ShareButton'
import Link from 'next/link'

// ── Post-save recommendations ─────────────────────────────────────────────────
const SIM_RECOMMENDATIONS: Record<string, Array<{ href: string; label: string; desc: string }>> = {
  compound:          [{ href: '/dashboard/fire',       label: 'FI/RE',             desc: 'Calculez votre date d\'indépendance' },
                      { href: '/dashboard/dca',        label: 'DCA',               desc: 'Comparez achat unique vs régulier' }],
  dca:               [{ href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'La puissance de l\'effet boule de neige' },
                      { href: '/dashboard/fire',       label: 'FI/RE',             desc: 'Calculez votre liberté financière' }],
  fire:              [{ href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Simulez votre portefeuille FIRE' },
                      { href: '/dashboard/retirement', label: 'Retraite',          desc: 'Estimez votre pension de base' }],
  mortgage:          [{ href: '/dashboard/buyrent',    label: 'Acheter vs Louer',  desc: 'Comparez les deux options' },
                      { href: '/dashboard/rental',     label: 'Locatif',           desc: 'Rentabilité d\'un investissement' }],
  buyrent:           [{ href: '/dashboard/mortgage',   label: 'Prêt immobilier',   desc: 'Simulez votre financement' },
                      { href: '/dashboard/rental',     label: 'Locatif',           desc: 'Et si vous investissiez ?' }],
  rental:            [{ href: '/dashboard/mortgage',   label: 'Prêt immobilier',   desc: 'Optimisez votre financement' },
                      { href: '/dashboard/buyrent',    label: 'Acheter vs Louer',  desc: 'Comparaison patrimoniale' }],
  tax:               [{ href: '/dashboard/flat-tax',   label: 'Flat Tax vs Barème',desc: 'Optimisez vos plus-values' },
                      { href: '/dashboard/retirement', label: 'Retraite',          desc: 'Préparez votre retraite fiscalement' }],
  'flat-tax':        [{ href: '/dashboard/envelope-compare', label: 'PEA vs CTO vs AV', desc: 'Choisissez la bonne enveloppe' },
                      { href: '/dashboard/tax',        label: 'Impôts IR',         desc: 'Simulez votre imposition globale' }],
  'envelope-compare':[{ href: '/dashboard/flat-tax',   label: 'Flat Tax vs Barème',desc: 'Fiscalité des plus-values' },
                      { href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Simulez la croissance à long terme' }],
  retirement:        [{ href: '/dashboard/fire',       label: 'FI/RE',             desc: 'Partir plus tôt avec la méthode FIRE' },
                      { href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Faites fructifier votre pension' }],
  'savings-rate':    [{ href: '/dashboard/budget',     label: 'Budget 50/30/20',   desc: 'Répartissez intelligemment vos revenus' },
                      { href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Que rapporte votre épargne ?' }],
  budget:            [{ href: '/dashboard/savings-rate',label: 'Taux d\'épargne',  desc: 'Maximisez votre taux d\'épargne' },
                      { href: '/dashboard/emergency-fund', label: 'Épargne précaution', desc: 'Constituez votre matelas de sécurité' }],
  'emergency-fund':  [{ href: '/dashboard/compound',   label: 'Intérêts composés', desc: 'Et ensuite, faites fructifier' },
                      { href: '/dashboard/savings-rate',label: 'Taux d\'épargne',  desc: 'Évaluez votre capacité d\'épargne' }],
  succession:        [{ href: '/dashboard/tax',        label: 'Impôts IR',         desc: 'Optimisez votre fiscalité globale' },
                      { href: '/dashboard/envelope-compare', label: 'PEA vs AV',   desc: 'La fiscalité successorale des enveloppes' }],
}

interface SaveSimulationProps {
  type: string
  name: string
  inputs: Record<string, unknown>
  results: Record<string, unknown>
}

export function SaveSimulation({ type, name, inputs, results }: SaveSimulationProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [editing, setEditing] = useState(false)
  const [customName, setCustomName] = useState(name)
  const [showRecos, setShowRecos] = useState(false)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const simId = searchParams.get('sim')
  const recos = SIM_RECOMMENDATIONS[type] ?? []

  const startSave = () => {
    setCustomName(name)
    setEditing(true)
  }

  const handleSave = async () => {
    const finalName = customName.trim() || name
    setSaving(true)
    setEditing(false)
    try {
      const res = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: finalName, inputs, results }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      window.dispatchEvent(new CustomEvent('simulation-saved'))
      toast({ variant: 'success', title: '✓ Simulation sauvegardée', description: `"${finalName}" ajoutée à votre historique.` })
      if (recos.length > 0) setShowRecos(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!simId) return
    setSaving(true)
    try {
      const res = await fetch('/api/simulations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: simId, inputs, results }),
      })
      if (!res.ok) throw new Error()
      setUpdated(true)
      window.dispatchEvent(new CustomEvent('simulation-saved'))
      toast({ variant: 'success', title: '✓ Simulation mise à jour', description: 'Les modifications ont été enregistrées.' })
      setTimeout(() => setUpdated(false), 3000)
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour.' })
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          className="h-8 text-xs w-44"
          placeholder="Nom de la simulation"
          autoFocus
        />
        <Button onClick={handleSave} disabled={saving} size="sm" variant="gold" className="h-8 w-8 p-0 flex-shrink-0">
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button onClick={() => setEditing(false)} size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {simId && (
          <Button onClick={handleUpdate} disabled={saving || updated} size="sm" className="gap-2" style={{ background: 'rgb(22,163,74)', borderColor: 'transparent', color: '#fff' }}>
            {updated ? <Check className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {updated ? 'Mis à jour' : 'Mettre à jour'}
          </Button>
        )}
        <Button onClick={startSave} disabled={saving || saved} variant="gold" size="sm" className="gap-2">
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? 'Sauvegardé' : 'Sauvegarder'}
        </Button>
        {simId && <ShareButton simulationId={simId} />}
      </div>

      {/* Post-save recommendations */}
      {showRecos && recos.length > 0 && (
        <div style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.20)', borderRadius: 12, padding: '12px 14px', minWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              💡 Les utilisateurs simulent aussi
            </p>
            <button onClick={() => setShowRecos(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 14, lineHeight: 1, padding: 2 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recos.map(rec => (
              <Link
                key={rec.href}
                href={rec.href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(129,140,248,0.35)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(129,140,248,0.12)' }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-em)', margin: 0 }}>→ {rec.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted-c)', margin: 0 }}>{rec.desc}</p>
                </div>
                <ChevronRight style={{ width: 12, height: 12, color: 'var(--text-subtle)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
