/* 3.2.0-beta.14 (plan "per-loop at unit plant model", phase A; user 2026-10-23: "since walang steam, dapat walang ma-generate na PV
   ito kahit anong SV MV mo"): the SOURCE of each loop. The loop model of plant.js makes the PV from the valve command alone (PV =
   middle of the range + effect of the MV, anchored at the 150 MW snapshot), so a loop whose process medium is not there still
   had a PV: ABC-017 sootblower steam 0.3 ~ 50 kg/cm2 with the boiler cold, ABC-028 diesel oil pump outlet 12.9 kg/cm2 with the
   pump stopped, ABC-032 condensate flow 380 T/H with no condensate pump. Here every loop of the loop map (docs: "Mapa ng mga loop")
   that the unit model does not write gets the condition of its medium, from the unit model (steam pressures and flows, turbine,
   coal) and from the running memories of the machines on the ABC sheets (memory lists, hmi-op.js AN_HMI_DI):
     mul  = share of the medium that is there (0 = none): PV = mul x model + (1 - mul) x base (base = bottom of the range, or the
            ambient for a temperature), with the lag of the loop;
     cap  = the PV cannot be above the pressure of its source (a reducing station: sootblower, aux steam, oil after the pump);
     hold = the PV (a tank level) does not answer the valve while the pump that moves the water is stopped.
   Only while the unit model runs (a starting state: Cold, Warm, Hot, 150 MW). With no starting state the loop models are as before.
   The machines that have no DCS signal (diesel oil pump P-0005, DITL-31) are FIELD equipment: AN.field (Start ▾ > Field equipment).
   Numbers marked ASSUMED are not in the repository. */
