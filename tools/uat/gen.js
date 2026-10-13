/* UAT generator (runs in the page): builds, for every sheet, one test per logic block / controller, grouped by type.
   The expected values come from the definition of the block (truth tables, comparator rule, timer rule, curve table, controller action),
   not from the engine. */
window.UATG=(function(){
 const fmt=UATR.fmt;
 const label=(S,n)=>{const l=S.lab&&S.lab[n];return l&&l.t?l.t.trim():''};
 const near=(S,b)=>{const t=[];for(const n of (b.o||[]).concat(b.i||[])){const l=label(S,n);if(l&&!t.includes(l)&&t.length<2)t.push(l)}return t.join(', ')};
 const free=(S,n)=>n!=null&&n>=0&&!(S.multi&&S.multi[n])&&!(S.pre&&S.pre[n]);
 const R=(k,t,v,tol)=>({k,t,v,tol:tol==null?0.05:tol});
 const st1=(force,secs,extra)=>Object.assign({force,secs:secs||0},extra||{});
 function interp(pts,x){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(x>=a[0]&&x<=b[0]&&b[0]>a[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return null}
 /* the switch applies the gain / scaling that is drawn on the leg (bg, ag, ia): the expected value includes it */
 const leg=(b,pickB,x)=>{const n=pickB?b.b:b.a;let y=x;if(pickB&&b.bg!=null)y*=b.bg;if(!pickB&&b.ag!=null)y*=b.ag;if(b.ia&&b.ia[n])y=y*b.ia[n][0]+b.ia[n][1];return y};
 const gtxt=(b,pickB)=>{const n=pickB?b.b:b.a;return (pickB?b.bg:b.ag)!=null||(b.ia&&b.ia[n])?' (with the gain drawn on that leg)':''};
 function sheetSpec(sh){const S=AN.ensure(sh);const G={};const add=(g,it)=>{(G[g]=G[g]||[]).push(it)};
  const item=(b,kind,cases,extra)=>Object.assign({id:b.id,n:kind+' #'+b.id+(near(S,b)?'  ('+near(S,b)+')':''),blk:b.id,cx:b.cx,cy:b.cy,cases},extra||{});
  for(const b of S.blk){const o=b.o&&b.o[0];
   // switches (T / A-M)
   if((b.k==='SW'||b.k==='AMT')&&!b.q4&&!b.latch&&b.sel>=0&&b.a>=0&&b.b>=0&&o!=null&&free(S,o)&&o!==b.a&&o!==b.b&&!(b.cs&&b.cs.length>1)){
    const cs=[];for(const sel of [0,1]){const pickB=b.p.selA?!sel:!!sel;cs.push({l:'select = '+sel+' -> output follows input '+(pickB?'B':'A'),steps:[st1({[b.a]:11,[b.b]:22,[b.sel]:sel},0)],rows:[R(o,'output (A = 11, B = 22)'+gtxt(b,pickB),leg(b,pickB,pickB?22:11),Math.max(.05,Math.abs(leg(b,pickB,pickB?22:11))*.002))],reset:false})}
    add('Switches (T and A/M)',item(b,b.k==='AMT'?'A/M switch':'T switch',cs))}
   // operator selectors (with COS conditions)
   if((b.k==='SW'||b.k==='AMT')&&!b.q4&&b.a>=0&&b.b>=0&&o!=null&&free(S,o)&&b.cs&&b.cs.length>1){
    const cs=[];for(const c of b.cs){const f={[b.a]:11,[b.b]:22};for(const c2 of b.cs)f[c2.n]=0;f[c.n]=1;cs.push({l:'operator condition '+(label(S,c.n)||('net '+c.n))+' = 1 (the others 0) -> input '+(c.A?'A':'B'),steps:[st1(f,0)],rows:[R(o,'output (A = 11, B = 22)'+gtxt(b,!c.A),leg(b,!c.A,c.A?11:22),Math.max(.05,Math.abs(leg(b,!c.A,c.A?11:22))*.002))]})}
    add('Operator selectors (COS)',item(b,'COS selector',cs))}
   // gates
   if((b.k==='AND'||b.k==='OR')&&b.i.length>=1&&b.i.length<=8&&free(S,o)){
    const n=b.i.length,cs=[],mk=(l,vals)=>{const f={};b.i.forEach((x,i)=>f[x]=vals[i]);const e=b.k==='AND'?(vals.every(v=>v)?1:0):(vals.some(v=>v)?1:0);cs.push({l,steps:[st1(f,0)],rows:[R(o,'output',e)],reset:false})};
    mk('all inputs 0',b.i.map(()=>0));mk('all inputs 1',b.i.map(()=>1));
    if(n>1)b.i.forEach((x,k)=>{const v=b.i.map(()=>b.k==='AND'?1:0);v[k]=b.k==='AND'?0:1;mk('only input '+(k+1)+(b.k==='AND'?' = 0':' = 1'),v)});
    add('Logic gates (AND / OR / NOT)',item(b,b.k,cs))}
   if(b.k==='NOT'&&b.i.length===1&&free(S,o)){add('Logic gates (AND / OR / NOT)',item(b,'NOT',[0,1].map(v=>({l:'input = '+v+' -> output '+(1-v),steps:[st1({[b.i[0]]:v},0)],rows:[R(o,'output',1-v)],reset:false}))))}
   // comparators
   if((b.k==='HC'||b.k==='LC')&&b.p&&isFinite(b.p.sp)&&!(b.p.ref>=0)&&(b.p.op==='>'||b.p.op==='<')&&b.i[0]!=null&&free(S,o)){
    const sp=b.p.sp,d=Math.max(1,Math.abs(sp)*0.1),cs=[];for(const [l,x] of [['below the set point',sp-d],['above the set point',sp+d]]){const e=b.p.op==='>'?(x>sp?1:0):(x<sp?1:0);cs.push({l:'input '+fmt(x)+' ('+l+' '+sp+') -> output '+e,steps:[st1({[b.i[0]]:x},0)],rows:[R(o,'output ('+b.p.op+' '+sp+(b.p.u?' '+b.p.u:'')+')',e)],reset:false})}
    add('Comparators',item(b,'Comparator '+b.p.op+' '+sp,cs))}
   // timers
   if((b.k==='TON'||b.k==='TOF'||b.k==='TPS')&&b.p&&b.p.sec>0&&b.p.sec<=30&&b.i[0]!=null&&free(S,o)){
    const sec=b.p.sec,i0=b.i[0],q=x=>Math.max(.25,Math.round(x*4)/4),cs=[];
    if(b.k==='TON'){cs.push({l:'input 1 for '+fmt(sec-1)+' s (before the delay) -> output 0',steps:[st1({[i0]:0},1),st1({[i0]:1},q(sec-1))],rows:[R(o,'output',0)]});cs.push({l:'input 1 for '+fmt(sec+1)+' s (after the delay) -> output 1',steps:[st1({[i0]:0},1),st1({[i0]:1},q(sec+1))],rows:[R(o,'output',1)]})}
    if(b.k==='TOF'){cs.push({l:'input 1 then 0, '+fmt(sec-1)+' s after it fell -> output still 1',steps:[st1({[i0]:1},2),st1({[i0]:0},q(sec-1))],rows:[R(o,'output',1)]});cs.push({l:'input 1 then 0, '+fmt(sec+1)+' s after it fell -> output 0',steps:[st1({[i0]:1},2),st1({[i0]:0},q(sec+1))],rows:[R(o,'output',0)]})}
    if(b.k==='TPS'){cs.push({l:'rising edge, '+fmt(sec-1)+' s later -> pulse still 1',steps:[st1({[i0]:0},q(sec+1)),st1({[i0]:1},q(sec-1))],rows:[R(o,'output',1)]});cs.push({l:'rising edge, '+fmt(sec+1)+' s later -> pulse ended (0)',steps:[st1({[i0]:0},q(sec+1)),st1({[i0]:1},q(sec+1))],rows:[R(o,'output',0)]})}
    add('Timers (TON / TOF / pulse)',item(b,b.k+' '+sec+' s',cs))}
   // LAG
   if(b.k==='LAG'&&b.p&&b.p.tau>0&&b.p.tau<=150&&b.i[0]!=null&&free(S,o)){const tau=b.p.tau,q=x=>Math.max(.25,Math.round(x*4)/4);add('Lag (first order)',item(b,'Lag '+tau+' s',[{l:'step 0 -> 100: after one time constant the output is 63.2 % of the step',steps:[st1({[b.i[0]]:0},2),st1({[b.i[0]]:100},q(tau))],rows:[R(o,'output after '+fmt(tau)+' s',63.2,3)]}]))}
   // F(X) curves (no input scaling)
   if(b.k==='FX'&&b.p&&b.p.tbl&&b.p.tbl.pts&&b.i[0]!=null&&o!=null&&free(S,o)&&!b.fxin&&!b.fxrev){
    const pts=b.p.tbl.pts,xs=[...new Set(pts.map(p=>p[0]))].sort((a,c)=>a-c),pick=[xs[1],xs[Math.floor(xs.length/2)],xs[xs.length-3]].filter(x=>x!=null),cs=[];
    for(const x of pick){const y=interp(pts,x);if(y==null)continue;cs.push({l:'input '+fmt(x)+' -> table output '+fmt(y),steps:[st1({[b.i[0]]:x},0)],rows:[R(o,'output (table '+b.p.ln+')',y,Math.max(.05,Math.abs(y)*.01))],reset:false})}
    if(cs.length)add('Curves F(X) (workbook tables)',item(b,'F(X) '+b.p.ln,cs))}
   // high / low select
   if((b.k==='HS'||b.k==='LS'||b.k==='HLIM'||b.k==='LLIM')&&!b.cmp&&b.i.length>=2&&b.i.length<=4&&free(S,o)){
    const hi=(b.k==='HS'||b.k==='LLIM'),vals=b.i.map((x,i)=>11*(i+1)),cs=[];
    for(const rev of [0,1]){const v=rev?vals.slice().reverse():vals,f={};b.i.forEach((x,i)=>f[x]=v[i]);cs.push({l:'inputs '+v.join(', ')+' -> '+(hi?'highest':'lowest'),steps:[st1(f,0)],rows:[R(o,'output',hi?Math.max(...v):Math.min(...v))],reset:false})}
    add('High / low selectors',item(b,b.k==='HS'||b.k==='LLIM'?'High select':'Low select',cs))}
   // analog outputs
   if(b.k==='AO'&&b.i[0]!=null&&o!=null&&free(S,o)&&S.aoN&&S.aoN.has(o)){
    add('Analog outputs (AO, 0 ~ 100 %)',item(b,'AO',[[50,50],[150,100],[-10,0]].map(([x,e])=>({l:'input '+x+' -> output '+e+' (limited to 0 ~ 100)',steps:[st1({[b.i[0]]:x},0)],rows:[R(o,'output',e)],reset:false}))))}
   // analog inputs
   if(b.k==='AI'&&!b.fb&&b.rng&&b.rng.hi>b.rng.lo&&o!=null&&free(S,o)){
    const lo=b.rng.lo,hi=b.rng.hi,pts=[lo,(lo+hi)/2,hi];add('Analog inputs (AI, transmitter range)',item(b,'AI '+(label(S,o)||''),pts.map(x=>({l:'signal '+fmt(x)+(b.rng.u?' '+b.rng.u:'')+' -> value on the drawing',steps:[st1({},2,{ext:{[o]:x},st:{[b.id]:{val:x,act:x,bad:0}}})],rows:[R(o,'value',x,Math.max(.05,Math.abs(hi-lo)*.005))]}))))}
   // manual stations
   if(b.k==='MAN'&&b.p&&o!=null&&free(S,o)){const lo=b.p.lo!=null?b.p.lo:0,hi0=b.p.hi!=null?b.p.hi:100,hi=S.aoN&&S.aoN.has(o)?Math.min(hi0,100):hi0;let svI=-1;for(let j=0;j<(b.i||[]).length;j++){const dr=(S.drv[b.i[j]]||[]).find(x=>x.k==='AMT'&&x.sel>=0&&/B\s*\/\s*T/.test((x.txt||[]).join('/')));if(dr){svI=j;break}}if(svI<0&&b.i&&b.i[2]!=null&&b.i[2]>=0)svI=2;const fmD=svI>=0?(S.drv[b.i[svI]]||[]).find(x=>x.k==='AMT'):null;const fmx=fmD?{[fmD.id]:'B'}:{};
    add('Manual stations (MAN)',item(b,'Manual station '+((b.txt||[])[0]||''),[[lo+(hi-lo)*.3,lo+(hi-lo)*.3,'30 % of the range'],[hi+(hi-lo)*.2,hi,'above the high limit (clamped)']].map(([x,e,l])=>({l:'set '+fmt(x)+' ('+l+') -> output '+fmt(e),steps:[st1({},2,{fm:fmx,st:{[b.id]:{val:x}}})],skipTrk:b.id,rows:[R(o,'output',e,Math.max(.05,(hi-lo)*.005))]}))))}
   // totalizer
   if(b.k==='SUMA'&&b.i[0]!=null&&o!=null&&free(S,o)){add('Totalizers (SUMA)',item(b,'Totalizer',[{l:'input 36 for 100 s -> total 1.0 (36 per hour x 100 s)',steps:[st1({[b.i[0]]:36},100)],rows:[R(o,'total',1.0,0.03)]}]))}
   // controllers
   if((b.k==='PID')&&b.p&&o!=null){const tag=(b.txt||[])[1];if(!tag||/^X+-/.test(tag))continue;let q=null;try{q=AN.anPins(S,b)}catch(e){}if(!q||q.pv==null||q.pv<0||q.sv==null)continue;
    const P=b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,span=rhi-rlo,mid=rlo+.5*span,hi=P.hi!=null?P.hi:100,lo=P.lo!=null?P.lo:0,rev=P.act<0;
    const amt0=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null),fmA=amt0?{fm:{[amt0.id]:b.o.includes(amt0.a)?'A':'B'}}:{};
    const lim=[lo,hi],d=Math.max(.5,(hi-lo)*.01),cs=[];
    cs.push({l:'PV 20 % above the set point -> output '+(rev?'falls (reverse action)':'rises (direct action)'),steps:[st1({[q.pv]:mid,[q.sv]:mid},10,fmA),st1({[q.pv]:mid+.2*span,[q.sv]:mid},20,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output',cmp:rev?'dec':'inc',d,lim}]});
    cs.push({l:'PV 20 % below the set point -> output '+(rev?'rises (reverse action)':'falls (direct action)'),steps:[st1({[q.pv]:mid,[q.sv]:mid},10,fmA),st1({[q.pv]:mid-.2*span,[q.sv]:mid},20,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output',cmp:rev?'inc':'dec',d,lim}]});
    cs.push({l:'output is always inside its limits ('+fmt(lo)+' ~ '+fmt(hi)+')',steps:[st1({[q.pv]:rlo,[q.sv]:rhi},30,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output (PV at the bottom, set point at the top)',v:(lo+hi)/2,tol:(hi-lo)/2+0.01}]});
    const amt=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null);
    if(amt){const autoLeg=b.o.includes(amt.a)?'A':'B',manLeg=autoLeg==='A'?'B':'A',manNet=autoLeg==='A'?amt.b:amt.a;
     cs.push({l:'AUTO: the loop output goes through the A/M switch unchanged',steps:[st1({[q.pv]:mid,[q.sv]:mid},5,{fm:{[amt.id]:autoLeg}})],rows:[{k:amt.o[0],t:'output of the A/M switch',eqk:o,tol:0.1}]});
     if(S.ext.includes(manNet))cs.push({l:'MAN: manual value 37 -> output 37',steps:[st1({},4,{fm:{[amt.id]:manLeg},ext:{[manNet]:37}})],rows:[R(amt.o[0],'output of the A/M switch',37,0.1)]})}
    add('Controllers (PID)',item(b,'PID '+tag+(P.act<0?' (reverse)':' (direct)'),cs))}
  }
  const order=['Switches (T and A/M)','Operator selectors (COS)','Logic gates (AND / OR / NOT)','Comparators','Timers (TON / TOF / pulse)','Lag (first order)','Curves F(X) (workbook tables)','High / low selectors','Analog inputs (AI, transmitter range)','Analog outputs (AO, 0 ~ 100 %)','Manual stations (MAN)','Totalizers (SUMA)','Controllers (PID)'];
  return {groups:order.filter(g=>G[g]).map(g=>({g,items:G[g]}))}}
 return {sheetSpec}})();
