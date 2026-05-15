'use client'

import React, { useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────────
   Patrimo — landing page
   Design system : Atelier Zero (Monocle / Apartamento editorial)
   Typography    : Inter Tight · Inter · Playfair Display · JetBrains Mono
   Palette       : warm paper #EFE7D2 · ink #15140F · coral #C96A4A
───────────────────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --paper:       #efe7d2;
  --paper-warm:  #ece4cf;
  --paper-dark:  #ddd2b6;
  --ink:         #15140f;
  --ink-soft:    #2a2620;
  --ink-mute:    #5a5448;
  --ink-faint:   #8b8676;
  --coral:       #c96a4a;
  --coral-soft:  #d4836a;
  --mustard:     #e9b94a;
  --bone:        #f7f1de;
  --line:        rgba(21,20,15,.16);
  --line-soft:   rgba(21,20,15,.08);
  --line-faint:  rgba(21,20,15,.05);
  --shadow:      0 30px 60px -30px rgba(21,20,15,.18);
  --serif:       'Playfair Display','Times New Roman',serif;
  --sans:        'Inter Tight','Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  --body:        'Inter',-apple-system,system-ui,sans-serif;
  --mono:        'JetBrains Mono','SF Mono',Menlo,monospace;
}

*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--paper);color:var(--ink)}
body{font-family:var(--body);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden;position:relative}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(circle at 12% 18%,rgba(106,92,56,.07) 0,transparent 28%),radial-gradient(circle at 88% 72%,rgba(106,92,56,.06) 0,transparent 32%),url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");background-size:auto,auto,240px 240px;mix-blend-mode:multiply;opacity:.92}

.patrimo-shell{position:relative;z-index:2}
.container{max-width:1360px;padding:0 64px;margin:0 auto;position:relative}
.container.wide{max-width:1480px}

/* side rails */
.side-rail{position:fixed;top:0;bottom:0;width:36px;z-index:3;pointer-events:none;display:flex;align-items:center;justify-content:center}
.side-rail.right{right:0;border-left:1px solid var(--line-faint)}
.side-rail.left{left:0;border-right:1px solid var(--line-faint)}
.side-rail .rail-text{font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap}

/* topbar */
.topbar{border-bottom:1px solid var(--line);padding:10px 0;background:var(--paper);position:relative;z-index:4}
.topbar-inner{display:flex;justify-content:space-between;align-items:center;gap:24px;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.topbar-inner b{color:var(--ink);font-weight:600}
.topbar-inner .coral-t{color:var(--coral)}
.topbar-inner>span{white-space:nowrap}
.topbar-inner .mid{display:inline-flex;gap:26px}
.topbar-inner .right{display:inline-flex;gap:18px;align-items:center}
.topbar-link{color:inherit;text-decoration:none;border-bottom:1px solid transparent;transition:color 160ms ease,border-color 160ms ease}
.topbar-link:hover{color:var(--coral);border-bottom-color:var(--coral)}
.topbar .pulse{width:6px;height:6px;border-radius:50%;background:var(--coral);display:inline-block;margin-right:6px;animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* nav */
.nav{padding:22px 0;position:sticky;top:0;z-index:50;background:var(--paper);transform:translateY(0);transition:transform 360ms cubic-bezier(.22,.61,.36,1),box-shadow 220ms ease;border-bottom:1px solid transparent;will-change:transform}
.nav.is-scrolled{border-bottom-color:var(--line-soft)}
.nav.is-hidden{transform:translateY(-100%);pointer-events:none;box-shadow:none}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:24px}
.brand{display:inline-flex;align-items:center;gap:14px;font-family:var(--sans);font-weight:700;letter-spacing:-.01em;color:var(--ink);text-decoration:none;font-size:18px}
.brand-mark{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--ink);border-radius:50%;font-family:var(--serif);font-style:italic;font-size:17px;color:var(--ink)}
.brand-meta{font-family:var(--sans);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);line-height:1.3;margin-left:4px;border-left:1px solid var(--line);padding-left:14px}
.brand-meta b{display:block;color:var(--ink);font-weight:600}
.nav-links{display:flex;gap:38px;list-style:none}
.nav-links a{color:var(--ink);text-decoration:none;font-family:var(--sans);font-size:14px;font-weight:500;transition:color .18s ease;position:relative}
.nav-links a:hover{color:var(--coral)}
.nav-links a .num{font-size:9px;color:var(--ink-faint);position:absolute;top:-7px;right:-16px;letter-spacing:.04em}
.nav-side{display:inline-flex;align-items:center;gap:18px}
.nav-cta{display:inline-flex;align-items:center;gap:10px;padding:9px 20px;border-radius:999px;background:var(--ink);color:var(--paper);font-family:var(--sans);font-size:13px;font-weight:500;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background .18s ease}
.nav-cta:hover{background:var(--coral)}
.status-dot{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center}
.status-dot::after{content:'';width:6px;height:6px;border-radius:50%;background:var(--coral)}

/* typography primitives */
.label{font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--coral);display:inline-flex;align-items:center;gap:12px}
.label::before{content:'';width:18px;height:1px;background:var(--coral);display:inline-block}
.label .ix{color:var(--ink-faint);font-weight:500;margin-left:4px}
.display{font-family:var(--sans);font-weight:800;letter-spacing:-.028em;color:var(--ink);line-height:1.0}
.display em{font-family:var(--serif);font-style:italic;font-weight:500;letter-spacing:-.018em}
.display .dot{color:var(--coral)}
.lead{font-family:var(--body);font-size:16px;line-height:1.55;color:var(--ink-soft);max-width:36ch}
.meta{font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.coord{font-family:var(--mono);font-size:10px;letter-spacing:.04em;color:var(--ink-faint)}
.roman{font-family:var(--serif);font-style:italic;font-weight:500;color:var(--coral)}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:12px;padding:14px 22px;border-radius:999px;font-family:var(--sans);font-size:14px;font-weight:500;letter-spacing:-.005em;text-decoration:none;border:1px solid transparent;transition:transform .18s ease,background .18s ease,color .18s ease;cursor:pointer;white-space:nowrap}
.btn-primary{background:var(--coral);color:#fff;box-shadow:0 14px 26px -16px rgba(201,106,74,1)}
.btn-primary:hover{transform:translateY(-1px);background:#b55a3c}
.btn-ghost{background:transparent;color:var(--ink);border-color:rgba(21,20,15,.2)}
.btn-ghost:hover{background:rgba(21,20,15,.04)}
.btn .arrow{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center}
.btn .arrow svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.6}

/* image placeholder */
.img-placeholder{background:var(--bone);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative;overflow:hidden}
.img-placeholder::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(21,20,15,.025) 12px,rgba(21,20,15,.025) 13px)}
.img-placeholder .ph-label{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);position:relative;z-index:1;text-align:center;line-height:1.6;white-space:pre-line}
.img-placeholder .ph-coral{display:block;width:28px;height:1px;background:var(--coral);margin:4px auto}
.plate-img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}

