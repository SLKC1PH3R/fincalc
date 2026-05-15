'use client'

import React, { useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────────
   Patrimo — landing page
   Design system : Atelier Zero (Monocle / Apartamento editorial)
   Palette       : warm paper #EFE7D2 · ink #15140F · coral #C96A4A
   Typo          : Inter Tight · Playfair Display · JetBrains Mono
───────────────────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,600;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --paper:      #efe7d2;
  --paper-warm: #ece4cf;
  --ink:        #15140f;
  --ink-soft:   #2a2620;
  --ink-mute:   #5a5448;
  --ink-faint:  #8b8676;
  --coral:      #c96a4a;
  --bone:       #f7f1de;
  --line:       rgba(21,20,15,.16);
  --line-soft:  rgba(21,20,15,.08);
  --line-faint: rgba(21,20,15,.05);
  --shadow:     0 30px 60px -30px rgba(21,20,15,.18);
  --serif:      'Playfair Display','Times New Roman',serif;
  --sans:       'Inter Tight','Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  --body:       'Inter',-apple-system,system-ui,sans-serif;
  --mono:       'JetBrains Mono','SF Mono',Menlo,monospace;
}

.az-root *{box-sizing:border-box;margin:0;padding:0}
.az-root{background:var(--paper);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden;position:relative}
.az-root::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:1;background-image:radial-gradient(circle at 12% 18%,rgba(106,92,56,.07) 0,transparent 28%),radial-gradient(circle at 88% 72%,rgba(106,92,56,.06) 0,transparent 32%),url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.18  0 0 0 0 0.16  0 0 0 0 0.12  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");background-size:auto,auto,240px 240px;mix-blend-mode:multiply;opacity:.92}

.az-shell{position:relative;z-index:2}
.az-c{max-width:1360px;padding:0 64px;margin:0 auto;position:relative}

/* side rails */
.az-rail{position:fixed;top:0;bottom:0;width:36px;z-index:3;pointer-events:none;display:flex;align-items:center;justify-content:center}
.az-rail.right{right:0;border-left:1px solid var(--line-faint)}
.az-rail.left{left:0;border-right:1px solid var(--line-faint)}
.az-rail .rt{font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap}

/* topbar */
.az-top{border-bottom:1px solid var(--line);padding:10px 0;background:var(--paper);position:relative;z-index:4}
.az-top-i{display:flex;justify-content:space-between;align-items:center;gap:24px;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.az-top-i b{color:var(--ink);font-weight:600}
.az-top-i .ct{color:var(--coral)}
.az-top-i>span{white-space:nowrap}
.az-top-i .mid{display:inline-flex;gap:26px}
.az-top-i .rgt{display:inline-flex;gap:18px;align-items:center}
.az-top-link{color:inherit;text-decoration:none;border-bottom:1px solid transparent;transition:color 160ms,border-color 160ms}
.az-top-link:hover{color:var(--coral);border-bottom-color:var(--coral)}
.az-pulse{width:6px;height:6px;border-radius:50%;background:var(--coral);display:inline-block;margin-right:6px;animation:az-pulse 2.4s ease-in-out infinite}
@keyframes az-pulse{0%,100%{opacity:1}50%{opacity:.35}}

/* nav */
.az-nav{padding:22px 0;position:sticky;top:0;z-index:50;background:var(--paper);transform:translateY(0);transition:transform 360ms cubic-bezier(.22,.61,.36,1),box-shadow 220ms ease;border-bottom:1px solid transparent;will-change:transform}
.az-nav.scrolled{border-bottom-color:var(--line-soft)}
.az-nav.hidden{transform:translateY(-100%);pointer-events:none}
.az-nav-i{display:flex;align-items:center;justify-content:space-between;gap:24px}
.az-brand{display:inline-flex;align-items:center;gap:14px;font-family:var(--sans);font-weight:700;letter-spacing:-.01em;color:var(--ink);text-decoration:none;font-size:18px}
.az-bmark{width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid var(--ink);border-radius:50%;font-family:var(--serif);font-style:italic;font-size:17px;color:var(--ink)}
.az-bmeta{font-family:var(--sans);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);line-height:1.3;margin-left:4px;border-left:1px solid var(--line);padding-left:14px}
.az-bmeta b{display:block;color:var(--ink);font-weight:600}
.az-links{display:flex;gap:38px;list-style:none}
.az-links a{color:var(--ink);text-decoration:none;font-family:var(--sans);font-size:14px;font-weight:500;transition:color .18s;position:relative}
.az-links a:hover{color:var(--coral)}
.az-links a .n{font-size:9px;color:var(--ink-faint);position:absolute;top:-7px;right:-16px;letter-spacing:.04em}
.az-nav-side{display:inline-flex;align-items:center;gap:18px}
.az-cta{display:inline-flex;align-items:center;gap:10px;padding:9px 20px;border-radius:999px;background:var(--ink);color:var(--paper);font-family:var(--sans);font-size:13px;font-weight:500;text-decoration:none;white-space:nowrap;flex-shrink:0;transition:background .18s}
.az-cta:hover{background:var(--coral)}
.az-sdot{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center}
.az-sdot::after{content:'';width:6px;height:6px;border-radius:50%;background:var(--coral)}

/* typo */
.az-label{font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--coral);display:inline-flex;align-items:center;gap:12px}
.az-label::before{content:'';width:18px;height:1px;background:var(--coral);display:inline-block}
.az-label .ix{color:var(--ink-faint);font-weight:500;margin-left:4px}
.az-display{font-family:var(--sans);font-weight:800;letter-spacing:-.028em;color:var(--ink);line-height:1.0}
.az-display em{font-family:var(--serif);font-style:italic;font-weight:500;letter-spacing:-.018em}
.az-display .dot{color:var(--coral)}
.az-lead{font-family:var(--body);font-size:16px;line-height:1.55;color:var(--ink-soft);max-width:36ch}
.az-meta{font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.az-coord{font-family:var(--mono);font-size:10px;letter-spacing:.04em;color:var(--ink-faint)}
.az-roman{font-family:var(--serif);font-style:italic;font-weight:500;color:var(--coral)}

/* btn */
.az-btn{display:inline-flex;align-items:center;gap:12px;padding:14px 22px;border-radius:999px;font-family:var(--sans);font-size:14px;font-weight:500;text-decoration:none;border:1px solid transparent;transition:transform .18s,background .18s,color .18s;cursor:pointer;white-space:nowrap}
.az-btn-primary{background:var(--coral);color:#fff;box-shadow:0 14px 26px -16px rgba(201,106,74,1)}
.az-btn-primary:hover{transform:translateY(-1px);background:#b55a3c}
.az-btn-ghost{background:transparent;color:var(--ink);border-color:rgba(21,20,15,.2)}
.az-btn-ghost:hover{background:rgba(21,20,15,.04)}
.az-arr svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.6}

/* plate */
.az-plate{background:var(--bone);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;position:relative;overflow:hidden}
.az-plate::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(21,20,15,.025) 12px,rgba(21,20,15,.025) 13px)}
.az-plate .phl{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint);position:relative;z-index:1;text-align:center;line-height:1.6}
.az-plate .phc{display:block;width:28px;height:1px;background:var(--coral);margin:4px auto}
.az-pimg{width:100%;height:100%;object-fit:cover;object-position:center;display:block}

