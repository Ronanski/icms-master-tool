# Document index: saan nakalagay ang bawat plant document (YOONA, 2026-11-14)

Index ito ng mga pangalan, path at uri lang. **Walang kopya ng plant document dito** (FHI / MHPS / vendor property). Ang mga file ay nasa PC ng user lang. Read-only: huwag ilipat, palitan ang pangalan o burahin ang file ng user.

Ang buong file list (bawat file, may laki) ay nasa PC lang, hindi naka-commit: `document-references/_notes/file-lists/` (`sm-plant.tsv`, `lpdsi-plant.tsv`, `repo-plant.tsv`). Hanapin doon gamit ang grep bago sabihing "wala".

Ang OneDrive ay Files On-Demand: ang pagbukas ng file ay nagda-download nito. Isang file lang bawat bukas; sabihin muna sa user kung malaki (higit 50 MB).

## Mga pinagmulan (roots)

- **REPO** = `icms-master-tool\document-references\` (6,395 file). Detalye: `document-references/INDEX.md`.
- **SMGP** = `C:\Users\Ronanski\OneDrive - San Miguel Global Power\` (109,306 file, company OneDrive). Pinakamalaking source.
- **LPDSI** = `D:\LPDSI Documents\` (40,780 file).
- **OD** = `C:\Users\Ronanski\OneDrive\` (personal OneDrive, nagsi-sync pa: folders pa lang, 1 file noong 2026-11-14 8:30 PM PHT). Plant-related na folder: `Desktop\PDF\TCS Logic`, `Desktop\PDF\NUS` (walang laman pa).

Phase 1 = Unit 1 at 2 (code K1AU3, ito ang LMYP #1). Phase 2 = Unit 3 at 4 (code K3AU2). **Ayon sa user (2026-11-14): pisikal na identical ang Phase 2 sa Unit 1, tag number lang ang iba.** Kaya source din ang Phase 2 para sa sukat, design data, curves at drawing ng equipment; ang tag number, address at logic sheet number ay laging galing sa Phase 1 (K1AU3) at sa LMYP #1 DCS. Ang mga file na may "ML-" sa unahan (folder MHPS EI) ay mukhang Malita / Davao project ng MHPS: gamitin lang bilang check, ang "LM-" ang Limay.

## Pinakamahalagang folder (SMGP)

- `USBTRANSFER\FHI Drawing\PHASE 1\` (2,333 file): buong FHI drawing set ng Unit 1 at 2, ayon sa code:
  - `A1 FLOW DIAGRAM`: K1AU3-A1-0-001 (R0 ~ R5, RA, RB, AS BUILT) at 28 hiwalay na system PDF (01 Main Steam ~ 28 Secondary Air).
  - `A2 Mass Balance`, `A3 Plot Plan & General Arrangement`, `A4 Master Documents` (K1AU3-A4-0-001 master drawing list R0 ~ R41).
  - `B BOILER PRESSURE PARTS` (K1AU3-B-0-001 ~ 008, kasama ang B-0-004 Steam Drum R0 ~ R4), `C BOILER NON PRESSURE PARTS`.
  - `D1 Engineering Data of Mechanical Equipment` (225), `D2 Procuring Specification` (129), `D1-0-105` sea water intake at discharge (233).
  - `E1 Engineer data of electrical equipment` (404, kasama ang **K1AU3-E1-0-102 RD Single Line Diagram**), `E2 Engineering Data of instrument` (85).
  - `P1` piping at manual valve spec, `P2.0 / P2.1 Piping Arrangement` (K1AU3-P2-0-002 R1 ~ R11 Boiler, TG, Utility; P2-0-001 underground sea water; P2-1-001 Unit 1 boiler area), `P3.1 Piping ISO drawing` (Unit 1: P3-1-001 Main Steam R0 ~ R7, P3-1-002 Hot Reheat R0 ~ R7, P3-1-003 Cold Reheat, P3-1-004 HP Feedwater R1 ~ R10, P3-1-005 welding at NDE, P3-1-101 isometrics R0 ~ R13), `P3.2` (pareho para sa Unit 2, kasama ang P3-2-101 R3 Cooling Water Piping), `P4.x` pipe support at stress analysis.
  - `R1` O&M manual K1AU3-R1-0-001 (R0 ~ R14), `R3` procedures (performance test, reliability test, hydrostatic, commissioning guideline K1AU3-R3-0-110, synchronization test).
  - `S1 ~ S4` structural steel (boiler, turbine, pipe rack), `T Tank_Vessel_Silo`, `F / S0` civil at piling, `G / H / K / Z` architecture, HVAC, fire, admin.
  - `Factory Acceptance Results TSI (UNIT 1 & 2).pdf` (252 MB: sabihin muna bago buksan).
- `USBTRANSFER\FHI Drawing\Other AS builts\`:
  - `HITACHI Turbine-Generator\MHPS EI\` (37): turbine steam, gland steam, lube at control oil P&ID; turbine protection logic; TG interlock block diagram 310SC90-774; ATS 775 / 776; setpoint list 778; instrument list 779; one line diagram generator main circuit 310SD03-741; **Generator Protection / Breaker Logic Diagram 310SD03-743**; excitation interlock block diagram GSE-2013-0109; AVR wiring; TCS functional block diagram at elementary diagram. (Prefix "ML-": tingnan ang babala sa itaas.)
  - `HITACHI Turbine-Generator\MHPS Site Test Procedure\` (14), kasama ang excitation system test GEE-2015-0151.
  - `LMYP-1 Complete (From Edmaru)\`: commissioning guideline (46), training documents (45: L01 CFB introduction, L06 boiler pressure / non-pressure parts, L11 TG, L13 bottom ash, L15 SCADA, sea water cooling), MHPS TG shop test at site test reports, generator data sheet, TG installation manual, `Turbine\` (oil accumulators), `MHPS TG RH Training Data\` (plant start-up at shut-down curve XSM-CO-PRJ-187, steam turbine start-up control XSM-CO-PRJ-188, emergency trip device).
- `USBTRANSFER\FHI Drawing\Autocad P&ID\` (1,416 DWG), `Asset Registry\` (valve lists LM-310SD14-322 at 353), at mga folder na FOR APPROVAL / FOR CONSTRUCTION / FOR FINAL / FOR INFORMATION / FOR REVIEW / OTHER EXTERNAL DOCUMENTS (luma o ibang yugto; `Davao Drawing Reference` = ibang planta).
- `USBTRANSFER\something\` (10,047): halos kopya ng FHI Drawing (Autocad P&ID, PHASE 1, FOR ...), dagdag ang General Arrangement, Mass Balance, Engineering Data of Electrical Equipment.
- `USBTRANSFER\transfer\` (997): mga as-built na pinili ng user (boiler pressure / non-pressure parts, structural steel, hydrostatic, asset registry, 2017 IC AS BUILT, general arrangement at plant layout, electrical engineering drawing, cable tray, civil, electrical test procedure, SIGNED AP).
- `E-LIBRARY\` (11,564):
  - `Operation and Maintenance Manuals\PHASE 1\` (9,736 file, 8.2 GB): vendor O&M L1 ~ L37 (mas buo kaysa sa `o&m-package-phase-1` ng REPO). Halimbawa: L7 BFP (performance curve, cross section), L10-1 condensate pump (CEP curve), L16 fans at L14-7 biasing damper, L24-2 auxiliary transformer AVR, L28 motor control damper at emergency diesel generator AVR, gland steam condenser O&M.
  - `Single Line Diagram\` (2 file), `Flow Diagram\` (2), `Turbine Generator\` (12, kasama ang GEE-2015-0152 excitation site test), `Engineering Data of Turbine & Generator\` (74, kasama ang K1AU3-D1-0-015 biasing damper, `valves\`).
  - `CFB\` line tracing (BOP, SG, TG; 1 GB ang TG), `DCS PLC\LMYP-1 #1-DOCUMENT` (650) at `(Hardware)`, `INSTRUMENT LIST`, `INSTRUMENT MAPPING` (boiler, tg, sootblower SLD), `Instrument Conduit Layout`, `Standard Logic Diagram of Breaker`, `Typical Schematic Control Wiring Diagram`, `MH REFERENCES` (coal handling, labas sa scope; may K1AU3E1 / E2 Single Line Diagram sa `MH files\Single Line Diagram\`).
