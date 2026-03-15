import { useTheme } from '@/contexts/ThemeContext'

export function useChartTheme() {
  const { theme } = useTheme()
  const d = theme === 'dark'
  const tooltipBg     = d ? '#111' : '#fff'
  const tooltipBorder = d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const mutedColor    = d ? 'hsl(0 0% 63.9%)' : 'hsl(0 0% 42%)'
  return {
    grid:     d ? 'hsl(0 0% 14.9%)' : 'hsl(0 0% 88%)',
    tick:     mutedColor,
    mutedColor,
    lineMain: d ? 'hsl(0 0% 98%)'   : 'hsl(0 0% 15%)',
    lineDim:  d ? 'hsl(0 0% 42%)'   : 'hsl(0 0% 60%)',
    fill1:    d ? 'hsl(0 0% 70%)'   : 'hsl(0 0% 55%)',
    fill2:    d ? 'hsl(0 0% 45%)'   : 'hsl(0 0% 35%)',
    fill3:    d ? 'hsl(0 0% 30%)'   : 'hsl(0 0% 20%)',
    tooltipBg,
    tooltipBorder,
    tooltip: {
      background: tooltipBg,
      border:     `1px solid ${tooltipBorder}`,
      borderRadius: 6,
      fontSize: 12,
      color:    d ? '#fff' : '#111',
    },
    itemStyle:  { color: d ? '#fff'                    : '#111' },
    labelStyle: { color: d ? 'rgba(255,255,255,0.5)'   : 'rgba(0,0,0,0.4)' },
  }
}
