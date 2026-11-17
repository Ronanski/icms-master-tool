// Weight of one page of the mockup: SVG elements, running animations, main thread time over some seconds (headless Chromium).
// Budget of a page: under 1 500 SVG elements and under 10 % main thread. Usage: node docs/hmi/hx/tools/perf-page.js <mockup.html> <pageId> [seconds]
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const [, , file, id, secs] = process.argv;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const wrap = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'hxperf-')), 'p.html');
  fs.writeFileSync(
    wrap,
    '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">' +
      fs.readFileSync(file, 'utf8') +
      '</body></html>'
  );
  await p.goto('file://' + wrap + '#' + id);
  await p.waitForTimeout(2500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Performance.enable');
  const get = async () =>
    Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
  const a = await get();
  const T = +secs || 10;
  await p.waitForTimeout(T * 1000);
  const z = await get();
  const info = await p.evaluate(() => ({
    svgElements: document.querySelectorAll('.hx-process svg *').length,
    animations: document.getAnimations().length
  }));
  const d = k => (((z[k] - a[k]) / T) * 100).toFixed(1) + ' %';
  console.log(id, JSON.stringify(info), '· main thread busy', d('TaskDuration'), '· script', d('ScriptDuration'));
  await b.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
