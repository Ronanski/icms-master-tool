/* ---------- v1.13.0 F: step / view / trace / why ---------- */
{
  const st = document.createElement('style');
  st.textContent =
    'body.anview #anp input,body.anview #anp select,body.anview #anp button:not(.keep){pointer-events:none;opacity:.45}body.anview #anp .keep{opacity:1}#anp .tr{cursor:pointer}#anp .tr:hover{background:var(--c-runsoft)}#anp .why{background:var(--c-pane);border-left:3px solid var(--acc);padding:4px 6px;margin:4px 0;color:var(--tx)}';
  document.head.append(st);
}
/* trace = the wire takes a solid colour (2.3.0: no glow): white = selected, blue = upstream, magenta = downstream */ const TUP =
    '#3aa0ff',
  TDN = '#ff2fd0',
  TST = '#ffffff',
  TFL = '#ffffff';
AN.view = true;
AN.allLegs = false;
document.body.classList.add('anview');
bVw.classList.add('on');
function fmtT(t) {
  return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
}
function snapSet(sh) {
  return actSet(sh).map(x => ({ x, rt: structuredClone(x.S.rt) }));
}
function histRec(sh, auto) {
  const H = (sh._hs = sh._hs || []),
    t = sh.S.rt.t,
    l = H[H.length - 1];
  if (l && (auto ? t - l.t < 1 - 1e-9 : Math.abs(t - l.t) < 1e-9)) return;
  H.push({ t, snap: snapSet(sh) });
  const cap = Math.max(20, Math.min(600, Math.floor(3000 / Math.max(1, H[H.length - 1].snap.length))));
  while (H.length > cap) H.shift();
}
function setRun(on) {
  AN.run = on;
  bRun.textContent = on ? '❚❚ Pause' : '▶ Run';
  bRun.classList.toggle('on', on);
  stepUi();
}
function stepUi() {
  const en = !AN.view && !AN.run;
  for (const b of [bSb, bSn, sStp]) if (b.disabled === en) b.disabled = !en;
}
function stepFwd() {
  if (AN.run || AN.view) return;
  const sh = cs();
  if (!sh || !sh.S) return;
  const sec = +sStp.value,
    ch = sec <= 10 ? 0.1 : 0.25,
    n = Math.round(sec / ch);
  histRec(sh, 0);
  for (let i = 0; i < n; i++) stepSet(sh, ch);
  paint();
  panelUpd();
  msg('Next ▶ +' + sec + ' s → t = ' + fmtT(sh.S.rt.t));
}
function stepBack() {
  if (AN.run || AN.view) return;
  const sh = cs();
  if (!sh || !sh.S) return;
  const sec = +sStp.value,
    H = sh._hs || [];
  if (!H.length) {
    msg('Nothing to go back to yet: press Run or Next ▶ first.');
    return;
  }
  const tg = Math.max(0, sh.S.rt.t - sec);
  let k = -1;
  for (let i = H.length - 1; i >= 0; i--)
    if (H[i].t <= tg + 1e-6) {
      k = i;
      break;
    }
  let note = '';
  if (k < 0) {
    k = 0;
    note = ' (start of the history)';
  }
  const e = H[k];
  H.length = k + 1;
  for (const q of e.snap) {
    q.x.S.rt = structuredClone(q.rt);
    q.x.S._tk = null;
    q.x.S._dk = null;
  }
  let rem = tg - sh.S.rt.t;
  while (rem > 1e-6) {
    const d = Math.min(rem > 10 ? 0.25 : 0.1, rem);
    stepSet(sh, d);
    rem -= d;
  }
  buildPanel();
  paint();
  panelUpd(true);
  msg('◀ Back: t = ' + fmtT(sh.S.rt.t) + note);
}
bSn.onclick = stepFwd;
bSb.onclick = stepBack;
function viewSet(on) {
  AN.view = on;
  bVw.classList.toggle('on', on);
  document.body.classList.toggle('anview', on);
  if (on) setRun(false);
  else stepUi();
  const sh = cs();
  if (sh && sh.S) sh.S._tk = null;
  paint();
  const d = $('ansel');
  if (d) selUpd(d);
  msg(
    on
      ? 'View mode: grey drawing, nothing is simulated. Click a block or wire to trace it; click an empty place to clear.'
      : 'Simulation mode: Run, or Pause + Next / Back.' +
          /* 3.2.0-beta.6 (audit M4): until a starting state is picked the plant is at the drawings' defaults (0 MW) */
          (AN.startState ? '' : ' No starting state yet: Run starts the plant cold (boiler off), or pick Start ▾ in the PLANT VIEW (At 150 MW, Cold, Warm, Hot).')
  );
}
bVw.onclick = () => viewSet(!AN.view);
stepUi();
/* 3.2.0-beta.12 (user 2026-10-23: "patay pa naman ang boiler mo, di mo pa iniistart diba? bkt may value na si MSP?"): RUN with no starting
   state picked starts the plant COLD (boiler off: drum 0 kg/cm2, no fire, fans stopped), as Start > Cold. Before, the plant ran at the
   drawings' defaults: an undriven transmitter sits at the middle of its range (MSP 75 kg/cm2 = middle of PT-MS1002 0 ~ 150). Only the
   operator's RUN press does this; AN.viewSet (the tests) is unchanged. */
