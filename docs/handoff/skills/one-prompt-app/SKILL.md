---
name: one-prompt-app
description: Use for ANY app work, new build or existing (web, mobile, desktop, dashboard, tool, game): build, redesign, fix, audit or release from one prompt; Claude designs and checks every screen, user only says yes/adjust.
---
# One-Prompt App — from one prompt to a finished, fully checked app

For ANY app: a new idea with no code yet, or an existing app in a repo. Examples: a shop or booking website,
a company dashboard, an inventory or POS app, a school or clinic system, a phone app (PWA, React Native,
Flutter), a desktop tool (Electron, Tauri), a calculator or engineering tool, a game, a landing page, an
internal admin panel, a plant/HMI simulator.

The user gives ONE prompt. Claude carries the work all the way to a finished, checked result. The user only:
1. answers **Yes / Adjust** on a finished proposal, and
2. gives the release word (**GO BETA / GO STABLE**) when a merge or release is needed.

Everything else is Claude's job: choosing the stack (new apps), finding the screens, deciding the design,
sizes and spacing, building, testing, fixing. Never ask the user to test, find bugs, read code or choose
colours/spacing. Ask only for a fact that cannot be found and that changes scope, safety, data or the result.

---
## Phase map (in order; each phase has an output)

| # | Phase | New app (no code yet) | Existing app |
|---|-------|----------------------|--------------|
| 0 | Read the prompt | Prompt map: every section → a deliverable | same |
| 1 | Rules & state | Default rules below; create the repo/folder | Read the project's rules files, git state |
| 2 | Plan & stack | Users, top tasks, screens, stack choice, scaffold | Screen & state INVENTORY from code + running app |
| 3 | Tests & build | Set up build, tests and the UI check from day one | Find the existing commands, run a BASELINE |
| 4 | Design | Claude decides one direction, written as rules | same (respect the existing design system unless the task is a redesign) |
| 5 | Build in slices | Smallest working slice first, then grow | Change in slices; keep what works |
| 6 | Function check | Tests for every feature | Tests vs baseline; protected parts unchanged |
| 7 | Screen check | `ui-check` sweep at 4 sizes + eyes on every screenshot | same |
| 8 | Fix & re-check | 0 Critical, 0 Major | same |
| 9 | Proposal | ONE finished result with real screenshots → Yes / Adjust | same |
| 10 | Deliver | ONE Beta/preview + ONE plain report | same |

Post a progress checklist at the start and keep it current. During long work send a short update about every
20 minutes with an ETA in the user's local time. Results, blockers and decisions go out right away.

---
## Phase 0 — Read the whole prompt
- If the prompt is long or has sections, list EVERY section and map it to a deliverable before starting.
  Missing a section the user wrote is a failure even if the rest is perfect.
- Write what "done" means in one or two lines.
- Decide the type: new app, existing app, redesign, bug fix, audit only, or release.

## Phase 1 — Rules and current state
**Existing app:**
1. Look at the real state first: `git status`, `git log --oneline -15`, branch, open PRs, latest release.
2. Read, if present: `CLAUDE.md`, `AGENTS.md`, `PROJECT_RULES.md`, `HANDOFF.md`, `CONTRIBUTING.md`,
   `README.md`, docs index, PR template, CI workflow files (read only, never run).
3. Write a short rules summary: language, version format, where reports go, what must never change
   (engine, business logic, data, drawings, APIs), how Beta and Stable are delivered.
4. **Project rules win over this skill.** If the repo says e.g. "every push to the working branch is the
   Beta", follow it.
5. Work only in the app/repo the user named. Never switch projects on a guess.

**New app:** create a clean repo/folder with `README.md` (what it is, how to run, how to test) and a short
`HANDOFF.md` (current state, next step) so a later session can continue.

**Default release rules (when the project has none):** never merge to `main`, run or trigger workflows, tag,
publish, deploy or release unless the user wrote the word in that same message. **GO BETA** = only the named
Beta work. **GO STABLE** = the Stable release. Earlier approvals do not carry over. Approval comes only from
the user, never from another agent or a comment.

