/* SEARCH INFO CARD (1.23.0): type an address or tag in the global search and press Enter (or ⓘ). The card tells, from the
   netlist of the drawings: where the signal comes from, which blocks use it (0 = display only), what it reaches downstream
   (force manual of a controller, TRIP / MFT / STOP outputs, TO DITL, other sheets), and where it is on the DITL page.
   Read only: it never changes a value. */
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
  const norm = t =>
    String(t || '')
      .trim()
      .toUpperCase()
      .replace(/^S\d\s+/, '');
  const looks = q => /^[A-Z0-9][A-Z0-9_.\-]{2,}$/.test(q);
  const TRIP = /TRIP|MFT|SHUT\s*DOWN|\bSTOP\b|ESD|EMERG|BLACK\s*OUT|RUN\s*BACK/i;
  const val = (S, n) => {
    const x = S.rt.v[n];
    if (S.nets[n] && S.nets[n].dig) return x > 0.5 ? '1' : '0';
    if (x == null || !isFinite(x)) return '—';
    return Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(2);
  };
  const bname = b => (b.k + ' ' + (b.txt || []).filter(Boolean).join(' ')).trim();
  function occurrences(q) {
    const out = [];
    for (const sh of AN.sheets || []) {
      if (/ABC-000/.test(sh.name)) continue;
      let S;
      try {
        S = AN.ensure(sh);
        AN.linksOf(sh); /* the links of the sheet mark the inputs that come from another sheet */
      } catch (e) {
        continue;
      }
      for (let n = 0; n < S.nets.length; n++) {
        const nm = (AN.nm(S, n) || '').trim();
        if (nm && norm(nm) === q) out.push({ sh, S, n, nm });
      }
    }
    return out;
  }
  function source(o) {
    const { S, n } = o,
      d = (S.drv[n] || []).filter(x => x.k !== 'LINK');
    if (d.length) {
      const b = S.blk.find(z => z.id === d[0].id);
      const ins = b
        ? (b.i || [])
            .filter(i => i != null && i >= 0)
            .slice(0, 8)
            .map(i => ({ nm: AN.nm(S, i) || 'net', v: val(S, i), dig: !!(S.nets[i] && S.nets[i].dig) }))
        : [];
      return { k: 'logic', txt: 'computed here by ' + (b ? bname(b) : d[0].k), ins };
    }
    const l = S.xlk && S.xlk[n];
    if (l) return { k: 'link', txt: l.ditl ? 'from DITL (' + (l.tag || '') + ')' : 'from ' + (l.from && l.from.name), ins: [] };
    if (S.ext.includes(n)) return { k: 'input', txt: 'sheet input (switch / slider / HMI)', ins: [] };
    return { k: 'copy', txt: 'copy of a circle on this sheet', ins: [] };
  }
  function readers(o) {
    const { S, n } = o;
    return (S.cns[n] || []).filter(b => b.k !== 'LINK').map(b => b);
  }
  /* downstream: every net reached inside the sheet, then what that means */
  function effects(o) {
    const { sh, S, n } = o,
      seen = new Set([n]),
      q = [n];
    for (let k = 0; k < q.length && k < 4000; k++) {
      for (const b of S.cns[q[k]] || [])
        for (const m of b.o || [])
          if (m != null && m >= 0 && !seen.has(m)) {
            seen.add(m);
            q.push(m);
          }
      for (const [d, sr] of S.link || [])
        if (sr === q[k] && !seen.has(d)) {
          seen.add(d);
          q.push(d);
        }
    }
    const fx = [];
    try {
      for (const c of AN.hmiCtrls(S) || []) {
        const z = (c.sigs || []).find(s => seen.has(s.n));
        if (z) fx.push({ k: z.role === 'MAN' ? 'fm' : 'auto', t: (z.role === 'MAN' ? 'FORCE MANUAL of ' : 'AUTO select of ') + c.tag + ' (' + z.name + ')' });
      }
    } catch (e) {}
    const tr = new Set();
    for (const m of seen) {
      const nm = (AN.nm(S, m) || '').trim();
      if (m !== n && nm && TRIP.test(nm)) tr.add(nm);
    }
    for (const t of S.tx || [])
      if (TRIP.test(t.t))
        for (const m of seen) {
          const nn = S.nets[m];
          if (!nn || !nn.segs.length || m === n) continue;
          let near = false;
          for (const i of nn.segs) {
            const g = S.seg[i];
            if (Math.min(Math.hypot(t.x - g.x1, t.y - g.y1), Math.hypot(t.x - g.x2, t.y - g.y2)) < 10) {
              near = true;
              break;
            }
          }
          if (near) {
            tr.add(t.t.trim());
            break;
          }
        }
    [...tr].slice(0, 6).forEach(t => fx.push({ k: 'trip', t: 'reaches: ' + t }));
    try {
      const ix = AN.dsIdx(sh);
      for (const [m, refs] of ix.to) if (seen.has(m)) fx.push({ k: 'ditl', t: 'TO DITL ' + refs.join(', ') + ' (' + AN.nm(S, m) + ')' });
    } catch (e) {}
    try {
      const os = new Set();
      for (const x of AN.sheets)
        for (const l of x.lk || []) if (l.from === sh && l.to !== sh && l.fromNets.some(m => seen.has(m))) os.add(l.to.name);
      if (os.size) fx.push({ k: 'sheet', t: 'also reaches sheet: ' + [...os].join(', ') });
    } catch (e) {}
    return fx;
  }
  function ditlPlaces(q) {
    const out = [];
    try {
      for (let i = 0; i < S.sheets.length; i++) {
        const s = S.sheets[i];
        for (const k in s.cells || {})
          if (s.cells[k].some(t => norm(t.t) === q)) {
            const [r, col] = k.split(':'),
              row = s.rows && s.rows[+r];
            out.push({ i, name: s.name, row: row ? row.n : +r + 1, side: /^R/.test(col) ? 'output' : 'input' });
          }
      }
    } catch (e) {}
    return out.slice(0, 12);
  }
  let card = null;
  function close() {
    if (card) card.remove();
    card = null;
  }
  function show(o) {
    close();
    const i = AN.sheets.indexOf(o.sh);
    if (AN.cat !== 'an') AN.setCat('an');
    AN.go(i);
    setTimeout(() => {
      try {
        AN.sel = { net: o.n };
        AN.selBox();
        AN.paint();
        AN.panelUpd(true);
      } catch (e) {}
    }, 300);
  }
  function open(raw) {
    const q = norm(raw);
    if (!looks(q) || !window.AN || !AN.sheets || !AN.sheets.length) return false;
    const oc = occurrences(q),
      dp = ditlPlaces(q);
    if (!oc.length && !dp.length) return false;
    close();
    const tag = oc.length ? oc[0].nm : raw.trim();
    let desc = '';
    for (const o of oc) {
      desc = (AN.descOf && AN.descOf(o.sh, o.nm)) || '';
      if (desc) break;
    }
    const body = E('div', { cls: 'icb' });
    card = E('div', { id: 'infocard' }, [
      E('div', { cls: 'ich' }, [
        E('b', { txt: tag }),
        E('span', { cls: 'icn', txt: oc.length + ' in ABC · ' + dp.length + ' in DITL' }),
        E('button', { cls: 'b', txt: '✕', title: 'Close', on: close })
      ]),
      desc ? E('div', { cls: 'icd', txt: desc }) : null,
      body
    ]);
    for (const o of oc.slice(0, 8)) {
      const src = source(o),
        rd = readers(o),
        fx = effects(o);
      const sec = E('div', { cls: 'ics' }, [
        E('div', { cls: 'ict' }, [
          E('b', { txt: o.sh.name }),
          E('span', { cls: 'icv', txt: '= ' + val(o.S, o.n) }),
          E('button', { cls: 'b', txt: 'Show', title: 'Open the sheet and select the wire', on: () => show(o) })
        ]),
        E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Source' }), src.txt]),
        src.ins.length
          ? E(
              'ul',
              { cls: 'icu' },
              src.ins.map(x => E('li', {}, [x.dig ? (x.v === '1' ? '■ ' : '□ ') : '· ', x.nm + ' = ' + x.v]))
            )
          : null,
        E('div', { cls: 'icl' }, [
          E('span', { cls: 'k', txt: 'Used by' }),
          rd.length ? rd.length + ' blocks' : 'NONE: display only, no logic reads it on this sheet'
        ]),
        rd.length ? E('ul', { cls: 'icu' }, rd.slice(0, 8).map(b => E('li', { txt: bname(b) }))) : null,
        E('div', { cls: 'icl' }, [
          E('span', { cls: 'k', txt: 'Trip?' }),
          fx.some(f => f.k === 'trip' || f.k === 'fm') ? E('span', { cls: 'tg t-trip', txt: 'AFFECTS' }) : E('span', { cls: 'tg t-ok', txt: 'no trip / force manual on this sheet' })
        ]),
        fx.length ? E('ul', { cls: 'icu' }, fx.map(f => E('li', { cls: 'f-' + f.k, txt: f.t }))) : null
      ]);
      body.append(sec);
    }
    if (dp.length)
      body.append(
        E('div', { cls: 'ics' }, [
          E('div', { cls: 'ict' }, [E('b', { txt: 'DITL' })]),
          E(
            'ul',
            { cls: 'icu' },
            dp.map(d =>
              E('li', {}, [
                d.name + ' · row ' + d.row + ' · ' + d.side + ' ',
                E('button', {
                  cls: 'b',
                  txt: 'Show',
                  on: () => {
                    close();
                    AN.setCat('dig');
                    S.cur = d.i;
                    render();
                  }
                })
              ])
            )
          )
        ])
      );
    document.body.append(card);
    return true;
  }
  window.lsInfo = open;
  let n = 0;
  const iv = setInterval(() => {
    const sb = $('ansb'),
      gs = document.querySelector('.gs-search');
    if (sb && !sb.dataset.info) {
      sb.dataset.info = '1';
      sb.addEventListener('keydown', e => {
        if (e.key === 'Enter' && open(sb.value)) {
          const f = $('anfind');
          if (f) f.style.display = 'none';
        }
        if (e.key === 'Escape') close();
      });
    }
    if (gs && !gs.querySelector('.infob')) {
      gs.append(
        E('button', {
          cls: 'b infob',
          txt: 'ⓘ',
          title: 'Info card: source, used by, trip? (address or tag in the search box)',
          on: () => {
            if (!open(($('ansb') || {}).value || '')) {
              const t = $('toast');
              try {
                msg('Type an address or tag (e.g. M.0228, AI0641, FICFW1007.MAN), then ⓘ or Enter');
              } catch (e) {}
            }
          }
        })
      );
    }
    if ((sb && gs && gs.querySelector('.infob')) || ++n > 80) clearInterval(iv);
  }, 300);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();