/* section rule */
.az-sec{position:relative;padding:130px 0}
.az-sec.tight{padding:90px 0}
.az-rule{border-top:1px solid var(--line);padding-top:18px;margin-bottom:48px;display:flex;justify-content:space-between;align-items:center;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.az-rule .az-roman{font-size:14px;letter-spacing:.05em;text-transform:none}
.az-rule .mg{display:inline-flex;gap:26px}
.az-rule .dm{color:var(--coral)}

/* hero */
.az-hero{position:relative;padding:0;min-height:calc(100vh - 140px);display:flex;flex-direction:column;align-items:stretch;border-bottom:1px solid var(--line)}
.az-hero>.az-c{flex:0 0 auto}
.az-hero>.az-c.hg{flex:1 1 auto}
.az-hg{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.22fr);gap:36px;align-items:stretch;width:100%;position:relative}
.az-hcopy{padding:4vh 0;display:flex;flex-direction:column;position:relative}
.az-hcopy .az-label{margin-bottom:28px}
.az-hcopy .az-lead{margin-bottom:30px;max-width:38ch}
.az-hero h1{font-size:clamp(44px,5vw,78px);line-height:1.0;margin-bottom:28px}
.az-hact{display:inline-flex;align-items:center;gap:14px;margin-bottom:38px}
.az-hstats{display:flex;align-items:center;gap:22px;flex-wrap:nowrap;margin-bottom:28px}
.az-stat{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
.az-ring{width:34px;height:34px;border-radius:50%;border:1px dashed var(--ink);display:inline-flex;align-items:center;justify-content:center;font-family:var(--sans);font-size:11px;font-weight:700;flex-shrink:0}
.az-ring.solid{border-style:solid}
.az-ring.coral{border-color:var(--coral);color:var(--coral)}
.az-statlabel{font-family:var(--sans);font-size:11px;line-height:1.25;color:var(--ink-soft);letter-spacing:.04em;text-transform:uppercase}
.az-statlabel b{display:block;font-weight:700;color:var(--ink);font-size:12px}
.az-hfoot{margin-top:auto;padding-top:22px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:24px}
.az-hart{position:relative;height:calc(100vh - 160px);max-height:860px;margin-left:auto;margin-right:-12px;width:100%;overflow:visible}
.az-hart img,.az-hart .az-plate{width:100%;height:100%;object-fit:contain;object-position:right center}
.az-annot{position:absolute;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);line-height:1.4;white-space:nowrap}
.az-annot.tl{top:14px;left:14px}
.az-annot.tr{top:14px;right:14px;text-align:right}
.az-annot.bl{bottom:14px;left:14px}
.az-annot.br{bottom:14px;right:14px;text-align:right}
.az-hart .idx{position:absolute;right:12px;top:36%;font-family:var(--sans);font-size:10.5px;font-weight:600;letter-spacing:.16em;color:var(--ink-faint);text-transform:uppercase;background:rgba(239,231,210,.75);padding:10px 12px;border:1px solid var(--line-soft);border-radius:6px;backdrop-filter:blur(2px)}
.az-hart .idx span{display:block;line-height:1.6}
.az-hart .idx span .n{color:var(--coral);margin-right:6px;font-weight:700}
.az-hart .idx span.on{color:var(--ink);font-weight:700}
.az-corner{position:absolute;width:22px;height:22px;border-color:var(--ink-faint);border-style:solid;border-width:0}
.az-corner.tl{top:0;left:0;border-top-width:1px;border-left-width:1px}
.az-corner.tr{top:0;right:0;border-top-width:1px;border-right-width:1px}
.az-corner.bl{bottom:0;left:0;border-bottom-width:1px;border-left-width:1px}
.az-corner.br{bottom:0;right:0;border-bottom-width:1px;border-right-width:1px}

/* wire */
.az-wire{border-bottom:1px solid var(--line);padding:26px 0 28px;background:var(--paper);position:relative;overflow:hidden}
.az-wire-i{display:grid;grid-template-columns:minmax(180px,220px) minmax(0,1fr);gap:32px;align-items:center}
.az-wleft{display:inline-flex;align-items:center;gap:14px;border-right:1px solid var(--line);padding-right:24px;min-height:56px}
.az-wmark{width:22px;height:22px;border-radius:50%;border:1px solid var(--line);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
.az-wpulse{width:6px;height:6px;border-radius:50%;background:var(--coral);display:inline-block;animation:az-pulse 2.4s ease-in-out infinite}
.az-wtitle{font-family:var(--sans);font-size:11px;line-height:1.4;display:flex;flex-direction:column;gap:3px}
.az-wtitle b{color:var(--ink);font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.az-wtitle span{color:var(--ink-faint);font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.az-wrows{display:grid;gap:8px;min-width:0}
.az-wrow{overflow:hidden;mask-image:linear-gradient(90deg,transparent,black 5%,black 95%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,black 5%,black 95%,transparent)}
.az-mtrack{display:inline-flex;align-items:center;gap:36px;width:max-content;white-space:nowrap;animation:az-marquee 52s linear infinite;will-change:transform}
.az-wrow.rev .az-mtrack{animation-direction:reverse;animation-duration:64s}
.az-wrow:hover .az-mtrack{animation-play-state:paused}
@keyframes az-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.az-witem{display:inline-flex;align-items:baseline;gap:8px;font-family:var(--sans);font-size:12px;letter-spacing:.04em;color:var(--ink-mute);flex-shrink:0}
.az-wdot{color:var(--coral);font-size:16px;line-height:0;position:relative;top:-1px;margin-right:2px}
.az-wcoord{font-family:var(--mono);font-size:10.5px;color:var(--ink-faint);letter-spacing:0}
.az-wname{text-transform:uppercase;letter-spacing:.18em;color:var(--ink);font-weight:500}

/* about */
.az-agrid{display:grid;grid-template-columns:1.05fr 1fr;gap:80px;align-items:center}
.az-about h2{font-size:clamp(44px,5.4vw,78px);margin:30px 0 36px}
.az-about .az-label{margin-bottom:28px}
.az-about .az-lead{margin-bottom:36px;max-width:42ch;font-size:17px}
.az-afrow{display:flex;align-items:center;gap:20px;margin-top:56px;color:var(--ink-faint);font-family:var(--sans);font-size:11px;letter-spacing:.18em;text-transform:uppercase}
.az-afrow .mark{width:30px;height:30px;border-radius:50%;border:1px solid var(--ink);display:inline-flex;align-items:center;justify-content:center;font-family:var(--serif);font-style:italic;font-size:14px;color:var(--ink)}
.az-stamp{margin-left:auto;display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1.4}
.az-stamp span:first-child{color:var(--coral)}
.az-aart{position:relative;aspect-ratio:1/1;max-width:620px;margin-left:auto;overflow:hidden;border-radius:4px}
.az-aart .az-plate{width:100%;height:100%;border-radius:4px}
.az-acapt{position:absolute;right:18px;bottom:4px;font-family:var(--sans);font-size:9.5px;color:var(--ink-faint);text-align:right;letter-spacing:.06em;line-height:1.45}
.az-acapt b{color:var(--ink);display:block}

/* capabilities */
.az-cgrid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.az-cart{position:relative;aspect-ratio:1/1;max-width:600px;overflow:hidden;border-radius:4px}
.az-cart .az-plate{width:100%;height:100%;border-radius:4px}
.az-cart .ribbon{position:absolute;right:-42px;top:50%;font-family:var(--sans);font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg)}
.az-cart .ribbon b{color:var(--coral)}
.az-ccopy h2{font-size:clamp(40px,4.8vw,64px);margin:22px 0 30px}
.az-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}
.az-card{padding:28px 26px 32px;background:var(--bone);border-radius:18px;box-shadow:var(--shadow),inset 0 0 0 1px rgba(21,20,15,.06);position:relative;overflow:hidden;transition:transform .2s}
.az-card:hover{transform:translateY(-3px)}
.az-card .cnum{font-family:var(--serif);font-style:italic;font-size:22px;font-weight:500;color:var(--coral);letter-spacing:.04em;margin-bottom:16px;display:flex;justify-content:space-between;align-items:baseline}
.az-card .cnum .ctag{font-family:var(--sans);font-size:9.5px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase;font-style:normal;font-weight:500}
.az-card h3{font-family:var(--sans);font-size:22px;font-weight:700;line-height:1.05;letter-spacing:-.014em;margin-bottom:14px}
.az-card p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;max-width:24ch}
.az-arr-c{position:absolute;right:22px;bottom:22px;width:28px;height:28px;border:1px solid var(--line);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--ink);transition:all .18s}
.az-card:hover .az-arr-c{background:var(--coral);border-color:var(--coral);color:#fff}
.az-arr-c svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:1.6}