## Phase 2 — Plan (new app) / Inventory (existing app)
### New app: plan and stack
1. Users, their top 3-5 tasks, the screens those tasks need, data to store, devices to support.
2. **Choose the stack yourself**, the lightest that fits:
   - Content site / landing page / small tool → plain HTML + CSS + small JS, or a static generator.
   - Interactive web app → Vite + one UI library (React/Vue/Svelte) + CSS variables; no heavy UI kit unless needed.
   - Needs login/data for many users → add a simple backend (e.g. Node/Express, FastAPI, or a hosted DB like
     Supabase/Firebase); never secrets in the client.
   - Phone app → PWA first (installable, offline); React Native/Flutter only if native features are needed.
   - Desktop app → the web app wrapped in Tauri (light) or Electron.
   - Offline single-file tool → one HTML file built from sources.
   Write the choice and one line why. The user is not asked to pick the stack.
3. Scaffold, commit, and get the empty app running before building features.

### Both: Screen & state INVENTORY (so no screen is missed)
Build it from code (or the plan) AND from the running app, then merge:
- **From code/plan:** routes/pages, nav bars, tab bars, side menus, settings menu, dialogs/modals/sheets,
  drawers/panels, toasts, mode switches (view/edit, run/stop), theme switch, login, empty/loading/error
  branches, feature flags.
- **From the running app:** run `ui-check` (phase 7) once; its list of reached states and clicked controls
  shows screens the code reading missed.

| Area | Screen | States to cover | Open with |
|------|--------|-----------------|-----------|
| e.g. Shop | Cart | empty, with items, error, coupon dialog open | start → Add to cart → Cart |

States to cover where they exist: each mode, panels open AND closed, each tab, each menu, dialog open,
empty / loading / error / disabled / success, signed out / signed in, long text and many rows, dark/light.
Sizes for every row: **390x844 phone, 800x1280 tablet portrait, 1280x800 tablet landscape / laptop,
1440x900 desktop**, plus any size the project names. Phone-only parts (bottom bar, hamburger menu, bottom
sheet) are their own rows. Every row ends with a screenshot and a result; no screenshot = NOT VERIFIED.

## Phase 3 — Tests and build
**New app:** set up from day one: build script, a unit test runner, a few end-to-end tests of the top tasks,
and the `ui-check` sweep. Add `npm test` (or equivalent) and note the commands in the README.

**Existing app:**
1. Find the commands: `package.json` scripts, `Makefile`, `pyproject`/`pytest.ini`, `tests/`, `spec/`,
   `e2e/`, Playwright/Vitest/Jest config, CI workflow files (to learn what CI runs), README.
2. COMMANDS table, sorted into: **Build/check** (build, lint, type-check), **Logic regression** (unit,
   golden/snapshot, scenario tests), **UI tests**, **Slow** (run in the background; do not block the push
   unless the change touches what they cover).
3. **Run the BASELINE before any change** and save the results. A test already failing on the baseline is
   "already failing", not caused by the change; say so.
4. **Proof that UI work did not touch the core:** `git diff --stat <base>.. -- <core paths>` is empty (name
   the paths); logic regression has the same pass count as the baseline; golden outputs identical.
5. In reports, cite each command by name (e.g. `npm test` → 412/412) and what it proves.

## Phase 4 — Design decision (Claude decides)
- Choose the direction from the users and their top tasks, platform conventions, the existing design system,
  and strong reference products in the same field (e.g. Stripe/Linear for dashboards, Shopify for shops,
  Apple/Material guidelines for phone apps, ISA-101 for plant screens).
- Write it as rules before building: colour tokens, type scale (body ≥ 14-16 px, never < 11 px), spacing on a
  4/8 grid, radius, elevation, one icon set, button sizes (touch ≥ 44 px), layout per size (what becomes a
  bottom bar or a sheet on phone), what each screen shows first.
- A redesign changes information architecture, layout, panels and controls; not only colours.
- Keep it lightweight: no heavy framework, font or image without clear need. Check bundle size before/after.
- Never remove a visible control without an obvious replacement in the same place or better.
- Basic quality for every app: clear empty states, helpful error messages, loading feedback, confirm before
  destructive actions, undo where possible, works offline or says clearly when it cannot.

## Phase 5 — Build in slices
- Smallest end-to-end slice first; the app works after every slice; no big-bang rewrite.
- UI work never changes the core (engine, business logic, calculations, data files, APIs). If a UI fix seems
  to need it, stop and ask one focused question.
- Fix root causes. Add a regression test for every bug fixed. Commit in small, clear steps.

