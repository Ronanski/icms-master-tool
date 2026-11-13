/* 3.2.0 P1 #2 (docs/versions/v3.2.0/INSTRUMENT_VALVE_COVERAGE.md): PROTECTION SWITCHES FOLLOW THE PV. A level / pressure switch of the
   field is a DITL input row (DITL-01 LSL / LSH drum level, DITL-03C / 03D / 03E / 03G furnace pressure and drum level H.H. / L.L. of the
   MFT, DITL-23B deaerator L.L. of the BFWPs, DITL-61A hotwell L.L. of the CEPs). With the plant model ON the switch is the plant's: it
   opens or closes when the measured value crosses its set point (alarm list "Alarm List _20160912" sheets LS / PS, document-references/
   alarm-list.zip), with a dead band, and the row is automatic like a row fed by the logic (ditl.js auto). With the plant model OFF the
   user sets the row by hand as before.
   Set points (alarm list): drum level LSL -100, LSH +127, LSHH +254, LSLL -178, LSLL-NC -254 mm; furnace PSHHH +381, PSHH +267,
   PSLL -267 mmH2O (the -NC contact is 1 while NOT in that state); deaerator LSLL-CD1104-4 177 mm from the bottom = -2147 mm of the
   transmitter (normal level 2324 mm = 0); hotwell LSLL-CD1110 450 mm from the bottom = -150 mm (normal 600 mm = 0: the CL line 600 mm
   from the hotwell bottom, condenser outline K1AU3-D1-0-039 R1 p 4, drawing K2MC3A-100; LLL 300, HHL 900). Dead band: 10 mm / 10 mmH2O
   (NO-SOURCE: no switch data sheet in the docs searched). */
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
  /* the ash coolers need the chain conveyor running and no local emergency stop (DITL-21A, IO list MIR-L1090, LIS3-L1060x) */
  L.push(['MIR-L1090', uOf('baConv'), 0.5, 'hi']);
  /* the same contact on the cooler sheets: DITL-21A row 10 I.0163 CHAIN CONVEYOR RUNNING, FROM BAH LOGIC (no link): Mina beta.100 read 0, cooler trip */
  L.push(['I.0163', uOf('baConv'), 0.5, 'hi', 0, undefined, /CHAIN CONVEYOR/, /DITL-21A/]);
  /* the emergency stop LIS3-L1060x sits in the inverter panel box, it has no row: its answer is the row I.0256 / 536 / 646 / 686 (DITL-21A out 62,
     row 18 NOT EMERGENCY STOP). A released N.C. stop gives 1. The tag LIS3 matched no row, so the row stood 0 and tripped the cooler */
  /* 3.2.3-beta.63 (Sakura, ash_fp.js): the switch held the row at 1 on every scan, so the EMERGENCY STOP of the faceplate (the field operator,
     LS_DOCK.fieldRow row 18 = 0) did nothing. The contact follows the field: pressed (the row set to 0 by the field) = 0, RELEASE = 1 again; dead band 0 (a contact, the 10 of the level switches kept it made) */
  for (const a of ['I.0256', 'I.0536', 'I.0646', 'I.0686']) L.push([a, m => (m.s.sig && m.s.sig[m.row + ':S'] === false ? 0 : 1), 0.5, 'hi', 0, 0, /EMERGENCY STOP/, /DITL-21A/]);
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
  /* 3.2.1 (IRENE: FEEDWATER): DITL-23A row 11 (machine instance #B for pump B) "ZSO-FW1031 BFWP A / B SUCTION MANUAL VALVE OPEN"
     (IO list STN102 I.028F ZSO-FW1031 / I.032F ZSO-FW1032), a START permissive of the HV soft starter (with the lube oil > 2.0 and the
     suction pressure > 1.5): the limit switch of the field valve V-FW1001 / 1002 of the plant model (unit.js AN_FV0), touched at fully
     open (PR-OPE-5002 19.16 "Fully OPEN ... Check if the limit switch is touched"). Before: the row stayed 0 and the standby BFWP B
     never started on its AUTO START (O.1400) */
  const fvOf = t => () => (window.AN && AN.fv && isFinite(AN.fv(t)) ? AN.fv(t) : NaN);
  L.push(['ZSO-FW1031', fvOf('V-FW1001'), 100, 'ge', 0, 0, /\bBFWP A\b/], ['ZSO-FW1031', fvOf('V-FW1002'), 100, 'ge', 0, 0, /\bBFWP B\b/]);
  /* 3.2.1 (IRENE: HEATER LEVELS): the level switches H.H. of the heaters (DITL-41 rows 15 ~ 27, STN102 I.029B ~ I.029F) on the
     shell level of the plant model (unit.js AN_HD); alarm list LS-HD110x: 140 mm (No.1 HPH, No.3 LPH), 150 mm (the others) */
  const hdOf = k => () => (window.AN && AN.unit && AN.unit.hdLvl && isFinite(AN.unit.hdLvl[k]) ? AN.unit.hdLvl[k] : NaN);
  L.push(
    ['LS-HD1105', hdOf('H5'), 140, 'ge', 0, 0],
    ['LS-HD1106', hdOf('H6'), 150, 'ge', 0, 0],
    ['LS-HD1101', hdOf('H1'), 150, 'ge', 0, 0],
    ['LS-HD1102', hdOf('H2'), 150, 'ge', 0, 0],
    ['LS-HD1103', hdOf('H3'), 140, 'ge', 0, 0]
  );
  /* 3.2.1 (SEULGI : PLANT MODEL, boiler side, src/analog/engine/boiler.js AN_LM): the field switches of the limestone Rotofeed on the
     DITL-LS sheets (station 104; IO list "Station 104"; the address of station 104, so the sheet name is checked too: I.0169 of station
     103 is another signal). 1 = made: limit switches ZSO / ZSC of the dome and isolating valves, seal pressure switches PS-LM1812 /
     PS-LM1815 (> 5 bar = closed and sealed, O&M L5-3 2.10), LSH-LM1812, LSL-LM1815 (1 = uncovered), PS-PA1811 (< 4 bar), MIR-M1311
     feeder running, MIR-LM1313 vent fan running */
  const lmSw = k => () => (window.AN && AN.unit && AN.unit.lm && isFinite(AN.unit.lm.sw[k]) ? AN.unit.lm.sw[k] : NaN),
    LMS = /\)DITL-LS\d+$/;
  [
    ['I.017B', 'ventO', /VENT DV FO/],
    ['I.017C', 'ventC', /VENT DV FC/],
    ['I.0177', 'lockO', /IN DV FO/],
    ['I.0178', 'lockC', /IN DV FC/],
    ['I.0179', 'dispO', /DISP\. DV FO/],
    ['I.017A', 'dispC', /DISP\. DV FC/],
    ['I.017D', 'balO', /BALANCE DV FO/],
    ['I.017E', 'balC', /BALANCE DV FC/],
    ['I.016D', 'lockSeal', /SEAL PS/],
    ['I.016E', 'dispSeal', /SEAL PS/],
    ['I.0168', 'lsh', /LOCK VESSEL LSH/],
    ['I.0169', 'lsl', /DISPENSING VESSEL LSL/],
    ['I.016A', 'tank', /AIR TANK PRESSURE LOW/],
    ['I.0170', 'run', /ROTOFEEDER RUNNING/],
    ['I.0173', 'fan', /RUNNING/]
  ].forEach(([a, k, re]) => L.push([a, lmSw(k), 0.5, 'hi', 0, 0, re, LMS, k === 'run' ? 1 : 0]));
  /* 3.2.1 d1 (LISA): DITL-01 row 14 MIR-M1311 LIMESTONE FEEDER ROTARY VALVE RUNNING is I.0170 (I/O list "#1 Limestone feeder running"), the same contact as ROTOFEEDER RUNNING above */
  /* Mina beta.18 B18-1 / B16-3: after the 150 MW load the row stood "running" for good (DITL150 field state s.sig = 1, "L-1311 ROTO
     FEEDER running", ORed with this switch): a STOP of the Rotofeed never reached DITL-01 and the purge permissive M.050E stayed 0. The
     feeder running contact is owned by the plant model (index 8 = 1): its field bit is cleared once the model gives a value */
  L.push(['MIR-M1311', lmSw('run'), 0.5, 'hi', 0, 0, null, /\)DITL-01$/, 1]);
  /* 3.2.1 d1 (LISA): DITL-56 row 7 TURBINE SPEED UNDER 2400 RPM I.0406 (location TCS); no ABC sheet carries I.0406.
     c2 gap 5 (310SC90-773 rev 2 DI 29 TCS-DI1029, IBD TA-15): the TCS sends it from the TA-15 comparator of the median speed (net 15, ON below
     2400, OFF at 2450 rpm, drawn at 525,476). Before the TCS state exists: the model speed below 2400 */
  L.push([
    'I.0406',
    () => {
      const st = window.AN && AN.tcsIbd && AN.tcsIbd('TA-15');
      if (st && st.v && st.v.length) return st.v[15] > 0.5 ? 1 : 0;
      const r = uOf('rpm')();
      return isFinite(r) ? (r < 2400 ? 1 : 0) : NaN;
    },
    0.5,
    'hi',
    0,
    0,
    null,
    /\)DITL-56$/
  ]);
  'ABCDEFGH'.split('').forEach((x, i) => {
    L.push(['I.02' + (2 * i).toString(16).toUpperCase().padStart(2, '0'), lmSw('isoO' + i), 0.5, 'hi', 0, 0, /ISOLATING VALVE . OPEN LIMIT/, LMS]);
    L.push(['I.02' + (2 * i + 1).toString(16).toUpperCase().padStart(2, '0'), lmSw('isoC' + i), 0.5, 'hi', 0, 0, /ISOLATING VALVE . CLOSE LIMIT/, LMS]);
  });
  /* 3.2.1 (SEULGI, boiler.js AN_SD): the field switches of the sand vessel on the sand drawings DITL-771 ~ 777 (rows by their terminal
     text, no address on these drawings; 1 = made) */
  const sdSw = k => () => (window.AN && AN.unit && AN.unit.sd && isFinite(AN.unit.sd.sw[k]) ? AN.unit.sd.sw[k] : NaN);
  [
    ['INLET', 'dvO', /^INLET DV FULLY OPEN LS/, /\)DITL-772$/],
    ['INLET', 'dvC', /^INLET DV FULLY CLOSE LS/, /\)DITL-772$/],
    ['INLET', 'seal', /^INLET DV SEAL PRESSURE SW/, /\)DITL-772$/],
    ['VESSEL', 'plow', /^VESSEL PRESSURE LOW/, /\)DITL-772$/],
    ['VESSEL', 'outO', /^VESSEL OUTLET VALVE OPEN/, /\)DITL-772$/],
    ['VESSEL', 'lsh', /^VESSEL LEVEL HIGH/, /\)DITL-771$/],
    ['VENT', 'ventO', /^VENT VALVE FULLY OPEN LS/, /\)DITL-775$/],
    ['VENT', 'ventC', /^VENT VALVE FULLY CLOSE LS/, /\)DITL-775$/],
    ['OUTLET', 'outO', /^OUTLET VALVE FULLY OPEN LS/, /\)DITL-775$/],
    ['OUTLET', 'outC', /^OUTLET VALVE FULLY CLOSE LS/, /\)DITL-775$/],
    ['CONV.', 'caO', /^CONV\. AIR VALVE FULLY OPEN LS/, /\)DITL-775$/],
    ['CONV.', 'caC', /^CONV\. AIR VALVE FULLY CLOSE LS/, /\)DITL-775$/],
    ['AIR', 'tank', /^AIR RECE\. TANK PRESSURE LOW/, /\)DITL-775$/],
    ['ISO.', 'isoAO', /^ISO\. VALVE -1 FULLY OPEN LS/, /\)DITL-776$/],
    ['ISO.', 'isoBO', /^ISO\. VALVE -2 FULLY OPEN LS/, /\)DITL-776$/],
    ['ISO.', 'isoAC', /^ISO\. VALVE -1 FULLY CLOSE LS/, /\)DITL-776$/],
    ['ISO.', 'isoBC', /^ISO\. VALVE -2 FULLY CLOSE LS/, /\)DITL-776$/],
    ['SAND', 'siloH', /^SAND SILO LH/, /\)DITL-774$/],
    ['SAND', 'siloL', /^SAND SILO LOW/, /\)DITL-774$/],
    ['SAND', 'fan', /^SAND SILO VENT FILTER RUNNING/, /\)DITL-774$/],
    ['VENT', 'fan', /^VENT FILTER RUNNING$/, /\)DITL-777$/],
    /* 3.2.1 d1 (LISA): DITL-771 rows 12 / 13 read the same contacts by address (I.0573 PS-SD1804 seal pressure, I.0575 PS-SD1800 vessel
       pressure low, I/O list STN103) */
    ['INLET', 'seal', /^INLET DV SEAL PR\. OK/, /\)DITL-771$/],
    ['VESSEL', 'plow', /^VESSEL PRES\. LOW/, /\)DITL-771$/]
  ].forEach(([w, k, re, sh]) => L.push([w, sdSw(k), 0.5, 'hi', 0, 0, re, sh]));
  /* 3.2.1 (SEULGI, boiler.js AN_BA): the field switches of the bottom ash transmitter (IO list station 103 I.0482 ~ I.048F, by address on
     the DITL-BA sheets: station 104 reuses these addresses for the coal feeders) and of the mechanical conveyors (DITL-BA59 / BA60 rows by
     tag, no address). 1 = made: ZSO / ZSC of the inlet, outlet, venting and pressing valves, PSH-BH1750, PSL-BH1750 (1 = low),
     PS-BH1750 (1 = air tank low), LS-BH1750; remote selectors at REMOTE, local emergency stop contacts closed (N.C.), speed switches */
  const baSw = k => () => (window.AN && AN.unit && AN.unit.ba && isFinite(AN.unit.ba.sw[k]) ? AN.unit.ba.sw[k] : NaN),
    BAS = /\)DITL-BA\d+$/;
  [
    ['I.0482', 'inlO'], ['I.0483', 'inlC'], ['I.0484', 'outO'], ['I.0485', 'outC'], ['I.0486', 'ventO'], ['I.0487', 'ventC'],
    ['I.0488', 'prsO'], ['I.0489', 'prsC'], ['I.048A', 'psh'], ['I.048B', 'psl'], ['I.048D', 'air'], ['I.048F', 'lsh']
  ].forEach(([a, k]) => L.push([a, baSw(k), 0.5, 'hi', 0, 0, null, BAS]));
  [
    ['MIL-L-1090', 'rem'], ['MIL-L-1091', 'rem'], ['MIL-L-1092', 'rem'], ['MIL-S-1092-A', 'rem'], ['MIL-S-1092-B', 'rem'], ['MIL-F-1091', 'rem'],
    ['ES-L-1090', 'es'], ['ES-L-1091', 'es'], ['ES-L-1092', 'es']
  ].forEach(([a, k]) => L.push([a, baSw(k), 0.5, 'hi', 0, 0, null, /\)DITL-BA59$/]));
  /* the bottom ash transmitter conveys to the sand silo (DITL-BA02 row 12 SAND SILO HI LEVEL, DITL-BA05 / BA03 rows MIR-M1301): its charge
     waits for the sand silo venting fan F-1301 running, the same field contact as the sand drawings (boiler.js AN_SD fan; 20.PNG: stopped) */
  L.push(['MIR-M1301', sdSw('fan'), 0.5, 'hi', 0, 0, null, BAS]);
  /* 3.2.1 d2 (LISA): rows of the d1 list with no source.
     - the remote selector of the sand silo venting fan F-1301 (DITL-BA03 row 5, BA11 row 1 MIL-M1301; sand DITL-774 row 13 I.0572 REMOTE):
       at REMOTE as the other local selectors of the ash handling (20.PNG F-1301 VENTING FAN "R")
     - the sand silo level on the bottom ash drawings (DITL-BA63 row 11, BA65 rows 10 / 11 LISD1800.PV, the set points written on the
       rows: < 60 %, > 80 %): the silo of the sand model (boiler.js AN_SD, LT-SD1800, 20.PNG 50.1 %)
     - the running contacts of the vibrating screens S-1092-A / B (DITL-BA59 rows 11 / 13 MIR-S-1092-A / B): made while their MCC start
       command is on (DITL-BA63 outputs VIBRATING SCREEN-A / -B ON COMMAND); the delay of the motor contact is NO-SOURCE (none) */
  L.push(['MIL-M1301', baSw('rem'), 0.5, 'hi', 0, 0, null, BAS]);
  L.push(['REMOTE', baSw('rem'), 0.5, 'hi', 0, 0, /^REMOTE$/, /\)DITL-774$/]); /* the drawing reads "I.0572 REMOTE", the row text "REMOTE" */
  /* 3.2.1 (LISA, Mina fresh 150 MW: header SYSTEM TRIP DITL-777): the sand injection system remote selector SIL-SD1300 (I/O list STN103 I.057A
     "#1 Boiler sand injection system remote"; DITL-771 row 5 -> M.081D REMOTE CONTROL -> DITL-777 row 3; NOT REMOTE CONTROL is in the OR of
     SYSTEM TRIP, E10210-3-777) had no source and read 0. 20.PNG at 149.5 MW: "SAND SYSTEM REMOTE" checked (1). The selector stands at REMOTE */
  L.push(['(SIL-SD1300)', baSw('rem'), 0.5, 'hi', 0, 0, null, /\)DITL-77\d$/]);
  /* 3.2.1 d1 (LISA): the sootblower positions from the lance travel of world.js (sbLance; Diamond Power N11639-SC1). 18.PNG (150 MW): all
     retracted, no blowing, the state they start from. The retract limit switch of each lance (DITL-80G row 12 ZSR-N1011 and its 27 copies),
     ANY ON EXTEND (M.4232: a lance at its front end) and the ALL ON RETRACT memories that DITL-80L makes (M.4008 every lance and N-1040 /
     N-1042; M.4246 N-1011 ~ 22, 25, 26; M.4240 N-1023, 24, 27 ~ 34; M.4242 N-1035 ~ 38; DITL-80L is not in the app, read on its PDF).
     Mina beta.173: DITL-80A row 13 M.4008 (FROM DITL80L) too: it is the "All blowers on retract position" of page 18. The air
     heater blowers N-1040 / N-1042 (DITL-80K) have no travel data in the table: their reset positions stand at rest (18.PNG) */
  const sbL = () => (W.sbLances ? W.sbLances() : []),
    sbIn = (a, b) => L0 => L0.n >= a && L0.n <= b,
    sbGrp = {
      'M.4008': () => true,
      'M.4246': L0 => (L0.n >= 1011 && L0.n <= 1022) || L0.n === 1025 || L0.n === 1026,
      'M.4240': L0 => L0.n === 1023 || L0.n === 1024 || sbIn(1027, 1034)(L0),
      'M.4242': sbIn(1035, 1038)
    };
  L.push(['SOOTBLOWER', m => (m && m.s._lance ? (m.s._lance.x <= 0 ? 1 : 0) : 1), 0.5, 'hi', 0, 0, /SOOTBLOWER RETRACT POSITION/, /\)DITL-80G( #N-\d+)?$/]);
  L.push(['M.4232', () => (sbL().some(x => x._lance.x >= x._lance.len) ? 1 : 0), 0.5, 'hi', 0, 0, /ANY ON EXTEND/, /\)DITL-80G( #N-\d+)?$/]);
  /* 3.2.3 SOHEE: the air heater blowers leave their reset position while they blow (unit.js AN_SB.aph: hot end N-1040, then cold end N-1042) */
  const aphPh = () => (window.AN && AN.unit && AN.unit.sbA ? AN.unit.sbA.ph : 0);
  L.push(['AIR', () => (aphPh() === 1 ? 0 : 1), 0.5, 'hi', 0, 0, /N-1040.*S\/B RESET POSITION/, /\)DITL-80K$/]);
  L.push(['AIR', () => (aphPh() === 2 ? 0 : 1), 0.5, 'hi', 0, 0, /N-1042.*S\/B RESET POSITION/, /\)DITL-80K$/]);
  /* DITL-80S row 17 reads M.4008 too (S/B STEAM SUPPLY MOTOR VALVE CLOSE COMMAND; DITL-80L PDF sheet 15: "TO: 80-5, 80A-14, 80S-17, 80K-5") */
  for (const k in sbGrp) L.push([k, () => (sbL().every(x => !sbGrp[k](x._lance) || x._lance.x <= 0) && (k !== 'M.4008' || !aphPh()) ? 1 : 0), 0.5, 'hi', 0, 0, /ALL ON RETRACT/, /\)DITL-80[AGKOS]?( #N-\d+)?$/]);
  const sdSilo = () => (window.AN && AN.unit && AN.unit.sd && isFinite(AN.unit.sd.silo) ? AN.unit.sd.silo : NaN);
  L.push(['LISD1800.PV', sdSilo, 60, 'lo', 0, 0, /< ?60 ?%/, /\)DITL-BA6[35]$/]);
  L.push(['LISD1800.PV', sdSilo, 80, 'hi', 0, 0, /> ?80 ?%/, /\)DITL-BA65$/]);
  const scrOn = re => () => {
    const s = (scrOn.s = scrOn.s || ((typeof S !== 'undefined' && S.sheets) || []).find(x => /\)DITL-BA63$/.test(x.name)));
    const o = s && W._o && W._o[s.name];
    if (!o || !s.nl) return NaN;
    const r = (s.nl.outs || []).map(q => q.row).find(i => re.test((s.cells[i + ':RS'] || []).map(t => t.t).join(' ')));
    return r == null ? NaN : o.has(r) ? 1 : 0;
  };
  L.push(['MIR-S-1092-A', scrOn(/VIBRATING SCREEN-A ON COMMAND/), 0.5, 'hi', 0, 0, null, /\)DITL-BA59$/]);
  L.push(['MIR-S-1092-B', scrOn(/VIBRATING SCREEN-B ON COMMAND/), 0.5, 'hi', 0, 0, null, /\)DITL-BA59$/]);
  /* the speed switch is made while its machine turns: the running contact of the same machine (DITL-BA59 outputs 8 ~ 10) */
  const baRun = r => () => {
    if (!(window.AN && AN.unit && AN.unit.ba)) return NaN;
    const s = (baRun.s = baRun.s || ((typeof S !== 'undefined' && S.sheets) || []).find(x => /\)DITL-BA59$/.test(x.name)));
    const o = s && W._o && W._o[s.name];
    return o ? ((o.has ? o.has(r) : o.includes(r)) ? 1 : 0) : NaN;
  };
  [['SS-BH1750', 7], ['SS-BH1751', 8], ['SS-BH1752', 9]].forEach(([a, r]) => L.push([a, baRun(r), 0.5, 'hi', 0, 0, null, /\)DITL-BA60$/]));
  /* the ash screw cooler speed switch SS-BH1060-x (DITL-21A row 20, I.0258 / 538 / 648 / 688) is made while its cooler turns: the run state of the
     cooler machine. It had no source in the Worker (Mina beta.106: SPEED LOW at 15.9 s, cooler stopped) */
  /* Mina beta.108: the rows of machine #B read the tag of A (SS-BH1060-A, the letter of the tag is not remapped), so the A entry caught
     them and #B followed cooler A. Each machine now has its own entry, held to its own sheet, for its own tag and the tag as drawn */
  'ABCD'.split('').forEach((x, i) => {
    const sh = i ? new RegExp('DITL-21A #' + x + '$') : /DITL-21A$/,
      fn = () => (window.AN && AN.ditlRun ? (AN.ditlRun(i ? 'DITL-21A #' + x : 'DITL-21A') === 1 ? 1 : 0) : NaN);
    for (const t of i ? ['SS-BH1060-' + x, 'SS-BH1060-A'] : ['SS-BH1060-A']) L.push([t, fn, 0.5, 'hi', 0, 0, /SPEED NOT LOW/, sh]);
  });
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
    mtr.length = 0;
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
        const d = L.find(x => words.slice(0, 3).includes(x[0]) && (!x[6] || x[6].test(t)) && (!x[7] || x[7].test(s.name)));
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
        else if (MTR.test(t)) {
          /* 3.2.1 (IRENE): the fan / blower bearing and winding temperatures and vibration of the plant model (unit.js AN_MT, U.mt);
             the drawing of FA blower A serves B (DITL-28B #B): its own blower */
          let g = MTR.exec(t)[1];
          if (/#\s*B$/.test(s.name)) g = g.replace('FA1055-A', 'FA1055-B').replace('FW1115-A', 'FW1115-B');
          mtr.push({ s, key: a.key, g });
        }
        else {
          const m = AIR.find(([re]) => re.test(t));
          if (m) air.push({ s, key: a.key, f: m[1] });
          else {
            const q = BO.find(([re]) => re.test(t)); /* 3.2.1 SEULGI: boiler side (boiler.js) */
            if (q) bo.push({ s, key: a.key, f: typeof q[1] === 'function' ? q[1](t, a, s) : q[1] });
          }
        }
      }
    }
  }
  /* P2 #13 (INSTRUMENT_VALVE_COVERAGE.md): the condenser pressure follows the vacuum of the unit model (unit.js U.vac, 0 = no vacuum,
     1 = in service): 1.033 kg/cm2A (atmosphere) to 0.057 kg/cm2A (4.PNG PICD1110 at 150 MW) */
  /* 3.2.1 (IRENE): DITL-25B / 26B / 27B / 28B analog rows TT- / VT- of the IDF, PAF, SAF and FA blowers; 3.2.3-beta.178 (SOHEE): DITL-23B
     rows 9 ~ 23 of the BFWP (TT-FW1115-A1 ~ A4 / AU / AV / AW, VT-FW1115-A11 ~ A42; machine instance #B = pump B) */
  const MTR = /(?:^|[^A-Z])([TV]T-(?:FG1056-|FA1053-|FA1054-|FA1055-[AB]|FW1115-[AB])(?:[1-4][12]?|[UVW]))\b/,
    mtr = [];
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
    [/(?:^|[^A-Z])FT-CD1120\b/, 'cdQt'],
    [/DPT-CD100([12])\b/, t => 'cdDp' + (+/DPT-CD100([12])/.exec(t)[1] - 1)],
    /* 3.2.1 (IRENE: FEEDWATER): DITL-23B row 25 PT-FW1011 (< 155 kg/cm2 = M.3210, the standby BFWP starts) and row 26 the strainer DP
       DPT-FW1115-A / B (machine instance #B) = the plant model's (unit.js AN_FW) */
    [/(?:^|[^A-Z])PT-FW1011\b/, 'fwPd'],
    [/DPT-FW1115-?([AB])\b/, t => 'fwDp' + 'AB'.indexOf(/DPT-FW1115-?([AB])/.exec(t)[1])],
    /* 3.2.3 (SOHEE): DITL-80P rows 2 / 3 "S/B STEAM DRAIN TEMPERATURE(B) TISB1057.PV" / "(A) TISB1056.PV" (> 250 C drain SOV auto close,
       > 220 C blowing permissive, DITL-80A rows 18 ~ 23) = the drain temperatures of the plant model (unit.js AN_SB.dr) */
    [/TT-SB1056\b/, 'sbTa'],
    [/TT-SB1057\b/, 'sbTb'],
    /* 3.2.3 (SOHEE): DITL-83 rows 15 / 20 "LP TURBINE BYPASS VALVE TT-HR1010 OUTLET TEMP." (< 250 C open, > 330 C close the warming
       valve XV-HR1010-1 in AUTO) = the plant model's (unit.js AN_HRW) */
    [/TT-HR1010\b/, 'hrT10']
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
    [/(?:^|[^A-Z])PT-DO0005\b/, 'doP1'],
    /* fans (boiler.js AN_FN): DITL-28B row 12 "FAB A CURRENT" < 24.6 A (L.L.); the machine instance #B is FA blower B */
    [/IT-F1055[AB]\b/, (t, a, s) => (/#B$/.test(s.name) ? 'fnIb' : 'fnIa')],
    /* limestone (boiler.js AN_LM): DITL-LS60 / LS230 analog rows PT-LM1811 lock vessel, PT-LM1812 dispensing vessel (kg/cm2) */
    [/PILM1811\.PV/, 'lmPl'],
    [/PILM1812\.PV/, 'lmPd']
  ];
  /* 3.2.0-beta.50 (live check #94): the BFWP suction pressure PT-FW1115-A / -B (DITL-23A row 12, START permissive > 1.5 kg/cm2) is the
     deaerator pressure (ABC-056 AI0417 PT-CD1104) plus the static head of the deaerator water (its level, ABC-031 AI0672 LT-CD1104).
     Before: the row kept its default 0.75 and the trainee had to FIELD-force it at Hakbang 25.
     3.2.1 (IRENE 2026-11-04, the two snapshots, docs/hmi/OPERATING_POINTS.md): the pump that is not running (strainer DP 0.00) reads
     the deaerator pressure plus the static head: low load PICD1104 2.2, PIFW1115B 4.0 (head 1.8 kg/cm2); 03.png 150 MW PIFW1115B 7.1 =
     the model deaerator ~5.3 + 1.8. So the common suction header has no loss to see (before: ASSUMED head 2.2 less 1.4 at 499 T/H, which
     gave 5.9 / 6.1 against 6.7 / 7.1). The loss of a running pump is on its own branch (unit.js anFwTagStep, PT-FW1115-A / B).
     The level: 1 kg/cm2 per 10 m of water (LT-CD1104 mm). */
  W.sucP = () => {
    const pd = val(['ABC-056', null, 'AI0417']),
      lv = val(['ABC-031', null, 'AI0672']);
    if (!isFinite(pd)) return NaN;
    const r = Math.max(0, pd + Math.max(0, 1.8 + (isFinite(lv) ? lv : 0) / 1e4));
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
  function val(src, m) {
    if (typeof src === 'function') return src(m);
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
    for (const a of mtr) if (U.mt && isFinite(U.mt[a.g])) (a.s.avw = a.s.avw || {})[a.key] = Math.round(U.mt[a.g] * 10) / 10;
    for (const a of bo) if (isFinite(U[a.f])) (a.s.avw = a.s.avw || {})[a.key] = Math.round(U[a.f] * 1000) / 1000;
    const ps = suc.length ? W.sucP() : NaN;
    if (isFinite(ps)) for (const a of suc) (a.s.avw = a.s.avw || {})[a.key] = ps;
    for (const m of map) {
      const [, src, sp, dir, nc, db] = m.d,
        DB = db != null ? db : DB0,
        x = val(src, m);
      if (!isFinite(x)) continue;
      if (m.d[8] && m.s.sig && m.s.sig[m.row + ':S']) delete m.s.sig[m.row + ':S'];
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
