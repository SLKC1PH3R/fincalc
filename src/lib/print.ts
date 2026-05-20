const GOLD = '#c4922a'
const GOLD_LIGHT = '#B07820'

export interface PrintKPI {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  color?: string
}

export interface PrintSection {
  title: string
  items: { label: string; value: string }[]
}

export interface PrintConfig {
  title: string
  subtitle?: string
  kpis: PrintKPI[]
  inputs?: { label: string; value: string }[]
  sections?: PrintSection[]
  tips?: string[]
}

export function printReport(config: PrintConfig) {
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const kpisHtml = config.kpis.map(k => `
    <div class="kpi${k.highlight ? ' highlight' : ''}">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="${k.color ? `color:${k.color}` : ''}">${k.value}</div>
      ${k.sub ? `<div class="kpi-sub">${k.sub}</div>` : ''}
    </div>`).join('')

  const inputsHtml = config.inputs?.length ? `
    <div class="section">
      <div class="section-title">Paramètres de la simulation</div>
      <div class="inputs-grid">
        ${config.inputs.map(inp => `
        <div class="input-item">
          <div class="input-label">${inp.label}</div>
          <div class="input-value">${inp.value}</div>
        </div>`).join('')}
      </div>
    </div>` : ''

  const sectionsHtml = (config.sections ?? []).map(s => `
    <div class="section">
      <div class="section-title">${s.title}</div>
      <table class="table">
        ${s.items.map((item, idx) => `
        <tr class="${idx % 2 === 0 ? 'row-alt' : ''}">
          <td>${item.label}</td>
          <td class="value">${item.value}</td>
        </tr>`).join('')}
      </table>
    </div>`).join('')

  const tipsHtml = config.tips?.length ? `
    <div class="section">
      <div class="section-title">Analyse &amp; Recommandations</div>
      <div class="tips">
        ${config.tips.map((tip, i) => `
        <div class="tip">
          <div class="tip-icon">✦</div>
          <span class="tip-text">${tip}</span>
        </div>`).join('')}
      </div>
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Patrimo — ${config.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: #1a1a1a; background: #fff; font-size: 13px; line-height: 1.5;
    }

    /* ── Page wrapper ── */
    .page { padding: 44px 52px; max-width: 900px; margin: 0 auto; }

    /* ── Header ── */
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 32px; padding-bottom: 22px;
      border-bottom: 2px solid ${GOLD};
      position: relative;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, #8B5E18, ${GOLD_LIGHT});
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(196,146,42,0.30);
    }
    .brand-name { font-size: 17px; font-weight: 800; letter-spacing: -0.03em; color: #1a1a1a; }
    .brand-tag { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 1px; }
    .header-right { text-align: right; }
    .header-title { font-size: 22px; font-weight: 800; letter-spacing: -0.04em; color: #1a1a1a; }
    .header-sub { font-size: 12px; color: #555; margin-top: 3px; line-height: 1.4; font-weight: 500; }
    .header-date { font-size: 10.5px; color: #aaa; margin-top: 5px; letter-spacing: 0.03em; }

    /* ── KPI strip ── */
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
    .kpi {
      background: #f8f8f8; border: 1px solid #e8e8e8; border-radius: 10px;
      padding: 14px 16px;
    }
    .kpi.highlight {
      background: linear-gradient(135deg, #fffbf3, #fff8eb);
      border-color: ${GOLD}55;
      border-left: 3px solid ${GOLD};
    }
    .kpi-label { font-size: 9.5px; color: #888; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 700; margin-bottom: 6px; }
    .kpi-value { font-size: 20px; font-weight: 800; letter-spacing: -0.04em; color: #1a1a1a; line-height: 1; }
    .kpi.highlight .kpi-value { color: ${GOLD}; }
    .kpi-sub { font-size: 10.5px; color: #999; margin-top: 4px; font-weight: 500; }

    /* ── Sections ── */
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em;
      color: #bbb; margin-bottom: 12px; padding-bottom: 6px;
      border-bottom: 1px solid #ebebeb;
    }

    /* ── Inputs grid ── */
    .inputs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .input-item { background: #f8f8f8; border: 1px solid #eaeaea; border-radius: 8px; padding: 10px 13px; }
    .input-label { font-size: 9.5px; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; font-weight: 600; }
    .input-value { font-size: 15px; font-weight: 700; color: #222; letter-spacing: -0.02em; }

    /* ── Data table ── */
    .table { width: 100%; border-collapse: collapse; }
    .table tr { border-bottom: 1px solid #f0f0f0; }
    .table tr:last-child { border-bottom: none; }
    .table tr.row-alt { background: #fafafa; }
    .table td { padding: 8px 6px; font-size: 13px; color: #333; }
    .table td.value { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; color: #111; letter-spacing: -0.01em; }

    /* ── Tips / Insights ── */
    .tips { display: flex; flex-direction: column; gap: 8px; }
    .tip {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 12px 16px; background: #fffbf4;
      border: 1px solid ${GOLD}33; border-left: 3px solid ${GOLD};
      border-radius: 0 8px 8px 0;
    }
    .tip-icon { font-size: 11px; color: ${GOLD}; flex-shrink: 0; margin-top: 1px; font-weight: 700; }
    .tip-text { font-size: 12.5px; color: #444; line-height: 1.6; }

    /* ── Footer ── */
    .footer {
      margin-top: 44px; padding-top: 16px; border-top: 1px solid #e8e8e8;
      display: flex; justify-content: space-between; align-items: center;
      color: #bbb; font-size: 11px;
    }
    .footer-left { display: flex; flex-direction: column; gap: 2px; }
    .footer-brand { font-weight: 700; color: ${GOLD}; font-size: 11.5px; }
    .footer-url { color: #ccc; }
    .footer-right { text-align: right; font-size: 10px; color: #ccc; }

    /* ── Print ── */
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 0; }
      @page { margin: 14mm 16mm; size: A4 portrait; }
      .section { page-break-inside: avoid; }
      .kpis { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">Patrimo</div>
        <div class="brand-tag">Outils de Finance Personnelle</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-title">${config.title}</div>
      ${config.subtitle ? `<div class="header-sub">${config.subtitle}</div>` : ''}
      <div class="header-date">Simulé le ${date} · finance.digitalstack.cloud</div>
    </div>
  </div>

  <div class="kpis">${kpisHtml}</div>
  ${inputsHtml}
  ${sectionsHtml}
  ${tipsHtml}

  <div class="footer">
    <div class="footer-left">
      <span class="footer-brand">Patrimo</span>
      <span class="footer-url">finance.digitalstack.cloud</span>
    </div>
    <div class="footer-right">
      Document généré automatiquement<br>
      Ce document est fourni à titre indicatif uniquement.
    </div>
  </div>
</div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 350); };
    window.onafterprint = function() { window.close(); };
  </script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=960,height=760')
  if (w) { w.document.write(html); w.document.close() }
}
