/* PLANT LAYER (v1.18.x): the plant answers at the INPUT of the sheet, where the field writes: the transmitter (AI block) or the input wire of the PV. The blocks between the transmitter and the PID (selection, average, square root, deviation alarm...) keep running as drawn.
   The value to write is found by feedback (secant): the PV that the PID really sees is read back and the transmitter value is corrected until it equals the plant value; this also works through scaling / square root / selectors. A value that the USER forces (the PV wire, or a transmitter) is never overwritten: the plant keeps evolving underneath, the forced value stays (like a forced point in the DCS). */
/* WHICH input of the deviation block is the PV? The drawing says it: the text "PV" / "SV" written beside the pin (nearest pin wins). Without text: reverse action -> PV on the minus pin, direct action -> PV on the plus pin (67 of 68 loops agree with their drawing). v1.18.x: before this the minus pin was always taken as PV, which is WRONG for direct-acting loops (the SV was driven as if it were the PV). */
function anPins(S,b){if(b._pins!==undefined)return b._pins;let r=null;try{if((b.k==='PID'||b.k==='PIDV')&&b.in0>=0){const d=(S.drv[b.in0]||[]).map(x=>S.blk.find(q=>q.id===x.id)).find(q=>q&&q.k==='DEV'&&q.ip&&q.ip.length>=2);
  if(d){const ins=d.pins.filter(q=>q.role==='in');let psg=null,by=0;for(const t of S.tx||[]){const tt=t.t.trim();if(!/^(PV|SV)$/i.test(tt)||Math.hypot(t.x-d.cx,t.y-d.cy)>30)continue;const pn=ins.slice().sort((x,y)=>Math.hypot(x.x-t.x,x.y-t.y)-Math.hypot(y.x-t.x,y.y-t.y))[0],ip=pn&&d.ip.find(x=>x.n===pn.n);if(!ip)continue;psg=/^PV$/i.test(tt)?ip.sg:-ip.sg;by=1}
   if(psg==null)psg=b.p.act<0?-1:1;const pv=d.ip.find(q=>q.sg===psg)||d.ip[0],sv=d.ip.find(q=>q!==pv);r={dev:d,pv:pv.n,sv:sv?sv.n:-1,pvSg:psg,byLabel:by}}}}catch(e){r=null}return b._pins=r}
/* PID input: filter time constant TF (first-order filter on the PV) and low input cut CUT (PV below CUT % of a zero-based range is taken as 0 %): faceplate parameters of the parameter workbook, names and ranges in the textbook (PID panel); the exact DCS formulas are not in the repository, so this is the usual definition (Needs Verification, FINDINGS N-5) */
/* GAP (parameter workbook, 1 PID: HICBR1391 2.5 %): error inside +-GAP % of the span is treated as zero (gap / dead zone action) */
function anGap(P,e){return P.gap>0&&Math.abs(e)<P.gap?0:e}
function anPidIn(S,b,s,v,dt){const x=v[b.in0],P=b.p;if(!(P.tf>0||P.cut>0))return x;const r=anPins(S,b);if(!r||!r.byLabel||r.pv==null||r.pv<0)return x;const pv=v[r.pv];let q=pv;
 if(P.cut>0&&P.rlo>=0&&P.rhi>P.rlo&&q<P.rlo+P.cut/100*(P.rhi-P.rlo))q=P.rlo;
 if(P.tf>0){if(s.pvf==null||!isFinite(s.pvf))s.pvf=q;else if(dt>0)s.pvf+=(q-s.pvf)*(1-Math.exp(-dt/P.tf));q=s.pvf}else s.pvf=q;
 return x+r.pvSg*(q-pv)}
function anProcEst(b){const P=b.p,lt=P.lt||'general',TAU={flow:6,pressure:25,temperature:60,level:90,analysis:40,speed:15,general:30},kp=P.kp>0?P.kp:1;
 /* a tuned loop: Ti is about the process time constant, Kp x K is about 0.6; dead time from Td, otherwise a tenth of T */
 const T=P.ti>0?Math.min(600,Math.max(3,P.ti)):(TAU[lt]||30),L=P.td>0?Math.min(T/3,Math.max(.5,P.td*2)):(lt==='flow'?1:Math.min(15,Math.max(1,T/12))),K=Math.min(1,Math.max(.2,.8*T/(kp*L)));return{K:+K.toFixed(2),T:+T.toFixed(1),L:+L.toFixed(1)}}
