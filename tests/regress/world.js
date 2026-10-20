// One world ABC + DITL (1.22.0, src/world/world.js): the references written on the drawings join the sheets.
// Checks: (1) OFF = the FROM DITL inputs of the ABC are free inputs (old behaviour); (2) ON: every reference is found;
// (3) every ABC "FROM DITL" input equals the DITL output it names; (4) every DITL input row fed by the ABC ("TO DITL") follows the ABC net;
// (5) a real chain: a manual DITL input changes a DITL output and the ABC input that reads it; (6) speed; (7) OFF again restores free inputs.
// Usage: node tests/regress/world.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const wait=ms=>page.waitForTimeout(ms);
ck(await page.evaluate(()=>!WORLD.on&&!WORLD.live),'default OFF');
const free0=await page.evaluate(()=>{let n=0,x=0;for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;const A=AN.ensure(sh);for(const [k] of AN.dsIdx(sh).from){n++;if(A.xlk&&A.xlk[k]&&A.xlk[k].ditl)x++}}return {n,x}});
ck(free0.x===0,'OFF: '+free0.n+' FROM DITL inputs, none is driven by the DITL');
const st=await page.evaluate(()=>{WORLD.set(true);return Object.assign({},WORLD.stat,{lost:WORLD.stat.lost.slice(0,20)})});
/* 2.3.0-beta.1: ABC-017 I.024E "FROM DITL 80S-57 FOR S/B LOGIC" is the sootblower PLC (not in the app): counted in st.plc */
ck(st.fromDitl+st.logic.length+(st.plc||[]).length>=131&&st.toDitl>=86&&st.ditlDitl>=1400&&st.inst>=70,'ON: '+st.fromDitl+' FROM DITL inputs (+'+st.logic.length+' by logic), '+st.toDitl+' TO DITL ('+st.digFix.length+' by an analog wire: the comparator output next to it), '+st.ditlDitl+' DITL -> DITL with '+st.inst+' machine instances B / C / D (machine found by address '+st.byAddr+', by letter '+st.byLetter+', by sister sheet '+st.bySister+'), built in '+st.ms+' ms');
console.log('INFO FROM DITL text on a net that the ABC logic computes (the logic stays, '+st.logic.length+'): '+st.logic.join(' | '));
ck(st.lost.length===0,'every reference has its partner'+(st.lost.length?': '+st.lost.join(' | '):''));
await page.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-007'));AN.run=true});await wait(1500);
ck(await page.evaluate(()=>WORLD.live),'runs with the ABC Run');
const inv=await page.evaluate(()=>{const {ain,din}=WORLD.idx;let a=0,al=0,abad=[];
 const dsrc=(A,n,d)=>{/* an input that another ABC sheet drives through a tag link: that sheet must get it from the DITL */const l=A.xlk&&A.xlk[n];if(!l||l.ditl||!l.from||!l.from.S||d>6)return l&&l.ditl;const FS=l.from.S;return l.fromNets.some(m=>dsrc(FS,m,d+1))};
 for(const q of ain){const A=q.sh.S;if(!A)continue;a++;const want=WORLD.out[q.d.name]&&WORLD.out[q.d.name].has(q.row)?1:0;const l=A.xlk&&A.xlk[q.n];
  /* the ABC link of the drawing wins: the world never overrides a net that ABC logic on another sheet drives */
  if(l&&!l.ditl){al++;if(!dsrc(A,q.n,0))(WORLD._conf=WORLD._conf||[]).push(q.sh.name+' '+AN.nm(A,q.n)+' ('+q.ref+') <- '+(l.from&&l.from.name));continue}
  if(A.rt.ext[q.n]!==want||!(l&&l.ditl))abad.push(q.sh.name+' '+AN.nm(A,q.n)+' ext '+A.rt.ext[q.n]+' want '+want)}
 let t=0,tbad=[];din.forEach((m,s)=>m.forEach((srcs,row)=>{if(srcs.length!==1||srcs[0].k!=='a')return;const q=srcs[0];if(!q.sh.S)return;t++;const want=q.sh.S.rt.v[q.n]>0.5;const got=!!(s._win&&s._win.has(row));if(want!==got)tbad.push(s.name+' row '+row+' want '+want)}));return {a,al,abad:abad.slice(0,8),t,tbad:tbad.slice(0,8),conf:WORLD._conf||[]}});
console.log('INFO the ABC link wins over the FROM DITL text ('+inv.conf.length+', to check against the PDF in the audit of the sheet): '+inv.conf.join(' | '));
ck(inv.abad.length===0,'DITL -> ABC: '+inv.a+' ABC inputs equal their DITL output ('+inv.al+' of them come through a tag link from the ABC sheet that reads the DITL)'+(inv.abad.length?': '+inv.abad.join(' | '):''));
ck(inv.tbad.length===0,'ABC -> DITL: '+inv.t+' DITL input rows equal their ABC net'+(inv.tbad.length?': '+inv.tbad.join(' | '):''));
// a chain from a manual DITL input to an ABC input
const ch=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const {ain,din}=WORLD.idx;
 for(const q of ain){const d=q.d,A=q.sh.S;if(!A||q.sh!==AN.sheets[AN.i]&&!AN.worldSheets.length)continue;const m=din.get(d)||new Map();
  for(let i=0;i<d.rows.length;i++){if(m.has(i)||!(d.cells[i+':S']))continue;if(!d.nl.src.some(z=>z.row===i))continue;
   const before=WORLD.out[d.name].has(q.row),e0=A.rt.ext[q.n];d.sig[i+':S']=!d.sig[i+':S'];await sleep(900);
   const after=WORLD.out[d.name].has(q.row),e1=A.rt.ext[q.n];d.sig[i+':S']=!d.sig[i+':S'];
   if(after!==before){await sleep(900);return {sheet:d.name,row:i,txt:d.cells[i+':S'].map(x=>x.t).join(' '),out:q.row,abc:q.sh.name+' '+AN.nm(A,q.n),before,after,e0,e1,back:A.rt.ext[q.n],outBack:WORLD.out[d.name].has(q.row)?1:0}}}}return null});
ck(!!ch&&ch.e0===(ch.before?1:0)&&ch.e1===(ch.after?1:0)&&ch.back===ch.outBack,ch?'chain: '+ch.sheet+' input "'+ch.txt+'" -> output row '+ch.out+' '+(ch.before?1:0)+'->'+(ch.after?1:0)+' -> '+ch.abc+' '+ch.e0+'->'+ch.e1+'; input released: DITL output '+ch.outBack+', ABC '+ch.back+' (latched logic stays)':'no chain found');
const ms=await page.evaluate(()=>WORLD.ms);ck(ms<25,'one scan of the whole world: '+ms.toFixed(1)+' ms (every 200 ms)');
const off=await page.evaluate(()=>{WORLD.set(false);let x=0;for(const sh of AN.sheets){const A=sh.S;if(A&&A.xlk)for(const k in A.xlk)if(A.xlk[k]&&A.xlk[k].ditl)x++}return {x,live:WORLD.live,win:S.sheets.filter(s=>s._win).length}});
ck(off.x===0&&off.win===0,'OFF again: no ABC input driven by the DITL, no DITL row driven by the world');
ck(errs.length===0,'no page error'+(errs.length?' ('+errs[0]+')':''));
await page.evaluate(()=>{try{localStorage.setItem('ls-world','0')}catch(e){}});
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
