// INSTRUMENT / VALVE COVERAGE (roadmap pre-work for steps 3-4, HMI and Library step 8; list / analysis only, the app is not changed).
// Every item of the Over-all Instrument List (document-references/over-all-instrument-list.xlsx) and every AO / valve of the DCS I/O
// list is matched against: the I/O list (address), the ABC and DITL drawings (text of the sheets), the PLANT MODEL as it really runs
// (the real engine in Node: what the unit model writes after Start Cold, the loop models of plant.js, the sources of source.js), the
// Training (src/ui/training, src/ui/uat/check.js) and the start-up procedure PR-OPE-5002.
// Usage: python3 tools/data/instrument_list.py <tmp>/il.json && node tools/data/instrument_coverage.js <tmp>/il.json <outdir>
// Output: <outdir>/instrument-coverage.csv (one row per item) and <outdir>/coverage-tables.md (tables for the report).
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  cp = require('child_process');
const root = path.resolve(__dirname, '..', '..');
const { loadEngine } = require(path.join(root, 'tools', 'engine', 'node-engine.js'));
const [ilFile, outDir] = process.argv.slice(2);
if (!ilFile || !outDir) {
  console.log('usage: node tools/data/instrument_coverage.js <il.json> <outdir>');
  process.exit(1);
}
/* flow diagram drawing list (document-references/flow-diagram-K1AU3-A1-0-001.zip, RA pages 2 ~ 4) */
const PD = {
  '010': 'Symbol & legend', '011': 'Main steam', '012': 'Cold / hot reheat steam', '013': 'Extraction steam',
  '014': 'Aux steam, packing steam, condenser air removal', '015': 'Steam sootblowing', '016': 'Condensate', '017': 'Feedwater',
  '018': 'Heater vent and drain', '019': 'Boiler vent and drain', '020': 'Seawater', '021': 'Aux cooling water', '022': 'Diesel oil',
  '023': 'Compressed air', '024': 'Make-up water', '025': 'Industry water', '026': 'Potable water', '027': 'Misc. vents and drains',
  '028': 'Steam blow-out', '040': 'Waste water pump', '041': 'Sanitary waste water', '042': 'Chemical dosing', '043': 'Hypo-chlorinate dosing',
  '044': 'Sampling & analyzing', '045': 'Demineralized water', '046': 'Waste water treatment', '047': 'Condenser polisher',
  '051': 'Combustion air / flue gas', '052': 'Primary air', '053': 'Secondary air', '054': 'Fluidizing air', '061': 'Coal firing',
  '062': 'Limestone feed', '063': 'Sand feed', '071': 'Bottom ash transfer and silo', '072': 'Bottom ash cooler', '073': 'Fly ash handling',
  '074': 'ESP'
};
const sysOf = pd => {
  const m = /PD-?0?(\d{2,3})/.exec(pd || '');
  if (!m) return '';
  const k = m[1].padStart(3, '0');
  return 'PD-' + k + ' ' + (PD[k] || '');
};
/* the controllers whose MV the UNIT MODEL uses in its physics (read in src/analog/engine/unit.js anUnitStart / anUnitStep and tcs.js) */
const PHYS_CTL = {
  FICCL1061A: 'coal feeder A feedrate -> firing (U.fuel)', FICCL1061B: 'coal feeder B feedrate -> firing', FICCL1061C: 'coal feeder C feedrate -> firing',
  FICDO1043A: 'oil burner A flow -> firing (U.oilN)', FICDO1043B: 'oil burner B flow -> firing', FICDO1043C: 'oil burner C flow -> firing', FICDO1043D: 'oil burner D flow -> firing',
  FICFA1071: 'PA flow, 0 when PAF stopped (U.mul) -> O2, bed', FICFA1081: 'SA flow, 0 when SAF stopped (U.mul) -> O2',
  PICFG108: 'furnace pressure: IDF hydraulic coupling (U.fp)', PICFG108A: 'furnace pressure: IDF inlet damper (U.fp)',
  LICBR1001: 'drum level integrates feedwater in minus steam out (plant.js pr.integ)',
  FICFW1007: 'feedwater flow, 0 with no BFWP (U.mul) -> drum level', LICBR1001A: 'drum level 3-element, same valve as FICFW1007',
  LICBR1001B: 'start-up feedwater valve, added to the feedwater flow (U.suv)', TICBR1130: 'SH no.1 spray vs load (U.ld, U.sh)',
  TICBR1150: 'SH no.2 spray vs load (U.ld, U.sh)', TICBR1140: 'SH no.2 outlet = spray 1 outlet + pickup (U.sh)',
  TICMS1004: 'finishing SH outlet = spray 2 outlet + pickup (U.sh), ATS steam (tcs.js)', TICHR1002: 'RH spray vs load (U.ld)', PICMS1006: 'HP bypass: main steam -> cold reheat (U.vlv)',
  PICMS1002: 'main steam blow-off (U.vlv)', PICHR1003: 'LP bypass out of the hot reheat (U.lpv)', PICHR1391: 'RH blow-off MOV (U.rhbv)'
};
/* other plant-model ties found in the code (not a controller): tag fragment -> evidence */
const PHYS_OTHER = {
  'AS1391': 'TCS panel switch "aux steam from the main steam" (tcs.js tc.asv), not the DCS MOV',
  'AV1391': 'TCS panel switch "vacuum breaker" (tcs.js tc.vb), not the DCS MOV',
  'CD1904': 'TCS panel switch "LP exhaust hood spray" (tcs.js tc.hsp)'
};
/* burner fuel oil shut-off valves: the ABC drawing gates the oil flow PV with "SUPPLY OIL VALVE (1)(2) CLOSE" from the DITL (ABC-003A ~ D
   M.3410 / 3411 / 3416 / 3417, unit.js U.oilN), so a closed valve gives no oil to the firing */
