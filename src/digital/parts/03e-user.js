/* DITL (digital logic) - what the operator sets on a sheet that is not an input (3.2.0 Web Worker, stage c), no DOM: the presets of the
   side panels (timer time and unit, MOV / solenoid stroke time, motor run feedback delay), Skip of a timer, LOCAL / REMOTE of a MOV
   whose MIL has no input on the sheet, and the values kept from the last session (localStorage 'ditl.uv', 05-overlay-interaction.js
   uvApply). These live in the sheet, the netlist (the timer of a gate) and MST, outside the slots of the radio: ditlUser is an engine
   action (src/world/eng.js CALLS.G), run on the page and in the engine alike. Part of ONE script (src/digital/order.list). */
/* a sheet as the drawing, the panels and the Library show it: in a mirror (the page while the engine runs in the worker, ENG.mode
   'mirror') the result of the engine's last scan (the nets of the netlist, the outputs of the one world), read only: simSheet would
   compute the sheet again on the page and write what the engine keeps (nets, latches, counters, the step register, nl.ufx) without the
   engine's inputs of this scan (WORLD.live, the rows from other sheets). Elsewhere (no worker, the engine itself): simSheet */
function simRead(s) {
  const W = window.WORLD;
  if (!(window.ENG && ENG.mode === 'mirror' && W && W.on && W.idx)) return simSheet(s);
  const lv = W.live;
  W.live = true;
  try {
    const nl = s.nl,
      o = W.out && W.out[s.name];
    return { rowOn: simIn(s), v: nl._v && nl._v.length === nl.n ? nl._v : new Array(nl.n).fill(0), outOn: o instanceof Set ? o : new Set(o || []) };
  } finally {
    W.live = lv;
  }
}
const tmKey = g => (g.tm.tag || '') + '|' + (g.tm.lab || '') + '|' + g.tm.ax.toFixed(0) + ',' + g.tm.ay.toFixed(0);
/* name = the sheet; op:
   'tm' (gate, time, unit): the preset of a timer (the timer starts again)   'skip' (gate): finish the timer now
   'mvt' (MOV, sec): full stroke time   'mtd' (sec): motor run feedback delay   'lr' (MOV): LOCAL / REMOTE
   'uv' (kept values {av, mvt, pdur, mtd, tmo}) */
function ditlUser(name, op, a, b, c) {
  const s = ditlAll().find(x => x.name === name);
  if (!s || !s.nl) return;
  const g = typeof a === 'number' ? s.nl.gates[a] : null;
  if (op === 'tm') {
    if (!g || !g.tm) return;
    tmSet(g.tm, b, c);
    s.tmo = s.tmo || {};
    s.tmo[tmKey(g)] = [b, c];
    if (g.tm.pg) {
      s.pdur = s.pdur || {};
      s.pdur[g.tm.key] = { v: b, u: c };
    }
    g.st = { acc: 0, out: 0, pre: 0, run: 0 };
  } else if (op === 'skip') {
    if (!g || !g.tm) return;
    const v = simulate(s.nl, simIn(s));
    tmStep(
      g,
      g.ins.some(n => v[n]),
      tmSecs(g.tm) + 1
    );
  } else if (op === 'mvt') {
    s.mvt = s.mvt || {};
    s.mvt[a] = b;
  } else if (op === 'mtd') s.mtd = a;
  else if (op === 'lr') {
    const r = mvRT(s)[a];
    if (r) r.lr = r.lr ? 0 : 1;
  } else if (op === 'uv') {
    const u = a || {};
    if (u.av) s.av = { ...(s.av || {}), ...u.av };
    if (u.mvt) s.mvt = { ...(s.mvt || {}), ...u.mvt };
    if (u.pdur) s.pdur = { ...(s.pdur || {}), ...u.pdur };
    if (u.mtd) s.mtd = u.mtd;
    if (u.tmo) {
      s.tmo = { ...(s.tmo || {}), ...u.tmo };
      s.nl.gates.forEach(x => {
        if (x.t !== 'TMR' || !x.tm) return;
        const o = s.tmo[tmKey(x)];
        if (o && o[0] >= 0) {
          if (x.tm.pg) x.tm.fv = { v: o[0], u: o[1] };
          else tmSet(x.tm, o[0], o[1]);
        }
      });
    }
  }
  s.nl.avk = avOf(s);
}
