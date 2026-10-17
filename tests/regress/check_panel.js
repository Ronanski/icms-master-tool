// 2.2.0-beta.13: the CHECK panel (src/ui/uat/check.js) runs each plant scenario in the page and every expected result is ✓.
// Also: one address = one value on every sheet of the station (links.js shareExt): I.000F pressed on one sheet reaches the others.
// 2.2.0-beta.14: + cold (M4 step 1: start cold, purge, light-off of burners A / B, water heat-up, pressure 0 -> 30 kg/cm2, Fig 1 rate).
// Usage: node tests/regress/check_panel.js [load|tt|mft|bfwp|idf|paf|hh|cold|coal|share] [html]
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x));
const want=process.argv.slice(2).filter(a=>!/\.html$/.test(a));const SC=want.length?want:['share','tt','mft','bfwp','idf','paf','hh','cold','coal','byp', 'roll','load'];
(async()=>{const {browser,page,errs}=await open(html);let fail=0;const ck=(ok,w)=>{console.log((ok?'PASS ':'FAIL ')+w);if(!ok)fail++};
for(const id of SC){
 if(id==='share'){const r=await page.evaluate(()=>{AN.reset();AN.plantLoad150();const C1=AN.sheets.find(s=>s.name==='ABC-001C');const C=AN.sheets.find(s=>s.name==='ABC-007').S;const n=C.ext.find(e=>String(C.lab[e]&&C.lab[e].t).trim()==='I.000F');C.rt.ext[n]=1;AN.stepSet(C1,0.5);
   /* I.000F "MFT FROM IRP" is an input of EVERY station: the sheets of station 1 (own station or "S1 I.000F") must follow, the other stations keep their own input */
   const scan=()=>{const out=[];for(const sh of AN.sheets){if(!sh.S||/ABC-000/.test(sh.name))continue;const S=sh.S;for(const e of S.ext){const t=String(S.lab[e]&&S.lab[e].t||'').trim();const m=/^(?:S(\d)\s+)?I\.000F$/.exec(t);if(m)out.push([sh.name,m[1]||String(sh.stn),S.rt.force[e]!==undefined?S.rt.force[e]:+S.rt.ext[e]])}}return out};
   const out=scan();const D=AN.sheets.find(s=>s.name==='ABC-050').S;const m=D.ext.find(e=>String(D.lab[e]&&D.lab[e].t).trim()==='S1 I.000F')??D.ext.find(e=>String(D.lab[e]&&D.lab[e].t).trim()==='I.000F');
   const C54=AN.sheets.find(s=>s.name==='ABC-054').S;const k=C54.ext.find(e=>String(C54.lab[e]&&C54.lab[e].t).trim()==='S1 I.000F');if(k!=null)C54.rt.ext[k]=0;AN.stepSet(C1,0.5);
   return {out,back:scan()}});
  const s1=r.out.filter(x=>x[1]==='1'),oth=r.out.filter(x=>x[1]!=='1');
  ck(s1.length>=6&&s1.every(x=>x[2]>0.5),'I.000F ON on ABC-007 reaches every sheet of station 1 ('+s1.length+'): '+s1.map(x=>x[0]+'='+x[2]).join(' '));
  ck(oth.every(x=>x[2]<0.5),'the I.000F of the other stations is their own input, still 0: '+oth.map(x=>x[0]+'(S'+x[1]+')='+x[2]).join(' '));
  const b1=r.back.filter(x=>x[1]==='1');ck(b1.every(x=>x[2]<0.5),'"S1 I.000F" OFF on ABC-054 reaches every sheet of station 1: '+b1.map(x=>x[2]).join(''));
  continue}
 const r=await page.evaluate(async id=>{document.getElementById('chkb').click();const sc=CHECK.SC.find(s=>s.id===id);await CHECK.run(id);const i=CHECK.SC.indexOf(sc);const box=document.querySelectorAll('#chkp .sc')[i];
  return {title:sc.title,head:box.querySelector('table')?box.children[box.children.length-1].firstChild.textContent:'(no result)',rows:[...box.querySelectorAll('table tr')].map(tr=>tr.children[0].textContent+' '+tr.children[1].textContent),live:box.querySelector('.live').textContent}},id);
 console.log('=== '+r.title);for(const l of r.rows)console.log('     '+l);console.log('     '+r.live.replace(/\n/g,'\n     '));
 ck(/^PASADO/.test(r.head),r.title+': '+r.head);
}
ck(!errs.length,'no page error'+(errs.length?': '+errs[0]:''));
console.log(fail?'FAILED '+fail:'ALL PASS');await browser.close();process.exit(fail?1:0)})();
