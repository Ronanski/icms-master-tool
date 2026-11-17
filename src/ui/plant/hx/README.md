# HX plant pages: handoff for the next coder

**IN THE APP since 2026-11-17 (user: "Ganyan ang HMI na gsto ko. Dapat iyan lang makita ko n mga itsura. Ung temporary at old hmi, aalisin na").** This folder moved from `docs/hmi/hx/` to `src/ui/plant/hx/`. `src/ui/hmi/inject.js` puts `hx.css`, `hx-real.js`, `hx-core.js`, `hx-registry.js`, every page file and `hx-app.js` into the app. `hx-app.js` is the real adapter of section 5 (read its head comment): each HX page is a page of the Plant view, values / controllers / valves come from the same resolvers as the temporary pages, clicks open the faceplates of the app. A new page file must be added to the list in `inject.js` (and to `ORDER` in `tools/build.mjs`). Pages in the app: `hx-page-reheat.js`, `hx-page-boiler-steam.js`, `hx-page-feedwater.js`, `hx-page-condensate.js`, `hx-page-furnace-gas.js`, `hx-page-combustion-air.js`, `hx-page-coal.js`, `hx-page-oil-burners.js`, `hx-page-aux-steam.js`, `hx-page-extraction.js`, `hx-page-turbine-oil.js`, `hx-page-sea-water.js`, `hx-page-makeup-cooling.js`, `hx-page-turbine.js`, `hx-page-purge-trip.js` (2026-11-17). A page id is the id of the page plan in `hx-pages.js` (drum-steam, feedwater, condensate ...), so the links between pages work. Machines: `hx-app.js` takes the description of a machine from the temporary page that binds it (`LS_MOCK.defs`); when a temporary page is removed, keep its `mach` and `unit` data. Not in the app: `hx-cards*.js`, `hx-sample.js`, `hx-pages.js`, `hx-sym.js`. The temporary page of a system is removed only when its HX page works in the app.

Made 2026-11-16 on the order of the user: "gawan ng mga HMI pages ... lahat ng planta macocover pati operator controls at trend", "BE ORIGINAL WALA KA DAPAT GAGAYAHIN", "hmi shell lang ... no need to integrate sa app, pero dapat retrofit ready", "babase ka lang sa available data".

**Where it stands (2026-11-17).** The user rejected the look twice: first the 23 summary pages ("nakahiwalay ang controls, valves"), then the full drawing of the reheat system because it looked like a P&ID: **"wag yung parang P&ID ha. realistic with animation ha. magaan din dapat sa app"**. The answer is the REALISTIC look of section 6d, first on ONE page, `hx-page-reheat.js`.

**The user accepted the look (2026-11-17): "ok na sige na. gawin mo na rin yung iba pang HMI page. dapat sa HMI pages, ayan yung nakikita, wala na ibang style."** So: (1) every page is drawn in the realistic look, one system after the other, by the method of 6d; (2) NO other style is shown: the mockup holds only realistic pages. The 23 earlier summary pages (`hx-pages.js`, line symbols `hx-sym.js`) are out of the mockup; they stay in the folder only as the list of what each system holds (machines, loops, values, trend pens) and their titles are listed grey in the rail as "to be drawn". Delete both files when the last system is drawn. (3) The placement follows the plant as the control room shows it (user: "i-align mo rin sa kung paano actual sa field ... yung pwestuhan ng mga equipment"): on the reheat page the boiler is on the left and the turbine on the right as on screen 005, and the turbine train is HP, ILP, generator from left to right as on screen 035.

## 1. What this is

- A **mockup of a new HMI shell**: 23 pages for the whole plant, each with three views: **Process** (the drawing), **Controls** (every loop, machine and on / off valve of the page) and **Trends** (pen groups).
- It is **not in the app**. Nothing under `src/` or `dist/` was changed. The app build does not read this folder.
- It is **retrofit ready**: the pages never touch the simulator. Every number, state and click goes through one object, `HX.data`. The mockup fills it with sample data; the app fills it with the real signals (section 5).
- The design is original: it copies neither the control room screens, nor the 19 temporary pages, nor another DCS. Only the CONTENT (which machine, which tag, which loop) comes from the app.
- At hand-over: 23 pages; all 63 control loops and all 168 machines and valves of the registry are on a page; 190 of its 401 value keys are used (the rest are second and third transmitters of the same point). `tools/build.mjs` prints this line again.

