// Reset fidelity: every sheet is mutated like a user would (digital inputs forced both ways, every switch flipped, 40 s of RUN with the plant on),
// then Reset is pressed. The state of every block and net must equal the state of Reset on a freshly loaded page (the same start whatever the user did). Usage: node tests/regress/reset.js [html]
const {open}=require('./lib.js');
const html=process.argv[2]||require('fs').readdirSync('dist').map(x=>'dist/'+x).find(x=>/logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
const FP=`(()=>{const o={};for(const sh of AN.sheets)if(!/ABC-000/.test(sh.name))AN.ensure(sh);for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;const S=AN.ensure(sh);for(let i=0;i<6;i++)AN.stepSet(sh,0);
 const v=Array.from(S.rt.v).map(x=>+(+x).toFixed(4));const st={};for(const id in S.rt.st){const s=S.rt.st[id];const q={};for(const k in s){const x=s[k];if(typeof x==='number'||typeof x==='string'||x===null)q[k]=typeof x==='number'?+x.toFixed(4):x}st[id]=q}
 o[sh.name]={v,st,force:Object.keys(S.rt.force).length,ext:JSON.stringify(S.rt.ext)}}return o})()`;
(async()=>{
 const A=await open(html);await A.page.evaluate(()=>{for(const sh of AN.sheets)if(!/ABC-000/.test(sh.name))AN.ensure(sh);AN.reset()});const fa=await A.page.evaluate(FP);await A.browser.close();
 const B=await open(html);
 await B.page.evaluate(()=>{for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;const S=AN.ensure(sh);
  S.ext.filter(n=>S.nets[n].dig).forEach((n,i)=>{S.rt.force[n]=(i%2)?1:0});
  for(const b of S.blk)if(b.k==='SW'||b.k==='AMT'){S.rt.st[b.id].fm=(b.id%2)?'A':'B'}
  for(let i=0;i<160;i++)AN.stepSet(sh,.25)}AN.reset()});
 const fb=await B.page.evaluate(FP);await B.browser.close();
 let bad=0;
 for(const n in fa){const a=fa[n],b=fb[n],dv=a.v.filter((x,i)=>Math.abs(x-b.v[i])>1e-3).length,ds=[];
  for(const id in a.st)for(const k in a.st[id])if(JSON.stringify(a.st[id][k])!==JSON.stringify((b.st[id]||{})[k]))ds.push(id+'.'+k+':'+a.st[id][k]+'->'+(b.st[id]||{})[k]);
  if(dv||ds.length||a.force!==b.force||a.ext!==b.ext){bad++;console.log('DIFF',n,'nets',dv,'state',ds.length,'force',a.force+'->'+b.force,'ext',a.ext!==b.ext,ds.slice(0,3).join(' '))}}
 console.log((bad?'FAIL':'PASS')+' reset fidelity: '+Object.keys(fa).length+' sheets, '+bad+' differ from Reset on a fresh page');process.exit(bad?1:0)})();
