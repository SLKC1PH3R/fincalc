'use client'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

const GLOSSARY: Record<string, string> = {
  pru: 'Prix de Revient Unitaire — coût moyen d\'achat par unité, frais compris. Sert de base au calcul de la plus-value.',
  ter: 'Total Expense Ratio — frais annuels totaux d\'un ETF exprimés en %. Un TER de 0,20% coûte 20€/an pour 10 000€ investis.',
  scpi: 'Société Civile de Placement Immobilier — permet d\'investir dans l\'immobilier professionnel (bureaux, commerces) sans gérer directement. Les revenus sont distribués sous forme de dividendes.',
  tmi: 'Tanche Marginale d\'Imposition — taux de l\'impôt sur le revenu qui s\'applique à votre dernier euro de revenu imposable. En France : 0%, 11%, 30%, 41% ou 45%.',
  pea: 'Plan d\'Épargne en Actions — enveloppe fiscale pour investir en actions européennes. Exonération d\'impôt sur les gains après 5 ans. Plafond de versements : 150 000€.',
  peaPlafond: 'Le PEA est plafonné à 150 000€ de versements (hors gains). Au-delà, vous devez utiliser un CTO.',
  av: 'Assurance-Vie — enveloppe d\'épargne polyvalente. Après 8 ans : abattement annuel de 4 600€ (9 200€ en couple) sur les gains, puis imposition à 7,5% + prélèvements sociaux.',
  cto: 'Compte-Titres Ordinaire — permet d\'investir sans plafond ni restriction géographique. Les gains sont soumis au Prélèvement Forfaitaire Unique (PFU) de 30%.',
  per: 'Plan d\'Épargne Retraite — les versements sont déductibles du revenu imposable (dans la limite de 10% des revenus). Capital bloqué jusqu\'à la retraite.',
  pfu: 'Prélèvement Forfaitaire Unique — aussi appelé "flat tax". Taux de 30% (12,8% IR + 17,2% prélèvements sociaux) sur les revenus du capital.',
  dca: 'Dollar Cost Averaging — stratégie d\'investissement régulier à intervalle fixe, quel que soit le prix. Réduit l\'impact de la volatilité en lissant le prix d\'achat moyen.',
  fire: 'Financial Independence, Retire Early — mouvement visant l\'indépendance financière. Principe : accumuler 25× ses dépenses annuelles (règle des 4%), puis vivre des intérêts.',
  regleDes4: 'Règle des 4% — en retirant 4% de son capital chaque année, le portefeuille survit statistiquement 30+ ans selon l\'étude Trinity (1926-1995). Un capital de 1M€ permet 40k€/an.',
  etf: 'Exchange-Traded Fund — fonds indiciel coté en bourse qui réplique un indice (MSCI World, S&P 500…). Frais généralement très bas (0,05–0,5% TER). La majorité des gérants actifs sous-performent les ETF sur 10+ ans.',
  ldds: 'Livret de Développement Durable et Solidaire — livret réglementé à 3% net d\'impôts. Plafond : 12 000€.',
  lep: 'Livret d\'Épargne Populaire — livret réglementé à 4% net d\'impôts (sous conditions de revenus). Plafond : 10 000€.',
  livetA: 'Livret A — livret réglementé à 2,4% net d\'impôts. Plafond : 22 950€.',
  plusValue: 'Plus-value — gain réalisé lors de la vente d\'un actif = prix de vente − prix de revient. Soumise à l\'impôt (PFU 30% pour les valeurs mobilières, ou barème IR + 17,2% de PS).',
}

interface FinTipProps {
  term: keyof typeof GLOSSARY
  className?: string
}

export function FinTip({ term, className }: FinTipProps) {
  const [open, setOpen] = useState(false)
  const text = GLOSSARY[term]
  if (!text) return null

  return (
    <span className={`relative inline-flex ml-1 align-middle ${className ?? ''}`} style={{ verticalAlign: 'middle' }}>
      <HelpCircle
        style={{ width: 13, height: 13, color: 'var(--text-subtle)', cursor: 'pointer', flexShrink: 0 }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
      />
      {open && (
        <span style={{
          position: 'absolute', zIndex: 60, left: 18, top: -4,
          width: 260, padding: '10px 13px', borderRadius: 10,
          background: 'var(--card-dark)', border: '1px solid var(--card-dark-border)',
          fontSize: 12, color: 'var(--text-muted-c)', lineHeight: 1.55,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          whiteSpace: 'normal',
          pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

export { GLOSSARY }
