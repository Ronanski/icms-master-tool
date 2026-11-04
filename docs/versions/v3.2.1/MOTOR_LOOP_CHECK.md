# MOTOR LOOP CHECK: standard checklist per motor (v3.2.1)

Made 2026-11-04 by the thread "Build loop check dock in app", for MINA : TESTER. App version: **3.2.1-beta.18** or later (the FIELD · LOCAL PANEL buttons of the motor faceplate).

**Scope.** Every motor on the approved mockup pages in the app with a DITL drawing: 030 CIRCULATING WATER (SWP A / B / C, SWBP A / B / C), MAKE-UP AND CLOSED COOLING WATER (MWP A / B / C, ACWP A / B), 028 CONDENSATE (CEP A / B), FEEDWATER (BFWP A / B). That is 15 motors. Left out: the air compressors (DITL-113 / 114, own local panel start), the turbine oil pumps (TCS, no DITL), the hypochlorite pumps (FIELD only).

**Sources.** Each address and row comes from the drawing as the app reads it (v3.2.1-beta.18, `LS_DOCK.dOf` / `DUI.rowInfo` / `DUI.outs`), and the row numbers are the ones on the PDF. The DITL-29A (sheet 53) and DITL-30 (sheet 55) PDFs were read for the LOCAL rows, the ELECTRICAL TROUBLE symbol, the STOP path and the auto start path. "(row n)" is an input row and "(out n)" is an output row of the drawing.

**How to run (user 2026-11-04).** The plant does not need to run or carry load. Treat it as an uncoupled motor: Home → Cold → RUN, then open the HMI page. Only the permissives of the drawing apply. Use only real presses: the faceplate (click the motor) and its FIELD · LOCAL PANEL block (LCP START / STOP, EMERGENCY STOP, RELAY TRIP / RESET). Each press asks EXECUTE and is logged in Events. To read an address, open "Logic DITL-xx" on the faceplate. Mark PASS or FAIL per row.

**Common rules from the drawings** (DITL-29A / DITL-30; check the other drawings during the test):
- DCS START = START P.B. AND REMOTE AND NOT AUTO (manual start in MAN only).
- DCS STOP = STOP P.B. AND REMOTE AND NOT AUTO. A STOP in AUTO is not taken, and the faceplate says so.
- Auto cut-in = AUTO AND REMOTE AND (another pump TRIP with its RUNNING off-delay 2 s, or its TRIP INTERLOCK). A normal STOP of the running pump gives no cut-in.
- LCP START / STOP work only with the selector at LOCAL (AND NOT REMOTE).
- RELAY TRIP = the ELECTRICAL TROUBLE symbol of the drawing. It trips the motor in any mode and stays until RESET.
- EMERGENCY STOP P.B.: none of these 15 drawings has one (only DITL-21A, bottom ash screw cooler). The button stays grey: "not on DITL-xx".

**Checked in the cloud before release (Chromium, Cold, RUN, real faceplate clicks):**
- LCP START → RUNNING and LCP STOP → STOPPED on SWP A / B / C, MWP A / B / C, ACWP A / B, CEP A / B.
- SWBP A / B / C and BFWP A / B did not start from Cold, because the permissives of their drawings were not met (see the notes per motor).
- RELAY TRIP of SWP-A while SWP-B was in AUTO → SWP-A TRIP and SWP-B started by itself; RESET → STOPPED.
- Earlier the same day: SWBP-A TRIP → SWBP-B (AUTO) started.
- Not live-tested on the user PC.

---

## SWP-A (P-1501A) · DITL-29A · page 030 CIRCULATING WATER

