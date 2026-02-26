'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Save, Check, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

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
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const simId = searchParams.get('sim')

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
    <div className="flex items-center gap-1.5">
      {simId && (
        <Button onClick={handleUpdate} disabled={saving || updated} variant="outline" size="sm" className="gap-2">
          {updated ? <Check className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {updated ? 'Mis à jour' : 'Mettre à jour'}
        </Button>
      )}
      <Button onClick={startSave} disabled={saving || saved} variant="gold" size="sm" className="gap-2">
        {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
        {saved ? 'Sauvegardé' : 'Sauvegarder'}
      </Button>
    </div>
  )
}
