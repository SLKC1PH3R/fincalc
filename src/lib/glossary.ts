export const GLOSSARY: Record<string, string> = {
  tmi: "Taux Marginal d'Imposition : taux de la tranche la plus haute de vos revenus. Un TMI de 30% signifie que chaque euro supplémentaire est taxé à 30% — pas l'ensemble de vos revenus.",
  taeg: "Taux Annuel Effectif Global : coût total du crédit sur une base annuelle. Inclut les intérêts, l'assurance emprunteur et tous les frais obligatoires. C'est le seul taux comparable entre banques.",
  pru: "Prix de Revient Unitaire : coût moyen d'acquisition de vos titres. Si vous achetez 10 actions à 100€ puis 10 à 120€, votre PRU est 110€. La plus-value est calculée par rapport au PRU.",
  flat_tax: "Flat Tax ou PFU (Prélèvement Forfaitaire Unique) : imposition à taux fixe de 30% sur les revenus du capital (12,8% IR + 17,2% PS). Alternative au barème progressif, à choisir chaque année.",
  abattement: "Réduction appliquée sur la base imposable avant calcul de l'impôt. Exemple : abattement de 40% sur les dividendes au barème, ou abattement forfaitaire de 10% sur les salaires.",
  pv_latente: "Plus-value latente ou non réalisée : gain théorique sur un actif non encore vendu. Non imposable tant qu'il n'y a pas de cession. Devenir réalisée lors de la vente.",
  ps: "Prélèvements Sociaux (17,2%) : CSG (9,2%) + CRDS (0,5%) + prélèvement de solidarité (7,5%). Dus sur tous les revenus du capital et certains revenus du travail.",
  per: "Plan d'Épargne Retraite : dispositif d'épargne à long terme. Les versements sont déductibles du revenu imposable (dans la limite d'un plafond). Capital disponible à la retraite sous forme de rente ou de capital.",
  pea: "Plan d'Épargne en Actions : compte-titres à fiscalité avantageuse réservé aux actions européennes. Après 5 ans : exonération d'IR sur les gains, seuls les prélèvements sociaux (17,2%) restent dus. Plafond : 150 000€.",
  cto: "Compte-Titres Ordinaire : enveloppe d'investissement sans plafond ni restriction géographique. Imposition Flat Tax 30% sur les gains réalisés (12,8% IR + 17,2% PS). Plus flexible que le PEA.",
  av: "Assurance-Vie : placement d'épargne à long terme. Après 8 ans, abattement de 4 600€/an (9 200€ couple) sur les gains, puis taux réduit de 7,5% IR + 17,2% PS. Également outil de transmission successorale.",
  cashflow: "Cashflow locatif : différence entre les loyers perçus et l'ensemble des charges (mensualité du crédit, charges de copropriété, taxe foncière, assurances, vacance locative…). Un cashflow positif signifie que l'investissement s'autofinance.",
  rendement_brut: "Loyer annuel divisé par le prix d'achat (frais inclus), en %. Indicateur simple mais incomplet : ne tient pas compte de la fiscalité, des charges, ni du financement.",
  rendement_net: "Rendement après déduction de toutes les charges et impôts. C'est le rendement réel de votre investissement locatif.",
  fire: "Financial Independence, Retire Early : mouvement visant à atteindre l'indépendance financière le plus tôt possible. L'objectif FIRE = 25× vos dépenses annuelles, basé sur la règle des 4% de retrait annuel.",
  regle_4pct: "Règle empirique des 4% : un portefeuille résiste aux retraits de 4% de sa valeur initiale par an sur 30 ans (étude Trinity 1998). Donne l'objectif FIRE = dépenses annuelles × 25.",
  dca: "Dollar Cost Averaging (investissement progressif) : investir une somme fixe régulièrement, indépendamment du cours. Lisse le prix d'achat moyen et réduit le risque de mauvais timing.",
  amortissement: "Remboursement progressif du capital emprunté. Les premières mensualités remboursent surtout des intérêts ; la part capital augmente avec le temps (amortissement linéaire ou dégressif).",
  quotient_familial: "Mécanisme fiscal divisant le revenu imposable par un nombre de parts (1 pour célibataire, 2 pour couple, +0,5 ou +1 par enfant). Réduit l'IR en limitant l'effet des tranches hautes.",
  csg: "Contribution Sociale Généralisée : principal prélèvement social (9,2% sur les salaires, 9,9% sur le capital pour les non-salariés). Partiellement déductible du revenu imposable au barème réel.",
  plus_value_immo: "Plus-value immobilière : différence entre le prix de vente et le prix d'achat d'un bien. Exonérée pour la résidence principale. Pour les autres biens : abattements progressifs (exonération IR après 22 ans, PS après 30 ans).",
  deficit_foncier: "Mécanisme fiscal permettant de déduire les charges (travaux, intérêts d'emprunt…) des revenus fonciers. Si le déficit dépasse les revenus fonciers, l'excédent (dans la limite de 10 700€) est déductible du revenu global.",
  lmnp: "Loueur Meublé Non Professionnel : statut fiscal permettant d'amortir le bien et les meubles, réduisant ainsi la base imposable des loyers. Souvent plus avantageux que la location nue.",
  irr: "Taux de Rendement Interne : taux annualisé qui égalise la valeur actuelle des flux entrants et sortants. Indicateur universel de rentabilité d'un investissement, comparable quel que soit le type d'actif.",
  levier: "Financement d'un investissement par l'emprunt. Le levier amplifie les gains si le rendement dépasse le taux d'emprunt, mais amplifie aussi les pertes en cas de retournement.",
}

export function getGlossaryEntry(term: string): string | undefined {
  return GLOSSARY[term.toLowerCase().replace(/[^a-z0-9_]/g, '_')]
    ?? GLOSSARY[term.toLowerCase()]
}
