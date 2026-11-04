# UPDATE REPORT — v3.2.1 (Beta)

## 3.2.1-beta.4 — Loop check dock (2026-11-04, thread "Build loop check dock in app")

**Problem.** User 2026-11-04 6:38 PM PHT (MINA thread): "may dock na checklist na makikita natin sa totoong pindot mo, at hindi code".
Ang loop check ay nasa `CW_LOOP_CHECK.md` lang (papel); ang tester ang nagbabasa ng value at nagre-report. Walang panel sa app na
nagpapakita ng PASS / FAIL habang pumipindot.

**As found.** 3.2.1-beta.3 (main 736d55c): may Training dock (`dock.js`), 030 SEAWATER page (`hmi-sw.js`) na may pop-out faceplate
(`fp-pop.js`), plant model ng CW (`unit.js` AN_SW). Walang loop check sa app.

**Work done.** Bagong `src/ui/training/loopcheck.js` + `loopcheck.css` (ayon sa mockup ni MINA
https://claude.ai/artifact/4UbnHivhBbaUUB7WNJ7k4u):
- Button na **Loop check** sa kaliwang rail (sa ilalim ng Training). Bumubukas ang panel sa kanan (parehong lugar ng Training dock;
  isa lang ang bukas: ang Training dock ay nagiging tab sa gilid) at ang 030 SEAWATER page sa gitna.
- **50 card ng Circulating Water**, isa bawat tag at aksyon, galing sa `CW_LOOP_CHECK.md` A ~ E: A (pagbasa sa 150 MW: PG-SW1501,
  PT-SW1110-A1/B1, A2/B2, DPT-SW1502, TT-SW1110-A2/B2, IT-P1501x, SWBP), B (bawat SWP: STOP, REMOTE, START, discharge valve 10 %,
  bukas hanggang PG 2.2 ~ 2.4, 100 % mag-isa, trip interlock; lahat ng SWP STOP), C (condenser path A / B: outlet 40 → 22 → 40 %,
  inlet sarado), D (S-1502 / S-1504 AUTO START / STOP), E (SWBP: START na walang SWP, START / STOP, discharge 5 %, S-1504 DP).
- Bawat card: **Plant model** (AN.unit), **Signal / address** (P.B. memory ng DITL, ang running / remote DI na binabasa ng IBANG
  sheet, hal. I.0526 sa DITL-30 row 18; AI address mula sa I/O list), **Logic row** (DITL output row + ABC memory, hal. ABC-052 M.3354).
  Ang check na walang address o logic row para sa tag (local gauge, field valve, AI na walang logic sheet) ay "–" at hindi binibilang.
- Kusang nakikita ng card ang totoong pindot (faceplate START / STOP + EXECUTE, FIELD LOCAL / REMOTE, field valve). PASS kapag
  tama ang tatlo nang 2 s (plant time) pagkatapos ng pindot; FAIL na may dahilan kapag naubos ang oras ng card. Bilang bawat system,
  PASS / FAIL / Skipped / Not done, FAIL list, Export CSV, Reset system. Ang resulta ay nasa browser (localStorage).
- Ang panel ay nagbabasa lang (LS_DOCK, DUI, WORLD, AN.unit): walang pinipindot o fino-force.
- Ang ibang system (MU / CCW, Air, Condensate) ay nakalista pero wala pang card.

**Mga hangganan ng check (sinabi sa card).** Ang "about" na value ng doc ay may check band: S-1502 DP 400 ~ 600, SWBP 90 A ± 10 %,
SWBP start 274 A ± 10 %, SWP start 500 ± 30 A (ayon sa `cw_model.js`), SWP current pagkatapos ng start 150 ~ 317 A (TECO table ng
`CW_PLANT_MODEL.md`). Ang SWP current sa labas ng SOP 205 ~ 215 A ay UNUSUAL, hindi FAIL (A2).

**As left / status.** Headless (cloud), totoong click sa faceplate: tingnan ang ulat sa thread. HINDI pa live-tested sa PC ng user.
