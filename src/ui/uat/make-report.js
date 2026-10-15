// Release report PDF (Taglish, portrait A4, dark, cards): node src/ui/uat/make-report.js
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
const ver = require('fs')
  .readdirSync('dist')
  .map(x => 'dist/' + x)
  .find(x => /logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x))
  .match(/v(\d+\.\d+\.\d+(?:-beta\.\d+)?)\.html/)[1];
const dry = process.env.DRY || '';
const cards = [
  [
    'Ano ang laman ng release',
    'Stable',
    [
      [
        'Mga file',
        `logic-sim-v${ver}.html (ang simulator) · Logic-Sim-v${ver}.apk (Android) · Logic-Sim-v${ver}-portable.exe (Windows) · ang report na ito. Isang apk at isang exe lang. Ang UAT ay nasa loob ng app (berdeng UAT button).`
      ],
      [
        'Update at channel',
        'Pagbukas, tinitingnan ng app kung may bagong bersyon sa channel mo (Stable o Beta, sa taas-kanan). Kung meron, tatanungin ka: I-update ngayon / Huwag muna.'
      ]
    ]
  ],
  [
    'Ano ang bago mula v1.20.38 hanggang v1.20.59',
    'Tapos',
    [
      [
        'A/M, SV, MV at REMOTE (operator panel)',
        'Sync na ang panel sa switching signals ng drawing: FORCE MANUAL (hindi puwedeng AUTO habang may force; pagkawala ng signal, ang operator ang pipili ng AUTO, hindi automatic). Sa AUTO, ang SV ang ginagalaw. REMOTE / LOCAL para sa 16 controller na may REMOTE sa drawing; ang 52 ay AUTO / MAN lang. 68 sa 68 controller ang tama ang A/M station.'
      ],
      [
        'COS at SCALE CONVERT',
        'Ang COS ay manual operation: B leg ng A/M at SV T switch. Ang SCALE CONVERT ay nagpapakita na ng ratio ng drawing (hal. 1115 / 432). 42 COS na walang gamit ang nasuri sa PDF; sa ABC-005 ang 3 setup COS (density, sulfur, CaCO3) ay nagsisimula sa gitna ng range.'
      ],
      [
        'PV na hindi gumagalaw',
        'Dalawang controller sa iisang PV ay sabay nang nagpapagalaw nito. Ang mga natitira ay interlock ng drawing sa cold start (ext input = 0): may babala sa panel na "OUTPUT PUTOL ng interlock" at button na Sanhi? na naglilista ng input na magpapawala nito.'
      ],
      [
        'Engine at repo (OPLAN-L1PAT)',
        'Hiwalay na ang engine sa page (nasubok: 5128 net, pareho sa buong simulator). Organisado na ang repo: src, tests, tools, delivery, docs, archive.'
      ],
      ['Reset at default', 'Ang Reset ay pareho na ng bagong bukas na app para sa lahat ng sheet.']
    ]
  ],
  [
    'Ano ang nasubukan na',
    'Pass',
    [
      [
        'Awtomatiko (headless)',
        `UAT dry run: ${dry || 'tingnan ang update report'}. Hiwalay na test: switches, reset, PID A/M, faceplate, force manual (68 sa 68), panel sync, values layout, pv_reacts.`
      ],
      [
        'Hindi pa nasubukan sa device',
        'Ang apk at exe sa totoong phone / PC, ang tablet (kasama ang light mode ng tiered stepping), at ang pag-update ng Stable / Beta channel. Ito ang UAT mo.'
      ]
    ]
  ],
  [
    'Mga dapat mong malaman',
    'Limitasyon',
    [
      [
        'Live values',
        'Hindi pa zero: 26 sa 2426 ang malalim na nakapatong sa masisikip na lugar, at may mga nagdidikit lang (text 31, block 78, wire 135). Hindi pa naaayos.'
      ],
      [
        'Hindi pa nagagawa',
        'Excel findings #1 (ilaw HS/LS), #3 (2nd sheet), #6 (ramp vs instant ng HS/LS), #13 (grey analog). 8 ramp block na walang rate sa drawing ay 1 unit/s ang default. ABC-031, 035 ~ 039, 052 at 053: hindi pa na-trace ang A/M sa PDF.'
      ],
      ['Mga pagpapalagay', 'dMVH kada 1 s, TF first-order filter, CUT low cut, GAP dead zone: walang formula sa repo.']
    ]
  ],
  [
    'Susunod: ang UAT mo (nasa loob ng app)',
    'Gawin mo',
    [
      [
        'Paano',
        'Buksan ang app, pindutin ang berdeng UAT button, pumili ng sheet at "Test this sheet" (o "Test ALL sheets"). Gamitin ang 👁 sa bawat case para tingnan mismo.'
      ]
    ]
  ]
];
const html = `<!doctype html><meta charset="utf-8"><style>
@page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{background:#10151a;color:#dbe5ec;font:11pt/1.45 'DejaVu Sans',Arial,sans-serif;margin:0}
h1{font-size:19pt;margin:0 0 4px}.sub{color:#8a9aa6;font-size:10pt;margin-bottom:12px}
.card{background:#18212a;border:1px solid #2a3743;border-radius:8px;margin:0 0 12px;padding:10px 14px;break-inside:avoid}
.hd{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #2a3743;padding-bottom:5px;margin-bottom:6px}
.hd b{font-size:13pt;color:#6aaee0}.st{font-size:10pt;font-weight:bold;color:#6fbf8f}.st.w{color:#d8b860}
.k{color:#9bb0bf;font-weight:bold;font-size:10pt;margin-top:7px}.v{margin:0}</style>
<h1>Logic Sim v${ver}: release report</h1><div class="sub">2026-10-15 · Stable · repo Ronanski/icms-master-tool · sa Taglish, para sa user</div>
${cards.map(c => `<div class="card"><div class="hd"><b>${c[0]}</b><span class="st ${c[1] === 'Limitasyon' || c[1] === 'Gawin mo' ? 'w' : ''}">${c[1]}</span></div>${c[2].map(r => `<div class="k">${r[0]}</div><p class="v">${r[1]}</p>`).join('')}</div>`).join('')}`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(html);
  const out = `docs/versions/v${ver}/Release-Report-v${ver}.pdf`;
  await p.pdf({
    path: out,
    format: 'A4',
    printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '14mm', right: '14mm' }
  });
  console.log(out);
  await b.close();
})();
