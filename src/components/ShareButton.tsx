'use client'
import { useState } from 'react'
import { Share2, Copy, Check, X } from 'lucide-react'

interface ShareButtonProps {
  simulationId?: string
  className?: string
}

export function ShareButton({ simulationId, className }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleShare = async () => {
    if (!simulationId) return
    setState('loading')
    try {
      const res = await fetch(`/api/simulations/${simulationId}/share`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const fullUrl = `${window.location.origin}${data.url}`
      setUrl(fullUrl)
      setOpen(true)
      setState('idle')
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const handleCopy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setState('copied')
    setTimeout(() => setState('idle'), 2000)
  }

  if (!simulationId) return null

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={handleShare}
        disabled={state === 'loading'}
        className={className}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: state === 'loading' ? 'wait' : 'pointer',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          color: 'var(--p-text-em)', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
      >
        {state === 'error'
          ? <X style={{ width: 14, height: 14, color: '#f87171' }} />
          : <Share2 style={{ width: 14, height: 14, color: state === 'loading' ? 'var(--p-text-faint)' : 'var(--p-text-em)' }} />
        }
        {state === 'loading' ? 'Génération…' : state === 'error' ? 'Erreur' : 'Partager'}
      </button>

      {open && url && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 50,
          background: 'var(--p-card)', border: '1px solid var(--p-line)',
          borderRadius: 12, padding: 16, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-em)' }}>Lien de partage</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p-text-faint)', padding: 2 }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              readOnly value={url}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: 'var(--p-text-dim)', outline: 'none' }}
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: state === 'copied' ? 'rgba(52,211,153,0.1)' : 'rgba(176,120,32,0.1)', border: `1px solid ${state === 'copied' ? 'rgba(52,211,153,0.2)' : 'rgba(176,120,32,0.2)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: state === 'copied' ? '#34d399' : '#B07820', flexShrink: 0 }}>
              {state === 'copied' ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
              {state === 'copied' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginTop: 8 }}>
            Ce lien permet à n'importe qui de consulter votre simulation en lecture seule.
          </p>
        </div>
      )}
    </div>
  )
}
