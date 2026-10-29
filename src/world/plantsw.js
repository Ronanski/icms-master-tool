/* 3.2.0 P1 #2 (docs/versions/v3.2.0/INSTRUMENT_VALVE_COVERAGE.md): PROTECTION SWITCHES FOLLOW THE PV. A level / pressure switch of the
   field is a DITL input row (DITL-01 LSL / LSH drum level, DITL-03C / 03D / 03E / 03G furnace pressure and drum level H.H. / L.L. of the
   MFT, DITL-23B deaerator L.L. of the BFWPs, DITL-61A hotwell L.L. of the CEPs). With the plant model ON the switch is the plant's: it
   opens or closes when the measured value crosses its set point (alarm list "Alarm List _20160912" sheets LS / PS, document-references/
   alarm-list.zip), with a dead band, and the row is automatic like a row fed by the logic (ditl.js auto). With the plant model OFF the
   user sets the row by hand as before.
   Set points (alarm list): drum level LSL -100, LSH +127, LSHH +254, LSLL -178, LSLL-NC -254 mm; furnace PSHHH +381, PSHH +267,
   PSLL -267 mmH2O (the -NC contact is 1 while NOT in that state); deaerator LSLL-CD1104-4 177 mm from the bottom = -2147 mm of the
   transmitter (normal level 2324 mm = 0); hotwell LSLL-CD1110 450 mm from the bottom = -150 mm (normal 600 mm = 0, ASSUMED: the
   normal hotwell level is not in the alarm list). Dead band: 10 mm / 10 mmH2O (ASSUMED, a typical switch). */
