'use client'
import Link from 'next/link'
import { useState } from 'react'

// ── Mini SVG previews ──────────────────────────────────────────────────────

function PreviewCompound() {
  const pts = [0,4,10,18,30,46,68,100].map((v, i) => `${i * 38},${90 - v * 0.82}`)
  const inv = [0,3,6,9,12,15,18,21].map((v, i) => `${i * 38},${90 - v * 0.82}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <defs><linearGradient id="pc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c96a4a" stopOpacity="0.20"/><stop offset="100%" stopColor="#c96a4a" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,90 ${pts.join(' ')} 266,90`} fill="url(#pc-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#c96a4a" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={inv.join(' ')} fill="none" stroke="#8b8676" strokeWidth="1.5" strokeDasharray="4,3" strokeLinejoin="round" />
      <text x="4" y="14" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">198 k€</text>
      <text x="4" y="24" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Valeur finale</text>
    </svg>
  )
}

function PreviewFire() {
  const pts = [0,2,5,10,17,27,40,57,78,100].map((v, i) => `${i * 29.5},${88 - v * 0.8}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <defs><linearGradient id="pf-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c96a4a" stopOpacity="0.20"/><stop offset="100%" stopColor="#c96a4a" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,88 ${pts.join(' ')} 266,88`} fill="url(#pf-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#c96a4a" strokeWidth="2" strokeLinejoin="round" />
      <line x1="207" y1="10" x2="207" y2="88" stroke="#1F7A4A" strokeWidth="1.5" strokeDasharray="3,3" />
      <text x="210" y="22" fill="#1F7A4A" fontSize="7" fontFamily="JetBrains Mono,monospace">FIRE</text>
      <text x="4" y="14" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">900 k€</text>
      <text x="4" y="24" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Objectif FI/RE</text>
    </svg>
  )
}

function PreviewMortgage() {
  const bars = [100, 94, 87, 78, 67, 53, 37, 18].map((capital, i) => ({ cap: capital, int: 28 - i * 2, x: i * 33 + 4 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={90 - b.cap * 0.72} width={22} height={b.cap * 0.72} fill="#c96a4a" fillOpacity="0.40" rx="2" />
          <rect x={b.x} y={90 - b.cap * 0.72 - b.int * 0.72} width={22} height={b.int * 0.72} fill="#8b8676" fillOpacity="0.30" rx="2" />
        </g>
      ))}
      <text x="4" y="12" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">1 247 €/mois</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Mensualité estimée</text>
    </svg>
  )
}

