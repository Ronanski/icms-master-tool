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
      title: 'Check M2 / M3: isang pindot bawat scenario, inaasahang resulta na may ✓ / ✗',
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
      live
    };
  };
  const near = (x, ref, p) => Math.abs(x - ref) <= (Math.abs(ref) * p) / 100;
  const f0 = x => (isFinite(x) ? (+x).toFixed(0) : '-'),
    f1 = x => (isFinite(x) ? (+x).toFixed(1) : '-');
  /* ---- the scenarios: steps (what the operator / the DITL does), each(t) every 0.5 s, checks at the end ---- */
  const SC = [
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
      AN.plantLoad150();
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
        E('h3', { txt: 'CHECK M2 / M3' }),
        E('button', { txt: '✕', on: () => (P.style.display = 'none') })
      ]),
      E('div', {
        cls: 'sub',
        txt: 'Isang pindot bawat scenario: Start at 150 MW, tapos ginagawa ng app ang hakbang ng operator at ng DITL (forced), mabilis. Inaasahang resulta = drawing + physics (02.png / 4.PNG / boiler manual). Pagkatapos, makikita sa PLANT → UNIT at sa mga sheet ang huling estado.'
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
