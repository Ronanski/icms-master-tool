// 2.5.0-beta.8 (user: "YUNG MGA PAGE LINK SA DITL, DI GUMAGANA DI MAPINDOT"): the FROM / TO column of a DITL row is a page link.
// Click it in View and in Run: the page opens the other end (DITL sheet + item row, or the ABC sheet), the row blinks, ◀ Back returns.
// A cell that names several pages opens a chooser. ABC "FROM / TO DITL" opens the DITL item too. Desktop, tablet, phone.
// Usage: node tests/regress/ditl_pagelink.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const [n,w,h] of [['desktop',1440,900],['tablet',1280,800],['phone',390,844]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:n!=='desktop'});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.addInitScript(()=>{try{localStorage.setItem('ditl.cat','dig');localStorage.setItem('ls-tab','logic');localStorage.setItem('ditl.dp','0')}catch(e){}});
 await page.goto('file://'+require('path').resolve(html));
 await page.waitForFunction(()=>document.body.classList.contains('app2')&&window.DUI&&DUI.link&&S.sheets.length>50,null,{timeout:30000});
 await page.waitForFunction(()=>!document.body.classList.contains('an'),null,{timeout:20000});await page.waitForTimeout(400);
 if(n==='desktop'){
  const p=await page.evaluate(()=>[DUI.refs('28A-77'),DUI.refs('ABC-003A,3B ABC-003C,3D'),DUI.refs('ABC-029,054 35-10,26B-27'),DUI.refs('(3A-63)'),DUI.refs('LOCAL')].map(a=>a.map(r=>r.abc||r.code+'-'+r.nn).join(' ')));
  ck(p[0]==='28A-77',"reads '28A-77' -> "+p[0]);
  ck(p[1]==='ABC-003A ABC-003B ABC-003C ABC-003D',"reads 'ABC-003A,3B ABC-003C,3D' -> "+p[1]);
  ck(p[2]==='ABC-029 ABC-054 35-10 26B-27',"reads 'ABC-029,054 35-10,26B-27' -> "+p[2]);
  ck(p[3]==='03A-63'&&p[4]==='',"reads '(3A-63)' -> "+p[3]+", 'LOCAL' -> none");
 }
 // open the sheet and the row, click the middle of a cell (svg coordinates -> screen)
 const openAt=(sh,row,col)=>page.evaluate(([sh,row,col])=>{const i=S.sheets.findIndex(s=>new RegExp(sh+"$").test(s.name));S.cur=i;sel=null;render();const s=cur(),ri=s.rows.findIndex(r=>+r.n===row),VR=s.vr||s.rng,v=VB[S.cur],cx=(VR[col][0]+VR[col][1])/2,cy=-(s.rows[ri].y+1.2);
  v[2]=60;v[3]=60*innerHeight/innerWidth;v[0]=cx-30;v[1]=cy-v[3]/2;$('svg').setAttribute('viewBox',v.join(' '));const m=$('svg').getScreenCTM(),p=new DOMPoint(cx,cy).matrixTransform(m);return [p.x,p.y]},[sh,row,col]);
 const tap=async([x,y])=>{if(n==='desktop')await page.mouse.click(x,y);else await page.touchscreen.tap(x,y);await page.waitForTimeout(400)};
 const st=()=>page.evaluate(()=>{const s=cur(),f=document.querySelector('#svg rect.plflash');let row=null;if(f){const y=-(+f.getAttribute('y'))-(+f.getAttribute('height'));const ri=s.rows.findIndex(r=>Math.abs(((s.rb&&s.rb[s.rows.indexOf(r)])||[r.y-3.3])[0]-y)<.01);row=ri>=0?+s.rows[ri].n:null}
  const vis=e=>!!e&&e.offsetParent!==null;return {sh:s.name,an:document.body.classList.contains('an'),abc:window.AN&&AN.sheets&&AN.sheets[AN.i]&&AN.sheets[AN.i].name,row,side:f&&+f.getAttribute('x')>(s.vr||s.rng).RS[0]-1?'R':'L',back:vis(document.querySelector('.dui-back')),pick:!document.getElementById('plpick').hidden,sim:SIM}});
 for(const mode of ['View','Run']){
  await page.evaluate(m=>{const b=[...document.querySelectorAll('#gsbar .g-ditl button')].find(b=>m==='View'?b.classList.contains('tb-view'):b.classList.contains('dui-run'));if(b&&b.offsetParent)b.click();else if(m==='Run'&&!SIM)document.getElementById('bmode').click();else if(m==='View'&&SIM)document.getElementById('bmode').click()},mode);await page.waitForTimeout(200);
  // FROM 28A-77 on DITL-01 row 2 (input) -> DITL-28A output row 27
  const fr=await page.evaluate(()=>{const s=S.sheets.find(x=>/DITL-01$/.test(x.name));const i=s.rows.findIndex((r,i)=>(s.cells[i+':F']||[]).some(t=>/^28A-77$/.test(t.t.trim())));return i>=0?+s.rows[i].n:null});
  await tap(await openAt('DITL-01',fr,'F'));
  let r=await st();ck(/DITL-28A$/.test(r.sh)&&r.row===27&&r.side==='R'&&r.back,`${n} ${mode}: DITL-01 row ${fr} FROM 28A-77 opens DITL-28A output row 27 (${r.sh} row ${r.row} ${r.side}, Back ${r.back})`);
  ck(r.sim===(mode==='Run'),`${n} ${mode}: the mode stays ${mode}`);
  await page.click('.dui-back');await page.waitForTimeout(300);r=await st();ck(/DITL-01$/.test(r.sh)&&!r.back,`${n} ${mode}: ◀ Back returns to DITL-01 (${r.sh})`);
  // TO with several pages -> chooser (DITL-03A row with "15-10,20-11 32-10,33-10")
  // (2.5.0-beta.11: the text belongs to row 13 on the PDF but is drawn over the band of row 11; tap it where it is drawn)
  const to=await page.evaluate(()=>{const s=S.sheets.find(x=>/DITL-03A$/.test(x.name));s.nl=netlist(s);const k=Object.keys(s.cells).find(k=>/:RT$/.test(k)&&/15-10,20-11/.test(s.cells[k].map(t=>t.t).join(' ')));const t=s.cells[k].find(t=>/15-10/.test(t.t));const i=s.rows.findIndex(r=>t.y>=r.y-3.3&&t.y<r.y+5.7);return i>=0?+s.rows[i].n:null});
  await tap(await openAt('DITL-03A',to,'RT'));r=await st();
  const items=await page.$$eval('#plpick button',b=>b.map(x=>x.textContent));
  // (2.5.0-beta.11: rows 10 / 11 / 12 of the TO column are one long list of row 13 on the PDF: one chooser with every page)
  const i33=items.findIndex(t=>/DITL-33 item 10/.test(t));
  ck(r.pick&&items.length>4&&items.some(t=>/DITL-15 item 10/.test(t))&&i33>=0,`${n} ${mode}: DITL-03A TO list drawn at row ${to} (row 13 on the PDF) opens a chooser (${items.length} pages)`);
  await page.click('#plpick button >> nth='+Math.max(0,i33));await page.waitForTimeout(300);r=await st();
  ck(/DITL-33$/.test(r.sh)&&r.row===10&&r.side==='L'&&!r.pick,`${n} ${mode}: chooser 33-10 opens DITL-33 input row 10 (${r.sh} row ${r.row} ${r.side})`);
  await page.click('.dui-back');await page.waitForTimeout(300);
  // FROM ABC-006 -> ABC page, Back -> DITL
  const fa=await page.evaluate(()=>{const s=S.sheets.find(x=>/DITL-01$/.test(x.name));const i=s.rows.findIndex((r,i)=>(s.cells[i+':F']||[]).some(t=>/^ABC-006$/.test(t.t.trim())));return i>=0?+s.rows[i].n:null});
  await tap(await openAt('DITL-01',fa,'F'));
  await page.waitForFunction(()=>document.body.classList.contains('an')&&AN.sheets&&AN.sheets[AN.i]&&AN.sheets[AN.i].name==='ABC-006',null,{timeout:30000}).catch(()=>{});
  r=await st();ck(r.an&&r.abc==='ABC-006',`${n} ${mode}: DITL-01 row ${fa} FROM ABC-006 opens the ABC page ABC-006 (${r.an?r.abc:'still DITL'})`);
  await page.evaluate(()=>AN.setCat('dig'));await page.waitForTimeout(300);
  r=await st();ck(r.back,`${n} ${mode}: ◀ Back is shown on the DITL bar after the ABC jump`);
  await page.click('.dui-back');await page.waitForTimeout(300);r=await st();ck(/DITL-01$/.test(r.sh)&&!r.an,`${n} ${mode}: ◀ Back returns to DITL-01`);
 }
 // ABC "FROM DITL 26A-55" -> DITL-26A output row 5, Back -> ABC
 const ab=await page.evaluate(async()=>{AN.setCat('an');for(let k=0;k<100&&!(AN.sheets&&AN.sheets.length>=54);k++)await new Promise(r=>setTimeout(r,100));const j=AN.sheets.findIndex(s=>s.name==='ABC-020');AN.go(j);AN.dsGoRef('26A-55');await new Promise(r=>setTimeout(r,600));
  const s=cur(),f=document.querySelector('#svg rect.plflash');return {an:document.body.classList.contains('an'),sh:s.name,f:!!f}});
 ck(!ab.an&&/DITL-26A$/.test(ab.sh)&&ab.f,`${n}: ABC reference 26A-55 opens DITL-26A and blinks the row (${ab.sh}, blink ${ab.f})`);
 await page.click('.dui-back');await page.waitForTimeout(500);
 const bk=await page.evaluate(()=>({an:document.body.classList.contains('an'),abc:AN.sheets[AN.i].name}));
 ck(bk.an&&bk.abc==='ABC-020',`${n}: ◀ Back returns to ABC-020 (${bk.an?bk.abc:'still DITL'})`);
 ck(!errs.length,n+': no page error'+(errs.length?' '+errs.slice(0,2).join(' | '):''));
 await ctx.close();
}
await browser.close();console.log(fail?'FAIL '+fail:'ALL PASS');process.exit(fail?1:0)})();
