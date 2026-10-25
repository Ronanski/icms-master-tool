// The address table of the machine instances (B / C / D) of the shared DITL drawings (CHECKLIST 0.2, 3.2.0-beta.33).
// A shared drawing ("THE DIAGRAM IS THE SAME FOR BURNER B,C,D") writes the address of every machine on the row: "O.0080/400 O.0720/1040"
// = burner A / B / C / D. When the row has fewer addresses than machines, the address of machine B / C / D is looked up in the I/O list
// and memory lists of the station (the description of the machine A address with the letter of the machine: "#1 Coal feeder-A remote"
// -> "#1 Coal feeder-B remote" = I.0452). Nothing is guessed: a row with no match keeps no address for that machine.
// Usage: node tools/world/inst_addr.js [html]   -> writes src/world/inst-addr.js and docs/versions/v3.2.0/INST_ADDR.md
const {open}=require('../../tests/regress/lib.js');const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');
const html=process.argv.find(a=>/\.html$/.test(a))||path.join(root,'dist',fs.readdirSync(path.join(root,'dist')).find(x=>/^logic-sim-v.*\.html$/.test(x)));
(async()=>{const {browser,page,errs}=await open(html);
await page.waitForFunction(()=>window.WORLD&&WORLD.instOf&&WORLD._h,null,{timeout:60000});
const R=await page.evaluate(async()=>{const A=await AN.ades();const {addrList,cellTxt,relative,LET}=WORLD._h;
 const G=/(?:^|[^A-Z0-9.])(S\d\s*)?([IMOB])\.([0-9A-F]{4})((?:\s*\/\s*(?:[IMOB]\.)?[0-9A-F]{1,4})*)/gi;
 const groups=t=>{const o=[];let m;G.lastIndex=0;t=String(t||'');while((m=G.exec(t))){const p=m[2].toUpperCase()+'.',b=m[3].toUpperCase(),l=[p+b];
  for(const q of (m[4]||'').split('/').map(x=>x.replace(/[IMOB]\./i,'').trim().toUpperCase()).filter(Boolean))l.push(p+(q.length>=4?q:b.slice(0,4-q.length)+q));if(!m[1])o.push(l)}return o};
 const MRX=/\b(BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|COLLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP|LOP|CWP|CP|VALVE|SILO)\s*-?\(?([A-D])\)?(?![A-Z0-9])/gi;
 const CAN=w=>{w=String(w||'').toUpperCase();if(/^(BNR|BURNER)$/.test(w))return 'BURNER';if(/^(IGN|IGNITER|SPARK)$/.test(w))return 'IGNITER';if(/^(COLLER|COOLER)$/.test(w))return 'COOLER';if(/^(FAB|BLOWER)$/.test(w))return 'FAB';if(/^(SWP|SEAWATER)$/.test(w))return 'PUMP';return w};
 /* the letter changes of a row from machine A to machine k: [{w, from, to}] */
 const pairs=(t0,tk)=>{const a=[...String(t0).matchAll(MRX)],b=[...String(tk).matchAll(MRX)];const o=[];a.forEach((m,j)=>{const n=b[j];if(n&&m[2].toUpperCase()!==n[2].toUpperCase())o.push({w:CAN(m[1]),from:m[2].toUpperCase(),to:n[2].toUpperCase()})});return o};
 /* a description with the machine letters of machine k ("#1 Coal feeder-A remote" -> "feeder-B") */
 const TOK=/(\b([A-D])-(?=([A-Z]+)))|(([A-Z]+)\s*-\s*([A-D])\b)|(\b([A-Z]{2,})\s+([A-D])\b(?!-))/gi;
 const swapDesc=(d,P)=>{if(!P.length)return null;const glob={};let ok=true;for(const p of P){if(glob[p.from]&&glob[p.from]!==p.to)ok=false;glob[p.from]=p.to}
  let hit=0;const o=d.replace(TOK,(m,a1,L1,w1,a2,w2,L2,a3,w3,L3)=>{const L=(L1||L2||L3).toUpperCase(),w=CAN(w1||w2||w3);const p=P.find(q=>q.w===w&&q.from===L);const to=p?p.to:ok&&glob[L]?glob[L]:null;if(!to)return m;hit++;
   if(a1)return to+'-';if(a2)return m.replace(/[A-D]$/i,to);return m.replace(/[A-D]$/i,to)});return hit?o:null};
 const norm=t=>String(t||'').toUpperCase().replace(/\s+/g,' ').trim();
 const mask=t=>norm(t).replace(/\b[A-D]-(?=[A-Z])|-\s*[A-D]\b|\b[A-D]\b/g,'#');
 const byDesc={};for(const st in A){byDesc[st]=new Map();for(const k in A[st]){const d=A[st][k]&&A[st][k].d;if(!d)continue;const key=k[0]+'|'+norm(d);if(!byDesc[st].has(key))byDesc[st].set(key,[]);byDesc[st].get(key).push(k)}}
 const MRX1=/\b(?:BFWP|FAB|BURNER|BNR|FEEDER|PUMP|BLOWER|COOLER|COLLER|IGNITER|COMPRESSOR|DRYER|IWP|MWP|DOP|SWBP|SWP|LOP|CWP|CP|VALVE|SILO)\s*-?\(?([A-D])\)?(?![A-Z0-9])/gi;
 const rl=t=>{const a=[...String(t).matchAll(MRX1)];return a.length?a[a.length-1][1].toUpperCase():null};
 const dl=d=>{if(!d)return null;const m=/(?:^|[^A-Z0-9])([A-D])-(?=[A-Z])/i.exec(d)||/\b(?:pump|burner|bnr|feeder|cooler|coller|bfwp|blower|fab|igniter|spark|dryer|fan|silo|compressor|valve)\s*-?\s*\(?([A-D])\)?(?![A-Z0-9])/i.exec(d)||/-([A-D])\d?\b/.exec(d);return m?m[1].toUpperCase():null};
 const out={},rep=[];
 WORLD.instOf.forEach((L,b)=>{if(L.length<2)return;
  const rows=[];b.rows.forEach((r,i)=>{for(const side of ['L','R']){const raw=side==='L'?(cellTxt(b,i,'T')||cellTxt(b,i,'S')):cellTxt(b,i,'RS')+' '+cellTxt(b,i,'RT');const g=groups(raw);if(!g.length)continue;
   const pre=g[0][0][0];rows.push({i,side,g:g.filter(x=>x[0][0]===pre),txt:(side==='L'?cellTxt(b,i,'S')+' '+cellTxt(b,i,'T'):cellTxt(b,i,'RS')+' '+cellTxt(b,i,'RT')).replace(/\s+/g,' ').trim()})}});
  /* the station: the one whose descriptions carry the machine letter of the rows */
  const sc={};for(const st in A){sc[st]=0;for(const x of rows){const d=(A[st][x.g[0][0]]||{}).d,w=rl(x.txt);if(d&&w&&dl(d)===w)sc[st]+=2;else if(d)sc[st]+=0.1}}
  const st=Object.keys(sc).sort((x,y)=>sc[y]-sc[x])[0],D=a=>(A[st][a]||{}).d||'';
  /* a second address group of the same machine (DITL-28A row 6 "M.2608 M.2609" = FAB A motor FRONT / REAR bearing) is another signal of
     machine A, not machine B: the descriptions differ in more than the machine letter */
  const multi=x=>x.g.length>1&&x.g[1].length===1&&x.g[0].length===1&&D(x.g[0][0])&&D(x.g[1][0])&&mask(D(x.g[0][0]))!==mask(D(x.g[1][0]));
  let n=L.length;for(const x of rows)if(!multi(x))n=Math.max(n,Math.min(4,[].concat(...x.g).length));
  const T={n,st:+st,r:{}};out[b.name]=T;
  const fk=k=>({name:b.name+' #'+LET[k],_inst:{base:b,k,n}});
  for(const x of rows){const key=x.side+x.i,e=[],how=[];
   const sigs=multi(x)?x.g.map(l=>[l]):[[].concat(...x.g)];
   for(let k=0;k<n;k++){const tk=k?WORLD.remap(fk(k),x.txt):x.txt,P=pairs(x.txt,tk),me=[];let hw='';
    for(const s of sigs){const all=s.length===1&&Array.isArray(s[0])?s[0]:s;
     if(all.length>=n){me.push(all[k]);hw=hw||'drawing';continue}
     if(k===0){me.push(all[0]);hw=hw||'drawing';continue}
     if(!relative(b,x.txt)&&!P.length){me.push(all[0]);hw=hw||'common';continue}
     /* the list names no machine for this address ("FURNACE DP LOW ( < 1200 mmH2O )(BC FROM S1)", "FA BLOWER STOP COMMAND(BC FROM S4)"):
        one signal for every machine (CLAUDE.md rule 1) */
     if(D(all[0])&&mask(D(all[0]))===norm(D(all[0]))){me.push(all[0]);hw=hw||'common';continue}
     const d0=D(all[0]),sw=d0&&swapDesc(d0,P),hit=sw&&byDesc[st].get(all[0][0]+'|'+norm(sw));
     if(hit&&hit.length){const h=hit.slice().sort((p,q)=>Math.abs(parseInt(p.slice(2),16)-parseInt(all[0].slice(2),16))-Math.abs(parseInt(q.slice(2),16)-parseInt(all[0].slice(2),16)))[0];me.push(h);hw=hw||'iolist';continue}
     if(!P.length){me.push(all[0]);hw=hw||'common';continue}
     hw='none'}
    e.push(me.length&&hw!=='none'?me:null);how.push(hw);
    const old=addrList(x.side==='L'?(cellTxt(b,x.i,'T')||cellTxt(b,x.i,'S')):cellTxt(b,x.i,'RS')+' '+cellTxt(b,x.i,'RT')),oa=old[k]||old[0];
    /* check: every machine named on the row has the same letter in the description of the address */
    let okL=true;if(me[0]&&hw!=='none'){const d=D(me[0]);const tw={};for(const m of String(d).matchAll(TOK)){const L=(m[2]||m[6]||m[9]).toUpperCase(),w=CAN(m[3]||m[5]||m[8]);(tw[w]=tw[w]||new Set()).add(L)}
     for(const m of String(tk).matchAll(MRX)){const w=CAN(m[1]),Lr=m[2].toUpperCase();if(tw[w]&&!tw[w].has(Lr))okL=false}}
    rep.push({sh:b.name,st:+st,key,k:LET[k],txt:tk.slice(0,80),adr:e[k]?e[k].join(' '):'',old:oa,how:hw,desc:e[k]?e[k].map(D).join(' / '):'',ok:okL})}
   T.r[key]=e}
  /* the field tags of machine k (I/O list): "SV-DO1043-A1" of burner A = "SV-DO1043-C1" of burner C (the valve and switch names of the drawing) */
  const tg=[null];for(let k=1;k<n;k++){const m={},bad=new Set();for(const key in T.r){const e=T.r[key];if(!e[0]||!e[k]||e[0].length!==e[k].length)continue;e[0].forEach((a,j)=>{const ta=(A[st][a]||{}).tag,tb=(A[st][e[k][j]]||{}).tag;if(!ta||!tb||ta===tb)return;
   const sa=ta.replace(/^[A-Z]+-/,''),sb=tb.replace(/^[A-Z]+-/,'');if(sa===sb||ta.split('-')[0]!==tb.split('-')[0])return;if(m[sa]&&m[sa]!==sb)bad.add(sa);m[sa]=sb})}
   bad.forEach(x=>delete m[x]);tg.push(Object.keys(m).length?m:null)}
  if(tg.some(Boolean))T.tags=tg});
 return {out,rep}});
const js='/* GENERATED by tools/world/inst_addr.js (3.2.0-beta.33) from the DITL drawings, the I/O list and the memory lists: the addresses\n   of every machine of a shared DITL drawing, per row ("L3" = input row 3, "R4" = output row 4), [machine A, B, C, D] = the address(es)\n   of that machine (null = none on the drawing or in the lists). Do not edit by hand: run the tool again. */\nwindow.INST_ADDR = '+JSON.stringify(R.out)+';\n';
fs.writeFileSync(path.join(root,'src/world/inst-addr.js'),js);
const rep=R.rep,chg=rep.filter(x=>x.k!=='A'&&x.adr!==x.old),bad=rep.filter(x=>!x.ok),none=rep.filter(x=>x.how==='none');
const cnt=h=>rep.filter(x=>x.k!=='A'&&x.how===h).length;
let md='# Address table of the DITL machine copies B / C / D (3.2.0-beta.33)\n\nGawa ng `tools/world/inst_addr.js` (huwag i-edit nang kamay). Pinagmulan: ang address na nakasulat sa drawing (lahat ng grupo, hal. "O.0080/400 O.0720/1040" = burner A / B / C / D), at kapag kulang, ang I/O list at memory list ng station (ang description ng address ng A na may letra ng makina).\n\n';
md+='- Shared drawings: '+Object.keys(R.out).length+', rows × machines: '+rep.length+'\n- Machine B / C / D: drawing '+cnt('drawing')+', I/O / memory list '+cnt('iolist')+', common (iisang signal, hal. MFT) '+cnt('common')+', walang address '+cnt('none')+'\n- Binago kumpara sa dati (beta.32): '+chg.length+'\n- Letra ng description ≠ letra ng makina: '+bad.length+'\n\n';
md+='## Binago (makina B / C / D)\n\n| Sheet | Row | Makina | Text (makina) | Dati | Ngayon | Paano | Description (I/O / memory list) |\n|---|---|---|---|---|---|---|---|\n';
for(const x of chg)md+='| '+x.sh+' | '+x.key+' | '+x.k+' | '+x.txt.replace(/\|/g,'/')+' | '+x.old+' | '+(x.adr||'—')+' | '+x.how+' | '+x.desc.replace(/\|/g,'/')+' |\n';
if(none.length){md+='\n## Walang address (hindi nakasulat sa drawing at walang tugma sa listahan)\n\n';for(const x of none)md+='- '+x.sh+' '+x.key+' '+x.k+': '+x.txt+'\n'}
if(bad.length){md+='\n## Letra hindi tugma\n\n';for(const x of bad)md+='- '+x.sh+' '+x.key+' '+x.k+': '+x.txt+' → '+x.adr+' "'+x.desc+'"\n'}
fs.writeFileSync(path.join(root,'docs/versions/v3.2.0/INST_ADDR.md'),md);
console.log('sheets',Object.keys(R.out).length,'rows x machines',rep.length,'changed',chg.length,'none',none.length,'letter mismatch',bad.length,'errors',errs.length);
for(const x of bad)console.log(' MISMATCH',x.sh,x.key,x.k,x.txt,'->',x.adr,x.desc);for(const x of none)console.log(' NONE',x.sh,x.key,x.k,x.txt);
await browser.close()})();
