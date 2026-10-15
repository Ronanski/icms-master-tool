/* ---------- LN tables ---------- */
function lnParse(t) {
  const o = {};
  t = t.trim();
  if (!t) return o;
  if (t[0] === '{') {
    const j = JSON.parse(t);
    for (const k in j) o[k.toUpperCase()] = j[k].map(p => [+p[0], +p[1]]);
    return o;
  }
  t.split(/\r?\n/).forEach(l => {
    const c = l.split(/[,;\t]/).map(x => x.trim());
    if (c.length < 3) return;
    const x = parseFloat(c[1]),
      y = parseFloat(c[2]);
    if (!c[0] || !isFinite(x) || !isFinite(y)) return;
    (o[c[0].toUpperCase()] = o[c[0].toUpperCase()] || []).push([x, y]);
  });
  for (const k in o) o[k].sort((a, b) => a[0] - b[0]);
  return o;
}
function lnOpen() {
  anln.hidden = false;
  anln.style.display = 'block';
  anln.innerHTML = '';
  const sh = cs(),
    need = new Set();
  AN.sheets.forEach(s => {
    if (s.S)
      s.S.blk.forEach(b => {
        if (b.k === 'FX' && b.p.ln) need.add(b.p.ln);
      });
  });
  const ta = h$('textarea', {
    placeholder: 'CSV: LN001,x,y (one row per point)\nor JSON: {"LN001":[[0,0],[50,40],[100,100]]}'
  });
  anln.append(
    h$('b', { txt: 'F(X) linearization tables (LN)' }),
    h$('button', {
      txt: '✕',
      style: 'float:right',
      onclick: () => {
        anln.style.display = 'none';
        anln.hidden = true;
      }
    }),
    h$('div', {
      style: 'margin:6px 0;color:var(--dim)',
      txt:
        'Built-in tables (from DCS LINEAR CURVE.xls): ' +
        lnTables().length +
        '.   Manual tables loaded (these override the built-in): ' +
        (Object.keys(window.ANLN)
          .sort()
          .map(k => k + ' (' + window.ANLN[k].length + ')')
          .join(', ') || 'none') +
        '.   Used on opened sheets: ' +
        ([...need].sort().join(', ') || '-') +
        '.   Without a table the block passes the value through (y = x).'
    }),
    ta,
    h$('div', { style: 'margin-top:6px;display:flex;gap:6px;flex-wrap:wrap' }, [
      h$('button', {
        txt: 'Add / replace tables',
        onclick: () => {
          try {
            const o = lnParse(ta.value);
            const n = Object.keys(o).length;
            if (!n) {
              msg('No table found in the text.');
              return;
            }
            Object.assign(window.ANLN, o);
            try {
              localStorage.setItem('ditl.ln', JSON.stringify(window.ANLN));
            } catch (e) {}
            msg(n + ' table(s) loaded.');
            lnOpen();
            if (cs() && cs().S) settle();
          } catch (e) {
            msg('Cannot read the tables: ' + e.message);
          }
        }
      }),
      h$('button', {
        txt: 'Clear all',
        onclick: () => {
          window.ANLN = {};
          try {
            localStorage.removeItem('ditl.ln');
          } catch (e) {}
          lnOpen();
          if (cs() && cs().S) settle();
        }
      }),
      h$('button', {
        txt: 'Reset ALL linear edits (' + Object.keys(AN.lne).length + ')',
        title: 'Only the LX / LY edits of the tables. Not the global Reset.',
        onclick: () => {
          AN.lne = {};
          lneSave();
          lnApplyEdits();
          lnOpen();
          if (cs() && cs().S) settle();
        }
      }),
      h$('button', {
        txt: 'Download JSON',
        onclick: () => {
          const a = h$('a', {
            href: URL.createObjectURL(new Blob([JSON.stringify(window.ANLN, null, 1)], { type: 'application/json' })),
            download: 'ln-tables.json'
          });
          a.click();
        }
      })
    ])
  );
}
bLn.onclick = () => {
  if (anln.style.display === 'block') {
    anln.style.display = 'none';
    anln.hidden = true;
  } else lnOpen();
};
function asOpen() {
  anln.hidden = false;
  anln.style.display = 'block';
  anln.innerHTML = '';
  const D = AN_DEF,
    go = n => {
      const i = AN.sheets.findIndex(s => s.name === n);
      if (i >= 0) AN.go(i);
    },
    cell = (t, w) =>
      h$('td', {
        style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334);' + (w || ''),
        txt: String(t == null ? '-' : t)
      });
  const tab = (head, rows) => {
    const t = h$('table', { style: 'border-collapse:collapse;font-size:11px;margin:4px 0 10px' });
    t.append(
      h$(
        'tr',
        {},
        head.map(x => h$('th', { style: 'text-align:left;padding:2px 6px', txt: x }))
      )
    );
    rows.forEach(r =>
      t.append(
        h$(
          'tr',
          {},
          r.map((c, i) =>
            i === 0
              ? h$('td', { style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334)' }, [
                  h$('a', {
                    href: '#',
                    txt: c,
                    style: 'color:inherit',
                    onclick: ev => {
                      ev.preventDefault();
                      go(c);
                    }
                  })
                ])
              : cell(c)
          )
        )
      )
    );
    return t;
  };
  anln.append(
    h$('b', { txt: 'Values that are NOT written on the drawings' }),
    h$('button', {
      txt: '✕',
      style: 'float:right',
      onclick: () => {
        anln.style.display = 'none';
        anln.hidden = true;
      }
    }),
    h$('div', {
      style: 'margin:6px 0;color:var(--dim)',
      txt: 'TP = real plant data (Compensation file). ALM limits, ramp rates and the pulse cycle are ASSUMED for a 150 MW CFB boiler with reheat (set by the engineer assistant, 2026-10-07): replace them with the DCS values in the block panel. Click a sheet name to open it. Full list with the reason for each number: docs/ASSUMED-VALUES.md.'
    }),
    h$('b', { txt: 'TP temperature compensation (Compensation file, real data)' }),
    tab(
      ['Sheet', 'Flow tag', 'Description', 'Temp. tag', 'Range °C', 'Operating °C', 'at', 'bt'],
      D.TP.map(e => [e.sheet, e.ft, e.desc, e.tt, e.tbs + ' ~ ' + e.tfs, e.top, e.at.toFixed(4), e.bt.toFixed(4)])
    ),
    h$('b', { txt: 'RATE ramp boxes without a rate on the drawing (ASSUMED)' }),
    tab(
      ['Sheet', 'Loop', 'Rate', 'Unit', 'Why'],
      D.RATE.map(e => [e.sheet, e.loop, e.rate, e.u, e.basis])
    ),
    h$('b', { txt: 'PO / PIDV pulse output (ASSUMED)' }),
    tab(
      ['Pulse cycle s', 'Full stroke s', 'Shortest pulse s', 'Why'],
      [[D.PO.cyc, D.PO.stroke, D.PO.minp, D.PO.basis]]
    ),
    h$('b', { txt: 'ALM limits (ASSUMED) — ' + D.ALM.length + ' alarms' }),
    tab(
      ['Tag', 'HH', 'H', 'L', 'LL', 'Unit', 'Description', 'Why'],
      D.ALM.map(e => [e.tag, e.hh, e.h, e.l, e.ll, e.u, e.desc, e.basis])
    )
  );
}
function impOpen() {
  anln.hidden = false;
  anln.style.display = 'block';
  anln.innerHTML = '';
  const imps = AN.sheets.filter(s => s.imp),
    cell = (t, w) =>
      h$('td', {
        style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334);' + (w || ''),
        txt: String(t == null ? '-' : t)
      }),
    tab = (head, rows) => {
      const t = h$('table', { style: 'border-collapse:collapse;font-size:11px;margin:4px 0 10px' });
      t.append(
        h$(
          'tr',
          {},
          head.map(x => h$('th', { style: 'text-align:left;padding:2px 6px', txt: x }))
        )
      );
      rows.forEach(r =>
        t.append(
          h$(
            'tr',
            {},
            r.map(c => cell(c))
          )
        )
      );
      return t;
    };
  anln.append(
    h$('b', { txt: 'Imported DXF drawings (Imports)' }),
    h$('button', {
      txt: '✕',
      style: 'float:right',
      onclick: () => {
        anln.style.display = 'none';
        anln.hidden = true;
      }
    }),
    h$('div', {
      style: 'margin:6px 0;color:var(--dim)',
      txt: 'A DXF you import is stored in this browser and used again at every start. Remove it to go back to the built-in drawing. The report compares the imported file with the built-in sheet. Saved values of that sheet are cleared at import (the numbers of the nets can change).'
    })
  );
  if (!imps.length) anln.append(h$('div', { txt: 'No imported drawing. Use "Import ABC DXF".' }));
  for (const s of imps) {
    const r = s.rep;
    anln.append(
      h$('b', {
        txt:
          s.name +
          ' — ' +
          s.impFile +
          ' — ' +
          (s.impTs ? new Date(s.impTs).toLocaleString() : '') +
          (s.kept === false ? ' — NOT STORED' : '')
      }),
      h$('button', {
        txt: 'Back to built-in',
        style: 'margin-left:8px',
        onclick: () => {
          impDrop(s.name).then(() => impOpen());
        }
      })
    );
    if (!r) {
      anln.append(h$('div', { txt: 'New sheet (no built-in drawing with this name): nothing to compare.' }));
      continue;
    }
    if (r.err) {
      anln.append(h$('div', { txt: 'Report failed: ' + r.err }));
      continue;
    }
    anln.append(
      h$('div', {
        style: 'margin:4px 0;font-weight:bold',
        txt: r.same
          ? 'IDENTICAL to the built-in drawing (same blocks, texts, nets).'
          : 'DIFFERENT from the built-in drawing:'
      })
    );
    anln.append(
      tab(
        ['Item', 'Built-in', 'Imported', 'Change'],
        r.rows.map(x => [x.what, x.a, x.b, (x.d > 0 ? '+' : '') + x.d])
      )
    );
    if (r.kinds.length)
      anln.append(
        h$('b', { txt: 'Block kinds that changed' }),
        tab(
          ['Kind', 'Built-in', 'Imported'],
          r.kinds.map(x => [x.k, x.a, x.b])
        )
      );
    const lst = (t, a) => {
      if (a.length)
        anln.append(
          h$('div', {
            style: 'margin:2px 0',
            txt:
              t +
              ' (' +
              a.length +
              '): ' +
              a.slice(0, 40).join('  |  ') +
              (a.length > 40 ? '  … +' + (a.length - 40) : '')
          })
        );
    };
    lst('Blocks only in the built-in (kind@x,y)', r.bgone);
    lst('Blocks only in the imported', r.bnew);
    lst('Texts only in the built-in', r.tgone);
    lst('Texts only in the imported', r.tnew);
  }
}
let dsT = null;
function dsOpen() {
  anln.hidden = false;
  anln.style.display = 'block';
  anln.innerHTML = '';
  const cell = (t, w) =>
      h$('td', {
        style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334);vertical-align:middle;' + (w || ''),
        txt: String(t == null ? '' : t)
      }),
    live = [];
  let nF = 0,
    nT = 0,
    nL = 0;
  const lostAll = [];
  anln.append(
    h$('b', {
      txt: 'Signals from / to the DITL page' + (AN.dsAll ? ' — all sheets' : ' — ' + (cs() ? cs().name : ''))
    }),
    h$('button', {
      txt: '✕',
      style: 'float:right',
      onclick: () => {
        anln.style.display = 'none';
        anln.hidden = true;
        clearInterval(dsT);
      }
    }),
    h$('button', {
      txt: AN.dsAll ? 'This sheet only' : 'All sheets',
      style: 'float:right;margin-right:6px',
      title: 'The list shows the signals of the sheet that is open; this switches to every sheet',
      onclick: () => {
        AN.dsAll = !AN.dsAll;
        dsOpen();
      }
    }),
    h$('div', {
      style: 'margin:6px 0;color:var(--dim)',
      txt: 'The DITL page is not simulated here. A signal that comes FROM the DITL is an input of the ABC set: click it to switch it (works in RUN and in Pause; all linked sheets run together). Anything the ABC logic computes is NOT in this list: it stays controlled by the logic (use FORCE on the wire if you must). TO DITL = the value the ABC logic sends to the DITL (read-only). Click a sheet name to open it.'
    })
  );
  AN._dsSh = cs();
  for (const sh of AN.dsAll ? AN.sheets : [cs()]) {
    if (!sh || /ABC-000/.test(sh.name)) continue;
    let ix, S;
    try {
      S = ensure(sh);
      ix = dsIdx(sh);
    } catch (e) {
      continue;
    }
    if (!ix.from.size && !ix.to.size && !ix.lost.length) {
      anln.append(h$('div', { style: 'margin:6px 0', txt: sh.name + ': no signal from / to the DITL on this sheet.' }));
      continue;
    }
    const t = h$('table', { style: 'border-collapse:collapse;font-size:11px;margin:2px 0 10px;width:100%' });
    t.append(
      h$(
        'tr',
        {},
        ['', 'DITL ref', 'Wire · description', 'Value', 'Control'].map(x =>
          h$('th', { style: 'text-align:left;padding:2px 6px', txt: x })
        )
      )
    );
    const addRow = (dir, n, refs) => {
      const name = nm(S, n),
        ad = adesFind(sh, name),
        ds = ad ? adesText(ad.rec) : '',
        dig = S.nets[n].dig,
        vc = h$('td', { style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334);min-width:46px' });
      const upd = () => {
        const x = S.rt.v[n];
        vc.textContent = dig ? (x > 0.5 ? '1' : '0') : fmt(x);
        vc.style.color = dig && x > 0.5 ? '#6f6' : '';
      };
      upd();
      live.push(upd);
      let ctlEl;
      if (dir === 'FROM' && S.ext.includes(n) && !(S.xlk && S.xlk[n])) {
        if (dig) {
          const b = h$('button', {});
          const u = () => {
            const o = S.rt.ext[n] > 0.5;
            b.textContent = o ? '1 · ON' : '0 · OFF';
            b.classList.toggle('on', o);
          };
          u();
          live.push(u);
          b.onclick = () => {
            setExt(sh, n, S.rt.ext[n] > 0.5 ? 0 : 1);
            u();
            upd();
          };
          b.classList.add('wr');
          ctlEl = b;
        } else {
          const i = h$('input', { type: 'number', step: 'any', style: 'width:72px' });
          i.value = S.rt.ext[n] || 0;
          i.onchange = () => {
            const v = parseFloat(i.value);
            if (isFinite(v)) setExt(sh, n, v);
          };
          i.classList.add('wr');
          ctlEl = i;
        }
      } else
        ctlEl = h$('small', { txt: dir === 'FROM' ? 'comes from another sheet (logic)' : 'output of the ABC logic' });
      const r = h$('tr', {}, [
        cell(dir === 'FROM' ? '◀ FROM' : '→ TO'),
        h$(
          'td',
          { style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334)' },
          refs.map(r =>
            h$('a', {
              href: '#',
              txt: r,
              title: 'Open the DITL page at this sheet',
              style: 'margin-right:6px;color:var(--acc)',
              onclick: ev => {
                ev.preventDefault();
                dsGoRef(r);
              }
            })
          )
        ),
        cell(name + (ds ? ' · ' + ds : '')),
        vc,
        h$('td', { style: 'padding:2px 6px;border-bottom:1px solid var(--line,#334)' }, [ctlEl])
      ]);
      t.append(r);
      dir === 'FROM' ? nF++ : nT++;
    };
    for (const [n, refs] of ix.from) addRow('FROM', n, refs);
    for (const [n, refs] of ix.to) addRow('TO', n, refs);
    for (const l of ix.lost) {
      nL++;
      lostAll.push(sh.name + ': ' + l.t + ' @' + l.x + ',' + l.y);
    }
    anln.append(
      h$('a', {
        href: '#',
        style: 'color:inherit;font-weight:bold',
        txt: sh.name + ' · ' + (sh.title || ''),
        onclick: ev => {
          ev.preventDefault();
          AN.go(AN.sheets.indexOf(sh));
        }
      }),
      t
    );
  }
  anln.insertBefore(
    h$('div', {
      style: 'margin:4px 0',
      txt:
        'FROM DITL inputs: ' +
        nF +
        ' · TO DITL outputs: ' +
        nT +
        ' · texts that could not be tied to a wire: ' +
        nL +
        (nL ? ' (' + lostAll.slice(0, 8).join(' | ') + (lostAll.length > 8 ? ' …' : '') + ')' : '')
    }),
    anln.children[2]
  );
  clearInterval(dsT);
  dsT = setInterval(() => {
    if (anln.style.display !== 'block' || !/Signals from/.test(anln.textContent.slice(0, 40))) {
      clearInterval(dsT);
      return;
    }
    if (!AN.dsAll && AN._dsSh !== cs()) {
      dsOpen();
      return;
    }
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    live.forEach(f => {
      try {
        f();
      } catch (e) {}
    });
  }, 500);
}
bDs.onclick = () => {
  if (anln.style.display === 'block' && anln.firstChild && /Signals from/.test(anln.firstChild.textContent)) {
    anln.style.display = 'none';
    anln.hidden = true;
    clearInterval(dsT);
  } else dsOpen();
};
bIm.onclick = () => {
  if (anln.style.display === 'block' && anln.firstChild && /Imported DXF/.test(anln.firstChild.textContent)) {
    anln.style.display = 'none';
    anln.hidden = true;
  } else impOpen();
};
bAs.onclick = () => {
  if (anln.style.display === 'block' && anln.firstChild && /NOT written/.test(anln.firstChild.textContent)) {
    anln.style.display = 'none';
    anln.hidden = true;
  } else asOpen();
};
/* ---------- Health ---------- */
function health(S, sh) {
  const r = [],
    exp = {
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
  S.blk.forEach(b => {
    const e = exp[b.k];
    if (!e) return;
    const i = b.pins.filter(p => p.role === 'in').length,
      o = b.pins.filter(p => p.role === 'out').length;
    if (
      i <
        e[0] -
          ((b.k === 'AMT' || b.k === 'SW') &&
          S.blk.some(c => c.k === 'COS' && Math.hypot(c.cx - b.cx, c.cy - b.cy) < 14)
            ? 1
            : 0) ||
      (e[1] && !o && !['AO'].includes(b.k) && !(b.k === 'AI' && i >= 1))
    )
      r.push([
        b.k + ' ' + (b.tag || '') + ' @' + Math.round(b.cx) + ',' + Math.round(b.cy),
        'inputs ' + i + ' / outputs ' + o + (i < e[0] ? ' (missing input)' : ' (no output)')
      ]);
  });
  const used = new Set(S.blk.map(b => b.sh));
  const unk = S.shp.filter(
    s =>
      !used.has(s) &&
      s.w > 2.5 &&
      s.h > 2.5 &&
      s.w < 30 &&
      s.h < 30 &&
      !(S.gate || []).some(g => g.box === s) &&
      !S.blk.some(
        b =>
          b.sh !== s &&
          (s.x0 + s.x1) / 2 >= b.x0 - 0.3 &&
          (s.x0 + s.x1) / 2 <= b.x1 + 0.3 &&
          (s.y0 + s.y1) / 2 >= b.y0 - 0.3 &&
          (s.y0 + s.y1) / 2 <= b.y1 + 0.3
      )
  );
  return { issues: r, unk: unk.length, ext: S.ext.length };
}
bHp.onclick = () => {
  if (anhp.style.display === 'block') {
    anhp.style.display = 'none';
    anhp.hidden = true;
    return;
  }
  anhp.hidden = false;
  anhp.style.display = 'block';
  anhp.innerHTML =
    '<b>Analog health</b> <button id="anhx" style="float:right">✕</button><div id="anhb">Checking sheets…</div>';
  $('anhx').onclick = () => {
    anhp.style.display = 'none';
    anhp.hidden = true;
  };
  const out = [],
    list = AN.sheets.slice();
  let k = 0;
  const step = () => {
    const t0 = performance.now();
    while (k < list.length && performance.now() - t0 < 60) {
      const sh = list[k++];
      try {
        const S = ensure(sh),
          h = health(S, sh);
        out.push({ sh, h, n: S.blk.length });
      } catch (e) {
        out.push({ sh, err: e.message });
      }
    }
    const b = $('anhb');
    if (!b) return;
    if (k < list.length) {
      b.textContent = 'Checking sheets… ' + k + '/' + list.length;
      setTimeout(step, 0);
      return;
    }
    const tb = h$('table', {}, [
      h$(
        'tr',
        {},
        ['Sheet', 'Blocks', 'External inputs', 'Unknown shapes', 'Pin issues', 'LINEAR / RATE review'].map(t =>
          h$('th', { txt: t })
        )
      )
    ]);
    out.forEach(o => {
      const tr = h$('tr', {});
      if (o.err) {
        tr.append(h$('td', { txt: o.sh.name }), h$('td', { cls: 'bad', txt: 'ERROR ' + o.err, colspan: 4 }));
      } else {
        tr.append(
          h$('td', { txt: o.sh.name }),
          h$('td', { txt: o.n }),
          h$('td', { txt: o.h.ext }),
          h$('td', { cls: o.h.unk ? 'bad' : '', txt: o.h.unk }),
          h$('td', { cls: o.h.issues.length ? 'bad' : '', txt: o.h.issues.length }),
          (() => {
            const n = o.sh.S.blk.filter(
              q =>
                (q.k === 'FX' &&
                  ((!(q.p.tbl && (q.p.tbl.p2 || q.p.tbl.pts)) && !(window.ANLN && window.ANLN[q.p.ln])) ||
                    q.p.lnWarn)) ||
                ((q.k === 'RATE' || q.k === 'RAMPB') && q.main !== undefined && q.up === undefined && !(q.p.rate > 0))
            ).length;
            return h$('td', {
              cls: n ? 'bad' : '',
              title: 'FX blocks without a table or with a table chosen by a warning = NEEDS REVIEW',
              txt: n
            });
          })()
        );
      }
      tr.style.cursor = 'pointer';
      tr.onclick = () => {
        go(AN.sheets.indexOf(o.sh));
        if (o.h && o.h.issues.length)
          msg(
            o.h.issues
              .slice(0, 6)
              .map(q => q[0] + ': ' + q[1])
              .join('\n')
          );
      };
      tb.append(tr);
    });
    b.innerHTML = '';
    b.append(
      h$('div', {
        style: 'margin:4px 0;color:var(--dim)',
        txt: 'Click a row to open the sheet. Unknown shapes and pin issues are spots where the drawing was not fully recognised (the simulation passes the signal through).'
      }),
      tb
    );
  };
  setTimeout(step, 10);
};
/* ---------- import ABC dxf ---------- */
fImp.onchange = async e => {
  const fs = [...e.target.files];
  e.target.value = '';
  let ok = 0,
    nokeep = 0;
  await loadData();
  for (const f of fs) {
    try {
      const txt = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsText(f, 'latin1');
      });
      const R = anRead(txt),
        name = f.name.replace(/^\(\d+\)/, '').replace(/\.dxf$/i, '');
      const o = impApply(name, txt, f.name, Date.now(), true);
      const kept = await impSave(name, txt, f.name);
      o.kept = kept;
      ok++;
      if (!kept) nokeep++;
      AN.lkey = null;
      if (fs.length === 1) AN.i = AN.sheets.indexOf(o);
    } catch (x) {
      msg('Cannot read ' + f.name + ': ' + x.message);
    }
  }
  if (ok) {
    AN.tagIdx = null;
    AN.sheets.forEach(s => {
      delete s.lk;
      if (s.S) s.S.xlk = null;
    });
    msg(
      ok +
        ' analog sheet(s) imported' +
        (nokeep
          ? ' (' + nokeep + ' could NOT be stored: gone after reload)'
          : ' and kept in this browser; press Imports for the drawing-change report') +
        '.'
    );
    AN.key = null;
    render();
    impOpen();
  }
};
