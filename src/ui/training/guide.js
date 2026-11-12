/* ===== 3.2.0-beta.21 GUIDED TRAINING (user pick 2026-10-24, proposal https://claude.ai/artifact/FnjLxFZYXnFqc9fjvRdHWJ, "Oo, gawin ayon
   sa proposal"; user: "ang hirap nya paganahin ... irrun mo ba ... palipat lipat ka rin ng modules ... pwedeng magskip ng step like hnd
   pa bukas swp, pero pwede ka na mag line up ng steam drum filling ... hindi friendly sa newbie").
   Cold to 150 MW as ONE path of steps, in the order of PR-OPE-5002 (document-references/procedure-start-up-PR-OPE-5002-02.docx) and of
   the app's own cold start that reaches 150 MW (src/ui/uat/check.js chain cold -> coal -> byp -> roll -> up, tests/regress/check_panel.js):
   - one step is open at a time; the next one opens only when the logic shows this one done (no skipping);
   - the step's actions are on its card (start a pump = its running memory, the same address as the Inputs list; a controller = its own
     faceplate or one button for the exact setting; the TCS panel = AN.turbine), so there is no going to the Logic or the Plant view;
   - the FIELD items (local valves, gauges, panels: no DCS signal) of a section are one card, confirmed with one press;
   - there is no coach (user 2026-10-29, #108: the real plant has none): the trainee makes every trim of the procedure (furnace pressure,
     firing rate <= 60 C/h (PR-OPE-5002 gradient 1 C/min), O2, drum level, HP bypass SV, coal) on the faceplates of the step, and a step goes on only on the real signals;
   Nothing here changes the logic: it writes only what an operator writes (inputs, faceplate modes, SV, MV, TCS commands). ===== */
