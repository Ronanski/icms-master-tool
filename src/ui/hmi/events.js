/* EVENT LOG (1.23.0, mockup v2): what changed while the simulation runs, with the simulation time: controller mode
   (AUTO / MAN / REMOTE), force manual signal of the drawing (on / off), alarm level (ALM blocks) and nets whose name says
   TRIP / MFT / STOP. Button "Events" in the status bar; read only. */
(function () {
  const $ = id => document.getElementById(id);
  const LOG = [],
    MAX = 400,
    TRIP = /TRIP|MFT|SHUT\s*DOWN|\bSTOP\b|ESD|EMERG|RUN\s*BACK/i;
  let prev = {},
    sheetK = '',
    unseen = 0;
  const tfmt = t => {
    t = Math.max(0, Math.round(t || 0));
    const h = Math.floor(t / 3600),
      m = Math.floor((t % 3600) / 60),
      s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0');
  };
  /* 3.2.0-beta.6 FIRST-OUT: at the moment a TRIP or a FORCE MANUAL appears, the cause is read at once (AN.why, src/ui/shell/why.js),
     before the plant moves on and other conditions also go 1: the inputs that are 1 at that scan are the first-out */
  const netOf = (S, name) => {
    for (let n = 0; n < S.nets.length; n++) if ((AN.nm(S, n) || '').trim() === name) return n;
    return -1;
  };
  const cause = (sh, name) => {
    try {
      const n = netOf(sh.S, name);
      return n >= 0 && AN.why ? AN.why(sh, n).lines.filter(l => l.d > 0) : null;
    } catch (e) {
      return null;
    }
  };
  function add(S, sh, kind, text, why) {
    LOG.unshift({ t: tfmt(AN.plantT ? AN.plantT() : S.rt.t), sh: sh.name, kind, text: words(text), why }); /* full names (WORDS) */
    if (LOG.length > MAX) LOG.length = MAX;
    unseen++;
    draw();
  }
  function snapshot(sh) {
    const S = sh.S,
      rt = S.rt,
      o = {};
    try {
      for (const c of AN.hmiCtrls(S) || []) {
        const st = c.amt && rt.st[c.amt.id];
        if (st) {
          const q = c.svSw && rt.st[c.svSw.id];
          o['m:' + c.tag] = st.pk !== c.autoLeg ? 'MAN' : c.remote && q && q.pk === 'A' ? 'REMOTE' : 'AUTO';
        }
        for (const z of c.sigs || []) if (z.role === 'MAN') o['f:' + c.tag + ':' + z.name] = rt.v[z.n] > 0.5 ? 1 : 0;
      }
    } catch (e) {}
    /* 3.2.0 retest #31: the ALM blocks are in the alarm table of the whole DCS (below), not of the sheet on screen */
    S.nets.forEach((x, n) => {
      if (!x.dig) return;
      const nm = AN.nm(S, n);
      if (nm && TRIP.test(nm)) o['t:' + nm] = rt.v[n] > 0.5 ? 1 : 0;
    });
    return o;
  }
  /* Mina S154-1 (beta.154 shutdown: HIC-BM and EIC-TM went MANUAL at the CCS release, 62.46 MW, M.2013 = 1, and the Event log had no
     line): the mode lines above come only from the ABC sheet on screen. The mode STATUS of every tag (.MAN / .LOC / .REM, ctrls.js
     MODEK: what M / A / R press and what the back-up command of the drawing writes, CLAUDE.md 10) is watched on every ABC sheet: a
     change writes "TAG → MAN / AUTO / REMOTE" once, with the cause (AN.why) of the .MAN net when it goes MAN */
  /* one line per mode change: the faceplate on screen (tick, the leg of the A/M station) and the mode status (modeAll) can see the
     same change one scan apart */
  const MODE_SEEN = new Map();
  const modeLine = (S, sh, tag, m, why) => {
    const r = MODE_SEEN.get(tag),
      t = Date.now();
    if (r && r.m === m && t - r.t < 3000) return;
    MODE_SEEN.set(tag, { m, t });
    add(S, sh, 'MODE', tag + ' → ' + m, why);
  };
  let MW = { key: '', tags: null, prev: {} };
  function modeTags() {
    /* the mode addresses of a tag are found by AN.modeNetsBy (engine/ctrls.js): by the name TAG.MAN / .LOC / .REM AND by the
       description wire of the drawing (ABC-001C HIC-BM .MAN is the wire "BOILER MASTER IN MANUAL"), the same addresses that
       M / A / R and the back-up command write. The tags are the faceplate tags (AN.faceTags: FACE PID / MAN / SUMA); only on a plant
       with every sheet built (else the walk would build sheets here) */
    const A = window.AN;
    if ((A.sheets || []).some(x => !x.S && !/^ABC-000/.test(x.name))) return null;
    const key = ((A && A.loadN) || 0) + ':' + A.sheets.map(x => (x.S && x.S.rt ? 1 : 0)).join('');
    if (MW.key === key && MW.tags) return MW.tags;
    const T = new Map(),
      tags = A.faceTags ? A.faceTags() : [];
    const shOf = S => A.sheets.find(x => x.S === S);
    for (const tag of tags) {
      const o = { MAN: [], LOC: [], REM: [] };
      let any = false;
      for (const k of ['MAN', 'LOC', 'REM'])
        try {
          for (const [S2, n] of A.modeNetsBy(tag, A.MODEK[k]) || []) {
            const sh = shOf(S2);
            if (sh && /^ABC-/.test(sh.name)) o[k].push([sh, n]), (any = true);
          }
        } catch (e) {}
      if (any) T.set(tag, o);
    }
    /* S154-5 (b142 save, RH 593 C): the RH spray TICHR1002 was forced MANUAL by the drawing (ABC-019 M.0170) and stayed MANUAL (rule
       10) while its .LOC stayed 1: the mode status alone missed it. A PID controller's mode is the leg of its A/M station, as on its
       faceplate (snapshot above): it wins over the status addresses */
    for (const sh of A.sheets) {
      if (!sh.S || !sh.S.rt || !/^ABC-/.test(sh.name)) continue;
      let L = [];
      try {
        L = A.hmiCtrls(sh.S) || [];
      } catch (e) {}
      for (const c of L) {
        if (!c.tag || !c.amt) continue;
        const o = T.get(c.tag) || { MAN: [], LOC: [], REM: [] };
        if (!o.c) o.c = [sh, c];
        T.set(c.tag, o);
      }
    }
    MW = { key, tags: T, prev: MW.key.split(':')[0] === key.split(':')[0] ? MW.prev : {} };
    return T;
  }
  function modeAll() {
    const A = window.AN;
    if (!A || !A.sheets || A._loading) return;
    const T = modeTags();
    if (!T) return;
    const on = L => L.some(([sh, n]) => sh.S && sh.S.rt && +(sh.S.ext.includes(n) && sh.S.rt.ext[n] !== undefined ? sh.S.rt.ext[n] : sh.S.rt.v[n]) > 0.5);
    for (const [tag, o] of T) {
      let m = '',
        cw = null;
      if (o.c) {
        const [csh, c] = o.c,
          rt = csh.S.rt,
          st = rt.st[c.amt.id],
          q = c.svSw && rt.st[c.svSw.id];
        if (st) {
          m = st.pk !== c.autoLeg ? 'MAN' : c.remote && q && q.pk === 'A' ? 'REMOTE' : 'AUTO';
          /* forced by the drawing: the cause is the force-manual signal that is on (its 1:B select line) */
          const z = (c.sigs || []).find(z => z.role === 'MAN' && rt.v[z.n] > 0.5);
          if (z) cw = [csh, z.n];
        }
      }
      if (!m) m = on(o.MAN) ? 'MAN' : on(o.REM) ? 'REMOTE' : on(o.LOC) || !o.LOC.length ? 'AUTO' : '';
      const a = MW.prev[tag];
      MW.prev[tag] = m;
      if (a === undefined || a === m || !m || !a) continue;
      const [sh, n] = cw || (m === 'MAN' ? o.MAN : m === 'REMOTE' ? o.REM : o.LOC.length ? o.LOC : o.MAN)[0] || [o.c[0], -1];
      let why = null;
      if (m === 'MAN' && n >= 0 && (cw || !o.c))
        try {
          why = AN.why ? AN.why(sh, n).lines.filter(l => l.d > 0) : null;
        } catch (e) {}
      modeLine(sh.S, sh, tag, m, why);
    }
  }
  function tick() {
    const sh = window.AN && AN.cat === 'an' && AN.sheets && AN.sheets[AN.i];
    if (!sh || !sh.S || !sh.S.rt) return;
    const S = sh.S;
    const now = snapshot(sh);
    if (sheetK !== sh.name) {
      sheetK = sh.name;
      prev = now;
      return;
    }
    for (const k in now) {
      const a = prev[k],
        b = now[k];
      if (a === undefined || a === b) continue;
      const [kind, ...rest] = k.split(':');
      if (kind === 'm') modeLine(S, sh, rest[0], b);
      else if (kind === 'f') add(S, sh, 'FM', rest[0] + (b ? ' FORCE MANUAL ← ' : ' force manual cleared ← ') + rest[1] + ' = ' + b, b ? cause(sh, rest[1]) : null);
      else if (kind === 't') add(S, sh, b ? 'TRIP' : 'RST', rest.join(':') + ' = ' + b, b ? cause(sh, rest.join(':')) : null);
    }
    prev = now;
  }
  /* ---------- 3.2.0 retest #31 #34: ONE alarm table of the whole DCS (every ABC sheet, PAUSED or RUN, and the TRIP output of every
     motor drawing of the DITL), as the alarm summary of a DCS: an alarm comes (ALM, flashing until ACK), is acknowledged (ACK) and
     returns (RTN); it leaves the table when it is back to normal AND acknowledged. Before, the header and the Event log read only
     the ABC sheet on screen: the furnace temperature LOW-LOW of ABC-057 "cleared" at RUN because the screen moved to a DITL sheet,
     and no ACK / RTN was ever logged. A plant loaded again (Cold, 150 MW: the plant time goes back) starts a new table; the alarms
     standing at that moment are one event (the list holds each of them). ---------- */
  const AT = new Map();
  let base = null,
    lastT = -1;
  /* TRO, motOuts: src/digital/parts/03c-read.js */
  const motOuts = s => DREAD.motOuts(s);
  /* R9 (beta.48 check): the DITL sheets already scanned since the load. A sheet built later (the sand DITL-777 SYSTEM TRIP = 1 on a cold
     plant: MFT / BOILER STOP and NOT REMOTE CONTROL, E10210-3-777) brings its standing trip as a shutdown alarm, not a NEW one */
  const DSEEN = new Set();
  const NTS = new Set(),
    NTO = new WeakMap();
  function ntOut(s) {
    let o = NTO.get(s);
    if (o !== undefined && (!o || o.nl === s.nl)) return o && o.x;
    o = { nl: s.nl, x: null };
    try {
      const x = (DUI.outs(s) || []).find(q => /\bNOT\s+TRIP\b/.test(String(q.name || '')));
      if (x) o.x = { row: x.row, name: String(x.name).replace(/^Output row \d+ · /, '').replace(/\s*·.*$/, '').replace(/\s*\bNOT\s+TRIP\b/, '').trim() };
    } catch (e) {}
    NTO.set(s, o);
    return o.x;
  }
  const dSheets = () => (typeof S !== 'undefined' && S.sheets ? S.sheets.concat((window.WORLD && WORLD.inst) || []) : []);
  /* the code of the sheet: "(L10)DITL-LS10" and "(D71)DITL-771" too (only digits were taken off before) */
  const dnm = s => String((s && s.name) || '').replace(/^\(\w+\)/, '');
  /* Mina beta.170 (Faults): the header said "DITL-19 TRIP · DITL-19" for the coal feeder (DITL-19 has no TRIP output: the name came from
     the sheet) and the events said PAF / SAF / IDF / FAB-A / CEP-A (rule: no acronyms as labels). The name of the equipment: the TRIP
     output, else the RUNNING output of the drawing, in words */
  /* Mina beta.175 (3.2.1-beta.178): the full names (no "ID fan", "PA fan", "BFWP A" either), for EVERY text of the log (add(): the
     faceplate and dock presses too, "Operator: START PAF (faceplate)") and of the alarm list. I/O list services: F-1056 induced draft
     fan, F-1053 primary air fan, F-1054 secondary air fan, F-1055A / B fluidizing air blower, P-1115A / B boiler feed water pump,
     P-1116A / B condensate pump */
  const WORDS = [
    [/\b(?:IDF|ID fan)\b/g, 'induced draft fan'],
    [/\b(?:SAF|SA fan)\b/g, 'secondary air fan'],
    [/\b(?:PAF|PA fan)\b/g, 'primary air fan'],
    [/\b(?:FAB-?|FA blower )([A-C])\b/g, 'fluidizing air blower $1'],
    [/\b(?:FAB|FA blower)\b/g, 'fluidizing air blower'],
    [/\bCEP-?([AB])\b/g, 'condensate pump $1'],
    [/\bCEP\b/g, 'condensate pump'],
    [/\bBFWP[- ]?([AB])\b/g, 'boiler feed water pump $1'],
    [/\bBFWP\b/g, 'boiler feed water pump'],
    /* Jennie 2026-11-08 (the rest of the motor drawings, from their titles): DITL-31 DIESEL OIL PUMP A, DITL-30 SEAWATER BOOSTER PUMP A,
       DITL-111 INDUSTRIAL WATER PUMP A, DITL-112 MAKE-UP WATER PUMP A, DITL-22 BFWP A AUX. LUB. OIL PUMP (its output rows say "AUX. LOP A") */
    [/\bDOP\b/g, 'diesel oil pump'],
    [/\bSWBP\b/g, 'seawater booster pump'],
    [/\bIWP\b/g, 'industrial water pump'],
    [/\bMWP\b/g, 'make-up water pump'],
    [/\bAUX\.\s*(?:LOP|LUB\.\s*OIL PUMP)/g, 'auxiliary lube oil pump'],
    [/\bLOP\b/g, 'lube oil pump'],
    [/\bLUB\.\s*OIL PUMP\b/g, 'lube oil pump'],
    [/\bLUB\.\s*OIL\b/g, 'lube oil']
  ];
  const words = x => WORDS.reduce((a, [re, w]) => a.replace(re, w), String(x || ''));
  /* an address of any kind (I. / M. / B. / O.: "O.0608 SYSTEM RUNNING" of DITL-771 gave "O.0608 SYSTEM") */
  const clean = x => String(x || '').replace(/^Output row \d+ · /, '').replace(/\s*·.*$/, '').replace(/\s*\b[IMBO]\.[0-9A-F]{4}\S*/g, '').trim();
  /* Jennie 2026-11-08: the drawings whose RUNNING / TRIP row has no equipment name ("SYSTEM", "VENT FILTER", "ROTOFEED"): the name
     from the drawing itself. DITL-771 / 777 title SAND INJECTION SYSTEM; DITL-774 rows 10 / 12 SAND SILO VENT FILTER RUNNING / TRIP;
     DITL-LS10 row 11 LIMESTONE SYSTEM READY; DITL-LS110 row 21 ROTOFEEDER RUNNING (F=MIR-LM1311); DITL-LS214 vent filter (F=MIR-LM1313,
     I/O list "Limestone silo vent fan running", DPS-LM1811 "limestone silo vent filter purge fault") */
  const EQN = {
    'DITL-771': 'SAND INJECTION SYSTEM',
    'DITL-777': 'SAND INJECTION SYSTEM',
    'DITL-774': 'SAND SILO VENT FILTER',
    'DITL-LS10': 'LIMESTONE SYSTEM',
    'DITL-LS110': 'LIMESTONE ROTOFEEDER',
    'DITL-LS214': 'LIMESTONE SILO VENT FILTER'
  };
  function eqName(s, o) {
    const fix = EQN[dnm(s).replace(/\s+#.*$/, '')];
    if (fix) return fix;
    if (o && o.trip) return words(clean(o.trip.name).replace(/\s+TRIP$/, ''));
    try {
      const r = (DUI.outs(s) || []).find(q => /\bRUNNING\b/.test(String(q.name || '')) && !/\bALL\b/.test(String(q.name || '')));
      if (r) return words(clean(r.name).replace(/\s*\bRUNNING\b.*$/, ''));
    } catch (e) {}
    return dnm(s);
  }
  /* motState: src/digital/parts/03c-read.js (DUI.motState, no DOM: the unit model reads it too) */
  const motState = s => DUI.motState(s);
  /* retest #62: the equipment group of an ABC sheet for the shutdown alarm suppression (the lamps of the Training dock, dock.js LAMPS):
     feedwater / condensate = the BFW pumps; steam, turbine, burners, furnace temperature, CCS = the boiler on coal; the rest (air,
     flue gas, furnace pressure) = the fans (ID fan, SA fan, PA fan and a fluidizing air blower). Released 10 min (plant time) after the
     whole group runs */
  const GRP = [
    [/DRUM LEVEL|FEED ?WATER|DEAERATOR|CONDENSATE|HOTWELL/i, ['BFWP']],
    [
      /STEAM|SUPERHEAT|REHEAT|TURBINE|BYPASS|HPH|LPH|CCS|MASTER|BURNER|FURNACE TEMP|LIMESTONE|BOTTOM ASH|OIL/i,
      ['COAL']
    ],
    [/./, ['IDF', 'SAF', 'PAF', 'FAB']]
  ];
  const grpT = {};
  const grpOn = g => {
    try {
      return window.LS_DOCK && LS_DOCK.grpOn ? GRP[g][1].every(k => LS_DOCK.grpOn(k)) : false;
    } catch (e) {
      return false;
    }
  };
  function grpRel(shn, t) {
    const A = window.AN,
      sh = A && A.sheets && A.sheets.find(s => s.name === shn);
    if (!sh || !/^ABC-/.test(shn)) return true;
    const g = GRP.findIndex(([re]) => re.test(sh.title || '')),
      on = grpOn(g);
    if (!on) {
      delete grpT[g];
      return false;
    }
    if (grpT[g] == null || grpT[g] > t) grpT[g] = t;
    return t - grpT[g] >= 600; /* plant seconds */
  }
  /* 3.2.0-beta.52 (live check #101: the IDF was found STOPPED with no event): a main motor that stops without the STOP of the operator
     is logged, so a stop never goes unseen */
  const MOT = { 'M.3304': 'IDF', 'M.3302': 'PAF', 'M.3303': 'SAF', 'M.3308': 'FAB-A', 'M.3309': 'FAB-B', 'M.3343': 'BFWP-A', 'M.3344': 'BFWP-B', 'M.3350': 'CEP-A', 'M.3351': 'CEP-B' },
    MOTP = new Map();
  /* 3.2.3 S148-3 (Mina beta.148 normal shutdown, 45 -> 30 MW: CEP A STOPPED by the logic, no cause in the Event log): the cause of a
     motor stop that the one world read at the scan where the STOPPED output went 1 (src/world/world.js s._stopWhy): the input rows that
     are 1, without "Input row n" and the addresses ("CONDENSER WATER LSLL-CD1110 LEVEL LOW LOW AND CONDENSER WATER LEVEL LL"). Not a
     stop push button (the operator's own line says it) and not a cause older than about 2 min of scans */
  /* an input line of a cause as the operator reads it (as stopWhy) */
  const cleanIn = x =>
    words(
      String(x || '')
        .replace(/^Input row \d+ · /, '')
        .replace(/\s*·\s*from the equipment.*$/, '')
        .replace(/\b[IMBO]\.[0-9A-F]{4}(\/[0-9A-F]{3,4})?\b/g, '')
        .replace(/\s*·\s*/g, ' ')
        .replace(/\s*=\s*1\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
  const MVLOG = new Set();
  /* the valve of a MOV drawing by its FULLY CLOSED output ("EXTRACTION STM NO.1 SHUT-OFF MOV FULLY CLOSED") and its tag (MV-TS1001) */
  const movName = (s, m) => {
    let nm = '';
    try {
      const o = (DUI.outs(s) || []).find(x => /FULLY CLOSED/.test(String(x.name || '')));
      nm = o ? String(o.name).replace(/^Output row \d+ · /, '').replace(/\s*·.*$/, '').replace(/\s+[IO]\.\S+/g, '').replace(/\s*FULLY CLOSED\s*/, ' ').trim() : '';
    } catch (e) {}
    return words(nm || dnm(s)) + (m && m.tag ? (/\bMOV\b/.test(nm) ? ' MV-' : ' ') + m.tag : '');
  };
  function stopWhy(s) {
    const w = s && s._stopWhy;
    if (!w || w.done || (window.WORLD && (WORLD.tk || 0) - w.tk > 400)) return null;
    const ins = w.lines.filter(l => l.d === 1 && l.k === 'input');
    const txt = (ins.length ? ins : w.lines.slice(0, 1))
      .slice(0, 3)
      .map(l =>
        words(
          String(l.txt || '')
            .replace(/^Input row \d+ · /, '')
            .replace(/\s*·\s*from the equipment.*$/, '')
            .replace(/\b[IMBO]\.[0-9A-F]{4}(\/[0-9A-F]{3,4})?\b/g, '')
            .replace(/\s*·\s*/g, ' ')
            .replace(/\s*=\s*1\s*$/, '')
            .replace(/\s+/g, ' ')
            .trim()
        )
      )
      .join(' AND ');
    if (!txt || /\bSTOP\s*(PB|P\.B\.?|PUSH)/i.test(txt)) return null;
    return { txt, lines: w.lines, src: w };
  }
  function motScan(t) {
    const LV = window.LS_LIVE;
    if (!LV || !LV.val) return;
    for (const a in MOT) {
      let v = null;
      try {
        v = +LV.val(a) > 0.5 ? 1 : 0;
      } catch (e) {}
      if (v == null) continue;
      const was = MOTP.get(a);
      MOTP.set(a, v);
      if (was !== 1 || v !== 0) continue;
      const nm = MOT[a],
        op = LOG.slice(0, 12).some(e => /^Operator: STOP /.test(e.text || '') && ((e.text || '').includes(nm) || (e.text || '').includes(words(nm))));
      if (op) continue;
      /* S148-3: the cause the one world read at the scan of the stop (src/world/world.js s._stopWhy) */
      let ds = null;
      try {
        ds = window.LS_DOCK && LS_DOCK.dOf ? LS_DOCK.dOf(a) : null;
      } catch (e) {}
      const w = stopWhy(ds);
      if (w) {
        w.src.done = true;
        add({ rt: { t } }, { name: 'DCS' }, 'DCS', words(nm) + ' STOPPED by its logic: ' + w.txt + ' (' + a + ' = 0)', w.lines);
        continue;
      }
      add({ rt: { t } }, { name: 'DCS' }, 'DCS', words(nm) + ' STOPPED (' + a + ' = 0; not by the STOP button of the Training)');
    }
  }
  /* the service text of a tag from the I/O list (window.WIRING: the tag is the 4th column, the service the 5th): first letter + system + number
     (FIFA1079 = FT-FA1079, LIHD11021 = LT-HD1102-1, TIFG1090C = TE-FG1090-C, PIST10012 = PT-ST1001-B); the transmitter's own suffix is
     kept when the list has it, else the plain service of that point */
  let WD = null;
  function ioDesc(tag) {
    if (!WD) {
      WD = new Map();
      for (const r of window.WIRING || []) {
        const m = /^([A-Z])[TE]-([A-Z]{2}\d{4})-?(\w?)/.exec(r[3] || '');
        if (!m || !r[4]) continue;
        const k = m[1] + m[2];
        if (m[3] && !WD.has(k + m[3])) WD.set(k + m[3], String(r[4]));
        if (!WD.has(k)) WD.set(k, String(r[4]));
      }
    }
    const m = /^([A-Z])[A-Z]([A-Z]{2}\d{4})(\w?)/.exec(tag || '');
    if (!m) return '';
    const k = m[1] + m[2],
      n = /^\d$/.test(m[3]) ? 'ABCD'[+m[3] - 1] : '';
    return WD.get(k + m[3]) || (n && WD.get(k + n)) || WD.get(k) || '';
  }
  function almName(b) {
    const tag = b.txt && b.txt[1];
    if (!tag || !/^[A-Z]{2,}/.test(tag)) return '';
    const d = ioDesc(tag);
    return d ? tag + ' ' + d : tag;
  }
  const MSEEN = new Map();
  /* sweep 2: the suppressed alarms already written once since the load */
  const LATEK = new Set();
  /* transmitters that the drawing alarms by comparators (not by an ALM block): tag, sheet, AI address, limits (kg/cm2) */
  /* Mina B66-3 (beta.66 house load: hotwell -1 to -285 mm, then condensate pump A stopped with no alarm before it): ABC-031 has no ALM block
     on the hotwell level AI0640 (LT-CD1110, -436 ~ 464 mm), only the comparator < -300 mm M.3211 WATER LEVEL LOW LOW to DITL-61A row 13 (the
     condensate pump stop). The alarm list (Alarm List _20160912, unit.js AN_CD) gives LT-CD1110 H 150 / HH 300, L -150 / LL -300 mm */
  const XALM = [
    { tag: 'PIMS1002', d: 'main steam pressure (PT-MS1002, finishing superheater outlet header)', sh: 'ABC-001C', ai: 'AI0131', hh: 134, h: 130, l: 100, ll: 72.9 },
    { tag: 'LICD1110', d: 'condenser hotwell level (LT-CD1110)', sh: 'ABC-031', ai: 'AI0640', hh: 300, h: 150, l: -150, ll: -300 }
  ];
  /* level switches of the field with no ABC alarm block: tag, DITL sheet, 0-based input row */
  const SWALM = [{ tag: 'LSLL-CD1104-4', d: 'deaerator storage tank water level low-low switch', sh: 'DITL-23B', row: 3 }];
  function xalmVal(A, p) {
    const sh = A.sheets.find(x => x.name === p.sh),
      S = sh && sh.S;
    if (!S || !S.rt) return NaN;
    if (p.S !== S) {
      const b = S.blk.find(z => z.k === 'AI' && z.o && z.o.length && String(A.nm(S, z.o[0]) || '').replace(/^S\d\s*/, '').trim() === p.ai);
      p.S = S;
      p.n = b ? b.o[0] : -1;
    }
    return p.n >= 0 ? +S.rt.v[p.n] : NaN;
  }
  function almScan() {
    const A = window.AN;
    if (!A || !A.sheets || (A.plantOn && !A.startState)) return;
    /* retest #54 #35: no scan while a starting state loads in slices (hmi-op.js anLoadStart): the half-loaded plant gave NEW alarms;
       the first scan after the load starts a new table */
    if (A._loading) {
      almScan.reload = true;
      return;
    }
    const cs = A.sheets[A.i] || A.sheets[0],
      t = A.plantT ? A.plantT() : cs && cs.S && cs.S.rt ? cs.S.rt.t : 0;
    /* a plant loaded again: a new table */
    if (A.startState !== base || t + 1 < lastT || almScan.reload) {
      almScan.reload = false;
      base = A.startState;
      AT.clear();
      NTS.clear();
      DSEEN.clear();
      MSEEN.clear();
      LATEK.clear();
      for (const g in grpT) delete grpT[g];
      /* S160 (deaerator level LOW of the b142 save point at 150 MW logged "suppressed: the equipment of its group is stopped" while
         both feed pumps ran, released 10 min later): a save point is a plant that was already running. A group whose equipment runs
         at the load of a save point is released at once (its 10 min of running are behind it); a group stopped there is suppressed
         as before */
      if (almScan.svPre) GRP.forEach((x, g) => grpOn(g) && (grpT[g] = t - 600));
      almScan.svLoad = !!almScan.svPre;
      almScan.svPre = false;
      almScan.first = true;
      almScan.tk0 = (window.WORLD && WORLD.tk) || 0;
      MOTP.clear();
    }
    lastT = t;
    motScan(t);
    const now = new Map();
    for (const sh of A.sheets) {
      const S = sh.S;
      if (!S || !S.rt) continue;
      for (const b of S.blk)
        if (b.k === 'ALM' && b.i && b.i[0] >= 0) {
          let lv = 'normal';
          try {
            lv = A.almLv(b, S.rt.v[b.i[0]]);
          } catch (e) {}
          /* Mina F2: the name of the alarm is the tag on the ALM block and its description, not the name of the net before it ("SQRT out", "AI0674") */
          if (lv !== 'normal') now.set(sh.name + '|' + b.id, { sh: sh.name, kind: 'ALM', nm: almName(b) || A.nm(S, b.i[0]) || 'ALM #' + b.id, lv });
        }
    }
    /* Mina #M15: the expansion tank T-1109 HIGH level (alarm list LT-CW1109, PD-021: H 1700 mm / L 800 mm in the DCS): the level is the
       plant model's (unit.js etAlm, LICW1109), no ABC alarm block reads it. HIGH only: the cold tank stands at L (0.8 m), a shutdown alarm */
    if (A.unit && A.unit.etAlm === 'H') now.set('U|LICW1109', { sh: 'MAKE-UP WATER', kind: 'ALM', nm: 'LICW1109 expansion tank T-1109 level', lv: 'HIGH' });
    /* Mina beta.173 (Faults: main steam pressure transmitter over range, PT-MS1002 = 150.0, no alarm): no ALM block reads AI0131. The
       drawing alarms it with comparators on ABC-001C (> 134 O.0177, > 130 M.3109, < 100 M.310A, < 72.9 M.310D) into the annunciator
       DITL-40 (MAIN STEAM PRESSURE H.H. / HIGH / LOW / LOW LOW); the alarm list has the same set points for PT-MS1002 (HH 134, H 131 / 130,
       L 100, LL 72.9 kg/cm2). The header alarm from the transmitter value of ABC-001C with those limits */
    for (const p of XALM) {
      const x = xalmVal(A, p);
      if (!isFinite(x)) continue;
      const lv = x > p.hh ? 'HIGH-HIGH' : x > p.h ? 'HIGH' : x < p.ll ? 'LOW-LOW' : x < p.l ? 'LOW' : null;
      if (lv) now.set('X|' + p.tag, { sh: p.sh, kind: 'ALM', nm: p.tag + ' ' + p.d, lv });
    }
    /* S155-1 (deaerator emptied, both feed pumps tripped, no deaerator LOW-LOW line before the trip): the alarm list (Alarm List
       _20160912, sheet LS) has the switch LSLL-CD1104-4 "DEAERATOR STORAGE TANK WATER LEVEL LOW-LOW SWITCH-4" at 177 mm from the bottom
       (-2147 mm of the transmitter, plantsw.js), above the transmitter LL -2174 mm of LT-CD1104-1 ~ 3 (ABC-031 ALM): the switch comes
       first. It is DITL-23B row 4 (the feed pump trip) and the annunciator DITL-40 "LEVEL SWITCH LOW LOW"; its own alarm line from row 4 */
    for (const p of SWALM) {
      const s = dSheets().find(z => dnm(z) === p.sh);
      let v = null;
      try {
        v = s ? DUI.rowVal(s, p.row) : null;
      } catch (e) {}
      if (v === 1) now.set('W|' + p.tag, { sh: p.sh, kind: 'ALM', nm: p.tag + ' ' + p.d, lv: 'LOW-LOW' });
    }
    if (window.WORLD && WORLD.on && WORLD.idx)
      for (const s of dSheets()) {
        if (!s.nl) continue;
        const fresh = !DSEEN.has(s.name);
        const seen0 = !fresh; /* Mina beta.121: the units that run on the 150 MW snapshot showed STOP until the first RUN scan, then "started by its logic" */
        /* seen only once the world has scanned it twice since the load (Mina #M1, Worker: the page scans the alarms before the first
           patch of the engine brings the cold DITL-777 trip, so the sheet was "seen" without it and its standing trip came as NEW) */
        if (((WORLD.tk || 0) - (almScan.tk0 || 0)) >= 2 || (WORLD.tk || 0) < (almScan.tk0 || 0)) DSEEN.add(s.name);
        /* Sakura beta.150 (Jennie's list): a MOV of a drawing moved by its logic had no line (MV-TS1001 closed by ABC-036 M.0203 No.2 HPH
           level HI-HI). The one world reads the cause at the scan where the OPEN / CLOSE command of the valve rises (src/world/world.js
           s._mvWhy, no push button in it); one line each, by its scan (the engine sends the list again with each patch) */
        for (const w of s._mvWhy || []) {
          const id = s.name + '|' + w.tk + '|' + w.i + '|' + w.k;
          if (MVLOG.has(id) || (window.WORLD && (WORLD.tk || 0) - w.tk > 1200)) continue;
          MVLOG.add(id);
          const ins = (w.lines || []).filter(l => l.d === 1 && l.k === 'input');
          const txt = ins
            .filter(l => !/\b(REMOTE|AUTO MODE|MANUAL MODE|FULLY (OPEN|CLOSED))\b/.test(String(l.txt || '')) || ins.length < 2)
            .sort((a, b) => +/HI-HI|HIGH-HIGH|LOW-LOW|\bHH\b|\bLL\b|TRIP/.test(String(b.txt)) - +/HI-HI|HIGH-HIGH|LOW-LOW|\bHH\b|\bLL\b|TRIP/.test(String(a.txt)))
            .slice(0, 3)
            .map(l => cleanIn(l.txt))
            .join(' AND ');
          /* MOVs only: a solenoid valve of a sequence (sootblower drain SOV XV-SB1054) opens and closes by its own command at each step */
          const vn = movName(s, (s.nl.mv || [])[w.i]);
          if (txt && /\bMOV\b/.test(vn)) add({ rt: { t } }, { name: dnm(s) }, 'DCS', vn + ' ' + (w.k === 'close' ? 'CLOSE' : 'OPEN') + ' by its logic: ' + txt, w.lines);
        }
        const o = motOuts(s);
        if (!o.trip && !s._ftrip) continue;
        /* Mina F12: a motor that starts by its logic (the auto cut-in of a standby, a low header) has its own line: no press of the operator or the
           field operator on this drawing in the last lines */
        const ms = motState(s),
          ms0 = MSEEN.get(s.name);
        MSEEN.set(s.name, ms);
        if (seen0 && ms0 === 'STOP' && ms === 'RUN' && !LOG.slice(0, 12).some(e => e.sh === dnm(s) && /START/.test(e.text || '')))
          add({ rt: { t } }, { name: dnm(s) }, 'DCS', eqName(s, o) + ' started by its logic (auto start)');
        /* S148-3: a motor of any drawing stopped by its logic (not the ones of motScan above, they wrote it already) */
        if (seen0 && ms0 === 'RUN' && ms === 'STOP' && !LOG.slice(0, 12).some(e => e.sh === dnm(s) && /STOP/.test(e.text || ''))) {
          const w = stopWhy(s);
          if (w) {
            w.src.done = true;
            add({ rt: { t } }, { name: dnm(s) }, 'DCS', eqName(s, o) + ' stopped by its logic: ' + w.txt, w.lines);
          }
        }
        if (motState(s) === 'TRIP')
          now.set('D|' + s.name, {
            sh: dnm(s),
            kind: 'TRIP',
            nm: eqName(s, o),
            lv: 'TRIP',
            fresh
          });
      }
    /* R9 #80: a "NOT TRIP" output (DITL-43 row 5 AIR PREHEATER NOT TRIP, 1 = healthy) is an alarm when it falls to 0 after it was
       healthy: "AIR PREHEATER TRIP". Before: its rise (the field contact made healthy) was logged as a trip */
    if (window.WORLD && WORLD.on && WORLD.idx)
      for (const s of dSheets()) {
        if (!s.nl) continue;
        const o = ntOut(s);
        if (!o) continue;
        let v = null;
        try {
          v = DUI.outVal(s, o.row);
        } catch (e) {}
        if (v === 1) NTS.add(s.name);
        else if (v === 0 && NTS.has(s.name)) now.set('N|' + s.name, { sh: dnm(s), kind: 'TRIP', nm: o.name, lv: 'TRIP' });
      }
    const first = !!almScan.first;
    almScan.first = false;
    /* Mina, live test of 270: alarms standing at a load read 0:00 while the clock read 10:37: the first scan came before the clock of the
       start state. They take the clock of the state when it arrives */
    if (t >= 1 && A.startState !== 'plantCold')
      for (const e of AT.values())
        if (e.t0) {
          e.t = tfmt(t);
          e.t0 = false;
        }
    let nNew = 0;
    for (const [k, x] of now) {
      const e = AT.get(k);
      if (!e || e.rtn || e.lv !== x.lv) {
        /* retest #35: the alarms standing when the plant is loaded (a cold unit: no flow, no pressure, the equipment stopped) come
           acknowledged and SUPPRESSED (sd: shutdown state, as the alarm suppression of a DCS after a shutdown): not counted in the
           header, listed apart. Back to normal (the equipment runs) = gone; any later alarm of the same point is a new one.
           Retest #62 (the suppression "expired" at t = 1:00: AI0579 / AI0627 air temperature LOW came while nothing was started, the
           air cooling to the ambient 30 °C): the suppression belongs to the equipment group of the sheet, not to the moment of the
           load. A LOW / LOW-LOW alarm of a group whose equipment is stopped is suppressed (a shutdown alarm), also when it comes
           later or changes level; a HIGH alarm or a TRIP always comes through */
        /* Mina F6: the unit loaded at 150 MW is running: nothing there is a shutdown alarm. What stands at that load is a real standing alarm:
           acknowledged (the operator did not cause it now), counted and listed, a HIGH never hidden */
        /* S160: an alarm standing at the load of a save point in a group that runs there is a real standing alarm (as at the 150 MW
           load), not a shutdown alarm */
        const svRel = !!almScan.svLoad && x.kind === 'ALM' && /^ABC-/.test(x.sh) && grpRel(x.sh, t),
          atLoad = A.startState === 'plantLoad150' || svRel,
          stand = atLoad && (first || !!x.fresh);
        const sd =
          (!atLoad && (first || !!x.fresh)) ||
          (x.kind === 'ALM' &&
            /LOW/.test(x.lv) &&
            (A.startState === 'plantCold' || !!(e && e.sd && !e.rtn)) &&
            !grpRel(x.sh, t));
        /* live test #11 (94 at the start, 96 in the header later, "standing since the plant was loaded"): an alarm suppressed after the
           load (its group still stopped) is marked late and logged, so the count and the text say where it came from */
        const late = sd && !first && !(e && e.sd && !e.rtn && !e.late) ? true : !!(e && e.late && sd);
        AT.set(k, { ...x, nm: words(x.nm), t: tfmt(t), ack: sd || stand, rtn: false, sd, late, t0: first && t < 1 });
        if (first) nNew++;
        else if (stand) continue;
        else if (!sd) add({ rt: { t } }, { name: x.sh }, x.kind, x.nm + ' ' + x.lv);
        /* sweep 2 (Mina F35: the event count climbed at rest, 86 -> 206 with one real alarm): a suppressed LOW of a stopped group that
           comes and goes around its limit (the ALM compare has no hysteresis, panel.js almLv; no hysteresis value in the DCS textbook:
           none is invented) wrote this line and a "back to normal" at every crossing. Now once per point per load (LATEK) */
        else if (late && (!e || e.rtn) && !LATEK.has(k)) {
          LATEK.add(k);
          add({ rt: { t } }, { name: x.sh }, x.kind, x.nm + ' ' + x.lv + ' (suppressed: the equipment of its group is stopped; released 10 min after it runs)');
        }
      }
    }
    /* retest #62: a group released (its equipment running for 10 min of plant time): its shutdown alarms still standing are real
       alarms now (NEW, logged), as a DCS releases the alarm suppression of a group after the start of its equipment */
    if (A.startState === 'plantCold')
      for (const [k, e] of AT)
        if (e.sd && !e.rtn && /^ABC-/.test(e.sh) && grpRel(e.sh, t)) { /* a DITL standing trip stays suppressed until it resets */
          e.sd = false;
          e.ack = false;
          e.t = tfmt(t); /* live check #106: the time it comes as a real alarm (before: the load time, "at 0:00") */
          add({ rt: { t } }, { name: e.sh }, e.kind, e.nm + ' ' + e.lv + ' (suppression released: equipment running)');
        }
    for (const [k, e] of AT)
      if (!now.has(k) && !e.rtn) {
        /* sweep 2: a suppressed alarm (sd) that clears writes no line: it was never announced (its first line, if any, is LATEK) */
        /* Mina, live test of 272: a "back to normal - 0:00" line while a plant loads: nothing returns before the plant has a clock */
        if (t >= 1 && !(e.sd && e.kind === 'ALM')) add({ rt: { t } }, { name: e.sh }, 'RTN', e.nm + ' ' + (e.kind === 'TRIP' ? 'TRIP reset' : 'back to normal'));
        if (e.ack) AT.delete(k);
        else e.rtn = true;
      }
    if (first && nNew) add({ rt: { t } }, { name: 'DCS' }, 'ALM', savedAs ? nNew + ' alarm' + (nNew > 1 ? 's' : '') + ' standing when the save point ' + savedAs + ' was loaded: acknowledged, in the alarm list' : A.startState === 'plantLoad150' ? nNew + ' alarm' + (nNew > 1 ? 's' : '') + ' standing when the unit was loaded at 150 MW: acknowledged, in the alarm list' : nNew + ' alarm' + (nNew > 1 ? 's' : '') + ' standing at the start: acknowledged and suppressed (shutdown state; listed apart in the alarm list)');
  }
  function ack(k) {
    const L = k ? [k] : [...AT.keys()];
    let n = 0;
    const cs = window.AN && AN.sheets && AN.sheets[AN.i],
      t = window.AN && AN.plantT ? AN.plantT() : cs && cs.S && cs.S.rt ? cs.S.rt.t : 0;
    for (const j of L) {
      const e = AT.get(j);
      if (!e || e.ack) continue;
      e.ack = true;
      n++;
      if (k) add({ rt: { t } }, { name: e.sh }, 'ACK', e.nm + ' ' + e.lv);
      if (e.rtn) AT.delete(j);
    }
    if (!k && n) add({ rt: { t } }, { name: 'DCS' }, 'ACK', n + ' alarm' + (n > 1 ? 's' : '') + ' acknowledged (ACK ALL)');
    return n;
  }
  window.lsAlarms = {
    list: () => [...AT.entries()].map(([k, e]) => ({ k, ...e })),
    ack,
    unacked: () => [...AT.values()].filter(e => !e.ack).length,
    /* retest #35: the alarms suppressed at the start (shutdown state) */
    suppressed: () => [...AT.values()].filter(e => e.sd && !e.rtn).length,
    motState,
    /* R9 #87: a NOT TRIP output that was healthy and is 0 now (the air preheater trip on the new HMI) */
    ntTrip: s => {
      try {
        const o = s && ntOut(s);
        return !!(o && NTS.has(s.name) && DUI.outVal(s, o.row) === 0);
      } catch (e) {
        return false;
      }
    },
    /* the state of the motor of a memory address of the ABC sheets (M.3353) or of a DITL drawing name */
    motOf: a => {
      try {
        const s = window.LS_DOCK && LS_DOCK.dOf(a);
        return s ? motState(s) : null;
      } catch (e) {
        return null;
      }
    }
  };
  let btn = null,
    box = null;
  function draw() {
    if (btn) {
      btn.textContent = 'Events' + (LOG.length ? ' ' + LOG.length : '');
      btn.classList.toggle('new', unseen > 0 && !(box && box.style.display === 'block'));
    }
    if (!box || box.style.display !== 'block') return;
    box.innerHTML = '';
    const hd = document.createElement('div');
    hd.className = 'evh';
    hd.innerHTML = '<b>Event log</b><span>' + LOG.length + ' (simulation time)</span>';
    const clr = document.createElement('button');
    clr.className = 'b';
    clr.textContent = 'Clear';
    clr.onclick = () => {
      LOG.length = 0;
      unseen = 0;
      draw();
    };
    hd.append(clr);
    box.append(hd);
    if (!(window.WORLD && WORLD.on)) {
      const n = document.createElement('div');
      n.className = 'evr evn';
      n.textContent = 'DITL trips (MFT, fan / pump trips) and their first-out are logged while the ABC and DITL run as one.';
      box.append(n);
    }
    if (!LOG.length) {
      const d = document.createElement('div');
      d.className = 'evr';
      d.textContent = 'No events yet. Press Run: mode changes, force manual, alarms and trips appear here.';
      box.append(d);
    }
    for (const e of LOG) {
      const d = document.createElement('div');
      d.className = 'evr k-' + e.kind;
      d.innerHTML = '<span class="tm"></span><span class="kd"></span><span class="sh"></span><span class="tx"></span>';
      d.children[0].textContent = e.t;
      d.children[1].textContent = e.kind;
      d.children[2].textContent = e.sh;
      d.children[3].textContent = e.text;
      box.append(d);
      if (e.why && e.why.length) {
        /* the cause, captured when it happened (first-out); click the row to show / hide it */
        const w = document.createElement('div');
        w.className = 'evw';
        w.hidden = !e.open;
        for (const l of e.why) {
          const r = document.createElement('div');
          r.className = 'evwr k-' + l.k;
          r.style.paddingLeft = 0.25 + (l.d - 1) * 0.75 + 'rem';
          r.textContent = l.txt + (l.sh && l.sh !== e.sh ? '  [' + l.sh + ']' : '');
          w.append(r);
        }
        const tg = document.createElement('span');
        tg.className = 'evwhy';
        tg.textContent = e.open ? 'cause ▾' : 'cause ▸';
        d.children[3].append(' ', tg);
        d.classList.add('hasw');
        d.onclick = () => {
          e.open = !e.open;
          draw();
        };
        box.append(w);
      }
    }
  }
  function mount() {
    const foot = $('sfoot');
    if (!foot || btn) return !!btn;
    btn = document.createElement('button');
    btn.id = 'evbtn';
    btn.className = 'b an-only';
    btn.title = 'Event log: mode, force manual, alarm, trip (simulation time)';
    box = document.createElement('div');
    box.id = 'evbox';
    btn.onclick = e => {
      e.stopPropagation();
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
      unseen = 0;
      draw();
    };
    /* Mina 2026-11-08 (findings 11-08 #4 / #6): Escape closes the event log, as the other pop-ups */
    addEventListener('keydown', e => e.key === 'Escape' && box.style.display === 'block' && (box.style.display = 'none'));
    const st = $('st');
    foot.insertBefore(btn, st);
    document.body.append(box);
    draw();
    return true;
  }
  const iv = setInterval(() => {
    try {
      if (mount()) clearInterval(iv);
    } catch (e) {}
  }, 500);
  /* Mina T2, 3.2.3-beta.1: a new starting state (150 MW, Cold, a save point) or a Reset that takes the plant time back starts a new log;
     the trips of the run before no longer mix with the new run (the same test as the trend recorder, live.js) */
  let ldN = -1,
    ldT = -1,
    savedAs = '';
  const newRun = () => {
    const n = (window.AN && AN.loadN) || 0,
      t = window.AN && AN.plantT ? +AN.plantT() : NaN;
    const back = isFinite(t) && ldT >= 0 && t + 1 < ldT;
    if (ldN >= 0 && (n !== ldN || back)) {
      LOG.length = 0;
      unseen = 0;
      prev = {};
      sheetK = '';
      if (n !== ldN) savedAs = '';
      draw();
    }
    ldN = n;
    if (isFinite(t)) ldT = t;
  };
  setInterval(() => {
    try {
      newRun();
    } catch (e) {}
    try {
      tick();
    } catch (e) {}
    try {
      modeAll();
    } catch (e) {}
    try {
      almScan();
    } catch (e) {}
  }, 500);
  /* Mina S154-2 (beta.154: after LOAD of the 73.5 MW save point the log said "alarms standing when the unit was loaded at 150 MW", and
     the "Save point loaded" line was gone or twice): a save point keeps the starting state of its run (AN.startState 'plantLoad150') and
     the plant time goes back, so the log was cleared AFTER its own line and the standing alarms were told as a 150 MW load. Now the load
     of a save point starts a new log and a new alarm table at once, writes ONE line, and the standing alarms name the save point */
  window.lsEventsLoaded = name => {
    /* the line-up of a save point from an older version (ditl150.js faLineup) is written while the save is put back, before this
       call: kept, it belongs to this load (Mina S160: the FA blower line-up of beta.156 never showed) */
    const keep = LOG.filter(e => /^Save point from an older version/.test(String(e.text || '')));
    LOG.length = 0;
    unseen = 0;
    prev = {};
    sheetK = '';
    MW.prev = {};
    savedAs = String(name || '');
    ldN = (window.AN && AN.loadN) || 0;
    const t = window.AN && AN.plantT ? +AN.plantT() : NaN;
    if (isFinite(t)) ldT = t;
    almScan.reload = true;
    almScan.svPre = true;
    window.lsEventAdd('DCS', 'DCS', 'Save point loaded: ' + savedAs);
    LOG.unshift(...keep);
  };
  window.lsEvents = LOG;
  /* Mina B96-1: the alarm list (shellc-home.js) stamps its rows with the same plant clock and format as this log */
  window.lsTfmt = tfmt;
  /* 3.2.0-beta.6: an event from outside the ABC sheet on screen (the DITL first-out of the one world) */
  window.lsEventAdd = (shName, kind, text, why) => {
    const cs = window.AN && AN.sheets && AN.sheets[AN.i];
    /* Jennie 2026-11-08: a TRIP / reset line of a drawing whose output has no equipment name (DITL-LS214 "VENT FILTER TRIP OR RUN
       FAULT", DITL-777 "SYSTEM TRIP") starts with the name of its equipment (EQN) */
    const eq = EQN[String(shName || '').replace(/^\(\w+\)/, '').replace(/\s+#.*$/, '')];
    if (eq && /^(TRIP|RST)$/.test(kind) && String(text || '').indexOf(eq) < 0) text = eq + ': ' + text;
    add(cs && cs.S && cs.S.rt ? cs.S : { rt: { t: 0 } }, { name: shName }, kind, text, why);
  };
})();