function coldIfNone() {
  if (AN.startState || AN.cat !== 'an' || !AN.plantCold) return false;
  try {
    AN.reset();
    AN.plantCold();
    AN.startState = 'plantCold';
    return true;
  } catch (e) {
    return false;
  }
}
const COLD_MSG = 'No starting state was picked: the plant starts COLD (boiler off, drum 0 kg/cm2, no fire, fans stopped). Pick Start ▾ in the PLANT VIEW for At 150 MW, Warm or Hot.';
bRun.onclick = () => {
  const c = !AN.run && coldIfNone();
  if (AN.view) {
    viewSet(false);
    setRun(true);
    if (c) msg(COLD_MSG);
    return;
  }
  setRun(!AN.run);
  if (c) msg(COLD_MSG);
};
function wsIn(o) {
  if (o && typeof o === 'object' && o.wv !== 2) o = Object.assign({}, o, { as: 'solid', wv: 2 });
  Object['assign'](AN.ws, o);
}
function trSet(sh) {
  if (!AN.view || !AN.sel) return null;
  const S = sh.S,
    s = AN.sel,
    key =
      (s.net != null ? 'n' + s.net + (s.nets ? '_' + s.nets.join('_') : '') : 'b' + (s.blk && s.blk.id)) +
      '|' +
      (S._dk || '') +
      '|' +
      (AN.allLegs ? 1 : 0);
  if (S._tk === key) return S._ts;
  const start = new Set(),
    up = new Set(),
    dn = new Set(),
    upL = [],
    dnL = [];
  const ups =
      s.net != null
        ? s.nets && s.nets.length
          ? s.nets.slice()
          : [s.net]
        : s.blk.pins.filter(p => p.role === 'in').map(p => p.n),
    dns = s.net != null ? (s.nets && s.nets.length ? s.nets.slice() : [s.net]) : s.blk.o.slice();
  ups.concat(dns).forEach(n => start.add(n));
  const off = (b, n) => {
    if (AN.allLegs || (b.k !== 'SW' && b.k !== 'AMT') || b.a === b.b) return false;
    const q = S.rt.st[b.id];
    return q && q.pk === 'B' ? n === b.a : n === b.b;
  };
  ups.forEach(n => up.add(n));
  let fr = ups.slice(),
    g = 0;
  while (fr.length && g++ < 500) {
    const nx = [];
    for (const n of fr) {
      for (const b of S.drv[n] || [])
        for (const m of b.i)
          if (!off(b, m) && !up.has(m)) {
            up.add(m);
            nx.push(m);
          }
      for (const [d, sr] of S.link || [])
        if (d === n && !up.has(sr)) {
          up.add(sr);
          nx.push(sr);
        }
    }
    nx.forEach(n => upL.push(n));
    fr = nx;
  }
  dns.forEach(n => dn.add(n));
  fr = dns.slice();
  g = 0;
  while (fr.length && g++ < 500) {
    const nx = [];
    for (const n of fr) {
      for (const b of S.cns[n] || [])
        if (!off(b, n))
          for (const m of b.o)
            if (!dn.has(m)) {
              dn.add(m);
              nx.push(m);
            }
      for (const [d, sr] of S.link || [])
        if (sr === n && !dn.has(d)) {
          dn.add(d);
          nx.push(d);
        }
    }
    nx.forEach(n => dnL.push(n));
    fr = nx;
  }
  const T = { start, up, dn, upL: upL.filter(n => !start.has(n)), dnL: dnL.filter(n => !start.has(n)) };
  S._tk = key;
  S._ts = T;
  return T;
}
function trList(d) {
  if (!AN.view || !AN.sel) return;
  const sh = cs(),
    S = sh.S,
    T = trSet(sh);
  if (!T) return;
  const add = n => {
    const e = h$('span', { cls: 'v' });
    const f = () => {
      const x = S.rt.v[n];
      e.textContent = S.nets[n].dig ? (x > 0.5 ? '1' : '0') : fmt(x);
    };
    f._s = 1;
    PU.push(f);
    f();
    return e;
  };
  const row = n => {
    const name = nm(S, n),
      ad = adesFind(sh, name),
      ds = ad ? adesText(ad.rec) : '',
      x = S.xlk && S.xlk[n],
      r = h$('div', { cls: 'r tr', title: 'Click to select this wire' }, [
        h$('span', { cls: 'n', txt: name + (ds ? ' · ' + ds : '') + (x ? '  ◀ sheet ' + x.from.name : '') }),
        add(n)
      ]);
    r.onclick = () => {
      if (x && x.flagSrc != null && AN.sheets.indexOf(x.from) >= 0 && AN.sheets.indexOf(x.from) !== AN.i) {
        AN._bk = AN.i;
        go(AN.sheets.indexOf(x.from));
        return;
      }
      if (x && AN.sheets.indexOf(x.from) >= 0 && AN.sheets.indexOf(x.from) !== AN.i) {
        const FS = x.from.S || ensure(x.from);
        AN._bk = AN.i;
        trJump(x.from, x.fromNets.find(m => FS.drv[m].some(d => d.k !== 'LINK')) ?? x.fromNets[0]);
        return;
      }
      AN.sel = { net: n };
      selBox();
      paint();
      panelUpd(true);
    };
    return r;
  };
  const xr = n => {
    let ls = [];
    try {
      ls = (linksOf(sh) || []).filter(l => l.from === sh && l.fromNets.includes(n));
    } catch (e) {}
    const rs = ls.map(l => {
      let more = '';
      try {
        const TS = l.to.S || ensure(l.to),
          tn = l.toNets[0],
          nmx = nm(TS, tn),
          ad = adesFind(l.to, nmx),
          ds = ad ? adesText(ad.rec) : '',
          nc = (TS.cns[tn] || []).length;
        more = ' → ' + nmx + (ds ? ' · ' + ds : '') + ' · feeds ' + nc + ' block' + (nc === 1 ? '' : 's');
      } catch (e) {}
      const r = h$(
        'div',
        { cls: 'r tr', title: 'Follow the signal into the next sheet (the trace goes on there; Back returns)' },
        [
          h$('span', {
            cls: 'n',
            style: 'color:#ff8ad8',
            txt: '   ▶ continues in sheet ' + l.to.name + ' (circle ' + l.num + ')' + more
          })
        ]
      );
      r.onclick = () => {
        AN._bk = AN.i;
        trJump(l.to, l.toNets);
      };
      return r;
    });
    try {
      const ix = dsIdx(sh);
      if (ix.to.has(n))
        rs.push(
          h$('div', { cls: 'r', style: 'color:var(--c-dim)' }, [
            h$('span', {
              cls: 'n',
              txt: '   → to ' + ix.to.get(n).join(', ') + ' (leaves to the DITL page: not simulated here)'
            })
          ])
        );
      if (ix.from.has(n))
        rs.push(
          h$('div', { cls: 'r', style: 'color:var(--c-dim)' }, [
            h$('span', {
              cls: 'n',
              txt:
                '   ◀ from ' +
                ix.from.get(n).join(', ') +
                ' (comes from the DITL page: an input you switch in "DITL signals")'
            })
          ])
        );
    } catch (e) {}
    return rs;
  };
  const lg = h$('button', {
    cls: 'keep',
    txt: AN.allLegs ? 'Both T legs: ON' : 'Selected T leg only',
    title: 'T/switch blocks: follow only the leg in use, or both'
  });
  lg.onclick = () => {
    AN.allLegs = !AN.allLegs;
    S._tk = null;
    paint();
    selUpd(d);
  };
  d.append(h$('h4', { txt: 'Trace' }), h$('div', { cls: 'r' }, [lg]));
  try {
    trPathUi(d, sh);
    trExitsUi(d, sh);
    trMapUi(d, sh);
  } catch (e) {}
  {
    const sn = AN.sel && (AN.sel.net != null ? [AN.sel.net] : AN.sel.blk ? AN.sel.blk.o : []);
    sn.forEach(n => {
      if (S.xlk && S.xlk[n]) d.append(row(n));
      xr(n).forEach(r => d.append(r));
    });
  }
  const cap = 60;
  d.append(
    h$('small', { txt: 'Driven by (upstream, blue): ' + T.upL.length, style: 'display:block;margin-top:6px' })
  );
  T.upL.slice(0, cap).forEach(n => d.append(row(n), ...xr(n)));
  if (T.upL.length > cap)
    d.append(h$('small', { txt: '… +' + (T.upL.length - cap) + ' more', style: 'display:block;margin-top:6px' }));
  d.append(
    h$('small', { txt: 'Feeds (downstream, magenta): ' + T.dnL.length, style: 'display:block;margin-top:6px' })
  );
  T.dnL.slice(0, cap).forEach(n => d.append(row(n), ...xr(n)));
  if (T.dnL.length > cap)
    d.append(h$('small', { txt: '… +' + (T.dnL.length - cap) + ' more', style: 'display:block;margin-top:6px' }));
  d.append(
    h$('small', {
      txt: '◀ row = the input comes from another sheet, ▶ row = the signal goes on in another sheet: click it to follow the trace there (↩ Back returns).'
    })
  );
}
function trJump(tsh, net) {
  const nets = Array.isArray(net) ? net.slice() : [net];
  net = nets[0];
  const i = AN.sheets.indexOf(tsh);
  if (i < 0) return;
  const c0 = cs();
  let P = (AN.trPath = AN.trPath || []);
  if (!P.length || P[P.length - 1].name !== c0.name) {
    P.length = 0;
    P.push({
      name: c0.name,
      net: AN.sel && AN.sel.net != null ? AN.sel.net : null,
      nets: AN.sel && AN.sel.nets,
      blk: AN.sel && AN.sel.blk ? AN.sel.blk.id : null
    });
  }
  const k = P.findIndex(q => q.name === tsh.name);
  if (k >= 0) P.length = k;
  P.push({ name: tsh.name, net, nets, blk: null });
  if (tsh !== c0) {
    AN.hist.push({ name: c0.name, view: (AN.av[c0.name] || []).slice() });
    updBack();
  }
  go(i);
  const s2 = cs();
  if (!s2 || !s2.S) return;
  AN.sel = { net, nets };
  selBox();
  paint();
  panelUpd(true);
}
function trGoCrumb(k) {
  const P = AN.trPath || [],
    q = P[k];
  if (!q) return;
  P.length = k + 1;
  const i = AN.sheets.findIndex(s => s.name === q.name);
  if (i < 0) return;
  if (AN.sheets[i] !== cs()) {
    const c0 = cs();
    AN.hist.push({ name: c0.name, view: (AN.av[c0.name] || []).slice() });
    updBack();
  }
  go(i);
  const s2 = cs();
  if (!s2 || !s2.S) return;
  AN.sel =
    q.net != null ? { net: q.net, nets: q.nets } : q.blk != null ? { blk: s2.S.blk.find(b => b.id === q.blk) } : null;
  if (AN.sel && 'blk' in AN.sel && !AN.sel.blk) AN.sel = null;
  selBox();
  paint();
  panelUpd(true);
}
function trPathUi(d, sh) {
  const P = AN.trPath || [];
  if (!P.length) return;
  if (P[P.length - 1].name !== sh.name) {
    AN.trPath = [];
    return;
  }
  if (P.length < 2) return;
  const box = h$('div', { cls: 'r', style: 'flex-wrap:wrap;gap:4px;margin:4px 0;align-items:center' });
  box.append(h$('small', { txt: 'Path:' }));
  P.forEach((q, k) => {
    const b = h$('button', {
      cls: 'keep',
      txt: (k === P.length - 1 ? '● ' : '') + q.name,
      title: 'Go back to this sheet (the path after it is dropped)'
    });
    b.onclick = () => trGoCrumb(k);
    box.append(b);
  });
  box.append(
    h$('button', { cls: 'keep', txt: '⟲ Back to start', onclick: () => trGoCrumb(0) }),
    h$('button', {
      cls: 'keep',
      txt: 'Clear path',
      onclick: () => {
        AN.trPath = [];
        selUpd(d);
      }
    })
  );
  d.append(box);
}
/* every exit of the traced signal (not cut by the 60-row limit of the lists) */
function trStarts(S) {
  const s = AN.sel;
  if (!s) return [];
  return s.net != null ? (s.nets && s.nets.length ? s.nets.slice() : [s.net]) : s.blk ? (s.blk.o || []).slice() : [];
}
function trExitsUi(d, sh) {
  const S = sh.S,
    st = trStarts(S);
  if (!st.length) return;
  const dn = trDown(S, st);
  let ls = [];
  try {
    ls = (linksOf(sh) || []).filter(l => l.from === sh && l.fromNets.some(m => dn.has(m)));
  } catch (e) {}
  if (!ls.length) return;
  d.append(
    h$('small', {
      txt: 'This signal leaves the sheet (' + ls.length + '):',
      style: 'display:block;margin-top:4px;color:#ff8ad8'
    })
  );
  ls.forEach(l => {
    let more = '';
    try {
      const TS = l.to.S || ensure(l.to),
        tn = l.toNets[0],
        nmx = nm(TS, tn),
        ad = adesFind(l.to, nmx),
        ds = ad ? adesText(ad.rec) : '',
        nc = (TS.cns[tn] || []).length;
      more = ' → ' + nmx + (ds ? ' · ' + ds : '') + ' · feeds ' + nc;
    } catch (e) {}
    const r = h$('div', { cls: 'r tr' }, [
      h$('span', { cls: 'n', style: 'color:#ff8ad8', txt: '   ▶ ' + l.to.name + ' (circle ' + l.num + ')' + more })
    ]);
    r.onclick = () => {
      AN._bk = AN.i;
      trJump(l.to, l.toNets);
    };
    d.append(r);
  });
}
/* downstream of some wires inside one sheet (all T legs) */
function trDown(S, starts) {
  const dn = new Set(starts),
    fr = starts.slice();
  let g = 0;
  while (fr.length && g++ < 500) {
    const nx = [];
    for (const n of fr) {
      for (const b of S.cns[n] || [])
        for (const m of b.o || [])
          if (!dn.has(m)) {
            dn.add(m);
            nx.push(m);
          }
      for (const [dd, sr] of S.link || [])
        if (sr === n && !dn.has(dd)) {
          dn.add(dd);
          nx.push(dd);
        }
    }
    fr.length = 0;
    fr.push(...nx);
  }
  return dn;
}
function trMap(sh, starts) {
  const out = [],
    seen = new Set([sh.name + '|' + starts.join(',')]),
    q = [{ sh, starts, depth: 0, via: '' }];
  while (q.length && out.length < 80) {
    const x = q.shift(),
      S = ensure(x.sh),
      dn = trDown(S, x.starts),
      kinds = {};
    for (const m of dn) for (const b of S.cns[m] || []) kinds[b.k] = (kinds[b.k] || 0) + 1;
    out.push({ sh: x.sh, n: x.starts[0], starts: x.starts, depth: x.depth, via: x.via, kinds });
    let ls = [];
    try {
      ls = linksOf(x.sh).filter(l => l.from === x.sh && l.fromNets.some(m => dn.has(m)));
    } catch (e) {}
    for (const l of ls) {
      const k = l.to.name + '|' + l.toNets.join(',');
      const again = [...seen].some(z => z.startsWith(l.to.name + '|'));
      if (again) {
        out.push({
          sh: l.to,
          n: l.toNets[0],
          depth: x.depth + 1,
          via: x.sh.name + ' (circle ' + l.num + ')',
          again: true
        });
        continue;
      }
      seen.add(k);
      q.push({ sh: l.to, starts: l.toNets.slice(), depth: x.depth + 1, via: x.sh.name + ' (circle ' + l.num + ')' });
    }
  }
  return out;
}
function trMapUi(d, sh) {
  const s = AN.sel;
  if (!s) return;
  const starts =
    s.net != null ? (s.nets && s.nets.length ? s.nets.slice() : [s.net]) : s.blk ? (s.blk.o || []).slice() : [];
  if (!starts.length) return;
  const b = h$('button', {
      cls: 'keep',
      txt: 'Map: where does this signal go (all sheets)',
      title: 'The whole cross-sheet downstream in one list; each sheet once'
    }),
    box = h$('div', { style: 'margin:4px 0' });
  b.onclick = () => {
    if (box.firstChild) {
      box.innerHTML = '';
      return;
    }
    let R;
    try {
      R = trMap(sh, starts);
    } catch (e) {
      box.append(h$('small', { txt: 'map failed: ' + e.message }));
      return;
    }
    box.append(
      h$('small', {
        txt:
          R.filter(x => !x.again).length +
          ' sheet(s); a sheet is listed once even when the signals go round in a circle (↺). Click a line to go there.'
      })
    );
    for (const x of R) {
      const S = x.sh.S || ensure(x.sh),
        name = nm(S, x.n),
        ad = adesFind(x.sh, name),
        ds = ad ? adesText(ad.rec) : '',
        ks = Object.entries(x.kinds || {})
          .map(([k, c]) => k + '×' + c)
          .join(' ');
      const r = h$('div', { cls: 'r tr', style: 'padding-left:' + (6 + x.depth * 14) + 'px' }, [
        h$('span', {
          cls: 'n',
          style: x.again ? 'color:var(--c-dim)' : '',
          txt:
            (x.again ? '↺ back to ' : x.depth ? '▶ ' : '● ') +
            x.sh.name +
            (x.again
              ? ' (already listed)'
              : ' · ' + name + (ds ? ' · ' + ds : '') + (ks ? ' → feeds ' + ks : ' → feeds nothing here')) +
            (x.via && !x.again ? '   [via ' + x.via + ']' : '')
        })
      ]);
      if (!x.again)
        r.onclick = () => {
          x.sh === cs()
            ? ((AN.sel = { net: x.n, nets: x.starts }), selBox(), paint(), panelUpd(true))
            : trJump(x.sh, x.starts || x.n);
        };
      box.append(r);
    }
  };
  d.append(h$('div', { cls: 'r' }, [b]), box);
}

