import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { PatrimoineEnvelope, PortfolioPosition } from '@prisma/client'
import type { FinancialProfile } from '@/lib/profile-types'

// ── Value helpers ─────────────────────────────────────────────────────────────

type EnvelopeWithPositions = PatrimoineEnvelope & { positions: PortfolioPosition[] }

function getLiquidValue(e: EnvelopeWithPositions): number {
  const meta = e.metadata as Record<string, unknown>
  return Number(meta?.balance ?? meta?.currentValue ?? 0)
}

function getInvestValue(e: EnvelopeWithPositions): number {
  const posVal = e.positions.reduce((s, p) => s + p.pru * p.quantity, 0)
  const meta = e.metadata as Record<string, unknown>
  return posVal > 0 ? posVal : Number(meta?.currentValue ?? meta?.balance ?? 0)
}

function getEnvelopeValue(e: EnvelopeWithPositions): number {
  if (e.type === 'LIVRET' || e.type === 'CASH') return getLiquidValue(e)
  if (e.type === 'IMMOBILIER') return Number((e.metadata as Record<string, unknown>)?.currentValue ?? 0)
  return getInvestValue(e)
}

// ── Pyramide niveau 1 — Sécurité de base (25 pts) ────────────────────────────
// Épargne de précaution (LIVRET + CASH)

function scoreSecurity(
  liquidBalance: number,
  monthlyExpenses: number | null,
): { score: number; label: string; months: number | null } {
  if (monthlyExpenses && monthlyExpenses > 0) {
    const months = Math.round((liquidBalance / monthlyExpenses) * 10) / 10
    if (months >= 6) return { score: 25, label: `Optimal — ${months.toFixed(1)} mois`, months }
    if (months >= 3) return { score: Math.round(15 + ((months - 3) / 3) * 10), label: `Bien — ${months.toFixed(1)} mois`, months }
    if (months >= 1) return { score: Math.round(7 + ((months - 1) / 2) * 8), label: `Insuffisant — ${months.toFixed(1)} mois`, months }
    if (liquidBalance > 0) return { score: 4, label: 'Critique — moins d\'1 mois', months }
    return { score: 0, label: 'Aucune épargne de précaution', months: 0 }
  }
  // Sans dépenses connues : score sur valeur absolue
  if (liquidBalance >= 15000) return { score: 22, label: 'Solide', months: null }
  if (liquidBalance >= 5000)  return { score: 15, label: 'Correct', months: null }
  if (liquidBalance >= 1000)  return { score: 9,  label: 'Insuffisant', months: null }
  if (liquidBalance > 0)      return { score: 4,  label: 'Très faible', months: null }
  return { score: 0, label: 'Aucune épargne de précaution', months: null }
}

// ── Pyramide niveau 2 — Immobilier (20 pts) ───────────────────────────────────
// Résidence principale / locatif + LTV

function scoreRealEstate(
  realEstateValue: number,
  creditRemaining: number,
  housingStatus: string | null | undefined,
): { score: number; label: string; ltv: number | null } {
  if (realEstateValue <= 0) {
    if (housingStatus === 'tenant') return { score: 10, label: 'Locataire — choix valide', ltv: null }
    return { score: 8, label: 'Pas d\'immobilier déclaré', ltv: null }
  }
  const ltv = creditRemaining > 0 ? creditRemaining / realEstateValue : 0
  if (ltv >= 0.90) return { score: 5,  label: `LTV ${Math.round(ltv * 100)}% — très endetté`,    ltv }
  if (ltv >= 0.70) return { score: 10, label: `LTV ${Math.round(ltv * 100)}% — endetté`,          ltv }
  if (ltv >= 0.40) return { score: 14, label: `LTV ${Math.round(ltv * 100)}% — bien financé`,     ltv }
  if (ltv >= 0.10) return { score: 18, label: `LTV ${Math.round(ltv * 100)}% — peu endetté`,      ltv }
  return { score: 20, label: 'Libre de crédit', ltv }
}

// ── Pyramide niveau 3 — Enveloppes long terme (25 pts) ───────────────────────
// AV (10pts) + PEA (8pts) + PER (7pts)

