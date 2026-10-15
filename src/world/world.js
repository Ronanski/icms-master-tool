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
    while ((m = RX.exec(String(t || '')))) o.push({ code: m[1].toUpperCase(), nn: +m[2] });
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
      lost = [];
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
    let dd = 0;
    for (const s of S.sheets) {
      nlOf(s);
      s.rows.forEach((r, i) => {
        const c = s.cells[i + ':F'];
        if (!c) return;
        for (const f of refsOf(c.map(x => x.t).join(' '))) {
          const o = outRow(f.code, f.nn);
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
            const o = !ok && outRow(f.code, f.nn);
            if (o) ok = Object.assign(o, { ref: f.code + '-' + f.nn });
          }
        /* only a real input of the sheet; a net that the ABC logic computes (ABC-004A M.3410 = AND of the two valve CLOSE) keeps its logic */
        if (ok && sh.S.ext.includes(n)) {
          ain.push({ sh, n, d: ok.d, row: ok.row, ref: ok.ref });
          fa++;
        } else if (ok) logic.push(sh.name + ' ' + AN.nm(sh.S, n) + ' (' + ok.ref + ')');
        else lost.push(sh.name + ' FROM ' + refs.join('/'));
      }
      for (const [n, refs] of ix.to) {
        let hit = false;
        for (const r of refs)
          for (const f of refsOf(r)) {
            const d = dSheet(f.code);
            if (!d || f.nn > 50) continue;
            const row = d.rows.findIndex(x => +x.n === f.nn);
            if (row < 0) continue;
            addIn(d, row, { k: 'a', sh, n, ref: sh.name });
            hit = true;
          }
        if (hit) {
          ta++;
          wsh.add(sh.name);
        } else lost.push(sh.name + ' TO ' + refs.join('/'));
      }
    }
    W.idx = { din, ain };
    W._nA = AN.sheets.length;
    W.stat = { ditlDitl: dd, fromDitl: fa, toDitl: ta, logic, lost, ms: Math.round(performance.now() - t0) };
    AN.worldSheets = [...wsh];
  }
  const XL = new WeakMap();
  function fakeFrom(d) {
    if (!XL.has(d)) XL.set(d, { name: d.name, S: null, ditl: true });
    return XL.get(d);
  }
  /* one scan of the whole world */
  function tick(dt) {
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
      s.nl.avk = s.av || null;
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
    /* 3. DITL -> ABC */
    for (const a of ain) {
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
  W.set = on => {
    W.on = !!on;
    try {
      localStorage.setItem('ls-world', W.on ? '1' : '0');
    } catch (e) {}
    if (W.on) {
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
