// 3.2.0-beta.7 F(X) CURVES page (src/ui/fx/fx.js), what the user asked (2026-10-23): "makikita mo ang table tulad ng sa excel nya, at doon
// ka rin makakapag-edit ng values para malaro mo response ng planta" + an explanation of every linear.
// 1. The F(X) tables button opens the page (not the old paste panel); all the tables of the LINEAR data are listed (STN101 / 102 / 103).
// 2. S1-LN3 COAL CALORIE CORRECTION shows the workbook sheet: 16 rows, row 14 = X 50 / Y 1, row 15 = X 100 / Y 1.2, LX / LY in %, the
//    title block (Ptrn No. S1-LN-03, DWG No. ABC-004A), the axis names of the workbook chart (HS-COAL.MV, COAL CORR. CONSTANT).
// 3. Every table has its explanation (what / from / to / why / change) and "Used on" with a sheet button.
// 4. At 150 MW (HMI snapshot: HS-COAL MV 33.1 % -> 0.932) the FX block on ABC-004A gives 0.932; editing the Y cell of row 14 to 1.1 in
//    the page makes the SAME block give 0.8 + 0.3 x 33.1 / 50 = 0.999 (the plant reads the edit), the row turns yellow, the edit is
//    saved (localStorage ditl.an.lne); Reset this table brings 0.932 back.
// 5. Phone (390 px): the list becomes a select; picking S2-LN12 shows that sheet. No page error.
// Usage: node tests/regress/fx_page.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(String(e.message)));let f=0;const ck=(ok,t)=>{console.log((ok?'PASS ':'FAIL ')+t);if(!ok)f++};
await p.addInitScript(()=>{window.open=()=>null});
await p.goto('file://'+require('path').resolve(html));await p.waitForTimeout(1500);
await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:60000});
await p.evaluate(()=>lsSetTab('operate'));await p.waitForTimeout(800);
await p.evaluate(()=>document.getElementById('load150').click());await p.waitForTimeout(3000);
await p.evaluate(()=>{lsSetTab('logic');AN.go(AN.sheets.findIndex(s=>s.name==='ABC-004A'))});await p.waitForTimeout(1500);
// 1. the button opens the page
const o=await p.evaluate(()=>{const bt=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='F(X) tables');if(!bt)return {err:'no F(X) tables button'};bt.click();
 const ws=document.getElementById('fxws'),old=document.getElementById('anln');return {open:!!ws&&ws.classList.contains('open'),old:!!old&&old.style.display==='block',n:document.querySelectorAll('#fxlist .fxi').length,lt:AN.lnTables().length,g:[...document.querySelectorAll('#fxlist .fxg')].map(x=>x.textContent)}});
