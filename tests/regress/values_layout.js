// Live values layout check (PROJECT_RULES 5c, Excel rules): for every sheet, every live-value label (text.bd) is measured from the
// RENDERED text (getBBox of a worst-case value) and compared with: the other diagram text, the other live values, the blocks, the wires.
// Also: side labels are centred on their anchor vertically, above / below labels are centred horizontally.
// Usage: node tests/regress/values_layout.js [logic-sim-vX.Y.Z.html] [--list]   (exit 1 when any label covers something)
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||fs.readdirSync('dist').map(x=>'dist/'+x).find(f=>/logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(f));
(async()=>{const {browser,page,errs}=await open(html);
const res=await page.evaluate(()=>{
 const ov=(a,c,m=.15)=>{const w=Math.min(a[2],c[2])-Math.max(a[0],c[0]),h=Math.min(a[3],c[3])-Math.max(a[1],c[1]);return w>m&&h>m?w*h:0};
 const hit=(x1,y1,x2,y2,r)=>{let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;for(const[p,q]of[[-dx,x1-r[0]],[dx,r[2]-x1],[-dy,y1-r[1]],[dy,r[3]-y1]]){if(Math.abs(p)<1e-9){if(q<0)return false}else{const t=q/p;if(p<0){if(t>t1)return false;if(t>t0)t0=t}else{if(t<t0)return false;if(t<t1)t1=t}}}return true};
 const out=[],svg=document.getElementById('svg');
 for(let i=0;i<AN.sheets.length;i++){AN.go(i);const sh=AN.sheets[i],S=sh.S,R=sh.R;
  AN.paint&&AN.paint();/* a text that is empty after painting shows no number (SW, COS, ACH, an AO whose address shows it): not measured; timer and alarm texts are empty until they are needed and ARE measured */const labs=[...svg.querySelectorAll('text.bd')].filter(e=>e.style.display!=='none'&&!(e.textContent===''&&['SW','COS','ACH','AO','PO','VLV','ACT'].includes(e.dataset.eq)));/* the hidden ones (value not shown by design) are not measured */labs.forEach(e=>{e.style.display='';if(e.textContent.length<6)e.textContent='888.88'});
  const bb=e=>{const b=e.getBBox();return[b.x,b.y,b.x+b.width,b.y+b.height]};
  const others=[...svg.querySelectorAll('text:not(.bd)')].filter(e=>e.textContent.trim()&&!e.closest('#reviewmarks,.xref')).map(e=>{const r=bb(e),sh_=(r[3]-r[1])*.18;return[r[0]+.1,r[1]+sh_,r[2]-.1,r[3]-sh_]});
  const blks=S.blk.map(b=>[b.x0-.3,-b.y1-.3,b.x1+.3,-b.y0+.3]);
  const segs=[].concat(R.seg,S.seg,S.gl||[],S.edge||[]).map(s=>[s.x1,-s.y1,s.x2,-s.y2]);
  /* the ink of a number is about 0.95 x the font size high; getBBox gives the whole line box (1.45 x), so the box is cut to the ink height, centred */
  const L=labs.map(e=>{const r=bb(e),fs=parseFloat(getComputedStyle(e).fontSize)||2.4,h=fs*.95,cy=(r[1]+r[3])/2;return{e,r:[r[0],cy-h/2,r[2],cy+h/2]}});let n=0,bad={text:0,value:0,block:0,wire:0,align:0,deep:0},ex=[];
  L.forEach((a,k)=>{n++;const r=a.r,sm=[r[0]+.1,r[1]+.15,r[2]-.1,r[3]-.15],why=[];
   const dp=[r[0]+.7,r[1]+.7,r[2]-.7,r[3]-.7];let deep=0;/* deep = more than 0.7 unit into something (not just touching) */
   if(others.some(o=>ov(dp,o,0)))deep=1;if(L.some((b,j)=>j!==k&&ov(dp,b.r,0)))deep=1;if(blks.some(b=>ov(dp,b,0)))deep=1;if(segs.some(s=>hit(s[0],s[1],s[2],s[3],dp)))deep=1;if(deep)bad.deep=(bad.deep||0)+1;
   if(others.some(o=>ov(sm,o)))why.push('text');
   if(L.some((b,j)=>j!==k&&ov(r,b.r)))why.push('value');
   if(blks.some(b=>ov(sm,b)))why.push('block');
   if(segs.some(s=>hit(s[0],s[1],s[2],s[3],sm)))why.push('wire');
   const al=a.e.dataset.al,ax=+a.e.dataset.ax,ay=+a.e.dataset.ay,cx=(r[0]+r[2])/2,cy=(r[1]+r[3])/2;
   if((al==='r'||al==='l')&&Math.abs(cy-ay)>1)why.push('align');if((al==='t'||al==='b')&&Math.abs(cx-ax)>1)why.push('align');
   why.forEach(w=>{bad[w]++;const k=(a.e.dataset.eq||!al?'equip':'net')+'_'+w;bad[k]=(bad[k]||0)+1});if(why.length&&ex.length<3)ex.push({n:a.e.dataset.n,al,why:why.join('+'),x:Math.round(r[0]),y:Math.round(-r[3])});});
  out.push({sheet:sh.name,n,bad,ex})}
 return out});
const T={deep:0,net_text:0,net_value:0,net_block:0,net_wire:0,equip_text:0,equip_value:0,equip_block:0,equip_wire:0,n:0,text:0,value:0,block:0,wire:0,align:0},worst=[];
for(const s of res){T.n+=s.n;T.deep+=s.bad.deep||0;for(const k of['text','value','block','wire','align'])T[k]+=s.bad[k];for(const k of Object.keys(T))if(/^(net|equip)_/.test(k))T[k]+=s.bad[k]||0;const t=s.bad.text+s.bad.value+s.bad.block+s.bad.wire+s.bad.align;if(t)worst.push([t,s])}
console.log('labels',T.n,' DEEP (more than 0.7 unit inside something)',T.deep,'|',' covers text',T.text,' covers value',T.value,' covers block',T.block,' covers wire',T.wire,' not centred',T.align);
console.log('net labels (wire / address values): text',T.net_text,'value',T.net_value,'block',T.net_block,'wire',T.net_wire,'| equipment values (timer / valve / switch): text',T.equip_text,'value',T.equip_value,'block',T.equip_block,'wire',T.equip_wire);
worst.sort((a,b)=>b[0]-a[0]);console.log('sheets with a problem',worst.length,'of',res.length);
if(process.argv.includes('--list'))worst.forEach(([t,s])=>console.log(s.sheet,s.n,JSON.stringify(s.bad),JSON.stringify(s.ex)));else worst.slice(0,8).forEach(([t,s])=>console.log(' ',s.sheet,'labels',s.n,JSON.stringify(s.bad)));
if(errs.length)console.log('page errors',errs.slice(0,3));
await browser.close();process.exit(worst.length?1:0)})();
