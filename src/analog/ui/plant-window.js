/* ===================== PLANT WINDOW ===================== */
AN.plantUi = { open: false, page: 'reheater', sheets: [] };
AN.plantSheets = [];
const plNorm = t => String(t || '').trim();
/* ---- address registry: one IO address (AI) = one value on every sheet ---- */
function plAIs() {
  const sig = AN.sheets.filter(s => s.S).length;
  if (AN._plAI && AN._plAI.n === sig) return AN._plAI.m;
  const m = new Map();
  for (const sh of AN.sheets) {
    if (/ABC-000/.test(sh.name) || !sh.S) continue;
    for (const b of sh.S.blk) {
      if (b.k !== 'AI' || b.fb || !b.tagAI) continue;
      let k = null;
      try {
        const a = AN.adesFind(sh, b.tagAI);
        k = a && a.rec && a.rec.tag;
      } catch (e) {}
      if (!k) continue;
      const o = b.pins.find(p => p.role === 'out');
      if (!o) continue;
      const L = m.get(k) || [];
      L.push({ sh, S: sh.S, b, id: b.id, n: o.n });
      m.set(k, L);
    }
  }
  AN._plAI = { n: sig, m };
  return m;
}
/* ---- one value of the window: resolves to (sheet, wire) so that the HMI ownership code (state, F box, write) is reused ---- */
function plRes(o) {
  if (o.ai) {
    const L = plAIs().get(o.ai);
    if (!L || !L.length) return null;
    const x = L.find(q => procAI(q.S, q.id)) || L[0];
    return { sheet: x.sh.name, nn: x.n, rng: x.b.rng };
  }
  if (o.pid) {
    const bb = hmiBlk({ addr: o.pid });
    if (!bb) return null;
    const q = hmiNets(bb.sh, bb.b).find(z => z.name === o.pin);
    if (!q) return null;
    const P = bb.b.p || {};
    return { sheet: bb.sh.name, nn: q.n, rng: o.pin === 'MV' ? { lo: 0, hi: 100 } : { lo: +P.rlo, hi: +P.rhi } };
  }
  return null;
}
const plVal = r => {
  if (!r) return null;
  const sh = AN.sheets.find(s => s.name === r.sheet);
  if (!sh || !sh.S || !sh.S.rt || !sh.S.rt.v) return null;
  const v = sh.S.rt.v[r.nn];
  return v == null || !isFinite(v) ? null : v;
};
const PL_SV = 'http://www.w3.org/2000/svg';
const PL_C = {
  steam: '#e0242b',
  steamOff: '#4a1a1d',
  water: '#23bfe3',
  waterOff: '#17414b',
  txt: '#e6edf3',
  val: '#2fe3f5',
  dim: '#7f8d96',
  ok: '#35e08a',
  bad: '#ff4d4d'
};
function plBuild(root, page, upd, sheetsNeeded) {
  const W = 1500,
    H = 940,
    svg = hs$('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'xMidYMid meet',
      style: 'width:100%;height:100%;background:#000;display:block'
    });
  const ow = () => root.ownerDocument.defaultView || window,
    at = (x, y, s, o) => {
      const t = ht$(
        s,
        Object.assign({ x, y, fill: PL_C.txt, 'font-size': 12, 'font-family': 'Georgia,serif' }, o || {})
      );
      svg.append(t);
      return t;
    };
  const need = r => {
    if (r && sheetsNeeded.indexOf(r.sheet) < 0) sheetsNeeded.push(r.sheet);
  };
  /* pipe: steam / water, dims while the valve it hangs on is closed */
  const pipe = (pts, k) => {
    const o = { g: null },
      l = hs$('polyline', {
        points: pts.map(p => p.join(',')).join(' '),
        fill: 'none',
        'stroke-width': 3,
        'stroke-linejoin': 'round',
        stroke: k === 'w' ? PL_C.water : PL_C.steam
      });
    svg.append(l);
    upd.push(() => {
      const v = o.g ? o.g() : null,
        on = !o.g || v == null || v > 1;
      l.setAttribute('stroke', on ? (k === 'w' ? PL_C.water : PL_C.steam) : k === 'w' ? PL_C.waterOff : PL_C.steamOff);
    });
    return o;
  };
  const box = (x, y, w, h, s, fill) => {
    svg.append(hs$('rect', { x, y, width: w, height: h, rx: 3, fill: fill || '#c9ced2', stroke: '#667' }));
    if (s)
      at(x + w / 2, y + h / 2 + 4, s, {
        'text-anchor': 'middle',
        fill: '#222',
        'font-family': 'Arial,sans-serif',
        'font-size': 12
      });
  };
  /* F box + click-to-set on one value */
  const fbox = (g, x, y, r) => {
    const w = { sheet: r.sheet, nn: r.nn },
      b = hs$('rect', { x, y, width: 17, height: 12, rx: 3, fill: '#1b262d', stroke: '#667', style: 'cursor:pointer' }),
      t = ht$('F', {
        x: x + 8.5,
        y: y + 9.5,
        'text-anchor': 'middle',
        'font-size': 9,
        fill: '#9ab',
        style: 'pointer-events:none'
      }),
      ti = hs$('title');
    b.append(ti);
    g.append(b, t);
    b.onpointerdown = e => {
      e.stopPropagation();
      hmiToggleForce(w);
      plUpd();
    };
    upd.push(() => {
      const s = hmiState(w);
      if (!s) {
        b.setAttribute('stroke', PL_C.bad);
        t.textContent = '?';
        return;
      }
      if (s.forced) {
        b.setAttribute('fill', '#ff9d2e');
        b.setAttribute('stroke', '#ff9d2e');
        t.setAttribute('fill', '#1b1000');
        t.textContent = s.field ? 'SIM' : 'FRC';
        ti.textContent = (s.field ? 'SIMULATED' : 'FORCED') + ' at ' + fmt(s.S.rt.force[s.n]) + '. Click to release';
      } else {
        b.setAttribute('fill', '#1b262d');
        b.setAttribute('stroke', s.how === 'plant' ? '#4da3ff' : '#667');
        t.setAttribute('fill', s.how === 'plant' ? '#4da3ff' : '#9ab');
        t.textContent = s.how === 'plant' ? 'P' : 'F';
        ti.textContent =
          s.how === 'plant'
            ? 'Driven by the plant model (read only). Click F to simulate (hold) a value'
            : s.how === 'computed'
              ? 'Computed by the logic (read only). Click F to force (hold) a value'
              : 'Operator input. Click F to hold it as a simulated point';
      }
    });
  };
  const setv = (r, lab) => {
    const s = hmiState({ sheet: r.sheet, nn: r.nn });
    if (!s) return;
    if (s.how === 'plant' || s.how === 'computed') {
      msg(
        'Plant window: ' +
          (s.how === 'plant'
            ? 'driven by the plant model. Press F to simulate (hold) a value, or change the SV / the field input of the loop'
            : 'computed by the logic. Press F to force (hold) a value')
      );
      return;
    }
    const t = ow().prompt(lab + ' - new value', fmt(plVal(r)));
    if (t === null) return;
    const n = parseFloat(t);
    if (isFinite(n)) {
      hmiWrite({ sheet: r.sheet, nn: r.nn }, n);
      plUpd();
    }
  };
  /* number with tag: tag (serif white), value (cyan), unit */
  const num = (x, y, tag, o) => {
    const g = hs$('g', { transform: 'translate(' + x + ',' + y + ')' });
    svg.append(g);
    const r = plRes(o);
    g.append(ht$(tag, { x: 0, y: 0, fill: PL_C.txt, 'font-size': 11, 'font-family': 'Georgia,serif' }));
    const vt = ht$('--', {
        x: 0,
        y: 16,
        fill: PL_C.val,
        'font-size': 14,
        'font-weight': 'bold',
        'font-family': 'Consolas,monospace',
        style: 'cursor:pointer'
      }),
      ut = ht$(o.u || '', { x: 24, y: 16, fill: PL_C.dim, 'font-size': 10 }),
      ti = hs$('title');
    vt.append(ti);
    g.append(vt, ut);
    if (!r) {
      ti.textContent = tag + ': address ' + (o.ai || o.pid) + ' is not on any ABC sheet (not simulated)';
      vt.setAttribute('fill', '#556');
      return;
    }
    need(r);
    fbox(g, tag.length * 6.4 + 4, -10, r);
    vt.onclick = () => setv(r, tag);
    upd.push(() => {
      const v = plVal(r),
        w = hmiState({ sheet: r.sheet, nn: r.nn });
      vt.textContent = v == null ? '--' : v.toFixed(o.d == null ? 1 : o.d);
      ut.setAttribute('x', vt.textContent.length * 8.4 + 4);
      vt.setAttribute('fill', w && w.forced ? '#ffb04d' : PL_C.val);
      ti.textContent =
        tag +
        ' = ' +
        (o.ai || o.pid + '.' + o.pin) +
        ' on ' +
        r.sheet +
        (o.ai ? ' (IO ' + o.ai + ')' : '') +
        '. Click the value to set it';
    });
  };
  /* control valve: bow tie, red closed / green open, position under it */
  const valve = (x, y, tag, o) => {
    const g = hs$('g', { transform: 'translate(' + x + ',' + y + ')' });
    svg.append(g);
    const a = hs$('polygon', { points: '-11,-8 0,0 -11,8', stroke: '#aab', 'stroke-width': 1.5 }),
      b = hs$('polygon', { points: '11,-8 0,0 11,8', stroke: '#aab', 'stroke-width': 1.5 });
    g.append(a, b);
    if (o.act)
      g.append(
        hs$('path', {
          d: 'M-7,-9 A7,6 0 0 1 7,-9 M0,-9 L0,0',
          fill: 'none',
          stroke: '#aab',
          'stroke-width': 1.5,
          transform: 'translate(0,-6)'
        })
      );
    g.append(
      ht$(tag, {
        x: o.tx == null ? 16 : o.tx,
        y: o.ty == null ? -8 : o.ty,
        fill: PL_C.txt,
        'font-size': 11,
        'font-family': 'Georgia,serif'
      })
    );
    const r = o.pid ? plRes({ pid: o.pid, pin: 'MV' }) : null,
      vt = ht$('', {
        x: o.tx == null ? 16 : o.tx,
        y: o.ty == null ? 7 : o.ty + 15,
        fill: PL_C.val,
        'font-size': 13,
        'font-weight': 'bold',
        'font-family': 'Consolas,monospace'
      }),
      ti = hs$('title');
    vt.append(ti);
    g.append(vt);
    if (!r) {
      const c = o.fixed == null ? '#5a636a' : o.fixed ? PL_C.ok : PL_C.bad;
      a.setAttribute('fill', c);
      b.setAttribute('fill', c);
      vt.textContent = o.note || '';
      ti.textContent = tag + ': no logic on the ABC sheets for this valve (not simulated)';
      vt.setAttribute('fill', PL_C.dim);
      vt.setAttribute('font-size', 10);
      return;
    }
    need(r);
    if (o.pid) fbox(g, (o.tx == null ? 16 : o.tx) + tag.length * 6.2 + 4, -18, r);
    upd.push(() => {
      const v = plVal(r),
        c = v == null ? '#5a636a' : v <= 2 ? PL_C.bad : PL_C.ok;
      a.setAttribute('fill', c);
      b.setAttribute('fill', c);
      vt.textContent = v == null ? '-- %' : v.toFixed(1) + ' %';
      ti.textContent =
        tag +
        ' opening = the output (MV) of ' +
        o.pid +
        ' on ' +
        r.sheet +
        ' (valve position feedback is not modelled)';
    });
    return () => plVal(r);
  };
  /* controller box: PV / SV / MV of a PID tag; SV and the F boxes work */
  const ctl = (x, y, title, tag) => {
    const g = hs$('g', { transform: 'translate(' + x + ',' + y + ')' });
    svg.append(g);
    g.append(
      hs$('rect', { x: 0, y: 0, width: 215, height: 92, rx: 3, fill: '#0c1216', stroke: '#4a5a64' }),
      hs$('rect', { x: 0, y: 0, width: 215, height: 17, fill: '#6b747a' }),
      ht$(title, {
        x: 5,
        y: 13,
        fill: '#fff',
        'font-size': 11,
        'font-family': 'Arial,sans-serif',
        'font-weight': 'bold'
      }),
      ht$(tag, {
        x: 210,
        y: 13,
        'text-anchor': 'end',
        fill: '#dde',
        'font-size': 10,
        'font-family': 'Arial,sans-serif'
      })
    );
    ['PV', 'SV', 'MV'].forEach((pin, i) => {
      const yy = 36 + i * 24;
      g.append(ht$(pin, { x: 8, y: yy, fill: '#e6edf3', 'font-size': 13, 'font-family': 'Georgia,serif' }));
      const r = plRes({ pid: tag, pin });
      const vt = ht$('--', {
          x: 140,
          y: yy,
          'text-anchor': 'end',
          fill: PL_C.val,
          'font-size': 15,
          'font-weight': 'bold',
          'font-family': 'Consolas,monospace',
          style: 'cursor:pointer'
        }),
        ti = hs$('title');
      vt.append(ti);
      g.append(vt);
      if (!r) {
        ti.textContent = tag + ' not found on any sheet';
        vt.setAttribute('fill', '#556');
        return;
      }
      need(r);
      const gg = hs$('g', {});
      g.append(gg);
      fbox(gg, 150, yy - 12, r);
      vt.onclick = () => setv(r, tag + '.' + pin);
      upd.push(() => {
        const v = plVal(r);
        vt.textContent = v == null ? '--' : v.toFixed(1);
        ti.textContent =
          tag + '.' + pin + ' on ' + r.sheet + '. Click to set (SV: the setpoint; PV / MV: press F first)';
      });
    });
  };
  /* ================= the screen: 005 REHEATER STEAM SYSTEM ================= */
  at(14, 26, '005 REHEATER STEAM SYSTEM', {
    'font-size': 18,
    'font-family': 'Arial,sans-serif',
    'font-weight': 'bold',
    fill: '#fff'
  });
  at(
    14,
    44,
    'Plant window - system 1 of the plant simulator. Values are the addresses of the ABC sheets (same engine). Not connected to the real plant.',
    { 'font-size': 10, fill: PL_C.dim, 'font-family': 'Arial,sans-serif' }
  );
  svg.append(hs$('rect', { x: 640, y: 6, width: 640, height: 36, fill: '#e69ad0' }));
  [
    ['MSP', 'PT-MS1006-1', 0, 'K'],
    ['MST', 'TT-MS1007', 0, 'C'],
    ['MSF', 'FT-MS1031', 1, 'T/H'],
    ['RHP', 'PT-HR1001', 1, 'K'],
    ['RHT', 'TT-HR1002-1', 0, 'C']
  ].forEach((q, i) => {
    const x = 648 + i * 127,
      g = hs$('g', { transform: 'translate(' + x + ',0)' });
    svg.append(g);
    g.append(ht$(q[0], { x: 0, y: 30, fill: '#1a3cff', 'font-size': 15, 'font-family': 'Arial,sans-serif' }));
    const r = plRes({ ai: q[1] }),
      vt = ht$('--', {
        x: 40,
        y: 30,
        fill: '#2fe3f5',
        'font-size': 15,
        'font-weight': 'bold',
        'font-family': 'Consolas,monospace'
      });
    g.append(vt);
    if (r) {
      need(r);
      upd.push(() => {
        const v = plVal(r);
        vt.textContent = v == null ? '--' : v.toFixed(q[2]);
      });
    }
  });
  /* main steam */
  box(14, 152, 150, 30, 'BOILER OUTLET');
  pipe(
    [
      [164, 167],
      [1110, 167]
    ],
    's'
  );
  num(190, 122, 'FIQMS1031', { ai: 'FT-MS1031', u: 'T/H' });
  num(320, 122, 'PIMS10061', { ai: 'PT-MS1006-1', u: 'kg/cm2' });
  num(450, 122, 'PIMS10062', { ai: 'PT-MS1006-2', u: 'kg/cm2' });
  num(580, 122, 'TIMS1007', { ai: 'TT-MS1007', u: 'C', d: 0 });
  valve(740, 167, 'MVMS1391', { ty: 34, tx: -30, note: 'n/a', act: 0 });
  box(1110, 120, 100, 95, 'HP TURBINE', '#b9bec2');
  /* HP bypass */
  pipe(
    [
      [880, 167],
      [880, 260]
    ],
    's'
  );
  const pp1 = pipe(
    [
      [880, 260],
      [880, 470]
    ],
    's'
  );
  const pcv = valve(880, 260, 'PCVMS1020', { pid: 'PICMS1006', act: 1, tx: 16, ty: -14 });
  pp1.g = pcv;
  at(900, 226, '(HP TURBINE BYPASS)', { 'font-size': 10, fill: PL_C.dim });
  num(905, 300, 'PIMS1021', { ai: 'PT-MS1021', u: 'kg/cm2' });
  pipe(
    [
      [20, 380],
      [520, 380]
    ],
    'w'
  );
  const pp2 = pipe(
    [
      [520, 380],
      [880, 380]
    ],
    'w'
  );
  box(14, 360, 150, 24, 'BFP EXTRACTION');
  valve(300, 380, 'XVFW1061', { ty: -14, tx: -26, note: '' });
  const tcvA = valve(520, 380, 'TCVFW1060', { pid: 'TICMS1022', act: 1, tx: 16, ty: -30 });
  pp2.g = tcvA;
  num(60, 336, 'FIQFW1059', { ai: 'FT-FW1059', u: 'T/H' });
  at(730, 372, 'de-superheater', { 'font-size': 10, fill: PL_C.dim });
  num(905, 355, 'TIMS10221', { ai: 'TT-MS1022-1', u: 'C', d: 0 });
  num(905, 395, 'TIMS10222', { ai: 'TT-MS1022-2', u: 'C', d: 0 });
  /* cold reheat */
  pipe(
    [
      [1160, 215],
      [1160, 470],
      [520, 470]
    ],
    's'
  );
  at(1020, 462, 'COLD REHEAT', { 'font-size': 10, fill: PL_C.dim });
  num(690, 426, 'PICR1003', { ai: 'PT-CR1003', u: 'kg/cm2' });
  num(790, 426, 'TICR1004', { ai: 'TT-CR1004', u: 'C', d: 0 });
  /* reheater inlet spray */
  pipe(
    [
      [20, 580],
      [600, 580],
      [600, 470]
    ],
    'w'
  );
  box(14, 560, 150, 24, 'BFP EXTRACTION');
  num(60, 536, 'FIQFW1149', { ai: 'FT-FW1149', u: 'T/H' });
  valve(240, 580, 'XVFW1151', { ty: -14, tx: -26, note: '' });
  valve(400, 580, 'TCVFW1150', { ty: 28, tx: -30, note: 'n/a' });
  num(615, 525, 'TICR10051', { ai: 'TT-CR1005-1', u: 'C', d: 0 });
  num(715, 525, 'TICR10052', { ai: 'TT-CR1005-2', u: 'C', d: 0 });
  /* reheater header */
  svg.append(hs$('rect', { x: 400, y: 440, width: 120, height: 70, fill: '#d6c13a', stroke: '#665', opacity: 0.9 }));
  at(460, 480, 'REHEATER', {
    'text-anchor': 'middle',
    'font-size': 11,
    fill: '#111',
    'font-family': 'Arial,sans-serif'
  });
  num(290, 470, 'PICR1006', { ai: 'PT-CR1006', u: 'kg/cm2' });
  /* hot reheat */
  pipe(
    [
      [460, 510],
      [460, 650],
      [1110, 650]
    ],
    's'
  );
  at(300, 672, 'HOT REHEAT', { 'font-size': 10, fill: PL_C.dim });
  [
    ['PIHR1001', 'PT-HR1001', 'kg/cm2', 1],
    ['TIHR10021', 'TT-HR1002-1', 'C', 0],
    ['TIHR10022', 'TT-HR1002-2', 'C', 0],
    ['PIHR10031', 'PT-HR1003-1', 'kg/cm2', 1],
    ['PIHR10032', 'PT-HR1003-2', 'kg/cm2', 1],
    ['TIHR1004', 'TT-HR1004', 'C', 0]
  ].forEach((q, i) => num(480 + i * 85, 606, q[0], { ai: q[1], u: q[2], d: q[3] }));
  box(1110, 600, 100, 95, 'IP / LP TURBINE', '#b9bec2');
  /* hot R/H steam pressure control (silencer valve) */
  pipe(
    [
      [460, 650],
      [460, 720],
      [300, 720]
    ],
    's'
  );
  valve(380, 720, 'MVHR1391', { pid: 'PICHR1391', tx: -30, ty: -26 });
  at(250, 740, 'SILENCER', { 'font-size': 10, fill: PL_C.dim });
  /* LP bypass */
  pipe(
    [
      [1000, 650],
      [1000, 730]
    ],
    's'
  );
  const pp3 = pipe(
    [
      [1000, 730],
      [1000, 900]
    ],
    's'
  );
  const lpv = valve(1000, 730, 'PCVHR1010', { pid: 'PICHR1003', act: 1, tx: 16, ty: -14 });
  pp3.g = lpv;
  at(1020, 700, '(LP TURBINE BYPASS)', { 'font-size': 10, fill: PL_C.dim });
  num(1025, 752, 'TIHR1010', { ai: 'TT-HR1010', u: 'C', d: 0 });
  num(1025, 800, 'PIHR1011', { ai: 'PT-HR1011', u: 'kg/cm2' });
  pipe(
    [
      [1420, 830],
      [1130, 830]
    ],
    'w'
  );
  const pp4 = pipe(
    [
      [1130, 830],
      [1000, 830]
    ],
    'w'
  );
  box(1330, 812, 100, 24, 'CONDENSATE');
  valve(1250, 830, 'XVCD1114', { ty: -12, tx: -26, note: '' });
  pp4.g = valve(1130, 830, 'TCVCD1115', { pid: 'TICHR1012', act: 1, tx: -10, ty: 26 });
  num(1210, 784, 'FIQCD1115', { ai: 'FT-CD1115', u: 'T/H' });
  at(1010, 918, 'CONDENSER', { 'font-size': 12, fill: PL_C.txt, 'font-family': 'Arial,sans-serif' });
  num(1025, 846, 'TIHR10121', { ai: 'TT-HR1012-1', u: 'C', d: 0 });
  num(1025, 886, 'TIHR10122', { ai: 'TT-HR1012-2', u: 'C', d: 0 });
  /* controllers */
  ctl(1270, 60, 'HP-BYPASS (PCV)', 'PICMS1006');
  ctl(1270, 162, 'HP-BYPASS (TCV)', 'TICMS1022');
  ctl(1270, 264, 'LP-BYPASS (PCV)', 'PICHR1003');
  ctl(1270, 366, 'LP-BYPASS (TCV)', 'TICHR1012');
  ctl(1270, 468, 'HOT R/H STM PRESS CTL', 'PICHR1391');
  ctl(1270, 570, 'S/H PANEL #2 INLET', 'HICBR1391');
  [
    ['Pipes dim while their valve is closed.'],
    ['F box: FORCE / SIM (orange).'],
    ['P (blue) = driven by the plant model.'],
    ['-- = address not on any ABC sheet.']
  ].forEach((q, i) =>
    at(1270, 690 + i * 14, q[0], { 'font-size': 10, fill: PL_C.dim, 'font-family': 'Arial,sans-serif' })
  );
  return svg;
}
/* ---- operating point = the values of the DCS snapshot 5.png (a running plant at one moment). Free transmitters start there (only if nobody has set them); a modelled loop gets an offset of its plant so that its PV sits there at mid output ---- */
const PL_INIT = {
  'FT-MS1031': 482.2,
  'PT-MS1006-1': 121.1,
  'PT-MS1006-2': 121.1,
  'TT-MS1007': 538,
  'PT-MS1021': 35.7,
  'TT-MS1022-1': 362,
  'TT-MS1022-2': 358,
  'FT-FW1059': 1.8,
  'PT-CR1003': 35.3,
  'TT-CR1004': 370,
  'TT-CR1005-1': 331,
  'TT-CR1005-2': 327,
  'FT-FW1149': 14.8,
  'PT-CR1006': 34.9,
  'PT-HR1001': 35,
  'TT-HR1002-1': 540,
  'TT-HR1002-2': 540,
  'PT-HR1003-1': 34.3,
  'PT-HR1003-2': 34.4,
  'TT-HR1004': 540,
  'TT-HR1010': 228,
  'PT-HR1011': 0,
  'TT-HR1012-1': 137,
  'TT-HR1012-2': 135,
  'FT-CD1115': 0
};
const PL_OP = { PICMS1006: 121.1, TICMS1022: 360, PICHR1003: 34.4, TICHR1012: 136, TICHR1002: 540 };
function plStart() {
  if (AN._plInit) return;
  AN._plInit = 1;
  const done = [];
  for (const k in PL_INIT) {
    const L = plAIs().get(k) || [];
    for (const x of L) {
      if (procAI(x.S, x.id)) continue;
      const s = x.S.rt.st[x.id],
        sv0 = (AN.sv[x.sh.name] && AN.sv[x.sh.name].ai) || {};
      if (!s || sv0[x.id] !== undefined) continue;
      const lo = x.b.rng ? x.b.rng.lo : 0,
        hi = x.b.rng ? x.b.rng.hi : 1e9;
      if (Math.abs(s.val - lo) > 1e-9 && s.val !== 0) continue;
      const v = Math.max(lo, Math.min(hi, PL_INIT[k]));
      s.val = s.act = v;
      done.push(k);
    }
  }
  for (const t in PL_OP) {
    const bb = hmiBlk({ addr: t });
    if (!bb || !bb.b.proc) continue;
    const P = bb.b.p,
      span = P.span > 0 ? P.span : 100,
      lo = P.rlo != null ? P.rlo : 0;
    bb.b.proc.op = PL_OP[t] - (lo + span / 2);
    if (bb.sh.S.rt.pm) delete bb.sh.S.rt.pm[bb.b.id];
    done.push(t);
  }
  AN._plInit = done.length;
}
/* ---- the window ---- */
let plRoot = null,
  plWin = null,
  plUpdL = [],
  plChk = null;
