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

### F-1 — DENSITY CORRECTION divider is inverted (Confirmed in simulator; drawing reading visual)
- Drawing: the other two ÷ blocks on the page (limestone density, S/CaCO3) are stacked **A over B**; the DENSITY CORRECTION block is stacked **B over A**.
- Simulator: block 21 has `nu` = AB0116 net, `de` = chain net, so it computes A/B.
- Likely cause (Suspected): the ÷ reader only understands an inline `a/b` text. A stacked fraction is two separate texts "A" and "B", so every ÷ falls back to A/B. Not yet checked whether other sheets have a stacked B/A ÷.
- Effect: SI0337 (feedforward into the Σ/OMV summer) is wrong in direction. Plain explanation: when limestone density goes up, the real logic should lower the feeder speed demand; the simulator raises it.
- No fix applied. A fix changes ABC reader behavior and needs approval (see HANDOFF).

### Needs Verification (not decidable from the drawing alone)
- **N-1** Magnitudes. With the drawing constants the chain gives values of the order 1e5 at SI0334/SI0337, far outside a 0–100 % feeder range. Either the units of cross-page SI0144 (TCFI-004A), the "SCALE CONVERT 12000/2700" direction (×4.444 vs ×0.225), or the "13" vs "BASE: 1.3" constant is not what the sim assumes. Needs ABC-004A, the Station 101 memory list and the DCS I/O list.
- **N-2** Constant "13" under the density-base box vs label "BASE : 1.3": the sim uses 13 in both places (blocks 19 and 28).
- **N-3** SI0144 in the simulator is fed by a cross-page link (it read 7.32 and ignored a manual write); the source on ABC-004A was not traced.

### Not checked yet on ABC-005
PID AICFG10571 behaviour/parameters, A/M and BU-CMD/RB-MV transfer blocks, trip M.3403 / M.0149 / M.0148 logic, coal-feeder-running AND/OR logic, AO0788 output, SUMA S1-MDL196 totalizer, ALM SIM1311, and all tag/address cross-checks against `dcs-io-list.xls` and `memory-list-101.xls`.
