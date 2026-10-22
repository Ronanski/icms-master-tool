// 3.2.0-beta.1 (audit C1 / C2): PLANT VIEW opened FIRST (before the ABC page): every value / controller / valve is linked like
// when the ABC page was opened first, and a REAL mouse click and a REAL touch tap on each linked item opens its faceplate or its
// info card (before: the drag of the graphic captured the pointer and nothing opened; plant_view.js calls lsPlantFp directly).
// A drag that starts on an item opens nothing. Usage: node tests/regress/plant_click.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
for(const mode of ['mouse','touch']){
 const ctx=await b.newContext({viewport:{width:1280,height:800},hasTouch:mode==='touch'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.open=()=>null});
 await p.goto('file://'+html);await p.waitForTimeout(2500);
 const ct=re=>p.evaluate(src=>{const r=new RegExp(src);const x=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&r.test(x.textContent.trim()));x&&x.click();return !!x},re);
 ck(await ct('^Plant view$'),mode+': Plant view opened first');
 await p.waitForFunction(()=>/linked/.test((document.getElementById('pllive')||{}).textContent||''),null,{timeout:60000});await p.waitForTimeout(1500);
 const live=await p.evaluate(()=>document.getElementById('pllive').textContent);
 const m=/(\d+) \/ (\d+)/.exec(live);
 ck(m&&+m[1]===+m[2]&&+m[2]>=50,mode+': UNIT '+live+' (every item linked although the ABC page was never opened)');
 const clear=()=>p.evaluate(()=>{document.getElementById('plfp')?.remove();const c=document.getElementById('infocard');if(c)c.style.display='none'});
 const opened=()=>p.evaluate(()=>{const c=document.getElementById('infocard');return !!document.getElementById('plfp')||(!!c&&getComputedStyle(c).display!=='none'&&c.getBoundingClientRect().width>0)});
 const pts=await p.evaluate(()=>[...document.querySelectorAll('#plsvg *')].filter(e=>e.style.cursor==='pointer').map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width}}).filter(q=>q.w>2&&q.x>0&&q.y>60&&q.x<1280&&q.y<780));
 let ok=0;const bad=[];
 for(const q of pts){await clear();if(mode==='touch')await p.touchscreen.tap(q.x,q.y);else await p.mouse.click(q.x,q.y);await p.waitForTimeout(250);if(await opened())ok++;else bad.push(Math.round(q.x)+','+Math.round(q.y))}
 ck(pts.length>=40&&ok===pts.length,mode+': '+ok+' / '+pts.length+' items open the faceplate or the info card'+(bad.length?' (not: '+bad.slice(0,6).join(' ')+')':''));
 await clear();const q=pts[0];await p.mouse.move(q.x,q.y);await p.mouse.down();await p.mouse.move(q.x+80,q.y+40,{steps:6});await p.mouse.up();await p.waitForTimeout(250);
 ck(!(await opened()),mode+': a drag that starts on an item opens nothing (it pans)');
 ck(errs.length===0,mode+': no page error'+(errs.length?' ('+errs[0]+')':''));await ctx.close()}
await b.close();console.log(f?f+' FAIL':'ALL PASS');process.exit(f?1:0)})();
