/* HX page in the REALISTIC look: condensate, from the condenser to the deaerator (user 2026-11-17: "Ganyan ang HMI na gsto ko.
   Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the condenser cut open on the left (exhaust neck, tube bundles, hotwell), the two condensate pumps in the pit
   beside it, the condensate line with the polisher branch, the air ejector condenser and the gland steam condenser, then the
   three low pressure heaters one above the other on the right, cut open, and on to the deaerator.
   THE CONNECTIONS: K1AU3-PD-016 Rev D, condensate system: condenser H-1110 with the hotwell; make-up into the condenser by
   MV-MU1001 and by the level valve LCV-MU1110; the two condensate pumps P-1116A / B (strainer with DPT-CD1001 / 1002) on one
   suction line; the common discharge line (PT-CD1117, TT-CD1118); the curtain spray XV-CD1006 and the flash chamber sprays
   XV-CD1004 / 1005; the condensate polisher branch (MV-CD1007 in, MV-CD1008 back) with the bypass valve FCV-CD1121 in the
   line; flow element FE-CD1120 and the minimum flow valve FCV-CD1120 back to the condenser; the dump valve LCV-CD1110; the
   steam jet air ejector condenser H-1119 (TT-CD1119 after it) and the gland steam condenser H-1903 (TT-CD1120 after it);
   the inlet valve MV-CD1001, No. 1 low pressure heater H-1101 (TT-CD1101 before it, TT-CD1102 after it), No. 2 H-1102
   (TT-CD1103-1 after it), No. 3 H-1103 (TT-CD1103-2 after it), the outlet valve MV-CD1002 and the bypass valve MV-CD1003;
   flow element FE-CD1122 (FT-CD1122, PT-CD1122, TT-CD1122); the deaerator level valve LCV-CD1104; the deaerator (PD-017).
   Names of the values as the temporary page 05 gives them (neck temperature, flash chamber, pump outlet).
   Drawn simpler than the sheet:
   - the polisher itself is not drawn: its two valves end with the words "to polisher" / "from polisher";
   - the dump line and the sprays end with a word; the spray water lines to the auxiliary steam and gland steam desuperheaters
     (XV-CD1123, XV-CD1125) belong to the Auxiliary steam page, the low pressure bypass spray to the Reheat page;
   - the extraction steam and the drains of the low pressure heaters are not drawn (Extraction steam page).
   Left out on purpose, all without a signal in hx-registry.js: hand valves, vents, drains, the strainers, the level switches
   of the hotwell, the chemical dosing and sampling lines, the seal water lines. FT-CD1121 (polisher bypass flow) is the
   measured value in the faceplate of its valve. */
