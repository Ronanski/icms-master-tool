// outline v5: FRONT elevation (looking at the front / north wall), the view the plant HMI 007 uses: drum lengthwise on top,
// lower furnace tapering to the grate, burners on the two side walls, coal ports on the front face, cyclone drawn to the right
const fs = require('fs');
const F = 'C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/furnace-cyclone-study.html';
let h = fs.readFileSync(F, 'utf8');
const a = h.indexOf('<svg viewBox='), b = h.indexOf('</svg>', a) + 6;
const S = 7, HX = 1.25, SX = S * HX, FL = y => 420 - y * S; /* one horizontal scale for everything: 1 m = 8.75 px (25 % wider, user), vertical 1 m = 7 px */
const fx = 46, fw = 15.507 * SX, gw = fw * .6, cw = 7.9 * SX, cx0 = fx + fw + 2.5 * SX, ccx = cx0 + cw / 2, sp = 1.45 * SX;
const yG = FL(5), yTop = FL(44), yRef = FL(12.75), yBar = FL(35), yCone = FL(21.2), ySP = FL(15.2), yDuctB = FL(40.5);
const gx = fx + (fw - gw) / 2;
const pw = 5 * SX, ph = 28, px = ccx + sp / 2 + 6 - pw, pt = ySP - ph / 2, pb = pt + ph;
let svg = '<svg viewBox="0 0 520 470" role="img" aria-label="Front elevation ng furnace at cyclone"><g font-family="IBM Plex Sans,sans-serif" font-size="8" fill="#0b0f13">';
svg += `<line x1="30" y1="${FL(0)}" x2="30" y2="${FL(48)}" stroke="#1d252c"/>`;
for (let e = 0; e <= 45; e += 5) svg += `<line x1="34" y1="${FL(e)}" x2="${fx + 30 * SX}" y2="${FL(e)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/>`;
    for (let m = 0; m <= 30; m += 5) svg += `<line x1="${fx + m * SX}" y1="${FL(0)}" x2="${fx + m * SX}" y2="${FL(45)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/>`;
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45].forEach(e => { svg += `<line x1="26" y1="${FL(e)}" x2="34" y2="${FL(e)}" stroke="#1d252c"/><text x="2" y="${FL(e) + 3}">${e} m</text>`; });
    svg += `<text x="2" y="${FL(48) - 6}" font-weight="700">Y · TAAS (elevation, m)</text>`;
svg += `<line x1="34" y1="${FL(0)}" x2="510" y2="${FL(0)}" stroke="#1d252c" stroke-width="1.5"/>`;
const furnace = `M${fx} ${yTop} H${fx + fw} V${yRef} L${gx + gw} ${yG} H${gx} L${fx} ${yRef}Z`;
const parts = [
  ['path', { d: furnace }],
  ['rect', { x: fx + fw - 2, y: yTop, width: cx0 - (fx + fw) + 4, height: yDuctB - yTop }],
  ['path', { d: `M${cx0} ${yTop} Q${ccx} ${yTop - 14} ${cx0 + cw} ${yTop} V${yBar} L${ccx + sp / 2} ${yCone} H${ccx - sp / 2} L${cx0} ${yBar}Z` }],
  ['rect', { x: ccx - sp / 2, y: yCone - 2, width: sp, height: pt - yCone + 4 }],
  ['rect', { x: px, y: pt, width: pw, height: ph, rx: 3 }],
  ['path', { d: `M${px + 2} ${pt + 2} L${fx + fw - 2} ${FL(12.4)} L${fx + fw - 7} ${FL(10.9)} L${px + 2} ${pt + 11}Z` }],
  ['rect', { x: gx + 3, y: yG - 1, width: gw - 6, height: 12 }],
  ['rect', { x: ccx - 1.3 * SX, y: yTop - 30, width: 2.6 * SX, height: 22 }],
  ['rect', { x: fx + fw * .25, y: yTop - 7, width: 4, height: 9 }], ['rect', { x: fx + fw * .75 - 4, y: yTop - 7, width: 4, height: 9 }],
  ['rect', { x: fx + fw * .12, y: yTop - 7 - 1.8 * S, width: fw * .76, height: 1.8 * S, rx: 1.8 * S / 2 }]];
