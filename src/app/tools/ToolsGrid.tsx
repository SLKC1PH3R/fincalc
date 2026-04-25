'use client'
import Link from 'next/link'

// ── Mini SVG previews ──────────────────────────────────────────────────────

function PreviewCompound() {
  const pts = [0,4,10,18,30,46,68,100].map((v, i) => `${i * 38},${90 - v * 0.82}`)
  const inv = [0,3,6,9,12,15,18,21].map((v, i) => `${i * 38},${90 - v * 0.82}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <defs><linearGradient id="pc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,90 ${pts.join(' ')} 266,90`} fill="url(#pc-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={inv.join(' ')} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" />
      <text x="4" y="14" fill="#7c3aed" fontSize="9" fontWeight="700">198 k€</text>
      <text x="4" y="24" fill="#9A907F" fontSize="7">Valeur finale</text>
      <text x="180" y="88" fill="#9A907F" fontSize="7">20 ans</text>
    </svg>
  )
}

function PreviewFire() {
  const pts = [0,2,5,10,17,27,40,57,78,100].map((v, i) => `${i * 29.5},${88 - v * 0.8}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <defs><linearGradient id="pf-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb923c" stopOpacity="0.18"/><stop offset="100%" stopColor="#fb923c" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,88 ${pts.join(' ')} 266,88`} fill="url(#pf-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinejoin="round" />
      <line x1="207" y1="10" x2="207" y2="88" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
      <text x="210" y="22" fill="#10b981" fontSize="7">FIRE</text>
      <text x="4" y="14" fill="#fb923c" fontSize="9" fontWeight="700">900 k€</text>
      <text x="4" y="24" fill="#9A907F" fontSize="7">Objectif FI/RE</text>
    </svg>
  )
}

function PreviewMortgage() {
  const bars = [100, 94, 87, 78, 67, 53, 37, 18].map((capital, i) => ({ cap: capital, int: 28 - i * 2, x: i * 33 + 4 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={90 - b.cap * 0.72} width={22} height={b.cap * 0.72} fill="#7c3aed" fillOpacity="0.45" rx="2" />
          <rect x={b.x} y={90 - b.cap * 0.72 - b.int * 0.72} width={22} height={b.int * 0.72} fill="#a78bfa" fillOpacity="0.3" rx="2" />
        </g>
      ))}
      <text x="4" y="12" fill="#7c3aed" fontSize="9" fontWeight="700">1 247 €/mois</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Mensualité estimée</text>
    </svg>
  )
}

