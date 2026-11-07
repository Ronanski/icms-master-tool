// MOV commands through the logic: OPEN, STOP in travel, CLOSE from fully open, outputs at each end. Mina F25, F26, F27.
// Usage: node tests/regress/mov_cmd.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);document.getElementById('load150').click();await AN._startP;
  const tick=n=>{for(let k=0;k<n;k++){WORLD.live=true;WORLD.tick(.5)}};
  const one=(nm,rows,holds)=>{const s=S.sheets.find(x=>x.name.endsWith(')'+nm)),P=()=>+(+MST[s.name][0].pos).toFixed(1),L={};const hold=()=>{for(const h of holds)s.sig[h+':S']=true};
    const outs=()=>(DUI.outs(s)||[]).filter(o=>/TORQUE|FULLY/.test(o.name)).map(o=>o.name.replace(/^.*MOV /,'').slice(0,14)+'='+DUI.outVal?.(s,o.row));
    hold();tick(6);hold();L.p0=P();if(P()>0.5){WORLD.dpress(s.name,rows.close);tick(36);hold()}L.closed=P();
    WORLD.dpress(s.name,rows.open);tick(10);L.t5=P();WORLD.dpress(s.name,rows.stop);tick(6);L.stopA=P();tick(6);L.stopB=P();
    WORLD.dpress(s.name,rows.open);tick(32);L.open=P();tick(4);
    WORLD.dpress(s.name,rows.close);tick(10);L.closing=P();tick(26);L.end=P();return L};
  return {d64:one('DITL-64',{open:2,stop:4,close:11},[6,9]),d60:one('DITL-60',{open:2,stop:4,close:11},[9])}});
console.log(JSON.stringify(r));
for(const [n,L] of Object.entries(r)){
 ck(L.t5>5&&L.t5<95,n+' OPEN moves: '+L.t5);
 ck(Math.abs(L.stopB-L.stopA)<0.1,n+' STOP stops the valve: '+L.stopA+' then '+L.stopB);
 ck(L.open>=99.5,n+' OPEN again reaches 100: '+L.open);
 ck(L.closing<95,n+' CLOSE from fully open moves: '+L.closing);
 ck(L.end<=0.5,n+' CLOSE reaches 0: '+L.end);}
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