const AN_SRC = {
  field: { dop: true, hypo: true, pur: true } /* 3.2.0 retest #33: hypochlorite pump (no DCS signal); R9 #77: turbine oil purifier pump P-n941 (local) */,
  Tamb: 30,
  st: null,
  t: -1,
  bits: null,
  bitsOf: null
};
/* the value of a memory / input address on the ABC sheets (1 if any copy is 1): the running memories of the motors */
function srcBit(addrs) {
  if (AN_SRC.bitsOf !== AN.sheets) {
    AN_SRC.bitsOf = AN.sheets;
    AN_SRC.bits = {};
  }
  let on = 0,
    seen = false;
  for (const a of addrs) {
    let L = AN_SRC.bits[a];
    if (!L) {
      L = AN_SRC.bits[a] = [];
      for (const sh of AN.sheets) {
        const S = sh.S;
        if (!S || !S.lab) continue;
        const n = S.lab.findIndex(l => l && String(l.t).trim() === a);
        if (n >= 0) L.push([sh, n]);
      }
    }
    for (const [sh, n] of L) {
      if (!sh.S || !sh.S.rt) continue;
      seen = true;
      if (+sh.S.rt.v[n] > 0.5) on = 1;
    }
  }
  return seen ? on : 1;
}
/* the PV of the controller tag of a sheet (another loop that is the source of this one) */
function srcPv(shn, tag) {
  const sh = AN.sheets.find(x => x.name === shn),
    S = sh && sh.S,
    b = S && S.procs ? S.procs.find(z => (z.txt || [])[1] === tag) : null;
  return b && b.proc && S.rt && isFinite(S.rt.v[b.proc.pv]) ? +S.rt.v[b.proc.pv] : NaN;
}
const srcCl = x => (isFinite(x) ? Math.max(0, Math.min(1, x)) : 0);
/* the condition of the plant now, once per scan */
function srcState(t0) {
  const U = AN_UNIT,
    t = U.t + '|' + t0;
  if (AN_SRC.st && AN_SRC.t === t) return AN_SRC.st;
  if (!U.on) return (AN_SRC.st = null);
  const m0 = U.m0 > 0 ? U.m0 : 474,
    tb = U.tb || {},
    ms = U.ms || 0,
    s = {
      Tamb: U.Tamb != null ? U.Tamb : AN_SRC.Tamb,
      Pms: isFinite(U.Pms) ? U.Pms : 0,
      Prh: isFinite(U.Prh) ? U.Prh : 0,
      mhp: U.mhp || 0,
      ms,
      qlp: U.qlp || 0,
      m0,
      rpm: isFinite(U.rpm) ? U.rpm : tb.rpm || 0,
      /* extraction steam: the turbine on load (the extractions of the heaters open on load, PR-OPE-5002 4.6) */
      ext: tb.st === 'load' ? srcCl(ms / (0.2 * m0)) : 0,
      coal: U.F0 > 0 ? srcCl(((U.Fc || 0) - (U.unb || 0)) / U.F0) : 0,
      paf: srcBit(['M.3302']),
      saf: srcBit(['M.3303']),
      fab: srcBit(['M.3308', 'M.3309']),
      cep: srcBit(['M.3350', 'M.3351']),
      dop: AN_SRC.field.dop ? 1 : 0
    };
  /* cold reheat: the hot reheat pressure plus the reheater pressure drop (design 36.6 -> 35.1 kg/cm2 at MCR, SECT_7) */
  s.Pcrh = s.Prh * (36.6 / 35.1);
  /* oil header after the diesel oil pump (ABC-028 PICDO0005) and aux steam header (ABC-030 PICAS1005): sources of other loops */
  /* (never above their own source: the PV of that loop lags one scan, a new plant state must not see the old header) */
  s.Pdo = s.dop ? srcPv('ABC-028', 'PICDO0005') : 0;
  s.Paux = Math.min(srcPv('ABC-030', 'PICAS1005'), Math.max(s.Pms, s.Pcrh));
  /* no. 4 extraction to the deaerator (ABC-056 PT-TS1022 0 ~ 5 kg/cm2): proportional to the turbine steam (ASSUMED 4.5 at MCR) */
  s.Pext = 4.5 * s.ext * Math.min(1, ms / m0);
  AN_SRC.t = t;
  return (AN_SRC.st = s);
}
/* the rule of each loop: controller tag -> condition of its medium (loop map: loop number) */
const SRC_RULES = (() => {
  const R = {};
  /* loop 3, start-up burners: the diesel oil pump makes the header pressure; the burner pressure / flow / return line need it */
  R.PICDO0005 = s => ({ mul: s.dop, base: 0 });
  R.PICDO1008 = s => ({ cap: s.Pdo });
  for (const x of 'ABCD') {
    R['PICDO1043' + x] = s => ({ cap: s.Pdo });
    /* oil flow: needs header pressure (ASSUMED full flow from 3 kg/cm2) */
    R['FICDO1043' + x] = s => ({ mul: srcCl(s.Pdo / 3) });
    /* burner air: from the secondary air fan (HIC-SADBSx = SA damper of the burner) */
    R['FICFA1043' + x] = s => ({ mul: s.saf });
  }
  /* loop 4, fluidizing air: FA blower A / B running (ABC-014 M.3308 / M.3309) */
  R.FICFA1055A = s => ({ mul: s.fab });
  /* loop 6, furnace differential pressure: the bed is fluidized by the primary air (PA fan running) */
  R.DPICFG108 = s => ({ mul: s.paf });
  /* loop 7, SOx at the stack: from the coal that burns */
  R.AICFG10571 = s => ({ mul: s.coal });
  /* loop 11, bypass desuperheaters: the outlet temperature needs steam through the bypass (ASSUMED full from 3 % of the MCR flow) */
  /* TT-MS1022 is on the cold reheat side of the HP bypass: it also sees the HP turbine exhaust (03.png: 357.5 C at 150 MW with the
     bypass shut); TT-HR1012 after the LP bypass is kept warm by the warming valve XV-HR1010 while the hot reheat has pressure (DITL-83;
     snapshot 136 C with the LP bypass shut) */
  R.TICMS1022 = s => ({ mul: srcCl(Math.max(s.mhp, s.ms) / (0.03 * s.m0)), base: s.Tamb });
  R.TICHR1012 = s => ({ mul: srcCl(Math.max(s.qlp / (0.03 * s.m0), s.Prh / 5)), base: s.Tamb });
  /* loop 12, aux steam and sootblower: reducing stations from the main steam (and the cold reheat for the aux steam) */
  R.PICSB1052 = s => ({ cap: s.Pms });
  R.PICAS1005 = s => ({ cap: Math.max(s.Pms, s.Pcrh) });
  R.TICAS1001 = s => ({ mul: srcCl(s.Paux / 3), base: s.Tamb });
  R.TICAS1017 = s => ({ mul: srcCl(s.Paux / 3), base: s.Tamb });
  /* loop 13, condensate and deaerator: the condensate pump moves the water; the deaerator is heated by aux steam or extraction */
  R.FICCD1121 = s => ({ mul: s.cep });
  R.FICCD1120 = s => ({ mul: s.cep });
  R.LICCD1104 = s => ({ hold: !s.cep });
  R.LICCD1110A = s => ({ hold: !s.cep });
  R.PICCD1104 = s => ({ cap: Math.max(s.Paux, s.Pext) });
  /* loop 14, feedwater heaters: the drain level is the extraction steam that condenses (turbine on load) */
  for (const t of ['LICHD11051', 'LICHD11061', 'LICHD11011', 'LICHD11021', 'LICHD11031']) R[t] = s => ({ mul: s.ext });
  /* loop 15, turbine oil: the oil is heated by the bearings of the turning turbine */
  R.TICLO1002 = s => ({ mul: srcCl(s.rpm / 3600), base: s.Tamb });
  return R;
})();
/* plant.js: set the source of one loop for this scan (pr.smul / sbase / scap / shold), or clear it */
function anSrcSet(b, pr, S) {
  const s = srcState(S.rt.t),
    f = s && SRC_RULES[(b.txt || [])[1]];
  if (!f) {
    if (pr.src) pr.src = pr.smul = pr.sbase = pr.scap = pr.shold = undefined;
    return;
  }
  const r = f(s) || {};
  pr.src = 1;
  pr.smul = r.mul != null ? srcCl(r.mul) : undefined;
  pr.sbase = r.base;
  pr.scap = r.cap != null ? (isFinite(r.cap) ? Math.max(0, r.cap) : 0) : undefined;
  pr.shold = !!r.hold;
}
/* Start ▾ > Field equipment: the machines without a DCS signal */
function anField(k, on) {
  if (!(k in AN_SRC.field)) return false;
  AN_SRC.field[k] = !!on;
  AN_SRC.t = -1;
  return true;
}
