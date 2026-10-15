/* ---------- category ---------- */
let simSaved = false;
AN.xrefGo = tg => {
  if (tg.a) {
    const i = AN.sheets.findIndex(z => z.name === tg.a);
    if (i >= 0) {
      if (AN.cat !== 'an') setCat('an');
      AN.go(i);
    }
    return;
  }
  const o = [...document.querySelectorAll('#shsel option')].find(x =>
    new RegExp('\\)' + tg.d + '$').test(x.textContent)
  );
  if (!o) {
    msg('Digital page ' + tg.d + ' was not found');
    return;
  }
  setCat('dig');
  const ss = document.getElementById('shsel');
  ss.value = o.value;
  ss.dispatchEvent(new Event('change'));
  msg('Opened ' + tg.d + ' - use the "ABC" button to come back');
};
function setCat(c) {
  if (AN.cat === c) return;
  if (c !== 'an') {
    const f = $('sidefl');
    if (f && AN._ph !== undefined) f.placeholder = AN._ph;
  }
  AN.cat = c;
  try {
    localStorage.setItem('ditl.cat', c);
  } catch (e) {}
  WN.put('cat', c);
  persistAll();
  document.body.classList.toggle('an', c === 'an');
  ptab.style.display = c === 'an' && anp.classList.contains('min') ? 'block' : 'none';
  if (c === 'an' && $('slive')) sLv.value = $('slive').value;
  stE.textContent = c === 'an' ? stAn : stOld;
  catB.forEach(x => x._u());
  if (c === 'an') {
    simSaved = SIM;
    SIM = false;
    AN.run = false;
    bRun.textContent = '▶ Run';
    bRun.classList.remove('on');
    SIDEKEY = null;
    anlist.innerHTML = '<div class="fh">Loading analog sheets…</div>';
    AN.lkey = null;
    loadData()
      .then(() => {
        let nm = AN._cur || null;
        try {
          nm = nm || localStorage.getItem('ditl.an.cur');
        } catch (e) {}
        let i = AN.sheets.findIndex(s => s.name === nm);
        if (i < 0) i = AN.sheets.findIndex(s => /057/.test(s.name));
        if (i < 0) i = 0;
        AN.i = i;
        AN.key = null;
        AN.lkey = null;
        render();
      })
      .catch(e => {
        AN.lkey = null;
        anlist.innerHTML = '<div class="fh">Could not load the sheets: ' + e.message + '</div>';
        msg('Analog sheets could not be loaded: ' + e.message);
      });
  } else {
    SIM = simSaved;
    SIDEKEY = null;
    AN.run = false;
    render();
  }
}
catB.forEach(x => x._u());
const stE = $('st'),
  stOld = stE.textContent,
  stAn =
    'Analog mode: click a block = inspect · click a digital input (tag or wire) = 1 / 0 · Drag = pan · Wheel / pinch = zoom · Space = run / pause · PageUp / PageDown = previous / next sheet · F = fit · Inputs and tuning are in the right panel (saved in this browser)';
/* ---------- wrapped render / drawSide ---------- */
const _render = render,
  _drawSide = drawSide;
