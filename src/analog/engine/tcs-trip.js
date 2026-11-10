/* 3.2.1 plan c1, c2: the TURBINE TRIP runs through the gates of the Interlock Block Diagram 310SC90-794 rev 2. The gates are the sheets of
   tcs-ibd-data.js (read from the PDF by tools/data/ibd_read.mjs); this file gives them their field values and set points, runs them and
   reads the result: TA-1 net TA1_RESET = 1 the turbine is reset; a fall of it is the trip, and the rows of TA-9 standing at that scan are the
   first out. U.tc.trip = the first-out name, read by unit.js (it writes I.0400 TURBINE TRIP).
   Symbols, sheet 13: S / R reset has priority; DI delay pick up; DT delay drop out; PO one shot; (WO) A AND NOT C; MID median; 2/3.
   Fixed set points come with the netlist, read from the words under each comparator; the variable limits of TA-11 and TA-21 are the tables
   below. A comparator with neither stays 0 and is listed by AN.tcsIbdMissing().
   One value per quantity: the model has one transmitter where the plant has three, so A, B and C read the same value. */
const TCS_MFT_ROW = 12; /* DITL-03A out 13 = MFT (guide.js purge step) */
const TA1_RESET = 3; /* TA-1 the A gate: all trip conditions off and reset */
/* TA-21: HP first stage pressure kg/cm2 g -> TRIP limit of inlet / exhaust differential pressure, kg/cm2 */
const TCS_DP = [
  [0, 26.72],
  [31.9, 26.72],
  [51.5, 39.02],
  [72.2, 52.22],
  [104.2, 72.92],
  [107.4, 74.92],
  [111.1, 77.42],
  [150, 77.42]
];
/* TA-11: HP first stage pressure kg/cm2 g -> main steam temperature VERY LOW trip line, C */
const TCS_MST = [
  [0, 395.3],
  [33.4, 395.3],
  [42.8, 417],
  [55.2, 419.6],
  [61.7, 421.6],
  [72.2, 423.4],
  [88, 425.5],
  [104.2, 427.2],
  [150, 432]
];
/* 3.2.1 d3 (LISA): the ANN column of the same tables (IBD TA-21 and TA-11, set point tables beside the charts, columns ANN and TRIP): the HIGH and LOW alarm lines */
const TCS_DP_ANN = [
  [0, 24.72],
  [31.9, 24.72],
  [51.5, 37.02],
  [72.2, 50.22],
  [104.2, 70.92],
  [107.4, 72.92],
  [111.1, 75.42],
  [150, 75.42]
];
const TCS_MST_ANN = [
  [0, 410.3],
  [33.4, 410.3],
  [42.8, 432],
  [55.2, 434.6],
  [61.7, 436.6],
  [72.2, 438.4],
  [88, 440.5],
  [104.2, 442.2],
  [150, 447]
];
const tcsFst = U => (U.pist && U.pist.length ? anUnitVal(U.pist[0]) : NaN); /* PT-ST1001 */
const tcsCrp = U => (U.rhp && U.rhp.length > 2 ? anUnitVal(U.rhp[2]) : NaN); /* PT-CR1006 */
/* the value of a field signal by its tag on the sheet; NaN = no value in the model */
/* stop valve position 1 open, 0 full close: the master trip of TA-1 dumps the trip oil and the valves close (U.tauTrip); reset opens them */
const tcsVp = (U, c) => (c.vp == null ? (c.vp = U.tb && U.tb.st !== 'off' ? 1 : 0) : c.vp);
function tcsValves(U, c, ib, dt) {
  tcsVp(U, c);
  if (!ib.r1) return;
  c.vp = ib.v['TA-1'] && ib.v['TA-1'][TA1_RESET] > 0.5 ? Math.min(1, c.vp + dt / 10) : Math.max(0, c.vp - dt / U.tauTrip);
}
/* I.0400 TURBINE TRIP to the DCS is TA-6 out 16 (valve position, or TCS MAJOR TROUBLE); before the first reset of a cold plant it stays 0 so the ATS can start */
function tcsI0400(U, ib) {
  const l = U.vtrip,
    x = ib.r1 && ib.v['TA-6'] && ib.v['TA-6'][16] > 0.5 ? 1 : 0;
  if (ib.ext || !l || l.S.rt.force[l.n] !== undefined || !l.S.ext.includes(l.n)) return;
  if (l.S.rt.ext[l.n] !== x) l.S.rt.ext[l.n] = x;
}
const TCS_IBD_PV = [
  [/PT-STn110/, U => U.cdP],
  [/TE-MSn902/, U => tcsSteam(U).mst],
  [/PT-STn001/, U => tcsFst(U)],
  [/PT-LOn922-A/, U => U.loPa],
  [/PT-LOn922-B/, U => U.loPb],
  [/PT-LOn931-A/, U => U.loCa],
  [/PT-LOn931-B/, U => U.loCb],
  [/PT-LOn006/, U => U.loCtl],
  [/PT-LOn003/, U => U.loBrg],
  [/PT-LOn007/, U => U.loTrip],
  [/TE-STn110/, (U, c) => c.Tx],
  [/SE-STn001/, U => (U.tb ? U.tb.rpm : 0)],
  [/PT-CRn901|HP TURBINE EXHAUST .*STEAM PRESS[.] [(][ABC]/, U => tcsCrp(U)],
  [/GENERATOR LOAD/, U => ((+U.MW || 0) / 150) * 100],
  /* the valves (IBD TA-6, TA-31 ~ 38) */
  [/^MSV\([AB]\) FULL CLOSE/, (U, c) => (tcsVp(U, c) <= 0 ? 1 : 0)],
  [/^RSV\([AB]\) FULL CLOSE/, (U, c) => (tcsVp(U, c) <= 0 ? 1 : 0)],
  [/^ICV\([AB]\) FULL CLOSE/, U => (U.tb && U.tb.icv > 0.001 ? 0 : 1)],
  [/^CV\([AB]\) FULL CLOSE/, U => (U.gv > 0.001 ? 0 : 1)],
  [/^52G CLOSED/, U => (U.tb && (U.tb.st === 'sync' || U.tb.st === 'load') ? 1 : 0)],
  [/^52G OPEN COMMAND FROM ATS/, (U, c) => (c.sd52 ? 1 : 0)],
  /* positions in % (ZT): MSV, RSV as the stop valves; CV, ICV as the control valves of the model; A4 ~ A6 / B4 ~ B6 of 905 are the ICV (TA-37, TA-38) */
  [/^ZT-STn903|^ZT-STn905-[AB][123]/, (U, c) => tcsVp(U, c) * 100],
  [/^ZT-STn904/, U => Math.min(100, (+U.gv || 0) * 100)],
  [/^ZT-STn905-[AB][456]/, U => (U.tb ? U.tb.icv * 100 : 0)],
  [/^PS-LOn004/, U => U.loBrg],
  [/^PT-LOn923/, U => U.loEop],
  [/^ICV TO CV TRANSFER COMPLETED?$/, U => (U.tb && U.tb.xfer ? 1 : 0)],
  [/^52G OPEN$/, U => (U.tb && (U.tb.st === 'sync' || U.tb.st === 'load') ? 0 : 1)],
  [/^TURBINE TRIP$/, (U, c) => (c.trip ? 1 : 0)],
  [/^MSV([AB]) FULL OPEN/, (U, c) => (tcsVp(U, c) >= 1 ? 1 : 0)],
  /* 3.2.1 c2 (LISA, 310SC90-773 rev 2 DIGITAL OUTPUT 31 ~ 35, DCS -> TCS): the heater / deaerator levels VERY HIGH close the extraction
     non-return valves (TC-36 / 41 / 42 / 44 / 45). The DCS sends them from DITL-115 TURBINE SYSTEM INTERFACE SIGNALS (location TCS), outputs
     NO.1 LPH / NO.1 HPH / DEAERATOR STORAGE TANK / NO.3 LPH / NO.2 LPH LEVEL H.H. (M.0183 / 0193 / 0161 / 0233 / 0213 of ABC-037 / 035 / 031 /
     039 / 038, the DCS logic with its own voting). The model has one transmitter, so A, B (C) read the same value */
  [/^NO\.1 LP HEATER LEVEL VERY HIGH/, () => tcsDitlOut('DITL-115', /^NO\.1 LPH LEVEL H\.H/)],
  [/^NO\.1 HP HEATER LEVEL VERY HIGH/, () => tcsDitlOut('DITL-115', /^NO\.1 HPH LEVEL H\.H/)],
  [/^NO\.2 LP HEATER LEVEL VERY HIGH/, () => tcsDitlOut('DITL-115', /^NO\.2 LPH LEVEL H\.H/)],
  [/^NO\.3 LP HEATER LEVEL VERY HIGH/, () => tcsDitlOut('DITL-115', /^NO\.3 LPH LEVEL H\.H/)],
  [/^DEAERATOR STORAGE TANK LEVEL VERY HIGH/, () => tcsDitlOut('DITL-115', /^DEAERATOR STORAGE TANK LEVEL H\.H/)],
  /* c2 gap 3 (310SC90-773 rev 2 DO 42 DOZSO-AV1391, DCS -> TCS): CONDENSER VACUUM BREAK COMPLETE = the DITL-115 output of the same name
     (I.0215 ZSO-AV1391, the vacuum breaker position of DITL-56); IBD TE-6 #32 and TE-7 #5. Read only */
  [/CONDENSER VACUUM BREAK COMPLETE$/, () => tcsDitlOut('DITL-115', /^CONDENSER VACUUM BREAK COMPLETE/)]
];
/* c2 gap 2 (310SC90-773 rev 2 DO 36 / 38 / 39 / 43 / 44 / 45, DCS -> TCS): the answer back of the drain valves, sent by DITL-115. By net, as
   the reader did not read every name (TE-6 net 19 is the FULL CLOSE answer back, circle 61 AS01 on the IBD page 94; nets 7 and 26 the FULL
   OPEN answer back, circle 62). MV-ASn393 (IBD TE-1) is the drain valve that the DCS drives as MV-AS1394 (DITL-75, the TCS commands I.0407 /
   I.0408 of the I/O list), MV-ASn397 (TE-6) is MV-AS1397 (DITL-116) */
const TCS_IBD_NET = {
  'TE-1': {
    40: () => tcsDitlOut('DITL-115', /^TURBINE WARMING VALVE INLET DRAIN MOTOR VALVE OP/),
    44: () => tcsDitlOut('DITL-115', /^TURBINE WARMING VALVE INLET DRAIN MOTOR VALVE CL/),
    /* c2 batch 3: TE-ST1001-1 HP TURBINE FIRST STAGE INNER WALL METAL TEMP. (page 90) = c.Thp of the ATS model (tcs.js) */
    12: U => (U.tc ? U.tc.Thp : NaN)
  },
  'TE-3': { 1: () => tcsDitlOut('DITL-115', /^TURBINE WARMING VALVE INLET DRAIN MOTOR VALVE AU/) },
  'TE-6': {
    7: () => tcsDitlOut('DITL-115', /^TURBINE GLAND STEAM LINE DRAIN VALVE OPEN/),
    26: () => tcsDitlOut('DITL-115', /^TURBINE GLAND STEAM LINE DRAIN VALVE OPEN/),
    19: () => tcsDitlOut('DITL-115', /^TURBINE GLAND STEAM LINE DRAIN VALVE CLOSE/),
    /* c2 batch 3 (page 94): TE-ST1004-1 / 2 REHEAT BOWL INNER WALL = c.Trh, TE-ST1001-1 HP TURBINE FIRST STAGE = c.Thp (tcs.js) */
    27: U => (U.tc ? U.tc.Trh : NaN),
    28: U => (U.tc ? U.tc.Thp : NaN)
  },
  'TE-8': { 0: () => tcsDitlOut('DITL-115', /^TURBINE GLAND STEAM LINE DRAIN VALVE AUTO/) },
  /* c2 batch 3 (3.2.3): the inputs of the IBD that the model already has a value for. A contact of the TSI with its set point written on the
     sheet is 1 at that set point. TA-18 (IBD page 37): SHAFT VIBRATION HIGH ON >= 0.125 mm; TA-17 (page 36): VERY HIGH ON >= 0.200 mm, X = -1,
     Y = -2; VE-ST1001 No.1 / VE-ST1002 No.2 turbine, VE-GE1001 No.3 / VE-GE1002 No.4 generator = loVx1..4 / loVy1..4 of tcsOil (snapshot
     035 SHAFT MONITOR). TA-17 nets 21 / 22 / 23: the second input of the A gate of No.2 / 3 / 4, drawn with no source: the note of page 36
     says it is "similar to No.1", that is ANY OTHER SHAFT VIBRATION HIGH (the OR of the HIGH of the other shafts) */
  'TA-18': Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map(k => [k, U => tcsVib(U, k) >= 0.125])),
  'TA-17': {
    ...Object.fromEntries(
      [
        [0, 0],
        [1, 1],
        [3, 2],
        [4, 3],
        [6, 4],
        [7, 5],
        [9, 6],
        [10, 7]
      ].map(([n, k]) => [n, U => tcsVib(U, k) >= 0.2])
    ),
    21: U => tcsVibHighBut(U, 1),
    22: U => tcsVibHighBut(U, 2),
    23: U => tcsVibHighBut(U, 3)
  },
  /* TD-2 (page 85): bearing metal temperatures, HIGH ON >= 115 C journal / ON >= 85 C thrust. TE-ST1009 / 1010 No.1 / 2 journal, TE-GE1001 /
     1002 No.3 / 4 = loM1..4; TE-ST1011-1 / -2 thrust front = loThF, TE-ST1012-1 / -2 thrust rear = loThR (tcsOil, snapshot 035) */
  'TD-2': {
    0: U => U.loM1,
    24: U => U.loM2,
    7: U => U.loM3,
    9: U => U.loM4,
    11: U => U.loThF,
    18: U => U.loThF,
    20: U => U.loThR,
    22: U => U.loThR
  },
  /* TA-20 (page 39): TE-ST1003-1 / 2 / 3 HP TURBINE EXHAUST STEAM TEMP. The model has one value there: the cold reheat temperature TT-TS1011
     (unit.js anUnitStepX X.T.cr, the HP exhaust mixed with the HP bypass outlet). The windage heating of the HP blades at low flow is not
     modelled */
  'TA-20': { 4: U => tcsHpx(U), 5: U => tcsHpx(U), 6: U => tcsHpx(U) },
  /* TD-1 (page 84): TE-LO1002-1 / -2 LUBE OIL COOLER OUTLET OIL TEMP., MAX = the cooler outlet of tcsOil (U.loTout, TICLO1002) */
  'TD-1': { 8: U => U.loTout },
  /* TD-4 (page 87): ZE-ST1001 TURBINE SHELL EXPANSION (HP side) = c.sexp of the ATS model (NORMAL ON >= 3 mm, ATS criteria 2.1) */
  'TD-4': { 5: U => (U.tc ? U.tc.sexp : NaN) },
  /* GD-5 (page 99): TE-GE1006-1 ~ 6 GEN. STATOR COIL TEMP. (HIGH ON >= 123 C), TE-GE1004-1 ~ 4 GEN. COOLING GAS AIR (ON >= 50 C), TE-GE1005
     AC EXCITER OUTLET AIR (ON >= 95 C) = the generator temperatures of unit.js anGenTemp (U.genT ts / ta / ex, snapshot 035 SHAFT MONITOR) */
  'GD-5': {
    ...Object.fromEntries([0, 2, 4, 6, 8, 10].map((n, i) => [n, U => (U.genT ? U.genT.ts[i] : NaN)])),
    ...Object.fromEntries([12, 14, 16, 18].map((n, i) => [n, U => (U.genT ? U.genT.ta[i] : NaN)])),
    20: U => (U.genT ? U.genT.ex : NaN)
  }
};
/* the shaft vibration of contact k of TA-18 (0 / 1 No.1 X / Y, 2 / 3 No.2, 4 / 5 No.3, 6 / 7 No.4), mm */
const tcsVib = (U, k) => +U['loV' + (k % 2 ? 'y' : 'x') + ((k >> 1) + 1)] || 0;
/* ANY OTHER SHAFT VIBRATION HIGH: a HIGH (TA-18, >= 0.125 mm) of a shaft other than shaft s (0 = No.1 ... 3 = No.4) */
const tcsVibHighBut = (U, s) => [0, 1, 2, 3, 4, 5, 6, 7].some(k => k >> 1 !== s && tcsVib(U, k) >= 0.125);
const tcsHpx = U => (U.xt && U.xt.T && isFinite(U.xt.T.cr) ? U.xt.T.cr : NaN);
/* c2: the value of a DITL input row (by the tag in its TAG column), of a DITL output (by its RS text) and of an ABC net (by its name), as the
   DCS has them now; 0 / NaN when absent */
