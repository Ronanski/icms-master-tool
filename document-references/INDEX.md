# document-references — index (2026-11-06, TZUYU)

**Mula 2026-11-07: ang mga file ay wala na sa public repo.** Nasa PC ng user ang mga ito at nasa private repo na Ronanski/icms-plant-documents ang dating naka-commit. Index na lang ang naiwan dito. Huwag mag-commit ng plant document sa public repo.

Ito ang listahan ng lahat ng reference. Basahin bago sabihing "not in docs" (COMMANDMENT 1). Ang path ay mula sa folder na ito.

## Logic ng DCS
- `analog-logic-abc-pdf.zip` (56 file) at `analog-logic-abc.zip` (111 file, DWG/DXF): ABC analog logic. Ang `ABC-FLAME.dwg` ay walang PDF.
- `digital-logic-ditl.zip` (266 file): DITL digital logic.
- `other-ditl-logic-pdf.zip`: PDF ng bottom ash (conveyors, HD600), limestone, sand silo, sootblower.
- `sand-sootblower-logic.zip` (sand silo 770 ~ 777, sootblower DITL-80x; DWG + PDF), `bottomash-limestone-logic.zip` (bottom ash BA-01 ~ 74; limestone `Limestone Logic/limestone_logic.xls`).
- `other-dxf-not-imported-yet.zip` (120 file): DXF na hindi pa naipapasok sa app.
- `analog logic symbols legend.pdf`, `digital logic symbols legend.pdf`: kahulugan ng block.