const at = o => Object.entries(o).map(([k, v]) => k + '="' + (typeof v === 'number' ? v.toFixed(1) : v) + '"').join(' ');
// second cyclone, behind (darker, offset)
svg += `<path d="M${cx0 + 8} ${yTop - 6} H${cx0 + cw + 8} V${yBar - 6} L${ccx + 8 + sp / 2} ${yCone - 6} H${ccx + 8 - sp / 2} L${cx0 + 8} ${yBar - 6}Z" fill="#7f8a93" stroke="#000" stroke-width="2"/>`;
parts.forEach(p => svg += `<${p[0]} ${at(p[1])} fill="none" stroke="#000" stroke-width="3.2" stroke-linejoin="round"/>`);
parts.forEach(p => svg += `<${p[0]} ${at(p[1])} fill="#a9b4bd"/>`);
// refractory zone (the tapered lower furnace), grate, seal pot partition + air box
svg += `<path d="M${fx + 1.5} ${yRef} H${fx + fw - 1.5} L${gx + gw - 1} ${yG - 1} H${gx + 1}Z" fill="#b9a48c" opacity=".85"/>`;
svg += `<line x1="${gx}" y1="${yG}" x2="${gx + gw}" y2="${yG}" stroke="#000" stroke-width="2.2" stroke-dasharray="2 2"/>`;
const mx = px + pw / 2 + 2;
svg += `<line x1="${mx}" y1="${pt}" x2="${mx}" y2="${pb - 8}" stroke="#000" stroke-width="2"/><rect x="${px + 2}" y="${pb}" width="${pw - 4}" height="6" fill="#a9b4bd" stroke="#000" stroke-width="1.4"/>`;
// burners on the two side walls (2 per side), coal ports (6) on the front face
[[fx + 10, FL(8.8)], [fx + 6, FL(10.5)], [fx + fw - 10, FL(8.8)], [fx + fw - 6, FL(10.5)]].forEach(p => svg += `<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="none" stroke="#e5484d" stroke-width="1.5"/>`);
for (let i = 0; i < 6; i++) svg += `<circle cx="${gx + 8 + i * (gw - 16) / 5}" cy="${FL(7.2)}" r="2.6" fill="none" stroke="#5a4a38" stroke-width="1.4"/>`;
// WIDTH ruler, metres, same horizontal scale as every part (user: the drawing needs a width scale, not only the height ruler)
svg += `<line x1="${fx}" y1="${FL(0) + 22}" x2="${fx + 30 * SX}" y2="${FL(0) + 22}" stroke="#1d252c"/>`;
svg += `<text x="${fx + 30 * SX + 8}" y="${FL(0) + 25}" font-weight="700">X · LAPAD (m)</text>`;
for (let m = 0; m <= 30; m += 5) svg += `<line x1="${fx + m * SX}" y1="${FL(0) + 18}" x2="${fx + m * SX}" y2="${FL(0) + 26}" stroke="#1d252c"/><text x="${fx + m * SX - 4}" y="${FL(0) + 36}">${m} m</text>`;
svg += `<line x1="${fx}" y1="${FL(0) + 6}" x2="${fx + fw}" y2="${FL(0) + 6}" stroke="#b85a3c" stroke-width="1"/><text x="${fx + fw / 2 - 20}" y="${FL(0) + 14}">furnace 15.5 m</text><line x1="${cx0}" y1="${FL(0) + 6}" x2="${cx0 + cw}" y2="${FL(0) + 6}" stroke="#b85a3c" stroke-width="1"/><text x="${cx0 + 4}" y="${FL(0) + 14}">cyclone 7.9 m</text>`;
// flow arrows
svg += '<defs><marker id="mg" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="#b85a3c"/></marker><marker id="ms" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="#c98a4a"/></marker></defs>';
const ar = (x1, y1, x2, y2, m, c) => svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.6" marker-end="url(#${m})"/>`;
ar(fx + fw / 2, yRef - 10, fx + fw / 2, yTop + 20, 'mg', '#b85a3c'); ar(fx + fw - 6, yTop + 12, cx0 + 10, yTop + 12, 'mg', '#b85a3c'); ar(ccx, yTop + 4, ccx, yTop - 24, 'mg', '#b85a3c');
ar(ccx, yBar + 10, ccx, pt - 4, 'ms', '#c98a4a'); ar(px - 2, pt + 6, fx + fw - 2, FL(11.4), 'ms', '#c98a4a');
// labels, every leader on its part
const TX = 370, L = (x, y, ty, t) => svg += `<circle cx="${x}" cy="${y}" r="1.6" fill="#1d252c"/><line x1="${x}" y1="${y}" x2="${TX - 3}" y2="${ty - 3}" stroke="#1d252c" stroke-width=".6"/><text x="${TX}" y="${ty}">${t}</text>`;
L(fx + fw * .88, yTop - 7 - .9 * S, FL(51), 'steam drum (nakahiga)');
L(ccx + 9, yTop - 26, FL(49), 'gas outlet → back pass');
L(ccx + 14, yTop - 8, FL(46.8), 'cyclone dome');
L((fx + fw + cx0) / 2, yDuctB - 4, FL(43.5), 'cyclone inlet duct');
L(cx0 + cw + 8, FL(39), FL(40), 'cyclone ×2 (ikalawa sa likod) · 7.9 m');
L(cx0 + cw - 10, FL(29), FL(29), 'cone');
L(ccx + sp / 2, FL(19), FL(20.5), 'standpipe · 1.45 m');
L(px + pw, pt + 8, FL(17), 'siphon seal pot · FL+15.2');
L(px + pw - 8, pb + 5, FL(13.4), 'fluidizing air box');
L((px + fx + fw) / 2, (pt + 6 + FL(11.6)) / 2, FL(10.5), 'solids return duct · 1.0 m');
L(fx + fw - 10, FL(8.8), FL(6.8), 'start-up burner ×4 (side walls)');
L(gx + gw - 8, FL(7.2), FL(4.5), 'coal ports ×6 (front wall)');
L(gx + gw / 2 + 20, yG + 6, FL(2.4), 'plenum · grate');
svg += `<text x="${fx + 6}" y="${yRef - 3}">refractory 7.7 m</text><text x="${fx + 4}" y="${FL(25)}">FURNACE · 15.5 m lapad</text>`;
svg += '</g></svg>';
h = h.slice(0, a) + svg + h.slice(b);
h = h.replace(/<p style="color:var\(--dim\);margin:6px 0 0">[^<]*<\/p>/, '<p style="color:var(--dim);margin:6px 0 0">FRONT ELEVATION: tingin mula sa harap (front wall, north), gaya ng plant HMI 007: drum na nakahiga sa itaas, kumikitid ang ibabang furnace papunta sa grate, burner sa dalawang side wall, coal ports sa harap. Ang cyclone ay nasa likod ng furnace sa totoo; gaya ng plant HMI, iginuhit ito sa kanan para makita. Naka-scale: pataas 1 m = 7 px; pahalang 1 m = 8.75 px para sa lahat ng bahagi; may ruler ng taas (kaliwa) at ruler ng lapad (ibaba).</p>');
fs.writeFileSync(F, h); console.log('ok');
