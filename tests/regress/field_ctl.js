// 3.2.3-beta.27 tracker e1 (user 2026-11-10: a cold start without Training): the field actions that only the Training dock had now have a
// control on the HMI. Report only (PASS / FAIL lines), layout C, Cold + Operator, 1366 x 768, screenshots before / after each step in the
// folder given by SHOTS (default: none). Checks: (1) the Y / N faceplate of seawater pump A shows a FIELD button on a missing field
// contact and the row turns OK after EXECUTE; (2) page 07 lower ring header drains 25 % -> AN.fieldState().lhd, CLOSE -> closed;
// (3) M.4008 ALL ON RETRACT = 1 from the lance model (no button needed); (4) page 14 ESP START -> AN.fieldState().esp. No Training is opened.
// Usage: node tests/regress/field_ctl.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const url='file://'+path.resolve(html),SH=process.env.SHOTS||'';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
let fail=0,n=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
const errs=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
const step=(page,sec)=>page.evaluate(sec=>{const C=AN.sheets.find(s=>s.name==='ABC-001C');for(let k=0;k<sec*2;k++){AN.stepSet(C,.5);WORLD.tick(.5)}},sec);
const shot=async(page,t)=>{if(SH){fs.mkdirSync(SH,{recursive:true});await page.screenshot({path:path.join(SH,String(++n).padStart(2,'0')+'-'+t+'.png')})}};
const go=async(page,id)=>{await page.evaluate(id=>lsShellC.openPage(id),id);await wait(2000)};
const exec=async page=>{await page.locator('.fpo-box .fpo-ex:not([hidden]) .fpo-go').first().click({timeout:5000});await wait(400);await step(page,4);await wait(1200)};
try{
 const ctx=await browser.newContext({viewport:{width:1366,height:768}});
 await ctx.addInitScript(()=>{try{localStorage.setItem('ls-shell','c')}catch(e){}});
 const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e.message)));
 await page.goto(url);
 await page.waitForSelector('#scstart',{state:'visible',timeout:60000});
 await page.locator('#scstart .scchips button',{hasText:/^\s*Cold/}).first().click();await page.locator('#scstart .sccard',{hasText:/^\s*Operator/}).first().click();
 await page.waitForFunction(()=>window.AN&&AN.startState&&!AN._loading&&document.body.classList.contains('scov'),null,{timeout:150000});
 await page.evaluate(()=>{if(window.lsSetRun)lsSetRun(true);else if(AN.setRun)AN.setRun(true)});
 await step(page,4);
 const run=await page.evaluate(()=>{try{return !!(AN.run&&!AN.view)}catch(e){return false}});
 if(!run){const b=page.locator('#scstrip button',{hasText:/RUN/}).first();try{await b.click({timeout:3000})}catch(e){}}
 console.log('     state '+await page.evaluate(()=>AN.startState)+', RUN '+await page.evaluate(()=>!!(AN.run&&!AN.view)));
 /* 1. motor Y / N faceplate: FIELD button on a missing field contact */
 await go(page,'CWN');await shot(page,'cw-page');
 await page.locator('[data-yn="SWA"]').first().click();await wait(1500);
 const f0=await page.evaluate(()=>[...document.querySelectorAll('#fpop2 .fpo-il li')].map(l=>({t:l.textContent,bad:l.classList.contains('bad'),fix:[...l.querySelectorAll('.fpo-fix')].map(b=>b.textContent)})));
 const fx=f0.find(r=>r.fix.length);
 await shot(page,'swpa-permissive-before');
 ck(!!fx,'SWP-A permissive: a missing row has a FIELD button ('+(fx?fx.t:'none; rows: '+f0.map(r=>r.t).join(' | '))+')');
 if(fx){
  const rowTxt=fx.t.replace(fx.fix.join(''),'');
  await page.locator('#fpop2 .fpo-il li .fpo-fix').first().click({timeout:8000});await wait(300);await shot(page,'swpa-field-ask');
  await exec(page);await wait(1500);
  const f1=await page.evaluate(()=>[...document.querySelectorAll('#fpop2 .fpo-il li')].map(l=>({t:l.textContent,bad:l.classList.contains('bad')})));
  const same=f1.find(r=>rowTxt.indexOf(r.t.replace(/FIELD:.*?(?=[A-Z]*-?\d|row)/,'').slice(-8))>=0&&r.t.indexOf(rowTxt.split('row')[0].slice(2,20))>=0);
  await shot(page,'swpa-permissive-after');
  ck(!!same&&!same.bad,'after EXECUTE the row is OK: '+(same?same.t:'row not found')+' · bad rows before '+f0.filter(r=>r.bad).length+', after '+f1.filter(r=>r.bad).length);
 }
 await page.keyboard.press('Escape');await page.evaluate(()=>window.LS_FPOP&&LS_FPOP.close());await wait(400);
 /* 2. page 07 lower ring header drains */
 await go(page,'MK07');await shot(page,'drum-page');
 await page.locator('[data-hit="LHD"]').first().click({force:true});await wait(800);
 const t2=await page.evaluate(()=>(document.querySelector('#fpop .fpo-tt')||{}).textContent||'');
 ck(/V-BD1005/.test(t2),'page 07: the ring header drains label opens a FIELD pop-out ('+t2.trim()+')');
 await page.locator('#fpop .fpo-cmd',{hasText:/^25 %$/}).first().click();await wait(200);await shot(page,'lhd-ask');await exec(page);
 const l1=await page.evaluate(()=>({st:AN.fieldState().lhd,val:(document.querySelector('#fpop .fpo-hv')||{}).textContent}));await shot(page,'lhd-25');
 await page.locator('#fpop .fpo-cmd',{hasText:/^CLOSE$/}).first().click();await wait(200);await exec(page);
 const l2=await page.evaluate(()=>AN.fieldState().lhd);await shot(page,'lhd-closed');
 ck(l1.st===true&&l2===false,'drains 25 % -> open '+l1.st+' ('+l1.val+'), CLOSE -> open '+l2);
 await page.evaluate(()=>LS_FPOP.close());await wait(300);
 /* 3. M.4008 ALL ON RETRACT is not a field button: the lance model gives it (plantsw.js, Mina beta.173); read only */
 const r1=await page.evaluate(()=>S.sheets.filter(x=>/^\(S\d+\)DITL-80/.test(x.name)).flatMap(x=>{const o=[];for(let r=0;r<40;r++)if(/ALL ON RETRACT POSITION/.test((DUI.rowInfo(x,r)||{}).svc||''))o.push(DUI.rowVal(x,r));return o}));
 ck(r1.length>0&&r1.every(v=>v===1),'M.4008 from the lance model at Cold with every lance home: ['+r1.join(',')+']');
 /* 4. page 14 ESP */
 await go(page,'MK14');
 const e0=await page.evaluate(()=>AN.fieldState().esp);
 await page.locator('[data-hit="ESP"]').first().click({force:true});await wait(800);await shot(page,'esp-before');
 await page.locator('#fpop .fpo-cmd',{hasText:/^START$/}).first().click();await wait(200);await exec(page);
 const e1=await page.evaluate(()=>AN.fieldState().esp);await shot(page,'esp-after');
 ck(e0===false&&e1===true,'ESP before '+e0+', after START '+e1);
 ck(!errs.length,'no page error '+errs.slice(0,3).join(' | '));
 await ctx.close();
}catch(e){console.log('FAIL crash '+String(e.message).split('\n')[0]);fail++}
await browser.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
