'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Shield, Building2, TrendingUp, LayoutGrid, AlertTriangle,
  ArrowRight, CheckCircle2, Minus, AlertCircle,
} from 'lucide-react'
import { useChartTheme } from '@/lib/chart-theme'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PillarDetail { score: number; max: number; label: string }
interface ScoreData {
  score: number
  details: {
    security:        PillarDetail & { months: number | null }
    realestate:      PillarDetail & { ltv: number | null }
    longterm:        PillarDetail & { hasAV: boolean; hasPEA: boolean; hasPER: boolean }
    diversification: PillarDetail & { types: string[] }
    risk:            PillarDetail & { cryptoRatio: number }
  }
  quickActions: { label: string; href: string; pts: number }[]
  history: { score: number; createdAt: string }[]
}

// ── Gauge SVG ────────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 72, cx = 90, cy = 90
  const startAngle = 210, totalArc = 300
  const filledArc = (score / 100) * totalArc
  const toRad = (d: number) => (d * Math.PI) / 180
  const arc = (a: number) => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) })
  const ts = arc(startAngle), te = arc(startAngle + totalArc), fe = arc(startAngle + filledArc)
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#f1c086' : score >= 40 ? '#fb923c' : '#f87171'

  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <path d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 1 1 ${te.x} ${te.y}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round" />
      {score > 0 && (
        <path d={`M ${ts.x} ${ts.y} A ${r} ${r} 0 ${filledArc > 180 ? 1 : 0} 1 ${fe.x} ${fe.y}`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill={color} fontSize={32} fontWeight={700} fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={12}>/100</text>
    </svg>
  )
}

// ── Pyramid visual ────────────────────────────────────────────────────────────

const PYRAMID_LEVELS = [
  { key: 'risk',            level: 5, label: 'Spéculatif',       sublabel: 'Crypto, alternatif',           color: '#f87171', width: '40%'  },
  { key: 'diversification', level: 4, label: 'Dynamique',        sublabel: 'PEA, CTO, Locatif',            color: '#fb923c', width: '56%'  },
  { key: 'longterm',        level: 3, label: 'Long terme',        sublabel: 'AV, PEA, PER',                 color: '#f1c086', width: '68%'  },
  { key: 'realestate',      level: 2, label: 'Immobilier',        sublabel: 'Résidence principale',         color: '#34d399', width: '82%'  },
  { key: 'security',        level: 1, label: 'Sécurité',          sublabel: 'Livrets, épargne précaution',  color: '#38bdf8', width: '100%' },
]

function PyramidBar({
  level, color, width, label, sublabel, score, max,
}: {
  level: number; color: string; width: string; label: string; sublabel: string; score: number; max: number
}) {
  const pct = score / max
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', width: 12, textAlign: 'right', flexShrink: 0 }}>{level}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width, position: 'relative', height: 28, borderRadius: 8, overflow: 'hidden', background: `${color}12`, border: `1px solid ${color}28` }}>
            {/* Fill based on score */}
            <div style={{ position: 'absolute', inset: 0, width: `${Math.round(pct * 100)}%`, background: `linear-gradient(90deg, ${color}35, ${color}20)`, transition: 'width 0.8s ease' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted-c)' }}>{sublabel}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color, marginLeft: 4 }}>{score}/{max}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pillar detail rows ─────────────────────────────────────────────────────────

const PILLAR_META = {
  security:        { label: 'Niveau 1 — Sécurité de base',       icon: Shield,        color: '#38bdf8', href: '/dashboard/patrimoine/livrets', desc: 'Épargne de précaution (LIVRET + CASH) · Objectif : 3-6 mois de dépenses' },
  realestate:      { label: 'Niveau 2 — Immobilier',             icon: Building2,     color: '#34d399', href: '/dashboard/patrimoine/immobilier', desc: 'Résidence principale · LTV (dette / valeur du bien)' },
  longterm:        { label: 'Niveau 3 — Enveloppes long terme',  icon: TrendingUp,    color: '#f1c086', href: '/dashboard/patrimoine', desc: 'Assurance-vie · PEA · PER' },
  diversification: { label: 'Niveau 4 — Diversification',        icon: LayoutGrid,    color: '#fb923c', href: '/dashboard/patrimoine', desc: 'Variété d\'enveloppes · Mix immobilier + financier' },
  risk:            { label: 'Niveau 5 — Maîtrise du risque',     icon: AlertTriangle, color: '#f87171', href: '/dashboard/patrimoine', desc: 'Exposition crypto · Sommet de la pyramide' },
}

function PillarRow({ pillarKey, detail }: { pillarKey: string; detail: PillarDetail }) {
  const meta = PILLAR_META[pillarKey as keyof typeof PILLAR_META]
  if (!meta) return null
  const pct = detail.score / detail.max
  const barColor = pct >= 0.75 ? '#34d399' : pct >= 0.50 ? '#f1c086' : '#f87171'
  const StatusIcon = pct >= 0.75 ? CheckCircle2 : pct >= 0.50 ? Minus : AlertCircle
  const Icon = meta.icon

  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: meta.color + '15', border: `1px solid ${meta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <Icon style={{ width: 15, height: 15, color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)' }}>{meta.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted-c)' }}>{detail.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{detail.score}<span style={{ color: 'var(--text-subtle)', fontWeight: 400, fontSize: 11 }}>/{detail.max}</span></span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 8 }}>{meta.desc}</p>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(pct * 100)}%`, background: barColor, borderRadius: 4, transition: 'width 0.8s ease' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <StatusIcon style={{ width: 14, height: 14, color: barColor }} />
          {pct < 0.75 && (
            <Link href={meta.href} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: meta.color, textDecoration: 'none', background: meta.color + '10', border: `1px solid ${meta.color}22`, borderRadius: 8, padding: '3px 9px', whiteSpace: 'nowrap' }}>
              Améliorer <ArrowRight style={{ width: 10, height: 10 }} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Score label ───────────────────────────────────────────────────────────────

function scoreLabel(s: number) {
  if (s >= 90) return { label: 'Excellent', color: '#f1c086' }
  if (s >= 80) return { label: 'Très bien',  color: '#34d399' }
  if (s >= 60) return { label: 'Bien',        color: '#f1c086' }
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,24px)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Patrimoine</p>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Score Patrimonial PatrImo
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted-c)', marginTop: 8 }}>
          Calculé exclusivement à partir de votre <Link href="/dashboard/patrimoine" style={{ color: '#f1c086', textDecoration: 'none' }}>tableau patrimonial</Link>, selon les 5 niveaux de la pyramide d'investissement.
          Se met à jour à chaque consultation.
        </p>
      </div>

      {/* Score hero + quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', marginBottom: 28, background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoreGauge score={score} />
          <div style={{ marginTop: -16, textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: sl.color, letterSpacing: '0.05em' }}>{sl.label}</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-em)', marginBottom: 14 }}>
            {quickActions.length > 0 ? `${quickActions.reduce((a, q) => a + q.pts, 0)} points disponibles rapidement` : 'Patrimoine bien structuré — bravo !'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((qa, i) => (
              <Link key={i} href={qa.href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '2px 8px', flexShrink: 0 }}>+{qa.pts} pts</span>
                <span style={{ fontSize: 13, color: 'var(--text-em)', flex: 1 }}>{qa.label}</span>
                <ArrowRight style={{ width: 13, height: 13, color: 'var(--text-subtle)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pyramid visual */}
      <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Pyramide d'investissement</p>
          <a href="https://blog.maslow.immo/pyramide-investissement/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--text-subtle)', textDecoration: 'none' }}>
            En savoir plus →
          </a>
        </div>
        {PYRAMID_LEVELS.map(lvl => {
          const detail = details[lvl.key as keyof ScoreData['details']] as PillarDetail
          return (
            <PyramidBar
              key={lvl.key}
              level={lvl.level}
              color={lvl.color}
              width={lvl.width}
              label={lvl.label}
              sublabel={lvl.sublabel}
              score={detail?.score ?? 0}
              max={detail?.max ?? 1}
            />
          )
        })}
      </div>

      {/* Pillar detail breakdown */}
      <div style={{ background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)', borderRadius: 20, padding: '20px 24px', marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted-c)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Détail par niveau</p>
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
              <Tooltip contentStyle={{ background: chartTheme.tooltip.background, border: chartTheme.tooltip.border, borderRadius: 8, fontSize: 11, color: chartTheme.tooltip.color }} formatter={(v: number) => [`${v}/100`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#f1c086" strokeWidth={2} dot={{ fill: '#f1c086', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
