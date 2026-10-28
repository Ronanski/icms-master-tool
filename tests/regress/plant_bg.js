// PLANT VIEW 1:1 HMI picture (2.5.0-beta.17, user 2026-10-20 "kopyahin mo ang reference 1:1"): every plant screen shows its
// control-room HMI snapshot (src/ui/plant/hmibg.js from tools/data/hmibg.py); only what moves is drawn on it.
// Checks: the picture data matches systems.js (item count), each screen draws its picture, LIVE numbers / valve colours / A M R
// follow the engine, LIVE off = the pure snapshot, the unit screen (no snapshot) still draws its own graphic, no page error.
// Usage: node tests/regress/plant_bg.js [html]
const fs=require('fs');const {open}=require('./lib.js');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ok=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)fail++};
await page.evaluate(()=>{AN.reset();AN.plantLoad150();AN.settle()});await page.evaluate(()=>window.lsPlant(true));await page.waitForTimeout(800);
const meta=await page.evaluate(()=>PLANT_SYS.map(s=>({id:s.id,src:s.src,n:s.items.length,bg:window.PLANT_BG&&PLANT_BG[s.id]?PLANT_BG[s.id].n:null})));
const withPic=meta.filter(m=>/\.png$/i.test(m.src));
ok(withPic.length===27&&withPic.every(m=>m.bg===m.n),'picture data for '+withPic.filter(m=>m.bg===m.n).length+' / '+withPic.length+' screens matches systems.js'+(withPic.filter(m=>m.bg!==m.n).map(m=>' '+m.id).join('')));
const go=async id=>{await page.evaluate(id=>[...document.querySelectorAll('#pllist button')].find(x=>x.dataset.id===id).click(),id);await page.waitForTimeout(1600)};
const vis=()=>page.evaluate(()=>[...document.querySelectorAll('#plsvg text')].filter(e=>!e.closest('[visibility="hidden"]')).length);
let drawn=0,live=0;
for(const m of withPic){await go(m.id);const r=await page.evaluate(()=>({img:document.querySelectorAll('#plsvg > g > image').length,txt:[...document.querySelectorAll('#plsvg text')].filter(e=>!e.closest('[visibility="hidden"]')).length}));if(r.img===1)drawn++;if(r.txt>=7)live++}
ok(drawn===withPic.length,'each screen draws its HMI picture: '+drawn+' / '+withPic.length);
ok(live===withPic.length,'each screen shows LIVE numbers on the picture (at least the 7 of the header): '+live+' / '+withPic.length);
/* 033 CCS: header MSP, HIC-BM MV and the A / M buttons follow the engine */
await go('33');
const cc=await page.evaluate(async()=>{const sh=AN.sheets.find(s=>s.name==='ABC-001C'),S=sh.S;const b=S.blk.find(b=>b.k==='MAN'&&(b.tag==='HIC-BM'||(b.txt||[]).includes('HIC-BM')));const n=b.o[0],old=S.rt.force[n];S.rt.force[n]=44.4;S.rt.v[n]=44.4;await new Promise(r=>setTimeout(r,1400));
 const T=[...document.querySelectorAll('#plsvg text')].filter(e=>!e.closest('[visibility="hidden"]')).map(e=>e.textContent);S.rt.force[n]=old;return T.includes('44.4')});
ok(cc,'033: HIC-BM MV field shows the engine value 44.4');
const am=await page.evaluate(()=>[...document.querySelectorAll('#plsvg rect')].filter(r=>/plgl|plgr/.test(r.getAttribute('fill')||'')&&!r.closest('[visibility="hidden"]')).length);
ok(am===5,'033: one lit mode button on each of the 5 faceplates ('+am+')');
/* 003: a control valve gets the HMI colour of its opening (closed green, open red, between white) */
await go('03');
const vc=await page.evaluate(async()=>{const o=window.lsPlantLive().find(x=>x.tag==='TCVFW11101');const sh=AN.sheets.find(s=>s.name===o.sh),S=sh.S;const c=AN.hmiCtrls(S).find(x=>x.tag==='TICBR1140'||x.tag==='TICBR1130');
 const hit=document.querySelector('#plsvg [data-tag="TCVFW11101"]');const r=hit.getBoundingClientRect();const msk=[...document.querySelectorAll('#plsvg rect[mask]')].find(e=>{const b=e.getBoundingClientRect();return b.left>=r.left-2&&b.right<=r.right+2&&b.top>=r.top-2&&b.bottom<=r.bottom+2});
 return msk?msk.getAttribute('fill')+' '+msk.getAttribute('visibility'):'no mask'});
ok(/^#f2f2f2 visible$/.test(vc),'003: TCVFW11101 (45 % open at 150 MW) is white like the HMI ('+vc+')');
/* LIVE off = the pure snapshot */
await page.click('#pllive');await page.waitForTimeout(1300);const off=await vis();await page.click('#pllive');await page.waitForTimeout(1300);const on=await vis();
ok(off===0&&on>20,'LIVE off: nothing drawn over the snapshot ('+off+'), LIVE on: '+on+' live texts');
/* the UNIT screen has no snapshot: its own graphic */
await go('UNIT');ok(await page.evaluate(()=>!document.querySelector('#plsvg > g > image')&&document.querySelectorAll('#plsvg text').length>50),'UNIT screen: drawn graphic (no snapshot exists)');
ok(!errs.length,'no page error'+(errs.length?': '+errs[0]:''));
console.log(fail?'FAIL':'ALL PASS');await browser.close();process.exit(fail?1:0)})();
