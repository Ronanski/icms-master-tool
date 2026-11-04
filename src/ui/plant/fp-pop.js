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
  /* the window got smaller (a phone turned, the browser narrowed): an open pop-out placed for the old size stays inside the page (it
     stood off the screen at the right and the whole page scrolled sideways: 867 px wide at 390 px) */
  function keepIn(el) {
    const H = host().getBoundingClientRect(),
      w = el.offsetWidth,
      ht = el.offsetHeight,
      x = parseFloat(el.style.left) || 0,
      y = parseFloat(el.style.top) || 0,
      nx = Math.max(6, Math.min(H.width - w - 6, x)),
      ny = Math.max(6, Math.min(H.height - ht - 6, y));
    if (Math.abs(nx - x) > 0.5) ((el.style.left = Math.round(nx) + 'px'), (el.dataset.side = 'n'));
    if (Math.abs(ny - y) > 0.5) el.style.top = Math.round(ny) + 'px';
  }
  addEventListener('resize', () => document.querySelectorAll('.fpo-near').forEach(el => el.offsetParent && keepIn(el)));
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
  /* #59 (user 2026-10-31): two faceplates per equipment that can be open together, the CONTROL one and the PERMISSIVE · TREND ·
     MONITOR one; BOX = the open ones by slot ('control' / 'info'), box = the one being built */
  let box = null,
    paint = null;
  const BOX = {};
  function closeEl(el) {
    if (!el) return;
    clearInterval(el._iv);
    el.remove();
    for (const k in BOX) if (BOX[k] === el) delete BOX[k];
    if (box === el) box = paint = null;
  }
  function close() {
    for (const k in BOX) closeEl(BOX[k]);
    box = paint = null;
  }
  const anyOpen = () => Object.keys(BOX).length > 0;
  /* on the window (capture): a listener of the app stops the key there before the document */
  addEventListener(
    'keydown',
    e => {
      if (e.key === 'Escape' && anyOpen()) close();
    },
    true
  );
  /* another HMI page, another tab: the faceplate of the page before goes */
  document.addEventListener('change', e => e.target && e.target.classList && e.target.classList.contains('plpick') && close(), true);
  new MutationObserver(() => anyOpen() && document.body.dataset.tab !== 'operate' && close()).observe(document.body, { attributes: true, attributeFilter: ['data-tab'] });
  /* a click on the graphic outside it (not on another equipment, which opens its own) closes it. Live test #48 / #43: a click in the
     Training dock, the header or the alarm bar (a tick of the line-up, then START here) leaves it open where it is */
  document.addEventListener('pointerdown', e => {
    if (!host().contains(e.target) || (e.target.closest && e.target.closest('.fpo-box,[data-hit],[data-mdh],[data-fan],[data-dmp],[data-fl],[data-aphh],[data-eqb],#plfp'))) return;
    for (const k in BOX) {
      const el = BOX[k];
      setTimeout(() => el.isConnected && !el.contains(document.activeElement) && closeEl(el), 0);
    }
  });
  function frame(title, sub, slot = 'control') {
    closeEl(BOX[slot]);
    box = E('div', 'fpo-box');
    box.id = slot === 'info' ? 'fpop2' : 'fpop';
    BOX[slot] = box;
    const me = box;
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
    x.onclick = () => closeEl(me);
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
  /* the "Logic DITL-xx" link (MINA, beta.8 live loop check: it only closed the faceplate): the Logic view first, then the drawing,
     the same order as the Training dock (dock.js: lsSetTab('logic') before openD) */
  const logicGo = (dk, nm) => {
    call(() => window.lsSetTab && window.lsSetTab('logic'));
    call(() => dk.openD(nm, null));
  };
  /* ---------- the motor faceplate ---------- */
  function motor(M) {
    const dk = D();
    if (!M || !dk || !M.ad) return false;
    const s = call(() => dk.dOf(M.ad), null);
    /* #59: M.part 'control' = the CONTROL faceplate (click on the equipment), 'info' = PERMISSIVE · TREND · MONITOR (its Y / N button);
       no part = both in one (the pages not yet on the #59 standard) */
    const part = M.part || '';
    const F = frame(M.n, (M.t || '') + (M.d ? ' · ' + M.d : ''), part === 'info' ? 'info' : 'control');
    const me = box;
    const nm = s ? call(() => dk.dName(s), M.d) : M.d;
    const chip = E('span', 'fpo-chip');
    F.hd.querySelector('.fpo-tt').append(chip);
    if (part) F.hd.querySelector('.fpo-tt').append(E('span', 'fpo-k', part === 'info' ? 'PERMISSIVE · TREND · MONITOR' : 'CONTROL'));
    /* status */
    const lR = lampEl('RUN'),
      lS = lampEl('STOP'),
      lT = lampEl('TRIP');
    const rSt = row('STATUS', lR, lS, lT);
    F.bd.append(rSt);
    /* FIELD selector */
    const [sRL, [bRem, bLoc]] = seg(['REMOTE', 'LOCAL']);
    const fTag = E('span', 'fpo-fld', 'FIELD');
    fTag.title = 'The selector switch at the switchgear: set by the field operator (logged in Events as "Field operator")';
    const rSel = row('SELECTOR', sRL, fTag);
    F.bd.append(rSel);
    /* MODE */
    const [sAM, [bAu, bMa]] = seg(['AUTO', 'MAN']);
    const amR = row('MODE', sAM);
    F.bd.append(amR);
    /* COMMAND */
    const bSt = E('button', 'fpo-cmd', 'START'),
      bSp = E('button', 'fpo-cmd', 'STOP');
    bSt.type = bSp.type = 'button';
    const rCmd = row('DCS', bSt, bSp);
    F.bd.append(rCmd);
    /* 3.2.1 FIELD · LOCAL PANEL (user 2026-11-04, mockup https://claude.ai/artifact/6gyBnteyRkiaLXvhAELyGj approved "Ok goods yn"): the
       field operator at the motor's local control panel and its protection relay, on every motor whose drawing has the inputs (no force
       on the logic page). Each button is an input of THIS motor's own drawing (the B / C copy for pump B / C):
         LCP START / STOP = the "LOCAL START P.B." / "LOCAL STOP P.B." row (DITL-29A rows 23 / 26), a pulse; the drawing takes it only
                            with the selector at LOCAL (AND NOT REMOTE), so the buttons are open only at LOCAL;
         EMERGENCY STOP   = the "EMERGENCY STOP P.B." row, only where the drawing has one (DITL-21A row 18); else grey, "not on DITL-xx";
         RELAY TRIP       = the ELECTRICAL TROUBLE symbol of the drawing (s.nl.usr, the one the logic page toggles): the motor trips in
                            any mode and stays tripped until RESET, like a relay.
       Nothing else is asked: no plant load, no running plant (user: "kht shutdown pre, pwede mg test nyan"); the drawing decides. */
    const svcRows = re => {
      const o = [];
      if (!s) return o;
      for (let r = 0; r < 64; r++) {
        const v = call(() => DUI.rowInfo(s, r).svc, '');
        if (v && re.test(v)) o.push(r);
      }
      return o;
    };
    const lsR = svcRows(/LOCAL\s+START\s+P\.?\s*B/i).pop(),
      lpR = svcRows(/LOCAL\s+STOP\s+P\.?\s*B/i).pop(),
      esR = svcRows(/EMERGENCY\s+STOP\s+P\.?\s*B/i).pop(),
      etU = s && s.nl ? (s.nl.usr || []).find(x => /ELECTRIC/i.test(x.label || '')) : null;
    const hasFld = lsR != null || lpR != null || esR != null || !!etU;
    const fSh = E('div', 'fpo-sh fld', 'FIELD · LOCAL PANEL'),
      bLs = E('button', 'fpo-cmd', 'START'),
      bLp = E('button', 'fpo-cmd', 'STOP'),
      bEs = E('button', 'fpo-cmd es', 'EMERGENCY STOP'),
      bTr = E('button', 'fpo-cmd', 'TRIP'),
      bRs = E('button', 'fpo-cmd', 'RESET');
    for (const b of [bLs, bLp, bEs, bTr, bRs]) b.type = 'button';
    const rLcp = row('LCP', bLs, bLp),
      rEs = row('E-STOP', bEs, ...(esR == null ? [E('span', 'fpo-nd', 'not on ' + (nm || 'its drawing'))] : [])),
      rRly = row('RELAY', bTr, bRs);
    if (hasFld) F.bd.append(fSh, rLcp, rEs, rRly);
    /* live test 2026-11-05 (ACWP-A, DITL-76 row 24 LOCAL STOP P.B. = a FALLING pulse into the reset of the run flip-flop): with the Worker
       the release written once could be overwritten by the Worker's copy of the row (still 1), the button stayed "pressed" and the pump
       ran on; the first STOP did nothing, a second press stopped it. The release is now written again until the row reads 0 */
    const pulse = (r, txt) => {
      dk.fieldRow(nm, r, 1, txt);
      let n = 0;
      const rel = () => {
        const s2 = call(() => dk.dOf(M.ad), null) || s;
        if (s2 && s2.sig) s2.sig[r + ':S'] = false;
        if (window.WORLD && WORLD.live) WORLD.busy = true;
        if (++n < 8) setTimeout(() => (s2 && s2.sig && s2.sig[r + ':S'] ? rel() : n < 3 && setTimeout(rel, 400)), 400);
      };
      setTimeout(rel, 800);
    };
    const etOn = () => !!(etU && s && s.usw && s.usw[etU.key]);
    const etSet = on => {
      if (!etU || !s) return;
      s.usw = s.usw || {};
      s.usw[etU.key] = !!on;
      if (window.WORLD && WORLD.live) WORLD.busy = true;
      call(() => window.lsEventAdd(nm, 'FIELD', 'Field operator: ' + (on ? 'TRIP ' : 'RESET ') + M.n + ' protection relay (ELECTRICAL TROUBLE)'));
    };
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
    /* a field action asks in an amber bar inside the FIELD block (the mockup); a DCS one in the blue bar below the reason line */
    const ask = (t, f, fld) => {
      pend = f;
      exT.textContent = t;
      ex.classList.toggle('fld', !!fld);
      if (fld) F.bd.insertBefore(ex, why);
      else why.after(ex);
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
    const rVcb = row('VCB', vcb);
    F.bd.append(rVcb);
    const trend = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trend.setAttribute('viewBox', '0 0 300 50');
    trend.setAttribute('preserveAspectRatio', 'none');
    trend.setAttribute('class', 'fpo-tr');
    trend.setAttribute('role', 'img');
    trend.setAttribute('aria-label', 'Current trend, 10 minutes');
    const trH = E('div', 'fpo-sh', 'TREND · 10 min'),
      rCur = row('CURRENT', cur, band);
    if (M.cur) F.bd.append(rCur);
    /* monitoring values of the info faceplate: M.mon = [[label, fn, unit, tag]] (bearing, winding, vibration, ...) */
    const mon = (part === 'info' && M.mon) || [];
    const monV = mon.map(([l, f, u, tg]) => {
      const v = E('span', 'fpo-vb');
      F.bd.append(row(l, v, E('small', 'fpo-dim', (u || '') + (tg ? ' · ' + tg : ''))));
      return [v, f];
    });
    if (M.cur) F.bd.append(trH, trend);
    /* SOP line-up of the open step (only when this motor belongs to it) and the logic permissive */
    const sopH = E('div', 'fpo-sh'),
      sopL = E('ul', 'fpo-il');
    const ilH = E('div', 'fpo-sh', 'LOGIC PERMISSIVE' + (nm ? ' · ' + nm : '')),
      ilL = E('ul', 'fpo-il');
    F.bd.append(sopH, sopL, ilH, ilL);
    /* the sections of the part: CONTROL without permissive / trend, INFO without the commands (moved to the top: permissive first) */
    if (part === 'control') for (const el of [rCur, trH, trend, sopH, sopL, ilH, ilL]) el.hidden = true;
    if (part === 'info') {
      for (const el of [rSel, amR, rCmd, why, rVcb]) el.hidden = true;
      F.bd.insertBefore(ilL, rSt.nextSibling);
      F.bd.insertBefore(ilH, ilL);
      F.bd.insertBefore(sopL, ilL.nextSibling);
      F.bd.insertBefore(sopH, sopL);
    }
    /* links */
    const ln = E('div', 'fpo-ln');
    const link = (t, f) => {
      const a = E('button', 'fpo-a', t);
      a.type = 'button';
      a.onclick = f;
      ln.append(a);
    };
    if (M.io) link('I/O wiring', () => call(() => window.lsInfo(M.io)));
    if (nm) link('Logic ' + nm, () => (close(), logicGo(dk, nm)));
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
    /* MINA, beta.8 live loop check: STOP + EXECUTE in AUTO did nothing and the faceplate said nothing. The drawing accepts the DCS STOP
       only in MAN (DITL-29A rows 17 ~ 19 and DITL-30 row 14 / 16: STOP P.B. AND REMOTE AND NOT AUTO): a STOP the logic did not take
       (still RUNNING 3 s after the press, in AUTO) says so below */
    let spAt = 0;
    bSp.onclick = () => !bSp.disabled && ask('STOP ' + M.n + '?', () => ((spAt = Date.now()), dk.dmotor(M.ad, 0), call(() => window.lsEventAdd(nm, 'DCS', 'Operator: STOP ' + M.n + ' (faceplate)'))));
    bLs.onclick = () => !bLs.disabled && ask('FIELD: START ' + M.n + ' at the local panel?', () => pulse(lsR, M.n + ' LOCAL START P.B. (local panel)'), 1);
    bLp.onclick = () => !bLp.disabled && ask('FIELD: STOP ' + M.n + ' at the local panel?', () => pulse(lpR, M.n + ' LOCAL STOP P.B. (local panel)'), 1);
    bEs.onclick = () => !bEs.disabled && ask('FIELD: EMERGENCY STOP ' + M.n + '?', () => pulse(esR, M.n + ' EMERGENCY STOP P.B. (field)'), 1);
    bTr.onclick = () => !bTr.disabled && ask('FIELD: TRIP ' + M.n + ' at its protection relay?', () => etSet(true), 1);
    bRs.onclick = () => !bRs.disabled && ask('FIELD: RESET the protection relay of ' + M.n + '?', () => etSet(false), 1);
    let k0 = '';
    function tick() {
      if (!me.isConnected) return closeEl(me);
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
      if (hasFld) {
        const et = etOn();
        bLs.disabled = lsR == null || !loc || st === 'RUN' || st === 'TRIP';
        bLp.disabled = lpR == null || !loc || st !== 'RUN';
        bLs.classList.toggle('lit-run', st === 'RUN');
        bLp.classList.toggle('lit-stop', st === 'STOP' && loc);
        bEs.disabled = esR == null || st !== 'RUN';
        bTr.disabled = !etU || et;
        bRs.disabled = !etU || !et;
        bTr.classList.toggle('lit-run', et);
        for (const el of [fSh, rLcp, rEs, rRly]) el.hidden = part === 'info';
      }
      /* one line: why a button is closed */
      if (st !== 'RUN' || md.au !== true) spAt = 0;
      const spNo = spAt && st === 'RUN' && md.au === true && Date.now() - spAt > 3000;
      const lcpRows = [lsR, lpR].filter(x => x != null).map(x => x + 1).join(' / ');
      why.textContent =
        spNo
          ? 'STOP not taken: the drawing accepts the DCS STOP in MAN only (' + (nm || 'its drawing') + ': STOP P.B. AND NOT AUTO). Press MAN, then STOP.'
          : st === 'TRIP' && etOn()
          ? 'TRIP: protection relay (ELECTRICAL TROUBLE on ' + (nm || 'its drawing') + '). RESET the relay in the field, then START again.'
          : st === 'TRIP'
          ? 'TRIP: find the cause and reset it in the field before starting again.'
          : loc && lcpRows
            ? 'Selector at LOCAL: AUTO, START and STOP from the DCS are blocked. The local panel starts and stops it.'
          : loc
            ? 'Selector at LOCAL: AUTO, START and STOP from the DCS are blocked. Set the field selector to REMOTE first.'
            : sby
              ? 'STANDBY, ready: its drawing starts it by itself (auto cut-in' + (/^DITL-(29A|30)\b/.test(nm || '') ? ': when a running pump trips, not on a normal STOP' : '') + '). DCS START is in MAN only.'
              : sopLeft && st !== 'RUN'
              ? 'START blocked: finish the SOP line-up first (' + sopLeft + ' left, ✕ below; tick them in the guide).'
              : miss.length && st !== 'RUN'
              ? 'START blocked: ' + miss.length + ' permissive missing: ' + miss.map(r => String(r.svc || '').replace(/^[IMB]\.\S+\s+/, '') + (r.want ? '' : ' (must be 0)')).join('; ') + '.'
              : !run && st !== 'RUN'
                ? 'Simulation PAUSED: press ▶ RUN before START (nothing moves while paused).'
                : md.rem === true && lcpRows && st !== 'TRIP'
                ? 'Selector at REMOTE: the local panel START and STOP are blocked (' + (nm || 'its drawing') + ' rows ' + lcpRows + ' work only in LOCAL). Use DCS START / STOP.'
                : '';
      why.hidden = part === 'info' || !why.textContent;
      /* #59: the Y / N of the info faceplate (and of the page's button: M.onYN) = every logic permissive and SOP line-up item complete */
      const yn = !loc && !miss.length && !sopLeft;
      if (part === 'info') ilH.textContent = 'PERMISSIVE · ' + (yn ? 'Y (all complete)' : 'N (not complete)') + (nm ? ' · ' + nm : '');
      if (M.onYN) call(() => M.onYN(yn), null);
      for (const [v, f] of monV) {
        const x = call(f, null);
        v.textContent = x == null || !isFinite(+x) ? '-----' : (+x).toFixed(1);
      }
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
      sopH.hidden = sopL.hidden = part === 'control' || !(sop && sop.items.length);
      if (sop && sop.items.length) {
        sopH.textContent = 'SOP BEFORE START · PR-OPE-5002 section ' + sop.sec + ' · ' + sop.items.filter(x => x.ok).length + ' / ' + sop.items.length;
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
            ...(left.length > 5 ? [E('li', 'bad', '+ ' + (left.length - 5) + ' more (in the guide)')] : []),
            ...(dn ? [(() => {
              const li = E('li', 'ok');
              li.append(E('i', '', '✓'), E('span', '', 'Done: ' + dn + ' items'));
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
                li.title = (r.ok ? 'OK: ' : 'Missing: ') + r.svc + ' · ' + (r.other || nm) + ' row ' + r.no + (r.want ? ' (must be 1)' : ' (must be 0)');
                return li;
              })
            : [E('li', 'ok', I ? 'No permissive on the drawing.' : 'Logic not ready yet (Plant view, RUN).')])
        );
      }
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
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
    const me = box;
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
    link('Logic ' + V.d, () => (close(), logicGo(dk, V.d)));
    link('Events', () => call(() => document.getElementById('evbtn').click()));
    F.bd.append(ln);
    const ev = t => call(() => window.lsEventAdd(V.d, 'DCS', 'Operator: ' + V.n + ' ' + t + ' (faceplate)'));
    bAu.onclick = () => !bAu.disabled && (V.auSel(true), ev('AUTO'), setTimeout(tick, 150));
    bMa.onclick = () => !bMa.disabled && (V.auSel(false), ev('MAN'), setTimeout(tick, 150));
    bOp.onclick = () => ask(V.n + ' OPEN?', () => (dk.dpress(V.d, V.opRow), ev('OPEN')));
    bCl.onclick = () => ask(V.n + ' CLOSE?', () => (dk.dpress(V.d, V.clRow), ev('CLOSE')));
    function tick() {
      if (!me.isConnected) return closeEl(me);
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
        ? 'Simulation PAUSED: press ▶ RUN first (nothing moves while paused).'
        : au
          ? 'In AUTO the logic opens and closes it. Select MAN for OPEN / CLOSE.'
          : w || '';
      why.hidden = !why.textContent;
      chip.textContent = au ? 'AUTO' : 'MAN';
      chip.className = 'fpo-chip';
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
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
      auto: 'opens below 40 % of LT-CW1109, closes above 85 % (1.7 m) · DITL-78',
      why: () => (window.AN && AN.unit && (+AN.unit.iaP || 0) < 3.5 ? 'No instrument air (below 3.5 kg/cm²): XV-MU1109 is spring opening (vendor sheet K1AU3-E2-0-123 item 39), it is open and cannot be closed.' : '')
    }
  };
  /* a manual valve the field operator turns (Training: FIELD, a digital field item of the plant model, logged as "Field operator") */
  const FIELDV = {
    'V-MU1033': { n: 'V-MU1033', t: 'Expansion tank bypass (manual)', k: 'mu1033', io: 'V-MU1033', use: 'Second fill path of T-1109 (PR-OPE-5002 section 7: XV-MU1109 or the bypass V-MU1033). Close it when LT-CW1109 reaches 1.7 m.' },
    /* Mina's retest step 8 (PR-OPE-5002 7.20 "Open Expansion tank outlet valve to prime the close cooling line (V-CW1001)", 7.22 NL 1.7 m;
       flow diagram K1AU3-PD-021 Rev D: T-1109 outlet V-CW1001 CW-1-001 8"; not in the I/O list: a field valve, plant model AN_SRC.field) */
    'V-CW1001': { n: 'V-CW1001', t: 'Expansion tank outlet (manual)', k: 'cw1001', io: 'V-CW1001', use: 'Primes the closed cooling line from T-1109 (PR-OPE-5002 7.20). Then keep T-1109 at NL 1.7 m, make up if necessary (7.22).' }
  };
  function fieldValve(V) {
    if (!V || !window.AN || !AN.field) return false;
    const st = () => !!(AN.fieldState && AN.fieldState()[V.k]);
    const F = frame(V.n, V.t);
    const me = box;
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
      if (!me.isConnected) return closeEl(me);
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
      why.textContent = run ? '' : 'Simulation PAUSED: press ▶ RUN first (nothing moves while paused).';
      why.hidden = !why.textContent;
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
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
    const me = box;
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
    const ilH = E('div', 'fpo-sh', 'LOGIC PERMISSIVE · ' + P.d + ' (any one is enough)'),
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
    link('Logic ' + P.d, () => (close(), logicGo(dk, P.d)));
    link('Events', () => call(() => document.getElementById('evbtn').click()));
    F.bd.append(ln);
    B.forEach((b, i) => {
      const [l, r, ad] = P.pbs[i];
      b.onclick = () =>
        !b.disabled && ask(P.n + ' ' + l + '?', () => (dk.dpress(P.d, r), call(() => window.lsEventAdd(P.d, 'DCS', 'Operator: ' + P.n + ' ' + l + ' (' + P.d + ' row ' + r + ' · ' + ad + ', faceplate)'))));
    });
    let k0 = '';
    function tick() {
      if (!me.isConnected) return closeEl(me);
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
      why.textContent = !run ? 'Simulation PAUSED: press ▶ RUN first (nothing moves while paused).' : !ok && !on ? P.pbs[0][0] + ' blocked: no ' + (P.permWhy || 'permissive') + '.' : '';
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
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  /* live test #44: a machine with no DCS command (hypochlorite pumps P-0761 / P-0762: STN105 running / overload DI only) = a small status
     pop-out: what it is, where it is run (local panel), its state; FIELD START / STOP only for the one the plant model runs (the field
     operator, logged as such, the same call as the dock). P = { n, t, d, io, why, st: () => 'RUN' | 'STOP' | null, fld: (on) => void } */
  function field(P) {
    if (!P) return false;
    const F = frame(P.n, (P.t || '') + ' · ' + (P.d || 'field'));
    const me = box;
    const lR = lampEl('RUN'),
      lS = lampEl('STOP');
    F.bd.append(row('STATUS', lR, lS));
    F.bd.append(E('div', 'fpo-why', P.why || 'Field equipment: no DCS command. Started at the local panel.'));
    let bSt = null,
      bSp = null,
      ex = null;
    if (P.fld) {
      bSt = E('button', 'fpo-cmd', 'START');
      bSp = E('button', 'fpo-cmd', 'STOP');
      bSt.type = bSp.type = 'button';
      F.bd.append(row('FIELD', bSt, bSp));
      ex = E('div', 'fpo-ex');
      const exT = E('span'),
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
      const go = on => (P.fld(on), call(() => window.lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + (on ? 'START ' : 'STOP ') + P.n + ' (local panel)')));
      bSt.onclick = () => !bSt.disabled && ask('FIELD: START ' + P.n + ' at the local panel?', () => go(true));
      bSp.onclick = () => !bSp.disabled && ask('FIELD: STOP ' + P.n + ' at the local panel?', () => go(false));
    }
    const ln = E('div', 'fpo-ln');
    if (P.io) {
      const a = E('button', 'fpo-a', 'I/O list');
      a.type = 'button';
      a.onclick = () => call(() => window.lsInfo(P.io));
      ln.append(a);
    }
    const ev = E('button', 'fpo-a', 'Events');
    ev.type = 'button';
    ev.onclick = () => call(() => document.getElementById('evbtn').click());
    ln.append(ev);
    F.bd.append(ln);
    function tick() {
      if (!me.isConnected) return closeEl(me);
      const st = call(P.st, null),
        run = isRun();
      F.lamp.className = 'fpo-lamp ' + (st === 'RUN' ? 'run' : st === 'STOP' ? 'stop' : '');
      F.val.textContent = st === 'RUN' ? 'RUNNING' : st === 'STOP' ? 'STOPPED' : '-----';
      lR.className = 'fpo-lp' + (st === 'RUN' ? ' run' : '');
      lS.className = 'fpo-lp' + (st === 'STOP' ? ' stop' : '');
      if (bSt) {
        bSt.disabled = st === 'RUN' || !run;
        bSp.disabled = st !== 'RUN' || !run;
        bSt.classList.toggle('lit-run', st === 'RUN');
        bSp.classList.toggle('lit-stop', st === 'STOP');
      }
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  /* 3.2.1 (mockup pages, hmi-mock.js): a pump the TCS runs (036 turbine oil: tcs.js TCS_OIL), the same commands as the TCS OPERATION
     box of the old 036 page. P = { n, t, d, why, st: () => 'RUN' | 'STOP' | null, au: () => true | false | null (no AUTO / MANUAL when
     absent), cmd: op ('start' | 'stop' | 'auto' | 'man') => '' or the reason it was refused } */
  function tcs(P) {
    if (!P) return false;
    const F = frame(P.n, (P.t || '') + ' · ' + (P.d || 'TCS'));
    const me = box;
    F.hd.querySelector('.fpo-tt').append(E('span', 'fpo-chip', 'TCS'));
    const lR = lampEl('RUN'),
      lS = lampEl('STOP');
    F.bd.append(row('STATUS', lR, lS));
    const mk = t => {
      const b = E('button', 'fpo-cmd', t);
      b.type = 'button';
      return b;
    };
    const bA = P.au ? mk('AUTO') : null,
      bM = P.au ? mk('MAN') : null,
      bSt = mk('START'),
      bSp = mk('STOP');
    if (P.au) F.bd.append(row('MODE', bA, bM));
    F.bd.append(row('TCS', bSt, bSp));
    const msg = E('div', 'fpo-why', P.why || 'Turbine control system (TCS) operation of the plant model.');
    F.bd.append(msg);
    const ex = E('div', 'fpo-ex'),
      exT = E('span'),
      exGo = E('button', 'fpo-go', 'EXECUTE'),
      exNo = E('button', '', 'CANCEL');
    exGo.type = exNo.type = 'button';
    ex.append(exT, exGo, exNo);
    ex.hidden = true;
    F.bd.append(ex);
    let pend = null;
    const L = { start: 'START', stop: 'STOP', auto: 'AUTO', man: 'MANUAL' };
    const ask = op => ((pend = op), (exT.textContent = 'TCS: ' + L[op] + ' ' + P.n + '?'), (ex.hidden = false), exGo.focus());
    exNo.onclick = () => ((pend = null), (ex.hidden = true));
    exGo.onclick = () => {
      const op = pend;
      pend = null;
      ex.hidden = true;
      if (!op) return;
      const r = call(() => P.cmd(op), 'no plant model') || '';
      msg.textContent = r ? '⚠ ' + r : P.n + ' ' + L[op] + ': EXECUTED';
      if (!r) call(() => window.lsEventAdd('TCS', 'DCS', 'Operator (TCS): ' + P.n + ' ' + (P.t || '') + ' ' + L[op]));
      setTimeout(tick, 150);
    };
    bSt.onclick = () => !bSt.disabled && ask('start');
    bSp.onclick = () => !bSp.disabled && ask('stop');
    if (bA) (bA.onclick = () => !bA.disabled && ask('auto')), (bM.onclick = () => !bM.disabled && ask('man'));
    const ln = E('div', 'fpo-ln'),
      ev = E('button', 'fpo-a', 'Events');
    ev.type = 'button';
    ev.onclick = () => call(() => document.getElementById('evbtn').click());
    ln.append(ev);
    F.bd.append(ln);
    function tick() {
      if (!me.isConnected) return closeEl(me);
      const st = call(P.st, null),
        au = P.au ? call(P.au, null) : null,
        run = isRun();
      F.lamp.className = 'fpo-lamp ' + (st === 'RUN' ? 'run' : st === 'STOP' ? 'stop' : '');
      F.val.textContent = st === 'RUN' ? 'RUNNING' : st === 'STOP' ? 'STOPPED' : '-----';
      lR.className = 'fpo-lp' + (st === 'RUN' ? ' run' : '');
      lS.className = 'fpo-lp' + (st === 'STOP' ? ' stop' : '');
      bSt.disabled = st == null || st === 'RUN' || !run;
      bSp.disabled = st == null || st !== 'RUN' || !run;
      bSt.classList.toggle('lit-run', st === 'RUN');
      bSp.classList.toggle('lit-stop', st === 'STOP');
      if (bA) {
        bA.disabled = au == null || au || !run;
        bM.disabled = au == null || !au || !run;
        bA.classList.toggle('lit-run', au === true);
        bM.classList.toggle('lit-stop', au === false);
      }
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  /* 3.2.1-beta.12: a MOV / XV of a DITL sheet (mockup pages): POSITION, OPEN / CLOSED, REMOTE / AUTO, and its CRT push buttons
     (the input rows of the sheet: OPEN, CLOSE, STOP, ISOLATE, REINSTATE ...); each press asks EXECUTE / CANCEL, then presses the row */
  function mov(P) {
    if (!P) return false;
    const F = frame(P.n, (P.t || '') + ' · ' + (P.d || 'DITL'));
    const me = box;
    F.hd.querySelector('.fpo-tt').append(E('span', 'fpo-chip', P.d || 'DITL'));
    const lO = lampEl('OPEN'),
      lC = lampEl('CLOSED'),
      pv = E('span', 'fpo-v', '-----'),
      md = E('span', 'fpo-v', '-----');
    F.bd.append(row('POSITION', pv), row('STATUS', lO, lC), row('MODE', md));
    const I0 = call(P.info, null) || { pbs: [] },
      btns = I0.pbs.map(p => {
        const b = E('button', 'fpo-cmd', p.l);
        b.type = 'button';
        b.onclick = () => !b.disabled && ask(p);
        return b;
      });
    if (btns.length) F.bd.append(row('COMMAND', ...btns));
    const msg = E('div', 'fpo-why', btns.length ? 'Push buttons of the DCS screen (CRT), read from the DITL sheet ' + (P.d || '') + '.' : 'No CRT push button on the DITL sheet ' + (P.d || '') + '.');
    F.bd.append(msg);
    const ex = E('div', 'fpo-ex'),
      exT = E('span'),
      exGo = E('button', 'fpo-go', 'EXECUTE'),
      exNo = E('button', '', 'CANCEL');
    exGo.type = exNo.type = 'button';
    ex.append(exT, exGo, exNo);
    ex.hidden = true;
    F.bd.append(ex);
    let pend = null;
    function ask(p) {
      pend = p;
      exT.textContent = p.l + ' ' + P.n + '?';
      ex.hidden = false;
      exGo.focus();
    }
    exNo.onclick = () => ((pend = null), (ex.hidden = true));
    exGo.onclick = () => {
      const p = pend;
      pend = null;
      ex.hidden = true;
      if (!p) return;
      const r = call(() => P.press(p.row), 'no logic') || '';
      msg.textContent = typeof r === 'string' && r ? '⚠ ' + r : P.n + ' ' + p.l + ': EXECUTED';
      if (!(typeof r === 'string' && r)) call(() => window.lsEventAdd('CRT', 'DCS', 'Operator (CRT): ' + P.n + ' ' + (P.t || '') + ' ' + p.l));
      setTimeout(tick, 150);
    };
    const ln = E('div', 'fpo-ln'),
      ev = E('button', 'fpo-a', 'Events');
    ev.type = 'button';
    ev.onclick = () => call(() => document.getElementById('evbtn').click());
    ln.append(ev);
    F.bd.append(ln);
    function tick() {
      if (!me.isConnected) return closeEl(me);
      const I = call(P.info, null) || {},
        pos = I.pos,
        run = isRun(),
        st = pos == null ? null : pos >= 99.5 ? 'OPEN' : pos <= 0.5 ? 'CLOSED' : 'TRAVEL';
      pv.textContent = pos == null ? '-----' : (+pos).toFixed(1) + ' %';
      F.lamp.className = 'fpo-lamp ' + (pos == null ? '' : pos > 0.5 ? 'run' : 'stop');
      F.val.textContent = st || '-----';
      lO.className = 'fpo-lp' + (pos != null && pos > 0.5 ? ' run' : '');
      lC.className = 'fpo-lp' + (pos != null && pos <= 0.5 ? ' stop' : '');
      md.textContent = [I.rem == null ? '' : I.rem ? 'REMOTE' : 'LOCAL', I.au == null ? '' : I.au ? 'AUTO' : 'MANUAL'].filter(Boolean).join(' · ') || '-----';
      btns.forEach(b => (b.disabled = !run));
    }
    paint = tick;
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  /* 3.2.1 (IRENE: PLANT MODEL, user 2026-11-04 "Kung ano lng ang mapapakinabangan ntn s simulation"): the useful manual valves of the
     plant model (unit.js AN_SW_V0 / AN_FV0, AN.swValve): the field operator sets the opening; red = open (any opening), green = closed */
  const FVUSE = {
    'V-SW1002': 'SWP-A discharge. SOP 1.4: 10 % at start, then open.',
    'V-SW1004': 'SWP-B discharge. SOP 1.4: 10 % at start, then open.',
    'V-SW1006': 'SWP-C discharge. SOP 1.4: 10 % at start, then open.',
    'V-SW1007': 'Condenser A inlet (SOP 1.7: open).',
    'V-SW1008': 'Condenser B inlet (SOP 1.7: open).',
    'V-SW1009': 'Condenser A outlet. SOP 1.12: 22 % while filling, then 40 % (2.31).',
    'V-SW1010': 'Condenser B outlet. SOP 1.12: 22 % while filling, then 40 % (2.31).',
    'V-SW1016': 'SWBP-A discharge.',
    'V-SW1018': 'SWBP-B discharge.',
    'V-SW1020': 'SWBP-C discharge.',
    'V-CW1002': 'ACWP-A suction. Closed = the pump has no water.',
    'V-CW1004': 'ACWP-B suction. Closed = the pump has no water.',
    'V-CW1007': 'ACWP-A discharge. SOP: 5 % at start, then open until PG-CW1108A reads 7 kg/cm².',
    'V-CW1009': 'ACWP-B discharge. SOP: 5 % at start, then open until PG-CW1108B reads 7 kg/cm².',
    'V-CW1010': 'CCWHE A inlet (closed cooling side). 2 of the 3 CCWHE in service.',
    'V-CW1011': 'CCWHE B inlet (closed cooling side).',
    'V-CW1012': 'CCWHE C inlet (closed cooling side). Standby.',
    'V-CW1013': 'CCWHE A outlet (closed cooling side).',
    'V-CW1014': 'CCWHE B outlet (closed cooling side).',
    'V-CW1015': 'CCWHE C outlet (closed cooling side). Standby.',
    'V-MU0001': 'Demi water tank T-0708A outlet.',
    'V-MU0002': 'Demi water tank T-0708B outlet.',
    'V-MU0003': 'MWP-A suction.',
    'V-MU0004': 'MWP-B suction.',
    'V-MU0005': 'MWP-C suction.',
    'V-MU0007': 'MWP-A discharge.',
    'V-MU0009': 'MWP-B discharge.',
    'V-MU0011': 'MWP-C discharge.',
    'V-MU0013': 'MWP-A minimum flow recirculation (SOP: OPEN).',
    'V-MU0015': 'MWP-B minimum flow recirculation (SOP: OPEN).',
    'V-MU0017': 'MWP-C minimum flow recirculation (SOP: OPEN).',
    'V-IA1101': 'Instrument air to unit 1 (PT-IA1706). Closed = the unit 1 header bleeds down.',
    'V-PA1087': 'Plant air to unit 1 (PT-PA1705). Closed = the unit 1 header bleeds down.',
    'V-PA0013': 'Cross-tie: plant air to the instrument air tanks. Normally closed.',
    /* 3.2.1 (IRENE, for SEULGI boiler.js AN_DO.fv0): the diesel oil line-up, PD-022 1/5 Rev D, PR-OPE-5002 section 20 */
    'V-DO0003': 'Diesel oil service tank T-0701 outlet. Closed = the oil pumps have no oil.',
    'V-DO0004': 'Diesel oil strainer inlet (DPT-DO0001). Closed = no oil to the pumps.',
    'V-DO0015': 'Diesel oil pump A suction.',
    'V-DO0007': 'Diesel oil pump A discharge.',
    'V-DO0016': 'Diesel oil pump B suction.',
    'V-DO0009': 'Diesel oil pump B discharge.',
    /* 3.2.1 (IRENE: FEEDWATER, unit.js AN_FV0) */
    'V-FW1001': 'BFWP-A suction (limit switch ZSO-FW1031). SOP 19.16: fully open. Closed = the pump has no water and cannot start.',
    'V-FW1002': 'BFWP-B suction (limit switch ZSO-FW1032). SOP 19.16: fully open. Closed = the pump has no water and cannot start.'
  };
  const fvAll = () => call(() => (AN.swValves ? AN.swValves() : null), null) || {};
  function fieldPct(tag) {
    if (!(tag in fvAll()) || !window.AN || !AN.swValve) return false;
    const pc = () => +fvAll()[tag] || 0;
    const F = frame(tag, 'Manual valve (field)');
    const me = box;
    F.hd.querySelector('.fpo-tt').append(E('span', 'fpo-chip', 'FIELD'));
    const lO = lampEl('OPEN'),
      lC = lampEl('CLOSED');
    F.bd.append(row('POSITION', lO, lC));
    /* the SOP openings: 5 % (ACWP discharge at start), 10 % (SWP discharge at start), 22 / 40 % (condenser outlets, 1.12 / 2.31) */
    const B = [0, 100, 5, 10, 22, 40, 50, 75].map(v => {
      const b = E('button', 'fpo-cmd', v === 0 ? 'CLOSE' : v === 100 ? 'OPEN' : v + ' %');
      b.type = 'button';
      b.onclick = () => !b.disabled && set(v);
      return [v, b];
    });
    /* two buttons per row (the width of the faceplate) */
    F.bd.append(row('LOCAL', B[0][1], B[1][1]));
    F.bd.append(row('THROTTLE', B[2][1], B[3][1]));
    F.bd.append(row('', B[4][1], B[5][1]));
    F.bd.append(row('', B[6][1], B[7][1]));
    const why = E('div', 'fpo-why');
    F.bd.append(why);
    if (FVUSE[tag]) F.bd.append(E('div', 'fpo-dim', FVUSE[tag]));
    const ln = E('div', 'fpo-ln'),
      a = E('button', 'fpo-a', 'Events');
    a.type = 'button';
    a.onclick = () => call(() => document.getElementById('evbtn').click());
    ln.append(a);
    F.bd.append(ln);
    const set = v => {
      AN.swValve(tag, v);
      call(() => window.lsEventAdd('FIELD', 'FIELD', 'Field operator: ' + tag + ' ' + (v === 0 ? 'CLOSED' : v === 100 ? 'OPEN' : v + ' % open') + ' (local)'));
      setTimeout(tick, 150);
    };
    function tick() {
      if (!me.isConnected) return closeEl(me);
      const p = pc(),
        run = isRun(),
        op = p > 0;
      F.lamp.className = 'fpo-lamp ' + (op ? 'run' : 'stop');
      F.val.textContent = op ? Math.round(p) + ' % OPEN' : 'CLOSED';
      lO.className = 'fpo-lp' + (op ? ' run' : '');
      lC.className = 'fpo-lp' + (!op ? ' stop' : '');
      B.forEach(([v, b]) => {
        b.disabled = !run || Math.round(p) === v;
        b.classList.toggle('lit-run', v > 0 && Math.round(p) === v);
        b.classList.toggle('lit-stop', v === 0 && !op);
      });
      why.textContent = run ? '' : 'Simulation PAUSED: press ▶ RUN first (nothing moves while paused).';
      why.hidden = !why.textContent;
    }
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  /* the manual valves on the HMI pages: a <g> whose <title> starts with the tag of a field valve of the plant model (and no faceplate of
     its own) opens fieldPct; its body shows the line-up live (red = open, green = closed) */
  const fvTagOf = g => {
    const t = g && g.firstElementChild && g.firstElementChild.tagName === 'title' ? g.firstElementChild.textContent : '',
      m = /^(V-[A-Z]{2}\d{4})\b/.exec(t || '');
    return m && m[1] in fvAll() ? m[1] : null;
  };
  document.addEventListener(
    'click',
    e => {
      let g = e.target && e.target.closest && e.target.closest('svg g'),
        tag = null;
      if (!g || g.closest('[data-hit]')) return;
      for (let i = 0; i < 3 && g && !(tag = fvTagOf(g)); i++) g = g.parentNode && g.parentNode.closest && g.parentNode.closest('svg g');
      if (tag && fieldPct(tag)) e.stopPropagation();
    },
    true
  );
  setInterval(() => {
    const all = fvAll();
    if (!Object.keys(all).length) return;
    document.querySelectorAll('svg g > title').forEach(ti => {
      const g = ti.parentNode;
      if (g.closest('[data-hit]')) return;
      const tag = fvTagOf(g);
      if (!tag) return;
      const b = g.querySelector('path');
      if (!b) return;
      g.style.cursor = 'pointer';
      b.setAttribute('fill', (+all[tag] || 0) > 0 ? '#d64545' : '#3fa34d');
    });
  }, 1000);
  /* the mockup pages (hmi-mock.js): which kind of valve a tag is, and open (1) / closed (0) / unknown (null) */
  const valveKind = tg => (VALVES[tg] ? 'dcs' : FIELDV[tg] ? 'field' : fvAll()[tg] != null ? 'field' : null);
  const valveOpen = tg =>
    call(() => (VALVES[tg] ? (VALVES[tg].isOpen() ? 1 : 0) : FIELDV[tg] ? (AN.fieldState && AN.fieldState()[FIELDV[tg].k] ? 1 : 0) : fvAll()[tg] != null ? (+fvAll()[tg] > 0 ? 1 : 0) : null), null);
  const valveTag = tg => (VALVES[tg] ? valve(VALVES[tg]) : FIELDV[tg] ? fieldValve(FIELDV[tg]) : fvAll()[tg] != null ? fieldPct(tg) : false);
  /* #59: the Y / N of a motor for the button on its page (the same test as the info faceplate): true = every logic permissive and SOP
     line-up item complete, false = not, null = no logic */
  function yn(M) {
    const dk = D();
    if (!M || !dk || !M.ad) return null;
    const I = call(() => dk.interlock(M.ad), null);
    if (!I) return null;
    const st = call(() => dk.mst(M.ad), null),
      md = call(() => (M.modeFn ? M.modeFn() : dk.modeOf(M.ad)), null) || {},
      sby = st === 'STOP' && md.rem === true && md.au === true,
      miss = sby ? [] : I.miss.filter(r => !/REMOTE/.test(r.svc)),
      sop = call(() => (dk.sopFor ? dk.sopFor(M.ad, M.d) : null), null);
    return md.rem !== false && !miss.length && !(sop && sop.items.some(x => !x.ok));
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
  /* #59 for a controller (039 biasing dampers, ABC-020): the PERMISSIVE · TREND · MONITOR faceplate of its Y / N square.
     P = { n, t, perm: [[label, () => 1 | 0 | null]], lists: [[heading, [lines]]], mon: [[label, fn, unit, dp]], trend: { h, fn, col } };
     a permissive row: Y red = made, N green = not (the approved mockup) */
  function info(P) {
    if (!P) return false;
    const F = frame(P.n, P.t || '', 'info');
    const me = box;
    F.hd.querySelector('.fpo-tt').append(E('span', 'fpo-k', 'PERMISSIVE · TREND · MONITOR'));
    const pH = E('div', 'fpo-sh', P.permH || 'LOGIC PERMISSIVE'),
      pL = E('ul', 'fpo-il');
    if (P.perm && P.perm.length) F.bd.append(pH, pL);
    for (const [h, lines] of P.lists || []) {
      const ul = E('ul', 'fpo-il');
      ul.replaceChildren(...lines.map(t => {
        const li = E('li', '');
        li.append(E('span', '', t));
        return li;
      }));
      F.bd.append(E('div', 'fpo-sh', h), ul);
    }
    const monV = (P.mon || []).map(([l, f, u, dp]) => {
      const v = E('span', 'fpo-vb');
      F.bd.append(row(l, v, E('small', 'fpo-dim', u || '')));
      return [v, f, dp == null ? 1 : dp];
    });
    const trend = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trend.setAttribute('viewBox', '0 0 300 50');
    trend.setAttribute('preserveAspectRatio', 'none');
    trend.setAttribute('class', 'fpo-tr');
    trend.setAttribute('role', 'img');
    trend.setAttribute('aria-label', (P.trend && P.trend.h) || 'Trend');
    if (P.trend) F.bd.append(E('div', 'fpo-sh', P.trend.h), trend);
    const Hs = P.trend ? hist['trend:' + P.trend.h] || (hist['trend:' + P.trend.h] = []) : null;
    let k0 = '';
    function tick() {
      if (!me.isConnected) return closeEl(me);
      const pv = (P.perm || []).map(([l, f]) => [l, call(f, null)]),
        k = pv.map(p => p[1]).join();
      if (k !== k0) {
        k0 = k;
        pL.replaceChildren(...pv.map(([l, v]) => {
          const li = E('li', v === 1 ? 'ok' : 'bad');
          li.append(E('i', '', v == null ? '-' : v === 1 ? 'Y' : 'N'), E('span', '', l));
          return li;
        }));
      }
      for (const [v, f, dp] of monV) {
        const x = call(f, null);
        v.textContent = x == null || !isFinite(+x) ? '-----' : (+x).toFixed(dp);
      }
      if (Hs) {
        const now = Date.now(),
          v = call(P.trend.fn, null);
        if (v != null) sample(Hs, v, now);
        const ys = Hs.map(p => p[1]),
          lo = Math.min(...ys, v == null ? Infinity : v) - 5,
          hi = Math.max(...ys, v == null ? -Infinity : v) + 5,
          y = x => (47 - ((x - lo) / Math.max(1, hi - lo)) * 44).toFixed(1);
        trend.innerHTML = Hs.length
          ? `<polyline fill="none" stroke="${P.trend.col || '#a596cf'}" stroke-width="2" points="${Hs.map(p => ((300 * (p[0] - (now - 600e3))) / 600e3).toFixed(1) + ',' + y(p[1])).join(' ')}"/><circle cx="298" cy="${y(Hs[Hs.length - 1][1])}" r="2.5" fill="${P.trend.col || '#a596cf'}"/>`
          : '';
      }
    }
    tick();
    place(me);
    me._iv = setInterval(tick, 500);
    return true;
  }
  window.LS_FPOP = { motor, valve, valveTag, valveKind, valveOpen, tcs, mov, fieldPct, pb, field, yn, hit, openAd, place, close, info, get open() {
    return anyOpen();
  } };
})();