## 2. Files (all in `docs/hmi/hx/`)

- `hx.css`: every colour and font as a token (light and dark).
- `hx-sym.js`: the line symbol set of the 23 summary pages (pump, fan, valve, damper, drum, heater, furnace, cyclone, turbine ...). One drawing per kind of equipment.
- `hx-real.js`: the REALISTIC symbol set (section 6d): valves with their actuators, drain pot, desuperheater, silencer, controller, louver damper, the turbine set cut open on its foundation with the condenser, the back pass of the boiler cut open with the reheater coils. A page with `look: 'real'` is drawn with these.
- `hx-page-reheat.js`: the sample page in the realistic look (Reheat steam and turbine bypass). `hx-cards.js` (GENERATED) and `hx-cards-ui.js`: the two mini pop-ups (section 6c).
- `hx-core.js`: the engine. Lays a page out, draws it, keeps it live, records trends. Knows nothing about the simulator.
- `hx-pages.js`: the 23 pages as short descriptions. This is the file to edit for content.
- `hx-registry.js`: GENERATED. Every machine, valve and loop that the app binds today on its temporary pages (name, English text, DITL sheet or controller tag, source page and id) and one set of values = what the app showed at "Start at 150 MW" (3.2.3-beta.272).
- `hx-sample.js`: the sample adapter of the mockup (answers `HX.data` from the registry, opens a sample faceplate). Replaced in the app.
- `hx-mockup.html`: GENERATED one-file mockup (this is what the artifact shows).
- `tools/build.mjs`: checks the pages and builds `hx-mockup.html`.
- `tools/dump-live150.js`, `tools/make-registry.py`, `tools/summary.json`, `tools/live150.json`: how the registry was made.

## 3. How to see it and how to check it

```
node docs/hmi/hx/tools/build.mjs
```

- Prints the coverage line and stops with exit 1 when a page names a tag, machine, loop or valve that is not in the registry.
- Writes `hx-mockup.html`. Open it in a browser, or publish it as an artifact (the file is already in artifact form: no doctype, title at the top).
- The engine also warns in the browser console when a page link or a join names something that does not exist.

## 4. Design rules (keep them when you add pages)

1. A page reads left to right, one stream per lane. The medium gives the colour of the line; no medium uses the red or green of a state.
2. RUN / OPEN = red, STOP / CLOSED = green, TRIP = blinking red, no signal = grey and `-----`. Y = red = permissive complete, N = green.
3. Words first: plain English name in bold, the tag small under it. No acronym as a label. Units on every number.
4. Manual mode is the one that stands out (amber pill). Auto is quiet. Remote is blue.
5. Only meaningful motion: a rotor turns while its machine runs, dashes move on a line while it flows. `prefers-reduced-motion` stops both.
6. Two faceplates per equipment: a click on the equipment = CONTROL; the small Y / N square = PERMISSIVE, TREND, MONITOR.
7. The size of the text never changes: a summary page is 1280 units wide and grows downwards; a realistic page is 1760 x 1000 (16 : 9), so it fits one screen with nothing to scroll.
8. No value is typed into a page. A page names a key; the adapter gives the number. No source = `-----`.

## 5. Putting it in the app (the retrofit)

The work is ONE new file, the real adapter. `hx-core.js`, `hx-sym.js`, `hx-pages.js` and `hx.css` go in unchanged.

### 5.1 The contract

```
HX.data = {
  time()                 // seconds of simulation time (trend x axis)
  value(key)             // number or null. key = the tag exactly as the app pages use it in data-v,
                         //   or 'SHEET|ADDRESS' (for example 'ABC-002|SI0060')
  machine(name)          // { st: 'run' | 'stop' | 'trip' | null, mode: 'Remote · Auto' | null, perm: true | false | null }
  loop(tag)              // { pv, sv, mv, mode: 'AUTO' | 'MANUAL' | 'REMOTE', unit } or null
  valve(tag)             // { pct, open, mode }
  flag(key)              // true | false | null, for the Y / N lists. key = 'DITL-01|row text'
  open(kind, id, second) // kind 'mach' | 'loop' | 'valve'; second = true -> the Y / N faceplate
}
```

