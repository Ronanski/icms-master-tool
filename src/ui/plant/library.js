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
    rows = { io: [], mem: [], wire: [], relay: [] },
    WIX = {},
    tab = 'io',
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
    [/^FP/, 'FP', 'floating parameters (FP)']
  ];
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
    const ms = src.filter(r => (!stn || r.st === stn) && (!words.length || words.every(w => r.h.includes(w)))),
      gc = {};
    for (const r of ms) gc[r.gk] = (gc[r.gk] || 0) + 1;
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
            E('span', { txt: gc[k] + (gc[k] === 1 ? ' row' : ' rows') })
          ])
        );
      }
      if (r.gk !== undefined && !isOpen(r.gk)) continue;
      shown++;
      if (shown > MAX) continue;
      const row = E('div', { cls: 'libr' }, [
        E('span', { cls: 'st', txt: r.s }),
        E('span', { cls: 'ad', title: 'Copy the address', txt: r.a }),
        E('span', { cls: 'tg', title: r.tag ? 'Copy the tag' : '', txt: r.tag }),
        E('span', { cls: 'ds', txt: r.d }),
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
          window.lsInfo && window.lsInfo(r.a, { stn: r.st, look: 1 });
        } catch (x) {}
      });
      row.children[1].onclick = () => copy(r.a);
      row.children[2].onclick = () => r.tag && copy(r.tag);
      row.children[6].onclick = () => find(r.a.length && /^[A-Z]{1,2}\.|^AI|^AO|^SI|^SO/.test(r.a) ? r.a : r.tag);
      frag.append(row);
    }
    box.append(frag);
    let other = '';
    if (!n && words.length) {
      const ot = tab === 'io' ? 'mem' : 'io',
        m = rows[ot].filter(r => (!stn || r.st === stn) && words.every(w => r.h.includes(w))).length;
      if (m) other = ' · ' + m + ' in the ' + (ot === 'io' ? 'I/O LIST' : 'MEMORY LIST') + ' tab';
    }
    cnt.textContent = n + (n === 1 ? ' row · ' : ' rows · ') + ng + (ng === 1 ? ' group' : ' groups') + (shown > MAX ? ' · ' + MAX + ' of ' + shown + ' shown (type more to narrow)' : '') + other;
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
            render();
          }
        });
    tabs.append(mk('io', 'I/O LIST'), mk('mem', 'MEMORY LIST'), mk('wire', 'WIRING'), mk('relay', 'RELAY / SER'), mk('calc', 'CALC'));
    const ss = E('select', { cls: 'libst' });
    [['', 'All stations'], ['1', 'STN101'], ['2', 'STN102'], ['3', 'STN103'], ['4', 'STN104'], ['5', 'STN105']].forEach(([v, t]) => {
      const o = E('option', { txt: t });
      o.value = v;
      ss.append(o);
    });
    ss.onchange = () => {
      stn = ss.value;
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
      E('div', { cls: 'libbar' }, [tabs, ss, fi, E('span', { id: 'libcnt' })]),
      E('div', { cls: 'libhd' }, ['Station', 'Address', 'Tag', 'Description', 'Range / remark', 'Type · SIG.AB', ''].map(t => E('span', { txt: t }))),
      E('div', { id: 'libtb' })
    );
    document.body.append(ws);
    load().then(() => {
      sortGroups();
      render();
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
