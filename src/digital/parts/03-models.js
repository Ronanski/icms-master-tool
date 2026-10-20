/* DITL (digital logic) - Simulation models of the digital blocks (movements, solenoid valves, motors). Part of ONE script (joined by src/digital/order.list, in this order). */
/* ---------- MOV block model (v9) ----------
 OPEN / CLOSE COMM. text = command entry of a MOV function block. Feedback rows on the right are found by tag:
 ZSO / ZSC = limit switches (follow valve position), MIL = local/remote, MIT = trip, TS/TSC/TSO = torque, ZT = position.
 A right row whose address is also a left input on the same sheet = the same signal (mir = that left row). */
function movModel0(sh, nl) {
  const all = [...sh.tx, ...Object.values(sh.cells).flat()],
    ADR = /[IOM]\.[0-9A-F]{4}/,
    rowOf = y => sh.rows.findIndex(r => y >= r.y - 3.3 && y < r.y + 5.7),
    mid = (sh.rng.S[1] + sh.rng.RS[0]) / 2;
  let cm = all.filter(
      t =>
        /^(OPEN|CLOSE)$/.test(t.t) &&
        t.x > mid - 40 &&
        all.some(c => /^COMM\.?$/.test(c.t) && Math.abs(c.x - t.x) < 2 && Math.abs(c.y - t.y) < 5)
    ),
    old = 0;
  if (!cm.length && all.some(t => /^ZSO$/.test(t.t) && t.x > mid)) {
    /* v16: old template MOV (DITL-38): one text "MCV OPEN COMMAND" / "MCV CLOSE COMMAND" inside the MCC box, bare MIL/MIT/ZSO/ZSC/TSC labels, no addresses */
    cm = all.filter(t => /(^|\s)(OPEN|CLOSE)\s+COMMAND$/i.test(t.t) && t.x > mid - 40 && t.x < sh.rng.RS[0] - 30);
    old = 1;
  }
  if (!cm.length) return [];
  const B = [];
  for (const t of cm.sort((a, b) => b.y - a.y)) {
    const k = /OPEN/i.test(t.t) ? 'open' : 'close',
      near = re =>
        all
          .filter(q => re.test(q.t) && q.x < t.x && t.x - q.x < 30 && Math.abs(q.y - t.y) < 6)
          .sort((a, b) => Math.abs(a.y - t.y) - Math.abs(b.y - t.y))[0];
    const tg = near(/^MO[RS]-/),
      oa = near(/^O\.[0-9A-F]{4}$/),
      suf = tg ? tg.t.replace(/^MO[RS]-/, '') : '',
      sg = nl.segs
        .filter(q => q.h && Math.abs(q.y1 - t.y) < 4 && q.x2 <= t.x + 0.5 && q.x2 >= t.x - (old ? 24 : 6))
        .sort((a, b) => b.x2 - a.x2)[0];
    let b = B.find(b => !b[k] && (b.suf === suf || !suf || !b.suf) && Math.abs(b.y - t.y) < 70);
    if (!b) {
      b = { suf, y: t.y, fb: [] };
      B.push(b);
    }
    if (!b.suf) b.suf = suf;
    b[k] = { n: sg ? sg.n : -1, tag: tg ? tg.t : '', adr: oa ? oa.t : '', x: t.x, y: t.y };
  }
  const L = {};
  sh.rows.forEach((r, i) =>
    LEFT.forEach(c =>
      (sh.cells[i + ':' + c] || []).forEach(t => {
        const m = t.t.match(ADR);
        if (m && !(m[0] in L)) L[m[0]] = i;
      })
    )
  );
  const FB = /^(ZSO|ZSC|MIL|MIT|TSC|TSO|TS|ZT)(?:-(\S+))?$/;
  for (const t of all) {
    const m = FB.exec(t.t);
    if (!m || t.x < mid) continue;
    const i = rowOf(t.y);
    if (i < 0) continue;
    const b =
        B.find(b => b.suf && b.suf === m[2]) || B.slice().sort((p, q) => Math.abs(p.y - t.y) - Math.abs(q.y - t.y))[0],
      ty = /^TS/.test(m[1]) ? 'TS' : m[1];
    if (b.fb.some(f => f.row === i)) continue;
    const ad = all.filter(q => q.x > t.x - 5 && rowOf(q.y) === i && ADR.test(q.t)).map(q => q.t.match(ADR)[0])[0] || '';
    let mir = ad && ad in L ? L[ad] : -1;
    if (mir < 0 && !ad) {
      /* no address (old template): the left input row with the same service text is the same signal */ const sv = j =>
          ['S', 'T']
            .map(c => (sh.cells[j + ':' + c] || []).map(q => q.t).join(' '))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
        rt = (sh.cells[i + ':RS'] || [])
          .map(q => q.t)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      if (rt) {
        const j = sh.rows.findIndex((r, jj) => sv(jj) && sv(jj) === rt && nl.src.some(z => z.row === jj));
        if (j >= 0) mir = j;
      }
    }
    b.fb.push({ ty, tag: t.t, row: i, adr: ad, mir });
  }
  return B.filter(b => b.open || b.close).map(b => ({
    tag: b.suf,
    open: b.open || null,
    close: b.close || null,
    fb: b.fb
  }));
}
const ADRX = /^[IOM]\.[0-9A-F]{4}$/;
function movModel(sh, nl) {
  return movModel0(sh, nl).concat(svModel(sh, nl));
}
/* v15 SOLENOID: dashed assembly box (SV-xxx coil, DC 24V contact, ZSO/ZSC) driven by the DCS output wire that enters the box (through a NOT = inverted output: command ON -> coil OFF -> valve goes to its spring position).
   Direction from the text "OPEN COMMAND" / "CLOSE COMMAND" next to that wire. Command ON -> commanded position, command OFF -> opposite position (spring return). ZSO/ZSC on the right follow the position, both OFF while moving. Stroke 3 s. */