/* labs / enveloppes */
.az-lhead{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:end;margin-bottom:48px}
.az-lhead h2{font-size:clamp(40px,4.8vw,68px)}
.az-pills{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}
.az-pill{padding:9px 18px;border-radius:999px;border:1px solid var(--line);font-family:var(--sans);font-size:13px;color:var(--ink-soft);background:transparent;cursor:pointer;transition:all .18s;display:inline-flex;align-items:center;gap:8px}
.az-pill:hover{background:rgba(21,20,15,.04)}
.az-pill.active{background:var(--coral);border-color:var(--coral);color:#fff}
.az-lgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.az-lab{display:flex;flex-direction:column}
.az-limg{aspect-ratio:4/5;background:var(--bone);border-radius:14px;overflow:hidden;margin-bottom:18px;box-shadow:var(--shadow);position:relative}
.az-limg .az-plate{width:100%;height:100%}
.az-limg .az-badge{position:absolute;top:12px;left:12px;background:rgba(239,231,210,.9);color:var(--ink);padding:4px 9px;border-radius:4px;font-family:var(--sans);font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.az-lab .nrow{font-family:var(--sans);font-size:10.5px;color:var(--ink-faint);letter-spacing:.14em;margin-bottom:8px;display:flex;justify-content:space-between;text-transform:uppercase}
.az-lab h4{font-family:var(--sans);font-size:18px;font-weight:700;letter-spacing:-.014em;margin-bottom:8px}
.az-lab p{font-family:var(--body);font-size:13px;color:var(--ink-mute);line-height:1.55;margin-bottom:14px}
.az-lab .az-arr-s{width:28px;height:28px;border:1px solid var(--line);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--ink);margin-top:auto;align-self:flex-start}
.az-lab .az-arr-s svg{width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:1.6}
.az-lfoot{display:flex;align-items:center;justify-content:space-between;margin-top:50px;border-top:1px dashed var(--line);padding-top:22px}
.az-prog{display:flex;align-items:center;gap:8px}
.az-prog span{width:26px;height:2px;background:var(--line);border-radius:2px}
.az-prog span.on{background:var(--coral)}

/* method */
.az-mhead{display:grid;grid-template-columns:1.4fr 1fr;gap:60px;align-items:start;margin-bottom:80px}
.az-mhead h2{font-size:clamp(44px,5.2vw,76px)}
.az-mhead .mright{display:flex;align-items:flex-start;gap:14px;padding-top:14px}
.az-mhead .plus{color:var(--coral);font-size:24px;line-height:1;font-family:var(--sans)}
.az-mhead .mright p{font-family:var(--sans);font-size:13px;color:var(--ink-soft);max-width:22ch;line-height:1.55}
.az-mgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:50px;position:relative}
.az-mgrid::before{content:'';position:absolute;top:60px;left:50px;right:50px;height:1px;background:var(--line-soft)}
.az-mstep{position:relative}
.az-mstep .snum{font-family:var(--serif);font-style:italic;font-weight:500;font-size:78px;color:var(--coral);line-height:.85;margin-bottom:24px;letter-spacing:-.02em;background:var(--paper);display:inline-block;padding-right:12px;position:relative;z-index:1}
.az-mstep h4{font-family:var(--sans);font-size:30px;font-weight:800;letter-spacing:-.022em;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;padding-right:18px}
.az-mstep h4 .arr-r{color:var(--ink-faint);font-size:22px;line-height:1}
.az-mstep:last-child h4 .arr-r{display:none}
.az-mstep p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;margin-bottom:24px;max-width:24ch}
.az-mstep .mimg{aspect-ratio:1/1;background:var(--bone);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)}
.az-mstep .mimg .az-plate{width:100%;height:100%}
.az-mfoot{margin-top:80px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:24px;font-family:var(--sans);font-size:11px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase}
.az-mfoot .mfl{display:inline-flex;align-items:center;gap:12px}
.az-mfoot .mfl .mring{width:20px;height:20px;border:1px dashed var(--ink-faint);border-radius:50%}
.az-mfoot .mfr b{color:var(--ink)}