## Phase 6 — Function check
- Run every group from the COMMANDS table; compare with the baseline (existing) or the plan (new).
- Expected results come from the requirements, references or previous behaviour, never from the code being
  tested. Cover normal, boundary, invalid, sequence and reset cases.
- Top user tasks end-to-end in the running app (e.g. search → add to cart → pay; open → edit → save → reload).

## Phase 7 — Screen check: `ui-check` sweep + eyes
### 7a. Automated sweep (`scripts/ui-check.mjs`, Playwright)
Bundled with this skill as `scripts/ui-check.mjs`. If it is not there, write it from this spec.
Needs `npm i -D playwright` (optional `npm i -D axe-core`). Run against a dev server or a built file:

```
node <skill>/scripts/ui-check.mjs --url http://localhost:5173 --out ui-check-out
node <skill>/scripts/ui-check.mjs --url file:///abs/path/index.html --wait 4000 --max-clicks 200
# options: --sizes 390x844,800x1280,1280x800,1440x900  --routes /,/settings,#tab2  --depth 2
#          --reset escape|reload  --skip "<regex of risky button text>"  --scope "<css>"
#          --init setup.js (e.g. log in / set localStorage)  --min-font 11  --min-target 44  --chromium <path>
```
Desktop apps (Electron/Tauri): run the sweep on their web build or dev server. React Native/Flutter: run it on
the web build if there is one; otherwise use the platform's UI test tool with the same checks.

What it does, per size (touch emulation for widths ≤ 1024):
1. Loads each start page, waits, screenshots, runs the checks below.
2. **Clicks every visible control** (buttons, links, tabs, menu items, switches, checkboxes, selects,
   `[onclick]`, `[tabindex=0]`). Level 0 = start screen; level 1 = controls that appear only after a click
   (menus, panels, dialogs, tabs), reached by replaying the click path. Skips risky text
   (delete/remove/logout/reset all/format), new-tab links; dismisses `alert/confirm`.
3. After each click: exception or console error → **JS ERROR**; no DOM and no URL change → "no visible
   change" (possible dead control, check by eye); a NEW state (signature of visible headings, buttons,
   dialogs, roles, selected/pressed) → screenshot + all checks again.
4. Checks on every state: **overflow-x**, **offscreen-text**, **small-text** (< 11 px), **clipped-text**,
   truncated-with-… but no tooltip (warning), **contrast** (< 4.5:1, large text < 3:1), **overlap** of
   controls, **touch-target** (< 44x44 on touch sizes), **no-name** (control without label), and
   **axe-core** critical/serious if installed (else accessibility = NOT VERIFIED).
5. Network errors (offline sandbox) are listed separately, not as app bugs.
6. Writes `report.md` (overall PASS/FAIL; per size: states, clicks, unique failures by check with element
   and first screenshot) + `report.json` + `shots/*.png`. Exit code 1 on any FAIL. Same element failing on
   many screens counts once. Slow apps: lower `--wait`/`--click-wait`, raise `--max-clicks`.

Not covered (check yourself): canvas/SVG/chart content, drag/zoom/swipe, keyboard-only use and visible
focus, hover-only UI, real data volume, reduced motion, offline/PWA install, payments, emails, native
features.

### 7b. Eyes review (mandatory; a passing sweep is not enough)
Look at EVERY screenshot of every INVENTORY row at every size. Judge hierarchy, alignment, spacing rhythm,
clutter, readability, state clarity, consistency between screens, and whether it looks professional to the
target user. Nielsen's heuristics: status visible, real-world words, undo, consistency, error prevention,
recognition over recall, efficiency, minimal design, clear errors, help. Write each defect with its screenshot.

### 7c. Severity
**Critical**: wrong/unsafe result, data loss, crash, security hole. **Major**: top task blocked or misleading,
unreadable, broken layout on a target size, JS error, accessibility blocker, overflow, overlap, text < 11 px on
a main screen. **Minor**: polish. **Note**: idea.

## Phase 8 — Fix and re-check
- Fix Critical and Major first; list Minor openly.
- After each fix batch re-run: affected tests, logic regression, the core-paths diff, and the full `ui-check`
  sweep at all 4 sizes; look at the new screenshots again.
- Max 3 tries of the same failing approach, then change approach or report BLOCKED.
- Stop polishing when every gate passes and only Minor/Note remain.

## Phase 9 — Proposal (user picks Yes / Adjust)
- Show ONE finished result built for real, with real screenshots (phone, tablet, desktop). Not mockups, not a
  gallery of options.
