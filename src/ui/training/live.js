/* ===== 3.2.0-beta.10 LIVE TRAINING (user 2026-10-23: "since may check list sa cold startup, auto check sya if nagawa mo na sa logic lahat
   ... hanggang sa sync 4.5 MW initial load, to load up to 150 MW"; proposal https://claude.ai/artifact/D7vFKoog3SF3AYaaVXyvCs, picked
   "Oo, gawin buong takbo").
   Every step of PR-OPE-5002 gets one kind:
   - auto: a DCS signal of the app tells when it is done (a running memory, the mode / SV / MV of a faceplate, a PV at its target, the
     purge, 52G1). The step ticks itself while the simulation RUNs and stays ticked (the procedure is a sequence) until Practise: Cold start.
   - field: no DCS signal (a manual valve, a local gauge, an oil level): the operator ticks it.
   - tcs: the turbine control system (ATS, chest warming, rub check, synchroscope), outside the DCS drawings.
   Two sections are added after Solid firing (the procedure ends there): Sync & initial load and Load up to 150 MW, with the targets of the
   M4 chain of the app (src/ui/uat/check.js, it passes to 150 MW), PR-OPE-5002 sec 44 and the FHI design data.
   Read only: nothing here writes the engine. A condition names its signals; a signal that is not on any ABC sheet makes the step a
   field step (and is listed by LS_LIVE.audit() for the test). ===== */
