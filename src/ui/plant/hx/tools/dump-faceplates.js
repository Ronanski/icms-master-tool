const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html='dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const out=process.argv[2];const url='file://'+path.resolve(html);const wait=ms=>new Promise(r=>setTimeout(r,ms));
const JOBS=[['MK07',['MS1','MS2','D88','D73','TS1','D80','PMS6','TMS22','THR2','PHR391','PHR3','THR12','BR','PMS2']],['MK08',['M75','PAS5']],['MK09',['RHD','RHT']]];
(async()=>{const browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:1600,height:900}});
await ctx.addInitScript(()=>{try{localStorage.setItem('ls-shell','c')}catch(e){}});
const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e.message)));
await page.goto(url);await page.waitForSelector('#scstart',{state:'visible',timeout:60000});
await page.locator('#scstart .scchips button',{hasText:'150 MW'}).first().click();
await page.locator('#scstart .sccard',{hasText:'Operator'}).first().click();
await page.waitForFunction(()=>window.AN&&AN.startState&&window.DITL150&&DITL150.on&&!AN._loading&&document.body.classList.contains('scov'),null,{timeout:180000});
await page.evaluate(()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<40;k++){WORLD.live=true;AN.stepSet(C,.5);WORLD.tick(.5)}});
await wait(1200);await page.locator('#scov .sctile:not(.scalm)').first().click();await wait(1500);
const res={};
for(const [pg,ids] of JOBS){
 await page.evaluate(v=>{const s=document.querySelector('#plantws .plpick');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},pg);await wait(2500);
 for(const id of ids){
  const before=await page.evaluate(()=>[...document.body.children].map(e=>e.id||e.className).join('|'));
  const ok=await page.evaluate(id=>{const e=document.querySelector('#plantws [data-hit="'+id+'"]');if(!e)return false;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},id);
  if(!ok){res[pg+'/'+id]={err:'no hit element'};continue}
  await page.mouse.click(ok.x,ok.y);await wait(900);
  const d=await page.evaluate(()=>{const pops=[...document.querySelectorAll('#fpop,[id^="fpop"],.fpo,.fpw,#fp,.fp,[class*="facepl"],[id*="facepl"]')].filter(e=>e.offsetHeight>40&&e.offsetWidth>100);const top=pops.filter(e=>!pops.some(o=>o!==e&&o.contains(e)));return top.map(e=>({id:e.id,cls:String(e.className).slice(0,60),w:e.offsetWidth,h:e.offsetHeight,text:e.innerText.replace(/\n{2,}/g,'\n').slice(0,2500),btn:[...e.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,40)}))});
  res[pg+'/'+id]={pops:d};
  try{await page.screenshot({path:out+'/'+pg+'-'+id+'.png'})}catch(e){}
  /* the Y / N square of the same machine on the page, if any */
  const yn=await page.evaluate(id=>{const e=document.querySelector('#plantws [data-yn="'+id+'"]');if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},id);
  if(yn){await page.mouse.click(yn.x,yn.y);await wait(800);res[pg+'/'+id].yn=await page.evaluate(()=>[...document.querySelectorAll('[id^="fpop"],.fpo,.fpw')].filter(e=>e.offsetHeight>40).map(e=>e.innerText.slice(0,1500)));try{await page.screenshot({path:out+'/'+pg+'-'+id+'-yn.png'})}catch(e){}}
  await page.evaluate(()=>{try{LS_FPOP.close&&LS_FPOP.close()}catch(e){}document.querySelectorAll('#fpop .fpo-x,.fpo-x,[data-fpx]').forEach(b=>b.click())});await page.keyboard.press('Escape');await wait(300);
 }}
fs.writeFileSync(out+'/fp.json',JSON.stringify(res,null,1));console.log(Object.entries(res).map(([k,v])=>k+':'+(v.err||v.pops.length+'pop'+(v.yn?'+yn':''))).join(' '),'errs',errs.slice(0,3).join('|'));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
