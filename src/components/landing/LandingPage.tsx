'use client'

import React, { useEffect, useState } from 'react'
import NextImage from 'next/image'

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
.az-lang-btn{background:none;border:none;cursor:pointer;font-family:inherit;font-size:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;padding:0;transition:color 160ms}
.az-lang-btn.active{color:var(--ink);font-weight:700}
.az-lang-btn:hover{color:var(--coral)}
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
.az-mstep .snum{font-family:var(--serif);font-style:italic;font-weight:500;font-size:78px;color:var(--paper);line-height:.85;margin-bottom:24px;letter-spacing:-.02em;background:var(--coral);display:inline-block;padding:4px 14px 4px 10px;border-radius:6px;position:relative;z-index:1}
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

/* ── Translations ─────────────────────────────────────────────────────────── */
const COPY = {
  fr: {
    rail_right: 'Patrimo · Gestion patrimoniale augmentée · Paris · 2026',
    rail_left:  'Intelligence · Structuration · Pilotage · Confidentiel',
    top_ref:    'PTM / 2026',
    top_vol:    'Vol. 01 / N° 01',
    top_rub:    'Rubrique',
    top_theme:  'Patrimoine · Intelligence',
    top_free:   'Gratuit · Made in France',
    top_email:  'contact@patrimo.fr',
    nav_platform:   'Plateforme',
    nav_envelopes:  'Enveloppes',
    nav_method:     'Méthode',
    nav_score:      'Score',
    nav_contact:    'Contact',
    nav_cta:        'Créer mon espace',
    nav_meta:       'Finance · N° 01',
    nav_submeta:    'Paris · Open-source · RGPD',
    // Hero
    i_rule_sub: 'Couverture / Planche Principale',
    i_rule_vol: 'Patrimo / Volume 01',
    i_label:    'Cockpit patrimonial intelligent',
    i_h1_a:     'La gestion patrimoniale,',
    i_h1_em:    'réinventée',
    i_lead:     "18 simulateurs fiscaux · 8 enveloppes · 0 donnée bancaire. Gratuit, pour l'investisseur français qui veut comprendre avant d'agir.",
    i_cta_primary: 'Créer mon espace gratuit',
    i_cta_ghost:   'Découvrir la plateforme',
    i_stat1_b: 'simulateurs',    i_stat1_s: 'Fiscalité française',
    i_stat2_b: 'enveloppes',     i_stat2_s: 'PEA · AV · PER…',
    i_stat3_b: 'donnée bancaire',i_stat3_s: 'Zéro accès requis',
    i_foot_l: "Gratuit · Pour l'investisseur français",
    i_annot_tr: 'Planche N° 01',
    i_annot_br: 'Composé par',
    i_idx: ['Inventaire','Analyse','Simulation','Décision'],
    // Wire
    wire_title: '8 enveloppes',
    wire_sub:   'Patrimo · France · Gratuit',
    wire_row1: [['PEA','Exonéré après 5 ans'],['AV','Abattement 152 500 €'],['PER','Déduction IR'],['CTO','Flat Tax 30 %'],['LIVRET','Défiscalisé garanti'],['SCPI','Rendement 5,2 %'],['CRYPTO','3916-bis déclaré'],['CASH','Précaution & opportunité'],['PEA','Exonéré après 5 ans'],['AV','Abattement 152 500 €'],['PER','Déduction IR'],['CTO','Flat Tax 30 %'],['LIVRET','Défiscalisé garanti'],['SCPI','Rendement 5,2 %'],['CRYPTO','3916-bis déclaré'],['CASH','Précaution & opportunité']],
    wire_row2: [['FT','Flat Tax vs Barème · 18 simulateurs'],['PE','PEA vs CTO vs Assurance-Vie'],['IF','IFI · Transmission · Succession'],['RE','Retraite · PER · LMNP · SCPI'],['SC','Score Patrimonial · 7 dimensions'],['SZ','Zéro donnée bancaire · RGPD · AES-256'],['FT','Flat Tax vs Barème · 18 simulateurs'],['PE','PEA vs CTO vs Assurance-Vie'],['IF','IFI · Transmission · Succession'],['RE','Retraite · PER · LMNP · SCPI'],['SC','Score Patrimonial · 7 dimensions'],['SZ','Zéro donnée bancaire · RGPD · AES-256']],
    // II
    ii_rule_sub: 'Manifeste / À propos',
    ii_rule_tag: 'Identité',
    ii_label: 'Notre manifeste',
    ii_h2_a: 'La clarté', ii_h2_em1: 'décisionnelle,', ii_h2_b: 'au cœur de chaque', ii_h2_em2: 'patrimoine',
    ii_lead1: "Patrimo n'est pas un outil de plus. C'est une couche d'intelligence financière qui transforme la complexité patrimoniale en décisions claires, structurées et documentées. Gratuit par conviction, sécurisé par construction.",
    ii_lead2: "18 simulateurs fiscaux. 8 enveloppes. Zéro donnée bancaire. Conçu pour l'investisseur français qui veut comprendre avant d'agir.",
    ii_founded: 'Fondé en 2024',
    ii_stamp1: 'Open-source · RGPD',
    ii_stamp2: 'Hébergé en UE · AES-256',
    ii_capt_b: 'Planche II',
    ii_capt:   'Dashboard patrimonial · 2026',
    // III
    iii_rule_sub: 'Capacités / Plateforme',
    iii_rule_tag: '4 modules',
    iii_label: 'Intelligence patrimoniale',
    iii_h2_a: 'Quatre modules,', iii_h2_em: 'une vision', iii_h2_b: 'unifiée',
    iii_ribbon: 'Plateforme Patrimo · 2026',
    iii_cards: [
      { n:'01', tag:'Suivre',    title:'Vision patrimoniale complète', body:"Cartographie en temps réel de vos actifs. 8 enveloppes, patrimoine net, performance." },
      { n:'02', tag:'Optimiser', title:'Chaque frais compte',           body:"ETFs comparés aux meilleures alternatives. Sur 20 ans, 0,18 % de moins = des milliers d’euros récupérés." },
      { n:'03', tag:'Simuler',   title:'18 simulateurs fiscaux',        body:"Flat tax vs barème, PEA vs CTO, IFI, transmission, retraite. Tout en un seul endroit." },
      { n:'04', tag:'Éduquer',   title:"Comprendre avant d’agir",  body:"Guides pratiques, glossaire interactif, fiches enveloppe. L’éducation financière française." },
    ],
    // IV
    iv_rule_sub: 'Enveloppes / 8 classes',
    iv_rule_tag: '8 fiches',
    iv_label: '8 enveloppes analysées',
    iv_h2_a: 'Chaque enveloppe,', iv_h2_em: 'maîtrisée',
    iv_pills: ['Toutes 08','Actions','Épargne','Immobilier'],
    iv_labs: [
      { n:'01', badge:'Défiscalisé',    title:"Livrets d'épargne",  body:"Livret A · LDDS · LEP. Épargne réglementée disponible à tout moment.", img:'/livrets.jpg' },
      { n:'02', badge:'Exonéré 5a+',   title:'PEA',                body:"L'enveloppe reine de l'investissement en actions européennes.", img:'/PEA.jpg' },
      { n:'03', badge:'Abattement 8a', title:'Assurance-Vie',      body:"Fonds € · UC. Succession optimisée, fiscalité adoucie après 8 ans.", img:'/AV.jpg' },
      { n:'04', badge:'Flat Tax 30 %', title:'CTO',                body:"Toutes classes d'actifs, aucun plafond. Liberté absolue.", img:'/CTO.jpg' },
      { n:'05', badge:'Déduction IR',  title:'PER',                body:"Déduisez aujourd'hui dans votre TMI, capitalisez demain.", img:'/PER.jpg' },
      { n:'06', badge:'Levier bancaire',title:'Immobilier',        body:"SCPI · Direct · LMNP. Revenus locatifs récurrents.", img:'/immobilliers.jpg' },
      { n:'07', badge:'3916-bis',      title:'Crypto-actifs',      body:"BTC · ETH. Flat tax 30 % sur les cessions, déclaration annuelle.", img:'/crypto.jpg' },
      { n:'08', badge:'Précaution',    title:'Trésorerie',         body:"3 à 6 mois de dépenses. Réserve d'opportunité.", img:'/liquidites.jpg' },
    ],
    iv_foot: '8 enveloppes · Fiches complètes',
    // V
    v_rule_sub: 'Méthode / Simulateurs',
    v_rule_tag: '4 étapes',
    v_label: 'Notre approche',
    v_h2_a: 'Quatre étapes.', v_h2_em: 'Un résultat', v_h2_b: 'mesurable',
    v_sub_p: 'Chaque simulation commence par une saisie simple. Les résultats sont instantanés, visuels et exportables.',
    v_steps: [
      { n:'i',   t:'Inventaire', b:"Saisissez vos actifs par enveloppe. PEA, AV, immobilier, crypto, livrets — chacun dans sa case.", img:'/Inventaire.jpg' },
      { n:'ii',  t:'Analyse',    b:"Patrimoine net calculé, allocation visuelle, TER comparés. Une image nette de votre situation réelle.", img:'/Analyse.jpg' },
      { n:'iii', t:'Simulation', b:"Flat tax vs barème, PEA vs CTO, impact des frais, projection retraite. 18 outils.", img:'/Simulation.jpg' },
      { n:'iv',  t:'Décision',   b:"Score patrimonial sur 7 dimensions. Recommandations actionnables. Vous décidez, en connaissance de cause.", img:'/decision.jpg' },
    ],
    v_foot_l: 'Patrimo · Méthode propriétaire · 2024',
    v_foot_r_a: 'Résultat immédiat · ', v_foot_r_b: 'Zéro compte requis',
    // VI
    vi_rule_sub: 'Score Patrimonial · 7 dimensions',
    vi_rule_tag: 'Analyse complète',
    vi_label: 'Score',
    vi_h2_a: 'Une note pour', vi_h2_em1: 'comprendre', vi_h2_b: 'où vous en', vi_h2_em2: 'êtes',
    vi_link: 'Calculer mon score',
    vi_card1_sl: 'Diversification', vi_card1_h3: 'Allocation & diversification', vi_card1_p: 'Score de 0 à 100 sur 7 dimensions clés de votre patrimoine.', vi_card1_foot: '7 dimensions · Note globale',
    vi_card2_sl: 'Optimisation fiscale', vi_card2_h3: 'Fiscalité & enveloppes', vi_card2_p: "Taux d'imposition effectif, levier fiscal disponible, optimisation possible.", vi_card2_foot: 'Flat Tax · TMI · PFU',
    // VII
    vii_rule_sub: 'Sécurité / Confiance',
    vii_rule_tag: 'Zéro compromis',
    vii_label: 'Sécurité',
    vii_quote: 'Patrimo ne demande aucune donnée bancaire. Vous saisissez ce que vous voulez, ',
    vii_quote_em: 'quand vous voulez.',
    vii_author_title: 'Architecture de confiance',
    vii_author_sub: 'AES-256 · RGPD · Hébergé en UE · Open-source',
    vii_ptxt: 'Patrimo est conçu pour les investisseurs qui refusent de partager leurs accès bancaires. Vous contrôlez vos données à 100 %.',
    vii_partners: [
      { g:'AES', n:'AES-256',        t:'Chiffrement' },
      { g:'EU',  n:'RGPD',           t:'Conformité' },
      { g:'⚡',  n:'Temps réel',     t:'Performance' },
      { g:'{}',  n:'Open-source',    t:'Transparence' },
      { g:'0',   n:'Donnée bancaire', t:'Zéro accès' },
    ],
    // VIII
    viii_rule_sub: 'Entrée / CTA',
    viii_rule_tag: 'Accès immédiat · Gratuit',
    viii_label: 'Commencer',
    viii_h2_a: 'Reprenez le', viii_h2_em: 'contrôle', viii_h2_b: 'de votre patrimoine',
    viii_lead: 'Créez votre espace gratuitement. Aucune donnée bancaire requise. Résultats immédiats, sans engagement.',
    viii_cta: 'Créer mon espace gratuit',
    viii_cfoot: ['100 % gratuit','Zéro donnée bancaire','Accès immédiat'],
    viii_ribbon: 'Patrimo · Votre patrimoine, piloté',
    // Footer
    ft_desc: "Plateforme patrimoniale gratuite — 18 simulateurs fiscaux, 8 enveloppes et un score patrimonial sur 7 dimensions. Conçue pour l'investisseur français qui veut comprendre avant d'agir.",
    ft_col1: 'Plateforme',
    ft_col1_links: [['#plateforme','Vision patrimoniale'],['#plateforme','Optimisation TER'],['#methode','18 simulateurs'],['#score','Score patrimonial']],
    ft_col2: 'Enveloppes',
    ft_col2_links: [['#enveloppes','PEA · AV · PER'],['#enveloppes','CTO · Livrets'],['#enveloppes','SCPI · Immobilier'],['#enveloppes','Crypto · Cash']],
    ft_col3: 'Ressources',
    ft_col3_links: [['#methode','Notre approche'],['#about','À propos'],['/login','Créer un compte'],['#contact','Contact']],
    ft_col4: 'Légal',
    ft_col4_links: [['#','Mentions légales'],['#','Confidentialité'],['#','CGU'],['#','RGPD']],
    ft_copy: '© 2026 Patrimo · Tous droits réservés · Made in France',
    ft_status: 'Opérationnel',
    ft_open: 'Open-source · RGPD',
    ft_city: 'Paris · France',
    ft_mega_a: 'Patri', ft_mega_em: 'mo',
  },
  en: {
    rail_right: 'Patrimo · Augmented Wealth Management · Paris · 2026',
    rail_left:  'Intelligence · Structure · Control · Confidential',
    top_ref:    'PTM / 2026',
    top_vol:    'Vol. 01 / No. 01',
    top_rub:    'Section',
    top_theme:  'Wealth · Intelligence',
    top_free:   'Free · Made in France',
    top_email:  'contact@patrimo.fr',
    nav_platform:   'Platform',
    nav_envelopes:  'Wrappers',
    nav_method:     'Method',
    nav_score:      'Score',
    nav_contact:    'Contact',
    nav_cta:        'Create my space',
    nav_meta:       'Finance · No. 01',
    nav_submeta:    'Paris · Open-source · GDPR',
    // Hero
    i_rule_sub: 'Cover / Main Plate',
    i_rule_vol: 'Patrimo / Volume 01',
    i_label:    'Intelligent wealth cockpit',
    i_h1_a:     'Wealth management,',
    i_h1_em:    'reinvented',
    i_lead:     '18 tax simulators · 8 investment wrappers · 0 banking data. Free, for the French investor who wants to understand before acting.',
    i_cta_primary: 'Create my free space',
    i_cta_ghost:   'Discover the platform',
    i_stat1_b: 'simulators',      i_stat1_s: 'French tax law',
    i_stat2_b: 'wrappers',        i_stat2_s: 'PEA · Life ins. · PER…',
    i_stat3_b: 'banking data',    i_stat3_s: 'Zero access required',
    i_foot_l: 'Free · For the French investor',
    i_annot_tr: 'Plate No. 01',
    i_annot_br: 'Composed by',
    i_idx: ['Inventory','Analysis','Simulation','Decision'],
    // Wire
    wire_title: '8 wrappers',
    wire_sub:   'Patrimo · France · Free',
    wire_row1: [['PEA','Tax-free after 5 years'],['AV','Life Ins. allowance €152,500'],['PER','Income tax deduction'],['CTO','Flat Tax 30%'],['LIVRET','Regulated tax-free savings'],['SCPI','REIT yield 5.2%'],['CRYPTO','Declared annually'],['CASH','Safety & opportunity'],['PEA','Tax-free after 5 years'],['AV','Life Ins. allowance €152,500'],['PER','Income tax deduction'],['CTO','Flat Tax 30%'],['LIVRET','Regulated tax-free savings'],['SCPI','REIT yield 5.2%'],['CRYPTO','Declared annually'],['CASH','Safety & opportunity']],
    wire_row2: [['FT','Flat Tax vs Progressive · 18 simulators'],['PE','PEA vs CTO vs Life Insurance'],['IF','Wealth tax · Estate · Succession'],['RE','Retirement · PER · LMNP · SCPI'],['SC','Wealth Score · 7 dimensions'],['SZ','Zero banking data · GDPR · AES-256'],['FT','Flat Tax vs Progressive · 18 simulators'],['PE','PEA vs CTO vs Life Insurance'],['IF','Wealth tax · Estate · Succession'],['RE','Retirement · PER · LMNP · SCPI'],['SC','Wealth Score · 7 dimensions'],['SZ','Zero banking data · GDPR · AES-256']],
    // II
    ii_rule_sub: 'Manifesto / About',
    ii_rule_tag: 'Identity',
    ii_label: 'Our manifesto',
    ii_h2_a: 'Decision', ii_h2_em1: 'clarity,', ii_h2_b: 'at the heart of every', ii_h2_em2: 'portfolio',
    ii_lead1: 'Patrimo is not just another tool. It is a financial intelligence layer that transforms wealth complexity into clear, structured, and documented decisions. Free by conviction, secure by design.',
    ii_lead2: '18 tax simulators. 8 investment wrappers. Zero banking data. Built for the French investor who wants to understand before acting.',
    ii_founded: 'Founded in 2024',
    ii_stamp1: 'Open-source · GDPR',
    ii_stamp2: 'EU-hosted · AES-256',
    ii_capt_b: 'Plate II',
    ii_capt:   'Wealth dashboard · 2026',
    // III
    iii_rule_sub: 'Capabilities / Platform',
    iii_rule_tag: '4 modules',
    iii_label: 'Wealth intelligence',
    iii_h2_a: 'Four modules,', iii_h2_em: 'one unified', iii_h2_b: 'vision',
    iii_ribbon: 'Patrimo Platform · 2026',
    iii_cards: [
      { n:'01', tag:'Track',    title:'Complete wealth overview', body:'Real-time mapping of your assets. 8 wrappers, net worth, performance.' },
      { n:'02', tag:'Optimise', title:'Every fee matters',        body:'ETFs compared to best alternatives. Over 20 years, 0.18% less = thousands of euros recovered.' },
      { n:'03', tag:'Simulate', title:'18 tax simulators',        body:'Flat tax vs progressive, PEA vs CTO, wealth tax, estate, retirement. All in one place.' },
      { n:'04', tag:'Educate',  title:'Understand before acting', body:'Practical guides, interactive glossary, wrapper fact sheets. French financial education.' },
    ],
    // IV
    iv_rule_sub: 'Wrappers / 8 classes',
    iv_rule_tag: '8 fact sheets',
    iv_label: '8 wrappers analysed',
    iv_h2_a: 'Every wrapper,', iv_h2_em: 'mastered',
    iv_pills: ['All 08','Equities','Savings','Real Estate'],
    iv_labs: [
      { n:'01', badge:'Tax-free',         title:'Savings accounts',    body:'Livret A · LDDS · LEP. Regulated savings available at any time.', img:'/livrets.jpg' },
      { n:'02', badge:'Exempt 5y+',       title:'PEA',                 body:'The prime wrapper for French and European equity investment.', img:'/PEA.jpg' },
      { n:'03', badge:'Allowance 8y',     title:'Life Insurance',      body:'Euro funds · Units. Optimised inheritance, softened tax after 8 years.', img:'/AV.jpg' },
      { n:'04', badge:'Flat Tax 30%',     title:'CTO',                 body:'All asset classes, no ceiling. Absolute freedom.', img:'/CTO.jpg' },
      { n:'05', badge:'Tax deduction',    title:'PER',                 body:'Deduct today at your marginal rate, capitalise tomorrow.', img:'/PER.jpg' },
      { n:'06', badge:'Bank leverage',    title:'Real Estate',         body:'SCPI · Direct · LMNP. Recurring rental income.', img:'/immobilliers.jpg' },
      { n:'07', badge:'Annual report',    title:'Crypto assets',       body:'BTC · ETH. Flat tax 30% on disposals, annual reporting.', img:'/crypto.jpg' },
      { n:'08', badge:'Safety net',       title:'Cash',                body:'3 to 6 months of expenses. Opportunity reserve.', img:'/liquidites.jpg' },
    ],
    iv_foot: '8 wrappers · Full fact sheets',
    // V
    v_rule_sub: 'Method / Simulators',
    v_rule_tag: '4 steps',
    v_label: 'Our approach',
    v_h2_a: 'Four steps.', v_h2_em: 'One measurable', v_h2_b: 'outcome',
    v_sub_p: 'Every simulation starts with simple inputs. Results are instant, visual and exportable.',
    v_steps: [
      { n:'i',   t:'Inventory', b:'Enter your assets by wrapper. PEA, life insurance, real estate, crypto, savings — each in its own slot.', img:'/Inventaire.jpg' },
      { n:'ii',  t:'Analysis',  b:'Net worth calculated, visual allocation, TER comparison. A clear picture of your actual situation.', img:'/Analyse.jpg' },
      { n:'iii', t:'Simulation',b:'Flat tax vs progressive, PEA vs CTO, fee impact, retirement projection. 18 tools.', img:'/Simulation.jpg' },
      { n:'iv',  t:'Decision',  b:'Wealth score across 7 dimensions. Actionable recommendations. You decide — with full clarity.', img:'/decision.jpg' },
    ],
    v_foot_l: 'Patrimo · Proprietary method · 2024',
    v_foot_r_a: 'Instant results · ', v_foot_r_b: 'No account required',
    // VI
    vi_rule_sub: 'Wealth Score · 7 dimensions',
    vi_rule_tag: 'Full analysis',
    vi_label: 'Score',
    vi_h2_a: 'A score to', vi_h2_em1: 'understand', vi_h2_b: 'where you', vi_h2_em2: 'stand',
    vi_link: 'Calculate my score',
    vi_card1_sl: 'Diversification', vi_card1_h3: 'Allocation & diversification', vi_card1_p: 'Score from 0 to 100 across 7 key dimensions of your portfolio.', vi_card1_foot: '7 dimensions · Global rating',
    vi_card2_sl: 'Tax optimisation', vi_card2_h3: 'Tax & wrappers', vi_card2_p: 'Effective tax rate, available tax leverage, optimisation potential.', vi_card2_foot: 'Flat Tax · Marginal rate · PFU',
    // VII
    vii_rule_sub: 'Security / Trust',
    vii_rule_tag: 'Zero compromise',
    vii_label: 'Security',
    vii_quote: 'Patrimo never asks for banking data. You enter what you want, ',
    vii_quote_em: 'whenever you want.',
    vii_author_title: 'Trust architecture',
    vii_author_sub: 'AES-256 · GDPR · EU-hosted · Open-source',
    vii_ptxt: 'Patrimo is built for investors who refuse to share their banking credentials. You control your data 100%.',
    vii_partners: [
      { g:'AES', n:'AES-256',     t:'Encryption' },
      { g:'EU',  n:'GDPR',        t:'Compliance' },
      { g:'⚡',  n:'Real-time',   t:'Performance' },
      { g:'{}',  n:'Open-source', t:'Transparency' },
      { g:'0',   n:'Banking data', t:'Zero access' },
    ],
    // VIII
    viii_rule_sub: 'Entry / CTA',
    viii_rule_tag: 'Immediate access · Free',
    viii_label: 'Get started',
    viii_h2_a: 'Take back', viii_h2_em: 'control', viii_h2_b: 'of your wealth',
    viii_lead: 'Create your space for free. No banking data required. Immediate results, no commitment.',
    viii_cta: 'Create my free space',
    viii_cfoot: ['100% free','Zero banking data','Immediate access'],
    viii_ribbon: 'Patrimo · Your wealth, managed',
    // Footer
    ft_desc: 'Free wealth platform — 18 tax simulators, 8 investment wrappers and a wealth score across 7 dimensions. Built for the French investor who wants to understand before acting.',
    ft_col1: 'Platform',
    ft_col1_links: [['#plateforme','Wealth overview'],['#plateforme','TER optimisation'],['#methode','18 simulators'],['#score','Wealth score']],
    ft_col2: 'Wrappers',
    ft_col2_links: [['#enveloppes','PEA · Life ins. · PER'],['#enveloppes','CTO · Savings'],['#enveloppes','SCPI · Real estate'],['#enveloppes','Crypto · Cash']],
    ft_col3: 'Resources',
    ft_col3_links: [['#methode','Our approach'],['#about','About'],['/login','Create account'],['#contact','Contact']],
    ft_col4: 'Legal',
    ft_col4_links: [['#','Legal notice'],['#','Privacy policy'],['#','Terms of use'],['#','GDPR']],
    ft_copy: '© 2026 Patrimo · All rights reserved · Made in France',
    ft_status: 'Operational',
    ft_open: 'Open-source · GDPR',
    ft_city: 'Paris · France',
    ft_mega_a: 'Patri', ft_mega_em: 'mo',
  },
} as const