const TCS_DCS = { row: {}, abc: {}, out: {} };
function tcsDitlOut(sh, re) {
  try {
    if (typeof S === 'undefined' || !S.sheets) return 0;
    const k = sh + '|' + re.source;
    let r = TCS_DCS.out[k];
    if (!r || S.sheets[r.i] !== r.s) {
      const i = S.sheets.findIndex(x => new RegExp('\\)' + sh + '$').test(x.name)),
        s = S.sheets[i];
      if (s && !s.nl && typeof netlist === 'function') s.nl = netlist(s);
      const o = s && s.nl ? s.nl.outs.find(q => re.test((s.cells[q.row + ':RS'] || []).map(t => t.t).join(' ').trim())) : null;
      r = TCS_DCS.out[k] = { i, s, n: o ? o.n : -1 };
    }
    return r.s && r.n >= 0 && r.s.nl && r.s.nl._v && r.s.nl._v[r.n] ? 1 : 0;
  } catch (e) {
    return 0;
  }
}
function tcsDitlIn(sh, tag) {
  try {
    if (typeof S === 'undefined' || !S.sheets) return 0;
    const k = sh + '|' + tag;
    let r = TCS_DCS.row[k];
    if (!r || S.sheets[r.i] !== r.s) {
      const i = S.sheets.findIndex(x => new RegExp('\\)' + sh + '$').test(x.name)),
        s = S.sheets[i];
      const row = s ? s.rows.findIndex((_, j) => (s.cells[j + ':T'] || []).map(t => t.t).join(' ').trim() === tag) : -1;
      r = TCS_DCS.row[k] = { i, s, row };
    }
    const s = r.s;
    if (!s || r.row < 0) return 0;
    if (!s.nl && typeof netlist === 'function') s.nl = netlist(s);
    const q = s.nl && (s.nl.src || []).find(x => x.row === r.row);
    return q && s.nl._v && s.nl._v[q.n] ? 1 : 0;
  } catch (e) {
    return 0;
  }
}
function tcsAbcV(sh, nm) {
  try {
    if (typeof AN === 'undefined' || !AN.sheets) return NaN;
    const k = sh + '|' + nm;
    let r = TCS_DCS.abc[k];
    if (!r || !r.S || !r.S.rt) {
      const x = AN.sheets.find(p => p.name === sh),
        T = x && x.S;
      const n = T && T.lab ? T.lab.findIndex(z => z && String(z.t).replace(/^S\d\s*/, '').trim() === nm) : -1;
      r = TCS_DCS.abc[k] = { S: T, n };
    }
    return r.S && r.n >= 0 ? +r.S.rt.v[r.n] : NaN;
  } catch (e) {
    return NaN;
  }
}
/* comparators with a variable limit; every fixed set point is read from the words under the block on the sheet (tools/data/ibd_build.mjs) */
const TCS_MST_LOW = U => tcsSteam(U).mst <= tcsLin(TCS_MST, tcsFst(U));
const TCS_DP_HIGH = U => tcsFst(U) - tcsCrp(U) >= tcsLin(TCS_DP, tcsFst(U));
const TCS_IBD_SP = {
  'TA-11@549,560': TCS_MST_LOW,
  'TA-11@549,362': TCS_MST_LOW,
  'TA-11@549,221': TCS_MST_LOW,
  'TA-21@586,581': TCS_DP_HIGH,
  'TA-21@586,440': TCS_DP_HIGH,
  'TA-21@586,295': TCS_DP_HIGH,
  /* d3: the alarm comparators (HIGH / LOW (*2)), the ANN column */
  'TA-11@687,664': U => tcsSteam(U).mst <= tcsLin(TCS_MST_ANN, tcsFst(U)),
  'TA-21@586,732': U => tcsFst(U) - tcsCrp(U) >= tcsLin(TCS_DP_ANN, tcsFst(U)),
  /* TE-6: ON <= 150 C, OFF >= 155 C (words on the sheet with a gap the reader did not join) */
  'TE-6@408,498': [0, 150, 155, 'C'],
  /* the partial close test of the control valves (TA-33, TA-34: ON <= PRESENT POSITION -10 %) and the eccentricity (TD-4: ON >= ACTUAL VALUE x 1.1) are not
     modelled: no test runs and the eccentricity has no value, so these comparators stay 0 */
  'TA-33@465,381': () => false,
  'TA-34@465,381': () => false,
  'TD-4@408,686': () => false
};
/* the oil pumps run through their sheets (TB-1, TB-2, TB-21, TB-22): the pump state goes in as the memories of the sheet, the sheet may change it:
   AUTO start of the standby (other pump running 10 s or 15 s AND its discharge LOW), stop of a control oil pump on BEARING OIL PRESS. VERY LOW
   TRIP. auto, run: nets of the AUTO and RUN memories, fb: the running contact. The operator's commands stay in tcsOilCmd */
