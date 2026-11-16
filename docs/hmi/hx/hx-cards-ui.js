/* HX mini pop-ups: the two faceplates of every equipment, in the HX design (user 2026-11-17: "meron yan mini popup for operator
   control and permissives? may originality dapat ha"; user 2026-10-30: "mini pop out sya sa bawat equipment ... popout for
   controls and permissive based sa SOP at sa logic").
     CONTROL card      a click on the equipment: state, where it is operated (Remote / Local), who decides (Auto / Manual),
                       the commands with a confirm step; for a loop: measured, set point, output, mode.
     PERMISSIVE card   the Y / N square: permissive rows (what must be true, what it is now), what the logic of the equipment
                       reads, monitor values and a 15 minute trend.
   Both stay TETHERED: a thin line joins each card to its equipment on the drawing, also after the card is dragged, so several
   cards can be open at once without doubt about what they belong to.
   Everything shown and every press goes through the adapter:
     HX.data.card(kind, id) -> { name, tag, sheet, state, pct, field: ['Remote','Local'] | null, fieldNow, am: ['Auto','Manual'] | null,
                                 amNow, cmds: ['open','stop','close'] | ['start','stop'], perms: [{ t, need, is, ref }],
                                 reads: [{ t, is, ref }], mon: [{ t, is | v, ref }], trend: [[label, key, unit, dp]],
                                 // a loop: pv, sv, mv, unit, lo, hi, modes: ['Remote','Auto','Manual'], mode, svFree, note }
     HX.data.act(kind, id, command, value)   command: open | stop | close | start | field | am | mode | sv | mv
   If the adapter has no card(), a click falls back to HX.data.open() (the app's own faceplates). */
