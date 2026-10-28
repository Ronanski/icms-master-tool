// HMI symbol library (art direction for the redrawn plant HMI).
// node docs/hmi/symbols/build.mjs  ->  hmi-symbols.svg (sprite), gallery.svg, proof-after.svg
// Rules: docs/hmi/HMI_ART_SPEC.md. One light source (top-left), max 3-4 gradient stops,
// no textures above ~15 % contrast, no glow, no animated dashes. Plain SVG, no images.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

// ---- palette (same tokens as HMI_ART_SPEC.md) ----
const P = {
  bg: '#1b2128', panel: '#20272f', edge: '#0c1014', hair: '#3a4550',
  tx: '#dfe6ec', lab: '#aeb9c4', dim: '#7f8b97', val: '#e8eef3', unit: '#8b97a3',
  boxf: '#0d1116', boxs: '#3a4550',
  run: '#d64545', stop: '#3fa34d', unk: '#59636d',
  man: '#f5a524', rem: '#6cb4ff', alm: '#e5484d', wrn: '#f5a524'
};
const FONT = "font-family:Inter,'Segoe UI',Roboto,Arial,sans-serif";
const MONO = "font-family:'JetBrains Mono','Consolas','Roboto Mono',monospace";

// ---- shared defs ----
const g4 = (id, dir, s) =>
  `<linearGradient id="${id}" ${dir === 'x' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"'}>` +
  s.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</linearGradient>';
const STEEL = [[0, '#4a545e'], [0.3, '#8d99a5'], [0.62, '#6c7783'], [1, '#3b444d']];
const DEFS = `<defs>
${g4('hsSteelX', 'x', STEEL)}
${g4('hsSteelY', 'y', STEEL)}
${g4('hsCase', 'y', [[0, '#5a646e'], [1, '#424b54']])}
${g4('hsCaseX', 'x', [[0, '#4e5862'], [0.5, '#5d6771'], [1, '#434c55']])}
${g4('hsConc', 'x', [[0, '#585e64'], [0.35, '#7b8187'], [1, '#4c5157']])}
${g4('hsAirY', 'y', [[0, '#3c566e'], [0.35, '#6a88a2'], [0.7, '#4d6a84'], [1, '#334a5f']])}
${g4('hsAirX', 'x', [[0, '#3c566e'], [0.35, '#6a88a2'], [0.7, '#4d6a84'], [1, '#334a5f']])}
${g4('hsHotY', 'y', [[0, '#6a5136'], [0.35, '#a0805a'], [0.7, '#806446'], [1, '#5a442e']])}
${g4('hsHotX', 'x', [[0, '#6a5136'], [0.35, '#a0805a'], [0.7, '#806446'], [1, '#5a442e']])}
${g4('hsGasY', 'y', [[0, '#55514d'], [0.35, '#7f7973'], [0.7, '#655f5a'], [1, '#4a4642']])}
${g4('hsGasX', 'x', [[0, '#55514d'], [0.35, '#7f7973'], [0.7, '#655f5a'], [1, '#4a4642']])}
${g4('hsBed', 'y', [[0, '#6e5d47'], [1, '#4f4233']])}
<pattern id="hsWW" width="4" height="8" patternUnits="userSpaceOnUse"><rect width="4" height="8" fill="#363e46"/><rect x="1.5" width="1" height="8" fill="#46505a"/></pattern>
<pattern id="hsElem" width="6" height="3" patternUnits="userSpaceOnUse"><rect width="6" height="3" fill="#3b444c"/><rect y="1" width="6" height=".6" fill="#4b555e"/></pattern>
<pattern id="hsTube" width="5" height="6" patternUnits="userSpaceOnUse"><rect width="5" height="6" fill="#343c44"/><rect x="2" width="1" height="6" fill="#4a545e"/></pattern>
</defs>`;

// ---- symbols (each has its own viewBox; place with <use href="#id" x y width height>) ----
const S = {};

