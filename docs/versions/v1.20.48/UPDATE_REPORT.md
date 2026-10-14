# v1.20.48 (Beta) - OPLAN-L1PAT: ang engine ay hiwalay na sa page at tumatakbo mag-isa

## Problem
Ang reader at engine ng analog ay halo sa UI code sa iisang closure. Hindi ito mailipat sa Worker (para sa smooth na tablet) at hindi masusubok mag-isa.

## As Found (nasukat gamit ang `tools/engine/deps.js`, scope-aware)
Ang reader + engine (54 pangalan) ay umaasa sa 32 pangalan sa labas: ang cross-sheet links (`linksOf`, `stepSet`, ...) na nasa `ui/links-canvas.js`, ang `ensure`, F(X) tables at `anPull` na nasa `data/loader.js`, `wireTag` at `procRemote` na nasa `ui/panel.js`, at ang `window.ANLN` / `window.ANLT` / `document` na direktang binabasa.

## Work Done (galaw lang ng code at hook; walang pagbabago sa logic)
- Bagong `src/analog/engine/sheets.js`: `ensure`, `stnOf`, `shStn`, F(X) tables (`lnTables`, `lnResolve`, `lnFind`, `lnApplyEdits`), `anPull`, `anResetAll` (ang bahagi ng Reset na para sa model).
- Bagong `src/analog/engine/links.js`: links ng sheets, `actSet`, `stepSet`, `stepTier`, `wireTag`, `procRemote`.
- Ang engine ay hindi na direktang bumabasa ng page: ang manual F(X) tables ay `AN.ln` (ang page ang nag-uugnay sa `window.ANLN`), ang raw tables ay `AN.lnSrc()`, ang saved values ay `AN.applySaved` (hook).
- Wala nang ginagamit ang engine sa labas ng object na `AN` at ng mga global ng wika (+ `structuredClone`).

## As Left (nasukat)
- `node tools/engine/deps.js`: ang reader + engine (83 pangalan, 9 file, 212 KB) ay umaasa lang sa `AN`; walang DOM, walang window, walang pangalang walang deklarasyon.
- `node tests/engine/isolated.js`: ang engine mag-isa sa bare Node vm (walang page, walang UI file) ay nagbibigay ng **parehong value sa lahat ng 5128 net ng 54 sheet** gaya ng buong simulator pagkatapos ng 30 s; at ang Reset ng engine ay nagbabalik ng lahat sa start (0 sheet ang naiiba).
- Ang buong simulator, bago (v1.20.46) at pagkatapos (v1.20.48): 54 sheet, 5128 net, **0 ang naiba**.
- `tests/regress/reset.js` (totoong page): 51 sheet, 0 ang naiiba. `panel_sync.js`: 6 sa 6 pasa.
- Natuklasan (hindi pa inaayos): ang simula ng model ng ilang sheet ay bahagyang nakadepende sa pagkakasunod ng pagbuo ng mga sheet (hal. ABC-004A SI0203 3.7017 laban sa 3.6945, ABC-003C FIFA1043C.PV 0 laban sa 0.108). Hindi ito galing sa paghihiwalay; makikita ito sa mismong engine. Inayos ito ng Reset, na sine-settle ang lahat ng sheet sa isang takdang pagkakasunod.

## Status
Beta. Susunod sa OPLAN-L1PAT: ilipat ang engine sa Web Worker (ang UI ay magpapadala ng utos at tatanggap ng mga value), at ang pagkakasunod ng pagbuo ng sheet.