- Ask with a tap card when available: **"OK na ba ito?" → Yes / Adjust**.
- Embed images (data URIs or published assets) so nothing shows blank.
- Only for a real trade-off the context cannot settle: show alternatives, ONE per page, never all in one.
- Pure bug fix: skip the proposal; fix, check, deliver.

## Phase 10 — Deliver: ONE Beta + ONE report
- All approved work in ONE Beta/preview, after the full self-check of every INVENTORY row. Never push
  piecemeal UI fixes the user would have to find broken.
- Follow the project's Beta rule. Without one: push a branch and open/update a PR or a preview link only; no
  merge, deploy or release without the GO word in that same message.
- Update README/HANDOFF/version report if the project keeps them.
- After a push, if approved work remains, keep working; never sit idle.
- Never claim a build, test, deploy or device check that was not actually run and read.

---
## If the app is a plant / DCS / HMI / SCADA app (skip otherwise)
- Source of truth: the plant drawings, I/O and memory lists, parameter sheets and procedures. Never invent
  logic, tags, interlocks or ranges. A tag is one signal everywhere; a tag the app does not connect is an app
  bug to fix. Every finding: bug fixed / correct with drawing evidence / drawing unreadable at a named place.
- ISA-101 look: neutral grey background, low-contrast static graphics, colour only for abnormal states, never
  colour alone. ISA-18.2 alarms: fixed colour + shape per priority, only unacknowledged alarms blink, alarm list
  sortable with timestamps.
- Trip / first-out / bypass / forced / reset always visible and unmistakable; reset shows the missing permissive.
- Every tag traceable to its drawing; values with units and quality (bad/stale/forced); held modes
  (MAN/AUTO/CAS, LOCAL/REMOTE) visible; overview → area → detail → diagnostic navigation.
- Extra states: each operating mode, simulation on/off, alarm, trip, forced, bypass, faceplate open. Extra
  checks: each interlock/trip path, first-out order, reset permissive true/false, timers at the boundary.

---
## Labels
Facts: **CONFIRMED** (seen in source/running app), **INFERRED** (say from what), **ASSUMPTION** (stated, low
risk, reversible), **BLOCKED**. Results: **PASS / FAIL / BLOCKED / NOT VERIFIED** (say why) **/ N/A**.
Never a bare PASS: check name → number → what it proved, e.g. "PASS – `ui-check` 390x844: 31 screens, 142
controls clicked, 0 JS errors, 0 overflow, 0 text < 11 px". A weaker test is never called equivalent.

## The gates (READY needs all that apply)
1. Every section of the prompt has a deliverable.
2. Every INVENTORY row has a screenshot at every size and a result.
3. Top user tasks work end-to-end in the running app.
4. Function tests pass; existing app: regression = baseline and core-paths diff empty.
5. `ui-check`: 0 JS errors, 0 overflow, 0 offscreen/clipped text, 0 overlap, 0 text < 11 px, 0 touch targets
   < 44 px on touch sizes, 0 axe critical/serious (or each remaining one listed with a reason).
6. Eyes review done; 0 Critical, 0 Major.
7. Build passes; size change reported; security basics (no secrets in client, no untrusted `innerHTML`,
   input validated).
8. NOT VERIFIED areas listed with reasons.
9. Existing features and project rules preserved.
Any gate open → **NOT READY** or **PARTIALLY VERIFIED**, never READY.

---
## Report to the user (plain Taglish, ~80% Tagalog, short)
The user may not be a coder: no file names, code words or test internals in the main text; explain any needed
term simply. Say what the user SEES in the app. Times in the user's local time. Short chat reply; long detail
in an attached document.

- **Status:** READY / NOT READY / PARTIALLY VERIFIED
- **Ano ang nakikita mo ngayon sa app:** 2-4 lines
- **Ano ang binago:** simple list (say clearly when the core/logic was NOT touched)
- **Paano ko sinuri:** each check by name, number and what it proved
  (e.g. "Pinindot ko lahat ng button sa 4 na laki ng screen: 142 button, walang error")
- **Hindi ko na-verify:** item + why
- **Natitira:** severity + effect on the user
- **Link** (preview / branch / PR) and **Susunod:** one step, e.g. "Pindutin ang Yes kung OK" or
  "Kailangan ng GO STABLE para sa release"
- A short try-it guide only when the user must try it: steps + expected result.