function PreviewBuyRent() {
  const buy  = [0,8,18,30,40,52,65,80,96,110].map((v,i) => `${i*29.5},${88-v*0.72}`)
  const rent = [0,12,24,36,48,60,72,84,96,108].map((v,i) => `${i*29.5},${88-v*0.72}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <polyline points={buy.join(' ')}  fill="none" stroke="#c96a4a" strokeWidth="2" strokeLinejoin="round" />
      <polyline points={rent.join(' ')} fill="none" stroke="#8b8676" strokeWidth="2" strokeDasharray="4,3" strokeLinejoin="round" />
      <line x1="148" y1="10" x2="148" y2="88" stroke="#8b8676" strokeWidth="1" strokeDasharray="2,2" />
      <text x="4" y="12" fill="#c96a4a" fontSize="7" fontWeight="600" fontFamily="JetBrains Mono,monospace">Achat</text>
      <text x="44" y="12" fill="#8b8676" fontSize="7" fontWeight="600" fontFamily="JetBrains Mono,monospace">Location</text>
      <text x="4" y="24" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Coût total sur 20 ans</text>
    </svg>
  )
}

function PreviewTax() {
  const brackets = [{ w: 52, color: '#1F7A4A', label: '0%' }, { w: 38, color: '#c96a4a', label: '11%' }, { w: 22, color: '#a84f35', label: '30%' }, { w: 10, color: '#8b8676', label: '41%' }]
  let x = 4
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <text x="4" y="12" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">8 420 €</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Impôt estimé</text>
      {brackets.map((b, i) => { const cx = x; x += b.w + 4; return <g key={i}><rect x={cx} y={50} width={b.w} height={28} fill={b.color} fillOpacity="0.55" rx="3" /><text x={cx + b.w/2} y={44} fill={b.color} fontSize="6" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{b.label}</text></g> })}
    </svg>
  )
}

function PreviewFlatTax() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <rect x="20" y="30" width="90" height="50" fill="#c96a4a" fillOpacity="0.40" rx="4" />
      <rect x="156" y="44" width="90" height="36" fill="#8b8676" fillOpacity="0.35" rx="4" />
      <text x="65" y="24" fill="#c96a4a" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono,monospace">Flat Tax 30%</text>
      <text x="201" y="38" fill="#8b8676" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono,monospace">Barème IR</text>
      <text x="65" y="62" fill="#15140f" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono,monospace">3 200 €</text>
      <text x="201" y="74" fill="#15140f" fontSize="9" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono,monospace">4 580 €</text>
      <text x="133" y="90" fill="#1F7A4A" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">Économie 1 380 €</text>
    </svg>
  )
}

function PreviewRetirement() {
  const bars = [45, 58, 72, 88, 100, 115].map((h, i) => ({ h, x: i * 42 + 10 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={90 - b.h * 0.78} width={28} height={b.h * 0.6} fill="#c96a4a" fillOpacity="0.35" rx="3" />
          <rect x={b.x} y={90 - b.h * 0.18} width={28} height={b.h * 0.18} fill="#a84f35" fillOpacity="0.55" rx="3" />
        </g>
      ))}
      <text x="4" y="12" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">1 840 €/mois</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Pension estimée</text>
    </svg>
  )
}

function PreviewSavingsRate() {
  const cx = 55, cy = 52, r = 38, pct = 0.32
  const angle = pct * 2 * Math.PI - Math.PI / 2
  const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle)
  const large = pct > 0.5 ? 1 : 0
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(21,20,15,0.10)" strokeWidth="10" />
      <path d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`} fill="none" stroke="#c96a4a" strokeWidth="10" strokeLinecap="round" />
      <text x={cx} y={cy + 4} fill="#c96a4a" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono,monospace">32%</text>
      <text x={cx} y={cy + 16} fill="#8b8676" fontSize="7" textAnchor="middle" fontFamily="JetBrains Mono,monospace">épargne</text>
      <text x="120" y="20" fill="#15140f" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">2 800 €/mois</text>
      <text x="120" y="30" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Revenus nets</text>
      <text x="120" y="50" fill="#1F7A4A" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">896 €</text>
      <text x="120" y="60" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Épargné ce mois</text>
    </svg>
  )
}

function PreviewBudget() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <rect x="4"   y="30" width="130" height="22" fill="#c96a4a" fillOpacity="0.45" rx="3" />
      <rect x="4"   y="56" width="78"  height="22" fill="#8b8676" fillOpacity="0.40" rx="3" />
      <rect x="4"   y="82" width="52"  height="14" fill="#1F7A4A" fillOpacity="0.45" rx="3" />
      <text x="138" y="45" fill="#c96a4a" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono,monospace"> 50% Besoins</text>
      <text x="86"  y="71" fill="#8b8676" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono,monospace"> 30% Envies</text>
      <text x="60"  y="92" fill="#1F7A4A" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono,monospace"> 20% Épargne</text>
      <text x="4"   y="20" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Sur 2 800 €/mois nets</text>
    </svg>
  )
}

function PreviewDca() {
  const pts = [0,3,7,5,10,14,11,17,22,19,26,30].map((v,i) => `${i*24},${85-v*2.4}`)
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <defs><linearGradient id="dca-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1F7A4A" stopOpacity="0.18"/><stop offset="100%" stopColor="#1F7A4A" stopOpacity="0.02"/></linearGradient></defs>
      <polygon points={`0,85 ${pts.join(' ')} 264,85`} fill="url(#dca-g)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#1F7A4A" strokeWidth="2" strokeLinejoin="round" />
      {[0,2,4,6,8,10].map(i => <circle key={i} cx={i*24*2} cy={85 - [0,7,10,11,22,26][i/2]*2.4} r="3" fill="#1F7A4A" fillOpacity="0.8" />)}
      <text x="4" y="12" fill="#1F7A4A" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">+34%</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Rendement DCA 12 mois</text>
    </svg>
  )
}