// Centrifugal fan, volute casing, outlet up-right. Impeller is low-contrast (no "swirl icon").
S['hs-fan'] = `<symbol id="hs-fan" viewBox="0 0 84 84" overflow="visible">
<path d="M40 6H80V22H62A31 31 0 0 1 71 46A33 33 0 0 1 40 79A35 35 0 0 1 5 45A38 38 0 0 1 40 6Z" fill="url(#hsSteelY)" stroke="${P.edge}" stroke-width="1"/>
<path d="M62 22A31 31 0 0 1 71 46" fill="none" stroke="#9aa6b2" stroke-opacity=".35" stroke-width="1"/>
<rect x="78" y="6" width="3" height="16" fill="#3b444d" stroke="${P.edge}" stroke-width=".8"/>
<circle cx="40" cy="45" r="15" fill="#2a3138" stroke="${P.edge}" stroke-width="1"/>
<circle cx="40" cy="45" r="15" fill="none" stroke="#8d99a5" stroke-opacity=".25" stroke-width="2"/>
<g stroke="#7d8996" stroke-width="1" fill="none" stroke-linecap="round">
${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M40 39Q43.5 36 44.5 32" transform="rotate(${a} 40 45)"/>`).join('')}
</g>
<circle cx="40" cy="45" r="4.2" fill="#6c7783" stroke="${P.edge}" stroke-width=".8"/>
</symbol>`;

// Motor: steel body with fins; status band (class hs-st) = plant convention red run / green stop.
S['hs-motor'] = `<symbol id="hs-motor" viewBox="0 0 44 26" overflow="visible">
<line x1="0" y1="13" x2="6" y2="13" stroke="#8d99a5" stroke-width="2.4"/>
<rect x="6" y="3" width="30" height="20" rx="2" fill="url(#hsSteelY)" stroke="${P.edge}" stroke-width="1"/>
<g stroke="${P.edge}" stroke-opacity=".45" stroke-width=".8">${[11, 15, 19, 23, 27].map((x) => `<line x1="${x}" y1="5" x2="${x}" y2="21"/>`).join('')}</g>
<rect x="36" y="6" width="5" height="14" rx="1.5" fill="#4a545e" stroke="${P.edge}" stroke-width=".8"/>
<rect class="hs-st" x="8" y="24.5" width="26" height="3" rx="1" fill="${P.unk}"/>
</symbol>`;

// Louvre damper frame + actuator for a horizontal duct. Blades are drawn by damper(): 3 lines at x 10/18/26, y 7,
// rotated 90 deg (closed) .. 0 deg (open) with the live position.
S['hs-damper'] = `<symbol id="hs-damper" viewBox="0 -16 36 46" overflow="visible">
<rect x="2" y="0" width="32" height="14" fill="none" stroke="#b9c3cc" stroke-width="1"/>
<line x1="2" y1="-2" x2="2" y2="16" stroke="#b9c3cc" stroke-width="1.6"/>
<line x1="34" y1="-2" x2="34" y2="16" stroke="#b9c3cc" stroke-width="1.6"/>
<line x1="18" y1="0" x2="18" y2="-6" stroke="#8d99a5" stroke-width="1"/>
<rect x="11" y="-16" width="14" height="10" rx="1" fill="#4a545e" stroke="${P.edge}" stroke-width=".8"/>
<text x="18" y="-8.2" text-anchor="middle" style="${FONT};font-size:7.5px;font-weight:600" fill="${P.tx}">M</text>
</symbol>`;

// ISA control valve (globe + diaphragm). class hs-vb fill: open #c3ccd5, closed #2a3138.
S['hs-cv'] = `<symbol id="hs-cv" viewBox="0 0 28 30" overflow="visible">
<line x1="14" y1="20" x2="14" y2="8" stroke="#aab4be" stroke-width="1"/>
<path d="M5 8A9 6.5 0 0 1 23 8Z" fill="#59636d" stroke="#aab4be" stroke-width="1"/>
<path class="hs-vb" d="M2 14L14 20L2 26ZM26 14L14 20L26 26Z" fill="#c3ccd5" stroke="#aab4be" stroke-width="1" stroke-linejoin="round"/>
</symbol>`;

// Motor operated on/off valve (MOV).
S['hs-mov'] = `<symbol id="hs-mov" viewBox="0 0 28 30" overflow="visible">
<line x1="14" y1="20" x2="14" y2="11" stroke="#aab4be" stroke-width="1"/>
<rect x="7" y="1" width="14" height="10" rx="1" fill="#4a545e" stroke="#aab4be" stroke-width="1"/>
<text x="14" y="8.8" text-anchor="middle" style="${FONT};font-size:7.5px;font-weight:600" fill="${P.tx}">M</text>
<path class="hs-vb" d="M2 14L14 20L2 26ZM26 14L14 20L26 26Z" fill="#c3ccd5" stroke="#aab4be" stroke-width="1" stroke-linejoin="round"/>
</symbol>`;

// ISA 5.1 instrument bubble (field). Letters are a <text> placed by the caller at the centre.
S['hs-inst'] = `<symbol id="hs-inst" viewBox="0 0 20 20" overflow="visible">
<circle cx="10" cy="10" r="9" fill="${P.bg}" stroke="#8794a1" stroke-width="1"/>
</symbol>`;

// Atmosphere intake with weather louvres.
S['hs-intake'] = `<symbol id="hs-intake" viewBox="0 0 30 40" overflow="visible">
<rect x="1" y="1" width="28" height="38" rx="1" fill="url(#hsCase)" stroke="${P.edge}" stroke-width="1"/>
<g stroke="#2c333a" stroke-width="2">${[8, 15, 22, 29].map((y) => `<line x1="5" y1="${y + 4}" x2="25" y2="${y}"/>`).join('')}</g>
<g stroke="#8d99a5" stroke-opacity=".5" stroke-width=".8">${[8, 15, 22, 29].map((y) => `<line x1="5" y1="${y + 2.8}" x2="25" y2="${y - 1.2}"/>`).join('')}</g>
</symbol>`;

// Rotary regenerative air preheater, laid out like plant screen 038: air side left (hot out on top, cold in at the
// bottom, SA and PA split), gas side right (in at the top, out at the bottom).
S['hs-aph'] = `<symbol id="hs-aph" viewBox="0 0 160 210" overflow="visible">
<path d="M14 18H146L138 34H22Z" fill="url(#hsCase)" stroke="${P.edge}"/>
<path d="M22 176H138L146 192H14Z" fill="url(#hsCase)" stroke="${P.edge}"/>
<rect x="18" y="34" width="124" height="142" fill="url(#hsCaseX)" stroke="${P.edge}"/>
<rect x="26" y="44" width="108" height="56" fill="url(#hsElem)" stroke="#2a3138"/>
<rect x="26" y="110" width="108" height="56" fill="url(#hsElem)" stroke="#2a3138"/>
<line x1="80" y1="34" x2="80" y2="176" stroke="#2a3138" stroke-width="3"/>
<line x1="80" y1="34" x2="80" y2="176" stroke="#8d99a5" stroke-opacity=".3" stroke-width="1"/>
<line x1="18" y1="105" x2="80" y2="105" stroke="#2a3138" stroke-width="2"/>
<rect x="72" y="2" width="16" height="16" fill="url(#hsSteelX)" stroke="${P.edge}"/>
<rect x="72" y="192" width="16" height="12" fill="url(#hsSteelX)" stroke="${P.edge}"/>
</symbol>`;

// Electrostatic precipitator, 3 fields, T/R sets on the roof, 3 hoppers.
S['hs-esp'] = `<symbol id="hs-esp" viewBox="0 0 230 160" overflow="visible">
<path d="M0 38L30 24V98L0 84Z" fill="url(#hsCase)" stroke="${P.edge}"/>
<path d="M230 38L200 24V98L230 84Z" fill="url(#hsCase)" stroke="${P.edge}"/>
<rect x="30" y="20" width="170" height="82" fill="url(#hsCase)" stroke="${P.edge}"/>
<rect x="30" y="20" width="170" height="3" fill="#8d99a5" fill-opacity=".35"/>
${[0, 1, 2].map((i) => {
  const x = 34 + i * 55.3;
  return `<rect x="${x}" y="27" width="51" height="70" fill="url(#hsTube)" opacity=".7"/>
<rect x="${x + 16}" y="6" width="19" height="14" rx="1" fill="#4a545e" stroke="${P.edge}" stroke-width=".8"/>
<line x1="${x + 25.5}" y1="2" x2="${x + 25.5}" y2="6" stroke="#aab4be" stroke-width="1.6"/>
<path d="M${x + 2} 102H${x + 49}L${x + 33} 146H${x + 18}Z" fill="url(#hsCaseX)" stroke="${P.edge}"/>
<rect x="${x + 22}" y="146" width="7" height="8" fill="#3b444d" stroke="${P.edge}" stroke-width=".8"/>`;
}).join('')}
<line x1="85.3" y1="20" x2="85.3" y2="102" stroke="${P.edge}"/><line x1="140.6" y1="20" x2="140.6" y2="102" stroke="${P.edge}"/>
</symbol>`;

// CFB furnace (combustor): membrane waterwall, refractory lower zone (plain, no bricks), bed, plenum.
S['hs-furnace'] = `<symbol id="hs-furnace" viewBox="0 0 170 430" overflow="visible">
<rect x="10" y="0" width="150" height="292" fill="url(#hsWW)" stroke="${P.edge}"/>
<rect x="10" y="0" width="6" height="292" fill="url(#hsSteelX)"/><rect x="154" y="0" width="6" height="292" fill="url(#hsSteelX)"/>
<rect x="10" y="0" width="150" height="6" fill="url(#hsSteelY)"/>
<path d="M10 292H160L134 372H36Z" fill="#3e3b39" stroke="${P.edge}"/>
<path d="M16 292H154" stroke="#2a2725" stroke-width="2"/>
<rect x="38" y="356" width="94" height="14" fill="url(#hsBed)"/>
<line x1="36" y1="372" x2="134" y2="372" stroke="#aab4be" stroke-width="1.4" stroke-dasharray="3 2"/>
<rect x="34" y="374" width="102" height="40" rx="2" fill="url(#hsCase)" stroke="${P.edge}"/>
</symbol>`;

// Hot cyclone with vortex finder, cone, dipleg.
S['hs-cyclone'] = `<symbol id="hs-cyclone" viewBox="0 0 100 270" overflow="visible">
<rect x="36" y="0" width="28" height="34" fill="url(#hsSteelX)" stroke="${P.edge}"/>
<rect x="14" y="30" width="72" height="92" fill="url(#hsSteelX)" stroke="${P.edge}"/>
<path d="M14 122H86L56 210H44Z" fill="url(#hsSteelX)" stroke="${P.edge}"/>
<rect x="44" y="210" width="12" height="54" fill="url(#hsSteelX)" stroke="${P.edge}"/>
<rect x="0" y="40" width="14" height="34" fill="url(#hsSteelX)" stroke="${P.edge}"/>
</symbol>`;

// Tapered concrete stack. No aviation stripes on a DCS graphic.
S['hs-stack'] = `<symbol id="hs-stack" viewBox="0 0 60 400" overflow="visible">
<path d="M15 6H45L56 400H4Z" fill="url(#hsConc)" stroke="${P.edge}"/>
<rect x="13" y="0" width="34" height="8" rx="1" fill="#3f4449" stroke="${P.edge}"/>
</symbol>`;

// Steam drum (horizontal capsule).
S['hs-drum'] = `<symbol id="hs-drum" viewBox="0 0 180 36" overflow="visible">
<rect x="1" y="1" width="178" height="34" rx="17" fill="url(#hsSteelY)" stroke="${P.edge}"/>
<line x1="20" y1="18" x2="160" y2="18" stroke="#2a3138" stroke-opacity=".5"/>
</symbol>`;

// Heat-exchanger tube bank (SH / RH / ECO) for the back pass.
S['hs-bank'] = `<symbol id="hs-bank" viewBox="0 0 100 60" overflow="visible">
<rect x="0" y="0" width="100" height="60" fill="#2c333a" stroke="#4a545e"/>
<g fill="none" stroke="#56616c" stroke-width="1.2">${[8, 20, 32, 44, 56, 68, 80, 92].map((x, i) => `<path d="M${x} 6V54"/>`).join('')}</g>
<g fill="none" stroke="#56616c" stroke-width="1.2">${[8, 32, 56, 80].map((x) => `<path d="M${x} 54Q${x + 6} 60 ${x + 12} 54M${x + 12} 6Q${x + 18} 0 ${x + 24} 6"/>`).join('')}</g>
</symbol>`;

const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${DEFS}\n${Object.values(S).join('\n')}\n</svg>\n`;
writeFileSync(join(OUT, 'hmi-symbols.svg'), SPRITE);

