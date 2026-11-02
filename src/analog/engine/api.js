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
    engState: { capture: anStateCapture, apply: anStateApply },
    /* engine/sync.js: what changed, both ways (worker -> page, page -> worker) */
    sync: { patch: anSyncPatch, apply: anSyncApply, mark: anSyncMark },
    /* engine/ds.js: the FROM / TO DITL texts of a sheet, the description of an address (the face plate defaults first) */
    dsIdx,
    descOf: (sh, t) => {
      try {
        const F = typeof AN_DEF !== 'undefined' && AN_DEF.FACE;
        if (F && t) for (const k of ['PID', 'MAN', 'SUMA']) for (const q of F[k] || []) if (q.tag === t && q.desc) return q.desc;
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
