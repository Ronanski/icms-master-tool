/* NEW PLANT HMI (2026-10-26, roadmap step 6, sample): the plant screens REDRAWN with our own vector graphics (user 2026-10-26:
   "new HMI using your own graphics, guide lang ang snapshots"). The control-room snapshots (document-references/hmi-snapshot-
   sample.zip) are only the guide for the system: equipment, flow paths, instruments.
   Art (5th pass, 2026-10-27): the user approved the flow and rejected the art ("gawang bata"). The drawing follows the project's
   HMI art spec and symbol library (docs/hmi/HMI_ART_SPEC.md and docs/hmi/symbols/, PR #51): one light from the top left,
   3 ~ 4 stop gradients, 1 px dark outline on every equipment; background #1b2128; ducts as solid gradient channels (14 px main,
   10 px branch) with small static chevrons, flat dark grey without flow; fan = volute with the motor coupled under it, the
   state as a 3 px band under the motor (red running, green stopped: plant convention); damper = frame with 3 blades turned
   by the real position; values light grey mono on a near-black box; faceplates on the mimic with PV / SV / MV and an
   outline-only mode pill (MAN amber, AUT grey, CAS blue); saturated colour only for alarms and run state; nothing moves
   except the alarm blink. The sprite below is docs/hmi/symbols/hmi-symbols.svg (hs-bank and hs-furnace stretch to their box).
   plant.js draws a system with `v2: true` through PLANT_V2.draw (the old screens are not touched). */
