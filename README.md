# FinCalc — Self-Hosted Finance App

Stack: **Next.js 15** · **NextAuth** · **PostgreSQL** · **Prisma** · **shadcn/ui** · **Docker**

---

## 🚀 Déploiement sur Dokploy

### Prérequis
- Dokploy installé sur votre VPS Hostinger
- Un repo GitHub avec ce code
- Un nom de domaine (optionnel mais recommandé)

---

### Étape 1 — Pousser sur GitHub

```bash
git init
git add .
git commit -m "init fincalc"
gh repo create fincalc --private
git push -u origin main
```

---

### Étape 2 — Base de données PostgreSQL sur Dokploy

Dans Dokploy → **Database** → **New Database** → **PostgreSQL**

- **Name**: `fincalc-db`
- **Version**: `16`
- Laissez Dokploy générer le mot de passe → **copiez-le**

---

### Étape 3 — Application sur Dokploy

Dans Dokploy → **Project** → **New Service** → **Application**

**Source :**
- Provider : GitHub
- Repository : `fincalc`
- Branch : `main`
- Build Type : `Dockerfile`

**Environment Variables** (onglet *Environment*) :

```env
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@fincalc-db:5432/fincalc
NEXTAUTH_SECRET=GENEREZ_AVEC_openssl_rand_-base64_32
NEXTAUTH_URL=https://finance.votre-domaine.com
ADMIN_EMAIL=votre@email.com
ADMIN_PASSWORD=MotDePasseAdmin123!
ADMIN_NAME=Votre Nom
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE
```

> Pour générer NEXTAUTH_SECRET : `openssl rand -base64 32`

**Domains** :
- Add Domain → `finance.votre-domaine.com`
- Port : `3000`
- Activer HTTPS (Traefik + Let's Encrypt auto)

**Deploy** → Lancez le build !

---

### Étape 4 — Migrations et seed

Après le premier déploiement, dans Dokploy → votre app → **Terminal** :

```bash
npx prisma migrate deploy
npx prisma db seed
```

Ou ajoutez ce **Command** dans les settings du service :
```bash
npx prisma migrate deploy && npx prisma db seed && node server.js
```

---

### Étape 5 — Ajouter des utilisateurs autorisés

En SQL (via Dokploy Database → Query) :

```sql
-- Ajouter un email à la liste blanche
INSERT INTO "AllowedEmail" (id, email, "createdAt")
VALUES (gen_random_uuid(), 'ami@exemple.com', NOW());

-- Voir la liste blanche
SELECT * FROM "AllowedEmail";

-- Voir les utilisateurs inscrits
SELECT id, email, name, "createdAt" FROM "User";
```

---

## 🏗️ Architecture

```
fincalc/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth + Register endpoint
│   │   │   └── simulations/   # CRUD simulations
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Intérêts composés
│   │   │   ├── fire/          # FI/RE
│   │   │   ├── tax/           # Impôts
│   │   │   ├── buyrent/       # Acheter vs Louer
│   │   │   ├── mortgage/      # Prêt immobilier
│   │   │   └── history/       # Simulations sauvegardées
│   │   └── login/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── Sidebar.tsx
│   │   └── SaveSimulation.tsx
│   └── lib/
│       ├── auth.ts            # NextAuth config
│       ├── calculators.ts     # Logique financière
│       ├── prisma.ts          # DB client
│       └── utils.ts
├── prisma/
│   ├── schema.prisma          # Modèles DB
│   └── seed.ts                # Données initiales
├── Dockerfile
├── docker-compose.yml         # Dev local
└── .env.example
```

## 🔒 Sécurité

- **Liste blanche** : seuls les emails pré-approuvés peuvent créer un compte
- **Mots de passe** : hashés bcrypt (coût 12)
- **Sessions** : JWT signé avec NEXTAUTH_SECRET
- **API** : toutes les routes vérifient la session serveur-side
- **Isolation** : chaque utilisateur ne voit que ses propres simulations

## 🧮 Fonctionnalités

| Calculateur | Résultats sauvegardés |
|---|---|
| Intérêts Composés | Capital final, intérêts, graphique |
| FI/RE | Objectif, années, taux d'épargne |
| Impôts IR 2024 | Net, IR, TMI, tranches |
| Acheter vs Louer | Comparaison patrimoniale, seuil |
| Prêt Immobilier | Mensualités, TAEG, amortissement |
| Historique | Toutes les simulations filtrables |
