// CHECKLIST A4 (per cluster: force manual / interlock from the TRIP SIGNAL, not from the select wire). 2.5.0-beta.5, beta.6: pulses, timers and AND groups.
// For every controller with an A/M station on the ABC sheets: the digital inputs of the drawing that reach the select of its MANUAL leg
// (traced back through the gates, timers and flip-flops of the netlist; a wire linked from another sheet counts as that sheet's signal)
// are switched one at a time from the plant at 150 MW. An input that makes the select 1 is a trip / interlock of that station: the
// station must then be MANUAL with AUTO refused. A station none of whose inputs can make the select 1 is listed (its interlock is a
// combination of inputs, e.g. AND of two conditions, or needs the plant in another state); that is a finding to read on the drawing.
// Usage: node tests/regress/interlock.js [html] [--sheets=ABC-010,ABC-011]
const {open}=require('./lib.js');const fs=require('fs');
const only=(process.argv.find(a=>/^--sheets=/.test(a))||'').slice(9).split(',').filter(Boolean);
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const CL={a:/^ABC-00(3[A-E]|6|7)$/,b:/^ABC-00(4[A-C]|5|2)$/,c:/^ABC-0(01[A-D]|13)$/,d:/^ABC-010$/,e:/^ABC-01[12]$/,f:/^ABC-0(19|20)$/,g:/^ABC-05[0-2]$/,h:/^ABC-009[AB]$/,i:/^ABC-0(15|16|57)$/,j:/^ABC-0(2[6-9]|30|33|5[3-6])$/,k:/^ABC-0(31|32|3[4-9])$/};
(async()=>{const {browser,page,errs}=await open(html);
const r=await page.evaluate(only=>{const out=[];
 for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name)||(only.length&&!only.includes(sh.name)))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  let cs=[];try{cs=AN.hmiCtrls(S)||[]}catch(e){}
  for(const c of cs){if(!c.amt)continue;const amt=c.amt,man=c.autoLeg==='A'?'B':'A';
   let sel=[];if(amt.cs&&amt.cs.length>1)sel=amt.cs.filter(q=>(q.A?'A':'B')===man).map(q=>q.n);else if(amt.sel>=0&&(((amt.p||{}).selA?'A':'B')===man))sel=[amt.sel];
   if(!sel.length)continue;
   // digital inputs upstream of the select
   const seen=new Set(),q=sel.slice(),ins=[];let g=0;
   while(q.length&&g++<600){const n=q.shift();if(seen.has(n))continue;seen.add(n);
    if(S.ext.includes(n)){if(S.nets[n].dig)ins.push(n);continue}
    for(const d of S.drv[n]||[])for(const i of d.i||[])if(i>=0)q.push(i)}
   const res={sh:sh.name,tag:c.tag,ins:ins.length,trips:[],bad:[]};
   const stepAll=k=>{for(let j=0;j<k;j++)AN.stepSet(sh,.5)};
   const nmOf=n=>String(AN.nm(S,n)||('n'+n)).trim();
   // 2.5.0-beta.6: watch the select at every half second (a TPs pulse of 2 ~ 3 s, a TON of 10 ~ 15 s), and the rising edge of an
   // input that is already 1 (0 then 1); a trip = the station is MANUAL right after it, and AUTO is refused while the select is 1
   const trial=(F,lab)=>{AN.reset();AN.plantLoad150();stepAll(2);let hit=false;
    for(const ph of F){for(const [n,v] of ph.f)S.rt.force[n]=v;for(let j=0;j<ph.k&&!hit;j++){stepAll(1);if(ph.w&&sel.some(x=>S.rt.v[x]>.5))hit=true}if(hit)break}
    if(hit){stepAll(1);let ok=S.rt.st[amt.id].pk===man;
     if(ok&&sel.some(x=>S.rt.v[x]>.5)){const s=S.rt.st[amt.id];s.al=c.autoLeg;s.fm=c.autoLeg;try{AN.settle()}catch(e){}stepAll(4);ok=S.rt.st[amt.id].pk===man}
     (ok?res.trips:res.bad).push(lab)}
    for(const ph of F)for(const [n] of ph.f)delete S.rt.force[n];return hit};
   for(const n of ins.slice(0,30)){
    AN.reset();AN.plantLoad150();stepAll(2);const was=S.rt.v[n]>.5?1:0;
    if(!trial([{f:[[n,1-was]],k:40,w:1}],nmOf(n)+'='+(1-was))&&was)trial([{f:[[n,0]],k:4},{f:[[n,1]],k:12,w:1}],nmOf(n)+' 0->1')}
   // an AND of the drawing (through NOT / links): all its inputs together (both furnace transmitters abnormal, all burners LOCAL)
   if(!res.trips.length){const ands=[];for(const n of seen)for(const d of S.drv[n]||[])if(d.k==='AND')ands.push(d);
    for(const b of ands.slice(0,6)){const f=[];let okb=true;
     for(const i0 of b.i||[]){let i=i0,inv=0,g2=0;while(i>=0&&!S.ext.includes(i)&&g2++<6){const d=(S.drv[i]||[])[0];if(!d||!d.i||d.i.filter(x=>x>=0).length!==1||!/^(NOT|LINK)$/.test(d.k)){i=-1;break}if(d.k==='NOT')inv^=1;i=d.i.find(x=>x>=0)}
      if(i<0||!S.ext.includes(i)){okb=false;break}f.push([i,inv?0:1])}
     if(okb&&f.length>1)trial([{f,k:40,w:1}],'AND('+f.map(([i,v])=>nmOf(i)+'='+v).join(' & ')+')')}}
   out.push(res)}}
 AN.reset();return out},only);
const by={};for(const x of r){const k=Object.keys(CL).find(k=>CL[k].test(x.sh))||'-';(by[k]=by[k]||[]).push(x)}
let fail=0,none=[];
for(const k of Object.keys(by).sort()){const L=by[k],t=L.filter(x=>x.trips.length).length;console.log('cluster '+k+': '+L.length+' station, '+t+' with a trip input that forces MANUAL');
 for(const x of L){if(x.bad.length){fail++;console.log('  FAIL '+x.sh+' '+x.tag+': select 1 but AUTO kept: '+x.bad.join(', '))}
  else if(!x.trips.length)none.push(x.sh+' '+x.tag+' ('+x.ins+' input)');else console.log('  PASS '+x.sh+' '+x.tag+': '+x.trips.slice(0,4).join(', ')+(x.trips.length>4?' +'+(x.trips.length-4):''))}}
if(none.length)console.log('NO SINGLE TRIP INPUT ('+none.length+'): '+none.join('; '));
if(errs.length){fail++;console.log('page errors',errs.slice(0,3))}
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
