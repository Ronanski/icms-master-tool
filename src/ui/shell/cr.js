/* ===== 3.2.0 CONTROL ROOM SHELL (P2 of the redesign the user approved on 2026-10-22, proposal "Control Room"):
   - a rail on the left: Plant view / Logic / Library / Tools and ⚙ at the bottom;
   - the unit band on top: the plant at a glance (load, main steam pressure, drum level, feedwater flow), search, VIEW | RUN;
   - the alarm banner under it: the last alarm or trip, the number of forced signals, the Event log;
   - ABC | DITL and the sheet name at the start of the ribbon.
   The app's own elements are moved (same buttons, same handlers); nothing here touches the engine. The band only READS values of
   sheets that the simulation already runs: it compiles and starts nothing. Below 900 px the old top bar stays (phone: P4). ===== */
(function () {
  const $ = id => document.getElementById(id);
  const E = (t, cls, txt) => {
    const e = document.createElement(t);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const WIDE = matchMedia('(min-width:900px)'),
    PHONE = matchMedia('(max-width:640px)');
  let P = null;
  /* every moved element goes back before its marker when the window gets narrow */
  const mark = el => {
    const c = document.createComment('cr');
    el.before(c);
    return [el, c];
  };
  function mount() {
    const gs = $('gsbar');
    if (!gs) return false;
    const q = s => gs.querySelector(s);
    const tabs = q(':scope > .tabs'),
      brand = q(':scope > .brand'),
      sub = q(':scope > .sub'),
      crumb = q(':scope > .crumb'),
      srchBtn = $('srchbtn'),
      srch = q(':scope > .gs-search'),
      seg = q(':scope > .seg'),
      set = q(':scope > .ddw.gs-set'),
      tbar = q(':scope > .tbar');
    if (!tabs || !brand || !sub || !crumb || !srch || !seg || !set || !tbar || !$('evbtn')) return false;
    const setM = set.querySelector('.ddm'),
      setB = set.querySelector('button');
    const moved = [brand, tabs, set, sub, crumb, srchBtn, srch, seg].filter(Boolean).map(mark);
    /* --- rail --- */
    const rail = E('nav');
    rail.id = 'crrail';
    rail.setAttribute('aria-label', 'Pages');
    const sp = E('div', 'crsp');
    /* --- unit band --- */
    const band = E('div');
    band.id = 'crband';
    const unit = E('div', 'crunit');
    unit.append(E('b', '', 'LMYP #1 · CFB Boiler'), E('span', '', '460 T/H · DCS Logic Simulator'));
    unit.title = 'The unit: 460 T/H CFB boiler (FHI design data), 150 MW';
    const kpis = E('div', 'crkpis');
    /* the values of the unit, from the sheets that run (the same blocks the PLANT VIEW and the plant model read) */
    const K = [
      ['LOAD', 'MW', 'ABC-001C', 'ai', 'AI0419', 'Generator MW (ABC-001C AI0419)'],
      ['MSP', 'kg/cm²', 'ABC-001C', 'ai', 'AI0131', 'Main steam pressure (ABC-001C AI0131)'],
      ['DRUM LVL', 'mm', 'ABC-010', 'pv', 'LICBR1001', 'Drum level, PV of LICBR1001 (ABC-010)'],
      ['FW FLOW', 'T/H', 'ABC-010', 'pv', 'FICFW1007', 'Feedwater flow, PV of FICFW1007 (ABC-010)']
    ].map(([k, u, sh, how, ref, t]) => {
      const b = E('button', 'crkpi');
      b.type = 'button';
      const v = E('b', '', '—');
      b.append(E('i', '', k), v);
      v.after(E('small', '', u));
      b.title = t + '. Shown once that sheet runs (open it, or Plant ▾ beside VIEW | RUN). Click: open ' + sh + '.';
      b.onclick = () => {
        try {
          if (window.lsSetTab) lsSetTab('logic');
          if (AN.cat !== 'an') AN.setCat('an');
          const i = AN.sheets.findIndex(s => s.name === sh);
          if (i >= 0) AN.go(i);
        } catch (e) {}
      };
      kpis.append(b);
      return { b, v, sh, how, ref, c: null };
    });
    /* --- alarm banner --- */
    const alarm = E('div');
    alarm.id = 'cralarm';
    const aChip = E('span', 'crchip'),
      aT = E('span', 'crat'),
      aTx = E('span', 'cratx'),
      aSp = E('span', 'crsp2'),
      /* 3.2.0-beta.74: the alarm banner's ACK (the newest alarm not acknowledged), flashing until it is acknowledged */
      aAck = E('button', 'crack', 'ACK'),
      fChip = E('span', 'crchip frc');
    fChip.title = 'Signals you forced (FORCE in the Inspector), on every ABC sheet: they stay until you release them. Click for the list';
    /* 3.2.0-beta.6 (engineering audit, signals): the chip opens ONE list of the user's forces on all ABC sheets (the Inspector
       lists only the sheet on screen), with Go to the sheet and Release. Plant-owned values (plant model) are not user forces. */
    const fList = E('div');
    fList.id = 'crflist';
    fChip.setAttribute('role', 'button');
    fChip.tabIndex = 0;
    const fOpen = () => {
      if (fList.classList.toggle('open')) fFill();
    };
    fChip.onclick = fOpen;
    fChip.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fOpen());
    /* 3.2.0 retest #31: the alarm list (the alarm summary of the DCS) with ACK */
    const aList = E('div');
    aList.id = 'cralist';
    aChip.setAttribute('role', 'button');
    aChip.tabIndex = 0;
    aChip.title = 'Alarm list of the whole DCS: ACK';
    const aOpen = () => {
      if (aList.classList.toggle('open')) aFill();
    };
    aChip.onclick = aOpen;
    aChip.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), aOpen());
    aAck.type = 'button';
    aAck.hidden = true;
    aAck.title = 'Acknowledge the newest alarm (the alarm list: the ALARM chip)';
    aAck.onclick = () => {
      const A = window.lsAlarms ? lsAlarms.list().filter(a => !a.ack && !a.sd && !a.rtn) : [];
      if (A.length) lsAlarms.ack(A[A.length - 1].k);
      tick();
    };
    alarm.append(aChip, aT, aTx, aAck, aSp, fChip, fList, aList);
    const ev = $('evbtn'),
      evMark = mark(ev);
    P = { rail, band, alarm, moved, ev, evMark, gs, tabs, brand, set, setM, setB, sub, crumb, srchBtn, srch, seg, tbar, unit, kpis, K, aChip, aT, aTx, aAck, fChip, sp, aList };
    band.append(unit, kpis, E('div', 'crgrow'));
    /* ⚙ in the rail: its menu opens beside the rail, above the bottom of the screen */
    setB.addEventListener('click', () => {
      if (!document.body.classList.contains('cr') || !set.classList.contains('open')) return;
      const r = setB.getBoundingClientRect();
      setM.style.left = P.rail.getBoundingClientRect().right + 8 + 'px';
      setM.style.top = Math.max(8, Math.min(r.top, innerHeight - setM.offsetHeight - 8)) + 'px';
    });
    WIDE.addEventListener ? WIDE.addEventListener('change', apply) : WIDE.addListener(apply);
    PHONE.addEventListener ? PHONE.addEventListener('change', apply) : PHONE.addListener(apply);
    apply();
    setInterval(tick, 1000);
    tick();
    return true;
  }
  function apply() {
    const on = WIDE.matches,
      b = document.body;
    if (on === b.classList.contains('cr')) return phone();
    if (on) {
      document.body.prepend(P.rail);
      P.rail.prepend(P.brand, P.tabs);
      P.rail.append(P.sp, P.set);
      /* 3.2.0-beta.6 (Operator station): the alarm line is IN the unit band (one bar less above the graphic and the drawing) */
      P.gs.prepend(P.band);
      P.band.querySelector('.crgrow').replaceWith(P.alarm);
      if (P.srchBtn) P.band.append(P.srchBtn);
      P.band.append(P.srch, P.seg);
      const where = P.tbar.querySelector('.crwhere') || E('div', 'crwhere');
      where.append(P.sub, P.crumb);
      P.tbar.prepend(where);
      P.alarm.append(P.ev);
    } else {
      P.moved.forEach(([el, c]) => c.before(el));
      P.evMark[1].before(P.ev);
      P.rail.remove();
      P.band.remove();
      P.alarm.replaceWith(E('div', 'crgrow'));
      const w = P.tbar.querySelector('.crwhere');
      if (w) w.remove();
    }
    b.classList.toggle('cr', on);
    phone();
  }
  /* 3.2.0 P4 (after-phones mockup): on a phone (640 px and narrower) the pages (Plant view / Logic / Library / Tools) are a tab
     bar at the bottom, under the status bar; the top bar keeps ABC | DITL, search, VIEW | RUN and ⚙ */
  function phone() {
    const ph = PHONE.matches && !WIDE.matches,
      f = $('sfoot'),
      b = document.body;
    if (ph && f) {
      if (!P.nav) {
        P.nav = E('nav');
        P.nav.id = 'crnav';
        P.nav.setAttribute('aria-label', 'Pages');
      }
      if (P.tabs.parentNode !== P.nav) P.nav.append(P.tabs);
      if (P.nav.parentNode !== f) f.append(P.nav);
    } else if (P.nav) {
      if (P.tabs.parentNode === P.nav) {
        const mk = P.moved.find(([el]) => el === P.tabs);
        if (mk) mk[1].before(P.tabs);
      }
      P.nav.remove();
    }
    b.classList.toggle('crph', !!(ph && f));
    /* the shell measures the top bar and the status bar (workspaces, info card) on resize */
    setTimeout(() => dispatchEvent(new Event('resize')), 0);
  }
  /* --- values (read only) --- */
  function aiVal(k) {
    const sh = AN.sheets.find(s => s.name === k.sh);
    if (!sh || !sh.S) return NaN;
    if (!k.c || k.c.n !== AN.sheets.filter(s => s.S).length) {
      /* the AI block of that station address, on any running sheet (like the plant model, unit.js anUnitAIs) */
      let st = null;
      try {
        st = AN.shStn(sh);
      } catch (e) {}
      const L = [];
      for (const s of AN.sheets) {
        if (!s.S || /^ABC-000/.test(s.name)) continue;
        let s2 = null;
        try {
          s2 = AN.shStn(s);
        } catch (e) {}
        for (const b of s.S.blk) {
          if (b.k !== 'AI' || !b.o || b.o[0] == null) continue;
          const m = /^(?:S(\d)\s*)?(AI\d{4})$/.exec((AN.nm(s.S, b.o[0]) || '').trim());
          if (m && m[2] === k.ref && String(m[1] || s2) === String(st)) L.push([s.S, b]);
        }
      }
      k.c = { n: AN.sheets.filter(s => s.S).length, L };
    }
    for (const [S, b] of k.c.L) {
      const s = S.rt && S.rt.st[b.id];
      if (s && isFinite(s.val)) return +s.val;
    }
    return NaN;
  }
  function pvVal(k) {
    const sh = AN.sheets.find(s => s.name === k.sh);
    if (!sh || !sh.S || !AN.hmiCtrls) return NaN;
    if (!k.c || k.c.S !== sh.S) {
      const c = (AN.hmiCtrls(sh.S) || []).find(x => x.tag === k.ref);
      k.c = { S: sh.S, n: c && c.q && c.q.pv != null ? c.q.pv : -1 };
    }
    return k.c.n >= 0 ? +sh.S.rt.v[k.c.n] : NaN;
  }
  const fmt = x => (isFinite(x) ? (Math.abs(x) >= 1000 ? x.toFixed(0) : x.toFixed(1)).replace(/^-(0\.0)$/, '$1') : '—');
  function tick() {
    if (!P || !document.body.classList.contains('cr') || !window.AN || !AN.sheets) return;
    for (const k of P.K) {
      let x = NaN;
      /* 3.2.0-beta.40: plant model ON and no starting state yet = no plant: no number (before, the drawings' defaults MSP 75 kg/cm2,
         drum level -566 mm showed with "Unit · not started") */
      if (!(AN.plantOn && !AN.startState))
        try {
          x = k.how === 'ai' ? aiVal(k) : pvVal(k);
        } catch (e) {}
      const t = fmt(x);
      if (k.v.textContent !== t) k.v.textContent = t;
      k.b.classList.toggle('na', !isFinite(x));
    }
    /* active alarms and trips. 3.2.0 retest #31 #34: the alarm table of the whole DCS (events.js lsAlarms: every ABC sheet, PAUSED or
       RUN, and the motor TRIPs of the DITL), with ACK; the TRIP nets of the ABC sheet on screen from the Event log (TRIP until reset).
       Before: the sheet on screen only (the LOW-LOW of ABC-057 went away when the screen moved to a DITL sheet) */
    const { act, sup, AL } = activeAlarms();
    const n = act.size,
      un = AL.filter(a => !a.ack).length,
      /* the newest unacknowledged first (a TRIP before an alarm), else the newest */
      vals = [...act.values()],
      last = vals.filter(a => a.ack === false && a.kind === 'TRIP').pop() || vals.filter(a => a.ack === false).pop() || vals.pop();
    P.alarm.classList.toggle('on', n > 0);
    P.aChip.className = 'crchip ' + (n ? 'alm' : 'mut') + (un ? ' unack' : '');
    const unA = AL.filter(a => !a.ack && !a.sd && !a.rtn).length;
    P.aAck.hidden = !unA;
    P.alarm.classList.toggle('new', !!unA);
    /* retest #42 (R7: the alarm name cut to "A L" at 1280 px): the count of the suppressed alarms is on the chip only when no alarm is
       active; with an alarm the room goes to its name (the suppressed count is in the tooltip and the alarm list) */
    P.aChip.textContent = n
      ? n + (n === 1 ? ' ALARM' : ' ALARMS') + (un ? ' · ' + un + ' NEW' : '')
      : 'NO ALARM' + (sup ? ' · ' + sup + ' SUPPRESSED' : '');
    const supL = AL.filter(a => a.sd && !a.rtn && a.late).length;
    P.aChip.title = sup
      ? sup +
        ' shutdown alarm' +
        (sup > 1 ? 's' : '') +
        ' suppressed (equipment of their group stopped): ' +
        (sup - supL) +
        ' standing since the plant was loaded' +
        (supL ? ', ' + supL + ' came later while their group was stopped' : '') +
        '; listed apart in the alarm list; released 10 min after the equipment of the group runs'
      : '';
    /* retest #43 #42: the time says what it is; the full text in the tooltip */
    P.aT.textContent = last && last.t ? 'at ' + last.t : '';
    P.aT.title = 'Simulation time of this alarm';
    P.aTx.textContent = last ? last.text + ' · ' + last.sh : 'No active alarm';
    /* retest #42: short in the header, the rest in the tooltip */
    P.aTx.title =
      (last
        ? last.text + ' · ' + last.sh + (last.t ? ' · at ' + last.t : '') + '\n'
        : sup
          ? sup + ' shutdown alarms suppressed (alarm list: ALARM chip)\n'
          : '') +
      'Alarm list of the whole DCS (every ABC sheet and the motor trips of the DITL), simulation time. Click the ALARM chip for the list and ACK.';
    if (P.aList.classList.contains('open') && (n !== P.aN || un !== P.aU || sup !== P.aS)) aFill();
    P.aS = sup;
    P.aN = n;
    P.aU = un;
    const f = userForces().length;
    if (f !== P.fN && P.alarm.querySelector('#crflist.open')) fFill();
    P.fN = f;
    P.fChip.textContent = f + ' FORCED';
    P.fChip.style.display = f ? '' : 'none';
  }
  /* the user's forces: S.rt.force minus what the plant model owns (S.rt.pf), the same rule as the Inspector list */
  function userForces() {
    const r = [];
    for (const sh of (window.AN && AN.sheets) || []) {
      const S = sh.S;
      if (!S || !S.rt || !S.rt.force) continue;
      for (const k in S.rt.force) if (!(S.rt.pf && S.rt.pf[k])) r.push({ sh, S, n: +k });
    }
    return r;
  }
  /* the active alarms and trips of the header ALARM chip (live check #92: the ALARMS of the new HMI read this list too) */
  function activeAlarms() {
    const L = window.lsEvents || [],
      act = new Map();
    for (let i = L.length - 1; i >= 0; i--) {
      const e = L[i];
      let m;
      if (e.kind === 'TRIP' && (m = /^(.*) = 1$/.exec(e.text))) act.set(e.sh + '|' + m[1], e);
      else if (e.kind === 'RST' && (m = /^(.*) = 0$/.exec(e.text))) act.delete(e.sh + '|' + m[1]);
    }
    const AL = window.lsAlarms ? lsAlarms.list() : [];
    /* retest #35: the alarms standing at the start of a cold plant (shutdown state) are suppressed: not counted, listed apart */
    let sup = 0;
    for (const a of AL)
      if (!a.rtn) {
        if (a.sd) sup++;
        else act.set(a.k, { t: a.t, text: a.nm + ' ' + a.lv, sh: a.sh, kind: a.kind, ack: a.ack });
      }
    return { act, sup, AL };
  }
  window.lsActiveAlarms = () => {
    const r = activeAlarms();
    return { list: [...r.act.values()], sup: r.sup };
  };
  function aFill() {
    const d = $('cralist');
    if (!d || !window.lsAlarms) return;
    const A0 = lsAlarms.list().reverse(),
      L = A0.filter(a => !a.sd),
      SP = A0.filter(a => a.sd && !a.rtn);
    d.textContent = '';
    const h = E('div', 'crfh', 'Alarm list (' + L.length + ') · ' + lsAlarms.unacked() + ' not acknowledged' + (SP.length ? ' · ' + SP.length + ' suppressed' : ''));
    const x = E('button', 'crfx', '✕');
    x.title = 'Close';
    x.onclick = () => d.classList.remove('open');
    h.append(x);
    d.append(h);
    if (!L.length) d.append(E('div', 'crfe', 'No alarm.'));
    for (const a of L.slice(0, 200)) {
      const r = E('div', 'crfr' + (a.ack ? '' : ' unack') + (a.rtn ? ' rtn' : '') + (a.kind === 'TRIP' ? ' trip' : ''));
      r.append(E('span', 'crfs', a.t + ' ' + a.sh), E('span', 'crfn', a.nm), E('span', 'crfv', a.rtn ? 'RTN' : a.lv));
      const ab = E('button', '', a.ack ? 'ACK ✓' : 'ACK');
      ab.disabled = !!a.ack;
      ab.onclick = () => (lsAlarms.ack(a.k), aFill());
      r.append(ab);
      d.append(r);
    }
    /* retest #35: the suppressed shutdown alarms, apart and folded */
    if (SP.length) {
      const g = document.createElement('details'),
        sm = document.createElement('summary');
      /* live test #11: the ones that came after the load (their group still stopped) apart from the ones standing at the load */
      const LT = SP.filter(a => a.late),
        ST = SP.filter(a => !a.late);
      sm.textContent = 'Suppressed: ' + SP.length + ' (' + ST.length + ' standing since the plant was loaded' + (LT.length ? ', ' + LT.length + ' came later while their group was stopped' : '') + ')';
      g.className = 'crfsup';
      g.append(sm);
      for (const a of LT.concat(ST).slice(0, 300)) {
        const r = E('div', 'crfr' + (a.kind === 'TRIP' ? ' trip' : ''));
        r.append(E('span', 'crfs', a.t + ' ' + a.sh), E('span', 'crfn', a.nm + (a.late ? ' · later' : '')), E('span', 'crfv', a.lv));
        g.append(r);
      }
      d.append(g);
    }
    if (lsAlarms.unacked()) {
      const all = E('button', 'crfall', 'ACK ALL');
      all.onclick = () => (lsAlarms.ack(), aFill());
      d.append(all);
    }
  }
  function fFill() {
    const d = $('crflist');
    if (!d) return;
    const L = userForces();
    d.textContent = '';
    const h = E('div', 'crfh', 'Forced signals (' + L.length + ')');
    const x = E('button', 'crfx', '✕');
    x.title = 'Close';
    x.onclick = () => d.classList.remove('open');
    h.append(x);
    d.append(h);
    if (!L.length) d.append(E('div', 'crfe', 'No forced signal.'));
    for (const q of L) {
      const r = E('div', 'crfr'),
        v = q.S.rt.force[q.n],
        nmx = (AN.nm && AN.nm(q.S, q.n)) || 'net ' + q.n;
      r.append(E('span', 'crfs', q.sh.name), E('span', 'crfn', nmx), E('span', 'crfv', q.S.nets[q.n] && q.S.nets[q.n].dig ? (v > 0.5 ? 'FORCE 1' : 'FORCE 0') : String(v)));
      const go = E('button', '', 'Go');
      go.title = 'Open ' + q.sh.name;
      go.onclick = () => AN.go(AN.sheets.indexOf(q.sh));
      const rel = E('button', '', 'Release');
      rel.onclick = () => (AN.setForce(q.sh, q.n, undefined), fFill());
      r.append(go, rel);
      d.append(r);
    }
    if (L.length > 1) {
      const all = E('button', 'crfall', 'Release all');
      all.onclick = () => (userForces().forEach(q => AN.setForce(q.sh, q.n, undefined)), fFill());
      d.append(all);
    }
  }
  /* 3.2.0-beta.6 (Operator station): in the PLANT VIEW the ribbon held only Start ▾ / CHECK (and Pause / speed in RUN): one row
     of the screen for 2 ~ 5 buttons. On a wide screen these groups move to the start of the plant bar (the same buttons, the same
     handlers) and the ribbon row is hidden; on the other pages and on narrow screens they go back. */
  let opMk = null;
  function opBar() {
    const bar = document.querySelector('#plantws .plbar'),
      tb = document.querySelector('#gsbar .tbar'),
      gOp = tb && tb.querySelector('.g-op'),
      gRun = (tb && tb.querySelector('.g-run')) || (bar && bar.querySelector('.g-run'));
    const op = gOp || (bar && bar.querySelector('.g-op'));
    if (!bar || !op || !gRun) return;
    const on = document.body.dataset.tab === 'operate' && WIDE.matches;
    if (on && op.parentNode !== bar) {
      opMk = opMk || [mark(op)[1], mark(gRun)[1]];
      const g = E('div', 'crop');
      g.append(op, gRun);
      bar.prepend(g);
    } else if (!on && opMk && op.parentNode !== opMk[0].parentNode) {
      const g = op.parentNode;
      opMk[0].before(op);
      opMk[1].before(gRun);
      if (g && g.classList.contains('crop')) g.remove();
    }
    document.body.classList.toggle('crop', on);
  }
  new MutationObserver(() => {
    try {
      opBar();
    } catch (e) {}
  }).observe(document.body, { attributes: true, attributeFilter: ['data-tab'] });
  WIDE.addEventListener ? WIDE.addEventListener('change', () => setTimeout(opBar, 0)) : WIDE.addListener(() => setTimeout(opBar, 0));
  setTimeout(() => {
    try {
      opBar();
    } catch (e) {}
  }, 1500);
  const iv = setInterval(() => {
    try {
      if (mount()) clearInterval(iv);
    } catch (e) {
      clearInterval(iv);
    }
  }, 300);
})();
