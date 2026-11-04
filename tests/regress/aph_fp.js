// Mina's live test 2026-11-05 (AIR AND FLUE GAS, beta.31): the AIR PREHEATER (DITL-43) START was blocked at Cold by row 5 I.0651
// "AIR PREHEATER NOT TRIP" = 0 and its faceplate had no RELAY RESET (the drawing has no ELECTRICAL TROUBLE symbol). The RELAY row now
// drives the NOT TRIP field contact. Real clicks: RESET -> NOT TRIP 1 -> START -> RUNNING; TRIP -> stops.
// Usage: node tests/regress/aph_fp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="MK09"]').click());await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},t);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
const nt=()=>page.evaluate(()=>DUI.rowVal(LS_DOCK.dOf('DITL-43'),4));
ck(await clk('[data-hit="APH"]'),'air preheater on the page');await wait(700);
ck(await nt()===0,'Cold: NOT TRIP (row 5) = 0');
ck(await btn('RESET')==='ok','RELAY RESET enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await nt()===1,'after RESET: NOT TRIP = 1');
const st=await btn('START');ck(st==='ok','DCS START enabled ('+st+')');await wait(300);await btn('EXECUTE');await wait(5000);
ck(await page.evaluate(()=>LS_DOCK.mst('DITL-43'))==='RUN','air preheater RUNNING');
ck(await btn('TRIP')==='ok','RELAY TRIP enabled');await wait(300);await btn('EXECUTE');await wait(4000);
ck(await page.evaluate(()=>LS_DOCK.mst('DITL-43'))!=='RUN','after TRIP: not running ('+await page.evaluate(()=>LS_DOCK.mst('DITL-43'))+')');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
