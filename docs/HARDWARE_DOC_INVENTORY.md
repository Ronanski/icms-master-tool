# Hardware document inventory: control system, instruments, network (YOONA, 2026-11-14)

Para sa plant data core ni HANNI (source, path, destination, logic, document ng bawat tag). **Pangalan at path lang, walang kopya.** Lahat ng file ay nasa PC ng user. Buong file list: `document-references/_notes/file-lists/` (PC lang). Pangkalahatang index: `docs/DOCUMENT_INDEX.md`.

Paano basahin:
- Roots: **SMGP** = `C:\Users\Ronanski\OneDrive - San Miguel Global Power\`, **LPDSI** = `D:\LPDSI Documents\`, **REPO** = `icms-master-tool\document-references\`. **FHI1** = `SMGP\USBTRANSFER\FHI Drawing\PHASE 1\`, **FHI2** = `SMGP\USBTRANSFER\FHI Drawing\PHASE 2\`, **MHPS** = `SMGP\USBTRANSFER\FHI Drawing\Other AS builts\HITACHI Turbine-Generator\MHPS EI\`, **HW** = `SMGP\ARCHIVES\DCS TCS\DCS REFERENCE\LMYP-1 #1-DOCUMENT(Hardware)\` (kopya rin sa `SMGP\E-LIBRARY\DCS PLC\` at `SMGP\PROJECT DCS VIBE\`).
- Unit: "U1" = Unit 1, "U1+U2" = isang drawing para sa dalawa, "P2" = Phase 2 (Unit 3 at 4: kakambal ng Unit 1, tag lang ang iba; equipment data lang, hindi tag).
- Revision: galing sa pangalan ng file. Ang pahina ay **hindi pa nabibilang**: ang pagbukas ng OneDrive file ay nagda-download nito, kaya bibilangin lang kapag may thread na kailangan ang file.
- Maraming kopya ang parehong drawing (AUDIT, TURN OVER FILES\DIAGRAMS, `USBTRANSFER\transfer\2017 IC AS BUILT`, `REPO\onedrive-2026-11-07\2017 IC AS BUILT`). Ang nakalista ay ang pinaka-buong kopya; ang "2017 IC AS BUILT" ang may sheet range sa pangalan (hal. "I1-600~671").

## 1. DCS (Formosa) system, cabinets at wiring: K1AU3-E2-0-106 ~ 118 (U1, as-built 2017-10-03)

