#!/bin/bash
set -e

echo "🚀 Démarrage FinCalc..."
echo "📦 Synchronisation du schéma Prisma (db push)..."

# Sync schema to DB (no migration files needed)
/app/node_modules/prisma/build/index.js db push --schema=/app/prisma/schema.prisma --accept-data-loss

echo "🌱 Seed de la base de données..."
node /app/prisma/seed-demo.js

echo "✅ Initialisation terminée — démarrage du serveur Next.js..."
exec node server.js