Current: IIP1501A on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-29A) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.032C (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1150 (row 2) pulse; RUNNING I.032A (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1151 (row 17) pulse; STOPPED I.032D (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.032B (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.032B = 0 | |
| L6 | While running (L2): read IIP1501A | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1501A of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-29A) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.032C (row 5) = 0; START P.B. M.1150 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.032B = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1152 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1151 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWP-B running (REMOTE), SWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-B | SWP-B TRIP; SWP-A starts by itself (RUNNING red) about 2 s later | SWP-B TRIP I.0527 (row 8) = 1 with SWP-B RUNNING I.0526 (row 9, 2 s off-delay); also TRIP INTERLOCK M.1163 (row 11) → SWP-A RUNNING I.032A = 1 | |
| F5 | Auto cut-in: SWP-C running (REMOTE), SWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-C | SWP-C TRIP; SWP-A starts by itself (RUNNING red) about 2 s later | SWP-C TRIP I.081B (row 12) = 1 with SWP-C RUNNING I.081A (row 13, 2 s off-delay); also TRIP INTERLOCK M.1173 (row 15) → SWP-A RUNNING I.032A = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.032A = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-29A rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-29A" | no EMERGENCY STOP input on this drawing | |

---

## SWP-B (P-1501B) · DITL-29A #B · page 030 CIRCULATING WATER

Current: IIP1501B on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-29A #B) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0528 (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1160 (row 2) pulse; RUNNING I.0526 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1161 (row 17) pulse; STOPPED I.0529 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0527 (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0527 = 0 | |
| L6 | While running (L2): read IIP1501B | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1501B of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-29A #B) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0528 (row 5) = 0; START P.B. M.1160 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0527 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1162 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1161 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWP-C running (REMOTE), SWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-C | SWP-C TRIP; SWP-B starts by itself (RUNNING red) about 2 s later | SWP-C TRIP I.081B (row 8) = 1 with SWP-C RUNNING I.081A (row 9, 2 s off-delay); also TRIP INTERLOCK M.1173 (row 11) → SWP-B RUNNING I.0526 = 1 | |
| F5 | Auto cut-in: SWP-A running (REMOTE), SWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-A | SWP-A TRIP; SWP-B starts by itself (RUNNING red) about 2 s later | SWP-A TRIP I.032B (row 12) = 1 with SWP-A RUNNING I.032A (row 13, 2 s off-delay); also TRIP INTERLOCK M.1153 (row 15) → SWP-B RUNNING I.0526 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.0526 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-29A #B rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-29A #B" | no EMERGENCY STOP input on this drawing | |

---

## SWP-C (P-1501C) · DITL-29A #C · page 030 CIRCULATING WATER

Current: IIP1501C on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-29A #C) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.081C (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1170 (row 2) pulse; RUNNING I.081A (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1171 (row 17) pulse; STOPPED I.081D (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.081B (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.081B = 0 | |
| L6 | While running (L2): read IIP1501C | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1501C of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-29A #C) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.081C (row 5) = 0; START P.B. M.1170 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.081B = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1172 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1171 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWP-A running (REMOTE), SWP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-A | SWP-A TRIP; SWP-C starts by itself (RUNNING red) about 2 s later | SWP-A TRIP I.032B (row 8) = 1 with SWP-A RUNNING I.032A (row 9, 2 s off-delay); also TRIP INTERLOCK M.1153 (row 11) → SWP-C RUNNING I.081A = 1 | |
| F5 | Auto cut-in: SWP-B running (REMOTE), SWP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on SWP-B | SWP-B TRIP; SWP-C starts by itself (RUNNING red) about 2 s later | SWP-B TRIP I.0527 (row 12) = 1 with SWP-B RUNNING I.0526 (row 13, 2 s off-delay); also TRIP INTERLOCK M.1163 (row 15) → SWP-C RUNNING I.081A = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.081A = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-29A #C rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-29A #C" | no EMERGENCY STOP input on this drawing | |

---

## SWBP-A (P-1503A) · DITL-30 · page 030 CIRCULATING WATER

Current: IIP1503A on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-30) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1200 (row 2) pulse; RUNNING I.004C (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1201 (row 14) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.004D (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.004D = 0 | |
| L6 | While running (L2): read IIP1503A | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1503A of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-30) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1200 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.004D = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1202 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1201 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWBP-B running (REMOTE), SWBP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-B | SWBP-B TRIP; SWBP-A starts by itself (RUNNING red) about 2 s later | SWBP-B TRIP I.036D (row 8) = 1 with SWBP-B RUNNING I.036C (row 9, 2 s off-delay) → SWBP-A RUNNING I.004C = 1 | |
| F5 | Auto cut-in: SWBP-C running (REMOTE), SWBP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-C | SWBP-C TRIP; SWBP-A starts by itself (RUNNING red) about 2 s later | SWBP-C TRIP I.025E (row 10) = 1 with SWBP-C RUNNING I.025D (row 11, 2 s off-delay) → SWBP-A RUNNING I.004C = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.004C = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-30 rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-30" | no EMERGENCY STOP input on this drawing | |

Drawing note: Start needs one seawater pump running: rows 17 ~ 19 (I.032A, I.0526, I.081A). From Cold, start a SWP first. With no SWP running, the drawing also stops it.

---

## SWBP-B (P-1503B) · DITL-30 #B · page 030 CIRCULATING WATER

Current: IIP1503B on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-30 #B) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1210 (row 2) pulse; RUNNING I.036C (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1211 (row 14) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.036D (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.036D = 0 | |
| L6 | While running (L2): read IIP1503B | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1503B of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-30 #B) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1210 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.036D = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1212 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1211 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWBP-C running (REMOTE), SWBP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-C | SWBP-C TRIP; SWBP-B starts by itself (RUNNING red) about 2 s later | SWBP-C TRIP I.025E (row 8) = 1 with SWBP-C RUNNING I.025D (row 9, 2 s off-delay) → SWBP-B RUNNING I.036C = 1 | |
| F5 | Auto cut-in: SWBP-A running (REMOTE), SWBP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-A | SWBP-A TRIP; SWBP-B starts by itself (RUNNING red) about 2 s later | SWBP-A TRIP I.004D (row 10) = 1 with SWBP-A RUNNING I.004C (row 11, 2 s off-delay) → SWBP-B RUNNING I.036C = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.036C = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-30 #B rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-30 #B" | no EMERGENCY STOP input on this drawing | |

Drawing note: Start needs one seawater pump running: rows 17 ~ 19.

---

## SWBP-C (P-1503C) · DITL-30 #C · page 030 CIRCULATING WATER

Current: IIP1503C on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-30 #C) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1220 (row 2) pulse; RUNNING I.025D (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1221 (row 14) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.025E (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.025E = 0 | |
| L6 | While running (L2): read IIP1503C | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1503C of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-30 #C) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1220 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.025E = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1222 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | stays RUNNING; after 3 s "STOP not taken ... MAN only" | STOP P.B. M.1221 with AUTO = 1 (STOP = STOP P.B. AND NOT AUTO) | |
| F5 | Auto cut-in: SWBP-A running (REMOTE), SWBP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-A | SWBP-A TRIP; SWBP-C starts by itself (RUNNING red) about 2 s later | SWBP-A TRIP I.004D (row 8) = 1 with SWBP-A RUNNING I.004C (row 9, 2 s off-delay) → SWBP-C RUNNING I.025D = 1 | |
| F5 | Auto cut-in: SWBP-B running (REMOTE), SWBP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on SWBP-B | SWBP-B TRIP; SWBP-C starts by itself (RUNNING red) about 2 s later | SWBP-B TRIP I.036D (row 10) = 1 with SWBP-B RUNNING I.036C (row 11, 2 s off-delay) → SWBP-C RUNNING I.025D = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.025D = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 26) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-30 #C rows 23 / 26 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-30 #C" | no EMERGENCY STOP input on this drawing | |

Drawing note: Start needs one seawater pump running: rows 17 ~ 19.

---

## MWP-A (P-0709A) · DITL-112 · page MAKE-UP AND CLOSED COOLING WATER

Current: IIP0709A on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-112) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1050 (row 4) pulse; RUNNING I.0000 (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1051 (row 17) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0001 (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0001 = 0 | |
| L6 | While running (L2): read IIP0709A | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP0709A of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-112) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1050 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0001 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1052 (row 15) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-112 decides (not yet read from its PDF) | STOP P.B. M.1051 with AUTO = 1 | |
| F5 | Auto cut-in: MWP-B running (REMOTE), MWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-B | MWP-B TRIP; MWP-A starts by itself (RUNNING red) about 2 s later | MWP-B TRIP I.0081 (row 8) = 1 with MWP-B RUNNING I.0080 (row 6, 2 s off-delay) → MWP-A RUNNING I.0000 = 1 | |
| F5 | Auto cut-in: MWP-C running (REMOTE), MWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-C | MWP-C TRIP; MWP-A starts by itself (RUNNING red) about 2 s later | MWP-C TRIP I.0321 (row 14) = 1 with MWP-C RUNNING I.0320 (row 12, 2 s off-delay) → MWP-A RUNNING I.0000 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.0000 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-112 rows 23 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-112" | no EMERGENCY STOP input on this drawing | |

Drawing note: The drawing also reads MWP OUTLET HEADER PRESS. L.L. (M.2506, rows 5 / 11) and the demi water tank level LOW (rows 19 / 21).

---

## MWP-B (P-0709B) · DITL-112 #B · page MAKE-UP AND CLOSED COOLING WATER

Current: IIP0709B on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-112 #B) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1060 (row 4) pulse; RUNNING I.0080 (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1061 (row 17) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0081 (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0081 = 0 | |
| L6 | While running (L2): read IIP0709B | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP0709B of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-112 #B) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1060 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0081 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1062 (row 15) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-112 #B decides (not yet read from its PDF) | STOP P.B. M.1061 with AUTO = 1 | |
| F5 | Auto cut-in: MWP-C running (REMOTE), MWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-C | MWP-C TRIP; MWP-B starts by itself (RUNNING red) about 2 s later | MWP-C TRIP I.0321 (row 8) = 1 with MWP-C RUNNING I.0320 (row 6, 2 s off-delay) → MWP-B RUNNING I.0080 = 1 | |
| F5 | Auto cut-in: MWP-A running (REMOTE), MWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-A | MWP-A TRIP; MWP-B starts by itself (RUNNING red) about 2 s later | MWP-A TRIP I.0001 (row 14) = 1 with MWP-A RUNNING I.0000 (row 12, 2 s off-delay) → MWP-B RUNNING I.0080 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.0080 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-112 #B rows 23 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-112 #B" | no EMERGENCY STOP input on this drawing | |

Drawing note: Header pressure L.L. M.2506 and the demi water tank level LOW are on the same drawing.

---

## MWP-C (P-0709C) · DITL-112 #C · page MAKE-UP AND CLOSED COOLING WATER

Current: IIP0709C on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-112 #C) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED (row 22) = 0 then 1; output REMOTE SELECTED (out 17) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1070 (row 4) pulse; RUNNING I.0320 (out 8) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1071 (row 17) pulse; STOPPED (out 11) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0321 (out 14) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0321 = 0 | |
| L6 | While running (L2): read IIP0709C | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP0709C of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-112 #C) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE (row 22) = 0; START P.B. M.1070 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0321 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1072 (row 15) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-112 #C decides (not yet read from its PDF) | STOP P.B. M.1071 with AUTO = 1 | |
| F5 | Auto cut-in: MWP-A running (REMOTE), MWP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-A | MWP-A TRIP; MWP-C starts by itself (RUNNING red) about 2 s later | MWP-A TRIP I.0001 (row 8) = 1 with MWP-A RUNNING I.0000 (row 6, 2 s off-delay) → MWP-C RUNNING I.0320 = 1 | |
| F5 | Auto cut-in: MWP-B running (REMOTE), MWP-C REMOTE + AUTO stopped; FIELD RELAY TRIP on MWP-B | MWP-B TRIP; MWP-C starts by itself (RUNNING red) about 2 s later | MWP-B TRIP I.0081 (row 14) = 1 with MWP-B RUNNING I.0080 (row 12, 2 s off-delay) → MWP-C RUNNING I.0320 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 23) pulse → RUNNING I.0320 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-112 #C rows 23 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-112 #C" | no EMERGENCY STOP input on this drawing | |

Drawing note: Header pressure L.L. M.2506 and the demi water tank level LOW are on the same drawing.

---

## ACWP-A (P-1108A) · DITL-76 · page MAKE-UP AND CLOSED COOLING WATER

Current: IIP1108A on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-76) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0088 (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1230 (row 2) pulse; RUNNING I.0086 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1231 (row 18) pulse; STOPPED I.0089 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0087 (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0087 = 0 | |
| L6 | While running (L2): read IIP1108A | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1108A of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-76) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0088 (row 5) = 0; START P.B. M.1230 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0087 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1232 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-76 decides (not yet read from its PDF) | STOP P.B. M.1231 with AUTO = 1 | |
| F5 | Auto cut-in: ACWP-B running (REMOTE), ACWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on ACWP-B | ACWP-B TRIP; ACWP-A starts by itself (RUNNING red) about 2 s later | ACWP-B TRIP I.0407 (row 8) = 1 with ACWP-B RUNNING I.0406 (row 9, 2 s off-delay); also TRIP INTERLOCK M.1244 (row 7) → ACWP-A RUNNING I.0086 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 21) pulse → RUNNING I.0086 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-76 rows 21 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-76" | no EMERGENCY STOP input on this drawing | |

