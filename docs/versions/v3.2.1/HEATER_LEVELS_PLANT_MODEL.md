# Heater levels plant model (3.2.1, IRENE : PLANT MODEL)

Ang shell (drain) level ng No.2 / No.1 HP heater at No.3 / No.2 / No.1 LP heater, ang mga drain valve, at ang level H.H. → extraction MOV.
Code: `src/analog/engine/unit.js` `AN_HD` / `anHdStep`. Test: `tests/regress/heater_levels.js`.

## Daloy (PD-018, IO list)
- No.2 HPH → (LCV-HD1106-1) → No.1 HPH → (LCV-HD1105-1) → deaerator. Alternate LCV-HD1106-2 / 1105-2 → condenser.
- No.3 LPH → (LCV-HD1103-1) → No.2 LPH → (LCV-HD1102-1) → No.1 LPH → (LCV-HD1101-1) → condenser. Alternate LCV-HD110x-2 → flash chamber.

## Sources
- **FHI heater O&M** (PC, `o&m-package-phase-1` L15-3 ~ L15-7, section 1.1.2 "Nominal thermal characteristics"):
  - No.2 HPH: drain 45.147 t/h.
  - No.1 HPH: extraction 25.33 t/h, plus the No.2 drain.
  - No.3 LPH: extraction 15.246 t/h, drain 15.246.
  - No.2 LPH: extraction 12.27 t/h, inlet drains 15.246, outlet 27.516.
  - No.1 LPH: extraction 17.861 t/h, inlet drains 27.516, outlet 45.377.
  - Design feedwater: HP 458.684 t/h, LP 362.594 t/h.
- **FHI section 1.1.1 "Physical characteristics"** (horizontal shell; inside diameter / overall length, mm):
  - No.1 HPH: 1156 / 9595 (drawing K2MC2A-001).
  - No.2 HPH: about 1250 / 9138.5.
  - No.1 LPH: 1130 / 13612.
  - No.2 LPH: 1080 / 10679.
  - No.3 LPH: 1030 / 10674.
- **Alarm list** (LT-HD110x, from the normal level):
  - No.1 HPH and No.3 LPH: H.H. 140, H 40, L -40.
  - The others: 150 / 50 / -50.
  - Level switch LS-HD110x H.H.: 140 / 150 mm (DITL-41 rows 15 ~ 27).
- **ABC-035 ~ 039** (drawing ABC-039 was read):
  - The MV of the primary controller → F(X) LN38 (and the like) → primary valve.
  - While the primary is AUTO (M.0236 = NOT LICHD11031.MAN), the alternate station follows the same MV through F(X) LN39 (EX-MV, split range).
  - When the primary is MANUAL, the alternate station also goes MANUAL (A/M = LICHD11031.MAN).
  - The AO = 100 % minus the opening.
- **ABC-036 M.0203** "HP HEATER NO.2 LEVEL HI-HI" → DITL-94 closes MV-TS1001 (AUTO only).
- **02.png (60 MW):**
  - No.3 LPH primary 32.4 % at FIQHD1103 7.7 T/H.
  - No.2 LPH primary 99.9 % at FIQHD1102 3.4 T/H, alternate 53.7 %.
  - No.1 LPH primary 13.6 %.
  - These are the valve capacities (scaled by √(load)). The HP valves have no snapshot in service.
- **4.PNG:** MVTS1001 ~ 1005 "A R" (AUTO, REMOTE).

## Paano gumagana (bawat heater, bawat step)
- **Pasok:** ang condensate ng extraction nito, plus ang primary drain ng heater bago nito.
  - HPH: galing sa `AN_HP`, kasama ang MOV.
  - LPH: design × main steam / 458.684 × MOV (DITL-97 MV-TS1004, DITL-98 MV-TS1005).
- **Labas:** primary + alternate. Ang flow ay capacity × opening × √(load).
  - Ang opening ng primary = output ng F(X) ng drawing.
  - Ang opening ng alternate = MV ng station nito.
  - Kapag ubos ang tubig (< -300 mm), hindi lalabas nang higit sa pumapasok.
