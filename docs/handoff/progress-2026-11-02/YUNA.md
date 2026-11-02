# YUNA: progress (APP UI/UX thread) · saved 2026-11-02 PHT

**Session:** APP UI/UX thread, started by the LEADER (Jennie, local_ea5f329e).

- **Worktree:** `icms-master-tool/.claude/worktrees/app-uiux-853c3a`
- **Branch:** `claude/app-uiux-853c3a`
- **PR:** Ronanski/icms-master-tool **#87** (merged 2026-10-31)

## 1. What I did, by date

### 2026-10-31: app UI/UX, PR #87

All on branch `claude/app-uiux-853c3a`. There is no version bump; the leader assigns beta.77.

**Commits**

| Commit | What it did |
|---|---|
| `0230c1f` | Live test bug fixes with no visual change: **#69** ResizeObserver error banner is ignored; **#61** the Training dock is a child of `body` again, so it is in the accessibility tree, and the generic `body.app2` rules exclude the dock through `:where(:not(#gdock…))` (verified: 0 style differences in 12 states); **#43** faceplate closing |
| `5569e95` | **#43** dropped (fixed by the HMI thread in PR #86); `fp-pop.js` back to main |
| `c0a12ef` | **Training dock v3** (user "g dock"), with the parts listed below |
| `a62ebb8` | **#60**: "▶ Training n / N" button in the top bar while the dock is hidden, plus a self-healing dock layout; CODE FIXER **#49** values merged into the dock check block |
| `0ad253b` | **English only** in the whole app (user 2026-10-31): Training steps (`guide.js`, about 210 strings), Why texts (`pr-ope-5002-why.js`, 226 strings), Home and app messages |
| `0ac7410` | build |
| `b5d527d` | dock fixes: RUN / STOP colour on the top values, Permissive Y / N count, narrow chips on tablet |
| `c069463` | dock fixes: narrow chips (tablet) without the number circle |
| `1a03fac` | **Leader review**: no ellipsis on the names (they wrap); the Permissive chip shows Y / N with a word; Start shows "not started" |

**Training dock v3 (commit `c0a12ef`)**
- "Section n / 44" and the step title at the top.
- NEXT says who (field operator / control room), what to do, and the logic address.
- The dock is a **guide only**: it never presses START / AUTO / REMOTE for the operator.
- Value rows show a plain name, value, band and ✓ / !.
- Equipment cards show a RUN / STOP lamp and Permissive Y / N.
- Stage chips show the full name and a count.
- **#52:** NEXT can point at an auto item.
- **#65:** a field step on the local panel.
- **#47:** FIELD is shown instead of a fake value.
- Speed control is one "×1 ▾" button.

**Other work that day**
- Mock-up and before/after screenshots at PC 1366 × 768 and tablet landscape.
- Leader accepted the fixes and gave a new rule: never kill processes by name. I saved it as memory.

### 2026-11-01: audits of the HMI mockups (audit only, no edits)

- **028-full.html:** FAIL on all 7 user checklist items. 3 critical: `med.mu` undefined so the make-up lines were black; text outside the canvas; the 038 / 039 frame missing.
- **028-v10 re-audit:** 6 PASS / 1 FAIL; 8 major label overlaps.
- **028-v10 re-audit 3:** 7 / 7 PASS; 3 major left.
- **007-v1:**
  - 6 / 7 PASS;
  - 2 critical: most of the 7.PNG values missing, and 7 click targets without a handler;
  - the permissive faceplate is still a placeholder.

The reports are in the leader notes folder: `028-full-AUDIT-appuiux.md`, `028-v10-AUDIT-appuiux.md`, `028-v10-AUDIT3-appuiux.md`, `007-v1-AUDIT-appuiux.md`.

### 2026-11-02: HMI kit research and outline studies (team-files/hmi-mockups/)

**Facts files**
- `kit-facts-remaining.md`: pieces 28 to 33, plus round 2 and round 3.
  - **TG:** every L2 TG drawing is **Davao / Malita** (sister unit).
  - **Generator:** bus is 13.8 kV; the MVA rating is not in the docs.