function PreviewBuyRent() {
  const buy  = [0,8,18,30,40,52,65,80,96,110].map((v,i) => `${i*29.5},${88-v*0.72}`)
  const rent = [0,12,24,36,48,60,72,84,96,108].map((v,i) => `${i*29.5},${88-v*0.72}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <polyline points={buy.join(' ')}  fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={rent.join(' ')} fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="4,3" strokeLinejoin="round" />
      <line x1="148" y1="10" x2="148" y2="88" stroke="#9A907F" strokeWidth="1" strokeDasharray="2,2" />
      <text x="4" y="12" fill="#38bdf8" fontSize="7" fontWeight="600">Achat</text>
      <text x="40" y="12" fill="#f87171" fontSize="7" fontWeight="600">Location</text>
      <text x="4" y="24" fill="#9A907F" fontSize="7">Coût total sur 20 ans</text>
    </svg>
  )
}

function PreviewTax() {
  const brackets = [{ w: 52, color: '#10b981', label: '0%' }, { w: 38, color: '#f59e0b', label: '11%' }, { w: 22, color: '#f97316', label: '30%' }, { w: 10, color: '#ef4444', label: '41%' }]
  let x = 4
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <text x="4" y="12" fill="#10b981" fontSize="9" fontWeight="700">8 420 €</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Impôt estimé</text>
      {brackets.map((b, i) => { const cx = x; x += b.w + 4; return <g key={i}><rect x={cx} y={50} width={b.w} height={28} fill={b.color} fillOpacity="0.55" rx="3" /><text x={cx + b.w/2} y={44} fill={b.color} fontSize="6" textAnchor="middle">{b.label}</text></g> })}
    </svg>
  )
}

function PreviewFlatTax() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <rect x="20" y="30" width="90" height="50" fill="#818cf8" fillOpacity="0.45" rx="4" />
      <rect x="156" y="44" width="90" height="36" fill="#fb923c" fillOpacity="0.45" rx="4" />
      <text x="65" y="24" fill="#818cf8" fontSize="8" fontWeight="700" textAnchor="middle">Flat Tax 30%</text>
      <text x="201" y="38" fill="#fb923c" fontSize="8" fontWeight="700" textAnchor="middle">Barème IR</text>
      <text x="65" y="62" fill="#0A0A0A" fontSize="9" fontWeight="800" textAnchor="middle">3 200 €</text>
      <text x="201" y="74" fill="#0A0A0A" fontSize="9" fontWeight="800" textAnchor="middle">4 580 €</text>
      <text x="133" y="90" fill="#10b981" fontSize="7" textAnchor="middle">Flat Tax économise 1 380 €</text>
    </svg>
  )
}

function PreviewRetirement() {
  const bars = [45, 58, 72, 88, 100, 115].map((h, i) => ({ h, x: i * 42 + 10 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={90 - b.h * 0.78} width={28} height={b.h * 0.6} fill="#a78bfa" fillOpacity="0.45" rx="3" />
          <rect x={b.x} y={90 - b.h * 0.18} width={28} height={b.h * 0.18} fill="#7c3aed" fillOpacity="0.5" rx="3" />
        </g>
      ))}
      <text x="4" y="12" fill="#7c3aed" fontSize="9" fontWeight="700">1 840 €/mois</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Pension estimée</text>
    </svg>
  )
}

function PreviewSavingsRate() {
  const cx = 55, cy = 52, r = 38, pct = 0.32
  const angle = pct * 2 * Math.PI - Math.PI / 2
  const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle)
  const large = pct > 0.5 ? 1 : 0
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(10,10,10,0.08)" strokeWidth="10" />
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`} fill="none" stroke="#60a5fa" strokeWidth="10" strokeLinecap="round" />
      <text x={cx} y={cy + 4} fill="#60a5fa" fontSize="13" fontWeight="800" textAnchor="middle">32%</text>
      <text x={cx} y={cy + 16} fill="#9A907F" fontSize="7" textAnchor="middle">d&apos;épargne</text>
      <text x="120" y="20" fill="#0A0A0A" fontSize="9" fontWeight="700">2 800 €/mois</text>
      <text x="120" y="30" fill="#9A907F" fontSize="7">Revenus nets</text>
      <text x="120" y="50" fill="#10b981" fontSize="9" fontWeight="700">896 €</text>
      <text x="120" y="60" fill="#9A907F" fontSize="7">Épargné ce mois</text>
    </svg>
  )
}

function PreviewBudget() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <rect x="4"   y="30" width="130" height="22" fill="#60a5fa" fillOpacity="0.5" rx="3" />
      <rect x="4"   y="56" width="78"  height="22" fill="#a78bfa" fillOpacity="0.5" rx="3" />
      <rect x="4"   y="82" width="52"  height="14" fill="#34d399" fillOpacity="0.5" rx="3" />
      <text x="138" y="45" fill="#60a5fa" fontSize="8" fontWeight="700"> 50% Besoins</text>
      <text x="86"  y="71" fill="#a78bfa" fontSize="8" fontWeight="700"> 30% Envies</text>
      <text x="60"  y="92" fill="#34d399" fontSize="8" fontWeight="700"> 20% Épargne</text>
      <text x="4"   y="20" fill="#9A907F" fontSize="7">Sur 2 800 €/mois nets</text>
    </svg>
  )
}

function PreviewDca() {
  const pts = [0,3,7,5,10,14,11,17,22,19,26,30].map((v,i) => `${i*24},${85-v*2.4}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <defs><linearGradient id="dca-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.18"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,85 ${pts.join(' ')} 264,85`} fill="url(#dca-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
      {[0,2,4,6,8,10].map(i => <circle key={i} cx={i*24*2} cy={85 - [0,7,10,11,22,26][i/2]*2.4} r="3" fill="#22c55e" fillOpacity="0.8" />)}
      <text x="4" y="12" fill="#22c55e" fontSize="9" fontWeight="700">+34%</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Rendement DCA 12 mois</text>
    </svg>
  )
}

function PreviewEnvelopeCompare() {
  const groups = [{ label: 'PEA', color: '#7c3aed', h: 82 }, { label: 'AV', color: '#818cf8', h: 68 }, { label: 'CTO', color: '#fb923c', h: 54 }]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {groups.map((g, i) => (
        <g key={i}>
          <rect x={i * 88 + 12} y={90 - g.h} width={60} height={g.h} fill={g.color} fillOpacity="0.45" rx="4" />
          <text x={i * 88 + 42} y={90 - g.h - 5} fill={g.color} fontSize="8" fontWeight="700" textAnchor="middle">{g.label}</text>
        </g>
      ))}
      <text x="4" y="12" fill="#9A907F" fontSize="7">Rendement net après fiscalité · 15 ans</text>
    </svg>
  )
}

