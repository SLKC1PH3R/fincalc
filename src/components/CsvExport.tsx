'use client'
import { Download } from 'lucide-react'

interface Props {
  data: Record<string, string | number>[]
  filename: string
  label?: string
}

export function CsvExport({ data, filename, label = 'CSV' }: Props) {
  const download = () => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(h => String(row[h] ?? '')).join(';'))
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button
      onClick={download}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'transparent', color: 'rgba(255,255,255,0.45)',
        fontSize: 11, fontWeight: 500, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)' }}
    >
      <Download style={{ width: 11, height: 11 }} />
      {label}
    </button>
  )
}
