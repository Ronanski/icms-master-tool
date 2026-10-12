# Update Report — v1.20.21 ABC audit

- **Problem:** ABC analog logic had no traceable, evidence-based verification against the plant drawings, and the simulator had not been compared with the faceplate workbook and I/O list.
- **As Found:** No C&E Golden test cases existed in the repo (main, branches, PR #1). Divider input order, one AI range, one MAN limit exception and two comparator set points did not match the drawings or workbooks (F-1, F-3, F-4, F-5, F-6, F-7).
- **Work Done:** Traced ABC-005, ABC-028, ABC-054, ABC-017, ABC-001B, ABC-056 and ABC-001A against the drawing PDFs and ran timed / numeric scenarios in v1.20.21 (headless, read-only inputs). Batch-scanned all 54 sheets (140 controller blocks vs workbook, 176 AI tags vs I/O list, 15 dividers, 222 comparators, simulator Health). Applied six user-approved corrections in the analog reader of `logic-sim-v1.20.21.html`, each verified by a before / after scan. Details: `FINDINGS.md`.
- **As Left:** F-1, F-3, F-4, F-5, F-6, F-7 fixed and verified; F-2 closed (no effect). Open: N-1 (count-scale chains on ABC-005 and ABC-001B), N-2..N-4. Everything else traced so far passes.
- **Status:** In progress. Not rebuilt: `.apk`, `.exe` (the repository has no build files; they are committed binaries). No release; none without GO STABLE / GO BETA.
