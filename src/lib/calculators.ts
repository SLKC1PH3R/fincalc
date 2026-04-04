import { fmt } from "@/lib/fmt"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CompoundInputs {
  capital: number
  monthly: number
  rate: number
  years: number
  frequency: number
}

export interface CompoundResults {
  final: number
  invested: number
  interest: number
  roi: number
  multiplier: number
  chartData: { year: number; total: number; invested: number }[]
}

export interface FireInputs {
  income: number
  expenses: number
  netWorth: number
  rate: number
  withdrawalRate: number
}

export interface FireResults {
  target: number
  progressPct: number
  yearsToFire: number
  annualSavings: number
  savingsRate: number
  monthlyPassive: number
}

export interface TaxInputs {
  gross: number
  parts: number
  csRate: number
  regime: 'salarie' | 'independant' | 'micro'
  fraisReels: number
  useFraisReels: boolean
}

export interface TaxResults {
  netIncome: number
  imposable: number
  ir: number
  cotisations: number
  avgRate: number
  tmi: number
  totalLevy: number
  abattement: number
  netBeforeTax: number
  effectivePressure: number
  brackets: { label: string; rate: number; ir: number; active: boolean; taxable: number }[]
  analysis: {
    score: 'excellent' | 'bon' | 'moyen' | 'eleve'
    message: string
    tips: string[]
  }
}

export interface BuyRentInputs {
  price: number
  down: number
  loanRate: number
  rent: number
  years: number
  appreciation: number
  investReturn: number
}

export interface BuyRentResults {
  buyNetWorth: number
  rentCapital: number
  totalBuyCost: number
  totalRentCost: number
  propertyValue: number
  breakevenYears: number
  buyWins: boolean
  delta: number
}

export interface MortgageInputs {
  amount: number
  rate: number
  years: number
  insurance: number
  fees: number
}

export interface MortgageResults {
  monthlyPayment: number
  totalMonthly: number
  totalCost: number
  totalInterest: number
  totalInsurance: number
  taeg: number
  ratio: number
  chartData: { year: number; capitalRepaid: number; remaining: number }[]
}

// ─── Calculators ────────────────────────────────────────────────────────────

export function calcCompound(i: CompoundInputs): CompoundResults {
  const rn = i.rate / 100 / i.frequency
  const periods = i.frequency * i.years
  const pmtPerPeriod = i.monthly * 12 / i.frequency

  const fvLump = i.capital * Math.pow(1 + rn, periods)
  const fvAnnuity = rn > 0 ? pmtPerPeriod * ((Math.pow(1 + rn, periods) - 1) / rn) : pmtPerPeriod * periods
  const final = fvLump + fvAnnuity
  const invested = i.capital + i.monthly * 12 * i.years
  const interest = final - invested

  const chartData = Array.from({ length: i.years + 1 }, (_, y) => {
    const p = i.frequency * y
    const fvL = i.capital * Math.pow(1 + rn, p)
    const fvA = p > 0 && rn > 0 ? pmtPerPeriod * ((Math.pow(1 + rn, p) - 1) / rn) : pmtPerPeriod * p
    return { year: y, total: Math.round(fvL + fvA), invested: Math.round(i.capital + i.monthly * 12 * y) }
  })

  return { final, invested, interest, roi: interest / invested * 100, multiplier: final / i.capital, chartData }
}

export function calcFire(i: FireInputs): FireResults {
  const target = i.expenses / (i.withdrawalRate / 100)
  const progressPct = Math.min(i.netWorth / target * 100, 100)
  const annualSavings = i.income - i.expenses
  const savingsRate = i.income > 0 ? annualSavings / i.income * 100 : 0
  const rate = i.rate / 100

  let years = 0
  let nw = i.netWorth
  while (nw < target && years < 100) {
    nw = nw * (1 + rate) + annualSavings
    years++
  }

  return { target, progressPct, yearsToFire: years, annualSavings, savingsRate, monthlyPassive: i.expenses / 12 }
}

export function calcTax(i: TaxInputs): TaxResults {
  const cotisations = i.gross * i.csRate / 100
  const netBeforeTax = i.gross - cotisations

  // Abattement : frais réels ou forfait 10% (plafonné à 14 171€, min 495€)
  let abattement: number
  if (i.useFraisReels && i.fraisReels > 0) {
    abattement = i.fraisReels
  } else {
    abattement = Math.min(Math.max(netBeforeTax * 0.1, 495), 14171)
  }

  const imposable = Math.max(0, netBeforeTax - abattement)

  const BRACKETS = [
    { min: 0, max: 11294, rate: 0 },
    { min: 11294, max: 28797, rate: 0.11 },
    { min: 28797, max: 82341, rate: 0.30 },
    { min: 82341, max: 177106, rate: 0.41 },
    { min: 177106, max: Infinity, rate: 0.45 },
  ]

  const perPart = imposable / i.parts
  let irPerPart = 0
  let tmi = 0
  const brackets = BRACKETS.map(b => {
    const taxable = Math.max(0, Math.min(perPart, b.max) - b.min)
    const irBracket = taxable * b.rate
    irPerPart += irBracket
    if (perPart > b.min) tmi = b.rate * 100
    return {
      label: b.max === Infinity ? `> ${b.min.toLocaleString('fr')}€` : `${b.min.toLocaleString('fr')} — ${b.max.toLocaleString('fr')}€`,
      rate: b.rate * 100,
      ir: irBracket * i.parts,
      taxable: taxable * i.parts,
      active: perPart > b.min && perPart <= b.max,
    }
  }).filter(b => b.taxable > 0 || b.active)

  const ir = irPerPart * i.parts
  const netIncome = i.gross - cotisations - ir
  const avgRate = i.gross > 0 ? ir / i.gross * 100 : 0
  const effectivePressure = i.gross > 0 ? (cotisations + ir) / i.gross * 100 : 0

  // Analyse & conseils
  let score: TaxResults['analysis']['score']
  let message: string
  const tips: string[] = []

  if (effectivePressure < 20) {
    score = 'excellent'
    message = 'Pression fiscale et sociale faible — votre situation est très favorable.'
  } else if (effectivePressure < 35) {
    score = 'bon'
    message = 'Pression fiscale modérée — situation dans la moyenne française.'
  } else if (effectivePressure < 50) {
    score = 'moyen'
    message = 'Pression fiscale significative — des optimisations sont possibles.'
  } else {
    score = 'eleve'
    message = 'Pression fiscale élevée — optimisation fiscale fortement recommandée.'
  }

  if (tmi >= 30 && !i.useFraisReels) tips.push('Comparez vos frais réels avec l\'abattement forfaitaire de 10% — si vos frais professionnels dépassent ' + Math.round(abattement).toLocaleString('fr') + '€, optez pour les frais réels.')
  if (tmi >= 41) tips.push('À votre TMI de ' + tmi + '%, versements sur un PER (Plan Épargne Retraite) déductibles du revenu imposable — économie directe.')
  if (tmi >= 30) tips.push('Investissement locatif en déficit foncier ou SCPI peut réduire votre base imposable.')
  if (i.parts === 1 && tmi >= 30) tips.push('Si applicable, reconnaître un enfant à charge ou mariage peut augmenter le nombre de parts fiscales.')
  if (cotisations > 15000) tips.push('Statut indépendant : envisagez une structure en société (SASU/EURL) pour optimiser la rémunération vs dividendes.')
  if (tips.length === 0) tips.push('Votre situation fiscale est bien optimisée pour votre niveau de revenus.')

  return {
    netIncome, imposable, ir, cotisations, avgRate, tmi,
    totalLevy: cotisations + ir, abattement, netBeforeTax,
    effectivePressure, brackets,
    analysis: { score, message, tips }
  }
}

