# v1.20.39 (Beta) - ABC-007 (FICFA1081 / FICFA1071): force manual, SV sa AUTO, plant model

## Problem (report ng user sa ABC-007 sheet 19)
1. Naka-trigger na ang force manual (M.0190) pero napupunta pa rin sa AUTO kapag pinindot ang AUTO.
2. Hindi ma-set ang SV kapag AUTO.
3. PV 0.00 / MV 0.00 sa RUN: ang plant model ay naka-OFF.

## As Found
Tingnan ang `DRAWING_TRACE.md` (basahin muna ang drawing, bago ang code): ang AUTO button ay nag-o-override sa select signal (`plant.js`), ang SV field ay disabled dahil ang SV ay output ng T switch, ang plant model ay default OFF.

## Work Done (maliit na saklaw)
- Engine (`plant.js`, SW/AMT): kapag may aktibong select signal na humihingi ng MANUAL leg, tinatanggihan ang AUTO ng operator at nananatiling manual pagkatapos mawala ang signal. Nagagamit lang kapag ang faceplate ang nagtakda ng mode (`s.al`), kaya hindi nagbabago ang ibang switch.
- Faceplate (`hmi.js`): ang SV field ay nagtatakda ng COS ng SV T at pinipili ang LOCAL (leg B); may REM na bumabalik sa SV ng logic. Ang MV ay naka-disable kapag AUTO. May babala na "FORCE MANUAL (logic)".
- Plant model: default ON (bagong key sa browser; ang lumang OFF ay hindi na sinusunod).

## As Left
- Bagong test `tests/regress/force_manual.js`: sa 60 controller na may A/M station: 59 pass, 1 fail (ABC-052 TICHR1012: hindi pa nasuri ang dahilan), 8 hindi nasubukan (walang A/M station). Para sa ABC-007: pass (FICFA1081 at FICFA1071).
- `faceplate.js`: pass (54 tamang A/M, 0 mali). `pid_am.js`: walang bagsak na nakita sa dulo ng output.
- Hindi nasubukan: totoong tablet / apk / exe; ang SV tracking ng M.019D ("SET SI0179 => SV"); ang 50 COS na hindi nakakabit sa T switch (hindi nakilala ng reader).

## Status
Beta. Hindi ginalaw ang SCALE CONVERT (F-7, ×1 sa real values) at ang SUB/DEV signs (sinuri sa ABC-005: tugma sa drawing, + sa ibaba, - sa kanan).
