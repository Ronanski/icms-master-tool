const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html='dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const out=process.argv[2];const url='file://'+path.resolve(html);const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch();const ctx=await browser.newContext({viewport:{width:1600,height:900}});
await ctx.addInitScript(()=>{try{localStorage.setItem('ls-shell','c')}catch(e){}});
const page=await ctx.newPage();
await page.goto(url);await page.waitForSelector('#scstart',{state:'visible',timeout:60000});
await page.locator('#scstart .scchips button',{hasText:'150 MW'}).first().click();
await page.locator('#scstart .sccard',{hasText:'Operator'}).first().click();
await page.waitForFunction(()=>window.AN&&AN.startState&&window.DITL150&&DITL150.on&&!AN._loading&&document.body.classList.contains('scov'),null,{timeout:180000});
await page.evaluate(()=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<40;k++){WORLD.live=true;AN.stepSet(C,.5);WORLD.tick(.5)}});
await wait(1500);
await page.locator('#scov .sctile:not(.scalm)').first().click();await wait(1500);
const opts=await page.evaluate(()=>[...document.querySelector('#plantws .plpick').options].map(o=>o.value));
const res={};
for(const v of opts.filter(v=>/^MK|^CWN$/.test(v))){
 await page.evaluate(v=>{const s=document.querySelector('#plantws .plpick');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},v);await wait(2500);
 res[v]=await page.evaluate(()=>{const root=document.querySelector('#plantws svg')||document;const T=[...root.querySelectorAll('text')].filter(t=>!t.querySelector('[data-v],[data-ctl],[data-st],[data-mov]')&&!t.hasAttribute('data-v')).map(t=>{const b=t.getBBox();return{s:t.textContent.trim(),x:b.x,y:b.y+b.height/2}}).filter(t=>t.s&&t.s.length<60);
  const near=(el)=>{let b;try{b=el.getBBox()}catch(e){return''}const cx=b.x+b.width/2,cy=b.y+b.height/2;return T.map(t=>({s:t.s,d:Math.hypot(t.x-b.x,(t.y-cy)*2.2)})).sort((a,b)=>a.d-b.d).slice(0,3).map(t=>t.s).join(' | ')};
  const A=(sel,f)=>[...root.querySelectorAll(sel)].map(f);
  return{v:A('[data-v]',e=>({tag:e.getAttribute('data-v'),u:e.getAttribute('data-u'),dp:e.getAttribute('data-dp'),t:e.textContent.trim(),ns:e.hasAttribute('data-ns'),near:near(e)})),
   ctl:A('[data-ctl]',e=>({c:e.getAttribute('data-ctl'),t:e.textContent.trim()})),
   st:A('[data-st]',e=>({id:e.getAttribute('data-st'),t:e.textContent.trim()})),md:A('[data-md]',e=>({id:e.getAttribute('data-md'),t:e.textContent.trim()})),
   mov:A('[data-mov]',e=>({m:e.getAttribute('data-mov'),r:e.getAttribute('data-movr'),t:e.textContent.trim()})),
   dox:A('[data-do],[data-ox],[data-dsvc]',e=>({a:e.getAttribute('data-do')||e.getAttribute('data-ox')||e.getAttribute('data-dsvc'),t:e.textContent.trim()})),
   go:A('[data-go]',e=>({g:e.getAttribute('data-go'),t:e.textContent.trim().slice(0,40)}))}});
}
/* controllers of the operator overview: tag, name, pv, sv, mv, mode, unit */
res._ctl=await page.evaluate(()=>{const o=[];try{for(const s of AN.sheets){for(const c of (s.ctrls||s.controllers||[])){o.push({sheet:s.name,tag:c.tag||c.name,kind:c.kind||c.type})}}}catch(e){o.push({err:String(e)})}return o});
res._keys=await page.evaluate(()=>({AN:Object.keys(window.AN||{}).slice(0,200),LS:Object.keys(window).filter(k=>/^LS_|^HMI|^DUI|^WORLD|^PLANT/.test(k)),live:window.LS_LIVE?Object.keys(LS_LIVE):[],dock:window.LS_DOCK?Object.keys(LS_DOCK):[],fpop:window.LS_FPOP?Object.keys(LS_FPOP):[],sheets:AN.sheets.map(s=>s.name+'|'+(s.title||''))}));
res._strip=await page.evaluate(()=>[...document.querySelectorAll('#scstrip .sck')].map(c=>c.textContent.trim().replace(/\s+/g,' ')));
res._alarms=await page.evaluate(()=>{try{return lsShellC.alarms().slice(0,40).map(a=>a.nm||a.tag||JSON.stringify(a).slice(0,80))}catch(e){return String(e)}});
fs.writeFileSync(out,JSON.stringify(res,null,1));console.log('ok',Object.keys(res).length,Object.entries(res).filter(([k])=>!k.startsWith('_')).map(([k,v])=>k+':'+v.v.length+'/'+v.ctl.length+'/'+v.st.length).join(' '));await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
