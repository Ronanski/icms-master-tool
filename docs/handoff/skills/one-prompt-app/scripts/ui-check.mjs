#!/usr/bin/env node
// ui-check.mjs — generic UI quality sweep for ANY web app (new or existing).
// Opens the app at phone / tablet / desktop sizes, clicks every visible control, and on every
// new screen/state it reaches checks: horizontal overflow, text < 11 px, clipped text, overlapping
// controls, touch targets < 44 px (touch sizes), low contrast, JS errors, axe-core (if installed).
// Saves one screenshot per unique state + report.json + report.md. Exit code 1 if any FAIL.
//
// Usage:
//   node ui-check.mjs --url <http://localhost:5173 | file:///abs/app.html> [options]
// Options:
//   --out <dir>          output folder (default ./ui-check-out)
//   --sizes <list>       default 390x844,800x1280,1280x800,1440x900
//   --routes <list>      extra start pages, comma list of paths or #hashes (default: just --url)
//   --max-clicks <n>     max controls clicked per size and route (default 150)
//   --depth <n>          click levels: 1 = start screen only, 2 = also inside menus/panels it opens (default 2)
//   --wait <ms>          wait after load (default 1500) and after each click (default 300 = --click-wait)
//   --reset <mode>       how to get back after each click: escape | reload (default escape; reload every 15)
//   --skip <regex>       control text to never click (default: delete|remove|logout|sign out|reset all|clear all|format)
//   --scope <css>        only click controls inside this element
//   --init <file.js>     JS run before page scripts (e.g. set localStorage theme/login)
//   --min-font <px>      default 11      --min-target <px>  default 44
//   --chromium <path>    browser path (default: Playwright's own; /opt/pw-browsers/... auto-detected)
// Needs: playwright (npm i -D playwright). Optional: axe-core (npm i -D axe-core) for the a11y scan.

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(path.join(process.cwd(), 'x.js'));

const A = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (k.startsWith('--')) A[k.slice(2)] = process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] == null ? true : process.argv[++i];
}
if (!A.url) { console.error('Missing --url. See header of ui-check.mjs'); process.exit(2); }
const OUT = path.resolve(A.out || 'ui-check-out');
const SIZES = (A.sizes || '390x844,800x1280,1280x800,1440x900').split(',').map(s => s.split('x').map(Number));
const ROUTES = A.routes ? A.routes.split(',') : [''];
const MAXC = +(A['max-clicks'] || 150), WAIT = +(A.wait || 1500), CW = +(A['click-wait'] || 300);
const DEPTH = +(A.depth || 2);
const MINF = +(A['min-font'] || 11), MINT = +(A['min-target'] || 44);
const SKIP = new RegExp(A.skip || 'delete|remove|log ?out|sign ?out|reset all|clear all|format|uninstall|factory', 'i');
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

let pw;
try { pw = require('playwright'); } catch { try { pw = await import('playwright'); } catch { console.error('Playwright not found: npm i -D playwright'); process.exit(2); } }
let axeSrc = null;
try { axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch {}
const exe = A.chromium || ['/opt/pw-browsers/chromium/chrome-linux/chrome'].find(p => fs.existsSync(p));
const browser = await pw.chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] });
const initJs = A.init ? fs.readFileSync(A.init, 'utf8') : null;

