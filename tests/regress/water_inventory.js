// One water inventory: over a run of the plant at 150 MW, the water in the hotwell, the deaerator tank and the drum changes only by
// what enters and leaves the cycle (make-up, drum losses, vent steam). Levels use the same kg per mm as AN_CYC.kgmm.
// Usage: node tests/regress/water_inventory.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{
  await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const all=AN.sheets.filter(s=>s.S&&!/ABC-000/.test(s.name));
  const lev=()=>AN_CYC.levels();
  const K=AN_CYC.kgmm;const o={K:{...K}};
  for(let k=0;k<120;k++){for(const s of all)AN.stepSet(s,.5);WORLD.tick(.5)}
  const a=lev();let ext=0;const dt=.5,N=240;
  for(let k=0;k<N;k++){for(const s of all)AN.stepSet(s,dt);WORLD.tick(dt);ext+=AN_CYC.net()*dt/3.6}
  const b=lev();o.a=a;o.b=b;o.dm=['hw','da','dr'].reduce((m,x)=>m+(b[x]-a[x])*K[x](),0);o.ext=ext;o.P=AN.unit.Pd;return o});
console.log(JSON.stringify(r));
ck(Math.abs(r.dm-r.ext)<Math.max(100,.1*Math.abs(r.ext)),'inventory change '+r.dm.toFixed(0)+' kg, net flow into the cycle '+r.ext.toFixed(0)+' kg');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
