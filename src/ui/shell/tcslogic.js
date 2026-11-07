/* 3.2.1 plan c2: the logic of the TCS Interlock Block Diagram 310SC90-794 rev 2 as simulated sheets. Each block stands where the IBD has it, so a
   sheet reads in the IBD's order, top to bottom; the wires are routed here, the lines of the drawing are not in the app. The gates run in the
   engine (src/analog/engine/tcs-trip.js). A wire at 1 is red. The Inputs list holds an input at 1 or 0. Logic page, button Turbine IBD. */
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
    OR: 'OR'
  };
  const FS = 10;
  let cur = 'TA-9',
    box = null,
    tm = 0,
    live = [],
    showIn = false;
  const css = `#tcsl{position:fixed;left:var(--railW,4rem);top:0;right:0;bottom:0;z-index:120;display:flex;background:var(--panel,#1b2530);color:var(--tx,#edf3f8);font:14px Inter,system-ui,sans-serif}
#tcsl nav{width:17rem;overflow:auto;border-right:1px solid var(--line,#34475a);padding:.5rem;flex:none}
#tcsl nav button{display:block!important;width:100%!important;height:auto!important;min-height:0!important;white-space:normal!important;text-align:left!important;overflow:visible!important;text-overflow:clip!important;background:none;border:0;border-radius:6px;color:inherit;padding:.375rem .5rem;font:inherit;line-height:1.3;cursor:pointer}
#tcsl nav button.on{background:var(--panel2,#233140);font-weight:600}
#tcsl section{flex:1;display:flex;flex-direction:column;min-width:0}
#tcsl .hd{display:flex;align-items:center;gap:.75rem;padding:.5rem 1rem}
#tcsl .hd b{flex:1;min-width:0}
#tcsl .x{background:none;border:1px solid var(--line,#34475a);border-radius:6px;color:inherit;padding:.25rem .625rem;cursor:pointer}
#tcsl .x.on{background:var(--panel2,#233140)}
#tcsl .bd{flex:1;display:flex;min-height:0}
#tcsl .sv{flex:1;min-width:0;background:#f4f5f6}#tcsl svg{display:block;width:100%;height:100%}
#tcsl .in{width:18rem;flex:none;overflow:auto;border-left:1px solid var(--line,#34475a);padding:.5rem}
#tcsl .ir{display:flex;gap:.375rem;align-items:center;padding:.25rem 0;border-bottom:1px solid var(--line,#34475a)}
#tcsl .ir span{flex:1;font-size:13px;min-width:0;overflow-wrap:anywhere}
#tcsl .ir button{background:var(--in,#141c25);color:inherit;border:1px solid var(--line,#34475a);border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit}
#tcsl .ir button.on{border-color:#d32020;color:#ff8d8d}
@media (max-width:1100px){#tcsl nav{width:10rem}#tcsl .in{width:13rem}}`;
  const sheets = () => (AN.tcsIbdSheets ? AN.tcsIbdSheets() : []);
  const Y = y => 842 - y;
  function paint() {
    if (!box || box.hidden) return;
    const st = AN.tcsIbd ? AN.tcsIbd(cur) : null;
    if (!st) return;
    for (const [p, n] of live) {
      const on = st.v[n] > 0.5;
      p.setAttribute('stroke', on ? '#d32020' : '#7d8a96');
      p.setAttribute('stroke-width', on ? 1.6 : 0.9);
    }
    for (const b of box.querySelectorAll('.in button')) {
      const f = st.fx[cur + ':' + b.dataset.n];
      b.classList.toggle('on', b.dataset.v === '1' ? f === 1 : b.dataset.v === '0' ? f === 0 : f == null);
    }
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
  function sheet() {
    const sv = box.querySelector('.sv'),
      pr = box.querySelector('.in'),
      s = sheets().find(x => x.id === cur);
    box.querySelector('.ttl').textContent =
      'Turbine IBD · ' + cur + (s && s.t ? ' ' + s.t : '') + (s ? ' · sheet ' + s.sh + ' of 99' : '');
    sv.textContent = '';
    pr.textContent = '';
    pr.style.display = showIn ? '' : 'none';
    live = [];
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
    const blocks = s.g.map(g0 => {
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
      if (b.t === 'NOT') {
        add('circle', { cx: b.x + 5.5, cy: b.y + 5.5, r: 5.5, fill: '#fff', stroke: '#1b2530', 'stroke-width': 0.8 });
        continue;
      }
      add('rect', { x: b.x, y: b.y, width: b.w, height: b.h, fill: '#fff', stroke: '#1b2530', 'stroke-width': 0.8 });
      add(
        'text',
        {
          x: b.x + b.w / 2,
          y: b.y + Math.min(b.h / 2 + 3.5, 13),
          'text-anchor': 'middle',
          'font-size': FS,
          fill: '#14191d'
        },
        NAME[b.t] || b.t
      );
      const x = b.g0[3];
      const sub =
        b.t === 'CMP'
          ? Array.isArray(x)
            ? (x[0] ? 'ON ≥ ' : 'ON ≤ ') + x[1] + ', OFF ' + (x[0] ? '≤ ' : '≥ ') + x[2] + ' ' + x[3]
            : 'variable'
          : typeof x === 'string'
            ? x
            : '';
      if (sub)
        add(
          'text',
          { x: b.x + b.w / 2, y: b.y + b.h + 9, 'text-anchor': 'middle', 'font-size': 8, fill: '#3a4650' },
          sub
        );
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
    }
    for (const o of outs) {
      add('circle', { cx: o[4], cy: Y(o[5]), r: 10, fill: '#fff', stroke: '#1b2530', 'stroke-width': 0.8 });
      add('text', { x: o[4], y: Y(o[5]) + 3, 'text-anchor': 'middle', 'font-size': FS - 1, fill: '#14191d' }, o[1]);
      add('text', { x: o[4], y: Y(o[5]) + 20, 'text-anchor': 'middle', 'font-size': 8, fill: '#3a4650' }, 'to ' + o[2]);
    }
    sv.append(g);
    const bb = g.getBBox();
    g.setAttribute('viewBox', [bb.x - 8, bb.y - 8, bb.width + 16, bb.height + 16].join(' '));
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
    paint();
  }
  function nav() {
    const n = box.querySelector('nav');
    n.textContent = '';
    for (const s of sheets()) {
      const b = E('button', s.id === cur ? 'on' : '', s.id + (s.t ? ' ' + s.t : ''));
      b.onclick = () => {
        cur = s.id;
        nav();
        sheet();
      };
      n.append(b);
    }
  }
  function open() {
    if (!box) {
      const st = E('style');
      st.textContent = css;
      document.head.append(st);
      box = E('div');
      box.id = 'tcsl';
      const sec = E('section'),
        hd = E('div', 'hd'),
        bd = E('div', 'bd'),
        x = E('button', 'x', 'Close'),
        inb = E('button', 'x', 'Inputs');
      x.onclick = () => {
        box.hidden = true;
        box.style.display = 'none';
        clearInterval(tm);
      };
      inb.onclick = () => {
        showIn = !showIn;
        inb.classList.toggle('on', showIn);
        sheet();
      };
      hd.append(E('b', 'ttl'), inb, x);
      bd.append(E('div', 'sv'), E('div', 'in'));
      sec.append(hd, bd);
      box.append(E('nav'), sec);
      document.body.append(box);
    }
    box.hidden = false;
    box.style.display = 'flex';
    nav();
    sheet();
    clearInterval(tm);
    tm = setInterval(paint, 1000);
  }
  window.LS_TCSL = { open };
})();
