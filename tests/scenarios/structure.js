// STRUKTURA ng bawat sheet (walang simulation, mabilis): inuuri ang bawat external input at bawat output ayon sa pagkakakabit.
//  input na walang kumakain (walang block na gumagamit) = "hindi nakakabit" (posibleng kulang ang kontinuidad ng signal o palamuti lang ng drawing)
//  input na may kumakain pero walang naaabot na output = "dead end"
//  output na walang input sa itaas niya = "constant lang" (hal. timer / constant; normal)
// Usage: node tests/scenarios/structure.js [html] [sheet ...]
const fs=require('fs');const {open}=require('../regress/lib.js');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));
(async()=>{const {browser,page}=await open(html);
const R=await page.evaluate((want)=>{const out=[];for(const sh of AN.sheets){if(/^ABC-000/.test(sh.name)||(want.length&&!want.includes(sh.name)))continue;AN.go(AN.sheets.indexOf(sh));const S=sh.S;const lab=n=>S.lab[n]&&S.lab[n].t||('n'+n);
 const fwd=new Map(),bwd=new Map();const add=(m,a,b)=>{if(a<0||b<0)return;(m.get(a)||m.set(a,new Set()).get(a)).add(b)};
 for(const b of S.blk.concat(S.ord||[]))for(const i of b.i||[])for(const o of b.o||[]){add(fwd,i,o);add(bwd,o,i)}
 for(const k in S.pre||{}){const pr=S.pre[k];for(const q of [pr].concat(pr.alt||[])){if(q.c!=null){add(fwd,q.c,+k);add(bwd,+k,q.c)}if(q.src!=null){add(fwd,q.src,+k);add(bwd,+k,q.src)}}}
 for(const s of S.sets||[])for(const a of [s.src,s.ctl]){add(fwd,a,s.tgt);add(bwd,s.tgt,a)}
 const reach=(m,n)=>{const seen=new Set([n]),q=[n];while(q.length){const x=q.pop();for(const y of m.get(x)||[])if(!seen.has(y)){seen.add(y);q.push(y)}}seen.delete(n);return seen};
 const consumed=n=>S.blk.concat(S.ord||[]).some(b=>(b.i||[]).includes(n));
 const outs=[];for(let n=0;n<S.nets.length;n++)if(!S.ext.includes(n)&&(S.drv[n]||[]).length&&(!consumed(n)||S.blk.some(b=>b.k==='AO'&&(b.i||[]).includes(n))))outs.push(n);
 const unconn=[],dead=[];for(const n of S.ext){const isCos=S.lab[n]&&S.lab[n].t==='COS manual value';const cons=S.blk.concat(S.ord||[]).filter(b=>(b.i||[]).includes(n)).length;if(!cons&&!(S.pre&&S.pre[n]))unconn.push(lab(n)+(isCos?' (COS)':'')+(S.xlk&&S.xlk[n]?' <'+S.xlk[n].from.name:''));else{const r=reach(fwd,n);if(![...r].some(x=>outs.includes(x)||S.nets[x]&&consumed(x)===false))dead.push(lab(n))}}
 const constOut=outs.filter(o=>![...reach(bwd,o)].some(x=>S.ext.includes(x))).map(lab);
 out.push({sh:sh.name,ext:S.ext.length,outs:outs.length,unconn,dead,constOut})}return out},want);
let U=0,D=0,C=0,E=0,O=0;for(const r of R){U+=r.unconn.length;D+=r.dead.length;C+=r.constOut.length;E+=r.ext;O+=r.outs;console.log(r.sh+': '+r.ext+' input, '+r.outs+' output | hindi nakakabit: '+r.unconn.length+(r.unconn.length?' ['+r.unconn.slice(0,8).join(', ')+']':'')+' | dead end: '+r.dead.length+(r.dead.length?' ['+r.dead.slice(0,6).join(', ')+']':'')+' | output na constant lang: '+r.constOut.length)}
console.log('\nKABUUAN: '+R.length+' sheet, '+E+' input, '+O+' output | hindi nakakabit '+U+' | dead end '+D+' | constant lang '+C);await browser.close()})();
