# Checklist ng lahat ng gagawin (user 2026-10-15) — pinakamabilis hanggang pinakamatagal

Ang oras ay ang oras ng trabaho at takbo ng test ko (hindi araw ng tao). HINDI kasama ang hintay sa pagsubok mo sa device at sa pag-apruba. Ang mga estimate ay hula; ang pinakamahaba ay ang pagbasa ng PDF (isa-isang sheet) at ang takbo ng simulation (ang buong tester ng controller ay umabot ng ~40 minuto sa 4 na sabay na proseso).

Walang kategorya, isang listahan lang. `[ ]` = hindi pa; `[x]` = tapos at na-check; `[F]` = FUTURE PLAN (hindi pa ipatutupad, hintayin ang utos). Ang hatol ng user: ang bawat sheet ay sinusuri mula INPUT hanggang sa halaga ng bawat block, tama ang switching sa bawat scenario, at lahat ay ayon sa PDF diagram sa repo.

1. [x] **Itala ang mga plano sa HANDOFF at i-link ang checklist na ito.** Para kahit bagong session ay alam agad ang susunod. (minuto)
2. [x] **Ayusin ang pangalan ng bersyon sa mga dating ulat.** Ang `docs/versions/v1.20.60 ~ v1.20.67` ay history bago ang SemVer; lagyan ng tala at iisang `v1.21.0` na ulat. (minuto)
3. [ ] **Ilagay ang awtomatikong controller tester sa UAT panel ng app** (isang pindot kada controller). Ngayon sa computer lang ito tumatakbo. (1 oras)
4. [ ] **Pag-aralan ang resulta ng coverage ng input / output (`cone.js`) sa 54 na sheet** at ilista ang mga patay na input at patay na output. Ang bawat isa ay posibleng nawawalang kontinuidad ng signal. (1~2 oras)
5. [ ] **Ang natitirang 5 controller na walang malinis na panimulang estado** (PICFG108, PICAS1005, TICHR1002, AICFG112, HS-COAL) **at ang FICFW1007** (cascade slave): alamin kung anong kondisyon sa drawing ang kailangan at isama sa tester. (2~3 oras)
6. [ ] **Tapusin ang ABC-007:** BU-CMD (M.0181 / RB-MV 50 %), epekto ng MFT sa MV, positioner AI0192 (M.253F), FAULT T (hold ng MV, M.018B / M.019B), SIG.AB B.0660 / B.0661, mga alarm M.3130 / M.3131 (PV < 220 / 200 T/H), mga SET rule. (3~4 oras)
7. [ ] **Pangalan ng natitirang input na walang tag** (mga ~600 na tag na hindi pa nakakabit sa wire). Alamin kung alin ang tunay na input; ang pangalan ay tumutulong sa panel at sa "Bakit?". (3~4 oras)
8. [ ] **26 na live-value na nagkakapatong** sa drawing (UI lang). Subukan nang paisa-isa sa mga sheet na may problema. (3~4 oras)
9. [~] **Ang 7 COS / 42 COS na hindi 'used':** naisuri na ang lahat sa PDF; tapusin ang ulat at ang pangalan ng bawat isa sa panel. (2 oras)
10. [ ] **Pagsubok ng digital logic sa lahat ng kombinasyon ng input** sa mga bahagi ng sheet na maliit ang bilang ng input (AND / OR / NOT / timer / flip-flop). Hinahambing sa hiwalay na pagkuwenta, kaya nahuhuli ang bug ng engine. (2–3 oras)
11. [ ] **Awtomatikong tester ng halaga ng bawat block sa bawat sheet** (ang hiningi ng user: "from input, tama ang lalabas na value ng bawat block"): hiwalay na tagakuwenta (oracle) ng AND, OR, NOT, ADD, SUB, MUL, DIV, SQRT, ABS, HC, LC, MAX, MIN, F(X), LAG, RATE, TPS, TON, TOF, SEL, at iba pa; random na input; inihahambing sa engine sa bawat net ng 54 na sheet. (4–6 oras)
12. [ ] **Awtomatikong tester ng switching** (SW, AMT, T switch, selector): sa bawat selector sa bawat sheet, subukan ang lahat ng leg at ang select signal na 1:A / 1:B; ang inaasahan ay hiwalay na kuwenta. (2–3 oras, kasabay ng #11)
13. [ ] **Scenario mula sa PDF para sa mga loop na ginagamit ng operator** (cluster ng sheet, tingnan ang sagot sa ibaba): force manual / interlock truth table, SV path, AUTO / MAN / REMOTE, trip at pagbalik, para sa bawat cluster: (a) 003A–E + 007 + 006 (burner oil at hangin), (b) 004A–C + 005 + 002 (coal feeder at limestone), (c) 001A–D + 002 + 013 + 001C (load at main steam pressure), (d) 010 (drum level), (e) 011 + 012 (SH temp), (f) 019 + 020 (reheat temp), (g) 050 + 051 + 052 (bypass at reheat), (h) 009A + 009B, (i) 015 + 016 + 057, (j) 026 + 027 + 028 + 029 + 030 + 033 + 053 + 054 + 055 + 056, (k) 031 + 032 + 034 ~ 039 (condenser, heater drain). (2–3 oras kada cluster, 11 cluster = mga 25–30 oras kabuuan; ang pinakamahaba ay ang pagbasa ng PDF at ang takbo ng simulation)
14. [ ] **Audit ng bawat sheet laban sa PDF** (function, process, cause-and-effect; lalo na AUTO / REMOTE / MANUAL): ginawa na ang ABC-007; ang natitirang 53 ay sabay sa #13. (kasama sa oras ng #13)
15. [F] **"Bakit?" at "Sanhi?" na buo:** piliin ang valve o controller at sasabihin sa simpleng salita kung bakit hindi bumukas, bakit ganito lang ang opening, bakit ganito ang demand, o bakit mataas pa rin ang temperatura kahit ibinago ang hangin. Sumusunod sa logic ng drawing, hanggang sa pinagmulang input at sa proseso (hal. air / fuel / spray / pressure). (4–6 oras)
16. [F] **Checklist ng permissive:** ano ang kailangan para makapag-AUTO, makapag-start o magbukas, may ✔ / ✖ ayon sa kasalukuyang estado. (2–3 oras)
17. [F] **Cause-and-effect matrix na kusang gawa at i-export sa Excel.** (2–3 oras)
18. [F] **Audit ng drawing laban sa I/O list at memory list** (address, paglalarawan, patay na tag). (2–3 oras)
19. [F] **Tuning lab:** subukan ang P / I / D ng loop sa plant model at tingnan ang tugon ng PV; ang parameter ay mula sa summary sa repo. (3–4 oras)
20. [F] **Rehearsal ng startup at shutdown** (scenario na hakbang-hakbang, may marka). (6–8 oras)
21. [F] **"Compare" ng dalawang bersyon ng sheet** bago baguhin ang logic: ano ang naapektuhan. (6–8 oras)
22. [~] **Linisin ang code (TAPOS ang bahagi: ayos ng format at paghati ng `compile-step.js`; natitira ang `plant-window.js` at `links-canvas.js`; ang DITL ay TAPOS na rin, format at paghati lang, utos ng user 2026-10-15):** hatiin ang malalaking file (`compile-step.js` 116 KB, `ditl-app.js` 125 KB, `plant-window.js` 62 KB) at ayusin ang napakahabang linya. Walang magbabago sa gawi; ang html ay dapat pareho ang gawi. (4–6 oras; ang DITL ay hindi gagalawin nang walang utos)
23. [F] **Rebisyon ng UI / UX para sa tablet:** mas malaking button, iisang ibabang bar, buong-screen na faceplate at trend page. Dagdag, hindi overhaul. (4–6 oras)
24. [F] **Overhaul ng app:** HINDI inirerekomenda ngayon; ang engine at mga test ay matatag na. Pag-isipan lang kapag natapos na ang #13 at #14.

## Mga sagot sa tanong ng user

**Sheet por sheet o per loop (dugtong-dugtong na sheet)?** Pinakamabisa ang **pinaghalo**: (1) bawat sheet ay sinusuri ng awtomatiko (#10, #11, #12), mabilis; (2) bawat **cluster** ng magkakadugtong na sheet ang sinusuri ng scenario mula sa PDF (#13), dahil ang cause-and-effect ay tumatawid sa mga sheet (hal. M.0098 ng ABC-003E ay nagfo-force ng 007). Nasukat sa app: 39 sa 54 na sheet ay iisang malaking konektadong bahagi, kaya hindi puwede ang "lahat ng konektado"; ginamit ko ang bilang ng link: ABC-015 / 016 ↔ 057 (37 at 31 link), 004A ↔ 004B / 004C (20), 009A ↔ 009B (17), 050 ↔ 051 / 052 (14 at 12), 003A ↔ 003B / 003C / 003D / 003E (12). Sa bawat natapos na cluster, ibibigay ko ang UAT para masubukan mo.

**Malinis ba ang app?** Mas maayos na: ang html ay iisang file lang bilang resulta ng build (kailangan para sa apk / exe na offline, 3.8 MB kasama ang 3 MB na data ng diagram); ang source ay hiwalay: `src/analog` (reader, engine, ui, data), `src/digital`, `src/ui` (shell, hmi, theme, uat), `src/boot`, `tests`, `tools`, `delivery`, `docs`, `archive`. Ang hindi pa malinis: (1) may napakalalaking file at napakahabang linya (#22); (2) maraming folder ng bersyon sa `docs/versions` (#2); (3) ang DITL ay iisang 125 KB na file (hindi gagalawin nang walang utos).

## Tala ng paglilinis (beta.4)
- Ang lahat ng `src/analog`, `src/ui`, `src/boot` na js ay naka-format na ng Prettier (`.prettierrc`; `npm run format`). Napatunayan na walang nagbago sa gawi: ang minified na bundle ng analog ay pareho (457187 byte bago at pagkatapos ng paghati; ang tanging pagkakaiba sa pag-format ay ang pagtanggal ng sobrang panaklong sa isang arrow function sa `hmi-view.js`). Ang DITL (`src/digital`) ay hindi ginalaw.
- Ang `compile-step.js` (6624 linya) ay hinati: `face-defaults.js` (4078 linya na data ng faceplate), `compile-step.js` (2319), `ranges-fx.js` (230).
- Mga test na umaasa sa eksaktong teksto ng code ay inayos (`tests/engine/isolated.js` ay gumagamit na ng regex).

## Tala ng multi-file na app (beta.5)
- `tools/build/app-folder.js` (`npm run build:app`): mula sa iisang html, gumagawa ng folder na `index.html` + `js/*.js` (ang data ay `js/data-<id>.js`). Ang apk at exe ay ito na ang laman (`release.yml`). Ang Pages at ang release asset ay iisang html pa rin. Hindi ito kasama sa repo; nabubuo sa build.
- Napatunayan sa headless Chromium na galing sa `file://`: 160 / 160 na scenario ng ABC-007, panel_sync 0 FAIL, faceplate 68 controller; pareho ang 134 na sheet ng digital at ang mga data element; walang error.
- HINDI pa nasusubok ang pagbuo ng apk / exe mismo (kailangan ng workflow run: GO STABLE).

## Tala ng DITL cleanup (beta.6, utos ng user: "go DITL cleanup")
- Exemption sa rule na "huwag galawin ang DITL": **istruktura lang** (format at paghati ng file). Walang binago sa logic, engine o gawi.
- `src/digital/ditl-app.js` (125 KB, 784 linya) ay naging `src/digital/parts/01-parse-build.js`, `02-netlist.js` (1640 linya), `03-models.js`, `04-render.js`, `05-overlay-interaction.js`, `06-panels.js`, `07-app-events.js`, na pinagdugtong ng `src/digital/order.list` sa iisang script (global scope, parang dati).
- Patunay: (1) pagkatapos ng format, ang minified na DITL ay pareho (sha1 aecde129...); (2) pagkatapos ng paghati, pareho pa rin; (3) sa built html, ang DITL script ay pareho pagkatapos i-minify; (4) 5 digital na sheet sa headless: pareho ang laki ng SVG at ang bilang ng element bago / pagkatapos / sa multi-file; (5) 134 sheet ay pareho; (6) pasado: `npm test`, 5128 net ng engine, scenario ng ABC-007, panel_sync.

## Katayuan (2026-10-15)
- **TAPOS `[x]`:** #1, #2.
- **BAHAGYA `[~]`:** #9 (COS: naisuri na sa PDF; ang pangalan sa panel ay hindi pa), #22 (linis ng code: tapos ang analog at DITL; hindi pa ang `plant-window.js` at `links-canvas.js`), #13 at #14 (tapos lang ang ABC-007), #5 (62 sa 68 controller ang malinis; 5 ay kailangan ng hand-written na scenario dahil kondisyon ng proseso ang pumipigil; FICFW1007 ay hindi pa ginagalaw), #4 (structure.js: 51 sheet, 1 hindi nakakabit at 2 dead end na benign; ang simulation cone ay hindi pa kumpleto), #6 (ABC-007: B1/B2 BU-CMD tapos; kulang pa ang FAULT hold, alarm M.3130/M.3131, SIG.AB).
- **HINDI PA `[ ]`:** #3, #6, #7, #8, #10, #11, #12, #13 (ibang cluster), #14 (53 sheet), at lahat ng `[F]`.
- Mga natapos na wala sa orihinal na listahan: SemVer na version, multi-file na app para sa apk / exe, DITL cleanup, faceplate ayon sa planta, bumpless na AUTO -> MAN (engine), proseso na sumusunod sa tunay na utos sa valve, SV para sa AUTO lang, awtomatikong tester ng controller (headless).
