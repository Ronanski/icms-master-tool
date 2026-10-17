# Roadmap: hanggang "TAPOS ANG PROJECT" (user, 2026-10-16)

**Kahulugan ng TAPOS** (mula sa user: "Startup, Shutdown, Normal operation, Load up / load down, Trip"):
- Sa app, kaya ng operator na patakbuhin ang 5 plant scenario sa RUN mode, ayon sa drawing (ABC + DITL) at sa procedure ng planta (PR-OPE-5002 / 5003 / 5004).
- Tama ang tugon ng PV, MV, mode (A / M / R), interlock at trip.
- Naka-Stable na ito at nasubok sa tablet / apk / exe.

Prayoridad: ABC (analog) muna. Ang DITL ay i-force / i-simulate kung kailangan (utos ng user, 2026-10-16). Ang detalye ng bawat gawain ay nasa `docs/CHECKLIST.md`.

Bawat milestone ay may **pasado kung**: ang masusukat na resulta na nagsasabing tapos na ito. Walang milestone na "tapos" kung hindi pa pasado.

| # | Milestone | Laman (CHECKLIST) | Pasado kung | Laki |
|---|---|---|---|---|
| M0 | **v2.2.0 Stable** | Ang 2.2.0-beta.1 ~ 6 na nasa Beta na | Nasubok mo sa tablet; GO STABLE | maliit (nasa iyo) |
| M1 | **ABC malinis** | A1 switches, A2 snapshot mismatch, A6 mahirap na controller | switches 0 / 438 fail; Start at 150 MW: ≤ 5 tag na lumalayo nang > 5 % sa snapshot, bawat isa may paliwanag mula sa drawing; lahat ng regression pasado | katamtaman |
| M2 | **Normal operation + Load up / down** | A3 boiler / turbine physics | Mula 150 MW pababa sa 60 MW at pabalik: ang MW, main steam pressure / flow, FW flow, drum level at temperatura ay sumusunod; sa 60 MW tugma sa 02.png at sa 150 MW tugma sa 4.PNG (± 5 %); walang trip | malaki |
| M3 | **Trip** | A4 cluster scenario (bahagi: MFT, BFWP, fan trip), A5 audit | Bawat trip ng drawing (MFT, BFWP trip, fan trip, turbine trip, drum level LL / HH, main steam pressure LL) ay nagbibigay ng tamang force manual / runback / interlock sa ABC; may test ang bawat isa | malaki |
| M4 | **Startup** | A4 / A5 (ibang cluster), procedure PR-OPE-5002 | Mula cold: purge → light-off → pressure raise → roll → sync → 150 MW, ayon sa mga hakbang ng procedure; ang mga DITL permissive na kailangan ay naka-force o simulated; may marka bawat hakbang | pinakamalaki |
| M5 | **Shutdown** | procedure PR-OPE-5003 / 5004 | Normal shutdown at shutdown to bottle-up ayon sa procedure, hanggang zero load / bottle-up; may marka bawat hakbang | malaki |
| M6 | **v3.0.0 Stable = TAPOS ANG PROJECT** | A7 ~ A11 (tester, UAT, UI na maliliit), docs | Lahat ng M1 ~ M5 pasado; UAT ng 5 scenario nasa app; nasubok mo sa tablet; GO STABLE | katamtaman |

Pagkatapos ng M6: ang `[F]` sa CHECKLIST seksyon D ay dagdag lang, hindi kailangan para matapos ang project. Kasama rito ang "Bakit?", permissive checklist, tuning lab, compare, at buong DITL plant state.

## Nasaan tayo ngayon (2026-10-16)
- **M0:** nilaktawan muna (user 2026-10-16: "no need n m0").
- **M1:** 2.2.0-beta.7: switches 0 / 438 (pasado). 150 MW snapshot 27 → 11 (ang hangganan ay ≤ 5: hindi pa pasado sa bilang; bawat isa sa 11 ay may paliwanag mula sa drawing / physics, 4 dito ay ang snapshot na hindi steady o magkasalungat na screen). A6 (2.2.0-beta.8): TAPOS. Generic tester: 68 controller, 0 mali, 0 hindi nasubok (ang mahihirap ay nasa planta na tumatakbo; RH spray + damper nagdadagdag). Natitira sa M1: ang hangganan na ≤ 5 sa snapshot (11 pa; user 2026-10-16: huwag umasa nang buo sa HMI snapshot, sundin ang plant physics). Ang hatol kung pasado ang M1 ay sa user.
- **M2 (2.2.0-beta.9, ginagawa):** unit model (boiler + turbine). Pasado: 150 → 60 → 150 MW, ang MW, MSP, MSF, FW, drum level ay sumusunod; sa 60 MW ang MW / MSF / coal ay nasa ±4 % ng 02.png; sa 150 MW nasa ±1 % ng 4.PNG; walang trip (`tests/regress/unit_load.js`); regression: generic 68 / 0 mali, scenarios 244 / 0, switches 0 / 438, reset 51 / 0. Natitira sa M2: temperatura (MST / RHT) ayon sa load (02.png 517 / 499 °C), RH pressure.
- **M3 ~ M6:** hindi pa nasisimulan.