for (const b of 'ABCD') for (const n of '12') PHYS_OTHER['DO1043-' + b + n] = 'oil flow PV gated by the DITL "supply oil valve close" (ABC-003' + b + ' M.341x) -> firing';
/* the TCS digital inputs the unit model writes (unit.js U.di, U.trip): station + address */
const TCS_DI = new Set(['S2 I.0931', 'S2 I.0932', 'S2 I.0418', 'S2 I.0400', 'S2 I.0937', 'S1 I.0081', 'S1 I.0082']);
const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* loop number of a tag (PCV-MS1020 -> MS1020, FCV-FW1130-1 -> FW1130-1) and the spellings of it in the DCS (FW1130-1, FW11301) */
const loopOf = tag => {
  const t = String(tag || '').toUpperCase().replace(/\s+/g, '');
  const m = /^[A-Z0-9_]*?-?([A-Z]{1,3}\d{3,4}(?:-?[A-Z0-9]{1,3})*)$/.exec(t) || /([A-Z]{2}\d{4}[A-Z0-9-]*)/.exec(t);
  return m ? m[1] : t;
};
const baseOf = loop => (/^([A-Z]{1,3}\d{3,4})/.exec(loop) || [, loop])[1];
const variants = loop => [...new Set([loop, loop.replace(/-/g, '')])];
const rxOf = v => new RegExp('(?<![0-9])' + rxEsc(v) + '(?![0-9A-Z])');
const hits = (corpus, vs) => {
  const rx = vs.map(rxOf),
    out = [];
  for (const [name, txt] of corpus) if (rx.some(r => r.test(txt))) out.push(name);
  return out;
};
/* string literals of a source file (bindings), without the comments */
const strsOf = f => {
  const t = fs.readFileSync(path.join(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
  return [...t.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)].map(m => m[1] ?? m[2] ?? m[3]).join('\n');
};
const csvQ = x => {
  const s = String(x == null ? '' : x);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
(async () => {
  const IL = JSON.parse(fs.readFileSync(ilFile, 'utf8'));
  /* ---- the engine: what the plant model really writes ---- */
  const { AN } = await loadEngine({
    patch: c =>
      c
        .replace(/function anUnitWrite\(list, x\) \{/, m => m + 'try{for(const [S,b] of list){const sh=AN.sheets.find(q=>q.S===S);(AN.__w=AN.__w||new Set()).add((sh?sh.name:"?")+"|"+String(AN.nm(S,b.o[0])).trim())}}catch(e){}')
        .replace('plantLoad150:anPlantLoad150', 'plantLoad150:anPlantLoad150,__shStn:shStn,__src:()=>SRC_RULES')
  });
  const ADES = await AN.ades();
  AN.plantSwitch(true, true);
  for (const sh of AN.sheets) AN.ensure(sh);
  const stn = {};
  for (const sh of AN.sheets) stn[sh.name] = AN.__shStn(sh);
  const SRC = AN.__src();
  const tagAt = (sh, ai) => {
    const m = /^(?:S(\d)\s*)?(\S+)$/.exec(ai),
      r = (ADES[m[1] || stn[sh]] || {})[m[2]];
    return r && r.tag ? r.tag : '';
  };
  /* the loop models of plant.js as built when the sheets load (before a starting state changes them) */
  const procTags = new Map(); /* transmitter tag -> loop model controller */
  const procs = [];
  for (const sh of AN.sheets) {
    const S = sh.S;
    if (!S) continue;
    for (const b of S.procs || []) {
      const pr = b.proc || {},
        ctl = (b.txt || [])[1] || b.tag;
      procs.push({ sh: sh.name, ctl, mode: pr.mode });
      for (const n of pr.aiOut || []) {
        const t = tagAt(sh.name, String(AN.nm(S, n)).trim());
        if (t && !procTags.has(t)) procTags.set(t.replace(/\s+/g, ''), { sh: sh.name, ctl, mode: pr.mode });
      }
    }
  }
  AN.__w = new Set();
  for (const how of ['load150', 'cold']) {
    if (how === 'cold') AN.plantCold();
    else AN.plantLoad150();
    for (let k = 0; k < 120; k++) for (const sh of AN.sheets) if (sh.S && !/^ABC-000/.test(sh.name)) AN.stepSet(sh, 0.5);
  }
  const unitTags = new Map(); /* tag -> sheet|AI */
  for (const x of AN.__w) {
    const [sh, ai] = x.split('|'),
      t = tagAt(sh, ai);
    if (t) unitTags.set(t.replace(/\s+/g, ''), x);
  }
  const procCtl = new Map(procs.map(p => [p.ctl, p]));
  /* the control outputs: AO block -> controller (upstream PID / PIDV / MAN) -> valve tag written beside it */
  const aoCtl = new Map(); /* valve tag -> {sh, ctl, ao} */
  for (const sh of AN.sheets) {
    const S = sh.S;
    if (!S) continue;
    for (const b of S.blk) {
      if (b.k !== 'AO') continue;
      const near = (S.tx || [])
        .map(t => ({ t: String(t.t).trim(), d: Math.hypot(t.x - b.cx, t.y - b.cy) }))
        .filter(t => t.d < 80)
        .sort((a, c) => a.d - c.d);
      const ao = (near.find(t => /AO\d{4}/.test(t.t)) || {}).t || '';
      const seen = new Set();
      let fr = (b.i || []).slice(),
        ctl = '';
      for (let d = 0; d < 12 && fr.length && !ctl; d++) {
        const nx = [];
        for (const n of fr) {
          if (seen.has(n)) continue;
          seen.add(n);
          for (const dr of S.drv[n] || []) {
            const x = S.blk.find(q => q.id === dr.id);
            if (!x) continue;
            if (['PID', 'PIDV', 'MAN'].includes(x.k)) ctl = ctl || x.tag || (x.txt || [])[1] || '';
            else for (const q of x.i || []) nx.push(q);
          }
        }
        fr = nx;
      }
      /* the valve tag of this AO = the I/O list tag of its address (station of the sheet) */
      const m = /(?:S(\d)\s*)?(AO\d{4})/.exec(ao);
      const r = m ? (ADES[m[1] || stn[sh.name]] || {})[m[2]] : null;
      if (r && r.tag) aoCtl.set(r.tag.replace(/\s+/g, ''), { sh: sh.name, ctl, ao: m[2] });
    }
  }
  /* ---- the text of the drawings, the training and the procedure ---- */
  const dec = f => zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(root, 'src/data', f), 'utf8').trim(), 'base64')).toString('utf8');
  const abc = dec('apre.txt').split('\n').filter(Boolean).map(l => [JSON.parse(l).name, l.toUpperCase()]);
  const ditl = dec('pre.txt').split('\n').filter(Boolean).map(l => [JSON.parse(l).name.replace(/^\(\w+\)/, ''), l.toUpperCase()]);
  const model = ['src/analog/engine/unit.js', 'src/analog/engine/tcs.js', 'src/analog/engine/source.js', 'src/analog/engine/plant.js'].map(f => [path.basename(f), fs.readFileSync(path.join(root, f), 'utf8').toUpperCase()]);
  const train = ['src/ui/training/guide.js', 'src/ui/training/live.js', 'src/ui/training/dock.js', 'src/ui/uat/check.js'].map(f => [path.basename(f), strsOf(f).toUpperCase()]);
  const sopTxt = cp
    .execSync('unzip -p ' + JSON.stringify(path.join(root, 'document-references/procedure-start-up-PR-OPE-5002-02.docx')) + ' word/document.xml', { maxBuffer: 1 << 26 })
    .toString('utf8')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .toUpperCase();
  const sop = [['PR-OPE-5002', sopTxt]];
  /* ---- the I/O list (one record per tag, all stations) ---- */
  const io = new Map();
  for (const st in ADES)
    for (const a in ADES[st]) {
      const r = ADES[st][a];
      if (r.k !== 'io' || !r.tag) continue;
      const t = r.tag.replace(/\s+/g, '');
      if (!io.has(t)) io.set(t, []);
      io.get(t).push({ st, a, t: r.t || '', d: r.d || '', lo: r.lo, hi: r.hi, u: r.u || '' });
    }
  /* ---- the items: the instrument list + the I/O list valves / AO that are not in it ---- */
  const items = IL.map(x => Object.assign({ from: 'IL' }, x));
  const inIL = new Set(items.map(x => x.tag));
  for (const [t, recs] of io) {
    const pre = t.split('-')[0];
    const isAO = recs.some(r => /^AO/.test(r.a));
    if (inIL.has(t)) continue;
    if (isAO && !/^(TCS|GCP|TT)$/.test(pre)) items.push({ from: 'IO', tag: t, ty: pre, desc: recs[0].d, pd: '', sig: 'AO', to: 'FIELD', fr: 'DCS', rng: '' });
  }
  /* shutoff valves of the I/O list that have only open / close feedback (ZSO / ZSC) and no XV / MV row in the instrument list */
  const ilLoops = new Set(items.filter(x => /^(XV|MV|SV|PCV|FCV|LCV|TCV|MCV|PCD)$/.test(x.ty)).map(x => loopOf(x.tag)));
  const zsoLoops = new Map();
  for (const [t, recs] of io)
    if (/^ZSO-/.test(t) && /valve/i.test(recs[0].d)) {
      const l = loopOf(t);
      if (!ilLoops.has(l) && !zsoLoops.has(l)) zsoLoops.set(l, recs[0].d.replace(/\s*(fully\s*|full\s*)?open(ed)?(\s*position)?(\s*switch)?\s*$/i, ''));
    }
  for (const [l, d] of zsoLoops)
    items.push({ from: 'IO', tag: 'ZSO/ZSC-' + l, ty: /manual/i.test(d) ? 'MANUAL' : 'SOV?', desc: d, pd: '', sig: 'DI (ZSO / ZSC)', to: 'DCS', fr: 'FIELD', rng: '' });
  /* the I/O points of the same loop (feedback, command, trip of a MOV: ZSO / ZSC / MIT / MOR / MOS ...) */
  const ioLoop = new Map();
  for (const [t, recs] of io) {
    const l = loopOf(t);
    if (!ioLoop.has(l)) ioLoop.set(l, []);
    for (const q of recs) ioLoop.get(l).push(t.split('-')[0] + ' S' + q.st + ' ' + q.a);
  }
  /* ---- classify and match ---- */
  const CVT = /^(FCV|PCV|LCV|TCV|MCV|PCD|MOF|SC|INV|HCV)$/;
  const SOVT = /^(XV|MV|SOV\?)$/;
  const LOCAL = /^(PG|TG|LG|FG|DPG|TW|FE|PRV)$/;
  const rows = [];
  for (const x of items) {
    const loop = loopOf(x.tag),
      base = baseOf(loop),
      vs = variants(loop);
    const recs = io.get(x.tag) || [];
    let cat;
    if (x.ty === 'MANUAL') cat = 'MANUAL';
    else
    if (CVT.test(x.ty) || (x.from === 'IO' && /AO/.test(x.sig))) cat = 'CV';
    else if (SOVT.test(x.ty)) cat = 'SOV';
    else if (/^(SV|SVE|SVR)$/.test(x.ty)) cat = 'SOL';
    else if (LOCAL.test(x.ty) || (x.to === '-' && !recs.length)) cat = 'LOCAL';
    else if (!recs.length && /LCP|SM-|INVERTER/.test(x.to)) cat = 'PKG';
    else if (x.ty === 'TE' && x.to === 'TT') cat = 'ELEM';
    else cat = 'INST';
    const r = {
      cat, tag: x.tag, ty: x.ty, loop, desc: x.desc, sys: sysOf(x.pd), pd: x.pd, rng: x.rng, sig: x.sig, to: x.to, from: x.from,
      io: (recs.length ? recs.map(q => 'S' + q.st + ' ' + q.a) : /^(SOV|CV|SOL)$/.test(cat) ? (ioLoop.get(loop) || []).slice(0, 4) : []).join(' '), ioRng: recs.length && recs[0].hi != null ? recs[0].lo + '~' + recs[0].hi + ' ' + recs[0].u : '',
      abc: hits(abc, vs), ditl: hits(ditl, vs), train: hits(train, vs).length > 0, sop: hits(sop, vs).length > 0 || (base !== loop && hits(sop, [base]).length > 0)
    };
    /* plant model */
    let st = '', ev = '';
    let ctl = (aoCtl.get(x.tag) || {}).ctl;
    /* no AO of its own (MOV open / close commands, block valves): the controller of the same loop number, if any */
    if (!ctl && /^(CV|SOV)$/.test(cat)) ctl = [...Object.keys(PHYS_CTL), ...procCtl.keys()].find(c => new RegExp('^[A-Z]{2,4}' + rxEsc(base) + '$').test(c)) || '';
    if (cat === 'CV' || cat === 'SOV' || cat === 'SOL') {
      const c = ctl || '';
      const other = Object.keys(PHYS_OTHER).find(k => loop.startsWith(k));
      if (c && PHYS_CTL[c]) (st = 'IN'), (ev = c + ': ' + PHYS_CTL[c]);
      else if (other) (st = /^DO1043/.test(other) ? 'IN' : 'PART'), (ev = PHYS_OTHER[other]);
      else if (c && procCtl.has(c)) (st = 'PART'), (ev = c + ': loop model of plant.js (PV follows this valve only)' + (SRC[c] ? ' + source rule of source.js' : ''));
      else if (c) (st = 'NO'), (ev = c + ': controller on the drawing, no process model behind it');
      else (st = 'NO'), (ev = r.ditl.length || r.abc.length ? 'logic only (DITL / ABC): the plant model does not use its position' : 'no logic, no model');
      if (c && /^HICHR1002/.test(c)) (st = 'PART'), (ev = c + ': RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open)');
      r.ctl = c;
    } else if (cat === 'INST' || cat === 'ELEM') {
      const t = cat === 'ELEM' ? x.tag.replace(/^TE-/, 'TT-') : x.tag;
      const u = unitTags.get(t),
        p = procTags.get(t),
        lp = procs.find(q => /^(input|pin|remote)$/.test(q.mode) && q.ctl && q.ctl.replace(/^[A-Z]{2,4}(?=[A-Z]{2}\d)/, '') === base);
      if (u) (st = 'IN'), (ev = 'unit model writes ' + u);
      else if (p && PHYS_CTL[p.ctl]) (st = 'IN'), (ev = p.ctl + ' loop, coupled to the unit model (' + PHYS_CTL[p.ctl] + ')');
      else if (p) (st = 'PART'), (ev = p.ctl + ' (' + p.sh + '): loop model only' + (SRC[p.ctl] ? ' + source rule' : ''));
      else if (recs.some(q => TCS_DI.has('S' + q.st + ' ' + q.a))) (st = 'IN'), (ev = 'TCS input written by the unit model');
      else if (lp && /^(FT|PT|LT|TT|AT|DPT)$/.test(x.ty)) (st = PHYS_CTL[lp.ctl] ? 'IN' : 'PART'), (ev = lp.ctl + ' (' + lp.sh + '): PV made at the input of the sheet' + (PHYS_CTL[lp.ctl] ? ', ' + PHYS_CTL[lp.ctl] : ', loop model only'));
      else if (/^(ZSO|ZSC|ZSE|ZSR|TS|TSO|TSC)$/.test(x.ty) && r.ditl.length)
        (st = 'FB'), (ev = 'valve feedback made by the DITL MOV / solenoid model (src/digital/parts/03-models.js) on ' + r.ditl.slice(0, 2).join(' ') + '; the process does not see the valve');
      else if (!(recs.length || (io.get(t) || []).length)) (st = 'NA'), (ev = 'not in the DCS I/O list');
      else if (r.abc.length || r.ditl.length) (st = 'NO'), (ev = 'on the drawing, value set by the user / starting state only');
      else (st = 'NO'), (ev = 'DCS point with no logic (HMI / alarm only)');
      if (cat === 'ELEM') ev = 'element of ' + t + ': ' + ev;
    } else (st = 'NA'), (ev = cat === 'LOCAL' ? 'local field item (assumed per SOP)' : cat === 'MANUAL' ? 'manual valve with a limit switch (assumed in its SOP position)' : 'package panel (LCP), not a DCS point');
    r.st = st;
    r.ev = ev;
    rows.push(r);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const cols = ['cat', 'tag', 'desc', 'sys', 'sig', 'to', 'rng', 'io', 'ioRng', 'ctl', 'abc', 'ditl', 'train', 'sop', 'st', 'ev', 'from'];
  fs.writeFileSync(
    path.join(outDir, 'instrument-coverage.csv'),
    '\ufeff' + cols.join(',') + '\n' + rows.map(r => cols.map(c => csvQ(Array.isArray(r[c]) ? r[c].join(' ') : typeof r[c] === 'boolean' ? (r[c] ? 'Y' : '') : r[c])).join(',')).join('\n') + '\n'
  );
  fs.writeFileSync(path.join(outDir, 'coverage.json'), JSON.stringify(rows));
  fs.writeFileSync(path.join(outDir, 'model.json'), JSON.stringify({ procs, unit: [...AN.__w], ao: [...aoCtl] }));
  const cnt = {};
  for (const r of rows) cnt[r.cat + ' ' + r.st] = (cnt[r.cat + ' ' + r.st] || 0) + 1;
  console.log(rows.length, 'items;', JSON.stringify(cnt));
  console.log('unit model writes', AN.__w.size, 'transmitters; loop models', procs.length, '; AO with valve tag', aoCtl.size);
  process.exit(0);
})().catch(e => {
  console.log('ERROR', e.stack);
  process.exit(1);
});
