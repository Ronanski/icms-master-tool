/* 2.2.0-beta.13: CHECK panel (user, 2026-10-17: "paano i-check ang M2 at M3? walang guide, expected result, procedure").
   One button per plant scenario of the roadmap (M2 load down / up, M3 trips). Each scenario does what the operator (and the DITL,
   forced) does from "Start at 150 MW", runs the plant fast, and shows the expected result of the drawing + physics with a live
   check mark. Same checks as tests/regress/unit_load.js and tests/regress/unit_trip.js. Taglish, short (user: "ayaw ko ng
   kumplikado"). */
(function () {
  const E = (t, a, c) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (c || []).forEach(x => e.append(x));
    return e;
  };
  document.head.append(
    E('style', {
      txt: `#chkb{position:fixed;left:72px;bottom:36px;z-index:50;background:var(--c-accbg);color:var(--c-tx);border:1px solid var(--c-acc);padding:8px 14px;border-radius:8px;font:600 13px system-ui;cursor:pointer}
#chkp{display:none;position:fixed;left:0;top:0;bottom:0;width:min(460px,100vw);z-index:60;background:var(--c-pane);color:var(--c-tx);border-right:1px solid var(--c-line);overflow:auto;font:13px/1.4 system-ui;padding:10px 12px;box-sizing:border-box}
#chkp h3{margin:0;font-size:16px;color:var(--c-acctx);flex:1}#chkp .sub{color:var(--c-dim);font-size:12px;margin:4px 0}
#chkp button{background:var(--c-pane);color:var(--c-tx);border:1px solid var(--c-line);padding:7px 11px;border-radius:6px;font:inherit;cursor:pointer}
#chkp button.go{background:var(--c-accbg);border-color:var(--c-acc)}#chkp button:disabled{opacity:.5;cursor:default}
#chkp .sc{background:var(--c-pane);border:1px solid var(--c-line);border-radius:8px;margin:8px 0;padding:8px 10px}
#chkp .sc .h{display:flex;gap:8px;align-items:center}#chkp .sc .h b{flex:1;font-size:14px}
#chkp .bar{height:8px;background:var(--c-ctlh);border-radius:4px;overflow:hidden;margin:6px 0}#chkp .bar i{display:block;height:100%;background:#6aaee0;width:0}
#chkp table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px}#chkp td{padding:3px 4px;border-top:1px solid var(--c-line);vertical-align:top}
#chkp td.m{width:22px;font-weight:700}#chkp .y{color:var(--c-runtx2)}#chkp .n{color:var(--c-almtx)}#chkp .w{color:var(--c-mantx2)}
#chkp .live{font:12px ui-monospace,monospace;color:var(--c-tx2);white-space:pre-wrap;margin:4px 0}`
    })
  );
  const P = E('div', { id: 'chkp' }),
    btn = E('button', {
      id: 'chkb',
      txt: 'CHECK',
      title: 'Check M2 / M3 / M4: isang pindot bawat scenario, inaasahang resulta na may ✓ / ✗',
      on: () => {
        P.style.display = P.style.display === 'block' ? 'none' : 'block';
        if (!P.childNodes.length) build();
      }
    });
  /* 3.2.0-beta.20 (user 2026-10-24: "yung check sa tools" remove, "di ba meron naman training"): no CHECK button or panel in the
     app; the scenarios stay as the automated proof of the plant model (tests/regress/check_panel.js, an automated browser) */
  if (navigator.webdriver) document.body.append(btn, P);
  let busy = false;
  /* ---- helpers on the running plant (same as the tests) ---- */
  const H = () => {
    const sh = k => AN.sheets.find(s => s.name === k).S,
      C1 = AN.sheets.find(s => s.name === 'ABC-001C'),
      S = C1.S,
      v = S.rt.v,
      ALL = AN.sheets.filter(s => s.S && !/ABC-000/.test(s.name));
    const lab = (T, l) => T.lab.findIndex(x => x && String(x.t).trim() === l),
      nm = (T, l) => {
        for (let n = 0; n < T.lab.length; n++) if ((AN.nm(T, n) || '').trim() === l) return n;
        return -1;
      };
    /* a digital input of the drawing by its address: with the shared addresses (beta.13) one sheet is enough, but every sheet is set
       so that the first scan is already consistent */
    const setx = (k, l, x) => {
      let n = 0;
      for (const s of k ? [AN.sheets.find(s => s.name === k)] : ALL) {
        const T = s.S;
        for (const e of T.ext) {
          const t = T.lab[e] && String(T.lab[e].t).trim();
          if (t === l || (t && t.replace(/^S\d\s+/, '') === l)) {
            if (T.rt.force[e] === undefined) T.rt.ext[e] = x;
            n++;
          }
        }
      }
      return n;
    };
    const ctl = (k, t) => AN.hmiCtrls(sh(k)).find(c => c.tag === t),
      pk = (k, t) => {
        const c = ctl(k, t);
        return c && c.amt ? sh(k).rt.st[c.amt.id].pk : '?';
      },
      bit = (k, l) => {
        const T = sh(k);
        let n = lab(T, l);
        if (n < 0) n = nm(T, l);
        return n < 0 ? NaN : +T.rt.v[n];
      },
      val = (k, l) => {
        const T = sh(k),
          n = nm(T, l);
        return n < 0 ? NaN : +T.rt.v[n];
      },
      pv = (k, t) => +sh(k).rt.v[ctl(k, t).q.pv],
      mv = (k, t) => +sh(k).rt.v[ctl(k, t).out];
    const U = AN.unit,
      coal = () =>
        U.fuel.reduce(
          (a, l) => a + (l.length && isFinite(l[0][0].rt.st[l[0][1].id].val) ? +l[0][0].rt.st[l[0][1].id].val : 0),
          0
        );
    const MSP = () => +v[lab(S, 'AI0131')],
      MSF = () => +v[U.cn],
      MW = () => +v[lab(S, 'AI0419')],
      SV = () => +v[ctl('ABC-001C', 'PIC-COBM').q.sv];
    const hbm = S.blk.find(b => b.k === 'MAN' && b.tag === 'HIC-BM'),
      bmA = S.blk.find(b => b.k === 'AMT' && b.sel === lab(S, 'M.2013')),
      htm = S.blk.find(b => b.k === 'MAN' && b.tag === 'EIC-TM'),
      tmA = S.blk.find(b => b.k === 'AMT' && b.sel === lab(S, 'M.2016'));
    const S10 = sh('ABC-010'),
      lic = ctl('ABC-010', 'LICBR1001'),
      fwc = ctl('ABC-010', 'FICFW1007');
    const lvl = () => +S10.rt.v[lic.q.pv],
      FW = () => +S10.rt.v[fwc.q.pv],
      FP = () => pv('ABC-008', 'PICFG108'),
      PA = () => val('ABC-006', 'FIFA1071.PV'),
      O2 = () => pv('ABC-002', 'AICFG112'),
      MST = () => pv('ABC-012', 'TICMS1004'),
      RHT = () => pv('ABC-019', 'TICHR1002'),
      RHP = () => pv('ABC-052', 'PICHR1003');
    /* the operator on a faceplate: L (LOCAL), M (MANUAL), MV x % (2.2.0-beta.14) */
    const man = (k, t, x) => {
      const T = sh(k),
        c = ctl(k, t);
      if (!c) return false;
      if (c.svSw && T.rt.st[c.svSw.id]) {
        T.rt.st[c.svSw.id].al = 'A';
        T.rt.st[c.svSw.id].fm = 'B';
      }
      if (c.amt && T.rt.st[c.amt.id]) {
        T.rt.st[c.amt.id].al = c.autoLeg;
        T.rt.st[c.amt.id].fm = c.autoLeg === 'A' ? 'B' : 'A';
      }
      if (c.manBlk && T.rt.st[c.manBlk.id]) T.rt.st[c.manBlk.id].val = x;
      else if (c.manNet != null) T.rt.ext[c.manNet] = x;
      if (AN.latchMode) AN.latchMode(t, 'MAN');
      return true;
    };
    /* AUTO = the A / M switch on its auto leg */
    const isAuto = (k, t) => {
      const c = ctl(k, t);
      return !!(c && c.amt && sh(k).rt.st[c.amt.id].pk === c.autoLeg);
    };
    /* the mode status of a tag on every sheet (faceplate M / A / R): 'MAN' | 'LOC' (AUTO) | 'REM' */
    const mode = (t, k) => AN.latchMode && AN.latchMode(t, k);
    /* the SUPPLY OIL VALVE (1)(2) CLOSE of a start-up burner (M.3410 / 3411 / 3416 / 3417, memory list BC FROM S4) is the AND of the
       two limit switches on the coal feeder sheets (ABC-004A ~ C), linked to ABC-003x and ABC-029: the operator opens the two valves
       = the two inputs of that AND are 0 (one address = one signal, CLAUDE.md 1) */
    const oilValve = (addr, open) => AN.oilValve(addr, open);
    /* A (AUTO) with the operator SV (LOCAL): the SV net when it is an input, else the operator leg of the SV switch (hmi.js svSet) */
    const autoSv = (k, t, sv) => {
      const T = sh(k),
        c = ctl(k, t);
      if (!c) return false;
      if (sv != null && c.q && c.q.sv != null) {
        if (T.ext.includes(c.q.sv) && !(T.xlk && T.xlk[c.q.sv])) T.rt.ext[c.q.sv] = sv;
        else if (c.svSw && c.svSw.b != null && T.ext.includes(c.svSw.b)) T.rt.ext[c.svSw.b] = sv;
      }
      if (c.svSw && T.rt.st[c.svSw.id]) {
        T.rt.st[c.svSw.id].al = 'A';
        T.rt.st[c.svSw.id].fm = 'B';
      }
      if (c.amt && T.rt.st[c.amt.id]) T.rt.st[c.amt.id].fm = c.autoLeg;
      if (AN.latchMode) AN.latchMode(t, 'LOC');
      return true;
    };
    /* R (REMOTE, cascade SV from the drawing) + A: the SV switch on its A leg, the station on its auto leg (2.2.0-beta.16) */
    const rem = (k, t) => {
      const T = sh(k),
        c = ctl(k, t);
      if (!c) return false;
      if (c.svSw && T.rt.st[c.svSw.id]) {
        T.rt.st[c.svSw.id].al = 'A';
        T.rt.st[c.svSw.id].fm = 'A';
      }
      if (c.amt && T.rt.st[c.amt.id]) T.rt.st[c.amt.id].fm = c.autoLeg;
      if (AN.latchMode) AN.latchMode(t, 'REM');
      return true;
    };
    const SA = () => val('ABC-006', 'FIFA1081.PV'),
      FA = () => val('ABC-006', 'FIFA1055.PV'),
      tsat = P => AN.tsat(P); /* 3.2.0-beta.15: the steam table of the unit model (steam.js) */
    /* the DITL MFT, forced (CLAUDE.md 7): I.000F MFT FROM IRP on every station, M.0341 MFT TPs (2 s), coal feeders stopped */
    const mft = o => {
      setx(null, 'I.000F', 1);
      for (const k of ['ABC-003B', 'ABC-003C', 'ABC-003D']) setx(k, 'M.0341', 1);
      for (const l of ['M.3400', 'M.3401', 'M.3402', 'M.3405']) setx(null, l, 0);
      o.mftAt = o.t;
    };
    const live = () =>
      'MW ' +
      MW().toFixed(1) +
      '  MSP ' +
      MSP().toFixed(1) +
      ' kg/cm2  MSF ' +
      MSF().toFixed(0) +
      ' T/H  coal ' +
      coal().toFixed(1) +
      '  FW ' +
      FW().toFixed(0) +
      '  drum ' +
      lvl().toFixed(0) +
      ' mm\nfurnace ' +
      FP().toFixed(0) +
      ' mmH2O  PA ' +
      PA().toFixed(0) +
      '  O2 ' +
      O2().toFixed(1) +
      ' %  MST ' +
      MST().toFixed(0) +
      ' C  RHT ' +
      RHT().toFixed(0) +
      ' C  RHP ' +
      RHP().toFixed(1) +
      '\nHP bypass ' +
      mv('ABC-050', 'PICMS1006').toFixed(0) +
      ' %  blow-off ' +
      mv('ABC-013', 'PICMS1002').toFixed(0) +
      ' %  HIC-BM ' +
      (S.rt.st[bmA.id].pk === 'B' ? 'M' : 'A') +
      '  EIC-TM ' +
      (S.rt.st[tmA.id].pk === 'B' ? 'M' : 'A') +
      '  FICFW1007 ' +
      (pk('ABC-010', 'FICFW1007') === 'B' ? 'M' : 'A') +
      '  PICFG108 ' +
      (pk('ABC-008', 'PICFG108') === 'B' ? 'M' : 'A');
    return {
      sh,
      C1,
      S,
      v,
      lab,
      nm,
      setx,
      ctl,
      pk,
      bit,
      val,
      pv,
      mv,
      U,
      coal,
      MSP,
      MSF,
      MW,
      SV,
      hbm,
      bmA,
      htm,
      tmA,
      S10,
      lic,
      fwc,
      lvl,
      FW,
      FP,
      PA,
      O2,
      MST,
      RHT,
      RHP,
      mft,
      man,
      mode,
      isAuto,
      oilValve,
      autoSv,
      rem,
      SA,
      FA,
      tsat,
      live
    };
  };
  const near = (x, ref, p) => Math.abs(x - ref) <= (Math.abs(ref) * p) / 100;
  const f0 = x => (isFinite(x) ? (+x).toFixed(0) : '-'),
    f1 = x => (isFinite(x) ? (+x).toFixed(1) : '-');
  /* ---- the scenarios: steps (what the operator / the DITL does), each(t) every 0.5 s, checks at the end ---- */
  const SC = [
    {
      id: 'cold',
      cold: true,
      title: 'M4 · Cold start: purge, light-off, pressure raise',
      how: 'Start cold (drum 0 kg/cm2, tubig at bed 30 °C, walang coal, turbine sarado, lahat ng controller L + M 0 %). Operator: PAF / SAF / IDF start (M.3302 / 3303 / 3304), PA at SA flow M para sa purge > 25 % MCR, 5 min (PR-OPE-5002); tapos burner A at B: supply oil valve (1)(2) bukas (ang dalawang limit switch input ng AND M.3410 / M.3411 sa ABC-004A = 0) at BURNER IN SERVICE (M.3412 / M.3413, DITL forced), FICDO1043A / B M 60 %, air pababa sa minimum; tapos binabantayan ang pagtaas ng saturation temperature (Fig 1 ≤ 110 °C/h): +5 % oil kapag < 85 °C/h at > 5 kg/cm2, −5 % kapag > 100; burner C at D sa 15 kg/cm2. Tumitigil kapag 30 kg/cm2.',
      want: 'Purge: air > 150 T/H; oil A at B > 0.5 T/H; tubig 30 → 100 °C bago tumaas ang pressure; drum 0 → 30 kg/cm2 sa loob ng 4 oras (Fig 2 ~5 h); saturation ≤ 110 °C/h; bed ≥ 400 °C (coal batch permissive); furnace pressure −50 ~ +30 mmH2O (walang HIGH); MST ≥ saturation at ≤ 535 °C (TAB_9); MW 0, coal 0; drum level hawak (± 150 mm).',
      secs: 15000,
      run(h, o) {
        o.lvl0 = h.lvl();
        o.lvMin = o.lvMax = o.lvl0;
        o.rate = 0;
        o.pBoil = 0;
        o.tsP = null;
        o.P30 = null;
        o.ab = 60;
        o.cd = 0;
      },
      each(h, o) {
        const t = o.t,
          U = h.U;
        if (t === 10) {
          /* 3.2.0-beta.14: Cold now has the utilities stopped (no medium, no PV). PR-OPE-5002 starts them before the fans:
             SWP (M.3354 / M.3355), CEP (M.3350), FA blower (M.3308), diesel oil pump (field equipment, no DCS signal) */
          for (const l of ['M.3354', 'M.3355', 'M.3350', 'M.3308']) h.setx(null, l, 1);
          /* 3.2.0-beta.22: and the boiler feedwater pump A (ABC-010 M.3343; B standby), started before the drum is filled. Before, Cold
             left the BFWP running from the 150 MW snapshot and this chain never started it */
          h.setx(null, 'M.3343', 1);
          AN.field('dop', true);
          for (const l of ['M.3302', 'M.3303', 'M.3304']) h.setx(null, l, 1);
          h.man('ABC-007', 'FICFA1071', 35);
          h.man('ABC-007', 'FICFA1081', 35);
        }
        if (t === 310) o.air = h.PA() + h.SA() + h.FA();
        if (t === 320) {
          h.oilValve('M.3410', true);
          h.oilValve('M.3411', true);
          h.setx(null, 'M.3412', 1);
          h.setx(null, 'M.3413', 1);
          h.man('ABC-003A', 'FICDO1043A', 60);
          h.man('ABC-003B', 'FICDO1043B', 60);
          h.man('ABC-007', 'FICFA1071', 10);
          h.man('ABC-007', 'FICFA1081', 10);
        }
        if (t === 400) {
          o.oilA = h.pv('ABC-003A', 'FICDO1043A');
          o.oilB = h.pv('ABC-003B', 'FICDO1043B');
        }
        if (o.tBoil == null && U.Tw >= 99.9) {
          o.tBoil = t;
          o.pBoil = U.Pd;
        }
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        if (t % 60 === 0) {
          /* the rate of the saturation temperature as Fig 1 reads it: over 5 minutes, in C/h. The operator watches the water
             temperature too while it heats up (the same rise reaches the drum metal): U.Tw = saturation once boiling */
          const ts = h.tsat(U.Pd),
            r = o.tsP != null ? (U.Tw - o.tsP) * 60 : 0;
          o.tsH = o.tsH || [];
          o.tsH.push(ts);
          if (o.tsH.length > 6) o.tsH.shift();
          if (o.tBoil != null && o.tsH.length === 6) o.rate = Math.max(o.rate, (ts - o.tsH[0]) * 12);
          o.tsP = U.Tw;
          /* the operator watches the saturation temperature (Fig 1, <= 110 C/h) and moves the firing step by step (PR-OPE-5002):
             more oil when the rise is below 80 C/h and the drum is above 5 kg/cm2, less when above 100; burners C and D at 15 kg/cm2 */
          if (t > 320) {
            if (r > 100) {
              o.ab = Math.max(30, o.ab - 5);
              if (o.cd) o.cd = Math.max(30, o.cd - 5);
            } else if (r < 85 && U.Pd >= 5) {
              if (o.ab < 100) o.ab = Math.min(100, o.ab + 5);
              else if (!o.cd && U.Pd >= 15) {
                o.cd = 20;
                h.oilValve('M.3416', true);
                h.oilValve('M.3417', true);
                h.setx(null, 'M.3418', 1);
                h.setx(null, 'M.3419', 1);
              } else if (o.cd) o.cd = Math.min(100, o.cd + 5);
            }
            h.man('ABC-003A', 'FICDO1043A', o.ab);
            h.man('ABC-003B', 'FICDO1043B', o.ab);
            if (o.cd) {
              h.man('ABC-003C', 'FICDO1043C', o.cd);
              h.man('ABC-003D', 'FICDO1043D', o.cd);
            }
          }
        }
        if (o.P30 == null && U.Pd >= 30) o.P30 = t;
      },
      done(h, o) {
        return o.P30 != null && o.t >= o.P30 + 60;
      },
      checks(h, o) {
        const U = h.U,
          ts = h.tsat(U.Pd);
        return [
          [o.air > 150, 'purge: total air ' + f0(o.air) + ' T/H (> 25 % MCR) na may PAF / SAF / IDF'],
          [
            o.oilA > 0.5 && o.oilB > 0.5,
            'oil burner A ' + f1(o.oilA) + ' / B ' + f1(o.oilB) + ' T/H (FICDO1043A / B, gate M.3410 / 3411 bukas)'
          ],
          [
            o.tBoil != null && o.pBoil < 0.5,
            'tubig 30 → 100 °C sa ' +
              f0(o.tBoil / 60) +
              ' min, drum ' +
              f1(o.pBoil) +
              ' kg/cm2 pa (walang steam bago kumulo)'
          ],
          [
            o.P30 != null && o.P30 <= 14400,
            'drum 0 → 30 kg/cm2 sa ' +
              (o.P30 != null ? f0(o.P30 / 60) + ' min' : 'hindi naabot') +
              ' (Fig 2: fire → roll ~5 h)'
          ],
          [o.rate > 0 && o.rate <= 110, 'saturation temperature ' + f0(o.rate) + ' °C/h max sa 5 min (Fig 1: ≤ 110)'],
          [
            U.Tb >= 400,
            'bed ' + f0(U.Tb) + ' °C (coal batch permissive 400 ~ 450); oil ' + f1(U.oilF) + ' T/H sa 4 burner'
          ],
          [
            h.FP() > -50 && h.FP() < 30 && h.bit('ABC-008', 'M.3107') < 0.5,
            'furnace pressure ' +
              f0(h.FP()) +
              ' mmH2O, walang HIGH (M.3107); PICFG108 ' +
              (h.pk('ABC-008', 'PICFG108') === 'B' ? 'M (force manual ng drawing: MV < 14 %)' : 'A')
          ],
          [
            h.MST() >= ts - 5 && h.MST() <= 535,
            'MST ' + f0(h.MST()) + ' °C: ≥ saturation ' + f0(ts) + ', ≤ 535 (TAB_9)'
          ],
          [h.MW() < 0.5 && h.coal() < 1, 'MW ' + f1(h.MW()) + ', coal ' + f1(h.coal()) + ' T/H'],
          [
            Math.abs(o.lvMax) < 150 && Math.abs(o.lvMin) < 150,
            'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm (walang trip)'
          ]
        ];
      }
    },
    {
      id: 'coal',
      warm: { P: 30, Tb: 480, burners: 4, mv: 30, air: 10 },
      title: 'M4 · Coal transfer: batch → feeders → retract ng burners',
      how: 'Start warm (dulo ng cold start: 30 kg/cm2, bed 480 °C, 4 burner 30 %). LICBR1001B (start-up drum level) A sa SV 0 (pinapayagan ng drawing dahil FICFW1007 at LICBR1001A ay M); blow-off PICMS1002 A sa SV 35. FIC-CF M 10 % (= 4 T/H, minimum ng feeder). Bed 400 ~ 450+: batch ng feeder A (M.3400 10 s ON, 60 s OFF, PR-OPE-5002); bed > 600: feeder A tuluy-tuloy at A (AUTO) pagkatapos tumakbo (ang drawing ay nagpo-force manual habang nakatigil), bawas ng oil 5 % kada minuto; feeder B; bed > 650: feeder C; FIC-CF paakyat sa 15 % (6 T/H kada feeder; hawak ang saturation ≤ 110 °C/h, Fig 1: wala pang turbine na kumukuha ng steam, Fig 2 ay coal pagkatapos ng roll); bed > 700: retract ng burner A, D, B, C isa-isa hanggang > 750. O2 hawak sa 3.5 ~ 5.5 % (PA / SA). Dulo: FIC-CM L + A sa kasalukuyang coal (ang drawing ang sasagot).',
      want: 'Coal nasusunog lang sa mainit na bed (burnt share); bed ≥ 750 °C; 3 feeder tumatakbo sa AUTO (~18 T/H); oil 0 (lahat ng valve sarado, burners out); O2 3 ~ 10 %; MSP tumataas pero < 125 kg/cm2 at saturation ≤ 110 °C/h (Fig 1); drum level hawak ng LICBR1001B (±150 mm); coal master FIC-CM: ang A ay hindi tinatanggap ng drawing (M.0130: FIC-CF / PA / SA hindi pa REMOTE, hakbang 4), SV = coal; MW 0; walang trip.',
      secs: 9000,
      run(h, o) {
        /* 2.2.0-beta.20: inside the full start-up chain the stage starts from the plant as the stage before left it */
        o.ab = o.chain ? Math.round(['A', 'B', 'C', 'D'].reduce((a, k) => a + h.mv('ABC-003' + k, 'FICDO1043' + k), 0) / 4) : 30;
        if (o.chain) o.airMv = h.mv('ABC-007', 'FICFA1071');
        o.cf = 10;
        o.feed = 0;
        o.auto = [0, 0, 0];
        o.lvl0 = h.lvl();
        o.lvMin = o.lvMax = o.lvl0;
        o.rate = 0;
        o.tsP = null;
        o.lit = [1, 1, 1, 1];
        o.lastRet = -1e9;
        o.lastFeed = -1e9;
        o.pMin = 1e9;
        o.pMax = 0;
        o.o2Min = 21;
        o.o2Max = 0;
        o.batch = 0;
        o.tb0 = h.U.Tb; /* chain: the bed can already be above 600 C (no batch needed, PR-OPE-5002: batch at 400 ~ 600) */
      },
      each(h, o) {
        const t = o.t,
          U = h.U;
        if (t === 10) {
          h.autoSv('ABC-010', 'LICBR1001B', 0);
          h.autoSv('ABC-013', 'PICMS1002', 35);
          h.man('ABC-004A', 'FIC-CF', o.cf);
        }
        if (t < 20) return;
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        /* a running feeder to AUTO 30 s after its start (the drawing forces MANUAL while it is stopped; AUTO needs PV = SV, so FIC-CF
           is at the minimum of the feeder) */
        [
          ['M.3400', 'FICCL1061A'],
          ['M.3401', 'FICCL1061B'],
          ['M.3402', 'FICCL1061C']
        ].forEach(([l, tg], i) => {
          if (o.feed > i && !o.auto[i] && t - o.lastFeed >= 30 && h.bit('ABC-005', l) > 0.5) {
            h.mode(tg, 'LOC');
            o.auto[i] = t;
          }
        });
        /* feeder A in batches while the bed is below 600 C (10 s on, 60 s off) */
        if (o.feed === 0 && U.Tb < 600) {
          const ph = (t - 20) % 70;
          if (ph === 0) {
            h.setx(null, 'M.3400', 1);
            o.batch++;
          }
          if (ph === 10) h.setx(null, 'M.3400', 0);
        }
        if (o.feed === 0 && U.Tb >= 600) {
          o.feed = 1;
          o.lastFeed = t;
          h.setx(null, 'M.3400', 1);
        }
        if (o.feed === 1 && t - o.lastFeed >= 300) {
          o.feed = 2;
          o.lastFeed = t;
          h.setx(null, 'M.3401', 1);
        }
        if (o.feed === 2 && U.Tb >= 650 && t - o.lastFeed >= 300) {
          o.feed = 3;
          o.lastFeed = t;
          h.setx(null, 'M.3402', 1);
          h.setx(null, 'M.3405', 1);
        }
        if (t % 60 === 0) {
          const ts = h.tsat(U.Pd),
            r = o.tsP != null ? (ts - o.tsP) * 60 : 0;
          o.tsH = o.tsH || [];
          o.tsH.push(ts);
          if (o.tsH.length > 6) o.tsH.shift();
          if (o.tsH.length === 6) o.rate = Math.max(o.rate, (ts - o.tsH[0]) * 12);
          o.tsP = ts;
          /* coal demand up 5 % a minute to 25 % (10 T/H a feeder) once the feeders are in AUTO */
          if (r > 110 && o.cf > 10) {
            o.cf -= 5;
            h.man('ABC-004A', 'FIC-CF', o.cf);
          } else if (
            r < 90 &&
            o.feed >= 1 &&
            o.auto[0] &&
            o.cf < 15 &&
            (o.feed < 2 || o.auto[1]) &&
            (o.feed < 3 || o.auto[2])
          ) {
            o.cf += 5;
            h.man('ABC-004A', 'FIC-CF', o.cf);
          }
          /* oil down 5 % a minute once a feeder runs continuously (min 20 %, about the minimum flow of a burner 0.6 T/H) */
          if (o.feed >= 1 && o.ab > 20) {
            o.ab -= 5;
            for (const [k, tg] of [
              ['ABC-003A', 'FICDO1043A'],
              ['ABC-003B', 'FICDO1043B'],
              ['ABC-003C', 'FICDO1043C'],
              ['ABC-003D', 'FICDO1043D']
            ])
              h.man(k, tg, o.ab);
          }
          /* retract the burners one by one (A, D, B, C) above 700 C, 3 min apart, until all are out */
          if (o.feed >= 3 && U.Tb > 700 && t - o.lastRet >= 180) {
            const order = [0, 3, 1, 2],
              i = order.find(j => o.lit[j]);
            if (i != null) {
              o.lit[i] = 0;
              o.lastRet = t;
              const vc = ['M.3410', 'M.3411', 'M.3416', 'M.3417'][i],
                ins = ['M.3412', 'M.3413', 'M.3418', 'M.3419'][i];
              h.oilValve(vc, false);
              h.setx(null, ins, 0);
              if (!o.lit.some(Boolean)) o.allOut = t;
            }
          }
          /* O2 3.5 ~ 5.5 %: PA / SA 2 % a minute (floor 10 %) */
          if (o.feed >= 1) {
            const x = h.O2();
            o.airMv = o.airMv == null ? 10 : o.airMv;
            if (x > 5.5) o.airMv = Math.max(10, o.airMv - 2);
            else if (x < 3.5) o.airMv = Math.min(60, o.airMv + 2);
            h.man('ABC-007', 'FICFA1071', o.airMv);
            h.man('ABC-007', 'FICFA1081', o.airMv);
          }
          /* coal master to AUTO at the coal of now, once every burner is out */
          if (o.allOut != null && !o.cmAuto && t - o.allOut >= 300) {
            o.cmAuto = t;
            o.cmSv = h.coal();
            h.autoSv('ABC-004A', 'FIC-CM', o.cmSv);
          }
        }
        if (o.allOut != null) {
          o.pMin = Math.min(o.pMin, h.MSP());
          o.pMax = Math.max(o.pMax, h.MSP());
          o.o2Min = Math.min(o.o2Min, h.O2());
          o.o2Max = Math.max(o.o2Max, h.O2());
        }
      },
      done(h, o) {
        return o.cmAuto != null && o.t >= o.cmAuto + 600;
      },
      checks(h, o) {
        const U = h.U,
          run = ['M.3400', 'M.3401', 'M.3402'].map(l => h.bit('ABC-005', l) > 0.5),
          fr = U.fuel.map(l => (l.length ? +l[0][0].rt.st[l[0][1].id].val : 0)),
          cm = h.ctl('ABC-004A', 'FIC-CM'),
          cmSv = +h.sh('ABC-004A').rt.v[cm.q.sv];
        return [
          [
            (o.batch >= 3 || o.tb0 >= 600) && U.burn >= 0.99,
            'batch firing ' +
              o.batch +
              ' burping (feeder A 10 s / 60 s) hanggang bed 600 °C' +
              (o.tb0 >= 600 ? ' (bed ' + f0(o.tb0) + ' °C na sa simula: walang batch, PR-OPE-5002 batch sa 400 ~ 600)' : '') +
              '; coal burnt share ngayon ' +
              f1(U.burn * 100) +
              ' %'
          ],
          [U.Tb >= 750, 'bed ' + f0(U.Tb) + ' °C (≥ 750: lahat ng burner retracted)'],
          [
            run.every(Boolean) && fr.every(x => x > 4) && o.auto.every(Boolean),
            'feeder A / B / C tumatakbo sa AUTO: ' + fr.map(f1).join(' / ') + ' T/H'
          ],
          [
            o.allOut != null && U.oilF < 0.05,
            'oil ' + f1(U.oilF) + ' T/H (lahat ng supply oil valve sarado, burners out of service)'
          ],
          [
            o.o2Min > 3 && o.o2Max < 10,
            'O2 ' +
              f1(o.o2Min) +
              ' ~ ' +
              f1(o.o2Max) +
              ' % pagkatapos ng retract (PA / SA sa minimum na hangin ng fluidization, 10 %: mataas ang O2 sa maliit na load)'
          ],
          [
            h.MSP() < 125 && o.rate <= 110,
            'MSP ' +
              f1(h.MSP()) +
              ' kg/cm2 (< 125), saturation ' +
              f0(o.rate) +
              ' °C/h max (Fig 1 ≤ 110); blow-off ' +
              f0(h.mv('ABC-013', 'PICMS1002')) +
              ' %'
          ],
          [
            Math.abs(o.lvMax) < 150 && Math.abs(o.lvMin) < 150,
            'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm (LICBR1001B start-up control)'
          ],
          [
            o.cmAuto != null &&
              !h.isAuto('ABC-004A', 'FIC-CM') &&
              h.sh('ABC-004A').rt.st[cm.amt.id].fman &&
              h.bit('ABC-004A', 'M.0130') > 0.5 &&
              near(h.coal(), cmSv, 10),
            'coal master FIC-CM MANUAL kahit pinindot ang A: force manual ng drawing M.0130 (FIC-CF / FICFA1071 / FICFA1081 hindi pa REMOTE; AUTO sa hakbang 4 kasama ng boiler master); SV ' +
              f1(cmSv) +
              ' = coal ' +
              f1(h.coal()) +
              ' T/H'
          ],
          [h.MW() < 0.5 && h.bit('ABC-001C', 'M.3200') < 0.5, 'MW ' + f1(h.MW()) + ', walang trip']
        ];
      }
    },
    {
      id: 'byp',
      warm: { P: 30, Tb: 480, burners: 4, mv: 30, air: 10 },
      title: 'M4 · Bypass system at pressure raise: blow-off → HP / LP bypass → 123 kg/cm2',
      how: 'Start warm (30 kg/cm2, 4 burner). LICBR1001B A SV 0 (start-up level control). MS blow-off PICMS1002 A SV 50 (hawak ang 50 ksc hanggang nasa serbisyo ang bypass, PR-OPE-5002). HP bypass PICMS1006 A SV 50 (LOCAL), LP bypass PICHR1003 A SV 7.6 (procedure: 7.5 ksc), RH blow-off PICHR1391 M 20 % (bukas sa warming). Oil 5 % kada 2 min habang ≤ 90 °C/h (Fig 1), bawas kapag > 100 °C/h; pagkatapos ng servicing hawak ang oil (bawas kapag > 65 T/H, 2 sa itaas ng SV, o papalapit na ang SV sa 123; dagdag kada 5 min kapag hindi nakakasunod ang pressure); O2 3.5 ~ 8 % sa PA / SA; furnace −15 mmH2O sa PICFG108 M (PR-OPE-5002: hydraulic coupling mano-mano). Sa MSP ≥ 48 at MSF ≥ 40 T/H (bypass servicing): SV ng HP bypass +1 kg/cm2 kada minuto hanggang 123 (habang nakakasunod ang pressure), blow-off SV = HP bypass SV + 5 (sasara), RH blow-off −5 % kada minuto hanggang sarado. Tigil 10 min pagkatapos umabot sa 123.',
      want: 'Bypass servicing sa ~50 ksc / > 40 T/H; MSP 123 kg/cm2 (SV ng HP bypass) na may saturation ≤ 110 °C/h; HP bypass ang kumukuha ng steam, MS blow-off sarado; RH pressure 7.5 ± 1.5 kg/cm2 hawak ng LP bypass sa AUTO, RH blow-off sarado; MST ≥ 345 °C (procedure, admission) at ≤ 535 (TAB_9); drum level ±150 mm hawak ng LICBR1001B, FICFW1007 force manual ayon sa drawing (M.0228: FW < 100 T/H, M.022C; 3-element sa hakbang 4); MW 0, walang trip, furnace −55 ~ +25 mmH2O; 50 → 123 sa loob ng 2 h.',
      secs: 12000,
      run(h, o) {
        /* 2.2.0-beta.20: in the chain the burners are out after the coal transfer: the operator fires with the coal (FIC-CF) */
        o.coalFire = !!o.chain && h.coal() > 1;
        o.ab = o.chain ? Math.round(['A', 'B', 'C', 'D'].reduce((a, k) => a + h.mv('ABC-003' + k, 'FICDO1043' + k), 0) / 4) : 30;
        o.cf = h.mv('ABC-004A', 'FIC-CF');
        o.airMv = o.chain ? h.mv('ABC-007', 'FICFA1071') : 10;
        o.lvl0 = h.lvl();
        o.lvMin = o.lvMax = o.lvl0;
        o.rate = 0;
        o.tsH = [];
        o.hpSv = 50;
        o.rb = 20;
        o.svc = null;
        o.p123 = null;
        o.rhMin = 1e9;
        o.rhMax = 0;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
      },
      each(h, o) {
        const t = o.t,
          U = h.U;
        if (t === 10) {
          /* chain: the coal stage leaves the pressure at ~ 80 kg/cm2; an HP bypass SV of 50 there opens the bypass wide at once
             (steam flow 44 -> 124 T/H in 3 min: drum level -148 then +243 mm, reheat 12.5 kg/cm2). PR-OPE-5002 (7150): set the SV to
             the PV before AUTO; the servicing then raises it 1 kg/cm2 a minute to 123. Blow-off 5 above, as in the servicing */
          o.hpSv = Math.max(50, Math.min(123, Math.ceil(h.MSP())));
          h.autoSv('ABC-010', 'LICBR1001B', 0);
          h.autoSv('ABC-013', 'PICMS1002', o.hpSv > 50 ? o.hpSv + 5 : 50);
          h.autoSv('ABC-050', 'PICMS1006', o.hpSv);
          h.autoSv('ABC-052', 'PICHR1003', 7.6);
          h.man('ABC-054', 'PICHR1391', o.rb);
        }
        if (t < 20) return;
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        if (t % 60 === 0) {
          const ts = h.tsat(U.Pd);
          o.tsH.push(ts);
          if (o.tsH.length > 6) o.tsH.shift();
          const r = o.tsH.length === 6 ? (ts - o.tsH[0]) * 12 : 0;
          o.rate = Math.max(o.rate, r);
          /* firing: oil 5 % every 2 min while Fig 1 allows; after the servicing the bypass is the only outlet, so the operator keeps the
             steam flow at 40 ~ 55 T/H (PR-OPE-5002: "increase the oil firing rate if necessary") and the HP bypass sets the pressure */
          const msf = h.MSF(),
            fire = o.coalFire ? o.cf : o.ab,
            fmin = o.coalFire ? 10 : 20,
            fmax = o.coalFire ? 40 : 80,
            /* 3.2.0-beta.17: with the IF97 steam table (beta.15) the saturation temperature rises faster per kg/cm2 between 30 and
               60 kg/cm2 (1.8 C instead of 1.5 at 30): the operator cuts the fire at 90 C/h (was 100) and adds it under 80 (was 90),
               to stay under the 110 C/h of Fig 1 */
            dn = r > 90 || (o.svc != null && (msf > 65 || h.MSP() > o.hpSv + (o.coalFire ? 0.5 : 2) || (o.hpSv >= 120 && fire > fmin + 5))),
            up =
              (o.svc == null && t % 120 === 0 && r < 80 && fire < fmax) ||
              (o.svc != null && t % 300 === 0 && r < 80 && fire < fmax && h.MSP() < o.hpSv - 1);
          if (o.coalFire) {
            /* 2.2.0-beta.20 (chain): the coal master is MANUAL (M.0130 until REMOTE), FIC-CF 1 % a step (about 1.2 T/H on 3 feeders);
               2 % when the pressure is already over the HP bypass SV (the HP bypass then opens wide and the reheat pressure runs over 9) */
            if (dn) o.cf = Math.max(fmin, o.cf - (o.svc != null && h.MSP() > o.hpSv + 0.5 ? 2 : 1));
            else if (up) o.cf += 1;
            h.man('ABC-004A', 'FIC-CF', o.cf);
          } else {
            if (dn) o.ab = Math.max(fmin, o.ab - 5);
            else if (up) o.ab += 5;
            for (const [k, tg] of [
              ['ABC-003A', 'FICDO1043A'],
              ['ABC-003B', 'FICDO1043B'],
              ['ABC-003C', 'FICDO1043C'],
              ['ABC-003D', 'FICDO1043D']
            ])
              h.man(k, tg, o.ab);
          }
          /* O2 3.5 ~ 8 %: PA / SA 2 % a minute (floor 10 %) */
          const x = h.O2();
          if (x > 8) o.airMv = Math.max(10, o.airMv - 2);
          else if (x < 3.5) o.airMv = Math.min(60, o.airMv + 2);
          h.man('ABC-007', 'FICFA1071', o.airMv);
          h.man('ABC-007', 'FICFA1081', o.airMv);
          /* furnace pressure −15 mmH2O by hand on the IDF hydraulic coupling (PR-OPE-5002; the drawing forces PICFG108 MANUAL below 14 %) */
          const fp = h.FP();
          if (fp < -30) o.fpMv = Math.max(5, o.fpMv - 1);
          else if (fp > 0) o.fpMv = Math.min(60, o.fpMv + 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
          /* drum level: the start-up valve loop LICBR1001B (AUTO, SV 0) lags the evaporation of a coal fire (chain: −218 mm at 72 T/H
             of steam, valve 22 %), so the operator opens the valve by hand, +5 % a minute while the level is under −60 mm, and gives it
             back to AUTO (SV 0, bumpless) as soon as the level stops falling or is over −50 mm (+10 % a minute and AUTO only at −20
             overshot to +243 mm; +5 % with AUTO at −40: +154) */
          {
            const lv = h.lvl(),
              falling = lv < (o.lvPrev == null ? lv : o.lvPrev) - 1;
            o.lvPrev = lv;
            if (!o.lvMan && lv < -60 && falling) {
              o.lvMan = 1;
              o.lvMv = h.mv('ABC-010', 'LICBR1001B');
            }
            if (o.lvMan) {
              if (lv < -50 && falling) {
                o.lvMv = Math.min(100, o.lvMv + 5);
                h.man('ABC-010', 'LICBR1001B', o.lvMv);
              } else {
                h.autoSv('ABC-010', 'LICBR1001B', 0);
                o.lvMan = 0;
              }
            }
          }
          /* bypass servicing (PR-OPE-5002: 50 ksc, steam flow > 40 T/H) */
          if (o.svc == null && h.MSP() >= 48 && h.MSF() >= 40) {
            o.svc = t;
            o.svcP = h.MSP();
            o.svcF = h.MSF();
          }
          if (o.svc != null) {
            /* 3.2.0-beta.17: over 110 kg/cm2 the SV goes up 1 in 90 s at most (slower than the pressure rises, about 0.85 kg/cm2 a
               minute on the minimum coal): the pressure rides a little over the SV and the HP bypass takes the steam little by little,
               not ~70 T/H at once at 123 (reheat pressure 9.3 kg/cm2 over the 7.5 ± 1.5 of PR-OPE-5002) */
            if (o.hpSv < 123 && h.MSP() >= o.hpSv - 1 && (o.hpSv < 110 || t - (o.hpT == null ? -1e9 : o.hpT) >= 90)) {
              o.hpT = t;
              o.hpSv = Math.min(123, o.hpSv + 1);
              h.autoSv('ABC-050', 'PICMS1006', o.hpSv);
            }
            h.autoSv('ABC-013', 'PICMS1002', o.hpSv + 5);
          }
          /* RH blow-off PICHR1391 (MANUAL, PR-OPE-5002: open while warming, "closing the RH blow off valve slowly until fully close,
             maintain 7.5 ksc"): the LP bypass PID of ABC-052 lags when the HP bypass opens (chain: 55 -> 75 T/H in 5 min, RH 10.2),
             so the operator opens the blow-off 5 % a minute over 8.2 kg/cm2 (10 % over 8.5) and closes it 5 % a minute under 8 */
          {
            const rp = h.RHP();
            if (rp > 8.5) o.rb = Math.min(60, o.rb + 10);
            else if (rp > 8.2) o.rb = Math.min(60, o.rb + 5);
            else if (o.svc != null && rp < 8.2 && o.rb > 0) o.rb = Math.max(0, o.rb - 5);
            h.man('ABC-054', 'PICHR1391', o.rb);
          }
        }
        if (o.svc != null && t >= o.svc + 1200) {
          o.rhMin = Math.min(o.rhMin, h.RHP());
          o.rhMax = Math.max(o.rhMax, h.RHP());
        }
        if (o.p123 == null && h.MSP() >= 122.5) o.p123 = t;
        if (window.__tr && t % 30 === 0)
          window.__tr.push([t, h.RHP(), h.mv('ABC-052', 'PICHR1003'), U.mhp, h.MSF(), o.coalFire ? o.cf : o.ab, h.MSP(), o.hpSv, h.mv('ABC-050', 'PICMS1006'), h.mv('ABC-054', 'PICHR1391'), h.lvl(), h.mv('ABC-010', 'LICBR1001B'), h.FW(), h.coal()].map(x => +(+x).toFixed(2)));
      },
      done(h, o) {
        /* 10 min at 123; the RH blow-off closed (the operator closes it 5 % a minute once the reheat is under 8.2), at most 30 min */
        return o.p123 != null && o.t >= o.p123 + 600 && (o.rb === 0 || o.t >= o.p123 + 1800);
      },
      checks(h, o) {
        const U = h.U,
          mso = U.ms + U.mb,
          fwc = h.ctl('ABC-010', 'FICFW1007');
        return [
          [
            o.svc != null,
            o.svc != null
              ? 'bypass servicing sa MSP ' +
                f1(o.svcP) +
                ' kg/cm2, MSF ' +
                f0(o.svcF) +
                ' T/H (PR-OPE-5002: 50 ksc, > 40 T/H) sa ' +
                f0(o.svc / 60) +
                ' min'
              : 'hindi umabot sa 50 ksc / 40 T/H: MSP ' + f1(h.MSP()) + ', MSF ' + f0(h.MSF())
          ],
          [
            h.MSP() >= 120 && o.rate <= 110,
            'MSP ' +
              f1(h.MSP()) +
              ' kg/cm2 (target 123 = SV ng HP bypass), saturation ' +
              f0(o.rate) +
              ' °C/h max sa 5 min (Fig 1 ≤ 110)'
          ],
          [
            h.mv('ABC-050', 'PICMS1006') > 3 && h.mv('ABC-013', 'PICMS1002') < 1 && U.mhp >= 0.9 * U.mb,
            'HP bypass ' +
              f0(h.mv('ABC-050', 'PICMS1006')) +
              ' % ang kumukuha ng steam (' +
              f0(U.mhp) +
              ' ng ' +
              f0(mso) +
              ' T/H), MS blow-off ' +
              f0(h.mv('ABC-013', 'PICMS1002')) +
              ' % (sarado)'
          ],
          [
            /* 2.5.0-beta.7: 7.5 ± 1.5 as written (want), judged on the value shown (one decimal): 9.0 is in, 9.1 is out; before < 9 was stricter than the criterion */ +o.rhMin.toFixed(1) >= 6 && +o.rhMax.toFixed(1) <= 9 && h.isAuto('ABC-052', 'PICHR1003') && h.mv('ABC-054', 'PICHR1391') < 0.5,
            'RH pressure ' +
              f1(o.rhMin) +
              ' ~ ' +
              f1(o.rhMax) +
              ' kg/cm2 (7.5 ± 1.5) hawak ng LP bypass sa AUTO (SV 7.6, MV ' +
              f0(h.mv('ABC-052', 'PICHR1003')) +
              ' %); RH blow-off ' +
              f0(h.mv('ABC-054', 'PICHR1391')) +
              ' %'
          ],
          [
            h.MST() >= 345 && h.MST() <= 535,
            'MST ' + f0(h.MST()) + ' °C (PR-OPE-5002: ≥ 345 bago ang admission; TAB_9: ≤ 535 bago ang sync), bed ' + f0(U.Tb) + ' °C'
          ],
          [
            Math.abs(o.lvMax) < 150 &&
              Math.abs(o.lvMin) < 150 &&
              h.isAuto('ABC-010', 'LICBR1001B') &&
              h.sh('ABC-010').rt.st[fwc.amt.id].fman &&
              h.bit('ABC-010', 'M.0228') > 0.5,
            'drum level ' +
              f0(o.lvMin) +
              ' ~ ' +
              f0(o.lvMax) +
              ' mm hawak ng LICBR1001B (start-up valve ' +
              f0(h.mv('ABC-010', 'LICBR1001B')) +
              ' %, AUTO); FICFW1007 force manual ayon sa drawing (M.0228: FW ' +
              f0(h.FW()) +
              ' T/H < 100, M.022C; 3-element sa hakbang 4)'
          ],
          [
            o.p123 != null && o.svc != null && o.p123 - o.svc <= 7200,
            '50 → 123 kg/cm2 sa ' +
              (o.p123 != null && o.svc != null ? f0((o.p123 - o.svc) / 60) : '—') +
              ' min pagkatapos ng servicing (Fig 2: apoy → roll ~5 h); oil ' +
              f1(U.oilF) +
              ' T/H, O2 ' +
              f1(h.O2()) +
              ' %'
          ],
          [
            h.MW() < 0.5 && h.bit('ABC-001C', 'M.3200') < 0.5 && h.FP() > -55 && h.FP() < 25,
            'MW ' +
              f1(h.MW()) +
              ', walang trip; furnace ' +
              f0(h.FP()) +
              ' mmH2O (PICFG108 M ' +
              f0(h.mv('ABC-008', 'PICFG108')) +
              ' %, PR-OPE-5002: −15 mano-mano)'
          ]
        ];
      }
    },
    {
      id: 'roll',
      hot: true,
      title: 'M4 · Turbine roll, sync, load up to 45 MW',
      how: 'Start hot (dulo ng hakbang 3: 123 kg/cm2 sa HP bypass AUTO, LP bypass AUTO 7.6, bed 750 °C, 3 feeder sa FIC-CF 12 %, burners out). Operator sa TCS panel (labas ng DCS drawing): ROLL sa t = 1 min (ATS AUTO, HOT mode: 360 rpm/min, 3 min heat soak sa 3600 rpm, IP start mode: roll steam mula sa reheat sa ICV); pagkatapos ng ACCELERATION: SYNC (EXCITATION, GCB 52G1 sarado: ABC-050 I.0931 = 1 / I.0932 = 0, initial load 5 % = 7.5 MW), LP bypass R (REMOTE: SV = first stage + 5.1); 5 min hold; LOAD UP 45 MW (5 %/min = 7.5 MW/min). Sa 20 MW o ICV full open: ICV → CV transfer (I.0418 = 1; ang drawing ang nagpapa-REMOTE ng HP bypass SV = PV + 2 sa sync pulse M.070D, kaya sumasara). Coal: FIC-CF +2 ~ 3 % kada minuto habang paakyat (+3 kapag MSP < 118), ±1 pagkatapos para hawak ang 123; O2 3.5 ~ 8 (PA / SA); furnace −15 sa PICFG108 M. Feedwater ayon sa interlock ng ABC-010: kapag LICBR1001B > 30 %: LICBR1001B M (hawak), LICBR1001A A SV 0 (single-element sa main valve; M.0227: isa lang ang level controller), LICBR1001B pasara 5 % kada minuto; kapag FW > 100 T/H at wala na ang force manual (M.0228 = 0: M.022C → TON 60 s): FICFW1007 R (SV = steam flow + level master), LICBR1001 A SV 0, pindot ng 3-ELEMENT pushbutton M.054E (FF M.0222). Tigil 10 min pagkatapos umabot sa 45 MW.',
      want: '0 → 3600 rpm + soak sa 12 ~ 16 min; GCB sarado (I.0931 = 1, M.3220 = 0 sa ABC-010); initial load 7.5 ± 1 MW; 7.5 → 45 MW sa loob ng 5 ~ 12 min; transfer sa 15 ~ 22 MW (I.0418); HP at LP bypass sarado sa 45 MW (M.0709 = 0), HP bypass REMOTE (LP bypass: preset 33 % ng drawing sa transfer, isinasara ng operator sa M tapos R + A); MSP 123 ± 8 kg/cm2 habang nakakarga, HIC-BM MANUAL (M.2013 BU-CMD: MSF < 220); 3-element feedwater: FICFW1007 R + A, LICBR1001 A, M.0228 = 0, M.0222 = 0, LICBR1001B sarado; MST 345 ~ 535 °C; drum level ±150 mm; MW ≥ 44.5 at I.0081 = 1 (NORMAL OPERATION); walang trip, furnace −55 ~ +25.',
      secs: 6000,
      run(h, o) {
        o.cf = o.chain ? h.mv('ABC-004A', 'FIC-CF') : 12; /* 2.2.0-beta.20: in the chain, the coal of the stage before */
        o.airMv = o.chain ? h.mv('ABC-007', 'FICFA1071') : 14;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
        o.lvl0 = h.lvl();
        o.lvMin = o.lvMax = o.lvl0;
        o.rate = 0;
        o.tsH = [];
        o.roll = o.sync = o.load = o.xfer = o.p45 = o.fw3 = null;
        o.mwInit = NaN;
        o.xferMW = NaN;
        o.mspMin = 1e9;
        o.mspMax = 0;
        o.fwA = null;
        o.suv = null;
        o.pb = null;
        o.remOp = false;
      },
      each(h, o) {
        const t = o.t,
          U = h.U,
          tb = U.tb;
        if (t === 40) for (const tg of ['FICCL1061A', 'FICCL1061B', 'FICCL1061C']) h.mode(tg, 'LOC');
        /* 3.2.0-beta.38: the start-up biasing damper RH 10 % / SH 90 % (the Training step, PR-OPE-5002 after the purge): Start hot kept
           the 150 MW damper and the reheat stayed at 432 C, under the 485 C of the ATS HOT mode (1.6) */
        if (t === 20 && window.LS_GUIDE && LS_GUIDE.A) {
          LS_GUIDE.A.man('HICHR1002A', 10);
          LS_GUIDE.A.man('HICHR1002B', 90);
        }
        /* 3.2.0-beta.38: the ATS refuses the roll until its step-in condition is met (tcs.js): the operator tries again every 30 s */
        if (o.roll == null && t >= 60 && t % 30 === 0) {
          const r = AN.turbine('roll');
          if (r) o.rr = r;
          else o.roll = t;
        }
        /* 3.2.0-beta.38: the ATS (tcs.js) ends ACCELERATION after the heat soak at 3600 rpm (HOT mode 3 min); SYNC starts EXCITATION */
        const ts = AN.tcs && AN.tcs();
        if (o.sync == null && tb.st === 'roll' && (ts ? ts.step >= 3 : tb.rpm >= 3600)) {
          AN.turbine('sync');
          o.sync = t;
          h.rem('ABC-052', 'PICHR1003');
        }
        /* 3.2.0-beta.38: the ATS start of ACCELERATION (the speed timing is from here; before it the ATS waits for its criteria) */
        if (o.acc == null && ts && ts.cur === 3) o.acc = t;
        if (ts && ts.hold && ts.cur === 3 && o.tH != null) o.holdT = (o.holdT || 0) + (t - o.tH);
        o.tH = t;
        if (ts && ts.hold) {
          o.holds = o.holds || {};
          const k = ts.hold.replace(/\[[^\]]*\]/g, '').slice(0, 90);
          if (!o.holds[k]) o.holds[k] = 'step ' + ts.cur + ' t ' + Math.round(t / 60) + ' min';
        }
        /* LOAD UP once SYNCH. & INITIAL LOAD is complete (ATS step 5); the TCS refuses it before, the operator tries every 30 s */
        if (o.sync != null && o.load == null && t >= o.sync + 300 && t % 30 === 0) {
          if (!isFinite(o.mwInit)) o.mwInit = h.MW();
          const r = AN.turbine('loadup', 45);
          if (r) o.lr = r;
          else o.load = t;
        }
        if (o.xfer == null && h.bit('ABC-050', 'I.0418') > 0.5) {
          o.xfer = t;
          o.xferMW = h.MW();
        }
        /* the drawing puts the HP bypass SV to REMOTE (PV + 2) on the sync pulse M.070D; if not, the operator presses R */
        if (o.xfer != null && t === o.xfer + 60 && h.sh('ABC-050').rt.st[h.ctl('ABC-050', 'PICMS1006').svSw.id].pk !== 'A') {
          h.rem('ABC-050', 'PICMS1006');
          o.remOp = true;
        }
        if (o.p45 == null && o.load != null && h.MW() >= 44.5) o.p45 = t;
        /* the 3-ELEMENT select pushbutton (ABC-010 M.054E, TPS 2 s -> FF M.0222 reset): pressed for 2 s */
        if (o.pb != null && t >= o.pb + 2.5) {
          h.setx(null, 'M.054E', 0);
          o.pb = null;
        }
        if (t < 20) return;
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        if (o.sync != null) {
          o.mspMin = Math.min(o.mspMin, h.MSP());
          o.mspMax = Math.max(o.mspMax, h.MSP());
        }
        if (t % 60 === 0) {
          const ts = h.tsat(U.Pd);
          o.tsH.push(ts);
          if (o.tsH.length > 6) o.tsH.shift();
          o.rate = Math.max(o.rate, o.tsH.length === 6 ? (ts - o.tsH[0]) * 12 : 0);
          /* coal: the boiler master is MANUAL (BU-CMD below 220 T/H): the operator fires for the load and holds 123 kg/cm2 */
          const msp = h.MSP(),
            hb = h.mv('ABC-050', 'PICMS1006');
          if (o.load != null && o.p45 == null && msp < 125) o.cf += msp < 118 ? 3 : 2;
          else if (msp < 121 || (o.load != null && o.xfer == null && hb < 15)) o.cf += 1;
          else if (msp > 125) o.cf -= 1;
          o.cf = Math.max(10, Math.min(60, o.cf));
          h.man('ABC-004A', 'FIC-CF', o.cf);
          /* O2 3.5 ~ 8 %: PA / SA 2 % a minute (floor 10 %) */
          const x = h.O2();
          if (x > 8) o.airMv = Math.max(10, o.airMv - 2);
          else if (x < 3.5) o.airMv = Math.min(80, o.airMv + 2);
          h.man('ABC-007', 'FICFA1071', o.airMv);
          h.man('ABC-007', 'FICFA1081', o.airMv);
          /* furnace pressure −15 mmH2O by hand (PICFG108 forced MANUAL below 14 %) */
          const fp = h.FP();
          if (fp < -30) o.fpMv = Math.max(5, o.fpMv - 1);
          else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
          /* LP bypass after the transfer (ABC-052): the sync pulse M.070D sets FF M.070F -> TON 1 s M.0714 -> the valve goes to the PRESET
             SI0224 (RATE from the demand, 33 %); the FF resets only when the demand is <= 0 % (M.071D), and the demand is the preset
             itself while it is selected. The operator closes it: M, -10 % a minute to 0 (M.071D resets the FF), then R + A again */
          if (o.xfer != null && h.bit('ABC-052', 'M.070F') > 0.5) {
            o.lpMan = true;
            h.man('ABC-052', 'PICHR1003', Math.max(0, h.mv('ABC-052', 'PICHR1003') - 10));
          } else if (o.lpMan && o.lpBack == null && h.bit('ABC-052', 'M.070F') < 0.5 && !h.isAuto('ABC-052', 'PICHR1003')) {
            h.rem('ABC-052', 'PICHR1003');
            o.lpBack = t;
          }
          /* feedwater, as the drawing ABC-010 interlocks it: (1) start-up valve LICBR1001B to M (hold) and the single-element
             controller of the main valve LICBR1001A to A (M.0227 = NOT LICBR1001B.MAN: one level controller at a time; M.0222 = 1:
             FICFW1007.MV = LICBR1001A.MV), start-up valve shut 10 % a minute; (2) FW > 100 T/H -> M.022C -> TON 60 s -> M.022E = 0 ->
             M.0228 = 0: FICFW1007 to R (SV = SI0259 = steam flow + the level master LICBR1001), LICBR1001 to A, 3-ELEMENT pushbutton
             M.054E (FF M.0222 reset) */
          if (o.fwA == null) {
            /* at the start of the load up (4.5 -> 45 MW: steam 23 -> 157 T/H in 5 min): waiting for the start-up valve to reach 30 %
               left the level at -148 mm before the main valve took over, and LICBR1001A to A at -148 opened it to 252 T/H (+236 mm) */
            if (o.load != null || h.MSF() > 60 || h.mv('ABC-010', 'LICBR1001B') > 30) {
              o.suv = h.mv('ABC-010', 'LICBR1001B');
              h.man('ABC-010', 'LICBR1001B', o.suv);
              /* 3.2.0-beta.17: SV +50 mm through the load up (the steam goes 23 -> 157 T/H in 5 min and the feedwater follows late: the
                 level fell to -150 mm with SV 0); back to 0 at the 3-element (LICBR1001 A SV 0 below) */
              h.autoSv('ABC-010', 'LICBR1001A', 50);
              /* the level master LICBR1001 (3-element: FICFW1007 SV = steam flow + LICBR1001.MV) to M 0 % now, so that its A at the
                 transfer starts from 0 (in the chain it had wound up to 100 % while the level was low for hours: SV 156 + 100 ->
                 FW 252 T/H, drum level +237 mm) */
              h.man('ABC-010', 'LICBR1001', 0);
              o.fwA = t;
            }
          } else {
            if (o.suv > 0) {
              o.suv = Math.max(0, o.suv - 5);
              h.man('ABC-010', 'LICBR1001B', o.suv);
            }
            /* FW > 110 (not 100: a FW of 100 ~ 116 T/H dips under 100, M.022C -> TON 60 s -> M.022E -> M.0221 sets the FF M.0222
               back to single element after the pushbutton); the operator presses 3-ELEMENT again when the FF went back (standalone
               roll: FW 102 at the first press, 98 a minute later -> M.0222 = 1 at 45 MW) */
            if (o.fw3 != null && h.bit('ABC-010', 'M.0228') < 0.5 && (!h.isAuto('ABC-010', 'FICFW1007') || h.sh('ABC-010').rt.st[h.ctl('ABC-010', 'FICFW1007').svSw.id].pk !== 'A')) {
              /* a FW dip under 100 T/H after the transfer forced FICFW1007 MANUAL / LOCAL again (M.0228 -> TON 60 s), and the station
                 stays there after the force is gone (BU-CMD latch, CLAUDE.md 10): the operator puts it back to R + A */
              h.rem('ABC-010', 'FICFW1007');
            }
            if (h.FW() > 110 && h.bit('ABC-010', 'M.0228') < 0.5 && (o.fw3 == null || h.bit('ABC-010', 'M.0222') > 0.5)) {
              if (o.fw3 == null) {
                h.rem('ABC-010', 'FICFW1007');
                h.autoSv('ABC-010', 'LICBR1001', 0);
                o.fw3 = t;
              }
              h.setx(null, 'M.054E', 1);
              o.pb = t;
            }
          }
        }
        if (window.__tr && t % 30 === 0)
          window.__tr.push(
            [t, tb.rpm, tb.icv, h.MW(), U.tcsT, h.MSP(), h.MSF(), h.RHP(), h.mv('ABC-050', 'PICMS1006'), h.mv('ABC-052', 'PICHR1003'), +h.sh('ABC-052').rt.v[h.ctl('ABC-052', 'PICHR1003').q.sv], h.pk('ABC-052', 'PICHR1003') === 'B' ? 1 : 0, h.bit('ABC-052', 'M.0723'), o.cf, h.coal(), h.FW(), h.lvl(), h.mv('ABC-010', 'LICBR1001B'), h.mv('ABC-010', 'FICFW1007'), h.bit('ABC-010', 'M.0228'), h.MST(), h.O2(), h.FP()].map(x => +(+x).toFixed(2))
          );
      },
      done(h, o) {
        return o.p45 != null && o.t >= o.p45 + 600;
      },
      checks(h, o) {
        const U = h.U,
          tb = U.tb,
          S50 = h.sh('ABC-050'),
          S10 = h.sh('ABC-010'),
          fwc = h.ctl('ABC-010', 'FICFW1007'),
          hbc = h.ctl('ABC-050', 'PICMS1006'),
          mins = (a, b) => (a != null && b != null ? f0((a - b) / 60) : '—');
        return [
          [
            o.sync != null && o.acc != null && tb.rpm >= 3599 && o.sync - o.acc - (o.holdT || 0) >= 12 * 60 && o.sync - o.acc - (o.holdT || 0) <= 16 * 60,
            'ACCELERATION 0 → 3600 rpm + heat soak sa ' + mins(o.sync, o.acc) + ' min, ' + Math.round((o.holdT || 0) / 60) + ' min dito ay ATS HOLD (ATS HOT mode: 360 rpm/min, 3 min soak sa 3600; 12 ~ 16 min wala ang hold; ROLL hanggang ACCELERATION ' + mins(o.acc, o.roll) + ' min, hinihintay ang criteria)' + (o.holds ? '; ATS HOLD: ' + Object.entries(o.holds).map(([k, v]) => k + ' (' + v + ')').join(' | ') : '') + '; ngayon ' + f0(tb.rpm) + ' rpm, estado ' + tb.st + (o.roll == null && o.rr ? ', ROLL tinanggihan: ' + o.rr : o.roll != null ? ', roll sa t = ' + o.roll + ' s' : '')
          ],
          [
            h.bit('ABC-050', 'I.0931') > 0.5 && h.bit('ABC-050', 'I.0932') < 0.5 && h.bit('ABC-010', 'M.3220') < 0.5,
            'GCB 52G1 sarado: ABC-050 I.0931 ' + f0(h.bit('ABC-050', 'I.0931')) + ', I.0932 ' + f0(h.bit('ABC-050', 'I.0932')) + ', ABC-010 M.3220 (52G1 OPENED) ' + f0(h.bit('ABC-010', 'M.3220'))
          ],
          [isFinite(o.mwInit) && Math.abs(o.mwInit - 7.5) <= 1, 'initial load ' + f1(o.mwInit) + ' MW pagkatapos ng 5 min (ATS page 25: HOT mode 5 % = 7.5 MW)'],
          [
            o.p45 != null && o.p45 - o.load >= 4.5 * 60 && o.p45 - o.load <= 12 * 60,
            'LOAD UP 7.5 → 45 MW sa ' + mins(o.p45, o.load) + ' min (5 %/min = 7.5 MW/min; TCS target ' + f1(U.tcsT) + ', MW ' + f1(h.MW()) + ')' + (o.load == null && o.lr ? ', LOAD UP tinanggihan: ' + o.lr : '')
          ],
          [
            o.xfer != null && o.xferMW >= 8 && o.xferMW <= 22 && h.bit('ABC-050', 'I.0418') > 0.5,
            'ICV → CV transfer sa ' + f1(o.xferMW) + ' MW (PR-OPE-5002: sa 20 MW o kapag ICV full open; dito full open ang ICV: 7.6 kg/cm2 lang ang reheat na hawak ng LP bypass hanggang bumukas ang CV), I.0418 ' + f0(h.bit('ABC-050', 'I.0418')) + ', ICV ' + f0(100 * tb.icv) + ' %'
          ],
          [
            h.mv('ABC-050', 'PICMS1006') < 1 && h.mv('ABC-052', 'PICHR1003') < 1 && h.bit('ABC-050', 'M.0709') < 0.5 && S50.rt.st[hbc.svSw.id].pk === 'A',
            'HP bypass ' + f0(h.mv('ABC-050', 'PICMS1006')) + ' % (M.0709 HP BYPASS OPENED > 5 % = ' + f0(h.bit('ABC-050', 'M.0709')) + '), SV REMOTE (PV + 2' + (o.remOp ? ', pinindot ng operator ang R' : ', sync pulse M.070D ng drawing') + '); LP bypass ' + f0(h.mv('ABC-052', 'PICHR1003')) + ' % (' + (h.isAuto('ABC-052', 'PICHR1003') ? 'AUTO' : 'MANUAL') + ', SV ' + f1(+h.sh('ABC-052').rt.v[h.ctl('ABC-052', 'PICHR1003').q.sv]) + (o.lpMan ? '; preset 33 % ng drawing sa sync pulse (M.070F), isinara ng operator sa M, bumalik sa R + A' + (o.lpBack != null ? ' sa ' + f0(o.lpBack / 60) + ' min' : ' (hindi pa bumalik)') : '') + ')'
          ],
          [
            o.mspMin >= 115 && o.mspMax <= 131 && h.S.rt.st[h.bmA.id].pk === 'B' && h.bit('ABC-001C', 'M.2013') > 0.5,
            'MSP ' + f1(o.mspMin) + ' ~ ' + f1(o.mspMax) + ' kg/cm2 mula sync (123 ± 8), ngayon ' + f1(h.MSP()) + '; HIC-BM M (M.2013 BU-CMD: MSF ' + f0(h.MSF()) + ' T/H < 220); FIC-CF ' + f0(o.cf) + ' %, coal ' + f1(h.coal()) + ' T/H'
          ],
          [
            o.fw3 != null &&
              S10.rt.st[fwc.svSw.id].pk === 'A' &&
              h.isAuto('ABC-010', 'FICFW1007') &&
              h.isAuto('ABC-010', 'LICBR1001') &&
              h.bit('ABC-010', 'M.0228') < 0.5 &&
              h.bit('ABC-010', 'M.0222') < 0.5 &&
              h.mv('ABC-010', 'LICBR1001B') < 1,
            '3-element feedwater: FICFW1007 R + A (SV ' +
              f0(+S10.rt.v[fwc.q.sv]) +
              ' = steam flow + level master LICBR1001 A, PV ' +
              f0(h.FW()) +
              ' T/H), M.0228 ' +
              f0(h.bit('ABC-010', 'M.0228')) +
              ' (FW > 100, M.022C), M.0222 single-element ' +
              f0(h.bit('ABC-010', 'M.0222')) +
              ' (pushbutton M.054E); start-up valve LICBR1001B ' +
              f0(h.mv('ABC-010', 'LICBR1001B')) +
              ' %' +
              (o.fwA != null ? '; main valve mula ' + f0(o.fwA / 60) + ' min, 3-element mula ' + f0(o.fw3 / 60) + ' min' : '')
          ],
          [h.MST() >= 345 && h.MST() <= 535, 'MST ' + f0(h.MST()) + ' °C (PR-OPE-5002 ≥ 345; TAB_9 ≤ 535), RHT ' + f0(h.RHT()) + ' °C, RHP ' + f1(h.RHP()) + ' kg/cm2, saturation ' + f0(o.rate) + ' °C/h max'],
          [
            Math.abs(o.lvMax) < 150 && Math.abs(o.lvMin) < 150,
            'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm (±150)'
          ],
          [
            h.MW() >= 44.5 && h.bit('ABC-001C', 'I.0081') > 0.5 && h.bit('ABC-001C', 'M.3200') < 0.5 && h.FP() > -55 && h.FP() < 25,
            'MW ' + f1(h.MW()) + ' (NORMAL OPERATION 45 MW), I.0081 DCS control mode permissive ' + f0(h.bit('ABC-001C', 'I.0081')) + '; walang trip; furnace ' + f0(h.FP()) + ' mmH2O; O2 ' + f1(h.O2()) + ' %' + (AN.tcs && AN.tcs() ? '; ATS step ' + AN.tcs().step + (AN.tcs().hold ? ', HOLD: ' + AN.tcs().hold : '') : '')
          ]
        ];
      }
    },
    {
      /* 2.2.0-beta.20 (M4 step 5): runs only inside a chain, after the roll stage (the plant at 45 MW, NORMAL OPERATION) */
      id: 'up',
      stage: true,
      title: 'M4 · 45 → 150 MW: coal master REMOTE, boiler master AUTO, DCS control mode ON, EIC-TM AUTO, CCS',
      secs: 9000,
      run(h, o) {
        const S = h.S;
        o.bm = +S.rt.st[h.hbm.id].val;
        o.S4 = h.sh('ABC-004A');
        o.cm = h.ctl('ABC-004A', 'FIC-CM');
        o.S2 = h.sh('ABC-002');
        o.o2 = h.ctl('ABC-002', 'AICFG112');
        const L = AN.sheets.filter(s => s.S && !/ABC-000/.test(s.name));
        for (const s of L) {
          const z = s.S.blk.find(z => z.k === 'MAN' && (z.tag === 'HIC-ULD' || (z.txt || []).includes('HIC-ULD')));
          if (z) {
            o.SU = s.S;
            o.ubu = z;
            break;
          }
        }
        o.tgt = (o.SU.drv[o.ubu.i[o.ubu.svI]] || []).find(z => z.k === 'AMT').a;
        o.lvl0 = h.lvl();
        o.lvMin = o.lvMax = o.lvl0;
        o.mspMin = 1e9;
        o.mspMax = 0;
        o.pP = null;
        o.aim = h.MW();
        o.fpMv = h.mv('ABC-008', 'PICFG108');
        o.cmRem = o.cmAuto = o.cobmA = o.bmAuto = o.dcsOn = o.tmAuto = o.uldA = o.p150 = o.fgA = o.o2auto = null;
        o.bmMsf = NaN;
        o.o2man = 0;
      },
      each(h, o) {
        const t = o.t,
          S = h.S,
          S4 = o.S4;
        const bmSet = x => {
          o.bm = Math.max(5, Math.min(100, x));
          S.rt.st[h.hbm.id].val = o.bm;
        };
        if (t === 10) {
          /* COAL CALORIE CORR. 4150 kcal/kg = HS-COAL 33.1 % (11.png), set by hand before the coal master. FIC-CF: A (LOCAL) at its PV
             first: while FIC-CF is LOCAL the coal master output tracks the SV of FIC-CF (ABC-004A: the B / T selectors up to the COS
             of FIC-CM), so the change to REMOTE is bumpless; a LOCAL SV left at 0 would take the coal to 0. PA / SA REMOTE: the air
             follows the air demand of the drawing (ABC-006 LN5 of the boiler master, minimum 446 T/H) */
          h.man('ABC-004A', 'HS-COAL', 33.1);
          h.autoSv('ABC-004A', 'FIC-CF', h.pv('ABC-004A', 'FIC-CF'));
          /* O2 trim AICFG112 is forced MANUAL under 220 T/H (M.0102): its output multiplies the SA demand (LN15: 0 % = x 0.8, 50 % = x 1.0),
             so the operator puts it at 50 % (neutral) BEFORE PA / SA go REMOTE. Left low, the SA stays 15 ~ 20 % under its demand, the
             total air 416 ~ 434 T/H is under the 446 T/H minimum of LN5 and the fuel limit LN40 (414 T/H -> 0, 446 -> 35) cuts the coal
             demand: the coal master never sees SV = PV for its REMOTE */
          {
            const oq = o.S2.rt.st[o.o2.amt.id];
            if (oq.pk === 'B' && o.o2.manNet != null) o.S2.rt.ext[o.o2.manNet] = 50;
          }
          /* PA FLOW BIAS HIC-TADBS (ABC-002, -50 ~ +50 -> LN14 -30 ~ +30 T/H on the PA SV only): the app starts it at -50 (7.PNG,
             150 MW: -30 T/H). The SA demand is LN5(BM) - PA DEMAND without the bias, so a -30 bias takes 30 T/H off the TOTAL air:
             at the LN5 minimum 446 the total is 416 = under the LN40 knee (414 -> 0 fuel) and the coal demand is cut to ~ 2 T/H.
             Start-up: bias 0 (neutral); the -30 of 7.PNG is a 150 MW trim of the operator */
          {
            const T2 = h.sh('ABC-002'),
              tb = T2 && T2.blk.find(b => b.k === 'MAN' && b.tag === 'HIC-TADBS');
            if (tb && T2.rt.st[tb.id]) T2.rt.st[tb.id].val = 0;
          }
          h.rem('ABC-007', 'FICFA1071');
          h.rem('ABC-007', 'FICFA1081');
        }
        if (t === 40) {
          /* M.0130 (ABC-004A): the coal master stays MANUAL until FIC-CF, FICFA1071 and FICFA1081 are REMOTE */
          h.rem('ABC-004A', 'FIC-CF');
          o.cmRem = t;
        }
        if (t < 20) return;
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        o.mspMin = Math.min(o.mspMin, h.MSP());
        o.mspMax = Math.max(o.mspMax, h.MSP());
        /* HIC-ULD (MANUAL) tracks the MW while the TCS still runs on its own target. EIC-TM (MANUAL) is tracked by the drawing itself
           (ABC-001C AMT "T" of M.2017 = NOT I.0082: while the DCS is not in control the station follows AI0420, the TCS target), so at
           DCS CONTROL MODE ON the TCS keeps its target: no jump */
        if (o.uldA == null) o.SU.rt.st[o.ubu.id].val = h.MW();
        if (o.dcsOn == null && h.bit('ABC-001C', 'I.0082') > 0.5) o.dcsOn = t;
        if (o.p150 == null && o.uldA != null && h.MW() >= 149) o.p150 = t;
        if (t % 10 !== 0) return;
        const P = h.MSP(),
          dP = o.pP == null ? 0 : P - o.pP,
          bmA = S.rt.st[h.bmA.id].pk === 'A';
        o.pP = P;
        /* (1) FIC-CM R + A when the drawing allows it (M.0130 = 0) and its REMOTE SV (SI0141, the fuel demand of ABC-002: HIC-BM.MV
           limited by the air, LN40) is the coal of now. While FIC-CM is not REMOTE the boiler master output tracks the fuel (ABC-001C
           M.2000: HIC-BM.MV = SI0017), so the demand comes to the coal by itself once the air is above the cross limit (PA / SA REMOTE) */
        if (o.cmAuto == null && t >= 60) {
          const sv = h.val('ABC-004A', 'SI0141'),
            pv = +S4.rt.v[o.cm.q.pv];
          if (h.bit('ABC-004A', 'M.0130') < 0.5 && Math.abs(sv - pv) < 1.5) {
            h.rem('ABC-004A', 'FIC-CM');
            o.cmAuto = t;
            o.bm = +S.rt.st[h.hbm.id].val;
          }
        }
        /* (2) load up by hand to 230 T/H of main steam (PR-OPE-5002: boiler master AUTO at 230 T/H), boiler follow by hand: the firing
           (HIC-BM) is only RAISED, up to 0.5 % every 10 s while the pressure is under 123 and not rising; the TCS target follows the
           pressure (3 MW/min = the HIC-MWRL rate at MSP >= 124, 1.5 at >= 121, 0.5 at >= 118, a hold below). A cut of the firing near the
           minimum air takes the air demand down with it and the fuel demand under the cross limit of the air (ABC-002 LN40) */
        if (o.cmAuto != null && !bmA) {
          if (t % 60 === 0 && o.aim < 80) {
            const step = P >= 124 ? 3 : P >= 121 ? 1.5 : P >= 118 ? 0.5 : 0;
            if (step) {
              o.aim = Math.min(80, o.aim + step);
              AN.turbine('loadup', o.aim);
            }
          }
          bmSet(o.bm + Math.max(0, Math.min(0.5, 0.02 * (123 - P) - 0.3 * dP + (o.aim < 80 ? 0.04 : 0))));
        }
        /* SH spray (PR-OPE-5002 "SERVICE MS & RH FOR TEMPERATURE CONTROL": the MS desuperheater to AUTO with the SV of the start-up
           curve; "Set Steam Temp. Controls on AUTO at boiler load > 60 %"; HPBV desup: "change Set Value to PV Value" before AUTO): the
           inner loops TICBR1130 / TICBR1150 A at their SV (394 / 418 C) once the spray outlet is within 5 C of it, the inner R once the
           outer TICBR1140 (462) / TICMS1004 (541) is within 10 C of its SV, then the outer A (cascade). 4.PNG: #1 / #2 SPRAY TEMP CTL R, #2 OUTLET TEMP
           CTL / MAIN STEAM TEMP CTL A. Without this the spray stays shut and the main steam temperature runs to the top of the range */
        {
          const svOf = (k, tg) => {
            const c = h.ctl(k, tg);
            return c && c.q && c.q.sv != null ? +h.sh(k).rt.v[c.q.sv] : NaN;
          };
          o.spr = o.spr || {};
          for (const [k, inn, outt, sv2] of [
            ['ABC-011', 'TICBR1130', 'TICBR1140', 462],
            ['ABC-012', 'TICBR1150', 'TICMS1004', 541]
          ]) {
            const q = o.spr[inn] || (o.spr[inn] = {});
            if (q.a == null && h.pv(k, inn) >= svOf(k, inn) - 5) {
              h.autoSv(k, inn, svOf(k, inn));
              q.a = t;
            }
            /* 2.5.0-beta.3: the inner R first, then the outer A a minute later. The drawing forces the outer loop MANUAL while the
               inner is not REMOTE (ABC-011 M.0230 = TICBR1130.LOC, ABC-012 M.0240 = TICBR1150.LOC, drawing audit ABC-011-1 / 012-1),
               so an A pressed on the outer before the inner R is refused (before: A outer, then R inner: TICBR1140 / TICMS1004 stayed M) */
            if (q.a != null && q.r == null && h.pv(k, outt) >= sv2 - 10) {
              h.rem(k, inn);
              q.r = t;
            }
            if (q.r != null && q.o == null && t >= q.r + 60) {
              h.autoSv(k, outt, sv2);
              q.o = t;
            }
          }
        }
        /* (3) above 230 T/H and with the BU-CMD gone (M.2013 = 0: HP bypass shut, M.0101): PIC-COBM A at 123 (its output tracked
           HIC-BM.MV − SI0201 while the boiler master was MANUAL: bumpless), HS-COAL A (M.2021 pulse puts its SV to REMOTE), then
           HIC-BM A: .MAN = 0 on every sheet (CLAUDE.md 10: the station does not go to AUTO by itself) */
        if (o.cmAuto != null && o.cobmA == null && h.MSF() > 230 && h.bit('ABC-001C', 'M.2013') < 0.5) {
          h.autoSv('ABC-001C', 'PIC-COBM', 123);
          h.rem('ABC-004A', 'HS-COAL');
          o.cobmA = t;
        }
        if (o.cobmA != null && (o.bmAuto == null || t >= o.bmAuto + 60) && t >= o.cobmA + 30 && !bmA && h.bit('ABC-001C', 'M.2013') < 0.5) {
          /* pressed again a minute later if the BU-CMD came back in between (the operator presses A once more) */
          for (const [S2, n] of AN.modeNets('HIC-BM')) S2.rt.ext[n] = 0;
          if (o.bmAuto == null) o.bmMsf = h.MSF();
          o.bmAuto = t;
        }
        /* (4) DCS CONTROL MODE ON is the drawing's: O.0178 = TPS 2 s of AND(I.0081, TON 2 s of (PIC-COBM and HIC-BM not MANUAL)) → TCS
           → I.0082; then EIC-TM A (M.2016 = 0: CCS, the TCS follows AO0359) */
        /* bumpless: only when the AUTO value of the station (SI0236 "AO0359 TO TCS": HIC-ULD through the HIC-MWRL rate limiter) has
           caught up with the TCS target (the limiter lags a ramping load by several MW; A before that took the TCS target from 71.3 to
           64.6 MW, the main steam flow under 220 T/H and the boiler master back to MANUAL by its BU-CMD) */
        if (o.tmAuto != null && o.uldA == null && S.rt.st[h.tmA.id].pk === 'B') o.tmAuto = null;
        if (
          o.bmAuto != null &&
          o.tmAuto == null &&
          bmA &&
          o.dcsOn != null &&
          h.bit('ABC-001C', 'M.2016') < 0.5 &&
          S.rt.st[h.tmA.id].pk === 'B' &&
          Math.abs(+h.v[h.lab(S, 'SI0236')] - h.U.tcsT) < 1
        ) {
          for (const [S2, n] of AN.modeNets('EIC-TM')) S2.rt.ext[n] = 0;
          o.tmAuto = t;
        }
        /* (5) HIC-ULD A, TARGET MW 150 (HIC-MWRL 3 MW/min, 33.PNG) */
        if (o.tmAuto != null && o.uldA == null && S.rt.st[h.tmA.id].pk === 'A' && t >= o.tmAuto + 30) {
          h.mode('HIC-ULD', 'LOC');
          o.SU.rt.ext[o.tgt] = 150;
          o.uldA = t;
        }
        /* O2 trim (ABC-002 AICFG112): forced MANUAL below 220 T/H (M.0102); 50 % by hand, A again above 220 T/H near its SV (as M2) */
        {
          const oq = o.S2.rt.st[o.o2.amt.id];
          if (oq.pk === 'B') {
            o.o2man = 1;
            if (o.o2.manNet != null) {
              const m = +o.S2.rt.ext[o.o2.manNet];
              if (isFinite(m)) o.S2.rt.ext[o.o2.manNet] = m + Math.max(-1, Math.min(1, 50 - m));
            }
            if (!oq.fman && h.bit('ABC-001C', 'M.0101') > 0.5 && Math.abs(+o.S2.rt.v[o.o2.q.pv] - +o.S2.rt.v[o.o2.q.sv]) < 1.5) {
              oq.al = o.o2.autoLeg;
              oq.fm = o.o2.autoLeg;
              for (const [S3, n] of AN.modeNets('AICFG112')) S3.rt.ext[n] = 0;
              o.o2auto = t;
            }
          }
        }
        /* furnace pressure: PICFG108 by hand (−15) while the drawing forces MANUAL below 14 % (M.0205); A at SV −15 above 16 % */
        if (o.fgA == null) {
          if (h.mv('ABC-008', 'PICFG108') >= 16 && h.bit('ABC-008', 'M.0205') < 0.5) {
            h.autoSv('ABC-008', 'PICFG108', -15);
            o.fgA = t;
          } else if (t % 60 === 0) {
            const fp = h.FP();
            if (fp < -30) o.fpMv = Math.max(5, o.fpMv - 1);
            else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
            h.man('ABC-008', 'PICFG108', o.fpMv);
          }
        }
        if (window.__tr && t % 30 === 0)
          window.__tr.push(
            [t, h.MW(), o.aim, h.U.tcsT, h.MSP(), h.MSF(), o.bm, +h.v[h.lab(S, 'HIC-BM.MV')], h.mv('ABC-001C', 'PIC-COBM'), h.val('ABC-004A', 'SI0141'), +S4.rt.v[o.cm.q.pv], h.mv('ABC-004A', 'FIC-CM'), h.mv('ABC-004A', 'FIC-CF'), h.coal(), h.PA(), h.SA(), h.O2(), h.FP(), h.FW(), h.lvl(), h.MST(), h.RHT(), h.RHP(), h.bit('ABC-004A', 'M.0130'), h.bit('ABC-001C', 'M.2013'), h.bit('ABC-001C', 'I.0082'), h.bit('ABC-001C', 'M.2016'), S.rt.st[h.bmA.id].pk === 'A' ? 1 : 0, S.rt.st[h.tmA.id].pk === 'A' ? 1 : 0, +o.SU.rt.v[h.lab(o.SU, 'SI0226')], h.U.Tb].map(x => +(+x).toFixed(2))
          );
      },
      done(h, o) {
        return o.p150 != null && o.t >= o.p150 + 900;
      },
      checks(h, o) {
        const S = h.S,
          S4 = o.S4,
          bm = S.rt.st[h.bmA.id].pk === 'A',
          tm = S.rt.st[h.tmA.id].pk === 'A',
          oq = o.S2.rt.st[o.o2.amt.id],
          svPk = (k, tg) => {
            const c = h.ctl(k, tg);
            return c && c.svSw ? h.sh(k).rt.st[c.svSw.id].pk : '?';
          },
          mins = (a, b) => (a != null && b != null ? f0((a - b) / 60) : '—'),
          fwc = h.ctl('ABC-010', 'FICFW1007');
        return [
          [
            o.cmAuto != null &&
              h.isAuto('ABC-004A', 'FIC-CM') &&
              h.bit('ABC-004A', 'M.0130') < 0.5 &&
              svPk('ABC-004A', 'FIC-CF') === 'A' &&
              svPk('ABC-007', 'FICFA1071') === 'A' &&
              svPk('ABC-007', 'FICFA1081') === 'A',
            'coal master FIC-CM R + A sa ' +
              mins(o.cmAuto, 0) +
              ' min: FIC-CF, FICFA1071, FICFA1081 REMOTE (M.0130 = ' +
              f0(h.bit('ABC-004A', 'M.0130')) +
              '); HS-COAL 33.1 % (COAL CALORIE CORR. 4150 kcal/kg, 11.png) → ' +
              (h.isAuto('ABC-004A', 'HS-COAL') ? 'A' : 'M') +
              ' ' +
              f1(h.mv('ABC-004A', 'HS-COAL')) +
              ' %; FIC-CM PV ' +
              f1(+S4.rt.v[o.cm.q.pv]) +
              ' / SV ' +
              f1(+S4.rt.v[o.cm.q.sv]) +
              ' T/H / MV ' +
              f1(h.mv('ABC-004A', 'FIC-CM')) +
              ' % (4.PNG: 89.2 / 89.1 / 74.4)'
          ],
          [
            o.bmAuto != null && o.bmMsf > 230 && bm && h.bit('ABC-001C', 'M.2013') < 0.5 && h.isAuto('ABC-001C', 'PIC-COBM'),
            'boiler master HIC-BM A sa ' +
              mins(o.bmAuto, 0) +
              ' min sa MSF ' +
              f0(o.bmMsf) +
              ' T/H (PR-OPE-5002: 230 T/H; BU-CMD M.2013 = ' +
              f0(h.bit('ABC-001C', 'M.2013')) +
              '); PIC-COBM A SV 123 (MV ' +
              f1(h.mv('ABC-001C', 'PIC-COBM')) +
              ' %); HIC-BM ' +
              f1(+h.v[h.lab(S, 'HIC-BM.MV')] || 0) +
              ' % (4.PNG 68.3)'
          ],
          [
            o.dcsOn != null && o.bmAuto != null && o.dcsOn >= o.bmAuto && o.dcsOn - o.bmAuto <= 20 && h.bit('ABC-001C', 'I.0082') > 0.5,
            'DCS CONTROL MODE ON: pulse O.0178 ng drawing (I.0081 AT HIC-BM at PIC-COBM hindi MANUAL, 2 s) → TCS → I.0082 = ' +
              f0(h.bit('ABC-001C', 'I.0082')) +
              (o.dcsOn != null && o.bmAuto != null ? ', ' + f0(o.dcsOn - o.bmAuto) + ' s pagkatapos ng HIC-BM A' : ' (wala pa)')
          ],
          [
            o.tmAuto != null && tm && h.bit('ABC-001C', 'M.2016') < 0.5,
            'turbine master EIC-TM A sa ' +
              mins(o.tmAuto, 0) +
              ' min (M.2016 = ' +
              f0(h.bit('ABC-001C', 'M.2016')) +
              '; CCS: AO0359 TO TCS = ' +
              f1(+h.v[h.lab(S, 'SI0236')]) +
              ' MW, TCS target ' +
              f1(h.U.tcsT) +
              ')'
          ],
          [
            o.uldA != null && o.p150 != null && o.p150 - o.uldA >= 15 * 60 && o.p150 - o.uldA <= 60 * 60,
            'HIC-ULD A TARGET 150 MW sa ' +
              mins(o.uldA, 0) +
              ' min → 149 MW pagkatapos ng ' +
              mins(o.p150, o.uldA) +
              ' min (HIC-MWRL 3 MW/min, 33.PNG; 45 → 150 MW lahat: ' +
              mins(o.p150, 0) +
              ' min)'
          ],
          [
            near(h.MW(), 150, 3) && near(h.MSF(), 474.1, 5) && near(h.MSP(), h.SV(), 3),
            '150 MW steady (15 min): MW ' + f1(h.MW()) + ' (4.PNG 148.8), MSF ' + f0(h.MSF()) + ' T/H (472.7), MSP ' + f1(h.MSP()) + ' sa SV ' + f1(h.SV()) + ' (122.9)'
          ],
          [near(h.coal(), 87.0, 10), 'coal ' + f1(h.coal()) + ' T/H (03.png / 11.png 87.0: 3 feeder × 29.0), FIC-CF ' + f0(h.mv('ABC-004A', 'FIC-CF')) + ' % (72.8)'],
          [
            near(h.MST(), 542, 5) && near(h.RHT(), 542, 5) && near(h.RHP(), 34.0, 5),
            'MST ' + f0(h.MST()) + ' / RHT ' + f0(h.RHT()) + ' °C / RHP ' + f1(h.RHP()) + ' kg/cm2 (4.PNG 540 / 541 / 33.6)'
          ],
          [
            !!(o.spr && o.spr.TICBR1130 && o.spr.TICBR1150 && o.spr.TICBR1130.r != null && o.spr.TICBR1150.r != null) &&
              h.isAuto('ABC-011', 'TICBR1130') &&
              h.isAuto('ABC-012', 'TICBR1150') &&
              h.isAuto('ABC-011', 'TICBR1140') &&
              h.isAuto('ABC-012', 'TICMS1004') &&
              svPk('ABC-011', 'TICBR1130') === 'A' &&
              svPk('ABC-012', 'TICBR1150') === 'A',
            'SH spray: TICBR1130 A sa ' +
              mins(o.spr && o.spr.TICBR1130 && o.spr.TICBR1130.a, 0) +
              ' min, R sa ' +
              mins(o.spr && o.spr.TICBR1130 && o.spr.TICBR1130.r, 0) +
              '; TICBR1150 A sa ' +
              mins(o.spr && o.spr.TICBR1150 && o.spr.TICBR1150.a, 0) +
              ' min, R sa ' +
              mins(o.spr && o.spr.TICBR1150 && o.spr.TICBR1150.r, 0) +
              ' (PR-OPE-5002 steam temp. controls AUTO > 60 %); TICBR1140 / TICMS1004 ' +
              (h.isAuto('ABC-011', 'TICBR1140') ? 'A' : 'M') +
              ' / ' +
              (h.isAuto('ABC-012', 'TICMS1004') ? 'A' : 'M') +
              '; MV ' +
              f0(h.mv('ABC-011', 'TICBR1130')) +
              ' / ' +
              f0(h.mv('ABC-012', 'TICBR1150')) +
              ' % (4.PNG 57.6 / 30.2)'
          ],
          [
            !!o.o2man && o.o2auto != null && oq.pk === 'A' && h.O2() >= 2.5 && h.O2() <= 6.5,
            'O2 trim AICFG112: na-force M sa ilalim ng 220 T/H (M.0102), 50 % ng operator, A ulit sa ' + mins(o.o2auto, 0) + ' min; O2 ' + f1(h.O2()) + ' % (03.png 4.3); PA ' + f0(h.PA()) + ' / SA ' + f0(h.SA()) + ' T/H sa REMOTE'
          ],
          [
            o.fgA != null && h.isAuto('ABC-008', 'PICFG108') && h.FP() > -55 && h.FP() < 25,
            'furnace pressure PICFG108 A sa ' + mins(o.fgA, 0) + ' min (MV ≥ 14 %, M.0205 = 0), ' + f0(h.FP()) + ' mmH2O (SV −15; 4.PNG −9)'
          ],
          [
            Math.abs(o.lvMax) < 150 &&
              Math.abs(o.lvMin) < 150 &&
              h.isAuto('ABC-010', 'FICFW1007') &&
              h.sh('ABC-010').rt.st[fwc.svSw.id].pk === 'A' &&
              h.bit('ABC-010', 'M.0228') < 0.5,
            'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm (±150), 3-element FICFW1007 R + A (FW ' + f0(h.FW()) + ' T/H), M.0228 = ' + f0(h.bit('ABC-010', 'M.0228'))
          ],
          [
            o.mspMin >= 113 && o.mspMax <= 133 && h.bit('ABC-001C', 'M.3200') < 0.5 && h.bit('ABC-001C', 'M.310D') < 0.5 && h.mv('ABC-050', 'PICMS1006') < 1,
            'MSP ' + f1(o.mspMin) + ' ~ ' + f1(o.mspMax) + ' kg/cm2 sa buong 45 → 150 MW (123 ± 10); walang trip (M.3200 = 0, LL M.310D = 0); HP bypass ' + f0(h.mv('ABC-050', 'PICMS1006')) + ' %'
          ]
        ];
      }
    },
    {
      id: 'load150',
      hot: true,
      chain: ['roll', 'up'],
      title: 'M4 · 45 → 150 MW: coal master REMOTE, boiler master AUTO, DCS control mode ON, CCS',
      how: 'Start hot, tapos ang hakbang 4 (roll → sync → 45 MW: isang summary row), tapos ang hakbang 5: HS-COAL M 33.1 % (COAL CALORIE CORR. 4150, 11.png); PA FLOW BIAS HIC-TADBS M 0 (ABC-002: ang −30 T/H ng 7.PNG ay trim sa 150 MW; sa minimum air ay pinuputol nito ang coal demand, LN40); FIC-CM M = FIC-CF; FIC-CF, FICFA1071, FICFA1081 R (REMOTE: hangin ayon sa air demand ng drawing, ABC-006, minimum 446 T/H); HIC-BM (M) inililipat hanggang SV ng FIC-CM = coal, tapos FIC-CM R + A (tinatanggap ng drawing: M.0130 = 0); TCS target 0.5 ~ 3 MW / min ayon sa MSP (3 sa ≥ 124, 1.5 sa ≥ 121, 0.5 sa ≥ 118, tigil sa ilalim), HIC-BM (M) dinadagdagan lang hanggang 123; SH spray: TICBR1130 / TICBR1150 A sa SV (394 / 418 °C) kapag 5 °C na lang ang layo ng PV, tapos inner R, tapos TICBR1140 (462) / TICMS1004 (541) A (cascade, 4.PNG; ang drawing ay nagfo-force manual sa outer habang hindi REMOTE ang inner); sa MSF > 230 T/H at wala na ang BU-CMD (M.2013 = 0): PIC-COBM A SV 123, HS-COAL A, HIC-BM A (.MAN = 0); ang drawing ang nagpapadala ng DCS CONTROL MODE ON (O.0178 → TCS → I.0082); EIC-TM A (M.2016 = 0); HIC-ULD A TARGET 150 (HIC-MWRL 3 MW/min); O2 trim 50 % → A sa itaas ng 220 T/H; PICFG108 A sa MV ≥ 16 %. Tigil 15 min pagkatapos ng 150 MW (~2.5 h plant time, ~3 min real).',
      want: 'Hakbang 4 11 / 11; coal master FIC-CM R + A (M.0130 = 0), HS-COAL A; HIC-BM A sa > 230 T/H, PIC-COBM A; I.0082 = 1 sa loob ng 20 s pagkatapos ng HIC-BM A (O.0178 ng drawing); EIC-TM A (M.2016 = 0); 150 MW sa 15 ~ 60 min mula HIC-ULD A; 150 MW: MW 150 ± 3 %, MSF 474 ± 5 %, MSP sa SV ± 3 %, coal 87 ± 10 %, MST / RHT 542 ± 5 %, RHP 34 ± 5 % (4.PNG / 03.png); SH spray R + A (MV ≈ 58 / 30 %); O2 trim A, O2 2.5 ~ 6.5 %; PICFG108 A; drum level ±150, 3-element; MSP 113 ~ 133 buong daan; walang trip; HP bypass sarado.',
      secs: 0,
      run() {},
      each() {},
      checks() {
        return [];
      }
    },
    {
      id: 'full',
      cold: true,
      chain: ['cold', 'coal', 'byp', 'roll', 'up'],
      title: 'M4 · Cold start-up (buo): purge → light-off → coal → pressure raise → roll → sync → 150 MW',
      how: 'Start cold, tapos sunod-sunod sa iisang planta ang 5 hakbang ng PR-OPE-5002 (ang bawat hakbang ay nagsisimula sa iniwan ng nauna, hindi sa canned state): 1 purge, light-off ng burner A / B / C / D, tubig 30 → 100 °C, drum 0 → 30 kg/cm2 (Fig 1 ≤ 110 °C/h); 2 coal batch sa bed 400 ~ 600 °C, feeder A / B / C tuluy-tuloy, retract ng burners sa > 700 °C (blow-off hawak ang 35 kg/cm2); 3 bypass servicing sa 50 ksc / 40 T/H, HP bypass SV +1 / min hanggang 123 (coal ang apoy: FIC-CF 1 % kada hakbang), LP bypass 7.6, RH blow-off sarado; 4 roll 120 rpm/min, sync, 4.5 MW, load up 45 MW, transfer, 3-element feedwater; 5 coal master REMOTE, boiler master AUTO sa 230 T/H, DCS control mode ON, EIC-TM A, HIC-ULD 150 MW. Compressed ang oras (Fig 2: 14 h; dito ~10 h plant time, ~12 min real).',
      want: 'Isang row bawat hakbang 1 ~ 4 (n / n ng sariling tseke, kasama ang oras), tapos ang 14 tseke ng hakbang 5 (150 MW tugma sa 4.PNG / 03.png). Lahat ✓ = PASADO ang buong cold start-up.',
      secs: 0,
      run() {},
      each() {},
      checks() {
        return [];
      }
    },
    {
      id: 'down',
      stage: true,
      title: 'M5 · Load down 150 → 30 MW: 1-element, start-up valve, SUB firing, coal out (PR-OPE-5003)',
      secs: 16200,
      run(h, o) {
        const L = AN.sheets.filter(s => s.S && !/ABC-000/.test(s.name));
        for (const s of L) {
          const z = s.S.blk.find(z => z.k === 'MAN' && (z.tag === 'HIC-ULD' || (z.txt || []).includes('HIC-ULD')));
          if (z) {
            o.SU = s.S;
            o.ubu = z;
            break;
          }
        }
        o.tgt = (o.SU.drv[o.ubu.i[o.ubu.svI]] || []).find(z => z.k === 'AMT').a;
        o.S2 = h.sh('ABC-002');
        o.o2 = h.ctl('ABC-002', 'AICFG112');
        o.aim = h.MW();
        o.hold = null;
        o.pP = null;
        o.lvMin = o.lvMax = h.lvl();
        o.mspMin = 1e9;
        o.mspMax = 0;
        o.t150 = o.t90 = o.t45 = o.t30 = o.h90 = o.h45 = o.e90 = o.e45 = null;
        o.bmMan = o.tmMan = o.e1 = o.e1Ok = o.suv = o.sub = o.feedStop = o.daAt = o.pb = null;
        o.feeds = 3;
        o.lastStop = -1e9;
        o.oil = 0;
        o.cmMv = null;
        o.airMv = null;
        o.fwMv = null;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
        o.ll = 0;
        o.o2man = 0;
      },
      each(h, o) {
        const t = o.t,
          S = h.S,
          U = h.U;
        if (t < 10) return;
        o.lvMin = Math.min(o.lvMin, h.lvl());
        o.lvMax = Math.max(o.lvMax, h.lvl());
        o.mspMin = Math.min(o.mspMin, h.MSP());
        o.mspMax = Math.max(o.mspMax, h.MSP());
        if (h.bit('ABC-001C', 'M.310D') > 0.5) o.ll = 1;
        const MW = h.MW(),
          MSF = h.MSF();
        if (o.t150 == null && MW < 149) o.t150 = t;
        if (o.t90 == null && MW <= 91) o.t90 = t;
        if (o.t45 == null && MW <= 46) o.t45 = t;
        if (o.t30 == null && MW <= 31) o.t30 = t;
        /* the 1-ELEMENT pushbutton (ABC-010 M.054F, TPS 2 s -> M.0221 -> FF M.0222 set): pressed for 2 s */
        if (o.pb != null && t >= o.pb + 2) {
          h.setx(null, 'M.054F', 0);
          o.pb = null;
        }
        if (o.e1 != null && o.e1Ok == null && t >= o.e1 + 30) o.e1Ok = h.bit('ABC-010', 'M.0222') > 0.5 ? 1 : 0;
        if (t % 10 !== 0) return;
        /* (1) load down by hand (PR-OPE-5003 "Reduce load (Manual Operation)"): 1.2 MW/min to 90 MW, hold 9 min (procedure 8 ~ 10);
           0.6 MW/min to 45, hold 9 min; 0.4 MW/min to 30. The target goes to HIC-ULD (CCS) while EIC-TM is AUTO; below 220 T/H the
           drawing forces EIC-TM MANUAL (M.2016): the operator's MW goes to the TCS through the station (AO0359); the TCS panel target too */
        const rate = o.aim > 90 ? 1.2 : o.aim > 45 ? 0.6 : 0.4;
        if (o.hold != null) {
          if (t >= o.hold + 540 && MW <= o.aim + 1) {
            if (o.aim === 90) o.e90 = t;
            else o.e45 = t;
            o.hold = null;
          }
        } else if (o.aim > 30) {
          let nx = o.aim - rate / 6;
          if (o.aim > 90 && nx <= 90) {
            nx = 90;
            o.hold = o.h90 = t;
          } else if (o.aim > 45 && o.aim <= 90 && nx <= 45) {
            nx = 45;
            o.hold = o.h45 = t;
          }
          o.aim = Math.max(30, nx);
        }
        const tmS = S.rt.st[h.tmA.id],
          tm = S.rt.st[h.htm.id],
          st = S.rt.st[h.bmA.id];
        if (tmS.pk === 'A') o.SU.rt.ext[o.tgt] = o.aim;
        else {
          if (o.tmMan == null) o.tmMan = t;
          tm.val = Math.max(0, Math.min(200, o.aim));
        }
        AN.turbine('loadup', o.aim);
        /* (2) boiler master MANUAL by its BU-CMD below 220 T/H (M.2013, CLAUDE.md 10): the firing by hand holds the pressure at the SV
           (PR-OPE-5003 "Maintain MS Pressure 123 ~ 126 ksc"), until the coal master is taken by hand for the SUB firing */
        const P = h.MSP(),
          sv = h.SV(),
          dP = o.pP == null ? 0 : P - o.pP;
        o.pP = P;
        if (st.pk === 'B') {
          if (o.bmMan == null) {
            o.bmMan = t;
            o.bmMsf = MSF;
          }
          if (o.sub == null) {
            const m = S.rt.st[h.hbm.id];
            m.val = Math.max(0, Math.min(100, m.val + Math.max(-1, Math.min(1, 0.0011 * (sv - P) - 0.2 * dP))));
          }
        }
        /* O2 trim AICFG112: forced MANUAL below 220 T/H (M.0102); the operator puts it at 50 % (neutral) */
        {
          const oq = o.S2.rt.st[o.o2.amt.id];
          if (oq.pk === 'B') {
            o.o2man = 1;
            if (o.o2.manNet != null) {
              const m = +o.S2.rt.ext[o.o2.manNet];
              if (isFinite(m)) o.S2.rt.ext[o.o2.manNet] = m + Math.max(-1, Math.min(1, 50 - m));
            }
          }
        }
        /* furnace pressure PICFG108: forced MANUAL by the drawing under 14 % (M.0205); -15 mmH2O by hand then */
        if (h.pk('ABC-008', 'PICFG108') === 'B') {
          if (o.fgMan == null) o.fgMan = t;
          if (t % 60 === 0) {
            const fp = h.FP();
            if (fp < -30) o.fpMv = Math.max(3, o.fpMv - 1);
            else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
            h.man('ABC-008', 'PICFG108', o.fpMv);
          }
        } else o.fpMv = h.mv('ABC-008', 'PICFG108');
        /* (3) PR-OPE-5003 "At approximately 72 MW or 230 t/h MSF, put level control to 1 element": the 1-ELEMENT pushbutton M.054F */
        if (o.e1 == null && MSF <= 230) {
          h.setx(null, 'M.054F', 1);
          o.pb = o.e1 = t;
          o.e1Msf = MSF;
        }
        /* (4) "At less than 120 t/h MSF, change level control from main to start-up then put to auto": FICFW1007 and LICBR1001A to
           MANUAL (ABC-010 M.0226: the start-up control LICBR1001B is allowed only while both are MANUAL), LICBR1001B A SV 0, the main
           valve shut 5 % a minute while the level is not falling */
        o.lowN = MSF < 120 ? (o.lowN || 0) + 1 : 0;
        const mainMv = x => {
          /* the main valve: FICFW1007.MV = LICBR1001A.MV while the FF M.0222 = 1 (single element), the station FICFW1007 otherwise: both
             stations in MANUAL are written, so the valve follows whichever the selector takes */
          h.man('ABC-010', 'FICFW1007', x);
          h.man('ABC-010', 'LICBR1001A', x);
        };
        if (o.suv == null && o.e1 != null && o.lowN >= 12) {
          /* the single-element PID swings the main valve 0 ~ 40 % at this load: taken by hand at about the steady opening (10 %) */
          o.fwMv = 10;
          mainMv(o.fwMv);
          o.suv = t;
          o.suvMsf = MSF;
        }
        if (o.suv != null && t === o.suv + 10) h.autoSv('ABC-010', 'LICBR1001B', 0);
        if (o.suv != null && t > o.suv + 10 && t % 30 === 0) {
          /* the main valve is shut 3 % a minute only while the start-up valve has taken the flow (LICBR1001B > 15 %, FW >= steam, level
             not low); opened again when the level falls (the start-up valve PID is slow: SV 0) */
          const lv = h.lvl();
          if (lv < -80) o.fwMv = Math.min(60, o.fwMv + 5);
          else if (lv < -40) o.fwMv = Math.min(60, o.fwMv + 2);
          else if (lv > 150) o.fwMv = 0;
          else if (lv > 60) o.fwMv = Math.max(0, o.fwMv - 5);
          else if (lv > 0 || (t % 60 === 0 && h.mv('ABC-010', 'LICBR1001B') > 15 && lv > -20 && h.FW() >= MSF - 5)) o.fwMv = Math.max(0, o.fwMv - 3);
          mainMv(o.fwMv);
        }
        /* (5) "At 750 C bed temperature: PAF / SAF damper to manual, SUB firing one by one, coal down to the minimum (4 t/h a feeder)":
           the bed of the model is the fuel / air share (unit.js), so the SUB is lit at 750 C or at 50 MW, whichever comes first under
           60 MW. Burners A / B first, C / D 3 min later; the coal master FIC-CM to MANUAL, coal down 1 % a minute while the pressure
           holds, the oil up / down 5 % a minute to hold the pressure */
        if (o.sub == null && MW < 60 && (U.Tb <= 750 || MW <= 50)) {
          o.sub = t;
          o.subTb = U.Tb;
          o.subMW = MW;
          o.airMv = { pa: h.mv('ABC-007', 'FICFA1071'), sa: h.mv('ABC-007', 'FICFA1081') };
          h.man('ABC-007', 'FICFA1071', o.airMv.pa);
          h.man('ABC-007', 'FICFA1081', Math.min(100, o.airMv.sa + 5));
          h.oilValve('M.3410', true);
          h.oilValve('M.3411', true);
          h.setx(null, 'M.3412', 1);
          h.setx(null, 'M.3413', 1);
          o.oil = 30;
          h.man('ABC-003A', 'FICDO1043A', o.oil);
          h.man('ABC-003B', 'FICDO1043B', o.oil);
          o.cmMv = h.mv('ABC-004A', 'FIC-CM');
          h.man('ABC-004A', 'FIC-CM', o.cmMv);
        }
        if (o.sub != null && t === o.sub + 180) {
          h.oilValve('M.3416', true);
          h.oilValve('M.3417', true);
          h.setx(null, 'M.3418', 1);
          h.setx(null, 'M.3419', 1);
          o.cd = 1;
        }
        const oilSet = x => {
          o.oil = Math.max(20, Math.min(100, x));
          h.man('ABC-003A', 'FICDO1043A', o.oil);
          h.man('ABC-003B', 'FICDO1043B', o.oil);
          if (o.cd) {
            h.man('ABC-003C', 'FICDO1043C', o.oil);
            h.man('ABC-003D', 'FICDO1043D', o.oil);
          }
        };
        if (o.sub != null && t % 30 === 0) {
          /* "Gradually increase diesel flow while reducing coal flow": the oil comes up first (5 % a minute to 40 % while the pressure
             is not above SV + 3), the coal goes down only while the pressure holds; the oil holds the pressure (every 30 s: 5 % when
             the error is above 5 kg/cm2, 2 % above 1 ~ 2) */
          const e = sv - P,
            d = o.p30 == null ? 0 : P - o.p30;
          o.p30 = P;
          if (o.feeds > 0 && o.oil < 40 && e >= -3) oilSet(o.oil + 5);
          else oilSet(o.oil + Math.max(-5, Math.min(5, 0.3 * e - 3 * d)));
        }
        if (o.sub != null && t % 60 === 0) {
          /* the coal master demand is the TOTAL coal: a stopped feeder's share goes to the others (FIC-CF), so only FIC-CM takes the
             coal down; 1 % a minute (2 above SV + 3) while the pressure holds, to the minimum 10 % */
          if (o.feeds > 0 && o.cmMv > 10 && P >= sv - 1) {
            o.cmMv = Math.max(10, o.cmMv - (P > sv + 3 ? 2 : 1));
            h.man('ABC-004A', 'FIC-CM', o.cmMv);
          }
          /* "Gradually reduce PAF damper opening until 20 %" once the feeders stop */
          if (o.feedStop != null && o.airMv.pa > 20) {
            o.airMv.pa = Math.max(20, o.airMv.pa - 2);
            h.man('ABC-007', 'FICFA1071', o.airMv.pa);
          }
          if (o.feedStop != null && h.O2() > 10 && o.airMv.sa > 15) {
            o.airMv.sa = Math.max(15, o.airMv.sa - 2);
            h.man('ABC-007', 'FICFA1081', o.airMv.sa);
          }
        }
        /* (6) "At 700 C bed temperature (or 40 MW): stop coal feeder one by one": A, B, C 5 min apart, once the coal demand is at the
           minimum (or the bed at 700 C / 40 MW), while the pressure holds. The last feeder takes the coal to 0: the oil is raised with
           it (12 T/H of coal = about 4.7 T/H of oil = 33 % of the four burners), then trimmed */
        if (o.sub != null && t >= o.sub + 300 && o.feeds > 0 && (U.Tb <= 700 || MW <= 40 || o.cmMv <= 10) && t - o.lastStop >= 300 && P >= sv - 2 && dP > -0.3 && o.oil >= 30) {
          if (o.feedStop == null) {
            o.feedStop = t;
            o.stopTb = U.Tb;
            o.stopMW = MW;
          }
          o.feeds--;
          h.setx(null, ['M.3400', 'M.3401', 'M.3402'][2 - o.feeds], 0);
          if (o.feeds === 0) oilSet(o.oil + 30);
          if (o.feeds === 0) {
            h.setx(null, 'M.3405', 0);
            o.coalOut = t;
          }
          o.lastStop = t;
        }
        /* (7) "At 40 MW: set D/A pressure control valve to 2.5 ksc" (PCVAS1030 = PICCD1104, ABC-056) */
        if (o.daAt == null && MW <= 40) {
          o.daAt = t;
          o.daOk = h.ctl('ABC-056', 'PICCD1104') ? h.autoSv('ABC-056', 'PICCD1104', 2.5) : false;
        }
        if (window.__tr && t % 30 === 0)
          window.__tr.push([t, MW, o.aim, h.U.tcsT, P, MSF, +S.rt.st[h.hbm.id].val, h.coal(), U.oilF, U.Tb, h.PA(), h.SA(), h.O2(), h.FP(), h.FW(), h.lvl(), h.mv('ABC-010', 'FICFW1007'), h.mv('ABC-010', 'LICBR1001B'), h.bit('ABC-010', 'M.0222'), h.MST(), h.RHT(), h.RHP(), st.pk === 'A' ? 1 : 0, tmS.pk === 'A' ? 1 : 0, h.bit('ABC-001C', 'I.0082'), o.cmMv == null ? -1 : o.cmMv, o.oil].map(x => +(+x).toFixed(2)));
      },
      done(h, o) {
        return o.t30 != null && (o.suv != null ? o.t >= o.suv + 300 : o.t >= o.t30 + 1200);
      },
      checks(h, o) {
        const U = h.U,
          S = h.S,
          mins = (a, b) => (a != null && b != null ? (b - a) / 60 : NaN),
          fm = x => (isFinite(x) ? f0(x) : '-'),
          d1 = mins(o.t150, o.t90),
          d2 = mins(o.e90, o.t45),
          d3 = mins(o.e45, o.t30),
          hd1 = mins(o.h90, o.e90),
          hd2 = mins(o.h45, o.e45),
          run = ['M.3400', 'M.3401', 'M.3402'].map(l => h.bit('ABC-005', l) > 0.5);
        return [
          [d1 >= 40 && d1 <= 65, '150 → 90 MW sa ' + fm(d1) + ' min (1.2 MW/min = 50 min)'],
          [hd1 >= 8, 'hold sa 90 MW ' + fm(hd1) + ' min (procedure 8 ~ 10)'],
          [d2 >= 60 && d2 <= 95, '90 → 45 MW sa ' + fm(d2) + ' min (0.6 MW/min = 75 min)'],
          [hd2 >= 8, 'hold sa 45 MW ' + fm(hd2) + ' min (8 ~ 10)'],
          [d3 >= 28 && d3 <= 55, '45 → 30 MW sa ' + fm(d3) + ' min (0.4 MW/min = 37.5 min); MW ngayon ' + f1(h.MW())],
          [
            o.mspMin >= 113 && o.mspMax <= 133 && !o.ll && h.bit('ABC-001C', 'M.3200') < 0.5,
            'MSP ' + f1(o.mspMin) + ' ~ ' + f1(o.mspMax) + ' kg/cm2 sa buong 150 → 30 MW (procedure 123 ~ 126; tseke 123 ± 10); walang trip (M.3200 = 0, LL M.310D = 0)'
          ],
          [
            o.bmMan != null && o.bmMsf > 195 && o.bmMsf < 245 && S.rt.st[h.bmA.id].pk === 'B' && h.bit('ABC-001C', 'M.2013') > 0.5 && o.tmMan != null && S.rt.st[h.tmA.id].pk === 'B',
            'boiler master HIC-BM MANUAL (BU-CMD M.2013) sa MSF ' + f0(o.bmMsf) + ' T/H (< 220, ' + f0(mins(0, o.bmMan)) + ' min); EIC-TM MANUAL (M.2016) sa ' + f0(mins(0, o.tmMan)) + ' min: pressure hawak ng operator'
          ],
          [
            o.e1 != null && o.e1Msf <= 232 && o.e1Ok === 1 && h.bit('ABC-010', 'M.0222') > 0.5 && h.bit('ABC-010', 'M.0224') < 0.5,
            '1-ELEMENT pushbutton M.054F sa MSF ' + f0(o.e1Msf) + ' T/H (' + f0(mins(0, o.e1)) + ' min): FF M.0222 = ' + f0(h.bit('ABC-010', 'M.0222')) + ' (LICBR1001A ang gumagalaw sa main valve, FICFW1007 tumutunton)'
          ],
          [
            o.suv != null && o.suvMsf < 120 && h.isAuto('ABC-010', 'LICBR1001B') && h.pk('ABC-010', 'FICFW1007') === 'B' && h.bit('ABC-010', 'M.0226') < 0.5,
            'start-up valve LICBR1001B A sa MSF ' + f0(o.suvMsf) + ' T/H (< 120); FICFW1007 M ' + f0(h.mv('ABC-010', 'FICFW1007')) + ' % (pasara), LICBR1001A M; M.0226 = ' + f0(h.bit('ABC-010', 'M.0226')) + '; FW ' + f0(h.FW()) + ' T/H'
          ],
          [Math.abs(o.lvMax) < 150 && Math.abs(o.lvMin) < 150, 'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm (±150)'],
          [
            o.sub != null && U.oilF > 0.5 && h.pv('ABC-003A', 'FICDO1043A') > 0.3 && h.pv('ABC-003B', 'FICDO1043B') > 0.3,
            'SUB A / B / C / D in service sa ' + f0(o.subMW) + ' MW, bed ' + f0(o.subTb) + ' °C (procedure 750): oil ' + f1(U.oilF) + ' T/H sa ' + f0(o.oil) + ' %; PAF / SAF M ' + f0(h.mv('ABC-007', 'FICFA1071')) + ' / ' + f0(h.mv('ABC-007', 'FICFA1081')) + ' %'
          ],
          [
            o.feeds === 0 && !run.some(Boolean) && h.coal() < 1,
            'coal feeders A / B / C pinahinto isa-isa mula ' + f0(o.stopMW) + ' MW, bed ' + f0(o.stopTb) + ' °C (procedure 700); coal ' + f1(h.coal()) + ' T/H; bed ngayon ' + f0(U.Tb) + ' °C'
          ],
          [
            !!o.o2man && h.O2() >= 3 && h.O2() <= 16,
            'O2 trim AICFG112 na-force M sa ilalim ng 220 T/H (M.0102), 50 % ng operator; O2 ' + f1(h.O2()) + ' % (PA ' + f0(h.PA()) + ' / SA ' + f0(h.SA()) + ' T/H)'
          ],
          [
            near(h.MW(), 30, 7) && h.bit('ABC-050', 'I.0931') > 0.5 && h.bit('ABC-001C', 'M.3200') < 0.5,
            'MW ' + f1(h.MW()) + ' (30 ± 2), generator nakakabit (I.0931 = 1), turbine hindi pa tripped; MST ' + f0(h.MST()) + ' / RHT ' + f0(h.RHT()) + ' °C, RHP ' + f1(h.RHP()) + '; D/A PICCD1104 ' + (o.daOk ? 'A SV 2.5' : 'walang station sa ABC-056')
          ]
        ];
      }
    },
    {
      id: 'trip',
      stage: true,
      title: 'M5 · Turbine trip sa 30 MW → bypass hanggang < 535 °C (PR-OPE-5003 / 5004, iisang bahagi)',
      secs: 9000,
      run(h, o) {
        o.P0 = h.MSP();
        o.Tb0 = h.U.Tb;
        o.tripAt = o.hpMan = o.cyc = o.purge = o.fansOff = o.bfpOff = o.lvMan = null;
        o.hpMax = 0;
        o.rhMin = 1e9;
        o.rhMax = 0;
        o.mspMax = 0;
        o.coolMax = 0;
        o.tsH = [];
        o.lvMin = o.lvMax = h.lvl();
        o.fpMin = 0;
        o.fpMax = 0;
        o.airMax = 0;
        o.oil = h.mv('ABC-003A', 'FICDO1043A') || 30;
        o.suvMv = h.mv('ABC-010', 'LICBR1001B');
        o.fwMv = h.mv('ABC-010', 'LICBR1001A');
        o.seen = {};
        o.hpSv = null;
        o.msfByp = 0;
        o.purgeMv = 0;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
      },
      each(h, o) {
        const t = o.t,
          U = h.U;
        h.M5 = o; /* the stages after this one (off: PR-OPE-5003, bu: PR-OPE-5004) carry on from here */
        if (t === 30) {
          /* PR-OPE-5003 "At 30 MW: turbine shutdown / turbine trip" (ABC-050 S2 I.0400 #1 Turbine trip FROM ARP). The DITL would MFT
             on a turbine trip; the procedure bypasses it ("bypass turbine trip alarm at MFT ... to maintain boiler operation"): no MFT */
          h.setx('ABC-050', 'I.0400', 1);
          o.tripAt = t;
        }
        if (o.tripAt == null) return;
        const MSF = h.MSF();
        o.hpMax = Math.max(o.hpMax, h.mv('ABC-050', 'PICMS1006'));
        o.mspMax = Math.max(o.mspMax, h.MSP());
        if (o.cyc == null) {
          o.lvMin = Math.min(o.lvMin, h.lvl());
          o.lvMax = Math.max(o.lvMax, h.lvl());
        }
        if (h.bit('ABC-050', 'M.0705') > 0.5) o.seen.bu = 1;
        if (h.bit('ABC-050', 'M.0124') > 0.5) o.seen.p = 1;
        if (t === o.tripAt + 60) {
          o.mw60 = h.MW();
          o.oil60 = U.oilF;
        }
        if (t === o.tripAt + 60) {
          /* "Reduce diesel flow" (cooling -1 C/min): the four burners to 20 %, C and D retracted 2 min later; the boiler on two
             burners at the minimum while the bypass takes the steam */
          o.oil = 20;
          for (const [k, tg] of [
            ['ABC-003A', 'FICDO1043A'],
            ['ABC-003B', 'FICDO1043B'],
            ['ABC-003C', 'FICDO1043C'],
            ['ABC-003D', 'FICDO1043D']
          ])
            h.man(k, tg, o.oil);
        }
        if (t === o.tripAt + 180) {
          h.oilValve('M.3416', false);
          h.oilValve('M.3417', false);
          h.setx(null, 'M.3418', 0);
          h.setx(null, 'M.3419', 0);
        }
        /* a hand station (HIC, MAN block): its value by hand, or read back */
        const hic = (k, tag, x) => {
          const T = h.sh(k),
            b = T && T.blk.find(b => b.k === 'MAN' && b.tag === tag);
          if (!b || !T.rt.st[b.id]) return false;
          if (x != null) {
            /* MAN first (.MAN = 1 on every sheet: the A / M switch of the station leaves the AUTO leg, plant.js MAN), then the value:
               the station value and its MV input from the HMI when the drawing has one (ABC-020 "HICHR1002A.MV") */
            if (AN.latchMode) AN.latchMode(tag, 'MAN');
            T.rt.st[b.id].val = x;
            for (const n of b.i || []) if (n >= 0 && T.ext.includes(n) && !(T.xlk && T.xlk[n]) && (AN.nm(T, n) || '').trim() === tag + '.MV') T.rt.ext[n] = x;
          }
          return +T.rt.st[b.id].val;
        };
        if (t === o.tripAt + 30) {
          /* "Put biasing damper to manual, RH = 10 % and MS = 90 %" (ABC-020 HICHR1002A / B, hand stations) */
          o.bias = hic('ABC-020', 'HICHR1002A', 10) !== false && hic('ABC-020', 'HICHR1002B', 90) !== false;
        }
        if (t === o.tripAt + 90) {
          /* the bypass holds the plant (procedure: "HP and LP bypass and RH BOV automatically open to maintain RHP SV = 7.6"): HP bypass
             A at the pressure of now (its SV down 1 kg/cm2 a minute within the cooling rate: "Shutdown to Cold" curve), MS blow-off A
             5 above it (shut while the bypass holds), LP bypass A 7.6. "Put HP bypass to manual, open to 12 %": the minimum opening,
             taken when the AUTO output falls under 12 % */
          o.hpSv = Math.ceil(h.MSP());
          h.autoSv('ABC-050', 'PICMS1006', o.hpSv);
          h.autoSv('ABC-013', 'PICMS1002', o.hpSv + 5);
          h.autoSv('ABC-052', 'PICHR1003', 7.6);
        }
        if (o.hpSv != null && o.cyc == null && o.hpMan == null && t > o.tripAt + 120 && h.mv('ABC-050', 'PICMS1006') < 12) {
          h.man('ABC-050', 'PICMS1006', 12);
          o.hpMan = t;
        }
        if (t > o.tripAt + 300 && o.cyc == null) {
          o.rhMin = Math.min(o.rhMin, h.RHP());
          o.rhMax = Math.max(o.rhMax, h.RHP());
          o.msfByp = Math.max(o.msfByp, MSF);
        }
        if (t % 10 !== 0) return;
        if (o.fansOff == null) {
          o.fpMin = Math.min(o.fpMin, h.FP());
          o.fpMax = Math.max(o.fpMax, h.FP());
        }
        /* furnace pressure by hand while the drawing forces PICFG108 MANUAL (M.0205) */
        if (h.pk('ABC-008', 'PICFG108') === 'B' && o.fansOff == null && t % 60 === 0) {
          const fp = h.FP();
          if (fp < -30) o.fpMv = Math.max(3, o.fpMv - 1);
          else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
        }
        /* RH blow-off PICHR1391 (ABC-054) by hand when the reheat pressure runs away from the LP bypass */
        if (o.cyc == null && t % 60 === 0) {
          const rp = h.RHP();
          o.rb = o.rb || 0;
          if (rp > 9) o.rb = Math.min(60, o.rb + 10);
          else if (rp < 8.2 && o.rb > 0) o.rb = Math.max(0, o.rb - 10);
          h.man('ABC-054', 'PICHR1391', o.rb);
        }
        /* the drum level by hand (every 30 s, target 0; +200 once the fans are off: "Before stopping BFP, set the drum level near HH"):
           the main valve (LICBR1001A / FICFW1007 stations in MANUAL, single element) until the steam is under 60 T/H, then "control by
           manual" on the start-up valve LICBR1001B M while the main valve shuts */
        if (o.lvMan == null && MSF < 60 && t >= o.tripAt + 120) {
          o.lvMan = t;
          o.suvMv = h.mv('ABC-010', 'LICBR1001B');
          h.man('ABC-010', 'LICBR1001B', o.suvMv);
        }
        if (o.bfpOff == null && t % 30 === 0) {
          const lv = h.lvl(),
            e = (o.fansOff != null || (o.cyc != null && MSF < 5) ? 200 : 0) - lv,
            step = Math.max(-4, Math.min(4, 0.02 * e - 0.1 * (o.lvP == null ? 0 : lv - o.lvP)));
          o.lvP = lv;
          if (o.lvMan == null) o.fwMv = Math.max(0, Math.min(60, o.fwMv + step));
          else {
            o.suvMv = Math.max(0, Math.min(100, o.suvMv + step));
            h.man('ABC-010', 'LICBR1001B', o.suvMv);
            o.fwMv = Math.max(0, o.fwMv + (e > 100 ? 0 : Math.min(-3, step))); /* the main valve shuts (at least 3 % per 30 s) unless the level is low */
          }
          h.man('ABC-010', 'FICFW1007', o.fwMv);
          h.man('ABC-010', 'LICBR1001A', o.fwMv);
        }
        if (t % 60 === 0) {
          /* cooling rate of the saturation temperature over 5 min (procedure: not more than 85 C/h) */
          const ts = h.tsat(U.Pd);
          o.tsH.push(ts);
          if (o.tsH.length > 6) o.tsH.shift();
          if (o.tsH.length === 6) o.coolMax = Math.max(o.coolMax, (o.tsH[0] - ts) * 12);
          if (o.hpSv != null && o.cyc == null && o.coolMax < 85 && o.hpSv > 20) {
            o.hpSv -= 1;
            if (o.hpMan == null) h.autoSv('ABC-050', 'PICMS1006', o.hpSv);
            h.autoSv('ABC-013', 'PICMS1002', o.hpSv + 5);
          }
        }
        /* "Maintain bypass operation until cyclone exit temperature < 535 C" (the gas of the model is the bed U.Tb): the end of the
           common part; PR-OPE-5003 (stage off) or PR-OPE-5004 (stage bu) continues */
        if (o.cyc == null && t >= o.tripAt + 600 && U.Tb < 535) o.cyc = t;
        if (window.__tr && t % 30 === 0) window.__tr.push([t, h.MW(), h.MSP(), MSF, U.Pd, h.RHP(), h.mv('ABC-050', 'PICMS1006'), h.mv('ABC-052', 'PICHR1003'), h.mv('ABC-013', 'PICMS1002'), o.rb || 0, U.oilF, U.Tb, h.PA(), h.SA(), h.FP(), h.FW(), h.lvl(), h.mv('ABC-010', 'LICBR1001B'), h.MST()].map(x => +(+x).toFixed(2)));
      },
      done(h, o) {
        return o.cyc != null && o.t >= o.cyc + 10;
      },
      checks(h, o) {
        const U = h.U,
          mins = (a, b) => (a != null && b != null ? f0((b - a) / 60) : '-'),
          hic = (k, tag) => {
            const T = h.sh(k),
              b = T && T.blk.find(b => b.k === 'MAN' && b.tag === tag);
            return b && T.rt.st[b.id] ? +T.rt.st[b.id].val : NaN;
          },
          /* a digital input by its address on the first sheet that has it (one address = one value, CLAUDE.md 1) */
          bitAny = l => {
            for (const s2 of AN.sheets) {
              if (!s2.S || /ABC-000/.test(s2.name)) continue;
              const n = s2.S.ext.find(e => String((s2.S.lab[e] && s2.S.lab[e].t) || '').trim() === l);
              if (n != null) return +s2.S.rt.ext[n];
            }
            return NaN;
          };
        return [
          [
            o.tripAt != null && h.bit('ABC-050', 'I.0932') > 0.5 && h.bit('ABC-050', 'I.0931') < 0.5 && h.bit('ABC-001C', 'M.3200') > 0.5 && o.mw60 < 1 && U.tb.st === 'off',
            'turbine trip sa 30 MW (I.0400): 52G bukas (I.0932 = ' + f0(h.bit('ABC-050', 'I.0932')) + ', I.0931 = ' + f0(h.bit('ABC-050', 'I.0931')) + '), STN101 M.3200 = ' + f0(h.bit('ABC-001C', 'M.3200')) + ', MW ' + f1(o.mw60) + ' pagkatapos ng 60 s, turbine ' + U.tb.st + ' ' + f0(U.rpm) + ' rpm'
          ],
          [
            o.mftAt == null && o.oil60 > 0.3,
            'boiler tumatakbo pa (procedure: turbine trip → MFT bypassed): oil ' + f1(o.oil60) + ' T/H 60 s pagkatapos ng trip, walang MFT'
          ],
          [
            h.S.rt.st[h.bmA.id].pk === 'B' && h.bit('ABC-001C', 'M.2013') > 0.5 && h.S.rt.st[h.tmA.id].pk === 'B' && h.bit('ABC-001C', 'M.2016') > 0.5 && h.bit('ABC-001C', 'I.0082') < 0.5,
            'HIC-BM / EIC-TM MANUAL (M.2013 / M.2016), DCS control mode OFF (I.0082 = ' + f0(h.bit('ABC-001C', 'I.0082')) + ')'
          ],
          [
            !!o.seen.bu && o.hpMax > 10 && o.hpSv != null,
            'HP bypass: BU-CMD M.0705 (bumukas hanggang ' + f0(o.hpMax) + ' %), tapos A sa pressure (SV pababa 1 / min hanggang ' + f0(o.hpSv) + ')' + (o.hpMan != null ? ', M 12 % (minimum ng procedure) sa ' + mins(o.tripAt, o.hpMan) + ' min' : '') + '; pulse M.0124 ' + (o.seen.p ? 'nakita' : 'wala')
          ],
          [
            o.rhMin >= 4 && o.rhMax <= 9.1,
            'reheat pressure ' + f1(o.rhMin) + ' ~ ' + f1(o.rhMax) + ' kg/cm2 sa bypass (LP bypass A SV 7.6: hawak hanggang may steam sa HP bypass, ≤ 9.1' + (o.rb ? ', RH blow-off hanggang ' + f0(o.rb) + ' %' : '') + ')'
          ],
          [
            o.mspMax <= 150.5 && o.coolMax <= 85 && o.msfByp > 20,
            'MSP max ' + f1(o.mspMax) + ' (range 150), ngayon ' + f1(h.MSP()) + ' (dati ' + f1(o.P0) + '); steam sa bypass hanggang ' + f0(o.msfByp) + ' T/H; saturation −' + f0(o.coolMax) + ' °C/h max (procedure ≤ 85)'
          ],
          [
            !!o.bias && Math.abs(hic('ABC-020', 'HICHR1002A') - 10) < 2 && Math.abs(hic('ABC-020', 'HICHR1002B') - 90) < 2,
            'biasing damper (ABC-020 HICHR1002A / B) by hand: RH ' + f0(hic('ABC-020', 'HICHR1002A')) + ' % / MS ' + f0(hic('ABC-020', 'HICHR1002B')) + ' % (procedure 10 / 90)'
          ],
          [
            o.lvMin > -254 && o.lvMax < 254,
            'drum level ' + f0(o.lvMin) + ' ~ ' + f0(o.lvMax) + ' mm habang nasa bypass (walang LL −254 / HH +254: walang MFT)'
          ],
          [
            o.cyc != null,
            'gas (bed) < 535 °C sa ' + mins(o.tripAt, o.cyc) + ' min pagkatapos ng trip: handa para sa SUB out at pagtigil ng bypass (bed ' + f0(U.Tb) + ' °C)'
          ]
        ];
      }
    },
    {
      id: 'off',
      stage: true,
      title: 'M5 · SUB out → purge → fans at BFP stop (PR-OPE-5003, dulo)',
      secs: 9000,
      run(h, o) {
        /* carried from the trip stage (h.M5): the hand values of the operator and the plant before the trip */
        const p = h.M5 || {};
        o.P0 = p.P0 != null ? p.P0 : h.MSP();
        o.Tb0 = p.Tb0 != null ? p.Tb0 : h.U.Tb;
        o.cycMin = p.cyc != null && p.tripAt != null ? (p.cyc - p.tripAt) / 60 : NaN;
        o.cyc = o.purge = o.fansOff = o.bfpOff = null;
        o.lvMan = p.lvMan != null ? 0 : null;
        o.suvMv = h.mv('ABC-010', 'LICBR1001B');
        o.fwMv = h.mv('ABC-010', 'LICBR1001A');
        o.lvP = null;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
        o.fpMin = 0;
        o.fpMax = 0;
        o.airMax = 0;
        o.purgeMv = 0;
      },
      each(h, o) {
        const t = o.t,
          U = h.U,
          MSF = h.MSF();
        if (o.cyc == null) {
          /* at < 535 C: stop SUB, stop bypass (MS blow-off close), purge, stop the draft system */
          o.cyc = t;
          for (const [k, tg] of [
            ['ABC-003A', 'FICDO1043A'],
            ['ABC-003B', 'FICDO1043B'],
            ['ABC-003C', 'FICDO1043C'],
            ['ABC-003D', 'FICDO1043D']
          ])
            h.man(k, tg, 0);
          for (const vc of ['M.3410', 'M.3411', 'M.3416', 'M.3417']) h.oilValve(vc, false);
          for (const ins of ['M.3412', 'M.3413', 'M.3418', 'M.3419']) h.setx(null, ins, 0);
          h.man('ABC-050', 'PICMS1006', 0);
          h.man('ABC-052', 'PICHR1003', 0);
          h.man('ABC-013', 'PICMS1002', 0);
          h.man('ABC-054', 'PICHR1391', 0);
          /* purge: PA / SA up 2.5 % every 30 s to 25 % (held while the furnace pressure is above +5), 5 min */
          o.purgeMv = Math.max(h.mv('ABC-007', 'FICFA1071'), h.mv('ABC-007', 'FICFA1081'));
          o.purge = t;
          return;
        }
        if (t % 10 !== 0) return;
        if (o.fansOff == null) {
          o.fpMin = Math.min(o.fpMin, h.FP());
          o.fpMax = Math.max(o.fpMax, h.FP());
        }
        /* furnace pressure by hand while the drawing forces PICFG108 MANUAL (M.0205) */
        if (h.pk('ABC-008', 'PICFG108') === 'B' && o.fansOff == null && t % 60 === 0) {
          const fp = h.FP();
          if (fp < -30) o.fpMv = Math.max(3, o.fpMv - 1);
          else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
        }
        /* the drum level by hand (every 30 s; +200 once the fans are off or the steam is gone: "Before stopping BFP, set the drum
           level near HH"): the start-up valve LICBR1001B M while the main valve shuts */
        if (o.lvMan == null && MSF < 60) {
          o.lvMan = t;
          o.suvMv = h.mv('ABC-010', 'LICBR1001B');
          h.man('ABC-010', 'LICBR1001B', o.suvMv);
        }
        if (o.bfpOff == null && t % 30 === 0) {
          const lv = h.lvl(),
            e = (o.fansOff != null || MSF < 5 ? 200 : 0) - lv,
            step = Math.max(-4, Math.min(4, 0.02 * e - 0.1 * (o.lvP == null ? 0 : lv - o.lvP)));
          o.lvP = lv;
          if (o.lvMan == null) o.fwMv = Math.max(0, Math.min(60, o.fwMv + step));
          else {
            o.suvMv = Math.max(0, Math.min(100, o.suvMv + step));
            h.man('ABC-010', 'LICBR1001B', o.suvMv);
            o.fwMv = Math.max(0, o.fwMv + (e > 100 ? 0 : Math.min(-3, step))); /* the main valve shuts (at least 3 % per 30 s) unless the level is low */
          }
          h.man('ABC-010', 'FICFW1007', o.fwMv);
          h.man('ABC-010', 'LICBR1001A', o.fwMv);
        }
        if (o.purge != null && o.fansOff == null) {
          o.airMax = Math.max(o.airMax, h.PA() + h.SA() + h.FA());
          if (t % 30 === 0 && o.purgeMv < 25 && h.FP() < 5) {
            o.purgeMv = Math.min(25, o.purgeMv + 2.5);
            h.man('ABC-007', 'FICFA1071', o.purgeMv);
            h.man('ABC-007', 'FICFA1081', o.purgeMv);
          }
        }
        if (o.purge != null && o.fansOff == null && t >= o.purge + 300) {
          /* "Stop draft system as fast as possible to minimize temperature drop: PAF & SAF dampers close, IDF damper 3 ~ 5 %" (PAF /
             SAF / IDF stopped, M.3302 / 3303 / 3304) */
          h.man('ABC-007', 'FICFA1071', 0);
          h.man('ABC-007', 'FICFA1081', 0);
          h.man('ABC-008', 'PICFG108', 4);
          for (const l of ['M.3302', 'M.3303', 'M.3304']) h.setx(null, l, 0);
          o.fansOff = t;
        }
        /* "Before stopping BFP, set the drum level near HH": BFP-A stopped (M.3343) at +150 (with the bypass shut the level rises on
           the minimum flow of the feedwater line) */
        if (o.bfpOff == null && (o.fansOff != null || MSF < 5) && (h.lvl() >= 150 || (o.fansOff != null && t >= o.fansOff + 1800))) {
          o.lvBfp = h.lvl();
          AN.blowdown(false); /* "blow down valve must be close" */
          h.man('ABC-010', 'LICBR1001B', 0);
          h.man('ABC-010', 'FICFW1007', 0);
          h.man('ABC-010', 'LICBR1001A', 0);
          h.setx(null, 'M.3343', 0);
          o.bfpOff = t;
        }
        if (window.__tr && t % 30 === 0) window.__tr.push([t, h.MW(), h.MSP(), MSF, U.Pd, h.RHP(), U.oilF, U.Tb, h.PA(), h.SA(), h.FP(), h.FW(), h.lvl(), h.mv('ABC-010', 'LICBR1001B'), h.MST()].map(x => +(+x).toFixed(2)));
      },
      done(h, o) {
        return o.bfpOff != null && o.t >= o.bfpOff + 300;
      },
      checks(h, o) {
        const U = h.U,
          bitAny = l => {
            for (const s2 of AN.sheets) {
              if (!s2.S || /ABC-000/.test(s2.name)) continue;
              const n = s2.S.ext.find(e => String((s2.S.lab[e] && s2.S.lab[e].t) || '').trim() === l);
              if (n != null) return +s2.S.rt.ext[n];
            }
            return NaN;
          };
        return [
          [
            o.cyc != null && U.oilF < 0.05 && bitAny('M.3412') < 0.5 && bitAny('M.3413') < 0.5 && h.mv('ABC-050', 'PICMS1006') < 1 && h.mv('ABC-052', 'PICHR1003') < 1 && h.mv('ABC-013', 'PICMS1002') < 1,
            'gas (bed) < 535 °C sa ' + f0(o.cycMin) + ' min pagkatapos ng trip: SUB out (oil ' + f1(U.oilF) + '), bypass at MS blow-off sarado'
          ],
          [
            o.purge != null && o.airMax > 150 && o.fansOff != null && bitAny('M.3302') < 0.5 && bitAny('M.3303') < 0.5 && bitAny('M.3304') < 0.5 && h.PA() + h.SA() < 20,
            'purge ' + f0(o.airMax) + ' T/H 5 min, tapos PAF / SAF / IDF pinahinto (M.3302 / 3303 / 3304 = 0): hangin ' + f0(h.PA() + h.SA()) + ' T/H'
          ],
          [o.fpMin > -60 && o.fpMax < 30, 'furnace pressure ' + f0(o.fpMin) + ' ~ ' + f0(o.fpMax) + ' mmH2O hanggang huminto ang fans'],
          [
            o.bfpOff != null && o.lvBfp >= 150 && o.lvBfp <= 260 && h.FW() < 1,
            'drum pinuno sa ' + f0(o.lvBfp) + ' mm (malapit sa HH +254) bago pinahinto ang BFP-A (M.3343): FW ' + f0(h.FW()) + ' T/H, level ngayon ' + f0(h.lvl())
          ],
          [
            h.MW() < 0.5 && h.coal() < 1 && U.oilF < 0.05 && U.Pd <= 150 && U.Tb < o.Tb0 - 100,
            'dulo: MW 0, coal 0, oil 0, drum ' + f1(U.Pd) + ' kg/cm2 nakakulong (mabagal na lamig, ~1.5 kg/cm2 / h), bed ' + f0(U.Tb) + ' °C (dati ' + f0(o.Tb0) + '): lumalamig; MST ' + f0(h.MST()) + ' °C'
          ]
        ];
      }
    },
    {
      /* 2.2.0-beta.22 (M5 part 2): PR-OPE-5004 SHUTDOWN TO BOTTLE-UP, from the bypass stage (< 535 C) to the cold boiler: bypass
         system closed, drain pots (DITL valves, not in the ABC: noted), hot reheat released on the RH blow-off, drum +200 and BFP
         stopped, deaerator 0 mm, SUB 25 % then OFF, oil pressure valves 100 %, the boiler cooled by the draft (Fig. 5) to ~ 0 kg/cm2,
         drains (DITL), biasing dampers 100 %, the draft stopped in order (SAF damper to 20 %, PAF damper to 0 and PAF stop, FAB stop,
         H/C < 16 % force manual, SAF stop, H/C 0 and IDF stop, DAMPER CONTROL, damper 5 % then 2.5 % steps) */
      id: 'bu',
      stage: true,
      sheets: ['ABC-028', 'ABC-029', 'ABC-031', 'ABC-055'],
      title: 'M5 · Shutdown to bottle-up (PR-OPE-5004): bypass sarado, drum +200, BFP stop, SUB off, lamig sa ~0 kg/cm2, draft stop sa ayos',
      secs: 60000,
      dt(h, o) {
        return o.cool != null && o.drain == null ? 2 : 0.5;
      },
      run(h, o) {
        const p = h.M5 || {};
        o.P0 = p.P0 != null ? p.P0 : h.MSP();
        o.Tb0 = p.Tb0 != null ? p.Tb0 : h.U.Tb;
        o.Pd0 = h.U.Pd;
        o.lvMan = p.lvMan != null ? 0 : null;
        o.suvMv = h.mv('ABC-010', 'LICBR1001B');
        o.fwMv = h.mv('ABC-010', 'LICBR1001A');
        o.lvP = null;
        o.fpMv = h.mv('ABC-008', 'PICFG108');
        o.fpMin = 0;
        o.fpMax = 0;
        o.ph = null;
        o.rhRel = o.rhClosed = o.bfpOff = o.daSv = o.subOff = o.oilP = o.cool = o.drain = o.bias100 = o.pafOff = o.fabOff = o.safOff = o.idfOff = o.hc16 = o.dmpSel = o.dmp = null;
        o.paMv = h.mv('ABC-007', 'FICFA1071');
        o.saMv = h.mv('ABC-007', 'FICFA1081');
        o.rhMax = 0;
      },
      each(h, o) {
        const t = o.t,
          U = h.U,
          hic = (k, tag, x) => {
            const T = h.sh(k),
              b = T && T.blk.find(b => b.k === 'MAN' && b.tag === tag);
            if (!b || !T.rt.st[b.id]) return false;
            if (x != null) {
              if (AN.latchMode) AN.latchMode(tag, 'MAN');
              T.rt.st[b.id].val = x;
              for (const n of b.i || []) if (n >= 0 && T.ext.includes(n) && !(T.xlk && T.xlk[n]) && (AN.nm(T, n) || '').trim() === tag + '.MV') T.rt.ext[n] = x;
            }
            return +T.rt.st[b.id].val;
          };
        if (t === 0.5) {
          /* "CLOSE MV-MS1391 (ABC-055 HICBR1391), PCV-MS1001 blow-off, HP bypass isolation": the bypass system closed; the LP bypass
             follows (no steam) */
          h.man('ABC-050', 'PICMS1006', 0);
          h.man('ABC-052', 'PICHR1003', 0);
          h.man('ABC-013', 'PICMS1002', 0);
          if (h.ctl('ABC-055', 'HICBR1391')) h.man('ABC-055', 'HICBR1391', 0);
          /* "OPEN hot reheat blow-off (MV-HR1391, ABC-054 PICHR1391) to release the hot reheat line pressure, then CLOSE" */
          h.man('ABC-054', 'PICHR1391', 50);
          o.rhRel = t;
          return;
        }
        if (t === 60) {
          /* "Fill the deaerator up to 0 mm" (ABC-031 LICCD1104 AUTO SV 0) */
          o.daSv = h.autoSv('ABC-031', 'LICCD1104', 0) ? t : null;
          /* "Start reducing SUB: FIC-DO1043 to 25 %" */
          for (const [k, tg] of [
            ['ABC-003A', 'FICDO1043A'],
            ['ABC-003B', 'FICDO1043B']
          ])
            h.man(k, tg, 25);
        }
        if (t === 300) {
          /* "Press OFF: igniter and oil gun retract" (oil 0, supply valves closed, BURNER IN SERVICE off) */
          for (const [k, tg] of [
            ['ABC-003A', 'FICDO1043A'],
            ['ABC-003B', 'FICDO1043B'],
            ['ABC-003C', 'FICDO1043C'],
            ['ABC-003D', 'FICDO1043D']
          ])
            h.man(k, tg, 0);
          for (const vc of ['M.3410', 'M.3411', 'M.3416', 'M.3417']) h.oilValve(vc, false);
          for (const ins of ['M.3412', 'M.3413', 'M.3418', 'M.3419']) h.setx(null, ins, 0);
          o.subOff = t;
        }
        if (t === 360) {
          /* "PCV-DO0002 (ABC-028 PICDO0005), PCV-DO1009 (ABC-029 PICDO1008) MANUAL, OPEN them and FCV-DO1012 (ABC-029 HICDO1012) to
             100 %; STOP the diesel pump" (the pump is a DITL motor: not in the ABC) */
          h.man('ABC-028', 'PICDO0005', 100);
          h.man('ABC-029', 'PICDO1008', 100);
          hic('ABC-029', 'HICDO1012', 100);
          o.oilP = t;
          o.cool = t;
        }
        if (o.rhRel != null && o.rhClosed == null && t > o.rhRel + 60 && h.RHP() < 1) {
          h.man('ABC-054', 'PICHR1391', 0);
          o.rhClosed = t;
        }
        if (t % 10 !== 0) return;
        if (window.__tr && t % 60 === 0) window.__tr.push([t, h.MSP(), U.Pd, h.RHP(), U.oilF, U.Tb, h.PA(), h.SA(), h.FP(), h.FW(), h.lvl(), h.MST(), h.mv('ABC-008', 'PICFG108'), h.mv('ABC-008', 'PICFG108A'), U.Tw, h.bit('ABC-008', 'M.0202'), h.bit('ABC-008', 'M.0205')].map(x => +(+x).toFixed(2)));
        o.rhMax = Math.max(o.rhMax, h.RHP());
        if (o.idfOff == null) {
          o.fpMin = Math.min(o.fpMin, h.FP());
          o.fpMax = Math.max(o.fpMax, h.FP());
        }
        /* furnace pressure by hand on the H/C: before the draft stop only when the drawing forces PICFG108 MANUAL (M.0205); during the
           draft stop the operator holds -15 mmH2O on the H/C (PR-OPE-5004 "maintaining the furnace pressure at -15 mmH2O"), every
           10 s, until the H/C is run down */
        if (o.idfOff == null && o.ph !== 'hc0' && (o.drain != null || (h.pk('ABC-008', 'PICFG108') === 'B' && t % 60 === 0))) {
          const fp = h.FP();
          if (o.drain != null) o.fpMv = Math.max(0, Math.min(80, o.fpMv + Math.max(-3, Math.min(3, 0.08 * (fp + 15)))));
          else if (fp < -30) o.fpMv = Math.max(3, o.fpMv - 1);
          else if (fp > 0) o.fpMv = Math.min(80, o.fpMv + 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
        }
        /* "Fill the steam drum to +200 mm" by hand (start-up valve LICBR1001B M, main valve shut), then "CLOSE the BFP outlet valve,
           STOP BFP" (M.3343) */
        if (o.lvMan == null) {
          o.lvMan = t;
          o.suvMv = h.mv('ABC-010', 'LICBR1001B');
          h.man('ABC-010', 'LICBR1001B', o.suvMv);
        }
        if (o.bfpOff == null && t % 30 === 0) {
          const lv = h.lvl(),
            e = 200 - lv,
            step = Math.max(-4, Math.min(4, 0.02 * e - 0.1 * (o.lvP == null ? 0 : lv - o.lvP)));
          o.lvP = lv;
          o.suvMv = Math.max(0, Math.min(100, o.suvMv + step));
          h.man('ABC-010', 'LICBR1001B', o.suvMv);
          o.fwMv = Math.max(0, o.fwMv + (e > 100 ? 0 : Math.min(-3, step)));
          h.man('ABC-010', 'FICFW1007', o.fwMv);
          h.man('ABC-010', 'LICBR1001A', o.fwMv);
          if (lv >= 200 && t >= 120) {
            o.lvBfp = lv;
            AN.blowdown(false); /* PR-OPE-5003: "blow down valve must be close" before the BFP stop */
            h.man('ABC-010', 'LICBR1001B', 0);
            h.man('ABC-010', 'FICFW1007', 0);
            h.man('ABC-010', 'LICBR1001A', 0);
            h.setx(null, 'M.3343', 0);
            o.bfpOff = t;
          }
        }
        /* cooling by the draft (Fig. 5) until "pressure is almost 0 kg/cm2": then the CR / HR header drains (DITL valves: noted; the
           drawing ABC-055 has the same mark, DRUM PRESSURE < 1.5 kg/cm2) */
        if (o.cool != null && o.drain == null && U.Pd < 1.5) {
          o.drain = t;
          o.coolH = (t - o.cool) / 3600;
          /* "Check RH and SH biasing damper opening should be 100 % before shut off the draft balance system" */
          o.bias100 = hic('ABC-020', 'HICHR1002A', 100) !== false && hic('ABC-020', 'HICHR1002B', 100) !== false ? t : null;
          o.fpMv = h.mv('ABC-008', 'PICFG108');
          o.ph = 'saf20';
        }
        if (o.drain == null || t % 30 !== 0) return;
        /* the draft stopped in the order of the procedure */
        if (o.ph === 'saf20') {
          /* "Reduce SAF inlet damper opening with 5 % decrement ... up to 20 % opening" (one step a minute) */
          if (t % 60 === 0) {
            o.saMv = Math.max(20, o.saMv - 5);
            h.man('ABC-007', 'FICFA1081', o.saMv);
            if (o.saMv <= 20) o.ph = 'paf0';
          }
        } else if (o.ph === 'paf0') {
          /* "Reduce the PAF inlet damper opening with 1 % decrement ... up to 0 %; initiate stop at PAF; initiate stop at FAB" */
          o.paMv = Math.max(0, o.paMv - 1);
          h.man('ABC-007', 'FICFA1071', o.paMv);
          if (o.paMv <= 0 && o.pafOff == null) {
            h.setx(null, 'M.3302', 0);
            o.pafOff = t;
          } else if (o.pafOff != null && t >= o.pafOff + 60) {
            h.setx(null, 'M.3308', 0);
            h.setx(null, 'M.3309', 0);
            o.fabOff = t;
            o.ph = 'saf0';
          }
        } else if (o.ph === 'saf0') {
          /* "At < 16 % scoop tube position the H/C goes to MANUAL (drawing: M.0206 < 14 % -> M.0205)"; "reduce SAF 5 % decrement ...
             initiate stop at SAF" */
          if (t % 60 === 0) {
            o.saMv = Math.max(0, o.saMv - 5);
            h.man('ABC-007', 'FICFA1081', o.saMv);
            if (o.saMv <= 0) {
              h.setx(null, 'M.3303', 0);
              o.safOff = t;
              o.ph = 'hc0';
            }
          }
        } else if (o.ph === 'hc0') {
          /* "Reduce H/C position with 1 % decrement ... when the scoop tube reaches 0 %: initiate stop at IDF" */
          if (h.FP() < 20) o.fpMv = Math.max(0, o.fpMv - 1);
          h.man('ABC-008', 'PICFG108', o.fpMv);
          if (o.fpMv < 14 && o.hc16 == null && h.bit('ABC-008', 'M.0205') > 0.5) o.hc16 = t;
          if (o.fpMv <= 0) {
            h.setx(null, 'M.3304', 0);
            o.idfOff = t;
            /* "Change furnace pressure control to DAMPER CONTROL" (ABC-008 DAMPER CONTROL SELECT push button -> M.0202 = 0),
               "OPEN DAMPER to 5 %" (PICFG108A M) */
            o.dmpSel = h.setx('ABC-008', 'M.0201', 1) ? t : null; /* memory list 101: M.0201 IDF DAMPER CONTROL SELECT (CRT) */
            o.dmpMv = 5;
            h.man('ABC-008', 'PICFG108A', o.dmpMv);
            o.ph = 'dmp';
          }
        } else if (o.ph === 'dmp') {
          if (o.dmpSel != null && t === o.dmpSel + 30) h.setx('ABC-008', 'M.0201', 0);
          /* "Reduce damper opening around 2.5 % until the furnace pressure is around -20 ~ 20 mmH2O" */
          if (t % 60 === 0 && o.dmp == null) {
            const fp = h.FP();
            if (fp > -20 && fp < 20) o.dmp = t;
            else o.dmpMv = Math.max(0, o.dmpMv - 2.5);
            h.man('ABC-008', 'PICFG108A', o.dmpMv);
          }
        }
      },
      done(h, o) {
        return o.dmp != null && o.t >= o.dmp + 120;
      },
      checks(h, o) {
        const U = h.U,
          hic = (k, tag) => {
            const T = h.sh(k),
              b = T && T.blk.find(b => b.k === 'MAN' && b.tag === tag);
            return b && T.rt.st[b.id] ? +T.rt.st[b.id].val : NaN;
          },
          bitAny = l => {
            for (const s2 of AN.sheets) {
              if (!s2.S || /ABC-000/.test(s2.name)) continue;
              const n = s2.S.ext.find(e => String((s2.S.lab[e] && s2.S.lab[e].t) || '').trim() === l);
              if (n != null) return +s2.S.rt.ext[n];
            }
            return NaN;
          },
          hm = x => (x != null ? f1(x / 3600) + ' h' : '-'),
          da = h.ctl('ABC-031', 'LICCD1104'),
          daSv = da && da.q && da.q.sv != null ? +h.sh('ABC-031').rt.v[da.q.sv] : NaN,
          mv1391 = h.ctl('ABC-055', 'HICBR1391') ? h.mv('ABC-055', 'HICBR1391') : 0;
        return [
          [
            h.mv('ABC-050', 'PICMS1006') < 1 && h.mv('ABC-052', 'PICHR1003') < 1 && h.mv('ABC-013', 'PICMS1002') < 1 && mv1391 < 1,
            'bypass system sarado sa < 535 °C: HP / LP bypass, MS blow-off PCV-MS1001, MV-MS1391 (ABC-055 HICBR1391 ' + f0(mv1391) + ' %); TG drain pots = DITL valve (wala sa ABC)'
          ],
          [
            o.rhRel != null && o.rhClosed != null && h.mv('ABC-054', 'PICHR1391') < 1 && h.RHP() < 1.5,
            'hot reheat pinakawalan sa RH blow-off MV-HR1391 (ABC-054 PICHR1391 50 % sa ' + hm(o.rhRel) + ', sarado sa ' + hm(o.rhClosed) + '): RHP ' + f1(h.RHP()) + ' kg/cm2'
          ],
          [
            o.bfpOff != null && o.lvBfp >= 190 && o.lvBfp <= 270 && bitAny('M.3343') < 0.5 && h.FW() < 1 && h.lvl() > -254 && h.lvl() < 400,
            'drum pinuno sa +' + f0(o.lvBfp) + ' mm (procedure +200), blowdown sarado, tapos BFP-A stop (M.3343 = 0) sa ' + hm(o.bfpOff) + ': FW ' + f0(h.FW()) + ' T/H, level sa dulo ' + f0(h.lvl()) + ' mm'
          ],
          [o.daSv != null && h.isAuto('ABC-031', 'LICCD1104') && Math.abs(daSv) < 1, 'deaerator (ABC-031 LICCD1104) A SV 0 mm: SV ngayon ' + f0(daSv)],
          [
            o.subOff != null && U.oilF < 0.05 && bitAny('M.3412') < 0.5 && bitAny('M.3413') < 0.5 && bitAny('M.3418') < 0.5 && bitAny('M.3419') < 0.5,
            'SUB: FIC-DO1043 25 % sa 1 min, OFF (retract) sa 5 min: oil ' + f1(U.oilF) + ' T/H, BURNER IN SERVICE 0'
          ],
          [
            o.oilP != null && h.mv('ABC-028', 'PICDO0005') >= 99 && h.mv('ABC-029', 'PICDO1008') >= 99 && hic('ABC-029', 'HICDO1012') >= 99,
            'oil system M 100 %: PCV-DO0002 (ABC-028 PICDO0005 ' + f0(h.mv('ABC-028', 'PICDO0005')) + '), PCV-DO1009 (ABC-029 PICDO1008 ' + f0(h.mv('ABC-029', 'PICDO1008')) + '), FCV-DO1012 (HICDO1012 ' + f0(hic('ABC-029', 'HICDO1012')) + '); diesel pump stop = DITL motor'
          ],
          [
            o.drain != null && o.coolH >= 2 && o.coolH <= 10 && U.Pd < 1.5,
            'lumamig sa draft (Fig. 5 cold shutdown: 95 → 0 kg/cm2 sa ~5 h): drum ' + f1(o.Pd0) + ' → ' + f1(U.Pd) + ' kg/cm2 sa ' + f1(o.coolH || 0) + ' h; CR / HR header drains sa < 1.5 kg/cm2 (ABC-055 marka; DITL valve); MST ' + f0(h.MST()) + ' °C, tubig ' + f0(U.Tw) + ' °C'
          ],
          [
            o.bias100 != null && o.pafOff != null && o.bias100 <= o.pafOff && Math.abs(hic('ABC-020', 'HICHR1002A') - 100) < 1 && Math.abs(hic('ABC-020', 'HICHR1002B') - 100) < 1,
            'biasing damper RH / SH 100 % (ABC-020 ' + f0(hic('ABC-020', 'HICHR1002A')) + ' / ' + f0(hic('ABC-020', 'HICHR1002B')) + ') bago patayin ang draft'
          ],
          [
            o.pafOff != null && o.fabOff != null && o.safOff != null && o.idfOff != null && o.pafOff < o.fabOff && o.fabOff < o.safOff && o.safOff < o.idfOff && bitAny('M.3302') < 0.5 && bitAny('M.3308') < 0.5 && bitAny('M.3303') < 0.5 && bitAny('M.3304') < 0.5,
            'draft stop sa ayos: SAF damper → 20 %, PAF damper → 0 at PAF stop (' + hm(o.pafOff) + '), FAB stop (' + hm(o.fabOff) + '), SAF stop (' + hm(o.safOff) + '), H/C → 0 at IDF stop (' + hm(o.idfOff) + '); M.3302 / 3308 / 3303 / 3304 = 0'
          ],
          [o.hc16 != null, 'H/C < 16 % (drawing ABC-008 M.0206 < 14 %): PICFG108 force MANUAL M.0205 = 1 (nakita sa ' + hm(o.hc16) + ')'],
          [o.fpMin > -60 && o.fpMax < 30, 'furnace pressure ' + f0(o.fpMin) + ' ~ ' + f0(o.fpMax) + ' mmH2O hanggang huminto ang IDF'],
          [
            o.dmpSel != null && h.bit('ABC-008', 'M.0202') < 0.5 && o.dmp != null && h.mv('ABC-008', 'PICFG108A') <= 5.1 && Math.abs(h.FP()) < 20,
            'DAMPER CONTROL SELECT (ABC-008: M.0202 hydraulic = ' + f0(h.bit('ABC-008', 'M.0202')) + '), damper PICFG108A 5 % tapos −2.5 % hanggang furnace −20 ~ 20: ' + f1(h.mv('ABC-008', 'PICFG108A')) + ' %, furnace ' + f0(h.FP()) + ' mmH2O'
          ],
          [
            h.MW() < 0.5 && h.coal() < 1 && U.oilF < 0.05 && U.Pd < 1.5 && U.Tb < 300 && h.PA() + h.SA() < 5,
            'dulo (bottle-up): MW 0, coal 0, oil 0, drum ' + f1(U.Pd) + ' kg/cm2, bed ' + f0(U.Tb) + ' °C (dati ' + f0(o.Tb0) + '), hangin ' + f0(h.PA() + h.SA()) + ' T/H, fans off'
          ]
        ];
      }
    },
    {
      id: 'shut1',
      live: true,
      chain: ['down'],
      title: 'M5 · Load down 150 → 30 MW (PR-OPE-5003 normal shutdown, unang bahagi)',
      how: 'Start at 150 MW (buong physics: bed, burners, trip). Operator ayon sa PR-OPE-5003: load down by hand 1.2 MW/min hanggang 90 (hold 9 min), 0.6 hanggang 45 (hold 9 min), 0.4 hanggang 30; MSP hawak 123 (sa ilalim ng 220 T/H: HIC-BM at EIC-TM M ng drawing, BU-CMD; firing by hand; O2 trim 50 %); sa 230 T/H pindot ng 1-ELEMENT (M.054F); sa < 120 T/H FICFW1007 at LICBR1001A M, LICBR1001B A SV 0, main valve pasara; sa bed 750 °C o 50 MW: PAF / SAF M, SUB A / B tapos C / D, coal master M pababa habang hawak ng oil ang pressure; sa bed 700 o 40 MW: feeder A / B / C pahinto isa-isa, PAF damper → 20 %; sa 40 MW D/A PICCD1104 A 2.5. ~3.5 h plant time, ~4 min real.',
      want: 'Oras ng bawat ramp at hold tugma sa procedure; MSP 123 ± 10 buong daan, walang trip; HIC-BM / EIC-TM M sa < 220 T/H; M.0222 = 1 (1-element) sa 230 T/H; LICBR1001B A sa < 120 T/H; drum ±150; SUB in service, coal 0 sa dulo; 30 MW, generator nakakabit.',
      secs: 0,
      run() {},
      each() {},
      checks() {
        return [];
      }
    },
    {
      id: 'shut',
      live: true,
      chain: ['down', 'trip', 'off'],
      title: 'M5 · Normal shutdown (buo): 150 → 30 MW → turbine trip → bypass → SUB out → purge → fans at BFP stop',
      how: 'Hakbang 1 (load down, isang summary row), tapos hakbang 2 sa iisang planta: turbine trip sa 30 MW (I.0400; MFT bypassed ayon sa procedure); biasing damper M RH 10 / MS 90; LP bypass A 7.6, HP bypass M 12 %, MS blow-off A pababa 1 kg/cm2 kada minuto habang ≤ 85 °C/h; LICBR1001B M sa < 60 T/H; kapag < 535 °C ang gas (bed ng model): SUB out, bypass at blow-off sarado, purge 5 min, PAF / SAF / IDF stop (IDF damper 4 %), drum pinuno sa +200 bago BFP stop. ~5 h plant time, ~6 min real.',
      want: 'Hakbang 1 pasado; trip: 52G bukas, MW 0, M.3200, HIC-BM / EIC-TM M, I.0082 = 0; HP bypass BU-CMD tapos 12 %; RHP 7.6 ± 1.5; MSP bumababa ≤ 85 °C/h; SUB out at bypass sarado sa < 535 °C; purge > 150 T/H; fans at BFP stop; drum ±150 tapos +200; boiler lumalamig.',
      secs: 0,
      run() {},
      each() {},
      checks() {
        return [];
      }
    },
    {
      id: 'bottle',
      live: true,
      chain: ['down', 'trip', 'bu'],
      title: 'M5 · Shutdown to bottle-up (buo): 150 → 30 MW → turbine trip → bypass → PR-OPE-5004 hanggang malamig na boiler',
      how: 'Hakbang 1 (load down) at 2 (trip at bypass hanggang < 535 °C) bilang summary row, tapos PR-OPE-5004 sa iisang planta: bypass system sarado (HP / LP bypass, MS blow-off, MV-MS1391); hot reheat pinakawalan sa RH blow-off; drum pinuno sa +200 tapos BFP stop; deaerator A SV 0; SUB 25 % tapos OFF; PCV-DO0002 / PCV-DO1009 / FCV-DO1012 M 100 %; lumalamig sa draft (Fig. 5, ~5 h) hanggang < 1.5 kg/cm2; biasing damper 100 %; draft stop sa ayos: SAF → 20 %, PAF → 0 + stop, FAB stop, H/C < 16 % force manual, SAF stop, H/C → 0 + IDF stop, DAMPER CONTROL 5 % → −2.5 % hanggang furnace ±20. ~9 h plant time, ~5 min real.',
      want: 'Hakbang 1 at 2 pasado; bypass sarado; RHP < 1.5; drum +200 at BFP off; SUB off, oil valves 100 %; drum pressure → < 1.5 kg/cm2 sa 2 ~ 10 h; biasing 100 / 100; PAF → FAB → SAF → IDF stop, M.0205 sa < 14 %; furnace −60 ~ +30; M.0202 = 0, damper ≤ 5 %; dulo malamig na boiler.',
      secs: 0,
      run() {},
      each() {},
      checks() {
        return [];
      }
    },
    {
      id: 'load',
      title: 'M2 · Load 150 → 60 → 150 MW',
      how: 'Start at 150 MW. HIC-ULD TARGET MW 60 (3 MW/min). Sa ilalim ng 220 T/H: M ang boiler master (BU-CMD), ang operator ang humahawak ng pressure at naglalagay ng O2 trim sa 50 %. Pabalik: A sa HIC-BM at EIC-TM sa itaas ng 230 T/H, TARGET 150.',
      want: '60 MW: MW 60, MSF 204, coal 42, MSP sa SV, MST 517, RHT 499, RHP 15.0 (±5 %, 02.png); 150 MW: MW 150, MSF 474, MST / RHT 542, RHP 34 (4.PNG); walang trip. ~3 min.',
      secs: 8700,
      run(h, o) {
        const L = AN.sheets.filter(s => s.S && !/ABC-000/.test(s.name));
        let SU, bu;
        for (const s of L) {
          const z = s.S.blk.find(z => z.k === 'MAN' && (z.tag === 'HIC-ULD' || (z.txt || []).includes('HIC-ULD')));
          if (z) {
            SU = s.S;
            bu = z;
            break;
          }
        }
        o.SU = SU;
        o.tgt = (SU.drv[bu.i[bu.svI]] || []).find(z => z.k === 'AMT').a;
        o.S2 = h.sh('ABC-002');
        o.o2 = h.ctl('ABC-002', 'AICFG112');
        o.minP = 1e9;
        o.maxL = 0;
        o.ll = 0;
        o.pP = null;
      },
      each(h, o) {
        const S = h.S,
          v = h.v,
          U = h.U,
          t = o.t;
        if (t === 300) {
          o.a = { MW: h.MW(), MSF: h.MSF(), MSP: h.MSP(), SV: h.SV(), MST: h.MST(), RHT: h.RHT(), RHP: h.RHP() };
          o.SU.rt.ext[o.tgt] = 60;
        }
        if (t === 3300)
          o.c = {
            MW: h.MW(),
            MSF: h.MSF(),
            MSP: h.MSP(),
            SV: h.SV(),
            coal: h.coal(),
            bm: S.rt.st[h.bmA.id].pk,
            MST: h.MST(),
            RHT: h.RHT(),
            RHP: h.RHP(),
            O2: h.O2()
          };
        if (t === 3300) o.up = 1;
        if (t % 10 !== 0) return;
        const st = S.rt.st[h.bmA.id],
          P = h.MSP(),
          sv = h.SV(),
          dP = o.pP == null ? 0 : P - o.pP;
        o.pP = P;
        o.minP = Math.min(o.minP, P);
        o.maxL = Math.max(o.maxL, Math.abs(h.lvl()));
        if (+v[h.lab(S, 'M.310D')] > 0.5) o.ll = 1;
        const tmS = S.rt.st[h.tmA.id],
          tm = S.rt.st[h.htm.id];
        if (st.pk === 'B') {
          o.man = 1;
          const m = S.rt.st[h.hbm.id];
          if (o.up) {
            m.val = Math.min(100, m.val + 0.05);
            if (tmS.pk === 'B')
              tm.val = Math.max(0, Math.min(200, tm.val + Math.max(-0.2, Math.min(0.2, 0.1 * (P - sv)))));
          } else {
            m.val = Math.max(0, Math.min(100, m.val + Math.max(-1, Math.min(1, 0.0011 * (sv - P) - 0.2 * dP))));
            if (tmS.pk === 'B') tm.val = Math.max(60, tm.val - 0.2);
          }
        }
        if (o.up && st.pk === 'B' && U.ms > 230 && +v[h.lab(S, 'M.2013')] < 0.5) {
          o.bmA = (o.bmA || 0) + 1;
          for (const [S2, n] of AN.modeNets('HIC-BM')) S2.rt.ext[n] = 0;
        }
        if (o.up && st.pk === 'A' && tmS.pk === 'B' && +v[h.lab(S, 'M.2016')] < 0.5)
          for (const [S2, n] of AN.modeNets('EIC-TM')) S2.rt.ext[n] = 0;
        const oq = o.S2.rt.st[o.o2.amt.id];
        if (oq.pk === 'B') {
          o.o2man = 1;
          if (o.o2.manNet != null) {
            const m = +o.S2.rt.ext[o.o2.manNet];
            if (isFinite(m)) o.S2.rt.ext[o.o2.manNet] = m + Math.max(-1, Math.min(1, 50 - m));
          }
          if (
            !oq.fman &&
            +v[h.lab(S, 'M.0101')] > 0.5 &&
            Math.abs(+o.S2.rt.v[o.o2.q.pv] - +o.S2.rt.v[o.o2.q.sv]) < 1.5
          ) {
            oq.al = o.o2.autoLeg;
            oq.fm = o.o2.autoLeg;
            for (const [S3, n] of AN.modeNets('AICFG112')) S3.rt.ext[n] = 0;
            o.o2auto = 1;
          }
        }
        if (o.up && o.man && st.pk === 'A' && tmS.pk === 'A') o.auto = 1;
        if (o.up && o.man && !o.bmA && st.pk === 'A') o.selfAuto = 1;
        if (o.auto && st.pk === 'A' && tmS.pk === 'A') o.SU.rt.ext[o.tgt] = 150;
      },
      checks(h, o) {
        const a = o.a || {},
          c = o.c || {},
          d = {
            MW: h.MW(),
            MSF: h.MSF(),
            MSP: h.MSP(),
            SV: h.SV(),
            bm: h.S.rt.st[h.bmA.id].pk,
            MST: h.MST(),
            RHT: h.RHT(),
            RHP: h.RHP(),
            O2: h.O2()
          };
        const oq = o.S2.rt.st[o.o2.amt.id];
        return [
          [
            near(a.MW, 150, 3) && near(a.MSF, 474.1, 5) && near(a.MSP, a.SV, 5),
            '150 MW steady (5 min): MW ' + f1(a.MW) + ', MSF ' + f0(a.MSF) + ', MSP ' + f1(a.MSP)
          ],
          [near(c.MW, 60.3, 5), '60 MW: MW ' + f1(c.MW) + ' (02.png 60.3)'],
          [near(c.MSF, 203.7, 5), '60 MW: MSF ' + f0(c.MSF) + ' T/H (02.png 203.7)'],
          [near(c.coal, 41.8, 5), '60 MW: coal ' + f1(c.coal) + ' T/H (02.png 41.8)'],
          [near(c.MSP, c.SV, 5), '60 MW: MSP ' + f1(c.MSP) + ' sa SV ' + f1(c.SV)],
          [c.bm === 'B', '60 MW: boiler master HIC-BM MANUAL (MSF < 220 T/H, M.2013)'],
          [
            near(c.MST, 517, 5) && near(c.RHT, 499, 5),
            '60 MW: MST ' + f0(c.MST) + ' / RHT ' + f0(c.RHT) + ' C (02.png 517 / 499)'
          ],
          [near(c.RHP, 15.0, 5), '60 MW: hot reheat pressure ' + f1(c.RHP) + ' (02.png 15.0)'],
          [c.O2 >= 5 && c.O2 <= 12, '60 MW: O2 ' + f1(c.O2) + ' % (boiler manual Fig 7: 4.6 ~ 8.8)'],
          [
            near(d.MW, 150, 3) && near(d.MSF, 474.1, 5) && near(d.MSP, d.SV, 5),
            'balik 150 MW: MW ' + f1(d.MW) + ', MSF ' + f0(d.MSF) + ', MSP ' + f1(d.MSP)
          ],
          [
            d.bm === 'A' && !!o.bmA && !o.selfAuto,
            'boiler master: nanatiling M hanggang pinindot ang A sa itaas ng 230 T/H (BU-CMD latch)'
          ],
          [
            !!o.o2man && !!o.o2auto && oq.pk === 'A',
            'O2 trim AICFG112: na-force M sa load down (M.0103), operator 50 % → A ulit sa 150 MW'
          ],
          [
            near(d.MST, 542, 5) && near(d.RHT, 542, 5) && near(d.RHP, 34.0, 5),
            'balik 150 MW: MST ' +
              f0(d.MST) +
              ' / RHT ' +
              f0(d.RHT) +
              ' / RHP ' +
              f1(d.RHP) +
              ' (4.PNG 542 / 542 / 34.0)'
          ],
          [
            o.maxL <= 100 && !o.ll,
            'walang trip: drum level hanggang ±' +
              f0(o.maxL) +
              ' mm (limit 100), MSP pinakamababa ' +
              f1(o.minP) +
              ' (LL 72.9)'
          ]
        ];
      }
    },
    {
      id: 'tt',
      title: 'M3 · Turbine trip',
      how: 'ABC-050 input S2 I.0400 (#1 Turbine trip FROM ARP) = 1. Ang DITL: TURBINE TRIP = MFT first out (memory list STN104), kaya MFT din (forced).',
      want: 'M.3200 sa ABC-001C / 010 (station wiring); HIC-BM at EIC-TM M; HP / LP bypass at blow-off bumukas; MW 0 sa 60 s; MSP ≤ 150 tapos bumababa; coal 0.',
      secs: 360,
      run(h, o) {
        o.max = 0;
        o.hpb = 0;
        o.lpb = 0;
        o.blo = 0;
        o.m2001 = 0;
        o.seen = {};
      },
      each(h, o) {
        if (o.t === 60) {
          h.setx('ABC-050', 'I.0400', 1);
          h.mft(o);
          o.P0 = h.MSP();
        }
        if (o.t <= 60) return;
        o.max = Math.max(o.max, h.MSP());
        o.hpb = Math.max(o.hpb, h.mv('ABC-050', 'PICMS1006'));
        o.lpb = Math.max(o.lpb, h.mv('ABC-052', 'PICHR1003'));
        o.blo = Math.max(o.blo, h.mv('ABC-013', 'PICMS1002'));
        if (h.bit('ABC-050', 'M.0124') > 0.5) o.seen.p = 1;
        if (h.bit('ABC-050', 'M.0705') > 0.5) o.seen.bu = 1;
        if (o.t <= 120 && h.bit('ABC-001C', 'M.2001') > 0.5) o.m2001++;
        if (o.t === 120) {
          o.mw60 = h.MW();
          o.msf60 = h.MSF();
        }
      },
      checks(h, o) {
        return [
          [
            h.bit('ABC-001C', 'M.3200') > 0.5 && h.bit('ABC-010', 'M.3200') > 0.5,
            'station wiring: STN101 M.3200 T/B TRIP (ABC-001C, ABC-010) ← STN102 I.0400'
          ],
          [
            h.S.rt.st[h.bmA.id].pk === 'B' && h.bit('ABC-001C', 'M.2013') > 0.5,
            'boiler master HIC-BM MANUAL (BU-CMD M.2013)'
          ],
          [
            h.bit('ABC-001C', 'M.2016') > 0.5 && h.S.rt.st[h.tmA.id].pk === 'B',
            'turbine master EIC-TM MANUAL (M.2016)'
          ],
          [
            !!o.seen.p && !!o.seen.bu,
            'ABC-050 M.0124 pulse (TURBINE TRIP / HOUSE LOAD / 52G OPEN) at M.0705 HP bypass BU-CMD'
          ],
          [h.bit('ABC-010', 'M.022B') > 0.5, 'ABC-010 M.022B: FW demand = LAG ng steam flow'],
          [o.mw60 < 5, 'MW ' + f1(o.mw60) + ' pagkatapos ng 60 s (sarado ang turbine valves)'],
          [
            o.msf60 > 46 && o.m2001 === 0,
            'steam ' + f0(o.msf60) + ' T/H sa bypass pagkatapos ng 60 s; M.2001 (< 46 T/H) hindi nag-1'
          ],
          [
            o.hpb > 20 && o.lpb > 10 && o.blo > 50,
            'HP bypass ' + f0(o.hpb) + ' %, LP bypass ' + f0(o.lpb) + ' %, blow-off ' + f0(o.blo) + ' % bumukas'
          ],
          [
            o.max <= 150.5 && h.MSP() < o.max - 10,
            'MSP max ' + f1(o.max) + ' (range 150), ngayon ' + f1(h.MSP()) + ' (dati ' + f1(o.P0) + '): bumababa'
          ],
          [h.coal() < 1, 'coal ' + f1(h.coal()) + ' T/H pagkatapos ng MFT']
        ];
      }
    },
    {
      id: 'mft',
      title: 'M3 · MFT (master fuel trip)',
      how: 'I.000F MFT FROM IRP = 1 (bawat station), M.0341 MFT TPs pulse, coal feeders M.3400 ~ M.3402 stopped.',
      want: 'coal 0 sa 10 s; SH spray sarado (M.0230 / M.0240); PA / SA master M (M.0098); O2 21 %; MST bumababa; MSP bumababa hanggang LOW LOW 72.9 (M.310D → DITL-40).',
      secs: 460,
      run(h, o) {},
      each(h, o) {
        if (o.t === 60) {
          h.mft(o);
          o.P0 = h.MSP();
          o.F0 = h.coal();
        }
        if (o.t === 70) o.c10 = h.coal();
      },
      checks(h, o) {
        return [
          [o.c10 < 1, 'coal ' + f1(o.c10) + ' T/H 10 s pagkatapos ng MFT (dati ' + f1(o.F0) + ')'],
          [
            h.mv('ABC-012', 'TICBR1150') < 1 && h.mv('ABC-011', 'TICBR1130') < 1,
            'SH spray sarado: TICBR1130 ' +
              f1(h.mv('ABC-011', 'TICBR1130')) +
              ' %, TICBR1150 ' +
              f1(h.mv('ABC-012', 'TICBR1150')) +
              ' % (M.0230 / M.0240)'
          ],
          [
            h.pk('ABC-007', 'FICFA1071') === 'B' && h.pk('ABC-007', 'FICFA1081') === 'B',
            'PA / SA master MANUAL (M.0098 → M.0180 / M.0190)'
          ],
          [h.O2() > 19, 'O2 ' + f1(h.O2()) + ' % (walang apoy, tumatakbo ang fans)'],
          [h.MST() < 500, 'MST ' + f0(h.MST()) + ' C pagkatapos ng 400 s na walang apoy'],
          [
            h.MSP() < 72.9 && h.bit('ABC-001C', 'M.310D') > 0.5,
            'MSP ' + f1(h.MSP()) + ' (dati ' + f1(o.P0) + '): MAIN STEAM PRESSURE LOW LOW M.310D → DITL-40'
          ],
          [
            h.S.rt.st[h.bmA.id].pk === 'B' && h.S.rt.st[h.tmA.id].pk === 'B',
            'boiler at turbine master MANUAL (MSF < 220 T/H, M.0101)'
          ]
        ];
      }
    },
    {
      id: 'bfwp',
      title: 'M3 · BFWP trip (walang feedwater pump)',
      how: 'ABC-010 M.3343 BFWP-A RUNNING = 0 (ang B ay standby na). Drum level L.L. → DITL MFT (forced).',
      want: 'FW 0 sa 3 s; FICFW1007 force manual M.0228; HP bypass BU-CMD sa 15 s (M.0702 / M.0705); drum level −254 mm (M.0170 / M.0172) sa ~30 s; coal 0.',
      secs: 210,
      run(h, o) {},
      each(h, o) {
        if (o.t === 60) {
          o.b0 = h.bit('ABC-010', 'M.3344');
          h.setx(null, 'M.3343', 0);
        }
        if (o.t === 63) o.fw3 = h.FW();
        if (o.t > 60 && o.llAt == null && h.bit('ABC-010', 'M.0170') > 0.5 && h.bit('ABC-010', 'M.0172') > 0.5) {
          o.llAt = o.t - 60;
          h.mft(o);
        }
        if (o.t > 60 && h.bit('ABC-050', 'M.0702') > 0.5) o.m702 = 1;
        if (o.t > 60 && h.bit('ABC-050', 'M.0705') > 0.5) o.m705 = 1;
      },
      checks(h, o) {
        return [
          [o.b0 < 0.5, 'BFWP-B standby (M.3344 = 0), BFWP-A pinahinto: walang BFWP'],
          [o.fw3 < 5, 'feedwater ' + f1(o.fw3) + ' T/H 3 s pagkatapos huminto'],
          [h.pk('ABC-010', 'FICFW1007') === 'B' && h.bit('ABC-010', 'M.0228') > 0.5, 'FICFW1007 FORCE MANUAL (M.0228)'],
          [!!o.m702 && !!o.m705, 'ABC-050 M.0702 ALL BFWP STOPPED (TON 15 s) at M.0705 HP bypass BU-CMD'],
          [h.pk('ABC-050', 'PICMS1006') === 'B', 'HP bypass PICMS1006 MANUAL (BU-CMD)'],
          [
            o.llAt != null && o.llAt < 90,
            'drum level LOW LOW (−254 mm, M.0170 / M.0172) pagkatapos ng ' + f0(o.llAt) + ' s → DITL MFT'
          ],
          [h.coal() < 1, 'coal ' + f1(h.coal()) + ' T/H pagkatapos ng MFT']
        ];
      }
    },
    {
      id: 'idf',
      title: 'M3 · IDF trip (ID fan stopped)',
      how: 'ABC-008 M.3304 IDF RUNNING = 0. Furnace pressure H.H. (> 300 mmH2O) → DITL MFT at PAF / SAF trip (forced).',
      want: 'PICFG108 force manual (M.0205), demand 0 % hawak (M.020F pulse, BU-CMD); furnace pressure HIGH > 30 (M.3107) sa ~12 s; H.H. sa ~1 min; coal 0; pressure bumalik.',
      secs: 260,
      run(h, o) {
        o.mv7 = h.nm(h.sh('ABC-008'), 'PICFG108.MV');
      },
      each(h, o) {
        if (o.t === 60) {
          h.setx(null, 'M.3304', 0);
          o.FP0 = h.FP();
        }
        if (o.t === 63) o.mv3 = +h.sh('ABC-008').rt.v[o.mv7];
        if (o.t === 70) o.mv10 = +h.sh('ABC-008').rt.v[o.mv7];
        if (o.t > 60 && h.bit('ABC-008', 'M.020F') > 0.5) o.pulse = 1;
        if (o.t > 60 && o.hiAt == null && h.bit('ABC-008', 'M.3107') > 0.5) o.hiAt = o.t - 60;
        if (o.t > 60 && o.hhAt == null && h.FP() > 300) {
          o.hhAt = o.t - 60;
          h.mft(o);
          h.setx(null, 'M.3302', 0);
          h.setx(null, 'M.3303', 0);
        }
      },
      checks(h, o) {
        return [
          [
            h.pk('ABC-008', 'PICFG108') === 'B' && h.bit('ABC-008', 'M.0205') > 0.5,
            'PICFG108 FORCE MANUAL (M.0205: IDF hindi tumatakbo)'
          ],
          [!!o.pulse, 'M.020F IDF NOT RUNNING TPs pulse'],
          [
            o.mv3 < 1 && o.mv10 < 1,
            'IDF demand PICFG108.MV 0 % sa 3 s at 10 s (' +
              f1(o.mv3) +
              ' / ' +
              f1(o.mv10) +
              '): hawak ng COS ang BU-CMD'
          ],
          [
            o.hiAt != null && o.hiAt < 60,
            'FURNACE PRESSURE HIGH M.3107 (> 30 mmH2O) pagkatapos ng ' + f1(o.hiAt) + ' s'
          ],
          [
            o.hhAt != null,
            'furnace pressure > 300 mmH2O (H.H.) pagkatapos ng ' + f1(o.hhAt) + ' s → DITL MFT at PAF / SAF trip'
          ],
          [Math.abs(h.FP()) < 120, 'furnace pressure ' + f0(h.FP()) + ' mmH2O sa dulo (walang hangin, walang IDF)'],
          [h.coal() < 1 && h.PA() < 5, 'coal ' + f1(h.coal()) + ' T/H, PA ' + f0(h.PA()) + ' T/H pagkatapos ng MFT']
        ];
      }
    },
    {
      id: 'paf',
      title: 'M3 · PAF trip (PA fan stopped)',
      how: 'ABC-007 M.3302 PAF RUNNING = 0. PA FAN STOP first out → DITL MFT pagkatapos ng 120 s (forced).',
      want: 'PA 0 sa 3 s; FICFA1071 force manual (M.0180); furnace pressure bumababa (kulang ang hangin), IDF sa AUTO bumababa; coal pinuputol ng cross limit LN40; MFT: coal 0, O2 21.',
      secs: 260,
      run(h, o) {
        o.fpMin = 1e9;
        o.idfMin = 1e9;
      },
      each(h, o) {
        if (o.t === 60) {
          h.setx(null, 'M.3302', 0);
          o.FP0 = h.FP();
          o.F0 = h.coal();
          o.idf0 = h.mv('ABC-008', 'PICFG108');
        }
        if (o.t === 63) o.pa3 = h.PA();
        if (o.t > 60 && o.t <= 180) {
          o.fpMin = Math.min(o.fpMin, h.FP());
          o.idfMin = Math.min(o.idfMin, h.mv('ABC-008', 'PICFG108'));
        }
        if (o.t === 180) {
          o.c120 = h.coal();
          h.mft(o);
        }
      },
      checks(h, o) {
        return [
          [o.pa3 < 5, 'primary air ' + f1(o.pa3) + ' T/H 3 s pagkatapos huminto ang PAF'],
          [h.pk('ABC-007', 'FICFA1071') === 'B', 'FICFA1071 PA master MANUAL (M.0180)'],
          [
            o.fpMin < o.FP0 - 20,
            'furnace pressure bumaba sa ' + f0(o.fpMin) + ' mmH2O (dati ' + f0(o.FP0) + '): kulang ang hangin'
          ],
          [
            o.idfMin < o.idf0 - 5,
            'IDF demand ' + f1(o.idf0) + ' → ' + f1(o.idfMin) + ' % (PICFG108 sa AUTO ang sumagot)'
          ],
          [
            o.c120 < 0.6 * o.F0,
            'coal ' +
              f1(o.c120) +
              ' T/H pagkatapos ng 120 s (dati ' +
              f1(o.F0) +
              '): pinutol ng air / fuel cross limit LN40'
          ],
          [h.coal() < 1 && h.O2() > 15, 'pagkatapos ng MFT: coal ' + f1(h.coal()) + ' T/H, O2 ' + f1(h.O2()) + ' %']
        ];
      }
    },
    {
      id: 'hh',
      title: 'M3 · Drum level HIGH HIGH',
      how: 'FICFW1007 faceplate: L (LOCAL), M (MANUAL), MV 100 %. Drum level H.H. → DITL MFT (forced).',
      want: 'FW tumaas (501 → ~550 T/H); drum level +254 mm (M.0173 / M.0175) sa ~3.5 min; coal 0.',
      secs: 400,
      run(h, o) {
        o.fwMax = 0;
      },
      each(h, o) {
        if (o.t === 60) {
          o.FW0 = h.FW();
          const q = h.S10.rt.st[h.fwc.svSw.id];
          q.al = 'A';
          q.fm = 'B';
          const st = h.S10.rt.st[h.fwc.amt.id];
          st.al = h.fwc.autoLeg;
          st.fm = h.fwc.autoLeg === 'A' ? 'B' : 'A';
          if (h.fwc.manBlk && h.S10.rt.st[h.fwc.manBlk.id]) h.S10.rt.st[h.fwc.manBlk.id].val = 100;
          else h.S10.rt.ext[h.fwc.manNet] = 100;
        }
        if (o.t > 60) o.fwMax = Math.max(o.fwMax, h.FW());
        if (o.t > 60 && o.hhAt == null && h.bit('ABC-010', 'M.0173') > 0.5 && h.bit('ABC-010', 'M.0175') > 0.5) {
          o.hhAt = o.t - 60;
          h.mft(o);
        }
      },
      checks(h, o) {
        return [
          [
            h.pk('ABC-010', 'FICFW1007') === 'B' && o.fwMax > o.FW0 + 30,
            'FICFW1007 LOCAL + MANUAL 100 %: feedwater hanggang ' + f0(o.fwMax) + ' T/H (dati ' + f0(o.FW0) + ')'
          ],
          [
            o.hhAt != null && o.hhAt < 300,
            'drum level HIGH HIGH (+254 mm, M.0173 / M.0175) pagkatapos ng ' + f0(o.hhAt) + ' s → DITL MFT'
          ],
          [o.hhAt != null && h.coal() < 1, 'coal ' + f1(h.coal()) + ' T/H pagkatapos ng MFT']
        ];
      }
    }
  ];
  /* ---- run one scenario: Start at 150 MW, then 0.5 s steps in batches so the page stays alive ---- */
  async function runSc(sc, ui) {
    if (busy) return;
    busy = true;
    P.querySelectorAll('button.go').forEach(b => (b.disabled = true));
    ui.res.innerHTML = '';
    ui.live.textContent = '';
    try {
      AN.run = false;
      AN.reset();
      if (sc.cold) AN.plantCold();
      else if (sc.hot) AN.plantHot();
      else if (sc.warm) AN.plantWarm(sc.warm);
      else if (sc.live) AN.plantLive(); /* 2.2.0-beta.21 (M5): 150 MW with the shutdown physics on */
      else AN.plantLoad150();
      const h = H();
      /* 2.2.0-beta.20: a scenario may be a CHAIN of stages run one after the other on the same plant (the full start-up: cold → coal →
         bypass → roll → 150 MW); each stage keeps its own o, starts from the plant as the stage before left it (o.chain), and its
         checks become one summary row; the last stage's checks are shown in full */
      const stages = sc.chain ? sc.chain.map(id => SC.find(s => s.id === id)) : [sc],
        steps = stages.reduce((a, s) => a + s.secs * 2, 0),
        sum = [];
      /* 2.2.0-beta.22: the sheets the scenario operates that are not linked to ABC-001C are stepped too (links.js actSet) */
      AN.checkSheets = [...new Set([].concat(...stages.map(s => s.sheets || [])))];
      let k = 0,
        o = { t: 0, chain: !!sc.chain },
        T = 0;
      stages[0].run(h, o);
      for (let i = 0; i < steps; i++) {
        /* 2.2.0-beta.22: a stage may ask for a longer step while nothing moves (the hours of cooling of the bottle-up) */
        const dts = (stages[k].dt && stages[k].dt(h, o)) || 0.5;
        AN.stepSet(h.C1, dts);
        o.t += dts;
        T += dts;
        if (o.mftAt != null && Math.abs(o.t - o.mftAt - 2) < 0.01)
          for (const k of ['ABC-003B', 'ABC-003C', 'ABC-003D']) h.setx(k, 'M.0341', 0);
        stages[k].each(h, o);
        if ((stages[k].done && stages[k].done(h, o)) || o.t >= stages[k].secs) {
          if (k === stages.length - 1) break;
          const ck = stages[k].checks(h, o);
          sum.push({ title: stages[k].title, ck, t: o.t });
          k++;
          o = { t: 0, chain: true };
          stages[k].run(h, o);
        }
        if (i % 20 === 19) {
          ui.bar.style.width = ((100 * (i + 1)) / steps).toFixed(1) + '%';
          ui.live.textContent = (sc.chain ? 'hakbang ' + (k + 1) + ' / ' + stages.length + ' · ' + stages[k].title + '\n' : '') + 't = ' + T.toFixed(0) + ' s\n' + h.live();
          await new Promise(r => setTimeout(r, 0));
        }
      }
      ui.bar.style.width = '100%';
      ui.live.textContent = 't = ' + T.toFixed(0) + ' s' + (sc.chain ? ' (' + Math.floor(T / 3600) + ' h ' + Math.floor((T % 3600) / 60) + ' min plant time)' : '') + '\n' + h.live();
      const ck = sum
        .map(x => {
          const ok = x.ck.filter(y => y[0]).length;
          return [ok === x.ck.length, x.title.replace(/^M\d · /, '') + ': ' + ok + ' / ' + x.ck.length + ' sa ' + f0(x.t / 60) + ' min' + (ok === x.ck.length ? '' : ' — ' + x.ck.filter(y => !y[0]).map(y => y[1]).join('; '))];
        })
        .concat(stages[k].checks(h, o));
      let ok = 0;
      const tb = E('table');
      for (const [y, w] of ck) {
        if (y) ok++;
        tb.append(E('tr', {}, [E('td', { cls: 'm ' + (y ? 'y' : 'n'), txt: y ? '✓' : '✗' }), E('td', { txt: w })]));
      }
      ui.res.append(
        E('div', {
          cls: ok === ck.length ? 'y' : 'n',
          txt: (ok === ck.length ? 'PASADO ' : 'MAY MALI ') + ok + ' / ' + ck.length
        }),
        tb
      );
      try {
        AN.paint();
      } catch (e) {}
    } catch (e) {
      ui.res.append(E('div', { cls: 'n', txt: 'Error: ' + e.message }));
    }
    busy = false;
    P.querySelectorAll('button.go').forEach(b => (b.disabled = false));
  }
  function build() {
    P.append(
      E('div', { style: 'display:flex;gap:8px;align-items:center' }, [
        E('h3', { txt: 'CHECK M2 / M3 / M4 / M5' }),
        E('button', { txt: '✕', on: () => (P.style.display = 'none') })
      ]),
      E('div', {
        cls: 'sub',
        txt: 'Isang pindot bawat scenario: Start at 150 MW (o Start cold sa M4; sa M5 ang 150 MW na may buong physics ng start-up / shutdown), tapos ginagawa ng app ang hakbang ng operator at ng DITL (forced), mabilis. Inaasahang resulta = drawing + physics (02.png / 4.PNG / boiler manual). Pagkatapos, makikita sa PLANT → UNIT at sa mga sheet ang huling estado.'
      })
    );
    for (const sc of SC) {
      if (sc.stage) continue; /* 2.2.0-beta.20: runs only inside a chain */
      const ui = { bar: E('i'), live: E('div', { cls: 'live' }), res: E('div') };
      const go = E('button', { cls: 'go', txt: '▶ Takbo', on: () => runSc(sc, ui) });
      P.append(
        E('div', { cls: 'sc' }, [
          E('div', { cls: 'h' }, [E('b', { txt: sc.title }), go]),
          E('div', { cls: 'sub', txt: 'Ginagawa: ' + sc.how }),
          E('div', { cls: 'sub', txt: 'Inaasahan: ' + sc.want }),
          E('div', { cls: 'bar' }, [ui.bar]),
          ui.live,
          ui.res
        ])
      );
    }
  }
  window.CHECK = {
    run: id => {
      const sc = SC.find(s => s.id === id);
      if (!sc) return null;
      if (!P.childNodes.length) build();
      const i = SC.filter(s => !s.stage).indexOf(sc);
      const box = P.querySelectorAll('.sc')[i];
      return runSc(sc, {
        bar: box.querySelector('.bar i'),
        live: box.querySelector('.live'),
        res: box.children[box.children.length - 1]
      });
    },
    SC,
    H /* 2.2.0-beta.20: the helpers, for the headless probes */
  };
})();
