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
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15', 'PICFG108'], ['Total air (PA + SA + FA)', () => H().PA() + H().SA() + (H().FA ? H().FA() : 0), 'T/H', f0, 'purge ≥ 151.5 (25 % MCR)'], ['IDF coupling MV', () => mv('PICFG108'), '%', f0, '', 'PICFG108']],
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15', 'PICFG108'], ['Total air (PA + SA + FA)', () => H().PA() + H().SA() + (H().FA ? H().FA() : 0), 'T/H', f0, 'purge ≥ 151.5 (25 % MCR)']],
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
        for (const r of twinRows(f.s, f.row)) f.s.sig[r + ':S'] = !!f.want;
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
    {
      /* one address = one signal (CLAUDE.md 1): DITL-29A rows 4 and 19 are both M.1152 */
      for (const r of twinRows(s, row)) s.sig[r + ':S'] = !!v;
    }
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
      /* R9 #76: the other rows of the same address */
      for (const r of twinRows(s, row)) s.sig[r + ':S'] = !!on;
    }
    if (WORLD.live) WORLD.busy = true;
    pscan();
    try {
      if (window.lsEventAdd) lsEventAdd(dName(s), 'FIELD', 'Field operator: ' + (txt || rowInfo(s, row).svc) + ' (row ' + (row + 1) + ')');
    } catch (e) {}
    setTimeout(() => fill(true), 200);
    return true;
  }
  /* live test 2026-10-30 #12: the field operator turns the LOCAL / REMOTE selector of a motor to REMOTE (every REMOTE MODE SELECTED row of
     its drawing: DITL-29A rows 5, 18, 22; DITL-30 row 22; DITL-112 row 22), logged; PAUSED too */
  function dremote(ad, l) {
    const s = dOf(ad);
    if (!s || modeOf(ad) == null) return false;
    const R = (s._mrows || {}).rem || [];
    if (!R.length) return false;
    for (const r of R) s.sig[r + ':S'] = true;
    if (WORLD.live) WORLD.busy = true;
    pscan();
    try {
      if (window.lsEventAdd) lsEventAdd(dName(s), 'FIELD', 'Field operator: ' + (l || dName(s)) + ' LOCAL / REMOTE selector to REMOTE (row ' + R.map(r => r + 1).join(', ') + ')');
    } catch (e) {}
    setTimeout(() => fill(true), 200);
    return true;
  }
  /* the other input rows of the same address on a drawing (one address = one signal, CLAUDE.md 1): the same service text with an address
     (DITL-29A rows 4 and 19 M.1152), or live test #51 the same TAG NO. (DITL-77 row 1 "B-AUX. CW PUMP AUTO PB" and row 4 "B-AUX. CW PUMP
     AUTO SELECTED" are both M.1242 B-AUX. COOLING WATER PUMP AUTO MODE (CRT), memory list STN103: the AUTO of the faceplate set row 1
     only and the dock read row 4 as missing) */
  function twinRows(s, row) {
    const I = rowInfo(s, row),
      sv = I.svc,
      tg = /^[IM]\.[0-9A-F]{4}$/.test(I.tag || '') ? I.tag : '',
      o = [];
    for (let r = 0; r < 40; r++) {
      if (r === row) continue;
      const J = rowInfo(s, r);
      if ((tg && J.tag === tg) || (/\b[IM]\.[0-9A-F]{4}/.test(sv) && J.svc === sv)) o.push(r);
    }
    return o;
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

  /* live test 2026-10-30 #5 (#121, HMI 030 as snapshot 30.PNG: R / M / A at each pump): the REMOTE and the AUTO selection of a motor, read on
     its drawing (DITL-29A row 5 / 22 REMOTE MODE SELECTED, row 4 AUTO MODE SELECTED; DITL-30 row 22, row 4); null when the drawing has none */
  function modeOf(ad) {
    const s = dOf(ad);
    if (!s) return null;
    if (!s._mrows) {
      const R = { rem: [], au: [] };
      for (let r = 0; r < 60; r++) {
        const v = rowInfo(s, r).svc;
        if (/REMOTE MODE SELECTED/.test(v)) R.rem.push(r);
        else if (/\bAUTO MODE SELECTED\b/.test(v)) R.au.push(r);
      }
      s._mrows = R;
    }
    const val = r => call(() => DUI.rowVal(s, r), null) === 1 || !!(s.sig && s.sig[r + ':S']),
      R = s._mrows;
    return { rem: R.rem.length ? R.rem.some(val) : null, au: R.au.length ? R.au.some(val) : null };
  }
  /* retest #69: the AUTO MODE SELECTED input row of a motor drawing (a maintained CRT selection), or null */
  function amRow(ds) {
    if (!ds) return null;
    if (ds._amr !== undefined) return ds._amr;
    let o = null;
    for (let r = 0; r < 60 && !o; r++) {
      const v = rowInfo(ds, r).svc;
      if (/\bAUTO MODE SELECTED\b/.test(v) && !/REMOTE/.test(v)) o = { s: ds, row: r, svc: svcN(v) };
    }
    /* live test #51: the ACW pumps write it "B-AUX. CW PUMP AUTO SELECTED" (DITL-77 row 4, M.1242 AUTO MODE (CRT), memory list STN103):
       a CRT memory row of a motor drawing only (the drain valves DITL-73 / 80 / 88 ... have their own AUTO SELECTED) */
    const motor = !o && call(() => DUI.outs(ds).some(q => /RUNNING/.test(q.name) && !/NOT RUNNING/.test(q.name)), false);
    for (let r = 0; r < 60 && !o && motor; r++) {
      const I = rowInfo(ds, r);
      if (/\bAUTO SELECTED\b/.test(I.svc) && !/REMOTE|START/.test(I.svc) && /^M\.[0-9A-F]{4}$/.test(I.tag || '')) o = { s: ds, row: r, svc: svcN(I.svc) };
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
      gOn = !!(dock && GD() && GD().on),
      on = gOn || !!(dock && menuOn),
      min = gOn && isMin(),
      m = mode();
    /* the Training page in the dock (no step running): the start buttons, the progress and the SOP sections with their ticks */
    R.classList.toggle('gd-menu', on && !gOn);
    if (gOn || !on) menuPut(false);
    /* the box of the step on the HMI goes with the Gabay */
    if (!gOn) {
      const ov = document.getElementById('gdhl');
      if (ov) ov.hidden = true;
    }
    R.classList.toggle('gd-side', on && !min && m === 'side');
    R.classList.toggle('gd-bottom', on && !min && m === 'bottom');
    R.classList.toggle('gd-min', on && min);
    /* the buttons the Training dock already has (RUN / PAUSE, speed) or that do not belong in it are hidden while it is open (dock.css) */
    R.classList.toggle('gd-tr', on);
    if (!on) lvOff();
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
  /* user 2026-10-30 ("ililipat sa dock ang training page"; "ang Training button sa kaliwa ang magbubukas ng dock, hindi ang malaking
     display"): the Training page (home.js #trainws: Gabay, Practise, the 48 sections and their ticks) is shown INSIDE the dock while no
     step runs; the centre stays the Plant view or the Logic. The page is moved, not copied: its buttons are the same ones */
  let menuOn = false;
  function menuPut(inDock) {
    const tw = document.getElementById('trainws');
    if (!tw || !els.body) return;
    if (inDock) {
      if (tw.parentNode !== els.body) {
        els.body.textContent = '';
        els.body.append(tw);
      }
    } else if (tw.parentNode !== document.body) document.body.append(tw);
  }
  function menu() {
    build();
    if (GD() && GD().on) {
      ls.set('ls-gdock-min', false);
      layout();
      fill(true);
      return;
    }
    menuOn = true;
    layout();
    menuPut(true);
    call(() => window.lsHome && lsHome.train());
    els.foot.hidden = true;
  }
  function menuOff() {
    menuOn = false;
    menuPut(false);
    layout();
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
      E('button', { type: 'button', cls: 'gd-ic', txt: '▁', title: 'Itago ang Training (tuloy ang simulation)', on: () => (ls.set('ls-gdock-min', true), layout()) }),
      E('button', { type: 'button', cls: 'gd-ic', txt: '✕', title: 'Itigil ang Training', on: () => (GD() && GD().on ? stopAsk() : menuOff()) })
    ]);
    /* user 2026-10-29 (mock-up v3 "isang monitor lang"): one line of the plant (load, drum level, furnace, O2); the equipment lamps are on
       the HMI in the centre (was: 8 values and 17 lamps, about 210 px) */
    els.vals = VALS.map(([k, u]) => {
      const b = E('b', { txt: '—' }),
        kk = E('small', { txt: k }),
        uu = E('em', { txt: u });
      const d = E('span', { cls: 'gd-kv' }, [kk, b, uu]);
      return { d, b, kk, uu };
    });
    /* user 2026-10-30 ("ang tinanggal mga values at indications"): the 8 values and the equipment lamps of the plant stay in the dock
       (beta.57 had 4 values and no lamps); only buttons that do the same thing twice were to go */
    els.lamps = LAMPS.map(([k, A, t]) => E('span', { cls: 'gd-lamp', txt: k, title: t, 'data-a': A.join(' ') }));
    /* user 2026-10-30 (dock mock-up v2, approved "g na yan"): one line of 3 values; "Lahat ▾" opens the other 5 and the lamps (kept, folded) */
    els.allB = E('button', { type: 'button', cls: 'gd-all', on: () => (ls.set('ls-gdock-all', !ls.get('ls-gdock-all', false)), allPaint()) });
    const strip = E('div', { cls: 'gd-strip' }, [E('div', { cls: 'gd-kvs' }, els.vals.map(x => x.d).concat([els.allB])), E('div', { cls: 'gd-lamps' }, els.lamps)]);
    els.strip = strip;
    /* the one thing to do now (SUSUNOD NA GAWIN) with the button that does it, above the step (dock live: nextPaint) */
    els.nxS = E('div', { cls: 'gd-nxs' });
    els.nxB = E('button', { type: 'button', cls: 'gd-nxb', hidden: true });
    /* 3.2.0-beta.74: the faceplate of the step's motor beside its symbol on the HMI (the operator acts there; the dock does not press) */
    els.nxF = E('button', { type: 'button', cls: 'gd-nxf', hidden: true });
    els.nx = E('div', { cls: 'gd-nx' }, [E('small', { txt: 'GAWIN NGAYON' }), els.nxS, els.nxB, els.nxF]);
    /* the SOP section: ◄ ► and the list (☰, folded over the centre); the step: ‹ › beside its title (‹ Nakaraan, Susunod ›, TAPOS
       were three buttons for one move) */
    els.bar = E('i');
    els.secT = E('b');
    els.secS = E('small');
    els.secP = E('button', { type: 'button', cls: 'gd-ic', txt: '◄', title: 'Naunang seksyon', on: () => secGo(-1) });
    els.secN = E('button', { type: 'button', cls: 'gd-ic', txt: '►', title: 'Susunod na seksyon', on: () => secGo(1) });
    els.secL = E('button', { type: 'button', cls: 'gd-ic', txt: '☰', title: 'Listahan ng mga seksyon (PR-OPE-5002)', 'aria-expanded': 'false', on: secList });
    const sec = E('div', { cls: 'gd-sec' }, [els.secP, E('div', { cls: 'gd-secl' }, [els.secT, els.secS]), els.secN, els.secL]);
    /* live test #32: the progress of the start-up, one segment per SOP section (done, current, to come) and the next systems */
    els.segs = E('div', { cls: 'gd-segs', role: 'img' });
    els.segN = E('small', { cls: 'gd-segn' });
    const prog = E('div', { cls: 'gd-prog' }, [E('div', { cls: 'gd-bar', hidden: '' }, [els.bar]), els.segs, els.segN]);
    els.stp = E('small');
    els.ttl = E('h3');
    els.stP = E('button', { type: 'button', cls: 'gd-ic', txt: '‹', title: 'Naunang hakbang', on: () => stepGo(-1) });
    els.stN = E('button', { type: 'button', cls: 'gd-ic', txt: '›', title: 'Susunod na hakbang', on: () => stepGo(1) });
    const stepb = E('div', { cls: 'gd-step' }, [els.stP, E('div', { cls: 'gd-stl' }, [els.stp, els.ttl]), els.stN]);
    els.body = E('div', { cls: 'gd-body' });
    /* "Ipakita sa logic sheet": one button for each sheet of the step (the DITL of its motor, the ABC sheet of its faceplate) */
    els.foot = E('div', { cls: 'gd-foot' });
    /* live test beta.74 #28: the one thing to do now is the top of the dock (under the title bar), then the values of the step */
    dock.append(g, hd, els.nx, strip, sec, prog, stepb, els.body, els.foot);
    allPaint();
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
  function allPaint() {
    const on = !!ls.get('ls-gdock-all', false);
    if (els.strip) els.strip.classList.toggle('all', on);
    if (els.allB) {
      els.allB.textContent = on ? 'Itago ▴' : 'Lahat ▾';
      els.allB.title = on ? 'Itago ang ibang value at ang mga lamp' : 'Ipakita ang 8 value at ang mga lamp ng equipment';
    }
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
    menuOn = false;
    menuPut(false);
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
    menuOn = true;
    layout();
    menuPut(true);
    try {
      window.lsHome && lsHome.train();
    } catch (e) {}
    if (els.foot) els.foot.hidden = true;
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
    g.resume();
    open();
  }
  /* ---------- user 2026-10-29 (mock-up v3, "isang monitor lang"): the centre is the HMI during the Training; the logic sheet of the
     step only on "Ipakita sa logic sheet" (the diagram alone, "◄ Balik sa HMI"); the section list and the step moves in the dock ---------- */
  const tab = () => document.body.dataset.tab;
  /* the first step of the section before (d < 0) or after (d > 0) the step's own; after only up to the furthest step reached (the
     Training goes in order) */
  function secAt(d) {
    const g = GD();
    if (!g) return null;
    const L = g.steps(),
      i = Math.min(g.cur, L.length - 1),
      sk = secOf(L[i]);
    let k = i;
    if (d < 0) {
      while (k > 0 && secOf(L[k - 1]) === sk) k--;
      if (k === 0) return null;
      const ps = secOf(L[k - 1]);
      let j = k - 1;
      while (j > 0 && secOf(L[j - 1]) === ps) j--;
      return j;
    }
    while (k < L.length - 1 && secOf(L[k + 1]) === sk) k++;
    return k + 1 < L.length && k + 1 <= (els.maxI || 0) ? k + 1 : null;
  }
  function secGo(d) {
    const j = secAt(d),
      g = GD();
    if (j == null || !g) return;
    g.open(j);
    fill(true);
  }
  function stepGo(d) {
    const g = GD();
    if (!g) return;
    if (d < 0) {
      if (g.cur > 0) (g.open(g.cur - 1), fill(true));
      return;
    }
    if (isDone()) {
      if (g.next()) fill(true);
    } else if (g.cur < (els.maxI || 0)) (g.open(g.cur + 1), fill(true));
  }
  /* #120 (live test 2026-10-30, H2 / H4 / H6: "✓ TAPOS" while the SOP items after the START were not ticked): the step is done when its
     condition is met AND the SOP items of PAGKATAPOS I-START (monitor, adjust, standby to AUTO) are ticked */
  const postLeft = () => (els.after || []).filter(x => !x.cb.checked);
  /* live test 2026-10-30 #4 #20 (H5: "✓ Tapos" with the line-up 0 / 1): every SOP item of the step ticked, the line-up too */
  const preLeft = () => (els.lineCb || []).filter(x => !x.cb.checked);
  const isDone = () => call(() => GD().ready(), false) && !postLeft().length && !preLeft().length;
  /* the › of the step: green when the step is done (was "✓ TAPOS ... Susunod ›"), open to a step already reached */
  function stepNx() {
    const g = GD();
    if (!g || !els.stN) return;
    const rd = isDone(),
      L = g.steps();
    els.stN.disabled = !(rd || g.cur < Math.min(els.maxI || 0, L.length));
    els.stN.classList.toggle('go', !!rd);
    els.stN.title = rd ? 'Tapos ang hakbang: susunod' : els.stN.disabled ? 'Tapusin muna ang hakbang' : 'Susunod na hakbang';
  }
  /* ☰ the sections of PR-OPE-5002 with steps: ✓ done, the step's own lit, the ones not reached yet locked */
  function secList() {
    const old = document.getElementById('gdsecl');
    if (old) {
      old.remove();
      els.secL.setAttribute('aria-expanded', 'false');
      return;
    }
    const g = GD();
    if (!g) return;
    const L = g.steps(),
      P = window.LS_PROC5002 || [],
      cur = secOf(L[g.cur]),
      S = [];
    L.forEach((x, k) => {
      const sk = secOf(x);
      if (sk == null) return;
      const o = S.find(y => y.sk === sk);
      if (o) o.last = k;
      else S.push({ sk, first: k, last: k });
    });
    const box = E('div', { id: 'gdsecl', role: 'menu' }, [E('div', { cls: 'gd-h', txt: 'MGA SEKSYON · PR-OPE-5002' })]);
    for (const o of S) {
      const lock = o.first > (els.maxI || 0),
        b = E('button', { type: 'button', role: 'menuitem', cls: (o.sk === cur ? 'on ' : '') + (o.last < g.cur ? 'dn' : '') }, [
          E('b', { txt: String(o.sk) }),
          E('span', { txt: (P[o.sk - 1] || {}).t || '' })
        ]);
      b.disabled = lock;
      b.onclick = () => {
        box.remove();
        els.secL.setAttribute('aria-expanded', 'false');
        g.open(o.first);
        fill(true);
      };
      box.append(b);
    }
    dock.append(box);
    els.secL.setAttribute('aria-expanded', 'true');
    const on = box.querySelector('button.on');
    if (on) on.scrollIntoView({ block: 'center' });
  }
  /* the sheets of the step: the DITL of each motor / push button, the ABC sheet of each faceplate */
  function sheetsOf(s) {
    const out = [];
    for (const a of (s && s.a) || []) {
      if (a.hide && call(() => a.hide(), false)) continue;
      const ad = a.stop || a.dg ? motAddr(a) : null;
      if (ad && MOTOR[ad]) {
        const nm = MOTOR[ad];
        if (!out.some(x => x.k === nm)) out.push({ k: nm, l: String(nm).replace(/^\(\d+\)/, '') + ' · ' + a.l.replace(/^START\s+/, ''), ad, a });
      } else if (a.dg && !out.some(x => x.k === a.dg[0])) out.push({ k: a.dg[0], l: String(a.dg[0]) + ' · ' + a.l.replace(/\s*\(DITL[^)]*\)$/, ''), dg: a.dg });
    }
    for (const t0 of (s && s.fps) || []) {
      const t = call(() => LV().ctlTag(t0), null) || t0,
        f = call(() => LV().fp(t), null);
      /* one button per sheet (FICFA1071 and FICFA1081 are both on ABC-007: one "ABC-007", step 66) */
      if (f && f.shn && !out.some(x => x.t === t || x.sh === f.shn)) out.push({ k: f.shn + '|' + t, l: f.shn + ' · ' + t, t, sh: f.shn });
    }
    return out.slice(0, 3);
  }
  function footFill(s) {
    if (!els.foot) return;
    const lv = document.documentElement.classList.contains('gd-lv'),
      S = sheetsOf(s),
      kids = [];
    if (lv) kids.push(E('button', { type: 'button', cls: 'gd-btn gd-back', txt: '◄ Balik sa HMI', on: backHMI }));
    else if (S.length) kids.push(E('span', { cls: 'gd-fl0', txt: '⌖ Ipakita sa logic sheet' }));
    for (const o of S)
      kids.push(E('button', { type: 'button', cls: 'gd-btn gd-sh' + (lv && els.lvK === o.k ? ' on' : ''), txt: S.length > 2 ? o.l.split(' · ')[0] : o.l, title: 'Ipakita sa gitna ang ' + o.l + ' (diagram lang)', on: () => showLogic(o) }));
    els.foot.replaceChildren(...kids);
    els.foot.hidden = !kids.length;
  }
  /* the diagram of a sheet of the step in the centre: no sheet list, no tool bar, no minimap (LOVIEW focus), the rows of the step
     marked (its interlock, its push button) */
  function showLogic(o) {
    const R = document.documentElement;
    if (!R.classList.contains('gd-lv')) els.lvFocus = document.body.classList.contains('lo-focus');
    R.classList.add('gd-lv');
    els.lvK = o.k;
    els.lvBusy = 1;
    try {
      window.lsSetTab && lsSetTab('logic');
      call(() => LOVIEW.setFocus(true));
      if (o.t) {
        if (AN.cat !== 'an' && AN.setCat) AN.setCat('an');
        if (AN.showTag) setTimeout(() => AN.showTag(o.t, o.sh), 60);
      } else if (o.ad) {
        const I = call(() => interlock(o.ad), null),
          r0 = I && I.miss.find(x => !x.other),
          pb = pbOf(o.a, 1),
          ds = dOf(o.ad);
        openD(MOTOR[o.ad], r0 ? r0.row : pb && pb.sh === dName(ds) ? pb.row : null, 230, r0 ? I.miss.filter(x => !x.other).map(x => x.row) : null);
      } else if (o.dg) openD(o.dg[0], o.dg[1], 230);
    } finally {
      setTimeout(() => (els.lvBusy = 0), 400);
    }
    lvBar(o.l);
    footFill(GD() && GD().steps()[GD().cur]);
  }
  function lvBar(l) {
    const cv = document.getElementById('cv');
    if (!cv) return;
    let b = document.getElementById('gdlvbar');
    if (!b) {
      b = E('div', { id: 'gdlvbar' });
      cv.append(b);
    }
    const g = GD();
    b.replaceChildren(
      E('b', { txt: l }),
      E('span', { txt: g ? 'mula sa Hakbang ' + (g.cur + 1) : '' }),
      E('span', { cls: 'gd-lg' }, [E('i', { cls: 'on' }), '1 = ON', E('i'), '0 = OFF'])
    );
  }
  function lvOff() {
    const R = document.documentElement;
    if (!R.classList.contains('gd-lv')) return;
    R.classList.remove('gd-lv');
    els.lvK = null;
    call(() => LOVIEW.setFocus(!!els.lvFocus));
    const b = document.getElementById('gdlvbar');
    if (b) b.remove();
  }
  /* the menu of the left (Home, Logic, Training) while the Training dock is on: the centre stays the HMI; Logic opens the step's sheet
     as a diagram only, with "Balik sa HMI" (user 2026-10-30: no Training list, no toolbars in the centre during the Training) */
  function tabFix(t) {
    const R = document.documentElement,
      now = document.body.dataset.tab;
    /* the Training button of the left: the dock (the Training page in it, or the running step); the centre stays */
    if (t === 'training') {
      setTimeout(menu, 0);
      return now === 'logic' || now === 'operate' ? now : 'operate';
    }
    if (!R.classList.contains('gd-tr')) return t;
    if (t === 'home') return 'operate';
    if (t === 'logic' && !els.lvBusy && !R.classList.contains('gd-lv')) {
      const g = GD(),
        s = g && g.steps()[g.cur],
        S = sheetsOf(s);
      setTimeout(() => {
        if (S.length) showLogic(S[0]);
        else {
          els.lvFocus = document.body.classList.contains('lo-focus');
          R.classList.add('gd-lv');
          call(() => LOVIEW.setFocus(true));
          lvBar('Logic');
          footFill(s);
        }
      }, 0);
    }
    return t;
  }
  function backHMI() {
    lvOff();
    const g = GD();
    goStep(g && g.steps()[g.cur]);
    footFill(g && g.steps()[g.cur]);
  }
  /* the equipment of the step on the HMI: its tag (the faceplate box of FICFA1081) and its name ("SAF  F-1054"), boxed */
  /* #112 (user 2026-10-30: "HMI LANG ang gitna", "sumusunod sa seksyon at hakbang"): the HMI page of each SOP section of PR-OPE-5002
     and the equipment boxed on it. A section with no page of its own (air compressors, turbine oil, deaerator, turbine) shows the
     nearest one: the UNIT overview (boiler + turbine) */
  const SECHMI = (() => {
    const M = {},
      put = (L, pg, ...re) => L.forEach(k => (M[k] = { pg, re }));
    put([1, 32, 43], 'AFG', /^ESP Z-1010$/);
    put([2], 'SW', /^SWP-[ABC]$/);
    put([3], 'SW', /^HYPO-CHLORINATED DOSING$/);
    put([4], 'SW', /^MV-SW1001$/, /DPISW1502$/);
    put([5], 'SW', /^SWBP-[ABC]$/);
    put([6], 'SW', /^MV-SW1002 BACKWASH$/, /DPISW1504$/);
    put([7], 'MU', /^MWP-[ABC]$/, /^XV-MU1109$/);
    put([8], 'CW', /^ACWP-[AB]$/);
    /* 3.2.0-beta.68: sections 9 ~ 12 (instrument / plant air dryers and compressors) have their page */
    put([9], 'IA', /^IA DRYER-[ABC]$/);
    put([10], 'IA', /^IA COMPRESSOR-[ABC]$/);
    put([11], 'IA', /^PA DRYER-[ABC]$/);
    put([12], 'IA', /^PA COMPRESSOR-[ABC]$/);
    put([29, 31, 34], 'UNIT');
    /* 3.2.0-beta.66: the turbine lube and control oil (sections 13 ~ 16) on their own page 036 TURBINE OIL */
    put([13], 'TO', /^TICLO1002$/);
    put([14], 'TO', /^VAPOUR EXTRACTOR$/, /^MOP-[AB]$/);
    put([15], 'TO', /^OIL PURIFIER PUMP$/);
    put([16], 'TO', /^COP-[AB]$/);
    put([21, 33], 'UNIT', /^Turbine \(TCS/);
    put([17, 27], 'AFG', /^AIR PREHEATER H-1052$/);
    put([18, 35], 'SW', /^CONDENSER H-1110/, /^HOTWELL$/);
    put([19], 'UNIT', /^DRUM LEVEL$/);
    put([20], 'AFG', /^DRUM T-1001$/);
    put([22], 'AFG', /^IDF F-1056$/);
    put([23], 'AFG', /^FAB-[AB]$/);
    put([24], 'AFG', /^SAF F-1054$/);
    put([25], 'AFG', /^PAF F-1053$/);
    put([26, 36], 'AFG', /^FURNACE H-1001$/);
    put([28], 'AFG', /^START-UP BURNER HOT SA/);
    put([30], 'UNIT', /^HP BYPASS$/, /^LP BYPASS$/);
    put([37, 38, 39, 40, 41, 42], 'UNIT', /^Turbine \(TCS/);
    put([44], 'UNIT', /^COAL MASTER$/);
    put([45, 46, 47, 48], 'UNIT', /^TARGET MW$/, /^TURBINE MASTER$/);
    return M;
  })();
  function hmiTargets(s) {
    const svg = document.getElementById('plsvg');
    if (!svg || !s) return [];
    /* user 2026-10-30 (dock mock-up v2): a step of several motors boxes the one picked on its card (SWP-C), not all of them */
    const ms = motorsOf(s),
      sel = ms.length > 1 ? selOf(s) : null,
      selA = sel ? ms.find(a => motAddr(a) === sel) : null;
    const T = selA ? [new RegExp('^' + mName(selA).replace(/[-\s]?([A-D])$/, '[- ]?$1') + '$')] : [].concat((SECHMI[secOf(s)] || {}).re || []);
    for (const t0 of s.fps || []) T.push(new RegExp('^' + (call(() => LV().ctlTag(t0), null) || t0) + '$'));
    for (const a of s.a || [])
      if ((a.stop || a.mot || a.loc) && !(selA && a.stop && a !== selA && ms.includes(a))) {
        const n = a.l.replace(/^START\s+/, '').replace(/[-\s]?([A-D])$/, '-$1');
        if (/^[A-Z]{2,5}(-[A-D])?$/.test(n)) T.push(new RegExp('^' + n.replace(/-/, '[- ]?') + '\\s+[A-Z]{0,2}-?\\d{3,5}'));
      }
    if (!T.length) return [];
    const out = [];
    for (const x of svg.querySelectorAll('text')) {
      const v = (x.textContent || '').replace(/\s+/g, ' ').trim();
      if (T.some(r => r.test(v))) out.push(x);
    }
    return out.slice(0, 4);
  }
  function goStep(s) {
    if (!s) return;
    lvOff();
    try {
      window.lsSetTab && lsSetTab('operate');
    } catch (e) {}
    /* the HMI page of the step's SOP section (SECHMI); else the page that has the step's equipment */
    setTimeout(() => {
      const pk = document.querySelector('#plantws .plpick'),
        want = (SECHMI[secOf(s)] || {}).pg;
      if (pk && want && [...pk.options].some(o => o.value === want)) {
        if (pk.value !== want) {
          pk.value = want;
          pk.dispatchEvent(new Event('change'));
        }
        /* the boxed equipment in view (the 030 page is wider than the centre beside the dock) */
        setTimeout(() => {
          const x = hmiTargets(s)[0],
            r = x && x.getBoundingClientRect();
          if (r && window.lsPlantPanX) lsPlantPanX(r.left, r.right);
        }, 250);
        return;
      }
      if (hmiTargets(s).length) return;
      if (!pk) return;
      const v0 = pk.value;
      for (const o of [...pk.options]) {
        if (o.value === v0) continue;
        pk.value = o.value;
        pk.dispatchEvent(new Event('change'));
        if (hmiTargets(s).length) return;
      }
      pk.value = v0;
      pk.dispatchEvent(new Event('change'));
    }, 120);
  }
  /* the boxes, 4 times a second (the HMI redraws itself) */
  function hmiMark(s) {
    const mid = document.getElementById('plmid');
    let ov = document.getElementById('gdhl');
    if (!mid || tab() !== 'operate' || !s) {
      if (ov) ov.hidden = true;
      return;
    }
    if (!ov) {
      ov = E('div', { id: 'gdhl', 'aria-hidden': 'true' });
      mid.append(ov);
    }
    const m = mid.getBoundingClientRect(),
      X = hmiTargets(s).map(x => {
        const r = (x.parentNode && x.parentNode.tagName === 'g' && x.parentNode.getBoundingClientRect().height < 90 ? x.parentNode : x).getBoundingClientRect();
        return [r.left - m.left - 6, r.top - m.top - 5, r.width + 12, r.height + 10];
      })
        /* one box for one place: a label inside the box of its faceplate is not boxed again (all-steps check 2026-10-30, step 65) */
        .filter((a, j, L) => !L.slice(0, j).some(b => Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 0.5 * Math.min(a[2], b[2]) && Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 0.5 * Math.min(a[3], b[3]))),
      k = JSON.stringify(X.map(a => a.map(Math.round))) + (GD() ? GD().cur : '');
    ov.hidden = !X.length;
    if (k === ov.dataset.k) return;
    ov.dataset.k = k;
    /* live test 2026-10-30 #7 (H5 / H6: the "HAKBANG n" tag lay on the value box of S-1502 and on the label of SWBP-A): the tag goes to the
       first place beside the box that covers no text of the HMI (above, below, left, right), not always on top of the box */
    const tl = 'HAKBANG ' + (GD().cur + 1),
      tw = tl.length * 6.6 + 12,
      th = 15,
      svg = document.getElementById('plsvg'),
      /* #7 (live test 2: still on the condenser drawing at H5 and under the MWP-A label at H8): the text of every HMI svg (the HSYM pages are
         svg of their own), the equipment drawings (closed shapes smaller than a quarter of the page, not the pipes), more places to try,
         and an outline tag (no fill) when no place is free */
      TX = X.length && svg ? [...mid.querySelectorAll('svg text')].map(t => t.getBoundingClientRect()).filter(r => r.width > 0).map(r => [r.left - m.left, r.top - m.top, r.right - m.left, r.bottom - m.top]) : [],
      EQ = X.length
        ? [...mid.querySelectorAll('svg rect, svg circle, svg ellipse, svg polygon')]
            .map(e => e.getBoundingClientRect())
            .filter(r => r.width > 4 && r.height > 4 && r.width * r.height < (m.width * m.height) / 4)
            .map(r => [r.left - m.left, r.top - m.top, r.right - m.left, r.bottom - m.top])
        : [],
      free = (x, y) => x >= 0 && y >= 0 && x + tw <= m.width && y + th <= m.height && !EQ.some(t => t[0] < x + tw && t[2] > x && t[1] < y + th && t[3] > y && !(t[0] <= r0[0] + 2 && t[2] >= r0[0] + r0[2] - 2 && t[1] <= r0[1] + 2 && t[3] >= r0[1] + r0[3] - 2)) && !TX.some(t => t[0] < x + tw && t[2] > x && t[1] < y + th && t[3] > y) && !X.slice(1).some(r => r[0] < x + tw && r[0] + r[2] > x && r[1] < y + th && r[1] + r[3] > y),
      r0 = X[0] || [0, 0, 0, 0],
      at0 = [
        [r0[0], r0[1] - th - 1],
        [r0[0] + r0[2] - tw, r0[1] - th - 1],
        [r0[0], r0[1] + r0[3] + 1],
        [r0[0] + r0[2] - tw, r0[1] + r0[3] + 1],
        [r0[0] - tw - 2, r0[1]],
        [r0[0] + r0[2] + 2, r0[1]],
        [r0[0], r0[1] - 2 * th - 2],
        [r0[0], r0[1] + r0[3] + th + 2],
        [r0[0] + (r0[2] - tw) / 2, r0[1] - th - 1],
        [r0[0] + (r0[2] - tw) / 2, r0[1] + r0[3] + 1],
        [r0[0] - tw - 2, r0[1] + r0[3] - th],
        [r0[0] + r0[2] + 2, r0[1] + r0[3] - th],
        [r0[0] - tw - 2, r0[1] - th - 1],
        [r0[0] + r0[2] + 2, r0[1] - th - 1],
        [r0[0] + (r0[2] - tw) / 2, r0[1] - 3 * th - 3],
        [r0[0] + (r0[2] - tw) / 2, r0[1] + r0[3] + 2 * th + 3]
      ].find(([x, y]) => free(x, y)),
      at = at0 || [r0[0], r0[1] - th - 1];
    ov.replaceChildren(
      ...X.map(r => E('div', { cls: 'gd-hlb', style: 'left:' + r[0] + 'px;top:' + r[1] + 'px;width:' + r[2] + 'px;height:' + r[3] + 'px' })),
      ...(X.length ? [E('b', { cls: 'gd-hlt' + (at0 ? '' : ' ol'), txt: tl, style: 'left:' + Math.round(at[0]) + 'px;top:' + Math.round(at[1]) + 'px' })] : [])
    );
  }
  /* ---------- the main area follows the step: the DITL of a motor, the ABC sheet of a faceplate ---------- */
  /* the machine the operator picked in a step with a number of machines to run (2 of the 3 SWP), while it is not running yet */
  function pickOf(s, ms) {
    if (!s || ms.length < 2 || els.pickI !== s.i || !els.pick) return null;
    return ms.find(a => motAddr(a) === els.pick && !call(() => a.on && a.on(), false)) || null;
  }
  function pickSet(s, ad) {
    els.pick = ad;
    els.pickI = s.i;
    try {
      fill();
    } catch (e) {}
    if (follow && document.body.dataset.tab === 'logic') goLogic(s);
  }
  /* user 2026-10-30 (dock mock-up v2): the motors of the step on cards; the one picked (or the START pressed) is the one the dock shows:
     its Lineup, its interlock, its START / STOP, its values. Not picked: the first one not running; a step with its number running: the
     standby (to put in AUTO) */
  const motorsOf = s => ((s && s.a) || []).filter(a => a.stop && motAddr(a) && MOTOR[motAddr(a)]);
  function selOf(s) {
    const ms = motorsOf(s);
    if (!ms.length) return null;
    if (els.selI === s.i && els.sel && ms.some(a => motAddr(a) === els.sel)) return els.sel;
    const on = a => call(() => a.on(), false),
      nOn = ms.filter(on).length;
    if (s.max && nOn >= s.max) return motAddr(ms.find(a => !on(a)) || ms[0]);
    return motAddr(pickOf(s, ms) || ms.find(a => !on(a)) || ms[0]);
  }
  function selSet(s, ad) {
    els.sel = ad;
    els.selI = s.i;
    els.stOpen = null;
    const a = motorsOf(s).find(x => motAddr(x) === ad);
    if (a && !call(() => a.on(), false)) pickSet(s, ad);
    else fill(true);
  }
  function goLogic(s, enter) {
    if (!follow || !s || goLogic.busy || els.lvBusy) return;
    /* 3.2.0 walkthrough #2: a field card (no DCS button, no faceplate) shows its SOP section in the Training list, not the sheet that
       happened to be open (ABC-057 at the ESP step). Retest #2 #13: the Logic page opened on a field card shows no sheet of another
       step, it says so (body.lsfield, app.css) until a sheet is picked */
    if (s.need && !(s.a || []).length && !(s.fps || []).length) {
      if (!enter) return toList(s);
      fieldNote(s);
      return;
    }
    document.body.classList.remove('lsfield');
    goLogic.busy = 1;
    try {
      /* 3.2.0-beta.26: a push button of a DITL drawing (BURNER ON of DITL-09, a discharge valve of DITL-20): that sheet, its row selected
         (a motor START goes first; was: the ABC sheet of the step's faceplate). Machine B ~ D open the drawing of A until they are sheets of their own (CHECKLIST 0.2) */
      /* the first motor of the step that is not running yet (the second SWP step opens SWP-B, not the running SWP-A) */
      const ms = (s.a || []).filter(a => a.stop && motAddr(a) && MOTOR[motAddr(a)]),
        /* R9 #73: a step already done (SWBP-A started, one is enough) stays on the running machine until Susunod (was: the B sheet,
           its REMOTE row red) */
        on1 = ms.find(a => call(() => a.on && a.on(), false)),
        nx = (on1 && (!s.max || call(() => GD().ready(), false)) ? on1 : null) || pickOf(s, ms) || ms.find(a => !call(() => a.on && a.on(), false)) || ms[0],
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
      goLogic.busy = 0;
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
  /* live test 2026-10-30 #25 (the "?" said only who and the item number): why the SOP item is done, what to see, the risk when it is
     skipped, by the kind of the item (its own words: valve line-up, vent, drain, start, monitor, standby AUTO, remote, level, adjust, power);
     the value to see is the Operating Limit of the SOP table when it has one */
  function whyOf(t) {
    const x = String(t || '');
    const R = [
      [/\bvent\b/i, 'inilalabas ang hangin para mapuno ng tubig ang linya / water box.', 'tubig na lumalabas sa vent (tuloy-tuloy, walang hangin)', 'air lock: kulang ang daloy, cavitation o vibration ng pump.'],
      [/\bdrain\b/i, 'sarado ang drain para hindi tumagas palabas ang tubig ng linya.', 'drain valve sarado', 'tagas at pagkawala ng tubig; hindi mapupuno ang linya.'],
      [/standby.*\bAUTO\b|\bAUTO\b.*standby/i, 'ang standby ay kusang aandar (logic ng DITL) kapag nag-trip ang tumatakbo.', 'standby: REMOTE at AUTO, hindi tumatakbo', 'walang back-up: mawawala ang daloy kapag nag-trip ang tumatakbong equipment.'],
      [/\bremote\b/i, 'sa REMOTE lang tinatanggap ng motor ang START / STOP ng DCS.', 'REMOTE sa motor card (DITL REMOTE MODE SELECTED = 1)', 'hindi tatanggapin ang START ng DCS; hindi aandar ang standby sa AUTO.'],
      [/breaker|\bMCC\b|\bCB\b|power|soft starter|racked/i, 'may kuryente at handang mag-close ang breaker ng motor.', 'breaker RACKED-IN / ready', 'hindi aandar ang motor (walang power o breaker na hindi handa).'],
      [/\b(start|initiate)\b(?![\s-]*up)/i, 'ito ang pag-andar ng equipment (DCS o local, kasama ang field operator).', 'RUNNING (pula) at tamang current', 'kapag kulang ang line-up o permissive, hindi ito tatanggapin ng logic o masisira ang equipment.'],
      [/monitor|current|temperature|vibration|pressure|amps?\b/i, 'patunay na maayos ang takbo ng motor at pump.', 'value sa loob ng SOP (Normal)', 'hindi mapapansin ang overload, mainit na bearing o mababang discharge bago mag-trip.'],
      [/\blevel\b|\bfill/i, 'tamang dami ng tubig bago gamitin ang tangke o linya.', 'level sa NL ng SOP', 'dry run ng pump o overflow ng tangke.'],
      [/adjust|throttl|gradually|slowly/i, 'itinatakda sa tamang operating point ng SOP.', 'value sa SOP', 'mali ang daloy o pressure (overload, mababang discharge).'],
      [/\b(open|close|valve)\b/i, 'tamang daan ng tubig / hangin bago at habang tumatakbo ang equipment.', 'posisyon ng valve ayon sa SOP', 'water hammer, walang daloy (dry run) o maling daan ng tubig.'],
      [/permissive|ensure|check|verify/i, 'tinitiyak na handa ang kalagayan bago ang susunod na hakbang.', 'kondisyon ayon sa SOP', 'hindi tatanggapin ng logic ang susunod na command, o aandar nang hindi ligtas.']
    ];
    const r = R.find(q => q[0].test(x));
    return r ? r.slice(1) : ['bahagi ng pagkakasunod-sunod ng start-up (PR-OPE-5002).', 'ayon sa SOP', 'maaaring hindi ligtas o hindi tama ang susunod na hakbang.'];
  }
  /* live test 2026-10-30 #13: a step of part of a section (H2 = SOP section 2 items 1 ~ 33, H3 = items 34 ~ 35): it = [first, last] (0-based) */
  function fieldList(secs, it) {
    const P = window.LS_PROC5002 || [],
      out = [];
    for (const si of secs)
      (P[si] ? P[si].s : []).forEach((x, i) => {
        if (it && (i < it[0] || i > it[1])) return;
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
  /* the unit of a loop: the range of its faceplate ("[0.0 ~ 432.0 T/H]"), built (hidden) for the step */
  const unitOf = t => {
    const fb = els.fps && [...els.fps.children].find(x => (x.querySelector('.gd-fph b') || {}).textContent === t);
    return ((/\[\s*-?[\d.]+\s*~\s*-?[\d.]+\s*([^\]\d][^\]]*)\]/.exec((fb && fb.textContent) || '') || [])[1] || '').trim();
  };
  /* user 2026-10-30 (dock mock-up v2, Check: "value, dapat ..."): the range a value to watch is checked against, read from its hint
     (the SOP or HMI figure written there: "SOP 2.2 ~ 2.4", "HMI 030: 207 ~ 243 A", "SOP ≥ 0.4", "Fig 1 ≤ 110", "123 ± 10"); a hint that
     is a condition of a later step ("coal ≥ 400 · retract > 700", "target −15") is not a range */
  function rangeOf(h) {
    const x = String(h || '')
      .split(/\s*·\s*/)
      .find(t => /^(SOP\b|HMI\b|purge\b|Fig\s*\d|[≥≤]|-?\d+(?:\.\d+)?\s*(?:~|±))/.test(t.trim()));
    if (!x) return null;
    const n = '(-?\\d+(?:\\.\\d+)?)',
      m1 = new RegExp(n + '\\s*~\\s*' + n).exec(x),
      m2 = new RegExp(n + '\\s*±\\s*' + n).exec(x),
      m3 = new RegExp('≥\\s*' + n).exec(x),
      m4 = new RegExp('≤\\s*' + n).exec(x);
    if (m1) return [+m1[1], +m1[2]];
    if (m2) return [+m2[1] - +m2[2], +m2[1] + +m2[2]];
    if (m3) return [+m3[1], Infinity];
    if (m4) return [-Infinity, +m4[1]];
    return null;
  }
  /* ---------- the content ---------- */
  function paintRun() {
    const R = isRun();
    els.run.textContent = R ? '● RUN · ❚❚' : '❚❚ PAUSED · ▶';
    els.run.className = 'gd-pill' + (R ? ' on' : ' off');
    els.run.title = R ? 'Tumatakbo ang simulation: pindutin para i-PAUSE' : 'Naka-PAUSE (hinto ang oras): pindutin para RUN';
    paintSpeed();
    return R;
  }
  function fill(force) {
    const g = GD();
    if (!dock || !g || !g.on || isMin()) return;
    const L = g.steps(),
      i = g.cur,
      s = L[i];
    const R = paintRun();
    els.bar.style.width = Math.round((100 * Math.min(i, L.length)) / L.length) + '%';
    if (s) els.maxI = Math.max(els.maxI || 0, i);
    /* 3.2.0 walkthrough #11: the SOP section of the step (the Training list numbers) */
    const sk = secOf(s),
      P0 = window.LS_PROC5002 || [];
    els.secT.textContent = sk ? 'Seksyon ' + sk + ' / ' + nSec() + ' · ' + ((P0[sk - 1] || {}).t || '') : s ? '' : 'Tapos ang start-up';
    els.secT.title = els.secT.textContent;
    {
      const inSec = L.map((x, k) => k).filter(k => secOf(L[k]) === sk);
      els.secS.textContent = (s ? g.STAGES[s.st] || '' : '150 MW') + (sk && inSec.length ? ' · PR-OPE-5002 · hakbang ' + (inSec.indexOf(i) + 1) + ' sa ' + inSec.length + ' ng seksyon' : '');
    }
    progPaint(sk, P0);
    els.secP.disabled = !secAt(-1);
    els.secN.disabled = !secAt(1);
    els.stp.textContent = s ? 'HAKBANG ' + (i + 1) + ' / ' + L.length : 'TAPOS · ' + L.length + ' / ' + L.length;
    els.ttl.textContent = s ? s.t : 'Nasa 150 MW na ang planta';
    els.stP.disabled = i <= 0;
    stepNx();
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
    /* the step: its controls first (no scroll at 1366 x 768), then the checklist. The PAUSED state is the pill of the header (one
       button: was the pill and a RUN box), the title is in the step bar */
    const card = E('div', { cls: 'gd-card' });
    /* user 2026-10-29 (batch item 3: "kitang-kita agad, walang scroll", 768 px high): the operator control of each loop of the step right
       under the title, one compact row: PV, SV, MV, mode, M / A / R, MV and SV by one step. It writes through the same actions as the
       faceplate below and the sheet (LS_GUIDE.A: the faceplate of the sheet), so there is one control layer */
    els.ctl = [];
    const fpTags = [];
    {
      const rows = [];
      for (const t0 of (s.fps || []).slice(0, 3)) {
        const t = call(() => LV().ctlTag(t0), null) || t0,
          f = call(() => LV().fp(t), null);
        if (!f) continue;
        fpTags.push(t);
        const ctl = f.kind === 'ctl',
          ro = E('div', { cls: 'gd-cv' }),
          op = (l, fn) => {
            const r = call(fn, '');
            if (r) {
              ro.textContent = '⚠ ' + r;
              ro.dataset.w = Date.now();
              return;
            }
            ro.dataset.w = 0;
            ro.dataset.a = l === 'A' || l === 'R' ? Date.now() : 0;
            if (window.lsEventAdd) lsEventAdd('DCS', 'DCS', 'Operator: ' + t + ' ' + l);
            fill();
          },
          b = (txt, title, fn, cls) => E('button', { type: 'button', cls: 'gd-cb' + (cls ? ' ' + cls : ''), txt, title, on: fn }),
          mvNow = () => call(() => LV().mvOf(LV().fp(t)), NaN),
          svNow = () => call(() => LV().svOf(LV().fp(t)), NaN),
          mdNow = () => call(() => LV().modeOf(LV().fp(t)), '?'),
          span = ctl && f.c && f.c.b && f.c.b.p ? Math.abs((f.c.b.p.rhi != null ? f.c.b.p.rhi : 100) - (f.c.b.p.rlo != null ? f.c.b.p.rlo : 0)) : 100,
          dsv = span >= 500 ? 1 : span >= 50 ? 1 : 0.1,
          bm = b('M', 'MANUAL', () => op('M', () => g.A.man(t, +mvNow() || 0)), 'md'),
          ba = b('A', 'AUTO (SV ng operator)', () => op('A', () => g.A.auto(t)), 'md'),
          br = ctl && f.c.remote ? b('R', 'REMOTE (SV mula sa logic)', () => op('R', () => g.A.rem(t)), 'md') : null,
          /* MV by 1 % and by 5 % (▲▲): the step buttons that only moved this MV ("SA damper ▲▲ +5 %") are not shown any more */
          mvd = d => b(Math.abs(d) > 1 ? (d > 0 ? '▲▲' : '▼▼') : d > 0 ? '▲' : '▼', 'MV ' + (d > 0 ? '+' : '') + d + ' % (MANUAL)', () => op('MV ' + (d > 0 ? '+' : '') + d + ' %', () => (mdNow() === 'MAN' ? g.A.man(t, Math.max(0, Math.min(100, (+mvNow() || 0) + d))) : 'Nasa ' + mdNow() + ': pindutin muna ang M'))),
          svd = d => b('SV ' + (d > 0 ? '▲' : '▼'), 'SV ' + (d > 0 ? '+' : '') + d + ' (AUTO)', () => op('SV ' + (d > 0 ? '+' : '') + d, () => (mdNow() === 'AUTO' ? g.A.auto(t, Math.round(((+svNow() || 0) + d) * 10) / 10) : 'Nasa ' + mdNow() + ': pindutin muna ang A'))),
          v = (k, u) => {
            const x = E('b', { txt: '—' }),
              e = E('em', { txt: u });
            return [E('div', { cls: 'gd-v' }, [E('small', { txt: k }), x, e]), x, e];
          },
          [pvD, pvB, pvU] = v('PV', ''),
          [svD, svB, svU] = v('SV', ''),
          [mvD, mvB] = v('MV', '%'),
          bar = E('i'),
          mdL = E('span', { cls: 'gd-mdl' }),
          desc = String((f.c && f.c.desc) || '').replace(/\s+/g, ' ').trim(),
          row = E('div', { cls: 'gd-ctl' }, [
            E('div', { cls: 'gd-ch' }, [E('b', { txt: t }), E('span', { cls: 'gd-cd', txt: desc.length > 40 ? desc.slice(0, 40).replace(/\s+\S*$/, '') + '…' : desc, title: desc }), mdL]),
            E('div', { cls: 'gd-vs' + (ctl ? '' : ' mv1') }, (ctl ? [pvD, svD] : []).concat([mvD])),
            E('div', { cls: 'gd-cbs' }, [bm, ba, br, E('span', { cls: 'gd-sp' }), mvd(-5), mvd(-1), mvd(1), mvd(5)].concat(ctl && f.c.q && f.c.q.sv != null ? [svd(-dsv), svd(dsv)] : []).filter(Boolean)),
            ro
          ]);
        mvD.append(E('span', { cls: 'gd-mvb' }, [bar]));
        els.ctl.push(() => {
          const md = mdNow(),
            pv = ctl ? call(() => LV().pvOf(LV().fp(t)), NaN) : NaN,
            mv = +mvNow();
          pvB.textContent = f1(pv);
          svB.textContent = f1(svNow());
          if (ctl && !pvU.textContent) pvU.textContent = svU.textContent = unitOf(t);
          mvB.textContent = f1(mv);
          bar.style.width = (isFinite(mv) ? Math.max(0, Math.min(100, mv)) : 0) + '%';
          mdL.textContent = md;
          mdL.className = 'gd-mdl ' + String(md).toLowerCase();
          /* A / R pressed and the loop stays MANUAL: the logic holds it (force manual); its sheet shows why */
          const ta = Date.now() - (+ro.dataset.a || 0);
          if (md === 'MAN' && ta > 1500 && ta < 8000) ro.textContent = '⚠ Nanatiling MAN: force manual ng logic (tingnan sa logic sheet sa ibaba: ' + f.shn + ')';
          else if (!(Date.now() - (+ro.dataset.w || 0) < 4000)) ro.textContent = '';
          for (const [x, m] of [[bm, 'MAN'], [ba, 'AUTO'], [br, 'REM']]) if (x) x.classList.toggle('on', md === m);
        });
        rows.push(row);
      }
      if (rows.length) card.append(E('div', { cls: 'gd-ctls' }, rows));
    }
    /* user 2026-10-29 (beta.54 live check: "NASA BABA" the START / STOP): the commands of the step (START / STOP with the feedback, the
       AUTO / MAN of the motor, the step's own buttons, the interlock with its FIELD contacts) right under the loop rows, before the
       explanation and the SOP list (they were at the bottom of the card, 1 900 ~ 2 700 px down on a 768 px screen) */
    const top = E('div', { cls: 'gd-top' });
    card.append(top);
    const ilWrap = E('div', { cls: 'gd-ilbox' });
    /* the checklist under the controls: what to do, the result, the values to watch; "Bakit?" and the SOP items folded */
    /* user 2026-10-30 (dock mock-up v2): the step's notes on top; the rest of the step in four stages (Lineup, Permissive, Start, Check) */
    const chk = E('div', { cls: 'gd-chk' });
    let why = null;
    /* retest #44: one line to do on top; a longer explanation folded under "Bakit?" */
    {
      const d = String(s.d || ''),
        m = /^(Gawin:[^.]*\.?)\s*(.*)$/.exec(d);
      /* R9 #89: every step has a "Gawin:" line (a step written without one: its title, which is the action) and the reason under
         "Bakit?" (was: only 8 steps had them) */
      /* the "Gawin:" line is the SUSUNOD NA GAWIN banner when nothing more precise is to be done (nextPaint) */
      els.doTxt = (m ? m[1] : 'Gawin: ' + String(s.t || '').replace(/\.?$/, '.')).replace(/^Gawin:\s*/, '');
      /* live check #96: a step note (alarms that are expected at this step) under the action, always shown */
      if (s.note) chk.append(E('p', { cls: 'gd-snote', txt: 'NOTE: ' + s.note }));
      /* the PAUSED state of the time, as a line (the pill of the header is its one button) */
      els.psd = null;
      if (!R) chk.append((els.psd = E('p', { cls: 'gd-snote gd-psd', txt: s.need && !s.c ? '❚❚ Naka-PAUSE ang oras: puwedeng gawin ang field step; ▶ RUN (sa itaas) bago ang DCS step.' : '❚❚ Naka-PAUSE ang oras: walang aandar (START / OPEN) hangga’t hindi ▶ RUN (sa itaas).' })));
      const rest = m ? m[2] : d;
      if (rest) why = E('details', { cls: 'gd-why' }, [E('summary', { txt: 'Bakit?' }), E('p', { txt: rest })]);
    }
    els.cond = E('div', { cls: 'gd-cond' });
    /* 3.2.0 retest #30: a done step waits for the trainee: "✓ TAPOS" with its result, then "Susunod ›" (was: the next step at once) */
    /* user 2026-10-29 (mock-up v3): the result line only; the › of the step bar turns green and goes on */
    els.okt = E('span');
    els.okb = E('div', { cls: 'gd-okb', hidden: '' }, [els.okt, E('em', { txt: 'pindutin ang › sa itaas' })]);
    /* (user 2026-10-30 mock-up v2: "✓ TAPOS" is said by the SUSUNOD NA GAWIN banner; els.okt keeps its text) */
    /* the field items of a field card / a DCS step. 3.2.0 walkthrough #4 #17: every step of the SOP section (the same list and the same
       ticks as the Training list, ls-train), open, with a check box; an AUTO step ticks from the logic (was: the field items only, folded) */
    els.trKey = null;
    els.after = [];
    els.auIt = [];
    els.before = [];
    els.gate = [];
    const fli = s.field && s.field.length ? fieldList(s.field, s.it) : [];
    /* user 2026-10-30 (dock mock-up v2): the SOP items of the step in two stages: before the START (1 Lineup) and from the START on (4 Check);
       a step with no equipment to start: all its items are its Lineup. Each item: its check box, its tag and limit, a "?" with who does it */
    let sopPre = null,
      sopPost = null;
    els.lineCb = [];
    if (fli.length) {
      const A = call(() => LV().done(), {}),
        dd0 = ls.get('ls-train', {});
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
      els.gate = [];
      const firstAu = fli.findIndex(f => f.k === 'auto' && !f.lim.note);
      els.trKey = JSON.stringify(dd0);
      sopPre = E('ul', { cls: 'gd-fl' });
      sopPost = cut >= 0 ? E('ul', { cls: 'gd-fl' }) : null;
      const notes = new Set();
      fli.forEach((f, fi) => {
        const ul = cut >= 0 && fi >= cut ? sopPost : sopPre;
        if (f.lim.note) {
          /* R9 #82: the NOTE of the SOP (auto-start conditions MOP / COP / EOP, bearing oil temperatures): read once, not ticked */
          if (!notes.has(f.lim.x)) {
            notes.add(f.lim.x);
            ul.append(E('li', { cls: 'gd-note' }, [E('span', { txt: f.lim.x })]));
          }
          return;
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
        /* the "?" of the item: who does it (the By column of the SOP table: AO = field operator, CRO = control room), where it is */
        const by = String(L0.by || '').trim(),
          whoT = by ? by.replace(/CRO/g, 'CRO (control room)').replace(/\bAO\b/g, 'AO (field operator)') : au ? 'CRO: ang logic ang nagpapakita na tapos' : '',
          wy = ((window.LS_SOP_WHY || {})[f.si + '.' + f.i] || whyOf(f.t)) /* #25: the item's own reason (sections 1 ~ 7), else by its kind */,
          wtx =
            [
              'Bakit: ' + wy[0],
              'Dapat makita: ' + ((window.LS_SOP_WHY || {})[f.si + '.' + f.i] ? wy[1] : [lm, f.g ? 'tag ' + f.g : ''].filter(Boolean).join(' · ') || wy[1]) + '.',
              'Kung lalaktawan: ' + wy[2],
              whoT ? 'Sino: ' + whoT + '.' : '',
              'PR-OPE-5002 seksyon ' + (f.si + 1) + ' (' + String(((window.LS_PROC5002 || [])[f.si] || {}).t || '').toLowerCase() + '), item ' + (f.i + 1) + '.', au ? 'AUTO: kusang nati-tick kapag nakita ng logic na tapos.' : '', cut >= 0 && fi >= cut ? 'Pagkatapos ng START: bukas kapag tumatakbo na ang equipment.' : '']
              .filter(Boolean)
              .join(' '),
          wq = E('button', { type: 'button', cls: 'gd-q', txt: '?', title: 'Bakit / sino', 'aria-label': 'Bakit?' }),
          wd = E('div', { cls: 'gd-qt', hidden: true, txt: wtx });
        wq.onclick = e => {
          e.preventDefault();
          wd.hidden = !wd.hidden;
          wq.classList.toggle('on', !wd.hidden);
        };
        const li = E('li', { cls: cb.checked ? 'dn' : '' }, [
          cb,
          E('label', { for: id }, [
            f.t,
            au ? E('em', { txt: 'AUTO' }) : f.k === 'tcs' ? E('em', { txt: 'TCS' }) : null,
            by ? E('em', { cls: 'gd-by', txt: by }) : null,
            f.g || lm || xn ? E('small', { cls: 'gd-lim' }, [f.g ? E('b', { cls: 'gd-tg', txt: f.g }) : null, lm ? ' ' + lm : '', xn ? ' ' + xn : '']) : null
          ]),
          wq,
          wd
        ]);
        if (au) {
          cb.disabled = true;
          cb.title = 'AUTO: kusang nati-tick kapag ipinakita ng logic na tapos (RUN)';
        }
        cb.onchange = () => {
          const dd = ls.get('ls-train', {});
          if (cb.checked) dd[k] = 1;
          else delete dd[k];
          /* live test 2026-10-30 #19: every SOP tick in the Event log (who: the By column, AO = field operator) */
          call(() => lsEventAdd('PR-OPE-5002', /\bAO\b/.test(by) && !/CRO/.test(by) ? 'FIELD' : 'SOP', (cb.checked ? '✓ ' : '✗ ') + (f.si + 1) + '.' + (f.i + 1) + ' ' + String(f.t).slice(0, 90)));
          ls.set('ls-train', dd);
          els.trKey = JSON.stringify(dd);
          li.classList.toggle('dn', cb.checked);
          /* 3.2.0 retest #26: the Training list shows the same tick at once */
          try {
            window.lsHome && lsHome.train && lsHome.train();
          } catch (e) {}
          live();
        };
        if (cut >= 0 && fi >= cut && !au) els.after.push({ cb, li, t: f.t, by });
        if (cut >= 0 && fi < cut && !au) els.before.push(cb);
        /* #20: the line-up of the DCS command: the items before the first item the logic ticks */
        if (!au && fi < (firstAu < 0 ? (cut >= 0 ? cut : 0) : firstAu)) els.gate.push(cb);
        /* the items of the Lineup stage that the operator ticks (the SUSUNOD NA GAWIN names the first one not done) */
        if (!(cut >= 0 && fi >= cut) && !au) els.lineCb.push({ cb, t: f.t, by });
        if (au) els.auIt.push({ k, cb, li });
        ul.append(li);
      });
      if (sopPost && !sopPost.children.length) sopPost = null;
    }
    /* the interlock of the motors of the step */
    els.il = [];
    for (const a of s.a || []) {
      const ad = a.stop || a.dg ? motAddr(a) : null; /* 3.2.0-beta.30: a BURNER ON (dg) has its interlock too (DITL-12 out 7) */
      if (ad && MOTOR[ad] && !els.il.some(x => x.ad === ad)) {
        const box = E('div', { cls: 'gd-il' });
        els.il.push({ ad, box });
        ilWrap.append(box);
      }
    }
    /* the buttons */
    els.btns = [];
    els.fieldCb = els.preGo = null;
    const bs = E('div', { cls: 'gd-btns' });
    for (const a of s.a || []) {
      const ad = a.stop || a.dg ? motAddr(a) : null; /* 3.2.0-beta.30: a BURNER ON (dg) has its interlock too (DITL-12 out 7) */
      /* user 2026-10-29 (mock-up v3 "iwasan ang doble"): a step button that only writes the MV / mode of a loop shown in the controls
         above ("SA damper 0 %", "SA damper ▲▲ +5 %") is left out: the operator uses the faceplate. The guide still knows it (s.a) */
      if (!a.stop && !a.dg && !a.loc && !a.mot && !a.sel && fpTags.length) {
        const m = /\bA\.(?:man|auto|rem|loc)\(\s*'([^']+)'/.exec(String(a.f)),
          tg = a.tag || (m && m[1]);
        if (tg && fpTags.includes(call(() => LV().ctlTag(tg), null) || tg)) continue;
      }
      /* 3.2.0 walkthrough #21: the push button of the drawing under the label (sheet, row, tag of the CRT P.B.); pressed, the row is
         shown on the sheet when the centre follows the step */
      const pb = pbOf(a, 1);
      const bt = E('button', { type: 'button', cls: 'gd-btn' + (a.stop ? ' go gd-st' : '') }, [a.l, pb ? E('small', { txt: pb.txt }) : null]);
      bt.onclick = () => {
        if (a.stop && ad) {
          els.sel = ad;
          els.selI = s.i;
        }
        if (s.max && a.stop && ad && els.pick !== ad && !call(() => a.on(), false)) {
          pickSet(s, ad);
          if (bt.dataset.block === '1') return;
        }
        if (bt.dataset.block === '1') return;
        if (pausedWarn(a)) return;
        /* retest #65 (R8: SWP-A started with 0 / 15 BAGO I-START items ticked); live test 2026-10-30 #20 (H5 / H7: the debris filter AUTO
           START with its line-up 0 / 1): every DCS command of the step (START, AUTO START, OPEN, AUTO) waits for the SOP items before it
           (the items above the first item the logic ticks); was a warning with a second press as an override, START only */
        if (!a.loc && (a.stop || a.mot || a.sel) && !call(() => a.on(), false)) {
          const G = els.gate || [],
            nd = G.filter(c => c.checked).length;
          if (G.length && nd < G.length) {
            if (els.ovw) {
              els.ovw.hidden = false;
              els.ovw._r = 1;
              els.ovw.textContent = '⚠ ' + nd + ' / ' + G.length + ' line-up item pa lang ang tapos (PR-OPE-5002). Tapusin muna ang line-up bago ang ' + a.l + '.';
            }
            return;
          }
        }
        let r = '';
        if (els.ovw && els.ovw._r) (els.ovw._r = 0), (els.ovw.hidden = true);
        try {
          r = a.f();
        } catch (e) {}
        /* live check #100: a button that refuses (the condition of the SOP not met yet) says why, and is not logged */
        if (typeof r === 'string' && r && els.ovw) {
          els.ovw.hidden = false;
          els.ovw._r = 1; /* stays until the next press (not the BAGO I-START warning below) */
          els.ovw.textContent = '⚠ ' + r;
          return;
        }
        /* retest #63: the DCS command in the Event log (sheet, row and tag of its CRT push button) */
        if (!a.loc) opLog(a.l, pb); /* a field button logs itself (FIELD) */
        if (pb && follow && document.body.dataset.tab === 'logic') openD(pb.sh, pb.row, 230);
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
          if (pb0 && follow && document.body.dataset.tab === 'logic') openD(pb0.sh, pb0.row);
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
                /* live test 2026-10-30 #12: AUTO only in REMOTE (PR-OPE-5002 "Ensure ... in remote position" before "Set the standby ... to
                   AUTO"; the AUTO start of DITL-29A / 30 / 112 needs REMOTE too) */
                if (v && call(() => modeOf(B.ad).rem, null) === false) {
                  if (els.ovw) {
                    els.ovw.hidden = false;
                    els.ovw._r = 1;
                    els.ovw.textContent = '⚠ LOCAL pa ang ' + a.l.replace(/^START\s+/, '') + ': FIELD I-REMOTE muna (field operator), saka AUTO.';
                  }
                  return;
                }
                dsel(dName(am.s), am.row, v, a.l.replace(/^START\s+/, '') + (v ? ' AUTO' : ' MAN') + ' (' + am.svc + ')');
              }
            }),
            { _am: am }
          );
          bs.append(B.am);
          /* #12: the LOCAL / REMOTE selector of a motor that is not running (the standby), set by the field operator */
          if (call(() => modeOf(B.ad).rem, null) != null) {
            B.rm = E('button', { type: 'button', cls: 'gd-btn gd-fix', txt: 'FIELD: I-REMOTE', title: 'Field operator (AO): LOCAL / REMOTE selector ng ' + a.l.replace(/^START\s+/, '') + ' sa REMOTE', on: () => dremote(B.ad, a.l.replace(/^START\s+/, '')) });
            bs.append(B.rm);
          }
        }
        bs.append(E('span', { cls: 'gd-brk' }));
      }
    }
    if (s.need) {
      const cb = E('button', { type: 'button', cls: 'gd-btn go', txt: s.pre ? 'Tapos na ang ' + Math.round(s.pre / 3600) + ' h purge' : 'Tapos na ito sa field' });
      els.fieldCb = cb;
      /* retest #55: a card with a field time (the 6 h ESP purge): "Tapos na" only when the time is over (dock live: els.preCb); the
         purge not started yet can be skipped only as a training shortcut, asked and logged */
      if (s.pre) els.preCb = { b: cb, i: s.i };
      /* 3.2.0 walkthrough #16: works PAUSED too; #4: the field items of the section are ticked in the Training list as well */
      cb.onclick = () => {
        if (s.pre) {
          const hd = call(() => g.holdOf(s), null);
          if (!hd || hd[0] < hd[1]) return;
          call(() => lsEventAdd('ESP', 'FIELD', 'Field operator: ' + Math.round(s.pre / 3600) + ' h ESP purge complete (H-1201 / F-1201 in service)'));
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
          (els.preGo = E('button', {
            type: 'button',
            cls: 'gd-btn',
            txt: 'Simulan ang ' + Math.round(s.pre / 3600) + ' h purge (oras ng planta)',
            on: () => {
              const dd = ls.get('ls-train', {});
              for (const f of fli) if (f.k !== 'auto') dd[f.si + '.' + f.i] = 1;
              ls.set('ls-train', dd);
              g.preStart(s.i);
              call(() => AN.field('esp', true));
              /* live test 2026-10-30 #19: the start of the field time in the Event log (SOP section 1: purge air heater H-1201 and fan F-1201) */
              call(() => lsEventAdd('ESP', 'FIELD', 'Field operator: ESP purge air heater H-1201 and purge air fan F-1201 START (EP PLC panel), ' + Math.round(s.pre / 3600) + ' h purge started'));
              fill(true);
            }
          })),
          (els.preSkip = E('button', {
            type: 'button',
            cls: 'gd-btn',
            txt: 'Laktawan ang ' + Math.round(s.pre / 3600) + ' h (training shortcut)',
            title: 'Para lang kung tapos na ang purge sa field: kailangan ng kumpirmasyon at naka-log sa Events',
            on: () => {
              if (!confirm('Laktawan ang ' + Math.round(s.pre / 3600) + ' h ESP purge? Training shortcut ito: ituturing na tapos na ang purge sa field. Naka-log ito sa Events.')) return;
              call(() => AN.field('esp', true));
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
    if (bs.children.length) top.append(bs);
    els.early = E('div', { cls: 'gd-warn', hidden: '' });
    els.pw = E('div', { cls: 'gd-warn', hidden: '' });
    els.ovw = E('div', { cls: 'gd-warn', hidden: '' });
    top.append(els.pw, els.ovw, els.early);
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
        /* user 2026-10-29 (batch item 3): the control of the step in the dock (this IS the faceplate of the sheet: AN.fpBuild writes the
           same signal), and one press to its block on the sheet, centred at a readable zoom and flashed (AN.showTag) */
        const sh = r.sheet,
          go = E('button', {
            type: 'button',
            cls: 'gd-lk',
            txt: 'Buksan sa sheet ↗',
            title: 'Buksan ang ' + sh + ' at ipakita ang ' + t,
            on: () => {
              window.lsSetTab && lsSetTab('logic');
              if (AN.cat !== 'an' && AN.setCat) AN.setCat('an');
              if (AN.showTag) setTimeout(() => AN.showTag(t, sh), 60);
            }
          });
        els.fps.append(E('div', { cls: 'gd-fp' }, [E('div', { cls: 'gd-fph' }, [E('b', { txt: t }), E('span', { txt: sh }), go]), box]));
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
      /* live check #91 (beta.51): the row shows a value of the PLANT MODEL only: the PV of the DCS loop of the row's tag (PI-DO0005 =
         PICDO0005) or of the level controller; a field gauge without a model (motor current, local pressure / temperature) reads
         "— walang model" (#49: "— field gauge"; before, the middle of the SOP range was shown as if read). The SOP value is in the hint */
      const nums = String(lm[0]).match(/-?\d+(?:\.\d+)?/g) || [],
        lo = nums.length ? +nums[0] : NaN,
        un = (/°C|ksc|kg\/cm2|bar|%|\bA\b|(?<=\d)A\b/.exec(lm[0]) || [/current/i.test(f.t) ? 'A' : ''])[0],
        tagFp = () => {
          for (const m of f.t.match(/\b[A-Z]{2,4}-?[A-Z]{1,2}[0O]?\d{3,5}[A-Z]?\b/g) || []) {
            const t = m.replace('-', '').replace(/^([A-Z]{2,4}?)D0+(?=\d)/, (x, a) => a + 'DO' + x.slice(a.length + 2));
            for (const c of [t, t.replace(/^([A-Z])I/, '$1IC')]) {
              const fp = call(() => LV().fp(c), null);
              if (fp && fp.kind === 'ctl') return fp;
            }
          }
          return null;
        };
      /* a level of the SOP table is the PV of its controller; a gauge with a DCS loop is that loop's PV; a laboratory value (pH, Fe)
         stays the SOP value */
      /* live test #49: the gauges of the SOP that the HMI reads from the plant model (unit.js AN_MU / AN_ACW): section 7 MWP current
         IIP0709A ~ C and header pressure PIMU0709 (MAKE-UP WATER page), section 8 ACWP current IIP1108A / B (027 page); the running pump */
      const U0 = (window.AN && AN.unit) || {},
        mdl =
          f.si === 6 && /current/i.test(f.t)
            ? ['IIP0709A ~ C', () => (U0.on ? Math.max(+U0.muI0 || 0, +U0.muI1 || 0, +U0.muI2 || 0) : NaN), 'A']
            : f.si === 6 && /pressure/i.test(f.t)
              ? ['PIMU0709', () => (U0.on ? +U0.muP : NaN), 'kg/cm²']
              : f.si === 7 && /current/i.test(f.t)
                ? ['IIP1108A / B', () => (U0.on ? Math.max(+U0.acI0 || 0, +U0.acI1 || 0) : NaN), 'A']
                : null;
      const lvl = /hotwell level/i.test(f.t) ? 'LCV-MU1110' : /deaerator level/i.test(f.t) ? 'LCV-CD1104' : null,
        gauge = /current|pressure|temperature/i.test(f.t),
        tfp = !lvl && gauge && !mdl ? tagFp() : null,
        nomod = !lvl && gauge && !tfp && !mdl,
        /* live test #21 (H6): a field gauge that the step's own values already read from the plant model (SWBP suction / inlet,
           discharge, current of each pump, with their SOP range) is not shown again as "— walang model" */
        kw = /current/i.test(f.t) ? /current/i : /suction|inlet pressure/i.test(f.t) ? /suction/i : /discharge/i.test(f.t) ? /discharge/i : /pressure/i.test(f.t) ? /suction|discharge|pressure/i : null;
      if (nomod && s.w && kw && stage.some(x => x[2] && kw.test(x[0]))) continue;
      /* #49: a gauge with no DCS signal (the dryer / compressor local panel T1 ~ T7, a local pressure gauge) is read in the field */
      const live = lvl
        ? () => call(() => LV().pvOf(LV().fp(lvl)), NaN)
        : mdl
          ? mdl[1]
          : tfp
            ? () => call(() => LV().pvOf(tfp), NaN)
            : nomod
              ? () => '— field gauge'
              : () => lm[0];
      sop.push([
        'SOP · ' + (nm.length > 34 ? nm.slice(0, 34).replace(/\s+\S*$/, '') + '…' : nm),
        live,
        lvl ? 'mm' : mdl ? mdl[2] : tfp ? un : '',
        x => (typeof x === 'number' ? (Math.abs(x) < 10 ? x.toFixed(2).replace(/0$/, '') : f1(x)) : x),
        [mdl ? mdl[0] : f.g, 'SOP ' + lm[0], lm.slice(1).join(' · ')].filter(Boolean).join(' · ')
      ]);
    }
    els.watch = own.concat(stage, sop.slice(0, 8)).map(([k, f, u, fm, hint]) => {
      const v = E('b', { txt: '—' }),
        ck = E('i', { cls: 'gd-wk', 'aria-hidden': 'true' });
      return { r: E('div', { cls: 'gd-wr' }, [ck, E('span', { txt: k }), E('span', {}, [v, E('em', { txt: u }), hint ? E('small', { txt: hint }) : null])]), v, f, fm, ck, rg: rangeOf(hint), k, u };
    });
    /* user 2026-10-29 (batch item 3: "kitang-kita agad, walang scroll"): the controls of the step (its faceplates: PV, SV, MV, mode) first,
       then the values to watch (3.2.0-beta.33 had the faceplates under the values) */
    /* user 2026-10-29 (mock-up v3): the faceplates of the sheet are not shown again under the controls (they were the same loops twice);
       they stay built for their units and live values */
    const watchBox = els.watch.length ? E('div', { cls: 'gd-watch' }, els.watch.map(x => x.r)) : null;
    /* #113 (user: "Bakit?" too short): the reason of the step, then where it comes from and what follows, from the data of the app
       (the SOP section of PR-OPE-5002, the logic sheets of the step, the values watched, the next step) */
    {
      const P0 = window.LS_PROC5002 || [],
        sk = secOf(s),
        sec = sk ? P0[sk - 1] : null,
        S = sheetsOf(s),
        nx = L[i + 1],
        W = (els.watch || []).map(w => w.r.children[1].textContent).filter(Boolean),
        ps = [];
      if (sec) ps.push('SOP: PR-OPE-5002 seksyon ' + sk + ' (' + sec.t + ')' + (sec.s && sec.s.length ? ', ' + sec.s.length + ' item ang seksyon.' : '.'));
      if (S.length)
        ps.push(
          'Logic: ' +
            S.map(x => x.l).join('; ') +
            '. ' +
            (S.some(x => x.ad || x.dg) ? 'Ang START ay dumadaan sa interlock ng DITL: kapag may ✕ sa PERMISSIVE, hindi aandar ang equipment.' : 'Ang loop ay sumusunod sa A / M / R ng operator at sa force manual ng logic.')
        );
      if (W.length) ps.push('Bantayan: ' + W.slice(0, 5).join(', ') + '.');
      if (nx) ps.push('Susunod: Hakbang ' + (i + 2) + ' · ' + nx.t + '.');
      if (ps.length) {
        if (!why) why = E('details', { cls: 'gd-why' }, [E('summary', { txt: 'Bakit?' })]);
        why.append(...ps.map(t => E('p', { cls: 'gd-why2', txt: t })));
      }
    }
    /* user 2026-10-30 (dock mock-up v2, approved "g na yan"): the step as one vertical checklist of the equipment picked on its card:
       1 Lineup (the SOP items before the START), 2 Permissive (its interlock), 3 Start (START / STOP, MAN / AUTO, the loop controls, the
       step's buttons), 4 Check (the values against their range, the SOP items after the START). A stage with nothing in it is left out;
       the one to do now is open, a ✓ on each one done (live: stagePaint) */
    const hasMot = motorsOf(s).length > 0;
    els.eq = hasMot ? E('div', { cls: 'gd-eq' }) : null;
    els.eqK = '';
    els.stg = [];
    const stg = (k, nm, sub, kids) => {
      kids = kids.filter(Boolean);
      if (!kids.length) return null;
      const num = E('span', { cls: 'gd-sn' }),
        cnt = E('span', { cls: 'gd-sc' }),
        hd = E('button', { type: 'button', cls: 'gd-shd', 'aria-expanded': 'false' }, [num, E('span', { cls: 'gd-snm' }, [E('b', { txt: nm }), E('small', { txt: sub })]), cnt]),
        bd = E('div', { cls: 'gd-sbd' }, kids),
        box = E('div', { cls: 'gd-stg' }, [hd, bd]),
        chip = E('button', { type: 'button', cls: 'gd-chip', title: nm + ' · ' + sub }, [E('span', { cls: 'gd-cn', txt: String(els.stg.length + 1) }), E('span', { txt: nm })]),
        o = { k, box, hd, bd, num, cnt, chip };
      hd.onclick = () => {
        const cur = stOpenK(s);
        els.stOpen = { i: s.i, k: cur === k ? '-' : k };
        live();
      };
      chip.onclick = () => {
        els.stOpen = { i: s.i, k };
        live();
      };
      els.stg.push(o);
      return box;
    };
    const secs = (s.field || []).map(x => x + 1).join(', ');
    const hasCtl = !!card.querySelector('.gd-ctl') || bs.children.length > 0,
      /* live test 2026-10-30 #3 (H4 hypochlorite pump): a step done only by the field operator at a local panel (no DCS command) says so
         (was "Gawin sa DCS · Controller (A / M, MV, SV) at mga button ng hakbang") */
      fldOnly = !hasMot && (s.a || []).length > 0 && (s.a || []).every(a => a.loc || /^FIELD\b/.test(a.l || ''));
    const stBoxes = [
      sopPre && sopPre.children.length ? stg('L', hasMot ? 'Lineup' : 'SOP', (hasMot ? 'Bago i-START · ' : 'Gawin at i-tick · ') + 'PR-OPE-5002 seksyon ' + secs, [sopPre]) : null,
      (els.il || []).length ? stg('P', 'Permissive', 'Start permission ng DITL (interlock)', [ilWrap]) : null,
      hasCtl
        ? stg(
            'S',
            hasMot ? 'Start' : s.need && !(s.a || []).length ? 'Kumpirmahin' : fldOnly ? 'Gawin sa field' : 'Gawin sa DCS',
            hasMot ? 'START / STOP · MAN / AUTO' : s.need && !(s.a || []).length ? 'Tapos na sa field' : fldOnly ? 'Field operator sa local panel · walang DCS control' : 'Controller (A / M, MV, SV) at mga button ng hakbang',
            [card]
          )
        : null,
      watchBox || sopPost || s.c ? stg('C', 'Check', 'Value laban sa SOP / HMI · ang kondisyon ng hakbang', [els.cond, watchBox, sopPost ? E('div', { cls: 'gd-flg', txt: 'PAGKATAPOS I-START (bukas kapag tumatakbo na)' }) : null, sopPost]) : null
    ].filter(Boolean);
    if (why) why.firstChild.textContent = 'Bakit ang hakbang na ito?';
    /* live test 2026-10-30 #3 ("nakakalito pa rin ang dock"): one line of the stages (✓ done, the one now lit) and only the open stage under
       it; a stage done is folded into its chip (press a chip to open it again) */
    const spr = els.stg.length > 1 ? E('div', { cls: 'gd-spr', role: 'group', 'aria-label': 'Mga yugto' }, els.stg.map(o => o.chip)) : null;
    b.append(chk, ...(els.eq ? [els.eq] : []), ...(spr ? [spr] : []), E('div', { cls: 'gd-stgs' }, stBoxes), ...(why ? [why] : []));
    footFill(s);
    if (first) {
      els.goKey = null;
      /* retest #38: a message of the sheet opened before (the status bar "Opened DITL-29A ...") does not stay on a new step */
      document.body.classList.remove('hasmsg');
      goStep(s);
    }
    live();
  }
  /* ---------- user 2026-10-30 (dock mock-up v2, approved "g na yan"): the cards of the motors, the four stages and the one thing to do ---------- */
  const btnOf = ad => (els.btns || []).find(B => B.ad === ad && B.a.stop);
  /* AUTO selected on the motor's drawing (DITL-29A row 4 AUTO MODE SELECTED): the standby */
  function autoOf(ad) {
    const B = (els.btns || []).find(x => x.ad === ad && x.am);
    if (!B) return false;
    const am = B.am._am;
    return call(() => DUI.rowVal(am.s, am.row), null) === 1 || !!(am.s.sig && am.s.sig[am.row + ':S']);
  }
  const mName = a => String(a.l).replace(/^START\s+/, '');
  const lineN = () => {
    const L = els.lineCb || [];
    return [L.filter(x => x.cb.checked).length, L.length];
  };
  /* the card of each motor: RUNNING (red), STANDBY (AUTO, outline), STOPPED (green: ready to start), BLOCKED (amber) with the reason */
  function eqPaint(s, selAd, blocked) {
    if (!els.eq) return;
    const ms = motorsOf(s),
      on = a => call(() => a.on(), false),
      nOn = ms.filter(on).length,
      [dL, nL] = lineN();
    const C = ms.map(a => {
      const ad = motAddr(a),
        mi = (els.mi || {})[ad] || {},
        st = mst(ad),
        au = autoOf(ad),
        hasAm = !!(els.btns || []).find(x => x.ad === ad && x.am);
      let c, t, r;
      /* live test #27: colour for the abnormal only: a normal "not ready yet" (line-up, standby not in AUTO) is grey NOT READY, a
         missing interlock amber INTERLOCK, a trip red TRIP (was: amber BLOCKED for all) */
      if (st === 'TRIP') [c, t, r] = ['trip', 'TRIP', 'Nag-trip: RESET sa field, saka START'];
      else if (on(a)) [c, t, r] = ['run', 'RUNNING', 'Tumatakbo'];
      else if (s.max && nOn >= s.max) [c, t, r] = au ? ['sby', 'STANDBY', 'AUTO: aandar kapag may nag-trip'] : ['nr', 'NOT READY', 'Ilagay sa AUTO para maging standby'];
      else if (dL < nL) [c, t, r] = ['nr', 'NOT READY', 'Lineup ' + dL + ' / ' + nL];
      else if (blocked[ad]) {
        const r0 = (mi.miss || [])[0];
        [c, t, r] = ['blk', 'INTERLOCK', 'Kulang: ' + (r0 ? svcN(r0.svc) || r0.svc : 'interlock')];
      } else [c, t, r] = ['stop', 'STOPPED', isRun() ? 'Handa: START' : 'Handa: ▶ RUN, saka START'];
      return { ad, nm: mName(a), c, t, r: r + (hasAm ? ' · ' + (au ? 'AUTO' : 'MAN') : ''), sel: ad === selAd, sh: MOTOR[ad] };
    });
    const k = JSON.stringify(C);
    if (k === els.eqK) return;
    els.eqK = k;
    els.eq.replaceChildren(
      ...(ms.length > 1 ? [E('div', { cls: 'gd-eqh', txt: s.max ? 'Piliin ang aandarin (kahit alin ' + s.max + ')' : 'Piliin ang equipment' })] : []),
      E(
        'div',
        { cls: 'gd-eqs n' + Math.min(C.length, 4) },
        C.map(x =>
          E('button', { type: 'button', cls: 'gd-ec' + (x.sel ? ' sel' : ''), title: x.sh + (x.sel ? ' (napili)' : ' · pindutin para piliin'), 'aria-pressed': String(x.sel), on: () => selSet(s, x.ad) }, [
            E('b', { txt: x.nm }),
            E('span', { cls: 'gd-es ' + x.c, txt: x.t }),
            E('small', { txt: x.r })
          ])
        )
      )
    );
  }
  /* the stage open: the one the operator opened on this step, else the first one not done */
  function stOpenK(s) {
    if (els.stOpen && els.stOpen.i === s.i) return els.stOpen.k;
    return els.stCur;
  }
  function stagePaint(s, selAd, rd) {
    if (!(els.stg || []).length) return;
    const mi = selAd ? (els.mi || {})[selAd] : null,
      selA = motorsOf(s).find(a => motAddr(a) === selAd),
      runSel = selA ? call(() => selA.on(), false) : false,
      [dL, nL] = lineN(),
      W = (els.watch || []).filter(w => w.rg),
      wOk = W.filter(w => w.r.classList.contains('ok')).length;
    const mis = selAd ? [mi] : Object.values(els.mi || {}),
      pOk = mis.every(m => !m || !m.live || m.run || m.sby || !m.miss.length);
    const ok = {
        L: dL >= nL,
        P: pOk,
        S: rd || (selA ? runSel || (mi && mi.sby && autoOf(selAd)) : false),
        C: rd
      },
      cnt = {
        L: nL ? dL + ' / ' + nL : '',
        P: mi ? (mi.run ? 'tumatakbo' : mi.sby ? 'standby' : mi.miss.length ? 'may kulang' : 'kumpleto') : mis.length ? (pOk ? 'kumpleto' : 'may kulang') : '',
        S: selA ? (runSel ? 'RUNNING' : mi && mi.sby ? (autoOf(selAd) ? 'STANDBY AUTO' : 'MAN') : '—') : rd ? 'tapos' : '',
        C: rd ? 'tapos' : (els.after || []).length ? 'SOP ' + ((els.after || []).length - postLeft().length) + ' / ' + els.after.length : W.length ? wOk + ' / ' + W.length + ' OK' : ''
      };
    const cur = els.stg.find(o => !ok[o.k]) || els.stg[els.stg.length - 1];
    els.stCur = cur.k;
    const op = stOpenK(s);
    els.stg.forEach((o, j) => {
      const isOk = !!ok[o.k],
        open = o.k === op;
      o.num.textContent = isOk ? '✓' : String(j + 1);
      o.cnt.textContent = (isOk && cnt[o.k] ? '✓ ' : '') + (cnt[o.k] || '');
      o.box.className = 'gd-stg' + (isOk ? ' ok' : '') + (o === cur && !rd ? ' cur' : '') + (open ? ' open' : '') + (!isOk && els.stg.indexOf(cur) < j ? ' wait' : '');
      o.bd.hidden = !open;
      /* #3: only the open stage is shown under the line of chips (a single stage: its box stays) */
      o.box.hidden = els.stg.length > 1 && !open;
      o.chip.className = 'gd-chip' + (isOk ? ' ok' : '') + (o === cur && !rd ? ' cur' : '') + (open ? ' open' : '');
      o.chip.firstChild.textContent = isOk ? '✓' : String(j + 1);
      o.chip.setAttribute('aria-pressed', String(open));
      o.hd.setAttribute('aria-expanded', String(open));
      /* live test #30: with the line of chips the open stage does not say its name again (the chip does); its sub line and count stay */
      o.hd.classList.toggle('mini', els.stg.length > 1);
      /* live test #29: the items already done are folded under "Nagawa na · n" (what is left stays in view) */
      if (open)
        for (const ul of o.bd.querySelectorAll('ul.gd-fl')) {
          const n = ul.querySelectorAll(':scope > li.dn').length;
          let t = ul.nextElementSibling;
          if (!t || !t.classList.contains('gd-dnt')) {
            t = E('button', { type: 'button', cls: 'gd-dnt' });
            t.onclick = () => (ul.classList.toggle('showdn'), stagePaint(s, selAd, rd));
            ul.after(t);
          }
          t.hidden = !n;
          const tx = (ul.classList.contains('showdn') ? 'Itago ang nagawa na ▴' : 'Nagawa na · ' + n + ' ▾');
          if (t.textContent !== tx) t.textContent = tx;
        }
    });
  }
  /* SUSUNOD NA GAWIN: one sentence and the one button that does it (the same button of the stage below, pressed for the operator) */
  function nextPaint(s, selAd, rd) {
    if (!els.nx) return;
    const ms = motorsOf(s),
      on = a => call(() => a.on(), false),
      nOn = ms.filter(on).length,
      selA = ms.find(a => motAddr(a) === selAd),
      mi = selAd ? (els.mi || {})[selAd] : null,
      lc = ms.length || s.need ? (els.lineCb || []).find(x => !x.cb.checked) : (els.lineCb || []).find(x => !x.cb.checked && (els.gate || []).includes(x.cb)) /* #20: the line-up before a DCS button */,
      /* a step with no motor card (a burner ON, a valve of a DITL): the first interlock with a missing contact */
      ilAd = !selA ? Object.keys(els.mi || {}).find(k => {
        const m = els.mi[k];
        return m.live && !m.run && !m.sby && m.miss.length;
      }) : null;
    let say = '',
      bl = '',
      fn = null;
    const pl = !rd && call(() => GD().ready(), false) ? preLeft().concat(postLeft()) : [],
      /* live test 2026-10-30 #8: the standby of a step of 2 running (2 SWBP): the third one to AUTO on its drawing (DITL-30 row 4) */
      sbA = s.sby && s.max && nOn >= s.max && !rd && !ms.some(a => !on(a) && autoOf(motAddr(a)) && call(() => modeOf(motAddr(a)).rem, null) !== false) /* #24: ONE standby (PR-OPE-5002 "one Standby Make-up Pump") */ ? ms.find(a => !on(a) && (els.btns || []).some(x => x.ad === motAddr(a) && x.am) && !autoOf(motAddr(a))) : null;
    const remB = a => {
      const B = (els.btns || []).find(x => x.ad === motAddr(a) && x.rm);
      return B && call(() => modeOf(B.ad).rem, null) === false ? B : null;
    };
    if (sbA && remB(sbA)) {
      /* live test 2026-10-30 #12: the standby to REMOTE first (field operator), then AUTO */
      const B = remB(sbA);
      say = 'Standby ' + mName(sbA) + ': LOCAL pa. FIELD I-REMOTE muna (SOP: "in remote position"), saka AUTO.';
      bl = 'FIELD: I-REMOTE ' + mName(sbA);
      fn = () => B.rm.click();
    } else if (sbA) {
      const B = (els.btns || []).find(x => x.ad === motAddr(sbA) && x.am);
      say = 'Ilagay ang ' + mName(sbA) + ' sa AUTO (standby: aandar kapag nag-trip ang tumatakbo; ' + dName(B.am._am.s) + ' row ' + (B.am._am.row + 1) + ').';
      bl = 'AUTO ' + mName(sbA);
      fn = () => {
        B.am.click();
        /* the SOP item of the standby (PR-OPE-5002 "Set the standby SWBP to AUTO") is what was just done */
        const it = (els.after || []).find(x => !x.cb.checked && /standby.*\bAUTO\b/i.test(x.t));
        if (it) {
          it.cb.checked = true;
          it.cb.dispatchEvent(new Event('change'));
        }
      };
    } else if (pl.length) {
      /* #120: the condition is met; the SOP items after the START are still to tick (Check) */
      say = ((els.after || []).includes(pl[0]) ? 'Check (pagkatapos i-START' + (pl[0].by ? ', ' + pl[0].by : '') + '): ' : 'SOP' + (pl[0].by ? ' (' + pl[0].by + ')' : '') + ': ') + pl[0].t + (pl.length > 1 ? ' · natitira: ' + pl.length + ' item' : '');
      bl = '✓ Nagawa na'; /* #26: one item ticked ("Tapos" is the whole step only) */
      fn = () => {
        pl[0].cb.checked = true;
        pl[0].cb.dispatchEvent(new Event('change'));
      };
    } else if (rd) {
      say = '✓ Tapos ang hakbang' + (els.skipped === s.i ? ' (nilaktawan: training shortcut)' : '') + '. Pindutin ang Susunod.';
      bl = 'Susunod ›';
      fn = () => stepGo(1);
    } else if (selA && on(selA) && s.max && nOn < s.max) {
      const rest = ms.filter(a => !on(a));
      say = mName(selA) + ' tumatakbo na. Pumili ng susunod (kahit alin): ' + rest.map(mName).join(' o ') + '.';
      bl = 'Piliin ' + mName(rest[0]);
      fn = () => selSet(s, motAddr(rest[0]));
    } else if (selA && mi && mi.sby) {
      const B = (els.btns || []).find(x => x.ad === selAd && x.am);
      if (!autoOf(selAd) && remB(selA)) {
        say = 'Standby ' + mName(selA) + ': LOCAL pa. FIELD I-REMOTE muna, saka AUTO.';
        bl = 'FIELD: I-REMOTE ' + mName(selA);
        fn = () => remB(selA).rm.click();
      } else if (!autoOf(selAd) && B) {
        say = 'Ilagay ang ' + mName(selA) + ' sa AUTO (standby: aandar kapag nag-trip ang tumatakbo).';
        bl = 'AUTO ' + mName(selA);
        fn = () => B.am.click();
      } else {
        /* live test beta.74 #38: the standby is set; the banner names what the step still needs (H8: fill the expansion tank by
           XV-MU1109 or the bypass V-MU1033), done by the operator in its faceplate (no button here) */
        const na = (s.a || []).find(x => (x.dg || x.fp) && !call(() => x.hide && x.hide(), false) && !call(() => x.on && x.on(), false));
        say = mName(selA) + ' ay STANDBY (AUTO).' + (na ? ' Susunod: ' + String(na.l).replace(/\s*\((DITL-[^)]*)\)/, ' ($1)') + (s.sec === 7 ? ' (punuin ang expansion tank T-1109 hanggang 1.7 m)' : '') + '.' : '');
      }
    } else if (lc && !(selA && on(selA))) {
      say = (ms.length ? 'Lineup' : 'SOP') + (lc.by ? ' (' + lc.by + ')' : '') + ': ' + lc.t;
      bl = '✓ Nagawa na'; /* #26: one item ticked ("Tapos" is the whole step only) */
      fn = () => {
        lc.cb.checked = true;
        lc.cb.dispatchEvent(new Event('change'));
      };
    } else if ((selA && mi && mi.live && !mi.run && mi.miss.length) || ilAd) {
      const ad = selA ? selAd : ilAd,
        m = els.mi[ad],
        box = (els.il || []).find(x => x.ad === ad),
        /* the first missing row that has its FIELD button (the sentence names that row, the button sets it) */
        rw = box ? [...(box.real || box.box).querySelectorAll('.gd-ilr.x')].find(r => r.querySelector('.gd-fix')) : null,
        fb = rw && rw.querySelector('.gd-fix'),
        r0 = m.miss[0],
        rt = rw ? String((rw.querySelector('.gd-it') || {}).firstChild ? rw.querySelector('.gd-it').firstChild.textContent : '') : '',
        rr = rw ? ((rw.querySelector('.gd-it small') || {}).textContent || '').replace(/^.*?(row [\d, ]+)$/, '$1') : '';
      say = 'Permissive' + (selA ? ' ng ' + mName(selA) : '') + ': ' + (rw ? rt + ' (' + m.sheet + ' ' + rr + ')' : (svcN(r0.svc) || r0.svc) + (r0.want ? '' : ' = OFF') + ' (' + m.sheet + ' row ' + r0.no + ')');
      if (fb) {
        say += '.';
        bl = fb.textContent.length > 26 ? 'FIELD: gawin' : fb.textContent;
        fn = () => fb.click();
      } else if (!isRun()) {
        /* the field contact is set; the logic reads it on its next scan */
        say += ': ▶ RUN para mabasa ng logic.';
        bl = '▶ RUN';
        fn = runNow;
      } else say += ': hindi field contact (tingnan ang "?" ng row sa Permissive: proseso o galing sa ibang logic).';
    } else if (selA && !on(selA)) {
      const B = btnOf(selAd);
      if (!isRun()) {
        say = 'Naka-PAUSE ang oras: ▶ RUN, saka START ' + mName(selA) + '.';
        bl = '▶ RUN';
        fn = runNow;
      } else if (B) {
        say = 'START ' + mName(selA) + ' (coordinate sa AO).';
        bl = 'START ' + mName(selA);
        fn = () => B.bt.click();
      }
    } else if (s.need) {
      /* a field card: tick its items, then confirm (the 6 h purge: start it, RUN) */
      if (els.preGo && !els.preGo.hidden && !call(() => GD().holdOf(s), null)) {
        say = 'Simulan ang ' + Math.round(s.pre / 3600) + ' h purge sa oras ng planta, saka ▶ RUN.';
        bl = els.preGo.textContent;
        fn = () => els.preGo.click();
      } else if (els.fieldCb && !els.fieldCb.disabled) {
        say = 'Kumpirmahin na tapos sa field: ' + (els.doTxt || s.t);
        bl = els.fieldCb.textContent;
        fn = () => els.fieldCb.click();
      } else say = els.cond && els.cond.textContent ? els.cond.textContent : els.doTxt || s.t;
    } else {
      /* a DCS step: its first button not done yet (OPEN, ON, a push button); a loop: the "Gawin:" line, the controls are in 3 */
      const B = (els.btns || []).find(x => !x.a.stop && !x.bt.hidden && x.bt.dataset.block !== '1' && x.a.on && !call(() => x.a.on(), false));
      say = els.doTxt || s.t;
      if (B) {
        bl = B.a.l;
        fn = () => B.bt.click();
      }
    }
    els.nx.classList.toggle('done', !!rd);
    if (els.nxS.textContent !== say) els.nxS.textContent = say;
    els.nxB.hidden = !fn;
    if (fn) {
      if (els.nxB.textContent !== bl) els.nxB.textContent = bl;
      els.nxB.onclick = () => {
        fn();
        setTimeout(() => live(), 150);
      };
    }
  }
  /* the live part, 4 times a second */
  function live() {
    const g = GD();
    const mOn = menuOn && dock && !dock.hidden;
    if (!dock || ((!g || !g.on || isMin()) && !mOn)) return;
    const s = g && g.on ? g.steps()[g.cur] : null;
    /* live test #28: a utility step (stage 0) or a step with its own values shows the first 3 values of its Bantayan on top (the
       same value and range as below; amber only when out of its range), not LOAD / DRUM; "Lahat ▾" keeps the 8 values of the plant */
    /* live test beta.74 #28: a utility step with no value of its own (H1 ESP purge) shows no plant value on top (the drum level of a
       cold boiler is not the step); "Lahat ▾" still opens the 8 values */
    const util = !!(s && (s.w || s.st === 0)) && !ls.get('ls-gdock-all', false),
      W = util ? (els.watch || []).slice(0, 3) : null;
    VALS.forEach(([k, u, f, fm], j) => {
      const V = els.vals[j],
        w = W && j < 3 ? W[j] : null;
      let t = '',
        x = NaN;
      if (W && j < 3) {
        if (w) {
          x = call(w.f, NaN);
          t = w.fm(x);
        }
        V.d.hidden = !w;
        if (w && V.kk.textContent !== w.k) ((V.kk.textContent = w.k), (V.kk.title = w.k), (V.uu.textContent = w.u || ''));
      } else {
        V.d.hidden = false;
        if (V.kk.textContent !== k) ((V.kk.textContent = k), (V.kk.title = ''), (V.uu.textContent = u));
        t = fm(call(f, NaN));
      }
      V.b.textContent = t;
      V.d.classList.toggle('hi', !!(w && w.rg && typeof x === 'number' && isFinite(x) && (x < w.rg[0] || x > w.rg[1])));
    });
    /* 3.2.0 retest #25 #34: RUN = red, STOP = green (power plant convention), TRIP = amber, flashing until ACK */
    LAMPS.forEach(([k, A], j) => {
      const tr = A.filter(a => mst(a) === 'TRIP');
      els.lamps[j].classList.toggle('on', any(A));
      els.lamps[j].classList.toggle('trip', tr.length > 0);
      els.lamps[j].classList.toggle('blink', tr.some(tripNew));
    });
    if (!(g && g.on)) {
      paintRun();
      return;
    }
    /* the rate of the water temperature (Fig 1), over the last minute of the plant */
    const t = +U().t || 0,
      x = +U().Tw;
    if (rate.t == null || t < rate.t) rate = { t, x, r: 0 };
    else if (t - rate.t >= 60) {
      rate.r = ((x - rate.x) * 3600) / (t - rate.t);
      rate.t = t;
      rate.x = x;
    }
    stepNx();
    if (tab() !== 'logic') lvOff();
    if ((tab() === 'training' || tab() === 'home') && document.documentElement.classList.contains('gd-tr') && window.lsSetTab) lsSetTab('operate');
    hmiMark(s);
    if (!s) return;
    /* 3.2.0 retest #26: a tick made in the Training list shows here (the list and the panel are the same ticks, ls-train) */
    if (els.trKey != null && JSON.stringify(ls.get('ls-train', {})) !== els.trKey) return fill(true);
    /* a state in the values to watch: RUNNING / IN OPERATION / OPEN red, STOPPED / CLOSED green (the colour convention of the plant) */
    (els.watch || []).forEach(w => {
      const x = call(w.f, NaN),
        t = String(w.fm(x));
      w.v.textContent = t;
      /* user 2026-10-30 (mock-up v2, Check): ✓ within the range of its hint, ! out of it; 0 of a machine not started is no reading */
      if (w.rg) {
        const n = typeof x === 'number' && isFinite(x) ? x : NaN,
          has = isFinite(n) && !(n === 0 && w.rg[0] > 0),
          okv = has && n >= w.rg[0] && n <= w.rg[1];
        w.ck.textContent = has ? (okv ? '✓' : '!') : '';
        w.r.classList.toggle('ok', okv);
        w.r.classList.toggle('no', has && !okv);
      }
      w.v.classList.toggle('run', /\b(RUNNING|IN OPERATION|OPEN(ED)?)\b/.test(t));
      w.v.classList.toggle('stop', /\b(STOPPED|CLOSED)\b/.test(t) && !/\bRUNNING\b/.test(t));
    });
    /* R9 #70: the "⚠ 0 / n BAGO I-START" warning goes away once the items are ticked or the machine runs (it stayed on) */
    if (els.ovw && !els.ovw.hidden && !els.ovw._r) {
      const nb = (els.before || []).length,
        nd = (els.before || []).filter(c => c.checked).length;
      if (nd >= nb || (s.a || []).some(a => a.stop && call(() => a.on(), false))) els.ovw.hidden = true;
      else els.ovw.textContent = els.ovw.textContent.replace(/^⚠ \d+ \/ \d+/, '⚠ ' + nd + ' / ' + nb);
    }
    const rd = isDone();
    if (els.okb) {
      els.okb.hidden = !rd;
      /* #115 (live check: "Pindutin ang Simulan ang 6 h purge" and "Naka-PAUSE ang oras" stayed under ✓ TAPOS of Hakbang 1): a done step
         has no reminder of what to press */
      if (els.psd) els.psd.hidden = rd;
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
        /* #115: a done purge step has no "Simulan" / "Laktawan" left */
        if (els.preSkip) els.preSkip.hidden = !!hd || rd;
        if (els.preGo) els.preGo.hidden = rd;
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
      els.cond.textContent = rd
        ? ''
        : hd
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
        nx = pickOf(s, ms) || ms.find(a => !call(() => a.on && a.on(), false)),
        on1 = ms.find(a => call(() => a.on && a.on(), false)),
        rd0 = call(() => g.ready(), false);
      /* R9 #73: to the next machine only while the step needs more than one (2 SWP, 2 SWBP); a step done goes back to its first
         running machine (2 SWBP running: pump A, as the 1-pump steps) */
      if (document.body.dataset.tab === 'logic') {
        if (nx && on1 && s.max && !rd0 && motAddr(nx) !== els.goKey) goLogic(s);
        else if (rd0 && on1 && motAddr(on1) !== els.goKey) goLogic(s);
      }
    }
    /* the interlock */
    const blocked = {};
    /* user 2026-10-30 (dock mock-up v2, "pano kung SWP C ang gsto ko istart"): the interlock of every motor of the step is read (its
       START is blocked by its own missing contacts), the one the operator picked on its card (selOf) is shown, row by row: ✓ or ✕, the
       FIELD button that sets a missing contact on its own row, a "?" with where the signal comes from (was: the full box only for the first
       motor not running, A then B; the others "SUSUNOD" without a button) */
    let mk = null;
    const selAd = selOf(s),
      nOn0 = s.max ? (s.a || []).filter(a => a.stop && call(() => a.on(), false)).length : 0;
    els.mi = {};
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
                : bit(it.ad)),
        sby = I.live && !run0 && s.max && nOn0 >= s.max;
      els.mi[it.ad] = { live: I.live, run: run0, sby, miss: I.live && !run0 ? I.miss : [], sheet: I.sheet, mov };
      if (I.live && !run0 && !sby && I.miss.length) blocked[it.ad] = 1;
      /* one motor at a time: the others are on their cards */
      if (selAd && it.ad !== selAd) continue;
      /* retest #49 (beta.45 check: with 2 SWP running the third still showed its REMOTE field button and interlock): the standby
         machine of a step with a number to run shows one line, no field button, no START */
      if (sby) {
        it.box.append(E('div', { cls: 'gd-ilh' }, [E('span', { txt: 'STANDBY · ilagay sa AUTO (button na MAN / AUTO sa 3 Start)' }), E('span', { cls: 'gd-ilm', txt: I.sheet })]));
        continue;
      }
      const head = E('div', { cls: 'gd-ilh' }, [E('span', { txt: run0 ? (mov ? '✓ REMOTE, HANDA' : '✓ TUMATAKBO NA') : 'START PERMISSION' }), E('span', { cls: 'gd-ilm', txt: I.sheet })]);
      it.box.append(head);
      if (!I.live) {
        it.box.append(E('div', { cls: 'gd-ild', txt: 'Lalabas ang interlock kapag na-load na ang planta (one world).' }));
        continue;
      }
      if (run0) continue;
      const F = fieldOf(it.ad);
      /* the FIELD contacts of the drawing, one group per signal (the same signal on several rows) */
      const fg = [];
      for (const f of F.field) {
        const k = f.s.name + '|' + svcN(f.svc),
          q = fg.find(x => x.k === k);
        if (q) q.L.push(f);
        else fg.push({ k, f, L: [f] });
      }
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
      const used = new Set();
      for (const G of grp.slice(0, 8)) {
        const r = G.r,
          rows = G.rs.map(x => x.no).join(', '),
          rn = svcN(r.svc) || r.svc || '';
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
        /* the fix on the row itself: the FIELD button of its missing field contact (the field operator sets the LOCAL / REMOTE selector,
           the limit switch ...: walkthrough #20); a process value of the plant model has no button (#109: no FORCE in Training) */
        const fix = [];
        for (const f of fs) {
          const q = fg.find(x => x.k === f.s.name + '|' + svcN(f.svc));
          if (!q || used.has(q.k)) continue;
          used.add(q.k);
          const nm = svcN(f.svc),
            rws = q.L.map(x => x.no).join(', ');
          if (f.av) continue;
          /* live test 2026-10-30 #24 (MWP-C AUTO = 1, then "Field operator: MWP C AUTO MODE SELECTED = 0"): the AUTO MODE SELECTED row is a CRT
             selection of the operator (the standby), not a field contact: no FIELD button resets it */
          if (/AUTO MODE SELECTED|\bCRT\b/.test(f.svc)) continue;
          fix.push(
            E('button', {
              type: 'button',
              cls: 'gd-fix',
              txt: 'FIELD: ' + (f.want ? (/\bREMOTE\b/.test(nm) ? 'I-REMOTE' : 'set ' + nm) : nm + ' = OFF'),
              title: 'Field operator (AO): ' + dName(f.s) + ' row ' + rws + ' (' + nm + ') = ' + (f.want ? 1 : 0),
              on: () => {
                fieldSet(q.L);
                try {
                  if (window.lsEventAdd) lsEventAdd(dName(f.s), 'FIELD', 'Field operator: ' + nm + ' = ' + (f.want ? 1 : 0) + ' (row ' + rws + ')');
                } catch (e) {}
                setTimeout(() => fill(true), 400);
              }
            })
          );
        }
        /* where the signal comes from, under the row's "?" (an indication, not a button: user 2026-10-30) */
        const src = fs
          .map(f => (f.av ? 'proseso (plant model): ' : 'field: ') + (f.tag ? f.tag + ' ' : '') + f.svc.replace(/^\(FROM STATION WIRING\)\s*/, '') + (f.av ? ' ' + f.av.txt : ''))
          .concat(ab.map(a => 'galing sa ' + a.replace(/^.*?(ABC-)/, '$1') + ' (operator sa DCS)')),
          proc = fs.some(f => f.av),
          qk = it.ad + '|' + G.k,
          qo = !!(els.ilq && els.ilq.has(qk)),
          wtx =
            I.sheet +
            ' row ' +
            rows +
            ': kailangang ' +
            (r.want ? 'ON' : 'OFF') +
            ' ang "' +
            rn +
            '" para tanggapin ang START.' +
            (src.length ? ' Pinanggagalingan: ' + src.join(' · ') + '.' : '') +
            (proc && !G.ok ? ' Proseso ito: gawin ang hakbang ng SOP na nagdadala rito (walang FIELD button).' : '');
        it.box.append(
          E('div', { cls: 'gd-ilr' + (G.ok ? '' : ' x') }, [
            E('i', { cls: 'gd-ik', txt: G.ok ? '✓' : '✕' }),
            E('span', { cls: 'gd-it' }, [rn + (r.cmp ? ' ' + r.cmp : '') + (r.want ? '' : ' (dapat OFF)'), E('small', { txt: (G.tag ? G.tag + ' · ' : '') + (r.other ? r.other + ' ' : '') + 'row ' + rows })]),
            E('span', { cls: 'gd-ifx' }, fix),
            E('button', {
              type: 'button',
              cls: 'gd-q' + (qo ? ' on' : ''),
              txt: '?',
              title: 'Bakit?',
              'aria-label': 'Bakit?',
              on: () => {
                els.ilq = els.ilq || new Set();
                if (els.ilq.has(qk)) els.ilq.delete(qk);
                else els.ilq.add(qk);
                live();
              }
            }),
            qo ? E('div', { cls: 'gd-qt', txt: wtx }) : null
          ])
        );
      }
      if (!I.miss.length) it.box.append(E('div', { cls: 'gd-ild ok', txt: '✓ Kumpleto ang interlock: puwede nang pindutin ang START.' }));
      /* retest #40: the missing rows outlined on the sheet in the centre */
      {
        const ms0 = dOf(it.ad);
        mk = { s: ms0, rows: I.miss.filter(r => (r.s || ms0) === ms0).map(r => r.row) };
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
        if (B.rm) B.rm.hidden = hd || on0 || call(() => modeOf(B.ad).rem, null) !== false;
        B.am.classList.toggle('on', au);
        B.am.title = (au ? 'AUTO (standby: aandar kapag nag-trip ang tumatakbo)' : 'MAN') + ' · pindutin para ' + (au ? 'MAN' : 'AUTO') + ' · ' + dName(am.s) + ' row ' + (am.row + 1);
      }
      /* retest #52: a field start is a toggle */
      if (B.a.tog && B.bt.firstChild) B.bt.firstChild.textContent = on0 ? B.a.l.replace('START', 'STOP').replace(/\bOPEN\b/, 'CLOSE') : B.a.l;
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
    /* user 2026-10-30 (dock mock-up v2): one motor at a time; the others are on their cards */
    for (const B of els.btns || [])
      if (selAd && B.ad && B.a.stop && MOTOR[B.ad] && B.ad !== selAd) for (const x of [B.bt, B.sb, B.lab, B.am, B.ft]) if (x) x.hidden = true;
    eqPaint(s, selAd, blocked);
    stagePaint(s, selAd, rd);
    nextPaint(s, selAd, rd);
    fpPaint(s, selAd, rd);
    /* out of order: a motor of a later step already running */
    const ea = call(() => g.early(), []);
    if (els.early) {
      els.early.hidden = !ea.length;
      els.early.textContent = ea.length ? '⚠ Nauna na: ' + ea.join(', ') + ' (hakbang sa susunod). Sa totoong start-up, sundin ang pagkakasunod.' : '';
    }
    for (const f of fpLive.concat(els.ctl || []))
      try {
        f();
      } catch (e) {}
  }
  /* live test #32: the section segments (done = before the step's section, current, to come) and the next three systems */
  function progPaint(sk, P0) {
    const n = nSec();
    if (!els.segs || !n) return;
    const k = sk + '/' + n;
    if (els.segs.dataset.k === k) return;
    els.segs.dataset.k = k;
    els.segs.replaceChildren(...Array.from({ length: n }, (_, j) => E('i', { cls: j + 1 < sk ? 'd' : j + 1 === sk ? 'c' : '', title: 'Seksyon ' + (j + 1) + ' · ' + ((P0[j] || {}).t || '') })));
    els.segs.setAttribute('aria-label', 'Seksyon ' + sk + ' sa ' + n + ' ng start-up');
    const nx = P0.slice(sk, sk + 3).map(x => String(x.t || '').replace(/\s*\(.*$/, '').toLowerCase().replace(/^./, c => c.toUpperCase()));
    els.segN.textContent = nx.length ? 'Susunod: ' + nx.join(' → ') : '';
    els.segN.title = els.segN.textContent;
  }
  /* 3.2.0-beta.74: "Buksan ang faceplate ng SWP-C" under the next action: the HMI page of the step, then the pop-out beside the motor */
  function fpPaint(s, selAd, rd) {
    const b = els.nxF;
    if (!b) return;
    const ms = motorsOf(s),
      R = window.LS_FPREG || {};
    let ad = selAd || (ms[0] && motAddr(ms[0])),
      a = ad && ms.find(x => motAddr(x) === ad),
      nmA = a ? mName(a) : '';
    /* live test beta.74 #23 #38: the motor of the step already running (H8 MWP-A), the next machine still to do: a drawing button (AUTO
       SWP-C (standby), DITL-29A #C row 4; XV-MU1109 OPEN, DITL-78 row 5) or a field valve (fp: V-MU1033), the first one in SOP order */
    if (a && (call(() => a.on && a.on(), false) || (els.mi && els.mi[ad] && els.mi[ad].sby && autoOf(ad)))) a = null;
    if (!a) {
      const key = x => x.fp || (x.dg && x.dg[0]),
        d = (s.a || []).find(x => key(x) && R[key(x)] && !call(() => x.hide && x.hide(), false) && !call(() => x.on && x.on(), false));
      if (d) {
        ad = key(d);
        a = d;
        const tg = /\b[A-Z]{1,3}-[A-Z]{2}\d{4}\b/.exec(String(d.l));
        nmA = d.fp && tg ? tg[0] : String(d.l).replace(/^(AUTO|START|STOP)\s+/, '').replace(/\s*\(.*$/, '').replace(/\s+(OPEN|CLOSE|AUTO \/ MAN)$/, '');
      }
    }
    b.hidden = !!rd || !a || !window.LS_FPOP;
    if (b.hidden) return;
    const t = 'Buksan ang faceplate ng ' + nmA + ' ▸';
    if (b.textContent !== t) b.textContent = t;
    b.title = 'Sa HMI kumikilos ang operator: REMOTE / LOCAL (field), AUTO / MAN, START / STOP, permissive ng SOP at ng logic';
    b.onclick = () => {
      if (call(() => LS_FPOP.openAd(ad), false)) return;
      goStep(s);
      setTimeout(() => call(() => LS_FPOP.openAd(ad), false) || call(() => LS_FPOP.motor({ ad, n: nmA, d: MOTOR[ad] }), false), 700);
    };
  }
  /* the steps move on by themselves (RUN): the open step is checked every half second */
  setInterval(() => {
    const g = GD();
    if (menuOn && dock && !(g && g.on)) {
      try {
        live();
      } catch (e) {}
      return;
    }
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
    if (g && g.on) goLogic(g.steps()[g.cur], true);
  };
  setTimeout(() => {
    if (document.body.dataset.tab === 'training' && window.lsSetTab) lsSetTab('training');
  }, 0);
  /* 3.2.0-beta.74: the SOP line-up of the open step for the pop-out faceplate of one of its motors (the same ticks as the dock), else null */
  const sopFor = (ad, d) => {
    const g = GD(),
      s = g && g.on ? g.steps()[g.cur] : null;
    if (!s || !(s.a || []).some(a => ((a.stop || a.dg) && motAddr(a) === ad) || (a.dg && d && a.dg[0] === d))) return null;
    return { sec: secOf(s), items: (els.lineCb || []).map(x => ({ t: x.t, by: x.by, ok: !!x.cb.checked })) };
  };
  window.LS_DOCK = {
    sopFor,
    dName,
    amRow,
    openD,
    grpOn,
    tabFix,
    menu,
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
    dremote,
    mst,
    modeOf,
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