export function calcBuyRent(i: BuyRentInputs): BuyRentResults {
  const loan = i.price - i.down
  const n = i.years * 12
  const rMonthly = i.loanRate / 100 / 12
  const monthly = loan * rMonthly / (1 - Math.pow(1 + rMonthly, -n))
  const fees = i.price * 0.08

  let remaining = loan
  for (let m = 0; m < n; m++) {
    remaining = remaining * (1 + rMonthly) - monthly
  }
  const propVal = i.price * Math.pow(1 + i.appreciation / 100, i.years)
  const buyNetWorth = propVal - Math.max(0, remaining)

  const diff = monthly - i.rent
  let invested = i.down
  for (let m = 0; m < n; m++) {
    invested = invested * (1 + i.investReturn / 100 / 12) + Math.max(0, diff)
  }

  let be = 0, bPropVal = i.price, bRemaining = loan, bRentCapital = i.down
  while (be < 40) {
    be++
    for (let m = 0; m < 12; m++) {
      bPropVal *= (1 + i.appreciation / 100 / 12)
      bRemaining = bRemaining * (1 + rMonthly) - monthly
      bRentCapital *= (1 + i.investReturn / 100 / 12)
      bRentCapital += Math.max(0, monthly - i.rent)
    }
    if (bPropVal - Math.max(0, bRemaining) >= bRentCapital) break
  }

  return {
    buyNetWorth,
    rentCapital: invested,
    totalBuyCost: i.down + fees + monthly * n,
    totalRentCost: i.rent * n,
    propertyValue: propVal,
    breakevenYears: be,
    buyWins: buyNetWorth > invested,
    delta: Math.abs(buyNetWorth - invested),
  }
}

export function calcMortgage(i: MortgageInputs): MortgageResults {
  const n = i.years * 12
  const rMonthly = i.rate / 100 / 12
  const monthly = i.amount * rMonthly / (1 - Math.pow(1 + rMonthly, -n))
  const totalPaid = monthly * n
  const totalInterest = totalPaid - i.amount
  const totalInsurance = i.insurance * n
  const totalWithAll = totalPaid + totalInsurance + i.fees
  const taeg = ((totalWithAll - i.amount) / i.amount / i.years) * 100

  let remaining = i.amount
  const chartData = [{ year: 0, capitalRepaid: 0, remaining: Math.round(i.amount) }]
  for (let y = 1; y <= i.years; y++) {
    for (let m = 0; m < 12; m++) {
      const intPart = remaining * rMonthly
      remaining -= monthly - intPart
    }
    chartData.push({ year: y, capitalRepaid: Math.round(i.amount - Math.max(0, remaining)), remaining: Math.round(Math.max(0, remaining)) })
  }

  return { monthlyPayment: monthly, totalMonthly: monthly + i.insurance, totalCost: totalWithAll - i.amount, totalInterest, totalInsurance, taeg, ratio: totalInterest / i.amount * 100, chartData }
}

// ─── Rentabilité Locative ────────────────────────────────────────────────────

export interface RentalInputs {
  price: number          // Prix d'achat
  notaryFees: number     // Frais notaire %
  works: number          // Travaux
  rent: number           // Loyer mensuel HC
  charges: number        // Charges mensuelles
  taxeFonciere: number   // Taxe foncière annuelle
  insurance: number      // Assurance PNO annuelle
  vacancy: number        // Taux vacance %
  loanAmount: number     // Montant emprunté
  loanRate: number       // Taux crédit %
  loanYears: number      // Durée crédit
  regime: 'nu' | 'meuble' | 'lmnp' // Régime fiscal
  marginalRate: number   // TMI %
}

export interface RentalResults {
  totalInvestment: number
  grossYield: number
  netYield: number
  cashflowMonthly: number
  cashflowAnnual: number
  monthlyLoan: number
  annualRent: number
  annualCharges: number
  annualVacancyLoss: number
  netOperatingIncome: number
  annualWorksDeduction: number  // Amortissement travaux annuel (works/10)
  taxableIncome: number
  tax: number
  roi: number
  breakevenYears: number
  analysis: { score: 'excellent' | 'bon' | 'moyen' | 'negatif'; message: string; tips: string[] }
}

export function calcRental(i: RentalInputs): RentalResults {
  const totalInvestment = i.price * (1 + i.notaryFees / 100) + i.works
  const annualRent = i.rent * 12
  const effectiveRent = annualRent * (1 - i.vacancy / 100)
  const annualCharges = i.charges * 12
  const vacancyLoss = annualRent - effectiveRent

  const grossYield = (annualRent / totalInvestment) * 100
  const netOperatingIncome = effectiveRent - annualCharges - i.taxeFonciere - i.insurance

  // Loan
  const rM = i.loanRate / 100 / 12
  const n = i.loanYears * 12
  const monthlyLoan = i.loanAmount > 0 && rM > 0
    ? i.loanAmount * rM / (1 - Math.pow(1 + rM, -n))
    : 0
  const annualLoan = monthlyLoan * 12
  const annualInterests = i.loanAmount > 0 ? i.loanAmount * (i.loanRate / 100) : 0

  // Amortissement travaux : 10 ans (déductible en régime réel nu et LMNP)
  const annualWorksDeduction = i.works > 0 ? i.works / 10 : 0

  // Tax by regime
  let taxableIncome = 0
  let tax = 0
  if (i.regime === 'nu') {
    // Régime réel : déduction intérêts + charges + amortissement travaux
    taxableIncome = Math.max(0, netOperatingIncome - annualInterests - annualWorksDeduction)
    tax = taxableIncome * (i.marginalRate / 100) * 1.172 // IR + PS 17.2%
  } else if (i.regime === 'meuble') {
    // Micro-BIC : abattement 50% forfaitaire (travaux non déductibles directement)
    taxableIncome = Math.max(0, effectiveRent * 0.5)
    tax = taxableIncome * (i.marginalRate / 100)
  } else {
    // LMNP réel : amortissement du bien + travaux → revenu fiscal souvent nul
    taxableIncome = Math.max(0, netOperatingIncome - annualInterests - annualWorksDeduction)
    tax = Math.max(0, taxableIncome * (i.marginalRate / 100))
  }

  const cashflowAnnual = netOperatingIncome - annualLoan - tax
  const cashflowMonthly = cashflowAnnual / 12
  const netYield = (netOperatingIncome / totalInvestment) * 100

  const equity = totalInvestment - i.loanAmount
  const roi = equity > 0 ? (cashflowAnnual / equity) * 100 : 0

  const breakevenYears = cashflowAnnual > 0
    ? Math.ceil((totalInvestment - i.loanAmount) / cashflowAnnual)
    : 99

  const score: RentalResults['analysis']['score'] =
    cashflowMonthly >= 200 ? 'excellent'
    : cashflowMonthly >= 0 ? 'bon'
    : cashflowMonthly >= -200 ? 'moyen'
    : 'negatif'

  const tips: string[] = []
  if (grossYield < 5) tips.push('Rendement brut < 5% : difficile d\'atteindre un cashflow positif. Négociez le prix d\'achat ou cherchez un loyer plus élevé.')
  if (i.vacancy > 5) tips.push('Taux de vacance > 5% : vérifiez la tension locative du marché local avant d\'investir.')
  if (i.regime === 'nu' && i.marginalRate >= 30) tips.push(`À ${i.marginalRate}% de TMI, le LMNP est souvent plus avantageux fiscalement que la location nue.`)
  if (cashflowMonthly < 0) tips.push('Cashflow négatif : l\'effort d\'épargne mensuel est de ' + fmt(Math.abs(cashflowMonthly)) + '. Acceptez si la plus-value potentielle compense.')
  if (tips.length === 0) tips.push('Bon investissement locatif. Pensez à revaloriser le loyer annuellement selon l\'IRL.')

  const message = score === 'excellent' ? `Excellent investissement : +${fmt(cashflowMonthly)}/mois de cashflow net.`
    : score === 'bon' ? `Cashflow légèrement positif (${fmt(cashflowMonthly)}/mois). Investissement équilibré.`
    : score === 'moyen' ? `Cashflow légèrement négatif (${fmt(cashflowMonthly)}/mois). Effort d'épargne limité.`
    : `Cashflow très négatif (${fmt(cashflowMonthly)}/mois). Revoir le montage.`

  return { totalInvestment, grossYield, netYield, cashflowMonthly, cashflowAnnual, monthlyLoan, annualRent, annualCharges, annualVacancyLoss: vacancyLoss, netOperatingIncome, annualWorksDeduction, taxableIncome, tax, roi, breakevenYears, analysis: { score, message, tips } }
}

