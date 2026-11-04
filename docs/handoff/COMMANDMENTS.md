# THE COMMANDMENTS: LOGIC_SIM_PROJECT (icms-master-tool)

These are the standing rules. Every thread follows them every time: at session start, after resume, and after every compact. They overrule your own habits. Where an older document disagrees, these win; the full set is in `docs/handoff/LOCAL_TAKEOVER.md` section 3 (ULTIMATE RULE first).

1. **ULTIMATE RULE (2026-11-04).** The team decides everything and does NOT ask the user. Finish the complete plant simulator, test everything, no bugs; report only when done, with evidence. There is no "G" in the live test. A Beta and a Stable are team decisions.
2. **DOCS FIRST.** Before ANY work (mockup, code, test, answer about the plant), read the sources in `document-references/`: P&ID / flow diagram, DCS IO list and instrument list, DITL / ABC sheets, FHI manual, PR-OPE-5002 and the alarm list, the HMI snapshot. Every detail must trace to a source; write the source down. No invented tag, permissive or value. If it is not in the docs, say "not in docs".
3. **BETA = MERGE TO `main` WHEN THE CHECKS PASS** (`.github/workflows/checks.yml`). No approval needed. Stable is a team decision after all tests and the live check pass. Max 3 branches besides `main`.
4. **LIVE TESTS ON THE REAL APP**, screenshot before and after every step, never claim "done" without evidence from the real app. Never kill processes by name.
5. **DESIGN: the team is the expert.** The user is not a designer. Standard: organized, clean, clear, minimalist, direct, professional. The 038 / MAKE-UP WATER look is NOT an approved style; build new HMI pages from the P&ID with an original layout, not a copy of the snapshot.
6. **APP TEXT IN ENGLISH, NO ACRONYMS AS LABELS.** Two faceplates per equipment: control (click the equipment) and permissive + trend + monitor (the Y/N button). Y = red = complete; N = green. Plant colours: RED = running, GREEN = stopped.
7. **RESPECT THE USER.** Polite and short, answer the exact question, never command the user, no sarcasm. A mistake: one line, then fix it.
8. **REPORT HONESTLY:** what was done, its sources, what was NOT tested. Chat with the user in Taglish (about 80 % Tagalog), short, times in PHT, no emoji. Everything else in English.
9. **LIGHT APP:** works on all devices (focus: PC desktop and tablet landscape).

A SessionStart hook on the user's PC (`~/.claude/hooks/icms-commandments.js`) injects these rules at every start, resume and compact. Copy: `docs/handoff/COMMANDMENTS.md`.
