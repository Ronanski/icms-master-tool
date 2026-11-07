// Mina F11: a press in Worker mode took 10 ~ 24 s. Every action makes the next patch the whole state, and the page took it in slices of one slot a call.
// Checks that a whole state goes in fast, and that a patch going in is not called a stall. Usage: node tests/regress/eng_full.js [html]
const {open}=require('./lib.js');const fs=require('fs'),url=require('url'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.goto(url.pathToFileURL(path.resolve(html)).href+'?worker=1');await page.waitForTimeout(2500);await page.evaluate(()=>AN.setCat('an'));
await page.waitForFunction(()=>window.ENG&&(ENG.mode==='mirror'||ENG.err),null,{timeout:180000});
await page.evaluate(()=>{AN.run=false;return AN.loadStart('cold',true)});await page.waitForFunction(()=>!ENG.heavy,null,{timeout:120000});
const r=await page.evaluate(async()=>{AN.run=true;const f=ENG.onMsg;let done;const P=new Promise(ok=>(done=ok));const sm=[];
 ENG.onMsg=async m=>{if(m.t!=='patch')return f(m);const t=performance.now();await f(m);const d=performance.now()-t;if(m.p.length>2000)done({n:m.p.length,ms:d});else sm.push(d)};
 await new Promise(ok=>setTimeout(ok,4000));ENG.worker.postMessage({t:'full'});const o=await Promise.race([P,new Promise(ok=>setTimeout(()=>ok({n:0,ms:1e9}),30000))]);
 await new Promise(ok=>setTimeout(ok,3000));return {o,small:sm.length?sm.reduce((a,b)=>a+b,0)/sm.length:NaN,count:sm.length,stalls:(ENG.stalls||[]).length,err:ENG.err}});
console.log(JSON.stringify(r));
ck(r.o.n>2000,'the whole state came: '+r.o.n+' slots');
ck(r.o.ms<700,'it went in within 0.7 s: '+Math.round(r.o.ms)+' ms');
ck(r.count>3&&r.small<60,'a normal patch under 60 ms: '+Math.round(r.small)+' ms, '+r.count+' patches');
ck(!r.stalls&&!r.err,'no stall, no engine error');ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