render = function () {
  if (AN.cat !== 'an') {
    _render();
    return;
  }
  anRender();
};
drawSide = function () {
  if (AN.cat !== 'an') {
    _drawSide();
    return;
  }
  anSide();
};
const SC = () => document.getElementById('side');
function anIdx(sh) {
  if (sh._ix) return sh._ix;
  let S;
  try {
    S = ensure(sh);
  } catch (e) {
    return (sh._ix = []);
  }
  const used = new Set((S.addr || []).map(a => a.t)),
    seen = new Set(),
    o = [];
  for (const t of S.tx) {
    const s = String(t.t).trim();
    if (s.length < 2) continue;
    const k = s + '@' + Math.round(t.x) + ',' + Math.round(t.y);
    if (seen.has(k)) continue;
    seen.add(k);
    let d = '';
    try {
      if (AN.adesFind) {
        const a = AN.adesFind(sh, s);
        if (a) d = adesText(a.rec);
      }
    } catch (e) {}
    o.push({ t: s, x: t.x, y: t.y, d, u: used.has(t.t) || used.has(s) });
  }
  return (sh._ix = o);
}
function anLocate(i, x, y) {
  go(i);
  const sh = AN.sheets[i],
    svg = $('svg'),
    r = svg.getBoundingClientRect(),
    w = 90,
    h = r.width ? (w * r.height) / r.width : 60;
  AN.av[sh.name] = [x - w / 2, -y - h / 2, w, h];
  svg.setAttribute('viewBox', AN.av[sh.name].join(' '));
  try {
    const g = L && L.gb && L.gb.parentNode;
    if (g) {
      const c = el(
        'circle',
        {
          cx: x,
          cy: -y,
          r: 9,
          fill: 'none',
          stroke: '#ffe066',
          'stroke-width': 0.9,
          'stroke-dasharray': '3 2',
          'pointer-events': 'none'
        },
        g
      );
      c.append(Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'animate'), {}));
      const an = c.firstChild;
      an.setAttribute('attributeName', 'r');
      an.setAttribute('values', '14;8;14');
      an.setAttribute('dur', '1.2s');
      an.setAttribute('repeatCount', 'indefinite');
      setTimeout(() => c.remove(), 9000);
    }
  } catch (e) {}
}
function anHits(f) {
  const box = h$('div', { id: 'anhits' }),
    tok = (anHits.tok = (anHits.tok || 0) + 1);
  anlist.append(box);
  if (f.length < 2) return;
  const hd = h$('div', { cls: 'fh', txt: 'Found in the drawings: searching…' });
  box.append(hd);
  let k = 0,
    n = 0;
  const res = [];
  const step = () => {
    if (anHits.tok !== tok) return;
    const t0 = performance.now();
    while (k < AN.sheets.length && performance.now() - t0 < 40) {
      const sh = AN.sheets[k++],
        i = k - 1;
      if (/ABC-000/.test(sh.name)) continue;
      for (const e of anIdx(sh)) {
        if (e.t.toLowerCase().indexOf(f) >= 0 || (e.d && e.d.toLowerCase().indexOf(f) >= 0)) {
          n++;
          if (res.length < 300) res.push({ i, sh, e });
        }
      }
    }
    if (k < AN.sheets.length) {
      hd.textContent = 'Found in the drawings: searching ' + k + '/' + AN.sheets.length + '… (' + n + ')';
      setTimeout(step, 0);
      return;
    }
    hd.textContent =
      'Found in the drawings: ' +
      n +
      (n > res.length ? ' (first ' + res.length + ' shown)' : '') +
      (n ? '' : ' - nothing');
    let last = -1;
    for (const r of res) {
      if (r.i !== last) {
        last = r.i;
        box.append(h$('div', { cls: 'fh', style: 'opacity:.8', txt: r.sh.name + ' · ' + (r.sh.title || '') }));
      }
      const b = h$('button', { title: 'Open ' + r.sh.name + ' and point to this text' }, [
        h$('span', { cls: 'sn', txt: r.e.t + (r.e.u ? '  ·  used in the logic' : '  ·  text') }),
        h$('span', { cls: 'st', txt: r.e.d || '' })
      ]);
      b.onclick = () => {
        anLocate(r.i, r.e.x, r.e.y);
        AN.lookOnly(); /* 2.1.0-beta.8: a search hit opens for looking only */
      };
      box.append(b);
    }
  };
  setTimeout(step, 0);
}
AN.sm = (() => {
  let v = null;
  try {
    v = localStorage.getItem('ditl.an.sm');
  } catch (e) {}
  return v === 'cat' ? 'cat' : 'order';
})();
function anSortUi() {
  let d = document.getElementById('sidesort');
  if (!d) {
    d = h$('div', { id: 'sidesort' }, [
      h$('button', { id: 'ssOrd', txt: 'By order', title: 'One list in sheet-code order (000, 001A, 001B, 002 ...)' }),
      h$('button', { id: 'ssCat', txt: 'By category', title: 'Grouped by category, each group in order' })
    ]);
    $('sidebody').insertBefore(d, $('sidefl'));
    const set = m => {
      AN.sm = m;
      try {
        localStorage.setItem('ditl.an.sm', m);
      } catch (e) {}
      AN.lkey = null;
      anSide();
    };
    $('ssOrd').onclick = () => set('order');
    $('ssCat').onclick = () => set('cat');
  }
  $('ssOrd').classList.toggle('on', AN.sm === 'order');
  $('ssCat').classList.toggle('on', AN.sm === 'cat');
}
/* v1.20.17 search bar in the toolbar: tag / description / address / memory over all sheets */
document.head.appendChild(
  h$('style', {
    txt: '#sidesort{display:none;gap:4px;margin:4px 0}body.an #sidesort{display:flex}#gsbar{display:flex;gap:8px;align-items:center;padding:4px 10px;background:var(--panel);border-bottom:1px solid var(--line)}#gsbar b{opacity:.8}#ansb{flex:1;max-width:560px;width:auto}#gscope{display:flex;gap:3px}#gscope button{padding:2px 8px}#gscope button.on{background:var(--acc,#2a6fdb);color:#fff}#sidesort button{flex:1;padding:3px 4px}#sidesort button.on{background:var(--acc,#2a6fdb);color:#fff}#ansb{background:#0b1013;color:var(--tx);border:1px solid var(--line);padding:3px 6px;font:inherit}#anfind{position:fixed;z-index:60;display:none;width:min(560px,96vw);max-height:62vh;overflow:auto;background:var(--panel);border:1px solid var(--line);box-shadow:0 6px 24px #000a;padding:4px}#anfind button{display:block;width:100%;text-align:left;margin:1px 0;padding:3px 6px}#anfind .sn{font-weight:700;margin-right:8px}#anfind .st{opacity:.8}'
  })
);
const ansb = h$('input', {
    type: 'search',
    id: 'ansb',
    placeholder: 'Search tag / description / address / memory…  (ABC + DITL)',
    autocomplete: 'off',
    title:
      'Global search over the ABC and the DITL sheets: tag name, description (IO list / memory list), address (AI0273, SI0054), memory (M.0221). Click a result to open the sheet and point to the text.'
  }),
  anfind = h$('div', { id: 'anfind' }),
  gsc = h$('span', { id: 'gscope' });
