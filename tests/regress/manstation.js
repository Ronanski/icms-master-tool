// Manual station faceplate (2.0.0): tag (not "MAN"), description, ▲ = 1 unit / ▲▲ = 5 units of the parameter (1 % of the range rounded down to 1, 10, 0.1 ...), held ▲ ramps, no keyboard on touch.
// ABC-015 HICFA1005 (range -1 ~ 101 %). Usage: node tests/regress/manstation.js [html]
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const touch of [false,true]){
 const ctx=await b.newContext({viewport:{width:1280,height:900},isMobile:touch,hasTouch:touch});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.resolve(html));await p.waitForTimeout(1500);await p.evaluate(()=>AN.setCat('an'));await p.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54,null,{timeout:60000});
 await p.evaluate(()=>{AN.go(AN.sheets.findIndex(s=>s.name==='ABC-015'));[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Operator').forEach(b=>b.click());AN.run=true});
 await p.waitForSelector('#opp .fpman',{timeout:20000});await p.waitForTimeout(800);const W=touch?'touch: ':'desktop: ';
 const tags=await p.evaluate(()=>[...document.querySelectorAll('#opp .fpman .tg b')].map(x=>x.textContent));
 ck(tags.length>=12&&!tags.includes('MAN')&&tags.includes('HICFA1005'),W+tags.length+' manual stations, tags: '+tags.slice(0,4).join(', ')+' ...');
 const v=()=>p.evaluate(()=>{const S=AN.sheets[AN.i].S,b=S.blk.find(x=>x.k==='MAN'&&x.tag==='HICFA1005');return S.rt.v[b.o[0]]});
 const btn=t=>p.evaluate(t=>[...document.querySelector('#opp .fpman[data-tag=HICFA1005]').querySelectorAll('button')].find(x=>x.textContent===t).click(),t);
 await p.evaluate(()=>{const S=AN.sheets[AN.i].S,b=S.blk.find(x=>x.k==='MAN'&&x.tag==='HICFA1005');S.rt.st[b.id].val=20;AN.settle()});await p.waitForTimeout(300);
 const v0=await v();await btn('▲');await p.waitForTimeout(300);const v1=await v();await btn('▲▲');await p.waitForTimeout(300);const v2=await v();
 ck(Math.abs(v1-v0-1)<0.01,W+'▲ = +1 unit (range -1 ~ 101 %): '+v0.toFixed(3)+' → '+v1.toFixed(3));
 ck(Math.abs(v2-v1-5)<0.02,W+'▲▲ = +5 units: → '+v2.toFixed(3));
 const box=await p.$('#opp .fpman[data-tag=HICFA1005] button.stp');const bb=await box.boundingBox();
 await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(1500);await p.mouse.up();await p.waitForTimeout(300);const v3=await v();
 ck(v3>=100.9||v3-v2>15,W+'holding ▲▲ for 1.5 s ramps (up to the high limit 101): → '+v3.toFixed(2));
 const ro=await p.evaluate(()=>{const i=document.querySelector('#opp .fpman[data-tag=HICFA1005] input');return i.readOnly&&i.getAttribute('inputmode')==='none'});
 ck(ro,W+'value box does not open a keyboard (▲ ▼ only)');
 ck(errs.length===0,W+'no page error'+(errs.length?' ('+errs[0]+')':''));await ctx.close()}
await b.close();console.log(fail?fail+' FAIL':'ALL PASS');process.exit(fail?1:0)})();