(function (W) {
  /* [row tag at the start of the row text, sheet, value: label of the ABC net or AI address, set point, 'lo' | 'hi', NC] */
  const L = [];
  const drum = n => ['ABC-010', 'LIBR1001' + n + '.PV', n === 1 ? 'AI0130' : 'AI0258'];
  for (const n of [1, 2]) {
    L.push(['LSL-BR1001-' + n, drum(n), -100, 'lo'], ['LSH-BR1001-' + n, drum(n), 127, 'hi'], ['LSHH-BR1001-' + n, drum(n), 254, 'hi']);
    L.push(['LSLL-BR1001-' + n, drum(n), -178, 'lo'], ['LSLL-BR1001-' + n + '-NC', drum(n), -254, 'lo', 1]);
  }
  const fp = { 1085: 'AI0132', 1086: 'AI0260', 1087: 'AI0388' };
  for (const k of Object.keys(fp)) {
    const src = ['ABC-008', null, fp[k]];
    L.push(['PSHHH-FG' + k, src, 381, 'hi'], ['PSHH-FG' + k, src, 267, 'hi'], ['PSLL-FG' + k, src, -267, 'lo']);
    L.push(['PSHHH-FG' + k + '-NC', src, 381, 'hi', 1], ['PSHH-FG' + k + '-NC', src, 267, 'hi', 1], ['PSLL-FG' + k + '-NC', src, -267, 'lo', 1]);
  }
  L.push(['LSLL-CD1104-4', ['ABC-031', null, 'AI0672'], -2147, 'lo'], ['LSLL-CD1110', ['ABC-031', null, 'AI0640'], -150, 'lo']);
  const DB = 10;
  let map = null;
  /* the rows of every sheet and machine instance whose text starts with a switch tag (the tag may follow a few words: "CONDENSER
     WATER LSLL-CD1110 LEVEL LOW LOW") */
  function build(ALL) {
    map = [];
    ana.length = 0;
    suc.length = 0;
    for (const s of ALL) {
      const b = s._inst ? s._inst.base : s;
      for (let i = 0; i < ((b && b.rows) || []).length; i++) {
        let t = '';
        try {
          const I = (window.DUI && DUI.rowInfo(s, i)) || {}; /* rowInfo is the text of the instance already (W.showText) */
          t = ((I.tag || '') + ' ' + (I.svc || '')).trim().toUpperCase();
        } catch (e) {}
        if (!t) continue;
        const words = t.split(/\s+/);
        const d = L.find(x => words.slice(0, 3).includes(x[0]));
        if (d) map.push({ s, row: i, d, on: null });
      }
      /* P2 #13: the DITL comparator rows on the condenser pressure transmitter (DITL-55 row 6, DITL-73 row 26 PT-CD1110) */
      for (const a of (s.nl && s.nl.an) || []) {
        const z = (s.nl.src || []).find(q => q.n === a.net);
        let t = '';
        try {
          const I = (z && window.DUI && DUI.rowInfo(s, z.row)) || {};
          t = ((I.tag || '') + ' ' + (I.svc || '')).toUpperCase();
        } catch (e) {}
        if (/PT-CD1110\b/.test(t)) ana.push({ s, key: a.key });
        else if (/(?:^|[^A-Z])PT-FW1115-[AB]\b/.test(t)) suc.push({ s, key: a.key }); /* not DPT-FW1115 (the strainer) */
      }
    }
  }
  /* P2 #13 (INSTRUMENT_VALVE_COVERAGE.md): the condenser pressure follows the vacuum of the unit model (unit.js U.vac, 0 = no vacuum,
     1 = in service): 1.033 kg/cm2A (atmosphere) to 0.057 kg/cm2A (4.PNG PICD1110 at 150 MW) */
  const ana = [],
    suc = [];
  /* 3.2.0-beta.50 (live check #94): the BFWP suction pressure PT-FW1115-A / -B (DITL-23A row 12, START permissive > 1.5 kg/cm2) is the
     deaerator pressure (ABC-056 AI0417 PT-CD1104) plus the static head of the deaerator water (its level, ABC-031 AI0672 LT-CD1104) less the
     suction loss at the feedwater flow. Before: the row kept its default 0.75 and the trainee had to FIELD-force it at Hakbang 25.
     ASSUMED (not in the repository): head 2.2 kg/cm2 at the normal level (about 22 m of water), 1 kg/cm2 per 10 m of level, loss
     1.4 kg/cm2 at 499 T/H (so 5.9 + 2.2 - 1.4 = 6.7 kg/cm2, PIFW1115A of the 150 MW snapshot) */
  W.sucP = () => {
    const pd = val(['ABC-056', null, 'AI0417']),
      lv = val(['ABC-031', null, 'AI0672']),
      f = (window.AN_CYC && AN_CYC.ffw) || 0;
    if (!isFinite(pd)) return NaN;
    const r = Math.max(0, pd + Math.max(0, 2.2 + (isFinite(lv) ? lv : 0) / 1e4) - 1.4 * (f / 499) * (f / 499));
    return Math.round(r * 100) / 100;
  };
  W.condP = () => {
    const U = (window.AN && AN.unit) || {},
      v = isFinite(U.vac) ? Math.max(0, Math.min(1, U.vac)) : NaN;
    return isFinite(v) ? Math.round((1.033 - (1.033 - 0.057) * v) * 1000) / 1000 : NaN;
  };
  const SRC = {};
  function val(src) {
    const [k, net, ai] = src,
      key = src.join('|');
    let r = SRC[key];
    if (r === undefined) {
      r = null;
      const sh = AN.sheets.find(x => x.name === k);
      const S = sh && (sh.S || (AN.ensure && AN.ensure(sh)));
      if (S) {
        const n = net ? S.lab.findIndex(x => x && String(x.t).trim() === net) : -1;
        const b = S.blk.find(z => z.k === 'AI' && z.o && z.o[0] != null && (AN.nm(S, z.o[0]) || '').trim() === ai);
        r = { S, n: n >= 0 && S.drv[n] && S.drv[n].length ? n : -1, b };
      }
      SRC[key] = r;
    }
    if (!r) return NaN;
    if (r.n >= 0 && isFinite(r.S.rt.v[r.n])) return +r.S.rt.v[r.n];
    const st = r.b && r.S.rt.st[r.b.id];
    return st && isFinite(st.val) ? +st.val : NaN;
  }
  /* called by the world scan after the inputs of the logic (step 1 of tick): the switch rows join s._win (automatic, ORed with s.sig) */
  W.plantIn = ALL => {
    if (!(window.AN && AN.plantOn === true)) return;
    if (!map) build(ALL);
    const pc = W.condP();
    if (isFinite(pc)) for (const a of ana) (a.s.avw = a.s.avw || {})[a.key] = pc;
    const ps = suc.length ? W.sucP() : NaN;
    if (isFinite(ps)) for (const a of suc) (a.s.avw = a.s.avw || {})[a.key] = ps;
    for (const m of map) {
      const [, src, sp, dir, nc] = m.d,
        x = val(src);
      if (!isFinite(x)) continue;
      /* the state of the switch: tripped (level low / pressure high) with its dead band */
      const tr = m.on == null ? (dir === 'lo' ? x < sp : x > sp) : m.on ? (dir === 'lo' ? x < sp + DB : x > sp - DB) : dir === 'lo' ? x < sp : x > sp;
      /* test tool only (tools/training/checkpoint/run.js --nostop): the switch is logged, not acted on, so one run lists every trip */
      if (W.swTest) {
        if (tr && !m.on) (W.swLog || (W.swLog = [])).push({ tag: m.d[0], sheet: m.s.name, x: Math.round(x * 10) / 10, tmin: window.AN && AN.unit ? Math.round(AN.unit.t / 60) : null });
        m.on = tr;
        if (nc) (m.s._win || (m.s._win = new Set())).add(m.row);
        continue;
      }
      m.on = tr;
      if (nc ? !tr : tr) (m.s._win || (m.s._win = new Set())).add(m.row);
    }
  };
  W.plantSw = () => (map || []).map(m => ({ sheet: m.s.name, row: m.row + 1, tag: m.d[0], on: m.on }));
})(window.WORLD);