(function () {
  const { V, E, M, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_CD = 6,
    W_SM = 4,
    W_DR = 3;
  /* places (the drawing is 1760 x 1000) */
  const CX = 330,
    CY = 250,
    CS = 1.6 /* condenser: top of the neck */,
    PAX = 470,
    PBX = 690,
    PY = 700,
    PS = 1.6 /* the two pumps */,
    SUY = 880 /* suction line under the pumps */,
    HY = 600 /* common discharge line */,
    RY = 400 /* minimum flow back to the condenser */,
    UX = 1250 /* up through the two small condensers */,
    DNX = 1320 /* down to the low pressure heaters */,
    HX1 = 1520,
    HAY = 800,
    HBY = 640,
    HCY = 480 /* heater No. 1 (lowest), No. 2, No. 3 */,
    HS = 1.5,
    WX = HX1 - 53 * HS /* condensate up through the three heaters */,
    TY = 250; /* line to the deaerator */
  const A = 'm:CEP-A',
    B = 'm:CEP-B',
    CD = A + '|' + B;
  const spray = (id, valve, name, cname, x, to) => ({
    item: at(X(valve, name, { wrap: 10, cname }), x, 690, { id, rot: 90, lab: 'l' }),
    pipes: [
      { med: 'condensate', w: W_DR, pts: [[x, HY], id + '.l'], flow: 'x:' + valve, arrow: false },
      { med: 'condensate', w: W_DR, pts: [id + '.r', [x, 744]], to, flow: 'x:' + valve }
    ]
  });
  const cs = spray('cs', 'XV-CD1006', 'Curtain spray', 'Curtain spray valve', 790, 'curtain spray'),
    f1 = spray('fs1', 'XV-CD1004', 'Flash spray 1', 'Flash chamber spray valve 1', 925, 'flash chamber'),
    f2 = spray('fs2', 'XV-CD1005', 'Flash spray 2', 'Flash chamber spray valve 2', 1060, 'flash chamber');

  page({
    id: 'condensate',
    group: 'Water and steam',
    title: 'Condensate',
    about:
      'Condenser, condensate pumps, low pressure heaters and the way to the deaerator. Connections: flow diagram K1AU3-PD-016 Rev D.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- condenser with its make-up ---- */
        at(E('condenser', '', '', [], { id: 'cd', steam: 'v:SI-TB>50' }), CX, CY, { id: 'cd', under: true, sc: CS }),
        at(L('makeup-cooling', 'Make-up water', { back: true }), 80, 250, { id: 'mul' }),
        at(X('MV-MU1001', 'Make-up valve', { cname: 'Make-up to the hotwell valve' }), 130, 352, {
          id: 'mu1',
          lab: 't'
        }),
        at(C('LICCD1110A', 'Hotwell level make-up valve', { tag: 'LCV-MU1110', wrap: 16 }), 130, 450, {
          id: 'mu2',
          lab: 'b'
        }),

        /* ---- the two condensate pumps ---- */
        at(
          M('vpump', 'CEP-A', 'Condensate pump A', [V('Current', 'ITP1116A', 'A'), V('Strainer', 'DPCEPA', K, 2)], {
            wrap: 12
          }),
          PAX,
          PY,
          { id: 'pa', sc: PS, lab: 'l' }
        ),
        at(
          M('vpump', 'CEP-B', 'Condensate pump B', [V('Current', 'ITP1116B', 'A'), V('Strainer', 'DPCEPB', K, 2)], {
            wrap: 12
          }),
          PBX,
          PY,
          { id: 'pb', sc: PS, lab: 'l' }
        ),

        /* ---- on the discharge line: sprays, polisher branch, minimum flow, dump ---- */
        cs.item,
        f1.item,
        f2.item,
        at(X('MV-CD1007', 'Polisher inlet valve', { wrap: 12 }), 800, 540, { id: 'pin', rot: -90, lab: 'l' }),
        at(C('FICCD1121', 'Polisher bypass valve', { tag: 'FCV-CD1121', wrap: 14 }), 900, HY, { id: 'pby', lab: 't' }),
        at(X('MV-CD1008', 'Polisher outlet valve', { wrap: 12 }), 1000, 540, { id: 'pout', rot: 90, lab: 'r' }),
        at(C('FICCD1120', 'Minimum flow valve', { tag: 'FCV-CD1120' }), 700, RY, { id: 'mf', lab: 't' }),
        at(
          C('LICCD1110B', 'Level dump valve', { tag: 'LCV-CD1110', wrap: 10, cname: 'Hotwell level dump valve' }),
          1210,
          690,
          {
            id: 'dmp',
            rot: 90,
            lab: 'l'
          }
        ),

        /* ---- the two small condensers in the line ---- */
        at(E('vessel', 'Air ejector condenser', 'H-1119', [], { w: 84, liquid: 'none', wrap: 12 }), UX, 520, {
          id: 'ejc',
          lab: 'l'
        }),
        at(E('vessel', 'Gland steam condenser', 'H-1903', [], { w: 84, liquid: 'none', wrap: 12 }), UX, 410, {
          id: 'gsc',
          lab: 'l'
        }),

        /* ---- the three low pressure heaters with inlet, outlet and bypass valve ---- */
        at(E('heater', '', '', [], { id: 'l1', flow: CD }), HX1, HAY, { id: 'h1', under: true, sc: HS, mir: true }),
        at(E('heater', '', '', [], { id: 'l2', flow: CD }), HX1, HBY, { id: 'h2', under: true, sc: HS, mir: true }),
        at(E('heater', '', '', [], { id: 'l3', flow: CD }), HX1, HCY, { id: 'h3', under: true, sc: HS, mir: true }),
        at(X('MV-CD1001', 'Heater inlet valve', { cname: 'Low pressure heater inlet valve', wrap: 12 }), DNX, 800, {
          id: 'hin',
          rot: 90,
          lab: 'l'
        }),
        at(X('MV-CD1002', 'Heater outlet valve', { cname: 'Low pressure heater outlet valve', wrap: 12 }), WX, 350, {
          id: 'hout',
          rot: -90,
          lab: 'r'
        }),
        at(X('MV-CD1003', 'Heater bypass valve', { cname: 'Low pressure heater bypass valve' }), 1382, TY, {
          id: 'hby',
          lab: 't'
        }),

        /* ---- to the deaerator ---- */
        at(C('LICCD1104', 'Deaerator level valve', { tag: 'LCV-CD1104', wrap: 14 }), 1660, TY, { id: 'dlv', lab: 'b' }),
        at(L('feedwater', 'To the deaerator'), 1660, 150, { id: 'dal' })
      ],
      pipes: [
        /* make-up into the condenser: the motor valve and the level valve side by side */
        { med: 'condensate', w: W_SM, pts: ['mul.b', [80, 352], 'mu1.l'], flow: 'x:MV-MU1001', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['mu1.r', 'cd.mu'], flow: 'x:MV-MU1001|l:LICCD1110A' },
        { med: 'condensate', w: W_SM, pts: [[80, 352], [80, 450], 'mu2.l'], flow: 'l:LICCD1110A', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['mu2.r', [180, 450], [180, 352]], flow: 'l:LICCD1110A', arrow: false },
        /* suction: hotwell to the two pumps, into the bottom of each can */
        { med: 'condensate', w: W_CD, pts: ['cd.hw', [CX, SUY], [PAX, SUY]], flow: CD },
        { med: 'condensate', w: W_CD, pts: [[PAX, SUY], 'pa.b'], flow: A, arrow: false },
        { med: 'condensate', w: W_CD, pts: [[PAX, SUY], [PBX, SUY], 'pb.b'], flow: B, arrow: false },
        /* discharge */
        { med: 'condensate', w: W_CD, pts: ['pa.d', [PAX + 22 * PS, HY]], flow: A, arrow: false },
        { med: 'condensate', w: W_CD, pts: ['pb.d', [PBX + 22 * PS, HY]], flow: B, arrow: false },
        {
          med: 'condensate',
          w: W_CD,
          pts: [
            [PAX + 22 * PS, HY],
            [800, HY]
          ],
          flow: CD
        },
        ...cs.pipes,
        ...f1.pipes,
        ...f2.pipes,
        /* polisher branch and its bypass valve in the line */
        { med: 'condensate', w: W_SM, pts: [[800, HY], 'pin.l'], flow: 'x:MV-CD1007', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['pin.r', [800, 486]], to: 'to polisher', flow: 'x:MV-CD1007' },
        { med: 'condensate', w: W_CD, pts: [[800, HY], 'pby.l'], flow: 'l:FICCD1121', arrow: false },
        { med: 'condensate', w: W_CD, pts: ['pby.r', [1000, HY]], flow: 'l:FICCD1121', arrow: false },
        { med: 'condensate', w: W_SM, pts: [[1000, 486], 'pout.l'], flow: 'x:MV-CD1008', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['pout.r', [1000, HY]], flow: 'x:MV-CD1008' },
        {
          med: 'condensate',
          w: W_CD,
          pts: [
            [1000, HY],
            [1120, HY]
          ],
          flow: CD
        },
        /* minimum flow back to the condenser, dump */
        { med: 'condensate', w: W_SM, pts: [[1120, HY], [1120, RY], 'mf.r'], flow: 'l:FICCD1120', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['mf.l', [520, RY], [520, CY + 64 * CS], 'cd.rc'], flow: 'l:FICCD1120' },
        {
          med: 'condensate',
          w: W_CD,
          pts: [
            [1120, HY],
            [1210, HY]
          ],
          flow: CD,
          arrow: false
        },
        { med: 'condensate', w: W_DR, pts: [[1210, HY], 'dmp.l'], flow: 'l:LICCD1110B', arrow: false },
        { med: 'condensate', w: W_DR, pts: ['dmp.r', [1210, 744]], to: 'storage tank', flow: 'l:LICCD1110B' },
        /* through the two small condensers */
        { med: 'condensate', w: W_CD, pts: [[1210, HY], [UX, HY], 'ejc.b'], flow: CD },
        { med: 'condensate', w: W_CD, pts: ['ejc.t', 'gsc.b'], flow: CD, arrow: false },
        { med: 'condensate', w: W_CD, pts: ['gsc.t', [UX, 330], [DNX, 330]], flow: CD },
        /* the heaters: inlet valve, No. 1, No. 2, No. 3, outlet valve; the bypass valve past them */
        { med: 'condensate', w: W_CD, pts: [[DNX, 330], 'hin.l'], flow: 'x:MV-CD1001', arrow: false },
        { med: 'condensate', w: W_CD, pts: ['hin.r', [DNX, 900], [WX, 900], 'h1.in'], flow: 'x:MV-CD1001' },
        { med: 'condensate', w: W_CD, pts: ['h1.out', 'h2.in'], flow: 'x:MV-CD1001', arrow: false },
        { med: 'condensate', w: W_CD, pts: ['h2.out', 'h3.in'], flow: 'x:MV-CD1001', arrow: false },
        { med: 'condensate', w: W_CD, pts: ['h3.out', 'hout.l'], flow: 'x:MV-CD1002', arrow: false },
        { med: 'condensate', w: W_CD, pts: ['hout.r', [WX, TY]], flow: 'x:MV-CD1002' },
        { med: 'condensate', w: W_SM, pts: [[DNX, 330], [DNX, TY], 'hby.l'], flow: 'x:MV-CD1003', arrow: false },
        { med: 'condensate', w: W_SM, pts: ['hby.r', [WX, TY]], flow: 'x:MV-CD1003', arrow: false },
        /* to the deaerator */
        { med: 'condensate', w: W_CD, pts: [[WX, TY], 'dlv.l'], flow: CD },
        { med: 'condensate', w: W_CD, pts: ['dlv.r', [1736, TY], [1736, 150], 'dal.r'], flow: 'l:LICCD1104' }
      ],
      taps: [
        { x: 560, y: HY, side: 't', label: 'Temperature', key: 'TTCD1118', unit: '°C', dp: 0, tag: 'TT-CD1118' },
        { x: 640, y: HY, side: 't', label: 'Pump outlet', key: 'PTCD1117', unit: K, tag: 'PT-CD1117' },
        { x: 1158, y: HY, side: 't', label: 'Flow', key: 'FTCD1120', unit: 't/h', tag: 'FT-CD1120' },
        { x: UX, y: 466, side: 'l', label: 'Temperature', key: 'TTCD1119', unit: '°C', dp: 0, tag: 'TT-CD1119' },
        { x: UX, y: 360, side: 'l', label: 'Temperature', key: 'TTCD1120', unit: '°C', dp: 0, tag: 'TT-CD1120' },
        { x: 1380, y: 900, side: 'b', label: 'Heater 1 inlet', key: 'TT-CD1101', unit: '°C', dp: 0, tag: 'TT-CD1101' },
        { x: WX, y: 722, side: 'l', label: 'After heater 1', key: 'TT-CD1102', unit: '°C', dp: 0, tag: 'TT-CD1102' },
        {
          x: WX,
          y: 562,
          side: 'l',
          label: 'After heater 2',
          key: 'TT-CD1103-1',
          unit: '°C',
          dp: 0,
          tag: 'TT-CD1103-1'
        },
        {
          x: WX,
          y: 408,
          side: 'l',
          label: 'After heater 3',
          key: 'TT-CD1103-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-CD1103-2'
        },
        { x: 1500, y: TY, side: 't', label: 'Flow', key: 'FTCD1122', unit: 't/h', tag: 'FT-CD1122' },
        { x: 1580, y: TY, side: 't', label: 'Pressure', key: 'PTCD1122', unit: K, tag: 'PT-CD1122' },
        { x: 1540, y: TY, side: 'b', label: 'Temperature', key: 'TT-CD1122', unit: '°C', dp: 0, tag: 'TT-CD1122' }
      ],
      texts: [
        { x: CX, y: CY - 16, s: 'from the low pressure turbine', cls: 'hx-note', anchor: 'middle' },
        { x: 150, y: 580, s: 'Condenser', cls: 'hx-name' },
        { x: 36, y: 110, s: 'Pressure', key: 'PTCD1110', unit: K + ' abs', dp: 3 },
        { x: 36, y: 126, s: 'Neck temperature', key: 'TTCD11103', unit: '°C', dp: 0 },
        { x: 36, y: 142, s: 'Flash chamber', key: 'TTCD11104', unit: '°C', dp: 0 },
        { x: 36, y: 158, s: 'Hotwell 1', key: 'TTCD11101', unit: '°C', dp: 0 },
        { x: 36, y: 174, s: 'Hotwell 2', key: 'TTCD11102', unit: '°C', dp: 0 },
        { x: 36, y: 190, s: 'Hotwell level', key: 'LTCD1110', unit: 'mm', dp: 0 },
        { x: HX1, y: HAY - 50, s: 'Low pressure heater 1', cls: 'hx-name', anchor: 'middle' },
        { x: HX1, y: HBY - 50, s: 'Low pressure heater 2', cls: 'hx-name', anchor: 'middle' },
        { x: HX1, y: HCY - 50, s: 'Low pressure heater 3', cls: 'hx-name', anchor: 'middle' },
        { x: 1000, y: 478, s: 'from polisher', cls: 'hx-end', anchor: 'middle' }
      ]
    }
  });
})();
