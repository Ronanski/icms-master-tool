// Layout check of one page of the mockup in a headless browser: words over words, words over a pipe, words over a symbol of
// another item, words outside the drawing, page errors. 0 of each is the rule. Also saves a picture of the page.
// Usage: node docs/hmi/hx/tools/check-layout.js <mockup.html> <pageId> <outdir> [dark|light] [width] [height]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [, , file, id, out, scheme, w, h] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: +w || 1900, height: +h || 1200 },
    deviceScaleFactor: 1.5,
    colorScheme: scheme || 'dark'
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => {
    if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text());
  });
  fs.mkdirSync(out, { recursive: true });
  const wrap = path.join(out, '_check.html');
  fs.writeFileSync(
    wrap,
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">' +
      fs.readFileSync(file, 'utf8') +
      '</body></html>'
  );
  await p.goto('file://' + path.resolve(wrap) + '#' + id);
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => {
    const sv = document.querySelector('.hx-process svg');
    const m = sv.getScreenCTM();
    const vb = sv.viewBox.baseVal;
    const B = e => {
      const q = e.getBoundingClientRect();
      return { x: (q.x - m.e) / m.a, y: (q.y - m.f) / m.d, w: q.width / m.a, h: q.height / m.d };
    };
    const T = [...sv.querySelectorAll('text')]
      .filter(t => t.getBBox().width > 0 && getComputedStyle(t.closest('.hx-yn') || t).display !== 'none')
      .map(t => Object.assign(B(t), { s: t.textContent.trim().slice(0, 28), g: t.closest('.hx-node,.hx-link') }));
    const tt = [];
    for (let i = 0; i < T.length; i++)
      for (let j = i + 1; j < T.length; j++) {
        const a = T[i],
          c = T[j];
        if (a.g && a.g === c.g) continue;
        const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x),
          oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (ox > 1.5 && oy > 2.5) tt.push(a.s + ' × ' + c.s);
      }
    const tp = [];
    for (const ph of sv.querySelectorAll('path.hx-ln,path.rx-pb,path.hx-sig')) {
      const L = ph.getTotalLength();
      for (let d = 0; d <= L; d += 3) {
        const q = ph.getPointAtLength(d);
        for (const t of T)
          if (q.x > t.x + 1 && q.x < t.x + t.w - 1 && q.y > t.y + 2 && q.y < t.y + t.h - 2) {
            if (!tp.some(z => z.startsWith(t.s + ' @'))) tp.push(t.s + ' @' + Math.round(q.x) + ',' + Math.round(q.y));
          }
      }
    }
    const ts = [];
    for (const n of sv.querySelectorAll('.hx-node')) {
      const sh = [...n.querySelectorAll('.hxo,.hxn,.hxk,.rxs,.rxfr,.rxscr')];
      if (!sh.length) continue;
      let x0 = 1e9,
        y0 = 1e9,
        x1 = -1e9,
        y1 = -1e9;
      for (const e of sh) {
        const q = B(e);
        x0 = Math.min(x0, q.x);
        y0 = Math.min(y0, q.y);
        x1 = Math.max(x1, q.x + q.w);
        y1 = Math.max(y1, q.y + q.h);
      }
      for (const t of T) {
        if (t.g === n) continue;
        const ox = Math.min(t.x + t.w, x1) - Math.max(t.x, x0),
          oy = Math.min(t.y + t.h, y1) - Math.max(t.y, y0);
        if (ox > 1.5 && oy > 2.5)
          ts.push(
            t.s +
              ' on ' +
              (n.getAttribute('aria-label') || n.dataset.open || 'symbol') +
              '@' +
              Math.round(x0) +
              ',' +
              Math.round(y0)
          );
      }
    }
    const off = T.filter(t => t.x < 0 || t.x + t.w > vb.width || t.y < 0 || t.y + t.h > vb.height).map(t => t.s);
    return { tt, tp, ts, off, n: T.length, nodes: sv.querySelectorAll('*').length };
  });
  console.log('page', id, scheme || 'dark', '· words', r.n, '· svg elements', r.nodes);
  console.log('WORDS OVER WORDS', r.tt.length, JSON.stringify(r.tt));
  console.log('WORDS OVER A PIPE', r.tp.length, JSON.stringify(r.tp));
  console.log('WORDS OVER A SYMBOL', r.ts.length, JSON.stringify(r.ts));
  console.log('OUTSIDE THE DRAWING', JSON.stringify(r.off));
  console.log('PAGE ERRORS', errs.join(' | ') || 'none');
  await (await p.$('.hx-page')).screenshot({ path: path.join(out, id + '-' + (scheme || 'dark') + '.png') });
  await b.close();
  process.exit(r.tt.length + r.tp.length + r.ts.length + r.off.length + errs.length ? 2 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
