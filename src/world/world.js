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
  const RX = /\(?\s*([0-9]{2,3}[A-Z]?)\s*-\s*(\d{1,2})\s*\)?/gi;
  const refsOf = t => {
    const o = [];
    let m;
    RX.lastIndex = 0;
    while ((m = RX.exec(String(t || ''))))
      o.push({ code: m[1].toUpperCase(), nn: +m[2], other: /^\(/.test(m[0]) && /\)$/.test(m[0]) });
    return o;
  };
  const codeOf = name => {
    const m = /DITL-([0-9]{2,3}[A-Z]?)$/i.exec(name || '');
    return m ? m[1].toUpperCase() : null;
  };
  function dSheet(code) {
    const byCode = W._byCode;
    return byCode[code] || byCode[code.replace(/[A-Z]$/, '')] || null;
  }
  function nlOf(s) {
    if (!s.nl || s.nl.v !== 10) {
      s.nl = netlist(s);
      s.uvDone = false;
    }
    return s.nl;
  }
  /* index of every link, built once when the world is turned on */
  function build() {
    const t0 = performance.now();
    W._byCode = {};
    for (const s of S.sheets) {
      const c = codeOf(s.name);
      if (c && !W._byCode[c]) W._byCode[c] = s;
    }
    const din = new Map(), // DITL sheet -> Map(row -> [sources])
      ain = [], // ABC inputs fed by a DITL output
      logic = [], // FROM DITL text on a net that the ABC logic computes
      lost = [],
      otherAbc = [] /* ABC inputs of machine B / C on a drawing simulated for machine A */,
      digFix = [] /* TO DITL by an analog wire: the comparator output next to it */,
      notLimit = []; /* 2.2.0-beta.3: an analog net next to a TO DITL of a limit row (ABC-001C AI0131 -> 40-09 MAIN STEAM PRESSURE LOW LOW) */
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
    const machOfDesc = t => {
        const m =
          /(?:^|[\s(])([A-D])-(?=[A-Z])/.exec(t || '') ||
          /-([A-D])\d\b/.exec(t || '') ||
          /\b(?:BLOWER|PUMP|FEEDER|BFWP|BURNER|BNR|FAN)-([A-D])\b/i.exec(t || '');
        return m ? m[1].toUpperCase() : null;
      },
      machOfDitl = t => {
        const m = /\b(?:BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP)\s*-?([A-D])\b/i.exec(t || '');
        return m ? m[1].toUpperCase() : null;
      };
    let dd = 0,
      other = 0;
    for (const s of S.sheets) {
      nlOf(s);
      s.rows.forEach((r, i) => {
        const c = s.cells[i + ':F'];
        if (!c) return;
        for (const f of refsOf(c.map(x => x.t).join(' '))) {
          const o = outRow(f.code, f.nn);
          /* 2.2.0-beta.3: "(19-57)" in brackets = the same item of the OTHER machine drawn on this sheet (DITL-19 is drawn for coal
             feeder A, B and C use it with their own addresses "I.0130/450/490"); only machine A is simulated, so it is not linked */
          if (o && f.other) {
            other++;
            continue;
          }
          if (o) {
            /* also the same sheet: an output that comes back as an input of the sheet (DITL-26A row 1 PAF TRIP = 26A-66) */
            addIn(s, i, { k: 'd', d: o.d, row: o.row, ref: f.code + '-' + f.nn });
            dd++;
          }
        }
      });
    }
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
      for (const [n, refs] of ix.from) {
        let ok = null;
        for (const r of refs)
          for (const f of refsOf(r)) {
            const o = !ok && !f.other && outRow(f.code, f.nn);
            if (o) ok = Object.assign(o, { ref: f.code + '-' + f.nn });
          }
        /* 2.2.0-beta.3: a DITL drawing used for several machines (DITL-23A: BFWP A, and B with the addresses after the "/") is
           simulated for machine A only: the ABC input of machine B / C (memory list: "B-BFWP RUNNING", M.3344) is not linked */
        if (ok) {
          const ma = machOfDesc(AN.descOf ? AN.descOf(sh, AN.nm(sh.S, n)) : ''),
            md = machOfDitl((ok.d.cells[ok.row + ':RS'] || []).map(x => x.t).join(' '));
          if (ma && md && ma !== md) {
            otherAbc.push(sh.name + ' ' + AN.nm(sh.S, n) + ' (' + ok.ref + ')');
            continue;
          }
        }
        /* only a real input of the sheet; a net that the ABC logic computes (ABC-004A M.3410 = AND of the two valve CLOSE) keeps its logic */
        if (ok && sh.S.ext.includes(n)) {
          ain.push({ sh, n, d: ok.d, row: ok.row, ref: ok.ref });
          fa++;
        } else if (ok) logic.push(sh.name + ' ' + AN.nm(sh.S, n) + ' (' + ok.ref + ')');
        else lost.push(sh.name + ' FROM ' + refs.join('/'));
      }
      for (const [n, refs] of ix.to) {
        let hit = false,
          lim = false;
        for (const r of refs)
          for (const f of refsOf(r)) {
            const d = dSheet(f.code);
            if (!d || f.nn > 50) continue;
            const row = d.rows.findIndex(x => +x.n === f.nn);
            if (row < 0) continue;
            /* 2.2.0-beta.3/4: a measurement (analog net) is not a limit. "TO DITL 40-09" (MAIN STEAM PRESSURE LOW LOW) sits by
               the main steam pressure AI0131 of ABC-001C: the limit is the output of the comparator next to it (M.310D,
               AI0131 < 72.9 kg/cm2). Before: the analog value (122 kg/cm2) read as 1 */
            const net = sh.S.nets && sh.S.nets[n];
            let src = n;
            if (
              net &&
              !net.dig &&
              /\bLOW\b|\bHIGH\b|H\.\s?H\.|L\.\s?L\.|[<>]/i.test((d.cells[row + ':S'] || []).map(x => x.t).join(' '))
            ) {
              const alt = ix.toDig && ix.toDig.get(r + '@' + n);
              if (alt == null) {
                lim = true;
                continue;
              }
              src = alt;
              digFix.push(sh.name + ' ' + AN.nm(sh.S, n) + ' -> ' + AN.nm(sh.S, alt) + ' (' + r + ')');
            }
            addIn(d, row, { k: 'a', sh, n: src, ref: sh.name });
            hit = true;
          }
        if (hit) {
          ta++;
          wsh.add(sh.name);
        } else if (lim) notLimit.push(sh.name + ' ' + AN.nm(sh.S, n) + ' TO ' + refs.join('/'));
        else lost.push(sh.name + ' TO ' + refs.join('/'));
      }
    }
    W.idx = { din, ain };
    W._nA = AN.sheets.length;
    W.stat = { ditlDitl: dd, other, otherAbc, notLimit, digFix, fromDitl: fa, toDitl: ta, logic, lost, ms: Math.round(performance.now() - t0) };
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
    /* 1. inputs of every DITL sheet from the last scan (one scan delay, like the DCS) */
    for (const s of S.sheets) {
      const m = din.get(s);
      if (!m) {
        s._win = null;
        continue;
      }
      const on = new Set();
      m.forEach((srcs, row) => {
        for (const q of srcs) {
          const v =
            q.k === 'd'
              ? !!(prev[q.d.name] && prev[q.d.name].has(q.row))
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
    for (const s of S.sheets) {
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
    for (const s of S.sheets) s._win = null;
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
