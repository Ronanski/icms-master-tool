// 2.3.0-beta.2 drawing audit, behaviour (docs/versions/v2.5.0/DRAWING_TRACE.md beta.2): feeder MV high limit MHD, SET SV = 49 T/H on the
// operator SV, oil master 4-leg switch by the burner REMOTE, ramp spans of ABC-002 / 051. Engine in Node (no browser).
// Usage: node tests/engine/audit230b.js
const {loadEngine}=require('../../tools/engine/node-engine.js');
(async()=>{const {AN}=await loadEngine();AN.plantLoad150();const g=n=>AN.sheets.find(s=>s.name===n);const E=n=>AN.ensure(g(n));
const lab=(S,t)=>S.lab.findIndex(l=>l&&String(l.t).trim()===t);const run=(nm,k=6)=>{for(let i=0;i<k;i++)AN.stepSet(g(nm),0.5)};const R=[];const ok=(c,m)=>R.push((c?'PASS ':'FAIL ')+m);
for(const sh of AN.sheets){if(/ABC-000/.test(sh.name))continue;for(const w of AN.ensure(sh).warn||[])if(/audit/.test(String(w)))R.push('WARN '+sh.name+' '+w)}
// MHD
{const S=E('ABC-004B');const b=S.blk.find(b=>b.k==='MAN'&&b.tag==='FICCL1061B');const m=lab(S,'M.3405');run('ABC-004B');const st=S.rt.st[b.id];const am=S.drv[b.i[b.svI]].find(x=>x.k==='AMT');S.rt.force[am.sel]=1;S.rt.force[m]=1;run('ABC-004B',2);st.val=38;run('ABC-004B',2);const a=S.rt.v[b.o[0]];S.rt.force[m]=0;run('ABC-004B',2);st.val=38;run('ABC-004B',2);ok(Math.abs(a-33.32)<0.05&&S.rt.v[b.o[0]]>37.9,'004B MV limit: M.3405=1 -> '+a.toFixed(2)+' T/H, M.3405=0 -> '+(+S.rt.v[b.o[0]]).toFixed(2)+' (MHD '+S.rt.v[b._mhd]+')')}
// SET SV 49
{const S=E('ABC-003A');const b=S.blk.find(b=>b.id===12);const c=lab(S,'M.035C');run('ABC-003A');const v0=S.rt.v[b.b];S.rt.force[c]=1;run('ABC-003A',2);delete S.rt.force[c];run('ABC-003A',8);ok(Math.abs(S.rt.v[b.b]-49)<1e-6&&Math.abs(S.rt.ext[b.b]-49)<1e-6,'003A SET SV: operator SV '+(+v0).toFixed(1)+' -> '+S.rt.v[b.b]+' after the pulse (pre '+JSON.stringify(S.pre[b.b])+')')}
// q4
{const S=E('ABC-003E');const b=S.blk.find(b=>b.id===4);run('ABC-003E');const pk=()=>S.rt.st[b.id].pk;const sw=L=>{const sh=g(L==='A'?'ABC-003A':'ABC-003'+L);const id=L==='A'?48:35;return sh.S.rt.st[id]};
 const o=[];for(const L of 'ABCD'){const st=sw(L);o.push(L+':'+st.pk)}const x=pk();
 // force B remote only
 const SEL={A:'M.0110',B:'M.0111',C:'M.0114',D:'M.0115'};for(const L of 'ABCD'){const T=g('ABC-003'+L).S;T.rt.force[lab(T,SEL[L])]=L==='C'?0:1;if(L==='C')sw('C').fm='A';}for(const L of 'ABCD')run('ABC-003'+L,2);run('ABC-003E',2);const y=pk();o.push('after '+['A','B','C','D'].map(L=>L+':'+sw(L).pk));
 ok(y==='C','003E SI0304 leg: SV switches '+o.join(',')+' leg '+x+'; only C on oil master -> leg '+y+' (sig '+JSON.stringify(b.q4.sig&&b.q4.sig.map(z=>z&&z.tag))+')')}
// spans
{const S=E('ABC-002');for(const id of [76,75]){const b=S.blk.find(b=>b.id===id);R.push('INFO 002 B'+id+' rate '+b.p.rate+' span '+b.p.span+' '+b.p.spanSrc)}const T=E('ABC-051');const b=T.blk.find(b=>b.id===24);R.push('INFO 051 B24 rate '+b.p.rate+' /s span '+b.p.span+' '+b.p.spanSrc);
 ok(Math.abs(S.blk.find(b=>b.id===76).p.rate-2.23)<1e-6&&Math.abs(S.blk.find(b=>b.id===75).p.rate-1.296)<1e-6&&Math.abs(b.p.rate*60-10.02)<0.05,'ramp rates 2.23 / 1.296 T/H/s, 10 C/min')}
console.log(R.join('\n'));process.exit(R.some(x=>/^(FAIL|WARN)/.test(x))?1:0)})();
