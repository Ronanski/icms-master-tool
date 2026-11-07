/* 3.2.1 plan c4: the generator side of the ATS steps 4 and 5: field switch 41 and AVR (G-4), automatic synchronizing and the close order of 52G (G-1B). The 230 kV side is
   not modelled: 52L stays closed. No relay is modelled either, so no protection operates by itself; a protection held on TA-9 trips the turbine through the IBD logic. Times
   with no number in the drawings are marked model time. */
const TCS_GEN = { volt: 30 /* s, model time: voltage build-up after 41 */, asd: 60 /* s, model time: ASD matches speed and voltage */, x3: 3 /* G-1B */, to: 300 /* G-1B 5 min */ };
function tcsGen(U) {
  if (U.gen) return U.gen;
  const on = !!U.tb && (U.tb.st === 'sync' || U.tb.st === 'load');
  return (U.gen = { f41: on, V: on ? 1 : 0, rated: on, ex: false, start: false, x25: false, tx: 0, ty: 0, on25: false, close: false, last: '' });
}
function tcsGenStep(U, dt) {
  const g = tcsGen(U),
    tb = U.tb,
    g52 = tb.st === 'sync' || tb.st === 'load',
    rpm = tb.rpm;
  /* TURBINE RATED SPEED: ON >= 3550, OFF <= 3540 (IBD TD-1) */
  if (rpm >= 3550) g.rated = true;
  else if (rpm <= 3540) g.rated = false;
  /* G-4: 41_CLOSE_CMD = ES_AND_52G_OPEN AND TURBINE_RATED_SPEED AND NOT 41_TRIP AND 41_CLOSE_REQ; EXCITATION AUTO START is a pulse of ATS step 4 */
  if (g.ex && !g52 && g.rated) g.f41 = true;
  g.ex = false;
  g.V = g.f41 ? Math.min(1, g.V + dt / TCS_GEN.volt) : 0;
  /* G-1B: the automatic synchronizing, 52L closed. 84GI = generator voltage on; the 5 min timer takes 25X1 away */
  const gv = g.V >= 1,
    can = g.f41 && !g52 && gv;
  if (can && g.start && !g.x25 && g.ty < TCS_GEN.to) g.x25 = true;
  if (!can) g.x25 = false;
  g.tx = g.x25 ? g.tx + dt : 0;
  const y1 = g.x25 && g.tx >= TCS_GEN.x3;
  g.ty = y1 ? g.ty + dt : 0;
  if (g.ty >= TCS_GEN.to) {
    g.x25 = false;
    g.start = false;
    g.last = 'Auto synchronizing timed out (5 min): start it again';
  }
  g.on25 = y1 && g.ty >= TCS_GEN.asd;
  /* 52G_CLOSE_ORDER = 52G_REMOTE AND 52G_AUTO AND 25_ON AND protection not operated AND 41 and 52L closed */
  g.close = g.on25 && can;
}
/* a turbine trip: 52G is open, so ST TRIP opens 41 and the AVR (G-4) */
function tcsGenTrip(U) {
  Object.assign(tcsGen(U), { f41: false, V: 0, ex: false, start: false, x25: false, tx: 0, ty: 0, on25: false, close: false });
}
