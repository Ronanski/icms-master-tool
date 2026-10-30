#!/usr/bin/env node
// style-audit.mjs — measures the actual design system of ANY running web app (no app knowledge needed).
// Lists every font family, font size, font weight, text colour, background colour, spacing value,
// border radius and shadow in use, with counts, plus control sizes and contrast failures.
// Many different values = no consistent design system. Output: style-audit.md + style-audit.json + screenshots.
//
// Usage: node style-audit.mjs --url <http://... | file:///abs/app.html> [--out dir] [--sizes 390x844,1440x900]
//                             [--wait 1500] [--routes /,/settings,#tab] [--init setup.js] [--chromium path]
// Needs: playwright (npm i -D playwright).
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(path.join(process.cwd(), 'x.js'));
const A = {};
for (let i = 2; i < process.argv.length; i++) { const k = process.argv[i]; if (k.startsWith('--')) A[k.slice(2)] = process.argv[i + 1] == null || process.argv[i + 1].startsWith('--') ? true : process.argv[++i]; }
if (!A.url) { console.error('Missing --url'); process.exit(2); }
const OUT = path.resolve(A.out || 'style-audit-out'); fs.mkdirSync(OUT, { recursive: true });
const SIZES = (A.sizes || '390x844,1440x900').split(',').map(s => s.split('x').map(Number));
const ROUTES = A.routes ? A.routes.split(',') : [''];
let pw; try { pw = require('playwright'); } catch { pw = await import('playwright'); }
const exe = A.chromium || ['/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
const browser = await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] });
const initJs = A.init ? fs.readFileSync(A.init, 'utf8') : null;

function measure() {
  const tally = {}; const add = (k, v) => { if (v == null || v === '') return; (tally[k] ||= {}); tally[k][v] = (tally[k][v] || 0) + 1; };
  const vw = innerWidth, vh = innerHeight;
  const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a] = m.map(Number); if (a === 0) return null; const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return { L: .2126 * f(r) + .7152 * f(g) + .0722 * f(b), a: a == null ? 1 : a }; };
  const hex = c => { const m = c.match(/[\d.]+/g); if (!m) return c; const [r, g, b, a] = m.map(Number); if (a === 0) return null; return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('') + (a != null && a < 1 ? ` a${(+a).toFixed(2)}` : ''); };
  const bgOf = e => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const l = lum(getComputedStyle(n).backgroundColor); if (l && l.a > .5) return l.L; } return 1; };
  let lowContrast = [], controls = { n: 0, under44: 0, under24: 0, heights: {} };
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg,canvas,script,style')) continue;
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText && parseFloat(cs.fontSize) >= 1) {
      add('font-family', cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
      add('font-size', Math.round(parseFloat(cs.fontSize) * 2) / 2 + 'px');
      add('font-weight', cs.fontWeight);
      add('line-height', cs.lineHeight === 'normal' || isNaN(parseFloat(cs.lineHeight)) ? 'normal' : Math.round(parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) * 100) / 100 + 'x');
      add('text-colour', hex(cs.color));
      const fg = lum(cs.color); if (fg) { const bg = bgOf(e); const cr = (Math.max(fg.L, bg) + .05) / (Math.min(fg.L, bg) + .05); const big = parseFloat(cs.fontSize) >= 18.66 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700); if (cr < (big ? 3 : 4.5) && lowContrast.length < 40) lowContrast.push(`${cr.toFixed(2)}:1 "${e.textContent.trim().slice(0, 30)}" ${hex(cs.color)}`); }
    }
    add('background', hex(cs.backgroundColor));
    if (cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none') add('border-colour', hex(cs.borderTopColor));
    for (const p of ['paddingTop', 'paddingLeft', 'marginTop', 'marginLeft', 'rowGap', 'columnGap']) { const v = parseFloat(cs[p]); if (v > 0) add('spacing', Math.round(v) + 'px'); }
    if (cs.borderTopLeftRadius !== '0px') add('radius', cs.borderTopLeftRadius);
    if (cs.boxShadow !== 'none') add('shadow', cs.boxShadow.slice(0, 60));
    if (e.matches('button,a[href],input,select,textarea,[role=button],[role=tab],[role=menuitem]')) {
      controls.n++; if (r.height < 44 || r.width < 44) controls.under44++; if (r.height < 24 || r.width < 24) controls.under24++;
      const h = Math.round(r.height) + 'px'; controls.heights[h] = (controls.heights[h] || 0) + 1;
    }
  }
  const off4 = Object.entries(tally.spacing || {}).filter(([v]) => parseInt(v) % 4 !== 0).reduce((a, [, n]) => a + n, 0);
  const all4 = Object.values(tally.spacing || {}).reduce((a, n) => a + n, 0);
  return { tally, lowContrast, controls, spacingOff4grid: all4 ? Math.round(off4 / all4 * 100) : 0, pageBg: hex(getComputedStyle(document.body).backgroundColor), title: document.title };
}

