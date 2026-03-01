# FinCalc — Self-Hosted Finance App

Stack: **Next.js 15** · **NextAuth** · **PostgreSQL** · **Prisma** · **shadcn/ui** · **Docker** · **Recharts** · **react-simple-maps**

---

## 🧮 Fonctionnalités

### Tableau Patrimonial
Gestion complète de votre patrimoine avec enveloppes dédiées par type d'actif.

| Enveloppe | Fonctionnalités |
|---|---|
| **PEA** | Positions temps réel, plafond 150 k€, optimisation ETF, carte géographique |
| **CTO** | Positions temps réel, optimisation ETF, carte géographique |
| **Crypto** | Positions CoinGecko, performance globale |
| **Livret réglementé** | Livret A/LDDS/LEP/PEL…, barre de plafond, intérêts projetés |
| **Immobilier** | Valeur nette, crédit, plus-value latente, graphique equity, rentabilité locative |
| **Assurance Vie** | Valeur de rachat, ancienneté fiscale (8 ans) |
| **PER** | Solde, économie fiscale selon TMI |
| **Liquidités** | Solde, équivalence en mois de dépenses |

### Optimisation ETF
Pour chaque ETF en portefeuille (PEA/CTO) :
- Affichage du TER (frais annuels), benchmark, type de réplication, encours
- Comparaison avec les meilleures alternatives moins chères sur le même indice
- Calcul d'impact des frais sur 20 ans avec graphique comparatif
- Base statique de ~30 ETFs français/européens (S&P 500, MSCI World, Nasdaq, EM, CAC 40…)

### Carte Monde (style Boursorama)
- Carte interactive avec contours pays réels (react-simple-maps)
- Coloration par région selon l'exposition géographique de vos ETFs
- Légende avec valeur € et pourcentage par région (Amérique du Nord, Europe, Asie-Pacifique, Émergents)
- Tooltip au survol des pays
- Disponible sur la page Vue d'ensemble et dans chaque enveloppe PEA/CTO

### Calculateurs financiers

| Calculateur | Résultats |
|---|---|
| Intérêts Composés | Capital final, intérêts, graphique |
| DCA | Coût moyen, performance |
| FI/RE | Objectif, années, taux d'épargne |
| Impôts IR 2025 | Net, IR, TMI, tranches |
| Acheter vs Louer | Comparaison patrimoniale, seuil |
| Prêt Immobilier | Mensualités, TAEG, amortissement |
| Rentabilité Locative | Rendement brut/net, cash-flow |
| Taux d'épargne | Visualisation 50/30/20 |
| Budget | Répartition par catégorie |
| Retraite | Projection pension |
| Historique | Toutes les simulations filtrables |

---

## 🏗️ Architecture Globale

```
fincalc/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                  # NextAuth + Register
│   │   │   ├── portfolio/             # CRUD positions + prix temps réel
│   │   │   │   ├── route.ts           # GET (liste) / POST (créer)
│   │   │   │   ├── [id]/route.ts      # PATCH / DELETE position
│   │   │   │   ├── prices/route.ts    # Finnhub + CoinGecko
│   │   │   │   └── search/route.ts    # Autocomplete symboles
│   │   │   ├── patrimoine/
│   │   │   │   └── envelopes/
│   │   │   │       ├── route.ts       # GET (liste) / POST (créer enveloppe)
│   │   │   │       └── [id]/route.ts  # GET / PATCH / DELETE enveloppe
│   │   │   ├── simulations/           # CRUD simulations sauvegardées
│   │   │   ├── admin/users/           # Gestion utilisateurs (admin)
│   │   │   └── user/                  # Profil utilisateur
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # Synthèse globale
│   │   │   ├── layout.tsx             # Shell avec Sidebar
│   │   │   ├── patrimoine/
│   │   │   │   ├── page.tsx           # Vue d'ensemble patrimoine + carte monde
│   │   │   │   └── [id]/page.tsx      # Détail enveloppe (PEA, LIVRET, IMMO…)
│   │   │   ├── portfolio/page.tsx     # Mon Portefeuille (positions trading)
│   │   │   ├── compound/              # Intérêts composés
│   │   │   ├── dca/                   # Dollar Cost Averaging
│   │   │   ├── fire/                  # FI/RE
│   │   │   ├── buyrent/               # Acheter vs Louer
│   │   │   ├── mortgage/              # Prêt Immobilier
│   │   │   ├── rental/                # Rentabilité Locative
│   │   │   ├── tax/                   # Impôts IR
│   │   │   ├── retirement/            # Retraite
│   │   │   ├── savings-rate/          # Taux d'épargne
│   │   │   ├── budget/                # Budget 50/30/20
│   │   │   ├── settings/              # Mon compte
│   │   │   ├── history/               # Historique simulations
│   │   │   └── admin/                 # Administration
│   │   └── login/
│   ├── components/
│   │   ├── ui/                        # shadcn/ui (Button, Card, Input…)
│   │   ├── Sidebar.tsx                # Nav dynamique avec enveloppes patrimoine
│   │   ├── WorldMapChart.tsx          # Carte monde répartition géographique
│   │   ├── DashboardShell.tsx
│   │   └── SaveSimulation.tsx
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth config
│   │   ├── calculators.ts             # Logique financière
│   │   ├── etf-database.ts            # Base statique ~30 ETFs (TER, géo, alternatives)
│   │   ├── chart-theme.ts             # Thème Recharts (dark/light)
│   │   ├── prisma.ts                  # DB client singleton
│   │   ├── fmt.ts                     # Formatage nombres/devises
│   │   └── utils.ts                   # Helpers généraux
│   └── contexts/
│       └── ThemeContext.tsx            # Dark/Light mode
├── prisma/
│   ├── schema.prisma                  # Modèles DB
│   └── seed.ts                        # Admin initial
├── Dockerfile
├── docker-compose.yml                 # Dev local
└── .env.example
```

### Modèles Prisma

```
User ──1:1──► Portfolio ──1:N──► PatrimoineEnvelope
                        └──1:N──► PortfolioPosition (lié ou non à une enveloppe)
User ──1:N──► Simulation
```

**PatrimoineEnvelope** — types : `LIVRET | IMMOBILIER | PEA | AV | CTO | CRYPTO | PER | CASH`
- Stocke les métadonnées spécifiques au type dans un champ `metadata: Json`

**PortfolioPosition** — types : `STOCK | ETF | CRYPTO | SCPI | LIVRET | CASH`
- Lié à une enveloppe via `envelopeId` (optionnel)

---

## 🔒 Sécurité

- **Liste blanche** : seuls les emails pré-approuvés peuvent créer un compte
- **Mots de passe** : hashés bcrypt (coût 12)
- **Sessions** : JWT signé avec NEXTAUTH_SECRET
- **API** : toutes les routes vérifient la session serveur-side
- **Isolation** : chaque utilisateur ne voit que ses propres données

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
FINNHUB_API_KEY=votre_cle_finnhub
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

## 🔧 Dev local

```bash
# Installer les dépendances
npm install

# Démarrer PostgreSQL + Next.js
docker-compose up

# Ou sans Docker
cp .env.example .env.local
# Remplir .env.local
npx prisma migrate dev
npm run dev
```