// ─── DCA ─────────────────────────────────────────────────────────────────────

export interface DCAInputs {
  monthly: number        // Versement mensuel
  years: number          // Durée
  targetRate: number     // Rendement annuel moyen attendu
  volatility: number     // Volatilité annuelle simulée %
  initialPrice: number   // Prix unitaire initial (ex: ETF)
  startingCapital?: number  // Capital déjà investi (optionnel)
}

export interface DCAResults {
  totalInvested: number
  estimatedValue: number
  avgCostBasis: number
  units: number
  gain: number
  gainPct: number
  chartData: { month: number; invested: number; value: number; price: number }[]
  vsLumpSum: number
}

export function calcDCA(i: DCAInputs): DCAResults {
  const months = i.years * 12
  const monthlyRate = i.targetRate / 100 / 12
  const monthlyVol = i.volatility / 100 / Math.sqrt(12)

  const initCapital = i.startingCapital ?? 0
  let totalInvested = initCapital
  let units = initCapital > 0 && i.initialPrice > 0 ? initCapital / i.initialPrice : 0
  let price = i.initialPrice
  const chartData = []

  // Simulate month by month with deterministic sine-wave volatility (reproducible)
  for (let m = 1; m <= months; m++) {
    // Price evolution: trend + cyclical component (no random — reproducible)
    const trend = Math.pow(1 + monthlyRate, m)
    const cycle = 1 + monthlyVol * Math.sin(m * Math.PI / 6) * 2
    price = i.initialPrice * trend * cycle

    const bought = i.monthly / price
    units += bought
    totalInvested += i.monthly

    if (m % 3 === 0 || m === months) {
      chartData.push({
        month: m,
        invested: Math.round(totalInvested),
        value: Math.round(units * price),
        price: Math.round(price * 100) / 100,
      })
    }
  }

  const estimatedValue = units * price
  const avgCostBasis = totalInvested / units
  const gain = estimatedValue - totalInvested
  const gainPct = (gain / totalInvested) * 100

  // Lump sum comparison : invest all at once at month 0
  const lumpSum = totalInvested * Math.pow(1 + i.targetRate / 100, i.years)
  const vsLumpSum = estimatedValue - lumpSum

  return { totalInvested, estimatedValue, avgCostBasis, units, gain, gainPct, chartData, vsLumpSum }
}

// ─── Retraite (formules officielles 2026) ────────────────────────────────────

// Constantes officielles 2026
const PASS_2025          = 47_100   // Plafond Annuel Sécurité Sociale 2025
const PASS_GROWTH        = 0.02     // Revalorisation annuelle estimée du PASS
const QUARTERS_REQUIS    = 172      // 43 ans — nés après 1973
const AGE_LEGAL          = 64       // Âge légal de départ depuis réforme 2023
const AGE_AUTO_PLEIN     = 67       // Taux plein automatique
const POINT_VALEUR_2025  = 1.4386   // Valeur de service point Agirc-Arrco (nov 2024)
const POINT_VALEUR_GROWTH = 0.015   // Revalorisation annuelle estimée
const POINT_ACHAT_2025   = 19.3768  // Valeur d'acquisition du point Agirc-Arrco 2025
const TAUX_ARCO_T1       = 0.062    // Part répartition T1 (≤ PASS) pour acquisition de points
const TAUX_ARCO_T2       = 0.170    // Part répartition T2 (> PASS)

export interface RetirementInputs {
  age: number           // Âge actuel
  quarters: number      // Trimestres validés à ce jour
  pointsArrco: number   // Points Agirc-Arrco accumulés à ce jour
  salary: number        // Salaire brut annuel actuel (€)
  salaryGrowth: number  // Progression salariale estimée (%/an)
  departureAge: number  // Âge de départ pour le scénario principal
}

export interface RetirementScenario {
  age: number
  trimestres: number
  tauxPlein: boolean
  autoTauxPlein: boolean
  trimDecote: number    // Nb trimestres de décote appliqués
  trimSurcote: number   // Nb trimestres de surcote accumulés
  decotePct: number     // Décote en % (ex: 0.0125 = 1,25%)
  surcotePct: number    // Surcote en % cumulée
  tauxFinal: number     // Taux appliqué au SAM (entre ~0.25 et 0.75+)
  sam: number           // Salaire Annuel Moyen nominal à cet âge
  prorata: number       // min(trimestres, 172) / 172
  pensionBase: number   // Retraite de base brute mensuelle
  totalPoints: number   // Points Agirc-Arrco à cet âge
  pensionArrco: number  // Retraite Agirc-Arrco brute mensuelle
  pensionBrute: number  // Total brut mensuel
  pensionNette: number  // Net après prélèvements (~84%)
  replacementRate: number // Taux de remplacement vs salaire net actuel
}

export interface RetirementResults {
  scenarios: RetirementScenario[]
  main: RetirementScenario
  annualPtsArrco: number   // Points Agirc-Arrco gagnés par an (au salaire actuel)
  ageQuotaPlein: number    // Âge où les 172 trimestres sont atteints
  analysis: { score: 'excellent' | 'bon' | 'moyen' | 'faible'; message: string; tips: string[] }
}