function PreviewEnvelopeCompare() {
  const groups = [{ label: 'PEA', color: '#c96a4a', h: 82 }, { label: 'AV', color: '#8b8676', h: 68 }, { label: 'CTO', color: '#a84f35', h: 54 }]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {groups.map((g, i) => (
        <g key={i}>
          <rect x={i * 88 + 12} y={90 - g.h} width={60} height={g.h} fill={g.color} fillOpacity="0.45" rx="4" />
          <text x={i * 88 + 42} y={90 - g.h - 5} fill={g.color} fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{g.label}</text>
        </g>
      ))}
      <text x="4" y="12" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Rendement net après fiscalité · 15 ans</text>
    </svg>
  )
}

function PreviewEmergencyFund() {
  const pct = 0.62
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <rect x="12" y="50" width="240" height="18" fill="rgba(21,20,15,0.08)" rx="9" />
      <rect x="12" y="50" width={240*pct} height="18" fill="#c96a4a" fillOpacity="0.65" rx="9" />
      <text x="133" y="62" fill="#15140f" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono,monospace">62%</text>
      <text x="4"   y="36" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">3 720 €</text>
      <text x="4"   y="46" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">sur 6 000 € objectif (6 mois)</text>
      <text x="4"   y="82" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Reste à constituer : 2 280 €</text>
    </svg>
  )
}

function PreviewRental() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <rect x="4"  y="30" width="110" height="16" fill="#1F7A4A" fillOpacity="0.55" rx="3" />
      <rect x="4"  y="50" width="80"  height="16" fill="#c96a4a" fillOpacity="0.50" rx="3" />
      <rect x="4"  y="70" width="55"  height="16" fill="#a84f35" fillOpacity="0.50" rx="3" />
      <text x="120" y="42" fill="#1F7A4A" fontSize="8" fontFamily="JetBrains Mono,monospace">Rendement brut : 6.8%</text>
      <text x="90"  y="62" fill="#c96a4a" fontSize="8" fontFamily="JetBrains Mono,monospace">Rendement net : 4.9%</text>
      <text x="64"  y="82" fill="#a84f35" fontSize="8" fontFamily="JetBrains Mono,monospace">Cash-flow : +180 €/mois</text>
      <text x="4"   y="20" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Bien 180 000 € · Loyer 1 020 €/mois</text>
    </svg>
  )
}

function PreviewSuccession() {
  const bars = [{ label: 'Enfant', pct: 5, color: '#1F7A4A' }, { label: 'Frère', pct: 35, color: '#c96a4a' }, { label: 'Neveu', pct: 55, color: '#a84f35' }, { label: 'Tiers', pct: 60, color: '#8b8676' }]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={60} y={i*21+10} width={b.pct * 3} height={14} fill={b.color} fillOpacity="0.6" rx="3" />
          <text x={55} y={i*21+21} fill="#8b8676" fontSize="7" textAnchor="end" fontFamily="JetBrains Mono,monospace">{b.label}</text>
          <text x={60 + b.pct*3 + 4} y={i*21+21} fill={b.color} fontSize="7" fontFamily="JetBrains Mono,monospace">{b.pct}%</text>
        </g>
      ))}
      <text x="4" y="96" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Droits de succession selon lien de parenté</text>
    </svg>
  )
}

function PreviewDividends() {
  const bars = [12, 18, 24, 32, 42, 55, 70].map((h, i) => ({ h, x: i * 36 + 10 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={90 - b.h * 0.78} width={24} height={b.h * 0.78} fill="#c96a4a" fillOpacity={0.20 + i * 0.08} rx="3" />
      ))}
      <text x="4" y="12" fill="#c96a4a" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">2 100 €/an</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Dividendes à 7 ans</text>
    </svg>
  )
}

