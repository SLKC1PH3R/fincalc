'use client'
import { Suspense, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCountUp } from '@/lib/use-count-up'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SaveSimulation } from '@/components/SaveSimulation'
import { SvgRingDonut, SvgBarChart } from '@/components/SvgChart'
import { fmt, fmtPct } from '@/lib/utils'
import { Download, Plus, X, TrendingUp, Minus, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react'
import { printReport } from '@/lib/print'
import { FrenchAverageWidget } from '@/components/FrenchAverageWidget'

interface LineItem { id: string; name: string; value: number }
interface Category { id: string; name: string; items: LineItem[] }

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_REVENUS: LineItem[] = [
  { id: 'r1', name: 'Salaire', value: 2500 },
  { id: 'r2', name: 'Loyer perçu', value: 1500 },
]
const DEFAULT_INVEST: Category[] = [
  {
    id: 'i1', name: 'Investissements mensuels', items: [
      { id: 'i1a', name: 'Actions', value: 200 },
      { id: 'i1b', name: 'Assurance vie', value: 200 },
      { id: 'i1c', name: 'ETF', value: 1200 },
    ]
  },
]
const DEFAULT_DEPENSES: Category[] = [
  {
    id: 'd1', name: 'Logement', items: [
      { id: 'd1a', name: 'Loyer', value: 500 },
      { id: 'd1b', name: 'Charges', value: 120 },
    ]
  },
  {
    id: 'd2', name: 'Vie quotidienne', items: [
      { id: 'd2a', name: 'Courses', value: 300 },
      { id: 'd2b', name: 'Restaurants', value: 100 },
    ]
  },
  {
    id: 'd3', name: 'Abonnements', items: [
      { id: 'd3a', name: 'Internet / Téléphone', value: 50 },
      { id: 'd3b', name: 'Sport', value: 20 },
    ]
  },
]

const C = '#818cf8'

const fmtK = (n: number) => { const a = Math.abs(n); if (a >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.',',') + ' M€'; if (a >= 1_000) return Math.round(n/1_000) + ' k€'; return Math.round(n) + ' €' }
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', color: C }
const labelSt: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--p-text-mid)' }
const divSt: React.CSSProperties = { height: 1, background: 'var(--p-line)' }

function ItemRow({ item, onChange, onRemove, placeholder }: {
  item: LineItem
  onChange: (key: 'name' | 'value', val: string | number) => void
  onRemove: () => void
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Input
        value={item.name}
        onChange={e => onChange('name', e.target.value)}
        className="h-7 text-xs flex-1"
        placeholder={placeholder ?? 'Nom'}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Input
          type="number"
          value={item.value || ''}
          onChange={e => onChange('value', +e.target.value)}
          className="h-7 text-xs w-24 tabular-nums"
          placeholder="0"
        />
        <span style={{ fontSize: 11, color: 'var(--p-text-faint)', width: 16, flexShrink: 0 }}>€</span>
      </div>
      <button
        onClick={onRemove}
        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  )
}

function SavingsRatePageInner() {
  const [revenus, setRevenus] = useState<LineItem[]>(DEFAULT_REVENUS)
  const [investCats, setInvestCats] = useState<Category[]>(DEFAULT_INVEST)
  const [depenseCats, setDepenseCats] = useState<Category[]>(DEFAULT_DEPENSES)

  const searchParams = useSearchParams()
  const restoreParam = searchParams.get('restore')
  useEffect(() => {
    if (!restoreParam) return
    try {
      const p = JSON.parse(restoreParam)
      const migrateItems = (arr: any[]): LineItem[] =>
        arr.map((x: any) => ({ id: x.id ?? uid(), name: x.name ?? x.label ?? '', value: x.value ?? x.amount ?? 0 }))
      const migrateCats = (arr: any[], fallbackName: string): Category[] => {
        if (arr[0]?.items !== undefined) return arr
        return [{ id: uid(), name: fallbackName, items: migrateItems(arr) }]
      }
      if (p.revenus) setRevenus(migrateItems(p.revenus))
      if (p.investCats) setInvestCats(migrateCats(p.investCats, 'Investissements'))
      if (p.depenseCats) setDepenseCats(migrateCats(p.depenseCats, 'Dépenses'))
    } catch {}
  }, [restoreParam])

  const totalRevenu = useMemo(() => revenus.reduce((s, r) => s + r.value, 0), [revenus])
  const totalInvest = useMemo(() => investCats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.value, 0), 0), [investCats])
  const totalDepense = useMemo(() => depenseCats.reduce((s, c) => s + c.items.reduce((ss, i) => ss + i.value, 0), 0), [depenseCats])
  const balance = totalRevenu - totalInvest - totalDepense
  const savingsRate = totalRevenu > 0 ? (totalInvest / totalRevenu) * 100 : 0

  const savingsRateAnimated = useCountUp(savingsRate, 800)

  // ── Helpers ──
  const updateRevenu = (id: string, key: 'name' | 'value', val: string | number) =>
    setRevenus(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  const removeRevenu = (id: string) => setRevenus(prev => prev.filter(r => r.id !== id))
  const addRevenu = () => setRevenus(prev => [...prev, { id: uid(), name: '', value: 0 }])

  type CatSetter = React.Dispatch<React.SetStateAction<Category[]>>
  const updateCatName = (set: CatSetter, catId: string, name: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, name } : c))
  const updateCatItem = (set: CatSetter, catId: string, itemId: string, key: 'name' | 'value', val: string | number) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [key]: val } : i) } : c))
  const removeCatItem = (set: CatSetter, catId: string, itemId: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c))
  const addCatItem = (set: CatSetter, catId: string) =>
    set(prev => prev.map(c => c.id === catId ? { ...c, items: [...c.items, { id: uid(), name: '', value: 0 }] } : c))
  const removeCat = (set: CatSetter, catId: string) =>
    set(prev => prev.filter(c => c.id !== catId))
  const addCat = (set: CatSetter, label: string) =>
    set(prev => [...prev, { id: uid(), name: label, items: [] }])

  // ── Score ──
  const score = balance < 0 ? 'deficit'
    : savingsRate >= 20 ? 'excellent'
    : savingsRate >= 10 ? 'bien'
    : savingsRate > 0 ? 'moyen'
    : 'nul'
  const scoreConf = {
    deficit:   { label: 'Déficit',        Icon: AlertCircle,  color: '#ef4444', msg: 'Vos dépenses dépassent vos revenus. Identifiez les postes à réduire en priorité.' },
    excellent: { label: 'Excellent',      Icon: CheckCircle2, color: '#34d399', msg: `Bravo ! Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Continuez à maximiser vos investissements.` },
    bien:      { label: 'Bien',           Icon: TrendingUp,   color: '#60a5fa', msg: `Votre taux d'épargne de ${savingsRate.toFixed(0)}% est sain. Visez 20% pour accélérer votre liberté financière.` },
    moyen:     { label: 'À améliorer',    Icon: Minus,        color: '#fbbf24', msg: `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Visez 10% minimum en réduisant les dépenses non essentielles.` },
    nul:       { label: 'Aucune épargne', Icon: AlertCircle,  color: '#fbbf24', msg: "Vous n'avez aucune épargne mensuelle. Commencez par mettre de côté 5% de vos revenus chaque mois." },
  }[score]

  const handleReset = () => {
    setRevenus(DEFAULT_REVENUS)
    setInvestCats(DEFAULT_INVEST)
    setDepenseCats(DEFAULT_DEPENSES)
  }

  // Bar chart data: income breakdown
  const barData = totalRevenu > 0 ? [
    { label: 'Mois', epargne: totalInvest, depenses: totalDepense, balance: Math.max(balance, 0) },
  ] : []

  const tips = [
    { title: 'Automatisation', body: 'Automatisez votre épargne dès le 1er du mois — avant les dépenses.', color: C },
    { title: 'Objectif 20%', body: 'Un taux de 20% ou plus accélère significativement votre liberté financière (FIRE).', color: '#60a5fa' },
    { title: 'Top 3 postes', body: 'Identifiez les 3 postes les plus élevés — souvent logement, transport, alimentation.', color: '#fbbf24' },
    { title: 'Fiscalité', body: 'Priorisez PEA, AV et PER pour optimiser la fiscalité de votre épargne.', color: '#f472b6' },
  ]

  const GAP = 16

  const panelStyle = {
    background: 'var(--p-card)',
    border: '1px solid var(--p-line)',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    boxShadow: 'var(--shadow-sm)',
  }

  return (
    <div style={{ padding: '24px 28px 60px', background: 'var(--p-bg)', minHeight: '100%', fontFamily: 'var(--p-sans)', color: 'var(--p-text)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
            <span>Simulateurs</span><span style={{ opacity: 0.5 }}>›</span><span style={{ color: C }}>Taux d&apos;épargne</span>
          </div>
          <h1 style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 400, color: 'var(--p-text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
            Taux d&apos;épargne<span style={{ color: C }}>.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--p-text-dim)', marginTop: 8 }}>
            Capacité d&apos;épargne mensuelle. <span style={{ color: 'var(--p-text-mid)', fontWeight: 600 }}>Trajectoire vers l&apos;indépendance.</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <Button variant="outline" size="sm" onClick={() => printReport({
            title: "Taux d'épargne",
            subtitle: `Taux : ${savingsRate.toFixed(0)}% — Balance : ${fmt(balance)}/mois`,
            kpis: [
              { label: "Taux d'épargne", value: fmtPct(savingsRate), highlight: true, sub: `${fmt(totalInvest)} investis/mois` },
              { label: 'Revenus', value: fmt(totalRevenu) },
              { label: 'Investissements', value: fmt(totalInvest) },
              { label: 'Dépenses', value: fmt(totalDepense) },
            ],
            sections: [],
          })} style={{ background: C, borderColor: 'transparent', color: '#fff' }}>
            <Download className="h-3.5 w-3.5 mr-1.5" />PDF
          </Button>
          <SaveSimulation
            type="savings-rate"
            name={`Épargne ${savingsRate.toFixed(0)}% — ${fmt(balance)}/mois`}
            inputs={{ revenus, investCats, depenseCats } as unknown as Record<string, unknown>}
            results={{ savingsRate, totalRevenu, totalInvest, totalDepense, balance } as unknown as Record<string, unknown>}
          />
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Réinit.
          </Button>
        </div>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: GAP, alignItems: 'start' }}>

        {/* LEFT — sticky input panels */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Revenus */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Revenus</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmt(totalRevenu)}</span>
            </div>
            {revenus.map(r => (
              <ItemRow
                key={r.id}
                item={r}
                onChange={(k, v) => updateRevenu(r.id, k, v)}
                onRemove={() => removeRevenu(r.id)}
                placeholder="Source de revenu"
              />
            ))}
            <button
              onClick={addRevenu}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text-dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Ajouter une source de revenu
            </button>
          </div>

          {/* Investissements */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Investissements</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmt(totalInvest)}</span>
            </div>
            {investCats.map(cat => {
              const total = cat.items.reduce((s, i) => s + i.value, 0)
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={cat.name}
                      onChange={e => updateCatName(setInvestCats, cat.id, e.target.value)}
                      className="h-7 text-xs font-semibold flex-1"
                    />
                    <span style={{ fontSize: 12, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(total)}</span>
                    {investCats.length > 1 && (
                      <button onClick={() => removeCat(setInvestCats, cat.id)}
                        style={{ color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  {cat.items.map(item => (
                    <div key={item.id} style={{ paddingLeft: 12 }}>
                      <ItemRow
                        item={item}
                        onChange={(k, v) => updateCatItem(setInvestCats, cat.id, item.id, k, v)}
                        onRemove={() => removeCatItem(setInvestCats, cat.id, item.id)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addCatItem(setInvestCats, cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
                  >
                    <Plus style={{ width: 12, height: 12 }} />Ajouter
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => addCat(setInvestCats, 'Nouvelle catégorie')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 8, borderTop: '1px dashed var(--p-line)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text-dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Nouvelle catégorie
            </button>
          </div>

          {/* Dépenses */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--p-line)' }}>
              <div style={{ ...eyebrow, color: '#fb923c' }}>Dépenses</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmt(totalDepense)}</span>
            </div>
            {depenseCats.map(cat => {
              const total = cat.items.reduce((s, i) => s + i.value, 0)
              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={cat.name}
                      onChange={e => updateCatName(setDepenseCats, cat.id, e.target.value)}
                      className="h-7 text-xs font-semibold flex-1"
                    />
                    <span style={{ fontSize: 12, color: 'var(--p-text-dim)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(total)}</span>
                    {depenseCats.length > 1 && (
                      <button onClick={() => removeCat(setDepenseCats, cat.id)}
                        style={{ color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  {cat.items.map(item => (
                    <div key={item.id} style={{ paddingLeft: 12 }}>
                      <ItemRow
                        item={item}
                        onChange={(k, v) => updateCatItem(setDepenseCats, cat.id, item.id, k, v)}
                        onRemove={() => removeCatItem(setDepenseCats, cat.id, item.id)}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addCatItem(setDepenseCats, cat.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 12 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
                  >
                    <Plus style={{ width: 12, height: 12 }} />Ajouter
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => addCat(setDepenseCats, 'Nouvelle catégorie')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--p-text-faint)', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 8, borderTop: '1px dashed var(--p-line)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--p-text-dim)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--p-text-faint)')}
            >
              <Plus style={{ width: 12, height: 12 }} />Nouvelle catégorie
            </button>
          </div>
        </div>

        {/* CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* HERO */}
          <div style={{ border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', position: 'relative', background: `linear-gradient(135deg, ${C}0e 0%, transparent 55%), var(--p-card)` }}>
            <div style={{ position: 'absolute', padding: '14px 18px', fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C, display: 'inline-block' }} />
              Taux d&apos;épargne mensuel
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr' }}>
              <div style={{ padding: '52px 28px 24px' }}>
                <div style={{ fontFamily: 'var(--p-serif)', fontSize: 'clamp(42px, 5.5vw, 66px)', fontWeight: 400, letterSpacing: '-0.045em', lineHeight: 0.95, color: 'var(--p-text)' }}>
                  {savingsRateAnimated.toFixed(1)}&thinsp;%
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--p-text-dim)' }}>
                  {fmtK(totalInvest)} investis sur {fmtK(totalRevenu)} de revenus
                </div>
                {totalRevenu > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--p-line)' }}>
                      <div style={{ width: `${Math.min(totalInvest / totalRevenu * 100, 100)}%`, background: '#34d399', transition: 'width 0.7s' }} />
                      <div style={{ width: `${Math.min(totalDepense / totalRevenu * 100, 100 - totalInvest / totalRevenu * 100)}%`, background: '#fb923c' }} />
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, fontFamily: 'var(--p-mono)', color: 'var(--p-text-faint)' }}>
                      <span style={{ color: '#34d399' }}>Épargne {(totalInvest / totalRevenu * 100).toFixed(0)}%</span>
                      <span style={{ color: '#fb923c' }}>Dépenses {(totalDepense / totalRevenu * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ borderLeft: '1px solid var(--p-line)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14, background: 'var(--p-card-2)' }}>
                {[
                  { label: 'Revenus', value: fmtK(totalRevenu), color: C },
                  { label: 'Investissements', value: fmtK(totalInvest), color: '#34d399' },
                  { label: 'Dépenses', value: fmtK(totalDepense), color: '#fb923c' },
                  { label: 'Balance libre', value: fmtK(balance), color: balance >= 0 ? '#34d399' : '#f87171' },
                ].map((k, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 9.5, color: 'var(--p-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--p-mono)' }}>{k.label}</div>
                    <div style={{ fontFamily: 'var(--p-mono)', fontSize: 17, fontWeight: 700, color: k.color, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1 }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Répartition par barres */}
          {barData.length > 0 && (
            <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
                <div style={eyebrow}>Allocation du revenu</div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Répartition mensuelle : épargne · dépenses · balance</div>
              </div>
              <div style={{ padding: '10px 12px 6px' }}>
                <SvgBarChart
                  data={barData}
                  xKey="label"
                  bars={[
                    { key: 'epargne', label: 'Épargne/invest.', color: '#34d399' },
                    { key: 'depenses', label: 'Dépenses', color: '#fb923c' },
                    { key: 'balance', label: 'Balance libre', color: C },
                  ]}
                  height={200}
                  yFormat={v => v >= 1000 ? `${Math.round(v/1000)}k` : String(Math.round(v))}
                />
              </div>
            </div>
          )}

          {/* Table postes par catégorie */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Détail par poste</div>
            </div>
            {[...investCats, ...depenseCats].map((cat, ci) => {
              const catTotal = cat.items.reduce((s, i) => s + i.value, 0)
              if (catTotal <= 0) return null
              return (
                <div key={cat.id}>
                  <div style={{ padding: '8px 18px', background: 'var(--p-card-2)', borderBottom: '1px solid var(--p-line)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--p-text-em)', textTransform: 'uppercase', letterSpacing: '0.10em', fontFamily: 'var(--p-mono)' }}>{cat.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmt(catTotal)}</span>
                  </div>
                  {cat.items.filter(i => i.value > 0).sort((a, b) => b.value - a.value).map((item, ii, arr) => (
                    <div key={item.id} style={{ padding: '7px 18px 7px 30px', display: 'flex', justifyContent: 'space-between', borderBottom: ii < arr.length - 1 ? '1px solid var(--p-line)' : ci < [...investCats, ...depenseCats].length - 1 ? '1px solid var(--p-line)' : undefined }}>
                      <span style={{ fontSize: 11.5, color: 'var(--p-text-dim)' }}>{item.name}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-em)', fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--p-mono)' }}>{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>

          {/* Ring donut */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Répartition</div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-dim)', marginTop: 4 }}>Part d&apos;épargne sur le revenu</div>
            </div>
            <div style={{ padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <SvgRingDonut pct={savingsRate} color={C} centerLabel="Épargne" size={160} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { color: '#34d399', label: 'Épargne/invest.', value: fmtK(totalInvest), pct: totalRevenu > 0 ? totalInvest / totalRevenu * 100 : 0 },
                  { color: '#fb923c', label: 'Dépenses', value: fmtK(totalDepense), pct: totalRevenu > 0 ? totalDepense / totalRevenu * 100 : 0 },
                  { color: C, label: 'Balance libre', value: fmtK(Math.max(balance, 0)), pct: totalRevenu > 0 ? Math.max(balance, 0) / totalRevenu * 100 : 0 },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11, color: 'var(--p-text-mid)' }}>{row.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--p-text-faint)', fontFamily: 'var(--p-mono)' }}>{row.pct.toFixed(0)}%</span>
                    <span style={{ fontFamily: 'var(--p-mono)', fontSize: 12, fontWeight: 700, color: 'var(--p-text-em)', minWidth: 60, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Score */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <scoreConf.Icon style={{ width: 14, height: 14, color: scoreConf.color }} />
              <div style={{ ...eyebrow, color: scoreConf.color }}>Analyse — {scoreConf.label}</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <p style={{ fontSize: 12, color: 'var(--p-text-dim)', lineHeight: 1.6, marginBottom: 12 }}>{scoreConf.msg}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { label: 'Balance', value: fmt(balance), color: balance >= 0 ? '#34d399' : '#ef4444' },
                  { label: '% épargnés', value: `${savingsRate.toFixed(1)}%`, color: 'var(--p-text)' },
                  { label: '% dépensés', value: totalRevenu > 0 ? `${(totalDepense / totalRevenu * 100).toFixed(1)}%` : '—', color: 'var(--p-text)' },
                ].map((m, i) => (
                  <div key={i} style={{ borderRadius: 10, padding: '10px 8px', textAlign: 'center', background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                    <p style={{ fontSize: 10, color: 'var(--p-text-faint)', marginBottom: 4, fontFamily: 'var(--p-mono)', letterSpacing: '0.08em' }}>{m.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: m.color, fontFamily: 'var(--p-mono)' }}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Objectifs */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Objectifs recommandés</div>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { target: 10, label: 'Minimum conseillé', color: '#fbbf24' },
                { target: 20, label: 'Sain', color: '#60a5fa' },
                { target: 30, label: 'Excellent (FIRE)', color: '#34d399' },
              ].map((obj, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--p-text-dim)' }}>{obj.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: obj.color, fontFamily: 'var(--p-mono)' }}>{obj.target}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--p-card-2)', border: '1px solid var(--p-line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: obj.color, width: `${Math.min(savingsRate / obj.target * 100, 100)}%`, transition: 'width 0.4s', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* French average */}
          <FrenchAverageWidget tauxEpargne={savingsRate} label="Votre taux" />

          {/* Conseils */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--p-line)' }}>
              <div style={eyebrow}>Conseils</div>
            </div>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((t, i) => (
                <div key={i} style={{ padding: '12px 12px', borderRadius: 10, display: 'flex', gap: 10, background: 'var(--p-card-2)', border: '1px solid var(--p-line)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${t.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${t.color} 25%, transparent)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp style={{ width: 13, height: 13, color: t.color }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-em)', marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--p-text-mid)', lineHeight: 1.5 }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Aller plus loin */}
          <div style={{ background: 'var(--p-card)', border: '1px solid var(--p-line)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ ...eyebrow, color: 'var(--p-text-dim)', marginBottom: 10 }}>Aller plus loin</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'FI/RE — Indépendance financière', href: '/dashboard/fire' },
                { label: 'Budget', href: '/dashboard/budget' },
                { label: 'Intérêts composés', href: '/dashboard/compound' },
              ].map((link, i) => (
                <a key={i} href={link.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, color: 'var(--p-text-mid)', textDecoration: 'none', fontSize: 11.5, fontWeight: 600, border: '1px solid var(--p-line)', background: 'var(--p-card-2)' }}>
                  <span>{link.label}</span>
                  <span style={{ color: 'var(--p-text-faint)', fontSize: 14 }}>›</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SavingsRatePage() { return <Suspense><SavingsRatePageInner /></Suspense> }