/* dark slab */
.az-dark{background:#15140f;color:var(--paper);border-radius:32px;margin:0 64px;overflow:hidden;position:relative;padding:110px 64px}
.az-dark::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n2'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n2)'/></svg>");background-size:240px 240px;opacity:.6;mix-blend-mode:screen}
.az-drule{position:relative;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(247,241,222,.16);padding-top:16px;margin-bottom:60px;font-family:var(--sans);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(247,241,222,.55)}
.az-drule .az-roman{color:var(--coral);font-family:var(--serif);font-style:italic;font-size:14px;letter-spacing:.04em;text-transform:none}
.az-dgrid{display:grid;grid-template-columns:1fr 1.05fr .85fr;gap:48px;align-items:center;position:relative}
.az-dark .az-label{color:var(--coral)}
.az-dark .az-label::before{background:var(--coral)}
.az-dcopy h2{font-family:var(--sans);font-weight:800;font-size:clamp(40px,5vw,66px);line-height:1.0;letter-spacing:-.024em;margin:28px 0 36px;color:var(--paper)}
.az-dcopy h2 em{font-family:var(--serif);font-style:italic;font-weight:500}
.az-dcopy h2 .dot{color:var(--coral)}
.az-dlink{display:inline-flex;align-items:center;gap:18px;color:var(--paper);font-family:var(--sans);font-size:14px;text-decoration:none;border-bottom:2px solid var(--coral);padding-bottom:12px;width:fit-content}
.az-dlink::after{content:'→';color:var(--coral)}
.az-wcard{background:var(--paper);color:var(--ink);border-radius:18px;padding:32px 30px;position:relative;text-decoration:none;display:block;transition:transform 280ms,box-shadow 280ms}
.az-wcard.rot1{transform:rotate(-1.2deg)}
.az-wcard.rot1:hover{transform:rotate(-1.2deg) translateY(-4px);box-shadow:var(--shadow)}
.az-wcard.rot2{transform:rotate(2.4deg) translateY(20px);padding:28px 26px}
.az-wcard.rot2:hover{transform:rotate(2.4deg) translateY(16px);box-shadow:var(--shadow)}
.az-wcard .wlrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
.az-wcard .wsl{font-family:var(--sans);font-size:10.5px;color:var(--coral);letter-spacing:.18em;text-transform:uppercase;font-weight:600}
.az-wcard .widx{font-family:var(--mono);font-size:11px;color:var(--ink-faint);letter-spacing:.04em}
.az-wcard h3{font-family:var(--sans);font-size:clamp(26px,2.4vw,38px);font-weight:800;letter-spacing:-.022em;line-height:1.05;margin-bottom:14px}
.az-wcard p{font-family:var(--body);font-size:14px;color:var(--ink-mute);line-height:1.55;margin-bottom:22px;max-width:28ch}
.az-wcard .wimg{aspect-ratio:4/3;background:var(--bone);border-radius:12px;overflow:hidden;margin-bottom:22px}
.az-wcard .wimg .az-plate{width:100%;height:100%}
.az-wcard .wmrow{display:flex;justify-content:space-between;color:var(--ink-faint);font-family:var(--sans);font-size:11px;letter-spacing:.16em;text-transform:uppercase;border-top:1px solid var(--line);padding-top:14px}
.az-wcard .wyr{color:var(--coral);font-weight:600}

/* testimonial / securite */
.az-tgrid{display:grid;grid-template-columns:1.2fr 1fr;gap:80px;align-items:center}
.az-tcopy h2{font-family:var(--sans);font-size:clamp(36px,4vw,54px);font-weight:700;letter-spacing:-.022em;line-height:1.12;margin-bottom:36px}
.az-tcopy h2 em{font-family:var(--serif);font-style:italic;font-weight:500}
.az-author{display:flex;align-items:center;gap:18px;margin-top:22px}
.az-avatar{width:50px;height:50px;border-radius:50%;background:var(--ink);display:inline-flex;align-items:center;justify-content:center;color:var(--paper);font-family:var(--serif);font-style:italic;font-size:24px}
.az-author p{font-family:var(--sans);font-size:14px;color:var(--ink);font-weight:600}
.az-author p span{display:block;color:var(--ink-mute);font-weight:400}
.az-divider{border-top:1px solid var(--line);margin:60px 0 32px}
.az-ptxt{font-family:var(--body);font-size:14px;color:var(--ink-mute);margin-bottom:26px;max-width:38ch}
.az-partners{display:grid;grid-template-columns:repeat(5,1fr);gap:22px;align-items:end}
.az-partner{display:flex;flex-direction:column;gap:10px;cursor:pointer;transition:transform 220ms}
.az-partner:hover{transform:translateY(-2px)}
.az-partner:hover .az-pglyph{color:var(--coral)}
.az-partner:hover .az-pname{color:var(--coral)}
.az-pglyph{height:32px;display:flex;align-items:center;color:var(--ink);transition:color 220ms;font-family:var(--sans);font-size:13px;font-weight:700}
.az-pname{font-family:var(--sans);font-size:13px;color:var(--ink);letter-spacing:-.005em;font-weight:600;transition:color 220ms}
.az-ptype{font-family:var(--sans);font-size:10px;color:var(--ink-faint);letter-spacing:.1em;text-transform:uppercase}
.az-tart{position:relative;aspect-ratio:1/1;max-width:560px;overflow:hidden;border-radius:4px}
.az-tart .az-plate{width:100%;height:100%;border-radius:4px}

/* cta */
.az-ctag{display:grid;grid-template-columns:1.05fr 1fr;gap:50px;align-items:center}
.az-ctas h2{font-size:clamp(54px,6.6vw,100px);margin:32px 0}
.az-ctas .az-lead{margin-bottom:36px}
.az-eform{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;overflow:hidden;margin-bottom:32px;background:var(--bone)}
.az-eform input{flex:1;border:none;background:transparent;padding:14px 22px;font-family:var(--sans);font-size:14px;color:var(--ink);outline:none}
.az-eform input::placeholder{color:var(--ink-faint)}
.az-eform button{background:var(--ink);color:var(--paper);border:none;border-radius:999px;padding:12px 22px;font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;margin:3px;white-space:nowrap;transition:background .18s}
.az-eform button:hover{background:var(--coral)}
.az-cfoot{display:flex;gap:28px;align-items:center;padding-top:22px;border-top:1px solid var(--line);font-family:var(--sans);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint)}
.az-cfoot .cs{color:var(--coral);font-weight:600}
.az-caart{position:relative;aspect-ratio:1/1;max-width:620px;margin-left:auto;overflow:hidden;border-radius:4px}
.az-caart .az-plate{width:100%;height:100%;border-radius:4px}
.az-caart .ribbon{position:absolute;left:-32px;top:50%;font-family:var(--sans);font-size:10.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--ink-faint);writing-mode:vertical-rl;transform:rotate(180deg)}

/* footer */
.az-ft{border-top:1px solid var(--line);padding:60px 0 30px;margin-top:60px}
.az-fgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:40px;margin-bottom:60px}
.az-fbrand p{font-family:var(--body);font-size:13.5px;color:var(--ink-mute);line-height:1.55;max-width:38ch;margin-top:18px}
.az-fcol h5{font-family:var(--sans);font-size:11px;color:var(--ink);letter-spacing:.18em;text-transform:uppercase;margin-bottom:18px;font-weight:700}
.az-fcol ul{list-style:none}
.az-fcol li{margin-bottom:10px}
.az-fcol a{font-family:var(--body);font-size:13.5px;color:var(--ink-soft);text-decoration:none;border-bottom:1px solid transparent;transition:color 160ms,border-color 160ms}
.az-fcol a:hover{color:var(--coral);border-bottom-color:var(--coral)}
.az-fbot{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;align-items:center;font-family:var(--sans);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-faint)}
.az-fbot .fr{display:inline-flex;gap:24px;align-items:center}
.az-fmega{margin-top:60px;padding-bottom:12px;border-top:1px solid var(--line);overflow-x:hidden}
.az-fmega .word{font-family:var(--sans);font-weight:900;font-size:clamp(70px,13vw,200px);letter-spacing:-.04em;line-height:1.05;color:var(--ink);white-space:nowrap;margin-top:30px;padding-bottom:.18em}
.az-fmega .word em{font-family:var(--serif);font-style:italic;font-weight:500;color:var(--coral)}

