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
}

export interface TaxResults {
  netIncome: number
  imposable: number
  ir: number
  cotisations: number
  avgRate: number
  tmi: number
  totalLevy: number
  brackets: { label: string; rate: number; ir: number; active: boolean }[]
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
  const abattement = Math.min(netBeforeTax * 0.1, 14171)
  const imposable = netBeforeTax - abattement

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
      active: perPart > b.min && perPart <= b.max,
    }
  }).filter(b => b.ir > 0 || b.active)

  const ir = irPerPart * i.parts
  const netIncome = i.gross - cotisations - ir
  const avgRate = i.gross > 0 ? ir / i.gross * 100 : 0

  return { netIncome, imposable, ir, cotisations, avgRate, tmi, totalLevy: cotisations + ir, brackets }
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
