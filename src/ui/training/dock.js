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
  const any = L => L.some(bit);
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
    ['OIL', ['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'Start-up burners A / B / C / D in service'],
    ['COAL', ['M.3400', 'M.3401', 'M.3402'], 'Coal feeders A / B / C']
  ];
  /* ---------- the values to watch, by stage of the start-up (targets from PR-OPE-5002 and the boiler manual, as in guide.js) ---------- */
  let rate = { t: null, x: null, r: 0 };
  const lvl = ['Drum level', () => H().lvl(), 'mm', sgn, 'normal 0 · HH +254'];
  const WATCH = [
    [['Seawater pumps running', () => ['M.3353', 'M.3354', 'M.3355'].filter(bit).length, '', f0, '2 bago ang vacuum']],
    [lvl, ['FW flow', () => H().FW(), 'T/H', f1, ''], ['Deaerator level', () => pv('LCV-CD1104'), 'mm', sgn, 'SV 0']],
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15'], ['Total air', () => H().PA() + H().SA(), 'T/H', f0, 'purge > 115'], ['IDF coupling MV', () => mv('PICFG108'), '%', f0, '']],
    [['Furnace pressure', () => H().FP(), 'mmH₂O', f0, 'target −15'], ['Total air', () => H().PA() + H().SA(), 'T/H', f0, 'purge > 115']],
    [['Water temp', () => U().Tw, '°C', f0, 'kumukulo sa 100'], ['Drum pressure', () => U().Pd, 'kg/cm²', f1, ''], ['Bilis ng pag-init', () => rate.r, '°C/h', f0, 'Fig 1 ≤ 110'], ['Bed temp', () => U().Tb, '°C', f0, '']],
    [['Condenser vacuum', () => 100 * (+U().vac || 0), '%', f0, '≥ 90'], ['Drum pressure', () => U().Pd, 'kg/cm²', f1, '']],
    [['Bed temp', () => U().Tb, '°C', f0, 'coal ≥ 400 · retract > 700'], ['Coal flow', () => H().coal(), 'T/H', f1, ''], ['O₂', () => H().O2(), '%', f1, '3.5 ~ 8'], ['Bilis ng pag-init', () => rate.r, '°C/h', f0, 'Fig 1 ≤ 110']],
    [['Main steam press', () => H().MSP(), 'kg/cm²', f1, 'target 123'], ['Steam flow', () => H().MSF(), 'T/H', f0, '40 ~ 55'], ['RH pressure', () => H().RHP(), 'kg/cm²', f1, '≤ 9'], lvl],
    [['Turbine', () => (U().tb ? +U().tb.rpm : NaN), 'rpm', f0, '3000 sa sync'], ['Load', () => H().MW(), 'MW', f1, '45 pagkatapos ng sync'], ['Main steam temp', () => H().MST(), '°C', f0, '≥ 345'], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123']],
    [['Load', () => H().MW(), 'MW', f1, 'target 150'], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123 ± 10'], ['Coal flow', () => H().coal(), 'T/H', f1, ''], ['O₂', () => H().O2(), '%', f1, ''], lvl],
    [['Load', () => H().MW(), 'MW', f1, ''], ['Main steam press', () => H().MSP(), 'kg/cm²', f1, '123 ± 10'], lvl]
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
    const live = !!(window.WORLD && WORLD.on && WORLD.live);
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
    for (let r = 0; r < 40; r++) if (REM.test(rowInfo(s, r).svc) && !L.some(x => (x.s || s) === s && x.row === r)) L.push({ s, row: r, want: 1 });
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
    return { sheet: nm, rows: rows.filter(r => !r.start), miss, pb: pb || rows.some(r => r.start), live };
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
      if (REM.test(rowInfo(s, r).svc) && DUI.rowVal(s, r) !== 1) {
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
    if (!s || !(window.WORLD && WORLD.on && WORLD.live)) return null;
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
      /* the other limit switch of the same vane / damper: OPENED <-> CLOSED */
      const tw = f.svc.replace(/\bOPENED\b|\bOPEN\b|\bCLOSED\b/, w => (w === 'CLOSED' ? 'OPENED' : 'CLOSED'));
      if (tw !== f.svc)
        for (let r = 0; r < 40; r++) {
          const v = rowInfo(f.s, r).svc;
          if (r !== f.row && (v === tw || v === tw.replace('OPENED', 'OPEN'))) f.s.sig[r + ':S'] = !f.want;
        }
    }
    try {
      render();
    } catch (e) {}
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
    const w = Math.max(320, Math.min(560, ls.get('ls-gdock-w', innerWidth >= 1300 ? 400 : 350), innerWidth - 480)),
      h = Math.max(240, Math.min(innerHeight * 0.7, ls.get('ls-gdock-h', Math.round(innerHeight * 0.42))));
    R.style.setProperty('--gdw', w + 'px');
    R.style.setProperty('--gdh', h + 'px');
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
  function build() {
    if (dock) return;
    dock = E('aside', { id: 'gdock', role: 'complementary', 'aria-label': 'Training' });
    const g = E('div', { cls: 'gd-grip', title: 'I-drag para palakihin o paliitin', 'aria-hidden': 'true' });
    grip(g);
    els.run = E('span', { cls: 'gd-pill' });
    els.spd = [1, 10, 60, 300].map(v => E('button', { type: 'button', 'data-v': v, txt: '×' + v, title: 'Bilis ng simulation ×' + v, on: () => setSpeed(v) }));
    const hd = E('div', { cls: 'gd-hd' }, [
      E('b', { txt: 'Training' }),
      els.run,
      E('span', { cls: 'gd-sp' }),
      E('div', { cls: 'gd-seg', role: 'group', 'aria-label': 'Bilis' }, els.spd),
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
    const prog = E('div', { cls: 'gd-prog' }, [E('div', { cls: 'gd-bar' }, [els.bar]), E('div', { cls: 'gd-pl' }, [els.stp, els.stg])]);
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
    fpLive = [];
    fpKey = '';
    layout();
    try {
      window.lsHome && lsHome.train();
    } catch (e) {}
  }
  /* the guided start from Cold; resume = go on with the plant that runs */
  function start() {
    const g = GD();
    if (!g) return;
    for (const k in PERM) delete PERM[k];
    try {
      window.lsSetTab && lsSetTab('logic');
    } catch (e) {}
    g.start(() => {
      open();
      setSpeed(+ls.get('ls-gdock-spd', 10) || 10);
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
  function goStep(s) {
    if (!follow || !s) return;
    try {
      /* 3.2.0-beta.26: a push button of a DITL drawing (BURNER ON of DITL-09, a discharge valve of DITL-20): that sheet, its row selected
         (a motor START goes first; was: the ABC sheet of the step's faceplate). 3.2.0-beta.33: machine B ~ D open their own page (CHECKLIST 0.2) */
      /* 3.2.0-beta.33: the first motor of the step that is not running yet (the one of the interlock box): the second SWP = SWP-B, its own page */
      const mots = (s.a || []).map(a => (a.stop ? motAddr(a) : null)).filter(a => a && MOTOR[a]),
        isRun = ad => {
          try {
            return atRow(ad) != null ? dout(ad, atRow(ad)) === 1 : /^DITL-/.test(ad) ? runOut(ad) === 1 : !!bit(ad);
          } catch (e) {
            return false;
          }
        },
        mot = mots.find(a => !isRun(a)) || mots[0];
      if (mot) {
        window.lsSetTab && lsSetTab('logic');
        AN.xrefGo({ d: MOTOR[mot] });
        return;
      }
      const dg = (s.a || []).map(a => a.dg).find(Boolean);
      if (dg) {
        window.lsSetTab && lsSetTab('logic');
        AN.xrefGo({ d: String(dg[0]) });
        if (window.DUI && DUI.goItem) setTimeout(() => DUI.goItem(S.cur, undefined, null, { side: 'L', i: dg[1], k: S.ikFor === S.cur ? S.ik || 0 : 0 }), 80);
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
    } catch (e) {}
  }
  /* the running memory of a motor button (guide.js mot) */
  const motAddr = a => a.ad || null;
  /* ---------- the content ---------- */
  function fill(force) {
    const g = GD();
    if (!dock || !g || !g.on || isMin()) return;
    const L = g.steps(),
      i = g.cur,
      s = L[i];
    const R = !!(window.AN && ((AN.cat === 'an' && AN.run && !AN.view) || (AN.cat !== 'an' && typeof SIM !== 'undefined' && SIM)));
    els.run.textContent = R ? '● RUN' : '■ VIEW';
    els.run.className = 'gd-pill' + (R ? ' on' : ' off');
    els.run.title = R ? 'Tumatakbo ang simulation' : 'Nakahinto (VIEW): pindutin ang RUN sa itaas';
    paintSpeed();
    els.bar.style.width = Math.round((100 * Math.min(i, L.length)) / L.length) + '%';
    els.stp.textContent = s ? 'Hakbang ' + (i + 1) + ' / ' + L.length : 'Tapos: ' + L.length + ' / ' + L.length;
    els.stg.textContent = s ? g.STAGES[s.st] || '' : '150 MW';
    if (!force && i === lastCur) return live();
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
    if (prev) col1.append(E('div', { cls: 'gd-done', txt: i + ' · ' + prev.t }));
    /* the card */
    const card = E('div', { cls: 'gd-card' });
    card.append(E('div', { cls: 'gd-eb', txt: 'HAKBANG ' + (i + 1) + ' · ' + (g.STAGES[s.st] || '').toUpperCase() }), E('h3', { txt: s.t }), E('p', { txt: s.d || '' }));
    els.cond = E('div', { cls: 'gd-cond' });
    card.append(els.cond);
    /* the field items of a field card / a DCS step */
    const fi = s.field && s.field.length ? call(() => g.fieldOf(s.field), []) : [];
    if (fi.length)
      card.append(
        E('details', { cls: 'gd-field' }, [E('summary', { txt: 'Field: ' + fi.length + ' item' + (fi.length > 1 ? 's' : '') + ' ng field operator' }), E('ul', {}, fi.slice(0, 30).map(t => E('li', { txt: t })))])
      );
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
      const bt = E('button', { type: 'button', cls: 'gd-btn' + (a.stop ? ' go' : ''), txt: a.l });
      bt.onclick = () => {
        if (bt.dataset.block === '1') return;
        try {
          a.f();
        } catch (e) {}
        setTimeout(() => fill(), 300);
      };
      bs.append(bt);
      els.btns.push({ a, bt, ad });
      if (a.stop) {
        const sb = E('button', { type: 'button', cls: 'gd-btn', txt: a.stop.l });
        sb.onclick = () => {
          try {
            a.stop.f();
          } catch (e) {}
          setTimeout(() => fill(), 300);
        };
        bs.append(sb);
      }
    }
    if (s.need) {
      const cb = E('button', { type: 'button', cls: 'gd-btn go', txt: 'Tapos na ito sa field' });
      cb.onclick = () => (g.confirm(s.i), g.scan(), fill(true));
      bs.append(cb);
    }
    if (bs.children.length) card.append(bs);
    els.early = E('div', { cls: 'gd-warn', hidden: '' });
    card.append(els.early);
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
    if (els.fps && els.fps.children.length) col2.append(els.fps);
    /* the values to watch */
    /* 3.2.0-beta.26 (user 2026-10-25: "hindi recognized kung ano ang dapat i-monitor"): first the PV of what this step controls (the
       tags of its faceplates) and the motors it starts, then the values of the stage (was: the stage only: the condensate step showed the
       drum level and the FW flow) */
    const own = (s.fps || []).slice(0, 3).map(t0 => {
      const t = call(() => LV().ctlTag(t0), null) || t0;
      return [t + ' PV', () => call(() => LV().pvOf(LV().fp(t)), NaN), '', f1, call(() => 'SV ' + f1(LV().svOf(LV().fp(t))), '')];
    });
    const ms = (s.a || []).filter(a => a.stop && a.on);
    if (ms.length) own.push(['Running', () => ms.filter(a => call(() => a.on(), false)).length + ' / ' + ms.length, '', x => x, ms.map(a => a.l.replace(/^START /, '')).join(', ')]);
    els.watch = own.concat(WATCH[s.st] || []).map(([k, f, u, fm, hint]) => {
      const v = E('b', { txt: '—' });
      return { r: E('div', { cls: 'gd-wr' }, [E('span', { txt: k }), E('span', {}, [v, E('em', { txt: u }), hint ? E('small', { txt: hint }) : null])]), v, f, fm };
    });
    if (els.watch.length) col2.append(E('div', { cls: 'gd-watch' }, [E('div', { cls: 'gd-h', txt: 'BANTAYAN SA HAKBANG NA ITO' })].concat(els.watch.map(x => x.r))));
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
    if (first) goStep(s);
    live();
  }
  /* the live part, 4 times a second */
  function live() {
    const g = GD();
    if (!dock || !g || !g.on || isMin()) return;
    const s = g.steps()[g.cur];
    VALS.forEach(([k, u, f, fm], j) => (els.vals[j].b.textContent = fm(call(f, NaN))));
    LAMPS.forEach(([k, A], j) => els.lamps[j].classList.toggle('on', any(A)));
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
    (els.watch || []).forEach(w => (w.v.textContent = w.fm(call(w.f, NaN))));
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
    } else if (els.cond) els.cond.textContent = s.need ? 'Pindutin ang "Tapos na ito sa field" kapag nagawa na.' : '';
    /* the interlock */
    const blocked = {};
    /* 3.2.0-beta.26 (human run of the Training: the first SWP step showed three full interlock boxes, SWP-A / B / C, and the last
       button was under the screen): the full interlock only for the first motor of the step that is not running yet; a running one is
       one line, the others wait (one line) */
    let shown = 0;
    for (const it of els.il || []) {
      const I = interlock(it.ad);
      it.box.textContent = '';
      if (!I) continue;
      const run0 = I.live && (atRow(it.ad) != null ? dout(it.ad, atRow(it.ad)) === 1 : /^DITL-/.test(it.ad) ? runOut(it.ad) === 1 : bit(it.ad));
      if (I.live && (run0 || shown)) {
        it.box.append(E('div', { cls: 'gd-ilh' }, [E('span', { txt: run0 ? '✓ TUMATAKBO NA' : 'SUSUNOD' }), E('span', { cls: 'gd-ilm', txt: I.sheet })]));
        continue;
      }
      if (I.live) shown = 1;
      const head = E('div', { cls: 'gd-ilh' }, [E('span', { txt: 'INTERLOCK · START PERMISSION' }), E('button', { type: 'button', cls: 'gd-lk', txt: I.sheet.replace(' #', ' · ') + ' ↗', title: 'Buksan ang ' + I.sheet.replace(' #', ' · '), on: () => (window.lsSetTab && lsSetTab('logic'), AN.xrefGo({ d: I.sheet })) })]);
      it.box.append(head);
      if (!I.live) {
        it.box.append(E('div', { cls: 'gd-ild', txt: 'Lalabas ang interlock kapag tumatakbo ang simulation (RUN).' }));
        continue;
      }
      const run = atRow(it.ad) != null ? dout(it.ad, atRow(it.ad)) === 1 : /^DITL-/.test(it.ad) ? runOut(it.ad) === 1 : bit(it.ad);
      if (run) it.box.append(E('div', { cls: 'gd-ild ok', txt: '✓ Tumatakbo na.' }));
      const F = run ? { field: [], abc: [], by: {} } : fieldOf(it.ad);
      for (const r of I.rows.slice(0, 8)) {
        it.box.append(E('div', { cls: 'gd-ilr' + (r.ok ? '' : ' x') }, [E('span', { txt: (r.ok ? '✓ ' : '✕ ') + (r.svc || '') + (r.cmp ? ' ' + r.cmp : '') + (r.want ? '' : ' (dapat OFF)') }), E('code', { txt: r.tag || (r.other ? r.other + ' r' + r.no : 'row ' + r.no) })]));
        const o = !r.ok && r.s && F.by[r.s.name + ':' + r.row];
        if (o && (o.field.length || o.abc.length))
          it.box.append(
            E('div', {
              cls: 'gd-ilw',
              txt: '↳ ' + o.field.map(f => 'field: ' + (f.tag ? f.tag + ' ' : '') + f.svc.replace(/^\(FROM STATION WIRING\)\s*/, '') + (f.av ? ' ' + f.av.txt : '')).concat(o.abc.map(a => 'galing sa ' + a.replace(/^.*?(ABC-)/, '$1') + ' (operator sa DCS)')).join(' · ')
            })
          );
      }
      if (F.field.length)
        it.box.append(
          E('button', {
            type: 'button',
            cls: 'gd-btn gd-fld',
            txt: 'Field operator: ayusin ang ' + F.field.length + ' contact',
            title: F.field.map(f => f.s.name.replace(/^\(\d+\)/, '') + ' row ' + f.no + ': ' + f.svc + ' = ' + f.want).join('\n'),
            on: () => (fieldSet(F.field), setTimeout(() => fill(true), 400))
          })
        );
      if (!run && !I.miss.length) it.box.append(E('div', { cls: 'gd-ild ok', txt: '✓ Kumpleto ang interlock: puwede nang pindutin ang START.' }));
      if (!run && I.miss.length) {
        blocked[it.ad] = 1;
        it.box.append(E('div', { cls: 'gd-ild x', txt: 'Hindi pa aandar ang motor (ayon sa ' + I.sheet + '): ayusin muna ang may ✕.' }));
      }
    }
    for (const B of els.btns || []) {
      const bl = B.ad && blocked[B.ad];
      B.bt.dataset.block = bl ? '1' : '';
      B.bt.classList.toggle('dis', !!bl);
      B.bt.title = bl ? 'Kulang ang interlock sa ' + MOTOR[B.ad] + ' (tingnan ang may ✕)' : '';
      const on = B.a.on ? call(() => B.a.on(), false) : false;
      B.bt.classList.toggle('did', !!on);
    }
    /* the override of a blocked start: a field fault the simulator cannot clear stays a training choice */
    for (const it of els.il || [])
      if (blocked[it.ad] && !it.box.querySelector('.gd-ov')) {
        const B = (els.btns || []).find(x => x.ad === it.ad);
        if (B)
          it.box.append(
            E('button', {
              type: 'button',
              cls: 'gd-ov',
              txt: 'Simulan pa rin (training lang)',
              title: 'Sa totoong planta hindi ito aandar. Sa training, puwede mong ituloy para makita ang susunod.',
              on: () => {
                try {
                  B.a.f();
                } catch (e) {}
              }
            })
          );
      }
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
  window.LS_DOCK = { start, resume, open, stop, layout, fill, interlock, fieldOf, fieldSet, dmotor, dOf, needNet, leaves, permOf, dpress, dset, dout, runOut, get el() {
      return dock;
    } };
})();
