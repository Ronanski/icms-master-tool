---
title: "Turnover: CHAEWON : BOILER (drum level, feedwater, start-up valve, e5 boiler faults)"
date: "2026-11-15 PHT"
---

# 1. Goal ng thread

Ang drum level, ang feedwater at ang start-up valve (LICBR1001B / FCV-FW1130-2) ay dapat tama sa plant model, mula Cold hanggang 150 MW, sa Hot / Warm restart at sa Normal shutdown, nang walang MFT na hindi galing sa physics o sa drawing. Kasama rin ang e5 boiler faults (inaasahang resulta ng bawat fault).

Owner ayon sa merge gate (2026-11-13): drum / FW / start-up valve = CHAEWON.

# 2. Estado ngayon (2026-11-15 9:00 PM PHT)

- **Main:** 3.2.3-beta.260 (SAKURA). Walang bukas na PR ang thread na ito.
- **Branch:** `claude/project-thread-t280kl`, commit `de0e4da8`, naka-push. Ito ay main 260 + ang dagdag sa `tests/plant_runs/gate.cjs` (`--save-at`, `--save`, `--from`). **HINDI pa nasubok ang dagdag na iyon.**
- Tinanggal ko sa branch ang mga lumang drum helper sa Training guide (fwSeek, CBD close sa restart). Ayon ito sa utos ng user noong 2026-11-13 na physics ang batayan, hindi ang SOP o ang guide. Nasa commit `6c005b1b` pa rin sila kung kailangan basahin.
- **Walang merge nang walang GO ng user** (coordinator, 2026-11-15).

# 3. Mga utos ng user (petsa sa PHT, sariling salita)

- 2026-11-04 11:06 PM: ang team ang nagrerekomenda, ang user ang nagpapasya (CLAUDE.md COMMANDMENT 2).
- 2026-11-06: "Db wala go beta". Ang Beta ay merge kapag pasado ang Checks (COMMANDMENT 3). Ang STABLE ay sa "GO STABLE" lang.
- 2026-11-11 6:07 AM: "Puro assumed ha. Bawal yan." Bawat value ay may doc at page, o CALC. Kung wala: NO-SOURCE.
- 2026-11-11 6:45 AM: huwag humingi ng source sa user. Hanapin sa lahat ng doc sa PC.
- 2026-11-13, mga 3:50 PM (galing kay Jennie, "hnd n ata matapos"): bago ang bawat Beta merge, `npm run build; node tests/plant_runs/gate.cjs cold,hot,warm,shutdown`, Worker mode, walang MFT, at 4 na PASS line sa PR body.
- 2026-11-13 6:50 PM: "Bkt kelangan ang test ay lagi nagstart sa full cold run?"
- 2026-11-13 6:51 PM: "Ano ba nagiging sistema niyo ha. Tigil nga muna ang tester at plant model makers." (STOP)
- 2026-11-13 7:14 PM: "Hindi bubuksan ang blowdown sa restart? Bkt b kc binubuksan? Ano b ung s procedure? Wala b kyong checklist bago magstart?"
- 2026-11-13 7:36 PM: "Wala naman dapat training guide yan e. Dapat ma start yan based sa kung paano yan istart tlga without relying sa sop ng planta. ... Ang nangyari, binase niyo lahat ng mga ginagawa niyo sa sop. Napakalaking pagkakamali."
  Ibig sabihin: ang plant model ay physics, DCS logic, drawings at design data. Hindi SOP, hindi guide step, at walang "Do it" bilang fix.

# 4. Nagawa (merged sa main)

Mga PR ng thread na ito (lahat merged). Ang detalye ay nasa `docs/versions/v3.2.3/UPDATE_REPORT.md`.

