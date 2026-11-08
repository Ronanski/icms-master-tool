/* ===== FAULTS (3.2.1 e5 "Trip, recovery and faults", LISA): what the field does to the plant, for the trainer. A fault only changes the
   field side; the logic of the drawings decides what follows (never a scripted result). Every fault is cleared by "Clear" or by Reset.
   Group 1 - a transmitter fails: the AI of the I/O list goes to the end of its range (the I/O list "lo" / "hi" of the address) and its
   signal abnormal flag (the I/O list "SIG.AB" address, B.xxxx, the SIG.AB boxes of the ABC sheets) is set. The select circuits, the
   force-manual interlocks and the alarms of the drawings react to that flag and that value. The AI is held on every ABC sheet of its
   station (one address = one signal), so the plant model does not write it while the fault stands (plant.js: a forced AI output). ===== */
const AN_FAULT_LIST = [
  /* O2 analyzer A: the user's plant (O2 sensors often fail). I/O list STN101 AI0273 AT-FG1122 "#1 Boiler air preheater inlet flue gas O2
     analyzer (A)", 0 ~ 25 %, SIG.AB B.0671 (ABC-002, AICFG112 select with analyzer B AI0433 B.0701) */
  { id: 'ai.o2a.lo', g: 'ai', stn: 1, ai: 'AI0273', end: 'lo', t: 'O2 analyzer A (AT-FG1122) signal lost' },
  { id: 'ai.o2a.hi', g: 'ai', stn: 1, ai: 'AI0273', end: 'hi', t: 'O2 analyzer A (AT-FG1122) over range' },
  /* drum level transmitter 1: STN101 AI0130 LT-BR1001-1 "#1 Boiler drum level (1)", -422 ~ 820 mm, SIG.AB B.0642 (ABC-010, the
     2-out-of-3 / median select of LT-BR1001-1 / -2 / -3 with AI0258 B.066A and AI0386 B.068A) */
  { id: 'ai.dl1.lo', g: 'ai', stn: 1, ai: 'AI0130', end: 'lo', t: 'Drum level transmitter 1 (LT-BR1001-1) signal lost' },
  { id: 'ai.dl1.hi', g: 'ai', stn: 1, ai: 'AI0130', end: 'hi', t: 'Drum level transmitter 1 (LT-BR1001-1) over range' },
  /* main steam pressure: STN101 AI0131 PT-MS1002 "#1 Boiler finishing superheater outlet main steam pressure", 0 ~ 150 kg/cm2, SIG.AB
     B.0643 (ABC-001C boiler master, ABC-050 HP bypass) */
  { id: 'ai.msp.lo', g: 'ai', stn: 1, ai: 'AI0131', end: 'lo', t: 'Main steam pressure transmitter (PT-MS1002) signal lost' },
  { id: 'ai.msp.hi', g: 'ai', stn: 1, ai: 'AI0131', end: 'hi', t: 'Main steam pressure transmitter (PT-MS1002) over range' },
  /* Group 3 - a control valve sticks: the valve stays at the opening it had when it stuck; the controller keeps moving its output (wind-up)
     until the operator takes MANUAL. The valve of each controller: unit.js AN_AV (the valve sheets of the package index). Every valve model
     reads its opening through anAv (plant.js loop models, unit.js) */
  { id: 'cv.fw', g: 'cv', tag: 'FICFW1007', t: 'Feedwater control valve FCV-FW1130-1 (FICFW1007) stuck' },
  { id: 'cv.shs', g: 'cv', tag: 'TICBR1130', t: 'SH spray valve TCV-FW1110 (TICBR1130) stuck' },
  { id: 'cv.dea', g: 'cv', tag: 'LICCD1104', t: 'Deaerator level valve LCV-CD1104 (LICCD1104) stuck' }
];
/* the stuck valves: tag -> the opening it stays at (NaN until the next read takes the opening of that moment) */
const AN_FAULT_STUCK = {};
function anFaultStuck(tag, x) {
  if (!(tag in AN_FAULT_STUCK)) return null;
  if (!isFinite(AN_FAULT_STUCK[tag]) && isFinite(x)) AN_FAULT_STUCK[tag] = x;
  return isFinite(AN_FAULT_STUCK[tag]) ? AN_FAULT_STUCK[tag] : null;
}
const AN_FAULT_ON = {};
/* the I/O list record of the AI of a fault (range and SIG.AB address), read on a sheet of its station */
function anFaultRec(f) {
  const sh = AN.sheets.find(x => shStn(x) === f.stn);
  const r = sh && typeof adesFind === 'function' ? adesFind(sh, 'S' + f.stn + ' ' + f.ai) || adesFind(sh, f.ai) : null;
  return r && r.rec ? r.rec : null;
}
/* put one fault on the sheets (on = true) or take it off; the sheets of its station are built first, so the fault is on every sheet */
function anFaultPut(f, on) {
  const rec = anFaultRec(f);
  if (!rec || !isFinite(rec.lo) || !isFinite(rec.hi)) return 0;
  const x = f.end === 'hi' ? +rec.hi : +rec.lo,
    ab = String(rec.ab || '').trim();
  let n = 0;
  for (const sh of AN.sheets) {
    if (shStn(sh) !== f.stn || /ABC-000/.test(sh.name)) continue;
    try {
      if (!sh.S) ensure(sh);
    } catch (e) {}
    const S = sh.S;
    if (!S || !S.rt) continue;
    for (const b of S.blk) {
      if (b.k === 'AI' && b.o && b.o.length && String(nm(S, b.o[0]) || '').trim() === f.ai) {
        for (const o of b.o) {
          if (on) S.rt.force[o] = x;
          else delete S.rt.force[o];
        }
        n++;
      }
      if (ab && b.k === 'SIGAB' && (b.txt || []).some(t => String(t).trim() === ab)) {
        const st = S.rt.st[b.id] || (S.rt.st[b.id] = {});
        st.val = on ? 1 : 0;
        n++;
      }
    }
  }
  return n;
}
/* AN.fault(): the list with the state; AN.fault(id, true / false): a fault on / cleared; returns the text for the event log, or '' */
function anFault(id, on) {
  if (id == null) return AN_FAULT_LIST.map(f => ({ id: f.id, g: f.g, t: f.t, on: !!AN_FAULT_ON[f.id] }));
  const f = AN_FAULT_LIST.find(q => q.id === id);
  if (!f) return '';
  /* one end at a time: the other end of the same transmitter goes off first */
  if (f.g === 'cv') {
    if (on) AN_FAULT_STUCK[f.tag] = NaN;
    else delete AN_FAULT_STUCK[f.tag];
    if (on) AN_FAULT_ON[f.id] = 1;
    else delete AN_FAULT_ON[f.id];
    return on ? f.t + ' at its opening of this moment (the controller output moves on: take MANUAL)' : 'cleared: ' + f.t + ' (the valve follows its command again)';
  }
  if (on) for (const q of AN_FAULT_LIST) if (q !== f && q.g === f.g && q.ai === f.ai && AN_FAULT_ON[q.id]) anFault(q.id, false);
  const n = anFaultPut(f, !!on);
  if (!n) return '';
  if (on) AN_FAULT_ON[f.id] = 1;
  else delete AN_FAULT_ON[f.id];
  const rec = anFaultRec(f) || {};
  return (on ? f.t : 'cleared: ' + f.t) + (on ? ' (' + f.ai + ' = ' + (f.end === 'hi' ? rec.hi : rec.lo) + ' ' + (rec.u || '') + ', SIG.AB ' + (rec.ab || '-') + ')' : '');
}
/* Reset clears the field: every fault goes (the forces and the flags are cleared by the Reset itself) */
function anFaultClearAll() {
  for (const k in AN_FAULT_ON) delete AN_FAULT_ON[k];
  for (const k in AN_FAULT_STUCK) delete AN_FAULT_STUCK[k];
}
