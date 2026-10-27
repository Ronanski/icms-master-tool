# 3.2.0 — Mga link na binago, idinagdag o hindi ikinabit, may ebidensya (CLAUDE.md rule 1 at 9)

Walang link na tinanggal para lang gumana. Ang lahat ng nasa ibaba ay lumabas habang pinapatakbo ang buong Cold → 150 MW start-up ng Training dock sa tunay na DITL interlock (iisang mundo, WORLD ON).

## 3.2.0-beta.23

1. **DITL-43 row 12 "AIR PREHEATER SPEED NOT LOW" I.0653 (FROM 43-56)** — hindi ikinabit sa sariling output.
   - Dati: ang FROM column na "43-56" ay ikinabit sa output 56 ng parehong sheet. Ang output 56 ay kopya lang ng row 12 (wire / NOT) papunta sa CRT. Kaya binabasa ng row ang sarili niyang output: laging 0, at hindi kailanman makaka-start ang IDF (DITL-25A ← DITL-25B row 27).
   - Ebidensya: sa parehong sheet, ang rows 4 / 5 / 10 / 13 ay may FROM na 43-54 / 55 / 53 / 57: ito ang station channel ng contact, hindi ibang pinagmulan. Ang output 56 ay walang ibang logic kundi ang row 12.
   - Ngayon: ang row ay field contact (ang I.0653 ng station wiring). Pangkalahatang tuntunin sa `src/world/world.js`: ang input row na ang FROM ay output ng parehong sheet na kopya lang ng row na iyon ay hindi ikinakabit. Ang output na may tunay na logic (hal. motor command na naka-seal sa RUNNING feedback, DITL-24 row 2 ← out 58) ay nananatiling nakakabit.

