// The Worker TEST SET (3.2.0 Web Worker), one checkpoint: run one after the other (never two at a time, one browser at a time), a
// table at the end (PASS / FAIL and the time of each).
// 1. node, no html: eng_radio, eng_radio_winter, eng_radio_giselle, eng_radio_ningning;
// 2. browser (headless shell, env PLAYWRIGHT_MODULE / CHROMIUM as the other tests): eng_worker, eng_world, reset_clean, reset_worker, ditl_sim;
// 3. the Training opens, local and ?worker=1: lsSetTab('training'), no page error (the dock tabFix may move the tab to 'logic': the
//    same in both modes).
// No full start-up, no Training suite (user). The PC rule (team-files/TEST_LOCK_RULE.md): before the set the CPU must be below 60 % and
// team-files/TEST_LOCK must not exist; the set writes the lock while it runs and removes it at the end (also on a failure or Ctrl+C).
// Usage: node tests/regress/eng_set.js [html] [--no-lock] [--only name,name]
const fs = require('fs'), path = require('path'), url = require('url'), os = require('os');
const { spawnSync, execSync } = require('child_process');
const arg = process.argv.slice(2);
const html = path.resolve(arg.find(a => /\.html$/.test(a)) || 'dist/' + fs.readdirSync('dist').find(x => /^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
const only = arg.includes('--only') ? arg[arg.indexOf('--only') + 1].split(',') : null;
const R = path.join(__dirname);
/* the lock: team-files/TEST_LOCK next to the repo (the first parent folder that has team-files) */
const lockFile = (() => {
  if (process.env.TEST_LOCK) return process.env.TEST_LOCK;
  for (let d = path.resolve(__dirname, '..', '..'); d !== path.dirname(d); d = path.dirname(d))
    if (fs.existsSync(path.join(d, 'team-files'))) return path.join(d, 'team-files', 'TEST_LOCK');
  return null;
})();
const cpu = () => {
  try {
    return +execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average"', { encoding: 'utf8' }).trim();
  } catch (e) {
    return null;
  }
};
let locked = false;
const unlock = () => {
  if (locked && lockFile)
    try {
      fs.unlinkSync(lockFile);
    } catch (e) {}
  locked = false;
};
process.on('exit', unlock);
process.on('SIGINT', () => (unlock(), process.exit(130)));
if (!arg.includes('--no-lock')) {
  if (lockFile && fs.existsSync(lockFile)) {
    console.log('NOT STARTED: the lock is there (' + lockFile + '):\n' + fs.readFileSync(lockFile, 'utf8') + '\nTry again in 3 minutes.');
    process.exit(2);
  }
  const c = os.platform() === 'win32' ? cpu() : null;
  if (c != null && c >= 60) {
    console.log('NOT STARTED: CPU ' + c + ' % (must be below 60). Try again in 3 minutes.');
    process.exit(2);
  }
  if (lockFile) {
    fs.writeFileSync(lockFile, 'eng_set.js (Winter) ' + new Date().toISOString() + ' pid ' + process.pid + '\nnode tests/regress/eng_set.js ' + arg.join(' ') + '\n');
    locked = true;
  }
  console.log('CPU ' + c + ' % · lock ' + (lockFile || 'none'));
}
console.log('html ' + html);
/* one test file as a child process: PASS = exit 0 */
const T = [];
const node = (name, args, ms) => {
  if (only && !only.includes(name)) return;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(R, name + '.js'), ...args], { encoding: 'utf8', timeout: ms || 900000, env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0;
  const fails = out.split(/\r?\n/).filter(l => /^FAIL|ERROR|Error:/.test(l)).slice(0, 4);
  T.push({ name, ok, s: (Date.now() - t0) / 1000, why: ok ? '' : r.error ? String(r.error.message) : fails.join(' | ') || 'exit ' + r.status });
  /* a child that fails at once says why: the spawn error, the exit code, its last lines */
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)' + (ok ? '' : '\n  ' + (r.error ? 'spawn: ' + r.error.message + ' · ' : '') + 'exit ' + r.status + (r.signal ? ' signal ' + r.signal : '') + '\n' + out.split(/\r?\n/).filter(Boolean).slice(-12).join('\n')));
};
/* the Training opens (local, then ?worker=1), one browser each, one after the other */
async function training(worker) {
  const name = 'train_open' + (worker ? '_worker' : '_local');
  if (only && !only.includes(name) && !only.includes('train_open')) return;
  const t0 = Date.now();
  let ok = false,
    why = '';
  /* a browser that does not start is a FAIL of this line, not a crash of the set */
  let b = null;
  try {
    const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
    b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
    const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e.message)));
    await p.addInitScript(() => { window.LS_PVWIN = false; window.open = () => null; });
    await p.goto(url.pathToFileURL(html).href + (worker ? '?worker=1' : ''));
    await p.waitForTimeout(2500);
    await p.evaluate(() => AN.setCat('an'));
    await p.waitForFunction(() => window.AN && AN.sheets && AN.sheets.length >= 54, null, { timeout: 120000 });
    if (worker) await p.waitForFunction(() => window.ENG && (ENG.mode === 'mirror' || ENG.err), null, { timeout: 180000 });
    await p.evaluate(() => lsSetTab('training'));
    await p.waitForTimeout(4000);
    const st = await p.evaluate(() => ({ tab: document.body.dataset.tab || '', eng: window.ENG ? ENG.mode : '-', err: window.ENG && ENG.err ? String(ENG.err) : '', bar: !!document.getElementById('engerr'), dock: !!window.LS_DOCK, press: !!(window.WORLD && WORLD.dpress) }));
    ok = !errs.length && !st.err && !st.bar && st.dock && st.press && (!worker || st.eng === 'mirror');
    why = 'tab ' + st.tab + ', engine ' + st.eng + (st.err ? ', engine error ' + st.err : '') + (st.bar ? ', error bar' : '') + (st.dock ? '' : ', no dock') + (st.press ? '' : ', no WORLD.dpress') + (errs.length ? ', page errors: ' + errs.slice(0, 3).join(' | ') : ', no page error');
  } catch (e) {
    why = String(e.message).split('\n')[0];
  } finally {
    if (b) await b.close().catch(() => {});
  }
  T.push({ name, ok, s: (Date.now() - t0) / 1000, why: ok ? why : why });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s): ' + why);
}
(async () => {
  const t0 = Date.now();
  try {
    for (const n of ['eng_radio', 'eng_radio_winter', 'eng_radio_giselle', 'eng_radio_ningning']) node(n, []);
    for (const n of ['eng_worker', 'eng_world', 'reset_clean', 'reset_worker', 'ditl_sim']) node(n, [html]);
    await training(false);
    await training(true);
  } finally {
    unlock();
  }
  const w = Math.max(...T.map(x => x.name.length));
  console.log('\n== TEST SET ' + new Date().toISOString() + ' · ' + path.basename(html));
  for (const x of T) console.log((x.ok ? 'PASS ' : 'FAIL ') + x.name.padEnd(w) + ' ' + x.s.toFixed(0).padStart(4) + ' s' + (x.ok ? '' : '  ' + x.why));
  const nf = T.filter(x => !x.ok).length;
  console.log((nf ? 'FAILED ' + nf + ' of ' + T.length : 'ALL PASS ' + T.length) + ' · ' + ((Date.now() - t0) / 1000 / 60).toFixed(1) + ' min');
  process.exit(nf ? 1 : 0);
})();
