/* DITL 150 MW (2.2.0-beta.3): "Start at 150 MW" for the DITL sheets too.
   The DITL starts cold (MFT tripped, every motor stopped). At 150 MW the plant runs: this puts every DITL sheet in the running
   state of the control-room HMI snapshots, like the operator brought it there:
   1. the input rows that come from the field / CRT / local panels (not from another sheet) take the state of the plant:
      equipment running or stopped as on the snapshots (docs/hmi/operating-points.json), REMOTE selected, no trip / fault /
      alarm / limit, push buttons released;
   2. the operator sequence runs fast on the real DITL logic (one world scans): purge, MFT reset, START of the equipment that
      runs, so the latches, timers and motors of the drawing reach their running state by themselves.
   The logic of the sheets is not changed. Reset / Simulate OFF -> cold again. */
(function () {
  /* equipment on the 150 MW snapshots (run = running, auto = standby selected in AUTO). 02.png (60 MW) is not used. */
  const EQ = [
    [/\bBFWP\s*A\b(?!\s*AUX)/, 1, 0, '03.png BFWP-A 289.4 A, R M'],
    [/\bBFWP\s*B\b(?!\s*AUX)/, 0, 1, '03.png BFWP-B standby, R A'],
    [/\bAUX\.?\s*LOP\b/, 0, 1, 'not on a screen: the main pump runs, the auxiliary lube oil pump is on standby'],
    [/COAL FEEDER\s*[ABC]\b|ALL COAL FEEDER/, 1, 0, '11.png feeders A / B / C running'],
    [/\bIDF\b|INDUCED DRAFT FAN/, 1, 0, '7.PNG F-1056 IDF 199.6 A'],
    [/\bPAF\s*LUB\.?\s*OIL PUMP\s*A\b|\bLOP-?A\b.*PAF/, 0, 1, '7.PNG LOP-A (PAF) stopped, R A'],
    [/\bPAF\s*LUB\.?\s*OIL PUMP\s*B\b|\bLOP-?B\b.*PAF/, 1, 0, '7.PNG LOP-B (PAF) running, R M'],
    [/\bPAF\b|PRIMARY AIR FAN/, 1, 0, '7.PNG F-1053 PAF 253.6 A'],
    [/\bSAF\b|SECONDARY AIR FAN/, 1, 0, '7.PNG F-1054 SAF 134.0 A'],
    [/\bFAB\s*A\b|FA BLOWER\s*-?A\b|ANY FAB/, 1, 0, 'F-1055A FA BLOWER-A 37.3 A, R M'],
    [/\bFAB\s*B\b|FA BLOWER\s*-?B\b/, 0, 1, 'F-1055B FA BLOWER-B standby, R A'],
    [/ALL FAB/, 1, 0, 'FAB A runs (FAB B on standby): not all FAB stopped'],
    [/SEAWATER BOOSTER PUMP\s*A\b|\bSWBP\s*-?A\b/, 1, 0, 'SWBP-A 87.3 A, R M'],
    [/SEAWATER BOOSTER PUMP\s*B\b|\bSWBP\s*-?B\b/, 0, 1, 'SWBP-B standby, R A'],
    [/SEAWATER BOOSTER PUMP\s*C\b|\bSWBP\s*-?C\b/, 1, 0, 'SWBP-C 87.2 A, R M'],
    [/SEAWATER PUMP\s*A\b|\bSWP\s*-?A\b/, 0, 0, 'SWP-A stopped, R M'],
    [/SEAWATER PUMP\s*[BC]\b|\bSWP\s*-?[BC]\b|ANY SEAWATER PUMP/, 1, 0, 'SWP-B 242.5 A, SWP-C 207.6 A'],
    [/\bDOP\s*A\b|DIESEL OIL PUMP\s*A\b/, 1, 0, 'P-0702A DIESEL OIL PUMP 25.4 A, R M'],
    [/\bDOP\s*B\b|DIESEL OIL PUMP\s*B\b/, 0, 1, 'P-0702B standby, R A'],
    [/\bMWP\s*[AC]\b/, 1, 0, 'MWP-A 20.5 A, MWP-C 20.8 A'],
    [/\bMWP\s*B\b/, 0, 0, 'MWP-B stopped, R M'],
    [/BOTTOM ASH SCREW COOLER|ASH COOLER/, 0, 0, 'L-1060A ~ D ASH COOLER stopped'],
    [/CHAIN CONVEYOR/, 1, 0, 'L-1090 CHAIN CONVEYOR running'],
    [/AIR PREHEATER|\bAPH\b/, 1, 0, 'APH MAIN DRIVE MOTOR 4.7 A'],
    [/LIMESTONE FEEDER|ROTO FEEDER/, 1, 0, 'L-1311 ROTO FEEDER running'],
    [/IGNITER/, 0, 0, '6.PNG: oil burners out of service (FIC-OM 0 %), no igniter'],
    [/\bBURNER\s*[A-D]\b|ALL BURNER|ANY BURNER/, 0, 0, '6.PNG: oil burners out of service (oil flow 0, FIC-OM M 0 %)']
  ];
  /* valves and dampers at 150 MW: open = 1 (OPENED 1, CLOSED 0), shut = 0, null = modulating (neither end switch made) */
  const VALVES = [
    /* 2.2.0-beta.6: drains first (29.PNG MVAS1392 / 1393 / 1397 0.0 % TQ: the gland steam drains are shut too; before, the
       GLAND rule below read "GLAND STM DRAIN SEPARATOR DRAIN MOV" as open) */
    [/DRAIN (MOV|VALVE|VLV)|DRN (MOV|VLV)|WARMING LINE DRN|LINE DRAIN|\bDRAIN\b.*\bMOV\b/, 0, '29.PNG / 4.PNG: unit on load, the drains are shut (MVAS1392 / 1393 / 1397 0.0 % TQ)'],
    [/GLAND.*DESUPERHEATER|DESUPERHEATER.*GLAND/, 0, '29.PNG XVCD1125 condensate to gland steam desuperheater: closed'],
    [/(FAB|BLOWER)-?\s*B\s*OUTLET/, 0, '9.png XVFA1055B3 FA blower-B (standby) discharge: closed (green)'],
    [/LP HTR.*BYPASS|LPH.*BYPASS/, 0, '02.png MVCD1003 #1 LPH bypass 0.0 % TQ'],
    [/LP HTR.*(INLET|OUTLET)|LPH.*(INLET|OUTLET)/, 1, '02.png MVCD1001 / MVCD1002 #1 LPH inlet 99.6 % / outlet 99.4 %'],
    [/START-UP EJECTOR/, 0, '29.PNG MVAS1395 aux steam to start-up ejector 0.0 %'],
    [/STEAM JET AIR EJECTOR/, 1, '29.PNG MVAS1396 aux steam to steam jet air ejectors 100.6 %'],
    [/VACUUM\s*BREAKER/, 0, '4.PNG condenser 0.057 kg/cm2A: vacuum held, the vacuum breaker is shut'],
    [/DISCHARGE VALVE/, 1, '11.png: coal feeders A / B / C running, outlet discharge valve open'],
    [/SILO.*OUTLET VALVE/, 1, '11.png: coal silos feed the running feeders'],
    [/\bOIL\b.*(VALVE|\bFV\b|SOV)|IGNITER.*VALVE/, 0, '6.PNG: oil burners out of service, supply oil valves closed'],
    [/BYPASS.*DESUPERHEATING/, 0, '5.PNG: HP / LP bypass shut on load, their spray block valves shut'],
    [/EMERGENCY DRAIN/, 0, 'unit on load: emergency drains shut'],
    [/SPRAY WATER.*(SOV|SHUT|BLOCK)|DESUPERHEATER SPRAY/, 1, '03.png / 4.PNG: SH and RH spray in service (TCV 69.7 %, 66 %)'],
    [/(FAB|BLOWER)-?\s*B\b.*SILENCE|SILENCE.*(FAB|BLOWER)-?\s*B\b/, 1, '9.png XVFA1055B2 FA blower-B (standby) to silencer: open (red)'],
    [/TO SILENCE|SILENCER/, 0, '9.png XVFA1055A2 FA blower-A (running) to silencer: closed (green); 4.PNG main steam / hot reheat to silencer shut'],
    [/FAB\s*A\s*OUTLET|BLOWER-?A OUTLET/, 1, 'FA blower A in service: outlet valve open'],
    [/INLET VANE|BIAS DAMPER|\bVANE\b/, null, '7.PNG: fan vanes and the bias dampers modulate'],
    [/EXTRACTION STM NO\.?\s*\d\s*SHUT-?OFF/, 1, '4.PNG: unit on load, the heaters are in service (extraction steam open)'],
    [/MAIN STM TO AUX|AUX STEAM HEADER|GLAND/, 1, 'unit on load: steam to the auxiliary and gland headers'],
    [/BYPASS.*(VALVE|VLV)/, 0, '5.PNG: HP / LP bypass shut on load'],
    [/POLISHER.*(INLET|OUTLET).*MOV/, 0, '28.png MVCD1007 / MVCD1008 0.0 %: condensate polisher bypassed (FCVCD1121 100.6 %)'],
    [/MAKE-UP WTR TO COND.*SHUT-?OFF/, 0, '28.png MVMU1001 make-up to condenser 0.0 %']
  ];
  /* analog inputs of the DITL comparators at 150 MW (transmitter tag in the row text -> value of the snapshot) */
  const ANALOG = [
    [/PT-CD1110\b/, 0.057, '4.PNG PICD1110 condenser pressure 0.057 kg/cm2A'],
    [/ZT-MS1020\b/, 1.1, '5.PNG PCVMS1020 HP bypass 1.1 %'],
    [/ZT-HR1010\b/, 1.3, '5.PNG PCVHR1010 LP bypass 1.3 %'],
    [/ZT-TS1001\b|AI0738\b/, 99.8, '4.PNG MVTS1001 99.8 %'],
    [/ZT-TS1002\b|AI0739\b/, 99.4, '4.PNG MVTS1002 99.4 %'],
    [/ZT-TS1003\b|AI0740\b/, 100.0, '02.png MVTS1003 100.4 %'],
    [/ZT-TS1004\b|AI0741\b/, 99.0, '02.png MVTS1004 99.0 %'],
    [/ZT-TS1005\b|AI0742\b/, 100.0, '02.png MVTS1005 100.4 %'],
    [/TIHR1002[12]|TT-HR1002/, 541, '4.PNG RHT 541 C'],
    [/PT-IA1706|PT-IA0706|PIIA/, 7.0, '39.PNG instrument air buffer tanks 7.0 kg/cm2']
  ];
  const valveOf = t => {
    for (const [re, open, why] of VALVES) if (re.test(t)) return { open, why };
    return null;
  };
  const eqOf = t => {
    for (const [re, run, auto, why] of EQ) if (re.test(t)) return { run, auto, why };
    return null;
  };
  /* state of one input row at 150 MW from its text; null = no rule (stays 0) */
  function rowVal(raw) {
    const t = String(raw || '')
      .toUpperCase()
      /* 2.2.0-beta.6: the address / tag written inside the service text ("EXTRACTION STM NO.1 I.0010 SHUT-OFF MOV FULLY OPEN")
         is not part of the words of the rules */
      .replace(/(^|\s)-?[IOMB]\.[0-9A-F]{4}(\/[0-9A-F]{3,4})*\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!t) return null;
    /* 37.PNG GENERATOR: synchronized, 52L1 / DS / 52G1 / field CB closed (red), NORMAL OPERATION MODE (not house operation) */
    if (/HOUSE OPERATION/.test(t)) return 0;
    if (/\b52G1?\b|\bGCB\b/.test(t) && /\bON\b|CLOSED/.test(t)) return 1;
    if (/\b52G1?\b|\bGCB\b/.test(t) && /\bOFF\b|OPEN/.test(t)) return 0;
    /* a compound condition ("... NOT RUNNING AND SPEED L/LL") is left to the logic */
    if (/\bNOT\b/.test(t) && /\bAND\b/.test(t)) return null;
    if (/\bNOT\b/.test(t)) {
      const b = rowVal(t.replace(/\bNOT\b/, ' '));
      return b == null ? null : b ? 0 : 1;
    }
    /* "NO TRIP PRESENT" (DITL-05 78), "NO BOILER TRIP COMMAND": the opposite of the rest ("NO." is a number) */
    if (/(^|\s)NO\s+[A-Z]/.test(t)) {
      const b = rowVal(t.replace(/(^|\s)NO\s+/, ' '));
      return b == null ? null : b ? 0 : 1;
    }
    /* a normally closed contact is closed (1) while nobody presses it: BOILER EMERGENCY TRIP P.B.(1) (N.C.) */
    if (/N\.\s*C\./.test(t) && /P\.\s*B|PUSH/.test(t)) return 1;
    if (/INADEQUATE/.test(t)) return 0;
    if (/\bADEQUATE\b/.test(t)) return 1;
    /* the purge sequence is a start-up step: not a state of the unit on load; a valve position compared with a value is
       computed by the drawing from the analog position (DITL-03H HP BYPASS ... POS. < 10 %) */
    if (/PURGE/.test(t)) return null;
    if (/\bPOS(\.|ITION)/.test(t) && /[<>]/.test(t)) return null;
    if (/P\.\s*B\.?|\bPB\b|PUSH ?BUTTON|\bCOMMAND\b|\bRESET\b|ACKNOW|LAMP TEST|\bTEST\b|AUTO START|STARTING|STOPPING/.test(t))
      return 0;
    /* HI-HI / LO-LO level switches: not made on load (the MOV TORQUE switch is left to the MOV model: a drain MOV shut on
       its seat shows TQ on the screens, 28.png MVCD1007 "R TQ") */
    if (/HI-HI|LO-LO/.test(t)) return 0;
    if (
      /TRIP|FAULT|FAIL|ABNORMAL|OVERLOAD|ALARM|UNSUCCESSFUL|PLUG|LEAK|\bFIRE\b(?! WATER| PUMP| FIGHTING)|\bH\.?\s?H\.?\b|\bL\.?\s?L\.?\b|\bHIGH\b|\bLOW\b|\bL\.(?=\s|$)|\bH\.(?=\s|$)|[<>]|VIBRATION|EXCESS|OVER ?SPEED|SHUTDOWN MODE|MFT/.test(
        t
      )
    )
      return 0;
    const vl = valveOf(t);
    if (vl && /OPEN|CLOS/.test(t) && !/\bCOMMAND\b|P\.\s*B/.test(t)) {
      if (vl.open == null) return 0;
      const op = /OPEN/.test(t) && !/CLOS/.test(t);
      return op ? vl.open : vl.open ? 0 : 1;
    }
    const e = eqOf(t);
    /* every station on the screens is in REMOTE (DCS) at 150 MW; "LOCAL / REMOTE" names the selector, it is REMOTE */
    if (/\bREMOTE\b/.test(t)) return 1;
    if (/\bLOCAL\b/.test(t)) return 0;
    /* AUTO / MANUAL selection: only when the snapshot shows it (the standby machine in AUTO) */
    if (/\bAUTO\b/.test(t)) return e ? e.auto : null;
    if (/\bMANUAL\b/.test(t)) return e ? (e.auto ? 0 : 1) : null;
    if (/RUNNING|IN SERVICE|IN OPERATION|ENERGIZED|\bRUN\b/.test(t)) return e ? e.run : null;
    if (/STOPPED|\bSTOP\b/.test(t)) return e ? (e.run ? 0 : 1) : null;
    if (/READY/.test(t)) return e ? e.run : null;
    if (/AVAILABLE|NORMAL|PERMISSI|PROVEN|CONFIRM|ESTABLISH/.test(t)) return 1;
    return null;
  }
  /* every DITL sheet and every machine instance of a shared drawing (src/world/world.js) */
  const ALL = () => S.sheets.concat(window.WORLD.inst || []);
  function textOf(s, i, k) {
    const t0 = textOf0(s, i, k);
    return window.WORLD && WORLD.remap ? WORLD.remap(s, t0) : t0;
  }
  function textOf0(s, i, k) {
    const t = (s.cells[i + ':' + k] || []).map(x => x.t).join(' ');
    /* old template (DITL-51 ~ 121): the service text of an input row is in the TAG column (the SERVICE cell may hold only a
       timer name, DITL-99 "TR25") */
    if (k === 'S') return (t + ' ' + (s.cells[i + ':T'] || []).map(x => x.t).join(' ')).trim();
    return t;
  }
  /* the input rows of a sheet that the plant sets: used by the logic, and not fed by another sheet (an input fed only by an
     output of its own sheet is a field signal that the drawing also shows as an output, e.g. DITL-23A BFWP A RUNNING I.0056 = 23A-55) */
  function plantRows(s) {
    const W = window.WORLD,
      m = W && W.idx ? W.idx.din.get(s) : null,
      src = new Set(s.nl.src.map(z => z.row)),
      o = [];
    src.forEach(i => {
      const w = m && m.get(i);
      if (w && w.some(q => !(q.k === 'd' && q.d === s))) return;
      o.push(i);
    });
    return o;
  }
  const D = (window.DITL150 = { on: false, EQ, VALVES, eqOf, valveOf, rowVal, plantRows, rep: null });
  /* 1. the field state */
  D.setInputs = () => {
    const rep = { set: 0, zero: 0, none: [] };
    for (const s of ALL()) {
      if (!s.nl || s.nl.v !== 10) {
        s.nl = netlist(s);
        s.uvDone = false;
      }
      s.sig = {};
      s.usw = {};
      s._fd = null;
      s.av150 = null;
      for (const a of s.nl.an || []) {
        const src = s.nl.src.find(z => z.n === a.net),
          t = src ? textOf(s, src.row, 'S') : '',
          hit = ANALOG.find(([re]) => re.test(t));
        if (hit) (s.av150 = s.av150 || {})[a.key] = hit[1];
      }
      for (const i of plantRows(s)) {
        /* a bit that the 150 MW load of the ABC takes from a snapshot (hmi-op.js AN_HMI_DI, e.g. I.0418 ICV TO CV TRANSFER
           COMPLETE = 1 on 4.PNG) is the same address here */
        const ad = WORLD.addrK ? WORLD.addrK(s, i) : (textOf(s, i, 'S').match(/\b[IM]\.[0-9A-F]{4}\b/) || [])[0],
          hd = ad && AN.hmiDI ? AN.hmiDI[ad] : null,
          v = hd ? hd[0] : rowVal(textOf(s, i, 'S'));
        if (v) {
          s.sig[i + ':S'] = true;
          rep.set++;
        } else if (v === 0) rep.zero++;
        else rep.none.push(s.name + ' #' + i + ' ' + textOf(s, i, 'S'));
      }
    }
    return rep;
  };
  /* 2. scans of the whole world (dt seconds each) */
  D.scan = (n, dt) => {
    for (let k = 0; k < n; k++) WORLD.tick(dt, { noAbc: !WORLD.on });
  };
  /* back to the cold DITL (what the Simulate button and Reset do) */
  D.clear = () => {
    MST = {};
    MS = {};
    for (const x of ALL()) {
      x.sig = {};
      x.usw = {};
      x._fd = null;
      x.av150 = null;
      if (x.nl) {
        x.nl._v = null;
        x.nl.fx = [];
        x.nl.ufx = [];
        for (const g of x.nl.gates) {
          if (g.t === 'FF') g.q = 0;
          if (g.t === 'TMR') g.st = { acc: 0, out: 0, pre: 0, run: 0 };
        }
      }
    }
    D.on = false;
  };
  /* what an OUTPUT row of the drawing must show at 150 MW, from its text (the same rules; a command or a push button is not a state) */
  const outVal = raw => {
    const t = String(raw || '').toUpperCase();
    if (/P\.\s*B\.?|PUSH ?BUTTON|\bCOMMAND\b|\bRESET\b|\bSTART\b|\bSTOP\b(?!PED)/.test(t)) return null;
    /* a READY output is a start permissive that the drawing computes from its inputs (DITL-28B 77 FAB FCD READY = FCD
       demand at 25 % AND silencer SOV opened): not a state to wish */
    if (/READY/.test(t)) return null;
    /* the torque switch of a MOV is the MOV model's (a valve shut on its seat shows TQ) */
    if (/\bTORQUE\b/.test(t)) return null;
    return rowVal(t);
  };
  /* the wanted outputs: the text of the output rows, and the DITL outputs that the ABC reads (their value after the 150 MW
     load of the ABC, src/analog/engine/hmi-op.js). A drawing used for two machines (DITL-23A: BFWP A and B, addresses
     "I.0056/376") gives two wishes on one row: that row is left to the logic */
  D.wants = () => {
    const W = new Map(),
      bad = new Set(),
      put = (s, row, v) => {
        if (!W.has(s)) W.set(s, new Map());
        const m = W.get(s),
          k = row;
        if (m.has(k) && m.get(k) !== v) bad.add(s.name + '#' + k);
        m.set(k, v);
      };
    for (const s of ALL())
      for (const o of s.nl.outs) {
        /* an output made by a PULSE timer is a momentary command (DITL-21C 57 / 59, 21D 59 "... NOT USED AUTO SEQUENCE"):
           0 between the pulses, not a state */
        if (s.nl.gates.some(g => g.t === 'TMR' && (g.out || []).includes(o.n) && g.tm && /PULSE/.test(g.tm.lab || ''))) continue;
        /* an output to another system's PLC is a command / hand-shake of the drawing (DITL-65 63 "OUTLET MOV FULLY OPEN" =
           CONDENSATE PUMP A OR B RUNNING -> DOR-CD1008 O.0451 -> WATER TREATMENT SYSTEM), not the state its text names */
        if (/\bPLC\b/.test(textOf(s, o.row, 'RL'))) continue;
        const v = outVal(textOf(s, o.row, 'RS'));
        if (v != null) put(s, o.row, v);
      }
    const abc = new Map();
    const known = AN.hmiDI || {};
    for (const a of (window.WORLD.idx && WORLD.idx.ain) || []) {
      /* only the bits that the 150 MW load takes from a snapshot (hmi-op.js AN_HMI_DI); the others are 0 by default, not a fact */
      if (!known[String(AN.nm(a.sh.S, a.n) || '').trim()]) continue;
      const k = a.d.name + '#' + a.row,
        v = a.sh.S && a.sh.S.rt ? (a.sh.S.rt.ext[a.n] > 0.5 ? 1 : 0) : null;
      if (v == null) continue;
      if (abc.has(k) && abc.get(k)[1] !== v) abc.get(k)[2] = 1;
      else if (!abc.has(k)) abc.set(k, [a, v, 0]);
    }
    abc.forEach(([a, v, x]) => {
      if (x) bad.add(a.d.name + '#' + a.row);
      else put(a.d, a.row, v);
    });
    W.forEach((m, s) => m.forEach((v, k) => bad.has(s.name + '#' + k) && m.delete(k)));
    return W;
  };
  /* the latches (FF) of the drawing take the state of a plant in service: the start was done before the snapshot. One FF at a
     time, kept only when more wanted outputs of its sheet agree */
  /* the state of one sheet that the solver may change: latches (FF), seal-in nets, motor and valve models */
  const snap = s => ({
    q: s.nl.gates.filter(g => g.t === 'FF').map(g => g.q),
    v: s.nl._v ? s.nl._v.slice() : null,
    mv: mvRT(s).map(x => ({ ...x })),
    mt: motRT(s).map(x => ({ ...x })),
    fx: (s.nl.fx || []).slice(),
    us: { ...(s.usw || {}) },
    win: s._win ? new Set(s._win) : null
  });
  const back = (s, k) => {
    s.nl.gates.filter(g => g.t === 'FF').forEach((g, j) => (g.q = k.q[j]));
    s.nl._v = k.v ? k.v.slice() : null;
    MST[s.name] = k.mv.map(x => ({ ...x }));
    MS[s.name] = k.mt.map(x => ({ ...x }));
    s.nl.fx = k.fx.slice();
    s.usw = { ...k.us };
    s._win = k.win ? new Set(k.win) : null;
  };
  /* how many wanted outputs of the sheet agree once its valves and motors have followed their commands */
  /* an output of the sheet that comes back as its own input (DITL-32: 32-53 OPEN COMMAND -> row 21, the coil of the SOV) */
  const loop = (s, R) => {
    const m = window.WORLD.idx && WORLD.idx.din.get(s);
    if (!m) return;
    const w = new Set(s._win || []);
    m.forEach((srcs, row) => {
      if (!srcs.every(q => q.k === 'd' && q.d === s)) return;
      if (srcs.some(q => R.outOn.has(q.row))) w.add(row);
      else w.delete(row);
    });
    s._win = w;
  };
  const score = (s, m) => {
    let R = simSheet(s);
    loop(s, R);
    R = simSheet(s);
    mvStep(s, R.v, 100);
    motStep(s, R.v, 100);
    R = simSheet(s);
    loop(s, R);
    R = simSheet(s);
    let n = 0;
    m.forEach((v, row) => (n += (R.outOn.has(row) ? 1 : 0) === v ? 1 : 0));
    return n;
  };
  /* one change at a time (a latch, a motor, a motor valve), kept only when more wanted outputs of its sheet agree */
  D.solve = W => {
    let flips = 0;
    W.forEach((m, s) => {
      const ffs = s.nl.gates.filter(g => g.t === 'FF'),
        mt = s.nl.mot || [],
        mv = s.nl.mv || [],
        moves = [];
      ffs.forEach(g =>
        moves.push(() => {
          g.q = g.q ? 0 : 1;
          if (s.nl._v) s.nl._v = s.nl._v.map((x, n) => (g.out.includes(n) ? g.q : x));
        })
      );
      mt.forEach((x, j) =>
        moves.push(() => {
          const r = motRT(s);
          r[j].run = r[j].run ? 0 : 1;
          r[j].tgt = r[j].run;
          r[j].acc = 0;
          s.nl.fx = mt.filter((y, k) => r[k].run).map(y => y.mir);
        })
      );
      mv.forEach((b, j) => {
        if (b.sv) return;
        moves.push(() => {
          const r = mvRT(s);
          r[j].pos = r[j].pos >= 100 ? 0 : 100;
          r[j].run = 0;
        });
      });
      /* the selector switches drawn on the sheet (AUTO / MANUAL keys) */
      (s.nl.usr || []).forEach(u =>
        moves.push(() => {
          s.usw = s.usw || {};
          s.usw[u.key] = !s.usw[u.key];
        })
      );
      if (!moves.length) return;
      let k0 = snap(s),
        best = score(s, m);
      k0 = snap(s);
      for (let pass = 0, imp = true; imp && pass < 4; pass++) {
        imp = false;
        for (const mv_ of moves) {
          mv_();
          const sc = score(s, m);
          if (sc > best) {
            best = sc;
            imp = true;
            flips++;
            k0 = snap(s);
          } else back(s, k0);
        }
      }
    });
    return flips;
  };
  D.apply = () => {
    const W = window.WORLD;
    if (!W || !W.tick || typeof S === 'undefined' || !S.sheets || !S.sheets.length) return null;
    if (!W.idx || !W.on) {
      /* the index of the links, without turning the one world on (it lists the ABC sheets it would run) */
      const ws = AN.worldSheets;
      W.build();
      if (!W.on) AN.worldSheets = ws || [];
    }
    const rep = D.setInputs(),
      want = D.wants(),
      lv = W.live;
    W.live = true;
    rep.flips = 0;
    try {
      D.scan(5, 1);
      for (let k = 0; k < 6; k++) {
        const f = D.solve(want);
        rep.flips += f;
        D.scan(15, 1);
        if (!f && k > 1) break;
      }
      /* the operator acknowledges what the start-up left latched (RESET FIRST OUT ...): the RESET push buttons of the CRT */
      const rs = [];
      for (const s of ALL()) {
        for (const i of plantRows(s)) {
          const t = textOf(s, i, 'S').toUpperCase();
          if (/\bRESET\b/.test(t) && /P\.\s*B|RESET FIRST OUT/.test(t + ' ' + textOf(s, i, 'L')) && !/LOCAL|LOP/.test(t)) rs.push([s, i]);
        }
        /* 2.2.0-beta.6: DITL-05 / 06 row 2 RESET FIRST OUT <- DITL-02 out 58 (the MFT reset at the end of the purge of the
           last start-up): the unit reached 150 MW after that reset, so the first-out memories are clear */
        for (const z of s.nl.src)
          if (/^RESET FIRST OUT\b/.test((s.cells[z.row + ':S'] || []).map(x => x.t).join(' ').trim().toUpperCase()) && !rs.some(([a, b]) => a === s && b === z.row))
            rs.push([s, z.row]);
      }
      rs.forEach(([s, i]) => (s.sig[i + ':S'] = true));
      D.scan(3, 1);
      rs.forEach(([s, i]) => delete s.sig[i + ':S']);
      D.scan(10, 1);
      rep.resets = rs.map(([s, i]) => s.name + ' #' + (i + 1) + ' ' + textOf(s, i, 'S'));
    } finally {
      W.live = lv;
    }
    rep.want = 0;
    rep.miss = [];
    W.live = true;
    want.forEach((m, s) => {
      const R = simSheet(s);
      m.forEach((v, row) => {
        rep.want++;
        if ((R.outOn.has(row) ? 1 : 0) !== v)
          rep.miss.push(s.name + ' ' + (51 + row) + ' ' + textOf(s, row, 'RS') + ' want ' + v);
      });
    });
    W.live = lv;
    D.on = true;
    D.rep = rep;
    return rep;
  };
})();
