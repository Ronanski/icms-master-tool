/* HX page in the REALISTIC look: auxiliary steam, gland steam and condenser air removal (user 2026-11-17: "Ganyan ang HMI na
   gsto ko. Dapat iyan lang makita ko n mga itsura").
   THE PICTURE: the auxiliary steam header as one thick pipe across the page. Its two sources come in on the left (main steam
   through the reducing valve and its desuperheater, cold reheat through its two valves); below it hang the users (header
   drain, deaerator pegging steam, the start-up ejector, the steam jet air ejectors); above it on the right the gland steam
   line with its desuperheater and the steam seal feed valve of the turbine.
   THE CONNECTIONS: K1AU3-PD-014 Rev D, auxiliary steam, turbine packing steam and condenser air removal: from the main steam
   system MV-AS1391 and PCV-AS1010 (PIC-AS1004) with the desuperheater (spray water from the condensate system, XV-CD1123 and
   TCV-CD1124, TT-AS1001 after it); from the cold reheat system PCV-AS1020-1 / -2 (PIC-AS1005); header AS-1-002 with PT-AS1004 /
   1005 and TT-AS1003, safety valve ZV-AS1001 to the silencer Z-1007; PCV-AS1030 to the deaerator (PIC-CD1104); the header
   drain MV-AS1392 to the flash pipe; MV-AS1395 to the start-up ejector Z-1120; MV-AS1396 to the steam jet air ejectors
   Z-1119A / B / C / D on the ejector condenser H-1119; the gland steam desuperheater (XV-CD1125 and TCV-CD1126, TT-AS1015)
   and the drain separator T-1125 with its drain MV-AS1393; the steam seal feed valve PV-GS1031, the gland steam header
   (PT-GS1001, TE-GS1002 / 1003), the unloading valve PV-GS1034; the condenser vacuum breaker MV-AV1391 (temporary page 08).
   The steam seal feed valve and the exhaust hood spray belong to the turbine control system: on the page they are the two
   machines "GLAND STEAM SEAL" and "LP EXHAUST HOOD SPRAY" of temporary page 08, with their faceplates.
   Drawn simpler than the sheet: the four air ejectors are one; the ejector condenser, the gland steam condenser and its
   exhauster are on the Condensate page; the lines to the ESP hopper heating and to Unit 2 are not drawn; the turbine warming
   steam valve MV-AS1011 and its drain are on the Reheat steam page.
   Left out on purpose, all without a signal in hx-registry.js: hand valves, traps, the ejector supplier's valves and gauges,
   the packing lines of the turbine and of the turbine valves. */
