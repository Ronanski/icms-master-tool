# Roll, sync at load: app laban sa PR-OPE-5002 at sa ATS drawings (plan c3, 3.2.3-beta.27)

Sinuri 2026-11-10 (thread "Build turbine roll, sync and generator"). Sources: PR-OPE-5002-02 (start-up, sections ROLLING, ACCELERATION, SYNCHRONIZATION, INITIAL LOAD, LOAD UP), ATS Sequence 310SC90-775 (sheets 22, 23, 25, 26, 27), ATS Criteria 310SC90-776, IBD 310SC90-794 (TD-1, TD-4). App: `src/analog/engine/tcs.js` (TCS table, tcsCrit, step switch), `src/analog/engine/unit.js` (rollRate, MWinit, MWxf, MWperm, rateUp), `src/analog/engine/tcs-gen.js`.

Tatlong klase lang (CLAUDE.md rule 5): (a) bug, naayos; (b) tama, may ebidensya; (c) hindi mabasa, may pangalan ng bahagi. "UNUSUAL" = magkaiba ang dalawang source, ang user ang magpapasya.

## Roll at acceleration
1. Acceleration rate 120 / 120 / 120 / 180 / 360 rpm/min (ambient cold, cold 1, cold 2, warm, hot): (b) ATS sheet 22 note *1 at PR-OPE-5002 table.
2. Heat soak 1800 rpm 88 / 58 / 30 / 0 / 0 min: (b) PR-OPE-5002 table at ATS Fig. 1.
3. Heat soak 3600 rpm: app 86 / 56 / 27 / 23 / 3 min = ATS sheet 23 FIGURE 2 (3600 rpm HEAT SOAK TIMER, break points 150 / 170 / 230 / 420 C). PR-OPE-5002 table: 86 / 55 / 25 / 22 / 0. **UNUSUAL**: iniwan ang app sa drawing ng TCS (ang logic ng TCS mismo); ang SOP ay buod ng operator. **Pasya ng user (2026-11-10 7:05 PM PHT): sundin ang TCS drawing.**
4. Critical zone 1372 ~ 1723 rpm, walang hold: (b) PR-OPE-5002.
5. Pagkatapos ng 1800 rpm soak: HP first stage inner wall > 170 C at shell expansion > 3 mm: (b) PR-OPE-5002; IBD TD-4 ZE-ST1001 NORMAL ON >= 3 mm (criterion 2.1). Ang TD-4 ay nakakabit na sa c.sexp (3.2.3-beta.27).
6. Rub check: 200 rpm, tapos kapag < 100 rpm: (b) PR-OPE-5002 at ATS criteria Fig. 1.
7. Rolling steam: MS 60 kg/cm2 / 400 C, RH 415 C (cold), warm 81.6, hot 110 / 455 / 485 C: (b) PR-OPE-5002. RH pressure "not low" 7.0 sa app laban sa 7.5 ~ 8.5 ng SOP: dati nang nakasulat sa tcs.js (beta.38, ang LP bypass SV 7.6 ay umiikot sa 7.5).

## Bago mag-synchronize
8. LP exhaust hood <= 80 C (criterion 1.12, IBD TD alarm ON 80 / OFF 77): (b).
9. Bearing oil temperature: PR-OPE-5002 "bearing oil at least 40 C until synchronized, lube oil set point 46 C at rated speed". **(a) bug, naayos sa beta.27**: ang criterion 1.16 BEARING OIL TEMP. OK ay dating bumabasa ng oil pressure (may tumatakbong pump). Ngayon ay ang IBD TD-1 (page 84) na: lube oil cooler outlet 27 ~ 40 C sa turning gear, 27 ~ 50 C habang umiikot, 40 ~ 50 C sa rated speed (pagkatapos ng 60 s). Sinubok sa app (Cold, 3600 rpm): 30 C sa turning gear OK; 33.6 C sa 30 s ng rated OK (wala pang 60 s); 45.6 C pagkatapos ng 5 min OK. Sa pagitan (oil < 40 C pagkalipas ng 60 s) ay may maikling hold na "CRITERIA B3: 1.16", gaya ng SOP.
10. Excitation sa rated speed (41 close kapag >= 3550 rpm, 13.8 kV): (b) IBD TD-1 RATED SPEED ON 3550 / OFF 3540, ATS sheet 24.
11. Synchronizing: ASD, 52G close kapag 41 sarado, may voltage, 52L sarado: (b) PR-OPE-5002 Option 1 / 2, ATS sheet 25. Ang 52L ay laging sarado sa app (c4 pa).

## Initial load at load up
12. Initial load 3 % (4.5 MW) ambient cold ~ warm, 5 % (7.5 MW) hot: (b) ATS sheet 26 *2 at PR-OPE-5002.
13. Initial load hold: app 40 / 15 / 0 min = ATS sheet 26 FIGURE 3 (40 min hanggang 230 C, 15 min hanggang 420 C). PR-OPE-5002: 45 min (cold, warm) at may linyang "Warm 15 mins instead of 45". **UNUSUAL**: iniwan sa drawing ng TCS. **Pasya ng user (2026-11-10 7:05 PM PHT): sundin ang TCS drawing.**
14. Hood < 52 C bago LOAD UP: (b) PR-OPE-5002 (naayos sa 3.2.1 plan c3).
15. Load up rate 5 %/min = 7.5 MW/min: (b) ATS sheet 27 *2, PR-OPE-5002.
16. ICV -> CV transfer sa 20 MW: (b) PR-OPE-5002 "until HP & LP bypass valve is fully closed or reaches to 20 MW". Sa app ang pangalawang kondisyon ay "ICV full open", hindi "HP at LP bypass sarado": (c) ang logic ng transfer ay nasa TCS (ATS sheet 27 "LOAD UP START (ICV TO CV TRANSFER)" ay communication link lang, walang detalye).
17. NORMAL OPERATION sa 45 MW (30 %): (b) PR-OPE-5002; LOAD UP ng app ay tapos sa >= 44 MW.
18. CCS (DCS control mode) "> 90 MW we can set CCS" (PR-OPE-5002): ang permissive I.0081 ng app ay nasa 45 MW (unit.js MWperm, ASSUMED). Hindi ito logic limit sa SOP kundi gawain ng operator; walang binago.

## Hindi pa nasa app (c, walang value sa docs ng repo)
- Thermal stress limits ng ATS sheet 27 (*1 table: HP / IP MPa bawat mode) at ang 200 min na delay sa NORMAL OPERATION: walang stress model.
- "Load cannot be decreased after transfer, CV may fully close": hindi minodelo.