## Susunod na aayusin (napagkasunduan, user 2026-10-17)
Walang bagong mode: ang plant physics ay tumatakbo sa loob ng app pagkatapos ng Start at 150 MW (at sa start-up sa M4). Ang turbine ay "black box" lang (interface ng TCS sa I/O list at drawing), hindi ang loob ng TCS (wala sa repo). Ang mga numero ay galing na sa `boiler-cfb-design-operation-manual.zip` at `fan-instruction-manual-SAF-PAF-IDF.pdf` (dati: ipinalagay).
0. **BU-CMD = protection (SINIMULAN, hindi pa tapos; patch: `docs/versions/v2.2.0/beta10-bu-cmd-latch.wip.patch`):** ang MAN station na na-force ng BU-CMD (HIC-BM M.2013, EIC-TM M.2016 at iba pa) → MANUAL (`.MAN` = 1), hawak ang MV, at NANANATILING MANUAL hanggang ang operator ang mag-AUTO (pag-off ng MAN sa faceplate). Habang may BU-CMD, tinatanggihan ang AUTO (user 2026-10-17). Ngayon (beta.9) ay kusang bumabalik sa AUTO.
   - Ang patch: (a) `plant.js` MAN station: `ast.al = 'A'` sa A/M switch na may BU-CMD (para gumana ang latch ng AMT), `.MAN` = 1 sa pagpasok, operator MAN off = AUTO kapag wala na ang BU-CMD, operator MAN on = MANUAL; (b) `hmi-op.js`: sa Start at 150 MW, ibinabalik sa AUTO ang MAN station na na-latch habang naglo-load (maliban sa M sa snapshot o may BU-CMD pa); (c) `unit_load.js`: ang operator ang nagpa-AUTO sa HIC-BM at EIC-TM sa itaas ng 230 T/H.
   - **Bakit hindi pa na-push:** sa Start at 150 MW, ang feeder A / B / C ay 26.5 / 38.2 / 38.2 T/H (snapshot 29) sa sandaling magsimula ang unit model, kaya mali ang anchor ng coal (F0 = 103 T/H sa 474 T/H): bumababa ang pressure, umaakyat ang BM sa 92 %, ang coal master ay na-force manual sa itaas, at bumagsak ang M2 test (10 FAIL). Ang sanhi: ang FIC-CF / feeder ay nag-track habang naka-MANUAL (tama sa drawing), at ang pagbabalik sa AUTO ay ginawa bago naitakda ulit ang output ng mga PID ayon sa snapshot. **Susunod:** ilagay ang pagbabalik sa AUTO at ang `hmiPidSet` ng FIC-CF / FIC-CM bago ang anchor ng unit model, o kunin ang F0 mula sa snapshot (11.png 29.0 / 29.1 / 28.9) sa halip na sa transmitter sa sandaling iyon; patakbuhin ulit ang `unit_load.js`, switches, reset, hmi_op at generic tester.
1. **Reheat pressure** ayon sa steam flow (design: RH 181.9 T/H, 36.6 → 35.1 kg/cm2 sa MCR). M2.
2. **Temperatura SH / RH** ayon sa load (curve "SH & RH steam temperature versus load", "SH spray versus load"). M2.
3. **Hangin at flue gas**: air flow ("air flow vs load", fan curves), O2 ("O2 vs load"), furnace pressure (FD vs ID fan). Dulo ng M2 / simula ng M3.
4. **"UNIT" screen sa PLANT tab**: coal, steam, pressure, MW, hangin, gas sa iisang screen. M2.
5. **M3:** turbine trip (M.3200) at fan trip, gamit ang black-box na turbine.
6. **M4:** start-up ayon sa PR-OPE-5002 at sa cold / warm / hot start-up curves ng boiler manual.

## Paano binibilang ang progress
- Ang bawat Beta ay may tala sa `docs/versions/<ver>/UPDATE_REPORT.md`.
- Ang bawat natapos na gawain ay `[x]` sa `docs/CHECKLIST.md`.
- Ang bawat natapos na milestone ay isinusulat dito na may petsa at bersyon.