(function () {
  const { V, E, M, C, X, L, page } = HX;
  const K = 'kg/cm²';
  const at = (it, x, y, o) => Object.assign(it, { x, y }, o || {});
  const W_H = 10,
    W_S = 6,
    W_SM = 4,
    W_WT = 3.4,
    W_DR = 3;
  /* places (the drawing is 1760 x 1000) */
  const HY = 440 /* the header */,
    HX0 = 440,
    HX1 = 1240,
    MSY = 220 /* from main steam */,
    CRY = 660 /* from cold reheat */,
    GSY = 250; /* gland steam */
  const HDR = 'v:PT-AS1004>1';
  const user = (id, item, x, o) => ({
    item: at(item, x, 540, Object.assign({ id, rot: 90, lab: 'l' }, o || {})),
    up: {
      med: 'steam',
      w: W_SM,
      pts: [[x, HY], id + '.l'],
      flow: item.loop ? 'l:' + item.loop : 'x:' + item.valve,
      arrow: false
    }
  });
  const dr = user('dr', X('MV-AS1392', 'Header drain valve', { wrap: 12 }), 610),
    pg = user('pg', C('PICCD1104', 'Deaerator pegging steam valve', { tag: 'PCV-AS1030', wrap: 13 }), 740),
    se = user('se', X('MV-AS1395', 'Start-up ejector steam valve', { wrap: 12 }), 920),
    ae = user('ae', X('MV-AS1396', 'Air ejector steam valve', { wrap: 12 }), 1140);

  page({
    id: 'aux-steam',
    group: 'Water and steam',
    title: 'Auxiliary steam and vacuum',
    about:
      'Auxiliary steam header with its two sources and its users, gland steam, condenser air removal. Connections: flow diagram K1AU3-PD-014 Rev D.',
    plan: {
      look: 'real',
      w: 1760,
      h: 1000,
      items: [
        /* ---- source 1: main steam, reducing valve, desuperheater ---- */
        at(L('drum-steam', 'Main steam', { back: true }), 90, MSY, { id: 'msl' }),
        at(X('MV-AS1391', 'Main steam to auxiliary steam valve', { wrap: 16 }), 230, MSY, { id: 'ms1', lab: 'b' }),
        at(C('PICAS1004', 'Reducing valve', { tag: 'PCV-AS1010', cname: 'Auxiliary steam reducing valve' }), 380, MSY, {
          id: 'prv',
          lab: 'b'
        }),
        at(E('spray', '', '', [], { flow: 'l:TICAS1001' }), 540, MSY, { id: 'ds1' }),
        at(L('condensate', 'Condensate', { back: true }), 250, 80, { id: 'cd1' }),
        at(X('XV-CD1123', 'Block valve', { cname: 'Auxiliary steam spray block valve' }), 360, 80, {
          id: 'xb1',
          lab: 'b'
        }),
        at(C('TICAS1001', 'Spray valve', { tag: 'TCV-CD1124', cname: 'Auxiliary steam spray valve' }), 460, 80, {
          id: 'sp1',
          lab: 'b'
        }),

        /* ---- source 2: cold reheat ---- */
        at(L('reheat-steam', 'Cold reheat steam', { back: true }), 110, CRY, { id: 'crl' }),
        at(C('PICAS1005', 'Cold reheat to auxiliary steam valves', { tag: 'PCV-AS1020-1 / -2', wrap: 18 }), 310, CRY, {
          id: 'crv',
          lab: 'b'
        }),

        /* ---- the users under the header ---- */
        dr.item,
        pg.item,
        se.item,
        ae.item,
        at(L('feedwater', 'To the deaerator'), 740, 680, { id: 'dal' }),
        at(E('ejector', 'Start-up ejector', 'Z-1120', [], { flow: 'x:MV-AS1395' }), 1010, 700, {
          id: 'ej1',
          sc: 1.6,
          lab: 'b'
        }),
        at(E('ejector', 'Steam jet air ejectors', 'Z-1119A / B / C / D', [], { flow: 'x:MV-AS1396' }), 1230, 840, {
          id: 'ej2',
          sc: 1.6,
          lab: 'b'
        }),
        at(L('condensate', 'Air ejector condenser'), 1420, 840, { id: 'ecl' }),

        /* ---- gland steam ---- */
        at(E('spray', '', '', [], { flow: 'l:TICAS1017' }), 1100, GSY, { id: 'ds2' }),
        at(L('condensate', 'Condensate', { back: true }), 820, 110, { id: 'cd2' }),
        at(X('XV-CD1125', 'Block valve', { cname: 'Gland steam spray block valve' }), 930, 110, {
          id: 'xb2',
          lab: 'b'
        }),
        at(C('TICAS1017', 'Spray valve', { tag: 'TCV-CD1126', cname: 'Gland steam spray valve' }), 1030, 110, {
          id: 'sp2',
          lab: 'b'
        }),
        at(X('MV-AS1393', 'Drain separator drain valve', { wrap: 14 }), 1250, 330, { id: 'dsd', rot: 90, lab: 'l' }),
        at(
          M('valve', 'GLAND STEAM SEAL', 'Steam seal feed valve', [V('Position', 'PV-GS1031', '%', 1)], {
            kind: 'control',
            tag: 'PV-GS1031'
          }),
          1400,
          GSY,
          { id: 'gs', lab: 'b' }
        ),
        at(L('turbine', 'Gland steam to the turbine'), 1620, GSY, { id: 'tul' }),

        /* ---- condenser: vacuum breaker and exhaust hood spray ---- */
        at(X('MV-AV1391', 'Condenser vacuum breaker', { wrap: 14 }), 1560, 620, { id: 'vb', lab: 'b' }),
        at(
          M('valve', 'LP EXHAUST HOOD SPRAY', 'Exhaust hood spray valve', [], {
            kind: 'control',
            tag: 'FV-CD1904',
            wrap: 14
          }),
          1560,
          800,
          { id: 'hs', lab: 'b' }
        )
      ],
      pipes: [
        /* main steam to the header */
        { med: 'steam', w: W_S, pts: ['msl.r', 'ms1.l'], flow: 'x:MV-AS1391', arrow: false },
        { med: 'steam', w: W_S, pts: ['ms1.r', 'prv.l'], flow: 'x:MV-AS1391' },
        { med: 'steam', w: W_S, pts: ['prv.r', 'ds1.l'], flow: 'l:PICAS1004', arrow: false },
        { med: 'steam', w: W_S, pts: ['ds1.r', [700, MSY], [700, HY]], flow: 'l:PICAS1004' },
        { med: 'condensate', w: W_WT, pts: ['cd1.r', 'xb1.l'], flow: 'l:TICAS1001', arrow: false },
        { med: 'condensate', w: W_WT, pts: ['xb1.r', 'sp1.l'], flow: 'l:TICAS1001' },
        { med: 'condensate', w: W_WT, pts: ['sp1.r', [533, 80], 'ds1.t'], flow: 'l:TICAS1001', arrow: false },
        /* cold reheat to the header */
        { med: 'reheat', w: W_S, pts: ['crl.r', 'crv.l'], flow: 'l:PICAS1005', arrow: false },
        { med: 'reheat', w: W_S, pts: ['crv.r', [456, CRY], [456, HY]], flow: 'l:PICAS1005' },
        /* the header */
        {
          med: 'steam',
          w: W_H,
          pts: [
            [HX0, HY],
            [HX1, HY]
          ],
          flow: HDR,
          arrow: false
        },
        /* users */
        dr.up,
        { med: 'drain', w: W_DR, pts: ['dr.r', [610, 620]], to: 'flash pipe', flow: 'x:MV-AS1392' },
        pg.up,
        { med: 'steam', w: W_SM, pts: ['pg.r', 'dal.t'], flow: 'l:PICCD1104' },
        se.up,
        { med: 'steam', w: W_SM, pts: ['se.r', [920, 700], 'ej1.l'], flow: 'x:MV-AS1395' },
        { med: 'air', w: W_SM, pts: ['ej1.r', [1110, 700]], to: 'outdoor', flow: 'x:MV-AS1395' },
        ae.up,
        { med: 'steam', w: W_SM, pts: ['ae.r', [1140, 840], 'ej2.l'], flow: 'x:MV-AS1396' },
        { med: 'air', w: W_SM, pts: ['ej2.r', 'ecl.l'], flow: 'x:MV-AS1396' },
        /* gland steam */
        { med: 'steam', w: W_SM, pts: [[1000, HY], [1000, GSY], 'ds2.l'], flow: HDR },
        { med: 'steam', w: W_SM, pts: ['ds2.r', 'gs.l'], flow: HDR },
        { med: 'steam', w: W_SM, pts: ['gs.r', 'tul.l'], flow: 'm:GLAND STEAM SEAL' },
        { med: 'condensate', w: W_WT, pts: ['cd2.r', 'xb2.l'], flow: 'l:TICAS1017', arrow: false },
        { med: 'condensate', w: W_WT, pts: ['xb2.r', 'sp2.l'], flow: 'l:TICAS1017' },
        { med: 'condensate', w: W_WT, pts: ['sp2.r', [1093, 110], 'ds2.t'], flow: 'l:TICAS1017', arrow: false },
        { med: 'drain', w: W_DR, pts: [[1250, GSY], 'dsd.l'], flow: 'x:MV-AS1393', arrow: false },
        { med: 'drain', w: W_DR, pts: ['dsd.r', [1250, 390]], to: 'flash pipe', flow: 'x:MV-AS1393' },
        /* condenser */
        { med: 'air', w: W_SM, pts: [[1460, 620], 'vb.l'], flow: 'x:MV-AV1391', arrow: false },
        { med: 'air', w: W_SM, pts: ['vb.r', [1660, 620]], to: 'condenser', flow: 'x:MV-AV1391' },
        { med: 'condensate', w: W_WT, pts: [[1460, 800], 'hs.l'], flow: 'm:LP EXHAUST HOOD SPRAY', arrow: false },
        { med: 'condensate', w: W_WT, pts: ['hs.r', [1660, 800]], to: 'exhaust hood', flow: 'm:LP EXHAUST HOOD SPRAY' }
      ],
      taps: [
        { x: 630, y: MSY, side: 't', label: 'After spray', key: 'TT-AS1001', unit: '°C', dp: 0, tag: 'TT-AS1001' },
        { x: 820, y: HY, side: 't', label: 'Header pressure', key: 'PT-AS1004', unit: K, tag: 'PT-AS1004' },
        { x: 910, y: HY, side: 't', label: 'Temperature', key: 'TT-AS1003', unit: '°C', dp: 0, tag: 'TT-AS1003' },
        { x: 1180, y: GSY, side: 't', label: 'After spray', key: 'TT-AS1015', unit: '°C', dp: 0, tag: 'TT-AS1015' },
        {
          x: 1500,
          y: GSY,
          side: 't',
          label: 'Gland steam header',
          key: 'PTGS10011',
          unit: K,
          dp: 2,
          tag: 'PT-GS1001-1'
        }
      ],
      texts: [
        { x: 820, y: HY + 30, s: 'AUXILIARY STEAM HEADER', cls: 'hx-zone', anchor: 'middle' },
        { x: 230, y: CRY - 60, s: 'Valve 1', key: 'ZT-AS1020-1', unit: '%', dp: 1 },
        { x: 230, y: CRY - 44, s: 'Valve 2', key: 'ZT-AS1020-2', unit: '%', dp: 1 },
        { x: 1460, y: 330, s: 'Gland steam temperature 1', key: 'TEGS1002', unit: '°C', dp: 0 },
        { x: 1460, y: 346, s: 'Gland steam temperature 2', key: 'TEGS1003', unit: '°C', dp: 0 },
        { x: 1460, y: 362, s: 'Turbine side', key: 'TT-AS1017', unit: '°C', dp: 0 },
        { x: 1460, y: 378, s: 'Unloading valve', key: 'PV-GS1034', unit: '%', dp: 1 },
        { x: 1440, y: 500, s: 'CONDENSER', cls: 'hx-zone' },
        { x: 1440, y: 520, s: 'Pressure', key: 'PT-CD1110', unit: K + ' abs', dp: 3 },
        { x: 1440, y: 536, s: 'Vacuum 1', key: 'PTST11101', unit: '', dp: 1 },
        { x: 1440, y: 552, s: 'Vacuum 2', key: 'PTST11102', unit: '', dp: 1 },
        { x: 1440, y: 568, s: 'Vacuum 3', key: 'PTST11103', unit: '', dp: 1 },
        { x: 1440, y: 900, s: 'Exhaust hood 1', key: 'TEST11101', unit: '°C', dp: 0 },
        { x: 1440, y: 916, s: 'Exhaust hood 2', key: 'TEST11102', unit: '°C', dp: 0 },
        { x: 1440, y: 932, s: 'Exhaust hood 3', key: 'TEST11103', unit: '°C', dp: 0 }
      ]
    }
  });
})();
