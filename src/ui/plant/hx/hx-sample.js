/* HX SAMPLE adapter: only for the mockup. It answers HX.data from hx-registry.js (what the app showed at "Start at 150 MW",
   3.2.3-beta.272) with a small slow ripple so the trends move, and it opens a SAMPLE faceplate. In the app this whole file is
   replaced by the real adapter (README, "Putting it in the app"): nothing in hx-core.js or hx-pages.js changes. */
(function () {
  const R = window.HXREG,
    S = R.sample,
    t0 = Date.now() / 1000;
  const st = Object.assign({}, S.states),
    lp = JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(R.loops).map(([k, v]) => [k, v.s || null])))),
    vv = JSON.parse(JSON.stringify(S.valves));
  const ph = {};
  const rip = (k, t) => {
    const p = ph[k] || (ph[k] = [...k].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7) / 50);
    return 0.004 * Math.sin(t / 97 + p) + 0.002 * Math.sin(t / 31 + p * 2.3);
  };
  const vAt = (k, t) => {
    const v = S.values[k];
    /* a valve or damper at its end stop (0 or 100) does not ripple */
    return v == null ? null : v === 0 || v === 100 ? v : v * (1 + rip(k, t));
  };
  const lAt = (tag, t) => {
    const s = lp[tag];
    if (!s) return null;
    const o = Object.assign({}, s);
    if (o.pv) o.pv = o.pv * (1 + rip(tag, t) * 0.6);
    if (o.mv) o.mv = Math.max(0, Math.min(100, o.mv * (1 + rip(tag + 'm', t) * 1.5)));
    return o;
  };
  const now = () => Date.now() / 1000 - t0 + 7200;
  const keyAt = (key, t) => {
    const k = key.slice(0, 3);
    if (k === 'pv:' || k === 'sv:' || k === 'mv:') return (lAt(key.slice(3), t) || {})[k.slice(0, 2)] ?? null;
    if (key.slice(0, 2) === 'x:') {
      const v = vv[key.slice(2)] || {};
      return v.pct != null ? v.pct : v.open == null ? null : v.open ? 100 : 0;
    }
    return vAt(key, t);
  };
  /* ---- the two mini pop-ups: content from hx-cards.js (the rows the app reads from its logic), state kept here ---- */
  const CARDS = window.HXCARDS || { valves: {}, loops: {} },
    fieldNow = {},
    amNow = {};
  const modeWord = m =>
    /MAN/i.test(m || '') ? 'Manual' : /REM/i.test(m || '') ? 'Remote' : /AUT/i.test(m || '') ? 'Auto' : null;
  const vOpen = tag => {
    const v = vv[tag] || {};
    return v.open != null ? v.open : v.pct != null ? v.pct > 1 : null;
  };
  const permOf = tag => {
    const c = CARDS.valves[tag];
    if (!c) return vv[tag] ? true : null;
    return (fieldNow[tag] || 'Remote') !== 'Local' && c.perms.every(p => (/REMOTE/.test(p.t) ? 1 : p.is) === p.need);
  };
  function card(kind, id) {
    if (kind === 'loop') {
      const c = CARDS.loops[id],
        s = lAt(id, now()) || {},
        reg = R.loops[id] || {};
      if (!c && !lp[id]) return null;
      const C = c || {},
        modes = (C.modes || []).map(m => ({ R: 'Remote', A: 'Auto', M: 'Manual', MAN: 'Manual' })[m]),
        pv = s.pv != null ? s.pv : C.pv != null ? C.pv * (1 + rip(id, now()) * 0.6) : null;
      return {
        name: reg.t || C.name || id,
        tag: id + (C.name ? ' · ' + C.name.replace(/^#1 /, '') : ''),
        pv,
        sv: s.sv != null ? s.sv : null,
        mv: s.mv != null ? s.mv : null,
        unit: (C.unit || s.unit || '').replace('cm2', 'cm²'),
        dp: C.hi != null && C.hi <= 15 ? 2 : 1,
        lo: C.lo,
        hi: C.hi,
        modes,
        mode: modeWord(s.mode) || (modes.length === 1 ? 'Manual' : null),
        svFree: !/from the logic/i.test(C.note || '') && !/^REMOTE/i.test(C.note || ''),
        note:
          {
            'REMOTE: AUTO, SV from the logic path': 'Remote: the set point comes from the logic.',
            'LOCAL: operator SV (COS)': 'Local set point: the operator gives it.',
            'SV: operator (COS)': 'The operator gives the set point.',
            'SV: from the logic path': 'The set point comes from the logic.'
          }[C.note] || '',
        trend: [
          ['Measured', 'pv:' + id, C.unit || '', 1],
          ['Output', 'mv:' + id, '%', 1]
        ]
      };
    }
    const c = CARDS.valves[id],
      v = vv[id],
      m = R.machines[id] || {};
    if (!c && !v && !st[id]) return null;
    if (kind === 'mach' && st[id])
      return {
        name: m.t && m.t.length > 14 ? m.t : id,
        tag: id,
        sheet: (m.bind && (m.bind.ad || '')) || '',
        state: st[id],
        cmds: ['start', 'stop'],
        perms: [],
        reads: [],
        mon: []
      };
    const C = c || { perms: [], reads: [], mon: [] },
      o = vOpen(id);
    return {
      name: m.t && m.t.length > 14 ? m.t : (C.title || id).replace(/^.*SYSTEM /, ''),
      tag: id,
      sheet: C.sheet || (v && v.bind) || '',
      state: o == null ? null : o ? 'open' : 'closed',
      pct: v && v.pct != null ? v.pct : o == null ? null : o ? 100 : 0,
      field: C.field ? ['Remote', 'Local'] : null,
      fieldNow: fieldNow[id] || 'Remote',
      am: C.am ? ['Auto', 'Manual'] : null,
      amNow: amNow[id] || (v && /AUTO/i.test(v.mode || '') && !/MANUAL/i.test(v.mode || '') ? 'Auto' : 'Manual'),
      cmds: C.stop ? ['open', 'stop', 'close'] : ['open', 'close'],
      perms: C.perms.map(p =>
        Object.assign({}, p, /REMOTE/.test(p.t) ? { is: (fieldNow[id] || 'Remote') === 'Local' ? 0 : 1 } : {})
      ),
      reads: C.reads,
      mon: C.mon.map(p =>
        /FULL(Y)? ?OPEN/.test(p.t)
          ? Object.assign({}, p, { is: o ? 1 : 0 })
          : /FULL(Y)? ?CLOSED|SOV CLOSED/.test(p.t)
            ? Object.assign({}, p, { is: o ? 0 : 1 })
            : p
      ),
      trend: [['Position', 'x:' + id, '%', 0]]
    };
  }
  function act(kind, id, cmd, val) {
    if (kind === 'loop') {
      const s = lp[id] || (lp[id] = {});
      if (cmd === 'mode') s.mode = String(val).toUpperCase();
      if (cmd === 'mv') s.mv = Math.max(0, Math.min(100, (s.mv || 0) + +val));
      if (cmd === 'sv') s.sv = (s.sv != null ? s.sv : s.pv || 0) + +val;
      return;
    }
    if (cmd === 'field') fieldNow[id] = val;
    if (cmd === 'am') amNow[id] = val;
    if (cmd === 'open' || cmd === 'close')
      vv[id] = Object.assign(
        {},
        vv[id],
        { open: cmd === 'open' },
        vv[id] && vv[id].pct != null ? { pct: cmd === 'open' ? 100 : 0 } : {}
      );
    if (cmd === 'start' || cmd === 'stop') st[id] = cmd === 'start' ? 'run' : 'stop';
  }
  HX.data = {
    time: now,
    value: k => vAt(k, now()),
    machine: n =>
      st[n]
        ? { st: st[n], mode: S.modes[n] || null, perm: true }
        : R.machines[n]
          ? { st: null, mode: null, perm: null }
          : null,
    loop: tag => lAt(tag, now()),
    valve: tag => (vv[tag] ? Object.assign({}, vv[tag], { perm: permOf(tag) }) : null),
    flag: () => true,
    card,
    act,
    open: (kind, id, second) => face(kind, id, second)
  };
  /* the history that a real recorder would already hold: two hours, so the Trends view is not empty on the first look */
  const watch = HX.rec.watch;
  HX.rec.watch = key => {
    const had = HX.rec.buf[key],
      b = watch(key);
    if (!had) for (let t = now() - 7200; t < now(); t += HX.rec.step * 5) b.push([t, keyAt(key, t)]);
    return b;
  };

  /* ---- sample faceplate (the app opens its own two faceplates instead) ---- */
  const css = document.createElement('style');
  css.textContent =
    '.hx-fp{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:min(300px,calc(100vw - 32px));background:var(--hx-panel);border:1px solid var(--hx-ink2);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.22);z-index:20;font-family:var(--hx-font);color:var(--hx-ink)}' +
    '.hx-fp header{display:flex;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--hx-rule)}.hx-fp header b{font-size:14px;line-height:1.25}.hx-fp header small{display:block;font:500 10.5px var(--hx-mono);color:var(--hx-mute)}' +
    '.hx-fp .x{border:0;background:none;font-size:18px;line-height:1;padding:2px 6px;border-radius:6px}.hx-fp .bd{padding:10px 12px;display:grid;gap:8px;font-size:13px}.hx-fp .bt{display:flex;gap:6px;flex-wrap:wrap}' +
    '.hx-fp .bt button{flex:1;min-height:36px;border:1px solid var(--hx-ink2);background:var(--hx-panel);border-radius:8px;font-weight:600}.hx-fp .bt button.on{background:var(--hx-ink);color:var(--hx-panel)}' +
    '.hx-fp .kv{display:flex;justify-content:space-between}.hx-fp .kv b{font:600 14px var(--hx-mono)}.hx-fp .nt{font-size:11.5px;color:var(--hx-mute);border-top:1px solid var(--hx-rule);padding-top:7px}';
  document.head.append(css);
  let fp = null;
  const f1 = v => (v == null ? '-----' : (+v).toFixed(1));
  function face(kind, id, second) {
    if (fp) fp.remove();
    const m = R.machines[id] || {},
      l = R.loops[id] || {};
    fp = document.createElement('div');
    fp.className = 'hx-fp';
    fp.setAttribute('role', 'dialog');
    const title = second
      ? 'Permissive · trend · monitor'
      : kind === 'loop'
        ? 'Control loop'
        : kind === 'valve'
          ? 'Valve'
          : 'Machine';
    const draw = () => {
      let b = '';
      if (second)
        b = `<div class="kv"><span>Permissive</span><b>complete (Y)</b></div><div>Here the app shows the permissive list of ${id}, its trend and its monitor values.</div>`;
      else if (kind === 'mach')
        b = `<div class="kv"><span>State</span><b>${st[id] || '-----'}</b></div><div class="bt"><button data-a="run" class="${st[id] === 'run' ? 'on' : ''}">Start</button><button data-a="stop" class="${st[id] === 'stop' ? 'on' : ''}">Stop</button></div>`;
      else if (kind === 'loop') {
        const s = lp[id] || {};
        b = `<div class="kv"><span>Measured</span><b>${f1(s.pv)} ${s.unit || ''}</b></div><div class="kv"><span>Set point</span><b>${f1(s.sv)} ${s.unit || ''}</b></div><div class="kv"><span>Output</span><b>${f1(s.mv)} %</b></div><div class="bt"><button data-a="AUTO" class="${/AUT/.test(s.mode) ? 'on' : ''}">Auto</button><button data-a="MANUAL" class="${/MAN/.test(s.mode) ? 'on' : ''}">Manual</button></div><div class="bt"><button data-a="dn">Output − 5</button><button data-a="up">Output + 5</button></div>`;
      } else if (kind === 'valve') {
        const v = vv[id] || {},
          o = v.open != null ? v.open : v.pct > 1;
        b = `<div class="kv"><span>Position</span><b>${o ? 'Open' : 'Closed'}</b></div><div class="bt"><button data-a="open" class="${o ? 'on' : ''}">Open</button><button data-a="close" class="${o ? '' : 'on'}">Close</button></div>`;
      }
      fp.innerHTML = `<header><div><b>${title}: ${m.t && m.t.length > 14 ? m.t : l.t || id}</b><small>${id}${m.bind && (m.bind.ad || m.bind.mov) ? ' · ' + (m.bind.ad || m.bind.mov) : ''}</small></div><button class="x" aria-label="Close">×</button></header><div class="bd">${b}<div class="nt">Sample faceplate of the mockup. In the app this click opens the existing ${second ? 'permissive / trend / monitor' : 'control'} faceplate.</div></div>`;
    };
    draw();
    fp.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (e.target.classList.contains('x')) return fp.remove();
      if (!a) return;
      if (kind === 'mach') st[id] = a;
      if (kind === 'loop') {
        const s = lp[id] || (lp[id] = {});
        if (a === 'AUTO' || a === 'MANUAL') s.mode = a;
        else s.mv = Math.max(0, Math.min(100, (s.mv || 0) + (a === 'up' ? 5 : -5)));
      }
      if (kind === 'valve')
        vv[id] = Object.assign({}, vv[id], {
          open: a === 'open',
          pct: vv[id] && vv[id].pct != null ? (a === 'open' ? 100 : 0) : undefined
        });
      draw();
    });
    document.body.append(fp);
  }
})();