function PreviewEtf() {
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      <rect x="4" y="20" width="180" height="12" fill="#c96a4a" fillOpacity="0.50" rx="3" />
      <rect x="4" y="36" width="145" height="12" fill="#a84f35" fillOpacity="0.50" rx="3" />
      <rect x="4" y="52" width="110" height="12" fill="#8b8676" fillOpacity="0.45" rx="3" />
      <rect x="4" y="68" width="80"  height="12" fill="#1F7A4A" fillOpacity="0.50" rx="3" />
      <text x="192" y="30" fill="#c96a4a" fontSize="7" fontFamily="JetBrains Mono,monospace">MSCI World · 0.20%</text>
      <text x="157" y="46" fill="#a84f35" fontSize="7" fontFamily="JetBrains Mono,monospace">S&P 500 · 0.07%</text>
      <text x="122" y="62" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Europe · 0.12%</text>
      <text x="92"  y="78" fill="#1F7A4A" fontSize="7" fontFamily="JetBrains Mono,monospace">EM · 0.18%</text>
      <text x="4"   y="96" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Frais annuels TER — impact sur 20 ans</text>
    </svg>
  )
}

function PreviewScore() {
  const pillars = [
    { label: 'Épargne', pct: 82, color: '#c96a4a' },
    { label: 'Dettes', pct: 65, color: '#1F7A4A' },
    { label: 'Diversif.', pct: 74, color: '#8b8676' },
    { label: 'Fiscal', pct: 58, color: '#a84f35' },
    { label: 'Prévoy.', pct: 70, color: '#5a5448' },
    { label: 'FIRE', pct: 45, color: '#8b8676' },
  ]
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {pillars.map((p, i) => (
        <g key={i}>
          <rect x={i*44+4} y={90-p.pct*0.72} width={32} height={p.pct*0.72} fill={p.color} fillOpacity="0.45" rx="3" />
          <text x={i*44+20} y={90-p.pct*0.72-4} fill={p.color} fontSize="6" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{p.pct}</text>
          <text x={i*44+20} y={98} fill="#8b8676" fontSize="5.5" textAnchor="middle" fontFamily="JetBrains Mono,monospace">{p.label}</text>
        </g>
      ))}
    </svg>
  )
}

function PreviewCreditConso() {
  const bars = [800, 750, 695, 635, 568, 493, 410, 316, 211, 95].map((v, i) => ({ v, x: i * 26 + 4 }))
  return (
    <svg viewBox="0 0 266 100" style={{ width: '100%', height: 80 }}>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={90 - b.v/10} width={18} height={b.v/10} fill="#a84f35" fillOpacity={0.25 + i*0.05} rx="2" />
      ))}
      <text x="4" y="12" fill="#a84f35" fontSize="9" fontWeight="700" fontFamily="JetBrains Mono,monospace">+1 840 €</text>
      <text x="4" y="22" fill="#8b8676" fontSize="7" fontFamily="JetBrains Mono,monospace">Coût réel total des intérêts</text>
    </svg>
  )
}

// ── Tool data ──────────────────────────────────────────────────────────────

