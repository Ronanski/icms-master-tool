# ABC Audit Findings — v1.20.21

Version evidence: the simulator window title and header badge both show **v1.20.21** (`logic-sim-v1.20.21.html`, loaded headless). The `.apk` and `.exe` were **not** run.

Method: format of `docs/abc-audit/ABC-AUDIT.md`. Source = `document-references/analog-logic-abc.zip` → `PDF/(17)ABC-005.pdf` (read visually at 300 dpi; the PDFs have no text layer). Simulator values were read-only: inputs written to the sheet's external-input nets, solver settled, net values read. No simulator code or data was changed.

## ABC-005 — Limestone Feeder Control (SOx Control), Station 101

| Test ID | Block / path | Input | Expected (source) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-005-01 | AB0114 ÷ max(AB0115, 1) × 3.13 × 10000 → SI0339 | AB0114 = 3, AB0115 = 60 | 3 / 60 × 3.13 × 10000 = 1565 (drawing: ÷ A/B, ×3.13, ×10000) | 1565 | **Pass** |
| ABC-005-02 | Same path, LOW LIMIT block (constant 1) | AB0114 = 3, AB0115 = 0.5 and 1 | Denominator held at 1 → 93900 | 93900 in both cases | **Pass** |
| ABC-005-03 | Same path, upper range | AB0114 = 3, AB0115 = 99.99 / AB0114 = 0.01, AB0115 = 60 | 939.09… / 5.2166… | 939.09… / 5.2166… | **Pass** |
| ABC-005-04 | DENSITY CORRECTION ÷ → SI0337 | AB0116 = 1.1 / 1.3 / 1.5, other inputs fixed | Drawing marks this ÷ as **B/A** (B = limestone chain × 13, A = AB0116), so output must **fall** as AB0116 rises | Output **rises** with AB0116: 1.66e-6 / 1.96e-6 / 2.27e-6; equals AB0116 / (chain × 13), i.e. A/B | Before fix: output rose with AB0116 (1.66e-6 / 1.96e-6 / 2.27e-6). After fix: SI0337 = chain / AB0116 = 601,719 / 509,147 / 441,260, falling as density rises | **Pass** after fix (was Fail) |
| ABC-005-05 | Coal feeders A/B/C running → NOT·NOT·NOT AND → OR bus → M.0148 | No feeder running (trip = 0) | M.0148 = 1 (all-stopped branch) | 1 | **Pass** |
| ABC-005-06 | Same, one feeder running, all signals healthy | A running only / A+B+C running | M.0148 = 0 | 0 / 0 | **Pass** |
| ABC-005-07 | Feeder-running AND flow SIG.AB bad, per feeder | A run + B.0718 bad; B run + B.0720 bad; C run + B.0728 bad; A run + B.0720 bad (B stopped) | M.0148 = 1, 1, 1, and 0 for the mismatched case | 1, 1, 1, 0 | **Pass** |
| ABC-005-08 | SOx SIG.AB (B.0712) and limestone speed SIG.AB (B.064F) → bus | A,B,C running, each bad in turn | M.0148 = 1 | 1 / 1 | **Pass** |
| ABC-005-09 | Inverter trip M.3403 (= M.0149 BU-CMD tap) → M.0148 and A/M-T-RB-MV transfer | A running + M.3403 = 1 | M.0148 = 1 and AO0788 = RB-MV PTN009001 = 0 %; with trip = 0 and M.0148 = 1, AO0788 = manual COS value (25 used) | 1, AO0788 = 0; AO0788 = 25 | **Pass** |
| ABC-005-10 | PID AICFG10571 / S1-MDL037 parameters | Compare sim values with `summary-of-pid-pidv-suma-man-parameters.xlsx`, sheet PID (row marked OK) | PH 500, PL 0, SH 500, SL 0, MH 35, ML 10, dMVH 5, P 62.5, I 150, D 3.2, DTI 1, TF/GAP/BND/CUT 0, DH 5 | Same values in the sim (kp 1.6 = 100 / 62.5) | **Pass** (parameters only; initial SV 60 ppm in the sim is not in the workbook, Cannot Verify) |
| ABC-005-11 | SUMA LIME-SUM / S1-MDL196 parameters | Compare with workbook sheet SUMA (row marked OK) | PH 27, PL 0, RSTS 9999999.99, K 2700, DT 1, TF 0, CUT 0, unit T | Same values in the sim | **Pass** |

