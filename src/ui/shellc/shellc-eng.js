/* ===== RE-SHELL LAYOUT C, step 4 of 7 (build plan approved by the user 2026-11-09 "G"; mockup C, artifact RNYt8ceyxutMvDyEt2UFnu,
   screens pc1366-09 and pc1366-17): the ENGINEER MODE. Only with ?shell=c (body.sc) and the Logic page (the Engineer button of the strip).
   - a tool rail on the left: Logic side by side, Library, Curves, Loop check, Recent, Sheet tools;
   - Logic side by side: the Plant view page (left) and the logic sheet (right), both live from the one plant; under the sheet
     "Why is it X?" (AN.why, src/ui/shell/why.js) with Open analog sheet, Signal details (the info card, lsInfo) and Force a signal;
   - top right: Logic View | Run (the VIEW / RUN of the band) and Plant model On | Off (the Tools switch #pmbtn);
   - Library (lsLibrary), Curves (lsFx), Loop check (LS_LOOP) open in the right-hand pane.
   Nothing here runs logic of its own: it places the existing pages and presses the existing buttons. One plant, no reset. ===== */
(function () {
  let want = false;
  try {
    want = localStorage.getItem('ls-shell') === 'c';
  } catch (e) {}
  if (!want) return;
  const $ = id => document.getElementById(id);
  const B = document.body;
  const E = (t, cls, txt) => {
    const e = document.createElement(t);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const Bt = (cls, txt, title, on) => {
    const b = E('button', cls, txt);
    b.type = 'button';
    if (title) b.title = title;
    if (on) b.onclick = on;
    return b;
  };
  const call = (f, d) => {
    try {
      return f();
    } catch (e) {
      return d;
    }
  };
  const TOOLS = [
    ['logic', 'Logic side by side', 'The plant page and its logic sheet side by side, with Why is it?'],
    ['lib', 'Library', 'Input and output list, memory list, wiring, relay and sequence of events, calculations'],
    ['fx', 'Curves', 'The linear curves of the analog drawings (function of x): points, chart, what each one does'],
    ['loop', 'Loop check', 'Check one loop step by step: a real press on the plant page against the logic'],
    ['recent', 'Recent', 'Sheets and faceplates you opened'],
    [
      'sheet',
      'Sheet tools',
      'Legend and style, diagnostics, settings file, linear curve tables, drawing health, controller tuning'
    ]
  ];
  let tool = 'logic';
  let on = false,
    els = null;

  /* ---------- the existing pages that must stay beside each other (app.js setTab hides the Plant view on the Logic page, the Library
     and the Plant view close each other): in the Engineer mode their "close" is held, the same way the loop check split does it ---------- */
  const raw = {};
  function wrap() {
    for (const k of ['lsPlant', 'lsLibrary']) {
      const f = window[k];
      if (typeof f !== 'function' || f._sce) continue;
      raw[k] = f;
      const w = function (v) {
        if (on && v === false && (k === 'lsPlant' || tool === 'lib')) return;
        return f.apply(this, arguments);
      };
      w._sce = 1;
      for (const p in f) w[p] = f[p];
      window[k] = w;
    }
    /* the loop check opens the plant page with lsSetTab('operate'); in the Engineer mode the plant page is already on the left */
    const st = window.lsSetTab;
    if (typeof st === 'function' && !st._sce) {
      const w = function (t) {
        if (on && tool === 'loop' && t === 'operate') return;
        return st.apply(this, arguments);
      };
      w._sce = 1;
      window.lsSetTab = w;
    }
  }
  const rawCall = (k, v) => call(() => (raw[k] || window[k])(v));

  /* ---------- the plant page of the same system: the Plant view page that holds the open sheet (its values, machines) ---------- */
  const base = n => String(n || '').replace(/^\(\w+\)/, '');
  function curSheet() {
    if (!window.AN) return null;
    if (AN.cat === 'an') {
      const s = AN.sheets && AN.sheets[AN.i];
      return s ? { k: 'an', name: s.name, title: s.title || '' } : null;
    }
    const D = call(() => S.sheets[S.cur], null);
    return D ? { k: 'dig', name: base(call(() => LS_DOCK.dName(D), D.name)), title: D.title || '' } : null;
  }
  /* the tags of an analog sheet (the names of its wires) against the tags of each page: its transmitter values (data-v) and its
     controllers (mach ctl / io); the page with the most is the page of that sheet. A digital sheet: the page whose machine is drawn on it */
  const nz = x =>
    String(x || '')
      .toUpperCase()
      .split('.')[0]
      .replace(/[^A-Z0-9]/g, '');
  function pageOf(c) {
    const b = base(c.name);
    if (!b) return null;
    const defs = call(() => LS_MOCK.defs, []) || [];
    if (c.k === 'an') {
      const sh = call(() => AN.sheets[AN.i], null),
        S0 = sh && sh.S;
      if (!S0 || !S0.nets) return null;
      const tags = new Set();
      for (let n = 0; n < S0.nets.length; n++) {
        const t = nz(call(() => AN.nm(S0, n), ''));
        if (t.length >= 5) tags.add(t);
      }
      let best = null,
        bn = 0;
      for (const d of defs) {
        const T = new Set();
        for (const m of String(d.art || '').matchAll(/data-v="([^"|]+)"/g)) T.add(nz(m[1]));
        for (const k in d.mach || {}) {
          const m = d.mach[k];
          if (m.ctl) T.add(nz(m.ctl));
          if (m.io) T.add(nz(m.io));
        }
        let n = 0;
        for (const t of T) if (tags.has(t)) n++;
        if (n > bn) ((bn = n), (best = d.id));
      }
      return best;
    }
    for (const d of defs)
      for (const id in d.mach || {}) {
        const m = d.mach[id];
        const L = [
          m.d,
          m.mov,
          m.sti && m.sti[0],
          m.sto && m.sto[0],
          m.ad && !/@/.test(m.ad) ? call(() => LS_DOCK.dName(LS_DOCK.dOf(m.ad)), null) : null
        ];
        if (L.some(x => x && base(x) === b)) return d.id;
      }
    return null;
  }
  const picker = () => document.querySelector('#plantws .plpick');
  let lastSh = '';
  function follow() {
    const c = curSheet();
    const nm = c ? c.k + ':' + c.name : '';
    if (nm === lastSh) return;
    if (c && c.k === 'an' && !call(() => AN.sheets[AN.i].S.nets, null)) return; /* the sheet is not read yet */
    lastSh = nm;
    const pg = c && pageOf(c),
      pk = picker();
    if (pg && pk && pk.value !== pg && [...pk.options].some(o => o.value === pg)) {
      pk.value = pg;
      pk.dispatchEvent(new Event('change'));
    }
  }

  /* ---------- build ---------- */
  function build() {
    if (els) return;
    els = {};
    /* the bar under the strip: where you are, and the two switches of the Engineer (mockup: LOGIC View | Run, PLANT MODEL On | Off) */
    const bar = E('div');
    bar.id = 'scebar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Engineer view');
    const cr = E('nav', 'scecr');
    cr.setAttribute('aria-label', 'Where you are');
    els.cPlant = Bt('scelk', 'Plant', 'The overview of the unit (Operator)', () => call(() => lsShellC.showOv()));
    els.cPage = Bt('scelk', '', 'This page in the Operator mode', () => {
      const pk = picker();
      if (pk && window.lsShellC && lsShellC.openPage) lsShellC.openPage(pk.value);
    });
    els.cHere = E('span', 'scehere', '');
    cr.append(els.cPlant, E('span', 'scesep', '›'), els.cPage, E('span', 'scesep', '›'), els.cHere);
    const seg = (lab, opts, tip) => {
      const g = E('span', 'sceseg');
      g.setAttribute('role', 'group');
      g.setAttribute('aria-label', tip);
      const bs = opts.map(([t, ti, f]) => Bt('', t, ti, f));
      g.append(...bs);
      return [E('span', 'scelab', lab), g, bs];
    };
    const band = t => [...document.querySelectorAll('#crband .seg button')].find(b => b.textContent.trim() === t);
    const [l1, g1, vr] = seg(
      'Logic',
      [
        ['View', 'View: look and trace; nothing runs, the inputs are locked', () => call(() => band('VIEW').click())],
        ['Run', 'Run: the logic runs; switch and force the inputs', () => call(() => band('RUN').click())]
      ],
      'Logic view or run'
    );
    const pm = v => () => call(() => window.AN && !!AN.plantOn !== v && $('pmbtn').click());
    const [l2, g2, pmb] = seg(
      'Plant model',
      [
        [
          'On',
          'On: the boiler and turbine model with the steam table; the measured values follow the valves',
          pm(true)
        ],
        ['Off', 'Off: you type the plant values; only the drawn logic runs', pm(false)]
      ],
      'Plant model on or off'
    );
    els.vr = vr;
    els.pmb = pmb;
    bar.append(cr, E('span', 'scesp'), l1, g1, l2, g2);
    els.bar = bar;

    /* the tool rail */
    const nav = E('nav');
    nav.id = 'scetools';
    nav.setAttribute('aria-label', 'Engineer tools');
    nav.append(E('span', 'scetl', 'Engineer tools'));
    els.tb = {};
    for (const [k, t, ti] of TOOLS) {
      const b = Bt('', t, ti, () => setTool(k));
      b.setAttribute('aria-pressed', 'false');
      els.tb[k] = b;
      nav.append(b);
    }
    els.nav = nav;

    /* Why is it X? (under the sheet) */
    const why = E('section');
    why.id = 'scewhy';
    why.setAttribute('aria-label', 'Why is it');
    els.wh = E('div', 'scesec', 'Why is it …?');
    els.wb = E('div', 'scewb');
    els.wl = E('div', 'scelinks');
    els.wOpen = Bt('scelk', 'Open analog sheet', 'Open the analog sheet where the cause starts', null);
    els.wInfo = Bt('scelk', 'Signal details', 'The info card of this signal: source, users, effects, wiring', null);
    els.wForce = Bt(
      'scelk',
      'Force a signal',
      'Run mode, and the panel of the sheet with Force 1 / 0 for the selected signal',
      force
    );
    els.wl.append(els.wOpen, els.wInfo, els.wForce);
    why.append(els.wh, els.wb, els.wl);
    els.why = why;

    /* the right-hand pane of Recent and Sheet tools */
    const pane = E('section');
    pane.id = 'scepane';
    els.pane = pane;

    document.body.append(nav, why, pane);
    const gs = $('gsbar');
    if (gs) gs.append(bar);
  }

  /* ---------- the tools ---------- */
  function setTool(k) {
    const was = tool;
    tool = k;
    if (was === 'lib' && k !== 'lib') rawCall('lsLibrary', false);
    if (was === 'fx' && k !== 'fx') call(() => $('fxws').classList.contains('open') && $('fxclose').click());
    if (was === 'loop' && k !== 'loop') call(() => LS_LOOP.toggle(false));
    if (k === 'lib') rawCall('lsLibrary', true);
    if (k === 'fx' && !call(() => window.lsFx && lsFx(), false)) {
      tool = 'logic';
      msg('The curves are not loaded yet: open an analog sheet first');
    }
    if (k === 'loop') call(() => LS_LOOP.toggle(true));
    if (k === 'recent' || k === 'sheet') fillPane();
    paint();
    if (k === 'logic' && was !== 'logic') refit();
  }
  /* the panes changed size: the pages fit again (resize of the window = the plant page; the Fit button of the sheet = the sheet) */
  function refit() {
    setTimeout(() => {
      dispatchEvent(new Event('resize'));
      setTimeout(
        () =>
          call(() =>
            [...document.querySelectorAll('#gsbar button')]
              .find(b => b.textContent.trim() === 'Fit' && b.offsetParent)
              .click()
          ),
        120
      );
    }, 0);
  }
  const msg = t => call(() => (window.anMsg ? anMsg(t) : window.msg && window.msg(t)));
  function fillPane() {
    const p = els.pane;
    p.textContent = '';
    const T = TOOLS.find(x => x[0] === tool);
    p.append(E('h3', '', T[1]));
    const item = (a, b, f, dis) => {
      const x = Bt('sceit', '', dis || b, f);
      x.append(E('b', '', a), E('small', '', dis ? dis : b));
      x.setAttribute('aria-label', a + ', ' + (dis || b));
      if (dis) x.disabled = true;
      return x;
    };
    if (tool === 'recent') {
      const rs = call(() => JSON.parse(localStorage.getItem('ls-recent')) || { sh: [], fp: [] }, { sh: [], fp: [] });
      p.append(E('div', 'scesec', 'Sheets'));
      const l1 = E('div', 'scetl2');
      for (const n of rs.sh || [])
        l1.append(
          item(n, 'analog sheet', () => {
            call(() => {
              if (AN.cat !== 'an') AN.setCat('an');
              const i = AN.sheets.findIndex(s => s.name === n);
              if (i >= 0) AN.go(i);
            });
            setTool('logic');
          })
        );
      if (!(rs.sh || []).length) l1.append(E('p', 'scenone', 'None yet: open an analog sheet.'));
      p.append(l1, E('div', 'scesec', 'Faceplates'));
      const l2 = E('div', 'scetl2');
      for (const t of rs.fp || [])
        l2.append(
          item(t, 'opens on the plant page', () => {
            setTool('logic');
            call(() => lsPlantFp(t));
          })
        );
      if (!(rs.fp || []).length)
        l2.append(E('p', 'scenone', 'None yet: click a controller or valve on the plant page.'));
      p.append(l2);
      return;
    }
    /* Sheet tools: the buttons the app already has (ribbon, Legend and style panel, Tools page) */
    const btnT = re =>
      [...document.querySelectorAll('#gsbar button, #toolsws button')].find(b => re.test(b.textContent.trim()));
    const isAn = call(() => AN.cat === 'an', false);
    const lg = () => {
      setTool('logic');
      setTimeout(
        () =>
          call(() =>
            [...document.querySelectorAll('#gsbar button')]
              .find(b => b.textContent.trim() === 'Legend' && b.offsetParent)
              .click()
          ),
        50
      );
    };
    const L = E('div', 'scetl2');
    L.append(
      item('Legend and style', 'colours of symbols, valves and wires; wire style', lg),
      item(
        'Diagnostics and settings file',
        'storage check, diagnostic report, save or load the sheet settings (in Legend and style, Saving)',
        lg,
        isAn ? '' : 'Open an analog sheet first'
      ),
      /* the import / export panel of the tables (tables-health.js lnOpen; the LN tables button itself opens the Curves page) */
      item('Linear curve tables', 'add, replace or download the tables of the curves', () => call(() => AN.lnOpen())),
      item('Drawing health', 'sheets, blocks, inputs and pin problems of the drawings', () =>
        call(() => btnT(/^Health/).click())
      ),
      /* the gain / integral / derivative rows of a controller show in the panel only while the test panel (Tools · UAT) is open
         (plant-window.js); that panel is in the test build only */
      $('uatb')
        ? item(
            'Controller tuning',
            'gain, integral and derivative: opens the test panel; then select a controller on an analog sheet',
            () => {
              setTool('logic');
              call(() => $('uatb').click());
            }
          )
        : item(
            'Controller tuning',
            'gain, integral and derivative of each controller',
            null,
            'Not in this build: the tuning rows show only with the test panel (Tools · UAT) of the test build'
          )
    );
    p.append(L);
  }

  /* ---------- Why is it X? ---------- */
  function force() {
    call(() => {
      const r = [...document.querySelectorAll('#crband .seg button')].find(b => b.textContent.trim() === 'RUN');
      if (r && !r.classList.contains('on')) r.click();
    });
    /* the side panel of the sheet (analog: the Inspector with Force 1 / 0 and Force to; digital: the Panel), opened with its own button */
    const an = call(() => AN.cat === 'an', false),
      pn = $(an ? 'anp' : 'dp');
    if (!(pn && pn.offsetWidth))
      call(() =>
        [...document.querySelectorAll('#gsbar button')]
          .find(b => b.textContent.trim() === (an ? 'Inspector' : 'Panel') && b.offsetParent)
          .click()
      );
    /* Run moves the analog pane to its Faceplate tab (hmi.js): the Inspector tab has the force buttons */
    if (an)
      setTimeout(() => {
        call(() =>
          [...document.querySelectorAll('#opp .hmitabs button')]
            .find(b => b.textContent.trim() === 'Inspector' && b.offsetParent)
            .click()
        );
        call(() => AN.panelUpd(true));
      }, 150);
  }
  let whyKey = '';
  function paintWhy() {
    const W = els;
    const an = call(() => AN.cat === 'an', false);
    const sh = an ? call(() => AN.sheets[AN.i], null) : null;
    const n = an && AN.sel && AN.sel.net != null ? AN.sel.net : null;
    if (!an || !sh || n == null) {
      const k = an ? 'none' : 'dig';
      if (whyKey === k) return;
      whyKey = k;
      W.wh.textContent = 'Why is it …?';
      W.wb.textContent = an
        ? 'Click a wire on the sheet: its live cause, back to the root signal, shows here.'
        : 'Digital sheet: click a row; the panel of the sheet shows what makes it 1 or 0 (To make it 1, It goes 0 when).';
      W.wOpen.hidden = true;
      W.wInfo.hidden = true;
      return;
    }
    const L = call(() => AN.why(sh, n).lines, []) || [];
    const v = L[0] ? (/= ([^\s]+)/.exec(L[0].txt) || [])[1] : '';
    const k = sh.name + '|' + n + '|' + L.map(l => l.txt).join('¦');
    if (k === whyKey) return;
    whyKey = k;
    const name = call(() => AN.nm(sh.S, n), '') || 'wire ' + n;
    W.wh.textContent = 'Why is it ' + (v || '…') + '?';
    W.wb.textContent = '';
    for (const l of L.slice(0, 6)) {
      const r = E('div', 'scewr', l.txt + (l.sh && l.sh !== sh.name ? '  [' + l.sh + ']' : ''));
      r.style.paddingLeft = 0.25 + Math.min(l.d, 8) * 0.625 + 'rem';
      W.wb.append(r);
    }
    if (L.length > 6) W.wb.append(E('div', 'scewr scemore', '… ' + (L.length - 6) + ' more steps in Signal details'));
    /* the first step that is on another analog sheet: the sheet where the cause comes from */
    const o = L.find(l => l.sh && l.sh !== sh.name && AN.sheets.some(s => s.name === l.sh));
    W.wOpen.hidden = !o;
    if (o) {
      W.wOpen.textContent = 'Open analog sheet ' + o.sh;
      W.wOpen.onclick = () =>
        call(() => {
          AN.go(AN.sheets.findIndex(s => s.name === o.sh));
          if (o.n != null)
            setTimeout(() => {
              AN.sel = { net: o.n };
              AN.selBox();
              AN.paint();
              AN.panelUpd(true);
            }, 300);
        });
    }
    W.wInfo.hidden = !/[A-Z]/.test(name) || /^wire /.test(name);
    W.wInfo.onclick = () => call(() => lsInfo(name));
  }

  /* ---------- state ---------- */
  function paint() {
    if (!els) return;
    for (const k in els.tb) {
      els.tb[k].classList.toggle('on', k === tool);
      els.tb[k].setAttribute('aria-pressed', String(k === tool));
    }
    for (const [k] of TOOLS) B.classList.toggle('scet-' + k, on && tool === k);
    els.pane.hidden = !(on && (tool === 'recent' || tool === 'sheet'));
  }
  function tick() {
    const want0 = B.classList.contains('sc') && B.dataset.tab === 'logic' && !B.classList.contains('lssplit');
    if (want0 && !els) {
      if (!$('gsbar') || !window.lsPlant) return;
      build();
    }
    wrap();
    if (want0 !== on) {
      on = want0;
      B.classList.toggle('sceng', on);
      if (on) {
        rawCall('lsPlant', true);
        if (tool === 'lib') rawCall('lsLibrary', true);
        if (tool === 'fx') call(() => lsFx());
        if (tool === 'recent' || tool === 'sheet') fillPane();
        lastSh = '';
      } else {
        /* leaving the Engineer mode: the pages it held go back to what the old app shows on that tab */
        const t = B.dataset.tab;
        if (t !== 'operate') rawCall('lsPlant', false);
        if (tool === 'lib' && t !== 'library') rawCall('lsLibrary', false);
        if (tool === 'fx') call(() => $('fxws').classList.contains('open') && $('fxclose').click());
        if (tool === 'loop') call(() => LS_LOOP.toggle(false));
      }
      paint();
      refit();
    }
    if (!on) return;
    /* a page closed by its own button (Curves ✕, Loop check ✕): back to the logic */
    if (tool === 'fx' && !call(() => $('fxws').classList.contains('open'), false)) setTool('logic');
    if (tool === 'loop' && call(() => $('lcdock').hidden, false)) setTool('logic');
    const pw = $('plantws');
    if (pw && pw.style.display !== 'grid' && !B.classList.contains('pvout')) rawCall('lsPlant', true);
    B.classList.toggle('scenopl', B.classList.contains('pvout'));
    follow();
    /* the bar: where you are and the two switches */
    const pk = picker(),
      pn = pk && pk.selectedOptions[0] ? pk.selectedOptions[0].textContent.trim() : '';
    if (els.cPage.textContent !== pn) els.cPage.textContent = pn;
    els.cPage.hidden = !pn;
    const c = curSheet();
    const here =
      tool === 'logic' ? (c ? c.name + (c.title ? ' · ' + c.title : '') : 'Logic') : TOOLS.find(x => x[0] === tool)[1];
    if (els.cHere.textContent !== here) els.cHere.textContent = here;
    const bv = [...document.querySelectorAll('#crband .seg button')];
    const vOn = bv.find(b => b.textContent.trim() === 'VIEW'),
      rOn = bv.find(b => b.textContent.trim() === 'RUN');
    if (vOn && !vOn.parentElement.classList.contains('sce-hide')) vOn.parentElement.classList.add('sce-hide');
    els.vr[0].setAttribute('aria-pressed', String(!!(vOn && vOn.classList.contains('on'))));
    els.vr[1].setAttribute('aria-pressed', String(!!(rOn && rOn.classList.contains('on'))));
    const pmOn = !!call(() => AN.plantOn, false);
    els.pmb[0].setAttribute('aria-pressed', String(pmOn));
    els.pmb[1].setAttribute('aria-pressed', String(!pmOn));
    if (tool === 'logic') paintWhy();
    /* the Why card stays left of the panel of the sheet (Inspector / Faceplate) when it is open */
    const dw = Math.max(...['anp', 'opp', 'dp'].map(id => ($(id) && $(id).offsetParent ? $(id).offsetWidth : 0))),
      rt = Math.round(dw + 16) + 'px';
    if (els.why.style.right !== rt) els.why.style.right = rt;
  }
  setInterval(() => call(tick), 400);
  window.lsShellC = Object.assign(window.lsShellC || {}, { engTool: setTool });
})();
