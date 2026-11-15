# Turnover: SAKURA : TURBINE

Written 2026-11-15 8:45 PM PHT, before the weekly usage limit. Thread: SAKURA : TURBINE (owner of the turbine model in `src/analog/engine/unit.js` and of turbine questions). Read `CLAUDE.md`, `HANDOFF.md` and `PROJECT_RULES.md` first; this file only adds what the turbine owner knows.

## 1. Status in one look

- Turbine MW model: from the MHPS heat balance enthalpy drops (beta.260, merged, PR 708). Done.
- 2026-11-09 ICV to CV transfer event (MS flow and RH pressure to 0): explained up to one open question; waiting for the user's trend (planned 2026-11-16 at work).
- 2026-10-03 event (same transfer, earlier): read from the user's photos; same pattern.
- Teaching page "HP-IP Turbine at Control Valves": v4 live, https://claude.ai/artifact/NRX6XetGGHB3XWh69oZqz8. Not yet checked on the user's phone.
  The HTML copy is kept in project files (`tutor-2026-11-11/turbine-page-v4.html`), not in this public repo, because it traces MHPS drawings.
- App replay of the transfer: blocked (no start-up reaches sync in the app; see section 5).

## 2. Turbine MW model (beta.260)

- `src/analog/engine/unit.js`: `AN_TBW` (main steam flow points 150 ~ 472 t/h, HP specific work `wh` and IP/LP specific work `wi` in kJ/kg, losses `lo` and `kq`), `anTbW()`, `anTbGen(ms, qip)`. Generator line: `MWss = anTbGen(U.ms, qip) - anVacMW(U) + dMWx`, with `qip = U.m0 * U.rr * tb.icv`.
- Removed the trend fit (`c`, `mwK`, `cIP 0.75`, `nlMW 1.5`).
- Source: MHPS heat balance PPE-13-0106 Rev.2 (Limay Phase I, contract XZ-DPC566) = PPE-14-0725 R1 (Phase II), number by number. 16 cases on the PC in `Documents\hb-extract\hb_cases.txt`.
- Check: hold150 gives 151 MW at 460 t/h (HB: 150 MW at 458.3 t/h). Plant gate: heater_mw, vacuum_mw, load_ramp pass; unit_load, unit_trip, engine_units fail the same lines as on main.
- Note: the FHI "RH 181.9 T/H" is a unit slip (400,944 lb/h read as kg/h); the true RH flow is about 401 t/h.
- Open: heater-out MW dhX (HB gives 755 kJ/kg at No.6 out, the model uses 1160); 1st stage pressure curve (Davao thermal kit 005 p3: 100 / 200 / 300 / 400 / 440 / 472 t/h = 21.7 / 44.0 / 67.0 / 90.1 / 100 / 108.3 ata).

## 3. The transfer events (11/9 and 10/3)

Full notes: `/mnt/project-files/trip-audit/SCENARIO_2026-11-09_ICV_CV_TRANSFER_RH_LOSS.md` (event list, logic, NO-SOURCE items, stop note).

What is known:
- ABC-050: HP bypass closes when CV(A) or CV(B) position > 2 % (M.070C) and GCB closed, through TPS 2 s and RATE 5 %/s (about 14 s from 69 %). This is as drawn. It reads CV position, not steam flow.
- 11/9: CV crack 8:50:47, HP bypass closed 8:50:59, "Cold reheat NRV open" 8:50:54, 1st stage 0.6 and HP exhaust 0.4 kg/cm2 after the CVs opened, HRH 0.0 at 8:52:24.
- 10/3 (photos, trend 192.STN104): CV(A) 9 to 20 %, CV(B) 0 to 13 %; HP bypass 60 to 1 %; MS flow 120 to 28 to 0 t/h while MSP rose 82 to about 127; HRH to 0.6; MW 3 ~ 7. Manual trip at about 11:02. The user says CV(A) passed stroking and calibration and has a local lift indicator; all valves have local indicators.

Reading (told to the user):
- The CVs read open but no steam passed the HP turbine. The bypass closed on position, so the boiler lost its outlet and the reheater drained through the full-open ICVs.
- The 1st stage pressure separates the suspects:
  - about 0: steam did not reach the HP. MSV not open, CV disc not following the stem, or a blocked MSV strainer (14 mesh, MAINT p470 ~ 476; usually blocks slowly).
  - high, with high HP exhaust pressure: steam entered but had no outlet. Cold reheat NRV not open (logic IBD TC-19 p73 can hold it closed).
- 11/9: NRV opened and 1st stage was 0.6, so it is not the NRV.
- 10/3: no 1st stage data yet; both are still open.
- CV(B) has no pilot (MAINT p565); a CV(A) pilot-only fault still passes some flow, so it cannot explain a flow of 0.
- Recommendation given: no change to ABC-050 without engineering / MHPS approval.

Trend asked from the user (10/3 10:10 ~ 11:05 and 11/9 8:45 ~ 9:00): 1st stage PT-ST1001, HP exhaust PT-CR1901, MSV position ZT-ST1903, CV position ZT-ST1904 and CV POS DEMAND TCE212_A1/A2, NRV ZSC-CR1901, ventilator ZSC/ZSO-CR1902, FLOW DEMAND, MSP, MSF, MW.

## 4. Sources found (on the user's PC, not in the repo)

- TG maintenance manual `document-references/o&m-package-phase-1/L2 TG/tg-2-1-2-maintenance.pdf` (2160 pages, Davao copy XZ-DPC551, same MHPS 150 MW design). Key pages: p66 outline 310PB64-391, p67 cross-section 310PB65-413 (26 parts; HP stages 1 ~ 11, IP 12 ~ 21, LP 22 ~ 24; bearing spans 1717 / 5555 / 1600 mm), p68 clearances, p72 ~ 79 control mechanism 310SD14-354, p84 steam P&ID 310PB61-986, p85 gland 310PB61-987, p470 ~ 477 valves description, p522 MSV section, p526 ~ 531 CV, p803 ~ 852 combined reheat valve, p853 ~ 872 emergency trip device.
- TCS IBD 310SC90-794: TC-17 ventilator valve, TC-19 cold reheat NRV (p73). Gates not traced yet.
- TCS Modbus point list (in the app: Library > All signals): MSV ZT-ST1903, CV ZT-ST1904, RSV / ICV ZT-ST1905, 1st stage PT-ST1001, HP exhaust PT-CR1901, master trip solenoid ZS-ST1001.
- MHPS 503 (IP start-up curves: transfer flow = load + 3 ~ 5 %, RH falls to about 3 ata, not 0), 505 (valve chart, conceptual).
- NO-SOURCE: CV lift vs flow curve (TCE212 PARA-LIST), Part 8 turbine drain description ("Later").

## 5. Blocked

- App replay of the transfer: cold start stops at step 71 (drum LL MFT, owner Chaewon), hot start at step 57, old save at step 81. When a start-up reaches sync, replay: post-sync save, IP start, load up through the transfer, log CV / ICV position, HP bypass MV, RHP, 1st stage, MW every second.

## 6. Next, in order

1. Read the user's trends (section 3) and give one answer.
2. Trace the TC-19 and TC-17 gates.
3. Check the teaching page on the user's phone; fix what the user names.
4. If the cause is a TCS curve, ask MHPS for the TCE212 CV lift vs flow.
