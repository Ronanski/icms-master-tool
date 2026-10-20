// 2.5.0-beta.8 (user: "kahit plant model OFF/ON, tama ang response ng logic kapag manual force / simulate ginagawa ng user"):
// every PID / PIDV of every ABC sheet with the PLANT MODEL OFF, in AUTO (the selectors after it on the PID leg):
// Start: the plant at 150 MW (Start at 150 MW, the stations as the operators run them), then the plant model is turned OFF.
//  1. PV = SV: the output holds (no drift),
//  2. the user forces PV 10 % of the range ABOVE SV: the output moves the way the drawing says (ACT:R reverse = down, ACT:N direct = up),
//  3. PV 10 % BELOW SV: it moves the other way,
//  4. the output stays inside the MV limits of the parameter list (lo ~ hi).
// MAN / bumpless is pid_am.js, the force-manual selects force_manual.js, every switch switches.js (all plant model off too).
// Usage: node tests/regress/pid_auto.js [html] [--sheets=ABC-010,...]
const {open}=require('./lib.js');
(async()=>{const {browser,page,errs}=await open(process.argv[2]||require('fs').readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x)));
const ONLY=(process.argv.find(a=>/^--sheets=/.test(a))||'').slice(9).split(',').filter(Boolean);
const r=await page.evaluate(ONLY=>{const res=[];
 for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=false;
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name)||(ONLY.length&&!ONLY.includes(sh.name)))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=false;
  for(const b of S.blk){if(b.k!=='PID'&&b.k!=='PIDV')continue;const tag=(b.txt||[])[1]||'';let q=null;try{q=AN.anPins(S,b)}catch(e){}
   const po=(b.o||[]).find(n=>n!=null&&S.nets[n]&&!S.nets[n].dig);
   if(!q||q.pv==null||q.pv<0||q.sv==null||q.sv<0||po==null){res.push({sh:sh.name,tag,k:b.k,status:'NOT TESTED: PV / SV pin not found'});continue}
   const chain=[];let c=po;for(let g=0;g<6;g++){const sw=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.o[0]!=null&&(z.a===c||z.b===c)&&!chain.includes(z));if(!sw)break;chain.push(sw);c=sw.o[0]}
   const legOf=(z,i)=>i===0?(z.a===po?'A':'B'):(z.a===chain[i-1].o[0]?'A':'B');
   AN.reset();AN.plantLoad150();for(let i=0;i<4;i++)AN.stepSet(sh,.5);for(const x of AN.sheets)if(x.S)for(const p of x.S.procs||[])p.proc.on=false;
   const P=b.p,rlo=P.rlo??0,rhi=P.rhi??100,span=rhi-rlo,lo=P.lo??0,hi=P.hi??100;
   const run=sec=>{for(let i=0;i<sec*4;i++)AN.stepSet(sh,.25)};
   const outv=()=>+S.rt.st[b.id].out;
   const sv0=+S.rt.v[q.sv];S.rt.force[q.pv]=sv0;S.rt.force[q.sv]=sv0;run(5+Math.ceil(6*(P.tf||0)));/* the PV filter (TF of the parameter list) settles first */
   const vel=!!b.vel;
   const o0=outv();run(10);const o1=outv();const tf=P.tf||0,es=+S.rt.st[b.id].es;const man=S.rt.st[b.id].trk!=null;
   S.rt.force[q.pv]=sv0+.1*span;run(10);const oUp=outv();
   S.rt.force[q.pv]=sv0-.1*span;run(20);const oDn=outv();
   delete S.rt.force[q.pv];delete S.rt.force[q.sv];
   if(man){res.push({sh:sh.name,tag,k:b.k,status:'MAN: the station is MANUAL at 150 MW (the PID tracks the manual output)',o1:+o1.toFixed(2)});continue}
   const act=P.act<0?'R':'N';
   // velocity PID: the output is the change per scan, its sign is the direction
   const dirUp=vel?Math.sign(oUp):Math.sign(oUp-o1),dirDn=vel?Math.sign(oDn):Math.sign(oDn-oUp);
   const want=act==='R'?-1:1;
   const okHold=vel?Math.abs(o1)<1e-6:Math.abs(o1-o0)<=Math.max(.05,(hi-lo)*.001);
   const atLim=v=>v<=lo+1e-6||v>=hi-1e-6;
   const okUp=dirUp===want||(dirUp===0&&!vel&&atLim(o1)&&(want>0?o1>=hi-1e-6:o1<=lo+1e-6));
   const okDn=dirDn===-want||(dirDn===0&&!vel&&atLim(oUp));
   const okLim=vel||[o0,o1,oUp,oDn].every(v=>v>=lo-1e-6&&v<=hi+1e-6);
   res.push({sh:sh.name,tag,k:b.k,act,status:okHold&&okUp&&okDn&&okLim?'PASS':'FAIL',okHold,okUp,okDn,okLim,o0:+o0.toFixed(2),o1:+o1.toFixed(2),oUp:+oUp.toFixed(2),oDn:+oDn.toFixed(2),lo,hi,pvSg:q.pvSg,tf,es})}}
 return res},ONLY);
const cnt={};for(const x of r){const k=x.status.startsWith('NOT')?'NOT TESTED':x.status.startsWith('MAN')?'MAN':x.status;cnt[k]=(cnt[k]||0)+1}
for(const x of r)if(x.status!=='PASS')console.log(x.status==='FAIL'?'FAIL':'----',x.sh,x.tag,x.k,x.status==='FAIL'?JSON.stringify(x):x.status);
console.log('PID/PIDV:',r.length,JSON.stringify(cnt),errs.length?'page errors: '+errs.slice(0,2).join(' | '):'');
await browser.close();process.exit(cnt.FAIL?1:0)})();
