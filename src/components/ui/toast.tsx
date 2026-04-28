import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-[380px] max-w-[calc(100vw-2rem)]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const toastVariants = cva(
  [
    'group pointer-events-auto relative w-full overflow-hidden',
    'rounded-2xl border shadow-2xl',
    'transition-all duration-300 ease-out',
    'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-4 data-[state=closed]:duration-200',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:animate-out data-[swipe=end]:fade-out-0 data-[swipe=end]:slide-out-to-right-full',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-[rgba(13,16,23,0.94)] border-[rgba(255,255,255,0.08)]',
          'shadow-[0_20px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]',
          '[--accent:#60a5fa] [--glow:rgba(96,165,250,0.08)]',
        ].join(' '),
        destructive: [
          'bg-[rgba(13,16,23,0.94)] border-[rgba(248,113,113,0.20)]',
          'shadow-[0_20px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(248,113,113,0.08)]',
          '[--accent:#f87171] [--glow:rgba(248,113,113,0.07)]',
        ].join(' '),
        success: [
          'bg-[rgba(13,16,23,0.94)] border-[rgba(176,120,32,0.20)]',
          'shadow-[0_20px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(176,120,32,0.08)]',
          '[--accent:#B07820] [--glow:rgba(176,120,32,0.07)]',
        ].join(' '),
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/05 px-3 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/90 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-3 top-3 rounded-lg p-1 text-white/20 opacity-0 transition-all hover:text-white/60 focus:opacity-100 focus:outline-none group-hover:opacity-100',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-[13px] font-semibold leading-snug text-white/90 tracking-[-0.01em]', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-[11.5px] leading-relaxed text-white/40 mt-0.5', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps, type ToastActionElement,
  ToastProvider, ToastViewport, Toast,
  ToastTitle, ToastDescription, ToastClose, ToastAction,
}
