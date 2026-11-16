const {chromium}=require('playwright');const S=require('./sample.json');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});
await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(900);const all={};
for(const a of S){await p.evaluate(a=>{document.getElementById('q').value=BY[a].g;render(BY[a])},a);await p.waitForTimeout(200);
 const r=await p.evaluate(()=>{const out=[];document.querySelectorAll('svg.dev,svg.brs').forEach(sv=>{const ts=[...sv.querySelectorAll('text')].map(t=>[t,t.getBoundingClientRect()]).filter(x=>x[1].width>0);
  for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){const A=ts[i][1],B=ts[j][1];if(A.left<B.right-.5&&A.right>B.left+.5&&A.top<B.bottom-1&&A.bottom>B.top+1)out.push(ts[i][0].textContent+' ~ '+ts[j][0].textContent)}
  // text outside its svg box
  const R=sv.getBoundingClientRect();ts.forEach(([t,A])=>{if(A.right>R.right+2||A.left<R.left-2)out.push('OUT '+t.textContent)})});return out});
 r.forEach(x=>all[x]=(all[x]||0)+1)}
console.log(Object.entries(all).sort((a,b)=>b[1]-a[1]).slice(0,40).map(x=>x[1]+'  '+x[0]).join('\n'));await b.close()})();
