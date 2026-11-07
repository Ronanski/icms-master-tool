/* 3.2.1 plan c2: the TCS Interlock Block Diagram 310SC90-794 rev 2 as simulated logic sheets. The drawing is the IBD's own lines and words
   (tools/data/ibd_build.mjs, window.LS_TCSL_DATA); the gates run in the engine (src/analog/engine/tcs-trip.js). A wire at 1 is red. Each input
   of a sheet can be held at 1 or 0 from the list, as a DITL input. Opens from the Logic page, button Turbine IBD. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  let D = null,
    cur = 'TA-9',
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
#tcsl .sv{flex:1;min-width:0;background:#f4f5f6;overflow:auto}#tcsl svg{width:100%;height:100%;display:block}
#tcsl .in{width:260px;flex:none;overflow:auto;border-left:1px solid var(--line,#34475a);padding:8px}
#tcsl .ir{display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line,#34475a)}
#tcsl .ir span{flex:1;font-size:13px;min-width:0;overflow-wrap:anywhere}
#tcsl .ir button{background:var(--in,#141c25);color:inherit;border:1px solid var(--line,#34475a);border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit}
#tcsl .ir button.on{border-color:#d32020;color:#ff8d8d}
@media (max-width:1100px){#tcsl nav{width:150px}#tcsl .in{width:190px}}`;
  async function load() {
    if (D) return D;
    const bin = Uint8Array.from(atob(window.LS_TCSL_DATA), c => c.charCodeAt(0));
    D = JSON.parse(await gunz(bin));
    return D;
  }
  const meta = id => (typeof AN.tcsIbdSheets === 'function' ? AN.tcsIbdSheets().find(s => s.id === id) : null);
  function paint() {
    if (!box || box.hidden) return;
    const st = AN.tcsIbd ? AN.tcsIbd(cur) : null;
    if (!st) return;
    for (const [p, n] of live) p.setAttribute('stroke', st.v[n] > 0.5 ? '#d32020' : 'none');
    const pr = box.querySelector('.in');
    for (const b of pr.querySelectorAll('button')) {
      const k = cur + ':' + b.dataset.n,
        f = st.fx[k];
      b.classList.toggle('on', b.dataset.v === '1' ? f === 1 : b.dataset.v === '0' ? f === 0 : f == null);
    }
  }
  function sheet() {
    const sv = box.querySelector('.sv'),
      pr = box.querySelector('.in'),
      s = D.find(x => x.id === cur),
      m = meta(cur);
    box.querySelector('.ttl').textContent = cur + (m && m.t ? ' · ' + m.t : '');
    sv.textContent = '';
    pr.textContent = '';
    const g = document.createElementNS(NS, 'svg');
    g.setAttribute('viewBox', '0 0 1191 842');
    const add = (n, a) => {
      const e = document.createElementNS(NS, n);
      for (const k in a) e.setAttribute(k, a[k]);
      g.append(e);
      return e;
    };
    add('path', { d: s.d, fill: 'none', stroke: '#1b2530', 'stroke-width': 0.6 });
    live = [];
    for (const n in s.w) live.push([add('path', { d: s.w[n], fill: 'none', stroke: 'none', 'stroke-width': 1.8 }), +n]);
    for (const [x, tx, ty, h, a] of s.t) {
      const e = add('text', {
        x: tx,
        y: ty,
        'font-size': h * 0.82,
        fill: '#14191d',
        transform: a ? 'rotate(' + -a + ' ' + tx + ' ' + ty + ')' : ''
      });
      e.textContent = x;
    }
    sv.append(g);
    for (const [net, name] of (m && m.i) || []) {
      const r = E('div', 'ir');
      r.append(E('span', '', name || 'Input ' + net));
      for (const [v, l] of [
        ['', 'Auto'],
        ['1', '1'],
        ['0', '0']
      ]) {
        const b = E('button', '', l);
        b.dataset.n = net;
        b.dataset.v = v;
        b.onclick = () => {
          const q = AN.turbine('fault', { id: cur, net, on: v === '' ? null : v === '1' });
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
    for (const s of D) {
      const m = meta(s.id),
        b = E('button', s.id === cur ? 'on' : '', s.id + (m && m.t ? ' ' + m.t : ''));
      b.onclick = () => {
        cur = s.id;
        nav();
        sheet();
      };
      n.append(b);
    }
  }
  async function open() {
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
    await load();
    nav();
    sheet();
    clearInterval(tm);
    tm = setInterval(paint, 1000);
  }
  window.LS_TCSL = { open };
})();