const TCS_IBD_PUMP = {
  'TB-1': { k: 'mop', i: 0, auto: 1, run: 11, fb: 21 },
  'TB-2': { k: 'mop', i: 1, auto: 1, run: 11, fb: 21 },
  'TB-21': { k: 'cop', i: 0, auto: 0, run: 11, fb: 23 },
  'TB-22': { k: 'cop', i: 1, auto: 0, run: 11, fb: 23 }
};
/* TB-22: the A gate after the 15 s timer has no word the reader finds; the sheet is the same as TB-21 */
/* TD-2 (page 85): each A gate to the ATS (criteria 1.30 / 1.31) takes the four HIGH comparators through a NOT circle; the reader found one NOT
   per gate (nets 1 -> 2, 12 -> 13) and took the other three pins for inputs with stray words (nets 3, 4, 5 and 14, 15, 16). The missing NOT
   circles are added here, where the reader saw those words, and the stray inputs are taken off (TCS_IBD_DROP) */
const TCS_IBD_PATCH = {
  'TB-22': [['A', [14, 18], 15, 0, 0, 0]],
  'TD-2': [
    ['NOT', [25], 3, 0, 555, 216, 0, 0],
    ['NOT', [8], 4, 0, 555, 249, 0, 0],
    ['NOT', [10], 5, 0, 555, 227, 0, 0],
    ['NOT', [19], 14, 0, 555, 486, 0, 0],
    ['NOT', [21], 15, 0, 555, 520, 0, 0],
    ['NOT', [23], 16, 0, 555, 498, 0, 0]
  ]
};
const TCS_IBD_DROP = { 'TD-2': [3, 4, 5, 14, 15, 16] };
const TCS_IBD = {
  by: {},
  bind: null
};
/* the MFT of the one world (DITL-03A), read from the engine's last scan; false with no world */
function tcsMft() {
  try {
    const W = window.WORLD;
    if (!W || !W.on || typeof S === 'undefined') return false;
    /* by index: a Reset makes the sheets again */
    if (!(S.sheets[TCS.d3i] && /DITL-03A$/.test(S.sheets[TCS.d3i].name)))
      TCS.d3i = S.sheets.findIndex(x => /DITL-03A$/.test(x.name));
    const s = S.sheets[TCS.d3i];
    const o = s && s.nl && s.nl.outs.find(x => x.row === TCS_MFT_ROW);
    return !!(o && s.nl._v && s.nl._v[o.n]);
  } catch (e) {
    return false;
  }
}
/* once: the sheets by name, the source of each off-page link, the field value of each named input */
function tcsIbdBind() {
  if (TCS_IBD.bind) return TCS_IBD.bind;
  const L = [];
  for (const s of TCS_IBD_SHEETS) TCS_IBD.by[s.id] = s;
  for (const id in TCS_IBD_PATCH) if (TCS_IBD.by[id]) TCS_IBD.by[id].g.push(...TCS_IBD_PATCH[id]);
  for (const id in TCS_IBD_DROP) if (TCS_IBD.by[id]) TCS_IBD.by[id].i = TCS_IBD.by[id].i.filter(i => !TCS_IBD_DROP[id].includes(i[0]));
  for (const s of TCS_IBD_SHEETS) {
    const r = { s, link: [], pv: [], mft: [] },
      driven = new Set(s.g.map(g => g[2]));
    for (const [net, num, to, dep] of s.x) {
      if (!dep) continue;
      const b = TCS_IBD.by[to.split('/')[0]],
        h = b && b.x.find(x => !x[3] && x[1] === num && x[2].includes(s.id));
      if (h) r.link.push([net, b.id, h[0]]);
    }
    for (const [net, name] of s.i) {
      if (/BOILER MFT/.test(name)) r.mft.push(net);
      const p = TCS_IBD_PV.find(q => q[0].test(name));
      if (p && !driven.has(net)) r.pv.push([net, p[1]]);
    }
    /* c2: the inputs given by net (TCS_IBD_NET) */
    const nf = TCS_IBD_NET[s.id];
    if (nf) for (const k in nf) if (!driven.has(+k) && !r.pv.some(q => q[0] === +k)) r.pv.push([+k, nf[k]]);
    L.push(r);
  }
  return (TCS_IBD.bind = L);
}
const tcsIb = c =>
  c.ib ||
  (c.ib = {
    v: {},
    t: {},
    cmp: {},
    fx: {},
    pb: {},
    r1: false,
    t0: 0,
    first: '',
    at: 0,
    ext: false,
    mft0: false,
    rst0: false
  });
