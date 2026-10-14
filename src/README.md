# src/ - sources of the DCS Logic Simulator

The simulator is built from these files into ONE html file (`logic-sim-vX.Y.Z.html` in the repository root). The html is what the Beta / Stable pages, the apk and the exe use, so it works without internet.

**Edit the files here, then run `npm run build`.** Do not edit the html by hand (the Checks run on GitHub fails when the committed html is not exactly what `src/` builds: `npm run check`).

| Path | What it is |
|---|---|
| `index.template.html` | the page: head, toolbar markup, the order of the scripts (`@@FILE:...@@` = a file, `@@INCLUDE:js/analog@@` = all files of a folder in name order, `@@VERSION@@` = `version.txt`) |
| `version.txt` | the version (the html file name follows it) |
| `css/app.css` | styles of the page |
| `js/head-*.js` | start-up scripts: gunzip, update question (Stable / Beta), error banner |
| `js/ditl-app.js` | the DITL (digital logic) page |
| `js/analog/NN-*.js` | the ABC (analog logic) app, ONE closure cut into sections in order: 01 ~ 05 reader and builder of the drawing (blocks, nets, pins), 06 engine (compile and step), 07 plant model, 08 ~ 19 screen (canvas, panels, HMI, search, paint, trace, plant window, tables), 20 boot and the list of `AN.*` functions that other scripts can use |
| `data/*` | built-in data (drawings of DITL and ABC, F(X) tables, address list): gzip + base64 text, not code |

Added by the build after these files (their sources are in `tools/`): `tools/shell` (toolbar), `tools/hmi` (operator faceplate), `tools/theme` (themes), `tools/uat` (in-app UAT).

## Commands
- `npm run build` - writes `logic-sim-v<version>.html` (and removes the older ones).
- `npm run check` - builds in a temporary folder and compares with the committed html.
- `npm run dev` - Vite development server (`http://localhost:5173`): the page is built from `src/` and the browser reloads when a file changes.
- `node tools/engine/node-engine.js` - the same simulator code in Node without a browser (see the file; the result is the same as in Chromium: 51 of 51 sheets identical after 30 s of simulation).
