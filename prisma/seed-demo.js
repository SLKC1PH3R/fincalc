#!/usr/bin/env node
// prisma/seed-demo.js — Seed complet (CJS, compatible container Docker)
// Usage : node /app/prisma/seed-demo.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // ─── Emails autorisés ────────────────────────────────────────────────────────
  const allowedEmails = [
    'admin@example.com',
    'user1@example.com',
    'demo@digitalstack.cloud',
  ]
  for (const email of allowedEmails) {
    await prisma.allowedEmail.upsert({ where: { email }, update: {}, create: { email } })
    console.log(`✅ Email autorisé : ${email}`)
  }

  // ─── Compte admin ─────────────────────────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase()
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

  // Purger les anciennes simulations démo (idempotent)
  await prisma.simulation.deleteMany({ where: { userId: demoUser.id } })

  // ─── Simulations démo ─────────────────────────────────────────────────────────
  const sims = [
    { type: 'compound', name: 'Plan épargne MSCI World — 20 ans',
      inputs: { capital: 15000, monthly: 400, rate: 8, years: 20, frequency: 12 },
      results: { finalValue: 295420, totalInvested: 111000, totalGain: 184420, multiple: 2.66, cagr: 8 } },
    { type: 'compound', name: 'Constitution apport immobilier — 7 ans',
      inputs: { capital: 5000, monthly: 700, rate: 5, years: 7, frequency: 12 },
      results: { finalValue: 75840, totalInvested: 63800, totalGain: 12040, multiple: 1.19, cagr: 5 } },
    { type: 'dca', name: 'DCA mensuel ETF World — 10 ans',
      inputs: { monthly: 300, targetRate: 7, years: 10, volatility: 15, initialPrice: 100 },
      results: { finalValue: 51940, totalInvested: 36000, totalGain: 15940, cagr: 7 } },
    { type: 'dca', name: 'DCA agressif 500€/mois — 15 ans',
      inputs: { monthly: 500, targetRate: 9, years: 15, volatility: 20, initialPrice: 100 },
      results: { finalValue: 194820, totalInvested: 90000, totalGain: 104820, cagr: 9 } },
    { type: 'fire', name: 'Objectif FI/RE à 50 ans',
      inputs: { income: 72000, expenses: 33600, netWorth: 45000, rate: 7, withdrawalRate: 4 },
      results: { fireNumber: 840000, yearsToFire: 17, savingsRate: 53.3 } },
    { type: 'buyrent', name: 'Appartement Paris 3P — achat vs location',
      inputs: { price: 320000, down: 64000, loanRate: 3.5, rent: 1500, years: 20, appreciation: 2, investReturn: 7 },
      results: { breakevenYears: 12, buyWins: true } },
    { type: 'mortgage', name: 'Prêt résidence principale 250k€ — 20 ans',
      inputs: { amount: 250000, rate: 3.4, years: 20, insurance: 0.2 },
      results: { monthly: 1445, totalCost: 346800, totalInterest: 96800, totalInsurance: 10000, taeg: 3.62 } },
    { type: 'mortgage', name: 'Prêt investissement locatif Lyon',
      inputs: { amount: 155000, rate: 3.6, years: 20, insurance: 0.15 },
      results: { monthly: 907, totalCost: 217680, totalInterest: 62680, totalInsurance: 4650, taeg: 3.78 } },
    { type: 'rental', name: 'Studio Lyon 7e — investissement locatif',
      inputs: { apartments: [{ id: '1', name: 'Studio Lyon 7e', inputs: { price: 155000, notaryFees: 8, works: 8000, rent: 820, charges: 120, taxeFonciere: 900, insurance: 200, vacancy: 4, loanAmount: 124000, loanRate: 3.5, loanYears: 20, regime: 'nu', marginalRate: 30 } }] },
      results: { globalCashflowMonthly: 625, globalGrossYield: 6.35, globalNetYield: 4.82, globalROI: 5.1 } },
    { type: 'tax', name: 'Impôts 2025 — Cadre TMI 30%',
      inputs: { gross: 58000, parts: 1, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false },
      results: { ir: 9274, tmi: 30, netIncome: 35526, avgRate: 15.99 } },
    { type: 'tax', name: 'Impôts 2025 — Couple 2 enfants',
      inputs: { gross: 85000, parts: 3, csRate: 22, regime: 'salarie', fraisReels: 0, useFraisReels: false },
      results: { ir: 6656, tmi: 11, netIncome: 59644, avgRate: 7.83 } },
    { type: 'flat-tax', name: 'Dividendes CTO — Flat Tax vs Barème IR',
      inputs: { amount: 12000, incomeType: 'dividends', tmi: 30, annualRevenuTravail: 58000, parts: 1, isCouple: false },
      results: { flatTax: { ir: 1536, ps: 2064, total: 3600, effectiveRate: 30 }, bareme: { abattement: 4800, csgDed: 490, ir: 2013, ps: 2064, total: 4077, effectiveRate: 33.98 }, recommended: 'flat_tax', saving: 477, breakevenTMI: 30, chartData: [] } },
    { type: 'flat-tax', name: 'Plus-value CTO — TMI 11% (barème avantageux)',
      inputs: { amount: 8000, incomeType: 'capital_gains', tmi: 11, annualRevenuTravail: 28000, parts: 1, isCouple: false },
      results: { flatTax: { ir: 1024, ps: 1376, total: 2400, effectiveRate: 30 }, bareme: { abattement: 0, csgDed: 544, ir: 808, ps: 1376, total: 2184, effectiveRate: 27.3 }, recommended: 'bareme', saving: 216, breakevenTMI: 30, chartData: [] } },
    { type: 'envelope-compare', name: 'PEA vs CTO vs AV — 15 ans TMI 30%',
      inputs: { capital: 15000, monthly: 300, rateGross: 7, years: 15, tmi: 30, isCouple: false, peaOpenYears: 5 },
      results: { pea: { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 0, taxTotal: 10811, netValue: 121042, netGain: 52042, netEffectiveRate: 4.89 }, cto: { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 8045, taxTotal: 18856, netValue: 112997, netGain: 43997, netEffectiveRate: 4.25 }, av: { grossValue: 131853, totalInvested: 69000, grossGain: 62853, taxPS: 10811, taxIR: 4369, taxTotal: 15180, netValue: 116673, netGain: 47673, netEffectiveRate: 4.52 }, best: 'pea', chartData: [] } },
    { type: 'retirement', name: 'Simulation retraite — départ à 65 ans',
      inputs: { age: 35, quarters: 52, pointsArrco: 820, salary: 48000, salaryGrowth: 1.5, departureAge: 65 },
      results: {} },
    { type: 'savings-rate', name: "Analyse taux d'épargne — mars 2026",
      inputs: { revenus: [{ id: 'r1', name: 'Salaire net', value: 3800 }, { id: 'r2', name: 'Revenus locatifs', value: 625 }], investCats: [{ id: 'i1', name: 'Investissements', items: [{ id: 'i1a', name: 'ETF PEA', value: 300 }, { id: 'i1b', name: 'Livret A', value: 150 }, { id: 'i1c', name: 'PER', value: 100 }] }], depenseCats: [{ id: 'd1', name: 'Vie courante', items: [{ id: 'd1a', name: 'Logement + charges', value: 1100 }, { id: 'd1b', name: 'Alimentation', value: 450 }, { id: 'd1c', name: 'Transport', value: 250 }, { id: 'd1d', name: 'Loisirs & sorties', value: 280 }, { id: 'd1e', name: 'Abonnements', value: 95 }] }] },
      results: { savingsRate: 12.43, totalRevenu: 4425, totalInvest: 550, totalDepense: 2175, balance: 1700 } },
    { type: 'budget', name: 'Budget 50/30/20 — salarié Lyon',
      inputs: { netIncome: 3800, housing: 1100, food: 400, transport: 200, health: 50, utilities: 95, otherNeeds: 55, leisure: 280, shopping: 350, restaurants: 380, otherWants: 130, savings: 400, debt: 0, otherSavings: 360 },
      results: { savingsRate: 20, totalNeeds: 1900, totalWants: 1140, totalSavings: 760 } },
  ]

  for (const sim of sims) {
    await prisma.simulation.create({
      data: { userId: demoUser.id, type: sim.type, name: sim.name, inputs: sim.inputs, results: sim.results },
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

  // ─── Enveloppes (on garde les IDs pour créer les positions après) ─────────────
  const envelopeDefs = [
    {
      type: 'PEA', name: 'PEA Boursorama', sortOrder: 0,
      metadata: { broker: 'Boursorama', openDate: '2021-03-01', currentValue: 38500, depositedAmount: 26000 },
    },
    {
      type: 'AV', name: 'AV Linxea Spirit 2', sortOrder: 1,
      metadata: { insurer: 'Spirica', openDate: '2020-06-15', surrenderValue: 24800, depositedAmount: 20000, fees: 0 },
    },
    {
      type: 'CTO', name: 'CTO Degiro', sortOrder: 2,
      metadata: { broker: 'Degiro', currentValue: 9200, depositedAmount: 7500 },
    },
    {
      type: 'PER', name: 'PER Individuel Linxea', sortOrder: 3,
      metadata: { provider: 'Linxea', balance: 14500, annualContribution: 1200 },
    },
    {
      type: 'LIVRET', name: 'Livret A', sortOrder: 4,
      metadata: { bank: 'Société Générale', balance: 7600, rate: 2.4 },
    },
    {
      type: 'LIVRET', name: 'LDDS', sortOrder: 5,
      metadata: { bank: 'Société Générale', balance: 3200, rate: 2.4 },
    },
    {
      type: 'IMMOBILIER', name: 'Résidence principale — Lyon 4e', sortOrder: 6,
      metadata: { subtype: 'residence_principale', address: 'Lyon 4e arrondissement', purchasePrice: 265000, currentValue: 285000, creditRemaining: 198000, monthlyPayment: 907, purchaseDate: '2022-09-01' },
    },
    {
      type: 'IMMOBILIER', name: 'Résidence secondaire — Annecy', sortOrder: 7,
      metadata: { subtype: 'residence_secondaire', address: 'Annecy, Haute-Savoie', purchasePrice: 320000, currentValue: 338000, creditRemaining: 245000, monthlyPayment: 1320, monthlyRent: 0, purchaseDate: '2023-04-01' },
    },
    {
      type: 'IMMOBILIER', name: 'Appartement LMNP — Grenoble', sortOrder: 8,
      metadata: { subtype: 'locatif', regime: 'LMNP', address: 'Grenoble, Isère', purchasePrice: 125000, currentValue: 132000, creditRemaining: 89000, monthlyPayment: 620, monthlyRent: 750, purchaseDate: '2021-11-01', amortissementAnnuel: 4200 },
    },
    {
      type: 'IMMOBILIER', name: 'Studio Micro-BIC — Bordeaux', sortOrder: 9,
      metadata: { subtype: 'locatif', regime: 'MicroBIC', address: 'Bordeaux, Gironde', purchasePrice: 95000, currentValue: 99000, creditRemaining: 71000, monthlyPayment: 485, monthlyRent: 620, purchaseDate: '2022-06-01', abattement: 0.50 },
    },
    {
      type: 'IMMOBILIER', name: 'F2 Location Nue — Toulouse', sortOrder: 10,
      metadata: { subtype: 'locatif', regime: 'LocationNue', address: 'Toulouse, Haute-Garonne', purchasePrice: 145000, currentValue: 152000, creditRemaining: 105000, monthlyPayment: 720, monthlyRent: 780, purchaseDate: '2020-09-01' },
    },
    {
      type: 'IMMOBILIER', name: 'Local commercial — Lyon 3e', sortOrder: 11,
      metadata: { subtype: 'commercial', address: 'Lyon 3e arrondissement', purchasePrice: 180000, currentValue: 195000, creditRemaining: 130000, monthlyPayment: 860, monthlyRent: 1200, purchaseDate: '2021-03-01' },
    },
    {
      type: 'IMMOBILIER', name: 'Parking — Lyon 2e', sortOrder: 12,
      metadata: { subtype: 'parking', address: 'Lyon 2e arrondissement', purchasePrice: 22000, currentValue: 24500, creditRemaining: 0, monthlyRent: 90, purchaseDate: '2019-06-01', financedCash: true },
    },
    {
      type: 'CRYPTO', name: 'Crypto (Ledger)', sortOrder: 13,
      metadata: { currentValue: 4200, assets: 'BTC, ETH' },
    },
    {
      type: 'CASH', name: 'Compte courant', sortOrder: 14,
      metadata: { bank: 'Société Générale', balance: 2400 },
    },
  ]

  // Créer les enveloppes et conserver les IDs
  const createdEnvelopes = {}
  for (const def of envelopeDefs) {
    const env = await prisma.patrimoineEnvelope.create({
      data: { portfolioId: portfolio.id, type: def.type, name: def.name, sortOrder: def.sortOrder, metadata: def.metadata },
    })
    createdEnvelopes[def.name] = env.id
  }
  console.log(`✅ ${envelopeDefs.length} enveloppes patrimoine démo créées`)

  // ─── Positions par enveloppe ──────────────────────────────────────────────────
  const positions = [
    // PEA Boursorama
    { envelope: 'PEA Boursorama', assetType: 'ETF', symbol: 'CW8', name: 'Amundi MSCI World UCITS ETF', isin: 'LU1681043599', quantity: 85, pru: 298, currency: 'EUR' },
    { envelope: 'PEA Boursorama', assetType: 'ETF', symbol: 'PAEEM', name: 'Amundi MSCI Emerging Markets', isin: 'LU1681045370', quantity: 60, pru: 23, currency: 'EUR' },
    { envelope: 'PEA Boursorama', assetType: 'ETF', symbol: 'ESE', name: 'iShares MSCI Europe UCITS ETF', isin: 'IE00B4K48X80', quantity: 20, pru: 71, currency: 'EUR' },

    // AV Linxea Spirit 2
    { envelope: 'AV Linxea Spirit 2', assetType: 'FOND', symbol: 'FONDS-EUROS', name: 'Fonds Euros Spirica', isin: null, quantity: 14800, pru: 1, currency: 'EUR' },
    { envelope: 'AV Linxea Spirit 2', assetType: 'ETF', symbol: 'CW8', name: 'Amundi MSCI World UC', isin: 'LU1681043599', quantity: 28, pru: 172, currency: 'EUR' },
    { envelope: 'AV Linxea Spirit 2', assetType: 'SCPI', symbol: 'REMAKE', name: 'Remake Live (SCPI)', isin: null, quantity: 20, pru: 204, currency: 'EUR' },

    // CTO Degiro
    { envelope: 'CTO Degiro', assetType: 'STOCK', symbol: 'ASML.AS', name: 'ASML Holding NV', isin: 'NL0010273215', quantity: 2, pru: 680, currency: 'EUR' },
    { envelope: 'CTO Degiro', assetType: 'ETF', symbol: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF', isin: 'IE00BK5BQT80', quantity: 15, pru: 102, currency: 'EUR' },
    { envelope: 'CTO Degiro', assetType: 'STOCK', symbol: 'MC.PA', name: 'LVMH Moët Hennessy Louis Vuitton', isin: 'FR0000121014', quantity: 2, pru: 780, currency: 'EUR' },

    // PER Individuel Linxea
    { envelope: 'PER Individuel Linxea', assetType: 'ETF', symbol: 'CW8', name: 'Amundi MSCI World UCITS ETF', isin: 'LU1681043599', quantity: 30, pru: 285, currency: 'EUR' },
    { envelope: 'PER Individuel Linxea', assetType: 'FOND', symbol: 'FONDS-EUROS-PER', name: 'Fonds Euros PER Linxea', isin: null, quantity: 5950, pru: 1, currency: 'EUR' },

    // Crypto (Ledger)
    { envelope: 'Crypto (Ledger)', assetType: 'CRYPTO', symbol: 'BTC', name: 'Bitcoin', isin: null, quantity: 0.045, pru: 52000, currency: 'EUR' },
    { envelope: 'Crypto (Ledger)', assetType: 'CRYPTO', symbol: 'ETH', name: 'Ethereum', isin: null, quantity: 0.85, pru: 2100, currency: 'EUR' },
  ]

  for (const pos of positions) {
    const envelopeId = createdEnvelopes[pos.envelope]
    if (!envelopeId) { console.warn(`⚠️  Enveloppe introuvable : ${pos.envelope}`); continue }
    await prisma.portfolioPosition.create({
      data: {
        portfolioId: portfolio.id,
        envelopeId,
        assetType: pos.assetType,
        symbol: pos.symbol,
        name: pos.name,
        isin: pos.isin || null,
        quantity: pos.quantity,
        pru: pos.pru,
        currency: pos.currency,
      },
    })
  }
  console.log(`✅ ${positions.length} positions démo créées`)

  // ─── Snapshots historiques démo — 5 ans ───────────────────────────────────────
  await prisma.patrimoineSnapshot.deleteMany({ where: { userId: demoUser.id } })

  // Milestones brut (actifs totaux sans déduction dettes) — dates clés d'achat immobilier
  // Mai 2021 : PEA+AV+CTO+PER+livrets+Parking+F2 Toulouse+Local Lyon = ~424k
  // Nov 2021 : + achat LMNP Grenoble 125k → brut +128k
  // Jun 2022 : + achat Studio Bordeaux 95k → brut +96k
  // Sep 2022 : + achat RP Lyon 265k → brut +267k
  // Avr 2023 : + achat RS Annecy 320k → brut +323k
  // Mai 2026 : valeur actuelle ~1 330k
  const MILESTONES = [
    { date: '2021-05-01', value: 424000 },
    { date: '2021-10-01', value: 431000 },
    { date: '2021-11-01', value: 559000 },  // Grenoble
    { date: '2022-05-01', value: 569000 },
    { date: '2022-06-01', value: 665000 },  // Bordeaux
    { date: '2022-08-01', value: 671000 },
    { date: '2022-09-01', value: 940000 },  // RP Lyon
    { date: '2023-03-01', value: 961000 },
    { date: '2023-04-01', value: 1284000 }, // RS Annecy
    { date: '2026-05-01', value: 1330000 },
  ]

  function lerp(a, b, t) { return a + (b - a) * t }

  // Bruit déterministe pour des valeurs cohérentes entre exécutions
  function stableNoise(ms, amp) {
    const h = (((ms * 2654435761) >>> 0) / 4294967296)
    return (h - 0.5) * 2 * amp
  }

  const snapshots = []
  const cursor = new Date('2021-05-01')
  const end    = new Date('2026-05-01')

  while (cursor <= end) {
    const ms      = cursor.getTime()
    const dateObj = new Date(cursor.toISOString().split('T')[0])

    // Cherche les deux milestones encadrants
    let lo = MILESTONES[0], hi = MILESTONES[MILESTONES.length - 1]
    for (let i = 0; i < MILESTONES.length - 1; i++) {
      const a = new Date(MILESTONES[i].date).getTime()
      const b = new Date(MILESTONES[i + 1].date).getTime()
      if (ms >= a && ms <= b) { lo = MILESTONES[i]; hi = MILESTONES[i + 1]; break }
    }

    const span = new Date(hi.date).getTime() - new Date(lo.date).getTime()
    const t    = span > 0 ? (ms - new Date(lo.date).getTime()) / span : 1
    const base = lerp(lo.value, hi.value, Math.max(0, Math.min(1, t)))
    const noise = stableNoise(ms, base * 0.007) // ±0.7 % de bruit stable
    const totalValue = Math.round(base + noise)

    snapshots.push({ userId: demoUser.id, date: dateObj, totalValue, byEnvelope: { synthetic: true } })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  for (const snap of snapshots) {
    await prisma.patrimoineSnapshot.upsert({
      where:  { userId_date: { userId: snap.userId, date: snap.date } },
      update: { totalValue: snap.totalValue, byEnvelope: snap.byEnvelope },
      create: snap,
    })
  }
  console.log(`✅ ${snapshots.length} snapshots historiques démo créés (5 ans)`)
  console.log('🚀 Seed terminé !')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
