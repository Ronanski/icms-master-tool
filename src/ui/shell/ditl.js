/* 2.4.1-beta.4 (user 2026-10-19): the DITL page works like the ABC page. The drawing is the one read from the DXF (no edit tools);
   the tool bar has Run / Pause, ▶▶ (one step), step, speed, Reset, View, Fit, Zoom and Panel, and a right panel lists the
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
  const D = (window.DUI = {});
  const mode = () => $('bmode');
  /* SIM on = the DITL states start again (the old Simulate button) */
  const enter = () => {
    if (!SIM) mode().click();
  };
  /* ---------- tool bar ---------- */
  const run = E('button', { cls: 'tb-run dui-run', txt: '▶ Run', title: 'Run the DITL logic (timers, valves, motors); Pause stops the time' });
  const next = E('button', { cls: 'tb-step', txt: '▶▶', title: 'One step forward (paused)' });
  const stepSel = E('select', { cls: 'tb-step', title: 'Length of one step' });
  [1, 5, 10, 60].forEach(v => stepSel.append(E('option', { value: v, txt: v + ' s' })));
  const speed = E('select', { title: 'Speed of the time while running' });
  [1, 10, 60, 300].forEach(v => speed.append(E('option', { value: v, txt: v + 'x' })));
  const reset = E('button', { txt: 'Reset', title: 'All inputs OFF, timers, latches, valves and motors back to the start' });
  const view = E('button', { cls: 'tb-view', txt: 'View', title: 'View the drawing without simulation' });
  const zoom = E('button', { txt: 'Zoom', title: 'Zoom to readable text (12 px) on the selected cell; Fit shows the whole sheet again' });
  const panel = E('button', { txt: 'Panel', title: 'Show / hide the right panel (inputs, timers, outputs)' });
  run.onclick = () => {
    if (!SIM) {
      enter();
      DPAUSE = false;
    } else DPAUSE = !DPAUSE;
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
  next.onclick = () => {
    if (!SIM) enter();
    DPAUSE = true;
    const dt = +stepSel.value || 1;
    if (window.WORLD && WORLD.on && WORLD.idx) WORLD.tick(dt);
    else ditlStep(dt);
    render();
    upd();
  };
  speed.onchange = () => (TSP = +speed.value || 1);
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
  let open = ls('ditl.dp') !== '0';
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
  const refs = t => {
    const o = [],
      s = String(t || ''),
      used = [];
    let m;
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
    const RD = /\(?\s*([0-9]{1,3}[A-Z]?)\s*-\s*(\d{1,2})\s*\)?/gi;
    while ((m = RD.exec(s))) {
      if (used.some(u => m.index >= u[0] && m.index < u[1])) continue;
      const code = (/^\d[A-Z]?$/i.test(m[1]) ? '0' : '') + m[1].toUpperCase();
      o.push({ code, nn: +m[2] });
    }
    return o.filter((r, i) => o.findIndex(q => q.abc === r.abc && q.code === r.code && q.nn === r.nn) === i);
  };
  const sheetOf = code => {
    let i = S.sheets.findIndex(x => new RegExp('DITL-' + code + '$', 'i').test(x.name));
    if (i < 0 && /[A-Z]$/.test(code)) i = S.sheets.findIndex(x => new RegExp('DITL-' + code.replace(/[A-Z]$/, '') + '$', 'i').test(x.name));
    return i;
  };
  const labelOf = r => {
    if (r.abc) return r.abc + ' (analog)';
    const i = sheetOf(r.code);
    return (i >= 0 ? S.sheets[i].name : 'DITL-' + r.code) + ' item ' + r.nn + (r.nn > 50 ? ' (output row ' + (r.nn - 50) + ')' : ' (input row ' + r.nn + ')');
  };
  const linkCell = (s, h) => h && (h.c === 'F' || h.c === 'RT') && refs((s.cells[h.k] || []).map(t => t.t).join(' '));
  function updBack() {
    back.style.display = hist.length ? '' : 'none';
  }
  let FL = null;
  D.after = () => FL && Date.now() < FL.until && cur() === FL.s && flashRow(FL.s, FL.i, FL.side, 1);
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
  function goItem(i, nn, from) {
    const s0 = cur(),
      v0 = (VB[S.cur] || []).slice();
    hist.push(from || { cat: 'dig', i: S.cur, vb: v0 });
    updBack();
    if (from && window.AN && AN.cat === 'an') AN.setCat('dig');
    S.cur = i;
    sel = null;
    render();
    const s = cur(),
      side = nn > 50 ? 'R' : 'L',
      ri = s.rows.findIndex(r => +r.n === (nn > 50 ? nn - 50 : nn)),
      v = VB[S.cur];
    if (ri < 0 || !v) {
      msg(s.name + ': item ' + nn + ' is not on this sheet (the sheet is open).');
      return true;
    }
    const VR = s.vr || s.rng,
      cx = side === 'R' ? (VR.RS[0] + VR.RT[1]) / 2 : (VR.F[0] + VR.S[1]) / 2;
    if (s0 !== s && v0.length) {
      v[2] = v0[2];
      v[3] = v0[3];
    }
    v[0] = cx - v[2] / 2;
    v[1] = -s.rows[ri].y - v[3] / 2;
    $('svg').setAttribute('viewBox', v.join(' '));
    /* from the ABC the page switch draws the sheet once more: blink after it */
    flashRow(s, ri, side);
    msg(s.name + ' item ' + nn + (side === 'R' ? ' (output row ' : ' (input row ') + s.rows[ri].n + '). ◀ Back returns.');
    return true;
  }
  function goRef(r) {
    if (r.abc) {
      if (!window.AN) return false;
      hist.push({ cat: 'dig', i: S.cur, vb: (VB[S.cur] || []).slice() });
      updBack();
      AN.setCat('an');
      let n = 0;
      const t = setInterval(() => {
        const j = (AN.sheets || []).findIndex(x => x.name === r.abc);
        if (j >= 0 || ++n > 50) {
          clearInterval(t);
          if (j >= 0) AN.go(j);
          msg(j >= 0 ? r.abc + ' opened. DITL ◀ Back returns to the DITL sheet.' : r.abc + ' is not in the ABC page.');
        }
      }, 120);
      return true;
    }
    const i = sheetOf(r.code);
    if (i < 0) {
      msg('DITL-' + r.code + ' is not in the DITL page (' + r.code + '-' + r.nn + ').');
      return true;
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
            closePick();
            goRef(r);
          }
        })
      )
    );
    pick.hidden = false;
    const w = pick.offsetWidth,
      hh = pick.offsetHeight;
    pick.style.left = Math.max(8, Math.min(innerWidth - w - 8, e.clientX - w / 2)) + 'px';
    pick.style.top = Math.max(8, Math.min(innerHeight - hh - 8, e.clientY + 12)) + 'px';
    return true;
  };
  D.goItem = goItem;
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
  D.bar = fit => [back, run, next, stepSel, speed, reset, view, E('span', { cls: 'dui-sep' }), fit, zoom, panel];
  /* ---------- right panel ---------- */
  const dp = E('div', { id: 'dp' });
  const mid = $('mid');
  if (mid) mid.append(dp);
  const txt = (s, i, c) =>
    (s.cells[i + ':' + c] || [])
      .map(t => t.t)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  /* the TAG NO. column holds the address (I.0406, M.0378) and, on many sheets, the service text too */
  const ADR = /^[A-Z]{1,3}\.[0-9A-F]{3,5}[A-Z]?$/;
  const tagOf = (s, i) => (s.cells[i + ':T'] || []).map(t => t.t.trim()).filter(t => ADR.test(t)).join(' ');
  const svcOf = (s, i) =>
    (s.cells[i + ':T'] || [])
      .concat(s.cells[i + ':S'] || [])
      .map(t => t.t.trim())
      .filter(t => t && !ADR.test(t))
      .join(' ');
  const fmt = x => (x >= 60 ? (x / 60).toFixed(1) + ' min' : x.toFixed(1) + ' s');
  let key = '',
    U = []; /* value updaters of the built panel */
  function sec(title, n) {
    return E('div', { cls: 'dp-h', txt: title + (n != null ? ' (' + n + ')' : '') });
  }
  function build() {
    const s = cur();
    dp.innerHTML = '';
    U = [];
    if (!s || !s.nl) return;
    const hd = E('div', { cls: 'dp-top' }, [
      E('b', { txt: (s.meta && s.meta.dwg) || s.name }),
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
    dp.append(hd, E('p', { cls: 'dp-note', txt: 'Run, then click an input to switch it. PB = press and hold. A dashed (auto) input follows the equipment or another sheet.' }));
    /* inputs */
    const ins = [];
    s.rows.forEach((r, i) => {
      if (fbk(s, i, 'S')) ins.push(i);
    });
    if (ins.length) {
      dp.append(sec('Inputs', ins.length));
      ins.forEach(i => {
        const k = i + ':S',
          pb = isPB(s, i),
          grpT = (s.nl.grp || []).some(g => g.master === i && g.toggle),
          b = E('button', { cls: 'dp-v' });
        const row = E('div', { cls: 'dp-r' }, [
          E('div', { cls: 'dp-l' }, [
            E('div', { cls: 'dp-t', txt: (tagOf(s, i) || 'Row ' + (s.rows[i].n || i + 1)) + (txt(s, i, 'F') ? '  ← ' + txt(s, i, 'F') : txt(s, i, 'L') ? '  · ' + txt(s, i, 'L') : '') }),
            E('div', { cls: 'dp-d', txt: svcOf(s, i) })
          ]),
          b
        ]);
        const auto = () => lockd(s, i) || !!(window.WORLD && WORLD.live && s._win && s._win.has(i));
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
            if (auto()) return;
            e.preventDefault();
            if (!SIM) enter();
            t0 = Date.now();
            s.sig[k] = true;
            render();
          };
          b.onpointerup = b.onpointerleave = b.onpointercancel = off;
        } else
          b.onclick = () => {
            if (auto()) {
              msg('This input follows the equipment or another sheet, it is not switched by hand.');
              return;
            }
            if (!SIM) {
              enter();
              DPAUSE = false;
            }
            s.sig[k] = !s.sig[k];
            render();
          };
        U.push(R => {
          const on = R ? R.rowOn.has(i) : false,
            a = auto();
          b.textContent = pb && !grpT ? (on ? 'PRESSED' : 'PRESS') : on ? '1 · ON' : '0 · OFF';
          b.className = 'dp-v' + (on ? ' on' : '') + (pb && !grpT ? ' pb' : '') + (a ? ' auto' : '');
        });
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
      dp.append(sec('Timers', T.length));
      T.forEach(g => {
        const v = E('span', { cls: 'dp-tv' }),
          bar = E('span', { cls: 'dp-bar' }, [E('i')]),
          sk = E('button', {
            cls: 'dp-sk',
            txt: 'Skip',
            title: 'Finish this timer now',
            on: () => {
              if (!SIM) return;
              const vv = simulate(s.nl, simIn(s));
              tmStep(
                g,
                g.ins.some(q => vv[q]),
                tmSecs(g.tm) + 1
              );
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
    if (!ins.length && !AI.length && !T.length && !MV.length && !outs.length) dp.append(E('p', { cls: 'dp-note', txt: 'This sheet has no inputs or outputs (contents / table sheet).' }));
  }
  function values() {
    const s = cur();
    if (!s || !s.nl) return;
    let R = null;
    try {
      if (simOn()) R = simSheet(s);
    } catch (e) {}
    U.forEach(f => {
      try {
        f(R);
      } catch (e) {}
    });
  }
  /* ---------- state of the bar and the panel ---------- */
  let tab = null;
  function upd() {
    const running = SIM && !DPAUSE;
    run.textContent = running ? '❚❚ Pause' : '▶ Run';
    run.classList.toggle('on', running);
    view.classList.toggle('on', !SIM);
    panel.classList.toggle('on', open);
    if (+speed.value !== TSP) speed.value = TSP;
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
