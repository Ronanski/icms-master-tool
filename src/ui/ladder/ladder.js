/* 3.2.0-beta.25 LADDER VIEW (preview, user 2026-10-24: "ladder sample", CHECKLIST 0.2). The ladder of one DITL sheet, made by the app
   from the SAME logic the engine runs (the netlist of src/digital/parts/02-netlist.js: gates, input rows, output rows), not drawn by
   hand: the DITL drawing stays the source. The translation:
   - an output row of the drawing = one rung that ends in its coil;
   - AND = contacts in series, OR = contacts in parallel, NOT = a normally closed (N.C.) contact;
   - a flip-flop, a timer, a counter and a gate output used in more than one place = an internal relay with a rung of its own
     (S / R coil, timer block), read further on as a contact;
   - the colour of a wire is the power flow of the ladder itself (left rail -> contacts -> coil); window.LADDER.check() compares
     it with the value the engine gives the same net (the coil), so the translation is proved on every sheet (tests/regress/ladder.js).
   Read only: the values come from the engine (s.nl._v, the last scan of the drawing or of the one world). */
(function () {
  if (typeof S === 'undefined' || typeof netlist !== 'function') return;
  const L = (window.LADDER = {});
  const D = () => window.DUI || {};
  const nlOf = s => s.nl || (s.nl = netlist(s));
  const valsOf = s => {
    const nl = nlOf(s);
    if (nl._v && nl._v.length === nl.n) return nl._v;
    try {
      return simSheet(s).v;
    } catch (e) {
      return new Array(nl.n).fill(0);
    }
  };
  const short = (t, n) => {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };
  /* the address written at the start of a row text (I.032B/527/81B, M.1150/1160) and the rest */
  const split = t => {
    const m = /^\s*((?:[A-Z]{1,2}\.[0-9A-F]{4}|[A-Z]{2}\d{4})(?:\/[0-9A-F]{2,4})*)\s+(.*)$/i.exec(String(t || ''));
    return m ? { a: m[1], d: m[2] } : { a: '', d: String(t || '') };
  };
  const TK = { on: 'TON', off: 'TOF', pulse: 'TP' };

  /* ---------- netlist -> ladder program ---------- */
  function build(s) {
    const nl = nlOf(s),
      drv = new Map(),
      use = new Map(),
      srcOf = new Map();
    nl.gates.forEach((g, gi) => (g.out || []).forEach(n => drv.set(n, gi)));
    const used = (n, by) => use.set(n, (use.get(n) || 0) + by);
    nl.gates.forEach(g => {
      for (const n of g.ins || []) used(n, 1);
      for (const n of g.s || []) used(n, 1);
      for (const n of g.r || []) used(n, 1);
    });
    nl.outs.forEach(o => used(o.n, 1));
    nl.src.forEach(z => {
      if (!srcOf.has(z.n)) srcOf.set(z.n, []);
      if (!srcOf.get(z.n).includes(z.row)) srcOf.get(z.n).push(z.row);
    });
    const rungs = [],
      relay = new Map(),
      busy = new Set();
    let nR = 0,
      nT = 0,
      nF = 0;
    const rowTxt = row => {
      const I = D().rowInfo ? D().rowInfo(s, row) : { svc: '' };
      return split(I.svc || I.tag || 'row ' + (row + 1));
    };
    /* a contact of net n: NO reads n = 1, NC reads n = 0 */
    const contact = (n, nc, lab) => ({ k: 'c', n, nc: !!nc, a: lab.a, d: lab.d, row: lab.row });
    /* the relay (internal coil) of net n, made once; its rung is put before the first rung that reads it */
    function relayOf(n, kind) {
      if (relay.has(n)) return relay.get(n);
      const gi = drv.get(n),
        g = gi != null ? nl.gates[gi] : null;
      let name;
      if (g && g.t === 'FF') name = 'FF' + ++nF;
      else if (g && (g.t === 'TMR' || g.t === 'CNT')) name = (g.t === 'CNT' ? 'C' : 'T') + ++nT;
      else name = 'R' + ++nR;
      const r = { name, n };
      relay.set(n, r);
      busy.add(n);
      if (g && g.t === 'FF') {
        rungs.push({ kind: 'set', coil: name, n, spri: !!g.spri, expr: any(g.s), net: n, note: 'FLIP-FLOP ' + name + ' SET' + (g.spri ? ' (set first)' : '') });
        rungs.push({ kind: 'reset', coil: name, n, expr: any(g.r), net: n, note: 'FLIP-FLOP ' + name + ' RESET' + (g.spri ? '' : ' (reset first)') });
      } else if (g && g.t === 'TMR') {
        const fv = (g.tm && g.tm.fv) || {},
          tag = (g.tm && g.tm.tag) || '';
        rungs.push({
          kind: 'timer',
          coil: name,
          n,
          tk: TK[g.k] || 'TMR',
          pre: fv.v != null ? fv.v + ' ' + (fv.u || 'SEC').toLowerCase() : '',
          tag,
          gi,
          expr: any(g.ins || []),
          note: (g.tm && g.tm.lab ? g.tm.lab : 'TIMER') + (tag ? ' ' + tag : '') + ' → ' + name
        });
      } else if (g && g.t === 'CNT') {
        rungs.push({ kind: 'count', coil: name, n, expr: any(g.ins || []), note: 'COUNTER ' + name });
      } else rungs.push({ kind: 'coil', coil: name, n, expr: netExpr(n, true), note: 'INTERNAL RELAY ' + name + ' (used in ' + (use.get(n) || 0) + ' places)' });
      busy.delete(n);
      return r;
    }
    const relayContact = (n, nc) => {
      const r = relayOf(n);
      return { k: 'c', n, nc: !!nc, a: r.name, d: '', relay: 1 };
    };
    /* OR of several nets (the S / R of a flip-flop, the input of a timer) */
    function any(L) {
      const it = L.map(n => netExpr(n));
      return it.length === 1 ? it[0] : it.length ? { k: 'par', it } : { k: 'c', n: -1, nc: false, a: '—', d: 'not drawn', open: 1 };
    }
    /* the expression that makes net n (top = the rung of n itself: do not turn it into its own relay) */
    function netExpr(n, top) {
      if (srcOf.has(n)) {
        const rows = srcOf.get(n);
        const it = rows.map(row => contact(n, false, Object.assign(rowTxt(row), { row })));
        return it.length === 1 ? it[0] : { k: 'par', it };
      }
      const gi = drv.get(n);
      if (gi == null) {
        const x = (nl.xcon || []).find(c => c.n === n);
        if ((nl.one || []).includes(n)) return { k: 'c', n, nc: false, a: 'ON', d: 'DEFAULT 1' };
        if (x) return { k: 'c', n, nc: false, a: (x.dir === 'in' ? 'FROM ' : '') + (x.peer ? 'DITL-' + x.peer : ''), d: 'connector (' + x.num + ')' };
        return { k: 'c', n, nc: false, a: 'net ' + n, d: 'no source on the drawing' };
      }
      const g = nl.gates[gi];
      if (g.t === 'FF' || g.t === 'TMR' || g.t === 'CNT') return relayContact(n, false);
      /* a gate output read in more than one place, or met again in its own chain (a seal-in): an internal relay */
      if (!top && (busy.has(n) || (use.get(n) || 0) > 1)) return relayContact(n, false);
      busy.add(n);
      let e;
      if (g.t === 'AND') e = { k: 'ser', it: g.ins.map(m => netExpr(m)) };
      else if (g.t === 'OR') e = { k: 'par', it: g.ins.map(m => netExpr(m)) };
      else if (g.t === 'NOT') {
        /* NOT of one contact = that contact N.C.; NOT of several = all N.C. in series (none of them) */
        const it = g.ins.map(m => {
          const x = netExpr(m);
          if (x.k === 'c') return Object.assign({}, x, { nc: !x.nc });
          return relayContact(m, true);
        });
        e = it.length === 1 ? it[0] : { k: 'ser', it };
      } else if (g.t === 'CMP') {
        const a = (nl.an || []).find(x => x.net === g.ins[0]);
        e = { k: 'c', n, nc: false, cmp: 1, a: (a && (a.tag || a.key)) || 'AI', d: (g.cmp || '>') + (g.eq ? '=' : '') + ' ' + (g.sp != null ? g.sp : 'SP') };
      } else e = { k: 'c', n, nc: false, a: g.t, d: 'gate' };
      busy.delete(n);
      if (e.k !== 'c' && e.it && e.it.length === 1) e = e.it[0];
      return e;
    }
    /* one rung per output row, in the order of the drawing */
    const outs = [...nl.outs].sort((a, b) => a.row - b.row),
      done = new Set();
    for (const o of outs) {
      const key = o.row + ':' + o.n;
      if (done.has(key)) continue;
      done.add(key);
      const nm = (D().outs ? D().outs(s) : []).find(x => x.row === o.row);
      /* "Output row 5 · I.032A/526/81A SEAWATER PUMP A RUNNING · CRT": the address and the service text, without the row and the location */
      const t = split((nm ? nm.name : '').replace(/^\s*Output row \d+\s*·\s*/i, '').replace(/\s*·\s*[A-Z]{2,4}(?:\s*\(ANN\))?\s*$/, ''));
      busy.add(o.n);
      const ex = netExpr(o.n, true);
      busy.delete(o.n);
      rungs.push({ kind: 'out', coil: t.a || 'OUT ' + (o.row + 1), d: t.d, n: o.n, row: o.row, expr: ex, note: 'OUTPUT row ' + (o.row + 1) });
    }
    return { s, rungs, relays: relay.size };
  }

  /* ---------- power flow (the ladder's own answer) ---------- */
  const closed = (c, v) => (c.n < 0 ? false : c.nc ? !v[c.n] : !!v[c.n]);
  function flow(e, p, v) {
    if (e.k === 'c') return (e.pw = p) && closed(e, v);
    if (e.k === 'ser') {
      let q = p;
      for (const x of e.it) q = flow(x, q, v);
      return (e.pw = p) && q;
    }
    let q = false;
    for (const x of e.it) q = flow(x, p, v) || q;
    e.pw = p;
    return q;
  }
  /* the net the rung must agree with: the coil net of a relay / output, or the input of the block (FF S / R, timer) */
  function rungTarget(P, r, v) {
    const nl = nlOf(P.s);
    if (r.kind === 'out' || r.kind === 'coil') return { want: !!v[r.n], what: 'coil' };
    const g = nl.gates[[...nl.gates.keys()].find(i => (nl.gates[i].out || []).includes(r.n))];
    if (!g) return null;
    if (r.kind === 'set') return { want: (g.s || []).some(n => v[n]), what: 'S' };
    if (r.kind === 'reset') return { want: (g.r || []).some(n => v[n]), what: 'R' };
    return { want: (g.ins || []).some(n => v[n]), what: 'IN' };
  }
  function solve(P) {
    const v = valsOf(P.s);
    for (const r of P.rungs) {
      r.pw = flow(r.expr, true, v);
      r.q = !!v[r.n];
    }
    return v;
  }
  /* the proof: every rung's power flow = the engine's value of the same net; returns the rungs that disagree */
  L.check = s => {
    const P = build(s),
      v = solve(P),
      bad = [];
    for (const r of P.rungs) {
      const t = rungTarget(P, r, v);
      if (t && t.want !== !!r.pw) bad.push({ rung: r.note, coil: r.coil, ladder: r.pw ? 1 : 0, engine: t.want ? 1 : 0, at: t.what });
    }
    return { sheet: s.name, rungs: P.rungs.length, relays: P.relays, bad };
  };
  L.build = build;

  /* ---------- drawing (SVG) ---------- */
  const CW = 168,
    CH = 62,
    PAD = 14,
    COILW = 190;
  const size = e => {
    if (e.k === 'c') return (e.w = 1), (e.h = 1), e;
    e.it.forEach(size);
    if (e.k === 'ser') {
      e.w = e.it.reduce((a, x) => a + x.w, 0);
      e.h = Math.max(...e.it.map(x => x.h));
    } else {
      e.w = Math.max(...e.it.map(x => x.w));
      e.h = e.it.reduce((a, x) => a + x.h, 0);
    }
    return e;
  };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  function draw(e, x, y, w, out) {
    /* (x, y) = left end of the element's line; w = the width (cells) it must fill */
    const X = n => x + n * CW;
    if (e.k === 'c') {
      const on = !!e.pw,
        cl = e._cl,
        live = on && cl,
        cx = x + CW / 2,
        k = live ? 'lw on' : 'lw';
      out.push('<line class="' + (on ? 'lw on' : 'lw') + '" x1="' + x + '" y1="' + y + '" x2="' + (cx - 9) + '" y2="' + y + '"/>');
      out.push('<line class="' + k + '" x1="' + (cx + 9) + '" y1="' + y + '" x2="' + X(w) + '" y2="' + y + '"/>');
      out.push(
        '<g class="lc' + (cl ? ' cl' : '') + (e.relay ? ' rel' : '') + (e.cmp ? ' cmp' : '') + '"' + (e.row != null ? ' data-row="' + e.row + '"' : '') + '>' +
          '<line x1="' + (cx - 9) + '" y1="' + (y - 11) + '" x2="' + (cx - 9) + '" y2="' + (y + 11) + '"/>' +
          '<line x1="' + (cx + 9) + '" y1="' + (y - 11) + '" x2="' + (cx + 9) + '" y2="' + (y + 11) + '"/>' +
          (e.nc ? '<line x1="' + (cx - 13) + '" y1="' + (y + 12) + '" x2="' + (cx + 13) + '" y2="' + (y - 12) + '"/>' : '') +
          (e.cmp ? '<rect x="' + (cx - 9) + '" y="' + (y - 11) + '" width="18" height="22"/>' : '') +
          '<text class="la" x="' + cx + '" y="' + (y - 16) + '">' + esc(short(e.a, 24)) + '</text>' +
          '<text class="ld" x="' + cx + '" y="' + (y + 24) + '">' + esc(short(e.d, 27)) + '</text>' +
          '<title>' + esc((e.a ? e.a + ' ' : '') + e.d + (e.nc ? ' (N.C.: closed while 0)' : ' (N.O.: closed while 1)') + ' = ' + (cl ? 'CLOSED' : 'OPEN')) + '</title></g>'
      );
      return;
    }
    if (e.k === 'ser') {
      let cx = x;
      e.it.forEach((it, i) => {
        const last = i === e.it.length - 1;
        draw(it, cx, y, last ? w - (cx - x) / CW : it.w, out);
        cx += it.w * CW;
      });
      return;
    }
    /* parallel: each branch from the left bar to the right bar */
    let cy = y;
    const ys = [];
    e.it.forEach(it => {
      ys.push(cy);
      draw(it, x, cy, w, out);
      cy += it.h * CH;
    });
    const anyOut = e.it.some(it => it._out);
    out.push('<line class="' + (e.pw ? 'lw on' : 'lw') + '" x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + ys[ys.length - 1] + '"/>');
    out.push('<line class="' + (anyOut ? 'lw on' : 'lw') + '" x1="' + X(w) + '" y1="' + y + '" x2="' + X(w) + '" y2="' + ys[ys.length - 1] + '"/>');
  }
  /* the closed state and the power out of every element, for the colours */
  function mark(e, v) {
    if (e.k === 'c') {
      e._cl = closed(e, v);
      e._out = !!e.pw && e._cl;
      return e._out;
    }
    const r = e.it.map(x => mark(x, v));
    if (e.k === 'ser') e._out = !!e.pw && r[r.length - 1];
    else e._out = r.some(Boolean);
    return e._out;
  }
  function svg(P) {
    const v = solve(P),
      out = [];
    let y = PAD + 26,
      maxW = 1;
    P.rungs.forEach(r => {
      size(r.expr);
      maxW = Math.max(maxW, r.expr.w);
    });
    const W = PAD * 2 + 30 + maxW * CW + COILW;
    P.rungs.forEach((r, i) => {
      mark(r.expr, v);
      const h = r.expr.h * CH + 40,
        x0 = PAD + 30,
        xr = x0 + maxW * CW,
        ly = y + 36;
      out.push('<text class="ln" x="' + PAD + '" y="' + (y + 4) + '">' + (i + 1) + '</text>');
      out.push('<text class="lnote" x="' + x0 + '" y="' + (y + 4) + '">' + esc(r.note + (r.d ? ': ' + r.d : '')) + '</text>');
      draw(r.expr, x0, ly, maxW, out);
      const on = !!r.pw,
        q = r.kind === 'out' || r.kind === 'coil' ? r.q : on;
      out.push('<line class="' + (r.expr._out ? 'lw on' : 'lw') + '" x1="' + xr + '" y1="' + ly + '" x2="' + (xr + 30) + '" y2="' + ly + '"/>');
      const cx = xr + 48,
        sym = r.kind === 'set' ? 'S' : r.kind === 'reset' ? 'R' : '';
      if (r.kind === 'timer' || r.kind === 'count')
        out.push(
          '<g class="lk' + (on ? ' on' : '') + '"><rect x="' + (xr + 30) + '" y="' + (ly - 18) + '" width="62" height="36" rx="3"/><text x="' + (xr + 61) + '" y="' + (ly - 2) + '">' + esc(r.tk || 'CNT') + '</text><text class="ld" x="' + (xr + 61) + '" y="' + (ly + 12) + '">' + esc(r.pre || '') + '</text></g>'
        );
      else
        out.push(
          '<g class="lk' + (q ? ' on' : '') + '"><path d="M' + (cx - 6) + ' ' + (ly - 14) + ' a 16 16 0 0 0 0 28 M' + (cx + 22) + ' ' + (ly - 14) + ' a 16 16 0 0 1 0 28"/>' +
            '<line x1="' + (xr + 30) + '" y1="' + ly + '" x2="' + (cx - 9) + '" y2="' + ly + '"/><text x="' + (cx + 8) + '" y="' + (ly + 5) + '">' + sym + '</text></g>'
        );
      out.push('<text class="la lcn" x="' + (xr + 100) + '" y="' + (ly - 4) + '">' + esc(short(r.coil, 20)) + '</text>');
      out.push('<text class="ld lcn" x="' + (xr + 100) + '" y="' + (ly + 12) + '">' + esc(short(r.kind === 'out' ? r.d : r.kind === 'timer' ? r.tag : '', 30)) + '</text>');
      out.push('<line class="rail" x1="' + x0 + '" y1="' + (y + 10) + '" x2="' + x0 + '" y2="' + (y + h) + '"/>');
      y += h + 10;
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" class="lsvg" width="' + W + '" height="' + (y + PAD) + '" viewBox="0 0 ' + W + ' ' + (y + PAD) + '">' + out.join('') + '</svg>';
  }

  /* ---------- the panel beside the DITL drawing ---------- */
  let box = null,
    body = null,
    head = null,
    tmr = null,
    key = '',
    P = null;
  const cur = () => S.sheets[S.cur];
  function paint() {
    const s = cur();
    if (!s || !box) return;
    const k = S.cur + '|' + s.name;
    if (k !== key || !P) {
      key = k;
      P = build(s);
    }
    const sc = body.scrollTop,
      sl = body.scrollLeft;
    body.innerHTML = svg(P);
    body.scrollTop = sc;
    body.scrollLeft = sl;
    const c = L.check(s);
    head.querySelector('.lh-t').textContent = s.name + (s.title ? ' · ' + s.title : '');
    head.querySelector('.lh-s').textContent =
      P.rungs.length + ' rungs, ' + P.relays + ' internal relays · ' + (SIM ? 'live' : 'VIEW: press ▶ Run for live values') + ' · ladder = engine: ' + (c.bad.length ? c.bad.length + ' rung(s) differ' : 'all ' + c.rungs + ' agree');
  }
  L.open = () => {
    if (!box) {
      box = document.createElement('div');
      box.id = 'ladder';
      box.innerHTML =
        '<div class="lh"><div><div class="lh-t"></div><div class="lh-s"></div></div><button type="button" class="lh-x" title="Close the ladder view">✕</button></div>' +
        '<div class="lh-n">Ladder view (preview): made by the app from the logic of the DITL drawing. Green = energized. N.C. contact = slash. FF / T / R = internal relay.</div><div class="lb"></div>';
      document.body.append(box);
      head = box.querySelector('.lh');
      body = box.querySelector('.lb');
      box.querySelector('.lh-x').onclick = L.close;
      body.addEventListener('click', ev => {
        const g = ev.target.closest('[data-row]');
        if (g && D().goItem)
          try {
            D().goItem(cur(), +g.getAttribute('data-row'));
          } catch (e) {}
      });
    }
    box.style.display = '';
    document.body.classList.add('ladder-on');
    key = '';
    paint();
    clearInterval(tmr);
    tmr = setInterval(() => {
      if (box.style.display === 'none') return;
      if (window.AN && AN.cat === 'an') return L.close();
      paint();
    }, 500);
  };
  L.close = () => {
    if (box) box.style.display = 'none';
    document.body.classList.remove('ladder-on');
    clearInterval(tmr);
  };
  L.toggle = () => (box && box.style.display !== 'none' ? L.close() : L.open());
  L.isOpen = () => !!(box && box.style.display !== 'none');
})();
