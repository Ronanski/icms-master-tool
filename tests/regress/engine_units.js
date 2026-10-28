// 3.2.0-beta.6 (user prompt 2026-10-22 "COMPREHENSIVE ENGINEERING AUDIT", sections 5 and 12): the engine functions one by one, with
// explicit inputs, expected outputs, boundaries and timing. The functions are the REAL ones of the built app (DITL simulate() and
// tmStep() of src/digital/parts, and the ABC blocks F(X) / DIV / HLLIM / FF through a real sheet with FORCE, as the user does it). The expected values are written here from the legends (DITL: AND / OR /
// NOT, flip-flop: reset wins, a circle on S = set wins (DITL PDF audit 2.5.0-beta.11 #3); ABC-000 legend), not read from the engine.
// Usage: node tests/regress/engine_units.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);
const R=await page.evaluate(()=>{
 const out=[];const ck=(ok,id,exp,act)=>out.push({ok:!!ok,id,exp:String(exp),act:String(act)});
 /* ---------- DITL gates: a small netlist per gate, inputs are source rows ---------- */
 const net=(gates,nIn)=>{const n=nIn+4;return {n,src:[...Array(nIn)].map((_,i)=>({n:i,row:i})),gates,outs:[]}};
 const run=(nl,on)=>{nl._v=null;return simulate(nl,new Set(on))};
 const bits=(k,m)=>[...Array(m)].map((_,i)=>(k>>i)&1);
 for(const [t,f] of [['AND',a=>a.every(x=>x)],['OR',a=>a.some(x=>x)]])for(const m of [2,3])for(let k=0;k<1<<m;k++){
  const b=bits(k,m),nl=net([{t,ins:[...Array(m).keys()],out:[m]}],m),v=run(nl,b.map((x,i)=>x?i:-1).filter(i=>i>=0));
  ck(+v[m]===+f(b),'DITL '+t+m+' in '+b.join(''),+f(b),+v[m])}
 for(const x of [0,1]){const nl=net([{t:'NOT',ins:[0],out:[1]}],1),v=run(nl,x?[0]:[]);ck(+v[1]===1-x,'DITL NOT in '+x,1-x,+v[1])}
 /* flip-flop: S = row 0, R = row 1; the state is kept between calls (latch) */
 for(const spri of [0,1]){const g={t:'FF',s:[0],r:[1],out:[2],q:0,spri};const nl=net([g],2);nl._v=null;
  const seq=[[[],0,'start'],[[0],1,'S=1'],[[],1,'S released: holds 1'],[[1],0,'R=1'],[[],0,'R released: holds 0'],[[0,1],spri?1:0,'S=1 and R=1: '+(spri?'set':'reset')+' wins']];
  for(const [on,exp,w] of seq){const v=simulate(nl,new Set(on));ck(+v[2]===exp,'DITL FF '+(spri?'(circle on S) ':'')+w,exp,+v[2])}}
 /* comparator: analog value on net 0, set point 5 */
 for(const [cmp,eq,x,exp] of [['>',0,5,0],['>',0,5.01,1],['>',1,5,1],['<',0,5,0],['<',0,4.99,1],['<',1,5,1]]){
  const nl={n:3,src:[],gates:[{t:'CMP',cmp,eq,sp:5,ins:[0],out:[1]}],outs:[],an:[{net:0,key:'k',def:0}],avk:{k:x}};nl._v=null;const v=simulate(nl,new Set());
  ck(+v[1]===exp,'DITL comparator '+cmp+(eq?'=':'')+' 5 with '+x,exp,+v[1])}
 /* DITL timers: tmStep(g, input, dt) with a 5 s / 2 s preset */
 const T=(k,sec)=>({k,tm:{nt:null,ut:null,fv:{v:sec,u:'SEC'}},st:{acc:0,out:0,pre:0,run:0}});
 {const g=T('on',5);let t=0,on=null;for(;t<10;t+=.25){tmStep(g,1,.25);if(g.st.out&&on==null)on=t+.25}ck(on===5,'DITL ON DELAY 5 s: output 1 at 5.00 s',5,on);
  tmStep(g,0,.25);ck(g.st.out===0,'DITL ON DELAY: input 0 = output 0 at once',0,g.st.out);
  const h=T('on',5);for(let i=0;i<12;i++)tmStep(h,1,.25);tmStep(h,0,.25);for(let i=0;i<12;i++)tmStep(h,1,.25);ck(h.st.out===0,'DITL ON DELAY: 3 s + gap + 3 s = still 0 (time restarts)',0,h.st.out)}
 {const g=T('off',5);tmStep(g,1,.25);ck(g.st.out===1,'DITL OFF DELAY: input 1 = output 1 at once',1,g.st.out);let t=0,off=null;for(;t<10;t+=.25){tmStep(g,0,.25);if(!g.st.out&&off==null)off=t+.25}ck(off===5,'DITL OFF DELAY 5 s: output 0 at 5.00 s',5,off)}
 /* PULSE: the same time base as the delays (the input changes at the start of a step, the output is read at its end): the output
    goes back to 0 exactly 2.00 s after the input edge; a new edge while the pulse runs does not lengthen it; the falling pulse the same */
 const fall=(g,seq)=>{let t=0,end=null,seen=0;for(const x of seq){tmStep(g,x,.25);t+=.25;if(g.st.out)seen=1;else if(seen&&end==null)end=t}return end};
 ck(fall(T('pulse',2),Array(40).fill(1))===2,'DITL PULSE 2 s on a held input: back to 0 at 2.00 s',2,fall(T('pulse',2),Array(40).fill(1)));
 {const seq=[1,0,1,0,1,0,1,0].concat(Array(20).fill(0));ck(fall(T('pulse',2),seq)===2,'DITL PULSE: new edges during the pulse do not lengthen it (0 at 2.00 s)',2,fall(T('pulse',2),seq))}
 {const f=T('npulse',2);for(let i=0;i<4;i++)tmStep(f,1,.25);ck(f.st.out===0,'DITL falling PULSE: 0 while the input is 1',0,f.st.out);ck(fall(f,Array(20).fill(0))===2,'DITL falling PULSE: back to 0 at 2.00 s after the input falls',2,fall(T('npulse',2),[1,1,1,1].concat(Array(20).fill(0)))-1)}
 /* ---------- ABC blocks on the real sheets, forced like the user does ---------- */
 const blocks=k=>{const r=[];for(const sh of AN.sheets){const S=AN.ensure(sh);for(const b of S.blk)if(b.k===k)r.push([sh,S,b])}return r};
 const clean=S=>{for(const b of S.procs||[])b.proc.on=false;S.rt.force={}};
 const stepN=(sh,n,dt)=>{for(let i=0;i<n;i++)AN.stepSet(sh,dt||.25)};
 /* F(X): every block whose input is the table X directly (no unit conversion before it): each point, the middle of each segment
    (straight line), below the first point and above the last (the end values: the curve is not extended) */
 {const L=blocks('FX').filter(([,,b])=>!b.fxin&&b.i&&b.i.length===1&&b.o&&b.o.length);let n=0,bad=[];
  for(const [sh,S,b] of L){const t=(AN.ln||{})[b.p.ln]||(b.p.tbl&&(b.p.tbl.p2||b.p.tbl.pts));if(!t||t.length<2)continue;n++;clean(S);const F=S.rt.force;
   /* a vertical step in the table (two points with the same X, e.g. LN44 -1 -> 1 / 0) has two values at that X: checked just beside it */
   const dup=x=>t.filter(q=>q[0]===x).length>1;const cs=[];t.forEach((q,i)=>{if(!dup(q[0]))cs.push([q[0],q[1]]);if(i&&t[i-1][0]!==q[0])cs.push([(q[0]+t[i-1][0])/2,(q[1]+t[i-1][1])/2])});
   const sp=Math.abs(t[t.length-1][0]-t[0][0])||1;cs.push([t[0][0]-sp*.2,t[0][1]],[t[t.length-1][0]+sp*.2,t[t.length-1][1]]);
   for(const [x,y] of cs){F[b.i[0]]=x;stepN(sh,1);const v=S.rt.v[b.o[0]];if(Math.abs(v-y)>1e-6*Math.max(1,Math.abs(y))){bad.push(sh.name+' '+(b.p.ln||b.tag||b.id)+' x '+x+' want '+y+' got '+v);break}}clean(S)}
  ck(n&&!bad.length,'ABC F(X) ('+n+' blocks): every table point, every segment middle, below the first and above the last point','table values',bad.length?bad.length+' wrong: '+bad.slice(0,3).join('; '):'table values')}
 {const L=blocks('DIV').filter(([,,b])=>b.nu>=0&&b.de>=0&&b.o&&b.o.length);let bad=[];for(const [sh,S,b] of L.slice(0,40)){clean(S);const F=S.rt.force;F[b.nu]=50;F[b.de]=2;stepN(sh,2);const g=S.rt.v[b.o[0]];F[b.de]=0;stepN(sh,2);const z=S.rt.v[b.o[0]];if(!isFinite(z)||Math.abs(z-g)>1e-6)bad.push(sh.name+'#'+b.id+' '+g+'->'+z);clean(S)}
  ck(L.length&&!bad.length,'ABC DIV by zero ('+Math.min(40,L.length)+' blocks): output holds the last good value, never Inf / NaN','hold',bad.length?bad.slice(0,3).join('; '):'hold')}
 {const L=blocks('HLLIM').filter(([,,b])=>b.main>=0&&b.hi>=0&&b.lo>=0&&b.o&&b.o.length);let bad=[];for(const [sh,S,b] of L){clean(S);const F=S.rt.force;F[b.hi]=80;F[b.lo]=20;
   for(const [x,y] of [[50,50],[95,80],[5,20],[80,80],[20,20]]){F[b.main]=x;stepN(sh,2);const v=S.rt.v[b.o[0]];if(Math.abs(v-y)>1e-6)bad.push(sh.name+'#'+b.id+' '+x+'->'+v)}clean(S)}
  ck(L.length&&!bad.length,'ABC H / L limiter ('+L.length+' blocks), H 80 L 20: 50->50, 95->80, 5->20, boundaries kept','clamped',bad.length?bad.slice(0,3).join('; '):'clamped')}
 {const L=blocks('FF').filter(([,,b])=>b.S>=0&&b.Rn>=0&&b.o&&b.o.length);let bad=[];for(const [sh,S,b] of L){clean(S);S.rt.st[b.id].q=0;const F=S.rt.force;const seq=[[1,0,1],[0,0,1],[0,1,0],[0,0,0],[1,1,0]];
   for(const [s,r,y] of seq){F[b.S]=s;F[b.Rn]=r;stepN(sh,1);const v=S.rt.v[b.o[0]];if(+(v>.5)!==y){bad.push(sh.name+'#'+b.id+' S'+s+'R'+r+'='+v);break}}clean(S)}
  ck(L.length&&!bad.length,'ABC flip-flop ('+L.length+' blocks): set, hold, reset, hold, S and R = reset wins (legend ABC-000)','1 1 0 0 0',bad.length?bad.slice(0,3).join('; '):'1 1 0 0 0')}
 return out});
let f=0;for(const r of R){console.log((r.ok?'PASS ':'FAIL ')+r.id+' | expected '+r.exp+' | actual '+r.act);if(!r.ok)f++}
console.log(errs.length?'PAGE ERRORS '+errs.join(' | '):'no page error');
console.log(f||errs.length?'FAILED '+f:'ALL PASS ('+R.length+' checks)');await browser.close();process.exit(f||errs.length?1:0)})();