Drawing note: The drawing also reads AUX. CW PUMP COMMON DISCHARGE PRESSURE LOW (M.250D, row 12) and the motor bearing / winding temperatures (rows 13 ~ 17).

---

## ACWP-B (P-1108B) · DITL-77 · page MAKE-UP AND CLOSED COOLING WATER

Current: IIP1108B on the HMI (I/O list AI).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-77) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0408 (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON, current up | START P.B. M.1240 (row 2) pulse; RUNNING I.0406 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF, current 0 | STOP P.B. M.1241 (row 18) pulse; STOPPED I.0409 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0407 (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0407 = 0 | |
| L6 | While running (L2): read IIP1108B | value on the page and on the faceplate CURRENT row, 0 when stopped | AI IIP1108B of the I/O list | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-77) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0408 (row 5) = 0; START P.B. M.1240 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0407 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1242 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-77 decides (not yet read from its PDF) | STOP P.B. M.1241 with AUTO = 1 | |
| F5 | Auto cut-in: ACWP-A running (REMOTE), ACWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on ACWP-A | ACWP-A TRIP; ACWP-B starts by itself (RUNNING red) about 2 s later | ACWP-A TRIP I.0087 (row 8) = 1 with ACWP-A RUNNING I.0086 (row 9, 2 s off-delay); also TRIP INTERLOCK M.1234 (row 7) → ACWP-B RUNNING I.0406 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 21) pulse → RUNNING I.0406 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-77 rows 21 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-77" | no EMERGENCY STOP input on this drawing | |