function PreviewEmergencyFund() {
  const pct = 0.62
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <rect x="12" y="50" width="240" height="18" fill="rgba(10,10,10,0.06)" rx="9" />
      <rect x="12" y="50" width={240*pct} height="18" fill="#f59e0b" fillOpacity="0.7" rx="9" />
      <text x="133" y="62" fill="#0A0A0A" fontSize="8" fontWeight="800" textAnchor="middle">62%</text>
      <text x="4"   y="36" fill="#f59e0b" fontSize="9" fontWeight="700">3 720 €</text>
      <text x="4"   y="46" fill="#9A907F" fontSize="7">sur 6 000 € objectif (6 mois)</text>
      <text x="4"   y="82" fill="#9A907F" fontSize="7">Reste à constituer : 2 280 €</text>
    </svg>
  )
}

function PreviewRental() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <rect x="4"  y="30" width="110" height="16" fill="#34d399" fillOpacity="0.55" rx="3" />
      <rect x="4"  y="50" width="80"  height="16" fill="#f59e0b" fillOpacity="0.5" rx="3" />
      <rect x="4"  y="70" width="55"  height="16" fill="#7c3aed" fillOpacity="0.5" rx="3" />
      <text x="120" y="42" fill="#10b981" fontSize="8">Rendement brut : 6.8%</text>
      <text x="90"  y="62" fill="#f59e0b" fontSize="8">Rendement net : 4.9%</text>
      <text x="64"  y="82" fill="#7c3aed" fontSize="8">Cash-flow : +180 €/mois</text>
      <text x="4"   y="20" fill="#9A907F" fontSize="7">Bien 180 000 € · Loyer 1 020 €/mois</text>
    </svg>
  )
}

function PreviewSuccession() {
  const bars = [{ label: 'Enfant', pct: 5, color: '#7c3aed' }, { label: 'Frère', pct: 35, color: '#818cf8' }, { label: 'Neveu', pct: 55, color: '#fb923c' }, { label: 'Tiers', pct: 60, color: '#f87171' }]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={60} y={i*21+10} width={b.pct * 3} height={14} fill={b.color} fillOpacity="0.6" rx="3" />
          <text x={55} y={i*21+21} fill="#9A907F" fontSize="7" textAnchor="end">{b.label}</text>
          <text x={60 + b.pct*3 + 4} y={i*21+21} fill={b.color} fontSize="7">{b.pct}%</text>
        </g>
      ))}
      <text x="4" y="96" fill="#9A907F" fontSize="7">Droits de succession selon lien de parenté</text>
    </svg>
  )
}

function PreviewDividends() {
  const bars = [12, 18, 24, 32, 42, 55, 70].map((h, i) => ({ h, x: i * 36 + 10 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={90 - b.h * 0.78} width={24} height={b.h * 0.78} fill="#c084fc" fillOpacity={0.3 + i * 0.08} rx="3" />
      ))}
      <text x="4" y="12" fill="#c084fc" fontSize="9" fontWeight="700">2 100 €/an</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Dividendes à 7 ans</text>
    </svg>
  )
}

function PreviewEtf() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      <rect x="4" y="20" width="180" height="12" fill="#7c3aed" fillOpacity="0.5" rx="3" />
      <rect x="4" y="36" width="145" height="12" fill="#38bdf8" fillOpacity="0.5" rx="3" />
      <rect x="4" y="52" width="110" height="12" fill="#a78bfa" fillOpacity="0.5" rx="3" />
      <rect x="4" y="68" width="80"  height="12" fill="#34d399" fillOpacity="0.5" rx="3" />
      <text x="192" y="30" fill="#7c3aed" fontSize="7">MSCI World · 0.20%</text>
      <text x="157" y="46" fill="#38bdf8" fontSize="7">S&amp;P 500 · 0.07%</text>
      <text x="122" y="62" fill="#a78bfa" fontSize="7">Europe · 0.12%</text>
      <text x="92"  y="78" fill="#34d399" fontSize="7">EM · 0.18%</text>
      <text x="4"   y="96" fill="#9A907F" fontSize="7">Frais annuels TER — impact sur 20 ans</text>
    </svg>
  )
}

