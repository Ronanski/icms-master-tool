/* 3.2.0-beta.74 OPERATOR POP-OUT FACEPLATE (user 2026-10-30: "mini pop out sya sa bawat equipment. Halimbawa SWP-A, meron syang popout for
   controls and permissive based sa SOP at sa logic"; mockups https://claude.ai/artifact/Xjzj9XgmtT62qqiRF8zRQa v7 and
   https://claude.ai/artifact/9bXtfVRUnDvvMAY8K2LKuv v3). A click on a motor of an HMI page opens its faceplate beside the motor, over the
   graphic (the graphic stays whole): status lamps (RUN red, STOP green, TRIP red blinking), the FIELD selector REMOTE / LOCAL (the field
   operator, logged as such), MODE AUTO / MAN (AUTO closed while LOCAL), DCS START / STOP with EXECUTE / CANCEL, VCB, the current with
   its SOP band and a 10 minute trend, "SOP bago i-START" (the line-up items of the open Training step, the same ticks as the dock) and
   "Logic permissive" (the rows of the motor drawing, live 0 / 1, read from the netlist: LS_DOCK.interlock), one line on why a button is
   closed, and links (I/O wiring, logic sheet, events). Same pattern for the controllers (plant.js fpOpen: A / M, SV, MV, PV).
   UI only: every action goes through the same calls as the dock (LS_DOCK.fieldRow / dsel / dmotor), the plant and the logic are the
   engine's. Nothing is pressed for the operator, nothing is forced. */
