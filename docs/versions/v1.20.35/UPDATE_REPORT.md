# v1.20.35 (Beta, branch `claude/blissful-mendel-xtceew`)

- **Problem:** ang mga T switch na may COS (A/M) ay "hindi gumagana" sa Operator faceplate (finding 20 ng Excel ng user).
- **As Found:** sa Operator tab, ang AUTO / MAN / MV buttons ay kumikilos sa PINAKAUNANG selector pagkatapos ng PID. Sa 14 sa 68 na controller (halimbawa ABC-007 FICFA1081 at FICFA1071, ABC-011 TICBR1140, ABC-012 TICMS1004, ABC-031 LICCD1110B, ABC-035 ~ 039, ABC-052, ABC-053) ang unang selector ay ang "FAULT hold" (B/T), hindi ang A/M station na may COS. Kaya ang MAN / AUTO ay kumilos sa maling switch at ang "MV (MAN)" ay "(walang manual input)". Sinukat: 41 sa 68 ang tama bago ang fix.
- **Drawing (ABC-007, tingnan ang `docs/versions/v1.20.34/DRAWING_TRACE.md` 1):** PID -> T switch na "1:B FAULT" -> T switch na may COS "A/M" (1:A, 1:B) -> AO. Ang A/M station ay ang pangalawa.
- **Work Done:** ang faceplate ay pumipili na ng A/M station: ang selector pagkatapos ng PID na may manual source (MAN station o operator input); ang mga selector bago nito ay hindi ginagalaw. Ang MV (MAN) ay sumusulat sa MAN block kung iyon ang manual source. (UI lang, `src/ui/hmi/hmi.js`; hindi ginalaw ang engine.)
- **As Left:** `tests/regress/faceplate.js`: 68 controller, 54 ang tamang A/M station, 0 ang maling switch; 8 ang walang A/M switch pagkatapos ng PID (nasa ibang sheet o pagkatapos ng summing block: hindi nasubukan) at 6 ang walang manual source. UI flow sa ABC-007 FICFA1081 (headless): MAN -> MV 40 -> output 40 at ang PID ay sumusunod (40); AUTO -> output 40, walang talon.
- **Status:** Beta. Hindi pa nasubukan sa totoong tablet.

## Iba pa sa bersyong ito
- Ang simulator ay galing na sa `src/` (Vite dev server, `npm run build`, `npm run check`); ang html ay eksaktong parehong byte ng dati (sha256 `17c602ff...`) bago ang fix na ito. Tingnan ang `src/README.md`.
- Ang engine ay tumatakbo sa Node (`tools/engine/node-engine.js`): 51 sa 51 sheet ang pareho ng resulta sa Chromium pagkatapos ng 30 s ng simulation. Hindi pa mas mabilis ito (Node 50 s, Chromium 18 s para sa lahat ng sheet), kasi ang buong code ng page ay tumatakbo pa rin; ang tunay na paghihiwalay ng engine ay susunod.
- Nakita habang nagpo-profile: ang pagbuo ng mga link ng sheet (`ov` sa `13-links-canvas.js`) ay 14 s ng 30 s ng pag-load sa Node; ito ay malamang na dahilan ng mabagal na unang load. Susunod na i-optimize.
