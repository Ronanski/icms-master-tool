// Mina's live test 2026-11-05 (AIR AND FLUE GAS, beta.32): (1) the label MCV-FA1053-1 (FICFA1071, same controller as the PRIMARY AIR
// FLOW label) opened nothing: only the first label of a controller was wired; (2) the RH / SH biasing damper station HICHR1002A stepped
// 0.1 / 0.5 % per press. Real clicks. Usage: node tests/regress/afg_ctl.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.setViewportSize({width:1600,height:900});
await page.evaluate(async()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();if(AN.view)AN.viewSet(false);AN.run=true});
await page.evaluate(()=>lsPlant(true));await page.waitForTimeout(1500);
await page.evaluate(()=>document.querySelector('#pllist button[data-id="MK09"]').click());await page.waitForTimeout(2000);
const wait=ms=>page.waitForTimeout(ms);
const clk=async sel=>{const b=await page.evaluate(sel=>{const e=[...document.querySelectorAll(sel)].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]},sel);if(b)await page.mouse.click(b[0],b[1]);return !!b};
const fpT=()=>page.evaluate(()=>{const p=[...document.querySelectorAll('.fpo-near')].find(d=>d.offsetParent);return p?p.innerText.split('\n')[0]:''});
ck(await clk('[data-hit="MPA"]'),'MCV-FA1053-1 label on the page');await wait(800);
ck(/FICFA1071/.test(await fpT()),'it opens the FICFA1071 faceplate ('+(await fpT())+')');
await page.keyboard.press('Escape');await wait(400);
ck(!(await fpT()),'Escape closes the controller faceplate');
ck(await clk('[data-hit="RHD"]'),'RH biasing damper label');await wait(800);
const v0=await page.evaluate(()=>+[...document.querySelectorAll('.fpo-near input')].find(i=>i.offsetParent).value);
const up=await page.evaluate(()=>{const b=[...document.querySelectorAll('.fpo-near button')].find(x=>x.textContent.trim()==='▲▲'&&x.offsetParent);if(!b)return null;const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]});
if(up)await page.mouse.click(up[0],up[1]);await wait(800);
const v1=await page.evaluate(()=>+[...document.querySelectorAll('.fpo-near input')].find(i=>i.offsetParent).value);
ck(Math.abs(v1-v0-5)<0.01,'▲▲ = +5 % ('+v0+' -> '+v1+')');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