export function calcRetirement(i: RetirementInputs): RetirementResults {
  const pass0 = PASS_2025
  const pointVal0 = POINT_VALEUR_2025

  // Âge d'obtention du taux plein (quota trimestres)
  const trimManquants = Math.max(0, QUARTERS_REQUIS - i.quarters)
  const ageQuotaPlein = i.age + trimManquants / 4

  // Points Agirc-Arrco accumulés par an au salaire actuel
  const annualPtsArrco =
    Math.min(i.salary, pass0) * TAUX_ARCO_T1 / POINT_ACHAT_2025 +
    Math.max(0, i.salary - pass0) * TAUX_ARCO_T2 / POINT_ACHAT_2025

  const scenarios: RetirementScenario[] = []

  for (let depAge = 62; depAge <= 70; depAge++) {
    const years = depAge - i.age
    if (years < 0) continue

    // Projections nominales à la date de départ
    const salary_dep = i.salary * Math.pow(1 + i.salaryGrowth / 100, years)
    const pass_dep   = pass0 * Math.pow(1 + PASS_GROWTH, years)
    const pointVal_dep = pointVal0 * Math.pow(1 + POINT_VALEUR_GROWTH, years)

    const trimestres   = i.quarters + years * 4
    const tauxPleinQuota = trimestres >= QUARTERS_REQUIS
    const autoTauxPlein  = depAge >= AGE_AUTO_PLEIN
    const tauxPlein      = tauxPleinQuota || autoTauxPlein

    // Décote (si ni quota ni auto-plein)
    let trimDecote = 0
    if (!tauxPlein) {
      const trimManqQuota = Math.max(0, QUARTERS_REQUIS - trimestres)
      const trimAvant67   = Math.max(0, (AGE_AUTO_PLEIN - depAge) * 4)
      trimDecote = Math.min(20, Math.min(trimManqQuota, trimAvant67))
    }
    const decotePct = trimDecote * 0.0125

    // Surcote (trimestres travaillés après que les 2 conditions sont simultanément remplies)
    let trimSurcote = 0
    if (depAge > AGE_LEGAL) {
      const ageSurcoteStart = Math.max(AGE_LEGAL, ageQuotaPlein)
      trimSurcote = Math.max(0, Math.floor((depAge - ageSurcoteStart) * 4))
    }
    const surcotePct = trimSurcote * 0.0125

    // Taux appliqué (décote ou surcote, jamais les deux)
    const tauxFinal = tauxPlein ? 0.50 + surcotePct : Math.max(0.25, 0.50 - decotePct)

    // SAM : min(salaire projeté, PASS projeté) — approx 25 meilleures années
    const sam = Math.min(salary_dep, pass_dep)

    // Prorata trimestres de base
    const prorata = Math.min(trimestres, QUARTERS_REQUIS) / QUARTERS_REQUIS

    // Pension de base mensuelle brute (€ nominaux futurs)
    const pensionBase = (sam / 12) * tauxFinal * prorata

    // Points Agirc-Arrco à la date de départ
    const totalPoints = i.pointsArrco + annualPtsArrco * years
    const pensionArrco = (totalPoints * pointVal_dep) / 12

    const pensionBrute = pensionBase + pensionArrco
    const pensionNette = pensionBrute * 0.84  // ~16% prélèvements sociaux retraités

    // Taux de remplacement vs salaire net actuel
    const salNetActuel = i.salary * 0.78 / 12
    const replacementRate = salNetActuel > 0 ? (pensionNette / salNetActuel) * 100 : 0

    scenarios.push({
      age: depAge, trimestres, tauxPlein, autoTauxPlein,
      trimDecote, trimSurcote, decotePct, surcotePct,
      tauxFinal, sam, prorata,
      pensionBase, totalPoints, pensionArrco,
      pensionBrute, pensionNette, replacementRate,
    })
  }

  const main = scenarios.find(s => s.age === i.departureAge) ?? scenarios.find(s => s.age === AGE_LEGAL) ?? scenarios[0]!

  const score: RetirementResults['analysis']['score'] =
    main.replacementRate >= 75 ? 'excellent'
    : main.replacementRate >= 60 ? 'bon'
    : main.replacementRate >= 45 ? 'moyen'
    : 'faible'

  const tips: string[] = []
  if (!main.tauxPlein && main.trimDecote > 0)
    tips.push(`Décote de ${(main.decotePct * 100).toFixed(2)}% (${main.trimDecote} trimestres manquants). Cotiser jusqu'à ${Math.ceil(ageQuotaPlein)} ans suffit pour l'éviter.`)
  if (main.trimSurcote > 0)
    tips.push(`Surcote de ${(main.surcotePct * 100).toFixed(2)}% grâce à ${main.trimSurcote} trimestres supplémentaires. Chaque trimestre de plus vaut +1,25% de pension à vie.`)
  if (!main.tauxPlein && main.age < AGE_AUTO_PLEIN)
    tips.push(`Partir à ${AGE_AUTO_PLEIN} ans vous garantit le taux plein automatique sans condition de trimestres.`)
  if (tips.length === 0)
    tips.push('Vérifiez votre relevé de carrière sur info-retraite.fr chaque année pour détecter les trimestres manquants tôt.')

  const message = score === 'excellent' ? `Excellent taux de remplacement (${main.replacementRate.toFixed(0)}%) — votre retraite sera confortable.`
    : score === 'bon' ? `Taux de remplacement correct (${main.replacementRate.toFixed(0)}%). Quelques ajustements pour optimiser.`
    : score === 'moyen' ? `Taux de remplacement de ${main.replacementRate.toFixed(0)}% — baisse de niveau de vie notable sans épargne complémentaire.`
    : `Taux de remplacement faible (${main.replacementRate.toFixed(0)}%) — constituez une épargne complémentaire dès maintenant.`

  return { scenarios, main, annualPtsArrco, ageQuotaPlein, analysis: { score, message, tips } }
}

// ─── Budget 50/30/20 ─────────────────────────────────────────────────────────

export interface BudgetInputs {
  netIncome: number      // Revenu net mensuel
  housing: number        // Logement
  food: number           // Alimentation
  transport: number      // Transport
  health: number         // Santé
  utilities: number      // Abonnements / charges
  otherNeeds: number     // Autres besoins
  leisure: number        // Loisirs
  shopping: number       // Shopping
  restaurants: number    // Restaurants / sorties
  otherWants: number     // Autres envies
  savings: number        // Épargne
  debt: number           // Remboursements dettes
  otherSavings: number   // Autres épargne/investissement
}

export interface BudgetResults {
  needs: number; needsPct: number; needsTarget: number
  wants: number; wantsPct: number; wantsTarget: number
  savingsTotal: number; savingsPct: number; savingsTarget: number
  balance: number
  categories: { name: string; amount: number; type: 'needs' | 'wants' | 'savings' }[]
  analysis: { score: 'excellent' | 'bon' | 'moyen' | 'desequilibre'; message: string; tips: string[] }
}

export function calcBudget(i: BudgetInputs): BudgetResults {
  const needs = i.housing + i.food + i.transport + i.health + i.utilities + i.otherNeeds
  const wants = i.leisure + i.shopping + i.restaurants + i.otherWants
  const savingsTotal = i.savings + i.debt + i.otherSavings

  const needsPct = i.netIncome > 0 ? (needs / i.netIncome) * 100 : 0
  const wantsPct = i.netIncome > 0 ? (wants / i.netIncome) * 100 : 0
  const savingsPct = i.netIncome > 0 ? (savingsTotal / i.netIncome) * 100 : 0
  const balance = i.netIncome - needs - wants - savingsTotal

  const categories = [
    { name: 'Logement', amount: i.housing, type: 'needs' as const },
    { name: 'Alimentation', amount: i.food, type: 'needs' as const },
    { name: 'Transport', amount: i.transport, type: 'needs' as const },
    { name: 'Santé', amount: i.health, type: 'needs' as const },
    { name: 'Abonnements', amount: i.utilities, type: 'needs' as const },
    { name: 'Autres besoins', amount: i.otherNeeds, type: 'needs' as const },
    { name: 'Loisirs', amount: i.leisure, type: 'wants' as const },
    { name: 'Shopping', amount: i.shopping, type: 'wants' as const },
    { name: 'Restaurants', amount: i.restaurants, type: 'wants' as const },
    { name: 'Autres envies', amount: i.otherWants, type: 'wants' as const },
    { name: 'Épargne', amount: i.savings, type: 'savings' as const },
    { name: 'Remboursements', amount: i.debt, type: 'savings' as const },
    { name: 'Investissements', amount: i.otherSavings, type: 'savings' as const },
  ].filter(c => c.amount > 0)

  const score: BudgetResults['analysis']['score'] =
    needsPct <= 52 && wantsPct <= 32 && savingsPct >= 18 ? 'excellent'
    : needsPct <= 60 && savingsPct >= 10 ? 'bon'
    : savingsPct >= 5 ? 'moyen'
    : 'desequilibre'

  const tips: string[] = []
  if (needsPct > 60) tips.push(`Besoins à ${needsPct.toFixed(0)}% du revenu (cible : 50%) — le logement représente souvent le plus gros poste à optimiser.`)
  if (wantsPct > 35) tips.push(`Envies à ${wantsPct.toFixed(0)}% (cible : 30%) — identifiez les 2-3 postes "plaisir" à réduire en priorité.`)
  if (savingsPct < 10) tips.push(`Épargne à ${savingsPct.toFixed(0)}% (cible : 20%) — automatisez un virement épargne dès réception du salaire.`)
  if (balance > 50) tips.push(`Solde non alloué : ${fmt(balance)} — affectez cet argent à l\'épargne plutôt qu\'à la consommation implicite.`)
  if (i.housing / i.netIncome > 0.35) tips.push('Logement > 35% du revenu net : zone de risque. Cherchez à réduire ou augmenter vos revenus.')
  if (tips.length === 0) tips.push('Budget très bien équilibré ! Pensez à revoir votre allocation épargne selon vos objectifs FIRE.')

  const message = score === 'excellent' ? 'Budget parfaitement équilibré selon la règle 50/30/20.'
    : score === 'bon' ? 'Budget globalement sain avec quelques ajustements possibles.'
    : score === 'moyen' ? 'Budget déséquilibré — l\'épargne est insuffisante par rapport aux recommandations.'
    : 'Budget très déséquilibré — action immédiate recommandée sur les postes de dépenses.'

  return { needs, needsPct, needsTarget: i.netIncome * 0.5, wants, wantsPct, wantsTarget: i.netIncome * 0.3, savingsTotal, savingsPct, savingsTarget: i.netIncome * 0.2, balance, categories, analysis: { score, message, tips } }
}