- **Level:** d(level)/dt = (pasok − labas) / (density × surface).
  - Surface = diameter × length × 0.7.
  - Density = steam table sa design drain temperature.
- **Start at 150 MW:** walang MV ang snapshot sa full load, kaya nagsisimula ang primary controller sa MV na nagpapasa ng drain ng load.

## NO-SOURCE
- 0.7 ng surface (ang tube bundle at ang heads ang kumukuha ng iba).
- Capacity ng HP valves: ang design flow sa 50 %.
- Capacity ng alternate valves: kapareho ng primary, maliban sa No.2 LPH (02.png).
- Hindi alam kung ang FT-HD1102 ay nasa primary line; ipinalagay na primary (02.png 3.4 T/H sa 99.9 %).

## Mga naayos na kasama
1. **Extraction MOV sa 150 MW naka-MANUAL (bug, naayos).** Ang 4.PNG ay "A R". Ngayon AUTO ang DITL-94 ~ 98 sa start state (`ditl150.js`).
2. **Iisang address, dalawang row (bug, naayos; CLAUDE.md 1).** Ang DITL-94 ~ 98 row 21 "M.0283 AUTO MODE SELECTED" at ang row 1 "M.0283 AUTO PB" ay iisang signal.
   - Dati: hiwalay na input ang row 21, kaya kapag pinindot ng operator ang MANUAL, nanatiling 1 ang row 21 at walang nagawa ang CLOSE.
   - Ngayon: sa netlist (`02-netlist.js`), ang M. address na inulit sa ibang input row ng parehong sheet ay sumusunod sa unang row.
   - Saklaw: mga 25 row sa ibang sheet ang sumusunod na rin sa unang row na may parehong M. address. Lahat ay iisang pangalan o iisang gamit, halimbawa:
     - DITL-100 ~ 111 at DITL-116 / 121: ang "DRN VLV MOV AUTO MODE SELECTED" = "AUTO PB".
     - DITL-80 / 80P: BLOWING PERMISSIVE, PROGRAM END.
     - DITL-BA20 / 42 / 64 / 65: AUTOMATIC START, RESET (DCS), VIBRATING SCREEN ON COMMAND.
     - Ang DITL-80P row 20 (XV-SB1054) at row 11 (XV-SB1059) ay may parehong M.4199: iisang signal ayon sa drawing.
   - Walang nagbago sa 26 regression test: ang mga FAIL na dati na ay pareho pa rin.
3. **`hp_heaters.js`:** pinipili muna ng operator ang MANUAL bago ang CLOSE (AUTO na sa 150 MW).

## Resulta (cloud test)
- **150 MW pagkatapos ng 900 s:**
  - Lahat ng level ay nasa loob ng 12 mm ng normal.
  - Pareho ang pasok at labas ng bawat drain:
    - No.2 HPH 49.2 → 49.2
    - No.1 HPH 76.3
    - No.3 LPH 15.7
    - No.2 LPH 28.3 / 27.3
    - No.1 LPH 23.5 t/h
  - Walang H.H.
- **Sarado ang drains ng No.2 HPH (MANUAL 0 %):**
  - Umaabot sa H.H. sa ~75 s, kaya nag-ON ang M.0203.
  - Sumasara ang MV-TS1001 (100 → 0 %).
  - Ang No.2 outlet ay 247 → 210 °C.
  - Naka-ON ang LS-HD1106.
- **No.3 LPH primary MANUAL 0 %:**
  - Tumataas ang level, at nag-MANUAL din ang alternate.
  - Binuksan ng operator ang alternate sa 60 %, kaya bumalik ang level (max 24, end -44 mm).

## Hindi pa ginawa
- Temperatura ng drain ng LPH (TT-HD1102 / 1103), at FT-HD1102 / 1103 sa ABC kung mayroon.
- Epekto ng level H.H. ng LPH sa DITL-97 / 98 at sa TCS (DITL-115, water induction).
- Hindi pa live-tested sa PC ng user.
