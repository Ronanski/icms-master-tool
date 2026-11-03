# Project Rules — DCS Logic Simulator

Permanenteng rules. Basahin kasama ang `CLAUDE.md`, `HANDOFF.md` at `docs/SPEC.md` (ang gusto ng user). Pinaikli 2026-10-26 (user: "simple lang dapat", pinayagang baguhin ang docs para bumilis); ang lumang bersyon ay nasa git history.

## 1. Prayoridad
1. Sundin ang `docs/SPEC.md`. Walang gawain sa labas nito nang walang utos.
2. Huwag sirain ang gumagana. Ang plant drawing ang batayan.
3. **Language (user #49, 2026-11-02):** Taglish 80 / 20 ONLY in the project chat with the user and in artifacts; everything else in English (thread messages, reports between threads, repo docs, commits, PRs). Simple words for a non-coder.

## 2. Batayan (source of truth), sunod-sunod
Lahat ay nasa `document-references/` (listahan sa `CLAUDE.md` rule 4):
1. DCS logic drawings (ABC / DITL PDF, DWG) — logic, signal path, page link.
2. I/O list at memory lists STN101 ~ 105 — address, tag, station.
3. F(X) linear curves, PID / PIDV / SUMA / MAN parameters, compensations.
4. Symbol legends (analog / digital) — kahulugan ng block.
5. Procedure PR-OPE-5002 / 5003 / 5004, FHI boiler manual, fan curves, TCS references, HMI snapshot — plant behavior at mga numero.
6. DCS textbook — pangkalahatang paliwanag lang.

Bawat finding ay isa sa tatlo lang (CLAUDE.md rule 5): (a) bug, naayos; (b) tama, may ebidensya sa drawing; (c) hindi mabasa ang drawing, may pangalan ng eksaktong bahagi. Bawal mag-imbento ng tag, parameter o value.

## 3. Pagbabago
- Bago baguhin ang engine o logic: i-trace ang drawing (sheet, tag, block, legend) at isulat ang ebidensya sa `docs/versions/v<ver>/UPDATE_REPORT.md` ng Beta na iyon. Kung tungkol sa link / signal: `UNLINK_AUDIT.md` (CLAUDE.md rule 9).
- Puwedeng baguhin ang DITL (user 2026-10-15) kapag mas gumaganda ang simulation; may test.
- Ang UI change ay hindi dapat makagalaw sa engine. Malaking UI / layout change: proposal muna, hintayin ang pili ng user. Bug fix: diretso.
- Ang drawing ng ABC / DITL ay nananatiling gaya ng na-parse sa DXF; hindi binabago ng UI ang gate, wire o layout.
- Real values ang ipinapakita (T/H, kg/cm2, MW, %, °C), hindi DCS count (100 % = 10000).
- Ranges na nakasulat sa drawing ay mahigpit sa bawat input at slider.
- Bago galawin ang live values, symbols, selectors, ranges o ramps: basahin ang `document-references/values-logic-sim-end-user-report.xlsx` (mga rule at wishlist ng user). Iisang value bawat net; ang value ay hindi tumatakip sa wire, block o text.

## 4. Beta, Stable, version
- **Beta:** bawat ayos ay i-save online agad sa working branch; iyon na ang Beta (walang GO para sa push; ang pagpasok sa `main` ay walang approval din, user 2026-11-03). Bawat push: taasan ang `-beta.N` sa `src/version.txt`, `npm run build`, `npm run check`, test ayon sa seksyon 5, i-update ang `HANDOFF.md` at ang UPDATE_REPORT.
- **Merge sa `main` (user 2026-11-03, pumalit sa rule ng 2026-10-30):** walang approval ("Ung beta, no need n ng aproval, pra tuloy2 ang flow. Stable lng ang need ng approval."); kusang nade-deploy ang Beta site pagkatapos ng berdeng Checks.
- **Kailangan ng GO STABLE ng user sa mismong mensahe:** Stable release (isang apk, isang portable exe, html, report) at anumang manual na workflow run (`release.yml`, `clean-releases.yml`). Ang GO BETA ay hindi pahintulot sa Stable. Hindi minamana ang pahintulot mula sa lumang mensahe.
- Walang UAT file sa Releases; ang UAT ay nasa app at ibinibigay sa chat.
- Version: SemVer `MAJOR.MINOR.PATCH` (Stable) at `-beta.N` (Beta). Gumagalaw lang ang Stable number sa GO STABLE. MINOR = bagong feature, PATCH = ayos lang.
- Source ay `src/` (`npm run build`); huwag i-edit ang html sa `dist/` nang direkta.
- App text = English (#54); Taglish only in the user chat and artifacts, everything else English (#49).
- Ito lang na repository (`Ronanski/icms-master-tool`).

## 5. Test policy (lean, user 2026-10-26)
Layunin: patunay na totoo, hindi paulit-ulit at hindi mabagal.
1. **Habang gumagawa (mabilis):** `npm run build` + `npm run check` + ang IISANG test na sakop ng binago (hal. `fx_page.js` kung F(X)).
2. **Bago mag-ulat sa user (2 test lang):**
   - `tests/regress/sop_bawal.js` — batay sa reference (PR-OPE-5002, DITL, ATS criteria): ang maagang aksyon ay dapat tanggihan ng app.
   - ~~Isang Cold run: `tools/training/human_run.js`~~ **SUPERSEDED 2026-11-03 (user #20, #40, #62): automated tests never do a cold start. The only cold start → 150 MW run is the live test (Training, MINA : TESTER presses). The old text was:** Isang Cold run: `tools/training/human_run.js` (Cold → 150 MW sa mouse click, ~25 min) — kapag ang binago ay plant model, Training o engine lang. Para sa UI lang: screenshot ng binagong screen (PC, tablet, phone).
3. **Mabigat na test (background lang, hindi humaharang sa push o sa reply):** `tests.js`, `switches.js`, `blocks_io.js`, generic tester, `tools/ui-audit/audit.mjs`. Patakbuhin lang kapag ang binago ay sakop nila, at isang beses bago GO STABLE.
4. **Limits (user, 2026-11-02 ~ 11-03):**
   - #20: automated tests never do a cold start.
   - #23: no cheating tests: never change, skip or loosen a test to make it pass. Fixing a real test bug (for example a missing `await`) is allowed and is said in the report.
   - #24: every loop is checked together with its logic (loop + logic check against the drawing).
   - #47: the PC may be used for Worker tests, under TEST_LOCK (`team-files/TEST_LOCK_RULE.md`, one heavy run at a time); #20 still applies. Never kill processes by name.
   - #62: in the live test MINA : TESTER does the pressing on the existing HMI, does no coding, and reports PASS / FAIL in an artifact.
   - #63: the tester does not continue past a trip or blocker unless evidence proves it is a normal standing condition. Every artifact has a clear title.
5. Ang resulta sa user ay sinasabi bilang **nakikita ng operator** (hal. "hindi ma-roll ang turbine nang walang vacuum: tama"), hindi pangalan ng test. Ang hindi nasubok ay sinasabing HINDI NASUBOK, hindi "pass".

## 6. Docs (iisa lang bawat isa)
- `docs/SPEC.md` — spec ng user, meron / kulang, plano.
- `docs/USER_CHECK.md` — ano ang pipindutin ng user at ano ang dapat makita.
- `HANDOFF.md` — ang iisang handoff file: kasalukuyang estado, threads, bukas na isyu, utos at desisyon ng user, style. Ina-update ng bawat thread / session sa katapusan ng gawain (palitan, huwag dagdagan ng kasaysayan).
- `docs/versions/v<ver>/UPDATE_REPORT.md` — isang section bawat Beta: Problem, As Found, Work Done, As Left, Status.
- Iba pang audit file sa `docs/versions/` at `docs/abc-audit/` lang kapag may tunay na ebidensya. Walang placeholder, walang doble.

## 7. Pag-uulat
Bawat ulat: ano ang binago, ano ang sinubok (at paano), ano ang HINDI sinubok, natitirang problema, susunod na gagawin. Simpleng salita; walang git jargon; oras sa PHT. Walang "fixed / tested / built" nang walang ebidensya.
