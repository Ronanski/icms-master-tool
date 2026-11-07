// Water balance: steam that goes through the HP bypass comes back to the cycle (flow diagram MB-011 item 8, MB-012 items 6, 10:
// HP bypass -> cold reheat -> reheater -> LP bypass -> condenser). Vent steam (blow-off) does not come back.
// Usage: node tests/regress/water_return.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{
  await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const U=AN.unit,o={};const f=t=>{const x=AN_CYC.flows(t);return x.hwIn+x.daIn};
  o.base=f(1e6);const m=U.mhp;U.mhp=(m||0)+60;o.hp=f(2e6);U.mhp=m;
  const b=U.mb;U.mb=(b||0)+30;o.vent=f(3e6);U.mb=b;o.ms=U.ms;return o});
console.log(JSON.stringify(r));
ck(Math.abs(r.hp-r.base-60)<.01,'HP bypass steam returns to the cycle: +'+(r.hp-r.base).toFixed(2)+' T/H for 60 T/H');
ck(Math.abs(r.vent-r.base)<.01,'vent steam does not return: +'+(r.vent-r.base).toFixed(2)+' T/H');
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