- `kit-facts-inside.md`: furnace, cyclone, seal pot and back pass from the FHI manual (PP Data table, P2S4/S5, P3S1/S3, P4S1-S3). The "New docs" section has the **Limay ESP GA** and the drum level gauge.

**Outline studies** (one scale; black = from the docs, orange = estimate)

| Study | File | Status |
|---|---|---|
| Air heater | `aph-outline-study.html` | Published by Jennie (https://claude.ai/artifact/FW1sCSt9aKeNbmonMEj1EB) |
| ESP | `esp-outline-study.html` | Published by Jennie |
| Stack | `stack-outline-study.html` | Published by Jennie (https://claude.ai/artifact/3yDNqa1HBkZv3zxJZCgH4f) |
| Silos | `silo-outline-study.html` | Published by Jennie |
| Turbine + generator | `tg-outline-study.html` | Published by Jennie, with the sister-unit warning |
| Back pass inside | `backpass-inside-study.html` | Diagram only, not to scale; not published |

**New docs**
- `new-docs-index.md`: 96 files in `tg-engineer-data/` and `instrument-engineer-data-asbuilt/`, one line each.
- Key file: `E2-0-121` Graphic Design of DCS Operation Station.

**Saved and stopped**
- `STUDY_PROGRESS.md` is saved.
- All studies stopped on the user's order.

## 2. Current state

- **Studies:** all **paused** on the user's order. Details are in `team-files/hmi-mockups/STUDY_PROGRESS.md`.
- **PR #87: MERGED** (2026-10-31 11:54 UTC). Commit `1a03fac` is in `origin/main`, and the remote branch was deleted. No unpushed commits.
- **Processes:** none of mine running. Each render script closes its own browser.
- **Untracked file:** `.claude/launch.json` is local only and not committed.

## 3. Still open

- **ESP study:** update it from the Limay GA (`D1-0-016` pdf p116 / p119) when the user orders.
- **Silo study:** re-render fly ash `E10209-1-220A/B` and the sand / limestone nozzle orientation. `L5-1 Fly Ash SECURED.pdf` was not found at `o&m-package-phase-1/` on the path I tried.
- **New docs index:** files #73 to #96 have thumbnails only and were not reviewed.
- **Boiler dimensions not found yet:**
  - drum length and elevation;
  - roof and grate elevation;
  - seal pot size;
  - back pass outline;
  - coal silo size.
- **App:** the #60 root cause is not reproduced (mitigated only), and the #41 purge flow is text only. Neither is assigned now.

## 4. User rules I follow

- **Merging:** only the leader merges to `main`, and only on the user's own **GO BETA**. **GO STABLE** is needed for Stable and for workflows. Pushing to my own branch needs no GO.
- **STOP means STOP:** start nothing unless the user says so.
- **Mock-up before visual code:** the user approves the mockup first. Never remove a control without a replacement.
- **App text:** **English only**; no acronym as the main label, plain name first. Colours: RUN red, STOP green; Y red = complete, N green = not complete.
- **Faceplates:** two per equipment (control; permissive + trend + monitor). Every control is tied to a real logic address.
- **The Training dock is a guide only:** it never presses controls, and the word "coach" is not used.
- **Docs first:** every number comes from a document; black = from the docs, orange = estimate; write "not in docs" when it is not there.
- **Evidence before claims:** say what was not tested.
- **Process handling:** never kill processes by name (the user's own Chrome runs on this PC). Close only what I started (`browser.close()` or my own PID).
- **Repo docs:** do not edit the repo MD docs. Docs change only on "save progress" in the DOCS thread.
- **Communication:** Taglish, short, times in PHT. Report what was changed, tested, not tested, what is left and what is next. One line to the leader per finished task.
- **"G tipid" (save usage):** no heavy runs, no repeated full re-shoots, small screenshots, idle between tasks.