`HX.mount(element, pageId, { go: id => ..., noTimer: true })` returns `{ tick, show, destroy }`. In the app call `tick()` from the refresh of the plant page instead of the 1 s timer, and `destroy()` when the page closes. `HX.shell` is only the frame of the mockup: the app has its own frame (layout C).

### 5.2 Where the real signals are

Every entry of `HXREG.machines` carries `page` and `id` (for example `BFWP-A`: page `MK06`, id `PA`) and `bind` = the same fields the temporary page uses (`ad` DITL sheet or address, `mov`, `tcs`, `io`, `cur` ...). So the adapter can ask the runtime of the temporary pages (`src/ui/plant/hmi-mock.js`) for exactly the value it already shows:

- value of a tag (`data-v`): the logic transmitter when a sheet has it, else the plant model key of `def.unit`.
- machine state: `LS_DOCK.mst`, mode: `LS_DOCK.modeOf`.
- controller PV / SV / MV / mode: `LS_LIVE.pvOf`, `svOf`, `mvOf`, `modeOf`.
- MOV / XV position: the `data-mov` hook (`pct`, `oc`, `md`).
- faceplates: `LS_FPOP.hit`, `LS_FPOP.motor`, `LS_FPOP.mov`, `LS_FPOP.valve`, `LS_FPOP.tcs`, the Y / N one `LS_FPOP.yn`; controllers: `fpOpen` of `src/ui/plant/plant.js`.

These names are read from the head comment of `hmi-mock.js` and from the live objects of the app (3.2.3-beta.272). **The arguments of each call were NOT read by this thread** (the helper agents ran out of quota): read them in `hmi-mock.js`, `fp-pop.js` and `src/ui/training/live.js` before writing the adapter. The cleanest way is to make `hmi-mock.js` export its own resolvers and call those, so HX and the temporary pages can never show two different numbers.

### 5.3 Steps

1. Copy the 4 source files into `src/ui/plant/` and add them to the script list the build reads (`src/index.template.html`, the `@@LIST` files). Add the two generated dark blocks of `hx.css` to the theme switch of the app (the app does not use `data-theme` / `prefers-color-scheme` the same way: map the `--hx-*` tokens there).
2. Write `hx-app.js` = `HX.data` (5.1, 5.2). Keep `hx-registry.js` only for the `bind` data; drop its `sample` part.
3. Register each HX page as a plant page (`window.PLANT_SYS`, see how `hmi-mock.js` registers its pages) and mount with `HX.mount` into an HTML element over the page area.
4. Fonts: set `--hx-font`, `--hx-cond`, `--hx-mono` to the fonts the app already embeds (IBM Plex Sans, IBM Plex Sans Condensed, IBM Plex Mono are in `src/ui/fonts`).
5. Trend recorder: `HX.rec` samples every 2 s of `HX.data.time()` and keeps 2 h. It must be sampled while the page is closed too: call `HX.rec.sample()` from the simulation tick (also in Worker mode), and `HX.rec.watch(key)` for the pens of all pages at start.
6. Y / N lists (`def.lists`, page 03): map each row text to its DITL row in `flag(key)`.
7. Keep the 19 temporary pages until the user says otherwise: they are the pages of the loop check.
8. Rules of the repo still hold: version bump, `npm run build`, `npm run check`, screenshots of the real app, `HANDOFF.md`, no merge without the GO of the user.

## 6. How to add or change a page

Edit `hx-pages.js`. A page is lanes; a lane is one stream; an array inside a lane is equipment in parallel.

```
page({
  id: 'feedwater', group: 'Water and steam', title: 'Feedwater', about: 'one sentence',
  lanes: [
    { med: 'water', label: 'Feedwater', items: [
      E('deaerator', 'Deaerator', 'T-1104', [V('Level', 'LT-CD1104-1', 'mm', 0)]),
      [M('pump', 'BFWP-A', 'Boiler feed pump A', [V('Current', 'IT-P1115A', 'A')]),
       M('pump', 'BFWP-B', 'Boiler feed pump B', [V('Current', 'IT-P1115B', 'A')])],
      C('FICFW1007', 'Main feedwater valve', { pv: 't/h' }),
      L('drum-steam', 'To economizer')
    ] }
  ],
  loops: [['LICBR1001', 'Drum level, three element']],   // on the Controls view only
  trends: [{ title: 'Drum level', pens: [['Drum level', 'pv:LICBR1001B', 'mm', 0]] }]
});
```