document.body.append(anfind);
{
  const gs = h$('div', { id: 'gsbar' }, [h$('b', { txt: 'Search' }), ansb, gsc]);
  const b0 = document.getElementById('bar');
  b0.parentNode.insertBefore(gs, b0);
}
AN.gsc = (() => {
  let v = null;
  try {
    v = localStorage.getItem('ditl.gsc');
  } catch (e) {}
  return v === 'abc' || v === 'dit' ? v : 'all';
})();
{
  let tm = 0,
    GT = null;
  const close = () => {
    anfind.style.display = 'none';
    anfind._tok = (anfind._tok || 0) + 1;
  };
  const scBtn = [
    ['all', 'All'],
    ['abc', 'ABC'],
    ['dit', 'DITL']
  ].map(([k, t]) => {
    const b = h$('button', {
      txt: t,
      title: 'Search ' + (k === 'all' ? 'ABC and DITL' : k === 'abc' ? 'the ABC sheets only' : 'the DITL sheets only')
    });
    b.onclick = () => {
      AN.gsc = k;
      try {
        localStorage.setItem('ditl.gsc', k);
      } catch (e) {}
      paint();
      if (ansb.value.trim().length >= 2) run();
    };
    gsc.append(b);
    return [k, b];
  });
  const paint = () => scBtn.forEach(([k, b]) => b.classList.toggle('on', AN.gsc === k));
  paint();
  /* description of a DITL text from the IO list: by tag, or by address (any station) */
  const gTag = () => {
    if (GT) return GT;
    GT = new Map();
    const A = ADES || {};
    for (const st in A)
      for (const k in A[st]) {
        const r = A[st][k];
        if (r && r.tag) {
          const u = String(r.tag).toUpperCase();
          if (!GT.has(u)) GT.set(u, r);
        }
      }
    return GT;
  };
  const dDesc = t => {
    const u = t.trim().toUpperCase();
    let r = gTag().get(u);
    if (!r && ADES) {
      const m =
        /^(?:S(d)s*)?([A-Z]{1,2}).([0-9A-F]{3,4})$/.exec(u) || /^(?:S(d)s*)?(TR|SI|SO|AI|AO|DI|DO|FP)(d{1,6})$/.exec(u);
      if (m) {
        const dot = /./.test(u) ? '.' : '',
          key = m[2] + dot + (m[3].length < 4 ? m[3].padStart(4, '0') : m[3]);
        for (const st in ADES) {
          if (m[1] && st !== m[1]) continue;
          if (ADES[st][key]) {
            r = ADES[st][key];
            break;
          }
        }
      }
    }
    return r ? adesText(r) : '';
  };
  const dIdx = s => {
    if (s._gx) return s._gx;
    const o = [],
      seen = new Set(),
      add = t => {
        const x = String(t.t == null ? '' : t.t).trim();
        if (x.length < 2) return;
        const k = x + '@' + Math.round(t.x) + ',' + Math.round(t.y);
        if (seen.has(k)) return;
        seen.add(k);
        o.push({ t: x, x: t.x, y: t.y, d: dDesc(x) });
      };
    try {
      for (const t of s.tx || []) add(t);
      for (const k in s.cells || {}) for (const t of s.cells[k]) add(t);
    } catch (e) {}
    return (s._gx = o);
  };
  const gOpen = async (kind, i, x, y) => {
    close();
    try {
      if (kind === 'abc') {
        const was = AN.cat === 'an',
          sv0 = document.getElementById('svg'),
          c0 = (sv0.getAttribute('viewBox') || '').split(' ').map(Number);
        if (!was) {
          setCat('an');
          await loadData();
        }
        const nm = AN.sheets[i].name;
        if (x == null) go(i);
        else {
          if (!was) delete AN.av[nm];
          go(i);
          const f0 = (sv0.getAttribute('viewBox') || '').split(' ').map(Number);
          anLocate(i, x, y);
          const r0 = sv0.getBoundingClientRect();
          let w0 = was && c0[2] > 0 ? c0[2] : Math.max(200, (f0[2] || 900) * 0.35),
            h0 = was && c0[3] > 0 ? c0[3] : r0.width ? (w0 * r0.height) / r0.width : w0 * 0.6;
          AN.av[nm] = [x - w0 / 2, -y - h0 / 2, w0, h0];
          sv0.setAttribute('viewBox', AN.av[nm].join(' '));
        }
      } else {
        const wasD = AN.cat !== 'an',
          sv_ = document.getElementById('svg'),
          c1 = (sv_.getAttribute('viewBox') || '').split(' ').map(Number);
        if (AN.cat === 'an') setCat('dig');
        S.cur = i;
        sel = null;
        if (x != null) {
          if (!VB[i] || !wasD) {
            delete VB[i];
            render();
          }
          const f1 = (sv_.getAttribute('viewBox') || '').split(' ').map(Number),
            r = sv_.getBoundingClientRect(),
            w = wasD && c1[2] > 0 ? c1[2] : Math.max(120, (f1[2] || 480) * 0.35),
            h = wasD && c1[3] > 0 ? c1[3] : r.width ? (w * r.height) / r.width : 60;
          VB[i] = [x - w / 2, -y - h / 2, w, h];
        }
        render();
        if (x != null) {
          const t0 = Date.now(),
            ring = () => {
              if (Date.now() - t0 > 9000) return;
              if (!sv_.querySelector('.gsring')) {
                const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttribute('class', 'gsring');
                c.setAttribute('cx', x);
                c.setAttribute('cy', -y);
                c.setAttribute('r', 12);
                c.setAttribute('fill', 'none');
                c.setAttribute('stroke', '#ffe066');
                c.setAttribute('stroke-width', '.9');
                c.setAttribute('stroke-dasharray', '3 2');
                c.setAttribute('pointer-events', 'none');
                sv_.appendChild(c);
              }
              setTimeout(ring, 300);
            };
          ring();
        }
      }
      AN.lookOnly(); /* 2.1.0-beta.8 (user): a search result opens for looking only (no force / simulate) */
    } catch (e) {
      msg('Could not open: ' + e.message);
    }
  };
  const run = async () => {
    const q = ansb.value.trim().toLowerCase();
    if (q.length < 2) {
      close();
      return;
    }
    const toks = q.split(/s+/),
      tok = (anfind._tok = (anfind._tok || 0) + 1),
      r = ansb.getBoundingClientRect();
    anfind.style.left = Math.max(4, Math.min(r.left, innerWidth - Math.min(600, innerWidth * 0.96) - 4)) + 'px';
    anfind.style.top = r.bottom + 4 + 'px';
    anfind.style.display = 'block';
    anfind.innerHTML = '';
    const hd = h$('div', { cls: 'fh', txt: 'Searching…' });
    anfind.append(hd);
    try {
      await adesLoad();
    } catch (e) {}
    try {
      await loadData();
    } catch (e) {}
    if (anfind._tok !== tok) return;
    const jobs = [];
    if (AN.gsc !== 'dit') anOrd().forEach(i => jobs.push(['abc', i]));
    if (AN.gsc !== 'abc') S.sheets.forEach((s, i) => jobs.push(['dit', i]));
    let k = 0;
    const cnt = { abc: 0, dit: 0 },
      last = { abc: -1, dit: -1 },
      shown = { abc: 0, dit: 0 };
    const CAP = 200;
    const step = () => {
      if (anfind._tok !== tok) return;
      const t0 = performance.now();
      while (k < jobs.length && performance.now() - t0 < 30) {
        const [kind, i] = jobs[k++],
          sh = kind === 'abc' ? AN.sheets[i] : S.sheets[i];
        if (!sh) continue;
        const tag = kind === 'abc' ? 'ABC' : 'DITL';
        if ((sh.name + ' ' + (sh.title || '')).toLowerCase().indexOf(q) >= 0) {
          const b = h$('button', { title: 'Open ' + sh.name }, [
            h$('span', { cls: 'sn', txt: sh.name }),
            h$('span', { cls: 'st', txt: tag + ' sheet · ' + (sh.title || '') })
          ]);
          b.onclick = () => gOpen(kind, i);
          anfind.append(b);
        }
        if (kind === 'abc' && /ABC-000/.test(sh.name)) continue;
        let ix;
        try {
          ix = kind === 'abc' ? anIdx(sh) : dIdx(sh);
        } catch (e) {
          continue;
        }
        for (const e of ix) {
          const hay = (e.t + ' ' + (e.d || '')).toLowerCase();
          if (!toks.every(t => hay.indexOf(t) >= 0)) continue;
          cnt[kind]++;
          if (shown[kind] >= CAP) continue;
          shown[kind]++;
          if (last[kind] !== i) {
            last[kind] = i;
            anfind.append(
              h$('div', { cls: 'fh', style: 'opacity:.8', txt: tag + ' · ' + sh.name + ' · ' + (sh.title || '') })
            );
          }
          const b = h$('button', { title: 'Open ' + sh.name + ' and point to this text' }, [
            h$('span', { cls: 'sn', txt: e.t + (kind === 'abc' && e.u ? '  ·  used in the logic' : '') }),
            h$('span', { cls: 'st', txt: e.d || '' })
          ]);
          b.onclick = () => gOpen(kind, i, e.x, e.y);
          anfind.append(b);
        }
      }
      const tot = cnt.abc + cnt.dit;
      hd.textContent =
        k < jobs.length
          ? 'Searching ' + k + '/' + jobs.length + '… (' + tot + ')'
          : tot
            ? 'Found: ABC ' +
              cnt.abc +
              ' · DITL ' +
              cnt.dit +
              (cnt.abc > CAP || cnt.dit > CAP ? ' (first ' + CAP + ' of each shown)' : '')
            : 'Nothing found in the drawings';
      if (k < jobs.length) setTimeout(step, 0);
      else listHits(q, toks, tok);
    };
    setTimeout(step, 0);
  };
  /* records of the IO list / memory list that are not necessarily on a drawing: click = search its tag / address */
  const listHits = (q, toks, tok) => {
    if (!ADES || anfind._tok !== tok) return;
    const res = [];
    for (const st in ADES)
      for (const key in ADES[st]) {
        const r = ADES[st][key];
        if (!r) continue;
        const hay = (key + ' ' + (r.tag || '') + ' ' + (r.d || '') + ' ' + (r.r || '')).toLowerCase();
        if (toks.every(t => hay.indexOf(t) >= 0)) {
          res.push([st, key, r]);
          if (res.length >= 60) break;
        }
      }
    if (!res.length) return;
    anfind.append(
      h$('div', {
        cls: 'fh',
        txt:
          'IO list / memory list (' + (res.length >= 60 ? 'first 60' : res.length) + '): click = find where it is drawn'
      })
    );
    for (const [st, key, r] of res) {
      const b = h$('button', { title: 'Search this in the drawings' }, [
        h$('span', { cls: 'sn', txt: 'S' + st + ' ' + key + (r.tag ? '  ·  ' + r.tag : '') }),
        h$('span', { cls: 'st', txt: r.d || '' })
      ]);
      b.onclick = () => {
        ansb.value = r.tag || key;
        run();
      };
      anfind.append(b);
    }
  };
  ansb.addEventListener('input', () => {
    clearTimeout(tm);
    tm = setTimeout(run, 160);
  });
  ansb.addEventListener('focus', () => {
    if (ansb.value.trim().length >= 2 && anfind.style.display !== 'block') run();
  });
  ansb.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      close();
      ansb.blur();
    } else if (e.key === 'Enter') {
      clearTimeout(tm);
      run();
    }
  });
  document.addEventListener(
    'mousedown',
    e => {
      if (e.target !== ansb && !anfind.contains(e.target)) close();
    },
    true
  );
  AN.find = run;
}
document.head.appendChild(
  Object.assign(document.createElement('style'), {
    id: 'skin',
    textContent:
      "\n:root{--panel:#111b27;--line:#243447;--tx:#dbe6f0;--dim:#8398ab;--r:8px;--panel2:#16232f;--in:#0b1320;--bd:#2b4259;--hv:#17283a;--hv2:#1c2e40;--rowl:#162230;--sel2:#1f6fb2;--sbg:linear-gradient(#142131,#111b27)}\nhtml[data-ui=graphite]{--panel:#1a1c1f;--line:#33373c;--tx:#e4e6e8;--dim:#9096a0;--panel2:#23262a;--in:#121416;--bd:#3d4247;--hv:#262a2e;--hv2:#2d3237;--rowl:#202326;--sel2:#4a5a6a;--sbg:linear-gradient(#202326,#1a1c1f)}\nhtml[data-ui=contrast]{--panel:#000;--line:#fff;--tx:#fff;--dim:#e0e0e0;--panel2:#000;--in:#000;--bd:#fff;--hv:#222;--hv2:#333;--rowl:#555;--sel2:#0050ff;--sbg:#000}\nhtml[data-ui=contrast] button,html[data-ui=contrast] select,html[data-ui=contrast] label.b{border-width:2px}\n#uisel{margin-left:auto}#stchip{display:flex;gap:6px;align-items:center}#stchip span{padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;background:var(--panel2);border:1px solid var(--bd);color:var(--dim);white-space:nowrap}#stchip span.run{background:rgba(79,209,139,.15);border-color:var(--acc);color:var(--acc)}#stchip span.view{background:rgba(56,201,255,.12);border-color:var(--sel);color:var(--sel)}\n\nhtml,body{font:13px/1.35 Inter,'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;-webkit-font-smoothing:antialiased}\n#gsbar{background:var(--sbg)!important;border-bottom:1px solid var(--line)!important;padding:7px 12px!important;gap:10px!important}\n#gsbar b{font-weight:700;letter-spacing:.02em;opacity:1!important;color:#fff}\n#ansb{border-radius:var(--r)!important;background:var(--in)!important;border:1px solid var(--bd)!important;padding:7px 12px!important;transition:border-color .15s,box-shadow .15s}\n#ansb:focus{outline:0;border-color:var(--sel)!important;box-shadow:0 0 0 3px rgba(56,201,255,.18)}\n#gscope{background:var(--in);border:1px solid var(--bd);border-radius:var(--r);padding:2px;gap:2px!important}\n#gscope button{border:0!important;background:transparent!important;border-radius:6px;padding:4px 12px!important;color:var(--dim)}\n#gscope button.on{background:var(--sel2)!important;color:#fff!important}\n#bar{background:var(--panel)!important;padding:8px 12px!important;gap:8px!important;border-bottom:1px solid var(--line)!important}\nbutton,label.b{background:var(--panel2);border:1px solid var(--bd);border-radius:var(--r);padding:6px 12px;transition:background .12s,border-color .12s,transform .05s}\nbutton:hover,label.b:hover{background:var(--hv2);border-color:#4a7aa5}\nbutton:active,label.b:active{transform:translateY(1px)}\nbutton.on{background:rgba(79,209,139,.12);border-color:var(--acc);color:var(--acc)}\nbutton:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--sel);outline-offset:1px}\nselect{background:var(--panel2);color:var(--tx);border:1px solid var(--bd);border-radius:var(--r);padding:5px 8px;font:inherit}\n#meta{background:var(--panel)!important;border-bottom:1px solid var(--line)!important;padding:10px 18px!important}\n#m_title{font-size:17px;letter-spacing:.05em}\n#side{background:var(--panel)!important;border-right:1px solid var(--line)!important}\n#sidehd{padding:9px 10px!important;border-bottom:1px solid var(--line)!important}\n#sidehd b{font-size:12px!important;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)!important}\n#sidelist button{border-radius:0;border-bottom:1px solid var(--rowl)!important;padding:8px 12px!important}\n#sidelist button:hover{background:var(--hv)!important}\n#sidelist button.on{background:linear-gradient(90deg,rgba(31,111,178,.35),rgba(31,111,178,.08))!important;color:#fff!important;border-left-color:var(--sel)!important}\n#sidelist button.on .st{color:#a9c9e4!important}\n#sidelist button .sn{font-weight:650}\n#sidelist{scrollbar-width:thin;scrollbar-color:var(--bd) transparent}\n#sidesort button.on,#sidefl{border-radius:var(--r)}\n#st{background:var(--panel)!important;border-top:1px solid var(--line)!important;padding:6px 14px!important;font:12px Inter,'Segoe UI',system-ui,sans-serif!important}\n#ed,#wp,#tp,#hp,#toast,#anfind{border-radius:12px!important;box-shadow:0 12px 36px rgba(0,0,0,.55)!important;background:var(--panel)!important;border-color:var(--bd)!important}\n#anfind button:hover{background:var(--hv)}\n*::-webkit-scrollbar{width:9px;height:9px}*::-webkit-scrollbar-thumb{background:var(--bd);border-radius:6px}*::-webkit-scrollbar-track{background:transparent}\n"
  })
);