function plUpd() {
  for (const f of plUpdL)
    try {
      f();
    } catch (e) {}
}
function plTick() {
  if (!AN.plantUi.open) return;
  if (plWin && plWin.closed) {
    plClose();
    return;
  }
  plUpd();
}
function plOpen() {
  if (AN.plantUi.open) {
    try {
      plWin && plWin.focus();
    } catch (e) {}
    return;
  }
  if (AN.plantOn !== true && AN.procDefault !== true) {
    msg('Plant model is OFF (button "Plant model"): switch it on to use the Plant window');
    return;
  }
  AN.sheets.forEach(sh => {
    try {
      ensure(sh);
    } catch (e) {}
  });
  AN._plAI = null;
  try {
    plStart();
  } catch (e) {
    console.error('plant start', e);
  }
  const root = h$('div', { id: 'plantroot', style: 'position:relative;width:100%;height:100%;background:#000' });
  plUpdL = [];
  const need = [];
  root.append(plBuild(root, 'reheater', plUpdL, need));
  let host = null;
  try {
    plWin = window.open('', 'logicsim_plant', 'width=1400,height=900,resizable=yes,scrollbars=no');
  } catch (e) {
    plWin = null;
  }
  if (plWin && plWin.document) {
    try {
      plWin.document.open();
      plWin.document.write(
        '<!doctype html><html><head><meta charset="utf-8"><title>Logic Sim - Plant window</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}</style></head><body></body></html>'
      );
      plWin.document.close();
      plWin.document.body.appendChild(root);
      host = 'window';
      plWin.addEventListener('beforeunload', () => {
        if (AN.plantUi.open) plClose(true);
      });
    } catch (e) {
      try {
        plWin.close();
      } catch (x) {}
      plWin = null;
    }
  }
  if (!host) {
    const f = h$('div', {
      id: 'plantfloat',
      style:
        'position:fixed;left:40px;top:60px;width:min(1200px,92vw);height:min(820px,88vh);z-index:9000;border:1px solid var(--acc);box-shadow:0 6px 28px #000c;background:#000;resize:both;overflow:hidden;display:flex;flex-direction:column'
    });
    const bar = h$(
      'div',
      {
        style:
          'display:flex;gap:8px;align-items:center;padding:4px 8px;background:var(--panel);border-bottom:1px solid var(--line);color:var(--tx);font:12px sans-serif'
      },
      [
        h$('b', { txt: 'Plant window', style: 'color:var(--acc)' }),
        h$('span', { style: 'flex:1' }),
        h$('button', { txt: '✕', title: 'Close the plant window', onclick: () => plClose() })
      ]
    );
    root.style.flex = '1';
    root.style.minHeight = '0';
    f.append(bar, root);
    document.body.appendChild(f);
    host = 'float';
  }
  AN.plantUi.open = true;
  AN.plantUi.host = host;
  AN.plantSheets = need.slice();
  bPl.classList.add('on');
  AN.tickHooks = AN.tickHooks || [];
  if (!AN.tickHooks.includes(plTick)) AN.tickHooks.push(plTick);
  clearInterval(plChk);
  plChk = setInterval(() => {
    if (!AN.plantUi.open) {
      clearInterval(plChk);
      return;
    }
    if (plWin && plWin.closed) plClose();
    else plUpd();
  }, 500);
  plRoot = root;
  plUpd();
  hmiApplyMode();
  msg(
    'Plant window open (' +
      host +
      '). The sheets and the panel only show values while it is open; operate from the plant window.'
  );
}
function plClose(fromWin) {
  if (!AN.plantUi.open) return;
  AN.plantUi.open = false;
  clearInterval(plChk);
  AN.plantSheets = [];
  bPl.classList.remove('on');
  AN.tickHooks = (AN.tickHooks || []).filter(f => f !== plTick);
  try {
    if (plWin && !plWin.closed && !fromWin) plWin.close();
  } catch (e) {}
  plWin = null;
  const f = document.getElementById('plantfloat');
  if (f) f.remove();
  plRoot = null;
  plUpdL = [];
  try {
    hmiApplyMode();
  } catch (e) {}
}
bPl.onclick = () => {
  if (AN.plantUi.open) plClose();
  else plOpen();
};
function plantSwitch(on, quiet) {
  AN.plantOn = !!on;
  try {
    localStorage.setItem('ls-plantmodel2', on ? '1' : '0');
  } catch (e) {}
  for (const sh of AN.sheets) {
    if (!sh.S) continue;
    for (const b of sh.S.procs || []) if (b.proc) b.proc.on = !!on;
    if (!on) {
      sh.S.rt.pm = {};
      sh.S.plantT = null;
      sh.S._rem = 0;
    }
  }
  bPm.textContent = 'Plant model: ' + (on ? 'ON' : 'OFF');
  bPm.classList.toggle('on', !!on);
  if (!on && AN.plantUi.open) plClose();
  try {
    settle();
  } catch (e) {}
  try {
    buildPanel();
    panelUpd(true);
  } catch (e) {}
  if (!quiet)
    msg(
      on
        ? 'Plant model ON: the PV follows the controller output'
        : 'Plant model OFF: transmitters / PV are free inputs, only the drawn logic runs'
    );
}
bPm.onclick = () => plantSwitch(!AN.plantOn);
{
  let v = null;
  try {
    v = localStorage.getItem('ls-plantmodel2');
  } catch (e) {}
  AN.plantOn = v !== '0';
  /* v1.20.39: the plant model is always there (ON by default); the operator operates it */ bPm.textContent =
    'Plant model: ' + (AN.plantOn ? 'ON' : 'OFF');
  bPm.classList.toggle('on', AN.plantOn);
}
function wrCtl(e) {
  try {
    e.querySelectorAll && e.querySelectorAll('input,button').forEach(x => x.classList.add('wr'));
  } catch (x) {}
  return e;
}
function buildPanel() {
  const sh = cs(),
    S = sh.S;
  anp.innerHTML = '';
  if (AN.plantUi && AN.plantUi.open)
    anp.append(
      h$('div', {
        cls: 'own',
        txt: 'The Plant window is open: it is the controller (inputs, FORCE / SIM). This panel only shows the values. Close the Plant window to operate from the diagram and the panel.'
      })
    );
  else if (AN.hmiUi && AN.hmiUi.open)
    anp.append(
      h$('div', {
        cls: 'own',
        txt: 'The HMI is open: it is the controller (inputs, FORCE / SIM). This panel only shows the values. Close the HMI to operate from the diagram and the panel.'
      })
    );
  PU = [];
  const sec = t => anp.append(h$('h4', { txt: t }));
  const val = (n, dig) => {
    const e = h$('span', { cls: 'v' });
    PU.push(() => {
      const x = S.rt.v[n];
      e.textContent = dig ? (x > 0.5 ? '1' : '0') : fmt(x);
      e.classList.toggle('d1', dig && x > 0.5);
    });
    return e;
  };
  {
    const ck = h$('input', { type: 'checkbox' });
    ck.checked = AN.ah;
    ck.onchange = () => {
      AN.ah = ck.checked;
      try {
        localStorage.setItem('ditl.an.ah', AN.ah ? '1' : '0');
      } catch (e) {}
      showPanel(!anp.classList.contains('min'));
      setTimeout(() => dispatchEvent(new Event('resize')), 40);
    };
    anp.append(
      h$('div', { cls: 'ph' }, [
        h$('b', { txt: sh.name, style: 'flex:1' }),
        h$(
          'label',
          {
            title:
              'Hide this panel automatically when nothing is selected; it opens again when you click a block or wire'
          },
          [ck, document.createTextNode('Auto-hide')]
        ),
        h$('button', { txt: '✕', title: 'Hide panel (Panel button brings it back)', onclick: () => showPanel(false) })
      ])
    );
    anp.append(
      h$('small', {
        txt: 'Set the INPUTS (switches / sliders): the logic computes the outputs by itself. Click a block or a wire to see its values; FORCE is only an optional override.'
      })
    );
  }
  const selD = h$('div', { id: 'ansel' });
  anp.append(selD);
  anp.append(h$('div', { id: 'anfp' }));
  fpUpd();
  const xl = n => S.xlk && S.xlk[n];
  const lks = Object.keys(S.xlk || {});
  /* ---- search + categories: every row shows the tag, a description read from the drawing, the live value and its control ---- */
  const q = h$('input', { type: 'search', placeholder: 'Search tag or description…', id: 'ansrch' });
  q.style.cssText =
    'width:100%;box-sizing:border-box;margin:6px 0;background:#0b1013;color:var(--tx);border:1px solid var(--line);padding:4px 6px;font:inherit';
  anp.append(q);
  const rows = [];
  AN.rows = {};
  const groups = new Map();
  const grp = (sec_, sub) => {
    const k = sec_ + '|' + (sub || '');
    if (groups.has(k)) return groups.get(k);
    const g = { sec: sec_, sub, rows: [] };
    groups.set(k, g);
    return g;
  };
  const mkRow = (g, key, tag, descTxt, ctlEls, pos) => {
    {
      const ad = adesFind(sh, tag);
      if (ad) {
        const t0 = adesText(ad.rec);
        if (t0) descTxt = t0 + (descTxt ? '  ·  ' + descTxt : '');
      }
    }
    const r = h$('div', { cls: 'ir' }),
      l1 = h$('div', { cls: 'l1' }),
      tg = h$('span', { cls: 'tg', txt: tag, title: 'Click: show on the drawing' });
    l1.append(tg, ...ctlEls);
    r.append(l1);
    if (descTxt) r.append(h$('div', { cls: 'ds', txt: descTxt }));
    tg.onclick = () => {
      if (pos) {
        centerOn(pos.x, pos.y);
        flash(pos.x, pos.y, 4);
      }
    };
    if (descTxt) r.lastChild.onclick = tg.onclick;
    r._t = (tag + ' ' + (descTxt || '')).toLowerCase();
    AN.rows[key] = r;
    g.rows.push({ r, y: pos ? pos.y : 0, x: pos ? pos.x : 0 });
    return r;
  };
  const isDesc = t => {
    const q = t.t.trim();
    return (
      q.length >= 3 &&
      /[A-Za-z]{3}/.test(q) &&
      !TAGRE.test(q) &&
      !/^\d\s*:/.test(q) &&
      !/^[-+\d.\s%~]+$/.test(q) &&
      !/^TR\d+$/.test(q)
    );
  };
  const inBlk = t =>
    S.blk.some(
      b => b.k !== 'CONST' && b.k !== 'AI' && b.k !== 'TXD' && t.x >= b.x0 && t.x <= b.x1 && t.y >= b.y0 && t.y <= b.y1
    );
  const joinD = a =>
    a
      .sort((u, v) => v.y - u.y)
      .map(t => t.t.trim())
      .join(' ');
  const split = a => {
    let src = '',
      d = [];
    a.sort((u, v) => v.y - u.y).forEach(t => {
      const m = /FROM\s+(.+?)\s*\)?\s*$/i.exec(t.t.trim());
      if ((m && /^\(/.test(t.t.trim())) || /^\(\s*FROM/i.test(t.t.trim())) {
        src = (m ? m[1] : t.t)
          .replace(/[()]/g, '')
          .replace(/\s*\d{4,6}\s*$/, '')
          .trim();
      } else d.push(t.t.trim());
    });
    return { desc: d.join(' '), src };
  };
  const wireDesc = n => {
    let best = null,
      bl = -1;
    for (const i of S.nets[n].segs) {
      const sg = S.seg[i],
        L = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1),
        h = Math.abs(sg.y1 - sg.y2) < 0.06;
      if (h && L > bl) {
        bl = L;
        best = sg;
      }
    }
    if (!best)
      for (const i of S.nets[n].segs) {
        const sg = S.seg[i],
          L = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1);
        if (L > bl) {
          bl = L;
          best = sg;
        }
      }
    if (!best) return { desc: '', src: '' };
    const hz = Math.abs(best.y1 - best.y2) < 0.06,
      x0 = Math.min(best.x1, best.x2),
      x1 = Math.max(best.x1, best.x2),
      y0 = Math.min(best.y1, best.y2),
      y1 = Math.max(best.y1, best.y2);
    const lt = S.lab[n] && S.lab[n].t;
    const c = S.tx
      .filter(
        t =>
          isDesc(t) &&
          t.t.trim() !== lt &&
          !inBlk(t) &&
          (hz
            ? t.x >= x0 - 4 && t.x <= x1 && Math.abs(t.y - best.y1) <= 8
            : t.y >= y0 - 4 && t.y <= y1 && Math.abs(t.x - best.x1) <= 12)
      )
      .sort((u, v) => Math.abs(u.y - best.y1) - Math.abs(v.y - best.y1))
      .slice(0, 3);
    return split(c);
  };
  const boxDesc = (cx, cy, rx, ry0, ry1) =>
    split(
      S.tx
        .filter(t => isDesc(t) && !inBlk(t) && Math.abs(t.x - cx) <= rx && t.y >= cy - ry0 && t.y <= cy + ry1)
        .slice(0, 5)
    );
  const livev = (n, dig) => {
    const e = h$('span', { cls: 'v' });
    PU.push(() => {
      const x = S.rt.v[n];
      e.textContent = dig ? (x > 0.5 ? '1' : '0') : fmt(x);
      e.classList.toggle('d1', dig && x > 0.5);
    });
    return e;
  };
  /* analog inputs (transmitters) */
  S.blk
    .filter(b => b.k === 'AI')
    .forEach(b => {
      const st = S.rt.st[b.id],
        r = b.rng || { lo: 0, hi: 100, u: '' },
        o = b.pins.find(p => p.role === 'out'),
        d = boxDesc(b.cx, b.cy, 24, -2, 36),
        g = grp('Analog inputs', d.src || 'Transmitters (AI)'),
        rg = h$('input', { type: 'range', min: r.lo, max: r.hi, step: (r.hi - r.lo) / 1000 });
      rg.value = st.val;
      const inp = num(st.val, x => {
        x = Math.max(r.lo, Math.min(r.hi, x));
        st.val = x;
        rg.value = x;
        inp.value = x;
        (sv(sh).ai = sv(sh).ai || {})[b.id] = x;
        anSave();
        settle();
      });
      rg.oninput = () => {
        st.val = +rg.value;
        inp.value = (+rg.value).toFixed(2);
        (sv(sh).ai = sv(sh).ai || {})[b.id] = st.val;
        anSave();
        settle();
      };
      const nowv = h$('small', {});
      const row = mkRow(
        g,
        'b' + b.id,
        b.tagAI || 'AI',
        (d.desc || '') +
          (r.u ? '  [' + r.lo + ' ~ ' + r.hi + ' ' + r.u + ']' : '') +
          (b.fb ? '  · follows the ' + (b.fb.k === 'VLV' ? 'valve' : 'actuator') + ' position' : ''),
        [inp, h$('small', { txt: r.u || '' }), nowv],
        { x: b.cx, y: b.cy }
      );
      row.append(rg);
      if (b.fb) {
        inp.disabled = true;
        rg.disabled = true;
      }
      row.querySelectorAll('input,button').forEach(e => e.classList.add('wr'));
      {
        const pb = procAI(S, b.id);
        if (pb) {
          inp.disabled = true;
          rg.disabled = true;
          row.append(
            h$('small', {
              style: 'color:#ffb04d',
              txt:
                'Simulated by the plant model of ' +
                ((pb.txt || [])[1] || pb.k) +
                ': set the SV; FORCE the point to hold a value.'
            })
          );
        }
      }
      PU.push(() => {
        if (document.activeElement !== inp && !inp._d && document.activeElement !== rg) {
          inp.value = (+st.val).toFixed(2);
          rg.value = st.val;
        }
        nowv.textContent =
          st.act != null && Math.abs(st.act - st.val) > 1e-6 * Math.max(1, Math.abs(st.val))
            ? 'now ' + fmt(st.act)
            : '';
      });
    });
  /* SIG.AB flags */
  S.blk
    .filter(b => b.k === 'SIGAB')
    .forEach(b => {
      const st = S.rt.st[b.id],
        t = b.txt.find(q => !/SIG/i.test(q)) || 'SIG.AB',
        bt = h$('button', {
          txt: 'Bad Signal: OFF',
          title:
            'Simulation only. OFF (default) = the transmitter is normal. ON = FORCED BAD: the SIG.AB flag is set, the drawn logic reacts.'
        });
      bt.classList.add('wr');
      bt.onclick = () => {
        st.val = st.val === 0 ? 1 : st.val === 1 ? 2 : 0;
        (sv(sh).ai = sv(sh).ai || {})[b.id] = st.val;
        anSave();
        settle();
      };
      const d = boxDesc(b.cx, b.cy, 40, -6, 6);
      mkRow(
        grp('Digital inputs', 'Bad Signal (SIG.AB) - simulation only, OFF by default'),
        'b' + b.id,
        'SIG.AB ' + t,
        d.desc,
        [bt],
        { x: b.cx, y: b.cy }
      );
      PU.push(() => {
        bt.textContent =
          st.val > 1.5 ? 'FORCED BAD: reads FULL SCALE' : st.val ? 'FORCED BAD: reads 0' : 'Bad Signal: OFF';
        bt.title =
          'Click: OFF -> BAD (the instrument reads 0) -> BAD (reads FULL SCALE) -> OFF. The SIG.AB flag is 1 in both BAD states, the drawn logic reacts.';
        bt.classList.toggle('on', !!st.val);
      });
    });
  /* other external inputs (digital switches / analog values coming from outside the sheet) */
  S.ext.forEach(n => {
    if (xl(n)) return;
    const dig = S.nets[n].dig,
      wd = wireDesc(n),
      lb = S.lab[n],
      sg0 = S.seg[S.nets[n].segs[0]],
      pos = lb ? { x: lb.x, y: lb.y } : sg0 ? { x: sg0.x1, y: sg0.y1 } : null,
      setE = x => {
        if (!S.nets[n].dig) {
          const c_ = anClamp(anExtRange(S, n), x);
          if (c_.cut) {
            const r_ = anExtRange(S, n);
            msg('Limited to the range written on the drawing: ' + r_.lo + ' ~ ' + r_.hi + ' ' + r_.u);
          }
          x = c_.x;
        }
        S.rt.ext[n] = x;
        (sv(sh).ext = sv(sh).ext || {})[n] = x;
        anSave();
        settle();
      };
    const g = grp(dig ? 'Digital inputs' : 'Analog inputs', wd.src ? 'From ' + wd.src : dig ? 'Other' : 'Other');
    let ce;
    if (dig) {
      const bt = h$('button', { txt: '0' });
      bt.onclick = () => setE(S.rt.ext[n] > 0.5 ? 0 : 1);
      ce = [bt];
      PU.push(() => {
        const o = S.rt.ext[n] > 0.5;
        bt.textContent = o ? '1 · ON' : '0 · OFF';
        bt.classList.toggle('on', o);
      });
    } else {
      const i = num(S.rt.ext[n] || 0, setE),
        nowv = h$('small', {});
      ce = [i, nowv];
      PU.push(() => {
        if (document.activeElement !== i && !i._d) i.value = S.rt.ext[n] || 0;
        const ev = S.rt.ev && S.rt.ev[n],
          t = S.rt.ext[n] || 0;
        nowv.textContent = ev != null && Math.abs(ev - t) > 1e-6 * Math.max(1, Math.abs(t)) ? 'now ' + fmt(ev) : '';
      });
    }
    const row = mkRow(g, 'n' + n, nm(S, n), wd.desc, ce, pos);
    row.querySelectorAll('input,button').forEach(e => e.classList.add('wr'));
    {
      const lk_ = procLock(S, n);
      if (lk_) {
        row.querySelectorAll('input,button').forEach(e => (e.disabled = true));
        row.append(
          h$('small', {
            style: 'color:#ffb04d',
            txt:
              'PV of ' +
              ((lk_.txt || [])[1] || lk_.k) +
              ': simulated by the plant model (set the SV). FORCE it to hold a value.'
          })
        );
      }
    }
    if (!dig) {
      const rr = anRange(S, { cx: pos ? pos.x : 0, cy: pos ? pos.y : 0 }, 45) || { lo: 0, hi: 100 },
        rg = h$('input', { type: 'range', min: rr.lo, max: rr.hi, step: (rr.hi - rr.lo) / 1000 });
      rg.value = S.rt.ext[n] || 0;
      rg.classList.add('wr');
      if (procLock(S, n)) rg.disabled = true;
      rg.oninput = () => setE(+rg.value);
      row.append(rg);
      PU.push(() => {
        if (document.activeElement !== rg) rg.value = S.rt.ext[n] || 0;
      });
    }
  });
  /* setpoints & constants (the "A" boxes with a number) */
  S.blk
    .filter(b => b.k === 'CONST' && !b.ref && b.o.length)
    .forEach(b => {
      const near = S.tx
        .filter(
          t =>
            t.t.trim() !== 'A' &&
            !inBlk(t) &&
            Math.hypot(Math.max(b.x0 - t.x, 0, t.x - b.x1), Math.max(b.y0 - t.y, 0, t.y - b.y1)) <= 8
        )
        .sort((u, v) => v.y - u.y)
        .map(t => t.t.trim())
        .join(' ');
      const i = num(b.p.val, x => pSet(sh, b, 'val', x));
      mkRow(grp('Setpoints & constants', ''), 'b' + b.id, fmt(b.p.val), near, [i], { x: b.cx, y: b.cy });
      const _i = i;
      PU.push(() => {
        if (document.activeElement !== _i && !_i._d) _i.value = b.p.val;
      });
    });
  /* timers: tag, time, and the address of the output */
  S.blk
    .filter(b => b.k === 'TON' || b.k === 'TOF' || b.k === 'TPS' || b.k === 'TPV')
    .forEach(b => {
      const st = S.rt.st[b.id],
        tr = S.tx
          .filter(q => /^TR\d+/.test(q.t.trim()))
          .sort((u, v) => Math.hypot(u.x - b.cx, u.y - b.cy) - Math.hypot(v.x - b.cx, v.y - b.cy))[0],
        trt = tr && Math.hypot(tr.x - b.cx, tr.y - b.cy) < 24 ? tr.t.trim() : '',
        op = b.pins.find(p => p.role === 'out'),
        v = h$('span', { cls: 'v' }),
        bt = h$('button', { txt: 'Skip', title: 'Finish this timer now' });
      bt.onclick = () => {
        if (b.k === 'TON') st.acc = b.p.sec;
        else if (b.k === 'TOF') {
          if (st.out) st.acc = b.p.sec;
        } else st.run = 0;
        settle();
      };
      const T = () => (b.k === 'TPV' ? (b.xin >= 0 ? S.rt.v[b.xin] : 0) : b.p.sec);
      PU.push(() => {
        const tt = T();
        v.textContent =
          Math.min(st.acc || 0, tt).toFixed(1) + ' / ' + (+tt).toFixed(1) + ' s · OUT ' + (st.out ? 1 : 0);
        v.classList.toggle('d1', !!st.out);
      });
      mkRow(grp('Timers', ''), 'b' + b.id, b.k + (trt ? ' ' + trt : ''), op ? 'output → ' + nm(S, op.n) : '', [bt, v], {
        x: b.cx,
        y: b.cy
      });
    });
  /* controllers */
  S.blk
    .filter(b => b.k === 'PID' || b.k === 'PIDV' || b.k === 'MAN')
    .forEach(b => {
      const st = S.rt.st[b.id],
        d = boxDesc(b.cx, b.cy, 60, -4, 34),
        o = h$('span', { cls: 'v' }),
        ce = [o];
      PU.push(() => {
        o.textContent = fmt(b.k === 'MAN' ? st.val : st.out) + (st.trk != null ? ' ⟲' : '');
      });
      const row = mkRow(
        grp('Controllers', ''),
        'b' + b.id,
        b.k + ' ' + (b.tag || '') + (b.k === 'PID' && b.p.act < 0 ? ' (reverse)' : ''),
        (d.desc || '') +
          (b.k === 'PID' || b.k === 'PIDV'
            ? '  · ' +
              (b.p.act < 0 ? 'reverse' : 'direct') +
              ' action · Kp ' +
              b.p.kp +
              ' · Ti ' +
              b.p.ti +
              ' s · Td ' +
              b.p.td +
              ' s (default for a ' +
              (b.p.lt || 'general') +
              ' loop, edit in the block panel) · suggested speed ' +
              (b.p.sp || 1) +
              'x' +
              (b.p.rlo != null ? ' · range ' + b.p.rlo + ' ~ ' + b.p.rhi + ' ' + (b.p.unit || '') : '')
            : ''),
        ce,
        { x: b.cx, y: b.cy }
      );
      if (b.k === 'MAN') {
        const rg = h$('input', { type: 'range', min: b.p.lo, max: b.p.hi, step: (b.p.hi - b.p.lo) / 500 });
        rg.value = st.val;
        rg.oninput = () => {
          st.val = +rg.value;
          (sv(sh).man = sv(sh).man || {})[b.id] = st.val;
          anSave();
          settle();
        };
        row.append(rg);
        PU.push(() => {
          if (+rg.min !== b.p.lo || +rg.max !== b.p.hi) {
            rg.min = b.p.lo;
            rg.max = b.p.hi;
            rg.step = (b.p.hi - b.p.lo) / 500;
          }
          if (document.activeElement !== rg) rg.value = st.val;
        });
      }
    });
  /* COS: every operator manual value / change-over of this sheet */
  try {
    cosInfo(S, -99);
    for (const e of S._cosAll || []) {
      cosFill(S, e);
      const ce = e.net != null ? [ctl(S, sh, e.net)] : [cosStatus(S, sh, e)];
      mkRow(grp('COS · manual values and change-overs', ''), 'c' + e.c.id, e.name, '', ce, { x: e.c.cx, y: e.c.cy });
    }
  } catch (x) {}
  /* every wire that a block drives and that has a tag, plus the outputs of AO / I/P / controllers / switches: FORCE from here (no need to hit the wire with the mouse) */
  {
    const KD = [
        'AO',
        'IP',
        'PID',
        'PIDV',
        'MAN',
        'AI',
        'SW',
        'AMT',
        'SEL',
        'HS',
        'LS',
        'LLIM',
        'HLIM',
        'FX',
        'SUM',
        'SUB',
        'DEV',
        'MUL',
        'DIV',
        'LAG',
        'RATE',
        'RAMPB',
        'ACT'
      ],
      stable = f => {
        const n0 = PU.length,
          e = f();
        for (let i = n0; i < PU.length; i++) delete PU[i]._s;
        return e;
      };
    S.nets.forEach(nn => {
      const n = nn.id;
      if (!nn.segs.length || S.ext.includes(n) || (S.xlk && S.xlk[n])) return;
      const dv = S.drv[n].find(d => d.k !== 'LINK');
      if (!dv) return;
      const tagged = !!S.lab[n];
      if (!tagged && !KD.includes(dv.k)) return;
      if (dv.k === 'IP' && S.nets[n].pn && !S.cns[n].some(c => c.k === 'VLV')) return;
      const wd = wireDesc(n),
        sg0 = S.seg[nn.segs[0]],
        pos = S.lab[n] ? { x: S.lab[n].x, y: S.lab[n].y } : sg0 ? { x: sg0.x1, y: sg0.y1 } : null,
        nameT = S.lab[n]
          ? S.lab[n].t
          : dv.k === 'AO'
            ? 'AO output'
            : dv.k === 'IP'
              ? 'I/P output → valve'
              : dv.k + ' output';
      mkRow(
        grp('Signals to force', tagged ? 'Tagged signals' : 'Block outputs'),
        'f' + n,
        nameT,
        wd.desc || 'from ' + dv.k,
        [livev(n, nn.dig), stable(() => forceCtl(S, sh, n))],
        pos
      );
    });
  }
  /* signals that come from another sheet through a numbered circle */
  lks.forEach(k => {
    const n = +k,
      l = S.xlk[k],
      bt = h$('button', { txt: '↗ ' + l.from.name, title: 'Go to the circle where this signal comes from' });
    bt.onclick = () => jumpTo(l.from, l.fromC);
    mkRow(
      grp('From other sheets', ''),
      'n' + n,
      nm(S, n),
      (l.tag ? 'tag ' : 'circle ') + l.num,
      [livev(n, S.nets[n].dig), bt],
      null
    );
  });
  /* assemble: fixed section order, rows in drawing order (top → bottom, left → right) */
  const ORDER = [
      'Digital inputs',
      'Analog inputs',
      'Setpoints & constants',
      'Timers',
      'Controllers',
      'Signals to force',
      'From other sheets'
    ],
    wrap = h$('div', { id: 'anlists' });
  anp.append(wrap);
  const secs = [];
  ORDER.forEach(nmSec => {
    const gs = [...groups.values()].filter(g => g.sec === nmSec);
    if (!gs.length) return;
    const tot = gs.reduce((a, g) => a + g.rows.length, 0),
      det = h$('details', { cls: 'sec' }),
      sm = h$('summary', { txt: nmSec + ' (' + tot + ')' });
    det.open = !(nmSec === 'Setpoints & constants' || nmSec === 'From other sheets' || nmSec === 'Signals to force');
    det.append(sm);
    gs.sort((a, b) => (a.sub || '').localeCompare(b.sub || ''));
    gs.forEach(g => {
      if (g.sub) det.append(h$('div', { cls: 'sh', txt: g.sub }));
      g.rows.sort((a, b) => b.y - a.y || a.x - b.x).forEach(o => det.append(o.r));
    });
    wrap.append(det);
    secs.push({ det, sm, base: nmSec, gs });
  });
  q.oninput = () => {
    const t = q.value.trim().toLowerCase();
    for (const sc of secs) {
      let any = 0;
      sc.det.querySelectorAll('.ir').forEach(r => {
        const ok = !t || r._t.includes(t);
        r.style.display = ok ? '' : 'none';
        if (ok) any++;
      });
      sc.det.querySelectorAll('.sh').forEach(h => {
        let n = h.nextSibling,
          vis = false;
        while (n && !n.classList.contains('sh')) {
          if (n.style.display !== 'none') vis = true;
          n = n.nextSibling;
        }
        h.style.display = vis ? '' : 'none';
      });
      sc.det.style.display = any ? '' : 'none';
      if (t && any) sc.det.open = true;
    }
  };
  selD._u = () => selUpd(selD);
  PU.push(() => {});
}
function panelUpd(sel) {
  const sh = cs();
  if (!sh || !sh.S) return;
  try {
    trSample(sh);
  } catch (e) {}
  if (sel || !panelUpd.f) {
  }
  for (const f of PU)
    try {
      f();
    } catch (e) {
      if (!AN._puErr) {
        AN._puErr = 1;
        console.error('panel refresh', e);
      }
    }
  for (const f of AN.tickHooks || [])
    try {
      f();
    } catch (e) {}
  const d = $('ansel');
  if (d && (sel || d._k !== JSON.stringify(AN.sel && { b: AN.sel.blk && AN.sel.blk.id, n: AN.sel && AN.sel.net })))
    selUpd(d);
}
function lookRow(d, sh, S, n) {
  const cur = (S.look && S.look[n]) || {},
    st_ = 'background:#0b1013;color:var(--tx);border:1px solid var(--line);padding:2px 4px;width:104px',
    mk = (opts, val, f) => {
      const s = h$(
        'select',
        { style: st_ },
        opts.map(([v, t]) => h$('option', { value: v, txt: t }))
      );
      s.value = val;
      s.onchange = () => f(s.value);
      return s;
    },
    set = (k, v) => {
      S.look = S.look || {};
      const o = Object.assign({}, S.look[n] || {});
      if (v === '' || v == null) delete o[k];
      else o[k] = k === 'w' ? +v : v;
      if (Object.keys(o).length) S.look[n] = o;
      else delete S.look[n];
      sv(sh).look = Object.assign({}, S.look);
      anSave();
      AN.wsr++;
      paint();
    };
  d.append(
    h$('div', { cls: 'r' }, [
      h$('span', { cls: 'n', txt: 'Look of this wire' }),
      mk(
        [
          ['', 'Colour: default'],
          ['red', 'Red'],
          ['yellow', 'Yellow'],
          ['green', 'Green'],
          ['cyan', 'Cyan'],
          ['blue', 'Blue'],
          ['magenta', 'Magenta'],
          ['white', 'White'],
          ['orange', 'Orange'],
          ['amber', 'Amber']
        ],
        cur.c || '',
        v => set('c', v)
      ),
      mk(
        [
          ['', 'Thick: default'],
          ['.6', 'Thin'],
          ['1.5', 'Thick'],
          ['2.2', 'Extra thick']
        ],
        cur.w ? String(cur.w) : '',
        v => set('w', v)
      )
    ])
  );
}
function selUpd(d) {
  const _h0 = d.offsetHeight,
    _a = d.closest('#anp'),
    _st = _a ? _a.scrollTop : 0;
  try {
    return selUpd_(d);
  } finally {
    if (_a && _st > 0) {
      _a.scrollTop = Math.max(0, _st + (d.offsetHeight - _h0));
    }
  }
}
const AU = { list: [], form: null, filter: '' };
try {
  AU.list = JSON.parse(localStorage.getItem('ls-audit') || '[]') || [];
} catch (e) {
  AU.list = [];
}
const auSave = () => {
  try {
    localStorage.setItem('ls-audit', JSON.stringify(AU.list));
  } catch (e) {
    msg('The audit report could not be saved in this browser (storage full or blocked): export it now');
  }
};
function auSnap(sh, S, s) {
  const L = [],
    val = n => (S.nets[n] && S.nets[n].dig ? (S.rt.v[n] > 0.5 ? '1' : '0') : fmt(S.rt.v[n]));
  let tag = '',
    block = '',
    act = '';
  if (s && s.blk) {
    const b = s.blk;
    block = b.k + '#' + b.id + (b.tag ? ' ' + b.tag : '');
    tag = b.tag || '';
    L.push('inputs: ' + (b.i || []).map(n => nm(S, n) + '=' + val(n)).join(' ; '));
    L.push('outputs: ' + (b.o || []).map(n => nm(S, n) + '=' + val(n)).join(' ; '));
    act = (b.o || []).map(n => nm(S, n) + '=' + val(n)).join(' ; ');
    const st = S.rt.st[b.id];
    if (st && st.pk) L.push('T switch letter: ' + st.pk + (st.fm ? ' (forced)' : ''));
    if (st && st.fxs)
      L.push('F(X) status: ' + st.fxs + (st.fxx !== undefined ? ', table X now ' + (+st.fxx).toFixed(2) + ' %' : ''));
    try {
      const P = Object.assign({}, b.p);
      delete P.tbl;
      L.push('parameters: ' + JSON.stringify(P).slice(0, 300));
    } catch (e) {}
  } else if (s && s.net != null) {
    const n = s.net;
    block = 'wire net ' + n;
    tag = nm(S, n);
    act = tag + '=' + val(n);
    L.push('wire: ' + tag + ' = ' + val(n));
    L.push(
      'from: ' +
        (S.drv[n] || []).map(q => q.k + '#' + q.id).join(',') +
        '  to: ' +
        (S.cns[n] || []).map(q => q.k + '#' + q.id).join(',')
    );
  }
  const fr = Object.keys(S.rt.force || {})
    .filter(k => S.rt.force[k] !== undefined)
    .map(k => nm(S, +k) + '=' + S.rt.force[k]);
  L.push('forced signals: ' + (fr.length ? fr.join(' ; ') : 'none'));
  L.push(
    'sim time: ' +
      Math.floor(S.rt.t / 60) +
      ':' +
      String(Math.floor(S.rt.t % 60)).padStart(2, '0') +
      ' · mode ' +
      (AN.view ? 'VIEW' : 'SIMULATION')
  );
  return { sheet: sh.name, block, tag, actual: act, evidence: L.join('\n') };
}
function auOpen(pre) {
  AU.form = pre || AU.form || {};
  anau.hidden = false;
  anau.style.display = 'block';
  auDraw();
}
function auCsv() {
  const cols = [
      'id',
      'time',
      'ver',
      'sheet',
      'block',
      'tag',
      'test',
      'expected',
      'actual',
      'status',
      'retest',
      'note',
      'evidence'
    ],
    q = v =>
      '"' +
      String(v == null ? '' : v)
        .replace(/"/g, '""')
        .replace(/\r?\n/g, ' | ') +
      '"';
  return '\ufeff' + cols.join(',') + '\n' + AU.list.map(r => cols.map(c => q(r[c])).join(',')).join('\n');
}
function auDownload(name, mime, text) {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  } catch (e) {
    msg('Download failed: ' + e.message);
  }
}
function auDraw() {
  const c = anau;
  c.innerHTML = '';
  const cnt = { PASS: 0, FAIL: 0, 'NEEDS REVIEW': 0 };
  AU.list.forEach(r => (cnt[r.status] = (cnt[r.status] || 0) + 1));
  const x = h$('button', {
    txt: '✕',
    style: 'float:right',
    onclick: () => {
      c.style.display = 'none';
      c.hidden = true;
    }
  });
  c.append(
    x,
    h$('b', { txt: 'Simulation Audit' }),
    h$('small', {
      style: 'display:block;margin:2px 0 6px;color:#9ab',
      txt: 'Your own test results. Kept in this browser. FAIL = the simulation does not do what the drawing says. Separate from Health (structure).'
    })
  );
  c.append(
    h$('div', { style: 'margin:4px 0' }, [
      h$('span', { txt: 'PASS ' + cnt.PASS, style: 'color:#35e08a;margin-right:10px' }),
      h$('span', { txt: 'FAIL ' + cnt.FAIL, style: 'color:#ff6b6b;margin-right:10px' }),
      h$('span', { txt: 'NEEDS REVIEW ' + cnt['NEEDS REVIEW'], style: 'color:#ffb04d;margin-right:10px' }),
      h$('span', { txt: 'total ' + AU.list.length })
    ])
  );
  const bar = h$('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin:6px 0' }),
    fl = h$(
      'select',
      {},
      [
        ['', 'All'],
        ['FAIL', 'FAIL'],
        ['NEEDS REVIEW', 'NEEDS REVIEW'],
        ['PASS', 'PASS']
      ].map(o => h$('option', { value: o[0], txt: o[1] }))
    );
  fl.value = AU.filter;
  fl.onchange = () => {
    AU.filter = fl.value;
    auDraw();
  };
  bar.append(
    h$('button', {
      txt: '+ New entry (selected block / wire)',
      onclick: () => {
        const sh = cs();
        if (!sh || !sh.S) return;
        const sn = auSnap(sh, sh.S, AN.sel);
        AU.form = { ...sn, status: 'FAIL', test: '', expected: '', note: '' };
        auDraw();
      }
    }),
    fl,
    h$('button', {
      txt: 'Export JSON',
      onclick: () =>
        auDownload(
          'LogicSim_audit_report.json',
          'application/json',
          JSON.stringify({ app: 'Logic Sim v1.20.11', exported: new Date().toISOString(), results: AU.list }, null, 1)
        )
    }),
    h$('button', { txt: 'Export CSV', onclick: () => auDownload('LogicSim_audit_report.csv', 'text/csv', auCsv()) }),
    h$('button', {
      txt: 'Copy',
      onclick: () => {
        const t = AU.list
          .map(
            r =>
              '#' +
              r.id +
              ' ' +
              r.status +
              ' · ' +
              r.sheet +
              ' · ' +
              r.block +
              (r.tag ? ' (' + r.tag + ')' : '') +
              '\n  test: ' +
              r.test +
              '\n  expected: ' +
              r.expected +
              '\n  actual: ' +
              r.actual +
              '\n  note: ' +
              r.note +
              (r.retest ? '\n  retest: ' + r.retest : '') +
              '\n  ' +
              String(r.evidence).replace(/\n/g, '\n  ')
          )
          .join('\n\n');
        try {
          navigator.clipboard.writeText(t);
          msg('Report copied');
        } catch (e) {
          msg('Copy is blocked here: use Export');
        }
      }
    }),
    h$('button', {
      txt: 'Clear all',
      onclick: () => {
        if (AU.list.length && confirm('Delete ALL ' + AU.list.length + ' audit results?')) {
          AU.list = [];
          auSave();
          auDraw();
        }
      }
    })
  );
  c.append(bar);
  if (AU.form) {
    const f = AU.form,
      fi = (lab, key, ta) => {
        const i = h$(ta ? 'textarea' : 'input', {});
        i.style.cssText =
          'width:100%;background:#0b1013;color:#d7e0e6;border:1px solid #2a3640;padding:3px;' +
          (ta ? 'height:46px' : '');
        i.value = f[key] || '';
        i.oninput = () => {
          f[key] = i.value;
        };
        return h$('div', { style: 'margin:3px 0' }, [h$('small', { txt: lab, style: 'display:block;color:#9ab' }), i]);
      };
    const st = h$(
      'select',
      {},
      ['PASS', 'FAIL', 'NEEDS REVIEW'].map(o => h$('option', { value: o, txt: o }))
    );
    st.value = f.status || 'FAIL';
    st.onchange = () => {
      f.status = st.value;
    };
    const form = h$('div', { style: 'border:1px solid #2b4a5a;padding:6px;margin:6px 0;background:#0b141b' });
    form.append(
      h$('b', {
        txt: 'Entry for ' + (f.sheet || '?') + ' · ' + (f.block || '(no block selected)') + (f.tag ? ' · ' + f.tag : '')
      }),
      fi('What did you check (test)', 'test'),
      fi('Expected (what the drawing says)', 'expected'),
      fi('Actual (what the simulation did)', 'actual'),
      fi('Note', 'note', 1),
      h$('div', { style: 'margin:3px 0' }, [h$('small', { txt: 'Result ', style: 'color:#9ab' }), st]),
      h$('small', {
        style: 'display:block;color:#9ab;white-space:pre-wrap',
        txt: 'Evidence taken automatically:\n' + (f.evidence || '-')
      })
    );
    form.append(
      h$('div', { style: 'display:flex;gap:6px;margin-top:6px' }, [
        h$('button', {
          txt: 'Save to report',
          onclick: () => {
            const r = {
              id: AU.list.reduce((m, q) => Math.max(m, +q.id || 0), 0) + 1,
              time: new Date().toISOString().slice(0, 19).replace('T', ' '),
              ver: 'v1.20.11',
              sheet: f.sheet || '',
              block: f.block || '',
              tag: f.tag || '',
              test: f.test || '',
              expected: f.expected || '',
              actual: f.actual || '',
              status: f.status || 'FAIL',
              evidence: f.evidence || '',
              note: f.note || '',
              retest: ''
            };
            AU.list.push(r);
            auSave();
            AU.form = null;
            auDraw();
            msg('Saved to the audit report (#' + r.id + ')');
          }
        }),
        h$('button', {
          txt: 'Cancel',
          onclick: () => {
            AU.form = null;
            auDraw();
          }
        })
      ])
    );
    c.append(form);
  }
  const rows = AU.list
    .filter(r => !AU.filter || r.status === AU.filter)
    .slice()
    .reverse();
  if (!rows.length) {
    c.append(
      h$('small', {
        txt: AU.list.length
          ? 'No entry with this filter.'
          : 'No results yet. Click a block or a wire, then use the PASS / FAIL / NEEDS REVIEW buttons under its title, or "+ New entry".'
      })
    );
  } else {
    const tb = h$('table', {});
    tb.append(
      h$(
        'tr',
        {},
        ['#', 'Sheet / block', 'Expected → actual', 'Result', 'Retest', ''].map(t => h$('th', { txt: t }))
      )
    );
    for (const r of rows) {
      const col = r.status === 'PASS' ? '#35e08a' : r.status === 'FAIL' ? '#ff6b6b' : '#ffb04d';
      const lnk = h$('a', {
        txt: r.sheet + ' · ' + r.block,
        href: '#',
        style: 'color:#8fd3ff',
        title: 'Open this sheet',
        onclick: e => {
          e.preventDefault();
          const i = AN.sheets.findIndex(z => z.name === r.sheet);
          if (i >= 0) {
            if (AN.cat !== 'an') setCat('an');
            go(i);
          }
        }
      });
      const rt = h$('span', {}, [
        r.retest ? h$('small', { txt: r.retest + ' ' }) : h$('span', {}),
        h$('button', {
          txt: 'PASS',
          title: 'Re-tested: now PASS',
          onclick: () => {
            r.retest = 'RETEST PASS ' + new Date().toISOString().slice(0, 10);
            auSave();
            auDraw();
          }
        }),
        h$('button', {
          txt: 'FAIL',
          title: 'Re-tested: still FAIL',
          onclick: () => {
            r.retest = 'RETEST FAIL ' + new Date().toISOString().slice(0, 10);
            auSave();
            auDraw();
          }
        })
      ]);
      tb.append(
        h$('tr', {}, [
          h$('td', { txt: r.id }),
          h$('td', {}, [
            lnk,
            h$('small', {
              style: 'display:block;color:#9ab',
              txt: (r.tag ? r.tag + ' · ' : '') + (r.test || '') + (r.note ? ' · ' + r.note : '') + ' (' + r.time + ')'
            })
          ]),
          h$('td', { txt: (r.expected || '-') + ' → ' + (r.actual || '-') }),
          h$('td', { txt: r.status, style: 'color:' + col + ';font-weight:bold' }),
          h$('td', {}, [rt]),
          h$('td', {}, [
            h$('button', {
              txt: '🗑',
              title: 'Delete this entry',
              onclick: () => {
                AU.list = AU.list.filter(q => q !== r);
                auSave();
                auDraw();
              }
            })
          ])
        ])
      );
    }
    c.append(tb);
  }
}
bAu.onclick = () => {
  if (anau.style.display === 'block') {
    anau.style.display = 'none';
    anau.hidden = true;
    return;
  }
  auOpen();
};
function selUpd_(d) {
  selUpd0_(d);
  try {
    trList(d);
  } catch (e) {}
  if (!AN.view && AN.sel && cs() && cs().S) {
    try {
      const sh = cs();
      d.append(h$('h4', { txt: 'Signal path' }));
      trPathUi(d, sh);
      trExitsUi(d, sh);
      trMapUi(d, sh);
    } catch (e) {}
  }
  try {
    trendUi(d);
  } catch (e) {}
}
function selUpd0_(d) {
  const sh = cs(),
    S = sh.S,
    s = AN.sel;
  d._k = JSON.stringify(s && { b: s.blk && s.blk.id, n: s.net });
  d.innerHTML = '';
  PU = PU.filter(f => !f._s);
  if (!s) {
    return;
  }
  const add = (n, dig) => {
    const e = h$('span', { cls: 'v' });
    const f = () => {
      const x = S.rt.v[n];
      e.textContent = dig ? (x > 0.5 ? '1' : '0') : fmt(x);
    };
    f._s = 1;
    PU.push(f);
    f();
    return e;
  };
  d.append(h$('h4', { txt: s.blk ? 'Selected: ' + s.blk.k + (s.blk.tag ? ' ' + s.blk.tag : '') : 'Selected wire' }));
  try {
    const row = h$('div', { style: 'display:flex;gap:6px;align-items:center;margin:2px 0 6px' }, [
      h$('small', { txt: 'Audit:', style: 'color:#9ab' })
    ]);
    for (const [t, c] of [
      ['PASS', '#35e08a'],
      ['FAIL', '#ff6b6b'],
      ['NEEDS REVIEW', '#ffb04d']
    ]) {
      const b = h$('button', {
        txt: t,
        title:
          'Record the result of your check of this ' +
          (s.blk ? 'block' : 'wire') +
          ' in the Simulation Audit report (inputs, outputs, forced signals and time are saved automatically)'
      });
      b.style.cssText = 'border-color:' + c + ';color:' + c;
      b.onclick = () => {
        const sn = auSnap(sh, S, s);
        auOpen({ ...sn, status: t, test: '', expected: '', note: '' });
      };
      row.append(b);
    }
    d.append(row);
  } catch (e) {}
  if (s.net != null) {
    const n = s.net;
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: nm(S, n) }), add(n, S.nets[n].dig), ctl(S, sh, n)]));
    const dr = S.drv[n].map(b => b.k + (b.tag ? ' ' + b.tag : '')).join(', '),
      cn = S.cns[n].map(b => b.k + (b.tag ? ' ' + b.tag : '')).join(', ');
    d.append(
      h$('small', {
        txt:
          'from: ' +
          (dr || 'external input (you set it)') +
          '  →  to: ' +
          (cn || '-') +
          (dr ? '   · value is computed by the logic; the button FORCE only overrides it' : '')
      })
    );
    lookRow(d, sh, S, n);
    return;
  }
  const b = s.blk;
  if (b.txt && b.txt.length) d.append(h$('small', { txt: 'text: ' + b.txt.filter(Boolean).join(' · ') }));
  if (b.k === 'COS' && b.used)
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: 'Manual value (operator)' }),
        add(b.vnet, false),
        ctl(S, sh, b.vnet)
      ])
    );
  b.pins.forEach(p => {
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: (p.role === 'in' ? 'IN ' : 'OUT ') + (p.lab ? p.lab + ' · ' : '') + nm(S, p.n) }),
        add(p.n, S.nets[p.n].dig),
        ctl(S, sh, p.n)
      ])
    );
  });
  whyRow(d, S, b);
  if (b.k === 'AI' && b.sig) {
    const st = S.rt.st[b.sig.id],
      bt = h$('button', {
        title:
          'Simulation only. Forces the SIG.AB flag of this transmitter ON (FORCED BAD) or back to normal. While ON, the logic receives 0 from this transmitter and the B.xxxx flag is 1. Nothing is written to a DCS.'
      });
    bt.classList.add('wr');
    bt.onclick = () => {
      st.val = st.val === 0 ? 1 : st.val === 1 ? 2 : 0;
      (sv(sh).ai = sv(sh).ai || {})[b.sig.id] = st.val;
      anSave();
      settle();
    };
    const up = () => {
      bt.textContent =
        st.val > 1.5
          ? 'FORCED BAD (reads FULL SCALE) - click for normal'
          : st.val
            ? 'FORCED BAD (reads 0) - click for FULL SCALE'
            : 'Bad Signal: OFF - click to force BAD';
      bt.classList.toggle('on', !!st.val);
    };
    up();
    PU.push(up);
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Bad Signal (SIG.AB) of this transmitter' }), bt]));
  }
  if (b.p0 && JSON.stringify(b.p) !== b.p0) {
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', style: 'color:#ffb24a', txt: 'Settings of this block were changed from the default' }),
        h$('button', {
          txt: 'Reset this block to default',
          title: 'Back to the value of the drawing / default. Other blocks are not touched.',
          onclick: () => {
            for (const k of Object.keys(b.p)) delete b.p[k];
            Object.assign(b.p, JSON.parse(b.p0));
            const o = sv(sh);
            if (o.p) delete o.p[b.id];
            anSave();
            settle();
            buildPanel();
            panelUpd(true);
          }
        })
      ])
    );
  }
  const P = b.p,
    pr = (k, l, st) => {
      if (P[k] == null) return;
      d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: l }), num(P[k], x => pSet(sh, b, k, x), st)]));
    };
  if (b.k === 'PID' || b.k === 'PIDV') {
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', {
          cls: 'n',
          txt: 'Loop type: ' + (b.p.lt || 'general') + ' · suggested speed ' + (b.p.sp || 1) + 'x'
        }),
        h$('button', {
          txt: 'Use this speed',
          title: 'Set the simulation speed in the top bar',
          onclick: () => {
            sSpd.value = String(b.p.sp || 1);
            sSpd.dispatchEvent(new Event('change'));
          }
        })
      ])
    );
    pr('kp', 'Gain Kp (% output per % of span)');
    pr('ti', 'Integral time Ti (s, 0 = off)');
    pr('td', 'Derivative time Td (s)');
    pr('span', 'Range span (' + (b.p.unit || 'engineering units') + ' = 100 %)');
    pr('lo', 'Output low');
    pr('hi', 'Output high');
    try {
      procPanel(d, b, sh);
    } catch (x) {}
    d.append(
      h$('small', {
        txt:
          'The input is the DEVIATION (SV − PV) as drawn; action ' +
          (b.p.act < 0 ? 'REVERSE (ACT:R)' : 'DIRECT') +
          ' comes from the drawing. ' +
          (b.face
            ? 'Kp / Ti / Td, the output limits and the SV range are the VALUES OF THE DCS FACEPLATE (user file, 2026-10-08, MNO ' +
              b.face.mno +
              '): P = ' +
              b.face.P +
              ' % band (Kp = 100 / P), I = ' +
              b.face.I +
              ' s, D = ' +
              b.face.D +
              ' s, MV limits ' +
              b.face.ML +
              ' ~ ' +
              b.face.MH +
              ' %, SV range ' +
              b.face.SL +
              ' ~ ' +
              b.face.SH +
              ' ' +
              (b.face.unit || '') +
              '. Recorded, not used yet by the simulator: dMVH ' +
              b.face.dMVH +
              ' %, DTI ' +
              b.face.DTI +
              ' s, TF ' +
              b.face.TF +
              ' s, GAP ' +
              b.face.GAP +
              ', BND ' +
              b.face.BND +
              ', CUT ' +
              b.face.CUT +
              ', DH ' +
              b.face.DH +
              ', PHONDT ' +
              b.face.PHONDT +
              ', PLONDT ' +
              b.face.PLONDT +
              '. Edit them here. '
            : 'Kp / Ti / Td are DEFAULT values (the real tuning is in the DCS database, not in the drawings): edit them here. ') +
          'While the T / AMT after the controller is on another input, the controller tracks it (bumpless).'
      })
    );
  } else if (b.k === 'SUMA' || b.k === 'SUMP') {
    const st = S.rt.st[b.id],
      e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = b.k === 'SUMA' ? fmt(st.tot || 0) : String(st.cnt || 0) + ' pulses';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: b.k === 'SUMA' ? 'Total = integral of the input' : 'Pulse count' }),
        e,
        h$('button', {
          txt: 'Reset total',
          onclick: () => {
            st.tot = 0;
            st.cnt = 0;
            panelUpd(true);
          }
        })
      ])
    );
    d.append(
      h$('small', {
        txt:
          b.k === 'SUMA'
            ? 'The input is a rate per HOUR (T/H, m3/h, MW): the total grows by input x time / 3600. It has no output on the drawing: read it here.'
            : 'Counts the rising edges of the pulse input.'
      })
    );
  } else if (b.k === 'ALM') {
    const st = () => {
      const x = S.rt.v[b.pins[0] && b.pins[0].n];
      return almLv(b, x);
    };
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = st();
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Alarm state → HMI' }), e]));
    [
      ['hh', 'High-High'],
      ['h', 'High'],
      ['l', 'Low'],
      ['ll', 'Low-Low']
    ].forEach(([k, l]) => {
      const i = h$('input', { type: 'number', step: 'any', placeholder: 'not set' });
      i.style.width = '84px';
      if (P[k] != null) i.value = P[k];
      i.onchange = () => {
        const x = parseFloat(i.value);
        pSet(sh, b, k, isFinite(x) ? x : null);
      };
      d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: l + ' limit' }), i]));
    });
    d.append(
      h$('small', {
        txt: b.dflt
          ? 'ASSUMED DEFAULT limits (150 MW CFB with reheat), NOT the DCS values: ' +
            b.dflt.e.desc +
            ' · ' +
            b.dflt.e.basis +
            '. Type your own to replace them (empty = not used).'
          : 'Alarm limits live in the HMI, not on the drawing: type them here to test (empty = not used).'
      })
    );
  } else if (b.k === 'TP') {
    const i = h$('input', { type: 'number', step: 'any', placeholder: 'not set' });
    i.style.width = '84px';
    if (P.tref != null) i.value = P.tref;
    i.onchange = () => {
      const x = parseFloat(i.value);
      pSet(sh, b, 'tref', isFinite(x) ? x : null);
    };
    d.append(
      h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Operating temperature (unit of the T input)' }), i])
    );
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = 'Kt = ' + (S.rt.st[b.id].kt == null ? '-' : S.rt.st[b.id].kt.toFixed(4));
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Correction' }), e]));
    d.append(
      h$('small', {
        txt:
          (b.dflt
            ? 'From the Compensation file (LMYP-1 #1-Compensation Calculation of Flow.xls): ' +
              b.dflt.e.ft +
              ' ' +
              b.dflt.e.desc +
              ', temperature ' +
              b.dflt.e.tt +
              ', range ' +
              b.dflt.e.tbs +
              ' ~ ' +
              b.dflt.e.tfs +
              ' °C, operating ' +
              b.dflt.e.top +
              ' °C (at = ' +
              b.dflt.e.at.toFixed(4) +
              ', bt = ' +
              b.dflt.e.bt.toFixed(4) +
              '). '
            : P.tref == null
              ? 'NOT compensating: no operating temperature known for this TP. '
              : '') + 'Output = DP / Kt, Kt = (T + 273.15) / (T operating + 273.15).'
      })
    );
  } else if (b.k === 'SEL' && b.mopts) {
    const sl = h$(
      'select',
      {},
      b.mopts.map(o =>
        h$('option', {
          value: o,
          txt:
            o === 'AVG'
              ? 'AVG (average of the healthy inputs)'
              : o === 'PRI'
                ? 'PRI (primary = left input)'
                : o === 'SEC'
                  ? 'SEC (secondary = right input)'
                  : 'Input ' + o
        })
      )
    );
    sl.value = P.mode || 'AVG';
    sl.onchange = () => pSet(sh, b, 'mode', sl.value);
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = S.rt.st[b.id].use || '';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(
      h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Select mode' }), sl]),
      h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Now using' }), e])
    );
  } else if (b.k === 'DIV' || b.k === 'SQRT') {
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = S.rt.st[b.id].bad
        ? b.k === 'DIV'
          ? 'INVALID: divide by zero (holds the last good value)'
          : 'INVALID: negative input (output 0)'
        : 'valid';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Condition' }), e]));
  } else if (b.k === 'PO') {
    const e = h$('span', { cls: 'v' });
    const f = () => {
      const q = S.rt.st[b.id];
      e.textContent = q.up ? 'raise pulse (PO1)' : q.dn ? 'lower pulse (PO2)' : 'no pulse';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Pulse output' }), e]));
    pr('cyc', 'Pulse cycle (s) ASSUMED');
    pr('stroke', 'Full stroke time (s) ASSUMED');
    pr('minp', 'Shortest pulse (s) ASSUMED');
    d.append(
      h$('small', {
        txt: 'Pulse output: a rise of the demand = raise pulse, a fall = lower pulse. Pulse cycle, full stroke and shortest pulse are NOT on the drawing: ASSUMED defaults (see docs/ASSUMED-VALUES.md), change them here.'
      })
    );
  } else if (b.k === 'PVSV') {
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent =
        'PV ' +
        fmt(S.rt.v[b.pv]) +
        '  <  SV ' +
        fmt(S.rt.v[b.sv]) +
        '  →  ' +
        (S.rt.v[b.pins.find(q => q.role === 'out').n] > 0.5 ? '1' : '0');
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Compare' }), e]));
    d.append(
      h$('small', {
        txt: 'Output = 1 when PV is smaller than SV. PV = the input on the right side, SV = the other one.'
      })
    );
  } else if (b.k === 'ACT' || b.k === 'VLV') {
    pr('stroke', 'Full stroke time (s)');
    const e = h$('span', { cls: 'v' }),
      st = S.rt.st[b.id];
    const f = () => {
      e.textContent = st.pos == null ? '--' : st.pos.toFixed(1) + ' %';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Position feedback' }), e]));
  } else if (b.k === 'DCMP') {
    (b.dc || []).forEach(q => d.append(h$('small', { txt: 'output: ' + q.txt })));
  } else if (b.q4) {
    const st = S.rt.st[b.id];
    b.q4.cond.forEach((c, i) => {
      const k = 'c' + (i + 1),
        cb = h$('input', { type: 'checkbox' });
      cb.checked = P[k] > 0.5;
      cb.onchange = () => pSet(sh, b, k, cb.checked ? 1 : 0);
      d.append(
        h$('div', { cls: 'r' }, [
          h$('span', { cls: 'n', txt: '(' + c.n + ') IF ' + c.txt + ' (' + c.tag + ') → leg ' + c.leg }),
          cb
        ])
      );
    });
    const e = h$('span', { cls: 'v' });
    const f = () => {
      e.textContent = st.q4l ? 'leg ' + st.q4l + ' is in use' : '-';
    };
    f._s = 1;
    PU.push(f);
    f();
    d.append(
      h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Selector' }), e]),
      h$('small', {
        txt:
          '4-way selector of the drawing: the conditions are memory flags (' +
          b.q4.cond.map(c => c.tag).join(', ') +
          ') made outside this sheet, so you set them here. The first true condition (1 to 4) picks its leg; none true: the last choice stays.'
      })
    );
  } else if (b.k === 'AMT' || b.k === 'SW' || b.k === 'COS') {
    const tg =
      b.k === 'COS'
        ? S.blk
            .filter(x => x.k === 'AMT' || x.k === 'SW')
            .sort((p, q) => Math.hypot(p.cx - b.cx, p.cy - b.cy) - Math.hypot(q.cx - b.cx, q.cy - b.cy))[0]
        : b;
    if (tg && Math.hypot(tg.cx - b.cx, tg.cy - b.cy) < 24) {
      const st = S.rt.st[tg.id],
        a = h$('select', {}, [
          h$('option', { value: '', txt: 'Auto (follows the select signal)' }),
          h$('option', { value: 'A', txt: 'Force input A' }),
          h$('option', { value: 'B', txt: 'Force input B' })
        ]);
      a.value = st.fm || '';
      a.onchange = () => swSet(sh, tg, a.value);
      const e = h$('span', { cls: 'v' });
      const f = () => {
        e.textContent = 'Active: ' + (st.pk || 'A') + (st.fm ? ' (forced)' : '');
      };
      f._s = 1;
      PU.push(f);
      f();
      d.append(h$('div', { cls: 'r' }, [h$('span', { cls: 'n', txt: 'Switch' }), e]), h$('div', { cls: 'r' }, [a]));
      d.append(
        h$('small', {
          txt: 'T = switching (A / B). COS = manual change-over: pick A or B here to override the select signal.'
        })
      );
    }
  } else if (b.k === 'MAN') {
    pr('lo', 'Low limit');
    pr('hi', 'High limit');
    if (b.face)
      d.append(
        h$('small', {
          txt:
            'From the DCS faceplate (MNO ' +
            b.face.mno +
            '): value range ' +
            b.face.SL +
            ' ~ ' +
            b.face.SH +
            ' ' +
            (b.face.unit || '') +
            ', MV limits ' +
            b.face.ML +
            ' ~ ' +
            b.face.MH +
            ' % of the range (the limits above). Recorded, not used yet: DH ' +
            b.face.DH +
            ', DT ' +
            b.face.DT +
            ' s, TF ' +
            b.face.TF +
            ' s, FSC ' +
            b.face.FSC +
            ' min, CUT ' +
            b.face.CUT +
            ', PHONDT ' +
            b.face.PHONDT +
            ', PLONDT ' +
            b.face.PLONDT +
            '.'
        })
      );
  } else if (b.k === 'HC' || b.k === 'LC' || b.k === 'HLC' || b.k === 'CMPK') {
    pr('sp', 'Setpoint' + (P.u ? ' (' + P.u + ')' : ''));
    d.append(
      h$('small', {
        txt:
          'Output = 1 when input ' +
          P.op +
          (P.inc ? '=' : '') +
          ' setpoint' +
          (P.found ? '' : '  (no number was found on the drawing: default 0)')
      })
    );
  } else if (b.k === 'TON' || b.k === 'TOF' || b.k === 'TPS') pr('sec', 'Time (sec)');
  else if (b.k === 'LAG') pr('tau', 'Time constant (sec)');
  else if (b.k === 'DRATE') {
    if (P.win == null) P.win = 30;
    pr('win', 'Window to measure the rate (sec): 5 / 10 / 30 / 60');
  } else if (b.k === 'RATE' || b.k === 'RAMPB') {
    pr('rate', 'Rate (signal units per sec)');
    if (b.dflt)
      d.append(
        h$('small', {
          txt:
            'ASSUMED rate (' +
            b.dflt.e.rate +
            ' ' +
            b.dflt.e.u +
            '): the drawing shows no number for this box. ' +
            b.dflt.e.loop +
            ' · ' +
            b.dflt.e.basis
        })
      );
  } else if (b.k === 'CONST' && P.mt) {
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', style: 'font-weight:bold', txt: 'Total air flow scale (T/H) - editable' }),
        num(P.th, x => pSet(sh, b, 'th', x), 5)
      ]),
      h$('small', {
        txt:
          'The drawing says ' +
          P.orig +
          ' % OF the minimum air flow. The signal is a percent of the TOTAL AIR FLOW scale 0 ~ 1115 T/H (the SCALE CONVERT constants of the drawing: PAF 648 + SAF 432 + FA 35 = 1115), so the default is 1115 T/H (same unit as SI0036 TAF DEMAND, T/H).'
      }),
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: P.orig + ' % x minimum air flow = signal to the high selector' }),
        h$('b', { txt: Math.round(((P.th * P.orig) / 100) * 1000) / 1000 + ' T/H' })
      ])
    );
  } else if (b.k === 'CONST') pr('val', 'Value');
  else if (b.k === 'FX') {
    const man = (window.ANLN || {})[P.ln],
      tb = P.tbl,
      pts = man || (tb && (tb.p2 || tb.pts));
    d.append(
      h$('div', { cls: 'r' }, [
        h$('span', { cls: 'n', txt: 'Table ' + (P.ln || '?') }),
        h$('small', {
          txt:
            pts && pts.length
              ? (man ? 'manual table · ' : '') +
                (tb && !man
                  ? tb.key +
                    ' · ' +
                    tb.dwg +
                    ' · ' +
                    (tb.src ? 'FROM THE FILE ' + tb.src + ' (not in LINEAR.xls) · ' : '')
                  : '') +
                pts.length +
                ' points'
              : 'no table: y = x'
        }),
        h$('button', { txt: 'Load…', onclick: () => lnOpen() })
      ])
    );
    if (tb && !man) d.append(h$('small', { txt: tb.title || '' }));
    if (P.lnWarn) d.append(h$('small', { style: 'color:#ffb24a', txt: '⚠ ' + P.lnWarn }));
    if (tb && /%/.test(tb.xu || '')) {
      const q = b.fxin;
      d.append(
        h$('small', {
          style: 'display:block;color:' + (b.fxrev ? '#ff6b6b' : '#8fd3ff'),
          txt: q
            ? q.k === 'ratio'
              ? 'Input to the table (%): ratio x 100 (1.0 = 100 %)'
              : 'Input to the table (%): (value - ' +
                q.lo +
                ') / (' +
                q.hi +
                ' - ' +
                q.lo +
                ') x 100   [source range ' +
                q.lo +
                ' ~ ' +
                q.hi +
                ' ' +
                q.u +
                ']'
            : b.fxrev
              ? 'Input to the table (%): source range not traced - NOT scaled (NEEDS REVIEW)'
              : 'Input to the table (%): the source is already 0 ~ 100 %'
        })
      );
      const sx = (cs().S.rt.st[b.id] || {}).fxx;
      if (sx !== undefined)
        d.append(h$('small', { style: 'display:block', txt: 'Table X now: ' + (+sx).toFixed(2) + ' %' }));
    }
    {
      const fs_ = (cs().S.rt.st[b.id] || {}).fxs,
        why =
          fs_ === 'NOTABLE'
            ? 'no table: the output is only a placeholder (y = x), it is NOT a converted value'
            : fs_ === 'OUT'
              ? 'the input is outside the domain of the table: the end value of the table is held'
              : fs_ === 'NAN'
                ? 'the input is not a number'
                : fs_ === 'SCALE'
                  ? 'the table takes a PERCENT of a range but the range of the source signal could not be traced without a guess: the input is NOT scaled'
                  : P.lnWarn
                    ? 'the table was chosen with a warning (see above)'
                    : '';
      if (why)
        d.append(h$('div', { style: 'color:#ff6b6b;font-weight:bold;margin:3px 0', txt: 'NEEDS REVIEW: ' + why }));
    }
    if (tb && !man && tb.xr && tb.yr && tb.o0) {
      const key = tb.key,
        box = h$('div', { style: 'display:none;margin:4px 0;padding:4px;border:1px solid var(--line)' }),
        btn = h$('button', { txt: tb.edited ? 'Edit table (edited)' : 'Edit table' });
      const cur = () => {
        const e = AN.lne[key];
        return {
          lx: e ? e.lx.slice() : tb.o0.map(q => ((q[0] - tb.xr[0]) / (tb.xr[1] - tb.xr[0])) * 100),
          ly: e ? e.ly.slice() : tb.o0.map(q => ((q[1] - tb.yr[0]) / (tb.yr[1] - tb.yr[0])) * 100)
        };
      };
      const f2 = v => (Math.round(v * 100) / 100).toString();
      const build = () => {
        box.innerHTML = '';
        box.append(
          h$('b', { txt: key + '  ·  ' + (tb.title || '') }),
          h$('small', {
            txt:
              'Edit LX % and LY % (as in the DCS). X and Y are calculated from the ranges: X ' +
              tb.xr[0] +
              ' … ' +
              tb.xr[1] +
              ' , Y ' +
              tb.yr[0] +
              ' … ' +
              tb.yr[1] +
              '. This edit has its own Reset and is NOT cleared by the global Reset.'
          })
        );
        const c = cur(),
          n = c.lx.length,
          xs = [],
          ys = [],
          warn = h$('small', { style: 'color:#ff7a7a' });
        const upd = () => {
          for (let i = 0; i < n; i++) {
            xs[i].textContent = f2(tb.xr[0] + (c.lx[i] * (tb.xr[1] - tb.xr[0])) / 100);
            ys[i].textContent = f2(tb.yr[0] + (c.ly[i] * (tb.yr[1] - tb.yr[0])) / 100);
          }
          let bad = false;
          for (let i = 1; i < n; i++) if (c.lx[i] < c.lx[i - 1]) bad = true;
          warn.textContent = bad ? '⚠ LX must not decrease from row to row' : '';
        };
        const commit = (i, k, x) => {
          c[k][i] = x;
          AN.lne[key] = { lx: c.lx.slice(), ly: c.ly.slice() };
          lneSave();
          lnApplyEdits();
          btn.textContent = 'Edit table (edited)';
          upd();
          settle();
        };
        box.append(
          h$('div', { cls: 'r', style: 'font-weight:700' }, [
            h$('span', { txt: 'NO.', style: 'width:26px' }),
            h$('span', { txt: 'LX %', style: 'width:74px' }),
            h$('span', { txt: 'LY %', style: 'width:74px' }),
            h$('span', { txt: 'X', style: 'width:60px' }),
            h$('span', { txt: 'Y', style: 'width:60px' })
          ])
        );
        for (let i = 0; i < n; i++) {
          const ix = num(f2(c.lx[i]), x => commit(i, 'lx', x)),
            iy = num(f2(c.ly[i]), x => commit(i, 'ly', x));
          ix.style.width = iy.style.width = '70px';
          const sx = h$('span', { style: 'width:60px;color:var(--dim)' }),
            sy = h$('span', { style: 'width:60px;color:var(--dim)' });
          xs.push(sx);
          ys.push(sy);
          box.append(
            h$('div', { cls: 'r' }, [
              h$('span', { txt: String(i + 1).padStart(2, '0'), style: 'width:26px' }),
              ix,
              iy,
              sx,
              sy
            ])
          );
        }
        box.append(
          warn,
          h$('div', { cls: 'r' }, [
            h$('button', {
              txt: 'Reset this table',
              title: 'Back to the DCS values (LINEAR.xls). Only this table.',
              onclick: () => {
                delete AN.lne[key];
                lneSave();
                lnApplyEdits();
                btn.textContent = 'Edit table';
                settle();
                build();
              }
            })
          ])
        );
        upd();
      };
      btn.onclick = () => {
        if (box.style.display === 'none') {
          build();
          box.style.display = 'block';
        } else box.style.display = 'none';
      };
      d.append(h$('div', { cls: 'r' }, [btn]), box);
    }
    if (pts && pts.length > 1) {
      const NS = 'http://www.w3.org/2000/svg',
        W = 230,
        H = 96,
        xs = pts.map(q => q[0]),
        ys = pts.map(q => q[1]),
        x0 = Math.min(...xs),
        x1 = Math.max(...xs),
        y0 = Math.min(...ys),
        y1 = Math.max(...ys),
        X = v => 8 + ((v - x0) / (x1 - x0 || 1)) * (W - 16),
        Y = v => H - 8 - ((v - y0) / (y1 - y0 || 1)) * (H - 16),
        sv_ = document.createElementNS(NS, 'svg');
      sv_.setAttribute('width', W);
      sv_.setAttribute('height', H);
      sv_.style.background = '#0b1013';
      sv_.style.border = '1px solid var(--line)';
      const pl = document.createElementNS(NS, 'polyline');
      pl.setAttribute('points', pts.map(q => X(q[0]) + ',' + Y(q[1])).join(' '));
      pl.setAttribute('fill', 'none');
      pl.setAttribute('stroke', '#7dffb0');
      sv_.append(pl);
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', 3.5);
      dot.setAttribute('fill', '#ffb020');
      sv_.append(dot);
      d.append(sv_);
      const f = () => {
        const xin = S.rt.v[b.i[0]],
          yo = S.rt.v[b.o[0]];
        dot.setAttribute('cx', Math.max(8, Math.min(W - 8, X(xin))));
        dot.setAttribute('cy', Math.max(8, Math.min(H - 8, Y(yo))));
      };
      f._s = 1;
      PU.push(f);
      f();
      d.append(
        h$('small', {
          txt: 'x ' + x0 + ' … ' + x1 + '   y ' + y0 + ' … ' + y1 + '   (orange dot = live operating point)'
        })
      );
    }
  }
}
