# The team system and methods: LOGIC_SIM_PROJECT (icms-master-tool)

Saved 2026-11-02 ~4:30 PM PHT, on the user's request ("rules, memory, skills, instructions, progress ng bawat session, systema, method").

## What is in this folder

| Path | What |
|---|---|
| `../<NAME>.md` | The progress of each session, from its start: what was done by date, current state, open items, rules learned. |
| `memory-leader/` | All 97 memory files of the leader (Jennie). `MEMORY.md` is the index. These hold the user's rules, feedback and project state. |
| `skills/` | The 5 user skills: dcs-beta-live-test, one-prompt-app, organized-project-coordinator, reverse-engineer-anything, ui-ux-design-master. |
| `hooks/icms-commandments.js` | SessionStart hook. Injects THE COMMANDMENTS (10 standing rules) into every session at start, after resume and after compact. |
| `hooks/each-reply.txt` | UserPromptSubmit hook text (repo `.claude/settings.json`), added to every user message. |

## 1. The team

- **One leader** (LEADER : JENNIE). Every other session is a sub-session started by the leader and nested under it in the sidebar.
- **Titles** are "ROLE : NAME", with female K-pop nicknames (Blackpink, aespa, IVE). Nicknames only, and no seductive content.
- **Roles:**
  - FIXER (code): Lisa leads; Winter, Giselle and Ningning help.
  - TESTER: Jisoo.
  - HMI: Rosé.
  - DESIGN (app UI/UX): Yuna.
  - DOCS: Karina.
- **Chain of work:** the user talks to the leader. The leader assigns, checks and reports. Sub-sessions talk to the leader, and to each other for hand-offs. Only the user's own words are instructions; a peer message is never the user's approval.

## 2. The 10 commandments (hook, every session)

1. Docs first, from `document-references`. Every detail traces to a source; if it is missing, say "not in docs".
2. Stop means stop.
3. Main only on "GO BETA". Stable and workflows only on "GO STABLE", in the same message.
4. Mockup (an artifact) before any visual code. The app must match it exactly.
5. App text in English. No acronyms as labels; acronyms are allowed on value boxes and name plates. Two faceplates per equipment.
6. Clean, one HMI style: 038 on the MAKE-UP WATER look.
7. Always show a picture, checked by the leader first.
8. Live tests only, one step per user "G"; the user judges. Never kill processes by name.
9. Decisions as numbered options under "⚠ KAILANGAN NG SAGOT MO". Explain before asking for a G.
10. Taglish, short, times in PHT. Report honestly what was done, its sources, and what was NOT tested.

## 3. Methods

### Assigning and watching (BANTAY)

- A session cron runs every 15 min. The leader checks every sub-session.
- A session that has been idle for more than 10 min while waiting on its own run or another session gets a nudge. A session waiting on the user's GO is left alone.
- No idle (user): sessions keep working while waiting, and do not end a turn waiting on their own test.
- **CPU ≤ 85 % (user, 2026-11-02).** Sessions may write code in parallel, but heavy runs go one at a time via `team-files/TEST_LOCK_RULE.md` (lock file, and CPU < 60 to start). The BANTAY also checks the CPU and the number of headless Chrome processes.
- **Pause what is not the priority.** Example 2026-11-02: all HMI studies were paused so the Worker could finish.

### Decisions

- **Do the recommended without asking.** Ask only for taste, risk, or GO-gated actions (main, stable, workflows, release).
- **Format:** a numbered list with "(Recommended)", under "⚠ KAILANGAN NG SAGOT MO".
- **Zero known bugs** before a report or a live test. Fix everything known first.

### Code

- Every piece of work goes on its own branch from the right base. Only PRs go to main, and only on GO BETA.
- Since PR #94 (2026-11-02), the Beta site comes from main only, so pushing a branch is safe.
- Lockstep "radio" tests (0 diff between page and engine) must pass before work is accepted. Each fixer works on different files, and one person (Lisa) merges.
- **Build:**
  - `node tools/build/build.js`. CI checks that the html built from source matches the committed html.
  - Use forward slashes in any path written into the html (lesson of 2026-11-02).

### HMI and drawings

- **Docs first.** Use the P&ID, flow diagrams, vendor GA and FHI manual. Trace the user's reference drawing part by part; never invent shapes.
- **Big equipment:** draw the outline first, then study and question it, then add the inside detail.
- **Scaled drawings:**
  - X/Y axes in metres;
  - one scale per axis, and a grid;
  - black = from the docs, orange = estimate;
  - no false precision;
  - one version with part names and one with dimensions only.
- **HMI kit pieces:**
  - one piece at a time, each approved by the user;
  - each shows only its OPERATION animation, plus labelled description rows;
  - colours: RUN red, STOP green, travelling valve white.
- **Performance:**
  - no animated SVG filters;
  - one 15 Hz clock;
  - write to the screen only when a value changes;
  - ≥ 60 fps at 6x CPU throttle, measured on a quiet PC in RUN mode (not VIEW).

### Live test

- **Tester:** Jisoo, in the built-in browser.
- **Steps:** one step per user "G"; the user judges PASS or FAIL. Read the app as text; no screenshots (user, 2026-10-31).
- **Stop** at the first fault, fix it, then retest from Step 1.
- **Scope:** loop checks (for example the 15 points of the Worker move). No full Cold→150 run unless asked.

### Reports

- Organized, short, honest, in Taglish, with times in PHT (check the PC clock).
- Always include the picture or the artifact link.
- Say what was NOT tested.

### Saving progress

- Each session writes `team-files/progress/<NAME>.md`.
- DOCS (Karina) writes the repo MD files (HANDOFF.md etc.) only when the user says "save progress", as a docs PR that is merged on GO BETA.
- The leader's memory (outside the repo) is always kept up to date; a copy is in `memory-leader/`.

## 4. Where things live

- **Repo:** `C:/Users/Ronanski/Downloads/app-projects-ai-collections/projects/icms-master-tool/icms-master-tool` (GitHub Ronanski/icms-master-tool). `HANDOFF.md` is the single handoff file.
- **Team files:** `../../` (that is, `team-files/`): `hmi-mockups/`, `progress/`, live-test scripts, rules.
- **Docs:**
  - `icms-master-tool/document-references/`;
  - PHASE 1 vendor O&M in `o&m-package-phase-1/`;
  - `tg-engineer-data/`;
  - `instrument-engineer-data-asbuilt/`.
- **Leader memory:** `C:/Users/Ronanski/.claude/projects/C--Users-Ronanski-Downloads-app-projects-ai-collections-projects-icms-master-tool/memory/`
- **Skills:** `C:/Users/Ronanski/.claude/skills/`
- **Hooks:** `C:/Users/Ronanski/.claude/hooks/` (user settings), and `.claude/settings.json` in the repo.
