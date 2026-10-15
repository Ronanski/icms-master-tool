/* LIBRARY WORKSPACE (2.1.0): the I/O list and the memory lists of the five stations (STN101 ~ STN105), the same data the app
   uses for descriptions (AN.ades()). Search by address, tag or description; a click on the address or the tag copies it (to
   paste in the search bar), "Find" puts it in the search bar and opens the info card. Read only. A tab for the marshalling
   panel wiring is reserved (the owner will add the wiring list later). */
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
    rows = { io: [], mem: [] },
    tab = 'io',
    stn = '',
    q = '',
    loaded = false;
  const fmt = x => (x == null || x === '' ? '' : String(+(+x).toPrecision(6)));
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
      if (window.lsInfo && window.lsInfo(t)) {
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
    for (const st of Object.keys(A).sort()) {
      const T = A[st];
      for (const k of Object.keys(T).sort()) {
        const r = T[k],
          s = 'STN10' + st;
        if (r.k === 'io') {
          const rg = r.lo != null || r.hi != null ? fmt(r.lo) + ' ~ ' + fmt(r.hi) + (r.u ? ' ' + r.u : '') : r.u || '';
          rows.io.push({ st, s, a: k, tag: r.tag || '', d: r.d || '', x: rg, t: r.t || '', ab: r.ab || '', h: (s + ' ' + k + ' ' + (r.tag || '') + ' ' + (r.d || '') + ' ' + (r.ab || '')).toUpperCase() });
        } else {
          rows.mem.push({ st, s, a: k, tag: '', d: r.d || '', x: r.r || '', t: r.tt || r.ts || '', ab: '', h: (s + ' ' + k + ' ' + (r.d || '') + ' ' + (r.r || '')).toUpperCase() });
        }
      }
    }
  }
  function render() {
    const box = $('libtb'),
      cnt = $('libcnt');
    if (!box) return;
    box.innerHTML = '';
    if (tab === 'wire') {
      box.append(
        E('div', { cls: 'libempty' }, [
          E('b', { txt: 'Marshalling panel wiring' }),
          E('div', { txt: 'Reserved: the wiring from the marshalling panel to the controller (per address / tag, per station) will be added here and merged with the I/O list.' })
        ])
      );
      cnt.textContent = '';
      return;
    }
    const src = rows[tab],
      words = q
        .toUpperCase()
        .split(/\s+/)
        .filter(Boolean);
    let n = 0;
    const frag = document.createDocumentFragment();
    for (const r of src) {
      if (stn && r.st !== stn) continue;
      if (words.length && !words.every(w => r.h.includes(w))) continue;
      n++;
      if (n > MAX) continue;
      const row = E('div', { cls: 'libr' }, [
        E('span', { cls: 'st', txt: r.s }),
        E('span', { cls: 'ad', title: 'Copy the address', txt: r.a }),
        E('span', { cls: 'tg', title: r.tag ? 'Copy the tag' : '', txt: r.tag }),
        E('span', { cls: 'ds', txt: r.d }),
        E('span', { cls: 'rx', txt: r.x }),
        E('span', { cls: 'ty', txt: r.t + (r.ab ? ' · ' + r.ab : '') }),
        E('button', { cls: 'b', txt: 'Find', title: 'Put it in the search bar and open the info card' })
      ]);
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
    cnt.textContent = (n > MAX ? MAX + ' of ' : '') + n + ' rows' + (n > MAX ? ' (type more to narrow)' : '') + other;
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
    tabs.append(mk('io', 'I/O LIST'), mk('mem', 'MEMORY LIST'), mk('wire', 'WIRING'));
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
    load().then(render);
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