// ─── Flat Tax vs Barème IR ────────────────────────────────────────────────

export interface FlatTaxInputs {
  amount: number                              // Revenus du capital bruts
  incomeType: 'dividends' | 'capital_gains' | 'interest'
  tmi: number                                 // 0 | 11 | 30 | 41 | 45
  revenuTravail: number                       // Revenus d'activité annuels (pour tranches)
  parts: number
  isCouple: boolean
}

export interface FlatTaxRegime {
  abattement: number
  csgDed: number
  baseIR: number
  ir: number
  ps: number
  total: number
  effectiveRate: number
}

export interface FlatTaxResults {
  flatTax: FlatTaxRegime
  bareme: FlatTaxRegime
  recommended: 'flat_tax' | 'bareme'
  saving: number
  chartData: { amount: number; flatTax: number; bareme: number }[]
  optimalRegime: 'flat_tax' | 'bareme'
}

const IR_BRACKETS = [
  { min: 0,       max: 11294,   rate: 0 },
  { min: 11294,   max: 28797,   rate: 0.11 },
  { min: 28797,   max: 82341,   rate: 0.30 },
  { min: 82341,   max: 177106,  rate: 0.41 },
  { min: 177106,  max: Infinity, rate: 0.45 },
]

function calcIRMarginal(base: number, parts: number): number {
  const perPart = base / parts
  let ir = 0
  for (const b of IR_BRACKETS) {
    const taxable = Math.max(0, Math.min(perPart, b.max) - b.min)
    ir += taxable * b.rate
  }
  return ir * parts
}

export function calcFlatTax(i: FlatTaxInputs): FlatTaxResults {
  const PS = 0.172

  // ── Flat Tax (PFU 30%)
  const ftPS = i.amount * PS
  const ftIR = i.amount * 0.128
  const ftTotal = ftIR + ftPS
  const flatTax: FlatTaxRegime = {
    abattement: 0, csgDed: 0, baseIR: i.amount,
    ir: ftIR, ps: ftPS, total: ftTotal,
    effectiveRate: i.amount > 0 ? ftTotal / i.amount * 100 : 0,
  }

  // ── Barème réel
  const abattement = i.incomeType === 'dividends' ? i.amount * 0.40 : 0
  const baseAfterAbt = i.amount - abattement
  const csgDed = baseAfterAbt * 0.068  // CSG déductible uniquement au barème
  const baseIR = Math.max(0, baseAfterAbt - csgDed)
  const totalBase = i.revenuTravail + baseIR
  const irTotal = calcIRMarginal(totalBase, i.parts)
  const irWork  = calcIRMarginal(i.revenuTravail, i.parts)
  const irCapital = Math.max(0, irTotal - irWork)
  const bmPS = i.amount * PS
  const bmTotal = irCapital + bmPS
  const bareme: FlatTaxRegime = {
    abattement, csgDed, baseIR,
    ir: irCapital, ps: bmPS, total: bmTotal,
    effectiveRate: i.amount > 0 ? bmTotal / i.amount * 100 : 0,
  }

  const recommended = flatTax.total <= bareme.total ? 'flat_tax' : 'bareme'
  const saving = Math.abs(flatTax.total - bareme.total)

  // Chart: flat tax vs barème for 10 amount steps 0→max or 0→100k
  const maxChart = Math.max(i.amount, 10000)
  const chartData = Array.from({ length: 11 }, (_, k) => {
    const a = (k / 10) * maxChart
    const ft = a * 0.30
    // simplified barème curve at current params
    const abt = i.incomeType === 'dividends' ? a * 0.40 : 0
    const base = (a - abt) * (1 - 0.068)
    const tot = i.revenuTravail + base
    const irT = calcIRMarginal(tot, i.parts)
    const irW = calcIRMarginal(i.revenuTravail, i.parts)
    const bm = Math.max(0, irT - irW) + a * PS
    return { amount: Math.round(a), flatTax: Math.round(ft), bareme: Math.round(bm) }
  })

  return { flatTax, bareme, recommended, saving, chartData, optimalRegime: recommended }
}

// ─── PEA vs CTO vs Assurance-vie ─────────────────────────────────────────

export interface EnvelopeCompareInputs {
  capital: number
  monthly: number
  rateGross: number      // % annuel brut
  years: number
  tmi: number            // 0 | 11 | 30 | 41 | 45
  isCouple: boolean
  peaOpenYears: number   // années déjà ouvertes (pour calculer la maturité fiscale PEA)
}

export interface EnvelopeResult {
  grossValue: number
  totalInvested: number
  grossGain: number
  taxPS: number
  taxIR: number
  taxTotal: number
  netValue: number
  netGain: number
  netAnnualRate: number
}

export interface EnvelopeCompareResults {
  pea: EnvelopeResult
  cto: EnvelopeResult
  av: EnvelopeResult
  best: 'pea' | 'cto' | 'av'
  chartData: { year: number; pea: number; cto: number; av: number }[]
}

function growEnvelope(capital: number, monthly: number, annualRate: number, years: number): { value: number; invested: number } {
  const monthlyRate = annualRate / 100 / 12
  let value = capital
  for (let m = 0; m < years * 12; m++) {
    value = value * (1 + monthlyRate) + monthly
  }
  return { value: Math.round(value), invested: Math.round(capital + monthly * years * 12) }
}

function calcOneEnvelope(i: EnvelopeCompareInputs, years: number, type: 'pea' | 'cto' | 'av'): EnvelopeResult {
  const PS = 0.172
  const avAbattement = i.isCouple ? 9200 : 4600
  const { value: grossValue, invested: totalInvested } = growEnvelope(i.capital, i.monthly, i.rateGross, years)
  const grossGain = Math.max(0, grossValue - totalInvested)

  let taxIR = 0, taxPS = 0
  if (type === 'pea') {
    const mature = (i.peaOpenYears + years) >= 5
    taxPS = mature ? grossGain * PS : grossGain * 0.30
    taxIR = 0
  } else if (type === 'cto') {
    taxPS = grossGain * PS
    taxIR = grossGain * 0.128
  } else {
    // AV ≥ 8 ans hypothèse (abattement annuel)
    taxPS = grossGain * PS
    taxIR = Math.max(0, grossGain - avAbattement) * 0.075
  }

  const taxTotal = taxIR + taxPS
  const netValue = grossValue - taxTotal
  const netGain = netValue - totalInvested
  const netAnnualRate = totalInvested > 0 && years > 0 ? (Math.pow(netValue / totalInvested, 1 / years) - 1) * 100 : 0
  return { grossValue, totalInvested, grossGain, taxPS, taxIR, taxTotal, netValue, netGain, netAnnualRate }
}

export function calcEnvelopeCompare(i: EnvelopeCompareInputs): EnvelopeCompareResults {
  const pea = calcOneEnvelope(i, i.years, 'pea')
  const cto = calcOneEnvelope(i, i.years, 'cto')
  const av  = calcOneEnvelope(i, i.years, 'av')

  const best: 'pea' | 'cto' | 'av' = pea.netValue >= cto.netValue && pea.netValue >= av.netValue
    ? 'pea' : av.netValue >= cto.netValue ? 'av' : 'cto'

  const maxY = Math.min(i.years, 40)
  const step = Math.max(1, Math.floor(maxY / 20))
  const chartData: { year: number; pea: number; cto: number; av: number }[] = [
    { year: 0, pea: i.capital, cto: i.capital, av: i.capital }
  ]
  for (let y = step; y < maxY; y += step) {
    chartData.push({
      year: y,
      pea: calcOneEnvelope(i, y, 'pea').netValue,
      cto: calcOneEnvelope(i, y, 'cto').netValue,
      av:  calcOneEnvelope(i, y, 'av').netValue,
    })
  }
  chartData.push({ year: maxY, pea: pea.netValue, cto: cto.netValue, av: av.netValue })

  return { pea, cto, av, best, chartData }
}

// ─── Épargne d'urgence ───────────────────────────────────────────────────────

