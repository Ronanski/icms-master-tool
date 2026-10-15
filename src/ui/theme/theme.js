/* Diagram + UI theme selectors (colours only). Remembers the choice. */
(function () {
  const DG = [
      ['std', 'Standard'],
      ['calm', 'Calm'],
      ['clarity', 'Clarity'],
      ['paper', 'Paper']
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
  let dg = applyDg(get('ditl.dg') || 'std');
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
      set('ditl.dg', dg);
    };
    ui.after(sel);
  }
  build();
  if (!document.getElementById('dgsel')) document.addEventListener('DOMContentLoaded', build);
})();