// ---------- in-page checks (run on every state) ----------
function pageChecks({ MINF, MINT, touch }) {
  const vw = innerWidth, vh = innerHeight, F = [];
  const nm = e => {
    const t = (e.getAttribute('aria-label') || e.textContent || e.value || e.title || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + (t ? ' "' + t + '"' : '');
  };
  const shown = e => {
    const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    if (!(r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw)) return false;
    const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), y = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t) || t.contains(e));
  };
  const lum = c => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a] = m.map(Number); if (a === 0) return null; const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return { L: .2126 * f(r) + .7152 * f(g) + .0722 * f(b), a: a == null ? 1 : a }; };
  const bgOf = e => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const l = lum(getComputedStyle(n).backgroundColor); if (l && l.a > .5) return l.L; } const l = lum(getComputedStyle(document.body).backgroundColor); return l ? l.L : 1; };
  // 1. page-level horizontal overflow
  const sw = document.documentElement.scrollWidth;
  if (sw > vw + 1) F.push({ check: 'overflow-x', sev: 'FAIL', detail: `page is ${sw}px wide in a ${vw}px screen` });
  // 2. text checks
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg,canvas,script,style,noscript')) continue;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!shown(e)) continue;
    const cs = getComputedStyle(e), fs = parseFloat(cs.fontSize), r = e.getBoundingClientRect();
    if (fs >= 1 && fs < MINF) F.push({ check: 'small-text', sev: 'FAIL', detail: `${fs}px`, el: nm(e) });
    if (e.scrollWidth > e.clientWidth + 2 && /hidden|clip/.test(cs.overflowX) && cs.textOverflow !== 'ellipsis') F.push({ check: 'clipped-text', sev: 'FAIL', detail: `${e.scrollWidth}>${e.clientWidth}px`, el: nm(e) });
    else if (e.scrollWidth > e.clientWidth + 2 && cs.textOverflow === 'ellipsis' && !e.title) F.push({ check: 'truncated-no-tooltip', sev: 'WARN', detail: 'cut with … and no title', el: nm(e) });
    if (r.right > vw + 1 || r.left < -1) F.push({ check: 'offscreen-text', sev: 'FAIL', detail: `${Math.round(r.left)}..${Math.round(r.right)} of ${vw}`, el: nm(e) });
    const fg = lum(cs.color); if (fg && !e.closest('[disabled],[aria-disabled=true]')) {
      const bg = bgOf(e), cr = (Math.max(fg.L, bg) + .05) / (Math.min(fg.L, bg) + .05), big = fs >= 18.66 || (fs >= 14 && +cs.fontWeight >= 700);
      if (cr < (big ? 3 : 4.5)) F.push({ check: 'contrast', sev: 'FAIL', detail: cr.toFixed(2) + ':1', el: nm(e) });
    }
  }
  // 3. controls: overlap + touch target
  const C = [...document.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=switch],[role=checkbox]')].filter(shown).map(e => [e, e.getBoundingClientRect()]);
  for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
    const [a, ra] = C[i], [b, rb] = C[j]; if (a.contains(b) || b.contains(a)) continue;
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 2 && oy > 2) F.push({ check: 'overlap', sev: 'FAIL', detail: `${Math.round(ox)}x${Math.round(oy)}px`, el: nm(a) + '  ×  ' + nm(b) });
  }
  if (touch) for (const [e, r] of C) {
    if (/^(checkbox|radio|range)$/.test(e.type) && e.closest('label')) continue;
    if (e.tagName === 'A' && getComputedStyle(e).display === 'inline') continue; // links inside text
    if (r.width < MINT || r.height < MINT) F.push({ check: 'touch-target', sev: 'FAIL', detail: `${Math.round(r.width)}x${Math.round(r.height)} < ${MINT}`, el: nm(e) });
  }
  // 4. controls with no accessible name
  for (const [e] of C) if (!(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || (e.textContent || '').trim() || e.value || e.placeholder || (e.labels && e.labels.length))) F.push({ check: 'no-name', sev: 'FAIL', detail: 'control has no label', el: nm(e) });
  return F;
}

// signature of the visible state, to screenshot/check each unique state only once
function stateSig() {
  const parts = [location.pathname + location.hash];
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('svg,canvas')) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
    if (/^(H1|H2|H3|BUTTON|DIALOG|NAV|HEADER|SECTION|ASIDE)$/.test(e.tagName) || e.getAttribute('role') || e.getAttribute('aria-expanded') === 'true') parts.push(e.tagName + (e.id || '') + (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : '') + (e.tagName[0] === 'H' ? e.textContent.trim().slice(0, 30) : '') + (e.getAttribute('aria-selected') || e.getAttribute('aria-pressed') || ''));
  }
  let h = 0; const s = parts.join('|'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36);
}

// list of clickable controls, as stable selectors
function listControls(scope) {
  const root = scope ? document.querySelector(scope) || document.body : document.body;
  const sel = 'button,a[href],[role=button],[role=tab],[role=menuitem],[role=switch],[role=checkbox],input[type=checkbox],input[type=radio],summary,select,[onclick],[tabindex="0"]';
  const vw = innerWidth, vh = innerHeight, out = [];
  const path = e => { const p = []; for (let n = e; n && n !== document.body; n = n.parentElement) { if (n.id && !/\d{4,}/.test(n.id)) { p.unshift('#' + CSS.escape(n.id)); break; } const i = [...n.parentElement.children].indexOf(n) + 1; p.unshift(n.tagName.toLowerCase() + ':nth-child(' + i + ')'); } return p.join(' > '); };
  for (const e of root.querySelectorAll(sel)) {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || e.disabled) continue;
    if (r.bottom < 0 || r.right < 0 || r.top > vh || r.left > vw) continue;
    const t = (e.getAttribute('aria-label') || e.textContent || e.title || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    out.push({ sel: path(e), text: t, tag: e.tagName.toLowerCase(), target: e.getAttribute('target') || '' });
  }
  return out;
}