---

## CEP-A (P-1116A) · DITL-61A · page 028 CONDENSATE

Current: no current tag on this page (not in the mockup).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-61A) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0082 (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON | START P.B. M.1180 (row 2) pulse; RUNNING I.0080 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF | STOP P.B. M.1181 (row 15) pulse; STOPPED I.0083 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0081 (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0081 = 0 | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-61A) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0082 (row 5) = 0; START P.B. M.1180 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0081 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1182 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-61A decides (not yet read from its PDF) | STOP P.B. M.1181 with AUTO = 1 | |
| F5 | Auto cut-in: CEP-B running (REMOTE), CEP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on CEP-B | CEP-B TRIP; CEP-A starts by itself (RUNNING red) about 2 s later | CEP-B TRIP I.0401 (row 8) = 1 with CEP-B RUNNING I.0400 (row 9, 2 s off-delay); also TRIP INTERLOCK M.1194 (row 10) → CEP-A RUNNING I.0080 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 21) pulse → RUNNING I.0080 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-61A rows 21 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-61A" | no EMERGENCY STOP input on this drawing | |

Drawing note: The drawing also reads CONDENSATE PUMPS OUTLET PRESSURE LOW (row 11) and CONDENSER WATER LEVEL LOW LOW / LL (rows 12 / 13).

