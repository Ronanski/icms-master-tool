// Mina F33: Cold, no instrument air. XV-MU1109 stays open (spring opening), the fill stops at V-MU1031, the Guide step goes on to V-CW1001 and
// completes, and the instrument air step sets XV-MU1109 to AUTO. Usage: node tests/regress/mina_f33.js [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
await page.waitForFunction(()=>AN.sheets&&AN.sheets.length>=54&&window.WORLD&&WORLD.idx&&S.sheets.length>=PRE_N,null,{timeout:120000});await page.waitForTimeout(1500);
const r=await page.evaluate(async()=>{await AN.ades();WORLD.set(true);const C=AN.sheets.find(s=>s.name==='ABC-001C');AN.i=AN.sheets.indexOf(C);await AN.plantCold();AN.run=false;
  const run=sec=>{for(let i=0;i<sec*2;i++){AN.stepSet(C,.5);WORLD.live=true;WORLD.tick(.5)}};run(2);
  const L=LS_GUIDE.steps?LS_GUIDE.steps():LS_GUIDE.L;const St=L.find(s=>/fill the expansion tank/.test(s.t)),Sa=L.find(s=>/XV-MU1109 to AUTO/.test(s.t));
  const nxt=()=>{const a=St.a.find(x=>!x.on||!x.on());return a?a.l:''},U=AN.unit,o={n:L.length,auto:!!Sa,idx:[L.indexOf(St),L.indexOf(Sa)]};
  const m=S.sheets.find(x=>x.name.endsWith(')DITL-112'));for(let r=0;r<40;r++){const I=DUI.rowInfo(m,r);if(/REMOTE MODE SELECTED/.test(I.svc||''))m.sig[r+':S']=true}
  const m2=S.sheets.concat(WORLD.inst).find(x=>x.name.endsWith('DITL-112 #B'));for(let r=0;r<40;r++){const I=DUI.rowInfo(m2,r);if(/REMOTE MODE SELECTED/.test(I.svc||''))m2.sig[r+':S']=true}
  run(1);LS_DOCK.dmotor('DITL-112',1);run(3);WORLD.dset('DITL-112 #B',14,true);run(2);
  o.xv=U.muXv;o.fill0=U.muFill;U.etLvl=1.68;run(6);o.lv=U.etLvl;o.next1=St.a.filter(x=>(x.dg||x.fp||x.loc)&&!/^START /.test(x.l)&&(!x.on||!x.on())).map(x=>x.l);
  const pick=t=>St.a.find(x=>x.l.includes(t));pick('CLOSE V-MU1031').f();run(4);o.line=U.muLine;o.fill1=U.muFill;const l1=U.etLvl;run(10);o.held=U.etLvl-l1;
  o.next2=St.a.filter(x=>(x.dg||x.fp||x.loc)&&!/^START /.test(x.l)&&(!x.on||!x.on())).map(x=>x.l);
  pick('OPEN V-CW1001').f();run(130);o.lvP=U.etLvl;o.prime=U.cwPrime;o.next3=St.a.filter(x=>(x.dg||x.fp||x.loc)&&!/^START /.test(x.l)&&(!x.on||!x.on())).map(x=>x.l);
  pick('OPEN V-MU1031').f();U.etLvl=1.68;run(6);pick('CLOSE V-MU1031').f();run(4);
  o.done=St.c.ok?St.c.ok():St.c.f?St.c.f():null;o.cKeys=Object.keys(St.c);
  return o});
console.log(JSON.stringify(r));
ck(r.auto&&r.idx[1]>r.idx[0],'the XV-MU1109 AUTO step comes after the fill, step '+(r.idx[1]+1));
ck(r.xv===1&&r.fill0===1,'no air: XV-MU1109 open, the tank fills');
ck(!(r.next1[0]||'').includes('XV-MU1109 CLOSE')&&(r.next1[0]||'').includes('CLOSE V-MU1031'),'at 1.7 m the next action is V-MU1031: '+r.next1[0]);
ck(r.line===0&&r.fill1===0&&Math.abs(r.held)<1e-6,'V-MU1031 shut stops the fill');
ck((r.next2[0]||'').includes('V-CW1001'),'then V-CW1001: '+r.next2[0]);
ck(r.prime>=1&&r.lvP<1.69,'the priming takes the level down: '+r.lvP);
ck((r.next3[0]||'').includes('OPEN V-MU1031'),'then make up: '+r.next3[0]);
ck(r.done===true,'the step completes with no air: '+r.done+' '+r.cKeys);
ck(!errs.length,'no page error '+errs.slice(0,2).join(' | '));console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
