// PID auto / manual relation (PV / SV / MV): MAN with a manual value while PV is 20 % above SV, then back to AUTO: the A/M output must hold the manual value
// and must not jump when AUTO returns (bumpless). Usage: node tools/regress/pid_am.js [html]
const {open}=require('./lib.js');
(async()=>{const {browser,page}=await open(process.argv[2]||require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)));
const r=await page.evaluate(()=>{const out=[],skipped=[];let n=0;
 for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=false;
 for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;let S;try{S=AN.ensure(sh)}catch(e){continue}
  for(const b of S.blk){if(b.k!=='PID'||!b.o||b.o[0]==null)continue;const o=b.o[0];let q=null;try{q=AN.anPins(S,b)}catch(e){}if(!q||q.pv==null||q.pv<0||q.sv==null)continue;
   const amt=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null);if(!amt)continue;
   const autoLeg=b.o.includes(amt.a)?'A':'B',manLeg=autoLeg==='A'?'B':'A',manNet=autoLeg==='A'?amt.b:amt.a;if(!S.ext.includes(manNet))continue;
   const P=b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,span=rhi-rlo,mid=rlo+.5*span,hi=P.hi!=null?P.hi:100,lo=P.lo!=null?P.lo:0;
   AN.reset();for(let i=0;i<6;i++)AN.stepSet(sh,0);const st=S.rt.st[amt.id],ao=amt.o[0];
   const run=(sec)=>{for(let i=0;i<sec*4;i++)AN.stepSet(sh,.25)};
   S.rt.force[q.pv]=mid;S.rt.force[q.sv]=mid;st.fm=autoLeg;run(10);
   const manV=lo+(hi-lo)*.37;S.rt.force[q.pv]=mid+.2*span;st.fm=manLeg;S.rt.ext[manNet]=manV;run(20);
   const inMan=S.rt.v[ao],pidTrk=S.rt.v[o];const buAct=st.bu!=null;
   st.fm=autoLeg;AN.stepSet(sh,.25);const a1=S.rt.v[ao];run(1);const a2=S.rt.v[ao];
   if(buAct){skipped.push(sh.name+' '+((b.txt||[])[1]||'')+' (interlock back-up value '+st.bu+' is active by default: the controller follows it, as drawn)');continue}n++;const tol=Math.max(2,(hi-lo)*.03);
   const good=Math.abs(inMan-manV)<.2&&Math.abs(a1-manV)<=tol;
   out.push({sh:sh.name,id:b.id,tag:(b.txt||[])[1]||'',good,manV:+manV.toFixed(2),inMan:+inMan.toFixed(2),pidOutInMan:+pidTrk.toFixed(2),afterAuto0:+a1.toFixed(2),after1s:+a2.toFixed(2),vel:!!b.vel,rev:P.act<0})}}
 return {n,out,skipped}});
const bad=r.out.filter(x=>!x.good);console.log((bad.length?'FAIL':'PASS')+' PID A/M (MAN keeps the manual value, the controller follows it, no jump when AUTO returns): '+(r.n-bad.length)+' of '+r.n+' loops; '+r.skipped.length+' not tested because the interlock back-up is active by default');r.skipped.forEach(x=>console.log('  skipped: '+x));
bad.forEach(x=>console.log(JSON.stringify(x)));await browser.close()})();
