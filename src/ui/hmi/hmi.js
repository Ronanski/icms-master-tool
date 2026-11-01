/* Operator faceplate (mini HMI): second tab of the right pane. UI only: it reads the simulator (AN) and writes the same operator values the existing pane writes
   (input values, forced signals, the position of the A/M switch); the simulation engine is not changed. */
(function () {
  const $ = id => document.getElementById(id);
  const E = (t, a, c) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (c || []).forEach(x => e.append(x));
    return e;
  };
  const fmt = x =>
    x == null || !isFinite(x)
      ? '—'
      : (Math.abs(x) >= 1000
          ? x.toFixed(0)
          : Math.abs(x) >= 100
            ? x.toFixed(1)
            : Math.abs(x) >= 10
              ? x.toFixed(2)
              : x.toFixed(3)
        ).replace(/^-(0(?:\.0+)?)$/, '$1'); /* 3.2.0-beta.1 (audit L2): not -0.000 */
  const sheet = () => AN.sheets && AN.sheets[AN.i];
  /* 2.0.0: touch screens (tablet / phone) */
  const TOUCH = (() => {
    try {
      return matchMedia('(pointer:coarse)').matches;
    } catch (e) {
      return false;
    }
  })();
  /* user 2026-10-15: SV / MV / manual value in a faceplate are changed with the ▲ ▼ buttons only: no keyboard on any device */
  const noKb = el => {
    if (el) {
      el.readOnly = true;
      el.setAttribute('inputmode', 'none');
    }
    return el;
  };
  /* 2.0.0 (user): SV and manual values step in the UNIT of the parameter: ▲ = one round unit (1, 0.1, 10 ... about 1 % of
     the range, rounded down to 1 / 10 / 100), ▲▲ = 5 of them; e.g. 0 ~ 600 °C: 1 / 5 °C, 0 ~ 2.6 T/H: 0.01 / 0.05 T/H */
  const sfmt = x => String(+(+x).toPrecision(3));
  const niceStep = span => {
    const x = Math.abs(span) / 100;
    return x > 0 && isFinite(x) ? Math.pow(10, Math.floor(Math.log10(x) + 1e-9)) : 1;
  };
  /* 2.0.0: an ▲ / ▼ button like the DCS faceplate: one press = one step; held down it repeats (after 0.4 s, 10 per second)
     and after 2 s it goes 5 times faster. A plain click (mouse, keyboard, test) is one step. */
  const stepBtn = (txt, title, fn) => {
    const b = E('button', { cls: 'b stp', txt, title });
    let t1 = null,
      t2 = null,
      n = 0,
      byPtr = false;
    const stop = () => {
      clearTimeout(t1);
      clearInterval(t2);
      t1 = t2 = null;
    };
    b.addEventListener('pointerdown', e => {
      if (e.button) return;
      byPtr = true;
      n = 0;
      fn(1);
      stop();
      t1 = setTimeout(() => {
        t2 = setInterval(() => fn(++n > 20 ? 5 : 1), 100);
      }, 400);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => b.addEventListener(k, stop));
    b.addEventListener('contextmenu', e => e.preventDefault());
    b.onclick = () => {
      if (byPtr) byPtr = false;
      else fn(1);
    };
    return b;
  };
  let opp = null,
    body = null,
    built = '',
    live = [],
    trends = {},
    filter = '',
    lastT = -1,
    only = null; /* 2.4.0-beta.5: PLANT VIEW builds the faceplate of one tag only (AN.fpBuild) */
  const setIn = (S, n, v) => {
    S.rt.ext[n] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  /* ang .MAN / .LOC / .REM ng isang tag ay iisang HMI command sa buong DCS: lahat ng input na may ganitong pangalan sa lahat ng sheet (hindi lang ang sa sheet ng controller) */
  /* a wire named by its description only: not an address (B.0641, M.0228, AI0641) and not linked from another sheet */
  const descWire = (S2, n) =>
    !(S2.xlk && S2.xlk[n]) &&
    !/^(?:(?:S\d\s+)?[A-Z]{1,2}\.[0-9A-F]{4}|(?:S\d\s+)?[A-Z]{2}\d{4}|[A-Z]{2,}[A-Z0-9-]*\.[A-Z]{2,4}|\d\s*:\s*[A-Z])$/.test((AN.nm(S2, n) || '').trim()); /* 2.2.0-beta.9: also an address with its station (S2 M.2502) and a switch leg mark (1:B) */
  const modeNetsRaw = (tag, kinds, own) => {
    const out = own ? [own] : [],
      want = new Set(kinds.map(k => (tag + '.' + k).toLowerCase())),
      add = (S2, n) => !out.some(q => q[0] === S2 && q[1] === n) && out.push([S2, n]),
      descs = new Set(),
      tagged = [];
    for (const sh2 of AN.sheets) {
      if (/^ABC-000/.test(sh2.name)) continue;
      let S2;
      try {
        S2 = AN.ensure(sh2);
      } catch (e) {
        continue;
      }
      if (!S2 || !S2.ext) continue;
      for (const n of S2.ext) {
        const t = S2.lab[n] && S2.lab[n].t;
        if (t && want.has(t.trim().toLowerCase())) add(S2, n);
        /* 2.3.0-beta.1: the mode status written beside a wire that carries an address (ABC-011 "TICBR1130.LOC" = M.0230) */
        if (S2.alias && S2.alias[n] && S2.alias[n].some(a => want.has(a.toLowerCase()))) add(S2, n);
      }
      /* 1.23.0: the wire may carry the description as its name with the tag text written at its end (ABC-004A "CONTROL IN
         MANUAL" + "PIC-COBM.MAN"): the digital input wire that ends at the tag text (< 14) is that address */
      const tq = (S2.tx || []).filter(q => want.has(String(q.t).trim().toLowerCase()));
      if (!tq.length) continue;
      tagged.push(S2);
      for (const q of tq) {
        let best = -1,
          bd = 8; /* 2.2.0-beta.9: distance to the line of the wire (the own wire is about 5 units under its tag text) */
        for (const n of S2.ext) {
          const nn = S2.nets[n];
          if (!nn || !nn.dig || !descWire(S2, n)) continue;
          for (const i of nn.segs) {
            /* 2.2.0-beta.9: the distance to the LINE of the wire, not to its ends: the tag text is written on its own wire (ABC-001C
               "HIC-BM.MAN" over the wire "BOILER MASTER IN MANUAL"); with the ends, a shorter wire of the pair above was nearer
               ("TURBINE MASTER IN MANUAL", 12 units from its end, while the own wire ends 34 units away), so HIC-BM.MAN was the
               turbine master wire */
            const g = S2.seg[i],
              dx = g.x2 - g.x1,
              dy = g.y2 - g.y1,
              L2 = dx * dx + dy * dy,
              t = L2 > 0 ? Math.max(0, Math.min(1, ((q.x - g.x1) * dx + (q.y - g.y1) * dy) / L2)) : 0,
              d = Math.hypot(q.x - (g.x1 + t * dx), q.y - (g.y1 + t * dy));
            if (d < bd) {
              bd = d;
              best = n;
            }
          }
        }
        /* 2.2.0-beta.20: the tag text written at the LEFT END of its wire, as a label (ABC-004A "FICCL1061B.MAN  C/F B FLOW CTL IN
           MANUAL ( FROM ABC-004B )": the text ends about where the wire starts, 40 units right of the text's origin): a digital
           description wire whose end is within 60 units right of the text, on the same line (dy <= 4) */
        let leftEnd = false;
        if (best < 0) {
          let bx = 61;
          for (const n of S2.ext) {
            const nn = S2.nets[n];
            if (!nn || !nn.dig || !descWire(S2, n)) continue;
            /* the leftmost end of a horizontal segment of the wire */
            let lx = 1e9,
              ly = 0;
            for (const i of nn.segs) {
              const g = S2.seg[i];
              if (Math.abs(g.y1 - g.y2) > 1) continue;
              const ex = Math.min(g.x1, g.x2);
              if (ex < lx) {
                lx = ex;
                ly = g.y1;
              }
            }
            const dx = lx - q.x;
            if (dx > 0 && dx < bx && Math.abs(ly - q.y) <= 4) {
              bx = dx;
              best = n;
              leftEnd = true;
            }
          }
        }
        if (best >= 0) {
          add(S2, best);
          const d = (AN.nm(S2, best) || '').trim().toUpperCase();
          if (!leftEnd && d.length >= 10 && !/^[A-Z]{1,3}\.\w{4}$/.test(d) && !d.includes(tag.toUpperCase())) descs.add(d);
        }
      }
    }
    /* the same description on another sheet that shows the same tag text (ABC-001C "BOILER PRESSURE CONTROL IN MANUAL"
       with "PIC-COBM.MAN" a little further away, under other wires) */
    if (descs.size)
      for (const S2 of tagged)
        for (const n of S2.ext) {
          const nn = S2.nets[n],
            d = (AN.nm(S2, n) || '').trim().toUpperCase();
          if (nn && nn.dig && descWire(S2, n) && [...descs].some(x => d === x || d.endsWith(' ' + x))) add(S2, n);
        }
    return out;
  };
  /* speed (user 2026-11-01 "Ge ayusin pre", 6x CPU: the SOP scan and the dock asked this every second for every step, each time a
     walk over all the sheets): the wires of a tag only change when a sheet is built again, so they are kept per tag while every
     sheet keeps the same built state (S) */
  let mnK = null;
  const mnC = new Map();
  const modeNetsByTag = (tag, kinds, own) => {
    const sh = AN.sheets || [];
    if (!sh.length || sh.some(x => !x.S && !/^ABC-000/.test(x.name))) return modeNetsRaw(tag, kinds, own);
    if (!mnK || mnK.length !== sh.length || sh.some((x, i) => x.S !== mnK[i])) {
      mnK = sh.map(x => x.S);
      mnC.clear();
    }
    const k = tag + '|' + kinds.join(',');
    let r = mnC.get(k);
    if (!r) mnC.set(k, (r = modeNetsRaw(tag, kinds, null)));
    return own ? [own, ...r.filter(q => !(q[0] === own[0] && q[1] === own[1]))] : r.slice();
  };
  /* 1.22.0: .MAN / .LOC / .REM are the MODE STATUS of the controller (textbook: status word .MAN = MANUAL, .LOC = LOCAL,
     .REM = REMOTE), not a short pulse: pressing M / A / R sets that one to 1 and the other two to 0, on every sheet with the tag,
     and it STAYS until another mode is pressed. The drawing reads it as a level (ABC-010: "DRUM LEVEL CONTROL MANUAL FOR
     START-UP  LICBR1001B.MAN" -> NOT -> force manual of FICFW1007: with a pulse the feedwater loop could never go to AUTO) */
  const MODEK = { MAN: ['MAN', 'MANUAL'], LOC: ['LOC', 'LOCAL', 'AUTO', 'AUT'], REM: ['REM', 'REMOTE'] };
  const latchMode = (tag, kind, own) => {
    /* 2.2.0-beta.20: ONE command. Every .MAN / .LOC / .REM address of the tag is written first (the selected mode last), then the
       sheets settle once. Before, each address settled on its own (setIn): for those scans the controller was in no mode at all
       (MAN = 0, LOC = 0, REM still 0). FIC-CM R (M4 step 5) took its SV to 0 for those scans, the fuel SI0017 fell with it, and the
       boiler master, tracking SI0017 while the coal master is not REMOTE (ABC-001C M.2000), kept 27.0 % instead of 33.6 %: the coal
       fell from 36 to 11 T/H and the main steam pressure to 108.7 kg/cm2 */
    const w = [];
    for (const k in MODEK) for (const [S2, n] of modeNetsByTag(tag, MODEK[k], k === kind ? own : null)) w.push([S2, n, k === kind ? 1 : 0]);
    w.sort((a, b) => a[2] - b[2]);
    for (const [S2, n, v] of w) S2.rt.ext[n] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  const setMV = (S, c, v) => {
    if (c.manBlk && S.rt.st[c.manBlk.id]) S.rt.st[c.manBlk.id].val = v;
    else S.rt.ext[c.manNet] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  function tagOf(S, id) {
    for (const a of S.addr || []) if (a.ai === id && a.t) return a.t;
    return '';
  }
  function describe(sh, t) {
    try {
      const a = AN.adesFind && AN.adesFind(sh, t);
      if (a && a.rec) {
        const r = a.rec;
        return r.k === 'io' ? [r.tag, r.d].filter(Boolean).join(' · ') : [r.d, r.r].filter(Boolean).join(' · ');
      }
    } catch (e) {}
    return '';
  }
  function ctrls(S) {
    const out = [];
    for (const b of S.blk) {
      if (b.k !== 'PID' && b.k !== 'PIDV') continue;
      const tag = (b.txt || [])[1];
      if (!tag || /^X+-/.test(tag)) continue;
      let q = null;
      try {
        q = AN.anPins(S, b);
      } catch (e) {}
      if (!q || q.pv == null || q.pv < 0) continue;
      /* the A/M station of this controller is found by the engine (anStationOf): the same rule for the panel and for the force-manual logic */
      const stn = AN.anStationOf(S, b),
        amt = stn.amt,
        autoLeg = stn.autoLeg,
        manNet = stn.manNet,
        manBlk = stn.manBlk;
      /* the SV is the output of a T switch whose B leg is a COS (the operator's SV, drawing ABC-007 etc.): the faceplate SV field sets that COS and picks leg B (LOCAL); REM goes back to the SV of the logic */
      const svSw = AN.anSvSwitchOf(S, b),
        remote = !!svSw && AN.anHasRemote(S, b); /* REMOTE / LOCAL only where the drawing has a REMOTE mode */
      /* the switching signals of the drawing for this loop: the select signals of the A/M station (1:A / 1:B) and the mode inputs TAG.MAN / .LOC / .REM; the panel shows them live and the mode inputs are buttons that write the SAME signals as the diagram */
      const manLeg = autoLeg === 'A' ? 'B' : 'A',
        lb = n => (S.lab[n] && S.lab[n].t) || 'n' + n,
        sigs = [];
      if (amt) {
        const L =
          amt.cs && amt.cs.length > 1
            ? amt.cs.map(z => ({ n: z.n, leg: z.A ? 'A' : 'B' }))
            : amt.sel >= 0
              ? [{ n: amt.sel, leg: amt.p && amt.p.selA ? 'A' : 'B' }]
              : [];
        for (const z of L) {
          const dr = (S.drv[z.n] || []).find(d => d.k !== 'LINK');
          sigs.push({
            n: z.n,
            name: lb(z.n),
            role: z.leg === manLeg ? 'MAN' : 'AUTO',
            src: dr && dr.i ? dr.i.map(m => ({ n: m, name: lb(m) })) : []
          });
        }
      }
      const modes = [],
        mre = new RegExp(
          '^' + tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.(MAN|LOC|REM|AUTO|AUT|LOCAL|REMOTE|MANUAL)$',
          'i'
        );
      for (let n = 0; n < S.nets.length; n++) {
        const tx = S.lab[n] && S.lab[n].t;
        if (tx && mre.test(tx.trim()) && S.ext.includes(n) && !modes.some(z => z.n === n))
          modes.push({ n, name: tx.trim(), kind: tx.trim().split('.').pop().toUpperCase() });
      }
      /* selectors after the controller output (interlock / back-up legs): when one is on its B leg the valve command is NOT the MV of the faceplate */ const dn =
        [];
      {
        let cur = amt ? amt.o[0] : b.o[0];
        for (let k = 0; k < 6; k++) {
          const g = S.blk.find(
            x =>
              (x.k === 'AMT' || x.k === 'SW') &&
              (!amt || x.id !== amt.id) &&
              x.a === cur &&
              x.b !== cur &&
              !dn.some(d => d.id === x.id)
          );
          if (!g) break;
          dn.push({ id: g.id, sel: g.cs && g.cs[0] ? g.cs[0].n : g.sel });
          cur = g.o[0];
        }
      }
      out.push({
        b,
        tag,
        q,
        amt,
        autoLeg,
        manNet,
        manBlk,
        svSw,
        remote,
        sigs,
        modes,
        dn,
        out: amt ? amt.o[0] : b.o[0],
        desc: (b.face && b.face.desc) || ''
      });
    }
    /* pamagat: ang paglalarawan ng DCS (xlsx) ang ginagamit; kung pareho ito sa dalawang controller ng sheet (hal. "PAF/SAF AIR FLOW CONTROL"), ang nakasulat sa drawing sa tabi ng PID ang gagamitin ("PRIMARY AIR FLOW CONTROL") */
    {
      const cnt = {};
      out.forEach(o => {
        cnt[o.desc] = (cnt[o.desc] || 0) + 1;
      });
      for (const o of out) {
        if (o.desc && cnt[o.desc] < 2) continue;
        const b = o.b;
        const t = (S.tx || [])
          .filter(
            x =>
              x.x >= b.x1 - 2 &&
              x.x <= b.x1 + 25 &&
              x.y >= b.y0 - 6 &&
              x.y <= b.y1 + 6 &&
              !/~/.test(x.t) &&
              x.t.trim().length > 2
          )
          .sort((a, c) => c.y - a.y)
          .map(x => x.t.trim())
          .join(' ');
        if (t) o.desc = t;
      }
    }
    return out;
  }
  AN.hmiCtrls = ctrls; /* for the tests */
  function manTag(b) {
    return b.tag || (b.txt || []).find(t => t && t !== 'MAN' && !/^S\d-MDL/.test(t)) || 'MAN';
  }
  /* 2.4.0-beta.5 PLANT VIEW: the sheet that holds the controller (PID / PIDV) or MAN station of a tag; the same faceplate as the
     Operator pane, built for that one tag (A / M / R, SV, MV, trend, interlock); the engine is not changed */
  let fpIx = null,
    fpOf = null;
  AN.fpFind = tag => {
    const T = String(tag || '').trim().toUpperCase();
    if (!T) return null;
    /* 3.2.0-beta.10: built again when the sheet list changes; an index made while the page shows DITL (no ABC sheet) is not kept */
    if (!fpIx || fpOf !== AN.sheets) {
      fpIx = {};
      fpOf = AN.sheets;
      for (const sh of AN.sheets || []) {
        if (!/^ABC-/.test(sh.name) || /^ABC-000/.test(sh.name)) continue;
        let S;
        try {
          S = AN.ensure(sh);
        } catch (e) {
          continue;
        }
        if (!S || !S.blk) continue;
        try {
          for (const c of ctrls(S)) fpIx[c.tag.toUpperCase()] = fpIx[c.tag.toUpperCase()] || sh.name;
        } catch (e) {}
        for (const b of S.blk)
          if (b.k === 'MAN' && b.o[0] != null && (b.tag || (b.txt || []).some(t => t && t !== 'MAN'))) {
            const t = manTag(b).toUpperCase();
            if (t !== 'MAN' && !fpIx[t]) fpIx[t] = sh.name;
          }
      }
      if (!Object.keys(fpIx).length) fpIx = null;
    }
    return (fpIx && fpIx[T]) || null;
  };
  AN.fpBuild = (tag, box) => {
    const nm = AN.fpFind(tag),
      sh = nm && AN.sheets.find(s => s.name === nm);
    if (!sh) return null;
    try {
      AN.ensure(sh);
    } catch (e) {}
    const sb = body,
      sl = live;
    body = box;
    only = String(tag).trim().toUpperCase();
    let out = null;
    try {
      build(sh);
      out = { sheet: sh.name, live };
    } finally {
      body = sb;
      live = sl;
      only = null;
    }
    return out && out.live.length ? out : null;
  };
  /* 2.2.0-beta.9: the .MAN / .LOC / .REM addresses of a tag on every sheet, for the engine (plant.js MAN station status) */
  AN.modeNets = (tag, kinds) => modeNetsByTag(tag, kinds || MODEK.MAN);
  /* 2.2.0-beta.15: the operator's M / A (LOC) / R on a tag, for the engine (Start cold: every controller MANUAL = .MAN 1) and the CHECK */
  AN.latchMode = latchMode;
  function trendOf(key) {
    return trends[key] || (trends[key] = { t: [], pv: [], sv: [], mv: [] });
  }
  function drawTrend(svg, tr, rlo, rhi) {
    const W = 360,
      H = 96;
    let s = '';
    const n = tr.t.length;
    if (n < 2) {
      svg.innerHTML = '<text x="10" y="50" fill="#7d8e9a" font-size="12">No data yet: RUN the simulation.</text>';
      return;
    }
    const t0 = tr.t[0],
      t1 = tr.t[n - 1],
      dt = Math.max(1, t1 - t0);
    const all = tr.pv.concat(tr.sv).filter(isFinite);
    let lo = isFinite(rlo) ? rlo : Math.min(...all),
      hi = isFinite(rhi) ? rhi : Math.max(...all);
    if (hi - lo < 1e-9) {
      hi = lo + 1;
    }
    const X = t => 4 + ((t - t0) / dt) * (W - 8),
      Yp = v => H - 6 - ((v - lo) / (hi - lo)) * (H - 12),
      Ym = v => H - 6 - (Math.max(0, Math.min(100, v)) / 100) * (H - 12);
    for (let g = 1; g < 4; g++)
      s += `<line x1="0" x2="${W}" y1="${(g * H) / 4}" y2="${(g * H) / 4}" stroke="#1e2c36"/>`;
    const pl = (arr, Y, c, w, d) =>
      `<polyline fill="none" stroke="${c}" stroke-width="${w}" ${d ? 'stroke-dasharray="4 3"' : ''} points="${tr.t.map((t, i) => X(t).toFixed(1) + ',' + Y(arr[i]).toFixed(1)).join(' ')}"/>`;
    s +=
      pl(tr.mv, Ym, '#6fe3a0', 1.4, true) + pl(tr.sv, Yp, '#5cc8ff', 1.4, false) + pl(tr.pv, Yp, '#ffd84a', 2, false);
    s += `<text x="4" y="10" fill="#7d8e9a" font-size="9">${fmt(hi)}</text><text x="4" y="${H - 2}" fill="#7d8e9a" font-size="9">${fmt(lo)}</text><text x="${W - 4}" y="${H - 2}" text-anchor="end" fill="#7d8e9a" font-size="9">${Math.round(dt)} s</text>`;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = s;
  }
  function build(shArg) {
    const sh = shArg || sheet();
    if (!sh || !sh.S) return;
    const S = sh.S;
    if (!shArg) built = sh.name;
    live = [];
    body.innerHTML = '';
    body.append(
      E('div', { cls: 'hdr', txt: sh.name }),
      E('div', { cls: 'sub', txt: (sh.title || '').replace(/\s+/g, ' ') })
    );
    // 1. controllers
    const cs = ctrls(S).filter(c => !only || only === c.tag.toUpperCase());
    if (cs.length && !only) body.append(E('h4', { txt: 'Controllers (faceplate)' }));
    cs.forEach(c => {
      const P = c.b.p,
        rlo = P.rlo != null ? P.rlo : 0,
        rhi = P.rhi != null ? P.rhi : 100,
        unit = P.unit || '';
      const key = sh.name + '|' + c.b.id;
      /* live test #55: every A / M / R and SV / MV of the faceplate is an operator event (tag, sheet), also while the sheet is not on the
         screen (the MODE events of events.js read the sheet on screen only); a ramp of SV / MV (hold, ▲▲) is one event when it stops */
      const opT = {},
        opEv = (k, v) => {
          const say = () => {
            try {
              window.lsEventAdd && lsEventAdd(sh.name, 'DCS', 'Operator: ' + c.tag + ' ' + k + (v === undefined ? '' : ' = ' + (+v).toFixed(2).replace(/\.?0+$/, '')) + ' (faceplate)');
            } catch (e) {}
          };
          clearTimeout(opT[k]);
          if (v === undefined) say();
          else opT[k] = setTimeout(say, 1200);
        };
      const pv = E('b', { txt: '—' }),
        sv = E('b', { txt: '—' }),
        mv = E('b', { txt: '—' });
      const barBand = E('i', { cls: 'gband' }),
        barPv = E('i', { cls: 'gpv' }),
        barSvm = E('i', { cls: 'gsv' }),
        barMv = E('i', { cls: 'mvp' });
      const bAuto = E('button', {
          cls: 'b ra',
          txt: 'A',
          title: 'A = AUTO (operator SV / LOCAL when the loop has REMOTE)'
        }),
        bMan = E('button', { cls: 'b ra man', txt: 'M', title: 'M = MANUAL (the operator sets the MV)' });
      const svIn = noKb(E('input', { cls: 'n', type: 'number', step: 'any' })),
        mvIn = noKb(E('input', { cls: 'n', type: 'number', step: 'any' }));
      const svOk = S.ext.includes(c.q.sv) || !!c.svSw,
        svSet = v => {
          if (S.ext.includes(c.q.sv)) {
            setIn(S, c.q.sv, v);
          } else if (c.svSw) {
            S.rt.ext[c.svSw.b] = v;
            if (!c.remote) {
              const q = S.rt.st[c.svSw.id];
              if (q) {
                q.al = 'A';
                q.fm = 'B';
              }
            }
            /* no REMOTE on this loop: typing the SV picks the SV of the operator (COS) */ try {
              AN.settle();
            } catch (e) {}
          }
        },
        mvOk = c.manNet != null && (S.ext.includes(c.manNet) || !!c.manBlk);
      const svRow = E('div', { cls: 'row' }, [
        E('span', { txt: 'SV' }),
        E('button', {
          cls: 'b',
          txt: '−',
          on: () => {
            const v = (+svIn.value || 0) - (rhi - rlo) / 100;
            svIn.value = v.toFixed(3);
            svSet(v);
          }
        }),
        E('button', {
          cls: 'b',
          txt: '+',
          on: () => {
            const v = (+svIn.value || 0) + (rhi - rlo) / 100;
            svIn.value = v.toFixed(3);
            svSet(v);
          }
        }),
        E('span', { cls: 'sub', txt: unit })
      ]);
      const svSrc = E('span', { cls: 'sub', style: 'margin-left:6px' }),
        swMode = m => {
          const q = S.rt.st[c.svSw.id];
          if (!q) return;
          q.al = 'A';
          q.fm = m;
          try {
            AN.settle();
          } catch (e) {}
        },
        bRem = E('button', {
          cls: 'b' + (c.remote ? ' ra' : ''),
          txt: c.remote ? 'R' : 'SV: LOGIC',
          title: c.remote
            ? 'REMOTE: AUTO; SV from the logic path; MV and SV cannot be set by hand'
            : 'SV from the logic path',
          on: () => {
            swMode('A');
            if (c.remote) pulse(['REM', 'REMOTE']);
            opEv(c.remote ? 'REMOTE' : 'SV: LOGIC');
          }
        }),
        bLoc = E('button', {
          cls: 'b',
          style: c.remote ? 'display:none' : '',
          txt: c.remote ? 'LOCAL' : 'SV: OPERATOR',
          title: c.remote ? 'LOCAL: MAN allowed, SV set by the operator (COS)' : 'Operator SV (COS)',
          on: () => (swMode('B'), opEv(c.remote ? 'LOCAL' : 'SV: OPERATOR'))
        }),
        modeRow = c.svSw && !c.remote ? E('div', { cls: 'row' }, [E('span', { txt: 'SV' }), bRem, bLoc]) : null;
      const sgEls = c.sigs.map(z => {
          const e = E('span', {
            cls: 'sg',
            title:
              'Drawing signal: ' +
              z.name +
              (z.role === 'MAN' ? ' (selects MANUAL / force manual)' : ' (selects AUTO)')
          });
          return { z, e };
        }),
        mdEls = c.modes.map(z => {
          const e = E('button', {
            cls: 'b',
            txt: '.' + z.kind,
            title: z.name + ' = drawing input (HMI); the same signal as on the diagram',
            on: () => {
              const v = S.rt.ext[z.n] > 0.5 ? 0 : 1;
              setIn(S, z.n, v);
            }
          });
          return { z, e };
        }),
        sgRow = E(
          'div',
          { cls: 'row', style: 'flex-wrap:wrap;gap:4px' },
          sgEls.map(x => x.e).concat(mdEls.map(x => x.e))
        );
      const mvB = [0, 50, 100].map(x =>
          E('button', {
            cls: 'b',
            txt: String(x),
            on: () => {
              mvIn.value = x;
              setMV(S, c, x);
              opEv('MV', x);
            }
          })
        ),
        mvRow = E('div', { cls: 'row' }, [E('span', { txt: 'MV (MAN)' })].concat(mvB)),
        fmEl = E('span', { cls: 'sub', style: 'color:#ff7a7a;font-weight:700' }),
        /* 3.2.0-beta.6 "BAKIT?": why the loop is held in MANUAL, walked to the root signal (src/ui/shell/why.js) */
        fmList = E('div', { cls: 'whyl' }),
        fmWhy = E('button', {
          cls: 'b whyb',
          txt: 'Why?',
          title: 'Show the signal that holds this loop in MANUAL, back to its source (drawing logic, live values)',
          on: () => (fmList.childNodes.length ? (fmList.textContent = '') : whyMan())
        }),
        fmBox = E('div', { cls: 'whyx' }, [fmEl, fmWhy, fmList]),
        cutEl = E('div', { cls: 'sub', style: 'color:#ffb454;font-weight:700;margin:2px 0' }),
        cutTx = E('span'),
        cutWhy = E('button', {
          cls: 'b',
          txt: 'Why?',
          title: 'Find the drawing inputs that clear this interlock when changed',
          style: 'margin-left:6px',
          on: () => whyCut()
        }),
        cutList = E('div', { style: 'margin-top:3px' });
      cutEl.append(cutTx, cutWhy, cutList);
      svRow.append(svSrc);
      if (svOk) {
        svIn.onchange = () => (svSet(+svIn.value), opEv('SV', +svIn.value));
      } else {
        svIn.disabled = true;
        svRow.append(E('span', { cls: 'sub', txt: '(SV from the logic)' }));
      }
      if (mvOk) {
        mvIn.onchange = () => (setMV(S, c, +mvIn.value), opEv('MV', +mvIn.value));
      } else {
        mvIn.disabled = true;
        mvRow.append(E('span', { cls: 'sub', txt: '(no manual input)' }));
      }
      const setMode = m => {
        if (!c.amt) return;
        const st = S.rt.st[c.amt.id];
        if (!st) return;
        const manLeg = c.autoLeg === 'A' ? 'B' : 'A';
        st.al = c.autoLeg;
        st.fm = m === 'A' ? c.autoLeg : manLeg;
        try {
          AN.settle();
        } catch (e) {}
      };
      /* R / A / M set the mode status of the drawing (.REM / .LOC / .MAN) on every sheet with this tag; it stays (1.22.0, see latchMode) */
      const pulse = kinds => {
        const kind = kinds.includes('MAN') ? 'MAN' : kinds.includes('REM') ? 'REM' : 'LOC',
          m = c.modes.find(z => MODEK[kind].includes(z.kind));
        latchMode(c.tag, kind, m ? [S, m.n] : null);
      };
      bAuto.onclick = () => {
        if (c.remote && c.svSw) {
          const q = S.rt.st[c.svSw.id];
          if (q && q.pk === 'A') swMode('B');
        }
        setMode('A');
        pulse(['LOC', 'LOCAL', 'AUTO', 'AUT']);
        opEv('AUTO');
      };
      bMan.onclick = () => {
        setMode('M');
        pulse(['MAN', 'MANUAL']);
        opEv('MAN');
      };
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'tr');
      const pvBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'PV' }), E('span', { txt: unit })]),
          E('div', { cls: 'fv pv' }, [pv])
        ]),
        svBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'SV' }), E('span', { txt: unit }), svSrc]),
          svIn
        ]),
        mvBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'MV' }), E('span', { txt: '%' })]),
          mvIn
        ]);
      svIn.classList.add('fv');
      mvIn.classList.add('fv');
      svSrc.style.cssText = 'margin-left:6px;font-size:10px;color:#8fa0ab';
      {
        const fc = c.b.face,
          fx = x => Math.max(0, Math.min(100, ((x - rlo) / (rhi - rlo)) * 100));
        if (fc && fc.PH > fc.PL && isFinite(fc.PL) && isFinite(fc.PH)) {
          barBand.style.cssText = 'bottom:' + fx(fc.PL) + '%;height:' + Math.max(1, fx(fc.PH) - fx(fc.PL)) + '%';
        } else barBand.style.display = 'none';
      }
      const graph = E('div', { cls: 'fpg' }, [
        E('span', { cls: 'hi', txt: fmt(rhi) }),
        E('span', { cls: 'lo', txt: fmt(rlo) }),
        E('div', { cls: 'gm', title: 'PL ~ PH: normal PV range (from the DCS data)' }, [barBand]),
        E('div', { cls: 'gb' }, [barPv]),
        E('div', { cls: 'gb' }, [barSvm])
      ]);
      const raCol = E('div', { cls: 'fpr' }, (c.remote ? [bRem] : []).concat([bAuto, bMan])),
        mvBr = E('div', { cls: 'mvb' }, [barMv]);
      const card = E('div', { cls: 'fp fpx' }, [
        E('div', { cls: 'fpt', txt: c.desc || (AN.descOf && AN.descOf(sh, c.tag)) || c.tag }),
        E('div', { cls: 'fpm' }, [
          graph,
          E('div', { cls: 'fpc' }, [pvBox, svBox, E('div', { cls: 'fps' }, [raCol, mvBr]), mvBox])
        ]),
        fmBox,
        cutEl,
        E('div', { cls: 'tg' }, [
          E('b', { txt: c.tag }),
          E('span', {
            txt:
              (unit ? '[' + fmt(rlo) + ' ~ ' + fmt(rhi) + ' ' + unit + ']' : '') +
              (c.amt ? '' : '  (no A/M switch)')
          })
        ]),
        E(
          'details',
          { cls: 'fpe' },
          [E('summary', { txt: 'Engineering: drawing signals, SV / MV buttons, trend' }), sgRow]
            .concat(modeRow ? [modeRow] : [])
            .concat([
              svRow,
              mvRow,
              svg,
              E('div', { cls: 'lg' }, [
                E('span', {}, [E('i', { style: 'background:#ffd84a' }), document.createTextNode('PV')]),
                E('span', {}, [E('i', { style: 'background:#5cc8ff' }), document.createTextNode('SV')]),
                E('span', {}, [E('i', { style: 'background:#6fe3a0' }), document.createTextNode('MV')])
              ])
            ])
        )
      ]);
      /* click sa kahon ng SV / MV (ayon sa DCS ng planta): lumalabas ang control na pang-taas / pang-baba; clickable lang kapag enabled sa tamang scenario */
      card.style.position = 'relative';
      const popEl = E('div', { cls: 'fpop' });
      card.append(popEl);
      let popK = null,
        popVal = null;
      const popIn = k => (k === 'SV' ? svIn : mvIn),
        popLo = k => (k === 'SV' ? rlo : 0),
        popHi = k => (k === 'SV' ? rhi : 100),
        popStep = k => (k === 'SV' ? niceStep(popHi(k) - popLo(k)) : 1);
      const popSet = (k, v) => {
        v = Math.max(popLo(k), Math.min(popHi(k), v));
        popIn(k).value = +v.toFixed(3);
        if (k === 'SV') svSet(v);
        else setMV(S, c, v);
        opEv(k, v);
        popRefresh();
      };
      const popRefresh = () => {
        if (!popK) return;
        const inp = popIn(popK);
        if (inp.disabled) {
          closePop();
          return;
        }
        if (popVal && document.activeElement !== popVal) popVal.value = inp.value;
      };
      const closePop = () => {
        popEl.style.display = 'none';
        popK = null;
      };
      const openPop = (k, box) => {
        if (popIn(k).disabled) return;
        popK = k;
        popEl.innerHTML = '';
        const st = popStep(k),
          n = x => +x;
        popVal = noKb(E('input', { cls: 'n', type: 'number', step: 'any' }));
        popVal.value = popIn(k).value;
        popVal.onchange = () => popSet(k, n(popVal.value));
        const B = (t, d, title) => stepBtn(t, title, m => popSet(k, n(popIn(k).value) + d * m));
        popEl.append(
          E('div', { cls: 'row', style: 'justify-content:space-between' }, [
            E('b', { txt: k + '  ' + c.tag }),
            E('button', { cls: 'b', txt: '✕', on: closePop })
          ]),
          E('div', { cls: 'row' }, [popVal, E('span', { cls: 'sub', txt: k === 'SV' ? unit : '%' })]),
          E('div', { cls: 'row' }, [
            B('▲▲', st * 5, '+' + sfmt(st * 5) + ' ' + (k === 'SV' ? unit : '%') + ' (hold = faster)'),
            B('▲', st, '+' + sfmt(st) + ' ' + (k === 'SV' ? unit : '%') + ' (hold = faster)'),
            B('▼', -st, '-' + sfmt(st) + ' ' + (k === 'SV' ? unit : '%') + ' (hold = faster)'),
            B('▼▼', -st * 5, '-' + sfmt(st * 5) + ' ' + (k === 'SV' ? unit : '%') + ' (hold = faster)')
          ]),
          E('div', { cls: 'sub', txt: '▲ ' + sfmt(st) + ' · ▲▲ ' + sfmt(st * 5) + ' ' + (k === 'SV' ? unit : '%') + ' per press; hold to ramp' })
        );
        if (k === 'MV')
          popEl.append(
            E(
              'div',
              { cls: 'row' },
              [0, 50, 100].map(x => E('button', { cls: 'b', txt: String(x), on: () => popSet('MV', x) }))
            )
          );
        popEl.style.display = 'block';
        popEl.style.top = box.offsetTop + box.offsetHeight + 4 + 'px';
      };
      svBox.addEventListener('click', e => {
        if (e.target.closest('.fpop')) return;
        openPop('SV', svBox);
      });
      mvBox.addEventListener('click', e => {
        if (e.target.closest('.fpop')) return;
        openPop('MV', mvBox);
      });
      live.push(popRefresh);
      const whyMan = () => {
        fmList.textContent = '';
        let W = [];
        try {
          W = AN.whyMan(sh, c);
        } catch (e) {}
        if (!W.length) return fmList.append(E('div', { cls: 'sub', txt: 'Held by the A/M station itself (back-up command): press A when the condition is gone.' }));
        for (const w of W)
          for (const l of w.lines) {
            const row = E('div', { cls: 'whyr k-' + l.k, style: 'padding-left:' + (0.25 + l.d * 0.75) + 'rem' }, [E('span', { txt: l.txt + (l.sh && l.sh !== sh.name ? '  [' + l.sh + ']' : '') })]);
            const s2 = AN.sheets.find(x => x.name === l.sh);
            if (l.k === 'input' && s2 && s2.S) {
              const to = s2.S.rt.v[l.n] > 0.5 ? 0 : 1;
              row.append(E('button', { cls: 'b', txt: '→ ' + to, title: 'Set this input to ' + to + ' (the same as the switch / PB on the drawing)', on: () => (setIn(s2.S, l.n, to), setTimeout(whyMan, 300)) }));
            }
            fmList.append(row);
          }
      };
      const whyCut = () => {
        const cg = (c.dn || []).find(d => {
          const t = S.rt.st[d.id];
          return t && t.pk === 'B';
        });
        cutList.textContent = '';
        if (!cg) return;
        const seen = new Set(),
          cand = [],
          q = [cg.sel];
        while (q.length && seen.size < 400) {
          const n = q.shift();
          if (seen.has(n)) continue;
          seen.add(n);
          if (S.ext.includes(n)) {
            if (S.nets[n].dig && S.rt.force[n] === undefined && !(S.xlk && S.xlk[n])) cand.push(n);
            continue;
          }
          for (const g of S.drv[n] || []) for (const i of g.i || []) if (i >= 0) q.push(i);
        }
        const was = S.rt.v[cg.sel],
          hits = [];
        for (const n of cand.slice(0, 40)) {
          const o = S.rt.ext[n] || 0;
          S.rt.ext[n] = o > 0.5 ? 0 : 1;
          try {
            AN.settle();
          } catch (e) {}
          if ((S.rt.v[cg.sel] > 0.5 ? 1 : 0) !== (was > 0.5 ? 1 : 0))
            hits.push({ n, to: S.rt.ext[n], name: (S.lab[n] && S.lab[n].t) || 'n' + n + ' (no label)' });
          S.rt.ext[n] = o;
        }
        try {
          AN.settle();
        } catch (e) {}
        cutList.append(
          E('span', {
            cls: 'sub',
            txt: hits.length
              ? 'Changing this one input clears the interlock (press to set it):'
              : 'No single input on this sheet clears it (it needs more than one, or it comes from another sheet / a measurement).'
          })
        );
        for (const h of hits)
          cutList.append(
            E('button', { cls: 'b', txt: h.name + ' → ' + h.to, style: 'margin:2px', on: () => setIn(S, h.n, h.to) })
          );
      };
      body.append(card);
      live.push(() => {
        const v = S.rt.v,
          pvv = v[c.q.pv],
          svv = v[c.q.sv],
          mvv = v[c.out];
        pv.textContent = fmt(pvv);
        sv.textContent = fmt(svv);
        mv.textContent = fmt(mvv);
        const f = x => Math.max(0, Math.min(100, ((x - rlo) / (rhi - rlo)) * 100));
        barPv.style.height = f(pvv) + '%';
        barSvm.style.height = f(svv) + '%';
        barMv.style.bottom = Math.max(0, Math.min(100, mvv)) + '%';
        const pk = c.amt && S.rt.st[c.amt.id] ? S.rt.st[c.amt.id].pk : c.autoLeg;
        const isAuto = !c.amt || pk === c.autoLeg;
        const remNow = !!(c.remote && c.svSw && S.rt.st[c.svSw.id] && S.rt.st[c.svSw.id].pk === 'A');
        bAuto.classList.toggle('on', isAuto && !remNow);
        bMan.classList.toggle('on', !isAuto);
        sgEls.forEach(x => {
          const on = S.rt.v[x.z.n] > 0.5;
          x.e.textContent = x.z.name + ' → ' + x.z.role + ' ' + (on ? '1' : '0');
          x.e.title =
            'Drawing signal: ' +
            x.z.name +
            (x.z.role === 'MAN' ? ' (selects MANUAL / force manual)' : ' (selects AUTO)') +
            (x.z.src.length ? ' ← ' + x.z.src.map(q => q.name + '=' + (S.rt.v[q.n] > 0.5 ? 1 : 0)).join(', ') : '');
          x.e.style.cssText =
            'padding:1px 6px;border-radius:9px;font-size:11px;border:1px solid ' +
            (on ? (x.z.role === 'MAN' ? '#ff7a7a' : '#6fe3a0') : '#2c3d49') +
            ';color:' +
            (on ? '#fff' : '#7d8e9a') +
            (on ? ';background:' + (x.z.role === 'MAN' ? '#5a2323' : '#1d4a31') : '');
        });
        mdEls.forEach(x => {
          const on = S.rt.ext[x.z.n] > 0.5 || S.rt.v[x.z.n] > 0.5;
          x.e.classList.toggle('on', on);
        });
        const q_ = c.svSw && S.rt.st[c.svSw.id],
          pkA = !!(q_ && q_.pk === 'A'),
          rem = c.remote && pkA;
        /* REMOTE (only where the drawing has it): AUTO talaga, hindi mamamanual, pati SV (user rule 2026-10-15) */ if (
          c.svSw
        ) {
          svSrc.textContent = c.remote
            ? pkA
              ? 'REMOTE: AUTO, SV from the logic path'
              : 'LOCAL: operator SV (COS)'
            : pkA
              ? 'SV: from the logic path'
              : 'SV: operator (COS)';
          bRem.classList.toggle('on', pkA);
          bLoc.classList.toggle('on', !pkA);
          bRem.disabled = !!(q_ && q_.fman) || pkA;
          bLoc.disabled = !pkA;
          bMan.disabled = rem;
          svIn.disabled = rem && svOk && !S.ext.includes(c.q.sv);
          svRow.querySelectorAll('button').forEach(x => {
            x.disabled = rem;
          });
        } else svSrc.textContent = '';
        /* SV ay para sa AUTO (A) lang: naka-disable sa MANUAL at sa REMOTE (user 2026-10-15) */ if (svOk) {
          const lock = (!!c.amt && !isAuto) || (rem && !S.ext.includes(c.q.sv));
          svIn.disabled = lock;
          svRow.querySelectorAll('button').forEach(x => {
            x.disabled = lock;
          });
        }
        const fsg = c.sigs.find(z => z.role === 'MAN' && S.rt.v[z.n] > 0.5),
          fm_ = !!fsg || !!(c.amt && S.rt.st[c.amt.id] && S.rt.st[c.amt.id].fman);
        {
          const cg = (c.dn || []).find(d => {
            const t = S.rt.st[d.id];
            return t && t.pk === 'B';
          });
          cutTx.textContent = cg
            ? 'OUTPUT CUT BY INTERLOCK: ' +
              ((S.lab[cg.sel] && S.lab[cg.sel].t) || 'n' + cg.sel) +
              ' = 1 → valve command = back-up leg of the drawing (not the MV above)'
            : '';
          cutWhy.style.display = cg ? '' : 'none';
          if (!cg) cutList.textContent = '';
        }
        fmEl.textContent = fm_ ? 'FORCE MANUAL (' + (fsg ? fsg.name + ' = 1' : 'logic') + '): AUTO not allowed' : '';
        fmWhy.style.display = fm_ ? '' : 'none';
        if (!fm_ && fmList.childNodes.length) fmList.textContent = '';
        bAuto.disabled = !!fm_;
        /* MV is only for MANUAL: in AUTO the operator changes the SV, not the MV */ if (mvOk) {
          mvIn.disabled = (isAuto || rem) && !!c.amt;
          mvB.forEach(x => (x.disabled = (isAuto || rem) && !!c.amt));
        }
        if (document.activeElement !== svIn && isFinite(svv)) svIn.value = +svv.toFixed(3);
        if (document.activeElement !== mvIn && isFinite(mvv)) mvIn.value = +mvv.toFixed(2);
        const tr = trendOf(key);
        if (S.rt.t !== tr.last) {
          tr.last = S.rt.t;
          tr.t.push(S.rt.t);
          tr.pv.push(pvv);
          tr.sv.push(svv);
          tr.mv.push(mvv);
          if (tr.t.length > 600) {
            for (const k of ['t', 'pv', 'sv', 'mv']) tr[k].shift();
          }
        }
        drawTrend(svg, tr, rlo, rhi);
      });
    });
    // 2. manual stations (2.0.0): a faceplate like the DCS manual loader: description, output bar, value, ▲ ▼, tag and station
    const mans = S.blk.filter(b => b.k === 'MAN' && b.o[0] != null && (b.tag || (b.txt || []).some(t => t && t !== 'MAN')) && (!only || only === manTag(b).toUpperCase()));
    if (mans.length && !only) body.append(E('h4', { txt: 'Manual stations (' + mans.length + ')' }));
    mans.forEach(b => {
      const P = b.p,
        lo = P.lo != null ? P.lo : 0,
        hi = P.hi != null ? P.hi : 100,
        u = P.u || '',
        span = hi - lo || 1,
        tag = manTag(b),
        stn = (b.txt || []).find(t => /^S\d-MDL/.test(t)) || '';
      let desc = '';
      try {
        desc = (AN.descOf && AN.descOf(sh, tag)) || '';
      } catch (e) {}
      const inp = noKb(E('input', { cls: 'n fv', type: 'number', step: 'any' })),
        bar = E('i', {}),
        set = v => {
          const st = S.rt.st[b.id];
          if (st) st.val = Math.max(lo, Math.min(hi, v));
          /* 2.2.0-beta.2: a station in AUTO follows its set input (leg A of its SV switch); when that input is the operator's own
             set (an input of the sheet, e.g. ABC-001A HIC-ULD: TARGET MW, COS SI0243 "TARGET MW SETUP FROM CCS CRT"), the
             faceplate writes it. Before: the value was overwritten by the target at the next step, so ▼ did nothing in AUTO */
          try {
            const si = b.svI >= 0 ? b.i[b.svI] : null,
              dr = si != null ? (S.drv[si] || []).find(z => z.k === 'AMT') : null,
              ds = dr && S.rt.st[dr.id];
            if (dr && ds && ds.pk === 'A' && dr.a != null && S.ext.includes(dr.a) && !(S.xlk && S.xlk[dr.a]))
              S.rt.ext[dr.a] = Math.max(lo, Math.min(hi, v));
          } catch (e) {}
          try {
            AN.settle();
          } catch (e) {}
        },
        cur = () => {
          const v = S.rt.v[b.o[0]];
          return isFinite(v) ? v : +inp.value || 0;
        },
        fine = niceStep(span),
        coarse = fine * 5;
      inp.onchange = () => set(+inp.value);
      const manB = E('button', {
        cls: 'b',
        txt: 'MAN',
        title: tag + '.MAN: MANUAL status (ON / OFF) on every sheet that uses this tag',
        on: () => {
          const ns = modeNetsByTag(tag, MODEK.MAN),
            on = !ns.some(([S2, n]) => S2.rt.ext[n] > 0.5);
          ns.forEach(([S2, n]) => setIn(S2, n, on ? 1 : 0));
        }
      });
      body.append(
        E('div', { cls: 'fp fpx fpman', 'data-tag': tag }, [
          E('div', { cls: 'fpt', txt: desc || tag }),
          E('div', { cls: 'mlr' }, [
            E('div', { cls: 'mlb', title: 'Output: ' + fmt(lo) + ' ~ ' + fmt(hi) + ' ' + u }, [bar]),
            E('div', { cls: 'mlc' }, [
              E('div', { cls: 'fl' }, [E('span', { txt: 'MV' }), E('span', { txt: u })]),
              inp,
              E('div', { cls: 'row mls' }, [
                stepBtn('▲▲', '+' + sfmt(coarse) + ' ' + u + ' (hold = faster)', m => set(cur() + coarse * m)),
                stepBtn('▲', '+' + sfmt(fine) + ' ' + u + ' (hold = faster)', m => set(cur() + fine * m)),
                stepBtn('▼', '-' + sfmt(fine) + ' ' + u + ' (hold = faster)', m => set(cur() - fine * m)),
                stepBtn('▼▼', '-' + sfmt(coarse) + ' ' + u + ' (hold = faster)', m => set(cur() - coarse * m))
              ]),
              E('div', { cls: 'sub', txt: '▲ ' + sfmt(fine) + ' · ▲▲ ' + sfmt(coarse) + ' ' + u + ' per press; hold to ramp' })
            ])
          ]),
          E('div', { cls: 'tg' }, [
            E('b', { txt: tag }),
            E('span', { txt: '[' + fmt(lo) + ' ~ ' + fmt(hi) + (u ? ' ' + u : '') + ']' + (stn ? '  ' + stn : '') }),
            manB
          ])
        ])
      );
      live.push(() => {
        const v = S.rt.v[b.o[0]];
        bar.style.height = Math.max(0, Math.min(100, ((v - lo) / span) * 100)) + '%';
        if (document.activeElement !== inp && isFinite(v)) inp.value = +v.toFixed(3);
        const ns = modeNetsByTag(tag, MODEK.MAN);
        manB.classList.toggle('on', ns.some(([S2, n]) => S2.rt.ext[n] > 0.5));
      });
    });
    if (only) return;
    // 3. digital inputs: operator buttons and force
    const dig = [];
    for (const n of S.ext) {
      if (!S.nets[n].dig) continue;
      const l = S.lab[n] && S.lab[n].t && S.lab[n].t.trim();
      if (l && !/^\(/.test(l) && !dig.some(x => x[1] === l)) dig.push([n, l]);
    }
    const sig = S.blk.filter(b => b.k === 'SIGAB' && b.o[0] != null && (b.txt || [])[1]);
    body.append(E('h4', { txt: 'Buttons (digital inputs): ON / OFF and FORCE' }));
    const fin = E('input', { cls: 'f', placeholder: 'Find tag or description…' });
    body.append(fin);
    const dlist = E('div');
    body.append(dlist);
    const rows = [];
    dig.forEach(([n, l]) => {
      const desc = describe(sh, l);
      const state = E('button', { cls: 'b', txt: 'OFF' }),
        fb = E('button', { cls: 'b', txt: 'FORCE', title: 'Force the value, whatever the logic says' });
      const linked = () => !!(S.xlk && S.xlk[n]);
      state.onclick = () => {
        const cur = S.rt.force[n] !== undefined ? S.rt.force[n] : linked() ? S.rt.v[n] : S.rt.ext[n] || 0;
        const nv = cur > 0.5 ? 0 : 1;
        if (S.rt.force[n] !== undefined || linked()) S.rt.force[n] = nv;
        else S.rt.ext[n] = nv;
        try {
          AN.settle();
        } catch (e) {}
      };
      fb.onclick = () => {
        if (S.rt.force[n] !== undefined) delete S.rt.force[n];
        else S.rt.force[n] = S.rt.v[n] > 0.5 ? 1 : 0;
        try {
          AN.settle();
        } catch (e) {}
      };
      const tr = E('tr', {}, [
        E('td', {}, [
          E('b', { txt: l }),
          E('small', { txt: desc + (S.xlk && S.xlk[n] ? '  (from another sheet: ON/OFF = force)' : '') })
        ]),
        E('td', { cls: 'v' }, [state, document.createTextNode(' '), fb])
      ]);
      tr._h = (l + ' ' + desc).toLowerCase();
      rows.push(tr);
      live.push(() => {
        const f = S.rt.force[n] !== undefined,
          on = (f ? S.rt.force[n] : S.rt.v[n]) > 0.5;
        state.textContent = on ? 'ON' : 'OFF';
        state.classList.toggle('on', on);
        fb.classList.toggle('fon', f);
      });
    });
    sig.forEach(b => {
      const tg = (b.txt || [])[1];
      const st = E('button', { cls: 'b', txt: 'OK' });
      st.onclick = () => {
        const q = S.rt.st[b.id];
        if (q) {
          q.val = q.val > 0.5 ? 0 : 1;
          try {
            AN.settle();
          } catch (e) {}
        }
      };
      const tr = E('tr', {}, [
        E('td', {}, [E('b', { txt: 'SIG.AB ' + tg }), E('small', { txt: 'Bad signal (simulation only)' })]),
        E('td', { cls: 'v' }, [st])
      ]);
      tr._h = ('sig.ab ' + tg + ' bad signal').toLowerCase();
      rows.push(tr);
      live.push(() => {
        const q = S.rt.st[b.id];
        const bad = q && q.val > 0.5;
        st.textContent = bad ? 'BAD' : 'OK';
        st.classList.toggle('fon', !!bad);
      });
    });
    const tb = E('table', { cls: 'tbl' });
    rows.forEach(r => tb.append(r));
    dlist.append(tb);
    if (!rows.length) dlist.append(E('div', { cls: 'sub', txt: 'This sheet has no digital inputs.' }));
    fin.oninput = () => {
      const q = fin.value.trim().toLowerCase();
      rows.forEach(r => (r.style.display = !q || r._h.indexOf(q) >= 0 ? '' : 'none'));
    };
    // 4. monitoring: analog inputs to outputs
    const ais = S.blk.filter(b => b.k === 'AI' && b.o[0] != null);
    if (ais.length) body.append(E('h4', { txt: 'Monitoring: inputs (transmitters)' }));
    if (ais.length) {
      const t = E('table', { cls: 'tbl' });
      ais.forEach(b => {
        const tag = tagOf(S, b.id) || 'AI#' + b.id;
        const unit = (b.rng && b.rng.u) || '';
        const inp = E('input', { cls: 'n', type: 'number', step: 'any' });
        const lab = E('small', { txt: describe(sh, tag) });
        inp.onchange = () => {
          const st = S.rt.st[b.id];
          if (st) {
            st.val = +inp.value;
          }
          try {
            AN.settle();
          } catch (e) {}
        };
        t.append(
          E('tr', {}, [
            E('td', {}, [E('b', { txt: tag }), lab]),
            E('td', { cls: 'v' }, [inp, document.createTextNode(' ' + unit)])
          ])
        );
        live.push(() => {
          const v = S.rt.v[b.o[0]];
          if (document.activeElement !== inp && isFinite(v)) inp.value = +v.toFixed(3);
        });
      });
      body.append(t);
    }
    const aos = [];
    for (const b of S.blk.filter(q => q.k === 'AO' && q.i[0] != null)) {
      let best = null,
        bd = 1e9;
      for (const t of S.tx) {
        if (!/^AO\d{3,4}/.test(t.t.trim())) continue;
        const d = Math.hypot(b.cx - t.x, b.cy - t.y);
        if (d < bd) {
          bd = d;
          best = t.t.trim().split(/\s+/)[0];
        }
      }
      aos.push([b, best && bd < 80 ? best : 'AO#' + b.id]);
    }
    if (aos.length) {
      body.append(E('h4', { txt: 'Monitoring: outputs (AO)' }));
      const t = E('table', { cls: 'tbl' });
      aos.forEach(([b, tag]) => {
        const v = E('td', { cls: 'v', txt: '—' });
        t.append(E('tr', {}, [E('td', {}, [E('b', { txt: tag }), E('small', { txt: describe(sh, tag) })]), v]));
        live.push(() => {
          v.textContent = fmt(S.rt.v[b.i[0]]) + ' %';
        });
      });
      body.append(t);
    }
    // 5. flags (named digital nets that the logic drives)
    const flags = [];
    for (const k in S.lab) {
      const l = S.lab[k] && S.lab[k].t && S.lab[k].t.trim();
      const n = +k;
      if (!l || !S.nets[n] || !S.nets[n].dig || S.ext.includes(n)) continue;
      if (/^(M|B)\.[0-9A-F]{3,4}$/i.test(l) && !flags.some(f => f[1] === l)) flags.push([n, l]);
    }
    if (flags.length) {
      body.append(E('h4', { txt: 'Logic flags (lamp: red = 1)' }));
      const t = E('table', { cls: 'tbl' });
      flags.slice(0, 60).forEach(([n, l]) => {
        const lamp = E('span', { cls: 'lamp' });
        t.append(E('tr', {}, [E('td', {}, [lamp, E('b', { txt: l }), E('small', { txt: describe(sh, l) })])]));
        live.push(() => lamp.classList.toggle('on', S.rt.v[n] > 0.5));
      });
      body.append(t);
    }
  }
  function tick() {
    try {
      if (!opp) return;
      /* 3.2.0-beta.1: not the Panel button of the DITL bar (it is in the ribbon too, hidden on ABC) */
      const pb = [...document.querySelectorAll('button')].find(x => /^(Panel|Inspector)$/.test(x.textContent.trim()) && !x.closest('.hmitabs,.g-ditl,#dp'));
      const on = !!(pb && pb.classList.contains('on'));
      const op = document.body.classList.contains('ophmi');
      opp.style.display = on && op ? 'flex' : 'none';
      if (!(on && op)) return;
      const sh = sheet();
      if (!sh || !sh.S) return;
      if (built !== sh.name) build();
      for (const f of live) f();
    } catch (e) {}
  }
  function tabs(active) {
    const w = E('div', { cls: 'hmitabs' }, [
      E('button', { cls: active === 'd' ? 'on' : '', txt: 'Inspector', on: () => mode(false) }),
      E('button', { cls: active === 'o' ? 'on' : '', txt: 'Faceplate', on: () => mode(true) })
    ]);
    w.dataset.hmi = '1';
    return w;
  }
  function mode(op) {
    document.body.classList.toggle('ophmi', op);
    try {
      localStorage.setItem('ls.rightpane', op ? 'o' : 'd');
    } catch (e) {}
    if (op) {
      built = '';
    }
    tick();
  }
  function init() {
    const mid = $('mid'),
      anp = $('anp');
    if (!mid || !anp || opp) return false;
    opp = E('div', { id: 'opp' });
    body = E('div', { cls: 'body' });
    opp.append(tabs('o'), body);
    anp.after(opp);
    const ins = () => {
      if (!anp.querySelector('.hmitabs')) anp.prepend(tabs('d'));
    };
    ins();
    new MutationObserver(ins).observe(anp, { childList: true });
    try {
      if (localStorage.getItem('ls.rightpane') === 'o') document.body.classList.add('ophmi');
    } catch (e) {}
    setInterval(tick, 250);
    return true;
  }
  let n = 0;
  const iv = setInterval(() => {
    try {
      if (init() || ++n > 60) clearInterval(iv);
    } catch (e) {
      clearInterval(iv);
    }
  }, 300);
})();
