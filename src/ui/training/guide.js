/* ===== 3.2.0-beta.21 GUIDED TRAINING (user pick 2026-10-24, proposal https://claude.ai/artifact/FnjLxFZYXnFqc9fjvRdHWJ, "Oo, gawin ayon
   sa proposal"; user: "ang hirap nya paganahin ... irrun mo ba ... palipat lipat ka rin ng modules ... pwedeng magskip ng step like hnd
   pa bukas swp, pero pwede ka na mag line up ng steam drum filling ... hindi friendly sa newbie").
   Cold to 150 MW as ONE path of steps, in the order of PR-OPE-5002 (document-references/procedure-start-up-PR-OPE-5002-02.docx) and of
   the app's own cold start that reaches 150 MW (src/ui/uat/check.js chain cold -> coal -> byp -> roll -> up, tests/regress/check_panel.js):
   - one step is open at a time; the next one opens only when the logic shows this one done (no skipping);
   - the step's actions are on its card (start a pump = its running memory, the same address as the Inputs list; a controller = its own
     faceplate or one button for the exact setting; the TCS panel = AN.turbine), so there is no going to the Logic or the Plant view;
   - the FIELD items (local valves, gauges, panels: no DCS signal) of a section are one card, confirmed with one press;
   - there is no coach (user 2026-10-29, #108: the real plant has none): the trainee makes every trim of the procedure (furnace pressure,
     firing rate <= 110 C/h, O2, drum level, HP bypass SV, coal) on the faceplates of the step, and a step goes on only on the real signals;
   Nothing here changes the logic: it writes only what an operator writes (inputs, faceplate modes, SV, MV, TCS commands). ===== */
