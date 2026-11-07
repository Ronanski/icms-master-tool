/* 3.2.1 plan c2: the TCS Interlock Block Diagram (310SC90-794 rev 2) as logic sheets of the app. First batch: TA-1 and the trip sheets TA-9
   to TA-22. The sheets are drawn from the trip rows of the engine (src/analog/engine/tcs-trip.js, AN.tcs().trip): each row is field
   signal -> compare -> vote -> OR of TA-9; 1 = red, 0 = green (COMMANDMENT 5). Press a field contact to set or clear it: the engine runs
   it (AN.turbine('fault')), so a sheet can be run as a DITL sheet is. Opens from the Logic page, button TCS IBD. */
(function () {
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const SHEETS = [
    ['TA-1', 'TURBINE MASTER TRIP / MASTER RESET'],
    ['TA-9', 'TRIP LOGIC (1) (TOTAL)'],
    ['TA-10', 'CONDENSER VACUUM VERY LOW TRIP'],
    ['TA-11', 'MAIN STEAM TEMPERATURE VERY LOW TRIP'],
    ['TA-12', 'THRUST BEARING FAILURE TRIP'],
    ['TA-13', 'CONTROL OIL AND BEARING OIL PRESSURE VERY LOW TRIP'],
    ['TA-14', 'EXHAUST HOOD TEMPERATURE AND TRIP OIL PRESSURE TRIP'],
    ['TA-15', 'OVERSPEED AND BACK-UP OVERSPEED TRIP'],
    ['TA-17', 'BEARING VIBRATION VERY HIGH TRIP'],
    ['TA-20', 'HP EXHAUST STEAM TEMPERATURE VERY HIGH TRIP'],
    ['TA-21', 'HP INLET / EXHAUST DIFFERENTIAL PRESSURE TRIP'],
    ['TA-22', 'HP EXHAUST STEAM PRESSURE VERY HIGH TRIP']
  ];
  let cur = 'TA-9',
    box = null,
    tm = 0;
  const css = `#tcsl{position:fixed;inset:48px 0 0 0;z-index:60;display:flex;background:var(--panel,#1b2530);color:var(--tx,#edf3f8);font:14px Inter,system-ui,sans-serif}
#tcsl nav{width:280px;overflow:auto;border-right:1px solid var(--line,#34475a);padding:8px}
#tcsl nav button{display:block;width:100%;text-align:left;background:none;border:0;border-radius:6px;color:inherit;padding:7px 8px;font:inherit;cursor:pointer}
#tcsl nav button.on{background:var(--panel2,#233140);font-weight:600}
#tcsl section{flex:1;display:flex;flex-direction:column;min-width:0}
#tcsl main{flex:1;overflow:auto;padding:12px 16px}
#tcsl h3{margin:0 0 2px;font-size:16px}#tcsl .sub{color:var(--dim,#aebfce);margin-bottom:12px}
#tcsl .flow{display:flex;align-items:stretch;margin:0 0 8px;flex-wrap:wrap}
#tcsl .bk{border:1px solid var(--line,#34475a);border-radius:6px;padding:5px 9px;min-width:92px;display:flex;flex-direction:column;justify-content:center;background:var(--in,#141c25)}
#tcsl .bk small{color:var(--dim,#aebfce)}#tcsl .ar{align-self:center;padding:0 5px;color:var(--dim,#aebfce)}
#tcsl .bk.b1{border-color:#d32020;box-shadow:inset 0 0 0 1px #d32020}#tcsl .bk.b0{border-color:#2e9e5b}
#tcsl button.ct{cursor:pointer;color:inherit;font:inherit;text-align:left}
#tcsl .x{background:none;border:1px solid var(--line,#34475a);border-radius:6px;color:inherit;padding:4px 10px;cursor:pointer}
#tcsl .hd{display:flex;justify-content:flex-end;padding:8px 16px 0}
@media (max-width:900px){#tcsl nav{width:170px}}`;
  const bk = (a, b, on) => {
    const d = E('div', 'bk ' + (on == null ? '' : on ? 'b1' : 'b0'));
    d.append(E('span', '', a));
    if (b) d.append(E('small', '', b));
    return d;
  };
  const ar = () => E('span', 'ar', '→');
  const fmt = (v, u) =>
    v == null || !isFinite(v)
      ? 'no value in the model'
      : (Math.abs(v) < 10 ? (+v).toFixed(2) : (+v).toFixed(0)) + ' ' + u;
  function contact(r) {
    const b = E('button', 'bk ct ' + (r.fault ? 'b1' : 'b0'));
    b.append(
      E('span', '', r.tag || 'Field contact'),
      E('small', '', r.modelled ? fmt(r.pv, r.u) : 'field contact ' + (r.fault ? 'ON' : 'off'))
    );
    b.title = 'Press to set or clear this contact';
    b.onclick = () => {
      const m = AN.turbine('fault', { k: r.k, on: !r.fault });
      if (m) alert(m);
      paint();
    };
    return b;
  }
  function row(r, first) {
    const d = E('div', 'flow');
    d.append(contact(r), ar());
    if (r.lim) d.append(bk('Compare', r.lim, r.on), ar());
    if (r.vote) d.append(bk(r.vote, '', r.on), ar());
    d.append(bk(r.t, 'sheet ' + r.sh + (first === r.t ? ', first out' : ''), r.on));
    return d;
  }
  function paint() {
    if (!box || box.hidden) return;
    const m = box.querySelector('main'),
      tc = window.AN && AN.tcs ? AN.tcs() : null,
      T = tc && tc.trip;
    m.textContent = '';
    m.append(
      E('h3', '', cur + ' · ' + (SHEETS.find(s => s[0] === cur) || [])[1]),
      E('div', 'sub', 'Interlock Block Diagram 310SC90-794 rev 2')
    );
    if (!T) {
      m.append(E('p', '', 'No turbine model: choose Cold or 150 MW in the plant chip.'));
      return;
    }
    const first = T.first;
    if (cur === 'TA-1') {
      const a = E('div', 'flow');
      a.append(
        bk('TURBINE TRIP push button', 'control room or TCS screen', first === 'MANUAL TRIP'),
        ar(),
        bk('TURBINE MASTER TRIP', first ? 'first out: ' + first : 'not tripped', !!first)
      );
      const b = E('div', 'flow');
      b.append(
        bk('TURBINE TRIP COMMAND', 'from TA-9', !!first && first !== 'MANUAL TRIP'),
        ar(),
        bk('TURBINE MASTER TRIP', '', !!first)
      );
      const c = E('div', 'flow');
      c.append(
        bk('TURBINE RESET push button', 'or ATS AUTO RESET COMMAND'),
        ar(),
        bk('TURBINE RESET', 'refused while TA-9 stands')
      );
      m.append(a, b, c);
      return;
    }
    const L = cur === 'TA-9' ? T.rows : T.rows.filter(r => r.sh.split(', ').includes(cur));
    for (const r of L) m.append(row(r, first));
    if (cur === 'TA-9') {
      const d = E('div', 'flow');
      d.append(
        bk('OR of all rows', '', !!first),
        ar(),
        bk('TURBINE TRIP COMMAND', 'to TA-1' + (first ? ', first out: ' + first : ''), !!first)
      );
      m.append(d);
    }
  }
  function nav() {
    const n = box.querySelector('nav');
    n.textContent = '';
    for (const [id, t] of SHEETS) {
      const b = E('button', id === cur ? 'on' : '', id + ' ' + t);
      b.onclick = () => {
        cur = id;
        nav();
        paint();
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
        x = E('button', 'x', 'Close');
      x.onclick = () => {
        box.hidden = true;
        box.style.display = 'none';
        clearInterval(tm);
      };
      hd.append(x);
      sec.append(hd, E('main'));
      box.append(E('nav'), sec);
      document.body.append(box);
    }
    box.hidden = false;
    box.style.display = 'flex';
    nav();
    paint();
    clearInterval(tm);
    tm = setInterval(paint, 1000);
  }
  window.LS_TCSL = { open };
})();
