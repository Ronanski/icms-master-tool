/* ---------- interaction ---------- */
const cv = $('cv'),
  PT = new Map();
let dn = null,
  pinch = null;
const xy = e => {
  const svg = $('svg'),
    p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  return [q.x, -q.y];
};
const live = () => AN.cat === 'an';
['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel', 'dblclick', 'click', 'contextmenu'].forEach(t =>
  cv.addEventListener(
    t,
    e => {
      if (!live()) return;
      e.stopPropagation();
      const svg = $('svg'),
        sh = cs();
      if (!sh) return;
      const v = AN.av[sh.name];
      if (t === 'wheel') {
        e.preventDefault();
        if (!v) return;
        const f = e.deltaY < 0 ? 0.85 : 1.18,
          p = xy(e),
          px = p[0],
          py = -p[1];
        v[0] = px - (px - v[0]) * f;
        v[1] = py - (py - v[1]) * f;
        v[2] *= f;
        v[3] *= f;
        svg.setAttribute('viewBox', v.join(' '));
        return;
      }
      if (t === 'pointerdown') {
        if (e.pointerType === 'mouse') {
          PT.clear();
          pinch = null;
          dn = null;
        }
        PT.set(e.pointerId, [e.clientX, e.clientY]);
        try {
          cv.setPointerCapture(e.pointerId);
        } catch (x) {}
        if (PT.size === 2) {
          const a = [...PT.values()];
          pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) };
          if (dn) dn.m = true;
          return;
        }
        dn = { x: e.clientX, y: e.clientY, m: false, e };
      } else if (t === 'pointermove') {
        if (e.pointerType === 'mouse' && e.buttons === 0) {
          if (dn || PT.size) {
            dn = null;
            PT.clear();
            pinch = null;
          }
          return;
        }
        if (PT.has(e.pointerId)) PT.set(e.pointerId, [e.clientX, e.clientY]);
        if (!v) return;
        if (PT.size === 2 && pinch) {
          const a = [...PT.values()],
            d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
          if (d > 8 && pinch.d > 8) {
            const f = pinch.d / d,
              r = svg.getBoundingClientRect(),
              cx = (a[0][0] + a[1][0]) / 2 - r.left,
              cy = (a[0][1] + a[1][1]) / 2 - r.top,
              k = r.width / v[2],
              px = v[0] + cx / k,
              py = v[1] + cy / k;
            v[0] = px - (px - v[0]) * f;
            v[1] = py - (py - v[1]) * f;
            v[2] *= f;
            v[3] *= f;
            svg.setAttribute('viewBox', v.join(' '));
            pinch.d = d;
          }
          return;
        }
        if (dn && (dn.m || Math.hypot(e.clientX - dn.x, e.clientY - dn.y) > 4)) {
          dn.m = true;
          const k = svg.getScreenCTM().a;
          v[0] -= (e.clientX - dn.x) / k;
          v[1] -= (e.clientY - dn.y) / k;
          dn.x = e.clientX;
          dn.y = e.clientY;
          svg.setAttribute('viewBox', v.join(' '));
        }
      } else if (t === 'pointerup' || t === 'pointercancel') {
        PT.delete(e.pointerId);
        if (PT.size < 2) {
          if (pinch) dn = null;
          pinch = null;
        }
        if (dn && !dn.m && t === 'pointerup') pick(e);
        if (PT.size === 0) dn = null;
      }
    },
    true
  )
);
cv.addEventListener(
  'lostpointercapture',
  e => {
    if (!live()) return;
    PT.delete(e.pointerId);
    if (!PT.size) {
      dn = null;
      pinch = null;
    }
  },
  true
);
/* DIGITAL signals: click the wire (or its tag / the SIG.AB box) = 1, click again = 0, like DITL. A signal computed by the logic goes 1 → 0 → back to AUTO. */
function setExt(sh, n, x) {
  const S = sh.S;
  S.rt.ext[n] = x;
  (sv(sh).ext = sv(sh).ext || {})[n] = x;
  anSave();
  settle();
}
function digClick(sh, n, shift) {
  if (((AN.hmiUi && AN.hmiUi.open) || (AN.plantUi && AN.plantUi.open)) && !AN.view) {
    msg('The Plant window (or HMI) is open: operate from there (inputs and FORCE / SIM). Close it to use the diagram.');
    return;
  }
  if (AN.view) {
    AN.sel = { net: n };
    selBox();
    paint();
    panelFor(true);
    panelUpd(true);
    rowFocus('n' + n);
    return;
  }
  const S = sh.S,
    F = S.rt.force;
  let t;
  {
    let g = 0,
      m = 1;
    while (m && g++ < 20) {
      m = 0;
      if (S.ext.includes(n)) break;
      for (const [d, sr] of S.link || [])
        if (d === n) {
          n = sr;
          m = 1;
          break;
        }
    }
  }
  const nme = nm(S, n);
  if (S.ext.includes(n) && !(S.xlk && S.xlk[n])) {
    const x = S.rt.ext[n] > 0.5 ? 0 : 1;
    setExt(sh, n, x);
    t = nme + ' → ' + x;
  } else {
    const lk = S.xlk && S.xlk[n];
    t =
      nme +
      ' = ' +
      (S.rt.v[n] > 0.5 ? 1 : 0) +
      (lk
        ? ' · from sheet ' +
          lk.from.name +
          ' (' +
          (lk.tag ? 'tag ' : 'circle ') +
          lk.num +
          ') - not an input: the logic there decides it.'
        : ' · logic output on this sheet - not an input: the logic decides it.') +
      ' To force it: FORCE button in the panel.';
  }
  AN.sel = { net: n };
  selBox();
  paint();
  panelFor(true);
  panelUpd(true);
  rowFocus('n' + n);
  msg(t);
}
function pick(e) {
  const sh = cs(),
    S = sh && sh.S;
  if (!S) return;
  const [x, y] = xy(e),
    k = $('svg').getScreenCTM().a,
    tol = Math.max(0.9, 7 / k);
  for (const c of S.conn.concat(S.xc || []))
    if (Math.hypot(x - c.x, y - c.y) <= c.r + 0.4) {
      connClick(c);
      return;
    }
  let best = null,
    ba = 1e12;
  for (const b of S.blk) {
    if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) {
      const a = (b.x1 - b.x0) * (b.y1 - b.y0);
      if (a < ba) {
        ba = a;
        best = b;
      }
    }
  }
  if (best) {
    AN.sel = { blk: best };
    selBox();
    paint();
    panelUpd(true);
    rowFocus('b' + best.id);
    if (best.k === 'SIGAB' && !AN.view) {
      const st = S.rt.st[best.id];
      st.val = st.val ? 0 : 1;
      (sv(sh).ai = sv(sh).ai || {})[best.id] = st.val;
      anSave();
      settle();
      msg('SIG.AB ' + (best.txt.find(q => !/SIG/i.test(q)) || '') + ' → ' + st.val);
      return;
    }
    panelFor(true);
    return;
  }
  /* a tag written on a digital wire */
  for (let n = 0; n < S.lab.length; n++) {
    const l = S.lab[n];
    if (!l || !S.nets[n].dig) continue;
    const h = l.h || 2.6;
    if (x >= l.x - 0.6 && x <= l.x + l.t.length * h * 0.62 + 0.6 && y >= l.y - h * 0.3 && y <= l.y + h * 1.15) {
      digClick(sh, n, e.shiftKey);
      return;
    }
  }
  const cd = new Map();
  for (const s2 of S.seg) {
    const d = anPtSeg(x, y, s2);
    if (d < tol) {
      const o = cd.get(s2.net);
      if (o === undefined || d < o) cd.set(s2.net, d);
    }
  }
  const cl = [...cd.entries()].sort((a, b) => a[1] - b[1]).map(q => q[0]);
  let bn = cl.length ? cl[0] : null,
    cyc = false;
  if (cl.length > 1) {
    const key = cl.join(','),
      pk = AN._pk;
    if (pk && pk.sh === sh.name && pk.key === key && Math.hypot(pk.x - x, pk.y - y) < tol * 0.8) {
      pk.i = (pk.i + 1) % cl.length;
    } else AN._pk = { sh: sh.name, x, y, key, i: 0 };
    bn = cl[AN._pk.i];
    cyc = true;
    msg('Several wires are here (' + (AN._pk.i + 1) + ' of ' + cl.length + '): click again for the next one.');
  } else AN._pk = null;
  if (bn != null && S.nets[bn].dig && !cyc) {
    digClick(sh, bn, e.shiftKey);
    return;
  }
  AN.sel = bn != null ? { net: bn } : null;
  selBox();
  paint();
  panelUpd(true);
  panelFor(!!AN.sel);
}
addEventListener(
  'keydown',
  e => {
    if (!live()) return;
    const a = document.activeElement,
      ed = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
    if (ed) return;
    e.stopPropagation();
    if (e.key === 'PageDown' || e.key === 'ArrowRight') go(anNb(1));
    else if (e.key === 'PageUp' || e.key === 'ArrowLeft') go(anNb(-1));
    else if (e.key === ' ') {
      e.preventDefault();
      bRun.click();
    } else if (e.key === 'f' || e.key === 'F') {
      fitView();
    }
  },
  true
);
addEventListener('resize', () => {
  if (!live()) return;
  const sh = cs(),
    v = sh && AN.av[sh.name],
    r = $('svg').getBoundingClientRect();
  if (!v || !r.width || !r.height) return;
  if (AN.sz && AN.sz.w && Math.abs(AN.sz.w - r.width) > 1)
    v[2] *= r.width / AN.sz.w; /* panel opens / closes: keep the zoom, do not rescale the drawing */
  v[3] = (v[2] * r.height) / r.width;
  AN.sz = { w: r.width, h: r.height };
  $('svg').setAttribute('viewBox', v.join(' '));
});
/* ---------- toolbar actions ---------- */
bRun.onclick = () => {
  AN.run = !AN.run;
  bRun.textContent = AN.run ? '❚❚ Pause' : '▶ Run';
  bRun.classList.toggle('on', AN.run);
};
sSpd.onchange = () => {
  AN.spd = +sSpd.value;
};
/* 3.2.0-beta.13: the Reset button ends the starting state too (the plant is no longer at 150 MW / Cold): the next RUN
   starts the plant cold (trace.js coldIfNone), so after a Reset MSP is 0 again, not the loop model's middle of the range */
