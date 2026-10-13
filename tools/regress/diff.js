// Differential run: the same deterministic input sequence on every sheet for several builds of the HTML; prints which sheets differ.
// Usage: node tools/regress/diff.js old1.html old2.html ... new.html   (the last one is the build under test)
const {open}=require('./lib');
const NEUTRAL=process.argv.includes('--neutral');// --neutral: zero dMVH / TF / CUT on the last build, so that only F-30 (A/M latch) is left of the ec35978 change
const HOLD=+((process.argv.find(a=>a.startsWith('--hold='))||'').slice(7))||0;// --hold=SECONDS: one more state with the inputs held (steady state)
const files=process.argv.slice(2).filter(a=>!a.startsWith('--'));
async function snap(html,neutral,HOLD){
  const {browser,page}=await open(html);
  const r=await page.evaluate(([neutral,HOLD])=>{
    let seed=12345;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
    const out={};
    if(neutral)for(const sh of AN.sheets)for(const b of AN.ensure(sh).blk)if(b.k==='PID'||b.k==='PIDV'||b.k==='MAN'||b.k==='SUMA'){b.p.dmvh=0;b.p.tf=0;b.p.cut=0}
    for(const sh of AN.sheets){
      const S=AN.ensure(sh);seed=12345+sh.name.length*7919;let h=0;for(const c of sh.name)h=(h*31+c.charCodeAt(0))>>>0;seed=h||1;
      S.rt.force={};const states=[];
      for(let k=0;k<6;k++){
        for(const n of S.ext){const net=S.nets[n];if(net.dig){S.rt.ext[n]=rnd()<(k===0?0:.5)?1:0;continue}
          let r=null;try{r=AN.extRange(S,n)}catch(e){}const lo=r?r.lo:0,hi=r?r.hi:100;S.rt.ext[n]=k===0?lo+(hi-lo)*.5:lo+(hi-lo)*rnd()}
        for(let i=0;i<80;i++)AN.stepSet(sh,.25);
        states.push(Array.from(S.rt.v,x=>Math.round(x*1e4)/1e4));
      }
      if(HOLD){for(let i=0;i<HOLD*4;i++)AN.stepSet(sh,.25);states.push(Array.from(S.rt.v,x=>Math.round(x*1e4)/1e4))}
      out[sh.name]={nets:S.nets.length,states};
    }
    return out},[neutral,HOLD]);
  await browser.close();return r}
(async()=>{
  const snaps=[];files.forEach(()=>0);for(let i=0;i<files.length;i++)snaps.push(await snap(files[i],NEUTRAL&&i===files.length-1,HOLD));
  const names=Object.keys(snaps[snaps.length-1]);
  console.log('build under test: '+files[files.length-1]);
  for(let j=0;j<files.length-1;j++){
    let same=0,diff=[];
    for(const n of names){const a=snaps[j][n],b=snaps[snaps.length-1][n];
      if(!a||a.nets!==b.nets){diff.push(n+' (net count '+(a&&a.nets)+' -> '+b.nets+')');continue}
      let nd=0,first=null;for(let k=0;k<a.states.length;k++)for(let i=0;i<a.nets;i++){const x=a.states[k][i],y=b.states[k][i];if(Math.abs(x-y)>1e-3*Math.max(1,Math.abs(x))){nd++;if(!first)first='state '+k+' net '+i+': '+x+' -> '+y}}
      let ndL=0,worst='';if(HOLD){const k=a.states.length-1;let mx=0;for(let i=0;i<a.nets;i++){const x=a.states[k][i],y=b.states[k][i],e=Math.abs(x-y)/Math.max(1,Math.abs(x));if(e>1e-3)ndL++;if(e>mx){mx=e;worst='net '+i+': '+x+' -> '+y}}}
      if(nd)diff.push(n+' ('+nd+' values over all states; first '+first+')'+(HOLD?' | steady state after '+HOLD+' s hold: '+ndL+' values differ'+(ndL?', worst '+worst:''):''));else same++}
    console.log('\n== '+files[j]+' vs current: '+same+' sheets identical, '+diff.length+' differ');for(const d of diff)console.log('  '+d)}
})();
