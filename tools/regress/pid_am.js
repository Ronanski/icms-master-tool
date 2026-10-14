// PID auto / manual (PV, SV, MV) through the REAL chain of selectors after the PID: the selector that has the manual source (MAN station or operator input) is put on its manual leg
// with a manual value while PV is 20 % above SV: the selector output must be the manual value, the PID must follow it (bumpless) and the output must not jump when AUTO returns.
// PID whose A/M cannot be reached this way are listed as NOT TESTED with the reason. Usage: node tools/regress/pid_am.js [html]
const {open}=require('./lib.js');
(async()=>{const {browser,page}=await open(process.argv[2]||require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)));
const r=await page.evaluate(()=>{const res=[];let total=0;
 for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=false;
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  for(const b of S.blk){if(b.k!=='PID'||!b.o||b.o[0]==null)continue;total++;const po=b.o.find(n=>!S.nets[n].dig);if(po==null)continue;const tag=(b.txt||[])[1]||'';
   let q=null;try{q=AN.anPins(S,b)}catch(e){}
   // chain of selectors after the PID
   const chain=[];let cur=po;for(let g=0;g<6;g++){const sw=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.o[0]!=null&&(z.a===cur||z.b===cur)&&!chain.includes(z));if(!sw)break;chain.push(sw);cur=sw.o[0]}
   if(!chain.length){const seen=new Set(),q=[po],kinds=new Set();let g=0;while(q.length&&g++<10){const n=q.shift();if(seen.has(n))continue;seen.add(n);for(const c of S.cns[n]||[]){kinds.add(c.k);for(const m of c.o||[])q.push(m)}}
   res.push({sh:sh.name,tag,status:kinds.size===0?'NOT TESTED: the output goes to another sheet':kinds.has('SUM')||kinds.has('ADD')?'NOT TESTED: the A/M selector is after a summing block (bias / feed-forward)':kinds.has('PID')?'NOT TESTED: cascade (the output is the set point of another PID)':'NOT TESTED: no A/M selector after the PID'});continue}
   // manual sources: a leg that is not the PID leg and is driven by a MAN block or is an external input
   let station=null,mv=null;
   for(let i=0;i<chain.length&&!station;i++){const sw=chain[i];const pidLeg=(i===0?(sw.a===po?'A':'B'):(sw.a===chain[i-1].o[0]?'A':'B'));const other=pidLeg==='A'?sw.b:sw.a;if(other==null||other<0)continue;
     const dr=(S.drv[other]||[]);const man=dr.find(d=>d.k==='MAN');if(man){station={i,sw,pidLeg,manLeg:pidLeg==='A'?'B':'A',net:other,man}}else if(S.ext.includes(other)&&!S.nets[other].dig){station={i,sw,pidLeg,manLeg:pidLeg==='A'?'B':'A',net:other,ext:true}}}
   if(!station){res.push({sh:sh.name,tag,status:'NOT TESTED: no manual source on the selectors (chain '+chain.map(c=>c.k+'#'+c.id).join('>')+')'});continue}
   AN.reset();for(let i=0;i<6;i++)AN.stepSet(sh,0);
   const P=b.p,rlo=P.rlo??0,rhi=P.rhi??100,span=rhi-rlo,mid=rlo+.5*span,hi=P.hi??100,lo=P.lo??0;
   const legOf=(c,i)=>i===0?(c.a===po?'A':'B'):(c.a===chain[i-1].o[0]?'A':'B');
   const setPass=()=>chain.forEach((c,i)=>{S.rt.st[c.id].fm=legOf(c,i)});
   const run=sec=>{for(let i=0;i<sec*4;i++)AN.stepSet(sh,.25)};
   if(q&&q.pv>=0){S.rt.force[q.pv]=mid;S.rt.force[q.sv]=mid}
   setPass();run(10);
   const mvv=lo+(hi-lo)*.37;
   if(q&&q.pv>=0)S.rt.force[q.pv]=mid+.2*span;
   S.rt.st[station.sw.id].fm=station.manLeg;
   if(station.man)S.rt.st[station.man.id].val=mvv;else S.rt.ext[station.net]=mvv;
   run(20);
   const st=S.rt.st[station.sw.id],swOut=S.rt.v[station.sw.o[0]],pidOut=S.rt.st[b.id].out;
   const gain=(station.manLeg==='B'?station.sw.bg:station.sw.ag);const exp=mvv*(gain!=null?gain:1);
   S.rt.st[station.sw.id].fm=station.pidLeg;AN.stepSet(sh,.25);const a1=S.rt.v[station.sw.o[0]];
   const okMan=Math.abs(swOut-exp)<=Math.max(.5,Math.abs(exp)*.02),okTrack=st.bu!=null||Math.abs(pidOut-mvv)<=Math.max(2,(hi-lo)*.03),okJump=st.bu!=null||Math.abs(a1-exp)<=Math.max(3,(hi-lo)*.05);
   res.push({sh:sh.name,tag,status:(okMan&&okTrack&&okJump)?'PASS':'FAIL',okMan,okTrack,okJump,swOut:+swOut.toFixed(2),exp:+exp.toFixed(2),pidOut:+(+pidOut).toFixed(2),afterAuto:+a1.toFixed(2),bu:st.bu,chain:chain.map(c=>c.k+'#'+c.id).join('>'),manual:station.man?('MAN#'+station.man.id):'ext input'})}}
 return {total,res}});
const c={};r.res.forEach(x=>{const k=x.status.startsWith('NOT')?x.status.split(' (')[0]:x.status;c[k]=(c[k]||0)+1});
console.log((c.FAIL?'FAIL':'PASS')+' PID A/M through the real selector chain: '+r.total+' PID, '+JSON.stringify(c));
r.res.filter(x=>x.status!=='PASS').slice(0,60).forEach(x=>console.log(JSON.stringify(x)));
await browser.close()})();
