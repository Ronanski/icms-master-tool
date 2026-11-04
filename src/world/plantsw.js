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
  /* 3.2.0-beta.68 (INSTRUMENT & PLANT AIR HMI): the pressure switch of the instrument air to unit 1 (alarm list PSL-IA1706 / -NC 2.8
     kg/cm2; DITL-03G rows 7 / 27, the MFT and the annunciator) follows the unit header of the plant model (unit.js AN_AIR iaPU) */
  const iaU = () => (window.AN && AN.unit && isFinite(AN.unit.iaPU) ? AN.unit.iaPU : NaN);
  L.push(['PSL-IA1706', iaU, 2.8, 'lo', 0, 0.2], ['PSL-IA1706-NC', iaU, 2.8, 'lo', 1, 0.2]); /* dead band 0.2 kg/cm2 (ASSUMED) */
  /* 3.2.1 (SEULGI : PLANT MODEL, boiler side, src/analog/engine/boiler.js AN_DO): the burner package switches of DITL-07 (machine
     instances #B ~ #D = burners B ~ D), BMS permissives (M&S BMS description 1612 13-4-105 2.2 / 7.2):
     row 10 PSH-DO1043-x1 "DIESEL OIL SUPPLY PRESS. NOT HIGH" = the gun pressure (PT-DO1043-x2) below 5.9 kg/cm2 (alarm list PSL-DO1043-x1
     H 5.9); row 12 PSL-PA1043-x1 "ATOMIZING AIR PRESS. NOT LOW" = the atomizing air above 3.0 kg/cm2 (alarm list PSL-PA1043-x1 L 3.0).
     The atomizing air is plant air (PD-022 2/5, BMS 5.2 "mechanical air control valve ... 4-7 bar"; M&S load curve 1612 13-4-71
     "compressed air 4.0 bar"): the unit 1 plant air header of the plant model (unit.js AN_AIR paPU) held at 4.0 bar (4.08 kg/cm2) by
     the burner's regulator. Dead band 0.2 kg/cm2 (NO-SOURCE) */
  const doPb = i => () => (window.AN && AN.unit && Array.isArray(AN.unit.doPb) && isFinite(AN.unit.doPb[i]) ? AN.unit.doPb[i] : NaN),
    atom = () => (window.AN && AN.unit && isFinite(AN.unit.paPU) ? Math.min(AN.unit.paPU, 4.0 / 0.980665) : NaN);
  'ABCD'.split('').forEach((x, i) => {
    L.push(['PSH-DO1043-' + x + '1', doPb(i), 5.9, 'hi', 1, 0.2]);
    L.push(['PSL-PA1043-' + x + '1', atom, 3.0, 'lo', 1, 0.2]);
  });
  /* live test #54: the ACWP motor temperatures of the plant model (unit.js AN_MT) on their DITL rows: DITL-76 / 77 rows 13 ~ 17
     "TT-CW1108-x3 / x4 ... BEARING TEMP > 100 C" (M.2620 ~ 2621 / M.2630 ~ 2631) and "TT-CW1108-xU / xV / xW ... WINDING TEMP > 165 C"
     (M.2622 ~ 2624 / M.2632 ~ 2634) = the HH of the alarm list (TE-CW1108: bearing HH 100, winding HH 165); dead band 2 C (ASSUMED) */
  const mtOf = t => () => (window.AN && AN.unit && AN.unit.mt && isFinite(AN.unit.mt[t]) ? AN.unit.mt[t] : NaN);
  for (const p of ['A', 'B']) {
    for (const e of ['3', '4']) L.push(['TT-CW1108-' + p + e, mtOf('TT-CW1108-' + p + e), 100, 'hi', 0, 2]);
    for (const e of ['U', 'V', 'W']) L.push(['TT-CW1108-' + p + e, mtOf('TT-CW1108-' + p + e), 165, 'hi', 0, 2]);
  }
  /* 3.2.1 (CW plant model): the SWP motor temperatures and vibration of the plant model (unit.js AN_MT) on their DITL-29B rows
     (machine instances #B / #C for pumps B / C): rows 5 / 6 TT-SW1501-x3 / x4 bearing, rows 9 ~ 11 TT-SW1501-xU / xV / xW winding,
     rows 12 / 13 VT-SW1501-x1 / x2 vibration; OUT18 (5 s on-delay) = SEAWATER PUMP x TRIP INTERLOCK CONDITION. Set points = the HH of the
     alarm list "Alarm List _20160912" (TE-SW1501: bearing HH 100, winding HH 155; VT-SW1501: HH 11.9 mm/s, pump B 16.8 mm/s); dead band
     2 C / 0.5 mm/s (NO-SOURCE) */
  for (const p of ['A', 'B', 'C']) {
    for (const e of ['3', '4']) L.push(['TT-SW1501-' + p + e, mtOf('TT-SW1501-' + p + e), 100, 'hi', 0, 2]);
    for (const e of ['U', 'V', 'W']) L.push(['TT-SW1501-' + p + e, mtOf('TT-SW1501-' + p + e), 155, 'hi', 0, 2]);
    for (const e of ['1', '2']) L.push(['VT-SW1501-' + p + e, mtOf('VT-SW1501-' + p + e), p === 'B' ? 16.8 : 11.9, 'hi', 0, 0.5]);
  }
  /* 3.2.1 (IRENE: MAKE-UP / CLOSED COOLING plant model, unit.js AN_MU / AN_ACW). DITL-112 rows 19 / 21 LS-MU0708-A / B "DEMI. WATER
     TANK LEVEL (A) / (B) LOW" = the demi tank level of the plant model below 0.2 m (alarm list LS-MU0708-A / B 0.2 m; dead band 0.05 m
     NO-SOURCE). DITL-21B rows 27 / 28 (machine instances #B ~ #D for coolers B ~ D) FS-CW1060-x1 / x2 "BOTTOM ASH SCREW COOLER ...
     COOLING WATER FLOW LOW" = the flow of the closed cooling loop below 150 m3/h (10 % of the 1,500 m3/h design: NO-SOURCE, the
     switches are of the screw cooler package and have no set point in the alarm list; in practice: no ACWP running) */
  const uOf = k => () => (window.AN && AN.unit && isFinite(AN.unit[k]) ? AN.unit[k] : NaN);
  L.push(['LS-MU0708-A', uOf('muLvA'), 0.2, 'lo', 0, 0.05], ['LS-MU0708-B', uOf('muLvB'), 0.2, 'lo', 0, 0.05]);
  for (const p of ['A', 'B', 'C', 'D']) for (const e of ['1', '2']) L.push(['FS-CW1060-' + p + e, uOf('acQ'), 150, 'lo', 0, 50]);
  /* Mina M3 (beta.88 / beta.89: PR-OPE-5002 19.5 "Initiate START of LOP of BFP A/B"). Each BFWP has two auxiliary lube oil pumps, DCS
     motors of DITL-22 (IO list STN103: machine A = LOP A of BFWP-A O.0126 / I.0050, B = LOP B of BFWP-A O.0446 / I.0370, C = LOP A of
     BFWP-B O.0127 / I.0053, D = LOP B of BFWP-B O.0447 / I.0373; world.js isLop4). The lube oil HEADER pressure is held by the pressure control valve at 2.0 kg/cm2(g) while an oil pump runs (KSB
     "30 LPM lube oil system" O&M manual, o&m-package-phase-1/L7 BFP/D .../5 LOS-O&M MANUAL, p.13 Annexure-I: lube oil supply 2.0,
     pump delivery 6.0; KSB P&ID PR 73691 B: supply 1.5 ~ 2 kg/cm2(g)); 0 with the pump stopped (PR-OPE-5002 section 20: the LOP is
     started before the BFP). The header switches (Annexure-II 24.1 < 1.5, 24.3 < 1.0; memory list STN103 I.0090 / I.0410 and
     I.0092 / I.0412) follow it. The "> 2.0" switch I.0091 / I.0411 (memory list "PS-LO1115-A2 ( > 2.0Kg/cm2 )"; Annexure-II 24.2 set point
     2.0) is the oil-pressure-established contact: a pressure switch makes at its set point on a rising pressure, and the header is
     held by the pressure control valve AT that set point (Annexure-I "Pressure Control valve (Upstream) Lube oil supply 2.0"), so it
     makes when the header reaches 2.0 ('ge'). The MOP of the skid: no DCS signal, not modelled */
  const runOf = (re, k) => {
    const s = (runOf.c = runOf.c || {})[re + k] || (W.inst || []).concat((typeof S !== 'undefined' && S.sheets) || []).find(x => new RegExp('\\)' + re + (k && k !== 'A' ? ' #' + k : '') + '$').test(x.name));
    if (!s) return null;
    runOf.c[re + k] = s;
    const r = (s._runR = s._runR !== undefined ? s._runR : (window.DUI && DUI.outs(s).find(q => /\bRUNNING\b/.test(q.name) && !/NOT RUNNING/.test(q.name))) || null);
    const o = W._o && W._o[s.name];
    return r && o ? (o.has ? o.has(r.row) : o.includes(r.row)) : null;
  };
  /* audit A2: the header of BFWP-A is fed by LOP A or LOP B of BFWP-A (DITL-22 machines A, B), of BFWP-B by DITL-22 machines C, D */
  const lopP = k => () => {
    const [m1, m2] = k === 'A' ? ['A', 'B'] : ['C', 'D'],
      a = runOf('DITL-22', m1),
      b = runOf('DITL-22', m2);
    return a || b ? 2.0 : a === false && b === false ? 0 : NaN;
  };
  /* DITL-23A / DITL-22 write the rows by address: matched by the address and the word LUB (the 7th field; other stations reuse it) */
  for (const [k, a1, a2, a3] of [['A', 'I.0090', 'I.0091', 'I.0092'], ['B', 'I.0410', 'I.0411', 'I.0412']]) L.push([a2, lopP(k), 2.0, 'ge', 0, 0, /\bLUB/], [a1, lopP(k), 1.5, 'lo', 0, 0 /* no dead band: the pressure steps 0 / 2.0 */, /\bLUB/], [a3, lopP(k), 1.0, 'lo', 0, 0, /\bLUB/]);
  const DB0 = 10;
  let map = null,
    mapK = '';
  /* the rows of every sheet and machine instance whose text starts with a switch tag (the tag may follow a few words: "CONDENSER
     WATER LSLL-CD1110 LEVEL LOW LOW") */
  function build(ALL) {
    map = [];
    ana.length = 0;
    suc.length = 0;
    mu.length = 0;
    air.length = 0;
    bo.length = 0;
    for (const s of ALL) {
      if (!s.nl && typeof netlist === 'function')
        try {
          s.nl = netlist(s);
        } catch (e) {}
      const b = s._inst ? s._inst.base : s;
      for (let i = 0; i < ((b && b.rows) || []).length; i++) {
        let t = '';
        try {
          const I = (window.DUI && DUI.rowInfo(s, i)) || {}; /* rowInfo is the text of the instance already (W.showText) */
          t = ((I.tag || '') + ' ' + (I.svc || '')).trim().toUpperCase();
        } catch (e) {}
        if (!t) continue;
        const words = t.split(/\s+/);
        const d = L.find(x => words.slice(0, 3).includes(x[0]) && (!x[6] || x[6].test(t)));
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
        const m = MU.find(([re]) => re.test(t));
        if (/PT-CD1110\b/.test(t)) ana.push({ s, key: a.key });
        else if (/(?:^|[^A-Z])PT-FW1115-[AB]\b/.test(t)) suc.push({ s, key: a.key }); /* not DPT-FW1115 (the strainer) */
        else if (m) mu.push({ s, key: a.key, f: typeof m[1] === 'function' ? m[1](t, a, s) : m[1] });
        else {
          const m = AIR.find(([re]) => re.test(t));
          if (m) air.push({ s, key: a.key, f: m[1] });
          else {
            const q = BO.find(([re]) => re.test(t)); /* 3.2.1 SEULGI: boiler side (boiler.js) */
            if (q) bo.push({ s, key: a.key, f: q[1] });
          }
        }
      }
    }
  }
  /* P2 #13 (INSTRUMENT_VALVE_COVERAGE.md): the condenser pressure follows the vacuum of the unit model (unit.js U.vac, 0 = no vacuum,
     1 = in service): 1.033 kg/cm2A (atmosphere) to 0.057 kg/cm2A (4.PNG PICD1110 at 150 MW) */
  const ana = [],
    suc = [],
    mu = [],
    air = [];
  /* 3.2.0-beta.63 (MAKE-UP WATER HMI): the local transmitters of the make-up water system and of the expansion tank are analog rows of
     the logic only (DITL-112 trip < 0.2 m / >= 1 kg/cm2, DITL-76 / 77 ACWP trip < 0.3 m, DITL-78 XV-MU1109 AUTO 40 % / 85 %); their value
     is the plant model's (unit.js AN_MU), the same number as the HMI. [row text, unit model key] */
  const MU = [
    [/LT-MU0708-A\b/, 'muLvA'],
    [/LT-MU0708-B\b/, 'muLvB'],
    /* the drawing of MWP A serves B and C (machine instances "DITL-112 #B" / "#C"): the strainer of the instance's own pump */
    [/DPT-MU0709-([ABC])\b/, (t, a, s) => 'muDp' + 'ABC'.indexOf((/#\s*([BC])\b/.exec(s.name) || /DPT-MU0709-([ABC])/.exec(t))[1])],
    [/(?:^|[^A-Z])PT-MU0709\b/, 'muP'],
    [/LT-CW1109\b/, (t, a) => (/%/.test(a.unit || '') ? 'etPct' : 'etLvl')],
    /* 3.2.0-beta.69 (027 CLOSED COOLING WATER HMI): DITL-76 / 77 row 25 strainer DP (trip > 0.8 kg/cm2 5 s), DITL-76 row 28 the common
       discharge pressure (< 3.5 kg/cm2 = standby AUTO start); the plant model's (unit.js AN_ACW) */
    [/DPT-CW1108-([AB])\b/, t => 'acDp' + 'AB'.indexOf(/DPT-CW1108-([AB])/.exec(t)[1])],
    [/(?:^|[^A-Z])PT-CW1152\b/, 'acP1'],
    /* 3.2.1 (IRENE): DITL-41 row 14 PT-CW1156 "COOLING WATER OF BOTTOM ASH PRESSURE" (< 3.5 / > 7 kg/cm2 = M.250F / M.250E, the
       annunciator COOLING WATER PRESSURE ABNORMAL) and DITL-21A rows 13 / 14 TT-CW1060-A2 / A1 (machine instances #B ~ #D) = the
       supply header and the ash cooler outlets of the plant model (unit.js AN_ACW acP6 / acTb) */
    [/(?:^|[^A-Z])PT-CW1156\b/, 'acP6'],
    [/(?:^|[^A-Z])TT-CW1060-[A-D][12]\b/, 'acTb'],
    /* 3.2.1 (IRENE: CONDENSATE): DITL-61B row 19 PT-CD1117 (< 14.0 kg/cm2 = M.3217, the standby condensate pump starts) and DITL-61A
       rows 24 / 27 the strainer DP DPT-CD1001 / 1002 of pump A / B = the plant model's (unit.js AN_CD) */
    [/(?:^|[^A-Z])PT-CD1117\b/, 'cdPd'],
    [/DPT-CD100([12])\b/, t => 'cdDp' + (+/DPT-CD100([12])/.exec(t)[1] - 1)],
    /* 3.2.1 (IRENE: FEEDWATER): DITL-23B row 25 PT-FW1011 (< 155 kg/cm2 = M.3210, the standby BFWP starts) and row 26 the strainer DP
       DPT-FW1115-A / B (machine instance #B) = the plant model's (unit.js AN_FW) */
    [/(?:^|[^A-Z])PT-FW1011\b/, 'fwPd'],
    [/DPT-FW1115-?([AB])\b/, t => 'fwDp' + 'AB'.indexOf(/DPT-FW1115-?([AB])/.exec(t)[1])]
  ];
  /* 3.2.0-beta.68 (INSTRUMENT & PLANT AIR HMI): the tank and unit header pressure transmitters of the compressed air systems are analog
     rows of the logic (DITL-113 / 114 rows 1 ~ 3: auto start of the standby compressor < 5 kg/cm2; DITL-03G rows 9 ~ 11: MFT on
     instrument air < 3.5 kg/cm2, 2 of 3); their value is the plant model's (unit.js AN_AIR), the same number as the HMI. DITL-114 row 3
     reads "PT-PA1706 PLANT AIR SYSTEM PRESSURE": the I/O list (STN104 AI0435), the alarm list and flow diagram PD-023 1/6 name the plant
     air to unit 1 transmitter PT-PA1705 (no PT-PA1706 exists), so the row is PT-PA1705 (UNLINK_AUDIT.md). [row text, unit model key] */
  const AIR = [
    [/PT-IA0706-?A\b/, 'iaPA'],
    [/PT-IA0706-?B\b/, 'iaPB'],
    [/PT-IA1706\b/, 'iaPU'],
    [/PT-PA0705-?A\b/, 'paPA'],
    [/PT-PA0705-?B\b/, 'paPB'],
    [/PT-PA170[56]\b/, 'paPU']
  ];
  /* 3.2.1 (SEULGI : PLANT MODEL, boiler side, src/analog/engine/boiler.js AN_DO): the local transmitters of the diesel oil pumps are
     analog rows of DITL-31 (and its machine instance #B): row 15 LT-DO0701 "OIL SERVICE TANK LEVEL" < 0.2 m and row 17 DPT-DO0001
     "DOP OF BURNER FILTER DIFF. PRESSURE" > 0.8 kg/cm2 = pump trip; row 28 PT-DO0005 "DOP OUTLET PRESSURE" < 5 = L.L. (standby AUTO
     start), < 7 = LOW. Their value is the plant model's, the same number as the HMI. [row text, unit model key] */
  const bo = [];
  const BO = [
    [/LT-DO0701\b/, 'doLv'],
    [/DPT-DO0001\b/, 'doDp'],
    [/(?:^|[^A-Z])PT-DO0005\b/, 'doP1']
  ];
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
    /* 3.2.1 (IRENE: CONDENSATE): the condenser pressure of the plant model (unit.js AN_CD: saturation of the condensing temperature
       from the seawater flow and the steam, plus the air of a condenser not in vacuum) */
    if (U.on && isFinite(U.cdP)) return Math.round(U.cdP * 1000) / 1000;
    return isFinite(v) ? Math.round((1.033 - (1.033 - 0.057) * v) * 1000) / 1000 : NaN;
  };
  const SRC = {};
  function val(src) {
    if (typeof src === 'function') return src();
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
    /* Mina H2 (beta.89, Worker, Step 26: PT-FW1115-A stayed "not complete" until DITL-23A was opened): the list was made once, at the
       first scan; a sheet whose netlist (its analog rows) or machine copy did not exist yet was never in it, and the suction pressure
       was never written. The list is made again when the sheets with a netlist change; a switch keeps its state */
    const key = ALL.length + ':' + ALL.reduce((n, x) => n + (x.nl ? 1 : 0), 0);
    if (!map || mapK !== key) {
      const old = map;
      build(ALL);
      mapK = key;
      if (old) for (const m of map) { const o = old.find(q => q.s === m.s && q.row === m.row); if (o) m.on = o.on; }
    }
    if (pend) put();
    const pc = W.condP();
    if (isFinite(pc)) for (const a of ana) (a.s.avw = a.s.avw || {})[a.key] = pc;
    const U = AN.unit || {};
    for (const a of mu) if (isFinite(U[a.f])) (a.s.avw = a.s.avw || {})[a.key] = Math.round(U[a.f] * 1000) / 1000;
    for (const a of air) if (isFinite(U[a.f])) (a.s.avw = a.s.avw || {})[a.key] = Math.round(U[a.f] * 1000) / 1000;
    for (const a of bo) if (isFinite(U[a.f])) (a.s.avw = a.s.avw || {})[a.key] = Math.round(U[a.f] * 1000) / 1000;
    const ps = suc.length ? W.sucP() : NaN;
    if (isFinite(ps)) for (const a of suc) (a.s.avw = a.s.avw || {})[a.key] = ps;
    for (const m of map) {
      const [, src, sp, dir, nc, db] = m.d,
        DB = db != null ? db : DB0,
        x = val(src);
      if (!isFinite(x)) continue;
      /* the state of the switch: tripped (level low / pressure high) with its dead band */
      /* 'ge': a switch that makes at its set point (rising), a pressure that is held AT the set point (the BFWP lube oil header) */
      const tr = dir === 'ge' ? x >= sp : m.on == null ? (dir === 'lo' ? x < sp : x > sp) : m.on ? (dir === 'lo' ? x < sp + DB : x > sp - DB) : dir === 'lo' ? x < sp : x > sp;
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
  W.plantSw = () => (map ? map.map(m => ({ sheet: m.s.name, row: m.row + 1, tag: m.d[0], on: m.on })) : pend || []);
  /* 3.2.0 Web Worker: the state of the switches (their dead band) back from a keyframe (src/digital/parts/03d-state.js); kept until the
     list is built (the first scan) */
  /* Reset (ditl150.js clear): the switches as on a fresh page (no list yet: the first scan with the plant model builds it, W.plantIn) */
  W.plantSwClear = () => {
    pend = null;
    map = null;
    mapK = '';
  };
  W.plantSwSet = L => {
    pend = L;
    if (map) put();
  };
  let pend = null;
  const put = () => {
    for (const q of pend || []) {
      const m = map.find(x => x.s.name === q.sheet && x.row === q.row - 1 && x.d[0] === q.tag);
      if (m) m.on = q.on;
    }
    pend = null;
  };
})(window.WORLD);