/* Which transmitters (AI blocks) of the PV chain carry the measurement? Redundant transmitters of one variable all matter; compensation inputs (pressure, temperature) matter much less. The chain is probed on a COPY of the state: each AI is moved by 10 % of its range and the PV pin is read back. */
function anRtCopy(rt){return structuredClone(rt)}
function anRtBack(rt,sn){for(const k in sn){const a=rt[k],b=sn[k];if(Array.isArray(b)&&Array.isArray(a)){a.length=0;for(const x of b)a.push(x)}else if(b&&typeof b==='object'&&a&&typeof a==='object'&&!Array.isArray(b)){for(const q in a)if(!(q in b))delete a[q];for(const q in b)a[q]=b[q]}else rt[k]=b}}
function anProbe(S,pr){const rt=S.rt,sn=anRtCopy(rt),res=[];try{
  const ev=()=>{for(let i=0;i<4;i++)anStep(S,0);return rt.v[pr.pv]};
  for(const id of pr.ai){const a=S.blk.find(x=>x.id===id),s=rt.st[id],r=a.rng||{lo:0,hi:100};const sp=Math.max(1e-9,r.hi-r.lo);
   for(const b2 of pr.ai){const x=S.blk.find(q=>q.id===b2),q=rt.st[b2],rr=x.rng||{lo:0,hi:100};q.val=q.act=rr.lo+.4*(rr.hi-rr.lo)}
   const p1=ev();s.val=s.act=r.lo+.5*sp;const p2=ev();res.push({id,sens:(p2-p1)/(.1*sp)*sp})}}catch(e){}anRtBack(rt,sn);return res}
function anProcList(S){S.procs=[];const out=[];for(const b of S.blk){if(b.k!=='PID'&&b.k!=='PIDV')continue;if(b.in0==null||b.in0<0)continue;const pn=anPins(S,b);if(!pn)continue;const mi={n:pn.pv};
  const ais=[],seen=new Set(),walk=(n,dp)=>{if(dp>8||seen.has(n))return;seen.add(n);for(const dr of S.drv[n]||[]){const x=S.blk.find(q=>q.id===dr.id);if(!x)continue;if(x.k==='AI'){if(!x.fb&&!ais.includes(x.id))ais.push(x.id);continue}if(x.k==='PID'||x.k==='PIDV'||x.k==='MAN')continue;for(const q of x.i||[])walk(q,dp+1)}};walk(mi.n,0);
  const pinExt=S.ext.includes(mi.n)&&!(S.xlk&&S.xlk[mi.n]);if(!ais.length&&!pinExt)continue;
  let act=-1;{const seen2=new Set();let fr=(b.o||[]).slice(),g=0;while(fr.length&&act<0&&g++<10){const nx=[];for(const n of fr){if(seen2.has(n))continue;seen2.add(n);for(const x of S.cns[n]||[]){if(x.k==='AO'||x.k==='IP'||x.k==='ACT'||x.k==='VLV'){const i0=(x.i||[])[0];if(i0!=null){act=i0;break}}for(const m of x.o||[])nx.push(m)}if(act>=0)break}fr=nx}}
  const e=anProcEst(b);b.proc=b.proc||{on:true,K:e.K,T:e.T,L:e.L,dist:0,est:1};const pr=b.proc;pr.pv=mi.n;pr.act=act;pr.sg=b.p.act<0?1:-1;pr.svn=pn.sv;pr.pinExt=pinExt?mi.n:null;pr.allAI=ais.slice();pr.ai=ais.slice();pr.mode=pinExt?'input':'transmitter';
  if(!pinExt){const sn=anProbe(S,{pv:mi.n,ai:ais}),mx=Math.max(0,...sn.map(q=>Math.abs(q.sens)));pr.sens=sn;
   if(mx<1e-6){pr.mode='pin';pr.ai=[]}else pr.ai=sn.filter(q=>Math.abs(q.sens)>=.3*mx).map(q=>q.id)}
  pr.aiOut=pr.ai.flatMap(id=>{const a=S.blk.find(q=>q.id===id);return a?a.pins.filter(p=>p.role==='out').map(p=>p.n):[]});out.push(b)}
  /* two controllers on the SAME measurement (two valves on one level): ONE plant variable. The first controller carries the plant model, the others follow the same measurement (their own output is not part of the model). */
  {const byPv={};for(const b of out){const pr=b.proc,k=pr.pv;if(byPv[k]){pr.mode='shared';pr.of=(byPv[k].txt||[])[1]||byPv[k].k;pr.ai=[];pr.aiOut=[];pr.pinExt=null}else byPv[k]=b}}
  S.procs=out;return out}
