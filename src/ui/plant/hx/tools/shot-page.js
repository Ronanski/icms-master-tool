// Picture of one page of the mockup, or of a part of its drawing (in drawing units), for looking at details.
// Usage: node docs/hmi/hx/tools/shot-page.js <mockup.html> <pageId> <out.png> [x0 y0 x1 y1] [dark|light] [scale]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const a = process.argv.slice(2);
const [file, id, out] = a;
const crop = a.length >= 7 && !isNaN(+a[3]) ? a.slice(3, 7).map(Number) : null;
const rest = a.slice(crop ? 7 : 3);
const scheme = rest[0] || 'dark';
const scale = +rest[1] || 2;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: 1900, height: 1200 },
    deviceScaleFactor: scale,
    colorScheme: scheme
  });
  const p = await ctx.newPage();
  const wrap = out.replace(/\.png$/, '') + '._wrap.html';
  fs.writeFileSync(
    wrap,
    '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">' +
      fs.readFileSync(file, 'utf8') +
      '</body></html>'
  );
  await p.goto('file://' + path.resolve(wrap) + '#' + id);
  await p.waitForTimeout(1800);
  if (crop) {
    const clip = await p.evaluate(([x0, y0, x1, y1]) => {
      const sv = document.querySelector('.hx-process svg');
      const m = sv.getScreenCTM();
      return { x: m.e + x0 * m.a, y: m.f + y0 * m.d + window.scrollY, width: (x1 - x0) * m.a, height: (y1 - y0) * m.d };
    }, crop);
    await p.screenshot({ path: out, clip, fullPage: true });
  } else await (await p.$('.hx-page')).screenshot({ path: out });
  fs.unlinkSync(wrap);
  await b.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
