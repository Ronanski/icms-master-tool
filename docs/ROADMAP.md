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
- **M1:** 2.2.0-beta.7: switches 0 / 438 (pasado). 150 MW snapshot 27 → 11 (ang hangganan ay ≤ 5: hindi pa pasado sa bilang; bawat isa sa 11 ay may paliwanag mula sa drawing / physics, 4 dito ay ang snapshot na hindi steady o magkasalungat na screen). Natitira sa M1: A6 (mga controller na mahirap simulan).
- **M2 ~ M6:** hindi pa nasisimulan. May batayan na ang M2: ang load down ay gumagana sa demand side (2.2.0-beta.2), at nasa repo na ang 3 procedure.

## Paano binibilang ang progress
- Ang bawat Beta ay may tala sa `docs/versions/<ver>/UPDATE_REPORT.md`.
- Ang bawat natapos na gawain ay `[x]` sa `docs/CHECKLIST.md`.
- Ang bawat natapos na milestone ay isinusulat dito na may petsa at bersyon.
