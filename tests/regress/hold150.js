// 150 MW holds: with the one world ON (ABC + DITL + plant), the unit stays at load for 5 minutes without an MFT.
// Runs minute by minute, so a crash still leaves the minutes before it. Usage: node tests/regress/hold150.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  window.__h={all:AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name)),d:S.sheets.find(s=>/DITL-03A$/.test(s.name))}});
let e;for(let m=0;m<=5;m++){
  e=await page.evaluate(async([m])=>{const h=window.__h,U=AN.unit;if(m)for(let k=0;k<120;k++){for(const s of h.all)AN.stepSet(s,.5);WORLD.tick(.5)}
    const d=h.d,mft=WORLD.out[d.name]&&WORLD.out[d.name].has(d.rows.findIndex(x=>+x.n===13))?1:0;
    return {m,MW:+U.MW.toFixed(1),Pd:+U.Pd.toFixed(1),ms:+U.ms.toFixed(0),mft,heapMB:Math.round((performance.memory||{}).usedJSHeapSize/1e6)}},[m]);
  console.log(JSON.stringify(e))}
ck(e.MW>142&&e.MW<158&&e.mft===0,'after 5 min: MW '+e.MW+', drum '+e.Pd+', steam '+e.ms+', MFT '+e.mft);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
