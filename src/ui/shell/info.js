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
  /* downstream (2.1.0): every net the signal reaches, on this sheet and, through the links, on the other sheets; then what
     that means for the operator: TRIP / MFT, INTERLOCK (a selector after a controller output that cuts it to the back-up
     leg), selector switches that change leg, FORCE MANUAL / AUTO select of a controller, TO DITL. Read only. */
  function reach(S, starts) {
    const seen = new Set(starts),
      q = [...starts];
    for (let k = 0; k < q.length && k < 6000; k++) {
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
    return seen;
  }
  function sheetFx(sh, S, seen, own) {
    const fx = [];
    let cs = [];
    try {
      cs = AN.hmiCtrls(S) || [];
    } catch (e) {}
    const cutIds = new Set();
    for (const c of cs) {
      const z = (c.sigs || []).find(x => seen.has(x.n));
      if (z) fx.push({ k: z.role === 'MAN' ? 'fm' : 'auto', t: (z.role === 'MAN' ? 'FORCE MANUAL of ' : 'AUTO select of ') + c.tag + ' (' + z.name + ')' });
      for (const d of c.dn || [])
        if (d.sel != null && seen.has(d.sel)) {
          cutIds.add(d.id);
          fx.push({ k: 'ilk', t: 'INTERLOCK: cuts the output of ' + c.tag + ' to the back-up leg (' + (AN.nm(S, d.sel) || 'select') + ')' });
        }
    }
    const sws = S.blk.filter(b => (b.k === 'SW' || b.k === 'AMT') && !cutIds.has(b.id) && !cs.some(c => c.amt && c.amt.id === b.id) && ((b.cs && b.cs.some(x => seen.has(x.n))) || (b.sel != null && seen.has(b.sel))));
    if (sws.length)
      fx.push({
        k: 'sw',
        t: 'SWITCH: ' + sws.length + ' selector' + (sws.length > 1 ? 's change' : ' changes') + ' leg (' + sws.slice(0, 4).map(b => AN.nm(S, b.o[0]) || b.k + '#' + b.id).join(', ') + (sws.length > 4 ? ' …' : '') + ')'
      });
    const tr = new Set();
    for (const m of seen) {
      const nm = (AN.nm(S, m) || '').trim();
      if (!own.has(m) && nm && TRIP.test(nm)) tr.add(nm);
    }
    for (const t of S.tx || [])
      if (TRIP.test(t.t))
        for (const m of seen) {
          const nn = S.nets[m];
          if (!nn || !nn.segs.length || own.has(m)) continue;
          if (nn.segs.some(i => {
            const g = S.seg[i];
            return Math.min(Math.hypot(t.x - g.x1, t.y - g.y1), Math.hypot(t.x - g.x2, t.y - g.y2)) < 10;
          })) {
            tr.add(t.t.trim());
            break;
          }
        }
    [...tr].slice(0, 6).forEach(t => fx.push({ k: 'trip', t: 'TRIP / MFT: ' + t }));
    try {
      const ix = AN.dsIdx(sh);
      for (const [m, refs] of ix.to) if (seen.has(m)) fx.push({ k: 'ditl', t: 'TO DITL ' + refs.join(', ') + ' (' + AN.nm(S, m) + ')' });
    } catch (e) {}
    return fx;
  }
  function effects(o) {
    const out = [],
      done = new Set(),
      q = [[o.sh, [o.n], true]];
    for (let k = 0; k < q.length && done.size < 14; k++) {
      const [sh, starts, first] = q[k];
      if (done.has(sh)) continue;
      done.add(sh);
      let S;
      try {
        S = AN.ensure(sh);
      } catch (e) {
        continue;
      }
      const seen = reach(S, starts),
        fx = sheetFx(sh, S, seen, new Set(starts));
      fx.forEach(f => out.push(Object.assign(f, { sh: first ? '' : sh.name })));
      try {
        for (const x of AN.sheets)
          for (const l of x.lk || [])
            if (l.from === sh && l.to !== sh && !done.has(l.to) && l.fromNets.some(m => seen.has(m))) q.push([l.to, l.toNets, false]);
      } catch (e) {}
    }
    const uq = new Set();
    for (let i = out.length - 1; i >= 0; i--) {
      const key = out[i].sh + '|' + out[i].t;
      if (uq.has(key)) out.splice(i, 1);
      else uq.add(key);
    }
    const other = [...done].filter(x => x !== o.sh).map(x => x.name);
    if (other.length) out.push({ k: 'sheet', t: 'reaches the sheets: ' + other.join(', ') });
    return out;
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
  /* 2.1.0: the I/O list / memory list record, the marshalling wiring and the flow compensation of the address or tag */
  let ADS = null,
    TIX = null,
    WI = null;
  const ades = () => {
    if (!ADS && window.AN && AN.ades)
      AN.ades().then(a => {
        ADS = a || {};
        TIX = {};
        for (const st in ADS) for (const k in ADS[st]) {
          const r = ADS[st][k];
          if (r.tag) (TIX[r.tag.toUpperCase()] = TIX[r.tag.toUpperCase()] || []).push({ st, a: k, r });
        }
      });
    return ADS;
  };
  const wix = () => {
    if (WI || !window.WIRING) return WI;
    WI = { a: {}, t: {} };
    const F = window.WIRING_F;
    for (const w of window.WIRING) {
      const o = {};
      F.forEach((k, i) => (o[k] = w[i]));
      WI.a[o.s + '|' + o.a] = o;
      if (o.tag) (WI.t[o.tag.toUpperCase()] = WI.t[o.tag.toUpperCase()] || []).push(o);
    }
    return WI;
  };
  function ioRecs(q, stn) {
    const A = ades();
    if (!A) return [];
    const out = [];
    for (const st of stn ? [String(stn)] : Object.keys(A)) if (A[st] && A[st][q]) out.push({ st, a: q, r: A[st][q] });
    if (!out.length && TIX && TIX[q]) for (const x of TIX[q]) if (!stn || x.st === String(stn)) out.push(x);
    return out;
  }
  const sl = x => String(x || '').replace(/,/g, ' / ');
  /* the signal path as a small flow chart, from the field to the address (DO: from the address to the field) */
  function wireChart(o) {
    const steps = [
      ['FIELD', o.tag || '—', o.d || ''],
      ['JB → MPL field TB', o.mpl + ' · ' + (o.jb || '—'), 'TB ' + sl(o.tb)],
      ['CROSS WIRING', o.xcab || '—', (o.xspec ? o.xspec + ' · ' : '') + 'core ' + sl(o.xcore)],
      ['MPL system TB', o.mpl2 + ' · ' + o.tbs, 'TB ' + sl(o.tbn)],
      ['SYSTEM CABLE', o.cab, (o.spec ? o.spec + ' · ' : '') + 'core ' + sl(o.core)],
      ['FCS TERMINAL BOARD', o.ext + ' · ' + o.exttb, 'TB ' + sl(o.fcstb) + ' · cab ' + o.fcab],
      ['I/O MODULE', o.board, 'node ' + o.node + ' · slot ' + o.slot + ' · ' + o.ch],
      ['ADDRESS', o.a + ' · STN10' + o.s, o.sig || o.k]
    ];
    if (o.k === 'DO') steps.reverse();
    const box = E('div', { cls: 'icw' });
    steps.forEach((st, i) => {
      if (i) box.append(E('div', { cls: 'icwa', txt: '→' }));
      box.append(E('div', { cls: 'icwb' + (st[0] === 'ADDRESS' ? ' ad' : st[0] === 'FIELD' ? ' fd' : '') }, [E('small', { txt: st[0] }), E('b', { txt: st[1] }), st[2] ? E('span', { txt: st[2] }) : null]));
    });
    return box;
  }
  /* IRP / ARP / SER items (src/ui/plant/relay.js) by address (station|address) or tag */
  let RX = null;
  const relays = keys => {
    if (!RX && window.RELAY) {
      RX = {};
      for (const r of window.RELAY) for (const k of r.keys || []) (RX[k] = RX[k] || []).push(r);
    }
    if (!RX) return [];
    const out = [];
    for (const k of keys) for (const r of RX[k] || []) if (!out.includes(r)) out.push(r);
    return out;
  };
  window.lsRelayKeys = relays;
  function relaySec(r) {
    const kind = /^IRP/.test(r.sh) ? 'INTERPOSING RELAY' : /^ARP/.test(r.sh) ? 'ALARM / AUX RELAY' : 'SEQUENCE OF EVENTS (SER)';
    return E('div', { cls: 'ics' }, [
      E('div', { cls: 'ict' }, [E('b', { txt: kind + ' · ' + r.sh + ' item ' + r.item })]),
      ...Object.entries(r.cols).map(([k, v]) => E('div', { cls: 'icl' }, [E('span', { cls: 'k k2', txt: k }), v]))
    ]);
  }
  window.lsRelaySec = relaySec;
  window.lsRelayCard = r => {
    close();
    card = E('div', { id: 'infocard', cls: 'wide' }, [
      E('div', { cls: 'ich' }, [E('b', { txt: r.sh + ' #' + r.item }), E('span', { cls: 'icn', txt: (r.keys || []).map(k => k.replace(/^T\|/, '').replace(/^(\d)\|/, 'STN10$1 ')).join(' · ') }), E('button', { cls: 'b', txt: '✕', title: 'Close', on: close })]),
      E('div', { cls: 'icb' }, [relaySec(r)])
    ]);
    document.body.append(card);
  };
  function compOf(tag) {
    const C = window.CALC_COMP || [],
      t = String(tag || '').toUpperCase();
    return C.filter(c => [c.flow, c.ptag, c.ttag, c.ttag2].some(x => x && String(x).toUpperCase() === t));
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
  function open(raw, opt) {
    const q = norm(raw),
      stn = opt && opt.stn;
    if (!looks(q) || !window.AN || !AN.sheets || !AN.sheets.length) return false;
    const oc = occurrences(q),
      dp = ditlPlaces(q),
      io = ioRecs(q, stn),
      W = wix(),
      wr = [];
    if (W) {
      for (const x of io) if (W.a[x.st + '|' + x.a]) wr.push(W.a[x.st + '|' + x.a]);
      if (!wr.length && W.t[q]) for (const o of W.t[q]) if (!stn || o.s === String(stn)) wr.push(o);
    }
    const cp = compOf(io.length && io[0].r.tag ? io[0].r.tag : q),
      rl = relays([...io.map(x => x.st + '|' + x.a), ...io.filter(x => x.r.tag).map(x => 'T|' + x.r.tag), 'T|' + q, ...(stn ? [stn + '|' + q] : ['1', '2', '3', '4', '5'].map(st => st + '|' + q))]);
    if (!oc.length && !dp.length && !io.length && !wr.length && !cp.length && !rl.length) return false;
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
        E('span', { cls: 'icn', txt: oc.length + ' in ABC · ' + dp.length + ' in DITL' + (wr.length ? ' · wiring' : '') }),
        E('button', { cls: 'b', txt: '✕', title: 'Close', on: close })
      ]),
      desc ? E('div', { cls: 'icd', txt: desc }) : null,
      body
    ]);
    for (const x of io.slice(0, 5)) {
      const r = x.r,
        rg = r.lo != null || r.hi != null ? r.lo + ' ~ ' + r.hi + (r.u ? ' ' + r.u : '') : r.u || '';
      body.append(
        E('div', { cls: 'ics' }, [
          E('div', { cls: 'ict' }, [E('b', { txt: (r.k === 'io' ? 'I/O LIST' : 'MEMORY LIST') + ' · STN10' + x.st }), E('span', { cls: 'icv', txt: x.a })]),
          r.tag ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Tag' }), r.tag]) : null,
          r.d ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Description' }), r.d]) : null,
          rg ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Range' }), rg]) : null,
          r.t || r.ab ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Type' }), [r.t, r.ab ? 'SIG.AB ' + r.ab : ''].filter(Boolean).join(' · ')]) : null,
          r.r ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Remark' }), r.r]) : null
        ])
      );
    }
    if (wr.length) card.classList.add('wide');
    for (const o of wr.slice(0, 3))
      body.append(E('div', { cls: 'ics' }, [E('div', { cls: 'ict' }, [E('b', { txt: o.k === 'DO' ? 'WIRING · controller → field (output)' : 'WIRING · field → controller' })]), wireChart(o)]));
    for (const r of rl.slice(0, 4)) body.append(relaySec(r));
    for (const c of cp)
      body.append(
        E('div', { cls: 'ics' }, [
          E('div', { cls: 'ict' }, [E('b', { txt: 'FLOW COMPENSATION · ' + c.stn }), E('span', { cls: 'icv', txt: c.flow })]),
          E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Flow' }), c.flow + ' · ' + c.desc]),
          c.ptag ? E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Pressure' }), c.ptag + ' (FS ' + c.pfs + ', BS ' + c.pbs + ', design ' + c.pop + ') · ap ' + c.ap + ' · bp ' + c.bp]) : null,
          E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Temperature' }), [c.ttag, c.ttag2].filter(Boolean).join(' / ') + ' (FS ' + c.tfs + ', BS ' + c.tbs + ', design ' + c.top + ' °C, abs ' + c.abs + ') · at ' + (+c.at).toFixed(4) + ' · bt ' + (+c.bt).toFixed(4)]),
          E('div', { cls: 'icl' }, [E('span', { cls: 'k', txt: 'Atmosphere' }), c.atm + ' kg/cm2'])
        ])
      );
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
          E('span', { cls: 'k', txt: 'Effects' }),
          fx.some(f => f.k === 'trip')
            ? E('span', { cls: 'tg t-trip', txt: 'TRIP' })
            : null,
          fx.some(f => f.k === 'ilk') ? E('span', { cls: 'tg t-ilk', txt: 'INTERLOCK' }) : null,
          fx.some(f => f.k === 'fm') ? E('span', { cls: 'tg t-fm', txt: 'FORCE MANUAL' }) : null,
          fx.some(f => f.k === 'sw') ? E('span', { cls: 'tg t-sw', txt: 'SWITCH' }) : null,
          fx.some(f => ['trip', 'ilk', 'fm', 'sw'].includes(f.k)) ? null : E('span', { cls: 'tg t-ok', txt: 'no trip, interlock or force manual (all sheets it reaches)' })
        ]),
        fx.length ? E('ul', { cls: 'icu' }, fx.map(f => E('li', { cls: 'f-' + f.k, txt: (f.sh ? f.sh + ': ' : '') + f.t }))) : null
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
  setTimeout(ades, 3000);
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
