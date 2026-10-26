# Instrument, control valve at shutoff valve laban sa plant model (3.2.0-beta.39)

> Listahan at pagsusuri lang (walang binago sa app). Ginawa 2026-10-27 PHT para sa roadmap step 2 ~ 4 (plant model, starting points, Training), step 6 (HMI) at step 8 (Library: instrument list). Buong data, isang hilera bawat item: [`instrument-coverage.csv`](instrument-coverage.csv) (bukas sa Excel).

## 1. Buod (simple)

- **2,411 item** ang sinuri: 2,361 mula sa *Over-all Instrument List* ng user + 50 mula sa DCS I/O list na wala sa listahang iyon (AO ng ibang supplier, at valve na may open / close switch lang).
- **Control valve / damper: 94.** 23 ang tunay na kasama sa physics ng plant model, 43 ang "bahagya" (ang PV ay sumusunod lang sa sariling valve, walang epekto sa ibang bahagi ng planta), **28 ang wala** (karamihan ang 22 furnace wall damper at ang 4 bottom ash cooler speed).
- **Shutoff (on / off) valve: 132.** 9 lang ang kasama (RH blow-off MOV at ang 8 burner oil valve), 4 ang bahagya. **117 ang wala sa proseso**: binubuksan / sinasara sila ng DITL (may open / close feedback ang MOV model), pero walang nangyayari sa steam, tubig o hangin. Kasama rito ang mga valve na hinihingi ng SOP: main steam stop MOV-MS1391, BFP discharge MOV, extraction steam MOV, mga drain ng warming, spray block valve, coal feeder outlet valve.
- **Instrument na may DCS signal: 1,090.** 52 ang kasama, 39 ang bahagya, 209 ang valve feedback na gawa ng DITL MOV model, **765 ang wala** (ang value ay galing lang sa starting state: snapshot sa 150 MW o ang Cold value). Ang malaking bahagi ng 765: 123 valve position (ZT), 127 bearing / winding / vibration ng motor, 119 protection switch (pressure, level, flow), at 244 process transmitter.
- **741 local / package item** (gauge, thermowell, flow element, regulator, LCP ng package): hindi kailangan sa plant model; ipinapalagay na nasa posisyon ng SOP (utos ng coordinator / user).

Ang ibig sabihin para sa user: ang plant model ngayon ay tumpak sa **pangunahing daan ng enerhiya** (gatong → apoy → drum → main steam → bypass / turbine → MW, kasama ang hangin, furnace pressure, feedwater, spray at O2). **Ang kulang** ay ang mga "kalakip na sistema" (water cycle: hotwell → deaerator → BFP; feedwater heater at extraction; warming at drain; bed inventory) at ang mga **on / off valve na hinihingi ng SOP** na hindi pa nakikita ng proseso. Ang prayoridad ng pag-aayos ay nasa seksyon 4.

## 2. Saan galing at paano sinuri

| Batayan | File sa repo | Gamit |
|---|---|---|
| Over-all Instrument List (user, 2026-10-26) | `document-references/over-all-instrument-list.xlsx` (sheet MASTER, 2,361 hilera) | tag, gamit, P&ID drawing no., range, signal, supply scope |
| Flow diagram (P&ID) | `document-references/flow-diagram-K1AU3-A1-0-001.zip` (RA 65 pahina, RB 24) | drawing list PD-010 ~ PD-074 → pangalan ng system (column `sys`) |
| DCS I/O list + memory list | `src/data/ades.txt` (galing sa `dcs-io-list.xls`, memory list 101 ~ 105) | address (station, AI / AO / DI / DO), range |
| ABC at DITL drawings | `src/data/apre.txt`, `src/data/pre.txt` (ang na-parse na sheet) | nasa logic ba ang tag |
| Plant model | `src/analog/engine/unit.js`, `tcs.js`, `source.js`, `plant.js` | **pinatakbo ang tunay na engine** (Start at 150 MW at Start Cold, 60 s bawat isa) at itinala kung aling transmitter ang sinusulat ng unit model, aling loop ang may loop model, at aling controller ang nagpapagalaw sa bawat AO |
| Training | `src/ui/training/guide.js`, `live.js`, `dock.js`, `src/ui/uat/check.js` | ginagamit ba ng Training ang tag |
| SOP | `document-references/procedure-start-up-PR-OPE-5002-02.docx` | binabanggit ba ng start-up procedure ang tag |

Ang script: `tools/data/instrument_list.py` (xlsx → JSON) at `tools/data/instrument_coverage.js` (pagtutugma). Ulitin kapag nagbago ang plant model:

```
python3 tools/data/instrument_list.py /tmp/il.json
node tools/data/instrument_coverage.js /tmp/il.json docs/versions/v3.2.0
```

**Limitasyon (pangalan ng eksaktong bahagi):**
- Ang flow diagram PDF ay **scan na 100 dpi** (826 × 1169 px bawat pahina, walang text layer): nababasa ang drawing list (pahina 2 ~ 4) at ang pangalan ng system, pero hindi mabasa nang maaasahan ang maliliit na tag sa loob ng bawat P&ID. Kaya ang listahan ng item ay galing sa Instrument List at I/O list; ang flow diagram ay ginamit sa system grouping at sa daloy (hal. hotwell → CEP → LP heater → deaerator → BFP → HP heater → economizer).
- Ang pagtutugma sa SOP / Training ay sa tag number (hal. `MS1391`, `MVMS1391`). Ang hakbang ng SOP na walang tag (hal. "open drain valve") ay hindi nabibilang.
- Ang manual valve, hand valve at local gauge ay hindi isinama (ipinapalagay na nasa SOP position).

**Kahulugan ng status:**

| Status | Ibig sabihin sa app |
|---|---|
| **KASAMA** | Bahagi ng physics: ang galaw ng valve ay nagbabago ng steam / tubig / hangin / MW, o ang transmitter ay sinusulat ng unit model mula sa mass at energy balance. |
| **BAHAGYA** | May loop model (`plant.js`): ang PV ay sumusunod sa SARILING valve (first-order), may "source" kung minsan (`source.js`: walang PV kapag patay ang pump / walang steam). Walang epekto sa ibang bahagi ng planta. |
| **FEEDBACK** | Valve open / close / torque switch na ginagawa ng DITL MOV / solenoid model (`src/digital/parts/03-models.js`): tama ang logic, pero hindi nakikita ng proseso ang valve. |
| **WALA** | Walang model. Ang value ay galing sa starting state (snapshot sa 150 MW, o ang Cold value) o sa kamay ng user. |
| **—** | Local / package item: hindi kailangan. |

## 3. Mga nakita sa daan (findings)

