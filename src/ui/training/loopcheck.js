/* ===== 3.2.1-beta.4 LOOP CHECK DOCK (user 2026-11-04: "may dock na checklist na makikita natin sa totoong pindot mo, at hindi code";
   mockup of the team https://claude.ai/artifact/4UbnHivhBbaUUB7WNJ7k4u). The loop check of one system as a panel beside the app, the
   same place as the Training dock: one card per tag and action, from docs/versions/v3.2.1/CW_LOOP_CHECK.md (the expected values are
   the ones written there, with the sources of CW_PLANT_MODEL.md). The operator makes a REAL press on the HMI page (faceplate START /
   STOP + EXECUTE, FIELD REMOTE / LOCAL, a field valve opening); the card sees the press by itself and checks three things:
     (a) PLANT MODEL  : the value of the plant model moved (AN.unit: current, flow, pressure, DP);
     (b) SIGNAL       : the address of the I/O list / memory list changed (the P.B. memory, the running / remote DI read by ANOTHER sheet);
     (c) LOGIC        : the DITL output row and the ABC memory followed (one world).
   PASS when all three agree for 2 s after the press (plant seconds), FAIL with the reason when the time of the card runs out. Nothing is
   pressed or forced by this panel: it only reads (LS_DOCK / DUI / WORLD / AN.unit, the same readers as the Training dock and the HMI).
   A check with no address or logic row for that tag says so (–) and is not counted. Results stay in this browser (localStorage). */