(function () {
  const C = {
    bg: '#1b2128',
    frame: '#12171d',
    out: '#0c1014',
    name: '#dfe6ec',
    lab: '#aeb9c4',
    tag: '#7f8b97',
    unit: '#8b97a3',
    box: '#0d1116',
    boxs: '#3a4550',
    val: '#e8eef3',
    sv: '#b8c7d6',
    none: '#59636d',
    run: '#d64545',
    stop: '#3fa34d',
    alarm: '#e5484d',
    warn: '#f5a524',
    cas: '#6cb4ff',
    aut: '#c3ccd5',
    off: '#3a424b',
    sol: '#7a6a4c'
  };
  const NS = 'http://www.w3.org/2000/svg';
  const S_ = (t, a) => {
    const e = document.createElementNS(NS, t);
    for (const k in a || {}) e.setAttribute(k, a[k]);
    return e;
  };
  const fmt = (x, dp) => (x == null || !isFinite(x) ? '-----' : (+x).toFixed(dp).replace(/^-(0(?:\.0+)?)$/, '$1'));
  const UF = "Inter, 'Segoe UI', Roboto, Arial, sans-serif",
    MF = "'JetBrains Mono', Consolas, 'Roboto Mono', monospace";
  const SPRITE = `<defs>
<linearGradient id="hsSteelX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a545e"/><stop offset="0.3" stop-color="#8d99a5"/><stop offset="0.62" stop-color="#6c7783"/><stop offset="1" stop-color="#3b444d"/></linearGradient>
<linearGradient id="hsSteelY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a545e"/><stop offset="0.3" stop-color="#8d99a5"/><stop offset="0.62" stop-color="#6c7783"/><stop offset="1" stop-color="#3b444d"/></linearGradient>
<linearGradient id="hsCase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a646e"/><stop offset="1" stop-color="#424b54"/></linearGradient>
<linearGradient id="hsCaseX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4e5862"/><stop offset="0.5" stop-color="#5d6771"/><stop offset="1" stop-color="#434c55"/></linearGradient>
<linearGradient id="hsConc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#585e64"/><stop offset="0.35" stop-color="#7b8187"/><stop offset="1" stop-color="#4c5157"/></linearGradient>
<linearGradient id="hsAirY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c566e"/><stop offset="0.35" stop-color="#6a88a2"/><stop offset="0.7" stop-color="#4d6a84"/><stop offset="1" stop-color="#334a5f"/></linearGradient>
<linearGradient id="hsAirX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3c566e"/><stop offset="0.35" stop-color="#6a88a2"/><stop offset="0.7" stop-color="#4d6a84"/><stop offset="1" stop-color="#334a5f"/></linearGradient>
<linearGradient id="hsHotY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5136"/><stop offset="0.35" stop-color="#a0805a"/><stop offset="0.7" stop-color="#806446"/><stop offset="1" stop-color="#5a442e"/></linearGradient>
<linearGradient id="hsHotX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a5136"/><stop offset="0.35" stop-color="#a0805a"/><stop offset="0.7" stop-color="#806446"/><stop offset="1" stop-color="#5a442e"/></linearGradient>
<linearGradient id="hsGasY" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55514d"/><stop offset="0.35" stop-color="#7f7973"/><stop offset="0.7" stop-color="#655f5a"/><stop offset="1" stop-color="#4a4642"/></linearGradient>
<linearGradient id="hsGasX" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#55514d"/><stop offset="0.35" stop-color="#7f7973"/><stop offset="0.7" stop-color="#655f5a"/><stop offset="1" stop-color="#4a4642"/></linearGradient>
<linearGradient id="hsBed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e5d47"/><stop offset="1" stop-color="#4f4233"/></linearGradient>
<pattern id="hsWW" width="4" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="#363e46"/><rect x="1.5" width="1" height="8" fill="#46505a"/></pattern>
<pattern id="hsElem" width="6" height="3" patternUnits="userSpaceOnUse"><rect width="6" height="3" fill="#3b444c"/><rect y="1" width="6" height=".6" fill="#4b555e"/></pattern>
<pattern id="hsTube" width="5" height="6" patternUnits="userSpaceOnUse"><rect width="5" height="6" fill="#343c44"/><rect x="2" width="1" height="6" fill="#4a545e"/></pattern>
</defs>
<symbol id="hs-fan" viewBox="0 0 84 84" overflow="visible">
<path d="M40 6H80V22H62A31 31 0 0 1 71 46A33 33 0 0 1 40 79A35 35 0 0 1 5 45A38 38 0 0 1 40 6Z" fill="url(#hsSteelY)" stroke="#0c1014" stroke-width="1"/>
<path d="M62 22A31 31 0 0 1 71 46" fill="none" stroke="#9aa6b2" stroke-opacity=".35" stroke-width="1"/>
<rect x="78" y="6" width="3" height="16" fill="#3b444d" stroke="#0c1014" stroke-width=".8"/>
<circle cx="40" cy="45" r="15" fill="#2a3138" stroke="#0c1014" stroke-width="1"/>
<circle cx="40" cy="45" r="15" fill="none" stroke="#8d99a5" stroke-opacity=".25" stroke-width="2"/>
<g stroke="#7d8996" stroke-width="1" fill="none" stroke-linecap="round">
<path d="M40 39Q43.5 36 44.5 32" transform="rotate(0 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(45 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(90 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(135 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(180 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(225 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(270 40 45)"/><path d="M40 39Q43.5 36 44.5 32" transform="rotate(315 40 45)"/>
</g>
<circle cx="40" cy="45" r="4.2" fill="#6c7783" stroke="#0c1014" stroke-width=".8"/>
</symbol>
<symbol id="hs-motor" viewBox="0 0 44 26" overflow="visible">
<line x1="0" y1="13" x2="6" y2="13" stroke="#8d99a5" stroke-width="2.4"/>
<rect x="6" y="3" width="30" height="20" rx="2" fill="url(#hsSteelY)" stroke="#0c1014" stroke-width="1"/>
<g stroke="#0c1014" stroke-opacity=".45" stroke-width=".8"><line x1="11" y1="5" x2="11" y2="21"/><line x1="15" y1="5" x2="15" y2="21"/><line x1="19" y1="5" x2="19" y2="21"/><line x1="23" y1="5" x2="23" y2="21"/><line x1="27" y1="5" x2="27" y2="21"/></g>
<rect x="36" y="6" width="5" height="14" rx="1.5" fill="#4a545e" stroke="#0c1014" stroke-width=".8"/>
<rect class="hs-st" x="8" y="24.5" width="26" height="3" rx="1" fill="#59636d"/>
</symbol>
<symbol id="hs-damper" viewBox="0 -16 36 46" overflow="visible">
<rect x="2" y="0" width="32" height="14" fill="none" stroke="#b9c3cc" stroke-width="1"/>
<line x1="2" y1="-2" x2="2" y2="16" stroke="#b9c3cc" stroke-width="1.6"/>
<line x1="34" y1="-2" x2="34" y2="16" stroke="#b9c3cc" stroke-width="1.6"/>
<line x1="18" y1="0" x2="18" y2="-6" stroke="#8d99a5" stroke-width="1"/>
<rect x="11" y="-16" width="14" height="10" rx="1" fill="#4a545e" stroke="#0c1014" stroke-width=".8"/>
<text x="18" y="-8.2" text-anchor="middle" style="font-family:Inter,'Segoe UI',Roboto,Arial,sans-serif;font-size:7.5px;font-weight:600" fill="#dfe6ec">M</text>
</symbol>
<symbol id="hs-cv" viewBox="0 0 28 30" overflow="visible">
<line x1="14" y1="20" x2="14" y2="8" stroke="#aab4be" stroke-width="1"/>
<path d="M5 8A9 6.5 0 0 1 23 8Z" fill="#59636d" stroke="#aab4be" stroke-width="1"/>
<path class="hs-vb" d="M2 14L14 20L2 26ZM26 14L14 20L26 26Z" fill="#c3ccd5" stroke="#aab4be" stroke-width="1" stroke-linejoin="round"/>
</symbol>
<symbol id="hs-mov" viewBox="0 0 28 30" overflow="visible">
<line x1="14" y1="20" x2="14" y2="11" stroke="#aab4be" stroke-width="1"/>
<rect x="7" y="1" width="14" height="10" rx="1" fill="#4a545e" stroke="#aab4be" stroke-width="1"/>
<text x="14" y="8.8" text-anchor="middle" style="font-family:Inter,'Segoe UI',Roboto,Arial,sans-serif;font-size:7.5px;font-weight:600" fill="#dfe6ec">M</text>
<path class="hs-vb" d="M2 14L14 20L2 26ZM26 14L14 20L26 26Z" fill="#c3ccd5" stroke="#aab4be" stroke-width="1" stroke-linejoin="round"/>
</symbol>
<symbol id="hs-inst" viewBox="0 0 20 20" overflow="visible">
<circle cx="10" cy="10" r="9" fill="#1b2128" stroke="#8794a1" stroke-width="1"/>
</symbol>
<symbol id="hs-intake" viewBox="0 0 30 40" overflow="visible">
<rect x="1" y="1" width="28" height="38" rx="1" fill="url(#hsCase)" stroke="#0c1014" stroke-width="1"/>
<g stroke="#2c333a" stroke-width="2"><line x1="5" y1="12" x2="25" y2="8"/><line x1="5" y1="19" x2="25" y2="15"/><line x1="5" y1="26" x2="25" y2="22"/><line x1="5" y1="33" x2="25" y2="29"/></g>
<g stroke="#8d99a5" stroke-opacity=".5" stroke-width=".8"><line x1="5" y1="10.8" x2="25" y2="6.8"/><line x1="5" y1="17.8" x2="25" y2="13.8"/><line x1="5" y1="24.8" x2="25" y2="20.8"/><line x1="5" y1="31.8" x2="25" y2="27.8"/></g>
</symbol>
<symbol id="hs-aph" viewBox="0 0 160 210" overflow="visible">
<path d="M14 18H146L138 34H22Z" fill="url(#hsCase)" stroke="#0c1014"/>
<path d="M22 176H138L146 192H14Z" fill="url(#hsCase)" stroke="#0c1014"/>
<rect x="18" y="34" width="124" height="142" fill="url(#hsCaseX)" stroke="#0c1014"/>
<rect x="26" y="44" width="108" height="56" fill="url(#hsElem)" stroke="#2a3138"/>
<rect x="26" y="110" width="108" height="56" fill="url(#hsElem)" stroke="#2a3138"/>
<line x1="80" y1="34" x2="80" y2="176" stroke="#2a3138" stroke-width="3"/>
<line x1="80" y1="34" x2="80" y2="176" stroke="#8d99a5" stroke-opacity=".3" stroke-width="1"/>
<line x1="18" y1="105" x2="80" y2="105" stroke="#2a3138" stroke-width="2"/>
<rect x="72" y="2" width="16" height="16" fill="url(#hsSteelX)" stroke="#0c1014"/>
<rect x="72" y="192" width="16" height="12" fill="url(#hsSteelX)" stroke="#0c1014"/>
</symbol>
<symbol id="hs-esp" viewBox="0 0 230 160" overflow="visible">
<path d="M0 38L30 24V98L0 84Z" fill="url(#hsCase)" stroke="#0c1014"/>
<path d="M230 38L200 24V98L230 84Z" fill="url(#hsCase)" stroke="#0c1014"/>
<rect x="30" y="20" width="170" height="82" fill="url(#hsCase)" stroke="#0c1014"/>
<rect x="30" y="20" width="170" height="3" fill="#8d99a5" fill-opacity=".35"/>
<rect x="34" y="27" width="51" height="70" fill="url(#hsTube)" opacity=".7"/>
<rect x="50" y="6" width="19" height="14" rx="1" fill="#4a545e" stroke="#0c1014" stroke-width=".8"/>
<line x1="59.5" y1="2" x2="59.5" y2="6" stroke="#aab4be" stroke-width="1.6"/>
<path d="M36 102H83L67 146H52Z" fill="url(#hsCaseX)" stroke="#0c1014"/>
<rect x="56" y="146" width="7" height="8" fill="#3b444d" stroke="#0c1014" stroke-width=".8"/><rect x="89.3" y="27" width="51" height="70" fill="url(#hsTube)" opacity=".7"/>
<rect x="105.3" y="6" width="19" height="14" rx="1" fill="#4a545e" stroke="#0c1014" stroke-width=".8"/>
<line x1="114.8" y1="2" x2="114.8" y2="6" stroke="#aab4be" stroke-width="1.6"/>
<path d="M91.3 102H138.3L122.3 146H107.3Z" fill="url(#hsCaseX)" stroke="#0c1014"/>
<rect x="111.3" y="146" width="7" height="8" fill="#3b444d" stroke="#0c1014" stroke-width=".8"/><rect x="144.6" y="27" width="51" height="70" fill="url(#hsTube)" opacity=".7"/>
<rect x="160.6" y="6" width="19" height="14" rx="1" fill="#4a545e" stroke="#0c1014" stroke-width=".8"/>
<line x1="170.1" y1="2" x2="170.1" y2="6" stroke="#aab4be" stroke-width="1.6"/>
<path d="M146.6 102H193.6L177.6 146H162.6Z" fill="url(#hsCaseX)" stroke="#0c1014"/>
<rect x="166.6" y="146" width="7" height="8" fill="#3b444d" stroke="#0c1014" stroke-width=".8"/>
<line x1="85.3" y1="20" x2="85.3" y2="102" stroke="#0c1014"/><line x1="140.6" y1="20" x2="140.6" y2="102" stroke="#0c1014"/>
</symbol>
<symbol id="hs-furnace" viewBox="0 0 170 430" preserveAspectRatio="none" overflow="visible">
<rect x="10" y="0" width="150" height="292" fill="url(#hsWW)" stroke="#0c1014"/>
<rect x="10" y="0" width="6" height="292" fill="url(#hsSteelX)"/><rect x="154" y="0" width="6" height="292" fill="url(#hsSteelX)"/>
<rect x="10" y="0" width="150" height="6" fill="url(#hsSteelY)"/>
<path d="M10 292H160L134 372H36Z" fill="#3e3b39" stroke="#0c1014"/>
<path d="M16 292H154" stroke="#2a2725" stroke-width="2"/>
<rect x="38" y="356" width="94" height="14" fill="url(#hsBed)"/>
<line x1="36" y1="372" x2="134" y2="372" stroke="#aab4be" stroke-width="1.4" stroke-dasharray="3 2"/>
<rect x="34" y="374" width="102" height="40" rx="2" fill="url(#hsCase)" stroke="#0c1014"/>
</symbol>
<symbol id="hs-cyclone" viewBox="0 0 100 270" overflow="visible">
<rect x="36" y="0" width="28" height="34" fill="url(#hsSteelX)" stroke="#0c1014"/>
<rect x="14" y="30" width="72" height="92" fill="url(#hsSteelX)" stroke="#0c1014"/>
<path d="M14 122H86L56 210H44Z" fill="url(#hsSteelX)" stroke="#0c1014"/>
<rect x="44" y="210" width="12" height="54" fill="url(#hsSteelX)" stroke="#0c1014"/>
<rect x="0" y="40" width="14" height="34" fill="url(#hsSteelX)" stroke="#0c1014"/>
</symbol>
<symbol id="hs-stack" viewBox="0 0 60 400" overflow="visible">
<path d="M15 6H45L56 400H4Z" fill="url(#hsConc)" stroke="#0c1014"/>
<rect x="13" y="0" width="34" height="8" rx="1" fill="#3f4449" stroke="#0c1014"/>
</symbol>
<symbol id="hs-drum" viewBox="0 0 180 36" overflow="visible">
<rect x="1" y="1" width="178" height="34" rx="17" fill="url(#hsSteelY)" stroke="#0c1014"/>
<line x1="20" y1="18" x2="160" y2="18" stroke="#2a3138" stroke-opacity=".5"/>
</symbol>
<symbol id="hs-bank" viewBox="0 0 100 60" preserveAspectRatio="none" overflow="visible">
<rect x="0" y="0" width="100" height="60" fill="#2c333a" stroke="#4a545e"/>
<g fill="none" stroke="#56616c" stroke-width="1.2"><path d="M8 6V54"/><path d="M20 6V54"/><path d="M32 6V54"/><path d="M44 6V54"/><path d="M56 6V54"/><path d="M68 6V54"/><path d="M80 6V54"/><path d="M92 6V54"/></g>
<g fill="none" stroke="#56616c" stroke-width="1.2"><path d="M8 54Q14 60 20 54M20 6Q26 0 32 6"/><path d="M32 54Q38 60 44 54M44 6Q50 0 56 6"/><path d="M56 54Q62 60 68 54M68 6Q74 0 80 6"/><path d="M80 54Q86 60 92 54M92 6Q98 0 104 6"/></g>
</symbol>`;
  const DEFS =
    SPRITE +
    `<style>
      .h2blink{animation:h2blink 1s steps(2,start) infinite}
      @keyframes h2blink{to{visibility:hidden}}
      @media (prefers-reduced-motion:reduce){.h2blink{animation:none}}
      .h2btn:hover rect{fill:#2b343e}
    </style>`;
  /* ---- the symbol library: every screen is made of these ---- */
  function lib(g, api) {
    const L = {};
    const add = (t, a, p) => {
      const e = S_(t, a);
      (p || g).append(e);
      return e;
    };
    L.add = add;
    L.text = (x, y, s, o) => {
      o = o || {};
      const t = add('text', { x, y, fill: o.c || C.name, 'font-size': o.z || 10.5, 'font-family': o.mono ? MF : UF, 'font-weight': o.b ? 600 : 400, 'text-anchor': o.a || 'start', 'letter-spacing': o.ls || 0 }, o.p);
      t.textContent = s;
      return t;
    };
    L.line = (p, o) => {
      o = o || {};
      return add('polyline', { points: p.map(q => q.join(',')).join(' '), fill: 'none', stroke: o.c || '#5b6774', 'stroke-width': o.w || 0.75, 'stroke-dasharray': o.dash || '' }, o.p);
    };
    L.rect = (x, y, w, h, o) => {
      o = o || {};
      return add('rect', { x, y, width: w, height: h, rx: o.rx || 0, fill: o.f || 'url(#hsCase)', stroke: o.s || C.out, 'stroke-width': o.sw == null ? 1 : o.sw }, o.p);
    };
    L.path = (d, o) => {
      o = o || {};
      return add('path', { d, fill: o.f || 'url(#hsCase)', stroke: o.s || C.out, 'stroke-width': o.sw == null ? 1 : o.sw }, o.p);
    };
    /* a symbol of the library at x, y in a w x h box */
    L.use = (id, x, y, w, h, p) => add('use', { href: '#' + id, x, y, width: w, height: h }, p);
    /* equipment name: caps, 600, outside or beside the equipment */
    L.name = (x, y, s, o) => L.text(x, y, s, Object.assign({ z: 11, b: 1, a: 'middle', ls: 0.3 }, o || {}));
    L.note = (x, y, s, o) => L.text(x, y, s, Object.assign({ z: 9.5, c: C.lab }, o || {}));
    /* flow signal: a live 0 / 1 (running bit, or flow > gt) that turns the ducts on / off */
    L.flow = (ref, tag, gt) => {
      const f = { sub: [] };
      api.reg({ t: 'val', tag: tag || '', ref, v: '' }, X => {
        const on = !X || !isFinite(X.v) ? true : X.v > (gt != null ? gt : 0.5);
        for (const s of f.sub) s(on);
      }, null);
      return f;
    };
    /* duct: solid gradient channel along orthogonal points (each leg a bar, the joints overlap), small static chevrons that
       show the direction; flat dark grey without flow. `bridge` = a gap in what it crosses */
    const MED = { air: 'hsAir', hot: 'hsHot', gas: 'hsGas' };
    L.duct = (k, p, o) => {
      o = o || {};
      const w = o.w || 12,
        h = w / 2,
        gg = add('g', {}),
        bars = [],
        chev = [];
      for (let i = 1; i < p.length; i++) {
        const [a, b] = [p[i - 1], p[i]],
          hor = a[1] === b[1],
          x0 = Math.min(a[0], b[0]) - (hor ? 0 : h),
          y0 = Math.min(a[1], b[1]) - (hor ? h : 0),
          ln = hor ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]),
          ext = (i > 1 ? h : 0) + (i < p.length - 1 ? h : 0),
          st = i > 1 ? h : 0;
        const r = hor
          ? { x: (a[0] < b[0] ? a[0] - st : b[0] - (i < p.length - 1 ? h : 0)), y: y0, width: ln + ext, height: w }
          : { x: x0, y: (a[1] < b[1] ? a[1] - st : b[1] - (i < p.length - 1 ? h : 0)), width: w, height: ln + ext };
        const fill = MED[k] ? 'url(#' + MED[k] + (hor ? 'Y' : 'X') + ')' : C.sol;
        bars.push([add('rect', Object.assign(r, { fill, stroke: C.out, 'stroke-width': 0.8 }), gg), fill]);
        /* chevrons: one per ~200 px, at least one on a long leg */
        if (o.chev !== false && ln >= 90) {
          const n = Math.max(1, Math.round(ln / 200)),
            an = Math.atan2(b[1] - a[1], b[0] - a[0]) * (180 / Math.PI);
          for (let j = 0; j < n; j++) {
            const t = (j + 0.5) / n,
              cx = a[0] + (b[0] - a[0]) * t,
              cy = a[1] + (b[1] - a[1]) * t;
            chev.push(add('path', { d: 'M-3 -4L2 0L-3 4', transform: `translate(${cx} ${cy}) rotate(${an})`, fill: 'none', stroke: '#e3e8ec', 'stroke-opacity': 0.55, 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, gg));
          }
        }
      }
      if (o.bridge) {
        /* a dark gap around this duct over the duct it crosses */
        const bk = S_('g', {});
        for (const [r] of bars) {
          const c = r.cloneNode();
          c.setAttribute('fill', C.bg);
          c.setAttribute('stroke', C.bg);
          c.setAttribute('stroke-width', 6);
          bk.append(c);
        }
        gg.prepend(bk);
      }
      if (o.f)
        o.f.sub.push(on => {
          for (const [r, f0] of bars) r.setAttribute('fill', on ? f0 : C.off);
          for (const c of chev) c.setAttribute('visibility', on ? 'visible' : 'hidden');
        });
      return gg;
    };
    /* DCS value: tag above, near-black box, light mono value, unit outside; "-----" = no DCS signal */
    L.val = (x, y, tag, u, o) => {
      o = o || {};
      const w = o.w || 60,
        dp = o.dp != null ? o.dp : 1;
      if (!o.notag) L.text(x, y - 4, o.label || tag, { z: 10, c: C.tag });
      const r = L.rect(x, y, w, 18, { f: C.box, s: C.boxs, rx: 1.5 });
      const v = L.text(x + w - 4, y + 13.6, '-----', { z: 13, mono: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 4, y + 13.2, u, { z: 10, c: C.unit });
      api.reg(
        { t: 'val', tag, ref: o.ref, v: '' },
        X => {
          const ok = X && isFinite(X.v);
          v.textContent = ok ? fmt(X.v, dp) : '-----';
          v.setAttribute('fill', ok ? C.val : C.none);
          if (o.on) o.on(ok ? +X.v : null);
        },
        r
      );
      add('title', {}, r).textContent = tag + (o.desc ? ' · ' + o.desc : '');
    };
    /* a value used only for a calculation on the screen: registered, not drawn */
    L.hidden = (tag, on, ref) => api.reg({ t: 'val', tag, ref, v: '' }, X => on(X && isFinite(X.v) ? +X.v : null), null);
    /* a value calculated on the screen from live tags (not a DCS signal): same box, set by the caller */
    L.calc = (x, y, label, u, o) => {
      o = o || {};
      const w = o.w || 60,
        dp = o.dp != null ? o.dp : 1;
      if (label) L.text(x, y - 4, label, { z: 10, c: C.tag });
      const r = L.rect(x, y, w, 18, { f: C.box, s: C.boxs, rx: 1.5 });
      add('title', {}, r).textContent = (o.desc || label) + ' (calculated on this screen)';
      const v = L.text(x + w - 4, y + 13.6, '-----', { z: 13, mono: 1, c: C.none, a: 'end' });
      if (u) L.text(x + w + 4, y + 13.2, u, { z: 10, c: C.unit });
      return x2 => {
        v.textContent = x2 == null ? '-----' : fmt(x2, dp);
        v.setAttribute('fill', x2 == null ? C.none : C.val);
      };
    };
    /* fan (hs-fan, size s) centred on its impeller at cx, cy; the outlet is at the top right (returned); the motor (hs-motor)
       coupled under it with the run band (red running, green stopped, grey no signal); `hc` = hydraulic coupling between */
    L.fan = (cx, cy, s, tag, name, o) => {
      o = o || {};
      const k = s / 84,
        x = cx - 40 * k,
        y = cy - 45 * k;
      const yb = y + 79 * k;
      const mk = o.mk || Math.max(0.45, Math.min(0.85, k * 1.05)),
        mw = 44 * mk,
        mh = 26 * mk;
      let my = yb + 3;
      L.line([[cx, yb - 2], [cx, my + (o.hc ? 18 : 2)]], { c: '#8d99a5', w: 2.4 });
      if (o.hc) {
        L.rect(cx - 14, my, 28, 15, { f: '#4a545e', rx: 1 });
        L.text(cx, my + 11, 'HC', { z: 8.5, b: 1, a: 'middle', c: C.name });
        my += 18;
      }
      const casing = L.use('hs-fan', x, y, s, s);
      L.use('hs-motor', cx - 22 * mk, my, mw, mh);
      const band = L.rect(cx - 13 * mk, my + mh - 1.5 * mk + 1, 26 * mk, 3, { f: C.none, s: 'none', sw: 0, rx: 1 });
      L.name(o.lx != null ? o.lx : cx, o.ly != null ? o.ly : my + mh + 14, name, { a: o.la || 'middle' });
      api.reg(
        { t: 'fan', tag },
        X => {
          const ok = X && isFinite(X.v),
            on = ok && X.v > 0.5;
          band.setAttribute('fill', !ok ? C.none : on ? C.run : C.stop);
        },
        casing
      );
      add('title', {}, casing).textContent = name + ' · run state from the DCS logic (band under the motor: red = running, green = stopped)';
      return { ox: x + 81 * k, oy: y + 14 * k, ow: 16 * k, bottom: my + mh };
    };
    /* damper: frame with 3 blades that turn with the real position (90° = closed, 0° = open), actuator M on top; w x 14 box at
       x, y (top left of the duct); the % value above. Click = the faceplate of its controller */
    L.damper = (x, y, w, tag, o) => {
      o = o || {};
      const gg = add('g', { style: o.fp ? 'cursor:pointer' : '', transform: `translate(${x} ${y}) scale(${w / 36} 1)` });
      add('rect', { x: 0, y: -16, width: 36, height: 32, fill: '#000', 'fill-opacity': 0 }, gg);
      L.use('hs-damper', 0, -16, 36, 46, gg);
      const bl = [10, 18, 26].map(cx => [cx, add('line', { x1: cx - 3.5, y1: 7, x2: cx + 3.5, y2: 7, stroke: '#e3e8ec', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, gg)]);
      let vt = null;
      if (!o.novalue) {
        const bx = o.lx != null ? o.lx : x + w / 2 - 25,
          by = o.ly != null ? o.ly : y - 42;
        L.text(bx, by - 4, tag, { z: 10, c: C.tag });
        L.rect(bx, by, 46, 18, { f: C.box, s: C.boxs, rx: 1.5 });
        vt = L.text(bx + 42, by + 13.6, '-----', { z: 13, mono: 1, c: C.none, a: 'end' });
        L.text(bx + 50, by + 13.2, '%', { z: 10, c: C.unit });
      }
      api.reg(
        { t: 'damper', tag, ref: o.ref, v: '' },
        X => {
          const ok = X && isFinite(X.v),
            p = ok ? Math.max(0, Math.min(100, +X.v)) : 0,
            an = -90 + (p / 100) * 90;
          for (const [cx, l] of bl) l.setAttribute('transform', `rotate(${an} ${cx} 7)`);
          if (vt) {
            vt.textContent = ok ? fmt(p, 1) : '-----';
            vt.setAttribute('fill', ok ? C.val : C.none);
          }
        },
        null
      );
      if (o.fp) gg.addEventListener('click', e => (e.stopPropagation(), api.fp(o.fp)));
      add('title', {}, gg).textContent = tag + (o.desc ? ' · ' + o.desc : '') + (o.fp ? ' · click: faceplate of ' + o.fp : '');
    };
    /* faceplate on the mimic: tag, mode pill (outline only), PV / SV / MV; click = the full faceplate */
    L.fp = (x, y, tag, svc, u, o) => {
      o = o || {};
      const w = o.w || 132,
        gg = add('g', { style: 'cursor:pointer' });
      if (o.lead) L.line(o.lead, { dash: '3 2' });
      const r = L.rect(x, y, w, 58, { f: '#20272f', s: '#46525e', rx: 2, p: gg });
      L.text(x + 7, y + 13, tag, { z: 10.5, b: 1, p: gg });
      const pill = L.rect(x + w - 36, y + 4, 30, 12, { f: '#262d35', s: C.aut, rx: 2, p: gg });
      const pt = L.text(x + w - 21, y + 13, '---', { z: 8, b: 1, a: 'middle', c: C.aut, p: gg });
      const row = (yy, k, c) => {
        L.text(x + 7, yy, k, { z: 9, c: C.tag, p: gg });
        const t = L.text(x + w - 40, yy, '-----', { z: 11.5, mono: 1, a: 'end', c: C.none, p: gg });
        L.text(x + w - 36, yy, u, { z: 8.5, c: C.unit, p: gg });
        return [t, c];
      };
      const pv = row(y + 29, 'PV', C.val),
        sv = row(y + 41, 'SV', C.sv);
      L.text(x + 7, y + 53, 'MV', { z: 9, c: C.tag, p: gg });
      const bw = w - 82;
      L.rect(x + 24, y + 48, bw, 5, { f: C.box, s: C.boxs, sw: 0.6, p: gg });
      const bar = L.rect(x + 24, y + 48, 0, 5, { f: '#8fa4b8', s: 'none', sw: 0, p: gg });
      const mv = L.text(x + w - 14, y + 53, '-----', { z: 11.5, mono: 1, a: 'end', c: C.none, p: gg });
      L.text(x + w - 12, y + 53, '%', { z: 8.5, c: C.unit, p: gg });
      const dp = o.dp != null ? o.dp : 1;
      api.reg(
        { t: 'ctl', tag },
        X => {
          const ok = !!X,
            m = ok ? X.m : '';
          const [lab, fc, bc, tc] = m === 'M' ? ['MAN', '#2a2110', C.warn, C.warn] : m === 'R' ? ['CAS', '#10202e', C.cas, C.cas] : m === 'A' ? ['AUT', '#262d35', C.aut, C.aut] : ['---', '#262d35', C.none, C.none];
          pt.textContent = lab;
          pt.setAttribute('fill', tc);
          pill.setAttribute('fill', fc);
          pill.setAttribute('stroke', bc);
          for (const [t, c] of [pv, sv]) t.setAttribute('fill', ok ? c : C.none);
          pv[0].textContent = ok ? fmt(X.pv, dp) : '-----';
          sv[0].textContent = ok ? fmt(X.sv, dp) : '-----';
          const m0 = ok && isFinite(X.mv) ? Math.max(0, Math.min(100, X.mv)) : 0;
          bar.setAttribute('width', (bw * m0) / 100);
          mv.textContent = ok ? fmt(X.mv, 1) : '-----';
          mv.setAttribute('fill', ok ? C.val : C.none);
        },
        r
      );
      add('title', {}, r).textContent = tag + ' · ' + svc + ' · click: faceplate (A / M / R, SV, MV)';
    };
    /* data group: thin frame, title in the frame line */
    L.group = (x, y, w, h, title) => {
      L.rect(x, y, w, h, { f: 'none', s: '#3a4550', rx: 2 });
      add('rect', { x: x + 8, y: y - 7, width: title.length * 6.4 + 12, height: 14, fill: C.bg });
      L.text(x + 14, y + 4, title, { z: 10.5, b: 1, ls: 0.3 });
    };
    /* title bar with the process header (same signals as the control-room header) */
    L.title = (W, num, name) => {
      add('rect', { x: 0, y: 0, width: W, height: 36, fill: C.frame });
      add('rect', { x: 0, y: 36, width: W, height: 1, fill: '#2c3540' });
      L.text(14, 24, num + '  ' + name, { z: 15, b: 1, ls: 0.4 });
      const K = [
        ['MSP', 'kg/cm²', 1],
        ['MST', '°C', 0],
        ['MSF', 'T/H', 1],
        ['RHP', 'kg/cm²', 1],
        ['RHT', '°C', 0],
        ['COAL', 'T/H', 1],
        ['PWR', 'MW', 1]
      ];
      const x0 = 470,
        cw = (W - x0 - 8) / K.length;
      K.forEach(([k, u, dp], i) => {
        const xx = x0 + i * cw;
        L.text(xx, 23, k, { z: 10.5, b: 1, c: C.lab });
        L.rect(xx + 38, 8, 68, 20, { f: C.box, s: C.boxs, rx: 1.5 });
        const t = L.text(xx + 102, 23.2, '-----', { z: 14, mono: 1, c: C.none, a: 'end' });
        L.text(xx + 110, 23, u, { z: 9.5, c: C.unit });
        if (api.HDR[k])
          api.reg({ t: 'val', tag: k, ref: api.HDR[k], v: '' }, X => {
            const ok = X && isFinite(X.v);
            t.textContent = ok ? fmt(X.v, dp) : '-----';
            t.setAttribute('fill', ok ? C.val : C.none);
          }, null);
      });
    };
    /* alarm banner: one line; colour only while an alarm is active (high = red blinking, medium = amber) */
    L.banner = (W, y, rules) => {
      add('rect', { x: 0, y, width: W, height: 22, fill: '#161b21' });
      add('rect', { x: 0, y: y + 22, width: W, height: 1, fill: '#2c3540' });
      const txt = L.text(14, y + 15.5, 'NO ACTIVE ALARM', { z: 10.5, c: C.tag });
      const st = {};
      const upd = () => {
        const act = rules.filter(r => st[r.k]);
        txt.innerHTML = '';
        if (!act.length) {
          txt.textContent = 'NO ACTIVE ALARM';
          txt.setAttribute('fill', C.tag);
          return;
        }
        act.forEach((r, i) => {
          const s = S_('tspan', { fill: r.hi ? C.alarm : C.warn, 'font-weight': 600, dx: i ? 28 : 0 });
          s.textContent = (r.hi ? '■ ' : '▲ ') + r.msg;
          if (r.hi) s.setAttribute('class', 'h2blink');
          txt.append(s);
        });
      };
      for (const r of rules)
        api.reg({ t: 'val', tag: '', ref: r.ref, v: '' }, X => {
          const ok = X && isFinite(X.v);
          st[r.k] = ok && (r.when ? r.when(+X.v) : X.v > 0.5);
          upd();
        }, null);
    };
    /* navigation bar: buttons to the related screens (the old screens open until the new set replaces them) */
    L.nav = (W, y, items, here) => {
      add('rect', { x: 0, y, width: W, height: 36, fill: C.frame });
      add('rect', { x: 0, y, width: W, height: 1, fill: '#2c3540' });
      let x = 8;
      for (const [id, s] of items) {
        const w = 22 + s.length * 6.4,
          on = id === here,
          gg = add('g', { class: on ? '' : 'h2btn', style: on ? '' : 'cursor:pointer' });
        add('rect', { x, y: y + 6, width: w, height: 24, rx: 2, fill: on ? '#c3ccd5' : '#20272f', stroke: on ? '#c3ccd5' : '#46525e', 'stroke-width': 1 }, gg);
        L.text(x + w / 2, y + 22, s, { z: 10.5, b: 1, a: 'middle', c: on ? '#12171d' : C.name, p: gg });
        if (!on && api.go) gg.addEventListener('click', e => (e.stopPropagation(), api.go(id)));
        add('title', {}, gg).textContent = on ? 'this screen' : 'open ' + s;
        x += w + 4;
      }
    };
    L.C = C;
    return L;
  }
  /* ================= SCREEN: AIR & FLUE GAS (guide: snapshots 7.PNG 007, 8.PNG 008, 9.png 009, 38.PNG 038) =================
     Gas path: furnace -> cyclones A / B (solids back to the furnace through the loop seal, fluidized by the FA blowers) ->
     backpass (RH pass and SH pass, the RH / SH gas biasing dampers ABC-020, economizers) -> air heater H-1052 (gas side right,
     in at the top, out at the bottom) -> ESP Z-1010 -> IDF F-1056 (inlet vane PCD-FG1056-1 + hydraulic coupling, ABC-008
     PICFG108 / PICFG108A) -> stack. Air path (air side left of the air heater, like 038): SAF F-1054 (inlet damper
     MCV-FA1054-1, ABC-007 FICFA1081) and PAF F-1053 (MCV-FA1053-1, FICFA1071) -> SA section above, PA section below -> hot SA to
     the furnace walls (front / rear wall dampers, 008) and hot PA to the plenum under the bed. O2 trim AICFG112 (ABC-002).
     Run states: memory list M.3302 PAF / M.3303 SAF / M.3304 IDF / M.3308 FA-A / M.3309 FA-B; MFT M.0182 (ABC-007).
     Canvas 1600 x 960: title 0..36, alarms 37..59, process, navigation 924..960. */
  function airFlueGas(L, api) {
    const C = L.C,
      IDF = 'ABC-008|M.3304',
      PAF = 'ABC-007|M.3302',
      SAF = 'ABC-007|M.3303',
      fG = L.flow(IDF),
      fS = L.flow(SAF),
      fP = L.flow(PAF),
      fF = L.flow('', 'FIFA1055', 1);
    /* ===== furnace (hs-furnace stretched to 204 x 602: water walls to y 559, lower furnace, bed, plenum to 730) and drum ===== */
    L.use('hs-drum', 160, 96, 160, 30);
    for (const xx of [196, 240, 284]) L.rect(xx - 2, 126, 4, 24, { f: 'url(#hsSteelX)', sw: 0.6 });
    L.val(30, 104, 'LICBR1001', 'mm', { ref: 'pv:LICBR1001', label: 'DRUM LEVEL', desc: 'Drum level (LICBR1001 PV, ABC-010)' });
    L.use('hs-furnace', 138, 150, 204, 602);
    L.name(240, 186, 'FURNACE', { z: 12 });
    L.note(240, 202, 'CFB COMBUSTOR', { a: 'middle' });
    L.name(240, 726, 'PLENUM', { z: 10 });
    L.note(240, 664, 'BED', { a: 'middle', c: C.name });
    /* furnace pressure: three transmitters on the upper furnace */
    L.text(26, 168, 'FURNACE PRESSURE', { z: 10.5, b: 1 });
    [['PIFG1085', 'A', 196], ['PIFG1086', 'B', 236], ['PIFG10871', 'C', 276]].forEach(([t, s, yy]) => L.val(30, yy - 8, t, 'mmH2O', { desc: 'Furnace pressure (' + s + ')' }));
    /* bed differential pressure (plenum to upper bed) */
    L.text(26, 640, 'BED DP', { z: 10.5, b: 1 });
    L.val(30, 664, 'DPIFG1081', 'mmH2O', { dp: 0, desc: 'Furnace plenum / upper layer DP (A)' });
    L.val(30, 702, 'DPIFG1082', 'mmH2O', { dp: 0, desc: 'Furnace plenum / upper layer DP (B)' });
    /* ===== cyclone A / B (hs-cyclone 1.1x: inlet at y 202), loop seal, solids return, FA blowers ===== */
    L.duct('gas', [[318, 202], [372, 202]], { w: 14, chev: false, f: fG });
    L.use('hs-cyclone', 370, 140, 110, 297);
    L.name(492, 236, 'CYCLONE', { a: 'start', z: 10.5 });
    L.name(492, 250, 'A / B', { a: 'start', z: 10.5 });
    L.rect(396, 434, 60, 40, { rx: 2 });
    L.name(426, 451, 'LOOP', { z: 9 });
    L.name(426, 463, 'SEAL', { z: 9 });
    /* solids back to the furnace */
    L.duct('sol', [[396, 456], [346, 456], [346, 492], [326, 492]], { w: 5, chev: false });
    L.note(334, 448, 'SOLIDS', { z: 9 });
    /* FA blowers to the loop seal */
    L.duct('air', [[415, 518], [415, 498], [463, 498], [463, 518]], { w: 6, chev: false, f: fF });
    L.duct('air', [[439, 498], [439, 474]], { w: 6, chev: false, f: fF });
    const fa = L.fan(402, 540, 34, 'F-1055A FA BLOWER-A', 'FAB-A', { mk: 0.42, lx: 382, ly: 545, la: 'end' });
    L.fan(450, 540, 34, 'F-1055B FA BLOWER-B', 'FAB-B', { mk: 0.42, ly: 588 });
    void fa;
    L.val(478, 476, 'FIFA1055', 'T/H', { w: 52, desc: 'FA blower outlet common air flow' });
    L.fp(486, 528, 'FICFA1055A', 'FA blower A flow', 'T/H', { w: 120 });
    L.fp(612, 528, 'FICFA1055B', 'FA blower B flow', 'T/H', { w: 120 });
    /* gas: cyclone outlet up and over to the backpass */
    L.duct('gas', [[425, 140], [425, 96], [640, 96], [640, 124]], { w: 14, f: fG });
    /* ===== backpass: RH pass and SH pass, tube banks, gas biasing dampers, economizer, outlet hopper ===== */
    L.rect(572, 124, 196, 372, { f: 'url(#hsCaseX)' });
    L.rect(580, 150, 180, 338, { f: '#262d35', s: '#0c1014' });
    L.rect(668, 168, 4, 220, { f: '#4a545e', sw: 0 });
    L.name(670, 142, 'BACKPASS', { z: 10.5 });
    L.note(625, 164, 'RH PASS', { a: 'middle', z: 9 });
    L.note(715, 164, 'SH PASS', { a: 'middle', z: 9 });
    const bank = (x, y, w, h, name) => {
      L.use('hs-bank', x, y + 12, w, h - 12);
      L.text(x + w / 2, y + 9, name, { z: 9.5, a: 'middle', c: C.lab });
    };
    bank(590, 170, 70, 98, 'REHEATER');
    bank(680, 170, 70, 56, 'FINISH SH');
    bank(680, 228, 70, 40, 'ECO #3');
    bank(590, 274, 70, 48, 'ECO #2R');
    bank(680, 274, 70, 48, 'ECO #2S');
    L.damper(594, 356, 62, 'HICHR1002A', { ref: 'mv:HICHR1002A', fp: 'HICHR1002A', novalue: 1, desc: 'RH gas biasing damper' });
    L.damper(684, 356, 62, 'HICHR1002B', { ref: 'mv:HICHR1002B', fp: 'HICHR1002B', novalue: 1, desc: 'SH gas biasing damper' });
    bank(590, 400, 160, 80, 'ECO #1');
    L.path('M572,496 H768 L752,522 H728 Z', { f: 'url(#hsCase)' });
    L.fp(784, 320, 'HICHR1002A', 'RH gas biasing damper', '%', { lead: [[784, 349], [656, 363]] });
    L.fp(784, 386, 'HICHR1002B', 'SH gas biasing damper', '%', { lead: [[784, 412], [746, 370]] });
    /* ===== gas to the air heater; O2 at the air heater inlet ===== */
    L.duct('gas', [[740, 522], [740, 548], [1030, 548], [1030, 574]], { w: 14, f: fG });
    L.val(784, 566, 'AIFG1122', '%', { w: 44, desc: 'APH inlet flue gas O2 (A)' });
    L.val(852, 566, 'AIFG1123', '%', { w: 44, desc: 'APH inlet flue gas O2 (B)' });
    L.fp(784, 452, 'AICFG112', 'O2 trim (air demand bias)', '%', { lead: [[850, 510], [850, 541]] });
    /* ===== air heater H-1052 (art of hs-aph): air side left (SA section above, PA section below), gas side right ===== */
    L.path('M916,574 H1064 L1056,590 H924 Z');
    L.path('M924,770 H1056 L1064,786 H916 Z');
    L.rect(920, 590, 140, 180, { f: 'url(#hsCaseX)' });
    L.rect(928, 600, 54, 64, { f: 'url(#hsElem)', s: '#2a3138' });
    L.rect(928, 696, 54, 64, { f: 'url(#hsElem)', s: '#2a3138' });
    L.rect(998, 600, 54, 160, { f: 'url(#hsElem)', s: '#2a3138' });
    L.line([[990, 590], [990, 770]], { c: '#2a3138', w: 3 });
    L.line([[920, 680], [990, 680]], { c: '#2a3138', w: 2 });
    L.rect(1022, 560, 16, 14, { f: 'url(#hsSteelX)' });
    L.rect(1022, 786, 16, 12, { f: 'url(#hsSteelX)' });
    L.name(1076, 590, 'AIR HEATER', { a: 'start', z: 10.5 });
    L.note(1076, 604, 'H-1052', { a: 'start', z: 9.5 });
    L.note(1076, 620, 'AIR | GAS', { a: 'start', z: 9 });
    /* ===== hot air: SA to the furnace walls (lower SA ports), PA to the plenum ===== */
    L.duct('hot', [[920, 604], [318, 604]], { w: 10, f: fS });
    L.note(744, 596, 'HOT SA  →  WALL DAMPERS');
    L.val(560, 626, 'PIFA1088', 'mmH2O', { dp: 0, desc: 'APH outlet to furnace secondary air pressure' });
    L.val(676, 626, 'TIFA1086', '°C', { w: 44, dp: 0, desc: 'APH outlet secondary air temp (A)' });
    L.val(752, 626, 'TIFA1087', '°C', { w: 44, dp: 0, desc: 'APH outlet secondary air temp (B)' });
    /* ===== cold air: SAF and PAF from the atmosphere through the inlet dampers to the air heater ===== */
    const intake = (x, y) => {
      L.use('hs-intake', x, y - 20, 30, 40);
      L.note(x + 15, y + 32, 'ATM', { a: 'middle', c: C.tag });
    };
    /* SAF line (fan 52 px: outlet at y 781) */
    intake(40, 800);
    L.duct('air', [[70, 800], [330, 800]], { w: 14, chev: false, f: fS });
    L.damper(232, 793, 36, 'MCVFA10541', { ref: 'mv:FICFA1081', fp: 'FICFA1081', lx: 246, ly: 756, desc: 'SAF inlet flow control damper (MCV-FA1054-1)' });
    L.val(84, 756, 'FIFA1081', 'T/H', { desc: 'SAF inlet air flow' });
    L.val(170, 756, 'TIFA1082', '°C', { w: 40, dp: 0, desc: 'SAF inlet air temperature' });
    const saf = L.fan(352, 806, 56, 'F-1054 SAF', 'SAF  F-1054', { mk: 0.6, lx: 380, ly: 838, la: 'start' });
    L.duct('air', [[saf.ox, saf.oy], [860, saf.oy], [860, 650], [920, 650]], { w: 12, f: fS });
    L.val(640, 752, 'PIFA1085', 'mmH2O', { dp: 0, desc: 'SAF outlet to APH air pressure' });
    L.fp(484, 790, 'FICFA1081', 'Secondary air flow / SAF inlet damper', 'T/H');
    /* PAF line */
    intake(40, 880);
    L.duct('air', [[70, 880], [330, 880]], { w: 14, chev: false, f: fP });
    L.damper(232, 873, 36, 'MCVFA10531', { ref: 'mv:FICFA1071', fp: 'FICFA1071', lx: 246, ly: 836, desc: 'PAF inlet flow control damper (MCV-FA1053-1)' });
    L.val(84, 836, 'FIFA1071', 'T/H', { desc: 'PAF inlet air flow' });
    L.val(170, 836, 'TIFA1072', '°C', { w: 40, dp: 0, desc: 'PAF inlet air temperature' });
    const paf = L.fan(352, 872, 56, 'F-1053 PAF', 'PAF  F-1053', { mk: 0.6, lx: 380, ly: 912, la: 'start' });
    L.duct('air', [[paf.ox, paf.oy], [880, paf.oy], [880, 742], [920, 742]], { w: 12, f: fP });
    L.fp(624, 790, 'FICFA1071', 'Primary air flow / PAF inlet damper', 'T/H');
    /* hot PA (drawn after the cold SA riser: it crosses it with a gap) */
    L.duct('hot', [[920, 704], [560, 704], [560, 718], [301, 718]], { w: 10, f: fP, bridge: true });
    L.note(600, 694, 'HOT PA  →  PLENUM');
    L.val(330, 740, 'FIFA1079', 'T/H', { desc: 'APH outlet to furnace primary air flow' });
    L.val(428, 740, 'TIFA1076', '°C', { w: 44, dp: 0, desc: 'APH outlet primary air temp (A)' });
    L.val(504, 740, 'TIFA1077', '°C', { w: 44, dp: 0, desc: 'APH outlet primary air temp (B)' });
    /* ===== gas: air heater -> ESP -> IDF -> stack ===== */
    L.duct('gas', [[1030, 798], [1030, 818], [1086, 818], [1086, 742], [1104, 742]], { w: 14, f: fG });
    L.use('hs-esp', 1100, 687, 207, 144);
    L.name(1203, 852, 'ESP  Z-1010', { z: 10.5 });
    L.duct('gas', [[1306, 742], [1396, 742]], { w: 14, chev: false, f: fG });
    L.damper(1330, 735, 36, 'PCDFG10561', { ref: 'mv:PICFG108A', fp: 'PICFG108A', lx: 1318, ly: 694, desc: 'IDF inlet vane control damper (PCD-FG1056-1)' });
    L.fp(1268, 612, 'PICFG108A', 'Furnace pressure / IDF inlet vane', 'mmH2O', { lead: [[1348, 670], [1348, 690]] });
    const idf = L.fan(1426, 742, 72, 'F-1056 IDF', 'IDF  F-1056', { hc: 1, mk: 0.75, lx: 1404, ly: 842, la: 'end' });
    L.duct('gas', [[idf.ox, idf.oy], [1492, idf.oy]], { w: 12, chev: false, f: fG });
    L.use('hs-stack', 1480, 360, 54, 480);
    L.name(1507, 410, 'STACK', { z: 10.5 });
    L.fp(1268, 858, 'PICFG108', 'Furnace pressure / IDF hydraulic coupling', 'mmH2O', { lead: [[1400, 872], [1412, 800]] });
    L.val(1420, 880, 'ZT-LO1756', '%', { ref: 'ABC-008|AI0482', label: 'HC SCOOP', w: 50, desc: 'IDF hydraulic coupling scoop position (ZT-LO1756)' });
    /* ===== combustion summary and the 18 bed thermocouples ===== */
    L.group(920, 84, 672, 112, 'COMBUSTION');
    let taf = null,
      coal = null;
    const cell = (x, y, label, ref, u, dp, on) => L.val(x, y, label, u, { label, ref, dp, w: 70, on });
    cell(936, 116, 'TOTAL AIR FLOW', 'ABC-006|SUM out', 'T/H', 1, v => ((taf = v), ratio()));
    cell(1100, 116, 'COAL FLOW', 'pv:FIC-CM', 'T/H', 1, v => ((coal = v), ratio()));
    cell(1264, 116, 'PA FLOW', 'pv:FICFA1071', 'T/H', 1);
    cell(1428, 116, 'SA FLOW', 'pv:FICFA1081', 'T/H', 1);
    cell(936, 162, 'FURNACE PRESS', 'pv:PICFG108', 'mmH2O', 1);
    cell(1100, 162, 'O2 (APH INLET)', 'pv:AICFG112', '%', 1);
    const sR = L.calc(1264, 162, 'AIR / COAL RATIO', '', { w: 70, dp: 2, desc: 'Total air flow / coal flow' });
    const ratio = () => sR(taf != null && coal != null && coal > 1 ? taf / coal : null);
    L.text(1428, 158, 'MFT', { z: 10, c: C.tag });
    const mR = L.rect(1428, 162, 70, 18, { f: C.box, s: C.boxs, rx: 1.5 });
    const mT = L.text(1463, 175.5, '-----', { z: 11, b: 1, a: 'middle', c: C.none });
    api.reg({ t: 'val', tag: '', ref: 'ABC-007|M.0182', v: '' }, X => {
      const ok = X && isFinite(X.v),
        on = ok && X.v > 0.5;
      mT.textContent = !ok ? '-----' : on ? 'TRIPPED' : 'RESET';
      mT.setAttribute('fill', !ok ? C.none : on ? '#fff' : C.val);
      mR.setAttribute('fill', on ? C.alarm : C.box);
      mR.setAttribute('stroke', on ? C.alarm : C.boxs);
    }, mR);
    /* bed temperature: 18 thermocouples (TE-FG1091 A ~ I upper, TE-FG1090 A ~ I lower, ABC-026 / 027) with average and spread */
    L.group(920, 220, 672, 128, 'BED TEMPERATURE  °C   (TE-FG1091 UPPER / TE-FG1090 LOWER)');
    const TT = {},
      ids = 'ABCDEFGHI'.split('');
    ids.forEach((s, i) => L.text(1028 + i * 62 + 25, 244, s, { z: 10, b: 1, a: 'middle', c: C.tag }));
    [['UPPER', 'TIFG1091', 252], ['LOWER', 'TIFG1090', 280]].forEach(([s, pre, yy]) => {
      L.text(936, yy + 13.5, s, { z: 10, b: 1, c: C.lab });
      ids.forEach((k, i) => L.val(1028 + i * 62, yy, pre + k, '', { notag: 1, w: 50, dp: 0, desc: 'Bed temperature ' + pre + k, on: v => ((TT[pre + k] = v), calc()) }));
    });
    const sAvg = L.calc(1028, 314, '', '', { w: 50, dp: 0, desc: 'Bed temperature average of 18 TE' }),
      sMax = L.calc(1152, 314, '', '', { w: 50, dp: 0, desc: 'Bed temperature highest of 18 TE' }),
      sMin = L.calc(1276, 314, '', '', { w: 50, dp: 0, desc: 'Bed temperature lowest of 18 TE' });
    [['AVG', 936], ['MAX', 1112], ['MIN', 1236]].forEach(([t, x]) => L.text(x, 327.5, t, { z: 10, b: 1, c: C.lab }));
    function calc() {
      const v = Object.values(TT).filter(x => x != null);
      sAvg(v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
      sMax(v.length ? Math.max(...v) : null);
      sMin(v.length ? Math.min(...v) : null);
    }
  }
  const SCREENS = { AFG: airFlueGas };
  const NAV = [
    ['UNIT', 'UNIT'],
    ['AFG', '007 AIR & FLUE GAS'],
    ['08', '008 PA / SA'],
    ['09', '009 FLUIDIZING AIR'],
    ['39', '039 RH / SH BIASING'],
    ['38', '038 AIR PREHEATER'],
    ['11', '011 COAL FEEDER'],
    ['33', '033 CCS']
  ];
  window.PLANT_V2 = {
    C,
    draw(g, sys, api) {
      const W = sys.w,
        H = sys.h;
      const defs = S_('defs', {});
      defs.innerHTML = DEFS;
      g.append(defs);
      g.append(S_('rect', { x: 0, y: 0, width: W, height: H, fill: C.bg }));
      const L = lib(g, api);
      L.title(W, sys.num || '', sys.name || sys.title);
      L.banner(W, 37, [
        { k: 'mft', ref: 'ABC-007|M.0182', msg: 'MFT TRIPPED', hi: 1 },
        { k: 'fp', ref: 'pv:PICFG108', when: v => v > 50 || v < -100, msg: 'FURNACE PRESSURE ABNORMAL', hi: 1 },
        { k: 'idf', ref: 'ABC-008|M.3304', when: v => v < 0.5, msg: 'IDF F-1056 STOPPED' },
        { k: 'paf', ref: 'ABC-007|M.3302', when: v => v < 0.5, msg: 'PAF F-1053 STOPPED' },
        { k: 'saf', ref: 'ABC-007|M.3303', when: v => v < 0.5, msg: 'SAF F-1054 STOPPED' }
      ]);
      (SCREENS[sys.screen] || (() => {}))(L, api);
      L.nav(W, H - 36, NAV, sys.id);
    }
  };
  /* the new screens come first in the list of the Plant view; the old ones stay until the new set replaces them */
  window.PLANT_SYS = window.PLANT_SYS || [];
  window.PLANT_SYS.unshift({ id: 'AFG', title: 'AIR & FLUE GAS (new HMI)', num: '007', name: 'AIR & FLUE GAS SYSTEM', src: '7.PNG', w: 1600, h: 960, v2: true, screen: 'AFG', items: [] });
})();