/* a time written on a timer of the sheet, seconds */
const tcsIbdT = x => {
  const m = /^([0-9.]+) *(s|sec|min)/i.exec(String(x || ''));
  return m ? +m[1] * (m[2].toLowerCase() === 'min' ? 60 : 1) : 0;
};
function tcsIbdStep(U, c, dt) {
  const ib = tcsIb(c),
    B = tcsIbdBind();
  tcsValves(U, c, ib, dt);
  for (const r of B) {
    const s = r.s,
      id = s.id,
      v = ib.v[id] || (ib.v[id] = new Array(s.n).fill(0));
    for (const [net, sh, n] of r.link) v[net] = (ib.v[sh] && ib.v[sh][n]) || 0;
    for (const [net, f] of r.pv) v[net] = +f(U, c);
    if (r.mft.length) for (const net of r.mft) v[net] = ib.mft0 && tcsMft() ? 1 : 0;
    if (id === 'TA-1') {
      /* the push buttons of TA-1 and the ATS AUTO RESET COMMAND (the ATS program sets c.rst, tcs.js) */
      if (c.rst && !ib.rst0)
        ib.pb.auto = 2; /* held 2 s: a (WO) of the trip sheets needs the command through its own scan */
      for (const [net, name] of s.i) {
        if (/RESET ON|TURBINE RESET/.test(name)) v[net] = ib.pb.rst > 0 ? 1 : 0;
        else if (/AUTO RESET/.test(name)) v[net] = ib.pb.auto > 0 ? 1 : 0;
        else if (/PB|CONTROL ROOM|TCS HMI/.test(name)) v[net] = ib.pb.trip > 0 ? 1 : 0;
      }
    }
    const pu = TCS_IBD_PUMP[id];
    if (pu && c[pu.k]) {
      v[pu.auto] = c[pu.k + 'Au'][pu.i] ? 1 : 0;
      v[pu.run] = v[pu.fb] = c[pu.k][pu.i] ? 1 : 0;
    }
    for (const k in ib.fx) if (k.startsWith(id + ':')) v[+k.split(':')[1]] = ib.fx[k];
    if (id === 'TA-9' && ib.pb.sd > 0) {
      const r = s.i.find(i => /TURBINE SHUTDOWN COMMAND/.test(i[1]));
      if (r) v[r[0]] = 1;
    }
    /* two passes: a chain of gates settles in one step */
    for (let pass = 0; pass < 2; pass++)
      s.g.forEach((g, i) => {
        const [t, ins, out, x] = g;
        if (out < 0) return;
        const a = ins.map(n => v[n] || 0);
        let o = 0;
        if (t === 'A') o = a.length && a.every(q => q > 0.5) ? 1 : 0;
        else if (t === 'OR') o = a.some(q => q > 0.5) ? 1 : 0;
        else if (t === 'NOT') o = a[0] > 0.5 ? 0 : 1;
        else if (t === '2/3') o = a.filter(q => q > 0.5).length >= 2 ? 1 : 0;
        else if (t === 'WO') o = a[0] > 0.5 && !(v[x[0]] > 0.5) ? 1 : 0;
        else if (t === 'FF') o = x.some(n => v[n] > 0.5) ? 0 : ins.some(n => v[n] > 0.5) ? 1 : v[out];
        else if (t === 'MID') {
          const q = ins
            .map(n => v[n])
            .filter(isFinite)
            .sort((p, w) => p - w);
          o = q.length ? q[(q.length - 1) >> 1] : NaN;
        } else if (t === 'CMP') {
          const sp = TCS_IBD_SP[id + '@' + g[4] + ',' + g[5]];
          let pv = v[ins[0]];
          /* the speed set points of TA-15 are written in % of 3600 rpm */
          if (x && x[3] === '%' && id === 'TA-15') pv = (pv / 3600) * 100;
          const xs = Array.isArray(sp) ? sp : x;
          if (typeof sp === 'function') o = sp(U) ? 1 : 0;
          else if (!xs || !isFinite(pv)) o = 0;
          else if (xs[0]) o = pv >= xs[1] || (v[out] > 0.5 && pv > xs[2]) ? 1 : 0;
          else o = pv <= xs[1] || (v[out] > 0.5 && pv < xs[2]) ? 1 : 0;
        } else if (t === 'DI' || t === 'DT' || t === 'PO') {
          const k = id + ':' + i,
            T = tcsIbdT(x),
            on = a[0] > 0.5;
          if (pass === 0) {
            if (t === 'DI') ib.t[k] = on ? (ib.t[k] || 0) + dt : 0;
            else if (t === 'DT') ib.t[k] = on ? T : Math.max(0, (ib.t[k] || 0) - dt);
            else {
              if (on && !ib.t[k + 'e']) ib.t[k] = T;
              ib.t[k + 'e'] = on ? 1 : 0;
              ib.t[k] = Math.max(0, (ib.t[k] || 0) - dt);
            }
          }
          o =
            t === 'DI' ? (on && ib.t[k] >= T ? 1 : 0) : t === 'DT' ? (on || ib.t[k] > 0 ? 1 : 0) : ib.t[k] > 0 ? 1 : 0;
        } else
          o =
            a[0] ||
            0; /* FG, LS, FLK: the value passes; a sheet that needs them has its comparator as a function above */
        v[out] = o;
      });
    for (const k in ib.fx) if (k.startsWith(id + ':')) v[+k.split(':')[1]] = ib.fx[k];
  }
  /* what the sheets did to the pumps; TB-1 and TB-2 note: TCS MAJOR TROUBLE starts the main oil pumps */
  if (c.mop) {
    for (const id in TCS_IBD_PUMP) {
      const pu = TCS_IBD_PUMP[id];
      c[pu.k][pu.i] = ib.v[id][pu.run] > 0.5;
    }
    const a = TCS_IBD.by['TA-9'].i.find(i => /TCS MAJOR TROUBLE/.test(i[1]));
    if (a && ib.v['TA-9'][a[0]] > 0.5) c.mop = [true, true];
    tcsOilSet(c);
  }
  tcsI0400(U, ib);
  ib.rst0 = !!c.rst;
  ib.pb.trip = Math.max(0, (ib.pb.trip || 0) - dt);
  /* Mina T3 / N2, 3.2.3-beta.4: the refused reset was written by the page from its own copy of the sheets (Worker ON: no TA-9 values, held = []).
     The engine writes it now, at the end of the 1.5 s push button, from its own values: the TA-9 trip inputs at 1, else the MFT of DITL-03A
     (TA-9 BOILER MFT 1 / 2 into the TURBINE TRIP COMMAND of TA-1) */
  if (ib.pb.rst > 0 && ib.pb.rst - dt <= 0 && c.trip && window.lsEventAdd && !(window.ENG && ENG.mode === 'mirror')) {
    /* Mina B6-1, beta.6: BOILER MFT 1 and 2 both lit read 'BOILER MFT, BOILER MFT' (the numbers are taken off the names): one name each,
       and the MFT gets its hint whether TA-9 shows it or not */
    const h = [...new Set((tcsTripState(U).held || []).filter(Boolean))].filter(x => x !== 'BOILER MFT');
    if (tcsMft() || (tcsTripState(U).held || []).includes('BOILER MFT')) h.unshift('BOILER MFT (DITL-03A MFT active: reset the MFT first)');
    lsEventAdd('TCS TA-1', 'TCS', 'TURBINE RESET refused: the trip is still held by ' + (h.length ? h.join(', ') : 'the TURBINE TRIP COMMAND of IBD TA-9'));
  }
  ib.pb.rst = Math.max(0, (ib.pb.rst || 0) - dt);
  ib.pb.sd = Math.max(0, (ib.pb.sd || 0) - dt);
  ib.pb.auto = Math.max(0, (ib.pb.auto || 0) - dt);
}
/* the event of the engine only: a mirror page gets it from the worker */
const tcsTripLog = n => {
  if (window.lsEventAdd && !(window.ENG && ENG.mode === 'mirror'))
    lsEventAdd('TCS TA-9', 'TRIP', 'TURBINE TRIP, first out: ' + n);
};
/* Mina N1, 3.2.3-beta.4: a good Turbine reset had no line of its own. The reset of TA-1 is logged by the engine as a TCS event */
const tcsResetLog = () => {
  if (window.lsEventAdd && !(window.ENG && ENG.mode === 'mirror')) lsEventAdd('TCS TA-1', 'TCS', 'TURBINE RESET: trip cleared');
};
/* the name of a row of TA-9 without its off-page number */
const tcsIbdName = n =>
  n
    .replace(/SH-.*$/, '')
    .replace(/\(\*[0-9]\)/g, '')
    .replace(/\b[0-9]+\b/g, '')
    .replace(/ +/g, ' ')
    .trim();
