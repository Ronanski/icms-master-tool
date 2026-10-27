/* ===== 3.2.0-beta.21 GUIDED TRAINING (user pick 2026-10-24, proposal https://claude.ai/artifact/FnjLxFZYXnFqc9fjvRdHWJ, "Oo, gawin ayon
   sa proposal"; user: "ang hirap nya paganahin ... irrun mo ba ... palipat lipat ka rin ng modules ... pwedeng magskip ng step like hnd
   pa bukas swp, pero pwede ka na mag line up ng steam drum filling ... hindi friendly sa newbie").
   Cold to 150 MW as ONE path of steps, in the order of PR-OPE-5002 (document-references/procedure-start-up-PR-OPE-5002-02.docx) and of
   the app's own cold start that reaches 150 MW (src/ui/uat/check.js chain cold -> coal -> byp -> roll -> up, tests/regress/check_panel.js):
   - one step is open at a time; the next one opens only when the logic shows this one done (no skipping);
   - the step's actions are on its card (start a pump = its running memory, the same address as the Inputs list; a controller = its own
     faceplate or one button for the exact setting; the TCS panel = AN.turbine), so there is no going to the Logic or the Plant view;
   - the FIELD items (local valves, gauges, panels: no DCS signal) of a section are one card, confirmed with one press;
   - the COACH (the board operator beside you) keeps the slow trims the procedure asks for while you do the steps: furnace pressure on
     the IDF coupling, firing rate <= 110 C/h (Fig 1), O2, drum level, HP bypass SV ramp, coal for the load. Each trim can be switched
     off ("I hold it"). Its rules are the ones of the cold start of check.js (it passes to 150 MW).
   Nothing here changes the logic: it writes only what an operator writes (inputs, faceplate modes, SV, MV, TCS commands). ===== */
