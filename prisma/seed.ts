import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ─── Liste blanche des emails autorisés ───────────────────────────────────
  // Ajoutez ici les emails des personnes autorisées à s'inscrire
  const allowedEmails = [
    'admin@example.com',
    'user1@example.com',
    // Ajoutez vos emails ici
  ]

  for (const email of allowedEmails) {
    await prisma.allowedEmail.upsert({
      where: { email },
      update: {},
      create: { email },
    })
    console.log(`✅ Email autorisé : ${email}`)
  }

  // ─── Compte admin par défaut ──────────────────────────────────────────────
  // CHANGEZ ces valeurs avant de déployer !
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
  const adminName = process.env.ADMIN_NAME || 'Admin'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
    },
  })

  console.log(`✅ Compte admin créé : ${adminEmail}`)
  console.log('🚀 Seed terminé !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
