/* 3.2.1 (LISA): push button faceplates on two generated mockup pages (tools/hmi-mock/p12.py, p15.py: not edited by hand), added here at
   run time, before the page is drawn: [data-hit] on a label of the mockup + a mach entry with df = the push button faceplate of fp-pop.js
   (LS_FPOP.pb, the same as the debris filters): STATUS = an output row of the drawing, DCS buttons = input rows of the same drawing
   (LS_DOCK.dpress). The drawing decides what a press does: nothing is forced here. */
(function () {
  if (!window.LS_MOCK) return;
  const adr = (d, r) => {
    try {
      const s = window.LS_DOCK && LS_DOCK.dOf(d),
        t = s && s.cells && s.cells[r + ':T'];
      return t && t.length ? String(t[0].t) : '';
    } catch (e) {
      return '';
    }
  };
  const pbf = (n, t, d, st, on, pbs, off) => ({
    n,
    t,
    d,
    df: {
      st,
      on,
      off: off || 'STOPPED',
      get pbs() {
        return pbs.map(([l, r]) => [l, r, adr(d, r)]);
      },
      perm: [],
      why: ''
    }
  });
  const defOf = id => {
    const def = (LS_MOCK.defs || []).find(x => x.id === id);
    if (!def || (def._pb = def._pb || {})[id]) return null;
    def._pb[id] = 1;
    def.mach = def.mach || {};
    return def;
  };
  /* SOOTBLOWERS (Mina beta.173: a click on the blower N-1011 opened the PLANT chip menu, no blower faceplate). Each blower label of the
     mockup ([data-dy="DITL-80x|o|row"][data-on="N-10xx"]) = its "N-10xx SOOTBLOWER OPERATING" output; on the same drawing row r is
     "N-10xx SOOTBLOWER START COMMAND" (M.4011 for N-1011 ...) and row r + 1 "N-10xx SOOTBLOWER SKIPPED" (M.4010 ...): read on all 30 rows of
     DITL-80A ~ 80F */
  const sb = defOf('MK15');
  if (sb)
    sb.art = sb.art.replace(/<text([^>]*?) data-dy="(DITL-80[A-F])\|o\|(\d+)" data-on="(N-10\d\d)"/g, (m, a, d, r, n) => {
      const id = 'SB' + n;
      if (!sb.mach[id]) sb.mach[id] = pbf(n, /80F/.test(d) ? 'Air preheater sootblower' : 'Sootblower', d, +r, 'OPERATING', [['START', +r], ['SKIP', +r + 1]]);
      return `<text${a} data-hit="${id}" style="cursor:pointer" data-dy="${d}|o|${r}" data-on="${n}"`;
    });
  /* COAL, LIMESTONE AND SAND (Jennie OK 2026-11-08: the sand start buttons of 20.PNG). The order of the drawings (MINA_NEXT "PR 310 retest"):
     ISOLATING VALVE OPEN first (DITL-776 row 3 M.0870 "SAND ISO. VALVE OPEN (CRT)", memory list 103): valves -1 / -2 open, ROUTE OK
     (out 13 M.0872), then SYSTEM READY; then SYSTEM START (DITL-771 row 3 M.0800 "SAND SYSTEM START (CRT)") / STOP (row 4 M.0802): SYSTEM ON
     (out 14). The label "Sand" = the system, the labels XV-SD1802A / B = the isolating valves */
  const cl = defOf('MK12');
  if (cl) {
    /* design review 2026-11-08 (Yuna): the faceplate title is the tag or the short name, the sub line the full name (as the debris
       filters: S-1504 / Debris filter), not in capitals */
    cl.mach.SDSYS = pbf('Sand system', 'Sand injection system', 'DITL-771', 14, 'SYSTEM ON', [['START', 2], ['STOP', 3]], 'SYSTEM OFF');
    cl.mach.SDISO = pbf('XV-SD1802A / B', 'Sand isolating valves', 'DITL-776', 13, 'ROUTE OK', [['OPEN', 2]], 'ROUTE NOT OK');
    cl.art = cl.art
      .replace(/<text([^>]*?)>Sand<\/text>/, '<text$1 data-hit="SDSYS" style="cursor:pointer">Sand</text>')
      .replace(/<text([^>]*?)>(XV-SD1802[AB])<\/text>/g, '<text$1 data-hit="SDISO" style="cursor:pointer">$2</text>');
  }
})();
