/* In-app UAT v2: every logic block and controller of a sheet is tested one by one, grouped by block type.
   The panel sets up (reset, force, switch position), runs the simulation, compares the result with the expected value from the
   block definition and shows PASS / FAIL per case. The user only checks the failures and the line colours. */
(function () {
  const D = JSON.parse(document.getElementById('uatdata').textContent),
    VER = D.ver,
    KNOWN = D.known || {},
    KEY = 'uat-blocks-' + VER;
  let R = {};
  try {
    R = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(R));
    } catch (e) {}
  };
  const E = (t, a, c) => {
    const e = document.createElement(t);
    if (a)
      for (const k in a) {
        if (k === 'txt') e.textContent = a[k];
        else if (k === 'cls') e.className = a[k];
        else if (k === 'on') e.onclick = a[k];
        else e.setAttribute(k, a[k]);
      }
    (c || []).forEach(x => e.append(x));
    return e;
  };
  document.head.append(
    E('style', {
      txt: `#uatb{position:fixed;left:8px;bottom:36px;z-index:50;background:#1d3a2b;color:#bfe3cc;border:1px solid #6fbf8f;padding:8px 14px;border-radius:8px;font:600 14px system-ui;cursor:pointer}
#uatp{position:fixed;left:0;top:0;bottom:0;width:min(440px,100vw);z-index:60;background:#10151a;color:#dbe5ec;border-right:1px solid #2a3743;overflow:auto;font:14px/1.4 system-ui;padding:10px 12px 40px;display:none}
#uatp h3{margin:0;font-size:16px;color:#6aaee0;flex:1}#uatp .sub{color:#8a9aa6;font-size:12px;margin:4px 0}
#uatp button,#uatp select{background:#18212a;color:#dbe5ec;border:1px solid #2a3743;padding:7px 11px;border-radius:6px;font:inherit;cursor:pointer}
#uatp button.go{background:#16324a;border-color:#6aaee0}#uatp button.on{background:#1d3a2b;border-color:#6fbf8f;color:#6fbf8f}
#uatp details{background:#18212a;border:1px solid #2a3743;border-radius:8px;margin:8px 0}#uatp summary{padding:9px 10px;cursor:pointer;font-weight:600;display:flex;gap:8px}
#uatp summary span.c{margin-left:auto;font-weight:400;font-size:13px}
#uatp .it{border-top:1px solid #2a3743;padding:7px 10px}#uatp .it .h{display:flex;gap:6px;align-items:center}#uatp .it .h b{flex:1;font-size:13px;word-break:break-word}
#uatp .it .h button{padding:4px 8px}
#uatp table{width:100%;border-collapse:collapse;margin:6px 0;font-size:12px}#uatp td{padding:3px 4px;border-top:1px solid #2a3743;vertical-align:top}#uatp td.v{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#uatp .y{color:#6fbf8f}#uatp .n{color:#d9786f}#uatp .w{color:#d8b860}#uatp .row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;align-items:center}
#uatp .bar{height:8px;background:#2a3743;border-radius:4px;overflow:hidden;margin:6px 0}#uatp .bar i{display:block;height:100%;background:#6fbf8f}
#uatp pre{white-space:pre-wrap;background:#0d1217;padding:8px;border-radius:6px;font-size:12px}`
    })
  );
  const P = E('div', { id: 'uatp' }),
    btn = E('button', {
      id: 'uatb',
      txt: 'UAT',
      on: () => {
        P.style.display = P.style.display === 'block' ? 'none' : 'block';
        build();
      }
    });
  document.body.append(btn, P);
  const sheet = () => AN.sheets[AN.i];
  const SPEC = {},
    RES = {};
  const spec = sh => SPEC[sh.name] || (SPEC[sh.name] = UATG.sheetSpec(sh));
  const rkey = (n, id) => n + '|' + id;
  /* run: the app is stopped while a test runs (the tests reset and force the sheet by themselves); the user's run state is restored */
  function runItems(sh, items) {
    const run0 = AN.run;
    AN.run = false;
    try {
      for (const it of items) {
        const r = UATR.runItem(sh, it);
        RES[rkey(sh.name, it.id)] = r;
      }
    } finally {
      try {
        AN.reset();
      } catch (e) {}
      AN.run = run0;
    }
  }
  async function runSheet(sh, items) {
    items = items || spec(sh).groups.flatMap(g => g.items);
    for (let i = 0; i < items.length; i += 40) {
      runItems(sh, items.slice(i, i + 40));
      await new Promise(r => setTimeout(r, 0));
    }
  }
  let msg = '',
    busy = false;
  async function runAll() {
    if (busy) return;
    busy = true;
    const t0 = Date.now();
    let k = 0;
    const names = AN.sheets.filter(x => !/^ABC-000/.test(x.name));
    for (const sh of names) {
      AN.ensure(sh);
    }
    for (const sh of names) {
      await runSheet(sh);
      k++;
      msg = 'AUTO-TEST: ' + k + ' / ' + names.length + ' sheets...';
      build();
    }
    msg = 'AUTO-TEST finished in ' + Math.round((Date.now() - t0) / 1000) + ' s.';
    busy = false;
    build();
  }
  function status(sh, it) {
    const r = RES[rkey(sh.name, it.id)];
    const m = R[rkey(sh.name, it.id)];
    if (m && m.v === 'ok') return 'ok-manual';
    if (!r) return 'todo';
    if (r.ok) return r.res.every(c => c.skip) ? 'skip' : 'pass';
    return 'fail';
  }
  function counts(sh, items) {
    const c = { pass: 0, fail: 0, todo: 0, skip: 0 };
    for (const it of items) {
      const s = status(sh, it);
      if (s === 'pass' || s === 'ok-manual') c.pass++;
      else if (s === 'fail') c.fail++;
      else if (s === 'skip') c.skip++;
      else c.todo++;
    }
    return c;
  }
  function sheetState(sh) {
    const all = spec(sh).groups.flatMap(g => g.items);
    const c = counts(sh, all);
    const col = R[rkey(sh.name, '_colour')];
    return { all, c, functional: all.length > 0 && c.fail === 0 && c.todo === 0 && col && col.v === 'ok' };
  }
  /* manual check (the user's own test): the sheet is set up exactly like the case (plant model off, paused) and the user reads the real values on the drawing */
  let MAN = null;
  function manual(sh, it, k) {
    const c = it.cases[k];
    if (!c) return;
    if (AN.run) {
      const b = [...document.querySelectorAll('button')].find(x => /Pause/.test(x.textContent));
      if (b) b.click();
      AN.run = false;
    }
    const sv = UATR.plantOff();
    let r;
    try {
      r = UATR.runCase(sh, c);
    } finally {
      UATR.plantRestore(sv);
    }
    try {
      AN.wireVals = true;
    } catch (e) {}
    try {
      AN.paint && AN.paint();
    } catch (e) {}
    MAN = { sh: sh.name, it: it.id, k, l: c.l, n: it.n, rows: r.rows || [] };
    find(it);
    build();
  }
  function manBanner(sh) {
    if (!MAN || MAN.sh !== sh.name) return null;
    const m = MAN,
      key = rkey(sh.name, m.it + '|m' + m.k);
    const set = v => {
      R[key] = { v };
      save();
      MAN = null;
      build();
    };
    return E(
      'div',
      { cls: 'it', style: 'background:#1d2a1d;border:1px solid #6fbf8f;border-radius:8px;margin:8px 0' },
      [
        E('b', { txt: 'YOUR OWN CHECK: ' + m.n }),
        E('div', {
          cls: 'sub',
          txt:
            'The sheet is paused and set up like this: ' +
            m.l +
            '. The plant model is not moving anything. Look at the highlighted block on the drawing (turn on Values / Wire values to see the numbers). It must show:'
        }),
        ...m.rows.map(w => E('div', { txt: '• ' + w.t + ' = ' + w.exp })),
        E('div', { cls: 'row' }, [
          E('button', { cls: 'on', txt: '✔ Matches the drawing', on: () => set('ok') }),
          E('button', { txt: '✖ Does not match', on: () => set('bad') }),
          E('button', {
            txt: 'Close',
            on: () => {
              MAN = null;
              build();
            }
          })
        ])
      ]
    );
  }
  /* pin: go to the block on the drawing (zoom is kept) */
  function find(it) {
    const sh = sheet(),
      S = sh.S,
      svg = document.getElementById('svg'),
      v = AN.av && AN.av[sh.name];
    if (!svg || !v || it.cx == null) return;
    const anp = document.getElementById('anp');
    if (!anp || anp.getBoundingClientRect().width < 5) {
      const pb = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Panel');
      if (pb) pb.click();
    }
    const r = svg.getBoundingClientRect(),
      upx = v[2] / r.width,
      visL = P.style.display === 'block' ? Math.max(0, P.getBoundingClientRect().right - r.left) : 0,
      visR = r.width - (anp ? Math.max(0, r.right - anp.getBoundingClientRect().left) : 0);
    const cx = (visL + Math.max(visL + 50, visR)) / 2;
    v[0] = it.cx - cx * upx;
    v[1] = -it.cy - (r.height / 2) * upx;
    svg.setAttribute('viewBox', v.join(' '));
    const old = svg.querySelector('#uatring');
    if (old) old.remove();
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    for (const [k, x] of [
      ['id', 'uatring'],
      ['cx', it.cx],
      ['cy', -it.cy],
      ['r', 24 * upx],
      ['fill', 'none'],
      ['stroke', '#ffe14a'],
      ['stroke-width', 3 * upx],
      ['pointer-events', 'none']
    ])
      ring.setAttribute(k, x);
    svg.append(ring);
    setTimeout(() => ring.remove(), 6000);
  }
  const icon = {
    pass: ['✔', 'y'],
    'ok-manual': ['✔ (accepted)', 'y'],
    fail: ['✖', 'n'],
    todo: ['·', 'w'],
    skip: ['skipped', 'w']
  };
  function itemEl(sh, g, it) {
    const s = status(sh, it),
      r = RES[rkey(sh.name, it.id)],
      known = (KNOWN[sh.name] || []).includes(it.id),
      box = E('div', { cls: 'it' });
    const open = E('details', {});
    box.append(
      E('div', { cls: 'h' }, [
        E('span', { cls: icon[s][1], txt: icon[s][0] }),
        E('b', { txt: it.n }),
        E('button', { txt: '📍', title: 'Show on the drawing', on: () => find(it) }),
        E('button', {
          cls: 'go',
          txt: '▶',
          title: 'Run this block',
          on: () => {
            runItems(sheet(), [it]);
            build();
          }
        })
      ])
    );
    if (r) {
      const tb = E('table');
      let ci = -1;
      for (const c of r.res) {
        const k = ++ci,
          mv = (R[rkey(sh.name, it.id + '|m' + k)] || {}).v;
        tb.append(
          E('tr', {}, [
            E('td', { cls: c.ok ? 'y' : 'n', txt: c.skip ? 'skip' : c.ok ? '✔' : '✖' }),
            E('td', { colspan: 3 }, [
              document.createTextNode(c.l + ' '),
              E('button', {
                txt: '👁' + (mv === 'ok' ? ' ✔' : mv === 'bad' ? ' ✖' : ''),
                title: 'Set the sheet up like this case and look at the drawing yourself',
                on: () => manual(sh, it, k)
              })
            ])
          ])
        );
        if (c.skip) tb.append(E('tr', {}, [E('td'), E('td', { colspan: 3, cls: 'sub', txt: c.skip })]));
        for (const w of c.rows)
          tb.append(
            E('tr', {}, [
              E('td'),
              E('td', { txt: w.t }),
              E('td', { cls: 'v', txt: 'expected ' + w.exp }),
              E('td', { cls: 'v ' + (w.ok ? 'y' : 'n'), txt: 'got ' + w.act })
            ])
          );
      }
      box.append(tb);
      if (s === 'fail') {
        box.append(
          E('div', {
            cls: 'sub',
            txt: known
              ? 'Listed as a known mismatch (HANDOFF, Needs Verification): the engine or the test setup differs from the block definition.'
              : 'New mismatch. Check it on the drawing with 📍, then press Accept or leave it as FAIL.'
          })
        );
        box.append(
          E('div', { cls: 'row' }, [
            E('button', {
              txt: 'Accept (behaviour is right)',
              on: () => {
                R[rkey(sh.name, it.id)] = { v: 'ok' };
                save();
                build();
              }
            })
          ])
        );
      }
      if (s === 'ok-manual')
        box.append(
          E('div', { cls: 'row' }, [
            E('button', {
              txt: 'Undo accept',
              on: () => {
                delete R[rkey(sh.name, it.id)];
                save();
                build();
              }
            })
          ])
        );
    }
    return box;
  }
  /* SCENARIO TEST: operator + proseso nang sabay (src/ui/uat/scen.js, scenarios/<sheet>.json). Isang pindot, isang linya bawat tseke. */
  const SRES = {};
  let sbusy = false;
  async function runScen(sh, list) {
    if (sbusy) return;
    sbusy = true;
    try {
      for (const sc of list) {
        SRES[sh.name + '|' + sc.id] = { lines: [], pass: 0, fail: 0, running: true };
        build();
        const r = await UATS.run(sh.name, sc, l => {
          SRES[sh.name + '|' + sc.id].lines.push(l);
          if (SRES[sh.name + '|' + sc.id].lines.length % 4 === 0) build();
        });
        SRES[sh.name + '|' + sc.id] = r;
        build();
      }
    } finally {
      sbusy = false;
      build();
    }
  }
  function scenBlock(sh) {
    const sp = (D.scen || {})[sh.name];
    if (!sp) return null;
    const box = E('div', {
      cls: 'it',
      style: 'background:#18212a;border:1px solid #6aaee0;border-radius:8px;margin:8px 0'
    });
    const all = sp.scenarios.map(x => SRES[sh.name + '|' + x.id]).filter(x => x && !x.running),
      tp = all.reduce((a, x) => a + x.pass, 0),
      tf = all.reduce((a, x) => a + x.fail, 0);
    box.append(
      E('div', { cls: 'h' }, [
        E('b', { txt: 'SCENARIO TEST: ' + sp.title }),
        E('span', {
          cls: tf ? 'n' : all.length ? 'y' : 'w',
          txt: all.length ? (tf ? tf + ' ✖' : '✔ ' + tp) : 'not run yet'
        })
      ])
    );
    box.append(
      E('div', {
        cls: 'sub',
        txt: 'Operator + process test: sets the inputs, presses AUTO / MAN / REMOTE / LOCAL, MV and SV on the operator panel and checks the result from input to output. Expected values come from the drawing, not from the engine. The app is paused while it runs; some tests take several minutes of simulation time.'
      })
    );
    box.append(
      E('div', { cls: 'row' }, [
        E('button', {
          cls: 'go',
          txt: sbusy ? 'Tumatakbo...' : '▶ Run ALL scenarios',
          on: () => runScen(sh, sp.scenarios)
        })
      ])
    );
    for (const sc of sp.scenarios) {
      const r = SRES[sh.name + '|' + sc.id],
        d = E('details', {});
      if (r && (r.fail || r.running)) d.open = true;
      d.append(
        E('summary', {}, [
          E('span', {
            cls: r && !r.running ? (r.fail ? 'n' : 'y') : 'w',
            txt: r && !r.running ? (r.fail ? '✖' : '✔') : r ? '…' : '·'
          }),
          E('span', { txt: sc.title }),
          E('span', { cls: 'c', txt: r && !r.running ? r.pass + ' / ' + (r.pass + r.fail) : '' })
        ])
      );
      d.append(E('div', { cls: 'sub', txt: 'Sa drawing: ' + sc.drawing }));
      d.append(
        E('div', { cls: 'row', style: 'padding:0 10px' }, [
          E('button', { txt: '▶ Run this one', on: () => runScen(sh, [sc]) })
        ])
      );
      if (r) {
        const tb = E('table');
        for (const l of r.lines)
          tb.append(
            E('tr', {}, [
              E('td', {
                cls: l.k === 'ok' ? 'y' : l.k === 'bad' ? 'n' : 'w',
                txt: l.k === 'ok' ? '✔' : l.k === 'bad' ? '✖' : '›'
              }),
              E('td', {}, [
                document.createTextNode(
                  l.t + (l.k !== 'do' && l.exp !== undefined ? '  →  inaasahan: ' + l.exp + ' | nakita: ' + l.got : '')
                )
              ])
            ])
          );
        d.append(tb);
      }
      box.append(d);
    }
    return box;
  }
  /* SPOT CHECK (1.23.0): 5 random cases of this sheet, each shown with its inputs and the rule written in numbers, the expected
     value (from the block definition, not from the engine) and what the simulator gave, so the user can check them by hand */
  let SPOT = null;
  function spotCheck(sh, sp) {
    const all = [];
    sp.groups.forEach(g => g.items.forEach(it => (it.cases || []).forEach(c => !c.skipMsg && all.push({ g: g.g, it, c }))));
    const pick = [];
    while (pick.length < Math.min(5, all.length)) {
      const x = all[Math.floor(Math.random() * all.length)];
      if (!pick.includes(x)) pick.push(x);
    }
    const sv = UATR.plantOff(),
      res = [];
    try {
      for (const p of pick) {
        const r = UATR.runCase(sh, p.c);
        res.push({ g: p.g, it: p.it, l: p.c.l, rows: r.rows || [], ok: r.ok });
      }
    } finally {
      UATR.plantRestore(sv);
      try {
        AN.reset();
      } catch (e) {}
    }
    SPOT = { sheet: sh.name, res };
    build();
  }
  function spotBox(sh) {
    const box = E('div', { cls: 'it', style: 'border-color:#3a5670' }, [
      E('div', { cls: 'h' }, [
        E('b', { txt: 'Spot check · ' + SPOT.res.filter(r => r.ok).length + ' / ' + SPOT.res.length + ' correct' }),
        E('button', { txt: '✕', on: () => ((SPOT = null), build()) })
      ]),
      E('div', { cls: 'sub', txt: 'Check each one: the rule is written in numbers. 📍 = show the block on the drawing.' })
    ]);
    for (const r of SPOT.res)
      box.append(
        E('div', { style: 'border-top:1px solid #26313c;padding:6px 0' }, [
          E('div', { cls: 'h' }, [
            E('span', { txt: r.ok ? '✔' : '✖', style: 'color:' + (r.ok ? '#6fe3a0' : '#ff7a7a') + ';font-weight:700' }),
            E('b', { txt: r.it.n }),
            E('button', { txt: '📍', title: 'Show on the drawing', on: () => find(r.it) })
          ]),
          E('div', { cls: 'sub', txt: r.g + ' · ' + r.l })
        ].concat(
          r.rows.map(x =>
            E('div', { cls: 'sub', style: 'font-family:var(--mf,monospace)' , txt: '  ' + x.t + ': inaasahan ' + x.exp + ' · nakita ' + x.act + (x.ok ? '  ✔' : '  ✖') })
          )
        ))
      );
    return box;
  }
  function build() {
    if (P.style.display !== 'block') return;
    const sh = sheet();
    if (!sh || /^ABC-000/.test(sh.name)) {
      P.innerHTML = '';
      P.append(
        E('div', { cls: 'row' }, [
          E('h3', { txt: 'UAT' }),
          E('button', {
            txt: '✕',
            on: () => {
              P.style.display = 'none';
            }
          })
        ]),
        E('div', { cls: 'sub', txt: 'Open an ABC sheet (not the legend) to test it.' })
      );
      return;
    }
    const keep = [...P.querySelectorAll('details[data-g]')].filter(d => d.open).map(d => d.dataset.g),
      top = P.scrollTop;
    const sp = spec(sh),
      st = sheetState(sh),
      names = AN.sheets.filter(x => !/^ABC-000/.test(x.name)).map(x => x.name),
      pos = names.indexOf(sh.name);
    P.innerHTML = '';
    P.append(
      E('div', { cls: 'row' }, [
        E('h3', { txt: sh.name + (st.functional ? '  FUNCTIONAL ✓' : '') }),
        E('button', {
          txt: '✕',
          on: () => {
            P.style.display = 'none';
          }
        })
      ])
    );
    const sel = E('select', {});
    names.forEach(nm => {
      const o = E('option', { txt: nm });
      o.value = nm;
      sel.append(o);
    });
    sel.value = sh.name;
    sel.onchange = () => AN.go(AN.sheets.findIndex(x => x.name === sel.value));
    const go = k => AN.go(AN.sheets.findIndex(x => x.name === names[(pos + k + names.length) % names.length]));
    P.append(
      E('div', { cls: 'row' }, [
        E('button', { txt: '◀', on: () => go(-1) }),
        sel,
        E('button', { txt: '▶', on: () => go(1) })
      ])
    );
    const c = st.c,
      tot = st.all.length || 1;
    P.append(
      E('div', {
        cls: 'sub',
        txt:
          st.all.length +
          ' blocks / controllers · ' +
          c.pass +
          ' pass · ' +
          c.fail +
          ' fail · ' +
          c.todo +
          ' not run' +
          (c.skip ? ' · ' + c.skip + ' skipped' : '')
      }),
      E('div', { cls: 'bar' }, [E('i', { style: 'width:' + Math.round((100 * c.pass) / tot) + '%' })])
    );
    P.append(
      E('div', { cls: 'row' }, [
        E('button', {
          cls: 'go',
          txt: '▶ Test this sheet',
          on: async () => {
            await runSheet(sh);
            build();
          }
        }),
        E('button', {
          cls: 'go',
          txt: '▶ Test ALL sheets',
          on: () => {
            runAll();
          }
        }),
        E('button', {
          txt: '🎲 Spot check (5)',
          title: '5 random cases with the rule in numbers, the expected and the actual value; check them yourself (calculator / drawing)',
          on: () => spotCheck(sh, sp)
        })
      ])
    );
    if (SPOT && SPOT.sheet === sh.name) P.append(spotBox(sh));
    if (msg) P.append(E('div', { cls: 'sub w', txt: msg }));
    {
      const sb = scenBlock(sh);
      if (sb) P.append(sb);
    }
    {
      const mb = manBanner(sh);
      if (mb) P.append(mb);
    }
    P.append(
      E('div', {
        cls: 'sub',
        txt: 'Each block is forced with known inputs and its output is compared with the block definition (truth table, set point, delay, curve table, controller action). Open a group to see its blocks; ▶ runs one block, 📍 shows it on the drawing. 👁 on a case = YOUR OWN check: the sheet is set up and you judge on the drawing.'
      }),
      E('div', {
        cls: 'sub w',
        txt: 'NOT covered by this UAT yet (about 1700 of 4000 blocks): AO outputs, valves / actuators (ACT, VLV, IP), alarms (ALM), operator selector circles (COS), SIG.AB flags, tag texts (TXD), field blocks, some constants / comparators; skipped cases show the reason. A pass here means only that the tested blocks follow their definition, not that the whole sheet is right.'
      })
    );
    sp.groups.forEach(g => {
      const cc = counts(sh, g.items),
        d = E('details', { 'data-g': g.g });
      if (keep.includes(g.g) || cc.fail) d.open = keep.includes(g.g);
      d.append(
        E('summary', {}, [
          E('span', { txt: g.g }),
          E('span', {
            cls: 'c ' + (cc.fail ? 'n' : cc.todo ? 'w' : 'y'),
            txt: cc.pass + ' / ' + g.items.length + (cc.fail ? ' · ' + cc.fail + ' ✖' : '')
          })
        ])
      );
      const btnRow = E('div', { cls: 'row', style: 'padding:0 10px' }, [
        E('button', {
          txt: '▶ Test this group',
          on: async () => {
            runItems(sh, g.items);
            build();
          }
        })
      ]);
      d.append(btnRow);
      d.addEventListener('toggle', () => {});
      g.items.forEach(it => d.append(itemEl(sh, g, it)));
      P.append(d);
    });
    const col = R[rkey(sh.name, '_colour')] || {};
    P.append(
      E('div', { cls: 'it', style: 'background:#18212a;border:1px solid #2a3743;border-radius:8px;margin:8px 0' }, [
        E('b', { txt: 'Line colours (visual check, only you can do this)' }),
        E('div', {
          cls: 'sub',
          txt: 'Press RUN. Live signals must be yellow and bright, signals that do not drive anything must be dark amber, and the colours must follow when a switch changes leg.'
        }),
        E('div', { cls: 'row' }, [
          E('button', {
            cls: col.v === 'ok' ? 'on' : '',
            txt: col.v === 'ok' ? '✔ Colours OK' : 'Colours OK',
            on: () => {
              R[rkey(sh.name, '_colour')] = { v: col.v === 'ok' ? '' : 'ok' };
              save();
              build();
            }
          })
        ])
      ])
    );
    const pre = E('pre');
    pre.style.display = 'none';
    P.append(
      E('div', { cls: 'row' }, [
        E('button', {
          txt: 'Copy report (all sheets)',
          on: () => {
            const out = [];
            let nT = 0,
              nP = 0,
              nS = 0;
            for (const nm of names) {
              const s = AN.sheets.find(x => x.name === nm);
              if (!SPEC[nm]) continue;
              for (const g of SPEC[nm].groups)
                for (const it of g.items) {
                  const r = RES[rkey(nm, it.id)];
                  if (!r) continue;
                  nT++;
                  const m = R[rkey(nm, it.id)];
                  if (r.ok || (m && m.v === 'ok')) {
                    if (r.res.every(c => c.skip)) nS++;
                    else nP++;
                    continue;
                  }
                  out.push(
                    nm +
                      ' | ' +
                      g.g +
                      ' | ' +
                      it.n +
                      ' | ' +
                      r.res
                        .filter(c => !c.ok)
                        .map(
                          c =>
                            c.l +
                            ' => ' +
                            c.rows
                              .filter(w => !w.ok)
                              .map(w => w.t + ' expected ' + w.exp + ' got ' + w.act)
                              .join('; ')
                        )
                        .join(' || ')
                  );
                }
            }
            const man = Object.keys(R)
              .filter(x => /\|m\d+$/.test(x))
              .map(x => x + ' = ' + (R[x].v === 'ok' ? 'OK (user)' : 'WRONG (user)'));
            const t =
              'UAT v' +
              VER +
              ': ' +
              nT +
              ' blocks run, ' +
              nP +
              ' pass, ' +
              nS +
              ' NOT TESTED (skipped, reason shown on the block), ' +
              out.length +
              ' fail' +
              (out.length ? '\n' + out.join('\n') : '') +
              (man.length ? '\nYour own checks:\n' + man.join('\n') : '');
            pre.textContent = t;
            pre.style.display = 'block';
            try {
              navigator.clipboard.writeText(t);
            } catch (e) {}
          }
        })
      ]),
      pre
    );
    P.scrollTop = top;
  }
  setInterval(() => {
    try {
      const sh = sheet();
      if (sh && P.style.display === 'block' && P.dataset.sheet !== sh.name) {
        P.dataset.sheet = sh.name;
        build();
      }
    } catch (e) {}
  }, 500);
})();
