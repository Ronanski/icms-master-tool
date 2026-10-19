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
  D.bar = fit => [run, next, stepSel, speed, reset, view, E('span', { cls: 'dui-sep' }), fit, zoom, panel];
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
