# GISELLE: progress (save progress, PAUSE 2026-11-02 4:36 PM PHT)
Role: helper ni Lisa (CODE FIXER) sa Worker (the engine in a Web Worker). Worktree:
`icms-master-tool/.claude/worktrees/worker-c-giselle-78b492`. Times below are PHT. (Note: some of my status lines in the chat had
wrong PM times; the times here are from `date` / the commits.)

## 1. Ginawa, ayon sa oras (2026-11-02)
| ~oras | gawain | branch @ commit (push) | resulta |
|---|---|---|---|
| 10:40-11:30 AM | Worker stage (c): ang ABC sheet / panels / CHECK sa radio. trace.js Next ▶ / ◀ Back = isang engine action (BAGO: `src/analog/engine/trace-step.js` AN.stepN / AN.stepBack); ~30 direktang `settle()` / `reset()` / `plantSwitch()` → `AN.*`; setForce body → AN.settle; test `tests/regress/eng_radio_giselle.js` | `claude/worker-c-giselle` @ 93a0110 + a26597f (pushed) | merged ni Lisa (8a3f850). Natagpuan: sheet arg = kopya sa engine, `.fm` hindi napapadala, b.p / LINEAR walang slot, hidden state (xlk); naayos ni Lisa |
| 11:40 AM | rebase sa 1b2583c | lokal 34385a8 + c82ae99 (hindi na-push: force-push hinarang) | si Lisa ang nag-cherry-pick |
| 12:00-3:10 PM | Worker stage (d): mga slot `bp<i>` (b.p, tuning), `ln` (ANLN), at ang sv slot ay nag-a-apply ng LINEAR edit (lnApplyEdits) | `claude/worker-d-giselle` @ cadf889 (pushed) | eng_radio_giselle 10/10 (bumabagsak ang 3 bago sa lumang sync.js), eng_radio PASS; eng_worker: DITL state FAIL na meron na rin sa 8a3f850 (hindi akin). Merged ni Lisa (66a2a27) |
| 3:15-4:00 PM* | Point 11: apk + exe ng 66a2a27 (mga hakbang ng release.yml, sa PC) | files: `team-files/worker-11-build/` | apk 8.7 MB signed + verified, exe 76 MB portable; eng_worker sa app folder ng exe: ALL PASS. Natagpuan: naka-OFF ang worker sa apk / exe; bumagsak ang Checks ng 66a2a27 (CI html ≠ committed); Beta site = hmi-kit |
| | Point 14: ang "Update now" flow, isinulat | `team-files/worker-11-14-prep.md` | kailangan ng beta.79 sa site para lumabas ang banner |
| | Opsyon 1: `tools/build/app-folder.js --worker` (+ release.yml) | `claude/worker-app-flag` @ 14882a5 (pushed sa pause; release.yml = kailangan ng GO STABLE ng user para sa main) | app folder na may flag, walang ?worker=1: eng_worker ALL PASS; walang flag: hindi nagsisimula (tama) |
| | B1: site.yml, Beta = main lang | `claude/site-beta-main` @ eada6e3 (pushed) → **naka-merge na sa main bilang PR #94** (177fcfd) | |
| | Point 12: crash path (code reading + headless probe) | prep file, "Point 12" | sirang op = bar + page engine (PASS); terminate = walang bar, nakatigil ang plant (FAIL) |
| | Point 12 ayos: heartbeat + watchdog + action error | `claude/worker-heartbeat` @ 4ce4694 (pushed sa pause) | eng_worker ALL PASS (+3: walang maling stop; terminate → bar 10.1 s, tuloy ang plant; action error → bar), eng_radio PASS. **Merged ni Lisa sa `claude/worker-fix-after-lt` @ 5dbd645** ('acting' ang pangalan doon); hindi pa tapos ang eng_worker doon |
| ~4:15 PM | eng-watch.js ping / pong (hiling ni Lisa) | `claude/worker-e-giselle` @ 4bb8e2f (pushed, **NOT FOR MERGE**) | nalampasan ng 5dbd645; hindi pinatakbo (TEST_LOCK); hindi kukunin ni Lisa |
| ~4:50 PM | Review ng C1 (a2357e8) | `team-files/progress/giselle-review-C1-a2357e8.md` (+ linya sa LISA.md RESUME HERE) | KNOWN BUG, tingnan sa 3 |
(*) ang oras ng hapon ay mula sa mga file at `date`.

