// Test of the Plant Tools web app. Serve a folder that holds the app as /tools/ on port 8765, then: node docs/plant-tools/app-test.js [screenshot folder]
// Checks at PC and phone size: every page opens, the font is the bundled one, no sideways scroll, no script error, no request outside the app,
// home links open pages of the app, Tag Lookup opens the Signal Path Finder, the Workbench saves and keeps a record, and every page opens offline.
const { chromium } = require('playwright');
const B = process.env.APP_URL || 'http://localhost:8765/tools/';
const SHOTS = process.argv[2] || '';
const pages = ['index', 'tag-lookup', 'signal-path-finder', 'plant-workbench', 'connection-lessons', 'drum-swell-lab', 'breaker-lab', 'sync-lab', 'cv-demand-lab', 'transfer-lab', 'turbine-valves', 'gen-voltage-bc-flow', 'gen-voltage-bc-troubleshooter', 'ai-in-plant', 'gen-metering-hardware'];
(async () => {
  const b = await chromium.launch();
  let fail = 0;
  const say = (ok, m) => { if (!ok) { fail++; console.log('FAIL', m); } };
  for (const [w, h, tag] of [[1280, 800, 'pc'], [390, 844, 'phone']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: tag === 'phone' });
    const p = await ctx.newPage();
    const errs = [], ext = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('request', (r) => { const u = r.url(); if (!u.startsWith(B) && !u.startsWith('data:') && !u.startsWith('blob:')) ext.push(u); });
    for (const n of pages) {
      await p.goto(B + n + '.html', { waitUntil: 'load' });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ font: document.fonts.check('500 14px "IBM Plex Sans"'), over: document.documentElement.scrollWidth > innerWidth + 1, bar: !!document.querySelector('.appbar a') || /index\.html$/.test(location.pathname), moji: /Ã|â€/.test(document.body.innerText), txt: document.body.innerText.length }));
      say(r.font && !r.over && r.bar && !r.moji && r.txt > 200, tag + ' ' + n + ' ' + JSON.stringify(r));
      if (SHOTS && ['index', 'tag-lookup', 'drum-swell-lab'].includes(n)) await p.screenshot({ path: SHOTS + '/' + tag + '-' + n + '.png' });
    }
    await p.goto(B + 'index.html');
    const links = await p.$$eval('a[href]', (a) => a.map((x) => x.getAttribute('href')));
    const inapp = [...new Set(links.filter((l) => /^[a-z0-9-]+\.html/.test(l)))];
    console.log(tag, 'home links in the app:', inapp.length, '| outside:', links.filter((l) => /^http/.test(l)).join(' ') || 'none');
    for (const l of inapp) { const r = await p.request.get(B + l.split('#')[0]); say(r.ok(), 'link ' + l); }
    await p.click('a[href^="tag-lookup.html"]');
    await p.waitForLoadState();
    say(p.url().includes('tag-lookup.html'), 'home to Tag Lookup ' + p.url());
    await p.click('.appbar a');
    await p.waitForLoadState();
    say(/tools\/(index\.html)?$/.test(p.url()), 'app bar back to home ' + p.url());
    // Workbench: save one shift log entry, reload, it is still there
    await p.goto(B + 'plant-workbench.html');
    await p.waitForTimeout(600);
    const st = await p.evaluate(() => ({ state: document.getElementById('state') && !document.getElementById('state').hidden ? document.getElementById('state').textContent : '', backup: /Save backup file/.test(document.body.innerText) }));
    say(!st.state && st.backup, tag + ' workbench state ' + JSON.stringify(st));
    await p.evaluate(async () => { await save('shiftlog', null, { text: 'APP TEST ENTRY', shift: 'Day' }); });
    await p.reload();
    await p.waitForTimeout(600);
    const kept = await p.evaluate(() => (DATA.shiftlog || []).filter((x) => x.text === 'APP TEST ENTRY').length);
    say(kept === 1, tag + ' workbench record kept after reload: ' + kept);
    const exp = await p.evaluate(() => Object.keys(plantToolsLocalDb.exportAll()));
    say(exp.includes('shiftlog'), tag + ' backup holds the shift log ' + exp);
    if (SHOTS) await p.screenshot({ path: SHOTS + '/' + tag + '-plant-workbench.png' });
    // Tag Lookup: open a card, then its Signal Path Finder link
    await p.goto(B + 'tag-lookup.html#AI0128-101');
    await p.waitForTimeout(600);
    const fl = await p.$('a[href^="signal-path-finder.html"]');
    say(!!fl, tag + ' Signal Path Finder link on the card');
    console.log(tag, 'assistant box hidden:', await p.evaluate(() => { const a = document.getElementById('askbox'); return a ? a.hidden : null; }));
    if (fl) { await fl.click(); await p.waitForLoadState(); await p.waitForTimeout(900); say(p.url().includes('signal-path-finder.html'), 'finder opened ' + p.url()); if (SHOTS) await p.screenshot({ path: SHOTS + '/' + tag + '-finder.png' }); }
    console.log(tag, 'script errors:', errs.length, errs.slice(0, 3).join(' | '), '| requests outside the app:', [...new Set(ext)].join(' ') || 'none');
    say(!errs.length && !ext.length, tag + ' errors or outside requests');
    // offline
    await p.goto(B + 'index.html');
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForTimeout(2500);
    await ctx.setOffline(true);
    let off = 0;
    for (const n of pages) {
      let ok = true;
      try { await p.goto(B + n + '.html', { waitUntil: 'load', timeout: 8000 }); ok = (await p.evaluate(() => document.body.innerText.length)) > 200 && (await p.evaluate(() => document.fonts.check('500 14px "IBM Plex Sans"'))); } catch (e) { ok = false; }
      say(ok, tag + ' offline ' + n);
      if (ok) off++;
    }
    console.log(tag, 'pages that open offline:', off, 'of', pages.length);
    await ctx.setOffline(false);
    await ctx.close();
  }
  await b.close();
  console.log(fail ? 'FAILS ' + fail : 'ALL OK');
  process.exit(fail ? 1 : 0);
})();