/* reveal */
[data-az]{opacity:0;translate:0 28px;transition:opacity 900ms cubic-bezier(.22,1,.36,1) var(--rd,0ms),translate 900ms cubic-bezier(.22,1,.36,1) var(--rd,0ms),scale 900ms cubic-bezier(.22,1,.36,1) var(--rd,0ms);will-change:opacity,translate,scale}
[data-az='left']{translate:-36px 0}
[data-az='right']{translate:36px 0}
[data-az='scale']{translate:0 0;scale:.96}
[data-az][data-azd='true']{opacity:1;translate:0 0;scale:1}
.az-cards>.az-card[data-az]:nth-child(1){--rd:0ms}
.az-cards>.az-card[data-az]:nth-child(2){--rd:90ms}
.az-cards>.az-card[data-az]:nth-child(3){--rd:180ms}
.az-cards>.az-card[data-az]:nth-child(4){--rd:270ms}
.az-lgrid>.az-lab[data-az]:nth-child(1){--rd:0ms}
.az-lgrid>.az-lab[data-az]:nth-child(2){--rd:80ms}
.az-lgrid>.az-lab[data-az]:nth-child(3){--rd:160ms}
.az-lgrid>.az-lab[data-az]:nth-child(4){--rd:240ms}
.az-mgrid>.az-mstep[data-az]:nth-child(1){--rd:0ms}
.az-mgrid>.az-mstep[data-az]:nth-child(2){--rd:110ms}
.az-mgrid>.az-mstep[data-az]:nth-child(3){--rd:220ms}
.az-mgrid>.az-mstep[data-az]:nth-child(4){--rd:330ms}
.az-hcopy>[data-az]:nth-of-type(1){--rd:0ms}
.az-hcopy>[data-az]:nth-of-type(2){--rd:80ms}
.az-hcopy>[data-az]:nth-of-type(3){--rd:160ms}
.az-hcopy>[data-az]:nth-of-type(4){--rd:240ms}
.az-hcopy>[data-az]:nth-of-type(5){--rd:320ms}
.az-hcopy>[data-az]:nth-of-type(6){--rd:400ms}
@media(prefers-reduced-motion:reduce){[data-az]{opacity:1!important;translate:0 0!important;scale:1!important;transition:none!important}.az-nav{transition:none!important}.az-mtrack{animation:none}}

