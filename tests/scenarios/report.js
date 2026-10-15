// Gumagawa ng madaling basahing talaan (Taglish) ng mga scenario para suriin ng user (DCS engineer): node tests/scenarios/report.js > docs/scenarios/<sheet>.md
const fs=require('fs'),path=require('path');
for(const f of fs.readdirSync(__dirname).filter(f=>/^ABC-.*\.json$/.test(f))){const s=JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
 console.log(`# ${s.sheet} · ${s.title}\n\nPDF: ${s.pdf}\n\nBasahin at itama kung may mali sa pagkakaintindi ko sa drawing. Ang bawat linya na may "Inaasahan" ay sinusuri ng test sa mismong simulation engine.\n`);
 for(const c of s.scenarios){console.log(`## ${c.id} · ${c.title}\n\n**Sa drawing:** ${c.drawing}\n\n| # | Gawin / Tingnan | Inaasahan | Bakit |\n|---|---|---|---|`);let n=0;
  for(const st of c.steps){n++;const what=st.say||st.do||st.expect;const act=st.do?('GAWIN: '+what+(st.tag?` (${st.tag}${st.value!==undefined?' = '+st.value:''})`:st.value!==undefined&&st.do!=='wait'?` = ${st.value}`:st.s?` ${st.s} s`:'')):('TINGNAN: '+what);console.log(`| ${n} | ${act} | ${st.expect?st.value:''} | ${st.why||''} |`)}console.log('')}}