const DS_RX = /(FROM|TO)\s+DITL\s*([0-9]{2}[A-Z]?)\s*-\s*(\d+)/gi;
function dsIdx(sh) {
  if (sh._ds) return sh._ds;
  const S = ensure(sh),
    from = new Map(),
    to = new Map(),
    toDig = new Map(),
    lost = [];
  for (const t of S.tx) {
    if (!/DITL/i.test(t.t)) continue;
    const isFrom = /FROM/i.test(t.t);
    DS_RX.lastIndex = 0;
    const refs = [];
    let m;
    while ((m = DS_RX.exec(t.t))) refs.push('DITL ' + m[2] + '-' + m[3]);
    /* 2.2.0-beta.3: a list after the first one ("TO DITL 02-25, DITL 03F-16, DITL 19-16", ABC-027 M.2504): every reference, not the first only */
    if (refs.length) {
      const L = /,\s*(?:DITL\s*)?([0-9]{2}[A-Z]?)\s*-\s*(\d+)/gi;
      while ((m = L.exec(t.t))) if (!refs.includes('DITL ' + m[1] + '-' + m[2])) refs.push('DITL ' + m[1] + '-' + m[2]);
    }
    if (!refs.length) refs.push(t.t.replace(/[()]/g, '').trim());
    const near = [];
    for (const nn of S.nets) {
      if (!nn.segs.length) continue;
      let d = 1e9;
      for (const i of nn.segs) d = Math.min(d, anPtSeg(t.x, t.y, S.seg[i]));
      if (d <= 20) near.push({ id: nn.id, d });
    }
    near.sort((p, q) => p.d - q.d);
    /* 1.22.0: a FROM text that touches a wire (<= 8) names THAT wire, even when an input wire is a bit farther
       (ABC-004A: the four "( FROM DITL 07-64 )" were put on the SIG.AB flags B.0723 ... at 8 ~ 9 instead of M.3410 ... at 5; ABC-003B: M.025B at 18 instead of M.3434 at 5) */
    const pick = isFrom
      ? (near[0] && near[0].d <= 8 ? near[0] : null) || near.find(q => S.ext.includes(q.id)) || near[0]
      : near.find(q => !S.ext.includes(q.id) && S.drv[q.id] && S.drv[q.id].some(d => d.k !== 'LINK')) || near[0];
    if (!pick) {
      lost.push({ t: t.t, x: Math.round(t.x), y: Math.round(t.y) });
      continue;
    }
    const M = isFrom ? from : to;
    const o = M.get(pick.id) || [];
    for (const r of refs) if (!o.includes(r)) o.push(r);
    M.set(pick.id, o);
    /* 2.2.0-beta.4: the nearest DIGITAL net driven by the logic, for a TO DITL text that sits by an analog wire (ABC-001C "TO DITL
       40-09" between the main steam pressure AI0131 and the output M.310D of its LOW LOW comparator, < 72.9 kg/cm2) */
    if (!isFrom && S.nets[pick.id] && !S.nets[pick.id].dig) {
      const dg = near.find(q => S.nets[q.id] && S.nets[q.id].dig && !S.ext.includes(q.id) && S.drv[q.id] && S.drv[q.id].length);
      if (dg) for (const r of refs) toDig.set(r + '@' + pick.id, dg.id);
    }
  }
  /* 2.3.0-beta.1 (LINK-3): a "TO DITL" text written under its own comparator box belongs to the wire named in S.dsTo (ABC-001C
     "TO DITL 40-06" = O.0177 > 134 kg/cm2, not M.3109 under it; DITL-40 rows 6 ~ 9, 13) */
  if (S.dsTo) {
    const key = r => {
      const m = /([0-9]{2,3}[A-Z]?)\s*-\s*(\d+)/.exec(r);
      return m ? m[1] + '-' + +m[2] : r;
    };
    for (const ref in S.dsTo) {
      const n = S.lab.findIndex((l, i) => l && String(l.t).trim() === S.dsTo[ref] && S.drv[i] && S.drv[i].length);
      if (n < 0) continue;
      let full = null;
      for (const [id, o] of [...to]) {
        const j = o.findIndex(r => key(r) === ref);
        if (j < 0) continue;
        full = o[j];
        o.splice(j, 1);
        if (!o.length) to.delete(id);
        toDig.delete(full + '@' + id);
      }
      if (!full) continue;
      const o = to.get(n) || [];
      if (!o.includes(full)) o.push(full);
      to.set(n, o);
    }
  }
  return (sh._ds = { from, to, toDig, lost });
}
const TR_COL = ['#4da3ff', '#ff8a3d', '#35e08a', '#ff4dd0', '#ffd84d', '#9b8cff', '#7fe0e0', '#c0c0c0'],
  TR_DT = 0.25,
  TR_CAP = 2400;
