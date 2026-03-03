import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Pilier calculators ────────────────────────────────────────────────────────

function scoreSavingsRate(rate: number): { score: number; label: string } {
  if (rate >= 30) return { score: 20, label: 'Excellent' }
  if (rate >= 20) return { score: Math.round(15 + (rate - 20) / 10 * 3), label: 'Très bien' }
  if (rate >= 10) return { score: Math.round(10 + (rate - 10) / 10 * 5), label: 'Bien' }
  if (rate >= 5)  return { score: Math.round(5 + (rate - 5) / 5 * 5), label: 'Moyen' }
  return { score: Math.round(rate / 5 * 5), label: 'À améliorer' }
}

function scoreEmergency(months: number): { score: number; label: string } {
  if (months >= 6) return { score: 15, label: 'Excellent' }
  if (months >= 3) return { score: Math.round(9 + (months - 3) / 3 * 3), label: 'Bien' }
  if (months >= 1) return { score: Math.round(4 + (months - 1) / 2 * 4), label: 'Insuffisant' }
  return { score: Math.round(months * 4), label: 'Critique' }
}

function scoreDiversification(envelopeTypes: string[], cryptoRatio: number): { score: number; label: string } {
  const unique = new Set(envelopeTypes).size
  let base = 0
  if (unique >= 3) base = 15
  else if (unique === 2) base = 10
  else if (unique === 1) base = 5
  // Bonus geographic diversity (non-LIVRET, non-CASH, non-IMMOBILIER)
  const hasInvestment = envelopeTypes.some(t => ['PEA', 'CTO', 'AV', 'CRYPTO'].includes(t))
  if (hasInvestment && unique >= 2) base += 3
  // Crypto ratio bonus/penalty
  if (cryptoRatio > 0 && cryptoRatio <= 0.10) base += 2
  if (cryptoRatio > 0.30) base -= 5
  const score = Math.max(0, Math.min(20, base))
  const label = score >= 17 ? 'Excellent' : score >= 11 ? 'Bien' : score >= 6 ? 'Moyen' : 'À améliorer'
  return { score, label }
}

function scoreRetirement(hasSim: boolean, gap: number, hasPER: boolean): { score: number; label: string } {
  if (!hasSim) return { score: 0, label: 'Non renseigné' }
  let score = 3  // has sim = 3 base pts
  if (hasPER) score += 3
  if (gap < 2000) score += 7
  if (gap < 500) score += 4
  if (gap <= 0) score += 3  // FIRE / objectif atteint
  score = Math.min(20, score)
  const label = score >= 17 ? 'Sur track' : score >= 10 ? 'En progression' : score >= 4 ? 'À compléter' : 'Non renseigné'
  return { score, label }
}

function scoreFiscal(hasTaxSim: boolean, hasPEA: boolean, hasPER: boolean, usedOptimalRegime: boolean): { score: number; label: string } {
  let score = 0
  if (hasTaxSim) score += 3
  if (hasPEA) score += 4
  if (usedOptimalRegime) score += 4
  if (hasPER) score += 4
  score = Math.min(15, score)
  const label = score >= 13 ? 'Optimisé' : score >= 7 ? 'Bien' : score >= 3 ? 'À améliorer' : 'Non renseigné'
  return { score, label }
}

function scoreDebt(ratio: number | null): { score: number; label: string } {
  if (ratio === null) return { score: 5, label: 'Données inconnues' }
  if (ratio > 0.40) return { score: Math.round((1 - ratio) * 10), label: 'Élevé' }
  if (ratio > 0.30) return { score: Math.round(4 + (0.40 - ratio) / 0.10 * 3), label: 'Moyen' }
  return { score: Math.round(7 + (0.30 - ratio) / 0.30 * 3), label: 'Sain' }
}

// ── Quick actions generator ───────────────────────────────────────────────────

function getQuickActions(details: ScoreDetails): { label: string; href: string; pts: number }[] {
  const actions: { label: string; href: string; pts: number }[] = []
  if (details.fiscal.score < 8 && !details.fiscal.hasTaxSim) {
    actions.push({ label: 'Lance la simulation Impôts IR', href: '/dashboard/tax', pts: 3 })
  }
  if (details.fiscal.score < 12 && !details.fiscal.hasPEA) {
    actions.push({ label: 'Déclare ton PEA dans le patrimoine', href: '/dashboard/patrimoine', pts: 4 })
  }
  if (!details.retirement.hasSim) {
    actions.push({ label: 'Lance la simulation Retraite', href: '/dashboard/retirement', pts: 3 })
  }
  if (details.savings.score < 10) {
    actions.push({ label: "Analyse ton taux d'épargne", href: '/dashboard/savings-rate', pts: 4 })
  }
  if (details.emergency.months === null) {
    actions.push({ label: 'Ajoute un Livret ou une Trésorerie', href: '/dashboard/patrimoine', pts: 5 })
  }
  return actions.slice(0, 3)
}

