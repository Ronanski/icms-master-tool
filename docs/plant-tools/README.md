# Plant tools (HANNI : TUTOR)

Mga tool na hiwalay sa simulator app: bawat isa ay isang web page (claude.ai Artifact, pribado, ang user ang may-ari). Dito nakatago ang source para maituloy ng kahit sinong thread o account. Turnover ng thread: `docs/turnover/HANNI-TUTOR.md`.

Last update: 2026-11-16, 8:20 PM PHT.

## Ang web app (2026-11-16, user: "wala naman app ata sa repo eh. hndi naman artifact pnapagawa ko")

Ang `app/` ang tunay na web app: 15 page, isang home page (`app/index.html`), sariling font file, walang kailangang Claude at walang kailangang internet pagkatapos ng unang bukas.

- Address pagkatapos ma-merge sa main: https://ronanski.github.io/icms-master-tool/tools/ (kinokopya ng `.github/workflows/site.yml` ang `docs/plant-tools/app` sa `/tools/`).
- Na-i-install bilang app sa phone at PC (browser menu: "Install" o "Add to Home screen").
- Sa sariling PC na walang internet: `npx serve docs/plant-tools/app` o anumang web server na nakaturo sa folder.
- Buuin: `node docs/plant-tools/build-app.js`. Kinukuha nito ang mga page sa folder na ito, pinapalitan ang mga link ng Claude ng link sa loob ng app, at isinusulat ang `app/`. Ang Checks ay nagpapatakbo ng `build-app.js --check`: kapag binago ang isang page at hindi binuo ulit ang app, babagsak ang Checks.
- Test: mag-serve ng folder na may `tools/` = `app/` sa port 8765, tapos `node docs/plant-tools/app-test.js`.
- Plant Workbench sa app: ang mga record ay nasa device lang (browser storage), may "Save backup file" at "Load backup file" para mailipat. Hindi ito shared sa ibang tao; ang shared na bersyon ay ang kopya sa Claude.
- Tag Lookup sa app: walang assistant (kailangan nito ang Claude); buo ang card at ang hanap.
- Ang "Three-Dimensional Plant" sa home page ay link pa rin sa Claude (gawa ng ibang thread).
- Hindi nasubok: tunay na phone, pag-install sa tunay na device, at ang tunay na address (lalabas lang pagkatapos ng merge).

Ang mga kopya sa Claude (mga link sa ibaba) ay nananatili; pareho ang laman.

## Ang mga tool

- **Plant Tools List** (`plant-tools-list/plant-tools.html`): listahan ng 16 tool at estado ng bawat isa. https://claude.ai/artifact/CLWF6fLkvX8VNvtbjfYLwS (version 12).
- **Tag Lookup** (`tag-lookup/`): ID card ng bawat isa sa 2,703 hardwired signal ng Unit 1, main test point, logic sheet na gumagamit, at assistant na sumasagot mula sa card lang (walang live data). https://claude.ai/artifact/DxJaK1sZU45T1VNfuJbQTW (version 2, capability `sample`).
- **Signal Path Finder** (`signal-path-finder/`): buong daan ng signal bilang drawing. https://claude.ai/artifact/2A5FFvEhkDPnggoM4i95wk (version 17).
- **Plant Workbench** (`plant-workbench/`): shift log, work orders, calibration record, spare parts, performance, trip analyzer, reports. https://claude.ai/artifact/4fXaZ2RGqamjnCRb9pYXhJ (version 3, capability `db`).
- **Connection Lessons** (`connection-lessons/connection-lessons.html`): 12 aral na "kapag naputol ang koneksyon". https://claude.ai/artifact/NrXakPC4qHBDZagBt3Ztt1.

## Iisang design standard (2026-11-16)

Lahat ng page ay nasa iisang standard (font, laki ng text, kulay, spacing, app bar). Basahin ang `standard/README.md`; ang gumagawa nito ay `standard/std.py` at `standard/hub.py`.

Mga bagong link dahil sa standard:
- Generator Metering Hardware: https://claude.ai/artifact/VDNq62a8JjwcVG21sUsX7K (`tutor-pages/gen-metering-hardware.html`).
- HP-IP Turbine Valves, standard na itsura: https://claude.ai/artifact/KuTyWZpGoB1RsLZGEMGU3A (`tutor-pages/turbine-valves-standard.html`, kapareho ng `turbine-page-v4.html`). Ang lumang link na NRX6XetGGHB3XWh69oZqz8 ay may lumang itsura pa: hindi ito napalitan dahil hindi nabasa nang buo ang live na kopya nito.

## Paano buuin

- Tag Lookup: palitan ang `@@DATA@@` sa `tag-lookup.src.html` ng laman ng `tag-lookup.data.json`. Test: `tag-lookup.test.js` (Playwright, PC at phone, pekeng assistant).
- Signal Path Finder: palitan ang `@@DATA@@` sa `page.src.html` ng laman ng `data.json`. Mga check: `test.js`, `audit.js`, `lab.js`, `tov.js`, `fonts.js`, `sweep.js`, `ff.js`.
- Plant Workbench: palitan ang `@@TAGS@@` sa `page.src.html` ng laman ng `tags.json`. Test: `t.js`, `c.js`, `p.js` (pekeng `db`).
- Plant Tools List at Connection Lessons: isang file, walang build.
- I-publish sa parehong Artifact link para hindi magbago ang link.

## Data at mga tutor page (kasama na, utos ng user 2026-11-16 7:59 PM PHT)

User: "ala ako pake kung private o public. basta dapat andon compilation ang lahat ng tools n gnawa mo pti mga complete turnovers."

- `signal-path-finder/data.json` at ang buong page na `signal-path-finder.html`.
- `tag-lookup/tag-lookup.data.json` at ang buong page na `tag-lookup.html` (ginawa mula sa `data.json` + title ng mga sheet sa `src/data/pre.txt` at `apre.txt`).
- `plant-workbench/tags.json` (787 analog tag, galing sa `src/data/ades.txt`).
- `tutor-pages/`: 11 pang page (Drum Swell Lab, 52G and 52L Lab, Sync Lab, CV Demand Lab, Transfer Lab, AI sa Planta, Gen Voltage B-C Path, Gen Voltage B-C Troubleshooter, Generator metering hardware, HP-IP Turbine Valves, lumang turbine page v4). Link ng bawat isa: `docs/turnover/HANNI-TUTOR.md` seksyon 2.
- Buong turnover: `docs/turnover/hanni/` (isang kumpletong PDF, PDF ng bawat page, mga screenshot, buong usapan).

## Mga babala sa susunod na gagawa

- Logic sheet ng isang tag: gamitin ang field na `logic` ng `data.json`. Huwag mag-scan ng address sa text ng mga sheet: umuulit ang address sa bawat station kaya mali ang lalabas na sheet.
- Ang assistant ng Tag Lookup ay walang live data. Ang live OPC ay kailangan ng approval ng planta at IT.
- Hindi pa nasubok sa tunay na phone ang alinman sa mga page.