/* hero */
.hero{position:relative;padding:0;min-height:calc(100vh - 140px);display:flex;flex-direction:column;align-items:stretch;border-bottom:1px solid var(--line)}
.hero>.container{flex:0 0 auto}
.hero>.container.hero-grid{flex:1 1 auto}
.hero-grid{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);gap:36px;align-items:stretch;width:100%;position:relative}
.hero-copy{padding:4vh 0;display:flex;flex-direction:column;position:relative}
.hero-copy .label{margin-bottom:28px}
.hero-copy .lead{margin-bottom:30px;max-width:38ch;font-size:16px}
.hero h1{font-size:clamp(44px,5vw,78px);line-height:1.0;margin-bottom:28px}
.hero-actions{display:inline-flex;align-items:center;gap:14px;margin-bottom:38px}
.hero-stats{display:flex;align-items:center;gap:22px;flex-wrap:nowrap;margin-bottom:28px}
.hero-stats .stat{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
.hero-stats .stat .ring{width:34px;height:34px;border-radius:50%;border:1px dashed var(--ink);display:inline-flex;align-items:center;justify-content:center;font-family:var(--sans);font-size:11px;font-weight:700;flex-shrink:0}
.hero-stats .stat .ring.solid{border-style:solid}
.hero-stats .stat .ring.coral{border-color:var(--coral);color:var(--coral)}
.hero-stats .stat-label{font-family:var(--sans);font-size:11px;line-height:1.25;color:var(--ink-soft);letter-spacing:.04em;text-transform:uppercase}
.hero-stats .stat-label b{display:block;font-weight:700;color:var(--ink);font-size:12px}
.hero-foot{margin-top:auto;padding-top:22px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:24px}
.hero-foot .meta{line-height:1.4}
.hero-art{position:relative;height:calc(100vh - 160px);max-height:860px;margin-left:auto;margin-right:-12px;width:100%;overflow:visible}
.hero-art img,.hero-art .img-placeholder{width:100%;height:100%;object-fit:contain;object-position:right center}
.annot{position:absolute;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);line-height:1.4;white-space:nowrap}
.annot-tl{top:14px;left:14px}
.annot-tr{top:14px;right:14px;text-align:right}
.annot-bl{bottom:14px;left:14px}
.annot-br{bottom:14px;right:14px;text-align:right}
.hero-art .index{position:absolute;right:12px;top:36%;font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;color:var(--ink-faint);text-transform:uppercase;background:rgba(239,231,210,.75);padding:10px 12px;border:1px solid var(--line-soft);border-radius:6px;backdrop-filter:blur(2px)}
.hero-art .index span{display:block;line-height:1.6}
.hero-art .index span .n{color:var(--coral);margin-right:6px;font-weight:700}
.hero-art .index span.on{color:var(--ink);font-weight:700}
.hero-art .corner{position:absolute;width:22px;height:22px;border-color:var(--ink-faint);border-style:solid;border-width:0}
.hero-art .corner.tl{top:0;left:0;border-top-width:1px;border-left-width:1px}
.hero-art .corner.tr{top:0;right:0;border-top-width:1px;border-right-width:1px}
.hero-art .corner.bl{bottom:0;left:0;border-bottom-width:1px;border-left-width:1px}
.hero-art .corner.br{bottom:0;right:0;border-bottom-width:1px;border-right-width:1px}

