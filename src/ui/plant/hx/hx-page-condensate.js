/* HX page in the REALISTIC look: condensate, from the condenser to the deaerator (user 2026-11-17: "Ganyan ang HMI na gsto ko.
   Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the condenser cut open on the left (exhaust neck, tube bundles, hotwell), the two condensate pumps in the pit
   beside it, the condensate line with the polisher branch, the air ejector condenser and the gland steam condenser, then the
   three low pressure heaters one above the other on the right, cut open, the condensate coming down past them (No. 1 on
   top), and on to the deaerator.
   THE CONNECTIONS: K1AU3-PD-016 Rev D, condensate system: condenser H-1110 with the hotwell; make-up into the condenser by
   MV-MU1001 and by the level valve LCV-MU1110; the two condensate pumps P-1116A / B (strainer with DPT-CD1001 / 1002) on one
   suction line; the common discharge line (PT-CD1117, TT-CD1118); the curtain spray XV-CD1006 and the flash chamber sprays
   XV-CD1004 / 1005; the condensate polisher branch (MV-CD1007 in, MV-CD1008 back) with the bypass valve FCV-CD1121 in the
   line; flow element FE-CD1120 and the minimum flow valve FCV-CD1120 back to the condenser; the dump valve LCV-CD1110; the
   steam jet air ejector condenser H-1119 (TT-CD1119 after it) and the gland steam condenser H-1903 (TT-CD1120 after it);
   the three low pressure heaters, EACH with its own inlet valve, outlet valve and bypass valve (PD-016; team-files/
   plant-study/11-heater-valves.md; the plant model reads the same nine valves, unit.js anHtrPath): No. 1 H-1101 with the motor
   valves MV-CD1001 / 1002 / bypass 1003 (TT-CD1101 before it, TT-CD1102 after it), No. 2 H-1102 with the gear operated hand
   valves V-CD1026 / 1027 / bypass 1028 (TT-CD1103-1 after it), No. 3 H-1103 with V-CD1029 / 1030 / bypass 1031 (TT-CD1103-2
   after it). The hand valves are valve symbols of the plant model: a click opens the field faceplate;
   flow element FE-CD1122 (FT-CD1122, PT-CD1122, TT-CD1122); the deaerator level valve LCV-CD1104; the deaerator (PD-017).
   Names of the values as the temporary page 05 gives them (neck temperature, flash chamber, pump outlet).
   Drawn simpler than the sheet:
   - the polisher itself is not drawn: its two valves end with the words "to polisher" / "from polisher";
   - the dump line and the sprays end with a word; the spray water lines to the auxiliary steam and gland steam desuperheaters
     (XV-CD1123, XV-CD1125) belong to the Auxiliary steam page, the low pressure bypass spray to the Reheat page;
   - the extraction steam and the drains of the low pressure heaters are not drawn (Extraction steam page).
   Left out on purpose, all without a signal in hx-registry.js: the other hand valves, vents, drains, the strainers, the level switches
   of the hotwell, the chemical dosing and sampling lines, the seal water lines. */
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
    RX = 1420 /* the condensate line down past the three heaters */,
    HX1 = 1610,
    HAY = 396,
    HBY = 615,
    HCY = 822 /* heater No. 1 (on top), No. 2, No. 3 */,
    HS = 1.5,
    WX = HX1 - 53 * HS /* the water box nozzles of the heaters */,
    VX = 1476 /* inlet and outlet valves */,
    BO1 = 64,
    BO2 = 50 /* a heater branch leaves the line this far above and comes back this far below the heater (No. 1: motor valves) */,
    TY = 944; /* line to the deaerator */
  const A = 'm:CEP-A',
    B = 'm:CEP-B',
    CD = A + '|' + B;
  /* one low pressure heater on the condensate line: inlet valve, heater, outlet valve, and the bypass valve in the line */
  const heater = (n, y, vin, vout, vby, rin, rout, rby) => {
    const h = 'h' + n,
      BO = n === 1 ? BO1 : BO2,
      through = CD + '&' + rin + '&' + rout;
    return {
      through,
      items: [
        at(E('heater', '', '', [], { id: 'l' + n, flow: through }), HX1, y, { id: h, under: true, sc: HS, mir: true }),
        at(vin, VX, y - BO, { id: h + 'i', lab: 't' }),
        at(vout, VX, y + BO, { id: h + 'o', lab: 'b' }),
        at(vby, RX, y, { id: h + 'b', rot: 90, lab: 'l' })
      ],
      pipes: [
        { med: 'condensate', w: W_CD, pts: [[RX, y - BO], h + 'i.l'], flow: CD + '&' + rin, arrow: false },
        { med: 'condensate', w: W_CD, pts: [h + 'i.r', [WX, y - BO], h + '.out'], flow: through },
        { med: 'condensate', w: W_CD, pts: [h + '.in', [WX, y + BO], h + 'o.r'], flow: through, arrow: false },
        { med: 'condensate', w: W_CD, pts: [h + 'o.l', [RX, y + BO]], flow: through },
        { med: 'condensate', w: W_SM, pts: [[RX, y - BO], h + 'b.l'], flow: CD + '&' + rby, arrow: false },
        { med: 'condensate', w: W_SM, pts: [h + 'b.r', [RX, y + BO]], flow: CD + '&' + rby, arrow: false }
      ]
    };
  };
  const fv = t => 'h:fv-' + t;
  const H1 = heater(
      1,
      HAY,
      X('MV-CD1001', 'Inlet valve', { cname: 'Low pressure heater 1 inlet valve', wrap: 12 }),
      X('MV-CD1002', 'Outlet valve', { cname: 'Low pressure heater 1 outlet valve', wrap: 12 }),
      X('MV-CD1003', 'Bypass valve', { cname: 'Low pressure heater 1 bypass valve', wrap: 10 }),
      'x:MV-CD1001',
      'x:MV-CD1002',
      'x:MV-CD1003'
    ),
    H2 = heater(
      2,
      HBY,
      HX.HV('V-CD1026'),
      HX.HV('V-CD1027'),
      HX.HV('V-CD1028'),
      fv('V-CD1026'),
      fv('V-CD1027'),
      fv('V-CD1028')
    ),
    H3 = heater(
      3,
      HCY,
      HX.HV('V-CD1029'),
      HX.HV('V-CD1030'),
      HX.HV('V-CD1031'),
      fv('V-CD1029'),
      fv('V-CD1030'),
      fv('V-CD1031')
    );
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
        ...H1.items,
        ...H2.items,
        ...H3.items,

        /* ---- to the deaerator ---- */
        at(C('LICCD1104', 'Deaerator level valve', { tag: 'LCV-CD1104', wrap: 14 }), 1692, TY, { id: 'dlv', lab: 't' }),
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
        { med: 'condensate', w: W_CD, pts: ['gsc.t', [UX, 300], [RX, 300], [RX, HAY - BO1]], flow: CD },
        /* the three heaters, each with its inlet valve, its outlet valve and its bypass valve in the line */
        ...H1.pipes,
        {
          med: 'condensate',
          w: W_CD,
          pts: [
            [RX, HAY + BO1],
            [RX, HBY - BO2]
          ],
          flow: CD
        },
        ...H2.pipes,
        {
          med: 'condensate',
          w: W_CD,
          pts: [
            [RX, HBY + BO2],
            [RX, HCY - BO2]
          ],
          flow: CD
        },
        ...H3.pipes,
        /* to the deaerator */
        { med: 'condensate', w: W_CD, pts: [[RX, HCY + BO2], [RX, TY], 'dlv.l'], flow: CD },
        { med: 'condensate', w: W_CD, pts: ['dlv.r', [1736, TY], [1736, 150], 'dal.r'], flow: 'l:LICCD1104' }
      ],
      taps: [
        { x: 560, y: HY, side: 't', label: 'Temperature', key: 'TTCD1118', unit: '°C', dp: 0, tag: 'TT-CD1118' },
        { x: 640, y: HY, side: 't', label: 'Pump outlet', key: 'PTCD1117', unit: K, tag: 'PT-CD1117' },
        { x: 1158, y: HY, side: 't', label: 'Flow', key: 'FTCD1120', unit: 't/h', tag: 'FT-CD1120' },
        { x: UX, y: 466, side: 'l', label: 'Temperature', key: 'TTCD1119', unit: '°C', dp: 0, tag: 'TT-CD1119' },
        { x: UX, y: 360, side: 'l', label: 'Temperature', key: 'TTCD1120', unit: '°C', dp: 0, tag: 'TT-CD1120' },
        { x: 1340, y: 300, side: 't', label: 'Heater 1 inlet', key: 'TT-CD1101', unit: '°C', dp: 0, tag: 'TT-CD1101' },
        {
          x: RX,
          y: (HAY + HBY) / 2,
          side: 'l',
          label: 'After heater 1',
          key: 'TT-CD1102',
          unit: '°C',
          dp: 0,
          tag: 'TT-CD1102'
        },
        {
          x: RX,
          y: (HBY + HCY) / 2,
          side: 'l',
          label: 'After heater 2',
          key: 'TT-CD1103-1',
          unit: '°C',
          dp: 0,
          tag: 'TT-CD1103-1'
        },
        {
          x: RX,
          y: HCY + BO2 + 36,
          side: 'l',
          label: 'After heater 3',
          key: 'TT-CD1103-2',
          unit: '°C',
          dp: 0,
          tag: 'TT-CD1103-2'
        },
        { x: 1545, y: TY, side: 't', label: 'Flow', key: 'FTCD1122', unit: 't/h', tag: 'FT-CD1122' },
        { x: 1615, y: TY, side: 't', label: 'Pressure', key: 'PTCD1122', unit: K, tag: 'PT-CD1122' },
        { x: 1580, y: TY, side: 'b', label: 'Temperature', key: 'TT-CD1122', unit: '°C', dp: 0, tag: 'TT-CD1122' }
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
        { x: HX1 + 14, y: HAY - 46, s: 'Low pressure heater 1', cls: 'hx-name', anchor: 'middle' },
        { x: HX1 + 14, y: HBY - 46, s: 'Low pressure heater 2', cls: 'hx-name', anchor: 'middle' },
        { x: HX1 + 14, y: HCY - 46, s: 'Low pressure heater 3', cls: 'hx-name', anchor: 'middle' },
        { x: 1000, y: 478, s: 'from polisher', cls: 'hx-end', anchor: 'middle' },
        { x: 900, y: 508, s: 'Polisher flow', key: 'FTCD1121', unit: 't/h', anchor: 'middle' }
      ]
    }
  });
})();
