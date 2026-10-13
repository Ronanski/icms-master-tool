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
- Do not change DITL logic, its engine, or page behavior during ABC-only work unless the user explicitly approves it.
- UI-only changes are allowed only when they do not affect logic, simulation, or existing page behavior.
- Explain the proposed functional change and its impact before asking for approval.
- No Stable/Beta release, release packaging, or claim of successful build until the user explicitly says **GO STABLE** or **GO BETA**.
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
- No release or build claim without GO STABLE / GO BETA.

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
