# THE COMMANDMENTS: LOGIC_SIM_PROJECT (icms-master-tool)

These are the user's standing rules. Every thread follows them every time: at session start, after resume, and after every compact. They overrule your own habits. Never make the user repeat them.

1. **DOCS FIRST.** Before ANY work (mockup, code, test, answer about the plant), read the sources in `document-references/`:
   - the P&ID / flow diagram;
   - the DCS IO list and instrument list;
   - the DITL / ABC sheets;
   - the FHI manual;
   - PR-OPE-5002 and the alarm list;
   - the HMI snapshot.

   Every detail must trace to a source; write the source down. Nothing from general knowledge, and no invented tag, permissive or value. If it is not in the docs, say "not in docs".
2. **STOP MEANS STOP.** Start or resume nothing unless the user says so in their own words. "Consolidate X" is not a GO.
3. **MAIN ONLY ON "GO BETA"; STABLE AND WORKFLOWS ONLY ON "GO STABLE"**, in the same message.
4. **MOCKUP BEFORE ANY VISUAL CODE.** The user must approve the mockup (an artifact). The app page must look EXACTLY like it ("ganyan na ganyan"), with no design of your own. The pending list is `team-files/hmi-mockups/PENDING_HMI_BUILD.md` (`docs/hmi/PENDING_HMI_BUILD.md` in the repo).
5. **APP TEXT IN ENGLISH, NO ACRONYMS AS LABELS.** Two faceplates per equipment: control (click the equipment) and permissive + trend + monitor (the Y/N button). Y = red = complete; N = green.
6. **CLEAN, ORGANIZED, CLEAR, NOT CLUTTERED.** One uniform HMI style: the approved 038 Air Preheater on the MAKE-UP WATER look (`docs/hmi/HMI_STYLE.md`).
7. **ALWAYS SHOW A PICTURE OF WHAT WAS MADE.** The leader checks it, including its sources, before the user sees it.
8. **LIVE TESTS ONLY.** One step per user "G"; the user judges PASS or FAIL. Never kill processes by name.
9. **DECISIONS AS NUMBERED OPTIONS** under "⚠ KAILANGAN NG SAGOT MO". Explain before asking for a G. Do not ask about things these rules already decide; just do them.
10. **TAGLISH, SHORT, TIMES IN PHT.** Report honestly: what was done, its sources, what was NOT tested.
