# Turnover: 3D whole plant (thread MOMO, "Buuin ang buong planta sa 3D")

Public copy: no plant drawings, no layout dimensions. The full copy (PDF, HTML copies of the 3D pages, dimension notes, pictures, full message list) is in the project folder `/mnt/project-files/turnover/momo-3d/` and in the private repository Ronanski/boiler-3d, branch `claude/boiler-3d-app`, `docs/turnover/`.

Written 2026-11-15 8:40 PM PHT. Plant: LMYP Unit 1, 460 T/H CFB boiler, 150 MW.

## 0. Start here: what to read, in this order

1. This file, all sections. Section 3 (rules) and section 9 (the user's orders) before any work.
2. Project memory: `project-3d-document-map` (documents and order of work), `project-3d-pipe-routes` (frame and pipe status), `project-3d-boiler-steel` (steel and rack packages), `reference-onedrive-plant-files` (paths and limits on the user's PC).
3. Repository rules: `CLAUDE.md`, `HANDOFF.md`, `PROJECT_RULES.md` in Ronanski/icms-master-tool (the commandments apply to every thread).
4. Code: Ronanski/boiler-3d (private), branch `claude/boiler-3d-app`, pull request 1 (open, not merged). `README.md`, then `js/app.js`: search "v129" (pipe routes), "shiftTG" (v131 turbine house), "v132 boiler steel structure", "Pipe rack B" (v133 draft).
5. Dimension notes in this folder: `steel-notes.txt` (K1AU3-S1-0-001 R0, elevations p34-47, line by line), `rack-notes.txt` (K1AU3-S3-0-001 R0, plans p5-7, elevations p54-55), `route-notes.txt` (K1AU3-P3-1-001..004, sheets K1AU3-M1-201..238).
6. Drawings with pages, for the next steps: K1AU3-S1-0-001 R0 p15-33 (framing plans: grating, stairs) and p14 (columns); K1AU3-A3-0-003 R0 p5 (K1AU3-M0-021 ground plan: fans, silos, tanks) and p21 (K1AU3-M0-037 elevation); K1AU3-A3-0-001 R0 p5 (K1AU3-M0-003 power block); K1AU3-S3-0-001 R0 p8-12 (rack sheets 4-8), p56-75 (elevations), p76-78 (sections); turbine `tg-2-1-2-maintenance.pdf` p66-67. Folders: section 4 and the memory files.
7. Artifacts and copies: section 10. Folder of everything: `/mnt/project-files/turnover/momo-3d/`.

## 1. What the user asked for

- A real-looking 3D of the whole plant, built from the plant's own documents. Realistic mediums inside equipment and pipes. No basic shapes, dots or arrows ("not roblox"). Smooth on phone, tablet and PC. Accurate piping.
- 11-15 7:53 PM PHT: get ALL documents needed first, then list the order of work one by one, and work in that order.
- 11-15 8:03 PM PHT: also look in his local folders.

## 2. Where it lives

- Published 3D page: https://claude.ai/artifact/5ZnVRLm3WPBXd6LAKMucri (version 132 is what the user sees).
- Code: private repository Ronanski/boiler-3d, branch `claude/boiler-3d-app`, pull request 1. Last commits: cacb1c0 (v131), ccc08fc (v132). NOT merged: needs the user's own go.
- Copies in this folder (`/mnt/project-files/turnover/momo-3d/`):
  - `plant-3d-v132-published.html` = single-file source of the published page.
  - `plant-3d-v133-draft-NOT-VERIFIED.html` = v132 + pipe racks. Not compared with the drawing, not published, not committed.
  - `steel-notes.txt`, `rack-notes.txt`, `route-notes.txt` = dimensions read from the drawings, with drawing numbers.
  - `s129.js` (screenshot test), `audit.js` (compares every part position between two builds), `split.py` (splits the single file into the repository files).
- Pictures: `/mnt/project-files/plant-3d-v131/`, `/mnt/project-files/plant-3d-v132/`.
- Other 3D pages of this thread: ID fan + hydraulic coupling 3Q9UqQoi7s4E5h5RviSmKe, drum medium sample 1GcAHy7nxnA4y7iWQZJozA.

## 3. Rules that must be kept

- No ASSUMED value. Every dimension traces to a drawing number and page; anything else is labelled illustration or "not in docs". Never ask the user for data the documents can answer.
- Never publish or commit the drawings (FHI property). Only model code and dimensions with drawing numbers.
- Do not change the icms-master-tool repository for this work without the user's own words. No merge, workflow or release without his authorization in the same message.
- Company OneDrive (root folder granted to this thread; a new thread asks once at the root): open single files only, free disk space must not drop, tell him before large files. Personal OneDrive: do not open. `D:\LPDSI Documents`: not connected; the access request was blocked, the user must connect it himself.
- Reports: Taglish, short, no tables, no emoji; say what changed, the source, what is illustration, what was not tested, what is left. Look at every picture yourself before showing it.
- Open decision, no yes from the user: a read-only "door" in the simulator for live sync with the 3D.

## 4. Documents (full map in project memory `project-3d-document-map`)

Master list: `FHI Drawing\PHASE 1\A4 Master Documents\K1AU3-A4-0-001 R41` (31 pages, 452 numbers).

Read and used:
- K1AU3-A3-0-001 R0 as-built plot plan + power block arrangement (K1AU3-M0-001, -003).
- K1AU3-A3-0-003 R0 boiler island arrangement: K1AU3-M0-037 elevation (17 floor levels) used; K1AU3-M0-021 ground plan (fans, blowers, ash coolers, silos, tanks with dimensions) rendered, NOT yet compared with the model.
- K1AU3-S1-0-001 R0 boiler steel (47 scanned pages): 14 elevations p34-47 used; 19 framing plans p15-33 rendered, only GL+15,400 looked at; column schedule p14 not read.
- K1AU3-S3-0-001 R0 pipe rack (78 pages): plan sheets 1-3 and elevation sheets 1-2 read; power block = K1AU3-S0-1221..1228.
- K1AU3-P3-1-001..004 main steam, hot reheat, cold reheat, high pressure feedwater isometrics (K1AU3-M1-201..238).

Located, not yet used:
- K1AU3-A3-0-002 turbine building arrangement (K1AU3-M0-011..016).
- K1AU3-P3-1-101 R0..R93 isometrics of all other systems; K1AU3-P2-0-001 underground seawater; K1AU3-P2-0-002 arrangement.
- K1AU3-C-0-001..008 non-pressure parts (ducts, seal pot, casing, refractory, lagging); K1AU3-B-0-001..008 pressure parts; K1AU3-T tanks, silo, cyclone; D1 equipment data; K1AU3-L1-0-002 equipment list; Z painting.
- Turbine sections: `o&m-package-phase-1\L2 TG\tg-2-1-2-maintenance.pdf` p66 outline 310PB64-391, p67 cross-section 310PB65-413 (page numbers to be verified).
- Local training material `document-references\CFB\CFB` (plant photos, line tracing): real look and colours.

## 5. Model frame

The coordinate frame, grid values and work method are in the private copy (section 5 of the same file in Ronanski/boiler-3d `docs/turnover/` and in the project folder).

## 6. Order of work told to the user (he did not change it) and status

1. Site base from as-built plot plan and arrangements. DONE in v131.
2. Steel and pipe rack. IN PROGRESS: boiler steel frame from the elevations DONE in v132. Pipe racks written in the v133 draft, not verified. Not started: grating, stairs, intermediate beams and purlins from the framing plans; column web direction and beam sizes; turbine building steel (S2); rack sheets 4-8.
3. Boiler body, ducts, cyclone, seal pot.
4. Remaining piping by system from the isometrics. Done so far: main steam, hot and cold reheat, high pressure feedwater, feed pump discharge, heaters 1 and 2. Not routed: high pressure bypass outlet (K1AU3-M1-214), drains, vents, condensate, extraction, spray, cooling water, supports.
5. Seawater intake to discharge.
6. Real shape of each equipment from D1 data (coal feeder first).
7. Medium inside turbine, feed pump, fans.
8. Electrical.
9. Paint colours and insulation.
10. Water treatment, coal handling.

## 7. Next actions, in order

1. Compare the v133 pipe rack pictures with K1AU3-S0-1221..1223 and the elevations; fix; publish; commit.
2. Framing plans: grating, stairs.
3. Compare fans, blowers, silos and tanks with K1AU3-M0-021.
4. Step 3 onward.

## 8. Not tested

- Smoothness on the user's own phone or tablet.
- v133 pipe racks against the drawing.
- Simplified items still in the model: platforms and stair tower (rectangles), feedwater control station valve runs, pipe radius is bare pipe (insulation thickness not read).

## 9. Decisions log (the user's orders, in his own words, times in PHT)

- 11-10 10:06 PM: "pwedeng makita sample? ... ung realistic tlga. kita pati loob." Start of the 3D sample.
- 11-10 10:49 PM: "pwede kumpletuhin yn? hanggang stack? mlaya ako mg explore?" Whole unit up to the stack, free to explore.
- 11-10 11:09 PM: "anjan s pc ko mga docs sa planta. kaya nio n yan" Do not ask him; use the documents.
- 11-11 12:24 PM: "Gawin kaya syang separate n app?" then chose "Bagong repository" on the decision card (5:20 PM). Result: private repository Ronanski/boiler-3d.
- 11-11 5:37 PM: wants to walk around the plant and zoom in and out; "S future to malamang at malaking project to."
- 11-11 5:41 PM: "No need n siguro muna [values]. Importante ay mabuo ang planta, mula sa seawater hanggang stack hanggang turbine generator papunta sa transformer na papunta sa grid."
- 11-12 3:22 PM and 6:09 PM: controls must work with one hand on a phone; no extra buttons; easy drag.
- 11-12 7:28 PM: next update: see-through view of every equipment, pipes and tubes, and what happens inside.
- 11-13 6:30 AM: "prng basic kc ang 3d ... Puro shapes lng sya pg mlapitan e. Isa2 lng muna. Wag sabay2." Detail one equipment at a time.
- 11-13 9:38 AM: see-through view must be clear, with distinction, showing how things move inside.
- 11-13 10:24 AM: keep this quality without getting slow.
- 11-13 6:09 PM: navigation is hard (zoom, move, turn), unlike other 3D apps; see-through view must not disturb the view.
- 11-13 8:26 PM "Pre stop", 8:27 PM: "Gawa ka hiwalay na artifact for idf and hydraulic coupling lng."
- 11-13 10:24 PM to 11-14 8:14 AM: the fan and coupling page was rejected several times: must show the real inside (gears, components, where the oil comes from and goes), based on what really happens, no balls for oil, "Prng roblox". Study how well-known companies make "how it works" 3D.
- 11-14 7:55 PM to 8:20 PM: other files are on the company OneDrive; Microsoft 365 connector "Require admin approval"; disk space must not drop after sync; files are hidden in subfolders, search them all; wants a librarian thread (now YOONA).
- 11-14 8:23 PM: can the 3D show the real drum level and flow, reacting to the plant values? (Live sync: the read-only door in the simulator has NO yes yet.)
- 11-14 9:15 PM: "Hnd realistic ang mga mediums ... ung laman ng bawat 3d model equipments and pipings mo."
- 11-14 9:52 PM: outside pipes must connect to the pipes inside the drum. 10:24 PM: drum sample "Cge ok n yn".
- 11-15 7:32 AM: "Ung kabuuang 3d model. Bkt hnd un ang iupdate mo?" Work on the whole-plant model, not side pages.
- 11-15 11:21 AM: instruments must not be dots; see-through must apply to everything; clear distinction of steel, instruments, cut, see-through, solid.
- 11-15 11:47 AM: "Pangit yung 3d model. Masyadong basic lahat."
- 11-15 2:43 PM: are the pipes accurate? It gets slower as it gets better; flue gas must not be balls.
- 11-15 3:30 PM: "Sa root ka na manghingi ng access" (company OneDrive root granted to this thread).
- 11-15 7:52 PM: "Hindi pa kumpleto noh? Dami pang kulang eh."
- 11-15 7:53 PM: "mas ok kung makuha mo muna lahat ng documents na need mo pra sa 3d model na ito. Then next, ilist mo isa isa ang pagkakasunod2 ng mga gagawin mo."
- 11-15 8:03 PM: "Sa local folders ko baka me makita ka rin"
- 11-15 8:27 PM (project chat): every thread makes turnover documents, .md and PDF in the repository, with the artifacts produced.

## 10. All artifacts of this thread

- Whole plant 3D: https://claude.ai/artifact/5ZnVRLm3WPBXd6LAKMucri (copy: `plant-3d-v132-published.html`).
- ID fan and hydraulic coupling: https://claude.ai/artifact/3Q9UqQoi7s4E5h5RviSmKe (copy: `id-fan-hydraulic-coupling-3d.html`).
- Steam drum medium sample: https://claude.ai/artifact/1GcAHy7nxnA4y7iWQZJozA (copy: `drum-medium-3d.html`).
- Pictures: `pictures/` here; older ones in `/mnt/project-files/3d-sample-2026-11-10/`, `plant-3d-v124` to `plant-3d-v132`, `idf-coupling-3d`, `idf-coupling-3d-v8`.
- Full list of the user's messages in this thread: `user-messages-verbatim.txt` (private copy only).