ck(o.open&&!o.old&&o.n===o.lt&&o.n>=90&&o.g.join()==='STN101,STN102,STN103','F(X) tables opens the F(X) curves page (old paste panel closed): '+o.n+' tables of '+o.lt+', groups '+(o.g||[]).join(' / ')+(o.err||''));
// 2. the S1-LN3 sheet
await p.evaluate(()=>lsFx('S1-LN3'));await p.waitForTimeout(500);
const s=await p.evaluate(()=>{const R=[...document.querySelectorAll('#fxpaper table.fxdata tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent));const tb=document.querySelectorAll('#fxpaper table.fxtb')[1];
 return {n:R.length,r14:R[13],r15:R[14],tb:tb?tb.textContent:'',ax:[...document.querySelectorAll('#fxpaper .fxaxt')].map(x=>x.textContent),hd:[...document.querySelectorAll('#fxpaper .fxst')].map(x=>x.textContent)}});
ck(s.n===16&&s.r14[0]==='50'&&s.r14[3]==='1'&&s.r14[7]==='50.00%'&&s.r14[8]==='100.00%'&&s.r15[0]==='100'&&s.r15[3]==='1.2'&&/S1-LN-03/.test(s.tb)&&/ABC-004A/.test(s.tb)&&/COAL CALORIE CORRECTION/.test(s.tb),
 'S1-LN3 sheet: '+s.n+' rows, row 14 '+JSON.stringify(s.r14)+', row 15 '+JSON.stringify(s.r15)+', title block has S1-LN-03 / ABC-004A');
ck(s.ax[0]==='HS-COAL.MV'&&s.ax[1]==='COAL CORR. CONSTANT'&&s.hd.join('|')==='STN101 LINEARIZE|S1-LN-03','chart axis names from the workbook: '+JSON.stringify(s.ax)+', header '+JSON.stringify(s.hd));
// 3. explanation of every table
const ex=await p.evaluate(()=>{const miss=[];for(const t of AN.lnTables()){const i=LS_FXINFO[t.key];if(!i||!i.what||!i.from||!i.to||!i.why||!i.change)miss.push(t.key)}
 const h=[...document.querySelectorAll('#fxmain .fxabout h4')].map(x=>x.textContent),u=[...document.querySelectorAll('#fxmain .fxchip')].map(x=>x.textContent);return {miss,h,u}});
ck(!ex.miss.length&&['What it does','Input comes from','Output goes to','Why it is there','If you change it','Used on'].every(x=>ex.h.includes(x))&&ex.u.includes('ABC-004A'),
 'every table has what / from / to / why / change ('+(ex.miss.length?'missing '+ex.miss.join(','):'none missing')+'); S1-LN3 sections '+JSON.stringify(ex.h.slice(0,6))+', used on '+ex.u.join(','));
// 4. edit -> the plant reads it
const out=()=>p.evaluate(()=>{const sh=AN.sheets.find(s=>s.name==='ABC-004A'),t=AN.lnTables().find(x=>x.key==='S1-LN3');const b=sh.S.blk.find(x=>x.k==='FX'&&x.p.tbl===t);return b?{y:+sh.S.rt.v[b.o[0]],x:+sh.S.rt.st[b.id].fxx}:null});
const y0=await out();
ck(y0&&Math.abs(y0.x-33.1)<0.6&&Math.abs(y0.y-0.932)<0.006,'150 MW: LN3 block on ABC-004A input '+(y0&&y0.x.toFixed(2))+' % -> '+(y0&&y0.y.toFixed(4))+' (HMI snapshot 0.932)');
await p.click('#fxpaper td.fxe[data-k="y"][data-i="13"]');await p.keyboard.press('Control+A');await p.keyboard.type('1.1');await p.keyboard.press('Enter');await p.waitForTimeout(1500);
const y1=await out(),st=await p.evaluate(()=>({lne:JSON.parse(localStorage.getItem('ditl.an.lne')||'{}')['S1-LN3'],chg:document.querySelectorAll('#fxpaper tr.chg').length,ly:document.querySelector('#fxpaper td.fxe[data-k="ly"][data-i="13"]').textContent,list:!!document.querySelector('#fxlist .fxi.on i')}));
const want=0.8+0.3*(y0?y0.x:33.1)/50;
ck(y1&&Math.abs(y1.y-want)<0.004&&st.lne&&Math.abs(st.lne.ly[13]-110)<1e-6&&st.chg===1&&st.ly==='110.00%'&&st.list,
 'edit Y row 14 = 1.1 in the page: the block now gives '+(y1&&y1.y.toFixed(4))+' (expected '+want.toFixed(4)+'), LY row 14 '+st.ly+', 1 yellow row, saved in ditl.an.lne, "edited" in the list');
await p.click('#fxreset');await p.waitForTimeout(1500);
const y2=await out();
ck(y2&&Math.abs(y2.y-y0.y)<0.002&&await p.evaluate(()=>!JSON.parse(localStorage.getItem('ditl.an.lne')||'{}')['S1-LN3']&&!document.querySelectorAll('#fxpaper tr.chg').length),'Reset this table: back to '+(y2&&y2.y.toFixed(4))+', the edit is gone');
ck(await p.evaluate(()=>/Live on ABC-004A/.test(document.getElementById('fxlive').textContent)),'live point: '+await p.evaluate(()=>document.getElementById('fxlive').textContent));
// close
await p.click('#fxclose');await p.waitForTimeout(200);
ck(await p.evaluate(()=>!document.getElementById('fxws').classList.contains('open')),'✕ Close closes the page');
// 5. phone
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(800);await p.evaluate(()=>lsFx('S1-LN3'));await p.waitForTimeout(500);
const ph=await p.evaluate(()=>{const s=document.getElementById('fxpick');const lv=getComputedStyle(document.querySelector('#fxws .fxleft')).display;s.value='S2-LN12';s.dispatchEvent(new Event('change'));
 return {sel:getComputedStyle(s).display,lv,hd:[...document.querySelectorAll('#fxpaper .fxst')].map(x=>x.textContent).join('|'),ow:document.documentElement.scrollWidth}});
ck(ph.sel!=='none'&&ph.lv==='none'&&/^STN102 LINEARIZE\|S2-LN-?12$/.test(ph.hd)&&ph.ow<=390,'phone: select instead of the list, S2-LN12 picked -> '+ph.hd+', page width '+ph.ow);
ck(!errs.length,'no page error'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
console.log(f?'FAILED '+f:'ALL PASS');await b.close();process.exit(f?1:0)})();