window.LS_GUIDE = (function () {
  const L = () => window.LS_LIVE;
  const PROC = () => window.LS_PROC5002 || [];
  let HH = null,
    HOf = null;
  /* the plant helpers of check.js (the same reading and writing as the CHECK scenarios), kept while the ABC sheets stay the same */
  const h = () => {
    if (!HH || HOf !== AN.sheets) {
      HH = CHECK.H();
      HOf = AN.sheets;
    }
    return HH;
  };
  const U = () => AN.unit || {};
  /* 3.2.0-beta.38: the TCS / ATS model (src/analog/engine/tcs.js) */
  const TC = () => (AN.tcs && AN.tcs()) || { aux: {}, crit: {}, step: -1, cur: -1 };
  const shOf = t => {
    try {
      return AN.fpFind(t);
    } catch (e) {
      return null;
    }
  };
  /* a hand station (MAN block: HICHR1002A / B, HIC-BM, EIC-TM, HIC-ULD, HIC-TADBS) */
  const station = t => {
    const k = shOf(t),
      sh = k && AN.sheets.find(s => s.name === k),
      T = sh && sh.S,
      b = T && T.blk.find(b => b.k === 'MAN' && (b.tag === t || (b.txt || []).includes(t)));
    return b ? { T, b } : null;
  };
  /* ---------- the operator's actions (what the faceplate, the Inputs list and the TCS panel write) ---------- */
  const A = {
    /* with the one world ON (Training dock) a motor of a DITL drawing starts from its DITL: the START / STOP pushbutton of the
       drawing, its interlock decides (src/ui/training/dock.js dmotor); else the running memory is set (the Inputs list force) */
    motor: (a, on) => (window.LS_DOCK && LS_DOCK.dmotor && LS_DOCK.dmotor(a, on) ? '' : (h().setx(null, a, on ? 1 : 0), '')),
    man(t, x) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      const c = h().ctl(k, t);
      if (c) return h().man(k, t, x), '';
      const s = station(t);
      if (!s) return 'no station ' + t;
      if (AN.latchMode) AN.latchMode(t, 'MAN');
      s.T.rt.st[s.b.id].val = x;
      for (const n of s.b.i || []) if (n >= 0 && s.T.ext.includes(n) && !(s.T.xlk && s.T.xlk[n]) && (AN.nm(s.T, n) || '').trim() === t + '.MV') s.T.rt.ext[n] = x;
      return '';
    },
    /* the value of a hand station without a mode change (HIC-TADBS) */
    val(t, x) {
      const s = station(t);
      if (!s) return 'no station ' + t;
      s.T.rt.st[s.b.id].val = x;
      return '';
    },
    auto(t, sv) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      if (h().ctl(k, t)) return h().autoSv(k, t, sv), '';
      /* a hand station: AUTO = .MAN 0 on every sheet (CLAUDE.md 10) */
      for (const [S2, n] of AN.modeNets(t) || []) S2.rt.ext[n] = 0;
      return '';
    },
    rem(t) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      return h().rem(k, t), '';
    },
    loc: t => (h().mode(L().ctlTag(t) || t, 'LOC'), ''),
    oil: (a, open) => (AN.oilValve(a, open), ''),
    field: (k, on) => (AN.field(k, on), ''),
    tcs: (cmd, arg) => AN.turbine(cmd, arg) || '',
    /* a pushbutton of the drawing: 1 for 2.5 s of the plant, then 0 (ABC-010 3-ELEMENT M.054E, TPS 2 s) */
    push(a) {
      h().setx(null, a, 1);
      PUSH[a] = simT() + 2.5;
      return '';
    }
  };
  const PUSH = {};
  const simT = () => +U().t || 0;
  /* ---------- reading ---------- */
  const mv = t => {
    const f = L().fp(t);
    return f ? L().mvOf(f) : NaN;
  };
  const pv = t => {
    const f = L().fp(t);
    return f ? L().pvOf(f) : NaN;
  };
  const md = t => {
    const f = L().fp(t);
    return f ? L().modeOf(f) : '?';
  };
  const bit = a => L().val(a);
  /* the manual value the operator set on a controller (its MV reads 0 while the drawing holds the output: FIC-CF before a coal
     feeder runs) */
  const setOf = t => {
    try {
      const k = shOf(t),
        c = k && h().ctl(k, t),
        T = c && AN.sheets.find(s => s.name === k).S;
      if (!c) return NaN;
      if (c.manBlk && T.rt.st[c.manBlk.id]) return +T.rt.st[c.manBlk.id].val;
      if (c.manNet != null) return +T.rt.ext[c.manNet];
    } catch (e) {}
    return NaN;
  };
  /* 3.2.0-beta.39 (roadmap 2) (roadmap 2, mouse Cold run stuck at "Hawakan ang 45 MW", MSP 66): the set point of a controller now. The step of the
     45 MW handover passed on M.0255 = 0 (blow-off < 5 % open) before the operator pressed "PICMS1002 A, SV 128": the blow-off stayed at
     the SV of the bypass stage (HP bypass SV + 5 = 66), vented about 20 T/H and held the main steam at 66 kg/cm2 */
  /* the SV switch of a controller on its logic leg (A: cascade / schedule SV; the faceplate "SV: LOGIC" where the drawing has no .REM) */
  const svLogic = (k, t) => {
    try {
      const c = h().ctl(k, t),
        st = c && c.svSw && h().sh(k).rt.st[c.svSw.id];
      return !!st && st.pk === 'A';
    } catch (e) {
      return false;
    }
  };
  const svOf = t => {
    try {
      const k = shOf(t),
        c = k && h().ctl(k, t);
      return c && c.q.sv != null ? +AN.sheets.find(s => s.name === k).S.rt.v[c.q.sv] : NaN;
    } catch (e) {
      return NaN;
    }
  };
  const SETmin = (t, lo) => C(t + ' M, ≥ ' + lo + ' %', () => md(t) === 'MAN' && setOf(t) >= lo, () => t + ' ' + md(t) + ' ' + f0(setOf(t)) + ' %');
  const SET = (t, lo, hi) => C(t + ' M, ' + lo + ' ~ ' + hi + ' %', () => md(t) === 'MAN' && setOf(t) >= lo && setOf(t) <= hi, () => t + ' ' + md(t) + ' ' + f0(setOf(t)) + ' %');
  const f0 = x => (isFinite(x) ? Math.round(x).toString() : '—');
  const f1 = x => (L() ? L().f1(x) : String(x));
  /* a custom condition */
  const C = (want, ok, now, go) => ({ sig: [], res: () => true, ok, now, want, go: go || {} });

  /* ---------- the coach: slow trims of the cold start (check.js), every minute of the plant ---------- */
  const CO = {};
  const coach = {
    /* furnace pressure by hand on the IDF hydraulic coupling (PR-OPE-5002 22.18: -15 mmH2O; the drawing forces PICFG108 MANUAL below
       14 %, M.0205) */
    fp: {
      t: 'Furnace pressure −15 mmH₂O sa IDF coupling (PICFG108 MV)',
      run(o) {
        if (md('PICFG108') !== 'MAN') return;
        const fp = h().FP();
        o.mv = o.mv == null ? mv('PICFG108') : o.mv;
        if (fp < -25) o.mv = Math.max(0, o.mv - 1);
        else if (fp > -5) o.mv = Math.min(80, o.mv + 1);
        A.man('PICFG108', o.mv);
      }
    },
    /* warm-up firing (check.js cold): the saturation temperature rise <= 110 C/h (Fig 1): +5 % oil when < 85 C/h and the drum > 5
       kg/cm2, -5 % when > 100; burners C / D follow once lit */
    fire: {
      t: 'Bilis ng pag-init ≤ 110 °C/h (oil burner MV)',
      run(o) {
        const u = U(),
          r = o.tsP != null ? (u.Tw - o.tsP) * 60 : 0;
        o.tsP = u.Tw;
        o.ab = o.ab == null ? mv('FICDO1043A') || 60 : o.ab;
        /* 3.2.0-beta.37 (PR-OPE-5002 BURNER START UP: "IF SUB A START, next to start is SUB D. SUB B/C may start after 30 minutes"):
           the first pair is A + D (diagonal), the second B + C (o.cd keeps its name) */
        const lit = k => bit({ B: 'M.3413', C: 'M.3418' }[k]) > 0.5;
        o.cd = o.cd == null ? (lit('B') ? mv('FICDO1043B') || 20 : 0) : o.cd;
        if (!o.cd && lit('B') && lit('C')) o.cd = 20;
        /* the oil fire raises the drum to 30 ~ 35 kg/cm2 only (PR-OPE-5002: the coal does the rest): above 40 it comes down */
        if (r > 100 || u.Pd > 40) {
          /* 3.2.0-beta.38: the turbine auxiliaries (lube oil ... vacuum up) come before the bypass (the LP bypass needs the condenser):
             a closed boiler at 30 % oil went on to 85 kg/cm2 and the HP bypass opened at 61 took the level to -300 mm (MFT). Above 50
             kg/cm2 the oil goes to its minimum (20 %), FHI Fig. 2: 61 kg/cm2 at the roll */
          const lo = u.Pd > 50 ? 20 : 30;
          o.ab = Math.max(lo, o.ab - 5);
          if (o.cd) o.cd = Math.max(20, o.cd - 5);
        } else if (r < 85 && u.Pd >= 5 && u.Pd < 35) {
          if (o.ab < 100) o.ab = Math.min(100, o.ab + 5);
          else if (o.cd) o.cd = Math.min(100, o.cd + 5);
        }
        A.man('FICDO1043A', o.ab);
        A.man('FICDO1043D', o.ab);
        if (o.cd) {
          A.man('FICDO1043B', o.cd);
          A.man('FICDO1043C', o.cd);
        }
      }
    },
    /* coal stage (check.js coal): feeder A in batches (10 s on, 60 s off) while the bed is below 600 C */
    batch: {
      t: 'Batch firing: feeder A 10 s ON / 60 s OFF hanggang bed 600 °C',
      sec: true,
      run(o) {
        const t = simT();
        o.t0 = o.t0 == null ? t : o.t0;
        const ph = (t - o.t0) % 70;
        const on = ph < 10;
        if (U().Tb >= 600) return;
        if (on !== o.on) {
          A.motor('M.3400', on);
          if (on) o.n = (o.n || 0) + 1;
          o.on = on;
        }
      }
    },
    /* coal stage: the oil down 5 % a minute (to 20 %) once a feeder runs continuously; the coal demand -5 % when the rise is over 110 C/h */
    oildown: {
      t: 'Bawas oil 5 % kada minuto (hanggang 20 %) habang pumapalit ang coal',
      run(o) {
        const lit = ['M.3412', 'M.3413', 'M.3418', 'M.3419'].map(a => bit(a) > 0.5);
        o.ab = o.ab == null ? Math.max(20, mv('FICDO1043A') || 20) : o.ab;
        if (o.ab > 20) o.ab -= 5;
        ['A', 'B', 'C', 'D'].forEach((k, i) => lit[i] && A.man('FICDO1043' + k, o.ab));
        const ts = AN.tsat(U().Pd),
          r = o.ts != null ? (ts - o.ts) * 60 : 0;
        o.ts = ts;
        if (r > 110 && mv('FIC-CF') > 10) A.man('FIC-CF', Math.max(10, mv('FIC-CF') - 5));
      }
    },
    /* O2 3.5 ~ 8 % on the SA damper by hand (2 % a minute, floor 10 %) while it is not REMOTE. 3.2.0-beta.23: the PA damper keeps the
       primary air flow at 280 T/H (PR-OPE-5002 PAF START UP "Target Primary Air Flow: 180 T/H = No Bed, 280 T/H = With Bed", "PA fan:
       Maintain a minimum airflow"): on coal alone the DITL trips the boiler at PRIMARY AIR FLOW L.L. (ABC-007 M.3131 = FIFA1071 < 200
       T/H for 5 s -> DITL-03F -> MFT); before, both dampers went down together to 10 % (about 100 T/H) */
    o2: {
      t: 'PA flow 280 T/H (PA damper), O₂ 3.5 ~ 8 % sa SA damper (MV)',
      run(o) {
        if (md('FICFA1071') !== 'REM') {
          const f = pv('FICFA1071'),
            tb = U().Tb;
          o.p = o.p == null ? mv('FICFA1071') || 10 : o.p;
          /* the air goes up while the bed is hot enough (more air cools the bed), 1 % a minute */
          if (f < 280 && tb > 720) o.p = Math.min(90, o.p + 1);
          else if (f > 300) o.p = Math.max(10, o.p - 1);
          A.man('FICFA1071', o.p);
          /* the coal follows the air: with the three feeders running and the bed under 730 C, the coal demand + 1 % a minute (to 30 %) */
          if (tb < 730 && !CO.byp && !CO.load && !CO.swap && md('FIC-CF') !== 'REM' && ['M.3400', 'M.3401', 'M.3402'].every(a => bit(a) > 0.5)) {
            const c = setOf('FIC-CF');
            if (isFinite(c) && c < 30) A.man('FIC-CF', c + 1);
          }
          /* 3.2.0-beta.31 (human run of the Training: drum pressure 141 kg/cm2 at 0 MW, steam 219 T/H on coal 36 T/H before the bypass
             stage): the coal back down 1 % a minute (to 15 %) once the bed is hot (> 760 C) and the steam is over the 40 ~ 55 T/H of the
             procedure (PR-OPE-5002, the bypass coach takes over at the servicing step) */
          if (tb > 760 && !CO.byp && !CO.load && !CO.swap && md('FIC-CF') !== 'REM' && h().MSF() > 65) {
            const c = setOf('FIC-CF');
            if (isFinite(c) && c > 15) A.man('FIC-CF', c - 1);
          }
        }
        if (md('FICFA1081') === 'REM') return;
        const x = h().O2();
        o.m = o.m == null ? mv('FICFA1081') || 10 : o.m;
        if (x > 8) o.m = Math.max(10, o.m - 2);
        else if (x < 3.5) o.m = Math.min(80, o.m + 2);
        A.man('FICFA1081', o.m);
      }
    },
    /* bypass stage (check.js byp): the coal fire holds the steam flow 40 ~ 55 T/H after the servicing and the rise under 90 C/h; the HP
       bypass SV up 1 kg/cm2 a minute to 123 (1 in 90 s above 110), the blow-off 5 above it; the RH blow-off keeps the reheat <= 8.2 */
    byp: {
      t: 'Pressure raise: SV ng HP bypass +1 kada minuto hanggang 123, coal para sa 40 ~ 55 T/H, RH blow-off',
      run(o) {
        const H = h(),
          t = simT(),
          msp = H.MSP(),
          msf = H.MSF();
        const ts = AN.tsat(U().Pd);
        o.tsH = o.tsH || [];
        o.tsH.push(ts);
        if (o.tsH.length > 6) o.tsH.shift();
        const r = o.tsH.length === 6 ? (ts - o.tsH[0]) * 12 : 0;
        o.hp = o.hp == null ? Math.max(50, Math.min(123, Math.round(+H.sh('ABC-050').rt.v[H.ctl('ABC-050', 'PICMS1006').q.sv]) || 50)) : o.hp;
        if (o.svc == null && msp >= 48 && msf >= 40) o.svc = t;
        o.cf = o.cf == null ? mv('FIC-CF') : o.cf;
        const dn = r > 90 || (o.svc != null && ((msf > 65 && msp >= o.hp - 3) || msp > o.hp + 0.5 || (o.hp >= 120 && o.cf > 15 && msp >= o.hp - 1))),
          up = (o.svc == null && (o.n = (o.n || 0) + 1) % 2 === 0 && r < 80 && o.cf < 40) || (o.svc != null && (o.n = (o.n || 0) + 1) % 5 === 0 && r < 80 && o.cf < 40 && msp < o.hp - 1);
        /* 3.2.0-beta.23: the bed first. With the primary air at 280 T/H the coal that makes 40 ~ 55 T/H of steam does not hold the bed
           above 700 C, and under 700 C the DITL trips the boiler (DITL-03F FURNACE TEMP. INADEQUATE FOR COAL FIRING, ABC-027 M.2504):
           no coal down under 730 C, coal up under 720 C (the HP bypass takes the extra steam) */
        const tb = U().Tb;
        if (dn && tb >= 730) o.cf = Math.max(10, o.cf - (o.svc != null && msp > o.hp + 0.5 ? 2 : 1));
        else if ((up || tb < 720) && o.cf < 40 && !(dn && tb >= 720)) o.cf += 1;
        A.man('FIC-CF', o.cf);
        if (o.svc != null) {
          if (o.hp < 123 && msp >= o.hp - 1 && (o.hp < 110 || t - (o.hpT == null ? -1e9 : o.hpT) >= 90)) {
            o.hpT = t;
            o.hp = Math.min(123, o.hp + 1);
            A.auto('PICMS1006', o.hp);
          }
          A.auto('PICMS1002', o.hp + 5);
        }
        const rp = H.RHP();
        o.rb = o.rb == null ? mv('PICHR1391') || 0 : o.rb;
        if (rp > 8.5) o.rb = Math.min(60, o.rb + 10);
        else if (rp > 8.2) o.rb = Math.min(60, o.rb + 5);
        else if (o.svc != null && rp < 8.2 && o.rb > 0) o.rb = Math.max(0, o.rb - 5);
        A.man('PICHR1391', o.rb);
      }
    },
    /* 3.2.0-beta.37 (CHECKLIST 0.5, PR-OPE-5002 "BYPASS SYSTEM SERVICING" -> "TURBINE ROLLING" -> "SYNCH. & INITIAL LOAD" -> "LOAD
       UP" -> solid fuel; FHI SECT_7 Fig. 2 COLD STARTUP: roll at 60 kg/cm2, coal after the initial load): the OIL fire of the four
       start-up burners carries the bypass, the roll and the load to 45 MW. Before the roll: the HP bypass SV up 1 kg/cm2 a minute to 61
       (PR-OPE-5002 roll condition MS 61.2 kg/cm2), the oil holds the steam flow 40 ~ 55 T/H (the blow-off 5 above, the RH blow-off as
       the bypass coach). On the grid: the oil holds the pressure; while the HP bypass is in AUTO at 61 the turbine takes its steam (it
       closes by itself, "load up until the HP & LP bypass valve is fully closed or 20 MW"); once it is REMOTE the pressure slides with
       the load as Fig. 2 (60 kg/cm2 at 15 % load, 125 at 40 %). The saturation rise stays under 110 C/h (Fig. 1) */
    ofire: {
      t: 'Oil firing: SV ng HP bypass +1 kada minuto hanggang 61, steam 40 ~ 55 T/H; pagkatapos ng sync, pressure sumusunod sa load (Fig. 2)',
      run(o) {
        const H = h(),
          t = simT(),
          msp = H.MSP(),
          msf = H.MSF(),
          tb = U().tb || {},
          grid = tb.st === 'sync' || tb.st === 'load';
        const ts = AN.tsat(U().Pd);
        o.tsH = o.tsH || [];
        o.tsH.push(ts);
        if (o.tsH.length > 6) o.tsH.shift();
        const r = o.tsH.length === 6 ? (ts - o.tsH[0]) * 12 : 0;
        /* 3.2.0-beta.38: from the SV the bypass was put in service at (the pressure of that moment, up to 85 kg/cm2), down 1 kg/cm2 a
           minute to 61. Before, the SV was taken as 61 while the bypass held 74: the oil went down for the 61 and the reheat steam
           (the HP bypass flow) fell under 7 kg/cm2 during the roll (ATS hold 1.5) */
        o.hp = o.hp == null ? Math.max(50, Math.round(+H.sh('ABC-050').rt.v[H.ctl('ABC-050', 'PICMS1006').q.sv]) || 50) : o.hp;
        if (o.svc == null && msp >= 48 && msf >= 40) o.svc = t;
        const lit = k => bit({ A: 'M.3412', B: 'M.3413', C: 'M.3418', D: 'M.3419' }[k]) > 0.5;
        o.ab = o.ab == null ? mv('FICDO1043A') || 60 : o.ab;
        o.cd = o.cd == null ? (lit('B') ? mv('FICDO1043B') || 20 : 20) : o.cd;
        /* the pressure the oil holds: the HP bypass SV before the roll and while the bypass is in AUTO, then Fig. 2 */
        const slide = grid && md('PICMS1006') === 'REM',
          Pt = slide ? Math.max(61, Math.min(123, 61 + ((H.MW() - 22.5) * (123 - 61)) / (60 - 22.5))) : o.hp;
        let d = 0;
        if (!grid) {
          /* roadmap 2 batch 3 (mouse Cold run: ATS HOLD at the 3600 rpm heat soak, MSP 59.3 < 60, reheat 6.5 < 7; from a checkpoint: the
             oil swung 30 <-> 90 % every 30 ~ 40 min and the steam flow 0 <-> 34 T/H). With the HP bypass in AUTO the bypass holds the
             pressure at its SV; the oil only sets how much steam is made (PR-OPE-5002: steam 40 ~ 55 T/H). The oil was cut 5 % a minute for
             a pressure 0.5 over the SV: the bypass shut, the reheat (the bypass steam) fell under 7 and the pressure under 60. Now, once the
             bypass is in service: 2 % a minute, cut only for a steam flow over 58 T/H or a pressure 3 over the SV, raised for a flow under
             45, a pressure 1 under the SV or (turbine rolling) a reheat under 7.4 */
          const roll = tb.st === 'roll' || TC().cur >= 2;
          if (o.svc == null) {
            if (r > 90) d = -5;
            else if (r < 80 && (o.n = (o.n || 0) + 1) % 2 === 0) d = 5;
          } else if (r > 90) d = -5;
          else if ((msf > 58 && msp >= o.hp - 0.5) || msp > o.hp + 3) d = -2;
          else if (r < 80 && (msp < o.hp - 1 || msf < 45 || (roll && H.RHP() < 7.4))) d = 2;
        } else if (r > 100 || msp > Pt + 1.5) d = -5;
        /* the load up of the TCS (7.5 MW a minute) takes the steam faster than the oil follows: the fire goes ahead of it (10 % a
           minute while the turbine is loading or the pressure is 3 under) so that the pressure does not fall far under 61 */
        else if ((tb.st === 'load' && H.MW() < (+tb.aim || 0) - 1 && msp < Pt + 5) || msp < Pt - 3) d = 10;
        else if (r < 90 && msp < Pt - 1) d = 5;
        if (d > 0) {
          if (o.ab < 100) o.ab = Math.min(100, o.ab + d);
          else o.cd = Math.min(100, o.cd + d);
        } else if (d < 0) {
          if (o.cd > 20) o.cd = Math.max(20, o.cd + d);
          else o.ab = Math.max(30, o.ab + d);
        }
        ['A', 'D'].forEach(k => lit(k) && A.man('FICDO1043' + k, o.ab));
        ['B', 'C'].forEach(k => lit(k) && A.man('FICDO1043' + k, o.cd));
        if (o.svc != null && !grid) {
          if (o.hp < 61 && msp >= o.hp - 1) {
            o.hp += 1;
            A.auto('PICMS1006', o.hp);
          } else if (o.hp > 61 && msp <= o.hp + 1) {
            o.hp -= 1;
            A.auto('PICMS1006', o.hp);
          }
          A.auto('PICMS1002', o.hp + 5);
        }
        /* while the HP bypass is AUTO on the grid the blow-off stays 5 above it; REMOTE: the blow-off is the operator's (SV 128) */
        if (grid && !slide && md('PICMS1002') === 'AUTO') A.auto('PICMS1002', o.hp + 5);
        const rp = H.RHP();
        o.rb = o.rb == null ? mv('PICHR1391') || 0 : o.rb;
        if (rp > 8.5) o.rb = Math.min(60, o.rb + 10);
        else if (rp > 8.2) o.rb = Math.min(60, o.rb + 5);
        else if ((o.svc != null && rp < 8.2 && o.rb > 0) || grid) o.rb = Math.max(0, o.rb - 5);
        A.man('PICHR1391', o.rb);
      }
    },
    /* 3.2.0-beta.37 (coal after the sync, CHECKLIST 0.5): the fuel swap at 45 MW (PR-OPE-5002 solid firing: "START reducing Fuel Oil
       flow. Approximately: 2.55TPH coal = 1TPH diesel ... CONTINUE to reduce Fuel Oil flow until it equal the Solid Fuel heat input").
       The operator matches the fuel to the steam the turbine takes: coal-equivalent needed = the firing line of the unit model for the
       steam flow + a pressure term toward 123 kg/cm2 (raised 1 kg/cm2 a minute); coal + 2.55 x oil is brought to it, the oil 5 % a
       minute down to 20 % while the coal burns (bed >= 600 C). A coal demand on the pressure alone overshot: the bed lags 15 min
       (tauB), the coal went 20 -> 72 T/H, 150 kg/cm2, then down to 22 T/H and the bed under 700 C tripped the boiler (DITL-03F) */
    swap: {
      t: 'Palit ng apoy sa 45 MW: coal para sa steam ng turbine, bawas oil 5 % kada minuto, pressure pataas sa 123',
      run(o) {
        if (md('FIC-CF') === 'REM') return;
        const H = h(),
          u = U(),
          msp = H.MSP();
        o.pt = o.pt == null ? Math.max(90, Math.min(123, msp)) : Math.min(123, o.pt + 1);
        const ao = +u.ao || 2.55,
          need = Math.max(0, (H.MSF() - u.m0 + u.a * u.F0) / u.a) + 0.4 * (o.pt - msp),
          have = (+u.Fc || 0) + ao * (+u.oilF || 0);
        const lit = ['M.3412', 'M.3413', 'M.3418', 'M.3419'].map(a => bit(a) > 0.5);
        o.ab = o.ab == null ? Math.max(20, mv('FICDO1043A') || 20) : o.ab;
        if (u.Tb >= 600 && o.ab > 20 && have > need - 3) o.ab = Math.max(20, o.ab - 5);
        ['A', 'B', 'C', 'D'].forEach((k, i) => lit[i] && A.man('FICDO1043' + k, o.ab));
        const c = setOf('FIC-CF'),
          k = c > 1 && u.Fc > 1 ? u.Fc / c : 1.5;
        if (!isFinite(c)) return;
        let d = Math.max(-1.5, Math.min(1.5, (need - have) / k));
        /* the bed first: under 700 C with no burner the DITL trips the boiler (DITL-03F, ABC-027 M.2504) */
        if (u.Tb < 705 && d < 0.5 && msp < 128) d = 0.5;
        A.man('FIC-CF', Math.max(10, Math.min(60, c + d)));
      }
    },
    /* drum level on the start-up valve (check.js byp): LICBR1001B opened by hand +5 % a minute while the level falls under -60 mm, back
       to AUTO SV 0 once it stops falling or is over -50 mm */
    lvl: {
      t: 'Drum level: tulong sa start-up valve LICBR1001B kapag bumababa sa −60 mm',
      run(o) {
        if (md('LICBR1001B') === '?' || o.off) return;
        const lv = h().lvl(),
          falling = lv < (o.p == null ? lv : o.p) - 1;
        o.p = lv;
        if (!o.man && lv < -60 && falling) {
          o.man = 1;
          o.mv = mv('LICBR1001B');
        }
        if (o.man) {
          if (lv < -50 && falling) {
            o.mv = Math.min(100, o.mv + 5);
            A.man('LICBR1001B', o.mv);
          } else {
            A.auto('LICBR1001B', 0);
            o.man = 0;
          }
        }
      }
    },
    /* roll and load up (check.js roll): the boiler master is MANUAL (BU-CMD below 220 T/H): the coal for the load and 123 kg/cm2 */
    load: {
      t: 'Coal para sa load at 123 kg/cm² (FIC-CF MV)',
      run(o) {
        if (md('FIC-CF') === 'REM') return;
        const H = h(),
          msp = H.MSP(),
          tb = U().tb || {},
          loading = tb.st === 'load' && H.MW() < 44.5;
        o.cf = o.cf == null ? mv('FIC-CF') : o.cf;
        if (loading && msp < 125) o.cf += msp < 118 ? 3 : 2;
        else if (msp > 128 && U().Tb >= 705) o.cf -= 2;
        else if (msp > 125 && U().Tb >= 730) o.cf -= 1;
        /* 3.2.0-beta.24: the bed first, as in the bypass coach: under 700 C with no burner the feeders trip (DITL-19 row 16, ABC-027
           M.2504) and the boiler with them; at 45 MW the bed fell 690 -> 617 C while the coal followed the pressure only.
           3.2.0-beta.37 (coal after the sync, CHECKLIST 0.5): one step a minute and not while the pressure is over 125. Added together
           (pressure + bed + load) the coal went to 71 T/H at 45 MW while the oil came out and the bed lagged: 150 kg/cm2, blow-off 100 % */
        else if (msp < 121 || (tb.st === 'load' && bit('I.0418') < 0.5 && mv('PICMS1006') < 15) || (U().Tb < 720 && msp < 125)) o.cf += 1;
        o.cf = Math.max(10, Math.min(60, o.cf));
        A.man('FIC-CF', o.cf);
      }
    },
    /* LP bypass after the ICV -> CV transfer (check.js roll): the drawing presets it 33 % on the sync pulse (FF M.070F); MANUAL -10 % a
       minute to 0 (M.071D resets the FF), then R + A again */
    lpclose: {
      t: 'LP bypass: isara pagkatapos ng ICV → CV transfer, tapos R + A',
      run(o) {
        if (bit('I.0418') < 0.5) return;
        if (bit('M.070F') > 0.5) {
          o.man = 1;
          A.man('PICHR1003', Math.max(0, mv('PICHR1003') - 10));
        } else if (o.man && !o.back && md('PICHR1003') !== 'REM') {
          A.rem('PICHR1003');
          o.back = 1;
        }
      }
    },
    /* feedwater to the main valve at the load up (check.js roll): the start-up valve LICBR1001B held (M) and shut 5 % a minute, the
       single element LICBR1001A to A SV +50 (the steam flow rises faster than the feedwater), the level master LICBR1001 M 0 % */
    fw: {
      t: 'Feedwater: lipat sa main valve (LICBR1001A), sara ng start-up valve',
      run(o) {
        if (o.a == null) {
          if (U().tb && U().tb.st === 'load') {
            o.suv = mv('LICBR1001B');
            A.man('LICBR1001B', o.suv);
            A.auto('LICBR1001A', 50);
            A.man('LICBR1001', 0);
            o.a = 1;
            if (CO.lvl) CO.lvl.off = 1;
          }
          return;
        }
        if (o.suv > 0) {
          o.suv = Math.max(0, o.suv - 5);
          A.man('LICBR1001B', o.suv);
        }
        /* after the 3-ELEMENT press: a feedwater dip under 100 T/H forces FICFW1007 back (M.0228, TON 60 s); the operator presses R and
           3-ELEMENT again (check.js) */
        if (md('LICBR1001') === 'AUTO' && h().FW() > 110 && bit('M.0228') < 0.5) {
          if (md('FICFW1007') !== 'REM') A.rem('FICFW1007');
          if (bit('M.0222') > 0.5 && PUSH['M.054E'] == null) A.push('M.054E');
        }
      }
    },
    /* 45 -> 150 MW (check.js up): boiler follow by hand until the boiler master is AUTO: HIC-BM only raised (0.5 % per 10 s at most)
       while the pressure is under 123, the TCS target up with the pressure (3 MW/min at >= 124, 1.5 at >= 121, 0.5 at >= 118) to 80 MW */
    bf: {
      t: 'Boiler follow: HIC-BM pataas at TCS target sumusunod sa pressure (hanggang 80 MW)',
      sec: 10,
      run(o) {
        if (md('HIC-BM') === 'AUTO' || md('FIC-CM') !== 'REM') return;
        const H = h(),
          P = H.MSP(),
          dP = o.p == null ? 0 : P - o.p,
          s = station('HIC-BM');
        o.p = P;
        o.n = (o.n || 0) + 1;
        o.aim = o.aim == null ? Math.max(45, H.MW()) : o.aim;
        if (o.n % 6 === 0 && o.aim < 80) {
          const st = P >= 124 ? 3 : P >= 121 ? 1.5 : P >= 118 ? 0.5 : 0;
          if (st) {
            o.aim = Math.min(80, o.aim + st);
            AN.turbine('loadup', o.aim);
          }
        }
        /* 3.2.0-beta.24: down too above 125 kg/cm2. Raised only, the pressure climbed past the MS blow-off SV 128 (PICMS1002, 4.PNG)
           once the TCS target stopped at 80 MW; the blow-off opened > 5 % (ABC-013 M.0255) and that BU-CMD (ABC-001C M.2013) held the
           boiler master MANUAL for good: the CCS handover never came */
        /* the bed first: +0.5 % under 708 C; down allowed from 712 C (3.2.0-beta.32, human run of the Training: at 80 MW, bed 728 C,
           the 730 C limit of beta.24 kept the firing up, the main steam reached 129.9 > the blow-off SV 128 and its BU-CMD (M.0255 ->
           M.2013) held HIC-BM in MANUAL; the coal trip of the drawing is at 700 C) */
        const bed = U().Tb,
          d = bed < 708 ? 0.5 : Math.max(P > 125 && bed >= 712 ? -0.5 : 0, Math.min(0.5, 0.02 * (123 - P) - 0.3 * dP + (o.aim < 80 ? 0.04 : 0)));
        if (s) s.T.rt.st[s.b.id].val = Math.max(5, Math.min(100, +s.T.rt.st[s.b.id].val + d));
      }
    },
    /* the SH spray (check.js up, PR-OPE-5002 "SERVICE MS & RH FOR TEMPERATURE CONTROL"): the inner loops A at their SV when the outlet is
       within 5 C, the inner R once the outer is within 10 C of 462 / 541 C, the outer A a minute later */
    spray: {
      t: 'SH spray: shut-off valve AUTO (DITL-32 / 33 / 35), TICBR1130 / 1150 A → R, tapos TICBR1140 / TICMS1004 A (cascade)',
      run(o) {
        const H = h();
        /* 3.2.0-beta.23 (PR-OPE-5002 "Control MST and RHT by servicing MS and RH Desuperheater"): the spray water shut-off valves in AUTO
           MODE (row 5, CRT M.1012 / M.1022): the DITL opens them above 380 C at the SH no. 2 inlet. Shut, ABC-011 / 012 I.0011 / I.0013
           SOV CLOSED keeps the spray valve closed and the main steam went to 600 C at 150 MW */
        /* 3.2.0 P1 #5: the second valve of each SH spray (XV-FW1111-2 / XV-FW1121-2, machine instances #B) too: the plant gives spray water
           only through the open shut-off valves (unit.js U.spr) */
        if (WL() && !o.sov) o.sov = ['DITL-32', 'DITL-32 #B', 'DITL-33', 'DITL-33 #B', 'DITL-35'].map(n => window.LS_DOCK && LS_DOCK.dset && LS_DOCK.dset(n, 4, 1)).every(Boolean);
        for (const [k, inn, out, sv2] of [
          ['ABC-011', 'TICBR1130', 'TICBR1140', 462],
          ['ABC-012', 'TICBR1150', 'TICMS1004', 541]
        ].map(r => (r[0] === 'ABC-012' && TC().step >= -1 && TC().step < 6 && !(U().tb && U().tb.st === 'load') ? [r[0], r[1], r[2], 410] : r))) {
          /* 3.2.0-beta.38: until the LOAD UP the main steam is held at 410 C for the turbine (PR-OPE-5002 8254 MS 400 C; ATS Fig. 2 at a
             cold HP metal: MSV inlet 305 ~ 420 C; FHI Fig. 2: 415 C from the roll to the transfer) */
          /* 3.2.0-beta.23: with the one world the spray waits for its shut-off valve (DITL-32 / 33 out 73 SOV CLOSED = 0); a station that
             the drawing put back to MANUAL (force manual while the valve was still shut, CLAUDE.md rule 10) is taken again from the start */
          if (WL() && dOut(k === 'ABC-011' ? 'DITL-32' : 'DITL-33', 22) === 1) continue;
          if (o[inn] && o[inn].a != null && md(inn) === 'MAN') o[inn] = {};
          const q = o[inn] || (o[inn] = {}),
            c = H.ctl(k, inn),
            sv = c && c.q.sv != null ? +H.sh(k).rt.v[c.q.sv] : NaN;
          /* 3.2.0-beta.37 (CHECKLIST 0.5c, MST 565 C at 120 MW in the load up): the inner loop in AUTO at once at its own
             set point. Before, it waited for its PV within 5 C of its SV: TICBR1150 stayed MANUAL with the spray shut (PV 415 C)
             while the main steam was already 534 ~ 551 C at 80 MW, and the cascade came in only at about 120 MW. A controller at
             its SV with the PV under it keeps the spray shut, so nothing moves until the steam needs it */
          if (q.a == null) {
            H.autoSv(k, inn, sv);
            q.a = 1;
          }
          /* 3.2.0-beta.37: until the cascade, the operator holds the outlet by the inner set point: SV = spray outlet now + (outlet SV -
             outlet now), once a minute (the pickup of the next superheater is the gap between the two headers). The cascade (inner R,
             outer A a minute later) comes near full steam (>= 85 % of the anchor flow) with the outlet within 5 C. Put on earlier, the
             outer PI (TICMS1004 I 1371 s, parameter summary) integrated up below 60 % MCR (Fig. 6 / 10: the temperature is under its set
             point there by design) and the spray stayed shut while the load came up: 574 C at 103 MW, 559 C at 99 MW */
          const pvi = H.pv(k, inn),
            pvo = H.pv(k, out);
          if (q.a != null && q.r == null && isFinite(pvi) && isFinite(pvo)) {
            /* roadmap 2 batch 3: while the load comes up the operator aims 6 C under the set point (the pickup of the next superheater grows
               before the spray answers: 550 C at 79 MW in the code trace) */
            /* final mouse Cold run of batch 3: 550.2 C at 79.7 MW in the boiler follow ramp 45 -> 80 MW (H alarm 548): the operator aims
               a further 2 C under per MW a minute of load rise (at most 8 C more) */
            const mwN = +H.MW() || 0,
              rise = q.mwP != null ? Math.max(0, mwN - q.mwP) : 0;
            q.mwP = mwN;
            const want = Math.max(300, Math.min(sv2, pvi + (sv2 - (U().tb && U().tb.st === 'load' ? 6 + Math.min(8, 2 * rise) : 0) - pvo)));
            if (q.sv == null || Math.abs(want - q.sv) >= 1) {
              H.autoSv(k, inn, Math.round(want));
              q.sv = Math.round(want);
            }
          }
          /* 3.2.0-beta.39 (roadmap 2): the cascade at 60 % MCR (276 T/H), where the spray starts to be needed (boiler manual Fig 10), with
             the outlet within 5 C. With the SH chain of unit.js the main steam came to 553 C at 96 MW in the code trace while the
             operator still held it by the inner set point (cascade only at 85 % of the anchor flow, about 130 MW) */
          if (q.a != null && q.r == null && H.MSF() >= 0.6 * (+U().mcr || 460) && Math.abs(pvo - sv2) <= 8) {
            /* roadmap 2 batch 3 (mouse Cold run: 549.7 C at 80 MW right at the cascade): bumpless, the outer station is first set by hand
               to the inner set point now (outer MV 0 ~ 100 % = inner SV 0 ~ 600 C: ABC-011 / 012 MV 65.6 / 69.7 % = 393.6 / 418.2 C) */
            const isv = q.sv != null ? q.sv : sv;
            if (isFinite(isv)) H.man(k, out, Math.round((isv / 6) * 10) / 10);
            H.rem(k, inn);
            q.r = simT();
          }
          if (q.r != null && q.o == null && simT() >= q.r + 60) {
            H.autoSv(k, out, sv2);
            q.o = 1;
          }
          /* 3.2.0-beta.39 (roadmap 2, code trace: main steam 552 ~ 554 C from 115 to 150 MW in the CCS load up, H alarm 548): the outer PI
             (TICMS1004 I 1371 s, parameter summary) unwinds slower than the load up (3 MW a minute). The operator lowers the outer set
             point while the outlet is 4 C over it and puts it back once it is at the set point again */
          /* roadmap 2 batch 3 (code trace: 549 ~ 553 C from 97 to 145 MW with the set point at 533): the finishing superheater pickup grows
             with the load faster than the outer integral, so the operator lowers the set point by three times the excess (at most 30 C) */
          if (q.o != null) {
            const lo = isFinite(pvo) && pvo > sv2 + 3 ? Math.round(Math.max(sv2 - 30, sv2 - 3 * (pvo - sv2))) : null;
            if (lo != null && (!q.lo || lo < q.lo - 1)) {
              H.autoSv(k, out, lo);
              q.lo = lo;
              q.loT = simT();
            } else if (q.lo && isFinite(pvo) && pvo <= sv2 && simT() - (q.loT || 0) >= 60) {
              /* back to the set point 2 C a minute: put back at once, the proportional kick of the outer PI shut the spray and the
                 outlet swung 540 ~ 553 C at 150 MW */
              const nx = Math.min(sv2, q.lo + 2);
              H.autoSv(k, out, nx);
              q.lo = nx >= sv2 ? 0 : nx;
              q.loT = simT();
            }
          }
        }
      }
    },
    /* 3.2.0-beta.38 (PR-OPE-5002 8042 "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV"; ATS 1.6 / 1.72:
       reheat 415 ~ 425 C at a cold reheat bowl): before the transfer the RH spray cannot open (DITL-35), the reheat outlet is held by
       the RH flue gas biasing damper HICHR1002A (MAN, >= 10 %), 5 % a minute. The step that the damper moves is learned from the answer
       of the reheat (one minute later), not assumed */
    rhbias: {
      t: 'Reheat 415 ~ 425 °C sa biasing damper HICHR1002A (RH)',
      run(o) {
        const T = TC().crit && TC().crit['1.6'] ? +TC().crit['1.6'].val : NaN;
        if (!isFinite(T) || TC().step >= 5) return; /* on the grid the reheat follows the load (Fig. 2) */
        /* 3.2.0-beta.40 (roadmap 2, ABC-020): more RH damper = more flue gas through the RH pass = hotter reheat (TICHR1002A ACT R, LN7
           and LN8 rising; plant.js reads the damper opening HICHR1002A.MV). Before, the sign was learned from the reheat one minute later:
           the reheat drifts by itself with the firing and the bypass, so a drift could teach the wrong sign and drive the damper the wrong
           way (mouse Cold run: RHT 390 ~ 414 C, ATS 1.6 short, before the roll) */
        o.sg = 1;
        const want = T > 423 ? -1 : T < 417 ? 1 : 0,
          x = setOf('HICHR1002A');
        if (want && isFinite(x)) {
          const nx = Math.max(10, Math.min(100, x + 5 * want * o.sg));
          if (nx !== x) {
            A.man('HICHR1002A', nx);
            A.man('HICHR1002B', 100 - nx);
          }
        }
        o.T0 = T;
      }
    },
    /* the O2 trim AICFG112 is forced MANUAL under 220 T/H (M.0102): held at 50 % (neutral, LN15) by hand, 1 % a step */
    o2trim: {
      t: 'O₂ trim AICFG112 sa 50 % habang naka-force manual (< 220 T/H)',
      sec: 10,
      run() {
        const H = h(),
          S2 = H.sh('ABC-002'),
          c = H.ctl('ABC-002', 'AICFG112');
        if (!c || S2.rt.st[c.amt.id].pk !== 'B' || c.manNet == null) return;
        const m = +S2.rt.ext[c.manNet];
        if (isFinite(m)) S2.rt.ext[c.manNet] = m + Math.max(-1, Math.min(1, 50 - m));
      }
    }
  };

  /* ---------- the steps ---------- */
  const STAGES = ['Utilities', 'Tubig: hotwell, deaerator, drum', 'Fans at draft', 'Furnace purge', 'Burner at pag-init', 'Vacuum at seals', 'Bypass at 61 kg/cm²', 'Turbine: roll, sync, 45 MW', 'Coal sa 45 MW', 'Load up sa 150 MW', 'Practice: load change'];
  const B = () => L().B;
  /* a motor button: START / STOP of its running memory (memory list), the same address the Inputs list forces */
  const mot = (a, l) => ({ ad: a, l: 'START ' + l, f: () => A.motor(a, 1), on: () => bit(a) > 0.5, stop: { l: 'STOP ' + l, f: () => A.motor(a, 0) } });
  const btn = (l, f, on) => ({ l, f, on });
  /* a motor that the old (no one world) way starts with an extra forced memory (feeder C + M.3405 ALL IN REMOTE AND RUNNING) */
  const WLm = (a, l, fOff) => Object.assign(mot(a, l), { f: () => (WL() ? A.motor(a, 1) : fOff()) });
  /* a push button / an output of a DITL drawing (one world ON, src/ui/training/dock.js) */
  const dPress = (nm, row) => !!(window.LS_DOCK && LS_DOCK.dpress && LS_DOCK.dpress(nm, row));
  const dOut = (nm, row) => (window.LS_DOCK && LS_DOCK.dout ? LS_DOCK.dout(nm, row) : null);
  const dRun = nm => (window.LS_DOCK && LS_DOCK.runOut ? LS_DOCK.runOut(nm) : null);
  /* 3.2.0-beta.23: a condition read on the DITL while the one world runs (w), else the ABC / plant condition (o) */
  const WL = () => !!(window.WORLD && WORLD.on && WORLD.live);
  const DW = (w, o) => ({
    get sig() {
      return (WL() ? w : o).sig;
    },
    res: () => (WL() ? w : o).res(),
    ok: () => (WL() ? w : o).ok(),
    now: () => (WL() ? w : o).now(),
    get want() {
      return (WL() ? w : o).want;
    },
    get go() {
      return (WL() ? w : o).go;
    }
  });
  /* 3.2.0-beta.23 the start-up burners on the DITL (one world): burner A = DITL-12 (B / C / D = DITL-12A / B / C), its CRT push buttons on
     DITL-09 (machine instances #B ~ #D): row 9 BURNER ON, row 11 BURNER OFF; out 8 READY, out 20 IN SERVICE (-> ABC M.3412 ...). The
     light-off needs the burner S.A. damper at the ignition position (ABC-003A M.3124: AI0291 14 ~ 18 %) and the oil FCV at the
     ignition position (M.312C: 23 ~ 27 %), DITL-07 PERMISSION TO START IGNITER / BURNER */
  const BR = { A: ['DITL-12', 'DITL-09', 'FICFA1043A', 'FICDO1043A'], B: ['DITL-12A', 'DITL-09 #B', 'FICFA1043B', 'FICDO1043B'], C: ['DITL-12B', 'DITL-09 #C', 'FICFA1043C', 'FICDO1043C'], D: ['DITL-12C', 'DITL-09 #D', 'FICFA1043D', 'FICDO1043D'] };
  const inSvc = L => dOut(BR[L][0], 19) === 1;
  const bIgn = L => btn('SA damper ' + L + ' 16 %, oil FCV ' + L + ' 25 % (ignition)', () => (A.man(BR[L][2], 16), A.man(BR[L][3], 25)), () => inSvc(L) || (mv(BR[L][2]) >= 14 && mv(BR[L][2]) <= 18 && mv(BR[L][3]) >= 23 && mv(BR[L][3]) <= 27));
  /* dg = the DITL sheet and row where the operator presses it (the Training dock opens it there, 3.2.0-beta.26) */
  const bOn = L => ({ ad: BR[L][0] + '@7', dg: [BR[L][1], 8], l: 'BURNER ' + L + ' ON (DITL-09)', f: () => dPress(BR[L][1], 8), on: () => inSvc(L) });
  const bOil = (L, p) => btn(BR[L][3] + ' M ' + p + ' %', () => (inSvc(L) ? A.man(BR[L][3], p) : ''), () => inSvc(L) && mv(BR[L][3]) >= p - 5);
  const bOff = L => btn('BURNER ' + L + ' OFF (DITL-09)', () => dPress(BR[L][1], 10), () => dOut(BR[L][0], 19) === 0);
  /* 3.2.0-beta.23 coal feeder outlet discharge valve (DITL-20 row 6 OPEN P.B. -> SV-CL1061-A, out 6 OPENED): a start permissive of the
     feeder (DITL-19 row 14); feeder B / C = machine instances #B / #C. Without the one world: nothing to do (the ABC has no such signal) */
  const fDis = L => {
    const nm = 'DITL-20' + (L === 'A' ? '' : ' #' + L);
    return Object.assign(btn('Feeder ' + L + ' discharge valve OPEN (DITL-20)', () => (WL() ? dPress(nm, 5) : ''), () => !WL() || dOut(nm, 5) === 1), { dg: [nm, 5] });
  };
  /* 3.2.0 P1 #3 / #4: the MOVs of the DITL-38 table (one machine each, src/world/world.js W.MCV): row 5 OPEN P.B., row 11 CLOSE P.B.; the
     position of the DITL valve model. Without the one world nothing to do (the plant then takes the valve as open) */
  const mcvS = tag => (typeof S !== 'undefined' ? S.sheets.concat((window.WORLD && WORLD.inst) || []).find(x => x._inst && x._inst.lbl === tag) : null);
  const mcvPos = tag => {
    const x = mcvS(tag);
    return x && typeof MST !== 'undefined' && MST[x.name] && MST[x.name][0] ? +MST[x.name][0].pos : 0;
  };
  const mcvB = (tag, open) => {
    const x = mcvS(tag),
      nm = x ? 'DITL-38 #' + tag : '';
    return Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (DITL-38)', () => (WL() && x ? dPress(x._inst.k ? nm : 'DITL-38', open ? 4 : 10) : ''), () => !WL() || (open ? mcvPos(tag) >= 100 : mcvPos(tag) <= 0)),
      { dg: [x && x._inst.k ? nm : 'DITL-38', open ? 4 : 10], ad: x && x._inst.k ? nm : 'DITL-38' }
    );
  };
  /* P2 #13: a single-valve MOV drawing (DITL-54 start-up ejector MV-AS1395, DITL-55 steam jet air ejector MV-AS1396, DITL-56 vacuum
     breaker MV-AV1391): OPEN / CLOSE P.B. rows of the drawing (0-based), the position of the DITL valve model */
  const movS = nm => (typeof S !== 'undefined' ? S.sheets.find(x => x.name.endsWith(')' + nm)) : null);
  const movPos = nm => {
    const x = movS(nm);
    return x && typeof MST !== 'undefined' && MST[x.name] && MST[x.name][0] ? +MST[x.name][0].pos : 0;
  };
  const movB = (nm, tag, open, ro, rc) =>
    Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (' + nm + ')', () => (WL() ? dPress(nm, open ? ro : rc) : ''), () => !WL() || (open ? movPos(nm) >= 100 : movPos(nm) <= 0)),
      { dg: [nm, open ? ro : rc], ad: nm }
    );
  const mcvC = (want, f) => C(want, () => !WL() || f(), () => (WL() ? W_MCV().map(t => t.replace('MV-', '') + ' ' + mcvPos(t).toFixed(0) + '%').join(', ') : '— (one world OFF)'));
  const W_MCV = () => ['MV-FW1001', 'MV-FW1391', 'MV-FW1002', 'MV-FW1392', 'MV-MS1391', 'MV-MS1392'];
  const dTxt = (nm, row, on, off) => () => (dOut(nm, row) === 1 ? on : dOut(nm, row) === 0 ? off : '— (one world OFF)');
  /* a motor of a DITL drawing with no running memory on the ABC sheets: START / STOP from its drawing, its interlock in the card */
  const dmot = (nm, l) => ({ ad: nm, l: 'START ' + l, f: () => LS_DOCK && LS_DOCK.dmotor(nm, 1), on: () => dRun(nm) === 1, stop: { l: 'STOP ' + l, f: () => LS_DOCK && LS_DOCK.dmotor(nm, 0) } });
  /* the field items of procedure sections (0-based): the FIELD and TCS steps the operator confirms */
  const fieldOf = secs => {
    const out = [];
    for (const si of secs)
      (PROC()[si] ? PROC()[si].s : []).forEach((x, i) => {
        let k = 'field';
        try {
          k = L().kind(si, i).k;
        } catch (e) {}
        if (k !== 'auto') out.push(x.t);
      });
    return out;
  };
  let ST = null;
  function steps() {
    if (ST) return ST;
    const b = B(),
      R = b.RUN;
    const FIELD = (st, title, secs, extra) => Object.assign({ st, field: secs, need: 1, t: title, d: 'Ang mga ito ay ginagawa ng field operator (lokal na valve, gauge, panel). Walang DCS signal ang mga ito, kaya kumpirmahin lang kapag tapos na.' }, extra || {});
    ST = [
      /* ---- 0 utilities ---- */
      FIELD(0, 'ESP purge air heater at fan (field)', [0]),
      { st: 0, sec: 2, t: 'Simulan ang unang seawater pump (SWP)', d: 'Ang seawater ang nagpapalamig sa condenser at sa cooling water ng planta. Ito ang unang tumatakbo sa start-up.', c: R.SWP1, a: [mot('M.3353', 'SWP-A'), mot('M.3354', 'SWP-B'), mot('M.3355', 'SWP-C')], field: [1] },
      { st: 0, sec: 2, t: 'Simulan ang pangalawang SWP', d: 'Dalawang SWP ang kailangan para sa condenser bago ang vacuum at ang turbine.', c: b.SWP2, a: [mot('M.3353', 'SWP-A'), mot('M.3354', 'SWP-B'), mot('M.3355', 'SWP-C')] },
      FIELD(0, 'Hypochlorite, debris filter, booster pump, make-up water, cooling water, instrument at plant air (field)', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
      FIELD(0, 'Pre-start check, turbine oil pumps, oil purifier, control oil, rotary air pre-heater (field / TCS)', [12, 13, 14, 15, 16]),
      /* ---- 1 water ---- */
      FIELD(1, 'Hotwell filling line-up (field)', [17]),
      { st: 1, sec: 18, t: 'Hotwell level control LCV-MU1110 sa AUTO', d: 'Ang make-up valve na ang hahawak ng level ng hotwell ng condenser.', c: b.MODE('LCV-MU1110', 'AUTO'), fps: ['LCV-MU1110'], a: [btn('A (AUTO)', () => A.auto('LCV-MU1110'))] },
      { st: 1, sec: 18, t: 'Condensate recirculation FCV-CD1120: MANUAL, MV 60 %', d: 'Bukas muna ang recirculation para may daloy ang condensate pump pagsimula nito.', c: b.ALL(b.MODE('FCV-CD1120', 'MAN'), b.MV('FCV-CD1120', 55, 65)), fps: ['FCV-CD1120'], a: [btn('M, MV 60 %', () => A.man('FCV-CD1120', 60))] },
      { st: 1, sec: 18, t: 'Simulan ang condensate pump (CEP)', d: 'Ang CEP ang nagpapadala ng tubig mula sa hotwell papunta sa deaerator. Kailangan din ito sa vacuum mamaya.', c: R.CEP, a: [mot('M.3350', 'CEP-A'), mot('M.3351', 'CEP-B')] },
      { st: 1, sec: 18, t: 'FCV-CD1120 sa AUTO, SV 150 T/H', d: 'Ang recirculation na ang hahawak ng minimum flow ng CEP.', c: b.ALL(b.MODE('FCV-CD1120', 'AUTO'), b.SV('FCV-CD1120', 140, 160, 'T/H')), fps: ['FCV-CD1120'], a: [btn('A, SV 150 T/H', () => A.auto('FCV-CD1120', 150))] },
      { st: 1, sec: 19, t: 'Deaerator level LCV-CD1104 sa AUTO, SV 0 mm', d: 'Pupunuin ang deaerator hanggang normal level at hahawakan ito ng valve.', c: b.ALL(b.MODE('LCV-CD1104', 'AUTO'), b.SV('LCV-CD1104', -20, 20, 'mm')), fps: ['LCV-CD1104'], a: [btn('A, SV 0 mm', () => A.auto('LCV-CD1104', 0))], field: [18] },
      { st: 1, sec: 20, t: 'Simulan ang boiler feedwater pump (BFWP)', d: 'Ang BFWP ang magpupuno ng steam drum. Kailangan munang may tubig ang deaerator.', c: R.BFP, a: [mot('M.3343', 'BFWP-A'), mot('M.3344', 'BFWP-B')] },
      /* 3.2.0 P1 #4 (PR-OPE-5002 BFP start-up 4165 / 4176): the feedwater reaches the drum only through the discharge MOV of the pump */
      {
        st: 1,
        sec: 20,
        t: 'BFWP discharge: equalizing MOV MV-FW1391 OPEN, tapos main discharge MOV MV-FW1001 OPEN',
        d: 'PR-OPE-5002: dahan-dahang buksan ang equalizing MOV ng napiling BFP (MV-FW1391 / MV-FW1392) para pumantay ang pressure. Kapag discharge pressure > 200 kg/cm², buksan ang main discharge MOV (MV-FW1001 / MV-FW1002) nang 100 %, tapos isara ang equalizing MOV. Sarado ang dalawa: walang feedwater na makakarating sa drum.',
        c: mcvC('Main discharge MOV open, equalizing MOV closed', () => (mcvPos('MV-FW1001') >= 100 && mcvPos('MV-FW1391') <= 0) || (mcvPos('MV-FW1002') >= 100 && mcvPos('MV-FW1392') <= 0)),
        a: [mcvB('MV-FW1391', 1), mcvB('MV-FW1001', 1), mcvB('MV-FW1391', 0)]
      },
      { st: 1, sec: 20, t: 'Steam drum filling: start-up valve FCV-FW1130-2 sa MANUAL, level −150 mm', d: 'Bubuksan nang dahan-dahan ang start-up valve para mapuno ang drum hanggang −150 mm, tapos isasara (MV 0 %) para hindi umapaw. Sa Cold ng app ay puno na ang drum (mga 0 mm), kaya M at MV 0 % na agad.', c: b.ALL(b.MODE('FCV-FW1130-2', 'MAN'), b.MV('FCV-FW1130-2', null, 2), b.HOLD(10, b.VAL('lvl', -200, 100))), fps: ['FCV-FW1130-2'], a: [btn('M, MV 0 % (puno na)', () => A.man('FCV-FW1130-2', 0))], field: [19] },
      /* ---- 2 fans ---- */
      { st: 2, sec: 21, t: 'Diesel oil pump at oil circulation (field)', d: 'Ang diesel oil pump ay nasa field (walang DCS signal). Kailangan ito ng mga start-up burner. Bantayan ang outlet oil pressure (PICDO0005).', fps: ['PICDO0005'], c: C('Diesel oil pump running (field)', () => !!(AN.fieldState && AN.fieldState().dop), () => 'Diesel oil pump ' + (AN.fieldState && AN.fieldState().dop ? 'ON' : 'OFF')), a: [btn('START diesel oil pump (field)', () => A.field('dop', true), () => !!(AN.fieldState && AN.fieldState().dop))], field: [20] },
      { st: 2, sec: 22, t: 'Ihanda ang IDF: PICFG108 sa MANUAL, MV 0 %, biasing damper RH at SH bukas', d: 'Sarado ang hydraulic coupling ng IDF bago ito simulan (mababang starting current). Ang interlock ng IDF (DITL-25A row 1) ay humihingi ng bukas na flue gas bias damper (HICHR1002A / B) para may daanan ang hangin.', c: b.ALL(b.MODE('PICFG108', 'MAN'), b.MV('PICFG108', null, 2), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null)), fps: ['PICFG108', 'HICHR1002A', 'HICHR1002B'], a: [btn('M, MV 0 %', () => A.man('PICFG108', 0)), btn('Biasing damper RH at SH 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))], field: [21] },
      { st: 2, sec: 22, t: 'Simulan ang ID fan (IDF)', d: 'Ang IDF ang humihigop ng flue gas palabas ng furnace. Ito ang unang fan na tumatakbo.', c: R.IDF, a: [mot('M.3304', 'IDF')] },
      { st: 2, sec: 22, t: 'IDF hydraulic coupling: PICFG108 MV 13 %', d: 'Buksan ang coupling sa 13 %. Negatibo ang furnace pressure (hinihigop palabas).', c: b.ALL(R.IDF, b.MV('PICFG108', 10, 16)), fps: ['PICFG108'], a: [btn('MV 13 %', () => A.man('PICFG108', 13))] },
      /* 3.2.0-beta.23: the FAB start permissive FCD READY (DITL-28A row 5 <- 28B out 77 = ABC-014 M.3115 inlet FCD demand at 25 % AND
         DITL-28C the silencer SOV opened); without the one world the step is done at once (the DITL is not running) */
      {
        st: 2,
        sec: 23,
        t: 'Ihanda ang FAB: buksan ang silencer SOV, FAB inlet damper FICFA1055A M 25 %',
        d: 'Ang interlock ng FAB (DITL-28A row 5 FCD READY) ay humihingi ng bukas na "TO SILENCE SOV" (DITL-28C, OPEN P.B.) at ng inlet damper demand na 25 % (ABC-014).',
        c: b.ALL(b.MODE('FICFA1055A', 'MAN'), b.MV('FICFA1055A', 20, 30), C('Silencer SOV opened (DITL-28C)', () => dOut('DITL-28C', 21) !== 0, () => 'SOV ' + (dOut('DITL-28C', 21) === 1 ? 'OPENED' : dOut('DITL-28C', 21) === 0 ? 'sarado' : '— (one world OFF)'))),
        fps: ['FICFA1055A'],
        a: [btn('Silencer SOV OPEN (DITL-28C)', () => dPress('DITL-28C', 0), () => dOut('DITL-28C', 21) !== 0), btn('FICFA1055A M 25 %', () => A.man('FICFA1055A', 25))]
      },
      { st: 2, sec: 23, t: 'Simulan ang fluidizing air blower (FAB)', d: 'Ang FAB ang nagbibigay ng hangin sa seal pot ng cyclone loop.', c: R.FAB, a: [mot('M.3308', 'FAB-A'), mot('M.3309', 'FAB-B')], field: [22] },
      { st: 2, sec: 24, t: 'Simulan ang secondary air fan (SAF)', d: 'Sarado (0 %) muna ang SA damper bago simulan ang fan.', c: R.SAF, a: [btn('SA damper 0 %', () => A.man('FICFA1081', 0)), mot('M.3303', 'SAF')], fps: ['FICFA1081'], field: [23] },
      /* 3.2.0-beta.23: the PAF start interlock DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED" = 0 (DITL-24): a lube oil pump first */
      { st: 2, sec: 25, t: 'Simulan ang PAF lube oil pump A (DITL-24)', d: 'Hindi aandar ang PAF kapag walang tumatakbong lube oil pump (DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED"). Walang DCS memory ito sa ABC, kaya sa DITL-24 ito pinapaandar.', c: C('PAF lube oil pump A running (DITL-24)', () => dRun('DITL-24') !== 0, () => (dRun('DITL-24') === 1 ? 'RUNNING' : dRun('DITL-24') === 0 ? 'STOPPED' : '— (one world OFF)')), a: [dmot('DITL-24', 'PAF LO pump A')] },
      { st: 2, sec: 25, t: 'Simulan ang primary air fan (PAF)', d: 'Sarado (0 %) muna ang PA damper bago simulan ang fan.', c: R.PAF, a: [btn('PA damper 0 %', () => A.man('FICFA1071', 0)), mot('M.3302', 'PAF')], fps: ['FICFA1071'], field: [24] },
      { st: 2, sec: 26, t: 'Purge air: PA at SA damper 35 %, total air > 25 % MCR (115 T/H)', d: 'Kailangan ng sapat na hangin para malinis ang furnace bago magsindi.', c: b.HOLD(10, b.PURGE_AIR), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA at SA MV 35 %', () => (A.man('FICFA1071', 35), A.man('FICFA1081', 35)))] },
      { st: 2, sec: 22, t: 'Furnace pressure −15 mmH₂O sa IDF coupling', d: 'Ayusin ang PICFG108 MV hanggang −25 ~ −5 mmH₂O. Mula rito, ang coach ang humahawak dito (puwede mong patayin ang coach at ikaw ang humawak) hanggang maging AUTO sa dulo.', c: b.HOLD(30, b.VAL('FP', -25, -5)), fps: ['PICFG108'], coach: ['fp'] },
      /* ---- 3 purge ---- */
      {
        st: 3,
        sec: 26,
        t: 'Purge permissives: lahat ng fan tumatakbo, walang coal, walang apoy, biasing damper bukas',
        d: 'Ito ang mga kondisyon ng drawing bago magsimula ang purge. RH damper ≥ 30 % at SH damper ≥ 60 %.',
        c: b.ALL(R.IDF, R.SAF, R.FAB, R.PAF, b.NOFEED, b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'no start-up burner'), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null), DW(C('Furnace purge ready (DITL-02 out 10)', () => dOut('DITL-02', 9) === 1, dTxt('DITL-02', 9, 'PURGE READY', 'purge not ready')), b.MFT)),
        fps: ['HICHR1002A', 'HICHR1002B'],
        a: [btn('Biasing damper RH at SH 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))],
        field: [25]
      },
      /* 3.2.0-beta.23: with the one world the purge is the drawing's: DITL-02 row 6 FURNACE PURGE START P.B. -> 5 min -> out 16 FURNACE
         PURGE COMPLETED -> DITL-03A row 21 resets the MFT (I.000F 0) */
      {
        st: 3,
        sec: 26,
        t: 'Furnace purge: 5 minuto',
        d: 'Pindutin ang FURNACE PURGE START (DITL-02). Hawakan ang hangin nang 5 minuto. Kapag may nawala (fan huminto, hangin bumaba), uulit ang bilang. Pagkatapos ng 5 minuto, ang "PURGE COMPLETED" ang nagre-reset ng MFT (DITL-03A row 21).',
        c: DW(b.ALL(C('Purge completed, MFT reset (DITL-03A out 13 = 0)', () => dOut('DITL-03A', 12) === 0, () => (dOut('DITL-03A', 12) === 0 ? 'MFT RESET' : dOut('DITL-02', 5) === 1 ? 'purge in progress' : 'MFT, purge not started')), b.MFT), b.HOLD(300, b.ALL(R.IDF, R.PAF, R.SAF, b.PURGE_AIR, b.NOFEED))),
        a: [btn('FURNACE PURGE START (DITL-02)', () => dPress('DITL-02', 5), () => dOut('DITL-02', 5) === 1 || dOut('DITL-03A', 12) === 0)],
        wait: 1
      },
      { st: 3, sec: 26, t: 'Biasing damper: RH 10 %, SH 90 %', d: 'Pagkatapos ng purge, karamihan ng flue gas ay sa SH side muna.', c: b.ALL(b.MV('HICHR1002A', 5, 15), b.MV('HICHR1002B', 85, 95)), fps: ['HICHR1002A', 'HICHR1002B'], a: [btn('RH 10 %, SH 90 %', () => (A.man('HICHR1002A', 10), A.man('HICHR1002B', 90)))] },
      /* ---- 4 burners and warm-up ---- */
      { st: 4, sec: 28, t: 'Sindihan ang burner A', d: 'SA damper at oil FCV sa ignition, tapos BURNER ON (DITL-09): ang DITL ang magpapasok ng igniter, magbubukas ng dalawang supply oil valve at magsisindi (DITL-10 / 13). Kapag may apoy na, ang oil flow FICDO1043A sa 60 %.', c: b.ALL(b.BIT('M.3412', 1, 'burner A in service'), b.VAL('oilF', 0.3, null)), fps: ['FICDO1043A'], get a() {
          return WL() ? [bIgn('A'), bOn('A'), bOil('A', 60)] : [btn('Buksan oil valve A', () => A.oil('M.3410', true)), btn('BURNER A ON', () => A.motor('M.3412', 1), () => bit('M.3412') > 0.5), btn('FICDO1043A M 60 %', () => A.man('FICDO1043A', 60))];
        }, field: [27] },
      { st: 4, sec: 28, t: 'Sindihan ang burner D (diagonal ng A)', d: 'PR-OPE-5002: pagkatapos ng A, ang kasunod ay ang D (diagonal). Pareho ng burner A: SA damper at oil FCV sa ignition, BURNER ON (ang DITL ang magbubukas ng oil valve), tapos FICDO1043D 60 %.', c: b.ALL(b.BIT('M.3419', 1, 'burner D in service'), b.MV('FICDO1043D', 50, null)), fps: ['FICDO1043D'], get a() {
          return WL() ? [bIgn('D'), bOn('D'), bOil('D', 60)] : [btn('Buksan oil valve D', () => A.oil('M.3417', true)), btn('BURNER D ON', () => A.motor('M.3419', 1), () => bit('M.3419') > 0.5), btn('FICDO1043D M 60 %', () => A.man('FICDO1043D', 60))];
        } },
      { st: 4, sec: 28, t: 'Hangin sa minimum: PA at SA damper 10 %', d: 'Bawasan ang hangin pagkatapos magsindi para hindi lumamig ang furnace.', c: b.ALL(b.MV('FICFA1071', null, 12), b.MV('FICFA1081', null, 12)), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA at SA MV 10 %', () => (A.man('FICFA1071', 10), A.man('FICFA1081', 10)))], coach: ['fire'] },
      { st: 4, sec: 28, t: 'Pag-init: hintayin kumulo ang tubig (100 °C)', d: 'Habang umiinit, ang coach ang humahawak ng apoy para ang pagtaas ng temperatura ay ≤ 110 °C bawat oras (Fig 1). Pabilisin ang simulation kung gusto mo.', c: b.VAL('Tw', 100, null), wait: 1 },
      { st: 4, sec: 28, t: 'Drum pressure 2 kg/cm²: isara ang vents at drains (field)', d: 'Kapag may pressure na, isinasara ng field operator ang mga vent at drain ng steam side.', c: b.VAL('Pd', 2, null), wait: 1, field: [] },
      { st: 4, sec: 28, t: 'Drum pressure 15 kg/cm²: sindihan ang burner B at C', d: 'Sa 15 kg/cm² idinadagdag ang dalawa pang burner: SA damper at oil FCV sa ignition, BURNER ON (ang DITL ang magbubukas ng oil valve), tapos FICDO1043B / C 20 % (PR-OPE-5002: B / C pagkatapos ng 30 minuto).', c: b.ALL(b.VAL('Pd', 15, null), b.BURN4), fps: ['FICDO1043B', 'FICDO1043C'], get a() {
          return WL() ? [bIgn('B'), bIgn('C'), bOn('B'), bOn('C'), bOil('B', 20), bOil('C', 20)] : [btn('Buksan oil valve B at C', () => (A.oil('M.3411', true), A.oil('M.3416', true))), btn('BURNER B at C ON', () => (A.motor('M.3413', 1), A.motor('M.3418', 1)), () => bit('M.3413') > 0.5 && bit('M.3418') > 0.5), btn('FICDO1043B / C M 20 %', () => (A.man('FICDO1043B', 20), A.man('FICDO1043C', 20)))];
        } },
      /* 3.2.0 P1 #3 (PR-OPE-5002 7259: "Turbine Main Steam Motorized isolation valve (MVMS1391) is necessary to be Equalized and OPENED during
         boiler pressurization at around 20~30 ksc"): no steam reaches the MSV (ATS 1.3) and the turbine with it shut */
      {
        st: 4,
        sec: 28,
        t: 'Main steam MOV: equalizing MV-MS1392 OPEN, tapos MV-MS1391 OPEN (20 ~ 30 kg/cm²)',
        d: 'PR-OPE-5002: sa 20 ~ 30 kg/cm² ng main steam, dahan-dahang buksan ang turbine inlet equalizing MOV MV-MS1392 (5 ~ 10 minuto para pumantay ang pressure at temperatura; bantayan ang drum level), tapos buksan ang main steam MOV MV-MS1391. Kapag sarado ito, walang steam sa MSV at sa turbine.',
        c: b.ALL(b.VAL('Pd', 20, null), mcvC('MV-MS1391 open', () => mcvPos('MV-MS1391') >= 100)),
        a: [mcvB('MV-MS1392', 1), mcvB('MV-MS1391', 1)]
      },
      { st: 4, sec: 28, t: 'Drum pressure 30 kg/cm²', d: 'Hintayin ang 30 kg/cm². Ang coach pa rin ang humahawak ng bilis ng pag-init.', c: b.VAL('Pd', 30, null), wait: 1 },
      /* 3.2.0-beta.40 (roadmap 2, Cold run stall at "Bypass servicing"): PR-OPE-5002 STEAM DRUM FILLING "Ensure MS BLOW OFF VALVE (BOV)
         >10 % OPEN" and BYPASS SYSTEM SERVICING "Gradually close MS Blow off valve ... transfer steam flow to RH": the MS blow-off is
         open through the warm-up and the turbine auxiliaries, and the start-up valve keeps the drum level. Before (beta.37 ~ 39) this
         step came after the vacuum up: a closed boiler on 4 oil burners went 30 -> 131 kg/cm2 while the TCS auxiliaries were done, the
         drum level fell to -422 mm (no feed), the low-low level tripped the oil (MFT) and the bypass step waited forever (steam 0) */
      {
        st: 4,
        sec: 28,
        t: 'Pressure at level: start-up level LICBR1001B AUTO SV 0, MS blow-off PICMS1002 AUTO SV 35',
        d: 'PR-OPE-5002: bukas (≥ 10 %) ang MS blow-off valve habang umiinit. Ang blow-off (PICMS1002) ang hahawak ng main steam pressure sa 35 kg/cm² habang ginagawa ang TCS auxiliaries at vacuum, at ang start-up valve (LICBR1001B) ang hahawak ng drum level. Coal ay pagkatapos pa ng sync (FHI Fig. 2): oil burner lang hanggang 45 MW.',
        c: b.ALL(b.MODE('LICBR1001B', 'AUTO'), b.MODE('PICMS1002', 'AUTO')),
        fps: ['LICBR1001B', 'PICMS1002'],
        a: [btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0)), btn('PICMS1002 A, SV 35', () => A.auto('PICMS1002', 35))],
        coach: ['lvl']
      },
      /* ---- 5 vacuum and seals ---- */
      /* 3.2.0-beta.37 (user 2026-10-25): the aux steam (from the main steam > 12 kg/cm2), the turning gear, the gland sealing and the
         ejectors before the vacuum up (PR-OPE-5002 5708, 6118, 6512); the unit model raises the vacuum only with the aux steam */
      FIELD(5, 'Deaerator warming, condensate polisher, bed material (field)', [28, 29, 30, 31, 32, 33, 34, 35], { d: 'Mga gawain ng field operator na walang DCS / TCS signal. Ang aux steam, turning gear, gland sealing at vacuum up ay nasa TCS panel (mga susunod na hakbang).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the turbine auxiliaries on the TCS model (tcs.js): ATS criteria 1.14 ~ 1.19, PR-OPE-5002 5708 / 6118
         / 6512. Before (beta.37) one "field" confirm */
      { st: 5, sec: 31, t: 'TCS: lube oil pump, EH oil pump, MOT vapour extractor START', d: 'Kailangan ng bearing oil (ATS 1.15 / 1.16), control oil (1.14) at vapour extractor (1.18) bago ang turning gear at ang lahat ng ATS step.', c: C('Lube oil, EH oil, vapour extractor tumatakbo', () => TC().aux.lop && TC().aux.eh && TC().aux.vex, () => ['lop', 'eh', 'vex'].filter(k => !TC().aux[k]).join(', ') || 'OK'), a: [btn('LUBE OIL PUMP START', () => A.tcs('lop', 1), () => TC().aux.lop), btn('EH OIL PUMP START', () => A.tcs('eh', 1), () => TC().aux.eh), btn('VAPOUR EXTRACTOR START', () => A.tcs('vex', 1), () => TC().aux.vex)] },
      { st: 5, sec: 31, t: 'Turning gear ON (mga 3 rpm)', d: 'Umiikot nang dahan-dahan ang rotor para hindi ito bumaluktot habang umiinit (ATS 1.19 TURBINE TURNING). Kailangan ng bearing oil.', c: C('Turbine turning (≥ 1 rpm)', () => TC().aux.tg && TC().rpm >= 1, () => f1(+TC().rpm || 0) + ' rpm'), a: [btn('TURNING GEAR ON', () => A.tcs('tg', 1), () => TC().aux.tg)] },
      { st: 5, sec: 31, t: 'Aux steam: buksan ang MV-AS1391 (main steam > 12 kg/cm²)', d: 'Ang aux steam header (10 kg/cm²) ay galing sa main steam (PR-OPE-5002 5727 REQUIREMENT: MS > 12 kg/cm²). Ito ang steam ng gland seal at ng ejector.', c: C('Aux steam header > 10 kg/cm²', () => TC().Pa > 10, () => f1(+TC().Pa || 0) + ' kg/cm²'), a: [btn('MV-AS1391 OPEN', () => A.tcs('aux', 1), () => TC().aux.asv)], wait: 1 },
      { st: 5, sec: 31, t: 'Gland sealing (aux > 7 kg/cm², turning gear, vacuum breaker bukas)', d: 'PR-OPE-5002 6118: MS > 12, aux > 7 kg/cm², gland steam 220 °C, tumatakbo ang turning gear, bukas ang vacuum breaker MV-AV1391 (ATS 1.10).', c: C('Gland steam seal header normal', () => TC().aux.gland, () => (TC().aux.gland ? 'in service' : 'off')), a: [btn('GLAND STEAM IN SERVICE', () => A.tcs('gland', 1), () => TC().aux.gland)] },
      { st: 5, sec: 31, t: 'Vacuum up: isara ang vacuum breaker, ejectors (aux > 10 kg/cm²)', d: 'PR-OPE-5002 6512: tapos ang gland sealing, aux > 10 kg/cm², sarado ang vacuum breaker MV-AV1391, 1st at 2nd ejector (sa DCS: MV-AV1391 CLOSE sa DITL-56, tapos MV-AS1396 at MV-AS1395 OPEN sa DITL-55 / 54). Mga 15 minuto hanggang ≥ 90 % (ATS 1.11).', c: b.ALL(C('Condenser vacuum ≥ 90 %', () => +U().vac >= 0.9, () => f0(100 * (+U().vac || 0)) + ' %'), C('LP exhaust hood spray FVCD1904 AUTO (PR-OPE-5002 6307)', () => !!TC().aux.hsp, () => (TC().aux.hsp ? 'AUTO' : 'OFF'))), a: [movB('DITL-56', 'MV-AV1391', 0, 3, 13), movB('DITL-55', 'MV-AS1396', 1, 4, 13), movB('DITL-54', 'MV-AS1395', 1, 4, 13), btn('VACUUM UP (ejectors)', () => A.tcs('vacuum', 1), () => TC().aux.ej), btn('Hood spray FVCD1904 AUTO', () => A.tcs('hood', 1), () => !!TC().aux.hsp)], wait: 1 },
      /* ---- 6 bypass at 61 kg/cm2, oil only (3.2.0-beta.37, CHECKLIST 0.5: PR-OPE-5002 BYPASS SYSTEM SERVICING -> TURBINE ROLLING ->
         SYNCH. & INITIAL LOAD -> LOAD UP -> solid fuel; FHI SECT_7 Fig. 2 COLD STARTUP: roll at 60 kg/cm2 6 h, coal 8.6 h. Before, the
         coal and 123 kg/cm2 came before the roll and the bypass dumped 155 ~ 189 T/H) ---- */
      /* 3.2.0-beta.37: before the roll, on oil (CHECKLIST 0.5). 3.2.0-beta.23: the bypass goes in service BEFORE the coal (PR-OPE-5002: BYPASS SYSTEM SERVICING comes before the solid fuel
         firing). Before, it came after the burners were out: the blow-off alone (about 13 T/H at 35 kg/cm2) could not take the steam of
         the coal and the pressure went over 140 kg/cm2 (172 with the primary air at 280 T/H and the coal that follows it) */
      {
        st: 6,
        sec: 30,
        t: 'Bypass sa serbisyo: HP bypass A, LP bypass A SV 7.6, RH blow-off M 20 %',
        d: 'Ang HP bypass (PICMS1006) ang hahawak ng main steam pressure, ang LP bypass (PICHR1003) ang reheat pressure 7.6 kg/cm². SV ng HP bypass = pressure ngayon.',
        c: b.ALL(b.MODE('PICMS1006', 'AUTO'), b.MODE('PICHR1003', 'AUTO')),
        fps: ['PICMS1006', 'PICHR1003', 'PICHR1391'],
        a: [btn('Ilagay lahat', () => {
          /* 3.2.0-beta.38: the SV at the pressure of now (the step text), not 61 under it: at 85 kg/cm2 the bypass opened full and the
             drum level went to -300 mm (MFT, Cold run) */
          const p = Math.max(50, Math.ceil(h().MSP()));
          A.auto('PICMS1002', p > 50 ? p + 5 : 50);
          A.auto('PICMS1006', p);
          A.auto('PICHR1003', 7.6);
          A.man('PICHR1391', 20);
          A.auto('LICBR1001B', 0);
          /* 3.2.0 P1 #5: the spray water block valves of the HP / LP bypass desuperheaters in AUTO MODE (DITL-79 XV-FW1061 M.0582, DITL-66
             XV-CD1114 M.0522): the DITL opens them on the demand of TICMS1022 / TICHR1012; shut, no spray water reaches the bypass steam */
          if (WL()) ['DITL-79', 'DITL-66'].forEach(n => window.LS_DOCK && LS_DOCK.dset && LS_DOCK.dset(n, 4, 1));
          return '';
        })],
        coach: ['lvl'],
        field: [29]
      },
      { st: 6, sec: 30, t: 'Bypass servicing: MSP ≥ 48 kg/cm² at steam flow ≥ 40 T/H', d: 'Ang coach ang nagdadagdag ng oil fire, humahawak ng hangin (O₂ 3.5 ~ 8 % sa SA damper, PA 280 T/H kapag mainit na ang bed) at nagtataas ng SV ng HP bypass ng 1 kg/cm² bawat minuto hanggang 61.', c: b.ALL(b.VAL('MSP', 48, null), b.VAL('MSF', 40, null)), wait: 1, coachOff: ['fire'], coach: ['ofire', 'o2'] },
      { st: 6, sec: 30, t: 'Main steam pressure 61 kg/cm²: handa ang roll', d: 'PR-OPE-5002 (cold start): MS 61.2 kg/cm², steam flow > 40 T/H, reheat ≤ 8.5 kg/cm². Hawak ng HP bypass ang 61 at ng LP bypass ang reheat.', c: b.HOLD(120, b.ALL(b.VAL('MSP', 59, null), b.VAL('MSF', 40, null), b.VAL('RHP', null, 9))), wait: 1 },
      /* ---- 7 turbine on oil ---- */
      FIELD(7, 'Field checks bago ang roll: drains, TCS lamps, turbine area (field)', [36, 37, 38, 39], { d: 'Mga gawain ng field operator. Ang ATS steps ay nasa TCS panel (mga susunod na hakbang).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the ATS steps of the TCS model (tcs.js; ATS Sequence 310SC90-775, Criteria 310SC90-776). Before
         (beta.37) one ROLL button: 0 -> 3600 rpm in 30 min with no criteria */
      { st: 7, sec: 41, t: 'ATS step 0: HP TURBINE WARMING', d: 'ATS page 13: kapag ≤ 150 °C ang HP first stage metal, pinapainit ito ng steam sa CV (B) hanggang > 150 °C. Kailangan: gland seal, vacuum, bearing oil, turning gear (CRITERIA A0).', c: C('HP turbine warming tapos (HP metal > 150 °C)', () => TC().step >= 0, () => 'HP metal ' + f0(+TC().Thp || 0) + ' °C' + (TC().cur === 0 ? ', warming' : '')), a: [btn('HP TURBINE WARMING', () => A.tcs('warm'), () => TC().cur === 0 || TC().step >= 0)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 1: TURBINE PREPARATION (CV chest warming, reset, MSV open)', d: 'ATS page 14 ~ 16: kapag ≤ 150 °C ang CV chest, CV chest warming nang 60 minuto (o diff < 50 °C at outer > 180 °C), tapos TURBINE RESET, MSV OPEN, LOAD LIMITER UPPER.', c: C('Turbine preparation tapos', () => TC().step >= 1, () => 'CV chest ' + f0(+TC().Tcvi || 0) + ' / ' + f0(+TC().Tcvo || 0) + ' °C' + (TC().cur === 1 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' min' : '')), a: [btn('TURBINE PREPARATION', () => A.tcs('prep'), () => TC().cur === 1 || TC().step >= 1)], wait: 1 },
      { st: 7, sec: 41, t: 'Steam para sa roll: MS 60 kg/cm² / 400 ~ 420 °C, RH 7.5 kg/cm² / 415 ~ 425 °C', d: 'PR-OPE-5002 8254 COLD START-UP: MS 60 kg/cm², 400 °C; RH 7.5 kg/cm², 415 °C. ATS Fig. 2 / 3: sa malamig na metal, ang MSV inlet ≤ 420 °C at ang reheat ≤ 425 °C. Ang coach ang humahawak ng spray (TICBR1150) para sa main steam.', c: C('CRITERIA A2 (rub check) handa', () => TC().cur < 0 && !TC().next, () => TC().next || 'OK'), coach: ['spray', 'rhbias'], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 2: TURBINE RUB CHECK (200 rpm, coast < 100 rpm)', d: 'ATS page 17 ~ 18: 200 rpm, sarado ang CV / ICV, hinahayaang bumagal; tapos kapag < 100 rpm. Nakikinig ang field operator kung may kiskis.', c: C('Rub check tapos', () => TC().step >= 2, () => f0(+TC().rpm || 0) + ' rpm' + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('RUB CHECK', () => A.tcs('rub'), () => TC().cur === 2 || TC().step >= 2)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 3: ACCELERATION: 1800 rpm heat soak, tapos 3600 rpm heat soak', d: 'ATS page 19 ~ 22: 120 rpm/min. Ambient cold: 88 minuto sa 1800 rpm, tapos HP metal > 170 °C at shell expansion > 3 mm, tapos 3600 rpm nang 86 minuto. Walang hold sa critical zone 1372 ~ 1723 rpm.', c: C('Acceleration tapos (3600 rpm, heat soak)', () => TC().step >= 3, () => f0(+TC().rpm || 0) + ' rpm' + (TC().cur === 3 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' / ' + f0(+TC().soakMin || 0) + ' min' : '') + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('ACCELERATION', () => A.tcs('accel'), () => TC().cur === 3 || TC().step >= 3)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 4: EXCITATION', d: 'ATS page 23: AVR EXCITATION START, generator voltage OK.', c: C('Excitation tapos', () => TC().step >= 4, () => (TC().cur === 4 ? 'excitation' : '—')), a: [btn('EXCITATION', () => A.tcs('excite'), () => TC().cur === 4 || TC().step >= 4)], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 5: SYNCH. & INITIAL LOAD (52G), LP bypass sa REMOTE', d: 'ATS page 24 ~ 25: ASD START, sarado ang 52G, initial load 3 % (4.5 MW), hold 40 minuto (Fig. 3). Ilagay ang LP bypass sa R (SV = first stage + 5.1).', c: b.ALL(b.BIT('I.0931', 1, 'GCB 52G1 on'), b.MODE('PICHR1003', 'REM')), fps: ['PICHR1003'], a: [btn('SYNCH. & INITIAL LOAD', () => A.tcs('sync'), () => bit('I.0931') > 0.5), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      { st: 7, sec: 42, t: 'Initial load hold: 40 minuto, LP exhaust hood < 52 °C', d: 'ATS page 25 Fig. 3: 40 minuto (metal < 230 °C). PR-OPE-5002 9123: hawakan ang initial load hanggang ang LP turbine exhaust hood ay < 52 °C.', c: C('Initial load hold tapos at LP exhaust < 52 °C', () => TC().step >= 5 && TC().Tx < 52, () => (TC().cur === 5 ? f0(+TC().tmMin || 0) + ' / ' + (TC().holdMin || 40) + ' min, ' : '') + 'LP exhaust ' + f0(+TC().Tx || 0) + ' °C'), wait: 1 },
      { st: 7, sec: 42, t: 'LOAD UP sa 45 MW (TCS), ICV → CV transfer', d: 'Sa TCS panel: LOAD UP 45 MW (7.5 MW bawat minuto). Ang transfer ay sa 15 ~ 22 MW. Ang coach ang naglilipat ng feedwater sa main valve at nagsasara ng LP bypass.', c: b.ALL(b.BIT('I.0418', 1, 'ICV to CV transfer complete'), b.VAL('MW', 15, null)), a: [btn('LOAD UP 45 MW (TCS)', () => A.tcs('loadup', 45), () => U().tb && U().tb.st === 'load')], coach: ['lpclose', 'fw'] },
      {
        st: 7,
        sec: 42,
        t: 'Feedwater 3-ELEMENT: FICFW1007 R, LICBR1001 A, pindutin ang 3-ELEMENT',
        d: 'Kapag feedwater > 110 T/H at wala na ang force manual (M.0228 = 0), ilipat sa 3-element: ang feedwater ay sumusunod sa steam flow at drum level.',
        c: b.ALL(b.VAL('FW', 100, null), b.MODE('FICFW1007', 'REM'), b.MODE('LICBR1001', 'AUTO'), b.BIT('M.0222', 0, 'single element')),
        fps: ['FICFW1007', 'LICBR1001'],
        ready: () => h().FW() > 110 && bit('M.0228') < 0.5,
        readyTxt: () => 'Hintayin: feedwater ' + f0(h().FW()) + ' T/H (> 110) at M.0228 = ' + f0(bit('M.0228')) + ' (0)',
        a: [btn('FICFW1007 R', () => A.rem('FICFW1007')), btn('LICBR1001 A, SV 0', () => A.auto('LICBR1001', 0)), btn('3-ELEMENT', () => A.push('M.054E'))]
      },
      /* 3.2.0-beta.24: the MS blow-off to its load SV 128 (4.PNG 148.8 MW: BLOW-OFF A, SV 128, MV 0). The bypass coach left it at the
         HP bypass SV + 5 of the moment its step ended (118 + 5 = 123 in some runs): at 80 MW it opened > 5 % at MSP 123, and its
         M.0255 (ABC-013 -> ABC-001C M.2013 BU-CMD) put the boiler and turbine master back to MANUAL at the CCS handover */
      { st: 7, sec: 42, t: 'HP bypass sa REMOTE, sarado ang HP at LP bypass at ang MS blow-off sa 45 MW', d: 'Pagkatapos ng transfer, ilagay ang SV ng HP bypass sa R (SV = PV + 2): magsasara ito at ang turbine na ang kumukuha ng lahat ng steam. Mula rito, ang pressure ay tumataas kasabay ng load (FHI Fig. 2: 61 kg/cm² sa 15 % load, 123 sa 40 %). Ang MS blow-off PICMS1002 ay AUTO SV 128 (sarado; ang bukas na blow-off > 5 %, M.0255, ay back-up command ng boiler master).', c: b.ALL(b.VAL('MW', 44, null), b.MODE('PICMS1006', 'REM'), b.BIT('M.0709', 0, 'HP bypass open'), b.BIT('M.0255', 0, 'MS blow-off open'), C('MS blow-off PICMS1002 AUTO, SV ≥ 125 kg/cm²', () => md('PICMS1002') === 'AUTO' && svOf('PICMS1002') >= 125, () => 'PICMS1002 ' + md('PICMS1002') + ' SV ' + f0(svOf('PICMS1002')))), fps: ['PICMS1006', 'PICMS1002'], a: [btn('HP bypass R', () => A.rem('PICMS1006'), () => md('PICMS1006') === 'REM'), btn('PICMS1002 A, SV 128', () => A.auto('PICMS1002', 128))] },
      { st: 7, sec: 42, t: 'Hawakan ang 45 MW: MSP ≥ 90 kg/cm², drum level ±150 mm', d: 'NORMAL OPERATION sa TCS. Oil pa lang ang apoy; ang coach ang nagtataas ng oil habang tumataas ang pressure (Fig. 2: mga 98 kg/cm² sa 45 MW).', c: b.ALL(C('TCS NORMAL OPERATION (ATS step 7)', () => TC().step >= 7, () => (TC().step >= 7 ? 'OK' : TC().next || 'pindutin ang NORMAL OPERATION')), b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 90, 131), b.VAL('lvl', -150, 150)))), a: [btn('NORMAL OPERATION (TCS)', () => A.tcs('normal'), () => TC().step >= 7)], wait: 1 },
      /* ---- 8 coal at 45 MW (PR-OPE-5002 solid fuel firing) ---- */
      { st: 8, sec: 44, t: 'Bed temperature ≥ 400 °C: handa ang coal feeder', d: 'Ang coal ay nasusunog lang sa mainit na bed.', c: b.VAL('Tb', 400, null), wait: 1 },
      { st: 8, sec: 44, t: 'Batch firing ng feeder A hanggang bed 600 °C', d: 'Ang feeder A ay 10 segundo ON, 60 segundo OFF. Ang coach ang gagawa nito kapag pinindot mo ang button.', c: C('Bed ≥ 600 °C, o 3 batch na', () => U().Tb >= 600 || (CO.batch && CO.batch.n >= 3), () => f0(U().Tb) + ' °C, batch ' + ((CO.batch && CO.batch.n) || 0)), a: [fDis('A'), btn('Simulan ang batch firing', () => coachOn('batch'), () => !!CO.batch)] },
      { st: 8, sec: 44, t: 'Feeder A tuloy-tuloy, FICCL1061A sa AUTO, coal demand FIC-CF 10 %', d: 'Pagkatapos ng 600 °C, tuloy-tuloy na ang feeder A. Kapag tumatakbo na, ilagay sa AUTO (force manual ito ng drawing habang nakatigil). Mula rito, ang coach ang nagpapalit ng apoy: coal para sa steam ng turbine, bawas oil, pressure pataas sa 123 kg/cm² (hawak ng TCS ang 45 MW).', c: b.ALL(b.BIT('M.3400', 1, 'feeder A running'), b.MODE('FICCL1061A', 'AUTO'), SETmin('FIC-CF', 8)), fps: ['FICCL1061A', 'FIC-CF'], a: [fDis('A'), mot('M.3400', 'feeder A'), btn('FICCL1061A A', () => A.loc('FICCL1061A')), btn('FIC-CF M 10 %', () => A.man('FIC-CF', 10))], coachOff: ['batch', 'ofire'], coach: ['o2', 'swap'] },
      { st: 8, sec: 44, t: 'Feeder B, tapos FICCL1061B sa AUTO', d: 'Ang ikalawang feeder.', c: b.ALL(b.BIT('M.3401', 1, 'feeder B running'), b.MODE('FICCL1061B', 'AUTO')), fps: ['FICCL1061B'], a: [fDis('B'), mot('M.3401', 'feeder B'), btn('FICCL1061B A', () => A.loc('FICCL1061B'))] },
      { st: 8, sec: 44, t: 'Bed ≥ 650 °C: feeder C, tapos FICCL1061C sa AUTO', d: 'Ang ikatlong feeder kapag sapat na ang init ng bed.', c: b.ALL(b.VAL('Tb', 650, null), b.BIT('M.3402', 1, 'feeder C running'), b.MODE('FICCL1061C', 'AUTO')), fps: ['FICCL1061C'], a: [fDis('C'), WLm('M.3402', 'feeder C', () => (A.motor('M.3402', 1), A.motor('M.3405', 1))), btn('FICCL1061C A', () => A.loc('FICCL1061C'))] },
      { st: 8, sec: 44, t: 'Main steam pressure 123 kg/cm² sa 45 MW', d: 'Coal na ang pangunahing apoy; ang mga oil burner ay nasa 20 % hanggang mga 60 % load (FHI Fig. 2). Hintayin ang 123 kg/cm² (SV ng PIC-COBM sa CCS).', c: b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), wait: 1 },
      /* ---- 9 load up ---- */
      {
        st: 9,
        sec: 44,
        t: 'Ihanda ang combustion control: HS-COAL 33.1 %, O₂ trim 50 %, PA bias 0, FIC-CF A',
        d: 'Coal calorie correction 4150 kcal/kg = 33.1 %. Ang O₂ trim at PA bias ay neutral bago ilagay ang hangin sa REMOTE. Ang FIC-CF sa A sa PV nito (walang talon).',
        c: b.ALL(b.MV('HS-COAL', 32, 34), b.MODE('FIC-CF', 'AUTO')),
        fps: ['HS-COAL', 'FIC-CF'],
        a: [btn('Ihanda lahat', () => {
          A.man('HS-COAL', 33.1);
          A.val('HIC-TADBS', 0);
          A.auto('FIC-CF', pv('FIC-CF'));
          return '';
        })],
        coach: ['o2trim']
      },
      { st: 9, sec: 44, t: 'PA at SA air flow sa REMOTE (FICFA1071, FICFA1081)', d: 'Ang hangin ay susunod na sa air demand ng drawing.', c: b.ALL(b.MODE('FICFA1071', 'REM'), b.MODE('FICFA1081', 'REM')), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA at SA R', () => (A.rem('FICFA1071'), A.rem('FICFA1081')))] },
      { st: 9, sec: 44, t: 'FIC-CF sa REMOTE', d: 'Ang coal feeder demand ay manggagaling na sa coal master.', c: b.MODE('FIC-CF', 'REM'), fps: ['FIC-CF'], a: [btn('FIC-CF R', () => A.rem('FIC-CF'))], coachOff: ['o2'] },
      {
        st: 9,
        sec: 44,
        t: 'Coal master FIC-CM sa REMOTE',
        d: 'Payag ang drawing kapag M.0130 = 0 (FIC-CF, PA, SA nasa REMOTE). Pindutin ang R kapag ang fuel demand (SI0141) ≈ coal ngayon.',
        c: b.MODE('FIC-CM', 'REM'),
        fps: ['FIC-CM'],
        ready: () => bit('M.0130') < 0.5 && Math.abs(h().val('ABC-004A', 'SI0141') - pv('FIC-CM')) < 1.5,
        readyTxt: () => 'Hintayin: M.0130 = ' + f0(bit('M.0130')) + ', fuel demand ' + f1(h().val('ABC-004A', 'SI0141')) + ' ≈ coal ' + f1(pv('FIC-CM')) + ' T/H',
        a: [btn('FIC-CM R', () => A.rem('FIC-CM'))],
        coachOff: ['load', 'swap'],
        coach: ['bf', 'spray']
      },
      {
        st: 9,
        sec: 44,
        id: 'bm',
        t: 'Boiler master HIC-BM sa AUTO (boiler follow)',
        d: 'Kapag steam flow > 230 T/H at wala na ang back-up command (M.2013 = 0): PIC-COBM A SV 123, HS-COAL R, tapos HIC-BM A. Ang M.2013 ay 1 din habang bukas > 5 % ang MS blow-off PICMS1002 (M.0255) o ang HP bypass (M.0709): ibaba ang HIC-BM hanggang bumaba ang pressure sa ilalim ng 128.',
        c: b.MODE('HIC-BM', 'AUTO'),
        fps: ['PIC-COBM', 'HIC-BM', 'PICMS1002'],
        coach: ['bf'],
        ready: () => h().MSF() > 230 && bit('M.2013') < 0.5,
        readyTxt: () =>
          'Hintayin: steam flow ' + f0(h().MSF()) + ' T/H (> 230), M.2013 = ' + f0(bit('M.2013')) + ' (0)' + (h().bit('ABC-001C', 'M.0255') > 0.5 ? ': bukas ang blow-off PICMS1002 (M.0255 = 1, MSP ' + f1(h().MSP()) + ')' : '') + (bit('M.0709') > 0.5 ? ': bukas ang HP bypass (M.0709 = 1)' : ''),
        a: [btn('PIC-COBM A, SV 123', () => A.auto('PIC-COBM', 123)), btn('HS-COAL R', () => A.rem('HS-COAL')), btn('HIC-BM A', () => A.auto('HIC-BM'))]
      },
      {
        st: 9,
        sec: 44,
        t: 'O₂ control AICFG112 sa AUTO',
        d: 'Payag kapag > 220 T/H (M.0101) at PV ≈ SV.',
        c: b.MODE('AICFG112', 'AUTO'),
        fps: ['AICFG112'],
        ready: () => bit('M.0101') > 0.5,
        readyTxt: () => 'Hintayin: steam flow > 220 T/H (M.0101 = ' + f0(bit('M.0101')) + ')',
        a: [btn('AICFG112 A', () => {
          const H = h(),
            S2 = H.sh('ABC-002'),
            c = H.ctl('ABC-002', 'AICFG112'),
            q = S2.rt.st[c.amt.id];
          q.al = c.autoLeg;
          q.fm = c.autoLeg;
          for (const [S3, n] of AN.modeNets('AICFG112')) S3.rt.ext[n] = 0;
          return '';
        })],
        coachOff: ['o2trim']
      },
      {
        st: 9,
        sec: 44,
        id: 'tm',
        req: ['bm'],
        t: 'Turbine master EIC-TM sa AUTO (coordinated control, CCS)',
        d: 'DCS CONTROL MODE ON ay kusang lumalabas (I.0082). Pindutin ang A kapag ang AUTO value (SI0236) ≈ TCS target, para walang talon.',
        c: b.MODE('EIC-TM', 'AUTO'),
        fps: ['EIC-TM'],
        ready: () => bit('I.0082') > 0.5 && bit('M.2016') < 0.5 && Math.abs(h().val('ABC-001C', 'SI0236') - (+U().tcsT || 0)) < 1,
        readyTxt: () => 'Hintayin: DCS control mode I.0082 = ' + f0(bit('I.0082')) + ', SI0236 ' + f1(h().val('ABC-001C', 'SI0236')) + ' ≈ TCS target ' + f1(+U().tcsT),
        a: [btn('EIC-TM A', () => A.auto('EIC-TM'))]
      },
      /* roadmap 2 (PR-OPE-5002 8043 "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV"; 39.PNG at 150 MW:
         HICHR1002A / B A, TICHR1002A R, TICHR1002 A SV 541). ABC-020: the RH damper is forced MANUAL while the SH damper is MANUAL and under
         15 % MCR (M.0179), so the SH damper first. ABC-019: the RH spray is forced MANUAL while its shut-off valve is shut (M.0173, I.088F;
         DITL-35 opens it in AUTO MODE above saturation + 11 C after the ICV -> CV transfer). Without this step the reheat went to 593 C */
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Reheat temperature sa AUTO: biasing damper SH at RH A, TICHR1002A A (SV: LOGIC), RH spray TICHR1002 A SV 541',
        d: 'PR-OPE-5002: "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV". Ang "Remote" ng TICHR1002A ay ang SV: LOGIC (SV mula sa MW, LN6, may bumpless ramp 1 %/min). Unahin ang SH damper (HICHR1002B): habang MANUAL ito, naka-force MANUAL ang RH damper (ABC-020 M.0179, kasama ang steam flow < 15 % MCR). Ang RH spray ay payag sa AUTO kapag bukas na ang shut-off valve (DITL-35).',
        c: b.ALL(b.MODE('HICHR1002B', 'AUTO'), b.MODE('HICHR1002A', 'AUTO'), C('TICHR1002A AUTO, SV: LOGIC (LN6, MW → reheat SV)', () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A'), () => md('TICHR1002A') + (svLogic('ABC-020', 'TICHR1002A') ? ', SV: LOGIC' : ', SV: OPERATOR')), b.MODE('TICHR1002', 'AUTO')),
        fps: ['HICHR1002B', 'HICHR1002A', 'TICHR1002A', 'TICHR1002'],
        ready: () => bit('I.0418') > 0.5 && h().MSF() >= 69 && !(h().bit('ABC-019', 'I.088F') > 0.5),
        readyTxt: () => 'Hintayin: ICV → CV transfer I.0418 = ' + f0(bit('I.0418')) + ', steam ' + f0(h().MSF()) + ' T/H (≥ 69), RH spray shut-off valve ' + (h().bit('ABC-019', 'I.088F') > 0.5 ? 'sarado' : 'bukas'),
        a: [
          btn('SH damper HICHR1002B A', () => A.auto('HICHR1002B'), () => md('HICHR1002B') === 'AUTO'),
          btn('RH damper HICHR1002A A', () => A.auto('HICHR1002A'), () => md('HICHR1002A') === 'AUTO'),
          btn('TICHR1002A A, SV: LOGIC', () => A.rem('TICHR1002A'), () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A')),
          btn('TICHR1002 A, SV 541', () => A.auto('TICHR1002', 541), () => md('TICHR1002') === 'AUTO')
        ],
        coachOff: ['rhbias']
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Unit load demand HIC-ULD sa AUTO, TARGET 150 MW',
        d: 'Ang CCS na ang magkakarga sa 3 MW bawat minuto (HIC-MWRL).',
        c: b.ALL(b.MODE('HIC-ULD', 'AUTO'), b.VAL('MW', 90, null)),
        fps: ['HIC-ULD'],
        a: [btn('HIC-ULD A, TARGET 150', () => {
          A.loc('HIC-ULD');
          const s = station('HIC-ULD'),
            d = s && (s.T.drv[s.b.i[s.b.svI]] || []).find(z => z.k === 'AMT');
          if (d) s.T.rt.ext[d.a] = 150;
          return '';
        })],
        coachOff: ['bf']
      },
      {
        st: 9,
        req: ['bm', 'tm'],
        sec: 44,
        t: 'Load ≥ 90 MW, bed > 700 °C at PA flow ≥ 220 T/H: patayin ang mga burner isa-isa (A, D, B, C)',
        d: 'FHI Fig. 2: pinapatay ang startup burners sa mga 60 % load; PR-OPE-5002: simulan sa furnace > 700 °C, tapusin sa > 750 °C. Kapag kaya na ng coal, isara ang oil valve at patayin ang burner, may pagitan na ilang minuto. Bago patayin ang huling burner, ang PA flow ay dapat higit sa 200 T/H: kapag coal na lang, nagti-trip ang boiler sa PRIMARY AIR FLOW L.L. (ABC-007, DITL-03F). Target ng procedure: 280 T/H.',
        c: b.ALL(b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'start-up burners out'), b.VAL('Tb', 700, null), C('PA flow ≥ 220 T/H (FIFA1071)', () => pv('FICFA1071') >= 220, () => (pv('FICFA1071') || 0).toFixed(0) + ' T/H')),
        ready: () => pv('FICFA1071') >= 220 && h().MW() >= 90,
        readyTxt: () => 'Hintayin: load ' + f0(h().MW()) + ' MW (≥ 90), PA ' + f0(pv('FICFA1071')) + ' T/H (≥ 220)',
        get a() {
          return WL()
            ? [bOff('A'), bOff('D'), bOff('B'), bOff('C')]
            : [
                btn('Patayin burner A', () => (A.oil('M.3410', false), A.motor('M.3412', 0)), () => bit('M.3412') < 0.5),
                btn('Patayin burner D', () => (A.oil('M.3417', false), A.motor('M.3419', 0)), () => bit('M.3419') < 0.5),
                btn('Patayin burner B', () => (A.oil('M.3411', false), A.motor('M.3413', 0)), () => bit('M.3413') < 0.5),
                btn('Patayin burner C', () => (A.oil('M.3416', false), A.motor('M.3418', 0)), () => bit('M.3418') < 0.5)
              ];
        },
        retract: 1
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Furnace pressure PICFG108 sa AUTO, SV −15',
        d: 'Payag kapag MV ≥ 16 % at wala na ang force manual (M.0205 = 0).',
        c: b.MODE('PICFG108', 'AUTO'),
        fps: ['PICFG108'],
        /* 3.2.0-beta.23: M.0205 read on ABC-008, the sheet that computes it (a linked copy on a sheet that is not stepping kept 1 and the
           step never opened with the one world OFF) */
        ready: () => mv('PICFG108') >= 16 && !(h().bit('ABC-008', 'M.0205') > 0.5),
        readyTxt: () => 'Hintayin: PICFG108 MV ' + f0(mv('PICFG108')) + ' % (≥ 16), M.0205 = ' + f0(h().bit('ABC-008', 'M.0205') > 0.5 ? 1 : 0),
        a: [btn('PICFG108 A, SV −15', () => A.auto('PICFG108', -15))],
        coachOff: ['fp']
      },
      { st: 9, sec: 44, req: ['bm', 'tm'], t: 'Hawakan ang 150 MW: MSP 118 ~ 128, MST ≤ 545 °C, drum level ±150 mm, O₂ 3 ~ 6 %', d: 'Tapos ang start-up. Ang CCS na ang humahawak.', c: b.X2[9][1], wait: 1 },
      /* ---- 10 practice ---- */
      { st: 10, t: 'Practice: ibaba ang HIC-ULD sa 120 MW (▼▼)', d: 'Sa AUTO, target MW lang ang gagalawin mo. Ang CCS ang magbabawas ng coal at hangin.', c: b.OUT('HIC-ULD', null, 121, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, t: 'Panoorin: 120 MW, coal mga 72 T/H, MSP hawak', d: 'Bumababa ang MW ng 3 MW bawat minuto at hawak ng PIC-COBM ang 123 kg/cm².', c: b.HOLD(120, b.ALL(b.VAL('MW', 117, 123), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), wait: 1 },
      { st: 10, t: 'Ibalik ang HIC-ULD sa 150 MW (▲▲)', d: 'Itaas ulit ang target.', c: b.OUT('HIC-ULD', 149, null, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, t: 'Hawakan ang 150 MW', d: 'MSP 118 ~ 128, drum level ±150 mm, O₂ 3 ~ 6 %.', c: b.HOLD(300, b.ALL(b.VAL('MW', 147, 153), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150), b.VAL('O2', 3, 6))), wait: 1 }
    ];
    ST.forEach((s, i) => (s.i = i));
    return ST;
  }

  /* ---------- the run: the open step, the coach, the latch (kept in this browser) ---------- */
  const KEY = 'ls-guide';
  const rd = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      return null;
    }
  };
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ cur: G.cur, coach: Object.keys(CO), hold: G.hold, mine: G.mine, on: G.on }));
    } catch (e) {}
  };
  const G = Object.assign({ cur: 0, on: false, mine: {}, hold: {} }, rd() || {});
  const since = {};
  function coachOn(id) {
    if (!coach[id]) return '';
    if (!CO[id]) CO[id] = {};
    save();
    return '';
  }
  const coachOff = id => (delete CO[id], save());
  (G.coach || []).forEach(id => coach[id] && (CO[id] = {}));
  delete G.coach;
  /* the plant has to be in the simulation (RUN, ABC engine) for a step to count */
  /* the plant runs: ABC RUN, or the DITL page simulating with the one world ON (it steps the ABC sheets and the plant, world.js) */
  const live = () =>
    !!(
      window.AN &&
      AN.sheets &&
      AN.unit &&
      AN.unit.on &&
      (AN.cat === 'an' ? AN.run && !AN.view : typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE) && window.WORLD && WORLD.on && WORLD.live)
    );
  /* the step's condition, the field confirmation, the hold time */
  function stepOk(s) {
    /* a FIELD card needs the operator's confirmation; the field items shown on a DCS step are for reading only */
    if (s.need && !G.mine[s.i]) return false;
    if (!s.c) return !!G.mine[s.i];
    let ok = false;
    try {
      ok = s.c.ok();
    } catch (e) {}
    if (!ok) {
      delete since[s.i];
      return false;
    }
    if (s.c.hold) {
      if (since[s.i] == null) since[s.i] = simT();
      return simT() - since[s.i] >= s.c.hold;
    }
    return true;
  }
  const holdOf = s => (s.c && s.c.hold && since[s.i] != null ? [Math.max(0, simT() - since[s.i]), s.c.hold] : null);
  /* the steps opened: a step's coach starts when it opens */
  function open(i) {
    const s = steps()[i];
    if (!s) return;
    (s.coachOff || []).forEach(coachOff);
    (s.coach || []).forEach(coachOn);
    G.cur = i;
    save();
  }
  /* every step of the plant (AN.onStep): the coach, the pushbutton release; every second: the latch */
  let acc = {};
  const onStep = dt => {
    if (!G.on || !live()) return;
    for (const a in PUSH)
      if (simT() >= PUSH[a]) {
        h().setx(null, a, 0);
        delete PUSH[a];
      }
    for (const id in CO) {
      const per = coach[id].sec === true ? 1 : coach[id].sec || 60;
      acc[id] = (acc[id] || 0) + dt;
      if (acc[id] + 1e-9 < per) continue;
      acc[id] = 0;
      try {
        coach[id].run(CO[id]);
      } catch (e) {}
    }
    /* the batch runs on the second (10 s ON / 60 s OFF) */
    if (CO.batch) {
      try {
        coach.batch.run(CO.batch);
      } catch (e) {}
    }
  };
  const hook = () => window.AN && (AN.onStep = onStep);
  hook();
  /* check the open step; returns true when it moved on */
  function scan() {
    if (!G.on || !live()) return false;
    const L0 = steps(),
      s = L0[G.cur];
    if (!s) return false;
    /* 3.2.0-beta.24: a station that a BU-CMD of the drawing put back to MANUAL after its step (HIC-BM / EIC-TM: M.2013 / M.2016,
       CLAUDE.md 10) stays MANUAL until the operator presses A: the guide goes back to that step, so its card says why and what to do */
    for (const r of s.req || []) {
      const j = L0.findIndex(x => x.id === r);
      if (j >= 0 && j < G.cur && !stepOk(L0[j])) {
        open(j);
        return true;
      }
    }
    if (stepOk(s)) {
      open(G.cur + 1);
      return true;
    }
    return false;
  }
  /* out of order: a motor of a later step already running (the operator started it in the Plant view or the Logic) */
  function early() {
    const L0 = steps(),
      out = [];
    for (let i = G.cur + 1; i < L0.length && out.length < 3; i++)
      for (const a of L0[i].a || [])
        if (a.stop && a.on && a.on() && !(L0[G.cur].a || []).some(x => x.l === a.l) && !out.includes(a.l.replace(/^START /, ''))) {
          /* the same pump may be one of the choices of this or an earlier step */
          let before = false;
          for (let j = 0; j <= G.cur; j++) if ((L0[j].a || []).some(x => x.l === a.l)) before = true;
          if (!before) out.push(a.l.replace(/^START /, ''));
        }
    return out;
  }
  /* start: the plant cold, RUN, step 1 */
  function start(done) {
    const go = () => {
      try {
        if (!AN.plantOn && AN.plantSwitch) AN.plantSwitch(true, true);
        AN.reset();
        AN.plantCold();
        AN.startState = 'plantCold';
        AN.settle();
        AN.paint();
      } catch (e) {}
      for (const k in CO) delete CO[k];
      for (const k in since) delete since[k];
      acc = {};
      hook();
      G.on = true;
      G.mine = {};
      G.cur = 0;
      HH = null;
      /* the sheets the steps operate that may not be linked to the sheet on the screen: stepped too (links.js actSet) */
      AN.checkSheets = ['ABC-001C', 'ABC-002', 'ABC-003A', 'ABC-003B', 'ABC-003C', 'ABC-003D', 'ABC-004A', 'ABC-005', 'ABC-007', 'ABC-008', 'ABC-010', 'ABC-011', 'ABC-012', 'ABC-013', 'ABC-020', 'ABC-028', 'ABC-031', 'ABC-032', 'ABC-050', 'ABC-052', 'ABC-054']
        .concat(steps().flatMap(s => (s.fps || []).map(t => shOf(L().ctlTag(t) || t)).filter(Boolean)))
        .filter((x, i, a) => a.indexOf(x) === i);
      open(0);
      if (AN.runOn) AN.runOn();
      if (done) done();
    };
    try {
      AN._cold0 = 1;
      if (AN.cat !== 'an') AN.setCat('an');
    } catch (e) {}
    let k = 0;
    const iv = setInterval(() => {
      const ok = AN.cat === 'an' && AN.sheets && AN.sheets.length >= 54 && AN.plantCold && window.CHECK;
      if (ok || ++k > 160) {
        clearInterval(iv);
        if (ok) go();
      }
    }, 250);
  }
  /* continue after a reload: the plant is not saved, so the training goes on only with a plant in the simulation */
  function resume() {
    if (!AN.checkSheets || !AN.checkSheets.length) AN.checkSheets = ['ABC-001C', 'ABC-020', 'ABC-028', 'ABC-031', 'ABC-032', 'ABC-054'];
    hook();
    G.on = true;
    if (AN.runOn) AN.runOn();
    save();
  }
  function stop() {
    G.on = false;
    save();
  }
  /* the field confirmation of a step */
  function confirm(i) {
    G.mine[i] = 1;
    save();
  }
  /* every action of the open step (the "Do it for me" of a newbie, and the test) */
  function doIt() {
    const s = steps()[G.cur];
    if (!s) return;
    if (s.need) confirm(s.i);
    if (s.ready && !s.ready()) return;
    if (s.retract) {
      /* one burner every 3 minutes of the plant, above 700 C */
      if (U().Tb < 700) return;
      if (G.retT != null && simT() - G.retT < 180) return;
      const nx = (s.a || []).find(a => !a.on());
      if (nx) {
        nx.f();
        G.retT = simT();
      }
      return;
    }
    /* again after a minute of the plant when the step is still not done (a value the drawing held while the machine was stopping) */
    if (G.did === s.i && simT() - (G.didT || 0) < 60) return;
    for (const a of s.a || []) if (!a.on || !a.on()) a.f();
    G.did = s.i;
    G.didT = simT();
  }
  return {
    steps,
    STAGES,
    coach,
    CO,
    coachOn,
    coachOff,
    start,
    resume,
    stop,
    scan,
    stepOk,
    holdOf,
    confirm,
    doIt,
    early,
    fieldOf,
    live,
    open,
    A,
    h,
    get cur() {
      return G.cur;
    },
    get on() {
      return G.on;
    },
    mine: () => G.mine
  };
})();
