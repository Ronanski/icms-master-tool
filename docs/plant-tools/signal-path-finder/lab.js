const {chromium}=require('playwright');const S=require('./sample.json');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1280,900],[820,1180],[400,860]]){const p=await b.newPage({viewport:{width:w,height:h}});
 await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(900);let n=0,ex=[];
 for(const a of S){await p.evaluate(a=>{VAL='';document.getElementById('q').value=BY[a].g;render(BY[a])},a);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const R=e=>e.getBoundingClientRect();const ov=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
   const parts=[...document.querySelectorAll('.cell svg.dev,.cell .nm,.cell .fx,.cell .brn,.pnl .plate,.pnl')].filter(e=>!e.classList.contains('pnl')||true);
   const out=[];document.querySelectorAll('#wls .wl').forEach(l=>{const a=R(l);parts.forEach(e=>{const b=R(e);if(e.classList.contains('pnl')){if(ov(a,b)&&!(a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom))out.push(l.textContent+' x frame');return}if(ov(a,b))out.push(l.textContent+' -> '+(e.className.baseVal??e.className))})});return out});
  n+=r.length;if(r.length)ex.push(a+': '+r.join(' | '))}
 console.log(w,n);console.log(ex.slice(0,6).join('\n'))}
await b.close()})();