// ---- helpers for composed pages ----
const T = (x, y, s, o = {}) =>
  `<text x="${x}" y="${y}" text-anchor="${o.a || 'start'}" style="${o.mono ? MONO : FONT};font-size:${o.z || 10}px;font-weight:${o.b ? 600 : 400};${o.ls ? 'letter-spacing:' + o.ls + 'em;' : ''}" fill="${o.c || P.lab}">${s}</text>`;
const use = (id, x, y, w, h, extra = '') => `<use href="#${id}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
// Horizontal / vertical duct segment, medium = Air | Hot | Gas; w = 14 main, 8 branch
const ductH = (x1, x2, y, m, w = 14) => `<rect x="${Math.min(x1, x2)}" y="${y - w / 2}" width="${Math.abs(x2 - x1)}" height="${w}" fill="url(#hs${m}Y)" stroke="${P.edge}" stroke-width=".8"/>`;
const ductV = (x, y1, y2, m, w = 14) => `<rect x="${x - w / 2}" y="${Math.min(y1, y2)}" width="${w}" height="${Math.abs(y2 - y1)}" fill="url(#hs${m}X)" stroke="${P.edge}" stroke-width=".8"/>`;
// static flow chevron inside a duct (dir: r l u d)
const chev = (x, y, dir) => {
  const r = { r: 0, d: 90, l: 180, u: 270 }[dir];
  return `<path d="M-3 -4L2 0L-3 4" transform="translate(${x} ${y}) rotate(${r})" fill="none" stroke="#e3e8ec" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const inst = (x, y, s) => use('hs-inst', x - 10, y - 10, 20, 20) + T(x, y + 2.8, s, { a: 'middle', z: s.length > 2 ? 6.5 : 7.5, b: 1, c: '#c3ccd5' });