### F-1 — DENSITY CORRECTION divider is inverted (Confirmed in simulator; drawing reading visual)
- Drawing: the other two ÷ blocks on the page (limestone density, S/CaCO3) are stacked **A over B**; the DENSITY CORRECTION block is stacked **B over A**.
- Simulator: block 21 has `nu` = AB0116 net, `de` = chain net, so it computes A/B.
- Likely cause (Suspected): the ÷ reader only understands an inline `a/b` text. A stacked fraction is two separate texts "A" and "B", so every ÷ falls back to A/B. Not yet checked whether other sheets have a stacked B/A ÷.
- Effect: SI0337 (feedforward into the Σ/OMV summer) is wrong in direction. Plain explanation: when limestone density goes up, the real logic should lower the feeder speed demand; the simulator raises it.
- Scope check (all 54 sheets): the sim has 15 ÷ blocks. Readable fraction: 4 stacked A/B, 5 inline, **1 stacked B/A (this one)**. 6 could not be read automatically and need checking when their pages are audited: ABC-008 #61, ABC-000 #13 (inputs unresolved, nu/de = -1), ABC-027 #72, ABC-032 #26, ABC-002 #41 and #44.
- **Fixed** (approved by the user in chat; see "Corrections applied" below).

### Address / tag cross-check (`dcs-io-list.xls`, `memory-list-101.xls`)
| Drawing item | Reference result | Verdict |
|---|---|---|
| AI0466 / AT-FG1057-1 / B.0712, 0–500 ppm | I/O list Station 101: same tag, range, address | Pass |
| AI0151 / ST-M1311 / B.064F, 0–100 % | I/O list: same | Pass |
| AO0788 / INV-M1311, 0–100 %, "Logic ABC-005" | I/O list: same | Pass |
| PTN009001 = 0 % | PTN list: 0 | Pass |
| M.3400–M.3402 coal feeder running, M.3403 limestone feeder trip | WM list: same descriptions (from STN104 wiring) | Pass |
| M.0148 (force manual), M.0149 (BU-CMD) | WM list M.0140+8 = "Stack outlet flue gas SOx ctl force manual", M.0140+9 = "SOx ctl BU-CMD" | Pass |
| B.0718 / B.0720 / B.0728 | I/O list: coal feeder A/B/C feedrate AI (0–40 T/H) | Pass |
| SI0334, SI0339 | SI list SI0330+4 / +9: "USED" | Pass |
| SI0336 | SI0330+6 "Limestone rotary feeder speed across density modification" | Pass |
| SI0144 (ABC-004A) | SI0140+4 "Total coal flow before * kcal/kg" | Pass (name only; ABC-004A not traced yet) |
| SI0337 | SI0330+7 "Stack outlet flue gas SOx ctl OMV"; drawing prints SI0337 on the density-correction ÷ output line, not on the Σ OMV output | Needs Verification (N-4) |
| AB0114 / AB0115 / AB0116 | Not found as AB addresses in I/O or memory list 101 (a WB entry B.2450 "Limestone Density (CRT)" exists, link unproven) | Cannot Verify |
| AICFG10571 / S1-MDL037, SIM1311 / S1-MDL104, LIME-SUM / S1-MDL196 | Not found by tag in the lists | Cannot Verify (parameters: see summary workbook, not yet read) |

### Needs Verification (not decidable from the drawing alone)
- **N-1** Magnitudes. The chain gives values of the order 1e5 at SI0334 / SI0337, far outside a 0–100 % feeder range. SI0144 is plain total coal flow per the SI list, so its unit is not the explanation. Candidates: direction/value of "SCALE CONVERT 12000/2700" (×4.444 vs ×0.225), the "13" vs "BASE : 1.3" constant, or the ×10000 factor. Needs ABC-004A and the scaling intent from the plant.
- **N-2** Constant "13" under the density-base box vs label "BASE : 1.3": the sim uses 13 in both places (blocks 19 and 28).
- **N-3** (resolved) SI0144 on ABC-004A = (SI0114 feeder A flow + SI0124 feeder B + SI0134 feeder C) × SCALE CONVERT 40/120 (now ×1 in real values) = total coal flow in T/H; SI0140 = SI0144 × SI0003 (calorie), as in the memory list. The app forces SI0144 to 7.32 T/H as an assumed value, so ABC-005 sees 7.32 T/H until that assumption is changed in the app's assumed values panel (or the force is removed).
- **N-4** SI0337 label position vs memory-list description (above).

### Not checked yet on ABC-005
Auto-mode dynamic/numeric behavior of the PID, AO0788 in auto mode, SUMA totalizer integration, ALM SIM1311 limits (ALM is not in the parameter workbook). The AO0788 transfer results above use the manual/trip branches only.

Test notes: the two "running" inputs per feeder (drawn twice) are separate input nets in the sim and were set together; the three flow SIG.AB inputs and SI0144 are cross-page links and were driven from ABC-004A/B/C.

## Batch scan — all 54 sheets (automated, read-only)

Run once over every sheet instead of page by page. Sources: `summary-of-pid-pidv-suma-man-parameters.xlsx` (all 136 rows are marked OK by the user) and `dcs-io-list.xls` (Station 101–105).