function anProcStep(S,dt){const rt=S.rt,v=rt.v,F=rt.force,pm=rt.pm||(rt.pm={}),pf=rt.pf||(rt.pf={});
 for(const b of S.procs){const pr=b.proc;if(!pr||pr.mode==='shared')continue;let q=pm[b.id];
  if(!pr.on){if(q)delete pm[b.id];if(pf[pr.pv]){delete F[pr.pv];delete pf[pr.pv]}continue}
  const st=rt.st[b.id]||{},u=b.vel&&b.velNet!=null?v[b.velNet]:(st.out==null?0:st.out),span=b.p.span>0?b.p.span:100,lo=b.p.rlo!=null?b.p.rlo:0,um=((b.p.lo==null?0:b.p.lo)+(b.p.hi==null?100:b.p.hi))/2;
  /* plant: steady state PV = bottom of the range + span * (0.5 + sign * K * (command - middle) / 100) + disturbance; dead time, then first order; it cannot leave the range of the instrument */
  const ss=c=>lo+span*(.5+pr.sg*pr.K*(c-um)/100)+(pr.dist||0)/100*span+(pr.op||0);
  if(!q)q=pm[b.id]={y:ss(u),h:[],u:null};
  if(dt>0){q.h.push([rt.t,u]);while(q.h.length>2&&q.h[1][0]<=rt.t-pr.L)q.h.shift();const tgt=ss(q.h[0][1]);q.y+=(1-Math.exp(-dt/Math.max(pr.T,.05)))*(tgt-q.y);q.y=Math.max(lo,Math.min(lo+span,q.y))}
  if(dt<=0&&q.u!=null)continue;
  const y=q.y;
  if(pr.mode==='pin'){if(F[pr.pv]===undefined||pf[pr.pv]){F[pr.pv]=y;pf[pr.pv]=1}continue}
  /* where the plant writes: this sheet, or (v1.18.x) the sheet where the signal really starts (PV that comes through a circle from another sheet) */
  const R=pr.remote,T=R?R.S:S,tr=T.rt,tv=tr.v,tF=tr.force,tpin=R?R.pin:pr.pv,tai=R?R.ai:pr.ai,taiOut=R?R.aiOut:pr.aiOut,text=R?R.ext:(pr.mode==='input'?pr.pv:null);
  if(text!=null){if(!R&&S.xlk&&S.xlk[text]&&tF[text]===undefined)continue;if(tF[text]===undefined){tr.ext[text]=y;(tr.ev||(tr.ev={}))[text]=y;if(R&&F[pr.pv]===undefined){rt.ext[pr.pv]=y;(rt.ev||(rt.ev={}))[pr.pv]=y}}continue}
  /* transmitters: write the AI blocks of this measurement */
  const pinF=F[pr.pv]!==undefined||tF[tpin]!==undefined,aiF=taiOut.some(n=>tF[n]!==undefined);let w;if(q.u!=null&&tai.length&&tai.every(id=>{const s_=tr.st[id];return s_&&s_.bad})){q.bad=0;continue}
  if(q.u==null){w=y;q.g=1;/* compensation inputs of the chain (pressure, temperature...) that are not driven: start at the middle of their range, not at the bottom (a chain divided by a compensation of 0 gives nothing) */for(const id of (R?R.allAI:pr.allAI)||[]){if(tai.includes(id))continue;const a=T.blk.find(x=>x.id===id),s_=tr.st[id],r=a&&a.rng;if(s_&&r&&Math.abs(s_.val-r.lo)<1e-9){s_.val=s_.act=r.lo+.5*(r.hi-r.lo)}}}
  else if(!pinF&&!aiF){const p=tv[tpin];if(q.up!=null&&Math.abs(q.u-q.up)>1e-6*span){const gg=(p-q.pp)/(q.u-q.up);if(isFinite(gg)&&Math.abs(gg)>.02&&Math.abs(gg)<50)q.g=gg}q.pp=p;q.up=q.u;w=q.u+.7*(y-p)/(q.g||1)}
  else w=(q.up!=null?q.up:q.u)+(y-(q.pp!=null?q.pp:y))/(q.g||1);
  {let rl=1e30,rh=-1e30;for(const id of tai){const a=T.blk.find(x=>x.id===id),r=a&&a.rng;if(r){rl=Math.min(rl,r.lo);rh=Math.max(rh,r.hi)}}
   if(rl<rh){const hit=w<rl||w>rh;w=Math.max(rl,Math.min(rh,w));const p=tv[tpin];q.bad=(hit&&!pinF&&!aiF&&Math.abs(y-p)>.05*span)?(q.bad||0)+1:0;if(q.bad>=30){pr.mode='pin';pr.fell=1;pr.ai=[];pr.aiOut=[];pr.remote=null;continue}}}
  q.u=w;
  for(const id of tai){const a=T.blk.find(x=>x.id===id),s=tr.st[id];if(!a||!s)continue;const on_=a.pins.filter(p=>p.role==='out').map(p=>p.n);if(on_.some(n=>tF[n]!==undefined))continue;const r=a.rng,x=r?Math.max(r.lo,Math.min(r.hi,w)):w;s.val=x;s.act=x}}}
