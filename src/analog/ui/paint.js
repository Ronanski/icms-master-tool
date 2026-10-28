/* ---------- paint (live values) ---------- */
/* symbol colour code (wires keep their own simple colours) */
const AN_KC = {
  ACH: '#e8c9a0',
  TXD: '#e8c9a0',
  AND: '#35d6c8',
  OR: '#35d6c8',
  NOT: '#35d6c8',
  FF: '#35d6c8',
  TON: '#b48cff',
  TOF: '#b48cff',
  TPS: '#b48cff',
  TPV: '#b48cff',
  HC: '#b4e04a',
  LC: '#b4e04a',
  HLC: '#b4e04a',
  CMPK: '#b4e04a',
  PVSV: '#b4e04a',
  DCMP: '#b4e04a',
  HLLIM: '#b4e04a',
  SW: '#ff7ad9',
  AMT: '#ff7ad9',
  COS: '#ff7ad9',
  CTK: '#ff7ad9',
  PID: '#4be08a',
  PIDV: '#4be08a',
  MAN: '#4be08a',
  SUMA: '#4be08a',
  SUMP: '#4be08a',
  AI: '#e8c9a0',
  AO: '#e8c9a0',
  PO: '#e8c9a0',
  IP: '#e8c9a0',
  ALM: '#e8c9a0',
  FOUT: '#e8c9a0',
  SIGAB: '#e8c9a0',
  FIELD: '#e8c9a0',
  TP: '#e8c9a0',
  ACT: '#e8c9a0'
};
const anKcol = k => AN_KC[k] || '#5aa9ff';
function anMix(c, bg) {
  const p = s => {
      let m = /^#?([0-9a-f]{6})$/i.exec(s);
      if (m) {
        const n = parseInt(m[1], 16);
        return [n >> 16, (n >> 8) & 255, n & 255];
      }
      m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(s);
      return m ? [+m[1], +m[2], +m[3]] : [11, 16, 19];
    },
    a = p(c),
    b = p(bg);
  return 'rgb(' + a.map((v, i) => Math.round(b[i] * 0.86 + v * 0.14)).join(',') + ')';
}
/* analog wires use a colour that differs from the Live colour (the digital one) */
/* nets that nobody follows right now (feed only a T input that is not selected, or blocks whose outputs are all such nets) */
function anHL(S, b) {
  const v = S.rt.v;
  let bi = -1,
    bv = 0;
  for (const n of b.i) {
    const x = v[n];
    if (bi < 0 || (b.k === 'HS' ? x > bv : x < bv)) {
      bi = n;
      bv = x;
    }
  }
  return bi;
}
function anDead(S) {
  const dead = new Set(),
    N = S.nets.length,
    uns = b => {
      const q = S.rt.st[b.id];
      return q && q.pk === 'B' ? b.a : b.b;
    };
  for (let it = 0; it < 12; it++) {
    let ch = 0;
    for (let n = 0; n < N; n++) {
      if (dead.has(n)) continue;
      const C = S.cns[n];
      if (!C || !C.length) continue;
      let live = false;
      for (const b of C) {
        if ((b.k === 'HS' || b.k === 'LS') && b.i.length > 1 && b.i.includes(n) && n !== anHL(S, b)) continue;
        if (
          b.k === 'SEL' &&
          b.i.includes(n) &&
          Math.abs(S.rt.v[n]) < 1e-9 &&
          b.i.some(m => m !== n && Math.abs(S.rt.v[m]) > 1e-9)
        )
          continue;
        /* a lost (zero) input of a select circuit is not followed while another input is healthy */ if (
          (b.k === 'SW' || b.k === 'AMT') &&
          b.a >= 0 &&
          b.b >= 0 &&
          b.a !== b.b &&
          n === uns(b) &&
          n !== b.sel
        )
          continue;
        if ((b.k === 'SW' || b.k === 'AMT') && (n === b.sel || (b.cs || []).some(c => c.n === n))) {
          live = true;
          break;
        }
        if (
          (b.k === 'SW' || b.k === 'AMT') &&
          b.a >= 0 &&
          b.b >= 0 &&
          b.a !== b.b &&
          n === (uns(b) === b.a ? b.b : b.a)
        ) {
          live = true;
          break;
        }
        if (b.o && b.o.length && b.o.every(o => dead.has(o))) continue;
        live = true;
        break;
      }
      if (!live) {
        dead.add(n);
        ch = 1;
      }
    }
    if (!ch) break;
  }
  const direct = new Set();
  for (const b of S.blk)
    if ((b.k === 'SW' || b.k === 'AMT') && b.a >= 0 && b.b >= 0 && b.a !== b.b) {
      const u = uns(b);
      if (u !== b.sel && dead.has(u)) direct.add(u);
    }
  dead.direct = direct;
  return dead;
}
const COLS = {
    sky: '#5cc8ff',
    red: '#ff4d4d',
    yellow: '#ffe14a',
    green: '#4be08a',
    cyan: '#35d0ff',
    blue: '#4da3ff',
    magenta: '#ff7ad9',
    white: '#e6edf3',
    orange: '#ff8a3d',
    amber: '#ffc233'
  },
  VCS = {
    green: '#8dffb8',
    amber: '#ffd27a',
    white: '#f2f5f7',
    cyan: '#8fe3ff',
    yellow: '#ffe14a',
    magenta: '#ff9de6',
    orange: '#ffb27a'
  },
  VFF = {
    mono: "Consolas,'Cascadia Mono',monospace",
    sans: "'Segoe UI',system-ui,sans-serif",
    serif: "Georgia,'Times New Roman',serif"
  };
