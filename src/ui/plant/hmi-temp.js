/* TEMPORARY HMI PAGES (user 2026-11-03: "Yung mga HMI na wala, gawan nyo muna temporary para may matesting si tester Mina. Huwag nyo na
   paaprub sa akin. Basta may HMI na temporary kahit hindi maganda. Basta magtuloy-tuloy lang ang testing").
   One page per group of PR-OPE-5002 sections that the live test (Cold -> 150 MW) needs and that has no new HMI page yet. The content is
   NOT drawn by hand: each page reads the Training steps of its sections (LS_GUIDE.steps(), guide.js) and shows their equipment with the
   SAME tags, addresses and calls as the Training dock:
   - a motor of a step (its address, M.xxxx or the DITL sheet) = a symbol, red = running, green = stopped, blinking = trip
     (LS_DOCK.mst), click = its floating motor faceplate (fp-pop.js LS_FPOP.hit, #57);
   - a controller / valve / MAN station of a step (fps) = a box with PV / SV / MV and A / M / R (LS_LIVE), click = its faceplate
     (plant.js fpOpen, the one of every Plant page);
   - a CRT push button of a drawing (dg: DITL sheet + row) = a DCS button (the same dPress of the dock), lit when its step reads done;
   - a FIELD action (no DCS signal) = a FIELD button, logged in Events as "Field operator";
   - a TCS operation (turbine control system screen, no DCS logic) = a TCS button.
   The values are the simulation, never a snapshot number. Each page is replaced by its new HMI page (approved mockup) when that is built;
   then its entry is deleted here. */