/* section rule */
section{position:relative;padding:130px 0}
section.tight{padding:90px 0}
.sec-rule{border-top:1px solid var(--line);padding-top:18px;margin-bottom:48px;display:flex;justify-content:space-between;align-items:center;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.sec-rule .roman{font-family:var(--serif);font-style:italic;color:var(--coral);font-size:14px;letter-spacing:.05em;text-transform:none}
.sec-rule .meta-grp{display:inline-flex;gap:26px}
.sec-rule .dot-mark{color:var(--coral)}
.section-header{margin-bottom:70px}
.section-header .label{margin-bottom:32px}
.section-header h2{font-size:clamp(40px,4.6vw,66px);max-width:22ch}
.section-header .lead{margin-top:22px}

/* wire / ticker */
.wire{border-bottom:1px solid var(--line);padding:26px 0 28px;background:var(--paper);position:relative;overflow:hidden}
.wire-inner{display:grid;grid-template-columns:minmax(180px,220px) minmax(0,1fr);gap:32px;align-items:center}
.wire-left{display:inline-flex;align-items:center;gap:14px;border-right:1px solid var(--line);padding-right:24px;min-height:56px}
.wire-mark{width:22px;height:22px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.wire-pulse{width:6px;height:6px;border-radius:50%;background:var(--coral);display:inline-block;animation:pulse 2.4s ease-in-out infinite}
.wire-title{font-family:var(--sans);font-size:11px;line-height:1.4;display:flex;flex-direction:column;gap:3px}
.wire-title b{color:var(--ink);font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.wire-title span{color:var(--ink-faint);font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.wire-rows{display:grid;gap:8px;min-width:0}
.wire-row{overflow:hidden;mask-image:linear-gradient(90deg,transparent,black 5%,black 95%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,black 5%,black 95%,transparent)}
.marquee-track{display:inline-flex;align-items:center;gap:36px;width:max-content;white-space:nowrap;animation:marquee-x 52s linear infinite;will-change:transform}
.wire-row.reverse .marquee-track{animation-direction:reverse;animation-duration:64s}
.wire-row:hover .marquee-track{animation-play-state:paused}
@keyframes marquee-x{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wire-item{display:inline-flex;align-items:baseline;gap:8px;font-family:var(--sans);font-size:12px;letter-spacing:.04em;color:var(--ink-mute);text-decoration:none;flex-shrink:0}
.wire-item .wire-dot{color:var(--coral);font-size:16px;line-height:0;position:relative;top:-1px;margin-right:2px}
.wire-item .wire-coord{font-family:var(--mono);font-size:10.5px;color:var(--ink-faint);letter-spacing:0}
.wire-item .wire-name{text-transform:uppercase;letter-spacing:.18em;color:var(--ink);font-weight:500}

/* about */
.about-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:80px;align-items:center}
.about h2{font-size:clamp(44px,5.4vw,78px);margin:30px 0 36px}
.about .label{margin-bottom:28px}
.about .lead{margin-bottom:36px;max-width:42ch;font-size:17px}
.about .footer-row{display:flex;align-items:center;gap:20px;margin-top:56px;color:var(--ink-faint);font-family:var(--sans);font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.about .footer-row .mark{width:30px;height:30px;border-radius:50%;border:1px solid var(--ink);display:inline-flex;align-items:center;justify-content:center;font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink)}
.about .stamp{margin-left:auto;display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1.4}
.about .stamp span:first-child{color:var(--coral)}
.about-art{position:relative;aspect-ratio:1/1;max-width:620px;margin-left:auto;overflow:hidden;border-radius:4px}
.about-art .img-placeholder{width:100%;height:100%;border-radius:4px}
.about-caption{position:absolute;right:18px;bottom:4px;font-family:var(--sans);font-size:9.5px;color:var(--ink-faint);text-align:right;letter-spacing:.06em;line-height:1.45}
.about-caption b{color:var(--ink);display:block}

/* capabilities */
.capabilities-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.capabilities-art{position:relative;aspect-ratio:1/1;max-width:600px;overflow:hidden;border-radius:4px}
.capabilities-art .img-placeholder{width:100%;height:100%;border-radius:4px}
.capabilities-art .ribbon{position:absolute;right:-42px;top:50%;font-family:var(--sans);font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg)}
.capabilities-art .ribbon b{color:var(--coral)}
.capabilities-art .corner{position:absolute;width:22px;height:22px;border-color:var(--ink-faint);border-style:solid;border-width:0}
.capabilities-art .corner.tl{top:0;left:0;border-top-width:1px;border-left-width:1px}
.capabilities-art .corner.br{bottom:0;right:0;border-bottom-width:1px;border-right-width:1px}
.capabilities-copy h2{font-size:clamp(40px,4.8vw,64px);margin:22px 0 30px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}
.card{padding:28px 26px 32px;background:var(--bone);border-radius:18px;box-shadow:var(--shadow),inset 0 0 0 1px rgba(21,20,15,.06);position:relative;overflow:hidden;transition:transform .2s ease}
.card:hover{transform:translateY(-3px)}
.card .num{font-family:var(--serif);font-style:italic;font-size:22px;font-weight:500;color:var(--coral);letter-spacing:.04em;margin-bottom:16px;display:flex;justify-content:space-between;align-items:baseline}
.card .num .tag{font-family:var(--sans);font-size:9.5px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase;font-style:normal;font-weight:500}
.card h3{font-family:var(--sans);font-size:22px;font-weight:700;line-height:1.05;letter-spacing:-.014em;margin-bottom:14px}
.card p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;max-width:24ch}
.card .arrow-mark{position:absolute;right:22px;bottom:22px;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--ink);transition:all .18s ease}
.card:hover .arrow-mark{background:var(--coral);border-color:var(--coral);color:#fff}
.card .arrow-mark svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:1.6}

/* labs */
.labs-head{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:end;margin-bottom:48px}
.labs-head h2{font-size:clamp(40px,4.8vw,68px)}
.pills{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
.pill{padding:9px 18px;border-radius:999px;border:1px solid var(--line);font-family:var(--sans);font-size:13px;color:var(--ink-soft);background:transparent;cursor:pointer;transition:all .18s ease;display:inline-flex;align-items:center;gap:8px}
.pill:hover{background:rgba(21,20,15,.04)}
.pill.active{background:var(--coral);border-color:var(--coral);color:#fff}
.labs-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:22px}
.lab{display:flex;flex-direction:column}
.lab-img{aspect-ratio:4/5;background:var(--bone);border-radius:14px;overflow:hidden;margin-bottom:18px;box-shadow:var(--shadow);position:relative}
.lab-img .img-placeholder{width:100%;height:100%}
.lab-img .badge{position:absolute;top:12px;left:12px;background:rgba(239,231,210,.9);color:var(--ink);padding:4px 9px;border-radius:4px;font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.lab .num-row{font-family:var(--sans);font-size:10.5px;color:var(--ink-faint);letter-spacing:.14em;margin-bottom:8px;display:flex;justify-content:space-between;text-transform:uppercase}
.lab h4{font-family:var(--sans);font-size:18px;font-weight:700;letter-spacing:-.014em;margin-bottom:8px}
.lab p{font-family:var(--body);font-size:13px;color:var(--ink-mute);line-height:1.55;margin-bottom:14px}
.lab .arrow-mark{width:28px;height:28px;border:1px solid var(--line);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--ink);margin-top:auto;align-self:flex-start}
.lab .arrow-mark svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:1.6}
.labs-foot{display:flex;align-items:center;justify-content:space-between;margin-top:50px;border-top:1px dashed var(--line);padding-top:22px}
.progress{display:flex;align-items:center;gap:8px}
.progress span{width:26px;height:2px;background:var(--line);border-radius:2px}
.progress span.on{background:var(--coral)}

/* method */
.method-head{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:start;margin-bottom:80px}
.method-head h2{font-size:clamp(44px,5.2vw,76px)}
.method-head .right{display:flex;align-items:flex-start;gap:14px;padding-top:14px}
.method-head .plus{color:var(--coral);font-size:24px;line-height:1;font-family:var(--sans)}
.method-head .right p{font-family:var(--sans);font-size:13px;color:var(--ink-soft);max-width:22ch;line-height:1.55}
.method-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:50px;position:relative}
.method-grid::before{content:'';position:absolute;top:60px;left:50px;right:50px;height:1px;background:var(--line-soft)}
.method-step{position:relative}
.method-step .num{font-family:var(--serif);font-style:italic;font-weight:500;font-size:78px;color:var(--coral);line-height:.85;margin-bottom:24px;letter-spacing:-.02em;background:var(--paper);display:inline-block;padding-right:12px;position:relative;z-index:1}
.method-step h4{font-family:var(--sans);font-size:30px;font-weight:800;letter-spacing:-.022em;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;padding-right:18px}
.method-step h4 .arrow-r{color:var(--ink-faint);font-size:22px;line-height:1}
.method-step:last-child h4 .arrow-r{display:none}
.method-step p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;margin-bottom:24px;max-width:24ch}
.method-step .img{aspect-ratio:1/1;background:var(--bone);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.method-step .img .img-placeholder{width:100%;height:100%}
.method-foot{margin-top:80px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:24px}
.method-foot .left,.method-foot .right{font-family:var(--sans);font-size:11px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase}
.method-foot .left{display:inline-flex;align-items:center;gap:12px}
.method-foot .left .ring{width:20px;height:20px;border:1px dashed var(--ink-faint);border-radius:50%}
.method-foot .right b{color:var(--ink)}

/* work (dark slab) */
.work{background:#15140f;color:var(--paper);border-radius:32px;margin:0 64px;overflow:hidden;position:relative;padding:110px 64px}
.work::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n2'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n2)'/></svg>");background-size:240px 240px;opacity:.6;mix-blend-mode:screen}
.work-rule{position:relative;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(247,241,222,.16);padding-top:16px;margin-bottom:60px;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(247,241,222,.55)}
.work-rule .roman{color:var(--coral);font-family:var(--serif);font-style:italic;font-size:14px;letter-spacing:.04em;text-transform:none}
.work-grid{display:grid;grid-template-columns:1fr 1.05fr .85fr;gap:48px;align-items:center;position:relative}
.work .label{color:var(--coral)}
.work .label::before{background:var(--coral)}
.work-copy h2{font-family:var(--sans);font-weight:800;font-size:clamp(40px,5vw,66px);line-height:1.0;letter-spacing:-.024em;margin:28px 0 36px;color:var(--paper)}
.work-copy h2 em{font-family:var(--serif);font-style:italic;font-weight:500}
.work-copy h2 .dot{color:var(--coral)}
.work-link{display:inline-flex;align-items:center;gap:18px;color:var(--paper);font-family:var(--sans);font-size:14px;text-decoration:none;border-bottom:2px solid var(--coral);padding-bottom:12px;width:fit-content}
.work-link::after{content:'→';color:var(--coral)}
.work-card{background:var(--paper);color:var(--ink);border-radius:18px;padding:32px 30px;position:relative;transform:rotate(-1.2deg);text-decoration:none;display:block;transition:transform 280ms ease,box-shadow 280ms ease}
.work-card:hover{transform:rotate(-1.2deg) translateY(-4px);box-shadow:var(--shadow)}
.work-card.alt{transform:rotate(2.4deg) translateY(20px);padding:28px 26px}
.work-card.alt:hover{transform:rotate(2.4deg) translateY(16px);box-shadow:var(--shadow)}
.work-card .label-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.work-card .small-label{font-family:var(--sans);font-size:10.5px;color:var(--coral);letter-spacing:.18em;text-transform:uppercase;font-weight:600}
.work-card .index{font-family:var(--mono);font-size:11px;color:var(--ink-faint);letter-spacing:.04em}
.work-card h3{font-family:var(--sans);font-size:clamp(26px,2.4vw,38px);font-weight:800;letter-spacing:-.022em;line-height:1.05;margin-bottom:14px}
.work-card p{font-family:var(--body);font-size:14px;color:var(--ink-mute);line-height:1.55;margin-bottom:22px;max-width:28ch}
.work-card .img{aspect-ratio:4/3;background:var(--bone);border-radius:12px;overflow:hidden;margin-bottom:22px}
.work-card .img .img-placeholder{width:100%;height:100%}
.work-card .meta-row{display:flex;justify-content:space-between;color:var(--ink-faint);font-family:var(--sans);font-size:11px;letter-spacing:.16em;text-transform:uppercase;border-top:1px solid var(--line);padding-top:14px}
.work-card .year{color:var(--coral);font-weight:600}

/* testimonial */
.testimonial-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:center}
.testimonial-copy h2{font-family:var(--sans);font-size:clamp(36px,4vw,54px);font-weight:700;letter-spacing:-.022em;line-height:1.12;margin-bottom:36px}
.testimonial-copy h2 em{font-family:var(--serif);font-style:italic;font-weight:500}
.author{display:flex;align-items:center;gap:18px;margin-top:22px}
.author .avatar{width:50px;height:50px;border-radius:50%;background:var(--ink);overflow:hidden;display:inline-flex;align-items:center;justify-content:center;color:var(--paper);font-family:var(--serif);font-style:italic;font-size:24px}
.author p{font-family:var(--sans);font-size:14px;color:var(--ink);font-weight:600}
.author p span{display:block;color:var(--ink-mute);font-weight:400}
.divider{border-top:1px solid var(--line);margin:60px 0 32px}
.partners-text{font-family:var(--body);font-size:14px;color:var(--ink-mute);margin-bottom:26px;max-width:38ch}
.partners{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;align-items:end}
.partner{display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;cursor:pointer;transition:transform 220ms ease}
.partner:hover{transform:translateY(-2px)}
.partner:hover .glyph{color:var(--coral)}
.partner:hover span{color:var(--coral)}
.partner .glyph{height:32px;display:flex;align-items:center;color:var(--ink);transition:color 220ms ease;font-family:var(--serif);font-style:italic;font-size:28px}
.partner span{font-family:var(--sans);font-size:13px;color:var(--ink);letter-spacing:-.005em;font-weight:600;transition:color 220ms ease}
.partner small{font-family:var(--sans);font-size:10px;color:var(--ink-faint);letter-spacing:.1em;text-transform:uppercase}
.testimonial-art{position:relative;aspect-ratio:1/1;max-width:560px;overflow:hidden;border-radius:4px}
.testimonial-art .img-placeholder{width:100%;height:100%;border-radius:4px}

/* cta */
.cta-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:50px;align-items:center}
.cta h2{font-size:clamp(54px,6.6vw,100px);margin:32px 0}
.cta .lead{margin-bottom:36px;max-width:36ch;font-size:16px}
.email-form{display:inline-flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:999px;overflow:hidden;margin-bottom:32px;background:var(--bone)}
.email-form input{flex:1;border:none;background:transparent;padding:14px 22px;font-family:var(--sans);font-size:14px;color:var(--ink);outline:none}
.email-form input::placeholder{color:var(--ink-faint)}
.email-form button{background:var(--ink);color:var(--paper);border:none;border-radius:999px;padding:12px 22px;font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;margin:3px;white-space:nowrap;transition:background .18s ease}
.email-form button:hover{background:var(--coral)}
.cta-foot{display:flex;gap:28px;align-items:center;margin-top:20px;padding-top:22px;border-top:1px solid var(--line);font-family:var(--sans);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.cta-foot .stamp{color:var(--coral);font-weight:600}
.cta-art{position:relative;aspect-ratio:1/1;max-width:620px;margin-left:auto;overflow:hidden;border-radius:4px}
.cta-art .img-placeholder{width:100%;height:100%;border-radius:4px}
.cta-art .ribbon{position:absolute;left:-32px;top:50%;font-family:var(--sans);font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg)}

