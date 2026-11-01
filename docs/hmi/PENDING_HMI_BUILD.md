# PENDING HMI BUILD (approved mockups waiting to be coded)

User rule (2026-10-31): the app page made by the HMI thread must look EXACTLY like the approved mockup ("ganyan na ganyan").
No own design. Before reporting, the HMI thread puts a screenshot of the app page beside the mockup; the leader compares,
and only then is it shown to the user. Code goes into the app only after the user's GO BETA.

| Page | Approved mockup (file in docs/hmi/mockups/) | Artifact | Approved | Status |
| --- | --- | --- | --- | --- |
| 038 AIR PREHEATER | 038-air-preheater-v15.html | https://claude.ai/artifact/ERonWczg8MEvi6AWsL7qCP | 2026-10-31 (v14 "perfect!", v15 adds SVPA1052, bearing temps, first-out list) | DONE in app, beta.78 (PR #91, 2026-11-01); replaced old v5 |
| 039 RH / SH BIASING DAMPER | (approved mockup, Style B x-ray, flue gas option A; file not in repo) | - | 2026-11-01 (per user "Yung mga approved. Ipalagay mo na sa app.") | DONE in app, beta.78 (PR #91) |

How to build (for the HMI thread):
1. Copy the drawing and animations from the mockup file; same coordinates, colours, sizes.
2. New shared pieces go into src/ui/plant/hmi-sym.js (pipe with flow, motor with fan, gearbox, line-end label) for reuse.
3. Wire every value / status to the real tag or address (DITL-43/44, SVPA1052, TIFA/TIFG/PISB/DPIFG/IIFA tags).
4. Use the app's two faceplates (#59): control on the equipment, Y/N for permissive + trend + monitor.

Next mockups (leader makes them, one at a time, user approves each): 028, 002, 003, 006, new 007, then batches 2-4 and 030.