(function () {
  if (!window.PLANT_V2) return;
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    line: '#c5cdd5',
    bg: '#0e1318',
    run: '#d64545',
    stop: '#3fa34d',
    none: '#6b7480',
    nm: '#d3dbe2',
    dim: '#8b97a3',
    val: '#e8eef3',
    card: '#11171d',
    cs: '#2c3640',
    man: '#ffd27a',
    aut: '#9ff0c4',
    rem: '#8fc7ff'
  };
  /* [id, list title, page heading, PR-OPE-5002 sections (guide.js sec)] */
  const PAGES = [
    ['TCF', 'TEMP 028 CONDENSATE & FEEDWATER', 'CONDENSATE, DEAERATOR AND FEEDWATER', [18, 19, 20]],
    ['TDO', 'TEMP 006 DIESEL OIL', 'DIESEL OIL SYSTEM (START-UP BURNER OIL)', [21]],
    [
      'TFN',
      'TEMP FANS (ID, FA, SA, PA)',
      'ID FAN, FLUIDIZING AIR BLOWER, SECONDARY AND PRIMARY AIR FANS',
      [22, 23, 24, 25]
    ],
    ['TPG', 'TEMP PURGE & SOOT BLOWER', 'FURNACE PURGE AND AIR HEATER SOOT BLOWER', [26, 27]],
    ['TBR', 'TEMP 012-015 BURNERS & STEAM', 'START-UP BURNERS A ~ D, MAIN STEAM, DRUM PRESSURE AND LEVEL', [28]],
    [
      'TTA',
      'TEMP TURBINE AUXILIARIES',
      'TURBINE AUXILIARIES: TCS OIL, TURNING GEAR, AUX STEAM, GLAND, VACUUM, BYPASS',
      [14, 30, 31, 33, 35]
    ],
    [
      'TTS',
      'TEMP TURBINE START (ATS)',
      'TURBINE START: ATS STEPS, SYNCHRONIZING, INITIAL LOAD, FEEDWATER CHANGE-OVER',
      [41, 42]
    ],
    ['TCC', 'TEMP 011 / 033 COAL & CCS', 'COAL FEEDERS AND COMBUSTION / COORDINATED CONTROL', [44, 47]]
  ];
  const call = (f, d) => {
    try {
      const r = f();
      return r === undefined ? d : r;
    } catch (e) {
      return d;
    }
  };
  const esc = s =>
    String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (x, dp = 1) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp));
  const D = () => window.LS_DOCK,
    LV = () => window.LS_LIVE,
    G = () => window.LS_GUIDE;
  /* the kind of a step action (guide.js mot / pbB / fldB / btn) */
  const kind = a =>
    a.ad && !a.dg && /^START /.test(a.l || '')
      ? 'mot'
      : a.dg
        ? 'dg'
        : a.loc || /^\s*FIELD\b/.test(a.l || '')
          ? 'fld'
          : /TCS|ATS|TURNING GEAR|GLAND STEAM|VACUUM UP|WARMING|PREPARATION|RUB CHECK|ACCELERATION|EXCITATION|SYNCH|LOAD UP|NORMAL OPERATION|PUMP START|EXTRACTOR START|^\s*(START|STOP) /i.test(
                a.l || ''
              ) && !/^\s*(A|M|R)\b[ ,(]|MV|SV|▲|▼/.test(a.l || '')
            ? 'tcs'
            : /\(DITL-[^)]*\)/.test(a.l || '') && !/^\s*(A|M|R)\b[ ,(]|MV|SV|▲|▼/.test(a.l || '')
              ? 'dg'
              : null; /* a shortcut of the dock that sets a controller (A, SV 150 ...): done on the controller faceplate here */
  function page(P) {
    return function (g, api) {
      const pg = document.createElementNS(NS, 'g');
      pg.setAttribute('transform', 'translate(80 60)');
      g.append(pg);
      const st = call(() => G().steps(), [])
        .map((s, i) => Object.assign({ n: i + 1 }, s))
        .filter(s => P[3].includes(s.sec));
      const mots = new Map(),
        ctls = new Map(),
        btns = [];
      /* user 2026-11-03 (on the first version): "kahit outline lang ng mga equipment ... text na nagbabago. Kahit wala muna kulay. Guhit
         at text lang muna": one line colour, equipment outlines on a line, live text; no colour fills */
      const L = C.line,
        cut = (x, n) => (String(x).length > n ? String(x).slice(0, n - 1) + '…' : String(x)),
        wrap = (x, n) => {
          const w = String(x).split(' '),
            o = [''];
          for (const y of w) {
            if ((o[o.length - 1] + ' ' + y).trim().length > n && o[o.length - 1]) o.push('');
            o[o.length - 1] = (o[o.length - 1] + ' ' + y).trim();
          }
          return o.slice(0, 2).map((z, i, a) => (i === 1 && o.length > 2 ? cut(z + ' …', n) : z));
        },
        tx = (x, y, s, z, a = '') =>
          `<text x="${x}" y="${y}" font-size="${z}" fill="${C.nm}"${a ? ' ' + a : ''}>${esc(s)}</text>`;
      const blocks = [];
      for (const s of st) {
        const its = [];
        for (const t0 of s.fps || []) {
          const t = call(() => LV().ctlTag(t0), null) || t0;
          if (!call(() => LV().fp(t), null)) continue;
          const k = 'c' + ctls.size;
          ctls.set(k, t);
          its.push({ k: 'ctl', key: k, n: t0, sub: t !== t0 ? t : '' });
        }
        for (const a of s.a || []) {
          const kd = kind(a);
          if (kd === 'mot') {
            if (mots.has(a.ad)) continue;
            const n = String(a.l).replace(/^START\s+/, '');
            mots.set(a.ad, n);
            its.push({ k: 'mot', ad: a.ad, n });
          } else if (kd) {
            btns.push(a);
            its.push({
              k: 'pb',
              b: btns.length - 1,
              kd,
              n: String(a.l || '')
                .trim()
                .replace(/^FIELD:\s*/, '')
            });
          }
        }
        if (its.length) blocks.push({ s, its, tl: wrap('Step ' + s.n + ' · ' + s.t, 70) });
      }
      const CW = 572,
        IW = 140,
        PER = 4,
        RH = 104;
      const colY = [52, 52, 52];
      let h =
        tx(0, 18, P[2], 20, 'font-weight="700"') +
        tx(
          0,
          38,
          'TEMPORARY PAGE · PR-OPE-5002 sections ' +
            P[3].join(', ') +
            ' · the same tags and faceplates as the Training steps · click an equipment = its faceplate',
          12,
          `fill-opacity=".7"`
        );
      for (const B of blocks) {
        const c = colY.indexOf(Math.min(...colY)),
          x0 = c * (CW + 22),
          y0 = colY[c],
          rows = Math.ceil(B.its.length / PER),
          bh = 12 + B.tl.length * 17 + rows * RH;
        h += `<rect x="${x0}" y="${y0}" width="${CW}" height="${bh}" rx="4" fill="none" stroke="${L}" stroke-opacity=".35"/>`;
        B.tl.forEach((l, i) => (h += tx(x0 + 10, y0 + 18 + i * 17, l, 13, 'font-weight="600"')));
        for (let r = 0; r < rows; r++) {
          const row = B.its.slice(r * PER, r * PER + PER),
            yy = y0 + 12 + B.tl.length * 17 + r * RH,
            cy = yy + 26;
          if (row.length > 1)
            h += `<line x1="${x0 + 10 + IW / 2}" y1="${cy}" x2="${x0 + 10 + IW / 2 + (row.length - 1) * IW}" y2="${cy}" stroke="${L}" stroke-opacity=".6"/>`;
          row.forEach((it, i) => {
            const cx = x0 + 10 + IW / 2 + i * IW,
              hit = `<rect x="${cx - IW / 2 + 4}" y="${yy}" width="${IW - 8}" height="${RH - 8}" fill="transparent" pointer-events="all"/>`;
            if (it.k === 'mot')
              h += `<g class="tmpg-mot" data-ad="${esc(it.ad)}" style="cursor:pointer"><title>${esc(it.n)} · ${esc(it.ad)} · click = faceplate</title>${hit}<circle cx="${cx}" cy="${cy}" r="17" fill="${C.bg}" stroke="${L}" stroke-width="1.6"/><path d="M${cx - 7} ${cy - 8} L${cx + 9} ${cy} L${cx - 7} ${cy + 8} Z" fill="none" stroke="${L}" stroke-width="1.4"/>${tx(cx, cy + 34, cut(it.n, 18), 13, 'text-anchor="middle" font-weight="600"')}${tx(cx, cy + 48, it.ad, 11, 'text-anchor="middle" fill-opacity=".7"')}${tx(cx, cy + 63, '-----', 12, `text-anchor="middle" font-family="ui-monospace,monospace" data-st="${esc(it.ad)}"`)}</g>`;
            else if (it.k === 'ctl')
              h += `<g class="tmpg-ctl" data-c="${it.key}" style="cursor:pointer"><title>${esc(ctls.get(it.key))} · click = faceplate</title>${hit}<path d="M${cx - 14} ${cy - 9} L${cx + 14} ${cy + 9} L${cx + 14} ${cy - 9} L${cx - 14} ${cy + 9} Z" fill="${C.bg}" stroke="${L}" stroke-width="1.4"/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 16}" stroke="${L}"/><rect x="${cx - 9}" y="${cy - 24}" width="18" height="8" fill="none" stroke="${L}"/>${tx(cx, cy + 34, cut(it.n, 18), 13, 'text-anchor="middle" font-weight="600"')}${tx(cx, cy + 48, '-----', 11, `text-anchor="middle" font-family="ui-monospace,monospace" data-v="${it.key}"`)}${tx(cx, cy + 63, '-----', 11, `text-anchor="middle" font-family="ui-monospace,monospace" data-m="${it.key}"`)}</g>`;
            else {
              const lb = wrap(it.n, 19);
              h += `<g class="tmpg-pb" data-b="${it.b}" style="cursor:pointer"><title>${esc(it.kd === 'fld' ? 'Field operator (no DCS signal)' : it.kd === 'tcs' ? 'TCS screen (turbine control system)' : 'DCS push button of the drawing')}</title>${hit}<rect x="${cx - 62}" y="${cy - 18}" width="124" height="36" rx="3" fill="${C.bg}" stroke="${L}" stroke-width="1.4" data-bx="${it.b}"/>${lb.map((l, j) => tx(cx, cy - 3 + j * 14 - (lb.length - 1) * 7 + 4, l, 11, 'text-anchor="middle"')).join('')}${tx(cx, cy + 34, it.kd === 'fld' ? 'FIELD' : it.kd === 'tcs' ? 'TCS' : 'DCS P.B.', 11, 'text-anchor="middle" fill-opacity=".7"')}${tx(cx, cy + 50, '', 12, `text-anchor="middle" font-family="ui-monospace,monospace" data-pd="${it.b}"`)}</g>`;
            }
          });
        }
        colY[c] = y0 + bh + 14;
      }
      const H = Math.max(...colY),
        sc = H > 890 ? 890 / H : 1;
      pg.innerHTML = `<g transform="scale(${sc})">${h}</g>`;
      const q = s => pg.querySelector(s),
        qa = s => pg.querySelectorAll(s);
      /* clicks: the same faceplates as the other Plant pages */
      qa('.tmpg-mot').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          const ad = b.dataset.ad,
            M = { ad, n: mots.get(ad), t: ad, d: ad };
          if (window.LS_FPOP)
            LS_FPOP.hit(M, () => call(() => LS_FPOP.motor(M), null) || call(() => window.lsInfo(ad), null));
        })
      );
      qa('.tmpg-ctl').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          api.fp(ctls.get(b.dataset.c));
        })
      );
      qa('.tmpg-pb').forEach(b =>
        b.addEventListener('click', e => {
          e.stopPropagation();
          const a = btns[+b.dataset.b],
            r = call(() => a.f(), '');
          if (r && window.msg) msg(r);
          setTimeout(tick, 200);
        })
      );
      /* registered for the dock's "Open faceplate" (fp-pop.js LS_FPOP.openAd) when no other page has the motor */
      const R = (window.LS_FPREG = window.LS_FPREG || {});
      for (const [ad, n] of mots)
        if (!R[ad] || !call(() => R[ad].el() && R[ad].el().isConnected, false))
          R[ad] = {
            open: () => q(`[data-ad="${ad}"]`) && q(`[data-ad="${ad}"]`).dispatchEvent(new MouseEvent('click')),
            el: () => q(`[data-ad="${ad}"]`),
            n
          };
      function tick() {
        if (!pg.isConnected) return;
        for (const [ad] of mots) {
          const m = call(() => D().mst(ad), null),
            md = call(() => D().modeOf(ad), null) || {},
            t = q(`[data-st="${ad}"]`);
          if (t) {
            const x =
              (m || '-----') +
              (md.rem == null ? '' : md.rem ? ' REM' : ' LOC') +
              (md.au == null ? '' : md.au ? ' AUTO' : ' MAN');
            if (t.textContent !== x) t.textContent = x;
          }
        }
        for (const [k, t] of ctls) {
          const f = call(() => LV().fp(t), null);
          if (!f) continue;
          const pv = call(() => LV().pvOf(f), NaN),
            sv = call(() => LV().svOf(f), NaN),
            mv = call(() => LV().mvOf(f), NaN),
            md = call(() => LV().modeOf(f), '?'),
            v = q(`[data-v="${k}"]`),
            m = q(`[data-m="${k}"]`);
          const x = (isFinite(pv) ? 'PV ' + fmt(pv) : '') + (isFinite(sv) ? ' SV ' + fmt(sv) : ''),
            y =
              'MV ' +
              fmt(mv) +
              ' % · ' +
              (/^A/.test(md) ? 'AUTO' : /^R/.test(md) ? 'REMOTE' : /^M/.test(md) ? 'MAN' : md || '-');
          if (v && v.textContent !== (x.trim() || ' ')) v.textContent = x.trim() || ' ';
          if (m && m.textContent !== y) m.textContent = y;
        }
        qa('.tmpg-pb').forEach(b => {
          const a = btns[+b.dataset.b],
            on = !!call(() => a.on && a.on(), false),
            d = q(`[data-pd="${b.dataset.b}"]`),
            r = q(`[data-bx="${b.dataset.b}"]`);
          if (d && d.textContent !== (on ? 'DONE' : '')) d.textContent = on ? 'DONE' : '';
          if (r) r.setAttribute('stroke-width', on ? 3 : 1.4);
          b.style.display = call(() => a.hide && a.hide(), false) ? 'none' : '';
        });
      }
      tick();
      const iv = setInterval(() => (pg.isConnected ? tick() : clearInterval(iv)), 500);
      return pg;
    };
  }
  const LS = (window.PLANT_SYS = window.PLANT_SYS || []);
  for (const P of PAGES) {
    PLANT_V2.screens[P[0]] = page(P);
    LS.push({
      id: P[0],
      title: P[1],
      num: '',
      name: P[2],
      src: P[0],
      w: 1920,
      h: 1000,
      v2: true,
      screen: P[0],
      temp: 1,
      items: []
    });
  }
})();