function tcsTripFirst(c) {
  const ib = tcsIb(c),
    s = TCS_IBD.by['TA-9'],
    v = ib.v['TA-9'] || [];
  if (ib.pb.trip > 0) return 'MANUAL TRIP';
  const r = s && s.i.find(i => v[i[0]] > 0.5);
  return r ? tcsIbdName(r[1]) : 'TURBINE TRIP COMMAND';
}
/* every step of the TCS, no trip standing (tcsStep) */
function tcsTripScan(U, dt) {
  const c = tcsOilState(U),
    tb = U.tb,
    ib = tcsIb(c);
  /* Start at 150 MW has no ATS program (U.tc null): the oil state carries the trip, the running turbine is reset */
  if (!U.tc) c.rst = !!(tb && tb.st !== 'off');
  /* the I.0400 of the drawing went back to 0 by itself (a forced test input): the name of that trip goes with it */
  if (ib.ext) {
    ib.ext = false;
    ib.first = '';
  }
  ib.t0 += dt;
  ib.rsd = false;
  if (!tcsMft()) ib.mft0 = true;
  const a = !!(ib.v['TA-1'] && ib.v['TA-1'][TA1_RESET] > 0.5);
  /* a push button held now (Turbine trip, ATS shut-down): plant plan 4B, the Instructor trip at t = 0 after a 150 MW load fell inside the 2 s below */
  const pb = ib.pb.trip > 0 || ib.pb.sd > 0;
  tcsIbdStep(U, c, dt);
  const b = ib.v['TA-1'][TA1_RESET] > 0.5;
  if (b) {
    ib.r1 = true;
    if (c.trip) {
      c.trip = '';
      ib.first = '';
      tcsResetLog();
      const l = U.vtrip;
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = 0;
    }
  }
  /* the first 2 s of a run: the values settle from the starting state; an operator push button in them is kept for the end of the 2 s */
  if (ib.t0 < 2) {
    if (pb) ib.pm = ib.pb.trip > 0 ? 'MANUAL TRIP' : ib.pm || 'pb';
    return;
  }
  const pm = ib.pm;
  ib.pm = '';
  if (((a && !b) || (pm && !b)) && !c.trip && (tb.st !== 'off' || tb.rpm > 4)) {
    ib.first = pm === 'MANUAL TRIP' ? pm : tcsTripFirst(c);
    ib.at = +U.t || 0;
    c.trip = ib.first;
    tcsTripLog(ib.first);
  }
}
/* I.0400 stands: the sheets go on, so a Turbine reset is seen; a trip that did not pass TA-1 still gets its name */
function tcsTripHold(U, dt) {
  const c = tcsOilState(U),
    ib = tcsIb(c);
  tcsIbdStep(U, c, dt);
  if (ib.v['TA-1'][TA1_RESET] > 0.5 && c.trip) {
    c.trip = '';
    ib.first = '';
    /* Mina N1, 3.2.3-beta.4: after a good reset the DCS trip input I.0400 still stood for some scans (the stop valves are still shut,
       TA-6), so the next scan named it a new trip 'TURBINE TRIP (DCS I.0400)'. What is left of the trip just reset is no new trip:
       ib.rsd holds until I.0400 falls (tcsTripScan); a new TA-9 trip input or the trip push button still trips */
    ib.rsd = true;
    tcsResetLog();
    const l = U.vtrip;
    if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = 0;
    return;
  }
  if (ib.first) return;
  if (ib.rsd && !(ib.pm === 'MANUAL TRIP' || ib.pb.trip > 0) && !(tcsTripState(U).held || []).length) return;
  ib.rsd = false;
  /* Mina T1, 3.2.3-beta.1: a Turbine trip pressed in the first 2 s after a state load set I.0400 before the scan named it, so the log said
     TURBINE TRIP (DCS I.0400) while page 13 said MANUAL TRIP. The push button kept (ib.pm) or still held names the trip */
  const pm = ib.pm === 'MANUAL TRIP' || ib.pb.trip > 0;
  ib.pm = '';
  const v = !pm && isFinite(U.cdP) && U.cdP > AN_CD.Ptrip;
  ib.first = pm ? 'MANUAL TRIP' : v ? 'CONDENSER VACUUM VERY LOW TRIP' : 'TURBINE TRIP (DCS I.0400)';
  if (pm && !c.trip) c.trip = ib.first;
  ib.at = +U.t || 0;
  ib.ext = !v && !pm;
  tcsTripLog(ib.first);
}
/* TA-1 TURBINE TRIP P.B. */
/* the action runs on the mirror page too; only the engine writes the trip state: a write here would mark the whole slot as the page's own,
   the page would skip the engine's answer and keep the old first out (Mina item 14 / 16: TRIPPED after a good reset) */