/* a control that has a timer (TPS TPV TP TON TOF) or a flip-flop upstream: the HOLD of the switch is the drawing's own latch (BY DESIGN, user 2026-10-12 CLAUDE.md rule Q) */
function swTimer(S,b){if(b._tl!==undefined)return b._tl;const TM={TPS:1,TPV:1,TP:1,TON:1,TOF:1,FF:1};const up=(n,d,seen)=>{if(d>8||seen.has(n))return false;seen.add(n);for(const g of S.drv[n]||[]){if(TM[g.k])return true;if(g.k==='LINK')continue;for(const i of g.i||[])if(up(i,d+1,seen))return true}return false};return b._tl=(b.cs||[]).some(c=>up(c.n,0,new Set()))}
function anStep(S,dt){const rt=S.rt,v=rt.v,nets=S.nets,B=x=>x>.5?1:0;rt.t+=dt;rt.k++;const MU=S.multi;if(S.kn)for(const k in S.kn)v[k]=S.kn[k];
 /* external values first */
 const F=rt.force,rmp=rt.ramp==null?.05:rt.ramp;if(S.procs===undefined)S.procs=anProcList(S);if(S.procs.length)anProcStep(S,dt);
 /* analog values that the USER sets move toward the target like a real process (rmp = fraction of the range per second; 0 = jump) */
 const slew=(cur,tgt,span)=>{if(cur==null||!isFinite(cur))return tgt;if(rmp<=0)return tgt;if(dt<=0)return cur;const m=rmp*span*dt;return cur+Math.max(-m,Math.min(m,tgt-cur))};
 if(S.sfl===undefined){S.sfl=[];for(const g of S.blk)if(g.k==='SIGAB'&&g.txt&&g.txt[1])for(const n of S.ext)if(nets[n].dig&&S.lab[n]&&S.lab[n].t===g.txt[1])S.sfl.push([g.id,n])}
 for(const q of S.sfl){const n=q[1];if(F[n]===undefined&&!(S.xlk&&S.xlk[n]))rt.ext[n]=rt.st[q[0]]&&rt.st[q[0]].val>.5?1:0}
 for(const n of S.ext){if(F[n]!==undefined){v[n]=F[n];continue}const t=rt.ext[n]||0;if(nets[n].dig||(S.xlk&&S.xlk[n])){v[n]=t;continue}const ev=rt.ev||(rt.ev={});ev[n]=slew(ev[n],t,Math.max(100,Math.abs(t),Math.abs(ev[n]||0)));v[n]=ev[n]}
 for(const k in S.pre||{}){const pr=S.pre[k];if(S.ext.includes(+k)&&F[+k]===undefined)for(const q of[pr].concat(pr.alt||[]))if(q.eq===0?v[q.c]<.5:v[q.c]>.5){v[+k]=q.src!=null?v[q.src]:q.val;if(q.src!=null)rt.ext[+k]=v[+k]}}
 const rd=n=>n>=0?v[n]:0;
 for(const b of S.ord){
  if(b.k==='LINK'){v[b.o[0]]=F[b.o[0]]!==undefined?F[b.o[0]]:v[b.i[0]]*(b.gain==null?1:b.gain);continue}
  const s=rt.st[b.id],P=b.p,out=x0=>{for(const n of b.o){const x=(S.aoN&&S.aoN.has(n)&&x0===x0)?Math.max(0,Math.min(100,x0)):x0;if(MU[n]){if(rt.stp[n]!==rt.k){rt.stp[n]=rt.k;rt.acc[n]=x}else if(x>rt.acc[n])rt.acc[n]=x;v[n]=rt.acc[n]}else v[n]=x;const pr=S.pre&&S.pre[n];if(pr)for(const q of[pr].concat(pr.alt||[]))if(q.eq===0?v[q.c]<.5:v[q.c]>.5)v[n]=q.src!=null?v[q.src]:q.val}};
  switch(b.k){
   case 'AI':{const r=b.rng,sp=r?Math.max(1e-9,r.hi-r.lo):100;if(b.fb){const fs=rt.st[b.fb.id],pos=fs&&fs.pos!=null?fs.pos:0,lo=r?r.lo:0,hi=r?r.hi:100;s.val=lo+(hi-lo)*pos/100;s.act=s.val}else s.act=slew(s.act,s.val,sp);s.bad=b.sig&&rt.st[b.sig.id]&&rt.st[b.sig.id].val>.5?1:0;out(s.bad?(rt.st[b.sig.id].val>1.5?(r?r.hi:100):0):s.act);break}
   case 'CONST':out(P.mt?P.th*P.orig/100:P.val);break;
   case 'SIGAB':out(s.val>.5?1:0);break;
   case 'MAN':{if(b.svI===undefined){b.svI=-1;if(b.i)for(let j=0;j<b.i.length;j++){const dr=(S.drv[b.i[j]]||[]).find(x=>x.k==='AMT'&&x.sel>=0&&/B\s*\/\s*T/.test((x.txt||[]).join('/')));if(dr){b.svI=j;break}}if(b.svI<0&&b.i&&b.i[2]!=null&&b.i[2]>=0)b.svI=2}if(b.svI>=0&&b.i[b.svI]!=null&&b.i[b.svI]>=0){const dr=(S.drv[b.i[b.svI]]||[]).find(x=>x.k==='AMT');if(dr&&rt.st[dr.id]&&rt.st[dr.id].pk==='A')s.val=rd(b.i[b.svI])}if(s.trk!=null)s.val=s.trk;s.val=Math.max(P.lo,Math.min(P.hi,s.val));out(s.val);break}
   case 'PID':case 'PIDV':{/* v1.11.0: input = deviation e = SV - PV (EU). Reverse action (ACT:R, P.act<0): PV below SV -> output up. u = Kp*(es + I/Ti + Td*des/dt), es in % of span; clamped to [lo,hi], integral frozen / back-calculated at the limits; while the downstream selector is on another input the controller TRACKS it (bumpless) */
    const span=Math.max(1e-9,P.span||100),pg=b._pgv!==undefined?b._pgv:(b._pgv=(()=>{try{const q=anPins(S,b);return q&&q.pvSg?q.pvSg:null}catch(e){return null}})()),sg=pg==null?(P.act<0?1:-1):(P.act<0?-1:1)*pg,es=anGap(P,sg*anPidIn(S,b,s,v,dt)/span*100),lo=P.lo,hi=P.hi,kp=P.kp==null?1:P.kp;let u,Dt=0;
    if(b.vel){const e1=s.ep==null?es:s.ep;u=s.inited&&dt>0?kp*((es-e1)+(P.ti>0?es*dt/P.ti:0)):0;s.ep2=e1;s.ep=es;s.out=u;s.es=es;s.pt=u;s.it=0;s.dd=0;s.inited=1;out(u);break}
    if(s.trk!=null){u=Math.max(lo,Math.min(hi,s.trk));s.I=u-kp*es}
    else{if(s.inited&&dt>0){if(P.ti>0){const sat=(s.out>=hi&&es>0)||(s.out<=lo&&es<0);if(!sat)s.I+=kp*es/P.ti*dt}if(P.td>0)Dt=kp*P.td*(es-(s.ep||0))/dt}
     const pi=kp*es+s.I;if(pi>hi)s.I-=pi-hi;else if(pi<lo)s.I+=lo-pi;/* v@@VERSION@@: the back-calculation uses the PI part only, so a derivative kick cannot wind the integral up in the wrong direction */u=Math.max(lo,Math.min(hi,kp*es+s.I+Dt));
     /* dMVH: manipulated output variable change ratio upper limit (% of the MV range per sampling interval DTI, 1 s) */
     if(P.dmvh>0&&s.inited&&dt>0&&s.out!=null&&isFinite(s.out)){const lim=P.dmvh/100*(hi-lo)*dt/(P.dti>0?P.dti:1);if(u>s.out+lim)u=s.out+lim;else if(u<s.out-lim)u=s.out-lim}}
    s.ep=es;s.out=u;s.es=es;s.pt=kp*es;s.it=s.I;s.dd=Dt;s.inited=1;out(u);break}
   case 'SW':case 'AMT':{if(b.q4){const q=b.q4;let k=-1;for(let i=0;i<q.cond.length;i++)if(P['c'+(i+1)]>.5){k=i;break}if(k>=0)s.q4k=k;const lg=q.cond[s.q4k==null?0:s.q4k].leg;s.pk=lg.toUpperCase();s.q4l=lg;if(b.o.length)out(q.leg[lg]>=0?rd(q.leg[lg]):0);break}
    /* forced control (the user's FORCE ON / OFF during a test): the selection and the latch before the first force come back when the LAST force on any control of this switch is released */
    {const fn=[];if(b.sel>=0)fn.push(b.sel);for(const c of b.cs||[])fn.push(c.n);const uf=fn.some(n=>rt.force[n]!==undefined);if(uf&&!s.uf){s.uf=1;s.fpk=s.pk==='B'?'B':'A';s.flb=s.lb||0}else if(!uf&&s.uf){s.uf=0;s.pk=s.fpk;s.lb=s.flb}}
    const sel=b.sel>=0?B(rd(b.sel)):0;let pickB=P.selA?!sel:!!sel;if(b.latch){if(pickB)s.lb=1;else if(s.fm==='A')s.lb=0;pickB=!!s.lb}if(b.cs&&b.cs.length>1){const ua=!swTimer(S,b)&&b.cs.some(c=>(rt.force[c.n]!==undefined||(S.ext&&S.ext.includes(c.n)))&&B(rd(c.n)));if(ua&&!s.ub){s.ub=1;s.upk=s.pk==='B'?'B':'A'}else if(!ua&&s.ub){s.ub=0;s.pk=s.upk}}if(b.cs&&b.cs.length>1){const wB=b.cs.some(c=>!c.A&&B(rd(c.n))),wA=b.cs.some(c=>c.A&&B(rd(c.n)));pickB=wB?true:(wA||b.k==='SW')?false:s.pk==='B'}if(s.fm==='A')pickB=false;else if(s.fm==='B')pickB=true;s.pk=pickB?'B':'A';let y;
     const n=pickB?b.b:b.a;if(n>=0){y=rd(n);if(pickB&&b.bg!=null)y*=b.bg;if(!pickB&&b.ag!=null)y*=b.ag;if(b.ia&&b.ia[n])y=y*b.ia[n][0]+b.ia[n][1]}else y=(s.hold!=null?s.hold:0);if(!pickB||b.b>=0)s.hold=y;s.y=y;
     const other=pickB?b.a:b.b;
     /* bumpless tracking: the PID / MAN that feeds the unselected A input follows the output */
     /* interlock tracking (legend: "INTERLOCK TRACKING FOR PID CONTROLLER & MANUAL CONTROL STATION"): a back-up value selected by a downstream selector is also tracked by the upstream A/M selector, its PID and its COS manual value */
     const bu=s.bu;
     if(b.trkFrom)for(const d of b.trkFrom){const ds=rt.st[d.id];if(ds)ds.trk=bu!=null?bu:(pickB?y:(s.tv!=null?s.tv:null))}
     if(b.upA)for(const u of b.upA){const us=rt.st[u.id];if(us){us.bu=bu!=null?bu:((pickB&&b.buCmd)?y:null);/* bumpless through a chain of selectors: when a selector further down is on its manual / other leg, the selectors before it and the PID follow its output */us.tv=pickB?y:(s.tv!=null?s.tv:null)}}
     if(bu!=null&&b.b>=0&&S.ext&&S.ext.includes(b.b)&&/B\s*\/\s*T/.test((b.txt||[]).join('/'))&&s.bw!==bu){s.bw=bu;rt.ext[b.b]=b.bg!=null?bu/b.bg:bu}
     out(b.og!=null?y*b.og:y);break}
   case 'ADD':case 'SUM':case 'DEV':case 'SUB':{let y=0;for(const q of b.ip){let x=rd(q.n);if(q.ia)x=x*q.ia[0]+q.ia[1];y+=q.sg*x}out(y);break}
   case 'MUL':{let y=1;b.i.forEach((n,j)=>{y*=rd(n)/((b.nrm&&b.nrm[j])||1)});if(b.gain!=null)y*=b.gain;out(b.i.length?y:0);break}
   case 'DIV':{const d=rd(b.de);if(Math.abs(d)<1e-9){s.bad=1;out(s.good!=null?s.good:0)}else{s.bad=0;s.good=rd(b.nu)/d;if(b.oa)s.good=s.good*b.oa[0]+b.oa[1];out(s.good)}break}
   case 'HLLIM':{let x=rd(b.main);if(b.lo>=0)x=Math.max(x,rd(b.lo));if(b.hi>=0)x=Math.min(x,rd(b.hi));out(x);break}
   case 'ABS':out(Math.abs(rd(b.i[0])));break;
   case 'SQRT':{const x=rd(b.i[0]);if(x<0){s.bad=1;out(0)}else{s.bad=0;const R=b.rin||100;out(b.idn?x:R*Math.sqrt(x/R))}break}
   case 'HS':case 'LLIM':if(b.cmp){out(rd(b.cmpA)>rd(b.cmpB)?1:0);break}out(b.i.length?Math.max(...b.i.map(rd)):0);break;
   case 'LS':case 'HLIM':if(b.cmp){out(rd(b.cmpA)<rd(b.cmpB)?1:0);break}out(b.i.length?Math.min(...b.i.map(rd)):0);break;
   case 'SEL':{/* AVERAGE SELECT CIRCUIT: average of the inputs whose transmitter is healthy (SIG.AB = 0); all bad: hold the last value */
     const all=b.i.map(rd),hk=all.map((x,k)=>{const sid=b.sgi&&b.sgi[k];const q=sid!=null&&rt.st[sid];return!(q&&q.val>.5)&&Math.abs(x)>1e-9/* zero = lost signal (user rule, SIG.AB) */}),ok=all.filter((_,k)=>hk[k]);
     const md=P.mode||'AVG',ki=md!=='AVG'&&b.mi?b.mi[md]:null;let y;
     if(ki!=null&&hk[ki]){y=all[ki];s.last=y;s.use=md}
     else if(ok.length){y=ok.reduce((p,q)=>p+q,0)/ok.length;s.last=y;s.use=ki!=null?'AVG (the selected input is bad)':'AVG'}
     else{y=s.last!=null?s.last:(all.length?all.reduce((p,q)=>p+q,0)/all.length:0);s.use='holds the last value (all inputs bad)'}
     s.nok=ok.length;out(y);break}
   case 'SUMA':{const x=rd(b.i[0]);s.tot=(s.tot||0)+x*dt/3600;if(b.o.length)out(s.tot);break}
   case 'SUMP':{const x=B(rd(b.i[0]));if(x&&!s.prev)s.cnt=(s.cnt||0)+(P.w||1);s.prev=x;if(b.o.length)out(s.cnt||0);break}
   case 'PO':{const x=rd(b.i[0]);if(s.pos==null){s.pos=x;s.ct=0;s.pw=0;s.pd=0}
     const cyc=P.cyc>0?P.cyc:2,sp=P.stroke>0?P.stroke:60,mn=P.minp>=0?P.minp:.2,ups=100/sp;s.ct+=dt;
     if(s.ct>=cyc){s.ct-=cyc;const need=(x-s.pos)/ups;if(Math.abs(need)>=mn){s.pd=need>0?1:-1;s.pw=Math.min(Math.abs(need),cyc)}else{s.pd=0;s.pw=0}}
     if(s.pd!==0&&(x-s.pos)*s.pd<=0){s.pd=0;s.pw=0}const on=s.pd!==0&&s.ct<s.pw;s.up=on&&s.pd>0;s.dn=on&&s.pd<0;if(on)s.pos+=s.pd*ups*dt;if(b.o.length)out(x);break}
   case 'TP':{const dp=b.tpd>=0?rd(b.tpd):0,tt=b.tpt>=0?rd(b.tpt):null;let y=dp;s.kt=1;if(P.tref!=null&&tt!=null){s.kt=(tt+273.15)/(P.tref+273.15);y=s.kt>0?dp/s.kt:dp}if(b.o.length)out(y);break}
   case 'IP':case 'AO':case 'FIELD':case 'ALM':case 'UNK':{if(b.k==='IP'&&b.posFb){const t=Math.max(0,Math.min(100,rd(b.i[0])));if(s.pos==null)s.pos=t;const st=100/30*dt;s.pos+=Math.max(-st,Math.min(st,t-s.pos))}if(b.o.length)out(rd(b.i[0]));break}
   case 'FX':{let x=rd(b.i[0]);const q=b.fxin;if(q){if(q.k==='ratio')x=x*100;else if(q.k==='rng')x=(x-q.lo)/(q.hi-q.lo)*100}s.fxx=x;const r=anFXs(P,x);s.fxs=r.st==='OK'&&b.fxrev?'SCALE':r.st;out(r.y);break}
   case 'DRATE':{const x=rd(b.i[0]),H=s.h=s.h||[];if(H.length&&H[H.length-1][0]===rt.t)H[H.length-1][1]=x;else H.push([rt.t,x]);const W=P.win||30;while(H.length>2&&H[1][0]<=rt.t-W)H.shift();const o0=H[0],dw=rt.t-o0[0];out(dw>1e-6?(o0[1]-x)/dw*60:0);break}
   case 'LAG':{const x=rd(b.i[0]);if(s.y==null)s.y=x;s.y+=(x-s.y)*(1-Math.exp(-dt/Math.max(P.tau,.01)));out(s.y);break}
   case 'RATE':case 'RAMPB':{if(b.tpar!==undefined){const T=rd(b.tpar);P.rate=T>0&&isFinite(T)?b.span/(T*0.036):1e-12}if(b.main!==undefined){const x=rd(b.main);if(s.y==null)s.y=x;if(b.byp>=0&&B(rd(b.byp)))s.y=x;else{const fx=b.up===undefined,ru=fx?P.rate:rd(b.up),rd_=fx?P.rate:rd(b.dn),d=x-s.y;s.rev=fx&&!(P.rate>0)?'NO RATE':0;const mu=ru>0?ru*dt:Infinity,md=rd_>0?rd_*dt:Infinity;s.y+=d>0?Math.min(d,mu):-Math.min(-d,md)}out(s.y);break}const x=rd(b.i[0]);if(s.y==null)s.y=x;const m=P.rate*dt;s.y+=Math.max(-m,Math.min(m,x-s.y));out(s.y);break}
   case 'HC':case 'LC':case 'HLC':case 'CMPK':{const x=rd(b.i[0]),sp=P.ref>=0?rd(P.ref):P.sp;out(P.op==='>'?((P.inc?x>=sp:x>sp)?1:0):((P.inc?x<=sp:x<sp)?1:0));break}
   case 'DCMP':{const x0=rd(b.i[0]);for(const d of b.dc){const x=d.neg?-x0:x0;v[d.n]=(d.op==='>'?(d.inc?x>=d.sp:x>d.sp):(d.inc?x<=d.sp:x<d.sp))?1:0}break}
   case 'ACT':case 'VLV':{let x0=rd(b.i[0]);if(b.k==='VLV'&&b.i.length&&nets[b.i[0]].dig)x0=x0>.5?100:0;const t=Math.max(0,Math.min(100,x0));if(s.pos==null)s.pos=t;const st=100/Math.max(P.stroke,.1)*dt;s.pos+=Math.max(-st,Math.min(st,t-s.pos));s.mv=Math.abs(t-s.pos)>.05;if(s.mv)s.dir=t>s.pos?1:-1;if(b.o.length)out(s.pos);break}
   case 'CTK':{/* conditional write (SET SIxxxx => TAG.SV IF ctl): while ctl = 1 it sends the input, when ctl = 0 it does NOT write (the last value stays) */
     if(B(rd(b.ctl)))s.cv=rd(b.cin);out(s.cv==null?0:s.cv);break}
   case 'PVSV':out(rd(b.pv)<rd(b.sv)?1:0);break;
   case 'NOT':out(B(rd(b.i[0]))?0:1);break;
   case 'AND':out(b.i.length&&b.i.every(n=>B(rd(n)))?1:0);break;
   case 'OR':out(b.i.some(n=>B(rd(n)))?1:0);break;
   case 'FF':{const sv=B(rd(b.S)),rv=B(rd(b.Rn));if(rv)s.q=0;else if(sv)s.q=1;out(s.q);break}
   case 'TON':{const x=B(rd(b.i[0]));if(x){s.acc+=dt;if(s.acc>=P.sec)s.out=1}else{s.acc=0;s.out=0}out(s.out);break}
   case 'TOF':{const x=B(rd(b.i[0]));if(x){s.acc=0;s.out=1}else if(s.out){s.acc+=dt;if(s.acc>=P.sec){s.out=0}}out(s.out);break}
   case 'TPV':{const x=b.sg>=0?B(rd(b.sg)):0,T=b.xin>=0?rd(b.xin):0;if(x&&!s.prev&&!s.run){s.run=1;s.acc=0}if(s.run){s.acc+=dt;if(s.acc>=T)s.run=0}s.prev=x;s.out=s.run?1:0;out(s.out);break}
   case 'TPS':{const x=B(rd(b.i[0]));if(x&&!s.prev&&!s.run){s.run=1;s.acc=0}if(s.run){s.acc+=dt;if(s.acc>=P.sec){s.run=0}}s.prev=x;s.out=s.run?1:0;out(s.out);break}
   default:if(b.o.length)out(rd(b.i[0]))}
  for(const n of b.o)if(F[n]!==undefined)v[n]=F[n]}
 return rt}
function anSettle(S,n){for(let i=0;i<(n||6);i++)anStep(S,0)}
if(typeof module!=='undefined')module.exports={anRead,anExplode,anPtSeg,anBuild,anTimerCut,anNets,anTouch,anArrowAt,anDistPoly,anInPoly,anModel,anWire,anNum,anRange,anCompile,anInit,anFX,anFXs,anStep,anSettle,anProcList,anPins,anAddr};

