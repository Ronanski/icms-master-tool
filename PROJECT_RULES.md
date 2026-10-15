# Project Rules — DCS Logic Simulator

These rules are the permanent operating guide for any AI or developer working on this repository. Read this file and `HANDOFF.md` before starting work.

## 1. Project priorities

1. Preserve the existing simulator and its working behavior.
2. Audit ABC analog logic against the plant's actual drawings and supporting references.
3. Keep the repository organized; do not create duplicate or redundant documents.
4. Explain findings and technical terms in clear Taglish. Do not assume the user is a software developer.

## 2. Source-of-truth order

Use the files under `document-references/` before making assumptions.

- Plant-specific DCS logic diagrams (PDFs / page exports): primary reference for logic, signal paths, inputs, outputs, and page links.
- DCS I/O list: tag, signal type, address, channel, and I/O mapping cross-check.
- Memory lists STN101–STN105: memory addresses and controller/station cross-check.
- Linear curves / F(X): analog function, curve, and scaling cross-check.
- Digital and analog symbol legends: symbol meaning and block interpretation.
- PID/PIDV/SUMA/MAN parameter summary and calculation workbooks: relevant configuration and calculation cross-checks.
- DCS textbook: supporting explanation of general DCS concepts, not a replacement for plant-specific drawings.

If references conflict, are unclear, or do not show enough evidence, mark the point **Needs Verification**. Do not silently choose a convenient answer. Do not invent tag mappings, parameters, equations, values, or expected results.

## 3. Golden Reference / C&E audit method

The Golden Reference is a documented set of expected behaviors derived from source documents; it is not an AI-generated guess and is not automatically correct merely because it was generated.

For each test case, record:
- Test ID and ABC page/block or signal path
- Source document and exact page/sheet/reference where available
- Input condition(s)
- Expected intermediate and final output(s)
- Actual simulator result
- Verdict: Pass, Fail, Needs Verification, or Cannot Verify
- Evidence and a short plain-language explanation

Trace the complete path from input through blocks to output, including cross-page connections where relevant. Validate digital/analog types, address/station mapping, function curves, and applicable controller behavior. Separate verified facts from assumptions.

## 4. Change-control rules

- Audit first; do not change logic just to make it match an unverified Golden Reference.
- DITL (user, 2026-10-15: "nirerevoke ko na ang DITL rule ko"): the DITL logic, its engine and its page MAY be changed when it improves the simulation of the whole app (tracing per click, forcing, plant simulation, one world ABC + DITL). Still: follow the drawing, keep what works, prove the change with a test, and report it like any engine change.
- UI-only changes are allowed only when they do not affect logic, simulation, or existing page behavior.
- Explain the proposed functional change and its impact before asking for approval.
- Stable release, merge to `main`, workflow run and release packaging only when the user says **GO STABLE** in that message. Beta needs no GO: see 5e.
- Never claim that HTML, portable EXE, or APK was built or tested unless it was actually done and evidence is available.
- Keep the existing version naming convention. Do not infer the runtime version solely from a filename.

## 4a. Value basis (user decision)

The simulator shows **real values** (T/H, kg/cm², MW, %, °C). It does not simulate the DCS percent-of-range or count scaling (100 % = 10000). Where a drawing constant exists only for that scaling (SCALE CONVERT a/b, ×10000 and similar), the scaling is done **as a user would**, so the real value appears on screen. Each such change is recorded as a finding with its basis (the ranges and labels printed on the drawing, the reference workbooks) and listed for the user's verification.

## 5. Repository documentation — keep it clean

Maintain only these central documents unless the project genuinely needs more:
- `README.md`: short repository overview and links to key documents.
- `PROJECT_RULES.md`: permanent rules and source hierarchy.
- `HANDOFF.md`: one current, non-cumulative state of the project and next actions.
- `docs/abc-audit/ABC-AUDIT.md`: master ABC audit index, methodology, summary, and links to evidence.

Create version-specific findings/progress/update reports only when there is actual work or evidence to record. Use one version folder per verified app version under `docs/versions/<version>/`; do not create empty placeholder files or duplicate the same status in multiple places. Keep large source PDFs, spreadsheets, ZIPs, and application binaries in their existing locations; do not copy them into documentation folders.

After every meaningful task, update `HANDOFF.md` before finishing. For version-specific work, record findings and progress with evidence, and maintain the update report fields: Problem, As Found, Work Done, As Left, Status.

## 5a. Report documents for the user (PDF / chat)

- Language: Taglish (Tagalog with the usual English technical terms and tags), short sentences, plain words.
- Layout: portrait A4, large type (body 10 pt or more), one item per card (Problem, As Found, Work Done, As Left, Status, Where, What to verify). No wide tables; the user reads on a phone or tablet.
- Colors: dark background with soft light text (no bright white page); status colors muted (green Pass, amber Needs Verification, red Fail).
- Content: say where in the diagram (sheet, tag, area) and what to type / expect; list the items needing user verification separately and last.
- No Stable release or build claim without GO STABLE.

## 6. Completion and communication

Before reporting completion:
- State what files changed and link to the relevant commit or PR.
- State what was checked and what was not checked.
- List remaining issues and the next concrete action.
- Use precise statuses: Confirmed, Suspected, Needs Verification, Cannot Verify, Pass, or Fail.
- Do not call a task complete merely because documentation was written.

