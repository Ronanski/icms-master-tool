// 2.5.0-beta.20 (user: "full audit sa UI UX"): the plain bugs of the audit (https://claude.ai/artifact/SRtGY3tupKUE4Aw7fHCn1Z).
// 1 up to 1180 px the right panel (ABC and DITL) is closed at the start and opens on a click on the drawing; 3 a message of the
// status bar stays on its own tab; 4 the ⚙ menu closes with Esc on the ABC page and when 🔍 is pressed, "Symbols:" (not a second
// "Theme:"); 5 the first view of a DITL sheet is its frame (not the loose texts); 6 no "134 DITL" any more.
// Usage: node tests/regress/ui_audit20.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=require('path').resolve(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let f=0;const ck=(c,t)=>{console.log((c?'PASS ':'FAIL ')+t);if(!c)f++};
const page=async(w,h)=>{const mob=w<900;const p=await b.newPage({viewport:{width:w,height:h},isMobile:mob,hasTouch:mob});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+html);await p.waitForTimeout(1500);await p.evaluate(()=>{lsSetTab('logic');AN.setCat('an')});
 await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:90000});await p.waitForTimeout(800);return {p,errs}};
const pnl=p=>p.evaluate(()=>{const an=document.body.classList.contains('an'),e=document.getElementById(an?'anp':'dp');return !!(e&&e.offsetWidth>0&&!e.classList.contains('min'))});
for(const [w,h] of [[800,1280],[390,844],[1280,800]]){
 const {p,errs}=await page(w,h);const n=w+'x'+h;
 await p.evaluate(()=>AN.go(AN.sheets.findIndex(s=>/ABC-010/.test(s.name))));await p.waitForTimeout(800);
 const a0=await pnl(p);
 await p.evaluate(()=>AN.setCat('dig'));await p.waitForTimeout(1000);
 await p.evaluate(()=>{S.cur=S.sheets.findIndex(s=>/DITL-56$/.test(s.name));render()});await p.waitForTimeout(500);
 const d0=await pnl(p);
 if(w<=1180)ck(!a0&&!d0,n+': the panel is closed at the start (ABC '+a0+', DITL '+d0+')');
 else ck(a0&&d0,n+': the panel is open at the start on a wide screen (ABC '+a0+', DITL '+d0+')');
 // a click on an input row of the drawing opens the DITL panel
 const xy=await p.evaluate(()=>{const r=[...document.querySelectorAll('#svg text')].find(t=>/M\.0378/.test(t.textContent));if(!r)return null;const b=r.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]});
 if(xy)await p.mouse.click(xy[0],xy[1]);
 await p.waitForTimeout(500);
 if(w<=1180)ck(await pnl(p),n+': a click on a row opens the DITL panel');
 // 5: first view of DITL-56 = its frame
 const v=await p.evaluate(()=>{const e=LOVIEW.dext(cur());return {v:VB[S.cur].map(Math.round),e:e.map(Math.round)}});
 ck(v.v[0]===v.e[0]&&v.v[2]===v.e[2]-v.e[0],n+': DITL-56 first view = the frame '+v.v+' (frame '+v.e+')');
 ck(!errs.length,n+': no page error '+errs.slice(0,2).join(' | '));await p.close()}
{const {p}=await page(1280,800);
 // 3: a DITL message does not follow to LIBRARY
 await p.evaluate(()=>AN.setCat('dig'));await p.waitForTimeout(800);await p.evaluate(()=>msg('test message on the DITL page'));await p.waitForTimeout(200);
 const m0=await p.evaluate(()=>document.body.classList.contains('hasmsg'));await p.evaluate(()=>lsSetTab('library'));await p.waitForTimeout(300);
 const m1=await p.evaluate(()=>({has:document.body.classList.contains('hasmsg'),hint:(document.querySelector('#sfoot .shint')||{}).textContent}));
 ck(m0&&!m1.has&&/^LIBRARY/.test(m1.hint),'a LOGIC message stays on LOGIC; LIBRARY shows its own hint ('+m1.hint+')');
 await p.evaluate(()=>lsSetTab('logic'));await p.evaluate(()=>AN.setCat('an'));await p.waitForTimeout(800);
 // 4: ⚙ closes with Esc and with 🔍
 const op=()=>p.evaluate(()=>document.querySelector('.gs-set').classList.contains('open'));
 await p.click('.gs-set > button');const g0=await op();await p.keyboard.press('Escape');const g1=await op();
 await p.click('.gs-set > button');await p.waitForTimeout(100);await p.click('#srchbtn');const g2=await op();
 ck(g0&&!g1&&!g2,'⚙ menu: opens '+g0+', Esc closes '+!g1+', 🔍 closes '+!g2);
 const sel=await p.evaluate(()=>[...document.querySelectorAll('select option')].map(o=>o.textContent).filter(t=>/^(Theme|Symbols):/.test(t)));
 ck(sel.includes('Symbols: Colour')&&!sel.includes('Theme: Colour'),'⚙ menu: "Symbols: Colour / Engineering" ('+sel.join(', ')+')');
 // 6
 const t=await p.evaluate(()=>document.documentElement.innerHTML.includes('134 DITL')||document.documentElement.innerHTML.includes('134 sheets'));
 ck(!t,'no "134 DITL" / "134 sheets" text');await p.close()}
await b.close();console.log(f?'FAIL '+f:'ALL PASS');process.exit(f?1:0)})();