## 2. Estado ngayon
- Mga branch ko (lahat naka-push, wala sa main): worker-c-giselle (merged), worker-d-giselle cadf889 (merged), worker-app-flag
  14882a5 (hinihintay ang desisyon ng user: worker ON sa apk / exe), worker-heartbeat 4ce4694 (nasa 5dbd645 na ni Lisa),
  worker-e-giselle 4bb8e2f (NOT FOR MERGE), site-beta-main eada6e3 (PR #94 sa main).
- Lokal na hindi naka-push: rebase copies sa `claude/worker-c-giselle` (34385a8, c82ae99): hindi na kailangan.
- Walang hawak na TEST_LOCK; walang process na tumatakbo.
- Hindi nasimulan: ang change-only ng ABC panel (gawain mula kay Jennie, trace ni Winter): walang code, walang commit.

## 3. Bukas / hindi nasubok
1. **KNOWN BUG C1** (giselle-review-C1-a2357e8.md): sa worker, ang Reset ay walang DITL150.clear (nananatili ang motor na sinimulan sa
   kamay), walang paglinis ng saved values (AN.sv / anSave), at walang "Reset done" / panel rebuild. Pinili ni Lisa:
   - sa kanya ang engine form ng Reset (DITL150.clear + sv);
   - **sa akin, pagkatapos ng resume:** (a) ang CHECK / UAT runners (uat/check.js 3079-3082, runner.js 46, scen.js 78 / 157 / 161 /
     383 / 397 / 458 / 723 / 766 / 1114) ay tatakbo sa page engine (local, walang worker); (b) ang Reset button (interaction.js
     337-346) ay maghihintay ng promise; (c) app.js 1593 `DITL150.apply()` ay maghihintay (app.js ay hindi ko file: kay Lisa / Jennie).
2. **Change-only ng ABC panel at drawing** (Winter `winter-fps-style-paint.md` §2): plant-window.js PU updaters 1087 / 1169 / 1243
   (+ 844, 1015, 1120, 1156, 1197, 1219, 1262, 1295 na babasahin pa), paint.js `text.bd` value labels, category-search.js 638 stchip.
   Isulat lang kapag nagbago (ang SA / ST rule ng hmi-sym.js), parehong itsura. Base: ang base ni Lisa (`claude/worker-fix-after-lt`).
   LOCAL commit; test ayon sa TEST_LOCK.
3. Hindi nasubok: ang apk sa totoong telepono, ang exe window, ang hang mismo (pareho ng terminate sa page), ang "Update now" (kailangan
   ng beta.79), ang buong Cold → 150 MW at Training (utos ng user, hindi akin).
4. Desisyon ng user: worker ON sa apk / exe (14882a5), at release.yml change (GO STABLE).

## 4. Saan itutuloy (RESUME HERE)
1. Basahin ang LISA.md RESUME HERE at hintayin ang base ni Lisa na may ayos ng Reset engine form.
2. Branch mula roon: `claude/worker-f-giselle`. Gawin ang 3.1 (a) at (b) (uat/* at interaction.js), at ang 3.2 (change-only).
3. Test ayon sa TEST_LOCK (CPU < 60, lock file, isang browser): eng_radio_giselle.js, eng_worker.js, at ang maiikling ABC page test
   (faceplate, force_manual, manstation, pid_am, pid_auto; PLAYWRIGHT_MODULE = main checkout node_modules/playwright, CHROMIUM =
   ms-playwright chromium_headless_shell-1248 ... chrome-headless-shell.exe; dangerouslyDisableSandbox para sa Chrome).
4. LOCAL commit, push sa sariling branch (ligtas na: ang Beta ay main lang), at ulat kay Lisa + Jennie.

## 5. Mga aral
- Ang `settle()` / `reset()` sa loob ng analog closure ay hindi `AN.settle` / `AN.reset`: ang wrap ng radio ay nakakakita lang ng AN.x.
- Ang argument ng action na isang object ng engine (sheet) ay dumarating bilang KOPYA sa worker; ipasa ayon sa pangalan / ref.
- Ang "fast" na tingin ng slot (val lang) ay nagtatago ng ibang field (fm): ang test na "reached the engine" ang nakahuli nito, hindi ang dump.
- Patunayan ang test sa lumang code (dapat bumagsak) bago sabihing nahuhuli nito ang bug.
- Ang Windows ay may hangganan sa haba ng path: mag-build ng apk / exe sa maikling folder (`%TEMP%\lsb`).
- Ang long action (Start at 150 MW) ay humaharang sa heartbeat: ang 'busy' / 'acting' mula sa worker ang tamang palugit, hindi ang oras ng page.
- Ang push ng kahit anong green branch ay nag-publish noon ng Beta site (naayos sa PR #94).
- Sundin ang TEST_LOCK; isang heavy run lang.
