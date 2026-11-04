// Mina's live test 2026-11-05 (INSTRUMENT AND PLANT AIR, beta.29): a click on an air compressor or an air dryer opened only the I/O card,
// nothing on the page could start them. Now: compressor = FIELD pop-out (START / STOP at the local panel, TRIP / RESET), dryer = DITL-45
// push-button pop-out with the FIELD REMOTE / LOCAL selector (the DCS START / STOP P.B. need REMOTE I.0099).
// Checks with real mouse clicks on the page: IA compressor A START -> RUNNING (DITL-113 row 6) and the plant model runs it; TRIP -> TRIP,
// RESET -> STOPPED; IA dryer A: START blocked in LOCAL, REMOTE then START -> RUNNING (DITL-45 output 15), STOP -> STOPPED.
// Usage: node tests/regress/air_fp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(2000);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="MK03"]').click());await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const hit=async id=>{const b=await page.evaluate(id=>{const e=[...document.querySelectorAll(`[data-hit="${id}"]`)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},id);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async t=>{const b=await page.evaluate(t=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].find(x=>x.textContent.trim()===t&&x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},t);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
const st=()=>page.evaluate(()=>{const p=document.getElementById('fpop');return p?(p.querySelector('.fpo-val')||{}).textContent||p.innerText.slice(0,80):null});
// compressor A
ck(await hit('iac0'),'instrument air compressor A on the page');await wait(600);
ck(await st()!==null,'compressor A: a pop-out opened ('+(await st())+')');
ck(await btn('START')==='ok','compressor A: FIELD START enabled');await wait(300);ck(await btn('EXECUTE')==='ok','EXECUTE');await wait(5000);
const r1=await page.evaluate(()=>[DUI.rowVal(LS_DOCK.dOf('DITL-113'),5),AN.unit.iaR0,AN.unit.iaI0]);
ck(r1[0]===1&&r1[1]===1,'compressor A RUNNING (DITL-113 row 6 = '+r1[0]+', model run '+r1[1]+', '+Math.round(r1[2])+' A)');
ck(/RUNNING/.test(await st()),'pop-out shows RUNNING');
ck(await btn('TRIP')==='ok','TRIP enabled while running');await wait(300);await btn('EXECUTE');await wait(3000);
const r2=await page.evaluate(()=>[DUI.rowVal(LS_DOCK.dOf('DITL-113'),6),AN.unit.iaR0]);
ck(r2[0]===1&&r2[1]===0,'after TRIP: trip row 1, compressor stopped ('+r2+')');ck(/TRIP/.test(await st()),'pop-out shows TRIP');
ck(await btn('RESET')==='ok','RESET enabled');await wait(300);await btn('EXECUTE');await wait(3000);
ck(/STOPPED/.test(await st()),'after RESET: STOPPED ('+(await st())+')');
await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());await wait(300);
// dryer A
ck(await hit('iad0'),'instrument air dryer A on the page');await wait(600);
ck(await btn('START')==='disabled','dryer A in LOCAL: DCS START blocked');
ck(await btn('REMOTE')==='ok','FIELD REMOTE enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await page.evaluate(()=>DUI.rowVal(LS_DOCK.dOf('DITL-45'),15))===1,'dryer A REMOTE (DITL-45 row 16 = 1)');
ck(await btn('START')==='ok','dryer A START enabled in REMOTE');await wait(300);await btn('EXECUTE');await wait(3000);
ck(await page.evaluate(()=>LS_DOCK.dout('DITL-45',14))===1,'dryer A RUNNING (DITL-45 output 15)');
ck(await btn('STOP')==='ok','dryer A STOP enabled');await wait(300);await btn('EXECUTE');await wait(3000);
ck(await page.evaluate(()=>LS_DOCK.dout('DITL-45',14))===0,'dryer A STOPPED after STOP');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