/* footer */
footer{border-top:1px solid var(--line);padding:60px 0 30px;margin-top:60px}
.foot-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:40px;margin-bottom:60px}
.foot-brand p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;max-width:38ch;margin-top:18px}
.foot-col h5{font-family:var(--sans);font-size:11px;color:var(--ink);letter-spacing:.18em;text-transform:uppercase;margin-bottom:18px;font-weight:700}
.foot-col ul{list-style:none}
.foot-col li{margin-bottom:10px}
.foot-col a{font-family:var(--body);font-size:13.5px;color:var(--ink-soft);text-decoration:none;border-bottom:1px solid transparent;transition:color 160ms ease,border-color 160ms ease}
.foot-col a:hover{color:var(--coral);border-bottom-color:var(--coral)}
.foot-bottom{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;align-items:center;font-family:var(--sans);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-faint)}
.foot-bottom .right{display:inline-flex;gap:24px;align-items:center}
.foot-mega{margin-top:60px;padding-bottom:12px;border-top:1px solid var(--line);overflow-x:hidden;overflow-y:visible}
.foot-mega .word{font-family:var(--sans);font-weight:900;font-size:clamp(70px,13vw,200px);letter-spacing:-.04em;line-height:1.05;color:var(--ink);white-space:nowrap;margin-top:30px;padding-bottom:.18em}
.foot-mega .word em{font-family:var(--serif);font-style:italic;font-weight:500;color:var(--coral)}

