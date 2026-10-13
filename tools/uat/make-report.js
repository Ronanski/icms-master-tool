// Release report PDF (Taglish, portrait A4, dark, cards): node tools/uat/make-report.js
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/node22/lib/node_modules/playwright');
const ver=require('fs').readdirSync('.').find(x=>/^logic-sim-v\d+\.\d+\.\d+\.html$/.test(x)).match(/v(\d+\.\d+\.\d+)/)[1];
const cards=[
['Ano ang laman ng release','Stable',[
 ['Mga file',`logic-sim-v${ver}.html (ang simulator) · Logic-Sim-v${ver}.apk (Android) · Logic-Sim-v${ver}-portable.exe (Windows) · ang report na ito · UAT-v${ver}.html (ang form na sasagutan mo). Isang apk at isang exe lang: Stable.`],
 ['Auto-update at Channel','Ang apk at exe ay naglo-load ng site, kaya nag-a-update sila nang kusa; hindi na kailangang mag-install ulit. Sa loob ng app, sa taas-kanan, may kahon na "Channel: Stable / Beta": ikaw ang pipili. Naaalala ito ng app. Ang Stable ay galing sa main (ikaw ang magpapasya kung kailan). Ang Beta ay para sa pagsubok ng bawat bagong ayos, galing sa branch, at wala sa Releases.'],
 ['Bersyon',`v${ver}: bagong sa bersyong ito ang Channel box (Stable / Beta) sa loob ng app at isang apk/exe lang sa Releases. Ang v1.20.21 ay reference lang (document-references/), hindi ginalaw.`]]],
['Mga naayos sa ABC sheets (sa simpleng salita)','Tapos',[
 ['Mga unit at value','Ang simulator ay nagpapakita ng totoong value (T/H, kg/cm², MW, °C, %, rpm), hindi ng DCS count. Inayos ang paghahalo ng % at T/H sa ABC-001C, 003A–E, 005, 006, 008, 009A/B, 010, 011/012, 002, 057 (F-7 hanggang F-25).'],
 ['Pagpili ng switch','Tama na ang leg na pinipili ng T switch at A/M selector ayon sa label na "1:a / 1:b" (F-19). Ang BU-CMD interlock ay sinusundan ng PID (F-26). Ang force-to-manual pulse ay nananatiling manual (ABC-003A AO0209 = 25 % pagkatapos ng shutdown, F-30). Ang T switch ay walang memory; ang A/M switch ay may (F-34).'],
 ['PID','Ang 136 parameter (PID, MAN, SUMA) ay tugma sa workbook. Gumagana na ang dMVH (limit ng bilis ng MV), TF (filter ng PV), CUT (low cut ng PV) at GAP (dead zone). Inayos ang swap ng CUT/DH sa 64 PID (F-31, F-32).'],
 ['Reset','Hindi na nagko-compound ang rate ng RATE/RAMP sa bawat Reset (F-33).'],
 ['Kulay ng linya','Sa RUN at View: ang napiling leg ng switch ay dilaw at maliwanag; ang hindi napili ay abo (F-28, F-29).']]],
['Saan galing ang basehan','Reference',[
 ['Diagram at mga file','Mga ABC drawing (analog-logic-abc.zip), dcs-io-list.xls, memory-list-101 hanggang 105, linear-curves-fx.xls (89 curve), parameter workbook, flow-compensation.xls, textbook at mga legend. Lahat ay nasa document-references/.']]],
['Ano ang nasubukan na','Pass',[
 ['Awtomatiko','Lahat ng 54 sheet ay tumatakbo sa RUN (30 s). 165 timer, 15 LAG, 105 alarm: tama. 327 T switch, 56 COS, 19 HS/LS: tama ang leg, output at kulay. Mga curve, parameter at AI range: walang pagkakaiba sa workbook. Coal flow sa 6 na punto ng DATA sheet: tama. Hindi bumabagsak ang MV sa dMVH limit.'],
 ['Hindi pa nasubukan sa device','Ang apk at exe sa totoong phone/PC. Ito ang UAT mo.']]],
['Mga dapat mong malaman','Limitasyon',[
 ['Operator input','Ang mode input (.MAN / .LOC / .REM), HMI push button (M.008C/D), CRT mode ng ABC-057, at DITL signal (M.3400 hanggang M.3405) ay galing sa operator o sa DITL. Ikaw ang magse-set sa RUN, hindi ito kabilang sa link ng sheets.'],
 ['Mga pagpapalagay','dMVH ay kada 1 s (DTI) bilang % ng MV range. TF ay first-order filter. CUT ay low cut. GAP ay dead zone ng error. Walang formula sa repo, kaya karaniwang depinisyon ang ginamit. ABC-036 hanggang 039 ay kopya ng ABC-035 (parehong netlist).'],
 ['Mga loop','Ang ilang loop ay hindi magsasara hangga\'t hindi naka-on ang fan, burner o feeder, o hindi naka-auto ang boiler master. Hindi ito bug.']]],
['Susunod: ang UAT mo','Gawin mo',[
 ['Paano',`Buksan ang UAT-v${ver}.html sa phone o tablet. Pindutin ang OK o MALI sa bawat linya. Sa dulo, "Kopyahin ang mga MALI" at i-paste sa chat. Ayusin ko ang bawat MALI.`]]]
];
const html=`<!doctype html><meta charset="utf-8"><style>
@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{background:#10151a;color:#dbe5ec;font:11pt/1.45 'DejaVu Sans',Arial,sans-serif;margin:0}
h1{font-size:19pt;margin:0 0 4px}.sub{color:#8a9aa6;font-size:10pt;margin-bottom:12px}
.card{background:#18212a;border:1px solid #2a3743;border-radius:8px;margin:0 0 12px;padding:10px 14px;break-inside:avoid}
.hd{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #2a3743;padding-bottom:5px;margin-bottom:6px}
.hd b{font-size:13pt;color:#6aaee0}.st{font-size:10pt;font-weight:bold;color:#6fbf8f}.st.w{color:#d8b860}
.k{color:#9bb0bf;font-weight:bold;font-size:10pt;margin-top:7px}.v{margin:0}</style>
<h1>Logic Sim v${ver}: release report</h1><div class="sub">2026-10-13 · Stable · repo Ronanski/icms-master-tool · sa Taglish, para sa user</div>
${cards.map(c=>`<div class="card"><div class="hd"><b>${c[0]}</b><span class="st ${c[1]==='Limitasyon'||c[1]==='Gawin mo'?'w':''}">${c[1]}</span></div>${c[2].map(r=>`<div class="k">${r[0]}</div><p class="v">${r[1]}</p>`).join('')}</div>`).join('')}`;
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage();await p.setContent(html);
const out=`docs/versions/v${ver}/Release-Report-v${ver}.pdf`;await p.pdf({path:out,format:'A4',printBackground:true,margin:{top:'14mm',bottom:'14mm',left:'14mm',right:'14mm'}});console.log(out);await b.close()})();