export interface EmergencyFundInputs {
  monthlyExpenses: number
  employmentType: 'cdi' | 'cdd' | 'freelance' | 'none'
  familySituation: 'single' | 'couple' | 'family'
  currentSavings: number
  monthlySavings: number
}

export interface EmergencyFundResults {
  targetMonths: number
  targetAmount: number
  gap: number
  isReached: boolean
  monthsToReach: number | null
  coverageRatio: number
  recommendation: string
  chartData: { label: string; value: number; target: number }[]
}

export function calcEmergencyFund(i: EmergencyFundInputs): EmergencyFundResults {
  let baseMonths = i.employmentType === 'cdi' ? 3 : 6
  if (i.familySituation === 'couple') baseMonths += 1
  if (i.familySituation === 'family') baseMonths += 2

  const targetMonths = Math.min(baseMonths, 9)
  const targetAmount = i.monthlyExpenses * targetMonths
  const gap = Math.max(0, targetAmount - i.currentSavings)
  const isReached = i.currentSavings >= targetAmount
  const coverageRatio = targetAmount > 0 ? Math.min(i.currentSavings / targetAmount, 1) : 0
  const monthsToReach = (!isReached && i.monthlySavings > 0)
    ? Math.ceil(gap / i.monthlySavings)
    : isReached ? 0 : null

  const recMap: Record<string, string> = {
    cdi: `En CDI, 3 mois de charges est la règle minimale. Votre situation familiale porte l'objectif à ${targetMonths} mois.`,
    cdd: `En CDD, préférez 6 mois minimum. Votre objectif est de ${targetMonths} mois de charges.`,
    freelance: `En freelance, l'irrégularité des revenus rend 6 à 9 mois indispensables. Objectif : ${targetMonths} mois.`,
    none: `Sans activité professionnelle régulière, visez ${targetMonths} mois de charges pour tenir face à l'imprévu.`,
  }

  const chartData = Array.from({ length: targetMonths }, (_, m) => ({
    label: `${m + 1} mois`,
    value: i.monthlyExpenses * (m + 1),
    target: targetAmount,
  }))

  return {
    targetMonths,
    targetAmount,
    gap,
    isReached,
    monthsToReach,
    coverageRatio,
    recommendation: recMap[i.employmentType],
    chartData,
  }
}

// ─── Coût réel d'un crédit conso ────────────────────────────────────────────

export interface ConsumerCreditInputs {
  amount: number
  taeg: number          // taux annuel en %
  durationMonths: number
  alternativeRate: number  // rendement placement annuel en %
}

export interface ConsumerCreditResults {
  monthlyPayment: number
  totalPaid: number
  totalInterest: number
  alternativeGain: number
  opportunityCost: number
  amortizationData: { month: number; remaining: number; totalPaid: number }[]
}

export function calcConsumerCredit(i: ConsumerCreditInputs): ConsumerCreditResults {
  const r = i.taeg / 100 / 12
  const n = i.durationMonths
  const monthlyPayment = r > 0
    ? i.amount * r / (1 - Math.pow(1 + r, -n))
    : i.amount / n
  const totalPaid = monthlyPayment * n
  const totalInterest = totalPaid - i.amount

  // Ce que le capital aurait rapporté si placé au lieu d'être remboursé
  const altR = i.alternativeRate / 100 / 12
  let altValue = i.amount
  for (let m = 0; m < n; m++) {
    altValue = altValue * (1 + altR) - monthlyPayment
  }
  const alternativeGain = Math.max(0, i.amount * Math.pow(1 + i.alternativeRate / 100, n / 12) - i.amount)
  const opportunityCost = totalInterest + alternativeGain

  const amortizationData: { month: number; remaining: number; totalPaid: number }[] = [
    { month: 0, remaining: i.amount, totalPaid: 0 }
  ]
  let remaining = i.amount
  for (let m = 1; m <= n; m++) {
    const interest = remaining * r
    const principal = monthlyPayment - interest
    remaining = Math.max(0, remaining - principal)
    if (m % Math.max(1, Math.floor(n / 24)) === 0 || m === n) {
      amortizationData.push({ month: m, remaining: Math.round(remaining), totalPaid: Math.round(monthlyPayment * m) })
    }
  }

  return { monthlyPayment, totalPaid, totalInterest, alternativeGain, opportunityCost, amortizationData }
}

// ─── Succession & Donation ───────────────────────────────────────────────────

export type SuccessionRelationship = 'enfant' | 'petit_enfant' | 'frere_soeur' | 'neveu_niece' | 'autre'

export interface SuccessionInputs {
  amount: number
  relationship: SuccessionRelationship
  donationsLast15Years: number
  isDonation: boolean  // true = donation, false = succession
}

export interface SuccessionResults {
  abattementMax: number
  abattementUsed: number
  abattementRemaining: number
  taxableBase: number
  dmtg: number
  netTransmitted: number
  effectiveRate: number
  slabs: { tranche: string; taux: number; impot: number }[]
}

function calcDMTG(base: number, rel: SuccessionRelationship): { total: number; slabs: { tranche: string; taux: number; impot: number }[] } {
  type Slab = { limit: number; rate: number }
  const SLABS_ENFANT: Slab[] = [
    { limit: 8072,    rate: 0.05 },
    { limit: 12109,   rate: 0.10 },
    { limit: 15932,   rate: 0.15 },
    { limit: 552324,  rate: 0.20 },
    { limit: 902838,  rate: 0.30 },
    { limit: 1805677, rate: 0.40 },
    { limit: Infinity, rate: 0.45 },
  ]
  const SLABS_FRERE: Slab[] = [
    { limit: 24430,    rate: 0.35 },
    { limit: Infinity, rate: 0.45 },
  ]
  const FLAT_NEVEU   = 0.55
  const FLAT_AUTRE   = 0.60

  const slabs = rel === 'enfant' || rel === 'petit_enfant' ? SLABS_ENFANT
    : rel === 'frere_soeur' ? SLABS_FRERE
    : null

  const result: { tranche: string; taux: number; impot: number }[] = []
  let total = 0
  let remaining = base

  if (slabs) {
    let prev = 0
    for (const s of slabs) {
      if (remaining <= 0) break
      const width = s.limit === Infinity ? remaining : Math.min(s.limit - prev, remaining)
      const impot = width * s.rate
      if (width > 0) {
        result.push({
          tranche: s.limit === Infinity ? `> ${prev.toLocaleString('fr-FR')} €` : `${prev.toLocaleString('fr-FR')} – ${s.limit.toLocaleString('fr-FR')} €`,
          taux: s.rate * 100,
          impot: Math.round(impot),
        })
      }
      total += impot
      remaining -= width
      prev = s.limit
    }
  } else {
    const rate = rel === 'neveu_niece' ? FLAT_NEVEU : FLAT_AUTRE
    const impot = base * rate
    result.push({ tranche: 'Taux unique', taux: rate * 100, impot: Math.round(impot) })
    total = impot
  }

  return { total, slabs: result }
}

export function calcSuccession(i: SuccessionInputs): SuccessionResults {
  const ABATTEMENTS: Record<SuccessionRelationship, number> = {
    enfant:       100_000,
    petit_enfant:  31_865,
    frere_soeur:   15_932,
    neveu_niece:    7_967,
    autre:          1_594,
  }
  const abattementMax = ABATTEMENTS[i.relationship]
  const abattementUsed = Math.min(i.donationsLast15Years, abattementMax)
  const abattementRemaining = abattementMax - abattementUsed
  const abattementApplied = Math.min(i.amount, abattementRemaining)
  const taxableBase = Math.max(0, i.amount - abattementApplied)
  const { total: dmtg, slabs } = calcDMTG(taxableBase, i.relationship)
  const netTransmitted = i.amount - dmtg
  const effectiveRate = i.amount > 0 ? (dmtg / i.amount) * 100 : 0

  return {
    abattementMax,
    abattementUsed,
    abattementRemaining,
    taxableBase,
    dmtg: Math.round(dmtg),
    netTransmitted: Math.round(netTransmitted),
    effectiveRate,
    slabs,
  }
}

