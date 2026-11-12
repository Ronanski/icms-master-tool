// Mina's live test 2026-11-05 (028 CONDENSATE, beta.30): the AUTO of the CEP-A / B faceplate stayed grey: DITL-61A rows 4 / 14 are
// "CONDENSATE PUMP A M.1182 AUTO SELECTED" (no "MODE"), LS_DOCK.modeOf saw no AUTO row. Also the MOV lamp FULLY OPEN of DITL-60 (output
// row 7) was wired to the FULLY CLOSED input I.033B (03-models.js took the first address near the row, not the nearest).
// Checks: modeOf(CEP-A / B).au is known; CEP-B REMOTE + AUTO is the standby: CEP-A trips -> CEP-B starts; DITL-60 at Cold: FULLY CLOSED
// lamp 1, FULLY OPEN lamp 0.
// Usage: node tests/regress/cep_auto.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.waitForTimeout(2000);const wait=ms=>page.waitForTimeout(ms);
const md=await page.evaluate(()=>[LS_DOCK.modeOf('M.3350'),LS_DOCK.modeOf('M.3351')]);
ck(md[0]&&md[0].au!==null&&md[1]&&md[1].au!==null,'CEP-A / B AUTO mode is read ('+JSON.stringify(md)+')');
const lamp=await page.evaluate(()=>{const s=LS_DOCK.dOf('DITL-60');const o=DUI.outs(s);const v=re=>{const q=o.find(q=>re.test(q.name));return q?DUI.outVal(s,q.row):null};return [v(/FULLY CLOSED/),v(/FULLY OPEN/)]});
ck(lamp[0]===1&&lamp[1]===0,'DITL-60 MV-MU1001 closed: FULLY CLOSED lamp 1, FULLY OPEN lamp 0 ('+lamp+')');
// CEP-A REMOTE + start, CEP-B REMOTE + AUTO
await page.evaluate(()=>{LS_DOCK.dremote('M.3350');LS_DOCK.dremote('M.3351')});await wait(1500);
await page.evaluate(()=>LS_DOCK.dmotor('M.3350',true));await wait(5000);
const b=await page.evaluate(()=>{const s=LS_DOCK.dOf('M.3351');const a=LS_DOCK.amRow(s);if(!a)return 'no amRow';LS_DOCK.dsel(s.name,a.row,1,'CEP-B AUTO');return LS_DOCK.modeOf('M.3351')});
await wait(1500);
ck(b&&b.au!==undefined,'CEP-B AUTO selected ('+JSON.stringify(b)+')');
const r0=await page.evaluate(()=>[LS_DOCK.mst('M.3350'),LS_DOCK.mst('M.3351'),JSON.stringify(LS_DOCK.modeOf('M.3351'))]);
ck(r0[0]==='RUN'&&r0[1]==='STOP','CEP-A running, CEP-B stopped ('+r0+')');
// trip CEP-A (its ELECTRICAL / TRIP user switch, as the RELAY TRIP of the faceplate)
const tr=await page.evaluate(()=>{const s=LS_DOCK.dOf('M.3350');const u=(s.nl.usr||[]).find(x=>/TRIP|ELECTRICAL/.test(x.txt||x.name||x.svc||''))||(s.nl.usr||[])[0];if(!u){LS_DOCK.fieldRow(s.name,2,1,'CEP-A TRIP');return 'row3'}s.usw=s.usw||{};s.usw[u.key]=true;WORLD.busy=true;return u.key});
await wait(8000);
const r1=await page.evaluate(()=>[LS_DOCK.mst('M.3350'),LS_DOCK.mst('M.3351')]);
ck(r1[0]!=='RUN'&&r1[1]==='RUN','after CEP-A trip ('+tr+'): CEP-B started by itself ('+r1+')');
// MV-MU1001 (DITL-60) on 028 CONDENSATE: LOCAL at Cold, the faceplate FIELD SELECTOR -> REMOTE, then OPEN (real clicks)
await page.setViewportSize({width:1600,height:900});
// 3.2.3-beta.152: the start screen of layout C (3.2.1) covers the app: close it the way the operator does, then open the page as the layout does
await page.evaluate(()=>{const k=document.querySelector('#scstart .scskip');if(k&&k.offsetParent)k.click()});await wait(1000);
await page.evaluate(()=>window.lsShellC&&lsShellC.openPage?lsShellC.openPage('MK05'):(lsPlant(true),document.querySelector('#pllist button[data-id="MK05"]').click()));await wait(2000);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},t);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
ck(await clk('[data-hit="V60"]'),'MV-MU1001 on the page');await wait(700);
{const r0=await btn('OPEN');const tx=await page.evaluate(()=>(document.getElementById('fpop')||{}).innerText);ck(r0==='disabled','LOCAL: OPEN disabled ('+r0+') '+String(tx).split(String.fromCharCode(10)).join(' · ').slice(0,300));}
ck(await btn('REMOTE')==='ok','FIELD SELECTOR REMOTE');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await page.evaluate(()=>{const s=LS_DOCK.dOf('DITL-60');return DUI.rowVal(s,9)})===1,'DITL-60 row 10 REMOTE SELECTED = 1');
// 3.2.3: MV-MU1001 strokes in 41 s (Limitorque confirmation sheet, K1AU3-E2-0-122 RA, 03b-sim.js MV_CLOSE_S; was 10 s NO-SOURCE when this test waited 12 s)
ck(await btn('OPEN')==='ok','REMOTE: OPEN enabled');await wait(300);await btn('EXECUTE');await wait(45000);
const lp=await page.evaluate(()=>{const s=LS_DOCK.dOf('DITL-60');const o=DUI.outs(s);const v=re=>{const q=o.find(q=>re.test(q.name));return q?DUI.outVal(s,q.row):null};return [v(/FULLY CLOSED/),v(/FULLY OPEN/)]});
ck(lp[0]===0&&lp[1]===1,'after OPEN: FULLY CLOSED 0, FULLY OPEN 1 ('+lp+')');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
