'use client'
import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, inputs, results }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      toast({ variant: 'success', title: '✓ Simulation sauvegardée', description: `"${name}" ajoutée à votre historique.` })
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de sauvegarder.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button onClick={handleSave} disabled={saving || saved} variant="gold" size="sm" className="gap-2">
      {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
      {saved ? 'Sauvegardé' : 'Sauvegarder'}
    </Button>
  )
}
