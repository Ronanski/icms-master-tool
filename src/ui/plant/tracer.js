/* SIGNAL PATH (3.2.3-beta.113, user 2026-11-12 "Masterlist ng lahat ng address ..." and "Hndi naman ganyan ang gawa nya eh"):
   the Library tab drawn like the DCS Signal Tracer of the control network study (ARIN): choices "Connected to", "Marshalling
   panel" and "Signal type", a search, the picture of the path of the chosen signal (field / other panel -> junction box ->
   marshalling panel field strip -> cross wiring -> system strip -> prefab cable -> FCS terminal board -> I/O card -> address)
   and the table of the signals below. A row click draws its path; the path caption opens the info card.
   Data: the marshalling wiring in the app (src/ui/plant/wiring.js = LMYP-1(#1) WIRING.xls 2023-10-03), the I/O list
   descriptions (AN.ades) where the wiring row has none, and ORIG below: where a signal starts before the rack room when it
   comes through the turbine control system (TCS Elementary Diagram 331DM07733 sheets TC0160, TC0532 ~ 0536, TC0751 ~ 0751F,
   TC0763, TC0791 ~ 0793; dcs-io-list.xls From / To remark). GCP-AI1004 / 1005: the wiring list writes GCP->DCS, the TCS
   drawing shows them through TCS GXF6 / GXF1; the drawing is followed (as in the study). Read only. */
