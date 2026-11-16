const {chromium}=require('playwright');const S=require('./sample.json');const fs=require('fs');
(async()=>{const b=await chromium.launch();const rep={};
for(const [w,h] of [[1280,900],[820,1180],[400,860]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file:///mnt/project-files/tutor-2026-11-11/signal-path-finder.html');await p.waitForTimeout(900);
 for(const a of S){await p.evaluate(a=>{VAL='';document.getElementById('q').value=BY[a].g;render(BY[a])},a);await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const out={};const cv=document.getElementById('cv'),cr=cv.getBoundingClientRect();
   const rect=e=>{const b=e.getBoundingClientRect();return{l:b.left-cr.left,t:b.top-cr.top,r:b.right-cr.left,b:b.bottom-cr.top}};
   const cells=[...cv.querySelectorAll('.cell')];const dev=cells.map(c=>rect(c.querySelector('svg.dev')));const txt=cells.flatMap(c=>[...c.querySelectorAll('.nm,.fx dd,.fx dt')].map(rect));
   // overlay wire segments
   const segs=[];document.querySelectorAll('#wires path').forEach((pa,k)=>{if(k%2&&pa.getAttribute('stroke')==='#fff')return;const d=pa.getAttribute('d');const t=d.match(/[MHV]\s*-?[\d.]+(\s+-?[\d.]+)?/g);let x=0,y=0;const pts=[];t.forEach(c=>{const n=c.slice(1).trim().split(/\s+/).map(Number);if(c[0]==='M'){x=n[0];y=n[1]}else if(c[0]==='H')x=n[0];else y=n[0];pts.push([x,y])});for(let i=1;i<pts.length;i++)segs.push([pts[i-1],pts[i]])});
   const U=[];const seen=new Set();segs.forEach(s=>{const k=s.flat().map(v=>Math.round(v)).join(',');if(!seen.has(k)){seen.add(k);U.push(s)}});
   const hit=(s,R,pad=0)=>{const[x1,y1]=s[0],[x2,y2]=s[1];const l=Math.min(x1,x2),r=Math.max(x1,x2),t=Math.min(y1,y2),bb=Math.max(y1,y2);return r>R.l+pad&&l<R.r-pad&&bb>R.t+pad&&t<R.b-pad};
   out.wireOverDevice=U.filter(s=>dev.some(R=>hit(s,R,3))).length;
   out.wireOverText=U.filter(s=>txt.some(R=>hit(s,R,1))).length;
   // parallel overlaps between different wires
   let ov=0;for(let i=0;i<U.length;i++)for(let j=i+1;j<U.length;j++){const a=U[i],c=U[j];const ah=a[0][1]===a[1][1],ch=c[0][1]===c[1][1];if(ah!==ch)continue;
     if(ah&&Math.abs(a[0][1]-c[0][1])<6){const o=Math.min(Math.max(a[0][0],a[1][0]),Math.max(c[0][0],c[1][0]))-Math.max(Math.min(a[0][0],a[1][0]),Math.min(c[0][0],c[1][0]));if(o>12)ov++}
     if(!ah&&Math.abs(a[0][0]-c[0][0])<6){const o=Math.min(Math.max(a[0][1],a[1][1]),Math.max(c[0][1],c[1][1]))-Math.max(Math.min(a[0][1],a[1][1]),Math.min(c[0][1],c[1][1]));if(o>12)ov++}}
   out.wireParallel=ov;
   const wl=[...document.querySelectorAll('#wls .wl')].map(rect);out.labelOverWire=wl.filter(R=>U.some(s=>hit(s,R,2))).length;
   out.labelOverCell=wl.filter(R=>cells.some(c=>hit([[R.l,R.t],[R.r,R.b]],rect(c),2))).length;
   out.plateCut=[...document.querySelectorAll('.plate')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
   const fsz=new Set();let small=0;document.querySelectorAll('#out *').forEach(e=>{if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const cs=getComputedStyle(e);if(e.closest('svg'))return;fsz.add(cs.fontSize);if(parseFloat(cs.fontSize)<11)small++});out.fontSizes=[...fsz].sort();out.smallText=small;
   out.overflow=document.documentElement.scrollWidth-innerWidth;out.stops=cells.length;out.empty=cells.filter(c=>!c.querySelector('.fx dd')).map(c=>c.querySelector('.nm').textContent);
   // stub endpoints: every cell side with a wire must have a stub path
   out.noStub=cells.filter((c,i)=>!c.querySelector('.stubs path')&&cells.length>1).length;
   out.unknown=cells.filter(c=>/\?/.test(c.querySelector('.nm').textContent)).map(c=>c.querySelector('.nm').textContent);
   return out});
  rep[w+'|'+a]=r;if(w===1280&&['AO0582','AI0128',S[5],S[12]].includes(a))await p.screenshot({path:`/tmp/claude-0/tr2/au-${w}-${a}.png`,fullPage:true})}
 rep['errs'+w]=errs}
fs.writeFileSync('/tmp/claude-0/tr/audit.json',JSON.stringify(rep,null,1));await b.close()})();
