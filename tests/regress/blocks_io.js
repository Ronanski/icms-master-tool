// 2.5.0-beta.9 (user 2026-10-20: "lahat ng logic blocks kung sumusunod sila, tama ang nilalabas na output from input to output.
// Pati forcing / simulation sa plant model on / off, dapat maayos."):
// EVERY calculation / logic block of EVERY ABC sheet, black box, through the real wiring of the sheet: the user forces the input nets
// (FORCE, as in the app), the sheet runs (stepSet, all linked sheets, like the app), and the value on the output net is compared with the
// function of the block written here from the legend (ABC-000 / textbook), not from the engine:
//   ADD / SUB / DEV = sum of the signed (scaled) inputs, MUL, DIV, ABS, SQRT (identity, decision V-18), HS = max, LS = min, H / L limiter,
//   AVERAGE SELECT, F(X) = the linear curve, comparators (> / < / >= / <=, set point or a second signal), PV < SV, NOT, AND, OR,
//   FF (reset wins), ON delay, OFF delay, one shot (TPs / TPV), first order lag (63 % at T), rate limit, conditional write, actuator stroke.
// Each block gets several input sets (logic: the whole truth table up to 3 inputs). Run twice: PLANT MODEL OFF, and PLANT MODEL ON at
// 150 MW (the force must win over the plant). Not here (own tests): PID / PIDV (pid_auto, pid_am), A/M and switches (switches, force_manual),
// MAN station (manstation, faceplate), AI / transmitters, totalizers, pulse output, field / alarm boxes.
// Usage: node tests/regress/blocks_io.js [html] [--sheets=ABC-010,...] [--plant=off|on|both]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const ONLY=(process.argv.find(a=>/^--sheets=/.test(a))||'').slice(9).split(',').filter(Boolean);
const PL=((process.argv.find(a=>/^--plant=/.test(a))||'').slice(8)||'both');
(async()=>{const {browser,page,errs}=await open(html);
const all=[];
for(const plant of PL==='both'?['off','on']:[PL]){
 const names=await page.evaluate(()=>AN.sheets.filter(s=>!/ABC-000/.test(s.name)).map(s=>s.name));
 for(const name of names){if(ONLY.length&&!ONLY.includes(name))continue;
  const r=await page.evaluate(([name,plant])=>{
   const sh=AN.sheets.find(s=>s.name===name);let S;try{S=AN.ensure(sh)}catch(e){return {name,err:'sheet not built: '+e.message}}
   const procs=on=>{for(const x of AN.sheets)if(x.S)for(const b of x.S.procs||[])b.proc.on=on};
   AN.reset();if(plant==='on'){AN.plantLoad150();for(let i=0;i<4;i++)AN.stepSet(sh,.5)}else{procs(false);for(let i=0;i<4;i++)AN.stepSet(sh,.5)}
   if(plant==='off')procs(false);
   const v=S.rt.v,F=S.rt.force,B=x=>x>.5?1:0,near=(a,b,t)=>Math.abs(a-b)<=(t!=null?t:Math.max(1e-6,Math.abs(b)*1e-6));
   const step=(k,dt)=>{for(let i=0;i<(k||1);i++)AN.stepSet(sh,dt==null?0:dt)};
   const drvOf=n=>(S.drv[n]||[]);
   const res={name,plant,tested:0,checks:0,bad:[],skip:{},byKind:{}};
   const skip=(k,why,b)=>{res.skip[why]=(res.skip[why]||0)+1;if(b&&why!=='own test'){res.skipL=res.skipL||[];res.skipL.push(why+': '+k+'#'+b.id+' '+(b.txt||[]).filter(Boolean).slice(0,2).join(' '))}};
   // the output nets that the function of the block alone decides (a net with 2 drivers = wired max; a preset overrides)
   const outs=b=>(b.o||[]).filter(n=>n!=null&&n>=0&&!(S.multi&&S.multi[n])&&!(S.pre&&S.pre[n]));
   const clampAO=(n,x)=>S.aoN&&S.aoN.has(n)?Math.max(0,Math.min(100,x)):x;
   const COMB={ADD:1,SUM:1,DEV:1,SUB:1,MUL:1,DIV:1,HLLIM:1,ABS:1,SQRT:1,HS:1,LLIM:1,LS:1,HLIM:1,SEL:1,FX:1,HC:1,LC:1,HLC:1,CMPK:1,DCMP:1,PVSV:1,NOT:1,AND:1,OR:1,TP:1};
   const TIMED={FF:1,TON:1,TOF:1,TPS:1,TPV:1,LAG:1,RATE:1,RAMPB:1,CTK:1,ACT:1,VLV:1};
   const insOf=b=>{switch(b.k){
     case 'ADD':case 'SUM':case 'DEV':case 'SUB':return (b.ip||[]).map(q=>q.n);
     case 'DIV':return [b.nu,b.de];case 'HLLIM':return [b.main,b.lo,b.hi].filter(n=>n>=0);
     case 'HS':case 'LLIM':case 'LS':case 'HLIM':return b.cmp?[b.cmpA,b.cmpB]:b.i;
     case 'HC':case 'LC':case 'HLC':case 'CMPK':return [b.i[0]].concat(b.p.ref>=0?[b.p.ref]:[]);
     case 'PVSV':return [b.pv,b.sv];case 'FF':return [b.S,b.Rn];
     case 'TPV':return [b.sg,b.xin].filter(n=>n>=0);case 'TP':return [b.tpd,b.tpt].filter(n=>n>=0);
     case 'RATE':case 'RAMPB':return b.main!==undefined?[b.main].concat([b.byp,b.up,b.dn,b.tpar].filter(n=>n!=null&&n>=0)):[b.i[0]];
     case 'CTK':return [b.ctl,b.cin];
     default:return b.i||[]}};
   const cand=S.blk.filter(b=>(COMB[b.k]||TIMED[b.k])&&outs(b).length);
   for(const b of S.blk)if(!(COMB[b.k]||TIMED[b.k])||!outs(b).length)skip(b.k,(COMB[b.k]||TIMED[b.k])?'output shared or preset':'own test',b);
   // batches: no block forces the output of another block of the same batch, and the input nets are not shared with another block's output
   const batches=[];
   for(const b of cand){const ins=insOf(b).filter(n=>n!=null&&n>=0),o=outs(b);
    if(!ins.length||ins.some(n=>o.includes(n))){skip(b.k,'no input / input = own output',b);continue}
    let put=false;for(const g of batches){if(g.some(x=>x.ins.some(n=>o.includes(n))||ins.some(n=>x.o.includes(n))||ins.some(n=>x.ins.includes(n))))continue;g.push({b,ins,o});put=true;break}
    if(!put)batches.push([{b,ins,o}])}
   const bad=(b,what,exp,got)=>res.bad.push({blk:b.k+'#'+b.id,tag:(b.txt||[]).filter(Boolean).slice(0,2).join(' '),what,exp:typeof exp==='number'?+exp.toFixed(4):exp,got:typeof got==='number'?+(+got).toFixed(4):got});
   const chk=(b,o,exp,what,tol)=>{res.checks++;res.byKind[b.k]=(res.byKind[b.k]||0)+1;const n=o[0];const e=clampAO(n,exp),g=v[n];if(!(near(g,e,tol)))bad(b,what,e,g)};
   const fx=(P,x)=>{const t=(AN.ln||{})[P.ln]||(P.tbl&&(P.tbl.p2||P.tbl.pts));if(!t||!t.length)return x;if(x<=t[0][0])return t[0][1];for(let i=1;i<t.length;i++)if(x<=t[i][0]){const a=t[i-1],c=t[i];return a[1]+(c[1]-a[1])*(x-a[0])/((c[0]-a[0])||1)}return t[t.length-1][1]};
   const forceOK=(b,ins,vals)=>{for(let i=0;i<ins.length;i++)if(!near(v[ins[i]],vals[i],1e-6)){skip(b.k,'input net cannot be forced',{id:b.id,txt:[(b.txt||[])[0],'net '+ins[i]+' '+String(AN.nm(S,ins[i])||'').trim()+' drv '+drvOf(ins[i]).map(d=>d.k).join('/')+' ext '+S.ext.includes(ins[i])]});return false}return true};
   // ---------- combinational blocks: vectors ----------
   const VEC={
    an:[[12.5,40,3,77],[63.2,8.5,51,20],[-7.5,95,30,4.4],[150,2.5,0.75,61]],
    dig:k=>{const L=[];for(let m=0;m<Math.min(8,1<<k);m++)L.push([...Array(k)].map((_,j)=>(m>>j)&1));return L}};
   const KN=n=>S.kn&&S.kn[n]!==undefined?+S.kn[n]:null;/* a constant written on the drawing (X = 3 %): a parameter, not a user input */
   const vecFor=(b,ins,j)=>{const x=vecFor0(b,ins,j);return x.map((q,i)=>KN(ins[i])!=null?KN(ins[i]):q)};
   const vecFor0=(b,ins,j)=>{const d=['NOT','AND','OR'].includes(b.k);
    if(d){const T=VEC.dig(ins.length);return T[j%T.length]}
    if(['HC','LC','HLC','CMPK'].includes(b.k)){const sp=b.p.ref>=0?(KN(b.p.ref)!=null?KN(b.p.ref):40):b.p.sp;const dx=Math.max(.05,Math.abs(sp)*.05);const xs=[sp+dx,sp-dx,sp,sp+2*dx];return [xs[j%4]].concat(b.p.ref>=0?[sp]:[])}
    if(b.k==='DCMP'){const sps=b.dc.map(d=>d.neg?-d.sp:d.sp);const c=sps[j%sps.length]||0;const dx=Math.max(.5,Math.abs(c)*.05);return [[c+dx,c-dx,c,c+2*dx][j%4]]}
    if(b.k==='SQRT')return [Math.abs(VEC.an[j%4][0])];
    if(b.k==='DIV'){const a=VEC.an[j%4];return [a[0],a[1]||1]}
    if(b.k==='SEL')return ins.map((_,i)=>Math.abs(VEC.an[j%4][i%4])+1);
    if(b.k==='HLLIM'){const a=[[50,20,80],[10,20,80],[95,20,80],[20,20,80]][j%4];const r=[a[0]];if(b.lo>=0)r.push(a[1]);if(b.hi>=0)r.push(a[2]);return r}
    if(b.k==='TP')return [VEC.an[j%4][0],VEC.an[j%4][1]];
    return ins.map((_,i)=>VEC.an[j%4][i%4])};
   const expect=(b,ins,x)=>{const P=b.p||{},m=new Map(ins.map((n,i)=>[n,x[i]])),r=n=>n>=0?m.get(n):0;
    switch(b.k){
     case 'ADD':case 'SUM':case 'DEV':case 'SUB':return (b.ip||[]).reduce((s,q)=>{let y=r(q.n);if(q.ia)y=y*q.ia[0]+q.ia[1];return s+q.sg*y},0);
     case 'MUL':{if(!b.i.length)return 0;let y=1;b.i.forEach((n,j)=>{y*=r(n)/(((b.nrm&&b.nrm[j])||1)*((b.scn&&b.scn[j])||1))});return b.gain!=null?y*b.gain:y}
     case 'DIV':{let y=r(b.nu)/r(b.de);if(b.oa)y=y*b.oa[0]+b.oa[1];return y}
     case 'HLLIM':{let y=r(b.main);if(b.lo>=0)y=Math.max(y,r(b.lo));if(b.hi>=0)y=Math.min(y,r(b.hi));return y}
     case 'ABS':return Math.abs(r(b.i[0]));
     case 'SQRT':{const R=b.rin||100,y=r(b.i[0]);return b.idn?y:R*Math.sqrt(y/R)}
     case 'HS':case 'LLIM':return b.cmp?(r(b.cmpA)>r(b.cmpB)?1:0):Math.max(...b.i.map(r));
     case 'LS':case 'HLIM':return b.cmp?(r(b.cmpA)<r(b.cmpB)?1:0):Math.min(...b.i.map(r));
     case 'SEL':{const xs=b.i.map(r),md=P.mode||'AVG',ki=md!=='AVG'&&b.mi?b.mi[md]:null;return ki!=null?xs[ki]:xs.reduce((a,c)=>a+c,0)/xs.length}
     case 'FX':{let y=r(b.i[0]);const q=b.fxin;if(q){if(q.k==='ratio')y*=100;else if(q.k==='rng')y=(y-q.lo)/(q.hi-q.lo)*100}return fx(P,y)}
     case 'HC':case 'LC':case 'HLC':case 'CMPK':{const y=r(b.i[0]),sp=P.ref>=0?r(P.ref):P.sp;return P.op==='>'?((P.inc?y>=sp:y>sp)?1:0):((P.inc?y<=sp:y<sp)?1:0)}
     case 'PVSV':return r(b.pv)<r(b.sv)?1:0;
     case 'NOT':return B(r(b.i[0]))?0:1;
     case 'AND':return b.i.length&&b.i.every(n=>B(r(n)))?1:0;
     case 'OR':return b.i.some(n=>B(r(n)))?1:0;
     case 'TP':{const dp=r(b.tpd),tt=b.tpt>=0?r(b.tpt):null;return P.tref!=null&&tt!=null?dp/((tt+273.15)/(P.tref+273.15)):dp}
    }};
   for(const g of batches){
    const comb=g.filter(x=>COMB[x.b.k]);if(!comb.length)continue;
    for(let j=0;j<8;j++){
     const vs=comb.map(x=>vecFor(x.b,x.ins,j));comb.forEach((x,i)=>x.ins.forEach((n,k)=>{if(KN(n)==null)F[n]=vs[i][k]}));step(2,0);
     comb.forEach((x,i)=>{if(!forceOK(x.b,x.ins,vs[i]))return;
      if(x.b.k==='DCMP'){const y0=vs[i][0];x.b.dc.forEach(d=>{const y=d.neg?-y0:y0,e=(d.op==='>'?(d.inc?y>=d.sp:y>d.sp):(d.inc?y<=d.sp:y<d.sp))?1:0;res.checks++;res.byKind.DCMP=(res.byKind.DCMP||0)+1;if(v[d.n]!==e&&!(S.multi&&S.multi[d.n]))bad(x.b,'in '+y0+' '+d.op+(d.inc?'=':'')+' '+d.sp,e,v[d.n])});return}
      chk(x.b,x.o,expect(x.b,x.ins,vs[i]),'inputs '+vs[i].map(q=>+(+q).toFixed(3)).join(', '),Math.max(1e-6,Math.abs(expect(x.b,x.ins,vs[i]))*1e-6))});
     comb.forEach(x=>x.ins.forEach(n=>delete F[n]))}
    comb.forEach(x=>res.tested++)}
   // ---------- blocks with time / memory ----------
   const timed=cand.filter(b=>TIMED[b.k]);
   for(const b of timed){const ins=insOf(b).filter(n=>n!=null&&n>=0),o=outs(b);if(!ins.length||ins.some(n=>o.includes(n)))continue;
    const P=b.p||{},set=(n,x)=>{if(n!=null&&n>=0)F[n]=x},clr=()=>ins.forEach(n=>delete F[n]);let ok=true;
    const C=(e,what,tol)=>{res.checks++;res.byKind[b.k]=(res.byKind[b.k]||0)+1;const g=v[o[0]];if(!near(g,clampAO(o[0],e),tol==null?1e-6:tol)){bad(b,what,clampAO(o[0],e),g);ok=false}};
    if(b.k==='FF'){set(b.S,0);set(b.Rn,1);step(2);C(0,'R=1: Q=0');set(b.Rn,0);step(1);C(0,'S=0 R=0: holds 0');set(b.S,1);step(1);C(1,'S=1: Q=1');set(b.S,0);step(1);C(1,'S=0 R=0: holds 1');set(b.S,1);set(b.Rn,1);step(1);C(0,'S=1 R=1: reset wins')}
    else if(b.k==='TON'&&P.sec>0){const T=P.sec,d=Math.min(1,T/10);set(b.i[0],0);step(2,d);C(0,'input 0: out 0');set(b.i[0],1);step(Math.max(1,Math.floor(T/d)-1),d);C(0,'input 1 for less than '+T+' s: out 0');step(3,d);C(1,'input 1 for '+T+' s: out 1');set(b.i[0],0);step(1,d);C(0,'input back to 0: out 0 at once')}
    else if(b.k==='TOF'&&P.sec>0){const T=P.sec,d=Math.min(1,T/10);set(b.i[0],1);step(2,d);C(1,'input 1: out 1');set(b.i[0],0);step(Math.max(1,Math.floor(T/d)-1),d);C(1,'input 0 for less than '+T+' s: out stays 1');step(3,d);C(0,'input 0 for '+T+' s: out 0')}
    else if(b.k==='TPS'&&P.sec>0){const T=P.sec,d=Math.min(1,T/10);set(b.i[0],0);step(Math.ceil(T/d)+3,d);C(0,'no edge: out 0');set(b.i[0],1);step(2,d);C(1,'rising edge: pulse starts');step(Math.max(1,Math.floor(T/d)-3),d);C(1,'pulse lasts '+T+' s');step(4,d);C(0,'after '+T+' s: out 0 although the input stays 1')}
    else if(b.k==='TPV'&&b.sg>=0&&b.xin>=0){const T=10,d=1;set(b.xin,T);set(b.sg,0);step(T+3,d);C(0,'no edge: out 0');set(b.sg,1);step(1,d);C(1,'rising edge: pulse starts');step(T-2,d);C(1,'pulse lasts the time input '+T+' s');step(4,d);C(0,'after '+T+' s: out 0')}
    else if(b.k==='LAG'&&P.tau>0){const T=P.tau,d=T/50;set(b.i[0],0);step(Math.ceil(10*T/d)>3000?3000:Math.ceil(10*T/d),d);set(b.i[0],100);step(50,d);C(63.2,'step 0 -> 100: 63.2 at T = '+T+' s',1.5)}
    else if((b.k==='RATE'||b.k==='RAMPB')&&b.main!==undefined&&!(b.up!==undefined&&b.dn===undefined)){
     const d=1;if(b.byp>=0)set(b.byp,0);let rate=P.rate;
     if(b.tpar!==undefined&&b.tpar>=0){set(b.tpar,10);rate=b.span/(10*.036)}
     if(b.up!==undefined){set(b.up,.5);set(b.dn,.5);rate=.5}
     if(!(rate>0)){skip(b.k,'ramp rate 0 = no limit (drawing has no value)',b);clr();continue}
     set(b.main,v[b.main]);step(2,d);const y0=v[o[0]];set(b.main,y0+rate*30);step(10,d);C(y0+rate*10,'ramp '+(+rate.toPrecision(3))+' /s ('+(P.rtxt||'')+'): +10 s',Math.max(1e-6,rate*.02));
     set(b.main,y0-rate*30);step(5,d);C(y0+rate*5,'ramp down: -5 s',Math.max(1e-6,rate*.02));
     if(b.byp>=0){set(b.byp,1);step(2,d);C(y0-rate*30,'bypass (.LOC / bumpless) = 1: follows the input at once',Math.max(1e-6,rate*.02))}}
    else if((b.k==='RATE'||b.k==='RAMPB')&&b.main===undefined&&P.rate>0){const d=1;set(b.i[0],0);step(Math.ceil(200/P.rate)+5,d);const y0=v[o[0]];set(b.i[0],y0+P.rate*20);step(10,d);C(y0+P.rate*10,'ramp '+P.rate+' /s: after 10 s',Math.max(1e-3,P.rate*1e-3))}
    else if(b.k==='CTK'){set(b.ctl,1);set(b.cin,42.5);step(2);C(42.5,'write ON: out = input');set(b.cin,7);set(b.ctl,0);step(2);C(42.5,'write OFF: last value stays')}
    else if((b.k==='ACT'||b.k==='VLV')&&P.stroke>0&&!(S.nets[b.i[0]]&&S.nets[b.i[0]].dig)){const T=P.stroke,d=T/20;set(b.i[0],0);step(Math.ceil(1.2*T/d)+2,d);set(b.i[0],100);step(10,d);C(50,'0 -> 100 %: half way at T/2 = '+(T/2)+' s',1);step(12,d);C(100,'full stroke after '+T+' s',1e-6)}
    else{skip(b.k,'no time parameter on the drawing',b);clr();continue}
    clr();res.tested++}
   for(const k in F)delete F[k];
   if(plant==='off')procs(true);
   return res},[name,plant]);
  all.push(r);
  if(r.err){console.log('ERR ',plant,name,r.err);continue}
  if(process.argv.includes('--skips'))for(const x of r.skipL||[])console.log('SKIP',plant,name,x);
  for(const x of r.bad.slice(0,6))console.log('FAIL',plant,name,x.blk,x.tag,'|',x.what,'| expected',x.exp,'got',x.got);
  if(r.bad.length>6)console.log('FAIL',plant,name,'... '+(r.bad.length-6)+' more');
 }}
const sum={};for(const r of all){if(r.err)continue;const k=r.plant;sum[k]=sum[k]||{sheets:0,blocks:0,checks:0,bad:0,skip:{},kinds:{}};const s=sum[k];s.sheets++;s.blocks+=r.tested;s.checks+=r.checks;s.bad+=r.bad.length;for(const q in r.skip)s.skip[q]=(s.skip[q]||0)+r.skip[q];for(const q in r.byKind)s.kinds[q]=(s.kinds[q]||0)+r.byKind[q]}
for(const k in sum)console.log('PLANT '+k.toUpperCase()+':',JSON.stringify(sum[k]));
fs.writeFileSync(process.env.BLOCKS_OUT||'/tmp/blocks_io.json',JSON.stringify(all));
console.log(errs.length?'page errors: '+errs.slice(0,3).join(' | '):'no page error');
await browser.close();process.exit(Object.values(sum).some(s=>s.bad)?1:0)})();
