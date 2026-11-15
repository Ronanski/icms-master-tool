# Turnover: SAKURA : TURBINE

Written 2026-11-15 8:45 PM PHT, before the weekly usage limit. Thread: SAKURA : TURBINE (owner of the turbine model in `src/analog/engine/unit.js` and of turbine questions). Read `CLAUDE.md`, `HANDOFF.md` and `PROJECT_RULES.md` first; this file only adds what the turbine owner knows.

## 1. Status in one look

- Turbine MW model: from the MHPS heat balance enthalpy drops (beta.260, merged, PR 708). Done.
- 2026-11-09 ICV to CV transfer event (MS flow and RH pressure to 0): explained up to one open question; waiting for the user's trend (planned 2026-11-16 at work).
- 2026-10-03 event (same transfer, earlier): read from the user's photos; same pattern.
- Teaching page "HP-IP Turbine at Control Valves": v4 live, https://claude.ai/artifact/NRX6XetGGHB3XWh69oZqz8. Not yet checked on the user's phone.
- App replay of the transfer: blocked (no start-up reaches sync in the app; see section 5).

## 2. Turbine MW model (beta.260)

- `src/analog/engine/unit.js`: `AN_TBW` (main steam flow points 150 ~ 472 t/h, HP specific work `wh` and IP/LP specific work `wi` in kJ/kg, losses `lo` and `kq`), `anTbW()`, `anTbGen(ms, qip)`. Generator line: `MWss = anTbGen(U.ms, qip) - anVacMW(U) + dMWx`, with `qip = U.m0 * U.rr * tb.icv`.
- Removed the trend fit (`c`, `mwK`, `cIP 0.75`, `nlMW 1.5`).
- Source: MHPS heat balance PPE-13-0106 Rev.2 (Limay Phase I, contract XZ-DPC566) = PPE-14-0725 R1 (Phase II), number by number. 16 cases on the PC in `Documents\hb-extract\hb_cases.txt`.
- Check: hold150 gives 151 MW at 460 t/h (HB: 150 MW at 458.3 t/h). Plant gate: heater_mw, vacuum_mw, load_ramp pass; unit_load, unit_trip, engine_units fail the same lines as on main.
- Note: the FHI "RH 181.9 T/H" is a unit slip (400,944 lb/h read as kg/h); the true RH flow is about 401 t/h.
- Open: heater-out MW dhX (HB gives 755 kJ/kg at No.6 out, the model uses 1160); 1st stage pressure curve (Davao thermal kit 005 p3: 100 / 200 / 300 / 400 / 440 / 472 t/h = 21.7 / 44.0 / 67.0 / 90.1 / 100 / 108.3 ata).

## 3. The transfer events (11/9 and 10/3)

Event data from the plant (alarm history, trend photos) is private: see `/mnt/project-files/turnover/sakura/SAKURA_TURBINE_full.md` and the scenario file there.
In short: at the ICV to CV transfer the CVs read open, ABC-050 closed the HP bypass on CV position > 2 % (as drawn), but no steam passed the HP turbine, so the boiler lost its outlet and the reheater drained. The 1st stage pressure separates the suspects: about 0 = MSV, CV disc or MSV strainer; high with high HP exhaust = cold reheat NRV not open. Waiting for the user's trend. No change to ABC-050 without engineering / MHPS approval.

## 4. Sources

TG O&M package (MHPS maintenance manual), TCS IBD TC-17 / TC-19, TCS Modbus list, MHPS 503 / 505. Page-level list in the private full file.

## 5. Blocked

- App replay of the transfer: cold start stops at step 71 (drum LL MFT, owner Chaewon), hot start at step 57, old save at step 81. When a start-up reaches sync, replay: post-sync save, IP start, load up through the transfer, log CV / ICV position, HP bypass MV, RHP, 1st stage, MW every second.

## 6. Next, in order

1. Read the user's trends (section 3) and give one answer.
2. Trace the TC-19 and TC-17 gates.
3. Check the teaching page on the user's phone; fix what the user names.
4. If the cause is a TCS curve, ask MHPS for the TCE212 CV lift vs flow.

## 7. Decisions log (user's own words, PHT)

Only decisions on my work, with the user's words as written. Project-wide rules are in `CLAUDE.md` and project memory; the whole conversation is in the SAKURA : TURBINE thread.

- 2026-11-10 7:05 PM: SOP vs TCS drawing for the 3600 rpm soak and the initial load hold. After my answer "follow the TCS drawing": "Yun nmn pla e". Decision: the TCS drawing (ATS sheet 23 Fig. 2, sheet 26 Fig. 3) is followed.
- 2026-11-10 night (overnight mode, team decision, no user words): warm-up heating rate 60 C/h from PR-OPE-5002, passed to Jennie. Superseded by the user rule of 2026-11-14 8:16 AM (no SOP as model basis).
- 2026-11-13 11:42 PM: "NO PATCHES": every model fix must be real physics, never a clamp or a curve fit. Applied: the MW trend fit was replaced by the heat balance (beta.260).
- 2026-11-14 8:16 AM: one whole physics plant; manuals and design docs only; HMI snapshots, trends, SOP and FHI start-up curves are not a basis or a check.
- 2026-11-14 9:38 PM: Units 1 to 4 are identical (only tags differ); the turbine is MHPS; PPE-14-0725 is the Unit 1 heat balance.
- 2026-11-15: on the 11/9 event: "Cge nga imbestigahan nio", "Kaya nio isimulate ung nangyari pra mapin point ntn ano naging problema?", "Specific kasi tlga na sa transfer operation sya nangyayari e. Worst case. Dropped to zero ang RHP at MS FLOW". The alarm history is an event to explain and a scenario to reproduce, not a tuning basis.
- 2026-11-15: on 10/3: "Nagmanual trip kmi dito kasi first time mangyari ito pra matest ang CV A. Pero pasok naman sya sa manual stroking namin, calibration, within standard." Then: "Yung CV A kasi makikita mo ang lift nya sa actual e. May metro doon..", "Oo meron lahat local indicator at lahat may kanya2 na lift".
- 2026-11-15 7:29 PM: "So ano ba. Wala akong maintindihan. May bagong suspect nanaman ba". Rule taken: one consolidated answer per message, no drip of suspects.
- 2026-11-15 7:31 PM: "Ituro mo nga sakin ang hp ip turbine namin, yung parts nito ... Kahit 2d lang. Tapos yung in depth details s explanation ng operation ng mga control valves." 7:45 PM on v2: "Ang pangit. Masyado rin simple. Marami wala." Result: v3 / v4 traced from the MHPS section drawings.
- 2026-11-15 8:37 PM: "Hndi pwede ngayon na?" Turnover started at once (this file).

## 8. Where the private files are

Plant event data, OEM-based pages, screenshots and the PDF / HTML copies are NOT in this repo (it may be public). They are in project files `/mnt/project-files/turnover/sakura/`:
- `SAKURA_TURBINE_full.md`, `.html`, `.pdf`: this file plus the event details.
- `turbine-page-v4.html`: the teaching page (artifact https://claude.ai/artifact/NRX6XetGGHB3XWh69oZqz8).
- `SCENARIO_2026-11-09_ICV_CV_TRANSFER_RH_LOSS.md`: the event notes.
- `files/`: screenshots and notes from this thread (c4 electrical, roll / initial load, trips since beta.180, NO-SOURCE lists).
