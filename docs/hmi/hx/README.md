# HX plant pages: handoff for the next coder

Made 2026-11-16 on the order of the user: "gawan ng mga HMI pages ... lahat ng planta macocover pati operator controls at trend", "BE ORIGINAL WALA KA DAPAT GAGAYAHIN", "hmi shell lang ... no need to integrate sa app, pero dapat retrofit ready", "babase ka lang sa available data".

## 1. What this is

- A **mockup of a new HMI shell**: 23 pages for the whole plant, each with three views: **Process** (the drawing), **Controls** (every loop, machine and on / off valve of the page) and **Trends** (pen groups).
- It is **not in the app**. Nothing under `src/` or `dist/` was changed. The app build does not read this folder.
- It is **retrofit ready**: the pages never touch the simulator. Every number, state and click goes through one object, `HX.data`. The mockup fills it with sample data; the app fills it with the real signals (section 5).
- The design is original: it copies neither the control room screens, nor the 19 temporary pages, nor another DCS. Only the CONTENT (which machine, which tag, which loop) comes from the app.
- At hand-over: 23 pages; all 63 control loops and all 168 machines and valves of the registry are on a page; 190 of its 401 value keys are used (the rest are second and third transmitters of the same point). `tools/build.mjs` prints this line again.

## 2. Files (all in `docs/hmi/hx/`)

- `hx.css`: every colour and font as a token (light and dark).
- `hx-sym.js`: the symbol set (pump, fan, valve, damper, drum, heater, furnace, cyclone, turbine ...). One drawing per kind of equipment.
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
7. The size of the text never changes: the drawing is 1280 units wide. A page with many rows grows downwards.
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

- `plan: { h, items, pipes, taps, texts, signals }` instead of `lanes`.
- `items`: the same `E`, `M`, `C`, `X`, `L` with `x`, `y` (the drawing is 1280 wide, `h` high). `rot: -90` or `90` turns a valve onto a vertical line (with -90 the actuator points left; port `r` is then the top end and `l` the bottom end). `lab: 't' | 'b' | 'l' | 'r'` = where the words go. `cname` = the longer name used on the Controls view.
- `pipes`: `{ med, w, flow, pts, to, arrow }`. A point is `'id.port'` or `[x, y]`; `null` keeps the x or y of the point before. Two points not in line get a right-angle bend. `to: 'flash chamber'` ends the pipe with an arrow and that word.
- `taps`: a transmitter on its line: `{ x, y, side, label, key, key2, unit, dp, tag }` (`key2` shows two transmitters as `a / b`).
- `signals`: thin dashed control signal between items. `texts`: free words (`cls: 'hx-name' | 'hx-zone' | 'hx-note'`).
- An item of the flow diagram that the app does not bind yet is drawn with `E` (grey, tag shown), never left out and never given an invented signal.
- Method that was used for the reheat page, to repeat for every page: (1) read the flow diagram sheet(s) of the system and write down the order of every item along every line; (2) list what the control room page of that system shows (content only); (3) take the tags the app binds from `hx-registry.js`; (4) place and connect; (5) run a check for words over words, pipes and symbols (0 allowed); (6) have someone who did not draw it compare the page with the flow diagram, connection by connection.
- Flow diagrams: private repo `Ronanski/icms-plant-documents`, `flow-diagram-K1AU3-A1-0-001.zip`: use the RB file (Rev D) when the sheet is in it. Drawing list on page 2 ~ 4 of each PDF. Reheat = `K1AU3-PD-012`, main steam = `K1AU3-PD-011`.

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