window.LS_GUIDE = (function () {
  const L = () => window.LS_LIVE;
  const PROC = () => window.LS_PROC5002 || [];
  let HH = null,
    HOf = null,
    HRt = null;
  /* the plant helpers of check.js (the same reading and writing as the CHECK scenarios), kept while the ABC sheets stay the same.
     Mina beta.157: after LOAD of a save point the dock read MW 0, MSP 128.7 and MSF 468.8 for the whole run: a keyframe gives every sheet
     a new run-time object (engine/state.js anStateApply, S.rt = r.rt), so the helpers are made again when that object changes */
  const rtNow = () => {
    const sh = AN.sheets && AN.sheets.find(x => x.name === 'ABC-001C');
    return sh && sh.S ? sh.S.rt : null;
  };
  const h = () => {
    const rt = rtNow();
    if (!HH || HOf !== AN.sheets || HRt !== rt) {
      HH = CHECK.H();
      HOf = AN.sheets;
      HRt = rt;
    }
    return HH;
  };
  const U = () => AN.unit || {};
  /* 3.2.0-beta.38: the TCS / ATS model (src/analog/engine/tcs.js) */
  const TC = () => (AN.tcs && AN.tcs()) || { aux: {}, crit: {}, step: -1, cur: -1 };
  /* 3.2.3-beta.56: a TCS hold stays latched after its condition clears (tcs.js holdL, ATS sequence page 11): the operator presses HOLD OFF on the TCS panel. The ATS steps had no button for it, so the rub check stood at 3 rpm. */
  const HOFF = () => Object.assign(btn('HOLD OFF (TCS)', () => A.tcs('holdoff')), { on: () => !/press HOLD OFF/.test(TC().hold || ''), hide: () => !/press HOLD OFF/.test(TC().hold || '') });
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
      if (AN.opSheet) AN.opSheet(k);
      const c = h().ctl(k, t);
      if (c) return h().man(k, t, x), '';
      const s = station(t);
      if (!s) return 'no station ' + t;
      if (AN.latchMode) AN.latchMode(t, 'MAN');
      /* the .MV input of the station too: with MAN latched the switch of the drawing takes that leg, and the engine had the old value there */
      AN.stVal(k, s.b.id, x, (s.b.i || []).filter((n, i, L) => n >= 0 && L.indexOf(n) === i && s.T.ext.includes(n) && !(s.T.xlk && s.T.xlk[n]) && (AN.nm(s.T, n) || '').trim() === t + '.MV'));
      return '';
    },
    /* Mina (beta.116 ~ 118 bisect): a hand station in AUTO whose AUTO leg is the operator's own set (an input of the sheet: ABC-001A
       HIC-ULD TARGET MW, COS SI0243 "TARGET MW SETUP FROM CCS CRT") moves that set, as the plant view faceplate (hmi.js set): ▼▼ in
       AUTO = a new target MW, the CCS ramps to it. x == null: the set now; null = the station has no such set */
    target(t, x) {
      const s = station(t);
      if (!s) return null;
      const S = s.T,
        b = s.b,
        si = b.svI >= 0 ? b.i[b.svI] : null,
        dr = si != null ? (S.drv[si] || []).find(z => z.k === 'AMT') : null,
        ds = dr && S.rt.st[dr.id];
      if (!(dr && ds && ds.pk === 'A' && dr.a != null && S.ext.includes(dr.a) && !(S.xlk && S.xlk[dr.a]))) return null;
      if (x == null) {
        const e = S.rt.ext[dr.a];
        return isFinite(e) ? +e : +S.rt.v[dr.a];
      }
      const p = b.p || {},
        lo = p.lo != null ? +p.lo : -Infinity,
        hi = p.hi != null ? +p.hi : Infinity;
      if (AN.opSheet) AN.opSheet(shOf(t));
      S.rt.ext[dr.a] = Math.max(lo, Math.min(hi, x));
      try {
        AN.settle();
      } catch (e) {}
      return '';
    },
    /* the value of a hand station without a mode change (HIC-TADBS) */
    val(t, x) {
      const s = station(t);
      if (!s) return 'no station ' + t;
      if (AN.opSheet) AN.opSheet(shOf(t));
      AN.stVal(shOf(t), s.b.id, x);
      return '';
    },
    auto(t, sv) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      if (AN.opSheet) AN.opSheet(k);
      if (h().ctl(k, t)) return h().autoSv(k, t, sv), '';
      /* a hand station: AUTO = .MAN 0 on every sheet (CLAUDE.md 10) */
      for (const [S2, n] of AN.modeNets(t) || []) S2.rt.ext[n] = 0;
      return '';
    },
    rem(t) {
      t = L().ctlTag(t) || t;
      const k = shOf(t);
      if (!k) return 'no faceplate ' + t;
      if (AN.opSheet) AN.opSheet(k);
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
  /* user 2026-10-29 (#108, no coach): the operator's own trims, one press = one step of the faceplate (the same signal as the sheet) */
  /* .tag: the loop of the button (the dock leaves out a button whose loop has its own control card: the same MV ▲▼ twice) */
  const step = (l, t, d) => Object.assign(btn(l, () => A.man(t, Math.max(0, Math.min(100, Math.round((+mv(t) || 0) * 2) / 2 + d)))), { tag: t });
  /* 3.2.3-beta.99 (drum LOW-LOW at step 68, automatic run on beta.93): the floor of the oil ▼ is the burner minimum fire, not 20 %.
     PR-OPE-5002 sect 27 "min = 614.4 ... max = 3078" and the M&S load curve 1612 13-4-71 (614.4 kg/h MIN, range 1:5): the MV that gives
     614.4 kg/h at the ring pressure of now, by the burner model of boiler.js (Q = Kb x MV x sqrt(P2 - Q / g)); about 15 % at 10.5
     kg/cm2. Before: 20 % (NO-SOURCE), about 820 kg/h a burner: four burners at 20 % made 68 T/H of steam on the 35 kg/cm2 hold, more than
     the full open blow-off passes (about 62 T/H), the pressure rose to 38 and the drum fell to -307 mm (low-low MFT) */
  /* the ring pressure P2 is read back from a lit burner (its flow PV FICDO1043x and its valve MV): P2 = (Q / (Kb x MV))^2 + Q / g, the
     same burner model; the engine's own ring pressure is not in this page. With no lit burner: 20 % as before */
  const oilMin = ks => {
    const q = 0.6144,
      g = 0.6144 * 0.980665,
      kb = 3.072 / Math.sqrt(10.5 - 5 / 0.980665);
    let lo = 20;
    for (const k of ks || ['A', 'B', 'C', 'D']) {
      const x = (+mv('FICDO1043' + k) || 0) / 100,
        Q = +pv('FICDO1043' + k) || 0;
      if (!(x > 0.02 && Q > 0.05)) continue;
      const P2 = (Q / (kb * x)) ** 2 + Q / g;
      if (P2 > q / g) lo = Math.min(lo, Math.max(1, Math.ceil((100 * q) / (kb * Math.sqrt(P2 - q / g)))));
    }
    return lo;
  };
  const oilStep = (l, ks, d) =>
    btn(l, () => {
      const lo = oilMin(ks);
      for (const k of ks) if (bit({ A: 'M.3412', B: 'M.3413', C: 'M.3418', D: 'M.3419' }[k]) > 0.5) A.man('FICDO1043' + k, Math.max(lo, Math.min(100, Math.round(+mv('FICDO1043' + k) || 0) + d)));
      return '';
    });
  /* 3.2.3 automatic run (sections 17 ~ 40): PICMS1002 put in AUTO SV 35 at 15 kg/cm2 shut the MS blow-off (PV under the SV, MV to 0)
     against PR-OPE-5002 ("Ensure MS BLOW OFF VALVE (BOV) > 10 % OPEN"): the boiler stored its heat closed, at 35 kg/cm2 the blow-off went
     0 -> 100 % in 5 minutes (75 T/H), the pressure overshot to 41 ~ 42 and the drum level fell 40 -> -346 mm = MFT. The blow-off now
     takes the set point near the drum pressure and the set point is raised 1 kg/cm2 at a time, at most one every 2 minutes of the plant
     (about 0.5 kg/cm2 a minute: 1 C a minute of the saturation temperature at 20 ~ 35 kg/cm2, the PR-OPE-5002 heating gradient), so the
     blow-off passes steam all the way up and the start-up valve feeds it back as it goes. The ramp is the HP bypass way of step 61 (SV +1);
     its pace is a calculation from the PR-OPE-5002 heating gradient 1 C a minute: steam table 20 -> 35 kg/cm2 is 212 -> 243 C, about
     2 C per kg/cm2, so 1 kg/cm2 each 2 minutes (3.2.3-beta.57: was marked ASSUMED) */
  let bovT = -1e9;
  const bovAuto = () => btn('PICMS1002 A, SV at the drum pressure (+1)', () => A.auto('PICMS1002', Math.min(35, Math.max(1, Math.round(+U().Pd || 0) + 1))), () => md('PICMS1002') === 'AUTO');
  const bovRamp = () =>
    btn(
      'MS blow-off PICMS1002 SV +1 (one each 2 minutes, up to 35)',
      /* 3.2.3-beta.107 (Mina live beta.102: blow-off 94 ~ 100 % from about t 394 to 421 with the SV 26 ~ 34 behind the drum pressure
         after the B / C light-off): when the pressure has run 2 kg/cm2 or more over the SV, the SV goes back to the drum pressure (the
         set point of step 54, "the MS blow-off PICMS1002 in AUTO with its set point at the drum pressure"), not +1 */
      () => {
        if (md('PICMS1002') !== 'AUTO') return 'Put PICMS1002 in A first';
        bovT = simT();
        const sv = Math.round(+svOf('PICMS1002') || 0),
          p = +U().Pd || 0;
        return A.auto('PICMS1002', Math.min(35, p >= sv + 2 ? Math.round(p) : sv + 1));
      },
      /* 3.2.3-beta.100 (Mina B94-1 / beta.99 retest, Do it for me every 700 ms at x10): the ramp went +1 each 2 minutes whatever the
         pressure did, SV 4 -> 35 in 64 minutes while the drum was only at 24 kg/cm2: the SV stood over the pressure, the blow-off stayed
         shut (MV 0), the boiler stored its heat closed and at 35 ~ 39 kg/cm2 the blow-off went 0.7 -> 100 % in 14 minutes, 66 T/H of steam
         on 6 ~ 36 T/H of feed, drum low-low MFT. PR-OPE-5002 "Ensure MS BLOW OFF VALVE (BOV) > 10 % OPEN": the next +1 waits until the
         blow-off passes steam again (MV >= 10 %), so the set point follows the pressure instead of running ahead of it */
      () => md('PICMS1002') === 'AUTO' && ((+svOf('PICMS1002') || 0) >= 35 || simT() - bovT < 120 || (+mv('PICMS1002') || 0) < 10)
    );
  const svStep = (l, t, d, lo, hi) => Object.assign(btn(l, () => (md(t) === 'AUTO' ? A.auto(t, Math.max(lo, Math.min(hi, Math.round((+svOf(t) || 0) + d)))) : 'Mode ' + md(t) + ' on ' + t + ': put it in A first')), { tag: t });
  /* 3.2.3 automatic run (beta.52, steps 74 ~ 76): the SV +1 and oil buttons had no done state: the runner pressed them every look, the HP
     bypass SV went to 123 (no steam out, drum +259 mm HH, MFT) and the oil went up with no pause. Now the HP bypass SV goes +1 at most
     once a minute up to 61 (PR-OPE-5002 roll pressure 61.2; pace = PR-OPE-5002 heating gradient 1 C a minute of the saturation
     temperature: steam table 48 -> 61 kg/cm2 is 262 -> 277 C, about 1.1 C per kg/cm2, so +1 kg/cm2 a minute; FHI Fig. 1 allows up
     to 110 C an hour) and the oil ▲ / ▼ show only outside the 40 ~ 55 T/H band (40 T/H: PR-OPE-5002 "Steam Flow of 40 T/H above is
     recommended"; the upper 55 and the one press each 2 minutes: NO-SOURCE, team-files ASSUMED_sources_2026-11-11 row 17) */
  const paceT = {};
  /* 3.2.3-beta.101 (Mina live beta.100, drum -248 mm at the bypass; automatic run from step 75: -243 mm): the HP bypass SV went +1 each
     minute up to 61 while the pressure was still 44 kg/cm2, the HP bypass and the blow-off stayed shut (steam flow 0), then the pressure
     reached 61 and the HP bypass opened 0 -> 45 % at once: steam 0 -> 55 T/H on a feed of 10 ~ 23 T/H and the drum fell. PR-OPE-5002
     BYPASS SYSTEM SERVICING: "Crack open the HP bypass valve PCVMS1020 at 1~3 %", "Gradually OPEN HP bypass valve to 5 % while closely
     monitoring ... Drum Level". The HP bypass SV goes up only while the steam flow is 40 T/H or more, as the bypass servicing step
     says ("when the HP bypass is in service (MSP >= 48, steam >= 40), raise the HP bypass SV by 1 kg/cm2 per minute up to 61"): the
     boiler is never closed while the SV climbs. (A first try with HP bypass MV >= 5 % was not enough: at 4 ~ 6 % it passed only 4 T/H,
     the SV still reached 61 first and the drum fell to -235 mm.) */
  const svRamp = (t, hi, sec) => Object.assign(btn(t + ' SV +1 (one each minute, up to ' + hi + ')', () => { if (md(t) !== 'AUTO') return 'Put ' + t + ' in A first'; paceT[t] = simT(); const v = Math.min(hi, Math.round(+svOf(t) || 0) + 1); if (t === 'PICMS1006' && md('PICMS1002') === 'AUTO' && (+svOf('PICMS1002') || 0) < v + 2) A.auto('PICMS1002', v + 2); return A.auto(t, v); }, () => md(t) === 'AUTO' && ((+svOf(t) || 0) >= hi || simT() - (paceT[t] || -1e9) < sec || (t === 'PICMS1006' && !(h().MSF() >= 40)))), { tag: t });
  /* 3.2.3-beta.93 (Mina B92-1, live Cold run on beta.92): with the HP bypass and the MS blow-off still shut (their SV over the pressure)
     the steam flow stays 0, so "steam flow under 40" pressed oil ▲ every 2 minutes up to 85 %: the boiler was a closed vessel, the
     pressure went 51 -> 66 kg/cm2, both valves opened together (0 -> 66 % and 0 -> 46 %), the steam went 0 -> 133 T/H in 12 minutes on
     a feed of 68 T/H and the drum fell to the low-low level (MFT). Oil ▲ for the steam flow is due only while the steam has a way out
     (the HP bypass or the blow-off passing, PR-OPE-5002 BYPASS SYSTEM SERVICING: the HP bypass sets the pressure) and never over the
     heating rate (PR-OPE-5002: 60 °C/h; 55 = the top of the 45 ~ 55 band of the step text, as heatSeek) */
  const outOpen = () => (+mv('PICMS1006') || 0) > 0.5 || (+mv('PICMS1002') || 0) > 0.5;
  /* 3.2.3-beta.107 (Worker run on beta.102, steps 75 ~ 81): while the HP bypass SV climbs (svRamp) the pressure is under the SV, the
     heat goes into the pressure (stored) and the steam flow reads under 40 T/H: the oil ▲ for 40 T/H took the oil 2.9 -> 6.1 T/H, and at
     the end of the ramp (SV 61) that firing came out as steam: 47 -> 106 T/H, 64 kg/cm2, drum -116 / +108 mm at step 81 (Mina live
     beta.102: +190 / -172.5). The oil goes up for the steam flow only when the HP bypass holds the pressure (main steam at its SV),
     not while the pressure is still climbing to it */
  const atSv = () => md('PICMS1006') !== 'AUTO' || h().MSP() >= (+svOf('PICMS1006') || 0) - 0.5;
  /* 3.2.3-beta.107: the 10-minute mean of the main steam flow (first-order filter on plant time) for the stage-7 oil band; null for the
     first 10 minutes and after a gap of more than 20 minutes (a load, a pause of the band) */
  const ms7 = () => {
    const t = simT(),
      q = +h().MSF() || 0,
      m = paceT.m7;
    if (!m || t < m.t || t - m.t > 1200) {
      paceT.m7 = { t, v: q, t0: t };
      return null;
    }
    if (t > m.t) {
      m.v += (q - m.v) * Math.min(1, (t - m.t) / 600);
      m.t = t;
    }
    return t - m.t0 >= 600 ? m.v : null;
  };
  /* 3.2.3-beta.111 (Worker run of beta.107: drum -168 mm at step 75, the oil ▲ each 2 minutes on the steam of the moment ran ahead of
     the HP bypass and the blow-off): as the stage-7 band, the bypass-step band reads the 10-minute mean of the steam (ms7, the steam
     of the moment for its first 10 minutes) and presses once each 5 minutes */
  const msB = () => { const m = ms7(); return m == null ? h().MSF() : m; };
  const oilBand = (up, lo, hi) => { const k = up ? 'oilU' : 'oilD', due = () => (up ? msB() < lo && outOpen() && atSv() && !(rate() > 55) : msB() > hi), b0 = oilStep(up ? 'Oil A / D ▲ +5 % (steam flow under ' + lo + ' T/H)' : 'Oil A / D ▼ −5 % (steam flow over ' + hi + ' T/H)', ['A', 'D'], up ? 5 : -5), f0 = b0.f; b0.f = () => ((paceT[k] = simT()), f0()); return Object.assign(b0, { on: () => !due() || simT() - (paceT[k] || -1e9) < 300, hide: () => !due(), band: 1 }); };
  /* 3.2.3-beta.56 (automatic run, load up to 45 MW on oil): the turbine took 96 T/H while the oil stayed at the 40 ~ 55 T/H of the bypass steps; the main steam fell 61 -> 10 kg/cm2 and the drum swelled to HH (MFT). The load-up steps now show oil ▲ (all lit burners +5 %) while the main steam is under 60 kg/cm2 and oil ▼ over 100 (FHI Part 2 Sect 7 Tab 4 Fig. 2: 60 kg/cm2 at 15 % load, 100 at 30 % = 45 MW; FHI Tab 9 p 2-8-TAB_9-11 step 12 and PR-OPE-5002 27.17: all four burners together to meet the start-up curve), one press each 30 s up / 60 s down (pace NO-SOURCE, ASSUMED_sources row 17), and run x10 while the pressure is under 60. */
  const mspOil = up => { const k = up ? 'mspU' : 'mspD', due = () => (up ? h().MSP() < 60 : h().MSP() > 100), b0 = oilStep(up ? 'Oil ▲ +5 % (main steam under 60 kg/cm², each 30 s)' : 'Oil ▼ −5 % (main steam over 100 kg/cm²)', ['A', 'B', 'C', 'D'], up ? 5 : -5), f0 = b0.f; b0.f = () => ((paceT[k] = simT()), f0()); return Object.assign(b0, { on: () => !due() || simT() - (paceT[k] || -1e9) < (up ? 30 : 60), hide: () => !due() }); };
  /* the Do it for me never presses the ▲ / ▼ trims (the trainee's own hand, #108): the seek of the load-up steps moves the oil instead, by the same rule as the buttons */
  const loadSeek = () => { const P = h().MSP(), up = P < 60, dn = P > 100; if (!(up || dn) || simT() - (paceT.ls || -1e9) < (up ? 30 : 60)) return; paceT.ls = simT(); mspOil(up ? 1 : 0).f(); };
  /* coal before the 45 MW hold (boiler model thread 2026-11-11). Every limit has a source:
     lo = the main steam the step raises the coal to: 100 kg/cm2 at 30 % load with coal in (FHI Part 2 Sect 7 Tab 4 Figure 2 COLD STARTUP;
          45 MW = 30 % of 150 MW) for the hold and feeder C steps; 123 kg/cm2 for the 123 step (PIC-COBM SV, FHI Fig. 2 123 at 40 %,
          HMI snapshot 4.PNG MSP 122.9, docs/hmi/OPERATING_POINTS.md).
     The coal is lowered over 128 kg/cm2, the MS blow-off PICMS1002 SV (HMI snapshot summary list, BLOW-OFF SV 128.0, OPERATING_POINTS.md),
     and already over 123 kg/cm2 (the PIC-COBM SV) while the main steam is rising, for the lag of the coal.
     Automatic run 2026-11-11 (the 123 step had no seek): the coal kept the main steam rising 92 -> 131 kg/cm2, the blow-off opened,
     the main steam 150 -> 265 T/H at 45 MW went out of the cycle, the hotwell drained, the condensate pumps were lost, the deaerator
     emptied, the feedwater went to 0 and the drum LOW tripped the boiler (DITL-03A row 10).
     Run 2026-11-11 b: FIC-CF PV = average of the 3 feeder MVs (drawing, hmi-op.js FIC-CF note): with feeders A and B in AUTO at MV 40 %
     the PV was 26.7 %; feeder C in AUTO took all three to 40 % at once (total coal x 1.5, main steam 97 -> 129, same trip). The feeder C
     AUTO button now first sets FIC-CF MV = its PV (CALC: three feeders at the old average carry the same total coal as before).
     Run 2026-11-11 c: at 75 MW the boiler master HIC-BM in MANUAL held the main steam at the blow-off SV 128 with the blow-off open (M.0255
     = 1, ABC-013 -> ABC-001C M.2013 BU-CMD), so HIC-BM could not go to AUTO; the step text says lower HIC-BM until the pressure falls
     below 128: the same seek on HIC-BM (t), lowered also while M.0255 = 1.
     One press each 30 s up / 60 s down and the 0.2 kg/cm2 'rising' are the pace of the Do it for me (as loadSeek), not plant values */
  const coalSeek = (lo, t = 'FIC-CF') => () => { const P = h().MSP(), bo = h().bit('ABC-001C', 'M.0255') > 0.5; if (simT() - (paceT.cs || -1e9) < 30) return; const rise = paceT.csP != null && P > paceT.csP + 0.2, up = P < lo && !rise, dn = (bo || P > 128 || (P > 123 && rise)) && simT() - (paceT.csD || -1e9) >= 60; paceT.cs = simT(); paceT.csP = P; if (!(up || dn)) return; if (dn) paceT.csD = simT(); const m = mv(t); if (md(t) === 'MAN' && isFinite(m)) A.man(t, Math.max(0, Math.min(100, m + (up ? 1 : -1)))); };
  /* STATION 101 M.0101 (ABC-001C), not STATION 102 M.0101 of ABC-017 */
  const m0101 = () => +h().bit('ABC-001C', 'M.0101');
  /* the TARGET MW set of HIC-ULD (ABC-001A COS SI0243), as the 'HIC-ULD A, TARGET 150' button */
  const uldT = () => { const s = station('HIC-ULD'), d = s && (s.T.drv[s.b.i[s.b.svI]] || []).find(z => z.k === 'AMT'); return d ? { S: s.T, a: d.a } : null; };
  const bmRdy = () => h().MSF() > 230 && bit('M.2013') < 0.5;
  const fw3Rdy = () => h().FW() > 110 && bit('M.0228') < 0.5;
  const loadSlow = () => h().MSP() < 60 || Math.abs(h().lvl()) > 100;
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
  /* live test #71: the position transmitters of the flue gas biasing dampers on ABC-020 (I/O list STN104 AI0368 ~ 71 ZT-FG1116-A ~ D RH
     side, AI0372 ~ 75 ZT-FG1117-A ~ D SH side), mean of the four */
  const ZTN = {};
  const ztOf = side => {
    const sh = AN.sheets.find(x => x.name === 'ABC-020'),
      T = sh && sh.S;
    if (!T) return NaN;
    const L4 = side === 'RH' ? ['S4 AI0368', 'S4 AI0369', 'S4 AI0370', 'S4 AI0371'] : ['S4 AI0372', 'S4 AI0373', 'S4 AI0374', 'S4 AI0375'];
    if (!ZTN[side] || ZTN[side].T !== T) {
      const ix = [];
      for (let n = 0; n < T.nets.length; n++) if (L4.includes((AN.nm(T, n) || '').trim())) ix.push(n);
      ZTN[side] = { T, ix };
    }
    const v = ZTN[side].ix.map(n => +T.rt.v[n]).filter(isFinite);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
  };
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

  /* user 2026-10-29 (#108): the 17 coaches of the cold start were removed; the trainee does every trim on the faceplates of the step */

  /* ---------- the steps ---------- */
  const STAGES = ['Utilities', 'Water: hotwell, deaerator, drum', 'Fans and draft', 'Furnace purge', 'Burners and warm-up', 'Vacuum and seals', 'Bypass at 61 kg/cm²', 'Turbine: roll, sync, 45 MW', 'Coal at 45 MW', 'Load up to 150 MW', 'Practice: load change', 'Normal shutdown', 'Bottle-up', 'Turbine trip and hot restart', 'BFWP A trip at 150 MW', 'O2 analyzer A fails', 'PA fan trip at 150 MW'];
  const B = () => L().B;
  /* a motor button: START / STOP of its running memory (memory list), the same address the Inputs list forces */
  const mot = (a, l) => ({ ad: a, l: 'START ' + l, f: () => A.motor(a, 1), on: () => bit(a) > 0.5, stop: { l: 'STOP ' + l, f: () => A.motor(a, 0) } });
  const btn = (l, f, on) => ({ l, f, on });
  /* the "Do it for me" of a trim step (the ▲ / ▼ buttons, pressed together they cancel): one press moves each station one step toward
     the band of its value. [read, lo, hi, station, step, inv]: below lo the MV goes up (inv: down), above hi down (inv: up) */
  const seekB = L => () => {
    for (const [rd, lo, hi, t, d, inv] of L) {
      const x = rd(),
        m = Math.round(+mv(t) || 0);
      if (!isFinite(x)) continue;
      const k = x < lo ? 1 : x > hi ? -1 : 0;
      if (k) A.man(t, Math.max(0, Math.min(100, m + (inv ? -k : k) * d)));
    }
    return '';
  };
  const call0 = f => {
    try {
      return f();
    } catch (e) {
      return null;
    }
  };
  /* a motor that the old (no one world) way starts with an extra forced memory (feeder C + M.3405 ALL IN REMOTE AND RUNNING) */
  const WLm = (a, l, fOff) => Object.assign(mot(a, l), { f: () => (WL() ? A.motor(a, 1) : fOff()) });
  /* a push button / an output of a DITL drawing (one world ON): the press is an engine action (src/world/dock-eng.js), the output is read
     from the dock (src/ui/training/dock.js) */
  const dPress = (nm, row) => !!(window.WORLD && WORLD.dpress && WORLD.dpress(nm, row));
  const dOut = (nm, row) => (window.LS_DOCK && LS_DOCK.dout ? LS_DOCK.dout(nm, row) : null);
  const dRun = nm => (window.LS_DOCK && LS_DOCK.runOut ? LS_DOCK.runOut(nm) : null);
  /* 3.2.0-beta.23: a condition read on the DITL while the one world runs (w), else the ABC / plant condition (o) */
  /* retest #28: the one world is built (its last scan while PAUSED: a condition of a DITL step is not shown ✓ just because the time stands still) */
  const WL = () => !!(window.WORLD && WORLD.on && WORLD.idx);
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
    },
    get hold() {
      return (WL() ? w : o).hold;
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
  /* Mina bottle-up (beta.116): the standby FA blower in AUTO started when FAB-A stopped; MANUAL on both machines of DITL-28A first */
  const fabMan = () => {
    const D = window.LS_DOCK;
    if (!D || !D.amRow || !D.dsel) return '';
    for (const nm of ['DITL-28A', 'DITL-28A #B']) {
      const sh = (typeof S !== 'undefined' ? S.sheets.concat((window.WORLD && WORLD.inst) || []) : []).find(x => x.name.endsWith(nm));
      const r = sh && D.amRow(sh);
      if (r) D.dsel(nm, r.row, 0, 'FA blower ' + (nm.endsWith('#B') ? 'B' : 'A') + ' MANUAL');
    }
    return '';
  };
  const bOff = L => btn('BURNER ' + L + ' OFF (DITL-09)', () => dPress(BR[L][1], 10), () => dOut(BR[L][0], 19) === 0);
  /* e5 section 13 restart (boiler model thread 2026-11-11): the firing restart swells the drum (automatic run: up to +345 mm, over HH).
     FHI Part 2 Sect 8 Tab 9 p 2-8-TAB_9-26 / 27, high water: open the intermittent blowdown (MBD, MV-BD1001 DITL-38), reduce steaming,
     feedwater control to MANUAL. They show from the drum level H alarm +127 mm (alarm list 20160912, LT-BR1001; HH +254 = MFT, DITL-03E).
     The MV step of 5 % is the size of the button press (like the other ▲ ▼ buttons), not a plant value */
  const hiW = () => [
    Object.assign(btn('High water: feedwater FICFW1007 MANUAL, MV −5 % (drum above H +127 mm)', () => { const m = mv('FICFW1007'); A.man('FICFW1007', isFinite(m) ? Math.max(0, m - 5) : 0); }), { hide: () => !(h().lvl() > 127) }),
    Object.assign(mcvB('MV-BD1001', 1), { hide: () => !(h().lvl() > 127) }),
    Object.assign(mcvB('MV-BD1001', 0), { hide: () => !(mcvPos('MV-BD1001') > 0 && h().lvl() <= 127) })
  ];
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
  /* live check #95 (Hakbang 26 stuck): the instance of the valve is looked up when the button is pressed, not when the steps are made
     (then the machine instances of the one world did not exist yet: the button pressed nothing and the interlock / FIELD of the step
     went to the first valve of DITL-38, MV-BD1001). DITL-38 instance names: "(62)DITL-38 #MV-FW1391" */
  const mcvB = (tag, open) => {
    const nm = 'DITL-38 #' + tag,
      ad = () => {
        const x = mcvS(tag);
        return x && !x._inst.k ? 'DITL-38' : nm;
      };
    return Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (DITL-38)', () => (WL() && mcvS(tag) ? dPress(ad(), open ? 4 : 10) : ''), () => !WL() || (open ? mcvPos(tag) >= 100 : mcvPos(tag) <= 0)),
      { dg: [nm, open ? 4 : 10], ad: nm }
    );
  };
  /* P2 #13: a single-valve MOV drawing (DITL-54 start-up ejector MV-AS1395, DITL-55 steam jet air ejector MV-AS1396, DITL-56 vacuum
     breaker MV-AV1391): OPEN / CLOSE P.B. rows of the drawing (0-based), the position of the DITL valve model */
  const dInG = (nm, r) => {
    const s = movS(nm) || (window.LS_DOCK && LS_DOCK.dOf(nm));
    return !!s && window.DUI && DUI.rowVal(s, r) === 1;
  };
  const movS = nm => (typeof S !== 'undefined' ? S.sheets.find(x => x.name === nm || x.name.endsWith(')' + nm)) : null);
  const movPos = nm => {
    const x = movS(nm);
    return x && typeof MST !== 'undefined' && MST[x.name] && MST[x.name][0] ? +MST[x.name][0].pos : 0;
  };
  const movB = (nm, tag, open, ro, rc) =>
    Object.assign(
      btn(tag + (open ? ' OPEN' : ' CLOSE') + ' (' + nm + ')', () => (WL() ? dPress(nm, open ? ro : rc) : ''), () => !WL() || (open ? movPos(nm) >= 100 : movPos(nm) <= 0)),
      { dg: [nm, open ? ro : rc], ad: nm }
    );
  /* PR-OPE-5002 18 HOTWELL FILLING: "use hotwell level control valve LCV-MU1110 and hotwell filling motorized valve MV-MU1001" (DITL-60,
     row 3 OPEN / row 12 CLOSE P.B.). On the hold at 35 kg/cm2 the MS blow-off sends 60 ~ 70 T/H to the air, more than LCV-MU1110 alone
     (58 T/H, valve sheet p90): the hotwell falls. The operator opens MV-MU1001 when the hotwell is low and closes it when it is back high */
  const hwL = () => +pv('LICCD1110A') || 0;
  /* 3.2.3-beta.80 (CHAEWON, warm-up drum LOW: Sakura baseline run3, this thread's runs from the save at step 49): with muFill the hotwell
     filling MOV opened under -100 mm and shut over +50 mm only while this step was shown; on the field steps that follow (58 ~ 73, 1 ~ 2 h of
     the plant) nobody opened it again, the blow-off kept venting 60 ~ 75 T/H, LCV-MU1110 alone gave about 46 ~ 58 T/H, the hotwell fell
     under LSLL-CD1110 -150 mm (plantsw.js), DITL-61A row 11 stopped the condensate pump, the deaerator ran empty, no feedwater, drum
     LOW-LOW = MFT. PR-OPE-5002 18 HOTWELL FILLING: LCV-MU1110 AND MV-MU1001; the step text: the steam that leaves to the air is water the
     make-up must give back. So MV-MU1001 is opened here and stays open while the MS blow-off vents; it is shut at the bypass servicing step
     (the blow-off closes, the steam goes back to the condenser through the bypasses) */
  const muOpen = () => (WL() && movPos('DITL-60') < 100 ? [movB('DITL-60', 'MV-MU1001', 1, 2, 11)] : []);
  const muFill = () => (!WL() ? [] : hwL() < -100 && movPos('DITL-60') < 100 ? [movB('DITL-60', 'MV-MU1001', 1, 2, 11)] : hwL() > 50 && movPos('DITL-60') > 0 ? [movB('DITL-60', 'MV-MU1001', 0, 2, 11)] : []);
  /* automatic run 2026-11-11 (plan c5, sections 17 and up): the polisher MOVs MV-CD1007 / 1008 (DITL-64 / 65 row 10 REMOTE SELECTED
     I.0258 / I.025D) and the vacuum breaker MV-AV1391 (DITL-56) are LOCAL on a cold plant: OPEN / CLOSE did nothing and the step never
     ended. The field operator turns the MOV selector to REMOTE first (the same as the FIELD: to REMOTE of a motor, dock.js dremote) */
  const movRem = (nm, tag) =>
    Object.assign(
      btn('FIELD: ' + tag + ' to REMOTE', () => (WL() && window.LS_DOCK ? (LS_DOCK.dremote(nm, tag), '') : ''), () => !WL() || !window.LS_DOCK || LS_DOCK.modeOf(nm) == null || LS_DOCK.modeOf(nm).rem !== false),
      { loc: 1, ad: nm }
    );
  /* a field contact of a DITL drawing set by the field side (fieldSet of the dock: the row and its twins of the same address) */
  const fldRow = (l, nm, row) =>
    Object.assign(
      btn(l, () => {
        const s = WL() && window.LS_DOCK && LS_DOCK.dOf(nm);
        if (s) LS_DOCK.fieldSet([{ s, row, want: 1, svc: String((DUI.rowInfo(s, row) || {}).svc || '') }]);
        return '';
      }, () => !WL() || dInG(nm, row)),
      { loc: 1, dg: [nm, row], ad: nm }
    );
  const mcvC = (want, f) => C(want, () => !WL() || f(), () => (WL() ? W_MCV().map(t => t.replace('MV-', '') + ' ' + mcvPos(t).toFixed(0) + '%').join(', ') : '— (one world OFF)'));
  const W_MCV = () => ['MV-FW1001', 'MV-FW1391', 'MV-FW1002', 'MV-FW1392', 'MV-MS1391', 'MV-MS1392'];
  const dTxt = (nm, row, on, off) => () => (dOut(nm, row) === 1 ? on : dOut(nm, row) === 0 ? off : '— (one world OFF)');
  /* live test #57: PR-OPE-5002 sec 27 AIR PRE-HEATER SOOT BLOWER START-UP on the sootblower drawings (sand-sootblower-logic.zip PDF
     (14)Ditl80K / (16)Ditl80M, memory list STN102): 80K row 20 PLANT AIR / STEAM SELECT (1: PLANT AIR) = M.4212 "S/B SELECT PLANT AIR /
     STEAM P.B.(CRT)"; 80M row 6 M.417D AIR HEATER SOOTBLOWER START P.B. -> out 373 REMOTE START COMMAND -> 80K row 6 -> TR317 3 s ->
     SB PANEL O.077C MAIN POWER LINE FORWARD STARTER (with 80K row 5 M.4008 all lances on retract position, from DITL80L = the SB panel).
     The forward starter is a 3 s pulse: Mina F62: the engine latches it in the scan (src/world/dock-eng.js WORLD.seen), the page sees only the patches */
  const sbK = () => (typeof S !== 'undefined' ? S.sheets.find(x => /^\(S\d+\)DITL-80K$/.test(x.name)) : null);
  const aphSbFwd = () => {
    const s = sbK();
    return !!(s && WL() && WORLD.seen && WORLD.seen[s.name + '|O.077C']);
  };
  /* the lance retract limits of the SB panel (M.4008 on DITL-80 / 80A / 80G / 80K / 80S; no logic drawing of their source, 80L is the
     panel box): the field operator checks every lance at its retract position (PR-OPE-5002 sec 17 "Ensure soot blower lance is in
     retract position") */
  const sbRet = () => (typeof S !== 'undefined' ? S.sheets.filter(x => /^\(S\d+\)DITL-80/.test(x.name)) : []).flatMap(x => {
    const o = [];
    for (let r = 0; r < 40; r++) if (/AIR PREHEATER S\/B ALL ON RETRACT POSITION/.test((DUI.rowInfo(x, r) || {}).svc || '') && !(WORLD.idx && WORLD.idx.din.get(x) && WORLD.idx.din.get(x).get(r))) o.push([x, r]);
    return o;
  });
  const sbRetOn = () => WL() && sbRet().length > 0 && sbRet().every(([x, r]) => DUI.rowVal(x, r) === 1);
  /* a motor of a DITL drawing with no running memory on the ABC sheets: START / STOP from its drawing, its interlock in the card */
  /* plan c5 (PR-OPE-5002 18 / 21 / 23: "set the standby CEP to REMOTE/AUTO", "Set standby diesel oil pump to AUTO", "Set Standby FAB in
     AUTO Mode"): one machine of the set runs and the other is the standby, REMOTE + AUTO MODE SELECTED on its drawing (the same rows the
     dock's AUTO chip and the sby of "Do it for me" press). L = [[address or drawing, label]], on = its running test */
  const sbyAuto = ad => {
    try {
      const ds = LS_DOCK.dOf(ad),
        r = ds && LS_DOCK.amRow(ds);
      return !!r && DUI.rowVal(ds, r.row) === 1 && LS_DOCK.modeOf(ad).rem !== false;
    } catch (e) {
      return false;
    }
  };
  const SBY = (what, L, on) =>
    C(
      '1 ' + what + ' running, the other the standby in REMOTE + AUTO',
      () => !WL() || (L.some(([a]) => on(a)) && L.some(([a]) => !on(a) && sbyAuto(a))),
      () => (WL() ? L.map(([a, l]) => l + ' ' + (on(a) ? 'RUNNING' : sbyAuto(a) ? 'STANDBY AUTO' : 'STOPPED, not AUTO')).join(', ') : '— (one world OFF)')
    );
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
  /* user 2026-10-29 (#108, no coach): what the trainee reads to fire by hand. The heating rate: the boiler water temperature over the
     last 5 minutes of the plant (PR-OPE-5002: gradient 1 C/min = 60 C/h; FHI Fig 1 allows up to 110), sampled every plant minute (onStep) */
  const RATE = { h: [] };
  const rate = () => {
    const H = RATE.h;
    if (H.length < 2) return NaN;
    const a = H[0],
      z = H[H.length - 1];
    return z[1] > a[1] || z[1] < a[1] ? ((z[1] - a[1]) * 3600) / Math.max(1, z[0] - a[0]) : 0;
  };
  /* 3.2.3-beta.90 (CHAEWON, automatic runs on the in-page Do it for me: drum LEVEL L.L. MFT at step 57 in 2 of 5 runs). The Do it for
     me never presses the oil ▲ / ▼ of the warm-up (#108), so the firing of the burner steps (A / D 60 %, B / C 25 %) stayed: the drum
     went 2 -> 27 kg/cm2 in 38 minutes of the plant (saturation 120 -> 229 C, about 170 C/h against the PR-OPE-5002 gradient 1 C a
     minute = 60 C/h and FHI Fig. 1 110 C/h), the blow-off PICMS1002 (SV +1 each 2 minutes) fell behind and opened to 89 %, the steam
     left faster than the start-up valve fed the drum and the level fell under the LSLL -178 mm. (The test tools of before trimmed the
     oil themselves, so the runs did not show it.) The warm-up steps now do what their text tells the trainee: heating rate over 55 C/h
     oil ▼ −5 %, under 45 C/h oil ▲ +5 % (only under 33 kg/cm2, the low end of the 35 kg/cm2 hold of step 57), on every lit burner, not
     under 20 % (oilStep). Limit = PR-OPE-5002 60 C/h; the 45 ~ 55 band is the band of the step text (Training, margin under 60); one
     press each 2 minutes of the plant = the pace of oilBand (ASSUMED_sources row 17, the pace of the Do it for me, not a plant value) */
  const heatSeek = () => {
    const r = rate();
    if (!isFinite(r) || simT() - (paceT.hs || -1e9) < 120) return;
    const dn = r > 55,
      /* 3.2.3-beta.111 (Worker run of beta.107: oil ▲ at 31 ~ 32 kg/cm2 took the drum to 37.2 against the blow-off SV 35, the blow-off
         opened to 100 % and the drum fell to -136 mm, then rose to +187 at step 73 while it closed): ▲ only under 30 kg/cm2, 5 under
         the hold; the run showed about 5 kg/cm2 of rise after the last ▲ (the lag of the furnace and the bed) */
      up = r < 45 && (+U().Pd || 0) < 30;
    if (!(dn || up)) return;
    paceT.hs = simT();
    oilStep('', ['A', 'B', 'C', 'D'], dn ? -5 : 5).f();
  };
  const f1w = x => (typeof x === 'number' ? f1(x) : x);
  const WARM = [
    ['Boiler water temperature', () => +U().Tw, '°C', f1w, ''],
    ['Heating rate (5 min)', rate, '°C/h', f1w, 'SOP ≤ 60 (1 °C/min)'],
    ['Drum pressure', () => +U().Pd, 'kg/cm²', f1w, ''],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  const BYP = [
    ['Main steam pressure', () => h().MSP(), 'kg/cm²', f1w, 'HP bypass SV'],
    ['Main steam flow', () => h().MSF(), 'T/H', f1w, 'SOP 40 ~ 55'],
    ['Reheat pressure', () => h().RHP(), 'kg/cm²', f1w, '≤ 8.5'],
    ['Flue gas O₂', () => h().O2(), '%', f1w, '3.5 ~ 8'],
    ['Heating rate (5 min)', rate, '°C/h', f1w, 'SOP ≤ 60'],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  const COAL = [
    ['Bed temperature', () => +U().Tb, '°C', f1w, '> 700 (DITL-03F)'],
    ['Main steam pressure', () => h().MSP(), 'kg/cm²', f1w, 'target 123'],
    ['Coal flow', () => h().coal(), 'T/H', f1w, ''],
    ['Burner oil, total', () => +U().oilF, 'T/H', f1w, '1 T/H oil = 2.55 T/H coal'],
    ['Generator MW', () => h().MW(), 'MW', f1w, ''],
    ['Drum level', () => h().lvl(), 'mm', f1w, '±150']
  ];
  function steps() {
    if (ST) return ST;
    const b = B(),
      R = b.RUN;
    const FIELD1 = (st, title, secs, extra) => Object.assign({ st, field: secs, need: 1, t: title, d: 'The field operator does these (local valves, gauges, panels). They have no DCS signal, so just confirm when they are done.' }, extra || {});
    /* 3.2.0 retest #32: one SOP section = one step (Hakbang 4 had 135 items of sections 3 ~ 13): a field card of several sections is
       one card per section, titled as the procedure */
    const secT = si => {
      const s = String((PROC()[si] || {}).t || '').toLowerCase();
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    const FIELD = (st, title, secs, extra) => (secs.length > 1 ? secs.map(si => FIELD1(st, secT(si) + ' (field)', [si], extra)) : FIELD1(st, title, secs, extra));
    /* 3.2.0 retest #33: the equipment of the utility sections that the DCS starts (its DITL drawing: START P.B., RUNNING, TRIP), a local
       machine (compressor: its RUNNING contact on the DITL, set by the field operator), a machine with no DCS signal (hypochlorite pump:
       field equipment of the plant model, source.js) */
    const runC = (want, L) => C(want, () => !WL() || L.some(nm => dRun(nm) === 1), () => (WL() ? L.map(nm => nm.replace(/^DITL-\S+\s*#?/, '') + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED')).join(', ') : '— (one world OFF)'));
    const outC = (want, nm, row, on, off) => C(want, () => !WL() || dOut(nm, row) === 1, dTxt(nm, row, on, off));
    const pbB = (l, nm, row, ad, on) => Object.assign(btn(l, () => (WL() ? dPress(nm, row) : ''), on), { dg: [nm, row], ad, mot: 1 });
    const locRun = (nm, row) => {
      const s = window.LS_DOCK && LS_DOCK.dOf(nm);
      try {
        return s ? DUI.rowVal(s, row) : null;
      } catch (e) {
        return null;
      }
    };
    /* 3.2.0 retest #52: a field start is a toggle (FIELD: START <-> FIELD: STOP), logged in the Event log */
    const locB = (l, nm, row) =>
      Object.assign(btn('FIELD: START ' + l + ' (local)', () => window.LS_DOCK && LS_DOCK.fieldRow(nm, row, locRun(nm, row) === 1 ? 0 : 1, (locRun(nm, row) === 1 ? 'STOP ' : 'START ') + l + ' (local panel)'), () => locRun(nm, row) === 1), { loc: 1, tog: 1, dg: [nm, row] }); /* R9 #75: the centre follows to its drawing (DITL-113 / 114) */
    const fstate = k => !!(AN.fieldState && AN.fieldState()[k]);
    /* PR-OPE-5002 WARMING UP: "Observe steam drum level: swelling approximately > 100 C. Use lowering header drain until to control the
       level and at steam drum pressure of above 10 Kg/cm2 use the MBD and CBD to control the level". The water heats and swells (drum
       level up, plant.js AN_THERM): under 10 kg/cm2 the field operator cracks the lower ring header drains (PD-019, V-BD1005 ~ V-BD1021),
       above 10 they are shut (they no longer drain, plant.js) and the mass blowdown MOV MV-BD1001 (DITL-38) is opened in short strokes;
       the continuous blowdown MV-BD1002 is opened once and stays. Each button shows only when its action is due (on = not due, so
       "Do it for me" presses it only then). 3.2.3-beta.57 (no assumed values): open over the drum level H alarm +127 mm (alarm list 20160912
       LT-BR1001), close back at the normal level 0 (FHI Part 2 Sect 8 Tab 9 p 2-8-TAB_9-13 steps 17 / 19: "blow down the unit as required to
       maintain the water level in sight in the gauge glass", "maintain drum water level at normal"). Before: +50 / -30 mm (no source).
       The 10 % opening of the field drains is NO-SOURCE (ASSUMED_sources row 22) */
    const dPd = () => +U().Pd || 0,
      dLv = () => +h().lvl() || 0,
      dueLhdO = () => dPd() < 10 && dLv() > 127 && !fstate('lhd'),
      dueLhdC = () => fstate('lhd') && (dLv() < 0 || dPd() >= 10),
      dueMbdO = () => dPd() >= 10 && dLv() > 127 && mcvPos('MV-BD1001') <= 0,
      dueMbdC = () => mcvPos('MV-BD1001') > 0 && (dLv() < 0 || dPd() < 10),
      dueCbd = () => dPd() >= 10 && mcvPos('MV-BD1002') < 100;
    const dB = (o, due) => Object.assign(o, { on: () => !due(), hide: () => !due() });
    const DRN = [
      dB(btn('FIELD: lower ring header drains 10 % open (drum level high, under 10 kg/cm²)', () => (A.field('lhd', 10), window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: lower ring header drains 10 % open (PR-OPE-5002 warming up, swelling)'), '')), dueLhdO),
      dB(btn('FIELD: lower ring header drains CLOSE', () => (A.field('lhd', 0), window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: lower ring header drains closed'), '')), dueLhdC),
      dB(mcvB('MV-BD1001', 1), dueMbdO),
      dB(mcvB('MV-BD1001', 0), dueMbdC),
      dB(mcvB('MV-BD1002', 1), dueCbd)
    ];
    { const c = DRN[4], g = c.f; c.f = () => (AN.blowdown && AN.blowdown(true), g()); }
    /* automatic run 2026-11-11 (thermal swell ON): at x300 the level went -92 -> +378 mm between two looks at the screen while burner D waited, the drain came too late, MFT. A warm-up step asks for x10 while the level is above 0 or a drain is due */
    const drnSlow = () => (dLv() > 0 && dPd() < 35) || DRN.some(x => !x.hide());
    /* automatic run 2026-11-11: MV-BD1001 is the first valve of DITL-38 (no machine instance) and stood LOCAL: MCV REMOTE MODE SELECTED was 0 and OPEN did nothing. The field operator puts it in REMOTE first, as the other DITL-38 MOVs */
    { const c = DRN[2], g = c.f; c.f = () => { try { const m = window.LS_DOCK && LS_DOCK.modeOf && LS_DOCK.modeOf('DITL-38'); if (m && m.rem === false) LS_DOCK.dremote('DITL-38', 'MV-BD1001'); } catch (e) {} return g(); }; }
    const fldB = (k, l) =>
      Object.assign(
        btn('FIELD: START ' + l, () => {
          const on = fstate(k);
          A.field(k, !on);
          try {
            window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (on ? 'STOP ' : 'START ') + l + ' (local panel)');
          } catch (e) {}
        }, () => fstate(k)),
        { loc: 1, tog: 1 }
      );
    /* 3.2.0 retest #49 #47: the seawater pumps: 2 of the 3 run (any two), the third is the standby in AUTO (DITL-29A row 4 SEAWATER PUMP x
       AUTO MODE SELECTED, a CRT selection M.1152 / 1162 / 1172; machine B / C = the instances #B / #C of the one world) */
    const SWPM = ['M.3353', 'M.3354', 'M.3355'],
      SWPD = ['DITL-29A', 'DITL-29A #B', 'DITL-29A #C'],
      SWPL = ['SWP-A', 'SWP-B', 'SWP-C'],
      swpN = () => SWPM.filter(a => bit(a) > 0.5).length,
      /* live test 2026-10-30 #12: the standby is AUTO only with its LOCAL / REMOTE selector in REMOTE (DITL-29A row 5 / 18 / 22): the AUTO start
         of the drawing needs both (PR-OPE-5002 section 2 "Ensure SWP in remote position" before "Set the standby SWP to AUTO") */
      remOf = nm => call0(() => LS_DOCK.modeOf(nm).rem) === true,
      swpAuto = j => locRun(SWPD[j], 3) === 1 && remOf(SWPD[j]),
      swpStby = () => SWPM.findIndex(a => !(bit(a) > 0.5));
    const BPD = ['DITL-30', 'DITL-30 #B', 'DITL-30 #C'],
      bpN = () => BPD.filter(nm => dRun(nm) === 1).length,
      bpAuto = j => locRun(BPD[j], 3) === 1 && remOf(BPD[j]),
      bpStby = () => BPD.findIndex(nm => dRun(nm) !== 1);
    /* 3.2.0 retest #46 #33: the values of the equipment the operator reads on the HMI (no transmitter on the ABC sheets): from the HMI snapshot
       030 SEAWATER SYSTEM (SWP 207 ~ 243 A, SWBP 87 A, condenser inlet 1.0 / outlet 0.4 ~ 0.5 kg/cm2) and the SOP (SWP discharge 2.2 ~ 2.4
       ksc, condenser dP 0.4), shown while the pump runs (0 when stopped) */
    const ifRun = (on, x) => (on ? x : 0);
    /* live test 2026-10-30 #9 #10 #21: the values of the plant model, the same number as the HMI 030 (was: fixed numbers here, PISW1110A2
       0.5 in the dock and 0.40 on the HMI); bands of PR-OPE-5002 */
    const uv = k => +U()[k] || 0;
    const SWPW = [
      ['Seawater pumps running', () => swpN() + ' / 3', '', x => x, 'need 2 (the third: standby AUTO)'],
      ...SWPL.map((l, j) => ['Seawater pump ' + 'ABC'[j] + ' current (IIP1501' + 'ABC'[j] + ')', () => uv('swIa' + j), 'A', f1w, 'SOP 205 ~ 215']),
      /* live test beta.74 #35 #36: the SWP discharge (local gauge) and the forebay, plant model, the same number as the HMI 030 */
      ['Seawater pump discharge, running (PG-SW1501)', () => Math.max(0, ...['M.3353', 'M.3354', 'M.3355'].map((a, j) => (bit(a) ? uv('swPd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4'],
      ['Forebay level (LISW1501)', () => +U().swLvl, 'm', f1w, 'SOP NL −4 m (4 m below GL)'],
      ['Seawater header / condenser inlet (PISW1110A1)', () => uv('swPiA'), 'kg/cm²', f1w, 'SOP 1.0 ~ 1.1'],
      ['Condenser seawater outlet A / B (PISW1110A2 / B2)', () => f1w(uv('swPoA')) + ' / ' + f1w(uv('swPoB')), 'kg/cm²', x => x, 'HMI 30.PNG 0.4 / 0.5'],
      ['Condenser seawater ΔP A / B', () => f1w(uv('swPiA') - uv('swPoA')) + ' / ' + f1w(uv('swPiB') - uv('swPoB')), 'kg/cm²', x => x, 'SOP ≥ 0.4']
    ];
    const BPW = [
      ['Seawater booster pumps running', () => bpN() + ' / 3', '', x => x, 'need 2 (the third: standby REMOTE + AUTO)'],
      ...['A', 'B', 'C'].map((l, j) => ['Booster pump ' + l + ' current (IIP1503' + l + ')', () => uv('swIb' + j), 'A', f1w, 'SOP 90 · alarm 120 · trip 126']),
      ['Booster pump suction', () => uv('swBs0'), 'kg/cm²', f1w, 'SOP 1 ~ 1.1'],
      ['Booster pump discharge, running (PG-SW1503)', () => Math.max(0, ...BPD.map((nm, j) => (dRun(nm) === 1 ? uv('swBd' + j) : 0))), 'kg/cm²', f1w, 'SOP 2.2 ~ 2.4 · alarm < 2.2']
    ];
    /* #12: the standby of a pump set (not running): FIELD I-REMOTE (local selector), then AUTO (CRT selection, row au); AUTO refused while LOCAL */
    const stbyB = (D, Lb, au, isRun) =>
      D.flatMap((nm, j) => [
        Object.assign(btn('FIELD: to REMOTE ' + Lb[j] + ' (standby)', () => (window.LS_DOCK && LS_DOCK.dremote(nm, Lb[j]), ''), () => remOf(nm)), { loc: 1, hide: () => isRun(j) || remOf(nm) }),
        Object.assign(
          btn('AUTO ' + Lb[j] + ' (standby)', () => (!remOf(nm) ? 'Still LOCAL on ' + Lb[j] + ': FIELD to REMOTE first (SOP: "in remote position"), then AUTO.' : window.LS_DOCK && LS_DOCK.dsel(nm, au, 1, Lb[j] + ' AUTO MODE SELECTED') && ''), () => locRun(nm, au) === 1),
          { dg: [nm, au], sel: 1, auto: 1, hide: () => isRun(j) }
        )
      ]);
    const runW = (l, L, cur, unit, hint) => [[l + ' running', () => L.filter(f => f()).length + ' / ' + L.length, '', x => x, hint || ''], [l + ' ' + (unit === 'A' ? 'current' : 'discharge press'), () => ifRun(L.some(f => f()), cur), unit, null, '']];
    ST = [
      /* ---- 0 utilities ---- */
      /* 3.2.0 walkthrough #5: PR-OPE-5002 ESP "purge air heater and fan ... 6 hours prior to start-up": confirmed when already 6 h in service,
         or held 6 h of plant time from the card (pre) */
      FIELD(0, 'ESP purge air heater and fan (field), 6 hours before start-up', [0], { pre: 21600, d: 'Do: "Start the 6 h purge (plant time)", then ▶ RUN (the speed goes to ×300 by itself and back to ×1 at 6:00). SOP: the field operator runs the ESP purge air heater and fan 6 HOURS BEFORE start-up. "6 h purge done" becomes available at 6:00; if it has already run 6 h in the field, use "Skip the 6 h (training shortcut)" (it asks to confirm and is logged in Events).' }),
      /* 3.2.0 retest #49: any two of the three SWP (was: a first and a second SWP step, the second showed the third pump to start) */
      { st: 0, sec: 2, it: [0, 32], t: 'Start 2 seawater pumps (SWP), any two', d: 'Do: REMOTE in the field, then START two seawater pumps. The third one is the standby.', c: b.SWP2, max: 2, a: [mot('M.3353', 'SWP-A'), mot('M.3354', 'SWP-B'), mot('M.3355', 'SWP-C')], field: [1], w: SWPW },
      {
        st: 0,
        sec: 2,
        it: [33, 34] /* live test 2026-10-30 #13: the two SOP items of this step (was: the 35 items of section 2) */,
        t: 'Put the standby seawater pump (SWP) in REMOTE and AUTO',
        d: 'Do: FIELD to REMOTE on the seawater pump that is not running, then AUTO (DITL-29A row 4, AUTO MODE SELECTED). This pump starts when a running one trips; the AUTO start of the drawing also needs REMOTE (row 5).',
        c: C('2 seawater pumps running, standby in REMOTE + AUTO', () => !WL() || (swpN() >= 2 && swpStby() >= 0 && swpAuto(swpStby())), () => swpN() + ' running · standby ' + (swpStby() >= 0 ? SWPL[swpStby()] + (remOf(SWPD[swpStby()]) ? ' REM' : ' LOC') + (locRun(SWPD[swpStby()], 3) === 1 ? ' · AUTO' : ' · MAN') : '—')),
        a: stbyB(SWPD, SWPL, 3, j => bit(SWPM[j]) > 0.5),
        runN: swpN,
        field: [1],
        w: SWPW
      },
      /* 3.2.0 retest #32 #33: one step per SOP section 3 ~ 17, the machines started from the DCS or locally (were: two field cards, 135 items) */
      { st: 0, sec: 3, t: 'Start the hypochlorite pump (field)', d: 'The hypochlorite pump has no DCS command (the STN105 DI is running / overload status only, for example P-0762A I.0329): the field operator starts it at the local panel (HCDSP).', c: C('Hypochlorite pump running (field)', () => !!(AN.fieldState && AN.fieldState().hypo), () => 'Hypochlorite pump ' + (AN.fieldState && AN.fieldState().hypo ? 'RUNNING' : 'STOPPED')), a: [fldB('hypo', 'hypochlorite pump')], field: [2], w: [['Hypochlorite pump', () => (fstate('hypo') ? 'RUNNING' : 'STOPPED'), '', x => x, 'local panel']] },
      { st: 0, sec: 4, t: 'Start the seawater pump outlet debris filter (DITL-39)', d: 'REMOTE AUTO START of debris filter system 1 from the DCS (DITL-39 row 8). It runs only while a seawater pump is running.', c: outC('Seawater pump outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 3, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 1 AUTO START (DITL-39)', 'DITL-39', 7, null, () => dOut('DITL-39', 3) === 1)], field: [3], w: [['Seawater pump outlet debris filter', () => (dOut('DITL-39', 3) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 4'], ['Seawater pumps running', () => swpN() + ' / 3', '', x => x, 'need ≥ 1']] },
      /* R9 #71: PR-OPE-5002 section 5 starts a 1st and a 2nd SWBP and puts the third on standby AUTO (HMI 030: SWBP-A / C running, B
         standby): two running, as the SWP (was: one, so the SOP item "Initiate START to 2nd selected SWBP" could never tick) */
      /* live test 2026-10-30 #8: PR-OPE-5002 section 5 "Set the standby SWBP to AUTO": DITL-30 row 4 SEAWATER BOOSTER PUMP x AUTO MODE
         SELECTED (CRT, M.1202 / 1212 / 1222; with it the pump starts when a running one trips: B / C RUNNING off-delay 2 s AND TRIP). The step
         is done with 2 running AND the third in AUTO (was: 2 running only, the third stayed MAN) */
      { st: 0, sec: 5, max: 2, sby: 1, t: 'Start 2 seawater booster pumps (SWBP), any two', d: 'Do: REMOTE in the field, then START two booster pumps (DITL-30). The third one is the standby: AUTO (DITL-30 row 4, AUTO MODE SELECTED). A seawater pump must be running.', c: C('2 booster pumps running, standby in REMOTE + AUTO (DITL-30)', () => !WL() || (bpN() >= 2 && (bpStby() < 0 || bpAuto(bpStby()))), () => (WL() ? BPD.map((nm, j) => 'ABC'[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED' + (bpAuto(j) ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)')), a: [dmot('DITL-30', 'SWBP-A'), dmot('DITL-30 #B', 'SWBP-B'), dmot('DITL-30 #C', 'SWBP-C')], field: [4], w: BPW },
      { st: 0, sec: 6, t: 'Start the booster pump outlet debris filter (DITL-39)', d: 'REMOTE AUTO START of debris filter system 2 from the DCS (DITL-39 row 19).', c: outC('Booster pump outlet debris filter IN OPERATION (DITL-39)', 'DITL-39', 14, 'IN OPERATION', 'stopped'), a: [pbB('Debris filter 2 AUTO START (DITL-39)', 'DITL-39', 18, null, () => dOut('DITL-39', 14) === 1)], field: [5], w: [['Booster pump outlet debris filter', () => (dOut('DITL-39', 14) === 1 ? 'IN OPERATION' : 'STOPPED'), '', x => x, 'DITL-39 out 15']] },
      /* live test 2026-10-30 #23 #24 (H8 stuck: expansion tank 0.80 m, no control of XV-MU1109 / V-MU1033, no AUTO of the standby MWP, yet
         "✓ Tapos"): PR-OPE-5002 section 7 as the plant does it. One MWP running (DITL-112), the standby in REMOTE (row 22) + AUTO (row 15
         AUTO MODE SELECTED, M.1052 / 1062 / 1072: its auto start on a trip of the running one or the header L.L.); the expansion tank
         T-1109 filled to NL 1.7 m through XV-MU1109 (DITL-78: row 5 OPEN P.B. M.1250 / row 9 CLOSE P.B. M.1251 in MAN, row 1 AUTO P.B.
         = row 3 AUTO SELECTED M.1252: open < 40 %, close > 85 % = 1.7 m of LT-CW1109) or its manual bypass V-MU1033 (field), the header
         > 6.0 kg/cm2, the valve closed when the filling is OK, then XV-MU1109 to AUTO when instrument air is available. The step is done
         on the plant: level >= 1.7 m and the filling valve closed (the plant model AN_MU), not on the ticks */
      (() => {
        const MW = ['DITL-112', 'DITL-112 #B', 'DITL-112 #C'],
          ML = ['MWP-A', 'MWP-B', 'MWP-C'],
          mwN = () => MW.filter(nm => dRun(nm) === 1).length,
          mwStby = () => MW.findIndex(nm => dRun(nm) !== 1),
          mwAuto = j => locRun(MW[j], 14) === 1 && remOf(MW[j]),
          et = () => +U().etLvl || 0,
          air = () => (+U().iaP || 0) >= 3.5,
          xvAuto = () => locRun('DITL-78', 2) === 1,
          xvOpen = () => +U().muXv === 1,
          byp = () => fstate('mu1033'),
          closed = () => !xvOpen() && !byp(),
          /* Mina F33: PR-OPE-5002 section 7 uses XV-MU1109 "if instrument air is available"; it is spring opening, so before the air of section 10
             the fill is stopped at the manual line valve V-MU1031 of MU-1-021 */
          lineShut = () => { const V = window.AN.swValves(); return !(+V['V-MU1031'] > 0 && +V['V-MU1032'] > 0); },
          fillShut = () => closed() || lineShut(),
          lineSet = v => {
            window.AN.swValve('V-MU1031', v ? 100 : 0);
            try {
              window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (v ? 'OPEN' : 'CLOSE') + ' expansion tank line valve V-MU1031 (local)');
            } catch (e) {}
          },
          bypSet = v => {
            A.field('mu1033', v);
            try {
              window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (v ? 'OPEN' : 'CLOSE') + ' expansion tank bypass valve V-MU1033 (local)');
            } catch (e) {}
          },
          xvSel = v => {
            if (!window.LS_DOCK) return '';
            LS_DOCK.dset('DITL-78', 0, v);
            LS_DOCK.dsel('DITL-78', 2, v, 'EXPANSION TANK INLET VLV XV-MU1109 AUTO SELECTED (M.1252)');
            return '';
          };
        return {
          st: 0,
          sec: 7,
          max: 1,
          sby: 1,
          slow: () => et() >= 1.4 && et() < 1.69 && !fillShut() && +U().muFill === 1,
          t: 'Start a make-up water pump (MWP) and fill the expansion tank',
          d: 'Do: START one make-up water pump, REMOTE + AUTO on the standby, then fill the expansion tank to its normal level NL 1.7 m and stop the fill. XV-MU1109 (DITL-78) is pneumatic, spring opening (vendor sheet K1AU3-E2-0-123 item 39): without instrument air (Cold, before section 10) it is OPEN and cannot close, so the tank fills through it as soon as the header is above 6 kg/cm². At 1.7 m the field operator closes the line valve V-MU1031. Then OPEN V-CW1001 to prime the closed cooling line; the level falls, so open V-MU1031 to make up to 1.7 m and close it again. XV-MU1109 goes to AUTO after the instrument air (section 10).',
          c: C(
            '1 make-up water pump running, standby REMOTE + AUTO, expansion tank ≥ 1.7 m and fill valve closed' + ' (XV-MU1109 AUTO when instrument air is available)',
            () => !WL() || (mwN() >= 1 && mwStby() >= 0 && MW.some((nm, j) => dRun(nm) !== 1 && mwAuto(j)) && +U().cwPrime >= 1 && et() >= 1.69 && fillShut() && (xvAuto() || !air())),
            () =>
              (WL() ? MW.map((nm, j) => ML[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : (remOf(nm) ? 'REM' : 'LOC') + (locRun(nm, 14) === 1 ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)') +
              ' · T-1109 ' + et().toFixed(2) + ' m · XV-MU1109 ' + (xvOpen() ? 'OPEN' : 'CLOSED') + (xvAuto() ? ' AUTO' : ' MAN') + ' · V-MU1033 ' + (byp() ? 'OPEN' : 'CLOSED') + ' · V-MU1031 ' + (lineShut() ? 'CLOSED' : 'OPEN') + ' · V-CW1001 ' + (fstate('cw1001') ? 'OPEN' : 'CLOSED') +
              /* Mina #7: the tank level falls while V-CW1001 primes the closed loop (unit.js etPrime, ASSUMED loop volume): said in the step */
              (fstate('cw1001') && +U().cwPrime < 1 ? ' · priming the closed loop ' + Math.round(100 * (+U().cwPrime || 0)) + ' % (the tank level falls, then make up to 1.7 m)' : '')
          ),
          a: [
            dmot('DITL-112', 'MWP-A'),
            dmot('DITL-112 #B', 'MWP-B'),
            dmot('DITL-112 #C', 'MWP-C'),
            /* the order is the order of the SOP (the banner names the first one not done): open the fill (XV-MU1109 with instrument air,
               else the bypass), close it at NL 1.7 m, then XV-MU1109 to AUTO when instrument air is available */
            Object.assign(btn('XV-MU1109 OPEN (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'XV-MU1109 is in AUTO: put it in MAN first to open it.' : !air() ? 'No instrument air (IA < 3.5 kg/cm²): XV-MU1109 is spring opening (vendor sheet item 39), it is already open by itself.' : (dPress('DITL-78', 4), '')), () => xvOpen() || !air() || byp() || et() >= 1.69), { dg: ['DITL-78', 4] }),
            Object.assign(btn('FIELD: OPEN V-MU1033 (bypass)', () => (byp() ? '' : (bypSet(true), '')), () => byp() || xvOpen() || et() >= 1.69), { loc: 1, fp: 'F:mu1033' }),
            Object.assign(btn('XV-MU1109 CLOSE (DITL-78)', () => (!WL() ? '' : xvAuto() ? 'XV-MU1109 is in AUTO: the logic closes it at 85 % (1.7 m).' : !air() ? 'No instrument air (IA < 3.5 kg/cm²): XV-MU1109 is spring opening, it cannot close until the instrument air compressor runs.' : (dPress('DITL-78', 8), '')), () => !xvOpen() || et() < 1.69 || !air()), { dg: ['DITL-78', 8] }),
            /* no air: the fill stops at V-MU1031; it opens again to make up after the priming of the closed loop */
            Object.assign(btn('FIELD: CLOSE V-MU1031 (no instrument air, stops the fill)', () => (lineShut() ? '' : (lineSet(false), '')), () => lineShut() || closed() || et() < 1.69), { loc: 1 }),
            Object.assign(btn('FIELD: OPEN V-MU1031 (make up to 1.7 m)', () => (lineShut() ? (lineSet(true), '') : ''), () => !lineShut() || et() >= 1.69), { loc: 1 }),
            Object.assign(btn('FIELD: CLOSE V-MU1033 (bypass)', () => (byp() ? (bypSet(false), '') : ''), () => !byp() || et() < 1.69), { loc: 1, fp: 'F:mu1033' }),
            /* live test #50: SOP 7.20 prime the closed cooling line from the tank (V-CW1001), 7.22 back to NL 1.7 m (make up if necessary) */
            Object.assign(
              btn('FIELD: OPEN V-CW1001 (prime closed cooling line)', () => {
                if (fstate('cw1001')) return '';
                A.field('cw1001', true);
                try {
                  window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: OPEN expansion tank outlet valve V-CW1001 (prime the closed cooling line)');
                } catch (e) {}
                return '';
              }, () => fstate('cw1001') || et() < 1.69 || !fillShut()) /* Mina F43: PR-OPE-5002 section 7: EXPANSION TANK FILLING first, then CLOSE COOLING LINE PRIMING */,
              { loc: 1, fp: 'F:cw1001' } /* the FIELDV pop-out of V-CW1001 on page 027 (hmi-cw.js, Rose) */
            ),
            Object.assign(btn('XV-MU1109 AUTO / MAN (DITL-78)', () => xvSel(!xvAuto()), () => xvAuto() || !air() || et() < 1.69), { dg: ['DITL-78', 2] })
          ],
          field: [6],
          w: [
            ['Make-up water pumps running', () => mwN() + ' / 3', '', x => x, 'need 1 + standby AUTO'],
            ...ML.map((l, j) => ['Make-up water pump ' + 'ABC'[j] + ' current', () => +U()['muI' + j] || 0, 'A', f1w, 'SOP 20 A · alarm 61.1 A']),
            ['Make-up water header pressure (PIMU0709)', () => +U().muP || 0, 'kg/cm²', f1w, 'SOP > 6.0 · alarm 6.5'],
            ['Expansion tank level (LT-CW1109)', () => et(), 'm', x => (+x).toFixed(2), 'NL 1.7 m'],
            ['XV-MU1109', () => (xvOpen() ? 'OPEN' : 'CLOSED') + (xvAuto() ? ' · AUTO' : ' · MAN'), '', x => x, 'DITL-78'],
            ['V-MU1033 bypass', () => (byp() ? 'OPEN' : 'CLOSED'), '', x => x, 'field'],
            ['V-MU1031 line valve', () => (lineShut() ? 'CLOSED' : 'OPEN'), '', x => x, 'field'],
            ['Instrument air', () => +U().iaP || 0, 'kg/cm²', f1w, 'below 3.5: XV-MU1109 open (spring)']
          ]
        };
      })(),
      /* live test #51: PR-OPE-5002 8.27 "Set selected standby ACWP in AUTO": the standby in REMOTE (row 5 MIL-P1108A / B REMOTE SELECTED)
         and AUTO (out 1 AUTO SELECTED, the output the 027 faceplate reads) */
      { st: 0, sec: 8, max: 1, sby: 1, t: 'Start the auxiliary cooling water pump (ACW)', d: 'The auxiliary cooling water pumps are on the DCS (DITL-76 A, DITL-77 B). After the start the field operator opens the discharge valve until the common discharge pressure is normal (PT-CW1152 over 3.5 kg/cm²). Only then put the standby pump in REMOTE + AUTO: with the pressure still low, AUTO starts the standby at once (DITL-77 row 12).', c: C('1 auxiliary cooling water pump running, standby REMOTE + AUTO (DITL-76 / 77 out 1)', () => !WL() || (['DITL-76', 'DITL-77'].some(nm => dRun(nm) === 1) && ['DITL-76', 'DITL-77'].some(nm => dRun(nm) !== 1 && dOut(nm, 0) === 1 && DUI.rowVal(LS_DOCK.dOf(nm), 4) === 1)), () => (WL() ? ['DITL-76', 'DITL-77'].map((nm, j) => 'ACWP-' + 'AB'[j] + ' ' + (dRun(nm) === 1 ? 'RUNNING' : 'STOPPED' + (DUI.rowVal(LS_DOCK.dOf(nm), 4) === 1 ? ' REM' : ' LOC') + (dOut(nm, 0) === 1 ? ' AUTO' : ' MAN'))).join(', ') : '— (one world OFF)')), a: [dmot('DITL-76', 'ACWP-A'), dmot('DITL-77', 'ACWP-B')] /* 3.2.0-beta.69: the SOP / HMI name (027 boxes the picked ACWP) */, field: [7], w: (() => {
          /* R9 #74: SOP section 9: the discharge valve opened until the pump discharge reaches 7 kg/cm² (PG-CW1108A/B, local gauge);
             the header PICW1152 reads 6.4 at 150 MW (HMI snapshot) */
          const L = ['DITL-76', 'DITL-77'].map(nm => () => dRun(nm) === 1);
          return [
            ['Aux. cooling water pumps running', () => L.filter(f => f()).length + ' / 2', '', x => x, ''],
            ['Aux. cooling water pump discharge', () => ifRun(L.some(f => f()), 7.0), 'kg/cm²', null, 'PG-CW1108A/B · SOP 7'],
            ['Aux. cooling water header', () => ifRun(L.some(f => f()), 6.4), 'kg/cm²', null, 'PICW1152 · HMI 6.4']
          ];
        })() },
      { st: 0, sec: 9, t: 'Start the instrument air dryer (DITL-45)', d: 'START instrument air dryer A from the DCS (DITL-45 row 15).', c: outC('Instrument air dryer A RUNNING (DITL-45)', 'DITL-45', 14, 'RUNNING', 'STOPPED'), a: [pbB('START instrument air dryer A (DITL-45)', 'DITL-45', 14, 'DITL-45@14', () => dOut('DITL-45', 14) === 1)], field: [8], w: [['Instrument air dryer A', () => (dOut('DITL-45', 14) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 15']] },
      { st: 0, sec: 10, t: 'Start the instrument air compressor (local)', d: 'The compressor is started at its local panel; the DCS shows RUNNING (DITL-113 row 6).', c: C('Instrument air compressor A running (DITL-113)', () => !WL() || locRun('DITL-113', 5) === 1, () => 'Instrument air compressor A ' + (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('instrument air compressor A', 'DITL-113', 5)], field: [9], w: [['Instrument air compressor A', () => (locRun('DITL-113', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-113 row 6']] },
      /* Mina F33: PR-OPE-5002 section 7 "Set Expansion tank inlet valve (XV-MU1109) to AUTO if instrument air is available": the air is here now */
      (() => {
        const air = () => (+U().iaP || 0) >= 3.5,
          auto = () => locRun('DITL-78', 2) === 1,
          line = () => { const V = window.AN.swValves(); return +V['V-MU1031'] > 0 && +V['V-MU1032'] > 0; };
        return {
          st: 0,
          sec: 10,
          t: 'Expansion tank inlet XV-MU1109 to AUTO',
          d: 'Instrument air is available now, so XV-MU1109 closes under the air. OPEN the line valve V-MU1031 again, then set XV-MU1109 to AUTO: DITL-78 opens it below 40 % and closes it above 85 % (1.7 m) of LT-CW1109.',
          c: C('V-MU1031 open, XV-MU1109 in AUTO (DITL-78 row 3)', () => !WL() || (line() && auto()), () => 'Instrument air ' + (+U().iaP || 0).toFixed(1) + ' kg/cm² · V-MU1031 ' + (line() ? 'OPEN' : 'CLOSED') + ' · XV-MU1109 ' + (auto() ? 'AUTO' : 'MAN')),
          a: [
            Object.assign(
              btn('XV-MU1109 AUTO (DITL-78)', () => {
                if (!air()) return 'Wait for instrument air: 3.5 kg/cm² or more.';
                LS_DOCK.dset('DITL-78', 0, true);
                LS_DOCK.dsel('DITL-78', 2, true, 'EXPANSION TANK INLET VLV XV-MU1109 AUTO SELECTED (M.1252)');
                return '';
              }, auto),
              { dg: ['DITL-78', 2] }
            ),
            /* Mina F45: only when the line is shut and the air has closed XV-MU1109; opened before that it fills the tank past 1.7 m */
            Object.assign(
              btn('FIELD: OPEN V-MU1031', () => {
                window.AN.swValve('V-MU1031', 100);
                try {
                  window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: OPEN expansion tank line valve V-MU1031 (local)');
                } catch (e) {}
                return '';
              }, () => line() || !auto() || +U().muXv === 1),
              { loc: 1 }
            )
          ],
          w: [['Instrument air', () => +U().iaP || 0, 'kg/cm²', f1w, 'XV-MU1109 AUTO at 3.5 or more']]
        };
      })(),
      { st: 0, sec: 11, t: 'Start the plant air dryer (DITL-45)', d: 'START plant air dryer A from the DCS (DITL-45 row 4).', c: outC('Plant air dryer A RUNNING (DITL-45)', 'DITL-45', 3, 'RUNNING', 'STOPPED'), a: [pbB('START plant air dryer A (DITL-45)', 'DITL-45', 3, 'DITL-45@3', () => dOut('DITL-45', 3) === 1)], field: [10], w: [['Plant air dryer A', () => (dOut('DITL-45', 3) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-45 out 4']] },
      { st: 0, sec: 12, t: 'Start the plant air compressor (local)', d: 'The compressor is started at its local panel; the DCS shows RUNNING (DITL-114 row 6).', c: C('Plant air compressor A running (DITL-114)', () => !WL() || locRun('DITL-114', 5) === 1, () => 'Plant air compressor A ' + (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED')), a: [locB('plant air compressor A', 'DITL-114', 5)], field: [11], w: [['Plant air compressor A', () => (locRun('DITL-114', 5) === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-114 row 6']] },
      /* R9 #77 #84 #85 #78: PR-OPE-5002 sections 13 ~ 16, the turbine lube and control oil: one step each with its own purpose and action
         (was: four field cards with the same text "walang DCS signal"). The MOP / COP / vapour extractor are started on the TCS panel
         (tcs.js lop / eh / vex: the oil pressures of the Bantayan), the oil purifier at its local panel; the lube oil temperature control
         TICLO1002 (valve TCVCW1201, ABC) goes to REMOTE */
      {
        st: 0,
        sec: 13,
        need: 1,
        field: [12],
        t: 'Pre-start check of the turbine lube and control oil; TICLO1002 in AUTO',
        d: 'Do: put the lube oil temperature control TICLO1002 (valve TCVCW1201) in AUTO, then press "Done in field" when the check is done. The SOP says "change mode to Remote": on drawing ABC-053 TICLO1002 has no REMOTE (.REM), so the DCS holds it in AUTO. TCVCW1201 passes cooling water through the lube oil cooler: in REMOTE the DCS holds the oil outlet temperature (average 46 °C, cooling water inlet up to 37 °C). Before the oil pumps start: main oil tank (T-1920) full, drains (V-LO1021 / 032) closed, and no alarm on the TCS.',
        c: C('TICLO1002 (TCVCW1201) held by the DCS (AUTO)', () => /AUTO|REM/.test(md('TICLO1002')), () => 'TICLO1002 ' + md('TICLO1002')),
        fps: ['TICLO1002'],
        a: [btn('A (AUTO) TICLO1002 · TCVCW1201', () => A.auto('TICLO1002'), () => /AUTO|REM/.test(md('TICLO1002')))],
        w: [['Lube oil temp. control', () => md('TICLO1002'), '', x => x, 'TICLO1002 · AUTO (SOP: REMOTE)']]
      },
      {
        st: 0,
        sec: 14,
        field: [13],
        t: 'Start the vapour extractor and the main oil pump (MOP) on the TCS',
        d: 'Do: START the vapour extractor, then START one main oil pump (MOP, P-1922A/B) on the TCS panel. The vapour extractor draws the oil vapour out of the main oil tank (vacuum −20 ~ −50 mmH₂O on PGLO1920). The MOP supplies lube oil (5.6 ~ 6.6 kg/cm²g) to the turbine and generator bearings; it is needed before the turning gear. Bearing oil (PGLO1008) must be > 1.05 kg/cm²g: at ≤ 1.05 the emergency oil pump (EOP) starts.',
        c: C('Vapour extractor and MOP running (TCS)', () => !!(TC().aux.vex && TC().aux.lop), () => 'vapour extractor ' + (TC().aux.vex ? 'RUNNING' : 'STOPPED') + ', MOP ' + (TC().aux.lop ? 'RUNNING' : 'STOPPED')),
        a: [btn('START vapour extractor (TCS)', () => A.tcs('vex', 1), () => !!TC().aux.vex), btn('START main oil pump MOP (TCS)', () => A.tcs('lop', 1), () => !!TC().aux.lop)],
        w: [
          ['Main oil tank vacuum', () => (TC().oil || {}).vac, 'mmH₂O', f1, 'PGLO1920 · −20 ~ −50'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-1922 · 5.6 ~ 6.6'],
          ['Bearing oil pressure', () => (TC().oil || {}).brg, 'kg/cm²g', x => (isFinite(x) ? (+x).toFixed(2) : '—'), 'PGLO1008 · > 1.05']
        ]
      },
      {
        st: 0,
        sec: 15,
        field: [14],
        t: 'Start the oil purifier pump (local)',
        d: 'Do: drain the water (V-LO1223), open the inlet valves (V-LO1201, V-LO1205), then START the oil purifier pump (P-1941) at the local panel. The purifier cleans the lube and control oil (water and dirt); discharge pressure about 2.96 kg/cm². It can run continuously or from time to time.',
        c: C('Oil purifier pump running (local)', () => fstate('pur'), () => 'Oil purifier pump ' + (fstate('pur') ? 'RUNNING' : 'STOPPED')),
        a: [fldB('pur', 'oil purifier pump')],
        w: [['Oil purifier pump', () => (fstate('pur') ? 'RUNNING' : 'STOPPED'), '', x => x, 'P-1941'], ['Purifier discharge', () => (fstate('pur') ? 2.96 : 0), 'kg/cm²', f1, '~ 2.96']]
      },
      {
        st: 0,
        sec: 16,
        field: [15],
        t: 'Start the control oil pump (COP) on the TCS',
        d: 'Do: when the MOP lube oil pressure is normal, START one control oil pump (COP, P-1931A/B) on the TCS panel. Control oil (133 ~ 163 kg/cm²g) moves the turbine MSV, RSV, CV and ICV; it is needed before the ATS. Pumps in AUTO start by themselves: MOP at ≤ 5.6, COP at ≤ 133, EOP when bearing oil is ≤ 1.05.',
        c: C('Control oil pump COP running (TCS)', () => !!TC().aux.eh, () => 'COP ' + (TC().aux.eh ? 'RUNNING' : 'STOPPED')),
        a: [btn('START control oil pump COP (TCS)', () => (TC().aux.lop ? A.tcs('eh', 1) : ''), () => !!TC().aux.eh)],
        w: [
          ['Control oil pressure', () => (TC().oil || {}).ctl, 'kg/cm²g', f1, 'P-1931 · 133 ~ 163'],
          ['Lube oil pressure', () => (TC().oil || {}).lube, 'kg/cm²g', f1, 'P-1922 · 5.6 ~ 6.6']
        ]
      },
      { st: 0, sec: 17, t: 'Start the rotary air preheater (DITL-43)', d: 'Do: FIELD NOT TRIP when the interlock shows ✕, then START the air preheater (DITL-43). The air preheater is a rotating rotor (Ljungstrom) that heats the primary and secondary air with the flue gas. It is started before the fans so the rotor heats evenly and does not bend. It will not start without AIR PREHEATER NOT TRIP (I.0651, DITL-43 row 5) or when its field switch is in LOCAL.', c: runC('Air preheater running (DITL-43)', ['DITL-43']), a: [dmot('DITL-43', 'air preheater')], field: [16], w: [['Air preheater', () => (dRun('DITL-43') === 1 ? 'RUNNING' : 'STOPPED'), '', x => x, 'DITL-43 out 3'], ['RH biasing damper HICHR1002A MV', () => mv('HICHR1002A'), '%', f1w, 'SOP 17.1 closed (min 10)'], ['SH biasing damper HICHR1002B MV', () => mv('HICHR1002B'), '%', f1w, 'SOP 17.1 closed (min 10)']] },
      /* live test #71: PR-OPE-5002 sec 17.12 "Open Biasing damper to 100% at Reheater and Superheater side" (after the air preheater runs;
         in Cold both are MANUAL at 10 %, the lowest position of the DCS = closed, SOP 17.1) */
      {
        st: 0,
        sec: 17,
        t: 'Open the RH and SH biasing dampers to 100 %',
        d: 'Set the RH and SH biasing dampers to MANUAL, output 100 % (PR-OPE-5002 17.12). At Cold both are closed at 10 %, the lowest DCS position (17.1). Watch the damper position transmitters. Tags: HICHR1002A, HICHR1002B, ZT-FG1116, ZT-FG1117.',
        /* Mina F60: 100 %, DITL-25A row 1 BIAS DAMPER OPEN comes at the end of travel */ c: b.ALL(b.MV('HICHR1002A', 99.5, null), b.MV('HICHR1002B', 99.5, null)),
        fps: ['HICHR1002A', 'HICHR1002B'],
        a: [btn('Biasing damper RH at SH 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))],
        w: [
          ['RH damper HICHR1002A MV', () => mv('HICHR1002A'), '%', f1w, 'SOP 100'],
          ['ZT-FG1116-A ~ D (RH)', () => ztOf('RH'), '%', f1w, 'mean of 4'],
          ['SH damper HICHR1002B MV', () => mv('HICHR1002B'), '%', f1w, 'SOP 100'],
          ['ZT-FG1117-A ~ D (SH)', () => ztOf('SH'), '%', f1w, 'mean of 4']
        ]
      },
      /* ---- 1 water ---- */
      /* Mina beta.89 Step 20 (item 14 "Initiate START to selected CEP" had no START here and the field confirm closed the step with the CEP
         stopped): PR-OPE-5002 section 18 items 1 ~ 12 are the field part before the DCS steps (FCV-CD1120 MAN, CEP START, FCV-CD1120 AUTO
         are the next steps); items 19 ~ 26 (chemical dosing) after them */
      FIELD1(1, 'Hotwell filling line-up (field)', [17], { it: [0, 11], a: [movB('DITL-60', 'MV-MU1001', 1, 2, 11), movB('DITL-60', 'MV-MU1001', 0, 2, 11)] }) /* audit B2: PR-OPE-5002 18.3 / 18.8 hotwell filling MOV MV-MU1001 on its DCS drawing DITL-60 (IO list STN102 O.017A / O.017B); its flow is not modelled (series or bypass of LCV-MU1110: not readable on the documents) */,
      { st: 1, sec: 18, t: 'Hotwell level control LCV-MU1110 in AUTO', d: 'The make-up valve now holds the condenser hotwell level.', c: b.MODE('LCV-MU1110', 'AUTO'), fps: ['LCV-MU1110'], a: [btn('A (AUTO)', () => A.auto('LCV-MU1110'))] },
      { st: 1, sec: 18, t: 'Condensate recirculation FCV-CD1120: MANUAL, MV 60 %', d: 'Open the recirculation first so the condensate pump has flow when it starts.', c: b.ALL(b.MODE('FCV-CD1120', 'MAN'), b.MV('FCV-CD1120', 55, 65)), fps: ['FCV-CD1120'], a: [btn('M, MV 60 %', () => A.man('FCV-CD1120', 60))] },
      { st: 1, sec: 18, max: 1, sby: 1, t: 'Start the condensate pump (CEP), the other one the standby', d: 'Do: START one condensate pump, then the other one REMOTE + AUTO (standby: it starts by itself when the running one trips). PR-OPE-5002 section 18: "At full speed, fully open discharge valve of selected CEP and set the standby CEP to REMOTE/AUTO". The condensate pump sends water from the hotwell to the deaerator. It is also needed for the vacuum later.', c: b.ALL(R.CEP, SBY('condensate pump', [['M.3350', 'CEP-A'], ['M.3351', 'CEP-B']], a => bit(a) > 0.5)), a: [mot('M.3350', 'CEP-A'), mot('M.3351', 'CEP-B')] },
      { st: 1, sec: 18, t: 'FCV-CD1120 in AUTO, SV 150 T/H', d: 'The recirculation now holds the minimum flow of the condensate pump.', c: b.ALL(b.MODE('FCV-CD1120', 'AUTO'), b.SV('FCV-CD1120', 140, 160, 'T/H')), fps: ['FCV-CD1120'], a: [btn('A, SV 150 T/H', () => A.auto('FCV-CD1120', 150))] },
      FIELD1(1, 'Condensate chemical dosing (field)', [17], { it: [18, 25] }),
      { st: 1, sec: 19, t: 'Deaerator level LCV-CD1104 in AUTO, SV 0 mm', d: 'The deaerator fills to normal level and the valve holds it there.', c: b.ALL(b.MODE('LCV-CD1104', 'AUTO'), b.SV('LCV-CD1104', -20, 20, 'mm')), fps: ['LCV-CD1104'], a: [btn('A, SV 0 mm', () => A.auto('LCV-CD1104', 0)), movB('DITL-72', 'XV-CD1104-2', 1, 2, 7), movB('DITL-72', 'XV-CD1104-2', 0, 2, 7)] /* audit B3: PR-OPE-5002 19.14 / 19.15 emergency drain to the condenser XV-CD1104-2 (DITL-72; IO list STN102 O.012D) */, field: [18] },
      { st: 1, sec: 20, t: 'Start the boiler feedwater pump (BFWP)', d: 'Do: start the auxiliary lube oil pump of the pump you start (DITL-22, PR-OPE-5002 19.5 "Initiate START of LOP of BFP A/B"): its lube oil pressure LOW (I.0090 / I.0410) blocks the start. Then start the feedwater pump. The deaerator must have water first.', c: R.BFP, a: [dmot('DITL-22', 'LOP A of BFWP-A'), dmot('DITL-22 #B', 'LOP B of BFWP-A'), dmot('DITL-22 #C', 'LOP A of BFWP-B'), dmot('DITL-22 #D', 'LOP B of BFWP-B'), mot('M.3343', 'BFWP-A'), mot('M.3344', 'BFWP-B')] } /* audit A2: the four aux. LOPs of DITL-22 (IO list STN103 O.0126 / O.0446 / O.0127 / O.0447); the standby LOP in AUTO by its AUTO button (DITL-22 row 6, PR-OPE-5002 20.11) */,
      /* 3.2.0 P1 #4 (PR-OPE-5002 BFP start-up 4165 / 4176): the feedwater reaches the drum only through the discharge MOV of the pump */
      {
        st: 1,
        sec: 20,
        t: 'Feedwater pump discharge: equalizing MOV MV-FW1391 OPEN, then main discharge MOV MV-FW1001 OPEN',
        d: 'Do: OPEN MV-FW1391, then OPEN MV-FW1001; when MV-FW1001 is 100 % open, CLOSE MV-FW1391 (the step does not finish while MV-FW1391 is still open). PR-OPE-5002: slowly open the equalizing MOV of the selected BFP (MV-FW1391 / MV-FW1392) to equalize the pressure. When the discharge pressure is > 200 kg/cm², open the main discharge MOV (MV-FW1001 / MV-FW1002) 100 %, then close the equalizing MOV. With both closed, no feedwater reaches the drum.',
        c: mcvC('Main discharge MOV open, equalizing MOV closed', () => (mcvPos('MV-FW1001') >= 100 && mcvPos('MV-FW1391') <= 0) || (mcvPos('MV-FW1002') >= 100 && mcvPos('MV-FW1392') <= 0)),
        a: [mcvB('MV-FW1391', 1), mcvB('MV-FW1001', 1), mcvB('MV-FW1391', 0)]
      },
      /* 3.2.0 walkthrough #7: the cold drum is not filled (hmi-op.js AN_COLD_DRUM); PR-OPE-5002 STEAM DRUM FILLING: FCV-FW1130-2 MANUAL, opened
         gradually, drum level -150 mm. The trainee closes the valve at -150 mm */
      { st: 1, sec: 20, slow: () => h().lvl() >= -220 && h().lvl() < -150 && mv('FCV-FW1130-2') > 2 /* Mina F51: x10 before the stop level */, ask: () => (h().lvl() >= -170 && mv('FCV-FW1130-2') > 2 ? 'CLOSE NOW: FCV-FW1130-2 MV 0 %, the drum is at ' + Math.round(h().lvl()) + ' mm, stop at −150' : ''), t: 'Steam drum filling: start-up valve FCV-FW1130-2 in MANUAL, fill to −150 mm', d: 'The drum of the cold plant has no water yet (about −300 mm). With the feedwater pump running, open the start-up valve slowly (MANUAL, MV 20 %). At −150 mm you close it (MV 0 %) so the drum does not overfill. Open the MS blow-off PICMS1002 to 10 % in MANUAL now (PR-OPE-5002 STEAM DRUM FILLING: "Ensure MS BLOW OFF VALVE (BOV) >= 10 % OPEN"): the steam of the warm-up then leaves from the first kg/cm², and the blow-off is not a step of 0 to full open at 35 kg/cm² that empties the drum. If it overfills (over −100 mm), the field operator cracks open the lower ring header drains (V-BD1005 ~ V-BD1021, flow diagram PD-019) until the level is back near −150 mm, then closes them (PR-OPE-5002: below 10 kg/cm² the level is controlled with the lower header drain).', c: b.ALL(b.MODE('FCV-FW1130-2', 'MAN'), b.MV('FCV-FW1130-2', null, 2), b.MV('PICMS1002', 10, null), b.HOLD(10, b.VAL('lvl', -200, -100)), C('Lower ring header drains closed (PD-019)', () => !fstate('lhd'), () => 'Lower header drains ' + (fstate('lhd') ? 'OPEN (cracked)' : 'CLOSED'))), fps: ['FCV-FW1130-2', 'PICMS1002'] /* OFF unless switched on */, a: [btn('PICMS1002 M, MV 10 % (MS blow-off open)', () => A.man('PICMS1002', 10), () => mv('PICMS1002') >= 10), btn('M, MV 20 % (fill)', () => (h().lvl() < -170 ? A.man('FCV-FW1130-2', 20) : ''), () => h().lvl() >= -170 || mv('FCV-FW1130-2') >= 15), btn('MV 0 % (at −150 mm)', () => (h().lvl() >= -170 ? A.man('FCV-FW1130-2', 0) : ''), () => h().lvl() >= -170 && mv('FCV-FW1130-2') <= 2), /* Mina H1: the field operator drains an overfilled drum (PD-019 lower ring header drains, manual), to a part of the stroke */ ...[10, 25, 50].map(x => Object.assign(btn('FIELD: lower ring header drains ' + x + ' % open (V-BD1005 ~ V-BD1021)', () => (A.field('lhd', x), window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: lower ring header drains V-BD1005 ~ V-BD1021 ' + x + ' % open (PD-019)'), '')), { loc: 1, hide: () => h().lvl() <= -100 && !fstate('lhd') /* automatic run 2026-11-10: the drains showed only above +100 mm, so a drum overfilled to -51 mm (over the -100 mm of the check) had no way back */ })), Object.assign(btn('FIELD: close the lower ring header drains', () => (A.field('lhd', 0), window.lsEventAdd && lsEventAdd('FIELD', 'FIELD', 'Field operator: lower ring header drains closed'), '')), { loc: 1, hide: () => !fstate('lhd') })], field: [19] },
      /* ---- 2 fans ---- */
      { st: 2, sec: 21, max: 1, sby: 1, topCtl: () => dRun('DITL-31') !== 1 && dRun('DITL-31 #B') !== 1 && (mv('PICDO0005') < 99 || mv('HICDO1012') < 99) /* Mina F50: the valves come before the pump */, topTx: 'PCV-DO0002, FCV-DO1012', t: 'Diesel oil pump and oil circulation', d: 'Do: start a diesel oil pump and set the two oil pressure controls, in the order (1) ~ (6) below. (1) PCV-DO0002 M, 100 % (recirculation open) and the unit 1 supply FCV-DO1012 (HICDO1012) M, 100 % (open; closed at Cold, so the burner ring has no oil), (2) the selected diesel oil pump REMOTE + START (DCS, DITL-31), the other one REMOTE + AUTO (standby), (3) PCV-DO0002 M, 24 % (close gradually, the pressure rises), (4) when PICDO0005 is near its SV (≥ 11.5 kg/cm²): PICDO0005 A, SV 12.8, (5) PCV-DO1009 (return) M, 86 % (close a little, PICDO1008 rises), (6) when PICDO1008 is near its SV (≥ 9.9 kg/cm²): PICDO1008 (PCV-DO1009) A, SV 11. The diesel oil pumps M-0702A / B are DCS motors (DITL-31; IO list STN105 O.0040 / O.0360 start, I.0003 / I.0323 running); the start-up burners need them (PR-OPE-5002 Section 21).', fps: ['PICDO0005', 'HICDO1012', 'PICDO1008'], c: b.ALL(SBY('diesel oil pump (DITL-31)', [['DITL-31', 'DOP A'], ['DITL-31 #B', 'DOP B']], nm => dRun(nm) === 1), C('PICDO0005 ≥ 11.5 kg/cm² (near SV 12.8)', () => pv('PICDO0005') >= 11.5, () => 'PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm²'), b.MODE('PICDO0005', 'AUTO'), C('PICDO1008 ≥ 9.9 kg/cm² (near SV 11)', () => pv('PICDO1008') >= 9.9, () => 'PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm²'), b.MODE('PICDO1008', 'AUTO')), a: [btn('PCV-DO0002 M, 100 % (open)', () => A.man('PICDO0005', 100)), btn('FCV-DO1012 M, 100 % (open)', () => A.man('HICDO1012', 100)) /* 3.2.3 automatic run: HICDO1012 MV 0 at Cold, PICDO1008 stayed 0 (hmi-op.js 150 MW: 100 % M) */, dmot('DITL-31', 'DOP A'), dmot('DITL-31 #B', 'DOP B'), btn('PCV-DO0002 M, 24 %', () => A.man('PICDO0005', 24)), btn('PICDO0005 A, SV 12.8', () => (pv('PICDO0005') >= 11.5 ? A.auto('PICDO0005', 12.8) : 'Wait: PICDO0005 ' + f1(pv('PICDO0005')) + ' kg/cm² (need ≥ 11.5)')), btn('PCV-DO1009 M, 86 %', () => A.man('PICDO1008', 86)), btn('PICDO1008 (PCV-DO1009) A, SV 11', () => (pv('PICDO1008') >= 9.9 ? A.auto('PICDO1008', 11) : 'Wait: PICDO1008 ' + f1(pv('PICDO1008')) + ' kg/cm² (need ≥ 9.9)'))], field: [20] },
      { st: 2, sec: 22, t: 'Prepare the ID fan (IDF): PICFG108 in MANUAL, MV 0 %, RH and SH biasing dampers open', d: 'The ID fan hydraulic coupling is closed before the fan starts (low starting current). The ID fan interlock (DITL-25A row 1) needs the flue gas bias dampers (HICHR1002A / B) open so the air has a path.', c: b.ALL(b.MODE('PICFG108', 'MAN'), b.MV('PICFG108', null, 2), b.MV('HICHR1002A', 99.5, null), b.MV('HICHR1002B', 99.5, null)), fps: ['PICFG108', 'HICHR1002A', 'HICHR1002B'], a: [btn('M, MV 0 %', () => A.man('PICFG108', 0)), btn('RH and SH biasing dampers 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))], field: [21] },
      { st: 2, sec: 22, t: 'Start the ID fan (IDF)', d: 'The ID fan draws the flue gas out of the furnace. It is the first fan to run.', note: 'Alarms of the cold plant: AI0128 / AI0385 drum pressure LOW LOW (no pressure yet), AI0592 economizer inlet temperature LOW LOW (feedwater still cold), LIBR10011 / LIBR10012 / LIBR10013 drum level LOW (LOW −100 mm, LOW LOW −178 mm per the alarm list). At the start of the cold start-up they are SUPPRESSED: not in the header, kept apart in the alarm list (ALARM chip, "suppressed"). They come in as new alarms (ACK them) if still standing 10 min (plant time) after the equipment of their group runs; they clear by themselves when the pressure, temperature and level rise.', c: R.IDF, a: [mot('M.3304', 'IDF')] },
      { st: 2, sec: 22, t: 'ID fan hydraulic coupling: PICFG108 MV 13 %', d: 'Open the coupling to 13 %. The furnace pressure is negative (gas drawn out); target about −15 mmH₂O. If it is too negative, lower the MV by 1 %; if not negative enough, raise it by 1 %.', c: b.ALL(R.IDF, b.MV('PICFG108', 10, 16)), fps: ['PICFG108'], a: [btn('MV 13 %', () => A.man('PICFG108', 13)), btn('MV −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('MV +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1)))] },
      /* 3.2.0-beta.23: the FAB start permissive FCD READY (DITL-28A row 5 <- 28B out 77 = ABC-014 M.3115 inlet FCD demand at 25 % AND
         DITL-28C the silencer SOV opened); without the one world the step is done at once (the DITL is not running) */
      {
        st: 2,
        sec: 23,
        t: 'Prepare the fluidizing air blower (FAB): open the silencer SOV, FAB inlet damper FICFA1055A M 25 %',
        d: 'The blower interlock (DITL-28A row 5 FCD READY) needs the "TO SILENCE SOV" open (DITL-28C, OPEN P.B.) and an inlet damper demand of 25 % (ABC-014).',
        c: b.ALL(b.MODE('FICFA1055A', 'MAN'), b.MV('FICFA1055A', 20, 30), C('Silencer SOV opened (DITL-28C)', () => dOut('DITL-28C', 21) !== 0, () => 'SOV ' + (dOut('DITL-28C', 21) === 1 ? 'OPENED' : dOut('DITL-28C', 21) === 0 ? 'closed' : '— (one world OFF)'))),
        fps: ['FICFA1055A'],
        a: [btn('Silencer SOV OPEN (DITL-28C)', () => dPress('DITL-28C', 0), () => dOut('DITL-28C', 21) !== 0), btn('FICFA1055A M 25 %', () => A.man('FICFA1055A', 25))]
      },
      { st: 2, sec: 23, max: 1, sby: 1, t: 'Start the fluidizing air blower (FAB)', d: 'Do: START FAB-A, put FAB-B in REMOTE + AUTO (PR-OPE-5002: "Set Standby FAB in AUTO Mode"), then raise the FAB inlet damper FICFA1055A until the fluidizing air flow is 26 T/H (PR-OPE-5002; about 41 %). The blower supplies air to the seal pots of the cyclone loop.', c: b.ALL(R.FAB, SBY('FA blower', [['M.3308', 'FAB-A'], ['M.3309', 'FAB-B']], a => bit(a) > 0.5)), fps: ['FICFA1055A'], a: [mot('M.3308', 'FAB-A'), mot('M.3309', 'FAB-B'), btn('FICFA1055A M 41 % (≈ 26 T/H)', () => A.man('FICFA1055A', 41))], field: [22] },
      { st: 2, sec: 24, t: 'Start the secondary air fan (SAF)', d: 'Close the secondary air damper (0 %) before starting the fan.', c: R.SAF, a: [btn('SA damper 0 %', () => A.man('FICFA1081', 0)), mot('M.3303', 'SAF')], fps: ['FICFA1081'], field: [23] },
      /* live check #107 (PR-OPE-5002 SAF START-UP: "Adjust SAF Inlet Damper Manually up until combustion air flow increase to 200T/H (You can use
         double arrow but be cautious of the furnace pressure reaction)"): the SA flow by hand to 200 T/H, the IDF coupling with it (-15) */
      { st: 2, sec: 24, t: 'Secondary air fan inlet damper up: secondary air 200 T/H, furnace pressure −15 mmH₂O', d: 'Do: raise the SA damper FICFA1081 (MANUAL) until the secondary air flow is 200 T/H. ▲▲ (+5 %) is allowed, but watch the furnace pressure: when it rises toward positive, raise the IDF coupling PICFG108 (MV ▲); when it is below −25, lower it. The damper is about 34 % at 200 T/H.', c: b.HOLD(10, b.ALL(b.VAL('SA', 185, 215), b.VAL('FP', -65, 35))), fps: ['FICFA1081', 'PICFG108'], seek: seekB([[() => h().SA(), 190, 210, 'FICFA1081', 2], [() => h().FP(), -65, 35, 'PICFG108', 1, 1]]), a: [btn('SA damper ▲▲ +5 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (5))))), btn('SA damper ▲ +1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (1))))), btn('SA damper ▼ −1 %', () => A.man('FICFA1081', Math.max(0, Math.min(100, Math.round(mv('FICFA1081')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      /* 3.2.0-beta.23: the PAF start interlock DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED" = 0 (DITL-24): a lube oil pump first */
      { st: 2, sec: 25, t: 'Start primary air fan lube oil pump A (DITL-24)', d: 'The primary air fan will not start with no lube oil pump running (DITL-26A row 8 "PAF LUB. OIL PUMP ALL STOPPED"). The pump has no DCS memory on the ABC, so it is started on DITL-24.', c: C('PAF lube oil pump A running (DITL-24)', () => dRun('DITL-24') !== 0, () => (dRun('DITL-24') === 1 ? 'RUNNING' : dRun('DITL-24') === 0 ? 'STOPPED' : '— (one world OFF)')), a: [dmot('DITL-24', 'PAF LO pump A')] },
      { st: 2, sec: 25, t: 'Start the primary air fan (PAF)', d: 'Close the primary air damper (0 %) before starting the fan.', c: R.PAF, a: [btn('PA damper 0 %', () => A.man('FICFA1071', 0)), mot('M.3302', 'PAF')], fps: ['FICFA1071'], field: [24] },
      /* live check #103 / #107 (PR-OPE-5002 PAF START-UP: "Increase PAF Inlet Damper Manually (Use Single Arrow ...). Maintain the Furnace
         pressure to -15mmH2O whilst simultaneously increasing HC Speed of IDF. Target Primary Air Flow: 180T/H = No Bed") */
      { st: 2, sec: 25, t: 'Primary air fan inlet damper up (single arrow): primary air 180 T/H, ID fan coupling up (−15 mmH₂O)', d: 'Do: raise the PA damper FICFA1071 (MANUAL) 1 % at a time (single arrow) until 180 T/H (no bed). At the same time raise the IDF hydraulic coupling PICFG108 (MV ▲) to keep the furnace pressure near −15 mmH₂O. At the end the PA damper is about 18 % and the coupling about 16 % (PA 180 + SA 200 + FA 26 ≈ 406 T/H, above 25 % MCR = 151.5 T/H, DESIGN BASE total air 606 T/H).', c: b.HOLD(10, b.ALL(b.VAL('PA', 170, 195), b.PURGE_AIR, b.VAL('FP', -65, 35))), fps: ['FICFA1071', 'PICFG108'], seek: seekB([[() => h().PA(), 175, 190, 'FICFA1071', 1], [() => h().FP(), -65, 35, 'PICFG108', 1, 1]]), a: [btn('PA damper ▲ +1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (1))))), btn('PA damper ▼ −1 %', () => A.man('FICFA1071', Math.max(0, Math.min(100, Math.round(mv('FICFA1071')) + (-1))))), btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1)))] },
      { st: 2, sec: 25, t: 'Furnace pressure control PICFG108 in AUTO, SV −15 mmH₂O', d: 'Do: when the hydraulic coupling is at about 16 % and the furnace pressure is steady at about −15 mmH₂O, PICFG108 A, SV −15 (PR-OPE-5002). While the MV is below 14 %, PICFG108 is FORCE MANUAL (ABC-008 M.0205): AUTO is not allowed yet. In AUTO, PICFG108 moves the coupling to hold −15.', c: b.ALL(b.MV('PICFG108', 14, null), b.MODE('PICFG108', 'AUTO'), b.SV('PICFG108', -16, -14), b.HOLD(30, b.VAL('FP', -30, 0))) /* Mina F56: coupling at 16 % and furnace near -15 before AUTO (PR-OPE-5002) */, fps: ['PICFG108'], ask: () => (mv('PICFG108') < 15 ? 'Raise the IDF coupling MV to about 16 % first: below 14 % AUTO is refused' : ''), seek: seekB([[() => +mv('PICFG108'), 15, 100, 'PICFG108', 1]]) /* the drawing forces MANUAL below 14 % (M.0205): the MV up first */, a: [btn('IDF coupling MV ▲ +1 %', () => A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1))), btn('IDF coupling MV ▼ −1 %', () => A.man('PICFG108', Math.max(0, Math.round(mv('PICFG108')) - 1))), btn('PICFG108 A, SV −15', () => (mv('PICFG108') < 14 ? 'PICFG108 is still FORCE MANUAL (ABC-008 M.0205: IDF coupling < 14 %): raise the MV first' : h().FP() <= -65 || h().FP() >= 35 ? 'Wait: furnace pressure ' + f0(h().FP()) + ' mmH₂O (must be inside the alarm limits L −65 ~ H 35, normal −15: alarm list PT-FG1085 / 1086)' : A.auto('PICFG108', -15)))] },
      /* ---- 3 purge ---- */
      {
        st: 3,
        sec: 26,
        t: 'Purge permissives: all fans running, no coal, no flame, biasing dampers open',
        d: 'These are the conditions of the drawing before the purge starts. RH damper ≥ 30 % and SH damper ≥ 60 %.',
        c: b.ALL(R.IDF, R.SAF, R.FAB, R.PAF, b.NOFEED, b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'no start-up burner'), b.MV('HICHR1002A', 30, null), b.MV('HICHR1002B', 60, null), DW(C('Furnace purge ready (DITL-02 out 10)', () => dOut('DITL-02', 9) === 1, dTxt('DITL-02', 9, 'PURGE READY', 'purge not ready')), b.MFT)),
        fps: ['HICHR1002A', 'HICHR1002B'],
        a: [btn('RH and SH biasing dampers 100 %', () => (A.man('HICHR1002A', 100), A.man('HICHR1002B', 100)))],
        field: [25]
      },
      /* 3.2.0-beta.23: with the one world the purge is the drawing's: DITL-02 row 6 FURNACE PURGE START P.B. -> 5 min -> out 16 FURNACE
         PURGE COMPLETED -> DITL-03A row 21 resets the MFT (I.000F 0) */
      {
        st: 3,
        sec: 26,
        t: 'Furnace purge: 5 minutes',
        d: 'Press FURNACE PURGE START (DITL-02). Hold the air for 5 minutes. If something drops out (a fan stops, the air falls), the count starts again. After 5 minutes, "PURGE COMPLETED" resets the MFT (DITL-03A row 21).',
        c: DW(b.ALL(C('Purge completed, MFT reset (DITL-03A out 13 = 0)', () => dOut('DITL-03A', 12) === 0, () => (dOut('DITL-03A', 12) === 0 ? 'MFT RESET' : dOut('DITL-02', 5) === 1 ? 'purge in progress' : 'MFT, purge not started')), b.MFT), b.HOLD(300, b.ALL(R.IDF, R.PAF, R.SAF, b.PURGE_AIR, b.NOFEED))),
        a: [btn('FURNACE PURGE START (DITL-02)', () => dPress('DITL-02', 5), () => dOut('DITL-02', 5) === 1 || dOut('DITL-03A', 12) === 0)],
        /* live check #106: the alarms that come out of the suppression in the purge (10 min after the fans of their group run) */
        note: 'Alarms that come in during the purge (10 min after the fans run, the suppression is over): AI0273 / AI0433 flue gas O₂ HIGH-HIGH (ABC-002, AT-FG1122 / 1123: 21 % because only air passes, no flame; HH 8 %) and AI0656 / AI0672 PA preheater outlet air temperature LOW-LOW (ABC-006, TT-FA1076 / 1077: the air is still cold). These are correct during the purge: ACK them. The O₂ HIGH-HIGH clears by itself once there is a flame (it falls to 3.5 ~ 8 %), and the temperature alarm when the preheater warms up.',
        wait: 1
      },
      { st: 3, sec: 26, t: 'Biasing dampers: RH 10 %, SH 90 %', d: 'After the purge, most of the flue gas goes to the SH side first.', c: b.ALL(b.MV('HICHR1002A', 5, 15), b.MV('HICHR1002B', 85, 95)), fps: ['HICHR1002A', 'HICHR1002B'], a: [btn('RH 10 %, SH 90 %', () => (A.man('HICHR1002A', 10), A.man('HICHR1002B', 90)))] },
      /* ---- live test #57: sec 27 AIR PRE-HEATER SOOT BLOWER START-UP (PR-OPE-5002, between the purge and the burners) ---- */
      {
        st: 3,
        sec: 27,
        t: 'Air heater soot blower: plant air available, source set to plant air',
        d: 'Check that a plant air compressor runs and plant air pressure is at least 7 kg/cm². In the field: at the local panel, open the plant air source and close the steam source of the air heater soot blower, and check that every soot blower lance is retracted. Tags: PT-PA1705, M.4008 (DITL-80K row 5).',
        c: b.ALL(
          C('Plant air PT-PA1705 ≥ 7 kg/cm²', () => +U().paP >= 6.95, () => 'PT-PA1705 ' + f1w(+U().paP || 0) + ' kg/cm²'),
          C('All soot blower lances retracted (M.4008)', () => !WL() || sbRetOn(), () => (WL() ? (sbRetOn() ? 'ALL ON RETRACT' : 'not confirmed') : '— (one world OFF)'))
        ),
        a: [
          Object.assign(
            btn('FIELD: all soot blower lances retracted (M.4008)', () => {
              /* one address on five drawings (CLAUDE.md 1); the field action is logged once, on DITL-80K (a unique name: "DITL-80" is
                 also the hot reheat drain sheet (99)DITL-80) */
              for (const [x, r] of sbRet()) if (!/DITL-80K$/.test(x.name)) x.sig[r + ':S'] = true;
              const k = sbRet().find(([x]) => /DITL-80K$/.test(x.name));
              if (k && window.LS_DOCK) LS_DOCK.fieldRow('DITL-80K', k[1], 1, 'all S/B lances on retract position (M.4008)');
            }, sbRetOn),
            { loc: 1 }
          )
        ],
        field: [26],
        w: [['Plant air PT-PA1705', () => +U().paP, 'kg/cm²', f1w, 'SOP ≥ 7']]
      },
      {
        st: 3,
        sec: 27,
        t: 'Select plant air as the soot blower source at the DCS',
        d: 'Set the soot blower source select to PLANT AIR (1). STEAM (0) is not available at Cold. Tag: M.4212 (DITL-80K row 20).',
        c: C('S/B source PLANT AIR (DITL-80K row 20 = 1)', () => !WL() || DUI.rowVal(sbK(), 19) === 1, () => (WL() ? (DUI.rowVal(sbK(), 19) === 1 ? 'PLANT AIR' : 'STEAM') : '— (one world OFF)')),
        a: [Object.assign(btn('S/B SELECT PLANT AIR (M.4212, DITL-80K)', () => window.LS_DOCK && LS_DOCK.dsel('DITL-80K', 19, 1, 'S/B SELECT PLANT AIR / STEAM P.B. (M.4212) PLANT AIR'), () => WL() && DUI.rowVal(sbK(), 19) === 1), { dg: ['DITL-80K', 19] })]
      },
      {
        st: 3,
        sec: 27,
        t: 'Start the air heater soot blowing',
        d: 'Press the air heater soot blower START. The logic sends a 3 s forward starter command to the soot blower panel when the soot blower system is in MANUAL and every lance is retracted. Tags: M.417D (DITL-80M row 6), O.077C (DITL-80K).',
        c: C('APH S/B forward starter O.077C (DITL-80K)', () => !WL() || !!G.aphSb || aphSbFwd(), () => (WL() ? (G.aphSb || aphSbFwd() ? 'FORWARD STARTER ON' : 'not started') : '— (one world OFF)')),
        a: [Object.assign(btn('APH S/B START (M.417D, DITL-80M)', () => (WL() ? dPress('DITL-80M', 5) : ''), () => !!G.aphSb || aphSbFwd()), { dg: ['DITL-80M', 5], ad: 'DITL-80M@5' })]
      },
      {
        st: 3,
        sec: 27,
        need: 1,
        t: 'Air heater soot blower circulation function ON',
        d: 'PR-OPE-5002: "Set Air heater soot blower Circulation Function to ON at DCS." The logic drawings DITL-80 ~ 80T and memory list STN102 have no address for this function: confirm it when done.'
      },
      /* ---- 4 burners and warm-up ---- */
      { st: 4, sec: 28, slow: drnSlow, t: 'Light burner A', d: 'SA damper and oil FCV to ignition, then BURNER ON (DITL-09): the DITL inserts the igniter, opens the two supply oil valves and lights the burner (DITL-10 / 13). Once there is a flame, set the oil flow FICDO1043A to 60 %.', c: b.ALL(b.BIT('M.3412', 1, 'burner A in service'), b.VAL('oilF', 0.3, null)), fps: ['FICDO1043A'], get a() {
          return WL() ? DRN.concat([bIgn('A'), bOn('A'), bOil('A', 60)]) : [btn('Open oil valve A', () => A.oil('M.3410', true)), btn('BURNER A ON', () => A.motor('M.3412', 1), () => bit('M.3412') > 0.5), btn('FICDO1043A M 60 %', () => A.man('FICDO1043A', 60))];
        }, field: [27] },
      { st: 4, sec: 28, slow: drnSlow, t: 'Light burner D (diagonal to A)', d: 'PR-OPE-5002: after A, the next one is D (diagonal). Same as burner A: SA damper and oil FCV to ignition, BURNER ON (the DITL opens the oil valve), then FICDO1043D 60 %.', c: b.ALL(b.BIT('M.3419', 1, 'burner D in service'), b.MV('FICDO1043D', 50, null)), fps: ['FICDO1043D'], get a() {
          return WL() ? DRN.concat([bIgn('D'), bOn('D'), bOil('D', 60)]) : [btn('Open oil valve D', () => A.oil('M.3417', true)), btn('BURNER D ON', () => A.motor('M.3419', 1), () => bit('M.3419') > 0.5), btn('FICDO1043D M 60 %', () => A.man('FICDO1043D', 60))];
        } },
      /* Mina F65 (beta.63): this step lowered the PA and SA flows to 10 % after light-off and the total air fell under 25 % MCR: MFT, burners out. PR-OPE-5002 has no air reduction after light-off; its 10 % is the secondary staging air nozzle dampers at their limit stop in the FURNACE PURGE line-up (section FURNACE PURGE: 'Dampers of secondary staging air nozzles close to limit stop (10% OPEN)', 'Total Air Flow > 25% MCR'). Kept as a confirm step (the step numbers stay), no air reduction */ { st: 4, sec: 28, slow: drnSlow, need: 1, cr: 1, t: 'Air stays above the purge minimum after light-off', d: 'PR-OPE-5002 FURNACE PURGE: total air flow above 25 % MCR, the secondary staging air nozzle dampers at their limit stop (10 % open), the PA fan at its minimum air flow. Do not lower the PA or SA air under that after light-off: total air under 25 % MCR is an MFT condition (DITL-03A row 6). The oil flame adds flue gas and the furnace pressure rises: the ID fan coupling PICFG108 must stay in AUTO (SV −15 mmH₂O). Under 16 % the drawing puts it in MANUAL by itself (ABC-008 M.0206 = PICFG108.MV < 16, M.0205 force manual; parameter list ML 0): then raise the coupling 1 % at a time to 16 % or more and press A, SV −15. A furnace pressure HIGH-HIGH is an MFT. Confirm when checked.', fps: ['FICFA1071', 'FICFA1081', 'PICFG108'], c: b.ALL(b.MODE('PICFG108', 'AUTO'), b.PV('PICFG108', -60, 25, 'mmH₂O')), a: [...DRN, btn('Coupling PICFG108 M +1 % (only while MANUAL under 16 %)', () => (md('PICFG108') !== 'AUTO' && mv('PICFG108') < 16 ? A.man('PICFG108', Math.min(100, Math.round(mv('PICFG108')) + 1)) : 'Not needed: PICFG108 ' + md('PICFG108') + ' MV ' + f0(mv('PICFG108')) + ' %')), btn('PICFG108 A, SV −15', () => (mv('PICFG108') >= 16 && !(h().bit('ABC-008', 'M.0205') > 0.5) ? A.auto('PICFG108', -15) : 'Wait: PICFG108 MV ' + f0(mv('PICFG108')) + ' % (≥ 16)'), () => md('PICFG108') === 'AUTO')] /* 3.2.3 automatic run: the PID took the coupling to 14 % before light-off (ML 0), M.0206 forced MANUAL, the oil flame took the furnace to +176 mmH2O and HIGH-HIGH = MFT at step 59 */ },
      { st: 4, sec: 28, slow: drnSlow, t: 'Warm-up: wait for the water to boil (100 °C)', d: 'You control the firing: the temperature rise is ≤ 60 °C per hour (PR-OPE-5002: gradient 1 °C a minute). Watch the "Heating rate": below 45 °C/h, oil ▲ +5 %; above 55 °C/h, oil ▼ −5 %. Speed up the simulation if you want.', c: b.VAL('Tw', 100, null), fps: ['FICDO1043A', 'FICDO1043D'], a: [...DRN, oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5)], w: WARM, wait: 1 },
      { st: 4, sec: 28, slow: drnSlow, t: 'Drum pressure 2 kg/cm²: close the vents and drains (field)', d: 'Once there is pressure, the field operator closes the vents and drains of the steam side. The steam now leaves through the MS blow-off (open ≥ 10 % since the drum filling), so the feedwater flow is continuous: put the start-up level LICBR1001B in AUTO SV 0 now (PR-OPE-5002: "Set to AUTO the Feedwater control as soon as possible and practicable after continuous Feedwater flow is established").', c: b.VAL('Pd', 2, null), wait: 1, field: [], fps: ['LICBR1001B'], get a() { return DRN.concat([btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0), () => md('LICBR1001B') === 'AUTO')]); } } /* 3.2.3-beta.90 (CHAEWON, warm-up drum LEVEL L.L. MFT at steps 55 ~ 57 in about 2 of 9 automatic runs): the drum fill ends near -150 mm (PR-OPE-5002 monitor line "Drum level (-150mm)"), 28 mm over the LSLL -178 mm (alarm list, plantsw.js). The steam left through the blow-off from the first kg/cm2 with the start-up valve shut until the AUTO of step 54; when that step came late in plant time the level fell under -178 = MFT (DITL-03A row 9). PR-OPE-5002 (BOILER AUTOMATIC CONTROL): "Set to AUTO the Feedwater control as soon as possible and practicable after continuous Feedwater flow is established": the feed is continuous once the steam leaves the drum, that is this step */,
      { st: 4, sec: 28, slow: drnSlow, t: 'Drum pressure 15 kg/cm²: light burners B and C', d: 'At 15 kg/cm² the other two burners are added: SA damper and oil FCV to ignition, BURNER ON (the DITL opens the oil valve), first oil A / D down to the burner minimum fire, then B / C held at the minimum fire too (PR-OPE-5002: B / C after 30 minutes, "at minimum firing ratio"; then all four together for the gradient 1 °C a minute). With four burners the pressure rises fast and the steam leaves through the MS blow-off (open ≥ 10 % since the drum filling, PR-OPE-5002): first put the MS blow-off PICMS1002 in AUTO with its set point at the drum pressure and the start-up level LICBR1001B in AUTO SV 0. Then raise the blow-off set point 1 kg/cm² at a time, one every 2 minutes, up to 35: the blow-off stays open and passes steam all the way up (a set point of 35 at once shuts it, the boiler stores the heat and at 35 the blow-off goes from shut to full open, the drum level falls to the low-low and trips the boiler), and the water that leaves as steam is fed back by the start-up valve.', c: b.ALL(b.VAL('Pd', 15, null), b.BURN4, b.MODE('PICMS1002', 'AUTO'), b.MODE('LICBR1001B', 'AUTO')), fps: ['PICMS1002', 'LICBR1001B', 'FICDO1043B', 'FICDO1043C'] /* 3.2.3 automatic run: with the blow-off set only at step 57 the closed boiler on 4 burners went 21 -> 114 kg/cm2 at ≤ 110 C/h, then the blow-off opening dropped the drum to -422 mm = MFT */, get a() {
          const pre = [bovAuto(), btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0), () => md('LICBR1001B') === 'AUTO'), bovRamp()];
          /* 3.2.3-beta.101 (Mina live beta.100: heating rate 137, 181, 155 C/h with the four burners lit at about 2 kg/cm2, average 113
             against the 55 of the step text and the PR-OPE-5002 gradient 1 C a minute; the blow-off went to 100 % for 50 minutes): B / C
             are lit at 15 kg/cm2, as the title and the text of this step say (PR-OPE-5002 "SUB B/C may start after 30 minutes": may, not
             must). Under 15 kg/cm2 the saturation temperature climbs fastest per kg/cm2 (2 -> 15 kg/cm2 = 133 -> 200 C) and the minimum
             fire of four burners (4 x 614.4 kg/h) is over the gradient there; A / D carry the warm-up to 15 */
          const at15 = b => Object.assign({}, b, { on: () => (+U().Pd || 0) < 15 || b.on(), hide: () => (+U().Pd || 0) < 15 && !b.on() });
          /* 3.2.3-beta.107 (Mina live beta.102: heating 29 ~ 67 C/h on A / D, then 94 ~ 97 C/h after the B / C light-off at step 56, blow-off
             94 ~ 100 %, drum -192 mm): B / C went in at 20 % on top of A / D, about +40 % of fire at once, and the oil ▼ of the warm-up
             (−5 % each 2 minutes) was too slow for it. PR-OPE-5002: "Light off another burner ... at minimum firing ratio" and "Once all 4
             burners are in service, increase load on all four burners simultaneously to meet start-up curve. Gradient = 1 C/min": A / D go
             to the burner minimum fire first, B / C are lit and held at the minimum fire (614.4 kg/h, oilMin), then the heating rate seek
             moves all four together */
          const adMin = btn('Oil A / D to the burner minimum fire (before B / C)', () => { const lo = oilMin(['A', 'D']); A.man('FICDO1043A', lo); A.man('FICDO1043D', lo); return ''; }, () => inSvc('B') || inSvc('C') || ((+mv('FICDO1043A') || 0) <= oilMin(['A', 'D']) + 1 && (+mv('FICDO1043D') || 0) <= oilMin(['A', 'D']) + 1));
          const bcMin = btn('FICDO1043B / C M burner minimum fire', () => { const lo = oilMin(['A', 'D']); for (const k of ['B', 'C']) if (inSvc(k)) A.man('FICDO1043' + k, lo); if (inSvc('B') && inSvc('C')) paceT.bcMin = simT(); return ''; }, () => inSvc('B') && inSvc('C') && paceT.bcMin != null);
          return DRN.concat(WL() ? pre.concat([adMin, bIgn('B'), bIgn('C'), bOn('B'), bOn('C'), bcMin].map(at15)) : pre.concat([btn('Open oil valves B and C', () => (A.oil('M.3411', true), A.oil('M.3416', true))), btn('BURNER B and C ON', () => (A.motor('M.3413', 1), A.motor('M.3418', 1)), () => bit('M.3413') > 0.5 && bit('M.3418') > 0.5), btn('FICDO1043B / C M 20 %', () => (A.man('FICDO1043B', 20), A.man('FICDO1043C', 20)))]));
        } },
      /* 3.2.0 P1 #3 (PR-OPE-5002 7259: "Turbine Main Steam Motorized isolation valve (MVMS1391) is necessary to be Equalized and OPENED during
         boiler pressurization at around 20~30 ksc"): no steam reaches the MSV (ATS 1.3) and the turbine with it shut */
      {
        st: 4,
        sec: 28,
        slow: drnSlow,
        t: 'Main steam MOV: equalizing MV-MS1392 OPEN, then MV-MS1391 OPEN (20 ~ 30 kg/cm²)',
        d: 'PR-OPE-5002: at 20 ~ 30 kg/cm² of main steam, slowly open the turbine inlet equalizing MOV MV-MS1392 (5 ~ 10 minutes for the pressure and temperature to equalize; watch the drum level), then open the main steam MOV MV-MS1391. While it is closed, no steam reaches the MSV and the turbine.',
        c: b.ALL(b.VAL('Pd', 20, null), mcvC('MV-MS1391 open', () => mcvPos('MV-MS1391') >= 100)),
        a: [...DRN, mcvB('MV-MS1392', 1), mcvB('MV-MS1391', 1), bovRamp()]
      },
      { st: 4, sec: 28, slow: drnSlow, t: 'Drum pressure 30 kg/cm²', d: 'Wait for 30 kg/cm². You still control the heating rate (≤ 60 °C/h, oil ▲ / ▼). Oil firing goes only up to 30 ~ 35 kg/cm² (PR-OPE-5002: the coal takes it from there). Keep the MS blow-off PICMS1002 in AUTO and keep raising its set point 1 kg/cm² every 2 minutes up to 35: the pressure follows the set point, the blow-off stays open.', c: b.ALL(b.VAL('Pd', 30, null), b.MODE('PICMS1002', 'AUTO')), fps: ['FICDO1043A', 'FICDO1043B', 'PICMS1002'] /* 3.2.3 automatic run: with the blow-off AUTO only at the next step the pressure went 37 -> 81 kg/cm2 on 10 % blow-off */, a: [...DRN, bovAuto(), bovRamp(), oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], w: WARM, wait: 1 },
      /* 3.2.0-beta.40 (roadmap 2, Cold run stall at "Bypass servicing"): PR-OPE-5002 STEAM DRUM FILLING "Ensure MS BLOW OFF VALVE (BOV)
         >10 % OPEN" and BYPASS SYSTEM SERVICING "Gradually close MS Blow off valve ... transfer steam flow to RH": the MS blow-off is
         open through the warm-up and the turbine auxiliaries, and the start-up valve keeps the drum level. Before (beta.37 ~ 39) this
         step came after the vacuum up: a closed boiler on 4 oil burners went 30 -> 131 kg/cm2 while the TCS auxiliaries were done, the
         drum level fell to -422 mm (no feed), the low-low level tripped the oil (MFT) and the bypass step waited forever (steam 0) */
      {
        st: 4,
        sec: 28,
        slow: drnSlow,
        t: 'Pressure and level: start-up level LICBR1001B AUTO SV 0, MS blow-off PICMS1002 AUTO SV 35',
        d: 'PR-OPE-5002: the MS blow-off valve is open (≥ 10 %) during the warm-up. The blow-off (PICMS1002) holds the main steam pressure at 35 kg/cm² while the TCS auxiliaries and the vacuum are done, and the start-up valve (LICBR1001B) holds the drum level. The four oil burners make more steam than the blow-off passes at 35 kg/cm² (about 62 T/H full open): lower the oil (▼ −5 %, not under the burner minimum fire, 614.4 kg/h) so the blow-off does not stand full open. The step is done when the drum is at the set point (33 ~ 37 kg/cm²) and the drum level is inside its alarms (−100 ~ +127 mm). The make-up valve LCV-MU1110 alone gives the hotwell about 58 T/H: if the hotwell level falls under −100 mm, open the hotwell filling MOV MV-MU1001 too (PR-OPE-5002 hotwell filling) and close it again when the level is back over +50 mm. The steam that leaves to the air is water the make-up must give back to the hotwell and the deaerator: with the blow-off full open for an hour the deaerator runs empty, the feedwater pumps trip on its low-low level and the drum level low-low is an MFT. Coal comes only after the sync (FHI Fig. 2): oil burners only up to 45 MW.',
        /* 3.2.3-beta.80: also the SV 35 of the title and the blow-off not full open (the text: "so the blow-off does not stand full open") */
        c: b.ALL(b.MODE('LICBR1001B', 'AUTO'), b.MODE('PICMS1002', 'AUTO'), b.VAL('Pd', 33, 37), b.VAL('lvl', -100, 127), C('PICMS1002 SV 35', () => (+svOf('PICMS1002') || 0) >= 35, () => f0(+svOf('PICMS1002'))), C('MS blow-off not full open', () => (+mv('PICMS1002') || 0) < 100, () => f0(+mv('PICMS1002')) + ' %')) /* 3.2.3-beta.57 (no assumed values): the "blow-off <= 60 % for 300 s" of beta.43 is in no document (ASSUMED_sources row 15); the step is done at the hold pressure with the drum level inside its L / H alarms (-100 / +127 mm, alarm list 20160912). Before: */ /* 3.2.3 automatic run: on four burners the blow-off stayed full open (75 T/H to the air), the deaerator ran empty 100 min later, BFWP A / B LOW-LOW trip, drum -422 mm, MFT. 3.2.3 automatic run (sections 17 ~ 40): at 30 kg/cm2 the blow-off was still shut, so 'MV <= 60 %' passed before the pressure reached its set point; the oil was never trimmed, the field and vacuum steps that follow have no oil buttons, the drum went 30 -> 41 kg/cm2 with the blow-off full open and the level low-low (drum level -259 mm) was an MFT at the vacuum up: the balance is checked at the set point (drum 33 ~ 37 kg/cm2, blow-off <= 60 %, 5 minutes; a second run passed at 38.7 kg/cm2 with the blow-off still opening, 20 -> 98 % in 6 minutes, and the drum level fell 33 -> -306 mm) */,
        fps: ['LICBR1001B', 'PICMS1002', 'FICDO1043A', 'FICDO1043B'],
        /* 3.2.3-beta.90 (Mina live run on beta.80: the "Do it for me" stopped here with the blow-off full open and the main steam 52 kg/cm2):
           beta.80 made "blow-off not full open" part of the step, but the Do it for me never presses the oil ▼ (the ▲ / ▼ are the trainee's
           own hand, #108), so nothing lowered the oil. The seek does what the step text says: while the blow-off stands full open, oil ▼
           −5 % on every lit burner, not under 20 % (oilStep), one press each 2 minutes of the plant (the pace of oilBand, ASSUMED_sources row
           17: the pace of the Do it for me, not a plant value) */
        seek: () => { if ((+mv('PICMS1002') || 0) < 100 || simT() - (paceT.bo57 || -1e9) < 120) return; paceT.bo57 = simT(); oilStep('', ['A', 'B', 'C', 'D'], -5).f(); },
        /* 3.2.3 automatic run (beta.36 LP heater open): the blow-off passed 60 ~ 70 T/H, the hotwell fell to -306 mm on LCV-MU1110 alone,
           the CEP stopped, the deaerator ran empty, MFT: MV-MU1001 opens when the hotwell is low (muFill) */
        get a() {
          return DRN.concat([btn('LICBR1001B A, SV 0', () => A.auto('LICBR1001B', 0), () => md('LICBR1001B') === 'AUTO'), bovAuto(), bovRamp(), oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)].concat(muOpen()));
        },
        w: WARM.concat([['MS blow-off opening', () => mv('PICMS1002'), '%', f1w, '< 100']])
      },
      /* ---- 5 vacuum and seals ---- */
      /* 3.2.0-beta.37 (user 2026-10-25): the aux steam (from the main steam > 12 kg/cm2), the turning gear, the gland sealing and the
         ejectors before the vacuum up (PR-OPE-5002 5708, 6118, 6512); the unit model raises the vacuum only with the aux steam */
      FIELD(5, 'Deaerator warming, condensate polisher, bed material (field)', [28, 29, 30, 31, 32, 33, 34, 35], { d: 'The field operator part of these sections. Their DCS items are the next steps (flash chamber drains, deaerator pegging, polisher MOVs, aux steam MV-AS1391, gland drains); turning gear, gland sealing and vacuum up are on the TCS panel.' }),
      /* audit B4: PR-OPE-5002 30.4 "Check all drains at DCS going to flash chamber was in manual and close": XV-MS1023 (DITL-89), XV-CR1012
         (DITL-74), XV-HR1021 (DITL-80), XV-HR1022 (DITL-81); row 19 CLOSE PB, row 11 AUTO SELECTED (IO list STN102 O.0125 / O.0127 / O.0128) */
      { st: 5, sec: 30, t: 'Flash chamber drains at the DCS: manual and closed', d: 'Do: the drain pot valves going to the flash chamber not in AUTO and CLOSED (PR-OPE-5002 30.4).', c: b.ALL(...[['DITL-89', 'XV-MS1023'], ['DITL-74', 'XV-CR1012'], ['(99)DITL-80', 'XV-HR1021'], ['DITL-81', 'XV-HR1022']].map(([nm, tg]) => C(tg + ' manual and closed', () => !WL() || (!dInG(nm, 10) && movPos(nm) <= 0), () => tg + (dInG(nm, 10) ? ' AUTO' : ' MAN') + ' ' + f0(movPos(nm)) + ' %'))), a: [['DITL-89', 'XV-MS1023'], ['DITL-74', 'XV-CR1012'], ['(99)DITL-80', 'XV-HR1021'], ['DITL-81', 'XV-HR1022']].map(([nm, tg]) => movB(nm, tg, 0, 4, 18)) },
      /* audit B5: PR-OPE-5002 31.4 "Set PCV-AS10000 to AUTO mode. SV = 1.5 ksc" (the valve is PCV-AS1030, IO list STN102 AO0403; ABC-056 PICCD1104) */
      { st: 5, sec: 31, t: 'Deaerator pegging steam PICCD1104 (PCV-AS1030) in AUTO, SV 1.5 kg/cm²', d: 'Do: the pegging steam pressure control of the deaerator to AUTO with SV 1.5 kg/cm² (PR-OPE-5002 31.4).', c: b.ALL(b.MODE('PICCD1104', 'AUTO'), b.SV('PICCD1104', 1.5, 1.5)), fps: ['PICCD1104'], a: [btn('A, SV 1.5 kg/cm²', () => A.auto('PICCD1104', 1.5))] },
      /* audit B1: PR-OPE-5002 34.5 "Gradually OPEN MV-CD1007", 34.12 "Fully OPEN MV-CD1008": DCS MOVs DITL-64 / DITL-65 (row 3 OPEN PB, CLOSE PB row 12 / 13;
         IO list STN102 O.0170 / O.0171 and the CD1008 pair) */
      { st: 5, sec: 34, t: 'Condensate polisher: inlet MOV MV-CD1007 and outlet MOV MV-CD1008 OPEN', d: 'Do: open the polisher inlet MOV MV-CD1007 gradually, then the outlet MOV MV-CD1008 fully (PR-OPE-5002 34.5, 34.12). DCS valves (DITL-64 / 65): the field operator turns their selectors to REMOTE, the water treatment gives the polisher train READY (RY-CD01). A condensate pump must run: with the condensate flow FT-CD1120 under 50 T/H the drawing closes the inlet MOV.', c: b.ALL(C('MV-CD1007 open', () => !WL() || movPos('DITL-64') > 0, () => 'MV-CD1007 ' + f0(movPos('DITL-64')) + ' %'), C('MV-CD1008 fully open', () => !WL() || movPos('DITL-65') >= 100, () => 'MV-CD1008 ' + f0(movPos('DITL-65')) + ' %')), a: [movRem('DITL-64', 'MV-CD1007'), movRem('DITL-65', 'MV-CD1008'), fldRow('WATER TREATMENT: polisher train RY-CD01 READY (DITL-64 row 7)', 'DITL-64', 6), movB('DITL-64', 'MV-CD1007', 1, 2, 11), movB('DITL-65', 'MV-CD1008', 1, 2, 12)] } /* the OPEN of MV-CD1007 (DITL-64 AND gate of MOR-CD1007 O.0170) needs RY-CD01 READY I.025F from the water treatment PLC (DITL-64 row 7): the WTP puts the polisher train in service (PR-OPE-5002 34, field part) */,
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the turbine auxiliaries on the TCS model (tcs.js): ATS criteria 1.14 ~ 1.19, PR-OPE-5002 5708 / 6118
         / 6512. Before (beta.37) one "field" confirm */
      /* all-steps check 2026-10-30: the section of each turbine step is the PR-OPE-5002 section that does it (14 lube oil / vapour
         extractor, 33 gland sealing with the turning gear, 35 vacuum up; the aux steam stays 31); the practice steps are section 47 */
      { st: 5, sec: 14, t: 'TCS: lube oil pump, EH oil pump, MOT vapour extractor START', d: 'Bearing oil (ATS 1.15 / 1.16), control oil (1.14) and the vapour extractor (1.18) are needed before the turning gear and all ATS steps.', c: C('Lube oil, EH oil, vapour extractor running', () => TC().aux.lop && TC().aux.eh && TC().aux.vex, () => ['lop', 'eh', 'vex'].filter(k => !TC().aux[k]).join(', ') || 'OK'), a: [btn('LUBE OIL PUMP START', () => A.tcs('lop', 1), () => TC().aux.lop), btn('EH OIL PUMP START', () => A.tcs('eh', 1), () => TC().aux.eh), btn('VAPOUR EXTRACTOR START', () => A.tcs('vex', 1), () => TC().aux.vex)] },
      { st: 5, sec: 33, t: 'Turning gear ON (about 3 rpm)', d: 'The rotor turns slowly so it does not bend while it warms up (ATS 1.19 TURBINE TURNING). Bearing oil is needed.', c: C('Turbine turning (≥ 1 rpm)', () => TC().aux.tg && TC().rpm >= 1, () => f1(+TC().rpm || 0) + ' rpm'), a: [btn('TURNING GEAR ON', () => A.tcs('tg', 1), () => TC().aux.tg)] },
      { st: 5, sec: 31, t: 'Aux steam: open MV-AS1391 (main steam > 12 kg/cm²)', d: 'The aux steam header (10 kg/cm²) comes from the main steam (PR-OPE-5002 5727 REQUIREMENT: MS > 12 kg/cm²). It is the steam for the gland seal and the ejectors. MV-AS1391 is a DCS valve (DITL-51): REMOTE, then OPEN.', c: C('Aux steam header > 10 kg/cm²', () => TC().Pa > 10, () => f1(+TC().Pa || 0) + ' kg/cm²'), a: [movRem('DITL-51', 'MV-AS1391'), movB('DITL-51', 'MV-AS1391', 1, 4, 15)], wait: 1 } /* 3.2.3 automatic run (sections 17 ~ 40): the CLOSE button of this step was pressed by "Do it for me" with the OPEN (both not done while the MOV travels), the MOV stood part open and the aux steam header took about 200 minutes of the plant to pass 10 kg/cm2 (6 minutes in a run where it opened): the step only opens it; FIELD to REMOTE first, as the MOVs of steps 68 / 73 (the selector stands where the field left it) */ /* audit A3: PR-OPE-5002 29.1 "Gradually OPEN MV AS 1391" on its DCS drawing DITL-51 (row 5 OPEN PB M.0360, row 16 CLOSE PB M.0361; IO list STN102 O.0160 / O.0161) */,
      { st: 5, sec: 33, t: 'Gland sealing (aux > 7 kg/cm², turning gear, vacuum breaker open)', d: 'PR-OPE-5002 6118: MS > 12, aux > 7 kg/cm², gland steam 220 °C, turning gear running, vacuum breaker MV-AV1391 open (ATS 1.10).', c: C('Gland steam seal header normal', () => TC().aux.gland, () => (TC().aux.gland ? 'in service' : 'off')), a: [btn('GLAND STEAM IN SERVICE', () => A.tcs('gland', 1), () => TC().aux.gland), ...[['DITL-53', 'MV-AS1393 (gland steam separator drain)'], ['DITL-116', 'MV-AS1397 (T/B gland steam line drain)']].map(([nm, l]) => Object.assign(btn(l + ' AUTO (' + nm + ')', () => (WL() && window.LS_DOCK ? (LS_DOCK.dsel(nm, 9, true, l + ' AUTO MODE SELECTED'), '') : ''), () => !WL() || dInG(nm, 9)), { dg: [nm, 0], ad: nm }))] } /* audit A4: PR-OPE-5002 33.12 "Put in auto ... MVAS1393 ... MVAS1397 at the DCS" (IO list STN102 O.0164 / O.016A) */,
      { st: 5, sec: 35, t: 'Vacuum up: close the vacuum breaker, ejectors (aux > 10 kg/cm²)', d: 'PR-OPE-5002 6512: gland sealing done, aux > 10 kg/cm², vacuum breaker MV-AV1391 closed, 1st and 2nd ejector (on the DCS: MV-AV1391 CLOSE on DITL-56, then MV-AS1396 and MV-AS1395 OPEN on DITL-55 / 54). About 15 minutes to reach ≥ 90 % (ATS 1.11).', c: b.ALL(C('Condenser vacuum ≥ 90 %', () => +U().vac >= 0.9, () => f0(100 * (+U().vac || 0)) + ' %'), C('LP exhaust hood spray FVCD1904 AUTO (PR-OPE-5002 6307)', () => !!TC().aux.hsp, () => (TC().aux.hsp ? 'AUTO' : 'OFF'))), a: [movRem('DITL-56', 'MV-AV1391'), movB('DITL-56', 'MV-AV1391', 0, 3, 13), movB('DITL-55', 'MV-AS1396', 1, 4, 13), movB('DITL-54', 'MV-AS1395', 1, 4, 13), btn('VACUUM UP (ejectors)', () => A.tcs('vacuum', 1), () => TC().aux.ej), btn('Hood spray FVCD1904 AUTO', () => A.tcs('hood', 1), () => !!TC().aux.hsp)], wait: 1 },
      /* ---- 6 bypass at 61 kg/cm2, oil only (3.2.0-beta.37, CHECKLIST 0.5: PR-OPE-5002 BYPASS SYSTEM SERVICING -> TURBINE ROLLING ->
         SYNCH. & INITIAL LOAD -> LOAD UP -> solid fuel; FHI SECT_7 Fig. 2 COLD STARTUP: roll at 60 kg/cm2 6 h, coal 8.6 h. Before, the
         coal and 123 kg/cm2 came before the roll and the bypass dumped 155 ~ 189 T/H) ---- */
      /* 3.2.0-beta.37: before the roll, on oil (CHECKLIST 0.5). 3.2.0-beta.23: the bypass goes in service BEFORE the coal (PR-OPE-5002: BYPASS SYSTEM SERVICING comes before the solid fuel
         firing). Before, it came after the burners were out: the blow-off alone (about 13 T/H at 35 kg/cm2) could not take the steam of
         the coal and the pressure went over 140 kg/cm2 (172 with the primary air at 280 T/H and the coal that follows it) */
      {
        st: 6,
        sec: 30,
        t: 'Bypass in service: HP bypass A, LP bypass A SV 7.6, RH blow-off M 20 %',
        d: 'The HP bypass (PICMS1006) holds the main steam pressure, the LP bypass (PICHR1003) the reheat pressure at 7.6 kg/cm². HP bypass SV = the pressure now.',
        c: b.ALL(b.MODE('PICMS1006', 'AUTO'), b.MODE('PICHR1003', 'AUTO')),
        fps: ['PICMS1006', 'PICHR1003', 'PICHR1391'],
        slow: drnSlow,
        a: [...DRN, btn('Set all', () => {
          /* 3.2.0-beta.38: the SV at the pressure of now (the step text), not 61 under it: at 85 kg/cm2 the bypass opened full and the
             drum level went to -300 mm (MFT, Cold run) */
          const p = Math.ceil(h().MSP()); /* beta.52 run: max(50, MSP) left the boiler closed from 35 to 50, then the bypass opened 0 -> 100 T/H at once (drum LL): the SV is the pressure of now, as the step says */
          /* 3.2.3 automatic run (beta.51): SV 50 held the main steam at 50 kg/cm2 through the MS blow-off while the HP bypass went up
             to 61: the ready-to-roll step waited 20 h and the drum level fell to MFT. The blow-off stays 2 above the HP bypass SV and follows its ramp (svRamp), so the steam passes to the bypass as it opens, with no
             closed boiler (beta.52 run: SV 66 at once shut 47 T/H, the bypass opened only 5 %, drum +259 mm HH) */
          A.auto('PICMS1002', p + 2); /* the +2 offset is NO-SOURCE (ASSUMED_sources row 16): PR-OPE-5002 7141 ~ 7199 only "use HPBV to set the required pressure" and "gradually close MS blow-off valve" */
          A.auto('PICMS1006', p);
          A.auto('PICHR1003', 7.6);
          A.man('PICHR1391', 20);
          A.auto('LICBR1001B', 0);
          /* 3.2.0 P1 #5: the spray water block valves of the HP / LP bypass desuperheaters in AUTO MODE (DITL-79 XV-FW1061 M.0582, DITL-66
             XV-CD1114 M.0522): the DITL opens them on the demand of TICMS1022 / TICHR1012; shut, no spray water reaches the bypass steam */
          if (WL()) ['DITL-79', 'DITL-66'].forEach(n => window.LS_DOCK && LS_DOCK.dset && LS_DOCK.dset(n, 4, 1));
          return '';
        })],
        field: [29]
      },
      { st: 6, sec: 30, t: 'Bypass servicing: MSP ≥ 48 kg/cm² and steam flow ≥ 40 T/H', d: 'Do: raise the oil firing until steam flow is 40 ~ 55 T/H, trim the air, then raise the HP bypass SV up to 61. (1) Oil firing up (oil ▲) until steam flow is 40 ~ 55 T/H, (2) air: O₂ 3.5 ~ 8 % with the SA damper (SA ▲ / ▼), PA flow 280 T/H once the bed is hot (PA ▲ / ▼), (3) when the HP bypass is in service (MSP ≥ 48, steam ≥ 40), raise the HP bypass PICMS1006 SV by 1 kg/cm² per minute up to 61.', c: b.ALL(b.VAL('MSP', 48, null), b.VAL('MSF', 40, null)), fps: ['PICMS1006', 'FICFA1081', 'FICFA1071'], slow: drnSlow, get a() { return [...DRN, ...muFill() /* beta.80: MV-MU1001 shut again once the hotwell is back over +50 mm (opened at the 35 kg/cm2 hold, muOpen) */, oilBand(1, 40, 55), oilBand(0, 40, 55), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5), step('SA damper ▲ +2 %', 'FICFA1081', 2), step('SA damper ▼ −2 %', 'FICFA1081', -2), step('PA damper ▲ +1 %', 'FICFA1071', 1), step('PA damper ▼ −1 %', 'FICFA1071', -1), svRamp('PICMS1006', 61, 60)].concat(muFill()); }, w: BYP, wait: 1 },
      { st: 6, sec: 30, t: 'Main steam pressure 61 kg/cm²: ready to roll', d: 'PR-OPE-5002 (cold start): MS 61.2 kg/cm², steam flow > 40 T/H, reheat ≤ 8.5 kg/cm². The HP bypass holds 61 (SV +1 per minute) and the LP bypass holds the reheat; you control the oil for 40 ~ 55 T/H.', c: b.HOLD(120, b.ALL(b.VAL('MSP', 59, null), b.VAL('MSF', 40, null), b.VAL('RHP', null, 9))), fps: ['PICMS1006'], slow: drnSlow, a: [...DRN, oilBand(1, 40, 55), oilBand(0, 40, 55), svRamp('PICMS1006', 61, 60), /* 3.2.3-beta.108 (Mina B102-3: step 83 waited about 230 minutes with the HP bypass SV at 57; the Do it pressed SV −1 at each pass, about every 7 s of the plant at x10, while the main steam stayed over 63 after the SV, and nothing raised it again): not under 61, the SV of this step (PR-OPE-5002 MS 61.2 kg/cm2) */ Object.assign(svStep('HP bypass SV −1 (not under 61)', 'PICMS1006', -1, 61, 123), { on: () => h().MSP() <= 63 || (+svOf('PICMS1006') || 0) <= 61, hide: () => h().MSP() <= 63 || (+svOf('PICMS1006') || 0) <= 61 })], w: BYP, wait: 1 },
      /* ---- 7 turbine on oil ---- */
      FIELD(7, 'Field checks before the roll: drains, TCS lamps, turbine area (field)', [36, 37, 38, 39], { d: 'Field operator tasks. The ATS steps are on the TCS panel (next steps).' }),
      /* 3.2.0-beta.38 (CHECKLIST 0.6): the ATS steps of the TCS model (tcs.js; ATS Sequence 310SC90-775, Criteria 310SC90-776). Before
         (beta.37) one ROLL button: 0 -> 3600 rpm in 30 min with no criteria */
      { st: 7, sec: 41, t: 'ATS step 0: HP TURBINE WARMING', d: 'ATS page 13: when the HP first stage metal is ≤ 150 °C, steam at the CV (B) warms it until > 150 °C. Needed: gland seal, vacuum, bearing oil, turning gear (CRITERIA A0).', c: C('HP turbine warming done (HP metal > 150 °C)', () => TC().step >= 0, () => 'HP metal ' + f0(+TC().Thp || 0) + ' °C' + (TC().cur === 0 ? ', warming' : '')), a: [btn('HP TURBINE WARMING', () => A.tcs('warm'), () => TC().cur === 0 || TC().step >= 0)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 1: TURBINE PREPARATION (CV chest warming, reset, MSV open)', d: 'ATS page 14 ~ 16: when the CV chest is ≤ 150 °C, CV chest warming for 60 minutes (or diff < 50 °C and outer > 180 °C), then TURBINE RESET, MSV OPEN, LOAD LIMITER UPPER.', c: C('Turbine preparation done', () => TC().step >= 1, () => 'CV chest ' + f0(+TC().Tcvi || 0) + ' / ' + f0(+TC().Tcvo || 0) + ' °C' + (TC().cur === 1 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' min' : '')), a: [btn('TURBINE PREPARATION', () => A.tcs('prep'), () => TC().cur === 1 || TC().step >= 1), HOFF()], wait: 1 },
      { st: 7, sec: 41, t: 'Steam for the roll: MS 60 kg/cm² / 400 ~ 420 °C, RH 7.5 kg/cm² / 415 ~ 425 °C', d: 'PR-OPE-5002 8254 COLD START-UP: MS 60 kg/cm², 400 °C; RH 7.5 kg/cm², 415 °C. ATS Fig. 2 / 3: with cold metal, MSV inlet ≤ 420 °C and reheat ≤ 425 °C. You control the main steam temperature with the SH spray TICBR1150 (MV ▲ / ▼) and the reheat with the biasing damper (RH damper HICHR1002A ▲ / ▼).', c: C('CRITERIA A2 (rub check) ready', () => TC().cur < 0 && !TC().next, () => TC().next || 'OK'), fps: ['TICBR1150', 'HICHR1002A', 'PICMS1006'], a: [/* beta.108 (Mina B102-3): the roll needs MS >= 60; an HP bypass SV left under 61 is raised back here */ svRamp('PICMS1006', 61, 60), step('SH spray ▲ +2 %', 'TICBR1150', 2), step('SH spray ▼ −2 %', 'TICBR1150', -2), step('RH damper ▲ +5 %', 'HICHR1002A', 5), step('RH damper ▼ −5 %', 'HICHR1002A', -5)], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 2: TURBINE RUB CHECK (200 rpm, coast < 100 rpm)', d: 'ATS page 17 ~ 18: 200 rpm, CV / ICV closed, the rotor is let to slow down; done when < 100 rpm. The field operator listens for rubbing.', c: C('Rub check done', () => TC().step >= 2, () => f0(+TC().rpm || 0) + ' rpm' + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('RUB CHECK', () => A.tcs('rub'), () => TC().cur === 2 || TC().step >= 2), HOFF()], wait: 1 },
      { st: 7, sec: 41, t: 'ATS step 3: ACCELERATION: 1800 rpm heat soak, then 3600 rpm heat soak', d: 'ATS page 19 ~ 22: 120 rpm/min. Ambient cold: 88 minutes at 1800 rpm, then HP metal > 170 °C and shell expansion > 3 mm, then 3600 rpm for 86 minutes. No hold in the critical zone 1372 ~ 1723 rpm.', c: C('Acceleration done (3600 rpm, heat soak)', () => TC().step >= 3, () => f0(+TC().rpm || 0) + ' rpm' + (TC().cur === 3 ? ', ' + TC().ph + ' ' + f0(+TC().tmMin || 0) + ' / ' + f0(+TC().soakMin || 0) + ' min' : '') + (TC().hold ? ' HOLD: ' + TC().hold : '')), a: [btn('ACCELERATION', () => A.tcs('accel'), () => TC().cur === 3 || TC().step >= 3), HOFF()], wait: 1 },
      { st: 7, sec: 42, t: 'ATS step 4: EXCITATION', d: 'ATS page 23: AVR EXCITATION START, generator voltage OK.', c: C('Excitation done', () => TC().step >= 4, () => (TC().cur === 4 ? 'excitation' : '—')), a: [btn('EXCITATION', () => A.tcs('excite'), () => TC().cur === 4 || TC().step >= 4), HOFF()], wait: 1 },
      { st: 7, sec: 42, ready: () => !(U().el && U().el.l52 === false), readyTxt: () => 'Wait: line breaker 52L1 is open (house load). Close 52L1 first: Instructor console, Grid. 52G closes only with 52L1 closed (TCS G-1B).', t: 'ATS step 5: SYNCH. & INITIAL LOAD (52G), LP bypass in REMOTE', d: 'ATS page 24 ~ 25: ASD START, 52G closed (needs 52L1 closed, TCS G-1B), initial load 3 % (4.5 MW), hold 40 minutes (Fig. 3). Put the LP bypass in R (SV = first stage + 5.1).', c: b.ALL(b.BIT('I.0931', 1, 'GCB 52G1 on'), b.MODE('PICHR1003', 'REM')), fps: ['PICHR1003'], a: [btn('SYNCH. & INITIAL LOAD', () => A.tcs('sync'), () => bit('I.0931') > 0.5), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      { st: 7, sec: 42, t: 'Initial load hold: 40 minutes, LP exhaust hood < 52 °C', d: 'ATS page 25 Fig. 3: 40 minutes (metal < 230 °C). PR-OPE-5002 9123: hold the initial load until the LP turbine exhaust hood is < 52 °C.', c: C('Initial load hold done and LP exhaust < 52 °C', () => TC().step >= 5 && TC().Tx < 52, () => (TC().cur === 5 ? f0(+TC().tmMin || 0) + ' / ' + (TC().holdMin || 40) + ' min, ' : '') + 'LP exhaust ' + f0(+TC().Tx || 0) + ' °C'), wait: 1 },
      { st: 7, sec: 42, t: 'LOAD UP to 45 MW (TCS), ICV → CV transfer', d: 'On the TCS panel: LOAD UP 45 MW (7.5 MW per minute). The transfer is at 15 ~ 22 MW. While loading: move the feedwater to the main valve (LICBR1001A A SV +50, start-up valve LICBR1001B M, close it 5 % per minute, LICBR1001 M 0 %). After the transfer, close the LP bypass PICHR1003 (M, −10 % per minute) until the preset clears (M.070F = 0), then R.', c: b.ALL(b.BIT('I.0418', 1, 'ICV to CV transfer complete'), b.VAL('MW', 15, null)), fps: ['LICBR1001B', 'LICBR1001A', 'PICHR1003'], slow: loadSlow, seek: loadSeek, a: [mspOil(1), mspOil(0), btn('LOAD UP 45 MW (TCS)', () => A.tcs('loadup', 45), () => U().tb && U().tb.st === 'load'), btn('Feedwater to main valve: LICBR1001A A SV +50, LICBR1001B M, LICBR1001 M 0 %', () => (A.man('LICBR1001B', mv('LICBR1001B')), A.auto('LICBR1001A', 50), A.man('LICBR1001', 0), '')), step('Start-up valve LICBR1001B ▼ −5 %', 'LICBR1001B', -5), step('LP bypass PICHR1003 ▼ −10 %', 'PICHR1003', -10), btn('LP bypass R', () => A.rem('PICHR1003'))] },
      {
        st: 7,
        sec: 42,
        t: 'Feedwater 3-ELEMENT: FICFW1007 R, LICBR1001 A, press 3-ELEMENT',
        d: 'When feedwater is > 110 T/H and the force manual is gone (M.0228 = 0), switch to 3-element: the feedwater follows the steam flow and the drum level.',
        c: b.ALL(b.VAL('FW', 100, null), b.MODE('FICFW1007', 'REM'), b.MODE('LICBR1001', 'AUTO'), b.BIT('M.0222', 0, 'single element')),
        fps: ['FICFW1007', 'LICBR1001'],
        /* 3.2.3-beta.56: the wait for feedwater > 110 T/H and M.0228 = 0 gated the whole step (doIt returns while not ready), so the oil buttons were never pressed while the main steam fell; the wait now gates the three 3-element buttons only */
        slow: loadSlow,
        seek: loadSeek,
        a: [mspOil(1), mspOil(0)].concat([btn('FICFW1007 R', () => A.rem('FICFW1007')), btn('LICBR1001 A, SV 0', () => A.auto('LICBR1001', 0)), btn('3-ELEMENT', () => A.push('M.054E'))].map(x => Object.assign(x, { on: () => !fw3Rdy(), hide: () => !fw3Rdy() })))
      },
      /* 3.2.0-beta.24: the MS blow-off to its load SV 128 (4.PNG 148.8 MW: BLOW-OFF A, SV 128, MV 0). The bypass coach left it at the
         HP bypass SV + 5 of the moment its step ended (118 + 5 = 123 in some runs): at 80 MW it opened > 5 % at MSP 123, and its
         M.0255 (ABC-013 -> ABC-001C M.2013 BU-CMD) put the boiler and turbine master back to MANUAL at the CCS handover */
      /* coal before the 45 MW hold (boiler model thread 2026-11-11, from JENNIE's run: at 'Hold 45 MW' on oil only the main steam fell 69 -> 19 kg/cm2, drum +773 mm, MFT):
         FHI Part 2 Sect 7 Tab 4, Figure 2 COLD STARTUP: IP/HP transfer 7.75 h, START COAL 8.6 h at 23 % boiler load and 80 kg/cm2, coal in by 30 % (9.2 h); 45 MW (30 %) is not held on oil. The bed is already above 600 C from the oil warm-up */
      { st: 7, sec: 44, t: 'Bed temperature ≥ 550 °C: coal feeder ready', d: 'FHI Part 2 Sect 8 Tab 9 p 2-8-TAB_9-14 step 23: coal may start when the furnace temperature at the burner elevation reaches 550 °C (burners reduced at 700 °C, out from 750 °C).', c: b.VAL('Tb', 550, null), wait: 1 },
      { st: 7, sec: 44, t: 'Batch firing of feeder A up to bed 600 °C', d: 'Do: START feeder A for about 10 seconds, STOP it for about 60 seconds, repeat until the bed is 600 °C (PR-OPE-5002 solid fuel firing). Watch the bed temperature: it rises when the coal burns.', c: C('Bed ≥ 600 °C', () => U().Tb >= 600, () => f0(U().Tb) + ' °C'), a: [fDis('A'), mot('M.3400', 'feeder A')] },
      { st: 7, sec: 44, t: 'Feeder A continuous, FICCL1061A in AUTO, coal demand FIC-CF 10 %', d: 'After 600 °C, feeder A runs continuously. Once it runs, put it in AUTO (the drawing forces it to manual while it is stopped). From here you change over the firing: coal (FIC-CF ▲) for the turbine steam, oil down 5 % per minute to 20 % (PR-OPE-5002: 2.55 T/H coal = 1 T/H diesel), pressure up to 123 kg/cm² (the TCS holds 45 MW). Watch the bed: < 700 °C with no burner = coal trip (DITL-03F).', c: b.ALL(b.BIT('M.3400', 1, 'feeder A running'), b.MODE('FICCL1061A', 'AUTO'), SETmin('FIC-CF', 8)), fps: ['FICCL1061A', 'FIC-CF'], a: [fDis('A'), mot('M.3400', 'feeder A'), btn('FICCL1061A A', () => A.loc('FICCL1061A')), btn('FIC-CF M 10 %', () => A.man('FIC-CF', 10)), step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (all) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL },
      { st: 7, sec: 44, t: 'Feeder B, then FICCL1061B in AUTO', d: 'The second feeder.', c: b.ALL(b.BIT('M.3401', 1, 'feeder B running'), b.MODE('FICCL1061B', 'AUTO')), fps: ['FICCL1061B'], a: [fDis('B'), mot('M.3401', 'feeder B'), btn('FICCL1061B A', () => A.loc('FICCL1061B'))] },
      { st: 7, sec: 42, t: 'HP bypass in REMOTE, HP and LP bypass and MS blow-off closed at 45 MW', d: 'After the transfer, put the HP bypass SV in R (SV = PV + 2): it closes and the turbine takes all the steam. From here the pressure rises with the load (FHI Fig. 2: 61 kg/cm² at 15 % load, 123 at 40 %). The MS blow-off PICMS1002 is AUTO SV 128 (closed; a blow-off open > 5 %, M.0255, is a back-up command of the boiler master).', c: b.ALL(b.VAL('MW', 44, null), b.MODE('PICMS1006', 'REM'), b.BIT('M.0709', 0, 'HP bypass open'), b.BIT('M.0255', 0, 'MS blow-off open'), C('MS blow-off PICMS1002 AUTO, SV ≥ 125 kg/cm²', () => md('PICMS1002') === 'AUTO' && svOf('PICMS1002') >= 125, () => 'PICMS1002 ' + md('PICMS1002') + ' SV ' + f0(svOf('PICMS1002')))), fps: ['PICMS1006', 'PICMS1002'], slow: loadSlow, seek: loadSeek, a: [mspOil(1), mspOil(0), btn('HP bypass R', () => A.rem('PICMS1006'), () => md('PICMS1006') === 'REM'), btn('PICMS1002 A, SV 128', () => A.auto('PICMS1002', 128))] },
      { st: 7, sec: 42, t: 'Hold 45 MW: MSP ≥ 90 kg/cm², drum level ±150 mm', d: 'NORMAL OPERATION on the TCS. Coal (feeders A and B) and the oil burners fire together; raise the coal (FIC-CF ▲) or the oil as the pressure needs (FHI Fig. 2: coal from 23 % load, 100 kg/cm² at 30 %).', fps: ['FICDO1043A', 'FICDO1043B'], w: BYP, c: b.ALL(C('TCS NORMAL OPERATION (ATS step 7)', () => TC().step >= 7, () => (TC().step >= 7 ? 'OK' : TC().next || 'press NORMAL OPERATION')), b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 90, 131), b.VAL('lvl', -150, 150)))), seek: coalSeek(100), a: [btn('NORMAL OPERATION (TCS)', () => A.tcs('normal'), () => TC().step >= 7), step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil A / D ▲ +5 %', ['A', 'D'], 5), oilStep('Oil A / D ▼ −5 %', ['A', 'D'], -5), oilStep('Oil B / C ▲ +5 %', ['B', 'C'], 5), oilStep('Oil B / C ▼ −5 %', ['B', 'C'], -5)], wait: 1 },
      /* ---- 8 coal at 45 MW (PR-OPE-5002 solid fuel firing) ---- */
      { st: 8, sec: 44, t: 'Bed ≥ 650 °C: feeder C, then FICCL1061C in AUTO', d: 'The third feeder, once the bed is hot enough.', seek: coalSeek(100), c: b.ALL(b.VAL('Tb', 650, null), b.BIT('M.3402', 1, 'feeder C running'), b.MODE('FICCL1061C', 'AUTO')), fps: ['FICCL1061C'], a: [fDis('C'), WLm('M.3402', 'feeder C', () => (A.motor('M.3402', 1), A.motor('M.3405', 1))), btn('FICCL1061C A', () => { const q = pv('FIC-CF'); if (bit('M.3402') > 0.5 && md('FICCL1061C') !== 'AUTO' && md('FIC-CF') === 'MAN' && isFinite(q) && mv('FIC-CF') > q) A.man('FIC-CF', q); A.loc('FICCL1061C'); })] },
      { st: 8, sec: 44, t: 'Main steam pressure 123 kg/cm² at 45 MW', seek: coalSeek(123), d: 'Coal is now the main fuel; the oil burners stay at 20 % up to about 60 % load (FHI Fig. 2). Raise the coal (FIC-CF ▲ / ▼) to 123 kg/cm² (the PIC-COBM SV in CCS); watch the bed (> 700 °C).', c: b.HOLD(120, b.ALL(b.VAL('MW', 44, null), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), fps: ['FIC-CF'], a: [step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1), oilStep('Oil (all) ▼ −5 %', ['A', 'B', 'C', 'D'], -5)], w: COAL, wait: 1 },
      /* boiler model thread 2026-11-11 (automatic run): after 'Main steam pressure 123 kg/cm2 at 45 MW' the run waited for ever at
         'Boiler master HIC-BM in AUTO' (steam flow 149 T/H, needs > 230, M.2013 steam flow < 220 T/H BU-CMD, ABC-001C): no step took the
         load above 45 MW. PR-OPE-5002 load up (SU 9334-9419): NORMAL OPERATION at 45 MW, then raise toward 90 MW; SU 10617-10692: at
         230 T/H main steam flow (about 75 MW, plant-study 01-operation.md phase 11) boiler master AUTO (boiler follow), PAF / SAF and the
         coal master REMOTE. LOAD UP on the TCS at its rateUp (7.5 MW/min, PR-OPE-5002 LOAD UP 5 %/min). Run 2026-11-11 c: at 75 MW the
         steam settled at 225 T/H, under the 230 T/H of the SOP, so the Do it raises the TCS target 5 MW more (one press
         each 300 s, the pace of the Do it, not a plant value) while the steam is under 230 T/H or M.0101 = 0, up to the 90 MW of the SOP; held 120 s.
         M.0101 is read on ABC-001C (STATION 101 "BOILER MAIN STEAM FLOW > 220 T/H"): the memory addresses are per station, and
         bit('M.0101') read ABC-017 (STATION 102 M.0101 = SB INLET PRESSURE CONTROL FORCE MANUAL, memory list), 0, so this step and
         'O2 control AICFG112 in AUTO' waited for ever at 264 T/H */
      { st: 8, sec: 44, t: 'LOAD UP (TCS) until the main steam flow is ≥ 230 T/H (about 75 MW)', d: 'PR-OPE-5002: after NORMAL OPERATION at 45 MW raise the load toward 90 MW. At 230 T/H main steam flow (about 75 MW) the boiler master goes to AUTO (boiler follow) and the PA / SA air and the coal master to REMOTE. Raise the coal with the load (FIC-CF ▲) to hold about 123 kg/cm².', c: b.HOLD(120, b.ALL(b.VAL('MSF', 230, null), C('Steam flow > 220 T/H (ABC-001C M.0101)', () => m0101() > 0.5, () => 'M.0101 = ' + f0(m0101())))), fps: ['FIC-CF'], slow: loadSlow, seek: () => { coalSeek(123)(); const tb = U().tb; if (tb && tb.st === 'load' && (h().MSF() < 230 || m0101() < 0.5) && Math.abs((+tb.tgt || 0) - (+tb.aim || 0)) < 0.5 && (+tb.aim || 0) >= 75 && (+tb.aim || 0) < 90 && h().MSP() > 118 && simT() - (paceT.lu || -1e9) >= 300) { paceT.lu = simT(); A.tcs('loadup', Math.min(90, (+tb.aim || 0) + 5)); } }, a: [btn('LOAD UP 75 MW (TCS)', () => A.tcs('loadup', 75), () => !!(U().tb && U().tb.aim >= 75)), step('FIC-CF ▲ +1 %', 'FIC-CF', 1), step('FIC-CF ▼ −1 %', 'FIC-CF', -1)], wait: 1 },
      /* ---- 9 load up ---- */
      {
        st: 9,
        sec: 44,
        t: 'Prepare the combustion control: HS-COAL 33.1 %, O₂ trim 50 %, PA bias 0, FIC-CF A',
        d: 'Coal calorie correction 4150 kcal/kg = 33.1 %. The O₂ trim and PA bias are neutral before the air goes to REMOTE. FIC-CF goes to A at its PV (no bump).',
        c: b.ALL(b.MV('HS-COAL', 32, 34), b.MODE('FIC-CF', 'AUTO')),
        fps: ['HS-COAL', 'FIC-CF'],
        a: [btn('Prepare all', () => {
          A.man('HS-COAL', 33.1);
          A.val('HIC-TADBS', 0);
          A.auto('FIC-CF', pv('FIC-CF'));
          return '';
        })]
      },
      { st: 9, sec: 44, t: 'PA and SA air flow in REMOTE (FICFA1071, FICFA1081)', d: 'The air now follows the air demand of the drawing.', c: b.ALL(b.MODE('FICFA1071', 'REM'), b.MODE('FICFA1081', 'REM')), fps: ['FICFA1071', 'FICFA1081'], a: [btn('PA and SA R', () => (A.rem('FICFA1071'), A.rem('FICFA1081')))] },
      { st: 9, sec: 44, t: 'FIC-CF in REMOTE', d: 'The coal feeder demand now comes from the coal master.', c: b.MODE('FIC-CF', 'REM'), fps: ['FIC-CF'], a: [btn('FIC-CF R', () => A.rem('FIC-CF'))] },
      {
        st: 9,
        sec: 44,
        t: 'Coal master FIC-CM in REMOTE',
        d: 'The drawing allows it when M.0130 = 0 (FIC-CF, PA, SA in REMOTE). Press R when the fuel demand (SI0141) ≈ the coal now.',
        c: b.MODE('FIC-CM', 'REM'),
        fps: ['FIC-CM'],
        ready: () => bit('M.0130') < 0.5 && Math.abs(h().val('ABC-004A', 'SI0141') - pv('FIC-CM')) < 1.5,
        readyTxt: () => 'Wait: M.0130 = ' + f0(bit('M.0130')) + ', fuel demand ' + f1(h().val('ABC-004A', 'SI0141')) + ' ≈ coal ' + f1(pv('FIC-CM')) + ' T/H',
        a: [btn('FIC-CM R', () => A.rem('FIC-CM'))]
      },
      {
        st: 9,
        sec: 44,
        id: 'bm',
        t: 'Boiler master HIC-BM in AUTO (boiler follow)',
        d: 'When steam flow is > 230 T/H and the back-up command is gone (M.2013 = 0): PIC-COBM A SV 123, HS-COAL R, then HIC-BM A. M.2013 is also 1 while the MS blow-off PICMS1002 (M.0255) or the HP bypass (M.0709) is open > 5 %: lower HIC-BM until the pressure falls below 128.',
        c: b.MODE('HIC-BM', 'AUTO'),
        fps: ['PIC-COBM', 'HIC-BM', 'PICMS1002'] /* OFF unless switched on: boiler follow by hand on HIC-BM (the faceplate) */,
        /* the wait gates the three buttons only (doIt returns on a false ready, so the seek would never lower HIC-BM: as beta.56 3-ELEMENT) */
        seek: coalSeek(123, 'HIC-BM'),
        readyTxt: () =>
          'Wait: steam flow ' + f0(h().MSF()) + ' T/H (> 230), M.2013 = ' + f0(bit('M.2013')) + ' (0)' + (h().bit('ABC-001C', 'M.0255') > 0.5 ? ': blow-off PICMS1002 open (M.0255 = 1, MSP ' + f1(h().MSP()) + ')' : '') + (bit('M.0709') > 0.5 ? ': HP bypass open (M.0709 = 1)' : ''),
        a: [btn('PIC-COBM A, SV 123', () => A.auto('PIC-COBM', 123)), btn('HS-COAL R', () => A.rem('HS-COAL')), btn('HIC-BM A', () => A.auto('HIC-BM'))].map(x => Object.assign(x, { on: () => !bmRdy(), hide: () => !bmRdy() }))
      },
      {
        st: 9,
        sec: 44,
        t: 'O₂ control AICFG112 in AUTO',
        d: 'Allowed when steam flow is > 220 T/H (M.0101) and PV ≈ SV.',
        c: b.MODE('AICFG112', 'AUTO'),
        fps: ['AICFG112'],
        ready: () => m0101() > 0.5,
        readyTxt: () => 'Wait: steam flow > 220 T/H (M.0101 = ' + f0(m0101()) + ')',
        a: [btn('AICFG112 A', () => {
          const H = h(),
            S2 = H.sh('ABC-002'),
            c = H.ctl('ABC-002', 'AICFG112'),
            q = S2.rt.st[c.amt.id];
          q.al = c.autoLeg;
          q.fm = c.autoLeg;
          for (const [S3, n] of AN.modeNets('AICFG112')) S3.rt.ext[n] = 0;
          return '';
        })]
      },
      /* boiler model thread 2026-11-11 (automatic run): EIC-TM went to AUTO (CCS) at 80 MW, the load ramped to 133 MW and the main steam
         fell to 62 kg/cm2 (HIC-BM back to MANUAL). PR-OPE-5002 load up (SU 9334-9419): "raise to 90 MW per boiler; above 90 MW CCS can
         be set"; boiler master AUTO (boiler follow) until 90 MW (SU 10617-10692, 01-operation.md phase 11 / 12) */
      { st: 9, sec: 44, req: ['bm'], t: 'LOAD UP to 90 MW (TCS) in boiler follow', d: 'PR-OPE-5002: the boiler master in AUTO holds the pressure (PIC-COBM) while you raise the load to 90 MW: with DCS CONTROL MODE ON (I.0082) the TCS follows the turbine master, so raise EIC-TM in MANUAL (MW); without it, LOAD UP on the TCS. The coordinated control (CCS) is set above 90 MW.', c: b.HOLD(120, b.ALL(b.VAL('MW', 89, null), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), slow: loadSlow,
        /* one press of 5 MW each 60 s of the plant while the main steam is above 118 (the band of the 150 MW hold): the pace of the Do it, under the 7.5 MW/min LOAD UP rate */
        seek: () => { if (h().MW() >= 89 || h().MSP() < 118 || simT() - (paceT.l9 || -1e9) < 60) return; paceT.l9 = simT(); if (bit('I.0082') > 0.5) { const m = mv('EIC-TM'); if (md('EIC-TM') === 'MAN' && isFinite(m)) A.man('EIC-TM', Math.min(90, m + 5)); } else A.tcs('loadup', 90); },
        a: [step('EIC-TM ▲ +5 MW', 'EIC-TM', 5), btn('LOAD UP 90 MW (TCS, DCS control mode OFF)', () => A.tcs('loadup', 90), () => bit('I.0082') > 0.5 || !!(U().tb && U().tb.aim >= 90))], wait: 1 },
      {
        st: 9,
        sec: 44,
        id: 'tm',
        req: ['bm'],
        t: 'Turbine master EIC-TM in AUTO (coordinated control, CCS)',
        d: 'DCS CONTROL MODE ON comes on by itself (I.0082). Press A when the AUTO value (SI0236) ≈ the TCS target, so there is no bump.',
        c: b.MODE('EIC-TM', 'AUTO'),
        fps: ['EIC-TM'],
        ready: () => bit('I.0082') > 0.5 && bit('M.2016') < 0.5 && Math.abs(h().val('ABC-001C', 'SI0236') - (+U().tcsT || 0)) < 1,
        readyTxt: () => 'Wait: DCS control mode I.0082 = ' + f0(bit('I.0082')) + ', SI0236 ' + f1(h().val('ABC-001C', 'SI0236')) + ' ≈ TCS target ' + f1(+U().tcsT),
        /* boiler model thread 2026-11-11 (automatic run): HIC-ULD starts in AUTO with the TARGET 150 of the 150 MW snapshot (hmi-op.js,
           33.PNG); with EIC-TM in AUTO at 90 MW the CCS ramped the load to 142 MW before the 'TARGET 150' step and the main steam fell to
           62 kg/cm2. The target is set to the load of the moment first (no bump), the 150 MW target is its own step below */
        a: [btn('HIC-ULD TARGET = load now', () => { const d = uldT(); if (!d) return 'no target'; d.S.rt.ext[d.a] = Math.round(h().MW()); return ''; }, () => { const d = uldT(); return !!d && Math.abs((+d.S.rt.ext[d.a] || 0) - h().MW()) < 2; }), btn('EIC-TM A', () => A.auto('EIC-TM'))]
      },
      /* roadmap 2 (PR-OPE-5002 8043 "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV"; 39.PNG at 150 MW:
         HICHR1002A / B A, TICHR1002A R, TICHR1002 A SV 541). ABC-020: the RH damper is forced MANUAL while the SH damper is MANUAL and under
         15 % MCR (M.0179), so the SH damper first. ABC-019: the RH spray is forced MANUAL while its shut-off valve is shut (M.0173, I.088F;
         DITL-35 opens it in AUTO MODE above saturation + 11 C after the ICV -> CV transfer). Without this step the reheat went to 593 C */
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Reheat temperature in AUTO: SH and RH biasing dampers A, TICHR1002A A (SV: LOGIC), RH spray TICHR1002 A SV 541',
        d: 'PR-OPE-5002: "Set biasing damper and RH to Remote-Auto when RHT-PV is almost equal to R-SV". The "Remote" of TICHR1002A is SV: LOGIC (SV from MW, LN6, with a bumpless ramp of 1 %/min). Do the SH damper (HICHR1002B) first: while it is MANUAL, the RH damper is forced MANUAL (ABC-020 M.0179, together with steam flow < 15 % MCR). The RH spray allows AUTO once its shut-off valve is open (DITL-35).',
        c: b.ALL(b.MODE('HICHR1002B', 'AUTO'), b.MODE('HICHR1002A', 'AUTO'), C('TICHR1002A AUTO, SV: LOGIC (LN6, MW → reheat SV)', () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A'), () => md('TICHR1002A') + (svLogic('ABC-020', 'TICHR1002A') ? ', SV: LOGIC' : ', SV: OPERATOR')), b.MODE('TICHR1002', 'AUTO')),
        fps: ['HICHR1002B', 'HICHR1002A', 'TICHR1002A', 'TICHR1002'],
        /* boiler model thread 2026-11-11 (automatic run at 90 MW): the step waited for ever on 'RH spray shut-off valve closed': no button
           opened it. DITL-35 (REHEATER INLET DESUPERHEATER SPRAY WATER SHUT OFF VALVE): OPEN P.B. M.0640 (row 1) or AUTO MODE M.0642 (opens
           above saturation + 11 C, ABC-019), after the ICV -> CV transfer I.0418, not in MFT. The Do it presses OPEN P.B. on the drawing. The valve wait now gates the TICHR1002 button only */
        ready: () => bit('I.0418') > 0.5 && h().MSF() >= 69,
        readyTxt: () => 'Wait: ICV → CV transfer I.0418 = ' + f0(bit('I.0418')) + ', steam ' + f0(h().MSF()) + ' T/H (≥ 69), RH spray shut-off valve ' + (h().bit('ABC-019', 'I.088F') > 0.5 ? 'closed' : 'open'),
        a: [
          btn('SH damper HICHR1002B A', () => A.auto('HICHR1002B'), () => md('HICHR1002B') === 'AUTO'),
          btn('RH damper HICHR1002A A', () => A.auto('HICHR1002A'), () => md('HICHR1002A') === 'AUTO'),
          btn('TICHR1002A A, SV: LOGIC', () => A.rem('TICHR1002A'), () => md('TICHR1002A') === 'AUTO' && svLogic('ABC-020', 'TICHR1002A')),
          btn('RH spray shut-off valve OPEN P.B. (DITL-35 row 1, M.0640)', () => (WL() ? (dPress('DITL-35', 0), '') : ''), () => !WL() || !(h().bit('ABC-019', 'I.088F') > 0.5)),
          Object.assign(btn('TICHR1002 A, SV 541', () => A.auto('TICHR1002', 541), () => md('TICHR1002') === 'AUTO'), { hide: () => h().bit('ABC-019', 'I.088F') > 0.5 })
        ]
      },
      /* 3.2.3-beta.78 (CHAEWON, automatic run with the boiler able to make full steam: 150 MW reached, but the Hold 150 MW step stood at main
         steam 600 C): no step put the SH spray in AUTO, so the spray stayed MANUAL at 0 % from the roll. PR-OPE-5002 SU 7991-8050 (plant-study
         01-operation.md 8.4): "MS desuperheater above 46 T/H ... MS desup AUTO". DITL-32 / 33 (and #B): the spray water shut-off valves open in
         AUTO MODE (row 4, M.1012 / M.1022) above 380 / 440 C and steam flow > 10 % MCR (46 T/H); while a SOV is closed (I.0011 / I.0013 / 0091 /
         0093) ABC-011 / 012 hold the spray MANUAL (BU-CMD). Modes and SVs of the HMI snapshot (OPERATING_POINTS.md: #1 outer TICBR1140 A SV 462,
         #1 spray TICBR1130 R, main steam TICMS1004 A SV 541 = FHI design SH outlet 541 C, #2 spray TICBR1150 R); also the X2 list of the Live
         check (live.js: SH spray TICBR1130 / TICBR1150 in AUTO by 120 MW). Probe at 150 MW: MST 600 -> 541 C in under 30 s of plant */
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Main steam temperature in AUTO: spray shut-off valves AUTO MODE, TICBR1140 A, TICBR1130 R, TICMS1004 A SV 541, TICBR1150 R',
        d: 'PR-OPE-5002: put the MS desuperheater in AUTO once the steam flow is above 46 T/H. First the spray water shut-off valves in AUTO MODE (DITL-32 / 33: they open above 380 / 440 °C); while a valve is closed the spray is held MANUAL. Then the outer controllers in AUTO (#1 TICBR1140 SV 462, main steam TICMS1004 SV 541) and the sprays in REMOTE (cascade).',
        c: b.ALL(b.MODE('TICBR1140', 'AUTO'), b.MODE('TICBR1130', 'REM'), b.MODE('TICMS1004', 'AUTO'), b.MODE('TICBR1150', 'REM')),
        fps: ['TICBR1140', 'TICBR1130', 'TICMS1004', 'TICBR1150'],
        ready: () => h().MSF() > 46,
        readyTxt: () => 'Wait: steam flow ' + f0(h().MSF()) + ' T/H (> 46)',
        a: [
          btn('Spray shut-off valves AUTO MODE (DITL-32 / 33 row 4)', () => (WL() ? (['DITL-32', 'DITL-33', 'DITL-32 #B', 'DITL-33 #B'].forEach(n => window.LS_DOCK && LS_DOCK.dset && LS_DOCK.dset(n, 4, 1)), '') : ''), () => !WL() || !['I.0011', 'I.0091'].some(a => h().bit('ABC-011', a) > 0.5) && !['I.0013', 'I.0093'].some(a => h().bit('ABC-012', a) > 0.5)),
          btn('TICBR1140 A, SV 462', () => A.auto('TICBR1140', 462), () => md('TICBR1140') === 'AUTO'),
          btn('TICBR1130 R', () => A.rem('TICBR1130'), () => md('TICBR1130') === 'REM'),
          btn('TICMS1004 A, SV 541', () => A.auto('TICMS1004', 541), () => md('TICMS1004') === 'AUTO'),
          btn('TICBR1150 R', () => A.rem('TICBR1150'), () => md('TICBR1150') === 'REM')
        ]
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Unit load demand HIC-ULD in AUTO, TARGET 150 MW',
        d: 'First the load change rate HIC-MWRL 0.67 MW/min (FHI Fig. 2 COLD STARTUP: 60 % at 11.0 h to 100 % at 12.5 h = 60 MW in 1.5 h), then the TARGET 150 MW: the CCS raises the load at that rate.',
        c: b.ALL(b.MODE('HIC-ULD', 'AUTO'), b.VAL('MW', 90, null), C('HIC-MWRL 0.67 MW/min', () => Math.abs((+mv('HIC-MWRL') || 0) - 0.67) < 0.05, () => f1(+mv('HIC-MWRL'))), C('TARGET 150 MW', () => { const d = uldT(); return !!d && +d.S.rt.ext[d.a] >= 149; }, () => { const d = uldT(); return d ? f0(+d.S.rt.ext[d.a]) : '—'; })),
        fps: ['HIC-ULD', 'HIC-MWRL'],
        /* boiler model thread 2026-11-11 (automatic run): with the 3 MW/min of the 150 MW snapshot (33.PNG HIC-MWRL) the load went 90 -> 144 MW,
           the coal hit the feeder MV limit 83.3 % (FIC-CM forced MANUAL, M.0137) and the main steam fell 126 -> 62 kg/cm2. FHI P2 S7 Fig 2
           (plant-study 02-fhi-curves.md): 60 % load at 11.0 h, 90 % at 12.0 h, 100 % at 12.5 h: CALC (150 - 90) MW / 90 min = 0.67 MW/min */
        a: [btn('HIC-MWRL 0.67 MW/min', () => A.man('HIC-MWRL', 0.67), () => Math.abs((+mv('HIC-MWRL') || 0) - 0.67) < 0.05), btn('HIC-ULD A, TARGET 150', () => {
          A.loc('HIC-ULD');
          const s = station('HIC-ULD'),
            d = s && (s.T.drv[s.b.i[s.b.svI]] || []).find(z => z.k === 'AMT');
          if (d) s.T.rt.ext[d.a] = 150;
          return '';
        })]
      },
      {
        st: 9,
        req: ['bm', 'tm'],
        sec: 44,
        t: 'Load ≥ 90 MW, bed > 700 °C and PA flow ≥ 220 T/H: take the burners out one by one (A, D, B, C)',
        d: 'FHI Fig. 2: the start-up burners are taken out at about 60 % load; PR-OPE-5002: start at furnace > 700 °C, finish at > 750 °C. When the coal can carry the load, close the oil valve and stop the burner, a few minutes apart. Before the last burner is stopped, the PA flow must be above 200 T/H: on coal only, the boiler trips on PRIMARY AIR FLOW L.L. (ABC-007, DITL-03F). Procedure target: 280 T/H.',
        /* PR-OPE-5002 (Solid firing): "CONTINUE to remove Oil Burner until Lower Furnace temperature is > 750 C": done with the bed at 750 */
        c: b.ALL(b.NOBIT(['M.3412', 'M.3413', 'M.3418', 'M.3419'], 'start-up burners out'), b.VAL('Tb', 750, null), C('PA flow ≥ 220 T/H (FIFA1071)', () => pv('FICFA1071') >= 220, () => (pv('FICFA1071') || 0).toFixed(0) + ' T/H')),
        ready: () => pv('FICFA1071') >= 220 && h().MW() >= 90,
        readyTxt: () => 'Wait: load ' + f0(h().MW()) + ' MW (≥ 90), PA ' + f0(pv('FICFA1071')) + ' T/H (≥ 220)',
        get a() {
          return WL()
            ? [bOff('A'), bOff('D'), bOff('B'), bOff('C')]
            : [
                btn('Stop burner A', () => (A.oil('M.3410', false), A.motor('M.3412', 0)), () => bit('M.3412') < 0.5),
                btn('Stop burner D', () => (A.oil('M.3417', false), A.motor('M.3419', 0)), () => bit('M.3419') < 0.5),
                btn('Stop burner B', () => (A.oil('M.3411', false), A.motor('M.3413', 0)), () => bit('M.3413') < 0.5),
                btn('Stop burner C', () => (A.oil('M.3416', false), A.motor('M.3418', 0)), () => bit('M.3418') < 0.5)
              ];
        },
        retract: 1
      },
      {
        st: 9,
        sec: 44,
        req: ['bm', 'tm'],
        t: 'Furnace pressure PICFG108 in AUTO, SV −15',
        d: 'Allowed when MV ≥ 16 % and the force manual is gone (M.0205 = 0).',
        c: b.MODE('PICFG108', 'AUTO'),
        fps: ['PICFG108'],
        /* 3.2.0-beta.23: M.0205 read on ABC-008, the sheet that computes it (a linked copy on a sheet that is not stepping kept 1 and the
           step never opened with the one world OFF) */
        ready: () => mv('PICFG108') >= 16 && !(h().bit('ABC-008', 'M.0205') > 0.5),
        readyTxt: () => 'Wait: PICFG108 MV ' + f0(mv('PICFG108')) + ' % (≥ 16), M.0205 = ' + f0(h().bit('ABC-008', 'M.0205') > 0.5 ? 1 : 0),
        a: [btn('PICFG108 A, SV −15', () => A.auto('PICFG108', -15))]
      },
      { st: 9, sec: 44, req: ['bm', 'tm'], t: 'Hold 150 MW: MSP 118 ~ 128, MST ≤ 545 °C, drum level ±150 mm, O₂ 3 ~ 6 %', d: 'Start-up complete. The CCS is now in control.', c: b.X2[9][1], wait: 1 },
      /* ---- 10 practice ---- */
      { st: 10, sec: 47, t: 'Practice: lower HIC-ULD to 120 MW (▼▼)', d: 'In AUTO you move only the target MW. The CCS reduces the coal and the air.', c: b.OUT('HIC-ULD', null, 121, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Watch: 120 MW, coal about 72 T/H, MSP held', d: 'MW falls by 3 MW per minute and PIC-COBM holds 123 kg/cm².', c: b.HOLD(120, b.ALL(b.VAL('MW', 117, 123), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150))), wait: 1 },
      { st: 10, sec: 47, t: 'Return HIC-ULD to 150 MW (▲▲)', d: 'Raise the target again.', c: b.OUT('HIC-ULD', 149, null, 'MW'), fps: ['HIC-ULD'] },
      { st: 10, sec: 47, t: 'Hold 150 MW', d: 'MSP 118 ~ 128, drum level ±150 mm, O₂ 3 ~ 6 %.', c: b.HOLD(300, b.ALL(b.VAL('MW', 147, 153), b.VAL('MSP', 118, 128), b.VAL('lvl', -150, 150), b.VAL('O2', 3, 6))), wait: 1 },
      /* ---- 11 normal shutdown (plan e4, PR-OPE-5003-01 steps 4.1 ~ 4.20; the checks are live.js X5) ---- */
      { st: 11, sec: 49, req: ['bm', 'tm'], t: 'Load change rate HIC-MWRL 1.2 MW/min', d: 'PR-OPE-5003: 150 to 90 MW at 1.2 MW per minute. The CCS stays in AUTO; you set only the rate and the target MW.', c: b.X5[0][1], fps: ['HIC-MWRL'] },
      { st: 11, sec: 49, req: ['bm', 'tm'], t: 'Lower HIC-ULD to 90 MW (▼)', d: 'The CCS lowers the coal and the air with the load.', c: b.X5[1][1], fps: ['HIC-ULD'] },
      { st: 11, sec: 49, req: ['bm', 'tm'], t: 'Hold 90 MW for 8 ~ 10 min', d: 'PR-OPE-5003: hold at 90 MW before going lower. Drum level ±150 mm.', c: b.X5[2][1], wait: 1 },
      { st: 11, sec: 49, req: ['bm', 'tm'], t: 'HIC-MWRL 0.6 MW/min, HIC-ULD toward 45 MW: the CCS lets go near 63 MW', d: 'PR-OPE-5003: 90 to 45 MW at 0.6 MW per minute. At 72 MW (or feedwater 230 T/H) press 1 ELEMENT for the drum level (ABC-010 M.054F; below 100 T/H steam for 60 s the drawing selects it by itself, M.022C). Near 63 MW the steam flow falls below 220 T/H: the back-up command M.2013 (ABC-001C) puts HIC-BM and EIC-TM in MANUAL by itself (CLAUDE.md BU-CMD); HIC-ULD then tracks the MW.', c: b.X5[3][1], fps: ['HIC-MWRL', 'HIC-ULD', 'HIC-BM'], a: [btn('Drum level 1 ELEMENT (ABC-010 M.054F)', () => A.push('M.054F'))] },
      { st: 11, sec: 49, t: 'By hand: EIC-TM to 45 MW, HIC-BM with it', d: 'You are the CCS now. Lower the turbine master EIC-TM about 0.6 MW per minute and the boiler master HIC-BM with it so the main steam pressure stays 115 ~ 131 kg/cm². Too fast on EIC-TM: the pressure rises; too fast on HIC-BM: it falls. At 60 MW: staging air upper 10 %, lower 15 ~ 20 %.', c: b.X5[4][1], fps: ['EIC-TM', 'HIC-BM'] },
      { st: 11, sec: 49, t: 'Bed 750 °C: PA and SA air to MANUAL', d: 'PR-OPE-5003: at a bed of 750 °C put the SA and PA fans in manual, stop the limestone and the sand, and run the air heater soot blower continuously. ABC-004A: with the PA or SA air flow control out of REMOTE the coal master FIC-CM goes MANUAL by itself (M.0130 force manual and tracking, also on any fuel flow signal abnormal or a feeder demand above 83.3 %): from here you set the coal by hand on FIC-CM.', c: b.X5[5][1], fps: ['FICFA1071', 'FICFA1081', 'FIC-CM'], a: [btn('FICFA1071 M', () => A.man('FICFA1071', mv('FICFA1071'))), btn('FICFA1081 M', () => A.man('FICFA1081', mv('FICFA1081')))] },
      {
        st: 11,
        sec: 49,
        t: 'Light the start-up burners one by one (A, D, B, C)',
        d: 'PR-OPE-5003: SA pressure above 1200 mmH₂O, then light the burners one at a time and move the fire from coal to diesel (2.5 T/H coal = 1 T/H diesel), up to 4 T/H oil per feeder. The coal master FIC-CM is MANUAL now: lower it as the oil comes in (about 2.5 T/H of coal less for each 1 T/H of oil) and keep the main steam pressure 115 ~ 131 kg/cm².',
        fps: ['FIC-CM'],
        c: b.X5[6][1],
        get a() {
          return WL() ? [bIgn('A'), bOn('A'), bIgn('D'), bOn('D'), bIgn('B'), bOn('B'), bIgn('C'), bOn('C'), step('FIC-CM ▼ −1 %', 'FIC-CM', -1), step('FIC-CM ▲ +1 %', 'FIC-CM', 1)] : [step('FIC-CM ▼ −1 %', 'FIC-CM', -1), step('FIC-CM ▲ +1 %', 'FIC-CM', 1)];
        }
      },
      { st: 11, sec: 49, t: 'Hold 45 MW with the burners in', d: 'PR-OPE-5003: hold at 45 MW. Drum level ±150 mm. Keep moving the coal from FIC-CM (MANUAL) to the oil; the bed falls toward 700 °C as the coal comes down.', fps: ['FIC-CM', 'HIC-BM'], a: [step('FIC-CM ▼ −1 %', 'FIC-CM', -1), step('FIC-CM ▲ +1 %', 'FIC-CM', 1)], c: b.X5[7][1], wait: 1 },
      { st: 11, sec: 49, need: 1, t: 'At 40 MW: extractions 3, 2, 1 out; deaerator PCVAS1030 2.5 kg/cm²', d: 'PR-OPE-5003: done at the TCS and in the field. Confirm when done.' },
      { st: 11, sec: 49, t: 'By hand: EIC-TM to 30 MW, HIC-BM with it', d: 'PR-OPE-5003: 45 to 30 MW at 0.4 MW per minute, the main steam pressure 115 ~ 131 kg/cm². Below 120 T/H of steam the drum level goes to the start-up level control (PR-OPE-5003): LICBR1001B on the start-up valve FCV-FW1130-2.', c: b.X5[9][1], fps: ['EIC-TM', 'HIC-BM', 'LICBR1001B'] },
      {
        st: 11,
        sec: 49,
        t: 'Bed 700 °C: stop the coal feeders',
        d: 'PR-OPE-5003: at a bed of 700 °C stop the coal feeders and lower the PA fan to about 20 %. The burners carry the boiler. If the bed stays above 700 °C, the coal is still too high: lower FIC-CM first.',
        c: b.X5[10][1],
        a: [step('FIC-CM ▼ −1 %', 'FIC-CM', -1), step('FIC-CM ▲ +1 %', 'FIC-CM', 1), btn('STOP feeder A', () => A.motor('M.3400', 0), () => bit('M.3400') < 0.5), btn('STOP feeder B', () => A.motor('M.3401', 0), () => bit('M.3401') < 0.5), btn('STOP feeder C', () => A.motor('M.3402', 0), () => bit('M.3402') < 0.5)]
      },
      {
        st: 11,
        sec: 49,
        t: '30 MW: turbine SHUT-DOWN (MFT follows)',
        d: 'PR-OPE-5003: take out extractions 5 and 4, then trip the turbine. ATS step 8 opens 52G and 41 and trips the turbine below 20 % load. On this unit the turbine trip makes an MFT (DITL drawing); the procedure then keeps the start-up burners and the bypass: that part waits for the bottle-up section.',
        c: b.X5[11][1],
        a: [btn('Turbine SHUT-DOWN (ATS step 8)', () => A.tcs('shutdown')), btn('Turbine trip (TA-1)', () => A.tcs('trip'))]
      },
      /* ---- 12 bottle-up (plan e4, PR-OPE-5004-01; the checks are live.js X6) ---- */
      { st: 12, sec: 50, need: 1, t: 'Steam lines isolated, drain pots open', d: 'PR-OPE-5004: close MV-MS1391, PCV-MS1001 (blow off), the HP bypass isolation and the auxiliary steam isolation; open the TG drain pots (upstream valve first); open hot reheat blow off MV-HR1391 to release the line, then close it. Field and TCS: confirm when done.' },
      /* Mina beta.136 bottle-up: the main feedwater valve LICBR1001 stayed AUTO (1 element, MV 23.8 % at +367 mm, falling 0.3 %/s): the
         feedwater ran 330 -> 150 T/H for 2 min after the start-up valve was shut and the drum went to +437 mm. PR-OPE-5004 fills on the
         start-up feedwater valve only: the main valve to MANUAL 0 % first */
      { st: 12, sec: 50, t: 'Fill the drum to +200 mm on the start-up valve', d: 'PR-OPE-5004: steam drum +200 mm (it shrinks as it cools), deaerator 0 mm. Use the start-up feedwater valve only: on the LICBR1001 faceplate below press M and set 0 % first (in AUTO it keeps feeding for minutes), then fill with LICBR1001B and at +200 mm set it to M 0 %. Watch the feedwater flow (FICFW1007) fall to 0.', c: b.X6[1][1], fps: ['LICBR1001', 'LICBR1001B', 'FICFW1007'], a: [btn('LICBR1001 M 0 % (main valve shut)', () => A.man('LICBR1001', 0)), btn('LICBR1001B M 0 % (at +200 mm)', () => A.man('LICBR1001B', 0))] },
      { st: 12, sec: 50, t: 'Stop the boiler feed pump', d: 'PR-OPE-5003: the drum blowdown valve must be closed before the BFP stop (else the drum keeps losing about 25 T/H and the level falls about 25 mm per minute). PR-OPE-5004: close the outlet MOV of the BFP in service (MV-FW1001 / MV-FW1002), then STOP it. Then stop the dosing pump, close LCV-CD1104 and stop the make-up water pump. With both feed pumps stopped the drum level controls are inhibited and go MANUAL by themselves (ABC-010 M.0220).', c: b.X6[2][1], a: [btn('Close the drum blowdown valve (field)', () => (AN.blowdown && AN.blowdown(false), '')), btn('STOP BFWP-A', () => A.motor('M.3343', 0), () => bit('M.3343') < 0.5), btn('STOP BFWP-B', () => A.motor('M.3344', 0), () => bit('M.3344') < 0.5)] },
      { st: 12, sec: 50, t: 'Start-up burners out', d: 'PR-OPE-5004: oil FCV 25 %, OFF, igniter and oil gun retracted. On this unit the turbine trip made an MFT, so the burners are already out: check it.', c: b.X6[3][1] },
      { st: 12, sec: 50, need: 1, t: 'Diesel system released, reheat header drains open', d: 'PR-OPE-5004: PCV-DO0002 and PCV-DO1009 to MANUAL, open PCV-DO0002, PCV-DO1009 and FCV-DO1012 to 100 %, stop the diesel pump; open the cold and hot reheat header drains when the pressure is near 0 kg/cm². Confirm when done.' },
      { st: 12, sec: 50, t: 'RH and SH biasing dampers 100 %', d: 'PR-OPE-5004: before the draft is stopped.', c: b.X6[5][1], fps: ['HICHR1002A', 'HICHR1002B'], a: [btn('HICHR1002A M 100 %', () => A.man('HICHR1002A', 100)), btn('HICHR1002B M 100 %', () => A.man('HICHR1002B', 100))] },
      { st: 12, sec: 50, t: 'PA fan and FA blowers: dampers down, STOP', d: 'PR-OPE-5004: SAF inlet damper to 20 % (5 % steps), PAF inlet damper to 0 % (1 % steps), keep the furnace pressure at about −15 mmH₂O; then stop the PA fan and the FA blowers. First put the standby FA blower (FAB-B, AUTO standby) in MANUAL: in AUTO the logic starts it as soon as FAB-A stops (DITL-28A). The ID fan coupling PICFG108 stays in AUTO only down to its 20 % low limit: put it in MANUAL and lower it with each damper step, or the furnace goes to −130 mmH₂O. Below 14 % the coupling goes MANUAL by itself (ABC-008 M.0206), and with the furnace pressure control in MANUAL the PA and SA air flow controls are forced MANUAL too (ABC-007 M.0188).', c: b.X6[6][1], fps: ['FICFA1071', 'FICFA1081', 'PICFG108'], a: [btn('FA blowers A and B to MANUAL (DITL-28A)', () => fabMan()), btn('PICFG108 M', () => A.man('PICFG108', mv('PICFG108'))), step('PICFG108 ▼ −1 %', 'PICFG108', -1), btn('STOP PAF', () => A.motor('M.3302', 0), () => bit('M.3302') < 0.5), btn('STOP FAB-A', () => A.motor('M.3308', 0), () => bit('M.3308') < 0.5), btn('STOP FAB-B', () => A.motor('M.3309', 0), () => bit('M.3309') < 0.5)] },
      { st: 12, sec: 50, t: 'SA fan: damper down, STOP', d: 'PR-OPE-5004: SAF inlet damper down in 5 % steps, furnace pressure −15 mmH₂O, then stop the SA fan. Lower the ID fan coupling PICFG108 (MANUAL) with it, or the furnace goes to −180 mmH₂O.', c: b.X6[7][1], fps: ['FICFA1081', 'PICFG108'], a: [step('PICFG108 ▼ −1 %', 'PICFG108', -1), btn('STOP SAF', () => A.motor('M.3303', 0), () => bit('M.3303') < 0.5)] },
      { st: 12, sec: 50, t: 'ID fan: coupling to 0 %, STOP', d: 'PR-OPE-5004: below 16 % the coupling goes to MANUAL by itself. Lower it 1 % at a time to 0 % (furnace −15 mmH₂O), then stop the ID fan.', c: b.X6[8][1], fps: ['PICFG108'], a: [step('PICFG108 ▼ −1 %', 'PICFG108', -1), btn('STOP IDF', () => A.motor('M.3304', 0), () => bit('M.3304') < 0.5)] },
      { st: 12, sec: 50, t: 'Furnace pressure on the damper: −20 ~ +20 mmH₂O', d: 'PR-OPE-5004: change the furnace pressure control to DAMPER CONTROL, damper 5 %, then about 2.5 % until the furnace is −20 ~ +20 mmH₂O. The boiler is bottled up.', c: b.X6[9][1], fps: ['PICFG108A'], a: [btn('DAMPER CONTROL select (ABC-008 M.0201)', () => A.push('M.0201')), btn('PICFG108A M 5 %', () => A.man('PICFG108A', 5)), btn('PICFG108A M 2.5 %', () => A.man('PICFG108A', 2.5))] },
      /* ---- 13 turbine trip at load and hot restart (plan e5, FHI Tab 9 p20 ~ 25; the checks are live.js X7) ---- */
      { st: 13, sec: 51, t: 'Turbine trip at 150 MW', d: 'Press TURBINE TRIP (page 13 or here). FHI Tab 9: when the turbine stops, all fuel stops by itself; on this unit the DITL turbine trip makes the MFT.', c: b.X7[0][1], a: [btn('TURBINE TRIP (TA-1)', () => A.tcs('trip'))] },
      { st: 13, sec: 51, need: 1, cr: 1, t: 'Read the first outs; bypass protects the reheater', d: 'Page 13: the turbine trip first out; the MFT first out on the purge and trip page. FHI Tab 9 p25: the HP / LP bypass opens to keep steam through the reheater. If the bypass is not open and the cyclone exit is above 535 °C, the PA fan stops by itself and the RH biasing damper closes (p20). Confirm when read.' },
      { st: 13, sec: 51, t: 'Hotwell and drum: make-up 100 %, deaerator valve 12 % then about 6 %', d: 'After the trip the blow-off is open to the air and the condensate pumps keep filling the deaerator, so the hotwell empties in about 6 min and the condensate pumps stop at -300 mm. Make-up LICCD1110A MANUAL 100 %; deaerator level LICCD1104 MANUAL: while the feedwater is still high, up to 12 % (about 200 T/H) so the deaerator stays above -500 mm (it gives the feedwater); once the feedwater is under about 100 T/H, about 6 % (36 T/H, the valve sheet), under the make-up flow (58 T/H), so the hotwell holds; match it to the feedwater flow so the deaerator does not fill up; 0 % when the feedwater stops; blow-off PICMS1002 MANUAL 0 % when the main steam flow is under 220 T/H. The feedwater runs about 1 min behind the steam, so the drum rises: FICFW1007 MANUAL, lower it with the steam flow, drum under +200 mm; once the steam is under 100 T/H lower it in 5 % steps (▼▼): 1 % steps leave the feedwater about 60 T/H above the steam and the drum reaches +200 mm. Keep the hotwell above -150 mm. Be quick: the hot restart needs the bed above 700 °C, about 5 min after the trip. Before NEXT, bring the feedwater flow near the steam flow (211 T/H feedwater with the steam falling 152 > 40 T/H took the drum to +223 mm).', c: b.X7[2][1], fps: ['FICFW1007', 'LICBR1001A', 'LICCD1110A', 'LICCD1104'], /* e5 (boiler model thread, Jennie OK 2026-11-11): the operator actions of the text as buttons; press the feedwater one again as the steam falls */ a: [btn('Make-up LICCD1110A MANUAL 100 %', () => A.man('LICCD1110A', 100), () => md('LICCD1110A') === 'MAN' && mv('LICCD1110A') >= 95), Object.assign(btn('Deaerator LICCD1104 MANUAL: 12 % (feedwater over 100 T/H), 6 % (under), 0 % (no feedwater)', () => { const f = pv('FICFW1007'); A.man('LICCD1104', !(f > 5) ? 0 : f > 100 ? 12 : 6); }), { keep: 1 }), btn('Blow-off PICMS1002 MANUAL 0 % (main steam under 220 T/H)', () => (h().MSF() < 220 ? A.man('PICMS1002', 0) : ''), () => md('PICMS1002') === 'MAN' && mv('PICMS1002') <= 0.5), btn('Feedwater FICFW1007 MANUAL, MV −5 % (drum rising)', () => { const m = mv('FICFW1007'); A.man('FICFW1007', isFinite(m) ? Math.max(0, m - 5) : 0); })], nox: 1 /* beta.20 B19-3: starts at x1; Mina beta.15 B15-4: the same faceplates on steps 140 ~ 144, kept between the steps */ },
      { st: 13, sec: 51, t: 'Keep the fans running, drum level in sight', d: 'FHI Tab 9 p21: keep the ID fan, SA fan, PA fan and FA blowers running to remove the volatiles and burn the fuel left in the bed (O2 rises, the bed falls). The drum level shrinks after the trip: keep it in sight, -200 ~ +200 mm. Feedwater FICFW1007 in MANUAL: lower its MV by 5 % each time the steam flow falls, so the feedwater flow stays near the steam flow (over it the drum rises, under it the drum falls). With the steam flow near 0 the drum level loop LICBR1001A (low load) drives the feedwater valve: the FICFW1007 MV follows the LICBR1001A MV and its ▲ ▼ do nothing; hold the drum with LICBR1001A (AUTO SV 0 mm, or MANUAL) (ABC-010 M.0226). When the feedwater flow is 0, the deaerator LICCD1104 MV to 0 % too (at 9.5 % with no feedwater the condensate drained the hotwell to -259 mm into the deaerator).', c: b.X7[3][1], fps: ['FICFW1007', 'LICBR1001A', 'LICCD1110A', 'LICCD1104'], a: [btn('Feedwater FICFW1007 MANUAL, MV −5 % (drum rising)', () => { const m = mv('FICFW1007'); A.man('FICFW1007', isFinite(m) ? Math.max(0, m - 5) : 0); }), btn('Drum level LICBR1001A AUTO SV 0 mm (steam flow near 0)', () => A.auto('LICBR1001A', 0), () => md('LICBR1001A') === 'AUTO')], nox: 1 /* Mina beta.13 #a / beta.14 B14-2: no auto x10 in the drum and hotwell transient after the trip (the operator holds the loops by hand); B14-1: the make-up and deaerator faceplates stay */ },
      { st: 13, sec: 51, slow: () => h().lvl() > 0 /* Jennie 2026-11-11: x10 while the drum is above 0, time before HH */, t: 'Restart: MFT reset (bed above 700 °C: purge by-pass; below: 5 min purge)', d: 'FHI Tab 9 p22: a hot restart is when the bed at the start-up burner elevation is above the purge bypass permit, 700 °C (DITL-02 row 25, M.3339). Press FURNACE PURGE START: with M.3339 = 1 the purge completes at once (DITL-02 out 16, no 5 min count) and the MFT resets. Below 700 °C the same press runs the full 5 min purge (DITL-02), then the MFT resets; first the purge permissives of the Purge and trip page: limestone rotofeeder stopped, reheater biasing damper ≥ 30 % (superheater ≥ 60 %), burner air dampers A ~ D at the purge position 25 %. Do it soon: with the fans running the bed cools fast.', c: b.X7[4][1], fps: ['FICFW1007', 'LICBR1001A', 'LICCD1110A', 'LICCD1104'], get a() {
          /* Mina beta.16 B16-1: the bed under 700 C, PURGE START did nothing (DITL-02 TR252 at 0 s, purge permissive M.050E = 0): the three
             permissives the purge page lists (DITL-01 row 13 MIR-M1311, ABC-020 M.0506 / 0507, ABC-003A ~ D M.3126 / 3127 / 3146 / 3147) get
             their buttons, shown when the bed is under 700 C; the purge button says why it does not start */
          const cold = x => Object.assign(x, { hide: () => bit('M.3339') > 0.5 && !dOut('DITL-02', 5) }); /* M.3339 FURNACE LOWER LAYER > 700 C (DITL-02 row 25): the purge by-pass the drawing reads */
          const BA = ['A', 'B', 'C', 'D'].map(L => BR[L][2]);
          return [
            cold(btn('Limestone rotofeeder STOP (DITL-LS110)', () => dPress('DITL-LS110', 8), () => dOut('DITL-LS110', 6) !== 1)),
            cold(btn('Biasing dampers: reheater HICHR1002A 30 %, superheater HICHR1002B 60 % (purge)', () => (A.man('HICHR1002A', Math.max(30, mv('HICHR1002A'))), A.man('HICHR1002B', Math.max(60, mv('HICHR1002B')))), () => mv('HICHR1002A') >= 30 && mv('HICHR1002B') >= 60)),
            cold(btn('Burner air dampers A ~ D 25 % (purge position)', () => BA.forEach(t => A.man(t, 25)), () => BA.every(t => mv(t) >= 23 && mv(t) <= 27))),
            btn('FURNACE PURGE START (DITL-02)', () => (!(bit('M.3339') > 0.5) && dOut('DITL-02', 9) !== 1 ? 'Purge not ready (DITL-02 out 10): see the Purge and trip page for the missing permissive' : dPress('DITL-02', 5)), () => dOut('DITL-03A', 12) === 0),
            ...hiW()
          ];
        } },
      /* Mina beta.19 B19-1: the burner buttons sat in the hidden Start stage of the feeder (its permissive needs a burner in service): the burners are their own step, as in the cold start (steps of section 4) */
      { st: 13, sec: 51, slow: () => h().lvl() > 0 /* Jennie 2026-11-11: x10 while the drum is above 0, time before HH */, t: 'Burners A and D (when the furnace lower layer is under 700 °C)', d: 'FHI Tab 9 p23: below 700 °C on the furnace lower layer (DCS average of the bed thermocouples TIFG1090, the value the purge by-pass reads; it is above the bed temperature of the plant view) the coal needs the start-up burners in service and the bed above 550 °C. As in the cold start: SA damper and oil FCV to ignition, BURNER ON (DITL-09), then the oil flow 60 %; burner A, then D. With the lower layer still above 700 °C this step is done at once.', c: b.X7[5][1], fps: ['FICDO1043A', 'FICDO1043D', 'FICFW1007', 'LICBR1001A'], get a() {
          return (WL() ? [bIgn('A'), bOn('A'), bOil('A', 60), bIgn('D'), bOn('D'), bOil('D', 60)] : [btn('BURNER A ON', () => A.motor('M.3412', 1), () => bit('M.3412') > 0.5), btn('BURNER D ON', () => A.motor('M.3419', 1), () => bit('M.3419') > 0.5)]).concat(hiW());
        } },
      { st: 13, sec: 51, slow: () => h().lvl() > 0 /* Jennie 2026-11-11: x10 while the drum is above 0, time before HH */, t: 'Start the coal feeders', d: 'FHI Tab 9 p23: start solid fuel when the bed is above 700 °C without the burners, or above 550 °C with the burners in service. Open the feeder discharge valve, then START the feeder. Then continue as in the cold start after coal is in.', c: b.X7[6][1], fps: ['FICFW1007', 'LICBR1001A', 'LICCD1110A', 'LICCD1104'], a: [fDis('A'), mot('M.3400', 'feeder A'), fDis('B'), mot('M.3401', 'feeder B'), ...hiW()] },
      { st: 13, sec: 51, t: 'Feedwater, deaerator and make-up back to AUTO, cycle steady', d: 'First the feedwater FICFW1007 back to AUTO (the drum level loop matches the feedwater to the steam; in MANUAL with no steam it fills the drum). With the steam flow under 100 T/H the logic holds FICFW1007 in MANUAL (ABC-010 force manual M.0228) and the low load drum level loop LICBR1001A drives the valve: then put LICBR1001A in AUTO instead. The deaerator LICCD1104 back to AUTO only when the hotwell is above 0 mm and the feedwater flows: in AUTO below its set point it opens and the condensate pumps draw the hotwell down faster than the make-up (58 T/H) fills it; if the hotwell falls under -150 mm, LICCD1104 back to MANUAL 0 ~ 6 %. Make-up LICCD1110A back to AUTO when the hotwell is near its set point (SV not below +100 mm, PR-OPE-5002). The step ticks after 2 min with the hotwell above -150 mm, the deaerator within 200 mm of its set point and the drum -200 ~ +200 mm. A condensate pump stays running; if it stopped on hotwell low-low, start it again here once the hotwell is above -150 mm.', c: b.X7[7][1], fps: ['FICFW1007', 'LICBR1001A', 'LICCD1110A', 'LICCD1104'], a: [mot('M.3350', 'CEP-A'), ...hiW(),
        /* sources (3.2.3, no ASSUMED): PR-OPE-5002 / 5003 / 5004 give no valve positions for a trip recovery (searched: deaerator,
           LCV-CD1104); 6 % = 36 T/H, control valve sheet p74 LCV-CD1104; 12 % = about 215 T/H on the valve line of plant.js anDaQ
           (6 % 36 T/H to 17.5 % 380 T/H, 03.png / 28.png): CALC, enough for a feedwater over 100 T/H; 0 % with no feedwater (the
           balance: nothing leaves the deaerator). The 100 T/H switch point is NO-SOURCE (a guide band of the Training) */
        Object.assign(btn('Deaerator LICCD1104 MANUAL: 12 % (feedwater over 100 T/H), 6 % (under), 0 % (no feedwater)', () => { const f = pv('FICFW1007'); A.man('LICCD1104', !(f > 5) ? 0 : f > 100 ? 12 : 6); }), { keep: 1 }),
        /* e5 (boiler model thread 2026-11-11): the automatic run stopped here with LICCD1104 / LICCD1110A in MANUAL and no button; the gates are the step text */
        btn('Drum level LICBR1001A AUTO SV 0 mm (feedwater held in MANUAL at low steam flow)', () => A.auto('LICBR1001A', 0), () => md('LICBR1001A') === 'AUTO'),
        btn('Deaerator LICCD1104 AUTO (hotwell above 0 mm and feedwater flowing)', () => (pv('LICCD1110A') > 0 && pv('FICFW1007') > 5 ? A.auto('LICCD1104') : 'Wait: hotwell above 0 mm and feedwater flowing'), () => md('LICCD1104') === 'AUTO'),
        btn('Make-up LICCD1110A AUTO (hotwell near its set point)', () => (pv('LICCD1110A') > 0 ? A.auto('LICCD1110A') : 'Wait: hotwell above 0 mm'), () => md('LICCD1110A') === 'AUTO')] /* Mina beta.23 B23-5: the check needs CEP A and the step had no control for it */ },
      /* ---- 14 BFWP A trip at 150 MW (e5 recovery, LISA; the checks are live.js X8; DITL-23A, alarm list LT-BR1001-2) ---- */
      { st: 14, sec: 52, t: 'Standby BFWP B in REMOTE and AUTO', d: 'DITL-23A (same drawing for BFWP B): the AUTO start of the standby needs REMOTE (row 24, field selector) and AUTO MODE SELECTED (row 18, CRT). 03.png: BFWP-B is the standby at 150 MW.', c: b.X8[0][1], a: [btn('FIELD: BFWP B to REMOTE', () => (window.LS_DOCK && LS_DOCK.fieldRow ? LS_DOCK.fieldRow('DITL-23A #B', 23, 1, 'BFWP B REMOTE MODE SELECTED') : '') && '')] },
      { st: 14, sec: 52, t: 'Fault: BFWP A trips in the field', d: 'The protection relay of BFWP A opens the MCC (Faults list, MIT-P1115A). On DITL-23A its ELECTRIC TROUBLE makes BFWP A TRIP (out 65) and resets the running latch (out 55).', c: b.X8[1][1], a: [btn('FAULT: BFWP A trips', () => (window.WORLD && WORLD.ftrip ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + WORLD.ftrip('mt.bfwpa', true)), '') : ''), () => bit('M.3343') < 0.5)] },
      { st: 14, sec: 52, t: 'BFWP B takes over', d: 'DITL-23A #B: BFWP B AUTO STARTING (M.1144) = BFWP A tripped AND BFWP B AUTO MODE SELECTED; it starts by itself. If it does not (not in AUTO or REMOTE), start it from the CRT. No run-back is drawn for a BFWP trip on this unit (no RUN BACK on the ABC or DITL sheets): the load stays.', c: b.X8[2][1], a: [mot('M.3344', 'BFWP B')] },
      { st: 14, sec: 52, t: 'Feedwater and drum level recover', d: 'On the trip the feedwater FICFW1007 and the drum level loop LICBR1001A drop to MANUAL and stay there. Put them back as at 150 MW: LICBR1001A AUTO, LICBR1001 AUTO, then FICFW1007 REMOTE (the feedwater then follows the drum level and the steam flow). The drum level must then stay inside the alarm list limits H +127 / L -100 mm (LT-BR1001-2) for 2 min. Watch the feedwater flow against the steam flow.', c: b.X8[3][1], fps: ['LICBR1001A', 'LICBR1001', 'FICFW1007'] /* Mina beta.24 B24-4 */ },
      /* sweep 31 (Mina 11-08: step 5 had only the FIELD button, the AUTO of BFWP A was on the Feedwater page faceplate only): the standby
         card of the dock as for the MWP / SWBP sets (max 1 running, sby): BFWP A REMOTE + AUTO MODE SELECTED there; the relay reset is
         its field action (loc) until the fault is cleared */
      { st: 14, sec: 52, max: 1, sby: 1, t: 'Reset the relay; BFWP A becomes the standby', d: 'The field resets the BFWP A relay (Faults: press it again) and the operator acknowledges the TRIP. Then BFWP A is the standby: REMOTE and AUTO MODE SELECTED (DITL-23A rows 24 / 18).', c: b.X8[4][1], a: [
          Object.assign(
            btn('FIELD: reset the BFWP A relay', () => (window.WORLD && WORLD.ftrip ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + WORLD.ftrip('mt.bfwpa', false)), '') : ''), () => !(window.WORLD && WORLD.ftrip && WORLD.ftrip().some(x => x.id === 'mt.bfwpa' && x.on))),
            { loc: 1 }
          ),
          mot('M.3344', 'BFWP B'),
          mot('M.3343', 'BFWP A')
        ] },
      /* ---- 15 O2 analyzer A fails (e5 recovery, LISA; the checks are live.js X9; I/O list AI0273 / AI0433, ABC-002, alarm list AT-FG1122 / 1123) ---- */
      { st: 15, sec: 53, t: 'Fault: O2 analyzer A signal lost', d: 'The O2 analyzer A (AT-FG1122, I/O list AI0273, 0 ~ 25 %) loses its signal: the AI reads 0 % and its signal abnormal flag B.0671 (I/O list SIG.AB) is set. The O2 sensors of this plant fail often.', c: b.X9[0][1], a: [btn('FAULT: O2 analyzer A signal lost', () => (AN.fault ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + AN.fault('ai.o2a.lo', true)), '') : ''))] },
      { st: 15, sec: 53, t: 'AICFG112 follows analyzer B', d: 'ABC-002: the select circuit of the O2 takes out the analyzer with SIG.AB; the PV of AICFG112 is analyzer B (AT-FG1123, AI0433). No step in the O2 trim: compare the two analyzers on the faceplate.', c: b.X9[1][1], fps: ['AICFG112'] },
      { st: 15, sec: 53, t: 'Check the O2 trim on analyzer B', d: 'AICFG112 in AUTO; the flue gas O2 inside the alarm list band L 2.5 ~ H 5 % (AT-FG1123: HH 7, H 5, L 2.5, LL 2 %) for 2 min. With one analyzer left, a second failure takes the O2 trim away: watch analyzer B.', c: b.X9[2][1], fps: ['AICFG112'], a: [btn('AICFG112 AUTO', () => A.auto('AICFG112'), () => md('AICFG112') === 'AUTO')] },
      { st: 15, sec: 53, t: 'Analyzer A repaired: clear the fault', d: 'I&C repairs analyzer A (Faults: press it again). B.0671 goes back to 0 and analyzer A is back in the select.', c: b.X9[3][1], a: [btn('I&C: analyzer A repaired (clear)', () => (AN.fault ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + AN.fault('ai.o2a.lo', false)), '') : ''))] },
      /* ---- 16 PA fan trip at 150 MW (e5 recovery, LISA; the checks are live.js X10; DITL-26A, DITL-03A row 5, FHI Tab 9 p21 / p22) ---- */
      { st: 16, sec: 54, t: 'Fault: the PA fan trips in the field', d: 'The protection relay of the PA fan opens the MCC (Faults list, MIT-F1053). On DITL-26A its ELECTRIC TROUBLE makes PAF TRIP and the running latch resets.', c: b.X10[0][1], a: [btn('FAULT: PA fan trips', () => (window.WORLD && WORLD.ftrip ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + WORLD.ftrip('mt.paf', true)), '') : ''), () => bit('M.3302') < 0.5)] },
      { st: 16, sec: 54, t: 'The drawing trips the boiler', d: 'DITL-03A row 5 PAF STOPPED is one of the MFT conditions: the MFT (out 63) trips the coal and the burners, and the turbine trips through the TCS (IBD TA-9 BOILER MFT). This unit has no run-back for a fan trip (no RUN BACK on the ABC or DITL sheets).', c: b.X10[1][1] },
      { st: 16, sec: 54, t: 'First out; fans on; drum level in sight', d: 'Read the first out of the MFT (PAF STOPPED) on the purge and trip page. FHI Tab 9 p21: keep the ID fan and the SA fan running to remove the volatiles. Keep the drum level -200 ~ +200 mm: the steam flow falls fast after the MFT, so a feedwater flow over the steam flow fills the drum. Feedwater FICFW1007 in MANUAL: lower its MV as the steam flow falls; with the steam flow near 0 hold the drum with LICBR1001A (AUTO SV 0 mm, or MANUAL), as in the boiler trip section (ABC-010 M.0226).', c: b.X10[2][1], fps: ['LICBR1001', 'FICFW1007', 'LICBR1001A'] },
      { st: 16, sec: 54, t: 'Reset the relay, start the PA fan', d: 'The field resets the PA fan relay (Faults: press it again); acknowledge the TRIP. Close the PA damper FICFA1071 (MANUAL 0 %) as in the cold start; the field confirms the PA fan inlet vane closed (limit switch ZSC-FA1053-1, DITL-26A row 27 = row 4 PAF INLET VANE CLOSED). Then start the PA fan from the CRT (DITL-26A permissives: inlet vane closed, IDF running, any FAB running, relay reset).', c: b.X10[3][1], fps: ['FICFA1071'], a: [btn('FIELD: reset the PA fan relay', () => (window.WORLD && WORLD.ftrip ? (window.lsEventAdd && lsEventAdd('FIELD', 'FAULT', 'FAULT: ' + WORLD.ftrip('mt.paf', false)), '') : '')), btn('PA damper 0 %', () => A.man('FICFA1071', 0)), btn('FIELD: PA fan inlet vane closed (ZSC-FA1053-1)', () => window.LS_DOCK && LS_DOCK.fieldRow('DITL-26A', 26, 1, 'PA FAN INLET VANE CLOSED (ZSC-FA1053-1, field limit switch)')), mot('M.3302', 'PA fan')] },
      { st: 16, sec: 54, t: 'Hot restart: purge by-pass, MFT reset', d: 'FHI Tab 9 p22: with the bed at the start-up burner elevation above 700 °C (DITL-02 row 25, M.3339) press FURNACE PURGE START: the purge completes at once and the MFT resets. Below 700 °C the full 5 min purge is needed. Then the coal feeders and the turbine as in the hot restart section.', c: b.X10[4][1], a: [btn('FURNACE PURGE START (DITL-02)', () => dPress('DITL-02', 5), () => dOut('DITL-03A', 12) === 0)] }
    ];
    ST = ST.flat();
    ST.forEach((s, i) => (s.i = i));
    return ST;
  }

  /* ---------- the run: the open step, the latch (kept in this browser) ---------- */
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
      localStorage.setItem(KEY, JSON.stringify({ cur: G.cur, hold: G.hold, mine: G.mine, pw: G.pw, on: G.on }));
    } catch (e) {}
  };
  const G = Object.assign({ cur: 0, on: false, mine: {}, hold: {} }, rd() || {});
  const since = {};
  /* the coaches of older versions are not brought back (user 2026-10-29, #108) */
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
    if (!s.c) return !!G.mine[s.i] && preOk(s);
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
  /* the 6 h before the start-up of a field card (pre), counted in plant time from "Simulan ang 6 h purge" */
  const preOk = s => !s.pre || !G.pw || G.pw[s.i] == null || simT() - G.pw[s.i] >= s.pre;
  function preStart(i) {
    G.pw = G.pw || {};
    G.pw[i] = simT();
    G.mine[i] = 1;
    save();
  }
  const holdOf = s => (s.pre && G.pw && G.pw[s.i] != null ? [Math.max(0, simT() - G.pw[s.i]), s.pre] : null) || (s.c && s.c.hold && since[s.i] != null ? [Math.max(0, simT() - since[s.i]), s.c.hold] : null);
  /* the steps opened */
  function open(i) {
    const s = steps()[i];
    if (!s) return;
    G.cur = i;
    G.ok = null;
    save();
  }
  /* every step of the plant (AN.onStep): the heating rate, the pushbutton release; every second: the latch */
  const onStep = dt => {
    if (!live()) return;
    /* live test #57: the 3 s FORWARD STARTER pulse of the APH sootblower (DITL-80K O.077C), latched */
    if (!G.aphSb && aphSbFwd()) {
      G.aphSb = 1;
      save();
    }
    if (!G.on) return;
    {
      const t = simT(),
        H = RATE.h;
      if (!H.length || t - H[H.length - 1][0] >= 60 || t < H[H.length - 1][0]) {
        if (H.length && t < H[H.length - 1][0]) H.length = 0;
        H.push([t, +U().Tw || 0]);
        while (H.length > 6) H.shift();
      }
    }
    for (const a in PUSH)
      if (simT() >= PUSH[a]) {
        h().setx(null, a, 0);
        delete PUSH[a];
      }
    /* 3.2.3-beta.90: the automatic run in plant time (auto) */
    if (AUTO && simT() - AUTO.t >= AUTO.dt) {
      AUTO.t = simT();
      try {
        if (AUTO.pre) AUTO.pre();
        API.autoNext = true;
        doIt();
        scan();
      } catch (e) {}
    }
  };
  /* 3.2.3-beta.90 (CHAEWON, coordinator: the step timing of the automatic run depended on the speed of the page): the test tools called
     doIt() from outside the page once a second of the wall clock; at x300 that is 300 s of the plant or more when the page is slow, so the
     same step was done at 7 or at 19 kg/cm2 from run to run (the drum level AUTO of step 54 came late and the drum fell to the low-low).
     auto(true) runs doIt() and scan() inside the engine steps, once every dt seconds of the PLANT (default 10 s), whatever the speed
     of the page; pre() runs before each doIt (the tools use it for the field operator). auto(false) stops it */
  let AUTO = null;
  const auto = (on, pre, dt) => (AUTO = on ? { t: -1e9, pre: pre || null, dt: +dt > 0 ? +dt : 10 } : null);
  /* inside every step of the engine when it runs on this page (ENG.mode 'local'); with the engine in the worker (3.2.0 Web Worker) the
     steps run there: the coach runs here after each patch, with the plant time that passed (it reads the dock and the page; its writes go
     to the engine through the radio, src/world/eng.js) */
  const mirror = () => !!(window.ENG && ENG.mode === 'mirror');
  const hook = () => window.AN && (AN.onStep = dt => (mirror() ? 0 : onStep(dt)));
  hook();
  {
    let t0 = null;
    const onPatch = window.ENG ? ENG.onPatch : null;
    if (window.ENG)
      ENG.onPatch = m => {
        if (onPatch) onPatch(m);
        if (!mirror()) return (t0 = null);
        const t = simT();
        /* a new start (Reset, a starting state) or the first patch: no time passed */
        const dt = t0 == null || t < t0 ? 0 : t - t0;
        t0 = t;
        /* 3.2.3-beta.102: after the patch handler, not inside it (the coach writes to the engine; inside the handler of a patch those
           writes went out while the page was still taking the patch) */
        if (dt > 0)
          setTimeout(() => {
            try {
              onStep(dt);
            } catch (e) {}
          }, 0);
      };
  }
  /* check the open step; returns true when it moved on */
  function scan() {
    if (!G.on) return false;
    const L0 = steps(),
      s = L0[G.cur];
    if (!s) return false;
    /* 3.2.0 walkthrough #16: a field card (no DCS condition) is confirmed by the operator: it moves on while PAUSED too (retest #5: not
       while its 6 h purge is still counting) */
    if (!live()) {
      if (s.need && !s.c && stepOk(s)) return done(s);
      return false;
    }
    /* 3.2.0-beta.24: a station that a BU-CMD of the drawing put back to MANUAL after its step (HIC-BM / EIC-TM: M.2013 / M.2016,
       CLAUDE.md 10) stays MANUAL until the operator presses A: the guide goes back to that step, so its card says why and what to do */
    for (const r of s.req || []) {
      const j = L0.findIndex(x => x.id === r);
      /* Mina beta.136 (normal shutdown): near 63 MW the BU-CMD puts HIC-BM to MANUAL by design (M.2013), and "›" after step 119 jumped
         back to the start-up. The guide goes back only to a step of the same stage (the start-up steps belong to the start-up) */
      if (j >= 0 && j < G.cur && L0[j].st === s.st && !stepOk(L0[j])) {
        open(j);
        return true;
      }
    }
    if (stepOk(s)) return done(s);
    if (G.ok === G.cur) G.ok = null;
    return false;
  }
  /* 3.2.0 retest #30: a step that is done waits for the trainee ("✓ Tapos" and its result, then "Susunod ›"); a test tool sets autoNext */
  function done(s) {
    if (API.autoNext) {
      open(G.cur + 1);
      return true;
    }
    G.ok = G.cur;
    return false;
  }
  function next() {
    if (G.ok !== G.cur) return false;
    G.ok = null;
    open(G.cur + 1);
    return true;
  }
  /* out of order: a motor of a later step already running (the operator started it in the Plant view or the Logic) */
  function early() {
    const L0 = steps(),
      out = [];
    /* Mina beta.175 (step 141, hot restart of the turbine trip practice: "Ahead of the procedure: PA fan (a later step)"): the practice
       sections after the start-up (section index sec - 1 >= LS_LIVE.base, live.js BASE_N) are separate exercises on a running unit, not
       later steps of one order. A start-up step compares with the later start-up steps only; a practice step with the later steps of
       its own section only (the PA fan start of practice 54 is not "ahead" of practice 51) */
    const base = window.LS_LIVE && LS_LIVE.base != null ? LS_LIVE.base : null,
      prac = s => base != null && !!(s && s.sec) && s.sec - 1 >= base,
      me = L0[G.cur] || {},
      same = s => (prac(me) ? !!s && s.sec === me.sec : !prac(s));
    /* Mina B67-3 / B24-5 (step 147, BFWP A trip practice): a FAULT practice starts on a running unit; the pump that a later step puts
       back (BFWP A as the standby) was running before the fault, so it is not "ahead" of the order. No order warning in such a section */
    if (prac(me) && L0.some(s => s && s.sec === me.sec && (s.a || []).some(a => /^FAULT\b/.test(a.l || '')))) return out;
    for (let i = G.cur + 1; i < L0.length && out.length < 3; i++) {
      if (!same(L0[i])) continue;
      for (const a of L0[i].a || [])
        if (a.stop && a.on && a.on() && !(L0[G.cur].a || []).some(x => x.l === a.l) && !out.includes(a.l.replace(/^START /, ''))) {
          /* the same pump may be one of the choices of this or an earlier step */
          let before = false;
          for (let j = 0; j <= G.cur; j++) if ((L0[j].a || []).some(x => x.l === a.l)) before = true;
          if (!before) out.push(a.l.replace(/^START /, ''));
        }
    }
    return out;
  }
  /* the sheets the steps operate that may not be linked to the sheet on the screen: stepped too (links.js actSet) */
  function trainSheets() {
    return ['ABC-001C', 'ABC-002', 'ABC-003A', 'ABC-003B', 'ABC-003C', 'ABC-003D', 'ABC-004A', 'ABC-005', 'ABC-007', 'ABC-008', 'ABC-010', 'ABC-011', 'ABC-012', 'ABC-013', 'ABC-020', 'ABC-028', 'ABC-031', 'ABC-032', 'ABC-050', 'ABC-052', 'ABC-054']
      .concat(steps().flatMap(s => (s.fps || []).map(t => shOf(L().ctlTag(t) || t)).filter(Boolean)))
      .filter((x, i, a) => a.indexOf(x) === i);
  }
  /* start: the plant cold, RUN, step 1 */
  function start(done) {
    /* 3.2.0 retest #54 (user 2026-10-28: the page froze over 1 min, no loading sign): the cold plant loads in slices with a progress
       bar (hmi-op.js anLoadStart), then the training starts */
    const go = () => {
      AN._gdWait = 0;
      G.retT = G.retTb = null; /* the burner retraction timing of a run before */
      const ld = AN.loadStart
        ? AN.loadStart('cold', true)
        : Promise.resolve().then(() => {
            if (!AN.plantOn && AN.plantSwitch) AN.plantSwitch(true, true);
            AN.reset();
            AN.plantCold();
            AN.startState = 'plantCold';
          });
      AN._startPending = 0;
      ld.catch(() => {}).then(go2);
    };
    const go2 = () => {
      try {
        AN.settle();
        AN.paint();
      } catch (e) {}
      /* retest #9: the AUTO ticks start clean from the cold plant (none from the plant of before the load) */
      try {
        if (L() && L().reset) L().reset();
      } catch (e) {}
      for (const k in since) delete since[k];
      hook();
      G.on = true;
      G.mine = {};
      G.pw = {};
      G.cur = 0;
      G.aphSb = 0;
      if (window.WORLD && WORLD.pulseClear) WORLD.pulseClear();
      HH = null;
      AN.checkSheets = trainSheets();
      /* 3.2.0 walkthrough #1: the start-up begins at t = 0 (the clock of the sheets counted the settling of the cold state: t = 11:29) and
         PAUSED (simulation on, time stopped, 1x): the field steps come first and the trainee presses RUN. Before: RUN at once, x10 */
      /* the clock and the trend histories of the engine: an engine action (AN.clock0, runs in the engine and on the page: with the
         engine in the worker a write here never reached it, the clock showed 0 while PAUSED and jumped back at RUN); the page's own
         history of the sheets (_hs) stays here */
      try {
        const c0 = !!AN.clock0;
        if (c0) AN.clock0();
        for (const sh of AN.sheets)
          if (sh.S && sh.S.rt) {
            sh._hs = [];
            if (c0) continue;
            const rt = sh.S.rt;
            rt.t = 0;
            for (const k in rt.pm || {}) if (rt.pm[k] && Array.isArray(rt.pm[k].h)) rt.pm[k].h = [];
            for (const k in rt.st || {}) if (rt.st[k] && Array.isArray(rt.st[k].h)) rt.st[k].h = [];
          }
      } catch (e) {}
      open(0);
      if (AN.pauseOn) AN.pauseOn();
      if (done) done();
    };
    try {
      AN._cold0 = 1;
      /* retest #59: no starting-state question until this load has started */
      AN._startPending = 1;
      AN._gdWait = 1;
      if (AN.cat !== 'an') AN.setCat('an');
    } catch (e) {}
    let k = 0;
    const iv = setInterval(() => {
      const ok = AN.cat === 'an' && AN.sheets && AN.sheets.length >= 54 && AN.plantCold && window.CHECK;
      if (ok || ++k > 160) {
        clearInterval(iv);
        if (ok) go();
        else AN._startPending = AN._gdWait = 0;
      }
    }, 250);
  }
  /* M25 (user via the leader 2026-11-03, option 1): a cold plant = step 1. A Cold loaded any other way than the Training's own start
     (Plant ▾ > Cold, Reset then Cold, a reload then Cold) starts the Training again at step 1 with no ticks; before, a reload kept
     step 2 (lineup 15 / 16) while the step 1 purge of the new cold plant showed 0:00 / 6:00. A reload with no new Cold keeps the
     progress (the plant has not changed) */
  /* Mina beta.92 B92-3: the Instructor "Cold start" over a plant that was itself started from Cold kept the dock on step 77 (the name of
     the state did not change). A true Cold (no warm / hot restart) counts as new at every load (hmi-op.js AN.startN) */
  const ssKey = A => A.startState + (A.startState === 'plantCold' && !A.restartKind ? '#' + (A.startN || 0) : '');
  let ss0 = window.AN ? ssKey(AN) : undefined;
  setInterval(() => {
    const A = window.AN;
    if (!A) return;
    const ss = A.startState,
      k = ssKey(A);
    if (k === ss0) return;
    ss0 = k;
    if (ss !== 'plantCold' || A._gdWait || A._startPending) return;
    if (!G.cur && !Object.keys(G.mine || {}).length && !Object.keys(ls0('ls-train')).length) return;
    G.cur = 0;
    G.mine = {};
    G.pw = {};
    G.hold = {};
    /* Mina step 14: a Cold from the plant puts back the sheet sets of its state: the sheets of the Training are stepped again */
    if (G.on) AN.checkSheets = trainSheets().concat(AN.checkSheets || []).filter((x, i, a) => a.indexOf(x) === i);
    for (const k in since) delete since[k];
    try {
      localStorage.setItem('ls-train', '{}');
    } catch (e) {}
    try {
      if (L() && L().reset) L().reset();
    } catch (e) {}
    save();
    try {
      if (G.on) open(0);
      if (window.LS_DOCK && LS_DOCK.refresh) LS_DOCK.refresh();
      window.lsEventAdd && lsEventAdd('DCS', 'TRAIN', 'Cold plant: the Training starts again at step 1');
    } catch (e) {}
  }, 500);
  function ls0(k) {
    try {
      return JSON.parse(localStorage.getItem(k) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  /* continue after a reload: the plant is not saved, so the training goes on only with a plant in the simulation */
  function resume() {
    /* Mina step 14 (beta.87): the short list of before had no ABC-053, so TICLO1002 stayed MAN until its page was opened; the same list
       as the start now, the sheets already in it kept */
    AN.checkSheets = trainSheets().concat(AN.checkSheets || []).filter((x, i, a) => a.indexOf(x) === i);
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
    G.ok = null;
    if (G.pw) delete G.pw[i];
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
      /* PR-OPE-5002: "When removing a burner from service, ALLOW the furnace temperature to recover": the next burner only when the bed
         is back at its temperature of the last retraction */
      if (G.retT != null && G.retTb != null && U().Tb < G.retTb) return;
      const nx = (s.a || []).find(a => !a.on());
      if (nx) {
        nx.f();
        G.retT = simT();
        G.retTb = U().Tb;
      }
      return;
    }
    /* again after a minute of the plant when the step is still not done (a value the drawing held while the machine was stopping) */
    if (G.did === s.i && simT() - (G.didT || 0) < 60) return;
    /* 3.2.3-beta.90: the warm-up steps (stage 4 with the heating rate on their card, or once the drum has pressure) hold the heating
       rate as their text says */
    if (s.st === 4 && ((s.w || []).some(r => r[1] === rate) || (+U().Pd || 0) > 0.5)) heatSeek();
    /* 3.2.3-beta.99 (drum LOW-LOW at step 68, automatic runs on beta.93 / 95): the 35 kg/cm2 hold of step 57 lasts through the field and
       TCS steps 58 ~ 73 (its text: the blow-off "holds the main steam pressure at 35 kg/cm2 while the TCS auxiliaries and the vacuum are
       done ... lower the oil so the blow-off does not stand full open"), but only step 57 lowered the oil. The bed kept heating (441 ->
       468 C), the blow-off stood full open, the pressure rose to 38 ~ 39 and the drum fell to the low-low level. The same oil ▼ (−5 % each
       2 minutes, down to the burner minimum fire) now acts in those steps too, while the blow-off holds (AUTO) and the HP bypass is not in
       service yet */
    else if (s.st === 5 && md('PICMS1002') === 'AUTO' && md('PICMS1006') !== 'AUTO' && (+mv('PICMS1002') || 0) >= 100 && simT() - (paceT.bo57 || -1e9) >= 120) {
      paceT.bo57 = simT();
      oilStep('', ['A', 'B', 'C', 'D'], -5).f();
    }
    /* 3.2.3-beta.101 (automatic runs on the HP bypass ramp of beta.101): the bypass steps raise the oil for 40 T/H while the SV climbs,
       the steam reached 90 T/H at 61 kg/cm2 (oil 6.1 T/H against 3.3 before) once the ready-to-roll hold ended, the main steam went to
       443 C and "Steam for the roll" (MSV inlet <= 420 C, ATS Fig. 2) waited until the diesel tank ran empty. Step 76 says "you control
       the oil for 40 ~ 55 T/H" (PR-OPE-5002 "Steam Flow of 40 T/H above is recommended"): the same oil ▼ (−5 % each 2 minutes, down to the
       burner minimum fire) keeps acting through the turbine-on-oil steps while the HP bypass holds the pressure, before the 52G */
    /* 3.2.3-beta.107 (Mina live beta.102: drum +190 / -172.5 mm at step 81; Worker run: oil 6.1 T/H at the start of step 81, steam 109
       T/H, then the oil ▼ alone took it down to 14 T/H and the pressure and level swung): the band is both ways, as the oil band of
       step 76 (oilBand: ▲ under 40 T/H only while the steam has a way out and the heating rate is not over 55) */
    /* Worker run of this build: the 2-minute ▼ / ▲ on the steam of the moment chased the swing of the HP bypass loop itself (steam 7 ~ 106
       T/H, oil 2.5 ~ 6.1 T/H, drum -175 / +136 mm, period about 40 minutes); with the oil held the loop settled (drum 0 mm, steam 58 T/H).
       So the band reads the 10-minute mean of the steam and moves the oil once per 10 minutes */
    else if (s.st === 7 && md('PICMS1006') === 'AUTO' && !(bit('I.0931') > 0.5) && ms7() != null && simT() - (paceT.oil7 || -1e9) >= 600 && (ms7() > 55 || (ms7() < 40 && outOpen() && atSv() && !(rate() > 55)))) {
      paceT.oil7 = simT();
      if (ms7() > 55) oilStep('', ['A', 'B', 'C', 'D'], -5).f();
      else oilStep('', ['A', 'D'], 5).f();
    }
    /* a trim step: the seek moves the stations toward the band of the SOP; the ▲ / ▼ buttons are never pressed here (below) */
    if (s.seek) s.seek();
    /* max counts the machines of the step (the START / STOP buttons); its valve and field buttons are pressed as before */
    const isM = a => !!a.stop;
    let n = (s.a || []).filter(a => isM(a) && a.on && a.on()).length;
    /* a button listed after the START buttons is for after the start (FAB: FICFA1055A M 41 % once the blower runs; pressed together
       with the START, it took the damper off its 25 % start position, FCD READY M.1033 went 0 and the blower could not start) */
    const L0 = s.a || [],
      lastM = L0.reduce((k, a, i) => (isM(a) ? i : k), -1),
      runN = n;
    for (const [i, a] of L0.entries())
      if (!a.on || !a.on()) {
        /* the ▲ / ▼ trims are the trainee's own hand (#108, no coach); pressed together they cancel: a seek does them */
        /* 3.2.3-beta.90: except a band button (oilBand: pressed only outside its band, at its own pace), the seek of the bypass steps;
           before, the Do it for me never kept the 40 ~ 55 T/H of the bypass servicing (automatic runs: drum LOW-LOW at steps 75 ~ 81) */
        if (/[▲▼]/.test(a.l) && !a.band) continue;
        if (lastM >= 0 && i > lastM && runN < (s.max || 1)) continue;
        if (isM(a) && s.max && n >= s.max) continue;
        a.f();
        if (isM(a)) n++;
      }
    /* the standby of a pump set (sby: SWBP, MWP, ACWP): FIELD REMOTE, then AUTO on its drawing, as the AUTO row of the dock card (the
       "Do it for me" started the pumps but left the standby MANUAL: the step that wants "standby in REMOTE + AUTO" never ended) */
    /* only once the machines really run (a pump just started is not the standby) */
    /* automatic run 2026-11-10: the standby set to AUTO in the same second as the start found the common discharge pressure still low
       (DITL-77 row 12) and started too (two ACWPs running, the step never ended): AUTO only after 30 s of the plant with the machines running */
    /* the PRESSURE LOW / PRESS. L.L. rows of a pump drawing (the standby start of the drawing) */
    const pLow = (ds, i) => /PRESS(URE|\.)? *(LOW|L\.L\.)/.test((DUI.rowInfo(ds, i) || {}).svc || '') && DUI.rowVal(ds, i) === 1;
    /* 3.2.3-beta.108 (Mina B102-2): a standby that started on its own (AUTO, pressure low) while the set already has its running pump
       could not be stopped (its STOP is blocked in AUTO) and the step never ended: once the pressure is back, AUTO off, then STOP; the
       block below puts it back in AUTO 30 s later as the standby */
    if (s.sby && s.max && window.LS_DOCK) {
      const runL = (s.a || []).filter(a => isM(a) && a.ad && a.on && a.on());
      if (runL.length <= s.max) G.xStop = null;
      else
        try {
          const dsR = a => {
            const ds = LS_DOCK.dOf(a.ad);
            return { ds, R: ds && LS_DOCK.amRow(ds) };
          };
          const t = runL.find(a => a.ad === G.xStop) || runL.find(a => { const { ds, R } = dsR(a); return R && DUI.rowVal(ds, R.row) === 1; });
          const { ds, R } = t ? dsR(t) : {};
          if (t && R && !(ds.rows && ds.rows.some((r, i) => pLow(ds, i)))) {
            G.xStop = t.ad;
            if (DUI.rowVal(ds, R.row) === 1) LS_DOCK.dsel(/^DITL-/.test(t.ad) ? t.ad : (String(ds.name).match(/DITL-[^)]*$/) || [t.ad])[0], R.row, 0, R.svc);
            else t.stop && t.stop.f();
          }
        } catch (e) {}
    }
    const runOk = s.sby && s.max && (s.a || []).filter(a => isM(a) && a.on && a.on()).length >= s.max;
    if (!runOk) G.sbyT = null;
    else if (G.sbyT == null || G.sbyI !== s.i) (G.sbyT = simT()), (G.sbyI = s.i);
    if (runOk && simT() - G.sbyT >= 30 && window.LS_DOCK)
      for (const a of s.a || []) {
        if (!isM(a) || !a.ad || (a.on && a.on())) continue;
        try {
          const ds = LS_DOCK.dOf(a.ad),
            R = ds && LS_DOCK.amRow(ds),
            m = LS_DOCK.modeOf(a.ad);
          if (!R) continue;
          /* automatic run 2026-11-10: AUTO with the common discharge pressure still low (ACWP discharge valve not yet open, PT-CW1152 under
             3.5 kg/cm2, DITL-77 row 12) starts the standby at once, as the drawing says: AUTO only once no PRESSURE LOW row of its sheet is made */
          /* 3.2.3-beta.108 (Mina B102-2: step 30 waited 320 minutes with both diesel oil pumps running, B in AUTO): DITL-31 row 5 says
             "DOP OUTLET PRESS. L.L.", not "PRESSURE LOW", so DOP B went to AUTO with the outlet pressure still low and started too */
          if (ds && ds.rows && ds.rows.some((r, i) => pLow(ds, i))) continue;
          if (m && m.rem === false) LS_DOCK.dremote(a.ad, a.l.replace(/^START /, ''));
          /* plan c5: dsel takes the drawing name; a pump of the ABC memory (CEP M.3351, FAB M.3309, BFWP M.3343) names its drawing
             instance ("DITL-61A #B"), so the standby of those sets was never put in AUTO here */
          else if (DUI.rowVal(ds, R.row) !== 1) LS_DOCK.dsel(/^DITL-/.test(a.ad) ? a.ad : (String(ds.name).match(/DITL-[^)]*$/) || [a.ad])[0], R.row, 1, R.svc);
        } catch (e) {}
      }
    G.did = s.i;
    G.didT = simT();
  }
  const API = {
    autoNext: false,
    next,
    ready: () => G.ok === G.cur,
    steps,
    STAGES,
    start,
    resume,
    stop,
    scan,
    stepOk,
    holdOf,
    confirm,
    preStart,
    doIt,
    auto,
    early,
    fieldOf,
    live,
    open,
    /* plan e4 (Mina beta.114: "Practise: Normal shutdown" loaded 150 MW but the dock stayed on step 104): the guided dock on at the first
       step of a stage, without a new plant load */
    openStage(st) {
      const i = steps().findIndex(x => x.st === st);
      if (i < 0) return;
      if (window.LS_DOCK && LS_DOCK.resume) LS_DOCK.resume();
      else if (!G.on) resume();
      open(i);
      if (window.LS_DOCK && LS_DOCK.fill) LS_DOCK.fill();
      /* Mina beta.116 / 123: the dock came back to the first open step (104); the stage is opened again once the resume has settled */
      setTimeout(() => (open(i), window.LS_DOCK && LS_DOCK.fill && LS_DOCK.fill(true)), 1500);
    },
    A,
    h,
    get cur() {
      return G.cur;
    },
    get on() {
      return G.on;
    },
    mine: () => G.mine,
    /* live test #57: the APH sootblower was started (forward starter O.077C seen), for the SOP tick of sec 27 (live.js) */
    aphSb: () => !!G.aphSb || aphSbFwd()
  };
  return API;
})();