type Lang = keyof typeof COPY

/* ── Helpers ─────────────────────────────────────────────────────────────── */
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

/* ── Component ────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = COPY[lang]

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
    let lastY = window.scrollY, ticking = false, dir = 0, dirStart = window.scrollY
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY, delta = y - lastY
        lastY = y
        nav.classList.toggle('scrolled', y > 40)
        if (delta > 2 && dir !== 1)  { dir = 1;  dirStart = y }
        if (delta < -2 && dir !== -1) { dir = -1; dirStart = y }
        const dist = Math.abs(y - dirStart)
        if (dir === 1  && dist > 80 && y > 120) nav.classList.add('hidden')
        if (dir === -1 && dist > 15) nav.classList.remove('hidden')
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
      <div className="az-rail right"><span className="rt">{t.rail_right}</span></div>
      <div className="az-rail left"><span className="rt">{t.rail_left}</span></div>

      <div className="az-shell">

        {/* TOPBAR */}
        <div className="az-top">
          <div className="az-c az-top-i">
            <span><b>{t.top_ref}</b> &nbsp;·&nbsp; {t.top_vol}</span>
            <span className="mid">
              <span>{t.top_rub} <b className="ct">{t.top_theme}</b></span>
              <span>{t.top_free}</span>
            </span>
            <span className="rgt">
              <a className="az-top-link" href={`mailto:${t.top_email}`}>
                <span className="az-pulse" />{t.top_email}
              </a>
              <span>
                <button className={`az-lang-btn${lang === 'fr' ? ' active' : ''}`} onClick={() => setLang('fr')}>FR</button>
                {' · '}
                <button className={`az-lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
              </span>
            </span>
          </div>
        </div>

        {/* NAV */}
        <header className="az-nav">
          <div className="az-c az-nav-i">
            <a href="#top" className="az-brand">
              <span className="az-bmark">P</span>
              <span>Patrimo</span>
              <span className="az-bmeta"><b>{t.nav_meta}</b>{t.nav_submeta}</span>
            </a>
            <nav>
              <ul className="az-links">
                <li><a href="#plateforme">{t.nav_platform}<span className="n">04</span></a></li>
                <li><a href="#enveloppes">{t.nav_envelopes}<span className="n">08</span></a></li>
                <li><a href="#methode">{t.nav_method}<span className="n">04</span></a></li>
                <li><a href="#score">{t.nav_score}<span className="n">07</span></a></li>
                <li><a href="#contact">{t.nav_contact}</a></li>
              </ul>
            </nav>
            <div className="az-nav-side">
              <a className="az-cta" href="/login">{t.nav_cta}</a>
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
                <span>{t.i_rule_sub}</span>
                <span className="dm">·</span>
                <span>{t.i_rule_vol}</span>
              </span>
              <span>001 / 008</span>
            </div>
          </div>
          <div className="az-c hg az-hg">
            <div className="az-hcopy">
              <span className="az-label" data-az>{t.i_label} <span className="ix">· N° 01</span></span>
              <h1 className="az-display" data-az>
                {t.i_h1_a} <em>{t.i_h1_em}</em><span className="dot">.</span>
              </h1>
              <p className="az-lead" data-az>{t.i_lead}</p>
              <div className="az-hact" data-az>
                <a className="az-btn az-btn-primary" href="/login">
                  {t.i_cta_primary}
                  <span className="az-arr"><Arr /></span>
                </a>
                <a className="az-btn az-btn-ghost" href="#plateforme">{t.i_cta_ghost}</a>
              </div>
              <div className="az-hstats" data-az>
                <div className="az-stat">
                  <span className="az-ring solid">18</span>
                  <span className="az-statlabel"><b>{t.i_stat1_b}</b>{t.i_stat1_s}</span>
                </div>
                <div className="az-stat">
                  <span className="az-ring">8</span>
                  <span className="az-statlabel"><b>{t.i_stat2_b}</b>{t.i_stat2_s}</span>
                </div>
                <div className="az-stat">
                  <span className="az-ring coral">0</span>
                  <span className="az-statlabel"><b>{t.i_stat3_b}</b>{t.i_stat3_s}</span>
                </div>
              </div>
              <div className="az-hfoot" data-az>
                <span className="az-meta">{t.i_foot_l}</span>
                <span className="az-coord">48.8566° N · 2.3522° E · Paris</span>
              </div>
            </div>
            <div className="az-hart" data-az="scale">
              <span className="az-corner tl" /><span className="az-corner tr" />
              <span className="az-corner bl" /><span className="az-corner br" />
              <span className="az-annot tl az-coord">FIG. 01 / PTM-01</span>
              <span className="az-annot tr">{t.i_annot_tr}</span>
              <span className="az-annot bl az-coord">Free · 2026</span>
              <span className="az-annot br">{t.i_annot_br}&nbsp;<span style={{ color: 'var(--coral)' }}>Patrimo</span></span>
              <Plate label="HERO" src="/hero.jpg" />
              <div className="idx">
                {t.i_idx.map((label, i) => (
                  <span key={i} className={i === 1 ? 'on' : ''}><span className="n">0{i+1}</span>{label}</span>
                ))}
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
                <b>{t.wire_title}</b>
                <span>{t.wire_sub}</span>
              </span>
            </div>
            <div className="az-wrows">
              {[t.wire_row1, t.wire_row2].map((row, ri) => (
                <div key={ri} className={`az-wrow${ri === 1 ? ' rev' : ''}`}>
                  <div className="az-mtrack" aria-hidden="true">
                    {(row as unknown as [string,string][]).map(([coord, name], i) => (
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
              <span className="mg"><span>{t.ii_rule_sub}</span><span className="dm">·</span><span>{t.ii_rule_tag}</span></span>
              <span>002 / 008</span>
            </div>
            <div className="az-agrid">
              <div data-az>
                <span className="az-label">{t.ii_label} <span className="ix">· II</span></span>
                <h2 className="az-display">
                  {t.ii_h2_a} <em>{t.ii_h2_em1}</em>{' '}{t.ii_h2_b} <em>{t.ii_h2_em2}</em><span className="dot">.</span>
                </h2>
                <p className="az-lead">{t.ii_lead1}</p>
                <p className="az-lead" style={{ marginTop: 18 }}>{t.ii_lead2}</p>
                <div className="az-afrow">
                  <span className="mark">P</span>
                  <span>{t.ii_founded}</span>
                  <div className="az-stamp">
                    <span>{t.ii_stamp1}</span>
                    <span>{t.ii_stamp2}</span>
                  </div>
                </div>
              </div>
              <div className="az-aart" data-az="right">
                <Plate label="ABOUT" src="/heritage.jpg" />
                <div className="az-acapt"><b>{t.ii_capt_b}</b>{t.ii_capt}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── III · PLATEFORME ── */}
        <section className="az-sec" id="plateforme">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">III.</span>
              <span className="mg"><span>{t.iii_rule_sub}</span><span className="dm">·</span><span>{t.iii_rule_tag}</span></span>
              <span>003 / 008</span>
            </div>
            <div className="az-cgrid">
              <div className="az-cart" data-az="left">
                <Plate label="PLATEFORME" src="/section2.jpg" />
                <span className="ribbon">{t.iii_ribbon}</span>
                <span className="az-corner tl" /><span className="az-corner br" />
              </div>
              <div className="az-ccopy">
                <span className="az-label" data-az>{t.iii_label} <span className="ix">· III</span></span>
                <h2 className="az-display" data-az>
                  {t.iii_h2_a} <em>{t.iii_h2_em}</em> {t.iii_h2_b}<span className="dot">.</span>
                </h2>
                <div className="az-cards">
                  {t.iii_cards.map((c, i) => (
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
              <span className="mg"><span>{t.iv_rule_sub}</span><span className="dm">·</span><span>{t.iv_rule_tag}</span></span>
              <span>004 / 008</span>
            </div>
            <div className="az-lhead">
              <div data-az>
                <span className="az-label">{t.iv_label} <span className="ix">· IV</span></span>
                <h2 className="az-display">{t.iv_h2_a} <em>{t.iv_h2_em}</em><span className="dot">.</span></h2>
              </div>
              <div>
                <div className="az-pills">
                  {t.iv_pills.map((p, i) => (
                    <button key={i} className={`az-pill${i === 0 ? ' active' : ''}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="az-lgrid">
              {t.iv_labs.map((lab, i) => (
                <div key={i} className="az-lab" data-az>
                  <div className="az-limg">
                    <NextImage src={lab.img as string} alt={`ENV-${lab.n}`} fill sizes="(max-width:768px) 90vw,(max-width:1200px) 25vw,320px" quality={90} style={{ objectFit:'cover', objectPosition:'center' }} />
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
              <span className="az-meta">{t.iv_foot}</span>
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
              <span className="mg"><span>{t.v_rule_sub}</span><span className="dm">·</span><span>{t.v_rule_tag}</span></span>
              <span>005 / 008</span>
            </div>
            <div className="az-mhead">
              <div data-az>
                <span className="az-label">{t.v_label} <span className="ix">· V</span></span>
                <h2 className="az-display">
                  {t.v_h2_a} <em>{t.v_h2_em}</em> {t.v_h2_b}<span className="dot">.</span>
                </h2>
              </div>
              <div className="mright" data-az>
                <span className="plus">+</span>
                <p>{t.v_sub_p}</p>
              </div>
            </div>
            <div className="az-mgrid">
              {t.v_steps.map((s, i) => (
                <div key={i} className="az-mstep" data-az>
                  <div className="snum">{s.n}</div>
                  <h4>{s.t}{i < 3 && <span className="arr-r">→</span>}</h4>
                  <p>{s.b}</p>
                  <div className="mimg"><Plate label={`METHOD-${i+1}`} src={s.img} /></div>
                </div>
              ))}
            </div>
            <div className="az-mfoot">
              <div className="mfl"><span className="mring" /><span>{t.v_foot_l}</span></div>
              <div className="mfr">{t.v_foot_r_a}<b>{t.v_foot_r_b}</b></div>
            </div>
          </div>
        </section>

        {/* ── VI · SCORE (dark slab) ── */}
        <section id="score" style={{ padding: '130px 0' }}>
          <div className="az-dark">
            <div className="az-drule">
              <span className="az-roman">VI.</span>
              <span className="mg"><span>{t.vi_rule_sub}</span><span className="dm">·</span><span>{t.vi_rule_tag}</span></span>
              <span>006 / 008</span>
            </div>
            <div className="az-dgrid">
              <div className="az-dcopy" data-az>
                <span className="az-label">{t.vi_label} <span className="ix">· VI</span></span>
                <h2>
                  {t.vi_h2_a} <em>{t.vi_h2_em1}</em>{' '}{t.vi_h2_b} <em>{t.vi_h2_em2}</em><span className="dot">.</span>
                </h2>
                <a className="az-dlink" href="/login">{t.vi_link}</a>
              </div>
              <a className="az-wcard rot1" href="/login" data-az>
                <div className="wlrow"><span className="wsl">{t.vi_card1_sl}</span><span className="widx">DIM-01</span></div>
                <div className="wimg"><Plate label="SCORE-1" src="/patrimoine-actifs.jpg" /></div>
                <h3>{t.vi_card1_h3}</h3>
                <p>{t.vi_card1_p}</p>
                <div className="wmrow"><span>{t.vi_card1_foot}</span><span className="wyr">2026</span></div>
              </a>
              <a className="az-wcard rot2" href="/login" data-az>
                <div className="wlrow"><span className="wsl">{t.vi_card2_sl}</span><span className="widx">DIM-02</span></div>
                <div className="wimg"><Plate label="SCORE-2" src="/section2.jpg" /></div>
                <h3>{t.vi_card2_h3}</h3>
                <p>{t.vi_card2_p}</p>
                <div className="wmrow"><span>{t.vi_card2_foot}</span><span className="wyr">2026</span></div>
              </a>
            </div>
          </div>
        </section>

        {/* ── VII · SÉCURITÉ ── */}
        <section className="az-sec" id="securite">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">VII.</span>
              <span className="mg"><span>{t.vii_rule_sub}</span><span className="dm">·</span><span>{t.vii_rule_tag}</span></span>
              <span>007 / 008</span>
            </div>
            <div className="az-tgrid">
              <div data-az>
                <span className="az-label">{t.vii_label} <span className="ix">· VII</span></span>
                <h2 className="az-tcopy" style={{ marginTop: 28 }}>
                  <div className="az-display">
                    « {t.vii_quote}<em>{t.vii_quote_em}</em> »
                  </div>
                </h2>
                <div className="az-author">
                  <div className="az-avatar">P</div>
                  <p>{t.vii_author_title}<span>{t.vii_author_sub}</span></p>
                </div>
                <div className="az-divider" />
                <p className="az-ptxt">{t.vii_ptxt}</p>
                <div className="az-partners">
                  {t.vii_partners.map((p, i) => (
                    <div key={i} className="az-partner" data-az>
                      <div className="az-pglyph">{p.g}</div>
                      <span className="az-pname">{p.n}</span>
                      <span className="az-ptype">{p.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="az-tart" data-az="right">
                <Plate label="SECURITE" src="/section2.jpg" />
              </div>
            </div>
          </div>
        </section>

        {/* ── VIII · CTA ── */}
        <section className="az-sec az-ctas" id="contact">
          <div className="az-c">
            <div className="az-rule">
              <span className="az-roman">VIII.</span>
              <span className="mg"><span>{t.viii_rule_sub}</span><span className="dm">·</span><span>{t.viii_rule_tag}</span></span>
              <span>008 / 008</span>
            </div>
            <div className="az-ctag">
              <div data-az>
                <span className="az-label">{t.viii_label} <span className="ix">· VIII</span></span>
                <h2 className="az-display">
                  {t.viii_h2_a} <em>{t.viii_h2_em}</em>{' '}{t.viii_h2_b}<span className="dot">.</span>
                </h2>
                <p className="az-lead">{t.viii_lead}</p>
                <div style={{ marginTop: 36, marginBottom: 32 }}>
                  <a className="az-btn az-btn-primary" href="/login" style={{ fontSize: 15, padding: '16px 28px' }}>
                    {t.viii_cta}
                    <span className="az-arr"><Arr /></span>
                  </a>
                </div>
                <div className="az-cfoot">
                  {t.viii_cfoot.map((s, i) => (
                    <span key={i} className={i === 0 ? 'cs' : ''}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="az-caart" data-az="right">
                <Plate label="CTA" src="/footer.jpg" />
                <span className="ribbon">{t.viii_ribbon}</span>
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
                <p>{t.ft_desc}</p>
              </div>
              {([
                [t.ft_col1, t.ft_col1_links],
                [t.ft_col2, t.ft_col2_links],
                [t.ft_col3, t.ft_col3_links],
                [t.ft_col4, t.ft_col4_links],
              ] as unknown as [string, [string,string][]][]).map(([title, links], ci) => (
                <div key={ci} className="az-fcol">
                  <h5>{title}</h5>
                  <ul>
                    {links.map(([href, label], li) => (
                      <li key={li}><a href={href}>{label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="az-fbot">
              <span>{t.ft_copy}</span>
              <div className="fr">
                <span>
                  <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--coral)',display:'inline-block',marginRight:6,verticalAlign:'middle',animation:'az-pulse 2.4s ease-in-out infinite' }} />
                  {t.ft_status}
                </span>
                <span>{t.ft_open}</span>
                <span>{t.ft_city}</span>
              </div>
            </div>
          </div>
          <div className="az-fmega">
            <div className="az-c">
              <div className="word">{t.ft_mega_a}<em>{t.ft_mega_em}</em></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
