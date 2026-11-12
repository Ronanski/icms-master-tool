/* LIBRARY WORKSPACE (2.1.0): the I/O list and the memory lists of the five stations (STN101 ~ STN105), the same data the app
   uses for descriptions (AN.ades()), and the marshalling panel wiring (WIRING tab; on the I/O LIST a click on a row shows it). Search by address, tag or description; a click on the address or the tag copies it (to
   paste in the search bar), "Find" puts it in the search bar and opens the info card. Read only. */
(function () {
  const $ = id => document.getElementById(id);
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
  const MAX = 400;
  let ws = null,
    btn = null,
    rows = { all: [], io: [], mem: [], wire: [], relay: [] },
    WIX = {},
    WRAW = {},
    tab = 'all',
    con = '',
    stn = '',
    q = '',
    loaded = false;
  const fmt = x => (x == null || x === '' ? '' : String(+(+x).toPrecision(6)));
  /* 2.1.0-beta.8 (user): groups like the Excel files. I/O list: one sheet per station, then NODE (N) / I/O UNIT (I), rows by channel.
     Memory list: one workbook per station, one sheet per kind (WM, TR, PTN, SI, DI, WB, FP). Wiring: station / signal kind.
     Relay: the panel sheet (SER, IRP, ARP). A group header opens / closes its rows. */
  const MEMK = [
    [/^M\./, 'WM', 'word memory (M.)'],
    [/^TR/, 'TR', 'timers (type, setting)'],
    [/^PTN/, 'PTN', 'linear patterns (F(X))'],
    [/^SI/, 'SI', 'software internal analog (SI)'],
    [/^DI/, 'DI', 'digital internal (DI)'],
    [/^B\./, 'WB', 'bit memory (B.)'],
    [/^FP/, 'FP', 'floating parameters (FP)'],
    [/^DB/, 'DB', 'digital bit (DB)']
  ];
  /* 2.1.0-beta.9 (user): the VACANT addresses are shown like in the I/O list (memory: tools/data/memspace.py, rows with no
     description in the Excel; I/O and wiring: a channel with no tag and no description) */
  const VAC = 'vacant';
  /* 3.2.3-beta.109 (user 2026-11-12 "Masterlist ng lahat ng address, tags, memory, user tags, everything"): the ALL SIGNALS tab
     puts every I/O address (with its marshalling path), every memory address, every relay panel item and every controller
     tag of the logic sheets in one list. "Connected to" = where the signal comes from or goes to, read from the field side
     of the marshalling wiring (WIRING.xls column JB / source, e.g. JB1A-B303-AIO = a field junction box, TCS-AIO = the turbine
     control system, MCC-->DCS = a motor control center). Labels in words; the panel short name is in the tooltip. */
  const CAT = [
    ['fld', 'Field instruments and devices', 'Field junction boxes (JB) and devices wired direct to the field'],
    ['tcs', 'Turbine control', 'Turbine control system (TCS)'],
    ['gcp', 'Generator control', 'Generator control panel (GCP)'],
    ['gpp', 'Generator protection', 'Generator protection panel (GPP)'],
    ['sca', 'Electrical supervisory', 'Switchgear supervisory control (SCADA)'],
    ['hvp', 'High-voltage switchgear', 'High-voltage motor panels (HVP)'],
    ['mcc', 'Motor control centers', 'Motor control centers (MCC)'],
    ['ee', 'Electrical panels', 'Electrical panels (EE)'],
    ['opc', 'Operator console', 'Operator console push buttons and annunciator (OPC)'],
    ['rly', 'Relay panels', 'Interlock, alarm and sequence of events relay panels (IRP, ARP, SER) and FCS cabinets'],
    ['loc', 'Local and package panels', 'Local control panels, feeders, analyzers, compressors, dryers, inverters and other package panels'],
    ['nw', 'Not wired', 'I/O channel with a tag or description but no field connection in the wiring list'],
    ['mem', 'Memory (inside the DCS)', 'Word memory, bit memory, timers, patterns, software analog and digital (memory lists STN101 ~ STN105)'],
    ['tag', 'Control loops and controller tags', 'DCS loop list (STN101~105_LOOP,USERTAG.xls, sheet LOOP_AX) and the controller, manual station, sum and alarm block tags of the ABC sheets'],
    ['ut', 'User tags (operator screens)', 'DCS user tag list (STN101~105_LOOP,USERTAG.xls, sheet UserTag_AX): the names the operator screens use for a system address'],
    ['rel', 'Relay panel items', 'IRP, ARP and SER panel lists']
  ];
  const CI = {};
  CAT.forEach((c, i) => (CI[c[0]] = i));
  const conOf = o => {
    const j = o.jb || '',
      m = o.mpl || '';
    if (!j) return 'nw';
    if (/^JB|^DIRECT TO/i.test(j)) return 'fld';
    if (/TCS/.test(j)) return 'tcs';
    if (/GCP/.test(j)) return 'gcp';
    if (/GPP/.test(j)) return 'gpp';
    if (/SCADA/.test(j)) return 'sca';
    if (/HVP/.test(j)) return 'hvp';
    if (/MCC/.test(j)) return 'mcc';
    if (/^EE/.test(j)) return 'ee';
    if (/OPC/.test(j)) return 'opc';
    if (/^(IRP|ARP|SER|FCS)/.test(m) || /^(ITB|ALMTB|ATB|STB|TB\d)/.test(j)) return 'rly';
    return 'loc';
  };
  const sl = x => String(x || '').replace(/,/g, '/');
  const nextA = (a, hx) => {
    const m = /^([A-Z]+\.?)([0-9A-F]+)$/.exec(a);
    if (!m) return a;
    const v = parseInt(m[2], hx ? 16 : 10) + 1;
    return m[1] + (hx ? v.toString(16).toUpperCase() : String(v)).padStart(m[2].length, '0');
  };
  const pad = (x, n) => String(x).padStart(n || 3, '0');
  let tog = {}; /* group key -> true (open) / false (closed), set by a click on the header */
  function copy(t) {
    const done = () => {
      try {
        msg('Copied: ' + t + '  (paste it in the search bar)');
      } catch (e) {}
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(done, () => old(t));
        return;
      }
    } catch (e) {}
    old(t);
    function old(s) {
      const a = E('textarea', { style: 'position:fixed;left:-9999px;top:0' });
      a.value = s;
      document.body.append(a);
      a.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      a.remove();
      done();
    }
  }
  function find(t) {
    const sb = $('ansb');
    if (!sb) return;
    open(false);
    sb.value = t;
    sb.dispatchEvent(new Event('input', { bubbles: true }));
    try {
      if (window.lsInfo && window.lsInfo(t, { look: 1 })) {
        const f = $('anfind');
        if (f) f.style.display = 'none';
      }
    } catch (e) {}
  }
  async function load() {
    if (loaded) return;
    loaded = true;
    let A = {};
    try {
      A = (await AN.ades()) || {};
    } catch (e) {}
    /* marshalling wiring (src/ui/plant/wiring.js): one row per signal, indexed by station + address */
    const WF = window.WIRING_F || [],
      W = window.WIRING || [],
      fi = k => WF.indexOf(k);
    for (const w of W) {
      const g = k => w[fi(k)] || '';
      const r = {
        st: g('s'),
        s: 'STN10' + g('s'),
        a: g('a'),
        tag: g('tag'),
        d: g('d'),
        x: g('mpl2') + ' ' + g('tbs') + '-' + g('tbn').replace(/,/g, '/'),
        t: g('k') + (g('sig') && g('sig') !== g('k') ? ' ' + g('sig') : ''),
        ab: '',
        w: {
          fcs: g('ext') + ' · node ' + g('node') + ' · slot ' + g('slot') + ' · ' + g('ch') + ' · board ' + g('board') + ' · cab ' + g('fcab') + ' · TB ' + g('exttb') + ' ' + g('fcstb').replace(/,/g, ' / '),
          cable: g('cab') + (g('spec') ? ' (' + g('spec') + ')' : '') + ' · core ' + g('core').replace(/,/g, ' / '),
          mpl: g('mpl2') + ' · TB strip ' + g('tbs') + ' · TB ' + g('tbn').replace(/,/g, ' / '),
          cross: g('xcab') ? g('xcab') + (g('xspec') ? ' (' + g('xspec') + ')' : '') + ' · core ' + g('xcore').replace(/,/g, ' / ') : '',
          jb: g('jb') ? g('mpl') + ' · ' + g('jb') + ' · TB ' + g('tb').replace(/,/g, ' / ') : ''
        }
      };
      r.h = (r.s + ' ' + r.a + ' ' + r.tag + ' ' + r.d + ' ' + Object.values(r.w).join(' ')).toUpperCase();
      r.gk = r.st + '|' + g('k');
      r.gl = r.s + ' · ' + g('k') + (g('fcab') ? ' · FCS cabinet ' + g('fcab') : '');
      rows.wire.push(r);
      WIX[r.st + '|' + r.a] = r.w;
      WRAW[r.st + '|' + r.a] = { k: g('k'), sig: g('sig'), jb: g('jb'), mpl: g('mpl'), tb: g('tb'), mpl2: g('mpl2'), tbs: g('tbs'), tbn: g('tbn'), cab: g('cab'), ext: g('ext'), fcstb: g('fcstb') };
    }
    /* IRP / ARP / SER items (src/ui/plant/relay.js) */
    for (const r of window.RELAY || []) {
      const vals = Object.values(r.cols),
        k0 = (r.keys || []).find(k => !k.startsWith('T|')),
        t0 = (r.keys || []).find(k => k.startsWith('T|'));
      const row = {
        st: k0 ? k0.split('|')[0] : '',
        s: r.sh,
        a: '#' + r.item,
        tag: t0 ? t0.slice(2) : '',
        d: vals[0] || '',
        x: Object.entries(r.cols).filter(([k]) => /RELAY/.test(k)).map(([, v]) => v).join(' ') || '',
        t: (r.keys || []).filter(k => !k.startsWith('T|')).map(k => k.split('|')[1]).join(' '),
        ab: '',
        rel: r
      };
      row.h = (r.sh + ' ' + r.item + ' ' + vals.join(' ') + ' ' + (r.keys || []).join(' ')).toUpperCase();
      row.gk = r.sh;
      row.gl = r.sh;
      rows.relay.push(row);
    }
    for (const st of Object.keys(A).sort()) {
      const T = A[st];
      for (const k of Object.keys(T).sort()) {
        const r = T[k],
          s = 'STN10' + st;
        if (r.k === 'io') {
          const rg = r.lo != null || r.hi != null ? fmt(r.lo) + ' ~ ' + fmt(r.hi) + (r.u ? ' ' + r.u : '') : r.u || '';
          const G = (window.IO_GROUPS || {})[st + '|' + k] || ['', '', '', ''];
          rows.io.push({
            st, s, a: k, tag: r.tag || '', d: r.d || '', x: rg + (G[3] ? (rg ? ' · ' : '') + G[3] : ''), t: r.t || '', ab: r.ab || '',
            gk: st + '|' + pad(G[0]) + '|' + pad(G[1]),
            gl: s + ' · NODE ' + G[0] + ' · I/O UNIT ' + G[1],
            ch: +G[2] || 0,
            h: (s + ' ' + k + ' ' + (r.tag || '') + ' ' + (r.d || '') + ' ' + (r.ab || '') + ' ' + G[3]).toUpperCase()
          });
        } else {
          const mi = Math.max(0, MEMK.findIndex(m => m[0].test(k))),
            M = MEMK[mi];
          rows.mem.push({ st, s, a: k, tag: '', d: r.d || '', x: r.r || '', t: r.tt || r.ts || '', ab: '', gk: st + '|' + mi, gl: s + ' (' + M[1] + ') · ' + M[2], h: (s + ' ' + k + ' ' + (r.d || '') + ' ' + (r.r || '')).toUpperCase() });
        }
      }
    }
    const MV = window.MEM_VACANT || {};
    for (const st in MV)
      for (const kind in MV[st]) {
        const mi = Math.max(0, MEMK.findIndex(m => m[1] === kind)),
          M = MEMK[mi],
          s = 'STN10' + st,
          T = A[st] || {};
        for (const [a0, cnt] of MV[st][kind].r) {
          let a = a0;
          for (let i = 0; i < cnt; i++, a = nextA(a, MV[st][kind].h))
            if (!T[a]) rows.mem.push({ st, s, a, tag: '', d: '', x: '', t: '', ab: '', vac: 1, gk: st + '|' + mi, gl: s + ' (' + M[1] + ') · ' + M[2], h: (s + ' ' + a + ' VACANT SPARE').toUpperCase() });
        }
      }
    for (const r of rows.io.concat(rows.wire)) if (!r.tag && !r.d) {
      r.vac = 1;
      r.h += ' VACANT SPARE';
    }
    buildAll();
  }
  /* ALL SIGNALS: one row per signal, grouped by "Connected to" and station */
  function addAll(r, c) {
    const C = CAT[CI[c]];
    r.cat = c;
    r.gk = pad(CI[c], 2) + '|' + (r.st || '9');
    r.gl = C[1] + (r.s && /^STN/.test(r.s) ? ' · ' + r.s : '');
    r.h += ' ' + (C[1] + ' ' + C[2]).toUpperCase();
    rows.all.push(r);
  }
  function buildAll() {
    rows.all = [];
    for (const r of rows.io) {
      if (r.vac) continue;
      const o = WRAW[r.st + '|' + r.a];
      const c = o ? conOf(o) : 'nw';
      let x = r.x;
      if (o && o.jb) {
        const from = /^JB/.test(o.jb) ? o.jb.replace(/-(AIO2?|AI\/?O?|DI\d?|DO\d?|AI\d?)$/i, '') : o.jb;
        x = from + ' → ' + o.mpl2 + ' ' + o.tbs + ' ' + sl(o.tbn) + ' → ' + o.ext + ' ' + sl(o.fcstb);
      }
      addAll(Object.assign({}, r, { x, t: (o && o.sig) || r.t, h: r.h + ' ' + (o ? Object.values(o).join(' ') : '').toUpperCase() }), c);
    }
    for (const r of rows.mem) if (!r.vac) addAll(Object.assign({}, r), 'mem');
    for (const r of rows.relay) addAll(Object.assign({}, r), 'rel');
    addLists();
    sortAll();
  }
  function sortAll() {
    rows.all.sort((a, b) => (a.gk < b.gk ? -1 : a.gk > b.gk ? 1 : a.a < b.a ? -1 : a.a > b.a ? 1 : 0));
  }
  /* 3.2.3-beta.112: the DCS loop list, the user tag list and the Modbus point lists of the turbine control system and the SCADA
     (src/ui/plant/dcslists.js, tools/data/dcslists.py). Loop type codes in words only where the logic sheets show the same tag
     as that block (checked 2026-11-12 on the app index: 1 = PID 55 tags, 2 = PIDV 2, 22 = MAN 58, 21 = ALM 104, 19 = SUMA 10);
     18 and 56 have no matching block and stay as their code. */
  const LT = { 1: 'Controller', 2: 'Controller', 22: 'Manual station', 21: 'Indicator and alarm', 19: 'Totalizer' };
  const LOOPIX = {};
  const rec = (F, a) => {
    const o = {};
    F.forEach((k, i) => (o[k] = a[i] == null ? '' : String(a[i])));
    return o;
  };
  const rng = o => (o.lo !== '' || o.hi !== '' ? (o.lo === '0' && o.hi === '0' ? '' : o.lo + ' ~ ' + o.hi + (o.unit ? ' ' + o.unit : '')) : '');
  function addLists() {
    for (const a of window.DCS_LOOPS || []) {
      const o = rec(window.DCS_LOOPS_F, a),
        tg = o.tag.replace(/\s+/g, ''),
        x = [o.pv && 'PV ' + o.pv.replace(/\s+/g, ''), o.rsv && 'remote SV ' + o.rsv.replace(/\s+/g, ''), o.mv && 'MV ' + o.mv.replace(/\s+/g, ''), rng(o)].filter(Boolean).join(' · '),
        t = LT[o.type] || 'loop type ' + o.type;
      LOOPIX[tg.replace(/\.MV$/, '')] = 1;
      addAll({ st: o.stn, s: 'STN10' + o.stn, a: tg, tag: '', d: o.name, x, t, ab: '', h: (tg + ' ' + o.name + ' ' + x + ' ' + t + ' LOOP').toUpperCase(), lt: 1 }, 'tag');
    }
    for (const a of window.DCS_UTAG || []) {
      const o = rec(window.DCS_UTAG_F, a),
        t = /DEVICE OPERATE/.test(o.type) ? 'Device operation word' : /UNIFY/.test(o.type) ? 'Engineering value' : o.type;
      addAll({ st: o.stn, s: 'STN10' + o.stn, a: o.sys, tag: o.utag.replace(/\.VAL$/, ''), d: o.dname, x: rng(o), t, ab: '', h: (o.sys + ' ' + o.utag + ' ' + o.dname + ' ' + o.type + ' USER TAG').toUpperCase(), lt: 1 }, 'ut');
    }
    for (const a of window.DCS_MODBUS || []) {
      const o = rec(window.DCS_MODBUS_F, a),
        st = o.sys === 'tcs' ? '2' : '5',
        x = (o.si ? o.si + ' · ' : '') + o.from + ' → ' + o.to;
      addAll({ st, s: 'STN10' + st, a: 'Modbus ' + o.maddr, tag: o.tag, d: o.d, x, t: o.type + ' by Modbus', ab: '', h: ('MODBUS ' + o.maddr + ' ' + o.tag + ' ' + o.d + ' ' + o.si + ' ' + o.type).toUpperCase(), lt: 1, mb: 1 }, o.sys);
    }
  }
  /* the controller tags of the logic sheets (the index the faceplates use, AN.hmiList): read after the list is shown; the ones
     already in the loop list are not repeated */
  const KW = { PID: 'Controller', PIDV: 'Controller', MAN: 'Manual station', SUMA: 'Sum block', ALM: 'Alarm block', FX: 'Function curve' };
  let tagsDone = false;
  function loadTags() {
    if (tagsDone) return;
    tagsDone = true;
    setTimeout(() => {
      let L = [];
      try {
        L = (window.AN && AN.hmiList && AN.hmiList(true)) || [];
      } catch (e) {}
      if (!L.length) return;
      const seen = {};
      for (const t of L) {
        if (seen[t.addr] || LOOPIX[t.addr]) continue;
        seen[t.addr] = 1;
        const st = t.sh && t.sh.stn ? String(t.sh.stn) : '',
          kw = KW[t.kind] || 'Logic block',
          d = t.desc || kw + ' on sheet ' + t.sheet;
        addAll({ st, s: st ? 'STN10' + st : '', a: t.addr, tag: '', d, x: 'sheet ' + t.sheet, t: kw, ab: '', h: (t.addr + ' ' + t.sheet + ' ' + d + ' ' + kw + ' ' + (t.kind || '')).toUpperCase(), lt: 1 }, 'tag');
      }
      sortAll();
      fillCon();
      if (tab === 'all') render();
    }, 400);
  }
  function sortGroups() {
    rows.io.sort((a, b) => (a.gk < b.gk ? -1 : a.gk > b.gk ? 1 : a.ch - b.ch || (a.a < b.a ? -1 : 1)));
    rows.mem.sort((a, b) => (a.gk < b.gk ? -1 : a.gk > b.gk ? 1 : a.a < b.a ? -1 : 1));
    rows.wire.sort((a, b) => (a.gk < b.gk ? -1 : a.gk > b.gk ? 1 : a.a < b.a ? -1 : 1));
    /* the I/O unit header names the signal kind(s) of the unit (DI, AI ...) */
    const kinds = {};
    for (const r of rows.io) (kinds[r.gk] = kinds[r.gk] || new Set()).add(r.t);
    for (const r of rows.io) if (!r._k) {
      r.gl += ' · ' + [...kinds[r.gk]].filter(Boolean).join(' / ');
      r._k = 1;
    }
  }
  function render() {
    const box = $('libtb'),
      cnt = $('libcnt');
    if (!box) return;
    box.innerHTML = '';
    if (ws) ws.classList.toggle('calc', tab === 'calc');
    if (tab === 'calc') {
      cnt.textContent = '';
      const C = window.CALC_COMP || [],
        D = window.CALC_DRUM;
      box.append(E('div', { cls: 'libsec', txt: 'FLOW COMPENSATION (document-references/flow-compensation.xls) · ' + C.length + ' flows' }));
      for (const c of C)
        box.append(
          E('div', { cls: 'libcalc' }, [
            E('b', { txt: c.stn + ' · ' + c.flow }),
            E('span', { txt: c.desc }),
            E('span', { cls: 'm', txt: (c.ptag ? 'P ' + c.ptag + ' (design ' + c.pop + ') · ' : 'P: atm ' + c.atm + ' kg/cm2 · ') + 'T ' + [c.ttag, c.ttag2].filter(Boolean).join(' / ') + ' (design ' + c.top + ' °C) · at ' + (+c.at).toFixed(4) + ' bt ' + (+c.bt).toFixed(4) }),
            E('button', { cls: 'b', txt: 'Find', on: () => find(c.flow) })
          ])
        );
      if (D) {
        box.append(E('div', { cls: 'libsec', txt: 'DRUM LEVEL CORRECTION (document-references/drum-level-calculation.xls) · ' + D.head }));
        const t = E('div', { cls: 'libdrum' });
        const keep = D.cols.map((c, i) => i).filter(i => i > 0 && (D.cols[i] || D.units[i]));
        t.append(E('div', { cls: 'dr h' }, keep.map(i => E('span', { txt: D.cols[i] + (D.units[i] ? ' [' + D.units[i] + ']' : '') }))));
        for (const r of D.rows) t.append(E('div', { cls: 'dr' }, keep.map(i => E('span', { txt: typeof r[i] === 'number' ? String(+r[i].toPrecision(6)) : String(r[i]) }))));
        box.append(t);
      }
      return;
    }
    const src = rows[tab],
      words = q
        .toUpperCase()
        .split(/\s+/)
        .filter(Boolean);
    let n = 0,
      shown = 0;
    const frag = document.createDocumentFragment();
    const tk = tab + '|' + stn + '|' + q;
    if (tog._k !== tk) tog = { _k: tk }; /* a new search / station / tab: the groups follow the default again */
    const ms = src.filter(r => (!stn || r.st === stn) && (tab !== 'all' || !con || r.cat === con) && (!words.length || words.every(w => r.h.includes(w)))),
      gc = {};
    const gv = {};
    for (const r of ms) {
      gc[r.gk] = (gc[r.gk] || 0) + 1;
      if (r.vac) gv[r.gk] = (gv[r.gk] || 0) + 1;
    }
    const ng = Object.keys(gc).length,
      isOpen = k => (tog[k] !== undefined ? tog[k] : words.length > 0 || ng === 1);
    let gk0 = null;
    for (const r of ms) {
      n++;
      if (r.gk !== undefined && r.gk !== gk0) {
        gk0 = r.gk;
        const k = r.gk,
          op = isOpen(k);
        frag.append(
          E('div', { cls: 'libg' + (op ? ' on' : ''), title: op ? 'Close this group' : 'Open this group', on: () => ((tog[k] = !op), render()) }, [
            E('b', { txt: (op ? '▾ ' : '▸ ') + r.gl }),
            E('span', { txt: gc[k] + (gc[k] === 1 ? ' row' : ' rows') + (gv[k] ? ' · ' + gv[k] + ' ' + VAC : '') })
          ])
        );
      }
      if (r.gk !== undefined && !isOpen(r.gk)) continue;
      shown++;
      if (shown > MAX) continue;
      const row = E('div', { cls: 'libr' + (r.vac ? ' vac' : '') + (r.cat ? ' pa' : '') }, [
        E('span', { cls: 'st', txt: r.s }),
        E('span', { cls: 'ad', title: 'Copy the address', txt: r.a }),
        E('span', { cls: 'tg', title: r.tag ? 'Copy the tag' : '', txt: r.tag }),
        E('span', { cls: 'ds', txt: r.vac ? '— ' + VAC + ' —' : r.d }),
        E('span', { cls: 'rx', txt: r.x }),
        E('span', { cls: 'ty', txt: r.t + (r.ab ? ' · ' + r.ab : '') }),
        E('button', { cls: 'b', txt: 'Find', title: 'Put it in the search bar and open the info card' })
      ]);
      const wd = r.w || WIX[r.st + '|' + r.a];
      if (wd) row.classList.add('hasw');
      /* 2.1.0: a click on the row opens the info card (I/O record, wiring flow chart, compensation, where it is used) */
      row.title = 'Click: info card' + (wd ? ' with the wiring' : '');
      row.addEventListener('click', e => {
        if (e.target.closest('.ad,.tg,button')) return;
        if (r.rel) {
          /* a relay item: its connection list in a popup card */
          if (window.lsRelayCard) window.lsRelayCard(r.rel);
          return;
        }
        try {
          if (r.mb) r.tag && window.lsInfo && window.lsInfo(r.tag, { look: 1 });
          else if (r.cat === 'ut') window.lsInfo && window.lsInfo(r.a, { stn: r.st, look: 1 });
          else if (r.lt) window.lsInfo && window.lsInfo(r.a, { look: 1 });
          else window.lsInfo && window.lsInfo(r.a, { stn: r.st, look: 1 });
        } catch (x) {}
      });
      row.children[1].onclick = () => copy(r.a);
      row.children[2].onclick = () => r.tag && copy(r.tag);
      row.children[6].onclick = () => find(r.mb ? r.tag || r.d : r.lt ? r.tag || r.a : r.a.length && /^[A-Z]{1,2}\.|^AI|^AO|^SI|^SO/.test(r.a) ? r.a : r.tag);
      frag.append(row);
    }
    box.append(frag);
    let other = '';
    if (!n && words.length && tab !== 'all') {
      const ot = tab === 'io' ? 'mem' : 'io',
        m = rows[ot].filter(r => (!stn || r.st === stn) && words.every(w => r.h.includes(w))).length;
      if (m) other = ' · ' + m + ' in the ' + (ot === 'io' ? 'I/O list' : 'Memory list') + ' tab';
    }
    cnt.textContent = n + (n === 1 ? ' row · ' : ' rows · ') + ng + (ng === 1 ? ' group' : ' groups') + (shown > MAX ? ' · ' + MAX + ' of ' + shown + ' shown (type more to narrow)' : '') + other;
  }
  /* the column heads follow the tab; the "Connected to" choice shows on ALL SIGNALS only */
  function head() {
    const h = $('libhd'),
      c = $('libcon');
    if (h) {
      h.innerHTML = '';
      (tab === 'all' ? ['Station', 'Address', 'Tag', 'Description', 'Path · remark · sheet', 'Type', ''] : ['Station', 'Address', 'Tag', 'Description', 'Range / remark', 'Type · SIG.AB', '']).forEach(t => h.append(E('span', { txt: t })));
    }
    if (c) c.style.display = tab === 'all' ? '' : 'none';
  }
  function fillCon() {
    const c = $('libcon');
    if (!c) return;
    const n = {};
    for (const r of rows.all) n[r.cat] = (n[r.cat] || 0) + 1;
    c.innerHTML = '';
    const o0 = E('option', { txt: 'Connected to: all (' + rows.all.length.toLocaleString('en-US') + ')' });
    o0.value = '';
    c.append(o0);
    for (const C of CAT)
      if (n[C[0]]) {
        const o = E('option', { txt: C[1] + ' (' + n[C[0]].toLocaleString('en-US') + ')', title: C[2] });
        o.value = C[0];
        c.append(o);
      }
    c.value = con;
  }
  function build() {
    ws = E('div', { id: 'libws' });
    const tabs = E('div', { cls: 'libtabs' }),
      mk = (k, t) =>
        E('button', {
          cls: 'b' + (tab === k ? ' on' : ''),
          'data-k': k,
          txt: t,
          on: () => {
            tab = k;
            tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
            head();
            render();
          }
        });
    tabs.append(mk('all', 'All signals'), mk('io', 'I/O list'), mk('mem', 'Memory list'), mk('wire', 'Wiring'), mk('relay', 'Relay / SER'), mk('calc', 'Calculations'));
    const ss = E('select', { cls: 'libst', 'aria-label': 'Station' });
    [['', 'All stations'], ['1', 'STN101'], ['2', 'STN102'], ['3', 'STN103'], ['4', 'STN104'], ['5', 'STN105']].forEach(([v, t]) => {
      const o = E('option', { txt: t });
      o.value = v;
      ss.append(o);
    });
    ss.onchange = () => {
      stn = ss.value;
      render();
    };
    const cs = E('select', { cls: 'libst libcon', id: 'libcon', 'aria-label': 'Connected to', title: 'Where the signal comes from or goes to' });
    cs.onchange = () => {
      con = cs.value;
      render();
    };
    const fi = E('input', { cls: 'libf', placeholder: 'Search address, tag or description (e.g. AI0129, FT-MS1031, steam flow)' });
    let tm = null;
    fi.oninput = () => {
      clearTimeout(tm);
      tm = setTimeout(() => {
        q = fi.value.trim();
        render();
      }, 150);
    };
    ws.append(
      E('div', { cls: 'libbar' }, [tabs, ss, cs, fi, E('span', { id: 'libcnt' })]),
      E('div', { cls: 'libhd', id: 'libhd' }),
      E('div', { id: 'libtb', tabindex: '0', 'aria-label': 'List' })
    );
    document.body.append(ws);
    head();
    load().then(() => {
      sortGroups();
      fillCon();
      render();
      loadTags();
    });
  }
  function place() {
    if (!ws) return;
    const top = $('gsbar') ? $('gsbar').getBoundingClientRect().bottom : 40,
      foot = $('sfoot') ? $('sfoot').getBoundingClientRect().height : 0;
    ws.style.top = top + 'px';
    ws.style.bottom = foot + 'px';
  }
  function open(on) {
    if (on && !ws) build();
    if (!ws) return;
    ws.style.display = on ? 'flex' : 'none';
    document.querySelectorAll('#gsbar .cat .libbtn').forEach(b => b.classList.toggle('on', !!on));
    if (on) {
      try {
        window.lsPlant && window.lsPlant(false);
      } catch (e) {}
      document.querySelectorAll('#gsbar .cat button:not(.libbtn)').forEach(b => b.classList.remove('on'));
      place();
    }
  }
  window.lsLibrary = open;
  addEventListener('resize', place);
  const iv = setInterval(() => {
    const cats = document.querySelectorAll('#gsbar .cat');
    if (!cats.length) return;
    cats.forEach(cat => {
      if (cat.querySelector('.libbtn')) return;
      const b = E('button', { cls: 'libbtn', txt: 'LIBRARY', title: 'I/O list and memory lists of the five stations: search, copy, find' });
      b.onclick = e => {
        e.stopPropagation();
        open(!(ws && ws.style.display === 'flex'));
      };
      cat.append(b);
      btn = b;
      cat.querySelectorAll('button:not(.libbtn)').forEach(x => x.addEventListener('click', () => open(false)));
    });
    clearInterval(iv);
  }, 450);
})();
