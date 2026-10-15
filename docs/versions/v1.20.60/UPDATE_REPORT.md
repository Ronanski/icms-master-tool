# v1.20.60 (Beta) — Audit ng ABC-007 (PAF / SAF inlet air flow control) laban sa PDF

PDF: `document-references/analog-logic-abc.zip` > `(19)ABC-007.pdf` (binasa, dalawang loop: FICFA1071 PAF, FICFA1081 SAF).

## Function at cause-and-effect (ayon sa drawing)
- **PV**: PAF/006 (FIFA1071.PV) at SAF/006 (FIFA1081.PV) galing ABC-006. **PID** ACT:R, 0~648 T/H (1071) at 0~432 T/H (1081). Ang PID output ay dumadaan sa FAULT T (hawak ang huling MV kapag M.018B / M.019B) -> A/M T -> BU-CMD T (B = RB-MV 50 %, 1:B = M.0181 / M.0191) -> AO (damper).
- **SV T switch** (A = SI0160 / SI0170 = demand SI0045 / SI0044 sa BUMPLESS RAMP 0.05 %/sec, bypass kapag FICFA107x.LOC; B = COS ng operator). 1:B = M.0180 (1071) / M.0190 (1081) = force LOCAL.
- **A/M T switch** (A = PID, B = COS = manual MV): 1:A = M.018C / M.019C (TPS 2s: AUTO pulse), 1:B = M.0180 / M.0190 (FORCE MANUAL).
- **FORCE MANUAL** (M.0180 / M.0190) = OR ng: M.0098 (ABC-003E), transmitter bad (SIG.AB: temp, flow ng fan, B.0734, B.071C, B.0733, B.074B, B.0729, B.074C, B.0721), fan NOT running (M.3302 PA, M.3303 SA, may NOT symbol), PICFG108/108A.MAN, ANY FUEL FLOW, MFT pulse 5 s (TR30), PA FAN AUTO INHIBIT, deviation |PV - setting| <= 3 T/H sa house operation (M.018E/F, M.019E/F).
- **"IF M.018D = 1 SET SI0169 => FICFA1071.SV"**: sa house operation, ang SV ay sumusunod sa 230 T/H (PAF) / 245 T/H (SAF) na dumadaan sa rate limit (0.5T / Sec); REMOTE = FICFA107x.REM.

## As Found (app v1.20.59)
Tugma ang wiring: A/M 1:A / 1:B, SV switch 1:B, force signals, mga SET rule, constants 230 / 245 / 50 %, rate limit 0.5 T/s, BUMPLESS 0.05 %/s ng 1071.
1. **MALI:** BUMPLESS RAMP ng FICFA1081 ay 0.05 **unit**/s (span 100, "span?") imbes na 0.05 % ng 432 T/H = 0.216 T/s. Ang output nito na unang nakalista ay stub; ang SV ang ikalawa. 4.3x na mas mabagal ang SV ramp ng SAF.
2. **Kulang ang pangalan** ng mga input (M.3302, M.3303, B.0733 ...): nasa kaliwa ng dulo ng wire ang tag text kaya hindi nabibind (n94, n98, n99, ...). 111 na ganitong input sa buong ABC. Para sa panel ("Sanhi?") at sa Values; may epekto rin sa cross-sheet links. **Hindi pa inaayos: kailangan ng approval mo** (engine-wide na reader).

## Work Done
compile-step.js: kapag walang nakitang span ang RAMP / RATE na naka-% sa unang output, susubukan ang ibang output nito. Nagbago lang ang ABC-007 RAMPB#18 (span 432, rate 0.216 T/s). Ang ibang 20 RAMP / RATE ay pareho (nasukat: before / after diff).

## As Left / Na-check
UAT dry run v1.20.60: 2458 items, 6808 cases, 0 failing. Hindi pa nasubukan sa device.

## Cold start (hindi bug)
Sa simula, FORCE MANUAL at SV LOCAL ang dalawang loop dahil hindi tumatakbo ang PA / SA fan (M.3302 / M.3303 = 0 -> NOT). Pag-set ng fan running, nawawala; pagkatapos ang operator ang pipili ng AUTO (hindi automatic); REMOTE ay AUTO talaga.

## Status
Beta. Susunod: ABC-011, 012, 019, 003A-E, 030, 052 (kapag naaprubahan o hindi ang F2).

# v1.20.61 (Beta) — pangalan ng mga input (F2), inaprubahan ng user ("go lang")
**Problem:** 126 input na ang tag text (hal. M.3302 PA FAN RUNNING) ay nasa kaliwa ng dulo ng wire ay walang pangalan sa app.
**Work Done:** reader (`pins-params.js`): ang tag na katabi ng KALIWANG LIBRENG dulo ng pahalang na wire (walang ibang dumidikit, at wala pang pangalan ang net) ang nagpapangalan dito. Additive lang: ang mga label na dati nang naka-bind ay hindi ginalaw.
**Nasukat (lahat ng 54 sheet, 60 s pagkatapos ng Reset, bago / pagkatapos):** +169 label; ang mga net na nagbago ng halaga: 4 na net lang sa 4 na sheet, at lahat ay mga signal na nasa drawing pala at dati ay 0 dahil walang pangalan para maikabit sa kabilang sheet: ABC-004A SI0140 (0 -> 5.856, mula ABC-004B/C), ABC-004B / C SI0311 (0 -> 4), ABC-005 SI0144 TOTAL COAL FLOW (0 -> 7.32, mula ABC-004A; nakikita sa PDF ng ABC-005). Cross-sheet links: ABC-004A +2, ABC-005 +1, ABC-009A -2 / ABC-009B +2 (nalipat sa tamang sheet).
**Na-check:** UAT dry run 2458 items, 6808 cases, 0 failing; force_manual 68 / 68; panel_sync 0 fail.
**Hindi pa na-check:** sa device. Hindi ko pa sinuri isa-isa sa PDF ang bawat isa sa 126 pangalan (ginawa ko ang test na nagbibilang ng pagbabago ng halaga, at ang mga nagbago ay tugma sa drawing).