const res = { url: A.url, when: new Date().toISOString(), views: [] };
for (const [W, H] of SIZES) for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: W <= 1024, isMobile: W < 600 });
  if (initJs) await ctx.addInitScript(initJs);
  const page = await ctx.newPage();
  const url = route ? new URL(route, A.url).href : A.url;
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(+(A.wait || 1500));
  const shot = `shot-${W}x${H}-${(route || 'start').replace(/[^\w-]+/g, '_')}.png`;
  await page.screenshot({ path: path.join(OUT, shot) });
  res.views.push({ size: `${W}x${H}`, route: route || '/', shot, ...(await page.evaluate(measure)) });
  await ctx.close();
}
await browser.close();

const top = (o, n = 12) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} (${v})`).join(', ');
const md = [`# Style audit — ${res.url}`, `When: ${res.when}`, '',
  'Targets: 1-2 font families (+1 mono for numbers), ≤ 6-8 font sizes on a scale, ≤ 3 weights, spacing on a 4/8 grid,',
  '1 neutral ramp + 1 brand colour + 4 status colours, ≤ 3 radii, ≤ 3 shadow levels, controls ≥ 44 px on touch / ≥ 24 px desktop.', ''];
for (const v of res.views) {
  const n = k => Object.keys(v.tally[k] || {}).length;
  md.push(`## ${v.size} ${v.route} — ${v.shot}`,
    `- Page background ${v.pageBg}`,
    `- Font families: ${n('font-family')} → ${top(v.tally['font-family'])}`,
    `- Font sizes: ${n('font-size')} → ${top(v.tally['font-size'], 20)}`,
    `- Font weights: ${n('font-weight')} → ${top(v.tally['font-weight'])}`,
    `- Line heights: ${top(v.tally['line-height'], 8)}`,
    `- Text colours: ${n('text-colour')} → ${top(v.tally['text-colour'])}`,
    `- Backgrounds: ${n('background')} → ${top(v.tally.background)}`,
    `- Border colours: ${n('border-colour')} → ${top(v.tally['border-colour'], 8)}`,
    `- Spacing values: ${n('spacing')} (${v.spacingOff4grid}% off the 4 px grid) → ${top(v.tally.spacing, 16)}`,
    `- Radii: ${n('radius')} → ${top(v.tally.radius, 8)}`,
    `- Shadows: ${n('shadow')} → ${top(v.tally.shadow, 4)}`,
    `- Controls: ${v.controls.n}, under 44 px: ${v.controls.under44}, under 24 px: ${v.controls.under24}; heights → ${top(v.controls.heights, 10)}`,
    `- Low contrast text (${v.lowContrast.length}${v.lowContrast.length >= 40 ? '+' : ''}): ${v.lowContrast.slice(0, 8).join('; ') || 'none'}`, '');
}
fs.writeFileSync(path.join(OUT, 'style-audit.json'), JSON.stringify(res, null, 1));
fs.writeFileSync(path.join(OUT, 'style-audit.md'), md.join('\n'));
console.log(md.join('\n').slice(0, 3000));
