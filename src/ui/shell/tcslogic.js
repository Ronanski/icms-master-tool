/* 3.2.1 plan c2: the logic of the TCS Interlock Block Diagram 310SC90-794 rev 2 as simulated sheets. Drawn from the netlist with the app's own
   layout (inputs left, gates by depth, outputs right); the lines of the drawing are not in the app. The gates run in the engine
   (src/analog/engine/tcs-trip.js). A wire at 1 is red. Each input can be held at 1 or 0 from the list, as a DITL input. Logic page, Turbine IBD. */
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
    OR: 'OR',
    NOT: 'NOT',
    '2/3': '2 of 3',
    WO: 'Wipe-out',
    FF: 'Memory',
    MID: 'Median',
    CMP: 'Compare',
    DI: 'Delay on',
    DT: 'Delay off',
    PO: 'One shot',
    FG: 'Function',
    LS: 'Low select',
    FLK: 'Flicker'
  };
  const CW = 190,
    CH = 62,
    BW = 92,
    BH = 40,
    LW = 170;
  let cur = 'TA-9',
    box = null,
    tm = 0,
    live = [];
  const css = `#tcsl{position:fixed;inset:48px 0 0 0;z-index:60;display:flex;background:var(--panel,#1b2530);color:var(--tx,#edf3f8);font:14px Inter,system-ui,sans-serif}
#tcsl nav{width:250px;overflow:auto;border-right:1px solid var(--line,#34475a);padding:8px;flex:none}
#tcsl nav button{display:block;width:100%;text-align:left;background:none;border:0;border-radius:6px;color:inherit;padding:6px 8px;font:inherit;cursor:pointer}
#tcsl nav button.on{background:var(--panel2,#233140);font-weight:600}
#tcsl section{flex:1;display:flex;flex-direction:column;min-width:0}
#tcsl .hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px}
#tcsl .x{background:none;border:1px solid var(--line,#34475a);border-radius:6px;color:inherit;padding:4px 10px;cursor:pointer}
#tcsl .bd{flex:1;display:flex;min-height:0}
#tcsl .sv{flex:1;min-width:0;background:#f4f5f6;overflow:auto}#tcsl svg{display:block}
#tcsl .in{width:260px;flex:none;overflow:auto;border-left:1px solid var(--line,#34475a);padding:8px}
#tcsl .ir{display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line,#34475a)}
#tcsl .ir span{flex:1;font-size:13px;min-width:0;overflow-wrap:anywhere}
#tcsl .ir button{background:var(--in,#141c25);color:inherit;border:1px solid var(--line,#34475a);border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit}
#tcsl .ir button.on{border-color:#d32020;color:#ff8d8d}
@media (max-width:1100px){#tcsl nav{width:150px}#tcsl .in{width:190px}}`;
  const sheets = () => (AN.tcsIbdSheets ? AN.tcsIbdSheets() : []);
  function paint() {
    if (!box || box.hidden) return;
    const st = AN.tcsIbd ? AN.tcsIbd(cur) : null;
    if (!st) return;
    for (const [p, n] of live) p.setAttribute('stroke', st.v[n] > 0.5 ? '#d32020' : '#8a97a3');
    for (const b of box.querySelectorAll('.in button')) {
      const f = st.fx[cur + ':' + b.dataset.n];
      b.classList.toggle('on', b.dataset.v === '1' ? f === 1 : b.dataset.v === '0' ? f === 0 : f == null);
    }
  }
  /* depth of each gate: one more than the deepest gate that feeds it; a loop of a latch stops at itself */
  function depths(s) {
    const by = new Map();
    s.g.forEach((g, i) => by.set(g[2], i));
    const d = new Array(s.g.length).fill(-1),
      busy = new Set();
    const pins = g => g[1].concat(g[0] === 'FF' || g[0] === 'WO' ? g[3] : []);
    const of = i => {
      if (d[i] >= 0) return d[i];
      if (busy.has(i)) return 0;
      busy.add(i);
      let m = 0;
      for (const n of pins(s.g[i])) if (by.has(n)) m = Math.max(m, of(by.get(n)) + 1);
      busy.delete(i);
      return (d[i] = m);
    };
    s.g.forEach((_, i) => of(i));
    return { d, pins };
  }
  function sheet() {
    const sv = box.querySelector('.sv'),
      pr = box.querySelector('.in'),
      s = sheets().find(x => x.id === cur);
    box.querySelector('.ttl').textContent = cur + (s && s.t ? ' · ' + s.t : '');
    sv.textContent = '';
    pr.textContent = '';
    live = [];
    if (!s) return;
    const { d, pins } = depths(s);
    const cols = Math.max(0, ...d) + 1;
    const inputs = s.i.map(i => ({ net: i[0], name: i[1] }));
    for (const x of s.x)
      if (x[3] && !inputs.some(i => i.net === x[0])) inputs.push({ net: x[0], name: 'From ' + x[2] + ' link ' + x[1] });
    const outs = s.x.filter(x => !x[3]).map(x => ({ net: x[0], name: 'To ' + x[2] + ' link ' + x[1] }));
    const pos = new Map(); /* net -> where it leaves */
    inputs.forEach((p, i) => pos.set(p.net, [LW + 8, 26 + i * CH]));
    const rows = new Array(cols).fill(0);
    const G = s.g.map((g, i) => {
      const c = d[i],
        y = 10 + rows[c]++ * CH,
        x = LW + 40 + c * CW;
      return { g, x, y };
    });
    for (const q of G) if (q.g[2] >= 0) pos.set(q.g[2], [q.x + BW, q.y + BH / 2]);
    const W = LW + 60 + cols * CW + LW,
      Hh = Math.max(inputs.length * CH, Math.max(...rows, 1) * CH, outs.length * CH) + 30;
    const g = document.createElementNS(NS, 'svg');
    g.setAttribute('width', W);
    g.setAttribute('height', Hh);
    const add = (n, a, t) => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      if (t != null) e.textContent = t;
      g.append(e);
      return e;
    };
    const wire = (n, x2, y2, k) => {
      const a = pos.get(n);
      if (!a) return;
      const mx = x2 - 14 - (k % 5) * 5;
      live.push([
        add('path', {
          d: 'M' + a[0] + ' ' + a[1] + 'H' + mx + 'V' + y2 + 'H' + x2,
          fill: 'none',
          stroke: '#8a97a3',
          'stroke-width': 1.4
        }),
        n
      ]);
    };
    const short = t => (t.length > 34 ? t.slice(0, 33) + '…' : t);
    inputs.forEach((p, i) =>
      add(
        'text',
        { x: LW, y: 30 + i * CH, 'text-anchor': 'end', 'font-size': 11, fill: '#14191d' },
        short(p.name || 'Input ' + p.net)
      )
    );
    G.forEach((q, i) => {
      const P = pins(q.g);
      P.forEach((n, k) => wire(n, q.x, q.y + (BH * (k + 1)) / (P.length + 1), i + k));
      add('rect', { x: q.x, y: q.y, width: BW, height: BH, rx: 4, fill: '#fff', stroke: '#1b2530' });
      add(
        'text',
        {
          x: q.x + BW / 2,
          y: q.y + (typeof q.g[3] === 'string' ? 17 : 24),
          'text-anchor': 'middle',
          'font-size': 12,
          fill: '#14191d'
        },
        NAME[q.g[0]] || q.g[0]
      );
      if (typeof q.g[3] === 'string')
        add(
          'text',
          { x: q.x + BW / 2, y: q.y + 32, 'text-anchor': 'middle', 'font-size': 11, fill: '#14191d' },
          q.g[3]
        );
    });
    const ox = LW + 40 + cols * CW;
    outs.forEach((o, i) => {
      const y = 26 + i * CH;
      wire(o.net, ox, y, i);
      add('text', { x: ox + 6, y: y + 4, 'font-size': 11, fill: '#14191d' }, short(o.name));
    });
    sv.append(g);
    for (const p of inputs) {
      const r = E('div', 'ir');
      r.append(E('span', '', p.name || 'Input ' + p.net));
      for (const [v, l] of [
        ['', 'Auto'],
        ['1', '1'],
        ['0', '0']
      ]) {
        const b = E('button', '', l);
        b.dataset.n = p.net;
        b.dataset.v = v;
        b.onclick = () => {
          const q = AN.turbine('fault', { id: cur, net: p.net, on: v === '' ? null : v === '1' });
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
        x = E('button', 'x', 'Close');
      x.onclick = () => {
        box.hidden = true;
        box.style.display = 'none';
        clearInterval(tm);
      };
      hd.append(E('b', 'ttl'), x);
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
