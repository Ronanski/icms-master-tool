/* DITL (digital logic) - the reader of a sheet, no DOM (3.2.0 Web Worker, stage b): the row texts and addresses (txt, tagOf, svcOf), the
   drivers / users of a net (maps), the names of rows and parts, what a net needs to become 1 or 0 (why, whyD) and the engine part of DUI
   (why, need, rowInfo, rowVal, outs, outVal, cause, rowNets: read by the one world src/world/world.js, the unit model and the Training).
   Moved as they were from src/ui/shell/ditl.js, which takes them from DREAD. Part of ONE script (joined by src/digital/order.list). */
const DREAD = (function () {
  const D = (window.DUI = window.DUI || {});
  /* 3.2.0 P3: on (S22)DITL-80S the 3-line output labels sit ON the wire (one line above, one on, one below: PDF (22)Ditl80S.pdf,
     output 57 = "S/B STEAM SUPPLY MOTOR VALVE TORQUE"), so the cell grouping (text up to 5.7 above a wire = that row) gave each
     output the first line of the next label down. For the text shown in the panel only, a sheet whose output texts sit like
     that (5 or more lines nearer to another wire) takes each line of the RS column from its nearest wire. The drawing, the
     links and the valve model (03-models.js reads the label of the wire itself) do not use this. */
  const rsNear = s => {
    if (s._rsN !== undefined) return s._rsN;
    const M = {};
    let mv = 0;
    s.rows.forEach((r, i) =>
      (s.cells[i + ':RS'] || []).forEach(t => {
        let j = i;
        s.rows.forEach((q, k) => Math.abs(q.y - t.y) < Math.abs(s.rows[j].y - t.y) && (j = k));
        if (j !== i) mv++;
        (M[j] = M[j] || []).push(t);
      })
    );
    for (const k in M) M[k].sort((a, b) => b.y - a.y);
    return (s._rsN = mv >= 5 ? M : null);
  };
  /* 3.2.0-beta.35: machine B / C / D of a shared drawing reads its own letter and address (WORLD.showText / addrK) */
  const isK = s => !!(s && s._inst && s._inst.k && window.WORLD && WORLD.showText);
  /* live test #56: machine A of a drawing for several machines (DITL-45 dryer A / B / C: TAG "M.1120/1125/M.112A") reads its own address too
     (M.1120, not the last one M.112A of dryer C) in the row text, the dock and the Event log */
  const isKA = s => !!(s && s._inst && (s._inst.k || s._inst.n > 1) && window.WORLD && WORLD.showText && WORLD.addrK);
  const txt = (s, i, c) => {
    const r = ((c === 'RS' && rsNear(s) ? rsNear(s)[i] : s.cells[i + ':' + c]) || [])
      .map(t => t.t)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return isK(s) ? WORLD.showText(s, r) : r;
  };
  /* the TAG NO. column holds the address (I.0406, M.0378) and, on many sheets, the service text too */
  const ADR = /^[A-Z]{1,3}\.[0-9A-F]{3,5}[A-Z]?$/;
  const tagOf = (s, i) => {
    const t = (s.cells[i + ':T'] || []).map(t => t.t.trim()).filter(t => ADR.test(t)).join(' '),
      /* an address list of the machines in the TAG NO. ("M.0110/210/1610/1710" DITL-09 row 5): the address of this machine */
      l = !t && (s.cells[i + ':T'] || []).some(x => /^[IMOB]\.[0-9A-F]{4}(\/[0-9A-F]{3,4})+\/?$/.test(x.t.trim()));
    if (l && window.WORLD && WORLD.addrK) return WORLD.addrK(s, i) || '';
    return t && isKA(s) ? WORLD.addrK(s, i) || t : t;
  };
  const svcOf = (s, i) => {
    const r = (s.cells[i + ':T'] || [])
      .concat(s.cells[i + ':S'] || [])
      .map(t => t.t.trim())
      .filter(t => t && !ADR.test(t))
      .join(' ');
    return isKA(s) ? WORLD.showText(s, r) : r;
  };
  const fmt = x => (x >= 60 ? (x / 60).toFixed(1) + ' min' : x.toFixed(1) + ' s');
  const auto = (s, i) => lockd(s, i) || !!(window.WORLD && WORLD.live && s._win && s._win.has(i));
  const MAPS = new WeakMap();
  const maps = s => {
    const nl = s.nl;
    let m = MAPS.get(nl);
    if (m) return m;
    const drv = new Map(),
      use = new Map(),
      add = (M, n, x) => n >= 0 && (M.get(n) || M.set(n, []).get(n)).push(x);
    nl.gates.forEach((g, gi) => {
      (g.out || []).forEach(n => add(drv, n, { g: gi }));
      (g.ins || []).forEach(n => add(use, n, { g: gi }));
      (g.s || []).forEach(n => add(use, n, { g: gi, pin: 'S' }));
      (g.r || []).forEach(n => add(use, n, { g: gi, pin: 'R' }));
      if (g.spNet !== undefined) add(use, g.spNet, { g: gi, pin: 'SP' });
    });
    nl.src.forEach(z => add(drv, z.n, { row: z.row }));
    (nl.ind || []).forEach(z => add(drv, z.n, { row: z.row }));
    (nl.xcon || []).forEach(c => add(c.dir === 'in' ? drv : use, c.n, { x: c }));
    (nl.one || []).forEach(n => add(drv, n, { one: 1 }));
    (nl.usr || []).forEach(u => add(drv, u.n, { u }));
    (nl.outs || []).forEach(o => add(use, o.n, { row: o.row, out: 1 }));
    (nl.pout || []).forEach(o => add(use, o.n, { po: o }));
    (nl.mir || []).forEach(o => add(use, o.n, { row: o.row, mir: 1 }));
    m = { drv, use };
    MAPS.set(nl, m);
    return m;
  };
  const rowNo = (s, i) => s.rows[i].n || i + 1;
  const inName = (s, i) => 'Input row ' + rowNo(s, i) + (tagOf(s, i) ? ' · ' + tagOf(s, i) : '') + (svcOf(s, i) ? ' · ' + svcOf(s, i) : '');
  const outName = (s, i) => 'Output row ' + rowNo(s, i) + (txt(s, i, 'RS') ? ' · ' + txt(s, i, 'RS') : '') + (txt(s, i, 'RL') ? ' · ' + txt(s, i, 'RL') : '');
  const gName = (s, g) =>
    g.t === 'TMR'
      ? 'TIMER ' + (g.tm.tag ? g.tm.tag + ' ' : '') + KN[g.k] + ' ' + fmt(tmSecs(g.tm))
      : g.t === 'CMP'
        ? 'COMPARATOR ' + cmpTxt(g)
        : g.t === 'FF'
          ? 'FLIP-FLOP (' + (g.spri ? 'SET' : 'RESET') + ' wins)'
          : g.t === 'CNT'
            ? 'COUNTER (N = ' + (g.N || 0) + ')'
            : g.t;
  /* a driver / user of a net: name and the part it selects */
  const dName = (s, d) =>
    d.g !== undefined
      ? (d.pin && d.pin !== 'SP' ? d.pin + ' of ' : d.pin ? 'set point of ' : '') + gName(s, s.nl.gates[d.g])
      : d.row !== undefined
        ? d.out
          ? outName(s, d.row)
          : d.mir
            ? inName(s, d.row) + ' (follows this wire)'
            : inName(s, d.row)
        : d.x
          ? (d.x.dir === 'in' ? 'FROM ' : 'TO ') + d.x.peer + ' connector (' + d.x.num + ')'
          : d.one
            ? 'DEFAULT "1" (always 1)'
            : d.u
              ? 'switch on the drawing'
              : d.po
                ? d.po.adr + ' ' + (d.po.txt || '')
                : '?';
  const dPick = d => (d.g !== undefined ? { t: 'g', g: d.g } : d.row !== undefined ? { t: 'row', i: d.row, side: d.out ? 'R' : 'L' } : null);
  const rowNets = (s, i, side) => (side === 'R' ? s.nl.outs : s.nl.src.concat(s.nl.ind || [])).filter(o => o.row === i).map(o => o.n);
  const val = (R, n) => (R ? (R.v[n] ? 1 : 0) : null);
  /* what must change for net n to be `want` (the values of RUN); the shortest way when one of several is enough */
  let ALL = false;
  function why(s, v, n, want, seen, d) {
    if (!!v[n] === !!want) return [];
    if (d > 16 || seen.has(n + ':' + want)) return [];
    seen.add(n + ':' + want);
    const D = maps(s).drv.get(n) || [];
    if (!D.length) return [{ txt: 'a wire with no source on this sheet', n }];
    let best = null;
    for (const x of D) {
      const r = whyD(s, v, x, want, seen, d + 1, n);
      if (want) {
        if (r.length && (!best || r.length < best.length)) best = r;
      } else best = (best || []).concat(r);
    }
    return best || [];
  }
  const shortest = L => L.filter(r => r.length).sort((a, b) => a.length - b.length)[0] || [];
  function whyD(s, v, x, want, seen, d, n0) {
    const W = want ? '1' : '0';
    if (x.row !== undefined) return [{ row: x.row, want, auto: auto(s, x.row) }];
    if (x.one) return [{ txt: 'DEFAULT "1": always 1' }];
    if (x.u) return [{ txt: 'the switch drawn on the sheet must be ' + W }];
    if (x.x) return [{ txt: 'FROM ' + x.x.peer + ' connector (' + x.x.num + ') must be ' + W + ' (open ' + x.x.peer + ')' }];
    const g = s.nl.gates[x.g],
      on = n => !!v[n],
      ins = g.ins || [],
      one = x2 => [{ g: x.g, txt: x2 }];
    switch (g.t) {
      case 'AND':
        /* FIRST-OUT (ALL): an AND at 1 is held by ALL its inputs (e.g. two of three drum level channels), not the shortest one */
        return want ? ins.filter(n => !on(n)).flatMap(n => why(s, v, n, 1, seen, d)) : ALL ? ins.flatMap(n => why(s, v, n, 0, seen, d)) : shortest(ins.map(n => why(s, v, n, 0, seen, d)));
      case 'OR':
        return want ? shortest(ins.map(n => why(s, v, n, 1, seen, d))) : ins.filter(on).flatMap(n => why(s, v, n, 0, seen, d));
      case 'NOT':
        return want ? ins.filter(on).flatMap(n => why(s, v, n, 0, seen, d)) : shortest(ins.map(n => why(s, v, n, 1, seen, d)));
      case 'FF': {
        const S0 = (g.s || []).some(on),
          R0 = (g.r || []).some(on);
        if (want) {
          const a = R0 && !g.spri ? (g.r || []).filter(on).flatMap(n => why(s, v, n, 0, seen, d)) : [];
          return a.concat(S0 ? [] : shortest((g.s || []).map(n => why(s, v, n, 1, seen, d))), S0 ? [] : one('then the flip-flop is SET (it stays 1 after S goes 0)'));
        }
        const a = S0 && g.spri ? (g.s || []).filter(on).flatMap(n => why(s, v, n, 0, seen, d)) : [];
        return a.concat(R0 ? [] : shortest((g.r || []).map(n => why(s, v, n, 1, seen, d))), R0 ? [] : one('then the flip-flop is RESET'));
      }
      case 'TMR': {
        const I0 = ins.some(on),
          P = fmt(tmSecs(g.tm)),
          tag = g.tm.tag || 'timer';
        if (g.k === 'on')
          return want ? (I0 ? one(tag + ' is counting: ' + fmt(g.st.acc || 0) + ' / ' + P) : shortest(ins.map(n => why(s, v, n, 1, seen, d))).concat(one('then ' + tag + ' counts ' + P))) : shortest(ins.map(n => why(s, v, n, 0, seen, d)));
        if (g.k === 'flash') return want ? shortest(ins.map(n => why(s, v, n, 1, seen, d))).concat(one('then the flasher blinks ON ' + fmt(g.fl[0]) + ' / OFF ' + fmt(g.fl[1]))) : shortest(ins.map(n => why(s, v, n, 0, seen, d)));
        if (g.k === 'off') return want ? shortest(ins.map(n => why(s, v, n, 1, seen, d))) : I0 ? shortest(ins.map(n => why(s, v, n, 0, seen, d))).concat(one('then ' + tag + ' holds 1 for ' + P)) : one(tag + ' holds 1: ' + fmt(g.st.acc || 0) + ' / ' + P);
        return want
          ? (g.k === 'pulse' ? (I0 ? shortest(ins.map(n => why(s, v, n, 0, seen, d))) : []) : I0 ? [] : shortest(ins.map(n => why(s, v, n, 1, seen, d)))).concat(one(tag + ' gives a ' + P + ' pulse when its input goes ' + (g.k === 'pulse' ? '0 → 1' : '1 → 0')))
          : one(tag + ' pulse ends after ' + P);
      }
      case 'CMP':
        return one('the analog value must be ' + (want ? '' : 'NOT ') + cmpTxt(g) + ' (now ' + anValN(s, ins[0]) + ')');
      case 'CNT':
        return one('the COUNTER must ' + (want ? 'reach N = ' + g.ks[g.out.indexOf(n0)] : 'move on') + ' (now N = ' + (g.N || 0) + ')');
    }
    return one(gName(s, g) + ' must give ' + W);
  }
  D.why = (s, n, want) => why(s, simSheet(s).v, n, want, new Set(), 0);
  /* 3.2.0-beta.23 TRAINING INTERLOCK (user 2026-10-24: "di ba may interlock yan s kada equipment? na-icoconsider ba ito sa start-up
     training?"): what output row `row` of DITL sheet s needs to become 1 now, read from the netlist (the "To make it 1" of the
     Selected tab), with the names of the input rows; [] = it is 1. D.outs lists the output rows of a sheet with their names */
  D.need = (s, row) => {
    try {
      if (!s.nl) s.nl = netlist(s);
      const o = s.nl.outs.find(x => x.row === row);
      if (!o) return null;
      const v = simSheet(s).v;
      if (v[o.n]) return [];
      const L = why(s, v, o.n, 1, new Set(), 0),
        out = [];
      for (const r of L) {
        const it =
          r.row !== undefined
            ? { row: r.row, no: rowNo(s, r.row), tag: tagOf(s, r.row) || '', svc: svcOf(s, r.row) || '', want: r.want ? 1 : 0, auto: !!r.auto }
            : { txt: r.txt };
        const k = r.row !== undefined ? 'r' + r.row + it.want : it.txt;
        if (!out.some(q => (q.row !== undefined ? 'r' + q.row + q.want : q.txt) === k)) out.push(it);
      }
      return out.slice(0, 12);
    } catch (e) {
      return null;
    }
  };
  D.rowInfo = (s, row) => ({ tag: tagOf(s, row) || '', svc: svcOf(s, row) || '' });
  D.rowVal = (s, row) => {
    try {
      const v = simSheet(s).v,
        an = s.nl.an || [];
      /* 3.2.0-beta.28 (human run of the Training: BFWP-A START stayed locked): an ANALOG input row (DITL-23A row 12 PT-FW1115-A BFWP
         A SUCTION PRESSURE > 1.5 kg/cm2) is met when the comparator of the drawing that reads it says 1; its own net is the analog value
         (0 / 1 meaningless). Before, the interlock read the analog net: always 0, the START of the Training was locked */
      return rowNets(s, row, 'L').some(n => {
        if (!an.some(a => a.net === n)) return v[n];
        const g = s.nl.gates.filter(x => x.t === 'CMP' && x.ins[0] === n);
        return g.length ? g.some(x => x.out.some(o => v[o])) : v[n];
      })
        ? 1
        : 0;
    } catch (e) {
      return null;
    }
  };
  D.outs = s => {
    if (!s.nl) s.nl = netlist(s);
    return [...new Set(s.nl.outs.map(o => o.row))].map(r => ({ row: r, name: outName(s, r) }));
  };
  D.outVal = (s, row) => {
    try {
      const o = s.nl && s.nl.outs.find(x => x.row === row);
      return o ? (simSheet(s).v[o.n] ? 1 : 0) : null;
    } catch (e) {
      return null;
    }
  };
  /* 3.2.0-beta.6 FIRST-OUT: why output row `row` of sheet s is 1 now (the inputs that are 1 and keep it 1), as text lines for the
     Event log: called by the one world (src/world/world.js) at the scan where a TRIP / MFT output goes 1 */
  D.cause = (s, row) => {
    const o = s.nl && s.nl.outs.find(x => x.row === row);
    if (!o) return null;
    ALL = true;
    let L;
    try {
      L = D.why(s, o.n, 0);
    } finally {
      ALL = false;
    }
    const seen = new Set(),
      lines = [];
    for (const r of L) {
      /* only what IS 1 now: the "then ..." and pulse lines of the To-make-it list are what would happen next, not the cause */
      if (r.row === undefined && (/^then /.test(r.txt || '') || / gives a .* pulse /.test(r.txt || ''))) continue;
      /* a row that must go 0 IS 1 now: a cause; a row that must go 1 is the reset of a memory (flip-flop): it holds the output */
      const t =
        r.row !== undefined
          ? r.want
            ? 'memory (flip-flop): stays 1 until ' + inName(s, r.row) + ' = 1'
            : inName(s, r.row) + ' = 1' + (r.auto ? ' · from the equipment / another sheet' : '')
          : String(r.txt || '').replace(/^the analog value must be NOT /, 'the analog value is ');
      if (!t || seen.has(t)) continue;
      seen.add(t);
      lines.push({ d: 1, k: r.row !== undefined && !r.want ? 'input' : 'gate', txt: t, sh: s.name, row: r.row !== undefined && !r.want ? r.row : undefined });
    }
    return { name: outName(s, row), lines: lines.slice(0, 12) };
  };
  D.rowNets = rowNets;
  /* the TRIP / RUNNING outputs of a motor drawing and its state (moved as they were from src/ui/hmi/events.js) */
  const TRO = new WeakMap();
  /* the TRIP output of a motor drawing ("SEAWATER PUMP A TRIP · CRT (ANN)"; not "TRIP COMMAND", not "TRIP INTERLOCK CONDITION",
     not "NOT TRIP"), and its RUNNING output */
  function motOuts(s) {
    let o = TRO.get(s);
    if (o && o.nl === s.nl) return o;
    o = { nl: s.nl, trip: null, run: null };
    try {
      for (const x of DUI.outs(s) || []) {
        const n = String(x.name || '');
        /* retest #37: not "NO TRIP PRESENT" (DITL-05: 1 when there is NO trip) */
        if (o.trip == null && /\bTRIP\b/.test(n) && !/COMMAND|INTERLOCK|NOT TRIP|NO TRIP|\bNO\b|\bCMD\b|RESET/.test(n)) o.trip = { row: x.row, name: n.replace(/^Output row \d+ · /, '').replace(/\s+[IO]\.\S+/g, '').replace(/\s*·.*$/, '').trim() };
        if (o.run == null && /RUNNING/.test(n) && !/NOT RUNNING|STOP|\bANY\b|LOCAL/.test(n)) o.run = { row: x.row };
      }
    } catch (e) {}
    /* a motor drawing only (a RUNNING output too): the MFT sheets have their own trip lines */
    if (!o.run) o.trip = null;
    TRO.set(s, o);
    return o;
  }
  /* the state of a motor drawing: 'TRIP' / 'RUN' / 'STOP' (null: no motor drawing, or the one world not built). The last state is
     kept while PAUSED (the drawing holds its values) */
  function motState(s) {
    if (!s || !window.DUI || !(window.WORLD && WORLD.on && WORLD.idx)) return null;
    try {
      if (!s.nl) s.nl = netlist(s);
      const o = motOuts(s);
      if (!o.trip && !o.run) return null;
      /* retest #34: a field trip (protection relay, dock FIELD TRIP) */
      if (s._ftrip) return 'TRIP';
      if (o.trip && DUI.outVal(s, o.trip.row) === 1) return 'TRIP';
      return o.run && DUI.outVal(s, o.run.row) === 1 ? 'RUN' : 'STOP';
    } catch (e) {
      return null;
    }
  }
  D.motState = motState;
  return { motOuts, motState, rsNear, isK, isKA, txt, ADR, tagOf, svcOf, fmt, auto, MAPS, maps, rowNo, inName, outName, gName, dName, dPick, rowNets, val, why, shortest, whyD };
})();