- beta.37 (PR 496): flow ng start-up valve FCV-FW1130-2 mula sa valve sheet (Cv, dP), K1AU3-E2-0-123 p147.
- beta.38 (PR 497): thermal expansion ng boiler water. Volume 147 m3 = 252 m3 (hydro test K1AU3-R3-0-101 R0 p6) − drum 29 m3 (K1AU3D-101) − SH 75.8 m3 (FHI P2 S8 Tab 2 p 2-8-TAB_2-1).
- beta.40 / 47 (PR 499, 500): MBD MV-BD1001 at CBD MV-BD1002 bilang choked flashing flow. Bore 45 mm mula sa KOSO MA5ES3P1425a-01 p24. CBD design 15 T/H, MB-019 item 22 (mass balance K1AU3-A2-0-001, PDF p11).
- beta.78 ~ 138, 162, 173, 177, 182, 187: maraming ayos sa Training guide (oil, heating rate, drum sa warm-up). **Karamihan ay guide / SOP-based. Ayon sa utos ng 2026-11-13 7:36 PM, dapat itong suriin muli.**
- beta.182 (PR 624): ON ang thermal swell / shrink (AN_THERM).
- beta.190 (PR 633): alarm line ng drum level transmitter deviation (ABC-010 B.0804).
- beta.193 (PR 636): fault na "Furnace pressure transmitter A (PT-FG1085) signal lost / over range" (AI0132).

# 5. e5 boiler faults (`/mnt/project-files/e5-boiler-faults/EXPECTED.md`)

- Case 6, SA fan trip: tama ang app. Ang listahan ang inayos.
  - MFT agad (DITL-03A row 3 SAF STOPPED).
  - Ang furnace pressure ay −20 → mga −107 mmH2O lang, kaya LOW alarm lang (< −50).
  - Hindi naaabot ang PSLL −267 (plantsw.js, alarm list), kaya tumatakbo pa ang ID fan (DITL-03D: MFT AND PSLL).
- Case 10, PT-MS1002 signal lost: tama ang app ayon sa drawing (verdict b).
  - ABC-001C: ang steam flow compensation ay SQRT(LN31(AI0131) x LN32(AI0420) x AI0129) at walang SIG.AB hold.
  - Ang B.0643 ay pumupunta lang sa M.2013 / M.2016 (masters to MAN).
  - Ang ABC-010 force-MAN M.022E ay walang B.0643.
  - Operator: ilipat agad (< 30 s) ang feedwater sa MAN at itaas ang FW hanggang kapantay ng steam (475 ~ 500 T/H). Ito ay mula sa retest ni Mina.
- Case 9, IA loss: verdict b. Ang FCV-FW1130-1 ay "Fail in Place" (K1AU3-E2-0-123).

# 6. Bukas na isyu (pinakamahalaga muna)

1. **MFT sa drum LOW-LOW, Cold step 71, bago ang sync (main 259 at 260, gate ni Sakura).** Hindi ko pa ito na-reproduce sa 260. Ang dalawang run ko noong 2026-11-15 ay namatay sa step 29 dahil nag-restart ang container.
   - Lumang ebidensya (2026-11-13, Cold step 73 sa 195): level +190 → −89 mm sa 4 plant min. Ang steam ay 9 → 80 T/H habang ang FW ay 0 → 11 T/H lang, at ang LICBR1001B AUTO MV ay 1 → 28 %.
   - Ang kakulangan na mga 70 T/H x 4 min = mga 4.7 t, sa mga 16.5 kg/mm (20.6 m2 x rho sa 250 C), ay mga −280 mm. Tugma ito sa nakita, kaya ang mass balance mismo ay consistent.
   - Ang tanong ay physics: bakit biglang 80 T/H ang steam palabas, at tama ba ang bilis ng start-up valve at ng PID (parameter list)?
2. **NAKITA (model bug, kumpirmado 2026-11-15, HINDI pa naayos): patay ang drum shrink / swell ng pressure.**
   - Sa `src/analog/engine/plant.js`, hinahanap ng `pr.integ.pd` ang AI0128 (drum pressure) sa ABC-001C. Wala ito roon, kaya `pd = −1`.
   - Dahil dito, hindi kailanman nakukuwenta ang `q.sw` (ks 10 mm per kg/cm2, tauS 60 s).
   - Probe sa 150 MW: `{"pd":-1,"ks":10}` at walang `sw`.
   - Ang drain code sa itaas nito ay gumagamit na ng plant pressure AN_UNIT.Pd. Ang tamang ayos ay malamang ang parehong source, pero kailangan munang patunayan ang ks / tauS (NO-SOURCE ang riser transit time, tingnan ang komento roon).
