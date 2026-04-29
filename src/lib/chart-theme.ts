import { useTheme } from '@/contexts/ThemeContext'

export function useChartTheme() {
  const { theme } = useTheme()
  const d = theme === 'dark'

  const tooltipBg     = d ? '#1A1A1D' : '#FFFFFF'
  const tooltipBorder = d ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.09)'
  const tickColor     = d ? '#5A5348' : '#9A907F'
  const gridColor     = d ? 'rgba(255,255,255,0.05)' : 'rgba(10,10,10,0.06)'

  return {
    grid:      gridColor,
    tick:      tickColor,
    mutedColor: tickColor,
    // Primary line = gold
    lineMain:  d ? '#E1B572' : '#B07820',
    lineDim:   d ? '#C8A055' : '#8B5E18',
    // Fill palette
    fill1:     d ? '#E1B572' : '#B07820',
    fill2:     d ? '#34d399' : '#1F7A4A',
    fill3:     d ? '#60a5fa' : '#2B5B9A',
    tooltipBg,
    tooltipBorder,
    tooltip: {
      background:   tooltipBg,
      border:       `1px solid ${tooltipBorder}`,
      borderRadius: 10,
      boxShadow:    d ? '0 4px 20px rgba(0,0,0,0.40)' : '0 4px 20px rgba(10,10,10,0.10)',
      fontSize:     12,
      padding:      '8px 12px',
      color:        d ? '#F0EBE1' : '#1F1A12',
    },
    itemStyle:  { color: d ? '#F0EBE1' : '#1F1A12', fontSize: 12 },
    labelStyle: { color: tickColor, fontWeight: 600, fontSize: 11 },
  }
}
