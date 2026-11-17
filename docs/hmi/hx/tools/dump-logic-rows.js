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
await wait(1000);
const res=await page.evaluate(()=>{const o={};const A={'MV-MS1391':'DITL-38 #MV-MS1391','MV-MS1392':'DITL-38 #MV-MS1392','XV-MS1011':'DITL-88','XV-CR1011':'DITL-73','MV-TS1001':'DITL-94','XV-HR1021':'DITL-80','XV-HR1022':'DITL-81','XV-FW1151':'DITL-35','XV-FW1061':'DITL-79','XV-CD1114':'DITL-66','MV-AS1394':'DITL-75'};
 const ser=x=>{try{return JSON.parse(JSON.stringify(x,(k,v)=>typeof v==='function'?undefined:(v&&v.nodeType?undefined:v)))}catch(e){return String(e)}};
 for(const [t,ad] of Object.entries(A)){let I=null,err=null;try{I=LS_DOCK.interlock(ad)}catch(e){err=String(e)}o[t]={ad,I:ser(I),err};
  try{const s=LS_DOCK.dOf(ad);o[t].sheet=s&&(s.name||s.id);o[t].title=s&&(s.title||LS_DOCK.dName(s));
   /* every row of the sheet: service text + live value */
   if(s&&window.DUI){const rows=[];for(let r=0;r<60;r++){let inf=null;try{inf=DUI.rowInfo?DUI.rowInfo(s,r):null}catch(e){}if(inf&&(inf.svc||inf.tag))rows.push({r,svc:inf.svc,tag:inf.tag,io:inf.io,kind:inf.kind,v:(()=>{try{return DUI.rowVal?DUI.rowVal(s,r):null}catch(e){return null}})()})}o[t].rows=rows}}catch(e){o[t].e2=String(e)}}
 o._dui=window.DUI?Object.keys(DUI):[];o._live=Object.keys(LS_LIVE);
 const L=['PICMS1006','TICMS1022','PICAS1005','TICHR1002','HICBR1391','PICHR1391','PICHR1003','TICHR1012','TICHR1002A','HICHR1002A','HICHR1002B'];o._why={};
 for(const t of L){try{o._why[t]={why:ser(LS_LIVE.why&&LS_LIVE.why(t)),kind:ser(LS_LIVE.kind&&LS_LIVE.kind(t)),mode:LS_LIVE.modeOf&&LS_LIVE.modeOf(t),pv:LS_LIVE.pvOf&&LS_LIVE.pvOf(t),sv:LS_LIVE.svOf&&LS_LIVE.svOf(t),mv:LS_LIVE.mvOf&&LS_LIVE.mvOf(t),sheet:LS_LIVE.sheetOf&&LS_LIVE.sheetOf(t),name:LS_LIVE.NAMES&&LS_LIVE.NAMES[t]}}catch(e){o._why[t]={err:String(e)}}}
 return o});
fs.writeFileSync(out,JSON.stringify(res,null,1));
for(const [k,v] of Object.entries(res)){if(k[0]==='_')continue;console.log('==',k,v.ad,v.sheet,'|',v.title,'| I:',JSON.stringify(v.I).slice(0,700),v.err||'',v.e2||'','rows',(v.rows||[]).length)}
console.log('DUI',res._dui.join(','));console.log(JSON.stringify(res._why).slice(0,2500));
await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
