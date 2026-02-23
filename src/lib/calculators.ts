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

  // Tax by regime
  let taxableIncome = 0
  let tax = 0
  if (i.regime === 'nu') {
    // Régime réel : déduction intérêts + charges
    taxableIncome = Math.max(0, netOperatingIncome - annualInterests)
    tax = taxableIncome * (i.marginalRate / 100) * 1.172 // IR + PS 17.2%
  } else if (i.regime === 'meuble') {
    // LMNP réel : abattement 50% micro-BIC ou réel
    taxableIncome = Math.max(0, effectiveRent * 0.5)
    tax = taxableIncome * (i.marginalRate / 100)
  } else {
    // LMNP : amortissement ~ 0 fiscal pendant 10-15 ans
    taxableIncome = 0
    tax = 0
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

  return { totalInvestment, grossYield, netYield, cashflowMonthly, cashflowAnnual, monthlyLoan, annualRent, annualCharges, annualVacancyLoss: vacancyLoss, netOperatingIncome, taxableIncome, tax, roi, breakevenYears, analysis: { score, message, tips } }
}

// ─── DCA ─────────────────────────────────────────────────────────────────────

export interface DCAInputs {
  monthly: number        // Versement mensuel
  years: number          // Durée
  targetRate: number     // Rendement annuel moyen attendu
  volatility: number     // Volatilité annuelle simulée %
  initialPrice: number   // Prix unitaire initial (ex: ETF)
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

  let totalInvested = 0
  let units = 0
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

// ─── Retraite ────────────────────────────────────────────────────────────────

export interface RetirementInputs {
  age: number            // Âge actuel
  retirementAge: number  // Âge de départ
  salary: number         // Salaire brut annuel actuel
  quarters: number       // Trimestres validés
  regime: 'prive' | 'fonctionnaire'
  perAnnual: number      // Versements PER annuels
  perRate: number        // Rendement PER %
  savingsRate: number    // Taux épargne complémentaire %
  investRate: number     // Rendement épargne %
}

export interface RetirementResults {
  yearsToRetirement: number
  quartersNeeded: number
  quartersMissing: number
  baseMonthly: number       // Retraite de base estimée
  complementMonthly: number // Retraite complémentaire (Agirc/Arrco)
  totalMonthly: number      // Total brut
  netMonthly: number        // Net après prélèvements
  replacementRate: number   // Taux de remplacement
  perCapital: number        // Capital PER à la retraite
  perMonthly: number        // Rente PER mensuelle
  additionalSavings: number // Épargne complémentaire accumulée
  totalIncome: number       // Revenu mensuel total
  gap: number               // Écart vs salaire actuel net
  analysis: { score: 'excellent' | 'bon' | 'moyen' | 'faible'; message: string; tips: string[] }
}

export function calcRetirement(i: RetirementInputs): RetirementResults {
  const yearsToRetirement = i.retirementAge - i.age
  const quartersNeeded = i.regime === 'prive' ? 172 : 167 // 43 ans / 41.75 ans
  const quartersMissing = Math.max(0, quartersNeeded - i.quarters - yearsToRetirement * 4)

  // Retraite de base (régime général) : SAM × taux × (trimestres / quartersNeeded)
  const sam = i.salary * 0.75 // Salaire annuel moyen approx
  const rate = quartersMissing === 0 ? 0.5 : 0.5 * (1 - quartersMissing * 0.00625)
  const baseAnnual = sam * Math.max(0.25, rate)
  const baseMonthly = baseAnnual / 12

  // Retraite complémentaire (Agirc-Arrco) : approximation 60% de la base
  const complementMonthly = i.regime === 'prive' ? baseMonthly * 0.6 : baseMonthly * 0.4

  const totalMonthly = baseMonthly + complementMonthly
  const netMonthly = totalMonthly * 0.84 // -16% prélèvements retraités
  const netSalary = i.salary * 0.78 / 12  // Salaire net mensuel approx
  const replacementRate = (netMonthly / netSalary) * 100

  // PER
  const perCapital = i.perAnnual > 0
    ? i.perAnnual * ((Math.pow(1 + i.perRate / 100, yearsToRetirement) - 1) / (i.perRate / 100))
    : 0
  const perMonthly = perCapital > 0 ? perCapital / (20 * 12) : 0 // Rente sur 20 ans

  // Épargne complémentaire
  const annualSavings = (i.salary * 0.78) * (i.savingsRate / 100)
  const additionalSavings = annualSavings > 0
    ? annualSavings * ((Math.pow(1 + i.investRate / 100, yearsToRetirement) - 1) / (i.investRate / 100))
    : 0
  const addMonthly = additionalSavings / (20 * 12)

  const totalIncome = netMonthly + perMonthly + addMonthly
  const gap = netSalary - totalIncome

  const score: RetirementResults['analysis']['score'] =
    replacementRate >= 75 ? 'excellent'
    : replacementRate >= 60 ? 'bon'
    : replacementRate >= 45 ? 'moyen'
    : 'faible'

  const tips: string[] = []
  if (quartersMissing > 0) tips.push(`Il vous manque ~${quartersMissing} trimestres pour le taux plein. La décote est de ${(quartersMissing * 0.625).toFixed(1)}%.`)
  if (i.perAnnual === 0) tips.push('Aucun versement PER : déductible du revenu imposable, le PER est l\'outil retraite le plus efficace fiscalement.')
  if (replacementRate < 60) tips.push('Taux de remplacement < 60% : constituez une épargne complémentaire via PEA ou assurance-vie pour combler l\'écart.')
  if (yearsToRetirement > 20 && i.savingsRate === 0) tips.push('Avec ' + yearsToRetirement + ' ans devant vous, même 5% d\'épargne mensuelle produit un effet composé considérable.')
  if (tips.length === 0) tips.push('Bonne préparation retraite. Vérifiez votre relevé de carrière sur Info-Retraite.fr chaque année.')

  const message = score === 'excellent' ? `Excellent taux de remplacement (${replacementRate.toFixed(0)}%) — votre retraite sera confortable.`
    : score === 'bon' ? `Taux de remplacement correct (${replacementRate.toFixed(0)}%). Quelques ajustements pour optimiser.`
    : score === 'moyen' ? `Taux de remplacement de ${replacementRate.toFixed(0)}% — baisse de niveau de vie significative sans épargne complémentaire.`
    : `Taux de remplacement faible (${replacementRate.toFixed(0)}%) — action urgente recommandée.`

  return { yearsToRetirement, quartersNeeded, quartersMissing, baseMonthly, complementMonthly, totalMonthly, netMonthly, replacementRate, perCapital, perMonthly, additionalSavings, totalIncome, gap, analysis: { score, message, tips } }
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
