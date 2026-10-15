# src/ - sources of the DCS Logic Simulator

The simulator is built from these files into ONE html file (`logic-sim-vX.Y.Z.html` in `dist/`). The html is what the Beta / Stable pages, the apk and the exe use, so it works without internet.

**Edit the files here, then run `npm run build`.** Do not edit the html by hand (the Checks run on GitHub fails when the committed html is not exactly what `src/` builds: `npm run check`).

| Folder | Stack (ano ang laman) |
|---|---|
| `index.template.html` | ang page: head, toolbar markup, ang pagkakasunod ng scripts (`@@FILE:` = isang file, `@@LIST:` = mga file ayon sa listahan, `@@VERSION@@` = `version.txt`) |
| `version.txt` | ang version (sumusunod ang pangalan ng html) |
| `boot/` | start-up bago ang app: gunzip, tanong sa update (Stable / Beta), error banner |
| `styles/` | `app.css`, ang itsura ng page |
| `digital/` | ang DITL (digital logic) page, hindi ginagalaw ng ABC work |
| `analog/reader/` | **READER** (DOM-free): binabasa ang drawing (DXF), gumagawa ng blocks, nets, pins, parameters |
| `analog/engine/` | **ENGINE** (DOM-free, tumatakbo mag-isa): compile at step (`compile-step.js`), plant model (`plant.js`), sheets / F(X) / Reset (`sheets.js`), links ng sheets at stepping (`links.js`) |
| `analog/data/` | loader ng built-in data |
| `analog/ui/` | **UI**: diagram canvas at paint, panels, HMI, search, trace, plant window, tables |
| `analog/boot.js` | simula ng analog app at listahan ng `AN.*` na magagamit ng ibang script |
| `analog/order.list` | ang pagkakasunod ng pagdugtong ng analog files (iisang closure pa rin) |
| `data/` | built-in data (drawings, F(X), address list): gzip + base64 text, hindi code |

Sa loob ng `src/ui/`: `shell` (toolbar / drawers), `hmi` (operator faceplate), `theme` (themes), `uat` (in-app UAT at ang dry run nito); ang build ang naglalagay ng mga ito sa html pagkatapos ng mga file sa itaas. Sa labas ng `src/`: `tools/build` (BUILDS), `tools/engine` (engine sa Node), `tests/regress` (TEST).

**Susunod na hakbang ng pag-oorganisa** (isa-isang Beta, walang pagbabago sa behavior): (1) ihiwalay sa `engine/` ang mga function na walang DOM (anBuild, anNets, anCompile, anStep) para tumakbo sa Worker at sa Node; (2) ilipat ang drawing/panel na code sa hiwalay na modules; (3) ilipat sa Worker ang engine para hindi tumigil ang screen sa tablet.

Added by the build after these files (their sources are in `tools/`): `src/ui/shell` (toolbar), `src/ui/hmi` (operator faceplate), `src/ui/theme` (themes), `src/ui/uat` (in-app UAT).

## Commands
- `npm run build` - writes `logic-sim-v<version>.html` (and removes the older ones).
- `npm run check` - builds in a temporary folder and compares with the committed html.
- `npm run dev` - Vite development server (`http://localhost:5173`): the page is built from `src/` and the browser reloads when a file changes.
- `node tools/engine/node-engine.js` - the same simulator code in Node without a browser (see the file; the result is the same as in Chromium: 51 of 51 sheets identical after 30 s of simulation).