/* responsive */
@media(max-width:1280px){.az-c{padding:0 44px}.az-dark{margin:0 44px;padding:90px 44px}.az-rail{display:none}}
@media(max-width:1200px){.az-top-i .mid{display:none}}
@media(max-width:1180px){.az-nav-i{gap:18px}.az-bmeta{display:none}.az-links{gap:28px}}
@media(max-width:1080px){.az-c{padding:0 32px}.az-hero h1{font-size:clamp(36px,4.6vw,54px)}.az-lgrid{grid-template-columns:repeat(2,1fr)}.az-fgrid{grid-template-columns:2fr 1fr 1fr}.az-fgrid .az-fcol:nth-child(4),.az-fgrid .az-fcol:nth-child(5){display:none}}
@media(max-width:880px){.az-c{padding:0 24px}.az-hg,.az-agrid,.az-cgrid,.az-tgrid,.az-ctag{grid-template-columns:1fr;gap:50px}.az-lhead,.az-mhead{grid-template-columns:1fr}.az-mgrid{grid-template-columns:repeat(2,1fr);gap:36px}.az-mgrid::before{display:none}.az-dark{margin:0 12px;padding:60px 24px}.az-dgrid{grid-template-columns:1fr}.az-links,.az-bmeta,.az-cta{display:none}.az-wire-i{grid-template-columns:1fr;gap:14px}.az-wleft{border-right:none;border-bottom:1px solid var(--line);padding-right:0;padding-bottom:12px;min-height:0}}
@media(max-width:560px){.az-c{padding:0 16px}.az-hero h1{font-size:38px}.az-lgrid{grid-template-columns:1fr}.az-cards{grid-template-columns:1fr}.az-pills{justify-content:flex-start}.az-sec{padding:80px 0}.az-top-i{font-size:9px}}
`

function Plate({ label, src }: { label: string; src?: string }) {
  if (src) return <img src={src} alt={label} className="az-pimg" />
  return (
    <div className="az-plate">
      <span className="phc" />
      <span className="phl">{label}</span>
    </div>
  )
}

const Arr = () => (
  <svg viewBox="0 0 24 24"><path d="M5 19L19 5M19 5H8M19 5v11" /></svg>
)

export function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-az]')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.azd = 'true'
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))

    const nav = document.querySelector<HTMLElement>('.az-nav')
    if (!nav) return () => io.disconnect()
    let lastY = window.scrollY, ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY, delta = y - lastY
        if (Math.abs(delta) > 6) {
          nav.classList.toggle('hidden', delta > 0 && y > 120)
          nav.classList.toggle('scrolled', y > 40)
          lastY = y
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div className="az-root">
      <style>{STYLES}</style>

      {/* Side rails */}
      <div className="az-rail right"><span className="rt">Patrimo · Gestion patrimoniale augmentée · Paris · 2026</span></div>
      <div className="az-rail left"><span className="rt">Intelligence · Structuration · Pilotage · Confidentiel</span></div>

      <div className="az-shell">

        {/* TOPBAR */}
        <div className="az-top">
          <div className="az-c az-top-i">
            <span><b>PTM / 2026</b> &nbsp;·&nbsp; Vol. 01 / N° 01</span>
            <span className="mid">
              <span>Rubrique <b className="ct">Patrimoine · Intelligence</b></span>
              <span>Gratuit · Made in France</span>
            </span>
            <span className="rgt">
              <a className="az-top-link" href="mailto:contact@patrimo.fr">
                <span className="az-pulse" />contact@patrimo.fr
              </a>
              <span><b>FR</b> · EN</span>
            </span>
          </div>
        </div>

        {/* NAV */}
        <header className="az-nav">
          <div className="az-c az-nav-i">
            <a href="#top" className="az-brand">
              <span className="az-bmark">P</span>
              <span>Patrimo</span>
              <span className="az-bmeta"><b>Finance · N° 01</b>Paris · Open-source · RGPD</span>
            </a>
            <nav>
              <ul className="az-links">
                <li><a href="#plateforme">Plateforme<span className="n">04</span></a></li>
                <li><a href="#enveloppes">Enveloppes<span className="n">08</span></a></li>
                <li><a href="#methode">Méthode<span className="n">04</span></a></li>
                <li><a href="#score">Score<span className="n">07</span></a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </nav>
            <div className="az-nav-side">
              <a className="az-cta" href="/login">Créer mon espace</a>
              <span className="az-sdot" aria-hidden="true" />
            </div>
          </div>
        </header>

        {/* ── I · HERO ── */}
        <section className="az-hero" id="top">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">I.</span>
              <span className="mg">
                <span>Couverture / Planche Principale</span>
                <span className="dm">·</span>
                <span>Patrimo / Volume 01</span>
              </span>
              <span>001 / 008</span>
            </div>
          </div>
          <div className="az-c hg az-hg">
            <div className="az-hcopy">
              <span className="az-label" data-az>Cockpit patrimonial intelligent <span className="ix">· N° 01</span></span>
              <h1 className="az-display" data-az>
                La gestion patrimoniale, <em>réinventée</em><span className="dot">.</span>
              </h1>
              <p className="az-lead" data-az>
                18 simulateurs fiscaux · 8 enveloppes · 0 donnée bancaire.
                Gratuit, pour l'investisseur français qui veut comprendre avant d'agir.
              </p>
              <div className="az-hact" data-az>
                <a className="az-btn az-btn-primary" href="/login">
                  Créer mon espace gratuit
                  <span className="az-arr"><Arr /></span>
                </a>
                <a className="az-btn az-btn-ghost" href="#plateforme">
                  Découvrir la plateforme
                </a>
              </div>
              <div className="az-hstats" data-az>
                <div className="az-stat">
                  <span className="az-ring solid">18</span>
                  <span className="az-statlabel"><b>simulateurs</b>Fiscalité française</span>
                </div>
                <div className="az-stat">
                  <span className="az-ring">8</span>
                  <span className="az-statlabel"><b>enveloppes</b>PEA · AV · PER…</span>
                </div>
                <div className="az-stat">
                  <span className="az-ring coral">0</span>
                  <span className="az-statlabel"><b>donnée bancaire</b>Zéro accès requis</span>
                </div>
              </div>
              <div className="az-hfoot" data-az>
                <span className="az-meta">Gratuit · Pour l'investisseur français</span>
                <span className="az-coord">48.8566° N · 2.3522° E · Paris</span>
              </div>
            </div>
            <div className="az-hart" data-az="scale">
              <span className="az-corner tl" /><span className="az-corner tr" />
              <span className="az-corner bl" /><span className="az-corner br" />
              <span className="az-annot tl az-coord">FIG. 01 / PTM-01</span>
              <span className="az-annot tr">Planche N° 01</span>
              <span className="az-annot bl az-coord">Gratuit · 2026</span>
              <span className="az-annot br">Composé par&nbsp;<span style={{ color: 'var(--coral)' }}>Patrimo</span></span>
              <Plate label="HERO" src="/hero-decor.webp" />
              <div className="idx">
                <span><span className="n">01</span>Inventaire</span>
                <span className="on"><span className="n">02</span>Analyse</span>
                <span><span className="n">03</span>Simulation</span>
                <span><span className="n">04</span>Décision</span>
              </div>
            </div>
          </div>
        </section>

        {/* WIRE */}
        <div className="az-wire">
          <div className="az-c az-wire-i">
            <div className="az-wleft">
              <span className="az-wmark"><span className="az-wpulse" /></span>
              <span className="az-wtitle">
                <b>8 enveloppes</b>
                <span>Patrimo · France · Gratuit</span>
              </span>
            </div>
            <div className="az-wrows">
              {[
                [['PEA','Exonéré après 5 ans'],['AV','Abattement 152 500 €'],['PER','Déduction IR'],['CTO','Flat Tax 30 %'],['LIVRET','Défiscalisé garanti'],['SCPI','Rendement 5,2 %'],['CRYPTO','3916-bis déclaré'],['CASH','Précaution & opportunité'],['PEA','Exonéré après 5 ans'],['AV','Abattement 152 500 €'],['PER','Déduction IR'],['CTO','Flat Tax 30 %'],['LIVRET','Défiscalisé garanti'],['SCPI','Rendement 5,2 %'],['CRYPTO','3916-bis déclaré'],['CASH','Précaution & opportunité']],
                [['FT','Flat Tax vs Barème · 18 simulateurs'],['PE','PEA vs CTO vs Assurance-Vie'],['IF','IFI · Transmission · Succession'],['RE','Retraite · PER · LMNP · SCPI'],['SC','Score Patrimonial · 7 dimensions'],['SZ','Zéro donnée bancaire · RGPD · AES-256'],['FT','Flat Tax vs Barème · 18 simulateurs'],['PE','PEA vs CTO vs Assurance-Vie'],['IF','IFI · Transmission · Succession'],['RE','Retraite · PER · LMNP · SCPI'],['SC','Score Patrimonial · 7 dimensions'],['SZ','Zéro donnée bancaire · RGPD · AES-256']],
              ].map((row, ri) => (
                <div key={ri} className={`az-wrow${ri === 1 ? ' rev' : ''}`}>
                  <div className="az-mtrack" aria-hidden="true">
                    {row.map(([coord, name], i) => (
                      <span key={i} className="az-witem">
                        <span className="az-wdot">·</span>
                        <span className="az-wcoord">{coord}</span>
                        <span className="az-wname">{name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── II · MANIFESTE ── */}
        <section className="az-sec az-about" id="about">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">II.</span>
              <span className="mg"><span>Manifeste / À propos</span><span className="dm">·</span><span>Identité</span></span>
              <span>002 / 008</span>
            </div>
            <div className="az-agrid">
              <div data-az>
                <span className="az-label">Notre manifeste <span className="ix">· II</span></span>
                <h2 className="az-display">
                  La clarté <em>décisionnelle,</em>{' '}
                  au cœur de chaque <em>patrimoine</em><span className="dot">.</span>
                </h2>
                <p className="az-lead">
                  Patrimo n'est pas un outil de plus. C'est une couche d'intelligence financière
                  qui transforme la complexité patrimoniale en décisions claires, structurées et
                  documentées. Gratuit par conviction, sécurisé par construction.
                </p>
                <p className="az-lead" style={{ marginTop: 18 }}>
                  18 simulateurs fiscaux. 8 enveloppes. Zéro donnée bancaire.
                  Conçu pour l'investisseur français qui veut comprendre avant d'agir.
                </p>
                <div className="az-afrow">
                  <span className="mark">P</span>
                  <span>Fondé en 2024</span>
                  <div className="az-stamp">
                    <span>Open-source · RGPD</span>
                    <span>Hébergé en UE · AES-256</span>
                  </div>
                </div>
              </div>
              <div className="az-aart" data-az="right">
                <Plate label="ABOUT" src="/dashboard-desktop.png" />
                <div className="az-acapt"><b>Planche II</b>Dashboard patrimonial · 2026</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── III · PLATEFORME ── */}
        <section className="az-sec" id="plateforme">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">III.</span>
              <span className="mg"><span>Capacités / Plateforme</span><span className="dm">·</span><span>4 modules</span></span>
              <span>003 / 008</span>
            </div>
            <div className="az-cgrid">
              <div className="az-cart" data-az="left">
                <Plate label="PLATEFORME" src="/patrimoine-overview.png" />
                <span className="ribbon">Plateforme Patrimo <b>·</b> 2026</span>
                <span className="az-corner tl" /><span className="az-corner br" />
              </div>
              <div className="az-ccopy">
                <span className="az-label" data-az>Intelligence patrimoniale <span className="ix">· III</span></span>
                <h2 className="az-display" data-az>
                  Quatre modules, <em>une vision</em> unifiée<span className="dot">.</span>
                </h2>
                <div className="az-cards">
                  {[
                    { n:'01', tag:'Suivre',    title:'Vision patrimoniale complète', body:"Cartographie en temps réel de vos actifs. 8 enveloppes, patrimoine net, performance." },
                    { n:'02', tag:'Optimiser', title:'Chaque frais compte',           body:"ETFs comparés aux meilleures alternatives. Sur 20 ans, 0,18 % de moins = des milliers d'euros récupérés." },
                    { n:'03', tag:'Simuler',   title:'18 simulateurs fiscaux',        body:"Flat tax vs barème, PEA vs CTO, IFI, transmission, retraite. Tout en un seul endroit." },
                    { n:'04', tag:'Éduquer',   title:"Comprendre avant d'agir",       body:"Guides pratiques, glossaire interactif, fiches enveloppe. L'éducation financière française." },
                  ].map((c, i) => (
                    <div key={i} className="az-card" data-az>
                      <div className="cnum">{c.n}<span className="ctag">{c.tag}</span></div>
                      <h3>{c.title}</h3>
                      <p>{c.body}</p>
                      <div className="az-arr-c"><Arr /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── IV · ENVELOPPES ── */}
        <section className="az-sec" id="enveloppes" style={{ background: 'var(--paper-warm)' }}>
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">IV.</span>
              <span className="mg"><span>Enveloppes / 8 classes</span><span className="dm">·</span><span>8 fiches</span></span>
              <span>004 / 008</span>
            </div>
            <div className="az-lhead">
              <div data-az>
                <span className="az-label">8 enveloppes analysées <span className="ix">· IV</span></span>
                <h2 className="az-display">Chaque enveloppe, <em>maîtrisée</em><span className="dot">.</span></h2>
              </div>
              <div>
                <div className="az-pills">
                  <button className="az-pill active">Toutes <span>08</span></button>
                  <button className="az-pill">Actions</button>
                  <button className="az-pill">Épargne</button>
                  <button className="az-pill">Immobilier</button>
                </div>
              </div>
            </div>
            <div className="az-lgrid">
              {[
                { n:'01', badge:'Défiscalisé',    title:"Livrets d'épargne",  body:"Livret A · LDDS · LEP. Épargne réglementée disponible à tout moment.", img:'/livrets.png' },
                { n:'02', badge:'Exonéré 5a+',   title:'PEA',                body:"L'enveloppe reine de l'investissement en actions européennes.", img:'/PEA.png' },
                { n:'03', badge:'Abattement 8a', title:'Assurance-Vie',      body:"Fonds € · UC. Succession optimisée, fiscalité adoucie après 8 ans.", img:'/AV.png' },
                { n:'04', badge:'Flat Tax 30 %', title:'CTO',                body:"Toutes classes d'actifs, aucun plafond. Liberté absolue.", img:'/CTO.png' },
                { n:'05', badge:'Déduction IR',  title:'PER',                body:"Déduisez aujourd'hui dans votre TMI, capitalisez demain.", img:'/PER.png' },
                { n:'06', badge:'Levier bancaire',title:'Immobilier',        body:"SCPI · Direct · LMNP. Revenus locatifs récurrents.", img:'/immobilliers.png' },
                { n:'07', badge:'3916-bis',      title:'Crypto-actifs',      body:"BTC · ETH. Flat tax 30 % sur les cessions, déclaration annuelle.", img:'/crypto.png' },
                { n:'08', badge:'Précaution',    title:'Trésorerie',         body:"3 à 6 mois de dépenses. Réserve d'opportunité.", img:'/liquidites.png' },
              ].map((lab, i) => (
                <div key={i} className="az-lab" data-az>
                  <div className="az-limg">
                    <Plate label={`ENV-${lab.n}`} src={lab.img} />
                    <span className="az-badge">{lab.badge}</span>
                  </div>
                  <div className="nrow"><span>PTM-{lab.n}</span><span>2026</span></div>
                  <h4>{lab.title}</h4>
                  <p>{lab.body}</p>
                  <div className="az-arr-s"><Arr /></div>
                </div>
              ))}
            </div>
            <div className="az-lfoot">
              <span className="az-meta">8 enveloppes · Fiches complètes</span>
              <div className="az-prog">
                {Array.from({ length: 8 }, (_, i) => <span key={i} className={i < 5 ? 'on' : ''} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── V · MÉTHODE ── */}
        <section className="az-sec" id="methode">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">V.</span>
              <span className="mg"><span>Méthode / Simulateurs</span><span className="dm">·</span><span>4 étapes</span></span>
              <span>005 / 008</span>
            </div>
            <div className="az-mhead">
              <div data-az>
                <span className="az-label">Notre approche <span className="ix">· V</span></span>
                <h2 className="az-display">
                  Quatre étapes. <em>Un résultat</em> mesurable<span className="dot">.</span>
                </h2>
              </div>
              <div className="mright" data-az>
                <span className="plus">+</span>
                <p>Chaque simulation commence par une saisie simple. Les résultats sont instantanés, visuels et exportables.</p>
              </div>
            </div>
            <div className="az-mgrid">
              {[
                { n:'i',   t:'Inventaire', b:"Saisissez vos actifs par enveloppe. PEA, AV, immobilier, crypto, livrets — chacun dans sa case.", img:'/patrimoine-actifs.png' },
                { n:'ii',  t:'Analyse',    b:"Patrimoine net calculé, allocation visuelle, TER comparés. Une image nette de votre situation réelle.", img:'/patrimoine-overview.png' },
                { n:'iii', t:'Simulation', b:"Flat tax vs barème, PEA vs CTO, impact des frais, projection retraite. 18 outils.", img:'/dashboard-mobile.png' },
                { n:'iv',  t:'Décision',   b:"Score patrimonial sur 7 dimensions. Recommandations actionnables. Vous décidez, en connaissance de cause.", img:'/dashboard-desktop.png' },
              ].map((s, i) => (
                <div key={i} className="az-mstep" data-az>
                  <div className="snum">{s.n}</div>
                  <h4>{s.t}{i < 3 && <span className="arr-r">→</span>}</h4>
                  <p>{s.b}</p>
                  <div className="mimg"><Plate label={`METHOD-${i+1}`} src={s.img} /></div>
                </div>
              ))}
            </div>
            <div className="az-mfoot">
              <div className="mfl"><span className="mring" /><span>Patrimo · Méthode propriétaire · 2024</span></div>
              <div className="mfr">Résultat immédiat · <b>Zéro compte requis</b></div>
            </div>
          </div>
        </section>

        {/* ── VI · SCORE (dark slab) ── */}
        <section id="score" style={{ padding: '130px 0' }}>
          <div className="az-dark">
            <div className="az-drule">
              <span className="az-roman">VI.</span>
              <span className="mg"><span>Score Patrimonial · 7 dimensions</span><span className="dm">·</span><span>Analyse complète</span></span>
              <span>006 / 008</span>
            </div>
            <div className="az-dgrid">
              <div className="az-dcopy" data-az>
                <span className="az-label">Score <span className="ix">· VI</span></span>
                <h2>
                  Une note pour <em>comprendre</em>{' '}
                  où vous en <em>êtes</em><span className="dot">.</span>
                </h2>
                <a className="az-dlink" href="/login">Calculer mon score</a>
              </div>
              <a className="az-wcard rot1" href="/login" data-az>
                <div className="wlrow"><span className="wsl">Diversification</span><span className="widx">DIM-01</span></div>
                <div className="wimg"><Plate label="SCORE-1" src="/patrimoine-actifs.png" /></div>
                <h3>Allocation & diversification</h3>
                <p>Score de 0 à 100 sur 7 dimensions clés de votre patrimoine.</p>
                <div className="wmrow"><span>7 dimensions · Note globale</span><span className="wyr">2026</span></div>
              </a>
              <a className="az-wcard rot2" href="/login" data-az>
                <div className="wlrow"><span className="wsl">Optimisation fiscale</span><span className="widx">DIM-02</span></div>
                <div className="wimg"><Plate label="SCORE-2" src="/patrimoine-overview.png" /></div>
                <h3>Fiscalité & enveloppes</h3>
                <p>Taux d'imposition effectif, levier fiscal disponible, optimisation possible.</p>
                <div className="wmrow"><span>Flat Tax · TMI · PFU</span><span className="wyr">2026</span></div>
              </a>
            </div>
          </div>
        </section>

        {/* ── VII · SÉCURITÉ ── */}
        <section className="az-sec" id="securite">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">VII.</span>
              <span className="mg"><span>Sécurité / Confiance</span><span className="dm">·</span><span>Zéro compromis</span></span>
              <span>007 / 008</span>
            </div>
            <div className="az-tgrid">
              <div data-az>
                <span className="az-label">Sécurité <span className="ix">· VII</span></span>
                <h2 className="az-tcopy" style={{ marginTop: 28 }}>
                  <div className="az-display">
                    « Patrimo ne demande aucune donnée bancaire.
                    Vous saisissez ce que vous voulez,{' '}
                    <em>quand vous voulez.</em> »
                  </div>
                </h2>
                <div className="az-author">
                  <div className="az-avatar">P</div>
                  <p>Architecture de confiance<span>AES-256 · RGPD · Hébergé en UE · Open-source</span></p>
                </div>
                <div className="az-divider" />
                <p className="az-ptxt">
                  Patrimo est conçu pour les investisseurs qui refusent de partager leurs accès bancaires.
                  Vous contrôlez vos données à 100 %.
                </p>
                <div className="az-partners">
                  {[
                    { g:'AES', n:'AES-256',        t:'Chiffrement' },
                    { g:'EU',  n:'RGPD',           t:'Conformité' },
                    { g:'⚡',  n:'Temps réel',     t:'Performance' },
                    { g:'{}',  n:'Open-source',    t:'Transparence' },
                    { g:'0',   n:'Donnée bancaire', t:'Zéro accès' },
                  ].map((p, i) => (
                    <div key={i} className="az-partner" data-az>
                      <div className="az-pglyph">{p.g}</div>
                      <span className="az-pname">{p.n}</span>
                      <span className="az-ptype">{p.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="az-tart" data-az="right">
                <Plate label="SECURITE" src="/dashboard-mobile.png" />
              </div>
            </div>
          </div>
        </section>

        {/* ── VIII · CTA ── */}
        <section className="az-sec az-ctas" id="contact">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">VIII.</span>
              <span className="mg"><span>Entrée / CTA</span><span className="dm">·</span><span>Accès immédiat · Gratuit</span></span>
              <span>008 / 008</span>
            </div>
            <div className="az-ctag">
              <div data-az>
                <span className="az-label">Commencer <span className="ix">· VIII</span></span>
                <h2 className="az-display">
                  Reprenez le <em>contrôle</em>{' '}
                  de votre patrimoine<span className="dot">.</span>
                </h2>
                <p className="az-lead">
                  Créez votre espace gratuitement. Aucune donnée bancaire requise.
                  Résultats immédiats, sans engagement.
                </p>
                <div style={{ marginTop: 36, marginBottom: 32 }}>
                  <a className="az-btn az-btn-primary" href="/login" style={{ fontSize: 15, padding: '16px 28px' }}>
                    Créer mon espace gratuit
                    <span className="az-arr"><Arr /></span>
                  </a>
                </div>
                <div className="az-cfoot">
                  <span className="cs">100 % gratuit</span>
                  <span>Zéro donnée bancaire</span>
                  <span>Accès immédiat</span>
                </div>
              </div>
              <div className="az-caart" data-az="right">
                <Plate label="CTA" src="/patrimoine-actifs.png" />
                <span className="ribbon">Patrimo · Votre patrimoine, piloté</span>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="az-ft">
          <div className="az-c">
            <div className="az-fgrid">
              <div className="az-fbrand">
                <a href="#top" className="az-brand">
                  <span className="az-bmark">P</span>
                  <span>Patrimo</span>
                </a>
                <p>
                  Plateforme patrimoniale gratuite — 18 simulateurs fiscaux, 8 enveloppes
                  et un score patrimonial sur 7 dimensions. Conçue pour l'investisseur français
                  qui veut comprendre avant d'agir.
                </p>
              </div>
              <div className="az-fcol">
                <h5>Plateforme</h5>
                <ul>
                  <li><a href="#plateforme">Vision patrimoniale</a></li>
                  <li><a href="#plateforme">Optimisation TER</a></li>
                  <li><a href="#methode">18 simulateurs</a></li>
                  <li><a href="#score">Score patrimonial</a></li>
                </ul>
              </div>
              <div className="az-fcol">
                <h5>Enveloppes</h5>
                <ul>
                  <li><a href="#enveloppes">PEA · AV · PER</a></li>
                  <li><a href="#enveloppes">CTO · Livrets</a></li>
                  <li><a href="#enveloppes">SCPI · Immobilier</a></li>
                  <li><a href="#enveloppes">Crypto · Cash</a></li>
                </ul>
              </div>
              <div className="az-fcol">
                <h5>Ressources</h5>
                <ul>
                  <li><a href="#methode">Notre approche</a></li>
                  <li><a href="#about">À propos</a></li>
                  <li><a href="/login">Créer un compte</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
              <div className="az-fcol">
                <h5>Légal</h5>
                <ul>
                  <li><a href="#">Mentions légales</a></li>
                  <li><a href="#">Confidentialité</a></li>
                  <li><a href="#">CGU</a></li>
                  <li><a href="#">RGPD</a></li>
                </ul>
              </div>
            </div>
            <div className="az-fbot">
              <span>© 2026 Patrimo · Tous droits réservés · Made in France</span>
              <div className="fr">
                <span>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--coral)',display:'inline-block',marginRight:6,verticalAlign:'middle',animation:'az-pulse 2.4s ease-in-out infinite' }} />
                  Opérationnel
                </span>
                <span>Open-source · RGPD</span>
                <span>Paris · France</span>
              </div>
            </div>
          </div>
          <div className="az-fmega">
            <div className="az-c">
              <div className="word">Patri<em>mo</em></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
