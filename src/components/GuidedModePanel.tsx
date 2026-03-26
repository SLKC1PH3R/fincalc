'use client'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const GREEN = '#34d399'

export type GuidedStep = {
  question: string
  hint: string
  ref: string
  // number input
  type?: 'number' | 'slider' | 'choice'
  suffix?: string
  value?: number
  onChange?: (v: number) => void
  // slider extras
  min?: number
  max?: number
  stepSize?: number
  displayValue?: (v: number) => string
  // choice (string select)
  strValue?: string
  onChoice?: (v: string) => void
  options?: { value: string; label: string; sub?: string }[]
}

interface Props {
  steps: GuidedStep[]
  currentStep: number
  onStepChange: (n: number) => void
  onFinish: () => void
}

export function GuidedModePanel({ steps, currentStep, onStepChange, onFinish }: Props) {
  const s = steps[currentStep]
  const type = s.type ?? 'number'
  const isLast = currentStep === steps.length - 1

  return (
    <div style={{
      background: 'rgba(52,211,153,0.05)',
      border: '1px solid rgba(52,211,153,0.18)',
      borderRadius: 20,
      padding: '24px 28px',
      marginBottom: 28,
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            height: 8, borderRadius: 99, transition: 'all 0.3s',
            width: i <= currentStep ? 20 : 8,
            background: i < currentStep ? GREEN : i === currentStep ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.10)',
          }} />
        ))}
      </div>

      <p style={{ fontSize: 11, color: GREEN, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>
        Question {currentStep + 1} / {steps.length}
      </p>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{s.question}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted-c)', marginBottom: 16, lineHeight: 1.5 }}>{s.hint}</p>

      {/* Input area */}
      <div style={{ marginBottom: 12 }}>
        {type === 'number' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Input
              type="number"
              value={s.value ?? 0}
              onChange={e => s.onChange?.(+e.target.value)}
              style={{ fontSize: 20, fontWeight: 700, height: 52, maxWidth: 200 }}
            />
            {s.suffix && <span style={{ fontSize: 16, color: 'var(--text-muted-c)' }}>{s.suffix}</span>}
          </div>
        )}

        {type === 'slider' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {s.displayValue ? s.displayValue(s.value ?? 0) : `${s.value}${s.suffix ?? ''}`}
              </span>
            </div>
            <Slider
              min={s.min ?? 0}
              max={s.max ?? 100}
              step={s.stepSize ?? 1}
              value={[s.value ?? 0]}
              onValueChange={([v]) => s.onChange?.(v)}
            />
          </>
        )}

        {type === 'choice' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {s.options?.map(opt => {
              const selected = s.strValue === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => s.onChoice?.(opt.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: selected ? `1px solid rgba(52,211,153,0.5)` : '1px solid var(--card-dark-border)',
                    background: selected ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: selected ? GREEN : 'var(--text-em)', margin: 0 }}>{opt.label}</p>
                  {opt.sub && <p style={{ fontSize: 11, color: 'var(--text-muted-c)', marginTop: 3, marginBottom: 0 }}>{opt.sub}</p>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Reference tip */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: 0 }}>💡 {s.ref}</p>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10 }}>
        {currentStep > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onStepChange(currentStep - 1)} style={{ height: 38 }}>
            ← Précédent
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          style={{ marginLeft: 'auto', height: 38, borderColor: 'rgba(52,211,153,0.4)', color: GREEN, background: 'rgba(52,211,153,0.08)' }}
          onClick={() => isLast ? onFinish() : onStepChange(currentStep + 1)}
        >
          {isLast ? 'Voir les résultats →' : 'Suivant →'}
        </Button>
      </div>
    </div>
  )
}
