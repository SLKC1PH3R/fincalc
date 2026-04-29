'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { fmt, fmtCompact } from '@/lib/utils'
import {
  Flag, Target, Plus, Pencil, Trash2, Check, X, Calendar, TrendingUp,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Goal {
  id: string
  title: string
  description: string | null
  targetAmount: number
  targetDate: string | null
  envelopeId: string | null
  color: string
  createdAt: string
}

interface Envelope {
  id: string
  name: string
  type: string
  totalValue: number | null
  positions: { pru: number; quantity: number }[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  { value: '#B07820', label: 'Orange' },
  { value: '#818cf8', label: 'Violet' },
  { value: '#34d399', label: 'Vert' },
  { value: '#38bdf8', label: 'Bleu' },
  { value: '#f472b6', label: 'Rose' },
  { value: '#f59e0b', label: 'Ambre' },
]

// Today's date (2026-03-12)
const TODAY = new Date('2026-03-12')

// ── Helpers ───────────────────────────────────────────────────────────────────
function getEnvelopeValue(env: Envelope): number {
  if (env.totalValue !== null) return env.totalValue
  return env.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
}

function monthsDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', textAlign: 'center', gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'rgba(176,120,32,0.09)',
        border: '1px solid rgba(176,120,32,0.17)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Flag style={{ width: 28, height: 28, color: '#B07820' }} />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text)', margin: '0 0 8px' }}>
          Aucun objectif pour l'instant
        </p>
        <p style={{ fontSize: 13, color: 'var(--p-text-dim)', margin: 0, maxWidth: 380 }}>
          Définissez votre premier objectif — remboursement de crédit, apport immobilier, retraite à 50 ans…
        </p>
      </div>
      <button
        onClick={onAdd}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10, border: 'none',
          background: '#B07820', color: '#fff', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}
      >
        <Plus style={{ width: 15, height: 15 }} />
        Créer un objectif
      </button>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--p-card)', border: '1px solid var(--p-line)',
      borderRadius: 14, padding: 20,
    }}>
      <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ height: 16, width: '40%', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  )
}

// ── Goal form ─────────────────────────────────────────────────────────────────
interface FormState {
  title: string
  description: string
  targetAmount: string
  targetDate: string
  envelopeId: string
  color: string
}

const DEFAULT_FORM: FormState = {
  title: '', description: '', targetAmount: '', targetDate: '', envelopeId: '', color: '#B07820',
}

function GoalForm({
  initial,
  envelopes,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<FormState>
  envelopes: Envelope[]
  onSave: (data: FormState) => Promise<void>
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM, ...initial })

  const set = (k: keyof FormState, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.targetAmount) return
    await onSave(form)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid var(--p-line)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--p-text)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--p-text-dim)',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block',
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Titre */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Titre *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="ex : Apport immobilier"
            required
          />
        </div>

        {/* Description */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <input
            style={inputStyle}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Optionnel"
          />
        </div>

        {/* Montant cible */}
        <div>
          <label style={labelStyle}>Montant cible (€) *</label>
          <input
            style={inputStyle}
            type="number"
            min="0"
            step="100"
            value={form.targetAmount}
            onChange={e => set('targetAmount', e.target.value)}
            placeholder="50000"
            required
          />
        </div>

        {/* Date cible */}
        <div>
          <label style={labelStyle}>Date cible</label>
          <input
            style={inputStyle}
            type="date"
            value={form.targetDate}
            onChange={e => set('targetDate', e.target.value)}
          />
        </div>

        {/* Lier à une enveloppe */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Lier à une enveloppe</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.envelopeId}
            onChange={e => set('envelopeId', e.target.value)}
          >
            <option value="">— Manuel (saisie libre) —</option>
            {envelopes.map(env => (
              <option key={env.id} value={env.id}>
                {env.name} ({env.type})
              </option>
            ))}
          </select>
        </div>

        {/* Couleur */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Couleur</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => set('color', c.value)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none',
                  background: c.value, cursor: 'pointer',
                  outline: form.color === c.value ? `3px solid ${c.value}` : '3px solid transparent',
                  outlineOffset: 2,
                  transition: 'outline 0.12s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#B07820', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1,
          }}
        >
          <Check style={{ width: 14, height: 14 }} />
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            border: '1px solid var(--p-line)',
            background: 'transparent', color: 'var(--p-text-dim)',
            cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}
        >
          <X style={{ width: 14, height: 14 }} />
          Annuler
        </button>
      </div>
    </form>
  )
}