- `HW\01.System\K1AU3-E2-0-106_20171003.pdf`: DCS system configuration (network ng FCS, COS, GCS). Kopya: FHI1 `E2 ...\AS BUILT\K1AU3-E2-0-106 DCS System Configuration.pdf`, at `K1AU3-E2-0-106~116 Drawing of DCS.pdf` (isang PDF ng 106 ~ 116).
- `HW\02.Layout\K1AU3-E2-0-107_20171003.pdf`: control room at rack room layout (kasama ang FHI1 `AS BUILT\K1AU3-E2-0-107 DCS Control Room Rack Room Layout.pdf`).
- `HW\03.Ground\K1AU3-E2-0-108_20171003.pdf`: DCS grounding.
- `HW\04.FCS\K1AU3-E2-0-109_20171003.pdf`: FCS cabinet layout.
- `HW\05.COS\K1AU3-E2-0-110_20171003.pdf`: operator station (COS).
- `HW\06.PDP\K1AU3-E2-0-111_20171012.pdf`: power distribution panel (DCS power, 24 VDC / 110 VAC feed).
- `HW\07.SER\K1AU3-E2-0-112_20171003.pdf`: sequence of events recorder.
- `HW\08.ANP\K1AU3-E2-0-113_20171003.pdf`: annunciator panel.
- `HW\09.ARPIRP\K1AU3-E2-0-114_20171003.pdf`: ARP / IRP (auxiliary at interposing relay panels).
- `HW\10.GCS\K1AU3-E2-0-115_20171003.pdf`: gateway (GCS) sa package PLC.
- `HW\11.MPL\K1AU3-E2-0-116_20171003.pdf`: marshalling (MPL).
- `HW\12.Wiring\`: `K1AU3-E2-0-117 FCS WIRING_20171003.pdf`, `K1AU3-E2-0-117 IRP_ARP_SER_20171003.pdf`, `LMYP-1(#1) WIRING.xls` (original, ang kasalukuyan), `LMYP-1(#1) IRP_ARP_SER.xls`, `LMYP WIRING.xls`, `Copy of LMYP-1(#1) WIRING.xls` (luma, 2022-08-23).
- K1AU3-E2-0-118 DCS IO Assignment / Input Output List: FHI1 `E2 ...\AS BUILT\K1AU3-E2-0-118 DCS Input Output List.pdf` (2017 copy: "(I0-003)"). Excel: `REPO\dcs-io-list.xls`, TCS: `REPO\iolist-tcs.zip`.
- Specification ng DCS: FHI1 `E2 ...\E2 NON AS-BUILTS\K1AU3-E2-0-001-RA Specification of DCS.pdf`.
- Wiring sa repo: `REPO\dcs-hardware-wiring.zip` (system, PDP, SER, ARP / IRP, MPL, FCS).
- P2: **walang** K3AU2-E2-0-106 ~ 118 set sa PC (may E2-0-107 rack room layout lang, FHI2 `(E2) ...\E2 K3AU2-E2-0-107 ...`, 5 file).

## 2. I/O card list at module

- `SMGP\LAPTOP_BACKUP_02062026\DESKTOP\TURN OVER FILES\DCS TCS\DCS Files\DCS References\IO Card.xlsx`.
- `REPO\other-references.zip` → `io-card-hardware.xlsx`, `dcs-reference-others.xls`.
- `IO Module SOP.pdf`, `DCS IO Module SOP.pdf`, `IPU3 IO Module Test SOP.ppt` (DCS Files at REPO tcs-references).
- Memory list ng STN101 ~ 105: `REPO\memory-list-101.xls` ~ `105.xls`. Loop / user tag: `LPDSI\LMYP-1 DCS TCS\LMYP1 LOOP&USERTAG(new)\`.

## 3. Instrument loop diagrams

- K1AU3-E2-0-104 #1 at #2 Instrument Loop Diagram (U1, U2): FHI1 `E2 Engineering Data of instrument\AS BUILT\K1AU3-E2-0-104 #1 Instrument Loop Diagram.pdf` (2017 copy: "(I1-020A)").
- Package loop diagram (CEMS / analyzer package K1AU3-D1-0-062): `LPDSI\DCS FEIL\IC\DCS\DCS\FHI MASTER DOCUMENTS\D1 ...\K1AU3-D1-0-062 R0\...\6.EICA\139LMYP-1-R3-001 Instrument Loop Diagram-Rev.0.pdf`.
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-104 Instrument Loop Diagram\` (2 file: cover at drawing list lang, walang drawing). Water treatment P2: FHI2 `Water Treatment Drawing\145. LMYP-2-R3-001~014-r2 Instrument Loop Diagram.pdf`.

## 4. Instrument wiring at termination (JB schedule)

- K1AU3-E2-0-202 #1 / #2 Instrument Wiring Diagram (U1, U2): FHI1 `E2 ...\AS BUILT\K1AU3-E2-0-202 #1Instrument Wiring Diagram.pdf` (2017 copy: "(I1-010A)").
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-202 Instrument Wiring Diagram\` (2 file).
- JB termination schedule halimbawa (U2 lang, training): `LPDSI\DCS FEIL\IC\PLANT REFERENCES\Metrologyx Training\...\4.4. Junction Box Wiring Termination Schedule\` (9 file, U2-JBAI-001 ...).

## 5. Hook-up at installation

- K1AU3-E2-0-101 Instrument Hook-Up Drawing: FHI1 `E2 ...\AS BUILT\K1AU3-E2-0-101 Instrument Hook-Up Drawing.pdf`; R0 sa `E2 NON AS-BUILTS\`.
- Package hook-up: `...\K1AU3-D1-0-062 R0\...\6.EICA\135LMYP-1-R7-001~027_Instrument Hook-Up Drawing_Rev_0.pdf` (LPDSI).
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-101 Instrument Hook-Up Drawing\PDF\01-K3AU2-E2-0-101 Instrument Hook-Up Drawing.pdf`.

## 6. Junction box, stanchion, local control panel

- K1AU3-E1-0-108 Instrument Stanchion & Junction Box Drawing: FHI1 `E2 ...\` at `E1 ...\06-K1AU3-E1-0-108 Instrument Stanchion & Junction Box Drawing\` (LCP / JB detail). 2017 copy: "(IO-099~098) Junction Box Installation Drawing".
- Turbine JB list (P2, MHPS): FHI2 `DRWG FOR PHASE 2\Drawings\397_7M2WA04-372_R2 Local Junction Box List (Turbine Portion).pdf`, `370_3244R845001_R1 Terminal Box.pdf`.
- P2: FHI2 `(E2) ...\E2 K3AU2-E1-0-108 Instrument Stanchion & JB Drawing\` (9), `(E1) ...\02_K3AU2-E1-0-108_Maintenance Panel & Local Control Panel Drawing\` (15 CAD). U1 maintenance / local panel: `SMGP\E-LIBRARY\Maintetance Panel & Local Control Panel Drawing\` (1).
- Vendor JB: BFP `L7 BFP\B Junction Box Drawing & Manual\`, fluidizing air blower `L10-5 ...\500-0dv - Junction box REV03`.

## 7. Cable schedules at cable lists

- TCS: MHPS `(ML-TEQ-14-197 RB)-Cable from_ to List for Turbine Control System (FR).pdf` ("ML-" = Malita, kambal na MHPS project; check lang).
- Connection wiring (cable from / to) ng FHI, U1 + U2: `SMGP\E-LIBRARY\MH REFERENCES\MH files\Electrical Connection Wiring Diagram\` at FHI1 `E1 ...\`: `K1AU3E1-6003A-1 HV`, `6003B-1 LV`, `6003C-1 TG Connection Wiring Diagram.xlsb` (Unit 1), `K1AU3E2-6003A/B/C-1` (Unit 2), `K1AU3E0-6003-1 RCP`, `6003B-1 Water Treatment`, `6003C-1 Coal Handling`.
- Coal handling: `K1AU3U02-D-I03 Instrument cable schedule.pdf`, `D-E09 Power Cable Schedule.pdf` (`SMGP\E-LIBRARY\MH REFERENCES\CHS Drawings of Limay Power Plant\`; labas sa scope).
- Cable tray: FHI1 `E1 ...\K1AU3-E1-0-123 R2 Cable Tray Layout Drawing.pdf`, `141.LMYP-1-R2-001_r1_Instruments Wiring & Cable Tray Layout.pdf`; P2 `(E1) ...\06_K3AU2-E1-0-123_Cable Tray Layout Drawing\` (241 CAD).
- **Wala:** hiwalay na instrument cable schedule ng main plant DCS (K1AU3-E2) bilang listahan. Ang cable data ay nasa E2-0-202 wiring diagram at sa `LMYP-1(#1) WIRING.xls`.

## 8. Instrument list at data sheets

- K1AU3-E2-0-201 Instrument List: FHI1 `E2 ...\AS BUILT\K1AU3-E2-0-201 Instrument List.pdf`; Excel `REPO\over-all-instrument-list.xlsx`; calibration list `SMGP\E-LIBRARY\INSTRUMENT LIST\` (4).
- Specifications K1AU3-E2-0-001 ~ 020 (DCS, MOV, control valve, CEMS at O2, flow nozzle, pitot / orifice, drum level gauge, transmitter, TE / TT, gauges, switches, level, solenoid, condensate pot, butterfly CV, purge set): FHI1 `E2 ...\E2 NON AS-BUILTS\`.
- Drawings K1AU3-E2-0-122 ~ 143 (MOV, CV, CEMS, sampling rack, pitot, orifice, CCTV, drum level gauge, radar LT, electrode LS, reflex LG, PG, PS, TG, thermocouple, transmitter, sight glass, solenoid, condensate pot, control damper, purge set): FHI1 `E2 ...\`. Mas detalyado: `REPO\instrument-engineer-data-asbuilt\`.
- Turbine: MHPS `(ML-310SC90-779 R0)-Instrument List For Turbine And Generator`, `(ML-310SC90-771 R0)-Measuring List`, `(ML-310SC90-778 R0)-Setpoint List`.
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-201 Instrument List\` (4).

## 9. Instrument location at conduit layout

- K1AU3-E2-0-102 Instrument Location Plan: #1 Boiler, #2 Boiler, TG, Utility (FHI1 `E2 ...\AS BUILT\`; 2017 copy may sheet range).
- K1AU3-E2-0-103 Instrument Conduit Layout (FHI1 `E2 ...\`), at `SMGP\E-LIBRARY\Instrument Conduit Layout\` (58: k1au3e1-2301 index, 2304a/b Turbine House Unit 1 ground floor ...).
- K1AU3-E2-0-105 Instrument Air System.
- Turbine: MHPS `(ML-7M2DA30-533 / 534 / 535 R1)-Arrangement Of Measuring Point And Instrument` (ground, mezzanine, operating floor).
- `SMGP\E-LIBRARY\INSTRUMENT MAPPING\` (boiler, tg, pdf, sootblower: 62).
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-102 Instrument Location Plan\` (154), `E2-0-105` (3).

## 10. Power para sa control system (UPS, DC, 24 VDC, 110 VAC)

- UPS: FHI1 `E1 ...\E1\K1AU3-E1-0-110 RC Drawing of of UPS System.pdf`; spec `K1AU3-E1-0-004-RA Specification of UPS system.pdf`.
- DC charger at battery: `K1AU3-E1-0-111 R0 Drawing of DC Charge System.pdf`; spec `K1AU3-E1-0-005-RA`.
- DCS power distribution: `HW\06.PDP\K1AU3-E2-0-111_20171012.pdf`.
- 125 VDC EOP starter: `SMGP\E-LIBRARY\Turbine Generator\` / FHI1 E1 `GSE-2013-0091 R1 WIRING DIAGRAM OF 125V DC MOTOR STARTER FOR EOP.pdf`.
- Single line diagram: FHI1 `E1 ...\E1\K1AU3-E1-0-102 RD Single Line Diagram .pdf`.
- **Wala:** hiwalay na 24 VDC / 110 VAC distribution schedule bukod sa PDP drawing.

## 11. MCC interface at motor control schematics

- FHI1 `E1 ...\E1\K1AU3-E1-0-120 RA Elementary & Schematic Drawing.pdf` (U1 + U2).
- `SMGP\E-LIBRARY\Typical Schematic Control Wiring Diagram\` (1), `SMGP\E-LIBRARY\Standard Logic Diagram of Breaker\` (1).
- LV MCC: FHI1 `E1 ...\AS BUILT\K1AU3-E1-0-107 Drawing of LVMCC panel.pdf`; spec `K1AU3-E1-0-003-RA Specification of HVLV MCC.pdf`. HBT panel `K1AU3-E1-0-109`, 230 kV RCP `K1AU3-E1-0-105`.
- P2: FHI2 `(E1) ...\04_K3AU2-E1-0-120_Typical Schematic Control Wiring Diagram\` (53 CAD), `10_K3AU2-E1-0-128_Standard Logic Diagram of Breaker\` (24 CAD).

## 12. TCS, TSI, generator panels (GCP / GPP), AVR

- TCS (MHPS, prefix ML- = Malita twin): `(ML-TC-13-100 R0)-Basic Configuration of TCS`, `(ML-TC-13-163 R0)-Wiring Configuration of TCS Cabinet`, `(ML-TEQ-14-193 R1)-Elementary Diagram of TCS`, `(ML-331DM07730 R0)-Functional Block Diagram of TCS`, `(ML-331DM07737 R0)-Communication List`, `(ML-PCE-13-0104 R0)-Main Control System Configuration`, `(ML-PEE-13-0191 R0)-Typical Schematic Diagram for Interface`, `(ML-310SC90-773 R1)-IO List Between Customer And MHPS`, `(ML-310SD14-370 R3)-Turbine Wiring Diagram`, `(ML-310SD14-314 R2)-Turbine Local Control Diagram`. Limay version: `REPO\tcs-references\` (`LM-310SC90-793 R2` IO list, `TCS Elementary Diagram(TC).pdf`, `New Turbine Wiring Diagrams SD14370-R4.pdf`, IBD SC90794-R2).
- TSI: MHPS `(ML-TEQ-14-195 R3)-Elementary Diagram Of TSI`; FHI1 `Factory Acceptance Results TSI (UNIT 1 & 2).pdf` (252 MB: sabihin muna bago buksan); P2 `Drawings\375_331DM10713_R1 Elementary Diagram of TSI`.
- Generator panels: `SMGP\E-LIBRARY\Turbine Generator\GSE-2013-0068 R1 OUTLINE OF GEN. PROTECTION PANEL, GEN CONTROL AND METERING PANEL.pdf`, `GSE-2013-0083 R3 WIRING DIAGRAM ...`, `GSE-2013-0085 R2 WIRING DIAGRAM OF VT & SA CUBICLE.pdf`; site tests `GEE-2015-0141` (GCP), `-0143` (neutral grounding), `-0173` (protection relay panel). MHPS: `(ML-GSE-2014-0018 R0)-Setting List of Gen. Protection Panel, Gen. Control Panel`, `(ML-310SD03-743 R1)-Generator Protection_Breaker Logic Diagram`, `(ML-310SD18-193 R4)-Generator Wiring Diagram`.
- AVR / excitation: MHPS `(ML-GSE-2013-0080 R0)-Wiring Diagram Of AVR Cubicle`, `(ML-GSE-2013-0109 R1)-Interlock Block Diagram For Excitation System`.
- Babala: ang `3862-O&M-LYMP-TCS.pdf` sa O&M V18-3 ay **Tube Cleaning System** ng condenser, hindi turbine control.

## 13. SCADA at package PLC (Modbus)

- `SMGP\ARCHIVES\DCS TCS\DCS REFERENCE\LMYP-1 #1-DOCUMENT\Subsystem PLC\`: `LMYP-1 #1-Communication list between DCS and package.xls` (IP ng GCS) at bawat package: Turbine, SCADA, ESP, Fly Ash, CTCS, Coal Handling, Water Treatment, Air Compressor (IA / PA), Air Dryer (IA / PA). Bawat isa: `DVOP_LMYP-MODBUS_TCPIP COMMUNICATION For <package>.doc` + `IO List\...MODBUS Communication list ....xls` + communication test PDF. Kopya: `LPDSI\DCS FEIL\DCS & TCS\DCS\Subsystem PLC\`.
- Package PLC hardware: `LPDSI\LMYP-1 PLC\` (922: MH, SU hopper electrical manual at cable list), `LPDSI\DCS FEIL\IC\MH\MH PLC wiring diagram and Network\`, `SMGP\E-LIBRARY\MH REFERENCES\MH PLC wiring diagram and Network\` (10). Vendor O&M (sa `SMGP\E-LIBRARY\Operation and Maintenance Manuals\PHASE 1\`): L15 SCADA (training `L15 SCADA.pdf`), ESP, ash, air compressor.
- SCADA system drawing: FHI1 `E1 ...\K1AU3-E1-0-112 Drawing of SCADA System.pdf`, spec `K1AU3-E1-0-006`; vendor O&M `L23-2 & L23-3`.

## 14. Network at communication

- DCS network: `HW\01.System\K1AU3-E2-0-106` (system configuration), `HW\10.GCS\K1AU3-E2-0-115` (gateways).
- K1AU3-E2-0-204 Office Information Network (FHI1 `E2 ...\AS BUILT\`; 2017 copy "(I0-401~413)").
- P2: FHI2 `(E2) ...\E2 K3AU2-E2-0-204 Communication System Layout Diagram\` (5).
- CCTV, IP PBX, door access (K1AU3-E1-0-129), fire alarm (E1-0-118): FHI1 `E2 ...\`.
- TCS ↔ DCS: MHPS `(ML-331DM07737 R0)-Communication List`.
- **Wala bilang hiwalay na drawing:** FL-NET, V-net o "Information LAN" diagram; ang DCS network ay nasa E2-0-106 at E2-0-115 lang.

## 15. Grounding at earthing

- DCS: `HW\03.Ground\K1AU3-E2-0-108_20171003.pdf`.
- Plant: FHI1 `E1 ...\E1\K1AU3-E1-0-119-RB Grounding And Lightning Layout Drawing.pdf`, calculation `K1AU3-E1-0-301 RB`, index `k1au3e0-1001-9 Drawing Index for Grounding.pdf`.
- Generator neutral grounding cubicle: `GEE-2015-0143 R2` site test.
- P2: FHI2 `(E1) ...\03_K3AU2-E1-0-119_Grounding & Lightning System Drawing\` (41 CAD).

## 16. Electrical power system: switchgear, MCC, transformers, protection, metering (U1 + U2)

Lahat sa FHI1 `E1 Engineer data of electrical equipment\` (`E1\` o `AS BUILT\`), pinakabagong revision muna:
- K1AU3-E1-0-102 Single Line Diagram (RD), K1AU3-E1-0-104 230 kV one bay breaker, -105 230 kV RCP panel, -106 6.9 kV power system (MV switchgear), -107 LV MCC panel, -109 HBT high speed transfer panel, -110 UPS, -111 DC charger, -112 SCADA system, -113 transformer, -114 bus duct, -115 generator main circuit breaker (GMCB), -116 real time record (fault recorder), -120 elementary at schematic, -131 6.6 kV soft starter, -103 emergency diesel generator.
- Specifications: -003 HV / LV MCC, -004 UPS, -005 DC, -006 SCADA, -007 transformer, -008 bus duct.
- 460 V sootblower bus: `SMGP\E-LIBRARY\INSTRUMENT MAPPING\sootblower diagram\1TNR003746D1006 SLD for UNIT 1 460V SYSTEM SB-11.pdf`.
- Generator protection at metering: tingnan ang seksiyon 12 (GSE-2013-0068 / 0083 / 0085, ML-GSE-2014-0018 setting list, ML-310SD03-741 one line, -743 protection / breaker logic).
- Vendor O&M (`SMGP\E-LIBRARY\Operation and Maintenance Manuals\PHASE 1\`): `L23-1 AIS, BUS DUCT, GMCB, MV & LV, RCP & TR & VFD`, `L23-2 & L23-3 UPS, HBT, FTR, SCADA, SOFT STARTER, CTTS`, `L24-1 Main transformer`, `L24-2 Auxiliary transformer` (AVR), `L28 Motor control damper, EDG` (ABB Emax ACB), `L22 DCS`, `L27 Instrument` (14 vendor), `L26 CEMS`.
- P2 relay settings: FHI1 `E1 ...\K3AU2-E0-7010A-0 U3 Protection Relay Setting Table For 460V.pdf` (at 7010B U4).
- **Meron (Units 1-4 magkakambal):** K3AU2-E0-7010A/B 460 V relay setting, 7011A/B MV calculation, 7012A/B; tingnan ang "Ikalawang hanap".

## Hop by hop: alin ang may dokumento

- Field device: oo (E2-0-201 instrument list, E2-0-001 ~ 020 spec, E2-0-122 ~ 143 drawing, MHPS 310SC90-779).
- Lokasyon at conduit: oo (E2-0-102, E2-0-103, E-LIBRARY Instrument Conduit Layout, MHPS 7M2DA30-533 ~ 535).
- JB / LCP / stanchion: oo (E1-0-108); turbine JB list P2 lang (7M2WA04-372).
- Cable: bahagi (E2-0-202 wiring, E1 / E2 6003 connection wiring xlsb para sa HV, LV, TG, RCP; ML-TEQ-14-197 TCS cable list). Walang hiwalay na DCS instrument cable schedule.
- Marshalling / IRP / ARP / SER: oo (E2-0-114, -116, -117 at mga WIRING.xls).
- Cabinet / card / channel: oo (E2-0-109 FCS, E2-0-117 FCS wiring, IO Card.xlsx, io-card-hardware.xlsx).
- Address / tag: oo (E2-0-118 IO list, dcs-io-list.xls, memory lists, LOOP / USERTAG, TCS IO list LM-310SC90-793).
- Tumatanggap na system: DCS (E2-0-106), TCS / TSI (MHPS TC-13-100, TEQ-14-193 / 195), GCP / GPP (GSE-2013-0068 / 0083), AVR (GSE-2013-0080), SCADA (E1-0-112, Modbus list), package PLC (Modbus lists bawat package), switchgear at MCC (E1-0-106 / 107 / 120).
- Power ng control system: oo (E1-0-110 UPS, -111 DC, E2-0-111 PDP).
- Network: bahagi (E2-0-106, E2-0-115, E2-0-204, ML-331DM07737). Walang hiwalay na FL-NET / V-net drawing.
- Grounding: oo (E2-0-108 DCS, E1-0-119 plant).

## Ikalawang hanap (2026-11-14 gabi): nakita na ang 5 dating "wala"

Batayan: magkakambal ang Units 1, 2, 3 at 4 (user 2026-11-14). Valid ang dokumento ng kahit anong unit para sa Unit 1 hardware; tag at address laging galing sa Unit 1. Hinanap ang buong `SMGP\LAPTOP_BACKUP_02062026` (55,227 files, nag-iisang laptop backup sa OneDrive), Teams Chat Files, at loob ng 1,833 zip sa `LPDSI`.

### 1. Relay setting table (MV / LV)

- `SMGP\USBTRANSFER\FHI Drawing\PHASE 1\E1 Engineer data of electrical equipment\Electrical Engineering Drawing\`: K3AU2-E0-7010A-0 U3 Protection Relay Setting Table For 460V, K3AU2-E0-7010B-0 (U4), K3AU2-E0-7011A-0 U3 Calculation Sheets For MV System, K3AU2-E0-7011B-0, K3AU2-E0-7012A-0, K3AU2-E0-7012B-0
- Generator protection: `Other AS builts\HITACHI Turbine-Generator\MHPS EI\(ML-GSE-2014-0018 R0)-Setting List of Gen. Protection Panel, Gen. Control Panel (FF).pdf`; P2 `419_DBE-16-0138_R1`
- Unit 1 suporta: `E1\K1AU3-E1-0-304 RA Calculation for short circuit`, `-307 RA voltage dip of large motor starting`, `-302 RA load schedule`
- Tala: walang K1AU3 file na "relay setting" ang pangalan (wala ang E1-0-305 / 306 sa set). Binuksan ang `L23-1 ...\4.MV\LIMAY MV OPERATION & MAINTENANCE GUIDE-20141209.docx`: maintenance lang, walang setting.

### 2. Instrument at power cable schedule

- `SMGP\E-LIBRARY\MH REFERENCES\CHS Drawings of Limay Power Plant\`: K1AU3U02-D-I03 Instrument cable schedule, K1AU3U02-D-I05 Instrument Connection List, K1AU3U02-D-E09 Power Cable Schedule
- `SMGP\E-LIBRARY\MH REFERENCES\MH Phase 2\`: instrument\K3AU2U02-D-I03 R0 Instrument Cable Schedule, electrical\K3AU2U02-D-E06 R0 Power Cable Schedule
- `SMGP\USBTRANSFER\FHI Drawing\PHASE 2\DRWG FOR PHASE 2\Drawings\572_TRE-16-006_R6 Cable List for Limay Phase 2.pdf` (TG)
- `SMGP\LAPTOP_BACKUP_02062026\DESKTOP\TURN OVER FILES\DIAGRAMS\K1AU3U02-D-I05 Instrument  Connection List (Wiring List).pdf`
- U2 JB at marshalling termination schedule: `LPDSI\DCS FEIL\IC\PLANT REFERENCES\Metrologyx Training\FOR METROLOGYX TRAINEES (NC-II Module-2)\4. LOOP CHECKING\4.4 Junction Box Wiring Termination Schedule\` at `\4.5 Marshalling Cabinet Wiring Termination Schedule\`

### 3. 24 VDC / 110 VAC distribution

- `SMGP\LAPTOP_BACKUP_02062026\DESKTOP\E-LIBRARY\DCS PLC\LMYP-1 #1-DOCUMENT(Hardware)\06.PDP\K1AU3-E2-0-111_20171012.pdf`
- `SMGP\USBTRANSFER\something\♠FOR INFORMATION♠\Engineering Data of Instrument\K1AU3-E2-0-106~117 Hardware\07.PDP\PDP_20150626.pdf`
- `SMGP\ARCHIVES\DCS TCS\RTS\ASSET POLICY\Asset Policy DCS\11. Power Distribution Panel (RED).xlsx`
- `...\TURN OVER FILES\INVENTORY\DCS & HMI\DCS FCS\PDP.xlsx`
- MH: K1AU3U02-D-E07 Power distribution panel; P2 K3AU2U02-D-E11 R0 Power Distribution System of Local Panel
- UPS / DC: `E-LIBRARY\Operation and Maintenance Manuals\PHASE 1\L23-2 & L23-3 ...\1.UPS`, `\3.DC Charger`; E1-0-302 load schedule

### 4. Control network / LAN

- `SMGP\LAPTOP_BACKUP_02062026\DOCUMENTS\Technical Documentations and Procedures\LIMAY1 DCS - Updated Network Diagram.pdf` at `LIMAY2 DCS - Updated Network Diagram.pdf` (kopya rin sa `SMGP\Microsoft Teams Chat Files\`)
- `...\K1AU3-E2-0-106~117 Hardware\02.UTILITY\System_Ethernet_Layout_20150626.pdf`
- `...\TURN OVER FILES\DIAGRAMS\K1AU3-E2-0-204(I0-401~413) Office Information Network.pdf`
- `...\TURN OVER FILES\DCS TCS\XSML#2 Network Diagram.pdf`
- `SMGP\E-LIBRARY\DCS PLC\Fiber Optic Network Limay-1-2 asbuild.xlsx`
- E1-0-129 Communication System Layout Diagram
- FL-net card firmware at driver: `LPDSI\DCS FEIL\IC\PLANT REFERENCES\CX產品使用之FLnet PCI更新\`

### 5. DCS hardware set E2-0-106 ~ 118

- Unit 1 as-built 2017: `SMGP\LAPTOP_BACKUP_02062026\DESKTOP\E-LIBRARY\DCS PLC\LMYP-1 #1-DOCUMENT(Hardware)\01.System ... 12.Wiring\` (E2-0-106 System, -107 Layout, -108 Ground, -109 FCS, -110 COS, -111 PDP, -112 SER, -113 ANP, -114 ARPIRP, -115 GCS, -116 MPL, -117 FCS WIRING at IRP_ARP_SER). Kopya sa `DESKTOP\E-LIBRARY\DCS Reference\` at sa zip `LPDSI\LMYP-1 DCS TCS\LMYP-1 #1-DOCUMENT.zip`
- Unit 1 2015 set: `SMGP\USBTRANSFER\something\♠FOR INFORMATION♠\Engineering Data of Instrument\K1AU3-E2-0-106~117 Hardware\01.BASE ... 13.Wiring\`
- P2: `...\TURN OVER FILES\DCS TCS\K3AU2-E2-0-114_20190128 SECURED.pdf`, P2 E2-0-107 rack layout, P2 E2-0-118 DCS IO list folder (sa ilalim ng `E2 K3AU2-E2-0-119 Analog Control Logic Diagram\`), Unit 2 CES config backup `...\DCS TCS\UNIT 2 CES BACKUP\LMP2-101 ~ 104`

### Bago rin galing sa laptop backup

- `...\DESKTOP\TURN OVER FILES\DIAGRAMS\`: E2-0-101 hook-up, E2-0-102 location plans, E2-0-104 loop diagram #1 / #2, E2-0-105 instrument air, E2-0-107 rack room, E2-0-118 IO list, E2-0-201 instrument list, E2-0-202 wiring #1 / #2, E1-0-108 JB installation, MPW34021 LIMAY_SCADA_C1-20150610, Instrument List.xlsx, Instrument Conduit Layout (U2 as-built k1au3e2-2304 ~ 2324)
- `...\TURN OVER FILES\DCS TCS\DCS Files\`: IO Card.xlsx, IO List\LMYP-1 #1_IO_Rev.1, Loop Test Report, DIGITAL INTERLOCK LIST-20160111.xls, GCS\LMYP-1 #1-Memory for Sub_System PLC MODBUS.xls, DCS References\DCS Hardware (英文).pdf
- `...\TURN OVER FILES\INVENTORY\DCS & HMI\` at `DCS Inventory Compilation\`: FCS, PDP, SER, ARPIRP, GCS, DCS ROOM xlsx; SCADA IO.xlsx, SCADA RTU Material Specs

## Natitirang tala

- Bilang ng pahina ng bawat PDF: hindi binuksan (nagda-download ang OneDrive file).
- Personal OneDrive (`C:\Users\Ronanski\OneDrive\`) 1 file pa lang ang naka-sync: i-scan ulit pag tapos na.