1. **(b) tama, may ebidensya:** ang start-up feedwater valve ng `LICBR1001B` (ABC-010) ay **FCV-FW1130-2** (AO0340, drawing at I/O list). Ang comment sa `unit.js` (beta.15) ay nagsasabing "FCV-FW1060"; ang TCV-FW1060 ay ang HP bypass spray (ABC-051). Comment lang ang mali, tama ang code. Isasama sa susunod na pagbago ng `unit.js` (hindi ginalaw dito: hawak ng PR #47).
2. **(a) bug, hindi pa naayos (para sa fix queue):** ang pangalawang drum level at drum pressure transmitter (`LT-BR1001-2` AI0258, `PT-BR1001-2` AI0385, ABC-010) ay hindi sinusulat ng model: dalawang transmitter ang gumagalaw, isa ang nakatigil. Lalabas ang deviation alarm at mali ang median kapag lumayo ang dalawa.
3. **(a) bug, hindi pa naayos:** walang valve position transmitter (ZT, 123) na sumusunod sa valve: hal. `ZT-FW1130-1` ay nakatigil kahit gumagalaw ang FCV-FW1130-1. Sa HMI at faceplate, iba ang MV at ang posisyon.
4. **(a) bug, hindi pa naayos:** ang protection switch (drum level LSHH / LSLL-BR1001, furnace pressure PSHH / PSHHH-FG1085 ~ 1087, condenser pressure PS-CD1110, IDF coupling oil PSLL-LO1756…) ay hindi sumusunod sa PV ng model: ang trip ng IRP / DITL na galing sa switch ay hindi kusang lalabas.
5. **Hawak na ng PR #47 (plant model, step 2):** RH / SH biasing damper (HICHR1002A / B, TCV-FG1116 / 1117: baligtad ang direksyon sa beta.39), at ang mga Cold value na nananatili sa 150 MW (PT-FA1088, PT-FA1085, TT-FA1076 / 1077 / 1086 / 1087, IDF speed ST-LO1756). Hindi inulit dito.
6. Ang `MV-AS1391` (aux steam mula sa main steam) at `MV-AV1391` (vacuum breaker) ay **switch sa TCS panel** ng app (`tcs.js` `tc.asv`, `tc.vb`), hindi ang tunay na DCS MOV ng DITL-51 / DITL-56. Dalawang lugar para sa iisang valve.

## 4. Fix queue: ano ang dapat idagdag sa plant model (Cold start → 150 MW)

Pagkakasunod: **P1** = ang Training / plant ay tumatanggap ng maling operasyon o hindi lumalabas ang trip na dapat (maliit na trabaho, malaking epekto sa realism); **P2** = mga balance ng kalakip na sistema na kailangan para tama ang mga numero mula Cold hanggang 150 MW; **P3** = para sa HMI at kumpletong itsura, maliit ang epekto sa proseso. Laki ng trabaho: S (maliit, ilang oras), M (isang araw), L (ilang araw).

| # | P | Ano ang idadagdag | Mga item | Bakit (SOP / logic) | Laki |
|---|---|---|---|---|---|
| 1 | P1 | **Valve position = valve command.** Ang ZT ng bawat control valve / damper ay sumusunod sa MV (may maikling lag); ang ZT ng MOV ay sumusunod sa DITL MOV position. | 123 ZT (hal. ZT-FW1130-1 / -2, ZT-FA1053-1, ZT-LO1756, ZT-FG1116-A ~ D, ZT-CD1104, ZT-AS1020-1 / -2, ZT-TS1001 ~ 1005) | HMI at faceplate: ang operator ay tumitingin sa posisyon, hindi sa MV. | S |
| 2 | P1 | **Protection switch = PV ng model laban sa setpoint.** Ang bawat DI switch na ang PV ay may model ay kusang nagbabago (drum level, furnace pressure, condenser pressure, deaerator level, hotwell level, BFP suction). Ang setpoint ay mula sa alarm list / drawing; kung wala, ang trip value ng ABC comparator ng parehong PV. | LSHH / LSH / LSL / LSLL-BR1001-1 / -2, PSHH / PSHHH-FG1085 / 1086 / 1087, PS-CD1110-1 ~ 3, LSLL-CD1104-4, LSHH / LSLL-CD1110, PSLL-LO1756 (≈ 40 switch) | Trip at interlock ayon sa IRP / DITL (MFT sa drum level LL, furnace pressure HHH, low vacuum). Ngayon kailangang pilitin ng user. | M |
| 3 | P1 | **Main steam stop MOV.** Walang steam sa turbine kung sarado ang MV-MS1391; ang warming ay sa bypass MV-MS1392. | MV-MS1391, MV-MS1392 (DITL-38) | PR-OPE-5002 "Preparation for starting and warming up of turbine": buksan bago ang roll. Ngayon ang turbine ay umiikot kahit sarado. | S |
| 4 | P1 | **BFP discharge MOV.** Ang feedwater flow ay kailangan ng tumatakbong BFP **at** bukas na discharge MOV (o ang bypass nito sa pagpuno). | MV-FW1001, MV-FW1002, MV-FW1391, MV-FW1392 (DITL-38) | SOP "Steam drum filling". Ngayon sapat na ang BFP running (`unit.js` U.mul). | S |
| 5 | P1 | **Spray block valve.** Walang spray kapag sarado ang block valve, kahit bukas ang TCV. | XV-FW1111-1 / -2, XV-FW1121-1 / -2 (SH spray), XV-FW1151 (RH spray), XV-FW1061 (HP bypass spray), XV-CD1114 (LP bypass spray) | DITL-32 / 33 / 35 / 79 / 62. Ang MST ay umaabot 555 °C sa beta.39 (step 2): dapat tama muna ang spray path. | S |
| 6 | P1 | **Coal feeder outlet / silo outlet valve.** Walang coal sa furnace kapag sarado ang outlet valve. | XV-CL1061-A7 / B7 / C7, silo outlet valve -1 / -2 ng bawat feeder | SOP "Solid firing". Ngayon ang feedrate = MV kapag tumatakbo ang feeder (`plant.js` anFeederStep). | S |
| 7 | P2 | **Water cycle mass balance.** Hotwell level ← condensate pump ← make-up; deaerator level ← condensate flow − feedwater flow; BFP suction pressure ← deaerator pressure + level. | LICCD1110A / B (LCV-MU1110, LCV-CD1110), LICCD1104 (LCV-CD1104), FICCD1120 / 1121, PT-FW1115-A / B, DPT-FW1115-A / B, PT-FW1011, MV-MU1001, XV-CD1104-2, LSLL-CD1104-4 | SOP "Condenser hot well filling", "Deaerator filling", "Steam drum filling": ngayon ang deaerator ay hindi nauubos kahit pinupuno ang drum. | M |
| 8 | P2 | **Feedwater heaters at extraction steam.** Feedwater temperature (TT-FW1160, TT-FW1105 / 1106, TT-BR1020 ~ 1040) mula sa deaerator + HP heater na may extraction (MV-TS1001 ~ 1005 bukas, turbine on load); heater drain level mula sa extraction. Epekto: gatong bawat MW at ang economizer. | MV-TS1001 ~ 1005, MV-TS1389 ~ 1400 (drain), MV-CD1001 ~ 1003, LCV-HD1101 ~ 1106, PT-TS1013 ~ 1026, TT-TS1011 ~ 1027, TT-CD1101 ~ 1103 | SOP 4.6 (heaters in service sa load). Ngayon ang heater level ay may source lang (`source.js` ext), walang temperatura. | L |
| 9 | P2 | **Warming at drain ng steam line.** Ang warming ng HP / LP bypass at ng turbine ay kailangan ng bukas na drain; kapag sarado, mabagal ang pag-init ng line (o alarm). | XV-MS1011, XV-MS1023, XV-CR1011 / 1012, XV-HR1021 / 1022, XV-HR1010-1, MV-AS1394, MV-AS1392 / 1393 | SOP "HP and LP bypass system warming up", "Auxiliary warming up". | M |
| 10 | P2 | **Bed inventory (CFB).** Bed pressure / furnace DP mula sa dami ng bed: + sand injection, + limestone, − bottom ash cooler (speed). Ang bed ang nagbibigay ng furnace DP at ng heat transfer. | XV-SD1802A / B (sand), INV-M1311 (limestone), SC-L1060A ~ D (SICL1060A ~ D), DPT-FG1081 ~ 1084 / 1183 / 1184, PT-FG1009 (seal pot) | SOP "Bed material injection", "Solid firing" (PIFA1088). Ngayon DPICFG108 ay loop model lang (PAF running). | L |
| 11 | P2 | **Fluidizing air blower B at mga valve ng FAB.** Ang FA flow ay galing sa A o B blower, sa inlet valve (FCV-FA1055-A1 / B1) at isolating valve; ang surge valve ay naglalabas. | FCV-FA1055-B1 (FICFA1055B: walang model), XV-FA1055-A2 / A3 / B2 / B3, FT-FA1055, PT-FA1055-A / B | SOP "FAB start-up", "Furnace purge". | M |
| 12 | P2 | **SH no.1 outlet → reheater MOV (start-up RH protection).** Steam sa reheater bago bumukas ang HP bypass. | MV-BR1391 (HICBR1391, ABC-055) | Training ay gumagamit na nito (TRN), loop model lang. | S |
| 13 | P2 | **Condenser vacuum transmitter at ejector MOV.** Ang vacuum share ng `unit.js` (U.vac) ay isulat sa PT-CD1110 at sa condenser temperature; ang ejector ay ang tunay na MOV (MV-AS1395 / 1396) at ang vacuum breaker ay MV-AV1391 ng DITL (hindi ang hiwalay na TCS panel switch). | PT-CD1110, TT-CD1110-1 ~ 4, MV-AS1395, MV-AS1396, MV-AV1391, MV-AS1391 | SOP "Vacuum up", "Gland sealing". Finding 6. | M |
| 14 | P2 | **Pangalawang drum level / pressure transmitter.** Isulat din ang -2 (finding 2). | LT-BR1001-2, PT-BR1001-2 | Median select at deviation alarm ng ABC-010. | S |
| 15 | P3 | **Kalusugan ng motor.** Bearing / winding temperature at vibration: ambient kapag patay ang motor, normal na value (snapshot) kapag tumatakbo, may lag. | 127 TT / VT ng BFP, CEP, IDF, PAF, SAF, FAB, SWP, aux cooling pump | HMI ng equipment. Hindi nakakaapekto sa proseso. | S |
| 16 | P3 | **Flue gas path temperatures.** Flue gas temperature sa bawat heat surface (RH / SH / economizer / APH inlet / outlet, cyclone) mula sa bed temperature at load. | TT-FG1092 ~ 1113, TT-FG1124 / 1125 / 1132 / 1133, TT-FG1152, PT-FG1121 / 1134 / 1141 / 1151 | HMI ng air & flue gas (PR #49). | M |
| 17 | P3 | **Furnace wall SA damper.** Ang distribution ng SA (front / rear wall) ay may maliit na epekto sa bed temperature at CO. | HICFA1005 ~ 1026 (MCV-FA1005 ~ 1026, 22) | Walang hakbang ng SOP na may numero. | M |
| 18 | P3 | **Stack / CEMS at sampling.** CO, NOx, dust, opacity, O2 at flow sa stack mula sa coal, air at limestone. | AT-FG1057-2 ~ 6, FT-FG1057-7, TT-FG1057-8, PD-044 sampling | HMI at environmental limits. | M |
| 19 | P3 | **Utilities na wala pang model** (nasa SPEC "sa hinaharap"): aux cooling water, compressed air, seawater pressure, sootblowing steam, blowdown MOV, condensate polisher. | PD-020 / 021 / 023 / 015 / 019 (MV-BD1001 / 1002) / 047 | Ang mga pump at motor ay may running status na; pressure / flow ay wala. | L |

Hindi kailangang idagdag: ang manual valve, hand valve, local gauge, thermowell, flow element, pressure regulator at ang mga instrument ng package panel (LCP) — 741 item (ipinapalagay na nasa posisyon ng SOP).

**Rekomendasyon:** gawin ang #1 ~ #6 (lahat P1, maliliit) **pagkatapos** ma-merge ang PR #47 (plant model step 2), sa isang batch, bago ang step 3 ~ 4. Ang #7 ~ #14 (P2) ay kasama ng step 4 (Training laban sa SOP), dahil doon lalabas ang mga hakbang ng SOP na umaasa sa kanila. Ang P3 ay kasabay ng HMI redraw (step 6), dahil doon makikita ang mga value.

## 5. Ang mga listahan
### Bilang

| Grupo | Lahat | KASAMA | BAHAGYA | FEEDBACK lang | WALA | Hindi kailangan (local / package) |
|---|---:|---:|---:|---:|---:|---:|
| Control valve / damper (AO) | 94 | 23 | 43 | 0 | 28 | 0 |
| Shutoff (on/off) valve: XV, MOV | 132 | 9 | 4 | 0 | 117 | 2 |
| Solenoid ng valve (SV) | 70 | 8 | 0 | 0 | 62 | 0 |
| Instrument na may DCS signal (transmitter, switch) | 1090 | 52 | 39 | 209 | 765 | 25 |
| Sensor element (TE papuntang TT) | 284 | 28 | 5 | 0 | 143 | 108 |
| Local / package (gauge, thermowell, LCP) | 741 | 0 | 0 | 0 | 0 | 741 |

### A. Control valve / damper list

| Tag | Gamit | System (P&ID) | Controller (ABC) | Plant model | Ebidensya | SOP |
|---|---|---|---|---|---|---|
| FCV-DO1043-A3 | BURNER(A) FUEL OIL CONTROL VALVE | PD-022 Diesel oil | FICDO1043A (ABC-003A) | **KASAMA** | FICDO1043A: oil burner A flow -> firing (U.oilN) | ✓ |
| FCV-DO1043-B3 | BURNER(B) FUEL OIL CONTROL VALVE | PD-022 Diesel oil | FICDO1043B (ABC-003B) | **KASAMA** | FICDO1043B: oil burner B flow -> firing | ✓ |
| FCV-DO1043-C3 | BURNER(C) FUEL OIL CONTROL VALVE | PD-022 Diesel oil | FICDO1043C (ABC-003C) | **KASAMA** | FICDO1043C: oil burner C flow -> firing | ✓ |
| FCV-DO1043-D3 | BURNER(D) FUEL OIL CONTROL VALVE | PD-022 Diesel oil | FICDO1043D (ABC-003D) | **KASAMA** | FICDO1043D: oil burner D flow -> firing | ✓ |
| FCV-FW1130-1 | BOILER FEEDWATER FLOW CONTROL VALVE | PD-017 Feedwater | FICFW1007 (ABC-010) | **KASAMA** | FICFW1007: feedwater flow, 0 with no BFWP (U.mul) -> drum level | ✓ |
| FCV-FW1130-2 | BOILER FEEDWATER FLOW CONTROL VALVE-STARTUP | PD-017 Feedwater | LICBR1001B (ABC-010) | **KASAMA** | LICBR1001B: start-up feedwater valve, added to the feedwater flow (U.suv) | ✓ |
| MCV-FA1053-1 | PRIMARY AIR FAN INLET CONTROL DAMPER MOV | PD-052 Primary air | FICFA1071 (ABC-007) | **KASAMA** | FICFA1071: PA flow, 0 when PAF stopped (U.mul) -> O2, bed | ✓ |
| MCV-FA1054-1 | SECONDARY AIR FAN INLET CONTROL DAMPER MOV | PD-053 Secondary air | FICFA1081 (ABC-007) | **KASAMA** | FICFA1081: SA flow, 0 when SAF stopped (U.mul) -> O2 | ✓ |
| MOF-CL1061-A | Coal feeder-A feedrate demand control |  | FICCL1061A (ABC-004A) | **KASAMA** | FICCL1061A: coal feeder A feedrate -> firing (U.fuel) | ✓ |
| MOF-CL1061-B | Coal feeder-B feedrate demand control |  | FICCL1061B (ABC-004A, ABC-004B) | **KASAMA** | FICCL1061B: coal feeder B feedrate -> firing | ✓ |
| MOF-CL1061-C | Coal feeder-C feedrate demand control |  | FICCL1061C (ABC-004A, ABC-004C) | **KASAMA** | FICCL1061C: coal feeder C feedrate -> firing | ✓ |
| MOR-HR1391 | Hot reheat steam blow-off motor valve open command |  | PICHR1391 (ABC-054) | **KASAMA** | PICHR1391: RH blow-off MOV (U.rhbv) | ✓ |
| MOS-HR1391 | Hot reheat steam blow-off motor valve close command |  | PICHR1391 (ABC-054) | **KASAMA** | PICHR1391: RH blow-off MOV (U.rhbv) | ✓ |
| PCD-FG1056-1 | INDUCED DRAFT FAN DISCHARGE CONTROL DAMPER | PD-051 Combustion air / flue gas | PICFG108A (ABC-008) | **KASAMA** | PICFG108A: furnace pressure: IDF inlet damper (U.fp) | ✓ |
| PCV-HR1010 | LP TURBINE BYPASS CONTROL VALVE | PD-012 Cold / hot reheat steam | PICHR1003 (ABC-052) | **KASAMA** | PICHR1003: LP bypass out of the hot reheat (U.lpv) | ✓ |
| PCV-MS1001 | MAIN STEAM BLOW OFF VALVE | PD-011 Main steam | PICMS1002 (ABC-013) | **KASAMA** | PICMS1002: main steam blow-off (U.vlv) |  |
| PCV-MS1020 | HP TURBINE BYPASS CONTROL VALVE | PD-011 Main steam | PICMS1006 (ABC-050) | **KASAMA** | PICMS1006: HP bypass: main steam -> cold reheat (U.vlv) | ✓ |
| SC-LO1756 | Hydraulic coupling of IDF speed control |  | PICFG108 (ABC-008) | **KASAMA** | PICFG108: furnace pressure: IDF hydraulic coupling (U.fp) |  |
| TCV-FW1110-1 | SUPERHEATER PANEL #1 OUTLET DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-017 Feedwater | TICBR1130 (ABC-011) | **KASAMA** | TICBR1130: SH no.1 spray vs load (U.ld, U.sh) |  |
| TCV-FW1110-2 | SUPERHEATER PANEL #1 OUTLET DESUPERHEATING SPRAY WATER CONTROL VALVE-STARTUP | PD-017 Feedwater | TICBR1130 (ABC-011) | **KASAMA** | TICBR1130: SH no.1 spray vs load (U.ld, U.sh) |  |
| TCV-FW1120-1 | SUPERHEATER PANEL #2 OUTLET DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-017 Feedwater | TICBR1150 (ABC-012) | **KASAMA** | TICBR1150: SH no.2 spray vs load (U.ld, U.sh) |  |
| TCV-FW1120-2 | SUPERHEATER PANEL #2 OUTLET DESUPERHEATING SPRAY WATER CONTROL VALVE-STARTUP | PD-017 Feedwater | TICBR1150 (ABC-012) | **KASAMA** | TICBR1150: SH no.2 spray vs load (U.ld, U.sh) |  |
| TCV-FW1150 | REHEATER INLET DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-017 Feedwater | TICHR1002 (ABC-019) | **KASAMA** | TICHR1002: RH spray vs load (U.ld) |  |
| FCV-CD1120 | CONDENSATE SYSTEM MINIMUM FLOW RECIRCULATION CONTROL VALVE | PD-016 Condensate | FICCD1120 (ABC-032) | **BAHAGYA** | FICCD1120: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| FCV-CD1121 | CONDENSATE POLISHIER FLOW CONTROL VALVE | PD-016 Condensate | FICCD1121 (ABC-032) | **BAHAGYA** | FICCD1121: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| FCV-FA1055-A1 | FLUIDIZING AIR BLOWER (A) INLET VALVE | PD-054 Fluidizing air | FICFA1055A (ABC-014) | **BAHAGYA** | FICFA1055A: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| INV-M1311 | Limestone feeder speed control |  | AICFG10571 (ABC-005) | **BAHAGYA** | AICFG10571: loop model of plant.js (PV follows this valve only) + source rule of source.js |  |
| LCV-CD1104 | DEAERATOR LEVEL CONTROL VALVE | PD-016 Condensate | LICCD1104 (ABC-031, ABC-056) | **BAHAGYA** | LICCD1104: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-CD1110 | CONDENSATE DUMPING VALVE TO RAW WATER PIT LEVEL CONTROL VALVE | PD-016 Condensate | LICCD1110B (ABC-031) | **BAHAGYA** | LICCD1110B: loop model of plant.js (PV follows this valve only) | ✓ |
| LCV-HD1101-1 | LOW PRESSURE HEATER NO.1 PRIMARY DRAIN VALVE | PD-018 Heater vent and drain | LICHD11011 (ABC-037) | **BAHAGYA** | LICHD11011: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-HD1101-2 | LOW PRESSURE HEATER NO.1 ALTERNATE DRAIN VALVE | PD-018 Heater vent and drain | LICHD11012 (ABC-037) | **BAHAGYA** | LICHD11012: loop model of plant.js (PV follows this valve only) | ✓ |
| LCV-HD1102-1 | LOW PRESSURE HEATER NO.2 PRIMARY DRAIN VALVE | PD-018 Heater vent and drain | LICHD11021 (ABC-038) | **BAHAGYA** | LICHD11021: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-HD1102-2 | LOW PRESSURE HEATER NO.2 ALTERNATE DRAIN VALVE | PD-018 Heater vent and drain | LICHD11022 (ABC-038) | **BAHAGYA** | LICHD11022: loop model of plant.js (PV follows this valve only) |  |
| LCV-HD1103-1 | LOW PRESSURE HEATER NO.3 PRIMARY DRAIN VALVE | PD-018 Heater vent and drain | LICHD11031 (ABC-039) | **BAHAGYA** | LICHD11031: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-HD1103-2 | LOW PRESSURE HEATER NO.3 ALTERNATE DRAIN VALVE | PD-018 Heater vent and drain | LICHD11032 (ABC-039) | **BAHAGYA** | LICHD11032: loop model of plant.js (PV follows this valve only) | ✓ |
| LCV-HD1105-1 | HIGH PRESSURE HEATER NO.1 PRIMARY DRAIN VALVE | PD-018 Heater vent and drain | LICHD11051 (ABC-035) | **BAHAGYA** | LICHD11051: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-HD1105-2 | HIGH PRESSURE HEATER NO.1 ALTERNATE DRAIN VALVE | PD-018 Heater vent and drain | LICHD11052 (ABC-035) | **BAHAGYA** | LICHD11052: loop model of plant.js (PV follows this valve only) | ✓ |
| LCV-HD1106-1 | HIGH PRESSURE HEATER NO.2 PRIMARY DRAIN VALVE | PD-018 Heater vent and drain | LICHD11061 (ABC-036) | **BAHAGYA** | LICHD11061: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| LCV-HD1106-2 | HIGH PRESSURE HEATER NO.2 ALTERNATE DRAIN VALVE | PD-018 Heater vent and drain | LICHD11062 (ABC-036) | **BAHAGYA** | LICHD11062: loop model of plant.js (PV follows this valve only) | ✓ |
| LCV-MU1110 | CONDENER MAKEUP WATER LEVEL CONTROL VALVE | PD-016 Condensate | LICCD1110A (ABC-031) | **BAHAGYA** | LICCD1110A: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MCV-FA1043-A | START UP BURNER A HOT SECONDARY AIR INLET CONTROL DAMPER MOV | PD-022 Diesel oil | FICFA1043A (ABC-003E, ABC-003A) | **BAHAGYA** | FICFA1043A: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MCV-FA1043-B | START UP BURNER B HOT SECONDARY AIR INLET CONTROL DAMPER MOV | PD-022 Diesel oil | FICFA1043B (ABC-003B, ABC-003E) | **BAHAGYA** | FICFA1043B: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MCV-FA1043-C | START UP BURNER C HOT SECONDARY AIR INLET CONTROL DAMPER MOV | PD-022 Diesel oil | FICFA1043C (ABC-003C, ABC-003E) | **BAHAGYA** | FICFA1043C: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MCV-FA1043-D | START UP BURNER D HOT SECONDARY AIR INLET CONTROL DAMPER MOV | PD-022 Diesel oil | FICFA1043D (ABC-003D, ABC-003E) | **BAHAGYA** | FICFA1043D: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MOR-BR1391 | S/H NO.1 outlet header to reheater motor valve open command |  | HICBR1391 (ABC-055) | **BAHAGYA** | HICBR1391: loop model of plant.js (PV follows this valve only) |  |
| MOS-BR1391 | S/H NO.1 outlet header to reheater motor valve close command |  | HICBR1391 (ABC-055) | **BAHAGYA** | HICBR1391: loop model of plant.js (PV follows this valve only) |  |
| PCV-AS1010 | MAIN STEAM TO AUXILIARY STEAM SUPPLY PRESSURE CONTROL VALVE | PD-014 Aux steam, packing steam, condenser air removal | PICAS1004 (ABC-030) | **BAHAGYA** | PICAS1004: loop model of plant.js (PV follows this valve only) | ✓ |
| PCV-AS1020-1 | COLD REHEAT TO AUXILIARY STEAM SUPPLY PRESSURE CONTROL VALVE (LOW LOAD) | PD-014 Aux steam, packing steam, condenser air removal | PICAS1005 (ABC-030) | **BAHAGYA** | PICAS1005: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| PCV-AS1020-2 | COLD REHEAT TO AUXILIARY STEAM SUPPLY PRESSURE CONTROL VALVE (HIGH LOAD) | PD-014 Aux steam, packing steam, condenser air removal | PICAS1005 (ABC-030) | **BAHAGYA** | PICAS1005: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| PCV-AS1030 | DEAERATOR PEGGING STEAM CONTROL VALVE | PD-014 Aux steam, packing steam, condenser air removal | PICCD1104 (ABC-056) | **BAHAGYA** | PICCD1104: loop model of plant.js (PV follows this valve only) + source rule of source.js |  |
| PCV-DO0002 | DIESEL OIL SYSTEM PRESSURE CONTROL VALVE | PD-022 Diesel oil | PICDO0005 (ABC-028) | **BAHAGYA** | PICDO0005: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| PCV-DO1009 | DIESEL OIL RETURN PRESSURE CONTROL VALVE | PD-022 Diesel oil | PICDO1008 (ABC-029) | **BAHAGYA** | PICDO1008: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| PCV-SB1053 | SOOTBLOWING STEAM PRESSURE CONTROL VALVE | PD-015 Steam sootblowing | PICSB1052 (ABC-017) | **BAHAGYA** | PICSB1052: loop model of plant.js (PV follows this valve only) + source rule of source.js |  |
| TCV-CD1115 | LP TURBINE BYPASS DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-016 Condensate | TICHR1012 (ABC-052) | **BAHAGYA** | TICHR1012: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| TCV-CD1124 | MAIN STEAM TO AUXILIARY STEAM DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-016 Condensate | TICAS1001 (ABC-033) | **BAHAGYA** | TICAS1001: loop model of plant.js (PV follows this valve only) + source rule of source.js |  |
| TCV-CD1126 | GLAND STEAM DESUPERHEATER SPRAY WATER CONTROL VALVE | PD-016 Condensate | TICAS1017 (ABC-034) | **BAHAGYA** | TICAS1017: loop model of plant.js (PV follows this valve only) + source rule of source.js |  |
| TCV-CW1201 | STEAM TURBINE LUBE OIL TEMPERATURE CONTROL VALVE | PD-021 Aux cooling water | TICLO1002 (ABC-053) | **BAHAGYA** | TICLO1002: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| TCV-FG1116-A | FLUE GAS BIASING DAMPER (REHEATER PASS)-1 | PD-051 Combustion air / flue gas | HICHR1002A (ABC-020) | **BAHAGYA** | HICHR1002A: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1116-B | FLUE GAS BIASING DAMPER (REHEATER PASS)-2 | PD-051 Combustion air / flue gas | HICHR1002A (ABC-020) | **BAHAGYA** | HICHR1002A: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1116-C | FLUE GAS BIASING DAMPER (REHEATER PASS)-3 | PD-051 Combustion air / flue gas | HICHR1002A (ABC-020) | **BAHAGYA** | HICHR1002A: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1116-D | FLUE GAS BIASING DAMPER (REHEATER PASS)-4 | PD-051 Combustion air / flue gas | HICHR1002A (ABC-020) | **BAHAGYA** | HICHR1002A: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1117-A | FLUE GAS BIASING DAMPER (SUPERHEATER PASS)-1 | PD-051 Combustion air / flue gas | HICHR1002B (ABC-020) | **BAHAGYA** | HICHR1002B: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1117-B | FLUE GAS BIASING DAMPER (SUPERHEATER PASS)-2 | PD-051 Combustion air / flue gas | HICHR1002B (ABC-020) | **BAHAGYA** | HICHR1002B: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1117-C | FLUE GAS BIASING DAMPER (SUPERHEATER PASS)-3 | PD-051 Combustion air / flue gas | HICHR1002B (ABC-020) | **BAHAGYA** | HICHR1002B: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FG1117-D | FLUE GAS BIASING DAMPER (SUPERHEATER PASS)-4 | PD-051 Combustion air / flue gas | HICHR1002B (ABC-020) | **BAHAGYA** | HICHR1002B: RH / SH biasing damper; on beta.39 the RH temperature moves the wrong way (PR #47 open) |  |
| TCV-FW1060 | HP TURBINE BYPASS DESUPERHEATING SPRAY WATER CONTROL VALVE | PD-017 Feedwater | TICMS1022 (ABC-051) | **BAHAGYA** | TICMS1022: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| FCV-DO1012 | DIESEL OIL SUPPLY TO BURNER FLOW CONTROL VALVE | PD-022 Diesel oil | HICDO1012 (ABC-029) | **WALA** | HICDO1012: controller on the drawing, no process model behind it | ✓ |
| FCV-FA1055-B1 | FLUIDIZING AIR BLOWER (B) INLET VALVE | PD-054 Fluidizing air | FICFA1055B (ABC-014) | **WALA** | FICFA1055B: controller on the drawing, no process model behind it | ✓ |
| MCV-FA1005 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.1 | PD-053 Secondary air | HICFA1005 (ABC-015) | **WALA** | HICFA1005: controller on the drawing, no process model behind it |  |
| MCV-FA1006 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.2 | PD-053 Secondary air | HICFA1006 (ABC-015) | **WALA** | HICFA1006: controller on the drawing, no process model behind it |  |
| MCV-FA1007 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.3 | PD-053 Secondary air | HICFA1007 (ABC-015) | **WALA** | HICFA1007: controller on the drawing, no process model behind it |  |
| MCV-FA1008 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.4 | PD-053 Secondary air | HICFA1008 (ABC-015) | **WALA** | HICFA1008: controller on the drawing, no process model behind it |  |
| MCV-FA1009 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.5 | PD-053 Secondary air | HICFA1009 (ABC-015) | **WALA** | HICFA1009: controller on the drawing, no process model behind it |  |
| MCV-FA1010 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.6 | PD-053 Secondary air | HICFA1010 (ABC-015) | **WALA** | HICFA1010: controller on the drawing, no process model behind it |  |
| MCV-FA1011 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.7 | PD-053 Secondary air | HICFA1011 (ABC-015) | **WALA** | HICFA1011: controller on the drawing, no process model behind it |  |
| MCV-FA1012 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.8 | PD-053 Secondary air | HICFA1012 (ABC-015) | **WALA** | HICFA1012: controller on the drawing, no process model behind it |  |
| MCV-FA1013 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.9 | PD-053 Secondary air | HICFA1013 (ABC-015) | **WALA** | HICFA1013: controller on the drawing, no process model behind it |  |
| MCV-FA1014 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.10 | PD-053 Secondary air | HICFA1014 (ABC-015) | **WALA** | HICFA1014: controller on the drawing, no process model behind it |  |
| MCV-FA1015 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.11 | PD-053 Secondary air | HICFA1015 (ABC-015) | **WALA** | HICFA1015: controller on the drawing, no process model behind it |  |
| MCV-FA1016 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.12 | PD-053 Secondary air | HICFA1016 (ABC-015) | **WALA** | HICFA1016: controller on the drawing, no process model behind it |  |
| MCV-FA1017 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.13 | PD-053 Secondary air | HICFA1017 (ABC-016) | **WALA** | HICFA1017: controller on the drawing, no process model behind it |  |
| MCV-FA1018 | FURNACE FRONT WALL CONTROL DAMPER MOV NO.14 | PD-053 Secondary air | HICFA1018 (ABC-016) | **WALA** | HICFA1018: controller on the drawing, no process model behind it |  |
| MCV-FA1019 | FURNACE REAR WALL CONTROL DAMPER MOV NO.1 | PD-053 Secondary air | HICFA1019 (ABC-016) | **WALA** | HICFA1019: controller on the drawing, no process model behind it |  |
| MCV-FA1020 | FURNACE REAR WALL CONTROL DAMPER MOV NO.2 | PD-053 Secondary air | HICFA1020 (ABC-016) | **WALA** | HICFA1020: controller on the drawing, no process model behind it |  |
| MCV-FA1021 | FURNACE REAR WALL CONTROL DAMPER MOV NO.3 | PD-053 Secondary air | HICFA1021 (ABC-016) | **WALA** | HICFA1021: controller on the drawing, no process model behind it |  |
| MCV-FA1022 | FURNACE REAR WALL CONTROL DAMPER MOV NO.4 | PD-053 Secondary air | HICFA1022 (ABC-016) | **WALA** | HICFA1022: controller on the drawing, no process model behind it |  |
| MCV-FA1023 | FURNACE REAR WALL CONTROL DAMPER MOV NO.5 | PD-053 Secondary air | HICFA1023 (ABC-016) | **WALA** | HICFA1023: controller on the drawing, no process model behind it |  |
| MCV-FA1024 | FURNACE REAR WALL CONTROL DAMPER MOV NO.6 | PD-053 Secondary air | HICFA1024 (ABC-016) | **WALA** | HICFA1024: controller on the drawing, no process model behind it |  |
| MCV-FA1025 | FURNACE REAR WALL CONTROL DAMPER MOV NO.7 | PD-053 Secondary air | HICFA1025 (ABC-016) | **WALA** | HICFA1025: controller on the drawing, no process model behind it |  |
| MCV-FA1026 | FURNACE REAR WALL CONTROL DAMPER MOV NO.8 | PD-053 Secondary air | HICFA1026 (ABC-016) | **WALA** | HICFA1026: controller on the drawing, no process model behind it |  |
| SC-L1060A | Bottom ash cooler-A converter speed control |  | SICL1060A (ABC-009A) | **WALA** | SICL1060A: controller on the drawing, no process model behind it |  |
| SC-L1060B | Bottom ash cooler-B converter speed control |  | SICL1060B (ABC-009A) | **WALA** | SICL1060B: controller on the drawing, no process model behind it |  |
| SC-L1060C | Bottom ash cooler-C converter speed control |  | SICL1060C (ABC-009A) | **WALA** | SICL1060C: controller on the drawing, no process model behind it |  |
| SC-L1060D | Bottom ash cooler-D converter speed control |  | SICL1060D (ABC-009A, ABC-009B) | **WALA** | SICL1060D: controller on the drawing, no process model behind it |  |

### B. Shutoff (on/off) valve list

| Tag | Gamit | System (P&ID) | DITL / ABC | Plant model | Ebidensya | SOP |
|---|---|---|---|---|---|---|
| MV-HR1391 | HOT REHEAT STEAM BLOW-OFF MOV | PD-012 Cold / hot reheat steam | ABC-054 | **KASAMA** | PICHR1391: RH blow-off MOV (U.rhbv) | ✓ |
| XV-DO1043-A1 | BURNER(A) FUEL OIL PNEUMATIC VALVE-1 | PD-022 Diesel oil | DITL-07, DITL-16 | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003A M.341x) -> firing | ✓ |
| XV-DO1043-A2 | BURNER(A) FUEL OIL PNEUMATIC VALVE-2 | PD-022 Diesel oil | DITL-07, DITL-16, ABC-003A | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003A M.341x) -> firing | ✓ |
| XV-DO1043-B1 | BURNER(B) FUEL OIL PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003B M.341x) -> firing | ✓ |
| XV-DO1043-B2 | BURNER(B) FUEL OIL PNEUMATIC VALVE-2 | PD-022 Diesel oil | ABC-003B | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003B M.341x) -> firing | ✓ |
| XV-DO1043-C1 | BURNER(C) FUEL OIL PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003C M.341x) -> firing | ✓ |
| XV-DO1043-C2 | BURNER(C) FUEL OIL PNEUMATIC VALVE-2 | PD-022 Diesel oil | ABC-003C | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003C M.341x) -> firing | ✓ |
| XV-DO1043-D1 | BURNER(D) FUEL OIL PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003D M.341x) -> firing | ✓ |
| XV-DO1043-D2 | BURNER(D) FUEL OIL PNEUMATIC VALVE-2 | PD-022 Diesel oil | ABC-003D | **KASAMA** | oil flow PV gated by the DITL "supply oil valve close" (ABC-003D M.341x) -> firing | ✓ |
| MV-AS1391 | MAIN STEAM TO AUXILIARY STEAM HEADER SHUT-OFF MOV | PD-014 Aux steam, packing steam, condenser air removal | DITL-0C, DITL-51 | **BAHAGYA** | TCS panel switch "aux steam from the main steam" (tcs.js tc.asv), not the DCS MOV | ✓ |
| MV-AV1391 | CONDENSER VACUUM BREAKER MOV | PD-027 Misc. vents and drains | DITL-0C, DITL-56 | **BAHAGYA** | TCS panel switch "vacuum breaker" (tcs.js tc.vb), not the DCS MOV | ✓ |
| XV-CD1104-2 | CONDESATE EMERGENCY DRAIN VALVE TO CONDENSER | PD-016 Condensate | DITL-0C, DITL-72, ABC-031 | **BAHAGYA** | LICCD1104: loop model of plant.js (PV follows this valve only) + source rule of source.js | ✓ |
| MV-BR1391 | SUPERHEATER NO.1 OUTLET TO REHEATER SHUT-OFF MOV | PD-019 Boiler vent and drain | ABC-055 | **BAHAGYA** | HICBR1391: loop model of plant.js (PV follows this valve only) |  |
| MV-AS1393 | GLAND STEAM DRAIN SEPARATOR DRAIN MOV | PD-014 Aux steam, packing steam, condenser air removal | DITL-0C, DITL-53 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-AS1394 | TURBINE WARMING VALVE INLET DRAIN MOV | PD-011 Main steam | DITL-0C, DITL-75 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-AS1395 | START-UP EJECTOR STEAM INLET SHUT-OFF MOV | PD-014 Aux steam, packing steam, condenser air removal | DITL-0C, DITL-54 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-AS1396 | STEAM JET AIR EJECTOR STEAM INLET SHUT-OFF MOV | PD-014 Aux steam, packing steam, condenser air removal | DITL-0C, DITL-55 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-CD1007 | CONDENSATE TO POLISHER SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-64 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-CD1008 | POLISHER TO CONDENSATE SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-65 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-FW1001 | BFP(A) MAIN DISCHARGE SHUT-OFF MOV | PD-017 Feedwater | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-FW1002 | BFP(B) MAIN DISCHARGE SHUT-OFF MOV | PD-017 Feedwater | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-FW1391 | BFP(A) MAIN DISCHARGE SHUT-OFF VALVE BYPASS MOV | PD-017 Feedwater | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-FW1392 | BFP(B) MAIN DISCHARGE SHUT-OFF VALVE BYPASS MOV | PD-017 Feedwater | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-MS1391 | MAIN STEAM SHUT-OFF MOV | PD-011 Main steam | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-MS1392 | MAIN STEAM SHUT-OFF VALVE BYPASS MOV | PD-011 Main steam | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-MU1001 | MAKE-UP WATER TO CONDENSER SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-60 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-SW1002 | DEBRIS FILTER S-1504 DRAIN MOV | PD-020 Seawater | — | **WALA** | no logic, no model | ✓ |
| MV-SW1004 | BALL VESSEL T-1116 OUTLET MOV | PD-020 Seawater | — | **WALA** | no logic, no model | ✓ |
| MV-SW1006 | BALL VESSEL T-1115 OUTLET MOV | PD-020 Seawater | — | **WALA** | no logic, no model | ✓ |
| MV-TS1001 | EXTRACTION STEAM NO.1 SHUT-OFF MOV | PD-013 Extraction steam | DITL-0D, DITL-94, DITL-99 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1002 | EXTRACTION STEAM NO.2 SHUT-OFF MOV | PD-013 Extraction steam | DITL-0D, DITL-95, DITL-101 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1003 | EXTRACTION STEAM NO.3 SHUT-OFF MOV | PD-013 Extraction steam | DITL-0D, DITL-94, DITL-95 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1004 | EXTRACTION STEAM NO.4 SHUT-OFF MOV | PD-013 Extraction steam | DITL-0D, DITL-97, DITL-106 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1005 | EXTRACTION STEAM NO.5 SHUT-OFF MOV | PD-013 Extraction steam | DITL-0D, DITL-98, DITL-108 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1390 | EXTRACTION STEAM NO.4 DRAIN MOV(HEATER SIDE) | PD-013 Extraction steam | DITL-0D, DITL-107 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1391 | EXTRACTION STEAM NO.1 DRAIN MOV(TURBINE SIDE) | PD-013 Extraction steam | DITL-0D, DITL-99 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1392 | EXTRACTION STEAM NO.2 DRAIN MOV(TURBINE SIDE) | PD-013 Extraction steam | DITL-0D, DITL-101 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1393 | EXTRACTION STEAM NO.3 DRAIN MOV(TURBINE SIDE) | PD-013 Extraction steam | DITL-0D, DITL-103 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1394 | EXTRACTION STEAM NO.4 DRAIN MOV(TURBINE SIDE) | PD-013 Extraction steam | DITL-0D, DITL-106 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1395 | EXTRACTION STEAM NO.5 DRAIN MOV(TURBINE SIDE) | PD-013 Extraction steam | DITL-0D, DITL-108 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1396 | EXTRACTION STEAM NO.2 DRAIN MOV(HEATER SIDE) | PD-013 Extraction steam | DITL-0D, DITL-102 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1397 | EXTRACTION STEAM NO.1 DRAIN MOV(HEATER SIDE) | PD-013 Extraction steam | DITL-0D, DITL-100 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1398 | EXTRACTION STEAM NO.3 DRAIN MOV(DEAERATORR SIDE) | PD-013 Extraction steam | DITL-0D, DITL-105 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| MV-TS1399 | EXTRACTION STEAM NO.3 DRAIN MOV | PD-013 Extraction steam | DITL-0D, DITL-104 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-CL1061-A7 | A-COAL FEEDER OUTLET VALVE | PD-061 Coal firing | DITL-19, DITL-20 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-CL1061-B7 | B-COAL FEEDER OUTLET VALVE | PD-061 Coal firing | — | **WALA** | no logic, no model | ✓ |
| XV-CL1061-C7 | C-COAL FEEDER OUTLET VALVE | PD-061 Coal firing | — | **WALA** | no logic, no model | ✓ |
| XV-CR1011 | COLD REHEATER LINE A DRAIN POT DP-CR01 DRAIN VALVE | PD-011 Main steam | DITL-0C, DITL-73 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-CR1012 | COLD REHEATER LINE B DRAIN POT DP-CR02 DRAIN VALVE | PD-011 Main steam | DITL-0C, DITL-74 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-FA1055-A2 | FLUIDIZING AIR BLOWER (A) SURGE VALVE | PD-054 Fluidizing air | DITL-28B, DITL-28C | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-FA1055-A3 | FLUIDIZING AIR BLOWER (A) ISOLATING VALVE | PD-054 Fluidizing air | DITL-28B, DITL-28C | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-FA1055-B2 | FLUIDIZING AIR BLOWER (B) SURGE VALVE | PD-054 Fluidizing air | — | **WALA** | no logic, no model | ✓ |
| XV-FA1055-B3 | FLUIDIZING AIR BLOWER (B) ISOLATING VALVE | PD-054 Fluidizing air | — | **WALA** | no logic, no model | ✓ |
| XV-HR1010-1 | LP TURBINE BYPASS VALVE WARMING VALVE | PD-012 Cold / hot reheat steam | DITL-0D, DITL-83 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-HR1021 | ILP TURBINE LINE DRAIN POT DP-HR01 DRAIN VALVE | PD-012 Cold / hot reheat steam | DITL-0C, DITL-80 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-HR1022 | ILP TURBINE LINE DRAIN POT DP-HR02 DRAIN VALVE | PD-012 Cold / hot reheat steam | DITL-0D, DITL-81 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-MS1011 | MAIN STEAM LINE DRAIN POT DP-MS01 DRAIN VALVE | PD-011 Main steam | DITL-0D, DITL-88 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-MS1023 | HP TURBINE BYPASS OUTLET DRAIN POT DP-MS02 DRAIN VALVE | PD-011 Main steam | DITL-0D, DITL-89 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| XV-MU1109 | MAKE-UP WATER TO EXPANSION TANK ON/OFF VALVE | PD-021 Aux cooling water | DITL-0C, DITL-78 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-AS1397 | Turbine gland steam line drain motor valve MV-AS1397 | (I/O list lang) | DITL-0D, DITL-116 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-BH1060-A | Bottom ash cooler (A) inlet valve | (I/O list lang) | DITL-21A | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-BH1754 | Boiler bottom ash two-way separator inlet shut-off valve | (I/O list lang) | DITL-BA60, DITL-BA71 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-CL1061-A1 | Coal silo outlet valve-1 of coal feeder-A | (I/O list lang) | DITL-19 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-CL1061-A2 | Coal silo outlet valve-2 of coal feeder-A | (I/O list lang) | DITL-19 | **WALA** | logic only (DITL / ABC): the plant model does not use its position | ✓ |
| ZSO/ZSC-CL1061-B1 | Coal silo outlet valve-1 of coal feeder-B | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| ZSO/ZSC-CL1061-B2 | Coal silo outlet valve-2 of coal feeder-B | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| ZSO/ZSC-CL1061-C1 | Coal silo outlet valve-1 of coal feeder-C | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| ZSO/ZSC-CL1061-C2 | Coal silo outlet valve-2 of coal feeder-C | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| ZSO/ZSC-SD1802A | Boiler sand isolating valve(1) | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| ZSO/ZSC-SD1802B | Boiler sand isolating valve(2) | (I/O list lang) | — | **WALA** | no logic, no model | ✓ |
| MV-AS1392 | AUXILIARY STEAM HEADER DRAIN MOV | PD-014 Aux steam, packing steam, condenser air removal | DITL-0C, DITL-52 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-BD1001 | BOILER MASS BLOWDOWN MOV | PD-019 Boiler vent and drain | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-BD1002 | BOILER CONTINUOUS BLOWDOWN MOV | PD-019 Boiler vent and drain | DITL-38 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-CD1001 | LOW PRESSURE HEATER NO.1 CONDENSATE INLET SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-61A, DITL-69 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-CD1002 | LOW PRESSURE HEATER NO.1 CONDESATE OUTLET SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-61A, DITL-70 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-CD1003 | LOW PRESSURE HEATER NO.1 CONDENSATE BYPASS SHUT-OFF MOV | PD-016 Condensate | DITL-0C, DITL-69, DITL-70 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-IW0391 | INDUSTRIAL WATER TANK CONNECTING PIPE MOV | PD-025 Industry water | DITL-0D, DITL-87 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-SB1001 | SOOT BLOWING STEAM SHUT-OFF MOV | PD-015 Steam sootblowing | DITL-80S | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-SW1001 | DEBRIS FILTER S-1502 DRAIN MOV | PD-020 Seawater | — | **WALA** | no logic, no model |  |
| MV-SW1003 | BALL VESSEL T-1116 INLET MOV | PD-020 Seawater | — | **WALA** | no logic, no model |  |
| MV-SW1005 | BALL VESSEL T-1115 INLET MOV | PD-020 Seawater | — | **WALA** | no logic, no model |  |
| MV-TS1389 | EXTRACTION STEAM NO.5 DRAIN MOV(HEATER SIDE) | PD-013 Extraction steam | DITL-0D, DITL-109 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| MV-TS1400 | EXTRACTION STEAM #3 DRAIN MOV | PD-013 Extraction steam | DITL-0D, DITL-110 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1004 | FLASH CHAMBER SPRAY CONTROL VALVE(NORMAL OPERATION) | PD-016 Condensate | DITL-0C, DITL-63, DITL-72 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1005 | FLASH CHAMBER SPRAY CONTROL VALVE | PD-016 Condensate | DITL-0C, DITL-63 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1006 | CONDENSER CURTAIN SPRAY CONTROL VALVE | PD-016 Condensate | DITL-0C, DITL-62 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1114 | LP TURBINE BYPASS DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-016 Condensate | DITL-0C, DITL-62, DITL-66 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1123 | MAIN STEAM TO AUXILIARY STEAM DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-016 Condensate | DITL-0C, DITL-67 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-CD1125 | GLAND STEAM DESUPERHEATER SPRAY WATER BLOCK | PD-016 Condensate | DITL-0C, DITL-68 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-FS1005 | FLASH PIPE DRAIN VALVE | PD-027 Misc. vents and drains | DITL-0C, DITL-57 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-FW1061 | HP TURBINE BYPASS DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-017 Feedwater | DITL-0C, DITL-79 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-FW1111-1 | SUPERHEATER PANEL #1 OUTLET DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-017 Feedwater | DITL-32 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-FW1111-2 | SUPERHEATER PANEL #1 OUTLET DESUPERHEATING SPRAY WATER BLOCK VALVE-STARTUP | PD-017 Feedwater | — | **WALA** | no logic, no model |  |
| XV-FW1121-1 | SUPERHEATER PANEL #2 OUTLET DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-017 Feedwater | DITL-33 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-FW1121-2 | SUPERHEATER PANEL #2 OUTLET DESUPERHEATING SPRAY WATER BLOCK VALVE-STARTUP | PD-017 Feedwater | — | **WALA** | no logic, no model |  |
| XV-FW1151 | REHEATER INLET DESUPERHEATING SPRAY WATER BLOCK VALVE | PD-017 Feedwater | DITL-35 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-PA1043-A2 | BURNER(A) PNEUMATIC VALVE-1 | PD-022 Diesel oil | DITL-17 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-PA1043-A3 | BURNER(A) PNEUMATIC VALVE-2 | PD-022 Diesel oil | DITL-17 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-PA1043-B2 | BURNER(B) PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-PA1043-B3 | BURNER(B) PNEUMATIC VALVE-2 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-PA1043-C2 | BURNER(C) PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-PA1043-C3 | BURNER(C) PNEUMATIC VALVE-2 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-PA1043-D2 | BURNER(D) PNEUMATIC VALVE-1 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-PA1043-D3 | BURNER(D) PNEUMATIC VALVE-2 | PD-022 Diesel oil | — | **WALA** | no logic, no model |  |
| XV-SB1054 | SOOT BLOWING STEAM DRAIN VALVE | PD-015 Steam sootblowing | DITL-80A, DITL-80P, DITL-80R | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| XV-SB1059 | SOOT BLOWING STEAM DRAIN VALVE | PD-015 Steam sootblowing | DITL-80A, DITL-80P, DITL-80R | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-AV1803 | Boiler sand vent valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-BH1060-B | Bottom ash cooler (B) inlet valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-BH1060-C | Bottom ash cooler (C) inlet valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-BH1060-D | Bottom ash cooler (D) inlet valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-BH1750 | Boiler bottom ash pressing valve | (I/O list lang) | DITL-BA01, DITL-BA02, DITL-BA53 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-BH1752 | Bottom ash transmitter outlet ash piping shut-off valve | (I/O list lang) | DITL-BA01, DITL-BA02, DITL-BA53 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-BH1753 | Boiler bottom ash transmitter vent venting valve | (I/O list lang) | DITL-BA02, DITL-BA53, DITL-BA60 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-BH1759 | Boiler bottom ash transmitter inlet gate valve | (I/O list lang) | DITL-BA01, DITL-BA53 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-CR1013 | Cold reheat drain pot DP-CR03 drain valve open (not used) | (I/O list lang) | DITL-0D, DITL-121 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811A | Boiler limestone isolating valve(A) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811B | Boiler limestone isolating valve(B) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811C | Boiler limestone isolating valve(C) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811D | Boiler limestone isolating valve(D) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811E | Boiler limestone isolating valve(E) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811F | Boiler limestone isolating valve(F) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811G | Boiler limestone isolating valve(G) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1811H | Boiler limestone isolating valve(H) | (I/O list lang) | DITL-LS20, DITL-LS210, DITL-LS212 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1812 | Boiler limestone lock vessel inlet valve | (I/O list lang) | DITL-LS40, DITL-LS50, DITL-LS60 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1814A | Boiler limestone vent dome valve proximity switch | (I/O list lang) | DITL-LS160 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1814B | Boiler limestone balance dome valve proximity switch | (I/O list lang) | DITL-LS90, DITL-LS190 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-LM1815 | Boiler limestone dispensing vessel inlet valve | (I/O list lang) | DITL-LS20, DITL-LS70, DITL-LS90 | **WALA** | logic only (DITL / ABC): the plant model does not use its position |  |
| ZSO/ZSC-PA1800 | Boiler sand conveying air valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-SD1801 | Boiler sand vessel outlet valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-SD1804 | Boiler sand vessel inlet dome valve | (I/O list lang) | — | **WALA** | no logic, no model |  |
| ZSO/ZSC-FW1031 | BFWP-A suction manual valve | (I/O list lang) | DITL-23A | **—** | manual valve with a limit switch (assumed in its SOP position) | ✓ |
| ZSO/ZSC-FW1032 | BFWP-B suction manual valve | (I/O list lang) | — | **—** | manual valve with a limit switch (assumed in its SOP position) | ✓ |

