/* 3.2.1 plan c2: TCS, a page of its own on the rail: the sheets of the Interlock Block Diagram 310SC90-794 rev 2, simulated. Each block stands where
   the IBD has it, so a sheet reads in the IBD's order, top to bottom; the wires are routed here, the lines of the drawing are not in the app. The
   gates run in the engine (src/analog/engine/tcs-trip.js). Same working style as ABC and DITL: sheet list, Values, Trace, Inspector, Inputs. A wire
   at 1 is red; a traced wire is blue. The Inputs list holds an input at 1 or 0. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const NAME = {
    A: 'AND',
    '2/3': '2/3',
    WO: 'WO',
    MID: 'MID',
    CMP: 'CMP',
    FF: 'S / R',
    LS: 'LS',
    FG: 'FG',
    FLK: 'FLK',
    PO: 'PO',
    DI: 'DI',
    DT: 'DT',
    OR: 'OR',
    NOT: 'NOT'
  };
  const LONG = {
    A: 'AND gate',
    OR: 'OR gate',
    NOT: 'NOT gate',
    '2/3': '2 out of 3 gate',
    WO: 'Wipe-out: input passes unless wiped',
    FF: 'Memory, reset has priority',
    MID: 'Median',
    CMP: 'Comparator',
    DI: 'Timer, delay pick up',
    DT: 'Timer, delay drop out',
    PO: 'Timer, one shot',
    FG: 'Function generator',
    LS: 'Low selector',
    FLK: 'Flicker'
  };
  const FS = 10;
  let cur = 'TA-9',
    box = null,
    tm = 0,
    live = [],
    vals = [],
    blocks = [],
    sel = null,
    side = 'ins',
    showV = true,
    trace = true,
    traced = new Set();
  const css = `#tcsl{position:fixed;left:var(--railW,4rem);top:0;right:0;bottom:0;z-index:120;display:flex;background:var(--panel,#1b2530);color:var(--tx,#edf3f8);font:14px Inter,system-ui,sans-serif}
#tcsl nav{width:18rem;overflow:auto;border-right:1px solid var(--line,#34475a);padding:.5rem;flex:none}
#tcsl nav button{display:block!important;width:100%!important;height:auto!important;min-height:0!important;white-space:normal!important;text-align:left!important;overflow:visible!important;text-overflow:clip!important;background:none;border:0;border-bottom:1px solid var(--line,#34475a);border-radius:0;color:inherit;padding:.625rem .5rem;margin:0;font:inherit;line-height:1.4;cursor:pointer}
#tcsl nav button b{display:block;font-weight:600}
#tcsl nav button.on{background:var(--panel2,#233140)}
#tcsl section{flex:1;display:flex;flex-direction:column;min-width:0}
#tcsl .hd{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;flex-wrap:wrap}
#tcsl .hd b{flex:1;min-width:12rem}
#tcsl .x{background:none;border:1px solid var(--line,#34475a);border-radius:6px;color:inherit;padding:.25rem .625rem;cursor:pointer;font:inherit}
#tcsl .x.on{background:var(--panel2,#233140);border-color:#5b7a97}
#tcsl .bd{flex:1;display:flex;min-height:0}
#tcsl .sv{flex:1;min-width:0;background:#f4f5f6}#tcsl svg{display:block;width:100%;height:100%}
#tcsl .sd{width:19rem;flex:none;overflow:auto;border-left:1px solid var(--line,#34475a);padding:.625rem}
#tcsl .sd h4{margin:.5rem 0 .25rem;font-size:13px}#tcsl .sd p{margin:.25rem 0;font-size:13px;overflow-wrap:anywhere}
#tcsl .ir{display:flex;gap:.375rem;align-items:center;padding:.375rem 0;border-bottom:1px solid var(--line,#34475a)}
#tcsl .ir span{flex:1;font-size:13px;min-width:0;overflow-wrap:anywhere}
#tcsl .ir button{background:var(--in,#141c25);color:inherit;border:1px solid var(--line,#34475a);border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit}
#tcsl .ir button.on{border-color:#d32020;color:#ff8d8d}
@media (max-width:1100px){#tcsl nav{width:11rem}#tcsl .sd{width:14rem}}`;
  const sheets = () => (AN.tcsIbdSheets ? AN.tcsIbdSheets() : []);
  const Y = y => 842 - y;
  const fmtV = v =>
    v == null || !isFinite(v)
      ? 'no value'
      : Math.abs(v) >= 100
        ? (+v).toFixed(0)
        : Math.abs(v) === 1 || v === 0
          ? String(v)
          : (+v).toFixed(2);
  const stNow = () => (AN.tcsIbd ? AN.tcsIbd(cur) : null);
  function paint() {
    if (!box || box.hidden) return;
    const st = stNow();
    if (!st) return;
    for (const [p, n] of live) {
      const on = st.v[n] > 0.5,
        t = traced.has(n);
      p.setAttribute('stroke', t ? '#2f6fd0' : on ? '#d32020' : '#7d8a96');
      p.setAttribute('stroke-width', t ? 2 : on ? 1.6 : 0.9);
    }
    for (const [e, n] of vals) {
      e.textContent = showV ? fmtV(st.v[n]) : '';
      e.setAttribute('fill', st.v[n] > 0.5 ? '#d32020' : '#3a4650');
    }
    for (const b of box.querySelectorAll('.sd .ir button')) {
      const f = st.fx[cur + ':' + b.dataset.n];
      b.classList.toggle('on', b.dataset.v === '1' ? f === 1 : b.dataset.v === '0' ? f === 0 : f == null);
    }
    if (side === 'insp') inspector(st);
  }
  /* words wrapped to lines of n characters */
  function wrap(t, n) {
    const L = [];
    let c = '';
    for (const w of String(t).split(' ')) {
      if (c && (c + ' ' + w).length > n) {
        L.push(c);
        c = w;
      } else c = c ? c + ' ' + w : w;
    }
    if (c) L.push(c);
    return L;
  }
  const netName = (s, n) => {
    const i = s.i.find(q => q[0] === n);
    if (i && i[1]) return i[1];
    const x = s.x.find(q => q[0] === n);
    if (x) return (x[3] ? 'From ' : 'To ') + x[2] + ' link ' + x[1];
    const b = blocks.find(q => q.out === n);
    return b ? 'Output of ' + (NAME[b.t] || b.t) : 'Net ' + n;
  };
  /* the nets that feed block b, back to the inputs of the sheet */
  function fanIn(b) {
    const S = new Set(),
      todo = b.ins.slice();
    while (todo.length) {
      const n = todo.pop();
      if (S.has(n)) continue;
      S.add(n);
      const d = blocks.find(q => q.out === n);
      if (d) todo.push(...d.ins);
    }
    return S;
  }
  function pick(b) {
    sel = b;
    traced = trace ? fanIn(b) : new Set();
    side = 'insp';
    tabs();
    panel();
    paint();
  }
  function inspector(st) {
    const pr = box.querySelector('.sd'),
      s = sheets().find(x => x.id === cur);
    pr.textContent = '';
    if (!sel) {
      pr.append(E('p', '', 'Press a block on the sheet.'));
      return;
    }
    const b = sel,
      x = b.g0[3];
    pr.append(E('h4', '', LONG[b.t] || b.t));
    if (b.t === 'CMP')
      pr.append(
        E('p', '', Array.isArray(x) ? 'Set point: ' + spText(x) : 'Set point: variable, from the table of the sheet')
      );
    if (typeof x === 'string') pr.append(E('p', '', 'Time: ' + x));
    pr.append(E('h4', '', 'Inputs'));
    for (const n of b.g0[1]) pr.append(E('p', '', netName(s, n) + ' = ' + fmtV(st.v[n])));
    if (b.t === 'FF' || b.t === 'WO') {
      pr.append(E('h4', '', b.t === 'FF' ? 'Reset' : 'Wipe'));
      for (const n of x) pr.append(E('p', '', netName(s, n) + ' = ' + fmtV(st.v[n])));
    }
    pr.append(E('h4', '', 'Output'), E('p', '', fmtV(st.v[b.out])));
  }
  const spText = x => (x[0] ? 'ON ≥ ' : 'ON ≤ ') + x[1] + ', OFF ' + (x[0] ? '≤ ' : '≥ ') + x[2] + ' ' + x[3];
  function panel() {
    const pr = box.querySelector('.sd'),
      s = sheets().find(x => x.id === cur);
    pr.textContent = '';
    pr.style.display = side ? '' : 'none';
    if (side !== 'ins' || !s) return;
    for (const i of s.i) {
      const r = E('div', 'ir');
      r.append(E('span', '', i[1] || 'Input ' + i[0]));
      for (const [v, l] of [
        ['', 'Auto'],
        ['1', '1'],
        ['0', '0']
      ]) {
        const b = E('button', '', l);
        b.dataset.n = i[0];
        b.dataset.v = v;
        b.onclick = () => {
          const q = AN.turbine('fault', { id: cur, net: i[0], on: v === '' ? null : v === '1' });
          if (q) alert(q);
          paint();
        };
        r.append(b);
      }
      pr.append(r);
    }
  }
  function sheet() {
    const sv = box.querySelector('.sv'),
      s = sheets().find(x => x.id === cur);
    box.querySelector('.ttl').textContent =
      'TCS · ' + cur + (s && s.t ? ' ' + s.t : '') + (s ? ' · sheet ' + s.sh + ' of 99' : '');
    sv.textContent = '';
    live = [];
    vals = [];
    sel = null;
    traced = new Set();
    if (!s) return;
    const g = document.createElementNS(NS, 'svg');
    const add = (n, a, t) => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      if (t != null) e.textContent = t;
      g.append(e);
      return e;
    };
    /* blocks where the IBD has them; a block's left edge takes its pins, its right edge gives the output */
    blocks = s.g.map(g0 => {
      const [t, ins, out, x, gx, gy, gw, gh] = g0,
        not = t === 'NOT',
        w = not ? 11 : Math.max(gw || 28, 24),
        h = not ? 11 : Math.max(gh || 16, 14);
      return {
        t,
        ins: ins.concat(t === 'FF' || t === 'WO' ? x : []),
        out,
        x: not ? gx - 5.5 : gx,
        y: not ? Y(gy) - 5.5 : Y(gy) - h,
        w,
        h,
        g0
      };
    });
    const src = new Map();
    for (const b of blocks) if (b.out >= 0) src.set(b.out, [b.x + b.w, b.y + b.h / 2]);
    const labels = new Map(s.x.filter(x => x[3]).map(x => [x[0], 'from ' + x[2]]));
    for (const i of s.i) if (!src.has(i[0]) && i[2] != null) src.set(i[0], [i[2], Y(i[3])]);
    for (const x of s.x) if (x[3] && !src.has(x[0]) && x[4] != null) src.set(x[0], [x[4] + 12, Y(x[5])]);
    /* the wires into one block: pins in the order of their sources, channels so that they do not cross */
    const route = (dx, pins, nets) => {
      const L = nets.map((n, k) => ({ n, s: src.get(n), p: pins[k] })).filter(q => q.s);
      L.sort((a, b) => a.s[1] - b.s[1]);
      L.forEach((q, k) => (q.p = pins[k]));
      const down = L.filter(q => q.s[1] < q.p),
        up = L.filter(q => q.s[1] >= q.p).reverse();
      const lane = (arr, base) =>
        arr.forEach((q, k) => {
          const back = q.s[0] > dx - 6,
            c = dx - 7 - base - k * 4;
          const d = back
            ? 'M' + q.s[0] + ' ' + q.s[1] + 'h7V' + (q.p + 16 + k * 4) + 'H' + c + 'V' + q.p + 'H' + dx
            : 'M' + q.s[0] + ' ' + q.s[1] + 'H' + c + 'V' + q.p + 'H' + dx;
          live.push([add('path', { d, fill: 'none', stroke: '#7d8a96', 'stroke-width': 0.9 }), q.n]);
        });
      lane(down, 0);
      lane(up, down.length * 4);
    };
    for (const b of blocks) {
      const nn = b.ins,
        pins = nn.map((_, k) => b.y + (b.h * (k + 1)) / (nn.length + 1));
      route(b.x, pins, nn);
    }
    const outs = s.x.filter(x => !x[3] && x[4] != null);
    for (const o of outs) route(o[4] - 11, [Y(o[5])], [o[0]]);
    for (const b of blocks) {
      let e;
      if (b.t === 'NOT')
        e = add('circle', {
          cx: b.x + 5.5,
          cy: b.y + 5.5,
          r: 5.5,
          fill: '#fff',
          stroke: '#1b2530',
          'stroke-width': 0.8,
          style: 'cursor:pointer'
        });
      else {
        e = add('rect', {
          x: b.x,
          y: b.y,
          width: b.w,
          height: b.h,
          fill: '#fff',
          stroke: '#1b2530',
          'stroke-width': 0.8,
          style: 'cursor:pointer'
        });
        add(
          'text',
          {
            x: b.x + b.w / 2,
            y: b.y + Math.min(b.h / 2 + 3.5, 13),
            'text-anchor': 'middle',
            'font-size': FS,
            fill: '#14191d',
            'pointer-events': 'none'
          },
          NAME[b.t] || b.t
        );
        const x = b.g0[3];
        const sub = b.t === 'CMP' ? (Array.isArray(x) ? spText(x) : 'variable') : typeof x === 'string' ? x : '';
        if (sub)
          add(
            'text',
            { x: b.x + b.w / 2, y: b.y + b.h + 9, 'text-anchor': 'middle', 'font-size': 8, fill: '#3a4650' },
            sub
          );
      }
      e.onclick = () => pick(b);
    }
    for (const i of s.i) {
      if (i[2] == null) continue;
      const lab = i[1] + (labels.has(i[0]) ? ' (' + labels.get(i[0]) + ')' : ''),
        L = wrap(lab, 44);
      L.forEach((l, k) =>
        add(
          'text',
          {
            x: i[2] - 3,
            y: Y(i[3]) + 3 + (k - (L.length - 1) / 2) * 10,
            'text-anchor': 'end',
            'font-size': FS - 1,
            fill: '#14191d'
          },
          l
        )
      );
      vals.push([add('text', { x: i[2] + 3, y: Y(i[3]) - 3, 'font-size': 8, fill: '#3a4650' }, ''), i[0]]);
    }
    for (const o of outs) {
      add('circle', { cx: o[4], cy: Y(o[5]), r: 10, fill: '#fff', stroke: '#1b2530', 'stroke-width': 0.8 });
      add('text', { x: o[4], y: Y(o[5]) + 3, 'text-anchor': 'middle', 'font-size': FS - 1, fill: '#14191d' }, o[1]);
      add('text', { x: o[4], y: Y(o[5]) + 20, 'text-anchor': 'middle', 'font-size': 8, fill: '#3a4650' }, 'to ' + o[2]);
    }
    sv.append(g);
    const bb = g.getBBox();
    g.setAttribute('viewBox', [bb.x - 8, bb.y - 8, bb.width + 16, bb.height + 16].join(' '));
    panel();
    paint();
  }
  function nav() {
    const n = box.querySelector('nav');
    n.textContent = '';
    for (const s of sheets()) {
      const b = E('button', s.id === cur ? 'on' : '');
      b.append(E('b', '', s.id));
      if (s.t) b.append(s.t);
      b.onclick = () => {
        cur = s.id;
        nav();
        sheet();
      };
      n.append(b);
    }
  }
  function tabs() {
    const q = box.querySelectorAll('.hd .x');
    q[0].classList.toggle('on', showV);
    q[1].classList.toggle('on', trace);
    q[2].classList.toggle('on', side === 'insp');
    q[3].classList.toggle('on', side === 'ins');
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    box.style.display = 'none';
    clearInterval(tm);
    railOn(false);
  }
  /* the button of the rail stays lit while the page is open */
  const railOn = on => {
    const b = [...document.querySelectorAll('#crrail button, #gsbar .tabs button')].find(
      x => x.textContent.trim() === 'TCS'
    );
    if (b) b.classList.toggle('on', on);
  };
  function open() {
    if (!box) {
      const st = E('style');
      st.textContent = css;
      document.head.append(st);
      box = E('div');
      box.id = 'tcsl';
      const sec = E('section'),
        hd = E('div', 'hd'),
        bd = E('div', 'bd');
      const tb = (l, f) => {
        const b = E('button', 'x', l);
        b.onclick = () => {
          f();
          tabs();
          panel();
          paint();
        };
        return b;
      };
      hd.append(
        E('b', 'ttl'),
        tb('Values', () => (showV = !showV)),
        tb('Trace', () => {
          trace = !trace;
          traced = trace && sel ? fanIn(sel) : new Set();
        }),
        tb('Inspector', () => (side = side === 'insp' ? '' : 'insp')),
        tb('Inputs', () => (side = side === 'ins' ? '' : 'ins'))
      );
      bd.append(E('div', 'sv'), E('div', 'sd'));
      sec.append(hd, bd);
      box.append(E('nav'), sec);
      document.body.append(box);
      /* another page of the rail closes this one */
      document.addEventListener(
        'click',
        e => {
          const b = e.target.closest && e.target.closest('#crrail button, #gsbar .tabs button');
          if (b && b.textContent.trim() !== 'TCS') close();
        },
        true
      );
    }
    box.hidden = false;
    box.style.display = 'flex';
    railOn(true);
    tabs();
    nav();
    sheet();
    clearInterval(tm);
    tm = setInterval(paint, 1000);
  }
  window.LS_TCSL = { open, close };
})();
