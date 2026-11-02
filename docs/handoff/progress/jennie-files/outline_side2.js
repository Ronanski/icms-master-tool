// outline v12: traced from flow diagram K1AU3-PD-051 (layout, part order, relative positions) + K1AU3-PD-054 sh.2 (seal pot / return leg),
// sized with FHI manual numbers; one true scale both axes (1 m = 8 px). Anything not in the docs is drawn and marked as an estimate.
const fs = require('fs');
const F = 'C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/furnace-cyclone-study.html';
let h = fs.readFileSync(F, 'utf8');
const a = h.indexOf('<svg viewBox='), b = h.indexOf('</svg>', a) + 6;
const S = 8, X = m => 72 + m * S, Y = e => 486 - e * S;
const EST = '#d9822b', GAS = '#b85a3c', SOL = '#c98a4a', AIR = '#3f7fbf';
const P = (...pts) => 'M' + pts.map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L') + 'Z';
let svg = '<svg viewBox="0 0 650 590" role="img" aria-label="Side elevation ng CFB boiler ayon sa flow diagram PD-051, naka-scale"><g font-family="IBM Plex Sans,sans-serif" font-size="8" fill="#0b0f13">';
// grid + axes
for (let e = 0; e <= 55; e += 5) svg += `<line x1="${X(-2.5)}" y1="${Y(e)}" x2="${X(35)}" y2="${Y(e)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/><line x1="26" y1="${Y(e)}" x2="34" y2="${Y(e)}" stroke="#1d252c"/><text x="2" y="${Y(e) + 3}">${e} m</text>`;
for (let m = 0; m <= 35; m += 5) svg += `<line x1="${X(m)}" y1="${Y(0)}" x2="${X(m)}" y2="${Y(55)}" stroke="#1d252c" stroke-width=".4" opacity=".35"/><line x1="${X(m)}" y1="${Y(0) + 18}" x2="${X(m)}" y2="${Y(0) + 26}" stroke="#1d252c"/><text x="${X(m) - 5}" y="${Y(0) + 36}">${m} m</text>`;
svg += `<line x1="30" y1="${Y(0)}" x2="30" y2="${Y(57)}" stroke="#1d252c"/><text x="2" y="${Y(57) - 5}" font-weight="700">Y · TAAS (elevation, m)</text>`;
svg += `<line x1="${X(0)}" y1="${Y(0) + 22}" x2="${X(35)}" y2="${Y(0) + 22}" stroke="#1d252c"/><text x="${X(35) + 8}" y="${Y(0) + 25}" font-weight="700">X · harap → likod (m)</text>`;
svg += `<line x1="34" y1="${Y(0)}" x2="${X(36)}" y2="${Y(0)}" stroke="#1d252c" stroke-width="1.5"/>`;
// ---- geometry (m / FL m) ----
const D = 7.6835, eG = 5.5, eT = eG + 7.748, gL = 2.05, gR = 5.45, eRoof = 48;           // furnace: depth + refractory (FHI S4); grate, roof = estimate
const cL = D + 4.6, cw = 7.9, cR = cL + cw, cc = cL + cw / 2, eCT = 45.6, eCB = eCT - 24.542, eBar = eCT - 10.3, sp = 1.45; // cyclone (FHI S4)
const bL = cL + .725 + .725 - 3.55 + 0, potL = cc + .725 - 3.55, potR = cc + .725, eAB = 15.2, ePB = 15.9, ePT = 17.4, riR = potL + 1.4, eRT = 19.7; // seal pot (PD-054 proportions, FL+15.2 platform)
const hoL = cL + .23 * cw, hoR = cL + .85 * cw, bpF = cR + 5, bpR = bpF + 9.6, eBR = 54, eBF = 46, eDiv = 46.8, eE2 = 25, eE1 = 18.3, eHop = 13.9; // back pass (PD-051 proportions)
const parts = [
  P([0, eRoof], [D, eRoof], [D, eT], [gR, eG], [gL, eG], [0, eT]),                                      // furnace + tapered refractory lower furnace
  P([-.3, eRoof], [D + .5, eRoof], [D + .5, eRoof + .5], [-.3, eRoof + .5]),                             // roof slab
  P([D - .2, eCT - .7], [cL + .2, eCT - .7], [cL + .2, eBar + 1.3], [D - .2, eBar + 1.3]),               // cyclone inlet duct
  P([cL, eCT], [cR, eCT], [cR, eBar], [cc + sp / 2, eCB], [cc - sp / 2, eCB], [cL, eBar]),               // cyclone: flat top, barrel, cone (PD-051)
  P([cc - sp / 2, eCB + .2], [cc + sp / 2, eCB + .2], [cc + sp / 2, ePT - .1], [cc - sp / 2, ePT - .1]), // standpipe
  P([potL, ePT], [potR, ePT], [potR, ePB], [potL, ePB]),                                                 // seal pot body
  P([potL, eRT], [riR, eRT], [riR, ePT - .2], [potL, ePT - .2]),                                         // outlet riser
  P([potL + .2, ePB], [potR - .2, ePB], [potR - .2, eAB], [potL + .2, eAB]),                             // fluidizing air box
  P([hoL, eCT - .3], [hoL, eBR], [bpR, eBR], [bpR, eE2], [bpF, eE2], [bpF, eBF], [hoR, 49], [hoR, eCT - .3]), // hood over the cyclone outlet + back pass (one enclosure, PD-051)
  P([bpF + .8, eE2 + .2], [bpR, eE2 + .2], [bpR, eHop], [bpF + 3, eHop], [bpF + .8, eE1]),               // ECO #1 section + hopper
  P([bpF + 3.2, eHop + .2], [bpR - .2, eHop + .2], [bpR - .2, eHop - 2.2], [bpF + 3.2, eHop - 2.2]),     // outlet to the air heater
  P([gL + .1, eG], [gR - .1, eG], [gR - .1, 2.2], [gL + .1, 3.9]),                                       // plenum (skewed, PD-051)
  P([gR - .2, 3.4], [gR + 1.4, 3.4], [gR + 1.4, 2.5], [gR - .2, 2.5]),                                   // primary air inlet (rear)
  P([-.15, eRoof + .4], [.6, eRoof + .4], [.6, 50.1], [-.15, 50.1]), P([1.1, eRoof + .4], [6.3, eRoof + .4], [6.3, 49.6], [1.1, 49.6]), // drum links, riser boxes
];
// return leg (ID 1.015): 45 deg off the riser top (PD-054), elbow, steep run into the rear taper of the lower furnace (PD-051)
const wallR = e => gR + (D - gR) * (e - eG) / (eT - eG);
const rl = [[potL + .3, eRT - .5], [potL - 2.5, eRT - 3.3], [wallR(8.2) + .1, 8.2]];
const rlPath = `M${rl.map(([x, y]) => X(x) + ' ' + Y(y)).join(' L')}`;
// second cyclone behind
svg += `<path d="M${X(cL) + 7} ${Y(eCT) - 5} H${X(cR) + 7} V${Y(eBar) - 5} L${X(cc + sp / 2) + 7} ${Y(eCB) - 5} H${X(cc - sp / 2) + 7} L${X(cL) + 7} ${Y(eBar) - 5}Z" fill="#7f8a93" stroke="#000" stroke-width="2"/>`;
parts.forEach(d => svg += `<path d="${d}" fill="none" stroke="#000" stroke-width="3.2" stroke-linejoin="round"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#000" stroke-width="${1.015 * S + 3.2}" stroke-linejoin="round"/>`;
parts.forEach(d => svg += `<path d="${d}" fill="#a9b4bd"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#a9b4bd" stroke-width="${1.015 * S}" stroke-linejoin="round"/>`;
// drum (ID 1.676, end view) + link pipe to the roof (PD-051)
svg += `<path d="M${X(-.7)} ${Y(50.6) - 9} H${X(D + .2)} V${Y(eRoof + .5)}" fill="none" stroke="#000" stroke-width="5"/><path d="M${X(-.7)} ${Y(50.6) - 9} H${X(D + .2)} V${Y(eRoof + .5)}" fill="none" stroke="#a9b4bd" stroke-width="2.4"/>`;
svg += `<circle cx="${X(-.7)}" cy="${Y(50.6)}" r="${.838 * S + 1.5}" fill="#a9b4bd" stroke="#000" stroke-width="2.4"/>`;
[1.1, 2.83, 4.56].forEach(x => svg += `<line x1="${X(x)}" y1="${Y(eRoof + .4)}" x2="${X(x)}" y2="${Y(49.6)}" stroke="#000" stroke-width="1.4"/>`);
// refractory, grate + bottom ash drains, division wall, dip leg, air box split, secondary air nozzles
svg += `<path d="${P([.12, eT], [D - .12, eT], [gR - .05, eG + .05], [gL + .05, eG + .05])}" fill="#b9a48c" opacity=".85"/>`;
svg += `<line x1="${X(gL)}" y1="${Y(eG)}" x2="${X(gR)}" y2="${Y(eG)}" stroke="#000" stroke-width="2.2" stroke-dasharray="2 2"/>`;
[gL + .2, gR - .2].forEach(x => svg += `<circle cx="${X(x)}" cy="${Y(eG) + 1}" r="2.4" fill="#a9b4bd" stroke="#000" stroke-width="1.2"/>`);
svg += `<line x1="${X(bpF + 4.8)}" y1="${Y(eDiv)}" x2="${X(bpF + 4.8)}" y2="${Y(eE2 + .6)}" stroke="#000" stroke-width="2"/>`;
svg += `<path d="M${X(cc - sp / 2)} ${Y(ePT)} V${Y(16.4)} M${X(cc + sp / 2)} ${Y(ePT)} V${Y(16.4)}" stroke="#000" stroke-width="2"/><rect x="${X(cc - sp / 2) + 1}" y="${Y(ePT) - 2}" width="${sp * S - 2}" height="${(ePT - 16.4) * S + 2}" fill="#a9b4bd"/>`;
svg += `<line x1="${X((potL + potR) / 2)}" y1="${Y(ePB)}" x2="${X((potL + potR) / 2)}" y2="${Y(eAB)}" stroke="#000" stroke-width="1.4"/>`;
const sa = [P([-1.6, 19.9], [9.3, 19.9], [9.3, 18.7], [-1.6, 18.7]), P([2.75, 20.4], [4.9, 20.4], [4.9, 16], [2.75, 16])];
sa.forEach(d => svg += `<path d="${d}" fill="#a9b4bd" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>`);
[[-1.6, -1], [9.3, 1]].forEach(([x, s]) => svg += `<circle cx="${X(x)}" cy="${Y(19.3)}" r="${.6 * S + 1}" fill="#a9b4bd" stroke="#000" stroke-width="2"/><line x1="${X(x + s * .5)}" y1="${Y(18.9)}" x2="${X(x + s * 1.5)}" y2="${Y(18.1)}" stroke="#000" stroke-width="3"/>`);
svg += `<path d="M${X(3.8)} ${Y(16)} Q${X(4.2)} ${Y(14.4)} ${X(6.2)} ${Y(14.4)} H${X(potL - 3.2)}" fill="none" stroke="${AIR}" stroke-width="1.6"/>`;
// expansion joints
const ej = (x, y, w, ang) => svg += `<g transform="rotate(${ang} ${x} ${y})"><line x1="${x - w / 2 - 2}" y1="${y - 1.6}" x2="${x + w / 2 + 2}" y2="${y - 1.6}" stroke="#000" stroke-width="1.4"/><line x1="${x - w / 2 - 2}" y1="${y + 1.6}" x2="${x + w / 2 + 2}" y2="${y + 1.6}" stroke="#000" stroke-width="1.4"/></g>`;
ej(X(cc), Y(eCB) + 5, sp * S, 0);
{ const p = rl[0], q = rl[1], t = .8; ej(X(p[0] + (q[0] - p[0]) * t), Y(p[1] + (q[1] - p[1]) * t), 1.015 * S, 45); }
// start-up burners A and C (side wall faces us), FL+10,806.5 (M&S 1612 13-0-05-C)
[2.4, 5.25].forEach(m => svg += `<rect x="${X(m) - 5}" y="${Y(10.8065) - 5}" width="10" height="10" fill="none" stroke="#e5484d" stroke-width="1.8"/><circle cx="${X(m)}" cy="${Y(10.8065)}" r="2.6" fill="none" stroke="#e5484d" stroke-width="1.4"/>`);
// estimate overlay (dashed orange) on parts whose size is NOT in the docs
[P([D - .2, eCT - .7], [cL + .2, eCT - .7], [cL + .2, eBar + 1.3], [D - .2, eBar + 1.3]), P([hoL, eCT - .3], [hoL, eBR], [bpR, eBR], [bpR, eHop], [bpF + 3, eHop], [bpF + .8, eE1], [bpF + .8, eE2], [bpF, eE2], [bpF, eBF], [hoR, 49], [hoR, eCT - .3]),
 P([potL, eRT], [riR, eRT], [riR, ePT], [potR, ePT], [potR, ePB], [potL, ePB]), P([gL, eG], [gR, eG], [gR, 2.2], [gL, 3.9]), P([2.75, 20.4], [4.9, 20.4], [4.9, 16], [2.75, 16]), `M${X(-.6)} ${Y(eRoof + .5)} H${X(D + .8)}`]
 .forEach(d => svg += `<path d="${d}" fill="none" stroke="${EST}" stroke-width="1.4" stroke-dasharray="4 3"/>`);
// flow arrows
svg += `<defs><marker id="mg" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="${GAS}"/></marker><marker id="ms" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="${SOL}"/></marker><marker id="ma" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6z" fill="${AIR}"/></marker></defs>`;
const ar = (pts, m, c) => svg += `<polyline points="${pts.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="none" stroke="${c}" stroke-width="1.6" marker-end="url(#${m})"/>`;
ar([[D - 1.3, 22], [D - 1.3, 42]], 'mg', GAS); ar([[D - .8, 40.5], [cL + 1.4, 40.5]], 'mg', GAS);
ar([[cc - .6, 42.5], [cc - .6, 51.5], [bpF + 2.4, 51.5], [bpF + 2.4, 40]], 'mg', GAS); ar([[bpF + 7.2, 51.5], [bpF + 7.2, 40]], 'mg', GAS);
ar([[bpF + 6, 21], [bpF + 6, eHop - 2.8]], 'mg', GAS);
ar([[cc + 1.2, 32], [cc + .2, eCB + 1.5], [cc + .2, 16.9]], 'ms', SOL); ar([[potL + .7, ePT - .6], [potL + .7, eRT - 1]], 'ms', SOL); ar([[potL - 2.8, eRT - 3.9], [wallR(8.2) + .9, 9.4]], 'ms', SOL);
ar([[gR + 2.8, 2.95], [gR + .1, 2.95]], 'ma', AIR);
// labels
const TX = X(36.5) + 4, L = (x, y, ty, t) => svg += `<circle cx="${x}" cy="${y}" r="1.6" fill="#1d252c"/><line x1="${x}" y1="${y}" x2="${TX - 3}" y2="${ty - 3}" stroke="#1d252c" stroke-width=".6"/><text x="${TX}" y="${ty}">${t}</text>`;
L(X(-.7) + .838 * S, Y(50.6), Y(57), 'steam drum T-1001 · ID 1.676 m');
L(X(3.5), Y(49.6), Y(55), 'riser boxes · furnace roof');
L(X(hoL + .3), Y(50), Y(53), 'cyclone outlet hood → back pass');
L(X(bpF + 2.4), Y(44), Y(51), 'back pass: reheater pass');
L(X(bpF + 7.2), Y(44), Y(49), 'back pass: finishing SH · eco #3');
L(X(D + 2), Y(eBar + 1.4), Y(46.6), 'cyclone inlet duct');
L(X(cR), Y(40), Y(44.2), 'cyclone S-1009A/B ×2 · ID 7.9 · 24.5 m');
L(X(bpF + 7.2), Y(eE2 + 1), Y(41.6), 'eco #2R | eco #2S · gas dampers');
L(X(cR - 1.8), Y(29), Y(39), 'cone');
L(X(bpR), Y(eE1 + 3), Y(36.4), 'eco #1 · hopper');
L(X(bpR - .2), Y(eHop - 1.2), Y(33.8), 'flue gas → air heater H-1052');
L(X(cc + sp / 2), Y(19.5), Y(31.2), 'standpipe · ID 1.45 m');
L(X(riR), Y(19), Y(28.6), 'seal pot outlet riser');
L(X(potR), Y(16.6), Y(26), 'seal pot T-1009A/B · FL+15.2');
L(X(potR - .2), Y(15.5), Y(23.4), 'fluidizing air box (2 compartments)');
L(X(rl[1][0] - .9), Y(rl[1][1] - 2), Y(20.8), 'solids return leg · ID 1.015 m');
L(X(9.3) + 5, Y(19.3), Y(18.2), 'secondary air headers + box');
L(X(8.5), Y(14.4), Y(15.6), 'secondary air ← air heater');
L(X(D - .4), Y(eT - .3), Y(13), 'refractory zone · 7.75 m');
L(X(5.25) + 5, Y(10.8065), Y(10.4), 'start-up burner ×4 · FL+10.8 (A, C kita)');
L(X(gR - .2), Y(eG) + 1, Y(7.8), 'grate · bottom ash drains');
L(X(gR + 1.4), Y(2.95), Y(5.2), 'plenum ← primary air');
svg += `<text x="${X(.4)}" y="${Y(31) - 10}" font-weight="700">FURNACE</text><text x="${X(.4)}" y="${Y(31)}">H-1001</text><text x="${X(.4)}" y="${Y(31) + 10}">lalim 7.68 m</text><text x="${X(.4)}" y="${Y(31) + 20}">lapad 15.5 m</text>`;
svg += `<text x="${X(-.4)}" y="${Y(0) + 8}" font-size="7">FRONT</text><text x="${X(D) - 18}" y="${Y(0) + 8}" font-size="7">REAR</text>`;
svg += `<line x1="${X(0)}" y1="${Y(0) + 50}" x2="${X(0) + 22}" y2="${Y(0) + 50}" stroke="${EST}" stroke-width="1.6" stroke-dasharray="4 3"/><text x="${X(0) + 26}" y="${Y(0) + 53}">= laki/taas WALA sa docs, kinuha ang proporsyon sa PD-051/054: roof, inlet duct, hood, back pass, seal pot, SA box, plenum</text>`;
svg += '</g></svg>';
h = h.slice(0, a) + svg + h.slice(b);
h = h.replace(/<p style="color:var\(--dim\);margin:6px 0 0">[^<]*<\/p>/, '<p style="color:var(--dim);margin:6px 0 0">SIDE ELEVATION na sinundan ang flow diagram K1AU3-PD-051 (pagkakasunod at posisyon ng bawat bahagi) at K1AU3-PD-054 sh.2 (seal pot, return leg). Sukat mula sa FHI manual Part 2 at M&amp;S burner drawing. Iisang scale sa X at Y: 1 m = 8 px. Orange dash = laki o taas na wala sa docs; proporsyon ay kinuha sa flow diagram.</p>');
fs.writeFileSync(F, h); console.log('ok');
