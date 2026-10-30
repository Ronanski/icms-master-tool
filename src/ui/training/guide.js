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
  const svStep = (l, t, d, lo, hi) => Object.assign(btn(l, () => (md(t) === 'AUTO' ? A.auto(t, Math.max(lo, Math.min(hi, Math.round((+svOf(t) || 0) + d)))) : 'Nasa ' + md(t) + ' ang ' + t + ': ilagay muna sa A')), { tag: t });
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
  const STAGES = ['Utilities', 'Tubig: hotwell, deaerator, drum', 'Fans at draft', 'Furnace purge', 'Burner at pag-init', 'Vacuum at seals', 'Bypass at 61 kg/cm²', 'Turbine: roll, sync, 45 MW', 'Coal sa 45 MW', 'Load up sa 150 MW', 'Practice: load change'];
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
    ['Bilis ng pag-init (5 min)', rate, '°C/h', f1w, 'SOP ≤ 110 (Fig 1)'],
    ['Drum pressure', () => +U().Pd, 'kg/cm²', f1w, ''],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  const BYP = [
    ['Main steam pressure', () => h().MSP(), 'kg/cm²', f1w, 'SV ng HP bypass'],
    ['Main steam flow', () => h().MSF(), 'T/H', f1w, 'SOP 40 ~ 55'],
    ['Reheat pressure', () => h().RHP(), 'kg/cm²', f1w, '≤ 8.5'],
    ['Flue gas O₂', () => h().O2(), '%', f1w, '3.5 ~ 8'],
    ['Bilis ng pag-init (5 min)', rate, '°C/h', f1w, 'SOP ≤ 110'],
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
    const FIELD1 = (st, title, secs, extra) => Object.assign({ st, field: secs, need: 1, t: title, d: 'Ang mga ito ay ginagawa ng field operator (lokal na valve, gauge, panel). Walang DCS signal ang mga ito, kaya kumpirmahin lang kapag tapos na.' }, extra || {});
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
      ['SWP running', () => swpN() + ' / 3', '', x => x, 'kailangan 2 (ang ikatlo: standby AUTO)'],
      ...SWPL.map((l, j) => [l + ' current (IIP1501' + 'ABC'[j] + ')', () => uv('swIa' + j), 'A', f1w, 'SOP 205 ~ 215']),
      /* live test beta.74 #35 #36: the SWP discharge (local gauge) and the forebay, plant model, the same number as the HMI 030 */
      ['SWP discharge, running (PG-SW1501)', () => Math.max(0, ...['M.3353', 'M.3354', 'M.3355'].map((a, j) => (bit(a) ? uv('swPd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4'],
      ['Forebay level (LISW1501)', () => +U().swLvl, 'm', f1w, 'SOP NL −4 m (4 m below GL)'],
      ['SWP header / condenser inlet (PISW1110A1)', () => uv('swPiA'), 'kg/cm²', f1w, 'SOP 1.0 ~ 1.1'],
      ['Condenser SW outlet A / B (PISW1110A2 / B2)', () => f1w(uv('swPoA')) + ' / ' + f1w(uv('swPoB')), 'kg/cm²', x => x, 'HMI 30.PNG 0.4 / 0.5'],
      ['Condenser SW ΔP A / B', () => f1w(uv('swPiA') - uv('swPoA')) + ' / ' + f1w(uv('swPiB') - uv('swPoB')), 'kg/cm²', x => x, 'SOP ≥ 0.4']
    ];
    const BPW = [
      ['SWBP running', () => bpN() + ' / 3', '', x => x, 'kailangan 2 (ang ikatlo: standby REMOTE + AUTO)'],
      ...['A', 'B', 'C'].map((l, j) => ['SWBP-' + l + ' current (IIP1503' + l + ')', () => uv('swIb' + j), 'A', f1w, 'SOP 90 · alarm 120']),
      ['SWBP suction', () => uv('swBs0'), 'kg/cm²', f1w, 'SOP 1 ~ 1.1'],
      ['SWBP discharge, running (PG-SW1503)', () => Math.max(0, ...BPD.map((nm, j) => (dRun(nm) === 1 ? uv('swBd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4']
    ];
    /* #12: the standby of a pump set (not running): FIELD I-REMOTE (local selector), then AUTO (CRT selection, row au); AUTO refused while LOCAL */
    const stbyB = (D, Lb, au, isRun) =>
      D.flatMap((nm, j) => [
        Object.assign(btn('FIELD: I-REMOTE ' + Lb[j] + ' (standby)', () => (window.LS_DOCK && LS_DOCK.dremote(nm, Lb[j]), ''), () => remOf(nm)), { loc: 1, hide: () => isRun(j) || remOf(nm) }),
        Object.assign(
          btn('AUTO ' + Lb[j] + ' (standby)', () => (!remOf(nm) ? 'LOCAL pa ang ' + Lb[j] + ': FIELD I-REMOTE muna (SOP: "in remote position"), saka AUTO.' : window.LS_DOCK && LS_DOCK.dsel(nm, au, 1, Lb[j] + ' AUTO MODE SELECTED') && ''), () => locRun(nm, au) === 1),
          { dg: [nm, au], sel: 1, auto: 1, hide: () => isRun(j) }
        )
      ]);
    const runW = (l, L, cur, unit, hint) => [[l + ' running', () => L.filter(f => f()).length + ' / ' + L.length, '', x => x, hint || ''], [l + ' ' + (unit === 'A' ? 'current' : 'discharge press'), () => ifRun(L.some(f => f()), cur), unit, null, '']];
    ST = [
      /* ---- 0 utilities ---- */
      /* 3.2.0 walkthrough #5: PR-OPE-5002 ESP "purge air heater and fan ... 6 hours prior to start-up": confirmed when already 6 h in service,
         or held 6 h of plant time from the card (pre) */
      FIELD(0, 'ESP purge air heater at fan (field), 6 oras bago ang start-up', [0], { pre: 21600, d: 'Gawin: "Simulan ang 6 h purge", saka ▶ RUN (kusa ang ×300, balik ×1 sa 6:00). SOP: pinapaandar ng field operator ang ESP purge air heater at fan 6 ORAS BAGO ang start-up. Bukas ang "Tapos na ang 6 h purge" pagka-6:00; kung 6 h na itong tumatakbo sa field, "Laktawan ang 6 h (training shortcut)" (may kumpirmasyon at log sa Events).' }),
      /* 3.2.0 retest #49: any two of the three SWP (was: a first and a second SWP step, the second showed the third pump to start) */
      { st: 0, sec: 2, it: [0, 32], t: 'Simulan ang 2 seawater pump (SWP), kahit alin', d: 'Gawin: REMOTE sa field, saka START ng dalawang SWP. Ang ikatlo ay standby.', c: b.SWP2, max: 2, a: [mot('M.3353', 'SWP-A'), mot('M.3354', 'SWP-B'), mot('M.3355', 'SWP-C')], field: [1], w: SWPW },
      {
        st: 0,
        sec: 2,
        it: [33, 34] /* live test 2026-10-30 #13: the two SOP items of this step (was: the 35 items of section 2) */,
        t: 'Ilagay ang standby SWP sa REMOTE at AUTO',
        d: 'Gawin: FIELD I-REMOTE ng hindi tumatakbong SWP, saka AUTO (DITL-29A row 4, AUTO MODE SELECTED). Ito ang aandar kapag nag-trip ang isa; ang AUTO start ng drawing ay kailangan din ng REMOTE (row 5).',
        c: C('2 SWP running at standby SWP sa REMOTE + AUTO', () => !WL() || (swpN() >= 2 && swpStby() >= 0 && swpAuto(swpStby())), () => swpN() + ' running · standby ' + (swpStby() >= 0 ? SWPL[swpStby()] + (remOf(SWPD[swpStby()]) ? ' REM' : ' LOC') + (locRun(SWPD[swpStby()], 3) === 1 ? ' · AUTO' : ' · MAN') : '—')),
        a: stbyB(SWPD, SWPL, 3, j => bit(SWPM[j]) > 0.5),
        runN: swpN,
        field: [1],
        w: SWPW
      },
      /* 3.2.0 retest #32 #33: one step per SOP section 3 ~ 17, the machines started from the DCS or locally (were: two field cards, 135 items) */
      { st: 0, sec: 3, t: 'Simulan ang hypochlorite pump (field)', d: 'Walang DCS command ang hypochlorite pump (ang STN105 DI ay running / overload status lang, hal. P-0762A I.0329): sinisimulan ito ng field operator sa local panel (HCDSP).', c: C('Hypochlorite pump running (field)', () => !!(AN.fieldState && AN.fieldState().hypo), () => 'Hypochlorite pump ' + (AN.fieldState && AN.fieldState().hypo ? 'RUNNING' : 'STOPPED')), a: [fldB('hypo', 'hypochlorite pump')], field: [2], w: [['Hypochlorite pump', () => (fstate('hypo') ? 'RUNNING' : 'STOPPED'), '', x => x, 'local panel']] },
      { st: 0, sec: 4, t: 'Simulan ang SWP outlet debris filter (DITL-39)', d: 'REMOTE AUTO START ng debris filter system 1 sa DCS (DITL-39 row 8). Tumatakbo lang kapag may SWP na tumatakbo.', c: outC('SWP outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 3, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 1 AUTO START (DITL-39)', 'DITL-39', 7, null, () => dOut('DITL-39', 3) === 1)], field: [3], w: [['SWP outlet debris filter', () => (dOut('DITL-39', 3) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 4'], ['SWP running', () => swpN() + ' / 3', '', x => x, 'kailangan ≥ 1']] },
      /* R9 #71: PR-OPE-5002 section 5 starts a 1st and a 2nd SWBP and puts the third on standby AUTO (HMI 030: SWBP-A / C running, B
         standby): two running, as the SWP (was: one, so the SOP item "Initiate START to 2nd selected SWBP" could never tick) */
      /* live test 2026-10-30 #8: PR-OPE-5002 section 5 "Set the standby SWBP to AUTO": DITL-30 row 4 SEAWATER BOOSTER PUMP x AUTO MODE
         SELECTED (CRT, M.1202 / 1212 / 1222; with it the pump starts when a running one trips: B / C RUNNING off-delay 2 s AND TRIP). The step
         is done with 2 running AND the third in AUTO (was: 2 running only, the third stayed MAN) */
      { st: 0, sec: 5, max: 2, sby: 1, t: 'Simulan ang 2 seawater booster pump (SWBP), kahit alin', d: 'Gawin: REMOTE sa field, saka START ng dalawang SWBP (DITL-30). Ang ikatlo ay standby: AUTO (DITL-30 row 4, AUTO MODE SELECTED). Kailangan ang tumatakbong SWP.', c: C('2 SWBP running at standby SWBP sa REMOTE + AUTO (DITL-30)', () => !WL() || (bpN() >= 2 && (bpStby() < 0 || bpAuto(bpStby()))), () => (WL() ? BPD.map((nm, j) => 'ABC'[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED' + (bpAuto(j) ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)')), a: [dmot('DITL-30', 'SWBP-A'), dmot('DITL-30 #B', 'SWBP-B'), dmot('DITL-30 #C', 'SWBP-C')], field: [4], w: BPW },
      { st: 0, sec: 6, t: 'Simulan ang SWBP outlet debris filter (DITL-39)', d: 'REMOTE AUTO START ng debris filter system 2 sa DCS (DITL-39 row 19).', c: outC('SWBP outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 14, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 2 AUTO START (DITL-39)', 'DITL-39', 18, null, () => dOut('DITL-39', 14) === 1)], field: [5], w: [['SWBP outlet debris filter', () => (dOut('DITL-39', 14) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 15']] },
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
          t: 'Simulan ang make-up water pump (MWP) at punuin ang expansion tank',
          d: 'Gawin: START ng isang MWP, REMOTE + AUTO ng standby MWP, saka punuin ang expansion tank hanggang NL 1.7 m (XV-MU1109 o bypass V-MU1033) at isara ang valve. Ang MWP ay nasa DCS (DITL-112). Ang XV-MU1109 (DITL-78) ay pneumatic: bumubukas lang kapag may instrument air (≥ 3.5 kg/cm²); kung wala pa (Cold, bago ang Hakbang 11), ang bypass V-MU1033 ang ginagamit ng field operator. Kailangan ang header > 6.0 kg/cm² para pumasok ang tubig.',
          c: C(
            '1 MWP running, standby MWP REMOTE + AUTO, expansion tank ≥ 1.7 m at sarado ang fill valve' + ' (XV-MU1109 AUTO kung may instrument air)',
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
            Object.assign(btn('XV-MU1109 OPEN (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'Nasa AUTO ang XV-MU1109: MAN muna para buksan.' : !air() ? 'Walang instrument air (IA < 3.5 kg/cm²): hindi bubukas ang XV-MU1109. Gamitin ang bypass V-MU1033 (field).' : (dPress('DITL-78', 4), '')), () => xvOpen() || !air() || byp() || et() >= 1.69), { dg: ['DITL-78', 4] }),
            Object.assign(btn('FIELD: OPEN V-MU1033 (bypass)', () => (byp() ? '' : (bypSet(true), '')), () => byp() || xvOpen() || et() >= 1.69), { loc: 1, fp: 'F:mu1033' }),
            Object.assign(btn('XV-MU1109 CLOSE (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'Nasa AUTO ang XV-MU1109: ang logic ang nagsasara sa 85 % (1.7 m).' : (dPress('DITL-78', 8), '')), () => !xvOpen() || et() < 1.69), { dg: ['DITL-78', 8] }),
            Object.assign(btn('FIELD: CLOSE V-MU1033 (bypass)', () => (byp() ? (bypSet(false), '') : ''), () => !byp() || et() < 1.69), { loc: 1, fp: 'F:mu1033' }),
            Object.assign(btn('XV-MU1109 AUTO / MAN (DITL-78)', () => xvSel(!xvAuto()), () => xvAuto() || !air() || et() < 1.69), { dg: ['DITL-78', 2] })
          ],
          field: [6],
          w: [
            ['MWP running', () => mwN() + ' / 3', '', x => x, 'kailangan 1 + standby AUTO'],
            ...ML.map((l, j) => [l + ' current', () => +U()['muI' + j] || 0, 'A', f1w, 'SOP 20 A · alarm 61.1 A']),
            ['MWP header press (PIMU0709)', () => +U().muP || 0, 'kg/cm²', f1w, 'SOP > 6.0 · alarm 6.5'],
            ['Expansion tank level (LT-CW1109)', () => et(), 'm', x => (+x).toFixed(2), 'NL 1.7 m'],
            ['XV-MU1109', () => (xvOpen() ? 'OPEN' : 'CLOSED') + (xvAuto() ? ' · AUTO' : ' · MAN'), '', x => x, 'DITL-78'],
            ['V-MU1033 bypass', () => (byp() ? 'OPEN' : 'CLOSED'), '', x => x, 'field'],
            ['Instrument air', () => +U().iaP || 0, 'kg/cm²', f1w, '≥ 3.5 para sa XV-MU1109']
          ]
        };
      })(),
      { st: 0, sec: 8, t: 'Simulan ang auxiliary cooling water pump (ACW)', d: 'Ang ACW pump ay nasa DCS (DITL-76 A, DITL-77 B).', c: runC('An aux. cooling water pump running (DITL-76 / 77)', ['DITL-76', 'DITL-77']), a: [dmot('DITL-76', 'ACWP-A'), dmot('DITL-77', 'ACWP-B')] /* 3.2.0-beta.69: the SOP / HMI name (027 boxes the picked ACWP) */, field: [7], w: (() => {
          /* R9 #74: SOP section 9: the discharge valve opened until the pump discharge reaches 7 kg/cm² (PG-CW1108A/B, local gauge);
             the header PICW1152 reads 6.4 at 150 MW (HMI snapshot) */
          const L = ['DITL-76', 'DITL-77'].map(nm => () => dRun(nm) === 1);
          return [
            ['ACW pump running', () => L.filter(f => f()).length + ' / 2', '', x => x, ''],
            ['ACW pump discharge', () => ifRun(L.some(f => f()), 7.0), 'kg/cm²', null, 'PG-CW1108A/B · SOP 7'],
            ['ACW header', () => ifRun(L.some(f => f()), 6.4), 'kg/cm²', null, 'PICW1152 · HMI 6.4']
          ];
        })() },
      { st: 0, sec: 9, t: 'Simulan ang instrument air dryer (DITL-45)', d: 'START ng instrument air dryer A sa DCS (DITL-45 row 15).', c: outC('Instrument air dryer A RUNNING (DITL-45)', 'DITL-45', 14, 'RUNNING', 'STOPPED'), a: [pbB('START instrument air dryer A (DITL-45)', 'DITL-45', 14, 'DITL-45@14', () => dOut('DITL-45', 14) === 1)], field: [8], w: [['IA dryer A', () => (dOut('DITL-45', 14) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 15']] },
      { st: 0, sec: 10, t: 'Simulan ang instrument air compressor (local)', d: 'Sa local panel sinisimulan ang compressor; nakikita sa DCS ang RUNNING (DITL-113 row 6).', c: C('Instrument air compressor A running (DITL-113)', () => !WL() || locRun('DITL-113', 5) === 1, () => 'IA compressor A ' + (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('instrument air compressor A', 'DITL-113', 5)], field: [9], w: [['IA compressor A', () => (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-113 row 6']] },
      { st: 0, sec: 11, t: 'Simulan ang plant air dryer (DITL-45)', d: 'START ng plant air dryer A sa DCS (DITL-45 row 4).', c: outC('Plant air dryer A RUNNING (DITL-45)', 'DITL-45', 3, 'RUNNING', 'STOPPED'), a: [pbB('START plant air dryer A (DITL-45)', 'DITL-45', 3, 'DITL-45@3', () => dOut('DITL-45', 3) === 1)], field: [10], w: [['PA dryer A', () => (dOut('DITL-45', 3) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 4']] },
      { st: 0, sec: 12, t: 'Simulan ang plant air compressor (local)', d: 'Sa local panel sinisimulan ang compressor; nakikita sa DCS ang RUNNING (DITL-114 row 6).', c: C('Plant air compressor A running (DITL-114)', () => !WL() || locRun('DITL-114', 5) === 1, () => 'PA compressor A ' + (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('plant air compressor A', 'DITL-114', 5)], field: [11], w: [['PA compressor A', () => (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-114 row 6']] },
      /* R9 #77 #84 #85 #78: PR-OPE-5002 sections 13 ~ 16, the turbine lube and control oil: one step each with its own purpose and action
         (was: four field cards with the same text "walang DCS signal"). The MOP / COP / vapour extractor are started on the TCS panel
         (tcs.js lop / eh / vex: the oil pressures of the Bantayan), the oil purifier at its local panel; the lube oil temperature control
         TICLO1002 (valve TCVCW1201, ABC) goes to REMOTE */
      {
        st: 0,
        sec: 13,
        need: 1,
        field: [12],
        t: 'Pre-start check ng turbine lube at control oil; TICLO1002 sa AUTO',
        d: 'Gawin: ilagay sa AUTO ang lube oil temperature control TICLO1002 (valve TCVCW1201), tapos pindutin ang "Tapos na ito sa field" kapag tapos ang check. Ang "change mode to Remote" ng SOP: sa drawing ABC-053 walang REMOTE (.REM) ang TICLO1002, kaya ang DCS ang humahawak sa AUTO. Ang TCVCW1201 ang nagpapadaan ng cooling water sa lube oil cooler: sa REMOTE, ang DCS ang humahawak ng oil outlet temperature (average 46 °C, cooling water inlet hanggang 37 °C). Bago paandarin ang oil pumps: puno ang main oil tank (T-n920), sarado ang drains (V-LOn021 / 032), at walang alarm sa TCS.',
        c: C('TICLO1002 (TCVCW1201) hawak ng DCS (AUTO)', () => /AUTO|REM/.test(md('TICLO1002')), () => 'TICLO1002 ' + md('TICLO1002')),
        fps: ['TICLO1002'],
        a: [btn('A (AUTO) TICLO1002 · TCVCW1201', () => A.auto('TICLO1002'), () => /AUTO|REM/.test(md('TICLO1002')))],
        w: [['Lube oil temp. control', () => md('TICLO1002'), '', x => x, 'TICLO1002 · AUTO (REMOTE ng SOP)']]
      },
      {
        st: 0,
        sec: 14,
        field: [13],
        t: 'Simulan ang vapour extractor at ang main oil pump (MOP) sa TCS',
        d: 'Gawin: START ang vapour extractor, tapos START ang isang main oil pump (MOP, P-n922A/B) sa TCS panel. Ang vapour extractor ang humihigop ng singaw ng langis sa main oil tank (vacuum −20 ~ −50 mmH₂O sa PGLO1920). Ang MOP ang nagbibigay ng lube oil (5.6 ~ 6.6 kg/cm²g) sa bearings ng turbine at generator; kailangan ito bago ang turning gear. Bearing oil (PGLO1008) dapat > 1.05 kg/cm²g: sa ≤ 1.05 aandar ang emergency oil pump (EOP).',
        c: C('Vapour extractor at MOP tumatakbo (TCS)', () => !!(TC().aux.vex && TC().aux.lop), () => 'vapour extractor ' + (TC().aux.vex ? 'RUNNING' : 'STOPPED') + ', MOP ' + (TC().aux.lop ? 'RUNNING' : 'STOPPED')),
        a: [btn('START vapour extractor (TCS)', () => A.tcs('vex', 1), () => !!TC().aux.vex), btn('START main oil pump MOP (TCS)', () => A.tcs('lop', 1), () => !!TC().aux.lop)],
        w: [
          ['MOT vacuum', () => (TC().oil || {}).vac, 'mmH₂O', f1, 'PGLO1920 · −20 ~ −50'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-n922 · 5.6 ~ 6.6'],
          ['Bearing oil pressure', () => (TC().oil || {}).brg, 'kg/cm²g', x => (isFinite(x) ? (+x).toFixed(2) : '—'), 'PGLO1008 · > 1.05']
        ]
      },
      {
        st: 0,
        sec: 15,
        field: [14],
        t: 'Simulan ang oil purifier pump (local)',
        d: 'Gawin: i-drain ang tubig (V-LO1223), buksan ang inlet valves (V-LOn201, V-LOn205), tapos START ang oil purifier pump (P-n941) sa local panel. Nililinis ng purifier ang lube at control oil (tubig at dumi); discharge pressure mga 2.96 kg/cm². Puwede itong tumakbo nang tuloy-tuloy o paminsan-minsan.',
        c: C('Oil purifier pump running (local)', () => fstate('pur'), () => 'Oil purifier pump ' + (fstate('pur') ? 'RUNNING' : 'STOPPED')),
        a: [fldB('pur', 'oil purifier pump')],
        w: [['Oil purifier pump', () => (fstate('pur') ? 'RUNNING' : 'STOPPED'), '', x => x, 'P-n941'], ['Purifier discharge', () => (fstate('pur') ? 2.96 : 0), 'kg/cm²', f1, '~ 2.96']]
      },
      {
        st: 0,
        sec: 16,
        field: [15],
        t: 'Simulan ang control oil pump (COP) sa TCS',
        d: 'Gawin: kapag normal ang lube oil pressure ng MOP, START ang isang control oil pump (COP, P-n931A/B) sa TCS panel. Ang control oil (133 ~ 163 kg/cm²g) ang nagpapagalaw sa MSV, RSV, CV at ICV ng turbine; kailangan ito bago ang ATS. Ang mga pump sa AUTO ay kusang aandar: MOP kapag ≤ 5.6, COP kapag ≤ 133, EOP kapag bearing oil ≤ 1.05.',
        c: C('Control oil pump COP tumatakbo (TCS)', () => !!TC().aux.eh, () => 'COP ' + (TC().aux.eh ? 'RUNNING' : 'STOPPED')),
        a: [btn('START control oil pump COP (TCS)', () => (TC().aux.lop ? A.tcs('eh', 1) : ''), () => !!TC().aux.eh)],
        w: [
          ['Control oil pressure', () => (TC().oil || {}).ctl, 'kg/cm²g', f1, 'P-n931 · 133 ~ 163'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-n922 · 5.6 ~ 6.6']
        ]
      },
      { st: 0, sec: 17, t: 'Simulan ang rotary air pre-heater (DITL-43)', d: 'Gawin: FIELD NOT TRIP kapag may ✕ sa interlock, saka START ng air preheater (DITL-43). Ang air preheater ay umiikot na rotor (Ljungstrom) na nagpapainit ng PA at SA gamit ang flue gas. Pinapaandar ito bago ang mga fan para pantay ang init ng rotor at hindi ito mabaluktot. Hindi ito aandar kapag walang AIR PREHEATER NOT TRIP (I.0651, DITL-43 row 5) o kapag LOCAL ang switch sa field.', c: runC('Air preheater running (DITL-43)', ['DITL-43']), a: [dmot('DITL-43', 'air preheater')], field: [16], w: [['Air preheater', () => (dRun('DITL-43') === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-43 out 3']] },
      /* ---- 1 water ---- */
      FIELD(1, 'Hotwell filling line-up (field)', [17]),
      { st: 1, sec: 18, t: 'Hotwell level control LCV-MU1110 sa AUTO', d: 'Ang make-up valve na ang hahawak ng level ng hotwell ng condenser.', c: b.MODE('LCV-MU1110', 'AUTO'), fps: ['LCV-MU1110'], a: [btn('A (AUTO)', () => A.auto('LCV-MU1110'))] },
      { st: 1, sec: 18, t: 'Condensate recirculation FCV-CD1120: MANUAL, MV 60 %', d: 'Bukas muna ang recirculation para may daloy ang condensate pump pagsimula nito.', c: b.ALL(b.MODE('FCV-CD1120', 'MAN'), b.MV('FCV-CD1120', 55, 65)), fps: ['FCV-CD1120'], a: [btn('M, MV 60 %', () => A.man('FCV-CD1120', 60))] },
      { st: 1, sec: 18, t: 'Simulan ang condensate pump (CEP)', d: 'Ang CEP ang nagpapadala ng tubig mula sa hotwell papunta sa deaerator. Kailangan din ito sa vacuum mamaya.', c: R.CEP, a: [mot('M.3350', 'CEP-A'), mot('M.3351', 'CEP-B')] },
      { st: 1, sec: 18, t: 'FCV-CD1120 sa AUTO, SV 150 T/H', d: 'Ang recirculation na ang hahawak ng minimum flow ng CEP.', c: b.ALL(b.MODE('FCV-CD1120', 'AUTO'), b.SV('FCV-CD1120', 140, 160, 'T/H')), fps: ['FCV-CD1120'], a: [btn('A, SV 150 T/H', () => A.auto('FCV-CD1120', 150))] },
      { st: 1, sec: 19, t: 'Deaerator level LCV-CD1104 sa AUTO, SV 0 mm', d: 'Pupunuin ang deaerator hanggang normal level at hahawakan ito ng valve.', c: b.ALL(b.MODE('LCV-CD1104', 'AUTO'), b.SV('LCV-CD1104', -20, 20, 'mm')), fps: ['LCV-CD1104'], a: [btn('A, SV 0 mm', () => A.auto('LCV-CD1104', 0))], field: [18] },
      { st: 1, sec: 20, t: 'Simulan ang boiler feedwater pump (BFWP)', d: 'Ang BFWP ang magpupuno ng steam drum. Kailangan munang may tubig ang deaerator.', c: R.BFP, a: [mot('M.3343', 'BFWP-A'), mot('M.3344', 'BFWP-B')] },
      /* 3.2.0 P1 #4 (PR-OPE-5002 BFP start-up 4165 / 4176): the feedwater reaches the drum only through the discharge MOV of the pump */
      {
        st: 1,
        sec: 20,
        t: 'BFWP discharge: equalizing MOV MV-FW1391 OPEN, tapos main discharge MOV MV-FW1001 OPEN',
        d: 'Gawin: OPEN MV-FW1391, tapos OPEN MV-FW1001; kapag bukas na nang 100 % ang MV-FW1001, CLOSE MV-FW1391 (hindi tatapos ang hakbang habang bukas pa ang MV-FW1391). PR-OPE-5002: dahan-dahang buksan ang equalizing MOV ng napiling BFP (MV-FW1391 / MV-FW1392) para pumantay ang pressure. Kapag discharge pressure > 200 kg/cm², buksan ang main discharge MOV (MV-FW1001 / MV-FW1002) nang 100 %, tapos isara ang equalizing MOV. Sarado ang dalawa: walang feedwater na makakarating sa drum.',
        c: mcvC('Main discharge MOV open, equalizing MOV closed', () => (mcvPos('MV-FW1001') >= 100 && mcvPos('MV-FW1391') <= 0) || (mcvPos('MV-FW1002') >= 100 && mcvPos('MV-FW1392') <= 0)),
        a: [mcvB('MV-FW1391', 1), mcvB('MV-FW1001', 1), mcvB('MV-FW1391', 0)]
      },
      /* 3.2.0 walkthrough #7: the cold drum is not filled (hmi-op.js AN_COLD_DRUM); PR-OPE-5002 STEAM DRUM FILLING: FCV-FW1130-2 MANUAL, opened
         gradually, drum level -150 mm. The trainee closes the valve at -150 mm */
      { st: 1, sec: 20, t: 'Steam drum filling: start-up valve FCV-FW1130-2 sa MANUAL, punuin hanggang −150 mm', d: 'Wala pang tubig ang drum ng cold plant (mga −300 mm). Habang tumatakbo ang BFWP, buksan nang dahan-dahan ang start-up valve (MANUAL, MV 20 %). Kapag −150 mm na, ikaw ang magsasara (MV 0 %) para hindi umapaw.', c: b.ALL(b.MODE('FCV-FW1130-2', 'MAN'), b.MV('FCV-FW1130-2', null, 2), b.HOLD(10, b.VAL('lvl', -200, 100))), fps: ['FCV-FW1130-2'] /* OFF unless switched on */, a: [btn('M, MV 20 % (punuin)', () => (h().lvl() < -170 ? A.man('FCV-FW1130-2', 20) : ''), () => h().lvl() >= -170 || mv('FCV-FW1130-2') >= 15), btn('MV 0 % (sa −150 mm)', () => (h().lvl() >= -170 ? A.man('FCV-FW1130-2', 0) : ''), () => h().lvl() >= -170 && mv('FCV-FW1130-2') <= 2)], field: [19] },
      /* ---- 2 fans ---- */
      { st: 2, sec: 21, t: 'Diesel oil pump at oil circulation (field)', d: 'Gawin: (1) PCV-DO0002 M, 100 % (bukas ang recirculation), (2) FIELD START ng diesel oil pump, (3) PCV-DO0002 M, 24 % (isara nang unti-unti, tataas ang pressure), (4) kapag malapit na sa SV ang PICDO0005 (≥ 11.5 kg/cm²): PICDO0005 A, SV 12.8, (5) PCV-DO1009 (return) M, 86 % (isara nang kaunti, tataas ang PICDO1008), (6) kapag malapit na sa SV ang PICDO1008 (≥ 9.9 kg/cm²): PICDO1008 (PCV-DO1009) A, SV 11. Ang diesel oil pump ay nasa field (walang DCS signal); kailangan ito ng mga start-up burner (PR-OPE-5002 Section 21).', fps: ['PICDO0005', 'PICDO1008'], c: b.ALL(C('Diesel oil pump running (field)', () => !!(AN.fieldState && AN.fieldState().dop), () => 'Diesel oil pump ' + (AN.fieldState && AN.fieldState().dop ? 'ON' : 'OFF')), C('PICDO0005 ≥ 11.5 kg/cm² (malapit sa SV 12.8)', () => pv('PICDO0005') >= 11.5, () => 'PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm²'), b.MODE('PICDO0005', 'AUTO'), C('PICDO1008 ≥ 9.9 kg/cm² (malapit sa SV 11)', () => pv('PICDO1008') >= 9.9, () => 'PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm²'), b.MODE('PICDO1008', 'AUTO')), a: [btn('PCV-DO0002 M, 100 % (bukas)', () => A.man('PICDO0005', 100)), fldB('dop', 'diesel oil pump'), btn('PCV-DO0002 M, 24 %', () => A.man('PICDO0005', 24)), btn('PICDO0005 A, SV 12.8', () => (pv('PICDO0005') >= 11.5 ? A.auto('PICDO0005', 12.8) : 'Hintayin muna: PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm² (kailangan ≥ 11.5)')), btn('PCV-DO1009 M, 86 %', () => A.man('PICDO1008', 86)), btn('PICDO1008 (PCV-DO1009) A, SV 11', () => (pv('PICDO1008') >= 9.9 ? A.auto('PICDO1008', 11) : 'Hintayin muna: PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm² (kailangan ≥ 9.9)'))], field: [20] },
      { st: 2, sec: 22, t: 'Ihanda ang IDF: PICFG108 sa MANUAL, MV 0 %, biasing damper RH at SH bukas', d: 'Sarado ang hydraulic coupling ng IDF bago ito simulan (mababang starting current). Ang interlock ng IDF (DITL-25A row 1) ay humihingi ng bukas na flue gas bias damper (HICHR1002A / B) para may daanan ang hangin.', c: b.ALL(b.MODE('PICFG108', 'MAN'), b.MV('PICFG108', null, 2), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null)), fps: ['PICFG108', 'HICHR1002A', 'HICHR1002B'], a: [btn('M, MV 0 %', () => A.man('PICFG108', 0)), btn('Biasing damper RH at SH 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))], field: [21] },
      { st: 2, sec: 22, t: 'Simulan ang ID fan (IDF)', d: 'Ang IDF ang humihigop ng flue gas palabas ng furnace. Ito ang unang fan na tumatakbo.', note: 'Mga alarm ng malamig na planta: AI0128 / AI0385 drum pressure LOW LOW (wala pang pressure), AI0592 economizer inlet temperature LOW LOW (malamig pa ang feedwater), LIBR10011 / LIBR10012 / LIBR10013 drum level LOW (LOW −100 mm, LOW LOW −178 mm ayon sa alarm list). Sa simula ng cold start-up, naka-SUPPRESS sila: hindi sila nasa header, nakahiwalay sa alarm list (ALARM chip, "suppressed"). Lalabas sila bilang bagong alarm (i-ACK) kapag nakatayo pa rin 10 min (oras ng planta) pagkatapos tumakbo ang kagamitan ng kanilang grupo; kusang mawawala kapag umakyat ang pressure, temperatura at level.', c: R.IDF, a: [mot('M.3304', 'IDF')] },
      { st: 2, sec: 22, t: 'IDF hydraulic coupling: PICFG108 MV 13 %', d: 'Buksan ang coupling sa 13 %. Negatibo ang furnace pressure (hinihigop palabas); target mga −15 mmH₂O. Kung masyadong negatibo, ibaba ang MV ng 1 %; kung kulang, itaas ng 1 %.', c: b.ALL(R.IDF, b.MV('PICFG108', 10, 16)), fps: ['PICFG108'], a: [btn('MV 13 %', () => A.man('PICFG108', 13)), btn('MV −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('MV +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1)))] },
      /* 3.2.0-beta.23: the FAB start permissive FCD READY (DITL-28A row 5 <- 28B out 77 = ABC-014 M.3115 inlet FCD demand at 25 % AND
         DITL-28C the silencer SOV opened); without the one world the step is done at once (the DITL is not running) */
      {
        st: 2,
        sec: 23,
        t: 'Ihanda ang FAB: buksan ang silencer SOV, FAB inlet damper FICFA1055A M 25 %',
        d: 'Ang interlock ng FAB (DITL-28A row 5 FCD READY) ay humihingi ng bukas na "TO SILENCE SOV" (DITL-28C, OPEN P.B.) at ng inlet damper demand na 25 % (ABC-014).',
        c: b.ALL(b.MODE('FICFA1055A', 'MAN'), b.MV('FICFA1055A', 20, 30), C('Silencer SOV opened (DITL-28C)', () => dOut('DITL-28C', 21) !== 0, () => 'SOV ' + (dOut('DITL-28C', 21) === 1 ? 'OPENED' : dOut('DITL-28C', 21) === 0 ? 'sarado' : '— (one world OFF)'))),
        fps: ['FICFA1055A'],
        a: [btn('Silencer SOV OPEN (DITL-28C)', () => dPress('DITL-28C', 0), () => dOut('DITL-28C', 21) !== 0), btn('FICFA1055A M 25 %', () => A.man('FICFA1055A', 25))]
      },
      { st: 2, sec: 23, t: 'Simulan ang fluidizing air blower (FAB)', d: 'Gawin: START FAB-A, tapos itaas ang FAB inlet damper FICFA1055A hanggang 26 T/H ang fluidizing air flow (PR-OPE-5002; mga 41 %). Ang FAB ang nagbibigay ng hangin sa seal pot ng cyclone loop.', c: R.FAB, fps: ['FICFA1055A'], a: [mot('M.3308', 'FAB-A'), mot('M.3309', 'FAB-B'), btn('FICFA1055A M 41 % (≈ 26 T/H)', () => A.man('FICFA1055A', 41))], field: [22] },
      { st: 2, sec: 24, t: 'Simulan ang secondary air fan (SAF)', d: 'Sarado (0 %) muna ang SA damper bago simulan ang fan.', c: R.SAF, a: [btn('SA damper 0 %', () => A.man('FICFA1081', 0)), mot('M.3303', 'SAF')], fps: ['FICFA1081'], field: [23] },
      /* live check #107 (PR-OPE-5002 SAF START-UP: "Adjust SAF Inlet Damper Manually up until combustion air flow increase to 200T/H (You can use
         double arrow but be cautious of the furnace pressure reaction)"): the SA flow by hand to 200 T/H, the IDF coupling with it (-15) */
      { st: 2, sec: 24, t: 'SAF inlet damper pataas: secondary air 200 T/H, furnace pressure −15 mmH₂O', d: 'Gawin: itaas ang SA damper FICFA1081 (MANUAL) hanggang 200 T/H ang secondary air flow. Puwede ang ▲▲ (+5 %), pero bantayan ang furnace pressure: kapag umakyat papunta sa positibo, itaas ang IDF coupling PICFG108 (MV ▲); kapag mas mababa sa −25, ibaba ito. Mga 34 % ang damper sa 200 T/H.', c: b.HOLD(10, b.ALL(b.VAL('SA', 185, 215), b.VAL('FP', -25, -5))), fps: ['FICFA1081', 'PICFG108'], a: [btn('SA damper ▲▲ +5 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (5))))), btn('SA damper ▲ +1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (1))))), btn('SA damper ▼ −1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      /* 3.2.0-beta.23: the PAF start interlock DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED" = 0 (DITL-24): a lube oil pump first */
      { st: 2, sec: 25, t: 'Simulan ang PAF lube oil pump A (DITL-24)', d: 'Hindi aandar ang PAF kapag walang tumatakbong lube oil pump (DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED"). Walang DCS memory ito sa ABC, kaya sa DITL-24 ito pinapaandar.', c: C('PAF lube oil pump A running (DITL-24)', () => dRun('DITL-24') !== 0, () => (dRun('DITL-24') === 1 ? 'RUNNING' : dRun('DITL-24') === 0 ? 'STOPPED' : '— (one world OFF)')), a: [dmot('DITL-24', 'PAF LO pump A')] },
      { st: 2, sec: 25, t: 'Simulan ang primary air fan (PAF)', d: 'Sarado (0 %) muna ang PA damper bago simulan ang fan.', c: R.PAF, a: [btn('PA damper 0 %', () => A.man('FICFA1071', 0)), mot('M.3302', 'PAF')], fps: ['FICFA1071'], field: [24] },
      /* live check #103 / #107 (PR-OPE-5002 PAF START-UP: "Increase PAF Inlet Damper Manually (Use Single Arrow ...). Maintain the Furnace
         pressure to -15mmH2O whilst simultaneously increasing HC Speed of IDF. Target Primary Air Flow: 180T/H = No Bed") */
      { st: 2, sec: 25, t: 'PAF inlet damper pataas (single arrow): primary air 180 T/H, IDF coupling pataas (−15 mmH₂O)', d: 'Gawin: itaas ang PA damper FICFA1071 (MANUAL) nang tig-1 % (single arrow) hanggang 180 T/H (walang bed). Kasabay, itaas ang IDF hydraulic coupling PICFG108 (MV ▲) para manatili ang furnace pressure malapit sa −15 mmH₂O. Mga 18 % ang PA damper at mga 16 % ang coupling sa dulo (PA 180 + SA 200 + FA 26 ≈ 406 T/H, higit sa 25 % MCR = 151.5 T/H, DESIGN BASE total air 606 T/H).', c: b.HOLD(10, b.ALL(b.VAL('PA', 170, 195), b.PURGE_AIR, b.VAL('FP', -25, -5))), fps: ['FICFA1071', 'PICFG108'], a: [btn('PA damper ▲ +1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (1))))), btn('PA damper ▼ −1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      { st: 2, sec: 25, t: 'Furnace pressure control PICFG108 sa AUTO, SV −15 mmH₂O', d: 'Gawin: kapag nasa mga 16 % na ang hydraulic coupling at matatag ang furnace pressure sa mga −15 mmH₂O, PICFG108 A, SV −15 (PR-OPE-5002). Habang mas mababa sa 14 % ang MV, FORCE MANUAL ang PICFG108 (ABC-008 M.0205): hindi pa puwede ang AUTO. Sa AUTO, ang PICFG108 na ang gumagalaw ng coupling para sa −15.', c: b.ALL(b.MODE('PICFG108', 'AUTO'), b.SV('PICFG108', -16, -14), b.HOLD(30, b.VAL('FP', -25, -5))), fps: ['PICFG108'], a: [btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('PICFG108 A, SV −15', () => (mv('PICFG108') < 14 ? 'FORCE MANUAL pa ang PICFG108 (ABC-008 M.0205: IDF coupling < 14 %): itaas muna ang MV' : h().FP() < -25 || h().FP() > -5 ? 'Hintayin muna: furnace pressure ' + f0(h().FP()) + ' mmH₂O (kailangan malapit sa −15, −25 ~ −5)' : A.auto('PICFG108', -15)))] },
      /* ---- 3 purge ---- */
      {
        st: 3,
        sec: 26,
        t: 'Purge permissives: lahat ng fan tumatakbo, walang coal, walang apoy, biasing damper bukas',
        d: 'Ito ang mga kondisyon ng drawing bago magsimula ang purge. RH damper ≥ 30 % at SH damper ≥ 60 %.',
        c: b.ALL(R.IDF, R.SAF, R.FAB, R.PAF, b.NOFEED, b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'no start-up burner'), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null), DW(C('Furnace purge ready (DITL-02 out 10)', () => dOut('DITL-02', 9) === 1, dTxt('DITL-02', 9, 'PURGE READY', 'purge not ready')), b.MFT)),
        fps: ['HICHR1002A', 'HICHR1002B'],
        a: [btn('Biasing damper RH at SH 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))],
        field: [25]
      },
      /* 3.2.0-beta.23: with the one world the purge is the drawing's: DITL-02 row 6 FURNACE PURGE START P.B. -> 5 min -> out 16 FURNACE
         PURGE COMPLETED -> DITL-03A row 21 resets the MFT (I.000F 0) */
      {
        st: 3,
        sec: 26,
        t: 'Furnace purge: 5 minuto',
        d: 'Pindutin ang FURNACE PURGE START (DITL-02). Hawakan ang hangin nang 5 minuto. Kapag may nawala (fan huminto, hangin bumaba), uulit ang bilang. Pagkatapos ng 5 minuto, ang "PURGE COMPLETED" ang nagre-reset ng MFT (DITL-03A row 21).',
        c: DW(b.ALL(C('Purge completed, MFT reset (DITL-03A out 13 = 0)', () => dOut('DITL-03A', 12) === 0, () => (dOut('DITL-03A', 12) === 0 ? 'MFT RESET' : dOut('DITL-02', 5) === 1 ? 'purge in progress' : 'MFT, purge not started')), b.MFT), b.HOLD(300, b.ALL(R.IDF, R.PAF, R.SAF, b.PURGE_AIR, b.NOFEED))),
        a: [btn('FURNACE PURGE START (DITL-02)', () => dPress('DITL-02', 5), () => dOut('DITL-02', 5) === 1 || dOut('DITL-03A', 12) === 0)],
        /* live check #106: the alarms that come out of the suppression in the purge (10 min after the fans of their group run) */
        note: 'Mga alarm na lalabas sa purge (10 min pagkatapos tumakbo ang fans, natapos ang suppression): AI0273 / AI0433 flue gas O₂ HIGH-HIGH (ABC-002, AT-FG1122 / 1123: 21 % dahil hangin lang ang dumadaan, walang apoy; HH 8 %) at AI0656 / AI0672 PA preheater outlet air temperature LOW-LOW (ABC-006, TT-FA1076 / 1077: malamig pa ang hangin). Tama ang mga ito sa purge: i-ACK. Kusang mawawala ang O₂ HIGH-HIGH kapag may apoy na (bababa sa 3.5 ~ 8 %) at ang temperatura kapag uminit ang preheater.',
        wait: 1
      },
      { st: 3, sec: 26, t: 'Biasing damper: RH 10 %, SH 90 %', d: 'Pagkatapos ng purge, karamihan ng flue gas ay sa SH side muna.', c: b.ALL(b.MV('HICHR1002A', 5, 15), b.MV('HICHR1002B', 85, 95)), fps: ['HICHR1002A', 'HICHR1002B'], a: [btn('RH 10 %, SH 90 %', () => (A.man('HICHR1002A', 10), A.man('HICHR1002B', 90)))] },
      /* ---- 4 burners and warm-up ---- */
      { st: 4, sec: 28, t: 'Sindihan ang burner A', d: 'SA damper at oil FCV sa ignition, tapos BURNER ON (DITL-09): ang DITL ang magpapasok ng igniter, magbubukas ng dalawang supply oil valve at magsisindi (DITL-10 / 13). Kapag may apoy na, ang oil flow FICDO1043A sa 60 %.', c: b.ALL(b.BIT('M.3412', 1, 'burner A in service'), b.VAL('oilF', 0.3, null)), fps: ['FICDO1043A'], get a() {
          return WL() ? [bIgn('A'), bOn('A'), bOil('A', 60)] : [btn('Buksan oil valve A', () => A.oil('M.3410', true)), btn('BURNER A ON', () => A.motor('M.3412', 1), () => bit('M.3412') > 0.5), btn('FICDO1043A M 60 %', () => A.man('FICDO1043A', 60))];
        }, field: [27] },
      { st: 4, sec: 28, t: 'Sindihan ang burner D (diagonal ng A)', d: 'PR-OPE-5002: pagkatapos ng A, ang kasunod ay ang D (diagonal). Pareho ng burner A: SA damper at oil FCV sa ignition, BURNER ON (ang DITL ang magbubukas ng oil valve), tapos FICDO1043D 60 %.', c: b.ALL(b.BIT('M.3419', 1, 'burner D in service'), b.MV('FICDO1043D', 50, null)), fps: ['FICDO1043D'], get a() {
          return WL() ? [bIgn('D'), bOn('D'), bOil('D', 60)] : [btn('Buksan oil valve D', () => A.oil('M.3417', true)), btn('BURNER D ON', () => A.motor('M.3419', 1), () => bit('M.3419') > 0.5), btn('FICDO1043D M 60 %', () => A.man('FICDO1043D', 60))];
        } },
      { st: 4, sec: 28, t: 'Hangin sa minimum: PA at SA damper 10 %', d: 'Bawasan ang hangin pagkatapos magsindi para hindi lumamig ang furnace (nananatili ang total air > 25 % MCR, PR-OPE-5002 5240). Kasabay, ibaba ang IDF coupling para hindi bumagsak ang furnace pressure sa PSLL −267 mmH₂O (MFT).', c: b.ALL(b.MV('FICFA1071', null, 12), b.MV('FICFA1081', null, 12)), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA at SA MV 10 %, IDF coupling PICFG108 MV 18 %', () => (A.man('FICFA1071', 10), A.man('FICFA1081', 10), md('PICFG108') === 'MAN' && A.man('PICFG108', 18)))] },
      { st: 4, sec: 28, t: 'Pag-init: hintayin kumulo ang tubig (100 °C)', d: 'Ikaw ang humahawak ng apoy: ang pagtaas ng temperatura ay ≤ 110 °C bawat oras (FHI Fig 1). Bantayan ang "Bilis ng pag-init": kapag mas mababa sa 85 °C/h, oil ▲ +5 %; kapag higit sa 100 °C/h, oil ▼ −5 %. Pabilisin ang simulation kung gusto mo.', c: b.VAL('Tw', 100, null), fps: ['FICDO1043A', 'FICDO1043D'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5)], w: WARM, wait: 1 },
      { st: 4, sec: 28, t: 'Drum pressure 2 kg/cm²: isara ang vents at drains (field)', d: 'Kapag may pressure na, isinasara ng field operator ang mga vent at drain ng steam side.', c: b.VAL('Pd', 2, null), wait: 1, field: [] },
      { st: 4, sec: 28, t: 'Drum pressure 15 kg/cm²: sindihan ang burner B at C', d: 'Sa 15 kg/cm² idinadagdag ang dalawa pang burner: SA damper at oil FCV sa ignition, BURNER ON (ang DITL ang magbubukas ng oil valve), tapos FICDO1043B / C 20 % (PR-OPE-5002: B / C pagkatapos ng 30 minuto).', c: b.ALL(b.VAL('Pd', 15, null), b.BURN4), fps: ['FICDO1043B', 'FICDO1043C'], get a() {
          return WL() ? [bIgn('B'), bIgn('C'), bOn('B'), bOn('C'), bOil('B', 20), bOil('C', 20)] : [btn('Buksan oil valve B at C', () => (A.oil('M.3411', true), A.oil('M.3416', true))), btn('BURNER B at C ON', () => (A.motor('M.3413', 1), A.motor('M.3418', 1)), () => bit('M.3413') > 0.5 && bit('M.3418') > 0.5), btn('FICDO1043B / C M 20 %', () => (A.man('FICDO1043B', 20), A.man('FICDO1043C', 20)))];
        } },
      /* 3.2.0 P1 #3 (PR-OPE-5002 7259: "Turbine Main Steam Motorized isolation valve (MVMS1391) is necessary to be Equalized and OPENED during
         boiler pressurization at around 20~30 ksc"): no steam reaches the MSV (ATS 1.3) and the turbine with it shut */
      {
        st: 4,
        sec: 28,
        t: 'Main steam MOV: equalizing MV-MS1392 OPEN, tapos MV-MS1391 OPEN (20 ~ 30 kg/cm²)',
        d: 'PR-OPE-5002: sa 20 ~ 30 kg/cm² ng main steam, dahan-dahang buksan ang turbine inlet equalizing MOV MV-MS1392 (5 ~ 10 minuto para pumantay ang pressure at temperatura; bantayan ang drum level), tapos buksan ang main steam MOV MV-MS1391. Kapag sarado ito, walang steam sa MSV at sa turbine.',
        c: b.ALL(b.VAL('Pd', 20, null), mcvC('MV-MS1391 open', () => mcvPos('MV-MS1391') >= 100)),
        a: [mcvB('MV-MS1392', 1), mcvB('MV-MS1391', 1)]
      },
      { st: 4, sec: 28, t: 'Drum pressure 30 kg/cm²', d: 'Hintayin ang 30 kg/cm². Ikaw pa rin ang humahawak ng bilis ng pag-init (≤ 110 °C/h, oil ▲ / ▼). Ang oil fire ay hanggang 30 ~ 35 kg/cm² lang (PR-OPE-5002: ang coal ang tatapos).', c: b.VAL('Pd', 30, null), fps: ['FICDO1043A', 'FICDO1043B'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], w: WARM, wait: 1 },
      /* 3.2.0-beta.40 (roadmap 2, Cold run stall at "Bypass servicing"): PR-OPE-5002 STEAM DRUM FILLING "Ensure MS BLOW OFF VALVE (BOV)
         >10 % OPEN" and BYPASS SYSTEM SERVICING "Gradually close MS Blow off valve ... transfer steam flow to RH": the MS blow-off is
         open through the warm-up and the turbine auxiliaries, and the start-up valve keeps the drum level. Before (beta.37 ~ 39) this
         step came after the vacuum up: a closed boiler on 4 oil burners went 30 -> 131 kg/cm2 while the TCS auxiliaries were done, the
         drum level fell to -422 mm (no feed), the low-low level tripped the oil (MFT) and the bypass step waited forever (steam 0) */
      {
        st: 4,
        sec: 28,
        t: 'Pressure at level: start-up level LICBR1001B AUTO SV 0, MS blow-off PICMS1002 AUTO SV 35',
        d: 'PR-OPE-5002: bukas (≥ 10 %) ang MS blow-off valve habang umiinit. Ang blow-off (PICMS1002) ang hahawak ng main steam pressure sa 35 kg/cm² habang ginagawa ang TCS auxiliaries at vacuum, at ang start-up valve (LICBR1001B) ang hahawak ng drum level. Coal ay pagkatapos pa ng sync (FHI Fig. 2): oil burner lang hanggang 45 MW.',
        c: b.ALL(b.MODE('LICBR1001B', 'AUTO'), b.MODE('PICMS1002', 'AUTO')),
        fps: ['LICBR1001B', 'PICMS1002'],
        a: [btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0)), btn('PICMS1002 A, SV 35', () => A.auto('PICMS1002', 35))]
      },
      /* ---- 5 vacuum and seals ---- */
      /* 3.2.0-beta.37 (user 2026-10-25): the aux steam (from the main steam > 12 kg/cm2), the turning gear, the gland sealing and the
         ejectors before the vacuum up (PR-OPE-5002 5708, 6118, 6512); the unit model raises the vacuum only with the aux steam */
      FIELD(5, 'Deaerator warming, condensate polisher, bed material (field)', [28, 29, 30, 31, 32, 33, 34, 35], { d: 'Mga gawain ng field operator na walang DCS / TCS signal. Ang aux steam, turning gear, gland sealing at vacuum up ay nasa TCS panel (mga susunod na hakbang).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the turbine auxiliaries on the TCS model (tcs.js): ATS criteria 1.14 ~ 1.19, PR-OPE-5002 5708 / 6118
         / 6512. Before (beta.37) one "field" confirm */
      /* all-steps check 2026-10-30: the section of each turbine step is the PR-OPE-5002 section that does it (14 lube oil / vapour
         extractor, 33 gland sealing with the turning gear, 35 vacuum up; the aux steam stays 31); the practice steps are section 47 */
      { st: 5, sec: 14, t: 'TCS: lube oil pump, EH oil pump, MOT vapour extractor START', d: 'Kailangan ng bearing oil (ATS 1.15 / 1.16), control oil (1.14) at vapour extractor (1.18) bago ang turning gear at ang lahat ng ATS step.', c: C('Lube oil, EH oil, vapour extractor tumatakbo', () => TC().aux.lop && TC().aux.eh && TC().aux.vex, () => ['lop', 'eh', 'vex'].filter(k => !TC().aux[k]).join(', ') || 'OK'), a: [btn('LUBE OIL PUMP START', () => A.tcs('lop', 1), () => TC().aux.lop), btn('EH OIL PUMP START', () => A.tcs('eh', 1), () => TC().aux.eh), btn('VAPOUR EXTRACTOR START', () => A.tcs('vex', 1), () => TC().aux.vex)] },
      { st: 5, sec: 33, t: 'Turning gear ON (mga 3 rpm)', d: 'Umiikot nang dahan-dahan ang rotor para hindi ito bumaluktot habang umiinit (ATS 1.19 TURBINE TURNING). Kailangan ng bearing oil.', c: C('Turbine turning (≥ 1 rpm)', () => TC().aux.tg && TC().rpm >= 1, () => f1(+TC().rpm || 0) + ' rpm'), a: [btn('TURNING GEAR ON', () => A.tcs('tg', 1), () => TC().aux.tg)] },
      { st: 5, sec: 31, t: 'Aux steam: buksan ang MV-AS1391 (main steam > 12 kg/cm²)', d: 'Ang aux steam header (10 kg/cm²) ay galing sa main steam (PR-OPE-5002 5727 REQUIREMENT: MS > 12 kg/cm²). Ito ang steam ng gland seal at ng ejector.', c: C('Aux steam header > 10 kg/cm²', () => TC().Pa > 10, () => f1(+TC().Pa || 0) + ' kg/cm²'), a: [btn('MV-AS1391 OPEN', () => A.tcs('aux', 1), () => TC().aux.asv)], wait: 1 },
      { st: 5, sec: 33, t: 'Gland sealing (aux > 7 kg/cm², turning gear, vacuum breaker bukas)', d: 'PR-OPE-5002 6118: MS > 12, aux > 7 kg/cm², gland steam 220 °C, tumatakbo ang turning gear, bukas ang vacuum breaker MV-AV1391 (ATS 1.10).', c: C('Gland steam seal header normal', () => TC().aux.gland, () => (TC().aux.gland ? 'in service' : 'off')), a: [btn('GLAND STEAM IN SERVICE', () => A.tcs('gland', 1), () => TC().aux.gland)] },
      { st: 5, sec: 35, t: 'Vacuum up: isara ang vacuum breaker, ejectors (aux > 10 kg/cm²)', d: 'PR-OPE-5002 6512: tapos ang gland sealing, aux > 10 kg/cm², sarado ang vacuum breaker MV-AV1391, 1st at 2nd ejector (sa DCS: MV-AV1391 CLOSE sa DITL-56, tapos MV-AS1396 at MV-AS1395 OPEN sa DITL-55 / 54). Mga 15 minuto hanggang ≥ 90 % (ATS 1.11).', c: b.ALL(C('Condenser vacuum ≥ 90 %', () => +U().vac >= 0.9, () => f0(100 * (+U().vac || 0)) + ' %'), C('LP exhaust hood spray FVCD1904 AUTO (PR-OPE-5002 6307)', () => !!TC().aux.hsp, () => (TC().aux.hsp ? 'AUTO' : 'OFF'))), a: [movB('DITL-56', 'MV-AV1391', 0, 3, 13), movB('DITL-55', 'MV-AS1396', 1, 4, 13), movB('DITL-54', 'MV-AS1395', 1, 4, 13), btn('VACUUM UP (ejectors)', () => A.tcs('vacuum', 1), () => TC().aux.ej), btn('Hood spray FVCD1904 AUTO', () => A.tcs('hood', 1), () => !!TC().aux.hsp)], wait: 1 },
      /* ---- 6 bypass at 61 kg/cm2, oil only (3.2.0-beta.37, CHECKLIST 0.5: PR-OPE-5002 BYPASS SYSTEM SERVICING -> TURBINE ROLLING ->
         SYNCH. & INITIAL LOAD -> LOAD UP -> solid fuel; FHI SECT_7 Fig. 2 COLD STARTUP: roll at 60 kg/cm2 6 h, coal 8.6 h. Before, the
         coal and 123 kg/cm2 came before the roll and the bypass dumped 155 ~ 189 T/H) ---- */
      /* 3.2.0-beta.37: before the roll, on oil (CHECKLIST 0.5). 3.2.0-beta.23: the bypass goes in service BEFORE the coal (PR-OPE-5002: BYPASS SYSTEM SERVICING comes before the solid fuel
         firing). Before, it came after the burners were out: the blow-off alone (about 13 T/H at 35 kg/cm2) could not take the steam of
         the coal and the pressure went over 140 kg/cm2 (172 with the primary air at 280 T/H and the coal that follows it) */
      {
        st: 6,
        sec: 30,
        t: 'Bypass sa serbisyo: HP bypass A, LP bypass A SV 7.6, RH blow-off M 20 %',
        d: 'Ang HP bypass (PICMS1006) ang hahawak ng main steam pressure, ang LP bypass (PICHR1003) ang reheat pressure 7.6 kg/cm². SV ng HP bypass = pressure ngayon.',
        c: b.ALL(b.MODE('PICMS1006', 'AUTO'), b.MODE('PICHR1003', 'AUTO')),
        fps: ['PICMS1006', 'PICHR1003', 'PICHR1391'],
        a: [btn('Ilagay lahat', () => {
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
      { st: 6, sec: 30, t: 'Bypass servicing: MSP ≥ 48 kg/cm² at steam flow ≥ 40 T/H', d: 'Gawin: (1) dagdagan ang oil fire (oil ▲) hanggang steam flow 40 ~ 55 T/H, (2) hangin: O₂ 3.5 ~ 8 % sa SA damper (SA ▲ / ▼), PA flow 280 T/H kapag mainit na ang bed (PA ▲ / ▼), (3) kapag nasa serbisyo na ang HP bypass (MSP ≥ 48, steam ≥ 40), itaas ang SV ng HP bypass PICMS1006 ng 1 kg/cm² bawat minuto hanggang 61.', c: b.ALL(b.VAL('MSP', 48, null), b.VAL('MSF', 40, null)), fps: ['PICMS1006', 'FICFA1081', 'FICFA1071'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5), step('SA damper ▲ +2 %', 'FICFA1081', 2), step('SA damper ▼ −2 %', 'FICFA1081', -2), step('PA damper ▲ +1 %', 'FICFA1071', 1), step('PA damper ▼ −1 %', 'FICFA1071', -1), svStep('HP bypass SV +1', 'PICMS1006', 1, 0, 123)], w: BYP, wait: 1 },
      { st: 6, sec: 30, t: 'Main steam pressure 61 kg/cm²: handa ang roll', d: 'PR-OPE-5002 (cold start): MS 61.2 kg/cm², steam flow > 40 T/H, reheat ≤ 8.5 kg/cm². Hawak ng HP bypass ang 61 (SV +1 kada minuto) at ng LP bypass ang reheat; ikaw ang humahawak ng oil para sa 40 ~ 55 T/H.', c: b.HOLD(120, b.ALL(b.VAL('MSP', 59, null), b.VAL('MSF', 40, null), b.VAL('RHP', null, 9))), fps: ['PICMS1006'], a: [oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), svStep('HP bypass SV +1', 'PICMS1006', 1, 0, 61), svStep('HP bypass SV −1', 'PICMS1006', -1, 0, 123)], w: BYP, wait: 1 },
      /* ---- 7 turbine on oil ---- */
      FIELD(7, 'Field checks bago ang roll: drains, TCS lamps, turbine area (field)', [36, 37, 38, 39], { d: 'Mga gawain ng field operator. Ang ATS steps ay nasa TCS panel (mga susunod na hakbang).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the ATS steps of the TCS model (tcs.js; ATS Sequence 310SC90-775, Criteria 310SC90-776). Before
         (beta.37) one ROLL button: 0 -> 3600 rpm in 30 min with no criteria */
      { st: 7, sec: 41, t: 'ATS step 0: HP TURBINE WARMING', d: 'ATS page 13: kapag ≤ 150 °C ang HP first stage metal, pinapainit ito ng steam sa CV (B) hanggang > 150 °C. Kailangan: gland seal, vacuum, bearing oil, turning gear (CRITERIA A0).', c: C('HP turbine warming tapos (HP metal > 150 °C)', () => TC().step >= 0, () => 'HP metal ' + f0(+TC().Thp || 0) + ' °C' + (TC().cur === 0 ? ', warming' : '')), a: [btn('HP TURBINE WARMING', () => A.tcs('warm'), () => TC().cur === 0 || TC().step >= 0)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 1: TURBINE PREPARATION (CV chest warming, reset, MSV open)', d: 'ATS page 14 ~ 16: kapag ≤ 150 °C ang CV chest, CV chest warming nang 60 minuto (o diff < 50 °C at outer > 180 °C), tapos TURBINE RESET, MSV OPEN, LOAD LIMITER UPPER.', c: C('Turbine preparation tapos', () => TC().step >= 1, () => 'CV chest ' + f0(+TC().Tcvi || 0) + ' / ' + f0(+TC().Tcvo || 0) + ' °C' + (TC().cur === 1 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' min' : '')), a: [btn('TURBINE PREPARATION', () => A.tcs('prep'), () => TC().cur === 1 || TC().step >= 1)], wait: 1 },
      { st: 7, sec: 41, t: 'Steam para sa roll: MS 60 kg/cm² / 400 ~ 420 °C, RH 7.5 kg/cm² / 415 ~ 425 °C', d: 'PR-OPE-5002 8254 COLD START-UP: MS 60 kg/cm², 400 °C; RH 7.5 kg/cm², 415 °C. ATS Fig. 2 / 3: sa malamig na metal, ang MSV inlet ≤ 420 °C at ang reheat ≤ 425 °C. Ikaw ang humahawak ng main steam temperature sa SH spray TICBR1150 (MV ▲ / ▼) at ng reheat sa biasing damper (RH damper HICHR1002A ▲ / ▼).', c: C('CRITERIA A2 (rub check) handa', () => TC().cur < 0 && !TC().next, () => TC().next || 'OK'), fps: ['TICBR1150', 'HICHR1002A'], a: [step('SH spray ▲ +2 %', 'TICBR1150', 2), step('SH spray ▼ −2 %', 'TICBR1150', -2), step('RH damper ▲ +5 %', 'HICHR1002A', 5), step('RH damper ▼ −5 %', 'HICHR1002A', -5)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 2: TURBINE RUB CHECK (200 rpm, coast < 100 rpm)', d: 'ATS page 17 ~ 18: 200 rpm, sarado ang CV / ICV, hinahayaang bumagal; tapos kapag < 100 rpm. Nakikinig ang field operator kung may kiskis.', c: C('Rub check tapos', () => TC().step >= 2, () => f0(+TC().rpm || 0) + ' rpm' + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('RUB CHECK', () => A.tcs('rub'), () => TC().cur === 2 || TC().step >= 2)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 3: ACCELERATION: 1800 rpm heat soak, tapos 3600 rpm heat soak', d: 'ATS page 19 ~ 22: 120 rpm/min. Ambient cold: 88 minuto sa 1800 rpm, tapos HP metal > 170 °C at shell expansion > 3 mm, tapos 3600 rpm nang 86 minuto. Walang hold sa critical zone 1372 ~ 1723 rpm.', c: C('Acceleration tapos (3600 rpm, heat soak)', () => TC().step >= 3, () => f0(+TC().rpm || 0) + ' rpm' + (TC().cur === 3 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' / ' + f0(+TC().soakMin || 0) + ' min' : '') + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('ACCELERATION', () => A.tcs('accel'), () => TC().cur === 3 || TC().step >= 3)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 4: EXCITATION', d: 'ATS page 23: AVR EXCITATION START, generator voltage OK.', c: C('Excitation tapos', () => TC().step >= 4, () => (TC().cur === 4 ? 'excitation' : '—')), a: [btn('EXCITATION', () => A.tcs('excite'), () => TC().cur === 4 || TC().step >= 4)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 5: SYNCH. & INITIAL LOAD (52G), LP bypass sa REMOTE', d: 'ATS page 24 ~ 25: ASD START, sarado ang 52G, initial load 3 % (4.5 MW), hold 40 minuto (Fig. 3). Ilagay ang LP bypass sa R (SV = first stage + 5.1).', c: b.ALL(b.BIT('I.0931', 1, 'GCB 52G1 on'), b.MODE('PICHR1003', 'REM')), fps: ['PICHR1003'], a: [btn('SYNCH. & INITIAL LOAD', () => A.tcs('sync'), () => bit('I.0931') > 0.5), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      { st: 7, sec: 42, t: 'Initial load hold: 40 minuto, LP exhaust hood < 52 °C', d: 'ATS page 25 Fig. 3: 40 minuto (metal < 230 °C). PR-OPE-5002 9123: hawakan ang initial load hanggang ang LP turbine exhaust hood ay < 52 °C.', c: C('Initial load hold tapos at LP exhaust < 52 °C', () => TC().step >= 5 && TC().Tx < 52, () => (TC().cur === 5 ? f0(+TC().tmMin || 0) + ' / ' + (TC().holdMin || 40) + ' min, ' : '') + 'LP exhaust ' + f0(+TC().Tx || 0) + ' °C'), wait: 1 },
      { st: 7, sec: 42, t: 'LOAD UP sa 45 MW (TCS), ICV → CV transfer', d: 'Sa TCS panel: LOAD UP 45 MW (7.5 MW bawat minuto). Ang transfer ay sa 15 ~ 22 MW. Habang nagkakarga: ilipat ang feedwater sa main valve (LICBR1001A A SV +50, start-up valve LICBR1001B M, isara nang 5 % bawat minuto, LICBR1001 M 0 %). Pagkatapos ng transfer, isara ang LP bypass PICHR1003 (M, −10 % bawat minuto) hanggang mawala ang preset (M.070F = 0), tapos R.', c: b.ALL(b.BIT('I.0418', 1, 'ICV to CV transfer complete'), b.VAL('MW', 15, null)), fps: ['LICBR1001B', 'LICBR1001A', 'PICHR1003'], a: [btn('LOAD UP 45 MW (TCS)', () => A.tcs('loadup', 45), () => U().tb && U().tb.st === 'load'), btn('Feedwater sa main valve: LICBR1001A A SV +50, LICBR1001B M, LICBR1001 M 0 %', () => (A.man('LICBR1001B', mv('LICBR1001B')), A.auto('LICBR1001A', 50), A.man('LICBR1001', 0), '')), step('Start-up valve LICBR1001B ▼ −5 %', 'LICBR1001B', -5), step('LP bypass PICHR1003 ▼ −10 %', 'PICHR1003', -10), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      {
        st: 7,
        sec: 42,
        t: 'Feedwater 3-ELEMENT: FICFW1007 R, LICBR1001 A, pindutin ang 3-ELEMENT',
        d: 'Kapag feedwater > 110 T/H at wala na ang force manual (M.0228 = 0), ilipat sa 3-element: ang feedwater ay sumusunod sa steam flow at drum level.',
        c: b.ALL(b.VAL('FW', 100, null), b.MODE('FICFW1007', 'REM'), b.MODE('LICBR1001', 'AUTO'), b.BIT('M.0222', 0, 'single element')),
        fps: ['FICFW1007', 'LICBR1001'],
        ready: () => h().FW() > 110 && bit('M.0228') < 0.5,
        readyTxt: () => 'Hintayin: feedwater ' + f0(h().FW()) + ' T/H (> 110) at M.0228 = ' + f0(bit('M.0228')) + ' (0)',
        a: [btn('FICFW1007 R', () => A.rem('FICFW1007')), btn('LICBR1001 A, SV 0', () => A.auto('LICBR1001', 0)), btn('3-ELEMENT', () => A.push('M.054E'))]
      },
      /* 3.2.0-beta.24: the MS blow-off to its load SV 128 (4.PNG 148.8 MW: BLOW-OFF A, SV 128, MV 0). The bypass coach left it at the
         HP bypass SV + 5 of the moment its step ended (118 + 5 = 123 in some runs): at 80 MW it opened > 5 % at MSP 123, and its
         M.0255 (ABC-013 -> ABC-001C M.2013 BU-CMD) put the boiler and turbine master back to MANUAL at the CCS handover */
      { st: 7, sec: 42, t: 'HP bypass sa REMOTE, sarado ang HP at LP bypass at ang MS blow-off sa 45 MW', d: 'Pagkatapos ng transfer, ilagay ang SV ng HP bypass sa R (SV = PV + 2): magsasara ito at ang turbine na ang kumukuha ng lahat ng steam. Mula rito, ang pressure ay tumataas kasabay ng load (FHI Fig. 2: 61 kg/cm² sa 15 % load, 123 sa 40 %). Ang MS blow-off PICMS1002 ay AUTO SV 128 (sarado; ang bukas na blow-off > 5 %, M.0255, ay back-up command ng boiler master).', c: b.ALL(b.VAL('MW', 44, null), b.MODE('PICMS1006', 'REM'), b.BIT('M.0709', 0, 'HP bypass open'), b.BIT('M.0255', 0, 'MS blow-off open'), C('MS blow-off PICMS1002 AUTO, SV ≥ 125 kg/cm²', () => md('PICMS1002') === 'AUTO' && svOf('PICMS1002') >= 125, () => 'PICMS1002 ' + md('PICMS1002') + ' SV ' + f0(svOf('PICMS1002')))), fps: ['PICMS1006', 'PICMS1002'], a: [btn('HP bypass R', () => A.rem('PICMS1006'), () => md('PICMS1006') === 'REM'), btn('PICMS1002 A, SV 128', () => A.auto('PICMS1002', 128))] },
      { st: 7, sec: 42, t: 'Hawakan ang 45 MW: MSP ≥ 90 kg/cm², drum level ±150 mm', d: 'NORMAL OPERATION sa TCS. Oil pa lang ang apoy; ikaw ang nagtataas ng oil habang tumataas ang pressure (Fig. 2: mga 98 kg/cm² sa 45 MW).', fps: ['FICDO1043A', 'FICDO1043B'], w: BYP, c: b.ALL(C('TCS NORMAL OPERATION (ATS step 7)', () => TC().step >= 7, () => (TC().step >= 7 ? 'OK' : TC().next || 'pindutin ang NORMAL OPERATION')), b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 90, 131), b.VAL('lvl', -150, 150)))), a: [btn('NORMAL OPERATION (TCS)', () => A.tcs('normal'), () => TC().step >= 7), oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], wait: 1 },
      /* ---- 8 coal at 45 MW (PR-OPE-5002 solid fuel firing) ---- */
      { st: 8, sec: 44, t: 'Bed temperature ≥ 400 °C: handa ang coal feeder', d: 'Ang coal ay nasusunog lang sa mainit na bed.', c: b.VAL('Tb', 400, null), wait: 1 },
      { st: 8, sec: 44, t: 'Batch firing ng feeder A hanggang bed 600 °C', d: 'Gawin: START feeder A nang mga 10 segundo, STOP nang mga 60 segundo, ulitin hanggang 600 °C ang bed (PR-OPE-5002 solid fuel firing). Bantayan ang bed temperature: tumataas ito kapag nasusunog ang coal.', c: C('Bed ≥ 600 °C', () => U().Tb >= 600, () => f0(U().Tb) + ' °C'), a: [fDis('A'), mot('M.3400', 'feeder A')] },
      { st: 8, sec: 44, t: 'Feeder A tuloy-tuloy, FICCL1061A sa AUTO, coal demand FIC-CF 10 %', d: 'Pagkatapos ng 600 °C, tuloy-tuloy na ang feeder A. Kapag tumatakbo na, ilagay sa AUTO (force manual ito ng drawing habang nakatigil). Mula rito, ikaw ang nagpapalit ng apoy: coal (FIC-CF ▲) para sa steam ng turbine, bawas oil 5 % bawat minuto hanggang 20 % (PR-OPE-5002: 2.55 T/H coal = 1 T/H diesel), pressure pataas sa 123 kg/cm² (hawak ng TCS ang 45 MW). Bantayan ang bed: < 700 °C na walang burner = trip ng coal (DITL-03F).', c: b.ALL(b.BIT('M.3400', 1, 'feeder A running'), b.MODE('FICCL1061A', 'AUTO'), SETmin('FIC-CF', 8)), fps: ['FICCL1061A', 'FIC-CF'], a: [fDis('A'), mot('M.3400', 'feeder A'), btn('FICCL1061A A', () => A.loc('FICCL1061A')), btn('FIC-CF M 10 %', () => A.man('FIC-CF', 10)), step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (lahat) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL },
      { st: 8, sec: 44, t: 'Feeder B, tapos FICCL1061B sa AUTO', d: 'Ang ikalawang feeder.', c: b.ALL(b.BIT('M.3401', 1, 'feeder B running'), b.MODE('FICCL1061B', 'AUTO')), fps: ['FICCL1061B'], a: [fDis('B'), mot('M.3401', 'feeder B'), btn('FICCL1061B A', () => A.loc('FICCL1061B'))] },
      { st: 8, sec: 44, t: 'Bed ≥ 650 °C: feeder C, tapos FICCL1061C sa AUTO', d: 'Ang ikatlong feeder kapag sapat na ang init ng bed.', c: b.ALL(b.VAL('Tb', 650, null), b.BIT('M.3402', 1, 'feeder C running'), b.MODE('FICCL1061C', 'AUTO')), fps: ['FICCL1061C'], a: [fDis('C'), WLm('M.3402', 'feeder C', () => (A.motor('M.3402', 1), A.motor('M.3405', 1))), btn('FICCL1061C A', () => A.loc('FICCL1061C'))] },
      { st: 8, sec: 44, t: 'Main steam pressure 123 kg/cm² sa 45 MW', d: 'Coal na ang pangunahing apoy; ang mga oil burner ay nasa 20 % hanggang mga 60 % load (FHI Fig. 2). Itaas ang coal (FIC-CF ▲ / ▼) hanggang 123 kg/cm² (SV ng PIC-COBM sa CCS); bantayan ang bed (> 700 °C).', c: b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), fps: ['FIC-CF'], a: [step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (lahat) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL, wait: 1 },
      /* ---- 9 load up ---- */
      {
        st: 9,
        sec: 44,
        t: 'Ihanda ang combustion control: HS-COAL 33.1 %, O₂ trim 50 %, PA bias 0, FIC-CF A',
        d: 'Coal calorie correction 4150 kcal/kg = 33.1 %. Ang O₂ trim at PA bias ay neutral bago ilagay ang hangin sa REMOTE. Ang FIC-CF sa A sa PV nito (walang talon).',
        c: b.ALL(b.MV('HS-COAL', 32, 34), b.MODE('FIC-CF', 'AUTO')),
        fps: ['HS-COAL', 'FIC-CF'],
        a: [btn('Ihanda lahat', () => {
          A.man('HS-COAL', 33.1);
          A.val('HIC-TADBS', 0);
          A.auto('FIC-CF', pv('FIC-CF'));
          return '';
        })]
      },
      { st: 9, sec: 44, t: 'PA at SA air flow sa REMOTE (FICFA1071, FICFA1081)', d: 'Ang hangin ay susunod na sa air demand ng drawing.', c: b.ALL(b.MODE('FICFA1071', 'REM'), b.MODE('FICFA1081', 'REM')), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA at SA R', () => (A.rem('FICFA1071'), A.rem('FICFA1081')))] },
      { st: 9, sec: 44, t: 'FIC-CF sa REMOTE', d: 'Ang coal feeder demand ay manggagaling na sa coal master.', c: b.MODE('FIC-CF', 'REM'), fps: ['FIC-CF'], a: [btn('FIC-CF R', () => A.rem('FIC-CF'))] },
      {
        st: 9,
        sec: 44,
        t: 'Coal master FIC-CM sa REMOTE',
        d: 'Payag ang drawing kapag M.0130 = 0 (FIC-CF, PA, SA nasa REMOTE). Pindutin ang R kapag ang fuel demand (SI0141) ≈ coal ngayon.',
        c: b.MODE('FIC-CM', 'REM'),
        fps: ['FIC-CM'],
        ready: () => bit('M.0130') < 0.5 && Math.abs(h().val('ABC-004A', 'SI0141') - pv('FIC-CM')) < 1.5,
        readyTxt: () => 'Hintayin: M.0130 = ' + f0(bit('M.0130')) + ', fuel demand ' + f1(h().val('ABC-004A', 'SI0141')) + ' ≈ coal ' + f1(pv('FIC-CM')) + ' T/H',
        a: [btn('FIC-CM R', () => A.rem('FIC-CM'))]
      },
      {
        st: 9,
        sec: 44,
        id: 'bm',
        t: 'Boiler master HIC-BM sa AUTO (boiler follow)',
        d: 'Kapag steam flow > 230 T/H at wala na ang back-up command (M.2013 = 0): PIC-COBM A SV 123, HS-COAL R, tapos HIC-BM A. Ang M.2013 ay 1 din habang bukas > 5 % ang MS blow-off PICMS1002 (M.0255) o ang HP bypass (M.0709): ibaba ang HIC-BM hanggang bumaba ang pressure sa ilalim ng 128.',
        c: b.MODE('HIC-BM', 'AUTO'),
        fps: ['PIC-COBM', 'HIC-BM', 'PICMS1002'] /* OFF unless switched on: boiler follow by hand on HIC-BM (the faceplate) */,
        ready: () => h().MSF() > 230 && bit('M.2013') < 0.5,
        readyTxt: () =>
          'Hintayin: steam flow ' + f0(h().MSF()) + ' T/H (> 230), M.2013 = ' + f0(bit('M.2013')) + ' (0)' + (h().bit('ABC-001C', 'M.0255') > 0.5 ? ': bukas ang blow-off PICMS1002 (M.0255 = 1, MSP ' + f1(h().MSP()) + ')' : '') + (bit('M.0709') > 0.5 ? ': bukas ang HP bypass (M.0709 = 1)' : ''),
        a: [btn('PIC-COBM A, SV 123', () => A.auto('PIC-COBM', 123)), btn('HS-COAL R', () => A.rem('HS-COAL')), btn('HIC-BM A', () => A.auto('HIC-BM'))]
      },
      {
        st: 9,
        sec: 44,
        t: 'O₂ control AICFG112 sa AUTO',
        d: 'Payag kapag > 220 T/H (M.0101) at PV ≈ SV.',
        c: b.MODE('AICFG112', 'AUTO'),
        fps: ['AICFG112'],
        ready: () => bit('M.0101') > 0.5,
        readyTxt: () => 'Hintayin: steam flow > 220 T/H (M.0101 = ' + f0(bit('M.0101')) + ')',
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
        t: 'Turbine master EIC-TM sa AUTO (coordinated control, CCS)',
        d: 'DCS CONTROL MODE ON ay kusang lumalabas (I.0082). Pindutin ang A kapag ang AUTO value (SI0236) ≈ TCS target, para walang talon.',
        c: b.MODE('EIC-TM', 'AUTO'),
        fps: ['EIC-TM'],
        ready: () => bit('I.0082') > 0.5 && bit('M.2016') < 0.5 && Math.abs(h().val('ABC-001C', 'SI0236') - (+U().tcsT || 0)) < 1,
        readyTxt: () => 'Hintayin: DCS control mode I.0082 = ' + f0(bit('I.0082')) + ', SI0236 ' + f1(h().val('ABC-001C', 'SI0236')) + ' ≈ TCS target ' + f1(+U().tcsT),
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
        t: 'Reheat temperature sa AUTO: biasing damper SH at RH A, TICHR1002A A (SV: LOGIC), RH spray TICHR1002 A SV 541',
        d: 'PR-OPE-5002: "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV". Ang "Remote" ng TICHR1002A ay ang SV: LOGIC (SV mula sa MW, LN6, may bumpless ramp 1 %/min). Unahin ang SH damper (HICHR1002B): habang MANUAL ito, naka-force MANUAL ang RH damper (ABC-020 M.0179, kasama ang steam flow < 15 % MCR). Ang RH spray ay payag sa AUTO kapag bukas na ang shut-off valve (DITL-35).',
        c: b.ALL(b.MODE('HICHR1002B', 'AUTO'), b.MODE('HICHR1002A', 'AUTO'), C('TICHR1002A AUTO, SV: LOGIC (LN6, MW → reheat SV)', () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A'), () => md('TICHR1002A') + (svLogic('ABC-020', 'TICHR1002A') ? ', SV: LOGIC' : ', SV: OPERATOR')), b.MODE('TICHR1002', 'AUTO')),
        fps: ['HICHR1002B', 'HICHR1002A', 'TICHR1002A', 'TICHR1002'],
        ready: () => bit('I.0418') > 0.5 && h().MSF() >= 69 && !(h().bit('ABC-019', 'I.088F') > 0.5),
        readyTxt: () => 'Hintayin: ICV → CV transfer I.0418 = ' + f0(bit('I.0418')) + ', steam ' + f0(h().MSF()) + ' T/H (≥ 69), RH spray shut-off valve ' + (h().bit('ABC-019', 'I.088F') > 0.5 ? 'sarado' : 'bukas'),
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
        t: 'Unit load demand HIC-ULD sa AUTO, TARGET 150 MW',
        d: 'Ang CCS na ang magkakarga sa 3 MW bawat minuto (HIC-MWRL).',
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
        t: 'Load ≥ 90 MW, bed > 700 °C at PA flow ≥ 220 T/H: patayin ang mga burner isa-isa (A, D, B, C)',
        d: 'FHI Fig. 2: pinapatay ang startup burners sa mga 60 % load; PR-OPE-5002: simulan sa furnace > 700 °C, tapusin sa > 750 °C. Kapag kaya na ng coal, isara ang oil valve at patayin ang burner, may pagitan na ilang minuto. Bago patayin ang huling burner, ang PA flow ay dapat higit sa 200 T/H: kapag coal na lang, nagti-trip ang boiler sa PRIMARY AIR FLOW L.L. (ABC-007, DITL-03F). Target ng procedure: 280 T/H.',
        c: b.ALL(b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'start-up burners out'), b.VAL('Tb', 700, null), C('PA flow ≥ 220 T/H (FIFA1071)', () => pv('FICFA1071') >= 220, () => (pv('FICFA1071') || 0).toFixed(0) + ' T/H')),
        ready: () => pv('FICFA1071') >= 220 && h().MW() >= 90,
        readyTxt: () => 'Hintayin: load ' + f0(h().MW()) + ' MW (≥ 90), PA ' + f0(pv('FICFA1071')) + ' T/H (≥ 220)',
        get a() {
          return WL()
            ? [bOff('A'), bOff('D'), bOff('B'), bOff('C')]
            : [
                btn('Patayin burner A', () => (A.oil('M.3410', false), A.motor('M.3412', 0)), () => bit('M.3412') < 0.5),
                btn('Patayin burner D', () => (A.oil('M.3417', false), A.motor('M.3419', 0)), () => bit('M.3419') < 0.5),
                btn('Patayin burner B', () => (A.oil('M.3411', false), A.motor('M.3413', 0)), () => bit('M.3413') < 0.5),
                btn('Patayin burner C', () => (A.oil('M.3416', false), A.motor('M.3418', 0)), () => bit('M.3418') < 0.5)
              ];
        },
        retract: 1
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Furnace pressure PICFG108 sa AUTO, SV −15',
        d: 'Payag kapag MV ≥ 16 % at wala na ang force manual (M.0205 = 0).',
        c: b.MODE('PICFG108', 'AUTO'),
        fps: ['PICFG108'],
        /* 3.2.0-beta.23: M.0205 read on ABC-008, the sheet that computes it (a linked copy on a sheet that is not stepping kept 1 and the
           step never opened with the one world OFF) */
        ready: () => mv('PICFG108') >= 16 && !(h().bit('ABC-008', 'M.0205') > 0.5),
        readyTxt: () => 'Hintayin: PICFG108 MV ' + f0(mv('PICFG108')) + ' % (≥ 16), M.0205 = ' + f0(h().bit('ABC-008', 'M.0205') > 0.5 ? 1 : 0),
        a: [btn('PICFG108 A, SV −15', () => A.auto('PICFG108', -15))]
      },
      { st: 9, sec: 44, req: ['bm', 'tm'], t: 'Hawakan ang 150 MW: MSP 118 ~ 128, MST ≤ 545 °C, drum level ±150 mm, O₂ 3 ~ 6 %', d: 'Tapos ang start-up. Ang CCS na ang humahawak.', c: b.X2[9][1], wait: 1 },
      /* ---- 10 practice ---- */
      { st: 10, sec: 47, t: 'Practice: ibaba ang HIC-ULD sa 120 MW (▼▼)', d: 'Sa AUTO, target MW lang ang gagalawin mo. Ang CCS ang magbabawas ng coal at hangin.', c: b.OUT('HIC-ULD', null, 121, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Panoorin: 120 MW, coal mga 72 T/H, MSP hawak', d: 'Bumababa ang MW ng 3 MW bawat minuto at hawak ng PIC-COBM ang 123 kg/cm².', c: b.HOLD(120, b.ALL(b.VAL('MW', 117, 123), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), wait: 1 },
      { st: 10, sec: 47, t: 'Ibalik ang HIC-ULD sa 150 MW (▲▲)', d: 'Itaas ulit ang target.', c: b.OUT('HIC-ULD', 149, null, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Hawakan ang 150 MW', d: 'MSP 118 ~ 128, drum level ±150 mm, O₂ 3 ~ 6 %.', c: b.HOLD(300, b.ALL(b.VAL('MW', 147, 153), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150), b.VAL('O2', 3, 6))), wait: 1 }
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
