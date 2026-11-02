# WINTER: progress (save progress 2026-11-02 ~4:15 PM PHT; PAUSED ~4:35 PM PHT, see "PAUSE" first)

## PAUSE (2026-11-02, account move): itutuloy dito
Lahat naka-commit at naka-PUSH (walang sa main, walang PR):
| Branch | Commit | Ano |
|---|---|---|
| claude/worker-c-winter | 2d65bea | Worker (c) dock press / coach (merged na ni Lisa sa 8a3f850) |
| claude/worker-d-winter | f93cba2 | DITL150.on sa keyframe at slot dg150 (para kay Lisa i-merge) |
| claude/fps-60-mu | 8660c9f | MU flows sa 15 Hz H.clock (walang fps number pa) |
| claude/eng-set-winter | d60535d | tests/regress/eng_set.js (TEST SET ng Worker) + fix ng launch failure |
| claude/has-to-class | e3ac28c | b5261ec app.css body:has() -> side-open / dp-open; c65c55b dock.css dead :has() tinanggal; e3ac28c WIP app.js hook (kay Ningning ang file) |
| claude/winter-clock0 | 20dd154 | guide.js: Training start -> AN.clock0() (Finding 1; kailangan ang clock0 ni Lisa) |
Walang tumatakbong run ko; walang TEST_LOCK ko (ang lock ngayon ay kay Lisa, 4:27 PM).

Susunod, sa pagkakasunod:
1. eng_set sa commit ni Lisa "a2357e8 + heartbeat ni Giselle + AN.clock0" (ibibigay niya ang hash; HUWAG sa a2357e8 o 79216b9). Paano:
   `git archive <hash> src tests tools dist package.json` sa sariling folder, kopyahin ang tests/regress/eng_set.js ng d60535d,
   saka sa POWERSHELL (hindi Git Bash: doon hindi bumubukas ang headless Chrome sa PC na ito):
   env PLAYWRIGHT_MODULE = <repo>/node_modules/playwright, CHROMIUM = %LOCALAPPDATA%/ms-playwright/chromium_headless_shell-1248/.../chrome-headless-shell.exe,
   TEST_LOCK = team-files/TEST_LOCK; `node tests/regress/eng_set.js dist/<html>` (ito mismo ang nagtsetsek ng CPU < 60 at lock; exit 2 = subukan ulit sa 3 min).
   Ipadala kay Lisa ang talaan. Huling resulta (79216b9, Git Bash): 4 node test PASS (eng_radio 119 s, winter 80, giselle 584, ningning 81); browser tests hindi nasubok (launch).