function scoreLongTerm(
  hasAV: boolean, avValue: number,
  hasPEA: boolean, peaValue: number,
  hasPER: boolean, perValue: number,
): { score: number; label: string; hasAV: boolean; hasPEA: boolean; hasPER: boolean } {
  let score = 0
  if (hasAV)  score += avValue  > 0 ? 10 : 4
  if (hasPEA) score += peaValue > 0 ? 8  : 3
  if (hasPER) score += perValue > 0 ? 7  : 3
  score = Math.min(25, score)
  const label = score >= 22 ? 'Complet' : score >= 14 ? 'Bien' : score >= 7 ? 'En construction' : 'À construire'
  return { score, label, hasAV, hasPEA, hasPER }
}

// ── Pyramide niveau 4 — Diversification (20 pts) ─────────────────────────────
// Nombre et variété des enveloppes investissements

function scoreDiversification(types: string[]): { score: number; label: string } {
  const unique = new Set(types).size
  const investTypes = new Set(types.filter(t => ['PEA', 'CTO', 'AV', 'PER', 'IMMOBILIER', 'CRYPTO'].includes(t)))

  let score = 0
  // Variété globale (enveloppes totales)
  if (unique >= 5) score += 7
  else if (unique >= 3) score += 4
  else if (unique >= 2) score += 2
  else if (unique === 1) score += 1

  // Variété des investissements
  if (investTypes.size >= 4) score += 9
  else if (investTypes.size >= 3) score += 7
  else if (investTypes.size >= 2) score += 4
  else if (investTypes.size === 1) score += 2

  // Bonus : immobilier ET financier
  const hasImmo = types.includes('IMMOBILIER')
  const hasFinancial = types.some(t => ['PEA', 'CTO', 'AV'].includes(t))
  if (hasImmo && hasFinancial) score += 4

  score = Math.min(20, score)
  const label = score >= 16 ? 'Excellent' : score >= 10 ? 'Bien diversifié' : score >= 5 ? 'Partiel' : 'Peu diversifié'
  return { score, label }
}

// ── Pyramide niveau 5 — Maîtrise du risque (10 pts) ──────────────────────────
// Ratio crypto / Patrimoine total

function scoreRisk(
  cryptoValue: number,
  totalValue: number,
): { score: number; label: string; cryptoRatio: number } {
  if (totalValue <= 0) return { score: 5, label: 'Patrimoine non renseigné', cryptoRatio: 0 }
  const r = cryptoValue / totalValue
  if (r === 0)    return { score: 10, label: 'Aucune exposition crypto',       cryptoRatio: 0 }
  if (r <= 0.05)  return { score: 9,  label: `Crypto maîtrisée (${Math.round(r*100)}%)`,   cryptoRatio: r }
  if (r <= 0.10)  return { score: 7,  label: `Crypto acceptable (${Math.round(r*100)}%)`,  cryptoRatio: r }
  if (r <= 0.20)  return { score: 4,  label: `Crypto élevée (${Math.round(r*100)}%)`,      cryptoRatio: r }
  if (r <= 0.30)  return { score: 2,  label: `Crypto très élevée (${Math.round(r*100)}%)`, cryptoRatio: r }
  return { score: 0, label: `Exposition excessive (${Math.round(r*100)}% crypto)`, cryptoRatio: r }
}

// ── Quick actions ─────────────────────────────────────────────────────────────

interface ScoreDetails {
  security:        { score: number; max: number; months: number | null; label: string }
  realestate:      { score: number; max: number; ltv: number | null; label: string }
  longterm:        { score: number; max: number; hasAV: boolean; hasPEA: boolean; hasPER: boolean; label: string }
  diversification: { score: number; max: number; types: string[]; label: string }
  risk:            { score: number; max: number; cryptoRatio: number; label: string }
}