2. **ABC-004A M.3410 / M.3411 / M.3416 / M.3417 (A / B / C / D-BNR SUPPLY OIL VALVE CLOSED)** — bagong link sa DITL-16.
   - Dati: ang M.3410 ay AND ng dalawang input na "X-BNR SUPPLY OIL VALVE(1) CLOSE" at "VALVE(2) CLOSE" na walang pinagmulan. Nanatili ang Cold value (sarado), kaya walang nasusunog na oil sa plant model kahit IN SERVICE ang burner sa DITL at bukas ang dalawang valve.
   - Ebidensya: ito ang parehong limit switch ng station wiring na nasa DITL-16 output 21 / 23 "BURNER A OIL SUPPLY LINE VALVE(1) / (2) CLOSED" (machine instance #B ~ #D para sa burner B ~ D). Iisang address = iisang signal (rule 1).
   - Ngayon: ang dalawang input ng AND ay galing sa DITL-16 (instance ng burner) output 21 at 23.

3. **N.C. push button sa DITL (BOILER EMERGENCY TRIP P.B.(1) / (2) (N.C.) DITL-03F rows 25 / 26, "NOT OFF P.B." DITL-09 rows 18 / 22, DITL-21A row 25)** — default na sarado.
   - Dati: 0 ang mga ito kapag hindi pinipindot. Kaya laging naka-trip ang MFT (03F) at laging aktibo ang OFF ng burner (09).
   - Ebidensya: ang service text mismo ay "(N.C.)" (normally closed) o "NOT ... OFF P.B.". Sa drawing, may NOT o bubble ang input na ito: 1 kapag hindi pinipindot.
   - Ngayon: 1 kapag hindi pinipindot. Kapag pinindot (FORCE o dock), 0.

4. **Field I/O sheet na walang gate (DITL-16 BURNER OIL VALVE, DITL-18 FLAME)** — hindi na pass-through.
   - Dati: sa sheet na walang gate, ang bawat input row ay direktang output ng parehong numero. Sa DITL-16, ang OPEN command ng row 21 ay nagpasindi ng output 21 na "CLOSED".
   - Ebidensya: sa DITL-16 at DITL-18, magkaiba ang input (command papunta sa field) at ang output (limit switch / flame detector galing sa field) ng parehong row number. Walang wire sa pagitan nila sa drawing.
   - Ngayon: ang output ng mga sheet na ito ay galing sa field device model (`fdStep`, `src/digital/parts/05-overlay-interaction.js`): ang valve ay gumagalaw ilang segundo pagkatapos ng command, at ang flame ay ON kapag bukas ang dalawang oil valve at may igniter. Para lang ito sa mga sheet na may field contact o MOV.

5. **Furnace thermocouple (TIFG1090 / 1091 / 1095 / 1096 / 1009) sa Cold** — sumusunod na sa bed temperature.
   - Dati: nanatili sa 150 MW snapshot (933 °C) kahit Cold. Dahil dito, ang ABC-027 SI0122 > 700 °C = M.2504 "ADEQUATE FOR COAL FIRING (PURGE BY-PASS)" ay 1 sa malamig na boiler, at kusang natapos ng DITL-02 ang purge at na-reset ang MFT.
   - Ngayon: ambient + (snapshot − ambient) × (pag-init ng bed / pag-init ng bed sa anchor). Sa Cold, 30 °C.

6. **DITL-19 #B / #C (coal feeder B at C) rows 16 / 17 "FURNACE LOWER LAYER UNDER TEMP. > 700 °C / > 450 °C"** — bagong link sa ABC-027 M.2504 / M.2505.
   - Dati: ang feeder A lang ang may link. Ang feeder B at C ay walang furnace temperature permissive, kaya ang natitirang permissive nila ay "may burner na IN SERVICE". Pagkapatay ng huling start-up burner, sabay na nag-trip ang feeder B at C.
   - Ebidensya: iisa ang furnace ng tatlong feeder. Ang row ay may iisang address (M.3330 sa TAG NO.) at walang pangalan ng feeder sa service text ("FURNACE LOWER LAYER ..."). Ang ABC-027 ay may "TO DITL 19-16 / 19-17" para sa M.2504 / M.2505.
   - Ngayon: tuntunin sa `src/world/world.js`: ang signal ng ABC na walang makina (walang A / B / C sa memory list description) papunta sa row ng drawing ng makina na iisa ang address at walang pangalan ng makina ng pamilya ay binabasa ng LAHAT ng instance.

## 3.2.0-beta.34 — Address ng machine B / C / D ng mga DITL sheet na iisa para sa A ~ D (CHECKLIST 0.2, hakbang 1)

Walang inalis na link. Ang binago ay ang BASA ng address ng kopya B / C / D (`src/world/world.js` `addrList`, `rowList`, `W.addrK`). Ebidensya: I/O list at memory list ng STN101 ~ 105 (`AN.ades()`), at ang drawing mismo.

1. **Lahat ng grupo ng address sa cell.** Ang drawing ay sumusulat ng apat na address bilang dalawang grupo: DITL-10 / 16 "O.0088/408 O.0728/1048" = burner A / B / C / D (I/O list STN104: SVR-DO1043-A5 / B5 / C5 / D5 "start up burner-A ~ D oil gun cylinder retract"); "M.0136/236 M.1636/1736" = A ~ D-IGNITER RETRACT (memory list STN104); DITL-29A "M.1150/1160 M.1170" = SWP A / B / C START PB (STN103). Dati unang grupo lang: ang C / D ay kumuha ng address ng A.
2. **Maikling dulo ng address (2 titik).** DITL-45 "I.0085/88/8B" = I.0085 / I.0088 / I.008B (plant air dryer A / B / C REMOTE).
3. **Listahang kulang sa isang row, kumpleto sa iba.** DITL-13 row 28 "M.0143/243 BURNER A SHUTDOWN COMMAND" = DITL-10 row 20 "M.0143/243 M.1643/1743" (parehong signal): ang kumpletong listahan ang ginagamit.
4. **TAG NO. vs service column.** Kapag mas kumpleto ang listahan sa service column (parehong unang address), iyon ang ginagamit.
5. **Isang address, nagpapalit na row.** DITL-24 PAF LOP A: row 25 "LOP A STOPPED" I.005C, row 26 "LOP B STOPPED" I.037C; sa kopya B ang dalawang row ay nagpapalit ng text, kaya nagpapalit din ng address.
6. **Bilang ng makina hindi binago:** unang grupo lang ang binibilang (dati ring paraan); 36 shared sheet, parehong bilang ng kopya gaya ng beta.33 (napatunayan).

**Resulta (talaan ng 544 row na may address sa kopya B / C / D):** tama ayon sa I/O / memory list (may station na ang description ay may letra ng kopya): beta.33 = 313 / 543, beta.34 = 544 / 544 (ang 58 na mukhang mali sa unang check ay tama ang address; ang TEXT lang ng drawing ang hindi pa napapalitan sa DITL-117 / 118 "COOLER A", at ang DITL-22 kopya B = LOP B ng BFWP-A, aayusin ang text sa hakbang 2: page ng bawat kopya).

## 3.2.0-beta.39 (roadmap 2, ikatlong batch) — Reheat: TCS / GMCB input ng DITL, at ang M.017A ng ABC-020

1. **Bagong link (walang inalis): TCS / GMCB input row ng DITL.** Ang input row na ang LOCATION ay TCS o GMCB at walang FROM sheet (DITL-35 row 11 "ICV TO CV TRANSFER COMPLETE" I.0418, DITL-51 / 94 ~ 110 "TURBINE TRIP" I.0400, DITL-51 "52G OPEN" I.0932, DITL-80 ~ 89 "GCB 52G1 ON" I.0931, DITL-73 / 74 / 121 I.0418) ay walang source: laging 0. Ito ay iisang address (CLAUDE.md 1) sa input ng ABC na isinusulat ng turbine model (ABC-050 / ABC-019). Bug, naayos (`src/world/world.js`, `W.stat.tcsIn`: 32 link). Ebidensya: DITL-35 PDF: ang reset ng SOV OPEN COMMAND ay OR ng NOT I.0418, kaya habang 0 ang I.0418 hindi bumubukas ang RH spray shut-off valve XV-FW1151 (I.088F nanatiling 1), naka-force MANUAL ang TICHR1002 (ABC-019 M.0173), at umabot sa 593 °C ang reheat sa 150 MW.
2. **M.017A (ABC-020) — salungat ang drawing at ang SOP; pinili ng user ang SOP (2026-10-27 07:46 PHT).** Drawing: FF M.017A = SET ng (TPS TR420 2 s ng NOT HICHR1002B.MAN) AT NOT M.017C, RESET ng M.017C (= CRT SELECT MAINTENANCE M.017F O NOT ID FAN RUNNING M.3304); ang M.017A ay "1:B" ng A/M switch ng HICHR1002B. Literal na basa: kapag inalis sa MANUAL ang SH biasing damper habang tumatakbo ang IDF, bumabalik ito sa MANUAL at doon nananatili; dahil kasama ang HICHR1002B.MAN sa force manual ng RH damper (M.0179), hindi kailanman ma-AUTO ang reheat control. PR-OPE-5002 (5374 "Put SH biasing damper to AUTO" pagkatapos ng purge; 8043 "Set biasing damper and RH to Remote-Auto") at 39.PNG (HICHR1002A / B A sa 150 MW) ay nagsasabing nananatili itong AUTO. Ngayon (pasya ng user): ang select ng A/M switch na galing sa .MAN ng SARILING station nito ay hindi nagfo-force MANUAL (`src/analog/engine/plant.js` `anSelSelf`; iisa lang sa lahat ng sheet: ABC-020 AMT id45). Ang M.017A ay kinukuwenta at makikita pa rin sa VIEW.
3. **Ibinalik na link: limit switch ng valve ng drawing (ZSO / ZSC) bilang source ng input row ng parehong sheet.** Ang tuntunin ng 3.2.0-beta.23 (input row na ang FROM ay output ng parehong sheet na kopya lang ng row na iyon = hindi sariling source) ay nag-alis din ng link ng limit switch ng valve: DITL-35 row 1 "SOV CLOSED" I.088F ← 35-73 (ZSC ng solenoid valve model). Dahil nagdidikit ang wire ng row at ng switch sa drawing, nabasa itong "kopya": laging 0 ang row 1, kaya hindi kailanman natupad ang SET (OPEN P.B. AT CLOSED) at hindi bumukas ang RH spray shut-off valve. Bug, naayos (`src/world/world.js` `selfDep`: ang output row na feedback ng valve model `s.nl.mv[].fb` ay hindi kopya). Resulta: selfLinks 132 → 62 (70 link ng limit switch na ibinalik; ang 62 na natitirang inalis ay ang tunay na kopya ng beta.23, hal. DITL-43 row 12). Ebidensya: DITL-35 PDF: ang ZSO / ZSC ay galing sa field (limit switch), hindi wire mula sa row.

## 3.2.0 roadmap 3 + 4 (P1 / P2, 2026-10-27) — DITL-38 MOV, protection switch, condenser vacuum

Walang inalis na link. Mga bagong link at isang binagong tuntunin:

1. **DITL-38 = 8 MOV (isang valve bawat isa).** Ang drawing ng DITL-38 ay iisang MOV logic na may talaan ng 8 tag (MV-BD1001, MV-BD1002, MV-FW1001, MV-FW1391, MV-FW1002, MV-FW1392, MV-MS1391, MV-MS1392). Dati iisang valve lang ang buong talaan. Ngayon ang bawat tag ay sariling machine instance (`src/world/world.js` `W.MCV`, `makeInst` label = tag). Binagong tuntunin sa `target()`: ang link ng isang instance na tumuturo sa base sheet ay tumuturo sa SARILI nitong instance (dati: lahat ng instance ay bumabasa ng feedback ng base, kaya ang MV-FW1391 ay "bukas" kapag bukas ang MV-BD1001). Bug, naayos. Ebidensya: DITL-38 PDF, talaan ng tag sa kanan ng logic; iisang OPEN / CLOSE P.B., FULLY OPEN / CLOSED, REMOTE, TRIP bawat valve.
2. **Protection switches ← PV (plant model ON).** Bagong source ng input row: LSL / LSH / LSHH / LSLL-BR1001-1 / 2 (DITL-01, 03C ~ 03G) ← LIBR1001x.PV ng ABC-010; PSHHH / PSHH / PSLL-FG1085 ~ 1087 ← AI0132 / AI0260 / AI0388 ng ABC-008; LSLL-CD1104-4 ← AI0672, LSLL-CD1110 ← AI0640 ng ABC-031 (`src/world/plantsw.js`). Set point mula sa alarm list (`document-references/alarm-list.zip`, sheet LS / PS). ASSUMED: dead band 10 mm / 10 mmH2O; hotwell normal level 600 mm (wala sa alarm list). Plant model OFF: ang user pa rin ang nagse-set ng row.
3. **PT-CD1110 ← condenser vacuum.** DITL-55 row 6 at DITL-73 row 26 (comparator ng condenser pressure) ← vacuum ng unit model: 1.033 kg/cm2A (walang vacuum) hanggang 0.057 kg/cm2A (4.PNG PICD1110). Walang ABC AI ang PT-CD1110 (AI0532 ay nasa HMI snapshot lang).
4. **Ejector at vacuum breaker ← DITL MOV.** Ang vacuum ng plant model ay sumusunod na sa posisyon ng MV-AS1395 (DITL-54), MV-AS1396 (DITL-55) at MV-AV1391 (DITL-56), hindi na sa hiwalay na estado ng TCS panel. Ang VACUUM UP ng TCS panel ay pumipindot ng mga P.B. ng mga drawing na ito.
5. **Plant model ← posisyon ng DITL valve (P1).** Main steam stop MOV MV-MS1391 / bypass MV-MS1392 (DITL-38) → daloy ng steam sa turbine at presyon bago ang MSV; BFP discharge MOV MV-FW1001 / 1002 at equalizing MV-FW1391 / 1392 → daloy ng feedwater; spray block valve (DITL-32 / 32 #B / 33 / 33 #B / 35 / 79 / 66) → daloy ng spray; coal feeder outlet valve (DITL-20 / #B / #C) → gatong. ASSUMED: ang bypass MOV ay 10 % (MS1392) / 30 % (FW1391) ng daloy ng main MOV; ang presyon sa likod ng sarado na MV-MS1391 ay bumababa sa 30 s (bukas) / 600 s (bypass lang) / 1800 s (sarado). Walang one world (WORLD OFF): ang valve ay tinuturing na bukas, gaya ng dati.
