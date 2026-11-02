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
  /* 3.2.0-beta.6 (user 2026-10-22 "AYAW KO NG PUTI"): the dark drawing is the default again (a new key, so the 3.0.0 light
     paper default does not carry over once) */
  /* UI overhaul 2026-11-02: one look, the drawing colour picker is removed; the drawing is always the default dark colours */
  let dg = applyDg('std');
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
    if (!ui || document.getElementById('dgtsel')) return;
    /* UI overhaul 2026-11-02: the "UI: Slate" skin is removed (one look) */
    root.removeAttribute('data-ui');
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
    ui.after(ts);
  }
  build();
  if (!document.getElementById('dgtsel')) document.addEventListener('DOMContentLoaded', build);
})();
