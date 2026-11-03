/* ===== ENGINE: the controllers of a sheet (PID / PIDV with their A / M station, SV switch, mode inputs) and the .MAN / .LOC / .REM
   mode addresses of a tag on every sheet, with the one M / A / R command (latchMode). No page access.
   3.2.0 Web Worker (stage a): moved here from src/ui/hmi/hmi.js (the engine reads them: hmi-op.js starting states, plant.js MAN
   station, unit.js, tcs.js); the faceplate takes them from AN (boot.js) ===== */
/* ang .MAN / .LOC / .REM ng isang tag ay iisang HMI command sa buong DCS: lahat ng input na may ganitong pangalan sa lahat ng sheet (hindi lang ang sa sheet ng controller) */
/* a wire named by its description only: not an address (B.0641, M.0228, AI0641) and not linked from another sheet */
const descWire = (S2, n) =>
  !(S2.xlk && S2.xlk[n]) &&
  !/^(?:(?:S\d\s+)?[A-Z]{1,2}\.[0-9A-F]{4}|(?:S\d\s+)?[A-Z]{2}\d{4}|[A-Z]{2,}[A-Z0-9-]*\.[A-Z]{2,4}|\d\s*:\s*[A-Z])$/.test((AN.nm(S2, n) || '').trim()); /* 2.2.0-beta.9: also an address with its station (S2 M.2502) and a switch leg mark (1:B) */
const modeNetsRaw = (tag, kinds, own) => {
  const out = own ? [own] : [],
    want = new Set(kinds.map(k => (tag + '.' + k).toLowerCase())),
    add = (S2, n) => !out.some(q => q[0] === S2 && q[1] === n) && out.push([S2, n]),
    descs = new Set(),
    tagged = [];
  for (const sh2 of AN.sheets) {
    if (/^ABC-000/.test(sh2.name)) continue;
    let S2;
    try {
      S2 = AN.ensure(sh2);
    } catch (e) {
      continue;
    }
    if (!S2 || !S2.ext) continue;
    for (const n of S2.ext) {
      const t = S2.lab[n] && S2.lab[n].t;
      if (t && want.has(t.trim().toLowerCase())) add(S2, n);
      /* 2.3.0-beta.1: the mode status written beside a wire that carries an address (ABC-011 "TICBR1130.LOC" = M.0230) */
      if (S2.alias && S2.alias[n] && S2.alias[n].some(a => want.has(a.toLowerCase()))) add(S2, n);
    }
    /* 1.23.0: the wire may carry the description as its name with the tag text written at its end (ABC-004A "CONTROL IN
       MANUAL" + "PIC-COBM.MAN"): the digital input wire that ends at the tag text (< 14) is that address */
    const tq = (S2.tx || []).filter(q => want.has(String(q.t).trim().toLowerCase()));
    if (!tq.length) continue;
    tagged.push(S2);
    for (const q of tq) {
      let best = -1,
        bd = 8; /* 2.2.0-beta.9: distance to the line of the wire (the own wire is about 5 units under its tag text) */
      for (const n of S2.ext) {
        const nn = S2.nets[n];
        if (!nn || !nn.dig || !descWire(S2, n)) continue;
        for (const i of nn.segs) {
          /* 2.2.0-beta.9: the distance to the LINE of the wire, not to its ends: the tag text is written on its own wire (ABC-001C
             "HIC-BM.MAN" over the wire "BOILER MASTER IN MANUAL"); with the ends, a shorter wire of the pair above was nearer
             ("TURBINE MASTER IN MANUAL", 12 units from its end, while the own wire ends 34 units away), so HIC-BM.MAN was the
             turbine master wire */
          const g = S2.seg[i],
            dx = g.x2 - g.x1,
            dy = g.y2 - g.y1,
            L2 = dx * dx + dy * dy,
            t = L2 > 0 ? Math.max(0, Math.min(1, ((q.x - g.x1) * dx + (q.y - g.y1) * dy) / L2)) : 0,
            d = Math.hypot(q.x - (g.x1 + t * dx), q.y - (g.y1 + t * dy));
          if (d < bd) {
            bd = d;
            best = n;
          }
        }
      }
      /* 2.2.0-beta.20: the tag text written at the LEFT END of its wire, as a label (ABC-004A "FICCL1061B.MAN  C/F B FLOW CTL IN
         MANUAL ( FROM ABC-004B )": the text ends about where the wire starts, 40 units right of the text's origin): a digital
         description wire whose end is within 60 units right of the text, on the same line (dy <= 4) */
      let leftEnd = false;
      if (best < 0) {
        let bx = 61;
        for (const n of S2.ext) {
          const nn = S2.nets[n];
          if (!nn || !nn.dig || !descWire(S2, n)) continue;
          /* the leftmost end of a horizontal segment of the wire */
          let lx = 1e9,
            ly = 0;
          for (const i of nn.segs) {
            const g = S2.seg[i];
            if (Math.abs(g.y1 - g.y2) > 1) continue;
            const ex = Math.min(g.x1, g.x2);
            if (ex < lx) {
              lx = ex;
              ly = g.y1;
            }
          }
          const dx = lx - q.x;
          if (dx > 0 && dx < bx && Math.abs(ly - q.y) <= 4) {
            bx = dx;
            best = n;
            leftEnd = true;
          }
        }
      }
      if (best >= 0) {
        add(S2, best);
        const d = (AN.nm(S2, best) || '').trim().toUpperCase();
        if (!leftEnd && d.length >= 10 && !/^[A-Z]{1,3}\.\w{4}$/.test(d) && !d.includes(tag.toUpperCase())) descs.add(d);
      }
    }
  }
  /* the same description on another sheet that shows the same tag text (ABC-001C "BOILER PRESSURE CONTROL IN MANUAL"
     with "PIC-COBM.MAN" a little further away, under other wires) */
  if (descs.size)
    for (const S2 of tagged)
      for (const n of S2.ext) {
        const nn = S2.nets[n],
          d = (AN.nm(S2, n) || '').trim().toUpperCase();
        if (nn && nn.dig && descWire(S2, n) && [...descs].some(x => d === x || d.endsWith(' ' + x))) add(S2, n);
      }
  return out;
};
/* speed (user 2026-11-01 "Ge ayusin pre", 6x CPU: the SOP scan and the dock asked this every second for every step, each time a
   walk over all the sheets): the wires of a tag only change when a sheet is built again, so they are kept per tag while every
   sheet keeps the same built state (S) */
