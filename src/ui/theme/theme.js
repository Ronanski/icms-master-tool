/* Diagram + UI theme selectors (colours only). Remembers the choice. */
(function () {
  const DG = [
      ['paper', 'Light paper'],
      ['std', 'Dark'],
      ['calm', 'Dark calm'],
      ['clarity', 'Dark clarity']
    ],
    UI2 = [['slate', 'Slate']];
  const get = k => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set = (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    };
  const root = document.documentElement;
  function applyDg(v) {
    if (!DG.some(x => x[0] === v)) v = 'std';
    if (v === 'std') root.removeAttribute('data-dg');
    else root.setAttribute('data-dg', v);
    return v;
  }
  /* 3.0.0: light paper is the new default (a new key, so the old dark choice does not carry over once) */
  let dg = applyDg(get('ditl.dg3') || 'paper');
  /* text of the drawing: 100 / 125 / 150 % (each label grows from its own anchor; positions, wires and blocks do not move) */
  const DT = ['100', '125', '150'];
  const applyDt = v => {
    if (!DT.includes(v)) v = '100';
    root.setAttribute('data-dgt', v);
    return v;
  };
  let dt = applyDt(get('ditl.dgt') || '100');
  function build() {
    const ui = document.getElementById('uisel');
    if (!ui || document.getElementById('dgsel')) return;
    UI2.forEach(([k, n]) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = 'UI: ' + n;
      ui.append(o);
    });
    const u = get('ditl.ui');
    if (u && UI2.some(x => x[0] === u)) {
      root.setAttribute('data-ui', u);
      ui.value = u;
    }
    const sel = document.createElement('select');
    sel.id = 'dgsel';
    sel.title = 'Colours of the diagram';
    DG.forEach(([k, n]) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = 'Diagram: ' + n;
      sel.append(o);
    });
    sel.value = dg;
    sel.onchange = () => {
      dg = applyDg(sel.value);
      set('ditl.dg3', dg);
    };
    ui.after(sel);
    const ts = document.createElement('select');
    ts.id = 'dgtsel';
    ts.title = 'Size of the text on the drawing';
    DT.forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = 'Drawing text: ' + k + ' %';
      ts.append(o);
    });
    ts.value = dt;
    ts.onchange = () => {
      dt = applyDt(ts.value);
      set('ditl.dgt', dt);
    };
    sel.after(ts);
  }
  build();
  if (!document.getElementById('dgsel')) document.addEventListener('DOMContentLoaded', build);
})();