- `E(symbol, name, tag, values, options)` equipment that is not operated. `M(symbol, machine, name, values, options)` a machine of the registry. `C(loop, name, options)` a control valve (or `sym: 'damper'`, `sym: 'block'`) with its loop. `X(valve, name)` an on / off valve. `L(pageId, text)` a link. `V(label, key, unit, decimals)` a value; key `pv:TAG`, `sv:TAG`, `mv:TAG` reads a loop.
- Lane options: `med` (medium), `label`, `flow` (when the dashes move: `m:MACHINE`, `x:VALVE`, `l:LOOP`, `v:KEY>n`, `a|b`), `noline` (a row of items with no line), `rev` (right to left), `cut: [i]` (no line after column i).
- Item options: `id` (for joins), `at` (x position 0 to 100), `lab: 'r' | 'l'` (words beside the symbol), `w`, `h`, `r` (size), `tag`, `go` (click opens a page), `on` (state colour from a flow rule), `level: [key, low, high]`, `pin` / `pout` (which port the lane line uses).
- `joins: [{ from: 'id.port', to: 'id.port', med, via: 'h' | 'v' | 'hv' | 'vh', mid, flow }]` for a line between lanes.
- New kind of equipment: add one function to `hx-sym.js` (drawn around 0, 0; returns `svg`, `ports`, `box`).
- New machine or tag in the app: run `tools/dump-live150.js` on the built app, then `tools/make-registry.py`.

## 6b. A page as a plan (the full operator drawing)

The user did not accept the first 23 pages as operator graphics (2026-11-17): only the main line had pipes; spray valves, drains and vents stood in a row with no line. `hx-page-reheat.js` is the sample of the answer: a page drawn as a **plan**, where every valve, spray, drain pot and transmitter sits on its own line. New pages should be made this way; the lane pages are a summary level only.

- `plan: { h, items, pipes, taps, texts, signals }` instead of `lanes` (`w` = width when it is not 1280, `look: 'real'` = the realistic look of 6d).
- `items`: the same `E`, `M`, `C`, `X`, `L` with `x`, `y` (the drawing is `w` wide, `h` high). `rot: -90` or `90` turns a valve onto a vertical line (with -90 the actuator points left; port `r` is then the top end and `l` the bottom end). `lab: 't' | 'b' | 'l' | 'r'` = where the words go. `cname` = the longer name used on the Controls view.
- `pipes`: `{ med, w, flow, pts, to, arrow }`. A point is `'id.port'` or `[x, y]`; `null` keeps the x or y of the point before. Two points not in line get a right-angle bend. `to: 'flash chamber'` ends the pipe with an arrow and that word.
- `taps`: a transmitter on its line: `{ x, y, side, label, key, key2, unit, dp, tag }` (`key2` shows two transmitters as `a / b`).
- `signals`: thin dashed control signal between items. `texts`: free words (`cls: 'hx-name' | 'hx-zone' | 'hx-note'`).
- An item of the flow diagram that the app does not bind yet is drawn with `E` (grey, tag shown), never left out and never given an invented signal.
- Method that was used for the reheat page, to repeat for every page: (1) read the flow diagram sheet(s) of the system and write down the order of every item along every line; (2) list what the control room page of that system shows (content only); (3) take the tags the app binds from `hx-registry.js`; (4) place and connect; (5) run a check for words over words, pipes and symbols (0 allowed); (6) have someone who did not draw it compare the page with the flow diagram, connection by connection.
- The reheat sample was compared with both sheets by three checkers that did not draw it (2026-11-17). They confirmed the order along the cold reheat and hot reheat lines and every tag, and found 3 wrong and 9 missing items; all were fixed (main steam stop valve and its bypass, drain pots DP-MS01 and DP-MS02, MV-AS1394, the taps after the low pressure bypass, XV-HR1010-1, the pressure tap on the common main steam line, the reheater with its inlet header below and outlet header on top). What is still left out, and why, is listed in the head comment of `hx-page-reheat.js`.
- Flow diagrams: private repo `Ronanski/icms-plant-documents`, `flow-diagram-K1AU3-A1-0-001.zip`: use the RB file (Rev D) when the sheet is in it. Drawing list on page 2 ~ 4 of each PDF. Reheat = `K1AU3-PD-012`, main steam = `K1AU3-PD-011`.