bRst.onclick = () => {
  AN.startState = null;
  reset();
  /* 3.2.0-beta.18: and the plant is COLD at once (VIEW shows boiler off, not the drawings' defaults MSP 75) */
  const p = coldIfNone();
  if (p)
    p.then(ok => {
      if (!ok) return;
      settle();
      paint();
      panelUpd(true);
    });
};
bFit.onclick = fitView;
bVal.onclick = () => {
  AN.vals = !AN.vals;
  bVal.classList.toggle('on', AN.vals);
  paint();
};
bRv.onclick = () => {
  AN.rv = !AN.rv;
  bRv.classList.toggle('on', AN.rv);
  try {
    localStorage.setItem('ls-reviewmarks', AN.rv ? '1' : '0');
  } catch (e) {}
  paint();
};
{
  let v = null;
  try {
    v = localStorage.getItem('ls-reviewmarks');
  } catch (e) {}
  AN.rv = v !== '0';
  bRv.classList.toggle('on', AN.rv);
}
bWv.onclick = () => {
  AN.wireVals = !AN.wireVals;
  bWv.classList.toggle('on', AN.wireVals);
  try {
    localStorage.setItem('ls-wirevals', AN.wireVals ? '1' : '0');
  } catch (e) {}
  paint();
};
{
  let v = null;
  try {
    v = localStorage.getItem('ls-wirevals');
  } catch (e) {}
  AN.wireVals = v !== '0';
  bWv.classList.toggle('on', AN.wireVals);
}
const ptab = h$('button', { id: 'anptab', txt: '◀ Inspector', title: 'Show the Inspector / Faceplate' });
document.body.append(ptab);
ptab.onclick = () => {
  AN.tmp = false;
  showPanel(true);
};
/* AUTO-HIDE mode: the panel floats OVER the drawing, so the drawing never changes size / jumps when you select or unselect something */
function panelFor(on) {
  if (AN.ah) {
    showPanel(on);
    return;
  }
  /* 2.4.1-beta.3 (user): Auto-hide OFF = the panel never minimizes by itself; a click on a block opens it and it stays */
  if (on && anp.classList.contains('min')) showPanel(true);
}
function showPanel(on) {
  if (!on) AN.tmp = false;
  const ov = !!AN.ah || !!AN.tmp;
  ptab.style.display = !on && AN.cat === 'an' ? 'block' : 'none';
  anp.classList.toggle('ov', ov);
  if (ov) {
    const r = $('cv').getBoundingClientRect();
    anp.style.top = r.top + 'px';
    anp.style.bottom = Math.max(0, innerHeight - r.bottom) + 'px';
  } else {
    anp.style.top = '';
    anp.style.bottom = '';
  }
  const was = anp.classList.contains('min');
  anp.classList.toggle('min', !on);
  bPn.classList.toggle('on', on);
  if (!ov && was !== !on) setTimeout(() => dispatchEvent(new Event('resize')), 30);
}
AN.ah = false;
try {
  AN.ah = localStorage.getItem('ditl.an.ah') === '1';
} catch (e) {}
bPn.onclick = () => {
  AN.tmp = false;
  showPanel(anp.classList.contains('min'));
};
/* 2.5.0-beta.20 (UI audit): up to 1180 px the panel is a drawer OVER the drawing: closed at the start, a click on a block or a
   wire opens it (an empty panel covered half of the sheet on a tablet standing up and on a phone) */
