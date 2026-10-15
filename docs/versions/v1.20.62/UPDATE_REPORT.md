# v1.20.62 (Beta) — Scenario tests: input -> output ng engine, tama ang RESULTA (user rule 2026-10-15)

**Problem:** Ang UAT ay block-level lang (bawat AND / PID / selector ay tama ayon sa kahulugan nito). Hindi nito sinusuri ang buong daloy sa isang sheet ayon sa PDF, at hindi nito sinasabing "tama" ang resulta ng loop.
**Work Done:** `tests/scenarios/` (`npm run scenarios`): bawat scenario ay serye ng GAWIN (itakda ang input, maghintay, pindutin ang AUTO / MAN / REMOTE / LOCAL, itakda ang MV / SV sa tunay na operator panel) at TINGNAN (signal, mode, button, SV switch, MV) na may inaasahang halaga na isinulat mula sa PDF, hindi mula sa engine. `docs/scenarios/ABC-007.md` = bersyong madaling basahin ng user para itama.
**ABC-007 (FICFA1071), 5 scenario, 23 tseke:** malamig na simula (fan tumigil -> force manual, AUTO disabled, SV LOCAL), pagbalik ng fan (nawawala ang force pero HINDI automatic na AUTO), AUTO tapos tumigil ang fan, MV ng manual hanggang FICFA1071.MV, MFT pulse TPS 5 s. Lahat 23 tama.
**Limitasyon:** ako ang sumulat ng inaasahan mula sa PDF; kailangang basahin at itama mo (DCS engineer) ang `docs/scenarios/ABC-007.md`. Isang sheet / loop pa lang (FICFA1071). Ang PV (plant model) ay hindi pa sakop. Hindi ito pamalit sa pagsubok sa device.

## Dagdag: buong ABC-007 (parehong loop), steady-state (user: "ABC-007 tayo, force at simulate, input -> output")
- Walang pagbabago sa app; test at docs lang. 70 tseke, lahat tama, pareho sa 3 sunod na takbo (walang flaky; naka-pause ang live run para hindi umasa sa oras).
- **T1 talaan ng katotohanan (20 kaso):** bawat kondisyon ng FORCE MANUAL ng PA (M.0180) at SA (M.0190): fan tumigil, B.0734 / B.071C / B.074C / B.0721 / B.0729 abnormal, AND ng B.0733 + B.074B, M.0138, AND ng PICFG108.MAN + PICFG108A.MAN, M.0098, house operation (PV = 230 / 245). Ang drawing ay: PA at SA ay magkahiwalay ang fan at transmitter pero ang M.0178 (PA FAN AUTO INHIBIT) ay pareho. Memory list: M.0180 = "PA MASTER FORCE MANUAL", M.0190 = "SA MASTER FORCE MANUAL".
- **T2 SV path:** REMOTE; demand ng ABC-002 (SI0045) -> BUMPLESS 0.324 T/s; LOCAL = bypass; sa house operation ang SV = 230 sa rate limit 0.5 T/s; kapag hindi house operation ay naka-bypass ang rate limit (⊠ = NOT) at sumusunod sa PV. Sinubok din ang cross-sheet na signal (itinakda sa ABC-002, nakita sa ABC-007).
- **Mali ang inaasahan ko, hindi ang app:** inakala kong naka-bypass ang rate limit sa house operation; ayon sa ⊠ (NOT) ay kabaligtaran.
- **Tala:** pagkatapos ng Reset, ang M.0098 ng ABC-003E ay 2 s na pulse (TPS) kaya parehong loop ay force manual nang 2 s sa simula. Hindi ko pa alam kung ganito rin sa totoong DCS (false rising edge sa start-up); Needs Verification.
- `docs/scenarios/ABC-007.md` ay talaan na madaling basahin para itama ng user.

## Dagdag 2: lahat ng control ng operator, kasabay ang proseso (user: "parang nagsisimulate ka at operator sabay")
Sa parehong loop (FICFA1071 at FICFA1081), pindot sa tunay na panel + gumagalaw na plant model: 156 tseke, lahat tama (tatlong sunod na takbo ang pareho).
- **O1 MANUAL:** MV field, mga button 0 / 50 / 100, at ang PV ay sumasagot sa proseso (MV 100 sa 400 s: PV tumaas ng higit 40 % ng range; MV 0 sa 10 min: bumaba).
- **O2 SV (LOCAL):** SV field, + at − (1 % ng range bawat pindot), SV switch = B.
- **O3 AUTO na may proseso:** MV field disabled sa AUTO; pagkatapos ng 20 min, ang PV ay nasa loob ng 4 % ng range mula sa SV; baguhin ang SV at sumusunod ulit ang PV.
- **O4 bumpless:** AUTO -> MAN, walang talon ng MV (<= 1.5).
- **O5 REMOTE / LOCAL:** REMOTE = AUTO talaga (MAN, SV field, MV field ay disabled; SV switch A); LOCAL = bumabalik ang operator.
- **O6 mode input:** .LOC .REM .MAN ay nagtatakda at nagto-toggle ng mga input ng drawing.
- **O7 trip sa AUTO:** tumigil ang fan -> MANUAL nang walang talon ng MV, SV LOCAL, AUTO disabled; MV manual ay sinusunod; pagbalik ng fan -> MANUAL pa rin; pindutin ang AUTO -> AUTO.
Hindi pa sakop: BU-CMD (M.0181 / RB-MV 50 %), MFT sa MV, positioner (AI0192). Susunod na kapag sinabi mong okay ang mga ito.
