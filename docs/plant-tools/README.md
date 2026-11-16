# Plant tools (HANNI : TUTOR)

Mga tool na hiwalay sa simulator app: bawat isa ay isang web page (claude.ai Artifact, pribado, ang user ang may-ari). Dito nakatago ang source para maituloy ng kahit sinong thread o account. Turnover ng thread: `docs/turnover/HANNI-TUTOR.md`.

Last update: 2026-11-16, 8:10 PM PHT.

## Ang mga tool

- **Plant Tools List** (`plant-tools-list/plant-tools.html`): listahan ng 16 tool at estado ng bawat isa. https://claude.ai/artifact/CLWF6fLkvX8VNvtbjfYLwS (version 10).
- **Tag Lookup** (`tag-lookup/`): ID card ng bawat isa sa 2,703 hardwired signal ng Unit 1, main test point, logic sheet na gumagamit, at assistant na sumasagot mula sa card lang (walang live data). https://claude.ai/artifact/DxJaK1sZU45T1VNfuJbQTW (version 1, capability `sample`).
- **Signal Path Finder** (`signal-path-finder/`): buong daan ng signal bilang drawing. https://claude.ai/artifact/2A5FFvEhkDPnggoM4i95wk (version 16).
- **Plant Workbench** (`plant-workbench/`): shift log, work orders, calibration record, spare parts, performance, trip analyzer, reports. https://claude.ai/artifact/4fXaZ2RGqamjnCRb9pYXhJ (version 2, capability `db`).
- **Connection Lessons** (`connection-lessons/connection-lessons.html`): 12 aral na "kapag naputol ang koneksyon". https://claude.ai/artifact/NrXakPC4qHBDZagBt3Ztt1.

## Paano buuin

- Tag Lookup: palitan ang `@@DATA@@` sa `tag-lookup.src.html` ng laman ng `tag-lookup.data.json`. Test: `tag-lookup.test.js` (Playwright, PC at phone, pekeng assistant).
- Signal Path Finder: palitan ang `@@DATA@@` sa `page.src.html` ng laman ng `data.json`. Mga check: `test.js`, `audit.js`, `lab.js`, `tov.js`, `fonts.js`, `sweep.js`, `ff.js`.
- Plant Workbench: palitan ang `@@TAGS@@` sa `page.src.html` ng laman ng `tags.json`. Test: `t.js`, `c.js`, `p.js` (pekeng `db`).
- Plant Tools List at Connection Lessons: isang file, walang build.
- I-publish sa parehong Artifact link para hindi magbago ang link.

## Wala rito (pribadong plant data)

Public ang repo na ito. Ang dalawang data file na may bagong plant data (terminal mula sa loop diagram K1AU3-E2-0-104, daan ng GCP / TCS signal) ay wala rito:

- `data.json` ng Signal Path Finder: `/mnt/project-files/tutor-2026-11-11/src/data.json`, kopya sa `/mnt/project-files/turnover/hanni/source/`.
- `tag-lookup.data.json`: `/mnt/project-files/plant-workbench/tag-lookup.data.json` (ginawa mula sa `data.json` + title ng mga sheet sa `src/data/pre.txt` at `apre.txt`).
- Ang 13 tutor page, mga PDF, screenshot at buong usapan: `/mnt/project-files/turnover/hanni/`.

Ang `plant-workbench/tags.json` (787 analog tag) ay galing sa `src/data/ades.txt` na nasa repo na.

## Mga babala sa susunod na gagawa

- Logic sheet ng isang tag: gamitin ang field na `logic` ng `data.json`. Huwag mag-scan ng address sa text ng mga sheet: umuulit ang address sa bawat station kaya mali ang lalabas na sheet.
- Ang assistant ng Tag Lookup ay walang live data. Ang live OPC ay kailangan ng approval ng planta at IT.
- Hindi pa nasubok sa tunay na phone ang alinman sa mga page.