function PreviewScore() {
  const pillars = [
    { label: 'Épargne', pct: 82, color: '#7c3aed' },
    { label: 'Dettes', pct: 65, color: '#10b981' },
    { label: 'Diversif.', pct: 74, color: '#38bdf8' },
    { label: 'Fiscal', pct: 58, color: '#818cf8' },
    { label: 'Prévoy.', pct: 70, color: '#fb923c' },
    { label: 'FIRE', pct: 45, color: '#a78bfa' },
  ]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {pillars.map((p, i) => (
        <g key={i}>
          <rect x={i*44+4} y={90-p.pct*0.72} width={32} height={p.pct*0.72} fill={p.color} fillOpacity="0.45" rx="3" />
          <text x={i*44+20} y={90-p.pct*0.72-4} fill={p.color} fontSize="6" textAnchor="middle">{p.pct}</text>
          <text x={i*44+20} y={98} fill="#9A907F" fontSize="5.5" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

function PreviewCreditConso() {
  const bars = [800, 750, 695, 635, 568, 493, 410, 316, 211, 95].map((v, i) => ({ v, x: i * 26 + 4 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 90 }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={90 - b.v/10} width={18} height={b.v/10} fill="#f87171" fillOpacity={0.3 + i*0.05} rx="2" />
      ))}
      <text x="4" y="12" fill="#f87171" fontSize="9" fontWeight="700">+1 840 €</text>
      <text x="4" y="22" fill="#9A907F" fontSize="7">Coût réel total des intérêts</text>
    </svg>
  )
}

// ── Tool data ──────────────────────────────────────────────────────────────

const TOOLS = [
  // Épargne & Investissement
  { slug: 'interets-composes', em: '📈', label: 'Intérêts composés',            desc: "L'effet boule de neige sur votre épargne long terme.", tag: 'Épargne & Investissement', color: '#7c3aed', href: '/tools/interets-composes',    Preview: PreviewCompound },
  { slug: 'fire',              em: '🔥', label: 'FI/RE — Indépendance financière', desc: 'Calculez votre date de liberté financière.',         tag: 'Épargne & Investissement', color: '#fb923c', href: '/tools/fire',                 Preview: PreviewFire },
  { slug: 'dca',               em: '🔄', label: 'Dollar Cost Averaging',        desc: "Investissement régulier : lissage du prix de revient.", tag: 'Épargne & Investissement', color: '#22c55e', href: '/tools/dca',                  Preview: PreviewDca },
  { slug: 'revenus-passifs',   em: '💸', label: 'Revenus passifs & dividendes', desc: 'Simulez vos dividendes et revenus passifs futurs.',     tag: 'Épargne & Investissement', color: '#c084fc', href: '/tools/revenus-passifs',      Preview: PreviewDividends },
  { slug: 'optimiseur-etf',    em: '⚖️', label: 'Optimiseur ETF',               desc: 'Comparez TER et impact des frais sur 20 ans.',          tag: 'Épargne & Investissement', color: '#7c3aed', href: '/tools/optimiseur-etf',       Preview: PreviewEtf },
  // Immobilier
  { slug: 'pret-immobilier',   em: '🏠', label: 'Crédit immobilier',            desc: "Mensualités, coût total, tableau d'amortissement.",     tag: 'Immobilier',               color: '#a78bfa', href: '/tools/pret-immobilier',      Preview: PreviewMortgage },
  { slug: 'acheter-ou-louer',  em: '🔑', label: 'Acheter vs Louer',             desc: 'Comparaison patrimoniale sur 20 ans.',                  tag: 'Immobilier',               color: '#38bdf8', href: '/tools/acheter-ou-louer',     Preview: PreviewBuyRent },
  { slug: 'rentabilite-locative', em: '🏢', label: 'Rentabilité locative',      desc: 'Rendement brut, net, cash-flow et TRI.',                tag: 'Immobilier',               color: '#34d399', href: '/tools/rentabilite-locative', Preview: PreviewRental },
  // Fiscalité
  { slug: 'impots-ir',         em: '🧾', label: 'Calcul impôts IR',             desc: 'Impôt sur le revenu avec tranches et parts fiscales.',  tag: 'Fiscalité',                color: '#10b981', href: '/tools/impots-ir',            Preview: PreviewTax },
  { slug: 'flat-tax-bareme',   em: '⚖️', label: 'Flat Tax vs Barème',           desc: 'Optimisez vos revenus de capitaux mobiliers.',          tag: 'Fiscalité',                color: '#818cf8', href: '/tools/flat-tax-bareme',      Preview: PreviewFlatTax },
  { slug: 'pea-cto-av',        em: '📊', label: 'PEA vs CTO vs Assurance Vie',  desc: 'Rendement net après fiscalité par enveloppe.',          tag: 'Fiscalité',                color: '#fb923c', href: '/tools/pea-cto-av',           Preview: PreviewEnvelopeCompare },
  { slug: 'succession',        em: '🏛', label: 'Succession & Donations',       desc: 'Droits de succession et optimisation de la transmission.', tag: 'Fiscalité',             color: '#f87171', href: '/tools/succession',           Preview: PreviewSuccession },
  // Budget & Retraite
  { slug: 'taux-epargne',      em: '💰', label: "Taux d'épargne",               desc: 'Analysez revenus vs dépenses et optimisez.',            tag: 'Budget & Retraite',        color: '#60a5fa', href: '/tools/taux-epargne',         Preview: PreviewSavingsRate },
  { slug: 'budget-50-30-20',   em: '📋', label: 'Budget 50/30/20',              desc: 'Règle budgétaire appliquée à vos revenus.',             tag: 'Budget & Retraite',        color: '#34d399', href: '/tools/budget-50-30-20',      Preview: PreviewBudget },
  { slug: 'epargne-urgence',   em: '🛡️', label: "Épargne d'urgence",            desc: 'Matelas de sécurité idéal selon vos dépenses.',         tag: 'Budget & Retraite',        color: '#f59e0b', href: '/tools/epargne-urgence',      Preview: PreviewEmergencyFund },
  { slug: 'retraite',          em: '🎯', label: 'Simulateur retraite',          desc: 'Pension estimée et épargne nécessaire à la retraite.',  tag: 'Budget & Retraite',        color: '#a78bfa', href: '/tools/retraite',             Preview: PreviewRetirement },
  { slug: 'score-patrimonial', em: '🏆', label: 'Score patrimonial',            desc: 'Notation 0-100 sur 6 piliers de votre situation.',      tag: 'Budget & Retraite',        color: '#7c3aed', href: '/tools/score-patrimonial',    Preview: PreviewScore },
  { slug: 'credit-conso',      em: '💳', label: 'Coût réel crédit conso',       desc: 'Visualisez le vrai coût de vos crédits à la consommation.', tag: 'Budget & Retraite',    color: '#f87171', href: '/tools/credit-conso',         Preview: PreviewCreditConso },
]

const TAG_META: Record<string, { color: string; dotColor: string; desc: string }> = {
  'Épargne & Investissement': { color: '#7c3aed', dotColor: '#7c3aed', desc: 'Faites fructifier votre épargne' },
  'Immobilier':               { color: '#0ea5e9', dotColor: '#0ea5e9', desc: 'Achat, crédit et investissement locatif' },
  'Fiscalité':                { color: '#10b981', dotColor: '#10b981', desc: 'Optimisez vos impôts et revenus du capital' },
  'Budget & Retraite':        { color: '#f59e0b', dotColor: '#f59e0b', desc: 'Pilotez vos dépenses et préparez l\'avenir' },
}

export function ToolsGrid() {
  const tags = [...new Set(TOOLS.map(t => t.tag))]
  return (
    <>
      {tags.map(tag => {
        const meta = TAG_META[tag] || { color: '#7c3aed', dotColor: '#7c3aed', desc: '' }
        return (
          <div key={tag} style={{ marginBottom: 56 }}>
            {/* Category header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 16, borderBottom: `1px solid rgba(10,10,10,0.10)` }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: meta.dotColor, display: 'inline-block', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700, color: meta.color, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{tag}</h2>
                {meta.desc && <p style={{ fontSize: 12, color: '#9A907F', margin: '2px 0 0', fontFamily: "'Geist', system-ui" }}>{meta.desc}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {TOOLS.filter(t => t.tag === tag).map(tool => {
                const Preview = tool.Preview
                return (
                  <Link key={tool.slug} href={tool.href} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(10,10,10,0.10)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = tool.color + '55'
                        el.style.boxShadow = `0 8px 32px ${tool.color}14, 0 2px 8px rgba(10,10,10,0.06)`
                        el.style.transform = 'translateY(-3px)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'rgba(10,10,10,0.10)'
                        el.style.boxShadow = 'none'
                        el.style.transform = 'none'
                      }}
                    >
                      {/* Mini preview */}
                      <div style={{ background: `${tool.color}08`, borderBottom: `1px solid ${tool.color}14`, padding: '14px 16px 10px', overflow: 'hidden' }}>
                        <Preview />
                      </div>
                      {/* Card info */}
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: `${tool.color}12`, border: `1px solid ${tool.color}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            fontSize: 16,
                          }}>
                            {tool.em}
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.25, fontFamily: "'Geist', system-ui" }}>{tool.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6B6356', lineHeight: 1.55, margin: '0 0 12px', fontFamily: "'Geist', system-ui" }}>{tool.desc}</p>
                        <span style={{ fontSize: 11, fontWeight: 700, color: tool.color, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'Geist Mono', monospace", letterSpacing: '0.04em' }}>
                          Ouvrir →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
