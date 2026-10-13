# Read first (user rule)

Before any reply or change: read `PROJECT_RULES.md` and `HANDOFF.md` in this repository. Look at the repository state first (git log, files), never answer from memory.

Short version of what the user insists on:
- Work only in this repository. Taglish, short and plain; the user is not a coder and does not read diagrams: give exact steps and exact expected values.
- No release, no merge to main, no workflow run unless the user says so in that message (GO STABLE for Stable; Beta is only a pushed branch). Releases are Stable only: one apk, one portable exe, html, report. No UAT file in Releases: the UAT is inside the app and goes to the user in the chat.
- No questions the repository can answer. No repeated test runs: test only after a fix, only for that fix.
- Report: what changed, what was checked, what was not checked, next action (PROJECT_RULES 6).
