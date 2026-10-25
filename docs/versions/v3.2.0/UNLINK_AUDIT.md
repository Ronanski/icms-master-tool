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

## 3.2.0-beta.33 — DITL A / B / C / D: bawat kopya may sariling address (CHECKLIST 0.2)

Walang link na tinanggal. Ang buong talaan ng bawat binagong address (296, sheet / row / makina / dati / ngayon / description ng I/O list o memory list) ay nasa `docs/versions/v3.2.0/INST_ADDR.md`, gawa ng `tools/world/inst_addr.js` (hindi hinuhulaan: ang address group na nakasulat sa drawing, hal. "I.0013/333 I.0653/973" = igniter A / B / C / D; kapag kulang, ang description ng address ng A sa I/O list / memory list na pinalitan ang letra ng makina, hal. "#1 Coal feeder-A remote" → "-B"). Letra ng description ≠ letra ng makina: 0 sa 762 na nasuring address.

1. **Burner / igniter C at D (DITL-09 ~ 16)** — dati ay address ng A ang ginagamit ng C / D kapag dalawang address lang ang unang grupo (hal. DITL-10 L1 "IGNITER C IN RETRACT POSITION" I.0013 → **I.0653**; D → **I.0973**). Ebidensya: ikalawang grupo ng parehong text sa drawing ("I.0653/973") at ang I/O list "#1 Boiler start up burner-C Igniter retract".
2. **DITL-29A #B (SWP-B) "SEAWATER PUMP A REMOTE MODE SELECTED"** — ngayon ay "PUMP B" at sariling address ng B (I/O list "Seawater pump-B remote"). Dati: letra at address ng A.
3. **Pamilyang COLLER (sulat ng drawing ng DITL-21A "SCREW COLLER")** — kasama na sa pagkilala ng letra ng makina, kaya ang bottom ash screw cooler C / D ay may sariling address (hal. L0 D: I.0250 → **I.0680**, "#1 Bottom ash screw cooler-D forward running").
4. **DITL-21A #B / #C / #D row 6 M.3122** — binabasa ng lahat ng cooler ang iisang ABC-009A M.3122. Ebidensya: memory list "FURNACE DP LOW" = walang letra ng makina, iisang furnace (CLAUDE.md rule 1). Dati: B / C / D walang pinagmulan.
5. **DITL-28A M.3437** — common sa lahat ng blower. Ebidensya: memory list "FA BLOWER STOP COMMAND", walang letra ng makina.
6. **DITL-22 (aux. lube oil pump ng BFWP)** — 4 na kopya na: BFWP A · LOP A / BFWP A · LOP B / BFWP B · LOP A / BFWP B · LOP B (dati 2). Ang LOP row ay sumusunod sa letra ng LOP, ang BFWP row (hal. L6 "LUB. OIL PRESS. LOW" I.0090 / I.0410) sa letra ng BFWP. Ang link ng standby (row 8 "OTHER LOP RUNNING") ay sa kabilang LOP ng parehong BFWP (#B → #C ay dating mali, ngayon #A ↔ #B, #C ↔ #D).
7. **Mga row na iisa ang address at walang letra ng makina (78)** — common, binabasa ng lahat ng kopya (hal. MFT). Hindi binago ang drawing: ang loose text sa loob ng logic (hal. "M.1050/1053") ay ipinapakita gaya ng drawing.