// value box: tag above, value right-aligned, unit outside
const vbox = (x, y, tag, v, u, w = 58, alarm) =>
  (tag ? T(x, y - 4, tag, { z: 9, c: P.dim }) : '') +
  `<rect x="${x}" y="${y}" width="${w}" height="17" rx="1.5" fill="${P.boxf}" stroke="${alarm ? P.alm : P.boxs}" stroke-width="${alarm ? 1.5 : 1}"/>` +
  T(x + w - 5, y + 12.8, v, { a: 'end', mono: 1, z: 12.5, c: alarm ? P.alm : P.val }) +
  (u ? T(x + w + 4, y + 12.5, u, { z: 9, c: P.unit }) : '');
// loop faceplate (mini): tag, mode pill, PV / SV / MV rows, thin MV bar
const fp = (x, y, tag, mode, pv, sv, mv, u) => {
  const mc = mode === 'MAN' ? P.man : mode === 'CAS' ? P.rem : '#c3ccd5';
  const mf = mode === 'MAN' ? '#2a2110' : mode === 'CAS' ? '#10202e' : '#262d35';
  return `<g><rect x="${x}" y="${y}" width="132" height="58" rx="2" fill="${P.panel}" stroke="#46525e"/>
${T(x + 7, y + 13, tag, { z: 10, b: 1, c: P.tx })}
<rect x="${x + 96}" y="${y + 4}" width="30" height="12" rx="2" fill="${mf}" stroke="${mc}" stroke-width="1"/>${T(x + 111, y + 13, mode, { a: 'middle', z: 8, b: 1, c: mc })}
${T(x + 7, y + 28, 'PV', { z: 8.5, c: P.dim })}${T(x + 92, y + 28, pv, { a: 'end', mono: 1, z: 11, c: P.val })}${T(x + 96, y + 28, u, { z: 8, c: P.unit })}
${T(x + 7, y + 40, 'SV', { z: 8.5, c: P.dim })}${T(x + 92, y + 40, sv, { a: 'end', mono: 1, z: 11, c: '#b8c7d6' })}${T(x + 96, y + 40, u, { z: 8, c: P.unit })}
${T(x + 7, y + 52, 'MV', { z: 8.5, c: P.dim })}<rect x="${x + 24}" y="${y + 47}" width="52" height="5" fill="${P.boxf}" stroke="#3a4550" stroke-width=".6"/><rect x="${x + 24}" y="${y + 47}" width="${(52 * parseFloat(mv)) / 100}" height="5" fill="#8fa4b8"/>
${T(x + 118, y + 52, mv, { a: 'end', mono: 1, z: 11, c: P.val })}${T(x + 120, y + 52, '%', { z: 8, c: P.unit })}</g>`;
};
const motor = (x, y, on, flip) =>
  `<g transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}">${use('hs-motor', 0, 0, 44, 26)}</g>` +
  `<rect x="${flip ? x - 36 : x + 8}" y="${y + 24.5}" width="26" height="3" rx="1" fill="${on ? P.run : P.stop}"/>`;