{
  const UIS = [
    ['eng', 'Engineering'],
    ['graphite', 'Graphite'],
    ['contrast', 'High contrast']
  ];
  let cur = 'eng';
  try {
    cur = localStorage.getItem('ditl.ui') || 'eng';
  } catch (e) {}
  if (!UIS.some(x => x[0] === cur)) cur = 'eng';
  const apply = v => {
    if (v === 'eng') document.documentElement.removeAttribute('data-ui');
    else document.documentElement.setAttribute('data-ui', v);
  };
  apply(cur);
  const sel = document.createElement('select');
  sel.id = 'uisel';
  sel.title = 'Look of the toolbars and panels only (the diagram colours are not changed)';
  UIS.forEach(([k, n]) => {
    const o = document.createElement('option');
    o.value = k;
    o.textContent = 'UI: ' + n;
    sel.append(o);
  });
  sel.value = cur;
  sel.onchange = () => {
    apply(sel.value);
    try {
      localStorage.setItem('ditl.ui', sel.value);
    } catch (e) {}
  };
  const chip = document.createElement('div');
  chip.id = 'stchip';
  const c1 = document.createElement('span'),
    c2 = document.createElement('span'),
    c3 = document.createElement('span');
  chip.append(c1, c2, c3);
  const gs = document.getElementById('gsbar');
  if (gs) {
    gs.append(chip, sel);
  }
  /* channel: Stable (released by the owner) or Beta (testing of the newest fixes, from a branch); the choice is remembered, so the apk / exe (which open the Stable address) go to the chosen channel */
  try {
    const beta = /\/beta\/(index\.html)?$/.test(location.pathname);
    /* the apk / exe copy (file: or https://localhost) has the selector too: Beta opens the site's Beta page and remembers it (like the update question does) */
    const inApp =
      location.protocol === 'file:' ||
      (location.protocol === 'https:' && location.hostname === 'localhost' && !location.port);
    if (inApp || /\.github\.io$/.test(location.hostname)) {
      const SITE = 'https://ronanski.github.io/icms-master-tool/';
      const base = inApp ? SITE : location.pathname.replace(/beta\/(index\.html)?$/, '').replace(/index\.html$/, '');
      let ch = 'stable';
      try {
        ch = localStorage.getItem('logic.channel') || 'stable';
      } catch (e) {}
      if (!inApp && !beta && ch === 'beta') {
        location.replace(base + 'beta/');
      } else if (gs) {
        const cs = document.createElement('select');
        cs.id = 'chsel';
        cs.title = 'Stable = released by the owner. Beta = testing of the newest fixes. Your choice is remembered.';
        [
          ['stable', 'Channel: Stable'],
          ['beta', 'Channel: Beta']
        ].forEach(([v, t]) => {
          const o = document.createElement('option');
          o.value = v;
          o.textContent = t;
          cs.append(o);
        });
        /* apk / exe: the running channel is the copy that was opened (src/boot/update-question.js), not the web address */
        const runBeta = inApp ? /-beta\.\d+/.test(document.title) : beta;
        cs.value = runBeta ? 'beta' : 'stable';
        cs.onchange = () => {
          const ch = cs.value;
          try {
            localStorage.setItem('logic.channel', ch);
          } catch (e) {}
          if (!inApp) {
            location.href = base + (ch === 'beta' ? 'beta/' : '');
            return;
          }
          /* 1.22.0: inside the app the channel is DOWNLOADED and runs from the app (no Chrome, works without internet afterwards) */
          const st = (window.lsStore && window.lsStore()) || {};
          if (ch === 'stable' || !window.lsDownload) {
            location.reload();
            return;
          }
          /* 2.0.0: Beta always fetches the newest Beta first (online); the stored copy is used only when offline */
          msg('Downloading the newest Beta...');
          window
            .lsDownload(ch)
            .then(() => location.reload())
            .catch(e => {
              if (st[ch]) {
                location.reload();
                return;
              }
              msg('Beta download failed: ' + ((e && e.message) || 'no internet') + '. Internet is needed once.');
              try {
                localStorage.setItem('logic.channel', runBeta ? 'beta' : 'stable');
              } catch (x) {}
              cs.value = runBeta ? 'beta' : 'stable';
            });
        };
        gs.append(cs);
      }
    }
  } catch (e) {}
  const upd = () => {
    try {
      const an = AN.cat === 'an';
      let m,
        k = '';
      if (an) {
        m = AN.view ? 'VIEW / TRACE' : AN.run ? 'RUN' : 'PAUSED';
        k = AN.view ? 'view' : AN.run ? 'run' : '';
      } else {
        m = SIM ? 'SIMULATE' : 'EDIT';
        k = SIM ? 'run' : '';
      }
      c1.textContent = m;
      c1.className = k;
      const sh = an ? AN.sheets[AN.i] : S.sheets[S.cur];
      c2.textContent = sh && sh.name ? sh.name : '';
      c3.textContent = 'v@@VERSION@@';
    } catch (e) {}
  };
  upd();
  setInterval(upd, 400);
}
function anSide() {
  const sd = SC(),
    tg = $('sidetg');
  {
    const f = $('sidefl');
    if (f) {
      if (AN._ph === undefined) AN._ph = f.placeholder;
      f.placeholder = 'Search sheets (001A, 57, DRUM, FURNACE...)';
    }
  }
  sd.classList.toggle('min', SIDEMIN === '1');
  tg.textContent = SIDEMIN === '1' ? '▶' : '◀';
  $('sidect').textContent = 'Analog sheets (' + AN.sheets.length + ')';
  const c = cs();
  $('sidevt').textContent = c ? c.name + '  ·  ' + (anOrd().indexOf(AN.i) + 1) + '/' + AN.sheets.length : 'Analog';
  anSortUi();
  const key = AN.sheets.map(s => s.name).join('|') + '#' + AN.fl + '#' + AN.sm;
  if (key !== AN.lkey) {
    AN.lkey = key;
    anlist.innerHTML = '';
    const f = AN.fl.trim().toLowerCase(),
      G = {};
    anOrd().forEach(i => {
      const s = AN.sheets[i];
      if (f && (s.name + ' ' + (s.title || '') + ' ' + (s.fam || '')).toLowerCase().indexOf(f) < 0) return;
      (G[AN.sm === 'order' ? 'ALL' : s.fam || 'OTHER'] = G[AN.sm === 'order' ? 'ALL' : s.fam || 'OTHER'] || []).push(i);
    });
    (AN.sm === 'order' ? ['ALL'] : FAMS.concat(Object.keys(G).filter(k => !FAMS.includes(k)))).forEach(fm => {
      if (!G[fm]) return;
      if (AN.sm !== 'order') anlist.append(h$('div', { cls: 'fh', txt: fm + ' (' + G[fm].length + ')' }));
      G[fm].forEach(i => {
        const s = AN.sheets[i],
          b = h$('button', { 'data-i': i, title: s.name + (s.title ? ' - ' + s.title : '') }, [
            h$('span', { cls: 'sn', txt: s.name + (s.no ? '  ·  ' + s.no : '') }),
            h$('span', { cls: 'st', txt: s.title || '' })
          ]);
        b.onclick = () => {
          go(i);
          if (innerWidth < 820) {
            SIDEMIN = '1';
            try {
              localStorage.setItem('ditl.side', '1');
            } catch (e) {}
          }
        };
        anlist.append(b);
      });
    });
  }
  let on = null;
  anlist.querySelectorAll('button').forEach(b => {
    const o = +b.dataset.i === AN.i;
    b.classList.toggle('on', o);
    if (o) on = b;
  });
  if (on && SIDEMIN !== '1' && anSide.last !== AN.i) on.scrollIntoView({ block: 'nearest' });
  anSide.last = AN.i;
}
$('sidefl').addEventListener(
  'input',
  e => {
    if (AN.cat === 'an') {
      AN.fl = e.target.value;
      anSide();
      e.stopImmediatePropagation();
    }
  },
  true
);
function anOrd() {
  const k = AN.sheets.map(s => s.name + (s.imp ? '*' : '')).join('|');
  if (anOrd.k === k) return anOrd.a;
  const key = s => {
    const m = /^ABC-(\d+)([A-Z]*)/.exec(s.name);
    return m ? [s.imp ? 2 : 0, +m[1], m[2], s.name] : [s.imp ? 2 : 1, 0, '', s.name];
  };
  const a = AN.sheets
    .map((s, i) => i)
    .sort((p, q) => {
      const x = key(AN.sheets[p]),
        y = key(AN.sheets[q]);
      return (
        x[0] - y[0] ||
        x[1] - y[1] ||
        (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0) ||
        (x[3] < y[3] ? -1 : x[3] > y[3] ? 1 : 0)
      );
    });
  anOrd.k = k;
  anOrd.a = a;
  return a;
}
function anNb(d) {
  const o = anOrd(),
    p = o.indexOf(AN.i),
    j = o[p + d];
  return j;
}
function go(i) {
  if (i == null || i < 0 || i >= AN.sheets.length) return;
  if (AN.p2 && AN.p2 === AN.sheets[i]) {
    p2Close();
    msg('Second pane closed: the same sheet cannot be open twice');
  }
  AN.i = i;
  AN.sel = null;
  AN.key = null;
  try {
    localStorage.setItem('ditl.an.cur', AN.sheets[i].name);
  } catch (e) {}
  KV.set('cur', AN.sheets[i].name);
  WN.put('cur', AN.sheets[i].name);
  persistAll();
  render();
}
bBk.onclick = () => goBack();
bPv.onclick = () => go(anNb(-1));
bNx.onclick = () => go(anNb(1));
sSh.onchange = () => go(+sSh.value);
/* ---------- canvas ---------- */
