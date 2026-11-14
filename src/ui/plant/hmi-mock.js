/* 3.2.1 (user 2026-11-04 "Yan ang ilagay sa app, yan ang iloloop check"): the 19 temporary HMI pages of the approved mockups
   (JISOO : HMI MOCKUP, audited by HAEWON; sources in docs/hmi/mockups/temp/) in the app, drawn EXACTLY as the mockup: the SVG of the
   mockup is kept as it is and only gets live hooks (tools/hmi-mock/*.py). This file is the one runtime of those pages:
   - [data-st=ID]   run state of a machine: RUNNING red / STOPPED green / TRIP red blinking (LS_DOCK.mst, the one world); with
                    data-short (the mockup left room for 5 letters only): RUN / STOP / TRIP;
   - [data-md=ID]   "Remote · Manual": REMOTE / LOCAL and AUTO / MAN of the machine (LS_DOCK.modeOf);
   - [data-vcb=ID]  "Breaker ON / OFF" (shown closed while the motor runs, as 030 SEAWATER);
   - [data-v=TAG]   a value: the logic transmitter when a sheet has it, else the plant model (UNIT.key of def.unit); '-----' = none;
                    "SHEET|ADDRESS" = that address of the sheet (page 00: ABC-001C|SI0230 = the compensated main steam flow);
   - [data-do="DITL-xx|row|on text|off text|run|alarm"] a DITL output row (DUI.outVal): its text and colour;
   - def.udi[TAG]   a [data-di] input that no sheet reads: the value of the plant model UNIT.key (3.2.3 sampling alarms);
   - [data-ns]      NO-SOURCE in the app (no signal and no plant model): '-----' grey, never a snapshot number;
   - [data-ynr / data-ynt=ID] the permissive Y / N square (LS_FPOP.yn: Y red = complete, N green = not);
   - [data-hit=ID]  click = the CONTROL faceplate (fp-pop.js), [data-yn=ID] click = PERMISSIVE · TREND · MONITOR;
   - <g><title>V-xx... the field valves of the plant model: the FIELD faceplate of fp-pop.js (its own document click handler);
   - [data-vt=TAG]  a valve tag label of the mockup: when fp-pop.js knows the valve (LS_FPOP.valveTag), click = its faceplate and the
                    nearest valve symbol is the same click, red = open / green = closed for a field valve of the plant model;
   - [data-ox="KEY|open text|closed text"]  open / closed of a valve in the plant model (UNIT.KEY 1 / 0);
   - [data-dsvc="DITL-xx|service text|on text|off text"]  a DITL row found by its service text (AUTO SELECTED ...), shown as text;
   - [data-ctl="TAG|pv|mv|mode|dp|unit"]  a value of a controller of the logic (PV / MV / mode); [data-hit] of a mach with ctl = its faceplate;
   - [data-mov]     a MOV / XV of a DITL sheet ("pct" position %, "oc" OPEN / CLOSED, "md" REMOTE / AUTO mode); mach.mov = its faceplate (LS_FPOP.mov);
   - mach.tcs       a pump of the TCS (tcs.js TCS_OIL): state of AN.unit, click = the TCS faceplate (LS_FPOP.tcs);
   - [data-go=ID]   a "page:" link of the mockup = that page of the Plant view.
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
  /* def = { id, title, num, name, w, h, art, mach: { ID: { n, t, ad, io, d, cur, band, fld, df, lcp, vcb } }, unit: { TAG: key }, after,
     tall, fz, fzAt } */
  /* Mina beta.175 (page 13 TURBINE START, 1600 x 1410: text about 6 px high at Fit with the dock open, 1366 x 768): a TALL page (def.tall)
     gets a frame of its own size (no 1920 x 1000 frame with empty sides: the art at scale 1), opens fitted to the WIDTH from the top
     (plant.js fitW: drag to see the lower part, as 007), and its text grows by def.fz, except the lines of def.fzAt ("x,y" or the column
     "x,*": their own factor, 1 = as drawn; the long notes and lists that would run into the next column) */
  const frameOf = def => (def.tall ? { w: def.w + 32, h: 54 + def.h + 16 + 32 } : { w: 1920, h: 1000 });
  function page(def) {
    return function (g, api) {
      const F = frameOf(def),
        W = F.w,
        top = 54,
        bot = F.h - 32,
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
      if (def.fz) {
        const at = def.fzAt || {};
        pg.querySelectorAll('text[font-size]').forEach(t => {
          const x = t.getAttribute('x'),
            y = t.getAttribute('y'),
            f = at[x + ',' + y] != null ? at[x + ',' + y] : at[x + ',*'] != null ? at[x + ',*'] : def.fz;
          if (f !== 1) t.setAttribute('font-size', String(Math.round(+t.getAttribute('font-size') * f * 10) / 10));
        });
      }
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
        api.reg(/\|/.test(tag) ? { t: 'val', tag, ref: tag, v: '' } : { t: 'val', tag, v: '' }, X => ((LOG[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)), null);
        if (def.unit && def.unit[tag] && !/^(tt|ux):/.test(def.unit[tag])) api.reg({ t: 'val', tag: 'UNIT.' + def.unit[tag], v: '' }, X => ((PM[tag] = X && isFinite(X.v) ? +X.v : null), showV(tag)), null);
        showV(tag);
        qa(`[data-v="${tag}"]`).forEach(t => {
          const ti = document.createElementNS(NS, 'title');
          /* pages 13 / 17: GEN.*, VIST-MAX, TIST-THF / R = a model value only (no I/O list line: the values come from the generator panel, data sheet + snapshot 37) */
          if (/^(GEN.|VIST-MAX$|TIST-TH[FR]$)/.test(tag)) {
            ti.textContent = /^GEN/.test(tag) ? 'generator model (data sheet and control room snapshot 37)' : 'turbine shaft model (shaft monitor snapshot 35)';
            return t.append(ti);
          }
          ti.textContent = tag + (def.unit && def.unit[tag] ? ' · logic transmitter, else the plant model' : '') + ' · click = its I/O list line';
          t.append(ti);
          t.style.cursor = 'pointer';
          t.addEventListener('click', e => (e.stopPropagation(), info(tag)));
        });
      }
      /* page 16: [data-di="TAG|on text|off text"] = a digital input of the I/O list (MIR-Z1107A running, AL2-SP01 alarm): on (red) when
         1, off (green) when 0 (a 4th field "neg" = the NOT of the input), '-----' grey when no sheet of the logic reads it; [data-dir=TAG] = its
         square (red = 1); click = its I/O list line */
      const showDi = (tag, v) => {
        qa('[data-di]').forEach(t => {
          const [tg, on, off, neg] = t.dataset.di.split('|'),
            x = v == null ? null : neg ? 1 - v : v;
          if (tg !== tag) return;
          t.textContent = x == null ? '-----' : x ? on : off;
          t.setAttribute('fill', x == null ? C.none : x ? C.run : C.stop);
        });
        qa(`[data-dir="${tag}"]`).forEach(r => r.setAttribute('stroke', v == null ? C.none : v ? C.run : C.stop));
      };
      new Set([...qa('[data-di]')].map(e => e.dataset.di.split('|')[0])).forEach(tag => {
        /* Mina beta.143 (pages 13 / 17: DS "-----"): a field contact of the I/O list that no sheet of the logic reads shows the field as the
           plant stands while the plant model runs: disconnect switch DS closed (snapshot 37: "52L1, DS, 52G1, field CB closed"), earth
           switch open (a generator on the grid cannot have its earth switch closed). A sheet that reads the contact wins */
        const FIELD_DI = { 'MIG-52G1-3': 1, 'MIG-52G1-4': 0, 'MIG-52G1-5': 0, 'MIG-52G1-6': 1 },
          fieldDi = () => (tag in FIELD_DI && window.AN && AN.unit && AN.unit.on ? FIELD_DI[tag] : null);
        let rd = false,
          um = null;
        /* 3.2.3 (SOHEE): def.udi = a DI that no sheet reads, given by the plant model (UNIT key: sampling alarms, dosing agitator) */
        const ud = def.udi && def.udi[tag];
        if (ud) api.reg({ t: 'val', tag: 'UNIT.' + ud, v: '' }, X => ((um = X && isFinite(X.v) ? (+X.v >= 0.5 ? 1 : 0) : null), !rd && showDi(tag, um)), null);
        api.reg({ t: 'val', tag, v: '' }, X => ((rd = !!(X && isFinite(X.v))), showDi(tag, rd ? (+X.v >= 0.5 ? 1 : 0) : ud ? um : fieldDi())), null);
        if (tag in FIELD_DI) setInterval(() => !rd && qa('[data-di]').length && showDi(tag, fieldDi()), 2000);
        showDi(tag, null);
        qa('[data-di]').forEach(t => {
          if (t.dataset.di.split('|')[0] !== tag) return;
          const ti = document.createElementNS(NS, 'title');
          ti.textContent = tag + ' · digital input · click = its I/O list line';
          t.append(ti);
          t.style.cursor = 'pointer';
          t.addEventListener('click', e => (e.stopPropagation(), info(tag)));
        });
      });
      /* DITL rows by service text, plant model open / closed, controllers, page links, valves */
      const dsvc = (ad, re) =>
        call(() => {
          const s = D().dOf(ad);
          if (!s) return null;
          for (let r = 0; r < 64; r++) {
            const I = DUI.rowInfo(s, r);
            if (!I) continue;
            if (new RegExp(re).test(I.svc || '')) return DUI.rowVal(s, r) === 1 || !!(s.sig && s.sig[r + ':S']);
          }
          return null;
        }, null);
      /* a MOV / XV of a DITL sheet: position (MST of the sheet; a sheet with two valves: its FULLY OPEN / CLOSED outputs of the tag),
         REMOTE / AUTO, the CRT push buttons of its input rows (OPEN, CLOSE, STOP, AUTO, ISOLATE, REINSTATE ...) */
      const movInfo = (nm, tg) =>
        call(() => {
          const s = D().dOf(nm);
          if (!s) return null;
          /* live run 2026-11-13 F6: "~PHRASE" = a valve named by its words on a sheet with two valves and no XV tag in the row text
             (DITL-28C "FAB A TO SILENCE SOV ..." / "FAB A OUTLET SOV ..."): its rows hold the phrase, its position is its OPENED output */
          const ph = tg && tg[0] === '~' ? tg.slice(1) : null,
            ms = (typeof MST !== 'undefined' && MST[s.name]) || [],
            own = ph ? t => t.indexOf(ph) >= 0 : t => !tg || !/(?:XV|MV)-[A-Z]{2}\d{4}/.test(t) || t.indexOf(tg) >= 0;
          let pos = !ph && ms.length === 1 && ms[0].pos != null ? +ms[0].pos : null;
          const outs = DUI.outs(s) || [];
          if (ph) {
            const o = outs.find(x => own(x.name) && /\bOPENED\b/.test(x.name)),
              vo = o ? D().dout(nm, o.row) : null;
            pos = vo === 1 ? 100 : vo === 0 ? 0 : null;
          }
          if (pos == null && !ph) {
            const o = outs.find(x => own(x.name) && /FULLY OPEN/.test(x.name)),
              c = outs.find(x => own(x.name) && /FULLY CLOSED/.test(x.name)),
              vo = o ? D().dout(nm, o.row) : null,
              vc = c ? D().dout(nm, c.row) : null;
            pos = vo === 1 && vc !== 1 ? 100 : vc === 1 ? 0 : vo == null && vc == null ? null : 50;
          }
          const pbs = [],
            ri = (re, any) => {
              for (let r = 0; r < 64; r++) {
                const I = DUI.rowInfo(s, r);
                if (I && re.test(I.svc || '') && own(I.svc || '')) return any ? r : DUI.rowVal(s, r) ? 1 : 0;
              }
              return null;
            };
          for (let r = 0; r < 64; r++) {
            const I = DUI.rowInfo(s, r),
              t = (I && I.svc) || '';
            if (!/P\.?B\b/.test(t) || /LOCAL/.test(t) || !own(t)) continue;
            /* the word just before "PB" (DITL-54 "START-UP EJECTOR ... MOV OPEN PB" = OPEN, not START), else the last command word
               ("ISOLATE HTR #1 PB") */
            const W = /(OPEN|CLOSED?|STOP|AUTO|MANUAL|ISOLATE|REINSTATE|START|RESET)(?![-\w])/g,
              w = /(OPEN|CLOSED?|STOP|AUTO|MANUAL|ISOLATE|REINSTATE|START|RESET)\s+P\.?B\b/.exec(t) || [...t.matchAll(W)].pop(),
              l = w && (w[1] === 'CLOSED' ? 'CLOSE' : w[1]);
            if (l && !pbs.some(p => p.l === l)) pbs.push({ l, row: r });
          }
          /* Mina F29: the AUTO PB of these drawings is a maintained bit, not a pulse: one address on the AUTO PB, AUTO MODE SELECTED and (with a
             minus) MANUAL MODE SELECTED rows (DITL-94 rows 1, 21, 6 M.0283, DITL-99 ~ 110, DITL-52 ~ 57, DITL-62 ~ 68, DITL-73 / 80 / 88). The
             operator had no way to MANUAL: the CRT selection is AUTO / MANUAL on that row */
          const auV = ri(/AUTO (?:MODE )?SELECTED\b|AUTO MODE\b/),
            ap = pbs.find(p => p.l === 'AUTO');
          if (ap && auV != null && !pbs.some(p => p.l === 'MANUAL')) {
            ap.sel = 1;
            pbs.push({ l: 'MANUAL', row: ap.row, sel: 0 });
          }
          /* F6: DITL-28C has no AUTO PB; its "AUTO MODE SELECTED" row is an operator memory bit (M.1032 / M.1052): the CRT AUTO / MANUAL */
          if (ph && !ap && auV != null) {
            const ar = ri(/AUTO (?:MODE )?SELECTED\b/, true),
              AI = ar != null ? DUI.rowInfo(s, ar) : null;
            if (AI && /^M\./.test(AI.tag || '')) pbs.unshift({ l: 'AUTO', row: ar, sel: 1 }, { l: 'MANUAL', row: ar, sel: 0 });
          }
          /* REMOTE: "REMOTE SELECTED" (DITL-60 ...), "MCV REMOTE MODE SELECTED" (DITL-38), "SHUT-OFF MOV REMOTE" (DITL-94 ~ 98) */
          const ro = outs.find(x => own(x.name) && /\bREMOTE\b/.test(x.name) && !/LOCAL/.test(x.name));
          return { pos, pbs, au: auV, rem: ro ? D().dout(nm, ro.row) : null };
        }, null);
      const OX = {};
      new Set([...qa('[data-ox]')].map(e => e.dataset.ox.split('|')[0])).forEach(k => {
        const show = () =>
          qa(`[data-ox^="${k}|"]`).forEach(e => {
            const [, on, off] = e.dataset.ox.split('|'),
              v = OX[k];
            e.textContent = v == null ? '-----' : v ? on : off;
            e.setAttribute('fill', v == null ? C.none : v ? C.run : C.stop);
          });
        api.reg({ t: 'val', tag: 'UNIT.' + k, v: '' }, X => ((OX[k] = X && isFinite(X.v) ? (+X.v > 0 ? 1 : 0) : null), show()), null);
        show();
      });
      const CT = {};
      /* page 11: a controller with a faceplate click but no value hook on the page (FICDO1043A: the page shows the ZT position) */
      new Set([...qa('[data-ctl]')].map(e => e.dataset.ctl.split('|')[0]).concat(Object.values(M).map(m => m.ctl).filter(Boolean))).forEach(tag => {
        const show = () =>
          qa(`[data-ctl^="${tag}|"]`).forEach(e => {
            const [, what, dp, u] = e.dataset.ctl.split('|'),
              X = CT[tag];
            if (what === 'mode') {
              const m = X ? X.m : '';
              e.textContent = m === 'M' ? 'Manual' : m === 'A' ? 'Auto' : m === 'R' ? 'Remote' : '-----';
              if (dp === 'U') e.textContent = e.textContent.toUpperCase();
              e.setAttribute('fill', X ? C.dim : C.none);
            } else {
              const v = X ? X[what] : null;
              e.textContent = v == null || !isFinite(v) ? '-----' : fmt(v, +dp || 0) + (u || '');
              e.setAttribute('fill', v == null || !isFinite(v) ? C.none : C.val);
            }
          });
        const hits = [...qa('[data-hit]')].filter(h => M[h.dataset.hit] && M[h.dataset.hit].ctl === tag),
          hit = hits[0] || null;
        api.reg({ t: 'ctl', tag }, X => ((CT[tag] = X || null), show()), hit);
        /* live test 2026-11-05 (AIR AND FLUE GAS: MCV-FA1053-1 = FICFA1071 too, its label opened nothing): every other label of the same
           controller opens the faceplate of the first one */
        hits.slice(1).forEach(h => h.addEventListener('click', e => (e.stopPropagation(), hit.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: e.clientX, clientY: e.clientY })))));
        show();
      });
      /* e6 (user G 2026-11-08, mockup 13-turbine-protection-v1): page 13 TCS push buttons [data-tpb=cmd]: ATS SHUT-DOWN / HOLD OFF (tcs.js
         step 8, 310SC90-775 p.29) and TURBINE TRIP / RESET (IBD 310SC90-794 TA-1). RUN only: VIEW does not control */
      qa('[data-tpb]').forEach(e => {
        e.style.cursor = 'pointer';
        /* Mina beta.121: the push button frame has no fill, so a click inside it hit nothing: the whole button takes the click */
        e.style.pointerEvents = 'all';
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = 'TCS push button · click = press (RUN)';
        e.append(ti);
        e.addEventListener('click', ev => {
          ev.stopPropagation();
          const view = document.body.classList.contains('an') ? !!(window.AN && AN.view && !AN.run) : call(() => !SIM, false);
          const cmd = e.dataset.tpb,
            nm = { shutdown: 'SHUT-DOWN', holdoff: 'HOLD OFF', trip: 'TURBINE TRIP', tripreset: 'TURBINE RESET' }[cmd] || cmd;
          if (view) {
            /* VIEW: the label says why nothing happened, for 2 s */
            qa(`text[data-tpb="${cmd}"]`).forEach(t => {
              const o = t.textContent;
              t.textContent = 'VIEW: press RUN';
              setTimeout(() => (t.textContent = o), 2000);
            });
            return;
          }
          /* the press is logged first: a TURBINE TRIP brings its trip and MFT lines in the same scan (Mina: the press line was missing) */
          call(() => window.lsEventAdd && lsEventAdd('TCS', 'TCS', 'Operator: ' + nm + ' (page 13)'));
          /* a refused command: its reason is written by the engine (unit.js anTurbine, S149-3); here the status bar only */
          const r = call(() => AN.turbine(cmd), '');
          if (typeof r === 'string' && r) call(() => typeof msg === 'function' && msg('TCS: ' + nm + ': ' + r));
          /* Mina T3, 3.2.3-beta.1: a reset that the logic refuses said nothing. 2.5 s after the press (the push button is held 1.5 s),
             a trip still standing gets a line with what holds it (the TA-9 trip inputs at 1, tcs-trip.js tcsTripState held) */
          if (cmd === 'tripreset')
            setTimeout(() => {
              const s = call(() => AN.tcsTrip(), null);
              if (!s || !s.first) return;
              const h = (s.held || []).filter(Boolean);
              const t = 'TURBINE RESET refused: the trip is still held by ' + (h.length ? h.join(', ') : 'a trip input of the TCS (IBD TA-9)');
              /* the event line is the engine's (tcs-trip.js, end of the push button): here only the message */
              call(() => typeof msg === 'function' && msg(t));
            }, 2500);
        });
      });
      qa('[data-go]').forEach(e => {
        e.style.cursor = 'pointer';
        const ti = document.createElementNS(NS, 'title');
        ti.textContent = 'click = open this page';
        e.append(ti);
        e.addEventListener('click', ev => {
          ev.stopPropagation();
          const pk = document.querySelector('#plantws .plpick');
          if (pk && [...pk.options].some(o => o.value === e.dataset.go)) {
            pk.value = e.dataset.go;
            pk.dispatchEvent(new Event('change'));
          }
        });
      });
      /* valves: the label and the nearest valve symbol (bowtie path) open the faceplate fp-pop.js knows for the tag */
      const bows = [...pg.querySelectorAll('path')]
        .map(p => {
          const n = (p.getAttribute('d') || '').match(/^M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+) Z$/);
          return n
            ? { p, x: (+n[1] + +n[3]) / 2, y: (+n[2] + +n[4]) / 2, x0: Math.min(+n[1], +n[3]), y0: Math.min(+n[2], +n[4]), x1: Math.max(+n[1], +n[3]), y1: Math.max(+n[2], +n[4]), used: 0 }
            : null;
        })
        .filter(Boolean);
      const VT = [];
      qa('[data-vt]').forEach(e => {
        const tag = e.dataset.vt,
          kind = call(() => (LS_FPOP.valveKind ? LS_FPOP.valveKind(tag) : null), null);
        if (!kind) return;
        const x = +e.getAttribute('x'),
          y = +e.getAttribute('y') - 4,
          w = (e.textContent.length || 8) * 6.6,
          a = e.getAttribute('text-anchor'),
          xl = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x,
          xr = xl + w;
        let best = null,
          bd = 1e9;
        for (const b of bows) {
          const d = Math.hypot(b.x < xl ? xl - b.x : b.x > xr ? b.x - xr : 0, b.y - y);
          if (!b.used && d < bd) (bd = d), (best = b);
        }
        const sym = best && bd < 40 ? ((best.used = 1), best.p) : null;
        const go = ev => (ev.stopPropagation(), call(() => LS_FPOP.valveTag(tag)));
        /* sweep item 7 (Mina 11-07, FEEDWATER V-FW1011): a real mouse click on the valve symbol missed, a dispatched click opened it. The
           bowtie is two small triangles that meet at one point in the middle, where the pipe runs: the middle (where a click lands) has
           almost nothing to hit. A clear box over the whole symbol, on top of the page, takes the click */
        let hb = null;
        if (sym) {
          hb = document.createElementNS(NS, 'rect');
          for (const [k, v] of Object.entries({ x: best.x0 - 4, y: best.y0 - 4, width: best.x1 - best.x0 + 8, height: best.y1 - best.y0 + 8, fill: 'transparent', stroke: 'none', 'data-vth': tag }))
            hb.setAttribute(k, v);
          hb.style.pointerEvents = 'all';
          pg.append(hb);
        }
        for (const el of sym ? [e, sym, hb] : [e]) {
          el.style.cursor = 'pointer';
          el.style.pointerEvents = 'auto';
          const ti = document.createElementNS(NS, 'title');
          ti.textContent = tag + (kind === 'field' ? ' · field valve of the plant model' : ' · valve of the logic') + ' (red = open, green = closed) · click = faceplate';
          el.append(ti);
          el.addEventListener('click', go);
        }
        VT.push({ tag, kind, sym });
      });
      /* machines */
      /* run state: field equipment of the model (fld), DITL input rows (sti: [sheet, running row, trip row], a local panel start),
         a DITL output row (sto: [sheet, row]), else the motor of LS_DOCK */
      const rin = (ad, row) =>
        call(() => {
          const s = D().dOf(ad);
          return s ? (DUI.rowVal(s, row) ? 1 : 0) : null;
        }, null);
      const rout = (ad, row) => call(() => D().dout(ad, row), null);
      const mst = m =>
        call(() => {
          if (m.fld) return AN.fieldState && AN.fieldState()[m.fld] ? 'RUN' : 'STOP';
          if (m.sti) {
            const r = rin(m.sti[0], m.sti[1]),
              t = m.sti[2] != null ? rin(m.sti[0], m.sti[2]) : 0;
            return r == null ? null : t ? 'TRIP' : r ? 'RUN' : 'STOP';
          }
          if (m.tcs) {
            const U = AN.unit;
            /* F36 (live Cold start 2026-11-14): the gland steam seal of the TCS (tcs.js 'gland'), in service = RUN */
            if (m.tcs === 'gland') return U && U.on && U.tc ? (U.tc.gland ? 'RUN' : 'STOP') : null;
            /* live Cold start 2026-11-14 (3.2.3-beta.234): the LP exhaust hood spray FV-CD1904 of the TCS (tcs.js 'hood', PR-OPE-5002 6307), in AUTO = RUN */
            if (m.tcs === 'hood') return U && U.on && U.tc ? (U.tc.hsp ? 'RUN' : 'STOP') : null;
            if (!U || !U.on || !U.loMop) return null;
            if (m.tcs === 'vex') return U.loVex ? 'RUN' : 'STOP';
            if (m.tcs === 'eop') return U.loEopR ? 'RUN' : 'STOP';
            const x = /^(mop|cop)([AB])$/.exec(m.tcs);
            return U['lo' + (x[1] === 'mop' ? 'Mop' : 'Cop')][x[2] === 'A' ? 0 : 1] ? 'RUN' : 'STOP';
          }
          if (m.sto) {
            const r = rout(m.sto[0], m.sto[1]);
            return r == null ? null : r ? 'RUN' : 'STOP';
          }
          return m.ad ? D().mst(m.ad) : null;
        }, null);
      /* mode of a motor: LS_DOCK.modeOf; a drawing with other names (DITL-76 / 77 "REMOTE SELECTED", "AUTO SELECTED"): its output rows */
      const outV = (ad, re) =>
        call(() => {
          const s = D().dOf(ad),
            o = s && DUI.outs(s).find(x => re.test(x.name));
          return o ? D().dout(ad, o.row) : null;
        }, null);
      for (const id in M)
        if (M[id].outMode)
          M[id].modeFn = () => {
            const r = outV(M[id].ad, /REMOTE SELECTED/),
              a = outV(M[id].ad, /AUTO SELECTED/);
            return { rem: r == null ? null : r === 1, au: a == null ? null : a === 1 };
          };
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
              e.textContent = s == null ? m.lcp || '-----' : s === 'TRIP' ? 'TRIP' : s === 'RUN' ? (e.dataset.short ? 'RUN' : 'RUNNING') : e.dataset.short ? 'STOP' : 'STOPPED';
              e.setAttribute('fill', col);
              e.classList.toggle('h2blink', s === 'TRIP');
            });
            qa(`[data-vcb="${id}"]`).forEach(e => {
              e.textContent = s == null ? 'Breaker -----' : s === 'RUN' ? 'Breaker ON' : 'Breaker OFF';
            });
          }
          if (m.remi) {
            const r = rin(m.remi[0], m.remi[1]);
            qa(`[data-md="${id}"]`).forEach(e => {
              e.textContent = r == null ? '-----' : r ? 'Remote' : 'Local';
              e.setAttribute('fill', r == null ? C.none : C.dim);
            });
          } else if (m.ad && !m.fld) {
            const md = call(() => (m.modeFn ? m.modeFn() : D().modeOf(m.ad)), null),
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
        for (const v of VT)
          if (v.sym) {
            const o = call(() => LS_FPOP.valveOpen(v.tag), null);
            v.sym.setAttribute('fill', o == null ? C.bg : o ? C.run : C.stop);
          }
        qa('[data-dsvc]').forEach(e => {
          const [ad, re, on, off] = e.dataset.dsvc.split('|'),
            v = dsvc(ad, re);
          e.textContent = v == null ? '-----' : v ? on : off;
          e.setAttribute('fill', v == null ? C.none : C.dim);
        });
        /* DITL output rows (the debris filter IN OPERATION / COMMON FAIL of DITL-39) */
        qa('[data-do]').forEach(e => {
          const [ad, row, on, off, kind] = e.dataset.do.split('|'),
            s = call(() => D().dOf(ad), null),
            v = s ? call(() => DUI.outVal(s, +row), null) : null;
          e.textContent = v == null ? '-----' : v ? on : off;
          e.setAttribute('fill', v == null ? C.none : v ? C.run : kind === 'alarm' ? C.dim : C.stop);
        });
        /* 3.2.1 page 10 PURGE AND TRIP: the Y / N of a condition read from the drawing itself.
           [data-dy="SHEET|i or o|row+row|neg"] = input rows (DUI.rowVal) or output rows (DUI.outVal), all 1 (AND); neg = the
           condition is the NOT of the row (e.g. "total air above 25 %" = NOT row 12 TOTAL AIR FLOW < 25% MCR). Y red = made, N green
           = not (the approved mockup); data-on / data-off = other texts (page 11: ON / OFF, OPEN / CLOSED); [data-dyr] = its square. [data-dys="GROUP|SHEET|row|label"] = the summary of a group
           (data-g): OK or NOT OK (n of N missing), from the output row of the drawing; [data-dfo="SHEET|row|first-last"] = MFT ACTIVE
           and the first input row (drawing order) that is 1 at the scan the MFT came, latched until the MFT resets */
        const dyv = spec => {
          const [ad, io, rows, neg] = spec.split('|'),
            s = call(() => D().dOf(ad), null);
          if (!s) return null;
          let v = 1;
          for (const r of rows.split('+')) {
            const x = call(() => (io === 'o' ? DUI.outVal(s, +r) : DUI.rowVal(s, +r)), null);
            if (x == null) return null;
            if (!x) v = 0;
          }
          return neg ? 1 - v : v;
        };
        const DY = {};
        qa('[data-dy]').forEach(e => {
          const v = dyv(e.dataset.dy),
            col = v == null ? C.none : v ? C.run : C.stop;
          DY[e.dataset.dy] = v;
          e.textContent = v == null ? (e.dataset.on ? '-----' : '-') : v ? e.dataset.on || 'Y' : e.dataset.off || 'N';
          e.setAttribute('fill', col);
        });
        qa('[data-dyr]').forEach(e => {
          const v = DY[e.dataset.dyr];
          e.setAttribute('stroke', v == null ? C.none : v ? C.run : C.stop);
        });
        qa('[data-dys]').forEach(e => {
          const [g, ad, row, lab] = e.dataset.dys.split('|'),
            ys = [...qa(`[data-dy][data-g="${g}"]`)],
            miss = ys.filter(y => DY[y.dataset.dy] !== 1).length,
            s = call(() => D().dOf(ad), null),
            ok = s ? call(() => DUI.outVal(s, +row), null) : null,
            col = ok == null ? C.none : ok ? C.run : C.stop;
          e.textContent = ok == null ? lab + ': -----' : ok ? lab + ': OK' : lab + ': NOT OK (' + miss + ' of ' + ys.length + ' missing)';
          e.setAttribute('fill', col);
          qa(`[data-dysr="${g}"]`).forEach(r => r.setAttribute('stroke', col));
        });
        qa('[data-dfo]').forEach(e => {
          const [ad, row, rg] = e.dataset.dfo.split('|'),
            s = call(() => D().dOf(ad), null),
            on = s ? call(() => DUI.outVal(s, +row), null) : null;
          if (on == null) {
            e.textContent = '-----';
            e.setAttribute('fill', C.none);
            return;
          }
          if (!on) e._fo = null;
          else if (!e._fo || e._fo === '-----') {
            const [a, b] = rg.split('-').map(Number);
            e._fo = null;
            for (let r = a; r <= b && !e._fo; r++) if (call(() => DUI.rowVal(s, r), null) === 1) e._fo = String(call(() => DUI.rowInfo(s, r).svc, '') || '');
            /* Mina N2, 3.2.3-beta.4: a trip input that is a pulse (DITL-03H TURBINE TRIP, 2 s) is back at 0 when the page is opened, so every
               input of DITL-03A read N and the box said first out: -----. The DCS keeps the first out in its memories: DITL-05 / 06 BOILER
               TRIP SIGNAL (1) / (2), output rows '... FIRST OUT' (CRT / ANN), latched until RESET FIRST OUT (DITL-02 out 58) */
            if (!e._fo)
              for (const nm of ['DITL-05', 'DITL-06']) {
                const f = call(() => D().dOf(nm), null);
                if (!f || e._fo) continue;
                for (const o of call(() => DUI.outs(f), []) || []) {
                  const t = String(o.name || '').split(' · ')[1] || '';
                  if (/FIRST OUT/.test(t) && call(() => DUI.outVal(f, o.row), null) === 1) {
                    e._fo = t.replace(/\s*\/?\s*FIRST OUT\s*$/, '').replace(/\s*\/\s*/g, ' ').trim();
                    break;
                  }
                }
              }
            if (!e._fo) e._fo = '-----';
          }
          e.textContent = on ? 'MFT ACTIVE · first out: ' + e._fo : 'NO MFT';
          e.setAttribute('fill', on ? C.run : C.stop);
          qa('[data-dfor]').forEach(r => r.setAttribute('stroke', on ? C.run : C.stop));
        });
      };
      /* plant model values kept by tag (AN.unit.tt: the LP heater temperatures, ...): def.unit[TAG] = 'tt:IO-TAG'; an item of a list of
         the plant model: 'ux:KEY.i' (AN.unit.fnGi[0] = IDF inlet A) */
      const TT = Object.entries(def.unit || {}).filter(([, k]) => /^(tt|ux):/.test(k));
      /* a path in the plant model; 'tcs.' = the TCS panel state (AN.tcs(): ATS step, oil pumps, hood temperature; AN.unit has no tc) */
      const uPath = (U, kp) => {
        const a = kp.split('.'),
          r = a[0] === 'tcs' ? call(() => AN.tcs(), null) : a[0] === 'gen' ? call(() => AN.gen(), null) : U;
        /* the 150 MW snapshot has no TCS state (U.tc null): the turbine is in NORMAL OPERATION (ATS step 7 done; faceplate sample of 4.PNG) */
        if (a[0] === 'tcs' && r == null && a[1] === 'step' && U && U.on && U.tb && U.tb.st !== 'off' && +U.MW > 0) return 7;
        /* page 13 step 9 SHUT-DOWN: not done on the loaded turbine of the snapshot */
        if (a[0] === 'tcs' && r == null && a[1] === 'st9' && U && U.on) return 0;
        /* page 13 exhaust hood temperature (Mina beta.143: '-----' at 150 MW): with no TCS model the exhaust steam is at the condenser
           saturation temperature of the plant model (unit.js anCondStep U.cdT, about 39 C at 150 MW), the hood spray in service */
        if (a[0] === 'tcs' && r == null && a[1] === 'Tx' && U && U.on) return isFinite(U.cdT) ? U.cdT : null;
        /* page 13: MSV / RSV open (the turbine reset) on the same loaded turbine */
        if (a[0] === 'tcs' && r == null && a[1] === 'rst' && U && U.on && U.tb) return U.tb.st !== 'off' && +U.MW > 0 ? 1 : 0;
        return (a[0] === 'tcs' || a[0] === 'gen' ? a.slice(1) : a).reduce((o, x) => (o == null ? null : o[x]), r);
      };
      const tickTT = () => {
        for (const [tag, k] of TT) {
          const U = window.AN && AN.unit,
            [kp, kx] = k.slice(3).split('*'),
            v = !U || !U.on ? null : k[0] === 't' ? (U.tt ? U.tt[kp] : null) : uPath(U, kp);
          /* page 13: 'ux:gv*100' = a fraction of the plant model shown in % */
          const nv = v != null && isFinite(v) ? +v * (kx ? +kx : 1) : null;
          if (PM[tag] !== nv) (PM[tag] = nv), showV(tag);
        }
        /* page 13: [data-uy="KEY.path|n|on text|off text"] = a state of the plant model (AN.unit): on (red) when the value >= n (true
           = 1), else off (green); the ATS step done (tc.step), the oil pumps running (tc.mop.0 ...) */
        /* page 13: [data-ut="KEY.path"] = a text of the plant model (the start-up mode of the TCS: WARM, HOT ...) */
        qa('[data-ut]').forEach(e => {
          const U = window.AN && AN.unit,
            v = !U || !U.on ? null : uPath(U, e.dataset.ut);
          e.textContent = v == null || v === '' ? '-----' : String(v);
        });
        qa('[data-uy]').forEach(e => {
          const [kp, n, on, off] = e.dataset.uy.split('|'),
            U = window.AN && AN.unit,
            v = !U || !U.on ? null : uPath(U, kp),
            ok = v == null ? null : +v >= +n;
          e.textContent = ok == null ? '-----' : ok ? on : off;
          e.setAttribute('fill', ok == null ? C.none : ok ? C.run : C.stop);
          qa(`[data-uyr="${e.dataset.uy}"]`).forEach(r => r.setAttribute('stroke', ok == null ? C.none : ok ? C.run : C.stop));
        });
        tickAts();
      };
      /* 3.2.3 live Cold start (user 2026-11-14: "kung sync, active card n dpat yan si synch and initial load"; "kada step s ats may
         checklist yan na tatlo"): the ATS step cards of page 13 follow the TCS model, no more the fixed frame of step 8 (snapshot 37.PNG).
         A card is DONE (the step finished), ACTIVE (the step running: its background colour changed, 310SC90-775 "STEP-IN COLOR"), NEXT
         (finished before, waiting for its push button) or WAITING. Under each card, three items of the sequential flow of its page of
         310SC90-775 (the program actuation sheets 13 ~ 28), Y red = complete, N green, with the live value of the step running */
      const ATS_CK = [
        /* 13 HP TURBINE WARMING: warming start, question 1st stage metal <= 150 C (*1), criteria D0 */
        (t, u) => [
          ['Warming start', t.cur === 0],
          ['Metal > 150 C', t.Thp > 150, fmt(t.Thp, 0) + ' C'],
          ['Criteria D0', false]
        ],
        /* 14 TURBINE PREPARATION: CV chest warming (*1 inner or outer > 150 C), turbine reset (1.20), MSV open (1.21) */
        t => [
          ['Chest warming', t.cur === 1 && t.ph !== 'chest', fmt(Math.max(t.Tcvi, t.Tcvo), 0) + ' C'],
          ['Turbine reset', !!t.rst],
          ['MSV open', !!t.rst]
        ],
        /* 17 ~ 18 TURBINE RUB CHECK: target speed 200 rpm, all valves close, coast down */
        t => [
          ['Speed 200 rpm', t.cur === 2 && t.ph === 'coast', fmt(t.rpm, 0) + ' rpm'],
          ['Valves close', t.cur === 2 && t.ph === 'coast'],
          ['Below 100 rpm', false]
        ],
        /* 19 ~ 22 ACCELERATION: heat soak 1800 rpm (cold modes), 3600 rpm, heat soak 3600 rpm */
        t => {
          const s = t.cur === 3 ? t.ph : '',
            left = isFinite(t.soakMin) ? Math.max(0, t.soakMin - t.tmMin) : NaN;
          return [
            ['Soak 1800 rpm', s === 'to3600' || s === 'soak3600', s === 'soak1800' ? fmt(left, 0) + ' min' : ''],
            ['Speed 3600 rpm', s === 'soak3600', s && s !== 'soak3600' ? fmt(t.rpm, 0) + ' rpm' : ''],
            ['Soak 3600 rpm', false, s === 'soak3600' ? fmt(left, 0) + ' min' : '']
          ];
        },
        /* 23 EXCITATION: excitation start (AVR, field switch 41), generator voltage, criteria D4 */
        (t, u, g) => [
          ['Excitation on', !!(t.gen && t.gen.f41)],
          ['Rated voltage', !!(t.gen && t.gen.f41 && t.gen.volt), g && t.cur === 4 ? fmt(g.kV, 2) + ' kV' : ''],
          ['Criteria D4', false]
        ],
        /* 24 ~ 25 SYNCH. & INITIAL LOAD: ASD start 52G, GCB closed (1.48), initial load hold timer (Fig. 3) then criteria D5 */
        (t, u) => {
          const on = t.cur === 5 && t.ph === 'init',
            left = isFinite(t.holdMin) ? Math.max(0, t.holdMin - t.tmMin) : NaN;
          return [
            ['Auto sync', on || !!(t.gen && t.gen.sync), t.cur === 5 && !on && t.gen ? fmt(t.gen.slip, 2) + ' Hz' : ''],
            ['52G closed', on],
            ['Initial load hold', false, on ? fmt(left, 1) + ' / ' + fmt(t.holdMin, 0) + ' min' : '']
          ];
        },
        /* 26 ~ 27 LOAD UP: load up start (ICV to CV transfer), load up 5 %/min to the target, criteria D6 */
        (t, u) => {
          const tb = (u && u.tb) || {},
            on = t.cur === 6;
          return [
            ['ICV to CV', !!tb.xfer, on && !tb.xfer && isFinite(tb.icv) ? 'ICV ' + fmt(tb.icv * 100, 1) + ' %' : ''],
            ['Load to target', false, on && u ? fmt(u.MW, 1) + ' / ' + fmt(tb.aim, 0) + ' MW' : ''],
            ['Criteria D6', false]
          ];
        },
        /* 28 NORMAL OPERATION: no hold condition, load up / down rate limit to the DCS (CRI. SH-20 no.43), criteria D7 */
        t => [
          ['No hold', t.cur === 7 && !t.hold],
          ['Rate limit', false],
          ['Criteria D7', false]
        ]
      ];
      let atsUi = null;
      const atsMk = (tag, at, par) => {
        const e = document.createElementNS(NS, tag);
        for (const [a, v] of Object.entries(at)) e.setAttribute(a, v);
        par.append(e);
        return e;
      };
      function tickAts() {
        if (atsUi === false) return;
        if (!atsUi) {
          const ys = [...qa('[data-uyr^="tcs.step|"]')];
          if (ys.length < 8) return (atsUi = false);
          atsUi = ys.map(r => {
            const card = r.previousElementSibling,
              x = +card.getAttribute('x'),
              y = +card.getAttribute('y'),
              h = +card.getAttribute('height');
            /* the two grey lines of the mockup under the card give their place to the checklist */
            [...qa('text')].forEach(e => {
              if (+e.getAttribute('x') === x + 12 && Math.abs(+e.getAttribute('y') - (y + h + 35)) <= 14) e.setAttribute('display', 'none');
            });
            const fill = atsMk('rect', { x, y, width: card.getAttribute('width'), height: h, rx: 4, fill: C.run, 'fill-opacity': 0, stroke: 'none' }, card.parentNode);
            card.parentNode.insertBefore(fill, card);
            const gi = atsMk('g', { 'font-size': 11 }, r.parentNode),
              rows = [0, 1, 2].map(i => {
                const yy = y + h + 18 + i * 17;
                return {
                  b: atsMk('rect', { x: x + 1, y: yy - 9, width: 10, height: 10, rx: 2, 'stroke-width': 1.2 }, gi),
                  t: atsMk('text', { x: x + 17, y: yy, fill: C.dim, stroke: 'none' }, gi),
                  v: atsMk('text', { x: x + 160, y: yy, fill: C.val, stroke: 'none', 'text-anchor': 'end' }, gi)
                };
              });
            return { card, fill, rows };
          });
        }
        const U = window.AN && AN.unit,
          t = U && U.on ? call(() => AN.tcs(), null) : null,
          g = t ? call(() => AN.gen(), null) : null,
          /* the 150 MW snapshot has no TCS state: NORMAL OPERATION done (as uPath) */
          step = t ? t.step : U && U.on && U.tb && U.tb.st !== 'off' && +U.MW > 0 ? 7 : -1,
          cur = t ? t.cur : -1;
        atsUi.forEach((ui, k) => {
          const done = step >= k && cur !== k,
            act = cur === k,
            next = !act && cur < 0 && k === step + 1;
          ui.card.setAttribute('stroke', act || next ? C.run : done ? '#e6e6e6' : C.none);
          ui.card.setAttribute('stroke-width', act ? 2.4 : 1.6);
          ui.card.setAttribute('stroke-dasharray', next ? '6 4' : 'none');
          ui.fill.setAttribute('fill-opacity', act ? 0.14 : 0);
          const it = t ? ATS_CK[k](t, U, g) : [['-----'], ['-----'], ['-----']];
          ui.rows.forEach((r, i) => {
            const [txt, ok0, val] = it[i] || [],
              ok = t ? ok0 || step >= k : null;
            r.t.textContent = txt || '';
            r.t.setAttribute('fill', act ? C.val : C.dim);
            r.v.textContent = act && val ? val : '';
            r.b.setAttribute('fill', ok == null ? 'none' : ok ? C.run : 'none');
            r.b.setAttribute('stroke', ok == null ? C.none : ok ? C.run : C.stop);
          });
        });
      }
      /* motor operated / on-off valves of a DITL sheet: [data-mov="SHEET|TAG|pct"] = position %, "SHEET|TAG|oc" = OPEN / CLOSED */
      const tickMov = () =>
        qa('[data-mov]').forEach(e => {
          const [nm, tg, how] = e.dataset.mov.split('|'),
            I = movInfo(nm, tg);
          if (!I || I.pos == null) {
            e.textContent = '-----';
            return e.setAttribute('fill', C.none);
          }
          if (how === 'am') {
            /* page 18: "AUTO · REMOTE" = both modes of the valve (its AUTO MODE input, its REMOTE output) */
            e.textContent = (I.au == null ? '-----' : I.au ? 'AUTO' : 'MANUAL') + ' · ' + (I.rem == null ? '-----' : I.rem ? 'REMOTE' : 'LOCAL');
            e.setAttribute('fill', C.dim);
          } else if (how === 'md') {
            /* the mode of the valve: REMOTE / LOCAL (its REMOTE output) else AUTO / MANUAL (its AUTO MODE input) */
            e.textContent = I.rem != null ? (I.rem ? 'REMOTE' : 'LOCAL') : I.au != null ? (I.au ? 'AUTO' : 'MANUAL') : '-----';
            e.setAttribute('fill', C.dim);
          } else if (how === 'pct') {
            e.textContent = fmt(I.pos, 1) + ' %';
            e.setAttribute('fill', C.val);
          } else {
            e.textContent = I.pos >= 99.5 ? 'OPEN' : I.pos <= 0.5 ? 'CLOSED' : 'TRAVEL ' + fmt(I.pos, 0) + ' %';
            e.setAttribute('fill', I.pos > 0.5 ? C.run : C.stop);
          }
        });
      /* page 18: [data-movr="SHEET|TAG"] = the valve symbol of a MOV: red = open (not fully closed), green = closed, grey = no position */
      const tickMovR = () =>
        qa('[data-movr]').forEach(e => {
          const [nm, tg] = e.dataset.movr.split('|'),
            I = movInfo(nm, tg);
          e.setAttribute('stroke', !I || I.pos == null ? C.none : I.pos > 0.5 ? C.run : C.stop);
        });
      const tick0 = tick;
      /* e6: page 13 turbine protection: TRIPPED / RESET and the first out of TA-9 (tcs.js U.tc.trip, '' = reset) */
      const tickTP = () => {
        if (!pg.querySelector('[data-tt]')) return;
        /* Mina beta.121: "-----" at 150 MW (the snapshot has no TCS state: AN.tcs() null) and "[object Object]" after a trip: the first
           out is AN.tcsTrip().first (tcs-trip.js tcsTripState); no TCS state with the plant model on = not tripped */
        const U = window.AN && AN.unit,
          tt = U && U.on ? call(() => (AN.tcsTrip ? AN.tcsTrip() : null), null) : null,
          f0 = tt && typeof tt === 'object' ? tt.first : tt,
          fo = !U || !U.on ? null : typeof f0 === 'string' ? f0 : f0 && typeof f0 === 'object' ? String(f0.first || f0.name || '') : '';
        qa('[data-tt]').forEach(e => {
          if (fo == null) return (e.textContent = '-----'), e.setAttribute('fill', C.none);
          if (e.dataset.tt === 'st') (e.textContent = fo ? 'TRIPPED' : 'RESET'), e.setAttribute('fill', fo ? C.run : C.stop);
          else e.textContent = 'First out: ' + (fo || 'none');
        });
        qa('[data-ttr]').forEach(r => r.setAttribute('stroke', fo == null ? C.none : fo ? C.run : C.stop));
        qa('[data-tfo]').forEach(c => {
          const on = !!fo && fo.toUpperCase() === c.dataset.tfo;
          c.setAttribute('fill', on ? C.run : 'none');
          c.setAttribute('stroke', on ? C.run : C.dim);
        });
      };
      const tickAll = () => (tick0(), tickTT(), tickMov(), tickMovR(), tickTP());
      tickAll();
      HSYM.every(g, 500, tickAll);
      /* faceplates: click on the equipment = CONTROL, the Y / N square = PERMISSIVE · TREND · MONITOR (#59) */
      const curOf = m => (m.cur ? () => cur(m.cur) : null);
      const mon = m => m.mon || [];
      const known = m => m.ad && !m.fld && !/@/.test(m.ad) && call(() => D().dOf(m.ad), null);
      /* a field write of an input row, written again while the Worker copy still shows the old value (the beta.29 LCP STOP lesson:
         the 'ds' sync of the Worker overwrote a page write made between two of its frames) */
      const fRow = (ad, row, on, txt) => {
        D().fieldRow(ad, row, on ? 1 : 0, txt);
        let n = 0;
        const chk = () => {
          const s0 = call(() => D().dOf(ad), null);
          if (!s0 || !s0.sig) return;
          if (!!s0.sig[row + ':S'] !== !!on) {
            s0.sig[row + ':S'] = !!on;
            if (window.WORLD && WORLD.live) WORLD.busy = true;
          }
          if (++n < 6) setTimeout(chk, 400);
        };
        setTimeout(chk, 400);
      };
      const open = (id, part) => {
        const m = M[id];
        if (!m) return;
        if (m.df && window.LS_FPOP && LS_FPOP.pb) {
          const s = call(() => D().dOf(m.d), null),
            perm = (m.df.perm || []).map(r => ({ row: r, l: String(call(() => DUI.rowInfo(s, r).svc, '') || 'row ' + r) }));
          if (LS_FPOP.pb({ n: m.n, t: m.t, d: m.d, io: m.io, st: { row: m.df.st, on: m.df.on || 'IN OPERATION', off: m.df.off || 'STOPPED' }, pbs: m.df.pbs, free: m.df.free, perm, permWhy: m.df.why, vals: m.df.dp ? [[m.df.dp, () => cur(m.df.dp), 'mmH2O']] : [] }))
            return;
        }
        /* tracker e1: a field item that only the Training dock could set: the lower ring header drains */
        if (m.fset && window.LS_FPOP && LS_FPOP.fset && LS_FPOP.fset(m.fset())) return;
        if (m.fieldOp && window.LS_FPOP && LS_FPOP.field)
          return void LS_FPOP.field({ n: m.n, t: m.t, d: m.d, io: m.io, why: (m.why || '') + (m.fld ? '' : ' This pump has no plant model.'), st: () => (m.fld ? mst(m) : null), fld: m.fld ? on => AN.field(m.fld, on) : null });
        if (m.mov && window.LS_FPOP && LS_FPOP.mov)
          return void LS_FPOP.mov({
            n: m.n,
            t: m.t,
            d: m.mov,
            info: () => movInfo(m.mov, m.tg || m.n),
            press: row => D().dpress(m.mov, row),
            mode: (row, v) => D().dsel(m.mov, row, v, (m.tg || m.n) + (v ? ' AUTO' : ' MANUAL')),
            block: row => (D().pbBlock ? D().pbBlock(m.mov, row) : null),
            /* live test 2026-11-05: the field REMOTE / LOCAL selector = the REMOTE input rows (DI) of this valve on its drawing */
            sel: (() => {
              const s = call(() => D().dOf(m.mov), null),
                tg = m.tg || m.n,
                own = tg[0] === '~' ? t => t.indexOf(tg.slice(1)) >= 0 : t => !/(?:XV|MV)-[A-Z]{2}\d{4}/.test(t) || t.indexOf(tg) >= 0,
                rows = [];
              for (let r = 0; s && r < 64; r++) {
                const I = call(() => DUI.rowInfo(s, r), null),
                  t = (I && I.svc) || '';
                if (/\bREMOTE\b/.test(t) && !/\b(LOCAL|AUTO|NOT)\b|P\.?B\b/.test(t) && own(t) && !/^M\./.test((I && I.tag) || '')) rows.push(r); /* a field contact: I. address, or none written (DITL-38 copies) */
              }
              return rows.length ? on => rows.forEach(r => fRow(m.mov, r, on, tg + ' REMOTE SELECTED (field selector)')) : null;
            })()
          });
        if (m.tcs && window.LS_FPOP && LS_FPOP.tcs) {
          const x = /^(mop|cop)([AB])$/.exec(m.tcs);
          return void LS_FPOP.tcs({
            n: m.n,
            t: m.t,
            d: m.d,
            why: m.why,
            st: () => mst(m),
            au: x
              ? () => {
                  const U = AN.unit;
                  return U && U.on && U.loMop ? !!U['lo' + (x[1] === 'mop' ? 'Mop' : 'Cop') + 'Au'][x[2] === 'A' ? 0 : 1] : null;
                }
              : null,
            cmd: op => (!(AN.unit && AN.unit.on) ? 'no plant model: choose Cold or 150 MW (Plant model ON)' : m.tcs === 'gland' || m.tcs === 'hood' ? (op === 'start' || op === 'stop' ? AN.turbine(m.tcs, op === 'start' ? 1 : 0) : 'no AUTO / MANUAL') : m.tcs === 'vex' ? (op === 'start' || op === 'stop' ? AN.turbine('vex', op === 'start' ? 1 : 0) : 'no AUTO / MANUAL') : AN.turbine('oil', { p: m.tcs, op }))
          });
        }
        /* live test 2026-11-05 (INSTRUMENT AND PLANT AIR): a machine started at its local panel (sti: [sheet, RUNNING row, TRIP row]) had
           only the I/O card, nothing on the page could start an air compressor. The FIELD pop-out: START / STOP = the field operator at the
           local panel (the RUNNING row, as the Training dock; unit.js anAirStep reads it), TRIP / RESET = its TRIP contact */
        if (m.sti && window.LS_FPOP && LS_FPOP.field)
          return void LS_FPOP.field({
            n: m.n,
            t: m.t,
            d: m.sti[0],
            io: m.io,
            why: 'Started and stopped at its local panel (no DCS START / STOP). The DCS reads RUNNING (' + m.sti[0] + ' row ' + (m.sti[1] + 1) + ') and TRIP (row ' + (m.sti[2] + 1) + ').',
            st: () => mst(m),
            fld: on => fRow(m.sti[0], m.sti[1], on, (on ? 'START ' : 'STOP ') + m.n + ' (local panel)'),
            trip: m.sti[2] != null ? on => fRow(m.sti[0], m.sti[2], on, (on ? 'TRIP ' : 'RESET ') + m.n + ' (local panel)') : null
          });
        /* live test 2026-11-05: an air dryer of DITL-45 (sto = its RUNNING output row, remi = its REMOTE input row): START P.B. = the input
           row of the RUNNING output (rows 4 / 15), STOP P.B. 4 rows below (rows 8 / 19), both need REMOTE (I.0085 / I.0099) */
        if (m.sto && m.remi && window.LS_FPOP && LS_FPOP.pb) {
          const s = call(() => D().dOf(m.sto[0]), null),
            r0 = m.sto[1],
            ad = r => String(call(() => DUI.rowInfo(s, r).svc, '') || '').split(/[\s/]/)[0];
          if (
            s &&
            LS_FPOP.pb({
              n: m.n,
              t: m.t,
              d: m.sto[0],
              io: m.io,
              st: { row: r0, on: 'RUNNING', off: 'STOPPED' },
              pbs: [
                ['START', r0, ad(r0)],
                ['STOP', r0 + 4, ad(r0 + 4)]
              ],
              perm: [{ row: m.remi[1], l: 'REMOTE (field selector of the local panel)' }],
              permWhy: 'REMOTE (turn the selector to REMOTE first)',
              sel: m.remi[1]
            })
          )
            return;
        }
        if (m.vt && window.LS_FPOP && LS_FPOP.valveTag && LS_FPOP.valveTag(m.vt)) return;
        if (m.ctl) return; /* the controller faceplate: plant.js opens it on the same click (api.reg ctl) */
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
  /* 3.2.1 split view (training/split.js): the equipment of every page = the loop check batches */
  const DEFS = [];
  function add(def) {
    DEFS.push(def);
    PLANT_V2.screens[def.id] = page(def);
    const L = (window.PLANT_SYS = window.PLANT_SYS || []),
      i = def.before ? L.findIndex(x => x.id === def.before) : -1;
    const F = frameOf(def);
    L.splice(i >= 0 ? i : L.length, 0, { fitAll: def.tall ? 0 : 1, fitW: def.tall ? 1 : 0, id: def.id, title: def.title, num: def.num, name: def.name, src: def.src || '', w: F.w, h: F.h, v2: true, screen: def.id, style: 'steel', items: [] });
  }
  window.LS_MOCK = { add, page, defs: DEFS };
})();