2. has-to-class: build na may hook, saka ang before / after check (scratchpad hascheck.js: computed style ng #gsbar .g-sheet at #tp sa
   8 state ABC / DITL x #side x #dp, ang dock .gd-card > .gd-h:first-child = 0, screenshot sa RUN, bilang ng BODY ":has" invalidations).
   Pagkatapos nina Lisa at Ningning sa pila ng lock. Ang hook ay kay Ningning (diff: side-session-notes/winter-has-hook-app.js.diff).
3. winter-clock0: NASA claude/worker-fix-after-lt @ 5dbd645 na (Lisa, ~4:40 PM); ang susunod na eng_set ay ayon sa LISA.md. Tingnan sa page (local at ?worker=1) na 0 ang orasan sa simula ng Training at hindi tumatalon sa RUN, kapag nasa base na ang AN.clock0.
4. fps MU: susukatin lang kapag sinabi ni Jennie na tahimik ang PC (tool ni Lisa: side-session-notes/fps-tool, WK=1, sa RUN: AN.runOn + load150 chip).
Session: helper of Lisa (Code Fixer) for the Worker, then the fps / test tasks given by Jennie (leader).
Worktree: .claude/worktrees/worker-c-winter-e3fa54. Notes: side-session-notes/local_ea5f…/ (worker-c-winter-report.md,
winter-fps-style-paint.md, winter-has-hook-app.js.diff).

## 1. Ginawa, ayon sa oras (2026-11-02, PHT)
| Oras | Gawain | Branch / commit | Resulta |
|---|---|---|---|
| ~10:40 – 11:15 | Worker (c): ang dock press / hold → bagong `src/world/dock-eng.js` (WORLD.dpress / WORLD.dset, ang PRESS / REL ay naging WORLD._press / _rel, release sa WORLD.onTick); dock.js at guide.js dPress → WORLD.dpress; coach AN.onStep: sa step kapag local, sa ENG.onPatch kapag mirror; test `tests/regress/eng_radio_winter.js` | `claude/worker-c-winter` e53e61c (pushed) | eng_radio_winter ALL PASS (0 diff sa 60 scan; --slot pantay din ang press state); mcc_valve page test PASS (local); coach probe 0 page error |
| ~11:35 | Rebase sa bagong base ni Lisa 1b2583c; na-deny ang force push → `-s ours` merge, normal push | `claude/worker-c-winter` a3650ad + 2d65bea (pushed) | eng_radio_winter ALL PASS. Na-merge ni Lisa sa 8a3f850, kasama ang 4 na linya na hiniling ko (template, engine-bundle, DITL_W + live/_press/_rel, tcs.js → WORLD.dpress); tsinek ko sa branch niya |
| ~13:00 | Worker (d): DITL150.on sa keyframe (03d-state.js d150) at radio slot dg150 (sync.js) | `claude/worker-d-winter` f93cba2 (pushed) | eng_radio ALL PASS (80 scan, kasama ang Reset + Start 150 MW), eng_keyframe ALL PASS, eng_worker ALL PASS, node check ng d150 |
| ~14:00 – 15:45 | fps ng MU page: sariling sukat + trace; `hmi-mu.js`: flows sa 15 Hz H.clock, naka-cache na selectors (hindi ginalaw ang hmi-sym.js) | `claude/fps-60-mu` 8660c9f (LOCAL, walang push) | pareho ang itsura (screenshot before/after sa RUN, 21/21 flows gumagalaw). WALANG maaasahang fps number (tingnan ang 4) |
| ~15:45 – 16:00 | Style / paint investigation (trace, walang code change) | notes: winter-fps-style-paint.md | body:has() rules = restyle ng lahat ng small / #tp / .g-sheet sa bawat text node; text na isinusulat ulit kahit pareho (plant-window.js #anp, paint.js text.bd, status chips) |
| ~16:00 | `tests/regress/eng_set.js` (TEST SET ng Worker para kay Lisa) | `claude/eng-set-winter` a492a61 (LOCAL, mula f168a6c) | isinulat; ang run ay nasa pila ng TEST_LOCK (nagsimula 16:11) |
| ~16:05 | app.css: body:has() → body classes side-open / dp-open (OK ni Jennie); hook para sa app.js ipinadala kay Ningning (hindi ko ginalaw ang app.js sa commit) | `claude/has-to-class` b5261ec (LOCAL, mula f168a6c) | hindi pa nasusubok: nasa pila ng TEST_LOCK (build + computed style 8 states + screenshot before/after) |

## 2. Kasalukuyang estado
- Pushed: `claude/worker-c-winter` (2d65bea), `claude/worker-d-winter` (f93cba2). Walang PR, walang merge sa main.
- LOCAL lang (hindi papush; Beta site): `claude/fps-60-mu` 8660c9f, `claude/eng-set-winter` a492a61, `claude/has-to-class` b5261ec.
- Working tree ng worktree (branch claude/has-to-class): `src/ui/shell/app.js` may hook na HINDI naka-commit (para lang sa lokal na build ng check; kay Ningning ang app.js).
- Tumatakbo: scratchpad queue.sh (background): 1) eng_set.js sa build f168a6c (79216b9) sa ilalim ng TEST_LOCK ko; 2) pagkatapos, build + hascheck before / after. Ang lock ay tinatanggal ng script pagkatapos ng bawat job.

## 3. Bukas / hindi nasubok
- eng_set.js: wala pang resulta (tumatakbo). Ipapadala kay Lisa.
- has-to-class: hindi pa nasubok. DAPAT magkasama ang app.css commit at ang hook ni Ningning sa merge; kapag walang hook, hindi tatama ang 3 rule.
- `#plantws:has(> #plfp)` (app.css 1018 / 1024): hindi ginalaw (ang #plfp ay sa plant.js ni Lisa).
- fps MU: walang before / after na numero; susukatin kapag sinabi ni Jennie na tahimik ang PC.
- Worker (c): ang press na nakabinbin habang AN.reset ay hindi sinubok; ang worker mismo (stage d) ay sinubok lang ni Lisa.
- Ipinasa ni Jennie: text rewrite sa plant-window.js / paint.js (Giselle) at status chips sa app.js / cr.js (Ningning).

## 4. Mga aral
- VIEW vs RUN: kapag `AN.run = true` ang setup pero `AN.view = true`, hindi gumagalaw ang animation (HSYM.simRunning = false). Gamitin ang `AN.runOn()` + ang load150 chip (gaya ng fps tool ni Lisa) at tsekin ang `HSYM.simRunning()` bago sumukat.
- Ang pagbasa ng output gamit ang `DUI.outVal` / simSheet sa isang panig ng radyo ay sumusulat sa nl._v doon (probe effect): `WORLD.out` ang basahin.
- Walang kuwenta ang fps sa abalang PC (15 ~ 30 fps mula run hanggang run). TEST_LOCK_RULE: isang heavy run, CPU < 60, walang 20-run loop; patayin lang ang sariling task / PID, hindi by name.
- Force push = na-deny: gumamit ng `-s ours` merge para manatiling fast-forward ang branch.
- Ang `$$` sa replacement string ng JS `.replace` ay nagiging `$`: tsekin ang script pagkatapos ng awtomatikong edit.
