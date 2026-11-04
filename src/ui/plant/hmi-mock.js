/* 3.2.1 (user 2026-11-04 "Yan ang ilagay sa app, yan ang iloloop check"): the 19 temporary HMI pages of the approved mockups
   (JISOO : HMI MOCKUP, audited by HAEWON; sources in docs/hmi/mockups/temp/) in the app, drawn EXACTLY as the mockup: the SVG of the
   mockup is kept as it is and only gets live hooks (tools/hmi-mock/*.py). This file is the one runtime of those pages:
   - [data-st=ID]   run state of a machine: RUNNING red / STOPPED green / TRIP red blinking (LS_DOCK.mst, the one world);
   - [data-md=ID]   "Remote · Manual": REMOTE / LOCAL and AUTO / MAN of the machine (LS_DOCK.modeOf);
   - [data-vcb=ID]  "Breaker ON / OFF" (shown closed while the motor runs, as 030 SEAWATER);
   - [data-v=TAG]   a value: the logic transmitter when a sheet has it, else the plant model (UNIT.key of def.unit); '-----' = none;
   - [data-do="DITL-xx|row|on text|off text|run|alarm"] a DITL output row (DUI.outVal): its text and colour;
   - [data-ns]      NO-SOURCE in the app (no signal and no plant model): '-----' grey, never a snapshot number;
   - [data-ynr / data-ynt=ID] the permissive Y / N square (LS_FPOP.yn: Y red = complete, N green = not);
   - [data-hit=ID]  click = the CONTROL faceplate (fp-pop.js), [data-yn=ID] click = PERMISSIVE · TREND · MONITOR;
   - <g><title>V-xx... the field valves of the plant model: the FIELD faceplate of fp-pop.js (its own document click handler).
   Nothing here presses or forces anything: the faceplates do, the same ones the loop check dock watches. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = { run: '#ff6b6b', stop: '#4fd06a', none: '#6b7480', val: '#ffffff', dim: '#a9b0b7', bg: '#1b1e21' };
  const call = (f, d) => {
    try {
      const r = f();
      return r == null ? d : r;
    } catch (e) {
      return d;
    }
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const D = () => window.LS_DOCK;
  /* def = { id, title, num, name, w, h, art, mach: { ID: { n, t, ad, io, d, cur, band, fld, df, lcp, vcb } }, unit: { TAG: key }, after } */
  function page(def) {
    return function (g, api) {
      const W = 1920,
        top = 54,
        bot = 968,
        k = Math.min(W / def.w, (bot - top) / def.h),
        x0 = (W - def.w * k) / 2;
      const bg = document.createElementNS(NS, 'rect');
      for (const [a, v] of Object.entries({ x: 0, y: top, width: W, height: bot - top, fill: C.bg })) bg.setAttribute(a, v);
      g.append(bg);
      const pg = document.createElementNS(NS, 'g');
      pg.setAttribute('transform', `translate(${x0.toFixed(1)} ${top}) scale(${k.toFixed(4)})`);
      pg.setAttribute('class', 'mk');
      pg.setAttribute('font-family', "'IBM Plex Sans',system-ui,sans-serif");
      pg.innerHTML = `<style>.mk .m{font-family:'IBM Plex Mono',ui-monospace,monospace}.mk .s{font-family:'IBM Plex Sans',system-ui,sans-serif}.mk .h2blink{animation:h2blink 1s steps(2,start) infinite}</style>` + def.art;
      g.append(pg);
      const q = s => pg.querySelector(s),
        qa = s => pg.querySelectorAll(s);
      const M = def.mach || {};
      const info = tag => call(() => window.lsInfo && window.lsInfo(tag));
      /* NO-SOURCE */
      qa('[data-ns]').forEach(e => ((e.textContent = '-----'), e.setAttribute('fill', C.none)));
      /* values: the logic first, the plant model when no logic sheet has the transmitter */
      const LOG = {},
        PM = {};
      const cur = tag => (LOG[tag] != null ? LOG[tag] : PM[tag] != null ? PM[tag] : null);
      const showV = tag =>
        qa(`[data-v="${tag}"]`).forEach(t => {
          const v = cur(tag);
          t.textContent = v == null ? '-----' : fmt(v, +t.dataset.dp || 0) + (t.dataset.u || '');
          t.setAttribute('fill', v == null ? C.none : C.val);
        });
      const tags = new Set([...qa('[data-v]')].map(e => e.dataset.v));
      for (const tag of tags) {
        api.reg({ t: 'val', tag, v: '' }, X => ((LOG[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)), null);
        if (def.unit && def.unit[tag]) api.reg({ t: 'val', tag: 'UNIT.' + def.unit[tag], v: '' }, X => ((PM[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)), null);
        showV(tag);
        qa(`[data-v="${tag}"]`).forEach(t => {
          const ti = document.createElementNS(NS, 'title');
          ti.textContent = tag + (def.unit && def.unit[tag] ? ' · logic transmitter, else the plant model' : '') + ' · click = its I/O list line';
          t.append(ti);
          t.style.cursor = 'pointer';
          t.addEventListener('click', e => (e.stopPropagation(), info(tag)));
        });
      }
      /* machines */
      const mst = m => call(() => (m.fld ? (AN.fieldState && AN.fieldState()[m.fld] ? 'RUN' : 'STOP') : m.ad ? D().mst(m.ad) : null), null);
      const ST = {},
        MD = {};
      const tick = () => {
        for (const id in M) {
          const m = M[id],
            s = mst(m);
          if (ST[id] !== s || ST[id] === undefined) {
            ST[id] = s;
            const col = s == null ? C.none : s === 'RUN' || s === 'TRIP' ? C.run : C.stop;
            qa(`[data-st="${id}"]`).forEach(e => {
              e.textContent = s == null ? m.lcp || '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? 'RUNNING' : 'STOPPED';
              e.setAttribute('fill', col);
              e.classList.toggle('h2blink', s === 'TRIP');
            });
            qa(`[data-vcb="${id}"]`).forEach(e => {
              e.textContent = s == null ? 'Breaker -----' : s === 'RUN' ? 'Breaker ON' : 'Breaker OFF';
            });
          }
          if (m.ad && !m.fld) {
            const md = call(() => D().modeOf(m.ad), null),
              key = md ? String(md.rem) + String(md.au) : '';
            if (key !== MD[id]) {
              MD[id] = key;
              qa(`[data-md="${id}"]`).forEach(e => {
                e.textContent = !md
                  ? '-----'
                  : (md.rem == null ? '-----' : md.rem ? 'Remote' : 'Local') + ' · ' + (md.au == null ? '-----' : md.au ? 'Auto' : 'Manual');
              });
            }
            const ok = call(() => (window.LS_FPOP && LS_FPOP.yn ? LS_FPOP.yn(m) : null), null);
            const col = ok == null ? C.none : ok ? C.run : C.stop;
            qa(`[data-ynr="${id}"]`).forEach(e => e.setAttribute('stroke', col));
            qa(`[data-ynt="${id}"]`).forEach(e => ((e.textContent = ok == null ? '-' : ok ? 'Y' : 'N'), e.setAttribute('fill', col)));
          }
        }
        /* DITL output rows (the debris filter IN OPERATION / COMMON FAIL of DITL-39) */
        qa('[data-do]').forEach(e => {
          const [ad, row, on, off, kind] = e.dataset.do.split('|'),
            s = call(() => D().dOf(ad), null),
            v = s ? call(() => DUI.outVal(s, +row), null) : null;
          e.textContent = v == null ? '-----' : v ? on : off;
          e.setAttribute('fill', v == null ? C.none : v ? C.run : kind === 'alarm' ? C.dim : C.stop);
        });
      };
      tick();
      HSYM.every(g, 500, tick);
      /* faceplates: click on the equipment = CONTROL, the Y / N square = PERMISSIVE · TREND · MONITOR (#59) */
      const curOf = m => (m.cur ? () => cur(m.cur) : null);
      const mon = m => m.mon || [];
      const known = m => m.ad && !m.fld && !/@/.test(m.ad) && call(() => D().dOf(m.ad), null);
      const open = (id, part) => {
        const m = M[id];
        if (!m) return;
        if (m.df && window.LS_FPOP && LS_FPOP.pb) {
          const s = call(() => D().dOf(m.d), null),
            perm = (m.df.perm || []).map(r => ({ row: r, l: String(call(() => DUI.rowInfo(s, r).svc, '') || 'row ' + r) }));
          if (LS_FPOP.pb({ n: m.n, t: m.t, d: m.d, io: m.io, st: { row: m.df.st, on: 'IN OPERATION', off: 'STOPPED' }, pbs: m.df.pbs, perm, permWhy: m.df.why, vals: m.df.dp ? [[m.df.dp, () => cur(m.df.dp), 'mmH2O']] : [] }))
            return;
        }
        if (m.fieldOp && window.LS_FPOP && LS_FPOP.field)
          return void LS_FPOP.field({ n: m.n, t: m.t, d: m.d, io: m.io, why: (m.why || '') + (m.fld ? '' : ' This pump has no plant model.'), st: () => (m.fld ? mst(m) : null), fld: m.fld ? on => AN.field(m.fld, on) : null });
        if (known(m) && window.LS_FPOP && LS_FPOP.motor) return void LS_FPOP.motor({ ...m, part, cur: curOf(m), band: m.band || null, mon: mon(m) });
        info(m.io);
      };
      qa('[data-hit]').forEach(h => {
        const id = h.dataset.hit,
          m = M[id];
        if (!m) return;
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = m.n + (m.t ? ' ' + m.t : '') + (m.d ? ' · ' + m.d : '') + ' · click = faceplate';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), open(id, 'control')));
      });
      qa('[data-yn]').forEach(h => {
        const id = h.dataset.yn,
          m = M[id];
        if (!m) return;
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = m.n + ' · permissive, trend and monitor (Y red = complete, N green = not)';
        h.append(ti);
        h.addEventListener('click', e => (e.stopPropagation(), open(id, 'info')));
      });
      /* the loop check / Training dock "Open faceplate" of a motor (fp-pop.js LS_FPOP.openAd) */
      const R = (window.LS_FPREG = window.LS_FPREG || {});
      for (const id in M) {
        const m = M[id];
        if (!m.ad || m.fld) continue;
        const o = { open: () => open(id, 'control'), el: () => q(`[data-hit="${id}"]`), n: m.n, cur: curOf(m) };
        R[m.ad] = o;
        if (m.d) R[m.d] = o;
      }
      return pg;
    };
  }
  /* a page into the Plant view list, before the page it replaces later (def.before) */
  function add(def) {
    PLANT_V2.screens[def.id] = page(def);
    const L = (window.PLANT_SYS = window.PLANT_SYS || []),
      i = def.before ? L.findIndex(x => x.id === def.before) : -1;
    L.splice(i >= 0 ? i : L.length, 0, { fitAll: 1, id: def.id, title: def.title, num: def.num, name: def.name, src: def.src || '', w: 1920, h: 1000, v2: true, screen: def.id, style: 'steel', items: [] });
  }
  window.LS_MOCK = { add, page };
})();