function trDescOf(S, sh, n) {
  try {
    const nmx = nm(S, n),
      a = adesFind(sh, nmx);
    return a ? adesText(a.rec) : '';
  } catch (e) {
    return '';
  }
}
function trModel(sh) {
  const S = sh.S,
    s = AN.sel;
  if (!S || !s) return null;
  let n_ = 0;
  const sd = (key, name, unit, get, o) =>
      Object.assign({ key, name, unit: unit || '', get, dig: false, desc: '', ci: n_++ }, o || {}),
    net = (n, label, unit, o) =>
      n == null || n < 0 || !S.nets[n]
        ? null
        : sd(
            'n' + n,
            label + ' ' + nm(S, n),
            unit,
            () => S.rt.v[n],
            Object.assign({ dig: !!S.nets[n].dig, desc: trDescOf(S, sh, n) }, o || {})
          ),
    M = { title: '', desc: '', panes: [] };
  const push = (title, unit, ser, dig) => {
    ser = ser.filter(Boolean);
    if (ser.length) M.panes.push({ title, unit, series: ser, dig: !!dig });
  };
  if (s.blk) {
    const b = s.blk;
    if (!TR_KINDS.includes(b.k)) return null;
    const st = () => S.rt.st[b.id] || {},
      tag = b.tag || (b.txt || [])[1] || (b.txt || [])[0] || b.k,
      fdesc = (b.face && b.face.desc) || '';
    M.title = b.k + ' ' + tag;
    M.desc = fdesc;
    M.blk = b;
    if (b.k === 'PID' || b.k === 'PIDV') {
      const d = (S.drv[b.in0] || []).map(x => S.blk.find(q => q.id === x.id)).find(q => q && q.ip && q.ip.length >= 2),
        u = b.p.unit || '';
      const pn = anPins(S, b),
        pl = pn && { n: pn.sv },
        mi = pn && { n: pn.pv };
      push('Process (' + (u || 'engineering unit') + ')', u, [
        pl && net(pl.n, 'SV', u, { desc: 'set point · ' + (fdesc || trDescOf(S, sh, pl.n)) }),
        mi && net(mi.n, 'PV', u, { desc: 'process value · ' + (fdesc || trDescOf(S, sh, mi.n)) })
      ]);
      const p = b.p,
        sp = p.span > 0 ? p.span : 100;
      push('Controller (% of output)', '%', [
        (b.o || [])[0] != null &&
          net(b.o[0], 'MV', ' %', {
            name: 'MV output ' + tag,
            desc:
              'output of the controller, limited ' +
              (p.lo == null ? 0 : p.lo) +
              ' ~ ' +
              (p.hi == null ? 100 : p.hi) +
              ' %'
          }),
        sd('st' + b.id + 'p', 'P  = Kp · e', ' %', () => st().pt, {
          desc:
            'proportional part: Kp ' +
            (+p.kp).toFixed(3) +
            ' (P band ' +
            (p.kp > 0 ? (100 / p.kp).toFixed(1) : '-') +
            ' %) times the error'
        }),
        sd('st' + b.id + 'i', 'I  (integral)', ' %', () => st().it, {
          desc: 'integral part: Ti ' + p.ti + ' s, adds up while the error stays'
        }),
        sd('st' + b.id + 'd', 'D  (derivative)', ' %', () => st().dd, {
          desc: 'derivative part: Td ' + p.td + ' s, reacts to the speed of the error'
        }),
        sd('st' + b.id + 'e', 'error e = SV − PV', ' % of span', () => st().es, {
          desc: 'deviation in % of the range (' + sp + ' ' + (u || '') + ' = 100 %); the controller works to make it 0'
        })
      ]);
      if (b.k === 'PIDV') {
        const po = (S.cns[(b.o || [])[0]] || []).find(x => x.k === 'PO') || S.blk.find(x => x.k === 'PO');
        if (po) {
          push('Pulse output (PO)', '%', [
            sd('st' + po.id + 'pos', 'PO position', ' %', () => (S.rt.st[po.id] || {}).pos, {
              desc: 'position of the actuator by the raise / lower pulses'
            })
          ]);
          push(
            'Pulses',
            '',
            [
              sd('st' + po.id + 'up', 'raise pulse', '', () => ((S.rt.st[po.id] || {}).up ? 1 : 0), { dig: true }),
              sd('st' + po.id + 'dn', 'lower pulse', '', () => ((S.rt.st[po.id] || {}).dn ? 1 : 0), { dig: true })
            ],
            true
          );
        }
      }
    } else if (b.k === 'MAN') {
      const u = b.p.u || '';
      push('Manual output (' + u + ')', u, [
        net((b.o || [])[0], 'OUT', u, { name: 'OUT ' + tag, desc: fdesc || 'manual station value' }),
        sd('st' + b.id + 'lo', 'low limit', u, () => b.p.lo, { dash: true, desc: 'low limit' }),
        sd('st' + b.id + 'hi', 'high limit', u, () => b.p.hi, { dash: true, desc: 'high limit' })
      ]);
      push(
        'Tracking',
        '',
        [
          sd('st' + b.id + 'trk', 'tracking another leg', '', () => (st().trk != null ? 1 : 0), {
            dig: true,
            desc: '1 = the station follows the output of the switch behind it'
          })
        ],
        true
      );
    } else if (b.k === 'SUMA') {
      const u = b.face ? b.face.unit : '',
        tu = (b.face && b.face['SUM unit']) || '';
      push('Flow (' + u + ')', u, [net((b.i || [])[0], 'FLOW', u, { desc: fdesc })]);
      push('Total (' + tu + ')', tu, [
        sd('st' + b.id + 'tot', 'TOTAL ' + tag, tu, () => st().tot, {
          desc: 'integrated flow' + (b.face ? '; reset / limit ' + b.face.RSTS + ' ' + tu : '')
        })
      ]);
    } else if (b.k === 'FX') {
      push('Input and output', '', [net((b.i || [])[0], 'IN', '', {}), net((b.o || [])[0], 'OUT', '', {})]);
      if (b.p && b.p.tbl && (b.p.tbl.p2 || b.p.tbl.pts))
        M.xy = { pts: b.p.tbl.p2 || b.p.tbl.pts, inN: (b.i || [])[0], outN: (b.o || [])[0], title: b.p.ln || 'F(X)' };
    }
  } else return null;
  if (M.blk && (M.blk.k === 'PID' || M.blk.k === 'PIDV')) {
    const q0 = M.panes.find(x => /^Process/.test(x.title)),
      pp = M.blk.p;
    if (q0 && pp && isFinite(pp.rlo) && isFinite(pp.rhi) && pp.rhi > pp.rlo) q0.rng = [+pp.rlo, +pp.rhi];
  }
  return M.panes.length ? M : null;
}
const TR_KINDS = ['PID', 'PIDV', 'MAN', 'SUMA', 'SUMP', 'FX'];
const trFlat = m => (m ? m.panes.flatMap(p => p.series) : []);
function trSeries(sh) {
  return trFlat(trModel(sh)).map(q => ({ key: q.key, name: q.name, desc: q.desc, unit: q.unit }));
}
function trSample(sh) {
  const S = sh && sh.S;
  if (!S) return;
  const m = trModel(sh),
    w = (sh._tw = sh._tw || new Map()),
    h = (sh._th = sh._th || { t: [] }),
    t = S.rt.t;
  if (h.t.length && t < h.t[h.t.length - 1] - 1e-6) {
    h.t.length = 0;
    w.forEach(a => (a.length = 0));
  }
  if (m)
    for (const q of trFlat(m))
      if (!w.has(q.key)) {
        if (w.size >= 40) {
          const k = w.keys().next().value;
          w.delete(k);
        }
        w.set(q.key, new Array(h.t.length).fill(null));
      }
  if (h.t.length && t - h.t[h.t.length - 1] < TR_DT - 1e-9) return;
  if (!w.size || !m) return;
  const vals = {};
  for (const q of trFlat(m)) {
    let v = null;
    try {
      v = q.get();
    } catch (e) {}
    vals[q.key] = v == null || !isFinite(v) ? null : v;
  }
  h.t.push(t);
  w.forEach((a, k) => a.push(k in vals ? vals[k] : null));
  if (h.t.length > TR_CAP) {
    h.t.shift();
    w.forEach(a => a.shift());
  }
}
function trUnitTxt(u) {
  return u ? ' ' + u.trim() : '';
}
function trDraw(cv, sh, m, o) {
  const h = sh._th || { t: [] },
    w = sh._tw || new Map(),
    ctx = cv.getContext('2d'),
    W = cv.width,
    H = cv.height,
    pl = 58,
    pr = 8,
    pt = 6,
    pb = 22,
    T = h.t,
    n = T.length,
    big = !!o.big,
    fs = big ? 12 : 10;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b1013';
  ctx.fillRect(0, 0, W, H);
  ctx.font = fs + 'px sans-serif';
  o.geo = null;
  if (n < 2 || !m) {
    ctx.fillStyle = '#8a9';
    ctx.fillText('No data yet: press RUN (or Next ▶). The history starts when the block is selected.', pl, H / 2);
    return;
  }
  const win = o.win > 0 ? o.win : T[n - 1] - T[0],
    t1 = o.off != null ? o.off + win : T[n - 1],
    t0 = t1 - win;
  let i0 = 0;
  while (i0 < n - 1 && T[i0 + 1] < t0) i0++;
  let i1 = n - 1;
  while (i1 > 0 && T[i1 - 1] > t1) i1--;
  const P = m.panes,
    gap = big ? 10 : 6,
    ph = (H - pt - pb - gap * (P.length - 1)) / P.length,
    X = t => pl + ((t - t0) / (t1 - t0)) * (W - pl - pr);
  o.geo = { pl, pr, t0, t1, W, panes: [] };
  P.forEach((pn, pi) => {
    const y0 = pt + pi * (ph + gap),
      y1 = y0 + ph,
      ser = pn.series.filter(q => !o.hide.has(q.key) && (w.get(q.key) || []).length);
    let lo = 1e30,
      hi = -1e30;
    if (pn.dig) {
      lo = -0.1;
      hi = 1.1;
    } else {
      for (const q of ser) {
        const a = w.get(q.key);
        for (let i = i0; i <= i1; i++) {
          const v = a[i];
          if (v == null) continue;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
      }
      if (pn.rng) {
        lo = Math.min(pn.rng[0], lo);
        hi = Math.max(pn.rng[1], hi);
      } else {
        if (lo > hi) {
          lo = 0;
          hi = 1;
        }
        if (hi - lo < 1e-9) {
          lo -= 0.5;
          hi += 0.5;
        }
        const pd = (hi - lo) * 0.08;
        lo -= pd;
        hi += pd;
      }
    }
    const Y = v => y1 - ((v - lo) / (hi - lo)) * (y1 - y0);
    o.geo.panes.push({ y0, y1, lo, hi });
    ctx.strokeStyle = '#26323a';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#8a9';
    ctx.strokeRect(pl + 0.5, y0 + 0.5, W - pl - pr, y1 - y0);
    for (let k = 0; k <= 4; k++) {
      const yy = y0 + (k * (y1 - y0)) / 4;
      ctx.beginPath();
      ctx.moveTo(pl, yy);
      ctx.lineTo(W - pr, yy);
      ctx.stroke();
      const val = hi - ((hi - lo) * k) / 4;
      if (!pn.dig)
        ctx.fillText(
          Math.abs(val) >= 1000 ? val.toFixed(0) : Math.abs(val) >= 100 ? val.toFixed(1) : val.toFixed(2),
          2,
          yy + (k === 0 ? 10 : k === 4 ? -2 : 4)
        );
    }
    if (pn.dig) {
      ctx.fillText('1', pl - 12, Y(1) + 4);
      ctx.fillText('0', pl - 12, Y(0) + 4);
    }
    for (let k = 0; k <= 4; k++) {
      const t = t0 + (k * (t1 - t0)) / 4,
        x = X(t);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      if (pi === P.length - 1)
        ctx.fillText(fmtT(Math.max(0, t)), Math.min(Math.max(x - 14, pl), W - 44), H - pb + fs + 3);
    }
    ctx.fillStyle = '#c9d4dc';
    ctx.fillText(pn.title, pl + 6, y0 + fs + 2);
    for (const q of ser) {
      const a = w.get(q.key);
      ctx.strokeStyle = TR_COL[q.ci % TR_COL.length];
      ctx.lineWidth = big ? 2 : 1.5;
      ctx.setLineDash(q.dash ? [5, 4] : []);
      ctx.beginPath();
      let st = false,
        py = 0;
      for (let i = Math.max(0, i0 - 1); i < n; i++) {
        const v = a[i];
        if (v == null) continue;
        const xx = X(T[i]),
          yy = Y(v);
        if (!st) {
          ctx.moveTo(xx, yy);
          st = true;
        } else {
          if (q.dig) ctx.lineTo(xx, py);
          ctx.lineTo(xx, yy);
        }
        py = yy;
        if (T[i] > t1) break;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  ctx.fillStyle = '#8a9';
  const info =
    'window ' +
    (+win).toFixed(0) +
    ' s · sampling ' +
    TR_DT +
    ' s · ' +
    (i1 - i0 + 1) +
    ' samples · X = simulated time';
  ctx.fillText(info, W - pr - ctx.measureText(info).width, H - 4);
  if (o.hx != null && o.hx >= pl && o.hx <= W - pr) {
    const tt = t0 + ((o.hx - pl) / (W - pl - pr)) * (t1 - t0);
    ctx.strokeStyle = '#ffffff88';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(o.hx, pt);
    ctx.lineTo(o.hx, H - pb);
    ctx.stroke();
    ctx.setLineDash([]);
    let k = i0;
    for (let i = i0; i <= i1; i++) if (Math.abs(T[i] - tt) < Math.abs(T[k] - tt)) k = i;
    o.hk = k;
  } else o.hk = null;
}
function trXY(cv, m, S) {
  if (!m || !m.xy || !m.xy.pts) return;
  const ctx = cv.getContext('2d'),
    W = cv.width,
    H = cv.height,
    pl = 44,
    pb = 18,
    pt = 14,
    pr = 8,
    pts = m.xy.pts.slice().sort((a, b) => a[0] - b[0]);
  ctx.fillStyle = '#0b1013';
  ctx.fillRect(0, 0, W, H);
  ctx.font = '10px sans-serif';
  if (pts.length < 2) {
    return;
  }
  const xs = pts.map(p => p[0]),
    ys = pts.map(p => p[1]),
    xl = Math.min(...xs),
    xh = Math.max(...xs),
    yl = Math.min(...ys),
    yh = Math.max(...ys),
    X = x => pl + ((x - xl) / (xh - xl || 1)) * (W - pl - pr),
    Y = y => H - pb - ((y - yl) / (yh - yl || 1)) * (H - pt - pb);
  ctx.strokeStyle = '#26323a';
  ctx.fillStyle = '#8a9';
  for (let k = 0; k <= 4; k++) {
    const xx = pl + (k * (W - pl - pr)) / 4,
      yy = pt + (k * (H - pt - pb)) / 4;
    ctx.beginPath();
    ctx.moveTo(xx, pt);
    ctx.lineTo(xx, H - pb);
    ctx.moveTo(pl, yy);
    ctx.lineTo(W - pr, yy);
    ctx.stroke();
    ctx.fillText((xl + ((xh - xl) * k) / 4).toFixed(1), xx - 10, H - 5);
    ctx.fillText((yh - ((yh - yl) * k) / 4).toFixed(1), 2, yy + 4);
  }
  ctx.strokeStyle = '#4da3ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]));
  });
  ctx.stroke();
  ctx.fillStyle = '#4da3ff';
  pts.forEach(p => ctx.fillRect(X(p[0]) - 2, Y(p[1]) - 2, 4, 4));
  const xi = S.rt.v[m.xy.inN],
    yo = S.rt.v[m.xy.outN];
  if (xi != null && yo != null) {
    ctx.fillStyle = '#ff4dd0';
    ctx.beginPath();
    ctx.arc(X(Math.max(xl, Math.min(xh, xi))), Y(Math.max(yl, Math.min(yh, yo))), 5, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#ff4dd0';
    ctx.fillText('now: in ' + fmt(xi) + ' → out ' + fmt(yo), pl + 6, pt + 10);
  }
  ctx.fillStyle = '#c9d4dc';
  ctx.fillText('X-Y curve of the table ' + m.xy.title + ' (the dot = the operating point)', pl + 6, H - pb - 6);
}
function trLegend(leg, S, m, o, sh) {
  leg.innerHTML = '';
  const hk = o.hk,
    h = sh._th || { t: [] },
    w = sh._tw || new Map();
  trFlat(m).forEach(q => {
    let v = null;
    if (hk != null && w.get(q.key)) v = w.get(q.key)[hk];
    else {
      try {
        v = q.get();
      } catch (e) {}
    }
    const txt = v == null || !isFinite(v) ? '--' : q.dig ? (v > 0.5 ? '1' : '0') : fmt(v) + trUnitTxt(q.unit),
      sp = h$('div', { style: 'margin:1px 0;cursor:pointer;opacity:' + (o.hide.has(q.key) ? 0.35 : 1) }, [
        h$('span', { txt: '■ ', style: 'color:' + TR_COL[q.ci % TR_COL.length] }),
        h$('b', { txt: q.name }),
        document.createTextNode(' = ' + txt + (hk != null ? '  @ ' + fmtT(Math.max(0, h.t[hk])) : '')),
        (o.big || o.desc) && q.desc
          ? h$('div', { txt: q.desc, style: 'font-size:10px;color:var(--c-dim);margin-left:14px' })
          : document.createTextNode('')
      ]);
    sp.onclick = () => {
      o.hide.has(q.key) ? o.hide.delete(q.key) : o.hide.add(q.key);
    };
    leg.append(sp);
  });
}
function trendUi(d) {
  const sh = cs();
  if (!sh || !sh.S) return;
  trSample(sh);
  const m0 = trModel(sh);
  if (!m0) return;
  const S = sh.S,
    o = { win: 60, hide: new Set(), hx: null, hk: null, desc: true },
    rows = m0.panes.length,
    hgt = rows > 1 ? 190 : 130,
    cv = h$('canvas', {
      width: 420,
      height: hgt * 1.4,
      style: 'width:100%;height:' + hgt + 'px;background:var(--c-well);border:1px solid var(--line);margin-top:4px'
    }),
    leg = h$('div', { style: 'font-size:11px;margin-top:2px' }),
    wsel = h$(
      'select',
      { style: 'pointer-events:auto;opacity:1' },
      [
        ['30 s', 30],
        ['1 min', 60],
        ['5 min', 300],
        ['10 min', 600],
        ['All', 0]
      ].map(([t, v]) => h$('option', { value: v, txt: t }))
    );
  wsel.value = '60';
  wsel.onchange = () => {
    o.win = +wsel.value;
    draw();
  };
  const bz = h$('button', {
      cls: 'keep',
      txt: 'Zoom ⤢',
      title: 'Big floating trend window with a control strip (move, resize, transparent)'
    }),
    bc = h$('button', { cls: 'keep', txt: 'Clear', title: 'Forget the history of this sheet' });
  bc.onclick = () => {
    sh._th = null;
    sh._tw = null;
    trSample(sh);
    draw();
  };
  const xyc = m0.xy
    ? h$('canvas', {
        width: 420,
        height: 200,
        style: 'width:100%;height:140px;background:var(--c-well);border:1px solid var(--line);margin-top:4px'
      })
    : null;
  d.append(
    h$('h4', { txt: 'Trend · ' + m0.title }),
    m0.desc ? h$('small', { txt: m0.desc, style: 'display:block;color:var(--c-tx2)' }) : document.createTextNode(''),
    h$('div', { cls: 'r' }, [wsel, bz, bc]),
    cv,
    ...(xyc ? [xyc] : []),
    leg
  );
  cv.onmousemove = e => {
    const r = cv.getBoundingClientRect();
    o.hx = ((e.clientX - r.left) / r.width) * cv.width;
    draw();
  };
  cv.onmouseleave = () => {
    o.hx = null;
    o.hk = null;
    draw();
  };
  const draw = () => {
    if (!cv.isConnected) return;
    const mc = trModel(sh),
      m = mc && mc.blk === m0.blk && mc.title === m0.title ? mc : m0;
    trDraw(cv, sh, m, o);
    if (xyc && m.xy) trXY(xyc, m, S);
    trLegend(leg, S, m, o, sh);
  };
  draw();
  PU.push(() => {
    if (cv.isConnected && cs() === sh) {
      trSample(sh);
      draw();
    }
  });
  bz.onclick = () => trZoom(sh, o);
}