if (matchMedia('(max-width:1180px)').matches) showPanel(false);
setInterval(() => {
  if (!live() || !AN.run || AN._loading) return;
  const sh = cs();
  if (!sh || !sh.S) return;
  const dt = 0.1 * AN.spd,
    n = Math.max(1, Math.ceil(dt / 0.5));
  histRec(sh, 1);
  const t0_ = performance.now(),
    K = AN.tierK || 1;
  for (let i = 0; i < n; i++) {
    if (K > 1) stepTier(sh, dt / n, K);
    else stepSet(sh, dt / n);
    /* 3.2.0-beta.21: the Training coach (src/ui/training/guide.js) acts after each step, at the time of the plant */
    if (AN.onStep)
      try {
        AN.onStep(dt / n);
      } catch (e) {}
  }
  paint();
  panelUpd();
  {
    const ms = performance.now() - t0_;
    AN._ms = AN._ms == null ? ms : AN._ms * 0.85 + ms * 0.15;
    if (!AN.tierLock && (AN._tn = (AN._tn || 0) + 1) % 10 === 0) {
      const k = AN.tierK || 1;
      AN.tierK = AN._ms > 35 ? Math.min(6, k + 1) : AN._ms < 14 ? Math.max(1, k - 1) : k;
    }
  }
}, 100);