(function () {
  /* 3.2.3-beta.118 ~ 119: the whole chain before the rack room, with terminals and what travels on each line, as read by the control
     network study (ARIN, add_origin.py v2): GCP side from GSE-2013-0083 (7X7SKB1104) sheets 50 ~ 53 (GA126 ~ GA130) and 70 ~ 73
     (GA187 / GA188 / GA190); TCS side from TCS Elementary Diagram 331DM07733 (input SD-AI-L GXF ch1..8 = 1/2, 5/6, 9/10, 13/14,
     21/22, 25/26, 29/30, 33/34, TC0751; output SD-AO GXF / AXF chN = 2N-1 / 2N, TC0791 / TC0160).
     Hop = [name, note, terminal +, terminal −, what travels on the line to the next hop]. '–' = not in the documents; '' = no wire. */
  const T = 'TCS Elementary Diagram 331DM07733',
    G = 'GSE-2013-0083 (7X7SKB1104) sh50-53 GA126 ~ GA130 + sh70-73 GA187 / GA188 / GA190',
    MA = '4-20 mA DC, 2 wires';
  const INT = { 1: [1, 2], 2: [5, 6], 3: [9, 10], 4: [13, 14], 5: [21, 22], 6: [25, 26], 7: [29, 30], 8: [33, 34] };
  const OT = ch => [String(2 * ch - 1), String(2 * ch)];
  /* terminals as a list ('1,2,3,4') = one point per wire; hop[6] = the terminals where the wires come in (tracer v7) */
  const CTH = [
    ['Generator CT GA016CT4', '10000/5 A (sheet GA126)', '1,2,3,4', '', 'CT 5 A AC, 4 wires, cable GA016C001'],
    ['TCS PLU (TCS-4 rack)', 'CT passes through PLU DEX1: in 1 ~ 4, out 5 ~ 8 (TCS drawing TC0412)', '5,6,7,8', '', 'CT 5 A AC, 4 wires, cable GA126C001', '', '1,2,3,4'],
    ['GCP terminal block X05', 'GA230, terminals 1 ~ 4', '1,2,3,4', '', 'CT 5 A AC, 4 wires', '', '1,2,3,4'],
    ['GCP test terminal FJ2 (P12)', 'MT-42A, test terminal', '11,22,33,44', '', 'CT 5 A AC, 4 wires GA126A04 / B04 / C04 / NE04', '', '11,22,33,44']
  ];
  const VTH = [
    ['Generator VT2 GA022VT2', '13.8 kV/√3 : 115 V/√3, star: 3 phases + neutral (sheet GA126)', '1,2,3,4', '', 'VT 115 V AC, 4 wires (3 phases + neutral), cable GA022V003'],
    ['GCP terminal block X04', 'GA229, terminals 1 ~ 4 (5 ~ 8 carry the same VT on to the full time recorder)', '1,2,3,4', '', 'VT 115 V AC, 4 wires', '', '1,2,3,4'],
    ['GCP fuses F09 / F08 / F07', 'EFB-5, 3 A, one fuse per phase; neutral (4) has no fuse', 'F09,F08,F07,N', '', 'VT 115 V AC, 4 wires'],
    ['GCP test terminal FJ1 (P11)', 'MT-41A. Only the 3 phases (11 / 22 / 33) go on to the transducers; 44 = neutral', '11,22,33,44', '', 'VT 115 V AC, 3 wires GA126A03 / B03 / C03', '', '11,22,33,44']
  ];
  const SRC = { CT: CTH, VT: VTH, CTVT: CTH },
    VTNOTE = ' + VT2 115 V into P1 / P2 / P3 (VT path: VT2 → X04 → fuses F09 / F08 / F07 → test terminal FJ1 → GA126A03 / B03 / C03)',
    CTVTL = 'CT 5 A + VT 115 V AC, 7 wires: CT GA126A04 / B04 / C04 / NE04 from FJ2 + VT GA126A03 / B03 / C03 from FJ1',
    TIN = { CT: '1S,1L,3S,3L', VT: 'P1,P2,P3', CTVT: '1S,1L,3S,3L,P1,P2,P3' };
  const GX = {
    'I A': ['1', '2', 'GA12801/02', 'X11', '1', '2', 'CT'],
    'I B': ['3', '4', 'GA12804/05', 'X11', '4', '5', 'CT'],
    'I C': ['5', '6', 'GA12807/08', 'X11', '7', '8', 'CT'],
    'V A-B': ['7', '8', 'GA12810/11', 'X11', '10', '11', 'VT'],
    'V B-C': ['9', '10', 'GA12813/14', 'X11', '13', '14', 'VT'],
    'V C-A': ['11', '12', 'GA12816/17', 'X11', '16', '17', 'VT'],
    MVAR: ['15', '16', 'GA12822/23', 'X11', '22', '23', 'CTVT'],
    PF: ['17', '18', 'GA12825/26', 'X12', '1', '2', 'CTVT'],
    Hz: ['19', '20', 'GA12828/29', 'X12', '4', '5', 'VT']
  };
  const cp = a => a.map(h => h.slice());
  const gcphops = name => {
    const t = GX[name],
      inp = { CT: 'CT into 1S / 1L / 3S / 3L', VT: 'VT into P1 / P2 / P3', CTVT: 'CT into 1S / 1L / 3S / 3L' + VTNOTE }[t[6]],
      H = cp(SRC[t[6]]);
    if (t[6] === 'CTVT') H[H.length - 1][4] = CTVTL;
    return H.concat([
      ['GCP multi transducer', 'QT2-93A (U01GA101), sheet GA128. ' + inp + '. Out ' + t[0] + ' / ' + t[1], t[0], t[1], '4-20 mA DC, wires ' + t[2], '', TIN[t[6]]],
      ['GCP terminal block ' + t[3], 'to TCS (sheet GA187)', t[4], t[5], MA]
    ]);
  };
  const gcp = (name, insh, inb, inch, outsh, outb, outch) => {
    const i = INT[inch],
      o = OT(outch);
    return ['GCP', gcphops(name).concat([['TCS input ' + inb + ' ch' + inch, 'sheet ' + insh + ' (TCS-7 rack)', String(i[0]), String(i[1]), 'inside the TCS controller'], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh + ' (TCS-7 rack)', o[0], o[1], MA]]), G + '; ' + T + ' ' + insh + ' + ' + outsh + ' (GSE labels the TCS strips GXF2 ~ 4, the TCS drawing GXF1 ~ 3, same terminal numbers); I/O list remark "From TCS"'];
  };
  const fld = (dev, insh, inname, outsh, outb, outch, media) => {
    const o = OT(outch);
    return ['Field', [[dev, 'field sensor', '–', '–', media || '4-20 mA DC'], ['TCS input ' + inname, 'sheet ' + insh, '–', '–', 'inside the TCS controller'], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh, o[0], o[1], MA]], T + ' ' + insh + ' + ' + outsh];
  };
  const tcs = (what, outsh, outb, outch) => {
    const o = OT(outch);
    return ['TCS', [['TCS controller', what, '', '', 'inside the TCS controller'], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh, o[0], o[1], MA]], T + ' ' + outsh];
  };
  /* station|address -> [origin, hops, source] */
  const ORIG = {
    '2|AI0791': gcp('I A', 'TC0751', 'GXF1', 3, 'TC0791', 'GXF11', 5),
    '2|AI0807': gcp('V A-B', 'TC0751', 'GXF1', 2, 'TC0791', 'GXF11', 6),
    '2|AI0855': gcp('I B', 'TC0751A', 'GXF2', 3, 'TC0792', 'GXF12', 4),
    '2|AI0871': gcp('V B-C', 'TC0751A', 'GXF2', 2, 'TC0792', 'GXF12', 5),
    '2|AI0887': gcp('I C', 'TC0751B', 'GXF3', 2, 'TC0793', 'GXF10', 1),
    '2|AI0903': gcp('V C-A', 'TC0751B', 'GXF3', 1, 'TC0793', 'GXF10', 2),
    '2|AI0775': gcp('MVAR', 'TC0751E', 'GXF6', 1, 'TC0792', 'GXF12', 3),
    '2|AI0823': gcp('PF', 'TC0751E', 'GXF6', 2, 'TC0792', 'GXF12', 6),
    '2|AI0839': gcp('Hz', 'TC0751E', 'GXF6', 5, 'TC0792', 'GXF12', 7),
    '2|AI0452': fld('TE-LO1002-1', 'TC0763', 'RTD AI(9)', 'TC0791', 'GXF11', 1, 'RTD (resistance)'),
    '2|AI0516': fld('TE-LO1002-2', 'TC0763', 'RTD AI(9)', 'TC0792', 'GXF12', 1, 'RTD (resistance)'),
    '2|AI0757': fld('ZT-AS1011', 'TC0751F', 'COM AI(7)', 'TC0791', 'GXF11', 3),
    '2|AI0883': fld('PT-ST1001-1', 'TC0532', 'TPC AI(1)', 'TC0160', 'AXF3', 3),
    '2|AI0884': fld('PT-ST1001-2', 'TC0534', 'TPC AI(3)', 'TC0160', 'AXF3', 4),
    '2|AI0885': fld('PT-ST1001-3', 'TC0536', 'TPC AI(5)', 'TC0160', 'AXF3', 5),
    '2|AI0886': tcs('steam seal valve output (made inside TCS)', 'TC0791', 'GXF11', 4),
    '1|AI0420': tcs('target MW setpoint (made inside TCS)', 'TC0160', 'AXF3', 1),
    '1|AI0421': tcs('load up rate (made inside TCS)', 'TC0160', 'AXF3', 2),
    '2|AI0534': tcs('turbine speed (made inside TCS)', 'TC0160', 'AXF3', 6)
  };
  /* 3.2.3-beta.121: the DCS Ethernet after the I/O card (user 2026-11-12 "asan mga ethernet dyan, bakit kulang"), as read by the
     control network study (ARIN flnet.json, no IP): K1AU3-E2-0-109 FCS signal schematic CD01 ~ CD05, K1AU3-E2-0-106 sh2 cable
     list, IPU-III manual 1.2 + 2 (CMCU-01). IOL = station|node -> [node MCU cable, m, I/O LAN switch, ports, switch -> controller
     cable, m, controller cabinet]; FLH = station -> [controller FL-NET cables, m, cabinet, FL-NET switches, switch cabinet]. */
  const IOL = {"101|0":["SFTP A1-MON0 / B1-MON0",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 1, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|1":["SFTP A2-MON1 / B2-MON1",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 2, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|2":["SFTP A3-MON2 / B3-MON2",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 3, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|3":["SFTP A4-MON3 / B4-MON3",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 4, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|4":["SFTP A5-MON4 / B5-MON4",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 5, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|5":["SFTP A6-MON5 / B6-MON5",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 6, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"101|6":["SFTP A7-MON6 / B7-MON6",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 7, controller port 16","A16-101AM0 / B16-101BM0",1.5,"FCS1011 CABINET"],"102|0":["SFTP A1-MON0 / B1-MON0",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 1, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|1":["SFTP A2-MON1 / B2-MON1",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 2, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|2":["SFTP A3-MON2 / B3-MON2",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 3, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|3":["SFTP A4-MON3 / B4-MON3",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 4, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|4":["SFTP A5-MON4 / B5-MON4",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 5, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|5":["SFTP A6-MON5 / B6-MON5",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 6, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|6":["SFTP A7-MON6 / B7-MON6",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 7, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"102|7":["SFTP A8-MON7 / B8-MON7",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 8, controller port 16","A16-102AM0 / B16-102BM0",1.5,"FCS1021 CABINET"],"103|0":["SFTP A1-MON0 / B1-MON0",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 1, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|1":["SFTP A2-MON1 / B2-MON1",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 2, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|2":["SFTP A3-MON2 / B3-MON2",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 3, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|3":["SFTP A4-MON3 / B4-MON3",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 4, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|4":["SFTP A5-MON4 / B5-MON4",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 5, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|5":["SFTP A6-MON5 / B6-MON5",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 6, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|6":["SFTP A7-MON6 / B7-MON6",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 7, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"103|7":["SFTP A8-MON7 / B8-MON7",5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 8, controller port 16","A16-103AM0 / B16-103BM0",1.5,"FCS1031 CABINET"],"104|0":["SFTP A1-MON0 / B1-MON0",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 1, controller port 16","A16-104AM0 / B16-104BM0",1.5,"FCS1041 CABINET"],"104|1":["SFTP A2-MON1 / B2-MON1",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 2, controller port 16","A16-104AM0 / B16-104BM0",1.5,"FCS1041 CABINET"],"104|2":["SFTP A3-MON2 / B3-MON2",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 3, controller port 16","A16-104AM0 / B16-104BM0",1.5,"FCS1041 CABINET"],"104|3":["SFTP A4-MON3 / B4-MON3",3,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 4, controller port 16","A16-104AM0 / B16-104BM0",1.5,"FCS1041 CABINET"],"104|4":["SFTP A5-MON4 / B5-MON4",30,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 5, controller port 16","A16-104AM0 / B16-104BM0",1.5,"FCS1041 CABINET"],"105|0":["SFTP A1-MON0 / B1-MON0",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 1, controller port 16","A16-105AM0 / B16-105BM0",1.5,"FCS1051 CABINET"],"105|1":["SFTP A2-MON1 / B2-MON1",1.5,"I/O LAN switches MBA0-A / MBA0-B (16-port)","node port 2, controller port 16","A16-105AM0 / B16-105BM0",1.5,"FCS1051 CABINET"]};
  const FLH = {"101":["2A02/2B02 (A ctrl) / 2A03/2B03 (B ctrl)",5,"FCS1011 CABINET","FL-NET switches hub-2A / hub-2B","FCS1013 CABINET"],"102":["2A04/2B04 (A ctrl) / 2A05/2B05 (B ctrl)",3,"FCS1021 CABINET","FL-NET switches hub-2A / hub-2B","FCS1013 CABINET"],"103":["2A06/2B06 (A ctrl) / 2A07/2B07 (B ctrl)",7,"FCS1031 CABINET","FL-NET switches hub-2A / hub-2B","FCS1013 CABINET"],"104":["2A08/2B08 (A ctrl) / 2A09/2B09 (B ctrl)",10,"FCS1041 CABINET","FL-NET switches hub-2A / hub-2B","FCS1013 CABINET"],"105":["3A02/3B02 (A ctrl) / 3A03/3B03 (B ctrl)",1.5,"FCS1051 CABINET","FL-NET switches hub-3A / hub-3B","FCS1051 CABINET"]};
  const netHops = r => {
    const st = '10' + r.s,
      I = IOL[st + '|' + r.node],
      F = FLH[st];
    if (!I || !F) return null;
    const E = 'Ethernet',
      hub1 = st === '105' ? '1A15-H-3A15 / 1B15-H-3B15, 40 m' : '1A16-H-2A16 / 1B16-H-2B16, 50 m';
    return [
      ['I/O card, node ' + r.node + ' slot ' + r.slot, r.ch + ' · terminal board ' + (r.brd || '') + ' · ' + r.fcs + ' cabinet', '', '', 'inside the node: base unit bus (no cable)'],
      ['Node ' + r.node + ' MCU A / B', 'CMCU-01, RJ-45 · ' + r.fcs + ' cabinet', '', '', E + ' I/O LAN (two-way), cable ' + I[0] + ', ' + I[1] + ' m'],
      [I[2], I[3] + ' · ' + I[6], '', '', E + ' I/O LAN (two-way), cable ' + I[4] + ', ' + I[5] + ' m'],
      ['Controller FCS' + st + '-A / B', stnOf(r) + ' · ' + F[2] + ' · FL-NET A + B ports', '', '', E + ' FL-NET A + B (two-way), cables ' + F[0] + ', ' + F[1] + ' m'],
      ['FL-NET switches ' + F[3].replace('FL-NET switches ', ''), 'MOXA EDS-316 · ' + F[4], '', '', E + ' FL-NET A + B (two-way), cables ' + hub1],
      ['FL-NET switches hub-1A / hub-1B', 'MOXA EDS-316 in the COS1 / COS2 desks, control room', '', '', E + ' FL-NET A + B (two-way), cables 1A5 / 1B5 (COS1), 1A6 / 1B6 (COS2), 1A7 / 1B7 (COS3), 1A8 / 1B8 (COS4), 1A10 / 1B10 (COS5), 1.5 ~ 20 m'],
      ['Operator stations COS1 ~ COS5', 'control room. Also on hub-1A / 1B: CDS-A (1A3 / 1B3), CDS-B (1A4 / 1B4), OPC server (1A9 / 1B9)', '', '', '']
    ];
  };
  const NETSRC = 'K1AU3-E2-0-109 FCS signal schematic CD01 ~ CD05, K1AU3-E2-0-106 sh2 cable list, IPU-III manual 1.2 + 2 (CMCU-01), as read by the control network study';
  /* the generator MW to the DCS (direct cables GCP -> DCS), the watt-hour / var-hour pulses and the ready-to-synchronize contacts */
  const MWH = () =>
    cp(CTH.slice(0, -1)).concat([CTH[CTH.length - 1].slice(0, 4).concat([CTVTL, '', '11,22,33,44'])], [
      ['GCP MW transducer', 'W T/D U03GA101 (WTT2-92A-33, sheet GA129, out A / B) or multi meter P40GA101 (out 16 / 17). CT into 1S / 1L / 3S / 3L' + VTNOTE, 'A', 'B', MA, '', '1S,1L,3S,3L,P1,P2,P3'],
      ['GCP terminal block X12', '10 / 11 = power(3), 13 / 14 = power(4)', '', '', MA]
    ]);
  const MWR = G + ' sh52-53, GA190. The drawing labels the two DCS MW outputs power(3) and power(4); it does not say which one is DCS MW (C) or MW (D)';
  const PM = (out, t1, t2, w, x1, x2, what) => ['GCP', cp(CTH).concat([['GCP digital multi meter', 'P40GA101 (SQLC-110L). CT into 12 / 3 / 14, commons 13 / 4 / 15 (CT runs in series after the transducers, sheets GA128 ~ GA130)' + VTNOTE + '. Out ' + out, t1, t2, 'pulse, wires ' + w], ['GCP terminal block X12', 'to DCS (sheet GA188)', x1, x2, what]]), G + ' sh53 GA130 + sh71 GA188'];
  const RS = (k, what, x1, x2) => ['GCP', [['GCP relay ' + k + ' (GA113)', what + ' ready to synchronizing, contact 11-7', '11', '7', 'contact (on / off)'], ['GCP terminal block X10', 'to DCS (sheet GA190)', x1, x2, 'contact (on / off), 2 wires']], G + ' sh73 GA190'];
  ORIG['1|AI0774'] = ['GCP', MWH(), MWR];
  ORIG['1|AI0419'] = ['GCP', MWH(), MWR];
  ORIG['1|AI0694'] = PM('24 / 25', '24', '25', 'GA13004 / 05', '19', '20', 'pulse 1000 kWh, 2 wires');
  ORIG['1|AI0696'] = PM('26 / 27', '26', '27', 'GA13007 / 08', '22', '23', 'pulse 1000 kvarh, 2 wires');
  ORIG['2|I.041B'] = RS('K33', '52G', '23', '24');
  ORIG['2|I.041C'] = RS('K34', '52L', '25', '26');
  ['2|I.041B', '2|I.041C'].forEach(k => (ORIG[k][2] += '. WIRING.xls names the cable side of these two inputs TCS-DI2; the GCP drawing GA190 sends them from X10 to the DCS'));
  /* 3.2.3-beta.115 (user: "Scada agad? Gcp pero walang GCP?", "Buo dapat ang chain at ang address na mga associated nito"): the
     DCS analog outputs to the SCADA repeat a generator value that the DCS reads on an AI. Pair = the same signal in the I/O list
     (dcs-io-list.xls, e.g. AO0406 TCS-AO1007 #1 Generator current (B) <- AI0855 TCS-AI1007 #1 GEN. current (B)), as in the control
     network study. The block that copies the AI to the AO is not in the ABC / DITL drawings of the app (searched: no sheet
     uses these AO addresses), so the hop inside the DCS is shown without a sheet. */
  const AOP = {
    '2|AO0470': '2|AI0775',
    '2|AO0486': '2|AI0807',
    '2|AO0487': '1|AI0774',
    '3|AO0582': '2|AI0871',
    '3|AO0583': '2|AI0903',
    '3|AO0886': '2|AI0823',
    '3|AO0887': '2|AI0839',
    '2|AO0405': '2|AI0791',
    '2|AO0406': '2|AI0855',
    '2|AO0407': '2|AI0887'
  };
  /* AI-Wet / AI-Dry of the I/O list (K1AU3-E2-0-118 sheet "DCS Numbering" rows 13-14; WIRING.xls sheet AIO 2W / 4W) */
  const WIRE = t => (/Wet/i.test(t) ? '2-wire' : /Dry/i.test(t) ? '4-wire' : '');
  const WIREL = t => (/Wet/i.test(t) ? '2-wire (AI-Wet: the DCS card powers the loop)' : /Dry/i.test(t) ? '4-wire (AI-Dry: the transmitter has its own power)' : '');
  /* what travels on the line from one hop to the next (label of the arrow) */
  const LINK = (h, nx, i, og) => {
    const t = h[4] || '',
      kind = /inside/.test(t) ? 'in' : 'fc';
    /* both wires get an arrow (loop current out on +, back on −) when a sender drives a 4-20 mA loop: GCP transducer, TCS
       output, DCS AO card, and the GCP terminal block that passes that loop on; not for a field sensor (who powers it is not
       in the documents), an AC CT / VT circuit, a pulse or a contact (one arrow = direction of the signal) */
    const loop = /^4-20 mA/.test(t) && !(og === 'Field' && i === 0);
    if (kind === 'in' && /^DCS .*AI/.test(h[0])) return { t: 'inside the DCS (copy block not drawn)', in: 1, k: 'in' };
    return { t, in: kind === 'in' ? 1 : 0, loop, k: KIND(t) };
  };
  /* Modbus over Ethernet (two-way link) with the package PLC: LMYP-1 #1-Communication list between DCS and package.xls (sheets
     #1 GCS10F and Common GCS10E: PLC-A / PLC-B, Modbus connection, "RJ-45 Only") and Memory for Sub_System PLC MODBUS.xls
     (SI Address: turbine area SI1000 ~ / SI1300 ~ of STN102, SCADA SI8600 ~ / SI8800 ~ of STN105; BC send / receive of the
     GCS to the station). Points: the Modbus communication lists (src/ui/plant/dcslists.js). */
  const MBS = {
    tcs: { sys: 'TCS', pkg: 'Turbine PLC', pan: 'TCS panel', gcs: 'GCS10F', con: 'Modbus connection 1 (PLC-A) / 2 (PLC-B)', stn: 'STN102', ctl: 'FCS102', sftp: ['1H09', '2H09'], hub: 'SCADA LAN hub-1H port 9 / hub-2H port 9', hubup: '1H02 / 2H02', fl: '2A10 / 2B10 / 2A11 / 2B11', fllen: '20 m', fhubs: 'hub-2A / hub-2B', fhub: 'FCS1013', fcs: '2A04 / 2B04 (A ctrl), 2A05 / 2B05 (B ctrl)', fcslen: '3 m UTP', dwg: 'K1AU3-E2-0-115 sh5 (GCS10F), K1AU3-E2-0-106 sh2 + cable list (FL-NET)' },
    sca: { sys: 'SCADA', pkg: 'SCADA PLC', pan: 'SCADA panel', gcs: 'GCS10E', con: 'Modbus connection 7 (PLC-A) / 8 (PLC-B)', stn: 'STN105', ctl: 'FCS105', sftp: ['3H11', '4H11'], hub: 'SCADA LAN hub-3H port 11 / hub-4H port 11', hubup: '3H02 / 4H02', fl: '3A04 / 3B04 / 3A05 / 3B05', fllen: '10 m', fhubs: 'hub-3A / hub-3B', fhub: 'FCS1051', fcs: '3A02 / 3B02 (A ctrl), 3A03 / 3B03 (B ctrl)', fcslen: '1.5 m UTP', dwg: 'K1AU3-E2-0-115 sh12 (GCS10E), K1AU3-E2-0-106 sh2 + cable list (FL-NET)' }
  };
  window.LS_ORIG = ORIG;
  const SY = [
    ['All', 'All'],
    ['Field', 'Field'],
    ['TCS', 'Turbine control (TCS)'],
    ['GCP', 'Generator control (GCP)'],
    ['GPP', 'Generator protection (GPP)'],
    ['SCADA', 'Switchgear supervisory (SCADA)'],
    ['Breakers', 'Breakers'],
    ['MCC', 'Motor control centers (MCC)'],
    ['HVP', 'High-voltage panels (HVP)'],
    ['Local panels', 'Local panels']
  ];
  const TY = { AI: 'AI (4-20 mA in)', AO: 'AO (4-20 mA out)', DI: 'DI (contact in)', DO: 'DO (contact out)', MB: 'Modbus (Ethernet, two-way)' };
  const MAX = 400;
  const sysOf = r => {
    const j = r.jb || '';
    if (/^JB|direct to field|^direct to/i.test(j)) return 'Field';
    if (/TCS/.test(j)) return 'TCS';
    if (/GCP/.test(j)) return 'GCP';
    if (/GPP/.test(j)) return 'GPP';
    if (/SCADA/.test(j)) return 'SCADA';
    if (/^EE/.test(j)) return 'Breakers';
    if (/MCC/.test(j)) return 'MCC';
    if (/HVP/.test(j)) return 'HVP';
    return 'Local panels';
  };
  const srcOf = r => {
    const j = r.jb || '';
    if (/^JB/.test(j)) return { k: 'jb', n: j.replace(/-(AIO2?|AIO|DI\d?|DO\d?|AI\d?)$/, ''), s: 'junction box' };
    if (/^direct/i.test(j)) return { k: 'dir', n: 'Direct', s: 'field cable' };
    const m = j.replace(/-->|->/g, '→').replace(/-(AIO|DI|DO)$/, '');
    return { k: 'pan', n: m || '(not in list)', s: 'other panel' };
  };
  const sp = (x, i) => String(x || '').split(',')[i] || '';
  let R = null,
    PAN = [],
    st = { p: 'All', s: 'All', t: { AI: 1, AO: 1, DI: 1, DO: 1, MB: 1 }, q: '', sel: null };
  try {
    const s = JSON.parse(localStorage.getItem('ls-trace') || 'null');
    if (s) Object.assign(st, { p: s.p || 'All', s: s.s || 'All', t: Object.assign(st.t, s.t || {}) });
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem('ls-trace', JSON.stringify({ p: st.p, s: st.s, t: st.t }));
    } catch (e) {}
  };
  function data(A) {
    if (R) return R;
    const F = window.WIRING_F || [],
      W = window.WIRING || [],
      fi = {};
    F.forEach((k, i) => (fi[k] = i));
    R = [];
    for (const w of W) {
      const g = k => (w[fi[k]] == null ? '' : String(w[fi[k]]));
      const a = g('a'),
        s = g('s'),
        rec = A && A[s] && A[s][a];
      const tag = g('tag') || (rec && rec.tag) || '',
        desc = g('d') || (rec && rec.d) || '';
      if (!tag && !desc) continue;
      const t = /^AO/.test(a) ? 'AO' : /^AI/.test(a) ? 'AI' : g('k') === 'DO' ? 'DO' : 'DI';
      const o = {
        t, s, a, tag, desc,
        sig: (rec && rec.t) || g('sig'),
        lo: rec && rec.lo != null ? +rec.lo : null,
        hi: rec && rec.hi != null ? +rec.hi : null,
        u: (rec && rec.u) || '',
        mpl: g('mpl2') || g('mpl'),
        jb: g('jb'),
        jt1: sp(g('tb'), 0),
        jt2: sp(g('tb'), 1),
        ms: g('tbs'),
        mt1: sp(g('tbn'), 0),
        mt2: sp(g('tbn'), 1),
        cab: g('cab'),
        spec: g('spec'),
        c1: sp(g('core'), 0),
        c2: sp(g('core'), 1),
        fcs: g('ext'),
        eb: g('exttb'),
        e1: sp(g('fcstb'), 0),
        e2: sp(g('fcstb'), 1),
        brd: g('board'),
        ic: g('fcab'),
        mba: g('stn'),
        node: g('node'),
        slot: g('slot'),
        ch: g('ch')
      };
      const O = ORIG[s + '|' + a];
      o.og = O ? O[0] : /^GCP-/.test(tag) ? 'GCP' : '';
      o.up = O ? O[1] : [];
      o.ref = O ? O[2] : o.og ? 'tag GCP- (I/O list)' : '';
      o.wire = WIRE(o.sig);
      o.sys = sysOf(o);
      o.h = (tag + ' ' + desc + ' ' + a + ' ' + o.jb + ' ' + o.mpl + ' ' + o.cab).toLowerCase();
      R.push(o);
    }
    /* the AO to SCADA: the whole chain of its AI, then the AI and the AO inside the DCS */
    const by = {};
    for (const r of R) by[r.s + '|' + r.a] = r;
    for (const k in AOP) {
      const a = by[k],
        b = by[AOP[k]];
      if (!a || !b) continue;
      const sb = 'STN10' + AOP[k].split('|')[0],
        sa = 'STN10' + k.split('|')[0];
      a.og = b.og || 'GCP';
      a.up = b.up.concat([
        ['DCS ' + sb + ' ' + b.a, b.tag + ' ' + (b.wire ? b.wire + ' ' : '') + 'input (value inside the DCS)', b.e1 || '–', b.e2 || '–', 'inside the DCS (copy block not drawn)'],
        ['DCS ' + sa + ' ' + a.a, 'sent out to ' + a.sys + ' on this AO', a.e1 || '–', a.e2 || '–', MA]
      ]);
      a.pair = b;
      a.ref = (b.ref ? b.ref + '. ' : '') + 'AO paired with ' + sb + ' ' + b.a + ' (' + b.tag + ') by the same signal in the I/O list; the DCS block that copies the AI to this AO is not in the ABC / DITL drawings';
    }
    /* Modbus points: the DCS memory word of each point. AI = one SI word per point; DI = 16 points per SI word (bit 0 = the row
       that names the word, then bits 1 ~ 15 in the order of the list); DO = DCS to PLC, word of the first row. */
    const M = window.DCS_MODBUS || [];
    let w = null,
      nm = null;
    for (const m of M) {
      const [sk, maddr, tag, d, ty, si, from, to] = m,
        S = MBS[sk];
      if (!S) continue;
      if (si) {
        w = si.split(' ');
        nm = maddr;
      }
      let word = w ? w[0] : '',
        bit = sk === 'tcs' ? +maddr - +nm : Math.round((+maddr % 1) * 100);
      if (ty === 'DI' && (sk === 'tcs' ? bit < 0 || bit > 15 : Math.floor(+maddr) !== Math.floor(+nm))) word = '';
      const addr = ty === 'AI' ? word : ty === 'DI' ? (word ? word + ' bit ' + bit : 'word not in the list, bit ' + bit) : (w || []).join(' / ') + ' area, coil ' + maddr;
      const o = { t: 'MB', mt: ty, s: S.stn.slice(-1), a: addr, tag: tag || '', desc: d, sig: 'Modbus ' + ty, mb: S, maddr, word, word2: w && w[1] && /^SI/.test(w[1]) && ty !== 'DO' ? w[1] : '', from, to, ind: w && w[2] ? w[2] : '', up: [], og: S.sys, ref: '', mpl: '', jb: '' };
      o.sys = S.sys;
      o.h = (o.tag + ' ' + d + ' ' + addr + ' modbus ' + S.gcs + ' ' + maddr).toLowerCase();
      R.push(o);
    }
    PAN = [...new Set(R.map(r => r.mpl).filter(Boolean))].sort();
    return R;
  }
  const E = (t, a, kids) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (kids || []).forEach(x => x != null && e.append(typeof x === 'string' ? document.createTextNode(x) : x));
    return e;
  };
  const stnOf = r => 'STN' + String(r.mba).slice(0, 3);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a, p) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };
  const tx = (p, x, y, c, s, anc) => {
    const t = el('text', { x, y, class: c }, p);
    if (anc) t.setAttribute('text-anchor', anc);
    t.textContent = s;
    return t;
  };
  let host = null;
  function render(box, A) {
    data(A);
    host = box;
    box.innerHTML = '';
    const wrap = E('div', { cls: 'trc' });
    const chips = (lbl, items, cur, on, multi) =>
      E('div', { cls: 'trcg' }, [
        E('div', { cls: 'trcl', txt: lbl }),
        E(
          'div',
          { cls: 'trcc' },
          items.map(([k, t]) => {
            const b = E('button', { cls: 'trcb' + (multi ? ' t' : ''), txt: t, 'aria-pressed': String(multi ? !!cur[k] : cur === k), on: () => on(k) });
            return b;
          })
        )
      ]);
    wrap.append(
      chips('Connected to (where the signal comes from or goes to)', SY, st.s, k => ((st.s = k), (st.sel = null), save(), render(box, A))),
      chips('Marshalling panel in the rack room', [['All', 'All']].concat(PAN.map(p => [p, p])), st.p, k => ((st.p = k), (st.sel = null), save(), render(box, A))),
      E('div', { cls: 'trcbar' }, [
        chips('Signal type', Object.entries(TY), st.t, k => ((st.t[k] = st.t[k] ? 0 : 1), save(), render(box, A)), true),
        E('div', { cls: 'trcg trcq' }, [E('div', { cls: 'trcl', txt: 'Search tag, description or address' }), (() => {
          const i = E('input', { type: 'search', cls: 'trci', placeholder: 'e.g. PT-BR1001, TCS, drum' });
          i.value = st.q;
          let tm = null;
          i.oninput = () => {
            clearTimeout(tm);
            tm = setTimeout(() => {
              st.q = i.value.trim().toLowerCase();
              list();
            }, 150);
          };
          return i;
        })()])
      ]),
      E('div', { cls: 'trcs' }, [E('div', { cls: 'trcl trccap', id: 'trccap', txt: 'Path of the selected signal' }), E('div', { cls: 'trcdg', id: 'trcpath' })]),
      E('div', { cls: 'trcs' }, [
        E('div', { cls: 'trcl', id: 'trcn' }),
        E('div', { cls: 'trctw' }, [
          E('table', { cls: 'trct' }, [E('thead', {}, [E('tr', {}, ['Type', 'Tag', 'Description', 'From / to', 'Panel and terminal', 'Cable', 'FCS board', 'DCS address'].map(h => E('th', { txt: h })))]), E('tbody', { id: 'trctb' })])
        ])
      ]),
      E('p', { cls: 'trcsrc', txt: 'Source: LMYP-1(#1) WIRING.xls (sheets AIO / DI / DO, 2023-10-03): marshalling panel field strip and terminals, cross wiring, system strip, prefab cable and cores, FCS terminal board, I/O module, node / slot / channel, address, tag. Descriptions missing in the wiring list come from the I/O list. Before the rack room (GCP or field into the turbine control system, then to the DCS): TCS Elementary Diagram 331DM07733 and the From / To remark of the I/O list. Not in the documents: the field cable number from the junction box to the marshalling panel, the GCP-side terminal numbers.' })
    );
    box.append(wrap);
    list();
  }
  function list() {
    if (!host) return;
    const rows = R.filter(r => (st.p === 'All' || r.mpl === st.p) && (st.s === 'All' || r.sys === st.s || r.og === st.s) && st.t[r.t] && (!st.q || r.h.includes(st.q)));
    const lab = (SY.find(x => x[0] === st.s) || ['', st.s])[1];
    host.querySelector('#trcn').textContent = (st.s === 'All' ? 'All systems' : lab) + ' · ' + (st.p === 'All' ? 'all panels' : st.p) + ': ' + rows.length.toLocaleString('en-US') + ' signals' + (rows.length > MAX ? ' (first ' + MAX + ' shown, search to narrow)' : '') + ' · click a row to see its path';
    const tb = host.querySelector('#trctb');
    tb.innerHTML = '';
    if (!st.sel || !rows.includes(st.sel)) st.sel = rows[0] || null;
    const frag = document.createDocumentFragment();
    rows.slice(0, MAX).forEach(r => {
      const S = srcOf(r);
      const out = r.t === 'AO' || r.t === 'DO',
        ft = r.up && r.up.length ? r.up.map(h => h[0].split(' ')[0]).concat(out ? ['DCS'] : []).filter((w, i, A) => w !== A[i - 1]).join(' → ') + (out ? ' → ' + r.sys : r.up.some(h => /^DCS/.test(h[0])) ? '' : ' → DCS') : r.og === 'GCP' && S.n.indexOf('GCP') < 0 ? 'GCP value · ' + S.n : S.n;
      const tr = r.t === 'MB' ? E('tr', { cls: r === st.sel ? 'on' : '' }, [
        E('td', {}, [E('span', { cls: 'trcty MB', txt: 'MB ' + r.mt })]),
        E('td', { cls: 'm', txt: r.tag }),
        E('td', { txt: r.desc }),
        E('td', { txt: r.mb.pkg + (r.to === 'DCS' ? ' → DCS' : ' ← DCS') + ' (Modbus)' }),
        E('td', { cls: 'm', txt: r.mb.gcs + ' · Modbus ' + r.maddr }),
        E('td', { cls: 'm', txt: 'Ethernet RJ-45' }),
        E('td', { cls: 'm', txt: '' }),
        E('td', { cls: 'm', txt: r.mb.stn + ' ' + r.a })
      ]) : E('tr', { cls: r === st.sel ? 'on' : '' }, [
        E('td', {}, [E('span', { cls: 'trcty ' + r.t, txt: r.t })]),
        E('td', { cls: 'm', txt: r.tag }),
        E('td', { txt: r.desc }),
        E('td', { txt: ft }),
        E('td', { cls: 'm', txt: r.mpl + ' ' + r.ms + ' ' + r.mt1 + '/' + r.mt2 }),
        E('td', { cls: 'm', txt: r.cab }),
        E('td', { cls: 'm', txt: r.fcs + ' ' + r.eb + ' ' + r.e1 + '/' + r.e2 + (r.wire ? ' · ' + r.wire : '') }),
        E('td', { cls: 'm', txt: stnOf(r) + ' ' + r.a })
      ]);
      tr.onclick = () => {
        st.sel = r;
        tb.querySelectorAll('tr.on').forEach(x => x.classList.remove('on'));
        tr.classList.add('on');
        draw(r);
      };
      frag.append(tr);
    });
    tb.append(frag);
    draw(st.sel);
  }
  /* colour = what travels on the line, one line per wire, the same colours as the control network study tracer (ARIN v6;
     user 2026-11-12 "magcolor coding ka ... kung ethernet, ethernet, kung fiber fiber"); the cable names are written on the lines */
  const CK = {
    ma: ['var(--trc-ma)', '4-20 mA DC (2 wires)'],
    pl: ['var(--trc-pl)', 'pulse (2 wires)'],
    ct: ['var(--trc-ct)', 'contact on / off (2 wires)'],
    cta: ['var(--trc-cta)', 'CT 5 A AC (4 wires)'],
    vt: ['var(--trc-vt)', 'VT 115 V AC (3 wires)'],
    rtd: ['var(--trc-rtd)', 'RTD (resistance)'],
    en: ['var(--trc-en)', 'Ethernet (one line per cable, two-way)'],
    fo: ['var(--trc-fo)', 'fiber optic (one line per cable, two-way)'],
    in: ['var(--trc-in)', 'inside a controller (no cable)']
  };
  const KIND = t => (/inside/i.test(t) ? 'in' : /fiber/i.test(t) ? 'fo' : /Ethernet/i.test(t) ? 'en' : /^CT/.test(t) ? 'cta' : /^VT/.test(t) ? 'vt' : /pulse/i.test(t) ? 'pl' : /contact/i.test(t) ? 'ct' : /RTD/.test(t) ? 'rtd' : 'ma');
  const LEG = ['ma', 'pl', 'ct', 'cta', 'vt', 'rtd', 'en', 'fo', 'in'];
  const NWIRE = { ma: 2, pl: 2, ct: 2, cta: 4, vt: 3, rtd: 3, en: 2, fo: 2, in: 1 };
  const legend = keys =>
    E(
      'div',
      { cls: 'trcleg' },
      keys.map(k => E('span', {}, [E('i', { cls: k === 'in' ? 'dash' : '', style: 'background:' + CK[k][0] }), CK[k][1]]))
    );
  const arrowHead = (p, x, y, d, c) =>
    el('path', { d: d > 0 ? 'M' + (x - 5) + ',' + (y - 5) + 'L' + (x + 5) + ',' + y + 'L' + (x - 5) + ',' + (y + 5) + 'z' : 'M' + (x + 5) + ',' + (y - 5) + 'L' + (x - 5) + ',' + y + 'L' + (x + 5) + ',' + (y + 5) + 'z', fill: c }, p);
  /* split a text into lines of at most n characters (at spaces) */
  const wrapT = (t, n) => {
    const L = [''];
    for (const w of String(t).split(' ')) (L[L.length - 1] + ' ' + w).trim().length > n && L[L.length - 1] ? L.push(w) : (L[L.length - 1] = (L[L.length - 1] + ' ' + w).trim());
    return L;
  };
  const srcLines = (p, y0, text) => {
    const words = text.split(' '),
      lines = [''];
    for (const w of words) (lines[lines.length - 1] + ' ' + w).length > 165 ? lines.push(w) : (lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim());
    lines.forEach((l, i) => tx(p, 16, y0 + i * 14, 'tl', l));
    return y0 + lines.length * 14;
  };
  /* the hops before the rack room (GCP / field -> TCS input -> TCS output) */
  function upstream(r, hops, hp, head, mb) {
    /* rows of up to 4 hops; a row that goes on draws its wires to the right edge and the next row starts from the left edge */
    const n = hops.length,
      PER = 4,
      rows = Math.ceil(n / PER),
      RH = 150,
      gap = 104,
      bw = 196,
      us = el('svg', { viewBox: '0 0 1240 ' + (40 + rows * RH), role: 'img', 'aria-label': 'Where ' + r.tag + ' starts' }, hp);
    tx(us, 16, 16, 'tl', head);
    hops.forEach((h, i) => {
      const row = Math.floor(i / PER),
        col = i % PER,
        y0 = 26 + row * RH,
        x = 40 + col * (bw + gap),
        YP = y0 + 44,
        YM = y0 + 74,
        fit = (t, px) => (t.length > Math.floor((bw - 16) / px) ? t.slice(0, Math.floor((bw - 16) / px) - 1) + '…' : t);
      el('rect', { class: 'box' + (/^Generator|^TE-|^PT-|^ZT-/.test(h[0]) ? ' dash' : ''), x, y: y0, width: bw, height: 82, rx: 6 }, us);
      /* name on up to 2 lines, note on the lines left (narrower where the terminals are) */
      const hasT = h[2] !== '' && h[2] != null,
        nm = wrapT(h[0], h[6] ? 20 : 24).slice(0, 2),
        tX = x + (h[6] ? 40 : 10),
        nl = wrapT(h[1], (hasT ? 22 : 30) - (h[6] ? 5 : 0));
      nm.forEach((t, k) => tx(us, tX, y0 + 18 + k * 14, 'bt2', k === 1 && wrapT(h[0], h[6] ? 20 : 24).length > 2 ? fit(t + '…', 7.4) : t));
      nl.slice(0, 5 - nm.length).forEach((t, k, A) => tx(us, tX, y0 + 18 + nm.length * 14 + 2 + k * 12, 'bs', k === A.length - 1 && nl.length > A.length ? t + ' …' : t));
      el('title', {}, el('rect', { x, y: y0, width: bw, height: 82, fill: 'transparent' }, us)).textContent = h[0] + ' · ' + h[1] + (h[2] ? ' · terminal ' + h[2] + ' / ' + h[3] : '');
      const L = LINK(h, hops[i + 1], i, r.og),
        x1 = x + bw,
        wrap = col === PER - 1 && i < n - 1,
        last = i === n - 1,
        edge = wrap || (last && col === PER - 1),
        x2 = edge ? 1236 : x1 + gap,
        c = CK[L.k][0],
        eth = L.k === 'en' || L.k === 'fo',
        none = last && !h[4];
      /* as many lines as the wires written on the drawing (CT 4, VT 4 then 3, CT + VT 7), else by kind */
      const nw = Math.min(7, Math.max(2, +((L.t.match(/(\d) wires/) || [])[1] || NWIRE[L.k] || 2))),
        WY = Array.from({ length: nw }, (_, k) => YP + ((YM - YP) * k) / (nw - 1));
      /* terminal points: one per wire (user 2026-11-12 "bkit 3 wire o 4 wire pero ang terminal point dalawa lang") */
      const termCol = (xc, list, side) => {
        const T = list,
          n = T.length,
          TY = Array.from({ length: n }, (_, k) => (n === 1 ? (YP + YM) / 2 : YP + ((YM - YP) * k) / (n - 1))),
          small = n > 2,
          ac = /AC/.test(L.t) || side > 0;
        el('rect', { class: 'strip', x: xc - 6, y: TY[0] - 7, width: 12, height: TY[n - 1] - TY[0] + 14, rx: 3 }, us);
        T.forEach((t, k) => {
          el('circle', { class: 'term', cx: xc, cy: TY[k], r: n > 4 ? 2.4 : small ? 3.3 : 5 }, us);
          if (n <= 4 || k % 1 === 0) tx(us, xc + side * 10, TY[k] + (n > 4 ? 2.5 : 3.5), n > 4 ? 'tnx' : small ? 'tns' : 'tn', String(t).replace(/[+-]$/, '') + (ac || small ? '' : k ? ' −' : ' +')).setAttribute('style', 'text-anchor:' + (side < 0 ? 'end' : 'start'));
        });
      };
      if (h[2] !== '' && h[2] != null) termCol(x1, String(h[2]).includes(',') ? String(h[2]).split(',') : [h[2], h[3]], -1);
      if (h[6]) termCol(x, String(h[6]).split(','), 1);
      const draw2 = (xa, xb, mid) => {
        if (L.in) {
          el('path', { class: 'w', d: 'M' + xa + ',' + (YP + YM) / 2 + ' H' + (xb - 2), stroke: c, 'stroke-dasharray': '5 4' }, us);
          arrowHead(us, xb - 6, (YP + YM) / 2, 1, c);
        } else if (eth) {
          /* Ethernet / fiber: one line per cable (A and B), the link talks both ways */
          [[YP, 'A'], [YM, 'B']].forEach(([y, ab]) => {
            el('path', { class: 'w', d: 'M' + (xa + 10) + ',' + y + ' H' + (xb - 8), stroke: c }, us);
            arrowHead(us, xa + 10, y, -1, c);
            if (xb < 1230) arrowHead(us, xb - 8, y, 1, c);
            tx(us, xa + 16, y - 4, 'tl', ab);
          });
        } else {
          WY.forEach(y => el('path', { class: 'w' + (nw > 2 ? ' thin' : ''), d: 'M' + (xa + 5) + ',' + y + ' H' + xb, stroke: c }, us));
          arrowHead(us, mid, YP, 1, c);
          if (L.loop) arrowHead(us, mid, YM, -1, c);
        }
      };
      if (!none) draw2(x1, x2, edge ? x1 + 50 : x1 + gap / 2);
      if (wrap) {
        /* the same wires come in from the left on the next row */
        const ny = 26 + (row + 1) * RH,
          nYP = ny + 44,
          nYM = ny + 74;
        if (L.in) el('path', { class: 'w', d: 'M4,' + (nYP + nYM) / 2 + ' H38', stroke: c, 'stroke-dasharray': '5 4' }, us);
        else if (eth)
          [nYP, nYM].forEach(y => {
            el('path', { class: 'w', d: 'M4,' + y + ' H30', stroke: c }, us);
            arrowHead(us, 32, y, 1, c);
          });
        else WY.forEach(y => el('path', { class: 'w' + (nw > 2 ? ' thin' : ''), d: 'M4,' + (y - YP + nYP) + ' H38', stroke: c }, us));
        tx(us, 1232, YP - 12, 'tl', 'next row ↓', 'end');
      }
      const lx = edge ? x1 + 52 : x1 + gap / 2,
        lab = L.in || mb ? [L.t] : [L.t, last ? 'cable to the rack room:' : '', last ? 'no. not in the documents' : ''];
      (none ? '' : L.t)
        .replace(/,? (?=wires G|GA\d|SFTP|cables? )/, '\n')
        .split('\n')
        .reduce((A, t, k) => A.concat(wrapT(t, k ? 26 : 32)), [])
        .concat(lab.slice(1))
        .filter(Boolean)
        .forEach((t, k) => tx(us, edge ? 1232 : lx, YM + 22 + k * 12, k ? 'tl' : 'll', t, edge ? 'end' : 'middle').setAttribute('fill', k && /cable|no\./.test(t) ? 'var(--c-dim)' : c));
      if (last && !mb) {
        if (edge) tx(us, 1232, YP - 12, 'tl', 'to the rack room ↓', 'end');
        else {
          tx(us, x1 + gap + 4, YP + 2, 'bt2', 'rack room ↓');
          tx(us, x1 + gap + 4, YP + 18, 'bs', 'wiring below');
        }
      }
    });
    const yEnd = srcLines(us, 58 + rows * RH, 'Source: ' + r.ref + '. – = not in the documents.');
    us.setAttribute('viewBox', '0 0 1240 ' + (yEnd + 2));
  }
  /* the wiring in the rack room: other panel / field -> (junction box) -> marshalling panel -> FCS -> address */
  function wiring(r, hp, head) {
    const out = r.t === 'AO' || r.t === 'DO',
      sys = r.sys,
      upL = r.up && r.up.length && !out ? r.up[r.up.length - 1][0] : '',
      who = /^(TCS|GCP)/.test(upL) ? upL.slice(0, 3) : sys === 'Field' ? 'field' : sys,
      S = srcOf(r),
      MK = r.t === 'DI' || r.t === 'DO' ? 'ct' : /PI/.test(r.sig || '') ? 'pl' : 'ma',
      svg = el('svg', { viewBox: '0 0 1240 300', role: 'img', 'aria-label': 'Wiring path of ' + r.tag }, hp),
      Y1 = 168,
      Y2 = 200,
      T = 58;
    if (head) tx(svg, 16, 16, 'tl', head);
    const B = [
      { x: 16, w: 150, t: upL ? who : S.k === 'pan' ? (sys === 'Local panels' ? S.n.split('→')[0] : sys) : r.tag, s: S.k === 'pan' ? 'other panel' : 'field device', d: S.k !== 'pan' },
      { x: 210, w: 140, t: S.k === 'jb' ? S.n : S.k === 'pan' ? 'Cable from ' + S.n.split('→')[0] : 'Direct', s: S.k === 'jb' ? 'junction box (field)' : S.k === 'pan' ? 'cable no. not in the list' : 'field cable', d: true },
      { x: 390, w: 330, t: r.mpl, s: 'marshalling panel, rack room' },
      { x: 770, w: 290, t: r.fcs, s: 'FCS cabinet, rack room' },
      { x: 1095, w: 130, t: stnOf(r), s: 'DCS address' }
    ];
    B.forEach(b => {
      el('rect', { class: 'box' + (b.d ? ' dash' : ''), x: b.x, y: T, width: b.w, height: 206, rx: 6 }, svg);
      tx(svg, b.x + 10, T + 22, 'bt', b.t);
      tx(svg, b.x + 10, T + 39, 'bs', b.s);
    });
    tx(svg, 1105, T + 80, 'addr', r.a);
    tx(svg, 1105, T + 100, 'bs', r.ch + ' · node ' + r.node + ' slot ' + r.slot);
    if (S.k === 'pan') tx(svg, 26, T + 80, 'tl', 'signal: ' + r.tag);
    /* [from x, to x, kind, label, second line] */
    const segs = S.k === 'jb'
      ? [[166, 210, 'fc', '', ''], [350, 420, 'fc', 'cable from the JB', 'no. not in the documents']]
      : [[166, 420, 'fc', S.k === 'pan' ? 'panel cable' : 'field cable', 'no. not in the documents']];
    segs.push([460, 580, 'xw', r.xcab || 'cross wiring', (r.xspec ? 'type ' + r.xspec : '') + (r.xcore ? (r.xspec ? ', ' : '') + 'cores ' + r.xcore.replace(',', ' / ') : '')]);
    segs.push([620, 810, 'pf', r.cab, 'type ' + r.spec + ', cores ' + r.c1 + ' / ' + r.c2]);
    segs.push([850, 960, 'ic', r.ic, 'internal cable']);
    segs.push([984, 1095, 'ic', '', '']);
    if (S.k === 'jb') {
      segs[0][3] = 'field cable';
      segs.splice(1, 0, [210, 350, 'fc', '', '']);
    }
    segs.forEach(sg => {
      const c = CK[MK][0];
      [Y1, Y2].forEach(y => el('path', { class: 'w', d: 'M' + sg[0] + ',' + y + ' H' + sg[1], stroke: c }, svg));
      const cx = (sg[0] + sg[1]) / 2;
      if (sg[3]) tx(svg, cx, Y2 + 30, 'cl', sg[3]).setAttribute('fill', c);
      if (sg[4]) tx(svg, cx, Y2 + 45, 'tl', sg[4], 'middle');
    });
    /* arrows on the wires (IPU-III manual p.49 ~ 55 CAII-01 / DN-AII-04 wiring, as in the AI wet / dry study):
       2-wire AI: the DCS card gives 24 V on PWR (+), the current goes out on + and comes back on − (CH+);
       4-wire AI and AI from another panel (TCS, MCC): the sender drives the current in on + (CH+), back on − (CH−);
       AO: the DCS AO card drives the current out on +, back on −; DI / DO / pulse: one arrow = direction of the signal. */
    let d1 = 0,
      d2 = 0,
      leg = '';
    if (r.t === 'AI' && r.wire === '2-wire') {
      d1 = -1;
      d2 = 1;
      leg = 'Signal: 4-20 mA DC, 2-wire, ' + who + ' → DCS. The DCS card gives 24 V on PWR (+): the loop current goes out on + to the transmitter and comes back on − (CH+).';
    } else if (r.t === 'AI' && r.wire === '4-wire') {
      d1 = 1;
      d2 = -1;
      leg = 'Signal: 4-20 mA DC, 4-wire, ' + who + ' → DCS. The sender has its own power: the loop current comes in on + (CH+) and goes back on − (CH−).';
    } else if (r.t === 'AI') {
      d1 = 1;
      leg = 'Signal: ' + (/PI/.test(r.sig || '') ? 'pulse' : '4-20 mA DC') + ', ' + who + ' → DCS (one arrow = direction of the signal).';
    } else if (r.t === 'AO') {
      d1 = -1;
      d2 = 1;
      leg = 'Signal: 4-20 mA DC out, DCS → ' + who + '. The DCS AO card drives the loop current out on + and it comes back on −.';
    } else {
      d1 = r.t === 'DO' ? -1 : 1;
      leg = 'Signal: contact (on / off), ' + (r.t === 'DO' ? 'DCS → ' + who + ': the DCS output closes or opens the circuit' : who + ' → DCS: a contact closes or opens the circuit to the DCS input') + '. One arrow = direction of the signal; the voltage of the contact circuit is not in the documents in the app.';
    }
    tx(svg, 16, 36, 'll', leg).setAttribute('fill', 'var(--c-tx)');
    [[188, 'fc'], [385, 'fc'], [520, 'xw'], [715, 'pf'], [905, 'ic'], [1040, 'ic']].forEach(([x, k]) => {
      if (S.k !== 'jb' && x === 188) return;
      if (d1) arrowHead(svg, x, Y1, d1, CK[MK][0]);
      if (d2) arrowHead(svg, x, Y2, d2, CK[MK][0]);
    });
    const strip = (x, label, t1, t2) => {
      el('rect', { class: 'strip', x: x - 20, y: Y1 - 26, width: 40, height: Y2 - Y1 + 44, rx: 3 }, svg);
      tx(svg, x, Y1 - 34, 'tl', label, 'middle');
      [
        [Y1, t1],
        [Y2, t2]
      ].forEach(p => {
        el('circle', { class: 'term', cx: x, cy: p[0], r: 6 }, svg);
        tx(svg, x, p[0] - 10, 'tn', p[1] || '–');
      });
    };
    if (S.k === 'jb') strip(280, 'JB terminals', '', '');
    strip(440, (r.jb || '').replace(/^(.{16}).+/, '$1…'), r.jt1, r.jt2);
    strip(600, r.ms, r.mt1, r.mt2);
    strip(830, r.eb + ' ' + (r.brd || '') + (r.wire ? ' · ' + r.wire : ''), r.e1, r.e2);
    el('rect', { class: 'strip', x: 960, y: Y1 - 26, width: 24, height: Y2 - Y1 + 44, rx: 3 }, svg);
    tx(svg, 972, Y1 - 34, 'tl', 'I/O card', 'middle');
    tx(svg, 30, Y1 + 5, 'tn', '+', 'start');
    tx(svg, 30, Y2 + 5, 'tn', '−', 'start');
    if (r.sig) tx(svg, 1105, T + 125, 'bs', r.sig);
    if (r.wire) {
      tx(svg, 1105, T + 142, 'bs', r.wire);
      tx(svg, 780, T + 222, 'tl', WIREL(r.sig));
    }
  }
  /* the DCS Ethernet of an address: I/O card -> node MCU -> I/O LAN -> controller -> FL-NET -> control room operator stations */
  function netSec(r, k) {
    const H = netHops(r);
    if (!H) return;
    const hp = host.querySelector('#trcpath');
    upstream(Object.assign({}, r, { og: 'NET', ref: NETSRC }), H, hp, (k ? k + ' · ' : '') + 'DCS NETWORK OF ' + stnOf(r) + ' ' + r.a + ': I/O card → controller → operator stations (Ethernet, two-way)', 1);
  }
  function draw(r) {
    draw0(r);
    try {
      if (r) rangeSec(r);
    } catch (e) {}
  }
  function draw0(r) {
    const hp = host.querySelector('#trcpath'),
      cap = host.querySelector('#trccap');
    hp.innerHTML = '';
    if (!r) {
      cap.textContent = 'Path of the selected signal';
      hp.textContent = 'No signal matches.';
      return;
    }
    if (r.t === 'MB') return drawMB(r, hp, cap);
    const out = r.t === 'AO' || r.t === 'DO',
      upL = r.up && r.up.length && !out ? r.up[r.up.length - 1][0] : '',
      who = /^(TCS|GCP)/.test(upL) ? upL.slice(0, 3) : r.sys === 'Field' ? 'field' : r.sys;
    const org = r.up && r.up.length ? 'chain: ' + r.up.map(h => h[0]).join(' → ') + (out ? ' → ' + r.sys : r.up.some(h => /^DCS/.test(h[0])) ? '' : ' → DCS') + '  ·  ' : r.og === 'GCP' && out ? 'value comes from GCP  ·  ' : '';
    cap.textContent = '';
    cap.append(
      r.tag + '  ·  ' + r.desc + '  ·  ' + org + (out ? 'DCS sends to ' + who : who + ' sends to DCS') + '  ·  ',
      E('a', {
        href: '#',
        cls: 'trcinfo',
        txt: 'info card',
        title: 'Source, used by, effects on the logic sheets',
        on: e => {
          e.preventDefault();
          try {
            window.lsInfo && window.lsInfo(r.a, { stn: r.s, look: 1 });
          } catch (x) {}
        }
      })
    );
    const ups = r.pair ? r.pair.up : r.up || [];
    hp.append(legend(LEG));
    if (r.pair) {
      /* an AO that repeats an AI: the whole chain, without a cut: where the AI starts, the wiring of the AI, the copy inside the
         DCS, the wiring of the AO */
      const b = r.pair;
      if (b.up && b.up.length) upstream(b, b.up, hp, '1 · WHERE THE VALUE STARTS (before the rack room)');
      wiring(b, hp, (b.up && b.up.length ? '2' : '1') + ' · INTO THE DCS: ' + stnOf(b) + ' ' + b.a + ' (' + b.tag + ')');
      const k = b.up && b.up.length ? 3 : 2;
      if (stnOf(b) !== stnOf(r)) {
        /* two stations: controller -> FL-NET -> switches -> FL-NET -> controller */
        const fb = FLH['10' + b.s],
          fa = FLH['10' + r.s];
        if (fb && fa) {
          upstream(
            Object.assign({}, r, { og: 'NET', ref: NETSRC + '. The block that copies ' + b.a + ' to ' + r.a + ' is not in the ABC / DITL drawings; the pair is the same signal name and range in the I/O list' }),
            [
              ['Controller FCS10' + b.s + '-A / B', stnOf(b) + ' ' + b.a + ' (' + b.tag + ') · ' + fb[2], '', '', 'Ethernet FL-NET A + B (two-way), cables ' + fb[0] + ', ' + fb[1] + ' m'],
              ['FL-NET switches ' + fb[3].replace('FL-NET switches ', ''), 'MOXA EDS-316 · ' + fb[4], '', '', 'Ethernet FL-NET A + B (two-way), cables ' + fa[0] + ', ' + fa[1] + ' m'],
              ['Controller FCS10' + r.s + '-A / B', stnOf(r) + ' ' + r.a + ' (' + r.tag + ') · ' + fa[2], '', '', '']
            ],
            hp,
            k + ' · BETWEEN THE TWO DCS STATIONS (FL-NET Ethernet)',
            1
          );
          wiring(r, hp, k + 1 + ' · OUT OF THE DCS: ' + stnOf(r) + ' ' + r.a + ' to ' + r.sys);
          netSec(r, k + 2);
          return;
        }
      }
      const sv = el('svg', { viewBox: '0 0 1240 96', role: 'img', 'aria-label': 'Inside the DCS' }, hp),
        two = stnOf(b) !== stnOf(r),
        c = two ? CK.en[0] : CK.in[0];
      tx(sv, 16, 16, 'tl', k + ' · INSIDE THE DCS');
      [[16, stnOf(b) + ' ' + b.a, b.tag + ' (input)'], [520, stnOf(r) + ' ' + r.a, r.tag + ' (output)']].forEach(([x, t, s2]) => {
        el('rect', { class: 'box', x, y: 26, width: 300, height: 52, rx: 6 }, sv);
        tx(sv, x + 10, 46, 'bt', t);
        tx(sv, x + 10, 64, 'bs', s2);
      });
      el('path', { class: 'w', d: 'M316,52 H514', stroke: c, 'stroke-dasharray': two ? '' : '5 4' }, sv);
      arrowHead(sv, 510, 52, 1, c);
      if (two) arrowHead(sv, 322, 52, -1, c);
      tx(sv, 418, 44, 'll', two ? 'DCS control network (FL-NET)' : 'value copied inside the DCS', 'middle').setAttribute('fill', c);
      if (two) tx(sv, 418, 70, 'tl', stnOf(b) + ' → ' + stnOf(r), 'middle');
      tx(sv, 840, 46, 'tl', 'The copy block is not in the ABC / DITL drawings; the pair is the');
      tx(sv, 840, 60, 'tl', 'same signal name and range in the I/O list.');
      wiring(r, hp, k + 1 + ' · OUT OF THE DCS: ' + stnOf(r) + ' ' + r.a + ' to ' + r.sys);
      netSec(r, k + 2);
      return;
    }
    if (r.up && r.up.length) upstream(r, r.up, hp, 'BEFORE THE RACK ROOM: where the signal starts');
    wiring(r, hp, r.up && r.up.length ? 'IN THE RACK ROOM' : '');
    netSec(r, 0);
  }


  /* 3.2.3-beta.122 RANGE CHECK (user 2026-11-12: the generator voltage reads 13.8 kV on the DCS and TCS HMI but 18 kV on the
     SCADA HMI, "hnd malaman saan ito aayusin ... Dpt applicable s lahat"): every point of an analog chain where the value is
     shown or scaled, with its range from the documents, and the mA that each terminal must carry. The operator writes what
     each HMI shows (or the mA measured at a terminal) and the first point that does not agree with the one before it shows
     where the fault is: between those two points. Ranges: the I/O list (dcs-io-list.xls, range low / high / unit of each
     address); RX = ranges before and after the DCS that the I/O list does not give (GCP transducer, TCS, SCADA), as read by the
     control network study; a point without a source says "not in the documents". */
  const GS = 'GSE-2013-0083 (7X7SKB1104)',
    TE = 'TCS Elementary 331DM07733',
    rg = (lo, hi, u, ref) => ({ lo, hi, u, ref });
  const RXg = (lo, hi, u, sec, tin, tout, note) => ({
    sec,
    tr: rg(lo, hi, u, GS + ' sh51 GA128, multi transducer QT2-93A output 4 ~ 20 mA'),
    tin: rg(lo, hi, u, TE + ' ' + tin + ', TCS input card 1 ~ 5 V' + (note || '')),
    tout: rg(lo, hi, u, TE + ' ' + tout + ', TCS output to the DCS')
  });
  const VSEC = rg(0, 150, 'V AC', GS + ' sh50 GA126 VT2 13.8 kV : 115 V (ratio 120) and sh51 GA128 QT2-93A input 0 ~ 150 V AC = 0 ~ 18 kV'),
    ISEC = rg(0, 5, 'A AC', GS + ' sh50 GA126 CT 10000 / 5 A (ratio 2000): 0 ~ 10 kA = 0 ~ 5 A'),
    KAN = '; the drawing writes 0~10kV, meaning kA';
  const RX = {
    '2|AI0807': RXg(0, 18, 'kV', VSEC, 'TC0651', 'TC0691'),
    '2|AI0871': RXg(0, 18, 'kV', VSEC, 'TC0655', 'TC0692'),
    '2|AI0903': RXg(0, 18, 'kV', VSEC, 'TC0656', 'TC0693'),
    '2|AI0791': RXg(0, 10, 'kA', ISEC, 'TC0651', 'TC0691', KAN),
    '2|AI0855': RXg(0, 10, 'kA', ISEC, 'TC0655', 'TC0692', KAN),
    '2|AI0887': RXg(0, 10, 'kA', ISEC, 'TC0656', 'TC0693', KAN),
    '2|AI0775': RXg(-240, 240, 'Mvar', null, 'TC0659', 'TC0692', '; written LEAD 240 ~ 0 ~ LAG 240'),
    '2|AI0823': RXg(-0.5, 0.5, '', null, 'TC0659', 'TC0692', '; written LEAD 0.5 ~ 1 ~ LAG 0.5'),
    '2|AI0839': RXg(55, 65, 'Hz', null, 'TC0659', 'TC0692'),
    '1|AI0774': { tr: rg(0, 240, 'MW', GS + ' sh52 GA129, watt transducer U03GA101 output 4 ~ 20 mA') },
    '1|AI0419': { tr: rg(0, 240, 'MW', GS + ' sh52 GA129, watt transducer U03GA101 output 4 ~ 20 mA') }
  };
  const pct = (v, lo, hi) => (100 * (v - lo)) / (hi - lo);
  const fx = (v, n) => (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(n == null ? 2 : n)).replace(/\.?0+$/, m => (m.includes('.') ? '' : m));
  const rngT = g => (g && g.lo != null && g.hi != null ? fx(g.lo) + ' ~ ' + fx(g.hi) + ' ' + (g.u || '') : 'not in the documents');
  const unitN = u => String(u || '').toLowerCase();
  function rangePts(r) {
    const P = [];
    const io = (x, kind) => ({ lo: x.lo, hi: x.hi, u: x.u, ref: 'I/O list ' + stnOf(x) + ' ' + x.a + ' (' + x.tag + ')', kind });
    const b = r.pair || (r.t === 'AI' ? r : null);
    if (b) {
      const ups = b.up || [],
        X = RX[b.s + '|' + b.a] || {};
      if (X.sec) P.push({ n: X.sec.u === 'V AC' ? 'VT2 secondary' : 'CT secondary', w: 'GCP test terminal ' + (X.sec.u === 'V AC' ? 'FJ1 11 / 22 / 33 (V AC, between phases)' : 'FJ2 (A AC, clamp meter)'), g: X.sec, phys: 1 });
      ups.forEach(h => {
        if (/transducer/.test(h[0])) P.push({ n: h[0], w: 'output terminals ' + h[2] + ' / ' + h[3] + ' (mA)', g: X.tr, term: 1 });
        else if (/^TCS input/.test(h[0])) P.push({ n: 'TCS: ' + h[0], w: 'TCS HMI (value the TCS reads; card input 1 ~ 5 V)', g: X.tin, hmi: 'TCS HMI' });
        else if (/^TCS output/.test(h[0])) P.push({ n: 'TCS: ' + h[0], w: 'output terminals ' + h[2] + ' / ' + h[3] + ' (mA, to the DCS)', g: X.tout, term: 1 });
        else if (/field sensor/.test(h[1])) P.push({ n: h[0], w: 'transmitter output (mA)', g: X.tr, term: 1 });
      });
      P.push({ n: 'DCS ' + stnOf(b) + ' ' + b.a + ' (' + b.tag + ')', w: 'marshalling ' + b.mpl + ' ' + b.ms + ' ' + b.mt1 + ' / ' + b.mt2 + ' (mA)', g: io(b), term: 1 });
      P.push({ n: 'DCS ' + stnOf(b) + ' ' + b.a, w: 'DCS HMI (value the DCS reads)', g: io(b), hmi: 'DCS HMI' });
    }
    if (r.t === 'AO') {
      const X = RX[r.s + '|' + r.a] || {};
      P.push({ n: 'DCS ' + stnOf(r) + ' ' + r.a + ' (' + r.tag + ')', w: 'marshalling ' + r.mpl + ' ' + r.ms + ' ' + r.mt1 + ' / ' + r.mt2 + ' (mA, out to ' + r.sys + ')', g: io(r), term: 1 });
      P.push({ n: r.sys + ' input', w: r.sys + ' HMI (value the ' + r.sys + ' shows)', g: X.rcv, hmi: r.sys + ' HMI' });
    }
    return P;
  }
  function rangeSec(r) {
    if (r.t === 'MB' || r.t === 'DI' || r.t === 'DO' || /PI/.test(r.sig || '')) return;
    const P = rangePts(r);
    if (!P.length) return;
    const hp = host.querySelector('#trcpath');
    const box = E('div', { cls: 'trcrng' });
    box.append(
      E('div', { cls: 'trcl', txt: 'RANGE CHECK: where is the value wrong?' }),
      E('p', { cls: 'trcrh', txt: 'Write what each HMI shows, or the mA you measure at a terminal. The app turns each one into % of its range. The first point that does not agree with the point before it shows where the fault is: between those two points. With one value, the app shows the mA each terminal must carry.' })
    );
    /* range differences in the documents themselves */
    const D = [];
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1].g,
        c = P[i].g;
      if (a && c && !P[i - 1].phys && a.lo != null && c.lo != null && (a.lo !== c.lo || a.hi !== c.hi || unitN(a.u) !== unitN(c.u))) D.push([P[i - 1], P[i]]);
    }
    const tb = E('tbody');
    const ins = [];
    P.forEach((p, i) => {
      const inp = E('input', { type: 'number', step: 'any', cls: 'trci trcrv', placeholder: p.term ? 'mA' : (p.g && p.g.u) || 'value', 'aria-label': 'Value at ' + p.w });
      const exp = E('div', { cls: 'm' }),
        res = E('div', {});
      ins.push({ p, inp, exp, res });
      tb.append(E('tr', {}, [E('td', { txt: String(i + 1) }), E('td', { txt: p.n }), E('td', { txt: p.w }), E('td', {}, [E('div', { cls: 'm', txt: rngT(p.g) }), p.g && p.g.ref ? E('div', { cls: 'trcrs', txt: p.g.ref }) : null]), E('td', {}, [inp]), E('td', {}, [exp, res])]));
      inp.oninput = calc;
    });
    const out = E('p', { cls: 'trcrr' });
    function calc() {
      let ref = null,
        bad = null;
      ins.forEach(o => {
        o.res.textContent = '';
        o.res.className = '';
        o.exp.textContent = '';
      });
      for (const o of ins) {
        const v = parseFloat(o.inp.value),
          g = o.p.g;
        if (isNaN(v)) continue;
        let pc = o.p.term ? pct(v, 4, 20) : g && g.lo != null ? pct(v, g.lo, g.hi) : null,
          via = '';
        if (pc == null) {
          /* no range in the documents (the SCADA input): read the value with the range of the point before it */
          const k = ins.indexOf(o);
          const pr = ins.slice(0, k).reverse().find(q => !q.p.term && q.p.g && q.p.g.lo != null) || ins.slice(0, k).reverse().find(q => q.p.g && q.p.g.lo != null);
          if (!pr) {
            o.res.textContent = 'range not in the documents';
            continue;
          }
          pc = pct(v, pr.p.g.lo, pr.p.g.hi);
          via = ' (its range is not in the documents; read with ' + rngT(pr.p.g) + ' of point ' + (ins.indexOf(pr) + 1) + ')';
        }
        if (ref && !bad && Math.abs(pc - ref.pc) > 1) {
          bad = [ref, o];
          o.res.textContent = 'DOES NOT AGREE: ' + fx(pc, 1) + ' %' + (pc >= 99.5 ? ' = full scale (20 mA)' : pc <= 0.5 ? ' = bottom of the range (4 mA or less)' : '') + via;
          o.res.className = 'bad';
        } else {
          o.res.textContent = fx(pc, 1) + ' %' + (ref ? ' (agrees)' : '') + via;
          o.res.className = ref ? 'ok' : '';
        }
        if (!ref) ref = { o, pc };
        else if (!bad) ref = { o, pc };
      }
      if (ref) {
        const base = (bad ? bad[0] : ref).pc;
        ins.forEach((o, i) => {
          const pg = i > 0 ? ins[i - 1].p.g : null,
            g = o.p.g,
            diff = pg && g && !ins[i - 1].p.phys && pg.lo != null && g.lo != null && (pg.lo !== g.lo || pg.hi !== g.hi || unitN(pg.u) !== unitN(g.u));
          if (o.p.term && diff) {
            /* two ranges in the documents: the copy block may scale, or may pass the number as it is */
            const val = pg.lo + ((pg.hi - pg.lo) * base) / 100,
              raw = Math.max(0, Math.min(100, pct(val, g.lo, g.hi)));
            o.exp.textContent = fx(4 + (16 * base) / 100) + ' mA if the DCS scales the range; ' + fx(4 + (16 * raw) / 100) + ' mA if it passes ' + fx(val) + ' as ' + fx(val) + ' ' + g.u;
          } else if (o.p.term) o.exp.textContent = 'must be ' + fx(4 + (16 * base) / 100) + ' mA';
          else if (o.p.g && o.p.g.lo != null) o.exp.textContent = 'must show ' + fx(o.p.g.lo + ((o.p.g.hi - o.p.g.lo) * base) / 100) + ' ' + o.p.g.u;
          else {
            const pr = ins.slice(0, i).reverse().find(q => !q.p.term && q.p.g && q.p.g.lo != null);
            if (pr) o.exp.textContent = 'should show ' + fx(pr.p.g.lo + ((pr.p.g.hi - pr.p.g.lo) * base) / 100) + ' ' + pr.p.g.u + ' if it uses the range of point ' + (ins.indexOf(pr) + 1);
          }
        });
      }
      out.textContent = bad
        ? 'The fault is between point ' + (ins.indexOf(bad[0].o) + 1) + ' (' + bad[0].o.p.w + ') and point ' + (ins.indexOf(bad[1]) + 1) + ' (' + bad[1].p.w + '). Check what lies between them on the path above: the wiring and terminals, the card, and the range set in each system.'
        : ref
          ? 'All the values you wrote agree. Write the next point, or measure the mA at the next terminal.'
          : '';
    }
    box.append(E('div', { cls: 'trctw' }, [E('table', { cls: 'trct trcrt' }, [E('thead', {}, [E('tr', {}, ['#', 'Point', 'Where to read it', 'Range (documents)', 'Value you see', 'Expected and result'].map(h => E('th', { txt: h })))]), tb])]), out);
    if (D.length)
      D.forEach(([a, c]) => {
        const k = a.g.hi - a.g.lo,
          msg = 'The documents give two different ranges: ' + a.n + ' ' + rngT(a.g) + ' (' + (a.g.ref || '') + '), ' + c.n + ' ' + rngT(c.g) + ' (' + (c.g.ref || '') + '). The block that copies the value is not in the ABC / DITL drawings, so the documents do not say how it scales. Check the range set in the DCS for both addresses.';
        box.append(E('p', { cls: 'trcrd', txt: msg }));
      });
    box.append(E('p', { cls: 'trcsrc', txt: 'Ranges: I/O list (dcs-io-list.xls column Range) for the DCS addresses; GCP and TCS ranges from the drawings named under each range, as read by the control network study. The SCADA input scaling is not in the documents (SCADA manual LM-S1-O-001 has no point list). 4 ~ 20 mA and 1 ~ 5 V = 0 ~ 100 % of the range.' }));
    hp.append(box);
  }

  /* a Modbus point: the package PLC (A and B) and the DCS talk both ways on Ethernet; the value of this point goes one way */
  function drawMB(r, hp, cap) {
    const S = r.mb,
      toDcs = r.to === 'DCS';
    cap.textContent = (r.tag ? r.tag + '  ·  ' : '') + r.desc + '  ·  Modbus ' + r.maddr + '  ·  ' + (toDcs ? S.pkg + ' sends to DCS' : 'DCS sends to ' + S.pkg);
    hp.append(legend(LEG));
    const E1 = 'Ethernet (two-way)',
      addr = S.stn + ' ' + r.a,
      hops = [
        [S.pkg + ' A / B', S.pan + ', RJ-45 port. Modbus address ' + r.maddr, '', '', E1 + ', SFTP cable ' + S.sftp[0] + ' (A) / ' + S.sftp[1] + ' (B)'],
        ['MOXA EDS-316 switch', S.hub, '', '', E1 + ', SFTP cable ' + S.hubup],
        ['Gateway ' + S.gcs + '-A / B', S.gcs + ' cabinet, Modbus to FL-NET', '', '', 'Ethernet FL-NET A + B (two-way), cables ' + S.fl + ', ' + S.fllen],
        ['FL-NET switches ' + S.fhubs, 'MOXA EDS-316 in ' + S.fhub, '', '', 'Ethernet FL-NET A + B (two-way), cables ' + S.fcs + ', ' + S.fcslen],
        ['Controller ' + S.ctl + '-A / B', toDcs ? 'receives into ' + r.a + (r.word2 ? ' (area 1) / ' + r.word2 + (r.mt === 'DI' ? ' bit ' + r.a.split(' bit ')[1] : '') + ' (area 2)' : '') : 'sends ' + r.a, '', '', toDcs ? 'inside the DCS controller (selects area 1 or 2)' : ''],
        ['DCS address ' + addr, r.ind ? 'operator display: ' + r.ind : r.mt + ' point', '', '', '']
      ];
    if (!toDcs) {
      /* DCS to PLC: the same route the other way */
      const rev = hops.slice(0, 5).reverse().map((h, i, A) => [h[0], h[1], h[2], h[3], i < A.length - 1 ? A[i + 1][4] : '']);
      rev[0][4] = 'Ethernet FL-NET A + B (two-way), cables ' + S.fcs + ', ' + S.fcslen;
      rev[1][4] = 'Ethernet FL-NET A + B (two-way), cables ' + S.fl + ', ' + S.fllen;
      rev[2][4] = E1 + ', SFTP cable ' + S.hubup;
      rev[3][4] = E1 + ', SFTP cable ' + S.sftp[0] + ' (A) / ' + S.sftp[1] + ' (B)';
      rev[4][4] = '';
      hops.length = 0;
      hops.push(['DCS address ' + addr, 'DCS logic memory to the Modbus area', '', '', 'inside the DCS controller']);
      rev.forEach(h => hops.push(h));
    }
    upstream(
      Object.assign({}, r, {
        og: 'MB',
        ref:
          'Modbus communication list between DCS and ' + (S.sys === 'TCS' ? 'turbine system' : 'SCADA') + ' (point, Modbus address, SI word); communication list between DCS and package (' + S.gcs + ' connection, RJ-45); ' + S.dwg + ' (as read by the control network study). DI bit = position of the point in its 16-bit word, counted from the row that names the word. The list does not say which PLC (A or B) fills area 1 or area 2'
      }),
      hops,
      hp,
      'MODBUS OVER ETHERNET: every device and cable from the package PLC to the DCS address · value of this point: ' + (toDcs ? S.pkg + ' → DCS' : 'DCS → ' + S.pkg),
      1
    );
  }
  window.LS_TRACER = { render };
})();