window.LS_LIVE = (function () {
  /* live test #63 #66: two readings of the generated SOP data (pr-ope-5002.js / -lim.js, extracted from the docx as written):
     - the procedure is written for both units with "n" for the unit number (P-n941, V-LOn201, T-n920, H-n921A/B, P-n922A/B): this is
       unit #1 (HMI 036 P-1941, T-1920, H-1921A);
     - 16.1 "Verify that Main Oil Pump is running within normal pressure" has "≤ 5.6 kg/cm2g" in its limit column: that is the auto
       start of the standby MOP (the NOTE of 16.5 "discharge pressure ≤ 5.6 kg/cm2g"); the normal band is 5.6 ~ 6.6 (14.9 P-n922A/B
       "~5.6 kg/cm2g -6.6 kg/cm2g") */
  {
    const un = x => (typeof x === 'string' ? x.replace(/\b([A-Z]{1,2}-(?:[A-Z]{2})?)n(\d{3})/g, '$11$2') : x);
    for (const sec of window.LS_PROC5002 || []) for (const st of sec.s || []) (st.t = un(st.t)), (st.g = (st.g || []).map(un));
    const LIM = window.LS_PROC5002_LIM || {};
    for (const k in LIM) for (const f of ['g', 'n', 'x']) if (LIM[k][f]) LIM[k][f] = un(LIM[k][f]);
    if (LIM['15.0'] && /5\.6/.test(LIM['15.0'].n || '')) LIM['15.0'].n = '5.6 ~ 6.6 kg/cm2g (≤ 5.6 = auto start of the standby MOP)';
  }
  const PROC = window.LS_PROC5002 || [];
  const BASE_N = PROC.length;
  /* ---------- reading the running plant ---------- */
  const abc = () => ((typeof AN !== 'undefined' && AN.sheets) || []).filter(s => /^ABC-/.test(s.name) && !/^ABC-000/.test(s.name));
  const sOf = name => {
    const sh = AN.sheets.find(s => s.name === name);
    try {
      return sh && (sh.S || AN.ensure(sh));
    } catch (e) {
      return null;
    }
  };
  /* label / net name -> the sheets and nets that carry it (one address = one signal on every sheet, CLAUDE.md 1) */
  let LX = null,
    LXof = null;
  function lx() {
    /* built again when the ABC sheets change (the page starts on another category, AN.setCat makes a new list) */
    const L = abc();
    if (LX && LXof === (typeof AN !== 'undefined' && AN.sheets) && L.length) return LX;
    LXof = typeof AN !== 'undefined' && AN.sheets;
    const m = {},
      P = {};
    for (const sh of L) {
      let S;
      try {
        S = sh.S || AN.ensure(sh);
      } catch (e) {
        continue;
      }
      if (!S || !S.lab) continue;
      for (let n = 0; n < S.lab.length; n++) {
        /* 3.2.0-beta.78: an address written with its station ("S4 M.0340" on ABC-020 = STN104 RH biasing damper open) is another signal
           than the same number written plain (ABC-006 M.0340 = STN101 total air < 25 % MCR, memory lists 101 / 104): it is kept under
           its station key, and under the plain key only when no sheet writes that address plain (below) */
        const raw = S.lab[n] ? String(S.lab[n].t).trim() : '',
          ps = /^S\d\s+/.test(raw),
          a = raw.replace(/^S\d\s+/, '');
        let b = '';
        try {
          b = (AN.nm(S, n) || '').trim().replace(/^S\d\s+/, '');
        } catch (e) {}
        /* d: the net is driven by the logic of its sheet (an output, not an input of the sheet) */
        const d = !(S.ext || []).includes(n) && !!(S.drv && S.drv[n] && S.drv[n].length);
        for (const k of new Set([a, b])) if (k) (ps ? (P[k] = P[k] || []) : (m[k] = m[k] || [])).push({ sh: sh.name, n, d });
        if (ps) (m[raw] = m[raw] || []).push({ sh: sh.name, n, d });
      }
    }
    for (const k in P) if (!m[k]) m[k] = P[k];
    LX = L.length ? m : null;
    return m;
  }
  const has = l => !!lx()[l];
  const val = l => {
    const r = lx()[l];
    if (!r) return NaN;
    /* 3.2.0-beta.78 (CLAUDE.md 1, one address = one signal): the sheet whose logic writes the address is the value (ABC-006 M.0340 = 0
       at 221 T/H while an unlinked input copy elsewhere still read 1: the purge air step never ended) */
    for (const q of r) {
      if (!q.d) continue;
      const S = sOf(q.sh),
        y = S && S.rt ? +S.rt.v[q.n] : NaN;
      if (isFinite(y)) return y;
    }
    /* an input: the first sheet that has a value other than the default is as good as any (the links keep them equal) */
    let x = NaN;
    for (const q of r) {
      const S = sOf(q.sh);
      if (!S || !S.rt) continue;
      const y = +S.rt.v[q.n];
      if (isFinite(y)) {
        x = y;
        if (y) break;
      }
    }
    return x;
  };
  /* a faceplate tag: the procedure writes PIC-FG108, FCV-CD1120, LCV-MU1110; the drawings PICFG108, FICCD1120, LICMU1110 */
  const CTL = {};
  function ctlTag(t) {
    if (CTL[t]) return CTL[t];
    const u = String(t).toUpperCase().replace(/\s+/g, ''),
      d = u.replace(/-/g, '');
    const c = [u, d];
    /* the valve -> controller table of the plant graphics (valvectl.js: LCVMU1110 -> LICCD1110A, FCVFW11302 -> LICBR1001B) */
    const vc = window.PLANT_VALVE_CTL && window.PLANT_VALVE_CTL[d];
    if (vc) c.unshift(vc);
    const m = /^([FLPT])CV-?([A-Z]{2})-?(\d{3,5}[A-Z]?)/.exec(u);
    if (m) c.push(m[1] + 'IC' + m[2] + m[3]);
    const m2 = /^(FCV|MCV|PCV)([A-Z]{2})(\d{4})([A-Z])\d?$/.exec(d);
    if (m2) c.push((m2[1] === 'FCV' ? 'FIC' : m2[1] === 'PCV' ? 'PIC' : 'HIC') + m2[2] + m2[3] + m2[4]);
    let hit = null;
    for (const x of c)
      try {
        if (AN.fpFind && AN.fpFind(x)) {
          hit = x;
          break;
        }
      } catch (e) {}
    /* a miss is not kept: the faceplates are only found once the ABC sheets are loaded (the page may start on DITL) */
    if (hit) CTL[t] = hit;
    return hit;
  }
  /* the faceplate: controller (PID / PIDV) or MAN station */
  function fp(tag) {
    const t = ctlTag(tag);
    if (!t) return null;
    const shn = AN.fpFind(t),
      S = sOf(shn);
    if (!S) return null;
    const c = (AN.hmiCtrls ? AN.hmiCtrls(S) : []).find(z => z.tag === t);
    if (c) return { t, shn, S, c, kind: 'ctl' };
    const b = S.blk.find(z => z.k === 'MAN' && (z.tag === t || (z.txt || []).includes(t)));
    return b ? { t, shn, S, b, kind: 'man' } : null;
  }
  const mvOf = f => (f.kind === 'ctl' ? +f.S.rt.v[f.c.out] : f.S.rt.st[f.b.id] ? +f.S.rt.st[f.b.id].val : +f.S.rt.v[f.b.o[0]]);
  const pvOf = f => (f.kind === 'ctl' ? +f.S.rt.v[f.c.q.pv] : NaN);
  const svOf = f => (f.kind === 'ctl' && f.c.q.sv != null ? +f.S.rt.v[f.c.q.sv] : NaN);
  /* MAN / AUTO / REM as the faceplate shows it (hmi.js) */
  function modeOf(f) {
    if (f.kind === 'ctl') {
      const c = f.c,
        S = f.S,
        pk = c.amt && S.rt.st[c.amt.id] ? S.rt.st[c.amt.id].pk : c.autoLeg;
      if (c.amt && pk !== c.autoLeg) return 'MAN';
      if (c.remote && c.svSw && S.rt.st[c.svSw.id] && S.rt.st[c.svSw.id].pk === 'A') return 'REM';
      return 'AUTO';
    }
    /* 3.2.0-beta.16 (bug, fixed): the MODE NETS of the station (AN.modeNets: "TURBINE MASTER IN MANUAL" on ABC-001A ~ C, the nets the
       engine and the faceplate write) first; the lookup of the name EIC-TM.MAN read 0 while the turbine master was MANUAL by its
       back-up command M.2016 (all five mode nets 1), so the step said AUTO */
    try {
      const L = AN.modeNets ? AN.modeNets(f.t) || [] : [];
      if (L.length) return L.some(([S2, n]) => +S2.rt.v[n] > 0.5) ? 'MAN' : 'AUTO';
    } catch (e) {}
    const m = val(f.t + '.MAN');
    if (isFinite(m)) return m > 0.5 ? 'MAN' : 'AUTO';
    /* no .MAN address on the sheets (HIC-BM): the A / M switch of its set input, leg A = AUTO (hmi.js MAN station, check.js bmA) */
    try {
      const S = f.S,
        b = f.b,
        si = b.svI >= 0 ? b.i[b.svI] : null,
        dr = si != null ? (S.drv[si] || []).find(z => z.k === 'AMT') : null,
        ds = dr && S.rt.st[dr.id];
      if (ds && ds.pk) return ds.pk === 'A' ? 'AUTO' : 'MAN';
    } catch (e) {}
    /* Mina F57: a hand station with no AUTO of its own (HICDO1012) is always in the hand of the operator; '?' refused every arrow of the dock */
    return f.kind === 'man' ? 'MAN' : '?';
  }
  const U = () => (typeof AN !== 'undefined' && AN.unit) || {};
  let HH = null,
    HT = 0;
  const H = () => {
    if (!window.CHECK || !CHECK.H) return null;
    if (!HH || Date.now() - HT > 5000) {
      try {
        HH = CHECK.H();
        HT = Date.now();
      } catch (e) {
        HH = null;
      }
    }
    return HH;
  };
  const hv = k => {
    const h = H();
    try {
      return h ? +h[k]() : NaN;
    } catch (e) {
      return NaN;
    }
  };
  const f1 = x => (isFinite(x) ? (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1)).replace(/^-(0(?:\.0)?)$/, '$1') : '—');
  /* ---------- conditions: { sig: [names], ok(), now(), want } ---------- */
  const rng = (x, lo, hi) => isFinite(x) && (lo == null || x >= lo) && (hi == null || x <= hi);
  const wr = (lo, hi, u) => (lo != null && hi != null ? f1(lo) + ' ~ ' + f1(hi) : lo != null ? '≥ ' + f1(lo) : '≤ ' + f1(hi)) + (u ? ' ' + u : '');
  const BIT = (a, want = 1, name) => ({
    sig: [a],
    res: () => has(a),
    ok: () => (val(a) > 0.5 ? 1 : 0) === want,
    now: () => a + ' = ' + (isFinite(val(a)) ? (val(a) > 0.5 ? 1 : 0) : '—'),
    want: (name ? name + ': ' : '') + a + ' = ' + want,
    go: { addr: a }
  });
  const ANYBIT = (L, name) => ({
    sig: L,
    res: () => L.some(has),
    ok: () => L.some(a => val(a) > 0.5),
    now: () => L.map(a => a + ' ' + (val(a) > 0.5 ? 1 : 0)).join(', '),
    want: name + ': any of ' + L.join(' / ') + ' = 1',
    go: { addr: L.find(has) || L[0] }
  });
  const NOBIT = (L, name) => ({
    sig: L,
    res: () => L.some(has),
    ok: () => L.every(a => !(val(a) > 0.5)),
    now: () => L.map(a => a + ' ' + (val(a) > 0.5 ? 1 : 0)).join(', '),
    want: name + ': all of ' + L.join(' / ') + ' = 0',
    go: { addr: L.find(has) || L[0] }
  });
  const MODE = (t, m) => ({
    sig: [t],
    /* a MAN station without a mode on the drawing (no .MAN address, no A / M switch: HICDO1012) cannot tell its mode */
    res: () => !!fp(t) && modeOf(fp(t)) !== '?',
    ok: () => {
      const f = fp(t),
        x = f && modeOf(f);
      return m === 'AUTO' ? x === 'AUTO' || x === 'REM' : x === m;
    },
    now: () => {
      const f = fp(t);
      return (f ? f.t : t) + ' ' + (f ? modeOf(f) : '—');
    },
    want: t + ' in ' + (m === 'AUTO' ? 'AUTO' : m === 'REM' ? 'REMOTE' : 'MANUAL'),
    go: { tag: t }
  });
  const MV = (t, lo, hi) => ({
    sig: [t],
    res: () => !!fp(t),
    ok: () => {
      const f = fp(t);
      return !!f && rng(mvOf(f), lo, hi);
    },
    now: () => {
      const f = fp(t);
      /* a MAN station has the unit of its parameters (HIC-ULD MW, Mina beta.170), a controller output is % */
      return (f ? f.t : t) + ' MV ' + (f ? f1(mvOf(f)) : '—') + ' ' + ((f && f.kind === 'man' && f.b && f.b.p && f.b.p.u) || '%');
    },
    want: t + ' MV ' + wr(lo, hi, '%'),
    go: { tag: t }
  });
  const SV = (t, lo, hi, u) => ({
    sig: [t],
    res: () => !!fp(t) && fp(t).kind === 'ctl',
    ok: () => {
      const f = fp(t);
      return !!f && rng(svOf(f), lo, hi);
    },
    now: () => {
      const f = fp(t);
      return (f ? f.t : t) + ' SV ' + (f ? f1(svOf(f)) : '—') + (u ? ' ' + u : '');
    },
    want: t + ' SV ' + wr(lo, hi, u),
    go: { tag: t }
  });
  const PV = (t, lo, hi, u) => ({
    sig: [t],
    res: () => !!fp(t) && fp(t).kind === 'ctl',
    ok: () => {
      const f = fp(t);
      return !!f && rng(pvOf(f), lo, hi);
    },
    now: () => {
      const f = fp(t);
      return (f ? f.t : t) + ' PV ' + (f ? f1(pvOf(f)) : '—') + (u ? ' ' + u : '');
    },
    want: t + ' PV ' + wr(lo, hi, u),
    go: { tag: t }
  });
  /* a value of the plant: the CHECK helpers (MW, MSP, FP furnace pressure, lvl drum level, FW, PA, SA, FA, MST, O2, coal, MSF) or the
     plant model (unit.js: Pd drum pressure, Tb bed, Tw water, oilF burner oil, rpm) */
  const NAMES = {
    MW: ['Generator MW', 'MW', 'ABC-001C', 'AI0419'],
    MSP: ['Main steam pressure', 'kg/cm2', 'ABC-001C', 'AI0131'],
    MSF: ['Main steam flow', 'T/H', 'ABC-001C', ''],
    FP: ['Furnace pressure', 'mmH2O', 'ABC-008', 'PICFG108'],
    lvl: ['Drum level', 'mm', 'ABC-010', 'LICBR1001'],
    FW: ['Feedwater flow', 'T/H', 'ABC-010', 'FICFW1007'],
    PA: ['Primary air flow', 'T/H', 'ABC-006', 'FIFA1071.PV'],
    SA: ['Secondary air flow', 'T/H', 'ABC-006', 'FIFA1081.PV'],
    FA: ['Fluidizing air flow', 'T/H', 'ABC-006', 'FIFA1055.PV'],
    MST: ['Main steam temperature', '°C', 'ABC-012', 'TICMS1004'],
    O2: ['Flue gas O2', '%', 'ABC-002', 'AICFG112'],
    coal: ['Total coal flow', 'T/H', 'ABC-004A', ''],
    AIR: ['Total air flow (PA + SA + FA)', 'T/H', 'ABC-006', ''],
    Pd: ['Drum pressure', 'kg/cm2', 'ABC-010', ''],
    Tb: ['Bed temperature', '°C', '', ''],
    Tw: ['Boiler water temperature', '°C', '', ''],
    oilF: ['Burner oil, total', 'T/H', 'ABC-003A', ''],
    rpm: ['Turbine speed', 'rpm', 'ABC-050', ''],
    RHP: ['Reheat pressure', 'kg/cm2', 'ABC-052', 'PICHR1003'],
    /* audit 2026-11-03 (SOP 24.13 / 24.14): the secondary air pressure to the furnace PT-FA1088 (IO list STN101 AI0289, ABC-003A) */
    SAP: ['Secondary air pressure (PT-FA1088)', 'mmH2O', 'ABC-003A', 'AI0289']
  };
  const getV = k => {
    if (k === 'AIR') return hv('PA') + hv('SA') + hv('FA');
    if (k === 'Pd' || k === 'Tb' || k === 'Tw' || k === 'oilF' || k === 'rpm') return +U()[k];
    return hv(k);
  };
  /* 3.2.1 TREND RECORDER (user 2026-11-08 testing plan 3): one row each minute of plant time while the plant model runs: the values the
     plant trends of the user hold (scenario 1 / 2), for the PC-only comparison script (team-files/tools/trend-compare). A new starting
     state or a save point loaded starts a new record */
  const REC_K = ['MW', 'MSF', 'MSP', 'MST', 'coal', 'PA', 'SA', 'FA', 'O2', 'Tb', 'lvl', 'FW', 'FP', 'Pd', 'RHP'];
  const REC = { rows: [], last: -1, n: 0 };
  const recRow = () => {
    const r = { t: Math.round(+U().t || 0) };
    for (const k of REC_K) {
      let v = null;
      try {
        v = getV(k);
      } catch (e) {}
      r[k] = isFinite(v) ? Math.round(+v * 100) / 100 : '';
    }
    let rht = null;
    try {
      rht = pvOf(fp('TICHR1002'));
    } catch (e) {}
    r.RHT = isFinite(rht) ? Math.round(+rht * 10) / 10 : '';
    /* the water inventory (Mina beta.146 ~ 154: hotwell -300 on a feedwater surge): hotwell level, deaerator level and its valve
       LCV-CD1104, the condensate flow, the hotwell make-up valve LCV-MU1110 */
    const u = U(),
      w = (k, x) => (r[k] = isFinite(x) ? Math.round(+x * 10) / 10 : '');
    w('HW', u.cdHw);
    w('CDQ', u.cdQt);
    const g = (t, fn) => {
      try {
        return fn(fp(t));
      } catch (e) {
        return NaN;
      }
    };
    w('DA', g('LICCD1104', pvOf));
    w('DAMV', g('LICCD1104', mvOf));
    w('MUMV', g('LICCD1110A', mvOf));
    /* 3.2.3-beta.5 (Mina load run L1, RHT 560 C on load up): the steam temperature loops, to compare with plant scenario 1 (load up
       7.6 ~ 8.6 h: MST 551, RHT 552, 2nd spray MV in steps of 5): ABC-012 outer TICMS1004 and spray 2 TICBR1150, ABC-011 spray 1
       TICBR1130, ABC-019 RH spray TICHR1002, ABC-020 RH / SH flue gas damper TICHR1002A (controller MV, %) */
    w('MSOMV', g('TICMS1004', mvOf));
    w('SP1MV', g('TICBR1130', mvOf));
    w('SP2MV', g('TICBR1150', mvOf));
    w('RHSMV', g('TICHR1002', mvOf));
    w('RHDMV', g('TICHR1002A', mvOf));
    /* 3.2.3-beta.10 (Mina beta.9 B6-7, hotwell -293 mm after the trip): where the steam goes after a trip. ABC-013 blow-off
       PICMS1002 (PCV-MS1001, to the air: the water leaves the cycle) and ABC-050 HP bypass PICMS1006 (PCV-MS1020, back to the
       condenser through the reheater and the LP bypass) */
    w('BOSV', g('PICMS1002', svOf));
    w('BOMV', g('PICMS1002', mvOf));
    w('HPBSV', g('PICMS1006', svOf));
    w('HPBMV', g('PICMS1006', mvOf));
    return r;
  };
  setInterval(() => {
    try {
      const u = window.AN && AN.unit;
      if (!u || !u.on || AN._loading) return;
      if (((window.AN && AN.loadN) || 0) !== REC.n) (REC.n = AN.loadN || 0), (REC.rows = []), (REC.last = -1);
      const m = Math.floor((+u.t || 0) / 60);
      if (m < REC.last) (REC.rows = []), (REC.last = -1); /* time went back: a save point or a Reset */
      if (m === REC.last) return;
      /* Mina, load run of 3.2.2: the first row had empty hotwell / condensate columns (taken before the first step of the plant after a
         state load). The first row waits for the condenser (a few seconds at most, then it goes in anyway) */
      /* Mina, beta.2 check: still empty with the plant paused at t = 0 after the load (the condenser had not stepped yet): the first row
         also waits for the first step of the plant (t > 0) */
      if (!REC.rows.length && !(+u.t > 0)) return;
      if (!REC.rows.length && !(isFinite(u.cdHw) && isFinite(u.cdQt)) && (REC.wait = (REC.wait || 0) + 1) < 6) return;
      REC.wait = 0;
      REC.last = m;
      REC.rows.push(recRow());
      if (REC.rows.length > 6000) REC.rows.shift();
    } catch (e) {}
  }, 1000);
  const recCsv = () => {
    const X = ['RHT', 'HW', 'CDQ', 'DA', 'DAMV', 'MUMV', 'MSOMV', 'SP1MV', 'SP2MV', 'RHSMV', 'RHDMV', 'BOSV', 'BOMV', 'HPBSV', 'HPBMV'],
      H = ['t_min'].concat(REC_K, X);
    /* Mina, load run of 3.2.2: t_min 42 came twice. A row is taken once per whole minute (Math.floor), so the column counts the same
       way: Math.round put 41.5 min and 42.0 min both at 42 */
    return [H.join(',')].concat(REC.rows.map(r => [Math.floor(r.t / 60)].concat(REC_K.map(k => r[k]), X.map(k => r[k])).join(','))).join('\r\n');
  };
  const VAL = (k, lo, hi) => ({
    sig: [k],
    res: () => k in NAMES,
    ok: () => rng(getV(k), lo, hi),
    now: () => NAMES[k][0] + ' ' + f1(getV(k)) + ' ' + NAMES[k][1],
    want: NAMES[k][0] + ' ' + wr(lo, hi, NAMES[k][1]),
    go: NAMES[k][3] ? { tag: NAMES[k][3], sh: NAMES[k][2] } : NAMES[k][2] ? { sh: NAMES[k][2] } : { plant: 1 }
  });
  const ALL = (...L) => ({
    sig: [].concat(...L.map(c => c.sig)),
    res: () => L.every(c => c.res()),
    ok: () => L.every(c => c.ok()),
    now: () => L.map(c => c.now()).join(' · '),
    want: L.map(c => c.want).join(' and '),
    parts: L,
    go: L[0].go
  });
  /* the condition must hold this many seconds of simulation (a pressure "stable at", a purge "for five minutes") */
  const HOLD = (sec, c) => Object.assign({}, c, { hold: sec, want: c.want + ', ' + sec + ' s' });
  /* only after another step has ticked (the MFT reset comes at the end of the purge) */
  const AFTER = (key, c, txt) => Object.assign({}, c, { ok: () => !!LAT[key] && c.ok(), want: c.want + ' (after ' + txt + ')' });

  /* ---------- the motors whose running memory is on the ABC sheets (memory lists, hmi-op.js) ---------- */
  const RUN = {
    IDF: BIT('M.3304', 1, 'ID fan running'),
    PAF: BIT('M.3302', 1, 'PA fan running'),
    SAF: BIT('M.3303', 1, 'SA fan running'),
    FAB: ANYBIT(['M.3308', 'M.3309'], 'FA blower running'),
    BFP: ANYBIT(['M.3343', 'M.3344'], 'BFWP running'),
    CEP: ANYBIT(['M.3350', 'M.3351'], 'condensate pump running'),
    SWP1: ANYBIT(['M.3353', 'M.3354', 'M.3355'], 'seawater pump running'),
    FEED: ANYBIT(['M.3400', 'M.3401', 'M.3402'], 'coal feeder running')
  };
  const SWP2 = {
    sig: ['M.3353', 'M.3354', 'M.3355'],
    res: () => has('M.3353'),
    ok: () => ['M.3353', 'M.3354', 'M.3355'].filter(a => val(a) > 0.5).length >= 2,
    now: () => ['M.3353', 'M.3354', 'M.3355'].map(a => a + ' ' + (val(a) > 0.5 ? 1 : 0)).join(', '),
    want: 'two seawater pumps running (M.3353 / M.3354 / M.3355)',
    go: { addr: 'M.3353' }
  };
  const BURN = ANYBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'a start-up burner in service');
  const BURN4 = {
    sig: ['M.3412', 'M.3413', 'M.3418', 'M.3419'],
    res: () => has('M.3412'),
    ok: () => ['M.3412', 'M.3413', 'M.3418', 'M.3419'].every(a => val(a) > 0.5),
    now: () => ['M.3412', 'M.3413', 'M.3418', 'M.3419'].map(a => a + ' ' + (val(a) > 0.5 ? 1 : 0)).join(', '),
    want: 'all 4 start-up burners in service (M.3412 / M.3413 / M.3418 / M.3419)',
    go: { addr: 'M.3412' }
  };
  const NOFEED = NOBIT(['M.3400', 'M.3401', 'M.3402'], 'coal feeders stopped');
  /* user 2026-10-29: the purge air is the logic's own signal, ABC-006 M.0340 "TOTAL AIR FLOW < 25% MCR (151.5 T/H)" = 0, DESIGN BASE of
     the ABC sheets: total air 606 T/H at 100 % load (was 115 T/H = 25 % of the 460 T/H steam MCR, wrong) */
  const PURGE_AIR = {
    sig: ['M.0340', 'AIR'],
    res: () => has('M.0340') || 'AIR' in NAMES,
    ok: () => (has('M.0340') ? !(val('M.0340') > 0.5) : rng(getV('AIR'), 151.5, null)),
    now: () => NAMES.AIR[0] + ' ' + f1(getV('AIR')) + ' ' + NAMES.AIR[1] + (has('M.0340') ? ' · M.0340 = ' + (val('M.0340') > 0.5 ? 1 : 0) : ''),
    want: 'Total air ≥ 25 % MCR = 151.5 T/H (ABC-006 M.0340 = 0)',
    go: { addr: 'M.0340' }
  };
  const MFT = BIT('I.000F', 0, 'no MFT');

  /* 3.2.0 retest #45 #47 #33: the equipment of sections 2 ~ 17 that runs on a DITL drawing or at a local panel (dock.js reads the drawing
     of the one world: RUNNING output, input row, field state) */
  const DK = () => window.LS_DOCK;
  const DC = (want, ok, now) => ({ sig: [], res: () => true, ok: () => !!(DK() && ok()), now: () => (DK() ? now() : '—'), want, go: {} });
  const dRun = nm => DK().runOut(nm) === 1;
  const LOP4 = ['DITL-22', 'DITL-22 #B', 'DITL-22 #C', 'DITL-22 #D'];
  const dOut = (nm, r) => DK().dout(nm, r) === 1;
  const dIn = (nm, r) => {
    const s = DK().dOf(nm);
    try {
      return !!s && DUI.rowVal(s, r) === 1;
    } catch (e) {
      return false;
    }
  };
  const nRun = L => L.filter(dRun).length;
  const SWPA = ['M.3353', 'M.3354', 'M.3355'],
    SWPD = ['DITL-29A', 'DITL-29A #B', 'DITL-29A #C'];
  const SWP_STBY = DC(
    'two seawater pumps running and the standby in REMOTE + AUTO (DITL-29A row 5 REMOTE, row 4 AUTO MODE SELECTED)',
    () => SWPA.filter(a => val(a) > 0.5).length >= 2 && SWPA.some((a, j) => !(val(a) > 0.5) && dIn(SWPD[j], 3) && dIn(SWPD[j], 4)),
    () => SWPA.map((a, j) => 'SWP-' + 'ABC'[j] + (val(a) > 0.5 ? ' RUN' : (dIn(SWPD[j], 4) ? ' REM' : ' LOC') + (dIn(SWPD[j], 3) ? ' AUTO' : ' MAN'))).join(', ')
  );
  /* live test 2026-10-30 #12 #24: the standby of a pump set in REMOTE (row 22 REMOTE MODE SELECTED) and AUTO (row au) on its drawing */
  const STBY = (L, n, au, l) =>
    DC(
      n + ' ' + l + ' running and the standby in REMOTE + AUTO',
      () => nRun(L) >= n && L.some(nm => !dRun(nm) && dIn(nm, au) && dIn(nm, 21)),
      () => L.map(nm => nm.replace(/^DITL-\S+\s*#?/, '') + (dRun(nm) ? ' RUN' : (dIn(nm, 21) ? ' REM' : ' LOC') + (dIn(nm, au) ? ' AUTO' : ' MAN'))).join(', ')
    );
  /* #23: the expansion tank T-1109 at NL 1.7 m (LT-CW1109, plant model AN_MU) and XV-MU1109 in AUTO (DITL-78 row 3 AUTO SELECTED) */
  const ET = () => +((AN.unit || {}).etLvl) || 0;
  const ET_NL = DC('expansion tank at NL 1.7 m (LT-CW1109)', () => ET() >= 1.69, () => 'LT-CW1109 ' + ET().toFixed(2) + ' m');
  const XV_AUTO = DC('XV-MU1109 in AUTO (DITL-78 row 3)', () => dIn('DITL-78', 2) || dIn('DITL-78', 0), () => 'XV-MU1109 ' + (dIn('DITL-78', 2) || dIn('DITL-78', 0) ? 'AUTO' : 'MAN'));
  const FIELD = (k, l) => DC(l + ' running (local)', () => !!(AN.fieldState && AN.fieldState()[k]), () => l + ' ' + (AN.fieldState && AN.fieldState()[k] ? 'RUNNING' : 'STOPPED'));
  const TCSR = (k, l) => {
    const on = () => {
      const x = AN.tcs && AN.tcs();
      return x ? !!x.aux[k] : !!(AN.unit && AN.unit.on);
    };
    return DC(l + ' running (TCS)', on, () => l + ' ' + (on() ? 'RUNNING' : 'STOPPED'));
  };
  const OUTC = (nm, r, l) => DC(l + ' (' + nm + ' out ' + (r + 1) + ')', () => dOut(nm, r), () => l + ' ' + (dOut(nm, r) ? 'ON' : 'OFF'));
  const INC = (nm, r, l) => DC(l + ' (' + nm + ' row ' + (r + 1) + ')', () => dIn(nm, r), () => l + ' ' + (dIn(nm, r) ? 'ON' : 'OFF'));
  /* #55: a drawing of one machine keeps its name (DITL-76 / 77 ACW pumps read " RUN,  STOP") */
  const RUNN = (L, n, l) => DC(n + ' ' + l + ' running', () => nRun(L) >= n, () => L.map(nm => (nm.replace(/^DITL-\S+\s*#?/, '') || nm) + (dRun(nm) ? ' RUN' : ' STOP')).join(', '));
  /* live test #54: [running memory, [model tags]] of the machines: done when one runs and every tag of the running ones is read below hi */
  const MOT = (L, hi, l, u) => {
    const mt = t => (U().mt ? +U().mt[t] : NaN),
      on = () => L.filter(([a]) => val(a) > 0.5);
    return DC(
      l + ' < ' + hi + ' ' + u + ' (running)',
      () => on().length > 0 && on().every(([, T]) => T.every(t => mt(t) < hi)),
      () => on().map(([, T]) => T.map(t => t.replace(/^[TV]T-/, '') + ' ' + f1(mt(t))).join(', ')).join(' · ') || 'not running'
    );
  };
  const SWBP = ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'],
    MWP = ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'],
    ACW = ['DITL-76', 'DITL-77'];

  /* ---------- the steps: [section number, regex on the step text, condition] (first match wins); the rest by the general rules ---------- */
  const R = [
    [2, /initiate selected 1st SWP START/i, RUN.SWP1],
    [2, /START 2nd Selected SWP/i, SWP2],
    [2, /Set the standby SWP to AUTO/i, SWP_STBY],
    /* live test #54: the motor temperatures and vibration of the plant model (unit.js AN_MT), read on a running machine and below the H
       of the alarm list (SWP bearing H 95 C, vibration H 7.6 mm/s; IDF bearing H 90, winding H 140, vibration H 8) */
    [2, /^Temperature$/i, MOT(['A', 'B', 'C'].map((p, j) => [SWPA[j], ['TT-SW1501-' + p + '3', 'TT-SW1501-' + p + '4']]), 95, 'SWP bearing TI SW1501x3 / x4', 'C')],
    [2, /^Vibration$/i, MOT(['A', 'B', 'C'].map((p, j) => [SWPA[j], ['VT-SW1501-' + p + '1', 'VT-SW1501-' + p + '2']]), 7.6, 'SWP vibration VI SW1501x1 / x2', 'mm/s')],
    [22, /^Fan bearing temperature/i, MOT([['M.3304', ['TT-FG1056-1', 'TT-FG1056-2', 'TT-FG1056-3', 'TT-FG1056-4']]], 90, 'IDF bearing TT-FG1056-1 ~ 4', 'C')],
    [22, /^Fan winding temperature/i, MOT([['M.3304', ['TT-FG1056-U', 'TT-FG1056-V', 'TT-FG1056-W']]], 140, 'IDF winding TT-FG1056-U / V / W', 'C')],
    [22, /^Fan bearing vibration/i, MOT([['M.3304', ['VT-FG1056-1', 'VT-FG1056-2', 'VT-FG1056-3', 'VT-FG1056-4']]], 8, 'IDF vibration VT-FG1056-1 ~ 4', 'mm/s')],
    [3, /Initiated START Hypo/i, FIELD('hypo', 'Hypochlorite pump')],
    [3, /pump is running at local/i, FIELD('hypo', 'Hypochlorite pump')],
    [4, /Set debris filter to auto start/i, OUTC('DITL-39', 3, 'SWP outlet debris filter IN OPERATION')],
    [5, /START to 1st selected Sea Water Booster/i, RUNN(SWBP, 1, 'SWBP')],
    [5, /START to 2nd selected Sea Water Booster/i, RUNN(SWBP, 2, 'SWBP')],
    [5, /Set the standby SWBP to AUTO/i, STBY(SWBP, 2, 3, 'SWBP')],
    [6, /Set debris filter to auto start/i, OUTC('DITL-39', 14, 'SWBP outlet debris filter IN OPERATION')],
    [7, /Initiate START to selected MWP/i, RUNN(MWP, 1, 'MWP')],
    [7, /Standby Make-up Pump and Set the Pump to AUTO/i, STBY(MWP, 1, 14, 'MWP')],
    [7, /^Open Expansion tank automatic inlet valve/i, ET_NL],
    [7, /^Set Expansion tank inlet valve \(XV-MU1109\) to AUTO/i, ALL(ET_NL, XV_AUTO)],
    /* live test #50: the priming of the closed cooling line from the tank (V-CW1001, field valve of the plant model AN_MU) */
    [7, /^Open Expansion tank outlet valve to prime/i, DC('V-CW1001 open, closed cooling line primed', () => +(U().cwPrime || 0) >= 1, () => 'V-CW1001 ' + (AN.fieldState && AN.fieldState().cw1001 ? 'OPEN' : 'CLOSED') + ' · primed ' + Math.round(100 * (+U().cwPrime || 0)) + ' %')],
    [7, /^Close all vents if close cooling line is fully primed/i, ALL(DC('closed cooling line primed', () => +(U().cwPrime || 0) >= 1, () => 'primed ' + Math.round(100 * (+U().cwPrime || 0)) + ' %'), ET_NL)],
    [8, /Initiate START of the selected AWCP/i, RUNN(ACW, 1, 'ACW pump')],
    /* live test #51: the standby ACWP in REMOTE (row 5 MIL-P1108A / B REMOTE SELECTED, I.0088 / I.0408) and AUTO (out 1 AUTO SELECTED, the
       same output the 027 faceplate reads; input rows 1 and 4 are both M.1232 / M.1242 AUTO MODE (CRT)) */
    [
      8,
      /Set selected standby ACWP in AUTO/i,
      DC(
        'one ACW pump running and the standby in REMOTE + AUTO (DITL-76 / 77 out 1 AUTO SELECTED)',
        () => nRun(ACW) >= 1 && ACW.some(nm => !dRun(nm) && dOut(nm, 0) && dIn(nm, 4)),
        () => ACW.map((nm, j) => 'ACWP-' + 'AB'[j] + (dRun(nm) ? ' RUN' : (dIn(nm, 4) ? ' REM' : ' LOC') + (dOut(nm, 0) ? ' AUTO' : ' MAN'))).join(', ')
      )
    ],
    [9, /Initiate ON to selected dryer/i, OUTC('DITL-45', 14, 'Instrument air dryer A RUNNING')],
    [10, /^Initiate RUN with proper coordination/i, INC('DITL-113', 5, 'IA compressor A RUNNING')],
    [11, /Initiate ON to selected dryer/i, OUTC('DITL-45', 3, 'Plant air dryer A RUNNING')],
    [12, /^Initiate RUN with proper coordination/i, INC('DITL-114', 5, 'PA compressor A RUNNING')],
    /* R9 #78 #77: the turbine oil sections: the lube oil temperature control to REMOTE (TICLO1002, valve TCVCW1201 of the SOP table; AUTO on the drawing),
       the vapour extractor, MOP and COP of the TCS panel, the oil purifier at its local panel */
    [13, /Lube Oil Temp Control Valve change mode to Remote/i, MODE('TICLO1002', 'AUTO')] /* ABC-053 has no TICLO1002.REM: the DCS holds it in AUTO */,
    [14, /^Start the Vapour Extractor/i, TCSR('vex', 'Vapour extractor')],
    [14, /^Start one of the Main Oil Pump/i, TCSR('lop', 'Main oil pump MOP')],
    [15, /^Start the Oil Purifier Pump/i, FIELD('pur', 'Oil purifier pump')],
    /* live test #66: running AND within the normal band 5.6 ~ 6.6 kg/cm2g (was: running only) */
    [
      16,
      /^Verify that Main Oil Pump is running/i,
      DC(
        'Main oil pump MOP running, lube oil 5.6 ~ 6.6 kg/cm2g',
        () => {
          const x = AN.tcs && AN.tcs(),
            p = x && x.oil ? +x.oil.lube : NaN;
          return !!(x && x.aux && x.aux.lop) && p >= 5.6 && p <= 6.6;
        },
        () => {
          const x = AN.tcs && AN.tcs();
          return 'MOP ' + (x && x.aux && x.aux.lop ? 'RUNNING' : 'STOPPED') + ' · lube oil ' + f1(x && x.oil ? +x.oil.lube : NaN) + ' kg/cm2g';
        }
      )
    ],
    [16, /^Start one of the Control Oil Pump/i, TCSR('eh', 'Control oil pump COP')],
    /* live test #71: the biasing dampers (ABC-020 hand stations; 10 % = the lowest DCS position, ML of the parameter sheet) */
    [17, /^Ensure biasing dampers are closed/i, ALL(MV('HICHR1002A', null, 12), MV('HICHR1002B', null, 12))],
    [17, /Initiate START air pre-heater drive motor/i, RUNN(['DITL-43'], 1, 'air preheater')],
    [17, /^Open Biasing damper to 100% at Reheater and Superheater/i, ALL(MV('HICHR1002A', 99.5, null), MV('HICHR1002B', 99.5, null))],
    [18, /initiate START to selected CEP/i, RUN.CEP],
    [18, /FCV-CD1120 to MANUAL and ADJUST to 60/i, ALL(MODE('FCV-CD1120', 'MAN'), MV('FCV-CD1120', 55, 65))],
    [18, /set the standby CEP to REMOTE/i, DC('the standby CEP in REMOTE + AUTO (DITL-61A rows 5 / 4)', () => [['DITL-61A', 'DITL-61A #B'], ['DITL-61A #B', 'DITL-61A']].some(([r, s]) => dRun(r) && !dRun(s) && dIn(s, 3) && dIn(s, 4)), () => ['DITL-61A', 'DITL-61A #B'].map((nm, j) => 'CEP-' + 'AB'[j] + (dRun(nm) ? ' RUN' : (dIn(nm, 4) ? ' REM' : ' LOC') + (dIn(nm, 3) ? ' AUTO' : ' MAN'))).join(', '))] /* audit B6 */,
    [18, /Set SV to 150 T\/H and Set to AUTO/i, ALL(MODE('FCV-CD1120', 'AUTO'), SV('FCV-CD1120', 140, 160, 'T/H'))],
    [18, /set LCV-MU1110 to AUTO/i, MODE('LCV-MU1110', 'AUTO')],
    [19, /Set Deaerator Level control valve \(LCV-CD1104\) to AUTO/i, ALL(MODE('LCV-CD1104', 'AUTO'), SV('LCV-CD1104', -20, 20, 'mm'))],
    [20, /^Initiate START of LOP of BFP/i, DC('a BFWP aux. lube oil pump running (DITL-22)', () => LOP4.some(nm => dRun(nm)), () => LOP4.map((nm, j) => ['A/A', 'B/A', 'A/B', 'B/B'][j] + ' ' + (dRun(nm) ? 'RUN' : 'STOP')).join(', '))] /* audit A2: the four aux. LOPs, DCS motors of DITL-22 */,
    [20, /^Set the selected standby BFP LOP to AUTO/i, DC('the standby aux. LOP in AUTO (DITL-22 row 6 AUTO MODE SELECTED)', () => [[0, 1], [2, 3]].some(([a, b]) => (dRun(LOP4[a]) && !dRun(LOP4[b]) && dIn(LOP4[b], 5)) || (dRun(LOP4[b]) && !dRun(LOP4[a]) && dIn(LOP4[a], 5))), () => LOP4.map((nm, j) => ['A/A', 'B/A', 'A/B', 'B/B'][j] + (dIn(nm, 5) ? ' AUTO' : ' MAN')).join(', '))],
    [20, /Initiate START to selected BFP/i, RUN.BFP],
    [20, /SET FCV-FW1130-2 to MANUAL/i, MODE('FCV-FW1130-2', 'MAN')],
    [20, /^Drum level \(-150mm\)/i, HOLD(30, VAL('lvl', -200, -100))],
    [22, /Ensure Secondary and Primary Air Damper are 100% OPEN/i, ALL(MV('FICFA1081', 95, null), MV('FICFA1071', 95, null))],
    /* audit 2026-11-03 (no_cheat C): the CRO items of PR-OPE-5002 that name a tag of the app tick from that tag (the SOP's own numbers) */
    [23, /Ensure Fluidizing Air Damper is at least 25% OPEN/i, DC('Fluidizing air damper FCV-FA1055-A1 or -B1 ≥ 25 %', () => [MV('FICFA1055A', 25, null), MV('FICFA1055B', 25, null)].some(c => c.ok()), () => 'FCV-FA1055-A1 / -B1 (FICFA1055A / B MV)')],
    [21, /^Initiate START on selected Diesel oil pump/i, DC('a diesel oil pump running (DITL-31)', () => dRun('DITL-31') || dRun('DITL-31 #B'), () => 'DOP A ' + (dRun('DITL-31') ? 'RUN' : 'STOP') + ', B ' + (dRun('DITL-31 #B') ? 'RUN' : 'STOP'))] /* audit A1 */,
    [21, /^Set standby diesel oil pump to AUTO/i, DC('the standby diesel oil pump in AUTO (DITL-31 row 9)', () => (dRun('DITL-31') && !dRun('DITL-31 #B') && dIn('DITL-31 #B', 8)) || (dRun('DITL-31 #B') && !dRun('DITL-31') && dIn('DITL-31', 8)), () => 'DOP A ' + (dIn('DITL-31', 8) ? 'AUTO' : 'MAN') + ', B ' + (dIn('DITL-31 #B', 8) ? 'AUTO' : 'MAN'))],
    [21, /^Fully OPEN FCV-DO1012 and Set to manual/i, MV('FCV-DO1012', 99, null)],
    [21, /^Decrease opening of PCV-DO0002/i, ALL(MODE('PICDO0005', 'MAN'), PV('PICDO0005', 12.5, null, 'kg/cm2'))] /* SOP 21.16 / 21.17: PCV-DO0002 in manual, PI-D00005 = 12.5 kg/cm2 */,
    [24, /^> ?1200 ?mmH2O = with bed/i, VAL('SAP', 1200, null)],
    [24, /^> ?600 ?mmH2O = without bed/i, VAL('SAP', 600, null)],
    [25, /^At DCS, Increase PAF Inlet Damper Manually/i, ALL(MODE('FICFA1071', 'MAN'), VAL('PA', 180, null), VAL('FP', -65, 35))] /* SOP 25.12 ~ 25.14: manual, target primary air flow 180 T/H (no bed) / 280 (with bed), furnace pressure inside the alarm limits of PT-FG1085 / 1086 (alarm list 20160912: L -65, normal -15, H 35 mmH2O) */,
    [26, /Dampers of secondary staging air nozzles close to limit stop/i, null],
    [33, /^Main Steam Pressure/i, null],
    [22, /IDF inlet Damper opening is about 93%/i, ALL(RUN.IDF, MV('PICFG108A', 85, 100))],
    [25, /Ensure Biasing Damper/i, ALL(MV('HICHR1002A', 99.5, null), MV('HICHR1002B', 99.5, null))],
    [22, /Ensure Biasing Damper/i, ALL(MV('HICHR1002A', 99.5, null), MV('HICHR1002B', 99.5, null))],
    [22, /IDF Damper is fully closed and hydraulic coupling/i, MV('PICFG108', null, 2)],
    [22, /Select hydraulic coupling as furnace pressure control mode/i, MODE('PICFG108', 'MAN')],
    [22, /^Start IDF at DCS/i, RUN.IDF],
    [22, /Hydraulic Coupling Furnace Pressure Control at 13%/i, ALL(RUN.IDF, MV('PICFG108', 10, 16))],
    [22, /maintaining furnace pressure of -15mmH2O/i, HOLD(60, ALL(RUN.IDF, VAL('FP', -65, 35)))],
    [22, /Adjust Primary\/Secondary Air Fan Damper Opening to 0%/i, ALL(RUN.IDF, MV('FICFA1081', null, 5))],
    [23, /At DCS, Start Selected Fluidizing Air Blower/i, RUN.FAB],
    [23, /until Fluidizing air flow increase to 26 T\/H/i, VAL('FA', 24, null)],
    [23, /Adjust Secondary Air Fan Damper Opening to 0%/i, ALL(RUN.FAB, MV('FICFA1081', null, 5))],
    [24, /Gradually Close Secondary Air Fan Damper/i, ALL(MV('FICFA1081', null, 5), VAL('FP', -30, 0))],
    [24, /At DCS, Start Secondary Air Fan/i, RUN.SAF],
    [24, /combustion air flow increase to 200T\/H/i, ALL(RUN.SAF, VAL('SA', 180, null))],
    [25, /Gradually Close Primary Air Fan Damper/i, ALL(MV('FICFA1071', null, 5), VAL('FP', -30, 0))],
    [25, /At DCS, Start Primary Air Fan/i, RUN.PAF],
    [25, /^180T\/H = No Bed/i, ALL(RUN.PAF, VAL('PA', 170, null))],
    [25, /^280 T\/H = With Bed/i, ALL(RUN.PAF, VAL('PA', 270, null))],
    [25, /set the HC Control \(Furnace Pressure Control\) Mode in AUTO/i, ALL(MODE('PICFG108', 'AUTO'), VAL('FP', -65, 35))],
    [26, /Adjust Air Flow to >25% MCR/i, PURGE_AIR],
    [26, /^Total Air Flow > 25% MCR/i, PURGE_AIR],
    [26, /^Induced Draft Fan is running/i, RUN.IDF],
    [26, /^Secondary Air Fan is running/i, RUN.SAF],
    [26, /^Any of Fluidizing blower running/i, RUN.FAB],
    [26, /^All Coal Feeder Stop/i, NOFEED],
    [26, /^Primary Air Fan is running/i, RUN.PAF],
    [26, /^All Burner Has no Flame/i, NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'no start-up burner in service')],
    [26, /^R\/H damper >= 30% Position/i, MV('HICHR1002A', 30, null)],
    [26, /^S\/H Damper >= 60% Position/i, MV('HICHR1002B', 60, null)],
    [26, /^No Boiler Trip Command/i, MFT],
    [26, /Initiate and Start Furnace Purge for five \(5\) minutes/i, HOLD(300, ALL(RUN.IDF, RUN.PAF, RUN.SAF, PURGE_AIR, NOFEED))],
    [26, /Check MFT will RESET/i, AFTER('25.21', MFT, 'the 5 minute purge')],
    [26, /Set biasing damper opening to RH 10% and SH 90%/i, ALL(MV('HICHR1002A', 5, 15), MV('HICHR1002B', 85, 95))],
    [26, /Put SH biasing damper to AUTO/i, MODE('HICHR1002B', 'AUTO')],
    /* live test #57: AIR PRE-HEATER SOOT BLOWER START-UP (DITL-80K / 80M, see guide.js sbK); LOCAL medium source and Circulation
       Function: no DCS signal on the drawings */
    [27, /^Ensure Plant Air Compressor is running/i, DC('plant air PT-PA1705 >= 7 kg/cm2', () => +U().paP >= 6.95, () => 'PT-PA1705 ' + f1(+U().paP || 0) + ' kg/cm2')],
    [27, /^Check the medium source at LOCAL/i, null],
    [27, /^Select air heater soot blower source select PLANT AIR/i, INC('DITL-80K', 19, 'S/B source PLANT AIR (M.4212)')],
    [27, /^Start soot blowing Air Preheater/i, DC('APH S/B forward starter O.077C (DITL-80K)', () => !!(window.LS_GUIDE && LS_GUIDE.aphSb && LS_GUIDE.aphSb()), () => 'APH S/B ' + (window.LS_GUIDE && LS_GUIDE.aphSb && LS_GUIDE.aphSb() ? 'STARTED' : 'not started'))],
    [27, /Circulation Function/i, null],
    [28, /Press Burner .ON. Push button at DCS/i, BURN],
    [28, /shut-off valves for diesel oil supply/i, VAL('oilF', 0.3, null)],
    [28, /Check if flame scanner detects flame/i, ALL(BURN, VAL('oilF', 0.3, null))],
    [28, /Light off another burner/i, {
      sig: ['M.3412', 'M.3413', 'M.3418', 'M.3419'],
      res: () => has('M.3412'),
      ok: () => ['M.3412', 'M.3413', 'M.3418', 'M.3419'].filter(a => val(a) > 0.5).length >= 2,
      now: () => ['M.3412', 'M.3413', 'M.3418', 'M.3419'].map(a => a + ' ' + (val(a) > 0.5 ? 1 : 0)).join(', '),
      want: 'two start-up burners in service',
      go: { addr: 'M.3413' }
    }],
    [28, /Once all 4 burners are in service/i, BURN4],
    [28, /Steam drum pressure is 2kg/i, VAL('Pd', 2, null)],
    [28, /swelling approximately > 100/i, VAL('Tw', 100, null)],
    [28, /steam drum pressure of above 10/i, VAL('Pd', 10, null)],
    [30, /Main Steam Pressure>12KSC/i, VAL('MSP', 12, null)],
    [33, /^CEP in service/i, RUN.CEP],
    [44, /Solid Fuel Feeder in REMOTE AUTO/i, ALL(RUN.FEED, MODE('FICCL1061A', 'AUTO'))],
    [44, /Solid Fuel Feeder READY/i, VAL('Tb', 400, null)],
    [44, /Speed Demand at MINIMUM/i, ALL(RUN.FEED, MV('FIC-CF', null, 15))],
    [44, /Solid Fuel on Feeder Belt/i, VAL('coal', 1, null)],
    [44, /Adjust PAF and SAF damper\/air flow equal to RSV and put to REMOTE/i, ALL(MODE('FICFA1071', 'REM'), MODE('FICFA1081', 'REM'))],
    [44, /Put COAL MASTER to REMOTE/i, MODE('FIC-CM', 'REM')],
    [44, /Put Boiler Master to Auto/i, MODE('HIC-BM', 'AUTO')]
  ];
  /* the turbine control panel (outside the DCS drawings) */
  const TCS = /\b(TCS|ATS|criteria|turning gear|MSV|RSV|ICVs?|CV chest|chest warming|rub check|synchro ?scope|emergency oil pump|main oil pump|COP|excitation|Auxiliary Control|auto synch)\b/i;

  /* ---------- the two sections the app adds (targets: check.js M4 roll / sync / 45 MW and 45 -> 150 MW stages) ---------- */
  const X1 = [
    ['Turbine at rated speed 3600 rpm (ATS ACCELERATION, TCS panel).', HOLD(10, VAL('rpm', 3550, null))],
    ['Generator synchronized: GCB 52G1 closed (TCS auto synch).', ALL(BIT('I.0931', 1, 'GCB 52G1 on'), BIT('M.3220', 0, '52G1 opened'))],
    ['Initial load 4.5 MW picked up by the TCS.', ALL(BIT('I.0931', 1, 'GCB 52G1 on'), VAL('MW', 3.5, null))],
    ['Put the LP bypass pressure control to REMOTE (SV = first stage pressure + 5.1).', MODE('PICHR1003', 'REM')],
    ['Load up at 5 %/min (7.5 MW/min) to 45 MW; ICV → CV transfer between 15 and 22 MW.', ALL(BIT('I.0418', 1, 'ICV to CV transfer complete'), VAL('MW', 15, null))],
    ['Feedwater over 100 T/H: FICFW1007 to REMOTE + AUTO, LICBR1001 AUTO, press 3-ELEMENT (single-element start-up valve LICBR1001B closed).', ALL(VAL('FW', 100, null), MODE('FICFW1007', 'REM'), MODE('LICBR1001', 'AUTO'))],
    ['HP and LP bypass closed at 45 MW (M.0709 = 0).', ALL(VAL('MW', 44, null), BIT('M.0709', 0, 'bypass open'))],
    ['Hold 45 MW: MSP 115 ~ 131 kg/cm2, drum level ±150 mm, NORMAL OPERATION from the TCS.', HOLD(120, ALL(VAL('MW', 44, null), VAL('MSP', 115, 131), VAL('lvl', -150, 150)))]
  ];
  const X2 = [
    ['Put PAF and SAF air flow controls to REMOTE (FICFA1071, FICFA1081).', ALL(MODE('FICFA1071', 'REM'), MODE('FICFA1081', 'REM'))],
    ['Put the coal master FIC-CM to REMOTE.', MODE('FIC-CM', 'REM')],
    ['Put the boiler master HIC-BM to AUTO (boiler follow, PIC-COBM on the main steam pressure) up to 90 MW.', MODE('HIC-BM', 'AUTO')],
    ['Put the O2 control AICFG112 to AUTO.', MODE('AICFG112', 'AUTO')],
    ['Load 60 MW.', VAL('MW', 58, null)],
    ['Turbine master EIC-TM to AUTO, DCS control mode ON (coordinated control, CCS).', MODE('EIC-TM', 'AUTO')],
    ['Load 90 MW.', VAL('MW', 88, null)],
    ['Load 120 MW: SH spray TICBR1130 / TICBR1150 in AUTO.', ALL(VAL('MW', 118, null), MODE('TICBR1130', 'AUTO'), MODE('TICBR1150', 'AUTO'))],
    ['Load 150 MW.', VAL('MW', 148, null)],
    ['Hold 150 MW: MSP 118 ~ 128 kg/cm2, MST ≤ 545 °C, drum level ±150 mm, O2 3 ~ 6 %.', HOLD(300, ALL(VAL('MW', 147, 153), VAL('MSP', 118, 128), VAL('MST', null, 545), VAL('lvl', -150, 150), VAL('O2', 3, 6)))]
  ];
  /* 3.2.0-beta.16 (plan phase C, user 2026-10-23: "paano automatic na na adjust ng mga parameters para maihold ang demand load at ... ang
     tamang paggamit ng manual controls to attain the target load"): two PRACTICE sections at 150 MW. Each step ticks only after the
     one before it (a practice is done in order). Targets: the load down of the app (tests/regress/loaddown.js: HIC-ULD 150 -> 120 MW at
     HIC-MWRL 3 MW/min, coal 85 -> 72 T/H) and a manual run of the plant model (boiler master MANUAL: turbine master to 120 MW with the
     boiler still at 150 MW = MSP 123 -> 141 kg/cm2 in 5 min; boiler master x 0.8 = MSP back to 122.6) */
  const OUT = (t, lo, hi, u) =>
    Object.assign(MV(t, lo, hi), {
      now: () => {
        const f = fp(t);
        return (f ? f.t : t) + ' output ' + (f ? f1(mvOf(f)) : '—') + ' ' + u;
      },
      want: t + ' output ' + wr(lo, hi, u)
    });
  const SEQ = (si, L) => L.map((x, i) => (i ? [x[0], AFTER(si + '.' + (i - 1), x[1], 'step ' + i)] : x));
  const X3 = SEQ(BASE_N + 2, [
    ['Start at 150 MW with the coordinated control (CCS) in AUTO: boiler master HIC-BM and turbine master EIC-TM in AUTO, DCS control mode ON (I.0082 = 1).', ALL(MODE('HIC-BM', 'AUTO'), MODE('EIC-TM', 'AUTO'), BIT('I.0082', 1, 'DCS control mode ON'))],
    ['Lower the unit load demand on HIC-ULD (▼▼) to 120 MW.', OUT('HIC-ULD', null, 121, 'MW')],
    ['Watch the CCS: the MW comes down at 3 MW/min (HIC-MWRL) and the boiler master lowers the coal by itself (about 72 T/H at 120 MW).', HOLD(60, ALL(VAL('MW', 117, 123), VAL('coal', null, 78)))],
    ['The main steam pressure stays at its set point by itself (PIC-COBM 123 kg/cm2): MSP 118 ~ 128, drum level ±150 mm.', HOLD(120, ALL(VAL('MW', 117, 123), VAL('MSP', 118, 128), VAL('lvl', -150, 150)))],
    ['Raise the unit load demand on HIC-ULD (▲▲) back to 150 MW.', OUT('HIC-ULD', 149, null, 'MW')],
    ['Hold 150 MW: MSP 118 ~ 128 kg/cm2, drum level ±150 mm, O2 3 ~ 6 %.', HOLD(300, ALL(VAL('MW', 147, 153), VAL('MSP', 118, 128), VAL('lvl', -150, 150), VAL('O2', 3, 6)))]
  ]);
  const X4 = SEQ(BASE_N + 3, [
    ['At 150 MW put the boiler master HIC-BM to MANUAL (M). The turbine master EIC-TM goes to MANUAL with it (back-up command M.2016 of the drawing).', ALL(MODE('HIC-BM', 'MAN'), MODE('EIC-TM', 'MAN'))],
    ['Lower the turbine master EIC-TM (▼) to 120 MW. Watch the main steam pressure RISE: the boiler still fires for 150 MW.', ALL(OUT('EIC-TM', null, 121, 'MW'), VAL('MW', null, 125))],
    ['Lower the boiler master HIC-BM MV (about 54 % for 120 MW) until the coal and the pressure settle: MSP 118 ~ 128 kg/cm2 at 120 MW.', HOLD(120, ALL(VAL('MW', 117, 123), VAL('MSP', 118, 128)))],
    ['Raise the boiler master first (about 67 % for 150 MW), then the turbine master to 150 MW; keep MSP 118 ~ 128 kg/cm2.', HOLD(120, ALL(VAL('MW', 147, 153), VAL('MSP', 118, 128)))],
    ['Put HIC-BM back to AUTO once its back-up command is gone (M.2013 = 0), then EIC-TM to AUTO.', ALL(MODE('HIC-BM', 'AUTO'), MODE('EIC-TM', 'AUTO'))]
  ]);
  /* plan e4 (PR-OPE-5003-01 NORMAL SHUTDOWN, steps 4.1 ~ 4.20): 150 MW down to the turbine trip at 30 MW. Rates and holds from the
     procedure; the turbine trip at 30 MW makes an MFT on this unit (DITL turbine trip -> MFT path, plant-study 06-logic) */
  const X5 = [
    ['Set the load change rate HIC-MWRL to 1.2 MW/min (PR-OPE-5003: 150 ~ 90 MW at 1.2 MW/min).', OUT('HIC-MWRL', 1.1, 1.3, 'MW/min')],
    ['Lower the unit load demand HIC-ULD to 90 MW.', OUT('HIC-ULD', null, 91, 'MW')],
    ['Hold 90 MW for 8 ~ 10 min: drum level ±150 mm.', HOLD(480, ALL(VAL('MW', 87, 93), VAL('lvl', -150, 150)))],
    ['Set HIC-MWRL to 0.6 MW/min and lower HIC-ULD toward 45 MW (at 72 MW or 230 T/H feedwater: drum level single element). Near 63 MW the steam flow falls below 220 T/H: the back-up command M.2013 of ABC-001C puts the boiler master HIC-BM and the turbine master EIC-TM in MANUAL (the CCS lets go).', ALL(MODE('HIC-BM', 'MAN'), MODE('EIC-TM', 'MAN'))],
    ['By hand at about 0.6 MW/min: lower the turbine master EIC-TM to 45 MW and the boiler master HIC-BM with it, keeping the main steam pressure 115 ~ 131 kg/cm2 (at 60 MW: staging air upper 10 %, lower 15 ~ 20 %).', HOLD(60, ALL(VAL('MW', 43, 47), VAL('MSP', 115, 131)))],
    ['Bed 750 °C: PA and SA flow controls to MANUAL (FICFA1071, FICFA1081); stop limestone and sand; APH soot blower continuous.', ALL(VAL('Tb', null, 760), MODE('FICFA1071', 'MAN'), MODE('FICFA1081', 'MAN'))],
    ['Light the start-up burners one by one (SA pressure > 1200 mmH2O); move coal to diesel (2.5 T/H coal = 1 T/H diesel) up to 4 T/H oil per feeder.', BURN4],
    ['Hold 45 MW: drum level ±150 mm.', HOLD(120, ALL(VAL('MW', 43, 47), VAL('lvl', -150, 150), BURN4))],
    ['At 40 MW: take out extractions 3, 2 and 1; deaerator pressure PCVAS1030 to 2.5 kg/cm2 (field and TCS: confirm).', null],
    ['By hand at about 0.4 MW/min: lower EIC-TM to 30 MW and HIC-BM with it (main steam pressure 115 ~ 131 kg/cm2).', ALL(VAL('MW', null, 31), VAL('MSP', 115, 131))],
    ['Bed 700 °C: stop the coal feeders A, B and C; lower the PA fan to about 20 %.', ALL(VAL('Tb', null, 710), NOFEED)],
    ['At 30 MW: take out extractions 5 and 4, then turbine SHUT-DOWN (ATS step 8: 52G open, 41 open, turbine trip). On this unit the turbine trip makes an MFT.', BIT('I.000F', 1, 'MFT after the turbine trip')]
  ];
  /* plan e4 (PR-OPE-5004-01 SHUTDOWN TO BOTTLE-UP): after the turbine trip (on this unit the trip makes an MFT, so the start-up burners are
     already out). Valves of the field and the TCS are confirmed; motors, drum level, dampers and the furnace pressure are read */
  const X6 = [
    ['Close MV-MS1391, PCV-MS1001 (blow off), the HP bypass isolation valve and the auxiliary steam isolation valve; open the TG drain pots (upstream valve first), then hot reheat blow off MV-HR1391 to release the line and close it (field: confirm).', null],
    ['Main feedwater valve LICBR1001 to MANUAL 0 %, fill the steam drum to +200 mm on the start-up valve (and the deaerator to 0 mm).', ALL(VAL('lvl', 150, 250), MODE('LICBR1001', 'MAN'))],
    ['Close the BFP outlet valve (MV-FW1001 / MV-FW1002), then STOP the BFP in service; stop the dosing pump, close LCV-CD1104, stop the make-up water pump.', NOBIT(['M.3343', 'M.3344'], 'BFWP stopped')],
    ['Start-up burners out: oil FCV 25 %, OFF, igniter and oil gun retracted (after the MFT of the turbine trip they are already out).', NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'start-up burners out')],
    ['Diesel: PCV-DO0002 and PCV-DO1009 to MANUAL, open PCV-DO0002, PCV-DO1009 and FCV-DO1012 100 %, stop the diesel pump; open the CR / HR header drains near 0 kg/cm2 (field: confirm).', null],
    ['RH and SH biasing dampers 100 % before the draft is stopped.', ALL(MV('HICHR1002A', 99.5, null), MV('HICHR1002B', 99.5, null))],
    ['SAF inlet damper to 20 % (-5 % steps), PAF inlet damper to 0 % (-1 % steps), furnace pressure about -15 mmH2O; STOP the PA fan and the FA blowers.', NOBIT(['M.3302', 'M.3308', 'M.3309'], 'PA fan and FA blowers stopped')],
    ['SAF inlet damper down (-5 % steps), furnace pressure -15 mmH2O; STOP the SA fan.', NOBIT(['M.3303'], 'SA fan stopped')],
    ['ID fan coupling below 16 % goes to MANUAL by itself; lower it 1 % at a time to 0 % (-15 mmH2O), then STOP the ID fan.', NOBIT(['M.3304'], 'ID fan stopped')],
    ['Furnace pressure to DAMPER CONTROL: damper 5 %, then about 2.5 % until the furnace pressure is -20 ~ +20 mmH2O.', HOLD(60, VAL('FP', -20, 20))]
  ];
  /* plan e5 (FHI CFB manual Part 2 Sect 8 Tab 9 p20 ~ 25: loss of load, normal shutdown to hot standby, HOT RESTART): a turbine trip at
     150 MW and the hot restart. The bed of the model: TIFG1090 700 C = Tb about 625 C (the 954 / 850 snapshot ratio) */
  /* Mina beta.173 step 141: M.3339 is only a DITL-02 input row (row 25, from the station wiring), not in the address index, so BIT('M.3339')
     read nothing and the step never ticked. Read the row of the drawing */
  /* the bed falls under 700 C within seconds of the reset (Mina: 698 C 12 s after the press), so the by-pass counts when it was seen in
     the last 2 min of real time, not only at the scan of the reset */
  let byAt = 0;
  const byNow = () => {
    const on = !!(DK() && dIn('DITL-02', 24));
    if (on) byAt = Date.now();
    return on;
  };
  const BYP700 = DC('furnace lower layer > 700 C (purge by-pass, DITL-02 row 25 M.3339), now or in the last 2 min', () => byNow() || Date.now() - byAt < 120000, () => 'M.3339 = ' + (byNow() ? 1 : 0) + (byAt && !byNow() ? ' (was 1 ' + Math.round((Date.now() - byAt) / 1000) + ' s ago)' : ''));
  /* 3.2.3-beta.12 (Mina beta.9 ~ 11, B6-7): after the trip from 150 MW the hotwell fell to -293 / -300 mm in 6 min and CEP A stopped on
     hotwell low-low (ABC-031 M.3211, DITL-61A row 13). Water balance (b3210 runs): the blow-off PCV-MS1001 opens to the air on the trip
     (ABC-013 back-up command), the feedwater runs about 1 min behind the steam (drum +350 mm) and the deaerator level loop keeps the
     condensate at 400 ~ 470 T/H. NS 30 MW turbine trip: "monitor MS pressure, drum level, hotwell". Run 3 (b3211): make-up 100 %,
     LCV-CD1104 held at 10 % (about 220 T/H, the deaerator gives the feedwater), blow-off closed below 220 T/H steam (HP bypass
     PCV-MS1020 about 227 T/H, valve sheet L21): hotwell lowest -79 mm in 6 min, CEP A kept running; with LCV-CD1104 left at 10 %
     after the feedwater stopped the hotwell fell to -213 mm, back to AUTO it recovered */
  const HWOK = lo => ({
    sig: [],
    res: () => true,
    ok: () => isFinite(+U().cdHw) && +U().cdHw >= lo,
    now: () => 'Hotwell level ' + f1(+U().cdHw) + ' mm',
    want: 'hotwell level (LT-CD1110) above ' + lo + ' mm',
    go: { tag: 'LICCD1110A' }
  });
  const X7 = [
    ['At 150 MW press TURBINE TRIP (page 13, IBD TA-1). All fuel trips by itself (Tab 9 p19 item 7, DITL turbine trip -> MFT).', BIT('I.000F', 1, 'MFT after the turbine trip')],
    ['Read the first out of the turbine trip (page 13) and of the MFT; HP / LP bypass open to cool the reheater (Tab 9 p25). With no bypass and cyclone exit above 535 C the PA fan stops by itself and the RH biasing damper closes (p20).', null, 'CRO' /* sweep 26 (Mina 11-08 step 139): the first outs are read on the CRT: a control room item (the By column of the SOP tables), not the field */],
    ['Hotwell after the trip (NS: monitor main steam pressure, drum level, hotwell): the blow-off PCV-MS1001 is open to the air and the condensate pumps keep filling the deaerator. Make-up LICCD1110A to MANUAL 100 %; deaerator level LICCD1104 to MANUAL about 10 %, so the deaerator gives the feedwater (keep it above -500 mm, L alarm); blow-off PICMS1002 to MANUAL 0 % when the main steam flow is under 220 T/H (the HP bypass takes the rest). Keep the hotwell above -150 mm (L alarm; low-low -300 mm stops the condensate pumps).', ALL(MODE('LICCD1110A', 'MAN'), MODE('LICCD1104', 'MAN'), HWOK(-150))],
    ['Keep the ID fan, SA fan, PA fan and FA blowers running to remove the volatiles and burn the fuel left in the bed (Tab 9 p21 item 3); drum level in sight: -200 ~ +200 mm through the shrink.', HOLD(60, ALL(BIT('M.3304', 1, 'ID fan running'), BIT('M.3303', 1, 'SA fan running'), VAL('lvl', -200, 200)))],
    /* Mina beta.152: the check read the model bed Tb >= 625 while the text and the logic say 700 C; and nothing reset the MFT. DITL-02 out 16
       FURNACE PURGE COMPLETED = (MFT I.0560 AND NO BOILER TRIP COMMAND I.0561, delayed) AND M.3339 FURNACE LOWER LAYER > 700 C (PURGE
       BY-PASS, row 25) AND FURNACE PURGE START P.B. (row 6): with the bed above 700 C the purge start completes the purge at once, the MFT resets */
    ['Hot restart (Tab 9 p22): the bed at the start-up burner elevation above 700 C (purge bypass permit M.3339): press FURNACE PURGE START, the purge completes at once (no 5 min) and the MFT resets.', ALL(BYP700, BIT('I.000F', 0, 'MFT reset'))],
    ['Start the coal feeders: bed above 700 C without burners, or above 550 C with the burners in service (Tab 9 p23 item 7).', ANYBIT(['M.3400', 'M.3401', 'M.3402'], 'a coal feeder running')],
    ['Deaerator level LICCD1104 back to AUTO (the feedwater is back, or it has stopped: at 10 % the condensate drains the hotwell into the deaerator); make-up LICCD1110A back to AUTO when the hotwell is near its set point (SV not below +100 mm, PR-OPE-5002).', ALL(MODE('LICCD1104', 'AUTO'), MODE('LICCD1110A', 'AUTO'), HWOK(-150))]
  ];
  /* plan e5 recovery (LISA): a BFWP A field trip at 150 MW. DITL-23A (PDF sheet 41; "THE DIAGRAM IS THE SAME FOR BFWP B": DITL-23A #B):
     out 65 BFWP A TRIP (MIT-P1115A) = TRIP COMMAND or ELECTRIC TROUBLE; the TRIP resets the RUNNING latch (out 55 MIR-P1115A); BFWP B
     AUTO STARTING (M.1144) = A tripped or stopped AND B AUTO MODE SELECTED (row 18, M.1142), B in REMOTE (row 24). 03.png: BFWP-B
     standby at 150 MW. No run-back on any ABC or DITL drawing (no "RUN BACK" text on the 54 ABC and the DITL sheets). Drum level:
     alarm list LT-BR1001-2 H +127 / L -100 mm */
  const X8 = SEQ(BASE_N + 7, [
    ['Standby BFWP B ready for its AUTO start: REMOTE and AUTO MODE SELECTED (DITL-23A #B rows 24 / 18; 03.png BFWP-B standby).', ALL(INC('DITL-23A #B', 17, 'BFWP B AUTO MODE SELECTED'), INC('DITL-23A #B', 23, 'BFWP B REMOTE MODE SELECTED'))],
    ['Fault: BFWP A trips in the field (Faults, MIT-P1115A). Its ELECTRIC TROUBLE makes BFWP A TRIP (DITL-23A out 65) and resets the running latch (out 55).', BIT('M.3343', 0, 'BFWP A running')],
    ['BFWP B starts by itself (DITL-23A #B BFWP B AUTO STARTING: A tripped, B in AUTO). If it does not, start it from the CRT.', BIT('M.3344', 1, 'BFWP B running')],
    ['Feedwater and drum level recover on BFWP B: FICFW1007 follows its SV, drum level inside the alarm list H / L (+127 / -100 mm, LT-BR1001-2) for 2 min.', HOLD(120, VAL('lvl', -100, 127))],
    ['Reset the BFWP A relay in the field (Faults: press it again), acknowledge the TRIP; BFWP A is now the standby: REMOTE + AUTO MODE SELECTED (DITL-23A rows 24 / 18).', ALL(DC('BFWP A relay reset in the field', () => !(window.WORLD && WORLD.ftrip && WORLD.ftrip().some(f => f.id === 'mt.bfwpa' && f.on)), () => (window.WORLD && WORLD.ftrip && WORLD.ftrip().some(f => f.id === 'mt.bfwpa' && f.on) ? 'tripped' : 'reset')), INC('DITL-23A', 17, 'BFWP A AUTO MODE SELECTED'))]
  ]);
  /* plan e5 recovery (LISA): O2 analyzer A fails. I/O list STN101 AI0273 AT-FG1122 (0 ~ 25 %, SIG.AB B.0671) and AI0433 AT-FG1123
     (SIG.AB B.0701); ABC-002 selects the O2 of AICFG112 by the SIG.AB flags (engine/faults.js check: PV follows analyzer B). Alarm
     list AT-FG1122 / 1123: HH 7, H 5, L 2.5, LL 2 % */
  const O2B = () => {
    const f = fp('AICFG112'),
      x = f ? pvOf(f) : NaN,
      b = val('AI0433');
    return { x, b, ok: isFinite(x) && isFinite(b) && Math.abs(x - b) <= 0.2 };
  };
  const X9 = SEQ(BASE_N + 8, [
    ['Fault: O2 analyzer A (AT-FG1122) signal lost (Faults). The AI goes to 0 % and its signal abnormal flag B.0671 is set (I/O list AI0273, SIG.AB B.0671).', BIT('B.0671', 1, 'O2 analyzer A signal abnormal')],
    ['ABC-002 drops analyzer A: the O2 of AICFG112 follows analyzer B (AI0433, AT-FG1123), no step in the trim.', DC('AICFG112 PV = analyzer B AI0433 (within 0.2 %)', () => O2B().ok, () => 'PV ' + f1(O2B().x) + ' %, analyzer B ' + f1(O2B().b) + ' %')],
    ['Check the O2 trim on analyzer B: AICFG112 in AUTO, flue gas O2 inside the alarm list band L 2.5 ~ H 5 % (AT-FG1123) for 2 min.', HOLD(120, ALL(MODE('AICFG112', 'AUTO'), PV('AICFG112', 2.5, 5, '%')))],
    ['I&C repairs analyzer A: clear the fault (Faults: press it again). B.0671 back to 0, analyzer A back in the select.', BIT('B.0671', 0, 'O2 analyzer A healthy')]
  ]);
  /* plan e5 recovery (LISA): a PA fan field trip at 150 MW. DITL-26A: ELECTRIC TROUBLE -> PAF TRIP (MIT-F1053), the running latch
     resets (MIR-F1053). DITL-03A row 5 PAF STOPPED is in the OR of the MFT (rows 2 ~ 19 -> FF -> out 63 MFT): the drawing trips the boiler,
     no run-back (no RUN BACK on the ABC or DITL sheets). The MFT goes to the TCS (IBD TA-9 BOILER MFT): the turbine trips too. After it:
     FHI Tab 9 p21 (fans on, purge the volatiles, drum level in sight) and p22 (hot restart above 700 C, purge bypass M.3339, DITL-02) */
  const X10 = SEQ(BASE_N + 9, [
    ['Fault: the PA fan trips in the field (Faults, MIT-F1053). Its ELECTRIC TROUBLE makes PAF TRIP on DITL-26A.', BIT('M.3302', 0, 'PA fan stopped')],
    ['The drawing trips the boiler: PAF STOPPED is an MFT condition (DITL-03A row 5 -> MFT out 63); the MFT trips the turbine through the TCS (IBD TA-9). No run-back is drawn.', BIT('I.000F', 1, 'MFT after the PA fan trip')],
    ['Read the first out of the MFT (PAF STOPPED) on the purge and trip page; keep the ID fan and SA fan running (FHI Tab 9 p21) and the drum level in sight, -200 ~ +200 mm, for 1 min.', HOLD(60, ALL(BIT('M.3304', 1, 'ID fan running'), BIT('M.3303', 1, 'SA fan running'), VAL('lvl', -200, 200)))],
    ['Reset the PA fan relay in the field (Faults: press it again, or RESET on the PA fan faceplate) and start the PA fan from the CRT.', BIT('M.3302', 1, 'PA fan running')],
    ['Hot restart (FHI Tab 9 p22): bed above 700 C (purge bypass permit M.3339, DITL-02 row 25): press FURNACE PURGE START, the purge completes at once and the MFT resets. Below 700 C the full 5 min purge is needed.', ALL(BYP700, BIT('I.000F', 0, 'MFT reset'))]
  ]);
  const XS = [X1, X2, X3, X4, X5, X6, X7, X8, X9, X10];
  if (!PROC.some(s => s.x)) {
    PROC.push({ t: 'SYNCHRONIZATION AND INITIAL LOAD (APP)', x: 1, note: 'Added by the app: PR-OPE-5002 ends at Solid firing. Targets from the cold start scenario of the app (it reaches 150 MW) and the FHI design data.', s: X1.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'LOAD UP TO 150 MW (APP)', x: 1, note: 'Added by the app. PR-OPE-5002 sec 44: boiler follow until 90 MW; then coordinated control to 150 MW (FHI MCR 460 T/H).', s: X2.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'PRACTICE: LOAD CHANGE IN AUTO (APP)', x: 1, note: 'Added by the app. Press "Practise: 150 MW load change" (or continue after Load up). See how the coordinated control holds the demand: you only move the target MW.', s: X3.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'PRACTICE: LOAD CHANGE BY HAND (MANUAL) (APP)', x: 1, note: 'Added by the app. Press "Practise: 150 MW load change". You are the CCS: the turbine master sets the MW, the boiler master sets the fire; keep the pressure.', s: X4.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'NORMAL SHUTDOWN TO TURBINE TRIP (APP)', x: 1, note: 'Added by the app from PR-OPE-5003-01 (normal shutdown) steps 4.1 ~ 4.20: 150 MW to the turbine trip at 30 MW.', s: X5.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'SHUTDOWN TO BOTTLE-UP (APP)', x: 1, note: 'Added by the app from PR-OPE-5004-01 (shutdown to bottle-up): after the turbine trip, the boiler is boxed up with the drum at +200 mm.', s: X6.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'TURBINE TRIP AT LOAD AND HOT RESTART (APP)', x: 1, note: 'Added by the app from the FHI CFB manual Part 2 Sect 8 Tab 9 (loss of load, hot standby, hot restart).', s: X7.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'PRACTICE: BFWP A TRIP AT 150 MW (APP)', x: 1, note: 'Added by the app (e5 faults): a field trip of BFWP A; the standby BFWP B takes the load by the logic of DITL-23A.', s: X8.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'PRACTICE: O2 ANALYZER A FAILS (APP)', x: 1, note: 'Added by the app (e5 faults): the O2 analyzer A of the AICFG112 select fails; ABC-002 follows analyzer B by the SIG.AB flag.', s: X9.map(x => ({ t: x[0], g: [], by: x[2] })) });
    PROC.push({ t: 'PRACTICE: PA FAN TRIP AT 150 MW (APP)', x: 1, note: 'Added by the app (e5 faults): a field trip of the PA fan; the MFT of DITL-03A follows, then the hot restart (FHI Tab 9).', s: X10.map(x => ({ t: x[0], g: [], by: x[2] })) });
  }

  /* ---------- the general rules (step text + its tags), after the table ---------- */
  function general(st) {
    const t = st.t,
      tags = st.g || [];
    const ctl = tags.find(x => ctlTag(x));
    /* only an instruction to the operator (a note such as "Pipe hammering may be noticed when ..." is not one) */
    if (ctl && /^(set|put|open|close|adjust|fully|gradually|ensure|check|verify|select|increase|decrease|throttle|initiate)\b/i.test(t)) {
      const sv = /\bSV\s*(?:of|=)?\s*(?:at least\s*)?\(?([+-]?\d+(?:\.\d+)?)/i.exec(t);
      if (/\b(set|put)\b[^.]*\bin\s+auto|to\s+AUTO|in\s+AUTO\s+mode|AUTO\s+mode\b|Put in auto/i.test(t))
        return sv ? ALL(MODE(ctl, 'AUTO'), SV(ctl, +sv[1] - Math.max(5, Math.abs(+sv[1]) * 0.1), +sv[1] + Math.max(5, Math.abs(+sv[1]) * 0.1))) : MODE(ctl, 'AUTO');
      if (/\bREMOTE\b/.test(t)) return MODE(ctl, 'REM');
      if (/to\s+MANUAL|in\s+manual/i.test(t)) return MODE(ctl, 'MAN');
      if (/fully\s+open|100\s*%\s*OPEN/i.test(t)) return MV(ctl, 95, null);
      if (/fully\s+clos|\(0%\)|to\s+0%/i.test(t)) return MV(ctl, null, 5);
      const pc = /(\d+(?:\.\d+)?)\s*%/.exec(t);
      if (pc && /open|adjust|opening|set/i.test(t)) return MV(ctl, Math.max(0, +pc[1] - 5), +pc[1] + 5);
    }
    return null;
  }
  /* ---------- the kind of every step (cached) ---------- */
  const KC = {};
  function kind(si, i) {
    const k = si + '.' + i;
    if (KC[k]) return KC[k];
    const sec = PROC[si],
      st = sec && sec.s[i];
    if (!st) return { k: 'field' };
    let c = null;
    if (sec.x) c = XS[si - BASE_N][i][1];
    else {
      const r = R.find(x => x[0] === si + 1 && x[1].test(st.t));
      c = r ? r[2] : general(st); /* a null in the table: a field step on purpose */
    }
    let out;
    if (c && c.res()) out = { k: 'auto', c };
    else if (TCS.test(st.t) || /^(39|40|41|42)$/.test(String(si + 1))) out = { k: 'tcs' };
    else out = { k: 'field', miss: c ? c.sig : null };
    /* the engine has to be compiled before a signal can be found: do not cache a miss before that */
    if (abc().length > 40) KC[k] = out;
    return out;
  }
  /* ---------- the auto ticks: latched while the simulation runs (not in VIEW) ---------- */
  const LS = 'ls-train-auto';
  const rd = () => {
    try {
      return JSON.parse(localStorage.getItem(LS) || '{}') || {};
    } catch (e) {
      return {};
    }
  };
  const wrt = o => {
    try {
      localStorage.setItem(LS, JSON.stringify(o));
    } catch (e) {}
  };
  let LAT = rd();
  const SOPLOG = new Map(); /* Mina N3: the AUTO step lines logged (key -> real time ms), per starting state */
  const since = {};
  const simT = () => +U().t || 0;
  /* R9 #71: the simulation runs on a DITL sheet too (the Training dock follows the step to DITL-29A ...): the AUTO items ticked only
     while an ABC sheet was on the screen (Section 2 32 / 35). Same rule as the Gabay (guide.js live) */
  const live = () =>
    !!(
      typeof AN !== 'undefined' &&
      AN.sheets &&
      !(window.lsViewLock && lsViewLock.inView()) &&
      (AN.cat === 'an' ? !AN.view : typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE) && window.WORLD && WORLD.on && WORLD.live)
    );
  /* 3.2.0 walkthrough #9: an AUTO step ticks on a real change after the Clear / the start: its condition was seen NOT done since then,
     or the trainee has reached its section (a step of the section before is ticked). Before: every condition already true at Cold
     ticked itself (no coal, no flame ...). The furnace purge steps also need the four fans running (IDF, SAF, PAF, FAB) */
  const off = {};
  const PURGE = PROC.findIndex(s => /FURNACE PURGE/i.test(s.t));
  const fansOn = () => {
    try {
      return RUN.IDF.ok() && RUN.SAF.ok() && RUN.PAF.ok() && RUN.FAB.ok();
    } catch (e) {
      return false;
    }
  };
  /* one pass over every auto step; returns the keys that changed */
  /* Mina beta.122 (fresh 150 MW load): the Normal shutdown list kept "auto ✓" on ULD to 90 / hold 90 / MWRL 0.6 from an older run while
     the plant stood at 150 MW. When a starting state has loaded, an AUTO tick whose condition is not true in the new plant is dropped
     (only in the practice / shutdown / trip sections after the start-up; the start-up keeps its ticks, 3.2.0-beta.16) */
  let seenN = 0;
  function afterLoad() {
    let n = 0;
    for (const key in LAT) {
      const [si, i] = key.split('.').map(Number);
      if (si < BASE_N) continue; /* the start-up sections (Cold to 150 MW) keep their ticks */
      const q = kind(si, i);
      if (q.k !== 'auto') continue;
      let ok = false;
      try {
        ok = q.c.ok();
      } catch (e) {}
      if (!ok) delete LAT[key], delete since[key], n++;
    }
    if (n) wrt(LAT);
    return n;
  }
  function scan() {
    const ch = [];
    const ld = !!(window.AN && AN._loading),
      nL = (window.AN && AN.loadN) || 0;
    if (!ld && nL !== seenN && PROC.length) {
      seenN = nL;
      afterLoad();
    }
    /* retest #9 #54: nothing ticks while a starting state loads in slices (the plant is half loaded) */
    if (!live() || !PROC.length || ld) return ch;
    const t = simT();
    let hand = {};
    try {
      hand = JSON.parse(localStorage.getItem('ls-train') || '{}') || {};
    } catch (e) {}
    const reached = si => {
      if (si <= 0) return false;
      const p = si - 1 + '.';
      for (const k in LAT) if (k.startsWith(p)) return true;
      for (const k in hand) if (k.startsWith(p)) return true;
      return false;
    };
    const fans = PURGE >= 0 ? fansOn() : true;
    let gsec = -1;
    try {
      const G = window.LS_GUIDE;
      if (G && G.on) {
        const L = G.steps();
        for (let j = 0; j <= Math.min(G.cur, L.length - 1); j++) {
          const x = L[j],
            k = x.sec ? x.sec - 1 : x.field && x.field.length ? x.field[0] : -1;
          if (k > gsec) gsec = k;
        }
      }
    } catch (e) {}
    PROC.forEach((sec, si) =>
      sec.s.forEach((st, i) => {
        const key = si + '.' + i;
        if (LAT[key]) return;
        const q = kind(si, i);
        if (q.k !== 'auto') return;
        let ok = false;
        try {
          ok = q.c.ok();
        } catch (e) {}
        if (!ok) {
          delete since[key];
          off[key] = 1;
          return;
        }
        /* retest #9 (beta.45 check: SAF / PAF damper steps of sections 24 / 25 ticked at a cold plant 50 s after RUN, the model settling
           after the load is a change too): an AUTO step ticks only in a section the start-up has reached (a tick in the section
           before it, or the section of the Gabay step now), never ahead of the trainee */
        if (!reached(si) && !(gsec >= 0 && si <= gsec)) return;
        /* Mina beta.136 (normal shutdown run): "✓ 51.4 Hot restart", "51.5 Start the coal feeders", "51.3 Keep the fans running" ticked at
           150 MW, and "51.1 press TURBINE TRIP" at a vacuum trip. A practice section after the start-up (shutdown, bottle-up, trip and
           restart) ticks only while the guide is on that section: its conditions are true in a normal run too */
        if (si >= BASE_N && gsec !== si) return;
        /* Mina beta.152 (Practise turbine trip at 150 MW): after the trip "✓ 26.10 All Coal Feeder Stop", "✓ 25.12 Increase PAF inlet damper",
           "✓ 22.18 Adjust the hydraulic coupling" ticked by themselves. While the guide is in a practice stage (after the start-up), the
           start-up sections do not tick: a trip makes their conditions true without the start-up being done */
        if (si < BASE_N && gsec >= BASE_N) return;
        if (si === PURGE && !fans) return;
        if (q.c.hold) {
          if (since[key] == null) since[key] = t;
          if (t - since[key] < q.c.hold) return;
        }
        LAT[key] = Math.round(t);
        ch.push(key);
        /* live test #55: the AUTO tick is an event too (the step, what the logic shows) */
        try {
          /* Mina N3, 3.2.3-beta.4: after a state load the same AUTO step was logged up to 8 times (22.8 x8, 26.16 x6): the ticks are made again
             while the loaded state settles. One line per step for each starting state loaded (AN.loadN) in 2 min of real time */
          const lk = ((window.AN && AN.loadN) || 0) + ':' + key;
          /* a step done again later (a practice repeated) is logged again: only the repeats of the same 2 min are dropped */
          if (Date.now() - (SOPLOG.get(lk) || -1e9) < 120000) return;
          SOPLOG.set(lk, Date.now());
          if (SOPLOG.size > 2000) SOPLOG.clear();
          if (window.lsEventAdd) lsEventAdd('PR-OPE-5002', 'SOP', '✓ ' + (si + 1) + '.' + (i + 1) + ' ' + String(st.t).slice(0, 60) + ' (AUTO: ' + String(q.c.now ? q.c.now() : '').slice(0, 80) + ')');
        } catch (e) {}
      })
    );
    if (ch.length) wrt(LAT);
    return ch;
  }
  function state(si, i) {
    const key = si + '.' + i,
      q = kind(si, i);
    if (q.k !== 'auto') return { q };
    let ok = false,
      now = '';
    try {
      ok = q.c.ok();
      now = q.c.now();
    } catch (e) {}
    const hs = q.c.hold && since[key] != null ? Math.max(0, simT() - since[key]) : null;
    return { q, done: !!LAT[key], ok, now, hold: q.c.hold ? [hs, q.c.hold] : null };
  }
  /* from: only the ticks of the sections from this one on (3.2.0-beta.16: a practice is done again without clearing the start-up) */
  function reset(from) {
    if (from == null) LAT = {};
    else for (const k in LAT) if (+k.split('.')[0] >= from) delete LAT[k];
    for (const k in since) if (from == null || +k.split('.')[0] >= from) delete since[k];
    for (const k in off) if (from == null || +k.split('.')[0] >= from) delete off[k];
    wrt(LAT);
  }
  /* the AUTO ticks back (Undo of Clear all ticks) */
  function load(o) {
    LAT = Object.assign({}, o || {});
    wrt(LAT);
  }
  /* why a controller step waits: the force-manual signals of the drawing (why.js) */
  function why(si, i) {
    const q = kind(si, i);
    if (q.k !== 'auto') return [];
    const L = [];
    const tags = [...new Set((q.c.parts || [q.c]).map(c => c.go && c.go.tag).filter(Boolean))];
    for (const t of tags) {
      const f = fp(t);
      if (!f || f.kind !== 'ctl' || !AN.whyMan) continue;
      try {
        const sh = AN.sheets.find(s => s.name === f.shn);
        for (const w of AN.whyMan(sh, f.c)) L.push(f.t + ' is held in MANUAL by ' + w.sig + (w.lines[1] ? ' ← ' + w.lines[1].txt : ''));
      } catch (e) {}
    }
    return L;
  }
  /* for the test: every auto step and every condition whose signal is not found */
  function audit() {
    const o = { auto: 0, field: 0, tcs: 0, miss: [], list: [] };
    PROC.forEach((sec, si) =>
      sec.s.forEach((st, i) => {
        const q = kind(si, i);
        o[q.k]++;
        if (q.k === 'auto') o.list.push([si + 1, i + 1, q.c.want]);
        if (q.miss) o.miss.push([si + 1, i + 1, q.miss.join(',')]);
      })
    );
    return o;
  }
  /* the signals of one step, each with its target, its value now and where to look (for the live panel) */
  function rows(si, i) {
    const q = kind(si, i);
    if (q.k !== 'auto') return [];
    return (q.c.parts || [q.c]).map(c => {
      let ok = false,
        now = '';
      try {
        ok = c.ok();
        now = c.now();
      } catch (e) {}
      return { want: c.want, now, ok, go: c.go };
    });
  }
  /* the first ABC sheet that carries a label */
  const sheetOf = l => {
    const r = lx()[l];
    return r && r[0] ? r[0].sh : null;
  };
  /* 3.2.0-beta.21: the condition makers, for the guided Training (guide.js) */
  const B = { BIT, ANYBIT, NOBIT, MODE, MV, SV, PV, VAL, ALL, HOLD, OUT, RUN, SWP2, BURN, BURN4, NOFEED, PURGE_AIR, MFT, X1, X2, X3, X4, X5, X6, X7, X8, X9, X10 };
  /* recNow: a row at once (tests/regress/load_ramp.js steps the plant faster than the 1 s timer) */
  const recNow = () => {
    const m = Math.floor((+U().t || 0) / 60);
    if (m === REC.last && REC.rows.length) REC.rows.pop(); /* one row per minute: the newer one stays */
    REC.last = m;
    REC.rows.push(recRow());
  };
  return { rec: () => REC.rows, recCsv, recNow, recClear: () => ((REC.rows = []), (REC.last = -1)), kind, state, rows, scan, reset, load, why, audit, fp, ctlTag, has, val, sheetOf, live, done: () => LAT, base: BASE_N, practice: BASE_N + 2, B, H, modeOf, mvOf, pvOf, svOf, getV, NAMES, f1 };
})();
