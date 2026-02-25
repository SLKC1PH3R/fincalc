const GOLD = '#c4922a'

export interface PrintKPI {
  label: string
  value: string
  sub?: string
  highlight?: boolean
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
      <div class="kpi-value">${k.value}</div>
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
        ${s.items.map(item => `
        <tr>
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
          <span class="tip-num">${i + 1}.</span>
          <span class="tip-text">${tip}</span>
        </div>`).join('')}
      </div>
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>FinCalc — ${config.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: #111; background: #fff; padding: 44px 52px; font-size: 13px; line-height: 1.5;
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 30px; padding-bottom: 18px; border-bottom: 2px solid ${GOLD};
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 30px; height: 30px; background: ${GOLD}; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; color: #111; }
    .header-right { text-align: right; }
    .header-title { font-size: 20px; font-weight: 700; letter-spacing: -0.03em; color: #111; }
    .header-sub { font-size: 12px; color: #666; margin-top: 3px; line-height: 1.4; }
    .header-date { font-size: 11px; color: #aaa; margin-top: 4px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 26px; }
    .kpi { background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px 16px; }
    .kpi.highlight { background: #fffbf4; border-color: ${GOLD}66; }
    .kpi-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; margin-bottom: 5px; }
    .kpi-value { font-size: 19px; font-weight: 700; letter-spacing: -0.03em; color: #111; }
    .kpi.highlight .kpi-value { color: ${GOLD}; }
    .kpi-sub { font-size: 11px; color: #999; margin-top: 2px; }
    .section { margin-bottom: 22px; }
    .section-title {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
      color: #999; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #ebebeb;
    }
    .inputs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .input-item { background: #f7f7f7; border: 1px solid #eaeaea; border-radius: 6px; padding: 9px 12px; }
    .input-label { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .input-value { font-size: 14px; font-weight: 600; color: #222; }
    .table { width: 100%; border-collapse: collapse; }
    .table tr { border-bottom: 1px solid #ebebeb; }
    .table tr:last-child { border-bottom: none; }
    .table td { padding: 8px 4px; font-size: 13px; color: #333; }
    .table td.value { font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; color: #111; }
    .tips { display: flex; flex-direction: column; gap: 8px; }
    .tip { display: flex; gap: 12px; padding: 10px 14px; background: #fafafa; border-left: 3px solid ${GOLD}; border-radius: 0 6px 6px 0; }
    .tip-num { font-size: 11px; font-weight: 700; color: ${GOLD}; flex-shrink: 0; padding-top: 1px; }
    .tip-text { font-size: 12px; color: #444; line-height: 1.55; }
    .footer {
      margin-top: 40px; padding-top: 14px; border-top: 1px solid #e8e8e8;
      display: flex; justify-content: space-between; color: #bbb; font-size: 11px;
    }
    @media print {
      body { padding: 20px 28px; }
      @page { margin: 12mm 15mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          <polyline points="16 7 22 7 22 13"/>
        </svg>
      </div>
      <span class="brand-name">FinCalc</span>
    </div>
    <div class="header-right">
      <div class="header-title">${config.title}</div>
      ${config.subtitle ? `<div class="header-sub">${config.subtitle}</div>` : ''}
      <div class="header-date">Généré le ${date}</div>
    </div>
  </div>

  <div class="kpis">${kpisHtml}</div>
  ${inputsHtml}
  ${sectionsHtml}
  ${tipsHtml}

  <div class="footer">
    <span>FinCalc — Outils de Finance Personnelle</span>
    <span>fire.digitalstack.cloud</span>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    window.onload = function() {
      setTimeout(function() {
        var el = document.body;
        html2pdf().set({
          margin: [10, 15, 10, 15],
          filename: document.title.replace('FinCalc — ', '') + '.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(el).save().then(function() { window.close(); });
      }, 400);
    };
  </script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=920,height=720')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}
