// Puts the shell (css + js) into the html between markers. Idempotent. Usage: node src/ui/shell/inject.js [html]
const fs = require('fs');
const html =
  process.argv[2] ||
  fs
    .readdirSync('dist')
    .map(x => 'dist/' + x)
    .find(x => /logic-sim-v\d+\.\d+\.\d+(?:-beta\.\d+)?\.html$/.test(x));
let s = fs.readFileSync(html, 'utf8');
const A = '<!--SHELL-BEGIN-->',
  B = '<!--SHELL-END-->';
const i = s.indexOf(A);
if (i >= 0) {
  const j = s.indexOf(B);
  s = s.slice(0, i) + s.slice(j + B.length);
}
/* fonts built into the app (offline), OFL licences in src/ui/fonts (1.23.0) */
const FD = __dirname + '/../fonts/',
  FACES = [
    ['Inter', 'inter', [400, 600]],
    ['JetBrains Mono', 'jetbrains-mono', [400, 600]],
    ['IBM Plex Sans', 'ibm-plex-sans', [400, 600]],
    ['IBM Plex Mono', 'ibm-plex-mono', [400, 600]],
    ['Roboto', 'roboto', [400, 500]],
    ['Roboto Mono', 'roboto-mono', [400, 600]],
    ['IBM Plex Sans Condensed', 'ibm-plex-sans-condensed', [400, 500, 600]],
    ['Barlow Semi Condensed', 'barlow-semi-condensed', [400, 500, 600]]
  ],
  fontCss = FACES.map(([fam, f, ws]) =>
    ws
      .map(
        w =>
          "@font-face{font-family:'" +
          fam +
          "';font-style:normal;font-weight:" +
          (ws.includes(600) && w === 500 ? 500 : w === 500 ? '500 700' : w === 600 ? '600 700' : w) +
          ';font-display:swap;src:url(data:font/woff2;base64,' +
          fs.readFileSync(FD + f + '-latin-' + w + '-normal.woff2').toString('base64') +
          ") format('woff2')}"
      )
      .join('')
  ).join('');
const block =
  A +
  '<style id="fontcss">' +
  fontCss +
  '</style><style id="shellcss">' +
  fs.readFileSync(__dirname + '/app.css', 'utf8') +
  fs.readFileSync(__dirname + '/../fx/fx.css', 'utf8') +
  fs.readFileSync(__dirname + '/home.css', 'utf8') +
  fs.readFileSync(__dirname + '/../training/dock.css', 'utf8') +
  fs.readFileSync(__dirname + '/../ladder/ladder.css', 'utf8') +
  '</style><script id="shelljs">' +
  fs.readFileSync(__dirname + '/ditl.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/app.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/info.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/layout.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/view.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/cr.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/why.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.7: F(X) curves page */
  fs.readFileSync(__dirname + '/../fx/fx-info.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.9: In operation and AUTO / MANUAL for each table */
  fs.readFileSync(__dirname + '/../fx/fx-ops.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.11: On the HMI, If it is wrong, and the rise / fall effect of the Try it slider */
  fs.readFileSync(__dirname + '/../fx/fx-hmi.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/../fx/fx-paths.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/../fx/fx.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.8: HOME and TRAINING pages (Guided Workbench) */
  fs.readFileSync(__dirname + '/../training/pr-ope-5002.js', 'utf8') +
  '\n' +
  /* 3.2.0 R9 #81: the Tag no. / Operating Limits / NOTE of each step (tools/training/extract_limits.py) */
  fs.readFileSync(__dirname + '/../training/pr-ope-5002-lim.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.10: Live Training (auto / field / TCS steps, the sync and load-up sections) */
  fs.readFileSync(__dirname + '/../training/live.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.21: guided Training (one step at a time, actions on the card, the coach) */
  fs.readFileSync(__dirname + '/../training/guide.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.23: the Training dock (guided start-up beside the app) */
  fs.readFileSync(__dirname + '/../training/dock.js', 'utf8') +
  '\n' +
  fs.readFileSync(__dirname + '/home.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.9: one VIEW | RUN rule (VIEW locks only force / switches / operation) */
  fs.readFileSync(__dirname + '/viewlock.js', 'utf8') +
  '\n' +
  /* 3.2.0-beta.25: ladder view (preview) of a DITL sheet, made from its logic */
  fs.readFileSync(__dirname + '/../ladder/ladder.js', 'utf8') +
  '</script>' +
  B;
const k = s.lastIndexOf('</body>');
fs.writeFileSync(html, s.slice(0, k) + block + s.slice(k));
console.log('shell injected into', html);