let mnK = null;
const mnC = new Map();
const modeNetsByTag = (tag, kinds, own) => {
  const sh = AN.sheets || [];
  if (!sh.length || sh.some(x => !x.S && !/^ABC-000/.test(x.name))) return modeNetsRaw(tag, kinds, own);
  if (!mnK || mnK.length !== sh.length || sh.some((x, i) => x.S !== mnK[i])) {
    mnK = sh.map(x => x.S);
    mnC.clear();
  }
  const k = tag + '|' + kinds.join(',');
  let r = mnC.get(k);
  if (!r) mnC.set(k, (r = modeNetsRaw(tag, kinds, null)));
  return own ? [own, ...r.filter(q => !(q[0] === own[0] && q[1] === own[1]))] : r.slice();
};
/* 1.22.0: .MAN / .LOC / .REM are the MODE STATUS of the controller (textbook: status word .MAN = MANUAL, .LOC = LOCAL,
   .REM = REMOTE), not a short pulse: pressing M / A / R sets that one to 1 and the other two to 0, on every sheet with the tag,
   and it STAYS until another mode is pressed. The drawing reads it as a level (ABC-010: "DRUM LEVEL CONTROL MANUAL FOR
   START-UP  LICBR1001B.MAN" -> NOT -> force manual of FICFW1007: with a pulse the feedwater loop could never go to AUTO) */
