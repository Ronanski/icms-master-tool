# NO-CHEAT AUDIT (2026-11-03, independent auditor, hindi ang fixer)

Tanong ng user (2026-11-03 5:36 PM PHT): "Paano ko makakasiguro na hindi daya ang ginagawa at tunay na buong loop communication / plant model physics, at walang assumed, ang nagiging ayos o fix?"

Sagot: hindi na kailangang maniwala sa ulat. Dalawang tool ang tumatakbo nang mag-isa sa bawat Beta at naglalabas ng PASS / FAIL at listahan:

- `node tests/regress/no_cheat.js` — headless, Worker, Training Cold; ang test ay hindi nagbubukas ng logic page.
- `node tools/audit/assumed_register.js` — isinusulat ang `docs/audit/ASSUMED_REGISTER.md` mula sa code mismo (bawat value na walang dokumento, may file at linya).

Sinuri: `main` = 3.2.0-beta.89 (d91c83a), `dist/logic-sim-v3.2.0-beta.89.html`.

## Resulta ng no_cheat.js sa beta.89: 2 FAIL

1. PASS A: sa Worker, walang page na binuksan ng test, lahat ng 51 ABC sheet ay tumatakbo (gumagalaw ang plant time ng bawat isa). Ang beta.89 fix na "every ABC sheet runs each scan" ay totoo para sa ABC.
2. **FAIL B (H2 buhay pa sa Worker):** ang START permissive ng BFWP-A (M.3343) at BFWP-B (M.3344), DITL-23A row 12 "PT-FW1115-A SUCTION PRESSURE > 1.5 kg/cm2", ay KULANG sa Worker pero KUMPLETO sa page engine sa parehong plant state. Ang value ay umaabot sa page (suction 2.22 kg/cm2, `avw.r12` = 2.22, higit sa 1.5), pero hindi ito binabasa ng Worker side ng permissive. Kaya hindi ito tungkol sa ABC sheet na hindi tumatakbo (A ay PASS); ang mali ay nasa daan ng DITL analog comparator row sa pagitan ng Worker at page. Ang beta.89 fix ay hindi ang root cause ng row na ito.
3. **FAIL C (tick na walang plant state):** 6 SOP item na ibinigay ng SOP sa control room (CRO) at may tag na NASA app, pero mano-mano ang tick (check box / "Done in field"), hindi mula sa signal:
   - 21.8 FCV-DO1012 fully OPEN, MANUAL
   - 21.15 PCV-DO0002 bawasan ang bukas
   - 23.2 FCV-FA1055A1 / B1 fluidizing air damper ≥ 25 %
   - 24.13 / 24.14 FICFA1081 > 1200 / > 600 mmH2O
   - 25.12 FICFA1071 PAF inlet damper, single arrow
4. Bilang ng SOP item (PR-OPE-5002, 692): 138 ay tumi-tick mula sa signal ng app, 503 ay mano-mano (field), 51 ay TCS.

## Iba pang nakita (pagbasa ng code, may file at linya)

- **"Done in field" na buong step (16 Training step):** 1, 14, 20, 47, 57 ~ 64, 73 ~ 76 (`src/ui/training/guide.js` FIELD1, `src/ui/training/dock.js:2175`). Ang pindot ay nagti-tick ng LAHAT ng hindi-auto na item ng seksyon at kinukumpirma ang step nang walang basa ng plant. Tama ito kung walang DCS signal ang gawain (manual valve, local gauge), pero ang 57 ~ 64 (aux warming, bypass warming, deaerator warming, gland sealing, polisher, vacuum up, sand) ay may plant effect; ang tunay na kondisyon ay nasa ibang step (66 ~ 72) lang.
- **Isang-pindot na TCS action:** `A.tcs('aux' | 'gland' | 'hood' | 'vacuum', 1)` sa `guide.js`. Ang "GLAND STEAM IN SERVICE" ay nagse-set ng `TC().aux.gland`, at iyon din ang binabasang kondisyon ng step. Hindi ito buong loop; button na nagse-set ng flag. Ang TCS logic ay wala sa DCS drawings; may `document-references/tcs-references` na hindi pa naikumpara.
- **BFP lube oil pump (M3):** `src/world/plantsw.js` lopP = 2.5 kg/cm2 kapag tumatakbo, 0 kapag hindi (NO-SOURCE). Ang "BFWP running = shaft-driven LOP" (beta.90 ni Lisa) ay WALANG basis sa nabasa ko at sumasalungat sa SOP: PR-OPE-5002 seksyon 20 "Initiate START of LOP of BFP A/B" bago ang BFP at "Set the selected standby BFP LOP to AUTO" (dalawang pump, may standby). Ang DCS I/O list ay may pressure switch lang (< 1.5, > 2.0, < 1 kg/cm2) at level switch, walang motor I/O ng LOP, kaya local ang pump. Ang flow diagram K1AU3-A1-0-001 RA / RB ay drawing na walang text layer: hindi mabasa rito ang lube oil ng BFP (finding (c)).
- **BFWP suction pressure:** `plantsw.js` sucP = deaerator pressure + 2.2 − 1.4 x (flow/499)^2: ang 2.2 at 1.4 ay NO-SOURCE, inayon lang sa snapshot 4.PNG (6.7 kg/cm2).
- **Lower ring header drains (H1):** Cd 0.6, 10 % bukas, head 3 kg/cm2: NO-SOURCE (`plant.js`, linya ng `lhdQ`). Ang line size ay mula sa PD-019 Rev D (FOUND).

## ASSUMED register

`docs/audit/ASSUMED_REGISTER.md`: 95 linya na NO-SOURCE sa 14 file (pinakamarami `unit.js` 41 block, `tcs.js` 12). Bawat isa: file:linya, ang code, at ang sinasabi ng code na kulang. Limitasyon: nahuhuli lang nito ang value na umaamin sa comment (ASSUMED, not in the repository, typical, calibrated). Ang value na walang comment ay hindi nito nakikita.

## Hindi nasuri

- beta.90 / branch `claude/lisa-speed`: wala sa GitHub nang suriin (2026-11-03 5:50 PM PHT); ang mga branch lang ay `claude/lisa-speed-real` at `claude/lisa-speed-x300` (luma). Ang H2 fix at ang shaft-driven LOP ng beta.90 ay susuriin kapag na-push; patakbuhin lang ang `no_cheat.js` sa build nito.
- Live sa PC ng user: hindi. Headless lang ito (hindi live test ayon sa rule).
- Buong Cold → 150 MW sa Worker na may tunay na pindot: hindi pa; ang no_cheat.js ay sa Cold lang (hakbang 1 ng permissive).
- Ang 503 mano-manong item ay hindi isa-isang hinusgahan; ang C ay sumasala lang ng CRO item na may tag na nasa app.
