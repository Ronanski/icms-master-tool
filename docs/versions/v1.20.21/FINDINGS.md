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
- **N-3** SI0144 comes from ABC-004A by cross-page link (it read 7.32; a manual write is overwritten). Source not traced yet.
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
| ABC-001B | 01 | Structure: MAN HIC-MWRL, A/M T (M.0001), ×10/200, ÷ "T = B/A·100/60" (B = 10000), ×1/60, RATE LIMIT (bypass EIC-TM.MAN), ×200/200 | as listed | same; constants 0.05, 10000, 100, 1/60, 1 | Pass |
| ABC-001B | 02 | Force manual M.0001 = 1 selects COS; MV limited to 0.1–3 (after F-5) | 2 → 2; 9 → 3; 0 → 0.1 | 2; 3; 0.1 | Pass |
| ABC-056 | 01 | Structure: AI0417 → SV−PV (ACT:R) → PICCD1104; T sel B.0969 (B) and M.0124 (A, SET SV 3.5); BU-CMD M.0124 → RB-MV 100 %; AI0562 ×5/10 − PV → H/ >0 → M.025F | as listed | same | Pass |
| ABC-056 | 02 | M.0124 = 1: SV 3.5 and output to RB-MV; B.0969 bad: manual | SV 3.5; manual 40 | SV 3.5; 40 (trip branch not isolated: output 75.8) | Pass (manual) / Needs Verification (trip output) |
| ABC-056 | 03 | M.025F "ext pressure > deaerator pressure": ext 4.0 kg/cm² (0–5) vs deaerator 3.5 (0–10) | 1 (4.0 > 3.5) | 0: scaled ext = 4 × 0.5 = 2 and 2 − 3.5 < 0 | Needs Verification (see N-1) |
| ABC-001A | 01 | Structure: three MANs (HIC-ULD, MWHL, MWLL), T selectors, HLLIM SI0204/SI0206, H/ >0.1 % → M.2004 / M.2006, ± generator MW | as listed | same; after F-6 the two set points read 0.1 | Pass (not tested numerically) |

### N-1 (updated) — probable root cause: signal unit basis (Suspected)
- The drawing's "SCALE CONVERT a/b" constants (12000/2700, 10/200, 400/200, 5/10 …) are ratios of two ranges. They give the right answer if the signals between blocks are percent of range, which is how a DCS normally passes them. The simulator carries engineering-unit values (kg/cm², MW, T/H) and multiplies by the same constant (and compares "0.1 %" as the literal 0.1).
- Worked example, ABC-056: ext pressure 4 kg/cm² on a 0–5 range is 80 %; × 5/10 = 40 % of the deaerator 0–10 range = 4 kg/cm²; compared with the deaerator pressure 3.5 → M.025F = 1. The sim gives 4 × 0.5 = 2 kg/cm² → 0.
- The same effect would explain the size of SI0334 / SI0337 on ABC-005 (N-1).
- Not proven: the textbook text could not be quoted for this (the relevant pages are not machine-readable). The sim has a partial normalization (`MUL.nrm`, only for F(X) factors). A fix is a model change across about 15 sheets, so it is not applied; it needs a decision on the intended unit basis and a regression run of all sheets.
