/* WORLD (1.22.0): IISANG MUNDO ng ABC at DITL (CHECKLIST #25, CLAUDE.md "HINDI NAGBABAGO NA KAALAMAN" 1).
   Ang mga sheet ay nag-uusap ayon sa reference na nakasulat sa drawing (walang hula):
   - DITL -> DITL: ang FROM column ng input row (hal. "28A-77") = output item 77 ng DITL-28A (item 51..79 = row 1..29 sa kanan).
   - DITL -> ABC : ang "FROM DITL 26A-55" sa ABC = output item 55 ng DITL-26A; ang ABC input ay nagiging "galing sa DITL" (FORCE para baguhin).
   - ABC -> DITL : ang "TO DITL 26A-05" sa ABC = input row 05 ng DITL-26A.
   Kapag ON at tumatakbo (ABC Run, o DITL Simulate), bawat 0.2 s: kinukuwenta ang LAHAT ng DITL sheet (timers, MOV, motor din),
   tapos ipinapasa ang mga value. OFF = dating gawi (ang FROM DITL ay manual na input). Walang binago sa logic ng mga sheet. */
(function () {
  /* 3.2.0-beta.25 (user 2026-10-24: "tanggalin mo na rin ang button na ABC plus DITL ON, mula ngayon isang utak na yan"): the one
     world is ALWAYS ON, there is no switch any more (CLAUDE.md rule 7 changed). W.set stays for the tests that check one DITL sheet
     by itself; the app never turns it off */
  const W = (window.WORLD = { on: true, live: false, idx: null, out: {}, stat: null, ms: 0 });
  try {
    localStorage.removeItem('ls-world');
  } catch (e) {}
  /* 2.3.0-beta.1 (LINK-4): also a one-digit code with its letter, written without the 0 (DITL-15 row 10 MFT "3A-63" = 03A-63) */
  const RX = /\(?\s*([0-9]{2,3}[A-Z]?|[0-9][A-Z])\s*-\s*(\d{1,3})\s*\)?/gi;
  /* 2.5.0-beta.14: bottom ash FROM "BA01-11" = output NO. 11 of sheet BA-01 (sheet "(B1)DITL-BA01") */
  const BRX = /\bBA\s*-?\s*(\d{1,2})\s*-\s*(\d{1,2})\b/gi;
  /* 2.5.0-beta.15: limestone FROM "SHEET 214 - LINE21" = output LINE 21 of sheet "(L214)DITL-LS214" */
  const LSRX = /\bSHEET\s*(\d{2,3})\s*-\s*LINE\s*(\d{1,2})\b/gi;
  const refsOf = t => {
    const o = [];
    let m;
    t = String(t || '').replace(LSRX, (x, a, b) => {
      o.push({ code: 'LS' + a, nn: +b, other: false });
      return ' ';
    });
    t = String(t || '').replace(BRX, (x, a, b) => {
      o.push({ code: 'BA' + a.padStart(2, '0'), nn: +b, other: false });
      return ' ';
    });
    RX.lastIndex = 0;
    while ((m = RX.exec(String(t || ''))))
      o.push({
        code: (/^[0-9][A-Z]$/i.test(m[1]) ? '0' : '') + m[1].toUpperCase(),
        nn: +m[2],
        other: /^\(/.test(m[0]) && /\)$/.test(m[0])
      });
    return o;
  };
  const codeOf = name => {
    const m = /DITL-([0-9]{2,3}[A-Z]?|BA\d{2}|LS\d{2,3})$/i.exec(name || '');
    return m ? m[1].toUpperCase() : null;
  };
  function dSheet(code, from) {
    /* 2.5.0-beta.12: the sootblower set has its own DITL-80 (ditlIdx in 01-parse-build.js) */
    if (from && isSB(from)) {
      const i = ditlIdx(code, from);
      return i >= 0 ? S.sheets[i] : null;
    }
    const byCode = W._byCode;
    /* 2.3.0-beta.1 (LINK-1): "80S" is the sootblower PLC logic (ABC-017 "FROM DITL 80S-57 FOR S/B LOGIC"), not DITL-80: no fall back */
    if (/S$/.test(code)) return byCode[code] || null;
    return byCode[code] || byCode[code.replace(/[A-Z]$/, '')] || null;
  }
  function nlOf(s) {
    if (!s.nl || s.nl.v !== 10) {
      s.nl = netlist(s);
      s.uvDone = false;
    }
    return s.nl;
  }
  /* 2.2.0-beta.6: MACHINES OF A SHARED DRAWING. A DITL drawing says "NOTE: THE DIAGRAM IS THE SAME FOR BURNER B,C,D" (35 sheets)
     and every row carries the address of each machine ("I.0056/376" = BFWP A / B; "M.0122/222/1622/1722" = burner A ~ D).
     Machine A is the sheet itself; B / C / D are INSTANCES of it (same logic, own latches, timers, motors, valves). Every
     reference is connected to the instance of the machine it belongs to (beta.3 ~ 5 left 79 + 48 of them unconnected). */
  const LET = ['A', 'B', 'C', 'D'];
  /* the valves of the DITL-38 table (STN101 MV-BD1001 / 1002, STN102 the rest) */
  W.MCV = ['MV-BD1001', 'MV-BD1002', 'MV-FW1001', 'MV-FW1391', 'MV-FW1002', 'MV-FW1392', 'MV-MS1391', 'MV-MS1392'];
  const txtOf = s => {
    if (s._alltx === undefined)
      s._alltx = Object.values(s.cells || {})
        .flat()
        .map(x => x.t)
        .concat(((s.tx || []).map ? s.tx : []).map(x => x.t))
        .join(' \n ');
    return s._alltx;
  };
  /* "I.0056/376" -> [I.0056, I.0376]; "M.0122/222/1622/1722" -> [M.0122, M.0222, M.1622, M.1722]; "M.0470/480/ M.0490" -> 3 */
  const LRX = /\b([IMOB])\.([0-9A-F]{4})((?:\s*\/\s*(?:[IMOB]\.)?[0-9A-F]{3,4})+)/i;
  /* 3.2.0-beta.34 (CHECKLIST 0.2): EVERY address group of the cell, in order. A drawing for machines A ~ D writes them as two groups,
     "O.0088/408 O.0728/1048" = burner A / B / C / D (I/O list STN104: SVR-DO1043-A5 / B5 / C5 / D5), "M.1150/1160 M.1170" = SWP A / B / C
     (memory list STN103). Before, only the first group was read: machine C / D took the address of machine A */
  /* a short end of 2 ~ 4 digits: "I.0085/88/8B" = I.0085 / I.0088 / I.008B (DITL-45 dryer A / B / C) */
  const LRXG = /\b([IMOB])\.([0-9A-F]{4})((?:\s*\/\s*(?:[IMOB]\.)?[0-9A-F]{2,4}(?![0-9A-F]))*)/gi;
  const addrList = t => complete(addrList0(t));
  /* a list written short on one row (DITL-13 row 28 "M.0143/243 BURNER A SHUTDOWN COMMAND") and in full on another (DITL-10 row 20
     "M.0143/243 M.1643/1743" for the same signal): the full one, from the drawings themselves (the longest list that starts the same) */
  let FULL = null;
  function complete(la) {
    if (la.length < 2) return la;
    if (!FULL) {
      FULL = new Map();
      for (const sh of S.sheets || [])
        for (const k in sh.cells || {}) {
          const L = addrList0(cellTxt(sh, +k.split(':')[0], k.split(':')[1]));
          if (L.length >= 2 && (!FULL.has(L[0]) || FULL.get(L[0]).length < L.length)) FULL.set(L[0], L);
        }
    }
    const f = FULL.get(la[0]);
    return f && f.length > la.length && la.every((a, i) => f[i] === a) ? f : la;
  }
  const addrList0 = t => {
    const o = [];
    for (const m of String(t || '').matchAll(LRXG)) {
      const p = m[1].toUpperCase() + '.',
        b = m[2].toUpperCase();
      if (!o.includes(p + b)) o.push(p + b);
      for (const q of (m[3] || '').split('/').map(x => x.replace(/[IMOB]\./i, '').trim().toUpperCase()).filter(Boolean)) {
        const a = p + (q.length >= 4 ? q : b.slice(0, 4 - q.length) + q);
        if (!o.includes(a)) o.push(a);
      }
    }
    return o;
  };
  const cellTxt = (s, i, k) => (s.cells[i + ':' + k] || []).map(x => x.t).join(' ');
  /* 3.2.0-beta.34: the addresses of an input row: the TAG NO. column, or the service column when it lists more (DITL-45 row 6 TAG
     "I.0084", service "I.0084/87/8A PLANT AIR DRYER-A ALARM" = dryer A / B / C) */
  const rowList = (s, i) => {
    const a = addrList(cellTxt(s, i, 'T')),
      b = addrList(cellTxt(s, i, 'S'));
    return !a.length || (b.length > a.length && b[0] === a[0]) ? b : a;
  };
  /* the machines of a sheet: the note of the drawing, and the longest address list */
  function machinesOf(s) {
    if (s._mach !== undefined) return s._mach;
    const t = txtOf(s);
    let n = 1;
    if (/DIAGRAM IS (?:THE )?SAME|SAME\s+FOR\b|^\s*FOR\s+.*\b[B-D]\b/im.test(t)) {
      const nt = /(?:SAME\s+)?FOR\s+([^\n]{0,80})/i.exec(t.slice(t.search(/SAME|FOR\s+[A-Z]/i)));
      const lets = new Set();
      if (nt) for (const m of nt[1].matchAll(/\b([B-D])\b/g)) lets.add(m[1]);
      n = Math.max(n, 1 + lets.size);
      let mx = 1;
      /* the number of machines: the FIRST address group only (as before 3.2.0-beta.34); the second group of a cell is not always another
         machine (DITL-28A FAB A / B went to 3 machines with all groups counted) */
      const one = t => {
        const m = LRX.exec(String(t || ''));
        return m ? 1 + m[3].split('/').filter(x => x.trim()).length : 0;
      };
      for (const k in s.cells) mx = Math.max(mx, one(cellTxt(s, +k.split(':')[0], k.split(':')[1])));
      for (const x of (s.tx || []).map ? s.tx : []) mx = Math.max(mx, one(x.t));
      n = Math.max(n, Math.min(4, mx));
    }
    return (s._mach = n);
  }
  /* the machine letter of a text: the LAST machine named ("BFWP A AUX. LOP B TRIP" = B) */
  const MRX =
    /\b(?:BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP|LOP|CWP|CP|VALVE|SILO)\s*-?\(?([A-D])\)?(?![A-Z0-9])/gi;
  const machOfDitl = t => {
    const all = [...String(t || '').matchAll(MRX)];
    return all.length ? all[all.length - 1][1].toUpperCase() : null;
  };
  /* the equipment word of the last machine named ("MWP B RUNNING" -> MWP) */
  const machWord = t => {
    const all = [...String(t || '').matchAll(MRX)];
    return all.length ? all[all.length - 1][0].replace(/\s*-?\(?[A-D]\)?$/i, '').trim().toUpperCase() : null;
  };
  /* the equipment of a drawing, from its title ("MAKE-UP WATER PUMP A" -> PUMP, "COAL FEEDER A START/STOP" -> FEEDER) */
  /* one kind of equipment, several words on the drawings */
  const GROUP = w => {
    w = String(w || '').toUpperCase();
    if (/^(PUMP|BFWP|MWP|IWP|DOP|SWP|SWBP|CWP|CP|LOP)$/.test(w)) return 'PUMP';
    if (/^(BLOWER|FAB)$/.test(w)) return 'BLOWER';
    if (/^(BURNER|BNR|IGNITER)$/.test(w)) return 'BURNER';
    if (/^(FEEDER|SILO)$/.test(w)) return 'FEEDER';
    if (/^(COOLER|COLLER)$/.test(w)) return 'COOLER';
    return w;
  };
  const famOf = s => {
    if (s._fam === undefined) {
      let f = machWord(s.title || '');
      if (!f) {
        /* no machine letter in the title (DITL-07 PERMISSION TO BURNER (1)): the note "THE DIAGRAM IS THE SAME FOR BURNER B,C,D" */
        const t = txtOf(s),
          m = /FOR\s+([A-Z .]+?)\s*-?\s*[B-D]\b/i.exec(t.slice(Math.max(0, t.search(/SAME|FOR\s+[A-Z]/i))));
        if (m) f = (m[1].trim().split(/\s+/).pop() || '').replace(/\.$/, '');
      }
      s._fam = f ? GROUP(f) : null;
    }
    return s._fam;
  };
  /* a row names the machine of THIS drawing family (its letter turns with the instance) or an absolute one (BURNER B on the coal
     feeder drawing DITL-19 is burner B for every feeder) */
  const relative = (sb, rowT) => {
    const w = machWord(rowT),
      f = famOf(sb);
    if (!w || !f) return false;
    return GROUP(w) === f;
  };
  const machOfDesc = t => {
    const m =
      /(?:^|[\s(])([A-D])-(?=[A-Z])/.exec(t || '') ||
      /-([A-D])\d\b/.exec(t || '') ||
      /\b(?:BLOWER|PUMP|FEEDER|BFWP|BURNER|BNR|FAN)-([A-D])\b/i.exec(t || '');
    return m ? m[1].toUpperCase() : null;
  };
  /* sister sheets of another machine: DITL-12 BURNER A LIGHT OFF SEQUENCE (1) -> DITL-12A / 12B / 12C (contents DITL-0A ~ 0D) */
  function sister(base, L) {
    if (L === 'A') return base;
    const ti = String(base.title || '').toUpperCase();
    const m = /\b(BURNER|PUMP|FEEDER|COOLER|BLOWER|FAN)\s+A\b/.exec(ti);
    if (!m) return null;
    const want = ti.replace(m[0], m[1] + ' ' + L);
    return S.sheets.find(x => String(x.title || '').toUpperCase() === want) || null;
  }
  /* instance k of a base sheet (k = 0 is the sheet itself) */
  function makeInst(base, k, lbl) {
    const o = Object.assign(Object.create(Object.getPrototypeOf(base)), base, {
      name: base.name + ' #' + (lbl || LET[k]),
      sig: {},
      usw: {},
      av: null,
      av150: null,
      _win: null,
      nl: null,
      uvDone: true,
      _inst: lbl ? { base, k, n: 1, lbl } : { base, k, n: machinesOf(base) }
    });
    o.nl = netlist(o);
    return o;
  }
  /* the text of a row as it reads for machine instance k (the drawing is written for machine A: "BFWP A RUNNING" is "BFWP B
     RUNNING" in instance B, "BFWP B" the other pump is A); the k-th address of the row */
  W.remap = (s, t) => {
    const I = s && s._inst;
    if (!I || !I.k) return t;
    return String(t || '').replace(MRX, (m, L) => {
      if (!relative(I.base, m)) return m;
      const u = L.toUpperCase(),
        to = LET[(LET.indexOf(u) + I.k) % Math.max(I.n, LET.indexOf(u) + 1)];
      return m.replace(/([A-D])(\)?)$/i, to + '$2');
    });
  };
  /* 3.2.0-beta.35: a text of the drawing as it reads for machine instance k: the machine letter (W.remap) and, for an address list,
     the address of that machine only ("M.1150/1160 M.1170 SEAWATER PUMP A START P.B." -> "M.1160 SEAWATER PUMP B START P.B.") */
  W.showText = (s, t) => {
    const I = s && s._inst;
    if (!I || !I.k || !t) return t;
    let x = W.remap(s, t);
    const la = addrList(t);
    if (la.length > 1 && la[I.k]) {
      let first = true;
      x = x.replace(LRXG, () => (first ? ((first = false), la[I.k]) : '')).replace(/\s{2,}/g, ' ');
    }
    return x;
  };
  W.addrK = (s, i) => {
    const I = s && s._inst,
      b = I ? I.base : s,
      la = rowList(b, i);
    if (I && I.k && la.length < 2) {
      /* 3.2.0-beta.34: one address and a text that turns into ANOTHER row of the same drawing (DITL-24 PAF LOP A: row 25 "LOP A STOPPED"
         I.005C and row 26 "LOP B STOPPED" I.037C; for LOP B the two swap): the address of that row */
      const me = W.remap(s, cellTxt(b, i, 'S')).replace(/\s+/g, ' ').trim();
      for (const r in b.rows || [])
        if (+r !== i && cellTxt(b, +r, 'S').replace(/\s+/g, ' ').trim() === me) {
          const o = rowList(b, +r);
          if (o.length === 1) return o[0];
        }
    }
    return la[I ? I.k : 0] || la[0] || null;
  };
  /* index of every link, built once when the world is turned on */
  function build() {
    const t0 = performance.now();
    W._byCode = {};
    for (const s of S.sheets) {
      const c = codeOf(s.name);
      if (c && (!W._byCode[c] || (isSB(W._byCode[c]) && !isSB(s)))) W._byCode[c] = s;
    }
    /* the instances (kept when the world is built again: their state stays) */
    const old = new Map((W.inst || []).map(x => [x.name, x]));
    W.inst = [];
    W.instOf = new Map();
    for (const s of S.sheets) {
      nlOf(s);
      const n = machinesOf(s);
      s._inst = { base: s, k: 0, n };
      const L = [s];
      for (let k = 1; k < n; k++) {
        const nm = s.name + ' #' + LET[k];
        const x = old.get(nm) || makeInst(s, k);
        W.inst.push(x);
        L.push(x);
      }
      W.instOf.set(s, L);
    }
    /* 3.2.0 P1 #3 / #4 (docs/versions/v3.2.0/INSTRUMENT_VALVE_COVERAGE.md): DITL-38 MOTOR CONTROL VALVE is ONE drawing for the eight
       MOVs of its table (the drawing itself is MV-BD1001): one machine each, named by its tag, with its own open / close / stop push
       buttons, timers and position. The plant reads the main steam stop MOV and the BFP discharge MOVs (unit.js) */
    {
      const mcv = S.sheets.find(x => /\)DITL-38$/.test(x.name)),
        L = mcv && W.instOf.get(mcv);
      if (L && L.length === 1) {
        mcv._inst.lbl = W.MCV[0];
        W.MCV.slice(1).forEach((tag, j) => {
          const nm = mcv.name + ' #' + tag,
            x = old.get(nm) || makeInst(mcv, j + 1, tag);
          W.inst.push(x);
          L.push(x);
        });
      }
    }
    const inst = (base, k) => {
      const L = W.instOf.get(base);
      return L ? L[k] || null : null;
    };
    const din = new Map(), // DITL sheet (or instance) -> Map(row -> [sources])
      ain = [], // ABC inputs fed by a DITL output
      logic = [], // FROM DITL text on a net that the ABC logic computes
      lost = [],
      digFix = [] /* TO DITL by an analog wire: the comparator output next to it */,
      plc = [],
      byAddr = [],
      byLetter = [],
      bySister = [],
      byTo = [],
      noMach = [];
    const addIn = (s, row, src) => {
      if (!din.has(s)) din.set(s, new Map());
      const m = din.get(s);
      if (!m.has(row)) m.set(row, []);
      m.get(row).push(src);
    };
    const outRow = (code, nn, from) => {
      const d = dSheet(code, from);
      const it = d && ditlItem(d, nn);
      return it && it.side === 'R' ? { d, row: it.i } : null;
    };
    /* the instance (or sister sheet) that a row of machine-instance k of sheet sb gives for the output (d, orow) */
    const target = (sb, k, i, d, orow, other) => {
      /* 3.2.0: a DITL-38 valve reads its own outputs (open / closed feedback), not those of the first valve of the table */
      if (d === sb && d._inst && d._inst.lbl && inst(d, k)) return inst(d, k);
      const nd = machinesOf(d),
        rowT = cellTxt(sb, i, 'S') + ' ' + cellTxt(sb, i, 'T'),
        n = machinesOf(sb);
      if (nd > 1) {
        /* 1. the address of this machine on the row = the address of one machine on the output */
        const la = rowList(sb, i);
        if (la.length > 1 && la[k]) {
          const lo = addrList(cellTxt(d, orow, 'RS') + ' ' + cellTxt(d, orow, 'RT'));
          const j = lo.indexOf(la[k]);
          if (j >= 0 && inst(d, j)) {
            byAddr.push(1);
            return inst(d, j);
          }
        }
        /* 2. the machine named on the row (the drawing is written from machine A: in instance k the names turn by k) */
        const rt = rowT.replace(/\(\s*[0-9]{2,3}[A-Z]?\s*-\s*\d{1,2}\s*\)/g, ' '),
          Lr = machOfDitl(rt);
        if (Lr) {
          const j = relative(sb, rt) ? (LET.indexOf(Lr) + k) % Math.max(n, nd, LET.indexOf(Lr) + 1) : LET.indexOf(Lr);
          if (inst(d, j)) {
            byLetter.push(1);
            return inst(d, j);
          }
        }
        /* 3. the other machine of a pair, or the same instance */
        if (other && nd === 2) return inst(d, 1 - Math.min(k, 1));
        return inst(d, k < nd ? k : 0);
      }
      /* one drawing per machine (DITL-12 / 12A / 12B / 12C): the sister sheet of the machine named on the row */
      const rt = rowT.replace(/\(\s*[0-9]{2,3}[A-Z]?\s*-\s*\d{1,2}\s*\)/g, ' '),
        Lr = machOfDitl(rt);
      if (Lr && (Lr !== 'A' || k > 0)) {
        const L2 = relative(sb, rt) ? LET[(LET.indexOf(Lr) + k) % Math.max(n, LET.indexOf(Lr) + 1)] : Lr;
        const ss = sister(d, L2);
        if (ss) {
          bySister.push(1);
          return ss;
        }
        if (other) noMach.push(sb.name + ' r' + (i + 1) + ' ' + Lr + ' -> ' + d.name);
      }
      return d;
    };
    let dd = 0;
    for (const sb of S.sheets)
      W.instOf.get(sb).forEach((s, k) =>
        sb.rows.forEach((r, i) => {
          const c = sb.cells[i + ':F'];
          if (!c) return;
          for (const f of refsOf(c.map(x => x.t).join(' '))) {
            const o = outRow(f.code, f.nn, sb);
            if (!o) continue;
            /* 2.2.0-beta.6: machine k of this row on a drawing made for one machine: the output whose TO column names this row
               in brackets is the one of the other machine (DITL-03B out 70 FAB A STOPPED TO 28A-29, out 71 FAB B STOPPED TO
               "(28A-29)"): FAB B of DITL-28A #B row 29 reads out 71, not out 70 */
            if (k > 0 && machinesOf(o.d) < 2) {
              const me = codeOf(sb.name) + '-' + String(+sb.rows[i].n).padStart(2, '0'),
                alt = o.d.rows
                  .map((_, j) => j)
                  .filter(j => j !== o.row && refsOf(cellTxt(o.d, j, 'RT')).some(g => g.other && g.code + '-' + String(g.nn).padStart(2, '0') === me));
              if (alt[k - 1] != null) {
                byTo.push(sb.name + ' #' + LET[k] + ' r' + (i + 1) + ' -> ' + o.d.name + ' out ' + (+o.d.rows[alt[k - 1]].n + 50));
                addIn(s, i, { k: 'd', d: o.d, row: alt[k - 1], ref: f.code + '-' + (+o.d.rows[alt[k - 1]].n + 50) });
                dd++;
                continue;
              }
            }
            /* also the same sheet: an output that comes back as an input of the sheet (DITL-26A row 1 PAF TRIP = 26A-66) */
            const d = target(sb, k, i, o.d, o.row, f.other);
            addIn(s, i, { k: 'd', d, row: o.row, ref: f.code + '-' + f.nn });
            dd++;
          }
        })
      );
    let fa = 0,
      ta = 0;
    const wsh = new Set();
    for (const sh of AN.sheets) {
      if (/ABC-000/.test(sh.name)) continue;
      let ix;
      try {
        AN.ensure(sh);
        ix = AN.dsIdx(sh);
      } catch (e) {
        continue;
      }
      /* the machine of an ABC signal: its memory list description ("B-BFWP RUNNING (BC FROM S3)", M.3344) */
      const machAbc = n => machOfDesc(AN.descOf ? AN.descOf(sh, AN.nm(sh.S, n)) : '');
      const pick = (d, L, adr, row, isTo) => {
        const nd = machinesOf(d);
        if (nd > 1) {
          /* the address of the ABC signal is one of the machine addresses of the row (ABC-003B M.3125 -> DITL-07 row 4
             "M.3124/3125/3144/3145" = burner B; ABC-011 I.0091 -> DITL-32 73 "I.0011/91" = valve (2)) */
          if (adr) {
            const la = addrList(
              isTo ? cellTxt(d, row, 'T') || cellTxt(d, row, 'S') : cellTxt(d, row, 'RS') + ' ' + cellTxt(d, row, 'RT')
            );
            const j = la.indexOf(adr);
            if (j >= 0 && inst(d, j)) return inst(d, j);
          }
          if (L && inst(d, LET.indexOf(L))) return inst(d, LET.indexOf(L));
          return d;
        }
        if (L && L !== 'A') return sister(d, L) || d;
        return d;
      };
      for (const [n, refs] of ix.from) {
        let ok = null;
        for (const r of refs)
          for (const f of refsOf(r)) {
            const o = !ok && outRow(f.code, f.nn);
            if (o) ok = Object.assign(o, { ref: f.code + '-' + f.nn });
          }
        if (ok) ok.d = pick(ok.d, machAbc(n), String(AN.nm(sh.S, n) || '').replace(/^S\d\s*/, '').trim(), ok.row, false);
        /* only a real input of the sheet; a net that the ABC logic computes (ABC-004A M.3410 = AND of the two valve CLOSE) keeps its logic */
        if (ok && sh.S.ext.includes(n)) {
          ain.push({ sh, n, d: ok.d, row: ok.row, ref: ok.ref });
          fa++;
        } else if (ok) logic.push(sh.name + ' ' + AN.nm(sh.S, n) + ' (' + ok.ref + ')');
        else if (refs.some(r => refsOf(r).some(f => /S$/.test(f.code) && !dSheet(f.code))))
          /* 2.3.0-beta.1 (LINK-1): a PLC logic reference ("FROM DITL 80S-57 FOR S/B LOGIC"): that PLC is not in the app, set by hand */
          plc.push(sh.name + ' ' + AN.nm(sh.S, n) + ' FROM ' + refs.join('/'));
        else lost.push(sh.name + ' FROM ' + refs.join('/'));
      }
      for (const [n, refs] of ix.to) {
        let hit = false;
        for (const r of refs)
          for (const f of refsOf(r)) {
            const d0 = dSheet(f.code);
            const it = d0 && ditlItem(d0, f.nn);
            if (!it || it.side !== 'L') continue;
            const row = it.i;
            /* 2.2.0-beta.4: a TO DITL by an analog wire, to a limit row: the comparator output next to it ("TO DITL 40-09"
               MAIN STEAM PRESSURE LOW LOW by AI0131 of ABC-001C = M.310D, AI0131 < 72.9 kg/cm2) */
            const net = sh.S.nets && sh.S.nets[n];
            let src = n;
            if (
              net &&
              !net.dig &&
              /\bLOW\b|\bHIGH\b|H\.\s?H\.|L\.\s?L\.|[<>]/i.test((d0.cells[row + ':S'] || []).map(x => x.t).join(' '))
            ) {
              const alt = ix.toDig && ix.toDig.get(r + '@' + n);
              if (alt != null) {
                src = alt;
                digFix.push(sh.name + ' ' + AN.nm(sh.S, n) + ' -> ' + AN.nm(sh.S, alt) + ' (' + r + ')');
              } else lost.push(sh.name + ' ' + AN.nm(sh.S, n) + ' TO ' + r + ' (analog wire, no comparator output beside it)');
            }
            const d = pick(d0, machAbc(src), String(AN.nm(sh.S, src) || '').trim(), row, true);
            addIn(d, row, { k: 'a', sh, n: src, ref: sh.name });
            /* 3.2.0-beta.23: a signal of no machine (ABC-027 M.2504 FURNACE LOWER LAYER TEMP > 700 C) to a row of a machine drawing
               that names no machine of the family and has one address (DITL-19 row 16 for coal feeders A, B, C): every instance
               reads it (CLAUDE.md rule 1, one address = one signal). Before, feeders B and C had no furnace temperature permissive */
            if (d === d0 && machinesOf(d0) > 1 && !machAbc(src)) {
              const rt = cellTxt(d0, row, 'T') + ' ' + cellTxt(d0, row, 'S');
              if (rowList(d0, row).length <= 1 && !relative(d0, rt))
                W.instOf.get(d0).forEach((x, k) => k && addIn(x, row, { k: 'a', sh, n: src, ref: sh.name }));
            }
            hit = true;
          }
        if (hit) {
          ta++;
          wsh.add(sh.name);
        } else lost.push(sh.name + ' TO ' + refs.join('/'));
      }
    }
    /* 2.3.0-beta.1 (LINK-4): a DITL input row "FROM ABC-xxx" whose ABC drawing has no "TO DITL" text for it: the address or tag of
       the row (TAG NO. column, or the tag written on the row wire: DITL-115 row 17 "PICMS1006.MAN") is a signal of that ABC sheet
       (CLAUDE.md rule 1: one address = one signal). The address may be written there as "M.025B ( TO S4 M.3101 )" (ABC-013).
       A row that the DITL compares (DITL-79 row 6 TICMS1022.MV > 2 % / < 1 %) takes the analog value; a .MAN of a controller is
       its MANUAL state (the faceplate) */
    const WIRE_S1 = { 'M.311A': 'B.0646', 'M.311B': 'B.066E' },
      fromAbc = [],
      abcMiss = [],
      abcOf = code => {
        const c = /^\d{2}[A-Z]?$/.test(code) ? '0' + code : code;
        return AN.sheets.filter(p => p.name === 'ABC-' + c || (/^\d{3}$/.test(c) && new RegExp('^ABC-' + c + '[A-Z]$').test(p.name)));
      };
    for (const sb of S.sheets)
      W.instOf.get(sb).forEach((s, k) =>
        sb.rows.forEach((r, i) => {
          const F = cellTxt(sb, i, 'F'),
            fm = /ABC[-\s]?(\d{2,3}[A-Z]?)\b/i.exec(F);
          if (!fm) return;
          const have = din.get(s) && din.get(s).get(i);
          if (have && have.some(q => q.k === 'a' || q.k === 'v' || q.k === 'm')) return;
          const sheets = abcOf(fm[1].toUpperCase());
          if (!sheets.length) return;
          const T = cellTxt(sb, i, 'T') + ' ' + cellTxt(sb, i, 'S'),
            la = rowList(sb, i);
          /* machine B / C / D of a shared drawing: only its own address (the address of machine A is not its signal) */
          /* 3.2.0-beta.23: one address and a row that names no machine of this family (DITL-19 row 16 "FURNACE LOWER LAYER UNDER
             TEMP. > 700 C" M.3330 is ONE furnace for feeders A, B, C) is the same signal for every instance (CLAUDE.md rule 1);
             before, feeders B and C had no furnace temperature and tripped when the last start-up burner was put out */
          const common = k > 0 && !la[k] && la.length === 1 && !relative(sb, T);
          if (k > 0 && !la[k] && !common) return;
          const adr = la[k] || (common ? la[0] : null),
            wt = (sb.tx || []).filter(x => x && x.t && Math.abs((x.iy != null ? x.iy : x.y) - r.y) < 5 && /^[A-Z0-9-]{4,}\.(MAN|MV|PV|SV)$/.test(String(x.t).trim())),
            tm = /\b([A-Z]{2,}[A-Z0-9-]*\d[A-Z0-9-]*\.(?:MAN|MV|PV|SV))\b/.exec(T),
            tag = tm ? tm[1] : wt.length ? String(wt[0].t).trim() : null,
            an = s.nl && (s.nl.an || []).find(a => a.row === i);
          let src = null;
          for (const sh of sheets) {
            let SS;
            try {
              SS = AN.ensure(sh);
            } catch (e) {
              continue;
            }
            const nmOf = n => String(AN.nm(SS, n) || '').replace(/^S\d\s*/, '').trim(),
              drv = n => SS.drv[n] && SS.drv[n].some(d => d.k !== 'LINK');
            if (adr) {
              let n = SS.nets.findIndex((_, j) => nmOf(j) === adr && drv(j));
              if (n < 0) {
                const re = new RegExp('([IMB]\\.[0-9A-F]{4})\\s*\\(?\\s*TO\\s+S\\d\\s+' + adr.replace('.', '\\.') + '\\b'),
                  tx = (SS.tx || []).find(x => re.test(x.t)),
                  t = tx && re.exec(tx.t);
                if (t) n = SS.nets.findIndex((_, j) => nmOf(j) === t[1] && drv(j));
                if (t && n < 0) {
                  /* the address text names the wire it is written on (ABC-013 "M.025B ( TO S4 M.3101 )"): the nearest digital wire of the logic */
                  let bd = 20;
                  SS.nets.forEach((nn, j) => {
                    if (!nn.dig || !drv(j)) return;
                    for (const i of nn.segs) {
                      const g = SS.seg[i],
                        dx = g.x2 - g.x1,
                        dy = g.y2 - g.y1,
                        L2 = dx * dx + dy * dy,
                        u = L2 > 0 ? Math.max(0, Math.min(1, ((tx.x - g.x1) * dx + (tx.y - g.y1) * dy) / L2)) : 0,
                        d = Math.hypot(tx.x - (g.x1 + u * dx), tx.y - (g.y1 + u * dy));
                      if (d < bd) {
                        bd = d;
                        n = j;
                      }
                    }
                  });
                }
              }
              /* 2.5.0-beta.5: an address of the STN101 station wiring that the ABC sheet writes by its own name (memory list 101 / 103
                 M.311A / M.311B "Plenum/upper diff. press.(A) / (B) sig. abnormal (FROM S1)" = the SIG.AB of AI0134 DPT-FG1081 / AI0262
                 DPT-FG1082, I/O list STN101: B.0646 / B.066E on ABC-009A). DITL-21C row 19 / 20 */
              if (n < 0 && WIRE_S1[adr]) n = SS.nets.findIndex((_, j) => nmOf(j) === WIRE_S1[adr] && drv(j));
              if (n >= 0) src = { k: an ? 'v' : 'a', sh, n, ref: sh.name + ' ' + adr + (WIRE_S1[adr] && nmOf(n) === WIRE_S1[adr] ? ' = ' + WIRE_S1[adr] : '') };
            }
            if (!src && tag && /\.MAN$/.test(tag)) {
              const c = (AN.hmiCtrls ? AN.hmiCtrls(SS) : []).find(z => z.tag === tag.replace(/\.MAN$/, ''));
              if (c && c.amt) src = { k: 'm', sh, c, ref: sh.name + ' ' + tag };
            }
            if (!src && tag && /\.(MV|PV|SV)$/.test(tag)) {
              const c = (AN.hmiCtrls ? AN.hmiCtrls(SS) : []).find(z => z.tag === tag.replace(/\.\w+$/, ''));
              let n = SS.nets.findIndex((_, j) => nmOf(j) === tag && drv(j));
              if (n < 0 && c && /\.MV$/.test(tag)) n = c.out;
              if (n >= 0) src = { k: an ? 'v' : 'a', sh, n, key: an ? an.key : null, ref: sh.name + ' ' + tag };
            }
            if (src) break;
          }
          if (src) {
            if (src.k === 'v') src.key = an.key;
            addIn(s, i, src);
            fromAbc.push(s.name + ' r' + r.n + ' <- ' + src.ref);
          } else abcMiss.push(s.name + ' r' + r.n + ' FROM ' + F + ' (no ' + (adr || tag || 'address') + ' on the ABC sheet)');
        })
      );
    /* 3.2.0-beta.39 (roadmap 2, CLAUDE.md rule 1): an input row from the turbine control or the generator breaker (LOCATION TCS / GMCB,
       no FROM sheet: DITL-35 row 11 ICV TO CV TRANSFER COMPLETE I.0418, DITL-51 / 94 ~ 108 TURBINE TRIP I.0400, DITL-80 ~ 89 GCB 52G1 ON
       I.0931) is the same address as the ABC input that the turbine model writes (unit.js / tcs.js: ABC-050 I.0418 ...). Unlinked it read
       0 for ever: DITL-35 held the RH spray shut-off valve shut (NOT I.0418 resets it) and the reheat went to 593 C at 150 MW */
    const tcsIn = [];
    for (const sb of S.sheets)
      W.instOf.get(sb).forEach((s, k) =>
        sb.rows.forEach((r, i) => {
          if (!/^(TCS|GMCB)$/.test(cellTxt(sb, i, 'L').trim()) || cellTxt(sb, i, 'F').trim()) return;
          const have = din.get(s) && din.get(s).get(i);
          if (have && have.length) return;
          const la = rowList(sb, i),
            adr = la[k] || (la.length === 1 ? la[0] : null);
          if (!adr || !/^I\.[0-9A-F]{4}$/.test(adr)) return;
          for (const sh of AN.sheets) {
            if (/^ABC-000/.test(sh.name)) continue;
            let SS;
            try {
              SS = AN.ensure(sh);
            } catch (e) {
              continue;
            }
            const n = SS && SS.ext ? SS.ext.find(j => String(AN.nm(SS, j) || '').replace(/^S\d\s*/, '').trim() === adr) : undefined;
            if (n == null) continue;
            addIn(s, i, { k: 'a', sh, n, ref: sh.name + ' ' + adr });
            tcsIn.push(s.name + ' r' + r.n + ' <- ' + sh.name + ' ' + adr);
            wsh.add(sh.name);
            break;
          }
        })
      );
    /* 3.2.0-beta.23 (Training dock, IDF interlock): an input row whose FROM column names an output of the SAME sheet that is
       only a copy of that very row (a wire or a NOT) is not its own source. DITL-43 row 12 AIR PREHEATER SPEED NOT LOW I.0653 has "43-56" in the FROM
       column (the station channel of the contact, like rows 4 / 5 / 10 / 13: 43-54 / 55 / 53 / 57), and out 56 is the same signal to
       the CRT: linked, the row read its own output, stayed 0 for ever and the IDF (DITL-25A <- 25B row 27) could never start.
       The link is left out; the row stays the field contact (docs/versions/v3.2.0/UNLINK_AUDIT.md) */
    let selfL = 0;
    const selfDep = (s, orow, irow) => {
      try {
        if (!s.nl) s.nl = netlist(s);
        /* roadmap 2 batch 3: a limit switch of a valve of the drawing (ZSO / ZSC, the solenoid / MOV model) is the field, not a copy of
           the row. DITL-35 row 2 SOV CLOSED I.088F <- 35-73: the row and the switch wire touch on the sheet (one row of nets), the link
           was left out, the logic read the row 0 for ever and the RH spray shut-off valve never opened (reheat 593 C at 150 MW) */
        if ((s.nl.mv || []).some(m => (m.fb || []).some(f => f.row === orow))) return false;
        const ins = new Set((window.DUI && DUI.rowNets ? DUI.rowNets(s, irow, 'L') : []) || []);
        if (!ins.size) return false;
        const drv = new Map();
        for (const g of s.nl.gates || []) for (const n of [].concat(g.out == null ? [] : g.out)) drv.set(n, g);
        const seen = new Set(),
          st = (s.nl.outs || []).filter(o => o.row === orow).map(o => o.n);
        while (st.length) {
          const n = st.pop();
          if (ins.has(n)) return true;
          if (seen.has(n)) continue;
          seen.add(n);
          const g = drv.get(n);
          /* only a copy of the row (a wire or a NOT): an output computed by logic from the row and other inputs (a motor command
             sealed in by its RUNNING feedback, DITL-24 row 2 <- out 58) is a real loop through the plant and stays linked */
          if (g && g.t === 'NOT') for (const m of g.ins || []) st.push(m);
        }
      } catch (e) {}
      return false;
    };
    din.forEach((m, s) =>
      m.forEach((srcs, row) => {
        const keep = srcs.filter(q => !(q.k === 'd' && q.d === s && selfDep(s, q.row, row)));
        if (keep.length === srcs.length) return;
        selfL += srcs.length - keep.length;
        if (keep.length) m.set(row, keep);
        else m.delete(row);
      })
    );
    W.selfLinks = selfL;
    /* 3.2.0-beta.23 (CLAUDE.md rule 1): ABC-004A M.3410 / 3411 / 3416 / 3417 = AND of "A-BNR SUPPLY OIL VALVE(1) CLOSE" and "VALVE(2)
       CLOSE" (B / C / D-BNR), the limit switches of the station wiring: the same contacts as DITL-16 out 21 / 23 BURNER A OIL SUPPLY LINE
       VALVE(1) / (2) CLOSED (machine instances #B ~ #D). Unlinked, they kept the Cold value (closed) and the plant burnt no oil while the
       DITL burner was IN SERVICE with both valves open */
    {
      const b16 = S.sheets.find(x => /\)DITL-16$/.test(x.name)),
        a4 = AN.sheets.find(x => x.name === 'ABC-004A'),
        T = a4 && a4.S;
      if (b16 && T)
        ['M.3410', 'M.3411', 'M.3416', 'M.3417'].forEach((adr, k) => {
          const d = inst(b16, k);
          if (!d) return;
          for (let n = 0; n < T.lab.length; n++) {
            if (!T.lab[n] || String(T.lab[n].t).trim() !== adr || T.ext.includes(n)) continue;
            for (const g of T.drv[n] || [])
              if (g.k === 'AND')
                (g.i || [])
                  .filter(i => T.ext.includes(i))
                  .slice(0, 2)
                  .forEach((i, j) => ain.push({ sh: a4, n: i, d, row: j ? 22 : 20, ref: d.name + ' out ' + (j ? 23 : 21) + ' VALVE(' + (j + 1) + ') CLOSED' }));
          }
        });
    }
    W.idx = { din, ain };
    W._nA = AN.sheets.length;
    W.stat = {
      ditlDitl: dd,
      inst: W.inst.length,
      byAddr: byAddr.length,
      byLetter: byLetter.length,
      bySister: bySister.length,
      byTo,
      noMach,
      digFix,
      fromDitl: fa,
      fromAbc,
      tcsIn,
      abcMiss,
      plc,
      toDitl: ta,
      logic,
      lost,
      ms: Math.round(performance.now() - t0)
    };
    /* 2.5.0-beta.10: the ABC sheets that READ the DITL too (FROM DITL): stepped with the world, so a DITL input reaches their logic */
    for (const a of ain) wsh.add(a.sh.name);
    AN.worldSheets = [...wsh];
  }
  const XL = new WeakMap();
  function fakeFrom(d) {
    if (!XL.has(d)) XL.set(d, { name: d.name, S: null, ditl: true });
    return XL.get(d);
  }
  /* one scan of the whole world */
  function tick(dt, opt) {
    const t0 = performance.now(),
      { din, ain } = W.idx,
      prev = W.out,
      out = {};
    const ALL = S.sheets.concat(W.inst || []);
    /* 1. inputs of every DITL sheet (and machine instance) from the last scan (one scan delay, like the DCS) */
    for (const s of ALL) {
      const m = din.get(s);
      if (!m) {
        s._win = null;
        continue;
      }
      const on = new Set();
      m.forEach((srcs, row) => {
        for (const q of srcs) {
          /* 2.3.0-beta.1: an analog ABC value into a DITL comparator row, and the MANUAL state of an ABC controller */
          if (q.k === 'v') {
            const x = q.sh.S && q.sh.S.rt ? +q.sh.S.rt.v[q.n] : NaN;
            if (isFinite(x)) (s.avw = s.avw || {})[q.key] = x;
            continue;
          }
          const v =
            q.k === 'd'
              ? !!(prev[q.d.name] && prev[q.d.name].has(q.row))
              : q.k === 'm'
                ? (() => {
                    const st = q.sh.S && q.sh.S.rt && q.sh.S.rt.st[q.c.amt.id];
                    return !!st && st.pk !== q.c.autoLeg;
                  })()
                : !!(q.sh.S && q.sh.S.rt && q.sh.S.rt.v[q.n] > 0.5);
          if (v) {
            on.add(row);
            break;
          }
        }
      });
      s._win = on;
    }
    /* 3.2.0 P1 #2 (src/world/plantsw.js): the protection switches of the field follow the PV while the plant model is ON */
    if (W.plantIn)
      try {
        W.plantIn(ALL);
      } catch (e) {}
    /* 2. every DITL sheet: logic, timers, MOV, motors */
    const c = cur();
    let chCur = false;
    for (const s of ALL) {
      if (!s.nl) continue;
      s.nl.avk = avOf(s);
      let R = simSheet(s),
        ch = false;
      for (const g of s.nl.gates) if (g.t === 'TMR' && tmStep(g, g.ins.some(n => R.v[n]), dt)) ch = true;
      if (mvStep(s, R.v, dt)) ch = true;
      if (motStep(s, R.v, dt)) ch = true;
      if (fdStep(s, dt)) ch = true;
      if (ch) R = simSheet(s);
      out[s.name] = R.outOn;
      /* 3.2.0-beta.23: an output that changed in this scan (a push button seen, a step of a sequence): the next scans are short (W.busy) */
      if (!TMBUSY) {
        const a = prev[s.name];
        if (a && (a.size !== R.outOn.size || [...R.outOn].some(x => !a.has(x)))) TMBUSY = true;
      }
      if (s === c) {
        const k = [...R.outOn].join(',') + '|' + [...R.rowOn].join(',');
        if (ch || k !== W._ck) chCur = true;
        W._ck = k;
      }
    }
    /* 3.2.0-beta.6 FIRST-OUT: a TRIP / MFT / STOP output that goes 1 in this scan: its cause is read now (DUI.cause), before
       the other conditions follow, and written to the Event log */
    W.tk = (W.tk || 0) + 1;
    W._o = out;
    if (window.lsEventAdd && window.DUI && DUI.cause && W.tk > 25)
      for (const s of S.sheets) {
        const a = prev[s.name],
          b = out[s.name];
        if (!a || !b) continue;
        /* the outputs of one sheet that go 1 in the same scan for the same cause (MFT · SER, MFT 1 · TCS, MFT · IRP ...) are ONE
           event: named by the MASTER FUEL TRIP output when there is one, "+N outputs" for the rest */
        const grp = new Map();
        for (const row of b) {
          if (a.has(row)) continue;
          let c = null;
          try {
            c = DUI.cause(s, row);
          } catch (e) {}
          /* trips only (MFT, boiler / fan / pump / turbine TRIP, RUN BACK): the shutdown and stop sequences of burners and
             igniters follow from them and are not alarms */
          if (!c || !/\bTRIP|\bMFT\b|RUN\s*BACK/i.test(c.name) || /\bNO\s+(\w+\s+)?TRIP|TRIP\s+RESET/i.test(c.name)) continue;
          const k = c.lines.map(l => l.txt).join('|'),
            g = grp.get(k);
          if (!g) grp.set(k, { c, n: 1 });
          else {
            g.n++;
            if (/MASTER FUEL TRIP/i.test(c.name) && !/MASTER FUEL TRIP/i.test(g.c.name)) g.c = c;
          }
        }
        grp.forEach(({ c, n }) => lsEventAdd(s.name, 'TRIP', c.name + ' = 1' + (n > 1 ? ' (+' + (n - 1) + ' outputs)' : ''), deeper(s, c.lines, 1)));
      }
    W.out = out;
    /* 3. DITL -> ABC (not while the one world is OFF: then the DITL 150 MW state is computed for the DITL only) */
    for (const a of opt && opt.noAbc ? [] : ain) {
      const AS = a.sh.S;
      if (!AS || !AS.rt) continue;
      AS.rt.ext[a.n] = out[a.d.name] && out[a.d.name].has(a.row) ? 1 : 0;
      AS.xlk = AS.xlk || {};
      if (!AS.xlk[a.n]) AS.xlk[a.n] = { from: fakeFrom(a.d), fromNets: [], tag: 'DITL ' + a.ref, ditl: true };
    }
    /* 4. the DITL page shows the new values */
    if (AN.cat !== 'an' && c) {
      if (chCur) render();
      else
        try {
          updateTP();
          mvUI(c);
        } catch (e) {}
    }
    /* 3.2.0-beta.23: after each scan (the Training dock releases its push buttons after two scans) */
    if (W.onTick)
      try {
        W.onTick(dt);
      } catch (e) {}
    W.ms = W.ms * 0.8 + (performance.now() - t0) * 0.2;
  }
  /* 3.2.0-beta.6 FIRST-OUT across sheets: an input row that is 1 because of another sheet is followed to that sheet's output
     (FROM column, the same map the one world uses) and its cause, up to 4 sheets deep: "IDF STOPPED" on DITL-03A -> the row
     on DITL-03B that made it 1 -> the motor / ABC signal */
  function deeper(s, lines, d) {
    const out = [];
    for (const l of lines) {
      out.push(Object.assign({}, l, { d }));
      if (l.row === undefined || d >= 5 || out.length > 30) continue;
      const m = W.idx && W.idx.din.get(s),
        srcs = m && m.get(l.row);
      for (const q of srcs || []) {
        /* only a source that IS 1 now made the row 1 (else the operator pressed the row on this sheet) */
        if (q.k === 'd' && !(W._o && W._o[q.d.name] && W._o[q.d.name].has(q.row))) continue;
        if (q.k !== 'd' && q.k !== 'm' && q.k !== 'v' && !(q.sh && q.sh.S && q.sh.S.rt && q.sh.S.rt.v[q.n] > 0.5)) continue;
        if (q.k === 'd') {
          let c = null;
          try {
            c = DUI.cause(q.d, q.row);
          } catch (e) {}
          if (c) {
            out.push({ d: d + 1, k: 'link', txt: 'from ' + q.d.name + ': ' + c.name + ' = 1', sh: q.d.name });
            out.push(...deeper(q.d, c.lines, d + 2));
          }
          break;
        }
        if (q.k === 'm') {
          const st = q.sh.S && q.sh.S.rt && q.sh.S.rt.st[q.c.amt.id];
          if (!(st && st.pk !== q.c.autoLeg)) continue;
          out.push({ d: d + 1, k: 'input', txt: 'from ABC: ' + q.c.tag + ' is in MANUAL', sh: q.sh.name });
          break;
        }
        if (q.k !== 'v' && q.sh && q.sh.S) {
          let nm = '';
          try {
            nm = AN.nm(q.sh.S, q.n) || '';
          } catch (e) {}
          /* and on the ABC sheet, the same "Why?" walk (src/ui/shell/why.js), a few lines; its first line names the net and its
             reason (FORCED by you, transmitter, comparator ...) */
          let L2 = [];
          try {
            if (AN.why) L2 = AN.why(q.sh, q.n).lines.slice(0, 9);
          } catch (e) {}
          out.push({ d: d + 1, k: L2[0] && L2[0].k === 'force' ? 'force' : 'link', txt: 'from ABC ' + q.sh.name + ': ' + (L2[0] ? L2[0].txt : (nm || 'signal') + ' = 1'), sh: q.sh.name });
          for (const l2 of L2.slice(1)) out.push(Object.assign({}, l2, { d: d + 1 + l2.d }));
          break;
        }
      }
    }
    return out;
  }
  function off() {
    W.live = false;
    for (const s of S.sheets.concat(W.inst || [])) {
      s._win = null;
      s.avw = null;
    }
    if (W.idx)
      for (const a of W.idx.ain) {
        const AS = a.sh.S;
        if (AS && AS.xlk && AS.xlk[a.n] && AS.xlk[a.n].ditl) delete AS.xlk[a.n];
      }
    AN.worldSheets = [];
  }
  /* 2.2.0-beta.3: one scan on demand (DITL 150 MW state, src/world/ditl150.js) */
  W.tick = (dt, opt) => {
    if (!W.idx) return;
    const lv = W.live;
    W.live = true;
    try {
      tick(dt, opt);
    } finally {
      W.live = lv;
    }
  };
  W.build = () => build();
  W.set = on => {
    W.on = !!on;
    if (W.on) {
      /* the memory list descriptions (machine A / B of a shared drawing) come with the ABC data: build again when they are in */
      try {
        if (AN.ades)
          AN.ades().then(() => {
            if (W.on) build();
          });
      } catch (e) {}
      try {
        build();
      } catch (e) {
        W.on = false;
        console.error(e);
        msg('One world: could not be built (' + e.message + ')');
      }
      if (W.on && W.stat)
        msg(
          'One world ON: ' +
            W.stat.ditlDitl +
            ' DITL ↔ DITL, ' +
            (AN.sheets.length
              ? W.stat.fromDitl + ' FROM DITL, ' + W.stat.toDitl + ' TO DITL linked'
              : 'the ABC is linked when the ABC page opens') +
            (W.stat.lost.length ? ' · ' + W.stat.lost.length + ' references without a match (see WORLD.stat.lost)' : '')
        );
    } else {
      off();
      msg('One world OFF: FROM DITL signals are manual inputs again');
    }
  };
  let last = 0;
  setInterval(() => {
    /* the ABC sheets are loaded the first time the ABC page opens: build the index again when they arrive */
    if (W.on && W.idx && W._nA !== AN.sheets.length && AN.sheets.length)
      try {
        build();
      } catch (e) {}
    const go = !AN._loading && W.on && W.idx && ((AN.cat === 'an' && AN.run) || (AN.cat !== 'an' && SIM && !DPAUSE));
    if (!go) {
      if (W.live) W.live = false;
      last = 0;
      return;
    }
    W.live = true;
    const now = performance.now();
    let dt = Math.min((now - (last || now)) / 1000, 1) * (AN.cat === 'an' ? AN.spd || 1 : TSP);
    last = now;
    try {
      /* 3.2.0-beta.23: while a short timer counts, a device moves or an output changed (W.busy, set by the scan: tmStep / mvStep / fdStep /
         tick), scans of 2 s,
         at most 12 a frame: at x300 a frame is 60 s and a burner light-off of a few seconds (igniter insert, trial for ignition) was
         jumped over in one scan and failed; the time of that frame is what the scans took (the plant follows the same time) */
      if (!W.busy || dt <= 2) {
        TMBUSY = false;
        tick(dt);
        W.busy = TMBUSY;
      } else {
        let used = 0;
        for (let n = 0; n < 12 && used < dt - 1e-6; n++) {
          const h = W.busy ? Math.min(2, dt - used) : dt - used;
          TMBUSY = false;
          tick(h);
          W.busy = TMBUSY;
          used += h;
        }
        dt = used;
      }
    } catch (e) {
      console.error(e);
    }
    /* 2.5.0-beta.10 (user: "kapag from DITL nagforce ako, madedetect ito ng buong sheet DITL at ABC? vice versa?"): one world = one time.
       While the DITL page simulates, the ABC sheets of the world run too (before, the ABC stood still until its own Run: a DITL input
       reached the ABC input but not the ABC logic behind it, and an ABC FORCE did not reach the DITL) */
    if (AN.cat !== 'an' && AN.sheets.length && AN.worldSheets && AN.worldSheets.length)
      try {
        const sh = AN.sheets[AN.i] && AN.sheets[AN.i].S ? AN.sheets[AN.i] : AN.sheets.find(s => s.name === AN.worldSheets[0]);
        /* 3.2.0-beta.23: in steps of 0.5 s and with the Training coach after each, like the ABC Run (src/analog/ui/interaction.js):
           the plant model goes on the same while the DITL page is on the screen (one RUN for the app) */
        if (sh && sh.S) {
          const k = Math.max(1, Math.min(240, Math.ceil(dt / 0.5)));
          for (let i = 0; i < k; i++) {
            AN.stepSet(sh, dt / k);
            if (AN.onStep)
              try {
                AN.onStep(dt / k);
              } catch (e) {}
          }
        }
      } catch (e) {
        console.error(e);
      }
  }, 200);
  /* the world is built once both pages are there (the ABC sheets are linked again when they load, the interval above) */
  let n = 0;
  const iv = setInterval(() => {
    const a = document.querySelector('#anbar .tbg-run'),
      d = document.querySelector('#bar .tbg-run');
    if ((a && d) || ++n > 60) {
      clearInterval(iv);
      if (W.on) setTimeout(() => W.set(true), 0);
    }
  }, 300);
})();
