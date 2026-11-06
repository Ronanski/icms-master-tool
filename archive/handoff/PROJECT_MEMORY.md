# PROJECT MEMORY (kopya ng project memory ng claude.ai, 2026-10-30 8:10 PM PHT)
> Kopya ng lahat ng project memory file ng project na "LOGIC_SIM_PROJECT" sa lumang account, para sa bagong account / Claude. Ang `HANDOFF.md` ang kasalukuyan at nananaig; ito ay background at kasaysayan ng mga desisyon (English, gaya ng orihinal). Kapag magkasalungat, sundin ang mas bago (tingnan ang petsa) at ang `HANDOFF.md`.
> Para sa bagong account: i-import ang mga ito sa project memory ng bagong project (ang index bilang `MEMORY.md`, at isang file bawat `## ` seksyon).

## MEMORY.md (index)

# LOGIC_SIM_PROJECT
- **HANDOFF FIRST:** repo `HANDOFF.md` is the one self-updating handoff file (state, threads, user orders, style, TEST SOP); every thread updates it at task end. New account setup + full memory copy: `docs/handoff/` (NEW_ACCOUNT_SETUP.md, PROJECT_MEMORY.md). See [[project-handoff-single-file]], [[feedback-live-test-sop]].
- USER CHANNEL (2026-10-30): User only keeps the LIVE TEST thread open on phone and watches tests on TV. Anything needing the user (GO BETA, approvals, questions) must ALSO be relayed via message_thread to the live test thread so the user sees it there.
- OPERATOR UI (2026-10-30): User approved mockup v7 ("G n yan"): https://claude.ai/artifact/Xjzj9XgmtT62qqiRF8zRQa . Real process graphic stays; step target pulses; mini pop-out per equipment (FIELD LOC/REM, MAN/AUTO, START/STOP Execute/Cancel, SOP line-up + DITL permissives live); dock is GUIDE ONLY (no "coach" word, never acts); alarm banner ACK + progress bar (44 sections); one HSYM style. Build thread: BUILD ANG OPERATOR UI cmsg_01V4rVM9gnpMDfWtQBoeoBk62jr5WSfQZirXgKvogMoYqs. Fixer thread (findings): cmsg_01V4rVM9gnpMDfWtQBoeoBk68gFTwUscfyfQ2mSKJp7KDe, beta.73; build thread next number. "G" = design approval, NOT GO BETA; merge only on GO BETA.
- STATUS 2026-10-30 8:10 PM PHT: main = beta.76 (PR #80, merged; beta.75 PR #78 before it). No open app PR. Mockup #16 (030/007 HSYM) waiting approval: https://claude.ai/artifact/N6DCUgSmrjXMgecVrpkWhA . Live test H1~H7 passed except items in the findings artifact; stopped at H8 (valve pop-out) on beta.74; next = retest H1 up to Turbine Oil after beta.76, done by the NEW account (user 2026-10-30 7:39 PM PHT: "Wala ng retest muna. Ung isang account n mgtutuloy nun.").
- STABLE PLAN (2026-10-30): "Go stable" became handover-only (no release). Stable 3.2.0 steps + risks: HANDOFF.md section 9; full live test findings + protocol: docs/handoff/LIVE_TEST_FINDINGS.md; skills copy in docs/handoff/skills/ ([[project-stable-plan-2026-10-30]]).
- Goals: 1) DCS logic simulator with plant model on/off; 2) plant simulator built on logic sim + plant model; 3) DCS library.
- MERGE RULE (user card 2026-10-30): Beta into main ONLY on GO BETA (same message); Stable + workflows ONLY on GO STABLE ([[feedback-merge-rule-go-beta]]).
- Repo: https://github.com/Ronanski/icms-master-tool . Read HANDOFF.md, CLAUDE.md, PROJECT_RULES.md, docs/SPEC.md first. Never merge to main, run workflows or release without explicit same-message GO (GO BETA / GO STABLE).
- User (turla-ece): DCS engineer, non-coder in the Philippines, Taglish (80% Tagalog), concise. Knows NOTHING about git/GitHub: explain in plain words or avoid. Knows DCS logic, not plant operation. Show all times in PHT.
- ASKING FOR APPROVAL / "G": FIRST explain in plain words what will be done, what changes, what will NOT happen, then ask. Threads too.
- REPORT POLICY: organized, clean, simple, NO self-made terms.
- NEVER claim implemented/seen unless verified on the real app (live test: read the app directly, NO screenshots, user 2026-10-31).
- SOP, logic and curves come from the plant DESIGNER. Unusual items: list as "UNUSUAL", user decides; never silently change. HMI snapshots are from a real scenario.
- APP WORDING: professional DCS terms (PV, SP, MV). Chat: explain simply.
- COLOR: RUN = RED, STOP = GREEN.
- SHORT GO: "go opus"/"go sonnet" = next roadmap step. Merge/release need explicit GO BETA / GO STABLE.
- User's "G" on something = do it. "BETA NA" = GO BETA. Do EXACTLY what the user ordered; don't over-message threads; "itigil" = stop only the named work. User gets very angry at delays/apologies: act, verify threads' real state (read_thread), report facts.
- Only start threads from roadmap or user's ask. Resolve finished threads.
- TEST SOP (2026-10-30): question is NOT a G; start at Step 1, one step per G; user only witnesses on his updated app; read the app directly before/after, NO screenshots (changed by user 2026-10-31); 12 CHECKS per step + 8 PATAKARAN (user approved 2026-10-31, HANDOFF 5), never reduced without the user OK; tester artifact https://claude.ai/artifact/L8PGXXkK7us2NBApNLqwid; on a fault: critical / chain → stop and fix, minor → log and continue, user decides (2026-10-30, [[retest-rules-new-account]]); answer questions with words, not actions ([[feedback-live-test-sop]]).
- NEW ACCOUNT (2026-10-30): Claude Code desktop on the user's PC. Claude = LEADER of 5 threads (HMI, APP UI/UX, CODE FIXER, DOCS, LIVE TESTER); threads are never archived; focus = live test Cold → full load in the built-in browser, all steps one per G ([[team-structure-leader]], [[retest-rules-new-account]]). Strategy is the user's call.
- SAVE PROGRESS (user 2026-10-31, DOCS thread): every update (skills, knowledge, action correction, instructions, memory) goes to the RIGHT thread first; repo MD files change ONLY when the user says "save progress" in the DOCS thread (leader requests included). HANDOFF 5 TEAM AT ROLES.
- HMI DESIGN #59 (user 2026-10-31, for the HMI thread): each equipment has SEPARATE buttons PERMISSIVE (Y / N: N green while not complete, Y when complete), MONITORING and TREND; CONTROLS sit on the equipment itself; several open at once. Mockup first. HANDOFF 4 + 5, LIVE_TEST_FINDINGS #59.
- VERSIONING: coordinator assigns ONE beta number. Stable 3.2.0 at the end on GO STABLE.
- HMI: Air & Flue Gas approved (hmi2.js). Seawater (hmi-sw.js, STEEL) done. One page per system, own art, RUN red/STOP green; live test also checks HMI for missing items.
- INSTRUMENT/VALVE LIST: coverage doc UNRELIABLE (#110). Search app AND repo logic first. Unconfirmed in logic: XV-FA1055-B2/B3, CL1061-B1/B2/C1/C2, MV-SW1003..1006. Docs in document-references/.
- TRAINING INTEGRITY: no coach, NO FORCE in Training, FIELD only for digital field items, process values only from plant model.
- Open decisions: "Laktawan 6 h" shortcut in H1.
- ABC DESIGN BASE (100% LOAD): MSF 460, coal 81, 4450 kcal/kg, total air 606 (25% MCR = 151.5), PA 380, SA 200, FA 26 T/H.

## Product spec (2026-10-26)
ONE WORLD = ABC + DITL sheets. VIEWER = signal tracing. SIMULATE plant OFF = user sets values; ON = physics + steam table. STARTING POINTS (plant ON): full load, cold start. TRAINING = cold to full load only. LIBRARY = IO list, wiring, loop diagrams, linears, compensations, memory list, instrument list, dictionary. Docs: docs/SPEC.md, docs/USER_CHECK.md.

## Roadmap
1,2,5,7 DONE. 3+4 Starting points + Training: operator UI + live retest in progress. 6 HMI: Air&Flue + Seawater done; rest per system on user's say. 8 Library last. 9 Stable only on GO STABLE.

## Decisions (settled)
Logic stays as parsed from DXF; HMI own graphics; plant ideal model; permissives via field-operator button (logged) or force in Simulate only; no bypass.

## Other facts
- v2.4.0 STABLE. User wants to be TOLD right after every merge. Threads can't delete remote branches: user deletes extras in GitHub (max 3 branches besides main).
- User PC (Remote Control): Dell Precision 3570, Win 11, repo at C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool.

## feedback-auto-beta

_feedback_ — User 2026-10-28 1:06 PM PHT: Beta is AUTOMATIC for every finished fix batch; only Stable (and merge to main) need his explicit GO

User (turla-ece) asked "Matic yan dpat dba beta? Kada may merge o changes?" then insisted: "Hnd pre. Stable lng ang need sakin. Itatak mo yan sa kokote mo."

**Why:** he wants the build he tests on his PC to always match the latest fixes; asking GO BETA every batch slows him down.

**How to apply:** every finished fix batch gets a new Beta number (X.Y.Z-beta.N, no duplicates) published without asking; announce version + build id + how to open; keep telling him which build the walkthrough thread tests (same build as his PC). Stable still needs explicit GO STABLE, and merge to main still needs explicit authorization. Supersedes the "GO BETA required" wording in older notes.

**SUPERSEDED 2026-10-30 (merge part):** merge to main only on GO BETA; see [[feedback-merge-rule-go-beta]].

## feedback-beta-automatic

_feedback_ — User 2026-10-28 1:06 PM PHT: Beta is AUTOMATIC (no GO BETA); every finished fix batch = new Beta number pushed; only Stable needs his GO

User (2026-10-28 ~1:06 PM PHT, firm: "Stable lng ang need sakin. Itatak mo yan sa kokote mo"): do NOT wait for GO BETA. Each finished batch of fixes is pushed right away as the next Beta number (X.Y.Z-beta.N, never duplicate; bump src/version.txt, rebuild dist, check, push to the working branch).

**Why:** waiting for GO BETA stalled his live testing; he only wants to control Stable.

**How to apply:** after build + check of a batch, push it as a new Beta and report version + build id. Only the Stable release (and merge to main) needs his explicit GO STABLE. Testing rule unchanged: [[feedback-test-at-end]].

**SUPERSEDED 2026-10-30 (merge part):** merge to main only on GO BETA; see [[feedback-merge-rule-go-beta]].

## feedback-check-like-user

_feedback_ — How a pre-Beta check must be done (user 2026-10-28 after R8): real UI clicks, 2 passes without clearing storage, report what is SEEN on screen per line

User (2026-10-28, via coordinator): "Ayaw ko na paulit ulit na pinapaayos natin tapos hindi pa rin pala naayos sa test." Beta.45 fixes #2/#47/#49 "passed" my check but failed his live test: my check read internal state (AN.cat, S.cur) from a clean browser with instant script clicks.

**Why:** the user's browser keeps leftover state (last sheet, running motors, Gabay pressed twice, app opened on an ABC sheet) and a human click lasts ~0.15 s (a panel redrawn 4×/s ate clicks). Beta.46 check found 3 more root causes only this way.

**How to apply:** before every Beta: Playwright persistent profile (no storage clear), 1366×768, click rail/dock buttons (never lsSetTab), slow mouse down/up for links, run pass A (leftover state) + pass B (opened on another sheet) + "Gabay: Cold" pressed twice; wait for the load to really finish (AN._loadP seen then cleared). Report per line "pindot → nakita" (sheet title in the centre, button text, header). Never release with a failing line. Only the exact steps fixed, no full Cold run ([[feedback-test-at-end]]).

## feedback-decide-dont-ask-plant

_feedback_ — User 2026-10-23 9:40 PM PHT: don't ask the user to confirm loop groupings or model assumptions; decide from drawings/procedures and state it. Utilities must be started and can trip.

I put a "Pakisuri" checklist in the loop map doc: are the groupings right, are utilities always ready, are the sources enough. The user replied: "hindi ko masasagot", "hindi ka ba sigurado?", "bkt tinatanong pa ito?"

**Rule:** decide engineering questions yourself, from the drawings, page links, PR-OPE procedures and manuals. Write them as decisions, not questions. Ask only about goals or preferences.

**Plant fact from the user:** utilities (seawater, aux cooling water, air compressors, industrial / make-up water, DO pump) are NOT always ready. They must be started, they have trips, and the plant cannot start without them. In the loop map they are loop 16.

**Why:** the user is learning the plant and expects Claude to be the expert; asking makes them feel the work is unsure.
**How to apply:** in plans and docs, write a "Mga desisyon" section instead of questions. Related: [[project-plant-model-truth-2026-10-23]].

## feedback-decision-cards

_feedback_ — User (turla-ece) wants every choice/approval posed as a clickable decision card (ask_decision); card taps do NOT reach a Remote Control session on the user's PC, only typed messages do (2026-10-17)

Whenever Claude needs a go / choice / approval from the user, post an `ask_decision` card in the thread with clickable options instead of asking them to type.

**Why:** user said (2026-10-17): "maglabas ka lang lagi ng decision card dito sa chat na pwede kong piliin thru click. nakakatamad na magtype e."

**How to apply:** label options in short Taglish, one recommended; questions like "simulan ang beta.18?", "push na?", "GO STABLE?" go on a card. LIMIT (confirmed 2026-10-17): a Remote Control session on the user's PC never receives card taps and the cloud thread Claude cannot send_message to it; it receives only the user's own TYPED messages in the thread. So for a decision that the PC session must act on, ask the user for one short typed phrase (e.g. "simulan beta.18"); cards only for decisions the cloud thread itself acts on. Related: [[project-local-remote-control-plan]].

## feedback-design-picks-2026-10-22

_feedback_ — User furious 2026-10-22 ~7:45 PM PHT about the design-pick page: put each design in its own artifact, never all designs in one page; then said "TAMA NA" (stop)

2026-10-22 19:42-19:47 PHT: user wrote "BAKIT BA PURO PUTI", then "AYAW KO NG PUTI???? SINO MAY SABI??" (Claude had misread it as "dislikes white colour" and promised to make the app dark). Then "WAG ILAGAY LAHAT NG DESIGN SA ISANG ARTIFACT" and finally "TAMA NA" (stop). Claude split the designs into 9 artifacts (styles 1-6, A, B, C), stopped all background tests, and paused. beta.6 is built locally but NOT pushed (branch claude/project-thread-8t4984, PR #38). No style was picked.

**Why:** a misread plus a cluttered single page made the user feel unheard.
**How to apply:** one design = one artifact, with images embedded as data URIs. Don't guess what a short angry message means and change the app because of it; ask in one line. Wait for the user before resuming after "tama na". Related: [[project-app-audit-2026-10-22]].

## feedback-device-focus-pc-tablet-landscape

_feedback_ — User 2026-10-30: focus on PC desktop and tablet LANDSCAPE only; phone and tablet portrait postponed; working functionality first

User (2026-10-30 ~8:05 AM PHT): "Focus muna tayo s PC VIEW AT TABLET VIEW NA LANDSCAPE. LETS FOCUS ON WORKING FUNCTIONALITY!!!" Mobile and tablet portrait views will be fixed later.

**Why:** time was going to layouts the user does not use yet; he wants the simulator to work first.
**How to apply:** check and screenshot only PC (1366 × 768 or larger) and tablet landscape (e.g. 1280 × 800). Do not test or spend time on phone or tablet portrait unless he asks. Don't list them as "not tested" items to chase. Related: [[feedback-testing-live]].

## feedback-full-report-every-milestone

_feedback_ — User (turla-ece) expects the full Problem / As Found / Work Done / As Left / Hindi nasubok / Susunod report in the thread at every milestone (push, Beta), without being asked

At every milestone (a push = Beta, a finished fix, a blocked step), the reply must carry the complete report in Taglish: Problem, As Found, Work Done (files), As Left (evidence: test names and numbers, commit, PR link), what was NOT checked, remaining issues / blockers, next action, and "what the operator sees in the app".

**Why:** 2026-10-17 the user asked "Asan ang report summary? do I need to tell u everything?" after a push was announced with one line only. PROJECT_RULES 6 and CLAUDE.md already require this shape.

**How to apply:** Never announce a push or a result with a one-liner; the one-liner goes together with the full report in the same reply. Related: [[logic-sim-project-rules]].

**Update 2026-10-18 18:57 PHT (supersedes length):** the user said reports are too technical and long ("di ako technical, babawan mo"). Keep the same headings but each one is 1 short plain-Taglish line in operator terms: no file names, block codes or test jargon; always say whether the app logic changed. Details stay in UPDATE_REPORT.md.

## feedback-full-self-check-before-ui-push

_feedback_ — User (turla-ece) got very angry 2026-10-19 18:34 PHT at piecemeal UI fixes (beta.7→8→9 for a missing Panel button); do a full self-check of every screen before any UI push

2026-10-19 the beta.7 layout removed the top-bar Panel button; the user could not find the panel ("NASAN NA SIDE PANEL", "WALA", "DI MATATAPOS TO KAKAAYOS PRE", swearing). beta.8 put Panel on the drawing corner (still not found), beta.9 put it in the top bar next to ⏱.

**Why:** each Beta fixed one thing and the user kept discovering the next defect on the device; they feel the work never ends.
**How to apply:** before any UI push, Claude itself walks every screen and state at tablet (1280×800, 800×1280), PC and phone size: ABC + DITL, VIEW + Run, panel open + closed, every tab, Operator mode, stored settings (auto-hide, ls.rightpane=o). Never remove a control the user already uses without a visible replacement in the same place. Ship one batched fix with one report, not a chain of single fixes. Also tell the user how to confirm the version (bottom-left vN) since the device may still run an older Beta. Related: [[project-ui-themes-2026-10-19]].

Tool: /mnt/project-files/ui-audit-2026-10-19/tools/fullcheck.js <outdir> <html> (93 screens + auto overlap/offscreen check). Used for 2.4.1-beta.10 (b2e581d): found phone tool row offscreen, phone operator panel covering, tablet-portrait panel cut by old 42vh rule.

## feedback-genuine-tests

_feedback_ — User 2026-10-25 10:29 PM PHT: tests are "not genuine". Test against references (SOP, FHI Fig 2, HMI snapshot, DITL permissives) with negative "bawal" tests, not "Training reached 150 MW"

User (2026-10-25 ~10:29 PM PHT, upset): "Hindi genuine ang test mo kaya dapat yan baguhin yang pamamaraan ng testing mo". The user caught the missing aux steam / vacuum / gland / turning gear that the tests missed.

**Why:** trace/human runs are driven by my own Training coaches. Passing only meant "the coaches reached Practice", so they could not catch gaps against the SOP.

**How to apply:**
- Acceptance = reference-based checks:
  1. Negative "bawal" tests per PR-OPE-5002 step precondition (e.g. roll without vacuum, vacuum without aux, coal with bed < 400). The app must refuse.
  2. Compare values and timing against FHI Fig. 2 and the HMI snapshot within a tolerance.
  3. SOP section coverage table: a missing section = FAIL, not "field lang".
- Report the result to the user as an SOP | dapat | app | PASS/FAIL table.

Related: [[reference-golden-startup-doc]].

## feedback-hmi-realism-2026-10-30

_feedback_ — User 2026-10-30 12:55 PM PHT rejected 036 Turbine Oil page as snapshot copy; every HMI page must show equipment internals with animation, clean continuous pipes, no text on art; proposal+mockup before app code

User on the 036 TURBINE OIL page (beta.66): "Ginaya lang ata ang sa snapshot", turbine is just a block with no rotor/blades/stator, no generator/exciter, values small and blurry, text on top of the art, crowded. Coordinator relayed to all HMI threads: do not copy the snapshot layout; show the real insides of each equipment and what happens, with animation. Also: "Iwasan ung mga halatang pinagdugtong. May laktaw... Professional dapat" (pipes).

**Why:** the user is a new operator learning; blocks and colours alone make him imagine the process.
**How to apply:** for every HMI page: cutaway of equipment internals (rotor, blades, bearings, windings, tube bundles); animations tied to state; ONE pipe renderer in layers (outline, body, flow) with rounded elbows, tees merged, crossings drawn as a bridge on top; names and values in their own lanes, values 20 px; proposal + mockup artifact first, app code only after the user's G.

2026-10-30 1:40 PM PHT v3 (same URL): app page with dock is only ~900 px wide, so a 1600-wide drawing shrinks to half. Fix = one page with 3 tabs (TURBINE & BEARINGS / LUBE OIL / CONTROL & TRIP OIL), each 1200x820, text 15 px, values 26 px; actuator cutaway + TRIP demo. User also ordered UNIFORM style for all HMI: Make-up Water thread builds the shared standard (hmi-sym.js); adopt it, do not make own library. Mockup: https://claude.ai/artifact/3YW3QZ3ak5pmcJ9zf9TYT5 (source /mnt/project-files/turbine-oil-proposal-2026-10-30/turbine-oil-v2.html). Bearing metal temp / vibration tags (TEST1009/1010, TEGE1001/1002, VEST/VEGE) are not yet in the plant model; waiting for the user's approval. Related: [[feedback-hmi-style-2026-10-27]], [[project-hmi-seawater-030]].

## feedback-hmi-style-2026-10-27

_feedback_ — New HMI style history: flat ISA-101 grey and pastel block-diagram styles were rejected ("gawang bata", "kulay lang binago"); v3 dark shaded process mimic shown 2026-10-27 02:35 PHT

User rejected the Air & Flue Gas sample twice. The first style used pastel chips and thick colored ducts. The second was a flat ISA-101 grey recolor of the same layout ("Gawang bata, kulay lng binago. Same style. Same design. Eww. Do better.").

v3 (PR #49, src/ui/plant/hmi2.js, screenshots in /mnt/project-files/hmi-sample-2026-10-26/v3/) uses a new composition, not a recolor:
- dark slate background, title bar with header, alarm banner, navigation bar;
- shaded steel equipment drawn like plant equipment;
- animated flow marks in ducts and spinning fans;
- ISA bubble plus value box at each instrument;
- loop tag beside its damper;
- live trend.
It is waiting for the user's OK.

**Why:** the user judges by the whole look and layout. A palette change on the same layout reads as no change.
**How to apply:** when restyling, change composition and equipment drawing, and compare the result side by side with the control-room snapshot before showing it. Never present a recolor as a redesign. Related: [[feedback-own-the-ux-2026-10-22]].

Audit 2026-10-27 (thread "Audit HMI graphics quality", PR #51, docs only): user says FLOW is OK, the equipment drawing/art is the problem. Childish cues found in v3: conveyor-belt dashed ducts, big triangle arrows, swirl-icon fans, big red/green M squares, furnace glow + bricks, striped stack, mixed styles, white ISA bubbles, cyan everywhere, empty trend. Rules + SVG symbol library: docs/hmi/HMI_ART_SPEC.md, docs/hmi/symbols/ (sent to the HMI thread to adopt).

2026-10-27 09:20 PHT: the user found v5 still too big. They asked for "2D pero medyo realistic na may animation" and at least 3 NEW styles. 3 standalone proposal pages were made (same approved flow; values from the 150 MW snapshot), one artifact each:
- A Steel: https://claude.ai/artifact/2ePyUh23e1WL1P3QreVCcL
- B Cutaway (light): https://claude.ai/artifact/EYKcfNoRkfe4viUxfeETqu
- C Thermal: https://claude.ai/artifact/VBt7zshjYGu3qr2wCJ9bvc

Source and PNGs are in /mnt/project-files/hmi-proposals-2026-10-27/. Waiting for the user's pick. The app (PR #49) is unchanged.

2026-10-27 09:34 PHT: the user picked CUTAWAY ("yung cutaway muna gawin. temporary"). It is now in the app (PR #49, src/ui/plant/hmi2.js, live links), and every animation follows a live signal. The pick is temporary: the user may come back to the style later.

2026-10-27 11:55 PHT: the user wants all 3 styles as options, so the app now has STYLE buttons (CUTAWAY default / STEEL / THERMAL; localStorage key ls-hmi-style).
User complaint "pipes parang pinagpatong na rectangle": fixed with ONE pipe renderer (continuous rounded paths drawn in layers over all ducts). Use it for every future screen.

2026-10-27 12:05 PHT complaint: "daming kulang na tags, walang descriptions, di kita internals/external pipes". Rule for every HMI screen: show EVERY instrument from the P&ID (T, P, F, L, analyzers, motor currents) with a short description under each tag; draw internals (tube banks, sectors, plates) and water/steam pipes besides ducts; colour by medium plus cold/hot legend. Tags with no logic signal = plant estimate marked with a dot (never hidden). Air & flue gas P&ID = K1AU3-PD-051~054 = RA flow-diagram PDF pages 42~45. APH is Ljungstrom rotary (PA/SA/GAS sectors), not tubular. Done 12:32 PHT (PR #49), waiting for user OK.
2026-10-27 14:57 PHT: user APPROVED the Air & Flue Gas page ("Ok n yan, air and flue gas system page lng muna"). Do NOT build the other 13 screens until the user says so. PR #49 is waiting for integration at the end of the roadmap.

## feedback-live-test-sop

_feedback_ — TEST SOP for live tests (2026-10-30): question is not G, start Step 1, one step per G, user witnesses only, screenshots, stop at first fault

User 2026-10-30 ~9:15 AM PHT, angry: "HINDI KAYO NATUTUTO?" (a thread treated "pwede na ba magtest?" as a go).

TEST SOP (in repo: HANDOFF.md section 5 + CLAUDE.md hard rules, PR #68):
1. A question like "pwede na ba magtest?" is NOT a G. No live test until the user writes "G" in the test thread.
2. Always start at Step 1, in order, ONE step per G.
3. User is the WITNESS on his own app after "Update now" and the right version shows; he clicks nothing.
4. Screenshot before and after every step; stop at the first fault and report. **CHANGED by user:** stop rule 2026-10-30 ([[retest-rules-new-account]]); screenshots replaced 2026-10-31 by reading the app directly (text, values, colours, position), no screenshots.
5. A question gets an answer, never an action.

**Why:** repeated mistakes made the user feel threads never learn.
**How to apply:** give these 5 rules to every test thread up front. Related: [[feedback-testing-live]], [[project-handoff-single-file]].

## feedback-merge-auto

_feedback_ — User 2026-10-28 9:36 PM PHT (very angry): what we test must already be merged to main automatically; few branches; only Stable needs GO STABLE

User (turla-ece): "KUNG ANO ANG TINETEST NATIN DAPAT NAKA MERGE NA ETO AGAD!!! SA RELEASE NG STABLE LNG MAY GO!!" and "AYAW KO NG MDAMING BRANCH". Also: official or own Beta tests must be automatic, no token waste, never make him remind again.

**Why:** he tests the build on his PC; many open PRs/branches confused him and builds diverged.

**How to apply:** every finished fix batch: merge to main (no GO needed), Beta number from main, delete merged branches you can. Only the Stable release needs GO STABLE in the same message. Supersedes "never merge to main without GO" in older notes ([[feedback-auto-beta]]). Pre-Beta check = short real-click probe of the fixed lines only, 7 parts per fix (Training list, dock, header, logic sheet, new steel HMI Air & Flue Gas, status bar, events) ([[feedback-check-like-user]]).

**Update 2026-10-28 10:10 PM PHT (user):** branch cleanup allowed; "Wag palampasin ng 3 floating branch ang repo" = never more than 3 branches besides main; always push/merge cleanly. Plant view: only 2 HMI pages (new HMI Air & Flue Gas + the PID/MAN controllers page); old HMI pages deleted.

**SUPERSEDED 2026-10-30 (merge part):** merge to main only on GO BETA; see [[feedback-merge-rule-go-beta]].

## feedback-merge-rule-go-beta

_feedback_ — User 2026-10-30 8:00 PM PHT card answer: Beta enters main ONLY on GO BETA in the same message; Stable and workflows ONLY on GO STABLE

User picked "Sa GO BETA mo lang" (answered "0") on the card "Kailan puwedeng ilagay sa main (site Beta) ang bagong Beta?" 2026-10-30 ~8:00 PM PHT.

Rule: push to a working branch needs no GO. Merge to `main` (= Beta site) only on the user's GO BETA in that same message ("BETA NA" = GO BETA). Stable release and any manual workflow run (release.yml, clean-releases.yml) only on GO STABLE. GO BETA never authorizes Stable.

**Why:** ends the conflict between CLAUDE.md ("GO STABLE for merge"), the 2026-10-28 "auto merge, no GO" order and practice since beta.56 (GO BETA).
**How to apply:** written into CLAUDE.md, PROJECT_RULES 4, README, HANDOFF 5. Supersedes [[feedback-merge-auto]], [[feedback-auto-beta]], [[feedback-beta-automatic]] on the merge part.

## feedback-never-idle-after-push

_feedback_ — User (turla-ece) cursed ("inamo") 2026-10-22 18:25 PHT after Claude went idle ~1h40m after pushing a Beta although the next approved phase (P4) was pending

After a push/report, if the next phase or task is already approved, Claude must keep working in the same turn (start the next phase immediately), not end the turn and wait. Ending a turn with no background work and no scheduled wake = the thread stalls until the user asks "update?".

**Why:** 2026-10-22 3.2.0-beta.4 was pushed 4:45 PM PHT, Claude said "Susunod ang P4" and stopped; user asked "update?" at 6:23 PM and then cursed.

**How to apply:** before ending a turn, check: is approved work still pending? If yes, continue it now. If a long run must be awaited, start it in the background and keep working on the next item. Related: [[feedback-no-idle-waiting]], [[feedback-progress-updates]].

## feedback-no-idle-waiting

_feedback_ — User (turla-ece, 2026-10-18 13:00 PHT) was upset that a 5-hour session ended with idle waiting on a background test run; never block the next task on a long non-blocking test, work in parallel

While a long headless run (regression, generic tester ~2 h, full chain) runs in the background, Claude does the next task (docs, guide, analysis, code that does not need the browser) instead of waiting for the result. A non-blocking extra regression (generic tester) never delays a push: push with the finished regression, report the extra run later. Only one headless Chromium run at a time in the cloud container (two runs share the browser profile and kill each other; killing one hung the other).

**Why:** 2026-10-18 the user wrote at 13:00 PHT "8am ako nagchat, 1pm na, wala pa rin katapusan?" after beta.20 waited on the generic tester. Also, posted ETAs slipped three times (10:15 → 10:30 → 11:30 → 11:55 PHT).

**How to apply:** give one honest ETA with margin; when a long run starts, immediately start the next deliverable; report the run when it finishes. Related: [[feedback-progress-updates]], [[user-eta-philippine-time]].

## feedback-own-the-ux-2026-10-22

_feedback_ — User 2026-10-22 19:51 PHT (furious): Claude must own the whole UX/visual design (what to show, what each control is for, sizes, spacing); the user only picks/approves; reports must name each test and what it proved

User: "ANG GUSTO KO MAAYOS NA VISUALS... WALA AKONG GAGAWIN DITO PURO PILI LANG AKO. YUNG MGA BUTTON WALA NAMAN NAAAYOS... WALANG OUT OF THE BOX THINKING... WALANG SARILING DESISYON ANO ANG DAPAT MAKITA SA APP, ANO ANG GAMIT, TAMANG SIZE, SPACING". Also: "NAGSASABI KA NG PASS PERO HINDI SPECIFIC KUNG ANONG TEST ANG PASS".

**Why:** the engine, simulation and plant model already work; the user feels the experience and visuals were never really redesigned, only patched. Earlier colour-only themes and mockup galleries pushed design decisions back to the user.
**How to apply:** Claude decides the information architecture, controls, sizes and spacing itself (as a senior product designer for a DCS operator/engineer tool), shows ONE finished, opinionated result built on real app screenshots, and asks only yes/adjust. Never report a bare "PASS": say which check and what the operator sees. Related: [[feedback-design-picks-2026-10-22]], [[feedback-full-self-check-before-ui-push]].

## feedback-own-ux-decisions

_feedback_ — 2026-10-22 19:51 PHT user (furious) wants Claude to own the whole UX/visual redesign decisions; user only picks; name exact tests when saying pass

User: engine, simulation and plant model already work; what is missing is the actual experience and overall visuals. Claude keeps fixating on the existing layout, buttons still not fixed, no out-of-the-box thinking. Claude must decide itself what the app should show, what each feature is for, what new uses it could have, correct sizes and spacing; user will only pick between finished options and do nothing else. Also: never say "pass" without naming the specific test and what it checked.

**Why:** user cursed repeatedly; felt the redesign was only small tweaks of the current app and reports were vague.
**How to apply:** for UI work, rethink the product from scratch (operator/engineer workflows), present distinct full redesigns (dark DCS-style is fine; embed images; one design per artifact), then implement the pick fully. Reports list each test by name with what it proves. Related: [[feedback-never-idle-after-push]].

## feedback-progress-updates

_feedback_ — User (turla-ece) wants progress updates during long runs every 20 minutes (changed from 5 min on 2026-10-17 because 5-min updates cluttered the thread), with ETA in PHT

During long work (regression, a Beta being built, a session on the user's PC), post a short progress reply every 20 minutes, with what is done, what is running, and an ETA in PHT (GMT+8). Not more often: a 5-minute cadence was rejected as "masyado makalat" (2026-10-17 01:16 PHT). A milestone or a blocker is posted when it happens, regardless of the cadence.

**Why:** the user wants to follow without scrolling through clutter; they asked for 5 min first, then cut it to 20 min the same night.

**How to apply:** one reply of 3 ~ 5 lines; merge the laptop (Remote Control) status and the cloud status into one message; skip the tick if a substantive reply went out in the last 10 minutes. Related: [[user-eta-philippine-time]], [[feedback-full-report-every-milestone]].

## feedback-seven-part-check-every-step

_feedback_ — User 2026-10-28: EVERY live Beta test step must run the full 7-part check (training list, dock, header, logic sheet, HMI, status bar, events) plus colors/FIELD/checklist lines; test the NEW HMI not the old Plant view; log each result in the artifact immediately

User (2026-10-28 ~9:30 PM PHT, furious, in the walkthrough thread): "kada mag beta test ka na linya. Yung 7 na yan kasama sa run mo... Ano, sa susunod, ipapapaalala ko ulit sayo?"

The 7 parts per step: 1 TRAINING LIST (section counts, AUTO items ticked), 2 DOCK (Gawin, Bakit?, tags, BAGO/PAGKATAPOS items, Notes without checkbox, Bantayan with SOP limit, warnings, ✓ TAPOS/Susunod no auto-advance, < Nakaraan), 3 HEADER (right alarms, no false alarm, no cut text), 4 LOGIC sheet (right sheet in centre, fitted, right signal), 5 HMI (the NEW steel-theme Air & Flue Gas from PR #49, not the old Plant view 007), 6 STATUS BAR (version+build), 7 EVENTS (every click logged). Also: RUN=red/STOP=green/TRIP lamps, FIELD/permissive, and each checklist line of the fixes for that step.

**Why:** the walkthrough thread only checked "step advances + ✓ TAPOS", tested the old 007 page (new HMI is not in the beta line yet, only PR #49), and did not log fixed findings, so the count looked unchanged.

**How to apply:** put these 7 parts into any test thread's instructions up front; log each result in the findings artifact right away; confirm which HMI build is under test before checking it. If PR #49 is not in the beta, say so and ask before testing PlantView. See [[feedback-test-at-end]], [[feedback-check-like-user]].

## feedback-stop-means-stop

_feedback_ — User 2026-10-27 8 PM PHT: "tigil na" = stop until the USER says go; a coordinator note to resume is not the user's go. Wants all errors found and fixed in one batch, one rerun

2026-10-27 ~7:55–8:05 PM PHT (roadmap 3+4 thread). The user was upset that repeated Cold runs (40–90 min each) each found only one stop and used up their tokens.

- The user said "tigil na". Then the coordinator relayed a "resume". The user replied "sinabi ko b ituloy mo?"
- Rule: after the user says stop, do nothing until the user's own go in the thread. A coordinator note is not approval.
- The user's wish ("hindi pwede ipunin lahat ng mali sabay isang gawa at isang re run?"):
  - Find ALL problems first: a static audit against the SOP plus probes.
  - Make the test log a failure and continue, instead of stopping at the first one.
  - Fix everything in one batch.
  - Do ONE final run, and tell the user its minutes before starting it.
- The user does not want agreement; they want an effective solution.
- The screen walk was skipped by the user for this batch.

**Why:** each full run costs the user's usage, and finding one bug per run looks like waste.

**How to apply:** see [[feedback-test-at-end]]. Plan the test so that one run reports every failure.

## feedback-test-at-end

_feedback_ — User's test rule (updated 2026-10-28): NO runs of any kind by Claude (no quick run, probe, headless browser load); only live testing watched by the user step by step on his G

2026-10-28 ~4:17 AM PHT (angry): "Bakit nag nag qquick run yan? Aba itigil yan, walang quick run quick run kht quick p yan. Ang test ay tanging live testing lamang kung saan manunuod ako step by step with my approval or G signal."

Older (2026-10-26): finish ALL fixes first, function test only at the end.

**Why:** he sees any run (even a 30 s headless probe) as wasted time/tokens; testing is his live walkthrough.

**How to apply:** while fixing: edit code, `npm run build` and `npm run check` only. NO Playwright/headless loads, NO probes, NO checkpoint/Cold/quick runs, not even "to diagnose". Diagnose by reading code and drawings. The only test = live walkthrough the user watches, one step per his G. Say "hindi nasubok" honestly in reports. See [[project-docs-lean-2026-10-26]].

**Update 2026-10-28 ~3:00 PM PHT (user, relayed):** "basta hindi patatakbuhin ang buong start-up, yung specific lang na part na un ang test. payag ako." A SHORT automated check (a few minutes, Chromium) of only the fixed parts / the check-list lines is ALLOWED before each Beta, with pass/fail per finding. Still NO full start-up, NO Cold → 150 MW run, NO long tests.

**Update 2026-10-29 ~11:28 AM PHT (user):** "Hindi k nmn pinapatest ng hanggang 150MW ah? Pinapasa niyo kc ung test niong sarili..." Never present my own check as "pasado"/done. Do not list "buong Cold → 150 MW: hindi sinubok" in reports (it reads as if one was expected). Report only: what was fixed, the exact steps looked at, what was not looked at; the user's live test is the judge.

## feedback-testing-live

_feedback_ — User rule 2026-10-30: ALL testing in every thread must be LIVE on the real app with screenshots, not code reading or unit tests

User (2026-10-30 00:18 PHT): "LAHAT NG TESTING LIVE KHT SAAN THREAD P YN. UNG CODE SA INYO N YUN" (all testing, in any thread, is LIVE; the code is ours).

**Why:** earlier reports claimed fixes checked on only a few steps (1, 2, 34, 35) and the user found faults in the real app.
**How to apply:** prove every change by driving the real built app (dist html) step by step through the real user flow (e.g. Training button → Gabay in the dock), read each screen directly (screenshots dropped by user 2026-10-31), and check EVERY step/section, not samples. Report which items were checked live and which were not. Related: [[project-training-dock-mock]].

2026-10-30: "live" = user WITNESSES every check on his own app after pressing the app's "Update now" (not a local copy, not headless). Headless runs are not live tests; don't call them live.

## feedback-view-vs-run-and-training

_feedback_ — User rule 2026-10-23 2:15 PM PHT: VIEW mode must do everything except simulate / force / control; keep the two modes clearly separate. Do not touch the Training workspace yet.

User (2026-10-23 14:15 PHT, all caps): "may mga features na sa RUN lang gumagana at sa VIEW hindi. Dapat sa VIEW nagagawa mo lahat, maliban lang sa SIMULATE / FORCE / CONTROL. Malinaw dapat ang hiwalay na function ng dalawa. Gamitin mo ang app, lahat i-check mo mula kaibuturan."
Also: "ung TRAINING module / workspace, wag mo munang galawin, may naiisip akong maganda para doon."
They also said many inputs "hindi nafoforce" that could be forced in the old version, and that they are too lazy to type bug lists.

**Why:** the user found features locked in VIEW that are pure looking/tracing; they want to explore without running.
**How to apply:** audit every control on every page in VIEW and in RUN (ABC, DITL, Plant view, Library, F(X), Inspector, info card, search, panels). In VIEW only simulate / force / control (A/M/R, SV, MV, switches) may be locked. Find bugs by using the app yourself, never ask the user to list them. Leave Training (home.js training part) unchanged until the user shares their idea. Related: [[project-beta8-guided-workbench]].

## hmi-redesign-2026-10-30

_project_ — User order 2026-10-30 to redesign all HMI pages (animations, continuous pipes, not snapshot copies) and the shared symbol library rule

User (turla-ece, 2026-10-30 ~12:58 PM PHT): HMI pages look like drafts. Do not copy snapshot layout; show what really happens in each equipment with animations (flow, rotation, level, heat), not just blocks and colors. Pipes must be continuous and professional, with no visible splices or gaps.

- Each HMI thread first shows a proposal plus a mockup and waits for the user's OK before merging anything.
- (user 2026-10-30 1:18 PM PHT) ALL HMI pages must have ONE uniform style. The shared symbol library and style standard is `src/ui/plant/hmi-sym.js`, built by the Make-up Water thread. Other HMI threads must not build their own library; they use this one after their mockup is approved.
- 027 Closed Cooling Water: HANDED OVER 2026-10-30 1:32 PM PHT to the single HMI thread (Make-up Water, cmsg_01V4rVM9gnpMDfWtQBoeoBk6WGtjyvtTQ5Cjezt6xgGLdo); user: only ONE thread makes HMI. Handover doc: /mnt/project-files/hmi-ccw-2026-10-30/HANDOVER-CCW.md. PR #73 (beta.69) is held. The mockup is https://claude.ai/artifact/D54onHnG7gzjs91mBv1xFg and is waiting for the user's OK. The coordinator renumbers the beta if another thread merges first.

**Why:** the user rejected the draft look of the pages.
**How to apply:** any HMI work must go mockup → user OK → apply with hmi-sym.js → check → merge.

## hmi-symbol-library

_project_ — Shared HMI symbol library src/ui/plant/hmi-sym.js is built by the Make-up Water thread; other HMI pages must reuse it, not make their own

Since 2026-10-30, the Make-up Water thread owns the shared HMI symbol library at `src/ui/plant/hmi-sym.js` (pumps, compressors, valves, tanks, animated pipes, and so on).

The user also said (2026-10-30): every HMI page must have a UNIFORM style. The user wants every HMI page to have animated, real-looking equipment and continuous, professional pipes (no visible joins or gaps).

ONE HMI THREAD ONLY (user 2026-10-30): the Make-up Water thread builds all HMI pages. The IA/PA work was handed over to it: v1 mockup https://claude.ai/artifact/3SDsx6g34HNxwpJ2zfnrQC, v2 in HSYM style /mnt/project-files/ia-hmi/ia-v2.html (not yet approved).

**Why:** a single look across all pages, and no duplicated symbol code.

**How to apply:** any thread that implements an improved HMI page waits for `hmi-sym.js` and builds on it. Do not write a separate symbol library. See [[hmi-pages]].

## operator-ui-mockup

_project_ — Approved operator UI mockup (2026-10-30): link, key decisions, and which thread builds it

Operator UI mockup v3 (HMI thread, 2026-10-30): https://claude.ai/artifact/9bXtfVRUnDvvMAY8K2LKuv. Source: /mnt/project-files/ui-dcs-flow-2026-10-30/dcs-flow-mockup.html.

- User approved building it (via coordinator, 2026-10-30).
- Built by the thread "BUILD ANG OPERATOR UI" (cmsg_01V4rVM9gnpMDfWtQBoeoBk62jr5WSfQZirXgKvogMoYqs), not the HMI thread.

Decisions:
- The dock is a guide only. It shows GAWIN, BAKIT, Go to and 3 step values.
- The SOP list shows only the remaining items.
- TAPOS means only that the whole step is done.
- A pop-out faceplate opens beside the clicked equipment. Its permissives come from LOGIC (DITL row) and from the SOP line-up.
- Colour marks abnormal only:
  - An in-band value is not green, because green = STOP. Out of the SOP band is amber.
  - "Hindi pa handa" is grey, interlock amber, trip red.
- The progress bar uses 44 sections (pr-ope-5002.js), not 48.

**Why:** the user ordered "mas magaling ka dapat mag isip ng UI".

**How to apply:** follow this for every faceplate and dock change. See also [[hmi-style-standard]].

## project-app-audit-2026-10-22

_project_ — Full UI/functional audit of 3.1.0-beta.7 (2026-10-22): key bugs (Plant view click dead, Plant view not live if opened first), two diverged Beta lines, report links

2026-10-22 ~1 PM PHT, thread "Full app quality audit" (audit only, no code change). Audited 3.1.0-beta.7 (PR #37, branch claude/design-system-extraction-4dogzg). Report: https://claude.ai/artifact/3RbWZ8V96QbzL1y6ZMAH18 ; copy + playwright scripts in /mnt/project-files/app-audit-2026-10-22/ (tools/f9.mjs = real-click test, f3.mjs = linked count).

Key verified findings (also in v2.4.0 and 2.5.0-beta.20):
- C1 Plant view: real mouse/touch click on a controller never opens faceplate; click retargeted to svg#plsvg by setPointerCapture (src/ui/plant/plant.js ~680) and 20/51 UNIT hits covered by text. tests/regress/plant_view.js calls lsPlantFp directly, so it misses this.
- C2 Plant view opened before ABC: LIVE 6/51 (UNIT), 3/94 (003); links resolved once before ABC sheets load. ABC first: 51/51, 50/94.
- C3 PR #37 (3.x UI, off v2.4.0) lacks 41 commits of PR #34/#35 (drawing audit fixes, new DITL pages, HMI 1:1). Must merge lines before any Stable.
- LICBR1001 negative MV is correct (ML -25 / MH 25), not a bug.

Redesign proposal "Control Room" (2026-10-22 ~12:50 PM PHT): https://claude.ai/artifact/Qk9hqE5yBjy4EYXrXXFmPR ; copy + mockup sources in /mnt/project-files/app-audit-2026-10-22/redesign/. Phases P0 bugs+merge, P1 engine check, P2 shell, P3 screens, P4 responsive. Waiting on user's pick.

Status 2026-10-22 ~1:50 PM PHT: user approved ALL redesign phases (card). 3.2.0-beta.1 pushed: branch claude/project-thread-8t4984, PR #38 (merge of PR #37 look onto PR #34/#35 logic + C1/C2/M3/M5/L2 fixes). layout.js kept only for DITL panel tabs. Next: P1 engine check, P2 Control Room shell.

Status 2026-10-22 ~3:10 PM PHT: 3.2.0-beta.2 (ABC Inspector button / Focus fix found by full regression). P1 done (17555f3): no engine error; audit230 LINK-1 test updated (80S-57 -> (S22)DITL-80S out 57 TORQUE per PDF). Pending P3 item: DITL-80S output row TEXT in panel/export is shifted one row up (labels start above wire); drawing/links/model correct. Now on P2. Regression runner: scratchpad r1/run.sh is flawed for closure/ditl_export args; refcheck needs `pip install xlrd`.

Status 2026-10-22 ~4:05 PM PHT: 3.2.0-beta.3 pushed (27315d7, PR #38): P2 Control Room shell = src/ui/shell/cr.js (rail/unit band/alarm banner, >=900px only; narrower keeps old bar) + .ddm.ddm-open fix (gear/Start menus were empty since beta.1). Test shell_cr.js. Tests now look for tabs in ':is(#gsbar,#crrail) .tabs'. Next: P3 screens, then P4 phone.

Status 2026-10-22 ~4:40 PM PHT: 3.2.0-beta.4 pushed (53e8268, PR #38): P3 = Plant view full width + screen picker + docked faceplate (plant.js lay()/keepZoom), DITL 80S output text from nearest wire (ditl.js rsNear, display only), #tp hidden while #dp open + 'Edit presets', sheet group titles not sticky, Inspector comes from/goes to, search row under top area <=1280. Test p3_screens.js. User asked 'di ko mapindot ang option button' (4:27 PM): could not reproduce ⚙ in emulation; asked which button/device. Next: P4.

Status 2026-10-22 7:05 PM PHT: 3.2.0-beta.5 pushed (c6819c0, PR #38): P4 phone = bottom tab bar (cr.js phone(), #crnav inside #sfoot), plant fp bottom sheet, #tp hidden on phone, Library aria; axe 0 violations. P0-P4 all done. 'Option button' issue was old beta on device (fixed in beta.3). Next: user device check; Stable only on GO STABLE.

Status 2026-10-22 7:15 PM PHT: user pasted a much larger 14-section prompt ("COMPREHENSIVE ENGINEERING AUDIT, ENTERPRISE REDESIGN") and asked if all of it was done; answer: no, only UI part. Plan promised: A UI re-audit+fixes (beta.6) ~8:30 PM, B engine verification report ~10:30 PM, C import/parsing audit ~12 AM, D signals/forcing/HMI paths ~1:30 AM, E consolidated P0-P3 report + design system + HANDOFF ~2:30 AM. Keep going without idling.

**How to apply:** if the user approves fixes, start with the merge decision (C3), then phase 1 bug fixes with real-click tests. Waiting on decision cards posted in the thread.

## project-beta25-training-human-path

_project_ — 3.2.0-beta.25 (2026-10-24, PR #40 stacked on #39, branch claude/project-thread-2qon2r): Training drum filling fixed after user found scripts passed but real clicks failed

User 2026-10-24 ~10 PM PHT: "PASADO SAU, SAKEN HINDI?" — guide script passed, manual Training failed (drum filling impossible, wrong sheets, LT values differ).

Root causes found by clicking like a human: dock faceplate had no CSS (no ▲▼, MV readonly); dock interlock read analog rows (DITL-23A row 12 suction pressure) as digital so BFWP START stayed blocked; interlock box rebuilt every 0.5 s ate taps; Cold drum already full so the fill step auto-completed; LT-2 (AI0258) never written by the drum model.

Fix pushed as 3.2.0-beta.25 (d59a421). Guide Cold = drained drum -400 mm (AN.drumSet). New test tests/regress/training_drum.js (real clicks only).

**Why:** scripts that call a.f()/A.man directly bypass the blocked UI the user sees.
**How to apply:** every Training/UI test must click the same card buttons and faceplate ▲▼ the operator uses. Open items: DITL page cannot show instance #B/#C (feeder B/C, pump B show machine A drawing); no BFWP aux LOP (DITL-22) step. Related: [[project-training-dock-2026-10-24]].

## project-beta33-ditl-instances

_project_ — 3.2.0-beta.33 (2026-10-25, PR #41 stacked on #39, branch claude/project-thread-1mcs5i): DITL A/B/C/D copies are real pages with own addresses

2026-10-25 ~2:15 PM PHT: CHECKLIST 0.2 done, pushed 9cd5b73, PR #41 (base claude/project-thread-vhcfv9 = beta.32 / PR #39). Not merged.

- Address table generated by tools/world/inst_addr.js -> src/world/inst-addr.js (rerun when DITL import or I/O/memory list changes).
- Human run (tools/training/human_run.js) reached 150 MW + Practice on beta.33. One earlier run stuck once at step 33 (burner C/D all out at 14 kg/cm2); two reruns passed, cause not found (possibly flaky / CPU load with parallel runs).

2026-10-25 ~3:30 PM PHT: beta.34 (bc8fd2c, same PR #41): CHECKLIST 0.3 done. Motor valves ABC-054/055 were cut at the "M" motor circle; PO now outputs pulse position; unit model reads motor-valve position only (reading I/P valve position broke unit_trip M.2001, so I/P valves keep the command). engine_units has 3 pre-existing DITL PULSE fails (also beta.32).

2026-10-25 ~3:25 PM PHT: beta.35 (5026a3a, PR #41): CHECKLIST 0.4 part 1 (Training watch list, hand-station MV, live SV/MV). UI only. Pushed BEFORE its human run finished (user asked to move session); HANDOFF item 3 = run it first.

**Why:** next session must know the base and that the step-33 stall was seen once.
**How to apply:** next per HANDOFF = human run on beta.35, then CHECKLIST 0.4 part 2 (card screenshots). If step 33 stalls again, investigate burner trips there. Related: [[project-beta25-training-human-path]].

## project-beta8-guided-workbench

_project_ — 2026-10-23 status: 3.2.0-beta.7 (F(X) page) and beta.8 (Home, Training, 4 themes) pushed on PR #39

2026-10-23 ~1:40 PM PHT: 3.2.0-beta.8 pushed on branch claude/project-thread-vhcfv9 (PR #39, includes PR #38). It has the Guided Workbench (user pick "B + C"): Home first page, Training (PR-OPE-5002 checklist), 4 themes (dark default), Tools moved under ⚙ > Engineering tools. beta.7 = F(X) curves page with an explanation of every LN.
The user asked to see the F(X) explanation text; screenshots are in /mnt/project-files/fx-sample/.
**Why:** a later session needs to know what is already delivered.
**How to apply:** next, wait for the user's Beta feedback. Ideas still open: instructor malfunction, what-if tuning, cause-and-effect matrix. No merge without GO STABLE.

## project-cold-cleanup-2026-10-24

_project_ — 3.2.0-beta.22 (7169725, PR #39) Cold cleanup; BFWP now stopped in Cold so every start-up path must start BFWP-A; Training mockup pending pick

- 2026-10-24 ~11:15 AM PHT: beta.22 pushed. Cold: BFWP M.3343/3344 = 0, FW 0, drum level steady 5~8 mm, steam temps 30 C (not 99.97). 0.1 % of range flows are intentional (SELECT reads 0 as lost signal).
- Consequence: anything that starts from Cold (CHECK chain, tests, guided Training) must start BFWP-A (M.3343) before drum filling; plantWarm/Hot start it.
- Pending: user pick on Training workspace mockup https://claude.ai/artifact/M9TD6DVtS8XmfwrBpo4UVX (dock right / bottom sheet portrait, values strip, DITL start-permission interlock checklist, faceplate in card, RUN kept across DITL/ABC/Plant). guide.js has 66 steps, no UI yet.
- Known: switching to DITL while ABC runs shows VIEW in the top bar (user complaint "RUN ay RUN"); plant graphics show 150 MW snapshot values for unlinked items in Cold.
Related: [[project-plant-chip-2026-10-24]]

## project-dock-redesign-2026-10-30

_project_ — Dock redesign (mock-up v2) implemented in beta.61, PR #67 (supersedes #66); MERGED to main 2026-10-30 (24e9c99); live test pending

2026-10-30 ~7:45 AM PHT: user said the Training dock is ugly, has a bad font, is hard to read and is confusing. User asked: how does an operator line up, start and check one equipment? Mockup artifact: https://claude.ai/artifact/SB6amXK2fNEmwiTu1Nurh3 . Source and screenshots: /mnt/project-files/dock-redesign-2026-10-30/ (swp-dock-mockup.html, mock-*.png, asis/).

Design:
- equipment cards: the operator picks any pump;
- 4 tabs: Lineup (SOP items with AO/CRO and valve tag), Permissive (DITL rows ✓/✕ with a fix button on the row), Start, Check (SOP ranges);
- a "?" Bakit? on each tab;
- one Roboto font, 4 sizes (13/15/17/22);
- colours: RUNNING red, STOPPED green, done blue, missing amber;
- header with 3 values and "Lahat ▾"; footer with Nakaraan / Logic / Susunod.

Audit of beta.60 dock: 13 font sizes, green STOP button, lineup hidden in the SOP collapse, and only the first non-running motor gets the FIELD button (dock.js ~2150-2200). Because of that, SWP-C can't be started first. The code fix went to the fixer thread via the coordinator.

**How to apply:** wait for the user's OK or changes before coding (big UI change = proposal first). Related: [[project-training-dock-mock]], [[feedback-own-the-ux-2026-10-22]].

2026-10-30 ~8:15 AM PHT: user wants PC desktop + tablet landscape ONLY for now (phone and tablet portrait deferred; "focus on working functionality"). Artifact v2 shows full screens: real app left (crops) + live mock dock right (PC 1366x768 dock 440; tablet 1180x820 dock 380). Screens: mock-pc-*.png, mock-tablet-*.png.

2026-10-30 ~8:40 AM PHT: user "Sige lahat ng ideya mo, ipa mockup mo". Artifact v3 (same URL) = mockup v2 of the dock:
- "SUSUNOD NA GAWIN" banner with a do-it button;
- pump state RUNNING / STANDBY / STOPPED / BLOCKED with the reason;
- vertical checklist (Lineup / Permissive / Start / Check) with a "?" on each row;
- standby flow for the third pump: lineup, then REMOTE, then AUTO;
- live overlay of SWP lamp, status and current on the HMI image.
Deviations, told to the user:
- DITL-29A has no valves, so the fixes are REMOTE or MAN/AUTO; valves stay in Lineup;
- out of range is amber, not red (red = RUNNING).
Waiting for the user's OK to code.

2026-10-30: user said "cge g na yan" and the dock v2 was implemented in src/ui/training/dock.js + dock.css (3.2.0-beta.61), branch claude/project-thread-o689o3, PR #67 (includes and supersedes PR #66). Headless check: 105 steps OK at 1366x768 and 1180x820; the SWP step was driven through the banner (C first). Screenshots are in /mnt/project-files/dock-redesign-2026-10-30/app-b61/. NOT merged: waits for GO BETA. Live test with the user still pending.
2026-10-30 9:07 AM PHT: user said "Edi merge n lahat" (GO BETA). PR #67 merged to main as 24e9c99 (#66 is included and auto-marked merged). main version 3.2.0-beta.61, html dist/logic-sim-v3.2.0-beta.61.html, npm run check SAME (sha256 94a084ae). No Stable release. Live test still waits for the user's G.

## project-docs-lean-2026-10-26

_project_ — 2026-10-26 docs restructure: docs/SPEC.md = user spec + gaps + plan (replaced ROADMAP/CHECKLIST); USER_CHECK.md; lean test policy in PROJECT_RULES 5

On 2026-10-26 (~7:50 PM PHT), PR #43 (branch claude/project-thread-6t8nxq) was opened, stacked on beta.38 (#42). It is docs only.

- `docs/SPEC.md` holds the user's spec S1–S9, what exists vs what is missing, and the plan (section 3). It replaces ROADMAP.md and CHECKLIST.md, which were deleted.
- `docs/USER_CHECK.md` lists what the user clicks for each S-item and the expected result, and explains the "bawal" test.
- The lean test policy is in PROJECT_RULES section 5:
  - Quick checks while working: build + check + the one related test.
  - Before reporting: sop_bawal.js plus one Cold human_run (UI-only changes: screenshots instead).
  - Heavy tests run in the background only.
- HANDOFF was trimmed from 83 KB to about 45 lines. CLAUDE.md is about 45 lines.

**Why:** the user said "simple lang dapat ang app". They allowed doc changes to save tokens and speed up the work.

**How to apply:**
- Read SPEC.md first and keep its section 3 updated.
- Keep HANDOFF to current state only.

Open decision for the user: hide the Per-loop, Warm and Hot options (they are not in the spec).

## project-handoff-single-file

_project_ — HANDOFF.md in the repo is the one self-updating handoff file (state, threads, user orders, style); every thread updates it at task end

User 2026-10-30 ~7:40 AM PHT: "isang file nlng na kusang inaupdate nio pra kht sino gumawa alam agad, memory, threads, style. Ibbgay lng ang repo."

Merged 2026-10-30 ~9:10 AM PHT as 3e9fdf1 (PR #65, docs only, user "merge n lahat"; HANDOFF state = beta.61): HANDOFF.md rewritten with state, threads table, open issues, user orders (from this memory), style, update procedure (section 8). CLAUDE.md top now says read HANDOFF first and update it at the end of EVERY task.

Open: CLAUDE.md / PROJECT_RULES 4 say merge to main needs GO STABLE, but practice since beta.56 is GO BETA. Not changed (authorization rule); flagged to the user to decide.

**Why:** user wants any Claude/account to continue from the repo alone.
**How to apply:** at the end of every task, update HANDOFF.md sections 2–5 in the same PR/Beta. Related: [[project-docs-lean-2026-10-26]].

## project-hmi-seawater-030

_project_ — 030 Seawater HMI page (STEEL) live in app since 3.2.0-beta.56 (src/ui/plant/hmi-sw.js); facts, findings, lessons

HMI thread "Propose Seawater System HMI page" (started 2026-10-29 by user: separate HMI thread does proposal AND execution).

- Proposal: https://claude.ai/artifact/K2Tv8cYKSJ1tuk6GqyA19e (CUTAWAY mock + sources table). STEEL: https://claude.ai/artifact/Jt2kCe1q1gimDjaVhPMF7s. THERMAL: https://claude.ai/artifact/7UyK1MGZqBqyMPJMLyDeJs. Generator: scratchpad sw/gen.js (lost with container; layout coordinates are in the artifacts).
- Facts found: no DITL-29C (29A covers SWP A/B/C with A/B/C addresses M.1150/1160/1170). SWBP = DITL-30, debris filters S-1502/S-1504 = DITL-39 (M.0790~0793), CTCS = DITL-119 (M.0794~0797, needs M.079C any SWP). Hypo P-0761/0762 = STN105 DI only (status, no command). No plant model for pool level, pump currents, condenser SW T/P: HMI-side estimate with ● (like 007). DPT-SW1502/1504 only in alarm list (0~2000 mmH2O), no snapshot value → "-----".
- User was angry that the first mock was not looked at before showing ("Nakita mo b gawa mo?") and that only one style was shown. **How to apply:** always screenshot and inspect a mock before posting; show all 3 styles as separate artifacts.
- Next: user picks a style, then explain + ask G before coding in src/ui/plant/hmi2.js. Never merge/Beta without GO. Related: [[feedback-hmi-style-2026-10-27]].
- P&ID: Seawater = K1AU3-PD-020 = RA flow-diagram PDF page 16; Aux cooling water = PD-021 = page 17 (scan, render at 300 dpi to read). Flow: SWP → 96" header (S-1502 inline, backwash MV-SW1001) → condenser A/B halves (in bottom V-SW1007/1008, out top V-SW1009/1010; ball separators L-1111/1112 on outlet, P-1113/1114, ball vessels T-1115/1116, V-pieces Z-1115/1116 to inlet) → siphon pit → channel. 24" SW-1-055 from header → SWBP → S-1504 (MV-SW1002) → CCWHE H-1107A/B/C → channel. CCWHE cools closed ACW loop (P-1108A/B, T-1109) for turbine/gen/BFWP/fans/APH/ash conveyors/compressors/sampling. 2026-10-29 22:25 PHT: asked user "G para ayusin" the mock flow per P&ID.
- 2026-10-29 22:35 PHT: user picked STEEL ("un nlng gamitin"), complained about pipe bends (now rounded elbows), wants CCWHE destinations (ACW users per PD-021) and condenser shell + tube side with animation. v2 mock 1760x900 = https://claude.ai/artifact/Jt2kCe1q1gimDjaVhPMF7s ; source /mnt/project-files/hmi-seawater-2026-10-29/gen2.js + v2.png. Waiting for OK on look, then explain + G before app code.
- 2026-10-29 22:50 PHT: v3 of STEEL artifact (same URL): pipe joints/tees fixed, flow direction per P&ID, text overlaps fixed, ONE label standard (NAME / tag / STATE red RUN green STOP / mode; value box ● tag value unit). Files in /mnt/project-files/hmi-seawater-2026-10-29/. Waiting for user OK on look, then explain + G before app code.
- 2026-10-29 11:33 PM PHT: shipped in 3.2.0-beta.56 (PR #60, merge 8f76680): src/ui/plant/hmi-sw.js + hmi2.js hook. Run state via LS_DOCK.mst; ● estimates for TISW/PISW1110, LISW1501, currents (no logic sheet has them).
- LESSON (user angry): after "Practise: 150 MW" the DITL motor drawings need ~25 s to reach RUN. I read DITL-39 M.079C at 6 s, reported a fake bug, and the user approved a fix for nothing. **How to apply:** read logic states only after >= 30 s (poll until stable) before calling anything a bug. DITL-39 M.079C is correct.
- 2026-10-30 12:26 AM PHT: 3.2.0-beta.59 merged (PR #63, merge fd31696, build 8cbf148): all 030 values without a logic transmitter come from the plant model (unit.js AN_SW / anSeawaterStep, anDitlRun), no ● estimate (user: "DAPAT S PLANT MODEL GALING"); #117 fitAll. DITL-39 note corrected. User rule 2026-10-30: ALL testing must be LIVE in the real app with screenshots.
- (fixed in beta.59) Old: beta.56 UPDATE_REPORT / HANDOFF wrongly say DITL-39 rows 2~4 are not parsed / M.079C = 0; correct this in the next beta. The 150 MW start not running ACWP is skipped by the user (focus: cold to 150 MW).

## project-hmi-style-standard

_project_ — 2026-10-30 one uniform HMI style for all pages = library src/ui/plant/hmi-sym.js (HSYM) + docs/hmi/HMI_STYLE.md; first page MAKE-UP WATER beta.70 (PR #74)

User 2026-10-30 ~1:18 PM PHT: "Dapat uniform ang style ng mga HMI natin." Approved MU mockup direction (https://claude.ai/artifact/D7QHoST3PTVzav5Pw1T1q7, "OK, simulan sa Make-up Water").

Owner thread "IMPROVE MAKE-UP WATER HMI VISUAL" built HSYM (hmi-sym.js): scene/pipe/tee (welded layers), pump, valve (man/mov/xv/cv), check, gauge, strainer, orifice, tank, vbox, dest, legend, fit(1600,880), live() animation loop (pauses with sim). Standard: docs/hmi/HMI_STYLE.md; sample sheet https://claude.ai/artifact/TZS71f9EFZQ8LsXa2V9pfa (standard approval pending as of 2:05 PM PHT).

PR #74 = 3.2.0-beta.70 waits GO BETA (beta.69 = CCW on hold).

**Why:** user found pages copied from snapshots, block-and-colour only, with seams in pipes.
**How to apply:** every HMI page (CCW, IA/PA, Turbine Oil, 030, 007) moves to HSYM, one page per Beta, after #74 merges. Related: [[feedback-hmi-realism-2026-10-30]].

## project-live-training-2026-10-23

_project_ — Live Training shipped 3.2.0-beta.10 and F(X) operational effect shipped 3.2.0-beta.11 on PR #39; RUN-without-Start = Cold in beta.12

The user picked the "full run" option for Live Training (2026-10-23). It shipped as 3.2.0-beta.10, commit 322bcf2 on PR #39 (not merged), at about 5 PM PHT.

**What shipped:**
- Each step is AUTO (ticks itself in RUN from DCS signals), FIELD or TCS.
- Two new sections were added: Sync & initial load, and Load up to 150 MW.
- The UI has chips, a live panel and an "Assume field steps done" button.
- Test: tests/regress/live_training.js.

**User decisions, 2026-10-23 ~4:45 PM PHT:**
- The F(X) explanation tab should focus on operational effect and function. Card option "Lahat ng tatlo": add "Sa HMI" (which HMI values move), "Kapag mali / sira" (symptoms, troubleshooting) and a numeric example with a slider.
- Assume the readers have basic power plant knowledge, so no everyday analogies.
- The existing F(X) rows are OK; keep them.

**Open question to the user:**
- Show "—" on the top bar until a Start ▾ state is picked.
- Reason: with no start state, MSP shows 75, the middle of the PT-MS1002 range 0~150, which the engine sets for the flow compensation.

**Why:** a later session needs the status and the next work.
Done: F(X) operations work shipped as 3.2.0-beta.11 (eaa4028, src/ui/fx/fx-hmi.js + Try it slider).
Top-bar question resolved differently (user 8:10 PM PHT "patay pa naman ang boiler mo"): 3.2.0-beta.12 (be14374) makes RUN with no start state load Cold (MSP 0).
**How to apply:** nothing open from this thread; PR #39 holds beta.7-12, not merged. Related: [[feedback-view-vs-run-and-training]].

## project-local-remote-control-plan

_project_ — User (turla-ece) PC (Ronanski-PC) Remote Control setup and lessons; M4 step 5 was finished in the cloud as beta.20 on 2026-10-18 (laptop beta.18 superseded, do not merge it)

Decision (user, 2026-10-17 ~23:05 PHT): after beta.17, move roadmap work to the user's PC (Remote Control). Outcome: the laptop session made beta.18 (M4 step 5) but never pushed it and went offline; the cloud thread redid step 5 as **2.2.0-beta.20 (2026-10-18, pushed to ccr-3def3a81-kcpwgn / PR #31)**. The laptop beta.18 is superseded: do not merge it; if the laptop has local commits, discard or rebase them on the branch head.

Facts: PC = Ronanski-PC, Dell Precision 3570, i7-1255U (10 cores), 16 GB, Windows 11 Pro. Repo clone: `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool\icms-master-tool`, branch ccr-3def3a81-kcpwgn. Tests there use installed Google Chrome headless (Playwright Chromium does not launch); trip test 12 s vs ~4 min in the cloud. apk / exe / releases stay on GitHub (release.yml, GO STABLE).

**Why:** user wanted faster turnaround; gain is ~2x on regression only. The cloud thread and the Remote Control session share ONE usage limit (both stop at once); closing the Claude desktop app kills the RC session's running tests; the RC session hears only the user's typed thread messages (no cloud send_message, no card taps).

**How to apply:** Remote Control stays an option for fast regression runs; start it with start_rc_session on the user's message with that folder, no setup talk in chat. Next roadmap items after beta.20: OPERATOR GUIDE (Taglish), then M5 shutdown. Related: [[logic-sim-project-rules]], [[feedback-decision-cards]].

## project-plant-chip-2026-10-24

_project_ — User decisions 2026-10-24 AM PHT: plant model/MW picker = chip beside VIEW|RUN (option B); UAT and CHECK removed from the app

- User 2026-10-24 ~7:45 AM PHT picked **B**: a "PLANT" chip beside VIEW | RUN on every page (OFF / Per-loop any MW 45~150 / Unit Cold-Warm-Hot-150 MW + target MW). Shipped in 3.2.0-beta.20 (`app.js` buildPlantChip). Start ▾ in Plant view renamed "TCS / Field ▾" (TCS + field equipment only). User words: "wag mo jan ilagay. dpt common tools yn s simulate".
- User 2026-10-24: "remove uat test completely sa app mismo saka yung check sa tools. di ba meron naman training. basta mahalaga ay meron ng plant model." UAT + CHECK buttons/panels removed from the app; runners kept only for automated tests (navigator.webdriver) because check_panel's 17 scenarios are the proof of the plant model.
- Open item: HP bypass PICMS1006 PV holds 122 in Cold (SELECT CIRCUIT zero-hold); a 0.1 % floor broke roll / 45→150 scenarios, reverted (beta.19).

**How to apply:** don't re-add UAT/CHECK UI; new plant-start features go in the chip. Related: [[project-plant-model-truth-2026-10-23]], [[feedback-view-vs-run-and-training]].

## project-plant-model-truth-2026-10-23

_project_ — Plant model redesign agreed 2026-10-23 9:30 PM PHT: loop map first, per-loop model with selectable MW load + source rule, unit model cold→150 MW; MSP 75 came from per-loop model

**Cause of MSP 75 before Start:**
- `plant.js` per-loop model: PV = mid range + MV effect. That gave MSP 75, FP 600 mmH2O, level −422 mm and O2 6.25 %.
- The cause is not compensation.
- Fixes: beta.12 (RUN with no Start = Cold) and beta.13 (Reset clears startState).

**Agreed design (user, 2026-10-23 ~9:30 PM PHT, after "idiscuss muna, kalma lng s pagbuild"):**
- Two plant models: per-loop and unit (global).
- Loop map = each loop's ABC + DITL sheets. **User picked: loop map first**, as a doc for the user to check, with no app change.
- **Per-loop mode:** the user picks a load (MW). Loop "source" values (steam P, flow, temp) come from the design curve at that MW. The loop's MV moves the PV around it. Cold / 0 MW = no steam, so ABC-017 PICSB1052 PV = 0.
  - Checked in code: ABC-017 is not covered by the unit model at all (unit.js has no 1052), so today its PV comes from MV alone.
- **Unit model:** mass and energy balance plus steam table, cold → sync → 150 MW. It supplies the per-loop sources.
- **Focus only cold start → sync → 150 MW**, with auto holding the demand and correct manual use to reach the target load. Warm, hot and bottle-up come later.
- **Plant model OFF** = simulate and force only.
- **No data is asked from the user:**
  - Drum and metal storage: reverse-calculate from the FHI cold start-up curve (it affects speed and dips only, not final values). Also check manual Part 3 for drum dimensions.
  - Valve Cv: reverse-calculate from HMI snapshots (valve % vs flow at a known MW) plus design max flow.

**Loop map doc (draft for user check, 2026-10-23 ~9:50 PM PHT):** https://claude.ai/artifact/T85z4EWPPAUFsbtSAtLRmG — 15 loops + common sheets; built from drawn page links (ABC 'FROM/TO DITL xx-yy', DITL FROM/TO 'ABC-xxx'), not shared M addresses (per-station memory). Extract script: scratchpad loop/extract.js.

**Doc:** https://claude.ai/artifact/LCoqZbmKCfogMUyUHX356J (cold start, loads, relationships).

**How to apply:**
- Never explain a value without tracing its source in code.
- Say which parts are assumed.
- Write the plan before building.

Related: [[project-live-training-2026-10-23]].

**User 2026-10-23 9:51 PM PHT:** GO for Phase A (source of each loop). Plan doc: https://claude.ai/artifact/8dGKf8dcXkhxERHSYcNnzZ (phases A source, B unit model, C training, D tests).
- Update ALL plan docs every time a phase finishes.
- This work is for the SIMULATION ON (RUN) state.
- After this big update, the next focus is VIEW/TRACE mode.

## project-product-vision-2026-10-22

_project_ — Product direction Claude proposed 2026-10-22 ~8 PM PHT after the user demanded non-generic thinking: "digital twin of LMYP #1 logic that explains WHY"

User 2026-10-22 19:56 PHT: "if only the engine, diagrams, plant model and simulate existed, what would you do, how would you use it, what experience, maximize it, be competitive". Claude's answer, posted in the thread "Full app quality audit":
- Positioning: the logic digital twin of LMYP #1. Commercial OTS shows WHAT happened; this app explains WHY. It is one offline file that runs on a tablet and is built from the plant's own drawings.
- Use cases:
  1. Post-trip analysis: pick a trip, see the first-out and the signal path over time.
  2. "Ayaw mag-AUTO": search a tag and get the live blocking signal.
  3. What-if: tuning or interlock setpoint before touching the real DCS.
  4. Training: PR-OPE-5002 cold start, instructor malfunctions, time and score.
  5. Auto cause-and-effect matrix of every trip from DITL.
- Experience: start from a question, not a menu (Operate / Why / Train / Test). A page for every tag. A timeline with backtrack.
- Decision card posted: 1st build = "Bakit? + trip replay + tag page" (recommended), or Training, or What-if + C&E.

**Why:** the user wants Claude to own product thinking and be competitive, not to patch buttons.
**How to apply:** build toward these; keep the engine untouched. Related: [[feedback-own-the-ux-2026-10-22]].

## project-skill-dcs-app-quality

_project_ — Generic one-prompt app skill "one-prompt-app" (replaced "dcs-app-quality") and its Playwright click-every-control checker; where the files are

User 2026-10-22/23 PHT: wants ONE skill for ANY app, new or existing, not tied to the DCS project ("di naman pang-new and existing apps na gagawin ko" about the dcs-named version). Final skill name: **one-prompt-app**, proposed 2026-10-23 ~7:30 AM PHT. It covers new apps (Claude picks the stack and scaffolds) and existing apps (rules, inventory, baseline tests). DCS/ISA-101 is only a short "if plant app" section. The user only says Yes/Adjust and gives GO words. The old "dcs-app-quality" cards are obsolete; the user was told to delete it if saved.

Files: /mnt/project-files/skills/one-prompt-app/SKILL.md, scripts/ui-check.mjs, and the zip /mnt/project-files/skills/one-prompt-app.skill. Nothing was pushed to any repo.
ui-check.mjs: `node ui-check.mjs --url <http|file> --out dir [--wait 4000 --max-clicks 200 --depth 2]`. It runs at 4 sizes, clicks every control 2 levels deep, and checks overflow, text < 11 px, clipping, overlap, 44 px targets, contrast, labels, JS errors and axe. Playwright is global at /opt/node22/lib/node_modules/playwright; symlink it into node_modules.
A test run on icms 3.2.0-beta.6 found a Plant view JS error on phone/tablet (svg viewBox NaN), unlabeled selects, and small targets. Report: /mnt/project-files/skills/ui-check-sample-run-beta6/report.md. Not fixed yet.

2026-10-23 ~10:30 AM PHT: user also asked for a separate UI/UX design skill ("may reference, may standard, papipiliin ka", must-have / nice-to-have / remove / retain / improve). Proposed **ui-ux-design-review**: it analyzes the app against standards (Nielsen, WCAG 2.2, HIG, Material 3, Laws of UX, ISA-101), makes a feature review table, and shows 3 design options, one page each, picked on a card. It bundles scripts/style-audit.mjs, which measures the font sizes, colours, spacing grid and radii in use. Files: /mnt/project-files/skills/ui-ux-design-review/ and ui-ux-design-review.skill. Note: in this skill the user WANTS options to pick from (unlike one-prompt-app's yes/adjust).
2026-10-23 ~10:50 AM PHT: user said "YUNG LAHAT KASAMA PATI KAIBUTURAN". The design skill was replaced by **ui-ux-design-master**, which adds a 12-layer audit (Garrett's planes + typography, colour, spacing, controls, microcopy, feedback/motion, accessibility/trust), per-screen, per-control, per-word and per-state verdicts, and a top-10 priority list. It bundles ui-check.mjs + style-audit.mjs. Files: /mnt/project-files/skills/ui-ux-design-master/ + .skill. The old ui-ux-design-review files were removed; the user was told to save only the master card.
2026-10-23 ~12:40 PM PHT: ran ui-ux-design-master on DCS Sim 3.2.0-beta.6 (no app change). Review: https://claude.ai/artifact/Fus3bHxckM4915b2W58naA . Options: A Operator Console (ISA-101 grey, plant-first, recommended) https://claude.ai/artifact/Pux5G7H1jjVE1ZzL3AyKeb ; B Engineer Workbench (VS Code-like) https://claude.ai/artifact/EraFjZBNK7SxQJJj3F1AU4 ; C Guided Trainer (light, PR-OPE-5002 steps) https://claude.ai/artifact/6FE4Xnecct55ETwEUqRswZ . Pick card posted. Sources and mocks are in /mnt/project-files/ui-ux-review-2026-10-23/. Build after the pick goes on branch claude/project-thread-vhcfv9 off PR #38's branch (claude/project-thread-8t4984).
2026-10-23 12:30 PM PHT: user was torn between B and C and asked "bakit light lang / dark lang, hindi pwedeng baguhin ang kulay?". Feedback: a theme is never locked to a layout; always offer switchable themes (Light, Dark, Control room grey ISA-101, High contrast) via tokens. Hybrid "B + C Guided Workbench" page: https://claude.ai/artifact/K6ZGL1j9U8kYN5ZTJQPphc . New pick card posted (B+C recommended / B / C).
2026-10-23 12:28 PM PHT: user picked "B + C · Guided Workbench" (card). Then 12:33 PM asked for an F(X) feature: Excel-like table (look of document-references/linear-curves-fx.xls, "tulad ng sa repo natin") editable to play the plant response, plus a plain explanation per LN (purpose, from, to, effect). Plan told to user: F(X) first as 3.2.0-beta.7 (~3:30 PM PHT), Guided Workbench as beta.8 (~8 PM PHT). Branch claude/project-thread-vhcfv9 (off PR #38 branch). Workbench theme CSS WIP is in `git stash` "workbench-themes-wip". Keep dark as default theme (user said "AYAW KO NG PUTI" 2026-10-22).

## project-stable-plan-2026-10-30

_project_ — 2026-10-30 user "Go stable pre" then "Updated lahat" = handover-ready repo, NOT a release; Stable 3.2.0 steps live in HANDOFF.md section 9

2026-10-30 ~7:35 PM PHT the user wrote "Go stable pre :)" then, asked for scope, "Di ko alam pre. Basta gsto ko lng. Updated lahat. Yung app, docs, handover, progress, memory, instructions, skills" so the next account needs to ask him almost nothing.

Result (thread I-UPDATE ANG REPO PARA SA PAGPAPASA (HANDOVER)): no release, no workflow. Docs only: full current project instructions copied into docs/handoff/NEW_ACCOUNT_SETUP.md, account skills copied to docs/handoff/skills/ (organized-project-coordinator, ui-ux-design-master, one-prompt-app), SPEC plan refreshed, HANDOFF section 9 = Stable 3.2.0 steps + risks (release.yml needs docs/versions/v3.2.0/Release-Report-v3.2.0.pdf and go input "GO v3.2.0"; dry_run true first).

**Why:** user's goal was a complete handover, not shipping; live test only reached H8.
**How to apply:** on a future GO STABLE, follow HANDOFF.md section 9 and first ask (one card) which Betas to include. Related: [[project-handoff-single-file]].

## project-status-beta6

_project_ — Status 2026-10-20 PHT: 2.5.0-beta.9 pushed (921fc7a, PR #34): DITL VIEW|SIMULATE, blocks_io 0 wrong plant off+on; waiting on user device test + GO STABLE

2026-10-20 10:00 PHT: 2.5.0-beta.8 (fb8c9f5, PR #34, branch claude/project-thread-yezgyg, CI green): DITL FROM / TO references are page links (src/ui/shell/ditl.js DUI.link / goItem, chooser, ◀ Back; ABC dsGoRef opens the DITL row). tests: ditl_pagelink.js, pid_auto.js (plant off from 150 MW: 39 AUTO PASS, 29 MAN).
beta.9 (user 2026-10-20 09:45 PHT "go lang", "save progress every merge" = push each step, update ROADMAP): DITL bar = [VIEW | SIMULATE] + Reset (no ▶▶ / step size / speed; layout.js DITL part). tests/regress/blocks_io.js = every ABC calc/logic block black-box vs legend, plant off+on (beta.8: 1666 blocks, 12006 checks, 0 wrong; S.kn constants are not forced). tests/regress/ditl_sim.js = world off/on x plant off/on all pass.

Earlier: beta.7 RH/SH damper fix = clear TPS/TPV run state at start of anPlantLoad150; do NOT apply MAN-station modes from AN_HMI_CTL (broke M4/M5). Only one headless Chromium at a time. pkill -f with a pattern that matches the own shell kills it (exit 144). Remaining for user: device test, old-branch deletion, GO STABLE. Related: [[feedback-full-self-check-before-ui-push]].

## project-training-dock-2026-10-24

_project_ — 3.2.0-beta.23 Training dock + start-up guide through real DITL interlocks; open CCS-handover stall

2026-10-24 ~7:15 PM PHT: 3.2.0-beta.23 pushed (40c986b, PR #39, not merged). User picked the Training dock mockup and then "Ituloy hanggang 150 MW sa DITL" (card).

- Dock = guide panel beside ABC/DITL, one RUN; with one world ON the guide presses DITL push buttons (dock.js hold/dpress/dset).
- Evidence for link changes: docs/versions/v3.2.0/UNLINK_AUDIT.md (6 items).
- Proof: WORLD ON full Cold→150 MW ×300: 6 of 8 runs reached Practice; WORLD OFF path also reaches Practice; check_panel M1-M5 pass.
- Open: 2/8 WORLD-ON runs stall at CCS handover (~80 MW, HIC-BM/EIC-TM drop back to MAN after A). Next: trace M.2013/M.2016 on a stalled run.
- Repro probe committed: tools/training/guide_fullrun.js.

**Why:** next session must know what beta.23 covers and what is still open.
**How to apply:** wait for user feedback on beta.23; if they continue, start with the CCS stall. See [[project-cold-cleanup-2026-10-24]].

## project-training-dock-mock

_project_ — Training dock redesign (HMI center, all controls in dock, diagram-only logic view) beta.57 + beta.58 merged; all-steps fixes on PR #64 waiting GO BETA

Thread "Mock up Training dock and HMI layout" (2026-10-29). User approved mock-up v3 (artifact https://claude.ai/artifact/S3dpSs5s1atePuBRnMaheT) with rules: logic view = DIAGRAM ONLY; remove duplicate/unneeded buttons. User go "G n rn yn".

2026-10-29 ~11:50 PM PHT: coded on branch claude/project-thread-bipnk3, PR #61 (commit eaf400b), NOT merged. Files: src/ui/training/dock.js, dock.css, tests/regress/training_dock.js, dist beta.55 html (hmi2.js untouched). Screenshots: /mnt/project-files/training-dock-mock-2026-10-29/build/.
Known pre-existing (same on main): tests/regress/training_dock.js stale (old Gabay flow), sop_bawal 6 FAILs, FIELD click at a step opened directly does not turn interlock ✓ while PAUSED.
Not tested: phone/bottom layout, full Cold→150 MW.

**How to apply:** coordinator assigns beta number; merge only on user's GO BETA. Related: [[project-hmi-seawater-030]].

2026-10-29 11:41 PM PHT: user GO BETA → rebuilt on beta.56 main, merged PR #61 = **3.2.0-beta.57** (merge be82891, app build b6f49b2). Screenshots build/beta57-*.png. Live test of user pending.

2026-10-30 12:15 AM PHT: **3.2.0-beta.58** merged (b077063, build 9045b94, PR #62): Training button opens the DOCK (Training page inside it), centre = Plant view / Logic only, 8 values + lamps restored, HMI page per SOP section (SECHMI in dock.js). Site deploys automatically after Checks on main (site.yml, /beta/).
12:27 AM PHT: all-105-steps check (headless, real flow) → fixes on PR #64 (e96d8e7, version not bumped, waiting coordinator number + GO BETA). Steps 10-14, 52, 54, 57, 62 have no own HMI page (no box). List: /mnt/project-files/training-dock-fix-2026-10-30/all3/CHECK_LAHAT_NG_HAKBANG.md.
2026-10-30 1:34 AM PHT: user GO BETA → **3.2.0-beta.60** merged (PR #64, 29fa724, build cfe9890). Live check only WITH user as witness, on app updated via "Update now" banner; wait user's G per step. No background self-run "live" checks.

## project-ui-audit-v240

_project_ — UI/UX audit of v2.4.0 (2026-10-19 14:10 PHT): findings, standards used, where the report and reusable tour scripts are

2026-10-19 the user asked for a full UI/UX audit vs standards. Report: /mnt/project-files/ui-audit-2026-10-19/UI_UX_AUDIT_v2.4.0.md (54 screenshots, annotated A-D). Standards used: WCAG 2.2 (contrast, 24 px target), 44 px touch, ISA-101, plant's real MICREX HMI (03.png). Pass: contrast, fonts, speed, focus. Fail: PLANT VIEW text ~9 px PC / 4 px phone (real DCS ~16 px), empty bands, text overflow on UNIT, phone CHECK clipped, colour/state wording inconsistent, snapshot mixed with live values.
Recommendation #1-4 = PLANT VIEW fixes; card offered (recommended "PLANT VIEW 1-4"). UI-only; any Beta must be a new branch off main, not PR #32's branch.

**How to apply:** reuse /mnt/project-files/ui-audit-2026-10-19/tools/tour.js + tour2.js + measure.js (playwright, dist html) to re-measure after fixes. Keep plant's look (black bg, red=open/running) per [[project-ui-restructure-2026-10-19]].
- 2026-10-19 ~15:40 PHT: user picked "PLANT VIEW (1-4)". Pushed 2.4.1-beta.1 on `claude/project-thread-yezgyg`, PR #34 (PATCH line 2.4.1 to avoid 2.5.0 drawing audit collision). Also fixed: drop-down menus (Start ▾, ⚙) were clipped by the scrolling tool bar (Start invisible in PLANT VIEW); now portaled to body. Remaining audit items #5-#8 not chosen yet.
- 2026-10-19 ~17:00 PHT: user picked "UI ayos #5-8". Pushed 2.4.1-beta.2 (commit 2fd6ca7, same PR #34): neutral Pause, label PAUSED fix, 44 px touch / 24 px PC, 12 px panel text, LOGIC Zoom button. Lesson: making #anmeta small text 12 px wrapped the drawing header and shifted values_layout; leave it. Remaining audit: faceplate decimals = graphic, TOOLS descriptions.

## project-ui-restructure-2026-10-19

_project_ — User approved a full UI clean-up (2026-10-19) and said project rules may be broken for UI as long as engine, simulation and plant model keep working

2026-10-19 08:10 PHT the user said the app feels "magulo, walang direksyon, kalat" and asked for a full audit (thread "Status at breakdown ng app"). Audit found: about 234 buttons on the ABC screen, 4 search boxes, settings menu with 17 items, toolbar not following the tab, floating UAT/CHECK panels, old Plant window duplicating the PLANT tab, plant model ON/OFF button hidden (plant model always ON). Report: /mnt/project-files/app-status/FULL_AUDIT_2026-10-19.md.

08:17 PHT user: "Walang rules dito kung may need ayusin. Basta working ang engine, ang simulation at ang plant model. Ok lng lumabag sa rules."

**Why:** user wants a clear, organized app more than adherence to old UI rules.
**How to apply:** UI/layout restructuring may override earlier UI rules; engine, simulation and plant model behavior must stay unchanged and be proven unchanged. Release authorization rules (GO BETA / GO STABLE, no merge without approval) still apply. The drawing-audit Betas (behavior, data) from PR #32 are a separate line of work; keep version numbering from colliding.

Status 2026-10-19 ~09:15 PHT: user chose "Scratch" (new shell). 2.4.0-beta.1 pushed to `claude/project-thread-u7at96`, PR #33 (separate line from 2.3.0 drawing audit PR #32). New shell = src/ui/shell/app.js + app.css; tabs OPERATE/LOGIC/LIBRARY/TOOLS. Next (beta.2): DITL in same panel, remove old Plant window, trim ⚙, repo cleanup.
2026-10-19 ~10:40 PHT: user asked for an industrial / flat / aligned / no-overlap UI pass "gamit mo mismo ang app". 2.4.0-beta.2 pushed (PR #33): one control height, search compact (icon ≤1280 px), 2-row bar on tablet/phone, toast → status bar, UAT/CHECK docked right. Audit tool: scratchpad tour.js (overlap check of bar + footer at 1440/1024/390). Search tests now call lib.js showSearch().
2026-10-19 ~11:20 PHT: user chose app name "DCS Logic Simulator" (card). 2.4.0-beta.3: icon in delivery/icons (apk/exe/html/PWA), release files DCS-Logic-Simulator-<ver>.apk / -Windows.exe / .html / -Report.pdf. Keep html <title>Logic Sim v…> (old installs' updater reads it); shell renames document.title.
- 2026-10-19 12:00 PHT: user GO STABLE for 2.4.0 (beta.1~5 incl. PLANT VIEW: tab renamed, faceplate on graphic via AN.fpBuild, own window on PC via pvWindow in app.js, tab on Android/webdriver). 2.3.0 drawing audit (PR #32) NOT included; must rebase onto new main.
- 2026-10-19 13:10 PHT: v2.4.0 STABLE released (PR #33 merged 65cfb47, release.yml GO v2.4.0: apk, Windows exe, html, report). Next 2.x work: drawing audit (PR #32) must rebase onto new main.

## project-ui-themes-2026-10-19

_project_ — UI themes / style picks and DITL-like-ABC work on PR #34 (2.4.1-beta.4..6), and the user's view that colour-only themes are not a real overhaul

2026-10-19 (PR #34, branch claude/project-thread-yezgyg): beta.4 DITL without editor + Run/Pause bar + right panel (src/ui/shell/ditl.js); beta.5 ⚙ Theme Standard/A/B/C (html[data-shell], --c-* vars in src/ui/shell/app.css), TOOLS list with descriptions, info card CSS restored (lost since 2.4.0-beta.1); beta.6 ◀ Panel side tab on DITL (#dptab) + panel follows ABC↔DITL at once (tests/regress/sidetab.js).

17:05 PHT user: "iyan na ba ang best mo... overhaul?" and asked for 10 new styles. Gallery of real app screenshots: https://claude.ai/artifact/SjTwN7pmbqSkbXffAKk4sB (source scratchpad st10/styles.css; light styles use html[data-light] overrides). Waiting for the user's pick.

Layout overhaul proposal (before/after, prototype only, not in repo): https://claude.ai/artifact/BEN322Tg1fDxz6wXpyg1sv (source scratchpad proto/proto.js + proto.css). User chose "Lahat"; pushed 2.4.1-beta.7 (595b855): src/ui/shell/layout.js + CSS at end of app.css, tests/regress/layout.js. pid_am has 1 FAIL (ABC-004A FIC-CM) that exists on beta.6 too.

**Why:** user sees colour swaps as not enough; wants a real layout overhaul and smooth panels.
**How to apply:** when the user picks styles, add them to the ⚙ Theme list (convert data-shell=c light rules to data-light). Propose the layout overhaul (one panel system for ABC+DITL, fewer top buttons, no jump on View/Run) with real screenshots before building. Open: ABC View dims panel inputs (by design) and looks broken to the user.

## reference-golden-startup-doc

_reference_ — Golden reference doc (2026-10-25) for plant start-up and operation, the yardstick for Training order and plant model

User asked 2026-10-25 ~10 PM PHT for a simple explanation of start-up and operation, to serve as the "golden reference and principle".
Claude Doc: https://claude.ai/artifact/D2EXiHjLsiJf12RBPniT39

Contents:
- Process principles.
- Cold start-up sequence, verified against FHI Fig. 2 and PR-OPE-5002: oil → bypass 61 → roll → sync → 45 MW → coal → CCS.
- Normal values from 4.PNG and 02.png.
- MFT list from DITL-03A ~ 03H.

User asked "diba dapat may coal na bago ang sync?". Answer: no. FHI Fig. 2 puts start coal at 8.6 h, after the roll (6 h), the sync (7 h) and the IP/HP transfer (8 h).

**How to apply:** check the Training and plant model against this doc. If the app differs, fix the app. Related: [[feedback-decide-dont-ask-plant]].

## user-eta-philippine-time

_feedback_ — User (turla-ece) is in the Philippines (GMT+8): every estimated finish time (ETA) in status lines and replies is written in Philippine time, not UTC; the status line cannot show a countdown, so give an ETA clock time

Write every ETA ("tapos ~14:15 PHT") in GMT+8 Philippine time, in the status checklist header and in replies, whenever a long job (regression, generic tester, build) is running. The status line has no timer, so a clock time is the substitute.

**Why:** 2026-10-17 the user asked how long the regression would take and for a countdown; after an ETA in UTC they asked for GMT+8 because they are in the Philippines.

**How to apply:** convert UTC + 8 h; label it PHT. Related: [[feedback-full-report-every-milestone]].

## branch-merge-policy

_feedback_ — Few branches (max 3 besides main); tested work must be in the tested Beta; merge to main ONLY on GO BETA, Stable ONLY on GO STABLE

The user (28 Okt 2026, very angry) does not want many branches in Ronanski/icms-master-tool. Whatever is under test must already be merged into the line that builds the Beta. At that time there were 40 branches and 16 open PRs (#34 to #52), and the steel-theme HMI was sitting in PR #49, outside the Beta (PR #52).

**Why:** separate unmerged branches meant the user tested a Beta without the new HMI.
**How to apply:** before any test, confirm all related work is merged into the tested build. Don't leave work on side branches. The 7-part check is automatic in every test, official or self ([[startup-test-method]], [[hmi-vs-plant-view]]).

Update 2026-10-28 22:10 PHT: user authorized deleting useless branches. Rule: always push and merge, keep the repo clean, never more than 3 floating (unmerged) branches. Plant view should have only 2 HMI pages: the new steel Air & Flue Gas HMI and the PID / manual-controllers page; delete all other Plant view pages.

30 Okt 2026 ("kung ano latest gnun dn dapat ung app", "imerge n lahat"): once the user has given GO for work, merge every finished PR right away, resolving conflicts myself if needed.

**SUPERSEDED 2026-10-30 8:00 PM PHT (merge part):** merge to `main` only on the user's GO BETA in the same message; Stable and workflows only on GO STABLE. See [[feedback-merge-rule-go-beta]]. Branch-count rule still stands.

## retest-rules-new-account

_feedback_ — Live retest setup agreed 2026-10-30 in the new account: built-in browser, all steps one by one, stop depends on criticality/chain effect, strategy is the user's call

User answers 2026-10-30 (new account, first session):
- Live retest runs in the Claude app's built-in browser on the user's PC (Beta site, after "Update now"); Claude clicks, user watches.
- Scope: ALL steps (Cold → 150 MW), but one step per "G".
- On a fault: depends on how critical it is and whether it causes a chain reaction in later steps. Critical / chain-reaction → stop and get it fixed; minor → log and continue. Claude states its criticality call in the step report; user decides.
- Project strategy: "Ako masusunod. Pag-uusapan to at sasabihin ko sayo." Do not adopt Claude's proposed plan until the user says so.

**Why:** user wants control of direction; avoids repeated full reruns while not pushing past a fault that breaks later steps.
**How to apply:** every step report ends with: finding, criticality (critical/chain or minor), recommendation (stop to fix or continue). Replaces item 4 "stop at first fault" of [[feedback-live-test-sop]]. Related: [[feedback-stop-means-stop]].

## team-structure-leader

_user_ — User's project setup (2026-10-30): Claude = LEADER of 5 role threads (HMI, APP UI/UX, CODE FIXER, DOCS, LIVE TESTER); focus = live test Cold → full load

User 2026-10-30 (new account): focus of the app now = LIVE TESTING of Cold start-up to full load.

Team (uniform response format in leader and every thread):
1. HMI thread — HMI mockup + implementation; elite operator + software engineer + graphic designer; one style for every system (HSYM), proper HMI UI/UX standards.
2. APP UI/UX thread — whole app apart from HMI: buttons, text, colours, style, overall look; clear, easy to read, easy on the eyes, professional.
3. CODE FIXER thread — any fault in logic, engine, plant model, overall functionality; elite DCS engineer + software engineer.
4. DOCS thread — docs, progress saves, skills, HANDOFF, memory, instructions; applies EVERY correction of the user; organized document controller / librarian / secretary.
5. LIVE TESTER thread (added 2026-10-30) — runs the live test of Training Cold → full load in the Claude app's built-in browser on the user's PC, one step per user "G" (user witnesses); follows TEST SOP, LIVE RETEST and skill `dcs-beta-live-test`; checks the UI every step (dock, HMI, pop-out, whole app at 1366 × 768). Reports to the USER in its own thread and own log; passes findings to the leader ONLY when the user orders it (2026-10-30). The leader still reads the tester's thread to route fixes. Never edits code, never merges. User 2026-10-31 (approved): 12 CHECKS on EVERY step (1 Training and dock content, 2 dock UI, 3 header and alarm, 4 logic and permissive, 5 HMI content complete, 6 one value everywhere, 7 HMI UI, 8 faceplate / pop-out, 9 whole app UI and operator, 10 status bar, 11 events, 12 SOP and old findings) with PASA / BAGSAK / BAHAGYA / HINDI NAGAWA, the priority of every step, never reduced without the user OK even when several steps are ordered at once; plus 8 PATAKARAN (one step per G from H1, no screenshots, operator clicks no FORCE / shortcut, logic read after >= 30 s, tick only the truth, new findings from #53 with criticality and recommendation, phone-size table with reasons for HINDI NAGAWA and the verdict is the user, report to the user only and to the leader when ordered). Findings/checklist artifact: https://claude.ai/artifact/L8PGXXkK7us2NBApNLqwid. Full text: HANDOFF 5. NO screenshots: read the app directly (text, values, colours, position). The user types "G" in the LIVE TESTER thread; its Remote Control is on so he sees it on his phone.
6. LEADER (main session): manages and instructs the threads, opens a thread only when it has work, does all merging and Beta/Stable updates (only on the user's GO BETA / GO STABLE), bases everything on rules + document-references, checks properly, makes own decisions; user gives final approval. ALL-CAPS section titles.

New sessions open only from a message typed in the desktop app (not over Remote Control); the repo folder must be trusted once.

Do not archive threads (user 2026-10-30); auto-archive when a PR merges is turned off.

Local-only references (not in the repo): `..\for-github-icms-master-tool\document-references\tcs-references\` has "TCA - SOFT LOGIC DIAGRAM OF TCS.pdf", "TCE - SOFT LOGIC DIAGRAM OF TCS.pdf" and a "TCS Logic" folder. P&ID = `document-references/flow-diagram-K1AU3-A1-0-001.zip` (user confirmed).

**How to apply:** route work to the right role thread; brief each thread with rules + references; every user correction goes to the DOCS thread. Related: [[retest-rules-new-account]], [[feedback-merge-rule-go-beta]].

## user-orders-2026-10-31-evening
- Test stopped at H18 on CRITICAL #70 (beta.76); user: "Ipaayos na muna natin kaya lahat." + "At ipagawa ang mga kulang na HMI". Fixes shipped as 3.2.0-beta.77 (PR #89, GO BETA "cge go na"; PR #88 + #87 + PR #86 up to 26fcea5, without page 038); 28 findings fixed, NOT yet live-retested. See HANDOFF 2/3/4, LIVE_TEST_FINDINGS #39 ~ #71, docs/versions/v3.2.0-beta.77/.
- ALL app text English only (descriptions first, tags as small reference); chat and docs stay Taglish. Quality bar: clean, organized, clear, not cluttered. Show a picture of what was made in every report/proposal. Every VISUAL fix = mock-up approved BEFORE coding; pure bug fixes may go straight to code.
- HMI: build ALL missing pages (batch 1 ~ 4 + 030 new style), one mock-up proposal per page first; steel HSYM, cutaway vessels, realistic (038: Ljungstrom, centre drive), original layout (snapshot = WHAT, not 1:1), lazy-built; TWO faceplates per equipment (CONTROL; PERMISSIVE + TREND + MONITORING via Y/N button, Y = RED complete, N = GREEN incomplete); every control tied to a real logic address (CHECK 4 from H16: otherwise "larawan lang, hindi DCS"). HANDOFF 5, docs/hmi/HMI_STYLE.md section 9, HMI_SYSTEMS.md.
- Leader must not start or resume any thread while things are stopped unless the user says so in words. DOCS: repo MD files change only on the user's "save progress" ([[docs-thread-save-progress-rule]]).
