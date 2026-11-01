// 3.2.0-beta.39 (roadmap 5): every "FROM / TO DITL xx-nn" text of every ABC sheet is a page link (before: 10 of 233).
// Real mouse click (desktop) / tap (tablet, phone) on the text -> the DITL page + item row opens (list of pages = chooser),
// ABC ↩ Back returns to the same ABC sheet; DITL "FROM / TO ABC-xxx" opens the ABC sheet and ABC ↩ Back returns to the DITL sheet.
// Usage: node tests/regress/abc_ditl_links.js [html] [--quick]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const quick=process.argv.includes('--quick');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{if(!ok||process.env.VERBOSE)console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const [n,w,h] of (quick?[['desktop',1440,900]]:[['desktop',1440,900],['tablet',1280,800],['phone',390,844]])){
 const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:n!=='desktop'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{try{localStorage.setItem('ditl.cat','an');localStorage.setItem('ls-tab','logic')}catch(e){}});
 await page.goto('file://'+require('path').resolve(html));
 await page.waitForFunction(()=>document.body.classList.contains('app2')&&window.AN&&AN.sheets&&AN.sheets.length>=54&&window.DUI&&DUI.link&&S.sheets.length>50,null,{timeout:60000});
 await page.waitForTimeout(500);
 // 3.2.0-beta.78: the operator only traces here: the starting-state question (app.js lsAskStart, retest #57 / #59) that a real click +
 // Back to the ABC page brings up is answered "Not now" (AN._askNo), else it covers the drawing and the next clicks hit it
 await page.evaluate(()=>{AN._askNo=1;const q=document.getElementById('lsask');if(q)q.remove()});
 // list: sheet index, text index, refs
 let list=await page.evaluate(()=>{const o=[];AN.sheets.forEach((sh,si)=>{const S2=AN.ensure(sh);S2.tx.forEach((t,ti)=>{if(/DITL/i.test(t.t))o.push({si,ti,t:t.t,name:sh.name})})});return o});
 ck(list.length>=230,`${n}: ${list.length} FROM / TO DITL texts found on the ABC sheets`);
 // tablet / phone: every 4th text and every list (the touch tap is the same code; desktop takes all)
 if(n!=='desktop')list=list.filter((q,i)=>i%4===0||(q.t.match(/(?<!\d)\d{2,3}[A-Z]?\s*-\s*\d+/g)||[]).length>1);
 let okN=0,bad=[];
 for(const it of list){
  // open the sheet, zoom on the text, find its screen centre
  const pos=await page.evaluate(({si,ti})=>{AN.setCat('an');AN.go(si);const sh=AN.cs(),S2=sh.S,t=S2.tx[ti];const v=AN.av[sh.name];const svg=document.getElementById('svg');const r=svg.getBoundingClientRect();
   v[2]=Math.max(40,t.h*14);v[3]=v[2]*r.height/r.width;v[0]=t.x-v[2]/2;v[1]=-t.y-v[3]/2;svg.setAttribute('viewBox',v.join(' '));
   return new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(()=>{const els=[...svg.querySelectorAll('text')].filter(e=>e.textContent===t.t);const best=els.map(e=>e.getBoundingClientRect()).filter(b=>b.width).sort((a,b)=>Math.hypot(a.left+a.width/2-(r.left+r.width/2),a.top+a.height/2-(r.top+r.height/2))-Math.hypot(b.left+b.width/2-(r.left+r.width/2),b.top+b.height/2-(r.top+r.height/2)))[0];res(best?[(best.left<r.left?r.left+30:Math.min(best.left+best.width/2,best.left+60,r.right-20)),best.top+best.height/2]:null)})))},it);
  if(!pos){bad.push(it.name+' | '+it.t+' (text not on screen)');continue}
  if(n==='desktop')await page.mouse.click(pos[0],pos[1]);else await page.touchscreen.tap(pos[0],pos[1]);
  await page.waitForTimeout(150);
  const r=await page.evaluate(()=>({dig:!document.body.classList.contains('an'),sh:window.cur&&cur().name,pick:!document.getElementById('plpick').hidden,items:[...document.querySelectorAll('#plpick button')].length,flash:!!document.querySelector('#svg rect.plflash'),msg:(document.getElementById('msg')||{}).textContent}));
  const refs=await page.evaluate(t=>[...t.matchAll(/(?<!\d)(\d{2,3}[A-Z]?)\s*-\s*(\d+)/gi)].length,it.t);
  const good=refs>1?r.pick&&r.items>=2:r.dig&&(r.flash||new RegExp('DITL-'+(/(\d{2,3}[A-Z]?)\s*-/.exec(it.t.replace(/.*DITL/i,''))||[])[1]+'$').test(r.sh||''));
  if(good)okN++;else bad.push(it.name+' | '+it.t+' -> '+JSON.stringify(r));
  if(r.pick)await page.keyboard.press('Escape');
  if(r.dig&&!quick){ // Back returns to the same ABC sheet
   await page.evaluate(()=>{const b=document.querySelector('.dui-back');b&&b.click()});await page.waitForTimeout(100);
   const b2=await page.evaluate(()=>({an:document.body.classList.contains('an'),sh:AN.sheets[AN.i].name}));
   if(!b2.an||b2.sh!==it.name)bad.push(it.name+' | '+it.t+' Back -> '+JSON.stringify(b2));
  }
 }
 ck(bad.length===0,`${n}: ${okN}/${list.length} DITL texts open the DITL page (or a chooser) and Back returns${bad.length?'\n  '+bad.slice(0,15).join('\n  '):''}`);
 // DITL FROM ABC-006 -> ABC page; the ABC ↩ Back returns to the same DITL sheet
 const ab=await page.evaluate(async()=>{AN.setCat('dig');const s=S.sheets.find(x=>/DITL-01$/.test(x.name));S.cur=S.sheets.indexOf(s);sel=null;render();
  const i=s.rows.findIndex((r,i)=>(s.cells[i+':F']||[]).some(t=>/^ABC-006$/.test(t.t.trim())));
  DUI.link(s,{i,c:'F',k:i+':F'},{clientX:100,clientY:100});
  for(let k=0;k<60&&!(document.body.classList.contains('an')&&AN.sheets[AN.i].name==='ABC-006');k++)await new Promise(r=>setTimeout(r,100));
  const at=document.body.classList.contains('an')&&AN.sheets[AN.i].name;
  const bk=document.querySelector('#bBk,.an-back')||[...document.querySelectorAll('button')].find(b=>/Back/.test(b.textContent)&&b.offsetParent&&!b.classList.contains('dui-back'));
  const vis=!!(bk&&bk.offsetParent);bk&&bk.click();await new Promise(r=>setTimeout(r,500));
  return {at,vis,dig:!document.body.classList.contains('an'),sh:cur().name}});
 ck(ab.at==='ABC-006'&&ab.vis&&ab.dig&&/DITL-01$/.test(ab.sh),`${n}: DITL-01 FROM ABC-006 opens ABC-006; ABC ↩ Back returns to DITL-01 (${JSON.stringify(ab)})`);
 ck(errs.length===0,`${n}: no page errors ${errs[0]||''}`);
 await ctx.close();
}
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