(function () {
  'use strict';
  const HX = window.HX,
    esc = s =>
      String(s == null ? '' : s).replace(
        /[&<>"]/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
      );
  const f1 = (v, dp) => (v == null || !isFinite(v) ? '-----' : (+v).toFixed(dp == null ? 1 : dp));
  const open = new Map(); /* key 'kind:id:face' -> { el, anchor, kind, id, second, armed, moved } */
  let wire = null,
    z = 30;
  const SVGNS = 'http://www.w3.org/2000/svg';
  function wires() {
    if (!wire) {
      wire = document.createElementNS(SVGNS, 'svg');
      wire.setAttribute('class', 'hxc-wires');
      document.body.append(wire);
    }
    let s = '';
    for (const c of open.values()) {
      const a = c.anchor && c.anchor.isConnected ? spot(c.anchor) : null;
      if (!a || !a.width) continue;
      const r = c.el.getBoundingClientRect(),
        ax = a.left + a.width / 2,
        ay = a.top + a.height / 2,
        bx = Math.max(r.left, Math.min(ax, r.right)),
        by = Math.max(r.top, Math.min(ay, r.bottom));
      if (ax > r.left && ax < r.right && ay > r.top && ay < r.bottom) continue;
      s += `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(Math.max(a.width, a.height) / 2 + 5).toFixed(1)}"/>`;
    }
    wire.innerHTML = s;
  }
  /* the equipment itself (its symbol), not the words around it */
  const spot = n => (n.querySelector('.hx-hit') || n).getBoundingClientRect();
  const stCls = s =>
    s === 'open' || s === 'run' ? 'run' : s === 'closed' || s === 'stop' ? 'stop' : s === 'trip' ? 'trip' : 'none';
  const stTxt = s =>
    ({ open: 'Open', closed: 'Closed', run: 'Running', stop: 'Stopped', trip: 'Tripped' })[s] || '-----';
  const seg = (name, list, now, off) =>
    `<div class="hxc-seg" role="group" aria-label="${esc(name)}">${list.map(x => `<button data-act="${name}" data-val="${esc(x)}" aria-pressed="${x === now}"${off ? ' disabled' : ''}>${esc(x)}</button>`).join('')}</div>`;
  const yn = ok =>
    `<span class="hx-ynb ${ok == null ? '' : ok ? 'y' : 'n'}">${ok == null ? '-' : ok ? 'Y' : 'N'}</span>`;
  const permOk = d => (d.perms && d.perms.length ? d.perms.every(p => p.is === p.need) : d.perms ? true : null);

  function bodyControl(c, d) {
    const k = c.kind;
    if (k === 'loop') {
      const span = d.hi - d.lo || 1,
        pos = v => Math.max(0, Math.min(100, ((v - d.lo) / span) * 100)),
        man = /man/i.test(d.mode || ''),
        aut = /aut/i.test(d.mode || '');
      return (
        `<div class="hxc-big"><span>Measured</span><b>${f1(d.pv, d.dp)}</b><i>${esc(d.unit || '')}</i></div>` +
        (d.lo != null && d.hi != null
          ? `<div class="hxc-scale" title="range ${d.lo} to ${d.hi}"><u style="width:${d.pv == null ? 0 : pos(d.pv)}%"></u>${d.sv == null ? '' : `<s style="left:${pos(d.sv)}%"></s>`}</div><div class="hxc-ends"><span>${d.lo}</span><span>set point ${f1(d.sv, d.dp)}</span><span>${d.hi}</span></div>`
          : '') +
        `<div class="hxc-row"><span>Set point</span><b>${f1(d.sv, d.dp)} <i>${esc(d.unit || '')}</i></b><span class="hxc-nud"><button data-act="sv" data-val="-1" ${aut && d.svFree ? '' : 'disabled'} aria-label="Set point down">▼</button><button data-act="sv" data-val="1" ${aut && d.svFree ? '' : 'disabled'} aria-label="Set point up">▲</button></span></div>` +
        `<div class="hxc-row"><span>Output</span><b>${f1(d.mv)} <i>%</i></b><span class="hxc-nud"><button data-act="mv" data-val="-5" ${man ? '' : 'disabled'} aria-label="Output down 5">▼▼</button><button data-act="mv" data-val="-1" ${man ? '' : 'disabled'} aria-label="Output down 1">▼</button><button data-act="mv" data-val="1" ${man ? '' : 'disabled'} aria-label="Output up 1">▲</button><button data-act="mv" data-val="5" ${man ? '' : 'disabled'} aria-label="Output up 5">▲▲</button></span></div>` +
        `<div class="hxc-bar"><u style="width:${Math.max(0, Math.min(100, d.mv || 0))}%"></u></div>` +
        `<div class="hxc-lab">Mode</div>${
          (d.modes || []).length > 1
            ? seg(
                'mode',
                d.modes,
                d.modes.find(m => new RegExp('^' + m.slice(0, 3), 'i').test(d.mode || '')),
                false
              )
            : `<div class="hxc-note">Manual station: the operator sets the output.</div>`
        }` +
        (d.note ? `<div class="hxc-note">${esc(d.note)}</div>` : '') +
        `<div class="hxc-hint">${man ? 'Manual: the output buttons are open.' : aut && d.svFree ? 'Auto: the set point buttons are open.' : aut ? 'Auto: the set point comes from the logic.' : 'Remote: set point and output come from the logic.'}</div>`
      );
    }
    const ok = permOk(d),
      local = d.fieldNow === 'Local',
      why = local
        ? 'The field selector is on Local: the commands of the screen are closed.'
        : ok === false
          ? 'Permissive not complete: see the Y / N card.'
          : '';
    let h = `<div class="hxc-big"><span>State</span><b class="${stCls(d.state)}">${stTxt(d.state)}</b>${d.pct == null ? '' : `<i>${f1(d.pct, 0)} %</i>`}</div>`;
    if (d.pct != null)
      h += `<div class="hxc-bar ${stCls(d.state)}"><u style="width:${Math.max(0, Math.min(100, d.pct))}%"></u></div>`;
    if (d.field) h += `<div class="hxc-lab">Operated from</div>${seg('field', d.field, d.fieldNow, false)}`;
    if (d.am) h += `<div class="hxc-lab">Decided by</div>${seg('am', d.am, d.amNow, local)}`;
    h += `<div class="hxc-lab">Command</div>`;
    if (c.armed)
      h += `<div class="hxc-arm"><span>${esc(c.armed[0].toUpperCase() + c.armed.slice(1))} ${esc(d.tag)}?</span><button class="go" data-act="confirm">Confirm</button><button data-act="cancel">Cancel</button></div>`;
    else
      h += `<div class="hxc-cmd">${(d.cmds || []).map(x => `<button data-act="arm" data-val="${x}"${local || ok === false ? ' disabled' : ''}>${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>`;
    if (why) h += `<div class="hxc-hint w">${why}</div>`;
    return h;
  }
  function rows(title, list, withNeed) {
    if (!list || !list.length) return '';
    return (
      `<div class="hxc-lab">${title}</div><ul class="hxc-rows">` +
      list
        .map(p => {
          const ok = withNeed ? p.is === p.need : !!p.is;
          return `<li>${withNeed ? yn(ok) : `<span class="hxc-bit ${p.is ? 'on' : ''}">${p.v != null ? '' : p.is ? '1' : '0'}</span>`}<span><b>${esc(p.t)}</b><small>${esc(p.ref || '')}${withNeed ? ` · must be ${p.need}, is ${p.is}` : ''}</small></span></li>`;
        })
        .join('') +
      '</ul>'
    );
  }
  function bodySecond(c, d) {
    const ok = permOk(d);
    let h = '';
    if (c.kind !== 'loop')
      h +=
        d.perms && d.perms.length
          ? `<div class="hxc-sum">${yn(ok)}<span>${ok ? 'Permissive complete' : 'Permissive NOT complete'} · ${d.perms.filter(p => p.is === p.need).length} of ${d.perms.length}</span></div>` +
            rows('Permissive', d.perms, true)
          : `<div class="hxc-sum">${yn(ok)}<span>The logic of this valve has no permissive row.</span></div>`;
    h += rows('What its logic reads', d.reads, false);
    h += rows('Monitor', d.mon, false);
    if (c.kind === 'loop')
      h += `<div class="hxc-note">The conditions that force this loop to manual are not in the mockup data; in the app they come from its logic sheet.</div>`;
    if (d.trend && d.trend.length)
      h += `<div class="hxc-lab">Trend · 15 minutes</div><svg class="hxc-trend" viewBox="0 0 240 70" preserveAspectRatio="none"></svg><div class="hxc-pens">${d.trend.map((p, i) => `<span><i style="background:var(--hx-pen${(i % 6) + 1})"></i>${esc(p[0])} <b data-pen="${i}"></b></span>`).join('')}</div>`;
    return h;
  }
  function paintTrend(c, d) {
    const sv = c.el.querySelector('.hxc-trend');
    if (!sv || !d.trend) return;
    const now = HX.data.time(),
      span = 900;
    let s = '<line class="hx-grid" x1="0" x2="240" y1="35" y2="35" vector-effect="non-scaling-stroke"/>';
    d.trend.forEach((p, i) => {
      const b = HX.rec.watch(p[1]);
      let a = Infinity,
        zz = -Infinity;
      for (const [t, v] of b) if (now - t <= span && v != null) ((a = Math.min(a, v)), (zz = Math.max(zz, v)));
      if (!isFinite(a)) return;
      const pad = Math.max((zz - a) * 0.3, Math.abs(zz) * 0.01, 0.5),
        lo = a - pad,
        hi = zz + pad;
      let dd = '';
      for (const [t, v] of b) {
        if (now - t > span || v == null) continue;
        dd +=
          (dd ? 'L' : 'M') +
          (240 - ((now - t) / span) * 240).toFixed(1) +
          ' ' +
          (66 - ((v - lo) / (hi - lo)) * 62).toFixed(1);
      }
      if (dd)
        s += `<path d="${dd}" fill="none" style="stroke:var(--hx-pen${(i % 6) + 1})" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
      const o = c.el.querySelector(`[data-pen="${i}"]`),
        cur = b.length ? b[b.length - 1][1] : null;
      if (o) o.textContent = f1(cur, p[3]) + ' ' + (p[2] || '');
    });
    sv.innerHTML = s;
  }
  function draw(c) {
    const d = HX.data.card(c.kind, c.id);
    if (!d) return;
    /* the name the page gives the equipment; the name of the logic goes to the small line */
    if (c.name && c.name !== d.name) {
      d.tag = d.tag + (c.kind === 'loop' ? '' : ' · ' + d.name);
      d.name = c.name;
    }
    const ok = c.kind === 'loop' ? null : permOk(d);
    const head = `<header><span class="hxc-dot ${c.kind === 'loop' ? (/man/i.test(d.mode || '') ? 'man' : 'none') : stCls(d.state)}"></span><div><b>${esc(d.name)}</b><small>${esc(d.tag)}${d.sheet ? ' · ' + esc(d.sheet) : ''}</small></div><button class="hxc-x" data-act="close" aria-label="Close">×</button></header>`;
    const foot = c.second
      ? `<footer><button data-act="first">‹ Control</button><button data-act="logic">Logic sheet ${esc((d.sheet || '').split(' ')[0])}</button></footer>`
      : c.kind === 'loop'
        ? `<footer><button data-act="second">Trend and monitor ›</button></footer>`
        : `<footer><button data-act="second" class="hxc-yn">${yn(ok)}<span>Permissive, trend, monitor ›</span></button></footer>`;
    const sig =
      (c.second ? 'S' : 'C') +
      JSON.stringify([
        d.state,
        d.pct && Math.round(d.pct),
        d.fieldNow,
        d.amNow,
        d.mode,
        c.armed,
        d.pv && +d.pv.toFixed(1),
        d.sv,
        d.mv && +d.mv.toFixed(1),
        (d.perms || []).map(p => p.is),
        (d.reads || []).map(p => p.is),
        (d.mon || []).map(p => p.is)
      ]);
    if (sig !== c.sig) {
      c.sig = sig;
      c.el.querySelector('.hxc-in').innerHTML =
        head + `<div class="hxc-body">${c.second ? bodySecond(c, d) : bodyControl(c, d)}</div>` + foot;
      c.el
        .querySelector('.hxc-in')
        .setAttribute('aria-label', (c.second ? 'Permissive, trend, monitor: ' : 'Control: ') + d.name);
    }
    if (c.second) paintTrend(c, d);
  }
  function place(c) {
    const a = c.anchor && spot(c.anchor),
      w = c.el.offsetWidth,
      h = c.el.offsetHeight,
      vw = innerWidth,
      vh = innerHeight,
      fit = (x, y) => {
        c.el.style.left = Math.max(8, Math.min(vw - w - 8, x)) + 'px';
        c.el.style.top = Math.max(8, Math.min(vh - h - 8, y)) + 'px';
      };
    if (vw < 560 || !a) return fit((vw - w) / 2, vh - h - 12);
    /* the second card stands beside the first one when that is open */
    const first = c.second && open.get(c.kind + ':' + c.id + ':1');
    if (first) {
      const r = first.el.getBoundingClientRect();
      return fit(r.left - w - 10 >= 8 ? r.left - w - 10 : r.right + 10, r.top);
    }
    const right = a.right + 30 + w <= vw - 8;
    fit(right ? a.right + 30 : a.left - 30 - w, a.top + a.height / 2 - Math.min(h / 3, 120));
  }
  function show(kind, id, second, anchor) {
    const key = kind + ':' + id + ':' + (second ? 2 : 1);
    let c = open.get(key);
    if (c) {
      c.el.style.zIndex = ++z;
      return c;
    }
    const el = document.createElement('div');
    el.className = 'hx hxc' + (second ? ' hxc-2' : '');
    el.style.zIndex = ++z;
    el.innerHTML = '<div class="hxc-in" role="dialog"></div>';
    document.body.append(el);
    c = { el, anchor, kind, id, second: !!second, armed: null, sig: '' };
    open.set(key, c);
    draw(c);
    place(c);
    /* drag by the header */
    el.addEventListener('pointerdown', e => {
      el.style.zIndex = ++z;
      if (!e.target.closest('header') || e.target.closest('button')) return;
      const r = el.getBoundingClientRect(),
        ox = e.clientX - r.left,
        oy = e.clientY - r.top;
      const mv = ev => {
        el.style.left = Math.max(4, Math.min(innerWidth - 60, ev.clientX - ox)) + 'px';
        el.style.top = Math.max(4, Math.min(innerHeight - 40, ev.clientY - oy)) + 'px';
        wires();
      };
      const up = () => {
        removeEventListener('pointermove', mv);
        removeEventListener('pointerup', up);
      };
      addEventListener('pointermove', mv);
      addEventListener('pointerup', up);
      e.preventDefault();
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const a = b.dataset.act,
        v = b.dataset.val;
      if (a === 'close') return close(key);
      if (a === 'second') return void twin(show(kind, id, true, anchor), c);
      if (a === 'first') return void twin(show(kind, id, false, anchor), c);
      if (a === 'logic') return void (HX.data.open && HX.data.open('logic', id, false));
      if (a === 'arm') c.armed = v;
      else if (a === 'cancel') c.armed = null;
      else if (a === 'confirm') {
        HX.data.act(kind, id, c.armed);
        c.armed = null;
      } else HX.data.act(kind, id, a, v);
      draw(c);
    });
    wires();
    return c;
  }
  /* the other card of the same equipment carries the same name */
  function twin(c2, c) {
    if (c.name && c2.name !== c.name) {
      c2.name = c.name;
      c2.sig = '';
      draw(c2);
    }
  }
  function close(key) {
    const c = open.get(key);
    if (!c) return;
    c.el.remove();
    open.delete(key);
    wires();
  }
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !open.size) return;
    close([...open.keys()].pop());
  });
  addEventListener('scroll', wires, true);
  addEventListener('resize', wires);
  setInterval(() => {
    if (!open.size) return;
    for (const [k, c] of open) {
      if (!c.anchor || !c.anchor.isConnected) {
        close(k);
        continue;
      }
      draw(c);
    }
    wires();
  }, 1000);
  /* the pages call this for every click on an equipment or on its Y / N square */
  HX.card = function (kind, id, second, anchor, name) {
    if (!HX.data.card || !HX.data.card(kind, id)) return HX.data.open(kind, id, second);
    const c = show(kind, id, second, anchor);
    if (name && c.name !== name) {
      c.name = name;
      c.sig = '';
      draw(c);
    }
  };
  HX.closeCards = () => [...open.keys()].forEach(close);
})();
