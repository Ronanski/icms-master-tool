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
  const addrList = t => {
    const m = LRX.exec(String(t || ''));
    if (!m) {
      const one = /\b([IMOB])\.([0-9A-F]{4})\b/i.exec(String(t || ''));
      return one ? [one[1].toUpperCase() + '.' + one[2].toUpperCase()] : [];
    }
    const p = m[1].toUpperCase() + '.',
      b = m[2].toUpperCase(),
      o = [p + b];
    for (const q of m[3].split('/').map(x => x.replace(/[IMOB]\./i, '').trim().toUpperCase()).filter(Boolean))
      o.push(p + (q.length >= 4 ? q : b.slice(0, 4 - q.length) + q));
    return o;
  };
  const cellTxt = (s, i, k) => (s.cells[i + ':' + k] || []).map(x => x.t).join(' ');
  /* the machines of a sheet: the note of the drawing, and the longest address list */
  function machinesOf(s) {
    if (s._mach !== undefined) return s._mach;
    /* 3.2.0-beta.33: the machines counted from the address table (src/world/inst-addr.js, from the drawing, the I/O list and the memory
       lists): DITL-22 is written for the 4 aux. lube oil pumps (LOP A / B of BFWP A, LOP A / B of BFWP B: "I.0050/370 I.0053/373") */
    const T = IA(s);
    if (T && T.n) return (s._mach = T.n);
    const t = txtOf(s);
    let n = 1;
    if (/DIAGRAM IS (?:THE )?SAME|SAME\s+FOR\b|^\s*FOR\s+.*\b[B-D]\b/im.test(t)) {
      const nt = /(?:SAME\s+)?FOR\s+([^\n]{0,80})/i.exec(t.slice(t.search(/SAME|FOR\s+[A-Z]/i)));
      const lets = new Set();
      if (nt) for (const m of nt[1].matchAll(/\b([B-D])\b/g)) lets.add(m[1]);
      n = Math.max(n, 1 + lets.size);
      let mx = 1;
      for (const k in s.cells) mx = Math.max(mx, addrList(cellTxt(s, +k.split(':')[0], k.split(':')[1])).length);
      for (const x of (s.tx || []).map ? s.tx : []) mx = Math.max(mx, addrList(x.t).length);
      n = Math.max(n, Math.min(4, mx));
    }
    return (s._mach = n);
  }
  /* the machine letter of a text: the LAST machine named ("BFWP A AUX. LOP B TRIP" = B) */
  const MRX =
    /\b(?:BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|COLLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP|LOP|CWP|CP|VALVE|SILO)\s*-?\(?([A-D])\)?(?![A-Z0-9])/gi;
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
  function makeInst(base, k) {
    famOf(base);
    machinesOf(base);
    const o = Object.assign(Object.create(Object.getPrototypeOf(base)), base, {
      name: base.name + ' #' + LET[k],
      sig: {},
      usw: {},
      av: null,
      av150: null,
      _win: null,
      nl: null,
      uvDone: true,
      _inst: { base, k, n: machinesOf(base) }
    });
    o.nl = netlist(o);
    /* 3.2.0-beta.33: the title as it reads for this machine ("SEAWATER PUMP A (1)" -> "SEAWATER PUMP B (1)"), shown in the sheet list */
    o.title = W.remap(o, base.title || '') + (pairOf(base) ? ' (LOP ' + pairOf(base).LOP(k) + ')' : '');
    o.meta = Object.assign({}, base.meta || {}, {
      dwg: ((base.meta && base.meta.dwg) || base.name.replace(/^\(\w+\)/, '')) + ' · ' + W.instLabel(o),
      title: o.title
    });
    return o;
  }
  /* the address table of a shared drawing (tools/world/inst_addr.js -> src/world/inst-addr.js) */
  const IA = s => {
    const T = window.INST_ADDR;
    return T && s ? T[(s._inst && s._inst.base ? s._inst.base : s).name] || null : null;
  };
  /* 3.2.0-beta.33: a drawing for the machines of two letters (DITL-22: LOP A / B of BFWP A / B). Instance k = BFWP LET[k >> 1], LOP
     LET[k & 1]; the drawing is written for BFWP A LOP A, "LOP B" there is the other LOP of the same BFWP */
  const PAIRS = { 'DITL-22': { BFWP: k => LET[k >> 1], LOP: k => LET[k & 1] } };
  const pairOf = s => {
    const m = /DITL-[0-9A-Z]+$/.exec((s && s.name) || '');
    return m ? PAIRS[m[0]] || null : null;
  };
  /* the text of a row as it reads for machine instance k (the drawing is written for machine A: "BFWP A RUNNING" is "BFWP B
     RUNNING" in instance B, "BFWP B" the other pump is A); the k-th address of the row */
  W.remap = (s, t) => {
    const I = s && s._inst;
    if (!I || !I.k) return t;
    const P = pairOf(I.base);
    return String(t || '').replace(MRX, (m, L) => {
      if (!relative(I.base, m)) return m;
      if (P) {
        const w = m.replace(/\s*-?\(?[A-D]\)?$/i, '').trim().toUpperCase(),
          f = P[w];
        if (!f) return m;
        const me = f(I.k),
          to = L.toUpperCase() === 'A' ? me : me === 'A' ? 'B' : 'A';
        return m.replace(/([A-D])(\)?)$/i, to + '$2');
      }
      const u = L.toUpperCase(),
        to = LET[(LET.indexOf(u) + I.k) % Math.max(I.n, LET.indexOf(u) + 1)];
      return m.replace(/([A-D])(\)?)$/i, to + '$2');
    });
  };
  /* 3.2.0-beta.33: the addresses of row i (side 'L' input, 'R' output) for this machine, from the address table (the drawing writes
     "O.0080/400 O.0720/1040" = burner A / B / C / D; before, only the first group was read and burner C / D took the address of A).
     null = the drawing names no address on that row */
  W.addrsOf = (s, i, side) => {
    const I = s && s._inst,
      k = I ? I.k : 0,
      T = IA(s),
      e = T && T.r && T.r[(side || 'L') + i];
    if (e) return e[k] || null;
    const b = I ? I.base : s,
      la = addrList(side === 'R' ? cellTxt(b, i, 'RS') + ' ' + cellTxt(b, i, 'RT') : cellTxt(b, i, 'T') || cellTxt(b, i, 'S'));
    return la.length ? [la[k] || la[0]] : null;
  };
  W.addrK = (s, i) => {
    const a = W.addrsOf(s, i, 'L');
    return a ? a[0] : null;
  };
  /* the row has an address of its own for each machine (not one common address) */
  const varies = (d, row, side) => {
    const L = W.instOf && W.instOf.get(d);
    if (!L || L.length < 2) return false;
    const a = W.addrsOf(L[0], row, side),
      b = W.addrsOf(L[1], row, side);
    return !!(a && b && a[0] !== b[0]);
  };
  /* the instance of a shared drawing whose row (side) carries the address adr */
  const instByAddr = (d, row, side, adr) => {
    const L = W.instOf && W.instOf.get(d);
    if (!L || !adr) return null;
    for (const x of L) {
      const a = W.addrsOf(x, row, side);
      if (a && a.includes(adr)) return x;
    }
    return null;
  };
  /* the field tags of machine k on the drawing (I/O list: "DO1043-A1" of burner A = "DO1043-C1" of burner C) */
  W.instTag = (s, t) => {
    const I = s && s._inst,
      T = I && I.k ? IA(s) : null,
      m = T && T.tags && T.tags[I.k];
    if (!m || !t) return t;
    if (!m._re) {
      const ks = Object.keys(m).sort((a, b) => b.length - a.length);
      Object.defineProperty(m, '_re', { value: new RegExp('(?<![A-Z0-9])(' + ks.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![A-Z0-9])', 'g') });
    }
    return String(t).replace(m._re, x => m[x] || x);
  };
  /* the texts of a cell of a machine instance as the operator reads them (one string per text of the cell): letters of this machine,
     its own addresses in place of the address list of the drawing */
  W.cellTexts = (s, key, arr) => {
    const I = s && s._inst;
    if (!I || !I.k) return arr;
    const [i, c] = String(key).split(':'),
      side = c === 'RS' || c === 'RT' ? 'R' : c === 'T' || c === 'S' ? 'L' : null,
      T = IA(s),
      e = side && T && T.r && T.r[side + i],
      /* the address cell of the row: T (or S when T is empty) for an input, RS / RT for an output */
      adrCell = e && !(side === 'L' && c === 'S' && cellTxt(I.base, +i, 'T')),
      mine = e ? e[I.k] : null;
    let first = true;
    return arr.map(t => {
      let o = W.remap(s, W.instTag(s, t));
      if (adrCell)
        o = o.replace(ARX, (m, st) => {
          if (st) return m;
          if (!first) return '';
          first = false;
          return mine && mine.length ? mine.join(' ') : '(no address)';
        });
      return o.replace(/\s{2,}/g, ' ').trim();
    });
  };
  /* an address group on a drawing: "I.0013/333", "M.1150/1160", "I.0085/88/8B"; "S4 O.1330" names another station (kept) */
  const ARX = /(S\d\s*)?\b[IMOB]\.[0-9A-F]{4}(?:\s*\/\s*(?:[IMOB]\.)?[0-9A-F]{1,4})*/gi;
  /* the name of the machine of an instance: "B", or "BFWP A · LOP B" on a drawing of two letters (DITL-22) */
  W.instLabel = s => {
    const I = s && s._inst,
      k = I ? I.k : 0,
      P = I && pairOf(I.base);
    return P ? Object.keys(P).map(w => w + ' ' + P[w](k)).join(' · ') : LET[k];
  };
  W._h = { addrList, cellTxt, relative, machOfDitl, famOf, LET, MRX };
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
      const nd = machinesOf(d),
        rowT = cellTxt(sb, i, 'S') + ' ' + cellTxt(sb, i, 'T'),
        n = machinesOf(sb);
      /* 3.2.0-beta.33: a drawing of two letters (DITL-22, LOP A / B of BFWP A / B): the machine named on the row as this instance reads it
         ("BFWP A AUX. LOP B TRIP" on LOP B of BFWP A = LOP A of BFWP A); another drawing (DITL-23B BFWP) = the BFWP of this LOP */
      const P = pairOf(sb);
      if (P) {
        const rt = W.remap(inst(sb, k) || sb, rowT.replace(/\(\s*[0-9]{2,3}[A-Z]?\s*-\s*\d{1,2}\s*\)/g, ' ')),
          Lw = {};
        for (const m of rt.matchAll(MRX)) {
          const w = m[0].replace(/\s*-?\(?[A-D]\)?$/i, '').trim().toUpperCase();
          if (P[w]) Lw[w] = m[1].toUpperCase();
        }
        const ws = Object.keys(P);
        if (d === sb) {
          for (let j = 0; j < nd; j++) if (ws.every(w => !Lw[w] || P[w](j) === Lw[w]) && inst(d, j)) return inst(d, j);
        } else if (nd > 1 && Lw[ws[0]] && inst(d, LET.indexOf(Lw[ws[0]]))) return inst(d, LET.indexOf(Lw[ws[0]]));
      }
      if (nd > 1) {
        /* 1. the address of this machine on the row = the address of one machine on the output (3.2.0-beta.33: the address table) */
        const me = W.addrsOf(inst(sb, k), i, 'L');
        if (me && me.length && varies(sb, i, 'L')) {
          const x = instByAddr(d, orow, 'R', me[0]);
          if (x) {
            byAddr.push(1);
            return x;
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
          if (adr && varies(d, row, isTo ? 'L' : 'R')) {
            const x = instByAddr(d, row, isTo ? 'L' : 'R', adr);
            if (x) return x;
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
              if (!varies(d0, row, 'L') && !relative(d0, rt))
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
          const T = cellTxt(sb, i, 'T') + ' ' + cellTxt(sb, i, 'S');
          /* machine B / C / D of a shared drawing: only its own address (the address of machine A is not its signal) */
          /* 3.2.0-beta.23: one address and a row that names no machine of this family (DITL-19 row 16 "FURNACE LOWER LAYER UNDER
             TEMP. > 700 C" M.3330 is ONE furnace for feeders A, B, C) is the same signal for every instance (CLAUDE.md rule 1);
             before, feeders B and C had no furnace temperature and tripped when the last start-up burner was put out.
             3.2.0-beta.33: the address of each machine comes from the address table (drawing + I/O list + memory lists) */
          const mine = W.addrsOf(s, i, 'L');
          if (k > 0 && !(mine && mine.length)) return;
          const adr = mine && mine.length ? mine[0] : null,
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
    /* 3.2.0-beta.23 (Training dock, IDF interlock): an input row whose FROM column names an output of the SAME sheet that is
       only a copy of that very row (a wire or a NOT) is not its own source. DITL-43 row 12 AIR PREHEATER SPEED NOT LOW I.0653 has "43-56" in the FROM
       column (the station channel of the contact, like rows 4 / 5 / 10 / 13: 43-54 / 55 / 53 / 57), and out 56 is the same signal to
       the CRT: linked, the row read its own output, stayed 0 for ever and the IDF (DITL-25A <- 25B row 27) could never start.
       The link is left out; the row stays the field contact (docs/versions/v3.2.0/UNLINK_AUDIT.md) */
    let selfL = 0;
    const selfDep = (s, orow, irow) => {
      try {
        if (!s.nl) s.nl = netlist(s);
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
      abcMiss,
      plc,
      toDitl: ta,
      logic,
      lost,
      ms: Math.round(performance.now() - t0)
    };
    /* 3.2.0-beta.33: the sheet list shows the machine pages (B / C / D) once they exist */
    try {
      if (typeof drawSide === 'function') drawSide();
    } catch (e) {}
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
    const go = W.on && W.idx && ((AN.cat === 'an' && AN.run) || (AN.cat !== 'an' && SIM && !DPAUSE));
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
