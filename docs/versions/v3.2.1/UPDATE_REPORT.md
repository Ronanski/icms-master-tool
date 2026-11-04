# UPDATE REPORT — v3.2.1 (Beta)

## 3.2.1-beta.11 — 036 TURBINE OIL, mockup page 04 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/04-turbine-oil.html` → Plant view **036 TURBINE OIL** (`MK04`), `tools/hmi-mock/p04.py` →
`src/ui/plant/hmi-mock-to.js`. Parehong signal ng lumang page (`hmi-to.js`): MOP-A / B, EOP, COP-A / B at vapour extractor = TCS ng
plant model (tcs.js TCS_OIL); bagong `LS_FPOP.tcs` faceplate (STATUS, MODE AUTO / MAN, TCS START / STOP, EXECUTE / CANCEL, Events;
`AN.turbine('oil' | 'vex')` gaya ng TCS OPERATION box); oil purifier = FIELD (`AN.field('pur')`); pressures at temperatures = plant
model, cooler outlet = TE-LO1002-1 / -2 ng logic (ABC-053).

**Checked (headless cloud).** 150 MW + RUN: MOP-A RUNNING 6.1, COP-A 163.2, bearing header 3.3, control / trip oil 162.6 kg/cm2,
cooler inlet 62 °C, outlet 46 / 46 °C; MOP-B faceplate START + EXECUTE → RUNNING 5.5 kg/cm2; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; walang loop check cards ang Turbine Oil.

## 3.2.1-beta.10 — INSTRUMENT AND PLANT AIR, mockup page 03 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.** `docs/hmi/mockups/temp/03-instrument-plant-air.html` → Plant view **INSTRUMENT AND PLANT AIR** (`MK03`), `tools/hmi-mock/p03.py`
→ `src/ui/plant/hmi-mock-ia.js`. Parehong signal ng lumang page (`hmi-ia.js`): compressor RUN / STOP / TRIP = input rows ng DITL-113 / 114
(5 / 12 / 19, trip +1; local panel start), dryer RUN / STOP = output row ng DITL-45 (IA 14, PA 3), Remote / Local = input row (IA 15,
PA 4); current, dryer flow, dryer outlet, tank A / B at Unit 1 pressure = plant model AN_AIR. Click = info card (gaya ng dati). Bagong
`hmi-mock.js`: `sti`, `sto`, `remi`, at `data-short` (RUN / STOP kung 5 letra lang ang puwang ng mockup). Loop check dock Air → MK03.

**Checked (headless cloud).** 150 MW + RUN: IA compressor A RUN 212 A, dryer A RUN Remote 1200 m3/h, tanks 7.00, Unit 1 6.80 kg/cm2;
PA compressor A RUN 44 A, dryer A 1500 m3/h; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; loop check cards ng Air (wala pa sa dock).

## 3.2.1-beta.9 — MAKE-UP AND CLOSED COOLING WATER, mockup page 02 in the app (2026-11-04, JISOO : HMI MOCKUP)

**Work done.**
- `docs/hmi/mockups/temp/02-makeup-closed-cooling.html` (inaprubahang mockup) → Plant view **MAKE-UP AND CLOSED COOLING WATER**
  (`MK02`), drawn exactly; ang lumang MAKE-UP WATER at 027 CLOSED COOLING WATER ay nananatili hanggang pumasa ang loop check.
- `tools/hmi-mock/mock.py`: generic na annotator para sa susunod na mga page (hooks lang; ayaw ng snapshot number na walang hook; ayaw
  ng sirang SVG). `p02.py` + `p02-head.js` → `src/ui/plant/hmi-mock-mu.js`.
- `hmi-mock.js`: valve label ng mockup → faceplate na alam ng `fp-pop.js` (`LS_FPOP.valveKind`, `valveOpen`; red = open, green = closed);
  XV-MU1109 OPEN / CLOSED (plant model) at Auto / Manual (DITL-78 AUTO SELECTED); TCV-CW1201 = MV, mode at PV ng TICLO1002 (ABC-053),
  click = faceplate ng controller; ACWP Remote / Auto mula sa output rows ng DITL-76 / 77 (gaya ng lumang page); "page:" at link ng
  mockup = page ng Plant view (ang CW page ay may link na papunta sa page 02).
- Loop check dock: MU / CCW → page 02.

**Checked (headless cloud).** 150 MW + RUN: LIMU0708A/B 13.8 / 13.7 m, PIMU0709 9.0, FIMU1001 25.2 m3/h, LICW1109 0.80 m, ACWP 26.8 A,
PICW1152 6.4, TICLO1002 MV 51.9 % Auto PV 46 °C; faceplate ng MWP-A, MWP-B (Y / N), ACWP-A, ACWP-B (STANDBY), XV-MU1109, V-MU1033,
V-CW1001, TICLO1002; link CW → page 02; walang JS error; `npm run check` SAME.

**Not checked.** Live test; phone layout; ang loop check cards ng MU / CCW (wala pa sa dock).

## 3.2.1-beta.8 — 030 CIRCULATING WATER, the approved mockup page in the app (2026-11-04, JISOO : HMI MOCKUP)

**Problem.** User 2026-11-04 ~8:25 PM PHT (MINA thread): "Yan ang ilagay sa app, yan ang iloloop check". Ang 19 temporary HMI
mockup page (inaprubahan, audit ni HAEWON PASS) ay artifact lang; ang loop check ay ginagawa sa lumang 030 SEAWATER page.

**Work done.**
- `docs/hmi/mockups/temp/01-circulating-water.html`: kopya ng inaprubahang mockup (source of truth).
- `tools/hmi-mock/cw.py` + `cw-head.js`: binabasa ang SVG ng mockup at naglalagay lang ng live hooks (walang binagong guhit);
  gumagawa ng `src/ui/plant/hmi-mock-cw.js`.
- `src/ui/plant/hmi-mock.js` (LS_MOCK): iisang runtime ng mga mockup page: RUNNING / STOPPED / TRIP (LS_DOCK.mst), Remote · Manual
  (LS_DOCK.modeOf), Breaker ON / OFF, Y / N (LS_FPOP.yn), value ng logic kapag may sheet, kung wala ang plant model (UNIT.*),
  DITL-39 rows 3 / 4 / 14 / 15 (IN OPERATION, COMMON FAIL), NO-SOURCE = '-----'. Click: equipment = CONTROL faceplate, Y / N =
  PERMISSIVE · TREND · MONITOR, debris filter = push buttons ng DITL-39, hypo pumps = FIELD, 10 field valve V-SW = FIELD valve
  faceplate. Ang faceplate ay ang dati (fp-pop.js), hindi kinopya ang itsura ng faceplate sa mockup.
- Plant view: bagong page **030 CIRCULATING WATER** bago ang lumang 030 SEAWATER (nananatili hanggang pumasa ang loop check).
- Loop check dock: ang CW ay bumubukas sa bagong page (`loopcheck.js` page 'CWN'); `LS_FPREG` ng bawat motor ay nasa bagong page.

**Checked (headless cloud, Chromium).** Start at 150 MW + RUN: value ng page tugma sa lumang page (LISW1501 -4.00, IIP1501B/C 230.0,
condenser 28.5 / 33.6 °C, SWBP 90.0 A); faceplate bumukas sa click ng SWP-B, Y / N, V-SW1016, S-1502, P-0762A; openAd('M.3353')
true; walang JS error. `npm run check` SAME.

**Not checked.** Live test sa PC ng user; ang 50 card ng loop check dock sa bagong page (gagawin ni MINA); phone layout.
Ang iba pang 18 page ay wala pa sa app.

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
