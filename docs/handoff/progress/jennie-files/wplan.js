const fs=require('fs');const F='C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/team-files/hmi-mockups/lisa-worker-plan.html';let s=fs.readFileSync(F,'utf8');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('miss '+a.slice(0,60));s=s.replace(a,b);};
rep('.box.next .st{color:var(--muted)}','.box.next .st{color:var(--muted)}\n.box.done{border-color:var(--done)} .box.done .st{color:var(--done)}\n.ks.ok{color:var(--done);border-color:var(--done)}.ks.part{color:var(--now);border-color:var(--now)}.ks.no{color:var(--bad);border-color:var(--bad)}\n.left{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px}');
rep('<p class="kick">Code Fixer · Lisa · update 9:00 AM PHT, Nov 2</p>','<p class="kick">Code Fixer · Lisa + Winter, Giselle, Ningning · update 4:00 PM PHT, Nov 2</p>');
rep('<i style="width:6%;background:var(--done)"></i><i style="width:22%;background:var(--now)"></i>','<i style="width:72%;background:var(--done)"></i><i style="width:14%;background:var(--now)"></i>');
rep('<div class="stat"><div class="n">3 / 8</div><div class="l">hakbang na ginagawa ngayon</div></div>\n      <div class="stat live"><div class="n">Nov 3<br>~7:00 PM</div><div class="l">simula ng live test (PHT)</div></div>',
'<div class="stat"><div class="n">5 / 8</div><div class="l">hakbang na tapos (0, a, b, c, d)</div></div>\n      <div class="stat live"><div class="n">Naka-hold</div><div class="l">live test: handa na ang build 66a2a27; hinihintay ang listahan ni Lisa at ang desisyon mo</div></div>');
rep('<span class="hv">~1 oras pa</span>','<span class="hv" style="color:var(--done)">TAPOS</span>');
rep('<i style="width:7%;background:var(--now)"></i>','<i style="width:7%;background:var(--done)"></i>');
rep('<i style="width:36%;background:var(--now)"></i></div><span class="hv">~8 oras</span>','<i style="width:36%;background:var(--done)"></i></div><span class="hv" style="color:var(--done)">TAPOS</span>');
rep('<div class="hr big"><span class="hn">c · 96 na pindot + Training coach</span><div class="hb"><i style="width:64%;background:var(--bad)"></i></div><span class="hv">~14 oras</span></div>','<div class="hr"><span class="hn">c · 96 na pindot + Training coach (4 fixer)</span><div class="hb"><i style="width:64%;background:var(--done)"></i></div><span class="hv" style="color:var(--done)">TAPOS</span></div>');
rep('<i style="width:36%;background:var(--next)"></i></div><span class="hv">~8 oras</span>','<i style="width:36%;background:var(--now)"></i></div><span class="hv" style="color:var(--now)">fps na lang</span>');
rep('<span class="hn">Live test, Cold → 150 MW</span><div class="hb"><i style="width:14%;background:var(--next)"></i></div><span class="hv">~3 oras</span>','<span class="hn">Live test: 15 puntos (loop check)</span><div class="hb"><i style="width:14%;background:var(--next)"></i></div><span class="hv">~2 oras</span>');
rep('<h2>Ang pinakamatagal: palitan ng "radyo" ang 96 na direktang kable</h2>','<h2>Tapos na ang pinakamatagal: napalitan na ng "radyo" ang 96 na direktang kable</h2>');
const ok='<i class="ks ok">Code test: pasado · live: hindi pa</i>';
const st=[ok,ok,ok,ok,ok,ok,ok,ok,ok,ok,'<i class="ks part">App folder pasado · device: hindi pa</i>','<i class="ks no">Hindi pa</i>',ok,'<i class="ks no">Hindi pa</i>','<i class="ks part">Kulang: MU 23–25, 038 40–48, 039 50 fps</i>'];
let k=0;s=s.replace(/<i class="ks">Hindi pa<\/i>/g,()=>st[k++]);
rep('<h2>15 puntos: dapat pareho pa rin ang function ng app</h2>','<h2>15 puntos: dapat pareho pa rin ang function ng app</h2>\n    <p class="note" style="margin:-6px 0 14px">"Code test" = awtomatikong paghahambing ng luma at bago (0 diff). "Live" = ikaw ang huhusga, isang step bawat G.</p>');
rep('  <!-- 3. flow -->','  <section class="slide">\n    <p class="kick">Hindi pa tapos · tapat na listahan</p>\n    <h2>Ano pa ang kulang bago masabing "lahat nailipat"</h2>\n    <ul class="left">\n      <li><b>Hindi pa default ang Worker.</b> Bubuksan lang ito ng <code>?worker=1</code>. Ikaw ang magpapasya pagkatapos ng live test.</li>\n      <li><b>Buong listahan ng nasa page pa:</b> tinanong na si Lisa (Training coach, alarms, force list, plant pages, Update now). Hinihintay pa ang sagot.</li>\n      <li><b>fps ≥ 60 sa 6x:</b> HOME 56, 039 50, 038 40–48, MU 23–25. Ginagawa nina Winter (MU) at Ningning (038/039).</li>\n      <li><b>apk / exe sa tunay na device at Update now:</b> inihahanda ni Giselle para masubok nang live.</li>\n    </ul>\n  </section>\n\n  <!-- 3. flow -->');
s=s.replace(/var S=\[[\s\S]*?\n\];/,`var S=[
 {id:'0',t:'Ayusin ang Reset bug',st:'done',when:'tapos · Nov 2 umaga',d:'Pagka-Reset, may naiiwang lumang ayos kaya hindi umaandar ang turbine roll. Naayos (c0c4dac).',ok:'0 diff sa reset_clean at pasado ang 12 CHECK.',a:9,b:11},
 {id:'a',t:'Ihiwalay ang engine',st:'done',when:'tapos · Nov 2 umaga',d:'Ang analog engine (ABC) ay sariling piraso na, may keyframe ng state.',ok:'Pareho ang resulta ng luma at bago, hanggang huling numero.',a:9,b:11},
 {id:'b',t:'Ihiwalay ang DITL logic sa drawing',st:'done',when:'tapos · Nov 2 tanghali',d:'Ang DITL engine at ang iisang mundo ng plant ay hiwalay na sa drawing.',ok:'Pareho pa rin ang resulta at pasado ang lahat ng test.',a:10,b:12},
 {id:'c',t:'Ikabit ang 96 pindot + Training coach',st:'done',when:'tapos · ~3:15 PM',d:'Lisa + Winter (dock, coach), Giselle (ABC sheet, panels, FORCE, tuning, LINEAR), Ningning (DITL view, Library, readers). Lahat dumadaan sa radyo.',ok:'0 diff sa lahat ng radio test, kasama ang Simulate ON/OFF.',a:11,b:15.25},
 {id:'d',t:'Ilipat ang engine sa Worker',st:'now',when:'tapos ang lipat · fps ~6:00 PM',d:'Tumatakbo na ang engine sa totoong Worker (?worker=1), salamin na lang ang page. Tama ang 6x. Ang natitira: fps ≥ 60 sa MU, 038 at 039.',ok:'Pasado lahat at hindi bababa sa 60 fps sa 6x throttle.',a:13,b:18},
 {id:'T',t:'Live test: 15 puntos',st:'next',when:'pagkatapos ng desisyon mo',d:'Si Jisoo, build 66a2a27. Isang step bawat G, ikaw ang huhusga. Walang buong Cold → 150 MW run; loop check ang 15 puntos.',ok:'Pasado ang 15 puntos (maliban sa hindi masusubok, nakalista).',a:16.5,b:19},
 {id:'F',t:'Ayusin lahat ng nakita',st:'next',when:'pagkatapos ng live test',d:'Lahat ng bug na makita sa live test, aayusin bago mag-report.',ok:'Zero na kilalang bug.',a:19,b:21},
 {id:'✓',t:'GO BETA (beta.79)',st:'goal',when:'ikaw ang magpapasya',d:"Itatanong sa iyo. Papasok lang sa main kapag sinabi mong GO BETA.",ok:'',a:21,b:22}
];`);
s=s.replace(/var LBL=\{now:/,"var LBL={done:'Tapos',now:");
rep('show(2);','show(4);');
rep('var T0=8,T1=49,','var T0=8,T1=24,');
rep("COL={now:'var(--now)',","COL={done:'var(--done)',now:'var(--now)',");
s=s.replace(/\[\[12,'12 PM<br>Nov 2'\][^;]*?\]\]/,"[[8,'8 AM'],[12,'12 PM'],[16,'4 PM'],[20,'8 PM'],[24,'12 AM<br>Nov 3']]");
rep('n.style.left=pct(9.25)','n.style.left=pct(16)');
rep('<b>Bantay bawat 30 min</b>','<b>Bantay bawat 15 min</b>');
rep('Gagawa si Lisa ng susunod na hakbang. Hindi siya titigil para maghintay.','Lahat ng session ay may trabaho: Lisa (bantay ng test), Winter at Ningning (fps), Giselle (apk/exe), Rosé (HMI kit), Yuna (facts).');
rep('<div class="rule"><b>Nawalang oras</b>Mga 6 na oras (idle mula 2:48 AM). Kasama na sa mga oras dito.</div>','<div class="rule"><b>Mas maaga</b>Natapos ang c at d nang mga isang araw na mas maaga kaysa sa unang plano (Nov 3), dahil sa 4 na fixer.</div>');
fs.writeFileSync(F,s);console.log('ok',k);
