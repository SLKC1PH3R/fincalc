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
