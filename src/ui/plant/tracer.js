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
  /* 3.2.3-beta.118: the whole chain before the rack room, with terminals and what travels on each line, as read by the control
     network study (ARIN, add_origin.py v2): GCP side from GSE-2013-0083 (7X7SKB1104) sheets 50 ~ 53 (GA126 ~ GA130) and 70 ~ 73
     (GA187 / GA188 / GA190); TCS side from TCS Elementary Diagram 331DM07733 (input SD-AI-L GXF ch1..8 = 1/2, 5/6, 9/10, 13/14,
     21/22, 25/26, 29/30, 33/34, TC0751; output SD-AO GXF / AXF chN = 2N-1 / 2N, TC0791 / TC0160).
     Hop = [name, note, terminal +, terminal −, what travels on the line to the next hop]. '–' = not in the documents; '' = no wire. */
  const T = 'TCS Elementary Diagram 331DM07733',
    G = 'GSE-2013-0083 (7X7SKB1104) sh50-53 GA126 ~ GA130 + sh70-73 GA187 / GA188 / GA190',
    MA = '4-20 mA DC, 2 wires';
  const INT = { 1: [1, 2], 2: [5, 6], 3: [9, 10], 4: [13, 14], 5: [21, 22], 6: [25, 26], 7: [29, 30], 8: [33, 34] };
  const OT = ch => [String(2 * ch - 1), String(2 * ch)];
  const CTH = [
    ['Generator CT GA016CT4', '10000/5 A, 4 wires (sheet GA126)', '1', '4', 'CT 5 A AC, 4 wires'],
    ['TCS PLU (TCS-4 rack)', 'CT passes through PLU DEX1, in 1 ~ 4, out 5 ~ 8 (TCS drawing TC0412)', '5', '8', 'CT 5 A AC, 4 wires, GA126C001'],
    ['GCP terminal block X05', 'GA230, terminals 1 ~ 4', '1', '4', 'CT 5 A AC, 4 wires'],
    ['GCP test terminal FJ2 (P12)', 'MT-42A, 11 / 22 / 33 / 44', '11', '44', 'CT 5 A AC, 4 wires GA126A04 / B04 / C04 / NE04']
  ];
  const VTH = [
    ['Generator VT2 GA022VT2', '13.8 kV/√3 : 115 V/√3 (sheet GA126)', '1', '3', 'VT 115 V AC, 3 wires'],
    ['GCP terminal block X04', 'GA229, terminals 1 ~ 3', '1', '3', 'VT 115 V AC, 3 wires'],
    ['GCP fuses F07 ~ F09', 'EFB-5, 3 A (GCP)', '', '', 'VT 115 V AC, 3 wires'],
    ['GCP test terminal FJ1 (P11)', 'MT-41A, 11 / 22 / 33', '11', '33', 'VT 115 V AC, 3 wires GA126A03 / B03 / C03']
  ];
  const SRC = { CT: CTH, VT: VTH, CTVT: CTH },
    VTNOTE = ' + VT2 115 V into P1 / P2 / P3 (path: VT2 → X04 → fuses F07 ~ F09 → test terminal FJ1)';
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
      inp = { CT: 'CT into 1S / 3S', VT: 'VT into P1 / P2 / P3', CTVT: 'CT into 1S / 3S' + VTNOTE }[t[6]];
    return cp(SRC[t[6]]).concat([
      ['GCP multi transducer', 'QT2-93A (U01GA101). ' + inp + '. Out ' + t[0] + ' / ' + t[1], t[0], t[1], '4-20 mA DC, wires ' + t[2]],
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
  /* the generator MW to the DCS (direct cables GCP -> DCS), the watt-hour / var-hour pulses and the ready-to-synchronize contacts */
  const MWH = () =>
    cp(CTH).concat([
      ['GCP MW transducer', 'W T/D U03GA101 (out A / B) or multi meter P40GA101 (out 16 / 17). CT into 1S / 3S' + VTNOTE, '', '', MA],
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
    if (kind === 'in' && /^DCS .*AI/.test(h[0])) return { t: 'inside the DCS (copy block not drawn)', in: 1 };
    return { t, in: kind === 'in' ? 1 : 0, loop };
  };
  /* Modbus over Ethernet (two-way link) with the package PLC: LMYP-1 #1-Communication list between DCS and package.xls (sheets
     #1 GCS10F and Common GCS10E: PLC-A / PLC-B, Modbus connection, "RJ-45 Only") and Memory for Sub_System PLC MODBUS.xls
     (SI Address: turbine area SI1000 ~ / SI1300 ~ of STN102, SCADA SI8600 ~ / SI8800 ~ of STN105; BC send / receive of the
     GCS to the station). Points: the Modbus communication lists (src/ui/plant/dcslists.js). */
  const MBS = {
    tcs: { sys: 'TCS', pkg: 'Turbine system PLC', gcs: 'GCS10F', con: 'Modbus connection 1 (PLC-A) / 2 (PLC-B)', stn: 'STN102' },
    sca: { sys: 'SCADA', pkg: 'SCADA PLC', gcs: 'GCS10E', con: 'Modbus connection 7 (PLC-A) / 8 (PLC-B)', stn: 'STN105' }
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
  /* colour = the kind of cable or link (user 2026-11-12 "magcolor coding ka. Ipakita mo anong cable ang gamit"); the text on
     each line says what travels on it (4-20 mA, contact, RTD, Modbus) */
  const CK = {
    fc: ['var(--trc-fc)', 'field / panel cable (copper)'],
    xw: ['var(--trc-xw)', 'cross wiring inside the marshalling panel'],
    pf: ['var(--trc-pf)', 'prefab cable, marshalling panel → FCS'],
    ic: ['var(--trc-ic)', 'internal cable, terminal board → I/O card'],
    in: ['var(--trc-in)', 'inside a controller (no cable)'],
    en: ['var(--trc-en)', 'Ethernet copper (RJ-45)'],
    fo: ['var(--trc-fo)', 'fiber optic'],
    nw: ['var(--trc-nw)', 'DCS control network']
  };
  const legend = keys =>
    E(
      'div',
      { cls: 'trcleg' },
      keys.map(k => E('span', {}, [E('i', { cls: k === 'in' ? 'dash' : '', style: 'background:' + CK[k][0] }), CK[k][1]]))
    );
  const arrowHead = (p, x, y, d, c) =>
    el('path', { d: d > 0 ? 'M' + (x - 5) + ',' + (y - 5) + 'L' + (x + 5) + ',' + y + 'L' + (x - 5) + ',' + (y + 5) + 'z' : 'M' + (x + 5) + ',' + (y - 5) + 'L' + (x - 5) + ',' + y + 'L' + (x + 5) + ',' + (y + 5) + 'z', fill: c }, p);
  const srcLines = (p, y0, text) => {
    const words = text.split(' '),
      lines = [''];
    for (const w of words) (lines[lines.length - 1] + ' ' + w).length > 165 ? lines.push(w) : (lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim());
    lines.forEach((l, i) => tx(p, 16, y0 + i * 14, 'tl', l));
    return y0 + lines.length * 14;
  };
  /* the hops before the rack room (GCP / field -> TCS input -> TCS output) */
  function upstream(r, hops, hp, head) {
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
        YP = y0 + 50,
        YM = y0 + 68,
        fit = (t, px) => (t.length > Math.floor((bw - 16) / px) ? t.slice(0, Math.floor((bw - 16) / px) - 1) + '…' : t);
      el('rect', { class: 'box' + (/^Generator|^TE-|^PT-|^ZT-/.test(h[0]) ? ' dash' : ''), x, y: y0, width: bw, height: 82, rx: 6 }, us);
      tx(us, x + 10, y0 + 19, 'bt2', fit(h[0], 7.4));
      tx(us, x + 10, y0 + 34, 'bs', fit(h[1], 6.3));
      el('title', {}, el('rect', { x, y: y0, width: bw, height: 82, fill: 'transparent' }, us)).textContent = h[0] + ' · ' + h[1] + (h[2] ? ' · terminal ' + h[2] + ' / ' + h[3] : '');
      const L = LINK(h, hops[i + 1], i, r.og),
        x1 = x + bw,
        wrap = col === PER - 1 && i < n - 1,
        last = i === n - 1,
        edge = wrap || (last && col === PER - 1),
        x2 = edge ? 1236 : x1 + gap,
        c = CK[L.in ? 'in' : 'fc'][0];
      if (h[2] !== '' && h[2] != null) {
        /* AC (CT / VT) has no + / −: only the terminal numbers */
        const ac = /AC/.test(L.t);
        [[YP, h[2], '+'], [YM, h[3], '−']].forEach(p => {
          el('circle', { class: 'term', cx: x1, cy: p[0], r: 5 }, us);
          tx(us, x1 - 9, p[0] + 4, 'tn', String(p[1]).replace(/[+-]$/, '') + (ac ? '' : ' ' + p[2]), 'end');
        });
      }
      /* as many lines as the wires written on the drawing (CT 4 wires, VT 3 wires), else 2 */
      const nw = Math.min(4, Math.max(2, +((L.t.match(/(\d) wires/) || [])[1] || 2))),
        WY = Array.from({ length: nw }, (_, k) => YP + ((YM - YP) * k) / (nw - 1));
      const draw2 = (xa, xb, mid) => {
        if (L.in) {
          el('path', { class: 'w', d: 'M' + xa + ',' + (YP + YM) / 2 + ' H' + (xb - 2), stroke: c, 'stroke-dasharray': '5 4' }, us);
          arrowHead(us, xb - 6, (YP + YM) / 2, 1, c);
        } else {
          WY.forEach(y => el('path', { class: 'w' + (nw > 2 ? ' thin' : ''), d: 'M' + (xa + 5) + ',' + y + ' H' + xb, stroke: c }, us));
          arrowHead(us, mid, YP, 1, c);
          if (L.loop) arrowHead(us, mid, YM, -1, c);
        }
      };
      draw2(x1, x2, edge ? x1 + 50 : x1 + gap / 2);
      if (wrap) {
        /* the same wires come in from the left on the next row */
        const ny = 26 + (row + 1) * RH,
          nYP = ny + 50,
          nYM = ny + 68;
        if (L.in) el('path', { class: 'w', d: 'M4,' + (nYP + nYM) / 2 + ' H38', stroke: c, 'stroke-dasharray': '5 4' }, us);
        else WY.forEach(y => el('path', { class: 'w' + (nw > 2 ? ' thin' : ''), d: 'M4,' + (y - YP + nYP) + ' H38', stroke: c }, us));
        tx(us, 1232, YP - 12, 'tl', 'next row ↓', 'end');
      }
      const lx = edge ? x1 + 52 : x1 + gap / 2,
        lab = L.in ? [L.t] : [L.t, last ? 'cable to the rack room:' : '', last ? 'no. not in the documents' : ''];
      L.t
        .replace(/,? (?=wires G|GA\d)/, '\n')
        .split('\n')
        .concat(lab.slice(1))
        .filter(Boolean)
        .forEach((t, k) => tx(us, edge ? 1232 : lx, YM + 22 + k * 12, k ? 'tl' : 'll', t, edge ? 'end' : 'middle').setAttribute('fill', k && /cable|no\./.test(t) ? 'var(--c-dim)' : c));
      if (last) {
        if (edge) tx(us, 1232, YP - 12, 'tl', 'to the rack room ↓', 'end');
        else {
          tx(us, x1 + gap + 4, YP + 2, 'bt2', 'rack room ↓');
          tx(us, x1 + gap + 4, YP + 18, 'bs', 'wiring below');
        }
      }
    });
    const yEnd = srcLines(us, 40 + rows * RH, 'Source: ' + r.ref + '. – = not in the documents.');
    us.setAttribute('viewBox', '0 0 1240 ' + (yEnd + 2));
  }
  /* the wiring in the rack room: other panel / field -> (junction box) -> marshalling panel -> FCS -> address */
  function wiring(r, hp, head) {
    const out = r.t === 'AO' || r.t === 'DO',
      sys = r.sys,
      upL = r.up && r.up.length && !out ? r.up[r.up.length - 1][0] : '',
      who = /^(TCS|GCP)/.test(upL) ? upL.slice(0, 3) : sys === 'Field' ? 'field' : sys,
      S = srcOf(r),
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
      const c = CK[sg[2]][0];
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
      if (d1) arrowHead(svg, x, Y1, d1, CK[k][0]);
      if (d2) arrowHead(svg, x, Y2, d2, CK[k][0]);
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
  function draw(r) {
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
    hp.append(legend((ups.length && ups.some(h => /^TCS/.test(h[0])) ? ['fc', 'in'] : ['fc']).concat(['xw', 'pf', 'ic'], r.pair && stnOf(r.pair) !== stnOf(r) ? ['nw'] : r.pair ? ['in'] : []).filter((k, i, A) => A.indexOf(k) === i)));
    if (r.pair) {
      /* an AO that repeats an AI: the whole chain, without a cut: where the AI starts, the wiring of the AI, the copy inside the
         DCS, the wiring of the AO */
      const b = r.pair;
      if (b.up && b.up.length) upstream(b, b.up, hp, '1 · WHERE THE VALUE STARTS (before the rack room)');
      wiring(b, hp, (b.up && b.up.length ? '2' : '1') + ' · INTO THE DCS: ' + stnOf(b) + ' ' + b.a + ' (' + b.tag + ')');
      const k = b.up && b.up.length ? 3 : 2,
        sv = el('svg', { viewBox: '0 0 1240 96', role: 'img', 'aria-label': 'Inside the DCS' }, hp),
        two = stnOf(b) !== stnOf(r),
        c = two ? CK.nw[0] : CK.in[0];
      tx(sv, 16, 16, 'tl', k + ' · INSIDE THE DCS');
      [[16, stnOf(b) + ' ' + b.a, b.tag + ' (input)'], [520, stnOf(r) + ' ' + r.a, r.tag + ' (output)']].forEach(([x, t, s2]) => {
        el('rect', { class: 'box', x, y: 26, width: 300, height: 52, rx: 6 }, sv);
        tx(sv, x + 10, 46, 'bt', t);
        tx(sv, x + 10, 64, 'bs', s2);
      });
      el('path', { class: 'w', d: 'M316,52 H514', stroke: c, 'stroke-dasharray': two ? '' : '5 4' }, sv);
      arrowHead(sv, 510, 52, 1, c);
      tx(sv, 418, 44, 'll', two ? 'DCS control network, ' + stnOf(b) + ' → ' + stnOf(r) : 'value copied inside the DCS', 'middle').setAttribute('fill', c);
      tx(sv, 840, 46, 'tl', 'The copy block is not in the ABC / DITL drawings; the pair is the');
      tx(sv, 840, 60, 'tl', 'same signal name and range in the I/O list.');
      wiring(r, hp, k + 1 + ' · OUT OF THE DCS: ' + stnOf(r) + ' ' + r.a + ' to ' + r.sys);
      return;
    }
    if (r.up && r.up.length) upstream(r, r.up, hp, 'BEFORE THE RACK ROOM: where the signal starts');
    wiring(r, hp, r.up && r.up.length ? 'IN THE RACK ROOM' : '');
  }

  /* a Modbus point: the package PLC (A and B) and the DCS talk both ways on Ethernet; the value of this point goes one way */
  function drawMB(r, hp, cap) {
    const S = r.mb,
      col = CK.en[0],
      toDcs = r.to === 'DCS';
    hp.append(legend(['en', 'nw']));
    cap.textContent = (r.tag ? r.tag + '  ·  ' : '') + r.desc + '  ·  Modbus ' + r.maddr + '  ·  ' + (toDcs ? S.pkg + ' sends to DCS' : 'DCS sends to ' + S.pkg);
    const svg = el('svg', { viewBox: '0 0 1240 250', role: 'img', 'aria-label': 'Modbus path of ' + (r.tag || r.desc) }, hp);
    tx(svg, 16, 22, 'll', 'Signal: Modbus data. Each link talks both ways (⇄). The value of this point goes one way: ' + (toDcs ? S.pkg + ' → DCS' : 'DCS → ' + S.pkg) + ' (the dashed arrow below).').setAttribute('fill', 'var(--c-tx)');
    const B = [
      { x: 16, w: 230, t: S.pkg, s: 'PLC-A and PLC-B (redundant)', l: ['Modbus ' + r.maddr, r.mt === 'AI' ? 'analog value (register)' : r.mt === 'DI' ? 'status bit' : 'command bit'] },
      { x: 440, w: 280, t: S.gcs, s: 'DCS station with the Modbus links', l: ['', S.con, 'area 1 = PLC-A, area 2 = PLC-B'] },
      { x: 900, w: 324, t: S.stn, s: 'DCS address', l: [r.a, r.word2 ? 'PLC-B copy: ' + r.word2 + (r.mt === 'DI' ? ' bit ' + r.a.split(' bit ')[1] : '') : '', r.ind ? 'operator display: ' + r.ind : ''] }
    ];
    B.forEach(b => {
      el('rect', { class: 'box', x: b.x, y: 40, width: b.w, height: 150, rx: 6 }, svg);
      tx(svg, b.x + 10, 62, 'bt', b.t);
      tx(svg, b.x + 10, 79, 'bs', b.s);
      b.l.forEach((t, i) => t && tx(svg, b.x + 10, 116 + i * 20, i ? 'bs' : 'addr', t));
    });
    const link = (x1, x2, y, c, t1, t2) => {
      el('path', { class: 'w', d: 'M' + (x1 + 8) + ',' + y + ' H' + (x2 - 8), stroke: c }, svg);
      arrowHead(svg, x1 + 6, y, -1, c);
      arrowHead(svg, x2 - 6, y, 1, c);
      tx(svg, (x1 + x2) / 2, y - 10, 'll', t1, 'middle').setAttribute('fill', c);
      tx(svg, (x1 + x2) / 2, y + 20, 'tl', t2, 'middle');
    };
    link(246, 440, 100, CK.en[0], 'Ethernet copper, Modbus', 'RJ-45 only (no fiber)');
    link(720, 900, 100, CK.nw[0], 'DCS control network', 'BC send / receive');
    const y = 214;
    el('path', { class: 'w', d: 'M60,' + y + ' H1180', stroke: 'var(--c-tx)', 'stroke-dasharray': '7 4' }, svg);
    arrowHead(svg, toDcs ? 1176 : 64, y, toDcs ? 1 : -1, 'var(--c-tx)');
    tx(svg, 620, y + 22, 'tl', 'value of this point: ' + (toDcs ? S.pkg + ' → ' + S.gcs + ' → ' + S.stn : S.stn + ' → ' + S.gcs + ' → ' + S.pkg), 'middle');
    hp.append(
      E('p', {
        cls: 'trcsrc',
        txt: 'Source: LMYP-1 #1 Modbus communication list between DCS and ' + (S.sys === 'TCS' ? 'turbine system' : 'SCADA') + ' (point, Modbus address, SI word); Communication list between DCS and package (' + S.gcs + ', ' + S.con + ', RJ-45); Memory for Sub_System PLC MODBUS.xls (SI address areas, BC send / receive). DI bit = position of the point in its 16-bit word, counted from the row that names the word. Not in the documents: the switch / cable numbers of the Ethernet link.'
      })
    );
  }
  window.LS_TRACER = { render };
})();