const results = { url: A.url, when: new Date().toISOString(), axe: !!axeSrc, sizes: [] };
let shotN = 0, anyFail = false;

for (const [W, H] of SIZES) {
  const touch = W <= 1024;
  const tag = `${W}x${H}`;
  const S = { size: tag, touch, states: [], clicks: [], jsErrors: [], netErrors: [], dead: [] };
  results.sizes.push(S);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: W < 600, deviceScaleFactor: 1 });
  if (initJs) await ctx.addInitScript(initJs);
  const page = await ctx.newPage();
  page.on('pageerror', e => S.jsErrors.push({ msg: e.message.split('\n')[0], after: S._last || 'load' }));
  page.on('console', m => { if (m.type() === 'error' && /Failed to load resource|ERR_(TUNNEL|INTERNET|NAME|CONNECTION|PROXY)/.test(m.text())) S.netErrors.push(m.text().slice(0, 160)); else if (m.type() === 'error') S.jsErrors.push({ msg: 'console: ' + m.text().slice(0, 200), after: S._last || 'load' }); });
  page.on('dialog', d => d.dismiss().catch(() => {}));
  const seen = new Set();
  const capture = async (label) => {
    const sig = await page.evaluate(stateSig).catch(() => null);
    if (!sig || seen.has(sig)) return false;
    seen.add(sig);
    const f = path.join('shots', `${tag}-${String(++shotN).padStart(3, '0')}-${label.replace(/[^\w-]+/g, '_').slice(0, 40)}.png`);
    await page.screenshot({ path: path.join(OUT, f) }).catch(() => {});
    const findings = await page.evaluate(pageChecks, { MINF, MINT, touch }).catch(e => [{ check: 'checks-crashed', sev: 'WARN', detail: e.message }]);
    let axe = null;
    if (axeSrc) {
      axe = await page.evaluate(async src => { if (!window.axe) (0, eval)(src); const r = await window.axe.run(document, { resultTypes: ['violations'] }); return r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, el: v.nodes.slice(0, 3).map(n => n.target.join(' ')) })); }, axeSrc).catch(e => [{ id: 'axe-crashed', impact: 'n/a', n: 0, help: e.message.slice(0, 120) }]);
    }
    S.states.push({ label, shot: f, findings, axe });
    return true;
  };
  const clickOne = async (c, start) => {
    // returns { res, newState }
    if (SKIP.test(c.text)) return { res: 'skipped (risky text)' };
    if (c.target === '_blank') return { res: 'skipped (opens new tab)' };
    S._last = `click "${c.text}"`;
    const before = await page.evaluate(() => { window.__mut = 0; if (!window.__mo) { window.__mo = new MutationObserver(m => window.__mut += m.length); window.__mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); } return location.href; }).catch(() => null);
    const errN = S.jsErrors.length;
    try {
      const loc = page.locator(c.sel).first();
      if (c.tag === 'select') { const n = await loc.evaluate(e => e.options.length); if (n > 1) await loc.selectOption({ index: 1 }); }
      else await loc.click({ timeout: 2000 });
      await page.waitForTimeout(CW);
      const after = await page.evaluate(() => ({ mut: window.__mut || 0, href: location.href })).catch(() => ({ mut: 1, href: '' }));
      let res = 'ok';
      if (S.jsErrors.length > errN) res = 'JS ERROR';
      else if (!after.mut && after.href === before) { res = 'no visible change'; S.dead.push(c); }
      if (after.href && new URL(after.href).origin !== new URL(start).origin) return { res: 'left the app', left: true };
      const isNew = await capture(c.text || c.tag);
      return { res: res + (isNew ? ' (new state checked)' : ''), newState: isNew };
    } catch (e) { return { res: 'could not click: ' + e.message.split('\n')[0].slice(0, 80) }; }
  };
  for (const route of ROUTES) {
    const start = route ? new URL(route, A.url).href : A.url;
    const load = async () => { await page.goto(start, { waitUntil: 'load' }); await page.waitForTimeout(WAIT); };
    const replay = async (p) => { await load(); for (const c of p) { await page.locator(c.sel).first().click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(CW); } };
    await load(); S._last = 'load ' + (route || '/');
    await capture('start' + (route ? '-' + route : ''));
    // breadth-first walk: level 0 = controls on the start screen; level 1+ = controls that appear
    // only after a click (menus, panels, tabs, dialogs). Each reached by replaying its click path.
    const done = new Set(); let budget = MAXC;
    const queue = [[]];
    while (queue.length && budget > 0) {
      const p = queue.shift();
      if (p.length) await replay(p);
      const controls = await page.evaluate(listControls, A.scope || null);
      const todo = controls.filter(c => !done.has(c.sel + '|' + c.text));
      todo.forEach(c => done.add(c.sel + '|' + c.text));
      let sinceReload = 0;
      for (const c of todo) {
        if (budget-- <= 0) break;
        const r = await clickOne(c, start);
        S.clicks.push({ ...c, level: p.length, path: p.map(x => x.text).join(' > '), result: r.res });
        if (r.newState && p.length + 1 < DEPTH) queue.push([...p, c]);
        // back to the screen this level started from
        if (r.left || A.reset === 'reload' || ++sinceReload >= 15 || p.length) { await replay(p); sinceReload = 0; }
        else { await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(80); if (new URL(page.url()).pathname !== new URL(start).pathname) await replay(p); }
      }
    }
    if (budget <= 0) S.budgetHit = true;
  }
  delete S._last;
  await ctx.close();
}
await browser.close();

