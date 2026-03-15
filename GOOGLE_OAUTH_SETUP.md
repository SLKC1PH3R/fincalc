# Configuration Google OAuth — FinCalc

## 1. Google Cloud Console

1. Allez sur https://console.cloud.google.com
2. Créez un nouveau projet ou sélectionnez un existant
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
4. Application type : **Web application**
5. Authorized redirect URIs — ajoutez :
   ```
   https://VOTRE_DOMAINE/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google  (dev local)
   ```
6. Copiez **Client ID** et **Client Secret**

## 2. Variables d'environnement dans Dokploy

Ajoutez dans l'onglet **Environment** de votre app :

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

## 3. Migration base de données

Exécutez ce SQL sur votre PostgreSQL pour rendre `password` optionnel :

```sql
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;
```

**Via Dokploy** : Terminal → container de l'app → 
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$executeRawUnsafe('ALTER TABLE \"User\" ALTER COLUMN \"password\" DROP NOT NULL').then(() => console.log('OK')).finally(() => p.\$disconnect());
"
```

## 4. Ajouter des emails autorisés (whitelist)

Les utilisateurs Google doivent être dans la table `AllowedEmail`.

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.allowedEmail.create({ data: { email: 'votre@gmail.com' } })
  .then(() => console.log('Email autorisé'))
  .finally(() => p.\$disconnect());
"
```

## 5. Test

- Allez sur `/login`
- Cliquez **Continuer avec Google**