// ─── Livrets réglementés ──────────────────────────────────────────────────────

export interface LivretsInputs {
  balance: number     // Montant initial
  monthly: number     // Versement mensuel
  duration: number    // Durée en années
}

export interface LivretsResults {
  livrets: Array<{
    name: string; rate: number; cap: number
    final: number; interest: number; isCapped: boolean
  }>
  etfGrossFinal: number
  etfNetFinal: number   // net de flat tax 30%
  opportunity: number   // écart avec le meilleur livret
  chartData: Array<{ year: number; livretA: number; lep: number; etf: number }>
}

export function calcLivrets(i: LivretsInputs): LivretsResults {
  function fv(bal: number, mth: number, rateAnnual: number, years: number, cap: number) {
    if (years === 0) return Math.min(bal, cap)
    const b = Math.min(bal, cap)
    const maxMth = Math.max(0, (cap - b) / (years * 12))
    const m = Math.min(mth, maxMth)
    const r = rateAnnual / 100
    const mr = r / 12
    const n = years * 12
    const fvB = b * Math.pow(1 + r, years)
    const fvM = mr > 0 ? m * ((Math.pow(1 + mr, n) - 1) / mr) : m * n
    return Math.round(fvB + fvM)
  }

  const LIVRETS = [
    { name: 'Livret A',  rate: 3.0, cap: 22950 },
    { name: 'LDDS',      rate: 3.0, cap: 12000 },
    { name: 'LEP',       rate: 4.0, cap: 10000 },
    { name: 'CEL',       rate: 2.0, cap: 15300 },
  ]

  const livrets = LIVRETS.map(l => {
    const final = fv(i.balance, i.monthly, l.rate, i.duration, l.cap)
    const b = Math.min(i.balance, l.cap)
    const maxMth = Math.max(0, (l.cap - b) / (i.duration * 12 || 1))
    const m = Math.min(i.monthly, maxMth)
    const invested = b + m * i.duration * 12
    return {
      name: l.name, rate: l.rate, cap: l.cap,
      final, interest: Math.max(0, final - invested),
      isCapped: i.balance > l.cap,
    }
  })

  const mr = 0.07 / 12
  const n = i.duration * 12
  const etfGross = Math.round(
    i.balance * Math.pow(1.07, i.duration) +
    (mr > 0 ? i.monthly * ((Math.pow(1 + mr, n) - 1) / mr) : i.monthly * n)
  )
  const invested = i.balance + i.monthly * n
  const gains = Math.max(0, etfGross - invested)
  const etfNet = Math.round(invested + gains * 0.70)

  const bestLivret = livrets.reduce((a, b) => a.final > b.final ? a : b)

  const chartData = Array.from({ length: i.duration + 1 }, (_, y) => {
    const etfY = (() => {
      if (y === 0) return i.balance
      const mry = 0.07 / 12
      const ny = y * 12
      const gross = Math.round(i.balance * Math.pow(1.07, y) + (mry > 0 ? i.monthly * ((Math.pow(1 + mry, ny) - 1) / mry) : i.monthly * ny))
      const inv = i.balance + i.monthly * ny
      return Math.round(inv + Math.max(0, gross - inv) * 0.70)
    })()
    return { year: y, livretA: fv(i.balance, i.monthly, 3.0, y, 22950), lep: fv(i.balance, i.monthly, 4.0, y, 10000), etf: etfY }
  })

  return { livrets, etfGrossFinal: etfGross, etfNetFinal: etfNet, opportunity: Math.max(0, etfNet - bestLivret.final), chartData }
}

// ─── Impact des frais ─────────────────────────────────────────────────────────

export interface FeesImpactInputs {
  capital: number
  monthly: number
  grossRate: number   // rendement brut (%)
  feeA: number        // frais scénario A (%)
  feeB: number        // frais scénario B (%)
  years: number
}

export interface FeesImpactResults {
  finalA: number
  finalB: number
  grossFinal: number
  difference: number
  pctLostA: number
  pctLostB: number
  chartData: Array<{ year: number; a: number; b: number; gross: number }>
}

export function calcFeesImpact(i: FeesImpactInputs): FeesImpactResults {
  function fv(rateNet: number, years: number) {
    if (years === 0) return i.capital
    const r = rateNet / 100
    const mr = r / 12
    const n = years * 12
    const fvC = i.capital * Math.pow(1 + r, years)
    const fvM = mr > 0 ? i.monthly * ((Math.pow(1 + mr, n) - 1) / mr) : i.monthly * n
    return Math.round(fvC + fvM)
  }
  const rateA = i.grossRate - i.feeA
  const rateB = i.grossRate - i.feeB
  const finalA = fv(rateA, i.years)
  const finalB = fv(rateB, i.years)
  const grossFinal = fv(i.grossRate, i.years)

  const chartData = Array.from({ length: i.years + 1 }, (_, y) => ({
    year: y, a: fv(rateA, y), b: fv(rateB, y), gross: fv(i.grossRate, y),
  }))

  return {
    finalA, finalB, grossFinal,
    difference: finalA - finalB,
    pctLostA: grossFinal > 0 ? (grossFinal - finalA) / grossFinal * 100 : 0,
    pctLostB: grossFinal > 0 ? (grossFinal - finalB) / grossFinal * 100 : 0,
    chartData,
  }
}

// ─── Inflation & pouvoir d'achat ──────────────────────────────────────────────

export interface InflationInputs {
  capital: number
  nominalRate: number    // rendement nominal (%)
  inflationRate: number  // taux d'inflation (%)
  years: number
}

export interface InflationResults {
  realRate: number
  nominalFinal: number
  realFinal: number
  cashFinal: number            // valeur réelle si on garde le cash
  purchasingPowerLoss: number  // perte de PA en gardant le cash
  chartData: Array<{ year: number; nominal: number; real: number; cash: number }>
}

export function calcInflation(i: InflationInputs): InflationResults {
  const n = i.nominalRate / 100
  const inf = i.inflationRate / 100
  const realRate = ((1 + n) / (1 + inf) - 1) * 100
  const nominalFinal = Math.round(i.capital * Math.pow(1 + n, i.years))
  const realFinal = Math.round(nominalFinal / Math.pow(1 + inf, i.years))
  const cashFinal = Math.round(i.capital / Math.pow(1 + inf, i.years))

  const chartData = Array.from({ length: i.years + 1 }, (_, y) => ({
    year: y,
    nominal: Math.round(i.capital * Math.pow(1 + n, y)),
    real: Math.round(i.capital * Math.pow(1 + n, y) / Math.pow(1 + inf, y)),
    cash: Math.round(i.capital / Math.pow(1 + inf, y)),
  }))

  return { realRate, nominalFinal, realFinal, cashFinal, purchasingPowerLoss: i.capital - cashFinal, chartData }
}

// ─── Plus-value immobilière ───────────────────────────────────────────────────

export interface PlusValueInputs {
  acquisitionPrice: number
  fraisAcquisitionPct: number  // frais notaire/agence (%) par défaut 7.5
  travaux: number
  useForfaitTravaux: boolean   // forfait 15% (si détention > 5 ans)
  cessionPrice: number
  fraisCessionPct: number      // frais agence vente (%)
  duration: number             // années de détention
  type: 'residence_principale' | 'secondaire' | 'locatif'
}

export interface PlusValueResults {
  prixRevientCorrige: number
  grossPV: number
  abatIR: number       // en %
  abatPS: number       // en %
  taxableIR: number
  taxablePS: number
  irDu: number         // 19%
  psDu: number         // 17.2%
  surtaxe: number
  totalTax: number
  netProfit: number
  exonereIR: boolean
  exonerePS: boolean
  analysis: string
}

