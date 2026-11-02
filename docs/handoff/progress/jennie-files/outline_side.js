// outline v11: SIDE elevation laid out like flow diagram K1AU3-PD-051 (drum end view top-left, furnace, inlet duct,
// cyclone, cross-over to back pass) with the seal pot / return leg shape of K1AU3-PD-054 sh.2. One true scale both axes.
const fs = require('fs');
const F = 'C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/furnace-cyclone-study.html';
let h = fs.readFileSync(F, 'utf8');
const a = h.indexOf('<svg viewBox='), b = h.indexOf('</svg>', a) + 6;
const S = 8, X = m => 60 + m * S, Y = e => 450 - e * S; /* 1 m = 8 px on BOTH axes */
const EST = '#d9822b', GAS = '#b85a3c', SOL = '#c98a4a';
let svg = '<svg viewBox="0 0 560 540" role="img" aria-label="Side elevation ng furnace, cyclone at back pass, naka-scale"><g font-family="IBM Plex Sans,sans-serif" font-size="8" fill="#0b0f13">';
// grid + axes (metres)
for (let e = 0; e <= 50; e += 5) svg += `<line x1="${X(0) - 8}" y1="${Y(e)}" x2="${X(30)}" y2="${Y(e)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/><line x1="26" y1="${Y(e)}" x2="34" y2="${Y(e)}" stroke="#1d252c"/><text x="2" y="${Y(e) + 3}">${e} m</text>`;
for (let m = 0; m <= 30; m += 5) svg += `<line x1="${X(m)}" y1="${Y(0)}" x2="${X(m)}" y2="${Y(50)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/><line x1="${X(m)}" y1="${Y(0) + 18}" x2="${X(m)}" y2="${Y(0) + 26}" stroke="#1d252c"/><text x="${X(m) - 5}" y="${Y(0) + 36}">${m} m</text>`;
svg += `<line x1="30" y1="${Y(0)}" x2="30" y2="${Y(52)}" stroke="#1d252c"/><text x="2" y="${Y(52) - 5}" font-weight="700">Y · TAAS (elevation, m)</text>`;
svg += `<line x1="${X(0)}" y1="${Y(0) + 22}" x2="${X(30)}" y2="${Y(0) + 22}" stroke="#1d252c"/><text x="${X(30) + 8}" y="${Y(0) + 25}" font-weight="700">X · LALIM, harap → likod (m)</text>`;
svg += `<line x1="34" y1="${Y(0)}" x2="${X(31)}" y2="${Y(0)}" stroke="#1d252c" stroke-width="1.5"/>`;
// geometry (m): furnace 7.68 deep (FHI S4), refractory 7.748 above grate, cyclone ID 7.9 / 24.542 high, standpipe 1.45, return duct 1.015
const D = 7.6835, gF = 1.0, gR = 6.0, eG = 5, eRef = eG + 7.748, eRoof = 44;
const cx0 = 10.3, cw = 7.9, cc = cx0 + cw / 2, eBar = 35, eDome = 45.6, eCone = eDome - 24.542, sp = 1.45;
const potL = 10.4, potR = 15.4, potB = 15.9, potT = 18.9, riR = 12.0, riT = 21.8;
const bpL = 20.5, bpR = 28.5, bpT = 45.5, bpB = 22;
const P = (...pts) => 'M' + pts.map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L') + 'Z';
const parts = [
  P([0, eRoof], [D, eRoof], [D, eRef], [gR, eG], [gF, eG], [0, 9.5]),                         // furnace (lower part tapers to the grate)
  P([D - .2, 43], [cx0 + .3, 43], [cx0 + .3, 37.5], [D - .2, 37.5]),                          // cyclone inlet duct (rear wall opening)
  `M${X(cx0)} ${Y(44)} Q${X(cc)} ${Y(eDome + 1.6)} ${X(cx0 + cw)} ${Y(44)} V${Y(eBar)} L${X(cc + sp / 2)} ${Y(eCone)} H${X(cc - sp / 2)} L${X(cx0)} ${Y(eBar)}Z`, // cyclone + dome + cone
  P([cc - sp / 2, eCone + .2], [cc + sp / 2, eCone + .2], [cc + sp / 2, potT - .1], [cc - sp / 2, potT - .1]), // standpipe
  P([potL, potT], [potR, potT], [potR, potB], [potL, potB]),                                   // seal pot body
  P([potL, riT], [riR, riT], [riR, potT - .2], [potL, potT - .2]),                              // outlet riser (up-leg)
  P([potL + .2, potB], [potR - .2, potB], [potR - .2, 15.2], [potL + .2, 15.2]),               // fluidizing air box
  P([cc - 1.6, eDome - .6], [cc + 1.6, eDome - .6], [cc + 1.6, 49.2], [cc - 1.6, 49.2]),       // gas outlet (vortex finder) up
  P([cc - 1.6, 49.2], [24.5, 49.2], [24.5, 46.2], [cc + 1.6, 46.2]),                          // cross-over duct
  P([bpL, 46.4], [24.5, 46.4], [24.5, bpT - .2], [bpL, bpT - .2]),                             // drop into the back pass roof
  P([bpL, bpT], [bpR, bpT], [bpR, bpB], [26.5, 19.5], [22.5, 19.5], [bpL, bpB]),               // back pass + hopper
  P([26.8, 21.2], [30.5, 21.2], [30.5, 19.0], [26.8, 19.0]),                                   // outlet to the air heater
  P([gF + .2, eG], [gR - .2, eG], [gR - .2, 3.2], [gF + .2, 3.2]),                             // plenum (windbox)
  P([1.8, eRoof - .2], [2.3, eRoof - .2], [2.3, 45.4], [1.8, 45.4]), P([5.3, eRoof - .2], [5.8, eRoof - .2], [5.8, 45.4], [5.3, 45.4]) // drum supports / risers
];
// second cyclone (behind), offset
svg += `<path d="M${X(cx0) + 7} ${Y(44) - 5} H${X(cx0 + cw) + 7} V${Y(eBar) - 5} L${X(cc + sp / 2) + 7} ${Y(eCone) - 5} H${X(cc - sp / 2) + 7} L${X(cx0) + 7} ${Y(eBar) - 5}Z" fill="#7f8a93" stroke="#000" stroke-width="2"/>`;
// return leg (ID 1.015 m), two runs like PD-054: 45 deg off the riser top, elbow, steep run into the lower furnace rear wall
const rl = [[potL + .3, riT - .6], [8.9, 19.8], [7.45, 11.6]];
const rlPath = `M${X(rl[0][0])} ${Y(rl[0][1])} L${X(rl[1][0])} ${Y(rl[1][1])} L${X(rl[2][0])} ${Y(rl[2][1])}`;
parts.forEach(d => svg += `<path d="${d}" fill="none" stroke="#000" stroke-width="3.2" stroke-linejoin="round"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#000" stroke-width="${1.015 * S + 3.2}" stroke-linejoin="round"/>`;
parts.forEach(d => svg += `<path d="${d}" fill="#a9b4bd"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#a9b4bd" stroke-width="${1.015 * S}" stroke-linejoin="round"/>`;
// steam drum, end view (ID 1.676 m), lies along the 15.5 m furnace width
svg += `<circle cx="${X(3.8)}" cy="${Y(46.5)}" r="${.838 * S + 1.5}" fill="#a9b4bd" stroke="#000" stroke-width="2.4"/>`;
// refractory zone, grate, standpipe dip leg inside the pot, air box split, division wall
svg += `<path d="${P([.12, eRef], [D - .12, eRef], [gR - .05, eG + .05], [gF + .05, eG + .05], [.12, 9.5])}" fill="#b9a48c" opacity=".85"/>`;
svg += `<line x1="${X(gF)}" y1="${Y(eG)}" x2="${X(gR)}" y2="${Y(eG)}" stroke="#000" stroke-width="2.2" stroke-dasharray="2 2"/>`;
svg += `<path d="M${X(cc - sp / 2)} ${Y(potT)} V${Y(16.8)} M${X(cc + sp / 2)} ${Y(potT)} V${Y(16.8)}" stroke="#000" stroke-width="2"/><rect x="${X(cc - sp / 2) + 1}" y="${Y(potT) - 2}" width="${sp * S - 2}" height="${(potT - 16.8) * S + 2}" fill="#a9b4bd"/>`;
svg += `<line x1="${X((potL + potR) / 2)}" y1="${Y(potB)}" x2="${X((potL + potR) / 2)}" y2="${Y(15.2)}" stroke="#000" stroke-width="1.4"/>`;
svg += `<line x1="${X(24.5)}" y1="${Y(bpT)}" x2="${X(24.5)}" y2="${Y(30)}" stroke="#000" stroke-width="2"/>`;
// expansion joints (double tick): cone→standpipe, return leg (PD-054)
const ej = (x, y, w, ang) => svg += `<g transform="rotate(${ang} ${x} ${y})"><line x1="${x - w / 2 - 2}" y1="${y - 1.6}" x2="${x + w / 2 + 2}" y2="${y - 1.6}" stroke="#000" stroke-width="1.4"/><line x1="${x - w / 2 - 2}" y1="${y + 1.6}" x2="${x + w / 2 + 2}" y2="${y + 1.6}" stroke="#000" stroke-width="1.4"/></g>`;
ej(X(cc), Y(eCone) + 5, sp * S, 0);
{ const p = rl[1], q = rl[2], t = .22, x = X(p[0] + (q[0] - p[0]) * t), y = Y(p[1] + (q[1] - p[1]) * t); ej(x, y, 1.015 * S, Math.atan2(Y(q[1]) - Y(p[1]), X(q[0]) - X(p[0])) * 180 / Math.PI + 90); }
// start-up burners (FL+10,806.5, M&S 1612 13-0-05-C): side walls, so they face us; A and C shown
[2.2, 4.7].forEach(m => svg += `<rect x="${X(m) - 5}" y="${Y(10.8065) - 5}" width="10" height="10" fill="none" stroke="#e5484d" stroke-width="1.8"/><circle cx="${X(m)}" cy="${Y(10.8065)}" r="2.6" fill="none" stroke="#e5484d" stroke-width="1.4"/>`);
// fuel feed nozzles (6, front wall) — elevation not in docs
svg += `<path d="M${X(-1.4)} ${Y(8.4)} L${X(.35)} ${Y(7.6)}" stroke="#5a4a38" stroke-width="3"/>`;
// estimate overlay: dashed orange = size NOT in the docs
[P([D - .2, 43], [cx0 + .3, 43], [cx0 + .3, 37.5], [D - .2, 37.5]), P([cc - 1.6, eDome - .6], [cc - 1.6, 49.2], [24.5, 49.2], [24.5, 46.2], [cc + 1.6, 46.2], [cc + 1.6, eDome - .6]).replace('Z', ''), P([bpL, bpT], [bpR, bpT], [bpR, bpB], [bpL, bpB]),
 P([potL, riT], [riR, riT], [riR, potT], [potR, potT], [potR, potB], [potL, potB]), P([gF, eG], [gR, eG], [gR, 3.2], [gF, 3.2]), `M${X(-.6)} ${Y(eRoof)} H${X(D + .6)}`].forEach(d => svg += `<path d="${d}" fill="none" stroke="${EST}" stroke-width="1.6" stroke-dasharray="4 3"/>`);
// flow arrows
svg += `<defs><marker id="mg" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="${GAS}"/></marker><marker id="ms" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="${SOL}"/></marker></defs>`;
const ar = (pts, m, c) => svg += `<polyline points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" marker-end="url(#${m})"/>`;
ar([[D / 2, 14], [D / 2, 38]], 'mg', GAS); ar([[D - 1, 40.2], [cx0 + 1.4, 40.2]], 'mg', GAS); ar([[cc, 41], [cc, 47.7], [22.5, 47.7], [22.5, 40]], 'mg', GAS); ar([[22.5, 26], [22.5, 20.5], [29.8, 20.1]], 'mg', GAS);
ar([[cc + 1.2, 33], [cc + .2, eCone + 1.5], [cc + .2, 17.4]], 'ms', SOL); ar([[11.2, 17.6], [11.2, 21]], 'ms', SOL); ar([[9.4, 20.1], [7.9, 12.6]], 'ms', SOL);
// labels: every leader ends on its part
const TX = X(31.5) + 4, L = (x, y, ty, t) => svg += `<circle cx="${x}" cy="${y}" r="1.6" fill="#1d252c"/><line x1="${x}" y1="${y}" x2="${TX - 3}" y2="${ty - 3}" stroke="#1d252c" stroke-width=".6"/><text x="${TX}" y="${ty}">${t}</text>`;
L(X(3.8) + .838 * S, Y(46.5), Y(52), 'steam drum · ID 1.676 m (end view)');
L(X(cc + 1.6), Y(48), Y(49.6), 'gas outlet → cross-over → back pass');
L(X(cx0 + cw * .8), Y(44.6), Y(47.2), 'cyclone dome');
L(X(9), Y(37.6), Y(44.6), 'cyclone inlet duct (rear wall)');
L(X(cx0 + cw), Y(39), Y(42), 'cyclone ×2 · ID 7.9 m · 24.5 m');
L(X(26.5), Y(40), Y(39.4), 'back pass: RH pass | SH + eco pass');
L(X(cx0 + cw - 1.6), Y(29), Y(34), 'cone');
L(X(cc + sp / 2), Y(20.2), Y(29.2), 'standpipe · ID 1.45 m');
L(X(riR), Y(21), Y(26.6), 'seal pot outlet riser');
L(X(potR), Y(17.6), Y(24), 'siphon seal pot · FL+15.2 (dip leg inside)');
L(X(potR - .2), Y(15.5), Y(21.4), 'fluidizing air box (2 compartments)');
L(X(8.3), Y(16.6), Y(18.8), 'solids return leg · ID 1.015 m');
L(X(29), Y(20.1), Y(16.2), 'flue gas → air heater');
L(X(4.7) + 5, Y(10.8065), Y(13.6), 'start-up burner ×4 · FL+10.8 · 25° (side walls)');
L(X(D - .5), Y(eRef), Y(11), 'refractory zone · 7.75 m');
L(X(-.9), Y(8.2), Y(8.4), 'fuel feed ×6 (front wall)');
L(X(gR - .5), Y(eG), Y(5.8), 'grate');
L(X(gR - .2), Y(4), Y(3.2), 'plenum ← primary air');
svg += `<text x="${X(.5)}" y="${Y(30)}" font-weight="700">FURNACE</text><text x="${X(.5)}" y="${Y(30) + 10}">lalim 7.68 m</text><text x="${X(.5)}" y="${Y(30) + 20}">lapad 15.5 m</text>`;
svg += `<text x="${X(-.4)}" y="${Y(0) + 8}" font-size="7">FRONT</text><text x="${X(D) - 18}" y="${Y(0) + 8}" font-size="7">REAR</text>`;
svg += `<line x1="${X(0)}" y1="${Y(0) + 50}" x2="${X(0) + 22}" y2="${Y(0) + 50}" stroke="${EST}" stroke-width="1.6" stroke-dasharray="4 3"/><text x="${X(0) + 26}" y="${Y(0) + 53}">= sukat WALA sa docs (tantiya): taas ng furnace, inlet duct, gas outlet, back pass, seal pot, plenum</text>`;
svg += '</g></svg>';
h = h.slice(0, a) + svg + h.slice(b);
h = h.replace(/<p style="color:var\(--dim\);margin:6px 0 0">[^<]*<\/p>/, '<p style="color:var(--dim);margin:6px 0 0">SIDE ELEVATION ayon sa flow diagram K1AU3-PD-051 (Combustion Air / Flue Gas): drum (dulo, bilog) sa itaas ng harap, furnace, inlet duct sa rear wall, cyclone, gas outlet na tumatawid papunta sa back pass. Hugis ng seal pot at return leg ayon sa K1AU3-PD-054 sheet 2. Iisang scale sa X at Y: 1 m = 8 px. Sukat mula sa FHI manual Part 2 at M&amp;S burner drawing; orange dash = tantiya pa.</p>');
fs.writeFileSync(F, h); console.log('ok');