## Listahan at parameter
- `dcs-io-list.xls`: DCS I/O list. `iolist-tcs.zip`: TCS HMI AI / AO / DI lists.
- `memory-list-101.xls` ~ `memory-list-105.xls`: memory list ng STN101 ~ 105.
- `over-all-instrument-list.xlsx`: instrument list.
- `summary-of-pid-pidv-suma-man-parameters.xlsx`: PID / PIDV / SUMA / MAN parameters.
- `linear-curves-fx.xls`, `flow-compensation.xls`, `drum-level-calculation.xls`: F(X), flow at drum level compensation.
- `alarm-list.zip`: tatlong alarm list xls (20151224, 20160201, 20160912; gamitin ang pinakabago). Ang alarm list CSV ng live test ay nasa PC lang (`..\team-files\alarm-list-csv\`).
- `values-logic-sim-end-user-report.xlsx`: rules at wishlist ng user sa values (PROJECT_RULES 3).

## Planta at proseso
- `flow-diagram-K1AU3-A1-0-001.zip`: P&ID / flow diagram (RA = buong set, 65 pahina, scan; RB = 20 binagong drawing: RB muna kung mayroon).
- `mass-balance-diagram-K1AU3-A2-0-001-RA.pdf`: mass balance (MB-011 main steam, MB-012 reheat, MB-013 extraction, MB-016 condensate, MB-017 feedwater; walang enthalpy).
- `boiler-cfb-design-operation-manual.zip`: FHI CFB boiler manual (Part 2 Sect 7 design data at curves, Sect 8 operation, Part 3 ~ 5).
- `fan-instruction-manual-SAF-PAF-IDF.pdf`: spec at flow curve ng SA / PA / ID fan.
- `procedure-start-up-PR-OPE-5002-02.docx`, `procedure-normal-shutdown-PR-OPE-5003-01.docx`, `procedure-shutdown-to-bottle-up-PR-OPE-5004-01.docx`: SOP ng planta (ang 5002 ay may FHI start-up curves at Table 1.1 din).
- `hmi-snapshot-sample.zip` (35 larawan): HMI ng control room (operating point: `docs/hmi/OPERATING_POINTS.md`).

## TCS (turbine control) — `tcs-references/`
- `310SC90-775 (ATS Sequence).pdf`, `310SC90-776 (ATS Criteria).pdf`, `TCS Elementary Diagram(TC).pdf`, `TCS LOGIC OPENING PROCEDURE.docx`, `(IBD-latest) SC90794-R2-S99 (IBD-new).pdf`, `(LM-310SC90-793 R2)-Input_Output List ...pdf`, `New Turbine Wiring Diagrams SD14370-R4.pdf`.
- **Babala:** `Generator Logic.pdf` at `Generator Protection.pdf` ay IISANG file (pareho ang laman); kulang ang tunay na isa. `IO Module SOP.pdf` ay DCS doc (kapareho ng `miscellaneous.zip` "DCS Module.pdf"), hindi TCS. `Trip interlock test 2X650MW.pdf` ay galing sa IBANG planta: huwag gamiting citation ng LMYP #1.
- Ang "TCA / TCE SOFT LOGIC DIAGRAM OF TCS.pdf" at folder na "TCS Logic" ay nasa PC lang ng user.

## DCS hardware at pangkalahatan
- `dcs-hardware-wiring.zip`: system, PDP, SER, ARP / IRP, MPL, FCS wiring (ang "Copy of LMYP-1(#1) WIRING.xls" ay luma, 2022-08-23; ang original 2023-10-03 ang kasalukuyan).
- `dcs-training-textbook.pdf`: DCS textbook (pangkalahatang paliwanag lang).
- `miscellaneous.zip`: DCS hardware / training overview, lumang DCS procedures, subsystem PLC modbus.
- `other-references.zip`: `dcs-reference-others.xls`, `io-card-hardware.xlsx`.

## Nasa PC lang ng user (hindi naka-commit; basahin sa folder ng PC)
Folder: `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool\document-references\`
- `tg-engineer-data/`: FHI "K1AU3-D1-0-0xx Engineering Data" (scan): BFP -031, MWP -032, ACWP -033, SWBP -034, HP / LP heater -036 / -037, DA -038, condenser -039, CCWHE -041, IA compressors -059, SWP -064, dryers -065, air tank -070.
- `o&m-package-phase-1/`: vendor O&M L1 ~ L37 (L1 boiler, L2 TG, L4 burner, L5 limestone / sand, L6 bottom ash, L7 BFP lube oil, L14-4 diesel pump, L16 fans, L18 debris filters, L20 APH, L22 DCS) at master list K1AU3-R1-0-001 R15.
- `instrument-engineer-data-asbuilt/`: K1AU3-E2 drawings (control valves, orifices, drum level gauge, DCS graphic design).
- Kopya ng CW vendor PDFs (14): project files `cw-plant-model/vendor/`.
- Idinagdag ng user 2026-11-06 (PC lang, FHI property, huwag i-commit):
  - `Boiler Pressure Parts/`: K1AU3-B-0-001 ~ 008 as-built (general arrangement, panel erection, superheater, steam drum, economizer, risers, supports, reheater).
  - `Boiler Non-Pressure Parts/`: K1AU3-C-0-001 ~ 008 (buckstay, seal pot at cyclone vortex finder, casing, air at flue gas duct, lagging, sootblower support, refractory, TG noise cover). Ang K3AU2 files ay Phase 2: huwag gamiting source sa Unit 1.
  - `Equipment List/`: K1AU3-L1-0-002 R0 at RA. `Boiler Hydrostatic Test Procedure/`: K1AU3-R3-0-101, 102. `Boiler Structural Steel Drawing/`: K1AU3-S1-0-001, K3AU2-S1-0-001.
  - `Turbine Generator/`: generator data sheet GAE-2013-0136, site test procedures, wiring diagrams.
  - Hiwa-hiwalay: BFP motor data sheet, MV-BD1001 at MV-BD1002 valve drawings, Chimney K1AU3-D1-0-058, Plant Air Compressor manual.
  - Maraming scan ang mga ito at may password-free encryption: basahin gamit ang pdf.js sa Chrome.
- WALA kahit saan: turbine heat balance diagram, historian / trend data.

Ang mga dobleng zip (`iolist-dcs.zip`, `memorylist-per-station.zip`, `plant-operation-procedure.zip`, `dcs-manuals.zip`, `controller-para.zip`, `fx-drum-flow-calculations.zip`) ay tinanggal 2026-11-06: pareho ang laman (md5) ng mga file sa itaas. Nasa git history kung kailangan.