const tcsMirror = () => !!(window.ENG && ENG.mode === 'mirror');
function tcsTripManual(U) {
  if (tcsMirror()) return '';
  const c = tcsOilState(U),
    ib = tcsIb(c);
  if (c.trip) return 'The turbine is already tripped: ' + c.trip;
  ib.pb.trip = 1.5;
  return '';
}
/* the ATS SHUT-DOWN (step 8, 775 page 29): the TURBINE SHUTDOWN COMMAND input of TA-9 (row 18), held as a push button */
function tcsTripShutdown(U) {
  if (tcsMirror()) return '';
  const c = tcsOilState(U),
    ib = tcsIb(c);
  if (c.trip) return 'The turbine is already tripped: ' + c.trip;
  ib.pb.sd = 1.5;
  return '';
}
/* TA-1 TURBINE RESET P.B.: the gates decide; a held TA-9 keeps the A gate at 0 */
function tcsTripReset(U) {
  if (tcsMirror()) return '';
  const ib = tcsIb(tcsOilState(U));
  ib.pb.rst = 1.5;
  if (U.tc) U.tc.sdDone = false;
  return '';
}
/* a signal of a sheet held at a value (a field contact, a test) */
function tcsTripFault(U, a) {
  if (tcsMirror()) return '';
  const ib = tcsIb(tcsOilState(U)),
    k = a.id + ':' + a.net;
  if (a.on == null) delete ib.fx[k];
  else ib.fx[k] = a.on === true ? 1 : a.on === false ? 0 : +a.on;
  return '';
}
/* the first-out name of a standing trip, with or without the ATS program */
const tcsTripNow = U => {
  const c = U.tc || U.tco;
  return c ? c.trip : '';
};
/* what the TCS panel shows */
function tcsTripState(U) {
  const c = U.tc || U.tco;
  if (!c) return null;
  const ib = tcsIb(c);
  /* Mina T3, 3.2.3-beta.1: a Turbine reset refused showed no cause. held = the TA-9 trip inputs at 1 now (a held trip keeps the A gate
     of the reset at 0, IBD TA-1), so the page can say what holds the trip */
  const s = TCS_IBD.by['TA-9'],
    v = ib.v['TA-9'] || [],
    held = s ? s.i.filter(i => v[i[0]] > 0.5).map(i => tcsIbdName(i[1])) : [];
  return { first: ib.first, at: ib.at, held };
}
/* the live values of one sheet, for the drawing */
function tcsIbdState(id) {
  const c = AN_UNIT.tc || AN_UNIT.tco,
    ib = c && c.ib;
  return ib ? { v: ib.v[id] || [], fx: ib.fx, t: ib.t } : null;
}
/* the comparators of the sheets with no set point yet (no assumed value: they stay 0) */
function tcsIbdMissing() {
  const L = [];
  for (const s of TCS_IBD_SHEETS)
    for (const g of s.g)
      if (g[0] === 'CMP' && !g[3] && !TCS_IBD_SP[s.id + '@' + g[4] + ',' + g[5]])
        L.push(s.id + '@' + g[4] + ',' + g[5]);
  return L;
}