3. **Hot restart natigil sa step 57 (main 259 at 260).**
   - Pahiwatig mula sa run ko sa 260: sa step 23 ~ 29, wala pang apoy at walang FW, pero tumaas ang drum +516 → +544 mm at ang MSP 117 → 118.6 kg/cm2.
   - Mainit pa ang bed, kaya umiinit ang tubig at lumalaki (thermal expansion). Kailangang suriin kung tama ang init na pumapasok mula sa bed at refractory.
4. **Shutdown step 134 "Fill the drum to +200 mm": ang level ay eksaktong 0 mm nang 300 plant min** (FW 13 ~ 15 T/H, LICBR1001B MAN 20 %, steam 0). Galing ito kay Jennie (PR 640), at hindi ko pa nasuri.
   - Hypothesis (HINDI napatunayan): tumigil ang level integrator, kaya bumalik ang AI sa value ng snapshot na 0.0 (hmi-op.js AI0130 0.0).
5. **Relay reset bug sa DITL (tinanggal sa branch, nasa commit `6c005b1b` `src/world/ditl150.js`).**
   - Ang PAF LOP B at DOP A ay kusang tumatakbo ulit pagkatapos ng relay RESET. Dahilan: hindi nabubura ang field bit ng 150 MW load.
   - Logic bug ito, hindi SOP. Pumasa ang ditl150, alarm_150, fa_standby_150, bfwp_motor_ccw at fans noong 2026-11-13. Hindi pa merged.
6. **Drum mass at energy audit (task ni Jennie, 2026-11-13): hindi pa nasimulan.**
   - Inputs: drum water 32 t (as-built), start-up valve K1AU3-E2-0-123, BFWP curve, swell / shrink, CBD 15 T/H (MB-019).
7. **Ang `gate.cjs --save-at / --from` (sagot sa tanong ng user tungkol sa full Cold run): naisulat pero HINDI pa nasubok.**

# 7. Susunod na gagawin

1. Patakbuhin ang Cold sa main 260 nang may `--trace 60` at `--save-at 62`, isang heavy run lang bawat oras. Kunin ang drum, FW, steam at valve bawat plant minute hanggang sa LL.
2. Subukin muna ang save / from (save sa step 62, tapos `--from`) para hindi na kailangang magsimula sa Cold bawat subok.
3. Ayusin ang shrink / swell (isyu 2) gamit ang design data at CALC, at patunayan mula sa save point.
4. Suriin ang init ng tubig sa Hot restart bago ang apoy (isyu 3).
5. Shutdown step 134 (isyu 4).
6. Buong gate (cold, hot, warm, shutdown) bago ang PR. Kausapin si JENNIE bago mag-merge (siya ang may Beta 261). **Walang merge nang walang GO ng user.**

# 8. Saan hahanapin at ano ang babasahin

- Basahin muna: `CLAUDE.md`, `HANDOFF.md`, `PROJECT_RULES.md`, `docs/SPEC.md`.
- Drum code: `src/analog/engine/plant.js`
  - integrating level: `pr.integ`, mga line 764 ~ 1030
  - kg per mm: `AN_CYC.kgmm`
  - flashing flux: `AN_BDG`
  - thermal expansion: `AN_THERM`
- Start-up valve at unit model: `src/analog/engine/unit.js` (anSuFw, AN_UNIT.ms / mb / Pd / Tw).
- Gate: `tests/plant_runs/gate.cjs`.
- e5 faults: `/mnt/project-files/e5-boiler-faults/EXPECTED.md` (cases 1 ~ 10) at `src/analog/engine/faults.js`.
- Design docs (nasa PC lang at sa private plant documents repo): K1AU3-E2-0-123 valve sheets, K1AU3-A2-0-001 mass balance (MB-019 p11), K1AU3D-101 drum, K1AU3-R3-0-101 hydro test, FHI boiler manual Part 2 Sect 7 / 8, KOSO MA5ES3P1425a-01, ABC-001C / ABC-010 / DITL-03A / 03D / 38 drawings.
- Ang mga probe script ko ay nasa scratchpad ng session. **Mawawala ang mga ito**, kaya ang mahalagang resulta ay nakasulat na rito.