(function () {
  const E = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };
  const D = () => window.LS_DOCK;
  const call = (f, d) => {
    try {
      const x = f();
      return x == null ? d : x;
    } catch (e) {
      return d;
    }
  };
  const isRun = () =>
    !!(window.AN && ((AN.cat === 'an' && AN.run && !AN.view) || (AN.cat !== 'an' && typeof SIM !== 'undefined' && SIM && !(typeof DPAUSE !== 'undefined' && DPAUSE))));
  /* the motors of the HMI pages register here (their info card tag = the key the page used before for a click) */
  const REG = (window.LS_FPREG = window.LS_FPREG || {});
  /* where the last click was: the pop-out opens beside it */
  let last = null;
  document.addEventListener(
    'pointerdown',
    e => {
      const t = e.target && e.target.closest ? e.target.closest('g,rect,text,div') : null;
      last = { x: e.clientX, y: e.clientY, r: t && !t.closest('#fpop') ? t.getBoundingClientRect() : null };
    },
    true
  );
  const host = () => document.getElementById('plmid') || document.body;
  /* beside the clicked equipment: right of it, else left, else below; inside the HMI area; never over the step tag of the dock */
  function place(el, r) {
    const h = host(),
      H = h.getBoundingClientRect(),
      w = el.offsetWidth,
      ht = el.offsetHeight,
      a = r || (last && (last.r || { left: last.x, right: last.x, top: last.y, bottom: last.y, width: 0, height: 0 })) || { left: H.left + H.width / 2, right: H.left + H.width / 2, top: H.top + 40, bottom: H.top + 40 };
    let x,
      side = 'l';
    if (a.right + 14 + w <= H.right - 6) x = a.right + 14 - H.left;
    else if (a.left - 14 - w >= H.left + 6) ((x = a.left - 14 - w - H.left), (side = 'r'));
    else ((x = Math.max(6, Math.min(H.width - w - 6, a.left - H.left))), (side = 'n'));
    let y = Math.max(6, Math.min(H.height - ht - 6, (a.top + a.bottom) / 2 - H.top - 60));
    /* the "HAKBANG n" tag of the step stays in view: the pop-out goes below (or above) it when it would cover it */
    const tg = document.querySelector('#gdhl:not([hidden]) .gd-hlt'),
      T = tg && tg.getBoundingClientRect();
    if (T && T.width && x + H.left < T.right && x + H.left + w > T.left && y + H.top < T.bottom && y + H.top + ht > T.top)
      y = T.bottom - H.top + 6 + ht <= H.height ? T.bottom - H.top + 6 : Math.max(0, T.top - H.top - ht - 6);
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    el.dataset.side = side;
    const ay = Math.max(14, Math.min(ht - 14, (a.top + a.bottom) / 2 - H.top - y));
    el.style.setProperty('--ay', Math.round(ay) + 'px');
  }
  /* dragged by its header */
  function drag(el, hd) {
    hd.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const x0 = e.clientX - el.offsetLeft,
        y0 = e.clientY - el.offsetTop;
      el.dataset.side = 'n';
      const mv = ev => {
          el.style.left = ev.clientX - x0 + 'px';
          el.style.top = Math.max(0, ev.clientY - y0) + 'px';
        },
        up = () => (removeEventListener('pointermove', mv), removeEventListener('pointerup', up));
      addEventListener('pointermove', mv);
      addEventListener('pointerup', up);
    });
  }
  let box = null,
    iv = null,
    paint = null;
  function close() {
    if (box) box.remove();
    box = paint = null;
    clearInterval(iv);
    iv = null;
  }
  /* on the window (capture): a listener of the app stops the key there before the document */
  addEventListener(
    'keydown',
    e => {
      if (e.key === 'Escape' && box) close();
    },
    true
  );
  /* another HMI page, another tab: the faceplate of the page before goes */
  document.addEventListener('change', e => e.target && e.target.classList && e.target.classList.contains('plpick') && close(), true);
  new MutationObserver(() => box && document.body.dataset.tab !== 'operate' && close()).observe(document.body, { attributes: true, attributeFilter: ['data-tab'] });
  /* a click outside (not on another equipment, which opens its own) closes it */
  document.addEventListener('pointerdown', e => {
    if (box && !box.contains(e.target) && !(e.target.closest && e.target.closest('[data-hit],[data-mdh],#plfp'))) setTimeout(() => box && !box.contains(document.activeElement) && close(), 0);
  });
  function frame(title, sub) {
    close();
    box = E('div', '');
    box.id = 'fpop';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', title + ' faceplate');
    const hd = E('div', 'fpo-h'),
      lamp = E('i', 'fpo-lamp'),
      nm = E('b', '', title),
      sb = E('small', '', sub || ''),
      val = E('span', 'fpo-hv'),
      x = E('button', 'fpo-x', '✕');
    x.type = 'button';
    x.title = 'Close (Esc)';
    x.setAttribute('aria-label', 'Close');
    x.onclick = close;
    const tt = E('div', 'fpo-tt');
    tt.append(nm, sb);
    hd.append(lamp, tt, val, x);
    const bd = E('div', 'fpo-b');
    box.append(hd, bd);
    host().append(box);
    drag(box, hd);
    return { hd, lamp, val, bd };
  }
  const row = (lbl, ...kids) => {
    const r = E('div', 'fpo-r');
    r.append(E('span', 'fpo-l', lbl), ...kids);
    return r;
  };
  const seg = names => {
    const s = E('div', 'fpo-seg');
    const B = names.map(n => {
      const b = E('button', '', n);
      b.type = 'button';
      s.append(b);
      return b;
    });
    return [s, B];
  };
  const lampEl = t => {
    const s = E('span', 'fpo-lp');
    s.append(E('i'), t);
    return s;
  };
  /* ---------- the motor faceplate ---------- */
  function motor(M) {
    const dk = D();
    if (!M || !dk || !M.ad) return false;
    const s = call(() => dk.dOf(M.ad), null);
    const F = frame(M.n, (M.t || '') + (M.d ? ' · ' + M.d : ''));
    const nm = s ? call(() => dk.dName(s), M.d) : M.d;
    const chip = E('span', 'fpo-chip');
    F.hd.querySelector('.fpo-tt').append(chip);
    /* status */
    const lR = lampEl('RUN'),
      lS = lampEl('STOP'),
      lT = lampEl('TRIP');
    F.bd.append(row('STATUS', lR, lS, lT));
    /* FIELD selector */
    const [sRL, [bRem, bLoc]] = seg(['REMOTE', 'LOCAL']);
    const fTag = E('span', 'fpo-fld', 'FIELD');
    fTag.title = 'The selector switch at the switchgear: set by the field operator (logged in Events as "Field operator")';
    F.bd.append(row('SELECTOR', sRL, fTag));
    /* MODE */
    const [sAM, [bAu, bMa]] = seg(['AUTO', 'MAN']);
    const amR = row('MODE', sAM);
    F.bd.append(amR);
    /* COMMAND */
    const bSt = E('button', 'fpo-cmd', 'START'),
      bSp = E('button', 'fpo-cmd', 'STOP');
    bSt.type = bSp.type = 'button';
    F.bd.append(row('DCS', bSt, bSp));
    const why = E('div', 'fpo-why');
    F.bd.append(why);
    /* EXECUTE / CANCEL */
    const ex = E('div', 'fpo-ex'),
      exT = E('span'),
      exGo = E('button', 'fpo-go', 'EXECUTE'),
      exNo = E('button', '', 'CANCEL');
    exGo.type = exNo.type = 'button';
    ex.append(exT, exGo, exNo);
    ex.hidden = true;
    F.bd.append(ex);
    let pend = null;
    const ask = (t, f) => {
      pend = f;
      exT.textContent = t;
      ex.hidden = false;
      exGo.focus();
    };
    exNo.onclick = () => ((pend = null), (ex.hidden = true));
    exGo.onclick = () => {
      const f = pend;
      pend = null;
      ex.hidden = true;
      if (f) f();
      setTimeout(tick, 150);
    };
    /* VCB and current */
    const vcb = lampEl('VCB');
    const cur = E('span', 'fpo-vb'),
      band = E('small', 'fpo-dim', M.band ? 'SOP ' + M.band[0] + ' ~ ' + M.band[1] + ' A' : '');
    F.bd.append(row('VCB', vcb));
    const trend = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trend.setAttribute('viewBox', '0 0 300 50');
    trend.setAttribute('preserveAspectRatio', 'none');
    trend.setAttribute('class', 'fpo-tr');
    trend.setAttribute('role', 'img');
    trend.setAttribute('aria-label', 'Current trend, 10 minutes');
    if (M.cur) {
      F.bd.append(row('CURRENT', cur, band));
      F.bd.append(trend);
    }
    /* SOP line-up of the open step (only when this motor belongs to it) and the logic permissive */
    const sopH = E('div', 'fpo-sh'),
      sopL = E('ul', 'fpo-il');
    const ilH = E('div', 'fpo-sh', 'LOGIC PERMISSIVE' + (nm ? ' · ' + nm : '')),
      ilL = E('ul', 'fpo-il');
    F.bd.append(sopH, sopL, ilH, ilL);
    /* links */
    const ln = E('div', 'fpo-ln');
    const link = (t, f) => {
      const a = E('button', 'fpo-a', t);
      a.type = 'button';
      a.onclick = f;
      ln.append(a);
    };
    if (M.io) link('I/O wiring', () => call(() => window.lsInfo(M.io)));
    if (nm) link('Logic ' + nm, () => (close(), call(() => dk.openD(nm, null))));
    link('Events', () => call(() => document.getElementById('evbtn').click()));
    F.bd.append(ln);
    const hist = (window.LS_FPHIST = window.LS_FPHIST || {});
    const H = hist[M.n] || (hist[M.n] = []);
    /* a drawing whose rows are not named "... MODE SELECTED" (DITL-76 / 77 ACWP: LCP REMOTE SELECTED row 20, CRT AUTO PB row 1): the
       page gives its rows (remRows, auRow) and its reader of the mode (modeFn) */
    const mrows = () => (M.remRows ? { rem: M.remRows } : call(() => (s && (s._mrows || (dk.modeOf(M.ad), s._mrows))) || null, null));
    const amr = M.auRow != null ? { row: M.auRow } : call(() => dk.amRow(s), null);
    if (!amr) amR.hidden = true;
    /* the actions: the same calls as the dock */
    bRem.onclick = () => {
      const R = mrows();
      if (!R || !R.rem.length) return;
      ask('FIELD: ' + M.n + ' selector to REMOTE?', () => R.rem.forEach(r => dk.fieldRow(nm, r, 1, M.n + ' REMOTE MODE SELECTED (field selector)')));
    };
    bLoc.onclick = () => {
      const R = mrows();
      if (!R || !R.rem.length) return;
      ask('FIELD: ' + M.n + ' selector to LOCAL?', () => R.rem.forEach(r => dk.fieldRow(nm, r, 0, M.n + ' LOCAL (field selector)')));
    };
    bAu.onclick = () => amr && !bAu.disabled && ask(M.n + ' to AUTO (standby)?', () => dk.dsel(nm, amr.row, 1, M.n + ' AUTO MODE SELECTED'));
    bMa.onclick = () => amr && ask(M.n + ' to MAN?', () => dk.dsel(nm, amr.row, 0, M.n + ' AUTO MODE SELECTED'));
    bSt.onclick = () => !bSt.disabled && ask('START ' + M.n + '?', () => (dk.dmotor(M.ad, 1), call(() => window.lsEventAdd(nm, 'DCS', 'Operator: START ' + M.n + ' (faceplate)'))));
    bSp.onclick = () => !bSp.disabled && ask('STOP ' + M.n + '?', () => (dk.dmotor(M.ad, 0), call(() => window.lsEventAdd(nm, 'DCS', 'Operator: STOP ' + M.n + ' (faceplate)'))));
    let k0 = '';
    function tick() {
      if (!box || !box.isConnected) return close();
      const st = call(() => dk.mst(M.ad), null),
        md = call(() => (M.modeFn ? M.modeFn() : dk.modeOf(M.ad)), null) || {},
        I = call(() => dk.interlock(M.ad), null),
        run = isRun(),
        loc = md.rem === false;
      F.lamp.className = 'fpo-lamp ' + (st === 'RUN' ? 'run' : st === 'TRIP' ? 'trip' : st === 'STOP' ? 'stop' : '');
      lR.className = 'fpo-lp' + (st === 'RUN' ? ' run' : '');
      lS.className = 'fpo-lp' + (st === 'STOP' ? ' stop' : '');
      lT.className = 'fpo-lp' + (st === 'TRIP' ? ' trip' : '');
      vcb.className = 'fpo-lp' + (st === 'RUN' ? ' run' : st ? ' stop' : '');
      vcb.lastChild.textContent = st === 'RUN' ? 'ON' : st ? 'OFF' : '---';
      vcb.title = 'VCB ON / OFF of the I/O list: shown closed while the motor runs (no logic sheet reads it)';
      bRem.classList.toggle('on', md.rem === true);
      bLoc.classList.toggle('on', md.rem === false);
      bRem.disabled = bLoc.disabled = md.rem == null;
      bAu.classList.toggle('on', md.au === true);
      bMa.classList.toggle('on', md.au === false);
      bAu.disabled = loc || md.au == null;
      const miss = I ? I.miss.filter(r => !/REMOTE/.test(r.svc)) : [];
      /* the SOP line-up of the open step first (PR-OPE-5002: line-up before the start), as the dock */
      const sop = call(() => (dk.sopFor ? dk.sopFor(M.ad, M.d) : null), null),
        sopLeft = sop ? sop.items.filter(x => !x.ok).length : 0;
      bSt.disabled = loc || st === 'RUN' || st === 'TRIP' || miss.length > 0 || sopLeft > 0;
      bSp.disabled = loc || st !== 'RUN';
      bSt.classList.toggle('lit-run', st === 'RUN');
      bSp.classList.toggle('lit-stop', st === 'STOP');
      /* one line: why a button is closed */
      why.textContent =
        st === 'TRIP'
          ? 'TRIP: hanapin ang sanhi; i-reset sa field bago muling i-START.'
          : loc
            ? 'LOCAL ang selector: sarado ang AUTO, START at STOP ng DCS. REMOTE muna (field).'
            : sopLeft && st !== 'RUN'
              ? 'START sarado: tapusin muna ang SOP line-up (' + sopLeft + ' natitira, ✕ sa ibaba; i-tick sa dock).'
              : miss.length && st !== 'RUN'
              ? 'START sarado: ' + miss.length + ' permissive ang kulang (0 sa ibaba).'
              : !run && st !== 'RUN'
                ? 'Naka-PAUSE ang oras: ▶ RUN muna bago ang START (walang aandar habang naka-PAUSE).'
                : '';
      why.hidden = !why.textContent;
      chip.textContent = st === 'TRIP' ? 'TRIP' : st === 'RUN' ? 'RUNNING' : loc ? 'NOT READY' : miss.length ? 'INTERLOCK' : st === 'STOP' ? 'READY' : '';
      chip.className = 'fpo-chip ' + (st === 'TRIP' ? 'trip' : miss.length && !loc && st !== 'RUN' ? 'ilk' : '');
      /* current */
      if (M.cur) {
        const v = call(() => M.cur(), null);
        const out = v != null && M.band && st === 'RUN' && (v < M.band[0] || v > M.band[1]);
        cur.textContent = v == null ? '-----' : (+v).toFixed(1) + ' A';
        cur.classList.toggle('hi', !!out);
        F.val.textContent = v == null ? '' : (+v).toFixed(1) + ' A';
        const now = Date.now();
        if (!H.length || now - H[H.length - 1][0] >= 5000) {
          H.push([now, v == null ? 0 : +v]);
          while (H.length && now - H[0][0] > 600e3) H.shift();
        }
        const mx = Math.max(10, ...H.map(p => p[1]), M.band ? M.band[1] * 1.3 : 0);
        trend.innerHTML =
          (M.band ? `<rect x="0" width="300" y="${50 - (M.band[1] / mx) * 48}" height="${((M.band[1] - M.band[0]) / mx) * 48}" fill="#2b3742"/>` : '') +
          `<polyline fill="none" stroke="${st === 'RUN' ? '#e5484d' : '#7f8b97'}" stroke-width="2" points="${H.map(p => ((300 * (p[0] - (now - 600e3))) / 600e3).toFixed(1) + ',' + (50 - (p[1] / mx) * 48).toFixed(1)).join(' ')}"/>`;
      }
      /* SOP line-up of the open step */
      sopH.hidden = sopL.hidden = !(sop && sop.items.length);
      if (sop && sop.items.length) {
        sopH.textContent = 'SOP BAGO I-START · PR-OPE-5002 seksyon ' + sop.sec + ' · ' + sop.items.filter(x => x.ok).length + ' / ' + sop.items.length;
        /* what is left only (✕), the done ones as one line (the full list with its ticks is in the dock) */
        const k = JSON.stringify(sop.items.map(x => [x.t, x.ok]));
        if (k !== sopL.dataset.k) {
          sopL.dataset.k = k;
          const left = sop.items.filter(x => !x.ok),
            dn = sop.items.length - left.length;
          sopL.replaceChildren(
            ...left.slice(0, 8).map(x => {
              const li = E('li', 'bad');
              li.append(E('i', '', '✕'), E('span', '', x.t), x.by ? E('em', '', x.by) : '');
              return li;
            }),
            ...(left.length > 8 ? [E('li', 'bad', '+ ' + (left.length - 8) + ' pa (nasa dock)')] : []),
            ...(dn ? [(() => {
              const li = E('li', 'ok');
              li.append(E('i', '', '✓'), E('span', '', 'Nagawa na: ' + dn + ' item'));
              return li;
            })()] : [])
          );
        }
      }
      /* logic permissive: the rows of the drawing, live */
      /* one line per signal: the rows of one address (DITL-29A rows 5, 18, 22 = SEAWATER PUMP C REMOTE MODE SELECTED) are one row */
      const rows = [];
      for (const r of I ? I.rows : []) {
        const t = String(r.svc).replace(/^[\w./]*\d\S*\s+/, '') + (r.cmp ? ' (' + r.cmp + ')' : ''),
          o = rows.find(x => x.t === t && x.other === r.other && x.ok === r.ok);
        if (o) o.no += ' · ' + r.no;
        else rows.push({ ...r, t, no: String(r.no) });
      }
      const kk = JSON.stringify(rows.map(r => [r.no, r.ok, r.other]));
      if (kk !== k0) {
        k0 = kk;
        ilL.replaceChildren(
          ...(rows.length
            ? rows.slice(0, 12).map(r => {
                const li = E('li', r.ok ? 'ok' : 'bad');
                li.append(E('i', '', String(r.ok ? +r.want : 1 - r.want)), E('span', '', r.t), E('em', '', (r.other ? r.other + ' ' : '') + 'row ' + r.no));
                li.title = (r.ok ? 'OK: ' : 'Kulang: ') + r.svc + ' · ' + (r.other || nm) + ' row ' + r.no + (r.want ? ' (dapat 1)' : ' (dapat 0)');
                return li;
              })
            : [E('li', 'ok', I ? 'Walang permissive sa drawing.' : 'Hindi pa handa ang logic (Plant view, RUN).')])
        );
      }
    }
    paint = tick;
    tick();
    place(box);
    iv = setInterval(tick, 500);
    return true;
  }
  /* an HMI page's click on a machine: its faceplate when the motor is known to the logic, else the info card (as before) */
  function hit(M, fallback) {
    if (M && M.ad && !M.fld && !/@/.test(M.ad) && D() && call(() => D().dOf(M.ad), null) && motor(M)) return;
    if (fallback) fallback();
  }
  /* the faceplate of a motor named by its address (the dock's "Buksan ang faceplate"): the page on screen opens it beside its symbol */
  function openAd(ad) {
    const R = REG[ad],
      el = R && call(() => R.el(), null);
    if (!R || !el || !el.isConnected) return false;
    last = { r: el.getBoundingClientRect() };
    R.open();
    return !!box;
  }
  window.LS_FPOP = { motor, hit, openAd, place, close, get open() {
    return !!box;
  } };
})();
