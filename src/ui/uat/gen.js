/* UAT generator (runs in the page): builds, for every sheet, one test per logic block / controller, grouped by type.
   The expected values come from the definition of the block (truth tables, comparator rule, timer rule, curve table, controller action),
   not from the engine. */
window.UATG=(function(){
 const fmt=UATR.fmt;
 const label=(S,n)=>{const l=S.lab&&S.lab[n];return l&&l.t?l.t.trim():''};
 const near=(S,b)=>{const t=[];for(const n of (b.o||[]).concat(b.i||[])){const l=label(S,n);if(l&&!t.includes(l)&&t.length<2)t.push(l)}return t.join(', ')};
 const free=(S,n)=>n!=null&&n>=0&&!(S.multi&&S.multi[n])&&!(S.pre&&S.pre[n]);
 const kn=(S,n)=>S.kn&&S.kn[n]!==undefined;/* an input with a number written on the drawing is a constant: it is not forced, its value is used */
 const clampAO=(S,o,e)=>S.aoN&&S.aoN.has(o)?Math.max(0,Math.min(100,e)):e;/* a net that feeds an AO is limited to 0 ~ 100 */
 const R=(k,t,v,tol)=>({k,t,v,tol:tol==null?0.05:tol});
 const st1=(force,secs,extra)=>Object.assign({force,secs:secs||0},extra||{});
 function interp(pts,x){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(x>=a[0]&&x<=b[0]&&b[0]>a[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return null}
 /* the switch applies the gain / scaling that is drawn on the leg (bg, ag, ia): the expected value includes it */
 const leg=(b,pickB,x)=>{const n=pickB?b.b:b.a;let y=x;if(pickB&&b.bg!=null)y*=b.bg;if(!pickB&&b.ag!=null)y*=b.ag;if(b.ia&&b.ia[n])y=y*b.ia[n][0]+b.ia[n][1];if(b.og!=null)y*=b.og;return y};
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
   if((b.k==='HC'||b.k==='LC'||b.k==='CMPK')&&b.p&&isFinite(b.p.sp)&&!(b.p.ref>=0)&&(b.p.op==='>'||b.p.op==='<')&&b.i[0]!=null&&free(S,o)){
    const sp=b.p.sp,d=Math.max(1,Math.abs(sp)*0.1),cs=[];for(const [l,x] of [['below the set point',sp-d],['above the set point',sp+d]]){const e=b.p.op==='>'?(x>sp?1:0):(x<sp?1:0);cs.push({l:'input '+fmt(x)+' ('+l+' '+sp+') -> output '+e,steps:[st1({[b.i[0]]:x},0)],rows:[R(o,'output ('+b.p.op+' '+sp+(b.p.u?' '+b.p.u:'')+')',e)],reset:false})}
    add('Comparators',item(b,'Comparator '+b.p.op+' '+sp,cs))}
   // math: add / subtract / sum / deviation (expected = sum of the signed inputs; the sign of each input is written in the test line)
   if((b.k==='ADD'||b.k==='SUM'||b.k==='SUB'||b.k==='DEV')&&b.ip&&b.ip.length>=2&&b.ip.length<=8&&o!=null&&free(S,o)&&b.ip.every(q=>q.n>=0)){
    const sg=b.ip.map(q=>q.sg>0?'+':'-').join(' '),mk=vals=>{const f={};let e=0;b.ip.forEach((q,j)=>{let x=kn(S,q.n)?S.kn[q.n]:vals[j];if(!kn(S,q.n))f[q.n]=vals[j];if(q.ia)x=x*q.ia[0]+q.ia[1];e+=q.sg*x});e=clampAO(S,o,e);return {f,e}};
    const cs=[];for(const base of [[7,11,13,5,3,2,17,19],[20,3,9,14,6,4,1,8],[11,7,5,3,2,13,19,17]]){const m=mk(base),vs=b.ip.map((q,j)=>kn(S,q.n)?S.kn[q.n]:base[j]);cs.push({l:'inputs '+vs.join(', ')+' (signs '+sg+') -> sum '+fmt(m.e),steps:[st1(m.f,0)],rows:[R(o,'output = '+b.ip.map((q,j)=>(q.sg>0?'+':'-')+fmt(vs[j])).join(' '),m.e,Math.max(.05,Math.abs(m.e)*.002))],reset:false})}
    add('Math: add / subtract / sum / deviation',item(b,(b.k==='ADD'?'Add':b.k==='SUM'?'Sum':b.k==='SUB'?'Subtract':'Deviation')+' ('+sg+')',cs))}
   // math: multiply / divide / square root / absolute value
   if(b.k==='MUL'&&b.i&&b.i.length>=2&&b.i.length<=4&&b.i.every(n=>n>=0)&&o!=null&&free(S,o)){
    const cs=[];for(const base of [[4,5,2,3],[8,0.5,6,2]]){const vs=b.i.map((n,j)=>kn(S,n)?S.kn[n]:base[j]),f={};let e=1;b.i.forEach((n,j)=>{if(!kn(S,n))f[n]=vs[j];e*=vs[j]/(((b.nrm&&b.nrm[j])||1)*((b.scn&&b.scn[j])||1))});if(b.gain!=null)e*=b.gain;e=clampAO(S,o,e);if(Math.abs(e)<1e6)cs.push({l:'inputs '+vs.join(' x ')+(b.gain!=null?' x gain '+b.gain:'')+(b.nrm&&b.nrm.some(Boolean)?' (inputs scaled by '+b.nrm.map(x=>x||1).join(', ')+')':'')+' -> '+fmt(e),steps:[st1(f,0)],rows:[R(o,'product',e,Math.max(.05,Math.abs(e)*.002))],reset:false})}
    if(cs.length)add('Math: multiply / divide / abs',item(b,'Multiply',cs))}
   if(b.k==='DIV'&&b.nu>=0&&b.de>=0&&o!=null&&free(S,o)){
    const cs=[];for(const [nu0,de0] of [[12,4],[9,3]]){const nu=kn(S,b.nu)?S.kn[b.nu]:nu0,de=kn(S,b.de)?S.kn[b.de]:de0;if(!de)continue;let e=nu/de;if(b.oa)e=e*b.oa[0]+b.oa[1];e=clampAO(S,o,e);const f={};if(!kn(S,b.nu))f[b.nu]=nu;if(!kn(S,b.de))f[b.de]=de;cs.push({l:'numerator '+nu+' / denominator '+de+' -> '+fmt(e),steps:[st1(f,0)],rows:[R(o,'quotient',e,Math.max(.05,Math.abs(e)*.002))],reset:false})}
    add('Math: multiply / divide / abs',item(b,'Divide',cs))}
   if(b.k==='ABS'&&b.i[0]!=null&&o!=null&&free(S,o)){
    add('Math: multiply / divide / abs',item(b,'Absolute value',[-7,7].map(x=>({l:'input '+x+' -> '+Math.abs(x),steps:[st1({[b.i[0]]:x},0)],rows:[R(o,'output',Math.abs(x))],reset:false}))))}
   // constants: the number written in the box
   if(b.k==='CONST'&&!b.ref&&!(b.p&&b.p.mt)&&b.txt&&b.txt.length&&o!=null&&free(S,o)){
    const tn=String(b.txt[0]).replace(/%%%/g,'%').trim();if(/^-?\d+(\.\d+)?\s*[%A-Za-z°\/]{0,8}$/.test(tn)){const e=parseFloat(tn);
     if(/%/.test(tn))add('Constants (value written in the box)',item(b,'Constant '+tn,[{l:'not tested: a constant in % is turned into the real range of the signal it feeds (PROJECT_RULES 4a): check it with the eye button',skipMsg:'a constant in % is turned into the real range of the signal (rule 4a)',steps:[],rows:[]}]))
     else add('Constants (value written in the box)',item(b,'Constant '+tn,[{l:'the box says "'+tn+'" -> output '+fmt(e),steps:[st1({},0)],rows:[R(o,'output',e,Math.max(.001,Math.abs(e)*.0005))],reset:false}]))}}
   // flip-flop (S / R)
   if(b.k==='FF'&&b.S>=0&&b.Rn>=0&&o!=null&&free(S,o)){
    const q=(l,steps,e)=>({l,steps,rows:[R(o,'Q',e)]});
    add('Flip-flops (S / R)',item(b,'Flip-flop S / R',[q('S = 1, R = 0 -> Q = 1',[st1({[b.S]:1,[b.Rn]:0},1)],1),q('S = 1 then S = 0 (R = 0) -> Q stays 1',[st1({[b.S]:1,[b.Rn]:0},1),st1({[b.S]:0,[b.Rn]:0},1)],1),q('S = 1, then R = 1 (S = 0) -> Q = 0',[st1({[b.S]:1,[b.Rn]:0},1),st1({[b.S]:0,[b.Rn]:1},1)],0),q('R = 1 then R = 0 (S = 0) -> Q stays 0',[st1({[b.S]:1,[b.Rn]:0},1),st1({[b.S]:0,[b.Rn]:1},1),st1({[b.S]:0,[b.Rn]:0},1)],0)]))}
   // average select circuit
   if(b.k==='SEL'&&b.i&&b.i.length>=2&&b.i.length<=6&&o!=null&&free(S,o)&&(!b.p||!b.p.mode||b.p.mode==='AVG')){
    const vs=b.i.map((n,j)=>10+7*j),e=vs.reduce((a,c)=>a+c,0)/vs.length,f={};b.i.forEach((n,j)=>f[n]=vs[j]);
    add('Average select circuits',item(b,'Average select',[{l:'all transmitters healthy, inputs '+vs.join(', ')+' -> average '+fmt(e),steps:[st1(f,0)],rows:[R(o,'average',e,Math.max(.05,Math.abs(e)*.002))],reset:false}]))}
   // ramp / rate limiter: the rate comes from the text written on the drawing (independent of the reader)
   if((b.k==='RATE'||b.k==='RAMPB')&&b.main!==undefined&&b.main>=0&&o!=null&&free(S,o)){
    const rt=(b.p&&b.p.rtxt)||'',m=/(-?\d+(?:\.\d+)?)\s*([%A-Za-z\/\d²]*?)\s*\/\s*(sec|s|min|hr|h)\b/i.exec(rt);
    const skip=msg=>add('Ramps (rate limiters)',item(b,(b.k==='RAMPB'?'Bumpless ramp':'Rate limiter')+(rt?'  "'+rt+'"':''),[{l:'not tested: '+msg,skipMsg:msg,steps:[],rows:[]}]));
    if(b.tpar!==undefined)skip('the rate comes from a signal (time parameter T), not from a number on the drawing');
    else if(b.up!==undefined)skip('the rate comes from a signal ("X % / sec"); the unit of that signal is Needs Verification');
    else if(!m)skip('the drawing writes no rate near this box: the simulator uses 1 unit per second (user decision 2026-10-10)');
    else{const per=/min/i.test(m[3])?60:/h/i.test(m[3])?3600:1,pct=/%/.test(m[2]);
     if(pct&&!(b.span>0))skip('the rate is in % of the signal range ("'+rt+'") but the range of the signal is not found: Needs Verification');
     else{const r=parseFloat(m[1])/per*(pct?b.span/100:1),t=Math.max(.25,Math.min(120,Math.round(20/r*4)/4)),cs=[];
      if(S.aoN&&S.aoN.has(o)){skip('the output feeds an AO directly (limited 0 ~ 100)');}
      else{
      if(b.byp>=0)cs.push({l:'bypass = 1: the output follows the input at once (input 30 -> 30)',steps:[st1({[b.main]:30,[b.byp]:1},0)],rows:[R(o,'output',30)],reset:false});
      cs.push({l:'rate written on the drawing: '+rt+' = '+fmt(r)+' units per second'+(pct?' (% of a range of '+fmt(b.span)+')':'')+'. The input jumps far above the output: in '+fmt(t)+' s the output must rise by '+fmt(r*t),steps:[st1(Object.assign({[b.main]:1e4},b.byp>=0?{[b.byp]:0}:{}),t)],rows:[{k:o,t:'output rise',cmp:'delta',v:r*t,tol:Math.max(.0005,r*t*.04)}],reset:true});
      add('Ramps (rate limiters)',item(b,(b.k==='RAMPB'?'Bumpless ramp':'Rate limiter')+'  "'+rt+'"',cs))}}}}
   // alarms: the level shown to the operator, from the limits of the block (rule: >= high / <= low)
   if(b.k==='ALM'&&b.p&&b.pins&&b.pins[0]&&b.pins[0].n>=0){const P=b.p,n=b.pins[0].n,has=x=>x!=null&&isFinite(x),cs=[];
    const c=(x,e)=>cs.push({l:'input '+fmt(x)+' -> alarm "'+e+'"',steps:[st1({[n]:x},0)],rows:[{t:'alarm shown',cmp:'eval',fn:S2=>AN.almLv(b,S2.rt.v[n]),vs:e}],reset:false});
    if(has(P.l)&&has(P.h)&&P.l<P.h){const sp=P.h-P.l;c((P.l+P.h)/2,'normal');
     if(has(P.hh)&&P.hh>P.h){c((P.h+P.hh)/2,'HIGH');c(P.hh+sp*.1,'HIGH-HIGH')}else c(P.h+sp*.1,'HIGH');
     if(has(P.ll)&&P.ll<P.l){c((P.l+P.ll)/2,'LOW');c(P.ll-sp*.1,'LOW-LOW')}else c(P.l-sp*.1,'LOW')}
    if(cs.length)add('Alarms (ALM)',item(b,'Alarm limits LL '+(has(P.ll)?fmt(P.ll):'-')+' / L '+(has(P.l)?fmt(P.l):'-')+' / H '+(has(P.h)?fmt(P.h):'-')+' / HH '+(has(P.hh)?fmt(P.hh):'-'),cs))}
   // valves / actuators: the position moves toward the command at 100 % per stroke time (stroke time is a simulator setting, 30 s unless set)
   if((b.k==='ACT'||b.k==='VLV')&&b.i&&b.i[0]!=null&&b.p&&b.p.stroke>0){const n=b.i[0],dg=S.nets[n].dig,hi=dg?1:100,T=b.p.stroke,t=Math.max(.25,Math.round(T/4*4)/4),stk={id:b.id,f:'pos'};
    add('Valves and actuators (stroke)',item(b,(b.k==='VLV'?'Valve':'Actuator')+' stroke '+fmt(T)+' s',[
     {l:'command '+(dg?'0':'0 %')+' for the whole stroke (closed), then '+(dg?'1':'100 %')+': after '+fmt(t)+' s (a quarter of the stroke) the position is 25 %',steps:[st1({[n]:0},T+1),st1({[n]:hi},t)],rows:[{st:stk,t:'position (%)',v:25,tol:3}],reset:true},
     {l:'command full open for the whole stroke, then closed for a quarter of the stroke: the position is 75 %',steps:[st1({[n]:hi},T+1),st1({[n]:0},t)],rows:[{st:stk,t:'position (%)',v:75,tol:3}],reset:true}]))}
   // analog outputs without an output net: the limit 0 ~ 100 is applied on the net that feeds the AO (it is tested through the blocks that drive it)
   if(b.k==='AO'&&!(b.o&&b.o.length)){add('Analog outputs (AO, 0 ~ 100 %)',item(b,'AO',[{l:'not tested alone: the AO has no output net; its 0 ~ 100 limit is applied to the net that feeds it, and that is checked on the blocks that drive it (math and switches)',skipMsg:'no output net on the drawing',steps:[],rows:[]}]))}
   // minimum air flow constant ("32 %" into the high selector): a percent of the TOTAL AIR FLOW scale; the scale is the most frequent denominator of the SCALE CONVERT constants written on the sheet (648 / 1115 ...)
   if(b.k==='CONST'&&b.p&&b.p.mt&&o!=null&&free(S,o)){const dc={};for(const t of S.tx){const m=/^\s*\d+\s*\/\s*(\d+)\s*$/.exec(t.t);if(m)dc[m[1]]=(dc[m[1]]||0)+1}let den=0,bc=0;for(const k in dc)if(dc[k]>bc){bc=dc[k];den=+k}
    if(den>0){const e=b.p.orig/100*den;add('Constants (value written in the box)',item(b,'Minimum air flow '+b.p.orig+' %',[{l:'the box says '+b.p.orig+' % and the sheet converts to a total air flow scale of 0 ~ '+den+' T/H -> '+fmt(e)+' T/H',steps:[st1({},0)],rows:[R(o,'output (T/H)',e,.5)],reset:false}]))}}
   // F(X) with a percent input: the input is first turned into a percent of its own range, then the table of the workbook is read
   if(b.k==='FX'&&b.p&&b.p.tbl&&b.fxin&&b.fxin.k==='rng'&&b.i[0]!=null&&o!=null&&free(S,o)){const t=b.p.tbl,q=b.fxin,pts=t.p2||t.pts,cs=[];
    for(const pc of [25,50,80]){const y=interp(pts,pc);if(y==null)continue;const v=q.lo+(q.hi-q.lo)*pc/100;cs.push({l:'input '+fmt(v)+' '+(q.u||'')+' = '+pc+' % of its range '+q.lo+' ~ '+q.hi+' -> table '+b.p.ln+' at '+pc+' % = '+fmt(y),steps:[st1({[b.i[0]]:v},0)],rows:[R(o,'output (table '+b.p.ln+')',y,Math.max(.02,Math.abs(y)*.01))],reset:false})}
    if(cs.length)add('Curves F(X) (workbook tables)',item(b,'F(X) '+b.p.ln+' with % input',cs))}
   // average select circuit: an input at zero is a lost signal (SIG.AB): it is not averaged, the others are
   if(b.k==='SEL'&&b.i&&b.i.length>=2&&b.i.length<=6&&o!=null&&free(S,o)&&(!b.p||!b.p.mode||b.p.mode==='AVG')){
    const vs=b.i.map((n,j)=>j===0?0:10+7*j),rest=vs.slice(1),e=rest.reduce((a,c)=>a+c,0)/rest.length,f={};b.i.forEach((n,j)=>f[n]=vs[j]);
    add('Average select circuits',item(b,'Average select, one input lost',[{l:'first input = 0 (lost), the others '+rest.join(', ')+' -> the average of the healthy ones '+fmt(e),steps:[st1(f,0)],rows:[R(o,'average of the healthy inputs',e,Math.max(.05,Math.abs(e)*.002))],reset:false}]))}
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
   if(b.k==='MAN'&&b.p&&o!=null&&free(S,o)){const lo=b.p.lo!=null?b.p.lo:0,hi0=b.p.hi!=null?b.p.hi:100,hi=S.aoN&&S.aoN.has(o)?Math.min(hi0,100):hi0;let svI=-1;for(let j=0;j<(b.i||[]).length;j++){const dr=(S.drv[b.i[j]]||[]).find(x=>x.k==='AMT'&&x.sel>=0&&/B\s*\/\s*T/.test((x.txt||[]).join('/')));if(dr){svI=j;break}}if(svI<0&&b.i&&b.i[2]!=null&&b.i[2]>=0)svI=2;const fmD=svI>=0?(S.drv[b.i[svI]]||[]).find(x=>x.k==='AMT'):null;const fmx=fmD?{[fmD.id]:'B'}:{};const dn=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null);if(dn&&!(fmD&&fmD.id===dn.id))fmx[dn.id]=b.o.includes(dn.a)?'A':'B';
    add('Manual stations (MAN)',item(b,'Manual station '+((b.txt||[])[0]||''),[[lo+(hi-lo)*.3,lo+(hi-lo)*.3,'30 % of the range'],[hi+(hi-lo)*.2,hi,'above the high limit (clamped)']].map(([x,e,l])=>({l:'set '+fmt(x)+' ('+l+') -> output '+fmt(e),steps:[st1({},0,{fm:fmx}),st1({},2,{st:{[b.id]:{val:x}}})],skipTrk:b.id,rows:[R(o,'output',e,Math.max(.05,(hi-lo)*.005))]}))))}
   // totalizer
   if(b.k==='SUMA'&&b.i[0]!=null&&o!=null&&free(S,o)){add('Totalizers (SUMA)',item(b,'Totalizer',[{l:'input 36 for 100 s -> total 1.0 (36 per hour x 100 s)',steps:[st1({[b.i[0]]:36},100)],rows:[R(o,'total',1.0,0.03)]}]))}
   // controllers
   if((b.k==='PID')&&b.p&&o!=null){const tag=(b.txt||[])[1];if(!tag||/^X+-/.test(tag))continue;let q=null;try{q=AN.anPins(S,b)}catch(e){}if(!q||q.pv==null||q.pv<0||q.sv==null)continue;
    const P=b.p,rlo=P.rlo!=null?P.rlo:0,rhi=P.rhi!=null?P.rhi:100,span=rhi-rlo,mid=rlo+.5*span,hi=P.hi!=null?P.hi:100,lo=P.lo!=null?P.lo:0,rev=P.act<0;
    const amt0=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null),fmA=amt0?{fm:{[amt0.id]:b.o.includes(amt0.a)?'A':'B'}}:{};
    const lim=[lo,hi],d=b.vel?1e-4:Math.max(.01,(hi-lo)*.002),cs=[],tf=P.tf>0?P.tf:0,t1=Math.max(10,Math.ceil(6*tf)),t2=Math.max(20,Math.ceil(3*tf)),velN=b.vel?' (velocity form: the output is the change per step, only its sign is checked)':'';
    cs.push({l:'PV 20 % above the set point -> output '+(rev?'falls (reverse action)':'rises (direct action)')+velN,steps:[st1({[q.pv]:mid,[q.sv]:mid},t1,fmA),st1({[q.pv]:mid+.2*span,[q.sv]:mid},t2,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output',cmp:rev?'dec':'inc',d,lim}]});
    cs.push({l:'PV 20 % below the set point -> output '+(rev?'rises (reverse action)':'falls (direct action)')+velN,steps:[st1({[q.pv]:mid,[q.sv]:mid},t1,fmA),st1({[q.pv]:mid-.2*span,[q.sv]:mid},t2,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output',cmp:rev?'inc':'dec',d,lim}]});
    if(!b.vel)cs.push({l:'output is always inside its limits ('+fmt(lo)+' ~ '+fmt(hi)+')',steps:[st1({[q.pv]:rlo,[q.sv]:rhi},30,fmA)],skipTrk:b.id,rows:[{k:o,t:'controller output (PV at the bottom, set point at the top)',v:(lo+hi)/2,tol:(hi-lo)/2+0.01}]});
    const amt=S.blk.find(z=>(z.k==='AMT'||z.k==='SW')&&z.a!=null&&z.b!=null&&(b.o.includes(z.a)||b.o.includes(z.b))&&z.o[0]!=null);
    if(amt){const autoLeg=b.o.includes(amt.a)?'A':'B',manLeg=autoLeg==='A'?'B':'A',manNet=autoLeg==='A'?amt.b:amt.a;
     cs.push({l:'AUTO: the loop output goes through the A/M switch unchanged',steps:[st1({[q.pv]:mid,[q.sv]:mid},5,{fm:{[amt.id]:autoLeg}})],rows:[{k:amt.o[0],t:'output of the A/M switch',eqk:o,tol:0.1}]});
     if(S.ext.includes(manNet))cs.push({l:'MAN: manual value 37 -> output 37',steps:[st1({},4,{fm:{[amt.id]:manLeg},ext:{[manNet]:37}})],skipBu:amt.id,rows:[R(amt.o[0],'output of the A/M switch',37,0.1)]})}
    add('Controllers (PID)',item(b,'PID '+tag+(P.act<0?' (reverse)':' (direct)'),cs))}
  }
  const order=['Switches (T and A/M)','Operator selectors (COS)','Logic gates (AND / OR / NOT)','Flip-flops (S / R)','Comparators','Constants (value written in the box)','Alarms (ALM)','Valves and actuators (stroke)','Math: add / subtract / sum / deviation','Math: multiply / divide / abs','Ramps (rate limiters)','Average select circuits','Timers (TON / TOF / pulse)','Lag (first order)','Curves F(X) (workbook tables)','High / low selectors','Analog inputs (AI, transmitter range)','Analog outputs (AO, 0 ~ 100 %)','Manual stations (MAN)','Totalizers (SUMA)','Controllers (PID)'];
  return {groups:order.filter(g=>G[g]).map(g=>({g,items:G[g]}))}}
 return {sheetSpec}})();