---

## CEP-B (P-1116B) · DITL-61A #B · page 028 CONDENSATE

Current: no current tag on this page (not in the mockup).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-61A #B) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0402 (row 5) = 0 then 1; output REMOTE SELECTED (out 12) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON | START P.B. M.1190 (row 2) pulse; RUNNING I.0400 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF | STOP P.B. M.1191 (row 15) pulse; STOPPED I.0403 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0401 (out 17) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0401 = 0 | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-61A #B) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0402 (row 5) = 0; START P.B. M.1190 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0401 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1192 (row 4) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-61A #B decides (not yet read from its PDF) | STOP P.B. M.1191 with AUTO = 1 | |
| F5 | Auto cut-in: CEP-A running (REMOTE), CEP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on CEP-A | CEP-A TRIP; CEP-B starts by itself (RUNNING red) about 2 s later | CEP-A TRIP I.0081 (row 8) = 1 with CEP-A RUNNING I.0080 (row 9, 2 s off-delay); also TRIP INTERLOCK M.1184 (row 10) → CEP-B RUNNING I.0400 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 21) pulse → RUNNING I.0400 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 24) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-61A #B rows 21 / 24 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-61A #B" | no EMERGENCY STOP input on this drawing | |

Drawing note: Same drawing note as CEP-A. Seen in the app: on the B copy the address column of rows 11 / 13 is swapped and rows 20 ~ 28 show M.3217 (a reading of the B copy, to be checked against the PDF).

