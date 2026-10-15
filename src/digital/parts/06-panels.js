/* DITL (digital logic) - Side panels (TP / cell tables). Part of ONE script (joined by src/digital/order.list, in this order). */
function buildTP() {
  const p = $('tp'),
    T = tmList(),
    s0 = cur(),
    MV = (s0 && s0.nl && s0.nl.mv) || [];
  const MT0 = (s0 && s0.nl && s0.nl.mot) || [],
    AN = (s0 && s0.nl && s0.nl.an) || [];
  p.hidden = !T.length && !MV.length && !MT0.length && !AN.length;
  if (p.hidden) return;
  p.innerHTML = '';
  const h = document.createElement('div');
  h.innerHTML =
    '<b>' +
    (T.length
      ? 'Timers'
      : MV.length && MV[0].sv
        ? 'Solenoid'
        : MV.length
          ? 'MOV'
          : MT0.length
            ? 'Motor'
            : 'Analog inputs') +
    '</b> ';
  p.appendChild(h);
  const mb = document.createElement('button');
  mb.textContent = TPMIN ? '▲' : '▼';
  mb.title = TPMIN ? 'Show panel' : 'Hide panel';
  mb.style.cssText = 'float:right;padding:0 6px';
  mb.onclick = () => {
    TPMIN = !TPMIN;
    buildTP();
  };
  h.appendChild(mb);
  if (TPMIN) {
    p.style.width = 'auto';
    return;
  }
  p.style.width = '';
  if (SIM) {
    const sp = document.createElement('select');
    [
      [1, 'Speed 1x (real time)'],
      [10, 'Speed 10x'],
      [60, 'Speed 60x'],
      [300, 'Speed 300x']
    ].forEach(([v, t]) => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = t;
      sp.appendChild(o);
    });
    sp.value = TSP;
    sp.onchange = e => {
      TSP = +e.target.value;
    };
    h.appendChild(sp);
  }
  T.forEach((g, i) => {
    const d = document.createElement('div'),
      pr = tmGet(g.tm),
      a = document.createElement('span'),
      n = document.createElement('input'),
      u = document.createElement('select'),
      v = document.createElement('div');
    d.className = 'r';
    a.textContent = (g.tm.tag ? g.tm.tag + ' · ' : '') + KN[g.k];
    a.style.minWidth = '110px';
    n.type = 'number';
    n.min = 0;
    n.step = 'any';
    n.value = pr.v;
    Object.keys(UN).forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = k === 'SEC' ? 'sec' : k === 'MIN' ? 'min' : k === 'HR' ? 'hr' : 'ms';
      u.appendChild(o);
    });
    u.value = pr.u;
    const ch = () => {
      const x = parseFloat(n.value);
      if (!(x >= 0)) return;
      push();
      tmSet(g.tm, x, u.value);
      {
        const s1 = cur();
        s1.tmo = s1.tmo || {};
        s1.tmo[tmKey(g)] = [x, u.value];
      }
      if (g.tm.pg) {
        const s = cur();
        s.pdur = s.pdur || {};
        s.pdur[g.tm.key] = { v: x, u: u.value };
      }
      g.st = { acc: 0, out: 0, pre: 0, run: 0 };
      render();
    };
    n.onchange = ch;
    u.onchange = ch;
    d.append(a, n, u);
    if (SIM) {
      const b = document.createElement('button');
      b.textContent = 'Skip';
      b.title = 'Finish this timer now';
      b.onclick = () => {
        const s = cur(),
          vv = simulate(s.nl, simIn(s));
        tmStep(
          g,
          g.ins.some(q => vv[q]),
          tmSecs(g.tm) + 1
        );
        render();
      };
      d.appendChild(b);
    }
    v.className = 'v';
    v.id = 'tpv' + i;
    d.appendChild(v);
    p.appendChild(d);
  });
  if (MV.length && T.length) {
    const h2 = document.createElement('div');
    h2.innerHTML = '<b>' + (MV[0].sv ? 'Solenoid' : 'MOV') + '</b>';
    h2.style.marginTop = '6px';
    p.appendChild(h2);
  }
  MV.forEach((b, j) => {
    const d = document.createElement('div'),
      a = document.createElement('span'),
      n = document.createElement('input'),
      v = document.createElement('div');
    d.className = 'r';
    a.textContent =
      (b.sv ? 'SV ' : 'MOV ') + (b.tag || j + 1) + (b.noZS ? ' · coil' : b.sv ? ' · stroke' : ' · travel');
    n.type = 'number';
    n.min = 1;
    n.step = 'any';
    n.value = mvTr(s0, j);
    n.title = 'Full stroke time (sec), 0 to 100 %';
    n.onchange = () => {
      const x = parseFloat(n.value);
      if (!(x > 0)) return;
      push();
      s0.mvt = s0.mvt || {};
      s0.mvt[j] = x;
      render();
    };
    if (b.noZS) d.append(a);
    else d.append(a, n, document.createTextNode('sec'));
    const mil = b.fb.find(f => f.ty === 'MIL');
    if (SIM && mil && mil.mir < 0) {
      const lr = document.createElement('button'),
        r = mvRT(s0)[j];
      lr.textContent = r.lr ? 'REMOTE' : 'LOCAL';
      lr.className = r.lr ? 'on' : '';
      lr.title = 'MIL ' + (mil.adr || '') + ' has no input on this sheet: select LOCAL / REMOTE here';
      lr.onclick = () => {
        r.lr = r.lr ? 0 : 1;
        render();
      };
      d.appendChild(lr);
    }
    v.className = 'v';
    v.id = 'mvs' + j;
    d.appendChild(v);
    p.appendChild(d);
  });
  if (AN.length) {
    const h3 = document.createElement('div');
    h3.innerHTML = '<b>Analog inputs (high / low limits)</b>';
    h3.style.marginTop = '6px';
    p.appendChild(h3);
    AN.forEach(a => {
      const d = document.createElement('div'),
        sp = document.createElement('span'),
        n = document.createElement('input'),
        st = document.createElement('div');
      d.className = 'r';
      sp.textContent = (a.label || a.key).slice(0, 34);
      sp.title = a.label || a.key;
      n.type = 'number';
      n.step = 'any';
      n.value = anVal(s0, a);
      n.title = 'Process value' + (a.unit ? ' (' + a.unit + ')' : '');
      n.onchange = () => {
        const x = parseFloat(n.value);
        if (!isFinite(x)) return;
        push();
        s0.av = s0.av || {};
        s0.av[a.key] = x;
        s0.nl.avk = s0.av;
        render();
      };
      d.append(sp, n, document.createTextNode(a.unit || ''));
      st.className = 'v';
      st.id = 'anst' + AN.indexOf(a);
      p.appendChild(d);
      p.appendChild(st);
    });
  }
  if (MT0.length) {
    const d = document.createElement('div');
    d.className = 'r';
    const a = document.createElement('span'),
      n = document.createElement('input'),
      v = document.createElement('div');
    a.textContent = 'Motor run feedback delay';
    n.type = 'number';
    n.min = 0.1;
    n.step = 'any';
    n.value = mtDelay(s0);
    n.onchange = () => {
      const x = parseFloat(n.value);
      if (!(x > 0)) return;
      push();
      s0.mtd = x;
      render();
    };
    d.append(a, n, document.createTextNode('sec'));
    v.className = 'v';
    v.id = 'motst';
    d.appendChild(v);
    p.appendChild(d);
  }
  updateTP();
  if (s0) mvUI(s0);
}
function updateTP() {
  tmList().forEach((g, i) => {
    const e = $('tpv' + i);
    if (!e) return;
    if (!SIM) {
      e.textContent = '';
      return;
    }
    const P = tmSecs(g.tm),
      f = x => (x >= 60 ? (x / 60).toFixed(1) + ' min' : x.toFixed(1) + ' s');
    e.textContent = `${f(g.st.acc)} / ${f(P)} · OUT ${g.st.out ? '1' : '0'}`;
    e.className = 'v' + (g.st.out ? ' hi' : '');
  });
}