- `PROJECT DCS VIBE\` (486): `LMYP-1 #1-DOCUMENT\Logic Diagram` (407), IO List, Subsystem PLC, hardware 01 ~ 12, `LMYP1 LOOP&USERTAG(new)`.
- `ARCHIVES\DCS TCS\` (969): DCS reference (532), TCS IO LIST, PI PROJECT (kasama ang P39 RH-SH Biasing Damper tags), RTS, AXIS turnover docs.
- `LAPTOP_BACKUP_02062026\DESKTOP\TURN OVER FILES\DCS TCS\TCS\TCS\`: **TCA at TCE SOFT LOGIC DIAGRAM OF TCS.pdf**, `TCS Logic\Soft Logic\TCA.pdf, TCE.pdf`, Generator Logic.pdf, `TCS Logic\Generator Protection.pdf`, LM-310SC90-793 IO list. Malaki rin ang `TCS BACKUP` (27,655) at `DCS Files` (653, DCS procedures, reports gaya ng LPBV trends).
- `LAPTOP_BACKUP_02062026\DESKTOP\E-LIBRARY\` (8,231, 18 GB): lumang kopya ng E-LIBRARY.
- `LAPTOP_BACKUP_02062026\DOCUMENTS\Technical Documentations and Procedures\` (197): procedures, PI graphics (eDNA), U2 biasing damper presentation.

## LPDSI (D drive)

- `LMYP-1 DCS TCS\` (454): loop at user tag lists, `LMYP-1 #1-DOCUMENT\Subsystem PLC\` Modbus lists (nasa app na).
- `LMYP-1 MANUALS\` (10,418) at `DCS FEIL\IC\PLANT REFERENCES\O&M Package\` (V-numbered na kopya ng O&M L-package).
- `DCS FEIL\DCS & TCS\` (DCS 659, TCS 22 na 1 GB), `DCS FEIL\IC\DCS` (3,555), `LMYP-1 PLC` (922), `LMYP PNEUMATICS` (64).

## Hanap ayon sa kailangan (pinakabagong revision muna)

- Single Line Diagram Unit 1: SMGP `USBTRANSFER\FHI Drawing\PHASE 1\E1 ...\E1\K1AU3-E1-0-102 RD Single Line Diagram .pdf`; 460 V SB-11: `E-LIBRARY\INSTRUMENT MAPPING\sootblower diagram\`. Generator main circuit: MHPS EI 310SD03-741.
- Main steam, hot reheat, cold reheat, HP feedwater route (3D): PHASE 1 `P3.1 Piping ISO drawing\` K1AU3-P3-1-001 R7, -002 R7, -003 R0, -004 R10; layout `P2.0` K1AU3-P2-0-002 R11.
- Cooling water / sea water pipe route: `P2.0` K1AU3-P2-0-001 R6 underground sea water; `P3.2 ...\P3\K1AU3-P3-2-101 R3 (2) Cooling Water Piping.pdf` (Unit 2); `D1-0-105` sea water intake; training `01 LIMAY Sea Water Intake & Discharge Cooling System.pdf`.
- Steam drum: PHASE 1 `B BOILER PRESSURE PARTS (B)\K1AU3-B-0-004 R4 Steam Drum.pdf`; as-built sa `transfer\Boiler Pressure Parts\`.
- Biasing damper: `E-LIBRARY\Engineering Data of Turbine & Generator\K1AU3-D1-0-015 R1`, O&M `L16 FANS\L14-7 Biasing damper\`.
- Condensate pump (CEP): O&M `L10-1 Condensate pump\` (performance curve A02, cross section A03 sa LPDSI kopya).
- BFP: O&M `L7 BFP\A Technical Documents\` (performance curve, cross section).
- Excitation / AVR: MHPS EI GSE-2013-0109 (interlock), GSE-2013-0080 (AVR wiring); `E-LIBRARY\Turbine Generator\GEE-2015-0152 R1`; LM-GEE-2015-0152 sa Edmaru site test.
- Turbine start-up: `MHPS TG RH Training Data\XSM-CO-PRJ-187` at `-188`.
- TCS soft logic TCA / TCE: `TURN OVER FILES\DCS TCS\TCS\TCS\`.

## Turbine heat balance at generator data (na-update 2026-11-14)

- Turbine heat balance (MHPS, identical na turbine): Phase 2 `PHASE 2\DRWG FOR PHASE 2\Drawings\486_PPE-14-0725_R1 Heat Balance Diagram.pdf` at `488_PPE-14-0728_R1 Heat Balance Turbine Bypass Operation.pdf`. Sa parehong folder: 487 STG start-up information, 489 heater out of service, 492 ~ 494 aux power / CW / aux steam consumption, 498 CRH at extraction NRV design conditions. Kapareho ng Davao set (`OTHER EXTERNAL DOCUMENTS\Davao Drawing Reference\` PPE-13-0138 R4, TAQ-14-216 correction curves, TAQ-13-252 thermal kit). I-check pa rin laban sa Unit 1 mass balance K1AU3-A2-0-001.
- Generator at exciter (Phase 2 `Drawings\`): 186 brushless exciter outline 310QK06-564, 276 excitation V curves 310SD23-270, 279 / 280 winding thermal capability, 399 description of excitation system DBE-15-0021, 423 brushless exciter curve GAE-2015-0004.
- Wala talaga (user 2026-11-14: ito na ang buong document set): historian / trend data (may LPBV trend PNG lang sa DCS Files\Reports), sectional drawing ng turbine casing.
- Ang personal OneDrive (OD) ay hindi pa tapos mag-sync: hanapin ulit kapag dumating na ang mga file.