### C. Instrument list: bawat system

| System (P&ID) | Lahat na may DCS signal | KASAMA | BAHAGYA | FEEDBACK | WALA |
|---|---:|---:|---:|---:|---:|
| (walang P&ID no.) | 2 | 0 | 0 | 0 | 2 |
| PD-011 Main steam | 36 | 6 | 2 | 19 | 9 |
| PD-012 Cold / hot reheat steam | 27 | 5 | 2 | 8 | 12 |
| PD-013 Extraction steam | 77 | 0 | 0 | 51 | 26 |
| PD-014 Aux steam, packing steam, condenser air removal | 31 | 0 | 3 | 15 | 13 |
| PD-015 Steam sootblowing | 12 | 0 | 1 | 7 | 4 |
| PD-016 Condensate | 100 | 0 | 7 | 30 | 63 |
| PD-017 Feedwater | 99 | 2 | 0 | 23 | 74 |
| PD-018 Heater vent and drain | 34 | 0 | 10 | 0 | 24 |
| PD-019 Boiler vent and drain | 43 | 9 | 1 | 6 | 27 |
| PD-020 Seawater | 30 | 0 | 0 | 0 | 30 |
| PD-021 Aux cooling water | 22 | 0 | 0 | 2 | 20 |
| PD-022 Diesel oil | 99 | 4 | 10 | 15 | 70 |
| PD-023 Compressed air | 18 | 0 | 0 | 0 | 18 |
| PD-024 Make-up water | 8 | 0 | 0 | 0 | 8 |
| PD-025 Industry water | 12 | 0 | 0 | 3 | 9 |
| PD-026 Potable water | 1 | 0 | 0 | 0 | 1 |
| PD-027 Misc. vents and drains | 8 | 0 | 0 | 5 | 3 |
| PD-042 Chemical dosing | 9 | 0 | 0 | 0 | 9 |
| PD-044 Sampling & analyzing | 21 | 0 | 0 | 0 | 21 |
| PD-051 Combustion air / flue gas | 124 | 23 | 3 | 6 | 92 |
| PD-052 Primary air | 30 | 2 | 0 | 4 | 24 |
| PD-053 Secondary air | 111 | 1 | 0 | 3 | 107 |
| PD-054 Fluidizing air | 43 | 0 | 0 | 6 | 37 |
| PD-061 Coal firing | 39 | 0 | 0 | 6 | 33 |
| PD-072 Bottom ash cooler | 29 | 0 | 0 | 0 | 29 |

