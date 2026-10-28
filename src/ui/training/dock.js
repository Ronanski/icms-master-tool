/* ===== 3.2.0-beta.23 TRAINING DOCK (user 2026-10-24, mockup https://claude.ai/artifact/M9TD6DVtS8XmfwrBpo4UVX chosen "Oo, gawin ayon sa
   mockup"): "sa training, ang hirap ng palipat lipat na screen, ang hirap din imonitor ng actual logic ... nakikita pa rin ang mga
   main parameters" and "si training, another workspace sya na connected pa rin sa current status ng mga logics (DITL & ABC)".
   The guided start-up (src/ui/training/guide.js, Cold -> 150 MW, one step at a time, no skipping) lives in a panel beside the app:
   on the right on a PC / tablet landscape, at the bottom on a tablet portrait. The app keeps working beside it (Logic ABC / DITL,
   Plant view, Library) and RUN stays on. The panel shows the main values and the equipment lamps, the step card with its buttons,
   the interlock of a motor read from its DITL drawing (DUI.need, the "To make it 1" of the Selected tab), the faceplates of the step
   (the real faceplate builder AN.fpBuild) and the values to watch. Layout only: the plant and the logic are the engine's. ===== */
(function () {
  const $ = id => document.getElementById(id);
  const E = (t, a, kids) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (kids || []).forEach(x => x != null && e.append(typeof x === 'string' ? document.createTextNode(x) : x));
    return e;
  };
  const ls = {
    get: (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    }
  };
  const GD = () => window.LS_GUIDE;
  const LV = () => window.LS_LIVE;
  const U = () => (window.AN && AN.unit) || {};
  const f0 = x => (x == null || !isFinite(x) ? '—' : String(Math.round(x)).replace(/^-0$/, '0'));
  const f1 = x => (x == null || !isFinite(x) ? '—' : (Math.round(x * 10) / 10).toFixed(1).replace(/^-0\.0$/, '0.0'));
  const sgn = x => (x == null || !isFinite(x) ? '—' : (x > 0.5 ? '+' : '') + f0(x));
  const H = () => {
    try {
      return GD() && GD().h();
    } catch (e) {
      return null;
    }
  };
  const call = (f, d) => {
    try {
      const x = f();
      return x == null ? d : x;
    } catch (e) {
      return d;
    }
  };
  const bit = a => call(() => LV().val(a), 0) > 0.5;
  /* a lamp address: M.xxxx (ABC memory), DITL-xx[@out row] (a drawing of the one world), F:key (a field state), L:DITL-xx@row (a local input),
     T:key (an auxiliary of the TCS panel: lop = MOP, eh = COP) */
  const lampOn = a => {
    if (/^F:/.test(a)) return call(() => !!AN.fieldState()[a.slice(2)], false);
    if (/^T:/.test(a))
      return call(() => {
        const x = AN.tcs();
        return x ? !!x.aux[a.slice(2)] : !!(AN.unit && AN.unit.on); /* no TCS model = the 150 MW snapshot: the oil pumps run */
      }, false);
    if (/^L:/.test(a)) return call(() => DUI.rowVal(dOf(a.slice(2)), atRow(a)) === 1, false);
    if (/^DITL-/.test(a)) return call(() => (atRow(a) != null ? dout(a, atRow(a)) === 1 : runOut(a) === 1), false);
    return bit(a);
  };
  const any = L => L.some(lampOn);
  const mv = t => call(() => {
    const f = LV().fp(t);
    return f ? LV().mvOf(f) : NaN;
  }, NaN);
  const pv = t => call(() => {
    const f = LV().fp(t);
    return f ? LV().pvOf(f) : NaN;
  }, NaN);

  /* ---------- the main values and the lamps (the strip) ---------- */
  const VALS = [
    ['Load', 'MW', () => H().MW(), f1],
    ['Drum press', 'kg/cm²', () => U().Pd, f1],
    ['Drum level', 'mm', () => H().lvl(), sgn],
    ['FW flow', 'T/H', () => H().FW(), f1],
    ['Steam flow', 'T/H', () => H().MSF(), f0],
    ['Furnace', 'mmH₂O', () => H().FP(), f0],
    ['Bed temp', '°C', () => U().Tb, f0],
    ['O₂', '%', () => H().O2(), f1]
  ];
  const LAMPS = [
    ['SWP', ['M.3353', 'M.3354', 'M.3355'], 'Seawater pumps A / B / C'],
    ['CEP', ['M.3350', 'M.3351'], 'Condensate pumps A / B'],
    ['BFWP', ['M.3343', 'M.3344'], 'Boiler feedwater pumps A / B'],
    ['IDF', ['M.3304'], 'ID fan'],
    ['FAB', ['M.3308', 'M.3309'], 'Fluidizing air blowers A / B'],
    ['SAF', ['M.3303'], 'Secondary air fan'],
    ['PAF', ['M.3302'], 'Primary air fan'],
    /* R9 #77: OIL = the turbine oil pumps (MOP lube oil, COP control oil, TCS); the start-up burners (diesel oil) are BRNR */
    ['BRNR', ['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'Start-up burners (diesel oil) A / B / C / D in service'],
    ['COAL', ['M.3400', 'M.3401', 'M.3402'], 'Coal feeders A / B / C'],
    /* retest #33 #51: the equipment of the utilities (sections 3 ~ 17): a DITL drawing, an output row of one, or a local field state */
    ['HYPO', ['F:hypo'], 'Hypochlorite pump (local)'],
    ['DF', ['DITL-39@3', 'DITL-39@14'], 'Debris filters SWP / SWBP outlet in operation'],
    ['SWBP', ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'], 'Seawater booster pumps A / B / C'],
    ['MWP', ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'], 'Make-up water pumps A / B / C'],
    ['ACW', ['DITL-76', 'DITL-77'], 'Aux. cooling water pumps A / B'],
    ['AIR', ['DITL-45@14', 'DITL-45@3', 'L:DITL-113@5', 'L:DITL-114@5'], 'IA / PA dryers and compressors'],
    ['OIL', ['T:lop', 'T:eh'], 'Turbine oil pumps (TCS): main oil pump MOP (lube oil), control oil pump COP'],
    ['RAH', ['DITL-43'], 'Rotary air preheater']
  ];
  /* ---------- the values to watch, by stage of the start-up (targets from PR-OPE-5002 and the boiler manual, as in guide.js) ---------- */
  let rate = { t: null, x: null, r: 0 };
  const lvl = ['Drum level', () => H().lvl(), 'mm', sgn, 'normal 0 · HH +254', 'LICBR1001'];
  const WATCH = [
    [['Seawater pumps running', () => ['M.3353', 'M.3354', 'M.3355'].filter(bit).length, '', f0, '2 bago ang vacuum']],
    [['Hotwell level', () => pv('LICCD1110A'), 'mm', sgn, '', 'LICCD1110A'], ['Condensate flow', () => pv('FICCD1120'), 'T/H', f1, '', 'FICCD1120'], ['Deaerator level', () => pv('LCV-CD1104'), 'mm', sgn, 'SV 0', 'LICCD1104'], lvl, ['FW flow', () => H().FW(), 'T/H', f1, '', 'FICFW1007']],
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15', 'PICFG108'], ['Total air', () => H().PA() + H().SA(), 'T/H', f0, 'purge > 115'], ['IDF coupling MV', () => mv('PICFG108'), '%', f0, '', 'PICFG108']],
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15', 'PICFG108'], ['Total air', () => H().PA() + H().SA(), 'T/H', f0, 'purge > 115']],
    [['Water temp', () => U().Tw, '°C', f0, 'kumukulo sa 100'], ['Drum pressure', () => U().Pd, 'kg/cm²', f1, ''], ['Bilis ng pag-init', () => rate.r, '°C/h', f0, 'Fig 1 ≤ 110'], ['Bed temp', () => U().Tb, '°C', f0, '']],
    [['Condenser vacuum', () => 100 * (+U().vac || 0), '%', f0, '≥ 90'], ['Drum pressure', () => U().Pd, 'kg/cm²', f1, '']],
    [['Bed temp', () => U().Tb, '°C', f0, 'coal ≥ 400 · retract > 700'], ['Coal flow', () => H().coal(), 'T/H', f1, '', 'FIC-CM'], ['O₂', () => H().O2(), '%', f1, '3.5 ~ 8', 'AICFG112'], ['Bilis ng pag-init', () => rate.r, '°C/h', f0, 'Fig 1 ≤ 110']],
    [['Main steam press', () => H().MSP(), 'kg/cm²', f1, 'target 123'], ['Steam flow', () => H().MSF(), 'T/H', f0, '40 ~ 55'], ['RH pressure', () => H().RHP(), 'kg/cm²', f1, '≤ 9'], lvl],
    [['Turbine', () => (U().tb ? +U().tb.rpm : NaN), 'rpm', f0, '3000 sa sync'], ['Load', () => H().MW(), 'MW', f1, '45 pagkatapos ng sync'], ['Main steam temp', () => H().MST(), '°C', f0, '≥ 345'], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123']],
    [['Load', () => H().MW(), 'MW', f1, 'target 150'], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123 ± 10', 'PIC-COBM'], ['Coal flow', () => H().coal(), 'T/H', f1, '', 'FIC-CM'], ['O₂', () => H().O2(), '%', f1, '', 'AICFG112'], lvl],
    [['Load', () => H().MW(), 'MW', f1, ''], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123 ± 10', 'PIC-COBM'], lvl]
  ];
  /* ---------- the interlock of a motor: its DITL drawing (machine A of a shared drawing) ---------- */
  /* the DITL drawing (or machine B / C of a shared drawing) whose output is the running memory of the ABC sheets: the one world link
     DITL -> ABC (world.js W.idx.ain); without the one world, the drawing of machine A */
  const MOTOR0 = { 'M.3304': 'DITL-25A', 'M.3302': 'DITL-26A', 'M.3303': 'DITL-27A', 'M.3308': 'DITL-28A', 'M.3343': 'DITL-23A', 'M.3353': 'DITL-29A', 'M.3350': 'DITL-61A' };
  /* a DITL drawing by name ("DITL-24"), a machine instance of the one world ("DITL-09 #B"); "DITL-12@7" = output row 7 of it (the
     target of the interlock and the running state: BURNER A READY) */
  const dSheet = nm =>
    typeof S !== 'undefined' && S.sheets ? S.sheets.concat((window.WORLD && WORLD.inst) || []).find(x => x.name.endsWith(String(nm).split('@')[0])) : null;
  const atRow = a => (/@(\d+)$/.test(String(a)) ? +/@(\d+)$/.exec(a)[1] : null);
  const DOF = {};
  /* 3.2.0 retest #28: the one world is built (its last scan is shown while PAUSED: the interlock, the field contacts, the lamps) */
  const wlOn = () => !!(window.WORLD && WORLD.on && WORLD.idx);
  /* one scan of the one world while PAUSED (dt 0: no timer runs), so a field contact set by the field operator shows at once */
  const pscan = () => {
    if (isRun() || !wlOn() || !WORLD.tick) return;
    for (let k = 0; k < 3; k++)
      try {
        WORLD.tick(0);
      } catch (e) {}
  };
  /* 3.2.0 retest #25 #29 #34: the state of a motor: 'RUN' / 'STOP' / 'TRIP' (its drawing: RUNNING and "... TRIP · CRT (ANN)" outputs,
     events.js lsAlarms); a drawing of two machines named with its output row ("DITL-45@14" = INSTRUMENT AIR DRYER-A RUNNING) */
  function mst(ad) {
    if (!ad || !wlOn()) return null;
    if (atRow(ad) != null) {
      const v = dout(ad, atRow(ad));
      return v == null ? null : v === 1 ? 'RUN' : 'STOP';
    }
    return call(() => (window.lsAlarms ? lsAlarms.motState(dOf(ad)) : null), null);
  }
  /* a TRIP not acknowledged yet (the alarm list of events.js) */
  const tripNew = ad => call(() => {
    const s = dOf(ad);
    return !!(s && window.lsAlarms && lsAlarms.list().some(x => x.k === 'D|' + s.name && !x.ack));
  }, false);
  const tripAck = ad => call(() => {
    const s = dOf(ad);
    if (s && window.lsAlarms) lsAlarms.ack('D|' + s.name);
  }, null);
  function dOf(addr) {
    if (!addr) return null;
    /* a drawing named by the step (a pump with no running memory on the ABC sheets: DITL-24 PAF lube oil pump) */
    if (/^DITL-/.test(addr)) return dSheet(addr);
    const ain = window.WORLD && WORLD.idx && WORLD.idx.ain;
    if (ain) {
      if (DOF[addr] && DOF[addr].ain === ain) return DOF[addr].d;
      let d = null;
      for (const a of ain)
        try {
          if (a.sh.S && String(AN.nm(a.sh.S, a.n) || '').replace(/^S\d\s*/, '').trim() === addr) {
            d = a.d;
            break;
          }
        } catch (e) {}
      DOF[addr] = { ain, d };
      if (d) return d;
    }
    return MOTOR0[addr] ? dSheet(MOTOR0[addr]) : null;
  }
  const dName = s => String((s && s.name) || '').replace(/^\(\d+\)/, '');
  const MOTOR = new Proxy({}, { get: (_, a) => (typeof a === 'string' && dOf(a) ? dName(dOf(a)) : undefined) });
  const REM = /\bREMOTE\b( MODE)?( SELECTED)?\s*$|REMOTE (MODE )?SELECTED/;
  const PERM = {}; /* the rows seen in the interlock of a motor: shown with their live value (green / red) */
  /* the start permissives of a motor drawing, read from its netlist (the same logic the one world runs): from what the START P.B.
     sets (the flip-flop that holds the start, or the start command output MOR) back to the input rows. On the path of the START
     P.B. every AND input must be 1; an OR off that path is satisfied by one input (the one without the motor's own RUNNING
     feedback); a comparator is an analog limit (its row and set point); an off-sheet connector "(n) FROM DITL-xx" is followed on
     that sheet. A row is { s (sheet), row, want } */
  const CX = new WeakMap();
  function ctx(s) {
    let c = CX.get(s);
    if (c && c.nl === s.nl) return c;
    const nl = s.nl;
    const drv = new Map();
    for (const g of nl.gates || []) for (const n of [].concat(g.out == null ? [] : g.out)) drv.set(n, g);
    const rowOf = new Map();
    for (let r = 0; r < 60; r++) for (const n of DUI.rowNets(s, r, 'L') || []) if (!rowOf.has(n)) rowOf.set(n, r);
    c = { nl, drv, rowOf };
    CX.set(s, c);
    return c;
  }
  const runRow = (s, r) => /RUNNING|RUN\b/.test(rowInfo(s, r).svc);
  /* what net n of sheet s needs to become `want`; stN / onSt: the START P.B. path of the motor sheet (else none) */
  function needNet(s, n, want, P, d, seen, out) {
    if (!s.nl) s.nl = netlist(s);
    const C = ctx(s),
      v = simSheet(s).v,
      k = s.name + ':' + n + ':' + want,
      st = P && P.s === s;
    if (st && P.stN.has(n)) return out;
    /* back to a net already on the way: a loop (the seal-in of the start), no way through it */
    if ((PATH.has(k) || d > 80) && !(v[n] ? 1 : 0) === !!want) out.unk = true;
    if (d > 80 || seen.has(k)) return out;
    seen.add(k);
    PATH.add(k);
    try {
      return needNet0(s, n, want, P, d, seen, out, C, v, st);
    } finally {
      PATH.delete(k);
    }
  }
  const PATH = new Set();
  function needNet0(s, n, want, P, d, seen, out, C, v, st) {
    const val = v[n] ? 1 : 0,
      on = st && P.onSt(n);
    if (val === want && !on) return out;
    const add = x => {
      if (!out.some(y => y.s === x.s && y.row === x.row)) out.push(x);
    };
    const g = C.drv.get(n);
    if (!g) {
      const r = C.rowOf.get(n);
      if (r !== undefined) {
        if (val !== want) add({ s, row: r, want });
        return out;
      }
      const xc = (C.nl.xcon || []).find(x => x.dir === 'in' && x.n === n),
        pr = xc && xconPeer(s, xc);
      if (pr) needNet(pr.sh, pr.c.n, want, P, d + 1, seen, out);
      /* a net with nothing behind it (a connector not read): no way known through it */ else if (val !== want) out.unk = true;
      return out;
    }
    const nx = (m, w) => needNet(s, m, w, P, d + 1, seen, out);
    /* the cheapest of several ways (one input of an OR to 1, one input of an AND to 0) */
    const best = (list, w) => {
      let b = null;
      for (const m of list) {
        const o = needNet(s, m, w, P, d + 1, new Set(seen), []);
        const bad = !!o.unk || o.some(x => runRow(x.s, x.row));
        if (!b || (b.bad && !bad) || (b.bad === bad && o.length < b.o.length)) b = { o, bad };
      }
      if (b) b.o.forEach(add);
      return out;
    };
    if (g.t === 'NOT') return nx(g.ins[0], 1 - want);
    if (g.t === 'TMR') return nx(g.ins[0], want);
    if (g.t === 'FF') {
      /* set: the SET input 1 and the RESET 0 (a trip / stop that holds the reset blocks the start) */
      if (want) {
        for (const m of g.s || []) nx(m, 1);
        for (const m of g.r || []) nx(m, 0);
      } else for (const m of g.r || []) nx(m, 1);
      return out;
    }
    if (g.t === 'CMP') {
      const r = C.rowOf.get(g.ins[0]);
      if (val !== want && r !== undefined) add({ s, row: r, want: 1, cmp: (want ? '' : 'NOT ') + (g.sptxt || g.cmp + ' ' + g.sp) });
      return out;
    }
    const pth = st ? g.ins.find(m => P.onSt(m)) : undefined;
    if (g.t === 'AND') {
      if (want) g.ins.forEach(m => nx(m, 1));
      else if (!g.ins.some(m => !v[m])) best(g.ins, 0);
      return out;
    }
    if (g.t === 'OR') {
      if (!want) g.ins.forEach(m => nx(m, 0));
      else if (pth !== undefined) nx(pth, 1);
      else if (!g.ins.some(m => v[m])) best(g.ins, 1);
      return out;
    }
    return out;
  }
  function permOf(s) {
    const nl = s.nl,
      stR = pbRow(s, /\bSTART\b|\bST$/);
    if (stR < 0) return null;
    const C = ctx(s),
      stN = new Set(DUI.rowNets(s, stR, 'L') || []);
    /* a flip-flop output is a memory (the seal-in of the start): the START path does not run back through it */
    const ins = g => (g.t === 'FF' ? [] : g.ins || []);
    const cone = new Map();
    const onSt = (n, d) => {
      if (cone.has(n)) return cone.get(n);
      cone.set(n, false);
      const g = C.drv.get(n);
      const r = stN.has(n) || (!!g && (d || 0) < 60 && ins(g).some(m => onSt(m, (d || 0) + 1)));
      cone.set(n, r);
      return r;
    };
    const P = { s, stN, onSt };
    /* reach of the START P.B. through the seal-in too (to find the target) */
    const cone2 = new Map();
    const reach = (n, d) => {
      if (cone2.has(n)) return cone2.get(n);
      cone2.set(n, false);
      const g = C.drv.get(n);
      const r = stN.has(n) || (!!g && (d || 0) < 80 && (g.t === 'FF' ? g.s || [] : g.ins || []).some(m => reach(m, (d || 0) + 1)));
      cone2.set(n, r);
      return r;
    };
    /* the target: the RUNNING output of the motor (what the start must reach, through its trips), else the flip-flop set by the
       START P.B., else the first start command output */
    let t = null;
    try {
      const ro = DUI.outs(s).find(o => /RUNNING/.test(o.name) && !/NOT RUNNING|STOP/.test(o.name)),
        on = ro && (nl.outs || []).find(o => o.row === ro.row);
      if (on && reach(on.n)) t = on.n;
    } catch (e) {}
    if (t == null)
    for (const g of nl.gates || [])
      if (g.t === 'FF' && (g.s || []).some(m => reach(m))) {
        t = g.s.find(m => reach(m));
        break;
      }
    if (t == null) {
      const po = (nl.pout || []).find(q => reach(q.n));
      if (po) t = po.n;
    }
    if (t == null) return null;
    return needNet(s, t, 1, P, 0, new Set(), []);
  }
  function interlock(addr) {
    const s = dOf(addr),
      nm = dName(s);
    if (!s || !window.DUI || !DUI.need) return null;
    const live = wlOn(); /* 3.2.0 retest #28: PAUSED too (the last scan) */
    let L = null;
    try {
      if (!s.nl) s.nl = netlist(s);
      /* the start command to the motor (the first physical output, MOR); a drawing without one: the RUNNING output row 5 */
      const ar = atRow(addr),
        on = ar != null ? (s.nl.outs || []).find(o => o.row === ar) : null;
      L = on ? needNet(s, on.n, 1, null, 0, new Set(), []) : permOf(s);
      if (!L) L = (DUI.need(s, 4) || []).map(r => (r.row !== undefined ? { row: r.row, want: r.want } : { txt: r.txt }));
    } catch (e) {
      return null;
    }
    /* the LOCAL / REMOTE selector of the motor: REMOTE for a start from the DCS (a start through a pulse timer and a flip-flop does
       not list it) */
    /* R9 #76: an output row of a drawing with two machines (DITL-45 PLANT / INSTRUMENT AIR DRYER-A): only the selector of that machine
       (the IA dryer asked for the PA dryer REMOTE too, its START was blocked) */
    let eq0 = '';
    try {
      const ar = atRow(addr),
        o = ar != null ? (DUI.outs(s) || []).find(q => q.row === ar) : null;
      eq0 = o ? eqW(o.name) : '';
      /* no REMOTE row of that machine (BURNER A READY): every REMOTE row, as before */
      let any = false;
      for (let r = 0; r < 40; r++) if (REM.test(rowInfo(s, r).svc) && eqW(rowInfo(s, r).svc) === eq0) any = true;
      if (!any) eq0 = '';
    } catch (e) {}
    for (let r = 0; r < 40; r++) if (REM.test(rowInfo(s, r).svc) && (!eq0 || eqW(rowInfo(s, r).svc) === eq0) && !L.some(x => (x.s || s) === s && x.row === r)) L.push({ s, row: r, want: 1 });
    const P = PERM[addr] || (PERM[addr] = new Map());
    let pb = false;
    for (const r of L) {
      if (r.row === undefined) {
        pb = true;
        continue;
      }
      const rs = r.s || s,
        k = rs.name + ':' + r.row + ':' + r.want;
      if (!P.has(k)) P.set(k, { ...r, s: rs });
    }
    const rows = [...P.values()].map(r => {
      const info = rowInfo(r.s, r.row),
        v = DUI.rowVal(r.s, r.row);
      return { ...info, s: r.s, other: r.s !== s ? dName(r.s) : '', cmp: r.cmp || '', want: r.want, ok: v === r.want, start: r.s === s && /\bSTART\b/.test(info.svc) && !/PERMI/.test(info.svc) };
    });
    const miss = rows.filter(r => !r.ok && !r.start);
    return { sheet: nm, rows: rows.filter(r => !r.start), miss, pb: pb || rows.some(r => r.start), live, eq: eq0 };
  }
  /* where a missing row comes from (the one world links, src/world/world.js W.idx.din): the output of another DITL sheet is followed
     to what that output needs, down to a row with no source = a field contact (limit switch ZSO / ZSC, LOCAL / REMOTE selector) that
     the field operator sets; a row fed by an ABC sheet is shown with its sheet (an operator action there) */
  function leaves(s, row, want, d, seen, out) {
    const k = s.name + ':' + row;
    if (seen.has(k) || d > 4) return;
    seen.add(k);
    const m = window.WORLD && WORLD.idx && WORLD.idx.din.get(s),
      srcs = m && m.get(row);
    /* 3.2.0 P1: the REMOTE selector of a MOV at its MCC (DITL-38 row 2, DITL-54 row 12): the valve model mirrors the row into its REMOTE
       output and the output feeds the row back; the row itself is the field contact */
    const mir = ((s.nl && s.nl.mv) || []).some(b => (b.fb || []).some(f => f.ty === 'MIL' && f.mir === row));
    if (mir) {
      if (!out.field.some(x => x.s === s && x.row === row)) out.field.push({ s, row, want, av: null, ...rowInfo(s, row) });
      return;
    }
    if (!srcs || !srcs.length) {
      /* a push button (START / STOP P.B.) is an operator action of another step, not a field contact */
      if (/P\.\s*B\.?|\bPB\b|PUSH/.test(rowInfo(s, row).svc)) return;
      if (!out.field.some(x => x.s === s && x.row === row)) {
        /* an analog row (a transmitter into a comparator): the field value that makes the comparator give `want` */
        const a = (s.nl.an || []).find(x => x.row === row),
          nets = DUI.rowNets(s, row, 'L') || [],
          g = a && (s.nl.gates || []).find(x => x.t === 'CMP' && nets.includes(x.ins[0]) && x.sp != null);
        let av = null;
        if (a && g) {
          const hi = g.cmp === '>' ? want : !want,
            sp = +g.sp;
          av = { key: a.key, x: hi ? sp + Math.max(0.5, Math.abs(sp) * 0.5) : sp - Math.max(0.5, Math.abs(sp) * 0.5), txt: g.sptxt || g.cmp + ' ' + sp + (g.unit || '') };
        }
        out.field.push({ s, row, want, av, ...rowInfo(s, row) });
      }
      return;
    }
    for (const q of srcs) {
      if (q.k === 'd') {
        if (!q.d.nl) q.d.nl = netlist(q.d);
        const on = (q.d.nl.outs || []).find(x => x.row === q.row);
        const L = on ? needNet(q.d, on.n, want ? 1 : 0, null, 0, new Set(), []) : [];
        for (const r of L) leaves(r.s, r.row, r.want, d + 1, seen, out);
      } else if (q.sh && !out.abc.includes(q.sh.name)) out.abc.push(q.sh.name);
    }
  }
  function fieldOf(addr) {
    const s = dOf(addr),
      I = s && interlock(addr),
      out = { field: [], abc: [], by: {} };
    if (!I || !I.live) return out;
    /* the LOCAL / REMOTE selector of the motor at the switchgear: REMOTE for a start from the DCS (a drawing that starts the motor
       through a pulse timer and a flip-flop does not list it in its interlock) */
    for (let r = 0; r < 40; r++)
      if (REM.test(rowInfo(s, r).svc) && (!I.eq || eqW(rowInfo(s, r).svc) === I.eq) && DUI.rowVal(s, r) !== 1) {
        const o = { field: [], abc: [] };
        try {
          leaves(s, r, 1, 0, new Set(), o);
        } catch (e) {}
        for (const f of o.field) if (!out.field.some(x => x.s === f.s && x.row === f.row)) out.field.push(f);
      }
    for (const r of I.miss) {
      const o = { field: [], abc: [] };
      try {
        leaves(r.s || s, r.row, r.want, 0, new Set(), o);
      } catch (e) {}
      out.by[(r.s || s).name + ':' + r.row] = o;
      for (const f of o.field) if (!out.field.some(x => x.s === f.s && x.row === f.row)) out.field.push(f);
      for (const a of o.abc) if (!out.abc.includes(a)) out.abc.push(a);
    }
    return out;
  }
  /* START / STOP of a motor from its DITL drawing (one world ON): the pushbutton input row of the drawing (CRT, no source) pressed
     for 1.5 s, the same as the PRESS of the Inputs tab; the motor runs only when the interlock of the drawing allows it */
  const pbRow = (s, re) => {
    const m = WORLD.idx && WORLD.idx.din.get(s);
    for (let r = 0; r < 40; r++) {
      const v = (rowInfo(s, r).svc || '').replace(/^[\w./ ]*?\d{4}\S*\s+/, '');
      if (re.test(v) && !/LOCAL|PERMI|COMMAND|AUTO/.test(v) && !(m && m.get(r))) return r;
    }
    return -1;
  };
  const PRESS = {},
    REL = {};
  /* a push button row of a DITL drawing (by name, machine A, or an instance "DITL-09 #B"), pressed (hold); dout = an output row of a drawing (1 / 0, null
     without the one world) */
  function dpress(nm, row) {
    const s = dSheet(nm);
    if (!s || !(window.WORLD && WORLD.on && WORLD.live)) return false;
    return hold(s, row + ':S');
  }
  /* one press of a push button row: held for two scans of the one world (and 1.5 s) and released (the drawing starts on the pulse); a press
     while it is held is the same press. In scans (simulation time), not in milliseconds: at x300 a 0.8 s press was 4 minutes of
     plant and a press again within 3 s (15 minutes) was lost (the batch firing of the coal feeder, 10 s ON / 60 s OFF) */
  function hold(s, k) {
    const id = s.name + '|' + k;
    if (PRESS[id]) return true;
    /* a press again right after the release (no scan saw the button open between them) is no new edge: the START pulse of the drawing
       never came and the coal feeder C never started while the guide pressed it every frame at x300. It waits one scan */
    const wait = REL[id] != null && (WORLD.tk || 0) - REL[id] < 1;
    PRESS[id] = { s, k, tk: WORLD.tk || 0, wait };
    if (!wait) s.sig[k] = true;
    WORLD.busy = true;
    if (!WORLD.onTick)
      WORLD.onTick = dt => {
        for (const j in PRESS) {
          const p = PRESS[j];
          if (p.wait) {
            if ((WORLD.tk || 0) - REL[j] >= 1) {
              p.wait = false;
              p.tk = WORLD.tk || 0;
              p.s.sig[p.k] = true;
              WORLD.busy = true;
            }
            continue;
          }
          p.age = (p.age || 0) + (dt || 0);
          /* at least 1.5 s of plant too: a motor seals in through its running feedback (0.5 s) while START is held */
          if ((WORLD.tk || 0) - p.tk >= 2 && p.age >= 1.5) {
            p.s.sig[p.k] = false;
            REL[j] = WORLD.tk || 0;
            delete PRESS[j];
          }
        }
      };
    return true;
  }
  /* a maintained selection of a DITL input row (the AUTO MODE of a shut-off valve chosen on the CRT, DITL-32 row 5 M.1012): stays until changed */
  function dset(nm, row, v) {
    const s = dSheet(nm);
    if (!s || !(window.WORLD && WORLD.on && WORLD.live)) return false;
    s.sig[row + ':S'] = !!v;
    WORLD.busy = true;
    return true;
  }
  function dout(nm, row) {
    const s = dSheet(nm);
    if (!s || !wlOn()) return null;
    try {
      if (!s.nl) s.nl = netlist(s);
      return DUI.outVal(s, row);
    } catch (e) {
      return null;
    }
  }
  /* the RUNNING output of a drawing */
  function runOut(nm) {
    const s = dSheet(nm);
    if (!s) return null;
    try {
      const ro = DUI.outs(s).find(o => /RUNNING/.test(o.name) && !/NOT RUNNING|STOP/.test(o.name));
      return ro ? dout(nm, ro.row) : null;
    } catch (e) {
      return null;
    }
  }
  function dmotor(addr, on) {
    const s = dOf(addr);
    if (!s || !(window.WORLD && WORLD.on && WORLD.live)) return false;
    try {
      if (!s.nl) s.nl = netlist(s);
    } catch (e) {
      return false;
    }
    const r = pbRow(s, on ? /\bSTART\b|\bST$/ : /\bSTOP\b/);
    if (r < 0) return false;
    return hold(s, r + ':S');
  }
  /* the field operator sets the contacts (the switch of the input row on its DITL sheet, the same as the Inputs tab) */
  function fieldSet(L) {
    for (const f of L) {
      if (f.av) {
        f.s.av = f.s.av || {};
        f.s.av[f.av.key] = f.av.x;
        try {
          f.s.nl.avk = avOf(f.s);
        } catch (e) {}
        continue;
      }
      f.s.sig[f.row + ':S'] = !!f.want;
      /* R9 #76: one address = one signal (CLAUDE.md 1): DITL-45 rows 5 and 9 are both I.0085 PLANT AIR DRYER-A REMOTE (the START and
         the STOP gate); setting one row left the other 0, shown red as missing */
      {
        const sv = rowInfo(f.s, f.row).svc;
        if (/\b[IM]\.[0-9A-F]{4}/.test(sv)) for (let r = 0; r < 40; r++) if (r !== f.row && rowInfo(f.s, r).svc === sv) f.s.sig[r + ':S'] = !!f.want;
      }
      /* the other limit switch of the same vane / damper: OPENED <-> CLOSED */
      const tw = f.svc.replace(/\bOPENED\b|\bOPEN\b|\bCLOSED\b/, w => (w === 'CLOSED' ? 'OPENED' : 'CLOSED'));
      if (tw !== f.svc)
        for (let r = 0; r < 40; r++) {
          const v = rowInfo(f.s, r).svc;
          if (r !== f.row && (v === tw || v === tw.replace('OPENED', 'OPEN'))) f.s.sig[r + ':S'] = !f.want;
        }
    }
    pscan();
    try {
      render();
    } catch (e) {}
  }
  /* retest #47: a maintained CRT selection of a DITL input row (SEAWATER PUMP x AUTO MODE SELECTED, DITL-29A row 4), logged; PAUSED too */
  function dsel(nm, row, v, txt) {
    const s = dSheet(nm);
    if (!s) return false;
    s.sig[row + ':S'] = !!v;
    if (WORLD.live) WORLD.busy = true;
    pscan();
    try {
      if (window.lsEventAdd) lsEventAdd(dName(s), 'DCS', 'Operator: ' + (txt || rowInfo(s, row).svc) + ' = ' + (v ? 1 : 0) + ' (row ' + (row + 1) + ')');
    } catch (e) {}
    setTimeout(() => fill(true), 200);
    return true;
  }
  /* 3.2.0 retest #33: a field action on one input row of a drawing (a compressor started at its local panel: DITL-113 row 5 RUNNING),
     logged in the Event log; PAUSED too */
  function fieldRow(nm, row, on, txt) {
    const s = dSheet(nm);
    if (!s) return false;
    s.sig[row + ':S'] = !!on;
    {
      const sv = rowInfo(s, row).svc; /* R9 #76: the other rows of the same address */
      if (/\b[IM]\.[0-9A-F]{4}/.test(sv)) for (let r = 0; r < 40; r++) if (r !== row && rowInfo(s, r).svc === sv) s.sig[r + ':S'] = !!on;
    }
    if (WORLD.live) WORLD.busy = true;
    pscan();
    try {
      if (window.lsEventAdd) lsEventAdd(dName(s), 'FIELD', 'Field operator: ' + (txt || rowInfo(s, row).svc) + ' (row ' + (row + 1) + ')');
    } catch (e) {}
    setTimeout(() => fill(true), 200);
    return true;
  }
  const rowInfo = (s, row) => {
    let tag = '',
      svc = '';
    try {
      const I = DUI.rowInfo ? DUI.rowInfo(s, row) : null;
      if (I) ({ tag, svc } = I);
    } catch (e) {}
    return { row, no: row + 1, tag, svc: svc || 'Input row ' + (row + 1) };
  };

  /* retest #69: the AUTO MODE SELECTED input row of a motor drawing (a maintained CRT selection), or null */
  function amRow(ds) {
    if (!ds) return null;
    if (ds._amr !== undefined) return ds._amr;
    let o = null;
    for (let r = 0; r < 60 && !o; r++) {
      const v = rowInfo(ds, r).svc;
      if (/\bAUTO MODE SELECTED\b/.test(v) && !/REMOTE/.test(v)) o = { s: ds, row: r, svc: svcN(v) };
    }
    return (ds._amr = o);
  }
  /* ---------- the panel ---------- */
  let dock = null,
    tabB = null,
    els = {},
    lastCur = -1,
    fpLive = [],
    fpKey = '',
    follow = ls.get('ls-gdock-follow', true);
  const mode = () => (innerWidth >= 900 && innerWidth >= innerHeight * 1.05 ? 'side' : 'bottom');
  const isMin = () => !!ls.get('ls-gdock-min', false);
  function layout() {
    const R = document.documentElement,
      on = !!(dock && GD() && GD().on),
      min = isMin(),
      m = mode();
    R.classList.toggle('gd-side', on && !min && m === 'side');
    R.classList.toggle('gd-bottom', on && !min && m === 'bottom');
    R.classList.toggle('gd-min', on && min);
    if (dock) dock.hidden = !on || min;
    if (tabB) tabB.hidden = !on || !min;
    const w = Math.max(340, Math.min(600, ls.get('ls-gdock-w', innerWidth >= 1300 ? 440 : 380), innerWidth - 480)),
      h = Math.max(240, Math.min(innerHeight * 0.7, ls.get('ls-gdock-h', Math.round(innerHeight * 0.42))));
    R.style.setProperty('--gdw', w + 'px');
    R.style.setProperty('--gdh', h + 'px');
    /* retest #41: no empty Inspector column beside the Training panel */
    call(() => AN.inspAuto && AN.inspAuto(on && !min));
    call(() => DUI.inspAuto && DUI.inspAuto(on && !min));
    try {
      dispatchEvent(new Event('resize'));
    } catch (e) {}
  }
  /* drag the edge of the panel: width (side) or height (bottom) */
  function grip(g) {
    let st = null;
    g.addEventListener('pointerdown', e => {
      st = { x: e.clientX, y: e.clientY, w: dock.offsetWidth, h: dock.offsetHeight };
      g.setPointerCapture(e.pointerId);
    });
    g.addEventListener('pointermove', e => {
      if (!st) return;
      if (mode() === 'side') ls.set('ls-gdock-w', Math.round(st.w - (e.clientX - st.x)));
      else ls.set('ls-gdock-h', Math.round(st.h - (e.clientY - st.y)));
      layout();
    });
    const end = () => (st = null);
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
  }
  function speedSel() {
    return [...document.querySelectorAll('select')].find(x => x.title === 'Simulation speed');
  }
  function setSpeed(v) {
    const s = speedSel();
    if (s) {
      s.value = String(v);
      s.dispatchEvent(new Event('change'));
    }
    try {
      if (typeof TSP !== 'undefined') TSP = v;
    } catch (e) {}
    paintSpeed();
  }
  function paintSpeed() {
    const v = +((window.AN && AN.spd) || 1);
    (els.spd || []).forEach(b => b.classList.toggle('on', +b.dataset.v === v));
  }
  /* 3.2.0 walkthrough #1 #16: the Training starts PAUSED; RUN / PAUSE from the panel (the ABC page or the DITL page, whichever is open) */
  const isRun = () =>
    !!(window.AN && ((AN.cat === 'an' && AN.run && !AN.view) || (AN.cat !== 'an' && typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE))));
  function runNow() {
    try {
      if (AN.cat === 'an') AN.runOn();
      else {
        const b = document.querySelector('.dui-run');
        if (b) b.click();
      }
    } catch (e) {}
    setTimeout(() => fill(true), 250);
  }
  function pauseNow() {
    try {
      if (AN.cat === 'an') AN.pauseOn();
      else if (typeof SIM !== 'undefined' && SIM) DPAUSE = true;
    } catch (e) {}
    setTimeout(() => fill(true), 250);
  }
  /* the SOP section of a step (1-based, as the Training list numbers it) */
  const secOf = s => (s ? s.sec || (s.field && s.field.length ? s.field[0] + 1 : null) : null);
  const nSec = () => (window.LS_PROC5002 || []).length;
  /* 3.2.0 walkthrough #14: one press back to the section in the Training list (the panel stays) */
  const toList = s => {
    try {
      const k = secOf(s);
      if (window.lsHome && lsHome.show) lsHome.show(k ? k - 1 : 0);
    } catch (e) {}
  };
  function build() {
    if (dock) return;
    dock = E('aside', { id: 'gdock', role: 'complementary', 'aria-label': 'Training' });
    const g = E('div', { cls: 'gd-grip', title: 'I-drag para palakihin o paliitin', 'aria-hidden': 'true' });
    grip(g);
    els.run = E('button', { type: 'button', cls: 'gd-pill', on: () => (isRun() ? pauseNow() : runNow()) });
    els.spd = [1, 10, 60, 300].map(v => E('button', { type: 'button', 'data-v': v, txt: '×' + v, title: 'Bilis ng simulation ×' + v, on: () => setSpeed(v) }));
    const hd = E('div', { cls: 'gd-hd' }, [
      E('b', { txt: 'Training' }),
      els.run,
      E('span', { cls: 'gd-sp' }),
      E('div', { cls: 'gd-seg', role: 'group', 'aria-label': 'Bilis' }, els.spd),
      /* retest #41: the width (or height) of the panel in three sizes, one press each (the edge can be dragged too) */
      E('button', {
        type: 'button',
        cls: 'gd-ic',
        txt: '⇔',
        title: 'Laki ng panel: makitid / katamtaman / malapad (o i-drag ang gilid)',
        on: () => {
          if (mode() === 'side') {
            const L = [340, 420, 540],
              w = ls.get('ls-gdock-w', 400);
            ls.set('ls-gdock-w', L[(L.findIndex(x => x >= w - 10) + 1) % L.length] || L[0]);
          } else {
            const L = [0.28, 0.42, 0.6].map(x => Math.round(innerHeight * x)),
              h = ls.get('ls-gdock-h', L[1]);
            ls.set('ls-gdock-h', L[(L.findIndex(x => x >= h - 10) + 1) % L.length] || L[0]);
          }
          layout();
        }
      }),
      E('button', { type: 'button', cls: 'gd-ic', txt: '▁', title: 'Itago ang Training (tuloy ang simulation)', on: () => (ls.set('ls-gdock-min', true), layout()) }),
      E('button', { type: 'button', cls: 'gd-ic', txt: '✕', title: 'Itigil ang Training', on: stopAsk })
    ]);
    els.vals = VALS.map(([k, u]) => {
      const b = E('b', { txt: '—' });
      const d = E('div', { cls: 'gd-kv' }, [E('small', { txt: k }), b, E('em', { txt: u })]);
      return { d, b };
    });
    els.lamps = LAMPS.map(([k, A, t]) => E('span', { cls: 'gd-lamp', txt: k, title: t, 'data-a': A.join(' ') }));
    const strip = E('div', { cls: 'gd-strip' }, [E('div', { cls: 'gd-kvs' }, els.vals.map(x => x.d)), E('div', { cls: 'gd-lamps' }, els.lamps)]);
    els.bar = E('i');
    els.stp = E('span');
    els.stg = E('span');
    els.secb = E('button', { type: 'button', cls: 'gd-secb', title: 'Buksan ang section na ito sa Training list (PR-OPE-5002)', on: () => toList(GD() && GD().steps()[GD().cur]) });
    const prog = E('div', { cls: 'gd-prog' }, [E('div', { cls: 'gd-bar' }, [els.bar]), E('div', { cls: 'gd-pl' }, [els.stp, els.secb, els.stg])]);
    els.body = E('div', { cls: 'gd-body' });
    dock.append(g, hd, strip, prog, els.body);
    document.documentElement.append(dock);
    tabB = E('button', { id: 'gdtab', type: 'button', title: 'Ipakita ang Training', on: () => (ls.set('ls-gdock-min', false), layout(), fill(true)) });
    document.documentElement.append(tabB);
    addEventListener('resize', () => {
      const m = mode();
      if (m !== build.m) {
        build.m = m;
        layout();
      }
    });
    build.m = mode();
  }
  function stopAsk() {
    const b = els.body;
    if (b.querySelector('.gd-ask')) return;
    const ask = E('div', { cls: 'gd-ask' }, [
      E('p', { txt: 'Itigil ang Training? Tuloy ang simulation ng planta; puwede mong ituloy mamaya sa Training page.' }),
      E('div', { cls: 'gd-btns' }, [
        E('button', { type: 'button', cls: 'gd-btn bad', txt: 'Itigil', on: stop }),
        E('button', { type: 'button', cls: 'gd-btn', txt: 'Huwag', on: () => ask.remove() })
      ])
    ]);
    b.prepend(ask);
  }
  /* ---------- open / close ---------- */
  function open() {
    build();
    /* 3.2.0-beta.25: the one world is always ON (no switch); turned on again only if a test turned it off */
    if (window.WORLD && !WORLD.on) WORLD.set(true);
    ls.set('ls-gdock-min', false);
    lastCur = -1;
    layout();
    fill(true);
  }
  function stop() {
    try {
      GD().stop();
    } catch (e) {}
    try {
      if (window.DUI && DUI.mark) DUI.mark(null);
    } catch (e) {}
    fpLive = [];
    fpKey = '';
    layout();
    try {
      window.lsHome && lsHome.train();
    } catch (e) {}
  }
  /* the guided start from Cold; resume = go on with the plant that runs */
  /* 3.2.0 walkthrough #1 #2: the start stays on the Training page (the first steps are field steps), PAUSED at 1x; done() when the cold
     plant is in (the page shows "Nilo-load ..." until then, #15) */
  function start(done) {
    const g = GD();
    if (!g) return;
    for (const k in PERM) delete PERM[k];
    g.start(() => {
      open();
      setSpeed(1);
      /* retest #13 (R7): no drawing is opened behind the Training page (beta.43 opened DITL-29A there on purpose); the Logic page
         shows the sheet of the step when it opens (app.js setTab -> follow) */
      document.body.classList.remove('hasmsg');
      if (done) done();
    });
  }
  function resume() {
    const g = GD();
    if (!g) return;
    try {
      window.lsSetTab && lsSetTab('logic');
    } catch (e) {}
    g.resume();
    open();
  }
  /* ---------- the main area follows the step: the DITL of a motor, the ABC sheet of a faceplate ---------- */
  function goStep(s, enter) {
    if (!follow || !s || goStep.busy) return;
    /* 3.2.0 walkthrough #2: a field card (no DCS button, no faceplate) shows its SOP section in the Training list, not the sheet that
       happened to be open (ABC-057 at the ESP step). Retest #2 #13: the Logic page opened on a field card shows no sheet of another
       step, it says so (body.lsfield, app.css) until a sheet is picked */
    if (s.need && !(s.a || []).length && !(s.fps || []).length) {
      if (!enter) return toList(s);
      fieldNote(s);
      return;
    }
    document.body.classList.remove('lsfield');
    goStep.busy = 1;
    try {
      /* 3.2.0-beta.26: a push button of a DITL drawing (BURNER ON of DITL-09, a discharge valve of DITL-20): that sheet, its row selected
         (a motor START goes first; was: the ABC sheet of the step's faceplate). Machine B ~ D open the drawing of A until they are sheets of their own (CHECKLIST 0.2) */
      /* the first motor of the step that is not running yet (the second SWP step opens SWP-B, not the running SWP-A) */
      const ms = (s.a || []).filter(a => a.stop && motAddr(a) && MOTOR[motAddr(a)]),
        /* R9 #73: a step already done (SWBP-A started, one is enough) stays on the running machine until Susunod (was: the B sheet,
           its REMOTE row red) */
        on1 = ms.find(a => call(() => a.on && a.on(), false)),
        nx = (on1 && (!s.max || call(() => GD().ready(), false)) ? on1 : null) || ms.find(a => !call(() => a.on && a.on(), false)) || ms[0],
        mot = nx ? motAddr(nx) : null;
      if (mot) {
        window.lsSetTab && lsSetTab('logic');
        /* retest #39: the first missing contact of its interlock on that sheet (the REMOTE row of the SWP), else its START P.B. row */
        const I = call(() => interlock(mot), null),
          ds = dOf(mot),
          r0 = I && I.miss.find(x => !x.other),
          pb = pbOf(nx, 1);
        openD(
          MOTOR[mot],
          r0 ? r0.row : pb && pb.sh === dName(ds) ? pb.row : null,
          230,
          r0 ? I.miss.filter(x => !x.other && svcN(x.svc) === svcN(r0.svc)).map(x => x.row) : null
        );
        els.goKey = mot;
        return;
      }
      const dg = (s.a || []).filter(a => !(a.hide && call(() => a.hide(), false))).map(a => a.dg).find(Boolean);
      if (dg) {
        window.lsSetTab && lsSetTab('logic');
        openD(dg[0], dg[1], 230);
        return;
      }
      const t = (s.fps || [])[0];
      if (t) {
        const tg = LV().ctlTag(t) || t,
          nm = AN.fpFind(tg);
        if (nm) {
          window.lsSetTab && lsSetTab('logic');
          if (AN.cat !== 'an') AN.setCat('an');
          /* 3.2.0-beta.26: the block of the tag, zoomed and selected (was: the whole sheet at Fit) */
          if (AN.showTag) setTimeout(() => AN.showTag(tg, nm), 60);
          else {
            const i = AN.sheets.findIndex(x => x.name === nm);
            if (i >= 0 && i !== AN.i) AN.go(i);
          }
        }
      }
    } catch (e) {
    } finally {
      goStep.busy = 0;
    }
  }
  function fieldNote(s) {
    const B = document.body,
      cv = document.getElementById('cv');
    let n = document.getElementById('lsfieldnote');
    if (!n && cv) {
      n = E('div', { id: 'lsfieldnote', role: 'note' });
      cv.append(n);
      /* a sheet picked from the list (or the ABC / DITL switch) shows that sheet */
      const off = () => B.classList.remove('lsfield');
      for (const id of ['side', 'shsel', 'tabs']) {
        const x = document.getElementById(id);
        if (x) x.addEventListener('click', off, true);
      }
    }
    if (n)
      n.textContent =
        'Hakbang ' +
        (GD().cur + 1) +
        ' ay field step (' +
        s.t +
        '): walang DCS sheet. Pumili ng sheet sa listahan, o pindutin ang "Susunod" sa Training.';
    B.classList.add('lsfield');
  }
  /* 3.2.0-beta.35 (CHECKLIST 0.2): open a DITL drawing by name, machine B ~ D on its own page ("DITL-29A #B" = SWP-B, the B chip of the
     sheet header); before, the drawing of machine A was opened for B ~ D */
  function openD(nm, row, zoom, rows) {
    const m = /\s*#([B-D])$/.exec(String(nm));
    document.body.classList.remove('lsfield');
    AN.xrefGo({ d: String(nm).replace(/\s*#\w+$/, '') });
    setTimeout(() => {
      try {
        if (window.DUI && DUI.setMach) DUI.setMach(m ? 'ABCD'.indexOf(m[1]) : 0);
        /* retest #39: from the Training, the row of the step zoomed in (row 0 = the top of the sheet when no row is named) */
        if ((row != null || zoom) && DUI.goItem)
          DUI.goItem(S.cur, undefined, null, { side: 'L', i: row != null ? row : 0, zoom: zoom || 0, rows });
      } catch (e) {}
      /* retest #38: the sheet the guide opens leaves no "Opened DITL-xx - use the ABC button ..." in the status bar (the dock says
         which sheet and row) */
      document.body.classList.remove('hasmsg');
    }, 80);
  }
  /* the running memory of a motor button (guide.js mot) */
  const motAddr = a => a.ad || null;
  /* the steps of SOP sections (0-based) with their kind (live.js: auto / field / tcs) */
  function fieldList(secs) {
    const P = window.LS_PROC5002 || [],
      out = [];
    for (const si of secs)
      (P[si] ? P[si].s : []).forEach((x, i) => {
        let k = 'field';
        try {
          k = LV().kind(si, i).k;
        } catch (e) {}
        /* R9 #81 #82: the Tag no. and Operating Limits of the SOP table; a line of a NOTE is shown as the note, not a tick */
        const lim = (window.LS_PROC5002_LIM || {})[si + '.' + i] || {};
        out.push({ si, i, t: x.t, k, lim, g: lim.g || (x.g || []).join(', ') });
      });
    return out;
  }
  const opLog = (l, pb) => {
    try {
      if (window.lsEventAdd) lsEventAdd(pb ? pb.sh : 'DCS', 'DCS', 'Operator: ' + l + (pb ? ' · ' + pb.txt : ''));
    } catch (e) {}
  };
  /* the CRT push button row of a step button: a DITL push button (dg) or the START / STOP P.B. of a motor drawing */
  function pbOf(a, on) {
    return call(() => {
      if (a.dg) {
        if (!on) return null;
        const ds = dSheet(a.dg[0]);
        if (!ds) return null;
        const r = a.dg[1],
          tg = rowInfo(ds, r).tag;
        return { sh: a.dg[0], row: r, txt: String(a.dg[0]) + ' row ' + (r + 1) + (tg ? ' · ' + tg : '') };
      }
      const ad = a.stop ? motAddr(a) : null,
        ds = ad && dOf(ad);
      if (!ds) return null;
      if (!ds.nl) ds.nl = netlist(ds);
      const r = pbRow(ds, on ? /\bSTART\b|\bST$/ : /\bSTOP\b/);
      if (r < 0) return null;
      const nm = dName(ds),
        b0 = /#[B-D]$/.test(nm) ? dSheet(nm.replace(/\s*#\w+$/, '')) : null;
      let tg = rowInfo(ds, r).tag;
      /* a machine B / C row whose text is still the one of machine A (no memory of its own read): no tag rather than the tag of A */
      if (b0 && b0 !== ds && tg && tg === rowInfo(b0, r).tag) tg = '';
      return { sh: nm, row: r, txt: nm + ' row ' + (r + 1) + (tg ? ' · ' + tg : '') };
    }, null);
  }
  /* the service text of a row without its address prefix ("I.032C/528/81C SEAWATER PUMP A REMOTE MODE SELECTED" = row 22 "SEAWATER PUMP A
     REMOTE MODE SELECTED": one signal, walkthrough #18) */
  /* R9 #76: the machine of a row / an output ("INSTRUMENT AIR DRYER-A" of "... REMOTE" / "... RUNNING · CRT") */
  const eqW = x =>
    svcN(String(x || '').replace(/^Output row \d+ · /, '').replace(/\s*·.*$/, ''))
      .replace(/\b(REMOTE|RUNNING|LOCAL)\b.*$/, '')
      .trim();
  const svcN = x =>
    String(x || '')
      .replace(/^\(FROM STATION WIRING\)\s*/, '')
      .replace(/^[\w./]*\d\S*\s+/, '')
      .trim();
  /* a DITL button (motor, valve, push button) pressed while PAUSED: nothing would move; the card says why */
  function pausedWarn(a) {
    if (isRun() || a.loc || !(a.stop || a.dg || a.ad)) return false; /* a field action (local panel) is done while PAUSED too */
    if (els.pw) {
      els.pw.hidden = false;
      els.pw.textContent = '❚❚ Naka-PAUSE: pindutin muna ang ▶ RUN (hinto ang oras, walang aandar).';
      clearTimeout(pausedWarn.t);
      pausedWarn.t = setTimeout(() => els.pw && (els.pw.hidden = true), 5000);
    }
    return true;
  }
  /* ---------- the content ---------- */
  function fill(force) {
    const g = GD();
    if (!dock || !g || !g.on || isMin()) return;
    const L = g.steps(),
      i = g.cur,
      s = L[i];
    const R = isRun();
    els.run.textContent = R ? '● RUN · ❚❚' : '❚❚ PAUSED · ▶';
    els.run.className = 'gd-pill' + (R ? ' on' : ' off');
    els.run.title = R ? 'Tumatakbo ang simulation: pindutin para i-PAUSE' : 'Naka-PAUSE (hinto ang oras): pindutin para RUN';
    paintSpeed();
    els.bar.style.width = Math.round((100 * Math.min(i, L.length)) / L.length) + '%';
    els.stp.textContent = s ? 'Hakbang ' + (i + 1) + ' / ' + L.length : 'Tapos: ' + L.length + ' / ' + L.length;
    /* 3.2.0 walkthrough #11: the SOP section of the step (the Training list numbers) */
    const sk = secOf(s);
    els.secb.textContent = sk ? 'Section ' + sk + ' / ' + nSec() + ' ↗' : '';
    els.secb.hidden = !sk;
    els.stg.textContent = s ? g.STAGES[s.st] || '' : '150 MW';
    if (!force && i === lastCur && R === els.wasR) return live();
    els.wasR = R;
    const first = i !== lastCur;
    lastCur = i;
    const b = els.body;
    b.textContent = '';
    if (!s) {
      b.append(
        E('div', { cls: 'gd-card done' }, [
          E('div', { cls: 'gd-eb', txt: 'TAPOS' }),
          E('h3', { txt: 'Nasa 150 MW na ang planta' }),
          E('p', { txt: 'Natapos mo ang start-up mula Cold. Puwede mong subukan ang load change sa Training page (Practise: 150 MW).' })
        ])
      );
      return;
    }
    const col1 = E('div', { cls: 'gd-c1' }),
      col2 = E('div', { cls: 'gd-c2' });
    const prev = L[i - 1];
    /* R9 #72: back to the step before ("‹ Nakaraan"): it opens again, done or not (its ✓ TAPOS and Susunod come back from the plant) */
    if (prev)
      col1.append(
        E('div', { cls: 'gd-done' }, [
          E('button', { type: 'button', cls: 'gd-btn gd-prev', txt: '‹ Nakaraan', title: 'Bumalik sa Hakbang ' + i, on: () => (g.open(i - 1), fill(true), followNow()) }),
          E('span', { txt: i + ' · ' + prev.t })
        ])
      );
    /* 3.2.0 walkthrough #1 #16: PAUSED = the time stopped; a field step is confirmed anyway, a DCS step needs RUN */
    if (!R)
      col1.append(
        E('div', { cls: 'gd-pause' }, [
          E('span', { txt: s.need && !s.c ? '❚❚ Naka-PAUSE ang oras. Puwede mong kumpirmahin ang field step; pindutin ang ▶ RUN bago ang DCS step.' : '❚❚ Naka-PAUSE ang oras: walang aandar (START / OPEN) hangga’t hindi RUN.' }),
          E('button', { type: 'button', cls: 'gd-btn go', txt: '▶ RUN', on: runNow })
        ])
      );
    /* the card */
    const card = E('div', { cls: 'gd-card' });
    card.append(E('div', { cls: 'gd-eb', txt: 'HAKBANG ' + (i + 1) + ' · ' + (g.STAGES[s.st] || '').toUpperCase() }), E('h3', { txt: s.t }));
    /* retest #44: one line to do on top; a longer explanation folded under "Bakit?" */
    {
      const d = String(s.d || ''),
        m = /^(Gawin:[^.]*\.?)\s*(.*)$/.exec(d);
      /* R9 #89: every step has a "Gawin:" line (a step written without one: its title, which is the action) and the reason under
         "Bakit?" (was: only 8 steps had them) */
      card.append(E('p', { cls: 'gd-do', txt: m ? m[1] : 'Gawin: ' + String(s.t || '').replace(/\.?$/, '.') }));
      const rest = m ? m[2] : d;
      if (rest) card.append(E('details', { cls: 'gd-why' }, [E('summary', { txt: 'Bakit?' }), E('p', { txt: rest })]));
    }
    els.cond = E('div', { cls: 'gd-cond' });
    card.append(els.cond);
    /* 3.2.0 retest #30: a done step waits for the trainee: "✓ TAPOS" with its result, then "Susunod ›" (was: the next step at once) */
    els.okt = E('span');
    els.okb = E('div', { cls: 'gd-okb', hidden: '' }, [
      els.okt,
      E('button', { type: 'button', cls: 'gd-btn go', txt: 'Susunod ›', on: () => (g.next() ? fill(true) : null) })
    ]);
    card.append(els.okb);
    /* the field items of a field card / a DCS step. 3.2.0 walkthrough #4 #17: every step of the SOP section (the same list and the same
       ticks as the Training list, ls-train), open, with a check box; an AUTO step ticks from the logic (was: the field items only, folded) */
    els.trKey = null;
    els.after = [];
    els.auIt = [];
    els.before = [];
    const fli = s.field && s.field.length ? fieldList(s.field) : [];
    if (fli.length) {
      const A = call(() => LV().done(), {}),
        dd0 = ls.get('ls-train', {});
      card.append(E('div', { cls: 'gd-flh', txt: 'SOP SECTION ' + s.field.map(x => x + 1).join(', ') + ' · ' + fli.length + ' ITEM' + (fli.length > 1 ? 'S' : '') }));
      /* 3.2.0 retest #27: a step that starts equipment: the items before the START (line-up, permissives) and the items from the START
         on (monitor, adjust, standby to AUTO), these locked until the equipment runs */
      /* retest #50 #45: the START item itself is the last item BEFORE the start (it ticks AUTO when the equipment runs); an AUTO item of the
         logic first ("Initiate RUN" of a compressor, not the "START Auxiliary Oil Pump" before it) */
      const hasM = (s.a || []).some(a => a.stop || a.loc || a.mot || a.sel || /START|ON\b/.test(a.l)),
        stRe = /\bstart\b(?![\s-]*up)|\binitiate[ds]?\s+(on|run)\b/i,
        c0 = fli.findIndex(f => stRe.test(f.t) && f.k === 'auto'),
        c1 = c0 >= 0 ? c0 : fli.findIndex(f => stRe.test(f.t)),
        cut = hasM && c1 >= 0 ? c1 + 1 : -1;
      els.auIt = [];
      els.after = [];
      els.trKey = JSON.stringify(dd0);
      let ul = E('ul', { cls: 'gd-fl' });
      if (cut >= 0) {
        card.append(E('div', { cls: 'gd-flg', txt: 'BAGO I-START' }));

      }
      const notes = new Set();
      fli.forEach((f, fi) => {
        if (f.lim.note) {
          /* R9 #82: the NOTE of the SOP (auto-start conditions MOP / COP / EOP, bearing oil temperatures): read once, not ticked */
          if (!notes.has(f.lim.x)) {
            notes.add(f.lim.x);
            ul.append(E('li', { cls: 'gd-note' }, [E('span', { txt: f.lim.x })]));
          }
          return;
        }
        if (fi === cut) {
          card.append(ul);
          ul = E('ul', { cls: 'gd-fl' });
          card.append(E('div', { cls: 'gd-flg', txt: 'PAGKATAPOS I-START (bukas kapag tumatakbo na)' }));
        }
        const id = 'gdf' + f.si + '_' + f.i,
          k = f.si + '.' + f.i,
          au = f.k === 'auto',
          cb = E('input', { type: 'checkbox', id });
        cb.checked = au ? !!A[k] : !!dd0[k];
        /* R9 #81: the tag and the operating limit of the item (SOP table: Normal / Alarm / Trip; a NOTE under the step) */
        const L0 = f.lim,
          lm = [L0.n ? 'Normal ' + L0.n : '', L0.a ? 'Alarm ' + L0.a : '', L0.tr ? 'Trip ' + L0.tr : ''].filter(Boolean).join(' · '),
          xn = L0.x && !fli.some(q => q.lim.note && q.lim.x === L0.x) ? L0.x : '';
        const li = E('li', { cls: cb.checked ? 'dn' : '' }, [
          cb,
          E('label', { for: id }, [
            f.t,
            au ? E('em', { txt: 'AUTO' }) : f.k === 'tcs' ? E('em', { txt: 'TCS' }) : null,
            f.g || lm || xn ? E('small', { cls: 'gd-lim' }, [f.g ? E('b', { cls: 'gd-tg', txt: f.g }) : null, lm ? ' ' + lm : '', xn ? ' ' + xn : '']) : null
          ])
        ]);
        if (au) {
          cb.disabled = true;
          cb.title = 'AUTO: kusang nati-tick kapag ipinakita ng logic na tapos (RUN)';
        }
        cb.onchange = () => {
          const dd = ls.get('ls-train', {});
          if (cb.checked) dd[k] = 1;
          else delete dd[k];
          ls.set('ls-train', dd);
          els.trKey = JSON.stringify(dd);
          li.classList.toggle('dn', cb.checked);
          /* 3.2.0 retest #26: the Training list shows the same tick at once */
          try {
            window.lsHome && lsHome.train && lsHome.train();
          } catch (e) {}
        };
        if (cut >= 0 && fi >= cut && !au) els.after.push({ cb, li });
        if (cut >= 0 && fi < cut && !au) els.before.push(cb);
        if (au) els.auIt.push({ k, cb, li });
        ul.append(li);
      });
      card.append(ul);
    }
    /* the interlock of the motors of the step */
    els.il = [];
    for (const a of s.a || []) {
      const ad = a.stop || a.dg ? motAddr(a) : null; /* 3.2.0-beta.30: a BURNER ON (dg) has its interlock too (DITL-12 out 7) */
      if (ad && MOTOR[ad] && !els.il.some(x => x.ad === ad)) {
        const box = E('div', { cls: 'gd-il' });
        els.il.push({ ad, box });
        card.append(box);
      }
    }
    /* the buttons */
    els.btns = [];
    const bs = E('div', { cls: 'gd-btns' });
    for (const a of s.a || []) {
      const ad = a.stop || a.dg ? motAddr(a) : null; /* 3.2.0-beta.30: a BURNER ON (dg) has its interlock too (DITL-12 out 7) */
      /* 3.2.0 walkthrough #21: the push button of the drawing under the label (sheet, row, tag of the CRT P.B.); pressed, the row is
         shown on the sheet when the centre follows the step */
      const pb = pbOf(a, 1);
      const bt = E('button', { type: 'button', cls: 'gd-btn' + (a.stop ? ' go gd-st' : '') }, [a.l, pb ? E('small', { txt: pb.txt }) : null]);
      bt.onclick = () => {
        if (bt.dataset.block === '1') return;
        if (pausedWarn(a)) return;
        /* retest #65 (R8: SWP-A started with 0 / 15 BAGO I-START items ticked): a START with the line-up not done is warned; a second
           press within 15 s goes on (training override, logged) */
        if (a.stop && !call(() => a.on(), false)) {
          const nb = (els.before || []).length,
            nd = (els.before || []).filter(c => c.checked).length;
          if (nb && nd < nb) {
            if (!(bt._ovr && Date.now() - bt._ovr < 15000)) {
              bt._ovr = Date.now();
              if (els.ovw) {
                els.ovw.hidden = false;
                els.ovw.textContent = '⚠ ' + nd + ' / ' + nb + ' BAGO I-START items pa lang ang tapos. Tapusin muna ang line-up sa field, o pindutin ulit ang ' + a.l + ' para ituloy (training override, naka-log).';
              }
              return;
            }
            bt._ovr = 0;
            call(() => lsEventAdd('DCS', 'DCS', 'Training override: ' + a.l + ' with ' + nd + ' / ' + nb + ' BAGO I-START items done'));
          }
        }
        try {
          a.f();
        } catch (e) {}
        /* retest #63: the DCS command in the Event log (sheet, row and tag of its CRT push button) */
        if (!a.loc) opLog(a.l, pb); /* a field button logs itself (FIELD) */
        if (pb && follow) openD(pb.sh, pb.row);
        setTimeout(() => fill(), 300);
      };
      bs.append(bt);
      const B = { a, bt, ad };
      els.btns.push(B);
      if (a.stop) {
        const pb0 = pbOf(a, 0);
        const sb = E('button', { type: 'button', cls: 'gd-btn gd-sp0' }, [a.stop.l, pb0 ? E('small', { txt: pb0.txt }) : null]);
        B.sb = sb;
        sb.onclick = () => {
          if (pausedWarn(a)) return;
          try {
            a.stop.f();
          } catch (e) {}
          opLog(a.stop.l, pb0);
          if (pb0 && follow) openD(pb0.sh, pb0.row);
          setTimeout(() => fill(), 300);
        };
        bs.append(sb);
      }
      /* 3.2.0 retest #29 #34: the state of the equipment from its feedback: RUNNING (red), STOPPED (green), TRIP (amber, flashing until
         ACK: press it to acknowledge) */
      if (a.stop || a.loc || a.mot) {
        B.lab = E('button', {
          type: 'button',
          cls: 'gd-mst',
          txt: '—',
          title: 'Feedback ng equipment (RUNNING / STOPPED / TRIP)',
          on: () => B.ad && tripAck(B.ad)
        });
        bs.append(B.lab);
        /* retest #34: a Training fault, the motor protection relay trips in the field (the motor stops, TRIP flashes until ACK, alarm,
           Event log); the field resets the relay, then the operator starts again */
        if (a.stop && B.ad) {
          B.ft = E('button', {
            type: 'button',
            cls: 'gd-btn gd-ft',
            txt: 'FIELD: TRIP',
            hidden: true,
            title: 'Training fault: nag-trip ang protection relay ng motor sa field',
            on: () => {
              const ds = dOf(B.ad);
              if (!ds) return;
              ds._ftrip = !ds._ftrip;
              if (WORLD.live) WORLD.busy = true;
              call(() =>
                lsEventAdd(
                  dName(ds),
                  'FIELD',
                  'Field: ' +
                    (ds._ftrip ? 'protection relay TRIP of ' : 'protection relay RESET of ') +
                    a.l.replace(/^START\s+/, '') +
                    (ds._ftrip ? ' (Training fault)' : '')
                )
              );
              setTimeout(() => fill(true), 300);
            }
          });
          bs.append(B.ft);
        }
        /* retest #69 #47 (R8: no way to put the standby SWP in AUTO, Hakbang 2 stuck): the AUTO / MAN selection of the motor when its
           drawing has one (a CRT input row "... AUTO MODE SELECTED": DITL-29A row 4, M.1152 / 1162 / 1172), on every motor of the step */
        const am = a.stop && B.ad ? amRow(dOf(B.ad)) : null;
        if (am) {
          B.am = Object.assign(
            E('button', {
              type: 'button',
              cls: 'gd-btn gd-am',
              txt: 'MAN',
              on: () => {
                const v = !(call(() => DUI.rowVal(am.s, am.row), null) === 1 || (am.s.sig && am.s.sig[am.row + ':S']));
                dsel(dName(am.s), am.row, v, a.l.replace(/^START\s+/, '') + (v ? ' AUTO' : ' MAN') + ' (' + am.svc + ')');
              }
            }),
            { _am: am }
          );
          bs.append(B.am);
        }
        bs.append(E('span', { cls: 'gd-brk' }));
      }
    }
    if (s.need) {
      const cb = E('button', { type: 'button', cls: 'gd-btn go', txt: s.pre ? 'Tapos na ang ' + Math.round(s.pre / 3600) + ' h purge' : 'Tapos na ito sa field' });
      /* retest #55: a card with a field time (the 6 h ESP purge): "Tapos na" only when the time is over (dock live: els.preCb); the
         purge not started yet can be skipped only as a training shortcut, asked and logged */
      if (s.pre) els.preCb = { b: cb, i: s.i };
      /* 3.2.0 walkthrough #16: works PAUSED too; #4: the field items of the section are ticked in the Training list as well */
      cb.onclick = () => {
        if (s.pre) {
          const hd = call(() => g.holdOf(s), null);
          if (!hd || hd[0] < hd[1]) return;
        }
        const dd = ls.get('ls-train', {});
        for (const f of fli) if (f.k !== 'auto') dd[f.si + '.' + f.i] = 1;
        ls.set('ls-train', dd);
        try {
          window.lsHome && lsHome.train && lsHome.train();
        } catch (e) {}
        g.confirm(s.i);
        g.scan();
        /* retest #64 (one step flow): a field card confirmed shows "✓ TAPOS" and waits for "Susunod ›", like a DCS step and like the
           shortcut (was retest #30: the confirmation went on to the next step at once) */
        fill(true);
      };
      bs.append(cb);
      /* 3.2.0 walkthrough #5: the 6 h of the ESP purge held in plant time (RUN, x300 = about 72 s) */
      if (s.pre)
        bs.append(
          E('button', {
            type: 'button',
            cls: 'gd-btn',
            txt: 'Simulan ang ' + Math.round(s.pre / 3600) + ' h purge (oras ng planta)',
            on: () => {
              const dd = ls.get('ls-train', {});
              for (const f of fli) if (f.k !== 'auto') dd[f.si + '.' + f.i] = 1;
              ls.set('ls-train', dd);
              g.preStart(s.i);
              fill(true);
            }
          }),
          (els.preSkip = E('button', {
            type: 'button',
            cls: 'gd-btn',
            txt: 'Laktawan ang ' + Math.round(s.pre / 3600) + ' h (training shortcut)',
            title: 'Para lang kung tapos na ang purge sa field: kailangan ng kumpirmasyon at naka-log sa Events',
            on: () => {
              if (!confirm('Laktawan ang ' + Math.round(s.pre / 3600) + ' h ESP purge? Training shortcut ito: ituturing na tapos na ang purge sa field. Naka-log ito sa Events.')) return;
              if (window.lsEventAdd) lsEventAdd('ESP', 'FIELD', 'Training shortcut: ' + Math.round(s.pre / 3600) + ' h ESP purge skipped (taken as done in the field)');
              const dd = ls.get('ls-train', {});
              for (const f of fli) if (f.k !== 'auto') dd[f.si + '.' + f.i] = 1;
              ls.set('ls-train', dd);
              try {
                window.lsHome && lsHome.train && lsHome.train();
              } catch (e) {}
              g.confirm(s.i);
              g.scan();
              /* retest #64 (R8: after the skip the dock went on to Hakbang 2 and to the Logic page by itself): "✓ TAPOS (nilaktawan)",
                 then the trainee's "Susunod ›" */
              els.skipped = s.i;
              fill(true);
            }
          }))
        );
    }
    if (bs.children.length) card.append(bs);
    els.early = E('div', { cls: 'gd-warn', hidden: '' });
    els.pw = E('div', { cls: 'gd-warn', hidden: '' });
    els.ovw = E('div', { cls: 'gd-warn', hidden: '' });
    card.append(els.pw, els.ovw, els.early);
    col1.append(card);
    /* the faceplates of the step */
    const key = (s.fps || []).join(',');
    if (key !== fpKey || first) {
      fpKey = key;
      fpLive = [];
      els.fps = E('div', { cls: 'gd-fps' });
      for (const t0 of s.fps || []) {
        const t = call(() => LV().ctlTag(t0), null) || t0;
        const box = E('div', { cls: 'body' });
        let r = null;
        try {
          r = AN.fpBuild(t, box);
        } catch (e) {}
        if (!r) continue;
        fpLive = fpLive.concat(r.live);
        els.fps.append(E('div', { cls: 'gd-fp' }, [E('div', { cls: 'gd-fph' }, [E('b', { txt: t }), E('span', { txt: r.sheet })]), box]));
      }
    }
    /* the values to watch */
    /* 3.2.0-beta.26 (user 2026-10-25: "hindi recognized kung ano ang dapat i-monitor"): first the PV of what this step controls (the
       tags of its faceplates) and the motors it starts, then the values of the stage (was: the stage only: the condensate step showed the
       drum level and the FW flow) */
    /* 3.2.0-beta.33 (CHECKLIST 0.4): the row says WHAT it is (the description of the controller), its tag and its unit (from the range
       of its faceplate, "[0.0 ~ 400.0 T/H]"); a hand station shows its output (MV %); a value the stage list already shows (furnace
       pressure = PICFG108, drum level, FW flow, coal, O2 ...) is not repeated (was "LICCD1110A PV" with no name and no unit) */
    /* 3.2.0 walkthrough #6: a field card has no values of the stage to watch (the ESP step showed the seawater pumps of the next step) */
    /* retest #51 #46: a step with its own values (s.w: the equipment of the step); the utilities (stage 0) show no values of another step */
    const stage = s.w ? s.w.map(x => [x[0], x[1], x[2], x[3] || (v => (typeof v === 'number' ? f1(v) : v == null ? '—' : String(v))), x[4]]) : (s.need && !s.c) || s.st === 0 ? [] : WATCH[s.st] || [],
      have = new Set(stage.map(x => x[5]).filter(Boolean));
    /* "DRUM LEVEL CONTROL (FEED WATER FLOW CONTROL)" -> "Feed water flow"; "COND. DUMPING ... / DEAERATOR LEVEL CONTROL" -> "Deaerator level" */
    const nice = d0 => {
      let d = String(d0 || '').replace(/^#\d\s*/, '');
      const m = /\(([^)]*?)\s*CONTROL(?:LER)?\)/i.exec(d);
      if (m) d = m[1];
      else if (d.includes('/')) d = d.split('/').pop();
      d = d.replace(/\s*\bCONTROL(?:LER)?\b.*$/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (d.length > 36) d = d.slice(0, 36).replace(/\s+\S*$/, '') + '…';
      return d.replace(/^./, c => c.toUpperCase());
    };
    const own = [];
    for (const t0 of (s.fps || []).slice(0, 3)) {
      const t = call(() => LV().ctlTag(t0), null) || t0;
      if (have.has(t)) continue;
      const f = call(() => LV().fp(t), null),
        fpBox = els.fps && [...els.fps.children].find(x => (x.querySelector('.gd-fph b') || {}).textContent === t),
        u = ((/\[\s*-?[\d.]+\s*~\s*-?[\d.]+\s*([^\]\d][^\]]*)\]/.exec((fpBox && fpBox.textContent) || '') || [])[1] || '').trim();
      if (f && f.kind === 'man') own.push([t + ' output (MV)', () => call(() => LV().mvOf(LV().fp(t)), NaN), '%', f1, '']);
      else own.push([(nice(f && f.c && f.c.desc) || t) + ' · ' + t, () => call(() => LV().pvOf(LV().fp(t)), NaN), u, f1, call(() => 'SV ' + f1(LV().svOf(LV().fp(t))), '')]);
    }
    const ms = (s.a || []).filter(a => a.stop && a.on);
    if (ms.length) own.push(['Running', () => ms.filter(a => call(() => a.on(), false)).length + ' / ' + ms.length, '', x => x, ms.map(a => a.l.replace(/^START /, '')).join(', ')]);
    /* R9 #74: the operating limits of the SOP table of this step's sections (field gauges: ACW strainer DP, dryer T1 ~ T7, oil
       pressures), each with its range: what the field operator reads and reports */
    const sop = [];
    for (const f of fli || []) {
      if (f.lim.note) continue;
      const rg = /\(([^()]*\d[^()]*~[^()]*)\)/.exec(f.t),
        lm = [f.lim.n ? f.lim.n : rg ? rg[1] : '', f.lim.a ? 'Alarm ' + f.lim.a : '', f.lim.tr ? 'Trip ' + f.lim.tr : ''].filter(Boolean);
      if (!lm.length) continue;
      const nm = f.t.replace(/\s*\([^()]*\d[^()]*~[^()]*\)/, '').replace(/^(Check|Verify|Ensure)\s+(that\s+)?(the\s+)?/i, '');
      sop.push(['SOP · ' + (nm.length > 34 ? nm.slice(0, 34).replace(/\s+\S*$/, '') + '…' : nm), () => lm[0], '', x => x, [f.g, lm.slice(1).join(' · ')].filter(Boolean).join(' · ')]);
    }
    els.watch = own.concat(stage, sop.slice(0, 8)).map(([k, f, u, fm, hint]) => {
      const v = E('b', { txt: '—' });
      return { r: E('div', { cls: 'gd-wr' }, [E('span', { txt: k }), E('span', {}, [v, E('em', { txt: u }), hint ? E('small', { txt: hint }) : null])]), v, f, fm };
    });
    if (els.watch.length) col2.append(E('div', { cls: 'gd-watch' }, [E('div', { cls: 'gd-h', txt: 'BANTAYAN SA HAKBANG NA ITO' })].concat(els.watch.map(x => x.r))));
    /* 3.2.0-beta.33: the faceplates under the values to watch (the values are what the operator reads all the time; two faceplates pushed them
       under the screen) */
    if (els.fps && els.fps.children.length) col2.append(els.fps);
    /* the coach */
    const co = Object.keys(g.CO);
    if (co.length)
      col2.append(
        E(
          'div',
          { cls: 'gd-coach' },
          [E('div', { cls: 'gd-h', txt: 'COACH (katulong sa board)' })].concat(
            co.map(id => {
              const sw = E('button', { type: 'button', cls: 'gd-tg on', 'aria-pressed': 'true', title: 'Patayin: ikaw ang hahawak' });
              sw.onclick = () => (g.coachOff(id), fill(true));
              return E('div', { cls: 'gd-cr' }, [E('span', { txt: (g.coach[id] && g.coach[id].t) || id }), sw]);
            })
          )
        )
      );
    /* follow + the next steps */
    const fl = E('label', { cls: 'gd-follow' }, [E('input', { type: 'checkbox' }), ' Sundan ng gitna ang hakbang (DITL o ABC sheet)']);
    fl.firstChild.checked = !!follow;
    fl.firstChild.onchange = e => {
      follow = e.target.checked;
      ls.set('ls-gdock-follow', follow);
      if (follow) goStep(s);
    };
    col2.append(fl);
    const nx = L.slice(i + 1, i + 3);
    if (nx.length) col2.append(E('div', { cls: 'gd-next' }, nx.map((x, k) => E('div', { txt: i + 2 + k + ' · ' + x.t }))));
    b.append(col1, col2);
    if (first) {
      els.goKey = null;
      /* retest #38: a message of the sheet opened before (the status bar "Opened DITL-29A ...") does not stay on a new step */
      document.body.classList.remove('hasmsg');
      goStep(s);
    }
    live();
  }
  /* the live part, 4 times a second */
  function live() {
    const g = GD();
    if (!dock || !g || !g.on || isMin()) return;
    const s = g.steps()[g.cur];
    VALS.forEach(([k, u, f, fm], j) => (els.vals[j].b.textContent = fm(call(f, NaN))));
    /* 3.2.0 retest #25 #34: RUN = red, STOP = green (power plant convention), TRIP = amber, flashing until ACK */
    LAMPS.forEach(([k, A], j) => {
      const tr = A.filter(a => mst(a) === 'TRIP');
      els.lamps[j].classList.toggle('on', any(A));
      els.lamps[j].classList.toggle('trip', tr.length > 0);
      els.lamps[j].classList.toggle('blink', tr.some(tripNew));
    });
    /* the rate of the water temperature (Fig 1), over the last minute of the plant */
    const t = +U().t || 0,
      x = +U().Tw;
    if (rate.t == null || t < rate.t) rate = { t, x, r: 0 };
    else if (t - rate.t >= 60) {
      rate.r = ((x - rate.x) * 3600) / (t - rate.t);
      rate.t = t;
      rate.x = x;
    }
    if (!s) return;
    /* 3.2.0 retest #26: a tick made in the Training list shows here (the list and the panel are the same ticks, ls-train) */
    if (els.trKey != null && JSON.stringify(ls.get('ls-train', {})) !== els.trKey) return fill(true);
    (els.watch || []).forEach(w => (w.v.textContent = w.fm(call(w.f, NaN))));
    /* R9 #70: the "⚠ 0 / n BAGO I-START" warning goes away once the items are ticked or the machine runs (it stayed on) */
    if (els.ovw && !els.ovw.hidden) {
      const nb = (els.before || []).length,
        nd = (els.before || []).filter(c => c.checked).length;
      if (nd >= nb || (s.a || []).some(a => a.stop && call(() => a.on(), false))) els.ovw.hidden = true;
      else els.ovw.textContent = els.ovw.textContent.replace(/^⚠ \d+ \/ \d+/, '⚠ ' + nd + ' / ' + nb);
    }
    const rd = call(() => g.ready(), false);
    if (els.okb) {
      els.okb.hidden = !rd;
      if (rd) els.okt.textContent = '✓ TAPOS' + (els.skipped === s.i ? ' (nilaktawan: training shortcut)' : s.c && s.c.now ? ': ' + call(() => s.c.now(), '') : s.need ? ': nakumpirma sa field' : '');
    }
    /* 3.2.0 retest #27: the items after the START open when the equipment runs */
    /* retest #45: the AUTO items tick here as soon as the logic latches them (was: only when the step was drawn again) */
    const AD = call(() => LV().done(), {});
    for (const x of els.auIt || []) {
      const v = !!AD[x.k];
      if (x.cb.checked !== v) {
        x.cb.checked = v;
        x.li.classList.toggle('dn', v);
      }
    }
    const runs = s.runN ? call(() => s.runN(), 0) > 0 : (s.a || []).some(a => (a.stop || a.loc || a.mot) && a.on && call(() => a.on(), false)) || (!!s.c && call(() => s.c.ok(), false));
    for (const x of els.after || []) {
      x.cb.disabled = !runs;
      x.li.classList.toggle('lk', !runs);
      x.cb.title = runs ? '' : 'Bukas kapag tumatakbo na ang equipment (START muna)';
    }
    /* the condition of the step */
    if (els.cond && s.c) {
      let ok = false,
        now = '';
      try {
        ok = s.c.ok();
        now = s.c.now ? s.c.now() : '';
      } catch (e) {}
      const hd = call(() => g.holdOf(s), null);
      els.cond.className = 'gd-cond' + (ok ? ' ok' : '');
      els.cond.textContent = (ok ? '✓ ' : '◌ ') + (s.c.want ? 'Kailangan: ' + s.c.want : 'Kailangan') + (now ? '  ·  Ngayon: ' + now : '') + (hd ? '  ·  hawak ' + f0(hd[0]) + ' / ' + f0(hd[1]) + ' s' : '');
    } else if (els.cond) {
      /* 3.2.0 walkthrough #5: the 6 h of the ESP purge, in plant time */
      const hd = call(() => g.holdOf(s), null),
        /* retest #5: ×300 by itself while the purge counts (RUN), back to ×1 at 6:00 */
        sp = +((window.AN && AN.spd) || 1);
      /* retest #55: "Tapos na" of the purge only at the end of the time; the shortcut only before the purge starts */
      if (els.preCb && els.preCb.i === s.i) {
        const left = !hd || hd[0] < hd[1];
        els.preCb.b.disabled = left;
        els.preCb.b.title = left ? (hd ? 'Hintayin ang ' + Math.round(hd[1] / 3600) + ':00 h ng purge' : 'Simulan muna ang purge (o laktawan bilang training shortcut)') : '';
        if (els.preSkip) els.preSkip.hidden = !!hd;
      }
      if (hd && isRun() && hd[0] < hd[1] && sp !== 300 && els.fast !== s.i) {
        els.fast = s.i;
        setSpeed(300);
      } else if (els.fast === s.i && hd && hd[0] >= hd[1]) {
        els.fast = null;
        setSpeed(1);
      }
      {
        const hm = x => Math.floor(x / 3600) + ':' + String(Math.floor((x % 3600) / 60)).padStart(2, '0');
      els.cond.textContent = hd
        ? '⏱ Purge: ' + hm(hd[0]) + ' / ' + hm(hd[1]) + ' h (oras ng planta' + (isRun() ? '' : ', naka-PAUSE: pindutin ang ▶ RUN') + ')'
        : s.need
          ? s.pre
            ? 'Pindutin ang "Simulan ang ' + Math.round(s.pre / 3600) + ' h purge", saka ▶ RUN.'
            : 'Pindutin ang "Tapos na ito sa field" kapag nagawa na.'
          : '';
      }
    }
    /* retest #48: the centre follows the machine of the step (SWP-A running -> the SWP-B sheet, tab B) */
    if (follow && els.goKey) {
      const ms = (s.a || []).filter(a => a.stop && motAddr(a) && MOTOR[motAddr(a)]),
        nx = ms.find(a => !call(() => a.on && a.on(), false)),
        on1 = ms.find(a => call(() => a.on && a.on(), false)),
        rd0 = call(() => g.ready(), false);
      /* R9 #73: to the next machine only while the step needs more than one (2 SWP, 2 SWBP); a step done goes back to its first
         running machine (2 SWBP running: pump A, as the 1-pump steps) */
      if (document.body.dataset.tab === 'logic') {
        if (nx && on1 && s.max && !rd0 && motAddr(nx) !== els.goKey) goStep(s);
        else if (rd0 && on1 && motAddr(on1) !== els.goKey) goStep(s);
      }
    }
    /* the interlock */
    const blocked = {};
    /* 3.2.0-beta.26 (human run of the Training: the first SWP step showed three full interlock boxes, SWP-A / B / C, and the last
       button was under the screen): the full interlock only for the first motor of the step that is not running yet; a running one is
       one line, the others wait (one line) */
    let shown = 0,
      mk = null;
    const nOn0 = s.max ? (s.a || []).filter(a => a.stop && call(() => a.on(), false)).length : 0;
    /* retest #66 (R8: "DITL-29A #B ↗" pressed, nothing in the centre): the interlock box was emptied and drawn again 4 times a second,
       so a press of a mouse (down ... up, about 0.1 s) often ended on a new button and the click was lost (the ↗ links, the FIELD
       buttons). Each box is drawn into a spare one and put on the screen only when its text changed: the buttons stay the same */
    for (const it of els.il || []) {
      it.real = it.real || it.box;
      it.box = E('div', { cls: it.real.className });
    }
    for (const it of els.il || []) {
      const I = interlock(it.ad);
      if (!I) continue;
      /* 3.2.0 P1: a motor operated valve (a valve model, no RUNNING output: DITL-38 MCV, DITL-54 ~ 56) is ready when its interlock is
         complete (REMOTE at the MCC); the next valve of the step then shows its own interlock */
      const ds = /^DITL-/.test(it.ad) && atRow(it.ad) == null ? dSheet(it.ad) : null,
        mov = !!(ds && ds.nl && (ds.nl.mv || []).length && runOut(it.ad) == null),
        run0 =
          I.live &&
          (mov
            ? !I.miss.length
            : atRow(it.ad) != null
              ? dout(it.ad, atRow(it.ad)) === 1
              : /^DITL-/.test(it.ad)
                ? runOut(it.ad) === 1
                : bit(it.ad));
      /* retest #49 (beta.45 check: with 2 SWP running the third still showed its REMOTE field button and interlock): the standby
         machine of a step with a number to run shows one line, no field button, no START */
      if (I.live && !run0 && s.max && nOn0 >= s.max) {
        it.box.append(
          E('div', { cls: 'gd-ilh' }, [
            E('span', { txt: 'STANDBY · ilagay sa AUTO (button na MAN / AUTO)' }),
            E('span', { cls: 'gd-ilm', txt: I.sheet })
          ])
        );
        continue;
      }
      if (I.live && (run0 || shown)) {
        /* 3.2.0 walkthrough #22: a motor whose box waits (SUSUNOD) is blocked by its own interlock too (SWP-B / C started while SWP-A
           was blocked by the same missing REMOTE contact) */
        if (!run0 && I.miss.length) blocked[it.ad] = 1;
        it.box.append(
          E('div', { cls: 'gd-ilh' }, [E('span', { txt: run0 ? (mov ? '✓ REMOTE, HANDA' : '✓ TUMATAKBO NA') : 'SUSUNOD' + (I.miss.length ? ' · kulang ang interlock' : '') }), E('span', { cls: 'gd-ilm', txt: I.sheet })])
        );
        continue;
      }
      if (I.live) shown = 1;
      const head = E('div', { cls: 'gd-ilh' }, [E('span', { txt: 'INTERLOCK · START PERMISSION' }), E('button', { type: 'button', cls: 'gd-lk', txt: I.sheet + ' ↗', title: 'Buksan ang ' + I.sheet, on: () => (window.lsSetTab && lsSetTab('logic'), openD(I.sheet)) })]);
      it.box.append(head);
      if (!I.live) {
        it.box.append(E('div', { cls: 'gd-ild', txt: 'Lalabas ang interlock kapag na-load na ang planta (one world).' }));
        continue;
      }
      const run = atRow(it.ad) != null ? dout(it.ad, atRow(it.ad)) === 1 : /^DITL-/.test(it.ad) ? runOut(it.ad) === 1 : bit(it.ad);
      if (run) it.box.append(E('div', { cls: 'gd-ild ok', txt: '✓ Tumatakbo na.' }));
      const F = run ? { field: [], abc: [], by: {} } : fieldOf(it.ad);
      /* 3.2.0 walkthrough #18: one line per signal (SEAWATER PUMP A REMOTE MODE SELECTED feeds rows 5, 18 and 22 of DITL-29A) */
      const grp = [];
      for (const r of I.rows) {
        const k = r.s.name + '|' + svcN(r.svc) + '|' + r.want,
          q = grp.find(x => x.k === k);
        if (q) {
          q.rs.push(r);
          q.ok = q.ok && r.ok;
          if (!q.tag && r.tag) q.tag = r.tag;
        } else grp.push({ k, r, rs: [r], ok: r.ok, tag: r.tag });
      }
      for (const G of grp.slice(0, 8)) {
        const r = G.r,
          rows = G.rs.map(x => x.no).join(', ');
        it.box.append(
          E('div', { cls: 'gd-ilr' + (G.ok ? '' : ' x') }, [
            E('span', { txt: (G.ok ? '✓ ' : '✕ ') + (svcN(r.svc) || r.svc || '') + (r.cmp ? ' ' + r.cmp : '') + (r.want ? '' : ' (dapat OFF)') }),
            /* 3.2.0 walkthrough #19: the row on its sheet, one press (to see it, to set it or FORCE it there in the Inputs list) */
            E('span', {}, [
              E('code', { txt: (G.tag ? G.tag + ' · ' : '') + (r.other ? r.other + ' ' : '') + 'row ' + rows }),
              E('button', { type: 'button', cls: 'gd-rowl', txt: '↗', title: 'Buksan ang ' + dName(r.s) + ' row ' + rows, on: () => (window.lsSetTab && lsSetTab('logic'), openD(dName(r.s), r.row)) })
            ])
          ])
        );
        const seen = new Set(),
          fs = [],
          ab = [];
        for (const x of G.rs) {
          const o = !x.ok && x.s && F.by[x.s.name + ':' + x.row];
          if (!o) continue;
          for (const f of o.field) {
            const fk = f.s.name + '|' + svcN(f.svc);
            if (!seen.has(fk)) (seen.add(fk), fs.push(f));
          }
          for (const a of o.abc) if (!ab.includes(a)) ab.push(a);
        }
        if (fs.length || ab.length)
          it.box.append(
            E('div', {
              cls: 'gd-ilw',
              txt: '↳ ' + fs.map(f => 'field: ' + (f.tag ? f.tag + ' ' : '') + f.svc.replace(/^\(FROM STATION WIRING\)\s*/, '') + (f.av ? ' ' + f.av.txt : '')).concat(ab.map(a => 'galing sa ' + a.replace(/^.*?(ABC-)/, '$1') + ' (operator sa DCS)')).join(' · ')
            })
          );
      }
      /* 3.2.0 walkthrough #20: one FIELD button per missing field contact (the field operator sets the LOCAL / REMOTE selector, the limit
         switch ...): it sets that input row of the drawing (every row of the same signal) and writes the Event log */
      const fg = [];
      for (const f of F.field) {
        const k = f.s.name + '|' + svcN(f.svc),
          q = fg.find(x => x.k === k);
        if (q) q.L.push(f);
        else fg.push({ k, f, L: [f] });
      }
      for (const q of fg) {
        const f = q.f,
          nm = svcN(f.svc),
          rows = q.L.map(x => x.no).join(', ');
        it.box.append(
          E('button', {
            type: 'button',
            cls: 'gd-btn gd-fld gd-fone',
            txt: 'FIELD: ' + (f.av ? nm + ' ' + f.av.txt : 'set ' + nm + (f.want ? '' : ' = OFF')),
            title: 'Field operator: ' + dName(f.s) + ' row ' + rows + ' (' + nm + ') = ' + (f.av ? f.av.x : f.want ? 1 : 0),
            on: () => {
              fieldSet(q.L);
              try {
                if (window.lsEventAdd) lsEventAdd(dName(f.s), 'FIELD', 'Field operator: ' + nm + ' = ' + (f.av ? f.av.x : f.want ? 1 : 0) + ' (row ' + rows + ')');
              } catch (e) {}
              setTimeout(() => fill(true), 400);
            }
          })
        );
      }
      if (!run && !I.miss.length) it.box.append(E('div', { cls: 'gd-ild ok', txt: '✓ Kumpleto ang interlock: puwede nang pindutin ang START.' }));
      /* retest #40: the missing rows outlined on the sheet in the centre */
      {
        const ms0 = dOf(it.ad);
        mk = { s: ms0, rows: run ? [] : I.miss.filter(r => (r.s || ms0) === ms0).map(r => r.row) };
      }
      if (!run && I.miss.length) {
        blocked[it.ad] = 1;
        it.box.append(E('div', { cls: 'gd-ild x', txt: 'Hindi pa aandar ang motor (ayon sa ' + I.sheet + '): ayusin muna ang may ✕ (FIELD button, o ↗ para buksan ang row sa logic).' }));
      }
    }
    for (const it of els.il || []) {
      const nb = it.box;
      it.box = it.real;
      if (nb.innerHTML !== it.real.innerHTML) it.real.replaceChildren(...nb.childNodes);
    }
    /* retest #49: a step with a number of machines to run (2 of the 3 SWP): the others are the standby, their START is closed */
    const nOn = s.max ? (s.a || []).filter(a => a.stop && call(() => a.on(), false)).length : 0;
    try {
      if (window.DUI && DUI.mark) DUI.mark(mk && mk.s, mk ? mk.rows : []);
    } catch (e) {}
    for (const B of els.btns || []) {
      const on0 = B.a.on ? call(() => B.a.on(), false) : false;
      /* a button of a machine that is not for this step (the standby AUTO of a running SWP) */
      const hd = !!(B.a.hide && call(() => B.a.hide(), false));
      B.bt.hidden = hd;
      if (B.sb) B.sb.hidden = hd;
      if (B.lab) B.lab.hidden = hd;
      if (B.am) {
        const am = B.am._am,
          au = call(() => DUI.rowVal(am.s, am.row), null) === 1 || !!(am.s.sig && am.s.sig[am.row + ':S']);
        B.am.textContent = au ? 'AUTO' : 'MAN';
        B.am.classList.toggle('on', au);
        B.am.title = (au ? 'AUTO (standby: aandar kapag nag-trip ang tumatakbo)' : 'MAN') + ' · pindutin para ' + (au ? 'MAN' : 'AUTO') + ' · ' + dName(am.s) + ' row ' + (am.row + 1);
      }
      /* retest #52: a field start is a toggle */
      if (B.a.tog && B.bt.firstChild) B.bt.firstChild.textContent = on0 ? B.a.l.replace('START', 'STOP') : B.a.l;
      if (s.max && nOn >= s.max && B.a.stop && !on0) {
        B.bt.dataset.block = '1';
        B.bt.classList.add('dis');
        B.bt.hidden = true;
        if (B.sb) B.sb.hidden = true;
        B.bt.title = 'Sapat na: ' + nOn + ' ang tumatakbo. Ito ang standby: ilagay sa AUTO.';
        if (B.lab) {
          B.lab.textContent = 'STANDBY';
          B.lab.className = 'gd-mst';
        }
        continue;
      }
      const bl = B.ad && blocked[B.ad];
      B.bt.dataset.block = bl ? '1' : '';
      B.bt.classList.toggle('dis', !!bl);
      B.bt.title = bl ? 'Kulang ang interlock sa ' + MOTOR[B.ad] + ' (tingnan ang may ✕)' : '';
      const on = B.a.on ? call(() => B.a.on(), false) : false;
      if (!B.lab) {
        B.bt.classList.toggle('did', !!on);
        continue;
      }
      /* 3.2.0 retest #29: START lit red while the equipment runs, STOP lit green while it is stopped (was: a ✓ on START only) */
      const st = (B.ad && mst(B.ad)) || (on ? 'RUN' : B.a.on ? 'STOP' : null),
        tn = st === 'TRIP' && tripNew(B.ad);
      B.bt.classList.toggle('lit-run', st === 'RUN');
      if (B.sb) B.sb.classList.toggle('lit-stop', st === 'STOP' || st === 'TRIP');
      B.lab.textContent = st === 'RUN' ? 'RUNNING' : st === 'STOP' ? 'STOPPED' : st === 'TRIP' ? (tn ? 'TRIP · ACK' : 'TRIP') : '—';
      B.lab.className = 'gd-mst' + (st ? ' ' + st.toLowerCase() : '') + (tn ? ' blink' : '');
      if (B.ft) {
        const ftr = !!call(() => dOf(B.ad)._ftrip, false);
        B.ft.hidden = !(st === 'RUN' || ftr);
        B.ft.textContent = ftr ? 'FIELD: RESET TRIP' : 'FIELD: TRIP';
      }
      B.lab.disabled = !tn;
    }
    /* 3.2.0 walkthrough #19: no "start anyway" of a blocked motor (was "Simulan pa rin (training lang)"): the missing contact is set by its
       FIELD button or on its row in the logic (the Inputs list of the DITL page) */
    /* out of order: a motor of a later step already running */
    const ea = call(() => g.early(), []);
    if (els.early) {
      els.early.hidden = !ea.length;
      els.early.textContent = ea.length ? '⚠ Nauna na: ' + ea.join(', ') + ' (hakbang sa susunod). Sa totoong start-up, sundin ang pagkakasunod.' : '';
    }
    for (const f of fpLive)
      try {
        f();
      } catch (e) {}
  }
  /* the steps move on by themselves (RUN): the open step is checked every half second */
  setInterval(() => {
    const g = GD();
    if (!g || !g.on || !dock) return;
    try {
      g.scan();
    } catch (e) {}
    try {
      fill();
    } catch (e) {
      console.error(e);
    }
    if (tabB && !tabB.hidden) {
      const L = g.steps();
      tabB.textContent = 'Training · ' + Math.min(g.cur + 1, L.length) + ' / ' + L.length;
    }
  }, 500);
  /* the speed chosen in the panel is kept */
  setInterval(() => {
    if (dock && GD() && GD().on && window.AN) ls.set('ls-gdock-spd', +AN.spd || 1);
  }, 5000);
  /* retest #62: one lamp group of the strip running (all of its machines for the fans: events.js shutdown alarm suppression) */
  const grpOn = k => {
    const L = LAMPS.find(x => x[0] === k);
    return !!L && any(L[1]);
  };
  /* the centre follows the step when the Logic page opens (app.js setTab) */
  const followNow = () => {
    const g = GD();
    if (g && g.on) goStep(g.steps()[g.cur], true);
  };
  window.LS_DOCK = {
    grpOn,
    follow: followNow,
    start,
    resume,
    open,
    stop,
    layout,
    fill,
    interlock,
    fieldOf,
    fieldSet,
    fieldRow,
    dsel,
    mst,
    dmotor,
    dOf,
    needNet,
    leaves,
    permOf,
    dpress,
    dset,
    dout,
    runOut,
    get el() {
      return dock;
    } };
})();
