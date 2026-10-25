// 3.2.0-beta.36 (CHECKLIST 0.3): the MV reaches the valve through the MCC PANEL (ABC-054 RH blow-off PICHR1391, ABC-055 PO -> MCC
// PANEL -> M -> valve). Before: the motor circle split the wire and the valve stayed 0. Checks: every ABC valve / actuator has a
// driver; in RUN the valve of ABC-054 follows the MANUAL MV of PICHR1391 (motor operator stroke).
// Usage: node tests/regress/mcc_valve.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const und=await page.evaluate(()=>{const o=[];for(const sh of AN.sheets){const S=AN.ensure(sh);if(!S||!S.blk)continue;for(const b of S.blk)if((b.k==='VLV'||b.k==='ACT')&&b.i.length&&!S.drv[b.i[0]].length)o.push(sh.name+' '+b.k+' @'+b.cx.toFixed(0)+','+b.cy.toFixed(0))}return o});
ck(und.length===0,'every ABC valve / actuator has a driver'+(und.length?': '+und.join(' | '):''));
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const sh=AN.sheets.find(s=>s.name==='ABC-054');AN.go(AN.sheets.indexOf(sh));const S=sh.S;
 const c=(AN.hmiCtrls(S)||[]).find(q=>q.tag==='PICHR1391');const v=S.blk.find(b=>b.k==='VLV');const f=S.blk.find(b=>b.k==='FIELD');
 const set=x=>{if(c.svSw&&S.rt.st[c.svSw.id]){S.rt.st[c.svSw.id].al='A';S.rt.st[c.svSw.id].fm='B'}if(c.amt&&S.rt.st[c.amt.id]){S.rt.st[c.amt.id].al=c.autoLeg;S.rt.st[c.amt.id].fm=c.autoLeg==='A'?'B':'A'}if(c.manBlk&&S.rt.st[c.manBlk.id])S.rt.st[c.manBlk.id].val=x;else if(c.manNet!=null)S.rt.ext[c.manNet]=x;if(AN.latchMode)AN.latchMode('PICHR1391','MAN')};
 AN.run=true;set(40);await sleep(4000);const a={mcc:S.rt.v[f.o[0]],vin:S.rt.v[v.i[0]],pos:S.rt.st[v.id].pos};set(0);await sleep(4000);const b={mcc:S.rt.v[f.o[0]],vin:S.rt.v[v.i[0]],pos:S.rt.st[v.id].pos};AN.run=false;return {a,b}});
console.log('INFO ABC-054 MV 40: MCC '+r.a.mcc.toFixed(1)+' valve in '+r.a.vin.toFixed(1)+' pos '+(r.a.pos||0).toFixed(1)+' | MV 0: MCC '+r.b.mcc.toFixed(1)+' pos '+(r.b.pos||0).toFixed(1));
ck(r.a.vin===r.a.mcc&&r.a.mcc>1&&r.a.pos>r.b.pos,'ABC-054: the valve follows the MCC PANEL (MV -> PO -> MCC -> valve)');
ck(errs.length===0,'no page errors'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
await browser.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0)})();