window.LS_GUIDE = (function () {
  const L = () => window.LS_LIVE;
  const PROC = () => window.LS_PROC5002 || [];
  let HH = null,
    HOf = null;
  /* the plant helpers of check.js (the same reading and writing as the CHECK scenarios), kept while the ABC sheets stay the same */
  const h = () => {
    if (!HH || HOf !== AN.sheets) {
      HH = CHECK.H();
      HOf = AN.sheets;
    }
    return HH;
  };
  const U = () => AN.unit || {};
  /* 3.2.0-beta.38: the TCS / ATS model (src/analog/engine/tcs.js) */
  const TC = () => (AN.tcs && AN.tcs()) || { aux: {}, crit: {}, step: -1, cur: -1 };
  const shOf = t => {
    try {
      return AN.fpFind(t);
    } catch (e) {
      return null;
    }
  };
  /* a hand station (MAN block: HICHR1002A / B, HIC-BM, EIC-TM, HIC-ULD, HIC-TADBS) */
  const station = t => {
    const k = shOf(t),
      sh = k && AN.sheets.find(s => s.name === k),
      T = sh && sh.S,
      b = T && T.blk.find(b => b.k === 'MAN' && (b.tag === t || (b.txt || []).includes(t)));
    return b ? { T, b } : null;
  };
  /* ---------- the operator's actions (what the faceplate, the Inputs list and the TCS panel write) ---------- */
  const A = {
    /* with the one world ON (Training dock) a motor of a DITL drawing starts from its DITL: the START / STOP pushbutton of the
       drawing, its interlock decides (src/ui/training/dock.js dmotor); else the running memory is set (the Inputs list force) */
    motor: (a, on) => (window.LS_DOCK && LS_DOCK.dmotor && LS_DOCK.dmotor(a, on) ? '' : (h().setx(null, a, on ? 1 : 0), '')),
    man(t, x) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      const c = h().ctl(k, t);
      if (c) return h().man(k, t, x), '';
      const s = station(t);
      if (!s) return 'no station ' + t;
      if (AN.latchMode) AN.latchMode(t, 'MAN');
      s.T.rt.st[s.b.id].val = x;
      for (const n of s.b.i || []) if (n >= 0 && s.T.ext.includes(n) && !(s.T.xlk && s.T.xlk[n]) && (AN.nm(s.T, n) || '').trim() === t + '.MV') s.T.rt.ext[n] = x;
      return '';
    },
    /* the value of a hand station without a mode change (HIC-TADBS) */
    val(t, x) {
      const s = station(t);
      if (!s) return 'no station ' + t;
      s.T.rt.st[s.b.id].val = x;
      return '';
    },
    auto(t, sv) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      if (h().ctl(k, t)) return h().autoSv(k, t, sv), '';
      /* a hand station: AUTO = .MAN 0 on every sheet (CLAUDE.md 10) */
      for (const [S2, n] of AN.modeNets(t) || []) S2.rt.ext[n] = 0;
      return '';
    },
    rem(t) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      return h().rem(k, t), '';
    },
    loc: t => (h().mode(L().ctlTag(t) || t, 'LOC'), ''),
    oil: (a, open) => (AN.oilValve(a, open), ''),
    field: (k, on) => (AN.field(k, on), ''),
    tcs: (cmd, arg) => AN.turbine(cmd, arg) || '',
    /* a pushbutton of the drawing: 1 for 2.5 s of the plant, then 0 (ABC-010 3-ELEMENT M.054E, TPS 2 s) */
    push(a) {
      h().setx(null, a, 1);
      PUSH[a] = simT() + 2.5;
      return '';
    }
  };
  const PUSH = {};
  const simT = () => +U().t || 0;
  /* user 2026-10-29 (#108, no coach): the operator's own trims, one press = one step of the faceplate (the same signal as the sheet) */
  /* .tag: the loop of the button (the dock leaves out a button whose loop has its own control card: the same MV ▲▼ twice) */
  const step = (l, t, d) => Object.assign(btn(l, () => A.man(t, Math.max(0, Math.min(100, Math.round((+mv(t) || 0) * 2) / 2 + d)))), { tag: t });
  const oilStep = (l, ks, d) =>
    btn(l, () => {
      for (const k of ks) if (bit({ A: 'M.3412', B: 'M.3413', C: 'M.3418', D: 'M.3419' }[k]) > 0.5) A.man('FICDO1043' + k, Math.max(20, Math.min(100, Math.round(+mv('FICDO1043' + k) || 0) + d)));
      return '';
    });
  const svStep = (l, t, d, lo, hi) => Object.assign(btn(l, () => (md(t) === 'AUTO' ? A.auto(t, Math.max(lo, Math.min(hi, Math.round((+svOf(t) || 0) + d)))) : 'Mode ' + md(t) + ' on ' + t + ': put it in A first')), { tag: t });
  /* ---------- reading ---------- */
  const mv = t => {
    const f = L().fp(t);
    return f ? L().mvOf(f) : NaN;
  };
  const pv = t => {
    const f = L().fp(t);
    return f ? L().pvOf(f) : NaN;
  };
  const md = t => {
    const f = L().fp(t);
    return f ? L().modeOf(f) : '?';
  };
  const bit = a => L().val(a);
  /* the manual value the operator set on a controller (its MV reads 0 while the drawing holds the output: FIC-CF before a coal
     feeder runs) */
  const setOf = t => {
    try {
      const k = shOf(t),
        c = k && h().ctl(k, t),
        T = c && AN.sheets.find(s => s.name === k).S;
      if (!c) return NaN;
      if (c.manBlk && T.rt.st[c.manBlk.id]) return +T.rt.st[c.manBlk.id].val;
      if (c.manNet != null) return +T.rt.ext[c.manNet];
    } catch (e) {}
    return NaN;
  };
  /* 3.2.0-beta.39 (roadmap 2) (roadmap 2, mouse Cold run stuck at "Hawakan ang 45 MW", MSP 66): the set point of a controller now. The step of the
     45 MW handover passed on M.0255 = 0 (blow-off < 5 % open) before the operator pressed "PICMS1002 A, SV 128": the blow-off stayed at
     the SV of the bypass stage (HP bypass SV + 5 = 66), vented about 20 T/H and held the main steam at 66 kg/cm2 */
  /* the SV switch of a controller on its logic leg (A: cascade / schedule SV; the faceplate "SV: LOGIC" where the drawing has no .REM) */
  const svLogic = (k, t) => {
    try {
      const c = h().ctl(k, t),
        st = c && c.svSw && h().sh(k).rt.st[c.svSw.id];
      return !!st && st.pk === 'A';
    } catch (e) {
      return false;
    }
  };
  const svOf = t => {
    try {
      const k = shOf(t),
        c = k && h().ctl(k, t);
      return c && c.q.sv != null ? +AN.sheets.find(s => s.name === k).S.rt.v[c.q.sv] : NaN;
    } catch (e) {
      return NaN;
    }
  };
  const SETmin = (t, lo) => C(t + ' M, ≥ ' + lo + ' %', () => md(t) === 'MAN' && setOf(t) >= lo, () => t + ' ' + md(t) + ' ' + f0(setOf(t)) + ' %');
  const SET = (t, lo, hi) => C(t + ' M, ' + lo + ' ~ ' + hi + ' %', () => md(t) === 'MAN' && setOf(t) >= lo && setOf(t) <= hi, () => t + ' ' + md(t) + ' ' + f0(setOf(t)) + ' %');
  const f0 = x => (isFinite(x) ? Math.round(x).toString() : '—');
  const f1 = x => (L() ? L().f1(x) : String(x));
  /* a custom condition */
  const C = (want, ok, now, go) => ({ sig: [], res: () => true, ok, now, want, go: go || {} });

  /* user 2026-10-29 (#108): the 17 coaches of the cold start were removed; the trainee does every trim on the faceplates of the step */

  /* ---------- the steps ---------- */
  const STAGES = ['Utilities', 'Water: hotwell, deaerator, drum', 'Fans and draft', 'Furnace purge', 'Burners and warm-up', 'Vacuum and seals', 'Bypass at 61 kg/cm²', 'Turbine: roll, sync, 45 MW', 'Coal at 45 MW', 'Load up to 150 MW', 'Practice: load change'];
  const B = () => L().B;
  /* a motor button: START / STOP of its running memory (memory list), the same address the Inputs list forces */
  const mot = (a, l) => ({ ad: a, l: 'START ' + l, f: () => A.motor(a, 1), on: () => bit(a) > 0.5, stop: { l: 'STOP ' + l, f: () => A.motor(a, 0) } });
  const btn = (l, f, on) => ({ l, f, on });
  const call0 = f => {
    try {
      return f();
    } catch (e) {
      return null;
    }
  };
  /* a motor that the old (no one world) way starts with an extra forced memory (feeder C + M.3405 ALL IN REMOTE AND RUNNING) */
  const WLm = (a, l, fOff) => Object.assign(mot(a, l), { f: () => (WL() ? A.motor(a, 1) : fOff()) });
  /* a push button / an output of a DITL drawing (one world ON, src/ui/training/dock.js) */
  const dPress = (nm, row) => !!(window.LS_DOCK && LS_DOCK.dpress && LS_DOCK.dpress(nm, row));
  const dOut = (nm, row) => (window.LS_DOCK && LS_DOCK.dout ? LS_DOCK.dout(nm, row) : null);
  const dRun = nm => (window.LS_DOCK && LS_DOCK.runOut ? LS_DOCK.runOut(nm) : null);
  /* 3.2.0-beta.23: a condition read on the DITL while the one world runs (w), else the ABC / plant condition (o) */
  /* retest #28: the one world is built (its last scan while PAUSED: a condition of a DITL step is not shown ✓ just because the time stands still) */
  const WL = () => !!(window.WORLD && WORLD.on && WORLD.idx);
  const DW = (w, o) => ({
    get sig() {
      return (WL() ? w : o).sig;
    },
    res: () => (WL() ? w : o).res(),
    ok: () => (WL() ? w : o).ok(),
    now: () => (WL() ? w : o).now(),
    get want() {
      return (WL() ? w : o).want;
    },
    get go() {
      return (WL() ? w : o).go;
    }
  });
  /* 3.2.0-beta.23 the start-up burners on the DITL (one world): burner A = DITL-12 (B / C / D = DITL-12A / B / C), its CRT push buttons on
     DITL-09 (machine instances #B ~ #D): row 9 BURNER ON, row 11 BURNER OFF; out 8 READY, out 20 IN SERVICE (-> ABC M.3412 ...). The
     light-off needs the burner S.A. damper at the ignition position (ABC-003A M.3124: AI0291 14 ~ 18 %) and the oil FCV at the
     ignition position (M.312C: 23 ~ 27 %), DITL-07 PERMISSION TO START IGNITER / BURNER */
  const BR = { A: ['DITL-12', 'DITL-09', 'FICFA1043A', 'FICDO1043A'], B: ['DITL-12A', 'DITL-09 #B', 'FICFA1043B', 'FICDO1043B'], C: ['DITL-12B', 'DITL-09 #C', 'FICFA1043C', 'FICDO1043C'], D: ['DITL-12C', 'DITL-09 #D', 'FICFA1043D', 'FICDO1043D'] };
  const inSvc = L => dOut(BR[L][0], 19) === 1;
  const bIgn = L => btn('SA damper ' + L + ' 16 %, oil FCV ' + L + ' 25 % (ignition)', () => (A.man(BR[L][2], 16), A.man(BR[L][3], 25)), () => inSvc(L) || (mv(BR[L][2]) >= 14 && mv(BR[L][2]) <= 18 && mv(BR[L][3]) >= 23 && mv(BR[L][3]) <= 27));
  /* dg = the DITL sheet and row where the operator presses it (the Training dock opens it there, 3.2.0-beta.26) */
  const bOn = L => ({ ad: BR[L][0] + '@7', dg: [BR[L][1], 8], l: 'BURNER ' + L + ' ON (DITL-09)', f: () => dPress(BR[L][1], 8), on: () => inSvc(L) });
  const bOil = (L, p) => btn(BR[L][3] + ' M ' + p + ' %', () => (inSvc(L) ? A.man(BR[L][3], p) : ''), () => inSvc(L) && mv(BR[L][3]) >= p - 5);
  const bOff = L => btn('BURNER ' + L + ' OFF (DITL-09)', () => dPress(BR[L][1], 10), () => dOut(BR[L][0], 19) === 0);
  /* 3.2.0-beta.23 coal feeder outlet discharge valve (DITL-20 row 6 OPEN P.B. -> SV-CL1061-A, out 6 OPENED): a start permissive of the
     feeder (DITL-19 row 14); feeder B / C = machine instances #B / #C. Without the one world: nothing to do (the ABC has no such signal) */
  const fDis = L => {
    const nm = 'DITL-20' + (L === 'A' ? '' : ' #' + L);
    return Object.assign(btn('Feeder ' + L + ' discharge valve OPEN (DITL-20)', () => (WL() ? dPress(nm, 5) : ''), () => !WL() || dOut(nm, 5) === 1), { dg: [nm, 5] });
  };
  /* 3.2.0 P1 #3 / #4: the MOVs of the DITL-38 table (one machine each, src/world/world.js W.MCV): row 5 OPEN P.B., row 11 CLOSE P.B.; the
     position of the DITL valve model. Without the one world nothing to do (the plant then takes the valve as open) */
  const mcvS = tag => (typeof S !== 'undefined' ? S.sheets.concat((window.WORLD && WORLD.inst) || []).find(x => x._inst && x._inst.lbl === tag) : null);
  const mcvPos = tag => {
    const x = mcvS(tag);
    return x && typeof MST !== 'undefined' && MST[x.name] && MST[x.name][0] ? +MST[x.name][0].pos : 0;
  };
  /* live check #95 (Hakbang 26 stuck): the instance of the valve is looked up when the button is pressed, not when the steps are made
     (then the machine instances of the one world did not exist yet: the button pressed nothing and the interlock / FIELD of the step
     went to the first valve of DITL-38, MV-BD1001). DITL-38 instance names: "(62)DITL-38 #MV-FW1391" */
  const mcvB = (tag, open) => {
    const nm = 'DITL-38 #' + tag,
      ad = () => {
        const x = mcvS(tag);
        return x && !x._inst.k ? 'DITL-38' : nm;
      };
    return Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (DITL-38)', () => (WL() && mcvS(tag) ? dPress(ad(), open ? 4 : 10) : ''), () => !WL() || (open ? mcvPos(tag) >= 100 : mcvPos(tag) <= 0)),
      { dg: [nm, open ? 4 : 10], ad: nm }
    );
  };
  /* P2 #13: a single-valve MOV drawing (DITL-54 start-up ejector MV-AS1395, DITL-55 steam jet air ejector MV-AS1396, DITL-56 vacuum
     breaker MV-AV1391): OPEN / CLOSE P.B. rows of the drawing (0-based), the position of the DITL valve model */
  const movS = nm => (typeof S !== 'undefined' ? S.sheets.find(x => x.name.endsWith(')' + nm)) : null);
  const movPos = nm => {
    const x = movS(nm);
    return x && typeof MST !== 'undefined' && MST[x.name] && MST[x.name][0] ? +MST[x.name][0].pos : 0;
  };
  const movB = (nm, tag, open, ro, rc) =>
    Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (' + nm + ')', () => (WL() ? dPress(nm, open ? ro : rc) : ''), () => !WL() || (open ? movPos(nm) >= 100 : movPos(nm) <= 0)),
      { dg: [nm, open ? ro : rc], ad: nm }
    );
  const mcvC = (want, f) => C(want, () => !WL() || f(), () => (WL() ? W_MCV().map(t => t.replace('MV-', '') + ' ' + mcvPos(t).toFixed(0) + '%').join(', ') : '— (one world OFF)'));
  const W_MCV = () => ['MV-FW1001', 'MV-FW1391', 'MV-FW1002', 'MV-FW1392', 'MV-MS1391', 'MV-MS1392'];
  const dTxt = (nm, row, on, off) => () => (dOut(nm, row) === 1 ? on : dOut(nm, row) === 0 ? off : '— (one world OFF)');
  /* a motor of a DITL drawing with no running memory on the ABC sheets: START / STOP from its drawing, its interlock in the card */
  const dmot = (nm, l) => ({ ad: nm, l: 'START ' + l, f: () => LS_DOCK && LS_DOCK.dmotor(nm, 1), on: () => dRun(nm) === 1, stop: { l: 'STOP ' + l, f: () => LS_DOCK && LS_DOCK.dmotor(nm, 0) } });
  /* the field items of procedure sections (0-based): the FIELD and TCS steps the operator confirms */
  const fieldOf = secs => {
    const out = [];
    for (const si of secs)
      (PROC()[si] ? PROC()[si].s : []).forEach((x, i) => {
        let k = 'field';
        try {
          k = L().kind(si, i).k;
        } catch (e) {}
        if (k !== 'auto') out.push(x.t);
      });
    return out;
  };
  let ST = null;
  /* user 2026-10-29 (#108, no coach): what the trainee reads to fire by hand. The heating rate: the boiler water temperature over the
     last 5 minutes of the plant (FHI Fig 1: <= 110 C/h), sampled every plant minute (onStep) */
  const RATE = { h: [] };
  const rate = () => {
    const H = RATE.h;
    if (H.length < 2) return NaN;
    const a = H[0],
      z = H[H.length - 1];
    return z[1] > a[1] || z[1] < a[1] ? ((z[1] - a[1]) * 3600) / Math.max(1, z[0] - a[0]) : 0;
  };
  const f1w = x => (typeof x === 'number' ? f1(x) : x);
  const WARM = [
    ['Boiler water temperature', () => +U().Tw, '°C', f1w, ''],
    ['Heating rate (5 min)', rate, '°C/h', f1w, 'SOP ≤ 110 (Fig 1)'],
    ['Drum pressure', () => +U().Pd, 'kg/cm²', f1w, ''],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  const BYP = [
    ['Main steam pressure', () => h().MSP(), 'kg/cm²', f1w, 'HP bypass SV'],
    ['Main steam flow', () => h().MSF(), 'T/H', f1w, 'SOP 40 ~ 55'],
    ['Reheat pressure', () => h().RHP(), 'kg/cm²', f1w, '≤ 8.5'],
    ['Flue gas O₂', () => h().O2(), '%', f1w, '3.5 ~ 8'],
    ['Heating rate (5 min)', rate, '°C/h', f1w, 'SOP ≤ 110'],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  const COAL = [
    ['Bed temperature', () => +U().Tb, '°C', f1w, '> 700 (DITL-03F)'],
    ['Main steam pressure', () => h().MSP(), 'kg/cm²', f1w, 'target 123'],
    ['Coal flow', () => h().coal(), 'T/H', f1w, ''],
    ['Burner oil, total', () => +U().oilF, 'T/H', f1w, '1 T/H oil = 2.55 T/H coal'],
    ['Generator MW', () => h().MW(), 'MW', f1w, ''],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  function steps() {
    if (ST) return ST;
    const b = B(),
      R = b.RUN;
    const FIELD1 = (st, title, secs, extra) => Object.assign({ st, field: secs, need: 1, t: title, d: 'The field operator does these (local valves, gauges, panels). They have no DCS signal, so just confirm when they are done.' }, extra || {});
    /* 3.2.0 retest #32: one SOP section = one step (Hakbang 4 had 135 items of sections 3 ~ 13): a field card of several sections is
       one card per section, titled as the procedure */
    const secT = si => {
      const s = String((PROC()[si] || {}).t || '').toLowerCase();
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    const FIELD = (st, title, secs, extra) => (secs.length > 1 ? secs.map(si => FIELD1(st, secT(si) + ' (field)', [si], extra)) : FIELD1(st, title, secs, extra));
    /* 3.2.0 retest #33: the equipment of the utility sections that the DCS starts (its DITL drawing: START P.B., RUNNING, TRIP), a local
       machine (compressor: its RUNNING contact on the DITL, set by the field operator), a machine with no DCS signal (hypochlorite pump:
       field equipment of the plant model, source.js) */
    const runC = (want, L) => C(want, () => !WL() || L.some(nm => dRun(nm) === 1), () => (WL() ? L.map(nm => nm.replace(/^DITL-\S+\s*#?/, '') + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED')).join(', ') : '— (one world OFF)'));
    const outC = (want, nm, row, on, off) => C(want, () => !WL() || dOut(nm, row) === 1, dTxt(nm, row, on, off));
    const pbB = (l, nm, row, ad, on) => Object.assign(btn(l, () => (WL() ? dPress(nm, row) : ''), on), { dg: [nm, row], ad, mot: 1 });
    const locRun = (nm, row) => {
      const s = window.LS_DOCK && LS_DOCK.dOf(nm);
      try {
        return s ? DUI.rowVal(s, row) : null;
      } catch (e) {
        return null;
      }
    };
    /* 3.2.0 retest #52: a field start is a toggle (FIELD: START <-> FIELD: STOP), logged in the Event log */
    const locB = (l, nm, row) =>
      Object.assign(btn('FIELD: START ' + l + ' (local)', () => window.LS_DOCK && LS_DOCK.fieldRow(nm, row, locRun(nm, row) === 1 ? 0 : 1, (locRun(nm, row) === 1 ? 'STOP ' : 'START ') + l + ' (local panel)'), () => locRun(nm, row) === 1), { loc: 1, tog: 1, dg: [nm, row] }); /* R9 #75: the centre follows to its drawing (DITL-113 / 114) */
    const fstate = k => !!(AN.fieldState && AN.fieldState()[k]);
    const fldB = (k, l) =>
      Object.assign(
        btn('FIELD: START ' + l, () => {
          const on = fstate(k);
          A.field(k, !on);
          try {
            window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (on ? 'STOP ' : 'START ') + l + ' (local panel)');
          } catch (e) {}
        }, () => fstate(k)),
        { loc: 1, tog: 1 }
      );
    /* 3.2.0 retest #49 #47: the seawater pumps: 2 of the 3 run (any two), the third is the standby in AUTO (DITL-29A row 4 SEAWATER PUMP x
       AUTO MODE SELECTED, a CRT selection M.1152 / 1162 / 1172; machine B / C = the instances #B / #C of the one world) */
    const SWPM = ['M.3353', 'M.3354', 'M.3355'],
      SWPD = ['DITL-29A', 'DITL-29A #B', 'DITL-29A #C'],
      SWPL = ['SWP-A', 'SWP-B', 'SWP-C'],
      swpN = () => SWPM.filter(a => bit(a) > 0.5).length,
      /* live test 2026-10-30 #12: the standby is AUTO only with its LOCAL / REMOTE selector in REMOTE (DITL-29A row 5 / 18 / 22): the AUTO start
         of the drawing needs both (PR-OPE-5002 section 2 "Ensure SWP in remote position" before "Set the standby SWP to AUTO") */
      remOf = nm => call0(() => LS_DOCK.modeOf(nm).rem) === true,
      swpAuto = j => locRun(SWPD[j], 3) === 1 && remOf(SWPD[j]),
      swpStby = () => SWPM.findIndex(a => !(bit(a) > 0.5));
    const BPD = ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'],
      bpN = () => BPD.filter(nm => dRun(nm) === 1).length,
      bpAuto = j => locRun(BPD[j], 3) === 1 && remOf(BPD[j]),
      bpStby = () => BPD.findIndex(nm => dRun(nm) !== 1);
    /* 3.2.0 retest #46 #33: the values of the equipment the operator reads on the HMI (no transmitter on the ABC sheets): from the HMI snapshot
       030 SEAWATER SYSTEM (SWP 207 ~ 243 A, SWBP 87 A, condenser inlet 1.0 / outlet 0.4 ~ 0.5 kg/cm2) and the SOP (SWP discharge 2.2 ~ 2.4
       ksc, condenser dP 0.4), shown while the pump runs (0 when stopped) */
    const ifRun = (on, x) => (on ? x : 0);
    /* live test 2026-10-30 #9 #10 #21: the values of the plant model, the same number as the HMI 030 (was: fixed numbers here, PISW1110A2
       0.5 in the dock and 0.40 on the HMI); bands of PR-OPE-5002 */
    const uv = k => +U()[k] || 0;
    const SWPW = [
      ['Seawater pumps running', () => swpN() + ' / 3', '', x => x, 'need 2 (the third: standby AUTO)'],
      ...SWPL.map((l, j) => ['Seawater pump ' + 'ABC'[j] + ' current (IIP1501' + 'ABC'[j] + ')', () => uv('swIa' + j), 'A', f1w, 'SOP 205 ~ 215']),
      /* live test beta.74 #35 #36: the SWP discharge (local gauge) and the forebay, plant model, the same number as the HMI 030 */
      ['Seawater pump discharge, running (PG-SW1501)', () => Math.max(0, ...['M.3353', 'M.3354', 'M.3355'].map((a, j) => (bit(a) ? uv('swPd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4'],
      ['Forebay level (LISW1501)', () => +U().swLvl, 'm', f1w, 'SOP NL −4 m (4 m below GL)'],
      ['Seawater header / condenser inlet (PISW1110A1)', () => uv('swPiA'), 'kg/cm²', f1w, 'SOP 1.0 ~ 1.1'],
      ['Condenser seawater outlet A / B (PISW1110A2 / B2)', () => f1w(uv('swPoA')) + ' / ' + f1w(uv('swPoB')), 'kg/cm²', x => x, 'HMI 30.PNG 0.4 / 0.5'],
      ['Condenser seawater ΔP A / B', () => f1w(uv('swPiA') - uv('swPoA')) + ' / ' + f1w(uv('swPiB') - uv('swPoB')), 'kg/cm²', x => x, 'SOP ≥ 0.4']
    ];
    const BPW = [
      ['Seawater booster pumps running', () => bpN() + ' / 3', '', x => x, 'need 2 (the third: standby REMOTE + AUTO)'],
      ...['A', 'B', 'C'].map((l, j) => ['Booster pump ' + l + ' current (IIP1503' + l + ')', () => uv('swIb' + j), 'A', f1w, 'SOP 90 · alarm 120 · trip 126']),
      ['Booster pump suction', () => uv('swBs0'), 'kg/cm²', f1w, 'SOP 1 ~ 1.1'],
      ['Booster pump discharge, running (PG-SW1503)', () => Math.max(0, ...BPD.map((nm, j) => (dRun(nm) === 1 ? uv('swBd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4 · alarm < 2.2']
    ];
    /* #12: the standby of a pump set (not running): FIELD I-REMOTE (local selector), then AUTO (CRT selection, row au); AUTO refused while LOCAL */
    const stbyB = (D, Lb, au, isRun) =>
      D.flatMap((nm, j) => [
        Object.assign(btn('FIELD: to REMOTE ' + Lb[j] + ' (standby)', () => (window.LS_DOCK && LS_DOCK.dremote(nm, Lb[j]), ''), () => remOf(nm)), { loc: 1, hide: () => isRun(j) || remOf(nm) }),
        Object.assign(
          btn('AUTO ' + Lb[j] + ' (standby)', () => (!remOf(nm) ? 'Still LOCAL on ' + Lb[j] + ': FIELD to REMOTE first (SOP: "in remote position"), then AUTO.' : window.LS_DOCK && LS_DOCK.dsel(nm, au, 1, Lb[j] + ' AUTO MODE SELECTED') && ''), () => locRun(nm, au) === 1),
          { dg: [nm, au], sel: 1, auto: 1, hide: () => isRun(j) }
        )
      ]);
    const runW = (l, L, cur, unit, hint) => [[l + ' running', () => L.filter(f => f()).length + ' / ' + L.length, '', x => x, hint || ''], [l + ' ' + (unit === 'A' ? 'current' : 'discharge press'), () => ifRun(L.some(f => f()), cur), unit, null, '']];
    ST = [
      /* ---- 0 utilities ---- */
      /* 3.2.0 walkthrough #5: PR-OPE-5002 ESP "purge air heater and fan ... 6 hours prior to start-up": confirmed when already 6 h in service,
         or held 6 h of plant time from the card (pre) */
      FIELD(0, 'ESP purge air heater and fan (field), 6 hours before start-up', [0], { pre: 21600, d: 'Do: "Start the 6 h purge (plant time)", then ▶ RUN (the speed goes to ×300 by itself and back to ×1 at 6:00). SOP: the field operator runs the ESP purge air heater and fan 6 HOURS BEFORE start-up. "6 h purge done" becomes available at 6:00; if it has already run 6 h in the field, use "Skip the 6 h (training shortcut)" (it asks to confirm and is logged in Events).' }),
      /* 3.2.0 retest #49: any two of the three SWP (was: a first and a second SWP step, the second showed the third pump to start) */
      { st: 0, sec: 2, it: [0, 32], t: 'Start 2 seawater pumps (SWP), any two', d: 'Do: REMOTE in the field, then START two seawater pumps. The third one is the standby.', c: b.SWP2, max: 2, a: [mot('M.3353', 'SWP-A'), mot('M.3354', 'SWP-B'), mot('M.3355', 'SWP-C')], field: [1], w: SWPW },
      {
        st: 0,
        sec: 2,
        it: [33, 34] /* live test 2026-10-30 #13: the two SOP items of this step (was: the 35 items of section 2) */,
        t: 'Put the standby seawater pump (SWP) in REMOTE and AUTO',
        d: 'Do: FIELD to REMOTE on the seawater pump that is not running, then AUTO (DITL-29A row 4, AUTO MODE SELECTED). This pump starts when a running one trips; the AUTO start of the drawing also needs REMOTE (row 5).',
        c: C('2 seawater pumps running, standby in REMOTE + AUTO', () => !WL() || (swpN() >= 2 && swpStby() >= 0 && swpAuto(swpStby())), () => swpN() + ' running · standby ' + (swpStby() >= 0 ? SWPL[swpStby()] + (remOf(SWPD[swpStby()]) ? ' REM' : ' LOC') + (locRun(SWPD[swpStby()], 3) === 1 ? ' · AUTO' : ' · MAN') : '—')),
        a: stbyB(SWPD, SWPL, 3, j => bit(SWPM[j]) > 0.5),
        runN: swpN,
        field: [1],
        w: SWPW
      },
      /* 3.2.0 retest #32 #33: one step per SOP section 3 ~ 17, the machines started from the DCS or locally (were: two field cards, 135 items) */
      { st: 0, sec: 3, t: 'Start the hypochlorite pump (field)', d: 'The hypochlorite pump has no DCS command (the STN105 DI is running / overload status only, for example P-0762A I.0329): the field operator starts it at the local panel (HCDSP).', c: C('Hypochlorite pump running (field)', () => !!(AN.fieldState && AN.fieldState().hypo), () => 'Hypochlorite pump ' + (AN.fieldState && AN.fieldState().hypo ? 'RUNNING' : 'STOPPED')), a: [fldB('hypo', 'hypochlorite pump')], field: [2], w: [['Hypochlorite pump', () => (fstate('hypo') ? 'RUNNING' : 'STOPPED'), '', x => x, 'local panel']] },
      { st: 0, sec: 4, t: 'Start the seawater pump outlet debris filter (DITL-39)', d: 'REMOTE AUTO START of debris filter system 1 from the DCS (DITL-39 row 8). It runs only while a seawater pump is running.', c: outC('Seawater pump outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 3, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 1 AUTO START (DITL-39)', 'DITL-39', 7, null, () => dOut('DITL-39', 3) === 1)], field: [3], w: [['Seawater pump outlet debris filter', () => (dOut('DITL-39', 3) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 4'], ['Seawater pumps running', () => swpN() + ' / 3', '', x => x, 'need ≥ 1']] },
      /* R9 #71: PR-OPE-5002 section 5 starts a 1st and a 2nd SWBP and puts the third on standby AUTO (HMI 030: SWBP-A / C running, B
         standby): two running, as the SWP (was: one, so the SOP item "Initiate START to 2nd selected SWBP" could never tick) */
      /* live test 2026-10-30 #8: PR-OPE-5002 section 5 "Set the standby SWBP to AUTO": DITL-30 row 4 SEAWATER BOOSTER PUMP x AUTO MODE
         SELECTED (CRT, M.1202 / 1212 / 1222; with it the pump starts when a running one trips: B / C RUNNING off-delay 2 s AND TRIP). The step
         is done with 2 running AND the third in AUTO (was: 2 running only, the third stayed MAN) */
      { st: 0, sec: 5, max: 2, sby: 1, t: 'Start 2 seawater booster pumps (SWBP), any two', d: 'Do: REMOTE in the field, then START two booster pumps (DITL-30). The third one is the standby: AUTO (DITL-30 row 4, AUTO MODE SELECTED). A seawater pump must be running.', c: C('2 booster pumps running, standby in REMOTE + AUTO (DITL-30)', () => !WL() || (bpN() >= 2 && (bpStby() < 0 || bpAuto(bpStby()))), () => (WL() ? BPD.map((nm, j) => 'ABC'[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED' + (bpAuto(j) ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)')), a: [dmot('DITL-30', 'SWBP-A'), dmot('DITL-30 #B', 'SWBP-B'), dmot('DITL-30 #C', 'SWBP-C')], field: [4], w: BPW },
      { st: 0, sec: 6, t: 'Start the booster pump outlet debris filter (DITL-39)', d: 'REMOTE AUTO START of debris filter system 2 from the DCS (DITL-39 row 19).', c: outC('Booster pump outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 14, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 2 AUTO START (DITL-39)', 'DITL-39', 18, null, () => dOut('DITL-39', 14) === 1)], field: [5], w: [['Booster pump outlet debris filter', () => (dOut('DITL-39', 14) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 15']] },
      /* live test 2026-10-30 #23 #24 (H8 stuck: expansion tank 0.80 m, no control of XV-MU1109 / V-MU1033, no AUTO of the standby MWP, yet
         "✓ Tapos"): PR-OPE-5002 section 7 as the plant does it. One MWP running (DITL-112), the standby in REMOTE (row 22) + AUTO (row 15
         AUTO MODE SELECTED, M.1052 / 1062 / 1072: its auto start on a trip of the running one or the header L.L.); the expansion tank
         T-1109 filled to NL 1.7 m through XV-MU1109 (DITL-78: row 5 OPEN P.B. M.1250 / row 9 CLOSE P.B. M.1251 in MAN, row 1 AUTO P.B.
         = row 3 AUTO SELECTED M.1252: open < 40 %, close > 85 % = 1.7 m of LT-CW1109) or its manual bypass V-MU1033 (field), the header
         > 6.0 kg/cm2, the valve closed when the filling is OK, then XV-MU1109 to AUTO when instrument air is available. The step is done
         on the plant: level >= 1.7 m and the filling valve closed (the plant model AN_MU), not on the ticks */
      (() => {
        const MW = ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'],
          ML = ['MWP-A', 'MWP-B', 'MWP-C'],
          mwN = () => MW.filter(nm => dRun(nm) === 1).length,
          mwStby = () => MW.findIndex(nm => dRun(nm) !== 1),
          mwAuto = j => locRun(MW[j], 14) === 1 && remOf(MW[j]),
          et = () => +U().etLvl || 0,
          air = () => (+U().iaP || 0) >= 3.5,
          xvAuto = () => locRun('DITL-78', 2) === 1,
          xvOpen = () => +U().muXv === 1,
          byp = () => fstate('mu1033'),
          closed = () => !xvOpen() && !byp(),
          bypSet = v => {
            A.field('mu1033', v);
            try {
              window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (v ? 'OPEN' : 'CLOSE') + ' expansion tank bypass valve V-MU1033 (local)');
            } catch (e) {}
          },
          xvSel = v => {
            if (!window.LS_DOCK) return '';
            LS_DOCK.dset('DITL-78', 0, v);
            LS_DOCK.dsel('DITL-78', 2, v, 'EXPANSION TANK INLET VLV XV-MU1109 AUTO SELECTED (M.1252)');
            return '';
          };
        return {
          st: 0,
          sec: 7,
          max: 1,
          sby: 1,
          t: 'Start a make-up water pump (MWP) and fill the expansion tank',
          d: 'Do: START one make-up water pump, REMOTE + AUTO on the standby, then fill the expansion tank to its normal level and close the valve. Normal level is NL 1.7 m (fill with XV-MU1109 or the bypass V-MU1033). The make-up water pumps are on the DCS (DITL-112). XV-MU1109 (DITL-78) is pneumatic: it opens only with instrument air (≥ 3.5 kg/cm²); without it (Cold, before Step 11) the field operator uses the bypass V-MU1033. The header must be > 6.0 kg/cm² for the water to flow in.',
          c: C(
            '1 make-up water pump running, standby REMOTE + AUTO, expansion tank ≥ 1.7 m and fill valve closed' + ' (XV-MU1109 AUTO when instrument air is available)',
            () => !WL() || (mwN() >= 1 && mwStby() >= 0 && MW.some((nm, j) => dRun(nm) !== 1 && mwAuto(j)) && et() >= 1.69 && closed() && (xvAuto() || !air())),
            () =>
              (WL() ? MW.map((nm, j) => ML[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : (remOf(nm) ? 'REM' : 'LOC') + (locRun(nm, 14) === 1 ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)') +
              ' · T-1109 ' + et().toFixed(2) + ' m · XV-MU1109 ' + (xvOpen() ? 'OPEN' : 'CLOSED') + (xvAuto() ? ' AUTO' : ' MAN') + ' · V-MU1033 ' + (byp() ? 'OPEN' : 'CLOSED')
          ),
          a: [
            dmot('DITL-112', 'MWP-A'),
            dmot('DITL-112 #B', 'MWP-B'),
            dmot('DITL-112 #C', 'MWP-C'),
            /* the order is the order of the SOP (the banner names the first one not done): open the fill (XV-MU1109 with instrument air,
               else the bypass), close it at NL 1.7 m, then XV-MU1109 to AUTO when instrument air is available */
            Object.assign(btn('XV-MU1109 OPEN (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'XV-MU1109 is in AUTO: put it in MAN first to open it.' : !air() ? 'No instrument air (IA < 3.5 kg/cm²): XV-MU1109 will not open. Use the bypass V-MU1033 (field).' : (dPress('DITL-78', 4), '')), () => xvOpen() || !air() || byp() || et() >= 1.69), { dg: ['DITL-78', 4] }),
            Object.assign(btn('FIELD: OPEN V-MU1033 (bypass)', () => (byp() ? '' : (bypSet(true), '')), () => byp() || xvOpen() || et() >= 1.69), { loc: 1, fp: 'F:mu1033' }),
            Object.assign(btn('XV-MU1109 CLOSE (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'XV-MU1109 is in AUTO: the logic closes it at 85 % (1.7 m).' : (dPress('DITL-78', 8), '')), () => !xvOpen() || et() < 1.69), { dg: ['DITL-78', 8] }),
            Object.assign(btn('FIELD: CLOSE V-MU1033 (bypass)', () => (byp() ? (bypSet(false), '') : ''), () => !byp() || et() < 1.69), { loc: 1, fp: 'F:mu1033' }),
            Object.assign(btn('XV-MU1109 AUTO / MAN (DITL-78)', () => xvSel(!xvAuto()), () => xvAuto() || !air() || et() < 1.69), { dg: ['DITL-78', 2] })
          ],
          field: [6],
          w: [
            ['Make-up water pumps running', () => mwN() + ' / 3', '', x => x, 'need 1 + standby AUTO'],
            ...ML.map((l, j) => ['Make-up water pump ' + 'ABC'[j] + ' current', () => +U()['muI' + j] || 0, 'A', f1w, 'SOP 20 A · alarm 61.1 A']),
            ['Make-up water header pressure (PIMU0709)', () => +U().muP || 0, 'kg/cm²', f1w, 'SOP > 6.0 · alarm 6.5'],
            ['Expansion tank level (LT-CW1109)', () => et(), 'm', x => (+x).toFixed(2), 'NL 1.7 m'],
            ['XV-MU1109', () => (xvOpen() ? 'OPEN' : 'CLOSED') + (xvAuto() ? ' · AUTO' : ' · MAN'), '', x => x, 'DITL-78'],
            ['V-MU1033 bypass', () => (byp() ? 'OPEN' : 'CLOSED'), '', x => x, 'field'],
            ['Instrument air', () => +U().iaP || 0, 'kg/cm²', f1w, '≥ 3.5 for XV-MU1109']
          ]
        };
      })(),
      { st: 0, sec: 8, t: 'Start the auxiliary cooling water pump (ACW)', d: 'The auxiliary cooling water pumps are on the DCS (DITL-76 A, DITL-77 B).', c: runC('An auxiliary cooling water pump running (DITL-76 / 77)', ['DITL-76', 'DITL-77']), a: [dmot('DITL-76', 'ACWP-A'), dmot('DITL-77', 'ACWP-B')] /* 3.2.0-beta.69: the SOP / HMI name (027 boxes the picked ACWP) */, field: [7], w: (() => {
          /* R9 #74: SOP section 9: the discharge valve opened until the pump discharge reaches 7 kg/cm² (PG-CW1108A/B, local gauge);
             the header PICW1152 reads 6.4 at 150 MW (HMI snapshot) */
          const L = ['DITL-76', 'DITL-77'].map(nm => () => dRun(nm) === 1);
          return [
            ['Aux. cooling water pumps running', () => L.filter(f => f()).length + ' / 2', '', x => x, ''],
            ['Aux. cooling water pump discharge', () => ifRun(L.some(f => f()), 7.0), 'kg/cm²', null, 'PG-CW1108A/B · SOP 7'],
            ['Aux. cooling water header', () => ifRun(L.some(f => f()), 6.4), 'kg/cm²', null, 'PICW1152 · HMI 6.4']
          ];
        })() },
      { st: 0, sec: 9, t: 'Start the instrument air dryer (DITL-45)', d: 'START instrument air dryer A from the DCS (DITL-45 row 15).', c: outC('Instrument air dryer A RUNNING (DITL-45)', 'DITL-45', 14, 'RUNNING', 'STOPPED'), a: [pbB('START instrument air dryer A (DITL-45)', 'DITL-45', 14, 'DITL-45@14', () => dOut('DITL-45', 14) === 1)], field: [8], w: [['Instrument air dryer A', () => (dOut('DITL-45', 14) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 15']] },
      { st: 0, sec: 10, t: 'Start the instrument air compressor (local)', d: 'The compressor is started at its local panel; the DCS shows RUNNING (DITL-113 row 6).', c: C('Instrument air compressor A running (DITL-113)', () => !WL() || locRun('DITL-113', 5) === 1, () => 'Instrument air compressor A ' + (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('instrument air compressor A', 'DITL-113', 5)], field: [9], w: [['Instrument air compressor A', () => (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-113 row 6']] },
      { st: 0, sec: 11, t: 'Start the plant air dryer (DITL-45)', d: 'START plant air dryer A from the DCS (DITL-45 row 4).', c: outC('Plant air dryer A RUNNING (DITL-45)', 'DITL-45', 3, 'RUNNING', 'STOPPED'), a: [pbB('START plant air dryer A (DITL-45)', 'DITL-45', 3, 'DITL-45@3', () => dOut('DITL-45', 3) === 1)], field: [10], w: [['Plant air dryer A', () => (dOut('DITL-45', 3) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 4']] },
      { st: 0, sec: 12, t: 'Start the plant air compressor (local)', d: 'The compressor is started at its local panel; the DCS shows RUNNING (DITL-114 row 6).', c: C('Plant air compressor A running (DITL-114)', () => !WL() || locRun('DITL-114', 5) === 1, () => 'Plant air compressor A ' + (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('plant air compressor A', 'DITL-114', 5)], field: [11], w: [['Plant air compressor A', () => (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-114 row 6']] },
      /* R9 #77 #84 #85 #78: PR-OPE-5002 sections 13 ~ 16, the turbine lube and control oil: one step each with its own purpose and action
         (was: four field cards with the same text "walang DCS signal"). The MOP / COP / vapour extractor are started on the TCS panel
         (tcs.js lop / eh / vex: the oil pressures of the Bantayan), the oil purifier at its local panel; the lube oil temperature control
         TICLO1002 (valve TCVCW1201, ABC) goes to REMOTE */
      {
        st: 0,
        sec: 13,
        need: 1,
        field: [12],
        t: 'Pre-start check of the turbine lube and control oil; TICLO1002 in AUTO',
        d: 'Do: put the lube oil temperature control TICLO1002 (valve TCVCW1201) in AUTO, then press "Done in field" when the check is done. The SOP says "change mode to Remote": on drawing ABC-053 TICLO1002 has no REMOTE (.REM), so the DCS holds it in AUTO. TCVCW1201 passes cooling water through the lube oil cooler: in REMOTE the DCS holds the oil outlet temperature (average 46 °C, cooling water inlet up to 37 °C). Before the oil pumps start: main oil tank (T-n920) full, drains (V-LOn021 / 032) closed, and no alarm on the TCS.',
        c: C('TICLO1002 (TCVCW1201) held by the DCS (AUTO)', () => /AUTO|REM/.test(md('TICLO1002')), () => 'TICLO1002 ' + md('TICLO1002')),
        fps: ['TICLO1002'],
        a: [btn('A (AUTO) TICLO1002 · TCVCW1201', () => A.auto('TICLO1002'), () => /AUTO|REM/.test(md('TICLO1002')))],
        w: [['Lube oil temp. control', () => md('TICLO1002'), '', x => x, 'TICLO1002 · AUTO (SOP: REMOTE)']]
      },
      {
        st: 0,
        sec: 14,
        field: [13],
        t: 'Start the vapour extractor and the main oil pump (MOP) on the TCS',
        d: 'Do: START the vapour extractor, then START one main oil pump (MOP, P-n922A/B) on the TCS panel. The vapour extractor draws the oil vapour out of the main oil tank (vacuum −20 ~ −50 mmH₂O on PGLO1920). The MOP supplies lube oil (5.6 ~ 6.6 kg/cm²g) to the turbine and generator bearings; it is needed before the turning gear. Bearing oil (PGLO1008) must be > 1.05 kg/cm²g: at ≤ 1.05 the emergency oil pump (EOP) starts.',
        c: C('Vapour extractor and MOP running (TCS)', () => !!(TC().aux.vex && TC().aux.lop), () => 'vapour extractor ' + (TC().aux.vex ? 'RUNNING' : 'STOPPED') + ', MOP ' + (TC().aux.lop ? 'RUNNING' : 'STOPPED')),
        a: [btn('START vapour extractor (TCS)', () => A.tcs('vex', 1), () => !!TC().aux.vex), btn('START main oil pump MOP (TCS)', () => A.tcs('lop', 1), () => !!TC().aux.lop)],
        w: [
          ['Main oil tank vacuum', () => (TC().oil || {}).vac, 'mmH₂O', f1, 'PGLO1920 · −20 ~ −50'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-n922 · 5.6 ~ 6.6'],
          ['Bearing oil pressure', () => (TC().oil || {}).brg, 'kg/cm²g', x => (isFinite(x) ? (+x).toFixed(2) : '—'), 'PGLO1008 · > 1.05']
        ]
      },
      {
        st: 0,
        sec: 15,
        field: [14],
        t: 'Start the oil purifier pump (local)',
        d: 'Do: drain the water (V-LO1223), open the inlet valves (V-LOn201, V-LOn205), then START the oil purifier pump (P-n941) at the local panel. The purifier cleans the lube and control oil (water and dirt); discharge pressure about 2.96 kg/cm². It can run continuously or from time to time.',
        c: C('Oil purifier pump running (local)', () => fstate('pur'), () => 'Oil purifier pump ' + (fstate('pur') ? 'RUNNING' : 'STOPPED')),
        a: [fldB('pur', 'oil purifier pump')],
        w: [['Oil purifier pump', () => (fstate('pur') ? 'RUNNING' : 'STOPPED'), '', x => x, 'P-n941'], ['Purifier discharge', () => (fstate('pur') ? 2.96 : 0), 'kg/cm²', f1, '~ 2.96']]
      },
      {
        st: 0,
        sec: 16,
        field: [15],
        t: 'Start the control oil pump (COP) on the TCS',
        d: 'Do: when the MOP lube oil pressure is normal, START one control oil pump (COP, P-n931A/B) on the TCS panel. Control oil (133 ~ 163 kg/cm²g) moves the turbine MSV, RSV, CV and ICV; it is needed before the ATS. Pumps in AUTO start by themselves: MOP at ≤ 5.6, COP at ≤ 133, EOP when bearing oil is ≤ 1.05.',
        c: C('Control oil pump COP running (TCS)', () => !!TC().aux.eh, () => 'COP ' + (TC().aux.eh ? 'RUNNING' : 'STOPPED')),
        a: [btn('START control oil pump COP (TCS)', () => (TC().aux.lop ? A.tcs('eh', 1) : ''), () => !!TC().aux.eh)],
        w: [
          ['Control oil pressure', () => (TC().oil || {}).ctl, 'kg/cm²g', f1, 'P-n931 · 133 ~ 163'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-n922 · 5.6 ~ 6.6']
        ]
      },
      { st: 0, sec: 17, t: 'Start the rotary air preheater (DITL-43)', d: 'Do: FIELD NOT TRIP when the interlock shows ✕, then START the air preheater (DITL-43). The air preheater is a rotating rotor (Ljungstrom) that heats the primary and secondary air with the flue gas. It is started before the fans so the rotor heats evenly and does not bend. It will not start without AIR PREHEATER NOT TRIP (I.0651, DITL-43 row 5) or when its field switch is in LOCAL.', c: runC('Air preheater running (DITL-43)', ['DITL-43']), a: [dmot('DITL-43', 'air preheater')], field: [16], w: [['Air preheater', () => (dRun('DITL-43') === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-43 out 3']] },
      /* ---- 1 water ---- */
      FIELD(1, 'Hotwell filling line-up (field)', [17]),
      { st: 1, sec: 18, t: 'Hotwell level control LCV-MU1110 in AUTO', d: 'The make-up valve now holds the condenser hotwell level.', c: b.MODE('LCV-MU1110', 'AUTO'), fps: ['LCV-MU1110'], a: [btn('A (AUTO)', () => A.auto('LCV-MU1110'))] },
      { st: 1, sec: 18, t: 'Condensate recirculation FCV-CD1120: MANUAL, MV 60 %', d: 'Open the recirculation first so the condensate pump has flow when it starts.', c: b.ALL(b.MODE('FCV-CD1120', 'MAN'), b.MV('FCV-CD1120', 55, 65)), fps: ['FCV-CD1120'], a: [btn('M, MV 60 %', () => A.man('FCV-CD1120', 60))] },
      { st: 1, sec: 18, t: 'Start the condensate pump (CEP)', d: 'The condensate pump sends water from the hotwell to the deaerator. It is also needed for the vacuum later.', c: R.CEP, a: [mot('M.3350', 'CEP-A'), mot('M.3351', 'CEP-B')] },
      { st: 1, sec: 18, t: 'FCV-CD1120 in AUTO, SV 150 T/H', d: 'The recirculation now holds the minimum flow of the condensate pump.', c: b.ALL(b.MODE('FCV-CD1120', 'AUTO'), b.SV('FCV-CD1120', 140, 160, 'T/H')), fps: ['FCV-CD1120'], a: [btn('A, SV 150 T/H', () => A.auto('FCV-CD1120', 150))] },
      { st: 1, sec: 19, t: 'Deaerator level LCV-CD1104 in AUTO, SV 0 mm', d: 'The deaerator fills to normal level and the valve holds it there.', c: b.ALL(b.MODE('LCV-CD1104', 'AUTO'), b.SV('LCV-CD1104', -20, 20, 'mm')), fps: ['LCV-CD1104'], a: [btn('A, SV 0 mm', () => A.auto('LCV-CD1104', 0))], field: [18] },
      { st: 1, sec: 20, t: 'Start the boiler feedwater pump (BFWP)', d: 'The feedwater pump fills the steam drum. The deaerator must have water first.', c: R.BFP, a: [mot('M.3343', 'BFWP-A'), mot('M.3344', 'BFWP-B')] },
      /* 3.2.0 P1 #4 (PR-OPE-5002 BFP start-up 4165 / 4176): the feedwater reaches the drum only through the discharge MOV of the pump */
      {
        st: 1,
        sec: 20,
        t: 'Feedwater pump discharge: equalizing MOV MV-FW1391 OPEN, then main discharge MOV MV-FW1001 OPEN',
        d: 'Do: OPEN MV-FW1391, then OPEN MV-FW1001; when MV-FW1001 is 100 % open, CLOSE MV-FW1391 (the step does not finish while MV-FW1391 is still open). PR-OPE-5002: slowly open the equalizing MOV of the selected BFP (MV-FW1391 / MV-FW1392) to equalize the pressure. When the discharge pressure is > 200 kg/cm², open the main discharge MOV (MV-FW1001 / MV-FW1002) 100 %, then close the equalizing MOV. With both closed, no feedwater reaches the drum.',
        c: mcvC('Main discharge MOV open, equalizing MOV closed', () => (mcvPos('MV-FW1001') >= 100 && mcvPos('MV-FW1391') <= 0) || (mcvPos('MV-FW1002') >= 100 && mcvPos('MV-FW1392') <= 0)),
        a: [mcvB('MV-FW1391', 1), mcvB('MV-FW1001', 1), mcvB('MV-FW1391', 0)]
      },
      /* 3.2.0 walkthrough #7: the cold drum is not filled (hmi-op.js AN_COLD_DRUM); PR-OPE-5002 STEAM DRUM FILLING: FCV-FW1130-2 MANUAL, opened
         gradually, drum level -150 mm. The trainee closes the valve at -150 mm */
      { st: 1, sec: 20, t: 'Steam drum filling: start-up valve FCV-FW1130-2 in MANUAL, fill to −150 mm', d: 'The drum of the cold plant has no water yet (about −300 mm). With the feedwater pump running, open the start-up valve slowly (MANUAL, MV 20 %). At −150 mm you close it (MV 0 %) so the drum does not overfill.', c: b.ALL(b.MODE('FCV-FW1130-2', 'MAN'), b.MV('FCV-FW1130-2', null, 2), b.HOLD(10, b.VAL('lvl', -200, 100))), fps: ['FCV-FW1130-2'] /* OFF unless switched on */, a: [btn('M, MV 20 % (fill)', () => (h().lvl() < -170 ? A.man('FCV-FW1130-2', 20) : ''), () => h().lvl() >= -170 || mv('FCV-FW1130-2') >= 15), btn('MV 0 % (at −150 mm)', () => (h().lvl() >= -170 ? A.man('FCV-FW1130-2', 0) : ''), () => h().lvl() >= -170 && mv('FCV-FW1130-2') <= 2)], field: [19] },
      /* ---- 2 fans ---- */
      { st: 2, sec: 21, t: 'Diesel oil pump and oil circulation (field)', d: 'Do: start the diesel oil pump and set the two oil pressure controls, in the order (1) ~ (6) below. (1) PCV-DO0002 M, 100 % (recirculation open), (2) FIELD START the diesel oil pump, (3) PCV-DO0002 M, 24 % (close gradually, the pressure rises), (4) when PICDO0005 is near its SV (≥ 11.5 kg/cm²): PICDO0005 A, SV 12.8, (5) PCV-DO1009 (return) M, 86 % (close a little, PICDO1008 rises), (6) when PICDO1008 is near its SV (≥ 9.9 kg/cm²): PICDO1008 (PCV-DO1009) A, SV 11. The diesel oil pump is in the field (no DCS signal); the start-up burners need it (PR-OPE-5002 Section 21).', fps: ['PICDO0005', 'PICDO1008'], c: b.ALL(C('Diesel oil pump running (field)', () => !!(AN.fieldState && AN.fieldState().dop), () => 'Diesel oil pump ' + (AN.fieldState && AN.fieldState().dop ? 'ON' : 'OFF')), C('PICDO0005 ≥ 11.5 kg/cm² (near SV 12.8)', () => pv('PICDO0005') >= 11.5, () => 'PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm²'), b.MODE('PICDO0005', 'AUTO'), C('PICDO1008 ≥ 9.9 kg/cm² (near SV 11)', () => pv('PICDO1008') >= 9.9, () => 'PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm²'), b.MODE('PICDO1008', 'AUTO')), a: [btn('PCV-DO0002 M, 100 % (open)', () => A.man('PICDO0005', 100)), fldB('dop', 'diesel oil pump'), btn('PCV-DO0002 M, 24 %', () => A.man('PICDO0005', 24)), btn('PICDO0005 A, SV 12.8', () => (pv('PICDO0005') >= 11.5 ? A.auto('PICDO0005', 12.8) : 'Wait: PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm² (need ≥ 11.5)')), btn('PCV-DO1009 M, 86 %', () => A.man('PICDO1008', 86)), btn('PICDO1008 (PCV-DO1009) A, SV 11', () => (pv('PICDO1008') >= 9.9 ? A.auto('PICDO1008', 11) : 'Wait: PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm² (need ≥ 9.9)'))], field: [20] },
      { st: 2, sec: 22, t: 'Prepare the ID fan (IDF): PICFG108 in MANUAL, MV 0 %, RH and SH biasing dampers open', d: 'The ID fan hydraulic coupling is closed before the fan starts (low starting current). The ID fan interlock (DITL-25A row 1) needs the flue gas bias dampers (HICHR1002A / B) open so the air has a path.', c: b.ALL(b.MODE('PICFG108', 'MAN'), b.MV('PICFG108', null, 2), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null)), fps: ['PICFG108', 'HICHR1002A', 'HICHR1002B'], a: [btn('M, MV 0 %', () => A.man('PICFG108', 0)), btn('RH and SH biasing dampers 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))], field: [21] },
      { st: 2, sec: 22, t: 'Start the ID fan (IDF)', d: 'The ID fan draws the flue gas out of the furnace. It is the first fan to run.', note: 'Alarms of the cold plant: AI0128 / AI0385 drum pressure LOW LOW (no pressure yet), AI0592 economizer inlet temperature LOW LOW (feedwater still cold), LIBR10011 / LIBR10012 / LIBR10013 drum level LOW (LOW −100 mm, LOW LOW −178 mm per the alarm list). At the start of the cold start-up they are SUPPRESSED: not in the header, kept apart in the alarm list (ALARM chip, "suppressed"). They come in as new alarms (ACK them) if still standing 10 min (plant time) after the equipment of their group runs; they clear by themselves when the pressure, temperature and level rise.', c: R.IDF, a: [mot('M.3304', 'IDF')] },
      { st: 2, sec: 22, t: 'ID fan hydraulic coupling: PICFG108 MV 13 %', d: 'Open the coupling to 13 %. The furnace pressure is negative (gas drawn out); target about −15 mmH₂O. If it is too negative, lower the MV by 1 %; if not negative enough, raise it by 1 %.', c: b.ALL(R.IDF, b.MV('PICFG108', 10, 16)), fps: ['PICFG108'], a: [btn('MV 13 %', () => A.man('PICFG108', 13)), btn('MV −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('MV +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1)))] },
      /* 3.2.0-beta.23: the FAB start permissive FCD READY (DITL-28A row 5 <- 28B out 77 = ABC-014 M.3115 inlet FCD demand at 25 % AND
         DITL-28C the silencer SOV opened); without the one world the step is done at once (the DITL is not running) */
      {
        st: 2,
        sec: 23,
        t: 'Prepare the fluidizing air blower (FAB): open the silencer SOV, FAB inlet damper FICFA1055A M 25 %',
        d: 'The blower interlock (DITL-28A row 5 FCD READY) needs the "TO SILENCE SOV" open (DITL-28C, OPEN P.B.) and an inlet damper demand of 25 % (ABC-014).',
        c: b.ALL(b.MODE('FICFA1055A', 'MAN'), b.MV('FICFA1055A', 20, 30), C('Silencer SOV opened (DITL-28C)', () => dOut('DITL-28C', 21) !== 0, () => 'SOV ' + (dOut('DITL-28C', 21) === 1 ? 'OPENED' : dOut('DITL-28C', 21) === 0 ? 'closed' : '— (one world OFF)'))),
        fps: ['FICFA1055A'],
        a: [btn('Silencer SOV OPEN (DITL-28C)', () => dPress('DITL-28C', 0), () => dOut('DITL-28C', 21) !== 0), btn('FICFA1055A M 25 %', () => A.man('FICFA1055A', 25))]
      },
      { st: 2, sec: 23, t: 'Start the fluidizing air blower (FAB)', d: 'Do: START FAB-A, then raise the FAB inlet damper FICFA1055A until the fluidizing air flow is 26 T/H (PR-OPE-5002; about 41 %). The blower supplies air to the seal pots of the cyclone loop.', c: R.FAB, fps: ['FICFA1055A'], a: [mot('M.3308', 'FAB-A'), mot('M.3309', 'FAB-B'), btn('FICFA1055A M 41 % (≈ 26 T/H)', () => A.man('FICFA1055A', 41))], field: [22] },
      { st: 2, sec: 24, t: 'Start the secondary air fan (SAF)', d: 'Close the secondary air damper (0 %) before starting the fan.', c: R.SAF, a: [btn('SA damper 0 %', () => A.man('FICFA1081', 0)), mot('M.3303', 'SAF')], fps: ['FICFA1081'], field: [23] },
      /* live check #107 (PR-OPE-5002 SAF START-UP: "Adjust SAF Inlet Damper Manually up until combustion air flow increase to 200T/H (You can use
         double arrow but be cautious of the furnace pressure reaction)"): the SA flow by hand to 200 T/H, the IDF coupling with it (-15) */
      { st: 2, sec: 24, t: 'Secondary air fan inlet damper up: secondary air 200 T/H, furnace pressure −15 mmH₂O', d: 'Do: raise the SA damper FICFA1081 (MANUAL) until the secondary air flow is 200 T/H. ▲▲ (+5 %) is allowed, but watch the furnace pressure: when it rises toward positive, raise the IDF coupling PICFG108 (MV ▲); when it is below −25, lower it. The damper is about 34 % at 200 T/H.', c: b.HOLD(10, b.ALL(b.VAL('SA', 185, 215), b.VAL('FP', -25, -5))), fps: ['FICFA1081', 'PICFG108'], a: [btn('SA damper ▲▲ +5 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (5))))), btn('SA damper ▲ +1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (1))))), btn('SA damper ▼ −1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      /* 3.2.0-beta.23: the PAF start interlock DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED" = 0 (DITL-24): a lube oil pump first */
      { st: 2, sec: 25, t: 'Start primary air fan lube oil pump A (DITL-24)', d: 'The primary air fan will not start with no lube oil pump running (DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED"). The pump has no DCS memory on the ABC, so it is started on DITL-24.', c: C('PAF lube oil pump A running (DITL-24)', () => dRun('DITL-24') !== 0, () => (dRun('DITL-24') === 1 ? 'RUNNING' : dRun('DITL-24') === 0 ? 'STOPPED' : '— (one world OFF)')), a: [dmot('DITL-24', 'PAF LO pump A')] },
      { st: 2, sec: 25, t: 'Start the primary air fan (PAF)', d: 'Close the primary air damper (0 %) before starting the fan.', c: R.PAF, a: [btn('PA damper 0 %', () => A.man('FICFA1071', 0)), mot('M.3302', 'PAF')], fps: ['FICFA1071'], field: [24] },
      /* live check #103 / #107 (PR-OPE-5002 PAF START-UP: "Increase PAF Inlet Damper Manually (Use Single Arrow ...). Maintain the Furnace
         pressure to -15mmH2O whilst simultaneously increasing HC Speed of IDF. Target Primary Air Flow: 180T/H = No Bed") */
      { st: 2, sec: 25, t: 'Primary air fan inlet damper up (single arrow): primary air 180 T/H, ID fan coupling up (−15 mmH₂O)', d: 'Do: raise the PA damper FICFA1071 (MANUAL) 1 % at a time (single arrow) until 180 T/H (no bed). At the same time raise the IDF hydraulic coupling PICFG108 (MV ▲) to keep the furnace pressure near −15 mmH₂O. At the end the PA damper is about 18 % and the coupling about 16 % (PA 180 + SA 200 + FA 26 ≈ 406 T/H, above 25 % MCR = 151.5 T/H, DESIGN BASE total air 606 T/H).', c: b.HOLD(10, b.ALL(b.VAL('PA', 170, 195), b.PURGE_AIR, b.VAL('FP', -25, -5))), fps: ['FICFA1071', 'PICFG108'], a: [btn('PA damper ▲ +1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (1))))), btn('PA damper ▼ −1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      { st: 2, sec: 25, t: 'Furnace pressure control PICFG108 in AUTO, SV −15 mmH₂O', d: 'Do: when the hydraulic coupling is at about 16 % and the furnace pressure is steady at about −15 mmH₂O, PICFG108 A, SV −15 (PR-OPE-5002). While the MV is below 14 %, PICFG108 is FORCE MANUAL (ABC-008 M.0205): AUTO is not allowed yet. In AUTO, PICFG108 moves the coupling to hold −15.', c: b.ALL(b.MODE('PICFG108', 'AUTO'), b.SV('PICFG108', -16, -14), b.HOLD(30, b.VAL('FP', -25, -5))), fps: ['PICFG108'], a: [btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('PICFG108 A, SV −15', () => (mv('PICFG108') < 14 ? 'PICFG108 is still FORCE MANUAL (ABC-008 M.0205: IDF coupling < 14 %): raise the MV first' : h().FP() < -25 || h().FP() > -5 ? 'Wait: furnace pressure ' + f0(h().FP()) + ' mmH₂O (must be near −15, −25 ~ −5)' : A.auto('PICFG108', -15)))] },
      /* ---- 3 purge ---- */
      {
        st: 3,
        sec: 26,
        t: 'Purge permissives: all fans running, no coal, no flame, biasing dampers open',
        d: 'These are the conditions of the drawing before the purge starts. RH damper ≥ 30 % and SH damper ≥ 60 %.',
        c: b.ALL(R.IDF, R.SAF, R.FAB, R.PAF, b.NOFEED, b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'no start-up burner'), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null), DW(C('Furnace purge ready (DITL-02 out 10)', () => dOut('DITL-02', 9) === 1, dTxt('DITL-02', 9, 'PURGE READY', 'purge not ready')), b.MFT)),
        fps: ['HICHR1002A', 'HICHR1002B'],
        a: [btn('RH and SH biasing dampers 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))],
        field: [25]
      },
      /* 3.2.0-beta.23: with the one world the purge is the drawing's: DITL-02 row 6 FURNACE PURGE START P.B. -> 5 min -> out 16 FURNACE
         PURGE COMPLETED -> DITL-03A row 21 resets the MFT (I.000F 0) */
      {
        st: 3,
        sec: 26,
        t: 'Furnace purge: 5 minutes',
        d: 'Press FURNACE PURGE START (DITL-02). Hold the air for 5 minutes. If something drops out (a fan stops, the air falls), the count starts again. After 5 minutes, "PURGE COMPLETED" resets the MFT (DITL-03A row 21).',
        c: DW(b.ALL(C('Purge completed, MFT reset (DITL-03A out 13 = 0)', () => dOut('DITL-03A', 12) === 0, () => (dOut('DITL-03A', 12) === 0 ? 'MFT RESET' : dOut('DITL-02', 5) === 1 ? 'purge in progress' : 'MFT, purge not started')), b.MFT), b.HOLD(300, b.ALL(R.IDF, R.PAF, R.SAF, b.PURGE_AIR, b.NOFEED))),
        a: [btn('FURNACE PURGE START (DITL-02)', () => dPress('DITL-02', 5), () => dOut('DITL-02', 5) === 1 || dOut('DITL-03A', 12) === 0)],
        /* live check #106: the alarms that come out of the suppression in the purge (10 min after the fans of their group run) */
        note: 'Alarms that come in during the purge (10 min after the fans run, the suppression is over): AI0273 / AI0433 flue gas O₂ HIGH-HIGH (ABC-002, AT-FG1122 / 1123: 21 % because only air passes, no flame; HH 8 %) and AI0656 / AI0672 PA preheater outlet air temperature LOW-LOW (ABC-006, TT-FA1076 / 1077: the air is still cold). These are correct during the purge: ACK them. The O₂ HIGH-HIGH clears by itself once there is a flame (it falls to 3.5 ~ 8 %), and the temperature alarm when the preheater warms up.',
        wait: 1
      },
      { st: 3, sec: 26, t: 'Biasing dampers: RH 10 %, SH 90 %', d: 'After the purge, most of the flue gas goes to the SH side first.', c: b.ALL(b.MV('HICHR1002A', 5, 15), b.MV('HICHR1002B', 85, 95)), fps: ['HICHR1002A', 'HICHR1002B'], a: [btn('RH 10 %, SH 90 %', () => (A.man('HICHR1002A', 10), A.man('HICHR1002B', 90)))] },
      /* ---- 4 burners and warm-up ---- */
      { st: 4, sec: 28, t: 'Light burner A', d: 'SA damper and oil FCV to ignition, then BURNER ON (DITL-09): the DITL inserts the igniter, opens the two supply oil valves and lights the burner (DITL-10 / 13). Once there is a flame, set the oil flow FICDO1043A to 60 %.', c: b.ALL(b.BIT('M.3412', 1, 'burner A in service'), b.VAL('oilF', 0.3, null)), fps: ['FICDO1043A'], get a() {
          return WL() ? [bIgn('A'), bOn('A'), bOil('A', 60)] : [btn('Open oil valve A', () => A.oil('M.3410', true)), btn('BURNER A ON', () => A.motor('M.3412', 1), () => bit('M.3412') > 0.5), btn('FICDO1043A M 60 %', () => A.man('FICDO1043A', 60))];
        }, field: [27] },
      { st: 4, sec: 28, t: 'Light burner D (diagonal to A)', d: 'PR-OPE-5002: after A, the next one is D (diagonal). Same as burner A: SA damper and oil FCV to ignition, BURNER ON (the DITL opens the oil valve), then FICDO1043D 60 %.', c: b.ALL(b.BIT('M.3419', 1, 'burner D in service'), b.MV('FICDO1043D', 50, null)), fps: ['FICDO1043D'], get a() {
          return WL() ? [bIgn('D'), bOn('D'), bOil('D', 60)] : [btn('Open oil valve D', () => A.oil('M.3417', true)), btn('BURNER D ON', () => A.motor('M.3419', 1), () => bit('M.3419') > 0.5), btn('FICDO1043D M 60 %', () => A.man('FICDO1043D', 60))];
        } },
      { st: 4, sec: 28, t: 'Air to minimum: PA and SA dampers 10 %', d: 'Reduce the air after light-off so the furnace does not cool down (total air stays > 25 % MCR, PR-OPE-5002 5240). At the same time lower the IDF coupling so the furnace pressure does not fall to PSLL −267 mmH₂O (MFT).', c: b.ALL(b.MV('FICFA1071', null, 12), b.MV('FICFA1081', null, 12)), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA and SA MV 10 %, IDF coupling PICFG108 MV 18 %', () => (A.man('FICFA1071', 10), A.man('FICFA1081', 10), md('PICFG108') === 'MAN' && A.man('PICFG108', 18)))] },
      { st: 4, sec: 28, t: 'Warm-up: wait for the water to boil (100 °C)', d: 'You control the firing: the temperature rise is ≤ 110 °C per hour (FHI Fig 1). Watch the "Heating rate": below 85 °C/h, oil ▲ +5 %; above 100 °C/h, oil ▼ −5 %. Speed up the simulation if you want.', c: b.VAL('Tw', 100, null), fps: ['FICDO1043A', 'FICDO1043D'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5)], w: WARM, wait: 1 },
      { st: 4, sec: 28, t: 'Drum pressure 2 kg/cm²: close the vents and drains (field)', d: 'Once there is pressure, the field operator closes the vents and drains of the steam side.', c: b.VAL('Pd', 2, null), wait: 1, field: [] },
      { st: 4, sec: 28, t: 'Drum pressure 15 kg/cm²: light burners B and C', d: 'At 15 kg/cm² the other two burners are added: SA damper and oil FCV to ignition, BURNER ON (the DITL opens the oil valve), then FICDO1043B / C 20 % (PR-OPE-5002: B / C after 30 minutes).', c: b.ALL(b.VAL('Pd', 15, null), b.BURN4), fps: ['FICDO1043B', 'FICDO1043C'], get a() {
          return WL() ? [bIgn('B'), bIgn('C'), bOn('B'), bOn('C'), bOil('B', 20), bOil('C', 20)] : [btn('Open oil valves B and C', () => (A.oil('M.3411', true), A.oil('M.3416', true))), btn('BURNER B and C ON', () => (A.motor('M.3413', 1), A.motor('M.3418', 1)), () => bit('M.3413') > 0.5 && bit('M.3418') > 0.5), btn('FICDO1043B / C M 20 %', () => (A.man('FICDO1043B', 20), A.man('FICDO1043C', 20)))];
        } },
      /* 3.2.0 P1 #3 (PR-OPE-5002 7259: "Turbine Main Steam Motorized isolation valve (MVMS1391) is necessary to be Equalized and OPENED during
         boiler pressurization at around 20~30 ksc"): no steam reaches the MSV (ATS 1.3) and the turbine with it shut */
      {
        st: 4,
        sec: 28,
        t: 'Main steam MOV: equalizing MV-MS1392 OPEN, then MV-MS1391 OPEN (20 ~ 30 kg/cm²)',
        d: 'PR-OPE-5002: at 20 ~ 30 kg/cm² of main steam, slowly open the turbine inlet equalizing MOV MV-MS1392 (5 ~ 10 minutes for the pressure and temperature to equalize; watch the drum level), then open the main steam MOV MV-MS1391. While it is closed, no steam reaches the MSV and the turbine.',
        c: b.ALL(b.VAL('Pd', 20, null), mcvC('MV-MS1391 open', () => mcvPos('MV-MS1391') >= 100)),
        a: [mcvB('MV-MS1392', 1), mcvB('MV-MS1391', 1)]
      },
      { st: 4, sec: 28, t: 'Drum pressure 30 kg/cm²', d: 'Wait for 30 kg/cm². You still control the heating rate (≤ 110 °C/h, oil ▲ / ▼). Oil firing goes only up to 30 ~ 35 kg/cm² (PR-OPE-5002: the coal takes it from there).', c: b.VAL('Pd', 30, null), fps: ['FICDO1043A', 'FICDO1043B'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], w: WARM, wait: 1 },
      /* 3.2.0-beta.40 (roadmap 2, Cold run stall at "Bypass servicing"): PR-OPE-5002 STEAM DRUM FILLING "Ensure MS BLOW OFF VALVE (BOV)
         >10 % OPEN" and BYPASS SYSTEM SERVICING "Gradually close MS Blow off valve ... transfer steam flow to RH": the MS blow-off is
         open through the warm-up and the turbine auxiliaries, and the start-up valve keeps the drum level. Before (beta.37 ~ 39) this
         step came after the vacuum up: a closed boiler on 4 oil burners went 30 -> 131 kg/cm2 while the TCS auxiliaries were done, the
         drum level fell to -422 mm (no feed), the low-low level tripped the oil (MFT) and the bypass step waited forever (steam 0) */
      {
        st: 4,
        sec: 28,
        t: 'Pressure and level: start-up level LICBR1001B AUTO SV 0, MS blow-off PICMS1002 AUTO SV 35',
        d: 'PR-OPE-5002: the MS blow-off valve is open (≥ 10 %) during the warm-up. The blow-off (PICMS1002) holds the main steam pressure at 35 kg/cm² while the TCS auxiliaries and the vacuum are done, and the start-up valve (LICBR1001B) holds the drum level. Coal comes only after the sync (FHI Fig. 2): oil burners only up to 45 MW.',
        c: b.ALL(b.MODE('LICBR1001B', 'AUTO'), b.MODE('PICMS1002', 'AUTO')),
        fps: ['LICBR1001B', 'PICMS1002'],
        a: [btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0)), btn('PICMS1002 A, SV 35', () => A.auto('PICMS1002', 35))]
      },
      /* ---- 5 vacuum and seals ---- */
      /* 3.2.0-beta.37 (user 2026-10-25): the aux steam (from the main steam > 12 kg/cm2), the turning gear, the gland sealing and the
         ejectors before the vacuum up (PR-OPE-5002 5708, 6118, 6512); the unit model raises the vacuum only with the aux steam */
      FIELD(5, 'Deaerator warming, condensate polisher, bed material (field)', [28, 29, 30, 31, 32, 33, 34, 35], { d: 'Field operator tasks with no DCS / TCS signal. The aux steam, turning gear, gland sealing and vacuum up are on the TCS panel (next steps).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the turbine auxiliaries on the TCS model (tcs.js): ATS criteria 1.14 ~ 1.19, PR-OPE-5002 5708 / 6118
         / 6512. Before (beta.37) one "field" confirm */
      /* all-steps check 2026-10-30: the section of each turbine step is the PR-OPE-5002 section that does it (14 lube oil / vapour
         extractor, 33 gland sealing with the turning gear, 35 vacuum up; the aux steam stays 31); the practice steps are section 47 */
      { st: 5, sec: 14, t: 'TCS: lube oil pump, EH oil pump, MOT vapour extractor START', d: 'Bearing oil (ATS 1.15 / 1.16), control oil (1.14) and the vapour extractor (1.18) are needed before the turning gear and all ATS steps.', c: C('Lube oil, EH oil, vapour extractor running', () => TC().aux.lop && TC().aux.eh && TC().aux.vex, () => ['lop', 'eh', 'vex'].filter(k => !TC().aux[k]).join(', ') || 'OK'), a: [btn('LUBE OIL PUMP START', () => A.tcs('lop', 1), () => TC().aux.lop), btn('EH OIL PUMP START', () => A.tcs('eh', 1), () => TC().aux.eh), btn('VAPOUR EXTRACTOR START', () => A.tcs('vex', 1), () => TC().aux.vex)] },
      { st: 5, sec: 33, t: 'Turning gear ON (about 3 rpm)', d: 'The rotor turns slowly so it does not bend while it warms up (ATS 1.19 TURBINE TURNING). Bearing oil is needed.', c: C('Turbine turning (≥ 1 rpm)', () => TC().aux.tg && TC().rpm >= 1, () => f1(+TC().rpm || 0) + ' rpm'), a: [btn('TURNING GEAR ON', () => A.tcs('tg', 1), () => TC().aux.tg)] },
      { st: 5, sec: 31, t: 'Aux steam: open MV-AS1391 (main steam > 12 kg/cm²)', d: 'The aux steam header (10 kg/cm²) comes from the main steam (PR-OPE-5002 5727 REQUIREMENT: MS > 12 kg/cm²). It is the steam for the gland seal and the ejectors.', c: C('Aux steam header > 10 kg/cm²', () => TC().Pa > 10, () => f1(+TC().Pa || 0) + ' kg/cm²'), a: [btn('MV-AS1391 OPEN', () => A.tcs('aux', 1), () => TC().aux.asv)], wait: 1 },
      { st: 5, sec: 33, t: 'Gland sealing (aux > 7 kg/cm², turning gear, vacuum breaker open)', d: 'PR-OPE-5002 6118: MS > 12, aux > 7 kg/cm², gland steam 220 °C, turning gear running, vacuum breaker MV-AV1391 open (ATS 1.10).', c: C('Gland steam seal header normal', () => TC().aux.gland, () => (TC().aux.gland ? 'in service' : 'off')), a: [btn('GLAND STEAM IN SERVICE', () => A.tcs('gland', 1), () => TC().aux.gland)] },
      { st: 5, sec: 35, t: 'Vacuum up: close the vacuum breaker, ejectors (aux > 10 kg/cm²)', d: 'PR-OPE-5002 6512: gland sealing done, aux > 10 kg/cm², vacuum breaker MV-AV1391 closed, 1st and 2nd ejector (on the DCS: MV-AV1391 CLOSE on DITL-56, then MV-AS1396 and MV-AS1395 OPEN on DITL-55 / 54). About 15 minutes to reach ≥ 90 % (ATS 1.11).', c: b.ALL(C('Condenser vacuum ≥ 90 %', () => +U().vac >= 0.9, () => f0(100 * (+U().vac || 0)) + ' %'), C('LP exhaust hood spray FVCD1904 AUTO (PR-OPE-5002 6307)', () => !!TC().aux.hsp, () => (TC().aux.hsp ? 'AUTO' : 'OFF'))), a: [movB('DITL-56', 'MV-AV1391', 0, 3, 13), movB('DITL-55', 'MV-AS1396', 1, 4, 13), movB('DITL-54', 'MV-AS1395', 1, 4, 13), btn('VACUUM UP (ejectors)', () => A.tcs('vacuum', 1), () => TC().aux.ej), btn('Hood spray FVCD1904 AUTO', () => A.tcs('hood', 1), () => !!TC().aux.hsp)], wait: 1 },
      /* ---- 6 bypass at 61 kg/cm2, oil only (3.2.0-beta.37, CHECKLIST 0.5: PR-OPE-5002 BYPASS SYSTEM SERVICING -> TURBINE ROLLING ->
         SYNCH. & INITIAL LOAD -> LOAD UP -> solid fuel; FHI SECT_7 Fig. 2 COLD STARTUP: roll at 60 kg/cm2 6 h, coal 8.6 h. Before, the
         coal and 123 kg/cm2 came before the roll and the bypass dumped 155 ~ 189 T/H) ---- */
      /* 3.2.0-beta.37: before the roll, on oil (CHECKLIST 0.5). 3.2.0-beta.23: the bypass goes in service BEFORE the coal (PR-OPE-5002: BYPASS SYSTEM SERVICING comes before the solid fuel
         firing). Before, it came after the burners were out: the blow-off alone (about 13 T/H at 35 kg/cm2) could not take the steam of
         the coal and the pressure went over 140 kg/cm2 (172 with the primary air at 280 T/H and the coal that follows it) */
      {
        st: 6,
        sec: 30,
        t: 'Bypass in service: HP bypass A, LP bypass A SV 7.6, RH blow-off M 20 %',
        d: 'The HP bypass (PICMS1006) holds the main steam pressure, the LP bypass (PICHR1003) the reheat pressure at 7.6 kg/cm². HP bypass SV = the pressure now.',
        c: b.ALL(b.MODE('PICMS1006', 'AUTO'), b.MODE('PICHR1003', 'AUTO')),
        fps: ['PICMS1006', 'PICHR1003', 'PICHR1391'],
        a: [btn('Set all', () => {
          /* 3.2.0-beta.38: the SV at the pressure of now (the step text), not 61 under it: at 85 kg/cm2 the bypass opened full and the
             drum level went to -300 mm (MFT, Cold run) */
          const p = Math.max(50, Math.ceil(h().MSP()));
          A.auto('PICMS1002', p > 50 ? p + 5 : 50);
          A.auto('PICMS1006', p);
          A.auto('PICHR1003', 7.6);
          A.man('PICHR1391', 20);
          A.auto('LICBR1001B', 0);
          /* 3.2.0 P1 #5: the spray water block valves of the HP / LP bypass desuperheaters in AUTO MODE (DITL-79 XV-FW1061 M.0582, DITL-66
             XV-CD1114 M.0522): the DITL opens them on the demand of TICMS1022 / TICHR1012; shut, no spray water reaches the bypass steam */
          if (WL()) ['DITL-79', 'DITL-66'].forEach(n => window.LS_DOCK && LS_DOCK.dset && LS_DOCK.dset(n, 4, 1));
          return '';
        })],
        field: [29]
      },
      { st: 6, sec: 30, t: 'Bypass servicing: MSP ≥ 48 kg/cm² and steam flow ≥ 40 T/H', d: 'Do: raise the oil firing until steam flow is 40 ~ 55 T/H, trim the air, then raise the HP bypass SV up to 61. (1) Oil firing up (oil ▲) until steam flow is 40 ~ 55 T/H, (2) air: O₂ 3.5 ~ 8 % with the SA damper (SA ▲ / ▼), PA flow 280 T/H once the bed is hot (PA ▲ / ▼), (3) when the HP bypass is in service (MSP ≥ 48, steam ≥ 40), raise the HP bypass PICMS1006 SV by 1 kg/cm² per minute up to 61.', c: b.ALL(b.VAL('MSP', 48, null), b.VAL('MSF', 40, null)), fps: ['PICMS1006', 'FICFA1081', 'FICFA1071'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5), step('SA damper ▲ +2 %', 'FICFA1081', 2), step('SA damper ▼ −2 %', 'FICFA1081', -2), step('PA damper ▲ +1 %', 'FICFA1071', 1), step('PA damper ▼ −1 %', 'FICFA1071', -1), svStep('HP bypass SV +1', 'PICMS1006', 1, 0, 123)], w: BYP, wait: 1 },
      { st: 6, sec: 30, t: 'Main steam pressure 61 kg/cm²: ready to roll', d: 'PR-OPE-5002 (cold start): MS 61.2 kg/cm², steam flow > 40 T/H, reheat ≤ 8.5 kg/cm². The HP bypass holds 61 (SV +1 per minute) and the LP bypass holds the reheat; you control the oil for 40 ~ 55 T/H.', c: b.HOLD(120, b.ALL(b.VAL('MSP', 59, null), b.VAL('MSF', 40, null), b.VAL('RHP', null, 9))), fps: ['PICMS1006'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), svStep('HP bypass SV +1', 'PICMS1006', 1, 0, 61), svStep('HP bypass SV −1', 'PICMS1006', -1, 0, 123)], w: BYP, wait: 1 },
      /* ---- 7 turbine on oil ---- */
      FIELD(7, 'Field checks before the roll: drains, TCS lamps, turbine area (field)', [36, 37, 38, 39], { d: 'Field operator tasks. The ATS steps are on the TCS panel (next steps).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the ATS steps of the TCS model (tcs.js; ATS Sequence 310SC90-775, Criteria 310SC90-776). Before
         (beta.37) one ROLL button: 0 -> 3600 rpm in 30 min with no criteria */
      { st: 7, sec: 41, t: 'ATS step 0: HP TURBINE WARMING', d: 'ATS page 13: when the HP first stage metal is ≤ 150 °C, steam at the CV (B) warms it until > 150 °C. Needed: gland seal, vacuum, bearing oil, turning gear (CRITERIA A0).', c: C('HP turbine warming done (HP metal > 150 °C)', () => TC().step >= 0, () => 'HP metal ' + f0(+TC().Thp || 0) + ' °C' + (TC().cur === 0 ? ', warming' : '')), a: [btn('HP TURBINE WARMING', () => A.tcs('warm'), () => TC().cur === 0 || TC().step >= 0)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 1: TURBINE PREPARATION (CV chest warming, reset, MSV open)', d: 'ATS page 14 ~ 16: when the CV chest is ≤ 150 °C, CV chest warming for 60 minutes (or diff < 50 °C and outer > 180 °C), then TURBINE RESET, MSV OPEN, LOAD LIMITER UPPER.', c: C('Turbine preparation done', () => TC().step >= 1, () => 'CV chest ' + f0(+TC().Tcvi || 0) + ' / ' + f0(+TC().Tcvo || 0) + ' °C' + (TC().cur === 1 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' min' : '')), a: [btn('TURBINE PREPARATION', () => A.tcs('prep'), () => TC().cur === 1 || TC().step >= 1)], wait: 1 },
      { st: 7, sec: 41, t: 'Steam for the roll: MS 60 kg/cm² / 400 ~ 420 °C, RH 7.5 kg/cm² / 415 ~ 425 °C', d: 'PR-OPE-5002 8254 COLD START-UP: MS 60 kg/cm², 400 °C; RH 7.5 kg/cm², 415 °C. ATS Fig. 2 / 3: with cold metal, MSV inlet ≤ 420 °C and reheat ≤ 425 °C. You control the main steam temperature with the SH spray TICBR1150 (MV ▲ / ▼) and the reheat with the biasing damper (RH damper HICHR1002A ▲ / ▼).', c: C('CRITERIA A2 (rub check) ready', () => TC().cur < 0 && !TC().next, () => TC().next || 'OK'), fps: ['TICBR1150', 'HICHR1002A'], a: [step('SH spray ▲ +2 %', 'TICBR1150', 2), step('SH spray ▼ −2 %', 'TICBR1150', -2), step('RH damper ▲ +5 %', 'HICHR1002A', 5), step('RH damper ▼ −5 %', 'HICHR1002A', -5)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 2: TURBINE RUB CHECK (200 rpm, coast < 100 rpm)', d: 'ATS page 17 ~ 18: 200 rpm, CV / ICV closed, the rotor is let to slow down; done when < 100 rpm. The field operator listens for rubbing.', c: C('Rub check done', () => TC().step >= 2, () => f0(+TC().rpm || 0) + ' rpm' + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('RUB CHECK', () => A.tcs('rub'), () => TC().cur === 2 || TC().step >= 2)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 3: ACCELERATION: 1800 rpm heat soak, then 3600 rpm heat soak', d: 'ATS page 19 ~ 22: 120 rpm/min. Ambient cold: 88 minutes at 1800 rpm, then HP metal > 170 °C and shell expansion > 3 mm, then 3600 rpm for 86 minutes. No hold in the critical zone 1372 ~ 1723 rpm.', c: C('Acceleration done (3600 rpm, heat soak)', () => TC().step >= 3, () => f0(+TC().rpm || 0) + ' rpm' + (TC().cur === 3 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' / ' + f0(+TC().soakMin || 0) + ' min' : '') + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('ACCELERATION', () => A.tcs('accel'), () => TC().cur === 3 || TC().step >= 3)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 4: EXCITATION', d: 'ATS page 23: AVR EXCITATION START, generator voltage OK.', c: C('Excitation done', () => TC().step >= 4, () => (TC().cur === 4 ? 'excitation' : '—')), a: [btn('EXCITATION', () => A.tcs('excite'), () => TC().cur === 4 || TC().step >= 4)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 5: SYNCH. & INITIAL LOAD (52G), LP bypass in REMOTE', d: 'ATS page 24 ~ 25: ASD START, 52G closed, initial load 3 % (4.5 MW), hold 40 minutes (Fig. 3). Put the LP bypass in R (SV = first stage + 5.1).', c: b.ALL(b.BIT('I.0931', 1, 'GCB 52G1 on'), b.MODE('PICHR1003', 'REM')), fps: ['PICHR1003'], a: [btn('SYNCH. & INITIAL LOAD', () => A.tcs('sync'), () => bit('I.0931') > 0.5), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      { st: 7, sec: 42, t: 'Initial load hold: 40 minutes, LP exhaust hood < 52 °C', d: 'ATS page 25 Fig. 3: 40 minutes (metal < 230 °C). PR-OPE-5002 9123: hold the initial load until the LP turbine exhaust hood is < 52 °C.', c: C('Initial load hold done and LP exhaust < 52 °C', () => TC().step >= 5 && TC().Tx < 52, () => (TC().cur === 5 ? f0(+TC().tmMin || 0) + ' / ' + (TC().holdMin || 40) + ' min, ' : '') + 'LP exhaust ' + f0(+TC().Tx || 0) + ' °C'), wait: 1 },
      { st: 7, sec: 42, t: 'LOAD UP to 45 MW (TCS), ICV → CV transfer', d: 'On the TCS panel: LOAD UP 45 MW (7.5 MW per minute). The transfer is at 15 ~ 22 MW. While loading: move the feedwater to the main valve (LICBR1001A A SV +50, start-up valve LICBR1001B M, close it 5 % per minute, LICBR1001 M 0 %). After the transfer, close the LP bypass PICHR1003 (M, −10 % per minute) until the preset clears (M.070F = 0), then R.', c: b.ALL(b.BIT('I.0418', 1, 'ICV to CV transfer complete'), b.VAL('MW', 15, null)), fps: ['LICBR1001B', 'LICBR1001A', 'PICHR1003'], a: [btn('LOAD UP 45 MW (TCS)', () => A.tcs('loadup', 45), () => U().tb && U().tb.st === 'load'), btn('Feedwater to main valve: LICBR1001A A SV +50, LICBR1001B M, LICBR1001 M 0 %', () => (A.man('LICBR1001B', mv('LICBR1001B')), A.auto('LICBR1001A', 50), A.man('LICBR1001', 0), '')), step('Start-up valve LICBR1001B ▼ −5 %', 'LICBR1001B', -5), step('LP bypass PICHR1003 ▼ −10 %', 'PICHR1003', -10), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      {
        st: 7,
        sec: 42,
        t: 'Feedwater 3-ELEMENT: FICFW1007 R, LICBR1001 A, press 3-ELEMENT',
        d: 'When feedwater is > 110 T/H and the force manual is gone (M.0228 = 0), switch to 3-element: the feedwater follows the steam flow and the drum level.',
        c: b.ALL(b.VAL('FW', 100, null), b.MODE('FICFW1007', 'REM'), b.MODE('LICBR1001', 'AUTO'), b.BIT('M.0222', 0, 'single element')),
        fps: ['FICFW1007', 'LICBR1001'],
        ready: () => h().FW() > 110 && bit('M.0228') < 0.5,
        readyTxt: () => 'Wait: feedwater ' + f0(h().FW()) + ' T/H (> 110) and M.0228 = ' + f0(bit('M.0228')) + ' (0)',
        a: [btn('FICFW1007 R', () => A.rem('FICFW1007')), btn('LICBR1001 A, SV 0', () => A.auto('LICBR1001', 0)), btn('3-ELEMENT', () => A.push('M.054E'))]
      },
      /* 3.2.0-beta.24: the MS blow-off to its load SV 128 (4.PNG 148.8 MW: BLOW-OFF A, SV 128, MV 0). The bypass coach left it at the
         HP bypass SV + 5 of the moment its step ended (118 + 5 = 123 in some runs): at 80 MW it opened > 5 % at MSP 123, and its
         M.0255 (ABC-013 -> ABC-001C M.2013 BU-CMD) put the boiler and turbine master back to MANUAL at the CCS handover */
      { st: 7, sec: 42, t: 'HP bypass in REMOTE, HP and LP bypass and MS blow-off closed at 45 MW', d: 'After the transfer, put the HP bypass SV in R (SV = PV + 2): it closes and the turbine takes all the steam. From here the pressure rises with the load (FHI Fig. 2: 61 kg/cm² at 15 % load, 123 at 40 %). The MS blow-off PICMS1002 is AUTO SV 128 (closed; a blow-off open > 5 %, M.0255, is a back-up command of the boiler master).', c: b.ALL(b.VAL('MW', 44, null), b.MODE('PICMS1006', 'REM'), b.BIT('M.0709', 0, 'HP bypass open'), b.BIT('M.0255', 0, 'MS blow-off open'), C('MS blow-off PICMS1002 AUTO, SV ≥ 125 kg/cm²', () => md('PICMS1002') === 'AUTO' && svOf('PICMS1002') >= 125, () => 'PICMS1002 ' + md('PICMS1002') + ' SV ' + f0(svOf('PICMS1002')))), fps: ['PICMS1006', 'PICMS1002'], a: [btn('HP bypass R', () => A.rem('PICMS1006'), () => md('PICMS1006') === 'REM'), btn('PICMS1002 A, SV 128', () => A.auto('PICMS1002', 128))] },
      { st: 7, sec: 42, t: 'Hold 45 MW: MSP ≥ 90 kg/cm², drum level ±150 mm', d: 'NORMAL OPERATION on the TCS. The firing is still oil only; you raise the oil as the pressure rises (Fig. 2: about 98 kg/cm² at 45 MW).', fps: ['FICDO1043A', 'FICDO1043B'], w: BYP, c: b.ALL(C('TCS NORMAL OPERATION (ATS step 7)', () => TC().step >= 7, () => (TC().step >= 7 ? 'OK' : TC().next || 'press NORMAL OPERATION')), b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 90, 131), b.VAL('lvl', -150, 150)))), a: [btn('NORMAL OPERATION (TCS)', () => A.tcs('normal'), () => TC().step >= 7), oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], wait: 1 },
      /* ---- 8 coal at 45 MW (PR-OPE-5002 solid fuel firing) ---- */
      { st: 8, sec: 44, t: 'Bed temperature ≥ 400 °C: coal feeder ready', d: 'Coal burns only on a hot bed.', c: b.VAL('Tb', 400, null), wait: 1 },
      { st: 8, sec: 44, t: 'Batch firing of feeder A up to bed 600 °C', d: 'Do: START feeder A for about 10 seconds, STOP it for about 60 seconds, repeat until the bed is 600 °C (PR-OPE-5002 solid fuel firing). Watch the bed temperature: it rises when the coal burns.', c: C('Bed ≥ 600 °C', () => U().Tb >= 600, () => f0(U().Tb) + ' °C'), a: [fDis('A'), mot('M.3400', 'feeder A')] },
      { st: 8, sec: 44, t: 'Feeder A continuous, FICCL1061A in AUTO, coal demand FIC-CF 10 %', d: 'After 600 °C, feeder A runs continuously. Once it runs, put it in AUTO (the drawing forces it to manual while it is stopped). From here you change over the firing: coal (FIC-CF ▲) for the turbine steam, oil down 5 % per minute to 20 % (PR-OPE-5002: 2.55 T/H coal = 1 T/H diesel), pressure up to 123 kg/cm² (the TCS holds 45 MW). Watch the bed: < 700 °C with no burner = coal trip (DITL-03F).', c: b.ALL(b.BIT('M.3400', 1, 'feeder A running'), b.MODE('FICCL1061A', 'AUTO'), SETmin('FIC-CF', 8)), fps: ['FICCL1061A', 'FIC-CF'], a: [fDis('A'), mot('M.3400', 'feeder A'), btn('FICCL1061A A', () => A.loc('FICCL1061A')), btn('FIC-CF M 10 %', () => A.man('FIC-CF', 10)), step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (all) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL },
      { st: 8, sec: 44, t: 'Feeder B, then FICCL1061B in AUTO', d: 'The second feeder.', c: b.ALL(b.BIT('M.3401', 1, 'feeder B running'), b.MODE('FICCL1061B', 'AUTO')), fps: ['FICCL1061B'], a: [fDis('B'), mot('M.3401', 'feeder B'), btn('FICCL1061B A', () => A.loc('FICCL1061B'))] },
      { st: 8, sec: 44, t: 'Bed ≥ 650 °C: feeder C, then FICCL1061C in AUTO', d: 'The third feeder, once the bed is hot enough.', c: b.ALL(b.VAL('Tb', 650, null), b.BIT('M.3402', 1, 'feeder C running'), b.MODE('FICCL1061C', 'AUTO')), fps: ['FICCL1061C'], a: [fDis('C'), WLm('M.3402', 'feeder C', () => (A.motor('M.3402', 1), A.motor('M.3405', 1))), btn('FICCL1061C A', () => A.loc('FICCL1061C'))] },
      { st: 8, sec: 44, t: 'Main steam pressure 123 kg/cm² at 45 MW', d: 'Coal is now the main fuel; the oil burners stay at 20 % up to about 60 % load (FHI Fig. 2). Raise the coal (FIC-CF ▲ / ▼) to 123 kg/cm² (the PIC-COBM SV in CCS); watch the bed (> 700 °C).', c: b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), fps: ['FIC-CF'], a: [step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (all) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL, wait: 1 },
      /* ---- 9 load up ---- */
      {
        st: 9,
        sec: 44,
        t: 'Prepare the combustion control: HS-COAL 33.1 %, O₂ trim 50 %, PA bias 0, FIC-CF A',
        d: 'Coal calorie correction 4150 kcal/kg = 33.1 %. The O₂ trim and PA bias are neutral before the air goes to REMOTE. FIC-CF goes to A at its PV (no bump).',
        c: b.ALL(b.MV('HS-COAL', 32, 34), b.MODE('FIC-CF', 'AUTO')),
        fps: ['HS-COAL', 'FIC-CF'],
        a: [btn('Prepare all', () => {
          A.man('HS-COAL', 33.1);
          A.val('HIC-TADBS', 0);
          A.auto('FIC-CF', pv('FIC-CF'));
          return '';
        })]
      },
      { st: 9, sec: 44, t: 'PA and SA air flow in REMOTE (FICFA1071, FICFA1081)', d: 'The air now follows the air demand of the drawing.', c: b.ALL(b.MODE('FICFA1071', 'REM'), b.MODE('FICFA1081', 'REM')), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA and SA R', () => (A.rem('FICFA1071'), A.rem('FICFA1081')))] },
      { st: 9, sec: 44, t: 'FIC-CF in REMOTE', d: 'The coal feeder demand now comes from the coal master.', c: b.MODE('FIC-CF', 'REM'), fps: ['FIC-CF'], a: [btn('FIC-CF R', () => A.rem('FIC-CF'))] },
      {
        st: 9,
        sec: 44,
        t: 'Coal master FIC-CM in REMOTE',
        d: 'The drawing allows it when M.0130 = 0 (FIC-CF, PA, SA in REMOTE). Press R when the fuel demand (SI0141) ≈ the coal now.',
        c: b.MODE('FIC-CM', 'REM'),
        fps: ['FIC-CM'],
        ready: () => bit('M.0130') < 0.5 && Math.abs(h().val('ABC-004A', 'SI0141') - pv('FIC-CM')) < 1.5,
        readyTxt: () => 'Wait: M.0130 = ' + f0(bit('M.0130')) + ', fuel demand ' + f1(h().val('ABC-004A', 'SI0141')) + ' ≈ coal ' + f1(pv('FIC-CM')) + ' T/H',
        a: [btn('FIC-CM R', () => A.rem('FIC-CM'))]
      },
      {
        st: 9,
        sec: 44,
        id: 'bm',
        t: 'Boiler master HIC-BM in AUTO (boiler follow)',
        d: 'When steam flow is > 230 T/H and the back-up command is gone (M.2013 = 0): PIC-COBM A SV 123, HS-COAL R, then HIC-BM A. M.2013 is also 1 while the MS blow-off PICMS1002 (M.0255) or the HP bypass (M.0709) is open > 5 %: lower HIC-BM until the pressure falls below 128.',
        c: b.MODE('HIC-BM', 'AUTO'),
        fps: ['PIC-COBM', 'HIC-BM', 'PICMS1002'] /* OFF unless switched on: boiler follow by hand on HIC-BM (the faceplate) */,
        ready: () => h().MSF() > 230 && bit('M.2013') < 0.5,
        readyTxt: () =>
          'Wait: steam flow ' + f0(h().MSF()) + ' T/H (> 230), M.2013 = ' + f0(bit('M.2013')) + ' (0)' + (h().bit('ABC-001C', 'M.0255') > 0.5 ? ': blow-off PICMS1002 open (M.0255 = 1, MSP ' + f1(h().MSP()) + ')' : '') + (bit('M.0709') > 0.5 ? ': HP bypass open (M.0709 = 1)' : ''),
        a: [btn('PIC-COBM A, SV 123', () => A.auto('PIC-COBM', 123)), btn('HS-COAL R', () => A.rem('HS-COAL')), btn('HIC-BM A', () => A.auto('HIC-BM'))]
      },
      {
        st: 9,
        sec: 44,
        t: 'O₂ control AICFG112 in AUTO',
        d: 'Allowed when steam flow is > 220 T/H (M.0101) and PV ≈ SV.',
        c: b.MODE('AICFG112', 'AUTO'),
        fps: ['AICFG112'],
        ready: () => bit('M.0101') > 0.5,
        readyTxt: () => 'Wait: steam flow > 220 T/H (M.0101 = ' + f0(bit('M.0101')) + ')',
        a: [btn('AICFG112 A', () => {
          const H = h(),
            S2 = H.sh('ABC-002'),
            c = H.ctl('ABC-002', 'AICFG112'),
            q = S2.rt.st[c.amt.id];
          q.al = c.autoLeg;
          q.fm = c.autoLeg;
          for (const [S3, n] of AN.modeNets('AICFG112')) S3.rt.ext[n] = 0;
          return '';
        })]
      },
      {
        st: 9,
        sec: 44,
        id: 'tm',
        req: ['bm'],
        t: 'Turbine master EIC-TM in AUTO (coordinated control, CCS)',
        d: 'DCS CONTROL MODE ON comes on by itself (I.0082). Press A when the AUTO value (SI0236) ≈ the TCS target, so there is no bump.',
        c: b.MODE('EIC-TM', 'AUTO'),
        fps: ['EIC-TM'],
        ready: () => bit('I.0082') > 0.5 && bit('M.2016') < 0.5 && Math.abs(h().val('ABC-001C', 'SI0236') - (+U().tcsT || 0)) < 1,
        readyTxt: () => 'Wait: DCS control mode I.0082 = ' + f0(bit('I.0082')) + ', SI0236 ' + f1(h().val('ABC-001C', 'SI0236')) + ' ≈ TCS target ' + f1(+U().tcsT),
        a: [btn('EIC-TM A', () => A.auto('EIC-TM'))]
      },
      /* roadmap 2 (PR-OPE-5002 8043 "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV"; 39.PNG at 150 MW:
         HICHR1002A / B A, TICHR1002A R, TICHR1002 A SV 541). ABC-020: the RH damper is forced MANUAL while the SH damper is MANUAL and under
         15 % MCR (M.0179), so the SH damper first. ABC-019: the RH spray is forced MANUAL while its shut-off valve is shut (M.0173, I.088F;
         DITL-35 opens it in AUTO MODE above saturation + 11 C after the ICV -> CV transfer). Without this step the reheat went to 593 C */
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Reheat temperature in AUTO: SH and RH biasing dampers A, TICHR1002A A (SV: LOGIC), RH spray TICHR1002 A SV 541',
        d: 'PR-OPE-5002: "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV". The "Remote" of TICHR1002A is SV: LOGIC (SV from MW, LN6, with a bumpless ramp of 1 %/min). Do the SH damper (HICHR1002B) first: while it is MANUAL, the RH damper is forced MANUAL (ABC-020 M.0179, together with steam flow < 15 % MCR). The RH spray allows AUTO once its shut-off valve is open (DITL-35).',
        c: b.ALL(b.MODE('HICHR1002B', 'AUTO'), b.MODE('HICHR1002A', 'AUTO'), C('TICHR1002A AUTO, SV: LOGIC (LN6, MW → reheat SV)', () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A'), () => md('TICHR1002A') + (svLogic('ABC-020', 'TICHR1002A') ? ', SV: LOGIC' : ', SV: OPERATOR')), b.MODE('TICHR1002', 'AUTO')),
        fps: ['HICHR1002B', 'HICHR1002A', 'TICHR1002A', 'TICHR1002'],
        ready: () => bit('I.0418') > 0.5 && h().MSF() >= 69 && !(h().bit('ABC-019', 'I.088F') > 0.5),
        readyTxt: () => 'Wait: ICV → CV transfer I.0418 = ' + f0(bit('I.0418')) + ', steam ' + f0(h().MSF()) + ' T/H (≥ 69), RH spray shut-off valve ' + (h().bit('ABC-019', 'I.088F') > 0.5 ? 'closed' : 'open'),
        a: [
          btn('SH damper HICHR1002B A', () => A.auto('HICHR1002B'), () => md('HICHR1002B') === 'AUTO'),
          btn('RH damper HICHR1002A A', () => A.auto('HICHR1002A'), () => md('HICHR1002A') === 'AUTO'),
          btn('TICHR1002A A, SV: LOGIC', () => A.rem('TICHR1002A'), () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A')),
          btn('TICHR1002 A, SV 541', () => A.auto('TICHR1002', 541), () => md('TICHR1002') === 'AUTO')
        ]
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Unit load demand HIC-ULD in AUTO, TARGET 150 MW',
        d: 'The CCS now raises the load at 3 MW per minute (HIC-MWRL).',
        c: b.ALL(b.MODE('HIC-ULD', 'AUTO'), b.VAL('MW', 90, null)),
        fps: ['HIC-ULD'],
        a: [btn('HIC-ULD A, TARGET 150', () => {
          A.loc('HIC-ULD');
          const s = station('HIC-ULD'),
            d = s && (s.T.drv[s.b.i[s.b.svI]] || []).find(z => z.k === 'AMT');
          if (d) s.T.rt.ext[d.a] = 150;
          return '';
        })]
      },
      {
        st: 9,
        req: ['bm', 'tm'],
        sec: 44,
        t: 'Load ≥ 90 MW, bed > 700 °C and PA flow ≥ 220 T/H: take the burners out one by one (A, D, B, C)',
        d: 'FHI Fig. 2: the start-up burners are taken out at about 60 % load; PR-OPE-5002: start at furnace > 700 °C, finish at > 750 °C. When the coal can carry the load, close the oil valve and stop the burner, a few minutes apart. Before the last burner is stopped, the PA flow must be above 200 T/H: on coal only, the boiler trips on PRIMARY AIR FLOW L.L. (ABC-007, DITL-03F). Procedure target: 280 T/H.',
        c: b.ALL(b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'start-up burners out'), b.VAL('Tb', 700, null), C('PA flow ≥ 220 T/H (FIFA1071)', () => pv('FICFA1071') >= 220, () => (pv('FICFA1071') || 0).toFixed(0) + ' T/H')),
        ready: () => pv('FICFA1071') >= 220 && h().MW() >= 90,
        readyTxt: () => 'Wait: load ' + f0(h().MW()) + ' MW (≥ 90), PA ' + f0(pv('FICFA1071')) + ' T/H (≥ 220)',
        get a() {
          return WL()
            ? [bOff('A'), bOff('D'), bOff('B'), bOff('C')]
            : [
                btn('Stop burner A', () => (A.oil('M.3410', false), A.motor('M.3412', 0)), () => bit('M.3412') < 0.5),
                btn('Stop burner D', () => (A.oil('M.3417', false), A.motor('M.3419', 0)), () => bit('M.3419') < 0.5),
                btn('Stop burner B', () => (A.oil('M.3411', false), A.motor('M.3413', 0)), () => bit('M.3413') < 0.5),
                btn('Stop burner C', () => (A.oil('M.3416', false), A.motor('M.3418', 0)), () => bit('M.3418') < 0.5)
              ];
        },
        retract: 1
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Furnace pressure PICFG108 in AUTO, SV −15',
        d: 'Allowed when MV ≥ 16 % and the force manual is gone (M.0205 = 0).',
        c: b.MODE('PICFG108', 'AUTO'),
        fps: ['PICFG108'],
        /* 3.2.0-beta.23: M.0205 read on ABC-008, the sheet that computes it (a linked copy on a sheet that is not stepping kept 1 and the
           step never opened with the one world OFF) */
        ready: () => mv('PICFG108') >= 16 && !(h().bit('ABC-008', 'M.0205') > 0.5),
        readyTxt: () => 'Wait: PICFG108 MV ' + f0(mv('PICFG108')) + ' % (≥ 16), M.0205 = ' + f0(h().bit('ABC-008', 'M.0205') > 0.5 ? 1 : 0),
        a: [btn('PICFG108 A, SV −15', () => A.auto('PICFG108', -15))]
      },
      { st: 9, sec: 44, req: ['bm', 'tm'], t: 'Hold 150 MW: MSP 118 ~ 128, MST ≤ 545 °C, drum level ±150 mm, O₂ 3 ~ 6 %', d: 'Start-up complete. The CCS is now in control.', c: b.X2[9][1], wait: 1 },
      /* ---- 10 practice ---- */
      { st: 10, sec: 47, t: 'Practice: lower HIC-ULD to 120 MW (▼▼)', d: 'In AUTO you move only the target MW. The CCS reduces the coal and the air.', c: b.OUT('HIC-ULD', null, 121, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Watch: 120 MW, coal about 72 T/H, MSP held', d: 'MW falls by 3 MW per minute and PIC-COBM holds 123 kg/cm².', c: b.HOLD(120, b.ALL(b.VAL('MW', 117, 123), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), wait: 1 },
      { st: 10, sec: 47, t: 'Return HIC-ULD to 150 MW (▲▲)', d: 'Raise the target again.', c: b.OUT('HIC-ULD', 149, null, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Hold 150 MW', d: 'MSP 118 ~ 128, drum level ±150 mm, O₂ 3 ~ 6 %.', c: b.HOLD(300, b.ALL(b.VAL('MW', 147, 153), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150), b.VAL('O2', 3, 6))), wait: 1 }
    ];
    ST = ST.flat();
    ST.forEach((s, i) => (s.i = i));
    return ST;
  }

  /* ---------- the run: the open step, the latch (kept in this browser) ---------- */
  const KEY = 'ls-guide';
  const rd = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      return null;
    }
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ cur: G.cur, hold: G.hold, mine: G.mine, pw: G.pw, on: G.on }));
    } catch (e) {}
  };
  const G = Object.assign({ cur: 0, on: false, mine: {}, hold: {} }, rd() || {});
  const since = {};
  /* the coaches of older versions are not brought back (user 2026-10-29, #108) */
  delete G.coach;
  /* the plant has to be in the simulation (RUN, ABC engine) for a step to count */
  /* the plant runs: ABC RUN, or the DITL page simulating with the one world ON (it steps the ABC sheets and the plant, world.js) */
  const live = () =>
    !!(
      window.AN &&
      AN.sheets &&
      AN.unit &&
      AN.unit.on &&
      (AN.cat === 'an' ? AN.run && !AN.view : typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE) && window.WORLD && WORLD.on && WORLD.live)
    );
  /* the step's condition, the field confirmation, the hold time */
  function stepOk(s) {
    /* a FIELD card needs the operator's confirmation; the field items shown on a DCS step are for reading only */
    if (s.need && !G.mine[s.i]) return false;
    if (!s.c) return !!G.mine[s.i] && preOk(s);
    let ok = false;
    try {
      ok = s.c.ok();
    } catch (e) {}
    if (!ok) {
      delete since[s.i];
      return false;
    }
    if (s.c.hold) {
      if (since[s.i] == null) since[s.i] = simT();
      return simT() - since[s.i] >= s.c.hold;
    }
    return true;
  }
  /* the 6 h before the start-up of a field card (pre), counted in plant time from "Simulan ang 6 h purge" */
  const preOk = s => !s.pre || !G.pw || G.pw[s.i] == null || simT() - G.pw[s.i] >= s.pre;
  function preStart(i) {
    G.pw = G.pw || {};
    G.pw[i] = simT();
    G.mine[i] = 1;
    save();
  }
  const holdOf = s => (s.pre && G.pw && G.pw[s.i] != null ? [Math.max(0, simT() - G.pw[s.i]), s.pre] : null) || (s.c && s.c.hold && since[s.i] != null ? [Math.max(0, simT() - since[s.i]), s.c.hold] : null);
  /* the steps opened */
  function open(i) {
    const s = steps()[i];
    if (!s) return;
    G.cur = i;
    G.ok = null;
    save();
  }
  /* every step of the plant (AN.onStep): the heating rate, the pushbutton release; every second: the latch */
  const onStep = dt => {
    if (!G.on || !live()) return;
    {
      const t = simT(),
        H = RATE.h;
      if (!H.length || t - H[H.length - 1][0] >= 60 || t < H[H.length - 1][0]) {
        if (H.length && t < H[H.length - 1][0]) H.length = 0;
        H.push([t, +U().Tw || 0]);
        while (H.length > 6) H.shift();
      }
    }
    for (const a in PUSH)
      if (simT() >= PUSH[a]) {
        h().setx(null, a, 0);
        delete PUSH[a];
      }
  };
  const hook = () => window.AN && (AN.onStep = onStep);
  hook();
  /* check the open step; returns true when it moved on */
  function scan() {
    if (!G.on) return false;
    const L0 = steps(),
      s = L0[G.cur];
    if (!s) return false;
    /* 3.2.0 walkthrough #16: a field card (no DCS condition) is confirmed by the operator: it moves on while PAUSED too (retest #5: not
       while its 6 h purge is still counting) */
    if (!live()) {
      if (s.need && !s.c && stepOk(s)) return done(s);
      return false;
    }
    /* 3.2.0-beta.24: a station that a BU-CMD of the drawing put back to MANUAL after its step (HIC-BM / EIC-TM: M.2013 / M.2016,
       CLAUDE.md 10) stays MANUAL until the operator presses A: the guide goes back to that step, so its card says why and what to do */
    for (const r of s.req || []) {
      const j = L0.findIndex(x => x.id === r);
      if (j >= 0 && j < G.cur && !stepOk(L0[j])) {
        open(j);
        return true;
      }
    }
    if (stepOk(s)) return done(s);
    if (G.ok === G.cur) G.ok = null;
    return false;
  }
  /* 3.2.0 retest #30: a step that is done waits for the trainee ("✓ Tapos" and its result, then "Susunod ›"); a test tool sets autoNext */
  function done(s) {
    if (API.autoNext) {
      open(G.cur + 1);
      return true;
    }
    G.ok = G.cur;
    return false;
  }
  function next() {
    if (G.ok !== G.cur) return false;
    G.ok = null;
    open(G.cur + 1);
    return true;
  }
  /* out of order: a motor of a later step already running (the operator started it in the Plant view or the Logic) */
  function early() {
    const L0 = steps(),
      out = [];
    for (let i = G.cur + 1; i < L0.length && out.length < 3; i++)
      for (const a of L0[i].a || [])
        if (a.stop && a.on && a.on() && !(L0[G.cur].a || []).some(x => x.l === a.l) && !out.includes(a.l.replace(/^START /, ''))) {
          /* the same pump may be one of the choices of this or an earlier step */
          let before = false;
          for (let j = 0; j <= G.cur; j++) if ((L0[j].a || []).some(x => x.l === a.l)) before = true;
          if (!before) out.push(a.l.replace(/^START /, ''));
        }
    return out;
  }
  /* start: the plant cold, RUN, step 1 */
  function start(done) {
    /* 3.2.0 retest #54 (user 2026-10-28: the page froze over 1 min, no loading sign): the cold plant loads in slices with a progress
       bar (hmi-op.js anLoadStart), then the training starts */
    const go = () => {
      AN._gdWait = 0;
      const ld = AN.loadStart
        ? AN.loadStart('cold', true)
        : Promise.resolve().then(() => {
            if (!AN.plantOn && AN.plantSwitch) AN.plantSwitch(true, true);
            AN.reset();
            AN.plantCold();
            AN.startState = 'plantCold';
          });
      AN._startPending = 0;
      ld.catch(() => {}).then(go2);
    };
    const go2 = () => {
      try {
        AN.settle();
        AN.paint();
      } catch (e) {}
      /* retest #9: the AUTO ticks start clean from the cold plant (none from the plant of before the load) */
      try {
        if (L() && L().reset) L().reset();
      } catch (e) {}
      for (const k in since) delete since[k];
      hook();
      G.on = true;
      G.mine = {};
      G.pw = {};
      G.cur = 0;
      HH = null;
      /* the sheets the steps operate that may not be linked to the sheet on the screen: stepped too (links.js actSet) */
      AN.checkSheets = ['ABC-001C', 'ABC-002', 'ABC-003A', 'ABC-003B', 'ABC-003C', 'ABC-003D', 'ABC-004A', 'ABC-005', 'ABC-007', 'ABC-008', 'ABC-010', 'ABC-011', 'ABC-012', 'ABC-013', 'ABC-020', 'ABC-028', 'ABC-031', 'ABC-032', 'ABC-050', 'ABC-052', 'ABC-054']
        .concat(steps().flatMap(s => (s.fps || []).map(t => shOf(L().ctlTag(t) || t)).filter(Boolean)))
        .filter((x, i, a) => a.indexOf(x) === i);
      /* 3.2.0 walkthrough #1: the start-up begins at t = 0 (the clock of the sheets counted the settling of the cold state: t = 11:29) and
         PAUSED (simulation on, time stopped, 1x): the field steps come first and the trainee presses RUN. Before: RUN at once, x10 */
      try {
        for (const sh of AN.sheets)
          if (sh.S && sh.S.rt) {
            const rt = sh.S.rt;
            rt.t = 0;
            sh._hs = [];
            for (const k in rt.pm || {}) if (rt.pm[k] && Array.isArray(rt.pm[k].h)) rt.pm[k].h = [];
            for (const k in rt.st || {}) if (rt.st[k] && Array.isArray(rt.st[k].h)) rt.st[k].h = [];
          }
      } catch (e) {}
      open(0);
      if (AN.pauseOn) AN.pauseOn();
      if (done) done();
    };
    try {
      AN._cold0 = 1;
      /* retest #59: no starting-state question until this load has started */
      AN._startPending = 1;
      AN._gdWait = 1;
      if (AN.cat !== 'an') AN.setCat('an');
    } catch (e) {}
    let k = 0;
    const iv = setInterval(() => {
      const ok = AN.cat === 'an' && AN.sheets && AN.sheets.length >= 54 && AN.plantCold && window.CHECK;
      if (ok || ++k > 160) {
        clearInterval(iv);
        if (ok) go();
        else AN._startPending = AN._gdWait = 0;
      }
    }, 250);
  }
  /* continue after a reload: the plant is not saved, so the training goes on only with a plant in the simulation */
  function resume() {
    if (!AN.checkSheets || !AN.checkSheets.length) AN.checkSheets = ['ABC-001C', 'ABC-020', 'ABC-028', 'ABC-031', 'ABC-032', 'ABC-054'];
    hook();
    G.on = true;
    if (AN.runOn) AN.runOn();
    save();
  }
  function stop() {
    G.on = false;
    save();
  }
  /* the field confirmation of a step */
  function confirm(i) {
    G.mine[i] = 1;
    G.ok = null;
    if (G.pw) delete G.pw[i];
    save();
  }
  /* every action of the open step (the "Do it for me" of a newbie, and the test) */
  function doIt() {
    const s = steps()[G.cur];
    if (!s) return;
    if (s.need) confirm(s.i);
    if (s.ready && !s.ready()) return;
    if (s.retract) {
      /* one burner every 3 minutes of the plant, above 700 C */
      if (U().Tb < 700) return;
      if (G.retT != null && simT() - G.retT < 180) return;
      const nx = (s.a || []).find(a => !a.on());
      if (nx) {
        nx.f();
        G.retT = simT();
      }
      return;
    }
    /* again after a minute of the plant when the step is still not done (a value the drawing held while the machine was stopping) */
    if (G.did === s.i && simT() - (G.didT || 0) < 60) return;
    for (const a of s.a || []) if (!a.on || !a.on()) a.f();
    G.did = s.i;
    G.didT = simT();
  }
  const API = {
    autoNext: false,
    next,
    ready: () => G.ok === G.cur,
    steps,
    STAGES,
    start,
    resume,
    stop,
    scan,
    stepOk,
    holdOf,
    confirm,
    preStart,
    doIt,
    early,
    fieldOf,
    live,
    open,
    A,
    h,
    get cur() {
      return G.cur;
    },
    get on() {
      return G.on;
    },
    mine: () => G.mine
  };
  return API;
})();