// ---------- report ----------
// Same element + same check seen in several states counts once (first state where it was seen).
const md = [`# UI check — ${results.url}`, `When: ${results.when}  |  axe-core: ${results.axe ? 'ON' : 'NOT INSTALLED (a11y scan NOT VERIFIED)'}`, ''];
const totals = {};
for (const S of results.sizes) {
  const uniq = new Map();
  for (const st of S.states) {
    for (const f of st.findings) if (f.sev === 'FAIL') { const k = f.check + '|' + (f.el || f.detail); if (!uniq.has(k)) uniq.set(k, { ...f, state: st.label, shot: st.shot }); }
    for (const v of st.axe || []) { const k = 'axe-' + v.id + '|' + (v.el || []).join(','); if (!uniq.has(k)) uniq.set(k, { check: 'axe ' + v.impact + ' ' + v.id, el: (v.el || []).join(', '), detail: v.help, state: st.label, shot: st.shot }); }
  }
  const issues = [...uniq.values()];
  const byCheck = {}; for (const f of issues) byCheck[f.check] = (byCheck[f.check] || 0) + 1;
  for (const [k, v] of Object.entries(byCheck)) totals[k] = (totals[k] || 0) + v;
  const clicked = S.clicks.filter(c => !/^skipped/.test(c.result)).length;
  const bad = issues.length + S.jsErrors.length;
  S.uniqueIssues = issues;
  if (bad) anyFail = true;
  md.push(`## ${S.size}${S.touch ? ' (touch)' : ''} — ${bad ? 'FAIL' : 'PASS'}`,
    `- States checked: ${S.states.length} | controls clicked: ${clicked} (levels 0-${Math.max(0, ...S.clicks.map(c => c.level || 0))}) | skipped: ${S.clicks.length - clicked} | no visible change: ${S.dead.length} | JS errors: ${S.jsErrors.length} | network errors (not app bugs if offline): ${S.netErrors.length}${S.budgetHit ? ' | click budget reached, raise --max-clicks' : ''}`,
    `- Unique failures by check: ${Object.entries(byCheck).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  const jsU = [...new Map(S.jsErrors.map(e => [e.msg, e])).values()];
  for (const e of jsU.slice(0, 10)) md.push(`  - JS error after ${e.after}: ${e.msg}`);
  const grp = {}; for (const x of issues) (grp[x.check] ||= []).push(x);
  for (const [k, xs] of Object.entries(grp)) {
    md.push(`### ${k} (${xs.length})`);
    for (const x of xs.slice(0, 12)) md.push(`- ${x.el || ''} — ${x.detail} — first seen in "${x.state}" (${x.shot})`);
    if (xs.length > 12) md.push(`- … ${xs.length - 12} more in report.json`);
  }
  if (S.dead.length) md.push(`### Controls with no visible change (check by eye, may be dead)`, S.dead.slice(0, 20).map(c => `"${c.text}"`).join(', '));
  md.push('', `States and screenshots: ${S.states.map(s => `${s.label} (${s.shot})`).join('; ')}`, '');
}
md.splice(2, 0, `**Overall: ${anyFail ? 'FAIL' : 'PASS'}** — unique failures: ${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`, '');
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 1));
fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n'));
console.log(md.slice(0, 4).join('\n'));
for (const S of results.sizes) console.log(`${S.size}: states ${S.states.length}, clicks ${S.clicks.length}, unique issues ${S.uniqueIssues.length}, JS errors ${S.jsErrors.length}`);
console.log('Report:', path.join(OUT, 'report.md'));
process.exit(anyFail ? 1 : 0);
