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
        return pbs.map(([l, r, k, v]) => [l, r, adr(d, r), k, v]);
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
      .replace(/<text([^>]*?)>(XV-SD1802[AB])<\/text>/g, '<text$1 data-hit="SDISO" style="cursor:pointer">$2</text>')
      /* LIMESTONE (sweep item 8, Mina item 8a beta.73: no start path). The order of the drawings DITL-LS10 / LS212 / LS110: FILL CYCLE
         START PB (LS10 row 3 M.1800, STOP row 5 M.1801) -> FILLING CYCLE ENABLED FLAG (out 3 M.180F) -> VALVE STATE CHANGE PERMIT (LS212
         M.182D) -> the maintained HMI switch ISOLATING VALVE A~H OPEN/CLOSE SW (LS212 row 10 M.184C; ISOLATING VALVE O/C FLAG out 19
         M.1810) -> FEEDER START COMMAND PB (LS110 row 8 M.1847, STOP row 9 M.1848; ROTOFEED START/STOP COMMAND out 6 O.024C MOR-M1311).
         The model (boiler.js AN_LM) answers these commands. Labels: Limestone = the system, XV-LM1811A ~ H, the rotary feeder L-1311 */
      .replace(/<text([^>]*?)>Limestone<\/text>/, '<text$1 data-hit="LMSYS" style="cursor:pointer">Limestone</text>')
      .replace(/<text([^>]*?)>(XV-LM1811[A-H])<\/text>/g, '<text$1 data-hit="LMISO" style="cursor:pointer">$2</text>')
      .replace(/<text([^>]*?)>rotary feeder L-1311<\/text>/, '<text$1 data-hit="LMFD" style="cursor:pointer">rotary feeder L-1311</text>');
    cl.mach.LMSYS = pbf('Limestone system', 'Limestone injection, filling cycle', 'DITL-LS10', 3, 'FILL CYCLE ON', [['START', 2], ['STOP', 4]], 'FILL CYCLE OFF');
    cl.mach.LMISO = pbf('XV-LM1811A ~ H', 'Limestone isolating valves', 'DITL-LS212', 19, 'OPEN', [['OPEN', 9, 'set', 1], ['CLOSE', 9, 'set', 0]], 'CLOSED');
    cl.mach.LMFD = pbf('L-1311', 'Limestone rotary feeder', 'DITL-LS110', 6, 'RUNNING', [['START', 7], ['STOP', 8]]);
  }
  /* PURGE AND TRIP (live Cold start 2026-11-13, finding F9: step 3 "Press FURNACE PURGE START" had no button). DITL-02 input row 6
     M.0500 "FURNACE PURGE START P.B." (CRT push button), STATUS = output row 6 "FURNACE PURGE IN PROGRESS". The permissives (rows 2 ~ 5
     burner SA dampers in purge position, row 15 M.050E furnace purge permissive) are all needed and already shown on the page */
  const pt = defOf('MK10');
  if (pt) {
    pt.mach.PURGE = pbf('Furnace purge', 'Furnace purge start (screen push button)', 'DITL-02', 5, 'PURGE IN PROGRESS', [['PURGE START', 5]], 'NOT IN PROGRESS');
    pt.art = pt.art
      .replace(/<text([^>]*?)>Press FURNACE PURGE START<\/text>/, '<text$1 data-hit="PURGE" style="cursor:pointer;text-decoration:underline">Press FURNACE PURGE START</text>')
      .replace(/<text([^>]*?)>M\.0500 \(screen push button\)<\/text>/, '<text$1 data-hit="PURGE" style="cursor:pointer">M.0500 (screen push button)</text>');
  }
  /* DIESEL AND BURNERS (live Cold start 2026-11-13, finding F10: the igniter and burner ON / OFF push buttons were on no page). DITL-09 /
     #B / #C / #D input rows 5 / 7 / 9 / 11 = IGNITER x "ON" / "OFF" P.B., BURNER x "ON" / "OFF" P.B. (M.0110 / 0111 / 0118 / 0119 for A),
     STATUS = output row 27 BURNER x REMOTE SELECTED (the CRT buttons need REMOTE). The label "Burner A" ... opens the faceplate */
  const db = defOf('MK11');
  if (db) {
    for (const x of 'ABCD') {
      const d = x === 'A' ? 'DITL-09' : 'DITL-09 #' + x;
      db.mach['BN' + x] = pbf('Burner ' + x, 'Igniter and burner ' + x + ' push buttons', d, 26, 'REMOTE', [['IGNITER ON', 4], ['IGNITER OFF', 6], ['BURNER ON', 8], ['BURNER OFF', 10]], 'NOT REMOTE');
      db.mach['BN' + x].df.free = 1; /* F10b: four separate presses, REMOTE does not lock IGNITER ON */
      db.art = db.art.replace(new RegExp('<text([^>]*?)>Burner ' + x + '</text>'), `<text$1 data-hit="BN${x}" style="cursor:pointer;text-decoration:underline">Burner ${x}</text>`);
    }
  }
})();
