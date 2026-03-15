'use client'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { GLOSSARY } from '@/lib/glossary'

interface GlossaryTipProps {
  term: string
  children?: React.ReactNode
}

export function GlossaryTip({ term, children }: GlossaryTipProps) {
  const [open, setOpen] = useState(false)
  const text = GLOSSARY[term]
  if (!text) return children ? <>{children}</> : null

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {children}
      <span className="relative inline-flex ml-1 align-middle">
        <HelpCircle
          className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen(v => !v)}
        />
        {open && (
          <span className="absolute z-50 left-5 -top-1 w-64 rounded-md border border-border bg-popover text-popover-foreground p-3 text-xs shadow-md leading-relaxed whitespace-normal" style={{ minWidth: 240 }}>
            {text}
          </span>
        )}
      </span>
    </span>
  )
}