| Check | Result |
|---|---|
| PID / PIDV parameters (PH, PL, MH, ML, dMVH, P→Kp, I, D, DTI, TF, GAP, BND, PHONDT, PLONDT) vs workbook, 68 rows | All match, **except** the pair CUT / DH (see F-2) |
| MAN limits (MH/ML converted from % of SH–SL to engineering units), 58 rows | 57 match; HIC-MWRL differs on purpose (see N-5) |
| SUMA (PH, PL, RSTS, K, DT, TF, CUT, PHONDT, PLONDT, unit), 10 rows | All 10 match |
| Workbook rows with no block in the sim / sim blocks with no workbook row | None / none (apart from the ABC-000 legend placeholders XXX-XX-XXX) |
| AI tag, range and unit vs I/O list, 176 unique AI tags | 155 match, 0 not found in the I/O list. 19 had no range in the sim and are position-feedback AIs (I/O 0–100 %, handled by the valve feedback model) except **AI0481 (F-3, now fixed)**. 2 are cosmetic unit text (AI0151 shows "% ( 0.00 ~ 27.00 T/H )", AI0131 "Kg/cm2" vs "kg/cm2") |
| Sim built-in Health / warnings | Empty on every sheet |

### F-2 — PID CUT and DH values are swapped between the sim data and the workbook (Closed, no action)
- The simulator does not use CUT or DH (workbook How-to sheet), so there is no effect on behavior. The user decided to leave it.

### F-3 — AI0481 (ABC-008, rpm, I/O range 0–1200) had no range in the sim (Confirmed, fixed)
- The drawing text "0 ~ 1200 rpm" lies 45–70 units from the AI box, outside the reader's 45-unit search radius. The I/O list agrees (0–1200 rpm). **Fixed**, see below.

### F-5 — HIC-MWRL MV limits were overridden in code (Confirmed, fixed)
- ABC-001B HIC-MWRL, "UNIT LOAD MAX. RATE OF CHANGE SETTER": drawing range 0.0 ~ 10.0 MW/MIN (= workbook PH/PL 10/0). The faceplate limits MH 30 % / ML 1 % (= 3 and 0.1 MW/MIN) are the operator-entry limits. The other 57 MAN blocks use MH/ML; only this one had `if(e.tag==='HIC-MWRL'){P.lo=e.SL;P.hi=e.SH}`, which mixed the display range with the entry limit. No reason is documented.
- Fixed by removing the exception: after the fix a manual value of 9 clamps to 3 and 0 clamps to 0.1; the display range stays 0–10.

