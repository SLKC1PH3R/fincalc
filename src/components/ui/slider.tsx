import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    tooltipFormat?: (v: number) => string
  }
>(({ className, tooltipFormat, ...props }, ref) => {
  const [hovered, setHovered] = React.useState(false)
  const val = Array.isArray(props.value) ? props.value[0] : undefined
  const min = props.min ?? 0
  const max = props.max ?? 100
  const pct = val !== undefined ? ((val - min) / (max - min)) * 100 : 0

  return (
    <div className="relative py-3 -my-3">
      <SliderPrimitive.Root
        ref={ref}
        className={cn('relative flex w-full touch-none select-none items-center', className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden rounded-full bg-border">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-gold" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-gold bg-background shadow-md transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:bg-gold cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
      </SliderPrimitive.Root>

      {hovered && val !== undefined && (
        <div
          className="pointer-events-none absolute bottom-full mb-1 text-xs font-semibold whitespace-nowrap rounded px-2 py-0.5"
          style={{
            left: `clamp(20px, ${pct}%, calc(100% - 20px))`,
            transform: 'translateX(-50%)',
            background: '#1a1a1a',
            border: '1px solid rgba(249,115,22,0.35)',
            color: '#f1c086',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {tooltipFormat ? tooltipFormat(val) : val}
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
