// Regression tests for the ABC analog reader / engine. Run: node tools/regress/tests.js [html]
// Every test returns {id, ref, ok, detail}. The expected values come from docs/versions/v1.20.21/FINDINGS.md (batch and finding named in `ref`).
const {open}=require('./lib');
const html=process.argv[2]||'logic-sim-v1.20.23.html';
(async()=>{
const {browser,page,errs}=await open(html);
const res=await page.evaluate(async()=>{
 const R=[];const add=(id,ref,ok,detail)=>R.push({id,ref,ok:!!ok,detail:String(detail==null?'':detail)});
 const sh=n=>AN.sheets.find(s=>s.name===n);
 const S_=n=>AN.ensure(sh(n));
 const step=(n,dt,k)=>{for(let i=0;i<(k||1);i++)AN.stepSet(sh(n),dt)};
 const find=(S,k,f)=>S.blk.filter(b=>b.k===k&&(!f||f(b)));
 const lbl=(S,t)=>{for(const n in S.lab||{})if(S.lab[n]&&S.lab[n].t===t)return +n;return null};
 const clean=S=>{for(const b of S.procs||[])b.proc.on=false;S.rt.force={}};
 // ---- T1: every sheet loads, steps 30 s without NaN / exception
 for(const s of AN.sheets){let ok=true,d='';try{const S=AN.ensure(s);clean(S);for(let i=0;i<120;i++)AN.stepSet(s,.25);let bad=0;for(let i=0;i<S.rt.v.length;i++)if(!isFinite(S.rt.v[i]))bad++;if(bad){ok=false;d=bad+' non-finite nets'}else d=S.nets.length+' nets, '+S.blk.length+' blocks'}catch(e){ok=false;d=e.message}add('T1 '+s.name,'load / 30 s step',ok,d)}
 // ---- T2: timers (batch 28): measured time equals the parameter within one 0.25 s step
 let nT=0,badT=[],nSkip=[];
 for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk){if(!['TON','TOF','TPS'].includes(b.k))continue;nT++;clean(S);const sv=JSON.stringify(S.rt.st[b.id]);S.rt.st[b.id]=Object.assign({},JSON.parse(sv),{acc:0,out:0,prev:0,run:0});const inN=b.i[0],outN=b.o[0];const F=S.rt.force;
   const want=b.p.sec;let m=null;
   F[inN]=0;for(let i=0;i<8;i++)AN.stepSet(s,.25);
   if((S.multi&&S.multi[outN])||(S.pre&&S.pre[outN])){nT--;nSkip.push(s.name+'#'+b.id);continue}
   if(b.k==='TON'){F[inN]=1;let t=0;while(S.rt.v[outN]<.5&&t<want+5){AN.stepSet(s,.25);t+=.25}m=t}
   else if(b.k==='TOF'){F[inN]=1;for(let i=0;i<4;i++)AN.stepSet(s,.25);F[inN]=0;let t=0;while(S.rt.v[outN]>.5&&t<want+5){AN.stepSet(s,.25);t+=.25}m=t}
   else{F[inN]=1;let t=0;AN.stepSet(s,.25);AN.stepSet(s,.25);while(S.rt.v[outN]>.5&&t<want+5){AN.stepSet(s,.25);t+=.25}m=t+.5}
   delete F[inN];if(Math.abs(m-want)>.51)badT.push(s.name+'#'+b.id+' '+b.k+' want '+want+' got '+m)}}
 add('T2 timers','batch 28: 159 timers',badT.length===0,nT+' timers tested (skipped, output overridden by a rule: '+nSkip.join(', ')+'); '+(badT.length?badT.slice(0,8).join('; '):'all equal to their parameter'));
 // ---- T3: LAG 63.2 % after one time constant
 let nL=0,badL=[];
 for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk){if(b.k!=='LAG')continue;nL++;clean(S);const F=S.rt.force,inN=b.i[0],outN=b.o[0];S.rt.st[b.id]={};F[inN]=0;for(let i=0;i<4;i++)AN.stepSet(s,.25);F[inN]=100;const dt=Math.min(.25,b.p.tau/40);let t=0;while(t<b.p.tau-1e-9){AN.stepSet(s,dt);t+=dt}const y=S.rt.v[outN];delete F[inN];if(Math.abs(y-63.2)>2)badL.push(s.name+'#'+b.id+' tau '+b.p.tau+' y '+y.toFixed(1))}}
 add('T3 LAG','batch 28: 12 LAG',badL.length===0,nL+' LAG; '+(badL.length?badL.join('; '):'63.2 % at one time constant'));
 // ---- T4: ALM: limits ordered (LL < L < H < HH) and the value passes through unchanged (alarm level is display only)
 let nA=0,badA=[];
 for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk){if(b.k!=='ALM')continue;nA++;clean(S);const P=b.p,F=S.rt.force,inN=b.i[0],outN=b.o[0];
   const ord=[P.ll,P.l,P.h,P.hh].filter(x=>x!=null);let okO=true;for(let i=1;i<ord.length;i++)if(ord[i]<ord[i-1])okO=false;
   F[inN]=(P.l!=null&&P.h!=null)?(P.l+P.h)/2:50;AN.stepSet(s,.25);AN.stepSet(s,.25);const pass=outN==null||Math.abs(S.rt.v[outN]-F[inN])<1e-6;delete F[inN];
   if(!okO||!pass)badA.push(s.name+'#'+b.id+(okO?'':' limits not ordered')+(pass?'':' value not passed'))}}
 add('T4 ALM','batch 28: 104 ALM',badA.length===0,nA+' ALM; '+(badA.length?badA.slice(0,8).join('; '):'limits ordered, value passed through'));
 // ---- T5: block counts (coverage of the audit): switches, selectors, comparators, F(X)
 const cnt={};for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk)cnt[b.k]=(cnt[b.k]||0)+1}
 add('T5 block counts','ABC-AUDIT coverage table',true,'SW+AMT '+((cnt.SW||0)+(cnt.AMT||0))+' (audit: 327 T), HS+LS '+((cnt.HS||0)+(cnt.LS||0))+' (19), FX '+(cnt.FX||0)+' (111), PID+PIDV '+((cnt.PID||0)+(cnt.PIDV||0))+' (68), TPS+TON+TOF '+((cnt.TPS||0)+(cnt.TON||0)+(cnt.TOF||0))+' (159), LAG '+(cnt.LAG||0)+' (12), SUMA '+(cnt.SUMA||0)+' (7), ALM '+(cnt.ALM||0)+' (104), LC+HC '+((cnt.LC||0)+(cnt.HC||0)));
 // ---- helpers for named tags
 const netNear=(S,x,y)=>{let best=null,bd=1e9;S.nets.forEach(n=>{for(const si of n.segs){const g=S.seg[si];if(!g)continue;const ax=g.x1,ay=g.y1,bx=g.x2,by=g.y2,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let t=L?((x-ax)*dx+(y-ay)*dy)/L:0;t=Math.max(0,Math.min(1,t));const d=Math.hypot(x-(ax+t*dx),y-(ay+t*dy));if(d<bd){bd=d;best=n.id}}});return best};
 const labNet=(S,t)=>{for(const n in S.lab||{})if(S.lab[n]&&S.lab[n].t===t)return +n;return null};
 const aoNet=(S,tag)=>{let best=null,bd=1e9;for(const t of S.tx)if(t.t.trim()===tag)for(const b of S.blk.filter(q=>q.k==='AO')){const d=Math.hypot(b.cx-t.x,b.cy-t.y);if(d<bd){bd=d;best=b.i[0]}}return best};
 // ---- S1: F-30 / P-3: ABC-003A shutdown pulse M.3433 -> AO0209 = ignition position 25 % and it stays (23 % < FV < 27 %, M.312C true)
 {const s=sh('ABC-003A'),S=AN.ensure(s);AN.reset();const pn=labNet(S,'M.3433'),cmp=labNet(S,'M.312C'),ao=aoNet(S,'AO0209');
  if(pn==null||ao==null){add('S1 F-30 shutdown hold','P-3',false,'tag not found: M.3433 '+pn+' AO0209 '+ao)}
  else{S.rt.ext[pn]=0;for(let i=0;i<40;i++)AN.stepSet(s,.25);S.rt.ext[pn]=1;for(let i=0;i<10;i++)AN.stepSet(s,.25);S.rt.ext[pn]=0;for(let i=0;i<8;i++)AN.stepSet(s,.25);const a=S.rt.v[ao];for(let i=0;i<160;i++)AN.stepSet(s,.25);const b2=S.rt.v[ao];
   add('S1 F-30 shutdown hold','FINDINGS batch 29 / P-3: AO0209 = 25 % and stays',Math.abs(a-25)<2&&Math.abs(b2-25)<2&&S.rt.v[cmp]>.5,'AO0209 at pulse end '+a.toFixed(2)+' %, after 40 s '+b2.toFixed(2)+' %, M.312C '+S.rt.v[cmp])}}
 // ---- S2: F-27: ABC-001A comparators M.2004 / M.2006 set point 0.2 MW
 {const S=AN.ensure(sh('ABC-001A'));const c=S.blk.filter(b=>(b.k==='LC'||b.k==='HC')&&Math.abs((b.p.sp||0)-.2)<1e-9);add('S2 F-27 comparators','F-27: 0.1 % of 200 MW = 0.2 MW',c.length>=2,c.length+' comparators with set point 0.2 on ABC-001A')}
 // ---- S3: P-1: unit load demand to coal flow (LN54): DATA sheet of linear-curves-fx.xls
 {const s=sh('ABC-001C'),S=AN.ensure(s);AN.reset();const ld=labNet(S,'SI0226'),co=(S.blk.find(b=>b.k==='FX'&&b.p.ln==='LN54')||{o:[null]}).o[0];const pts=[[60,35],[75,42.8],[90,50.5],[112.5,61.9],[127.5,69.5],[150,81]];let det=[],ok=true;
  if(ld==null||co==null){ok=false;det.push('net not found')}else for(const [L,c] of pts){S.rt.force[ld]=L;for(let i=0;i<800;i++)AN.stepSet(s,.25);const y=S.rt.v[co];det.push(L+' MW -> '+y.toFixed(1)+' (DATA '+c+')');if(Math.abs(y-c)>.6)ok=false}
  add('S3 P-1 coal from load','FINDINGS P-1: SI0221 = DATA COAL',ok,det.join('; '))}
 // ---- S4: F-31: dMVH limits the MV change per second (PID in auto, step of the PV)
 {let n=0,bad=[],trk=[];for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk){if(b.k!=='PID'||!(b.p.dmvh>0)||b.vel)continue;const q=AN.anPins&&AN.anPins(S,b);if(!q||q.pv==null||q.pv<0)continue;clean(S);const F=S.rt.force,P=b.p,ou=b.o[0];F[q.pv]=P.rlo;for(let i=0;i<40;i++)AN.stepSet(s,.25);if(S.rt.st[b.id].trk!=null){trk.push(s.name+'#'+b.id);delete F[q.pv];continue}n++;const y0=S.rt.v[ou];F[q.pv]=P.rhi;let mx=0,yl=S.rt.v[ou];for(let i=0;i<20;i++){AN.stepSet(s,.25);const y=S.rt.v[ou];mx=Math.max(mx,Math.abs(y-yl));yl=y}delete F[q.pv];
    const lim=P.dmvh/100*(P.hi-P.lo)*.25/(P.dti>0?P.dti:1);if(mx>lim*1.05+1e-6)bad.push(s.name+'#'+b.id+' step '+mx.toFixed(3)+' > '+lim.toFixed(3))}}
  add('S4 F-31 dMVH limit','F-31: MV change <= dMVH % of range per DTI',bad.length===0,n+' PID tested ('+trk.length+' skipped: in interlock tracking by default, tracking is not rate limited); '+(bad.length?bad.slice(0,8).join('; '):'no step above the limit'))}
 // ---- S5: F-30 latch count
 {const l=[];for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk)if(b.latch)l.push(s.name+'#'+b.id)}add('S5 F-30 latched A/M switches','F-30 lists ABC-003A #46, 003B/C/D #33, 004A #55, 008 #18, 020 #40/#45, 051 #22',l.length===8,l.length+' latched: '+l.join(', ')+' (ABC-051 #22 and two on ABC-007 share their select with a COS selector and are excluded by the rule, batch 31 R-2)')}
 // ---- S6: F-31 CUT: a PV below CUT % of the range gives the same output as PV = bottom of the range (R-1: CUT / DH data fixed in v1.20.22)
 {let n=0,bad=[],none=0;for(const s of AN.sheets){const S=AN.ensure(s);for(const b of S.blk){if(b.k!=='PID'||!(b.p.cut>0)||!(b.p.rlo>=0)||b.vel)continue;const q=AN.anPins(S,b);if(!q||q.pv==null||q.pv<0||q.sv==null)continue;const P=b.p,run=pv=>{AN.reset();clean(S);const F=S.rt.force;F[q.sv]=P.rlo+.5*(P.rhi-P.rlo);F[q.pv]=pv;for(let i=0;i<20;i++)AN.stepSet(s,.25);if(S.rt.st[b.id].trk!=null)return null;const y=S.rt.v[b.o[0]];delete F[q.pv];delete F[q.sv];return y};const a=run(P.rlo),c=run(P.rlo+.5*P.cut/100*(P.rhi-P.rlo));if(a==null||c==null){none++;continue}n++;if(Math.abs(a-c)>1e-6)bad.push(s.name+'#'+b.id+' '+a+' vs '+c)}}
  add('S6 F-31 CUT active','R-1: CUT from the workbook',bad.length===0&&n>0,n+' PID tested ('+none+' skipped, in tracking); '+(bad.length?bad.slice(0,6).join('; '):'PV below the cut is taken as the bottom of the range'))}
 return R});
const t1=res.filter(x=>x.id.startsWith('T1 '));console.log((t1.every(x=>x.ok)?'PASS':'FAIL')+' T1 load / 30 s step: '+t1.filter(x=>x.ok).length+' of '+t1.length+' sheets'+t1.filter(x=>!x.ok).map(x=>' | '+x.id+': '+x.detail).join(''));
for(const x of res.filter(x=>!x.id.startsWith('T1 ')))console.log((x.ok?'PASS':'FAIL')+' '+x.id+' ['+x.ref+'] '+x.detail);
if(errs.length)console.log('page errors: '+errs.join(' | '));
process.exitCode=res.every(x=>x.ok)?0:1;
await browser.close()})();
