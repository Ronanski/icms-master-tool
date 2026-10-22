// UI audit (3.0.0-beta.8): every screen of the app at a given size and theme; finds low contrast, clipped text, overlapping
// buttons, touch targets under 26 px. Usage: node tools/ui-audit/audit.mjs <html> <outdir> <light|dark> <W> <H> [fd = Android auto dark]
import { chromium } from 'playwright';
import fs from 'fs';
const [,, file, out, theme, W, H, forceDark] = process.argv;
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--headless=new',...(forceDark?['--blink-settings=forceDarkModeEnabled=true','--enable-features=WebContentsForceDark']:[])],headless:false});
const ctx = await b.newContext({viewport:{width:+W,height:+H},deviceScaleFactor:1.5,hasTouch:true,colorScheme:forceDark?'dark':'light'});
if (theme!=='light') await ctx.addInitScript(t=>{try{localStorage.setItem('ls-theme3',t)}catch(e){}}, theme);
const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+file); await p.waitForTimeout(3500);
const tag=theme+'-'+W+(forceDark?'-fd':''); let i=0; const report=[];
const detect = () => p.evaluate(()=>{
  const out=[]; const vw=innerWidth, vh=innerHeight;
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b,a]=m.map(Number);if(a===0)return null;const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return {L:.2126*f(r)+.7152*f(g)+.0722*f(b),a:a==null?1:a}};
  const bgOf=e=>{let n=e;while(n&&n!==document.documentElement){const cs=getComputedStyle(n);const l=lum(cs.backgroundColor);if(l&&l.a>.5)return l.L;n=n.parentElement}return 1};
  const vis=e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height)return false;const cs=getComputedStyle(e);if(cs.visibility==='hidden'||+cs.opacity===0)return false;if(!(r.bottom>0&&r.right>0&&r.top<vh&&r.left<vw))return false;const x=Math.min(vw-1,Math.max(0,r.left+Math.min(r.width/2,8))),y=Math.min(vh-1,Math.max(0,r.top+r.height/2));const t=document.elementFromPoint(x,y);return !!t&&(t===e||e.contains(t)||t.contains(e))};
  const name=e=>(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' "'+(e.textContent||'').trim().slice(0,30)+'"';
  // text elements: contrast, clipping
  const els=[...document.querySelectorAll('body *')].filter(e=>!e.closest('svg')&&!e.closest('#plsvg')&&vis(e));
  for(const e of els){
    const own=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if(!own) continue;
    const cs=getComputedStyle(e);const fg=lum(cs.color);if(!fg)continue;const bg=bgOf(e);
    const cr=(Math.max(fg.L,bg)+.05)/(Math.min(fg.L,bg)+.05);
    const big=parseFloat(cs.fontSize)>=18||(parseFloat(cs.fontSize)>=14&&+cs.fontWeight>=700);
    if(cr<(big?3:4.5)&&!e.disabled&&!e.closest('[disabled]')) out.push(['contrast',cr.toFixed(2),name(e)]);
    if(e.scrollWidth>e.clientWidth+2&&cs.overflow!=='visible'&&cs.textOverflow!=='ellipsis'&&cs.overflowX!=='auto'&&cs.overflowX!=='scroll') out.push(['clipped',e.scrollWidth+'>'+e.clientWidth,name(e)]);
    const r=e.getBoundingClientRect(); if(r.right>vw+1||r.left<-1) out.push(['offscreen-x',Math.round(r.left)+'..'+Math.round(r.right),name(e)]);
  }
  // overlapping buttons
  const bs=[...document.querySelectorAll('button,select,input,label.b')].filter(vis).map(e=>[e,e.getBoundingClientRect()]);
  for(let a=0;a<bs.length;a++)for(let c=a+1;c<bs.length;c++){const [e1,r1]=bs[a],[e2,r2]=bs[c];if(e1.contains(e2)||e2.contains(e1))continue;const ox=Math.min(r1.right,r2.right)-Math.max(r1.left,r2.left),oy=Math.min(r1.bottom,r2.bottom)-Math.max(r1.top,r2.top);if(ox>3&&oy>3){const top=document.elementFromPoint(Math.max(r1.left,r2.left)+ox/2,Math.max(r1.top,r2.top)+oy/2);out.push(['overlap',name(e1),name(e2)])}}
  // tiny touch targets
  for(const [e,r] of bs) if((r.height<26||r.width<26)&&!e.closest('#svg')&&e.type!=='checkbox'&&e.type!=='radio'&&e.type!=='range') out.push(['small-target',Math.round(r.width)+'x'+Math.round(r.height),name(e)]);
  return out;
});
const shot=async n=>{await p.waitForTimeout(700);const f=`${out}/${tag}-${String(++i).padStart(2,'0')}-${n}.png`;await p.screenshot({path:f});const d=await detect();report.push({n,f,d})};
const ct=async(re,sel='button')=>p.evaluate(([s,src])=>{const r=new RegExp(src);const b=[...document.querySelectorAll(s)].find(x=>x.offsetParent&&r.test(x.textContent.trim()));if(b){b.click();return true}return false},[sel,re]);
const closeAll=async()=>p.evaluate(()=>{[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&/^[×✕]$/.test(b.textContent.trim())&&!b.closest('#gsbar')&&!b.closest('.ph')).forEach(b=>b.click())});
const step=async(n,f)=>{try{await f();await shot(n)}catch(e){report.push({n,err:e.message.split('\n')[0]})}};
await step('ditl-view',async()=>{});
await step('ditl-run',async()=>{await ct('^RUN$','#gsbar .seg button')});
await ct('^VIEW$','#gsbar .seg button');
await step('abc-view',async()=>{await ct('^ABC$');await p.waitForTimeout(1200);await p.evaluate(()=>AN.go(AN.sheets.findIndex(s=>s.name==='ABC-010')));await p.waitForTimeout(800)});
await step('abc-sel',async()=>{await p.evaluate(()=>{const sh=AN.sheets[AN.i];const bb=sh.S.blk.find(b=>b.k==='PID')||sh.S.blk[0];AN.sel={blk:bb};AN.selBox&&AN.selBox();AN.paint&&AN.paint();AN.panelUpd(true)})});
await step('legend',async()=>{await ct('^Legend$')}); await ct('^Legend$');
await step('inputs-tab',async()=>{await ct('^Sheets$','#gsbar button'); await ct('^Inputs','#sidetabs button')});
await step('abc-run',async()=>{await ct('^RUN$','#gsbar .seg button');await p.waitForTimeout(1500)});
await step('abc-run-insp',async()=>{await ct('^Inspector$','.hmitabs button')});
await step('zoomed',async()=>{for(let k=0;k<3;k++){await ct('^\\+$','#zbar button');await p.waitForTimeout(200)}});
await step('search',async()=>{if(await p.locator('#srchbtn').isVisible())await p.click('#srchbtn');await p.fill('#ansb','M.0228');await p.waitForTimeout(900)});
await step('infocard',async()=>{await p.press('#ansb','Enter')});
await closeAll(); await p.evaluate(()=>{const c=document.getElementById('infocard');c&&c.remove();document.body.classList.remove('srchopen')});
await step('events',async()=>{await ct('^Events')}); await ct('^Events');
await step('settings',async()=>{await p.locator('.gs-set > button').first().click()});
await p.mouse.click(5,400);
for (const k of ['io','mem','wir','rel','calc']) await step('library-'+k,async()=>{await ct('^Library$');await p.evaluate(k=>{const b=[...document.querySelectorAll('.libtabs button')][['io','mem','wir','rel','calc'].indexOf(k)];b&&b.click()},k)});
await step('plant',async()=>{await ct('^Plant view$')});
await step('plant-fp',async()=>{const r=await p.evaluate(()=>{const e=[...document.querySelectorAll('#plsvg g')].find(g=>/LICBR1001/.test(g.textContent));const b=e&&e.getBoundingClientRect();return b&&[b.x+b.width/2,b.y+b.height/2]});if(r)await p.mouse.click(r[0],r[1])});
await closeAll();
await step('tools',async()=>{await ct('^Tools$')});
for (const [n,re] of [['audit','^Audit'],['health','^Health'],['fx','^F\\(X\\)'],['assumed','^Assumed'],['ditlsig','^DITL signals'],['uat','^UAT$']]) { await closeAll(); await ct('^Tools$'); await step(n,async()=>{await ct(re)}); }
fs.writeFileSync(`${out}/${tag}-report.json`,JSON.stringify({errs,report},null,1));
console.log(tag,'errors',errs.length,'screens',report.length,'findings',report.reduce((a,r)=>a+(r.d?r.d.length:0),0)); await b.close();