### F-4 — ABC-032 ÷ block (SI0230 path) divided the constant by the signal (Confirmed, fixed)
- Drawing: ÷ block with constant 2 entering from above and the condensate flow signal (after ×400/200) entering from the left; no A/B letters. Legend (`analog logic symbols legend.pdf`) does not define input order for ÷.
- Sim computed 2 / signal (inverse of the flow), which has no engineering meaning; the drawing's through-line (signal) is the dividend.
- Basis for the rule used: in the other unlabeled ÷ blocks (ABC-008 #61 sum ÷ 2, ABC-027 #72 sum ÷ quantity of normal transmitters, ABC-002 #41 demand ÷ CAL) the dividend is the pin opposite the output, and the sim was already correct there. The same rule now applies to ABC-032.

## Corrections applied to `logic-sim-v1.20.21.html` (user-approved; analog reader only, DITL untouched)
1. `anCompile`, case DIV: reads a stacked fraction (two texts, A over B or B over A; upper letter = numerator) and matches the pin letters by the side of the box they sit on. → F-1.
2. `anCompile`, case DIV: for ÷ blocks with no label at all, the dividend is the pin opposite the output pin (only when there is no inline formula text). → F-4.
3. `anInit`: an AI with no range and no feedback model searches 70 instead of 45 units for its "a ~ b unit" text. → F-3.
4. `anFace`, MAN: removed the HIC-MWRL exception. → F-5.
5. `anCompile`, case HC/LC/HLC: if no set point text is found within 16 units, search 30. → F-6.
6. `anCompile`, case CONST: a ratio constant next to a "SCALE CONVERT" label is ×1 in real values. → F-7.
7. `anDefaults`: ABC-005 limestone chain constants scaled to real values (guarded). → F-8.

Verification after the changes (same headless method):
- All 15 ÷ blocks compared before / after: exactly 2 changed (ABC-005 #21, ABC-032 #26). ABC-001B #8 (formula "T = B / A * 100 / 60") was briefly affected during development and is unchanged in the final patch.
- Controller parameters (140 blocks): identical except HIC-MWRL (F-5). AI blocks: only AI0481 changed (now 0–1200 rpm, matches the I/O list). Simulator Health/warnings: empty on every sheet.
- ABC-005-01..03 and 05..09 re-run: same results as before.
- The diff is a few lines, all inside the analog script (`anCompile`, `anInit`, `anFace`).
- Not tested: the apk and exe (user does those), and no release or rename was done. The file keeps its name; the user decides how and when to rebuild/release.

### ÷ blocks not needing correction
ABC-008 #61 (sum ÷ 2, Pass), ABC-027 #72 (sum ÷ SI0120, Pass), ABC-002 #41 (÷ CAL-004A, Pass), ABC-001B #8 (formula text, Pass), ABC-000 #13 (legend symbol only).

### F-6 — ABC-001A comparators M.2004 / M.2006 had set point 0 instead of "> 0.1 %" (Confirmed, fixed)
- The set point text lies about 25 units from the box, beyond the 16-unit search. Of 222 HC/LC/HLC blocks in all sheets only these two (plus the ABC-000 legend symbols) found no set point. After the fix they read 0.1 with unit %; the other 220 comparators are unchanged (compared one by one before / after).
- Still open (unit basis): the sim compares the literal 0.1 against a MW (engineering-unit) difference, while the drawing means 0.1 % of range. See N-1.

## Batch 2 — simplest sheets (structure traced against the drawing PDF, then timed or numeric scenarios in the simulator)

Scenario method: inputs written to external nets or forced, SIG.AB states set, simulated time run (1 s steps), nets read. All results below are from v1.20.21 with the corrections applied.

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-028 | 01 | Structure: AI0181 → SV−PV (ACT:N) → PICDO0005 → A/M T (sel B.0305, B = COS) → 100 − MV → AO0224 | as listed | same | Pass |
| ABC-028 | 02 | AO = 100 − MV in auto (MV 53.57) and manual (COS 30 / 20) | 46.43 / 70 / 80 | 46.43 / 70 / 80 | Pass |
| ABC-028 | 03 | B.0305 bad forces the manual leg, then returns to auto | manual 30, then auto | 30, then auto (bumpless 17.5) | Pass |
| ABC-054 | 01 | Structure: OR(trip, MFT) · AND(M.3216) → TPs 5 s → M.0333 · NOT(M.320A) → M.0330; AND of both SIG.AB (ABC-052) → M.320A; DEV −SV +PV; PIDV with MVA B.1031 | as listed | same | Pass |
| ABC-054 | 02 | Trip (or MFT) with M.3216 = 1 | M.0330 = 1 for 5 s, SV = 35.5, auto leg | M.0330 = 1 then 0 after 5 s, SV 35.5 then 0 | Pass |
| ABC-054 | 03 | Only one of the two SIG.AB bad | M.320A = 0 | 0 (both orders) | Pass |
| ABC-054 | 04 | Both SIG.AB bad (with and without trip) | M.320A = 1, manual leg (COS), M.0330 = 0 | 1, manual 20, 0 | Pass |
| ABC-017 | 01 | Structure: AI0533 → H/ >11 → M.3231; SV−PV ACT:R; two T selectors (M.0101 / M.0104; M.0103 BU-CMD, RB-MV 0 %); /L <1 % → M.3235 | as listed | same | Pass |
| ABC-017 | 02 | B.0995 bad, or I.024E = 1, forces manual (M.0101 = (B.0995 OR I.024E) AND NOT M.0104) | M.0101 = 1, MV = COS 30 | 1, 30 | Pass |
| ABC-017 | 03 | House operation M.025B → TPS 15 s → M.0104; SET SV = 18 | M.0104 = 1 for 15 s, SV 18 | 1 until t = 15 s, 0 at t = 17 s | Pass |
| ABC-017 | 04 | I.024E → TPS 2 s → M.0103 (BU-CMD) | MV = RB-MV 0 % during the 2 s pulse, M.3235 = 1 | MV 0, M.3235 1; then back to 30 | Pass |
| ABC-006 | 01 | TOTAL AIR FLOW = sum of PAF, SAF, FAB (ranges 648 + 432 + 35 = 1115 T/H, constants 648/1115 etc.) | each flow counted once in T/H | Sum of the three compensated flows (487.4 + 731.0 + 46.7 = 1265.0 with the compensation factor) after F-7; 545 at full range before | Pass after F-7 |
| ABC-032 | 01 | ×400/200 then ÷2 into the polisher PID SV (range 0–200) | flow 400 T/H → SV 200 | 200 after F-7 (was 400) | Pass after F-7 |
| ABC-001B | 01 | Structure: MAN HIC-MWRL, A/M T (M.0001), ×10/200, ÷ "T = B/A·100/60" (B = 10000), ×1/60, RATE LIMIT (bypass EIC-TM.MAN), ×200/200 | as listed | same; constants 0.05, 10000, 100, 1/60, 1 | Pass |
| ABC-001B | 02 | Force manual M.0001 = 1 selects COS; MV limited to 0.1–3 (after F-5) | 2 → 2; 9 → 3; 0 → 0.1 | 2; 3; 0.1 | Pass |
| ABC-056 | 01 | Structure: AI0417 → SV−PV (ACT:R) → PICCD1104; T sel B.0969 (B) and M.0124 (A, SET SV 3.5); BU-CMD M.0124 → RB-MV 100 %; AI0562 ×5/10 − PV → H/ >0 → M.025F | as listed | same | Pass |
| ABC-056 | 02 | M.0124 = 1: SV 3.5 and output to RB-MV; B.0969 bad: manual | SV 3.5; manual 40 | SV 3.5; 40 (trip branch not isolated: output 75.8) | Pass (manual) / Needs Verification (trip output) |
| ABC-056 | 03 | M.025F "ext pressure > deaerator pressure": ext AI0562 (0–5 kg/cm²) vs deaerator PV (0–10), PV forced because the process model drives it | ext 4.0 vs 3.5 → 1; 2.0 vs 3.5 → 0; 3.5 vs 3.5 → 0; 4.0 vs 9 → 0 | Before F-7: 4.0 vs 3.5 gave 0 (scaled 4 × 0.5 = 2). After F-7: 1, 0, 0, 0 | **Pass** after F-7 (was Fail) |
| ABC-001A | 01 | Structure: three MANs (HIC-ULD, MWHL, MWLL), T selectors, HLLIM SI0204/SI0206, H/ >0.1 % → M.2004 / M.2006, ± generator MW | as listed | same; after F-6 the two set points read 0.1 | Pass (not tested numerically) |

### F-7 — "SCALE CONVERT a / b" constants multiplied engineering-unit values (Confirmed, fixed)
- Basis, from the drawings themselves: in every SCALE CONVERT the numerator is the source range and the denominator the destination range, e.g. ABC-006: PAF 0–648, SAF 0–432, FAB 0–35 T/H into TOTAL AIR FLOW 0–1115 T/H with constants 648/1115, 432/1115, 35/1115 (648 + 432 + 35 = 1115); ABC-056: AI0562 0–5 → ×5/10 → compared with the deaerator 0–10; ABC-032: FIQCD1120 0–400 → ×400/200 → polisher PID 0–200. Such a constant only makes sense on percent-of-range signals, which is also how the reference workbooks carry them (`flow-compensation.xls` ap/bp/at/bt in %, `drum-level-calculation.xls` F(X) in %), and how the textbook counts them (100 % = 10000 in the Full Scale Traveling Time formula).
- The simulator carries engineering units (T/H, kg/cm², MW), where the same conversion is ×1. It multiplied by a/b, so the total air flow at full-range flows was 545 instead of 1115 T/H, the ABC-056 comparison was wrong, and the ABC-032 polisher SV was doubled.
- Fix: the 16 constants that carry a ratio and sit within 50 units of a "SCALE CONVERT" label (distances 9–47; the only other ratio constant, 1/60 on ABC-001B, is 234 away and untouched) are now ×1. Their note says so. List: ABC-004A 40/120; ABC-005 12000/2700; ABC-006 35/1115, 432/1115, 648/1115; ABC-010 500/550; ABC-032 400/200; ABC-001B 10/200, 200/200; ABC-056 5/10; ABC-001C 240/200; ABC-002 140/1200, 648/1115, 35/1115, 1115/432, 432/1115.
- Verified: controllers (140) and AI ranges unchanged; Health empty; no NaN after 5 s of run on the nine affected sheets; ABC-005, 017, 028, 054 scenarios give the same results as before; ABC-056 M.025F and ABC-032 SV now follow the drawing; ABC-006 total air flow is the plain sum of the three flows.

### F-8 — ABC-005 limestone chain shows real values (Confirmed, fixed; needs user verification of the 13 vs 1.3 constant)
- Principle (PROJECT_RULES 4a): real values on screen. The drawing chain is written for percent / counts: SI0339 = A/B × 3.13 × 10000 (counts, 100 % = 10000, textbook), × coal flow, × SCALE CONVERT 12000/2700 (coal range 120 T/H to feeder range 27 T/H, ×100 each), × density base / AB0116.
- Hand calculation with real values: S = 3 %, CaCO3 = 60 %, coal 81 T/H → limestone = 3/60 × 3.13 × 81 = 12.68 T/H = 46.95 % of the 27 T/H feeder. The count-domain chain gives the same 46.94 % (1565 × 6750 / 10000 × 4.444 / 100), so the drawing constants are consistent with this reading.
- Scaling applied (guarded: only when the constant still has the drawing value): constant 10000 → 1 (count scale); SCALE CONVERT 12000/2700 → 100/27 (T/H to feeder %); the density base constant that the drawing box shows as "13" → 1.3 (the drawing label printed twice says "LIMESTONE DENSITY BASE : 1.3"; with 13 the chain is ten times too large); the same 1.3 × 100/27 on the AB0116 path to the totalizer so that SI0336 is in T/H (SUMA is 0–27 T/H, integrates T/H).
- Verified: SI0339 0.1565; SI0334 and SI0337 = 46.95 % at base density; 40.69 % at ρ 1.5 and 55.49 % at ρ 1.1 (denser limestone → lower speed); S 0.5 % / CaCO3 90 % → 5.22 %; SI0336 13.5 T/H at 50 % speed, 27 T/H at 100 %, 31.15 T/H at ρ 1.5. Controllers, AI ranges, Health and the ABC-005 logic scenarios are unchanged.
- **Please verify** (N-2): the constant under the "LIMESTONE DENSITY BASE" boxes is printed as 13 but the label says 1.3.

### N-1 (updated) — remaining unit-basis questions (Needs Verification)
- ABC-005: resolved by F-8.
- ABC-001B: T = B / A · 100 / 60 with B = 10000 gives 1e5–1e7 in the sim for the RATE LIMIT time input; same count-scale question, plus the unit of the RATE block's T input.
- ABC-001A / others: set points written as "%" (for example "> 0.1 %") are compared as the literal number against an engineering-unit value.

## Batch 3 — ABC-033, ABC-034, ABC-013 and all F(X) tables

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-033 | 01 | Structure: AI0641 → PV−SV (ACT:N) → PICAS TICAS1001; M.0139 = OR(B.1009 bad, M.012F); M.012B = TPS 2 s of OR(M.0128, M.0124); M.012F = TPS 2 s of M.012E; M.0127 = OR(M.012F, M.0124); SI0276 from two T (80 % on trip, 0 % on M.012F) | as listed | same | Pass |
| ABC-033 | 02 | B.1009 bad → manual; demand < 2 % (M.012E) → 2 s pulse → MV 0 %, then back; demand > 4 % (M.0128) → 2 s pulse, SV 350; turbine trip M.0124 → MV 80 % held | as drawn | as drawn | Pass |
| ABC-034 | 01 | Structure: LN18 / LN19 / LN20 / LN21 F(X), Σ SI0242 + SI0243, ramp 1 %/min, × SI0246, × 0.8, SV−PV (ACT:N), "−" block, two Σ (OMV), A/M T (B.1086) | as listed | same | Pass (not tested numerically) |
| ABC-013 | 01 | Structure: H/ > 134 → M.0254; trip M.3225 → TPS 9 s → M.0256; AND(NOT M.3225, M.0254) → TPS 2 s; OR → M.0252; SV 130 / 115 (T, TOF 2 s); BU-CMD OR(M.0256, M.025D); SI0362 = T(100 %, LN18); S/R FF 81.5 / 76 MW; OR of 52L1, 52G1, trip AND (TOF 10 s / TPS 300 s) → M.025B → TPS 3 s (M.025C), TPS 7 s (M.025D) | as listed | same | Pass |
| ABC-013 | 02 | PV 140 → M.0252 pulse 2 s (SV 130); trip → M.0256 9 s, SV 115, M.025E = 1, AO = F(X); MW 85 + 52L1 open → M.025B, M.025C 3 s, M.025D 7 s (AO 100 % for 7 s); MW 70 resets the FF | as drawn | as drawn | Pass |
| All sheets | F(X) | 89 LN curves of `linear-curves-fx.xls` vs the simulator tables (16 points each, title, drawing number); S1-LN38 / LN39 vs `drum-level-calculation.xls`; 111 F(X) blocks vs their table | equal | 89 / 89 equal (four ratio curves are stored as a factor 0.8 / 1 / 1.2 instead of 80 / 100 / 120 %); LN38 / LN39 equal; every block has a table; shared tables are by design (burners B-D use the ABC-003A tables, ash coolers A-D and heaters 35-39 share tables, as the workbook says) | Pass |

## Batch 4 — ABC-055, ABC-014

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-055 | 01 | Structure: AI0181 → SV−PV (ACT:R) → PIDV HICBR1391 (MVA from B.065D); A/M T (1:A M.0310, 1:B B.065D); M.0310 = OR(M.031A, M.0319, M.031B); M.0315 = AND(MFT TON 2 s, M.254F, NOT PA fan running, M.321C, NOT drum level LL); three TPs 2 s (TR230 / TR231 / TR232); S/R M.0319; drop-rate H/ > 5 and /L < 4.7 → S/R → M.0314; S/R M.000A with BU-CMD conditional write | as listed | same | Pass |
| ABC-055 | 02 | MFT + M.254F + M.321C, PA fan stopped, no drum LL | after TON 2 s M.0315 = 1; 2 s pulse M.0317 → M.031A = 1, M.0310 = 1, SV 25 % | same (pulse over after 2 s) | Pass |
| ABC-055 | 03 | Same with drop rate > 5 (M.0314 = 1); then PA fan running | M.0316 pulse sets M.0319 (SV 20 %), stays latched; when M.0315 drops the M.0318 pulse resets it and M.031B = 1 for 2 s (SV 0 %) | same | Pass |
| ABC-014 | 01 | Structure of the two loops: PV−SV ACT:R, PID FICFA1055A / B, M.0266 = OR(B.0729, NOT L.0044, NOT L.0043, NOT M.3308), BU-CMD = TPS 2 s of NOT(M.3308) with RB-MV 25 %, H/ > 23 AND /L < 27 → M.2550 | as listed | same (input nets matched to their labels one by one) | Pass |
| ABC-014 | 02 | Blower A stops / outlet SOV not opened / silencer SOV not closed / B.0729 bad | M.0266 = 1 (manual); blower stop gives a 2 s BU-CMD pulse with MV 25 % | same | Pass |

### Cross-page links (all sheets) — to check sheet by sheet
- After stepping every sheet, 154 digital inputs are linked to their source page. 38 digital inputs sit next to a "( FROM ABC-xxx )" note without a link; many of them are false alarms because the note belongs to the next line (for example ABC-014: L.0044 comes from DITL, only B.0729 comes from ABC-006, and that one is linked). Each candidate is checked when its sheet is traced; none is counted as a defect yet.

## Batch 5 — ABC-029, ABC-004B, ABC-004C

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-029 | 01 | Structure: right loop AI0514 → PV−SV (ACT:N) → PICDO1008; A/M T (1:A M.025C with SET SV 11.5; 1:B M.0408 = OR(B.0722, M.0409)); BU-CMD M.0409 = OR(M.0400, TPS 2 s of AND of four OR groups: burner A-D "oil supply valves all closed" OR "shutdown command"), RB-MV 100 %; left loop AI0276 → MAN HICDO1012, A/M T (M.0001), BU-CMD M.0401 = OR(M.0400, M.025C), RB-MV = T(100 % when M.025C, else 0 %); 100 − MV to AO0212 / AO0324 | as listed | same | Pass |
| ABC-029 | 02 | MFT → 3 s pulse M.0400; house operation M.025C; four burner groups; one group missing; B.0722 bad | MFT: left MV 0 %, right MV 100 % for 3 s; M.025C: left MV 100 %, right auto; four groups → 2 s pulse of M.0409 (MV 100 %); three groups → nothing; B.0722 bad → manual | same | Pass |
| ABC-004B | 01 | Structure: AI0512 → SI0124 = T(running: flow, else 0); M.0152 = TON 3 s of TOF 2 s of M.3401; bias MAN B-BIAS → LN25 → Σ with FIC-CF.MV → SI0126; rate block, S/R M.0155; A/M T (M.0151 = OR(M.025B, NOT M.0152, B.0720)); high limit T (M.3405: 83.3 / 100); BU-CMD (M.0157 = OR(NOT M.015E, M.0158)), M.0158 = OR(TPS 5 s of M.015E, TPS 25 s of AND(M.025B, M.015E)); ≥ 83.3 % → M.015F | as listed | same | Pass |
| ABC-004B | 02 | Feeder start / stop, house operation, M.3405 | running confirmed after 2 + 3 s; manual (M.0151) until then; 5 s pulse M.0158 on start; house operation → manual + 25 s pulse; high limit 83.3 / 100 | same | Pass |
| ABC-004C | 01 / 02 | Same structure with the C tags (M.3402, B.0728, M.0161, M.0167, M.0168, M.0166; M.3405 = n46) and the same scenarios | as ABC-004B | same | Pass |

## Batch 6 — ABC-035 to ABC-039 (No.1 HPH, No.2 HPH, No.1 / 2 / 3 LPH level control)

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-035 | 01 | Structure: two LT (−300…310 mm) with SIG.AB and ALM, H/ > 140 (M.2510 / M.2513), H/ > 40 (M.2511 / M.2514), L/ < −40 (M.2512 / M.2515); SELECT PRI/SEC/AVG → SI0210; two PID (primary and alternate drain, same SV, ACT:N); primary A/M T (B.1014 AND B.106C bad → manual); alternate T EX-CMD (NOT of primary MAN, EX-MV SI0290 from LN39); alternate A/M T; LN38 on the primary MV; 100 − MV to AO0467 / AO0483; M.0193 (HH) = 2 of 3 (M.2510, M.2513, level switch); M.0194 = OR(M.2511, M.2514); M.0195 = OR(M.2512, M.2515) | as listed | same | Pass |
| ABC-035 | 02 | PV1 10 / PV2 30; PV1 150; both 150; switch with one PV high; switch alone; both −50; both level signals bad; only one bad | average 20; M.2510 / M.2511 at 150; HH only with two of three; H = OR; L = OR; manual only when both are bad | same | Pass |
| ABC-036 to 039 | 01 / 02 | Same structure (netlist identical to ABC-035 apart from block numbering and the tags; the drawing PDFs of these four were not looked at one by one) and the same scenarios with their own tags (LICHD11061 / 11011 / 11021 / 11031, switches I.029F / I.029B / I.029C / I.029D) | as ABC-035 | same, all four | Pass |

## Batch 7 — ABC-053, ABC-019, ABC-030, ABC-031

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-053 | 01 | Structure: AI0534 → f(t) 2 s → LN22 → two T (GCB 52G1 ON 46 °C, turning gear 38 °C) → HLIM 46 → RAMPB 0.5 %/s → SV; two TE → SELECT → SI0260; PID TICLO1002 (ACT:N); EX-CMD T (M.0133) with MLD = T(20 % / 0 %, M.0132); M.0132 = S/R (> 45 °C / < 40 °C); LLIM with MLD; M.0133 = AND(MV < MLD, NOT MAN); M.0131 = AND of both SIG.AB; 100 − MV | as listed | same | Pass |
| ABC-053 | 02 | Average of two TE; S/R thresholds; SV with GCB / turning gear and 0.5 °C/s ramp; SIG.AB both / one bad | average 42; set above 45, hold between, reset below 40 (MLD 20 / 0 %); SV 46 / 38 ramping at 0.5 °C/s; manual only when both bad | same | Pass |
| ABC-019 | 01 | Structure: two SELECT (outlet header temps → SI0100, inlet de-S/H temps → SI0110); saturation temperature from LN2 and M.0172 = (SI0110 − SI0112) > 11; SV chain (LN9, S/R M.0171 at ≤ 10.1 / ≥ 15 %, Σ SI0205, ramp 1 %/s, remote mode M.0175 = TPS 2 s of M.2542 AND MW > 75 AND ICV transfer complete); M.0170 = OR(NOT M.0172, M.0173, AND of outlet SIG.AB, AND of inlet SIG.AB); M.0173 = OR(NOT M.0172, NOT ICV transfer complete, SOV closed, MFT) | as listed | same | Pass |
| ABC-019 | 02 | Averages 510 / 305; saturation 250.64 °C at 40 kg/cm²; M.0172; M.0170 / M.0173 each branch; M.0171 S/R; M.0175 2 s pulse | as drawn | as drawn (ICV transfer not complete keeps M.0173 = 1 by design) | Pass |
| ABC-030 | 01 | Structure: two PT with SELECT → SI0270; PICAS1004 (M.0120 = AND of both SIG.AB, M.0124 trip → SV 9.5, BU-CMD 30 %); PICAS1005 (M.012A = OR(M.0120, M.0129), M.0129 = OR(M.0124, M.2541, M.2540), RB-MV 0 %); S/R M.2541 (cold reheat temp < 230 set, > 235 reset) and M.2540 (pressure < 9.5 set, > 11.5 reset); LN16 / LN17 to the two valves with 100 − MV; M.012E (< 2 %), M.0128 (> 4 % / < 3 %) | as listed | same | Pass |
| ABC-030 | 02 | Temperature / pressure S/R hold and reset; turbine trip; both PT bad | as drawn | as drawn (trip: AO0580 = 30 %) | Pass |
| ABC-031 | 01 | Structure: hot well LT with dumping loop (LICCD1110B: M.0165 = AND(NOT MFT, NOT B.1008), TPS 2 s M.0166, EX-CMD, SI0282 = T(0 / 100 %, M.0164), M.0164 = S/R 150 / 50 mm) and make-up loop (LICCD1110A); M.3211 < −300; three deaerator LT with AVERAGE → SI0202, flags > 300, > 200, < −500, < −2174; LICCD1104 with M.0160 = AND of the three SIG.AB; 100 − MV | as listed | same | Pass |
| ABC-031 | 02 | S/R 150 / 50; M.3211; averages and four level flags; M.0160 only when all three SIG.AB are bad | as drawn | as drawn | Pass |

## Batch 8 — ABC-051 (HP turbine bypass steam spray water temperature control)

| Sheet | Test ID | What was checked | Expected (drawing) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-051 | 01 | Structure: two TT with SIG.AB, SELECT → SI0160; saturation temperature from LN10 (SI0172); SV chain (SI0171 = 220, 300 when I.0418 = 1); trip I.0400 selects 1.0 / 0.5 (T "1:b" / "1:a"); M.071E → TPS 2 s → M.070A → M.0715, M.0174; M.0707 → M.0716 pulse; M.0702 → M.0174; M.012C → SI0177 = 100 | as listed | same | Pass |
| ABC-051 | 02 | Average 510; saturation at 40 kg/cm² = 280.64; trip on / off; M.071E 2 s pulse; both TT bad; TT 210 vs saturation 213.86 | SI0172 280.64; trip on: n16 = 1, SI0178 66.4, SI0176 300; trip off: n16 = 0.5; M.071E: M.0715 = 1, M.0174 = 1, SI0177 = 0; both bad: M.0715 = 1; 210 < 213.86: M.0717 = 1 | same | Pass |