### D. Instrument na KASAMA o BAHAGYA sa plant model

| Tag | Gamit | Plant model | Ebidensya |
|---|---|---|---|
| AT-FG1122 | ECONOMIZER OUTLET FLUE GAS O2 (A) | **KASAMA** | unit model writes ABC-002/AI0273 |
| AT-FG1123 | ECONOMIZER OUTLET FLUE GAS O2 (B) | **KASAMA** | unit model writes ABC-002/AI0433 |
| FT-DO1043-A | BURNER(A) DIESEL OIL FLOW TRANSMITTER | **KASAMA** | FICDO1043A loop, coupled to the unit model (oil burner A flow -> firing (U.oilN)) |
| FT-DO1043-B | BURNER(B) DIESEL OIL FLOW TRANSMITTER | **KASAMA** | FICDO1043B loop, coupled to the unit model (oil burner B flow -> firing) |
| FT-DO1043-C | BURNER(C) DIESEL OIL FLOW TRANSMITTER | **KASAMA** | FICDO1043C loop, coupled to the unit model (oil burner C flow -> firing) |
| FT-DO1043-D | BURNER(D) DIESEL OIL FLOW TRANSMITTER | **KASAMA** | FICDO1043D loop, coupled to the unit model (oil burner D flow -> firing) |
| FT-FA1071 | PRIMARY AIR FAN INLET AIR FLOW TRANSMITTER | **KASAMA** | FICFA1071 (ABC-007): PV made at the input of the sheet, PA flow, 0 when PAF stopped (U.mul) -> O2, bed |
| FT-FA1079 | PRIMARY AIR SYSTEM FLOW TRANSMITTER | **KASAMA** | unit model writes ABC-006/AI0166 |
| FT-FA1081 | SECONDARY AIR FAN INLET AIR FLOW TRANSMITTER | **KASAMA** | FICFA1081 (ABC-007): PV made at the input of the sheet, SA flow, 0 when SAF stopped (U.mul) -> O2 |
| FT-FW1007-1 | BOILER FEEDWATER FLOW TRANSMITTER-1 | **KASAMA** | FICFW1007 loop, coupled to the unit model (feedwater flow, 0 with no BFWP (U.mul) -> drum level) |
| FT-FW1007-2 | BOILER FEEDWATER FLOW TRANSMITTER-2 | **KASAMA** | FICFW1007 loop, coupled to the unit model (feedwater flow, 0 with no BFWP (U.mul) -> drum level) |
| FT-MS1031 | BOILER FINISHING SUPERHEATER OUTLET HEADER FLOW TRANSMITTER | **KASAMA** | unit model writes ABC-001C/AI0129 |
| LT-BR1001-1 | DRUM LEVEL -1 TRANSMITTER | **KASAMA** | LICBR1001 loop, coupled to the unit model (drum level integrates feedwater in minus steam out (plant.js pr.integ)) |
| LT-BR1001-3 | DRUM LEVEL -3 TRANSMITTER | **KASAMA** | LICBR1001 loop, coupled to the unit model (drum level integrates feedwater in minus steam out (plant.js pr.integ)) |
| PT-BR1001-1 | DRUM PRESSURE TRANSMITTER-1 | **KASAMA** | unit model writes ABC-010/AI0128 |
| PT-CR1006 | REHEATER HEADER PRESSURE TRANSMITTER | **KASAMA** | unit model writes ABC-019/AI0529 |
| PT-FG1085 | FURNACE PRESSURE TRANSMITTER (A) | **KASAMA** | PICFG108 loop, coupled to the unit model (furnace pressure: IDF hydraulic coupling (U.fp)) |
| PT-FG1086 | FURNACE PRESSURE TRANSMITTER (B) | **KASAMA** | PICFG108 loop, coupled to the unit model (furnace pressure: IDF hydraulic coupling (U.fp)) |
| PT-FG1087-1 | FURNACE PRESSURE TRANSMITTER (C) -1 | **KASAMA** | PICFG108 loop, coupled to the unit model (furnace pressure: IDF hydraulic coupling (U.fp)) |
| PT-HR1003-1 | REHEAT STEAM PRESSURE TRANSMITTER-1 | **KASAMA** | unit model writes ABC-052/AI0421 |
| PT-HR1003-2 | REHEAT STEAM PRESSURE TRANSMITTER-2 | **KASAMA** | unit model writes ABC-052/AI0513 |
| PT-MS1002 | BOILER FINISHING SUPERHEATER OUTLET HEADER PRESSURE TRANSMITTER | **KASAMA** | unit model writes ABC-001C/AI0131 |
| PT-MS1006-1 | MAIN STEAM PRESSURE TRANSMITTER-1 | **KASAMA** | unit model writes ABC-050/AI0416 |
| PT-MS1006-2 | MAIN STEAM PRESSURE TRANSMITTER-2 | **KASAMA** | unit model writes ABC-050/AI0512 |
| TT-BR1130-1 | SUPERHEATER PANEL NO.2 INLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1130 loop, coupled to the unit model (SH no.1 spray vs load (U.ld, U.sh)) |
| TT-BR1130-2 | SUPERHEATER PANEL NO.2 INLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1130 loop, coupled to the unit model (SH no.1 spray vs load (U.ld, U.sh)) |
| TT-BR1140-1 | SUPERHEATER PANEL NO.2 OUTLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1140 loop, coupled to the unit model (SH no.2 outlet = spray 1 outlet + pickup (U.sh)) |
| TT-BR1140-2 | SUPERHEATER PANEL NO.2 OUTLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1140 loop, coupled to the unit model (SH no.2 outlet = spray 1 outlet + pickup (U.sh)) |
| TT-BR1150-1 | FINAL SUPERHEATER INLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1150 loop, coupled to the unit model (SH no.2 spray vs load (U.ld, U.sh)) |
| TT-BR1150-2 | FINAL SUPERHEATER INLET STEAM TEMPERATURE TRANSMITTER | **KASAMA** | TICBR1150 loop, coupled to the unit model (SH no.2 spray vs load (U.ld, U.sh)) |
| TT-FG1090-A | FURNACE FRONT TEMPERATURE (A) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0832 |
| TT-FG1090-B | FURNACE FRONT TEMPERATURE (B) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0833 |
| TT-FG1090-C | FURNACE FRONT TEMPERATURE (C) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0834 |
| TT-FG1090-D | FURNACE FRONT TEMPERATURE (D) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0835 |
| TT-FG1090-E | FURNACE FRONT TEMPERATURE (E) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0836 |
| TT-FG1090-F | FURNACE FRONT TEMPERATURE (F) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0837 |
| TT-FG1090-G | FURNACE REAR TEMPERATURE (G) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0864 |
| TT-FG1090-H | FURNACE REAR TEMPERATURE (H) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0865 |
| TT-FG1090-I | FURNACE REAR TEMPERATURE (I) TRANSMITTER | **KASAMA** | unit model writes ABC-027/AI0866 |
| TT-FG1091-A | FURNACE FRONT TEMPERATURE (A) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0816 |
| TT-FG1091-B | FURNACE FRONT TEMPERATURE (B) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0817 |
| TT-FG1091-C | FURNACE FRONT TEMPERATURE (C) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0818 |
| TT-FG1091-D | FURNACE FRONT TEMPERATURE (D) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0819 |
| TT-FG1091-E | FURNACE FRONT TEMPERATURE (E) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0820 |
| TT-FG1091-F | FURNACE FRONT TEMPERATURE (F) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0821 |
| TT-FG1091-G | FURNACE REAR TEMPERATURE (G) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0848 |
| TT-FG1091-H | FURNACE REAR TEMPERATURE (H) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0849 |
| TT-FG1091-I | FURNACE REAR TEMPERATURE (I) TRANSMITTER | **KASAMA** | unit model writes ABC-026/AI0850 |
| TT-HR1002-1 | REHEATER OUTLET TEMPERATURE TRANSMITTER-1 | **KASAMA** | TICHR1002 loop, coupled to the unit model (RH spray vs load (U.ld)) |
| TT-HR1002-2 | REHEATER OUTLET TEMPERATURE TRANSMITTER-2 | **KASAMA** | TICHR1002 loop, coupled to the unit model (RH spray vs load (U.ld)) |
| TT-MS1004-1 | BOILER FINISHING SUPERHEATER OUTLET HEADER TEMPERATURE TRANSMITTER-1 | **KASAMA** | TICMS1004 loop, coupled to the unit model (finishing SH outlet = spray 2 outlet + pickup (U.sh), ATS steam (tcs.js)) |
| TT-MS1004-2 | BOILER FINISHING SUPERHEATER OUTLET HEADER TEMPERATURE TRANSMITTER-2 | **KASAMA** | TICMS1004 loop, coupled to the unit model (finishing SH outlet = spray 2 outlet + pickup (U.sh), ATS steam (tcs.js)) |
| AT-FG1057-1 | STACK FLUE GAS SOX ANALYZER | **BAHAGYA** | AICFG10571 (ABC-005): loop model only + source rule |
| DPT-FG1081 | OVERALL FURNACE DIFFERENTIAL PRESSURE TRANSMITTER (A) | **BAHAGYA** | DPICFG108 (ABC-009A): loop model only + source rule |
| DPT-FG1082 | OVERALL FURNACE DIFFERENTIAL PRESSURE TRANSMITTER (B) | **BAHAGYA** | DPICFG108 (ABC-009A): loop model only + source rule |
| FT-CD1120 | CONDENSATE WATER FLOW TRANSMITTER | **BAHAGYA** | FICCD1120 (ABC-032): loop model only + source rule |
| FT-CD1121 | CONDESATE POLISHER SYSTEM INLET FLOW TRANSMITTER | **BAHAGYA** | FICCD1121 (ABC-032): loop model only + source rule |
| FT-FA1043-A | START-UP BURNER(A) HOT SECONDARY AIR FLOW TRANSMITTER | **BAHAGYA** | FICFA1043A (ABC-003A): loop model only + source rule |
| FT-FA1043-B | START-UP BURNER(B) HOT SECONDARY AIR FLOW TRANSMITTER | **BAHAGYA** | FICFA1043B (ABC-003B): loop model only + source rule |
| FT-FA1043-C | START-UP BURNER(C) HOT SECONDARY AIR FLOW TRANSMITTER | **BAHAGYA** | FICFA1043C (ABC-003C): loop model only + source rule |
| FT-FA1043-D | START-UP BURNER(D) HOT SECONDARY AIR FLOW TRANSMITTER | **BAHAGYA** | FICFA1043D (ABC-003D): loop model only + source rule |
| LT-CD1104-1 | DEAERATOR STORAGE TANK WATER LEVEL TRANSMITTER-1 | **BAHAGYA** | LICCD1104 (ABC-031): loop model only + source rule |
| LT-CD1104-2 | DEAERATOR STORAGE TANK WATER LEVEL TRANSMITTER-2 | **BAHAGYA** | LICCD1104 (ABC-031): loop model only + source rule |
| LT-CD1104-3 | DEAERATOR STORAGE TANK WATER LEVEL TRANSMITTER-3 | **BAHAGYA** | LICCD1104 (ABC-031): loop model only + source rule |
| LT-CD1110 | CONDENSER HOT WELL WATER LEVEL TRANSMITTER | **BAHAGYA** | LICCD1110A (ABC-031): loop model only + source rule |
| LT-HD1101-1 | LOW PRESSURE HEATER NO.1 LEVEL TRANSMITTER-1 | **BAHAGYA** | LICHD11011 (ABC-037): loop model only + source rule |
| LT-HD1101-2 | LOW PRESSURE HEATER NO.1 LEVEL TRANSMITTER-2 | **BAHAGYA** | LICHD11011 (ABC-037): loop model only + source rule |
| LT-HD1102-1 | LOW PRESSURE HEATER NO.2 LEVEL TRANSMITTER-1 | **BAHAGYA** | LICHD11021 (ABC-038): loop model only + source rule |
| LT-HD1102-2 | LOW PRESSURE HEATER NO.2 LEVEL TRANSMITTER-2 | **BAHAGYA** | LICHD11021 (ABC-038): loop model only + source rule |
| LT-HD1103-1 | LOW PRESSURE HEATER NO.3 LEVEL TRANSMITTER-1 | **BAHAGYA** | LICHD11031 (ABC-039): loop model only + source rule |
| LT-HD1103-2 | LOW PRESSURE HEATER NO.3 LEVEL TRANSMITTER-2 | **BAHAGYA** | LICHD11031 (ABC-039): loop model only + source rule |
| LT-HD1105-1 | HIGH PRESSURE HEATER NO.1 LEVEL TRANSMITTER-1 | **BAHAGYA** | LICHD11051 (ABC-035): loop model only + source rule |
| LT-HD1105-2 | HIGH PRESSURE HEATER NO.1 LEVEL TRANSMITTER-2 | **BAHAGYA** | LICHD11051 (ABC-035): loop model only + source rule |
| LT-HD1106-1 | HIGH PRESSURE HEATER NO.2 LEVEL TRANSMITTER-1 | **BAHAGYA** | LICHD11061 (ABC-036): loop model only + source rule |
| LT-HD1106-2 | HIGH PRESSURE HEATER NO.2 LEVEL TRANSMITTER-2 | **BAHAGYA** | LICHD11061 (ABC-036): loop model only + source rule |
| PT-AS1004 | AUXILIARY STEAM HEADER PRESSURE TRANSMITTER | **BAHAGYA** | PICAS1005 (ABC-030): loop model only + source rule |
| PT-AS1005 | AUXILIARY STEAM HEADER PRESSURE TRANSMITTER | **BAHAGYA** | PICAS1005 (ABC-030): loop model only + source rule |
| PT-CD1104 | DEAERATOR PRESSURE TRANSMITTER | **BAHAGYA** | PICCD1104 (ABC-056): loop model only + source rule |
| PT-DO0005 | DIESEL OIL PUMP COMMON DISCHARGE PRESSURE TRANSMITTER | **BAHAGYA** | PICDO0005 (ABC-028): loop model only + source rule |
| PT-DO1008 | DIESEL OIL RETURN PRESSURE TRANSMITTER | **BAHAGYA** | PICDO1008 (ABC-029): loop model only + source rule |
| PT-DO1043-A2 | BURNER(A) DIESEL OIL PRESSURE TRANSMITTER | **BAHAGYA** | PICDO1043A (ABC-003A): loop model only + source rule |
| PT-DO1043-B2 | BURNER(B) DIESEL OIL PRESSURE TRANSMITTER | **BAHAGYA** | PICDO1043B (ABC-003B): loop model only + source rule |
| PT-DO1043-C2 | BURNER(C) DIESEL OIL PRESSURE TRANSMITTER | **BAHAGYA** | PICDO1043C (ABC-003C): loop model only + source rule |
| PT-DO1043-D2 | BURNER(D) DIESEL OIL PRESSURE TRANSMITTER | **BAHAGYA** | PICDO1043D (ABC-003D): loop model only + source rule |
| PT-SB1052 | SOOTBLOWING HEADER STEAM PRESSURE TRANSMITTER | **BAHAGYA** | PICSB1052 (ABC-017): loop model only + source rule |
| TT-AS1001 | MAIN STEAM DESUPERHEATER DOWNSTREAM TEMPERATURE TRANSMITTER | **BAHAGYA** | TICAS1001 (ABC-033): loop model only + source rule |
| TT-HR1012-1 | LOW PRESSURE TURBINE BYPASS OUTLET TEMPERATURE TRANSMITTER-1 | **BAHAGYA** | TICHR1012 (ABC-052): loop model only + source rule |
| TT-HR1012-2 | LOW PRESSURE TURBINE BYPASS OUTLET TEMPERATURE TRANSMITTER-2 | **BAHAGYA** | TICHR1012 (ABC-052): loop model only + source rule |
| TT-MS1022-1 | HP TURBINE BYPASS OUTLET TEMPERATURE TRANSMITTER-1 | **BAHAGYA** | TICMS1022 (ABC-051): loop model only + source rule |
| TT-MS1022-2 | HP TURBINE BYPASS OUTLET TEMPERATURE TRANSMITTER-2 | **BAHAGYA** | TICMS1022 (ABC-051): loop model only + source rule |
| ZT-BR1391 | SUPERHEATER NO.1 OUTLET TO REHEATER SHUT-OFF MOV POSITION TRANSMITTER | **BAHAGYA** | HICBR1391 (ABC-055): loop model only |

Ang buong instrument list (lahat ng 2,411 item, kasama ang WALA at ang local / package) ay nasa [`instrument-coverage.csv`](instrument-coverage.csv). Mga column: `cat` (CV control valve, SOV shutoff valve, SOL solenoid, INST instrument, ELEM sensor element, LOCAL, PKG, MANUAL), `tag`, `desc`, `sys` (P&ID system), `sig`, `to`, `rng` (range ng instrument list), `io` (DCS address), `ioRng` (range ng I/O list), `ctl` (controller ng ABC), `abc` / `ditl` (mga sheet), `train` / `sop` (Y = binabanggit), `st` (IN = KASAMA, PART = BAHAGYA, FB = FEEDBACK, NO = WALA, NA = hindi kailangan), `ev` (ebidensya), `from` (IL = instrument list, IO = I/O list lang).

## 6. Susunod

1. Ang user: wala nang kailangang ibigay; sapat ang xlsx at ang flow diagram ng repo.
2. Fix queue #1 ~ #6 (P1) pagkatapos ng PR #47; P2 kasama ng step 4; P3 kasama ng HMI (step 6).
3. Library step 8: ang `instrument-coverage.csv` ang magiging data ng "Instrument list" page (tag, gamit, system, range, address, sheet).
