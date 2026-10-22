// 2.5.0-beta.18 (user: "ung diagram mismo ng ABC at DITL ... gsto ko sana maview lahat kaso ang liliit", chose A + B + C):
// 3.2.0-beta.1: same checks on the 3.2 layout: Width and Focus are on the zoom bar of the drawing, Panel is the ribbon button of the page (ABC: LAYERS · Inspector, DITL: Panel).
// A Focus (button ⛶ Focus / Shift+F): the drawing takes the whole page, the sheet list and the panel are drawers; on exit the panel
//   opens again when it was open before. B mini-map: shown in Focus and when zoomed in; a tap zooms 2× there. C Width: the width of
//   the sheet from the top. ABC and DITL, VIEW and Run, desktop 1280x800 and phone 390x844. The drawing itself is not changed.
// Usage: node tests/regress/view.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const st=()=>page.evaluate(()=>{const cv=document.getElementById('cv').getBoundingClientRect(),m=document.getElementById('lomap'),v=LOVIEW.view(),e=LOVIEW.ext(),
  a=document.getElementById('anp'),d=document.getElementById('dp'),an=document.body.classList.contains('an');
 return {cvw:Math.round(cv.width),W:innerWidth,map:m.style.display==='block',v:v&&v.slice(),e,focus:document.body.classList.contains('lo-focus'),
  pnl:an?!!(a&&a.offsetWidth>0&&!a.classList.contains('min')):!!(d&&d.offsetWidth>0),btn:(document.querySelector('.lo-f')||{}).textContent}});
for(const [W,H] of [[1280,800],[390,844]])for(const cat of ['dig','an'])for(const run of [false,true]){
 const n=W+'x'+H+' '+(cat==='an'?'ABC-010':'DITL-56')+' '+(run?'Run':'VIEW');
 await page.setViewportSize({width:W,height:H});
 await page.evaluate(c=>{try{WORLD.set(false)}catch(e){}AN.setCat(c)},cat);await page.waitForTimeout(cat==='an'?1500:800);
 if(cat==='an')await page.evaluate(()=>AN.go(AN.sheets.findIndex(s=>/ABC-010/.test(s.name))));else await page.evaluate(()=>{S.cur=S.sheets.findIndex(s=>/DITL-56$/.test(s.name));delete VB[S.cur];render()});
 await page.waitForTimeout(500);
 if(run)await page.evaluate(an=>{const g=document.querySelector(an?'#gsbar .g-run':'#gsbar .g-ditl');const b=[...g.querySelectorAll('button')].find(b=>/Run/.test(b.textContent)&&b.offsetHeight);b&&b.click()},cat==='an');
 await page.waitForTimeout(400);
 /* panel open before Focus (desktop) */
 if(W>=1180)await page.evaluate(()=>{const a=LOVIEW.view();const b=[...document.querySelectorAll(document.body.classList.contains('an')?'#gsbar .g-view button':'#gsbar .g-ditl button')].find(x=>/^(Panel|Inspector)$/.test(x.textContent.trim()));const an=document.body.classList.contains('an'),p=document.getElementById(an?'anp':'dp');
  if(!(p&&p.offsetWidth>0&&!p.classList.contains('min')))b.click()});
 await page.waitForTimeout(300);const s0=await st();
 await page.keyboard.press('Shift+F');await page.waitForTimeout(500);const s1=await st();
 ck(s1.focus&&s1.cvw===W&&!s1.pnl&&s1.map&&/Exit focus/.test(s1.btn),n+': Shift+F = Focus, drawing '+s0.cvw+' -> '+s1.cvw+' px wide, panel closed, map shown');
 const ew=s1.e[2]-s1.e[0],eh=s1.e[3]-s1.e[1];
 ck(Math.abs(s1.v[2]-ew)<1&&s1.v[3]>=eh-1||Math.abs(s1.v[3]-eh)<1&&s1.v[2]>=ew-1,n+': Focus fits the whole sheet ('+s1.v.map(Math.round)+' / '+s1.e.map(Math.round)+')');
 const m=await page.evaluate(()=>{const b=LOVIEW.map().getBoundingClientRect();return [b.x+b.width*0.3,b.y+b.height*0.35]});
 await page.mouse.click(m[0],m[1]);await page.waitForTimeout(300);const s2=await st();
 ck(s2.v[2]<=ew/2+1&&s2.v[2]<s1.v[2],n+': tap on the map = zoom 2× there ('+Math.round(s1.v[2])+' -> '+Math.round(s2.v[2])+' wide)');
 await page.evaluate(()=>document.querySelector('.lo-w').click());await page.waitForTimeout(200);const s3=await st();
 ck(Math.abs(s3.v[2]-ew)<1&&Math.abs(s3.v[0]-s3.e[0])<1&&Math.abs(s3.v[1]-s3.e[1])<1,n+': Width = the width of the sheet from the top');
 await page.evaluate(()=>[...document.querySelectorAll(document.body.classList.contains('an')?'#gsbar .g-view button':'#gsbar .g-ditl button')].find(x=>/^(Panel|Inspector)$/.test(x.textContent.trim())).click());await page.waitForTimeout(300);const s4=await st();
 ck(s4.pnl&&s4.cvw===W,n+': Panel opens over the drawing in Focus');
 await page.evaluate(()=>[...document.querySelectorAll(document.body.classList.contains('an')?'#gsbar .g-view button':'#gsbar .g-ditl button')].find(x=>/^(Panel|Inspector)$/.test(x.textContent.trim())).click());await page.waitForTimeout(200);
 await page.evaluate(()=>document.querySelector('.lo-f').click());await page.waitForTimeout(500);const s5=await st();
 ck(!s5.focus&&s5.cvw===s0.cvw&&s5.pnl===s0.pnl&&/^⛶ Focus$/.test(s5.btn),n+': Exit focus = back as before (drawing '+s5.cvw+' px, panel '+(s5.pnl?'open':'closed')+')');
 if(run)await page.evaluate(an=>{const g=document.querySelector(an?'#gsbar .g-run':'#gsbar .g-ditl');const b=[...g.querySelectorAll('button')].find(b=>/^VIEW$/.test(b.textContent.trim())&&b.offsetHeight);b&&b.click()},cat==='an');
 await page.waitForTimeout(300);
}
ck(!errs.length,'no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
