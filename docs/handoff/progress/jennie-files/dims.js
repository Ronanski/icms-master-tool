// dimension sheet: same outline as v12 (outline_side2.js geometry), no part names, only dimension lines + elevations.
// black = from the docs, orange = proportion taken from flow diagram PD-051/054 (not in the docs)
const fs = require('fs');
const F = 'C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/furnace-cyclone-study.html';
let h = fs.readFileSync(F, 'utf8');
const S = 8, X = m => 72 + m * S, Y = e => 500 - e * S;
const DOC = '#0b0f13', EST = '#b8560f';
const P = (...pts) => 'M' + pts.map(([x, y]) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`).join(' L') + 'Z';
const D = 7.6835, eG = 5.5, eT = eG + 7.748, gL = 2.05, gR = 5.45, eRoof = 48;
const cL = D + 4.6, cw = 7.9, cR = cL + cw, cc = cL + cw / 2, eCT = 45.6, eCB = eCT - 24.542, eBar = eCT - 10.3, sp = 1.45;
const potL = cc + .725 - 3.55, potR = cc + .725, eAB = 15.2, ePB = 15.9, ePT = 17.4, riR = potL + 1.4, eRT = 19.7;
const hoL = cL + .23 * cw, hoR = cL + .85 * cw, bpF = cR + 5, bpR = bpF + 9.6, eBR = 54, eBF = 46, eE2 = 25, eE1 = 18.3, eHop = 13.9;
const wallR = e => gR + (D - gR) * (e - eG) / (eT - eG);
const rl = [[potL + .3, eRT - .5], [potL - 2.5, eRT - 3.3], [wallR(8.2) + .1, 8.2]];
let svg = '<svg viewBox="0 0 420 560" role="img" aria-label="Sukat lamang: outline ng CFB boiler na may dimension lines"><g font-family="IBM Plex Sans,sans-serif" font-size="7.5" fill="#0b0f13">';
for (let e = 0; e <= 55; e += 5) svg += `<line x1="26" y1="${Y(e)}" x2="34" y2="${Y(e)}" stroke="#1d252c"/><text x="2" y="${Y(e) + 3}">${e} m</text>`;
svg += `<line x1="30" y1="${Y(0)}" x2="30" y2="${Y(58)}" stroke="#1d252c"/><line x1="34" y1="${Y(0)}" x2="${X(37)}" y2="${Y(0)}" stroke="#1d252c" stroke-width="1.5"/>`;
for (let m = 0; m <= 35; m += 5) svg += `<line x1="${X(m)}" y1="${Y(0)}" x2="${X(m)}" y2="${Y(0) + 6}" stroke="#1d252c"/><text x="${X(m) - 5}" y="${Y(0) + 15}">${m} m</text>`;
// outline only (light), no names
const parts = [
  P([0, eRoof], [D, eRoof], [D, eT], [gR, eG], [gL, eG], [0, eT]), P([D - .2, eCT - .7], [cL + .2, eCT - .7], [cL + .2, eBar + 1.3], [D - .2, eBar + 1.3]),
  P([cL, eCT], [cR, eCT], [cR, eBar], [cc + sp / 2, eCB], [cc - sp / 2, eCB], [cL, eBar]), P([cc - sp / 2, eCB + .2], [cc + sp / 2, eCB + .2], [cc + sp / 2, ePT - .1], [cc - sp / 2, ePT - .1]),
  P([potL, ePT], [potR, ePT], [potR, ePB], [potL, ePB]), P([potL, eRT], [riR, eRT], [riR, ePT - .2], [potL, ePT - .2]), P([potL + .2, ePB], [potR - .2, ePB], [potR - .2, eAB], [potL + .2, eAB]),
  P([hoL, eCT - .3], [hoL, eBR], [bpR, eBR], [bpR, eE2], [bpF, eE2], [bpF, eBF], [hoR, 49], [hoR, eCT - .3]),
  P([bpF + .8, eE2 + .2], [bpR, eE2 + .2], [bpR, eHop], [bpF + 3, eHop], [bpF + .8, eE1]), P([gL + .1, eG], [gR - .1, eG], [gR - .1, 2.2], [gL + .1, 3.9])];
const rlPath = `M${rl.map(([x, y]) => X(x) + ' ' + Y(y)).join(' L')}`;
parts.forEach(d => svg += `<path d="${d}" fill="none" stroke="#2b333a" stroke-width="2.2" stroke-linejoin="round"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#2b333a" stroke-width="${1.015 * S + 2.2}" stroke-linejoin="round"/>`;
parts.forEach(d => svg += `<path d="${d}" fill="#c3ccd3"/>`);
svg += `<path d="${rlPath}" fill="none" stroke="#c3ccd3" stroke-width="${1.015 * S}" stroke-linejoin="round"/>`;
svg += `<circle cx="${X(-.7)}" cy="${Y(50.6)}" r="${.838 * S}" fill="#c3ccd3" stroke="#2b333a" stroke-width="2"/>`;
svg += '<defs><marker id="dt" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1 L8 4 L0 7z" fill="context-stroke"/></marker></defs>';
const fmt = v => (Math.round(v * 100) / 100).toString();
// dimension lines: horizontal (x1..x2 at elevation e), vertical (e1..e2 at x); extension lines to the part
const dH = (x1, x2, e, est, txt, ext) => { const c = est ? EST : DOC, y = Y(e);
  if (ext != null) [x1, x2].forEach(x => svg += `<line x1="${X(x)}" y1="${Y(ext)}" x2="${X(x)}" y2="${y + (Y(ext) > y ? 3 : -3)}" stroke="${c}" stroke-width=".5"/>`);
  svg += `<line x1="${X(x1)}" y1="${y}" x2="${X(x2)}" y2="${y}" stroke="${c}" stroke-width=".9" marker-start="url(#dt)" marker-end="url(#dt)"/><text x="${(X(x1) + X(x2)) / 2}" y="${y - 3}" text-anchor="middle" fill="${c}" font-weight="600">${txt || fmt(x2 - x1)}</text>`; };
const dV = (e1, e2, x, est, txt, ext) => { const c = est ? EST : DOC, xx = X(x);
  if (ext != null) [e1, e2].forEach(e => svg += `<line x1="${X(ext)}" y1="${Y(e)}" x2="${xx + (X(ext) > xx ? -3 : 3)}" y2="${Y(e)}" stroke="${c}" stroke-width=".5"/>`);
  svg += `<line x1="${xx}" y1="${Y(e1)}" x2="${xx}" y2="${Y(e2)}" stroke="${c}" stroke-width=".9" marker-start="url(#dt)" marker-end="url(#dt)"/><text transform="translate(${xx - 3} ${(Y(e1) + Y(e2)) / 2}) rotate(-90)" text-anchor="middle" fill="${c}" font-weight="600">${txt || fmt(e2 - e1)}</text>`; };
const el = (x, e, est, txt, left) => { const c = est ? EST : DOC; svg += `<path d="M${X(x)} ${Y(e)} l-3 -5 h6z" fill="${c}"/><text x="${X(x) + (left ? -5 : 5)}" y="${Y(e) - 2}" text-anchor="${left ? 'end' : 'start'}" fill="${c}">${txt}</text>`; };
// horizontal chain above everything
dH(0, D, 56.5, false, '7.68', eRoof + .5); dH(D, cL, 56.5, true, '4.6'); dH(cL, cR, 56.5, false, '7.9', eCT); dH(cR, bpF, 56.5, true, '5.0'); dH(bpF, bpR, 56.5, true, '9.6', eBR);
dH(gL, gR, 1.2, true, '3.4', eG); dH(cc - sp / 2, cc + sp / 2, 23, false, '1.45');
dH(potL, potR, 13.9, true, '3.55', eAB); dH(potL, riR, 21, true, '1.4');
dH(bpF + 3, bpR, 11.5, true, '6.6', eHop - 1);
dH(hoL, hoR, 50, true, '4.9 ≈ 0.62 D');
// vertical chains
dV(eG, eT, -3, false, '7.75', 0); dV(eT, eRoof, -3, true, '34.75', 0); dV(0, eG, -3, true, '5.5', gL);
dV(eBar + 1.3, eCT - .7, D + 1.2, true, '8.3');
dV(eCB, eBar, cR + 2.4, true, '14.2', cR); dV(eBar, eCT, cR + 2.4, true, '10.3', cR); dV(eCB, eCT, cR + 4, false, '24.54');
dV(ePT, eRT, potR + 5.3, true, '2.3', riR); dV(eAB, ePT, potR + 5.3, true, '2.2', potR);
dV(eE2, eBR, bpR + 1.6, true, '29', bpR); dV(eHop, eE2, bpR + 1.6, true, '11.1');
// elevation marks
el(D, eRoof, true, 'FL+48.0', false); el(cR, eCT, true, 'FL+45.6', false); el(cc + sp / 2, eCB, true, 'FL+21.1', false);
el(potR, eAB, false, 'FL+15.2', false); el(riR, eRT, true, 'FL+19.7', false); el(bpR, eBR, true, 'FL+54', true);
el(gL * (eT - 10.8065) / (eT - eG), 10.8065, false, 'burner FL+10.8', false); el(gR, eG, true, 'grate FL+5.5', false);
// diameters
svg += `<text x="${X(-.7) - 9}" y="${Y(50.6) - 9}" text-anchor="middle" font-weight="600">Ø1.676</text>`;
svg += `<text x="${X(rl[1][0]) - 4}" y="${Y(rl[1][1] - 3)}" text-anchor="end" font-weight="600">Ø1.015</text>`;
svg += `<text x="${X(0)}" y="${Y(0) + 32}" fill="${DOC}" font-weight="700">itim = galing sa docs</text><text x="${X(14)}" y="${Y(0) + 32}" fill="${EST}" font-weight="700">orange = proporsyon mula sa PD-051/054</text><text x="${X(0)}" y="${Y(0) + 44}">lahat ng sukat ay metro · 1 m = 8 px sa X at Y</text>`;
svg += '</g></svg>';
const sec = `<section class="card" id="dims"><p class="kick">Hakbang 1b · Sukat lang</p><h2>Outline na walang pangalan ng parts: puro sukat</h2>${svg}</section>`;
const i0 = h.indexOf('<section class="card" id="dims">');
if (i0 >= 0) { const i1 = h.indexOf('</section>', i0) + 10; h = h.slice(0, i0) + sec + h.slice(i1); }
else { const k = h.indexOf('</section>', h.indexOf('<section class="card two">')) + 10; h = h.slice(0, k) + '\n\n  ' + sec + h.slice(k); }
h = h.replace('<tr><td>Side walls (E/W)</td><td>Start-up over-bed burners sa FL+8,800.</td></tr>', '<tr><td>Side walls (E/W)</td><td>Start-up over-bed burners: platform sa FL+8,800; burner centre sa FL+10,806.5, 25° pababa (M&amp;S 1612 13-0-05-C).</td></tr>');
fs.writeFileSync(F, h); console.log('ok');
