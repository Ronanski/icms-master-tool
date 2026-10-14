// Lists EVERY controller (PID / PIDV) of the 54 sheets with what the operator can do on its faceplate and why not: A/M station, the select signals (and the leg they ask for), manual MV source, SV source.
// Usage: node tests/regress/controllers_table.js [html] > table.json
const {open}=require('./lib.js');const fs=require('fs');
const html=process.argv[2]||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+\.html$/.test(x));
(async()=>{const {browser,page}=await open(html);
const rows=await page.evaluate(()=>{const R=[];for(let i=0;i<AN.sheets.length;i++){const sh=AN.sheets[i];AN.go(i);const S=sh.S;let cs=[];try{cs=AN.hmiCtrls(S)}catch(e){}
 const nm=n=>n<0||n==null?'-':((S.lab[n]&&S.lab[n].t)||('n'+n));
 for(const c of cs){const amt=c.amt,man=c.autoLeg==='A'?'B':'A';
  const sig=amt?((amt.cs&&amt.cs.length>1)?amt.cs.map(q=>nm(q.n)+'->'+(q.A?'A':'B')):(amt.sel>=0?[nm(amt.sel)+'->'+((amt.p&&amt.p.selA)?'A':'B')+(amt.latch?' (latch)':'')]:[])):[];
  const svk=S.ext.includes(c.q.sv)?'external input':c.svSw?'COS (SV T switch)':'from logic (not settable)';
  const mvk=c.manBlk?'MAN station':(c.manNet!=null&&S.ext.includes(c.manNet)?'external/COS value':'none');
  R.push({sheet:sh.name,tag:c.tag,amt:amt?'yes':'NO',autoLeg:c.autoLeg||'-',manLeg:amt?man:'-',signals:sig.join(' ; ')||'-',mv:mvk,sv:svk})}}return R});
console.log(JSON.stringify(rows,null,1));await browser.close()})();
