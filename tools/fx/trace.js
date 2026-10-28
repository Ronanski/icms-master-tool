// 3.2.0-beta.7: reads every F(X) block of the ABC sheets in the built app (input / output nets, what feeds them, where the output goes).
// Usage: node tools/fx/trace.js dist/<app>.html out.json   (then: python3 tools/fx/paths.py out.json > src/ui/fx/fx-paths.js)
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const html=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1400,height:900}});
await p.addInitScript(()=>{window.open=()=>null});
await p.goto('file://'+html);await p.waitForTimeout(2000);await p.evaluate(()=>AN.setCat('an'));
await p.waitForFunction(()=>window.AN&&AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});
await p.evaluate(()=>{AN.setCat('an');lsSetTab&&lsSetTab('logic')});
const n=await p.evaluate(()=>AN.sheets.length);
for(let i=0;i<n;i++){await p.evaluate(i=>{try{AN.go(i)}catch(e){}},i);await p.waitForTimeout(150);}
const r=await p.evaluate(()=>{
 const out=[];
 const D=(sh,t)=>{try{const a=AN.adesFind(sh,t);if(!a)return '';const q=a.rec;return q.k==='io'?[q.tag,q.d,q.lo!=null?q.lo+'~'+q.hi+' '+(q.u||''):''].filter(Boolean).join(' · '):[q.d,q.r].filter(Boolean).join(' · ')}catch(e){return ''}};
 const gen=s=>!s||/^(?:[A-Z0-9]+ out|→.*|F\(X\)|S\d SI\d+ ?)$/.test(s)||/ out$/.test(s);
 for(const sh of AN.sheets){const S=sh.S;if(!S)continue;let st=null;try{st=AN.shStn(sh)}catch(e){}
  const nm=n=>((AN.nm(S,n)||'')+'').trim();
  const prod=new Map(),cons=new Map();
  for(const b of S.blk){(b.o||[]).forEach(n=>prod.set(n,b));(b.i||[]).forEach(n=>{if(!cons.has(n))cons.set(n,[]);cons.get(n).push(b)})}
  const lab=b=>b.k+(b.p&&b.p.tag?' '+b.p.tag:'')+(b.p&&b.p.ln?' '+b.p.ln:'');
  const node=(n)=>{const s=nm(n);return s?{n:s,d:D(sh,s.replace(/^S\d\s*/,''))}:null};
  function upW(n0){const R=[],seen=new Set(),Q=[[n0,0]];while(Q.length){const [n,d]=Q.shift();const b=prod.get(n);const x=node(n);
    if(x&&d>0)R.push({d,...x,via:b?lab(b):''});
    if(d>7||!b||seen.has(b))continue;seen.add(b);if(x&&d>0&&!/^SI|^S\d SI/.test(x.n)&&!gen(x.n))continue;
    if(['AI','MAN','PID','PIDV','CONST'].includes(b.k)){R.push({d,n:lab(b),d2:1});continue}
    for(const m of b.i||[])Q.push([m,d+1]);}return R}
  function dnW(n0){const R=[],seen=new Set(),Q=[[n0,0]];while(Q.length){const [n,d]=Q.shift();if(d>9)continue;
    for(const b of cons.get(n)||[]){if(seen.has(b))continue;seen.add(b);const on=(b.o||[]);R.push({d,blk:lab(b),outs:on.map(nm).filter(Boolean).map(s=>({n:s,d:D(sh,s.replace(/^S\d\s*/,''))}))});
      if(['AO','PID','PIDV'].includes(b.k))continue;for(const m of on)Q.push([m,d+1]);}}return R}
  for(const b of S.blk){if(b.k!=='FX'||!b.p||!b.p.ln)continue;
   out.push({sheet:sh.name,title:(sh.title||sh.t||''),stn:st,ln:b.p.ln,in:(b.i||[]).map(nm),out:(b.o||[]).map(nm),up:(b.i||[]).map(upW),dn:(b.o||[]).map(dnW)});}
 }
 return out});
require('fs').writeFileSync(process.argv[3],JSON.stringify(r,null,1));console.log(r.length);await b.close();})();
