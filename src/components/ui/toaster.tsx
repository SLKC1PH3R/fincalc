'use client'
import { useToast } from '@/components/ui/use-toast'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

const VARIANT_ICON: Record<string, React.ReactNode> = {
  success:     <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#B07820' }} />,
  destructive: <AlertCircle  className="h-4 w-4 flex-shrink-0" style={{ color: '#f87171' }} />,
  default:     <Info         className="h-4 w-4 flex-shrink-0" style={{ color: '#60a5fa' }} />,
}

const VARIANT_ACCENT: Record<string, string> = {
  success:     '#B07820',
  destructive: '#f87171',
  default:     '#60a5fa',
}

const REMOVE_DELAY = 4000 // ms — matches use-toast TOAST_REMOVE_DELAY

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {/* Global animation keyframe for progress bar */}
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      {toasts.map(({ id, title, description, action, variant = 'default', ...props }) => {
        const icon   = VARIANT_ICON[variant ?? 'default']   ?? VARIANT_ICON.default
        const accent = VARIANT_ACCENT[variant ?? 'default'] ?? VARIANT_ACCENT.default

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Left accent bar */}
            <div
              aria-hidden
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: 3, borderRadius: '16px 0 0 16px',
                background: `linear-gradient(180deg, ${accent}, ${accent}80)`,
              }}
            />

            {/* Top radial glow */}
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(ellipse at 20% 0%, ${accent}12, transparent 60%)`,
              }}
            />

            {/* Content row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '14px 40px 14px 16px' }}>
              {/* Icon chip */}
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 1,
                background: `${accent}14`,
                border: `1px solid ${accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>

              {/* Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>

            {action}
            <ToastClose />

            {/* Animated progress bar */}
            <div
              aria-hidden
              style={{
                position: 'absolute', bottom: 0, left: 3, right: 0, height: 2,
                background: `linear-gradient(90deg, ${accent}60, ${accent}20)`,
                transformOrigin: 'left center',
                animation: `toast-progress ${REMOVE_DELAY}ms linear forwards`,
              }}
            />
          </Toast>
        )
      })}

      <ToastViewport />
    </ToastProvider>
  )
}
