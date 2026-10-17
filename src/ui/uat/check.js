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
      txt: `#chkb{position:fixed;left:72px;bottom:36px;z-index:50;background:#16324a;color:#cfe3f5;border:1px solid #6aaee0;padding:8px 14px;border-radius:8px;font:600 13px system-ui;cursor:pointer}
#chkp{display:none;position:fixed;left:0;top:0;bottom:0;width:min(460px,100vw);z-index:60;background:#10151a;color:#dbe5ec;border-right:1px solid #2a3743;overflow:auto;font:13px/1.4 system-ui;padding:10px 12px;box-sizing:border-box}
#chkp h3{margin:0;font-size:16px;color:#6aaee0;flex:1}#chkp .sub{color:#8a9aa6;font-size:12px;margin:4px 0}
#chkp button{background:#18212a;color:#dbe5ec;border:1px solid #2a3743;padding:7px 11px;border-radius:6px;font:inherit;cursor:pointer}
#chkp button.go{background:#16324a;border-color:#6aaee0}#chkp button:disabled{opacity:.5;cursor:default}
#chkp .sc{background:#18212a;border:1px solid #2a3743;border-radius:8px;margin:8px 0;padding:8px 10px}
#chkp .sc .h{display:flex;gap:8px;align-items:center}#chkp .sc .h b{flex:1;font-size:14px}
#chkp .bar{height:8px;background:#2a3743;border-radius:4px;overflow:hidden;margin:6px 0}#chkp .bar i{display:block;height:100%;background:#6aaee0;width:0}
#chkp table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px}#chkp td{padding:3px 4px;border-top:1px solid #2a3743;vertical-align:top}
#chkp td.m{width:22px;font-weight:700}#chkp .y{color:#6fbf8f}#chkp .n{color:#d9786f}#chkp .w{color:#d8b860}
#chkp .live{font:12px ui-monospace,monospace;color:#a9b7c4;white-space:pre-wrap;margin:4px 0}`
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
  document.body.append(btn, P);
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
      tsat = P => 100 + 47.1 * Math.log(Math.max(0, P) + 1);
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
            Math.abs(o.lvMax - o.lvl0) < 150 && Math.abs(o.lvMin - o.lvl0) < 150,
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
        o.ab = 30;
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
            o.batch >= 3 && U.burn >= 0.99,
            'batch firing ' +
              o.batch +
              ' burping (feeder A 10 s / 60 s) hanggang bed 600 °C; coal burnt share ngayon ' +
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
            Math.abs(o.lvMax - o.lvl0) < 150 && Math.abs(o.lvMin - o.lvl0) < 150,
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
        o.ab = 30;
        o.airMv = 10;
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
          h.autoSv('ABC-010', 'LICBR1001B', 0);
          h.autoSv('ABC-013', 'PICMS1002', 50);
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
          const msf = h.MSF();
          if (
            r > 100 ||
            (o.svc != null && (msf > 65 || h.MSP() > o.hpSv + 2 || (o.hpSv >= 120 && o.ab > 25)))
          )
            o.ab = Math.max(20, o.ab - 5);
          else if (o.svc == null && t % 120 === 0 && r < 90 && o.ab < 80) o.ab += 5;
          else if (o.svc != null && t % 300 === 0 && r < 90 && o.ab < 80 && h.MSP() < o.hpSv - 1) o.ab += 5;
          for (const [k, tg] of [
            ['ABC-003A', 'FICDO1043A'],
            ['ABC-003B', 'FICDO1043B'],
            ['ABC-003C', 'FICDO1043C'],
            ['ABC-003D', 'FICDO1043D']
          ])
            h.man(k, tg, o.ab);
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
          /* bypass servicing (PR-OPE-5002: 50 ksc, steam flow > 40 T/H) */
          if (o.svc == null && h.MSP() >= 48 && h.MSF() >= 40) {
            o.svc = t;
            o.svcP = h.MSP();
            o.svcF = h.MSF();
          }
          if (o.svc != null) {
            if (o.hpSv < 123 && h.MSP() >= o.hpSv - 1) {
              o.hpSv = Math.min(123, o.hpSv + 1);
              h.autoSv('ABC-050', 'PICMS1006', o.hpSv);
            }
            h.autoSv('ABC-013', 'PICMS1002', o.hpSv + 5);
            if (o.rb > 0) {
              o.rb = Math.max(0, o.rb - 5);
              h.man('ABC-054', 'PICHR1391', o.rb);
            }
          }
        }
        if (o.svc != null && t >= o.svc + 1200) {
          o.rhMin = Math.min(o.rhMin, h.RHP());
          o.rhMax = Math.max(o.rhMax, h.RHP());
        }
        if (o.p123 == null && h.MSP() >= 122.5) o.p123 = t;
        if (window.__tr && t % 30 === 0)
          window.__tr.push([t, h.RHP(), h.mv('ABC-052', 'PICHR1003'), U.mhp, h.MSF(), o.ab, h.MSP(), o.hpSv, h.mv('ABC-050', 'PICMS1006'), h.mv('ABC-054', 'PICHR1391')].map(x => +(+x).toFixed(2)));
      },
      done(h, o) {
        return o.p123 != null && o.t >= o.p123 + 600;
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
            o.rhMin > 6 && o.rhMax < 9 && h.isAuto('ABC-052', 'PICHR1003') && h.mv('ABC-054', 'PICHR1391') < 0.5,
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
            Math.abs(o.lvMax - o.lvl0) < 150 &&
              Math.abs(o.lvMin - o.lvl0) < 150 &&
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
      else if (sc.warm) AN.plantWarm(sc.warm);
      else AN.plantLoad150();
      const h = H(),
        o = { t: 0 };
      sc.run(h, o);
      const steps = sc.secs * 2;
      for (let i = 0; i < steps; i++) {
        AN.stepSet(h.C1, 0.5);
        o.t += 0.5;
        if (o.mftAt != null && Math.abs(o.t - o.mftAt - 2) < 0.01)
          for (const k of ['ABC-003B', 'ABC-003C', 'ABC-003D']) h.setx(k, 'M.0341', 0);
        sc.each(h, o);
        if (sc.done && sc.done(h, o)) break;
        if (i % 20 === 19) {
          ui.bar.style.width = ((100 * (i + 1)) / steps).toFixed(1) + '%';
          ui.live.textContent = 't = ' + o.t.toFixed(0) + ' s\n' + h.live();
          await new Promise(r => setTimeout(r, 0));
        }
      }
      ui.bar.style.width = '100%';
      ui.live.textContent = 't = ' + o.t.toFixed(0) + ' s\n' + h.live();
      const ck = sc.checks(h, o);
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
        E('h3', { txt: 'CHECK M2 / M3 / M4' }),
        E('button', { txt: '✕', on: () => (P.style.display = 'none') })
      ]),
      E('div', {
        cls: 'sub',
        txt: 'Isang pindot bawat scenario: Start at 150 MW (o Start cold sa M4), tapos ginagawa ng app ang hakbang ng operator at ng DITL (forced), mabilis. Inaasahang resulta = drawing + physics (02.png / 4.PNG / boiler manual). Pagkatapos, makikita sa PLANT → UNIT at sa mga sheet ang huling estado.'
      })
    );
    for (const sc of SC) {
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
      const i = SC.indexOf(sc);
      const box = P.querySelectorAll('.sc')[i];
      return runSc(sc, {
        bar: box.querySelector('.bar i'),
        live: box.querySelector('.live'),
        res: box.children[box.children.length - 1]
      });
    },
    SC
  };
})();