function svModel(sh, nl) {
  const all = [...sh.tx, ...Object.values(sh.cells).flat()],
    S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    mid = (S1 + R0) / 2,
    res = [],
    rowOf = y => sh.rows.findIndex(r => y >= r.y - 3.3 && y < r.y + 5.7);
  const D = new Set(nl.src.map(z => z.n));
  nl.gates.forEach(g => (g.out || []).forEach(n => D.add(n)));
  const rects = sh.raw.pl
    .filter(([p, c, l]) => (l === 'CEN' || l === 'CON') && p.length >= 4 && c)
    .map(([p]) => {
      const xs = p.map(q => q[0]),
        ys = p.map(q => q[1]);
      return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) };
    })
    .filter(
      b => b.x2 - b.x1 > 15 && b.x2 - b.x1 < 150 && b.y2 - b.y1 > 10 && b.y2 - b.y1 < 90 && b.x1 > S1 && b.x2 < R0 + 4
    );
  const cs = [];
  sh.raw.ln.forEach(q => {
    if (q[4] === 'CEN' && Math.hypot(q[0] - q[2], q[1] - q[3]) < 130)
      cs.push([
        [q[0], q[1]],
        [q[2], q[3]]
      ]);
  });
  sh.raw.pl.forEach(([p, c, l]) => {
    if (l === 'CEN' && !(p.length >= 4 && c)) for (let i = 0; i + 1 < p.length; i++) cs.push([p[i], p[i + 1]]);
  });
  const cp = cs.map((_, i) => i),
    cf = i => (cp[i] === i ? i : (cp[i] = cf(cp[i]))),
    cn = (a, b) =>
      Math.hypot(a[0] - b[0], a[1] - b[1]) <
      0.5; /* v15: dashed assembly box drawn as separate CEN pieces (old template): union pieces that touch, bbox of each cluster */
  cs.forEach((a, i) =>
    cs.forEach((b, j) => {
      if (j > i && a.some(p => b.some(q => cn(p, q)))) cp[cf(i)] = cf(j);
    })
  );
  const cg = {};
  cs.forEach((q, i) => (cg[cf(i)] = cg[cf(i)] || []).push(...q));
  const clus = Object.values(cg)
    .map(w => ({
      x1: Math.min(...w.map(z => z[0])),
      x2: Math.max(...w.map(z => z[0])),
      y1: Math.min(...w.map(z => z[1])),
      y2: Math.max(...w.map(z => z[1]))
    }))
    .filter(b => b.x2 - b.x1 > 15 && b.x2 - b.x1 < 150 && b.y2 - b.y1 > 10 && b.y2 - b.y1 < 130);
  const boxAt = t => {
    const f = a =>
      a
        .filter(b => t.x >= b.x1 && t.x <= b.x2 && t.y >= b.y1 && t.y <= b.y2)
        .sort((a, b) => (a.x2 - a.x1) * (a.y2 - a.y1) - (b.x2 - b.x1) * (b.y2 - b.y1))[0];
    return f(rects) || f(clus) || null;
  };
  const L = {};
  sh.rows.forEach((r, i) =>
    LEFT.forEach(c =>
      (sh.cells[i + ':' + c] || []).forEach(t => {
        const m = t.t.match(/[IOM]\.[0-9A-F]{4}/);
        if (m && !(m[0] in L)) L[m[0]] = i;
      })
    )
  );
  const seen = new Set();
  for (const t of all.filter(t => /^SV-/.test(t.t) && t.x > S1 && t.x < R0)) {
    const suf = t.t.slice(3),
      bx = boxAt(t);
    if (!bx || seen.has(suf + '@' + bx.x1.toFixed(0) + bx.y1.toFixed(0))) continue;
    let zs = all.filter(q => /^ZS[OC]-/.test(q.t) && q.x > mid && q.t.slice(4) === suf);
    if (!zs.length)
      zs = all.filter(
        q => /^ZS[OC]-/.test(q.t) && q.x > mid && q.x >= bx.x1 && q.x <= bx.x2 + 4 && q.y >= bx.y1 && q.y <= bx.y2
      );
    const noZS =
      !zs.length; /* ZS tag may differ from the SV tag (DITL-20 CL1061-A7): inside the same box counts. v26: no ZS at all (DITL-44, 86, 92, 93) = only the coil is shown */
    /* 2.2.0-beta.3: a command wire that ENTERS the field box (DITL-20: the output 0.0242 of the OPEN latch goes into XV-CL1061-A to
       the contact of SV-CL1061-A) is the command; before, only wires that stop at the box edge were looked at, and the wire of the
       latch reset (MFT / CLOSE P.B.) was taken: the valve opened on MFT and was shut in service */
    const into = q => q.x1 < bx.x1 - 1 && q.x2 > bx.x1 - 1 && q.x2 <= bx.x2;
    const gIn = q => (nl.gates.some(g => [...(g.ins || []), ...(g.s || []), ...(g.r || [])].includes(q.n)) ? 1 : 0);
    const sg = nl.segs
      .filter(
        q =>
          q.h &&
          D.has(q.n) &&
          ((q.x2 <= bx.x1 + 1 && q.x2 >= bx.x1 - 46) || into(q)) &&
          q.y1 >= bx.y1 - 4 &&
          q.y1 <= bx.y2 + 4 &&
          Math.abs(q.y1 - t.y) < 28
      )
      /* 2.5.0-beta.11 (DITL PDF audit, DITL-73 SV-CR1011): a wire that ends in the input of a gate is not the command to the box;
         the free DCS output wire comes first (the row 27 condenser vacuum NOT -> AND wire was taken instead of the row 23 OPEN COMMAND
         -> NOT -> XV-CR1011 O.0126) */
      .sort(
        (a, b) =>
          into(b) - into(a) ||
          gIn(a) - gIn(b) ||
          b.x2 - a.x2 ||
          Math.abs(a.y1 - t.y) - Math.abs(b.y1 - t.y)
      )[0];
    if (!sg) continue;
    seen.add(suf + '@' + bx.x1.toFixed(0) + bx.y1.toFixed(0));
    const ct = all
        .filter(q => /(OPEN|CLOSE)\s+COMMAND/i.test(q.t) && Math.abs(q.y - sg.y1) < 20 && q.x < bx.x1 + 5)
        .sort((a, b) => Math.abs(a.y - sg.y1) - Math.abs(b.y - sg.y1))[0],
      dir = ct && /CLOSE/i.test(ct.t) ? 'close' : 'open',
      ng = nl.gates.find(g => g.t === 'NOT' && (g.out || []).includes(sg.n)),
      after = !!(ng && ct && ct.x >= ng.box.x2 - 0.5),
      inv =
        !!ng &&
        !after; /* the label before the NOT (left row) names the DCS command, the label after it (DITL-62 CLOSE COMMAND over the contact) names what the energized coil does */
    /* right row of ZSO/ZSC: the row whose service text says OPEN / CLOS(ED) and is nearest to the label (old template draws the label between two rows) */
    const rsT = [];
    sh.rows.forEach((r, i) => (sh.cells[i + ':RS'] || []).forEach(q => rsT.push({ q, i })));
    const zr = z => {
      const re = /^ZSO/.test(z.t) ? /OPEN/i : /CLOS/i,
        cs = rsT
          .filter(o => re.test(o.q.t) && !/COMMAND/i.test(o.q.t))
          .map(o => {
            const hd = rsT
                .filter(h => h !== o && !/^[IOM]\.[0-9A-F]{4}/.test(h.q.t) && h.q.y > o.q.y && h.q.y - o.q.y < 10)
                .sort((a, b) => a.q.y - b.q.y)[0],
              row = hd ? rowOf(hd.q.y) : o.i;
            return { row, d: Math.abs(sh.rows[row >= 0 ? row : o.i].y + 1.2 - z.y) };
          })
          .sort((a, b) => a.d - b.d)[0];
      return cs && cs.row >= 0 ? cs.row : rowOf(z.y);
    }; /* the cell block starts at its first text line: OPENED / CLOSED can be written on the 2nd line (old template) */
    const fb = [];
    for (const z of zs) {
      const i = zr(z);
      if (i < 0) continue;
      const ad =
        all
          .filter(q => q.x > z.x - 5 && q.x < z.x + 30 && Math.abs(q.y - z.y) < 7 && /[IOM]\.[0-9A-F]{4}/.test(q.t))
          .map(q => q.t.match(/[IOM]\.[0-9A-F]{4}/)[0])[0] || '';
      fb.push({ ty: z.t.slice(0, 3), tag: z.t, row: i, adr: ad, mir: ad && ad in L ? L[ad] : -1 });
    }
    const sv0 = all.find(q => q.t === 'SV' && q.x >= bx.x1 && q.x <= bx.x2 && q.y >= bx.y1 && q.y <= bx.y2),
      ci =
        sv0 &&
        sh.raw.ci
          .filter(c => c[2] > 2.5 && c[2] < 7 && Math.hypot(c[0] - sv0.x, c[1] - sv0.y) < c[2] + 3)
          .sort((a, b) => Math.hypot(a[0] - sv0.x, a[1] - sv0.y) - Math.hypot(b[0] - sv0.x, b[1] - sv0.y))[0];
    if (fb.length || noZS)
      res.push({
        tag: suf,
        sv: 1,
        noZS,
        dir,
        inv,
        coil: ci ? { x: ci[0], y: ci[1], r: ci[2] } : null,
        open: { n: sg.n, tag: t.t, adr: '', x: bx.x1, y: sg.y1 },
        close: null,
        fb
      });
  }
  return res;
}
/* v14 mirror: a left input whose address is also the label of an INTERNAL signal on the same sheet (e.g. DITL-81 M.0603 on the open-command latch, left row 23) is that signal, not a hand switch */
function mirModel(sh, nl) {
  const D = new Set(),
    SN = new Set(nl.src.map(z => z.n)),
    S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    res = [];
  nl.gates.forEach(g => (g.out || []).forEach(n => D.add(n)));
  const L = {};
  sh.rows.forEach((r, i) =>
    LEFT.forEach(c =>
      (sh.cells[i + ':' + c] || []).forEach(t => {
        if (ADRX.test(t.t) && nl.src.some(z => z.row === i)) (L[t.t] = L[t.t] || new Set()).add(i);
      })
    )
  );
  for (const t of sh.tx.filter(t => ADRX.test(t.t) && t.x > S1 + 4 && t.x < R0 - 4 && L[t.t])) {
    const sg = nl.segs
      .filter(
        q => q.h && Math.abs(q.y1 - t.y) < 5 && q.x1 - 1 <= t.x + 4 && q.x2 + 1 >= t.x - 4 && D.has(q.n) && !SN.has(q.n)
      )
      .sort((a, b) => Math.abs(a.y1 - t.y) - Math.abs(b.y1 - t.y))[0];
    if (!sg) continue;
    L[t.t].forEach(i => {
      if (!res.some(m => m.row === i) && !nl.src.some(z => z.row === i && z.n === sg.n))
        res.push({ row: i, n: sg.n, adr: t.t });
    });
  }
  return res;
}
/* v14 MOTOR: MOR-xxx (start command) -> motor runs after 2 s -> MIR-/MIF-xxx running feedback net. Only when that feedback net is not already driven by logic drawn on the sheet (DITL-76 draws its own softstarter logic) */
function motModel(sh, nl) {
  const all = [...sh.tx, ...Object.values(sh.cells).flat()],
    D = new Set(),
    SN = new Set(nl.src.map(z => z.n)),
    S1 = sh.rng.S[1],
    R0 = sh.rng.RS[0],
    res = [];
  nl.gates.forEach(g => (g.out || []).forEach(n => D.add(n)));
  const L = {},
    AB = x => {
      const m = String(x).match(/[IOM]\.[0-9A-F]{4}/);
      return m ? m[0] : x;
    };
  sh.rows.forEach((r, i) =>
    LEFT.forEach(c =>
      (sh.cells[i + ':' + c] || []).forEach(t => {
        if (nl.src.some(z => z.row === i)) (L[AB(t.t)] = L[AB(t.t)] || new Set()).add(i);
      })
    )
  );
  const used = new Set();
  for (const t of all.filter(t => /^MI[RF]-/.test(t.t) && t.x > S1 && t.x < R0)) {
    const suf = t.t.slice(4),
      hasF = all.some(q => q.t === 'MIF-' + suf),
      mosR = all.find(
        q =>
          q.t === 'MOS-' + suf &&
          q.x > S1 &&
          all.some(w => /^REVERSE$/i.test(w.t) && Math.abs(w.x - q.x) < 6 && w.y > q.y - 1 && w.y - q.y < 14)
      ),
      rev =
        t.t[2] === 'R' &&
        hasF &&
        !!mosR; /* v17: inverter drive (DITL-21A): MOR = START/FORWARD -> MIF, MOS = REVERSE -> MIR */
    const ms = all
      .filter(q => (rev ? /^MOS-/ : /^MOR-/).test(q.t) && q.t.slice(4) === suf && q.x < t.x && q.x > S1)
      .sort((a, b) => Math.abs(a.y - t.y) - Math.abs(b.y - t.y));
    /* v16: the running-feedback net is the net that reaches the right cell of the row where the MIR/MIF label is written (it is free = not driven by drawn logic) */
    const ou = nl.outs
      .filter(o => !D.has(o.n) && !SN.has(o.n) && !used.has(o.n) && Math.abs(sh.rows[o.row].y + 1.2 - t.y) < 3.5)
      .sort((a, b) => Math.abs(sh.rows[a.row].y + 1.2 - t.y) - Math.abs(sh.rows[b.row].y + 1.2 - t.y))[0];
    const sg = ou
      ? { n: ou.n }
      : nl.segs
          .filter(q => q.h && Math.abs(q.y1 - t.y) < 4 && q.x1 >= t.x + 3 && q.x1 <= t.x + 60)
          .sort((a, b) => a.x1 - b.x1)[0];
    if (!sg || D.has(sg.n) || SN.has(sg.n) || used.has(sg.n)) continue;
    for (const m of ms) {
      const mg = nl.segs
        .filter(q => q.h && Math.abs(q.y1 - m.y) < 4 && q.x2 >= m.x - 12 && q.x2 <= m.x + 14 && !SN.has(q.n))
        .sort((a, b) => Math.abs(a.x2 - m.x) - Math.abs(b.x2 - m.x))[0];
      if (!mg || !D.has(mg.n)) continue;
      used.add(sg.n);
      const ad =
        all
          .filter(q => /^I\.[0-9A-F]{4}/.test(q.t) && Math.abs(q.x - t.x) < 50 && q.y >= t.y - 12.5 && q.y <= t.y + 3)
          .sort((a, b) => Math.abs(a.y - t.y) - Math.abs(b.y - t.y))[0] ||
        all
          .filter(q => /^[IO]\.[0-9A-F]{4}/.test(q.t) && Math.abs(q.x - t.x) < 50 && Math.abs(q.y - t.y) < 9)
          .sort((a, b) => Math.abs(a.y - t.y) - Math.abs(b.y - t.y))[0];
      /* STOP command MOS-xxx (pulse, DITL-45): the field panel seals the START pulse in until the STOP pulse arrives */
      const mo = rev ? null : all.find(q => q.t === 'MOS-' + suf && q.x < t.x && q.x > S1 && !mosR),
        og =
          mo &&
          nl.segs
            .filter(q => q.h && Math.abs(q.y1 - mo.y) < 4 && q.x2 >= mo.x - 12 && q.x2 <= mo.x + 14 && !SN.has(q.n))
            .sort((a, b) => Math.abs(a.x2 - mo.x) - Math.abs(b.x2 - mo.x))[0];
      res.push({
        tag: suf + (t.t[2] === 'F' ? ' (fwd)' : rev ? ' (rev)' : ''),
        kind: t.t.slice(0, 3),
        mor: mg.n,
        mos: og && D.has(og.n) ? og.n : -1,
        mir: sg.n,
        adr: ad ? ad.t : ''
      });
      if (ad && L[AB(ad.t)])
        L[AB(ad.t)].forEach(i => {
          if (!nl.mir.some(x => x.row === i)) nl.mir.push({ row: i, n: sg.n, adr: ad.t });
        });
      break;
    }
  }
  /* v17: any right row whose net is free (not driven by drawn logic, not a model output) and whose address (written in the cell or beside the MIL/MIT/MIA label) is the SAME as a left input = indication of that input (field alarm shown on the CRT). */
  for (const o of nl.outs) {
    const i = o.row;
    if (D.has(o.n) || SN.has(o.n) || used.has(o.n)) continue;
    if (nl.ind.some(m => m.n === o.n)) continue;
    const cy = sh.rows[i].y + 1.2;
    const ad = all
      .filter(
        q =>
          /^[IM]\.[0-9A-F]{4}/.test(q.t) &&
          q.x > S1 &&
          Math.abs(q.y - cy) < 6.5 &&
          (q.x > R0 - 2 || (q.x > S1 + 60 && q.x < R0))
      )
      .map(q => AB(q.t))
      .filter(a => L[a]);
    /* 2.5.0-beta.11 (DITL PDF audit, DITL-21A rows 57 / 62 MIT / LIS3): the address is written UNDER the field label (MIT-xxx,
       LIS-xxx), in the band of the next row; the label is on this row */
    if (!ad.length) {
      const lb = all.filter(q => /^(MI[TLRAF]|LIS\d?|LS\d?|ZS[OC]|TS)-/.test(q.t) && q.x > S1 + 60 && q.x < R0 && Math.abs(q.y - cy) < 4.5);
      for (const l of lb) {
        const q = all
          .filter(q => /^[IM]\.[0-9A-F]{4}/.test(q.t) && q.x > l.x && q.x - l.x < 50 && q.y < l.y && l.y - q.y < 12)
          .sort((p, r) => Math.hypot(p.x - l.x, p.y - l.y) - Math.hypot(r.x - l.x, r.y - l.y))[0];
        if (q && L[AB(q.t)] && !lb.some(o => o !== l && Math.hypot(q.x - o.x, q.y - o.y) < Math.hypot(q.x - l.x, q.y - l.y))) ad.push(AB(q.t));
      }
    }
    const a = ad[0];
    if (!a) continue;
    used.add(o.n);
    L[a].forEach(r => nl.ind.push({ row: r, n: o.n, adr: a }));
  }
  return res;
}
