// 2.3.0-beta.3 drawing audit, data (docs/versions/v2.3.0/DRAWING_TRACE.md beta.3): LICBR1001A range from the drawing, B.0664 -> B.0644,
// M.0154 / M.0156 and M.0164 / M.0166 names. Engine in Node. Usage: node tests/engine/audit230c.js
const {loadEngine}=require('../../tools/engine/node-engine.js');
(async()=>{const {AN}=await loadEngine();AN.plantLoad150();const g=n=>AN.sheets.find(s=>s.name===n);const E=n=>AN.ensure(g(n));
const lab=(S,t)=>S.lab.findIndex(l=>l&&String(l.t).trim()===t);const run=(nm,k=6)=>{for(let i=0;i<k;i++)AN.stepSet(g(nm),0.5)};const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;for(const w of AN.ensure(sh).warn||[])if(/audit/.test(String(w)))R.push('WARN '+sh.name+' '+w)}
{const S=E('ABC-010');const b=S.blk.find(b=>b.id===20);ok(b.p.rlo===-422&&b.p.rhi===820&&b.p.span===1242,'010 LICBR1001A range '+b.p.rlo+' ~ '+b.p.rhi+' span '+b.p.span);}
{const S=E('ABC-008');ok(S.lab[85].t==='B.0644'&&S.drv[85].some(d=>d.k==='LINK'&&d.i[0]===96),'008 AND B74 input = B.0644');const a=S.blk.find(b=>b.id===74);
 for(const n of [96,86,88])S.rt.force[n]=1;run('ABC-008',2);ok(S.rt.v[a.o[0]]===1,'008 three furnace pressure SIG.AB -> AND B74 '+S.rt.v[a.o[0]]+', M.0204 '+S.rt.v[lab(S,'M.0204')]);for(const n of [96,86,88])delete S.rt.force[n];run('ABC-008',2)}
{const S=E('ABC-004B');ok(S.lab[45].t==='M.0154'&&S.lab[11].t==='M.0156','004B labels M.0154 / M.0156');const T=E('ABC-004C');ok(T.lab[18].t==='M.0164'&&T.lab[6].t==='M.0166','004C labels M.0164 / M.0166')}
console.log(R.join('\n'));process.exit(R.some(x=>/^(FAIL|WARN)/.test(x))?1:0)})();