const MODEK = { MAN: ['MAN', 'MANUAL'], LOC: ['LOC', 'LOCAL', 'AUTO', 'AUT'], REM: ['REM', 'REMOTE'] };
const latchMode = (tag, kind, own) => {
  /* 2.2.0-beta.20: ONE command. Every .MAN / .LOC / .REM address of the tag is written first (the selected mode last), then the
     sheets settle once. Before, each address settled on its own (setIn): for those scans the controller was in no mode at all
     (MAN = 0, LOC = 0, REM still 0). FIC-CM R (M4 step 5) took its SV to 0 for those scans, the fuel SI0017 fell with it, and the
     boiler master, tracking SI0017 while the coal master is not REMOTE (ABC-001C M.2000), kept 27.0 % instead of 33.6 %: the coal
     fell from 36 to 11 T/H and the main steam pressure to 108.7 kg/cm2 */
  const w = [];
  for (const k in MODEK) for (const [S2, n] of modeNetsByTag(tag, MODEK[k], k === kind ? own : null)) w.push([S2, n, k === kind ? 1 : 0]);
  w.sort((a, b) => a[2] - b[2]);
  for (const [S2, n, v] of w) S2.rt.ext[n] = v;
  try {
    AN.settle();
  } catch (e) {}
};
function ctrls(S) {
  const out = [];
  for (const b of S.blk) {
    if (b.k !== 'PID' && b.k !== 'PIDV') continue;
    const tag = (b.txt || [])[1];
    if (!tag || /^X+-/.test(tag)) continue;
    let q = null;
    try {
      q = AN.anPins(S, b);
    } catch (e) {}
    if (!q || q.pv == null || q.pv < 0) continue;
    /* the A/M station of this controller is found by the engine (anStationOf): the same rule for the panel and for the force-manual logic */
    const stn = AN.anStationOf(S, b),
      amt = stn.amt,
      autoLeg = stn.autoLeg,
      manNet = stn.manNet,
      manBlk = stn.manBlk;
    /* the SV is the output of a T switch whose B leg is a COS (the operator's SV, drawing ABC-007 etc.): the faceplate SV field sets that COS and picks leg B (LOCAL); REM goes back to the SV of the logic */
    const svSw = AN.anSvSwitchOf(S, b),
      remote = !!svSw && AN.anHasRemote(S, b); /* REMOTE / LOCAL only where the drawing has a REMOTE mode */
    /* the switching signals of the drawing for this loop: the select signals of the A/M station (1:A / 1:B) and the mode inputs TAG.MAN / .LOC / .REM; the panel shows them live and the mode inputs are buttons that write the SAME signals as the diagram */
    const manLeg = autoLeg === 'A' ? 'B' : 'A',
      lb = n => (S.lab[n] && S.lab[n].t) || 'n' + n,
      sigs = [];
    if (amt) {
      const L =
        amt.cs && amt.cs.length > 1
          ? amt.cs.map(z => ({ n: z.n, leg: z.A ? 'A' : 'B' }))
          : amt.sel >= 0
            ? [{ n: amt.sel, leg: amt.p && amt.p.selA ? 'A' : 'B' }]
            : [];
      for (const z of L) {
        const dr = (S.drv[z.n] || []).find(d => d.k !== 'LINK');
        sigs.push({
          n: z.n,
          name: lb(z.n),
          role: z.leg === manLeg ? 'MAN' : 'AUTO',
          src: dr && dr.i ? dr.i.map(m => ({ n: m, name: lb(m) })) : []
        });
      }
    }
    const modes = [],
      mre = new RegExp(
        '^' + tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.(MAN|LOC|REM|AUTO|AUT|LOCAL|REMOTE|MANUAL)$',
        'i'
      );
    for (let n = 0; n < S.nets.length; n++) {
      const tx = S.lab[n] && S.lab[n].t;
      if (tx && mre.test(tx.trim()) && S.ext.includes(n) && !modes.some(z => z.n === n))
        modes.push({ n, name: tx.trim(), kind: tx.trim().split('.').pop().toUpperCase() });
    }
    /* selectors after the controller output (interlock / back-up legs): when one is on its B leg the valve command is NOT the MV of the faceplate */ const dn =
      [];
    {
      let cur = amt ? amt.o[0] : b.o[0];
      for (let k = 0; k < 6; k++) {
        const g = S.blk.find(
          x =>
            (x.k === 'AMT' || x.k === 'SW') &&
            (!amt || x.id !== amt.id) &&
            x.a === cur &&
            x.b !== cur &&
            !dn.some(d => d.id === x.id)
        );
        if (!g) break;
        dn.push({ id: g.id, sel: g.cs && g.cs[0] ? g.cs[0].n : g.sel });
        cur = g.o[0];
      }
    }
    out.push({
      b,
      tag,
      q,
      amt,
      autoLeg,
      manNet,
      manBlk,
      svSw,
      remote,
      sigs,
      modes,
      dn,
      out: amt ? amt.o[0] : b.o[0],
      desc: (b.face && b.face.desc) || ''
    });
  }
  /* pamagat: ang paglalarawan ng DCS (xlsx) ang ginagamit; kung pareho ito sa dalawang controller ng sheet (hal. "PAF/SAF AIR FLOW CONTROL"), ang nakasulat sa drawing sa tabi ng PID ang gagamitin ("PRIMARY AIR FLOW CONTROL") */
  {
    const cnt = {};
    out.forEach(o => {
      cnt[o.desc] = (cnt[o.desc] || 0) + 1;
    });
    for (const o of out) {
      if (o.desc && cnt[o.desc] < 2) continue;
      const b = o.b;
      const t = (S.tx || [])
        .filter(
          x =>
            x.x >= b.x1 - 2 &&
            x.x <= b.x1 + 25 &&
            x.y >= b.y0 - 6 &&
            x.y <= b.y1 + 6 &&
            !/~/.test(x.t) &&
            x.t.trim().length > 2
        )
        .sort((a, c) => c.y - a.y)
        .map(x => x.t.trim())
        .join(' ');
      if (t) o.desc = t;
    }
  }
  return out;
}
