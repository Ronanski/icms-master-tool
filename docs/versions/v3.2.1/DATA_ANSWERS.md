# Data questions — sagot mula sa docs (2026-11-04 PHT, IRENE)

Utos ng user: "Data questions? Search nio muna." Ang bawat sagot ay may source.

1. **SWP current (vendor 229 A vs SOP 205 ~ 215 A): walang conflict.** Snapshot (`docs/hmi/OPERATING_POINTS.md`, SEAWATER page): SWP-B 242.5 A, SWP-C 207.6 A habang parehong tumatakbo. Ang 229 A ng model (EBARA + TECO) ay nasa pagitan ng dalawang totoong value. Ang 205 ~ 215 A ng SOP ay range para sa normal.
2. **IA compressor motor (165 kW vs 286 A sa 190 kW): 190 kW.** K1AU3-D1-0-059 R0, TECO-YASKAWA outline P1309238, RATINGS table: FELA-8T, 190 kW, CONT, 3600 min-1, 2 P, 460 V, 60 Hz. Ang torque / current curve ay "at 190 kW, 286 A". Ang thermal withstand sheet lang ang may "165 kW". Ginamit: 286 A sa 190 kW.
3. **Dosing chemicals (unit chemical dosing, STN101):** I/O list: Tri-sodium phosphate (Z-1107A/B), Neutral amine (Z-1108A/B), "Carbon hydraride" (Z-1109A/B) = carbohydrazide, oxygen scavenger (typo ng I/O list). Tanks LS-CH1101 / 1103 / 1105.
4. **VT-SW1501: motor bearing.** I/O list STN103 AI0725 / 0726: "#1 Seawater pump-A motor bearing vibration (1) / (2)", 0 ~ 25.4 mm/s (pareho sa B at C).
5. **P-0762A/B at Z-1701A/B: parehong hypochlorite dosing, magkaibang numbering.**
   - Flow diagram K1AU3-PD-043 Rev C (2014): "Z-1701 A/B UNIT NO. 1 HYPO-CHLORINATED DOSING PUMPS, Cap 1.2 m3/h", tank Z-0701 50 m3, papunta sa unit 1 seawater inlet channel.
   - Overall instrument list (PD-043, "NEW ADDED", PACKAGE): "NaOCL DOSING PUMP P-0762A / B", tanks T-0762A / B.
   - Ang instrument list at I/O list ang as-built (package ng supplier), kaya P-0762A/B ang ginagamit sa app. Ang PD-043 ay lumang numbering bago ang package.
6. **MWP current (vendor ~28 A vs snapshot 20.5 ~ 20.8 A): totoong conflict sa docs.**
   - Vendor K1AU3-D1-0-032: kahit sa shut-off, 18.9 BHP ang pump. Sa TECO load curve, ~23 A iyon, kaya hindi aabot sa 20.7 A.
   - Snapshot 28.png: MWP-A 20.5, MWP-C 20.8 A sa header 9.0 kg/cm2. SOP: 20 A.
   - Desisyon (CLAUDE.md: ang snapshot ang totoong operating point): ika-calibrate ang power ng MWP sa snapshot (×0.74). Ilalagay sa susunod na push, may tala na UNUSUAL.
7. **Drum water capacity: mga 32 t, may source na (2026-11-07).** Steam Drum as-built K1AU3-B-0-004 (DWG K1AU3D-101 Rev 4) note 10: 94,000 kg empty, 126,000 kg full of water; ang diperensya ang tubig kapag puno, hindi ang normal level. PC lang ang drawing. Hindi pa ito nakakabit sa model. Luma: **Drum water volume: WALA sa docs** (hinanap 2026-11-04 PHT: repo `document-references/`, FHI boiler manual buong Part 1 ~ 5, at sa PC: `tg-engineer-data`, listahan ng `o&m-package-phase-1`). Ang nakita lang: drum level range -422 ~ 820 mm at tap distance 124.2 cm (`drum-level-calculation.xls`), furnace volume 4,000 m3 (FHI Part 2 Sect 7 Tab_2). Hindi pa nahanap: `instrument-engineer-data-asbuilt` (PC).
8. **Turbine heat balance diagram (HBD): WALA bilang sariling drawing.** Pinakamalapit: Mass Balance K1AU3-A2-0-001 (repo) MB-011 main steam, MB-012 cold / hot reheat, MB-013 extraction, MB-016 condensate, MB-017 feedwater: flow, pressure, temperatura (walang enthalpy at heat rate). TG operator manual (MHPS, O&M L2 TG 2-1-1, kopya ng Davao project): walang HBD. Hindi pa nabasa: TG maintenance manual (163 MB) at turbine control system (136 MB) sa PC.