## 6d. The realistic look (`hx-real.js`, `look: 'real'`)

User 2026-11-17: "wag yung parang P&ID ha. realistic with animation ha. magaan din dapat sa app". What that became:

**The picture.** The page shows the plant as it stands, not a diagram: the large equipment is drawn as steel bodies CUT OPEN so the inside shows (turbine rotor and blade rows, condenser tube bundle and hotwell, the gas passes of the boiler with their tube banks), on its foundation, at its real place (turbine hall on the left, boiler on the right). The lines are pipes (a body with a light edge, bends, cladding joints; cold steel grey while nothing flows, the colour of the medium while it flows). A valve is a body between two flanges with its real kind of actuator (diaphragm, electric, air cylinder, hand wheel, spring loaded safety valve, turbine valve chest); the body takes the state colour. A transmitter stands on its line with a small display.

**What moves** (CSS only, `hx.css` section REAL; nothing moves that is not running or flowing):
- dashes in a pipe while its flow rule is true; the direction marks painted on the big pipes
- the blade rows and the steam through the turbine while the shaft turns (`on: 'v:SI-TB>50'`), the exhaust steam falling into the condenser, the surface of the hotwell
- the flue gas going down each pass while its damper is open, the steam through the reheater coils
- the mark on a valve stem rises with the opening, the blades of a louver damper turn with it (the core sets `[data-stem]` and `[data-blr]`; CSS eases the move)
- the spray mist in a desuperheater while its spray valve is open, the steam cloud over a silencer while its vent valve is open
- `prefers-reduced-motion` stops all of it; the browser stops it by itself when the page or the Process view is hidden.

**Light on the app, measured** (headless Chromium, software drawing, 1920 x 1080, `node` + CDP `Performance.getMetrics`, 10 s): the reheat page is 1 437 SVG elements, about 38 running animations at the 150 MW state, main thread busy **6 to 9 %** (two runs), script 0.1 %. For comparison the earlier single-equipment mockup `docs/hmi/mockups/038-air-preheater-v15.html` is 598 elements, 26 animations, 7.5 % on the same machine. How it stays light: plain SVG shapes, no picture file, no filter, no blur, no shadow; 4 shared gradients and 1 pattern for the whole document (`HXREAL._defs`); moving dashes run in steps of about 20 pictures a second (`steps()` in the animation), which paints a third of a smooth 60; a large piece is ONE symbol with few paths (all blade rows of a casing are one path, all economizer banks one path). Source sizes: `hx-real.js` 21 KB, the page 24 KB. **Budget for a new page: under 1 500 SVG elements and under 10 % main thread on that measure.** Measure again when you add a symbol.

**How a page uses it** (all in `plan`):
- `look: 'real'`, `w: 1760`, `h: 1000`.
- A large piece is an item with `under: true` (the pipes pass in front of it) and `sc` (scale, e.g. 1.3). Pipes join it at its named ports (`'tg.hpIn'`, `'bp.rin'` ...): the list is at each symbol in `hx-real.js`.
- Same items as before (`E`, `C`, `X`, `L`); `kind` of a valve picks the actuator: `control`, `motor`, `shutoff`, `manual`, `check`, `safety` (three safety valves with their silencers), `plain` (a turbine valve chest). `sym: 'louver'` a gas damper, `sym: 'ctl'` a controller shown as a small instrument, `spray` a desuperheater (`flow` = the rule that shows the mist, `noz: 'b'` nozzle below, `flip` steam right to left), `vent` a silencer (`flow` = the rule that shows the cloud), `pot` a drain pot.
- Pipes: `w` = size (the page uses 8 for the reheat lines, 6 main steam and bypass, 4 small steam, 3.4 water, 2.8 drains); `tox` / `toy` move the word at the end of a pipe. Taps: `dx` moves the words of a tap sideways, `digits` sets the width of its display.
- A new symbol: one function in `hx-real.js`, drawn around (0, 0), returning `{ svg, ports, box }`; use the classes listed at the top of that file (no colour in the symbol). A part that should move only while something flows goes inside `live(rule, ...)`.