(function () {
  const ls = {
    get: (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {}
    }
  };
  const call = (f, d) => {
    try {
      const x = f();
      return x == null ? d : x;
    } catch (e) {
      return d;
    }
  };
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const isRun = () =>
    !!(window.AN && ((AN.cat === 'an' && AN.run && !AN.view) || (AN.cat !== 'an' && typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE))));
  const Un = () => (window.AN && AN.unit && AN.unit.on ? AN.unit : null);
  const u = k => {
    const U = Un();
    return U && isFinite(U[k]) ? +U[k] : null;
  };
  const f1 = (x, d) => (x == null || !isFinite(x) ? '—' : (+x).toFixed(d == null ? 1 : d));
  const fi = x => (x == null || !isFinite(x) ? '—' : Math.round(x).toLocaleString('en-US'));
  const inR = (x, a, b) => x != null && isFinite(x) && x >= a && x <= b;
  /* ---------- readers (the same ones the Training dock and the HMI pages use) ---------- */
  const dsh = ad => call(() => LS_DOCK.dOf(ad), null);
  const mst = ad => call(() => LS_DOCK.mst(ad), null);
  const rowV = (ad, r) => {
    const s = dsh(ad);
    return s && r >= 0 ? call(() => DUI.rowVal(s, r), null) : null;
  };
  const outV = (ad, r) => {
    const s = dsh(ad);
    return s && r >= 0 ? call(() => DUI.outVal(s, r), null) : null;
  };
  const addrOf = (ad, r) => {
    const s = dsh(ad);
    return (s && r >= 0 && call(() => WORLD.addrK(s, r), null)) || '';
  };
  const shName = ad => String((dsh(ad) || {}).name || ad).replace(/^\(\d+\)/, '');
  /* the input row of a drawing whose text matches (a push button of the CRT, not the LOCAL one of the field) */
  const RC = {};
  const rowBy = (ad, re) => {
    const s = dsh(ad);
    if (!s) return -1;
    const k = ad + '|' + re;
    if (RC[k] && RC[k].s === s) return RC[k].r;
    let r0 = -1;
    for (let r = 0; r < 40; r++) {
      const v = call(() => DUI.rowInfo(s, r).svc, '');
      if (re.test(v) && !/LOCAL/.test(v)) {
        r0 = r;
        break;
      }
    }
    RC[k] = { s, r: r0 };
    return r0;
  };
  const outBy = (ad, re, no) => {
    const s = dsh(ad);
    const o = s && call(() => DUI.outs(s).find(x => re.test(x.name) && !(no && no.test(x.name))), null);
    return o ? o.row : -1;
  };
  /* a memory bit of the ABC sheets by its name (M.3354 = SEAWATER PUMP B RUNNING, ABC-052): the bit the plant model reads */
  const AC = {};
  const abc = nm => {
    if (!window.AN || !AN.sheets) return null;
    let c = AC[nm];
    if (!c || !c.S || !c.S.rt) {
      c = null;
      for (const s of AN.sheets) {
        const S = s.S;
        if (!S || !S.rt) continue;
        for (let i = 0; i < S.rt.v.length; i++)
          if (String(call(() => AN.nm(S, i), '') || '').replace(/^S\d\s*/, '').trim() === nm) {
            c = { S, i, sh: s.name };
            break;
          }
        if (c) break;
      }
      if (!c) return null;
      AC[nm] = c;
    }
    return { v: +c.S.rt.v[c.i] > 0.5 ? 1 : 0, sh: c.sh };
  };
  /* the I/O list (tag -> address, station), read once */
  const IO = {};
  let ioP = null;
  const ioLoad = () => {
    if (ioP || !window.AN || !AN.ades) return;
    ioP = Promise.resolve(call(() => AN.ades(), null))
      .then(D => {
        for (const st in D || {})
          for (const a in D[st]) {
            const r = D[st][a];
            if (r && r.tag && (/^A[IO]\d{4}$/.test(a) || /^[IO]\.[0-9A-F]{4}$/.test(a))) {
              const k = String(r.tag).trim();
              if (!IO[k]) IO[k] = { a, st: 'STN10' + st, d: r.d || '' };
            }
          }
      })
      .catch(() => (ioP = null));
  };
  const io = t => (IO[t] ? IO[t].a + ' ' + IO[t].st : 'not in the I/O list');
  /* the field valves of the plant model (AN.swValves); a press of the FIELD faceplate is also caught here (AN.swValve) */
  const VSET = {};
  const vpos = t => {
    const m = call(() => AN.swValves(), null);
    if (m && isFinite(m[t])) return +m[t];
    return t in VSET ? VSET[t] : null;
  };
  let hooked = false;
  const hook = () => {
    if (hooked || !window.AN || !AN.swValve) return;
    const f = AN.swValve;
    AN.swValve = function (t, p) {
      VSET[t] = +p;
      return f.apply(this, arguments);
    };
    hooked = true;
  };
  /* ---------- the checks of a card: { ok: true | false | null (no such check for this tag), t: what was read } ---------- */
  const NA = t => ({ ok: null, t });
  const CK = (ok, t) => ({ ok: !!ok, t });
  /* ---------- CIRCULATING WATER (seawater) cards, docs/versions/v3.2.1/CW_LOOP_CHECK.md ---------- */
  const SWP = [
    { k: 'A', i: 0, n: 'SWP-A', t: 'P-1501A', ad: 'M.3353', dv: 'V-SW1002', lr: 16 },
    { k: 'B', i: 1, n: 'SWP-B', t: 'P-1501B', ad: 'M.3354', dv: 'V-SW1004', lr: 17 },
    { k: 'C', i: 2, n: 'SWP-C', t: 'P-1501C', ad: 'M.3355', dv: 'V-SW1006', lr: 18 }
  ];
  const SWBP = [
    { k: 'A', i: 0, n: 'SWBP-A', t: 'P-1503A', ad: 'DITL-30', dv: 'V-SW1016', lr: 0 },
    { k: 'B', i: 1, n: 'SWBP-B', t: 'P-1503B', ad: 'DITL-30 #B', dv: 'V-SW1018', lr: 8 },
    { k: 'C', i: 2, n: 'SWBP-C', t: 'P-1503C', ad: 'DITL-30 #C', dv: 'V-SW1020', lr: 10 }
  ];
  const swRunN = () => SWP.filter(m => mst(m.ad) === 'RUN').length;
  /* the running DI of a pump as another sheet reads it: DITL-30 rows 16 ~ 18 (SWP A / B / C), rows 0 / 8 / 10 (SWBP A / B / C) */
  const diRun = (m, tag) => {
    const v = rowV('DITL-30', m.lr),
      a = addrOf('DITL-30', m.lr) || (IO['MIR-' + tag.replace(/^P-/, 'P')] || {}).a || '';
    return { v, t: a + ' RUNNING = ' + (v == null ? '—' : v) + ' (read by DITL-30 row ' + (m.lr + 1) + ')' };
  };
  const ready = () => (!Un() ? 'Plant model is OFF: turn it on (top right), pick "At 150 MW", then RUN.' : !isRun() ? 'Simulation not running: press RUN (top right).' : '');
  /* a START / STOP card of a motor (SWP: DITL-29A, SWBP: DITL-30) */
  function motorCard(m, sys, on) {
    const swp = sys === 'SWP',
      Ik = (swp ? 'swIa' : 'swIb') + m.i,
      Qk = (swp ? 'swQa' : 'swQb') + m.i,
      sheet = swp ? 'DITL-29A' : 'DITL-30';
    const stR = () => rowBy(m.ad, /START P\.?\s*B/),
      spR = () => rowBy(m.ad, /STOP P\.?\s*B/),
      runO = () => outBy(m.ad, /RUNNING/, /NOT RUNNING|STOP|ANY/),
      stpO = () => outBy(m.ad, /STOPPED · CRT/);
    const want = on ? 'RUN' : 'STOP';
    return {
      id: m.n + (on ? '-start' : '-stop'),
      sec: swp ? 'B' : 'E',
      tag: m.t,
      title: m.n + (swp ? ' · Seawater pump ' : ' · Seawater booster pump ') + m.k + (on ? ' START' : ' STOP'),
      logic: sheet + (m.k === 'A' ? '' : ' #' + m.k),
      src: swp ? (on ? 'CW_LOOP_CHECK B3 / B4' : 'CW_LOOP_CHECK B1') : on ? 'CW_LOOP_CHECK E2' : 'CW_LOOP_CHECK E',
      act: 'Faceplate ' + (on ? 'START' : 'STOP') + ' + EXECUTE' + (on ? ' (pump in REMOTE)' : ''),
      exp: swp
        ? on
          ? 'About 500 A while the soft starter ramps (about 10 s), then the motor load (TECO table 166 ~ 317 A); flow and PG-SW1501' + m.k + ' up.'
          : 'STOPPED (green), current 0, PG 0; the other pump takes more flow.'
        : on
          ? 'About 274 A for the first 5 s (Y / Δ), then about 90 A; discharge 2.3 ~ 2.4 kg/cm² with the valve open.'
          : 'STOPPED (green), current 0.',
      fp: { ad: m.ad },
      tr: 1,
      pre: () => {
        const s = mst(m.ad);
        if (s == null) return 'The logic of ' + m.n + ' is not loaded yet.';
        if (s === 'TRIP') return m.n + ' is in TRIP: reset it first.';
        if (s === want) return m.n + ' is ' + (on ? 'running' : 'stopped') + ' now: ' + (on ? 'stop' : 'start') + ' it first, then come back to this card.';
        if (on && !swp && swRunN() === 0) return 'No seawater pump is running: start one first (card E1 is the test without a seawater pump).';
        return '';
      },
      seen: (b, M) => b.st !== want && mst(m.ad) === want,
      watch: M => {
        M.pk = Math.max(M.pk || 0, u(Ik) || 0);
        if (rowV(m.ad, on ? stR() : spR()) === 1) M.pb = 1;
      },
      min: on ? (swp ? 14 : 8) : 3,
      max: on ? 45 : 25,
      checks: M => {
        const I = u(Ik),
          Q = u(Qk),
          d = diRun(m, m.t),
          r = on ? runO() : stpO(),
          lv = outV(m.ad, r),
          A = swp ? abc(m.ad) : null,
          pbA = addrOf(m.ad, on ? stR() : spR()) || (on ? 'START' : 'STOP') + ' P.B.';
        let a;
        if (on && swp) a = CK(inR(M.pk, 470, 530) && inR(I, 150, 317) && Q > 0, 'peak ' + fi(M.pk) + ' A (500 ± 30), now ' + fi(I) + ' A (150 ~ 317), flow ' + fi(Q) + ' m³/h');
        else if (on) a = CK(inR(M.pk, 247, 301) && inR(I, 81, 99), 'peak ' + fi(M.pk) + ' A (274 ± 10 %), now ' + fi(I) + ' A (90 ± 10 %)');
        else a = CK(I != null && I < 1 && Q != null && Q < 1 && (!swp || (u('swPd' + m.i) || 0) < 0.05), 'current ' + fi(I) + ' A, flow ' + fi(Q) + ' m³/h' + (swp ? ', PG ' + f1(u('swPd' + m.i), 2) : ''));
        const b = CK(M.pb === 1 && d.v === (on ? 1 : 0), pbA + ' = ' + (M.pb ? 1 : 0) + ' (pressed) · ' + d.t);
        const c = CK(lv === 1 && (!A || A.v === (on ? 1 : 0)), shName(m.ad) + ' output row ' + (r + 1) + (on ? ' RUNNING' : ' STOPPED') + ' = ' + (lv == null ? '—' : lv) + (A ? ' · ' + A.sh + ' ' + m.ad + ' = ' + A.v : ''));
        return [a, b, c];
      }
    };
  }
  /* LOCAL -> REMOTE of the field selector (CW_LOOP_CHECK B7, the permissive "Remote") */
  function remoteCard(m) {
    const rr = () => rowBy(m.ad, /REMOTE MODE SELECTED/),
      ro = () => outBy(m.ad, /REMOTE/);
    return {
      id: m.n + '-remote',
      sec: 'B',
      tag: m.t,
      title: m.n + ' · Seawater pump ' + m.k + ' REMOTE',
      logic: 'DITL-29A' + (m.k === 'A' ? '' : ' #' + m.k) + ' permissive',
      src: 'CW_LOOP_CHECK B7',
      act: 'Faceplate FIELD: LOCAL, then REMOTE',
      exp: 'Selector REMOTE; the "Remote" permissive turns Y (red).',
      fp: { ad: m.ad },
      pre: () => (mst(m.ad) === 'RUN' ? m.n + ' is running: stop it first (a running pump is not put to LOCAL).' : ''),
      seen: (b, M) => M.saw0 && rowV(m.ad, rr()) === 1,
      watch: M => {
        if (rowV(m.ad, rr()) === 0) M.saw0 = 1;
      },
      hint: M => (M.saw0 ? '' : 'Now REMOTE: press LOCAL first, then REMOTE.'),
      min: 1,
      max: 15,
      checks: () => {
        const md = call(() => LS_DOCK.modeOf(m.ad), null),
          v = rowV(m.ad, rr()),
          I = call(() => LS_DOCK.interlock(m.ad), null),
          rows = I ? I.rows.filter(x => /REMOTE/.test(x.svc)) : [],
          o = outV(m.ad, ro());
        return [
          CK(md && md.rem, 'field selector ' + (md ? (md.rem ? 'REMOTE' : 'LOCAL') : '—')),
          CK(v === 1, (addrOf(m.ad, rr()) || io('MIL-P1501' + m.k)) + ' REMOTE = ' + (v == null ? '—' : v)),
          CK(rows.length && rows.every(x => x.ok) && o === 1, 'permissive "Remote" = ' + (rows.length ? (rows.every(x => x.ok) ? 'Y' : 'N') : '—') + ' · output row ' + (ro() + 1) + ' REMOTE SELECTED = ' + (o == null ? '—' : o))
        ];
      }
    };
  }
  /* the trip interlock of DITL-29B (CW_LOOP_CHECK B6): forced by the test tool, the operator has no button */
  function tripCard(m) {
    const ti = () => rowBy(m.ad, new RegExp('PUMP ' + m.k + ' TRIP INTERLOCK')),
      to = () => outBy(m.ad, /TRIP/);
    return {
      id: m.n + '-trip',
      sec: 'B',
      tag: m.t,
      title: m.n + ' · trip interlock',
      logic: 'DITL-29B → DITL-29A' + (m.k === 'A' ? '' : ' #' + m.k),
      src: 'CW_LOOP_CHECK B6 · alarm list',
      act: 'Logic page (RUN): force TT-SW1501-' + m.k + '3 above 100 °C (or winding above 155, vibration above ' + (m.k === 'B' ? '16.8' : '11.9') + ') for 5 s. Test tool: the operator has no button.',
      exp: 'TRIP INTERLOCK after 5 s, the pump STOPS (red blinking TRIP).',
      fp: { ad: m.ad },
      pre: () => (mst(m.ad) !== 'RUN' ? m.n + ' is not running: start it first.' : ''),
      seen: (b, M) => M.ti === 1 && mst(m.ad) !== 'RUN',
      watch: M => {
        if (rowV(m.ad, ti()) === 1) M.ti = 1;
      },
      min: 2,
      max: 30,
      checks: M => {
        const I = u('swIa' + m.i),
          d = diRun(m, m.t),
          o = outV(m.ad, to());
        return [
          CK(I != null && I < 1, 'current ' + fi(I) + ' A'),
          CK(M.ti === 1 && d.v === 0, (addrOf(m.ad, ti()) || 'TRIP INTERLOCK') + ' = ' + (M.ti ? 1 : 0) + ' (seen) · ' + d.t),
          CK(o === 1 || mst(m.ad) === 'TRIP', shName(m.ad) + ' output row ' + (to() + 1) + ' TRIP = ' + (o == null ? '—' : o))
        ];
      }
    };
  }
  /* a field valve card: the opening is the action, the plant model the check (no address, no logic row: a manual valve) */
  function valveCard(o) {
    return {
      id: o.id,
      sec: o.sec,
      tag: o.v,
      title: o.title,
      logic: '',
      src: o.src,
      act: o.act,
      exp: o.exp,
      fp: { valve: o.v },
      pre: o.pre || (() => ''),
      hint: o.hint,
      seen: (b, M) => o.seen(b, vpos(o.v)),
      min: o.min || 20,
      max: o.max || 90,
      base: o.base,
      watch: o.watch,
      checks: M => [o.plant(M), NA((typeof o.sig === 'function' ? o.sig() : o.sig) || 'manual valve (field): no DCS address'), NA('no logic row (field valve)')]
    };
  }
  /* a reading card at the operating point (section A, E4): no press, the values are read as they are */
  function readCard(o) {
    return {
      id: o.id,
      sec: o.sec,
      tag: o.tag,
      title: o.title,
      logic: '',
      src: o.src,
      act: o.act || 'Read at 150 MW (no press)',
      exp: o.exp,
      fp: { page: 1 },
      read: 1,
      unusual: o.unusual,
      pre: o.pre || (() => (swRunN() ? '' : 'No seawater pump is running: start at 150 MW first.')),
      seen: () => true,
      min: 3,
      max: 15,
      checks: () => [o.plant(), NA(typeof o.sig === 'function' ? o.sig() : o.sig), NA(o.logic || 'no logic row for this tag')]
    };
  }
  const pathA = { A: { i: 'A', inl: 'V-SW1007', out: 'V-SW1009' }, B: { i: 'B', inl: 'V-SW1008', out: 'V-SW1010' } };
  function cwCards() {
    const L = [];
    const run = () => SWP.filter(m => mst(m.ad) === 'RUN');
    /* A. at 150 MW */
    L.push(
      readCard({
        id: 'A1-pg',
        sec: 'A',
        tag: 'PG-SW1501',
        title: 'SWP discharge pressure (running pumps)',
        src: 'CW_LOOP_CHECK A1 · PR-OPE-5002 sec 2',
        exp: '2.2 ~ 2.4 kg/cm²',
        sig: 'local gauge PG-SW1501 (no DCS address)',
        plant: () => {
          const R = run();
          return CK(R.length && R.every(m => inR(u('swPd' + m.i), 2.2, 2.4)), R.map(m => m.k + ' ' + f1(u('swPd' + m.i), 2)).join(' · ') + ' kg/cm²');
        }
      }),
      readCard({
        id: 'A1-pin',
        sec: 'A',
        tag: 'PT-SW1110-A1 / B1',
        title: 'Condenser seawater inlet pressure',
        src: 'CW_LOOP_CHECK A1',
        exp: '1.0 ~ 1.15 kg/cm²',
        sig: () => 'I/O list ' + 'PT-SW1110-A1 ' + io('PT-SW1110-A1') + ', B1 ' + io('PT-SW1110-B1') + ' · not on a logic sheet: value = plant model',
        plant: () => CK(inR(u('swPiA'), 1.0, 1.15) && inR(u('swPiB'), 1.0, 1.15), 'A ' + f1(u('swPiA'), 2) + ' · B ' + f1(u('swPiB'), 2) + ' kg/cm²')
      }),
      readCard({
        id: 'A1-pout',
        sec: 'A',
        tag: 'PT-SW1110-A2 / B2',
        title: 'Condenser seawater outlet pressure',
        src: 'CW_LOOP_CHECK A1',
        exp: 'about 0.4 kg/cm² below the inlet (drop 0.3 ~ 0.5)',
        sig: () => 'I/O list PT-SW1110-A2 ' + io('PT-SW1110-A2') + ', B2 ' + io('PT-SW1110-B2') + ' · value = plant model',
        plant: () => {
          const a = (u('swPiA') || 0) - (u('swPoA') || 0),
            b = (u('swPiB') || 0) - (u('swPoB') || 0);
          return CK(inR(a, 0.3, 0.5) && inR(b, 0.3, 0.5), 'A ' + f1(u('swPoA'), 2) + ' (drop ' + f1(a, 2) + ') · B ' + f1(u('swPoB'), 2) + ' (drop ' + f1(b, 2) + ') kg/cm²');
        }
      }),
      readCard({
        id: 'A1-dp',
        sec: 'A',
        tag: 'DPT-SW1502',
        title: 'Debris filter S-1502 DP',
        src: 'CW_LOOP_CHECK A1 · debris filter O&M (clean 500 mmH2O)',
        exp: 'about 500 mmH2O (check band 400 ~ 600)',
        sig: 'package gauge of the debris filter (no DCS address)',
        plant: () => CK(inR(u('swDp1'), 400, 600), fi(u('swDp1')) + ' mmH2O')
      }),
      readCard({
        id: 'A1-tout',
        sec: 'A',
        tag: 'TT-SW1110-A2 / B2',
        title: 'Condenser seawater outlet temperature',
        src: 'CW_LOOP_CHECK A1',
        exp: '33 ~ 36 °C',
        sig: () => 'I/O list TT-SW1110-A2 ' + io('TT-SW1110-A2') + ', B2 ' + io('TT-SW1110-B2') + ' · value = plant model',
        plant: () => CK(inR(u('swToA'), 33, 36) && inR(u('swToB'), 33, 36), 'A ' + f1(u('swToA')) + ' · B ' + f1(u('swToB')) + ' °C')
      }),
      readCard({
        id: 'A2-cur',
        sec: 'A',
        tag: 'IT-P1501x',
        title: 'SWP motor current (running pumps)',
        src: 'CW_LOOP_CHECK A2 · TECO motor table',
        exp: 'about 225 ~ 232 A (vendor). SOP 205 ~ 215 A is noted UNUSUAL, not FAIL.',
        sig: () => 'I/O list IT-P1501A ' + io('IT-P1501A') + ', B ' + io('IT-P1501B') + ', C ' + io('IT-P1501C') + ' · no logic sheet reads it: value = plant model',
        unusual: () => (run().some(m => !inR(u('swIa' + m.i), 205, 215)) ? 'UNUSUAL: outside the SOP 205 ~ 215 A (the vendor data is the check).' : ''),
        plant: () => {
          const R = run();
          return CK(R.length && R.every(m => inR(u('swIa' + m.i), 225, 232)), R.map(m => m.k + ' ' + f1(u('swIa' + m.i))).join(' · ') + ' A');
        }
      }),
      readCard({
        id: 'A3-swbp',
        sec: 'A',
        tag: 'PG-SW1503x',
        title: 'SWBP suction, discharge and current (running pumps)',
        src: 'CW_LOOP_CHECK A3 · PR-OPE-5002 sec 5',
        exp: 'suction 1.0 ~ 1.1, discharge 2.3 ~ 2.4 kg/cm², current about 90 A (check band 81 ~ 99)',
        sig: () => 'local gauges; IT-P1503A ' + io('IT-P1503A') + ' · value = plant model',
        plant: () => {
          const R = SWBP.filter(m => mst(m.ad) === 'RUN');
          return CK(
            R.length && R.every(m => inR(u('swBs' + m.i), 1.0, 1.1) && inR(u('swBd' + m.i), 2.3, 2.4) && inR(u('swIb' + m.i), 81, 99)),
            R.length ? R.map(m => m.k + ' ' + f1(u('swBs' + m.i), 2) + ' / ' + f1(u('swBd' + m.i), 2) + ' kg/cm², ' + fi(u('swIb' + m.i)) + ' A').join(' · ') : 'no SWBP running'
          );
        }
      })
    );
    /* B. each seawater pump */
    for (const m of SWP) {
      L.push(motorCard(m, 'SWP', false), remoteCard(m), motorCard(m, 'SWP', true));
      L.push(
        valveCard({
          id: m.n + '-v10',
          sec: 'B',
          v: m.dv,
          title: m.n + ' · discharge valve ' + m.dv + ' 10 % (crack)',
          src: 'CW_LOOP_CHECK B3 · EBARA O&M 4.2',
          act: 'Pump running: FIELD faceplate of ' + m.dv + ' → 10 %',
          exp: 'PG about 3.9 kg/cm² (above 3.3), flow below the min 5,000 m³/h, the shut-off seconds count up (open within 2 min).',
          pre: () => (mst(m.ad) !== 'RUN' ? m.n + ' is not running: start it first.' : ''),
          seen: (b, p) => b.v > 12 && p != null && p <= 12,
          base: () => ({ v: vpos(m.dv) }),
          min: 25,
          plant: () => CK((u('swPd' + m.i) || 0) > 3.3 && u('swQa' + m.i) < 5000 && (call(() => Un().swLow[m.i], 0) || 0) > 0, 'PG ' + f1(u('swPd' + m.i), 2) + ' kg/cm², flow ' + fi(u('swQa' + m.i)) + ' m³/h, shut-off ' + fi(call(() => Un().swLow[m.i], null)) + ' s')
        }),
        valveCard({
          id: m.n + '-vopen',
          sec: 'B',
          v: m.dv,
          title: m.n + ' · open ' + m.dv + ' to PG 2.2 ~ 2.4',
          src: 'CW_LOOP_CHECK B4 · PR-OPE-5002 sec 2',
          act: 'From 10 %: open ' + m.dv + ' (FIELD faceplate) step by step until PG-SW1501' + m.k + ' is 2.2 ~ 2.4',
          exp: 'Flow up, PG down; PG-SW1501' + m.k + ' 2.2 ~ 2.4 kg/cm².',
          pre: () => (mst(m.ad) !== 'RUN' ? m.n + ' is not running: start it first.' : ''),
          seen: (b, p) => b.v != null && p != null && p > b.v,
          base: () => ({ v: vpos(m.dv), q: u('swQa' + m.i) }),
          min: 15,
          max: 180,
          plant: () => CK(inR(u('swPd' + m.i), 2.2, 2.4), 'PG ' + f1(u('swPd' + m.i), 2) + ' kg/cm², flow ' + fi(u('swQa' + m.i)) + ' m³/h, valve ' + fi(vpos(m.dv)) + ' %')
        }),
        valveCard({
          id: m.n + '-v100',
          sec: 'B',
          v: m.dv,
          title: m.n + ' · one pump alone, ' + m.dv + ' 100 %',
          src: 'CW_LOOP_CHECK B5 · EBARA data sheet (max 22,680 m³/h)',
          act: 'Only ' + m.n + ' running: FIELD faceplate of ' + m.dv + ' → OPEN (100 %)',
          exp: 'Flow above 22,680 m³/h (run-out, UNUSUAL flag), PG about 1.1 kg/cm². The reason the SOP adjusts the valve.',
          pre: () => (mst(m.ad) !== 'RUN' ? m.n + ' is not running: start it first.' : swRunN() !== 1 ? 'Stop the other seawater pumps first: only ' + m.n + ' runs in this test.' : ''),
          seen: (b, p) => b.v != null && b.v < 100 && p === 100,
          base: () => ({ v: vpos(m.dv) }),
          plant: () => CK(u('swQa' + m.i) > 22680 && (call(() => Un().swRunout[m.i], 0) || 0) > 0 && (u('swPd' + m.i) || 9) < 1.6, 'flow ' + fi(u('swQa' + m.i)) + ' m³/h, run-out flag ' + call(() => Un().swRunout[m.i], '—') + ', PG ' + f1(u('swPd' + m.i), 2) + ' kg/cm²')
        })
      );
      L.push(tripCard(m));
    }
    /* B2: every seawater pump stopped */
    L.push({
      id: 'B2-allstop',
      sec: 'B',
      tag: 'P-1501A / B / C',
      title: 'All seawater pumps stopped',
      logic: 'DITL-30 · DITL-39',
      src: 'CW_LOOP_CHECK B2',
      act: 'Faceplate STOP + EXECUTE of each running seawater pump',
      exp: 'All flow and pressure 0, current 0; "any SWP running" = N (DITL-30). Vacuum falls (turbine trip at 150 MW).',
      fp: { page: 1 },
      tr: 1,
      pre: () => (swRunN() === 0 ? 'All seawater pumps are stopped now: start one, then stop them all.' : ''),
      base: () => ({ n: swRunN() }),
      seen: b => b.n > 0 && swRunN() === 0,
      min: 5,
      max: 30,
      checks: () => {
        const r = SWP.map(m => rowV('DITL-30', m.lr)),
          any = outBy('DITL-39', /ANY SEAWATER PUMP RUNNING/),
          o = outV('DITL-39', any);
        return [
          CK(u('swQt') < 1 && SWP.every(m => (u('swIa' + m.i) || 0) < 1) && u('swPiA') < 0.05, 'total flow ' + fi(u('swQt')) + ' m³/h, current ' + SWP.map(m => fi(u('swIa' + m.i))).join(' / ') + ' A, inlet ' + f1(u('swPiA'), 2)),
          CK(r.every(v => v === 0), SWP.map((m, j) => (addrOf('DITL-30', m.lr) || m.k) + ' = ' + (r[j] == null ? '—' : r[j])).join(' · ') + ' (DITL-30)'),
          CK(o === 0, 'DITL-39 output row ' + (any + 1) + ' ANY SEAWATER PUMP RUNNING = ' + (o == null ? '—' : o))
        ];
      }
    });
    /* C. condenser path A / B */
    for (const k of ['A', 'B']) {
      const P = pathA[k];
      L.push(
        valveCard({
          id: 'C1-' + k,
          sec: 'C',
          v: P.out,
          title: 'Condenser ' + k + ' outlet valve ' + P.out + ' 40 % → 22 %',
          src: 'CW_LOOP_CHECK C1',
          act: 'FIELD faceplate of ' + P.out + ': 22 %',
          exp: 'Inlet pressure PT-SW1110-' + k + '1 up (about 2.5 ~ 2.6), flow down, outlet temperature up.',
          pre: () => (swRunN() ? '' : 'No seawater pump is running.'),
          hint: () => (vpos(P.out) !== 40 ? P.out + ' is at ' + fi(vpos(P.out)) + ' %: set it to 40 % first, then 22 %.' : ''),
          seen: (b, p) => b.v >= 35 && p != null && p <= 25,
          base: () => ({ v: vpos(P.out), pi: u('swPi' + k), q: u('swQc' + k), to: u('swTo' + k) }),
          sig: () => 'PT-SW1110-' + k + '1 ' + io('PT-SW1110-' + k + '1') + ' · not on a logic sheet: value = plant model',
          plant: M => {
            const pi = u('swPi' + k),
              q = u('swQc' + k),
              to = u('swTo' + k),
              b = M.b || {};
            return CK(pi > (b.pi || 0) + 0.2 && q < (b.q || 0) && to > (b.to || 0), 'inlet ' + f1(b.pi, 2) + ' → ' + f1(pi, 2) + ' kg/cm², flow ' + fi(b.q) + ' → ' + fi(q) + ' m³/h, outlet ' + f1(b.to) + ' → ' + f1(to) + ' °C');
          }
        }),
        valveCard({
          id: 'C2-' + k,
          sec: 'C',
          v: P.out,
          title: 'Condenser ' + k + ' outlet valve back to 40 %',
          src: 'CW_LOOP_CHECK C2',
          act: 'FIELD faceplate of ' + P.out + ': 40 %',
          exp: 'Inlet pressure back to 1.0 ~ 1.15 kg/cm².',
          pre: () => (swRunN() ? '' : 'No seawater pump is running.'),
          seen: (b, p) => b.v != null && b.v < 35 && p === 40,
          base: () => ({ v: vpos(P.out) }),
          sig: () => 'PT-SW1110-' + k + '1 ' + io('PT-SW1110-' + k + '1') + ' · value = plant model',
          plant: () => CK(inR(u('swPi' + k), 1.0, 1.15), 'inlet ' + f1(u('swPi' + k), 2) + ' kg/cm²')
        }),
        valveCard({
          id: 'C3-' + k,
          sec: 'C',
          v: P.inl,
          title: 'Condenser ' + k + ' inlet valve ' + P.inl + ' closed',
          src: 'CW_LOOP_CHECK C3',
          act: 'FIELD faceplate of ' + P.inl + ': CLOSE (open it again after the card)',
          exp: 'Path ' + k + ' flow 0, path ' + (k === 'A' ? 'B' : 'A') + ' takes more flow.',
          pre: () => (swRunN() ? '' : 'No seawater pump is running.'),
          hint: () => (vpos(P.inl) === 0 ? P.inl + ' is closed now: open it first.' : ''),
          seen: (b, p) => b.v > 0 && p === 0,
          base: () => ({ v: vpos(P.inl), o: u('swQc' + (k === 'A' ? 'B' : 'A')) }),
          min: 15,
          plant: M => {
            const ok = k === 'A' ? 'B' : 'A',
              q = u('swQc' + k),
              q2 = u('swQc' + ok);
            return CK(q != null && q < 1 && q2 > ((M.b && M.b.o) || 0), 'path ' + k + ' ' + fi(q) + ' m³/h, path ' + ok + ' ' + fi(M.b && M.b.o) + ' → ' + fi(q2) + ' m³/h');
          }
        })
      );
    }
    /* D. debris filters (DITL-39) */
    for (const F of [
      { k: 1, n: 'S-1502', o: 3, st: 'M.0790', sp: 'M.0791', io: 'DIR-DF1001', any: 1 },
      { k: 2, n: 'S-1504', o: 14, st: 'M.0792', sp: 'M.0793', io: 'DIR-DF1002', any: 0 }
    ])
      for (const on of [true, false]) {
        const stR = () => rowBy('DITL-39', new RegExp('SYS\\.-' + F.k + ' REMOTE AUTO ' + (on ? 'START' : 'STOP'))),
          ad = 'DITL-39@' + F.o;
        L.push({
          id: 'D-' + F.n + (on ? '-on' : '-off'),
          sec: 'D',
          tag: F.n,
          title: 'Debris filter ' + F.n + (on ? ' IN OPERATION (AUTO START)' : ' NOT IN OPERATION (AUTO STOP)'),
          logic: 'DITL-39',
          src: on ? 'CW_LOOP_CHECK D1 · debris filter O&M' : 'CW_LOOP_CHECK D2',
          act: 'Faceplate of the debris filter: ' + (on ? 'AUTO START' : 'AUTO STOP'),
          exp: on ? 'IN OPERATION; the backwash runs for 3 min when DP reaches 800 mmH2O (the dirt takes about 4 h of plant time to get there).' : 'NOT IN OPERATION: no backwash, the DP keeps rising while water passes.',
          fp: { df: 'DF' + F.k },
          tr: 1,
          pre: () => (outV('DITL-39', F.o) === (on ? 1 : 0) ? F.n + ' is ' + (on ? 'IN OPERATION' : 'not in operation') + ' now: press AUTO ' + (on ? 'STOP' : 'START') + ' first.' : F.k === 1 && on && !swRunN() ? 'No seawater pump is running (permissive of DITL-39 rows 1 ~ 3).' : ''),
          seen: (b, M) => b.st !== (on ? 1 : 0) && outV('DITL-39', F.o) === (on ? 1 : 0),
          base: () => ({ st: outV('DITL-39', F.o) }),
          watch: M => {
            if (rowV('DITL-39', stR()) === 1) M.pb = 1;
          },
          min: 3,
          max: 20,
          checks: M => {
            const dp = u('swDp' + F.k),
              bw = u('swBw' + F.k) || 0,
              o = outV('DITL-39', F.o);
            return [
              on ? CK(dp != null && (dp < 800 || bw > 0), 'DP ' + fi(dp) + ' mmH2O' + (bw > 0 ? ', backwash ' + fi(bw) + ' s' : ', below the backwash point 800')) : CK(bw === 0, 'DP ' + fi(dp) + ' mmH2O, no backwash'),
              CK(M.pb === 1, (addrOf('DITL-39', stR()) || (on ? F.st : F.sp)) + ' AUTO ' + (on ? 'START' : 'STOP') + ' P.B. = ' + (M.pb ? 1 : 0) + ' (pressed) · ' + F.io + ' ' + io(F.io)),
              CK(o === (on ? 1 : 0), 'DITL-39 output row ' + (F.o + 1) + ' IN OPERATION = ' + (o == null ? '—' : o))
            ];
          }
        });
      }
    /* E. booster pumps (DITL-30) */
    L.push({
      id: 'E1-noswp',
      sec: 'E',
      tag: 'P-1503A',
      title: 'SWBP-A START with no seawater pump running',
      logic: 'DITL-30 permissive',
      src: 'CW_LOOP_CHECK E1',
      act: 'All seawater pumps and SWBP-A stopped: open the SWBP-A faceplate; START stays closed',
      exp: 'It does not run: the permissive "any SWP running" is N (DITL-30 rows 17 ~ 19).',
      fp: { ad: 'DITL-30' },
      pre: () => (swRunN() ? 'A seawater pump is running: stop all of them first (card B2).' : mst('DITL-30') === 'RUN' ? 'SWBP-A is running: stop it first.' : ''),
      seen: () => true,
      min: 5,
      max: 15,
      checks: () => {
        const I = u('swIb0'),
          r = outBy('DITL-30', /RUNNING/, /NOT RUNNING|STOP|ANY/),
          o = outV('DITL-30', r),
          il = call(() => LS_DOCK.interlock('DITL-30'), null),
          miss = il ? il.miss.filter(x => /SEAWATER PUMP [ABC] RUNNING/.test(x.svc)) : [];
        return [
          CK(I != null && I < 1, 'current ' + fi(I) + ' A (not running)'),
          CK(SWP.every(m => rowV('DITL-30', m.lr) === 0), SWP.map(m => (addrOf('DITL-30', m.lr) || m.k) + ' = ' + rowV('DITL-30', m.lr)).join(' · ') + ' (DITL-30 rows 17 ~ 19)'),
          CK(o === 0 && miss.length > 0, 'START permissive "any SWP running" = ' + (miss.length ? 'N' : 'Y') + ' · output row ' + (r + 1) + ' RUNNING = ' + (o == null ? '—' : o))
        ];
      }
    });
    for (const m of SWBP) {
      L.push(motorCard(m, 'SWBP', true), motorCard(m, 'SWBP', false));
      L.push(
        valveCard({
          id: m.n + '-v5',
          sec: 'E',
          v: m.dv,
          title: m.n + ' · discharge valve ' + m.dv + ' 5 % (auto-vent)',
          src: 'CW_LOOP_CHECK E3 · PACO curve (shut-off 19.9 m)',
          act: 'Pump running: FIELD faceplate of ' + m.dv + ' → 5 % (open it again after the card)',
          exp: 'Discharge about 3.0 ~ 3.1 kg/cm² (check band 2.9 ~ 3.2; near shut-off), current down.',
          pre: () => (mst(m.ad) !== 'RUN' ? m.n + ' is not running: start it first.' : ''),
          seen: (b, p) => b.v > 6 && p != null && p <= 6,
          base: () => ({ v: vpos(m.dv), I: u('swIb' + m.i) }),
          min: 15,
          plant: M => CK(inR(u('swBd' + m.i), 2.9, 3.2) && u('swIb' + m.i) < ((M.b && M.b.I) || 0), 'discharge ' + f1(u('swBd' + m.i), 2) + ' kg/cm², current ' + fi(M.b && M.b.I) + ' → ' + fi(u('swIb' + m.i)) + ' A')
        })
      );
    }
    L.push(
      readCard({
        id: 'E4-dp',
        sec: 'E',
        tag: 'DPT-SW1504',
        title: 'Debris filter S-1504 DP at 2 SWBP',
        src: 'CW_LOOP_CHECK E4',
        exp: 'about 500 ~ 750 mmH2O with 2 SWBP running',
        sig: 'package gauge of the debris filter (no DCS address)',
        pre: () => (SWBP.filter(m => mst(m.ad) === 'RUN').length !== 2 ? 'Two SWBP must run for this reading.' : ''),
        plant: () => CK(inR(u('swDp2'), 500, 750), fi(u('swDp2')) + ' mmH2O')
      })
    );
    return L;
  }
  const SEC = { A: 'A · At 150 MW', B: 'B · Seawater pumps (DITL-29A / 29B)', C: 'C · Condenser path A / B (field valves)', D: 'D · Debris filters (DITL-39)', E: 'E · Booster pumps (DITL-30)' };
  /* the systems with a loop check list (docs/versions/v3.2.1/*_LOOP_CHECK.md); CW first (user / coordinator 2026-11-04) */
  const SYS = [
    { id: 'CW', n: 'Circulating Water', cards: cwCards, page: 'CWN' },
    { id: 'MU', n: 'Make-Up / Closed Cooling Water', doc: 'MU_CCW_LOOP_CHECK.md', page: 'MK02' },
    { id: 'AIR', n: 'Instrument / Plant Air', doc: 'AIR_LOOP_CHECK.md', page: 'MK03' },
    { id: 'COND', n: 'Condensate', doc: 'CONDENSATE_LOOP_CHECK.md', page: 'MK05' }
  ];
  /* ---------- state ---------- */
  const KEY = 'ls-lc-v1-';
  let sys = SYS[0],
    cards = null,
    res = {},
    act = null /* the card under test */,
    st = null /* its run: { b: base, M: memory, seen, t, ok } */,
    dock = null,
    els = {},
    open0 = false;
  const load = () => {
    ioLoad();
    res = ls.get(KEY + sys.id, {}) || {};
    cards = sys.cards ? sys.cards() : [];
  };
  const save = () => ls.set(KEY + sys.id, res);
  const counts = () => {
    const c = { pass: 0, fail: 0, skip: 0, todo: 0 };
    for (const k of cards) c[res[k.id] ? res[k.id].r : 'todo']++;
    return c;
  };
  const nextTodo = () => cards.find(c => !res[c.id]) || null;
  /* the state before the press (taken again every tick until the press is seen: the base is always the tick before it) */
  const baseOf = c => call(() => (c.base ? c.base() : { st: c.fp && c.fp.ad ? mst(c.fp.ad) : null }), {}) || {};
  function arm(c) {
    act = c;
    st = c ? { b: baseOf(c), M: {}, seen: false, t: 0, ok: 0 } : null;
    paint(true);
  }
  /* ---------- the judge: every 250 ms, plant time counts only while RUN ---------- */
  let last = 0;
  function tick() {
    if (!open0 || !act || !st) return;
    hook();
    ioLoad();
    const now = performance.now(),
      dt = last ? Math.min(1, (now - last) / 1000) : 0;
    last = now;
    const run = isRun(),
      sp = run ? Math.max(1, +(window.AN && AN.spd) || 1) : 0;
    st.why = ready();
    if (!st.seen) {
      call(() => act.watch && act.watch(st.M));
      /* a card that waits for a change of state (START: STOP -> RUN) sees it even when its "before" text now says the new state */
      const pre = call(() => act.pre(), '');
      if (!st.why && (!pre || act.tr) && call(() => act.seen(st.b, st.M), false)) {
        st.seen = true;
        st.t = 0;
        st.ok = 0;
        st.pre = '';
        st.M.b = st.b;
        st.M.pk = 0;
      } else {
        st.pre = pre;
        st.b = baseOf(act);
      }
    } else if (run) {
      call(() => act.watch && act.watch(st.M));
      st.t += dt * sp;
      const C = call(() => act.checks(st.M), null) || [];
      st.C = C;
      const all = C.length && C.every(x => x.ok !== false) && C.some(x => x.ok === true);
      st.ok = all ? st.ok + dt * sp : 0;
      if (all && st.t >= act.min && st.ok >= 2) return done('pass', C);
      if (st.t >= act.max) return done('fail', C);
    }
    paintAct();
  }
  function done(r, C) {
    const bad = (C || []).map((x, j) => (x.ok === false ? ['Plant model', 'Signal / address', 'Logic row'][j] + ': ' + x.t : '')).filter(Boolean);
    res[act.id] = { r, at: new Date().toISOString(), c: (C || []).map(x => [x.ok, x.t]), why: r === 'fail' ? bad.join(' · ') || 'no change seen in time' : '', un: call(() => (act.unusual ? act.unusual() : ''), '') };
    save();
    call(() => window.lsEventAdd && lsEventAdd('LOOP', 'LOOP CHECK', act.title + ': ' + r.toUpperCase() + (r === 'fail' ? ' (' + res[act.id].why + ')' : '')));
    const nx = cards.slice(cards.indexOf(act) + 1).find(c => !res[c.id]) || nextTodo();
    arm(nx);
  }
  /* ---------- the HMI: the page of the system, the faceplate of the card ---------- */
  function goPage(after) {
    call(() => window.lsSetTab && lsSetTab('operate'));
    setTimeout(() => {
      const pk = document.querySelector('#plantws .plpick');
      if (pk && sys.page && pk.value !== sys.page && [...pk.options].some(o => o.value === sys.page)) {
        pk.value = sys.page;
        pk.dispatchEvent(new Event('change'));
      }
      if (after) setTimeout(after, 400);
    }, 60);
  }
  const press = el => {
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    } catch (e) {}
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };
  function openFp(c) {
    const f = c.fp || {};
    goPage(() => {
      if (f.ad) call(() => LS_FPOP.openAd(f.ad) || LS_FPOP.motor({ ad: f.ad, n: c.tag }));
      else if (f.valve) {
        /* the valve symbol on the page: the pop-out opens beside it (the press point is its anchor, fp-pop.js) */
        const ti = [...document.querySelectorAll('#plantws svg g > title')].find(t => new RegExp('^' + f.valve + '\\b').test(t.textContent)),
          el = ti && (ti.parentNode.querySelector('path') || ti.parentNode);
        if (el) press(el);
        else call(() => LS_FPOP.fieldPct(f.valve));
      } else if (f.df) {
        const h = document.querySelector('#plantws [data-hit="' + f.df + '"]');
        if (h) press(h);
      }
    });
  }
  /* ---------- the panel ---------- */
  const mode = () => (innerWidth >= 900 && innerWidth >= innerHeight * 1.05 ? 'side' : 'bottom');
  let inLay = false;
  function layout() {
    if (inLay) return;
    inLay = true;
    try {
      layout0();
    } finally {
      inLay = false;
    }
  }
  function layout0() {
    const R = document.documentElement,
      m = mode();
    R.classList.toggle('lc-side', open0 && m === 'side');
    R.classList.toggle('lc-bottom', open0 && m === 'bottom');
    const w = Math.max(340, Math.min(560, ls.get('ls-lc-w', innerWidth >= 1300 ? 440 : 380), innerWidth - 480));
    R.style.setProperty('--lcw', w + 'px');
    R.style.setProperty('--lch', Math.round(innerHeight * 0.45) + 'px');
    if (dock) dock.hidden = !open0;
    if (els.rb) els.rb.classList.toggle('on', open0);
    call(() => AN.inspAuto && AN.inspAuto(open0));
    call(() => DUI.inspAuto && DUI.inspAuto(open0));
    try {
      dispatchEvent(new Event('resize'));
    } catch (e) {}
  }
  function build() {
    if (dock) return;
    dock = E('aside');
    dock.id = 'lcdock';
    dock.setAttribute('aria-label', 'Loop check');
    const hd = E('div', 'lc-hd'),
      tt = E('div', 'lc-tt');
    els.h1 = E('b', '', 'Loop check');
    els.sub = E('span', 'lc-dim', '');
    tt.append(els.h1, els.sub);
    const x = E('button', 'lc-ic', '✕');
    x.type = 'button';
    x.title = 'Close the loop check panel (the results stay)';
    x.onclick = () => toggle(false);
    hd.append(tt, x);
    els.sys = E('div', 'lc-sys');
    els.stat = E('div', 'lc-stat');
    els.sum = E('div', 'lc-sum');
    els.body = E('div', 'lc-body');
    const ft = E('div', 'lc-ft');
    els.fl = E('div', 'lc-fl');
    const bx = E('div', 'lc-fb'),
      csv = E('button', '', 'Export CSV'),
      rs = E('button', '', 'Reset system');
    csv.type = rs.type = 'button';
    csv.onclick = exportCsv;
    rs.onclick = () => {
      if (!confirm('Clear every result of ' + sys.n + '?')) return;
      res = {};
      save();
      arm(nextTodo());
    };
    bx.append(csv, rs);
    ft.append(els.fl, bx);
    dock.append(hd, els.sys, els.stat, els.sum, els.body, ft);
    document.body.append(dock);
    dock.hidden = true;
  }
  const RES = { pass: ['PASS', 'y'], fail: ['FAIL', 'n'], skip: ['SKIPPED', 'w'], todo: ['NOT DONE', ''], next: ['NEXT', 'w'], wait: ['CHECKING', 'w'] };
  const NAMES = ['Plant model', 'Signal / address', 'Logic row'];
  function ckEl(lbl, x, wait) {
    const d = E('div', 'lc-ck');
    d.append(E('b', '', lbl));
    if (!x) {
      d.append(E('span', 'w', wait ? 'waiting' : '—'));
      return d;
    }
    d.append(E('span', x.ok == null ? 'w' : x.ok ? 'y' : 'n', x.ok == null ? '–' : x.ok ? 'Y' : 'N'), document.createTextNode(' ' + x.t));
    return d;
  }
  function cardEl(c) {
    const r = res[c.id],
      isA = act === c,
      k = isA ? (st && st.seen ? 'wait' : 'next') : r ? r.r : 'todo';
    const d = E('div', 'lc-card' + (isA ? ' next' : '') + (r && r.r === 'fail' ? ' fail' : ''));
    d.dataset.id = c.id;
    const h = E('div', 'lc-h'),
      a = E('div', 'lc-a');
    a.append(E('div', 'lc-tag', c.tag + ' · ' + c.title.replace(/^[^·]*·\s*/, '')), E('div', 'lc-dim', [c.logic && 'Logic ' + c.logic, c.src].filter(Boolean).join(' · ')));
    h.append(a, E('span', 'lc-res ' + RES[k][1], RES[k][0]));
    d.append(h);
    d.append(E('div', 'lc-act', 'Action: ' + c.act + (!r || isA ? '. Expected: ' + c.exp : '')));
    if (isA) {
      const C = (st && st.C) || null;
      const g = E('div', 'lc-cks');
      NAMES.forEach((n, j) => g.append(ckEl(n, C ? C[j] : null, true)));
      d.append(g);
      els.aCk = g;
      els.aMsg = E('div', 'lc-msg');
      d.append(els.aMsg);
      const b = E('div', 'lc-btns'),
        o = E('button', 'pri', c.fp && (c.fp.ad || c.fp.valve || c.fp.df) ? 'Open faceplate' : 'Open the HMI page'),
        s = E('button', '', 'Skip (note why)');
      o.type = s.type = 'button';
      o.onclick = () => openFp(c);
      s.onclick = () => {
        const w = prompt('Why is ' + c.tag + ' skipped?', '');
        if (w == null) return;
        res[c.id] = { r: 'skip', at: new Date().toISOString(), why: w.trim() || 'skipped', c: [] };
        save();
        arm(cards.slice(cards.indexOf(c) + 1).find(x => !res[x.id]) || nextTodo());
      };
      b.append(o, s);
      d.append(b);
    } else if (r) {
      if (r.c && r.c.length) {
        const g = E('div', 'lc-cks');
        NAMES.forEach((n, j) => g.append(ckEl(n, r.c[j] ? { ok: r.c[j][0], t: r.c[j][1] } : null)));
        d.append(g);
      }
      if (r.why) d.append(E('div', 'lc-why', (r.r === 'skip' ? 'Note: ' : 'Reason: ') + r.why));
      if (r.un) d.append(E('div', 'lc-un', r.un));
      const b = E('div', 'lc-btns'),
        ag = E('button', '', 'Check again');
      ag.type = 'button';
      ag.onclick = () => arm(c);
      b.append(ag);
      d.append(b);
    } else {
      d.classList.add('todo');
      d.title = 'Click to test this card now';
      d.onclick = () => arm(c);
    }
    return d;
  }
  function paint(scroll) {
    if (!dock) return;
    els.sub.textContent = sys.n + (sys.cards ? ' · ' + cards.length + ' cards' : '');
    /* the systems: CW is built; the others show their list file */
    els.sys.textContent = '';
    for (const S of SYS) {
      const b = E('button', 'lc-sb' + (S === sys ? ' on' : ''));
      b.type = 'button';
      let n = '–';
      if (S.cards) {
        const R = ls.get(KEY + S.id, {}) || {},
          L = S === sys ? cards : S.cards();
        n = L.filter(c => R[c.id] && R[c.id].r === 'pass').length + ' / ' + L.length;
      }
      b.append(E('span', '', S.n), E('span', 'lc-n', n));
      b.disabled = !S.cards;
      b.title = S.cards ? 'Loop check of ' + S.n : 'Cards not built yet (list: docs/versions/v3.2.1/' + S.doc + ')';
      b.onclick = () => {
        if (!S.cards || S === sys) return;
        sys = S;
        load();
        arm(nextTodo());
      };
      els.sys.append(b);
    }
    const c = counts();
    els.sum.textContent = '';
    for (const [l, v, k] of [
      ['PASS', c.pass, 'y'],
      ['FAIL', c.fail, 'n'],
      ['Skipped', c.skip, 'w'],
      ['Not done', c.todo, '']
    ]) {
      const x = E('div');
      x.append(document.createTextNode(l + ' '), E('b', k, String(v)));
      els.sum.append(x);
    }
    els.body.textContent = '';
    els.aCk = els.aMsg = null;
    let secK = null,
      aEl = null;
    for (const k of cards) {
      if (k.sec !== secK) {
        secK = k.sec;
        const L = cards.filter(x => x.sec === secK);
        els.body.append(E('div', 'lc-sec', SEC[secK] + ' · ' + L.filter(x => res[x.id] && res[x.id].r === 'pass').length + ' / ' + L.length));
      }
      const e = cardEl(k);
      if (k === act) aEl = e;
      els.body.append(e);
    }
    if (!cards.length) els.body.append(E('div', 'lc-dim', 'No cards for this system yet.'));
    /* the FAIL list */
    const F = cards.filter(x => res[x.id] && res[x.id].r === 'fail');
    els.fl.textContent = '';
    els.fl.append(E('div', 'lc-lbl', 'FAIL list (' + F.length + ')'));
    if (!F.length) els.fl.append(E('div', 'lc-dim', 'No FAIL.'));
    for (const x of F) {
      const a = E('button', 'lc-fi', x.tag + ': ' + res[x.id].why);
      a.type = 'button';
      a.onclick = () => {
        const e = els.body.querySelector('[data-id="' + x.id + '"]');
        if (e) e.scrollIntoView({ block: 'center' });
      };
      els.fl.append(a);
    }
    paintAct();
    if (scroll && aEl) setTimeout(() => aEl.scrollIntoView({ block: 'nearest' }), 0);
  }
  /* the live part of the card under test (no rebuild of the list every tick) */
  function paintAct() {
    if (!dock) return;
    const U = Un(),
      run = isRun();
    els.stat.textContent = '';
    els.stat.append(
      E('span', run ? 'y' : 'w', run ? 'RUN' : 'PAUSED / VIEW'),
      E('span', '', 'Plant model ' + (U ? 'ON' : 'OFF')),
      E('span', '', 'Speed ×' + (+(window.AN && AN.spd) || 1))
    );
    if (!U || !(window.AN && AN.startState)) {
      const b = E('button', 'lc-mini', 'Pick starting state');
      b.type = 'button';
      b.onclick = () => call(() => window.lsAskStart && lsAskStart());
      els.stat.append(b);
    }
    if (!act || !st || !els.aCk) return;
    if (st.C) {
      els.aCk.textContent = '';
      NAMES.forEach((n, j) => els.aCk.append(ckEl(n, st.C[j], true)));
    }
    const m = st.why || st.pre || (!st.seen ? call(() => (act.hint ? act.hint(st.M) : ''), '') || 'Waiting for the press on the HMI…' : 'Press seen: checking (' + Math.round(st.t) + ' / ' + act.max + ' s plant time)…');
    if (els.aMsg.textContent !== m) els.aMsg.textContent = m;
    els.aMsg.className = 'lc-msg' + (st.why || st.pre ? ' warn' : '');
    const r = els.body.querySelector('.lc-card.next .lc-res');
    if (r) {
      const k = st.seen ? 'wait' : 'next';
      r.textContent = RES[k][0];
    }
  }
  function exportCsv() {
    const q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const L = [['System', 'Section', 'Tag', 'Card', 'Result', 'Plant model', 'Signal / address', 'Logic row', 'Reason / note', 'Time'].map(q).join(',')];
    for (const c of cards) {
      const r = res[c.id] || {},
        C = r.c || [];
      L.push([sys.n, c.sec, c.tag, c.title, (r.r || 'not done').toUpperCase(), ...[0, 1, 2].map(j => (C[j] ? (C[j][0] == null ? '– ' : C[j][0] ? 'Y ' : 'N ') + C[j][1] : '')), r.why || r.un || '', r.at || ''].map(q).join(','));
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/csv' }));
    a.download = 'loop-check-' + sys.id + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.append(a);
    a.click();
    setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
  }
  function toggle(on) {
    build();
    open0 = on == null ? !open0 : !!on;
    if (open0) {
      /* one panel at a time: the Training dock goes to its tab at the edge (its step stays) */
      const R = document.documentElement;
      if (R.classList.contains('gd-side') || R.classList.contains('gd-bottom')) {
        if (R.classList.contains('gd-menu')) call(() => document.querySelector('#gdock .gd-ic:last-of-type').click());
        else {
          ls.set('ls-gdock-min', true);
          call(() => LS_DOCK.layout());
        }
      }
      if (!cards) load();
      if (!act) arm(nextTodo());
      goPage();
    }
    ls.set('ls-lc-open', open0);
    layout();
    paint(true);
  }
  /* the button of the left rail, under Training */
  function railBtn() {
    if (els.rb) return;
    const tr = [...document.querySelectorAll('.tabs button')].find(b => b.textContent.trim() === 'Training');
    if (!tr) return;
    const b = E('button', '', 'Loop check');
    b.type = 'button';
    b.title = 'Loop check: one card per tag; a real press on the HMI is checked against the plant model, the address and the logic';
    b.dataset.ic = 'target';
    b.setAttribute('aria-label', 'Loop check');
    b.onclick = () => toggle();
    tr.after(b);
    els.rb = b;
  }
  addEventListener('resize', () => open0 && layout());
  setInterval(tick, 250);
  setInterval(() => {
    if (!open0) return;
    /* the Training dock was opened: one panel at a time, the loop check closes (its results stay) */
    const R = document.documentElement;
    if (R.classList.contains('gd-side') || R.classList.contains('gd-bottom')) return toggle(false);
    if (!st) paintAct();
  }, 1000);
  const boot = () => {
    railBtn();
    if (!els.rb) return setTimeout(boot, 500);
  };
  setTimeout(boot, 300);
  window.LS_LOOP = { toggle, arm: id => cards && arm(cards.find(c => c.id === id) || null), get cards() {
      return cards;
    }, get res() {
      return res;
    }, get act() {
      return act;
    }, get st() {
      return st;
    } };
})();
