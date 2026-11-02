/* 2.4.1-beta.4 (user 2026-10-19): the DITL page works like the ABC page. The drawing is the one read from the DXF (no edit tools);
   the tool bar has [VIEW | ▶ Run] (2.5.0-beta.13, was SIMULATE), Reset, ◀ Back, Fit, Zoom and Panel (2.5.0-beta.9), and a right panel lists the
   inputs (switch / push button), analog inputs, timers, valves / motors and outputs of the open sheet.
   Uses the names of the DITL script (src/digital): S, SIM, DPAUSE, TSP, cur, render, simSheet, simOn, fbk, isPB, lockd, ... */
(function () {
  if (typeof S === 'undefined' || typeof SIM === 'undefined' || typeof ditlStep !== 'function') return;
  const $ = id => document.getElementById(id);
  const E = (t, a, c) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'cls') e.className = a[k];
        else if (k === 'txt') e.textContent = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (c || []).forEach(x => x && e.append(x));
    return e;
  };
  const ls = (k, v) => {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  };
  const D = (window.DUI = window.DUI || {});
  const mode = () => $('bmode');
  /* SIM on = the DITL states start again (the old Simulate button) */
  const enter = () => {
    if (!SIM) mode().click();
  };
  /* ---------- tool bar ---------- */
  /* 2.5.0-beta.9 (user: "need pa ba ang step simulate? wag na kaya? either VIEW at SIMULATE ON/OFF nalang"): the DITL bar is
     [VIEW | SIMULATE] + Reset. SIMULATE = the DITL logic runs in real time (timers, valves, motors), VIEW = simulation off. No step,
     no step size, no speed (the DITL time is the time of the clock, the same as the ABC at 1x). */
  /* 2.5.0-beta.13 (user: "same function sa ABC ang DITL. so kung ano ang toolbar, ganun din ang DITL"): [VIEW | ▶ Run] as the ABC bar */
  const run = E('button', { cls: 'tb-run dui-run', txt: '▶ Run', title: 'RUN: the DITL logic runs (timers, valves, motors in real time); click an input to switch it. VIEW = trace only, no simulation' });
  const reset = E('button', { txt: 'Reset', title: 'Start again: all inputs OFF, timers, latches, valves and motors back to the start' });
  const view = E('button', { cls: 'tb-view', txt: 'View', title: 'View the drawing without simulation' });
  const zoom = E('button', { txt: 'Zoom', title: 'Zoom to readable text (12 px) on the selected cell; Fit shows the whole sheet again' });
  const panel = E('button', { txt: 'Panel', title: 'Show / hide the right panel (inputs, timers, outputs)' });
  run.onclick = () => {
    if (!SIM) enter();
    DPAUSE = false;
    TSP = 1;
    upd();
    render();
  };
  view.onclick = () => {
    if (SIM) mode().click();
    DPAUSE = false;
    upd();
  };
  reset.onclick = () => {
    const p = DPAUSE;
    if (SIM) {
      mode().click();
      mode().click();
    }
    DPAUSE = p;
    upd();
  };
  zoom.onclick = () => {
    const s = cur(),
      v = VB[S.cur],
      svg = $('svg');
    if (!s || !v || !svg) return;
    const hs = [];
    (s.tx || []).forEach(t => t.h > 0 && hs.push(t.h));
    for (const k in s.cells) (s.cells[k] || []).forEach(t => t.h > 0 && hs.push(t.h));
    hs.sort((a, b) => a - b);
    const h = hs[hs.length >> 1] || 2.5,
      r = svg.getBoundingClientRect();
    if (!r.width) return;
    let cx = v[0] + v[2] / 2,
      cy = v[1] + v[3] / 2;
    if (sel && s.rows[sel.i] && s.rng[sel.c]) {
      cx = (s.rng[sel.c][0] + s.rng[sel.c][1]) / 2;
      cy = -s.rows[sel.i].y;
    }
    const w = Math.min(v[2], (r.width * h) / 12),
      hh = (w * r.height) / r.width;
    v.splice(0, 4, cx - w / 2, cy - hh / 2, w, hh);
    svg.setAttribute('viewBox', v.join(' '));
  };
  /* 2.5.0-beta.20 (UI audit): up to 1180 px the panel is a drawer OVER the drawing: closed at the start (an empty panel covered
     half of the sheet on a tablet standing up and on a phone); a click on a row, a gate or a wire opens it */
  let open = ls('ditl.dp') !== '0' && !matchMedia('(max-width:1180px)').matches;
  panel.onclick = () => {
    open = !open;
    ls('ditl.dp', open ? '1' : '0');
    upd();
  };
  /* ---------- page links (2.5.0-beta.8, user: "YUNG MGA PAGE LINK SA DITL, DI GUMAGANA DI MAPINDOT") ----------
     The FROM column (left) and the TO column (right) of a row name the other end of the signal: "28A-77" = item 77 of DITL-28A
     (item 1 ~ 50 = input row, 51 ~ 79 = output row 1 ~ 29), "ABC-003A" or "ABC-003A,3B" = the ABC sheet(s). Click the text: the
     page goes there and the row blinks; ◀ Back returns. Works in View and Run (in Run the input switch is the S column / panel). */
  const back = E('button', { cls: 'dui-back', txt: '◀ Back', title: 'Back to the sheet before the last page link' });
  back.style.display = 'none';
  const hist = [];
  /* 2.5.0-beta.14 bottom ash: FROM "BA01-11" = output NO. 11 of BA-01; TO "BA-56/46/11" = the sheets that read this output (the
     input row there whose FROM names this sheet and NO.) */
  const BAF = /\bBA\s*-?\s*(\d{1,2})\s*-\s*(\d{1,2})\b/gi,
    BAT = /\bBA\s*-\s*(\d{1,2}(?:\s*\/\s*\d{1,2})*)(?!\s*-\s*\d)/gi;
  /* 2.5.0-beta.15 limestone (Excel drawing): FROM "SHEET 214 - LINE21" = output LINE 21 of sheet LS-214; TO "SHEET 20 - LINE 3" =
     input LINE 3 of LS-20 (the row there whose FROM names this sheet and line) */
  const LSR = /\bSHEET\s*(\d{2,3})\s*-\s*LINE\s*(\d{1,2})\b/gi;
  const refs = (t, sh, ri, col) => {
    const o = [],
      used = [];
    let s = String(t || ''),
      m;
    const lme = sh && (/DITL-LS(\d{2,3})$/i.exec(sh.name) || [])[1];
    s = s.replace(LSR, (x, a, b) => {
      const to = col === 'RT' && lme && ri >= 0 && sh.rows[ri];
      o.push(to ? { code: 'LS' + a, bk: 'SHEET' + lme + '-LINE' + sh.rows[ri].n } : { code: 'LS' + a, nn: +b });
      return ' '.repeat(x.length);
    });
    s = s.replace(BAF, (x, a, b) => {
      o.push({ code: 'BA' + a.padStart(2, '0'), nn: +b });
      return ' '.repeat(x.length);
    });
    const me = sh && (/DITL-(BA\d{2})$/i.exec(sh.name) || [])[1],
      rn = me && ri >= 0 && sh.rows[ri] && sh.rows[ri].rn;
    s = s.replace(BAT, (x, L) => {
      L.split('/').forEach(c => o.push({ code: 'BA' + c.trim().padStart(2, '0'), bk: rn ? me.toUpperCase() + '-' + String(rn).padStart(2, '0') : '' }));
      return ' '.repeat(x.length);
    });
    const RA = /ABC\s*-\s*(\d{3}[A-Z]?)((?:\s*[,\/]\s*\d{1,3}[A-Z]?(?![\dA-Z]|\s*-))*)/gi;
    while ((m = RA.exec(s))) {
      const b = m[1].toUpperCase();
      o.push({ abc: 'ABC-' + b });
      (m[2].match(/\d{1,3}[A-Z]?/gi) || []).forEach(x => {
        const d = /^\d+/.exec(x)[0];
        o.push({ abc: 'ABC-' + b.slice(0, Math.max(0, 3 - d.length)) + x.toUpperCase() });
      });
      used.push([m.index, m.index + m[0].length]);
    }
    const RD = /\(?\s*([0-9]{1,3}[A-Z]?)\s*-\s*(\d{1,3})\s*\)?/gi;
    while ((m = RD.exec(s))) {
      if (used.some(u => m.index >= u[0] && m.index < u[1])) continue;
      const code = (/^\d[A-Z]?$/i.test(m[1]) ? '0' : '') + m[1].toUpperCase();
      o.push({ code, nn: +m[2] });
    }
    return o.filter((r, i) => o.findIndex(q => q.abc === r.abc && q.code === r.code && q.nn === r.nn) === i);
  };
  const sheetOf = code => {
    return ditlIdx(code, cur());
  };
  /* the input row of sheet j whose FROM is bk ("BA11-01") */
  const bkRow = (j, bk) => {
    const d = S.sheets[j];
    return d ? d.rows.findIndex((_, k) => (d.cells[k + ':F'] || []).some(t => t.t.replace(/\s/g, '') === bk)) : -1;
  };
  const labelOf = r => {
    if (r.abc) return r.abc + ' (analog)';
    if (r.nn === undefined) {
      const i = sheetOf(r.code),
        k = i >= 0 && r.bk ? bkRow(i, r.bk) : -1;
      return (i >= 0 ? S.sheets[i].name : 'DITL-' + r.code) + (k >= 0 ? ' (input row ' + S.sheets[i].rows[k].n + ')' : '');
    }
    const i = sheetOf(r.code);
    const it = i >= 0 ? ditlItem(S.sheets[i], r.nn) : null,
      out = it ? it.side === 'R' : r.nn > 50;
    return (i >= 0 ? S.sheets[i].name : 'DITL-' + r.code) + ' item ' + r.nn + (out ? ' (output row ' + (it ? +S.sheets[i].rows[it.i].n : r.nn - 50) + ')' : ' (input row ' + r.nn + ')');
  };
  /* 2.5.0-beta.11: a text that the drawing writes over the band of the row above / below (rowFix, DITL PDF audit) belongs to its
     own row; a click on the text where it is drawn opens it too */
  const ownCell = (s, h) => {
    if (!h || (s.cells[h.k] || []).length) return h;
    const r = s.rows[h.i],
      RB = (s.rb && s.rb[h.i]) || [r.y - 3.3, r.y + 5.7];
    for (const k in s.cells)
      if (k.split(':')[1] === h.c && s.cells[k].some(t => t.y >= RB[0] && t.y < RB[1])) {
        const i = +k.split(':')[0];
        return { i, c: h.c, k };
      }
    return h;
  };
  const linkCell = (s, h) => h && (h.c === 'F' || h.c === 'RT') && refs((s.cells[h.k] || []).map(t => t.t).join(' '), s, h.i, h.c);
  function updBack() {
    back.style.display = hist.length ? '' : 'none';
  }
  let FL = null;
  /* 3.2.0 retest #40: the input rows that the Training interlock still misses (the ✕ of the panel) stay outlined in red on the sheet */
  let MK = null;
  function drawMk() {
    const svg = $('svg');
    if (!svg) return;
    svg.querySelectorAll('rect.plmiss').forEach(x => x.remove());
    if (!MK || cur() !== MK.s) return;
    const VR = MK.s.vr || MK.s.rng;
    for (const i of MK.rows) {
      const r = MK.s.rows[i];
      if (!r) continue;
      const RB = (MK.s.rb && MK.s.rb[i]) || [r.y - 3.3, r.y + 5.7],
        f = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      Object.entries({ x: VR.F[0], y: -RB[1], width: VR.S[1] - VR.F[0], height: RB[1] - RB[0], class: 'plmiss' }).forEach(([k, v]) => f.setAttribute(k, v));
      /* retest #40 (R8: red but not flashing): the sheet is drawn again many times a second while it runs and every new outline started
         its flash again (a CSS animation never got past its start); the flash is timed by the clock: every 0.5 s on / off */
      if (Math.floor(Date.now() / 500) % 2) f.classList.add('off');
      svg.append(f);
    }
  }
  setInterval(() => {
    const off = Math.floor(Date.now() / 500) % 2;
    document.querySelectorAll('#svg rect.plmiss').forEach(x => x.classList.toggle('off', !!off));
  }, 250);
  D.mark = (s, rows) => {
    const k = s && rows && rows.length ? s.name + ':' + rows.join(',') : '';
    if (k === (MK ? MK.k : '')) return;
    MK = k ? { s, rows, k } : null;
    drawMk();
  };
  D.after = () => {
    drawMk();
    if (FL && Date.now() < FL.until && cur() === FL.s) flashRow(FL.s, FL.i, FL.side, 1);
    if (typeof hl === 'function') hl();
  };
  function flashRow(s, i, side, again) {
    if (!again) FL = { s, i, side, until: Date.now() + 2400 };
    const svg = $('svg'),
      r = s.rows[i],
      VR = s.vr || s.rng;
    if (!svg || !r) return;
    const RB = (s.rb && s.rb[i]) || [r.y - 3.3, r.y + 5.7],
      x1 = side === 'R' ? VR.RS[0] : VR.F[0],
      x2 = side === 'R' ? VR.RT[1] : VR.S[1],
      f = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    Object.entries({ x: x1, y: -RB[1], width: x2 - x1, height: RB[1] - RB[0], class: 'plflash' }).forEach(([k, v]) => f.setAttribute(k, v));
    svg.append(f);
    setTimeout(() => f.remove(), Math.max(0, FL.until - Date.now()));
  }
  /* open DITL sheet i at row n (item nn), keeping the zoom you had */
  function goItem(i, nn, from, itx) {
    const s0 = cur(),
      v0 = (VB[S.cur] || []).slice();
    hist.push(from || { cat: 'dig', i: S.cur, vb: v0 });
    updBack();
    if (from && window.AN && AN.cat === 'an') AN.setCat('dig');
    S.cur = i;
    sel = null;
    render();
    const s = cur(),
      it = itx || ditlItem(s, nn),
      side = it ? it.side : 'L',
      ri = it ? it.i : -1,
      v = VB[S.cur];
    if (ri < 0 || !v) {
      msg(s.name + (nn === undefined ? ' is open.' : ': item ' + nn + ' is not on this sheet (the sheet is open).'));
      return true;
    }
    const VR = s.vr || s.rng,
      cx = side === 'R' ? (VR.RS[0] + VR.RT[1]) / 2 : (VR.F[0] + VR.S[1]) / 2;
    if (s0 !== s && v0.length) {
      v[2] = v0[2];
      v[3] = v0[3];
    }
    v[0] = cx - v[2] / 2;
    /* 3.2.0 retest #39 #48: the Training opens a row zoomed in (about half the sheet wide, the text readable beside the panel) and starts
       at the left edge of the sheet (the input rows), no empty band at the left */
    if (itx && itx.zoom) {
      const bb = $('svg').getBoundingClientRect(),
        w = Math.min(itx.zoom, VR.RT[1] - VR.F[0] + 10);
      v[2] = w;
      v[3] = (w * Math.max(1, bb.height)) / Math.max(1, bb.width);
      v[0] = side === 'R' ? VR.RT[1] + 4 - w : VR.F[0] - 4;
    }
    v[1] = -s.rows[ri].y - v[3] / 2;
    /* retest #39 (R7: only row 5 of the three REMOTE rows 5, 18, 22 was in view): all the rows the Training names are in view, the
       zoom kept as close as they allow */
    const rr = itx && itx.rows ? itx.rows.map(j => s.rows[j]).filter(Boolean) : [];
    if (rr.length > 1) {
      const ys = rr.map(r => -r.y),
        y0 = Math.min(...ys) - 8,
        y1 = Math.max(...ys) + 8;
      if (y1 - y0 > v[3]) {
        const k = (y1 - y0) / v[3];
        v[2] *= k;
        v[3] *= k;
      }
      v[1] = (y0 + y1) / 2 - v[3] / 2;
    }
    $('svg').setAttribute('viewBox', v.join(' '));
    /* from the ABC the page switch draws the sheet once more: blink after it */
    flashRow(s, ri, side);
    msg(s.name + (nn === undefined ? '' : ' item ' + nn) + (side === 'R' ? ' (output row ' : ' (input row ') + s.rows[ri].n + '). ◀ Back returns.');
    return true;
  }
  function goRef(r) {
    if (r.abc) {
      if (!window.AN) return false;
      hist.push({ cat: 'dig', i: S.cur, vb: (VB[S.cur] || []).slice() });
      updBack();
      /* 3.2.0-beta.39: the ABC ↩ Back returns to this DITL sheet */
      if (AN.hist && AN.updBack) {
        AN.hist.push({ dig: true });
        AN.updBack();
      }
      AN.setCat('an');
      let n = 0;
      const t = setInterval(() => {
        const j = (AN.sheets || []).findIndex(x => x.name === r.abc);
        if (j >= 0 || ++n > 50) {
          clearInterval(t);
          if (j >= 0) AN.go(j);
          msg(j >= 0 ? r.abc + ' opened. ↩ Back (top left of the tool row) returns to the DITL sheet.' : r.abc + ' is not in the ABC page.');
        }
      }, 120);
      return true;
    }
    const i = sheetOf(r.code);
    if (i < 0) {
      msg('DITL-' + r.code + ' is not in the DITL page (' + r.code + '-' + r.nn + ').');
      return true;
    }
    if (r.nn === undefined) {
      const k = r.bk ? bkRow(i, r.bk) : -1;
      return goItem(i, undefined, null, k >= 0 ? { i: k, side: 'L' } : { i: -1, side: 'L' });
    }
    return goItem(i, r.nn);
  }
  /* the chooser when one cell names several ends ("15-10,20-11", "ABC-007,011") */
  const pick = E('div', { id: 'plpick' });
  pick.hidden = true;
  document.body.append(pick);
  const closePick = () => (pick.hidden = true);
  addEventListener('keydown', e => e.key === 'Escape' && closePick());
  addEventListener('pointerdown', e => !pick.hidden && !pick.contains(e.target) && closePick(), true);
  D.refs = refs;
  D.link = (s, h, e) => {
    h = ownCell(s, h);
    const L = linkCell(s, h);
    if (!L || !L.length) return false;
    if (L.length === 1) return goRef(L[0]);
    pick.textContent = '';
    pick.append(E('div', { cls: 'plhd', txt: 'Row ' + s.rows[h.i].n + (h.c === 'F' ? ' FROM' : ' TO') + ': pick the page' }));
    L.forEach(r =>
      pick.append(
        E('button', {
          txt: labelOf(r),
          on: () => {
            /* a touch tap sends its click after the chooser opened: a long chooser (clamped up into the screen) can sit
               under the finger and take that click (2.5.0-beta.11, DITL-03A TO list of 27 pages on a tablet) */
            if (Date.now() - pick.t0 < 400) return;
            closePick();
            goRef(r);
          }
        })
      )
    );
    pick.hidden = false;
    pick.t0 = Date.now();
    const w = pick.offsetWidth,
      hh = pick.offsetHeight;
    pick.style.left = Math.max(8, Math.min(innerWidth - w - 8, e.clientX - w / 2)) + 'px';
    pick.style.top = Math.max(8, Math.min(innerHeight - hh - 8, e.clientY + 12)) + 'px';
    return true;
  };
  D.goItem = goItem;
  /* R9 #86 (window ~655 px: DITL-29A small in a corner, most of the area empty): the drawing had no fit when its area changes size
     (window resize, the Training panel opening, a sheet zoomed while the area was 0 wide). The view keeps its left edge, its centre
     height and its width and takes the shape of the area, so the drawing fills it */
  if (window.ResizeObserver && $('svg')) {
    let sz = null;
    new ResizeObserver(() => {
      const svg = $('svg'),
        r = svg.getBoundingClientRect(),
        v = VB[S.cur];
      if (!r.width || !r.height || !v || v.length < 4) return;
      const k = r.width + 'x' + r.height;
      if (k === sz) return;
      sz = k;
      const h = (v[2] * r.height) / r.width;
      if (Math.abs(h - v[3]) < 0.01 * v[3]) return;
      v[1] += (v[3] - h) / 2;
      v[3] = h;
      svg.setAttribute('viewBox', v.join(' '));
    }).observe($('svg'));
  }
  D.back = () => back.onclick();
  back.onclick = () => {
    const h = hist.pop();
    updBack();
    if (!h) return;
    if (h.cat === 'an') {
      if (window.AN) {
        AN.setCat('an');
        if (h.i >= 0) AN.go(h.i);
      }
      return;
    }
    if (window.AN && AN.cat === 'an') AN.setCat('dig');
    S.cur = h.i;
    sel = null;
    if (h.vb && h.vb.length) VB[S.cur] = h.vb;
    render();
  };
  {
    const svg = $('svg');
    if (svg)
      svg.addEventListener('pointermove', e => {
        if (document.body.classList.contains('an')) return;
        const s = cur();
        let L = null;
        try {
          L = s && linkCell(s, hit(e));
        } catch (x) {}
        svg.style.cursor = L && L.length ? 'pointer' : '';
      });
  }
  /* 3.2.0-beta.25: the ladder of the open sheet, made from its logic (src/ui/ladder/ladder.js, preview) */
  const lad = E('button', { cls: 'dui-lad', txt: 'Ladder', title: 'Ladder view (preview): this sheet as a ladder, made by the app from the logic of the drawing, live beside it' });
  lad.onclick = () => window.LADDER && LADDER.toggle();
  D.bar = fit => [run, view, reset, back, E('span', { cls: 'dui-sep' }), fit, zoom, panel, lad];
  /* ---------- right panel ---------- */
  const dp = E('div', { id: 'dp' });
  const mid = $('mid');
  if (mid) mid.append(dp);
  /* the reader of a sheet (src/digital/parts/03c-read.js, no DOM: the engine reads it too) */
  const { rsNear, isK, isKA, txt, ADR, tagOf, svcOf, fmt, auto, MAPS, maps, rowNo, inName, outName, gName, dName, dPick, rowNets, val, why, shortest, whyD } = DREAD;
  let key = '',
    U = []; /* value updaters of the built panel */
  function sec(title, n) {
    return E('div', { cls: 'dp-h', txt: title + (n != null ? ' (' + n + ')' : '') });
  }
  /* the switch of an input row (Inputs tab and Selected tab): hand switch, push button (press and hold) or auto (dashed) */
  /* auto: src/digital/parts/03c-read.js */
  /* retest #63: an operator command on the drawing (a CRT push button, a hand switch) goes to the Event log with its row and tag */
  const opLog = (s, i, what) => {
    try {
      const I = D.rowInfo(s, i);
      if (window.lsEventAdd)
        lsEventAdd(
          s.name,
          'DCS',
          'Operator: ' +
            (I.svc || 'input row ' + (i + 1)) +
            ' ' +
            what +
            ' (row ' +
            (i + 1) +
            (I.tag ? ' · ' + I.tag : '') +
            ')'
        );
    } catch (e) {}
  };
  function swBtn(s, i, b, UL) {
    const k = i + ':S',
      pb = isPB(s, i),
      grpT = (s.nl.grp || []).some(g => g.master === i && g.toggle);
    if (pb && !grpT) {
      let t0 = 0;
      const off = () => {
        if (!t0) return;
        const w = Math.max(0, 400 - (Date.now() - t0));
        t0 = 0;
        setTimeout(() => {
          s.sig[k] = false;
          render();
        }, w);
      };
      b.onpointerdown = e => {
        if (auto(s, i)) return;
        e.preventDefault();
        if (!SIM) enter();
        t0 = Date.now();
        s.sig[k] = true;
        opLog(s, i, 'PRESSED');
        render();
      };
      b.onpointerup = b.onpointerleave = b.onpointercancel = off;
    } else
      b.onclick = () => {
        if (auto(s, i)) {
          msg('This input follows the equipment or another sheet, it is not switched by hand.');
          return;
        }
        if (!SIM) {
          enter();
          DPAUSE = false;
        }
        s.sig[k] = !s.sig[k];
        opLog(s, i, '= ' + (s.sig[k] ? 1 : 0));
        render();
      };
    UL.push(R => {
      const on = R ? R.rowOn.has(i) : false,
        a = auto(s, i);
      b.textContent = pb && !grpT ? (on ? 'PRESSED' : 'PRESS') : on ? '1 · ON' : '0 · OFF';
      b.className = 'dp-v' + (on ? ' on' : '') + (pb && !grpT ? ' pb' : '') + (a ? ' auto' : '');
    });
  }
  /* ---------- Selected (2.5.0-beta.13, user: "sa right pane, kung ano ang selected cell, nakikita sa right pane. Use your common
     sense ... Act as a professional elite DCS ENGINEER") ----------
     A click on the drawing (VIEW or RUN) selects an input row, an output row, a gate (AND / OR / NOT / flip-flop / timer / comparator /
     counter) or a wire. The Selected tab shows what it is, its value in RUN, what drives it (logic tree with live 1 / 0) and where it
     goes, and in RUN what must change for it to become 1 (or 0): read from the netlist of the sheet, the logic is not changed.
     A line of the panel selects that part (trace back / forward); the selection is drawn on the sheet in cyan. */
  let pk = null,
    SU = [];
  const selBox = E('div', { cls: 'dp-sel' });
  const RIGHT = ['RS', 'RL', 'RT'];
  /* MAPS, maps, rowNo, inName, outName, gName, dName, dPick, rowNets, val, why, shortest, whyD: src/digital/parts/03c-read.js */
  /* the items of a why list, without repeats, at most 10 */
  function whyBox(s, n, R) {
    const box = E('div', { cls: 'dp-why' });
    let last = '';
    SU.push(R2 => {
      if (!R2) {
        if (last !== 'view') {
          last = 'view';
          box.textContent = '';
          box.append(E('div', { cls: 'dp-d', txt: 'Press RUN (top right) to see the values and what is missing.' }));
        }
        return;
      }
      const want = R2.v[n] ? 0 : 1,
        L = why(s, R2.v, n, want, new Set(), 0).map(r => {
          if (r.row !== undefined) r.key = 'r' + r.row + r.want;
          else r.key = (r.g !== undefined ? 'g' + r.g : '') + r.txt;
          return r;
        }),
        U2 = L.filter((r, i) => L.findIndex(q => q.key === r.key) === i).slice(0, 10),
        sig = want + '|' + U2.map(r => r.key + (r.auto ? 'a' : '')).join('|');
      if (sig === last) return;
      last = sig;
      box.textContent = '';
      box.append(E('div', { cls: 'dp-h2', txt: want ? 'To make it 1' : 'It goes 0 when' }));
      if (U2.length) box.append(E('div', { cls: 'dp-d', txt: 'What is missing now (the list updates after each change; an interlock can then ask for the next one).' }));
      if (!U2.length) box.append(E('div', { cls: 'dp-d', txt: 'Nothing on this sheet (it follows its own state).' }));
      U2.forEach(r => {
        const t =
          r.row !== undefined
            ? inName(s, r.row) + (r.want ? ' → 1 (ON)' : ' → 0 (OFF)') + (r.auto ? '  · comes from the equipment / another sheet' : '')
            : r.txt;
        const p = r.row !== undefined ? { t: 'row', i: r.row, side: 'L' } : r.g !== undefined ? { t: 'g', g: r.g } : r.n !== undefined ? { t: 'n', n: r.n } : null;
        box.append(E('button', { cls: 'dp-ln', txt: '• ' + t, title: 'Select it', on: () => p && setPick(p) }));
      });
    });
    return box;
  }
  /* the logic that drives net n, 3 levels deep, with the live 1 / 0 */
  function tree(s, n, depth, out, seen) {
    if (out.length > 40) return;
    (maps(s).drv.get(n) || []).forEach(d => {
      const p = dPick(d),
        b = E('button', { cls: 'dp-ln', style: 'padding-left:' + (4 + depth * 14) + 'px', title: p ? 'Select it' : '' }),
        vv = E('b', { cls: 'dp-b' });
      b.append(vv, document.createTextNode(' ' + dName(s, d)));
      if (p) b.onclick = () => setPick(p);
      out.push(b);
      const nets = d.g !== undefined ? s.nl.gates[d.g].out : [n];
      SU.push(R => {
        const x = R ? (nets.some(m => R.v[m]) ? 1 : 0) : null;
        vv.textContent = x === null ? '–' : x;
        vv.className = 'dp-b' + (x ? ' on' : '');
      });
      if (d.g === undefined || depth >= 3 || seen.has(d.g)) return;
      seen.add(d.g);
      const g = s.nl.gates[d.g];
      const pins = (g.ins || []).map(m => ['', m]).concat((g.s || []).map(m => ['S ', m]), (g.r || []).map(m => ['R ', m]));
      pins.forEach(([pn, m]) => {
        if (pn) out.push(E('div', { cls: 'dp-pin', style: 'padding-left:' + (4 + (depth + 1) * 14) + 'px', txt: pn === 'S ' ? 'SET' : 'RESET' }));
        tree(s, m, depth + 1, out, seen);
      });
    });
  }
  /* where net(s) go: output rows (and gates on the way), a forward search */
  function goesTo(s, nets) {
    const M = maps(s),
      seen = new Set(),
      rows = new Map(),
      q = nets.slice();
    while (q.length && seen.size < 400) {
      const n = q.shift();
      if (seen.has(n)) continue;
      seen.add(n);
      (M.use.get(n) || []).forEach(d => {
        if (d.out) rows.set('R' + d.row, d);
        else if (d.po || d.x) rows.set((d.po ? 'P' + d.po.adr : 'X' + d.x.peer + d.x.num), d);
        else if (d.g !== undefined) (s.nl.gates[d.g].out || []).forEach(m => q.push(m));
      });
    }
    return [...rows.values()];
  }
  const kv = (k, v) => E('div', { cls: 'dp-kv' }, [E('span', { txt: k }), typeof v === 'string' ? E('span', { txt: v }) : v]);
  const vSpan = (nets, R0) => {
    const e = E('b', { cls: 'dp-b big' });
    SU.push(R => {
      const x = R ? (nets.some(m => R.v[m]) ? 1 : 0) : null;
      e.textContent = x === null ? '– (VIEW)' : x ? '1 · ON' : '0 · OFF';
      e.className = 'dp-b big' + (x ? ' on' : '');
    });
    return e;
  };
  const linkBtns = (t, sh, ri, col) => {
    const L = refs(t, sh, ri, col);
    if (!L.length) return t || '–';
    const w = E('span', { cls: 'dp-lk' });
    L.forEach(r => w.append(E('button', { txt: labelOf(r), title: 'Open the other end (◀ Back returns)', on: () => goRef(r) })));
    return w;
  };
  function buildSel() {
    const s = cur();
    selBox.textContent = '';
    SU = [];
    if (!s || !s.nl || !pk) {
      selBox.append(E('p', { cls: 'dp-note dp-empty', txt: 'Click an input row, an output row, a gate or a wire on the drawing to see it here: its value, the logic that drives it and, in RUN, what is missing for it to be 1.' }));
      return;
    }
    const add = (...a) => a.forEach(x => x && selBox.append(x));
    const list = (title, items) => {
      if (!items.length) return;
      add(E('div', { cls: 'dp-h2', txt: title }));
      items.forEach(x => add(x));
    };
    const useLines = nets =>
      goesTo(s, nets)
        .slice(0, 14)
        .map(d => {
          const p = dPick(d),
            vv = E('b', { cls: 'dp-b' }),
            b = E('button', { cls: 'dp-ln', title: p ? 'Select it' : '' }, [vv, document.createTextNode(' ' + dName(s, d))]);
          if (p) b.onclick = () => setPick(p);
          const m = d.out ? rowNets(s, d.row, 'R') : d.po ? [d.po.n] : d.x ? [d.x.n] : [];
          SU.push(R => {
            const x = R ? (R.outOn && d.out ? (R.outOn.has(d.row) ? 1 : 0) : m.some(k => R.v[k]) ? 1 : 0) : null;
            vv.textContent = x === null ? '–' : x;
            vv.className = 'dp-b' + (x ? ' on' : '');
          });
          return b;
        });
    if (pk.t === 'row' && pk.side === 'L') {
      const i = pk.i,
        nets = rowNets(s, i, 'L');
      add(E('div', { cls: 'dp-st', txt: 'INPUT · ROW ' + rowNo(s, i) }), E('div', { cls: 'dp-t', txt: tagOf(s, i) || svcOf(s, i) || 'Row ' + rowNo(s, i) }));
      add(kv('Service', svcOf(s, i) || '–'), txt(s, i, 'L') ? kv('Location', txt(s, i, 'L')) : null, kv('From', linkBtns(txt(s, i, 'F'), s, i)));
      if (isAn(s, i)) {
        const a = (s.nl.an || []).find(x => x.row === i);
        add(kv('Type', 'Analog value (Inputs tab: type the value)'), a ? kv('Limits', a.g.map(j => cmpTxt(s.nl.gates[j])).join('   ')) : null);
      } else if (fbk(s, i, 'S')) {
        const b = E('button', { cls: 'dp-v' }),
          ty = auto(s, i) ? 'Auto: follows the equipment / another sheet' : isPB(s, i) ? 'Push button (press and hold)' : 'Hand switch';
        swBtn(s, i, b, SU);
        add(kv('Type', ty), kv('Value', E('span', { cls: 'dp-sw' }, [vSpan(nets), b])));
      } else add(kv('Value', vSpan(nets)));
      list('Goes to', useLines(nets));
    } else if (pk.t === 'row') {
      const i = pk.i,
        nets = rowNets(s, i, 'R');
      add(E('div', { cls: 'dp-st', txt: 'OUTPUT · ROW ' + rowNo(s, i) }), E('div', { cls: 'dp-t', txt: txt(s, i, 'RS') || txt(s, i, 'RL') || 'Row ' + rowNo(s, i) }));
      add(txt(s, i, 'RL') ? kv('Location', txt(s, i, 'RL')) : null, kv('To', linkBtns(txt(s, i, 'RT'), s, i, 'RT')));
      const vb = E('b', { cls: 'dp-b big' });
      SU.push(R => {
        const x = R ? (R.outOn.has(i) ? 1 : 0) : null;
        vb.textContent = x === null ? '– (VIEW)' : x ? '1 · ON' : '0 · OFF';
        vb.className = 'dp-b big' + (x ? ' on' : '');
      });
      add(kv('Value', vb));
      const T = [];
      nets.forEach(n => tree(s, n, 0, T, new Set()));
      list('Driven by', T);
      let fbRow = false;
      try {
        fbRow = mvOut(s, simIn(s)).has(i);
      } catch (e) {}
      if (fbRow) {
        /* the feedback rows of a valve / motor (OPENED, CLOSED, RUNNING ...) follow the valve / motor model (travel time) */
        const e = E('span');
        SU.push(R => (e.textContent = R ? ((s.nl.mv || []).length ? (s.nl.mv || []).map((b, j) => mvTxt(s, j)).join(' · ') : (s.nl.mot || []).length ? motTxt(s) : '') : 'VIEW: no simulation'));
        add(E('div', { cls: 'dp-h2', txt: 'Valve / motor feedback' }), E('div', { cls: 'dp-d', txt: 'This output follows the valve / motor model (open / close command, travel time), see the Valves tab.' }), kv('Now', e));
      } else if (nets.length) add(whyBox(s, nets[0]));
    } else if (pk.t === 'g') {
      const g = s.nl.gates[pk.g];
      if (!g) return;
      const nets = g.out || [];
      add(E('div', { cls: 'dp-st', txt: g.t === 'TMR' ? 'TIMER' : g.t === 'FF' ? 'FLIP-FLOP' : g.t === 'CMP' ? 'COMPARATOR' : g.t === 'CNT' ? 'COUNTER' : 'GATE ' + g.t }), E('div', { cls: 'dp-t', txt: gName(s, g) }));
      add(kv('Output', vSpan(nets)));
      if (g.t === 'TMR') {
        const v = E('span', { cls: 'dp-tv' }),
          bar = E('span', { cls: 'dp-bar' }, [E('i')]);
        add(kv('Time', E('span', { cls: 'dp-tr' }, [bar, v])));
        SU.push(R => {
          const P = tmSecs(g.tm),
            acc = R ? g.st.acc : 0;
          v.textContent = fmt(acc) + ' / ' + fmt(P);
          bar.firstChild.style.width = Math.max(0, Math.min(100, (acc / Math.max(P, 1e-9)) * 100)) + '%';
        });
      }
      const T = [];
      const pins = (g.ins || []).map(m => ['IN', m]).concat((g.s || []).map(m => ['SET', m]), (g.r || []).map(m => ['RESET', m]));
      pins.forEach(([pn, m]) => {
        if (pn !== 'IN') T.push(E('div', { cls: 'dp-pin', txt: pn }));
        tree(s, m, 0, T, new Set([pk.g]));
      });
      list('Inputs', T);
      list('Goes to', useLines(nets));
      if (nets.length) add(whyBox(s, nets[0]));
    } else if (pk.t === 'n') {
      add(E('div', { cls: 'dp-st', txt: 'WIRE' }), kv('Value', vSpan([pk.n])));
      const T = [];
      tree(s, pk.n, 0, T, new Set());
      list('Driven by', T);
      list('Goes to', useLines([pk.n]));
      add(whyBox(s, pk.n));
    }
  }
  let AH = ls('ditl.ah') === '1',
    ahWas = null;
  /* retest #41: AUTO-HIDE while the Training panel is open (interaction.js AN.inspAuto); the user's setting comes back after */
  D.inspAuto = on => {
    if (on) {
      if (ahWas != null) return;
      ahWas = { AH, open };
      AH = true;
      if (!pk) open = false;
    } else if (ahWas != null) {
      ({ AH, open } = ahWas);
      ahWas = null;
    }
    upd();
  };
  function setPick(p, fromDrawing) {
    const s = cur();
    pk = p && s ? Object.assign({ s }, p) : null;
    buildSel();
    if (pk || AH) {
      if (window.LO && LO.setDi && pk) LO.setDi('sel');
      const want = AH ? !!pk : open || !!pk;
      if (want !== open) {
        open = want;
        if (!AH) ls('ditl.dp', open ? '1' : '0');
      }
    }
    upd();
    values();
    hl();
    dp.scrollTop = 0;
    return fromDrawing;
  }
  /* the click on the drawing (07-app-events.js pointerup, View and Run): a row cell, else a gate box, else a wire */
  D.pick = (s, h, e) => {
    try {
      if (h) {
        h = ownCell(s, h);
        return setPick({ t: 'row', i: h.i, side: RIGHT.includes(h.c) ? 'R' : 'L' }, 1);
      }
      const [x, y] = xy(e);
      let gi = -1,
        ar = 1e9;
      s.nl.gates.forEach((g, j) => {
        const b = g.box;
        if (b && x >= b.x1 - 0.8 && x <= b.x2 + 0.8 && y >= b.y1 - 0.8 && y <= b.y2 + 0.8) {
          const a = (b.x2 - b.x1) * (b.y2 - b.y1);
          if (a < ar) (ar = a), (gi = j);
        }
      });
      if (gi >= 0) return setPick({ t: 'g', g: gi }, 1);
      const q = nearSeg(s.nl, x, y, 1.6);
      setPick(q && q.n >= 0 ? { t: 'n', n: q.n } : null, 1);
    } catch (x) {
      console.error('DITL pick', x);
    }
  };
  D.sel = () => pk && { t: pk.t, i: pk.i, side: pk.side, g: pk.g, n: pk.n };
  D.labelOf = labelOf;
  D.goRef = goRef;
  D.setPick = p => setPick(p);
  addEventListener('keydown', e => e.key === 'Escape' && pk && !document.body.classList.contains('an') && setPick(null));
  /* the selection on the sheet (drawn again after every render) */
  function hl() {
    const svg = $('svg'),
      s = cur();
    if (!svg) return;
    svg.querySelectorAll('.dsel').forEach(x => x.remove());
    if (!pk || !s || pk.s !== s || !s.nl || document.body.classList.contains('an')) return;
    const G = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    G.setAttribute('class', 'dsel');
    const add = (t, a) => {
      const x = document.createElementNS('http://www.w3.org/2000/svg', t);
      for (const k in a) x.setAttribute(k, a[k]);
      G.append(x);
    };
    let nets = [];
    if (pk.t === 'row') {
      const r = s.rows[pk.i],
        VR = s.vr || s.rng;
      if (!r) return;
      const RB = (s.rb && s.rb[pk.i]) || [r.y - 3.3, r.y + 5.7],
        x1 = pk.side === 'R' ? VR.RS[0] : VR.F[0],
        x2 = pk.side === 'R' ? VR.RT[1] : VR.S[1];
      add('rect', { x: x1, y: -RB[1], width: x2 - x1, height: RB[1] - RB[0], class: 'dsel-box' });
      nets = rowNets(s, pk.i, pk.side);
    } else if (pk.t === 'g') {
      const g = s.nl.gates[pk.g],
        b = g && g.box;
      if (!b) return;
      add('rect', { x: b.x1 - 1, y: -b.y2 - 1, width: b.x2 - b.x1 + 2, height: b.y2 - b.y1 + 2, class: 'dsel-box' });
      nets = g.out || [];
    } else nets = [pk.n];
    s.nl.segs.forEach(q => nets.includes(q.n) && add('line', { x1: q.x1, y1: -q.y1, x2: q.x2, y2: -q.y2, class: 'dsel-w' }));
    svg.append(G);
  }
  /* Auto-hide (as the ABC panel): the panel opens when something is selected and closes when nothing is */
  function ahBox() {
    const ck = E('input', { type: 'checkbox' });
    ck.checked = AH;
    ck.onchange = () => {
      AH = ck.checked;
      ls('ditl.ah', AH ? '1' : '0');
      open = AH ? !!pk : true;
      upd();
    };
    return E('label', { cls: 'dp-ah', title: 'Hide this panel automatically when nothing is selected; it opens again when you click a row, a gate or a wire' }, [ck, document.createTextNode('Auto-hide')]);
  }
  function build() {
    const s = cur();
    dp.innerHTML = '';
    U = [];
    if (!s || !s.nl) return;
    const hd = E('div', { cls: 'dp-top' }, [
      E('b', { txt: (s.meta && s.meta.dwg) || s.name }),
      ahBox(),
      E('button', {
        txt: '✕',
        title: 'Hide panel (Panel button brings it back)',
        on: () => {
          open = false;
          ls('ditl.dp', '0');
          upd();
        }
      })
    ]);
    dp.append(hd, E('p', { cls: 'dp-note', txt: 'Run, then click an input to switch it. PB = press and hold. A dashed (auto) input follows the equipment or another sheet.' }), selBox);
    if (pk && pk.s !== s) pk = null;
    buildSel();
    /* inputs */
    const ins = [];
    s.rows.forEach((r, i) => {
      if (fbk(s, i, 'S')) ins.push(i);
    });
    if (ins.length) {
      dp.append(sec('Inputs', ins.length));
      ins.forEach(i => {
        const b = E('button', { cls: 'dp-v' });
        const row = E('div', { cls: 'dp-r' }, [
          E('div', { cls: 'dp-l' }, [
            E('div', { cls: 'dp-t', txt: (tagOf(s, i) || 'Row ' + (s.rows[i].n || i + 1)) + (txt(s, i, 'F') ? '  ← ' + txt(s, i, 'F') : txt(s, i, 'L') ? '  · ' + txt(s, i, 'L') : '') }),
            E('div', { cls: 'dp-d', txt: svcOf(s, i) })
          ]),
          b
        ]);
        swBtn(s, i, b, U);
        dp.append(row);
      });
    }
    /* analog inputs (they feed high / low limit comparators) */
    const AI = s.nl.an || [];
    if (AI.length) {
      dp.append(sec('Analog inputs', AI.length));
      AI.forEach(a => {
        const n = E('input', { type: 'number', step: 'any', cls: 'dp-n', title: 'Process value' + (a.unit ? ' (' + a.unit + ')' : '') }),
          st = E('div', { cls: 'dp-d' });
        n.value = anVal(s, a);
        n.onchange = () => {
          const x = parseFloat(n.value);
          if (!isFinite(x)) return;
          s.av = s.av || {};
          s.av[a.key] = x;
          s.nl.avk = avOf(s);
          render();
        };
        dp.append(E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-t', txt: (a.label || a.key).slice(0, 48) }), st]), n, E('span', { cls: 'dp-u', txt: a.unit || '' })]));
        U.push(() => {
          if (document.activeElement !== n) n.value = anVal(s, a);
          st.textContent = a.g
            .map(j => {
              const g = s.nl.gates[j];
              return (g.cmp === '>' ? 'High ' : 'Low ') + g.cmp + (g.eq ? '=' : '') + ' ' + (g.spNet !== undefined ? g.spVar : g.sp) + (g.unit || '') + (SIM ? (cmpOn(s, g) ? ' · ON' : ' · off') : '');
            })
            .join('   ');
        });
      });
    }
    /* timers */
    const T = tmList();
    if (T.length) {
      /* 3.2.0 P3 (audit M2): the floating timer card (#tp) no longer covers the drawing / this panel while the panel is open;
         its preset editor opens from here, beside the panel */
      const th = sec('Timers', T.length),
        te = E('button', {
          cls: 'dp-tpe',
          txt: document.body.classList.contains('tpon') ? 'Hide presets' : 'Edit presets',
          title: 'The timer presets (time and unit) of this sheet, in a card beside the panel',
          on: () => {
            const on = document.body.classList.toggle('tpon');
            te.textContent = on ? 'Hide presets' : 'Edit presets';
            const tp = $('tp');
            if (on && tp) {
              tp.style.setProperty('right', dp.getBoundingClientRect().width + 12 + 'px', 'important');
              try {
                TPMIN = false;
                buildTP();
              } catch (e) {}
            }
          }
        });
      dp.append(th, E('div', { cls: 'dp-r dp-tpr' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-d', txt: 'Presets as drawn; change them for a test' })]), te]));
      T.forEach(g => {
        const v = E('span', { cls: 'dp-tv' }),
          bar = E('span', { cls: 'dp-bar' }, [E('i')]),
          sk = E('button', {
            cls: 'dp-sk',
            txt: 'Skip',
            title: 'Finish this timer now',
            on: () => {
              if (!SIM) return;
              /* 3.2.0 Web Worker: an engine action (parts/03e-user.js), the engine finishes the timer too */
              ditlUser(s.name, 'skip', s.nl.gates.indexOf(g));
              render();
            }
          });
        dp.append(E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-t', txt: (g.tm.tag ? g.tm.tag + ' · ' : '') + KN[g.k] }), E('div', { cls: 'dp-tr' }, [bar, v])]), sk]));
        U.push(() => {
          const P = tmSecs(g.tm),
            acc = SIM || simOn() ? g.st.acc : 0;
          v.textContent = fmt(acc) + ' / ' + fmt(P) + ' · OUT ' + (g.st.out && simOn() ? '1' : '0');
          v.classList.toggle('on', !!(g.st.out && simOn()));
          bar.firstChild.style.width = Math.max(0, Math.min(100, (acc / Math.max(P, 1e-9)) * 100)) + '%';
          sk.disabled = !SIM;
        });
      });
    }
    /* valves (MOV / solenoid) and motors */
    const MV = s.nl.mv || [];
    if (MV.length) {
      dp.append(sec(MV[0].sv ? 'Solenoid valves' : 'Valves (MOV)', MV.length));
      MV.forEach((b, j) => {
        const v = E('div', { cls: 'dp-d' });
        dp.append(E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-t', txt: (b.sv ? 'SV ' : 'MOV ') + (b.tag || j + 1) }), v])]));
        U.push(() => (v.textContent = simOn() ? mvTxt(s, j) : 'View: no simulation'));
      });
    }
    if ((s.nl.mot || []).length) {
      const v = E('div', { cls: 'dp-d' });
      dp.append(sec('Motor'), E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [v])]));
      U.push(() => (v.textContent = simOn() ? motTxt(s) : 'View: no simulation'));
    }
    /* outputs (right side of the sheet) */
    const outs = [...new Set((s.nl.outs || []).map(o => o.row))].sort((a, b) => a - b);
    if (outs.length) {
      dp.append(sec('Outputs', outs.length));
      outs.forEach(i => {
        const v = E('span', { cls: 'dp-o' });
        dp.append(E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-t', txt: txt(s, i, 'RS') || 'row ' + (s.rows[i].n || i + 1) }), E('div', { cls: 'dp-d', txt: [txt(s, i, 'RL'), txt(s, i, 'RT') ? 'to ' + txt(s, i, 'RT') : ''].filter(Boolean).join(' · ') })]), v]));
        U.push(R => {
          const on = R ? R.outOn.has(i) : false;
          v.textContent = R ? (on ? '1' : '0') : '–';
          v.className = 'dp-o' + (on ? ' on' : '');
        });
      });
    }
    /* 2.5.0-beta.12: outputs drawn to the SB PANEL (sootblower DITL-80G / 80K) */
    const PO = s.nl.pout || [];
    if (PO.length) {
      dp.append(sec('Outputs to SB PANEL', PO.length));
      PO.forEach(o => {
        const v = E('span', { cls: 'dp-o' });
        dp.append(E('div', { cls: 'dp-r' }, [E('div', { cls: 'dp-l' }, [E('div', { cls: 'dp-t', txt: o.adr }), E('div', { cls: 'dp-d', txt: o.txt })]), v]));
        U.push(R => {
          const on = R ? !!(R.v && R.v[o.n]) : false;
          v.textContent = R ? (on ? '1' : '0') : '–';
          v.className = 'dp-o' + (on ? ' on' : '');
        });
      });
    }
    if (!ins.length && !AI.length && !T.length && !MV.length && !outs.length && !PO.length) dp.append(E('p', { cls: 'dp-note', txt: 'This sheet has no inputs or outputs (contents / table sheet).' }));
  }
  function values() {
    const s = cur();
    if (!s || !s.nl) return;
    let R = null;
    try {
      if (simOn()) R = simRead(s);
    } catch (e) {}
    U.concat(SU).forEach(f => {
      try {
        f(R);
      } catch (e) {}
    });
  }
  /* ---------- sheet header like the ABC (2.5.0-beta.13): drawing no., SHEET no · title, the mode badge, 1 / 0 legend, counts ---------- */
  const dm = E('div', { id: 'dmeta' }),
    dmode = E('span', { id: 'dmode' });
  if (mid && mid.parentNode) {
    mid.parentNode.insertBefore(dm, mid);
    document.body.classList.add('dm');
  }
  let dmKey = '';
  /* 3.2.0-beta.35: the machines of a drawing that is the same for A ~ D: one chip each; the picked one is the sheet shown (cur()) */
  const LETTERS = 'ABCD';
  const machChips = () => {
    const b = S.sheets[S.cur],
      L = b && window.WORLD && WORLD.instOf ? WORLD.instOf.get(b) : null;
    if (!L || L.length < 2) return null;
    const k = (S.mach && S.mach[S.cur]) || 0,
      fam = String(b.title || '').replace(/\s*\(\d\)\s*$/, '');
    return E(
      'span',
      { cls: 'dm-mach', title: 'The drawing is the same for these machines: each one has its own inputs, values and addresses' },
      L.map((x, i) => {
        const nm = i ? WORLD.showText(x, fam) : fam;
        const c = E('button', { type: 'button', cls: 'dm-m' + (i === k ? ' on' : ''), txt: (x._inst && x._inst.lbl) || LETTERS[i], title: (x._inst && x._inst.lbl) || nm });
        c.onclick = () => D.setMach(i);
        return c;
      })
    );
  };
  D.setMach = k => {
    S.mach = S.mach || {};
    S.mach[S.cur] = k || 0;
    dmKey = '';
    sel = null;
    render();
    upd();
  };
  function head() {
    const s = cur(),
      k = s ? S.cur + '|' + s.name + '|' + !!s.nl : '';
    if (k !== dmKey) {
      dmKey = k;
      dm.textContent = '';
      dm.classList.toggle('has', !!s);
      if (s) {
        const m = s.meta || {},
          nl = s.nl,
          nIn = s.rows.filter((r, i) => fbk(s, i, 'S')).length,
          nOut = nl ? new Set((nl.outs || []).map(o => o.row)).size : 0;
        const ttl = isK(s) ? WORLD.showText(s, s._inst.base.title || '') : m.title || s.title || '';
        dm.append(
          E('b', { txt: (m.dwg || s.name).replace(/\s*#[B-D]$|\s*#MV-\S+$/, '') + (isK(s) || (s._inst && s._inst.lbl) ? ' · ' + (s._inst.lbl || LETTERS[s._inst.k]) : '') }),
          E('span', { cls: 'dm-t', txt: (m.no ? 'SHEET ' + m.no + ' · ' : '') + ttl, title: (m.no ? 'SHEET ' + m.no + ' · ' : '') + ttl }),
          /* 3.2.0-beta.40 (bug): a sheet of one machine has no chips; append(null) wrote the text "null" in the header */
          machChips() || '',
          dmode,
          E('span', { cls: 'sp' }),
          E('span', { cls: 'dm-lg' }, [E('i', { cls: 'on' }), document.createTextNode(' 1 = ON  '), E('i'), document.createTextNode(' 0 = OFF')]),
          E('small', { txt: nIn + ' inputs · ' + (nl ? nl.gates.length : 0) + ' gates / timers · ' + nOut + ' outputs · ' + ditlCat(s) })
        );
      }
    }
    const t = SIM ? 'SIMULATION - RUNNING' : 'VIEW / TRACE - NO SIMULATION';
    if (dmode._t !== t) {
      dmode._t = dmode.textContent = t;
      dmode.className = SIM ? 'run' : 'view';
      dmode.title = SIM
        ? 'RUN: the DITL logic is computed with the inputs you set (red = 1, green = 0)'
        : 'VIEW / TRACE: the drawing is shown and a row, gate or wire can be selected and traced, but nothing is simulated';
    }
  }
  /* live check #90: the Legend of the DITL page (the ribbon Legend button opens it on a DITL sheet; the ABC one is #anlg of paint.js).
     ×, Esc and a click outside close it, like the ABC legend */
  {
    const d = E('div', { id: 'dilg' }),
      it = (sw, t) => E('div', { cls: 'it' }, [sw, document.createTextNode(t)]),
      ln = c => {
        const v = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        v.setAttribute('width', '24');
        v.setAttribute('height', '13');
        v.innerHTML = '<line x1="0" y1="6" x2="24" y2="6" stroke="' + c + '" stroke-width="2.2"/>';
        return v;
      },
      x = E('button', { cls: 'dilgx', txt: '×', title: 'Close the legend', on: () => (d.style.display = 'none') });
    d.append(
      x,
      E('b', { txt: 'Signals (RUN)' }),
      it(ln('var(--c-run,#e5484d)'), 'red = 1 (ON, energized)'),
      it(ln('var(--c-stop,#30a46c)'), 'green = 0 (OFF)'),
      it(ln('#8a949c'), 'grey = VIEW / TRACE: nothing is simulated'),
      E('b', { txt: 'Rows' }),
      it(E('span', { cls: 'tg', txt: 'IN' }), 'left: inputs (field contact I.xxxx, memory M.xxxx / B.xxxx of the DCS, a row of another sheet)'),
      it(E('span', { cls: 'tg', txt: 'OUT' }), 'right: outputs (command, memory, alarm, TO another sheet)'),
      it(E('span', { cls: 'tg', txt: 'AI' }), 'analog row: the value of the plant against its set point (comparator)'),
      E('b', { txt: 'Symbols' }),
      it(E('span', { cls: 'tg', txt: '&' }), 'AND: 1 when every input is 1'),
      it(E('span', { cls: 'tg', txt: '≥1' }), 'OR: 1 when one input is 1'),
      it(E('span', { cls: 'tg', txt: 'NOT' }), 'NOT: the inverse of its input'),
      it(E('span', { cls: 'tg', txt: 'S R' }), 'flip-flop: S sets it to 1 and it stays; R resets it to 0'),
      it(E('span', { cls: 'tg', txt: 'T' }), 'timers: ON delay, OFF delay, pulse (time on the symbol)'),
      it(E('span', { cls: 'tg', txt: '→' }), 'TO / FROM flag: click it to go to the other sheet; Back returns'),
      E('small', { txt: 'Reference: document-references/digital logic symbols legend.pdf' })
    );
    document.body.append(d);
    addEventListener('keydown', e => e.key === 'Escape' && d.style.display === 'block' && (d.style.display = 'none'), true);
    addEventListener(
      'pointerdown',
      e => {
        if (d.style.display !== 'block' || d.contains(e.target)) return;
        const b = e.target.closest && e.target.closest('button');
        if (b && /^Legend/.test(b.textContent.trim())) return;
        d.style.display = 'none';
      },
      true
    );
  }
  /* ---------- state of the bar and the panel ---------- */
  let tab = null;
  function upd() {
    head();
    dp.classList.toggle('view', !SIM);
    run.classList.toggle('on', SIM);
    view.classList.toggle('on', !SIM);
    panel.classList.toggle('on', open);
    const dit = !document.body.classList.contains('an'),
      was = dp.classList.contains('min');
    dp.classList.toggle('min', !open || !dit);
    if (dit && was !== dp.classList.contains('min')) setTimeout(() => dispatchEvent(new Event('resize')), 30);
    if (tab) tab.style.display = dit && !open && document.body.dataset.tab === 'logic' ? 'block' : 'none';
    {
      /* ABC's own side tab only on the ABC page, and always there while the ABC panel is closed */
      const at = $('anptab'),
        ap = $('anp');
      if (at && ap) at.style.display = !dit && ap.classList.contains('min') && document.body.dataset.tab === 'logic' ? 'block' : 'none';
    }
    if (!dit || !open) return;
    const s = cur(),
      k = S.cur + '|' + (s && s.name) + '|' + !!(s && s.nl) + '|' + (s && s.nl && s.nl.v);
    if (k !== key) {
      key = k;
      build();
    }
    values();
  }
  D.upd = upd;
  setInterval(upd, 300);
  /* 2.4.1-beta.6 (user): a side tab brings the closed panel back, like ◀ Panel on ABC */
  tab = E('button', { id: 'dptab', txt: '◀ Panel', title: 'Show the right panel' });
  tab.onclick = () => {
    open = true;
    ls('ditl.dp', '1');
    upd();
  };
  document.body.append(tab);
  /* 2.4.1-beta.6 (user: "hindi smooth"): the panel follows a switch ABC <-> DITL or a tab change at once, not up to 0.3 s later
     (the drawing used to take the full width for a moment and then shrink) */
  new MutationObserver(() => upd()).observe(document.body, { attributes: true, attributeFilter: ['class', 'data-tab'] });
  /* the drawing title is not edited any more; the L / C / R and size of the title stay as they are */
  const noEdit = () => {
    document.querySelectorAll('#meta [contenteditable]').forEach(e => e.setAttribute('contenteditable', 'false'));
    ['bundo', 'bredo', 'bclr', 'bdel', 'bwire', 'bsave', 'wp', 'ed'].forEach(id => {
      const e = $(id);
      if (e) e.hidden = true;
    });
    ['fdxf', 'fjson'].forEach(id => {
      const l = $(id) && $(id).closest('label');
      if (l) l.hidden = true;
    });
    const bm = mode();
    if (bm) bm.hidden = true;
    const mc = $('mctl');
    if (mc) mc.hidden = true;
  };
  noEdit();
  setTimeout(noEdit, 1500);
})();
