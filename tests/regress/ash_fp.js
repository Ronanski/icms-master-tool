// Mina's live test 2026-11-05 (ESP AND ASH, beta.33): the ASH COOLER A faceplate (DITL-21A) had its local START grey ("LOCAL START /
// FORWARD P.B.", row 22 I.0257, was not read) and E-STOP "not on DITL-21A" although row 18 I.0256 NOT EMERGENCY STOP = 0 at Cold holds
// the cooler stopped. Real clicks: RELEASE -> row 18 = 1; local START enabled in LOCAL; EMERGENCY STOP -> row 18 = 0.
// Usage: node tests/regress/ash_fp.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="MK14"]').click());await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const btn=async (t,i)=>{const b=await page.evaluate(([t,i])=>{const p=document.getElementById('fpop');if(!p)return null;const e=[...p.querySelectorAll('button')].filter(x=>x.textContent.trim()===t&&x.offsetParent)[i||0];if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.disabled]},[t,i]);if(b&&!b[2])await page.mouse.click(b[0],b[1]);return b?(b[2]?'disabled':'ok'):'none'};
const es=()=>page.evaluate(()=>DUI.rowVal(LS_DOCK.dOf('DITL-21A'),17));
ck(await clk('[data-hit="BCA"]'),'ash cooler A on the page');await wait(700);
ck(await es()===0,'Cold: NOT EMERGENCY STOP (row 18) = 0');
ck(await btn('RELEASE')==='ok','E-STOP RELEASE enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await es()===1,'after RELEASE: row 18 = 1');
const ls=await page.evaluate(()=>{const p=document.getElementById('fpop');const b=[...p.querySelectorAll('button')].filter(x=>x.textContent.trim()==='START'&&x.offsetParent);return b.map(x=>x.disabled)});
ck(ls.length===2&&ls[1]===false,'local panel START enabled in LOCAL ('+JSON.stringify(ls)+')');
ck(await btn('EMERGENCY STOP')==='ok','EMERGENCY STOP enabled');await wait(300);await btn('EXECUTE');await wait(2500);
ck(await es()===0,'after EMERGENCY STOP: row 18 = 0');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
