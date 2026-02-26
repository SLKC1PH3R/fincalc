import { useTheme } from '@/contexts/ThemeContext'

export function useChartTheme() {
  const { theme } = useTheme()
  const d = theme === 'dark'
  return {
    grid:     d ? 'hsl(0 0% 14.9%)' : 'hsl(0 0% 88%)',
    tick:     d ? 'hsl(0 0% 63.9%)' : 'hsl(0 0% 42%)',
    lineMain: d ? 'hsl(0 0% 98%)'   : 'hsl(0 0% 15%)',
    lineDim:  d ? 'hsl(0 0% 42%)'   : 'hsl(0 0% 60%)',
    fill1:    d ? 'hsl(0 0% 70%)'   : 'hsl(0 0% 55%)',
    fill2:    d ? 'hsl(0 0% 45%)'   : 'hsl(0 0% 35%)',
    fill3:    d ? 'hsl(0 0% 30%)'   : 'hsl(0 0% 20%)',
    tooltip: {
      background: d ? '#111' : '#fff',
      border:     `1px solid ${d ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      borderRadius: 6,
      fontSize: 12,
      color:    d ? '#fff' : '#111',
    },
    itemStyle:  { color: d ? '#fff'                    : '#111' },
    labelStyle: { color: d ? 'rgba(255,255,255,0.5)'   : 'rgba(0,0,0,0.4)' },
  }
}