**What is from a source and what is only a picture** (also at the top of `hx-real.js`): the arrangement of the back pass is from the FHI boiler manual (Part 2 Sect 1: back pass with division wall, reheater pass with 4 reheater banks and 1 economizer bank, superheater pass with 3 finishing superheater banks and 3 economizer banks, 1 economizer bank in the common duct; Part 4 Sect 3 Fig. 1: reheater in the front pass, inlet header below, outlet header on top; "gas biasing dampers which control the flow of flue gas across the reheater") and the I/O list (TT-FG1100 ~ 1113 name the banks); the two turbine casings on one shaft are from K1AU3-PD-011 / -012 (HP TURBINE, ILP TURBINE). The number of blade rows, the shape of the casings, the inside of the condenser and the foundation are a picture only: `document-references/` has no section drawing of the turbine or the condenser (NO-SOURCE). The boiler general arrangement K1AU3-B-0-001 ~ 008 is on the PC of the user only; when it is at hand, check the back pass against it.

**Method for the next page** (what was done for the reheat page): the six steps of 6b, then (7) decide which equipment of the system is the picture (one or two large cut-open pieces) and where it stands in the plant; find its arrangement in the manuals before drawing it and write the source at the symbol; (8) lay the pipes between the pieces as they run, keep every valve and transmitter on its line; (9) run the overlap check in both themes; (10) measure the weight; (11) pictures of the whole page and close-ups; (12) a checker who did not draw it compares the connections with the flow diagram, and a second one looks at the picture as an operator.

## 6e. Tools for drawing a page (`tools/`)

- One page = one file `hx-page-<system>.js` in this folder. `tools/build.mjs` takes every such file into the mockup (the order of the rail is `ORDER` in the build script).
- `node tools/build.mjs --only=hx-page-x.js --out=/some/folder/preview.html` builds a preview of that one page while it is being drawn; it does not touch `hx-mockup.html`. `--list` prints every loop and machine of the registry that is on no page yet.
- `node tools/check-layout.js <mockup.html> <pageId> <outdir> [dark|light]`: words over words, over a pipe, over a symbol of another item, outside the drawing, page errors. 0 of each is the rule, in both themes. It also saves a picture. (It looks at the realistic pipes too; the first checker did not, and two labels on a pipe went unseen until 2026-11-17.)
- `node tools/shot-page.js <mockup.html> <pageId> <out.png> [x0 y0 x1 y1] [dark|light] [scale]`: a picture of the page or of a part of its drawing (drawing units) to look at details.
- `node tools/perf-page.js <mockup.html> <pageId>`: SVG elements, running animations, main thread time (budget in 6d).
- Realistic symbols at hand in `hx-real.js`: valves by `kind`, `pot`, `spray`, `vent`, `ctl`, `louver`, `tgset`, `backpass`, `floor`, `pump` (with motor), `vpump` (vertical pump in a can), `heater` (feedwater heater with U tubes), `deaerator`, `drum`, `fan`, `tank`, `generator`, `cooler` (plate heat exchanger), `strainer`, `furnace`, `cyclone`, `sealpot`, `airheater`, `esp`, `stack`, `vessel` (lying, cut open), `vvessel` (upright, closed), `ejector`, `bunker`, `feeder`, `burner`, `compressor`, `dryer`, `silo`, `conveyor`, `screw`. Machines (`M(...)`) take the state colour on the motor and turn their wheel while running. A symbol a page needs and the set does not have: add it to `hx-real.js` in the same manner (cut open, few paths, classes only, source of its arrangement in the comment).

## 6c. The two mini pop-ups (`hx-cards-ui.js`)

User 2026-11-17: "meron yan mini popup for operator control and permissives? may originality dapat ha". Every operable equipment has two cards in the HX design:

