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
      /* live test beta.74 #33: the equipment's own hit area first; a big group (the whole scene of a page) is not the anchor, the
         click point is (the pop-out opened at the top left over the pump and the HAKBANG tag) */
      const c = e.target && e.target.closest ? e.target : null,
        t = c ? c.closest('[data-hit],[data-mdh],[data-fan],[data-dmp]') || c.closest('g,rect,text,div') : null;
      let r = t && !t.closest('#fpop') ? t.getBoundingClientRect() : null;
      if (r && (r.width > 220 || r.height > 220)) r = null;
      last = { x: e.clientX, y: e.clientY, r };
    },
    true
  );
  /* live test beta.74 #34 (blank trend): the current of every motor of the HMI pages is sampled every 5 s from the load of the page,
     not only while its faceplate is open (one point drew no line) */
  const hist = (window.LS_FPHIST = window.LS_FPHIST || {});
  function sample(H, v, now) {
    if (H.length && now - H[H.length - 1][0] < 5000) return;
    H.push([now, v == null || !isFinite(+v) ? 0 : +v]);
    while (H.length && now - H[0][0] > 600e3) H.shift();
  }
  setInterval(() => {
    const now = Date.now();
    for (const k in REG) {
      const R = REG[k];
      if (!R || !R.cur || !R.n) continue;
      sample(hist[R.n] || (hist[R.n] = []), call(() => R.cur(), null), now);
    }
  }, 5000);
  const host = () => document.getElementById('plmid') || document.body;
  /* beside the clicked equipment: right of it, else left, else below; inside the HMI area; never over the step tag of the dock */
  function place(el, r) {
    const h = host(),
      H = h.getBoundingClientRect(),
      w = el.offsetWidth,
      ht = el.offsetHeight,
      a0 = r || (last && (last.r || { left: last.x, right: last.x, top: last.y, bottom: last.y, width: 0, height: 0 })) || { left: H.left + H.width / 2, right: H.left + H.width / 2, top: H.top + 40, bottom: H.top + 40 },
      a = { left: a0.left, right: a0.right, top: a0.top, bottom: a0.bottom };
    /* live test beta.74 #33: the step's box and its "HAKBANG n" tag around the equipment are part of the anchor, so the pop-out opens
       beside all of them (from the dock it covered SWP-A and the tag) */
    for (const g of document.querySelectorAll('#gdhl:not([hidden]) .gd-hlb, #gdhl:not([hidden]) .gd-hlt')) {
      const G = g.getBoundingClientRect();
      if (G.width && G.left < a.right + 24 && G.right > a.left - 24 && G.top < a.bottom + 60 && G.bottom > a.top - 60)
        ((a.left = Math.min(a.left, G.left)), (a.right = Math.max(a.right, G.right)), (a.top = Math.min(a.top, G.top)), (a.bottom = Math.max(a.bottom, G.bottom)));
    }
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
  /* a click on the graphic outside it (not on another equipment, which opens its own) closes it. Live test #48 / #43: a click in the
     Training dock, the header or the alarm bar (a tick of the line-up, then START here) leaves it open where it is */
  document.addEventListener('pointerdown', e => {
    if (box && !box.contains(e.target) && host().contains(e.target) && !(e.target.closest && e.target.closest('[data-hit],[data-mdh],[data-fan],[data-dmp],[data-fl],[data-aphh],#plfp')))
      setTimeout(() => box && !box.contains(document.activeElement) && close(), 0);
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
    const H = hist[M.n] || (hist[M.n] = []);
    if (M.cur) REG['cur:' + M.n] = { cur: M.cur };
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
      /* live test beta.74 #37: a standby (REMOTE + AUTO, stopped) is ready: the logic starts it (a trip of the running one, low header);
         the DCS START of the drawing is the one accepted only in MAN (DITL-112 OUT8 = PULSE(START P.B.) AND NOT AUTO), not an interlock */
      const sby = st === 'STOP' && md.rem === true && md.au === true;
      const miss = I && !sby ? I.miss.filter(r => !/REMOTE/.test(r.svc)) : [];
      /* the SOP line-up of the open step first (PR-OPE-5002: line-up before the start), as the dock */
      const sop = call(() => (dk.sopFor ? dk.sopFor(M.ad, M.d) : null), null),
        sopLeft = sop ? sop.items.filter(x => !x.ok).length : 0;
      bSt.disabled = loc || sby || st === 'RUN' || st === 'TRIP' || miss.length > 0 || sopLeft > 0;
      bSp.disabled = loc || st !== 'RUN';
      bSt.classList.toggle('lit-run', st === 'RUN');
      bSp.classList.toggle('lit-stop', st === 'STOP');
      /* one line: why a button is closed */
      why.textContent =
        st === 'TRIP'
          ? 'TRIP: hanapin ang sanhi; i-reset sa field bago muling i-START.'
          : loc
            ? 'LOCAL ang selector: sarado ang AUTO, START at STOP ng DCS. REMOTE muna (field).'
            : sby
              ? 'STANDBY, handa: kusang aandar sa logic kapag nag-trip ang tumatakbo o bumaba ang header. Ang START ng DCS ay sa MAN lang.'
              : sopLeft && st !== 'RUN'
              ? 'START sarado: tapusin muna ang SOP line-up (' + sopLeft + ' natitira, ✕ sa ibaba; i-tick sa dock).'
              : miss.length && st !== 'RUN'
              ? 'START sarado: ' + miss.length + ' permissive ang kulang (0 sa ibaba).'
              : !run && st !== 'RUN'
                ? 'Naka-PAUSE ang oras: ▶ RUN muna bago ang START (walang aandar habang naka-PAUSE).'
                : '';
      why.hidden = !why.textContent;
      chip.textContent = st === 'TRIP' ? 'TRIP' : st === 'RUN' ? 'RUNNING' : loc ? 'NOT READY' : sby ? 'STANDBY' : miss.length ? 'INTERLOCK' : st === 'STOP' ? 'READY' : '';
      chip.className = 'fpo-chip ' + (st === 'TRIP' ? 'trip' : miss.length && !loc && st !== 'RUN' ? 'ilk' : '');
      /* current */
      if (M.cur) {
        const v = call(() => M.cur(), null);
        const out = v != null && M.band && st === 'RUN' && (v < M.band[0] || v > M.band[1]);
        cur.textContent = v == null ? '-----' : (+v).toFixed(1) + ' A';
        cur.classList.toggle('hi', !!out);
        F.val.textContent = v == null ? '' : (+v).toFixed(1) + ' A';
        const now = Date.now();
        sample(H, v, now);
        const mx = Math.max(10, ...H.map(p => p[1]), M.band ? M.band[1] * 1.3 : 0);
        trend.innerHTML =
          (M.band ? `<rect x="0" width="300" y="${47 - (M.band[1] / mx) * 44}" height="${((M.band[1] - M.band[0]) / mx) * 44}" fill="#2b3742"/>` : '') +
          `<polyline fill="none" stroke="${st === 'RUN' ? '#e5484d' : '#7f8b97'}" stroke-width="2" points="${H.map(p => ((300 * (p[0] - (now - 600e3))) / 600e3).toFixed(1) + ',' + (47 - (p[1] / mx) * 44).toFixed(1)).join(' ')}"/>` +
          /* the newest value as a dot (a line needs two samples, 5 s apart) */
          (H.length ? `<circle cx="298" cy="${(47 - (H[H.length - 1][1] / mx) * 44).toFixed(1)}" r="2.5" fill="${st === 'RUN' ? '#e5484d' : '#93a2b2'}"/>` : '');
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
            ...left.slice(0, 5).map(x => {
              const li = E('li', 'bad');
              li.append(E('i', '', '✕'), E('span', '', x.t), x.by ? E('em', '', x.by) : '');
              return li;
            }),
            ...(left.length > 5 ? [E('li', 'bad', '+ ' + (left.length - 5) + ' pa (nasa dock)')] : []),
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
  /* ---------- the valve faceplate (live test beta.74, spec item 2: OPEN / CLOSE, AUTO / MAN, ZSO / ZSC) ----------
     V = { n, t, d (its DITL drawing), io, isOpen(), isAuto(), opRow, clRow (the OPEN / CLOSE P.B. rows, pulses in MAN), auSel(v) (the
     AUTO / MAN selection of the drawing), auto (what the logic does in AUTO), why() (a reason it cannot open: '' when none) }.
     The same calls as the dock (LS_DOCK.dpress / dset / dsel); the operator presses, the faceplate never acts on its own */
  function valve(V) {
    const dk = D();
    if (!V || !dk || !V.d || !call(() => dk.dOf(V.d), null)) return false;
    const F = frame(V.n, (V.t || '') + ' · ' + V.d);
    const chip = E('span', 'fpo-chip');
    F.hd.querySelector('.fpo-tt').append(chip);
    const lO = lampEl('ZSO OPEN'),
      lC = lampEl('ZSC CLOSED');
    F.bd.append(row('POSITION', lO, lC));
    const [sAM, [bAu, bMa]] = seg(['AUTO', 'MAN']);
    F.bd.append(row('MODE', sAM));
    const bOp = E('button', 'fpo-cmd', 'OPEN'),
      bCl = E('button', 'fpo-cmd', 'CLOSE');
    bOp.type = bCl.type = 'button';
    F.bd.append(row('DCS', bOp, bCl));
    const why = E('div', 'fpo-why');
    F.bd.append(why);
    const ex = E('div', 'fpo-ex'),
      exT = E('span'),
      exGo = E('button', 'fpo-go', 'EXECUTE'),
      exNo = E('button', '', 'CANCEL');
    exGo.type = exNo.type = 'button';
    ex.append(exT, exGo, exNo);
    ex.hidden = true;
    F.bd.append(ex);
    let pend = null;
    const ask = (t, f) => ((pend = f), (exT.textContent = t), (ex.hidden = false), exGo.focus());
    exNo.onclick = () => ((pend = null), (ex.hidden = true));
    exGo.onclick = () => {
      const f = pend;
      pend = null;
      ex.hidden = true;
      if (f) f();
      setTimeout(tick, 150);
    };
    if (V.auto) F.bd.append(E('div', 'fpo-dim', 'AUTO: ' + V.auto));
    const ln = E('div', 'fpo-ln');
    const link = (t, f) => {
      const a = E('button', 'fpo-a', t);
      a.type = 'button';
      a.onclick = f;
      ln.append(a);
    };
    if (V.io) link('I/O wiring', () => call(() => window.lsInfo(V.io)));
    link('Logic ' + V.d, () => (close(), call(() => dk.openD(V.d, null))));
    link('Events', () => call(() => document.getElementById('evbtn').click()));
    F.bd.append(ln);
    const ev = t => call(() => window.lsEventAdd(V.d, 'DCS', 'Operator: ' + V.n + ' ' + t + ' (faceplate)'));
    bAu.onclick = () => !bAu.disabled && (V.auSel(true), ev('AUTO'), setTimeout(tick, 150));
    bMa.onclick = () => !bMa.disabled && (V.auSel(false), ev('MAN'), setTimeout(tick, 150));
    bOp.onclick = () => ask(V.n + ' OPEN?', () => (dk.dpress(V.d, V.opRow), ev('OPEN')));
    bCl.onclick = () => ask(V.n + ' CLOSE?', () => (dk.dpress(V.d, V.clRow), ev('CLOSE')));
    function tick() {
      if (!box || !box.isConnected) return close();
      const op = !!call(() => V.isOpen(), false),
        au = !!call(() => V.isAuto(), false),
        run = isRun(),
        w = call(() => (V.why ? V.why() : ''), '');
      F.lamp.className = 'fpo-lamp ' + (op ? 'run' : 'stop');
      F.val.textContent = op ? 'OPEN' : 'CLOSED';
      lO.className = 'fpo-lp' + (op ? ' run' : '');
      lC.className = 'fpo-lp' + (!op ? ' stop' : '');
      bAu.classList.toggle('on', au);
      bMa.classList.toggle('on', !au);
      bAu.disabled = au || !run;
      bMa.disabled = !au || !run;
      bOp.disabled = au || op || !run || !!w;
      bCl.disabled = au || !op || !run;
      bOp.classList.toggle('lit-run', op);
      bCl.classList.toggle('lit-stop', !op);
      why.textContent = !run
        ? 'Naka-PAUSE ang oras: ▶ RUN muna (walang kikilos habang naka-PAUSE).'
        : au
          ? 'Nasa AUTO: ang logic ang nagbubukas at nagsasara. MAN muna para sa OPEN / CLOSE.'
          : w || '';
      why.hidden = !why.textContent;
      chip.textContent = au ? 'AUTO' : 'MAN';
      chip.className = 'fpo-chip';
    }
    paint = tick;
    tick();
    place(box);
    iv = setInterval(tick, 500);
    return true;
  }
  /* the valves of the HMI pages with a DITL drawing (the same rows the Training step 8 presses, guide.js) */
  const VALVES = {
    'XV-MU1109': {
      n: 'XV-MU1109',
      t: 'Expansion tank make-up',
      d: 'DITL-78',
      io: 'XV-MU1109',
      isOpen: () => !!(window.AN && AN.unit && +AN.unit.muXv === 1),
      isAuto: () => {
        const s = D() && D().dOf('DITL-78');
        return !!(s && window.DUI && DUI.rowVal(s, 2) === 1);
      },
      opRow: 4,
      clRow: 8,
      auSel: v => (D().dset('DITL-78', 0, v), D().dsel('DITL-78', 2, v, 'EXPANSION TANK INLET VLV XV-MU1109 AUTO SELECTED (M.1252)')),
      auto: 'bukas kapag LT-CW1109 < 40 %, sarado kapag > 85 % (1.7 m) · DITL-78',
      why: () => (window.AN && AN.unit && (+AN.unit.iaP || 0) < 3.5 ? 'Walang instrument air (IA < 3.5 kg/cm²): hindi bubukas ang pneumatic valve. Bypass V-MU1033 (field) ang gamit.' : '')
    }
  };
  /* a manual valve the field operator turns (Training: FIELD, a digital field item of the plant model, logged as "Field operator") */
  const FIELDV = {
    'V-MU1033': { n: 'V-MU1033', t: 'Expansion tank bypass (manual)', k: 'mu1033', io: 'V-MU1033', use: 'Ginagamit para punuin ang T-1109 kapag wala pang instrument air (sarado ang XV-MU1109). Isara kapag LT-CW1109 ≥ 1.7 m.' }
  };
  function fieldValve(V) {
    if (!V || !window.AN || !AN.field) return false;
    const st = () => !!(AN.fieldState && AN.fieldState()[V.k]);
    const F = frame(V.n, V.t);
    const chip = E('span', 'fpo-chip', 'FIELD');
    F.hd.querySelector('.fpo-tt').append(chip);
    const lO = lampEl('OPEN'),
      lC = lampEl('CLOSED');
    F.bd.append(row('POSITION', lO, lC));
    const bOp = E('button', 'fpo-cmd', 'OPEN'),
      bCl = E('button', 'fpo-cmd', 'CLOSE'),
      fTag = E('span', 'fpo-fld', 'FIELD');
    bOp.type = bCl.type = 'button';
    fTag.title = 'A manual valve: turned by the field operator at the valve (logged in Events as "Field operator")';
    F.bd.append(row('LOCAL', bOp, bCl, fTag));
    const why = E('div', 'fpo-why');
    F.bd.append(why);
    if (V.use) F.bd.append(E('div', 'fpo-dim', V.use));
    const ln = E('div', 'fpo-ln'),
      a = E('button', 'fpo-a', 'Events');
    a.type = 'button';
    a.onclick = () => call(() => document.getElementById('evbtn').click());
    if (V.io) {
      const b = E('button', 'fpo-a', 'Info');
      b.type = 'button';
      b.onclick = () => call(() => window.lsInfo(V.io));
      ln.append(b);
    }
    ln.append(a);
    F.bd.append(ln);
    const set = v => {
      AN.field(V.k, v);
      call(() => window.lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (v ? 'OPEN' : 'CLOSE') + ' ' + V.n + ' (local)'));
      setTimeout(tick, 150);
    };
    bOp.onclick = () => !bOp.disabled && set(true);
    bCl.onclick = () => !bCl.disabled && set(false);
    function tick() {
      if (!box || !box.isConnected) return close();
      const op = st(),
        run = isRun();
      F.lamp.className = 'fpo-lamp ' + (op ? 'run' : 'stop');
      F.val.textContent = op ? 'OPEN' : 'CLOSED';
      lO.className = 'fpo-lp' + (op ? ' run' : '');
      lC.className = 'fpo-lp' + (!op ? ' stop' : '');
      bOp.disabled = op || !run;
      bCl.disabled = !op || !run;
      bOp.classList.toggle('lit-run', op);
      bCl.classList.toggle('lit-stop', !op);
      why.textContent = run ? '' : 'Naka-PAUSE ang oras: ▶ RUN muna (walang kikilos habang naka-PAUSE).';
      why.hidden = !why.textContent;
    }
    paint = tick;
    tick();
    place(box);
    iv = setInterval(tick, 500);
    return true;
  }
  /* live test #45: a package run by push buttons of a DITL drawing (debris filter S-1502 / S-1504, DITL-39: REMOTE AUTO START / STOP P.B.
     to the local panel, IN OPERATION back). P = { n, t, d (drawing), io, st: { row, on, off }, pbs: [[label, row, address]],
     perm: [{ row, l }] (any one = 1), vals: [[tag, fn, unit]] }. Same rows and calls as the dock (LS_DOCK.dout / dpress) */
  function pb(P) {
    const dk = D();
    if (!P || !dk || !P.d || !call(() => dk.dOf(P.d), null)) return false;
    const s = dk.dOf(P.d);
    const F = frame(P.n, (P.t || '') + ' · ' + P.d);
    const lOn = lampEl(P.st.on),
      lOff = lampEl(P.st.off || 'STOPPED');
    F.bd.append(row('STATUS', lOn, lOff));
    const B = P.pbs.map(([l, r, ad]) => {
      const b = E('button', 'fpo-cmd', l);
      b.type = 'button';
      b.title = P.d + ' row ' + r + ' · ' + ad;
      return b;
    });
    F.bd.append(row('DCS', ...B));
    const why = E('div', 'fpo-why');
    F.bd.append(why);
    const ex = E('div', 'fpo-ex'),
      exT = E('span'),
      exGo = E('button', 'fpo-go', 'EXECUTE'),
      exNo = E('button', '', 'CANCEL');
    exGo.type = exNo.type = 'button';
    ex.append(exT, exGo, exNo);
    ex.hidden = true;
    F.bd.append(ex);
    let pend = null;
    const ask = (t, f) => ((pend = f), (exT.textContent = t), (ex.hidden = false), exGo.focus());
    exNo.onclick = () => ((pend = null), (ex.hidden = true));
    exGo.onclick = () => {
      const f = pend;
      pend = null;
      ex.hidden = true;
      if (f) f();
      setTimeout(tick, 150);
    };
    const V = (P.vals || []).map(([tag, f, u]) => {
      const v = E('span', 'fpo-vb');
      F.bd.append(row(tag, v, E('small', 'fpo-dim', u || '')));
      return [v, f];
    });
    const ilH = E('div', 'fpo-sh', 'LOGIC PERMISSIVE · ' + P.d + ' (isa lang ang kailangan)'),
      ilL = E('ul', 'fpo-il');
    if (P.perm && P.perm.length) F.bd.append(ilH, ilL);
    const ln = E('div', 'fpo-ln');
    const link = (t, f) => {
      const a = E('button', 'fpo-a', t);
      a.type = 'button';
      a.onclick = f;
      ln.append(a);
    };
    if (P.io) link('I/O wiring', () => call(() => window.lsInfo(P.io)));
    link('Logic ' + P.d, () => (close(), call(() => dk.openD(P.d, null))));
    link('Events', () => call(() => document.getElementById('evbtn').click()));
    F.bd.append(ln);
    B.forEach((b, i) => {
      const [l, r, ad] = P.pbs[i];
      b.onclick = () =>
        !b.disabled && ask(P.n + ' ' + l + '?', () => (dk.dpress(P.d, r), call(() => window.lsEventAdd(P.d, 'DCS', 'Operator: ' + P.n + ' ' + l + ' (' + P.d + ' row ' + r + ' · ' + ad + ', faceplate)'))));
    });
    let k0 = '';
    function tick() {
      if (!box || !box.isConnected) return close();
      const on = call(() => dk.dout(P.d, P.st.row), null) === 1,
        run = isRun(),
        pv = (P.perm || []).map(p => ({ ...p, v: call(() => window.DUI.rowVal(s, p.row), null) })),
        ok = !pv.length || pv.some(p => p.v === 1);
      F.lamp.className = 'fpo-lamp ' + (on ? 'run' : 'stop');
      F.val.textContent = on ? P.st.on : P.st.off || 'STOPPED';
      lOn.className = 'fpo-lp' + (on ? ' run' : '');
      lOff.className = 'fpo-lp' + (!on ? ' stop' : '');
      B[0].disabled = on || !run || !ok;
      if (B[1]) B[1].disabled = !on || !run;
      B[0].classList.toggle('lit-run', on);
      if (B[1]) B[1].classList.toggle('lit-stop', !on);
      why.textContent = !run ? 'Naka-PAUSE ang oras: ▶ RUN muna (walang kikilos habang naka-PAUSE).' : !ok && !on ? P.pbs[0][0] + ' sarado: walang ' + (P.permWhy || 'permissive') + '.' : '';
      why.hidden = !why.textContent;
      for (const [v, f] of V) {
        const x = call(f, null);
        v.textContent = x == null || !isFinite(+x) ? '-----' : (+x).toFixed(0);
      }
      const k = pv.map(p => p.v).join();
      if (k !== k0) {
        k0 = k;
        ilL.replaceChildren(...pv.map(p => {
          const li = E('li', ok ? 'ok' : 'bad');
          li.append(E('i', '', p.v == null ? '-' : String(p.v)), E('span', '', p.l), E('em', '', 'row ' + p.row));
          return li;
        }));
      }
    }
    paint = tick;
    tick();
    place(box);
    iv = setInterval(tick, 500);
    return true;
  }
  const valveTag = tg => (VALVES[tg] ? valve(VALVES[tg]) : FIELDV[tg] ? fieldValve(FIELDV[tg]) : false);
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
    /* the page may still be laying out after a step change: placed again on its symbol once drawn */
    const b = box,
      re = () => {
        const q = el.getBoundingClientRect();
        if (b && b === box && q.width) place(b, q);
      };
    requestAnimationFrame(re);
    setTimeout(re, 350);
    return !!box;
  }
  window.LS_FPOP = { motor, valve, valveTag, pb, hit, openAd, place, close, get open() {
    return !!box;
  } };
})();
