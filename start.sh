#!/bin/bash
set -e

echo "🚀 Démarrage FinCalc..."
echo "📦 Lancement des migrations Prisma..."

# Run migrations using the local prisma binary
/app/node_modules/prisma/build/index.js migrate deploy --schema=/app/prisma/schema.prisma

echo "🌱 Seed de la base de données..."

# Seed using Node.js directly (no TypeScript needed)
node -e "
const { PrismaClient } = require('/app/node_modules/@prisma/client');
const bcrypt = require('/app/node_modules/bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const name = process.env.ADMIN_NAME || 'Admin';

  // Upsert allowed email
  await prisma.allowedEmail.upsert({
    where: { email },
    update: {},
    create: { email }
  });

  // Upsert admin user
  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, password: hash }
  });

  console.log('✅ Compte admin prêt:', email);
  await prisma.\$disconnect();
}

main().catch(e => {
  // Seed errors are non-fatal (tables might already exist)
  console.warn('⚠️  Seed warning (peut être ignoré si déjà initialisé):', e.message);
  process.exit(0);
});
"

echo "✅ Initialisation terminée — démarrage du serveur Next.js..."
exec node server.js