/* scroll reveal */
[data-reveal]{opacity:0;translate:0 28px;transition:opacity 900ms cubic-bezier(.22,1,.36,1) var(--reveal-delay,0ms),translate 900ms cubic-bezier(.22,1,.36,1) var(--reveal-delay,0ms),scale 900ms cubic-bezier(.22,1,.36,1) var(--reveal-delay,0ms);will-change:opacity,translate,scale}
[data-reveal='left']{translate:-36px 0}
[data-reveal='right']{translate:36px 0}
[data-reveal='scale']{translate:0 0;scale:.96}
[data-reveal='rise-lg']{translate:0 64px;scale:.985}
[data-reveal][data-revealed='true']{opacity:1;translate:0 0;scale:1}
.cards>.card[data-reveal]:nth-child(1){--reveal-delay:0ms}
.cards>.card[data-reveal]:nth-child(2){--reveal-delay:90ms}
.cards>.card[data-reveal]:nth-child(3){--reveal-delay:180ms}
.cards>.card[data-reveal]:nth-child(4){--reveal-delay:270ms}
.labs-grid>.lab[data-reveal]:nth-child(1){--reveal-delay:0ms}
.labs-grid>.lab[data-reveal]:nth-child(2){--reveal-delay:90ms}
.labs-grid>.lab[data-reveal]:nth-child(3){--reveal-delay:180ms}
.labs-grid>.lab[data-reveal]:nth-child(4){--reveal-delay:270ms}
.labs-grid>.lab[data-reveal]:nth-child(5){--reveal-delay:360ms}
.method-grid>.method-step[data-reveal]:nth-child(1){--reveal-delay:0ms}
.method-grid>.method-step[data-reveal]:nth-child(2){--reveal-delay:110ms}
.method-grid>.method-step[data-reveal]:nth-child(3){--reveal-delay:220ms}
.method-grid>.method-step[data-reveal]:nth-child(4){--reveal-delay:330ms}
.hero-copy>[data-reveal]:nth-of-type(1){--reveal-delay:0ms}
.hero-copy>[data-reveal]:nth-of-type(2){--reveal-delay:80ms}
.hero-copy>[data-reveal]:nth-of-type(3){--reveal-delay:160ms}
.hero-copy>[data-reveal]:nth-of-type(4){--reveal-delay:240ms}
.hero-copy>[data-reveal]:nth-of-type(5){--reveal-delay:320ms}
.hero-copy>[data-reveal]:nth-of-type(6){--reveal-delay:400ms}
@media(prefers-reduced-motion:reduce){[data-reveal]{opacity:1!important;translate:0 0!important;scale:1!important;transition:none!important}.nav{transition:none!important}.marquee-track{animation:none}}