// ── Goal card ─────────────────────────────────────────────────────────────────
function GoalCard({
  goal,
  envelopes,
  onEdit,
  onDelete,
  onProgressChange,
  manualProgress,
}: {
  goal: Goal
  envelopes: Envelope[]
  onEdit: () => void
  onDelete: () => void
  onProgressChange: (id: string, value: number) => void
  manualProgress: Record<string, number>
}) {
  const linkedEnvelope = goal.envelopeId
    ? envelopes.find(e => e.id === goal.envelopeId)
    : null

  const currentAmount = linkedEnvelope
    ? getEnvelopeValue(linkedEnvelope)
    : (manualProgress[goal.id] ?? 0)

  const pct = Math.min(100, goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0)
  const isLinked = !!linkedEnvelope

  // Date relative
  let dateLabel: React.ReactNode = null
  if (goal.targetDate) {
    const target = new Date(goal.targetDate)
    const diff = monthsDiff(TODAY, target)
    if (diff > 0) {
      dateLabel = (
        <span style={{ fontSize: 11, color: '#34d399' }}>Dans {diff} mois</span>
      )
    } else if (diff < 0) {
      dateLabel = (
        <span style={{ fontSize: 11, color: '#f87171' }}>Dépassé de {Math.abs(diff)} mois</span>
      )
    } else {
      dateLabel = (
        <span style={{ fontSize: 11, color: '#B07820' }}>Ce mois-ci</span>
      )
    }
  }

  return (
    <div style={{
      background: 'var(--p-card)', border: '1px solid var(--p-line)',
      borderRadius: 14, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: goal.color, flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goal.title}
            </p>
            {goal.description && (
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', margin: '2px 0 0' }}>
                {goal.description}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
          <button
            onClick={onEdit}
            title="Modifier"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid var(--p-line)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--p-text-dim)',
            }}
          >
            <Pencil style={{ width: 12, height: 12 }} />
          </button>
          <button
            onClick={onDelete}
            title="Supprimer"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f87171',
            }}
          >
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${pct}%`,
            background: pct >= 100
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        {/* Amount row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtCompact(currentAmount)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>
              / {fmtCompact(goal.targetAmount)} — {pct.toFixed(0)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {dateLabel}
            {goal.targetDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--p-text-faint)' }}>
                <Calendar style={{ width: 10, height: 10 }} />
                Objectif : {formatDate(goal.targetDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Manual progress input (when no envelope linked) */}
      {!isLinked && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--p-line)' }}>
          <label style={{ fontSize: 11, color: 'var(--p-text-dim)', marginBottom: 4, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Montant actuel (manuel)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min="0"
              step="100"
              value={manualProgress[goal.id] ?? 0}
              onChange={e => onProgressChange(goal.id, Number(e.target.value))}
              style={{
                width: 120, padding: '6px 10px', borderRadius: 7,
                border: '1px solid var(--p-line)',
                background: 'rgba(255,255,255,0.04)',
                color: 'var(--p-text)', fontSize: 13, outline: 'none',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--p-text-dim)' }}>€</span>
          </div>
        </div>
      )}

      {/* Linked envelope badge */}
      {isLinked && linkedEnvelope && (
        <div style={{
          marginTop: 8,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 6,
          background: 'rgba(176,120,32,0.07)', border: '1px solid rgba(176,120,32,0.13)',
        }}>
          <TrendingUp style={{ width: 10, height: 10, color: '#B07820' }} />
          <span style={{ fontSize: 11, color: '#B07820', fontWeight: 600 }}>{linkedEnvelope.name}</span>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Manual progress (localStorage)
  const [manualProgress, setManualProgress] = useState<Record<string, number>>({})

  // Load goals + envelopes
  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/patrimoine/envelopes').then(r => r.json()),
    ])
      .then(([goalsData, envData]) => {
        if (Array.isArray(goalsData)) setGoals(goalsData)
        if (Array.isArray(envData)) setEnvelopes(envData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Load manual progress from localStorage
  useEffect(() => {
    const stored: Record<string, number> = {}
    for (const goal of goals) {
      const key = `patrimo_goal_progress_${goal.id}`
      const val = localStorage.getItem(key)
      if (val !== null) stored[goal.id] = Number(val)
    }
    setManualProgress(stored)
  }, [goals])

  const handleProgressChange = (id: string, value: number) => {
    setManualProgress(prev => ({ ...prev, [id]: value }))
    localStorage.setItem(`patrimo_goal_progress_${id}`, String(value))
  }

  // Add goal
  const handleAdd = async (form: FormState) => {
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          targetAmount: Number(form.targetAmount),
          targetDate: form.targetDate || undefined,
          envelopeId: form.envelopeId || undefined,
          color: form.color,
        }),
      })
      if (res.ok) {
        const newGoal = await res.json()
        setGoals(prev => [newGoal, ...prev])
        setShowAddForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // Edit goal
  const handleEdit = async (id: string, form: FormState) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          targetAmount: Number(form.targetAmount),
          targetDate: form.targetDate || null,
          envelopeId: form.envelopeId || null,
          color: form.color,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setGoals(prev => prev.map(g => g.id === id ? updated : g))
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  // Delete goal
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet objectif ?')) return
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGoals(prev => prev.filter(g => g.id !== id))
      localStorage.removeItem(`patrimo_goal_progress_${id}`)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px', background: 'var(--p-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--p-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target style={{ width: 22, height: 22, color: '#B07820' }} />
            Mes Objectifs
          </h1>
          <p style={{ fontSize: 13, color: 'var(--p-text-dim)', margin: '4px 0 0' }}>
            Suivez la progression de vos projets financiers
          </p>
        </div>
        {!showAddForm && !loading && (
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: '#B07820', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus style={{ width: 15, height: 15 }} />
            Ajouter
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card style={{ marginBottom: 20, background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14 }}>
          <CardContent style={{ padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flag style={{ width: 15, height: 15, color: '#B07820' }} />
              Nouvel objectif
            </p>
            <GoalForm
              envelopes={envelopes}
              onSave={handleAdd}
              onCancel={() => setShowAddForm(false)}
              loading={saving}
            />
          </CardContent>
        </Card>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!loading && goals.length === 0 && !showAddForm && (
        <Card style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14 }}>
          <CardContent style={{ padding: 0 }}>
            <EmptyState onAdd={() => setShowAddForm(true)} />
          </CardContent>
        </Card>
      )}

      {/* Goals list */}
      {!loading && goals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {goals.map(goal => {
            if (editingId === goal.id) {
              return (
                <Card key={goal.id} style={{ background: 'var(--p-card)', border: `1px solid ${goal.color}44`, borderRadius: 14 }}>
                  <CardContent style={{ padding: 20 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Pencil style={{ width: 14, height: 14, color: '#B07820' }} />
                      Modifier l'objectif
                    </p>
                    <GoalForm
                      initial={{
                        title: goal.title,
                        description: goal.description ?? '',
                        targetAmount: String(goal.targetAmount),
                        targetDate: toInputDate(goal.targetDate),
                        envelopeId: goal.envelopeId ?? '',
                        color: goal.color,
                      }}
                      envelopes={envelopes}
                      onSave={(form) => handleEdit(goal.id, form)}
                      onCancel={() => setEditingId(null)}
                      loading={saving}
                    />
                  </CardContent>
                </Card>
              )
            }

            return (
              <GoalCard
                key={goal.id}
                goal={goal}
                envelopes={envelopes}
                onEdit={() => { setEditingId(goal.id); setShowAddForm(false) }}
                onDelete={() => handleDelete(goal.id)}
                onProgressChange={handleProgressChange}
                manualProgress={manualProgress}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
