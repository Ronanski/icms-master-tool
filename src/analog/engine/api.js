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
    tcsIO: () => (AN_UNIT.on ? tcsIO(AN_UNIT) : null),
    tcsInit: h => (AN_UNIT.on ? tcsInit(AN_UNIT, h) : null),
    oilValve: anOilValve,
    blowdown: anBlowdown,
    field: anField,
    tsat: steamTsat,
    fieldState: () => Object.assign({}, AN_SRC.field),
    /* 3.2.1 (CW plant model): the manual valves of the seawater system, opening in % (unit.js AN_SW_V0) */
    /* 3.2.1 (IRENE): with the diesel oil line-up of boiler.js (AN_DO.fv0, anDoValve), so the one field valve faceplate serves both */
    bedSS: (U, fs, as) => anBedSS(U, fs, as),
    bedStep: (U, dt, rpm, pa) => anBedStep(U, dt, rpm, pa),
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
    descWire
  };
}
