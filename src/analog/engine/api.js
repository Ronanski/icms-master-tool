/* ===== ENGINE API: what the engine gives on AN (the page and a Web Worker take the same list). No page access.
   3.2.0 Web Worker (stage a): the engine part of the AN map of boot.js; boot.js takes it first, then the page functions ===== */
function anEngAPI() {
  return {
    anStationOf,
    anSvSwitchOf,
    anHasRemote,
    stepTier,
    ensure,
    linksOf,
    actSet,
    cosInfo,
    cosFill,
    procRemote,
    nm,
    anPins,
    stepSet,
    lnTables,
    lnApplyEdits,
    lnResolve,
    fxIn: anFXIn,
    netRange: anNetRange,
    extRange: anExtRange,
    plantLoad150: anPlantLoad150,
    plantCold: anPlantCold,
    plantColdAsync: anPlantColdAsync,
    loadStart: anLoadStart,
    plantLoad150Async: anPlantLoad150Async,
    plantLive: anPlantLive,
    turbine: anTurbine,
    tcs: () => tcsState(),
    unitRestart: k => anUnitRestart(k),
    tcsTrip: () => tcsTripState(AN_UNIT),
    tcsIbd: id => tcsIbdState(id),
    tcsIbdSheets: () => TCS_IBD_SHEETS,
    tcsIbdMissing: () => tcsIbdMissing(),
    tcsIO: () => (AN_UNIT.on ? tcsIO(AN_UNIT) : null),
    tcsInit: h => (AN_UNIT.on ? tcsInit(AN_UNIT, h) : null),
    oilValve: anOilValve,
    blowdown: anBlowdown,
    field: anField,
    tsat: steamTsat,
    fieldState: () => Object.assign({}, AN_SRC.field),
    /* 3.2.1 (CW plant model): the manual valves of the seawater system, opening in % (unit.js AN_SW_V0) */
    /* 3.2.1 (IRENE): with the diesel oil line-up of boiler.js (AN_DO.fv0, anDoValve), so the one field valve faceplate serves both */
    /* Mina F57: the value of a MAN station as an engine action. A page write waits for its slot, and the latchMode of the same press brought a patch back
       with the old value first, so a press in the dock was lost (the faceplate has no latchMode with its value) */
    stVal: (nm, id, x, nets) => {
      const s = AN.sheets.find(q => q.name === nm),
        st = s && s.S && s.S.rt.st[id];
      if (st) {
        st.val = x;
        st.trk = null; /* a sheet that was not stepped yet holds an old tracking value: its first step would put it back */
      }
      if (s && s.S) for (const n of nets || []) s.S.rt.ext[n] = x;
      /* Mina beta.121 ~ 123 (HIC-MWRL: the press is logged, 2.9 for 0.6 s, then 3.0 again): an A / M switch whose output the station
         tracks (plant.js AMT trkFrom: on the B leg the station follows the switch output, ds.trk) put the old value back every scan. The
         operator's value goes on the manual leg (B, the COS manual input) of every such switch too, so the tracking carries it */
      try {
        const S0 = s && s.S;
        if (S0)
          for (const z of S0.blk)
            if (z.k === 'AMT' && (z.trkFrom || []).some(d => d.id === id) && z.b >= 0 && S0.rt.force[z.b] === undefined) {
              const xb = z.bg != null && z.bg !== 0 ? x / z.bg : x;
              if (S0.ext.includes(z.b)) S0.rt.ext[z.b] = xb;
              S0.rt.v[z.b] = xb;
              if (z.o && z.o[0] != null && z.o[0] >= 0) S0.rt.v[z.o[0]] = x;
              if (S0.rt.st[z.id]) (S0.rt.st[z.id].hold = x), (S0.rt.st[z.id].y = x);
            }
      } catch (e) {}
      /* Mina beta.114 / 115 (Worker: HIC-MWRL stayed 3.0 after the operator's presses): a station whose AUTO leg is its OWN output
         through the AMT (ABC-001B HIC-MWRL) reads that loop back on the next scan. The operator's value goes on the loop too (the AMT
         out and the station outputs), as the snapshot load does (hmi-op.js, 2.2.0-beta.9) */
      try {
        const S = s && s.S,
          b = S && S.blk.find(q => q.id === id && q.k === 'MAN'),
          si = b && b.svI >= 0 ? b.i[b.svI] : null,
          dr = si != null ? (S.drv[si] || []).find(z => z.k === 'AMT') : null;
        if (dr && dr.o && dr.o[0] != null && !S.ext.includes(dr.a) && S.rt.st[dr.id] && S.rt.st[dr.id].pk === 'A') {
          S.rt.st[id].op = x;
          S.rt.v[dr.o[0]] = x;
          for (const n of b.o || []) if (n != null && n >= 0) S.rt.v[n] = x;
          if (dr.a != null && dr.a >= 0) S.rt.v[dr.a] = x;
        }
      } catch (e) {}
    },
    fanI: anFanI,
    aphIn: anAphIn,
    aphAir: anAphAir,
    aphOut: anAphOut,
    bedSS: (U, fs, as) => anBedSS(U, fs, as),
    bedStep: (U, dt, rpm, pa, fa) => anBedStep(U, dt, rpm, pa, fa),
    swValve: (tag, pct) => anSwValve(tag, pct) || anDoValve(tag, pct),
    swValves: () => Object.assign({}, AN_SW_V0, AN_FV0, AN_DO.fv0, AN_LM.fv0, AN_SRC.valve || {}),
    /* 3.2.1 (IRENE): the opening of one field valve (unit.js anFv / boiler.js anDoFv), read by the limit switch rows (world/plantsw.js) */
    fv: tag => (tag in AN_DO.fv0 ? anDoFv(tag) : anFv(tag)),
    /* 3.2.1 (IRENE): the position of a DITL valve machine (0 ~ 100 %) and the pneumatic valves on the instrument air (unit.js AN_AV) */
    ditlPos: (name, j) => anDitlPos(name, j || 0),
    ditlRun: anDitlRun,
    airValves: () => AN_AV,
    avSv: anAvSv,
    fxs: (p, x) => anFXs(p, x),
    /* 3.2.1 SEULGI (boiler.js): the manual valves of the diesel oil line-up, opening in % (AN_DO.fv0) */
    doValve: anDoValve,
    /* 3.2.1 SEULGI (boiler.js AN_BA): the numbers of the bottom ash model (set points of its field switches) */
    baK: AN_BA,
    engState: { capture: anStateCapture, apply: anStateApply },
    /* engine/sync.js: what changed, both ways (worker -> page, page -> worker) */
    sync: {
      patch: anSyncPatch,
      apply: anSyncApply,
      mark: anSyncMark,
      forget: anSyncForget,
      encArgs: anSyncEncArgs,
      decArgs: anSyncDecArgs
    },
    /* engine/trace-step.js: Next / Back of the ABC trace, one engine action each */
    stepN: anStepN,
    stepBack: anStepBack,
    clock0: anClock0,
    plantT: anPlantT,
    /* engine/ds.js: the FROM / TO DITL texts of a sheet, the description of an address (the face plate defaults first) */
    dsIdx,
    descOf: (sh, t) => {
      try {
        const F = typeof AN_DEF !== 'undefined' && AN_DEF.FACE;
        if (F && t)
          for (const k of ['PID', 'MAN', 'SUMA']) for (const q of F[k] || []) if (q.tag === t && q.desc) return q.desc;
        const a = adesFind(sh, t);
        return a ? adesText(a.rec) : '';
      } catch (e) {
        return '';
      }
    },
    /* engine/ctrls.js: the controllers of a sheet and the mode addresses of a tag */
    hmiCtrls: ctrls,
    modeNets: (tag, kinds) => modeNetsByTag(tag, kinds || MODEK.MAN),
    modeNetsBy: modeNetsByTag,
    MODEK,
    latchMode,
    modeStatus,
    descWire
  };
}