function getQuickActions(details: ScoreDetails): { label: string; href: string; pts: number }[] {
  const actions: { label: string; href: string; pts: number }[] = []
  const gap = (max: number, score: number) => Math.max(0, max - score)

  if (details.security.score < 15)
    actions.push({ label: 'Alimenter votre épargne de précaution (livrets)', href: '/dashboard/patrimoine/livrets', pts: gap(25, details.security.score) })

  if (!details.longterm.hasAV)
    actions.push({ label: 'Déclarer une Assurance-vie dans votre Patrimoine', href: '/dashboard/patrimoine', pts: 10 })
  else if (!details.longterm.hasPEA)
    actions.push({ label: 'Déclarer un PEA dans votre Patrimoine', href: '/dashboard/patrimoine/actions', pts: 8 })
  else if (!details.longterm.hasPER)
    actions.push({ label: 'Déclarer un PER dans votre Patrimoine', href: '/dashboard/patrimoine', pts: 7 })

  if (details.diversification.score < 10)
    actions.push({ label: 'Diversifier vos enveloppes Patrimoniales', href: '/dashboard/patrimoine', pts: 5 })

  if (details.risk.cryptoRatio > 0.20)
    actions.push({ label: 'Réduire l\'exposition crypto (objectif <10%)', href: '/dashboard/patrimoine', pts: 7 })

  return actions.slice(0, 3)
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = session.user.id

  // Fetch envelopes + user financial profile in parallel
  const [envelopes, user] = await Promise.all([
    prisma.patrimoineEnvelope.findMany({
      where: { portfolio: { userId } },
      include: { positions: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { financialProfile: true },
    }),
  ])

  const fp = (user?.financialProfile ?? null) as FinancialProfile | null
  const monthlyExpenses = fp?.monthlyExpenses ?? null
  const housingStatus = fp?.housingStatus ?? null

  const types = envelopes.map(e => e.type)

  // ── Pilier 1: Sécurité ─────────────────────────────────────────────────────
  const liquidBalance = envelopes
    .filter(e => e.type === 'LIVRET' || e.type === 'CASH')
    .reduce((s, e) => s + getLiquidValue(e), 0)
  const securityResult = scoreSecurity(liquidBalance, monthlyExpenses ?? null)

  // ── Pilier 2: Immobilier ───────────────────────────────────────────────────
  const realEstateValue = envelopes
    .filter(e => e.type === 'IMMOBILIER')
    .reduce((s, e) => s + Number((e.metadata as Record<string, unknown>)?.currentValue ?? 0), 0)
  const creditRemaining = envelopes
    .filter(e => e.type === 'IMMOBILIER')
    .reduce((s, e) => s + Number((e.metadata as Record<string, unknown>)?.creditRemaining ?? 0), 0)
  const realEstateResult = scoreRealEstate(realEstateValue, creditRemaining, housingStatus)

  // ── Pilier 3: Long terme ───────────────────────────────────────────────────
  const avEnvs   = envelopes.filter(e => e.type === 'AV')
  const peaEnvs  = envelopes.filter(e => e.type === 'PEA')
  const perEnvs  = envelopes.filter(e => e.type === 'PER')
  const avValue  = avEnvs.reduce((s, e) => s + getInvestValue(e), 0)
  const peaValue = peaEnvs.reduce((s, e) => s + getInvestValue(e), 0)
  const perValue = perEnvs.reduce((s, e) => s + getInvestValue(e), 0)
  const longtermResult = scoreLongTerm(
    avEnvs.length > 0, avValue,
    peaEnvs.length > 0, peaValue,
    perEnvs.length > 0, perValue,
  )

  // ── Pilier 4: Diversification ──────────────────────────────────────────────
  const diversResult = scoreDiversification(types)

  // ── Pilier 5: Risque ───────────────────────────────────────────────────────
  const cryptoValue  = envelopes.filter(e => e.type === 'CRYPTO').reduce((s, e) => s + getInvestValue(e), 0)
  const totalValue   = envelopes.reduce((s, e) => s + getEnvelopeValue(e), 0)
  const riskResult   = scoreRisk(cryptoValue, totalValue)

  // ── Total ──────────────────────────────────────────────────────────────────
  const total = securityResult.score + realEstateResult.score + longtermResult.score + diversResult.score + riskResult.score

  const details: ScoreDetails = {
    security:        { score: securityResult.score, max: 25, months: securityResult.months, label: securityResult.label },
    realestate:      { score: realEstateResult.score, max: 20, ltv: realEstateResult.ltv, label: realEstateResult.label },
    longterm:        { score: longtermResult.score, max: 25, hasAV: longtermResult.hasAV, hasPEA: longtermResult.hasPEA, hasPER: longtermResult.hasPER, label: longtermResult.label },
    diversification: { score: diversResult.score, max: 20, types, label: diversResult.label },
    risk:            { score: riskResult.score, max: 10, cryptoRatio: riskResult.cryptoRatio, label: riskResult.label },
  }

  // Store score
  await prisma.patrimoineScore.create({ data: { userId, score: total, details: details as object } })

  // History (last 12)
  const history = await prisma.patrimoineScore.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { score: true, createdAt: true },
  })

  return NextResponse.json({
    score: total,
    details,
    quickActions: getQuickActions(details),
    history: history.reverse(),
  })
}
