# Update Report — v1.20.21 ABC audit

- **Problem:** ABC analog logic had no traceable, evidence-based verification against the plant drawings.
- **As Found:** No C&E Golden test cases existed in the repo (main, branches, PR #1). `ABC-AUDIT.md` recorded no verified results.
- **Work Done:** Loaded v1.20.21 headless, read-only. Traced ABC-005 from the drawing PDF, wrote 9 test cases, ran them against the simulator, compared the ÷ block structure with the drawing, and cross-checked tags/addresses against the I/O list and memory list 101. Details in `FINDINGS.md`.
- **As Left:** 8 Pass, 1 Fail (F-1), 4 Needs Verification, 2 Cannot Verify (AB0114-0116, controller tags). No simulator, DITL, or reference file was changed. No build or release.
- **Status:** ABC-005 partially audited. F-1 awaits user decision on a fix.
