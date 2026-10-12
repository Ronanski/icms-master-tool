# ABC Audit Findings — v1.20.21

Version evidence: the simulator window title and header badge both show **v1.20.21** (`logic-sim-v1.20.21.html`, loaded headless). The `.apk` and `.exe` were **not** run.

Method: format of `docs/abc-audit/ABC-AUDIT.md`. Source = `document-references/analog-logic-abc.zip` → `PDF/(17)ABC-005.pdf` (read visually at 300 dpi; the PDFs have no text layer). Simulator values were read-only: inputs written to the sheet's external-input nets, solver settled, net values read. No simulator code or data was changed.

## ABC-005 — Limestone Feeder Control (SOx Control), Station 101

| Test ID | Block / path | Input | Expected (source) | Actual | Verdict |
|---|---|---|---|---|---|
| ABC-005-01 | AB0114 ÷ max(AB0115, 1) × 3.13 × 10000 → SI0339 | AB0114 = 3, AB0115 = 60 | 3 / 60 × 3.13 × 10000 = 1565 (drawing: ÷ A/B, ×3.13, ×10000) | 1565 | **Pass** |
| ABC-005-02 | Same path, LOW LIMIT block (constant 1) | AB0114 = 3, AB0115 = 0.5 and 1 | Denominator held at 1 → 93900 | 93900 in both cases | **Pass** |
| ABC-005-03 | Same path, upper range | AB0114 = 3, AB0115 = 99.99 / AB0114 = 0.01, AB0115 = 60 | 939.09… / 5.2166… | 939.09… / 5.2166… | **Pass** |
| ABC-005-04 | DENSITY CORRECTION ÷ → SI0337 | AB0116 = 1.1 / 1.3 / 1.5, other inputs fixed | Drawing marks this ÷ as **B/A** (B = limestone chain × 13, A = AB0116), so output must **fall** as AB0116 rises | Output **rises** with AB0116: 1.66e-6 / 1.96e-6 / 2.27e-6; equals AB0116 / (chain × 13), i.e. A/B | **Fail** (direction) |
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
- No fix applied. A fix changes ABC reader behavior and needs approval (see HANDOFF).

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
| AI tag, range and unit vs I/O list, 176 unique AI tags | 155 match, 0 not found in the I/O list. 19 have no range in the sim and are position-feedback AIs (I/O 0–100 %, handled by the valve feedback model) except **AI0481 (F-3)**. 2 are cosmetic unit text (AI0151 shows "% ( 0.00 ~ 27.00 T/H )", AI0131 "Kg/cm2" vs "kg/cm2") |
| Sim built-in Health / warnings | Empty on every sheet |

### F-2 — PID CUT and DH values are swapped between the workbook and the sim data (Needs Verification which is right)
- Sim data (`FACE`, "user file 2026-10-08"): CUT 0, DH 5 (or 0/10 …); repo workbook: CUT 5, DH 0 (or 10/0 …) on every PID row.
- The workbook's own How-to sheet says the simulator does **not** use CUT or DH yet, so behavior is not affected. No change made. Needs the user to confirm which file is the later DCS readout.

### F-3 — AI0481 (ABC-008, rpm, I/O range 0–1200) has no range in the sim (Suspected)
- No range text was read for this transmitter and it has no feedback model, so the sim falls back to its default span. Needs a look at the ABC-008 drawing text before fixing.

### N-5 — HIC-MWRL (ABC-001B) MV limits
- Workbook / FACE: SH 10, MH 30 %, ML 1 % (= 3 and 0.1 MW/MIN). Code in `anFace` deliberately overrides it to the full range 0–10 (`if(e.tag==='HIC-MWRL'){P.lo=e.SL;P.hi=e.SH}`). Reason not documented. Needs the user's confirmation; no change made.

### F-1 fix status
Approved by the user in chat ("if logic says it is right, do it"). The planned patch: the ÷ reader also reads a stacked A/B or B/A fraction (the upper letter is the numerator). From the pre-patch scan it should change only ABC-005 block 21 among the 15 ÷ blocks, but this was **not tested**. The patch is **not applied**: the environment's permission system blocked editing `logic-sim-v1.20.21.html`, so the file is unchanged.
