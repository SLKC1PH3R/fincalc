'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, Flame, Receipt, Home, Building2, Wallet,
  PiggyBank, Calculator, ArrowRight, AlertCircle, CheckCircle2, Minus,
} from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PillarDetail { score: number; max: number; label: string }
interface ScoreData {
  score: number
  details: {
    savings: PillarDetail & { rate: number }
    emergency: PillarDetail & { months: number | null }
    diversification: PillarDetail & { types: string[] }
    retirement: PillarDetail & { hasSim: boolean; gap: number }
    fiscal: PillarDetail & { hasTaxSim: boolean; hasPEA: boolean; hasPER: boolean }
    debt: PillarDetail & { ratio: number | null }
  }
  quickActions: { label: string; href: string; pts: number }[]
  history: { score: number; createdAt: string }[]
}

// ── Gauge SVG ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 72
  const cx = 90; const cy = 90
  const startAngle = 210; const endAngle = 330  // total arc = 300°
  const totalArc = 300
  const pct = score / 100
  const filledArc = pct * totalArc

  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arc = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  })

  const trackStart = arc(startAngle)
  const trackEnd = arc(startAngle + totalArc)
  const fillEnd = arc(startAngle + filledArc)
  const trackLargeArc = totalArc > 180 ? 1 : 0
  const fillLargeArc = filledArc > 180 ? 1 : 0

  const color = score >= 90 ? '#f97316' : score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : score >= 40 ? '#fb923c' : '#f87171'

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      {/* Track */}
      <path
        d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${trackLargeArc} 1 ${trackEnd.x} ${trackEnd.y}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round"
      />
      {/* Fill */}
      {score > 0 && (
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${fillLargeArc} 1 ${fillEnd.x} ${fillEnd.y}`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      )}
      {/* Score text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize={32} fontWeight={700} fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={12}>/100</text>
    </svg>
  )
}

// ── Pillar Bar ────────────────────────────────────────────────────────────────

const PILLAR_META = {
  savings:         { label: "Taux d'épargne",      max: 20, icon: TrendingUp,  color: '#34d399', href: '/dashboard/savings-rate' },
  emergency:       { label: 'Épargne d\'urgence',  max: 15, icon: PiggyBank,   color: '#38bdf8', href: '/dashboard/patrimoine' },
  diversification: { label: 'Diversification',     max: 20, icon: Wallet,      color: '#a78bfa', href: '/dashboard/patrimoine' },
  retirement:      { label: 'Préparation retraite',max: 20, icon: Flame,       color: '#fb923c', href: '/dashboard/retirement' },
  fiscal:          { label: 'Optimisation fiscale', max: 15, icon: Receipt,     color: '#fbbf24', href: '/dashboard/tax' },
  debt:            { label: 'Endettement sain',    max: 10, icon: Building2,   color: '#f472b6', href: '/dashboard/mortgage' },
}

function PillarRow({ pillarKey, detail }: { pillarKey: string; detail: PillarDetail }) {
  const meta = PILLAR_META[pillarKey as keyof typeof PILLAR_META]
  if (!meta) return null
  const pct = detail.score / detail.max
  const Icon = meta.icon
  const barColor = pct >= 0.75 ? '#34d399' : pct >= 0.50 ? '#fbbf24' : '#f87171'
  const StatusIcon = pct >= 0.75 ? CheckCircle2 : pct >= 0.50 ? Minus : AlertCircle

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.color + '18', border: `1px solid ${meta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 14, height: 14, color: meta.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-em)' }}>{meta.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{detail.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: barColor }}>{detail.score}<span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>/{detail.max}</span></span>
          </div>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.round(pct * 100)}%`, background: barColor, borderRadius: 4, transition: 'width 0.8s ease' }} />
        </div>
      </div>
      <StatusIcon style={{ width: 14, height: 14, color: barColor, flexShrink: 0 }} />
      {pct < 0.75 && (
        <Link href={meta.href} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: meta.color, textDecoration: 'none', background: meta.color + '12', border: `1px solid ${meta.color}25`, borderRadius: 8, padding: '4px 10px', whiteSpace: 'nowrap' }}>
          Améliorer <ArrowRight style={{ width: 10, height: 10 }} />
        </Link>
      )}
    </div>
  )
}

// ── Score label ───────────────────────────────────────────────────────────────

function scoreLabel(s: number) {
  if (s >= 90) return { label: 'Excellent', color: '#f97316' }
  if (s >= 80) return { label: 'Très bien', color: '#34d399' }
  if (s >= 60) return { label: 'Bien', color: '#fbbf24' }
  if (s >= 40) return { label: 'En progression', color: '#fb923c' }
  return { label: 'À améliorer', color: '#f87171' }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScorePage() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const chartTheme = useChartTheme()

  useEffect(() => {
    fetch('/api/score').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted-c)' }}>
      Calcul en cours…
    </div>
  )

  if (!data) return null

  const { score, details, quickActions, history } = data
  const sl = scoreLabel(score)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Votre profil financier</p>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Score Patrimonial FinCalc
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
          Calculé à partir de vos simulations et de votre tableau patrimonial. Se met à jour à chaque connexion.
        </p>
      </div>

      {/* Score hero + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', marginBottom: 32, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoreGauge score={score} />
          <div style={{ marginTop: -16, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: sl.color, letterSpacing: '0.05em' }}>{sl.label}</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', marginBottom: 14 }}>
            {quickActions.length > 0 ? `${quickActions.reduce((a, q) => a + q.pts, 0)} points rapides disponibles` : 'Profil complet — bravo !'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((qa, i) => (
              <Link key={i} href={qa.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>+{qa.pts} pts</span>
                <span style={{ fontSize: 13, color: 'var(--text-em)', flex: 1 }}>{qa.label}</span>
                <ArrowRight style={{ width: 13, height: 13, color: 'var(--text-subtle)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pillar breakdown */}
      <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Détail par pilier</p>
        {Object.entries(details).map(([k, d]) => (
          <PillarRow key={k} pillarKey={k} detail={d as PillarDetail} />
        ))}
      </div>

      {/* History chart */}
      {history.length > 1 && (
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: '20px 24px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Évolution du score</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="createdAt" tickFormatter={(v) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} tick={{ fontSize: 10, fill: chartTheme.tick }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: chartTheme.tick }} />
              <Tooltip
                contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }}
                formatter={(v: number) => [`${v}/100`, 'Score']}
              />
              <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
