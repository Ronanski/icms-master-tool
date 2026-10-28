/* DITL (digital logic) - Sand injection system (E10210-3-771 ~ 777, station 103 FM0007 P701 ~ P709): the netlist of a sheet whose logic was read from the PDF
   (tools/data/sand_sheet.py). The drawing has no row table: a terminal is a wire end (a field switch, a push button, a FROM flag = an input row; a lamp, a
   field output, an alarm, a TO flag = an output row). sh.sd holds the nets, the blocks and the terminals; here they get the same netlist object as the
   other sheets (simulate, simSheet, render and the one world read it) */
function sdNL(sh) {
  const d = sh.sd,
    segs = [],
    seg = d.seg.slice();
  sh.raw.ln.forEach((q, k) => {
    const h = Math.abs(q[1] - q[3]) < 0.05;
    segs.push({
      k,
      h,
      x1: Math.min(q[0], q[2]),
      x2: Math.max(q[0], q[2]),
      y1: h ? q[1] : Math.min(q[1], q[3]),
      y2: h ? q[1] : Math.max(q[1], q[3]),
      n: seg[k]
    });
  });
  const gates = [];
  d.gates.forEach(g => {
    const box = g.box;
    if (g.t === 'AND' || g.t === 'OR' || g.t === 'NOT') gates.push({ t: g.t, ins: g.ins, out: g.out, box, done: true, ev: 1, sd: 1, hid: g.hid });
    else if (g.t === 'TMR')
      gates.push({
        t: 'TMR',
        k: g.k === 'pulse' ? 'pulse' : g.k,
        tm: {
          lab: g.k === 'pulse' ? 'PULSE' : g.k === 'off' ? 'OFF DELAY' : 'ON DELAY',
          key: (g.tag || 'T') + '@' + box.x1.toFixed(1) + ',' + box.y1.toFixed(1),
          tag: g.tag,
          ax: (box.x1 + box.x2) / 2,
          ay: (box.y1 + box.y2) / 2,
          rr: (box.y2 - box.y1) / 2,
          bx1: box.x1,
          bx2: box.x2,
          nt: null,
          ut: null,
          fv: { v: g.v || 3, u: 'SEC' }
        },
        ins: g.ins,
        out: g.out,
        st: { acc: 0, out: 0, pre: 0, run: 0 },
        box
      });
    else if (g.t === 'FF') gates.push({ t: 'FF', s: g.s, r: g.r, out: g.out, q: 0, box, rt: true });
  });
  const NL = {
    v: 10,
    sd: 1,
    split: [],
    healed: [],
    n: d.n,
    seg,
    gates,
    src: d.src.map(z => ({ n: z.n, row: z.row })),
    outs: d.outs.map(o => ({ n: o.n, row: o.row })),
    dang: [],
    plnet: [],
    dots: d.dots.map(z => ({ x: z.x, y: z.y, n: z.n })),
    segs,
    pout: [],
    an: [],
    anRows: new Set(),
    mv: [],
    mir: [],
    ind: [],
    mot: [],
    usr: [],
    grp: [],
    one: [],
    xcon: (d.xcon || []).map(c => ({ num: c.num, n: c.n, dir: c.dir, peer: c.peer, x: c.x, y: c.y })),
    term: (d.term || []).map(o => ({ n: o.n, x: o.x, y: o.y, lab: o.lab, lamp: o.lamp })),
    lamps: []
  };
  return NL;
}
