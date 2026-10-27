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
    const m = {};
    for (const sh of L) {
      let S;
      try {
        S = sh.S || AN.ensure(sh);
      } catch (e) {
        continue;
      }
      if (!S || !S.lab) continue;
      for (let n = 0; n < S.lab.length; n++) {
        const a = S.lab[n] && String(S.lab[n].t).trim().replace(/^S\d\s+/, '');
        let b = '';
        try {
          b = (AN.nm(S, n) || '').trim();
        } catch (e) {}
        for (const k of new Set([a, b])) if (k) (m[k] = m[k] || []).push({ sh: sh.name, n });
      }
    }
    LX = L.length ? m : null;
    return m;
  }
  const has = l => !!lx()[l];
  const val = l => {
    const r = lx()[l];
    if (!r) return NaN;
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
    return '?';
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
      return (f ? f.t : t) + ' MV ' + (f ? f1(mvOf(f)) : '—') + ' %';
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
    RHP: ['Reheat pressure', 'kg/cm2', 'ABC-052', 'PICHR1003']
  };
  const getV = k => {
    if (k === 'AIR') return hv('PA') + hv('SA') + hv('FA');
    if (k === 'Pd' || k === 'Tb' || k === 'Tw' || k === 'oilF' || k === 'rpm') return +U()[k];
    return hv(k);
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
  const PURGE_AIR = VAL('AIR', 115, null); /* > 25 % MCR of the total air (25 % of 460 T/H) */
  const MFT = BIT('I.000F', 0, 'no MFT');

  /* ---------- the steps: [section number, regex on the step text, condition] (first match wins); the rest by the general rules ---------- */
  const R = [
    [2, /initiate selected 1st SWP START/i, RUN.SWP1],
    [2, /START 2nd Selected SWP/i, SWP2],
    [18, /initiate START to selected CEP/i, RUN.CEP],
    [18, /FCV-CD1120 to MANUAL and ADJUST to 60/i, ALL(MODE('FCV-CD1120', 'MAN'), MV('FCV-CD1120', 55, 65))],
    [18, /set the standby CEP to REMOTE/i, RUN.CEP],
    [18, /Set SV to 150 T\/H and Set to AUTO/i, ALL(MODE('FCV-CD1120', 'AUTO'), SV('FCV-CD1120', 140, 160, 'T/H'))],
    [18, /set LCV-MU1110 to AUTO/i, MODE('LCV-MU1110', 'AUTO')],
    [19, /Set Deaerator Level control valve \(LCV-CD1104\) to AUTO/i, ALL(MODE('LCV-CD1104', 'AUTO'), SV('LCV-CD1104', -20, 20, 'mm'))],
    [20, /Initiate START to selected BFP/i, RUN.BFP],
    [20, /SET FCV-FW1130-2 to MANUAL/i, MODE('FCV-FW1130-2', 'MAN')],
    [20, /^Drum level \(-150mm\)/i, HOLD(30, VAL('lvl', -200, -100))],
    [22, /Ensure Secondary and Primary Air Damper are 100% OPEN/i, ALL(MV('FICFA1081', 95, null), MV('FICFA1071', 95, null))],
    [23, /Ensure Fluidizing Air Damper is at least 25% OPEN/i, null],
    [26, /Dampers of secondary staging air nozzles close to limit stop/i, null],
    [33, /^Main Steam Pressure/i, null],
    [22, /IDF inlet Damper opening is about 93%/i, ALL(RUN.IDF, MV('PICFG108A', 85, 100))],
    [25, /Ensure Biasing Damper/i, ALL(MV('HICHR1002A', 95, null), MV('HICHR1002B', 95, null))],
    [22, /Ensure Biasing Damper/i, ALL(MV('HICHR1002A', 95, null), MV('HICHR1002B', 95, null))],
    [22, /IDF Damper is fully closed and hydraulic coupling/i, MV('PICFG108', null, 2)],
    [22, /Select hydraulic coupling as furnace pressure control mode/i, MODE('PICFG108', 'MAN')],
    [22, /^Start IDF at DCS/i, RUN.IDF],
    [22, /Hydraulic Coupling Furnace Pressure Control at 13%/i, ALL(RUN.IDF, MV('PICFG108', 10, 16))],
    [22, /maintaining furnace pressure of -15mmH2O/i, HOLD(60, ALL(RUN.IDF, VAL('FP', -25, -5)))],
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
    [25, /set the HC Control \(Furnace Pressure Control\) Mode in AUTO/i, ALL(MODE('PICFG108', 'AUTO'), VAL('FP', -25, -5))],
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
  const XS = [X1, X2, X3, X4];
  if (!PROC.some(s => s.x)) {
    PROC.push({ t: 'SYNCHRONIZATION AND INITIAL LOAD (APP)', x: 1, note: 'Added by the app: PR-OPE-5002 ends at Solid firing. Targets from the cold start scenario of the app (it reaches 150 MW) and the FHI design data.', s: X1.map(x => ({ t: x[0], g: [] })) });
    PROC.push({ t: 'LOAD UP TO 150 MW (APP)', x: 1, note: 'Added by the app. PR-OPE-5002 sec 44: boiler follow until 90 MW; then coordinated control to 150 MW (FHI MCR 460 T/H).', s: X2.map(x => ({ t: x[0], g: [] })) });
    PROC.push({ t: 'PRACTICE: LOAD CHANGE IN AUTO (APP)', x: 1, note: 'Added by the app. Press "Practise: 150 MW load change" (or continue after Load up). See how the coordinated control holds the demand: you only move the target MW.', s: X3.map(x => ({ t: x[0], g: [] })) });
    PROC.push({ t: 'PRACTICE: LOAD CHANGE BY HAND (MANUAL) (APP)', x: 1, note: 'Added by the app. Press "Practise: 150 MW load change". You are the CCS: the turbine master sets the MW, the boiler master sets the fire; keep the pressure.', s: X4.map(x => ({ t: x[0], g: [] })) });
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
  const since = {};
  const simT = () => +U().t || 0;
  const live = () => !!(typeof AN !== 'undefined' && AN.sheets && AN.cat === 'an' && !(window.lsViewLock && lsViewLock.inView()) && !AN.view);
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
  function scan() {
    const ch = [];
    if (!live() || !PROC.length) return ch;
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
        if (!off[key] && !reached(si)) return;
        if (si === PURGE && !fans) return;
        if (q.c.hold) {
          if (since[key] == null) since[key] = t;
          if (t - since[key] < q.c.hold) return;
        }
        LAT[key] = Math.round(t);
        ch.push(key);
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
  const B = { BIT, ANYBIT, NOBIT, MODE, MV, SV, PV, VAL, ALL, HOLD, OUT, RUN, SWP2, BURN, BURN4, NOFEED, PURGE_AIR, MFT, X1, X2, X3, X4 };
  return { kind, state, rows, scan, reset, load, why, audit, fp, ctlTag, has, val, sheetOf, live, done: () => LAT, base: BASE_N, practice: BASE_N + 2, B, H, modeOf, mvOf, pvOf, svOf, getV, NAMES, f1 };
})();
