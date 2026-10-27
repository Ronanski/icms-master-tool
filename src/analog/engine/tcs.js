/* 3.2.0-beta.38 (CHECKLIST 0.6, user 2026-10-25: "wala ka pang turbine model at TCS"): the TURBINE AUXILIARIES and the ATS (AUTOMATIC
   TURBINE START-UP) of the TCS, from the drawings of the repository:
   - ATS Sequence 310SC90-775 (MHPS 2015-05-29): page 12 START-UP MODE SELECT, 13 HP TURBINE WARMING, 14 ~ 16 TURBINE PREPARATION (CV
     chest warming), 17 ~ 18 RUB CHECK, 19 ~ 22 ACCELERATION (heat soak timers Fig. 1 / 2, critical zone), 23 EXCITATION, 24 ~ 25
     SYNCH. & INITIAL LOAD (Fig. 3 hold timer, initial load 3 % / 5 %), 26 ~ 27 LOAD UP (ICV -> CV transfer), 28 NORMAL OPERATION
   - ATS Criteria 310SC90-776: page 3 criteria table (step-in A, step criteria B, step-out D), page 5 ~ 14 criteria list, page 21 Fig.
     2 / 3 allowable steam - metal temperature (MSV inlet vs HP first stage inner wall, CRV inlet vs reheat bowl inner wall)
   - PR-OPE-5002-02: GLAND SEALING (6118: MS > 12, aux > 7 kg/cm2, TIAS1015 220 C, turning gear, vacuum breaker open), VACUUM UP
     (6512: aux > 10, gland done, vacuum breaker MV-AV1391 closed, ejectors), ROLLING (8254: cold MS 60 kg/cm2 / 400 C, RH 7.5 / 415 C),
     heat soak table (8437), LP exhaust hood < 80 C before sync (8673) and < 52 C before load up (9123)
   Table of the criteria against the app: docs/tcs/ATS_CRITERIA.md. The numbers that the drawings give as "REFER TO IBD" (graphic, not
   readable here) are taken from PR-OPE-5002 and marked so; the time constants of the metal are ASSUMED (marked).
   The state is AN_UNIT.tc; the operator acts on the TCS panel with AN.turbine(cmd) (unit.js anTurbine). */