## 5b. Only this repository (user, 2026-10-13)
- Work ONLY in Ronanski/icms-master-tool. Do not read, run, copy from, push to or change any other repository (including Ronanski/dcs-logic-sim), and do not run its tools. If something is needed from another repo, say so and wait for the user.
- The apk / exe are built and released from this repository (release.yml); they load this repository's Pages site (Stable and Beta).
- Record: before this rule, two commits were pushed by mistake to the working branch of dcs-logic-sim (9c18f57, 3492cbf) and the branch claude/v1.20.22-abc-audit was created there. They are left as they are; the user decides.
- Working style (user): Taglish, short; no questions the repository can answer; no repeated test runs, test only after a fix and only for that fix.
- User rules (2026-10-13): (1) No release, no merge to main and no workflow run (release, clean, site) unless the user says so in that message. (2) The UAT goes to the user in the chat (SendUserFile), never into the Releases or any GitHub release asset; it lives inside the app (UAT button). (3) Releases are Stable only: one apk, one portable exe, html and report; Beta is only the html of a pushed branch. A change stays on its branch until the user says GO STABLE.

## 5c. Live values, simulation and plant model (user, 2026-10-14; source: `document-references/values-logic-sim-end-user-report.xlsx`)
- Read that workbook before touching the live values, the symbols, the selectors, the ranges or the ramps. Its RULES, "Findings / Wishlist" (20 items), UI list and "Priority next version" are the user's requirements.
- Live values: one runtime value per net; every label and wire display of the net shows the same value; values do not hide wires, blocks, text or other values; side = aligned, above / below = centred. Shown on: instrument tags, module addresses (AI / AO / SI), tags with .SV / .MV / .PV, block inputs and outputs (not repeated where an address already shows it), wires without a tag. A valve / damper / motor shows its % opening on the equipment, not on its tag or positioner.
- Ranges written on the drawing are strict for every input, slider and manual value (also where the signal is the output of another block).
- Symbols follow the legend `analog logic symbols legend.pdf`: a block with a wrong or empty symbol is a defect.
- A test is only "pass" for what it really checked: a block that was skipped or not covered is reported as NOT TESTED, never as pass. The user does not verify; if something cannot be decided from the repository, say exactly what is missing instead of "Needs Verification".
- Plant model: it only decides how the PV answers to the valve (ON: the PV moves with the controller output; OFF: the PV is an input the user sets). The logic and the A/M, PV / SV / MV relations must work in both cases.
- Bawat pagbabago sa engine ay nagsisimula sa trace ng drawing (sheet, tag, block, legend), nakasulat sa `docs/versions/<version>/DRAWING_TRACE.md` bago ang code (user, 2026-10-14; ang trace ng v1.20.34 ay ginawa pagkatapos at ito ay pagkakamali).

## 5d. Sources and build (user, 2026-10-14)
- The simulator is built from `src/` (see `src/README.md`). Edit `src/` and run `npm run build`; never edit `logic-sim-vX.Y.Z.html` by hand. The Checks run fails if the committed html is not exactly what `src/` builds.
- The version is `src/version.txt`; when it changes, the build writes the new html and removes the old one.

## 5f. Version standard (user, 2026-10-15: "istandard natin"; SemVer)
- Format: `MAJOR.MINOR.PATCH` for Stable and `MAJOR.MINOR.PATCH-beta.N` for Beta (example: Stable `1.21.0`, Beta `1.21.0-beta.7`). The html is `dist/logic-sim-v<version>.html`.
- The Stable number moves ONLY at a Stable release (GO STABLE). Between two Stables every push is a Beta of the NEXT Stable: only `N` goes up (`-beta.1`, `-beta.2`, ...). Never use up a patch number for a Beta push (this is why v1.20.38 became v1.20.67 in two days: wrong).
- MINOR (`1.20.x` -> `1.21.0`): something new that the user sees or a behaviour change (new faceplate, new UAT, new rule). PATCH (`1.21.0` -> `1.21.1`): fixes only. MAJOR (`1.x` -> `2.0.0`): a new generation of the app (whole new look and workflow, or a change that does not work with old saved data). User, 2026-10-15: "standard tayo, baka umabot ng v1.9999": the Console look + English app text is `2.0.0`.
- A Stable that has fixes only is a PATCH (`2.0.1`), not a MINOR. Batch the new features of several Betas into one MINOR Stable; do not release a MINOR for every small change.
- Language: the app text (buttons, labels, messages, tests shown in the app) is professional English; the chat and the docs stay Taglish (user, 2026-10-15).
- Release: before GO STABLE, set `src/version.txt` to the Stable number (no `-beta.N`), build, then merge and run `release.yml` with `GO v<version>`; the workflow refuses a version that has `-beta`.
- The in-app update check compares in SemVer order: `1.21.0-beta.2` > `1.21.0-beta.1`, and `1.21.0` > any `1.21.0-beta.N`.
- Reports: one folder per TARGET version, `docs/versions/v<MAJOR.MINOR.PATCH>/UPDATE_REPORT.md`, with a section per Beta (`beta.N`); the release report PDF is made at the Stable only. Folders `v1.20.60` ~ `v1.20.67` are the history before this standard (= the work of `1.21.0-beta.1`).

## 5e. Beta policy (user, 2026-10-14; replaces the GO BETA rule)
- Every fix or update is committed and pushed to the working branch right away; the push IS the Beta release (the Beta page `/beta/` and the in-app channel detect the new version). No GO BETA needed any more.
- Each push: bump the Beta number in `src/version.txt` (see 5f), `npm run build`, `npm run check`, test only the fix, update `HANDOFF.md` and the version report, then tell the user what to check.
- Still needs the user's explicit **GO STABLE** in that message: merge to `main`, any workflow run (release, clean), Stable release (apk, exe, html, report). Never assume permission from an older message.