function anDcol() {
  const d = AN.ws.dc;
  return d && d !== 'live' && COLS[d] ? COLS[d] : 'var(--live)';
}
const ANCS = {
  amber: '#ffc233',
  cyan: '#35d0ff',
  green: '#4be08a',
  white: '#e6edf3',
  magenta: '#ff7ad9',
  orange: '#ff8a3d'
};
function anLite(c) {
  const n = parseInt(c.slice(1), 16),
    m = v => Math.round(v + (255 - v) * 0.55);
  return 'rgb(' + m(n >> 16) + ',' + m((n >> 8) & 255) + ',' + m(n & 255) + ')';
}
function anColor() {
  const w = AN.ws && AN.ws.ac;
  if (w && ANCS[w]) return ANCS[w];
  const l = ($('slive') || {}).value;
  return l === 'Yellow' || l === 'Green' || l === 'Magenta' ? '#35d0ff' : '#ffc233';
}
/* 2.0.0: the legend follows the wire style chosen in Legend & style (solid / tube, colour), like the drawing */
function anLgdSvg(col, tube, w) {
  return tube
    ? '<svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="' + col + '" stroke-width="' + (5 * w).toFixed(1) + '"/><line x1="0" y1="6" x2="30" y2="6" stroke="#0f1418" stroke-width="' + (2 * w).toFixed(1) + '"/></svg>'
    : '<svg width="30" height="12"><line x1="0" y1="6" x2="30" y2="6" stroke="' + col + '" stroke-width="' + (2 * w).toFixed(1) + '"/></svg>';
}
let anLgdKey = '';
function anLgdUpd() {
  const ws = AN.ws || {},
    k = [ws.ds, ws.dc, ws.as, ws.ac, ws.dw, ws.aw, ($('slive') || {}).value].join('|');
  const s = document.querySelector('#anmeta .lg .lgw');
  if (!s || (k === anLgdKey && s.firstChild)) return;
  anLgdKey = k;
  s.innerHTML =
    '<i>' + anLgdSvg(anDcol(), ws.ds === 'tube', Math.min(1.6, +ws.dw || 1) * 0.8) + 'digital</i><i>' +
    anLgdSvg(anColor(), ws.as !== 'solid', Math.min(1.6, +ws.aw || 1)) + 'analog</i>';
}
function lgd() {
  const s = h$('span', { cls: 'lg' });
  s.innerHTML = '<span class="lgw" style="display:contents"></span>';
  setTimeout(anLgdUpd, 0);
  const bt = h$('button', {
    txt: 'Legend & style ▾',
    title: 'Colour code of the symbols, valves and wires; wire style settings'
  });
  bt.onclick = () => {
    const p = $('anlg');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
  };
  s.append(bt);
  return s;
}
{
  const d = h$('div', { id: 'anlg' }),
    sw = (c, t) =>
      '<div class="it"><span class="sw" style="border-color:' +
      c +
      ';background:' +
      anMix(c, '#0b1013') +
      '"></span>' +
      t +
      '</div>',
    dt = (c, t) => '<div class="it"><span class="dt" style="background:' + c + '"></span>' + t + '</div>';
  d.innerHTML =
    '<b>Symbols</b>' +
    sw('#35d6c8', 'Logic gates: AND, OR, NOT, flip-flop') +
    sw('#b48cff', 'Timers: ON delay, OFF delay, pulse (count shown under the timer)') +
    sw('#b4e04a', 'Comparators: H/ L/ &gt; &lt;') +
    sw('#ff7ad9', 'T switch (select A / B), COS') +
    sw('#4be08a', 'Controllers: PID, manual station') +
    sw('#e8c9a0', 'Inputs / outputs: AI, AO, I/P, alarm, output flags') +
    sw(
      '#ff4d4d',
      'Bad signal (SIG.AB = 1): dashed red wire = the transmitter, or a select circuit that holds its last value'
    ) +
    sw('#5aa9ff', 'Math and signal: sum, difference, multiply, F(X), lag, ramp, limits, selectors, constants') +
    sw('#c9d3dc', 'Numbered connector circles') +
    sw('#aeb9c3', 'Other shapes') +
    '<b>Control valve</b>' +
    dt('#35e08a', 'closed') +
    dt('#ff4d4d', 'open') +
    dt('#ffffff', 'moving') +
    dt('#4da3ff', 'stopped half open') +
    '<b>Numbers</b><div class="it"><span style="color:#8dffb8;font-weight:700">12.3</span>&nbsp;computed by the logic</div><div class="it"><span style="color:#6ad7ff;font-weight:700">12.3</span>&nbsp;simulated input (typed or slider)</div><div class="it"><span style="color:var(--c-mantx2);font-weight:700">12.3</span>&nbsp;FORCED value</div><b>Wires</b><div class="it"><svg width="24" height="13"><line x1="0" y1="6" x2="24" y2="6" stroke="var(--live)" stroke-width="1.6"/></svg>digital: Live colour = 1, grey = 0</div><div class="it"><svg width="24" height="13"><line x1="0" y1="6" x2="24" y2="6" stroke="var(--alive,#ffb020)" stroke-width="5"/><line x1="0" y1="6" x2="24" y2="6" stroke="#0f1418" stroke-width="2"/></svg>analog: always coloured (a value is flowing)</div><div class="it"><svg width="24" height="13"><line x1="0" y1="6" x2="24" y2="6" stroke="#35414a" stroke-width="2" opacity=".6"/></svg>grey / faint = INACTIVE: nobody follows it (T input not selected, selector leg not chosen). In VIEW / TRACE mode every wire is grey because nothing is simulated. An orange dashed box = UNRESOLVED (Review marks)</div><div class="it"><svg width="24" height="13"><line x1="0" y1="6" x2="24" y2="6" stroke="var(--pnc,#5cc8ff)" stroke-width="2.2"/></svg>pneumatic (air) line and actuator head: blink while the valve travels</div><div class="it"><svg width="24" height="13"><text x="3" y="11" font-size="12" font-weight="800" fill="var(--alive,#ffb020)">B</text></svg>T: the letter (A or B) of the input in use is coloured and bold</div>';
  document.body.append(d);
  const REDRAW = { vs: 1, vf: 1, vw: 1 },
    sel = (label, key, opts) => {
      const w = h$('div', { cls: 'it' }),
        s = h$(
          'select',
          { style: 'background:var(--c-well);color:var(--c-tx);border:1px solid var(--c-line);padding:2px 4px' },
          opts.map(([v, t]) => h$('option', { value: v, txt: t }))
        );
      s.value = String(AN.ws[key]);
      s.onchange = () => {
        if (key === 'th') {
          setTheme(s.value);
          sTh.value = s.value;
          return;
        }
        AN.ws[key] = /^[0-9.]+$/.test(s.value) ? +s.value : s.value;
        wsSave();
        AN.wsr++;
        if (REDRAW[key]) {
          AN.key = null;
          try {
            render();
          } catch (e) {}
        } else
          try {
            paint();
          } catch (e) {}
      };
      w.append(h$('span', { txt: label, style: 'width:130px' }), s);
      return w;
    },
    WD = [
      ['.7', 'Thin'],
      ['1', 'Normal'],
      ['1.5', 'Thick'],
      ['2', 'Extra thick']
    ];
  const CL = [
    ['red', 'Red'],
    ['yellow', 'Yellow'],
    ['green', 'Green'],
    ['cyan', 'Cyan'],
    ['blue', 'Blue'],
    ['magenta', 'Magenta'],
    ['white', 'White'],
    ['orange', 'Orange']
  ];
  d.append(
    h$('b', { txt: 'Theme' }),
    sel('Drawing', 'th', [
      ['color', 'Colour (symbols by type)'],
      ['eng', 'Engineering (white symbols and text)']
    ]),
    h$('b', { txt: 'Digital wires (saved)' }),
    sel('Colour', 'dc', [['live', 'Live (top bar)'], ...CL]),
    sel('Line', 'ds', [
      ['solid', 'Solid'],
      ['tube', 'Tube']
    ]),
    sel('Thickness', 'dw', WD),
    h$('b', { txt: 'Analog wires' }),
    sel('Colour', 'ac', [
      ['auto', 'Auto'],
      ['amber', 'Amber'],
      ['cyan', 'Cyan'],
      ['green', 'Green'],
      ['white', 'White'],
      ['magenta', 'Magenta'],
      ['orange', 'Orange']
    ]),
    sel('Line', 'as', [
      ['tube', 'Tube'],
      ['solid', 'Solid']
    ]),
    sel('Thickness', 'aw', WD),
    h$('b', { txt: 'Pneumatic (air) lines' }),
    sel('Colour', 'pc', [
      ['sky', 'Sky blue'],
      ['cyan', 'Cyan'],
      ['white', 'White'],
      ['green', 'Green'],
      ['orange', 'Orange'],
      ['magenta', 'Magenta']
    ]),
    h$('b', { txt: 'Forced wires (dashed)' }),
    sel('Colour', 'fc', [
      ['same', 'Same as the wire'],
      ['white', 'White'],
      ['magenta', 'Magenta'],
      ['cyan', 'Cyan'],
      ['yellow', 'Yellow'],
      ['orange', 'Orange']
    ]),
    h$('b', { txt: 'Values (numbers on the drawing)' }),
    sel('Computed by the logic', 'vc', [
      ['green', 'Green'],
      ['amber', 'Amber'],
      ['white', 'White'],
      ['cyan', 'Cyan'],
      ['yellow', 'Yellow'],
      ['magenta', 'Magenta'],
      ['orange', 'Orange'],
      ['wire', 'Like the analog wire']
    ]),
    sel('Simulated input (typed / slider)', 'vi', [
      ['cyan', 'Cyan'],
      ['white', 'White'],
      ['yellow', 'Yellow'],
      ['magenta', 'Magenta'],
      ['orange', 'Orange'],
      ['amber', 'Amber'],
      ['green', 'Green']
    ]),
    sel('FORCED value', 'vz', [
      ['amber', 'Amber'],
      ['orange', 'Orange'],
      ['red', 'Red'],
      ['magenta', 'Magenta'],
      ['yellow', 'Yellow'],
      ['white', 'White'],
      ['cyan', 'Cyan']
    ]),
    sel('Size', 'vs', [
      ['.8', 'Small'],
      ['1', 'Normal'],
      ['1.25', 'Large'],
      ['1.5', 'Extra large']
    ]),
    sel('Font', 'vf', [
      ['mono', 'Monospace'],
      ['sans', 'Sans'],
      ['serif', 'Serif']
    ]),
    sel('Weight', 'vw', [
      ['400', 'Normal'],
      ['600', 'Semi-bold'],
      ['800', 'Bold']
    ]),
    h$('div', { cls: 'it', style: 'color:var(--c-dim)', txt: 'Click a wire to change the look of that one wire only.' })
  );
  {
    const out = h$('div', { style: 'margin-top:4px;line-height:1.5' }),
      test = () => {
        out.textContent = 'Testing…';
        let ls = '✖ blocked',
          used = 0;
        try {
          localStorage.setItem('ditl.an.probe', '1');
          if (localStorage.getItem('ditl.an.probe') === '1') ls = '✔ ok';
          localStorage.removeItem('ditl.an.probe');
        } catch (e) {}
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            used += k.length + (localStorage.getItem(k) || '').length;
          }
        } catch (e) {}
        const mb = (used / 1048576).toFixed(1);
        KV.set('probe', Date.now()).then(ok =>
          KV.get('probe').then(v => {
            let url = '✖',
              tab = !window.name || String(window.name).startsWith('ditl-an:') ? '✔ ok' : '✖ in use by another program';
            try {
              history.replaceState(null, '', location.href);
              url = '✔ ok';
            } catch (e) {}
            out.textContent =
              'Last time the settings were loaded from: ' +
              (AN._src || '?') +
              '.   Saving to: browser storage ' +
              ls +
              ' (' +
              mb +
              ' MB used of about 5) · backup storage (IndexedDB) ' +
              (ok && v ? '✔ ok' : '✖ blocked') +
              ' · tab memory ' +
              tab +
              ' · address bar ' +
              url;
          })
        );
      };
    const dg = h$('button', {
        txt: 'Diagnostics',
        title: 'Makes a short report you can copy and send',
        onclick: () => {
          const t = h$('textarea', {
            style:
              'width:100%;height:150px;background:var(--c-well);color:var(--c-tx);border:1px solid var(--c-line);font:11px Consolas,monospace'
          });
          t.value = anDiag();
          out.append(t);
          t.select();
          try {
            document.execCommand('copy');
            msg('Diagnostics copied to the clipboard');
          } catch (e) {}
        }
      }),
      bt = h$('button', { txt: 'Test saving', onclick: test }),
      sv_ = h$('button', {
        txt: 'Save settings file',
        onclick: () => {
          const a = h$('a', {
            href: URL.createObjectURL(
              new Blob(
                [JSON.stringify({ sv: AN.sv, ws: AN.ws, cur: AN.sheets[AN.i] && AN.sheets[AN.i].name }, null, 1)],
                { type: 'application/json' }
              )
            ),
            download: 'ditl-analog-settings.json'
          });
          a.click();
        }
      }),
      fi = h$('input', { type: 'file', accept: '.json', style: 'display:none' });
    fi.onchange = async () => {
      try {
        const o = JSON.parse(await fi.files[0].text());
        if (o.sv) AN.sv = o.sv;
        if (o.ws) wsIn(o.ws);
        anSave();
        wsSave();
        location.reload();
      } catch (e) {
        msg('Cannot read that file');
      }
    };
    const ld = h$('button', { txt: 'Load settings file', onclick: () => fi.click() });
    d.append(h$('b', { txt: 'Saving' }), out, h$('div', { cls: 'it' }, [bt, dg, sv_, ld, fi]));
    test();
  }
}
function reviewMarks() {
  const sh = cs();
  if (!sh || !sh.S || !L || !L.gb || !L.gb.parentNode) return;
  const S = sh.S;
  let g = L.rvg;
  if (!g || !g.isConnected) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('pointer-events', 'none');
    g.setAttribute('id', 'reviewmarks');
    L.gb.parentNode.insertBefore(g, L.gb);
    L.rvg = g;
    g._k = null;
  }
  if (!AN.rv) {
    if (g._k !== 'off') {
      g._k = 'off';
      g.textContent = '';
    }
    return;
  }
  if (g._k === sh.name + '|on') return;
  const m = [];
  const used = new Set(S.blk.map(b => b.sh));
  if (/^ABC-000/.test(sh.name)) {
    if (g._k !== 'leg') {
      g._k = 'leg';
      g.textContent = '';
    }
    return;
  }
  for (const s of S.shp)
    if (
      !used.has(s) &&
      s.w > 2.5 &&
      s.h > 2.5 &&
      s.w < 30 &&
      s.h < 30 &&
      !(S.gate || []).some(q => q.box === s) &&
      !S.blk.some(
        b =>
          b.sh !== s &&
          (s.x0 + s.x1) / 2 >= b.x0 - 0.3 &&
          (s.x0 + s.x1) / 2 <= b.x1 + 0.3 &&
          (s.y0 + s.y1) / 2 >= b.y0 - 0.3 &&
          (s.y0 + s.y1) / 2 <= b.y1 + 0.3
      )
    )
      m.push([s.x0, s.y0, s.x1, s.y1, '?']);
  const E_ = {
    AI: [0, 1],
    AO: [1, 0],
    PID: [1, 1],
    PIDV: [1, 1],
    MAN: [1, 1],
    AMT: [2, 1],
    SW: [2, 1],
    SUM: [1, 1],
    DEV: [2, 1],
    SUB: [2, 1],
    DIV: [2, 1],
    HC: [1, 1],
    LC: [1, 1],
    CMPK: [1, 1],
    FX: [1, 1],
    LAG: [1, 1],
    RATE: [1, 1],
    AND: [1, 1],
    OR: [1, 1],
    NOT: [1, 1],
    FF: [1, 1],
    TON: [1, 1],
    TOF: [1, 1],
    TPS: [1, 1],
    SQRT: [1, 1],
    HS: [1, 1],
    LS: [1, 1],
    HLIM: [1, 1],
    LLIM: [1, 1],
    CONST: [0, 1],
    SIGAB: [1, 0]
  };
  for (const b of S.blk) {
    const e = b.k === 'MAN' ? null : E_[b.k];
    if (e) {
      const i = b.pins.filter(p => p.role === 'in').length,
        o = b.pins.filter(p => p.role === 'out').length;
      if (
        i <
          e[0] -
            ((b.k === 'AMT' || b.k === 'SW') &&
            S.blk.some(c => c.k === 'COS' && Math.hypot(c.cx - b.cx, c.cy - b.cy) < 14)
              ? 1
              : 0) ||
        (e[1] && !o && b.k !== 'AO' && !(b.k === 'AI' && i >= 1))
      )
        m.push([b.x0, b.y0, b.x1, b.y1, 'pin?']);
    }
    if (b.k === 'FX' && !(b.p.tbl && (b.p.tbl.p2 || b.p.tbl.pts)) && !(window.ANLN && window.ANLN[b.p.ln]))
      m.push([b.x0, b.y0, b.x1, b.y1, 'no table']);
    if (b.k === 'FX' && b.fxrev) m.push([b.x0, b.y0, b.x1, b.y1, 'scale?']);
    if ((b.k === 'RATE' || b.k === 'RAMPB') && b.p.spanUnres) m.push([b.x0, b.y0, b.x1, b.y1, 'span?']);
  }
  g._k = sh.name + '|on';
  g.textContent = '';
  for (const q of m) {
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', q[0] - 1);
    r.setAttribute('y', -q[3] - 1);
    r.setAttribute('width', q[2] - q[0] + 2);
    r.setAttribute('height', q[3] - q[1] + 2);
    r.setAttribute('fill', 'none');
    r.setAttribute('stroke', '#ffb24a');
    r.setAttribute('stroke-width', '.5');
    r.setAttribute('stroke-dasharray', '1.4 1');
    g.appendChild(r);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', q[0] - 1);
    t.setAttribute('y', -q[3] - 1.6);
    t.setAttribute('font-size', '2.6');
    t.setAttribute('fill', '#ffb24a');
    t.setAttribute('stroke', '#000');
    t.setAttribute('stroke-width', '.4');
    t.setAttribute('paint-order', 'stroke');
    t.textContent = q[4];
    g.appendChild(t);
  }
}
function badMarks() {
  const sh = cs();
  if (!sh || !sh.S || !L || !L.gb || !L.gb.parentNode) return;
  const S = sh.S;
  let g = L.badg;
  if (!g || !g.isConnected) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('pointer-events', 'none');
    g.setAttribute('id', 'badmarks');
    L.gb.parentNode.appendChild(g);
    L.badg = g;
    g._k = null;
  }
  const list = S.blk.filter(b => b.k === 'AI' && b.sig && S.rt.st[b.sig.id] && S.rt.st[b.sig.id].val > 0.5),
    key = list.map(b => b.id).join(',');
  if (g._k === key) return;
  g._k = key;
  g.textContent = '';
  for (const b of list) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', b.cx);
    t.setAttribute('y', -(b.y1 != null ? b.y1 : b.cy) - 1.2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '3.2');
    t.setAttribute('font-weight', '700');
    t.setAttribute('fill', '#ff5252');
    t.setAttribute('stroke', '#000');
    t.setAttribute('stroke-width', '.5');
    t.setAttribute('paint-order', 'stroke');
    t.textContent = 'FORCED BAD';
    g.appendChild(t);
  }
}
function paint() {
  if (AN.p2 && AN.p2L && !paint._in) {
    paint._in = 1;
    try {
      p2With(paint0);
    } catch (e) {
      console.error('pane2', e);
    } finally {
      paint._in = 0;
    }
  }
  paint0();
}
function p2With(fn) {
  const sh2 = AN.p2;
  if (!sh2 || !sh2.S) return;
  const a = document.getElementById('svg'),
    b = document.getElementById('svg2'),
    keep = { i: AN.i, L, sel: AN.sel, dbg: AN.dbgL };
  a.id = 'svg_m';
  b.id = 'svg';
  try {
    AN.i = AN.sheets.indexOf(sh2);
    L = AN.p2L;
    AN.sel = null;
    fn();
  } finally {
    b.id = 'svg2';
    a.id = 'svg';
    AN.p2L = L;
    AN.i = keep.i;
    L = keep.L;
    AN.sel = keep.sel;
    AN.dbgL = keep.dbg;
  }
}
function p2Close() {
  AN.p2 = null;
  AN.p2L = null;
  AN.p2k = null;
  const c = document.getElementById('cv2');
  if (c) c.classList.remove('on');
  if (typeof bP2 !== 'undefined') bP2.classList.remove('on');
  try {
    localStorage.removeItem('ls-p2');
  } catch (e) {}
}
function p2Open(name) {
  const sh = AN.sheets.find(s => s.name === name);
  if (!sh) return;
  if (sh === cs()) {
    msg('The same sheet cannot be open in both panes');
    return;
  }
  AN.p2 = sh;
  AN.p2k = null;
  try {
    localStorage.setItem('ls-p2', name);
  } catch (e) {}
  p2Sync();
}
function p2Sync() {
  const c = document.getElementById('cv2');
  if (!c) return;
  const sh2 = AN.p2;
  if (!sh2 || AN.cat !== 'an') {
    c.classList.remove('on');
    if (typeof bP2 !== 'undefined') bP2.classList.toggle('on', !!sh2 && AN.cat === 'an');
    return;
  }
  if (sh2 === cs()) {
    p2Close();
    msg('Second pane closed: the same sheet cannot be open twice');
    return;
  }
  c.classList.add('on');
  bP2.classList.add('on');
  if (AN.p2k !== sh2.name) {
    AN.p2k = sh2.name;
    try {
      ensure(sh2);
      linksOf(sh2);
      anFXRe(sh2);
    } catch (e) {
      msg('Second sheet could not be compiled: ' + e.message);
      p2Close();
      return;
    }
    const a = document.getElementById('svg'),
      b = document.getElementById('svg2'),
      keep = { i: AN.i, L };
    a.id = 'svg_m';
    b.id = 'svg';
    try {
      AN.i = AN.sheets.indexOf(sh2);
      drawSheet(sh2);
    } finally {
      b.id = 'svg2';
      a.id = 'svg';
      AN.p2L = L;
      AN.i = keep.i;
      L = keep.L;
    }
    const h = document.getElementById('cv2h');
    h.innerHTML = '';
    const sel = h$(
      'select',
      { style: 'max-width:300px' },
      AN.sheets
        .filter(s => !/ABC-000/.test(s.name))
        .map(s => h$('option', { value: s.name, txt: s.name + ' · ' + (s.title || '') }))
    );
    sel.value = sh2.name;
    sel.onchange = () => p2Open(sel.value);
    h.append(
      h$('b', { txt: 'Second sheet' }),
      sel,
      h$('button', {
        txt: '⇄ Swap',
        title: 'Make this the main sheet (to click blocks, force and type values); the main sheet moves here',
        onclick: () => {
          const m = cs(),
            t = AN.p2;
          AN.p2 = m;
          AN.p2k = null;
          go(AN.sheets.indexOf(t));
        }
      }),
      h$('button', { txt: '＋', title: 'Zoom in', onclick: () => p2Sync.zoom(0.7) }),
      h$('button', { txt: '－', title: 'Zoom out', onclick: () => p2Sync.zoom(1.4) }),
      h$('button', {
        txt: 'Fit',
        onclick: () => {
          const s2 = document.getElementById('svg2');
          delete AN.av[AN.p2.name];
          AN.p2k = null;
          p2Sync();
        }
      }),
      h$('span', { cls: 'sp', style: 'flex:1' }),
      h$('small', { txt: 'watch only: wheel / ＋ － / pinch / double-click = zoom, drag = move' }),
      h$('button', {
        txt: '✕',
        title: 'Close the second sheet',
        onclick: () => {
          p2Close();
        }
      })
    );
    if (!p2Sync._ev) {
      p2Sync._ev = 1;
      const s2 = document.getElementById('svg2'),
        PT = new Map();
      let d = null,
        pin = null;
      const vbo = () => s2.getAttribute('viewBox').split(' ').map(Number),
        setv = v => {
          s2.setAttribute('viewBox', v.join(' '));
          if (AN.p2) AN.av[AN.p2.name] = v;
        };
      /* zoom about a screen point; f < 1 = in */
      const zoomAt = (cx, cy, f) => {
        const v = vbo(),
          r = s2.getBoundingClientRect(),
          px = v[0] + ((cx - r.left) / r.width) * v[2],
          py = v[1] + ((cy - r.top) / r.height) * v[3];
        setv([px - (px - v[0]) * f, py - (py - v[1]) * f, v[2] * f, v[3] * f]);
      };
      p2Sync.zoom = f => {
        const r = s2.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
      };
      s2.addEventListener(
        'wheel',
        e => {
          e.preventDefault();
          const k = Math.max(-3, Math.min(3, e.deltaY / (e.deltaMode === 1 ? 3 : 100)));
          zoomAt(e.clientX, e.clientY, Math.pow(0.85, -k * (e.ctrlKey ? 2 : 1)));
        },
        { passive: false }
      );
      s2.addEventListener('dblclick', e => zoomAt(e.clientX, e.clientY, 0.5));
      s2.addEventListener('pointerdown', e => {
        PT.set(e.pointerId, [e.clientX, e.clientY]);
        s2.setPointerCapture(e.pointerId);
        if (PT.size === 2) {
          const a = [...PT.values()];
          pin = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) };
          d = null;
        } else d = { x: e.clientX, y: e.clientY, v: vbo() };
      });
      s2.addEventListener('pointermove', e => {
        if (!PT.has(e.pointerId)) return;
        PT.set(e.pointerId, [e.clientX, e.clientY]);
        if (PT.size === 2 && pin) {
          const a = [...PT.values()],
            nd = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
          if (nd > 5 && pin.d > 5) {
            zoomAt((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2, pin.d / nd);
            pin.d = nd;
          }
          return;
        }
        if (!d) return;
        const r = s2.getBoundingClientRect(),
          v = d.v.slice();
        v[0] -= ((e.clientX - d.x) / r.width) * v[2];
        v[1] -= ((e.clientY - d.y) / r.height) * v[3];
        setv(v);
      });
      const up = e => {
        PT.delete(e.pointerId);
        if (PT.size < 2) pin = null;
        if (PT.size === 0) d = null;
        else if (PT.size === 1) {
          const a = [...PT.values()][0];
          d = { x: a[0], y: a[1], v: vbo() };
        }
      };
      s2.addEventListener('pointerup', up);
      s2.addEventListener('pointercancel', up);
    }
    paint();
  }
}
function paint0() {
  const sh = cs();
  if (!sh || !sh.S || !L) return;
  try {
    const m = document.getElementById('anmode');
    if (m) {
      const t = AN.view ? 'VIEW / TRACE - NO SIMULATION' : AN.run ? 'SIMULATION - RUNNING' : 'SIMULATION - PAUSED';
      if (m._t !== t) {
        m._t = t;
        m.textContent = t;
        m.style.background = AN.view ? '#16324a' : AN.run ? '#12391f' : '#3d3213';
        m.style.color = AN.view ? '#8fd3ff' : AN.run ? '#7dffb0' : '#ffd479';
        m.title = AN.view
          ? 'VIEW / TRACE: the drawing is shown and signals can be traced, but nothing is simulated (wires are grey because there are no values)'
          : 'SIMULATION: the logic is computed with the inputs you set';
      }
    }
  } catch (e) {}
  try {
    cosPopPos();
  } catch (e) {}
  try {
    badMarks();
  } catch (e) {}
  try {
    reviewMarks();
  } catch (e) {}
  AN.dbgL = L;
  try {
    stepUi();
  } catch (e) {}
  try {
    tagHi();
  } catch (e) {}
  const S = sh.S,
    v = S.rt.v,
    vb = AN.vals;
  const selNets = AN.sel && AN.sel.net != null ? new Set([AN.sel.net]) : null;
  /* a selector input that is NOT the one in use: its wire is shown dimmed (nothing flows through it) */
  let dk = '';
  for (const b of S.blk)
    if (b.k === 'SW' || b.k === 'AMT') {
      const q = S.rt.st[b.id];
      dk += q && q.pk === 'B' ? 'B' : 'A';
    } else if ((b.k === 'HS' || b.k === 'LS') && b.i.length > 1) dk += anHL(S, b) + ',';
  if (S._dk !== dk || !S._dead) {
    S._dk = dk;
    S._dead = anDead(S);
  }
  const dead = S._dead;
  const ANC = anColor(),
    dW = +AN.ws.dw || 1,
    aW = +AN.ws.aw || 1,
    tube = AN.ws.as !== 'solid';
  document.documentElement.style.setProperty('--alive', ANC);
  document.documentElement.style.setProperty('--alv', anLite(ANC));
  anLgdUpd();
  for (const b of S.blk)
    if (b.k === 'VLV' && b.pnl) {
      const q = S.rt.st[b.id],
        mvb = !!(q && q.mv) && !!AN.run && !AN.view;
      for (const id of b.pnl) {
        const e = L.nets[id];
        if (e) e.classList.toggle('blink', mvb);
        const k = L.core && L.core[id];
        if (k) k.classList.toggle('blink', mvb);
        for (const a of (L.arw && L.arw[id]) || []) a.classList.toggle('blink', mvb);
      }
    }
  {
    const rs = document.documentElement.style;
    rs.setProperty('--vcol', AN.ws.vc === 'wire' ? anLite(ANC) : VCS[AN.ws.vc] || VCS.green);
    AN.ws.vi = AN.ws.vi || 'cyan';
    AN.ws.vz = AN.ws.vz || 'amber';
    document.documentElement.style.setProperty('--vin', VCS[AN.ws.vi] || VCS.cyan);
    document.documentElement.style.setProperty('--vfr', VCS[AN.ws.vz] || VCS.amber);
    rs.setProperty('--vff', VFF[AN.ws.vf] || VFF.mono);
    rs.setProperty('--vfw', String(AN.ws.vw || 600));
  }
  const BADC = '#ff4d4d',
    BADN = new Set();
  if (!AN.view)
    for (const b of S.blk) {
      if (b.k === 'AI' && aiBad(S, b.id)) for (const o of b.o) BADN.add(o);
      if (b.k === 'SEL') {
        const q = S.rt.st[b.id];
        if (q && q.nok === 0 && b.o) for (const o of b.o) BADN.add(o);
      }
    }
  const DCc = anDcol(),
    dTube = AN.ws.ds === 'tube',
    FCOL = AN.ws.fc === 'same' ? null : COLS[AN.ws.fc] || '#ffffff';
  for (const n of S.nets) {
    const e = L.nets[n.id];
    if (!e) continue;
    let c,
      w,
      o = 1;
    const isD = n.dig ? dead.direct && dead.direct.has(n.id) : dead.has(n.id),
      on = n.dig ? v[n.id] > 0.5 : Math.abs(v[n.id]) > 1e-6;
    /* digital = thin line (live colour when 1); analog = tube (analog colour when it carries a value); not-selected T input = faint */
    const wd_ = (dTube ? 0.95 : 0.8) * dW,
      wa_ = (tube ? 0.95 : 0.8) * aW,
      PNC = COLS[AN.ws.pc] || COLS.sky;
    document.documentElement.style.setProperty('--pnc', PNC);
    if (AN.view) {
      c = '#7f8d99';
      w = n.dig ? wd_ : wa_;
      o = 1;
    } else if (n.pn) {
      c = 'var(--pnc)';
      w = 0.8 * aW;
    } else if (isD) {
      c = '#3b4651';
      w = n.dig ? wd_ : wa_;
      o = 1;
    } else if (n.dig) {
      c = on ? DCc : '#3b4651';
      w = wd_;
    } else {
      c = ANC;
      w = wa_;
    } /* analog: always coloured, a value (even 0) is flowing */
    if (S.selw && S.selw[n.id] != null && !AN.view) {
      c = v[n.id] > 0.5 ? '#3b4651' : ANC;
      w = wa_;
      o = 1;
    }
    const lk = (S.look || {})[n.id];
    if (lk && !AN.view) {
      if (lk.c && COLS[lk.c] && !isD) c = COLS[lk.c];
      if (lk.w) w *= lk.w;
    }
    if (BADN.has(n.id) && !isD) c = BADC;
    const fo = !AN.view && S.rt.force[n.id] !== undefined && !(S.rt.pf && S.rt.pf[n.id]);
    if (fo && FCOL) c = FCOL;
    const sl = selNets && selNets.has(n.id);
    if (sl) w += 0.45;
    let hal = '';
    {
      const T = trSet(sh);
      if (T) {
        if (T.start.has(n.id)) hal = TST;
        else if (T.up.has(n.id)) hal = TUP;
        else if (T.dn.has(n.id)) hal = TDN;
        else o = 0.18;
      }
      /* 2.3.0 (user: the glow is ugly): the traced wire itself takes the trace colour, solid and thicker, no blur */
      if (hal && AN.view) {
        c = hal;
        w += T.start.has(n.id) ? 0.7 : 0.45;
      }
    }
    if (e._h !== hal) {
      e._h = hal;
      e.style.filter = '';
    }
    const dsh = fo ? '1.4 .8' : BADN.has(n.id) && !isD ? '2 1' : null;
    if (e._c !== c || e._d !== dsh || e._w !== w || e._o !== o || e._r !== AN.wsr) {
      e._c = c;
      e._d = dsh;
      e._w = w;
      e._o = o;
      e._r = AN.wsr;
      ((L.arw && L.arw[n.id]) || []).forEach(q => {
        q.setAttribute('fill', c);
        q.setAttribute('fill-opacity', o);
      });
      e.setAttribute('stroke', c);
      e.setAttribute('stroke-width', w);
      e.setAttribute('stroke-opacity', o);
      if (dsh) e.setAttribute('stroke-dasharray', dsh);
      else e.removeAttribute('stroke-dasharray');
      const k = L.core && L.core[n.id];
      if (k) {
        k.style.display = (n.pn ? false : n.dig ? dTube : tube) ? '' : 'none';
        k.setAttribute('stroke-width', w * 0.22);
        if (dsh) k.setAttribute('stroke-dasharray', dsh);
        else k.removeAttribute('stroke-dasharray');
      }
    }
  }
  for (const g of L.legs || []) {
    const q = S.rt.st[g.b.id],
      pk = q && q.pk === 'B' ? 'B' : 'A',
      dim = g.side[0] === 'h' ? g.n !== anHL(S, g.b) : (g.side === 'a') === (pk === 'B'),
      ne = L.nets[g.n];
    if (!ne) continue;
    if (dim) {
      g.e.style.display = '';
      g.e.setAttribute('stroke-width', ((ne._w || 0.8) + 0.12).toFixed(2));
      g.on = 1;
      for (const a of g.arw) {
        a.setAttribute('fill', '#3b4651');
        a.setAttribute('fill-opacity', 1);
      }
    } else if (g.on) {
      g.e.style.display = 'none';
      g.on = 0;
      for (const a of g.arw) {
        a.setAttribute('fill', ne._c || '#3b4651');
        a.setAttribute('fill-opacity', ne._o == null ? 1 : ne._o);
      }
    }
  }
  for (const q of L.dots || []) {
    const ne = L.nets[q.n];
    if (ne && ne._c && q.c !== ne._c) {
      q.c = ne._c;
      q.e.setAttribute('fill', ne._c);
    }
  }
  for (const f of L.fo) {
    const n = f.b.pins[0].n,
      ne = L.nets[n],
      on = S.nets[n].dig ? v[n] > 0.5 : Math.abs(v[n]) > 1e-6,
      c = (on || AN.view) && ne ? ne._c : 'none';
    if (f._o !== c) {
      f._o = c;
      f.e.setAttribute('fill', c);
    }
  }
  for (const o of L.ov) {
    /* a block with no state yet (ABC-000A painted by the Reset of a starting-state load threw here and stopped the load: unit model
       OFF, beta.46 check) */
    const b = o.b,
      st = S.rt.st[b.id] || {};
    let key,
      fill = 'none',
      op = 0,
      txt = '';
    if (o.k === 'AO' || o.k === 'PO') {
      const x = o.n >= 0 ? v[o.n] : 0,
        pc = Math.max(0, Math.min(100, x));
      key = fmt(x);
      txt = fmt(x) + '%';
      fill = 'hsl(145,70%,38%)';
      op = 0.12 + (0.55 * pc) / 100;
    } else if (o.k === 'VLV') {
      const pos = st.pos == null ? 0 : st.pos,
        mv = !!st.mv,
        col = mv ? '#ffffff' : pos <= 0.5 ? '#35e08a' : pos >= 99.5 ? '#ff4d4d' : '#4da3ff';
      key = pos.toFixed(0) + (mv ? (st.dir > 0 ? 'u' : 'd') : '') + col;
      txt = (mv ? (st.dir > 0 ? '▲' : '▼') : '') + pos.toFixed(0) + '%';
      fill = col;
      op = 0.3;
      if (o.last !== key) {
        o.e.setAttribute('stroke', col);
        o.t.style.fill = col;
      }
    } else if (o.k === 'ACH') {
      const vq = S.blk.find(q => q.id === b.vlv),
        vs = vq && S.rt.st[vq.id],
        pos = vs && vs.pos != null ? vs.pos : 0,
        mv = !!(vs && vs.mv),
        col = !vq ? '#e8c9a0' : mv ? '#ffffff' : pos <= 0.5 ? '#35e08a' : pos >= 99.5 ? '#ff4d4d' : '#4da3ff';
      key = col + (mv ? 'm' : '');
      txt = '';
      fill = col;
      op = 0.22;
      o.e.classList.toggle('blink', mv && !!AN.run && !AN.view);
      if (o.last !== key) o.e.setAttribute('stroke', col);
    } else if (o.k === 'COS') {
      const tq = S.rt.st[b.tb],
        lit = !!(tq && tq.pk === 'B');
      key = lit ? '1' : '0';
      txt = '';
      fill = lit ? '#ff7ad9' : '#0b1013';
      op = lit ? 0.45 : 1;
      if (o.last !== key) o.e.setAttribute('stroke', lit ? '#ff7ad9' : '#3b4651');
    } else if (o.k === 'TMR') {
      const sec = b.k === 'TPV' ? (b.xin >= 0 ? v[b.xin] : 0) : b.p.sec,
        acc = st.acc || 0,
        SC = sec > 0 ? sec : 1;
      let show = 0,
        frac = 0,
        t_ = '';
      if (b.k === 'TON') {
        if (st.out) {
          show = 1;
          frac = 1;
          t_ = '▲' + +sec.toFixed(1) + '/' + +sec.toFixed(1) + 's';
        } else if (acc > 0) {
          show = 1;
          frac = Math.min(1, acc / SC);
          t_ = '▲' + acc.toFixed(1) + '/' + +sec.toFixed(1) + 's';
        }
      } else if (b.k === 'TOF') {
        if (st.out && acc > 0) {
          show = 1;
          const r_ = Math.max(0, sec - acc);
          frac = r_ / SC;
          t_ = '▼' + r_.toFixed(1) + 's';
        }
      } else if (st.run) {
        show = 1;
        frac = Math.min(1, acc / SC);
        t_ = '▲' + Math.min(acc, sec).toFixed(1) + '/' + +sec.toFixed(1) + 's';
      }
      key = (show ? '1' : '0') + t_;
      txt = t_;
      if (o.last !== key) {
        const vis = show ? 'visible' : 'hidden';
        o.tk.setAttribute('visibility', vis);
        o.fl.setAttribute('visibility', vis);
        o.fl.setAttribute('width', (o.w * frac).toFixed(2));
      }
    } else if (o.k === 'ACT') {
      const pos = st.pos == null ? 0 : st.pos,
        mv = !!st.mv;
      key = pos.toFixed(0) + (mv ? (st.dir > 0 ? 'u' : 'd') : '');
      txt = (mv ? (st.dir > 0 ? '▲' : '▼') : '') + pos.toFixed(0) + '%';
      fill = 'hsl(195,85%,45%)';
      op = 0.12 + (0.6 * pos) / 100;
    } else if (o.k === 'ALM') {
      const lv = almLv(b, o.n >= 0 ? v[o.n] : 0);
      key = lv;
      txt = lv === 'normal' ? '' : lv;
      if (lv !== 'normal') {
        fill = /HIGH-HIGH|LOW-LOW/.test(lv) ? '#ff3b3b' : '#ffa31a';
        op = 0.5;
      }
    } else {
      key = (st.pk || 'A') + (st.fm || '') + ANC + DCc;
      txt = '';
    }
    /* one number only: an AO whose address value is already shown, and a valve whose 0 ~ 100 % feedback AI is already shown, do not repeat the number in the block (the colour and the arrows stay) */
    if (o.dup === undefined) {
      o.dup = 0;
      if ((o.k === 'AO' || o.k === 'PO') && L.addrN && b.pins.some(p => L.addrN.has(p.n))) o.dup = 1;
      else if (o.k === 'VLV' || o.k === 'ACT') {
        const ai = S.blk.find(
            a => a.k === 'AI' && a.fb && a.fb.id === b.id && a.rng && a.rng.lo === 0 && a.rng.hi === 100
          ),
          on = ai && ai.o && ai.o[0];
        if (on != null && L.addrN && L.addrN.has(on)) o.dup = 2;
      }
    }
    if (o.dup === 1) txt = '';
    else if (o.dup === 2) txt = txt.replace(/\d+%$/, '');
    if (o.last !== key) {
      o.last = key;
      if (o.k === 'SW') {
        const A = (st.pk || 'A') !== 'B',
          sn = A ? b.a : b.b,
          dg = sn >= 0 && S.nets[sn] && S.nets[sn].dig,
          col = dg ? DCc : ANC,
          f = (e, on, base) => {
            if (!e) return;
            e.setAttribute('fill', on ? col : base || '#d5dde3');
            e.setAttribute('font-weight', on ? '800' : '400');
          };
        f(o.ea, A, o.ba);
        f(o.eb, !A, o.bb);
      }
      if (o.e) {
        o.e.setAttribute('fill', fill);
        o.e.setAttribute('fill-opacity', op);
      }
      o.t.textContent = txt;
    }
  }
  L.gb.style.display = vb && !AN.view ? '' : 'none';
  if (vb && !AN.view)
    for (const k in S.rt.force) if (!(S.rt.pf && S.rt.pf[k]) && L.mkBadge && !(L.have && L.have.has(+k))) L.mkBadge(+k);
  for (const b of L.bd) {
    if (b.wire && !b.skip) {
      const sw = AN.wireVals && !(L.addrN && L.addrN.has(b.n)) && !S.nets[b.n].dig ? '' : 'none';
      if (b.sw !== sw) {
        b.sw = sw;
        b.t.style.display = sw;
      }
    }
    if (b.skip) {
      const f = S.rt.force[b.n] !== undefined && !(S.rt.pf && S.rt.pf[b.n]);
      if (b.fv !== f) {
        b.fv = f;
        b.t.style.display = f ? '' : 'none';
      }
    }
    const q_ = S._tr && S._tr[b.n] !== undefined ? S.rt.st[S._tr[b.n]] : null,
      x =
        (q_ && q_.mv ? (q_.dir > 0 ? '▲' : '▼') : '') +
        (b.ai != null && S.rt.st[b.ai] && S.rt.force[b.n] === undefined && !aiBad(S, b.ai)
          ? fmt(S.rt.st[b.ai].act)
          : (S.nets[b.n] || {}).dig
            ? v[b.n] > 0.5
              ? '1'
              : '0'
            : fmt(v[b.n]));
    if (b.last !== x) {
      b.last = x;
      b.t.textContent = x;
    }
    {
      const es = S._extSet || (S._extSet = new Set(S.ext)),
        ck = S.rt.force[b.n] !== undefined ? 'f' : es.has(b.n) && !S.nets[b.n].dig ? 'i' : '';
      if (b.ck !== ck) {
        b.ck = ck;
        b.t.classList.toggle('frc', ck === 'f');
        b.t.classList.toggle('inp', ck === 'i');
      }
    }
  }
  const t = S.rt.t;
  tClk.textContent =
    't = ' +
    Math.floor(t / 60) +
    ':' +
    String(Math.floor(t % 60)).padStart(2, '0') +
    (AN.run && AN.tierK > 1 ? '  · light mode x' + AN.tierK : '');
  tClk.title =
    AN.tierK > 1
      ? 'Slow device: the sheets that are not joined to this one are calculated every ' +
        AN.tierK +
        'th tick (the whole plant keeps running)'
      : '';
}
function cosPopClose() {
  const o = document.getElementById('cospop');
  if (o) {
    if (o._pu)
      for (const f of o._pu) {
        const k = PU.indexOf(f);
        if (k >= 0) PU.splice(k, 1);
      }
    o.remove();
  }
}
function cosPopPos() {
  const o = document.getElementById('cospop');
  if (!o || !L || !AN.sel || !AN.sel.blk) return;
  const b = AN.sel.blk,
    svg = L.gb && L.gb.ownerSVGElement;
  if (!svg) return;
  const m = svg.getScreenCTM(),
    p = svg.createSVGPoint();
  p.x = b.x1 + 1;
  p.y = -b.y1;
  const q = p.matrixTransform(m);
  o.style.left = Math.max(4, Math.min(innerWidth - o.offsetWidth - 4, q.x + 6)) + 'px';
  o.style.top = Math.max(4, Math.min(innerHeight - o.offsetHeight - 4, q.y - o.offsetHeight - 6)) + 'px';
}
function cosPop() {
  cosPopClose();
  const sh = cs(),
    s = AN.sel;
  if (!sh || !sh.S || !s || !s.blk || s.blk.k !== 'COS' || !s.blk.used || AN.cat !== 'an') return;
  const S = sh.S,
    b = s.blk,
    n = b.vnet,
    e = cosInfo(S, n);
  if (!e) return;
  const o = h$('div', { id: 'cospop' });
  o.style.cssText =
    'position:fixed;z-index:60;background:var(--c-well);border:1px solid #ff7ad9;border-radius:6px;padding:8px 10px;width:260px;box-shadow:0 4px 18px #000a;font-size:12px;color:var(--c-tx)';
  const x = h$('button', { txt: '✕', title: 'Close (Esc)' });
  x.style.cssText = 'float:right;padding:0 6px';
  x.onclick = () => {
    AN.sel = null;
    selBox();
    cosPopClose();
  };
  const PU0 = PU.length;
  o.append(
    x,
    h$('b', { txt: 'COS manual value', style: 'color:#ff7ad9' }),
    h$('div', { txt: cosDesc(S, sh, e) || nm(S, n) || '', style: 'color:var(--c-tx2);margin:2px 0 4px' })
  );
  {
    /* the operator change-over of the T switch next to this COS: Auto / Force A / Force B */ const tg = S.blk
      .filter(z => z.k === 'AMT' || z.k === 'SW')
      .sort((p, q) => Math.hypot(p.cx - b.cx, p.cy - b.cy) - Math.hypot(q.cx - b.cx, q.cy - b.cy))[0];
    if (tg && Math.hypot(tg.cx - b.cx, tg.cy - b.cy) < 24) {
      const st = S.rt.st[tg.id],
        a = h$('select', {}, [
          h$('option', { value: '', txt: 'Auto (follows the select signal)' }),
          h$('option', { value: 'A', txt: 'Force input A (auto leg)' }),
          h$('option', { value: 'B', txt: 'Force input B (manual leg: COS value)' })
        ]);
      a.value = st.fm || '';
      a.onchange = () => swSet(sh, tg, a.value);
      const bk = h$('button', {
        txt: 'Back to AUTO (A)',
        title:
          'Operator presses A on the faceplate: the switch goes to input A once and is then free again (it stays in A until a control sends it to B). Needed after a bad signal sent it to MANUAL: the switch of the drawing keeps its last position.',
        style: 'margin-left:6px'
      });
      bk.onclick = () => {
        swSet(sh, tg, 'A');
        swSet(sh, tg, '');
        a.value = '';
      };
      const t = h$('span', { style: 'margin-left:6px;color:#8fe3b0' });
      const f = () => {
        t.textContent = 'Active: ' + (st.pk || 'A') + (st.fm ? ' (forced)' : '');
        if (document.activeElement !== a) a.value = st.fm || '';
      };
      f._s = 1;
      PU.push(f);
      f();
      o.append(h$('div', { style: 'margin:4px 0' }, [h$('span', { txt: 'T switch: ' }), a, bk, t]));
    }
  }
  o.append(ctl(S, sh, n));
  if (e.rng) {
    const r = e.rng,
      set = v => {
        if (!cosOn(S, e).on) return;
        S.rt.ext[n] = v;
        (sv(sh).ext = sv(sh).ext || {})[n] = v;
        anSave();
        settle();
      },
      row = h$('div', { style: 'display:flex;gap:6px;margin-top:6px' });
    for (const [t, v] of [
      ['Min', r.lo],
      ['Mid', (r.lo + r.hi) / 2],
      ['Max', r.hi]
    ])
      row.append(h$('button', { txt: t + ' (' + fmt(v) + ')', onclick: () => set(v) }));
    o.append(row);
  }
  o._pu = PU.slice(PU0);
  for (const f of o._pu) delete f._s;
  /* v1.20.21: the panel rebuild (selUpd0_) drops every updater with _s: the popover keeps its own until cosPopClose() */ document.body.append(
    o
  );
  cosPopPos();
}
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && document.getElementById('cospop')) {
    AN.sel = null;
    try {
      selBox();
    } catch (e) {}
    cosPopClose();
  }
});
function selBox() {
  try {
    cosPop();
  } catch (e) {
    console.error('cosPop', e);
  }
  try {
    tagHi();
  } catch (e) {}
  const g = L && L.selg;
  if (!g) return;
  g.innerHTML = '';
  const s = AN.sel;
  if (!s || !s.blk) return;
  const b = s.blk;
  el(
    'rect',
    {
      x: b.x0 - 0.8,
      y: -b.y1 - 0.8,
      width: b.x1 - b.x0 + 1.6,
      height: b.y1 - b.y0 + 1.6,
      fill: 'none',
      stroke: 'var(--sel)',
      'stroke-width': 0.4,
      'stroke-dasharray': '1.6 1'
    },
    g
  );
}
