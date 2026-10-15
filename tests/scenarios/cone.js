// INPUT -> OUTPUT coverage (automatic, bawat sheet): bawat external input ay binabago (digital 0/1, analog mababa / gitna / mataas) sa ilang panimulang kondisyon,
// at tinitingnan kung aling net ang gumagalaw. Inihahambing sa istruktura ng drawing (cone: aling net ang naaabot ng input sa pamamagitan ng mga block).
//  - gumalaw ang net na HINDI naaabot ng input = bug ng engine (o maling pagkakabit)
//  - input na walang naaapektuhan kahit saan = "patay na input" (Needs Verification: kontinuidad ng signal o gated ng drawing)
//  - output (sink / AO / controller output) na walang input na nakakaapekto = "patay na output"
// Usage: node tests/scenarios/cone.js [html] [sheet ...]
const fs=require('fs');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));
(async()=>{const {browser,page,errs}=await open(html);
const names=await page.evaluate(()=>AN.sheets.map(s=>s.name).filter(n=>!/^ABC-000/.test(n)));let bad=0,deadIn=0,deadOut=0,tin=0,tout=0;
for(const nm of names.filter(x=>!want.length||want.includes(x))){
 const R=await page.evaluate(async(nm)=>{const sh=AN.sheets.find(s=>s.name===nm);const idx=AN.sheets.indexOf(sh);AN.go(idx);AN.reset();AN.go(idx);const S=sh.S;AN.run=false;
  for(const b of S.procs||[])if(b.proc)b.proc.on=false;
  const lab=n=>S.lab[n]&&S.lab[n].t||('n'+n);
  /* structural cone */
  const fwd=new Map();const addE=(a,b)=>{if(a<0||b<0)return;(fwd.get(a)||fwd.set(a,new Set()).get(a)).add(b)};
  for(const b of S.blk.concat(S.ord||[]))for(const i of b.i||[])for(const o of b.o||[])addE(i,o);
  /* mga nakatagong ugnayan ng modelo: ang AI na may feedback ng actuator (positioner) ay sumusunod sa input ng actuator; ang PID / MAN sa itaas ng A/M switch ay sumusunod (tracking) sa B leg at sa output nito */
  for(const b of S.blk){if(b.k==='AI'&&b.fb){const a=S.blk.find(x=>x.id===b.fb.id);if(a)for(const i of a.i||[])for(const o of b.o||[])addE(i,o)}if((b.k==='AMT'||b.k==='SW')){for(const d of b.trkFrom||[])for(const o of d.o||[]){for(const i of [b.b,b.a,...(b.o||[])])addE(i,o)}for(const u of b.upA||[])for(const o of u.o||[])for(const i of [b.b,b.a])addE(i,o)}}
  for(const k in S.pre||{}){const pr=S.pre[k];for(const q of [pr].concat(pr.alt||[])){if(q.c!=null)addE(q.c,+k);if(q.src!=null)addE(q.src,+k)}}
  for(const s of S.sets||[]){for(const a of [s.src,s.ctl])addE(a,s.tgt)}
  const cone=n=>{const seen=new Set([n]),q=[n];while(q.length){const x=q.pop();for(const y of fwd.get(x)||[])if(!seen.has(y)){seen.add(y);q.push(y)}}return seen};
  const consumed=n=>S.blk.some(b=>(b.i||[]).includes(n));
  const isOut=n=>!S.ext.includes(n)&&(S.drv[n]||[]).length&&(!consumed(n)||S.blk.some(b=>b.k==='AO'&&(b.i||[]).includes(n)));
  const outs=[];for(let n=0;n<S.nets.length;n++)if(isOut(n))outs.push(n);
  const run=async(setup)=>{AN.reset();AN.go(idx);const rt=S.rt;for(const [n,v] of setup){if(S.xlk&&S.xlk[n]||!S.ext.includes(n))rt.force[n]=v;else rt.ext[n]=v}try{AN.settle()}catch(e){}const tr=[Array.from(rt.v)];for(let k=0;k<60;k++){AN.stepSet(sh,.5);tr.push(Array.from(rt.v))}return tr};
  const ins=S.ext.filter(n=>!(S.lab[n]&&S.lab[n].t==='COS manual value')||true);
  const dg=S.ext.filter(n=>S.nets[n].dig);let seed=12345;const rnd=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};const bases=[[],dg.map(n=>[n,1]),dg.map((n,k)=>[n,k%2]),dg.map((n,k)=>[n,(k+1)%2])];for(let j=0;j<10;j++)bases.push(dg.map(n=>[n,rnd()<.3?1:0]));
  const rng=n=>{const r=AN.extRange&&AN.extRange(S,n);return r&&r.hi>r.lo?[r.lo,(r.lo+r.hi)/2,r.hi]:[0,50,100]};
  const reached=new Set(),viol=[],eff={};
  for(const n of ins){const c=cone(n);eff[n]=0;const vals=S.nets[n].dig?[0,1]:rng(n);
   for(let bi=0;bi<bases.length;bi++){const bs=bases[bi].filter(([m])=>m!==n);for(const v of vals){const r=await run(bs.concat([[n,v]]));const ref=await run(bs.concat([[n,vals[0]===v?vals[1]:vals[0]]]));
     for(let k=0;k<r[0].length;k++){if(k===n)continue;let ch=false;for(let t=0;t<r.length&&!ch;t++)if(Math.abs(r[t][k]-ref[t][k])>1e-6)ch=true;if(ch){eff[n]++;reached.add(k);if(!c.has(k)&&!S.ext.includes(k))viol.push(lab(n)+' -> '+lab(k))}}
     if(vals.length>2)break}}}
  const outDead=outs.filter(o=>!reached.has(o)).map(lab);const inDead=ins.filter(n=>!eff[n]).map(lab);
  return{ins:ins.length,outs:outs.length,inDead,outDead,viol:[...new Set(viol)].slice(0,8),violN:new Set(viol).size}},nm);
 tin+=R.ins;tout+=R.outs;deadIn+=R.inDead.length;deadOut+=R.outDead.length;bad+=R.violN;
 console.log(nm+': '+R.ins+' input, '+R.outs+' output | patay na input: '+R.inDead.length+(R.inDead.length?' ['+R.inDead.slice(0,10).join(', ')+']':'')+' | output na walang input: '+R.outDead.length+(R.outDead.length?' ['+R.outDead.slice(0,10).join(', ')+']':'')+' | gumalaw na wala sa istruktura: '+R.violN+(R.violN?' ['+R.viol.join('; ')+']':''))}
console.log('\nKABUUAN: '+tin+' input, '+tout+' output, patay na input '+deadIn+', patay na output '+deadOut+', paglabag sa istruktura '+bad+(errs.length?' | errors '+errs.slice(0,2):''));await browser.close()})();