const TCS = {
  /* start-up mode judgement on the lower of the reheat bowl and the HP first stage inner wall metal temperatures (page 12). The
     judgement temperatures are in the IBD; taken from the break points of the heat soak timers (Fig. 1 / 2: 150 / 170 / 230 / 420 C)
     that the procedure table (8437) gives per mode: ambient 88 / 86 min, cold 1 58 / 55, cold 2 30 / 25, warm 0 / 22, hot 0 / 0 */
  modes: [
    ['amb', 150, 'AMBIENT COLD'],
    ['c1', 170, 'COLD 1'],
    ['c2', 230, 'COLD 2'],
    ['warm', 420, 'WARM'],
    ['hot', 1e9, 'HOT']
  ],
  rate: { amb: 120, c1: 120, c2: 120, warm: 180, hot: 360 } /* rpm/min, page 19 *2 */,
  soak1800: { amb: 88, c1: 58, c2: 30, warm: 0, hot: 0 } /* min, page 20 Fig. 1 */,
  soak3600: { amb: 86, c1: 56, c2: 27, warm: 23, hot: 3 } /* min, page 22 Fig. 2 */,
  init: { amb: 3, c1: 3, c2: 3, warm: 3, hot: 5 } /* % of 150 MW, page 25 *2 */,
  hold: m => ((m === 'amb' || m === 'c1' || m === 'c2') ? 40 : m === 'warm' ? 15 : 0) /* min, page 25 Fig. 3 (40 below 230 C, 15 to 420 C) */,
  /* rolling steam (PR-OPE-5002 8254 COLD START-UP: MS 60 kg/cm2 / 400 C, RH 7.5 kg/cm2 / 415 C; START ACCELERATION table 8407: warm MS
     81.6, hot 110 / 455 C, RH 485 C): criteria 1.3 ~ 1.6 MAIN / REHEAT STEAM PRESS. / TEMP. NOT LOW (set point "NOT LESS THAN", IBD).
     3.2.0-beta.38: the reheat pressure "NOT LOW" at 7.0: the procedure gives 7.5 kg/cm2 as the rolling condition and holds it with the
     LP bypass at SV 7.6 ("HP and LP bypass and RH BOV automatically open to maintain RHP SV = 7.6"); with 7.5 as the limit the step
     criteria B dropped in and out on the 0.1 ~ 0.5 kg/cm2 swing of the LP bypass. The IBD set point is not readable here */
  steam: { amb: [60, 400, 7.0, 415], c1: [60, 400, 7.0, 415], c2: [60, 400, 7.0, 415], warm: [81.6, 400, 7.0, 415], hot: [110, 455, 7.0, 485] },
  /* Fig. 2 / 3 (page 21): allowable steam temperature against the metal temperature, upper and lower limit lines */
  fig2: { up: [[0, 420], [180, 420], [314, 538], [538, 538]], lo: [[0, 305], [318, 305], [538, 471]] },
  fig3: { up: [[0, 425], [251, 425], [366, 538], [538, 538]], lo: [[0, 205], [309, 205], [538, 430]] },
  rub: 200 /* rpm, PR-OPE-5002 8325 "target speed 200 rpm for rub check"; complete below 100 rpm (criteria page 14 Fig. 1) */,
  crit: [1372, 1723] /* rpm, critical zone, no hold (PR-OPE-5002 8561) */,
  /* time constants (ASSUMED: the turbine heat capacity is not in the repository) */
  tauMetal: 2400 /* s, HP first stage / reheat bowl inner wall toward the steam while steam flows */,
  tauChest: 900 /* s, CV chest inner wall toward the main steam in chest warming */,
  tauChestO: 1500 /* s, CV chest outer wall toward the inner wall */,
  tauCool: 72000 /* s, metal cooling with no steam */,
  tauX: 600 /* s, LP exhaust hood */,
  tauAux: 120 /* s, aux steam header */,
  names: ['HP TURBINE WARMING', 'TURBINE PREPARATION', 'TURBINE RUB CHECK', 'ACCELERATION', 'EXCITATION', 'SYNCH. & INITIAL LOAD', 'LOAD UP', 'NORMAL OPERATION']
};
const tcsLin = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++)
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1],
        [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  return pts[pts.length - 1][1];
};
/* the turbine state: cold (Start cold: everything stopped, metal at the ambient) or in service (Start at 150 MW) */
function tcsInit(U, how) {
  const T = U.Tamb || 30;
  const svc = how !== 'cold';
  /* 'cold': all stopped, metal at the ambient; 'load': on the grid */
  const hot = how === 'load' ? 480 : T;
  U.tc = {
    lop: svc, /* AC lube oil pump: bearing oil pressure (1.15), bearing oil temp. (1.16), main oil tank level (1.17) */
    eh: svc, /* EH (control) oil pump: control oil pressure (1.14) */
    vex: svc, /* main oil tank vapour extractor (1.18) */
    tg: svc && how !== 'load', /* turning gear selected (1.19); the gear engages below 4 rpm */
    asv: svc, /* MV-AS1391 aux steam from the main steam */
    Pa: svc ? 10 : 0, /* aux steam header, kg/cm2 G (PIAS1004) */
    gland: svc, /* gland steam seal in service (1.10) */
    vb: !svc, /* vacuum breaker MV-AV1391 open */
    ej: svc, /* ejectors (vacuum up) */
    hsp: svc, /* LP exhaust hood spray FVCD1904 in AUTO (PR-OPE-5002 6307) */
    Thp: hot, /* HP first stage inner wall metal, C */
    Trh: hot, /* reheat bowl inner wall metal, C */
    Tcvi: hot,
    Tcvo: hot,
    Tx: svc ? 45 : T, /* LP exhaust hood steam temperature, C */
    sexp: Math.max(0, (hot - T) * 0.02), /* HP shell expansion, mm */
    mode: null,
    step: how === 'load' ? 7 : -1, /* the last finished ATS step (-1 none) */
    cur: -1, /* the step being executed */
    ph: '',
    tm: 0, /* timer of the phase, s */
    soakMin: 0,
    rst: how === 'load', /* turbine reset, MSV / RSV open */
    exc: how === 'load', /* excitation (41 closed, gen. voltage OK) */
    hold: '',
    auto: false, /* ATS AUTO: the next step starts by itself when its step-in condition is satisfied */
    last: ''
  };
  tcsMode(U);
  return U.tc;
}
function tcsMode(U) {
  const c = U.tc,
    t = Math.min(c.Thp, c.Trh);
  c.mode = TCS.modes.find(m => t < m[1])[0];
  return c.mode;
}
function tcsPV(tag) {
  const c = (TCS.pv || (TCS.pv = {}));
  if (!(tag in c)) {
    c[tag] = null;
    for (const sh of AN.sheets) {
      if (!sh.S || /^ABC-000/.test(sh.name) || !AN.hmiCtrls) continue;
      const q = (AN.hmiCtrls(sh.S) || []).find(x => x.tag === tag);
      if (q && q.q && q.q.pv != null) {
        c[tag] = { S: sh.S, n: q.q.pv };
        break;
      }
    }
  }
  const o = c[tag];
  return o ? +o.S.rt.v[o.n] : NaN;
}
/* the steam the ATS sees: MSV inlet (main steam), CRV inlet (hot reheat) */
function tcsSteam(U) {
  const mst = tcsPV('TICMS1004'),
    rht = tcsPV('TICHR1002'),
    /* roadmap 2 batch 3 (checkpoint retest of the 3600 rpm heat soak: ATS HOLD 1.5 at 7.0 while the operator saw 7.6 on PICHR1003): the
       reheat pressure is the corrected one of ABC-052 (PV = AI0421 / AI0513 + 0.6, SEL), the value the LP bypass holds at 7.5 ~ 7.6
       (PR-OPE-5002 "RH pressure 7.5 ksc"); the raw AI0421 sat 0.6 lower, under the ATS limit 7 with the SOP pressure */
    Pv = tcsPV('PICHR1003'),
    Prh = isFinite(Pv) ? Pv : U.rhp && U.rhp.length ? anUnitVal(U.rhp[0]) : NaN;
  return { msp: U.Pms, mst: isFinite(mst) ? mst : U.Tw, rhp: isFinite(Prh) ? Prh : 0, rht: isFinite(rht) ? rht : U.Tw };
}
/* the criteria (page 3 / 5 ~ 14) that the model has: true = satisfied. txt = the name on the ATS criteria display */
function tcsCrit(U) {
  const c = U.tc,
    s = tcsSteam(U),
    st = TCS.steam[c.mode] || TCS.steam.amb,
    tb = U.tb || {},
    f2u = tcsLin(TCS.fig2.up, c.Thp),
    f2l = tcsLin(TCS.fig2.lo, c.Thp),
    f3u = tcsLin(TCS.fig3.up, c.Trh),
    f3l = tcsLin(TCS.fig3.lo, c.Trh),
    f = (no, txt, ok, val) => ({ no, txt, ok: !!ok, val });
  return {
    '1.3': f('1.3', 'MAIN STEAM PRESS. NOT LOW (≥ ' + st[0] + ' kg/cm2)', s.msp >= st[0], s.msp),
    '1.4': f('1.4', 'MAIN STEAM TEMP. NOT LOW (≥ ' + st[1] + ' C)', s.mst >= st[1], s.mst),
    '1.5': f('1.5', 'REHEAT STEAM PRESS. NOT LOW (≥ ' + st[2] + ' kg/cm2)', s.rhp >= st[2], s.rhp),
    '1.6': f('1.6', 'REHEAT STEAM TEMP. NOT LOW (≥ ' + st[3] + ' C)', s.rht >= st[3], s.rht),
    '1.71': f('1.71', 'MAIN STEAM TEMP. MISMATCH OK (' + Math.round(f2l) + ' ~ ' + Math.round(f2u) + ' C at HP metal ' + Math.round(c.Thp) + ' C, Fig. 2)', s.mst >= f2l && s.mst <= f2u, s.mst),
    '1.72': f('1.72', 'REHEAT STEAM TEMP. MISMATCH OK (' + Math.round(f3l) + ' ~ ' + Math.round(f3u) + ' C at RH bowl ' + Math.round(c.Trh) + ' C, Fig. 3)', s.rht >= f3l && s.rht <= f3u, s.rht),
    '1.10': f('1.10', 'GLAND STEAM SEAL HEADER PRESS. NOT LOW', c.gland && c.Pa > 7),
    '1.11': f('1.11', 'CONDENSER VACUUM OK', U.vac >= 0.9, U.vac),
    '1.12': f('1.12', 'LP TURBINE EXHAUST HOOD STEAM TEMP. NOT HIGH (≤ 80 C)', c.Tx <= 80, c.Tx),
    '1.14': f('1.14', 'CONTROL OIL PRESS. NOT LOW', c.eh),
    '1.15': f('1.15', 'BEARING OIL PRESS. NOT LOW', c.lop),
    '1.16': f('1.16', 'BEARING OIL TEMP. OK', c.lop),
    '1.17': f('1.17', 'MAIN OIL TANK LEVEL OK', true),
    '1.18': f('1.18', 'MAIN OIL TANK VAPOUR EXTRACTOR RUNNING', c.vex),
    '1.19': f('1.19', 'TURBINE TURNING (turning gear)', (c.tg && c.lop && U.tb && U.tb.rpm >= 1) || (U.tb && U.tb.rpm >= 4)),
    '1.20': f('1.20', 'TURBINE RESET', c.rst),
    '1.21': f('1.21', 'MSV OPEN', c.rst),
    '1.8': f('1.8', 'HP / LP BYPASS CONTROL IN AUTO', tcsByp(U)),
    '1.48': f('1.48', '52G CLOSED', tb.st === 'sync' || tb.st === 'load'),
    '2.4': f('2.4', 'TURBINE RATED SPEED (> 3550 rpm)', tb.rpm > 3550, tb.rpm),
    '2.6': f('2.6', 'IP TO HP TRANSFER COMPLETE', !!tb.xfer)
  };
}
/* 1.8: HP bypass PICMS1006 and LP bypass PICHR1003 in AUTO (the A / M switch of the controller on its AUTO leg, as the faceplate) */
function tcsCtl(tag) {
  const c = (TCS.ctl || (TCS.ctl = {}));
  if (!(tag in c)) {
    c[tag] = null;
    for (const sh of AN.sheets) {
      if (!sh.S || /^ABC-000/.test(sh.name) || !AN.hmiCtrls) continue;
      const q = (AN.hmiCtrls(sh.S) || []).find(x => x.tag === tag);
      if (q) {
        c[tag] = { S: sh.S, c: q };
        break;
      }
    }
  }
  return c[tag];
}
function tcsByp(U) {
  const auto = t => {
    const o = tcsCtl(t);
    if (!o || !o.c.amt) return true;
    const st = o.S.rt.st[o.c.amt.id];
    return !st || st.pk === o.c.autoLeg;
  };
  return auto('PICMS1006') && auto('PICHR1003');
}
/* the criteria of a step (page 3, IP start mode): A = step-in, B = monitored during the step */
const TCS_A = {
  0: ['1.10', '1.11', '1.15', '1.16', '1.18', '1.19'],
  1: ['1.19'],
  2: ['1.3', '1.4', '1.5', '1.6', '1.71', '1.72', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.19', '1.20', '1.21'],
  3: ['1.3', '1.4', '1.5', '1.6', '1.71', '1.72', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21'],
  4: ['1.3', '1.4', '1.5', '1.6', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21', '2.4'],
  5: ['1.3', '1.4', '1.5', '1.6', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21', '2.4'],
  6: ['1.3', '1.4', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21', '1.48'],
  7: ['1.3', '1.4', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21', '1.48', '2.6']
};
const TCS_B = {
  0: ['1.10', '1.11', '1.15', '1.16', '1.18'],
  1: ['1.3', '1.4', '1.5', '1.6', '1.8', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18'],
  2: TCS_A[3],
  3: TCS_A[3],
  4: TCS_A[4].filter(x => x !== '2.4'),
  5: TCS_A[5].filter(x => x !== '2.4'),
  6: TCS_A[6].filter(x => x !== '1.5' && x !== '1.6'),
  7: ['1.3', '1.4', '1.10', '1.11', '1.12', '1.14', '1.15', '1.16', '1.17', '1.18', '1.20', '1.21', '1.48']
};
/* the missing criteria of a list ('' = all satisfied) */
function tcsMiss(U, list) {
  const C = tcsCrit(U);
  return list
    .map(k => C[k])
    .filter(x => x && !x.ok)
    .map(x => x.no + ' ' + x.txt + (x.val != null && isFinite(x.val) ? ' [' + (+x.val).toFixed(x.val < 2 ? 2 : 1) + ']' : ''))
    .join('; ');
}
/* the operator on the TCS panel: auxiliaries and the ATS step push buttons. Returns '' (done) or the reason it is refused */
function tcsCmd(U, cmd, arg) {
  const c = U.tc || tcsInit(U, 'cold'),
    tb = U.tb;
  const on = arg !== 0 && arg !== false;
  switch (cmd) {
    case 'lop':
      c.lop = on;
      return '';
    case 'eh':
      c.eh = on;
      return '';
    case 'vex':
      c.vex = on;
      return '';
    case 'tg':
      if (on && !c.lop) return 'walang bearing oil: i-start muna ang lube oil pump (ATS 1.15)';
      c.tg = on;
      return '';
    case 'aux':
      if (on && !(U.Pd > 12)) return 'aux steam: kailangan ng main steam > 12 kg/cm2 (PR-OPE-5002 5727), drum ' + U.Pd.toFixed(1);
      c.asv = on;
      return '';
    case 'gland':
      if (!on) {
        c.gland = false;
        return '';
      }
      if (!(c.Pa > 7)) return 'gland sealing: aux steam > 7 kg/cm2 (PR-OPE-5002 6164), ngayon ' + c.Pa.toFixed(1);
      if (!(tb && tb.rpm >= 1)) return 'gland sealing: dapat umiikot ang turbine sa turning gear (PR-OPE-5002 6219)';
      if (!c.vb) return 'gland sealing: bukas dapat ang vacuum breaker MV-AV1391 (PR-OPE-5002 6197)';
      c.gland = true;
      return '';
    case 'vacuum':
      if (!on) {
        c.ej = false;
        c.vb = true;
        return '';
      }
      if (!(c.Pa > 10)) return 'vacuum up: aux steam > 10 kg/cm2 (PR-OPE-5002 6545), ngayon ' + c.Pa.toFixed(1);
      if (!c.gland) return 'vacuum up: gland sealing muna (PR-OPE-5002 6545)';
      c.vb = false;
      c.ej = true;
      return '';
    case 'hood' /* LP exhaust hood spray FVCD1904 AUTO (PR-OPE-5002 6307, with the vacuum up) */:
      c.hsp = on;
      return '';
    case 'auto':
      c.auto = on;
      return '';
    case 'hold':
      c.opHold = on;
      return '';
  }
  const k = { warm: 0, prep: 1, rub: 2, accel: 3, excite: 4, sync: 5, loadup: 6, normal: 7 }[cmd];
  if (k == null) return null;
  return tcsStepIn(U, k, arg);
}
/* a step push button (or ATS AUTO): the program actuation of the step (page 13 ~ 28): the step before finished (or skipped where the
   drawing allows it), the step-in condition A of the step */
function tcsStepIn(U, k, arg) {
  const c = U.tc,
    tb = U.tb;
  if (c.cur >= 0 && c.cur !== k && c.cur < 6) return 'tumatakbo pa ang step ' + c.cur + ' ' + TCS.names[c.cur];
  if (k === 6 && c.step >= 6) {
    /* LOAD UP again: a new target (the TCS panel target MW) */
    tb.st = 'load';
    tb.aim = c.aim = isFinite(+arg) ? +arg : 45;
    c.cur = 6;
    return '';
  }
  /* the step before: 0 is skipped when the HP first stage metal is above 150 C (page 13 *1); the rub check is bypassed in warm / hot
     (page 14 Fig. 1: complete when not ambient cold / cold 1, PR-OPE-5002 8267) */
  const need = k === 1 ? -1 : k === 3 && !(c.mode === 'amb' || c.mode === 'c1') ? 1 : k - 1;
  if (c.step < need) return 'tapusin muna ang step ' + need + ' ' + TCS.names[need] + ' (ATS page ' + [13, 14, 17, 19, 23, 24, 26, 28][need] + ')';
  if (c.step >= k) return 'tapos na ang ' + TCS.names[k];
  const miss = tcsMiss(U, TCS_A[k]);
  if (miss) return 'CRITERIA A' + k + ' (' + TCS.names[k] + ') kulang: ' + miss;
  c.cur = k;
  c.ph = 'in';
  c.tm = 0;
  if (k === 6) c.aim = isFinite(+arg) ? +arg : 45;
  return '';
}
function tcsDone(U, k) {
  const c = U.tc;
  c.step = k;
  c.cur = -1;
  c.ph = '';
  c.last = TCS.names[k] + ' tapos';
}
/* one step of dt s: auxiliaries, metal, ATS program. Called by anUnitStep before the turbine black box; tb.rpm / tb.st / tb.icv are set
   here while the ATS controls the speed */
function tcsStep(U, dt) {
  const c = U.tc;
  if (!c) return;
  const tb = U.tb,
    s = tcsSteam(U);
  /* aux steam header: from the main steam through MV-AS1391 (PCV to 10 kg/cm2, PR-OPE-5002 5708 aux 10 ksc) */
  const PaSS = c.asv ? Math.max(0, Math.min(10.5, U.Pd - 1)) : 0;
  c.Pa += ((PaSS - c.Pa) * dt) / TCS.tauAux;
  if (c.Pa < 7) c.gland = c.gland && c.Pa > 5;
  if (!c.lop) c.tg = false;
  /* turning gear: about 3 rpm (PR-OPE-5002 7955); disengages above 4 rpm and engages again at zero speed */
  const steam = tb.st !== 'off' && (tb.icv > 0.001 || U.gv > 0.001);
  /* metal: toward the steam while steam flows, else cooling to the ambient (ASSUMED time constants) */
  const Ta = U.Tamb || 30;
  if (steam) {
    c.Thp += ((s.mst - c.Thp) * dt) / TCS.tauMetal;
    c.Trh += ((s.rht - c.Trh) * dt) / TCS.tauMetal;
  } else if (c.cur === 0 && c.ph === 'warm') {
    c.Thp += ((s.mst - c.Thp) * dt) / TCS.tauMetal;
  } else {
    c.Thp += ((Ta - c.Thp) * dt) / TCS.tauCool;
    c.Trh += ((Ta - c.Trh) * dt) / TCS.tauCool;
  }
  if ((c.cur === 1 && c.ph === 'chest') || c.rst) c.Tcvi += ((s.mst - c.Tcvi) * dt) / TCS.tauChest;
  else c.Tcvi += ((Ta - c.Tcvi) * dt) / TCS.tauCool;
  c.Tcvo += ((c.Tcvi - c.Tcvo) * dt) / TCS.tauChestO;
  /* shell expansion (HP side), mm: 3 mm at about 180 C (page 20 question 2 > 3 mm after the 1800 rpm soak; ASSUMED linear) */
  c.sexp = Math.max(0, (c.Thp - Ta) * 0.02);
  /* LP exhaust hood: windage of the blades with little steam, the hood spray below 15 % load (PR-OPE-5002 9195), the vacuum
     (ASSUMED, ambient 30 C: with the spray about 56 C at 3600 rpm with no load, about 49 C at the initial load 4.5 MW, about 58 C on load: under the 80 C of 1.12) */
  const sp = Math.min(1, (tb.rpm || 0) / 3600),
    /* 3.2.0-beta.38: the hood spray FVCD1904 in AUTO (PR-OPE-5002 6307, put in AUTO at the vacuum up) sprays below 15 % load (22.5
       MW, 9195) and takes 70 % of the windage heat (ASSUMED). Without it: 82 C at 3600 rpm with no load, over the 80 C of 1.12 (hold) */
    hs = c.hsp && (U.MW || 0) < 22.5 ? 0.3 : 1,
    XSS = Ta + 15 + 37 * hs * sp * sp * Math.max(0.35, 1 - (U.MW || 0) / 7.5) + 120 * Math.max(0, 0.9 - (U.vac || 0)) * sp;
  c.Tx += ((XSS - c.Tx) * dt) / TCS.tauX;
  /* holds (PR-OPE-5002 8570 ~ 8576, ATS page 19 *1): vacuum low, exhaust hood temp. high, bearing oil press. low, thermal stress
     high (the steam outside Fig. 2 / 3); not inside the critical zone (8561) */
  const C = tcsCrit(U);
  const why = [];
  if (!C['1.11'].ok) why.push('CONDENSER VACUUM LOW');
  if (!C['1.12'].ok) why.push('EXHAUST HOOD TEMP. HIGH');
  if (!C['1.15'].ok) why.push('BEARING OIL PRESS. LOW');
  if (c.cur >= 2 && c.cur <= 3 && (!C['1.71'].ok || !C['1.72'].ok)) why.push('THERMAL STRESS HIGH (steam / metal mismatch)');
  if (c.cur >= 0 && TCS_B[c.cur]) {
    const mb = tcsMiss(U, TCS_B[c.cur]);
    if (mb) why.push('CRITERIA B' + c.cur + ': ' + mb);
  }
  if (c.opHold) why.push('HOLD ON (operator)');
  const inCrit = tb.rpm > TCS.crit[0] && tb.rpm < TCS.crit[1];
  c.hold = inCrit ? '' : why.join('; ');
  const run = !c.hold;
  const rate = TCS.rate[c.mode] || 120;
  const ramp = aim => {
    if (!run) return;
    tb.rpm = Math.min(aim, tb.rpm + (rate * dt) / 60);
  };
  /* ATS AUTO: the next step by itself (the lines H of the sequence) */
  if (c.auto && c.cur < 0 && c.step < 7) {
    let nx = c.step + 1;
    if (nx === 2 && !(c.mode === 'amb' || c.mode === 'c1')) nx = 3;
    if (nx === 0 && c.Thp > 150) nx = 1;
    if (nx <= (c.autoTo == null ? 5 : c.autoTo) && !tcsMiss(U, TCS_A[nx])) tcsStepIn(U, nx);
  }
  c.tm += dt;
  switch (c.cur) {
    case 0 /* HP TURBINE WARMING (page 13): metal <= 150 C -> warming with steam through CV (B), until above 150 C (TE-1 / TE-2 of the
        TCS drawing are not in the repository: ASSUMED end at 150 C) */:
      if (c.Thp > 150) tcsDone(U, 0);
      else c.ph = 'warm';
      break;
    case 1 /* TURBINE PREPARATION (page 14 ~ 16): CV chest warming when the chest inner or outer wall is <= 150 C, 60 min or (diff < 50 C
        and outer > 180 C); turbine reset, MSV open, load limiter upper */:
      if (c.ph === 'in') {
        c.mode = tcsMode(U);
        if (c.Tcvi > 150 && c.Tcvo > 150) c.ph = 'reset';
        else {
          c.ph = 'chest';
          c.tm = 0;
        }
      }
      if (c.ph === 'chest' && (c.tm >= 3600 || (Math.abs(c.Tcvi - c.Tcvo) < 50 && c.Tcvo > 180))) c.ph = 'reset';
      if (c.ph === 'reset') {
        c.rst = true;
        tb.st = 'roll';
        tb.rpm = Math.max(tb.rpm, 0);
        tcsDone(U, 1);
      }
      break;
    case 2 /* RUB CHECK (page 17 ~ 18): to 200 rpm, CV / ICV close, coast down below 100 rpm */:
      if (c.ph === 'in') c.ph = 'up';
      if (c.ph === 'up') {
        tb.icv = Math.min(TCS_ICV, tb.icv + dt / 60);
        ramp(TCS.rub);
        if (tb.rpm >= TCS.rub - 0.5) c.ph = 'coast';
      } else if (c.ph === 'coast') {
        tb.icv = 0;
        tb.rpm = Math.max(0, tb.rpm - (100 * dt) / 60);
        if (tb.rpm < 100) tcsDone(U, 2);
      }
      break;
    case 3 /* ACCELERATION (page 19 ~ 22): 1800 rpm heat soak (cold modes), questions HP metal > 170 C and shell expansion > 3 mm,
        3600 rpm heat soak */:
      tb.icv = Math.min(TCS_ICV, tb.icv + dt / 60);
      if (c.ph === 'in') {
        c.soakT = Math.min(c.Thp, c.Trh);
        c.ph = TCS.soak1800[c.mode] > 0 ? 'to1800' : 'to3600';
      }
      if (c.ph === 'to1800') {
        ramp(1800);
        if (tb.rpm >= 1800) {
          c.ph = 'soak1800';
          c.tm = 0;
          c.soakMin = TCS.soak1800[c.mode];
        }
      } else if (c.ph === 'soak1800') {
        if (c.tm >= c.soakMin * 60 && c.Thp > 170 && c.sexp > 3) c.ph = 'to3600';
      } else if (c.ph === 'to3600') {
        ramp(3600);
        if (tb.rpm > 3550) {
          tb.rpm = Math.min(3600, tb.rpm);
          c.ph = 'soak3600';
          c.tm = 0;
          c.soakMin = TCS.soak3600[c.mode];
        }
      } else if (c.ph === 'soak3600') {
        ramp(3600);
        if (c.tm >= c.soakMin * 60) tcsDone(U, 3);
      }
      break;
    case 4 /* EXCITATION (page 23): AVR start, generator voltage OK */:
      c.exc = true;
      if (c.tm >= 30) tcsDone(U, 4);
      break;
    case 5 /* SYNCH. & INITIAL LOAD (page 24 ~ 25): ASD closes 52G, initial load, hold timer (Fig. 3) */:
      if (c.ph === 'in') {
        if (c.tm < 60) break; /* ASD: speed and voltage matched (ASSUMED 1 min) */
        tb.st = 'sync';
        tb.tgt = 0;
        tb.aim = (TCS.init[c.mode] * 150) / 100;
        U.MWinit = tb.aim;
        c.ph = 'init';
        c.tm = 0;
        c.holdMin = TCS.hold(c.mode);
        tcsGcb(U, true);
      } else if (c.ph === 'init' && U.MW >= 0.9 * tb.aim && c.tm >= c.holdMin * 60) tcsDone(U, 5);
      break;
    case 6 /* LOAD UP (page 26 ~ 27): ICV -> CV transfer, load up rate 5 %/min (in the TCS, unit.js) */:
      if (tb.st !== 'load') {
        tb.st = 'load';
        tb.aim = isFinite(c.aim) ? c.aim : 45;
      }
      /* load hold: the load stays where it is while a step criteria B is lost, and goes on to the target after it (before: the hold
         wrote the load of the moment into the target and the step ended there, 18.7 MW of 45 in the hot start-up check) */
      {
        const goal = isFinite(c.aim) ? c.aim : 45;
        tb.aim = !run && isFinite(tb.tgt) ? Math.min(goal, tb.tgt) : goal;
        if (tb.xfer && run && U.MW >= Math.min(44, goal - 1)) tcsDone(U, 6);
      }
      break;
    case 7:
      tcsDone(U, 7);
      break;
  }
  /* the turning gear holds the shaft at about 3 rpm when no steam turns it */
  if (!steam && tb.rpm < 4) {
    const tg = c.tg && c.lop;
    tb.rpm = tg ? Math.min(3, tb.rpm + dt) : Math.max(0, tb.rpm - dt);
  }
  /* a loss of the bearing oil trips a turning machine (1.15) */
  c.trip = (!c.lop && tb.rpm > 4) ? 'BEARING OIL PRESS. LOW' : '';
}
const TCS_ICV = 0.13;
function tcsGcb(U, on) {
  const l1 = U.di && U.di.gcbOn,
    l2 = U.di && U.di.gcbOff,
    w = (l, x) => {
      if (l && l.S.rt.force[l.n] === undefined && l.S.ext.includes(l.n)) l.S.rt.ext[l.n] = x;
    };
  w(l1, on ? 1 : 0);
  w(l2, on ? 0 : 1);
}
/* a turbine trip: the ATS program is reset, the start-up mode is judged again at the next reset (page 12 *1) */
function tcsTrip(U) {
  const c = U.tc;
  if (!c) return;
  Object.assign(c, { step: -1, cur: -1, ph: '', rst: false, exc: false, auto: false });
  tcsMode(U);
}
/* what the TCS panel shows */
function tcsState() {
  const U = AN_UNIT,
    c = U.tc;
  if (!c) return null;
  const C = tcsCrit(U);
  return {
    mode: (TCS.modes.find(m => m[0] === c.mode) || [])[2],
    step: c.step,
    stepName: c.step >= 0 ? TCS.names[c.step] : '',
    cur: c.cur,
    curName: c.cur >= 0 ? TCS.names[c.cur] : '',
    ph: c.ph,
    tmMin: c.tm / 60,
    soakMin: c.soakMin,
    holdMin: c.holdMin,
    hold: c.hold,
    rpm: U.tb ? U.tb.rpm : 0,
    Pa: c.Pa,
    Thp: c.Thp,
    Trh: c.Trh,
    Tcvi: c.Tcvi,
    Tcvo: c.Tcvo,
    Tx: c.Tx,
    sexp: c.sexp,
    aux: { lop: c.lop, eh: c.eh, vex: c.vex, tg: c.tg, asv: c.asv, gland: c.gland, vb: c.vb, ej: c.ej, hsp: c.hsp, auto: c.auto },
    crit: C,
    next: c.cur < 0 && c.step < 7 ? tcsMiss(U, TCS_A[Math.min(7, c.step + 1)] || []) : ''
  };
}