interface ScoreDetails {
  savings: { score: number; max: number; rate: number; label: string }
  emergency: { score: number; max: number; months: number | null; label: string }
  diversification: { score: number; max: number; types: string[]; label: string }
  retirement: { score: number; max: number; hasSim: boolean; gap: number; label: string }
  fiscal: { score: number; max: number; hasTaxSim: boolean; hasPEA: boolean; hasPER: boolean; label: string }
  debt: { score: number; max: number; ratio: number | null; label: string }
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const userId = session.user.id

  // Fetch all simulations + envelopes in parallel
  const [allSims, envelopes] = await Promise.all([
    prisma.simulation.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    prisma.patrimoineEnvelope.findMany({
      where: { portfolio: { userId } },
      include: { positions: true },
    }),
  ])

  // Get latest sim per type
  const latestByType: Record<string, { inputs: any; results: any }> = {}
  for (const sim of allSims) {
    if (!latestByType[sim.type]) {
      latestByType[sim.type] = { inputs: sim.inputs as any, results: sim.results as any }
    }
  }

  // ── 1. Taux d'épargne (20 pts)
  const budgetSim = latestByType['budget'] || latestByType['savings-rate']
  const savingsRate = budgetSim?.results?.savingsRate ?? 0
  const savingsResult = scoreSavingsRate(savingsRate)

  // ── 2. Épargne d'urgence (15 pts)
  const cashEnvelopes = envelopes.filter(e => e.type === 'CASH' || e.type === 'LIVRET')
  const cashBalance = cashEnvelopes.reduce((sum, e) => {
    const meta = e.metadata as any
    return sum + (meta?.balance ?? meta?.currentValue ?? 0)
  }, 0)
  const monthlyExpenses = budgetSim?.results?.expenses
    ? (budgetSim.results as any).expenses / 12
    : (budgetSim?.inputs as any)?.expenses
      ? (budgetSim.inputs as any).expenses / 12
      : null
  const emergencyMonths = (cashBalance > 0 && monthlyExpenses)
    ? Math.round((cashBalance / monthlyExpenses) * 10) / 10
    : cashBalance > 0 ? null : null
  const emergencyResult = emergencyMonths !== null
    ? scoreEmergency(emergencyMonths)
    : { score: 7, label: 'Données inconnues' }  // neutral

  // ── 3. Diversification (20 pts)
  const envelopeTypes = envelopes.map(e => e.type)
  const totalValue = envelopes.reduce((sum, e) => {
    const meta = e.metadata as any
    return sum + (meta?.balance ?? meta?.currentValue ?? 0)
  }, 0)
  const cryptoValue = envelopes
    .filter(e => e.type === 'CRYPTO')
    .reduce((sum, e) => {
      const meta = e.metadata as any
      return sum + (meta?.balance ?? meta?.currentValue ?? 0)
    }, 0)
  const cryptoRatio = totalValue > 0 ? cryptoValue / totalValue : 0
  const diversResult = scoreDiversification(envelopeTypes, cryptoRatio)

  // ── 4. Préparation retraite (20 pts)
  const retSim = latestByType['retirement']
  const hasPER = envelopes.some(e => e.type === 'PER')
  const retGap = (retSim?.results as any)?.gap ?? 9999
  const retResult = scoreRetirement(!!retSim, retGap, hasPER)

  // ── 5. Optimisation fiscale (15 pts)
  const taxSim = latestByType['tax']
  const hasPEA = envelopes.some(e => e.type === 'PEA')
  const usedOptimal = !!(taxSim?.results as any)?.optimalRegime
  const fiscalResult = scoreFiscal(!!taxSim, hasPEA, hasPER, usedOptimal)

  // ── 6. Endettement sain (10 pts)
  const mortSim = latestByType['mortgage']
  const debtRatio = mortSim ? ((mortSim.results as any)?.ratio ?? null) : null
  const debtResult = scoreDebt(debtRatio)

  // ── Total
  const total = savingsResult.score + emergencyResult.score + diversResult.score +
    retResult.score + fiscalResult.score + debtResult.score

  const details: ScoreDetails = {
    savings:         { score: savingsResult.score, max: 20, rate: savingsRate, label: savingsResult.label },
    emergency:       { score: emergencyResult.score, max: 15, months: emergencyMonths, label: emergencyResult.label },
    diversification: { score: diversResult.score, max: 20, types: envelopeTypes, label: diversResult.label },
    retirement:      { score: retResult.score, max: 20, hasSim: !!retSim, gap: retGap, label: retResult.label },
    fiscal:          { score: fiscalResult.score, max: 15, hasTaxSim: !!taxSim, hasPEA, hasPER, label: fiscalResult.label },
    debt:            { score: debtResult.score, max: 10, ratio: debtRatio, label: debtResult.label },
  }

  // Store score
  await prisma.patrimoineScore.create({ data: { userId, score: total, details: details as object } })

  // History (last 12 entries)
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
