/* PLANT HMI WORKSPACE (2.1.0, draft): a third workspace next to ABC and DITL. Per system (left list) a plant graphic drawn
   after the control-room HMI snapshot (src/ui/plant/systems.js, scaled), with the snapshot text and values; the value list of
   that snapshot on the right (src/ui/plant/values.js). LIVE (2.1.0-beta.5): values, controllers and valves read the simulation
   (read only); what is not linked keeps the snapshot value, grey. UI only. */
(function () {
  /* 2.4.0-beta.5: the PLANT VIEW may live in its own window (PC): D is the document that holds it */
  let D = document;
  const $ = id => D.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
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
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  /* line colours by medium (plant HMI convention: steam red, water blue, air grey, flue gas brown, oil yellow) */
  const KC = {
    steam: '#e05555',
    water: '#3d9be0',
    cond: '#5cc8ff',
    air: '#9aa7b4',
    gas: '#c08a52',
    oil: '#d8b860',
    coal: '#8d7a66',
    ash: '#8a8f94',
    sig: '#6f8191'
  };
  const HDR = { MSP: 'ABC-001C|AI0131', MST: 'pv:TICMS1004', MSF: 'ABC-001C|SI0230', RHP: 'pv:PICHR1003', RHT: 'pv:TICHR1002', COAL: 'pv:FIC-CM', PWR: 'ABC-001C|AI0419' };
  const SYS = () => window.PLANT_SYS || [],
    VALS = () => window.PLANT_VALS || [];
  let ws = null,
    svg = null,
    cur = null,
    vb = null,
    btn = null;
  const list = () => {
    /* systems with a graphic first (in their order), then the snapshots that have values only */
    const out = SYS().map(s => ({ id: s.id, title: s.title, src: s.src, g: s }));
    for (const v of VALS())
      if (!out.some(o => o.src === v.src) && v.items.length && !/9999/.test(v.note || ''))
        out.push({ id: v.src, title: v.title, src: v.src, g: null });
    return out;
  };
  /* ---- LIVE LINK (2.1.0-beta.5): each value / controller / valve of the graphic is tied to the engine (read only):
     val   : TAG.PV wire of a sheet, else the I/O list transmitter of the indicator (TI -> TT / TE, PI -> PT, FIQ -> FT ...) = its AI block;
     ctl   : the faceplate of the controller (PV, SV, MV, A / M / R);
     valve : the valve tag written on the drawing next to a control valve (its position demand), else the AO address of the I/O list.
     Not linked = the snapshot value, shown grey. ---- */
  const N = t => String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let IX = null,
    liveOn = true,
    LV = [],
    tmr = null;
  const shOf = n => (window.AN && AN.sheets ? AN.sheets.find(s => s.name === n) : null);
  async function index() {
    if (IX) return IX;
    const A = window.AN;
    if (!A || !A.sheets) return null;
    /* 3.2.0-beta.1 (audit C2): the ABC sheets load in the background (loader.js loadData = AN.data). When the PLANT VIEW was
       opened before the ABC page the links were read from an empty sheet list (LIVE 6 / 51) and never read again: wait for it */
    for (let i = 0; i < 100 && !A.data && !A.sheets.length; i++) await new Promise(r => setTimeout(r, 100));
    try {
      if (A.data) await A.data;
    } catch (e) {}
    if (!A.sheets.length) return null;
    try {
      await A.ades();
    } catch (e) {}
    const pv = new Map(),
      ctl = new Map(),
      man = new Map(),
      vt = new Map(),
      lab = new Map(),
      ai = new Map();
    for (const sh of A.sheets) {
      if (/ABC-000/.test(sh.name)) continue;
      let S;
      try {
        S = A.ensure(sh);
      } catch (e) {
        continue;
      }
      if (!S) continue;
      try {
        A.adesFind(sh, 'AI0001'); /* sets sh.stn */
      } catch (e) {}
      S.lab.forEach((l, n) => {
        const t = l && l.t ? l.t.trim() : '';
        if (!t) return;
        if (/\.PV$/.test(t) && !pv.has(N(t.slice(0, -3)))) pv.set(N(t.slice(0, -3)), { sh: sh.name, n });
        if ((/^(AI|AO)\d{4}$/.test(t) || /^[IOMB]\.[0-9A-F]{4}$/.test(t)) && !lab.has(sh.stn + '|' + t)) lab.set(sh.stn + '|' + t, { sh: sh.name, n });
      });
      try {
        for (const c of A.hmiCtrls(S) || []) if (!ctl.has(c.tag)) ctl.set(c.tag, { sh: sh.name, c });
      } catch (e) {}
      /* 2.2.0-beta.19: the MAN stations too (ABC-001C HIC-BM / EIC-TM, ABC-001A HIC-ULD): the faceplate of the loader, so the
         033 CCS and UNIT screens follow the simulation. Before, only PID faceplates were linked and these three stayed grey */
      for (const b of S.blk)
        if (b.k === 'MAN' && b.o && b.o[0] != null) {
          const t = b.tag || (b.txt || []).find(x => x && x !== 'MAN' && !/^S\d-MDL/.test(x));
          if (t && !ctl.has(t) && !man.has(t)) man.set(t, { sh: sh.name, b });
        }
      /* valve tag text next to a control valve symbol */
      for (const b of S.blk)
        if (b.k === 'VLV' && b.pins && b.pins.length) {
          let best = null,
            bd = 60;
          for (const t of S.tx || []) {
            /* 2.2.0-beta.7: a note in brackets after the tag is not part of it (ABC-030 "PCV-AS1020-1 ( NORMAL )", "PCV-AS1020-2 ( START-UP )") */
            const x = t.t.trim().replace(/\s*\([^)]*\)\s*$/, '');
            if (!/^[A-Z]{2,4}-[A-Z]{2}\d{4}(-[A-Z0-9]{1,3})?$/.test(x) || !/V|D/.test(x.split('-')[0])) continue;
            const d = Math.hypot(t.x - b.cx, t.y - b.cy);
            if (d < bd) {
              bd = d;
              best = x;
            }
          }
          /* 2.2.0-beta.7: a valve whose command is 100 - MV on the drawing (ABC-029 FCV-DO1012: AO = CONST 100 - HICDO1012.MV, I/P,
             reverse acting): the screen shows the opening (6.PNG FCVDO1012 100.1 % with the station at 100 %), so the link shows 100 - signal */
          let inv = 0;
          try {
            const up = n => (S.drv[n] || []).find(d => d.k !== 'LINK');
            let d = up(b.pins[0].n);
            for (let k = 0; k < 3 && d && (d.k === 'IP' || d.k === 'AO'); k++) d = up(d.i[0]);
            if (d && d.k === 'SUB' && d.i.length === 2) {
              const c = up(d.i[0]);
              if (c && c.k === 'CONST' && Math.abs(S.rt.v[d.i[0]] - 100) < 1e-6) inv = 1;
            }
          } catch (e) {}
          if (best && !vt.has(N(best))) vt.set(N(best), { sh: sh.name, n: b.pins[0].n, inv });
        }
    }
    try {
      for (const [k, L] of A.plAIs()) if (L && L.length) ai.set(N(k), { sh: L[0].sh.name, n: L[0].n });
    } catch (e) {}
    const io = new Map(),
      run = new Map();
    try {
      const D = await A.ades();
      for (const st in D)
        for (const a in D[st]) {
          const r = D[st][a];
          if (r && r.tag && (/^A[IO]\d{4}$/.test(a) || /^[IO]\.[0-9A-F]{4}$/.test(a))) {
            const k = N(r.tag);
            if (!io.has(k)) io.set(k, { st: +st, a });
          }
          /* memory list: "A-BFWP RUNNING (BC FROM S3)" = the run state that the ABC sheets use (M.3343) */
          const m = r && r.k !== 'io' && /^([A-Z0-9 \-\/]+?)\s+RUNNING\b/.exec(String(r.d || '').toUpperCase());
          if (m && /^M\./.test(a)) {
            const k = N(m[1]);
            if (!run.has(k)) run.set(k, []);
            /* the equipment bit itself first ("(BC FROM S3)", remark "STATION WIRING"), not a pulse or a timer made from it (M.020E) */
            run.get(k).push({ st: +st, a, p: /BC FROM|STATION WIRING/i.test(String(r.d || '') + ' ' + String(r.r || '')) ? 0 : 1 });
            run.get(k).sort((x, y) => x.p - y.p);
          }
        }
    } catch (e) {}
    IX = { pv, ctl, man, vt, lab, ai, io, run };
    return IX;
  }
  /* the transmitter tag of an indicator tag: TIBR11302 -> TTBR11302 / TEBR11302; FIQMS1031 -> FTMS1031 */
  const tx = k => {
    const m = /^(D?P|T|F|L|A|S|E|Z|W|H|J|I)I(?:Q|C)?(.*)$/.exec(k), /* R9 #60: IIF1056 -> ITF1056 (IT-F1056, AI0453 IDF current) */
      /* 3.2.0 (HMI 007, 2026-10-27): an area code that starts with C (PICR1006 = PT-CR1006, TICD1101) is not the C of a
         controller: also try with the C kept (before, PICR1006 found nothing) */
      n = /^(D?P|T|F|L|A|S|E|Z|W|H|J)I(C.*)$/.exec(k);
    return (m ? [m[1] + 'T' + m[2], m[1] + 'E' + m[2]] : []).concat(n ? [n[1] + 'T' + n[2], n[1] + 'E' + n[2]] : []);
  };
  /* 2.2.0-beta.19: a reference written on the item (systems.js `ref`): 'SHEET|LABEL' = the net of that sheet with that label
     (AI0419, SI0230, M.201F, I.0082) or that name ('MAN HIC-BM out'); 'pv:TAG' / 'mv:TAG' = the PV / MV of a faceplate (PID or MAN).
     For the values and flags that the HMI draws without a tag (033 CCS OPERATION, the header bar) */
  function byRef(ref) {
    if (!ref || !IX) return null;
    /* R9 #60: 'unit:Tb' = a state of the unit model (the furnace temperature averages of 007 = the bed temperature of the model) */
    /* R9 #87: 'ditl:SHEET' = the run state of the motor drawing of that DITL sheet (DITL-43 air preheater: its inverter panel, no
       memory bit or running DI in the lists) */
    if (/^ditl:DITL-\w+$/.test(ref)) return { k: 'ditl', d: ref.slice(5), how: 'run state of ' + ref.slice(5) };
    if (/^unit:\w+$/.test(ref)) return { k: 'unit', f: ref.slice(5), how: 'plant model (unit.js ' + ref.slice(5) + ')' };
    let m = /^(pv|mv|sv):(.+)$/.exec(ref);
    if (m) {
      const c = IX.ctl.get(m[2]),
        b = IX.man.get(m[2]);
      /* R9 #60: 'sv:TAG' = the set value of a controller (the R-SV of the SAF / PAF flow and of the O2 control on 007) */
      if (c && m[1] === 'sv') return c.c.q && c.c.q.sv != null ? { k: 'net', how: 'SV of ' + m[2], sh: c.sh, n: c.c.q.sv } : null;
      if (c) return { k: 'net', how: m[1].toUpperCase() + ' of ' + m[2], sh: c.sh, n: m[1] === 'pv' ? c.c.q.pv : c.c.out };
      if (m[1] === 'sv') return null;
      if (b) {
        const S = shOf(b.sh).S,
          pvn = IX.pv.get(N(m[2]));
        return m[1] === 'mv' ? { k: 'net', how: 'MV of ' + m[2], sh: b.sh, n: b.b.o[0] } : pvn ? { k: 'net', how: 'PV of ' + m[2], sh: pvn.sh, n: pvn.n } : b.b.svI >= 0 && S ? { k: 'net', how: 'set input of ' + m[2], sh: b.sh, n: b.b.i[b.b.svI] } : null;
      }
      return null;
    }
    m = /^([A-Z]+-[0-9A-Z]+)\|(.+)$/.exec(ref);
    if (!m) return null;
    const sh = shOf(m[1]),
      S = sh && sh.S;
    if (!S) return null;
    const want = m[2].trim();
    let n = S.lab.findIndex(x => x && String(x.t).trim() === want);
    if (n < 0) for (let i = 0; i < S.rt.v.length; i++) if (((window.AN && AN.nm && AN.nm(S, i)) || '').trim() === want) { n = i; break; }
    return n < 0 ? null : { k: 'net', how: want + ' ' + m[1], sh: m[1], n, a: /^[IOMB]\.[0-9A-F]{4}$|^A[IO]\d{4}$/.test(want) ? want : null, st: sh.stn };
  }
  function resolve(it) {
    if (!IX) return null;
    if (it.t === 'flag') {
      /* a mode lamp of the HMI: ☑ (red) when the signal is 1, ☒ (green) when 0; `nor` = lit when every signal is 0 (BASE mode =
         neither CCS nor BOILER FOLLOW) */
      const L = (it.refs || [it.ref]).map(byRef);
      if (L.some(x => !x)) return null;
      return { k: 'flag', op: it.op || 'or', L, how: (it.refs || [it.ref]).join(' ') };
    }
    if (it.ref) {
      const r = byRef(it.ref);
      if (r) return r;
    }
    if (!it.tag) return null;
    const k = N(String(it.tag).split('/')[0]);
    if (it.t === 'ctl') {
      const c = IX.ctl.get(it.tag);
      if (c) return { k: 'ctl', sh: c.sh, c: c.c };
      const b = IX.man.get(it.tag);
      return b ? { k: 'man', sh: b.sh, b: b.b, how: 'MAN station', pv: IX.pv.get(k) || null } : null;
    }
    if (it.t === 'val') {
      /* R9 #60: "TIFA1086/7 AVERAGE" = the average of the two transmitters (TIFA1086, TIFA1087), each linked as a value */
      if (/AVERAGE/i.test(it.v || '')) {
        const mm = /^([A-Z]+?)(\d+)\/(\d+)$/.exec(String(it.tag)),
          L2 = mm ? [mm[1] + mm[2], mm[1] + mm[2].slice(0, mm[2].length - mm[3].length) + mm[3]].map(x => resolve({ t: 'val', tag: x })) : [];
        return L2.length === 2 && L2.every(x => x && x.k === 'net') ? { k: 'avg', L: L2, how: 'average of ' + it.tag } : null;
      }
      /* 2.2.0-beta.14: a state of the unit model that has no DCS transmitter (bed temperature, water temperature, oil of the burners) */
      if (/^UNIT\./.test(String(it.tag))) return { k: 'unit', f: String(it.tag).slice(5), how: 'plant model (unit.js)' };
      if (IX.pv.has(k)) return Object.assign({ k: 'net', how: it.tag + '.PV' }, IX.pv.get(k));
      for (const c of [k].concat(tx(k))) {
        if (IX.ai.has(c)) return Object.assign({ k: 'net', how: 'AI of ' + c }, IX.ai.get(c));
        const r = IX.io.get(c);
        if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'net', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      }
      return null;
    }
    if (it.t === 'pump' || it.t === 'fan' || it.t === 'motor') {
      /* the run state: the memory bit the ABC sheets use (memory list "... RUNNING"), else the running DI of the I/O list (MIR-P1115A) */
      const words = String(it.tag).toUpperCase().split(/\s+/).filter(w => !/^[PF]-?\d{4}/.test(w)),
        full = words.join(' '),
        sw = /^(.+)-([A-Z])$/.exec(full),
        cands = [N(full)].concat(sw ? [N(sw[2] + '-' + sw[1])] : []);
      for (const c of cands)
        for (const x of IX.run.get(c) || []) if (IX.lab.has(x.st + '|' + x.a)) return Object.assign({ k: 'dig', how: x.a + ' STN10' + x.st, a: x.a, st: x.st }, IX.lab.get(x.st + '|' + x.a));
      const eq = /([PF])-?(\d{4}[A-Z]?\d?)/.exec(String(it.tag).toUpperCase());
      const r = eq && IX.io.get('MIR' + eq[1] + eq[2]);
      if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'dig', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      return null;
    }
    if (it.t === 'mov') {
      /* open / close limit switches of the I/O list: ZSO-BR1391 / ZSC-BR1391 for MVBR1391 */
      const rest = k.slice(2);
      for (const [pre, open] of [['ZSO', 1], ['ZSC', 0]]) {
        const r = IX.io.get(pre + rest);
        if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'dig', open, how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
      }
      return null;
    }
    if (it.t === 'valve' || it.t === 'damper') {
      /* 2.1.0-beta.10: the controller of the valve (HMI snapshot mapping): used when the drawing has no valve for the tag (its MV),
         and to read a fail-open valve right: its signal on the drawing is 100 - MV, the HMI shows the opening = MV */
      const vc = (window.PLANT_VALVE_CTL || {})[k],
        cc = vc && IX.ctl.get(vc);
      if (IX.vt.has(k)) return Object.assign({ k: 'net', how: 'valve on the drawing', cc }, IX.vt.get(k));
      if (cc) return { k: 'mv', sh: cc.sh, c: cc.c, how: 'MV of ' + vc };
      const r = IX.io.get(k);
      if (r && IX.lab.has(r.st + '|' + r.a)) return Object.assign({ k: 'net', how: r.a + ' STN10' + r.st, a: r.a, st: r.st }, IX.lab.get(r.st + '|' + r.a));
    }
    return null;
  }
  const fmtV = (x, ref) => {
    if (x == null || !isFinite(x)) return '—';
    const d = String(ref || '').split('.')[1];
    const n = d ? Math.min(3, d.length) : Math.abs(x) >= 100 ? 0 : 1;
    return x.toFixed(n).replace(/^-(0(?:\.0+)?)$/, '$1'); /* not -0.0 */
  };
  function netVal(r) {
    const sh = shOf(r.sh);
    return sh && sh.S && sh.S.rt ? (r.inv ? 100 - sh.S.rt.v[r.n] : sh.S.rt.v[r.n]) : null;
  }
  let noLink = false;
  const snap = v => (noLink ? '—' : v);
  function liveTick() {
    if (!ws || ws.style.display !== 'grid') return;
    for (const o of LV) {
      const r = o.r;
      try {
        if (!liveOn || !r) {
          /* retest #60 (R7: "LIVE · 49 / 121 linked", the other 72 numbers were the 150 MW snapshot on a cold plant): in LIVE an item
             with no link to the model shows "—" (a symbol grey), not a number that looks real */
          noLink = !!liveOn;
          o.set(null);
          noLink = false;
          continue;
        }
        if (r.k === 'ctl') {
          const sh = shOf(r.sh),
            S = sh && sh.S,
            c = r.c,
            v = S.rt.v;
          const pk = c.amt && S.rt.st[c.amt.id] ? S.rt.st[c.amt.id].pk : c.autoLeg;
          const auto = !c.amt || pk === c.autoLeg,
            rem = !!(c.remote && c.svSw && S.rt.st[c.svSw.id] && S.rt.st[c.svSw.id].pk === 'A');
          o.set({ pv: v[c.q.pv], sv: v[c.q.sv], mv: v[c.out], m: !auto ? 'M' : rem ? 'R' : 'A' });
        } else if (r.k === 'man') {
          /* MAN station (plant.js MAN): MV = its output; SV = its set input (the AUTO demand, leg A of the A / M switch on that
             input); PV = the TAG.PV wire when the drawing has one (EIC-TM.PV = MW actual), else the set input; A when that switch
             is on leg A (the station follows its input), else M (operator or BU-CMD, CLAUDE.md 10) */
          const S = shOf(r.sh).S,
            b = r.b,
            v = S.rt.v,
            si = b.svI >= 0 ? b.i[b.svI] : null,
            dr = si != null ? (S.drv[si] || []).find(x => x.k === 'AMT') : null,
            auto = !!(dr && S.rt.st[dr.id] && S.rt.st[dr.id].pk === 'A'),
            pv = r.pv ? shOf(r.pv.sh).S.rt.v[r.pv.n] : si != null ? v[si] : NaN;
          o.set({ pv, sv: si != null ? v[si] : NaN, mv: v[b.o[0]], m: auto ? 'A' : 'M' });
        } else if (r.k === 'flag') {
          const bits = r.L.map(x => netVal(x) > 0.5);
          o.set({ v: r.op === 'nor' ? (bits.every(b => !b) ? 1 : 0) : r.op === 'and' ? (bits.every(b => b) ? 1 : 0) : bits.some(b => b) ? 1 : 0, r });
        } else if (r.k === 'ditl') {
          const ds = window.LS_DOCK && LS_DOCK.dOf ? LS_DOCK.dOf(r.d) : null,
            m = ds && window.lsAlarms ? lsAlarms.motState(ds) : null;
          o.set(m ? { v: m === 'RUN' ? 1 : 0, r, tr: m === 'TRIP' || (m !== 'RUN' && !!(lsAlarms.ntTrip && lsAlarms.ntTrip(ds))) } : null);
        } else if (r.k === 'unit') {
          const U = window.AN && AN.unit;
          o.set(U && U.on && isFinite(U[r.f]) ? { v: +U[r.f], r } : null);
        } else if (r.k === 'avg') {
          const xs = r.L.map(netVal).filter(x => x != null && isFinite(x));
          o.set(xs.length ? { v: xs.reduce((a, b) => a + b, 0) / xs.length, r } : null);
        } else if (r.k === 'mv') {
          const S = shOf(r.sh).S;
          o.set({ v: S.rt.v[r.c.out], r });
        } else if (r.cc) {
          let x = netVal(r);
          const mv = shOf(r.cc.sh).S.rt.v[r.cc.c.out];
          if (isFinite(x) && isFinite(mv) && Math.abs(x - (100 - mv)) < 0.5 && Math.abs(x - mv) > 1) x = 100 - x; /* fail-open valve */
          o.set({ v: x, r });
        } else {
          /* 3.2.0 retest #34: a pump / fan / motor whose drawing is in TRIP (its "... TRIP · CRT (ANN)" output) flashes */
          const mt = r.a && /^(pump|fan|motor)$/.test(o.it.t) && window.lsAlarms ? lsAlarms.motOf(r.a) : null;
          o.set({ v: netVal(r), r, tr: mt === 'TRIP' });
        }
      } catch (e) {}
    }
  }
  const lvOf = it => {
    const o = LV.find(q => q.it === it);
    return o ? o.r : null;
  };
  function liveCount() {
    const n = LV.filter(o => o.r).length;
    const el = $('pllive');
    if (el) {
      el.textContent = liveOn
        ? 'LIVE · ' + n + ' / ' + LV.length + ' linked' + (n < LV.length ? ' · — = no model' : '')
        : 'SNAPSHOT';
      el.title = liveOn
        ? n +
          ' values read the simulation; ' +
          (LV.length - n) +
          ' have no link to the plant model or the logic yet and show "—" (grey symbol)'
        : '';
      el.classList.toggle('on', liveOn);
      /* retest #60: in LIVE the HMI picture itself (its numbers and symbols are the 150 MW snapshot) is grey; only what reads the
         simulation is drawn over it in colour */
      if (svg)
        svg.querySelectorAll('.plbgimg').forEach(x => (x.style.filter = liveOn ? 'grayscale(1) brightness(0.62)' : ''));
    }
  }
  function valve(g, it, c) {
    const x = it.x,
      y = it.y,
      s = 9,
      p = it.r === 90 ? `${x - s},${y - s} ${x + s},${y - s} ${x - s},${y + s} ${x + s},${y + s}` : `${x - s},${y - s} ${x - s},${y + s} ${x + s},${y - s} ${x + s},${y + s}`;
    g.append(S_('polygon', { points: p, fill: c, stroke: '#0b0f13', 'stroke-width': 1 }));
    g.append(S_('line', { x1: x, y1: y, x2: x, y2: y - 14, stroke: c, 'stroke-width': 2 }));
    g.append(S_('rect', { x: x - 6, y: y - 20, width: 12, height: 7, fill: c }));
  }
  let itIx = -1; /* index of the item being drawn (data-it on its texts: the overlap check of the tests tells items apart) */
  function txt(g, x, y, s, o) {
    o = o || {};
    const t = S_('text', {
      'data-it': itIx,
      x,
      y,
      fill: o.c || '#d3dce5',
      /* 2.2.0-beta.19: +2 px on every screen. 2.4.1-beta.1: +3 px (UI audit 2026-10-19: the HMI snapshot text is ~16 px at
         1920 wide, the graphic is drawn at that width); the header bar and the controller box keep their own size (o.k) */
      'font-size': (o.z || 13) + (o.k != null ? o.k : 3),
      'font-family': o.mono ? 'var(--mf, monospace)' : 'var(--uf, sans-serif)',
      'font-weight': o.b ? 600 : 400,
      'text-anchor': o.a || 'start'
    });
    t.textContent = s;
    g.append(t);
    return t;
  }
  /* ---- 2.5.0-beta.15: the 1:1 HMI picture (src/ui/plant/hmibg.js, made by tools/data/hmibg.py from the snapshot) ----
     A LIVE number is drawn over the snapshot number (a box of the background colour + the number, right aligned like the
     HMI field, same height and pitch); a symbol (valve, damper, pump, fan, motor, lamp, check box) gets its live colour through
     the mask of its own pixels. Not linked = nothing drawn: the picture shows the snapshot. */
  let defs = null,
    box0 = [0, 0, 1920, 1000];
  const HC = { red: '#ff2a2a', green: '#1ee01e', white: '#f2f2f2', off: '#3a3a3a' };
  function bgNum(g, sp, ref) {
    const b = sp.b,
      h = Math.max(8, sp.h),
      fz = h / 0.72,
      n = Math.max(1, String(ref != null ? ref : '').trim().length),
      pitch = Math.min(h * 0.75, Math.max(h * 0.45, (b[2] - 4) / n)),
      bold = sp.fr >= 0.36,
      sx = pitch / ((bold ? 0.556 : 0.6) * fz);
    const r = S_('rect', { x: b[0], y: b[1], width: b[2], height: b[3], fill: sp.bg, visibility: 'hidden' }),
      gg = S_('g', { transform: `translate(${b[0] + b[2] - 2},${b[1] + b[3] - 2}) scale(${sx.toFixed(3)},1)`, visibility: 'hidden' }),
      t = S_('text', { 'data-it': itIx, x: 0, y: 0, 'text-anchor': 'end', 'font-size': fz.toFixed(1), 'font-family': bold ? 'Arial, Helvetica, sans-serif' : 'var(--mf, monospace)', 'font-weight': bold ? 700 : 400, fill: sp.c || '#00ffff' });
    gg.append(t);
    g.append(r, gg);
    const f = s => {
      if (s == null && noLink) s = '—';
      if (s == null) {
        r.setAttribute('visibility', 'hidden');
        gg.setAttribute('visibility', 'hidden');
        return;
      }
      t.textContent = s;
      /* a live number longer than the snapshot one: the box grows to the left so no old digit shows */
      const need = s.length * pitch + 4;
      r.setAttribute('x', need > b[2] ? b[0] + b[2] - need : b[0]);
      r.setAttribute('width', Math.max(b[2], need));
      r.setAttribute('visibility', 'visible');
      gg.setAttribute('visibility', 'visible');
    };
    f.t = t;
    return f;
  }
  function bgSym(g, sp, id) {
    const b = sp.b,
      mk = S_('mask', { id, maskUnits: 'userSpaceOnUse', x: b[0], y: b[1], width: b[2], height: b[3] });
    mk.append(S_('image', { href: sp.m, x: b[0], y: b[1], width: b[2], height: b[3], preserveAspectRatio: 'none', 'image-rendering': 'pixelated' }));
    defs.append(mk);
    const r = S_('rect', { x: b[0], y: b[1], width: b[2], height: b[3], fill: HC.red, mask: `url(#${id})`, visibility: 'hidden' });
    g.append(r);
    return c => {
      if (!c && noLink) c = '#5b6570';
      if (!c) return r.setAttribute('visibility', 'hidden');
      r.setAttribute('fill', c);
      r.setAttribute('visibility', 'visible');
    };
  }
  /* an invisible click area over the item (faceplate / info card, like the drawn screens) */
  function bgHit(g, it, b) {
    const r = S_('rect', { x: b[0], y: b[1], width: b[2], height: b[3], fill: '#000', 'fill-opacity': 0, 'data-tag': it.tag || it.s || '', 'data-it': itIx });
    g.append(r);
    return r;
  }
  const hull = L => {
    const B = L.filter(Boolean);
    if (!B.length) return null;
    const x0 = Math.min(...B.map(b => b[0])),
      y0 = Math.min(...B.map(b => b[1]));
    return [x0, y0, Math.max(...B.map(b => b[0] + b[2])) - x0, Math.max(...B.map(b => b[1] + b[3])) - y0];
  };
  /* the HMI field shows the decimals of its snapshot number (TIFA1082 "31", O2 BIAS "0.00") */
  const fmtH = (x, ref) => {
    if (x == null || !isFinite(x)) return '—';
    const d = String(ref == null ? '' : ref).trim().split('.')[1];
    return ref == null || String(ref).trim() === '' ? fmtV(x, ref) : x.toFixed(d ? Math.min(3, d.length) : 0).replace(/^-(0(?:\.0+)?)$/, '$1');
  };
  function bgItem(g, it, sp, sid) {
    const t = it.t;
    if (!/^(val|ctl|valve|damper|mov|pump|fan|motor|lamp|flag|header)$/.test(t)) return; /* the picture has it */
    const id = 'plm' + String(sid).replace(/\W/g, '') + '_' + itIx;
    if (t === 'header') {
      if (!sp) return;
      (it.items || []).forEach(([k, v], i) => {
        const nb = sp.n[i];
        if (!nb || !HDR[k]) return;
        const f = bgNum(g, nb, v);
        reg({ t: 'val', tag: k, ref: HDR[k], v }, y => f(y ? fmtH(y.v, v) : null), null);
      });
      return;
    }
    if (!sp) {
      /* not found on the picture: still linked (value list, tests), click area at its place */
      reg(it, () => {}, it.x != null ? bgHit(g, it, [it.x - 6, it.y - 16, 70, 22]) : null);
      return;
    }
    if (t === 'val') {
      const f = bgNum(g, sp, it.v);
      reg(it, x => f(x ? fmtH(x.v, it.v) : null), bgHit(g, it, sp.b));
    } else if (t === 'ctl') {
      const fp = sp.pv ? bgNum(g, sp.pv, it.pv) : () => {},
        fs = sp.sv ? bgNum(g, sp.sv, it.sv) : () => {},
        fm = sp.mv ? bgNum(g, sp.mv, it.mv) : () => {};
      /* 033 CCS: the A / M / R buttons of the faceplate light with the live mode (lit = yellow, like the HMI) */
      const am = [];
      for (const L in sp.am || {}) {
        const b = sp.am[L],
          gb = S_('g', { visibility: 'hidden' }),
          r = S_('rect', { x: b[0], y: b[1], width: b[2], height: b[3], rx: 1 }),
          tl = S_('text', { x: b[0] + b[2] / 2, y: b[1] + b[3] - 4, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, 'font-family': 'Arial, Helvetica, sans-serif', fill: '#050000' });
        tl.textContent = L;
        gb.append(r, tl);
        g.append(gb);
        am.push([L, gb, r]);
      }
      if (am.length && !defs.querySelector('#plgl')) {
        const gr = (id, a, b) => {
          const lg = S_('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
          lg.append(S_('stop', { offset: 0, 'stop-color': a }), S_('stop', { offset: 1, 'stop-color': b }));
          defs.append(lg);
        };
        gr('plgl', '#fff200', '#d8c800');
        gr('plgr', '#e9b950', '#f09000');
        gr('plgu', '#fafafa', '#9c9c9c');
      }
      /* 033 CCS: the PV (cyan) and SV (yellow) bars of the faceplate, 0 .. the scale top printed on it */
      const bars = [];
      for (const k of ['bpv', 'bsv'])
        if (sp[k]) {
          const B = sp[k],
            gb = S_('g', { visibility: 'hidden' }),
            bar = S_('rect', { x: B.b[0], width: B.b[2], fill: B.c });
          gb.append(S_('rect', { x: B.b[0], y: B.b[1], width: B.b[2], height: B.b[3], fill: B.bg }), bar);
          g.append(gb);
          bars.push([k === 'bpv' ? 'pv' : 'sv', B, gb, bar]);
        }
      const fml = sp.ml ? bgNum(g, sp.ml, 'A') : null;
      reg(it, x => {
        if (fml) {
          fml(x ? x.m : null);
          if (x) fml.t.setAttribute('fill', x.m === 'M' ? '#ffd200' : '#00ffff'); /* HMI: A / R cyan, M yellow */
        }
        for (const [k, B, gb, bar] of bars) {
          gb.setAttribute('visibility', x && isFinite(x[k]) ? 'visible' : 'hidden');
          if (x && isFinite(x[k])) {
            const hh = Math.max(0, Math.min(1, x[k] / B.max)) * B.b[3];
            bar.setAttribute('y', B.b[1] + B.b[3] - hh);
            bar.setAttribute('height', hh);
          }
        }
        for (const [L, gb, r] of am) {
          gb.setAttribute('visibility', x ? 'visible' : 'hidden');
          if (x) r.setAttribute('fill', x.m === L ? (L === 'R' ? 'url(#plgr)' : 'url(#plgl)') : 'url(#plgu)');
        }
        fp(x ? fmtH(x.pv, it.pv) : null);
        fs(x ? fmtH(x.sv, it.sv) : null);
        fm(x ? fmtH(x.mv, it.mv) : null);
      }, bgHit(g, it, hull([sp.b, sp.pv && sp.pv.b, sp.sv && sp.sv.b, sp.mv && sp.mv.b])));
    } else {
      const fs = sp.sym ? bgSym(g, sp.sym, id) : () => {},
        fn = sp.n ? bgNum(g, sp.n, it.v) : () => {};
      reg(it, x => {
        if (!x || x.v == null || !isFinite(x.v)) {
          fs(null);
          fn(null);
          return;
        }
        let c = null;
        if (t === 'valve' || t === 'damper') c = x.v < 3 ? HC.green : x.v > 97 ? HC.red : HC.white; /* HMI: closed green, open red, between white */
        else if (t === 'mov') c = (x.r && x.r.open === 0 ? x.v < 0.5 : x.v > 0.5) ? HC.red : HC.green;
        else if (t === 'lamp') {
          const on = x.v > (it.gt != null ? it.gt : 0.5);
          c = (it.inv ? !on : on) ? (/^#[0-7][89a-f]/i.test(it.lit || '') ? HC.green : HC.red) : '#050505'; /* lit = the HMI green / red, off = black */
        } else c = x.tr ? (Math.floor(Date.now() / 1000) % 2 ? '#f59e0b' : HC.red) : x.v > 0.5 ? HC.red : HC.green; /* pump / fan / motor run = red; flag 1 = red check; TRIP flashes amber (retest #34) */
        fs(c);
        if (t === 'valve' || t === 'damper') fn(fmtH(x.v, it.v));
      }, bgHit(g, it, hull([sp.sym && sp.sym.b, sp.n && sp.n.b]) || [it.x - 12, it.y - 12, 24, 24]));
    }
  }
  function draw(sys) {
    svg.innerHTML = '';
    LV = [];
    itIx = -1;
    const g = S_('g', {});
    svg.append(g);
    const w = sys.w || 1920,
      h = sys.h || 1000;
    g.append(S_('rect', { x: 0, y: 0, width: w, height: h, fill: '#06090c' }));
    /* 2.5.0-beta.15 (user 2026-10-20: "kopyahin mo ang reference 1:1 ... pati lines, dashed lines"): a screen with its HMI
       snapshot in hmibg.js IS that picture; only what moves is drawn on it (bgItem) */
    const BG = (window.PLANT_BG || {})[sys.id],
      bg = BG && BG.n === (sys.items || []).length ? BG : null;
    if (bg) {
      g.append(
        S_('image', {
          class: 'plbgimg',
          href: bg.img,
          x: bg.x,
          y: bg.y,
          width: bg.w,
          height: bg.h,
          preserveAspectRatio: 'none'
        })
      );
      g.append((defs = S_('defs', {})));
    }
    /* HMI sample (2026-10-26): a screen of the NEW HMI (hmi2.js, own vector graphics) draws itself with the same live link and faceplate */
    if (sys.v2 && window.PLANT_V2)
      try {
        PLANT_V2.draw(g, sys, { reg, fp: fpOpen, HDR, go: id => { const o = list().find(x => x.id === id); if (o) select(o); } });
      } catch (e) {
        console.error(e);
      }
    for (const it of sys.v2 ? [] : sys.items || []) {
      itIx++;
      try {
        if (bg) {
          bgItem(g, it, bg.o[itIx], sys.id);
          continue;
        }
        if (it.t === 'duct') {
          /* 2.2.0-beta.19: a filled duct / vessel body like the HMI (yellow flue gas duct, green air duct, tan furnace): polygon
             with the colour of its kind (k) or its own colour (c), translucent fill */
          const c = it.c || KC[it.k] || KC.sig;
          g.append(S_('polygon', { points: it.p.map(q => q.join(',')).join(' '), fill: c, 'fill-opacity': it.o != null ? it.o : 0.3, stroke: c, 'stroke-width': 2 }));
        } else if (it.t === 'line') {
          const c = it.c || KC[it.k] || KC.sig; /* beta.19: c = own colour (yellow seal pot loop) */
          g.append(S_('polyline', { points: it.p.map(q => q.join(',')).join(' '), fill: 'none', stroke: c, 'stroke-width': it.k === 'sig' ? 1 : it.w || 3 /* beta.19: 3 px pipes (2.5), w: for a thicker duct */, 'stroke-dasharray': it.k === 'sig' ? '4 3' : '' }));
          if (it.a && it.p.length > 1) {
            const [a, b] = [it.p[it.p.length - 2], it.p[it.p.length - 1]],
              an = Math.atan2(b[1] - a[1], b[0] - a[0]),
              L = 10;
            g.append(
              S_('polygon', {
                points: `${b[0]},${b[1]} ${b[0] - L * Math.cos(an - 0.45)},${b[1] - L * Math.sin(an - 0.45)} ${b[0] - L * Math.cos(an + 0.45)},${b[1] - L * Math.sin(an + 0.45)}`,
                fill: c
              })
            );
          }
        } else if (it.t === 'valve' || it.t === 'damper') {
          const open = parseFloat(it.v) > 1;
          valve(g, it, open ? '#e05555' : '#3fbf6a');
          txt(g, it.x + 14, it.y - 10, it.tag || '', { z: 12, b: 1 });
          const vt = txt(g, it.x + 14, it.y + 6, (it.v != null ? it.v : '—') + ' ' + (it.u || '%'), { z: 13, mono: 1, c: '#5cd6ff' });
          if (it.m) txt(g, it.x - 14, it.y + 6, it.m, { z: 11, c: it.m === 'M' ? '#ffd27a' : '#9ff0c4', a: 'end', b: 1 }); /* beta.19: on the value line, clear of the tag of the damper beside it (008) */
          reg(it, x => {
            vt.textContent = x
              ? fmtV(x.v, it.v) + ' ' + (it.u || '%')
              : snap(it.v != null ? it.v : '—') + ' ' + (it.u || '%');
            vt.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
          });
        } else if (it.t === 'mov') {
          valve(g, it, it.st === 'open' ? '#e05555' : '#3fbf6a');
          {
            const parts = [...g.childNodes].slice(-3);
            reg(it, x => {
              const on = x && x.v != null ? (x.r && x.r.open === 0 ? x.v < 0.5 : x.v > 0.5) : it.st === 'open';
              const c = on ? '#e05555' : '#3fbf6a';
              for (const e of parts) e.setAttribute(e.tagName === 'line' ? 'stroke' : 'fill', c);
            }, parts[0]);
          }
          if (it.tag) txt(g, it.x + 14, it.y - 10, it.tag, { z: 11 });
          if (it.v != null) txt(g, it.x + 14, it.y + 6, it.v + ' ' + (it.u || '%'), { z: 12, mono: 1, c: '#5cd6ff' });
          if (it.m) txt(g, it.x - 14, it.y - 10, it.m, { z: 10, c: '#9ff0c4', a: 'end', b: 1 });
        } else if (it.t === 'pump' || it.t === 'fan' || it.t === 'motor') {
          const c = it.st === 'run' ? '#e05555' : '#3fbf6a';
          g.append(S_('circle', { cx: it.x, cy: it.y, r: 14, fill: 'none', stroke: c, 'stroke-width': 2.5 }));
          const ring = g.lastChild;
          /* 2.5.0-beta.6: a motor of the HMI (the "M" of the coal feeders, 11.png) */
          if (it.t === 'motor') {
            const m = S_('text', { x: it.x, y: it.y + 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: c });
            m.textContent = 'M';
            g.append(m);
          } else if (it.t === 'pump') g.append(S_('polygon', { points: `${it.x - 8},${it.y + 8} ${it.x + 8},${it.y} ${it.x - 8},${it.y - 8}`, fill: c }));
          else g.append(S_('path', { d: `M${it.x - 9},${it.y} L${it.x + 9},${it.y} M${it.x},${it.y - 9} L${it.x},${it.y + 9}`, stroke: c, 'stroke-width': 2.5 }));
          {
            const sym = g.lastChild;
            reg(it, x => {
              const on = x && x.v != null ? x.v > 0.5 : it.st === 'run';
              const c2 = x && x.tr ? (Math.floor(Date.now() / 1000) % 2 ? '#f59e0b' : '#e05555') : on ? '#e05555' : '#3fbf6a'; /* TRIP flashes (retest #34) */
              ring.setAttribute('stroke', c2);
              sym.setAttribute(it.t === 'fan' ? 'stroke' : 'fill', c2);
            }, ring);
          }
          if (it.tag && !it.nolab) txt(g, it.x, it.y + 30, it.tag, { z: 11, a: 'middle' });
          if (it.m) txt(g, it.x + 18, it.y - 12, it.m, { z: 10, c: '#9ff0c4', b: 1 });
        } else if (it.t === 'vessel') {
          const rx = it.shape === 'drum' || it.shape === 'tank' ? Math.min(it.w, it.h) / 2 : it.shape === 'turbine' ? 4 : 6;
          if (it.shape === 'turbine')
            g.append(S_('polygon', { points: `${it.x},${it.y + it.h * 0.3} ${it.x + it.w},${it.y} ${it.x + it.w},${it.y + it.h} ${it.x},${it.y + it.h * 0.7}`, fill: '#1b2530', stroke: '#8b9aa8', 'stroke-width': 2 }));
          else g.append(S_('rect', { x: it.x, y: it.y, width: it.w, height: it.h, rx, fill: it.f || '#121a22', stroke: it.f ? '#a9b7c4' : '#8b9aa8', 'stroke-width': 2 })); /* beta.19: f = own fill (plenum, wall, APH) */
          if (it.label) {
            const t = txt(g, it.x + it.w / 2, it.y + it.h / 2 + 5, it.label, { z: 13, a: 'middle', b: 1 });
            /* 2.4.1-beta.1: a label wider than its box gets a smaller font (006 BURNER-A/B OIL FLOW ran into the next box) */
            try {
              const L = t.getComputedTextLength();
              if (L > it.w - 8) t.setAttribute('font-size', Math.max(9, Math.floor((+t.getAttribute('font-size') * (it.w - 8)) / L)));
            } catch (e) {}
          }
        } else if (it.t === 'text') {
          const t = txt(g, it.x, it.y, it.s, { z: it.z || 13, b: it.b, c: it.c });
          /* 2.4.1-beta.1: wrap = width of the box the note belongs to; the note breaks into lines inside it (UI audit: the long
             notes of the UNIT screen ran over the next column and off the screen) */
          if (it.wrap) {
            const fz = +t.getAttribute('font-size'),
              per = Math.max(8, Math.floor(it.wrap / (fz * 0.5))),
              lines = [];
            for (const wd of String(it.s).split(' ')) {
              if (lines.length && (lines[lines.length - 1] + ' ' + wd).length <= per) lines[lines.length - 1] += ' ' + wd;
              else lines.push(wd);
            }
            t.textContent = '';
            lines.forEach((l, i) => {
              const sp = S_('tspan', { x: it.x, dy: i ? fz * 1.25 : 0 });
              sp.textContent = l;
              t.append(sp);
            });
          }
        } else if (it.t === 'lamp') {
          /* 2.5.0-beta.6: a lamp of the HMI (BURNER ON / OFF): lit when the value is above `gt` (`inv`: when not); snapshot colour when not linked */
          const lt = txt(g, it.x, it.y, '●', { z: 30, c: it.c });
          reg(it, x => {
            if (!x || !isFinite(x.v)) return lt.setAttribute('fill', it.c);
            const on = x.v > (it.gt != null ? it.gt : 0.5);
            lt.setAttribute('fill', (it.inv ? !on : on) ? it.lit : '#1b2530');
          }, lt);
        } else if (it.t === 'flag') {
          /* 2.2.0-beta.19: ☑ red = 1, ☒ green = 0 (HMI convention of the 033 screen); grey = not linked (snapshot) */
          const ft = txt(g, it.x, it.y, (it.on ? '☑ ' : '☒ ') + it.s, { z: it.z || 13, b: it.b, c: it.on ? '#e05555' : '#3fbf6a' });
          reg(it, x => {
            const on = x ? x.v > 0.5 : !!it.on;
            ft.textContent = (on ? '☑ ' : '☒ ') + it.s;
            ft.setAttribute('fill', !x ? '#7f90a0' : on ? '#e05555' : '#3fbf6a');
          }, ft);
        } else if (it.t === 'val') {
          if (it.tag) txt(g, it.x, it.y - 15, it.tag, { z: 11, c: '#a9b7c4' });
          const vt = txt(g, it.x, it.y, (it.v != null ? it.v : '—') + (it.u ? ' ' + it.u : ''), {
            z: 14,
            mono: 1,
            c: '#5cd6ff'
          });
          reg(
            it,
            x => {
              vt.textContent = (x ? fmtV(x.v, it.v) : snap(it.v != null ? it.v : '—')) + (it.u ? ' ' + it.u : '');
              vt.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
            },
            vt
          );
        } else if (it.t === 'ctl') {
          const bw = 168,
            bh = 70;
          const box = S_('rect', { x: it.x, y: it.y, width: bw, height: bh, rx: 3, fill: '#0d1319', stroke: '#2a6a98', 'stroke-width': 1.5 });
          g.append(box);
          txt(g, it.x + 6, it.y + 15, (it.label || it.tag || '').slice(0, 28), { k: 2, z: 11, c: '#a9b7c4' });
          txt(g, it.x + 6, it.y + 31, it.tag || '', { k: 2, z: 12, b: 1, mono: 1 });
          const mt = txt(g, it.x + bw - 6, it.y + 31, it.m || '', {
            k: 2,
            z: 12,
            b: 1,
            a: 'end',
            c: it.m === 'M' ? '#ffd27a' : '#9ff0c4'
          });
          const t1 = txt(
            g,
            it.x + 6,
            it.y + 50,
            'PV ' + (it.pv != null ? it.pv : '—') + '  SV ' + (it.sv != null ? it.sv : '—'),
            { k: 2, z: 12, mono: 1, c: '#5cd6ff' }
          );
          const t2 = txt(
            g,
            it.x + 6,
            it.y + 66,
            'MV ' + (it.mv != null ? it.mv + ' %' : '—') + (it.u ? '   ' + it.u : ''),
            { k: 2, z: 12, mono: 1, c: '#9ff0c4' }
          );
          reg(
            it,
            x => {
              const m = x ? x.m : it.m || '';
              mt.textContent = m;
              mt.setAttribute('fill', m === 'M' ? '#ffd27a' : '#9ff0c4');
              t1.textContent =
                'PV ' +
                (x ? fmtV(x.pv, it.pv) : snap(it.pv != null ? it.pv : '—')) +
                '  SV ' +
                (x ? fmtV(x.sv, it.sv) : snap(it.sv != null ? it.sv : '—'));
              /* 3.2.0-beta.1 (audit M5): the unit of the MV is the one of the faceplate: a PID output is % (before, the PV unit of
               the screen: "MV 56.0 mm" for LICBR1001 whose faceplate says 3.00 %); a MAN station has its own unit (hmi.js P.u) */
              const r = lvOf(it),
                mu =
                  r && r.k === 'man'
                    ? (r.b.p && r.b.p.u) || ''
                    : r && r.k === 'ctl'
                      ? '%'
                      : it.u && it.u !== '%'
                        ? it.u
                        : '%';
              t2.textContent =
                'MV ' + (x ? fmtV(x.mv, it.mv) : snap(it.mv != null ? it.mv : '—')) + (mu ? ' ' + mu : '');
              t1.setAttribute('fill', x ? '#5cd6ff' : '#7f90a0');
              t2.setAttribute('fill', x ? '#9ff0c4' : '#7f90a0');
            },
            box
          );
        } else if (it.t === 'header') {
          /* 2.2.0-beta.19: the header bar like the HMI: seven cells spread over the full width, bold label, the value in a dark box
             (big, mono, cyan), the unit after it; before a thin left-aligned strip with 14 px text */
          const items = it.items || [],
            n = Math.max(1, items.length),
            cw = (w - 40) / n,
            bh = 46;
          g.append(S_('rect', { x: 0, y: 0, width: w, height: bh, fill: '#141c25' }));
          g.append(S_('line', { x1: 0, y1: bh, x2: w, y2: bh, stroke: '#2a3a4a', 'stroke-width': 1 }));
          items.forEach(([k, v, u], i) => {
            const x0 = 20 + i * cw;
            txt(g, x0, bh / 2 + 7, k, { k: 2, z: 19, c: '#f0b0d8', b: 1 });
            const lw = 10 + k.length * 12,
              bw = Math.max(86, (String(v).length + 1) * 13);
            g.append(S_('rect', { x: x0 + lw, y: 8, width: bw, height: bh - 16, rx: 3, fill: '#05080b', stroke: '#2a6a98', 'stroke-width': 1 }));
            const t = txt(g, x0 + lw + bw / 2, bh / 2 + 8, v, { k: 2, z: 22, mono: 1, c: '#5cd6ff', b: 1, a: 'middle' });
            txt(g, x0 + lw + bw + 8, bh / 2 + 7, u || '', { k: 2, z: 17, c: '#f0b0d8', b: 1 });
            /* the header bar of every screen (MSP, MST, MSF, RHP, RHT, COAL, PWR) reads the simulation: the same
               signals as the HMI header (ABC-001C AI0131 PT-MS1002, TICMS1004, SI0230 compensated main steam flow, AI0419 GCP-AI1001
               generator MW; ABC-052 PICHR1003 reheat pressure, ABC-019 TICHR1002 reheat temperature, ABC-002 coal master PV) */
            const hi = { t: 'val', tag: k, ref: HDR[k], v, u };
            if (HDR[k])
              reg(hi, y => {
                t.textContent = y ? fmtV(y.v, v) : v;
                t.setAttribute('fill', y ? '#5cd6ff' : '#7f90a0');
              }, t);
          });
        }
      } catch (e) {}
    }
    vb = bg ? [bg.x, bg.y, bg.w, bg.h] : [0, 0, w, h];
    box0 = vb.slice();
    fit();
    index().then(() => {
      for (const o of LV) o.r = resolve(o.it);
      for (const o of LV) {
        if (o.r && o.hit && o.r.k === 'unit' && !o.hit.dataset.lk) {
          /* a value of the plant model with no DCS tag (oil flow, bed temperature): nothing to open, it says what it is */
          o.hit.dataset.lk = '1';
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          t.textContent = 'Plant model value (no DCS tag, no faceplate)';
          o.hit.append(t);
        }
        if (o.r && o.hit && o.r.k !== 'unit' && !o.hit.dataset.lk) {
          /* 3.2.0-beta.1: one listener per item (the screen is linked again after the ABC sheets load) */
          o.hit.dataset.lk = '1';
          o.hit.style.cursor = 'pointer';
          o.hit.style.pointerEvents = 'auto';
          o.hit.addEventListener('click', e => {
            e.stopPropagation();
            try {
              if ((o.r.k === 'ctl' || o.r.k === 'man') && fpOpen(o.it.tag)) return;
              if (o.r.k === 'mv' && fpOpen(o.r.c.tag)) return;
              if (D !== document || !window.lsInfo) return; /* the info card opens in the main window only */
              if (o.r.k === 'ctl' || o.r.k === 'man') window.lsInfo(o.it.tag);
              else if (o.r.k === 'mv') window.lsInfo(o.r.c.tag);
              else if (o.r.a) window.lsInfo(o.r.a, { stn: o.r.st });
              else {
                /* 3.2.0-beta.1 (audit): the label of the linked wire as written on the sheet (MIF-CL1061-A on the screen, the
                   sheet writes it its own way); before, "<tag>.PV" found nothing for 31 of the 51 UNIT items and the click did nothing */
                const sh = o.r.sh && shOf(o.r.sh),
                  l = sh && sh.S && o.r.n != null ? sh.S.lab[o.r.n] : null,
                  nm = (l && l.t && String(l.t).trim()) || (sh && sh.S && o.r.n != null && window.AN && AN.nm ? AN.nm(sh.S, o.r.n) : '');
                if (!(nm && window.lsInfo(nm)) && !window.lsInfo(o.it.tag + '.PV')) window.lsInfo(o.it.tag);
              }
            } catch (x) {}
          });
        }
      }
      liveCount();
      liveTick();
    });
  }
  /* 2.4.0-beta.5 PLANT VIEW: click a controller, MAN station or valve = its faceplate (A / M / R, SV, MV, trend) over the
     graphic, like the faceplate pop-up of a DCS operator station; it writes the same operator values as the LOGIC pane */
  let fp = null,
    fpLive = null;
  function fpClose() {
    if (fp) fp.remove();
    fp = fpLive = null;
    lay();
  }
  /* 3.2.0 P3: on a wide screen the faceplate is a panel docked at the right (the graphic gets narrower, same zoom); narrow =
     the pop-up over the graphic as before */
  function lay() {
    if (!ws) return;
    ws.classList.toggle('crw', ws.getBoundingClientRect().width >= 836);
    /* the chips that do not fit wrap to a hidden second line; no half chip when even the first does not fit */
    const ch = ws.querySelector('.plchips');
    if (ch && ch.firstChild) {
      ch.style.visibility = '';
      ch.style.visibility = ch.clientWidth + 1 < ch.firstChild.offsetWidth ? 'hidden' : '';
    }
    const host = ws.classList.contains('crw') ? ws : $('plmid');
    if (fp && host && fp.parentNode !== host) host.append(fp);
    keepZoom();
  }

  function fpOpen(tag) {
    if (!window.AN || !AN.fpBuild) return false;
    const box = E('div', { cls: 'body' });
    let r = null;
    try {
      r = AN.fpBuild(tag, box);
    } catch (e) {}
    if (!r) return false;
    fpClose();
    const sh = r.sheet;
    fp = E('div', { id: 'plfp', 'data-tag': tag }, [
      E('div', { cls: 'plfph' }, [
        E('b', { txt: tag }),
        E('button', {
          cls: 'b',
          txt: 'Logic',
          title: 'Open ' + sh + ' (the drawing of this loop) in the LOGIC tab',
          on: () => {
            try {
              window.lsSetTab && window.lsSetTab('logic');
              if (AN.cat !== 'an') AN.setCat('an');
              const i = AN.sheets.findIndex(s => s.name === sh);
              if (i >= 0) AN.go(i);
              if (D !== document) window.focus();
            } catch (e) {}
          }
        }),
        E('button', { cls: 'b', txt: '✕', title: 'Close the faceplate', on: fpClose })
      ]),
      box
    ]);
    lay();
    (ws.classList.contains('crw') ? ws : $('plmid')).append(fp);
    lay();
    fpLive = r.live;
    fpTick();
    return true;
  }
  function fpTick() {
    if (!fpLive || !ws || ws.style.display !== 'grid') return;
    for (const f of fpLive)
      try {
        f();
      } catch (e) {}
  }
  setInterval(fpTick, 250);
  window.lsPlantFp = fpOpen; /* for the tests */
  window.lsPlantLinks = () => LV.map(o => ({ tag: o.it.tag || o.it.ref || '', t: o.it.t, on: !!o.r })); /* for the tests (retest #60) */
  function reg(it, set, hit) {
    LV.push({ it, set, hit, r: null });
  }
  function fit() {
    if (!vb || !svg) return;
    const r = svg.getBoundingClientRect(),
      w = box0[2],
      h = box0[3],
      /* 2.4.1-beta.1 (UI audit): the graphic starts at the top (before: centred, a black band above it); on a portrait screen
         (phone) it fits the height and starts at the left, drag to see the right part (before: 4 px text and 2/3 of the
         screen black) */
      tall = r.height > r.width,
      /* retest #61 (R7: beside the Training panel the 007 AIR / FLUE GAS graphic was small with ~40 % of the area empty below it): the
         graphic fills the height of the area too; when the area is narrower than the graphic, up to 30 % of its width is out of
         view (drag to pan), so the text grows instead of leaving a band empty */
      sw = w / Math.max(1, r.width),
      sh = h / Math.max(1, r.height),
      /* #117 (user 2026-10-29): a screen with fitAll (030 SEAWATER) opens whole, nothing out of view */
      /* live test 2026-10-30 #1 (030 cut on both sides beside the Training dock): the flag is on the screen (cur.g), cur is its list entry;
         cur.fitAll was never set, so 030 was fitted to the height like the others. Whole page, centred in the area */
      all = !!(cur && (cur.fitAll || (cur.g && cur.g.fitAll))),
      s = all ? Math.max(sh, sw) : tall ? sh : sh <= sw ? Math.max(sh, sw * 0.7) : sh;
    vb = [box0[0] + (tall && !all ? 0 : (w - r.width * s) / 2), box0[1] - (all ? Math.max(0, (r.height * s - h) / 2) : 0), r.width * s, r.height * s];
    svg.setAttribute('viewBox', vb.join(' '));
    svSz = [r.width, r.height];
  }
  /* 3.2.0 P3: when the graphic gets narrower or wider without a new fit (the docked faceplate opens or closes, a slide-out),
     the zoom stays: the same part of the graphic stays at the same place, more or less of it is shown */
  let svSz = null;
  const keepZoom = () => {
    if (!svg || !vb || !svSz) return;
    const r = svg.getBoundingClientRect();
    /* 3.2.0-beta.8: a fit while the page was hidden leaves a size of 0: start again from the size now (no NaN viewBox) */
    if (!(svSz[0] >= 1 && svSz[1] >= 1) || !vb.every(isFinite)) {
      if (r.width >= 1 && r.height >= 1) svSz = [r.width, r.height];
      return;
    }
    if (r.width < 1 || r.height < 1 || (Math.abs(r.width - svSz[0]) < 1 && Math.abs(r.height - svSz[1]) < 1)) return;
    vb = [vb[0], vb[1], (vb[2] * r.width) / svSz[0], (vb[3] * r.height) / svSz[1]];
    svSz = [r.width, r.height];
    svg.setAttribute('viewBox', vb.join(' '));
  };
  function valsOf(src) {
    return VALS().find(v => v.src === src);
  }
  function showVals(src) {
    const box = $('plvals');
    box.innerHTML = '';
    const v = valsOf(src);
    if (!v) {
      box.append(E('div', { cls: 'sub', txt: 'No values for this screen.' }));
      return;
    }
    const f = E('input', { cls: 'plf', placeholder: 'Filter tag…' }),
      tb = E('div', { cls: 'pltb' });
    const fill = () => {
      tb.innerHTML = '';
      const q = f.value.trim().toUpperCase();
      for (const [tag, val, u, m, k] of v.items) {
        if (q && !String(tag).toUpperCase().includes(q)) continue;
        tb.append(E('div', { cls: 'plr k-' + k }, [E('b', { txt: tag }), E('span', { cls: 'v', txt: val + (u && !String(val).includes(u) ? ' ' + u : '') }), E('span', { cls: 'm', txt: m || '' })]));
      }
    };
    f.oninput = fill;
    box.append(
      E('div', { cls: 'plh' }, [E('b', { txt: 'Snapshot values' }), E('span', { txt: v.items.length + ' · ' + (v.time || v.src) })]),
      v.note ? E('div', { cls: 'sub', txt: v.note }) : null,
      f,
      tb
    );
    fill();
  }
  function select(o) {
    cur = o;
    for (const b of D.querySelectorAll('#pllist button,#plantws .plchip')) b.classList.toggle('on', b.dataset.id === o.id);
    $('pltitle').textContent = o.title;
    const pk = ws && ws.querySelector('.plpick');
    if (pk) {
      if (pk.options.length !== list().length) {
        pk.innerHTML = '';
        for (const x of list()) pk.append(E('option', { value: x.id, txt: x.title }));
      }
      pk.value = o.id;
    }
    if (o.g) draw(o.g);
    else {
      svg.innerHTML = '';
      const g = S_('g', {});
      svg.append(g);
      vb = [0, 0, 960, 500];
      txt(g, 480, 230, o.title, { k: 2, z: 22, a: 'middle', b: 1 });
      txt(g, 480, 262, 'Graphic not drawn yet: the snapshot values are in the list on the right.', { k: 2, z: 14, a: 'middle', c: '#7f90a0' });
      fit();
    }
    showVals(o.src);
    try {
      localStorage.setItem('ls-plant-sys', o.id);
    } catch (e) {}
  }
  function build() {
    ws = E('div', { id: 'plantws' });
    const left = E('div', { id: 'plleft' }),
      mid = E('div', { id: 'plmid' }),
      right = E('div', { id: 'plright' });
    const fl = E('input', { cls: 'plf', placeholder: 'Find system…' });
    const ul = E('div', { id: 'pllist' });
    const fillList = () => {
      ul.innerHTML = '';
      const q = fl.value.trim().toUpperCase();
      for (const o of list()) {
        if (q && !o.title.toUpperCase().includes(q)) continue;
        const b = E('button', { cls: o.g ? '' : 'novg', 'data-id': o.id, on: () => select(o) }, [E('b', { txt: o.title }), E('small', { txt: o.g ? 'graphic + values' : 'values only' })]);
        ul.append(b);
      }
    };
    fl.oninput = fillList;
    left.append(E('div', { cls: 'plh' }, [E('b', { txt: 'PLANT HMI · systems' })]), fl, ul);
    svg = S_('svg', { id: 'plsvg', preserveAspectRatio: 'xMinYMin meet' }); /* 3.2.0 P3: the graphic stays put at the left when the panel at the right opens or closes */
    const bar = E('div', { cls: 'plbar' }, [
      E('b', { id: 'pltitle', txt: '' }),
      E('button', {
        id: 'pllive',
        cls: 'b pllive on',
        txt: 'LIVE',
        title: 'LIVE: values from the simulation (tag.PV, I/O list address, valve on the drawing); grey = not linked, snapshot value. Click: show the snapshot values.',
        on: () => {
          liveOn = !liveOn;
          liveCount();
          liveTick();
        }
      }),
      E('button', { cls: 'b', txt: 'Fit', on: () => (cur && cur.g ? draw(cur.g) : fit()) }),
      E('button', { cls: 'b plvb', txt: 'Values', on: e => {
          /* 2.4.1-beta.1: the values slide out over the graphic on every screen (app.css) */
          e.stopPropagation();
          ws.classList.toggle('vals');
          ws.classList.remove('lsopen');
        } })
    ]);
    /* 3.2.0 P3 (Control Room, after-plant mockup): the screen picker in the bar: ◀ / the list of screens / ▶, the main
       screens as chips, full screen. Same select() as the system list; the list stays (☰ Systems drawer). */
    const pick = E('select', { cls: 'plpick', title: 'Plant screen', 'aria-label': 'Plant screen' }),
      step = d => {
        const L = list(),
          i = L.findIndex(o => cur && o.id === cur.id);
        select(L[(i + d + L.length) % L.length]);
      };
    pick.onchange = () => {
      const o = list().find(x => x.id === pick.value);
      if (o) select(o);
    };
    const chips = E('div', { cls: 'plchips' });
    for (const [id, t] of [['AFG', '007 Air & Flue Gas'], ['UNIT', 'UNIT · controllers']])
      chips.append(
        E('button', {
          cls: 'plchip',
          'data-id': id,
          txt: t,
          on: () => {
            const o = list().find(x => x.id === id);
            if (o) select(o);
          }
        })
      );
    const nav = E('div', { cls: 'plnav' }, [
      E('button', { cls: 'b plstep', txt: '◀', title: 'Previous screen', 'aria-label': 'Previous screen', on: () => step(-1) }),
      pick,
      E('button', { cls: 'b plstep', txt: '▶', title: 'Next screen', 'aria-label': 'Next screen', on: () => step(1) })
    ]);
    const full = E('button', {
      cls: 'b plfull',
      txt: '⛶',
      title: 'Full screen (Esc to leave)',
      'aria-label': 'Full screen',
      on: () => {
        try {
          if (D.fullscreenElement) D.exitFullscreen();
          else ws.requestFullscreen();
        } catch (e) {}
      }
    });
    bar.insertBefore(nav, bar.firstChild.nextSibling);
    nav.after(chips);
    bar.append(full);
    mid.append(bar, svg);
    try {
      new ResizeObserver(keepZoom).observe(svg);
    } catch (e) {}
    right.id = 'plvals';
    ws.append(left, mid, right);
    document.body.append(ws);
    fillList();
    /* pan (drag) and zoom (wheel / pinch) */
    /* 3.2.0-beta.1 (audit C1): the pointer is captured only once it has moved (a drag). Capturing it on pointerdown sent the
       click to the svg itself, so a tap on a controller or valve never opened its faceplate (mouse and touch) */
    let drag = null,
      dragged = false;
    svg.addEventListener('pointerdown', e => {
      if (!vb) return;
      drag = { x: e.clientX, y: e.clientY, v: vb.slice(), id: e.pointerId, moved: false };
      dragged = false;
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || !vb) return;
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
        drag.moved = dragged = true;
        try {
          svg.setPointerCapture(drag.id);
        } catch (x) {}
      }
      const r = svg.getBoundingClientRect(),
        s = vb[2] / r.width;
      vb = [drag.v[0] - (e.clientX - drag.x) * s, drag.v[1] - (e.clientY - drag.y) * s, vb[2], vb[3]];
      svg.setAttribute('viewBox', vb.join(' '));
    });
    svg.addEventListener('pointerup', () => (drag = null));
    svg.addEventListener('pointercancel', () => (drag = null));
    /* the click that ends a drag does not open a faceplate */
    svg.addEventListener(
      'click',
      e => {
        if (dragged) {
          dragged = false;
          e.stopPropagation();
        }
      },
      true
    );
    svg.addEventListener(
      'wheel',
      e => {
        e.preventDefault();
        if (!vb) return;
        const r = svg.getBoundingClientRect(),
          k = e.deltaY > 0 ? 1.15 : 1 / 1.15,
          px = vb[0] + ((e.clientX - r.left) / r.width) * vb[2],
          py = vb[1] + ((e.clientY - r.top) / r.height) * vb[3];
        vb = [px - (px - vb[0]) * k, py - (py - vb[1]) * k, vb[2] * k, vb[3] * k];
        svg.setAttribute('viewBox', vb.join(' '));
      },
      { passive: false }
    );
    let last = null;
    try {
      last = localStorage.getItem('ls-plant-sys');
    } catch (e) {}
    const all = list();
    select(all.find(o => o.id === last) || all[0]);
  }
  function place() {
    if (!ws || D !== document) return;
    const top = $('gsbar') ? $('gsbar').getBoundingClientRect().bottom : 40,
      foot = $('sfoot') ? $('sfoot').getBoundingClientRect().height : 0;
    ws.style.top = top + 'px';
    ws.style.bottom = foot + 'px';
  }
  function open(on) {
    if (D !== document) return; /* the PLANT VIEW is in its own window: the tabs of the main window leave it alone */
    if (on && !ws) build();
    if (!ws) return;
    ws.style.display = on ? 'grid' : 'none';
    document.body.classList.toggle('plant', !!on);
    if (btn) btn.classList.toggle('on', !!on);
    document.querySelectorAll('#gsbar .cat button').forEach(b => b !== btn && on && b.classList.remove('on'));
    if (on) {
      try {
        window.lsLibrary && window.lsLibrary(false);
      } catch (e) {}
      place();
      lay();
      setTimeout(() => (cur && cur.g ? draw(cur.g) : fit()), 30);
      if (!tmr) tmr = setInterval(liveTick, 1000);
    }
  }
  window.lsPlant = open;
  /* 2.4.0-beta.5: the PLANT VIEW window (PC) moves the workspace into its own document and back */
  window.lsPlantWs = () => {
    if (!ws) build();
    return ws;
  };
  window.lsPlantDoc = d => {
    D = d || document;
    if (D !== document) {
      document.body.classList.remove('plant');
      if (btn) btn.classList.remove('on');
      ws.style.display = 'grid';
      ws.style.top = ws.style.bottom = '';
      if (!tmr) tmr = setInterval(liveTick, 1000);
    }
    setTimeout(() => {
      lay();
      cur && cur.g ? draw(cur.g) : fit();
    }, 30);
  };
  window.lsPlantFit = () => (cur && cur.g ? draw(cur.g) : fit());
  /* the Training dock (user 2026-10-30): pan the graphic sideways so that the screen part x0 .. x1 (px, the boxed equipment of the
     step) is in view; the zoom stays */
  window.lsPlantPanX = (x0, x1) => {
    /* live test 2026-10-30 #1: a whole-page screen (030) does not move when a step boxes its equipment: all of it is in view */
    if (!svg || !vb || !box0 || (cur && (cur.fitAll || (cur.g && cur.g.fitAll)))) return;
    const r = svg.getBoundingClientRect();
    if (r.width < 1 || (x0 >= r.left + 8 && x1 <= r.right - 8)) return;
    const k = vb[2] / r.width,
      c = vb[0] + (((x0 + x1) / 2 - r.left) * k),
      lo = box0[0],
      hi = box0[0] + box0[2] - vb[2];
    vb = [hi < lo ? (lo + hi) / 2 : Math.min(Math.max(c - vb[2] / 2, lo), hi), vb[1], vb[2], vb[3]];
    svg.setAttribute('viewBox', vb.join(' '));
  };
  window.lsPlantLive = () => LV.map(o => ({ tag: o.it.tag, t: o.it.t, snap: o.it.t === 'ctl' ? o.it.pv + '/' + o.it.sv + '/' + o.it.mv + ' ' + o.it.m : o.it.v, how: o.r ? o.r.how || o.r.k : null, sh: o.r ? o.r.sh : null, live: o.r && o.r.k === 'mv' ? shOf(o.r.sh).S.rt.v[o.r.c.out] : o.r && o.r.cc ? (() => { const x = netVal(o.r), mv = shOf(o.r.cc.sh).S.rt.v[o.r.cc.c.out]; return Math.abs(x - (100 - mv)) < 0.5 && Math.abs(x - mv) > 1 ? 100 - x : x; })() : o.r && (o.r.k === 'net' || o.r.k === 'dig') ? netVal(o.r) : o.r && o.r.k === 'ctl' ? (() => { const S = shOf(o.r.sh).S, c = o.r.c; return [S.rt.v[c.q.pv], S.rt.v[c.q.sv], S.rt.v[c.out]].map(x => +(+x).toFixed(1)).join('/'); })() : o.r && o.r.k === 'man' ? +(+shOf(o.r.sh).S.rt.v[o.r.b.o[0]]).toFixed(1) : null })); /* for the tests */
  addEventListener('resize', () => {
    if (ws && ws.style.display === 'grid') {
      place();
      lay();
      fit();
    }
  });
  const iv = setInterval(() => {
    const cats = document.querySelectorAll('#gsbar .cat');
    if (!cats.length) return;
    cats.forEach(cat => {
      if (cat.querySelector('.plbtn')) return;
      const b = E('button', { cls: 'plbtn', txt: 'PLANT', title: 'Plant HMI workspace (draft): plant graphics per system with the control-room snapshot values' });
      b.onclick = e => {
        e.stopPropagation();
        open(!(ws && ws.style.display === 'grid'));
      };
      cat.append(b);
      btn = b;
      /* ABC / DITL close the plant workspace */
      cat.querySelectorAll('button:not(.plbtn)').forEach(x => x.addEventListener('click', () => open(false)));
    });
    clearInterval(iv);
  }, 400);
})();