const damper = (x, y, openPct) => {
  const a = 90 - (90 * openPct) / 100;
  return `<g transform="translate(${x - 18} ${y - 7})">${use('hs-damper', 0, -16, 36, 46).replace('/>', '/>')}
<g stroke="#e3e8ec" stroke-width="1.6" stroke-linecap="round">${[10, 18, 26].map((cx) => `<line x1="${cx - 3.5}" y1="7" x2="${cx + 3.5}" y2="7" transform="rotate(${-a} ${cx} 7)"/>`).join('')}</g></g>`;
};

// ---- gallery ----
{
  const cells = [
    ['hs-fan', 'Fan (SAF / PAF / IDF)', 84, 84],
    ['hs-motor', 'Motor + status band', 44, 26],
    ['hs-damper', 'Louvre damper', 36, 46],
    ['hs-cv', 'Control valve', 28, 30],
    ['hs-mov', 'MOV on/off', 28, 30],
    ['hs-intake', 'Air intake', 30, 40],
    ['hs-drum', 'Steam drum', 180, 36],
    ['hs-bank', 'Tube bank', 100, 60],
    ['hs-aph', 'Air preheater', 160, 210],
    ['hs-esp', 'ESP (3 fields)', 230, 160],
    ['hs-cyclone', 'Cyclone', 100, 270],
    ['hs-furnace', 'CFB furnace', 170, 430],
    ['hs-stack', 'Stack', 60, 400]
  ];
  let x = 24, y = 50, rowH = 0, body = '';
  const W = 1180;
  for (const [id, name, w, h] of cells) {
    if (x + w > W - 24) { x = 24; y += rowH + 46; rowH = 0; }
    const yy = id === 'hs-damper' ? y + 16 : y;
    body += (id === 'hs-damper' ? damper(x + 18, y + 23, 60) : use(id, x, yy, w, h)) + T(x, y + h + 18, name, { z: 10, c: P.lab });
    x += Math.max(w, 120) + 30; rowH = Math.max(rowH, h);
  }
  const H = y + rowH + 50;
  body += vbox(24, H - 10, 'FIFA1081', '213.0', 'T/H') + vbox(150, H - 10, 'PIFA1088 (alarm)', '1273', 'mmH2O', 58, 1) + fp(300, H - 30, 'FICFA1081', 'CAS', '213.0', '203.4', '37.1', 'T/H') + fp(450, H - 30, 'PICFG108A', 'MAN', '-16.8', '0.0', '100.0', 'mmH2O') + inst(620, H, 'FT') + inst(650, H, 'PT') + inst(680, H, 'DPT');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 50}" width="${W}" height="${H + 50}">${DEFS}${Object.values(S).join('')}<rect width="100%" height="100%" fill="${P.bg}"/>${T(24, 28, 'HMI SYMBOL LIBRARY · plant graphics (ISA-101 dark, ISA 5.1 / ISO 10628 shapes)', { z: 13, b: 1, c: P.tx })}${body}</svg>`;
  writeFileSync(join(OUT, 'gallery.svg'), svg);
}

