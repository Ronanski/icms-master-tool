# New account setup (2026-11-15)

Step by step for a new Claude account on the user's PC (Ronanski-PC). Replaces the old `docs/handoff/NEW_ACCOUNT_SETUP.md` (2026-10-30) where they differ. No private data in this file (the repo is public).

## A. What the user does (once, about 10 minutes)

1. **Claude desktop app.** Sign out of the old account, sign in with the new account (Max plan). Open the **Code** tab.
2. **Folder.** In the Code tab choose the folder `C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool` (the parent folder; the repo is the `icms-master-tool` folder inside it). Approve it when asked.
3. **GitHub for claude.ai.** Open https://claude.ai/connect-github and sign in as `Ronanski`. Allow the Claude GitHub App on `Ronanski/icms-master-tool` (and `Ronanski/icms-plant-documents`, private).
4. **Project.** On claude.ai create a project (for example `LOGIC_SIM_PROJECT`). Project settings: Resources: add the repo. Instructions: paste the project instructions (section D).
5. **Remote Control.** In the desktop app, Code tab, turn on Remote Control for the folder above, so project threads can run on the PC. Keep the PC awake and on Wi-Fi.
6. **Start prompt.** Paste the prompt in section E as the first message in the project chat.

Everything else is done by Claude (section B). The user does not need to type commands.

## B. What Claude does on the PC (no questions to the user)

1. **Tools check** (PowerShell or Git Bash in the repo folder):
   - `git --version`, `node --version` (Node 24), `npm --version`, `gh --version`.
   - `gh auth status`. If not logged in, ask the user once to run `gh auth login` (browser sign-in as `Ronanski`); this is the only command the user may need.
   - `git config core.autocrlf` stays as it is on this PC (see memory "Windows test setup").
2. **Repo.** `cd icms-master-tool`, `git fetch origin`, `git checkout main`, `git pull`. Check `src/version.txt` and `git log --oneline -5`.
3. **Build.** `npm install` (first time), then `npm run build` and `npm run check` (expect `SAME`).
4. **Memory.** The Claude Code memory folder is local and stays on the PC when the account changes: `%USERPROFILE%\.claude\projects\C--Users-Ronanski-Downloads-app-projects-ai-collections-projects-icms-master-tool\memory\` (index `MEMORY.md`, about 150 files). Read `MEMORY.md` first. Nothing to import.
5. **Rules hook.** `%USERPROFILE%\.claude\hooks\icms-commandments.js` injects the Commandments at session start. It must match `docs/handoff/COMMANDMENTS.md`. It stays on the PC.
6. **Skills.** Account skills do not move to the new account. Copies: `docs/handoff/skills/` in the repo. Propose each folder as a skill (the user only presses Save).
7. **Tracker.** The old tracker artifact belongs to the old account. Data copy: `turnover-private/jennie/artifacts/tracker/data/` (PC). Publish a new tracker from it and write its link in `HANDOFF.md`.

## C. Read in this order
1. `docs/turnover/INDEX.md` (all threads, PDFs, rules with dates).
2. `CLAUDE.md` (Commandments).
3. `PROJECT_RULES.md`, `docs/SPEC.md`.
4. `HANDOFF.md` (state, versions, next).
5. `docs/turnover/JENNIE_LEADER.md` (plant model state and open items).
6. PC only: `turnover-private/<thread>/` PDFs (Jennie, Yoona, Arin, Chaewon, Hanni, Momo, Sakura, Sohee), `team-files/STATE.md`.

Where the plant documents are: PC `icms-master-tool/document-references/` (git-ignored; list in its `INDEX.md`), the company OneDrive folders listed in `docs/DOCUMENT_INDEX.md` (full file lists in `document-references/_notes/file-lists`), and the private repo `Ronanski/icms-plant-documents`. Never copy plant documents into the public repo.

## Merge gate
- Beta: a PR merges to `main` only when Checks pass. On 2026-11-15 the coordinator asked for no merges without the user's explicit GO; until the user says otherwise, open the PR and wait for the user's GO.
- Stable and any manual workflow: only on the user's written "GO STABLE".
- Version = main + 1; build, check SAME; PR body starts with the attribution block (see `CLAUDE.md` and HANDOFF).

## D. Project instructions (paste into Project settings, Instructions)
Use the current instructions of the old project (copy them from the old project's settings before it closes). Key lines that must stay:
- Ultimate rule: the team decides and finishes; test everything, no bugs; G for live tests removed; Beta and Stable are the team's decision (Stable still needs "GO STABLE").
- Always refer to the GitHub repository before asking the user.
- Act as an elite DCS engineer and UI/UX expert; organized, clean, clear, minimalist, direct, professional.
- Keep the app lightweight on all devices.
- Treat the user with respect; polite and short; answer the exact question; never command the user.
- Coordinator: every user order becomes a running thread; watch every thread until it has a result.
- Thread titles all caps.

## E. Start prompt (first message in the new project chat)
```
Bagong account ito ng LOGIC_SIM_PROJECT (LMYP Unit 1 DCS Logic at Plant Simulator, repo Ronanski/icms-master-tool, PC folder C:\Users\Ronanski\Downloads\app-projects-ai-collections\projects\icms-master-tool).
1. Basahin nang sunod-sunod: docs/turnover/INDEX.md, CLAUDE.md, PROJECT_RULES.md, HANDOFF.md, docs/turnover/JENNIE_LEADER.md, docs/turnover/NEW_ACCOUNT_SETUP.md, at ang mga PDF sa turnover-private/ sa PC.
2. Gawin ang bahagi B ng NEW_ACCOUNT_SETUP.md (tools, repo, build, memory, hook, skills, bagong tracker).
3. Buuin ang team ayon sa INDEX.md seksyon 5 (Jennie leader, Sakura turbine, Chaewon boiler, at iba pa) at ituloy ang open items ng bawat turnover.
4. Iulat sa akin nang maikli (Taglish): kasalukuyang Beta, ano ang bukas, ano ang susunod.
Walang merge sa main nang walang GO ko. Stable lang sa GO STABLE.
```
