/* Operator panel OVERVIEW (1.23.0, mockup v2): a compact grid of every controller of the sheet (tag, mode, PV / SV / MV,
   bars) on top of the faceplates. Click a card: only that faceplate stays, its Engineering part (trend, signals) opens, and
   the FORCE LIST of the loop appears (the drawing's select signals, the mode inputs, the PV) with 0 / 1 / value and release.
   Looks and operation only: it reads the same AN values and writes only rt.force, like the FORCE of the Detalye panel. */
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
    (kids || []).forEach(x => x && e.append(x));
    return e;
  };
  const fmt = x => {
    if (x == null || !isFinite(x)) return '—';
    const a = Math.abs(x);
    /* 3.2.0-beta.6 (audit L2): a value that rounds to zero is shown without the minus sign */
    return (a >= 1000 ? x.toFixed(0) : a >= 100 ? x.toFixed(1) : x.toFixed(2)).replace(/^-(0(?:\.0+)?)$/, '$1');
  };
  let sel = null;
  const cur = () => {
    const sh = window.AN && AN.sheets && AN.sheets[AN.i];
    return sh && sh.S && sh.S.rt ? { sh, S: sh.S } : null;
  };
  const modeOf = (S, c) => {
    const rt = S.rt,
      st = c.amt && rt.st[c.amt.id];
    if (!st) return '?';
    const auto = st.pk === c.autoLeg;
    if (!auto) return 'M';
    const q = c.svSw && rt.st[c.svSw.id];
    return c.remote && q && q.pk === 'A' ? 'R' : 'A';
  };
  const force = (S, n, v) => {
    if (v === null) delete S.rt.force[n];
    else S.rt.force[n] = v;
    try {
      AN.settle();
    } catch (e) {}
  };
  function forceList(S, c, box) {
    box.innerHTML = '';
    const rows = [];
    const add = (n, name, why) => {
      if (n == null || n < 0 || rows.some(r => r.n === n)) return;
      rows.push({ n, name: name || AN.nm(S, n), why });
    };
    add(c.q && c.q.pv, null, 'PV');
    (c.sigs || []).forEach(z => add(z.n, z.name, z.role === 'MAN' ? 'force manual' : 'AUTO select'));
    (c.modes || []).forEach(z => add(z.n, z.name, 'mode (' + z.kind + ')'));
    box.append(E('div', { cls: 'ovh', txt: 'Force list · ' + c.tag }));
    const tb = E('table', { cls: 'ovf' });
    for (const r of rows) {
      const dig = !!(S.nets[r.n] && S.nets[r.n].dig),
        vEl = E('td', { cls: 'v' }),
        ctl = E('td', { cls: 'c' });
      if (dig) {
        ctl.append(
          E('button', { cls: 'b', txt: '0', title: 'FORCE 0', on: () => force(S, r.n, 0) }),
          E('button', { cls: 'b', txt: '1', title: 'FORCE 1', on: () => force(S, r.n, 1) })
        );
      } else {
        const inp = E('input', { type: 'number', step: 'any', title: 'FORCE value (Enter)' });
        inp.onchange = () => {
          const x = parseFloat(inp.value);
          if (isFinite(x)) force(S, r.n, x);
        };
        ctl.append(inp);
      }
      ctl.append(E('button', { cls: 'b', txt: '×', title: 'Release (remove the force)', on: () => force(S, r.n, null) }));
      const tr = E('tr', {}, [E('td', { cls: 'nm' }, [E('b', { txt: r.name }), E('small', { txt: r.why })]), vEl, ctl]);
      tr._u = () => {
        const x = S.rt.v[r.n],
          f = S.rt.force[r.n] !== undefined;
        vEl.textContent = dig ? (x > 0.5 ? '1' : '0') : fmt(x);
        tr.classList.toggle('frc', f);
      };
      tr._u();
      tb.append(tr);
    }
    box.append(tb);
    box._rows = [...tb.children];
  }
  function apply(opp, ov) {
    const fps = [...opp.querySelectorAll('.fp')].filter(f => f.querySelector('.tg b'));
    for (const f of fps) {
      const t = f.querySelector('.tg b').textContent,
        show = !sel || t === sel;
      f.style.display = show ? '' : 'none';
      const d = f.querySelector('details.fpe');
      if (d && sel && t === sel) d.open = true;
    }
    ov.querySelectorAll('.ovc').forEach(x => x.classList.toggle('on', x.dataset.t === sel));
    const fl = ov.querySelector('.ovfl');
    const k = cur();
    if (fl && k) {
      const c = sel && (AN.hmiCtrls(k.S) || []).find(x => x.tag === sel);
      if (c) forceList(k.S, c, fl);
      else {
        fl.innerHTML = '';
        fl._rows = [];
      }
      fl.style.display = c ? '' : 'none';
    }
  }
  function tick() {
    const opp = $('opp'),
      k = cur();
    if (!opp || !k || opp.offsetParent === null) return;
    let cs = [];
    try {
      cs = (AN.hmiCtrls(k.S) || []).filter(c => c.q);
    } catch (e) {
      return;
    }
    const fps = [...opp.querySelectorAll('.fp')].filter(f => f.querySelector('.tg b'));
    if (!fps.length || !cs.length) return;
    const key = k.sh.name + '|' + cs.map(c => c.tag).join(',');
    let ov = opp.querySelector('.fpov');
    if (!ov || ov._k !== key || !ov.isConnected) {
      if (ov) ov.remove();
      if (sel && !cs.some(c => c.tag === sel)) sel = null;
      ov = E('div', { cls: 'fpov' });
      ov._k = key;
      const grid = E('div', { cls: 'ovg' });
      ov._cards = cs.map(c => {
        const pv = E('i', { cls: 'pv' }),
          sv = E('i', { cls: 'sv' }),
          mv = E('i', { cls: 'mv' }),
          md = E('span', { cls: 'md' }),
          nums = E('span', { cls: 'nm' }),
          mvn = E('span', { cls: 'mvn' });
        const card = E('div', { cls: 'ovc', title: (c.desc || '') + ' — click: show only this one' }, [
          E('div', { cls: 'tt', txt: c.tag }),
          E('div', { cls: 'bars' }, [E('div', { cls: 'ovb' }, [pv]), E('div', { cls: 'ovb' }, [sv]), E('div', { cls: 'ovb' }, [mv])]),
          E('div', { cls: 'ft' }, [md, nums]),
          mvn
        ]);
        card.dataset.t = c.tag;
        card.onclick = () => {
          sel = sel === c.tag ? null : c.tag;
          apply(opp, ov);
        };
        grid.append(card);
        return { c, card, pv, sv, mv, md, nums, mvn };
      });
      ov.append(
        E('div', { cls: 'ovh' }, [
          document.createTextNode('Controllers (' + cs.length + ')'),
          E('button', { cls: 'b', txt: 'All', title: 'Show all faceplates', on: () => ((sel = null), apply(opp, ov)) })
        ]),
        grid,
        E('div', { cls: 'ovfl', style: 'display:none' })
      );
      fps[0].parentNode.insertBefore(ov, fps[0]);
      apply(opp, ov);
    }
    /* live values */
    const rt = k.S.rt;
    for (const x of ov._cards) {
      const c = x.c,
        P = c.b.p || {},
        lo = P.rlo != null ? P.rlo : 0,
        hi = P.rhi != null ? P.rhi : 100,
        pc = v => Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100)) + '%',
        pvv = rt.v[c.q.pv],
        svv = c.q.sv != null && c.q.sv >= 0 ? rt.v[c.q.sv] : null,
        mvv = c.out != null ? rt.v[c.out] : null,
        m = modeOf(k.S, c);
      x.pv.style.height = pc(pvv);
      x.sv.style.height = svv == null ? '0' : pc(svv);
      x.mv.style.height = mvv == null ? '0' : Math.max(0, Math.min(100, mvv)) + '%';
      x.md.textContent = m;
      x.md.className = 'md m-' + m;
      x.nums.textContent = fmt(pvv);
      x.mvn.textContent = 'MV ' + (mvv == null ? '—' : fmt(mvv) + '%');
    }
    const fl = ov.querySelector('.ovfl');
    if (fl && fl._rows) fl._rows.forEach(r => r._u && r._u());
  }
  setInterval(() => {
    try {
      tick();
    } catch (e) {}
  }, 500);
})();
