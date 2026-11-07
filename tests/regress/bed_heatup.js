// Bed lag below the start of coal: FHI Fig 2 110 C at 1 h, PR-OPE-5002 1 C/min, FHI limit 153 C/h. Moves the bed at load; low bed trips the fuel, so it reads the rate of change. Usage: node tests/regress/bed_heatup.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
 const U=AN.unit,C=AN.sheets.find(s=>s.name==='ABC-001C'),run=(T,n)=>{U.Tb=T;for(let k=0;k<n;k++){WORLD.live=true;AN.stepSet(C,.5);WORLD.tick(.5)}return U.Tb-T};
 return {low:run(470,120),high:run(700,120)}});
console.log(JSON.stringify(r));
const hLow=Math.abs(r.low)*60;
ck(hLow>0&&hLow<153,'at 470 C, below coal start, the bed moves under the FHI limit 153 C/h: '+hLow.toFixed(0)+' C/h');
ck(Math.abs(r.high)>Math.abs(r.low)*4,'at 700 C the hot lag acts: '+r.high.toFixed(1)+' C/min');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
