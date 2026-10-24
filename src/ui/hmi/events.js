/* EVENT LOG (1.23.0, mockup v2): what changed while the simulation runs, with the simulation time: controller mode
   (AUTO / MAN / REMOTE), force manual signal of the drawing (on / off), alarm level (ALM blocks) and nets whose name says
   TRIP / MFT / STOP. Button "Events" in the status bar; read only. */
(function () {
  const $ = id => document.getElementById(id);
  const LOG = [],
    MAX = 200,
    TRIP = /TRIP|MFT|SHUT\s*DOWN|\bSTOP\b|ESD|EMERG|RUN\s*BACK/i;
  let prev = {},
    sheetK = '',
    unseen = 0;
  const tfmt = t => {
    t = Math.max(0, Math.round(t || 0));
    const h = Math.floor(t / 3600),
      m = Math.floor((t % 3600) / 60),
      s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0');
  };
  /* 3.2.0-beta.6 FIRST-OUT: at the moment a TRIP or a FORCE MANUAL appears, the cause is read at once (AN.why, src/ui/shell/why.js),
     before the plant moves on and other conditions also go 1: the inputs that are 1 at that scan are the first-out */
  const netOf = (S, name) => {
    for (let n = 0; n < S.nets.length; n++) if ((AN.nm(S, n) || '').trim() === name) return n;
    return -1;
  };
  const cause = (sh, name) => {
    try {
      const n = netOf(sh.S, name);
      return n >= 0 && AN.why ? AN.why(sh, n).lines.filter(l => l.d > 0) : null;
    } catch (e) {
      return null;
    }
  };
  function add(S, sh, kind, text, why) {
    LOG.unshift({ t: tfmt(S.rt.t), sh: sh.name, kind, text, why });
    if (LOG.length > MAX) LOG.length = MAX;
    unseen++;
    draw();
  }
  function snapshot(sh) {
    const S = sh.S,
      rt = S.rt,
      o = {};
    try {
      for (const c of AN.hmiCtrls(S) || []) {
        const st = c.amt && rt.st[c.amt.id];
        if (st) {
          const q = c.svSw && rt.st[c.svSw.id];
          o['m:' + c.tag] = st.pk !== c.autoLeg ? 'MAN' : c.remote && q && q.pk === 'A' ? 'REMOTE' : 'AUTO';
        }
        for (const z of c.sigs || []) if (z.role === 'MAN') o['f:' + c.tag + ':' + z.name] = rt.v[z.n] > 0.5 ? 1 : 0;
      }
    } catch (e) {}
    for (const b of S.blk)
      if (b.k === 'ALM' && b.i && b.i[0] >= 0) {
        try {
          o['a:' + b.id] = AN.almLv(b, rt.v[b.i[0]]);
        } catch (e) {}
      }
    S.nets.forEach((x, n) => {
      if (!x.dig) return;
      const nm = AN.nm(S, n);
      if (nm && TRIP.test(nm)) o['t:' + nm] = rt.v[n] > 0.5 ? 1 : 0;
    });
    return o;
  }
  function tick() {
    const sh = window.AN && AN.cat === 'an' && AN.sheets && AN.sheets[AN.i];
    if (!sh || !sh.S || !sh.S.rt) return;
    const S = sh.S;
    const now = snapshot(sh);
    if (sheetK !== sh.name) {
      sheetK = sh.name;
      prev = now;
      return;
    }
    for (const k in now) {
      const a = prev[k],
        b = now[k];
      if (a === undefined || a === b) continue;
      const [kind, ...rest] = k.split(':');
      if (kind === 'm') add(S, sh, 'MODE', rest[0] + ' → ' + b);
      else if (kind === 'f') add(S, sh, 'FM', rest[0] + (b ? ' FORCE MANUAL ← ' : ' force manual cleared ← ') + rest[1] + ' = ' + b, b ? cause(sh, rest[1]) : null);
      else if (kind === 'a') {
        const blk = S.blk.find(z => z.id === +rest[0]),
          nm = (blk && blk.i && AN.nm(S, blk.i[0])) || 'ALM #' + rest[0];
        add(S, sh, b === 'normal' ? 'RTN' : 'ALM', nm + ' ' + (b === 'normal' ? 'back to normal' : b));
      } else if (kind === 't') add(S, sh, b ? 'TRIP' : 'RST', rest.join(':') + ' = ' + b, b ? cause(sh, rest.join(':')) : null);
    }
    prev = now;
  }
  let btn = null,
    box = null;
  function draw() {
    if (btn) {
      btn.textContent = 'Events' + (LOG.length ? ' ' + LOG.length : '');
      btn.classList.toggle('new', unseen > 0 && !(box && box.style.display === 'block'));
    }
    if (!box || box.style.display !== 'block') return;
    box.innerHTML = '';
    const hd = document.createElement('div');
    hd.className = 'evh';
    hd.innerHTML = '<b>Event log</b><span>' + LOG.length + ' (simulation time)</span>';
    const clr = document.createElement('button');
    clr.className = 'b';
    clr.textContent = 'Clear';
    clr.onclick = () => {
      LOG.length = 0;
      unseen = 0;
      draw();
    };
    hd.append(clr);
    box.append(hd);
    if (!(window.WORLD && WORLD.on)) {
      const n = document.createElement('div');
      n.className = 'evr evn';
      n.textContent = 'DITL trips (MFT, fan / pump trips) and their first-out are logged while the ABC and DITL run as one.';
      box.append(n);
    }
    if (!LOG.length) {
      const d = document.createElement('div');
      d.className = 'evr';
      d.textContent = 'No events yet. Press Run: mode changes, force manual, alarms and trips appear here.';
      box.append(d);
    }
    for (const e of LOG) {
      const d = document.createElement('div');
      d.className = 'evr k-' + e.kind;
      d.innerHTML = '<span class="tm"></span><span class="kd"></span><span class="sh"></span><span class="tx"></span>';
      d.children[0].textContent = e.t;
      d.children[1].textContent = e.kind;
      d.children[2].textContent = e.sh;
      d.children[3].textContent = e.text;
      box.append(d);
      if (e.why && e.why.length) {
        /* the cause, captured when it happened (first-out); click the row to show / hide it */
        const w = document.createElement('div');
        w.className = 'evw';
        w.hidden = !e.open;
        for (const l of e.why) {
          const r = document.createElement('div');
          r.className = 'evwr k-' + l.k;
          r.style.paddingLeft = 0.25 + (l.d - 1) * 0.75 + 'rem';
          r.textContent = l.txt + (l.sh && l.sh !== e.sh ? '  [' + l.sh + ']' : '');
          w.append(r);
        }
        const tg = document.createElement('span');
        tg.className = 'evwhy';
        tg.textContent = e.open ? 'cause ▾' : 'cause ▸';
        d.children[3].append(' ', tg);
        d.classList.add('hasw');
        d.onclick = () => {
          e.open = !e.open;
          draw();
        };
        box.append(w);
      }
    }
  }
  function mount() {
    const foot = $('sfoot');
    if (!foot || btn) return !!btn;
    btn = document.createElement('button');
    btn.id = 'evbtn';
    btn.className = 'b an-only';
    btn.title = 'Event log: mode, force manual, alarm, trip (simulation time)';
    box = document.createElement('div');
    box.id = 'evbox';
    btn.onclick = e => {
      e.stopPropagation();
      box.style.display = box.style.display === 'block' ? 'none' : 'block';
      unseen = 0;
      draw();
    };
    const st = $('st');
    foot.insertBefore(btn, st);
    document.body.append(box);
    draw();
    return true;
  }
  const iv = setInterval(() => {
    try {
      if (mount()) clearInterval(iv);
    } catch (e) {}
  }, 500);
  setInterval(() => {
    try {
      tick();
    } catch (e) {}
  }, 500);
  window.lsEvents = LOG;
  /* 3.2.0-beta.6: an event from outside the ABC sheet on screen (the DITL first-out of the one world) */
  window.lsEventAdd = (shName, kind, text, why) => {
    const cs = window.AN && AN.sheets && AN.sheets[AN.i];
    add(cs && cs.S && cs.S.rt ? cs.S : { rt: { t: 0 } }, { name: shName }, kind, text, why);
  };
})();