---

## BFWP-A (P-1115A) · DITL-23A · page FEEDWATER

Current: no current tag on this page (not in the mockup).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-23A) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0058 (row 21) = 0 then 1; output REMOTE SELECTED (out 14) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON | START P.B. M.1070 (row 1) pulse; RUNNING I.0056 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF | STOP P.B. M.1071 (row 20) pulse; STOPPED I.0059 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0057 (out 15) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0057 = 0 | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-23A) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0058 (row 21) = 0; START P.B. M.1070 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0057 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1072 (row 18) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-23A decides (not yet read from its PDF) | STOP P.B. M.1071 with AUTO = 1 | |
| F5 | Auto cut-in: BFWP-B running (REMOTE), BFWP-A REMOTE + AUTO stopped; FIELD RELAY TRIP on BFWP-B | BFWP-B TRIP; BFWP-A starts by itself (RUNNING red) about 2 s later | BFWP-B TRIP I.0377 (row 4) = 1 with BFWP-B RUNNING I.0376 (row 5, 2 s off-delay); also TRIP INTERLOCK M.1143 (row 7) → BFWP-A RUNNING I.0056 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 25) pulse → RUNNING I.0056 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 28) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-23A rows 25 / 28 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-23A" | no EMERGENCY STOP input on this drawing | |

Drawing note: Start permissives of the drawing: lube oil pressure (I.0090 LOW row 3, I.0091 HIGH row 17), suction manual valve open (ZSO-FW1031, M.3246 row 11), suction pressure (PT-FW1115-A row 12), outlet pressure LL (row 9). From Cold these are not met, so LCP START does nothing until the lube oil pump runs and the suction valve is open.

---

## BFWP-B (P-1115B) · DITL-23A #B · page FEEDWATER

Current: no current tag on this page (not in the mockup).