- **Control card** (a click on the equipment): state and position, where it is operated (Remote / Local), who decides (Auto / Manual), the commands with a confirm step; for a loop: measured value on its range with the set point mark, set point, output, mode.
- **Permissive, trend, monitor card** (the Y / N square beside the equipment, or the link at the foot of the control card): the permissive rows (what must be true, what it is now, the DITL row and address), what the logic of the equipment reads, monitor rows, a 15 minute trend.
- Both stay **tethered**: a thin line joins a card to its equipment, also after it is dragged, so several cards can be open at once.
- Y = red = complete, N = green; a logic row that is 1 is red, 0 is green.
- Contract: `HX.data.card(kind, id)` gives everything a card shows, `HX.data.act(kind, id, command, value)` takes every press (the head comment of `hx-cards-ui.js` lists the fields). Without `card()` a click falls back to `HX.data.open()` = the faceplates the app already has.
- The rows in the mockup are not typed: `tools/dump-logic-rows.js` and `tools/dump-faceplates.js` read them from the app (`DUI.rowInfo` / `rowVal` of the DITL sheet of each valve, `LS_DOCK.interlock` for the permissive rows of a motor valve, the app's own controller faceplate for name, range and mode buttons); `tools/make-cards.py` writes `hx-cards.js`. In the app the adapter calls the same functions live.
- Not in the data yet: the conditions that force a loop to manual (the card says so), the SOP line-up items of a machine, and the permissive list of the machines of the other pages (only the reheat page was dumped).

## 7. What is real and what is sample

- Real (from the app): the tags, machine names, loop tags, DITL sheets, English names of the registry; the 150 MW values; the running / stopped states; the rows of the purge and trip lists (text of temporary page 10).
- Sample only: the slow ripple on the values, the 2 h of trend history, permissive = Y on every machine, Y on every list row, the sample faceplate.
- Trend scale: automatic (shown beside each pen). In the app use the instrument range of the I/O list instead (give `low`, `high` as the 5th and 6th item of a pen).
- Level picture of a vessel: only where the transmitter is in percent (limestone and sand silo). The others need the instrument range.

## 8. Not done, not checked

- Not in the app, so NOT tested with the real engine, Worker mode, save points or the loop check dock.
- The pages hold only what the 19 temporary pages bind. Not drawn because no binding is in the registry: secondary air wall dampers and the single bed thermocouples, shaft monitor detail, fly ash handling, bottom ash conveyors detail, electrical auxiliaries.
- Values the app itself shows as `-----` (no source) are `-----` here too.
- `GEN.VF` and `GEN.IF` have no unit in the app page; none is shown here.
- The P&ID and the control room snapshots were not re-read for this mockup (user: use the available data). Before coding a page into the app, check its flow against the P&ID as COMMANDMENT 1 says.
- Checked by this thread: `tools/build.mjs` passes (no unknown name), all 23 pages drawn in a headless browser at 1440 x 900 with 0 overlapping words, light and dark, 1024 and 400 px wide, 0 page errors.
- **The independent review of the realistic reheat page did NOT finish.** Two checkers were started (connections against PD-011 / PD-012; the picture as an operator) and a study of six readers on the field arrangement; all stopped on the usage limit of the account before they reported. So the realistic page, the mirrored placement and the A / B valve lines of the turbine have been checked ONLY by the thread that drew them. Sources that thread read itself: control room screens 005 and 035 (placement, train order, the A / B lines), FHI manual Part 2 Sect 1 and Part 4 Sect 1 / 3 (back pass), the flow diagram crops of the earlier check. Run the review again before the page goes into the app.
- Realistic reheat page (2026-11-17), checked by the thread that drew it: 0 words over words, pipes or symbols in the dark and the light theme at 1900 x 1200; in a headless browser the start-up vent (manual, output up) shows the steam cloud, the reheater spray shows the mist and the water line flows, a drain valve opens with its confirm step, the louver blades follow the output, the Y / N square opens the second card, Controls and Trends views open; 0 page errors; weight as in 6d. NOT checked by that thread: its own picture (the builder does not judge his own work): the result of the two independent checkers is to be written here. Not tested: a real tablet or phone, touch, dragging a card, the real engine.
- The numbers of a spray flow or a vent do not react to the valve in the mockup (sample data has no physics): in the app they come from the plant model.
