// Button inventory (3.1.0-beta.6): every visible button of 24 screens grouped by look (height, colours, corner, text size).
// Usage: node tools/ui-audit/inventory.mjs <html> <outdir>   (needs playwright; see tests/regress/lib.js for the browser path)
import { chromium } from 'playwright';
import fs from 'fs';
const [,, file, out] = process.argv;
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--headless=new'],headless:false});
const p = await (await b.newContext({viewport:{width:1333,height:833},deviceScaleFactor:2})).newPage();
await p.goto('file://'+file); await p.waitForTimeout(3000);
const inv={}; let shotN=0;
const grab=async(screen)=>{
  const r=await p.evaluate(()=>{const out=[];for(const e of document.querySelectorAll('button,select,label.b,input[type=button]')){const r=e.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;const t=document.elementFromPoint(Math.min(innerWidth-1,r.left+r.width/2),Math.min(innerHeight-1,r.top+r.height/2));if(!t||!(t===e||e.contains(t)))continue;if(e.closest('svg'))continue;const cs=getComputedStyle(e);const key=[Math.round(r.height),cs.backgroundColor,cs.borderTopColor,cs.borderTopWidth,cs.borderRadius,cs.fontSize,cs.fontWeight,cs.color,cs.fontFamily.split(',')[0]].join('|');out.push({key,txt:(e.textContent||e.value||e.title||'').trim().slice(0,30),x:r.left,y:r.top,w:r.width,h:r.height,where:(e.closest('[id]')||{}).id||''})}return out});
  for(const o of r){(inv[o.key]=inv[o.key]||{n:0,ex:[]});inv[o.key].n++;if(inv[o.key].ex.length<6)inv[o.key].ex.push(screen+':'+o.where+':'+o.txt);}
  return r;
};
const ct=async(re,sel='button')=>p.evaluate(([s,src])=>{const r=new RegExp(src);const b=[...document.querySelectorAll(s)].find(x=>x.offsetParent&&r.test(x.textContent.trim()));if(b){b.click();return true}return false},[sel,re]);
const step=async(n,f)=>{try{await f();await p.waitForTimeout(700);await grab(n);await p.screenshot({path:`${out}/${n}.png`})}catch(e){console.log('ERR',n,e.message.split('\n')[0])}};
await step('ditl',async()=>{});
await step('ditl-run',async()=>{await ct('^RUN$','#gsbar .seg button')});
await ct('^VIEW$','#gsbar .seg button');
await step('abc',async()=>{await ct('^ABC$');await p.waitForTimeout(1000);await p.evaluate(()=>AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010')))});
await step('abc-sel',async()=>{await p.evaluate(()=>{const sh=AN.sheets[AN.i];AN.sel={blk:sh.S.blk.find(b=>b.k==='PID')};AN.panelUpd(true)})});
await step('abc-sel2',async()=>{await p.evaluate(()=>document.getElementById('anp').scrollTop=800)});
await step('abc-sel3',async()=>{await p.evaluate(()=>document.getElementById('anp').scrollTop=1800)});
await step('abc-run',async()=>{await ct('^RUN$','#gsbar .seg button');await p.waitForTimeout(1200)});
await step('abc-run-fp2',async()=>{await p.evaluate(()=>document.getElementById('opp').scrollTop=500)});
await step('abc-run-fp3',async()=>{await p.evaluate(()=>{const e=document.querySelector('#opp details.fpe');if(e){e.open=true;e.scrollIntoView()}})});
await step('inputs',async()=>{await ct('^Inputs','#sidetabs button')});
await step('legend',async()=>{await ct('^Legend$')}); await ct('^Legend$');
await step('settings',async()=>{await p.locator('.gs-set > button').first().click()}); await p.mouse.click(700,500);
await step('plant',async()=>{await ct('^Plant view$')});
await step('plant-start',async()=>{await ct('^Start')}); await p.mouse.click(700,600);
await step('library',async()=>{await ct('^Library$')});
await step('tools',async()=>{await ct('^Tools$')});
for (const [n,re] of [['audit','^Audit'],['health','^Health'],['fx','^F\\(X\\)'],['assumed','^Assumed'],['ditlsig','^DITL signals'],['second','^Second'],['uat','^UAT$']]) { await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^[×✕]$/.test(b.textContent.trim())&&!b.closest('#gsbar')).forEach(b=>b.click())); await ct('^Tools$'); await step(n,async()=>{await ct(re)}); }
fs.writeFileSync(out+'/inv.json',JSON.stringify(inv,null,1));
const keys=Object.entries(inv).sort((a,b)=>b[1].n-a[1].n);
console.log('distinct button looks:',keys.length);
for(const [k,v] of keys) console.log(v.n,'|',k.replace(/rgb\(([^)]*)\)/g,(m,c)=>'#'+c.split(',').slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('')),'|',v.ex.join(' ; '));
await b.close();
