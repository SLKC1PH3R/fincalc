import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ─── Liste blanche des emails autorisés ──────────────────────────────────────
  const allowedEmails = [
    'admin@example.com',
    'user1@example.com',
    'demo@digitalstack.cloud',
  ]

  for (const email of allowedEmails) {
    await prisma.allowedEmail.upsert({
      where: { email },
      update: {},
      create: { email },
    })
    console.log(`✅ Email autorisé : ${email}`)
  }

  // ─── Compte admin par défaut ──────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
  const adminName = process.env.ADMIN_NAME || 'Admin'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: await bcrypt.hash(adminPassword, 12),
    },
  })
  console.log(`✅ Compte admin créé : ${adminEmail}`)

  // ─── Compte démo ──────────────────────────────────────────────────────────────
  const DEMO_EMAIL = 'demo@digitalstack.cloud'
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      name: 'Utilisateur Démo',
      password: await bcrypt.hash('demo@2026', 12),
    },
  })
  console.log(`✅ Compte démo créé : ${DEMO_EMAIL}`)

  // Supprimer les anciennes simulations du démo pour éviter les doublons
  await prisma.simulation.deleteMany({ where: { userId: demoUser.id } })

  // ─── Simulations démo ────────────────────────────────────────────────────────
  const sims = [
    // ── Intérêts Composés ──────────────────────────────────────────────────────
    {
      type: 'compound',
      name: 'Plan épargne MSCI World — 20 ans',
      inputs: { initial: 15000, monthly: 400, rate: 8, years: 20 },
      results: { finalValue: 295420, totalInvested: 111000, totalGain: 184420, multiple: 2.66, cagr: 8 },
    },
    {
      type: 'compound',
      name: 'Constitution apport immobilier — 7 ans',
      inputs: { initial: 5000, monthly: 700, rate: 5, years: 7 },
      results: { finalValue: 75840, totalInvested: 63800, totalGain: 12040, multiple: 1.19, cagr: 5 },
    },

    // ── DCA ───────────────────────────────────────────────────────────────────
    {
      type: 'dca',
      name: 'DCA mensuel ETF World — 10 ans',
      inputs: { monthly: 300, rate: 7, years: 10 },
      results: { finalValue: 51940, totalInvested: 36000, totalGain: 15940, cagr: 7 },
    },
    {
      type: 'dca',
      name: 'DCA agressif 500€/mois — 15 ans',
      inputs: { monthly: 500, rate: 9, years: 15 },
      results: { finalValue: 194820, totalInvested: 90000, totalGain: 104820, cagr: 9 },
    },

    // ── FI/RE ─────────────────────────────────────────────────────────────────
    {
      type: 'fire',
      name: 'Objectif FI/RE à 50 ans',
      inputs: {
        currentAge: 32, targetRetirementAge: 50, monthlyExpenses: 2800,
        currentSavings: 45000, monthlyInvestment: 1800, returnRate: 7, withdrawalRate: 4,
      },
      results: { fireNumber: 840000, fireAge: 49, yearsToFire: 17, projectedAtTarget: 920000, isOnTrack: true },
    },

    // ── Acheter vs Louer ──────────────────────────────────────────────────────
    {
      type: 'buyrent',
      name: 'Appartement Paris 3P — achat vs location',
      inputs: {
        purchasePrice: 320000, downPayment: 64000, loanRate: 3.5, loanYears: 20,
        monthlyRent: 1500, propertyGrowth: 2, rentGrowth: 2, years: 20,
      },
      results: { buyCost: 284000, rentCost: 432000, breakEvenYear: 12, buyWins: true, netGainBuy: 148000 },
    },

    // ── Prêt Immobilier ───────────────────────────────────────────────────────
    {
      type: 'mortgage',
      name: 'Prêt résidence principale 250k€ — 20 ans',
      inputs: { amount: 250000, rate: 3.4, years: 20, insurance: 0.2 },
      results: { monthly: 1445, totalCost: 346800, totalInterest: 96800, totalInsurance: 10000, taeg: 3.62 },
    },
    {
      type: 'mortgage',
      name: 'Prêt investissement locatif Lyon',
      inputs: { amount: 155000, rate: 3.6, years: 20, insurance: 0.15 },
      results: { monthly: 907, totalCost: 217680, totalInterest: 62680, totalInsurance: 4650, taeg: 3.78 },
    },

    // ── Rentabilité Locative ──────────────────────────────────────────────────
    {
      type: 'rental',
      name: 'Studio Lyon 7e — investissement locatif',
      inputs: {
        apartments: [{
          label: 'Studio Lyon 7e', purchasePrice: 155000, rent: 820,
          charges: 120, taxeFonciere: 900, works: 8000,
        }],
      },
      results: {
        globalCashflowMonthly: 625, globalGrossYield: 6.35,
        globalNetYield: 4.82, globalROI: 5.1,
      },
    },

    // ── Impôts IR ─────────────────────────────────────────────────────────────
    {
      type: 'tax',
      name: 'Impôts 2025 — Cadre TMI 30%',
      inputs: { salary: 58000, parts: 1, otherIncome: 0, flatTaxIncome: 0 },
      results: { ir: 9480, tmi: 30, netSalary: 48520, averageRate: 16.3, revenuImposable: 52200 },
    },
    {
      type: 'tax',
      name: 'Impôts 2025 — Couple 2 enfants',
      inputs: { salary: 85000, parts: 3, otherIncome: 4800, flatTaxIncome: 0 },
      results: { ir: 8920, tmi: 11, netSalary: 80880, averageRate: 9.9, revenuImposable: 80700 },
    },

    // ── Flat Tax vs Barème ────────────────────────────────────────────────────
    {
      type: 'flat-tax',
      name: 'Dividendes CTO — Flat Tax vs Barème IR',
      inputs: { amount: 12000, incomeType: 'dividends', tmi: 30, annualRevenuTravail: 58000, parts: 1, isCouple: false },
      results: {
        flatTax: { ir: 1536, ps: 2064, total: 3600, effectiveRate: 30 },
        bareme: { abattement: 4800, csgDed: 490, ir: 2013, ps: 2064, total: 4077, effectiveRate: 33.98 },
        recommended: 'flat_tax', saving: 477, breakevenTMI: 30,
        chartData: [],
      },
    },
    {
      type: 'flat-tax',
      name: 'Plus-value CTO — TMI 11% (barème avantageux)',
      inputs: { amount: 8000, incomeType: 'capital_gains', tmi: 11, annualRevenuTravail: 28000, parts: 1, isCouple: false },
      results: {
        flatTax: { ir: 1024, ps: 1376, total: 2400, effectiveRate: 30 },
        bareme: { abattement: 0, csgDed: 544, ir: 808, ps: 1376, total: 2184, effectiveRate: 27.3 },
        recommended: 'bareme', saving: 216, breakevenTMI: 30,
        chartData: [],
      },
    },

    // ── PEA vs CTO vs AV ─────────────────────────────────────────────────────
    {
      type: 'envelope-compare',
      name: 'PEA vs CTO vs AV — 15 ans TMI 30%',
      inputs: { capital: 15000, monthly: 300, rateGross: 7, years: 15, tmi: 30, isCouple: false, peaOpenYears: 5 },
      results: {
        pea:  { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 0,    taxTotal: 10811, netValue: 121042, netGain: 52042, netEffectiveRate: 4.89 },
        cto:  { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 8045, taxTotal: 18856, netValue: 112997, netGain: 43997, netEffectiveRate: 4.25 },
        av:   { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 4369, taxTotal: 15180, netValue: 116673, netGain: 47673, netEffectiveRate: 4.52 },
        best: 'pea',
        chartData: [],
      },
    },

    // ── Retraite ─────────────────────────────────────────────────────────────
    {
      type: 'retirement',
      name: 'Simulation retraite — objectif 65 ans',
      inputs: { currentAge: 35, retirementAge: 65, monthlyExpenses: 2500, currentSavings: 30000, monthly: 500, rate: 6 },
      results: { fireNumber: 750000, projected: 646650, gap: 103350, monthlyShortfall: 343, onTrack: false },
    },

    // ── Taux d'épargne ────────────────────────────────────────────────────────
    {
      type: 'savings-rate',
      name: "Analyse taux d'épargne — mars 2026",
      inputs: {
        revenus: [
          { label: 'Salaire net', amount: 3800 },
          { label: 'Revenus locatifs', amount: 625 },
        ],
        investCats: [
          { label: 'ETF PEA', amount: 300 },
          { label: 'Livret A', amount: 150 },
          { label: 'PER', amount: 100 },
        ],
        depenseCats: [
          { label: 'Logement + charges', amount: 1100 },
          { label: 'Alimentation', amount: 450 },
          { label: 'Transport', amount: 250 },
          { label: 'Loisirs & sorties', amount: 280 },
          { label: 'Abonnements', amount: 95 },
        ],
      },
      results: { savingsRate: 12.43, totalRevenu: 4425, totalInvest: 550, totalDepense: 2175, balance: 1700 },
    },

    // ── Budget 50/30/20 ───────────────────────────────────────────────────────
    {
      type: 'budget',
      name: 'Budget 50/30/20 — salarié Lyon',
      inputs: { income: 3800, needs: 0.50, wants: 0.30, savings: 0.20 },
      results: {
        needsTarget: 1900, wantsTarget: 1140, savingsTarget: 760,
        actual: { needs: 1875, wants: 1125, savings: 800 },
        savingsRate: 21.1, expenses: 3000,
      },
    },
  ]

  for (const sim of sims) {
    await prisma.simulation.create({
      data: {
        userId: demoUser.id,
        type: sim.type,
        name: sim.name,
        inputs: sim.inputs,
        results: sim.results,
      },
    })
  }
  console.log(`✅ ${sims.length} simulations démo créées`)

  // ─── Patrimoine démo ──────────────────────────────────────────────────────────
  const oldPortfolio = await prisma.portfolio.findUnique({ where: { userId: demoUser.id } })
  if (oldPortfolio) {
    await prisma.portfolioPosition.deleteMany({ where: { portfolioId: oldPortfolio.id } })
    await prisma.patrimoineEnvelope.deleteMany({ where: { portfolioId: oldPortfolio.id } })
    await prisma.portfolio.delete({ where: { id: oldPortfolio.id } })
  }

  const portfolio = await prisma.portfolio.create({ data: { userId: demoUser.id } })

  const envelopes = [
    {
      type: 'PEA',   name: 'PEA Boursorama',
      sortOrder: 0,
      metadata: { broker: 'Boursorama', openDate: '2021-03-01', currentValue: 38500, depositedAmount: 26000 },
    },
    {
      type: 'AV',    name: 'AV Linxea Spirit 2',
      sortOrder: 1,
      metadata: { insurer: 'Spirica', openDate: '2020-06-15', surrenderValue: 24800, depositedAmount: 20000, fees: 0 },
    },
    {
      type: 'CTO',   name: 'CTO Degiro',
      sortOrder: 2,
      metadata: { broker: 'Degiro', currentValue: 9200, depositedAmount: 7500 },
    },
    {
      type: 'PER',   name: 'PER Individuel Linxea',
      sortOrder: 3,
      metadata: { provider: 'Linxea', balance: 14500, annualContribution: 1200 },
    },
    {
      type: 'LIVRET', name: 'Livret A',
      sortOrder: 4,
      metadata: { bank: 'Société Générale', balance: 7600, rate: 2.4 },
    },
    {
      type: 'LIVRET', name: 'LDDS',
      sortOrder: 5,
      metadata: { bank: 'Société Générale', balance: 3200, rate: 2.4 },
    },
    {
      type: 'IMMOBILIER', name: 'Résidence principale — Lyon 4e',
      sortOrder: 6,
      metadata: {
        address: 'Lyon 4e arrondissement', purchasePrice: 265000,
        currentValue: 285000, creditRemaining: 198000,
        monthlyPayment: 907, purchaseDate: '2022-09-01',
      },
    },
    {
      type: 'CRYPTO', name: 'Crypto (Ledger)',
      sortOrder: 7,
      metadata: { currentValue: 4200, assets: 'BTC, ETH' },
    },
    {
      type: 'CASH',  name: 'Compte courant',
      sortOrder: 8,
      metadata: { bank: 'Société Générale', balance: 2400 },
    },
  ]

  for (const env of envelopes) {
    await prisma.patrimoineEnvelope.create({
      data: {
        portfolioId: portfolio.id,
        type: env.type,
        name: env.name,
        sortOrder: env.sortOrder,
        metadata: env.metadata,
      },
    })
  }
  console.log(`✅ ${envelopes.length} enveloppes patrimoine démo créées`)

  console.log('🚀 Seed terminé !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
