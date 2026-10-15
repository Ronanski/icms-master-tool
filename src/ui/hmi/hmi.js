/* Operator faceplate (mini HMI): second tab of the right pane. UI only: it reads the simulator (AN) and writes the same operator values the existing pane writes
   (input values, forced signals, the position of the A/M switch); the simulation engine is not changed. */
(function () {
  const $ = id => document.getElementById(id);
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
  const fmt = x =>
    x == null || !isFinite(x)
      ? '—'
      : Math.abs(x) >= 1000
        ? x.toFixed(0)
        : Math.abs(x) >= 100
          ? x.toFixed(1)
          : Math.abs(x) >= 10
            ? x.toFixed(2)
            : x.toFixed(3);
  const sheet = () => AN.sheets && AN.sheets[AN.i];
  let opp = null,
    body = null,
    built = '',
    live = [],
    trends = {},
    filter = '',
    lastT = -1;
  const setIn = (S, n, v) => {
    S.rt.ext[n] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  const setMV = (S, c, v) => {
    if (c.manBlk && S.rt.st[c.manBlk.id]) S.rt.st[c.manBlk.id].val = v;
    else S.rt.ext[c.manNet] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  function tagOf(S, id) {
    for (const a of S.addr || []) if (a.ai === id && a.t) return a.t;
    return '';
  }
  function describe(sh, t) {
    try {
      const a = AN.adesFind && AN.adesFind(sh, t);
      if (a && a.rec) {
        const r = a.rec;
        return r.k === 'io' ? [r.tag, r.d].filter(Boolean).join(' · ') : [r.d, r.r].filter(Boolean).join(' · ');
      }
    } catch (e) {}
    return '';
  }
  function ctrls(S) {
    const out = [];
    for (const b of S.blk) {
      if (b.k !== 'PID' && b.k !== 'PIDV') continue;
      const tag = (b.txt || [])[1];
      if (!tag || /^X+-/.test(tag)) continue;
      let q = null;
      try {
        q = AN.anPins(S, b);
      } catch (e) {}
      if (!q || q.pv == null || q.pv < 0) continue;
      /* the A/M station of this controller is found by the engine (anStationOf): the same rule for the panel and for the force-manual logic */
      const stn = AN.anStationOf(S, b),
        amt = stn.amt,
        autoLeg = stn.autoLeg,
        manNet = stn.manNet,
        manBlk = stn.manBlk;
      /* the SV is the output of a T switch whose B leg is a COS (the operator's SV, drawing ABC-007 etc.): the faceplate SV field sets that COS and picks leg B (LOCAL); REM goes back to the SV of the logic */
      const svSw = AN.anSvSwitchOf(S, b),
        remote = !!svSw && AN.anHasRemote(S, b); /* REMOTE / LOCAL only where the drawing has a REMOTE mode */
      /* the switching signals of the drawing for this loop: the select signals of the A/M station (1:A / 1:B) and the mode inputs TAG.MAN / .LOC / .REM; the panel shows them live and the mode inputs are buttons that write the SAME signals as the diagram */
      const manLeg = autoLeg === 'A' ? 'B' : 'A',
        lb = n => (S.lab[n] && S.lab[n].t) || 'n' + n,
        sigs = [];
      if (amt) {
        const L =
          amt.cs && amt.cs.length > 1
            ? amt.cs.map(z => ({ n: z.n, leg: z.A ? 'A' : 'B' }))
            : amt.sel >= 0
              ? [{ n: amt.sel, leg: amt.p && amt.p.selA ? 'A' : 'B' }]
              : [];
        for (const z of L) {
          const dr = (S.drv[z.n] || []).find(d => d.k !== 'LINK');
          sigs.push({
            n: z.n,
            name: lb(z.n),
            role: z.leg === manLeg ? 'MAN' : 'AUTO',
            src: dr && dr.i ? dr.i.map(m => ({ n: m, name: lb(m) })) : []
          });
        }
      }
      const modes = [],
        mre = new RegExp(
          '^' + tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.(MAN|LOC|REM|AUTO|AUT|LOCAL|REMOTE|MANUAL)$',
          'i'
        );
      for (let n = 0; n < S.nets.length; n++) {
        const tx = S.lab[n] && S.lab[n].t;
        if (tx && mre.test(tx.trim()) && S.ext.includes(n) && !modes.some(z => z.n === n))
          modes.push({ n, name: tx.trim(), kind: tx.trim().split('.').pop().toUpperCase() });
      }
      /* selectors after the controller output (interlock / back-up legs): when one is on its B leg the valve command is NOT the MV of the faceplate */ const dn =
        [];
      {
        let cur = amt ? amt.o[0] : b.o[0];
        for (let k = 0; k < 6; k++) {
          const g = S.blk.find(
            x =>
              (x.k === 'AMT' || x.k === 'SW') &&
              (!amt || x.id !== amt.id) &&
              x.a === cur &&
              x.b !== cur &&
              !dn.some(d => d.id === x.id)
          );
          if (!g) break;
          dn.push({ id: g.id, sel: g.cs && g.cs[0] ? g.cs[0].n : g.sel });
          cur = g.o[0];
        }
      }
      out.push({
        b,
        tag,
        q,
        amt,
        autoLeg,
        manNet,
        manBlk,
        svSw,
        remote,
        sigs,
        modes,
        dn,
        out: amt ? amt.o[0] : b.o[0],
        desc: (b.face && b.face.desc) || ''
      });
    }
    /* pamagat: ang paglalarawan ng DCS (xlsx) ang ginagamit; kung pareho ito sa dalawang controller ng sheet (hal. "PAF/SAF AIR FLOW CONTROL"), ang nakasulat sa drawing sa tabi ng PID ang gagamitin ("PRIMARY AIR FLOW CONTROL") */
    {
      const cnt = {};
      out.forEach(o => {
        cnt[o.desc] = (cnt[o.desc] || 0) + 1;
      });
      for (const o of out) {
        if (o.desc && cnt[o.desc] < 2) continue;
        const b = o.b;
        const t = (S.tx || [])
          .filter(
            x =>
              x.x >= b.x1 - 2 &&
              x.x <= b.x1 + 25 &&
              x.y >= b.y0 - 6 &&
              x.y <= b.y1 + 6 &&
              !/~/.test(x.t) &&
              x.t.trim().length > 2
          )
          .sort((a, c) => c.y - a.y)
          .map(x => x.t.trim())
          .join(' ');
        if (t) o.desc = t;
      }
    }
    return out;
  }
  AN.hmiCtrls = ctrls; /* for the tests */
  function trendOf(key) {
    return trends[key] || (trends[key] = { t: [], pv: [], sv: [], mv: [] });
  }
  function drawTrend(svg, tr, rlo, rhi) {
    const W = 360,
      H = 96;
    let s = '';
    const n = tr.t.length;
    if (n < 2) {
      svg.innerHTML = '<text x="10" y="50" fill="#7d8e9a" font-size="12">Walang data pa: i-RUN ang simulation.</text>';
      return;
    }
    const t0 = tr.t[0],
      t1 = tr.t[n - 1],
      dt = Math.max(1, t1 - t0);
    const all = tr.pv.concat(tr.sv).filter(isFinite);
    let lo = isFinite(rlo) ? rlo : Math.min(...all),
      hi = isFinite(rhi) ? rhi : Math.max(...all);
    if (hi - lo < 1e-9) {
      hi = lo + 1;
    }
    const X = t => 4 + ((t - t0) / dt) * (W - 8),
      Yp = v => H - 6 - ((v - lo) / (hi - lo)) * (H - 12),
      Ym = v => H - 6 - (Math.max(0, Math.min(100, v)) / 100) * (H - 12);
    for (let g = 1; g < 4; g++)
      s += `<line x1="0" x2="${W}" y1="${(g * H) / 4}" y2="${(g * H) / 4}" stroke="#1e2c36"/>`;
    const pl = (arr, Y, c, w, d) =>
      `<polyline fill="none" stroke="${c}" stroke-width="${w}" ${d ? 'stroke-dasharray="4 3"' : ''} points="${tr.t.map((t, i) => X(t).toFixed(1) + ',' + Y(arr[i]).toFixed(1)).join(' ')}"/>`;
    s +=
      pl(tr.mv, Ym, '#6fe3a0', 1.4, true) + pl(tr.sv, Yp, '#5cc8ff', 1.4, false) + pl(tr.pv, Yp, '#ffd84a', 2, false);
    s += `<text x="4" y="10" fill="#7d8e9a" font-size="9">${fmt(hi)}</text><text x="4" y="${H - 2}" fill="#7d8e9a" font-size="9">${fmt(lo)}</text><text x="${W - 4}" y="${H - 2}" text-anchor="end" fill="#7d8e9a" font-size="9">${Math.round(dt)} s</text>`;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = s;
  }
  function build() {
    const sh = sheet();
    if (!sh || !sh.S) return;
    const S = sh.S;
    built = sh.name;
    live = [];
    body.innerHTML = '';
    body.append(
      E('div', { cls: 'hdr', txt: sh.name }),
      E('div', { cls: 'sub', txt: (sh.title || '').replace(/\s+/g, ' ') })
    );
    // 1. controllers
    const cs = ctrls(S);
    if (cs.length) body.append(E('h4', { txt: 'Mga controller (faceplate)' }));
    cs.forEach(c => {
      const P = c.b.p,
        rlo = P.rlo != null ? P.rlo : 0,
        rhi = P.rhi != null ? P.rhi : 100,
        unit = P.unit || '';
      const key = sh.name + '|' + c.b.id;
      const pv = E('b', { txt: '—' }),
        sv = E('b', { txt: '—' }),
        mv = E('b', { txt: '—' });
      const barBand = E('i', { cls: 'gband' }),
        barPv = E('i', { cls: 'gpv' }),
        barSvm = E('i', { cls: 'gsv' }),
        barMv = E('i', { cls: 'mvp' });
      const bAuto = E('button', {
          cls: 'b ra',
          txt: 'A',
          title: 'A = AUTO (SV ng operator / LOCAL kung may REMOTE sa loop)'
        }),
        bMan = E('button', { cls: 'b ra man', txt: 'M', title: 'M = MANUAL (ang operator ang nagtatakda ng MV)' });
      const svIn = E('input', { cls: 'n', type: 'number', step: 'any' }),
        mvIn = E('input', { cls: 'n', type: 'number', step: 'any' });
      const svOk = S.ext.includes(c.q.sv) || !!c.svSw,
        svSet = v => {
          if (S.ext.includes(c.q.sv)) {
            setIn(S, c.q.sv, v);
          } else if (c.svSw) {
            S.rt.ext[c.svSw.b] = v;
            if (!c.remote) {
              const q = S.rt.st[c.svSw.id];
              if (q) {
                q.al = 'A';
                q.fm = 'B';
              }
            }
            /* no REMOTE on this loop: typing the SV picks the SV of the operator (COS) */ try {
              AN.settle();
            } catch (e) {}
          }
        },
        mvOk = c.manNet != null && (S.ext.includes(c.manNet) || !!c.manBlk);
      const svRow = E('div', { cls: 'row' }, [
        E('span', { txt: 'SV' }),
        E('button', {
          cls: 'b',
          txt: '−',
          on: () => {
            const v = (+svIn.value || 0) - (rhi - rlo) / 100;
            svIn.value = v.toFixed(3);
            svSet(v);
          }
        }),
        E('button', {
          cls: 'b',
          txt: '+',
          on: () => {
            const v = (+svIn.value || 0) + (rhi - rlo) / 100;
            svIn.value = v.toFixed(3);
            svSet(v);
          }
        }),
        E('span', { cls: 'sub', txt: unit })
      ]);
      const svSrc = E('span', { cls: 'sub', style: 'margin-left:6px' }),
        swMode = m => {
          const q = S.rt.st[c.svSw.id];
          if (!q) return;
          q.al = 'A';
          q.fm = m;
          try {
            AN.settle();
          } catch (e) {}
        },
        bRem = E('button', {
          cls: 'b' + (c.remote ? ' ra' : ''),
          txt: c.remote ? 'R' : 'SV: LOGIC',
          title: c.remote
            ? 'REMOTE: AUTO talaga; SV galing sa logic path; hindi mamamanual, pati SV'
            : 'SV galing sa logic path',
          on: () => {
            swMode('A');
            if (c.remote) {
              const m = c.modes.find(z => ['REM', 'REMOTE'].includes(z.kind));
              if (m) {
                setIn(S, m.n, 1);
                setTimeout(() => setIn(S, m.n, 0), 700);
              }
            }
          }
        }),
        bLoc = E('button', {
          cls: 'b',
          style: c.remote ? 'display:none' : '',
          txt: c.remote ? 'LOCAL' : 'SV: OPERATOR',
          title: c.remote ? 'LOCAL: puwede nang i-MAN at i-set ang SV (COS ng operator)' : 'SV ng operator (COS)',
          on: () => swMode('B')
        }),
        modeRow = c.svSw && !c.remote ? E('div', { cls: 'row' }, [E('span', { txt: 'SV' }), bRem, bLoc]) : null;
      const sgEls = c.sigs.map(z => {
          const e = E('span', {
            cls: 'sg',
            title:
              'Signal ng drawing: ' +
              z.name +
              (z.role === 'MAN' ? ' (pumipili ng MANUAL / force manual)' : ' (pumipili ng AUTO)')
          });
          return { z, e };
        }),
        mdEls = c.modes.map(z => {
          const e = E('button', {
            cls: 'b',
            txt: '.' + z.kind,
            title: z.name + ' = input ng drawing (HMI); parehong signal sa diagram',
            on: () => {
              const v = S.rt.ext[z.n] > 0.5 ? 0 : 1;
              setIn(S, z.n, v);
            }
          });
          return { z, e };
        }),
        sgRow = E(
          'div',
          { cls: 'row', style: 'flex-wrap:wrap;gap:4px' },
          sgEls.map(x => x.e).concat(mdEls.map(x => x.e))
        );
      const mvB = [0, 50, 100].map(x =>
          E('button', {
            cls: 'b',
            txt: String(x),
            on: () => {
              mvIn.value = x;
              setMV(S, c, x);
            }
          })
        ),
        mvRow = E('div', { cls: 'row' }, [E('span', { txt: 'MV (MAN)' })].concat(mvB)),
        fmEl = E('span', { cls: 'sub', style: 'color:#ff7a7a;font-weight:700' }),
        cutEl = E('div', { cls: 'sub', style: 'color:#ffb454;font-weight:700;margin:2px 0' }),
        cutTx = E('span'),
        cutWhy = E('button', {
          cls: 'b',
          txt: 'Sanhi?',
          title: 'Hanapin ang mga input ng drawing na, kapag binago, magpapawala sa interlock',
          style: 'margin-left:6px',
          on: () => whyCut()
        }),
        cutList = E('div', { style: 'margin-top:3px' });
      cutEl.append(cutTx, cutWhy, cutList);
      svRow.append(svSrc);
      if (svOk) {
        svIn.onchange = () => svSet(+svIn.value);
      } else {
        svIn.disabled = true;
        svRow.append(E('span', { cls: 'sub', txt: '(SV galing sa logic)' }));
      }
      if (mvOk) {
        mvIn.onchange = () => setMV(S, c, +mvIn.value);
      } else {
        mvIn.disabled = true;
        mvRow.append(E('span', { cls: 'sub', txt: '(walang manual input)' }));
      }
      const setMode = m => {
        if (!c.amt) return;
        const st = S.rt.st[c.amt.id];
        if (!st) return;
        const manLeg = c.autoLeg === 'A' ? 'B' : 'A';
        st.al = c.autoLeg;
        st.fm = m === 'A' ? c.autoLeg : manLeg;
        try {
          AN.settle();
        } catch (e) {}
      };
      /* sa planta, ang R / A / M ay HMI command: pulse ng input ng drawing (.REM / .LOC / .MAN); ang mga ito ang gumagamit ng 1:BYPASS at ng SET rule (hal. M.018D) */
      const pulse = kinds => {
        const m = c.modes.find(z => kinds.includes(z.kind));
        if (!m) return;
        setIn(S, m.n, 1);
        setTimeout(() => setIn(S, m.n, 0), 700);
      };
      bAuto.onclick = () => {
        if (c.remote && c.svSw) {
          const q = S.rt.st[c.svSw.id];
          if (q && q.pk === 'A') swMode('B');
        }
        setMode('A');
        pulse(['LOC', 'LOCAL', 'AUTO', 'AUT']);
      };
      bMan.onclick = () => {
        setMode('M');
        pulse(['MAN', 'MANUAL']);
      };
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'tr');
      const pvBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'PV' }), E('span', { txt: unit })]),
          E('div', { cls: 'fv pv' }, [pv])
        ]),
        svBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'SV' }), E('span', { txt: unit }), svSrc]),
          svIn
        ]),
        mvBox = E('div', { cls: 'fpb' }, [
          E('div', { cls: 'fl' }, [E('span', { txt: 'MV' }), E('span', { txt: '%' })]),
          mvIn
        ]);
      svIn.classList.add('fv');
      mvIn.classList.add('fv');
      svSrc.style.cssText = 'margin-left:6px;font-size:10px;color:#8fa0ab';
      {
        const fc = c.b.face,
          fx = x => Math.max(0, Math.min(100, ((x - rlo) / (rhi - rlo)) * 100));
        if (fc && fc.PH > fc.PL && isFinite(fc.PL) && isFinite(fc.PH)) {
          barBand.style.cssText = 'bottom:' + fx(fc.PL) + '%;height:' + Math.max(1, fx(fc.PH) - fx(fc.PL)) + '%';
        } else barBand.style.display = 'none';
      }
      const graph = E('div', { cls: 'fpg' }, [
        E('span', { cls: 'hi', txt: fmt(rhi) }),
        E('span', { cls: 'lo', txt: fmt(rlo) }),
        E('div', { cls: 'gm', title: 'PL ~ PH: normal na saklaw ng PV (ayon sa data ng DCS)' }, [barBand]),
        E('div', { cls: 'gb' }, [barPv]),
        E('div', { cls: 'gb' }, [barSvm])
      ]);
      const raCol = E('div', { cls: 'fpr' }, (c.remote ? [bRem] : []).concat([bAuto, bMan])),
        mvBr = E('div', { cls: 'mvb' }, [barMv]);
      const card = E('div', { cls: 'fp fpx' }, [
        E('div', { cls: 'fpt', txt: c.desc || c.tag }),
        E('div', { cls: 'fpm' }, [
          graph,
          E('div', { cls: 'fpc' }, [pvBox, svBox, E('div', { cls: 'fps' }, [raCol, mvBr]), mvBox])
        ]),
        fmEl,
        cutEl,
        E('div', { cls: 'tg' }, [
          E('b', { txt: c.tag }),
          E('span', {
            txt:
              (unit ? '[' + fmt(rlo) + ' ~ ' + fmt(rhi) + ' ' + unit + ']' : '') +
              (c.amt ? '' : '  (walang A/M switch)')
          })
        ]),
        E(
          'details',
          { cls: 'fpe' },
          [E('summary', { txt: 'Engineering: signal ng drawing, SV / MV buttons, trend' }), sgRow]
            .concat(modeRow ? [modeRow] : [])
            .concat([
              svRow,
              mvRow,
              svg,
              E('div', { cls: 'lg' }, [
                E('span', {}, [E('i', { style: 'background:#ffd84a' }), document.createTextNode('PV')]),
                E('span', {}, [E('i', { style: 'background:#5cc8ff' }), document.createTextNode('SV')]),
                E('span', {}, [E('i', { style: 'background:#6fe3a0' }), document.createTextNode('MV')])
              ])
            ])
        )
      ]);
      /* click sa kahon ng SV / MV (ayon sa DCS ng planta): lumalabas ang control na pang-taas / pang-baba; clickable lang kapag enabled sa tamang scenario */
      card.style.position = 'relative';
      const popEl = E('div', { cls: 'fpop' });
      card.append(popEl);
      let popK = null,
        popVal = null;
      const popIn = k => (k === 'SV' ? svIn : mvIn),
        popLo = k => (k === 'SV' ? rlo : 0),
        popHi = k => (k === 'SV' ? rhi : 100),
        popStep = k => (popHi(k) - popLo(k)) / 100;
      const popSet = (k, v) => {
        v = Math.max(popLo(k), Math.min(popHi(k), v));
        popIn(k).value = +v.toFixed(3);
        if (k === 'SV') svSet(v);
        else setMV(S, c, v);
        popRefresh();
      };
      const popRefresh = () => {
        if (!popK) return;
        const inp = popIn(popK);
        if (inp.disabled) {
          closePop();
          return;
        }
        if (popVal && document.activeElement !== popVal) popVal.value = inp.value;
      };
      const closePop = () => {
        popEl.style.display = 'none';
        popK = null;
      };
      const openPop = (k, box) => {
        if (popIn(k).disabled) return;
        popK = k;
        popEl.innerHTML = '';
        const st = popStep(k),
          n = x => +x;
        popVal = E('input', { cls: 'n', type: 'number', step: 'any' });
        popVal.value = popIn(k).value;
        popVal.onchange = () => popSet(k, n(popVal.value));
        const B = (t, d, title) => E('button', { cls: 'b', txt: t, title, on: () => popSet(k, n(popIn(k).value) + d) });
        popEl.append(
          E('div', { cls: 'row', style: 'justify-content:space-between' }, [
            E('b', { txt: k + '  ' + c.tag }),
            E('button', { cls: 'b', txt: '✕', on: closePop })
          ]),
          E('div', { cls: 'row' }, [popVal, E('span', { cls: 'sub', txt: k === 'SV' ? unit : '%' })]),
          E('div', { cls: 'row' }, [
            B('▲▲', st * 10, '+10 %'),
            B('▲', st, '+1 %'),
            B('▼', -st, '-1 %'),
            B('▼▼', -st * 10, '-10 %')
          ])
        );
        if (k === 'MV')
          popEl.append(
            E(
              'div',
              { cls: 'row' },
              [0, 50, 100].map(x => E('button', { cls: 'b', txt: String(x), on: () => popSet('MV', x) }))
            )
          );
        popEl.style.display = 'block';
        popEl.style.top = box.offsetTop + box.offsetHeight + 4 + 'px';
      };
      svBox.addEventListener('click', e => {
        if (e.target.closest('.fpop')) return;
        openPop('SV', svBox);
      });
      mvBox.addEventListener('click', e => {
        if (e.target.closest('.fpop')) return;
        openPop('MV', mvBox);
      });
      live.push(popRefresh);
      const whyCut = () => {
        const cg = (c.dn || []).find(d => {
          const t = S.rt.st[d.id];
          return t && t.pk === 'B';
        });
        cutList.textContent = '';
        if (!cg) return;
        const seen = new Set(),
          cand = [],
          q = [cg.sel];
        while (q.length && seen.size < 400) {
          const n = q.shift();
          if (seen.has(n)) continue;
          seen.add(n);
          if (S.ext.includes(n)) {
            if (S.nets[n].dig && S.rt.force[n] === undefined && !(S.xlk && S.xlk[n])) cand.push(n);
            continue;
          }
          for (const g of S.drv[n] || []) for (const i of g.i || []) if (i >= 0) q.push(i);
        }
        const was = S.rt.v[cg.sel],
          hits = [];
        for (const n of cand.slice(0, 40)) {
          const o = S.rt.ext[n] || 0;
          S.rt.ext[n] = o > 0.5 ? 0 : 1;
          try {
            AN.settle();
          } catch (e) {}
          if ((S.rt.v[cg.sel] > 0.5 ? 1 : 0) !== (was > 0.5 ? 1 : 0))
            hits.push({ n, to: S.rt.ext[n], name: (S.lab[n] && S.lab[n].t) || 'n' + n + ' (walang label)' });
          S.rt.ext[n] = o;
        }
        try {
          AN.settle();
        } catch (e) {}
        cutList.append(
          E('span', {
            cls: 'sub',
            txt: hits.length
              ? 'Ang isang input na ito, kapag binago, ay magpapawala ng interlock (pindutin para itakda):'
              : 'Walang iisang input sa sheet na ito ang makakapagpawala (kailangan ng higit sa isa, o galing sa ibang sheet / sa measurement).'
          })
        );
        for (const h of hits)
          cutList.append(
            E('button', { cls: 'b', txt: h.name + ' → ' + h.to, style: 'margin:2px', on: () => setIn(S, h.n, h.to) })
          );
      };
      body.append(card);
      live.push(() => {
        const v = S.rt.v,
          pvv = v[c.q.pv],
          svv = v[c.q.sv],
          mvv = v[c.out];
        pv.textContent = fmt(pvv);
        sv.textContent = fmt(svv);
        mv.textContent = fmt(mvv);
        const f = x => Math.max(0, Math.min(100, ((x - rlo) / (rhi - rlo)) * 100));
        barPv.style.height = f(pvv) + '%';
        barSvm.style.height = f(svv) + '%';
        barMv.style.bottom = Math.max(0, Math.min(100, mvv)) + '%';
        const pk = c.amt && S.rt.st[c.amt.id] ? S.rt.st[c.amt.id].pk : c.autoLeg;
        const isAuto = !c.amt || pk === c.autoLeg;
        const remNow = !!(c.remote && c.svSw && S.rt.st[c.svSw.id] && S.rt.st[c.svSw.id].pk === 'A');
        bAuto.classList.toggle('on', isAuto && !remNow);
        bMan.classList.toggle('on', !isAuto);
        sgEls.forEach(x => {
          const on = S.rt.v[x.z.n] > 0.5;
          x.e.textContent = x.z.name + ' → ' + x.z.role + ' ' + (on ? '1' : '0');
          x.e.title =
            'Signal ng drawing: ' +
            x.z.name +
            (x.z.role === 'MAN' ? ' (pumipili ng MANUAL / force manual)' : ' (pumipili ng AUTO)') +
            (x.z.src.length ? ' ← ' + x.z.src.map(q => q.name + '=' + (S.rt.v[q.n] > 0.5 ? 1 : 0)).join(', ') : '');
          x.e.style.cssText =
            'padding:1px 6px;border-radius:9px;font-size:11px;border:1px solid ' +
            (on ? (x.z.role === 'MAN' ? '#ff7a7a' : '#6fe3a0') : '#2c3d49') +
            ';color:' +
            (on ? '#fff' : '#7d8e9a') +
            (on ? ';background:' + (x.z.role === 'MAN' ? '#5a2323' : '#1d4a31') : '');
        });
        mdEls.forEach(x => {
          const on = S.rt.ext[x.z.n] > 0.5 || S.rt.v[x.z.n] > 0.5;
          x.e.classList.toggle('on', on);
        });
        const q_ = c.svSw && S.rt.st[c.svSw.id],
          pkA = !!(q_ && q_.pk === 'A'),
          rem = c.remote && pkA;
        /* REMOTE (only where the drawing has it): AUTO talaga, hindi mamamanual, pati SV (user rule 2026-10-15) */ if (
          c.svSw
        ) {
          svSrc.textContent = c.remote
            ? pkA
              ? 'REMOTE: AUTO, SV galing sa logic path'
              : 'LOCAL: SV ng operator (COS)'
            : pkA
              ? 'SV: galing sa logic path'
              : 'SV: ng operator (COS)';
          bRem.classList.toggle('on', pkA);
          bLoc.classList.toggle('on', !pkA);
          bRem.disabled = !!(q_ && q_.fman) || pkA;
          bLoc.disabled = !pkA;
          bMan.disabled = rem;
          svIn.disabled = rem && svOk && !S.ext.includes(c.q.sv);
          svRow.querySelectorAll('button').forEach(x => {
            x.disabled = rem;
          });
        } else svSrc.textContent = '';
        /* SV ay para sa AUTO (A) lang: naka-disable sa MANUAL at sa REMOTE (user 2026-10-15) */ if (svOk) {
          const lock = (!!c.amt && !isAuto) || (rem && !S.ext.includes(c.q.sv));
          svIn.disabled = lock;
          svRow.querySelectorAll('button').forEach(x => {
            x.disabled = lock;
          });
        }
        const fsg = c.sigs.find(z => z.role === 'MAN' && S.rt.v[z.n] > 0.5),
          fm_ = !!fsg || !!(c.amt && S.rt.st[c.amt.id] && S.rt.st[c.amt.id].fman);
        {
          const cg = (c.dn || []).find(d => {
            const t = S.rt.st[d.id];
            return t && t.pk === 'B';
          });
          cutTx.textContent = cg
            ? 'OUTPUT PUTOL ng interlock: ' +
              ((S.lab[cg.sel] && S.lab[cg.sel].t) || 'n' + cg.sel) +
              ' = 1 → valve command = back-up leg ng drawing (hindi ang MV sa itaas)'
            : '';
          cutWhy.style.display = cg ? '' : 'none';
          if (!cg) cutList.textContent = '';
        }
        fmEl.textContent = fm_ ? 'FORCE MANUAL (' + (fsg ? fsg.name + ' = 1' : 'logic') + '): hindi puwedeng AUTO' : '';
        bAuto.disabled = !!fm_;
        /* MV is only for MANUAL: in AUTO the operator changes the SV, not the MV */ if (mvOk) {
          mvIn.disabled = (isAuto || rem) && !!c.amt;
          mvB.forEach(x => (x.disabled = (isAuto || rem) && !!c.amt));
        }
        if (document.activeElement !== svIn && isFinite(svv)) svIn.value = +svv.toFixed(3);
        if (document.activeElement !== mvIn && isFinite(mvv)) mvIn.value = +mvv.toFixed(2);
        const tr = trendOf(key);
        if (S.rt.t !== tr.last) {
          tr.last = S.rt.t;
          tr.t.push(S.rt.t);
          tr.pv.push(pvv);
          tr.sv.push(svv);
          tr.mv.push(mvv);
          if (tr.t.length > 600) {
            for (const k of ['t', 'pv', 'sv', 'mv']) tr[k].shift();
          }
        }
        drawTrend(svg, tr, rlo, rhi);
      });
    });
    // 2. manual stations
    const mans = S.blk.filter(b => b.k === 'MAN' && b.o[0] != null && (b.txt || [])[0]);
    if (mans.length) body.append(E('h4', { txt: 'Manual station' }));
    mans.forEach(b => {
      const P = b.p,
        lo = P.lo != null ? P.lo : 0,
        hi = P.hi != null ? P.hi : 100,
        tag = (b.txt || [])[0];
      const val = E('b', { txt: '—' }),
        inp = E('input', { cls: 'n', type: 'number', step: 'any' });
      const set = v => {
        const st = S.rt.st[b.id];
        if (st) {
          st.val = Math.max(lo, Math.min(hi, v));
        }
        try {
          AN.settle();
        } catch (e) {}
      };
      inp.onchange = () => set(+inp.value);
      body.append(
        E('div', { cls: 'fp' }, [
          E('div', { cls: 'tg' }, [
            E('b', { txt: tag }),
            E('span', { txt: fmt(lo) + ' ~ ' + fmt(hi) + (P.u ? ' ' + P.u : '') })
          ]),
          E('div', { cls: 'row' }, [
            E('span', { txt: 'Value' }),
            inp,
            E('button', { cls: 'b', txt: '−', on: () => set((+inp.value || 0) - (hi - lo) / 100) }),
            E('button', { cls: 'b', txt: '+', on: () => set((+inp.value || 0) + (hi - lo) / 100) }),
            val
          ])
        ])
      );
      live.push(() => {
        const v = S.rt.v[b.o[0]];
        val.textContent = fmt(v);
        if (document.activeElement !== inp && isFinite(v)) inp.value = +v.toFixed(3);
      });
    });
    // 3. digital inputs: operator buttons and force
    const dig = [];
    for (const n of S.ext) {
      if (!S.nets[n].dig) continue;
      const l = S.lab[n] && S.lab[n].t && S.lab[n].t.trim();
      if (l && !/^\(/.test(l) && !dig.some(x => x[1] === l)) dig.push([n, l]);
    }
    const sig = S.blk.filter(b => b.k === 'SIGAB' && b.o[0] != null && (b.txt || [])[1]);
    body.append(E('h4', { txt: 'Mga button (digital input): ON / OFF at FORCE' }));
    const fin = E('input', { cls: 'f', placeholder: 'hanapin ang tag o description…' });
    body.append(fin);
    const dlist = E('div');
    body.append(dlist);
    const rows = [];
    dig.forEach(([n, l]) => {
      const desc = describe(sh, l);
      const state = E('button', { cls: 'b', txt: 'OFF' }),
        fb = E('button', { cls: 'b', txt: 'FORCE', title: 'I-force ang value kahit ano ang logic' });
      const linked = () => !!(S.xlk && S.xlk[n]);
      state.onclick = () => {
        const cur = S.rt.force[n] !== undefined ? S.rt.force[n] : linked() ? S.rt.v[n] : S.rt.ext[n] || 0;
        const nv = cur > 0.5 ? 0 : 1;
        if (S.rt.force[n] !== undefined || linked()) S.rt.force[n] = nv;
        else S.rt.ext[n] = nv;
        try {
          AN.settle();
        } catch (e) {}
      };
      fb.onclick = () => {
        if (S.rt.force[n] !== undefined) delete S.rt.force[n];
        else S.rt.force[n] = S.rt.v[n] > 0.5 ? 1 : 0;
        try {
          AN.settle();
        } catch (e) {}
      };
      const tr = E('tr', {}, [
        E('td', {}, [
          E('b', { txt: l }),
          E('small', { txt: desc + (S.xlk && S.xlk[n] ? '  (galing sa ibang sheet: ON/OFF = force)' : '') })
        ]),
        E('td', { cls: 'v' }, [state, document.createTextNode(' '), fb])
      ]);
      tr._h = (l + ' ' + desc).toLowerCase();
      rows.push(tr);
      live.push(() => {
        const f = S.rt.force[n] !== undefined,
          on = (f ? S.rt.force[n] : S.rt.v[n]) > 0.5;
        state.textContent = on ? 'ON' : 'OFF';
        state.classList.toggle('on', on);
        fb.classList.toggle('fon', f);
      });
    });
    sig.forEach(b => {
      const tg = (b.txt || [])[1];
      const st = E('button', { cls: 'b', txt: 'OK' });
      st.onclick = () => {
        const q = S.rt.st[b.id];
        if (q) {
          q.val = q.val > 0.5 ? 0 : 1;
          try {
            AN.settle();
          } catch (e) {}
        }
      };
      const tr = E('tr', {}, [
        E('td', {}, [E('b', { txt: 'SIG.AB ' + tg }), E('small', { txt: 'Bad signal (simulation lang)' })]),
        E('td', { cls: 'v' }, [st])
      ]);
      tr._h = ('sig.ab ' + tg + ' bad signal').toLowerCase();
      rows.push(tr);
      live.push(() => {
        const q = S.rt.st[b.id];
        const bad = q && q.val > 0.5;
        st.textContent = bad ? 'BAD' : 'OK';
        st.classList.toggle('fon', !!bad);
      });
    });
    const tb = E('table', { cls: 'tbl' });
    rows.forEach(r => tb.append(r));
    dlist.append(tb);
    if (!rows.length) dlist.append(E('div', { cls: 'sub', txt: 'Walang digital input ang sheet na ito.' }));
    fin.oninput = () => {
      const q = fin.value.trim().toLowerCase();
      rows.forEach(r => (r.style.display = !q || r._h.indexOf(q) >= 0 ? '' : 'none'));
    };
    // 4. monitoring: analog inputs to outputs
    const ais = S.blk.filter(b => b.k === 'AI' && b.o[0] != null);
    if (ais.length) body.append(E('h4', { txt: 'Monitoring: mga input (transmitter)' }));
    if (ais.length) {
      const t = E('table', { cls: 'tbl' });
      ais.forEach(b => {
        const tag = tagOf(S, b.id) || 'AI#' + b.id;
        const unit = (b.rng && b.rng.u) || '';
        const inp = E('input', { cls: 'n', type: 'number', step: 'any' });
        const lab = E('small', { txt: describe(sh, tag) });
        inp.onchange = () => {
          const st = S.rt.st[b.id];
          if (st) {
            st.val = +inp.value;
          }
          try {
            AN.settle();
          } catch (e) {}
        };
        t.append(
          E('tr', {}, [
            E('td', {}, [E('b', { txt: tag }), lab]),
            E('td', { cls: 'v' }, [inp, document.createTextNode(' ' + unit)])
          ])
        );
        live.push(() => {
          const v = S.rt.v[b.o[0]];
          if (document.activeElement !== inp && isFinite(v)) inp.value = +v.toFixed(3);
        });
      });
      body.append(t);
    }
    const aos = [];
    for (const b of S.blk.filter(q => q.k === 'AO' && q.i[0] != null)) {
      let best = null,
        bd = 1e9;
      for (const t of S.tx) {
        if (!/^AO\d{3,4}/.test(t.t.trim())) continue;
        const d = Math.hypot(b.cx - t.x, b.cy - t.y);
        if (d < bd) {
          bd = d;
          best = t.t.trim().split(/\s+/)[0];
        }
      }
      aos.push([b, best && bd < 80 ? best : 'AO#' + b.id]);
    }
    if (aos.length) {
      body.append(E('h4', { txt: 'Monitoring: mga output (AO)' }));
      const t = E('table', { cls: 'tbl' });
      aos.forEach(([b, tag]) => {
        const v = E('td', { cls: 'v', txt: '—' });
        t.append(E('tr', {}, [E('td', {}, [E('b', { txt: tag }), E('small', { txt: describe(sh, tag) })]), v]));
        live.push(() => {
          v.textContent = fmt(S.rt.v[b.i[0]]) + ' %';
        });
      });
      body.append(t);
    }
    // 5. flags (named digital nets that the logic drives)
    const flags = [];
    for (const k in S.lab) {
      const l = S.lab[k] && S.lab[k].t && S.lab[k].t.trim();
      const n = +k;
      if (!l || !S.nets[n] || !S.nets[n].dig || S.ext.includes(n)) continue;
      if (/^(M|B)\.[0-9A-F]{3,4}$/i.test(l) && !flags.some(f => f[1] === l)) flags.push([n, l]);
    }
    if (flags.length) {
      body.append(E('h4', { txt: 'Mga flag ng logic (lamp: pula = 1)' }));
      const t = E('table', { cls: 'tbl' });
      flags.slice(0, 60).forEach(([n, l]) => {
        const lamp = E('span', { cls: 'lamp' });
        t.append(E('tr', {}, [E('td', {}, [lamp, E('b', { txt: l }), E('small', { txt: describe(sh, l) })])]));
        live.push(() => lamp.classList.toggle('on', S.rt.v[n] > 0.5));
      });
      body.append(t);
    }
  }
  function tick() {
    try {
      if (!opp) return;
      const pb = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Panel');
      const on = !!(pb && pb.classList.contains('on'));
      const op = document.body.classList.contains('ophmi');
      opp.style.display = on && op ? 'flex' : 'none';
      if (!(on && op)) return;
      const sh = sheet();
      if (!sh || !sh.S) return;
      if (built !== sh.name) build();
      for (const f of live) f();
    } catch (e) {}
  }
  function tabs(active) {
    const w = E('div', { cls: 'hmitabs' }, [
      E('button', { cls: active === 'd' ? 'on' : '', txt: 'Detalye', on: () => mode(false) }),
      E('button', { cls: active === 'o' ? 'on' : '', txt: 'Operator', on: () => mode(true) })
    ]);
    w.dataset.hmi = '1';
    return w;
  }
  function mode(op) {
    document.body.classList.toggle('ophmi', op);
    try {
      localStorage.setItem('ls.rightpane', op ? 'o' : 'd');
    } catch (e) {}
    if (op) {
      built = '';
    }
    tick();
  }
  function init() {
    const mid = $('mid'),
      anp = $('anp');
    if (!mid || !anp || opp) return false;
    opp = E('div', { id: 'opp' });
    body = E('div', { cls: 'body' });
    opp.append(tabs('o'), body);
    anp.after(opp);
    const ins = () => {
      if (!anp.querySelector('.hmitabs')) anp.prepend(tabs('d'));
    };
    ins();
    new MutationObserver(ins).observe(anp, { childList: true });
    try {
      if (localStorage.getItem('ls.rightpane') === 'o') document.body.classList.add('ophmi');
    } catch (e) {}
    setInterval(tick, 250);
    return true;
  }
  let n = 0;
  const iv = setInterval(() => {
    try {
      if (init() || ++n > 60) clearInterval(iv);
    } catch (e) {
      clearInterval(iv);
    }
  }, 300);
})();