// ---- proof: same flow as the v3 sample, ports as plant screen 038 (SAF / PAF -> APH -> ESP -> IDF -> stack) ----
{
  const W = 1240, H = 650;
  let b = `<rect width="100%" height="100%" fill="${P.bg}"/>`;
  // fan train: intake -> FT -> damper -> fan (outlet top-right at y-32) ; motor coupled under the fan
  const train = (y, name, ft, flow, mcv, fpTag, sv, mv) => {
    let s = use('hs-intake', 20, y - 20, 30, 40) + T(35, y + 34, 'ATM', { a: 'middle', z: 8.5, c: P.dim });
    s += ductH(50, 206, y, 'Air') + chev(100, y, 'r') + damper(160, y, mv) + inst(80, y + 24, 'FT');
    s += vbox(60, y - 46, ft, flow, 'T/H') + vbox(140, y - 46, mcv, mv.toFixed(1), '%', 44);
    s += `<line x1="236" y1="${y + 30}" x2="236" y2="${y + 38}" stroke="#8d99a5" stroke-width="2.4"/>`;
    s += use('hs-fan', 196, y - 46, 84, 84) + motor(214, y + 36, 1);
    s += T(236, y + 84, name, { a: 'middle', z: 11, b: 1, c: P.tx, ls: 0.03 });
    s += fp(300, y + 4, fpTag, 'CAS', flow, sv, mv.toFixed(1), 'T/H');
    return s;
  };
  b += train(330, 'SAF F-1054', 'FIFA1081', '213.0', 'MCVFA10541', 'FICFA1081', '203.4', 37.1);
  b += train(480, 'PAF F-1053', 'FIFA1071', '354.0', 'MCVFA10531', 'FICFA1071', '359.5', 35.6);
  // cold air to the APH bottom hood
  b += ductH(276, 632, 298, 'Air') + ductV(625, 291, 305, 'Air') + chev(470, 298, 'r') + chev(625, 296, 'u');
  b += ductH(276, 672, 448, 'Air') + ductV(665, 291, 455, 'Air') + chev(470, 448, 'r') + chev(665, 380, 'u');
  b += T(560, 290, 'COLD SA', { a: 'end', z: 9, c: P.lab }) + T(560, 440, 'COLD PA', { a: 'end', z: 9, c: P.lab });
  // APH (air left, gas right)
  b += use('hs-aph', 600, 100, 160, 210);
  b += T(590, 196, 'AIR PREHEATER', { a: 'end', z: 10.5, b: 1, c: P.tx, ls: 0.03 }) + T(590, 210, 'H-1052', { a: 'end', z: 10, c: P.lab });
  // hot air out of the top hood, to the furnace
  b += ductV(625, 80, 119, 'Hot') + ductH(632, 430, 80, 'Hot') + chev(520, 80, 'l') + T(430, 70, 'HOT SA  →  FURNACE WALL DAMPERS', { z: 9, c: P.lab });
  b += ductV(665, 44, 119, 'Hot') + ductH(672, 430, 44, 'Hot') + chev(560, 44, 'l') + T(430, 34, 'HOT PA  →  PLENUM', { z: 9, c: P.lab });
  b += vbox(452, 98, 'TIFA1086', '288', '°C', 44) + vbox(520, 98, 'PIFA1088', '1273', 'mmH2O', 50);
  // gas: in from the economizer (top right), out at the bottom right to the ESP
  b += ductV(735, 14, 119, 'Gas') + chev(735, 60, 'd') + T(748, 30, 'FLUE GAS FROM ECO', { z: 9, c: P.lab });
  b += ductV(735, 291, 527, 'Gas') + ductH(728, 806, 520, 'Gas') + chev(735, 420, 'd') + chev(770, 520, 'r');
  b += vbox(752, 352, 'TIFG1132', '146', '°C', 44) + vbox(752, 402, 'AIFG1131', '19.2', '%', 44);
  // ESP
  b += use('hs-esp', 800, 459, 230, 160) + T(915, 640, 'ESP Z-1010', { a: 'middle', z: 10.5, b: 1, c: P.tx, ls: 0.03 });
  b += inst(866, 418, 'PT') + vbox(880, 410, 'PIFG1134', '-372', 'mmH2O', 50);
  // IDF + damper -> stack
  b += ductH(1028, 1066, 520, 'Gas') + damper(1046, 520, 46);
  b += `<line x1="1100" y1="554" x2="1100" y2="562" stroke="#8d99a5" stroke-width="2.4"/>`;
  b += use('hs-fan', 1060, 475, 84, 84) + motor(1078, 560, 1) + T(1100, 610, 'IDF F-1056', { a: 'middle', z: 11, b: 1, c: P.tx, ls: 0.03 });
  b += ductH(1140, 1164, 489, 'Gas') + use('hs-stack', 1160, 40, 60, 480) + T(1190, 30, 'STACK', { a: 'middle', z: 10, b: 1, c: P.tx, ls: 0.06 });
  b += fp(1010, 330, 'PICFG108', 'AUT', '-16.8', '-16.0', '46.1', 'mmH2O') + `<path d="M1060 388L1046 500" stroke="#5b6774" stroke-width=".75" stroke-dasharray="3 2" fill="none"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${DEFS}${Object.values(S).join('')}${b}</svg>`;
  writeFileSync(join(OUT, 'proof-after.svg'), svg);
}
console.log('wrote hmi-symbols.svg, gallery.svg, proof-after.svg');