export function calcPlusValue(i: PlusValueInputs): PlusValueResults {
  const fraisAcq = i.acquisitionPrice * i.fraisAcquisitionPct / 100
  const travauxMontant = (i.useForfaitTravaux && i.duration >= 5)
    ? i.acquisitionPrice * 0.15
    : i.travaux
  const prixRevient = i.acquisitionPrice + fraisAcq + travauxMontant
  const fraisCess = i.cessionPrice * i.fraisCessionPct / 100
  const grossPV = Math.max(0, i.cessionPrice - fraisCess - prixRevient)

  if (i.type === 'residence_principale') {
    return {
      prixRevientCorrige: Math.round(prixRevient), grossPV: Math.round(grossPV),
      abatIR: 100, abatPS: 100, taxableIR: 0, taxablePS: 0,
      irDu: 0, psDu: 0, surtaxe: 0, totalTax: 0,
      netProfit: Math.round(grossPV), exonereIR: true, exonerePS: true,
      analysis: 'Résidence principale : exonération totale de plus-value.',
    }
  }

  // Abattements IR : 6%/an de la 6e à la 21e année, 4% la 22e → 100%
  let abatIR = 0
  if (i.duration >= 22) abatIR = 100
  else if (i.duration >= 6) abatIR = (i.duration - 5) * 6

  // Abattements PS : 1.65%/an de 6 à 21 ans, 1.6% à 22 ans, 9%/an de 23 à 30 ans → 100%
  let abatPS = 0
  if (i.duration >= 30) abatPS = 100
  else if (i.duration >= 23) abatPS = 16 * 1.65 + 1.6 + (i.duration - 22) * 9
  else if (i.duration >= 22) abatPS = 16 * 1.65 + 1.6
  else if (i.duration >= 6) abatPS = (i.duration - 5) * 1.65
  abatPS = Math.min(100, abatPS)

  const taxableIR = Math.round(grossPV * (1 - abatIR / 100))
  const taxablePS = Math.round(grossPV * (1 - abatPS / 100))
  const irDu = Math.round(taxableIR * 0.19)
  const psDu = Math.round(taxablePS * 0.172)

  let surtaxe = 0
  if (taxableIR > 250000) surtaxe = taxableIR * 0.06
  else if (taxableIR > 200000) surtaxe = taxableIR * 0.05
  else if (taxableIR > 150000) surtaxe = taxableIR * 0.04
  else if (taxableIR > 100000) surtaxe = taxableIR * 0.03
  else if (taxableIR > 50000) surtaxe = taxableIR * 0.02
  surtaxe = Math.round(surtaxe)

  const totalTax = irDu + psDu + surtaxe
  const netProfit = Math.round(grossPV - totalTax)

  const analysis = i.duration >= 30
    ? 'Exonération totale (IR + PS) après 30 ans de détention.'
    : i.duration >= 22
    ? `Exonéré d'IR. PS encore dus — exonération totale dans ${30 - i.duration} ans.`
    : `Abattement IR : ${Math.round(abatIR)}% — Exonération IR dans ${22 - i.duration} ans, PS dans ${30 - i.duration} ans.`

  return {
    prixRevientCorrige: Math.round(prixRevient), grossPV: Math.round(grossPV),
    abatIR: Math.round(abatIR), abatPS: Math.round(abatPS),
    taxableIR, taxablePS, irDu, psDu, surtaxe, totalTax, netProfit,
    exonereIR: i.duration >= 22, exonerePS: i.duration >= 30, analysis,
  }
}

// ─── SCPI ─────────────────────────────────────────────────────────────────────

export interface SCPIInputs {
  capital: number
  distributionRate: number   // taux de distribution (%)
  revaluationRate: number    // revalorisation annuelle des parts (%)
  fraisSouscription: number  // frais d'entrée (%)
  tmi: number                // TMI (%)
  duration: number
}

export interface SCPIResults {
  capitalInvested: number
  annualIncome: number
  taxRate: number      // TMI + PS 17.2% (régime foncier)
  netIncome: number
  netYield: number
  finalValue: number   // valeur des parts après revalorisation
  totalNetIncome: number
  totalReturn: number  // revenus nets + PV parts
  roi: number
  chartData: Array<{ year: number; cumRevenu: number; valeurParts: number; total: number }>
}

export function calcSCPI(i: SCPIInputs): SCPIResults {
  const capitalInvested = Math.round(i.capital * (1 - i.fraisSouscription / 100))
  const annualIncome = Math.round(capitalInvested * i.distributionRate / 100)
  const taxRate = Math.min(i.tmi / 100 + 0.172, 0.672)
  const netIncome = Math.round(annualIncome * (1 - taxRate))
  const netYield = capitalInvested > 0 ? (netIncome / capitalInvested) * 100 : 0
  const finalValue = Math.round(capitalInvested * Math.pow(1 + i.revaluationRate / 100, i.duration))
  const totalNetIncome = netIncome * i.duration
  const totalReturn = totalNetIncome + Math.max(0, finalValue - capitalInvested)

  const chartData = Array.from({ length: i.duration + 1 }, (_, y) => {
    const parts = Math.round(capitalInvested * Math.pow(1 + i.revaluationRate / 100, y))
    const cumRev = netIncome * y
    return { year: y, cumRevenu: cumRev, valeurParts: parts, total: cumRev + parts }
  })

  return {
    capitalInvested, annualIncome, taxRate: taxRate * 100,
    netIncome, netYield, finalValue, totalNetIncome, totalReturn,
    roi: i.capital > 0 ? (totalReturn / i.capital) * 100 : 0,
    chartData,
  }
}

// ─── Viager ───────────────────────────────────────────────────────────────────

export interface ViagerInputs {
  valeurVenale: number
  ageVendeur: number
  type: 'occupe' | 'libre'
  bouquetPct: number   // % de la valeur nette comme bouquet (0–50)
  taux: number         // taux technique actuariel (%)
}

export interface ViagerResults {
  bouquet: number
  valeurNette: number
  baseRente: number
  renteAnnuelle: number
  renteMensuelle: number
  esperanceVie: number
  seuilEquilibre: number
  totalVersementsEsperance: number
  coefficientUsufruit: number
}

export function calcViager(i: ViagerInputs): ViagerResults {
  // Espérance de vie résiduelle mixte H/F (INSEE 2023 approx)
  function ev(age: number): number {
    const table: [number, number][] = [[50,35],[55,30],[60,26],[65,22],[70,18],[75,14],[80,10],[85,7],[90,4]]
    const clamped = Math.max(50, Math.min(90, age))
    for (let k = 0; k < table.length - 1; k++) {
      const [a1,e1] = table[k], [a2,e2] = table[k+1]
      if (clamped >= a1 && clamped <= a2) return e1 + (e2-e1)*(clamped-a1)/(a2-a1)
    }
    return table[table.length-1][1]
  }
  // Coefficient usufruit barème CGI 669
  function usufruit(age: number): number {
    if (age < 21) return 0.90; if (age < 31) return 0.80; if (age < 41) return 0.70
    if (age < 51) return 0.60; if (age < 61) return 0.50; if (age < 71) return 0.40
    if (age < 81) return 0.30; if (age < 91) return 0.20; return 0.10
  }

  const cu = usufruit(i.ageVendeur)
  const esperanceVie = ev(i.ageVendeur)
  const droitUsageHabitation = i.type === 'occupe' ? i.valeurVenale * cu * 0.6 : 0
  const valeurNette = Math.round(i.valeurVenale - droitUsageHabitation)
  const bouquet = Math.round(valeurNette * i.bouquetPct / 100)
  const baseRente = valeurNette - bouquet

  const r = i.taux / 100
  const n = esperanceVie
  const renteAnnuelle = r > 0
    ? Math.round(baseRente * r / (1 - Math.pow(1+r, -n)))
    : Math.round(baseRente / n)
  const renteMensuelle = Math.round(renteAnnuelle / 12)
  const seuilEquilibre = renteAnnuelle > 0 ? Math.ceil((valeurNette - bouquet) / renteAnnuelle) : 999

  return {
    bouquet, valeurNette, baseRente, renteAnnuelle, renteMensuelle,
    esperanceVie, seuilEquilibre,
    totalVersementsEsperance: Math.round(bouquet + renteAnnuelle * esperanceVie),
    coefficientUsufruit: cu,
  }
}
