# v1.20.36 (Beta) - mas mabilis ang pagbukas ng sheet

## Problem
Mabagal ang unang bukas ng mga sheet. Sa profile, ang paglalagay ng live values (`score` / `ov` sa `src/js/analog/13-links-canvas.js`) ay ~4 s ng ~10 s: bawat label ay tinitingnan laban sa LAHAT ng text, block at linya ng sheet.

## As Found
Pagbukas ng 54 sheet: 10.0 s (Chromium headless).

## Work Done
`score()` ay tumitingin na lang sa mga bagay na malapit sa label (grid index). Walang binago sa lohika, sa engine o sa paraan ng pagpili ng posisyon.

## As Left
- Pagbukas ng 54 sheet: 6.9 s (-31%).
- Posisyon ng lahat ng 2657 live-value label sa 54 sheet: **pareho** sa v1.20.35 (byte-for-byte na paghahambing ng x, y at alignment).
- Hindi pa nasusukat sa totoong tablet / apk / exe.

## Status
Beta (pushed branch). Susunod: Excel findings #1, #6, #13 at placement ng live values.