### 1. Loop check (signal path)

| # | Action | Expected on the HMI | DITL address (DITL-23A #B) | PASS / FAIL |
|---|---|---|---|---|
| L1 | Faceplate SELECTOR: LOCAL, then REMOTE (FIELD, EXECUTE) | "Local" then "Remote" on the page and on the faceplate | REMOTE MODE SELECTED I.0378 (row 21) = 0 then 1; output REMOTE SELECTED (out 14) | |
| L2 | MODE MAN, DCS START, EXECUTE (REMOTE) | RUNNING red, VCB ON | START P.B. M.1140 (row 1) pulse; RUNNING I.0376 (out 5) = 1 | |
| L3 | DCS STOP, EXECUTE (MAN) | STOPPED green, VCB OFF | STOP P.B. M.1141 (row 20) pulse; STOPPED I.0379 (out 7) = 1 | |
| L4 | Start it again, then FIELD RELAY TRIP, EXECUTE | TRIP red blinking, TRIP chip, TRIP alarm (ANN output), reason "protection relay" | ELECTRICAL TROUBLE = 1 → TRIP I.0377 (out 15) = 1; RUNNING = 0 | |
| L5 | FIELD RELAY RESET, EXECUTE | TRIP clears, STOPPED green | TRIP I.0377 = 0 | |

### 2. Function test (logic)

| # | Action | Expected on the HMI | DITL address (DITL-23A #B) | PASS / FAIL |
|---|---|---|---|---|
| F1 | Selector LOCAL, motor stopped: try DCS START | START grey; reason "Selector at LOCAL: ... blocked" | REMOTE I.0378 (row 21) = 0; START P.B. M.1140 does not act | |
| F2 | Motor tripped (L4, before RESET): try DCS START | START grey; reason "TRIP: protection relay ..." | TRIP I.0377 = 1 | |
| F3 | Selector REMOTE, MODE AUTO while stopped | STANDBY chip; "Remote · Auto" on the page | AUTO MODE SELECTED M.1142 (row 18) = 1 | |
| F4 | Running in AUTO: DCS STOP, EXECUTE | record what happens: the STOP path of DITL-23A #B decides (not yet read from its PDF) | STOP P.B. M.1141 with AUTO = 1 | |
| F5 | Auto cut-in: BFWP-A running (REMOTE), BFWP-B REMOTE + AUTO stopped; FIELD RELAY TRIP on BFWP-A | BFWP-A TRIP; BFWP-B starts by itself (RUNNING red) about 2 s later | BFWP-A TRIP I.0057 (row 4) = 1 with BFWP-A RUNNING I.0056 (row 5, 2 s off-delay); also TRIP INTERLOCK M.1073 (row 7) → BFWP-B RUNNING I.0376 = 1 | |
| F6 | Cut-in done: RELAY RESET on the tripped pump; normal DCS STOP of the running one (MAN) | no auto start from a normal STOP | no TRIP input = 1 | |
| F7 | Selector LOCAL: FIELD LCP START, EXECUTE | RUNNING red; DCS buttons stay grey | LOCAL START P.B. (row 25) pulse → RUNNING I.0376 = 1 | |
| F8 | Selector LOCAL: FIELD LCP STOP, EXECUTE | STOPPED green | LOCAL STOP P.B. (row 28) pulse → STOPPED = 1 | |
| F9 | Selector REMOTE: look at the LCP buttons | LCP START / STOP grey; reason "the local panel START and STOP are blocked (DITL-23A #B rows 25 / 28 ...)" | the LOCAL rows need REMOTE = 0 | |
| F10 | EMERGENCY STOP button | grey, "not on DITL-23A #B" | no EMERGENCY STOP input on this drawing | |

Drawing note: Same start permissives as BFWP-A (I.0410 / I.0411 lube oil, M.3247 suction valve).

---

Report a FAIL with: the motor, the step number, what the HMI showed, and the value of the address on the drawing.
