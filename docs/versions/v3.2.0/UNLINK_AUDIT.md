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
