/* WORLD (1.22.0): IISANG MUNDO ng ABC at DITL (CHECKLIST #25, CLAUDE.md "HINDI NAGBABAGO NA KAALAMAN" 1).
   Ang mga sheet ay nag-uusap ayon sa reference na nakasulat sa drawing (walang hula):
   - DITL -> DITL: ang FROM column ng input row (hal. "28A-77") = output item 77 ng DITL-28A (item 51..79 = row 1..29 sa kanan).
   - DITL -> ABC : ang "FROM DITL 26A-55" sa ABC = output item 55 ng DITL-26A; ang ABC input ay nagiging "galing sa DITL" (FORCE para baguhin).
   - ABC -> DITL : ang "TO DITL 26A-05" sa ABC = input row 05 ng DITL-26A.
   Kapag ON at tumatakbo (ABC Run, o DITL Simulate), bawat 0.2 s: kinukuwenta ang LAHAT ng DITL sheet (timers, MOV, motor din),
   tapos ipinapasa ang mga value. OFF = dating gawi (ang FROM DITL ay manual na input). Walang binago sa logic ng mga sheet. */
(function () {
  const W = (window.WORLD = { on: false, live: false, idx: null, out: {}, stat: null, ms: 0 });
  try {
    W.on = localStorage.getItem('ls-world') === '1';
  } catch (e) {}
  /* 2.3.0-beta.1 (LINK-4): also a one-digit code with its letter, written without the 0 (DITL-15 row 10 MFT "3A-63" = 03A-63) */
  const RX = /\(?\s*([0-9]{2,3}[A-Z]?|[0-9][A-Z])\s*-\s*(\d{1,2})\s*\)?/gi;
  const refsOf = t => {
    const o = [];
    let m;
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
    const m = /DITL-([0-9]{2,3}[A-Z]?)$/i.exec(name || '');
    return m ? m[1].toUpperCase() : null;
  };
  function dSheet(code) {
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
  function makeInst(base, k) {
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
  W.addrK = (s, i) => {
    const I = s && s._inst,
      b = I ? I.base : s,
      la = addrList(cellTxt(b, i, 'T') || cellTxt(b, i, 'S'));
    return la[I ? I.k : 0] || la[0] || null;
  };
  /* index of every link, built once when the world is turned on */
  function build() {
    const t0 = performance.now();
    W._byCode = {};
    for (const s of S.sheets) {
      const c = codeOf(s.name);
      if (c && !W._byCode[c]) W._byCode[c] = s;
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
    const outRow = (code, nn) => {
      const d = dSheet(code);
      if (!d || nn <= 50) return null;
      const r = d.rows.findIndex(x => +x.n === nn - 50);
      return r >= 0 ? { d, row: r } : null;
    };
    /* the instance (or sister sheet) that a row of machine-instance k of sheet sb gives for the output (d, orow) */
    const target = (sb, k, i, d, orow, other) => {
      const nd = machinesOf(d),
        rowT = cellTxt(sb, i, 'S') + ' ' + cellTxt(sb, i, 'T'),
        n = machinesOf(sb);
      if (nd > 1) {
        /* 1. the address of this machine on the row = the address of one machine on the output */
        const la = addrList(cellTxt(sb, i, 'T') || cellTxt(sb, i, 'S'));
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
            const o = outRow(f.code, f.nn);
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
            if (!d0 || f.nn > 50) continue;
            const row = d0.rows.findIndex(x => +x.n === f.nn);
            if (row < 0) continue;
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
    const fromAbc = [],
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
            la = addrList(cellTxt(sb, i, 'T') || cellTxt(sb, i, 'S'));
          /* machine B / C / D of a shared drawing: only its own address (the address of machine A is not its signal) */
          if (k > 0 && !la[k]) return;
          const adr = la[k] || null,
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
              if (n >= 0) src = { k: an ? 'v' : 'a', sh, n, ref: sh.name + ' ' + adr };
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
      if (ch) R = simSheet(s);
      out[s.name] = R.outOn;
      if (s === c) {
        const k = [...R.outOn].join(',') + '|' + [...R.rowOn].join(',');
        if (ch || k !== W._ck) chCur = true;
        W._ck = k;
      }
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
    W.ms = W.ms * 0.8 + (performance.now() - t0) * 0.2;
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
    try {
      localStorage.setItem('ls-world', W.on ? '1' : '0');
    } catch (e) {}
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
    upd();
  };
  let last = 0;
  setInterval(() => {
    /* the ABC sheets are loaded the first time the ABC page opens: build the index again when they arrive */
    if (W.on && W.idx && W._nA !== AN.sheets.length && AN.sheets.length)
      try {
        build();
      } catch (e) {}
    const go = W.on && W.idx && ((AN.cat === 'an' && AN.run) || (AN.cat !== 'an' && SIM));
    if (!go) {
      if (W.live) W.live = false;
      last = 0;
      return;
    }
    W.live = true;
    const now = performance.now(),
      dt = Math.min((now - (last || now)) / 1000, 1) * (AN.cat === 'an' ? AN.spd || 1 : TSP);
    last = now;
    try {
      tick(dt);
    } catch (e) {
      console.error(e);
    }
  }, 200);
  /* the button, in the TAKBO group of both toolbars */
  const btns = [];
  function upd() {
    btns.forEach(b => {
      b.textContent = 'ABC+DITL ' + (W.on ? 'ON' : 'OFF');
      b.classList.toggle('on', W.on);
    });
  }
  function mk() {
    const b = document.createElement('button');
    b.className = 'wbtn';
    b.title =
      'One world: ON = the DITL runs together with the ABC and signals pass along the drawing references (FROM DITL 26A-55, TO DITL, the DITL FROM column). OFF = FROM DITL signals are manual inputs.';
    b.onclick = e => {
      e.stopPropagation();
      W.set(!W.on);
    };
    btns.push(b);
    return b;
  }
  let n = 0;
  const iv = setInterval(() => {
    const a = document.querySelector('#anbar .tbg-run'),
      d = document.querySelector('#bar .tbg-run');
    if (a && !a.querySelector('.wbtn')) a.append(mk());
    if (d && !d.querySelector('.wbtn')) d.append(mk());
    upd();
    if ((a && d) || ++n > 60) {
      clearInterval(iv);
      if (W.on) setTimeout(() => W.set(true), 0);
    }
  }, 300);
})();