const TOOLS = [
  { slug: 'interets-composes', label: 'Intérêts composés',            desc: "L'effet boule de neige sur votre épargne long terme.", tag: 'Épargne & Investissement', href: '/tools/interets-composes',    Preview: PreviewCompound },
  { slug: 'fire',              label: 'FI/RE — Indépendance financière', desc: 'Calculez votre date de liberté financière.',         tag: 'Épargne & Investissement', href: '/tools/fire',                 Preview: PreviewFire },
  { slug: 'dca',               label: 'Dollar Cost Averaging',        desc: "Investissement régulier : lissage du prix de revient.", tag: 'Épargne & Investissement', href: '/tools/dca',                  Preview: PreviewDca },
  { slug: 'revenus-passifs',   label: 'Revenus passifs & dividendes', desc: 'Simulez vos dividendes et revenus passifs futurs.',     tag: 'Épargne & Investissement', href: '/tools/revenus-passifs',      Preview: PreviewDividends },
  { slug: 'optimiseur-etf',    label: 'Optimiseur ETF',               desc: 'Comparez TER et impact des frais sur 20 ans.',          tag: 'Épargne & Investissement', href: '/tools/optimiseur-etf',       Preview: PreviewEtf },
  { slug: 'pret-immobilier',   label: 'Crédit immobilier',            desc: "Mensualités, coût total, tableau d'amortissement.",     tag: 'Immobilier',               href: '/tools/pret-immobilier',      Preview: PreviewMortgage },
  { slug: 'acheter-ou-louer',  label: 'Acheter vs Louer',             desc: 'Comparaison patrimoniale sur 20 ans.',                  tag: 'Immobilier',               href: '/tools/acheter-ou-louer',     Preview: PreviewBuyRent },
  { slug: 'rentabilite-locative', label: 'Rentabilité locative',      desc: 'Rendement brut, net, cash-flow et TRI.',                tag: 'Immobilier',               href: '/tools/rentabilite-locative', Preview: PreviewRental },
  { slug: 'impots-ir',         label: 'Calcul impôts IR',             desc: 'Impôt sur le revenu avec tranches et parts fiscales.',  tag: 'Fiscalité',                href: '/tools/impots-ir',            Preview: PreviewTax },
  { slug: 'flat-tax-bareme',   label: 'Flat Tax vs Barème',           desc: 'Optimisez vos revenus de capitaux mobiliers.',          tag: 'Fiscalité',                href: '/tools/flat-tax-bareme',      Preview: PreviewFlatTax },
  { slug: 'pea-cto-av',        label: 'PEA vs CTO vs Assurance Vie',  desc: 'Rendement net après fiscalité par enveloppe.',          tag: 'Fiscalité',                href: '/tools/pea-cto-av',           Preview: PreviewEnvelopeCompare },
  { slug: 'succession',        label: 'Succession & Donations',       desc: 'Droits de succession et optimisation de la transmission.', tag: 'Fiscalité',             href: '/tools/succession',           Preview: PreviewSuccession },
  { slug: 'taux-epargne',      label: "Taux d'épargne",               desc: 'Analysez revenus vs dépenses et optimisez.',            tag: 'Budget & Retraite',        href: '/tools/taux-epargne',         Preview: PreviewSavingsRate },
  { slug: 'budget-50-30-20',   label: 'Budget 50/30/20',              desc: 'Règle budgétaire appliquée à vos revenus.',             tag: 'Budget & Retraite',        href: '/tools/budget-50-30-20',      Preview: PreviewBudget },
  { slug: 'epargne-urgence',   label: "Épargne d'urgence",            desc: 'Matelas de sécurité idéal selon vos dépenses.',         tag: 'Budget & Retraite',        href: '/tools/epargne-urgence',      Preview: PreviewEmergencyFund },
  { slug: 'retraite',          label: 'Simulateur retraite',          desc: 'Pension estimée et épargne nécessaire à la retraite.',  tag: 'Budget & Retraite',        href: '/tools/retraite',             Preview: PreviewRetirement },
  { slug: 'score-patrimonial', label: 'Score patrimonial',            desc: 'Notation 0-100 sur 6 piliers de votre situation.',      tag: 'Budget & Retraite',        href: '/tools/score-patrimonial',    Preview: PreviewScore },
  { slug: 'credit-conso',      label: 'Coût réel crédit conso',       desc: 'Visualisez le vrai coût de vos crédits à la consommation.', tag: 'Budget & Retraite',    href: '/tools/credit-conso',         Preview: PreviewCreditConso },
]

const TAGS = ['Épargne & Investissement', 'Immobilier', 'Fiscalité', 'Budget & Retraite'] as const
type Tag = typeof TAGS[number]

const TAG_INDEX: Record<Tag, string> = {
  'Épargne & Investissement': '01',
  'Immobilier':               '02',
  'Fiscalité':                '03',
  'Budget & Retraite':        '04',
}

