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
    LOG.unshift({ t: tfmt(S.rt.t), sh: sh.name, kind, text, why });
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
      if (kind === 'm') add(S, sh, 'MODE', rest[0] + ' → ' + b);
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
  const TRO = new WeakMap();
  /* the TRIP output of a motor drawing ("SEAWATER PUMP A TRIP · CRT (ANN)"; not "TRIP COMMAND", not "TRIP INTERLOCK CONDITION",
     not "NOT TRIP"), and its RUNNING output */
  function motOuts(s) {
    let o = TRO.get(s);
    if (o && o.nl === s.nl) return o;
    o = { nl: s.nl, trip: null, run: null };
    try {
      for (const x of DUI.outs(s) || []) {
        const n = String(x.name || '');
        /* retest #37: not "NO TRIP PRESENT" (DITL-05: 1 when there is NO trip) */
        if (o.trip == null && /\bTRIP\b/.test(n) && !/COMMAND|INTERLOCK|NOT TRIP|NO TRIP|\bNO\b|\bCMD\b|RESET/.test(n)) o.trip = { row: x.row, name: n.replace(/^Output row \d+ · /, '').replace(/\s+[IO]\.\S+/g, '').replace(/\s*·.*$/, '').trim() };
        if (o.run == null && /RUNNING/.test(n) && !/NOT RUNNING|STOP|\bANY\b|LOCAL/.test(n)) o.run = { row: x.row };
      }
    } catch (e) {}
    /* a motor drawing only (a RUNNING output too): the MFT sheets have their own trip lines */
    if (!o.run) o.trip = null;
    TRO.set(s, o);
    return o;
  }
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
  const dnm = s => String((s && s.name) || '').replace(/^\(\d+\)/, '');
  /* the state of a motor drawing: 'TRIP' / 'RUN' / 'STOP' (null: no motor drawing, or the one world not built). The last state is
     kept while PAUSED (the drawing holds its values) */
  function motState(s) {
    if (!s || !window.DUI || !(window.WORLD && WORLD.on && WORLD.idx)) return null;
    try {
      if (!s.nl) s.nl = netlist(s);
      const o = motOuts(s);
      if (!o.trip && !o.run) return null;
      /* retest #34: a field trip (protection relay, dock FIELD TRIP) */
      if (s._ftrip) return 'TRIP';
      if (o.trip && DUI.outVal(s, o.trip.row) === 1) return 'TRIP';
      return o.run && DUI.outVal(s, o.run.row) === 1 ? 'RUN' : 'STOP';
    } catch (e) {
      return null;
    }
  }
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
  function grpRel(shn, t) {
    const A = window.AN,
      sh = A && A.sheets && A.sheets.find(s => s.name === shn);
    if (!sh || !/^ABC-/.test(shn)) return true;
    const g = GRP.findIndex(([re]) => re.test(sh.title || '')),
      on = (() => {
        try {
          return window.LS_DOCK && LS_DOCK.grpOn ? GRP[g][1].every(k => LS_DOCK.grpOn(k)) : false;
        } catch (e) {
          return false;
        }
      })();
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
        op = LOG.slice(0, 12).some(e => /^Operator: STOP /.test(e.text || '') && (e.text || '').includes(nm));
      if (op) continue;
      add({ rt: { t } }, { name: 'DCS' }, 'DCS', nm + ' STOPPED (' + a + ' = 0; not by the STOP button of the Training)');
    }
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
      t = cs && cs.S && cs.S.rt ? cs.S.rt.t : 0;
    /* a plant loaded again: a new table */
    if (A.startState !== base || t + 1 < lastT || almScan.reload) {
      almScan.reload = false;
      base = A.startState;
      AT.clear();
      NTS.clear();
      DSEEN.clear();
      for (const g in grpT) delete grpT[g];
      almScan.first = true;
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
          if (lv !== 'normal') now.set(sh.name + '|' + b.id, { sh: sh.name, kind: 'ALM', nm: A.nm(S, b.i[0]) || 'ALM #' + b.id, lv });
        }
    }
    if (window.WORLD && WORLD.on && WORLD.idx)
      for (const s of dSheets()) {
        if (!s.nl) continue;
        const fresh = !DSEEN.has(s.name);
        DSEEN.add(s.name);
        const o = motOuts(s);
        if (!o.trip && !s._ftrip) continue;
        if (motState(s) === 'TRIP')
          now.set('D|' + s.name, {
            sh: dnm(s),
            kind: 'TRIP',
            nm: o.trip ? o.trip.name.replace(/\s+TRIP$/, '') : dnm(s),
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
        const sd =
          first ||
          !!x.fresh ||
          (x.kind === 'ALM' &&
            /LOW/.test(x.lv) &&
            (A.startState === 'plantCold' || !!(e && e.sd && !e.rtn)) &&
            !grpRel(x.sh, t));
        AT.set(k, { ...x, t: tfmt(t), ack: sd, rtn: false, sd });
        if (first) nNew++;
        else if (!sd) add({ rt: { t } }, { name: x.sh }, x.kind, x.nm + ' ' + x.lv);
      }
    }
    /* retest #62: a group released (its equipment running for 10 min of plant time): its shutdown alarms still standing are real
       alarms now (NEW, logged), as a DCS releases the alarm suppression of a group after the start of its equipment */
    if (A.startState === 'plantCold')
      for (const [k, e] of AT)
        if (e.sd && !e.rtn && /^ABC-/.test(e.sh) && grpRel(e.sh, t)) { /* a DITL standing trip stays suppressed until it resets */
          e.sd = false;
          e.ack = false;
          add({ rt: { t } }, { name: e.sh }, e.kind, e.nm + ' ' + e.lv + ' (suppression released: equipment running)');
        }
    for (const [k, e] of AT)
      if (!now.has(k) && !e.rtn) {
        add({ rt: { t } }, { name: e.sh }, 'RTN', e.nm + ' ' + (e.kind === 'TRIP' ? 'TRIP reset' : 'back to normal'));
        if (e.ack) AT.delete(k);
        else e.rtn = true;
      }
    if (first && nNew) add({ rt: { t } }, { name: 'DCS' }, 'ALM', nNew + ' alarm' + (nNew > 1 ? 's' : '') + ' standing at the start: acknowledged and suppressed (shutdown state; listed apart in the alarm list of the header ALARM chip)');
  }
  function ack(k) {
    const L = k ? [k] : [...AT.keys()];
    let n = 0;
    const cs = window.AN && AN.sheets && AN.sheets[AN.i],
      t = cs && cs.S && cs.S.rt ? cs.S.rt.t : 0;
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
  setInterval(() => {
    try {
      tick();
    } catch (e) {}
    try {
      almScan();
    } catch (e) {}
  }, 500);
  window.lsEvents = LOG;
  /* 3.2.0-beta.6: an event from outside the ABC sheet on screen (the DITL first-out of the one world) */
  window.lsEventAdd = (shName, kind, text, why) => {
    const cs = window.AN && AN.sheets && AN.sheets[AN.i];
    add(cs && cs.S && cs.S.rt ? cs.S : { rt: { t: 0 } }, { name: shName }, kind, text, why);
  };
})();
