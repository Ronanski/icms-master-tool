# v1.20.46 (Beta) - operator panel na sync sa switching signals ng drawing

## Problem
Ang MANUAL / AUTO / FORCE MANUAL sa operator panel ay dapat sync sa mga signal sa logic diagram (user).

## As Found (basa sa drawing at sa model)
- Sa 68 controller: lahat ay may select signals ng A/M switch (1:A = papuntang AUTO, 1:B = papuntang MANUAL / force manual). 25 ang may mode inputs na `TAG.MAN / .LOC / .REM` (external digital input, HMI push button).
- Ang panel ay hindi nagpapakita ng mga signal na ito; ang force manual ay hindi nakikita hangga't hindi pinipindot ang AUTO.

## Work Done (`src/ui/hmi/hmi.js`, panel lang)
- Bawat faceplate ay may mga chip ng switching signals ng drawing: pangalan, papel (MAN / AUTO) at live 0 / 1 (pula kapag force manual = 1). Ang tooltip ay nagpapakita ng pinanggalingan (hal. M.0190 <- M.0098 = 0, M.0198 = 1, M.019F = 0).
- Ang mode inputs (`.MAN .LOC .REM`) ay mga button na sumusulat sa PAREHONG signal ng diagram.
- FORCE MANUAL (signal = 1): may babala na may pangalan ng signal, naka-disable ang AUTO. Kapag nawala ang signal, AUTO ulit nang kusa; AUTO / MAN ay sumusunod sa pinili ng logic.
- Hindi ginalaw ang engine para dito.

## As Left (nasubukan sa totoong DOM, headless Chromium: `tests/regress/panel_sync.js`)
- ABC-007 FICFA1081 at ABC-003A FICFA1043A: 6 sa 6 pasa (signal 0: AUTO available; pinindot ang AUTO: AUTO; signal 1: MAN at AUTO disabled; signal 0: AUTO ulit nang kusa).
- Sa simula ng ABC-007, M.0190 = 1 na mismo ng logic (M.0198 = 1: ayon sa drawing, force manual kapag may bad signal / hindi tumatakbo ang fan), kaya hindi puwedeng AUTO hanggang ma-clear ang dahilan. Ito ay tama ayon sa drawing.
- Hindi nasubukan: tablet; ang ibang controller sa panel test (dalawa lang ang sinubukan).

## Status
Beta.
