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
  const T = 'TCS Elementary Diagram 331DM07733';
  const gcp = (insh, inb, inch, outsh, outb, outch) => ['GCP', [['GCP', 'generator meter transducer, 4-20 mA'], ['TCS input ' + inb + ' ch' + inch, 'sheet ' + insh + ' (TCS-7 rack)'], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh + ' (TCS-7 rack)']], T + ' ' + insh + ' + ' + outsh + '; I/O list remark "From TCS"'];
  const fld = (dev, insh, inname, outsh, outb, outch) => ['Field', [[dev, 'field sensor'], ['TCS input ' + inname, 'sheet ' + insh], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh]], T + ' ' + insh + ' + ' + outsh];
  const tcs = (what, outsh, outb, outch) => ['TCS', [['TCS', what], ['TCS output ' + outb + ' ch' + outch, 'sheet ' + outsh]], T + ' ' + outsh];
  /* station|address -> [origin, hops, source] */
  const ORIG = {
    '2|AI0791': gcp('TC0751', 'GXF1', '3', 'TC0791', 'GXF11', '5'),
    '2|AI0807': gcp('TC0751', 'GXF1', '2', 'TC0791', 'GXF11', '6'),
    '2|AI0855': gcp('TC0751A', 'GXF2', '3', 'TC0792', 'GXF12', '4'),
    '2|AI0871': gcp('TC0751A', 'GXF2', '2', 'TC0792', 'GXF12', '5'),
    '2|AI0887': gcp('TC0751B', 'GXF3', '2', 'TC0793', 'GXF10', '1'),
    '2|AI0903': gcp('TC0751B', 'GXF3', '1', 'TC0793', 'GXF10', '2'),
    '2|AI0775': gcp('TC0751E', 'GXF6', '1', 'TC0792', 'GXF12', '3'),
    '2|AI0823': gcp('TC0751E', 'GXF6', '2', 'TC0792', 'GXF12', '6'),
    '2|AI0839': gcp('TC0751E', 'GXF6', '5', 'TC0792', 'GXF12', '7'),
    '2|AI0452': fld('TE-LO1002-1', 'TC0763', 'RTD AI(9)', 'TC0791', 'GXF11', '1'),
    '2|AI0516': fld('TE-LO1002-2', 'TC0763', 'RTD AI(9)', 'TC0792', 'GXF12', '1'),
    '2|AI0757': fld('ZT-AS1011', 'TC0751F', 'COM AI(7)', 'TC0791', 'GXF11', '3'),
    '2|AI0883': fld('PT-ST1001-1', 'TC0532', 'TPC AI(1)', 'TC0160', 'AXF3', '3'),
    '2|AI0884': fld('PT-ST1001-2', 'TC0534', 'TPC AI(3)', 'TC0160', 'AXF3', '4'),
    '2|AI0885': fld('PT-ST1001-3', 'TC0536', 'TPC AI(5)', 'TC0160', 'AXF3', '5'),
    '2|AI0886': tcs('steam seal valve output (made inside TCS)', 'TC0791', 'GXF11', '4'),
    '1|AI0420': tcs('target MW setpoint (made inside TCS)', 'TC0160', 'AXF3', '1'),
    '1|AI0421': tcs('load up rate (made inside TCS)', 'TC0160', 'AXF3', '2'),
    '2|AI0534': tcs('turbine speed (made inside TCS)', 'TC0160', 'AXF3', '6'),
    /* I/O list remark "FROM GCP" (wiring list: TCS-DI2 / TCS->DCS) */
    '2|I.041B': ['GCP', [], 'dcs-io-list.xls remark "FROM GCP"'],
    '2|I.041C': ['GCP', [], 'dcs-io-list.xls remark "FROM GCP"']
  };
  /* STN101 AI0774 GCP-AI1002 #1 Generator MW (D): a direct cable GCP -> DCS (WIRING.xls GCP-->DCS) */
  ORIG['1|AI0774'] = ['GCP', [['GCP', 'generator MW transducer, 4-20 mA']], 'direct cable GCP to DCS (WIRING.xls)'];
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
  const TY = { AI: 'AI (4-20 mA in)', AO: 'AO (4-20 mA out)', DI: 'DI (contact in)', DO: 'DO (contact out)' };
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
    st = { p: 'All', s: 'All', t: { AI: 1, AO: 1, DI: 1, DO: 1 }, q: '', sel: null };
  try {
    const s = JSON.parse(localStorage.getItem('ls-trace') || 'null');
    if (s) Object.assign(st, { p: s.p || 'All', s: s.s || 'All', t: s.t || st.t });
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
        ['DCS ' + sb + ' ' + b.a, b.tag + ' ' + (b.wire ? b.wire + ' ' : '') + 'input (value inside the DCS)'],
        ['DCS ' + sa + ' ' + a.a, 'sent out to ' + a.sys + ' on this AO']
      ]);
      a.pair = b;
      a.ref = (b.ref ? b.ref + '. ' : '') + 'AO paired with ' + sb + ' ' + b.a + ' (' + b.tag + ') by the same signal in the I/O list; the DCS block that copies the AI to this AO is not in the ABC / DITL drawings';
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
        ft = r.up && r.up.length ? [...new Set(r.up.map(h => h[0].split(' ')[0]).concat(out ? ['DCS'] : []))].join(' → ') + (out ? ' → ' + r.sys : r.up.some(h => /^DCS/.test(h[0])) ? '' : ' → DCS') : r.og === 'GCP' && S.n.indexOf('GCP') < 0 ? 'GCP value · ' + S.n : S.n;
      const tr = E('tr', { cls: r === st.sel ? 'on' : '' }, [
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
  function draw(r) {
    const hp = host.querySelector('#trcpath'),
      cap = host.querySelector('#trccap');
    hp.innerHTML = '';
    if (!r) {
      cap.textContent = 'Path of the selected signal';
      hp.textContent = 'No signal matches.';
      return;
    }
    const out = r.t === 'AO' || r.t === 'DO',
      col = { AI: 'var(--trc-ai)', AO: 'var(--trc-ao)', DI: 'var(--trc-di)', DO: 'var(--trc-do)' }[r.t],
      sys = r.sys,
      who = sys === 'Field' ? 'field' : sys;
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
    const mk = id =>
      '<marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0L10,5L0,10z" fill="' + col + '"/></marker>';
    if (r.up && r.up.length) {
      const n = r.up.length,
        us = el('svg', { viewBox: '0 0 1240 110', role: 'img', 'aria-label': 'Where ' + r.tag + ' starts' }, hp);
      el('defs', {}, us).innerHTML = mk('trcua');
      tx(us, 16, 16, 'tl', out ? 'WHERE THE VALUE COMES FROM, THEN OUT OF THE DCS' : 'BEFORE THE RACK ROOM: where the signal starts');
      const bw = n > 3 ? Math.floor((1240 - 16 - 150 - (n - 1) * 36 - 40) / n) : 250,
        gap = n > 3 ? 36 : 60;
      r.up.forEach((h, i) => {
        const x = 16 + i * (bw + gap);
        el('rect', { class: 'box', x, y: 26, width: bw, height: 62, rx: 6 }, us);
        const fit = (t, px) => (t.length > Math.floor((bw - 16) / px) ? t.slice(0, Math.floor((bw - 16) / px) - 1) + '…' : t);
        tx(us, x + 10, 50, 'bt', fit(h[0], 8.2));
        tx(us, x + 10, 70, 'bs', fit(h[1], 6.2));
        el('title', {}, el('rect', { x, y: 26, width: bw, height: 62, fill: 'transparent' }, us)).textContent = h[0] + ' · ' + h[1];
        el('path', { class: 'w', d: 'M' + (x + bw) + ',57 H' + (x + bw + gap - 4), stroke: col, 'marker-end': 'url(#trcua)' }, us);
      });
      const lx = 16 + n * (bw + gap);
      tx(us, lx, 52, 'bt', out ? 'out to ' + sys + ' ↓' : 'cable to rack room ↓');
      tx(us, lx, 70, 'bs', out ? 'wiring of the AO below' : 'continues below');
      /* the source on as many lines as it needs (about 190 characters a line) */
      const words = ('Source: ' + r.ref).split(' '),
        lines = [''];
      for (const w of words) (lines[lines.length - 1] + ' ' + w).length > 190 ? lines.push(w) : (lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + w).trim());
      us.setAttribute('viewBox', '0 0 1240 ' + (96 + lines.length * 14));
      lines.forEach((l, i) => tx(us, 16, 104 + i * 14, 'tl', l));
    }
    const svg = el('svg', { viewBox: '0 0 1240 270', role: 'img', 'aria-label': 'Wiring path of ' + r.tag }, hp);
    el('defs', {}, svg).innerHTML = mk('trcar');
    const Y1 = 150,
      Y2 = 182,
      S = srcOf(r);
    const B = [
      { x: 16, w: 150, t: r.up && r.up.length && !out ? 'TCS' : S.k === 'pan' ? (sys === 'Local panels' ? S.n.split('→')[0] : sys) : r.tag, s: S.k === 'pan' ? 'other panel' : 'field device', d: S.k !== 'pan' },
      { x: 200, w: 150, t: S.k === 'jb' ? S.n : S.k === 'pan' ? 'Cable from ' + S.n.split('→')[0] : 'Direct', s: S.k === 'jb' ? 'junction box (field)' : S.k === 'pan' ? 'cable no. not in list' : 'field cable', d: true },
      { x: 390, w: 330, t: r.mpl, s: 'marshalling panel, rack room' },
      { x: 770, w: 290, t: r.fcs, s: 'FCS cabinet, rack room' },
      { x: 1095, w: 130, t: stnOf(r), s: 'DCS address' }
    ];
    B.forEach(b => {
      el('rect', { class: 'box' + (b.d ? ' dash' : ''), x: b.x, y: 40, width: b.w, height: 206, rx: 6 }, svg);
      tx(svg, b.x + 10, 62, 'bt', b.t);
      tx(svg, b.x + 10, 79, 'bs', b.s);
    });
    tx(svg, 1105, 120, 'addr', r.a);
    tx(svg, 1105, 140, 'bs', r.ch + ' · node ' + r.node + ' slot ' + r.slot);
    if (S.k === 'pan') tx(svg, 26, 120, 'tl', 'signal: ' + r.tag);
    const segs = [
      [166, 440, null, null],
      [440, 600, 'cross wiring', null],
      [600, 830, r.cab, 'cable ' + r.spec + ', cores ' + r.c1 + ' / ' + r.c2],
      [830, 980, r.ic, 'internal cable'],
      [980, 1095, null, null]
    ];
    segs.forEach((sg, i) => {
      [Y1, Y2].forEach((y, k) => {
        const a = out ? sg[1] : sg[0],
          b = out ? sg[0] : sg[1];
        el('path', { class: 'w', d: 'M' + a + ',' + y + ' H' + b, stroke: col, 'marker-end': k === 0 && (out ? i === 0 : i === segs.length - 1) ? 'url(#trcar)' : '' }, svg);
      });
      const cx = i === 2 ? 700 : (sg[0] + sg[1]) / 2;
      if (sg[2]) tx(svg, cx, Y2 + 30, 'cl', sg[2]).setAttribute('fill', col);
      if (sg[3]) tx(svg, cx, Y2 + 46, 'tl', sg[3], 'middle');
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
    strip(440, r.jb.replace(/^(.{16}).+/, '$1…'), r.jt1, r.jt2);
    strip(600, r.ms, r.mt1, r.mt2);
    strip(830, r.eb + ' ' + (r.brd || '') + (r.wire ? ' · ' + r.wire : ''), r.e1, r.e2);
    el('rect', { class: 'strip', x: 960, y: Y1 - 26, width: 24, height: Y2 - Y1 + 44, rx: 3 }, svg);
    tx(svg, 972, Y1 - 34, 'tl', 'I/O card', 'middle');
    tx(svg, 30, Y1 + 5, 'tn', '+', 'start');
    tx(svg, 30, Y2 + 5, 'tn', '−', 'start');
    if (r.sig) tx(svg, 1105, 165, 'bs', r.sig);
    if (r.wire) {
      tx(svg, 1105, 182, 'bs', r.wire);
      tx(svg, 780, 262, 'tl', WIREL(r.sig));
    }
  }
  window.LS_TRACER = { render };
})();
