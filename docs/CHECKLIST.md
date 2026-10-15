# Checklist ng lahat ng gagawin (user 2026-10-15) — pinakamabilis hanggang pinakamatagal

Walang kategorya, isang listahan lang. `[ ]` = hindi pa; `[x]` = tapos at na-check; `[F]` = FUTURE PLAN (hindi pa ipatutupad, hintayin ang utos). Ang hatol ng user: ang bawat sheet ay sinusuri mula INPUT hanggang sa halaga ng bawat block, tama ang switching sa bawat scenario, at lahat ay ayon sa PDF diagram sa repo.

1. [ ] **Itala ang mga plano sa HANDOFF at i-link ang checklist na ito.** Para kahit bagong session ay alam agad ang susunod. (minuto)
2. [ ] **Ayusin ang pangalan ng bersyon sa mga dating ulat.** Ang `docs/versions/v1.20.60 ~ v1.20.67` ay history bago ang SemVer; lagyan ng tala at iisang `v1.21.0` na ulat. (minuto)
3. [ ] **Ilagay ang awtomatikong controller tester sa UAT panel ng app** (isang pindot kada controller). Ngayon sa computer lang ito tumatakbo. (1 oras)
4. [ ] **Pag-aralan ang resulta ng coverage ng input / output (`cone.js`) sa 54 na sheet** at ilista ang mga patay na input at patay na output. Ang bawat isa ay posibleng nawawalang kontinuidad ng signal. (1~2 oras)
5. [ ] **Ang natitirang 5 controller na walang malinis na panimulang estado** (PICFG108, PICAS1005, TICHR1002, AICFG112, HS-COAL) **at ang FICFW1007** (cascade slave): alamin kung anong kondisyon sa drawing ang kailangan at isama sa tester. (2~3 oras)
6. [ ] **Tapusin ang ABC-007:** BU-CMD (M.0181 / RB-MV 50 %), epekto ng MFT sa MV, positioner AI0192 (M.253F), FAULT T (hold ng MV, M.018B / M.019B), SIG.AB B.0660 / B.0661, mga alarm M.3130 / M.3131 (PV < 220 / 200 T/H), mga SET rule. (3~4 oras)
7. [ ] **Pangalan ng natitirang input na walang tag** (mga ~600 na tag na hindi pa nakakabit sa wire). Alamin kung alin ang tunay na input; ang pangalan ay tumutulong sa panel at sa "Bakit?". (3~4 oras)
8. [ ] **26 na live-value na nagkakapatong** sa drawing (UI lang). Subukan nang paisa-isa sa mga sheet na may problema. (3~4 oras)
9. [ ] **Ang 7 COS / 42 COS na hindi 'used':** naisuri na ang lahat sa PDF; tapusin ang ulat at ang pangalan ng bawat isa sa panel. (2 oras)
10. [ ] **Pagsubok ng digital logic sa lahat ng kombinasyon ng input** sa mga bahagi ng sheet na maliit ang bilang ng input (AND / OR / NOT / timer / flip-flop). Hinahambing sa hiwalay na pagkuwenta, kaya nahuhuli ang bug ng engine. (kalahating araw)
11. [ ] **Awtomatikong tester ng halaga ng bawat block sa bawat sheet** (ang hiningi ng user: "from input, tama ang lalabas na value ng bawat block"): hiwalay na tagakuwenta (oracle) ng AND, OR, NOT, ADD, SUB, MUL, DIV, SQRT, ABS, HC, LC, MAX, MIN, F(X), LAG, RATE, TPS, TON, TOF, SEL, at iba pa; random na input; inihahambing sa engine sa bawat net ng 54 na sheet. (1~2 araw)
12. [ ] **Awtomatikong tester ng switching** (SW, AMT, T switch, selector): sa bawat selector sa bawat sheet, subukan ang lahat ng leg at ang select signal na 1:A / 1:B; ang inaasahan ay hiwalay na kuwenta. (1 araw, kasabay ng #11)
13. [ ] **Scenario mula sa PDF para sa mga loop na ginagamit ng operator** (cluster ng sheet, tingnan ang sagot sa ibaba): force manual / interlock truth table, SV path, AUTO / MAN / REMOTE, trip at pagbalik, para sa bawat cluster: (a) 003A–E + 007 + 006 (burner oil at hangin), (b) 004A–C + 005 + 002 (coal feeder at limestone), (c) 001A–D + 002 + 013 + 001C (load at main steam pressure), (d) 010 (drum level), (e) 011 + 012 (SH temp), (f) 019 + 020 (reheat temp), (g) 050 + 051 + 052 (bypass at reheat), (h) 009A + 009B, (i) 015 + 016 + 057, (j) 026 + 027 + 028 + 029 + 030 + 033 + 053 + 054 + 055 + 056, (k) 031 + 032 + 034 ~ 039 (condenser, heater drain). (ilang oras bawat cluster; ilang araw kabuuan)
14. [ ] **Audit ng bawat sheet laban sa PDF** (function, process, cause-and-effect; lalo na AUTO / REMOTE / MANUAL): ginawa na ang ABC-007; ang natitirang 53 ay sabay sa #13. (ilang araw)
15. [F] **"Bakit?" at "Sanhi?" na buo:** piliin ang valve o controller at sasabihin sa simpleng salita kung bakit hindi bumukas, bakit ganito lang ang opening, bakit ganito ang demand, o bakit mataas pa rin ang temperatura kahit ibinago ang hangin. Sumusunod sa logic ng drawing, hanggang sa pinagmulang input at sa proseso (hal. air / fuel / spray / pressure). (1~2 araw)
16. [F] **Checklist ng permissive:** ano ang kailangan para makapag-AUTO, makapag-start o magbukas, may ✔ / ✖ ayon sa kasalukuyang estado. (1 araw)
17. [F] **Cause-and-effect matrix na kusang gawa at i-export sa Excel.** (1 araw)
18. [F] **Audit ng drawing laban sa I/O list at memory list** (address, paglalarawan, patay na tag). (1 araw)
19. [F] **Tuning lab:** subukan ang P / I / D ng loop sa plant model at tingnan ang tugon ng PV; ang parameter ay mula sa summary sa repo. (1 araw)
20. [F] **Rehearsal ng startup at shutdown** (scenario na hakbang-hakbang, may marka). (2~3 araw)
21. [F] **"Compare" ng dalawang bersyon ng sheet** bago baguhin ang logic: ano ang naapektuhan. (2~3 araw)
22. [ ] **Linisin ang code:** hatiin ang malalaking file (`compile-step.js` 116 KB, `ditl-app.js` 125 KB, `plant-window.js` 62 KB) at ayusin ang napakahabang linya. Walang magbabago sa gawi; ang html ay dapat pareho ang gawi. (2~3 araw; ang DITL ay hindi gagalawin nang walang utos)
23. [F] **Rebisyon ng UI / UX para sa tablet:** mas malaking button, iisang ibabang bar, buong-screen na faceplate at trend page. Dagdag, hindi overhaul. (2~3 araw)
24. [F] **Overhaul ng app:** HINDI inirerekomenda ngayon; ang engine at mga test ay matatag na. Pag-isipan lang kapag natapos na ang #13 at #14.

## Mga sagot sa tanong ng user

**Sheet por sheet o per loop (dugtong-dugtong na sheet)?** Pinakamabisa ang **pinaghalo**: (1) bawat sheet ay sinusuri ng awtomatiko (#10, #11, #12), mabilis; (2) bawat **cluster** ng magkakadugtong na sheet ang sinusuri ng scenario mula sa PDF (#13), dahil ang cause-and-effect ay tumatawid sa mga sheet (hal. M.0098 ng ABC-003E ay nagfo-force ng 007). Nasukat sa app: 39 sa 54 na sheet ay iisang malaking konektadong bahagi, kaya hindi puwede ang "lahat ng konektado"; ginamit ko ang bilang ng link: ABC-015 / 016 ↔ 057 (37 at 31 link), 004A ↔ 004B / 004C (20), 009A ↔ 009B (17), 050 ↔ 051 / 052 (14 at 12), 003A ↔ 003B / 003C / 003D / 003E (12). Sa bawat natapos na cluster, ibibigay ko ang UAT para masubukan mo.

**Malinis ba ang app?** Mas maayos na: ang html ay iisang file lang bilang resulta ng build (kailangan para sa apk / exe na offline, 3.8 MB kasama ang 3 MB na data ng diagram); ang source ay hiwalay: `src/analog` (reader, engine, ui, data), `src/digital`, `src/ui` (shell, hmi, theme, uat), `src/boot`, `tests`, `tools`, `delivery`, `docs`, `archive`. Ang hindi pa malinis: (1) may napakalalaking file at napakahabang linya (#22); (2) maraming folder ng bersyon sa `docs/versions` (#2); (3) ang DITL ay iisang 125 KB na file (hindi gagalawin nang walang utos).
