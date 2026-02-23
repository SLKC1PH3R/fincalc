# ⚠️ Migration requise — À exécuter UNE SEULE FOIS

Suite à l'ajout du support Google OAuth et des avatars utilisateurs,
la base de données doit être mise à jour.

## Via Dokploy Terminal (dans le container de l'app)

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([
  p.\$executeRawUnsafe('ALTER TABLE \"User\" ALTER COLUMN \"password\" DROP NOT NULL'),
  p.\$executeRawUnsafe('ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS \"image\" TEXT'),
]).then(() => {
  console.log('✅ Migration réussie : password optionnel + colonne image ajoutée');
}).catch(e => {
  console.error('Erreur (peut-être déjà fait) :', e.message);
}).finally(() => p.\$disconnect());
"
```

## OU via SQL direct (Dokploy → Database → Query)

```sql
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
```

## Après la migration

Redéployez l'application — les erreurs de build sur `image` disparaîtront.