const GRID_CSS = `
.tz-cat-rule{display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(21,20,15,.10);padding-bottom:14px;margin-bottom:24px}
.tz-cat-num{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:#c96a4a;text-transform:uppercase}
.tz-cat-name{font-family:'Inter Tight',sans-serif;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#15140f}
.tz-cat-count{font-family:'JetBrains Mono',monospace;font-size:10px;color:#8b8676;margin-left:auto}
.tz-cat-sep{height:1px;flex:1;background:rgba(21,20,15,.08)}
.tz-tools-group{margin-bottom:64px}
.tz-tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:16px}
.tz-tool-card{background:#faf6ec;border:1px solid rgba(21,20,15,.10);border-radius:16px;overflow:hidden;cursor:pointer;transition:transform .22s,box-shadow .22s,border-color .22s;text-decoration:none;display:block;color:#15140f}
.tz-tool-card:hover{transform:translateY(-4px);box-shadow:0 12px 36px rgba(21,20,15,.10),0 2px 8px rgba(21,20,15,.06);border-color:rgba(201,106,74,.30)}
.tz-tool-preview{background:rgba(21,20,15,.03);border-bottom:1px solid rgba(21,20,15,.08);padding:16px 18px 10px}
.tz-tool-body{padding:16px 18px 18px}
.tz-tool-meta{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.12em;color:#8b8676;text-transform:uppercase;margin-bottom:8px}
.tz-tool-title{font-family:'Inter Tight',sans-serif;font-size:15px;font-weight:700;line-height:1.2;letter-spacing:-.012em;margin-bottom:8px;color:#15140f}
.tz-tool-desc{font-size:12.5px;color:#5a5448;line-height:1.55;margin:0 0 14px}
.tz-tool-arrow{font-family:'JetBrains Mono',monospace;font-size:11px;color:#c96a4a;letter-spacing:.04em}

.tz-filter-pills{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:48px}
.tz-filter-pill{padding:8px 16px;border-radius:999px;border:1px solid rgba(21,20,15,.12);font-family:'Inter Tight',sans-serif;font-size:12.5px;color:#5a5448;background:transparent;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:7px}
.tz-filter-pill:hover{background:rgba(21,20,15,.04)}
.tz-filter-pill.active{background:#15140f;border-color:#15140f;color:#efe7d2}
.tz-filter-pill.active .tz-pill-n{color:#c96a4a}
.tz-pill-n{font-family:'JetBrains Mono',monospace;font-size:10px;opacity:.75}
@media(max-width:640px){.tz-tools-grid{grid-template-columns:1fr}}
`

export function ToolsGrid() {
  const [active, setActive] = useState<string>('all')
  const tags = TAGS.filter(tag => active === 'all' || tag === active)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      {/* Filter pills */}
      <div className="tz-filter-pills">
        {(['all', ...TAGS] as const).map((tag) => {
          const count = tag === 'all' ? TOOLS.length : TOOLS.filter(t => t.tag === tag).length
          const label = tag === 'all' ? 'Tous les simulateurs' : tag
          return (
            <button
              key={tag}
              className={`tz-filter-pill${active === tag ? ' active' : ''}`}
              onClick={() => setActive(tag)}
            >
              {label} <span className="tz-pill-n">{String(count).padStart(2,'0')}</span>
            </button>
          )
        })}
      </div>

      {tags.map(tag => (
        <div key={tag} className="tz-tools-group">
          <div className="tz-cat-rule">
            <span className="tz-cat-num">{TAG_INDEX[tag]}</span>
            <span className="tz-cat-sep" />
            <span className="tz-cat-name">{tag}</span>
            <span className="tz-cat-count">{String(TOOLS.filter(t => t.tag === tag).length).padStart(2,'0')}</span>
          </div>
          <div className="tz-tools-grid">
            {TOOLS.filter(t => t.tag === tag).map(tool => {
              const Preview = tool.Preview
              return (
                <Link key={tool.slug} href={tool.href} className="tz-tool-card">
                  <div className="tz-tool-preview">
                    <Preview />
                  </div>
                  <div className="tz-tool-body">
                    <div className="tz-tool-meta">PTM-{String(TOOLS.findIndex(t => t.slug === tool.slug) + 1).padStart(2,'0')}</div>
                    <div className="tz-tool-title">{tool.label}</div>
                    <p className="tz-tool-desc">{tool.desc}</p>
                    <span className="tz-tool-arrow">Ouvrir →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
