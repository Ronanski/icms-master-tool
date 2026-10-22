// 2.3.0-beta.1 drawing audit, links (docs/versions/v2.5.0/DRAWING_AUDIT.md, DRAWING_TRACE.md): each link that the PDF shows and the reader
// missed now carries its signal (ABC force manual inputs, mode status M / A / R, station wiring, DITL rows FROM ABC, TO DITL 40-xx, row 21A).
// Usage: node tests/regress/audit230.js [html]
const {open}=require('./lib.js');const fs=require('fs');
(async()=>{const {browser,page,errs}=await open(process.argv.find(a=>/\.html$/.test(a))||'dist/'+fs.readdirSync('dist').find(x=>/^logic-sim-v[\d.]+(?:-beta\.\d+)?\.html$/.test(x)));
const r=await page.evaluate(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const g=n=>AN.sheets.find(s=>s.name===n);const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
 const lab=(S,t)=>S.lab.findIndex(l=>l&&String(l.t).trim()===t);const st=(names,k=8)=>{for(let i=0;i<k;i++)for(const n of names)AN.stepSet(g(n),0.5)};
 AN.plantLoad150();st(['ABC-001C','ABC-013','ABC-050']);
 // 001C-1
 {const S=g('ABC-001C').S,rem=lab(S,'FIC-CM.REM'),m=lab(S,'M.2013');const a=S.rt.v[m];S.rt.ext[rem]=0;st(['ABC-001C']);const b=S.rt.v[m];S.rt.ext[rem]=1;st(['ABC-001C']);ok(a===0&&b===1&&S.rt.v[m]===0,'001C: FIC-CM not REMOTE -> M.2013 (HIC-BM force manual) '+a+' -> '+b+' -> back '+S.rt.v[m])}
 // mode aliases
 const mn=(t,k)=>AN.modeNets(t,k).map(([S2,n])=>S2.name+'#'+n);
 ok(mn('TICBR1130',['LOC']).includes('ABC-011#15'),'011: A of TICBR1130 reaches M.0230: '+mn('TICBR1130',['LOC']));
 ok(mn('TICBR1150',['LOC']).includes('ABC-012#15'),'012: A of TICBR1150 reaches M.0240: '+mn('TICBR1150',['LOC']));
 ok(mn('PIC-BASC',['MAN']).includes('ABC-009A#167'),'009A: M of PIC-BASC reaches its wire: '+mn('PIC-BASC',['MAN']));
 // M/A of TICBR1130 through the faceplate path (latch) -> M.0230 -> TICBR1140 force manual
 {const S=g('ABC-011').S;for(const [S2,n] of AN.modeNets('TICBR1130',['LOC']))S2.rt.ext[n]=1;st(['ABC-011']);const a=S.rt.v[15];for(const [S2,n] of AN.modeNets('TICBR1130',['LOC']))S2.rt.ext[n]=0;st(['ABC-011']);ok(a===1&&S.rt.v[15]===0,'011: TICBR1130 LOCAL -> M.0230 '+a+', REMOTE -> '+S.rt.v[15])}
 // 013 via station wiring
 {const P=g('ABC-050').S,T=g('ABC-013').S,i4=lab(P,'I.0400');P.rt.ext[i4]=1;st(['ABC-050','ABC-013','ABC-001C'],6);const a=T.rt.v[19],o=T.rt.v[27];P.rt.ext[i4]=0;st(['ABC-050','ABC-013','ABC-001C'],6);ok(a===1&&o===1,'013: turbine trip I.0400 (S2) -> 013 M.3200 '+a+', house operation OR '+o+', after reset '+T.rt.v[19]+' (unit model '+(window.AN_UNIT?AN_UNIT.on:'?')+')')}
 // world
 WORLD.set(true);const W=WORLD.stat;
 // 3.2.0-beta.3: since 2.5.0-beta.12 the sootblower PLC logic is in the app ((S22)DITL-80S, DITL_SB_AUDIT.md: output 57 = VALVE TORQUE,
 // input row 12 I.024E): "FROM DITL 80S-57" is tied to THAT sheet (CLAUDE.md rule 1), never to the boiler DITL-80 (HRH drain pot)
 const a17=WORLD.idx.ain.filter(q=>q.sh.name==='ABC-017'&&/80/.test(q.ref));
 ok(a17.length===1&&a17[0].ref==='80S-57'&&/DITL-80S$/.test(String(a17[0].d&&a17[0].d.name||a17[0].d)),'LINK-1: ABC-017 "FROM DITL 80S-57" tied to the sootblower sheet, not DITL-80: '+a17.map(q=>q.ref+' -> '+(q.d&&q.d.name||q.d)).join(', '));
 // the PDF ((22)Ditl80S.pdf): output 57 "S/B STEAM SUPPLY MOTOR VALVE TORQUE", TO 80S-12 / 80S-27 / ABC-017
 const d17=a17[0]&&a17[0].d,o17=d17&&d17.rows[a17[0].row],t17=d17?(d17.cells[a17[0].row+':RT']||[]).map(x=>x.t).join(' '):'';
 ok(o17&&50+ +o17.n===57&&/ABC-017/.test(t17),'LINK-1 detail: output '+(o17?50+ +o17.n:'?')+' of 80S, TO '+t17);
 const d21=S.sheets.find(s=>/DITL-21A$/.test(s.name));ok(d21.rows.some(r=>r.n===21),'LINK-2: DITL-21A has row 21: '+d21.rows.map(r=>r.n).join(','));
 const din=WORLD.idx.din;let users=[];din.forEach((m,s)=>m.forEach((srcs,row)=>{for(const q of srcs)if(q.k==='d'&&(q.d===d21||(q.d._inst&&q.d._inst.base===d21))&&+d21.rows[q.row].n===21)users.push(s.name+' r'+s.rows[row].n+' <- '+q.d.name)}));ok(users.length>=6,'LINK-2: output 71 COOLER A REMOTE feeds '+users.length+': '+users.join(', '));
 const d15=S.sheets.find(s=>/DITL-15$/.test(s.name));const r10=d15.rows.findIndex(r=>r.n===10);const s15=(din.get(d15)||new Map()).get(r10)||[];ok(s15.some(q=>q.k==='d'&&/03A/.test(q.d.name)),'LINK-4: DITL-15 row 10 MFT "3A-63" <- '+s15.map(q=>q.d?q.d.name+' out '+(50+ +q.d.rows[q.row].n):q.k).join(','));
 const ds=AN.dsIdx(g('ABC-001C')),S1=g('ABC-001C').S;const tm={};ds.to.forEach((refs,n)=>refs.forEach(r=>tm[r]=AN.nm(S1,n)));ok(tm['DITL 40-06']==='O.0177'&&tm['DITL 40-07']==='M.3109'&&tm['DITL 40-08']==='M.310A'&&tm['DITL 40-09']==='M.310D','LINK-3 001C: '+JSON.stringify(tm));
 const ds8=AN.dsIdx(g('ABC-008')),S8=g('ABC-008').S;const tm8={};ds8.to.forEach((refs,n)=>refs.forEach(r=>tm8[r]=AN.nm(S8,n)));ok(tm8['DITL 40-13']==='M.3107'&&tm8['DITL 40-14']==='M.3108','LINK-3 008: '+JSON.stringify(tm8));
 ok(W.digFix.length===0,'LINK-3: no "TO DITL" by an analog wire left: '+W.digFix.join('|'));
 ok((W.fromAbc||[]).length>=26,'LINK-4: '+(W.fromAbc||[]).length+' DITL rows linked by address / tag: '+(W.fromAbc||[]).join(' | '));
 ok(['r19 <- ABC-009A M.311A = B.0646','r20 <- ABC-009A M.311B = B.066E'].every(x=>(W.fromAbc||[]).some(f=>/DITL-21C/.test(f)&&f.includes(x))),'2.5.0-beta.5 DITL-21C row 19 / 20 FURNACE DP (A) / (B) SIG. ABNORMAL M.311A / B = ABC-009A B.0646 / B.066E (station wiring, memory list 101 / 103, I/O list AI0134 / AI0262)');
 ok(!(W.abcMiss||[]).some(x=>/DITL-21C/.test(x)),'DITL-21C: no row FROM ABC without a source: '+(W.abcMiss||[]).filter(x=>/DITL-21C/.test(x)).join(' | '));
 ok(W.lost.length===0,'lost: '+W.lost.join(' | '));R.push('INFO plc: '+(W.plc||[]).join(' | ')+' ; abcMiss: '+(W.abcMiss||[]).join(' | '));
 // run the world: analog and manual rows
 AN.go(AN.sheets.findIndex(s=>s.name==='ABC-051'));AN.run=true;await sleep(1500);
 const d79=S.sheets.find(s=>/DITL-79$/.test(s.name)),S51=g('ABC-051').S;const c51=AN.hmiCtrls(S51).find(c=>c.tag==='TICMS1022');ok(d79.avw&&Math.abs(d79.avw.r6-S51.rt.v[c51.out])<1,'LINK-4: DITL-79 row 6 analog = TICMS1022.MV '+(d79.avw&&d79.avw.r6)+' / '+S51.rt.v[c51.out]);
 const d115=S.sheets.find(s=>/DITL-115$/.test(s.name));const i17=d115.rows.findIndex(r=>r.n===17),i18=d115.rows.findIndex(r=>r.n===18);
 const S50=g('ABC-050').S,c50=AN.hmiCtrls(S50).find(c=>c.tag==='PICMS1006');const man=()=>S50.rt.st[c50.amt.id].pk!==c50.autoLeg;
 ok(!!(din.get(d115)&&din.get(d115).get(i17)),'LINK-4: DITL-115 row 17 <- '+((din.get(d115)&&din.get(d115).get(i17))||[]).map(q=>q.ref).join(',')+'; row 18 <- '+((din.get(d115)&&din.get(d115).get(i18))||[]).map(q=>q.ref).join(','));
 ok(!!d115._win&&d115._win.has(i17)===man(),'LINK-4: DITL-115 row 17 = PICMS1006 in MANUAL ('+man()+')');
 AN.run=false;return R});
console.log(r.join('\n'));if(errs.length)console.log('FAIL page error '+errs[0]);await browser.close();process.exit(r.some(x=>/^FAIL/.test(x))||errs.length?1:0)})();