/* responsive */
@media(max-width:1280px){.container{padding:0 44px}.work{margin:0 44px;padding:90px 44px}.side-rail{display:none}}
@media(max-width:1200px){.topbar-inner .mid{display:none}}
@media(max-width:1180px){.nav-inner{gap:18px}.brand-meta{display:none}.nav-links{gap:28px}}
@media(max-width:1080px){.container{padding:0 32px}.hero h1{font-size:clamp(36px,4.6vw,54px)}.labs-grid{gap:14px}.foot-grid{grid-template-columns:2fr 1fr 1fr}.foot-grid .foot-col:nth-child(4),.foot-grid .foot-col:nth-child(5){display:none}}
@media(max-width:880px){.container{padding:0 24px}.hero-grid,.about-grid,.capabilities-grid,.testimonial-grid,.cta-grid{grid-template-columns:1fr;gap:50px}.labs-head,.method-head{grid-template-columns:1fr}.labs-grid{grid-template-columns:repeat(2,1fr)}.method-grid{grid-template-columns:repeat(2,1fr);gap:36px}.method-grid::before{display:none}.work{margin:0 12px;padding:60px 24px}.work-grid{grid-template-columns:1fr}.nav-links,.brand-meta,.nav-cta{display:none}.wire-inner{grid-template-columns:1fr;gap:14px}.wire-left{border-right:none;border-bottom:1px solid var(--line);padding-right:0;padding-bottom:12px;min-height:0}}
@media(max-width:560px){.container{padding:0 16px}.hero h1{font-size:38px}.labs-grid{grid-template-columns:1fr}.cards{grid-template-columns:1fr}.pills{justify-content:flex-start}section{padding:80px 0}.topbar-inner{font-size:9px}}
`

function Plate({ label, className = '', src }: { label: string; className?: string; src?: string }) {
  if (src) {
    return <img src={src} alt={label} className={`plate-img ${className}`} />
  }
  return (
    <div className={`img-placeholder ${className}`}>
      <span className="ph-coral" />
      <span className="ph-label">{label}</span>
    </div>
  )
}

const ArrowSvg = () => (
  <svg viewBox="0 0 24 24"><path d="M5 19L19 5M19 5H8M19 5v11" /></svg>
)

export default function SpaceLanding() {
  useEffect(() => {
    /* ── Scroll-reveal ── */
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.revealed = 'true'
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => observer.observe(el))

    /* ── Headroom nav ── */
    const nav = document.querySelector<HTMLElement>('.nav')
    if (!nav) return () => observer.disconnect()
    let lastY = window.scrollY
    let ticking = false
    const DEADBAND = 6
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY
        if (Math.abs(delta) > DEADBAND) {
          nav.classList.toggle('is-hidden', delta > 0 && y > 120)
          nav.classList.toggle('is-scrolled', y > 40)
          lastY = y
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <style>{STYLES}</style>

      {/* Side rails */}
      <div className="side-rail right">
        <span className="rail-text">Patrimo · Gestion patrimoniale augmentée · Paris · 2026</span>
      </div>
      <div className="side-rail left">
        <span className="rail-text">Intelligence · Structuration · Pilotage · Confidentiel</span>
      </div>

      <div className="patrimo-shell">

        {/* ── TOPBAR ── */}
        <div className="topbar">
          <div className="container topbar-inner">
            <span><b>PTM / 2026</b> &nbsp;·&nbsp; Vol. 01 / N° 01</span>
            <span className="mid">
              <span>Rubrique <b className="coral-t">Patrimoine · Intelligence</b></span>
              <span>Confidentiel · Made in France</span>
            </span>
            <span className="right">
              <a className="topbar-link" href="mailto:contact@patrimo.fr">
                <span className="pulse" />contact@patrimo.fr
              </a>
              <span><b>FR</b> · EN</span>
            </span>
          </div>
        </div>

        {/* ── NAV ── */}
        <header className="nav">
          <div className="container nav-inner">
            <a href="#top" className="brand">
              <span className="brand-mark">P</span>
              <span>Patrimo</span>
              <span className="brand-meta"><b>Studio Patrimonial N° 01</b>Paris · Monaco · Confidentiel</span>
            </a>
            <nav>
              <ul className="nav-links">
                <li><a href="#plateforme">Plateforme<span className="num">04</span></a></li>
                <li><a href="#intelligence">Intelligence<span className="num">05</span></a></li>
                <li><a href="#methode">Méthode<span className="num">04</span></a></li>
                <li><a href="#travaux">Travaux<span className="num">02</span></a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <div className="nav-side">
              <a className="nav-cta" href="/login">Créer mon espace</a>
              <span className="status-dot" aria-hidden="true" />
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════════
            SECTION I — HERO
        ════════════════════════════════════════ */}
        <section className="hero" id="top">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">I.</span>
              <span className="meta-grp">
                <span>Couverture / Planche Principale</span>
                <span className="dot-mark">·</span>
                <span>Patrimo / Volume 01</span>
              </span>
              <span>001 / 008</span>
            </div>
          </div>
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="label" data-reveal>
                Cockpit patrimonial intelligent <span className="ix">· N° 01</span>
              </span>
              <h1 className="display" data-reveal>
                La gestion patrimoniale, <em>réinventée</em><span className="dot">.</span>
              </h1>
              <p className="lead" data-reveal>
                Patrimo centralise, structure et optimise votre patrimoine avec la précision
                d'un conseiller d'élite et la puissance d'une technologie de pointe.
                Un environnement de décision haut de gamme, conçu pour les situations complexes.
              </p>
              <div className="hero-actions" data-reveal>
                <a className="btn btn-primary" href="/login">
                  Créer mon espace gratuit
                  <span className="arrow"><ArrowSvg /></span>
                </a>
                <a className="btn btn-ghost" href="#plateforme">
                  Découvrir la plateforme
                </a>
              </div>
              <div className="hero-stats" data-reveal>
                <div className="stat">
                  <span className="ring solid">18</span>
                  <span className="stat-label"><b>simulateurs</b>Fiscalité française</span>
                </div>
                <div className="stat">
                  <span className="ring">8</span>
                  <span className="stat-label"><b>enveloppes</b>PEA · AV · PER · SCPI…</span>
                </div>
                <div className="stat">
                  <span className="ring coral">0</span>
                  <span className="stat-label"><b>donnée bancaire</b>Zéro accès requis</span>
                </div>
              </div>
              <div className="hero-foot" data-reveal>
                <span className="meta">Gratuit · Pour l'investisseur français</span>
                <span className="coord">48.8566° N · 2.3522° E · Paris</span>
              </div>
            </div>

            <div className="hero-art" data-reveal="scale">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />
              <span className="annot annot-tl coord">FIG. 01 / PTM-01</span>
              <span className="annot annot-tr">Planche N° 01</span>
              <span className="annot annot-bl coord">Confidentiel · 2026</span>
              <span className="annot annot-br">
                Composé par&nbsp;<span style={{ color: 'var(--coral)' }}>Patrimo</span>
              </span>
              <Plate label="HERO" src="/hero-decor.webp" />
              <div className="index">
                <span><span className="n">01</span>Diagnostic</span>
                <span className="on"><span className="n">02</span>Architecture</span>
                <span><span className="n">03</span>Déploiement</span>
                <span><span className="n">04</span>Pilotage</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── WIRE / TICKER ── */}
        <div className="wire">
          <div className="container wire-inner">
            <div className="wire-left">
              <span className="wire-mark"><span className="wire-pulse" /></span>
              <span className="wire-title">
                <b>8 enveloppes</b>
                <span>Patrimo · France · Gratuit</span>
              </span>
            </div>
            <div className="wire-rows">
              <div className="wire-row">
                <div className="marquee-track" aria-hidden="true">
                  {[
                    ['PEA', 'Exonéré après 5 ans'], ['AV', 'Abattement 152 500 €'], ['PER', 'Déduction IR'],
                    ['CTO', 'Flat Tax 30 %'], ['LIVRET', 'Défiscalisé garanti'], ['SCPI', 'Rendement 5,2 %'],
                    ['CRYPTO', '3916-bis déclaré'], ['CASH', 'Précaution & opportunité'],
                    ['PEA', 'Exonéré après 5 ans'], ['AV', 'Abattement 152 500 €'], ['PER', 'Déduction IR'],
                    ['CTO', 'Flat Tax 30 %'], ['LIVRET', 'Défiscalisé garanti'], ['SCPI', 'Rendement 5,2 %'],
                    ['CRYPTO', '3916-bis déclaré'], ['CASH', 'Précaution & opportunité'],
                  ].map(([code, label], i) => (
                    <span key={i} className="wire-item">
                      <span className="wire-dot">·</span>
                      <span className="wire-coord">{code}</span>
                      <span className="wire-name">{label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="wire-row reverse">
                <div className="marquee-track" aria-hidden="true">
                  {[
                    'Flat Tax vs Barème · 18 simulateurs',
                    'PEA vs CTO vs Assurance-Vie',
                    'IFI · Transmission · Succession',
                    'Retraite · PER · LMNP · SCPI',
                    'Score Patrimonial · 7 dimensions',
                    'Zéro donnée bancaire · RGPD · AES-256',
                    'Flat Tax vs Barème · 18 simulateurs',
                    'PEA vs CTO vs Assurance-Vie',
                    'IFI · Transmission · Succession',
                    'Retraite · PER · LMNP · SCPI',
                  ].map((item, i) => (
                    <span key={i} className="wire-item">
                      <span className="wire-dot">·</span>
                      <span className="wire-name" style={{ fontSize: 11 }}>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════
            SECTION II — MANIFESTE
        ════════════════════════════════════════ */}
        <section className="about" id="about">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">II.</span>
              <span className="meta-grp">
                <span>Manifeste / À propos</span>
                <span className="dot-mark">·</span>
                <span>Patrimo / Identité</span>
              </span>
              <span>002 / 008</span>
            </div>
            <div className="about-grid">
              <div data-reveal>
                <span className="label">Notre manifeste <span className="ix">· II</span></span>
                <h2 className="display">
                  La clarté <em>décisionnelle,</em>{' '}
                  au cœur de chaque <em>patrimoine</em><span className="dot">.</span>
                </h2>
                <p className="lead">
                  Patrimo n'est pas un outil de plus. C'est une couche d'intelligence financière
                  qui transforme la complexité patrimoniale en décisions claires, structurées et
                  documentées. Gratuit par conviction, sécurisé par construction.
                </p>
                <p className="lead" style={{ marginTop: 18 }}>
                  18 simulateurs fiscaux. 8 enveloppes d'investissement. Zéro donnée bancaire.
                  Conçu pour l'investisseur français qui veut comprendre avant d'agir.
                </p>
                <div className="footer-row">
                  <span className="mark">P</span>
                  <span>Fondé en 2024</span>
                  <div className="stamp">
                    <span>Open-source · RGPD</span>
                    <span>Hébergé en UE · AES-256</span>
                  </div>
                </div>
              </div>
              <div className="about-art" data-reveal="right">
                <Plate label="ABOUT" src="/dashboard-desktop.png" />
                <div className="about-caption">
                  <b>Planche II</b>
                  Dashboard patrimonial · 2026
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION III — PLATEFORME
        ════════════════════════════════════════ */}
        <section id="plateforme">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">III.</span>
              <span className="meta-grp">
                <span>Capacités / Plateforme</span>
                <span className="dot-mark">·</span>
                <span>4 modules</span>
              </span>
              <span>003 / 008</span>
            </div>
            <div className="capabilities-grid">
              <div className="capabilities-art" data-reveal="left">
                <Plate label="PLATEFORME" src="/patrimoine-overview.png" />
                <span className="ribbon">Plateforme Patrimo <b>·</b> 2026</span>
                <span className="corner tl" />
                <span className="corner br" />
              </div>
              <div className="capabilities-copy">
                <span className="label" data-reveal>Intelligence patrimoniale <span className="ix">· III</span></span>
                <h2 className="display" data-reveal>
                  Quatre modules, <em>une vision</em> unifiée<span className="dot">.</span>
                </h2>
                <div className="cards">
                  {[
                    { num: '01', tag: 'Suivre',   title: 'Vision patrimoniale complète', body: "Cartographie exhaustive en temps réel de vos actifs, passifs et flux. 8 enveloppes, patrimoine net, performance." },
                    { num: '02', tag: 'Optimiser', title: 'Chaque frais compte',           body: "Chaque ETF comparé aux meilleures alternatives. Sur 20 ans, 0,18 % de moins représente des milliers d'euros récupérés." },
                    { num: '03', tag: 'Simuler',  title: '18 simulateurs fiscaux',         body: "Flat tax vs barème, PEA vs CTO, IFI, transmission, retraite. Toutes les projections françaises dans un seul endroit." },
                    { num: '04', tag: 'Éduquer',  title: "Comprendre avant d'agir",        body: "Guides pratiques, glossaire interactif, fiches enveloppe. L'éducation financière française pensée pour durer." },
                  ].map((card, i) => (
                    <div key={i} className="card" data-reveal>
                      <div className="num">
                        {card.num}
                        <span className="tag">{card.tag}</span>
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.body}</p>
                      <div className="arrow-mark">
                        <ArrowSvg />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION IV — ENVELOPPES
        ════════════════════════════════════════ */}
        <section id="intelligence" style={{ background: 'var(--paper-warm)' }}>
          <div className="container">
            <div className="sec-rule">
              <span className="roman">IV.</span>
              <span className="meta-grp">
                <span>Enveloppes / 8 classes d'actifs</span>
                <span className="dot-mark">·</span>
                <span>8 fiches</span>
              </span>
              <span>004 / 008</span>
            </div>
            <div className="labs-head">
              <div data-reveal>
                <span className="label">8 enveloppes analysées <span className="ix">· IV</span></span>
                <h2 className="display">
                  Chaque enveloppe, <em>maîtrisée</em><span className="dot">.</span>
                </h2>
              </div>
              <div>
                <div className="pills">
                  <button className="pill active">Toutes <span>08</span></button>
                  <button className="pill">Actions</button>
                  <button className="pill">Épargne</button>
                  <button className="pill">Immobilier</button>
                </div>
              </div>
            </div>
            <div className="labs-grid">
              {[
                { num: '01', badge: 'Défiscalisé',    title: "Livrets d'épargne",  body: "Livret A · LDDS · LEP. Épargne réglementée disponible à tout moment. La fondation de tout patrimoine.", img: '/livrets.png' },
                { num: '02', badge: 'Exonéré 5a+',   title: 'PEA',               body: "Plan Épargne Actions. L'enveloppe reine de l'investissement en actions européennes.", img: '/PEA.png' },
                { num: '03', badge: 'Abattement 8a', title: 'Assurance-Vie',     body: "Fonds € · UC. Succession optimisée, fiscalité adoucie après 8 ans.", img: '/AV.png' },
                { num: '04', badge: 'Flat Tax 30 %', title: 'CTO',               body: "Toutes classes d'actifs, aucun plafond. Liberté absolue, fiscalité maîtrisée.", img: '/CTO.png' },
                { num: '05', badge: 'Déduction IR',  title: 'PER',               body: "Plan Épargne Retraite. Déduisez aujourd'hui, capitalisez demain.", img: '/PER.png' },
                { num: '06', badge: 'Levier bancaire', title: 'Immobilier',      body: "SCPI · Direct · LMNP. Revenus locatifs récurrents, transmission optimisée.", img: '/immobilliers.png' },
                { num: '07', badge: '3916-bis',      title: 'Crypto-actifs',     body: "BTC · ETH · Altcoins. Flat tax 30 % sur les cessions, déclaration annuelle.", img: '/crypto.png' },
                { num: '08', badge: 'Précaution',    title: 'Trésorerie',        body: "3 à 6 mois de dépenses. Réserve d'opportunité pour saisir les creux de marché.", img: '/liquidites.png' },
              ].map((lab, i) => (
                <div key={i} className="lab" data-reveal>
                  <div className="lab-img">
                    <Plate label={`ENV-${lab.num}`} src={lab.img} />
                    <span className="badge">{lab.badge}</span>
                  </div>
                  <div className="num-row">
                    <span>PTM-{lab.num}</span>
                    <span>2026</span>
                  </div>
                  <h4>{lab.title}</h4>
                  <p>{lab.body}</p>
                  <div className="arrow-mark">
                    <ArrowSvg />
                  </div>
                </div>
              ))}
            </div>
            <div className="labs-foot">
              <span className="meta">8 enveloppes · Fiches complètes disponibles</span>
              <div className="progress">
                <span className="on" /><span className="on" /><span className="on" />
                <span className="on" /><span className="on" /><span /><span /><span />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION V — MÉTHODE / SIMULATEURS
        ════════════════════════════════════════ */}
        <section id="methode">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">V.</span>
              <span className="meta-grp">
                <span>Méthode / Simulateurs</span>
                <span className="dot-mark">·</span>
                <span>4 étapes</span>
              </span>
              <span>005 / 008</span>
            </div>
            <div className="method-head">
              <div data-reveal>
                <span className="label">Notre approche <span className="ix">· V</span></span>
                <h2 className="display">
                  Quatre étapes. <em>Un résultat</em> mesurable<span className="dot">.</span>
                </h2>
              </div>
              <div className="right" data-reveal>
                <span className="plus">+</span>
                <p>Chaque simulation commence par une saisie simple. Les résultats sont instantanés, visuels et exportables.</p>
              </div>
            </div>
            <div className="method-grid">
              {[
                { num: 'i',   title: 'Inventaire',   body: 'Saisissez vos actifs par enveloppe. PEA, AV, immobilier, crypto, livrets — chacun dans sa case.', img: '/patrimoine-actifs.png' },
                { num: 'ii',  title: 'Analyse',      body: 'Patrimoine net calculé, allocation visuelle, TER comparés. Une image nette de votre situation réelle.', img: '/patrimoine-overview.png' },
                { num: 'iii', title: 'Simulation',   body: 'Flat tax vs barème, PEA vs CTO, impact des frais, projection retraite. 18 outils à disposition.', img: '/dashboard-mobile.png' },
                { num: 'iv',  title: 'Décision',     body: 'Score patrimonial sur 7 dimensions. Recommandations actionnables. Vous décidez, en connaissance de cause.', img: '/dashboard-desktop.png' },
              ].map((step, i) => (
                <div key={i} className="method-step" data-reveal>
                  <div className="num">{step.num}</div>
                  <h4>
                    {step.title}
                    {i < 3 && <span className="arrow-r">→</span>}
                  </h4>
                  <p>{step.body}</p>
                  <div className="img">
                    <Plate label={`METHOD-${i + 1}`} src={step.img} />
                  </div>
                </div>
              ))}
            </div>
            <div className="method-foot">
              <div className="left">
                <span className="ring" />
                <span>Patrimo · Méthode propriétaire · 2024</span>
              </div>
              <div className="right">Résultat immédiat · <b>Zéro compte requis</b></div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION VI — SCORE (dark slab)
        ════════════════════════════════════════ */}
        <section id="travaux" style={{ padding: '130px 0' }}>
          <div className="work">
            <div className="work-rule">
              <span className="roman">VI.</span>
              <span className="meta-grp">
                <span>Score Patrimonial · 7 dimensions</span>
                <span className="dot-mark">·</span>
                <span>Analyse complète</span>
              </span>
              <span>006 / 008</span>
            </div>
            <div className="work-grid">
              <div className="work-copy" data-reveal>
                <span className="label">Score <span className="ix">· VI</span></span>
                <h2>
                  Une note pour <em>comprendre</em>{' '}
                  où vous en <em>êtes</em><span className="dot">.</span>
                </h2>
                <a className="work-link" href="/login">Calculer mon score</a>
              </div>
              <a className="work-card" href="/login" data-reveal>
                <div className="label-row">
                  <span className="small-label">Diversification</span>
                  <span className="index">DIM-01</span>
                </div>
                <div className="img">
                  <Plate label="SCORE-1" src="/patrimoine-actifs.png" />
                </div>
                <h3>Allocation & diversification</h3>
                <p>Répartition entre enveloppes, classes d'actifs, géographies. Score de 0 à 100 sur 7 dimensions clés.</p>
                <div className="meta-row">
                  <span>7 dimensions · Note globale</span>
                  <span className="year">2026</span>
                </div>
              </a>
              <a className="work-card alt" href="/login" data-reveal>
                <div className="label-row">
                  <span className="small-label">Optimisation fiscale</span>
                  <span className="index">DIM-02</span>
                </div>
                <div className="img">
                  <Plate label="SCORE-2" src="/patrimoine-overview.png" />
                </div>
                <h3>Fiscalité & enveloppes</h3>
                <p>Utilisation optimale des enveloppes, taux d'imposition effectif, levier fiscal disponible.</p>
                <div className="meta-row">
                  <span>Flat Tax · TMI · PFU</span>
                  <span className="year">2026</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION VII — SÉCURITÉ & CONFIANCE
        ════════════════════════════════════════ */}
        <section id="avis">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">VII.</span>
              <span className="meta-grp">
                <span>Sécurité / Confiance</span>
                <span className="dot-mark">·</span>
                <span>Zéro compromis</span>
              </span>
              <span>007 / 008</span>
            </div>
            <div className="testimonial-grid">
              <div data-reveal>
                <span className="label">Sécurité <span className="ix">· VII</span></span>
                <h2 className="display" style={{ marginTop: 28 }}>
                  « Patrimo ne demande aucune donnée bancaire.
                  Vous saisissez ce que vous voulez,{' '}
                  <em>quand vous voulez.</em> »
                </h2>
                <div className="author">
                  <div className="avatar">P</div>
                  <p>
                    Architecture de confiance
                    <span>Chiffrement AES-256 · RGPD · Hébergé en UE · Open-source</span>
                  </p>
                </div>
                <div className="divider" />
                <p className="partners-text">
                  Patrimo est conçu pour les investisseurs qui refusent de partager leurs accès bancaires.
                  Vous contrôlez vos données à 100 %.
                </p>
                <div className="partners">
                  {[
                    { glyph: '🔒', name: 'AES-256',      type: 'Chiffrement' },
                    { glyph: '🇪🇺', name: 'RGPD',        type: 'Conformité' },
                    { glyph: '⚡', name: 'Temps réel',   type: 'Performance' },
                    { glyph: '{}', name: 'Open-source',  type: 'Transparence' },
                    { glyph: '0',  name: 'Donnée bancaire', type: 'Zéro accès' },
                  ].map((p, i) => (
                    <div key={i} className="partner" data-reveal>
                      <div className="glyph">{p.glyph}</div>
                      <span>{p.name}</span>
                      <small>{p.type}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="testimonial-art" data-reveal="right">
                <Plate label="SECURITE" src="/dashboard-mobile.png" />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            SECTION VIII — CTA
        ════════════════════════════════════════ */}
        <section className="cta" id="contact">
          <div className="container">
            <div className="sec-rule">
              <span className="roman">VIII.</span>
              <span className="meta-grp">
                <span>Entrée / CTA</span>
                <span className="dot-mark">·</span>
                <span>Accès immédiat · Gratuit</span>
              </span>
              <span>008 / 008</span>
            </div>
            <div className="cta-grid">
              <div data-reveal>
                <span className="label">Commencer <span className="ix">· VIII</span></span>
                <h2 className="display">
                  Reprenez le <em>contrôle</em>{' '}
                  de votre patrimoine<span className="dot">.</span>
                </h2>
                <p className="lead">
                  Créez votre espace gratuitement. Aucune donnée bancaire requise.
                  Résultats immédiats, sans engagement.
                </p>
                <div style={{ marginTop: 36, marginBottom: 32 }}>
                  <a className="btn btn-primary" href="/login" style={{ fontSize: 15, padding: '16px 28px' }}>
                    Créer mon espace gratuit
                    <span className="arrow"><ArrowSvg /></span>
                  </a>
                </div>
                <div className="cta-foot">
                  <span className="stamp">100 % gratuit</span>
                  <span>Zéro donnée bancaire</span>
                  <span>Accès immédiat</span>
                </div>
              </div>
              <div className="cta-art" data-reveal="right">
                <Plate label="CTA" src="/patrimoine-actifs.png" />
                <span className="ribbon">Patrimo · Votre patrimoine, piloté</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer>
          <div className="container">
            <div className="foot-grid">
              <div className="foot-brand">
                <a href="#top" className="brand">
                  <span className="brand-mark">P</span>
                  <span>Patrimo</span>
                </a>
                <p>
                  Patrimo est une plateforme patrimoniale gratuite combinant 18 simulateurs fiscaux,
                  8 enveloppes d'investissement et un score patrimonial sur 7 dimensions.
                  Conçue pour l'investisseur français qui veut comprendre avant d'agir.
                </p>
              </div>
              <div className="foot-col">
                <h5>Plateforme</h5>
                <ul>
                  <li><a href="#plateforme">Vision patrimoniale</a></li>
                  <li><a href="#plateforme">Optimisation TER</a></li>
                  <li><a href="#methode">18 simulateurs</a></li>
                  <li><a href="#travaux">Score patrimonial</a></li>
                </ul>
              </div>
              <div className="foot-col">
                <h5>Enveloppes</h5>
                <ul>
                  <li><a href="#intelligence">PEA · AV · PER</a></li>
                  <li><a href="#intelligence">CTO · Livrets</a></li>
                  <li><a href="#intelligence">SCPI · Immobilier</a></li>
                  <li><a href="#intelligence">Crypto · Cash</a></li>
                </ul>
              </div>
              <div className="foot-col">
                <h5>Ressources</h5>
                <ul>
                  <li><a href="#methode">Notre approche</a></li>
                  <li><a href="#about">À propos</a></li>
                  <li><a href="/login">Créer un compte</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
              <div className="foot-col">
                <h5>Légal</h5>
                <ul>
                  <li><a href="#">Mentions légales</a></li>
                  <li><a href="#">Confidentialité</a></li>
                  <li><a href="#">CGU</a></li>
                  <li><a href="#">RGPD</a></li>
                </ul>
              </div>
            </div>
            <div className="foot-bottom">
              <span>© 2026 Patrimo · Tous droits réservés · Made in France</span>
              <div className="right">
                <span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block', marginRight: 6, verticalAlign: 'middle', animation: 'pulse 2.4s ease-in-out infinite' }} />
                  Opérationnel
                </span>
                <span>Open-source · RGPD</span>
                <span>Paris · France</span>
              </div>
            </div>
          </div>
          <div className="foot-mega">
            <div className="container">
              <div className="word">
                Patri<em>mo</em>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
